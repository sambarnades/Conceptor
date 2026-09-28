/**
 * parity-export-harness.mjs — Banc de PARITÉ d'export documentaire Caramel↔Sucrerie (PHASE 3).
 *
 * QUESTION : pour une MÊME activité, l'export DOCX/ODT depuis CARAMEL (entrée = JSON source
 * pré-processor, `originalJsonData`) est-il IDENTIQUE à celui depuis SUCRERIE (entrée =
 * content.json post-processor pour H5P, ou XML reparsé pour Moodle) ?
 *
 * Fait établi (vérifié `diff -q`) : le moteur d'export (document-exporter + document-formatter
 * + helpers latex/sanitizer/math-catalog) est BYTE-IDENTIQUE entre les deux dépôts. La SEULE
 * variable est l'INPUT. Ce banc le mesure EMPIRIQUEMENT dans un vrai Chromium.
 *
 * Lancement :  cd tests/roundtrip && node parity-export-harness.mjs
 * Options   :  --only=Timeline,Flashcards   (filtre par moduleKey)
 *              --quiet
 *              --skip-c2                     (ne fait que C1)
 *              --c1-rep-only                 (C1 sur 1 fixture/type au lieu de toutes)
 *
 * C1 (Screen, intra-Caramel, TOUS types, rapide) :
 *   docxA = exportSourceDoc(fixture)         (voie Caramel : source input)
 *   docxB = exportProcessedDoc(healed fix.)  (proxy « processed input » = content.json brut)
 *   Compare canon(docxA) vs canon(docxB), idem ODT. Pour Moodle, le proxy « processed » est
 *   l'export depuis la même source (Caramel ne re-parse pas) → C1 Moodle compare A vs A
 *   (toujours identique par construction) ; on s'appuie sur C2 pour la VRAIE parité Moodle.
 *
 * C2 (Faithful, vraie chaîne binaire→modèle de Sucrerie, copiée VERBATIM) :
 *   docxA       = exportSourceDoc(fixture)               (voie Caramel : source)
 *   docxB_real  = exportSucrerie{H5p,Mbz,Xml}Doc(blob)   (.h5p/.mbz/.xml Caramel → normalize/parse Sucrerie → formatter)
 *   Compare canoniquement. 1 fixture représentative / type + tout type signalé en C1.
 *
 * CANONICALISATION DOCX/ODT : zip → scrub des dates embarquées (docProps/core.xml,
 * meta.xml) → hash par fichier. + extraction du TEXTE principal (word/document.xml /
 * content.xml) normalisé → diff de segments pour localiser la 1ʳᵉ différence concrète.
 *
 * RÉSEAU : bloc d'allow-list localhost réutilisé (rien ne touche la prod).
 */

import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

import { listFixtures } from './fixtures-map.mjs';
import { ensureJSZip } from './bootstrap.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;
const HARNESS_URL = `${BASE_URL}/tests/roundtrip/browser-harness.html`;
const REPORT_PATH = resolve(__dirname, 'report-phase3-parity.json');

const SEED = 0x9e3779b9;
const FROZEN_EPOCH = Date.UTC(2026, 5, 16, 12, 0, 0);

const argv = process.argv.slice(2);
const getArg = (n) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : null; };
const QUIET = argv.includes('--quiet');
const SKIP_C2 = argv.includes('--skip-c2');
const C1_REP_ONLY = argv.includes('--c1-rep-only');
const ONLY = (getArg('only') || '').split(',').filter(Boolean);

function log(...a) { console.log(...a); }
function vlog(...a) { if (!QUIET) console.log(...a); }
function section(t) { log('\n' + '='.repeat(80) + '\n' + t + '\n' + '='.repeat(80)); }

// Même seeding que playwright-harness.mjs (déterminisme par-export, Date figée).
const INIT_SCRIPT = `
(() => {
  const SEED = ${SEED}; const FROZEN_EPOCH = ${FROZEN_EPOCH};
  let _s = SEED >>> 0;
  function mulberry32(){ _s|=0; _s=(_s+0x6d2b79f5)|0; let t=Math.imul(_s^(_s>>>15),1|_s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }
  Math.random = mulberry32;
  window.__reseed = (seed) => { _s = ((seed === undefined ? SEED : seed) >>> 0); };
  const _RD = Date;
  function FD(...a){ if(!(this instanceof FD)) return new _RD(FROZEN_EPOCH).toString(); if(a.length===0) return new _RD(FROZEN_EPOCH); return new _RD(...a); }
  FD.prototype = _RD.prototype; FD.now = () => FROZEN_EPOCH; FD.parse = _RD.parse; FD.UTC = _RD.UTC;
  window.Date = FD;
})();
`;

// ===========================================================================
// Serveur statique
// ===========================================================================
function startServer() {
  return new Promise((res, rej) => {
    const srv = spawn('python3', ['tests/serveur-statique.py', String(PORT)], { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let settled = false;
    srv.stderr.on('data', () => {});
    srv.on('error', (e) => { if (!settled) { settled = true; rej(e); } });
    const started = Date.now();
    const poll = async () => {
      try { const r = await fetch(HARNESS_URL, { method: 'HEAD' }); if (r.ok || r.status === 200) { settled = true; res(srv); return; } } catch {}
      if (Date.now() - started > 15000) { settled = true; rej(new Error('serveur statique non démarré (15s)')); return; }
      setTimeout(poll, 200);
    };
    poll();
  });
}

// ===========================================================================
// Canonicalisation DOCX/ODT (zip) + scrub dates + extraction texte principal.
// ===========================================================================
function sha256Bytes(b) { return createHash('sha256').update(b).digest('hex'); }
function b64ToBytes(b64) { return new Uint8Array(Buffer.from(b64, 'base64')); }

function scrubDocXml(text) {
  return text
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, '<DATE>')
    .replace(/(<dcterms:created[^>]*>)[^<]*(<\/dcterms:created>)/gi, '$1<DATE>$2')
    .replace(/(<dcterms:modified[^>]*>)[^<]*(<\/dcterms:modified>)/gi, '$1<DATE>$2')
    .replace(/(<meta:creation-date>)[^<]*(<\/meta:creation-date>)/gi, '$1<DATE>$2')
    .replace(/(<dc:date>)[^<]*(<\/dc:date>)/gi, '$1<DATE>$2')
    .replace(/(<meta:editing-duration>)[^<]*(<\/meta:editing-duration>)/gi, '$1<DUR>$2');
}

/** Canonicalise un blob docx/odt (zip) → { totalSha256, files:[{name,canonSha256,canonSize}] }. */
async function canonZipDoc(bytes) {
  const JSZip = await ensureJSZip();
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).filter(n => !zip.files[n].dir).sort();
  const files = [];
  const total = createHash('sha256');
  for (const name of names) {
    const data = await zip.files[name].async('uint8array');
    let canonBytes = data;
    if (/\.(xml|rels|txt)$/i.test(name) || name === 'mimetype' || name.endsWith('.json')) {
      canonBytes = new TextEncoder().encode(scrubDocXml(new TextDecoder().decode(data)));
    }
    const h = sha256Bytes(canonBytes);
    files.push({ name, canonSize: canonBytes.length, canonSha256: h });
    total.update(name); total.update('\0'); total.update(h); total.update('\n');
  }
  return { totalSha256: total.digest('hex'), files };
}

/**
 * Extrait le TEXTE VISIBLE d'un document, en segments, pour localiser la 1ʳᵉ
 * différence concrète quand deux exports diffèrent.
 *   - DOCX : word/document.xml → texte des <w:t> + math des <m:t> (OMML), groupés
 *            par paragraphe <w:p>. Le markup gras/italique vit dans les <w:rPr> :
 *            on capture aussi un drapeau bold/italic par run pour révéler un
 *            « **bold** vs bold ».
 *   - ODT  : content.xml → texte des <text:p>/<text:span> + math des <math> ; on
 *            détecte le style via les <style:text-properties fo:font-weight>.
 * On renvoie une liste de lignes « [b][i] texte » (drapeaux si présents).
 */
async function extractDocText(bytes, kind) {
  const JSZip = await ensureJSZip();
  const zip = await JSZip.loadAsync(bytes);
  if (kind === 'docx') {
    const f = zip.files['word/document.xml'];
    if (!f) return ['<pas de word/document.xml>'];
    const xml = await f.async('string');
    return docxParagraphs(xml);
  } else {
    const f = zip.files['content.xml'];
    if (!f) return ['<pas de content.xml>'];
    const xml = await f.async('string');
    return odtParagraphs(xml);
  }
}

/** DOCX : découpe par <w:p>, concatène <w:t>/<m:t>, marque bold/italic des runs. */
function docxParagraphs(xml) {
  const lines = [];
  const paras = xml.split(/<w:p[\s>]/).slice(1); // chaque morceau = un paragraphe (approx, suffisant pour diff)
  for (const p of paras) {
    const runs = p.split(/<w:r[\s>]/).slice(1);
    let buf = '';
    for (const r of runs) {
      const bold = /<w:b\b\s*\/?>/.test(r) && !/<w:b\b[^>]*w:val="(?:0|false)"/.test(r);
      const ital = /<w:i\b\s*\/?>/.test(r) && !/<w:i\b[^>]*w:val="(?:0|false)"/.test(r);
      const texts = [...r.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m => decodeXmlEntities(m[1]));
      const maths = [...r.matchAll(/<m:t(?:\s[^>]*)?>([\s\S]*?)<\/m:t>/g)].map(m => '⟦' + decodeXmlEntities(m[1]) + '⟧');
      const seg = (texts.join('') + maths.join(''));
      if (seg) buf += (bold ? '**' : '') + (ital ? '_' : '') + seg + (ital ? '_' : '') + (bold ? '**' : '');
    }
    // math OMML hors run (m:oMath direct) : capturer aussi
    const standaloneMath = [...p.matchAll(/<m:t(?:\s[^>]*)?>([\s\S]*?)<\/m:t>/g)].map(m => decodeXmlEntities(m[1]));
    if (!buf && standaloneMath.length) buf = '⟦' + standaloneMath.join('') + '⟧';
    if (buf.trim()) lines.push(buf.trim());
  }
  return lines.length ? lines : ['<vide>'];
}

/** ODT : découpe par <text:p>/<text:h>, concatène le texte ; marque les styles bold. */
function odtParagraphs(xml) {
  const lines = [];
  // styles bold/italic référencés par nom (table de correspondance approximative)
  const boldStyles = new Set([...xml.matchAll(/<style:style[^>]*style:name="([^"]+)"[^>]*>[\s\S]*?fo:font-weight="bold"[\s\S]*?<\/style:style>/g)].map(m => m[1]));
  const italStyles = new Set([...xml.matchAll(/<style:style[^>]*style:name="([^"]+)"[^>]*>[\s\S]*?fo:font-style="italic"[\s\S]*?<\/style:style>/g)].map(m => m[1]));
  const paraRe = /<text:(p|h)(?:\s[^>]*)?>([\s\S]*?)<\/text:\1>/g;
  let m;
  while ((m = paraRe.exec(xml)) !== null) {
    let inner = m[2];
    let buf = '';
    // remplacer les spans par leur texte + drapeau de style
    inner = inner.replace(/<text:span\s+text:style-name="([^"]+)"[^>]*>([\s\S]*?)<\/text:span>/g, (_s, st, txt) => {
      const t = stripTags(txt);
      const b = boldStyles.has(st), i = italStyles.has(st);
      return (b ? '**' : '') + (i ? '_' : '') + t + (i ? '_' : '') + (b ? '**' : '');
    });
    // math ODF : <math ...>...</math> → marqueur (le contenu MathML est volumineux ; on note sa présence + 1er identifiant)
    inner = inner.replace(/<math[\s\S]*?<\/math>/gi, (s) => {
      const ids = [...s.matchAll(/<mi>([\s\S]*?)<\/mi>|<mo>([\s\S]*?)<\/mo>|<mn>([\s\S]*?)<\/mn>/g)].map(x => decodeXmlEntities(x[1] || x[2] || x[3] || '')).join('');
      return '⟦' + ids + '⟧';
    });
    buf = decodeXmlEntities(stripTags(inner)).trim();
    if (buf) lines.push(buf);
  }
  return lines.length ? lines : ['<vide>'];
}

function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }
function decodeXmlEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, '\n').replace(/&amp;/g, '&');
}

/**
 * Toutes les différences de texte visible entre deux listes de lignes (alignées par index).
 * Renvoie { count, first, all:[{atLine,a,b}], titleOnly } où `titleOnly` indique que la
 * SEULE différence est le titre de l'activité — utile pour distinguer un écart purement de
 * chrome/titre d'une vraie divergence de contenu pédagogique.
 * STRUCTURE COMMUNE d'un export : ligne 0 = en-tête doc ("Caramel - Ressource…"), ligne 1 =
 * "Date de génération…", ligne 2 = TITRE de l'activité (`header level:1` poussé en 1ᵉʳ par
 * chaque formatter). Donc une diff confinée aux 3 premières lignes = « titre/chrome ».
 */
function diffTextLines(linesA, linesB) {
  const n = Math.max(linesA.length, linesB.length);
  const all = [];
  for (let i = 0; i < n; i++) {
    const a = linesA[i], b = linesB[i];
    if (a !== b) {
      all.push({ atLine: i, a: a === undefined ? '<absent>' : trunc(a, 240), b: b === undefined ? '<absent>' : trunc(b, 240) });
    }
  }
  if (!all.length) return null;
  // ≤ index 2 = préambule doc (en-tête + date + titre activité). Une diff unique dans cette
  // zone = écart de TITRE/chrome, pas de contenu pédagogique.
  const titleOnly = all.length === 1 && all[0].atLine <= 2;
  return { count: all.length, first: all[0], all: all.slice(0, 8), titleOnly };
}
function trunc(s, n = 200) { s = String(s); return s.length > n ? s.slice(0, n) + `…(+${s.length - n})` : s; }

// ===========================================================================
// Contrôleur browser (timeout Node-side + recréation page).
// ===========================================================================
const CTX = { context: null, page: null, errors: [], recreations: 0 };
const EVAL_TIMEOUT_MS = 60000;

async function createPage() {
  const page = await CTX.context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') CTX.errors.push(m.text()); });
  page.on('pageerror', (e) => CTX.errors.push('pageerror: ' + e.message));
  await page.goto(HARNESS_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__harnessReady === true || window.__harnessBootError, { timeout: 60000 });
  const bootError = await page.evaluate(() => window.__harnessBootError || null);
  if (bootError) throw new Error('boot page échoué: ' + bootError);
  return page;
}
async function resetPage(reason = '') {
  try { if (CTX.page) await CTX.page.close(); } catch {}
  CTX.page = await createPage(); CTX.recreations++;
  if (reason) vlog(`[ctx] page recréée (${reason})`);
}
async function safeEval(fn, arg, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('__TIMEOUT__')), EVAL_TIMEOUT_MS); });
  try {
    const r = await Promise.race([CTX.page.evaluate(fn, arg), to]);
    clearTimeout(timer); return r;
  } catch (e) {
    clearTimeout(timer);
    const isTo = (e.message || '').includes('__TIMEOUT__') || (e.message || '').includes('Target closed') || (e.message || '').includes('crash');
    try { await resetPage(`après ${isTo ? 'TIMEOUT' : 'erreur'} sur ${label}`); } catch {}
    return { ok: false, error: isTo ? `page-timeout sur ${label}` : ('eval: ' + e.message) };
  }
}

// Appels browser (re-seed avant chaque export pour déterminisme).
async function callSourceDoc(moduleKey, fixtureObj, format) {
  return safeEval(async ({ moduleKey, fixtureObj, format }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportSourceDoc(moduleKey, fixtureObj, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack || '').slice(0, 400) }; }
  }, { moduleKey, fixtureObj, format }, `sourceDoc:${moduleKey}:${format}`);
}
async function callProcessedDoc(moduleKey, fixtureObj, format) {
  return safeEval(async ({ moduleKey, fixtureObj, format }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportProcessedDoc(moduleKey, fixtureObj, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack || '').slice(0, 400) }; }
  }, { moduleKey, fixtureObj, format }, `processedDoc:${moduleKey}:${format}`);
}
async function callExportH5P(moduleKey, fixtureObj) {
  return safeEval(async ({ moduleKey, fixtureObj }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportH5P(moduleKey, fixtureObj)) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, { moduleKey, fixtureObj }, `exportH5P:${moduleKey}`);
}
async function callExportMoodle(moduleKey, jsonStr) {
  return safeEval(async ({ moduleKey, jsonStr }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportMoodle(moduleKey, jsonStr)) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, { moduleKey, jsonStr }, `exportMoodle:${moduleKey}`);
}
async function callSucrerieH5pDoc(h5pBase64, format) {
  return safeEval(async ({ h5pBase64, format }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportSucrerieH5pDoc(h5pBase64, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack || '').slice(0, 400) }; }
  }, { h5pBase64, format }, `sucrerieH5p:${format}`);
}
async function callSucrerieMbzDoc(mbzBase64, format) {
  return safeEval(async ({ mbzBase64, format }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportSucrerieMbzDoc(mbzBase64, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack || '').slice(0, 400) }; }
  }, { mbzBase64, format }, `sucrerieMbz:${format}`);
}
async function callSucrerieXmlDoc(xmlBase64, format) {
  return safeEval(async ({ xmlBase64, format }) => {
    if (window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportSucrerieXmlDoc(xmlBase64, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack || '').slice(0, 400) }; }
  }, { xmlBase64, format }, `sucrerieXml:${format}`);
}

// Parse défensif d'une fixture (JSON, sinon healJsonString via sous-import Node).
let _healerMod = null;
async function getHealer() { if (!_healerMod) _healerMod = await import('../../js/h5p/json-healer.js'); return _healerMod; }
async function loadFixtureObj(fx) {
  const raw = await readFile(fx.path, 'utf8');
  try { return { obj: JSON.parse(raw), raw }; }
  catch {
    try { const h = await getHealer(); return { obj: JSON.parse(h.healJsonString(raw)), raw, healed: true }; }
    catch (e2) { return { obj: null, raw, parseError: e2.message }; }
  }
}

/** Compare deux exports (base64) : canon + diff texte. Renvoie un verdict détaillé. */
async function compareDocs(aB64, bB64, kind) {
  const aBytes = b64ToBytes(aB64), bBytes = b64ToBytes(bB64);
  const [ca, cb] = await Promise.all([canonZipDoc(aBytes), canonZipDoc(bBytes)]);
  if (ca.totalSha256 === cb.totalSha256) {
    return { verdict: 'byte-identical', canonSha: ca.totalSha256 };
  }
  // bytes diffèrent : le texte visible est-il identique ?
  const [ta, tb] = await Promise.all([extractDocText(aBytes, kind), extractDocText(bBytes, kind)]);
  const td = diffTextLines(ta, tb);
  // fichiers internes divergents (hors texte)
  const mb = new Map(cb.files.map(f => [f.name, f.canonSha256]));
  const diffFiles = ca.files.filter(f => mb.get(f.name) !== f.canonSha256).map(f => f.name);
  if (!td) {
    return { verdict: 'content-identical-different-bytes', diffFiles, note: 'texte visible identique ; écart = markup/structure interne (styles, ordre attributs, espaces)', shaA: ca.totalSha256, shaB: cb.totalSha256 };
  }
  // Divergence confinée au titre/en-tête (lignes 0-2) → classer à part (chrome, pas contenu).
  if (td.titleOnly) {
    return { verdict: 'divergent-title-only', diffFiles, firstDiff: td.first, diffCount: td.count, diffs: td.all, linesA: ta.length, linesB: tb.length, shaA: ca.totalSha256, shaB: cb.totalSha256 };
  }
  // Analyse d'ENSEMBLE : les deux documents contiennent-ils le MÊME ensemble de lignes
  // (à la casse/espaces normalisés près) — i.e. divergence = simple RÉORDONNANCEMENT ou
  // DÉCALAGE (contenu préservé) — ou des lignes sont-elles vraiment perdues/changées ?
  const setOverlap = lineSetOverlap(ta, tb);
  const verdict = setOverlap.sameSet ? 'divergent-reordered' : 'divergent';
  return { verdict, diffFiles, firstDiff: td.first, diffCount: td.count, diffs: td.all, linesA: ta.length, linesB: tb.length, setOverlap, shaA: ca.totalSha256, shaB: cb.totalSha256 };
}

/**
 * Compare les ENSEMBLES de lignes (normalisées : espaces compactés, casse conservée).
 * Renvoie { sameSet, onlyInA:[...], onlyInB:[...] }. sameSet=true ⇒ même contenu, ordre
 * (ou décalage d'intro) différent seulement — distingue « réordonné » de « contenu perdu ».
 */
function lineSetOverlap(linesA, linesB) {
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const ma = new Map(), mb = new Map();
  for (const l of linesA) { const k = norm(l); if (k) ma.set(k, (ma.get(k) || 0) + 1); }
  for (const l of linesB) { const k = norm(l); if (k) mb.set(k, (mb.get(k) || 0) + 1); }
  const onlyInA = [], onlyInB = [];
  for (const [k, n] of ma) { const d = n - (mb.get(k) || 0); if (d > 0) onlyInA.push(trunc(k, 120)); }
  for (const [k, n] of mb) { const d = n - (ma.get(k) || 0); if (d > 0) onlyInB.push(trunc(k, 120)); }
  return { sameSet: onlyInA.length === 0 && onlyInB.length === 0, onlyInA: onlyInA.slice(0, 6), onlyInB: onlyInB.slice(0, 6), onlyInACount: onlyInA.length, onlyInBCount: onlyInB.length };
}

// ===========================================================================
// C1 — Screen intra-Caramel (source-input vs processed-input proxy), TOUS types.
// ===========================================================================
async function runC1(h5pFixtures, moodleFixtures, report) {
  section('C1 — Screen intra-Caramel : SOURCE-input vs PROCESSED-input (proxy), DOCX + ODT');

  // Sélection : toutes les fixtures, ou 1/type si --c1-rep-only.
  let h5p = h5pFixtures, moodle = moodleFixtures;
  if (C1_REP_ONLY) {
    const pick = (arr) => { const seen = new Set(), out = []; for (const f of arr) if (!seen.has(f.moduleKey)) { seen.add(f.moduleKey); out.push(f); } return out; };
    h5p = pick(h5pFixtures); moodle = pick(moodleFixtures);
  }
  log(`[C1] ${h5p.length} fixtures H5P + ${moodle.length} Moodle`);

  const results = [];

  // --- H5P : A = source ; B = processed content.json (proxy Sucrerie) ---
  for (const fx of h5p) {
    const { obj } = await loadFixtureObj(fx);
    const row = { file: fx.file, moduleKey: fx.moduleKey, kind: 'h5p', docx: null, odt: null };
    if (!obj) { row.error = 'parse fixture impossible'; results.push(row); continue; }
    for (const fmt of ['docx', 'odt']) {
      const a = await callSourceDoc(fx.moduleKey, obj, fmt);
      const b = await callProcessedDoc(fx.moduleKey, obj, fmt);
      if (!a.ok || !b.ok) { row[fmt] = { verdict: 'error', error: a.error || b.error }; continue; }
      row[fmt] = await compareDocs(a.base64, b.base64, fmt);
      row[`${fmt}_sizeA`] = a.size; row[`${fmt}_sizeB`] = b.size;
    }
    results.push(row);
    logRowC1(row);
  }

  // --- Moodle : pas de re-parse côté Caramel → proxy « processed » = source.
  //     On exporte juste A (source) en DOCX/ODT pour vérifier que ça PASSE, et on
  //     note que la VRAIE parité Moodle est mesurée en C2 (Sucrerie reparse le XML). ---
  for (const fx of moodle) {
    const { obj } = await loadFixtureObj(fx);
    const row = { file: fx.file, moduleKey: fx.moduleKey, kind: 'moodle', docx: null, odt: null, note: 'Caramel ne reparse pas le Moodle → parité réelle en C2' };
    if (!obj) { row.error = 'parse fixture impossible'; results.push(row); continue; }
    for (const fmt of ['docx', 'odt']) {
      const a = await callSourceDoc(fx.moduleKey, obj, fmt);
      row[fmt] = a.ok ? { verdict: 'source-export-ok', sha: (await canonZipDoc(b64ToBytes(a.base64))).totalSha256.slice(0, 16), size: a.size } : { verdict: 'error', error: a.error };
    }
    results.push(row);
    vlog(`[C1] ${fx.moduleKey.padEnd(16)} ${fx.file.padEnd(30)} (Moodle, voir C2) docx=${row.docx?.verdict} odt=${row.odt?.verdict}`);
  }

  // Types H5P signalés (au moins un format != byte-identical)
  const flagged = results.filter(r => r.kind === 'h5p' && ((r.docx && r.docx.verdict !== 'byte-identical') || (r.odt && r.odt.verdict !== 'byte-identical')));
  report.C1 = {
    comparedH5p: results.filter(r => r.kind === 'h5p').length,
    moodleExported: results.filter(r => r.kind === 'moodle').length,
    flaggedTypes: [...new Set(flagged.map(r => r.moduleKey))],
    results
  };
  log(`[C1] H5P : ${report.C1.comparedH5p} comparés. Types signalés (source≠processed) : ${report.C1.flaggedTypes.join(', ') || 'AUCUN'}`);
  return report.C1.flaggedTypes;
}

function verdictLabel(c) {
  if (!c) return '—';
  switch (c.verdict) {
    case 'byte-identical': return 'identique';
    case 'content-identical-different-bytes': return 'contenu=,octets≠';
    case 'divergent-title-only': return 'DIVERGE(titre seul)';
    case 'divergent-reordered': return 'DIVERGE(réordonné, contenu=)';
    case 'divergent': return 'DIVERGE(contenu≠)';
    case 'error': return 'ERR:' + (c.error || '').slice(0, 30);
    case 'source-export-ok': return 'export-ok';
    default: return c.verdict;
  }
}
const isDivergent = (v) => v === 'divergent' || v === 'divergent-title-only' || v === 'divergent-reordered';
function logRowC1(row) {
  vlog(`[C1] ${row.moduleKey.padEnd(16)} ${row.file.padEnd(30)} docx=${verdictLabel(row.docx)} odt=${verdictLabel(row.odt)}`);
  for (const fmt of ['docx', 'odt']) {
    const c = row[fmt];
    if (c && isDivergent(c.verdict) && c.firstDiff) {
      vlog(`        ${fmt} 1ʳᵉ diff @ligne ${c.firstDiff.atLine} (${c.diffCount} ligne(s) diff.):`);
      vlog(`           A(source)   : ${c.firstDiff.a}`);
      vlog(`           B(processed): ${c.firstDiff.b}`);
    }
  }
}

// ===========================================================================
// C2 — Faithful : vraie chaîne binaire→modèle Sucrerie (copiée verbatim).
// ===========================================================================
async function runC2(h5pFixtures, moodleFixtures, report, flaggedTypes) {
  section('C2 — Faithful : Caramel(source) vs SUCRERIE(réel binaire→modèle), DOCX + ODT');

  // 1 fixture représentative par type + tout type signalé en C1.
  const pickRep = (arr) => { const seen = new Set(), out = []; for (const f of arr) if (!seen.has(f.moduleKey)) { seen.add(f.moduleKey); out.push(f); } return out; };
  const repH5p = pickRep(h5pFixtures);
  const repMoodle = pickRep(moodleFixtures);
  // garantir la présence des types signalés (ils le sont déjà via 1/type, mais on log l'intention)
  log(`[C2] H5P repr. : ${repH5p.map(f => f.moduleKey).join(', ')}`);
  log(`[C2] Moodle repr. : ${repMoodle.map(f => f.moduleKey).join(', ')}`);
  if (flaggedTypes.length) log(`[C2] (types signalés C1 inclus : ${flaggedTypes.join(', ')})`);

  const results = [];

  // --- H5P : A = source ; B_real = .h5p Caramel → normalizeH5pModel → formatter ---
  for (const fx of repH5p) {
    const { obj } = await loadFixtureObj(fx);
    const row = { file: fx.file, moduleKey: fx.moduleKey, kind: 'h5p', docx: null, odt: null };
    if (!obj) { row.error = 'parse fixture impossible'; results.push(row); continue; }
    // produire le .h5p réel une fois
    const h5p = await callExportH5P(fx.moduleKey, obj);
    if (!h5p.ok) { row.error = 'export .h5p: ' + h5p.error; results.push(row); logRowC2(row); continue; }
    for (const fmt of ['docx', 'odt']) {
      const a = await callSourceDoc(fx.moduleKey, obj, fmt);
      const b = await callSucrerieH5pDoc(h5p.base64, fmt);
      if (!a.ok || !b.ok) { row[fmt] = { verdict: 'error', error: a.error || b.error }; continue; }
      row[fmt] = await compareDocs(a.base64, b.base64, fmt);
      row.sucrerieModuleKey = b.moduleKey;
    }
    results.push(row);
    logRowC2(row);
  }

  // --- Moodle : A = source ; B_real = .mbz/.xml Caramel → parseActivity/parseStandaloneXml → formatter ---
  for (const fx of repMoodle) {
    const { obj, raw } = await loadFixtureObj(fx);
    const isXml = (fx.moduleKey === 'glossaireXml' || fx.moduleKey === 'test_elea');
    const row = { file: fx.file, moduleKey: fx.moduleKey, kind: isXml ? 'xml' : 'mbz', docx: null, odt: null };
    if (!obj) { row.error = 'parse fixture impossible'; results.push(row); continue; }
    // produire le .mbz/.xml réel via le handler Caramel (capture generation:complete)
    const archive = await callExportMoodle(fx.moduleKey, raw);
    if (!archive.ok) { row.error = 'export archive: ' + archive.error; results.push(row); logRowC2(row); continue; }
    for (const fmt of ['docx', 'odt']) {
      const a = await callSourceDoc(fx.moduleKey, obj, fmt);
      const b = isXml ? await callSucrerieXmlDoc(archive.base64, fmt) : await callSucrerieMbzDoc(archive.base64, fmt);
      if (!a.ok || !b.ok) { row[fmt] = { verdict: 'error', error: a.error || b.error }; continue; }
      row[fmt] = await compareDocs(a.base64, b.base64, fmt);
      row.sucrerieModuleKey = b.moduleKey;
    }
    results.push(row);
    logRowC2(row);
  }

  report.C2 = {
    tested: results.length,
    byteIdentical: tally(results, 'byte-identical'),
    contentIdentical: tally(results, 'content-identical-different-bytes'),
    divergentTitleOnly: tally(results, 'divergent-title-only'),
    divergentReordered: tally(results, 'divergent-reordered'),
    divergent: tally(results, 'divergent'),
    errors: tally(results, 'error'),
    perType: results.map(r => ({ moduleKey: r.moduleKey, file: r.file, verdict: worstVerdict(r), docx: r.docx?.verdict, odt: r.odt?.verdict, error: r.error || null })),
    results
  };
  log(`[C2] ${results.length} types testés.`);
}

/** Verdict GLOBAL d'un type = le pire des deux formats. */
function worstVerdict(r) {
  const v = [r.docx?.verdict, r.odt?.verdict].filter(Boolean);
  if (r.error || v.includes('error')) return 'error';
  if (v.includes('divergent')) return 'divergent';
  if (v.includes('divergent-reordered')) return 'divergent-reordered';
  if (v.includes('divergent-title-only')) return 'divergent-title-only';
  if (v.includes('content-identical-different-bytes')) return 'content-identical-different-bytes';
  if (v.length && v.every(x => x === 'byte-identical')) return 'byte-identical';
  return 'mixed';
}
function tally(results, verdict) {
  return results.filter(r => worstVerdict(r) === verdict).length;
}

function logRowC2(row) {
  log(`[C2] ${row.moduleKey.padEnd(16)} ${(row.file||'').padEnd(30)} docx=${verdictLabel(row.docx)} odt=${verdictLabel(row.odt)}${row.error ? ' ' + row.error : ''}`);
  for (const fmt of ['docx', 'odt']) {
    const c = row[fmt];
    if (c && isDivergent(c.verdict) && c.firstDiff) {
      const tag = c.verdict === 'divergent-title-only' ? ', TITRE seul' : c.verdict === 'divergent-reordered' ? ', RÉORDONNÉ (même contenu)' : '';
      log(`        ${fmt} 1ʳᵉ diff @ligne ${c.firstDiff.atLine} (${c.diffCount} ligne(s) diff.${tag}):`);
      log(`           A(Caramel source)  : ${c.firstDiff.a}`);
      log(`           B(Sucrerie réel)   : ${c.firstDiff.b}`);
      if (c.verdict === 'divergent' && c.setOverlap) {
        if (c.setOverlap.onlyInACount) log(`           seult dans A (${c.setOverlap.onlyInACount}): ${(c.setOverlap.onlyInA || []).join(' | ')}`);
        if (c.setOverlap.onlyInBCount) log(`           seult dans B (${c.setOverlap.onlyInBCount}): ${(c.setOverlap.onlyInB || []).join(' | ')}`);
      }
    } else if (c && c.verdict === 'content-identical-different-bytes') {
      log(`        ${fmt} contenu identique, octets ≠ (fichiers : ${(c.diffFiles || []).join(', ')})`);
    }
  }
}

// ===========================================================================
// MAIN
// ===========================================================================
let server, browser;
async function main() {
  log("Caramel — Banc de PARITÉ d'export documentaire Caramel↔Sucrerie (PHASE 3)");
  log('Node', process.version, '| epoch figée 2026-06-16T12:00:00Z | RNG mulberry32 seedé');

  let all = await listFixtures('all');
  let h5pFixtures = all.filter(f => f.kind === 'h5p');
  let moodleFixtures = all.filter(f => f.kind === 'moodle');
  if (ONLY.length) {
    h5pFixtures = h5pFixtures.filter(f => ONLY.includes(f.moduleKey));
    moodleFixtures = moodleFixtures.filter(f => ONLY.includes(f.moduleKey));
  }
  log(`Fixtures : ${h5pFixtures.length} H5P, ${moodleFixtures.length} Moodle` + (ONLY.length ? ` (filtre: ${ONLY.join(',')})` : ''));

  server = await startServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(INIT_SCRIPT);

  // Allow-list localhost (réutilisé verbatim de playwright-harness.mjs) : rien ne touche la prod.
  await context.route('**/*', (route) => {
    const url = route.request().url();
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url) || /^(data|blob|about):/i.test(url);
    return isLocal ? route.continue() : route.abort();
  });

  CTX.context = context;
  CTX.page = await createPage();

  const meta = await CTX.page.evaluate(() => window.HARNESS.meta);
  log(`[setup] Harness prêt. lang=${meta.currentLang}, DOMPurify=${meta.domPurifyReady} (v${meta.dompurifyVersion})`);
  if (!meta.domPurifyReady) log('[setup] ⚠ DOMPurify NON préchargé → sanitization en fallback. Résultats non fidèles.');

  const report = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    chromium: await browser.version(),
    domPurify: { ready: meta.domPurifyReady, version: meta.dompurifyVersion },
    exportCodeByteIdentical: true, // vérifié hors-ligne (diff -q) — documenté dans le rapport texte
    approachC2: 'copy-verbatim',
    c2Caveat: "doc-chrome (doc_fmt_header_title/footer) tenu IDENTIQUE des 2 côtés (locales Caramel) ; en prod il diffère (marque Caramel vs Sucrerie) mais c'est hors fidélité du contenu pédagogique.",
    fixtureCounts: { h5p: h5pFixtures.length, moodle: moodleFixtures.length },
    C1: {}, C2: {}, errors: []
  };

  const flagged = await runC1(h5pFixtures, moodleFixtures, report);
  await resetPage('fin C1');
  if (!SKIP_C2) { await runC2(h5pFixtures, moodleFixtures, report, flagged); }

  report.errors = CTX.errors.slice(0, 40);
  report.pageRecreations = CTX.recreations;

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  log(`\nRapport écrit : ${REPORT_PATH}`);
  printSummary(report);
}

function printSummary(report) {
  section('RÉSUMÉ PHASE 3 — PARITÉ EXPORT');
  if (report.C1.results) {
    log(`C1 (intra-Caramel, source vs processed) : ${report.C1.comparedH5p} types H5P comparés.`);
    log(`   Types H5P où source≠processed : ${report.C1.flaggedTypes.join(', ') || 'AUCUN (tous identiques)'}`);
  }
  if (report.C2.results) {
    log(`C2 (Caramel source vs Sucrerie réel) : ${report.C2.tested} types testés.`);
    const byV = (v) => report.C2.results.filter(r => worstVerdict(r) === v).map(r => r.moduleKey);
    const bi = byV('byte-identical'), cont = byV('content-identical-different-bytes');
    const titleOnly = byV('divergent-title-only'), reord = byV('divergent-reordered'), div = byV('divergent'), err = byV('error');
    log(`   MÊME document (byte-identical)        : ${bi.length} → ${bi.join(', ') || '—'}`);
    log(`   contenu identique, octets ≠           : ${cont.length} → ${cont.join(', ') || '—'}`);
    log(`   DIVERGE titre seul (chrome)           : ${titleOnly.length} → ${titleOnly.join(', ') || '—'}`);
    log(`   DIVERGE réordonné (même contenu)      : ${reord.length} → ${reord.join(', ') || '—'}`);
    log(`   DIVERGENT (contenu changé/perdu)      : ${div.length} → ${div.join(', ') || '—'}`);
    if (err.length) log(`   erreurs                               : ${err.length} → ${err.join(', ')}`);
  }
}

async function cleanup() {
  try { if (browser) await browser.close(); } catch {}
  try { if (server) server.kill('SIGTERM'); } catch {}
}
main().then(async () => { await cleanup(); process.exit(0); }).catch(async (e) => { console.error('\nFATAL:', e); await cleanup(); process.exit(2); });
process.on('SIGINT', async () => { await cleanup(); process.exit(130); });
process.on('exit', () => { try { if (server) server.kill('SIGKILL'); } catch {} });
