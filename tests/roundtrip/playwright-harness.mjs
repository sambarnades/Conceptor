/**
 * playwright-harness.mjs — Banc de fidélité d'export Caramel, PHASE 2 (vrai navigateur).
 *
 * Lancement :  cd tests/roundtrip && node playwright-harness.mjs
 * Options   :  --only=Timeline,Flashcards   (filtre par moduleKey, P1/P2/P3)
 *              --quiet                       (moins de log)
 *              --skip-docs                   (saute P5, le plus long)
 *              --skip=P4,P5                  (saute des phases)
 *
 * Ce que ce harnais fait que le harnais Node NE PEUT PAS faire :
 *   P1 — Formats natifs, TOUTES activités (incl. Page & Livre Moodle = nouveau périmètre).
 *   P2 — DOMPurify RÉEL vs baseline Node identité (LE livrable clé : où l'output diffère-t-il ?).
 *   P3 — Déterminisme in-browser (le seeding tient-il dans un vrai Chromium ?).
 *   P4 — Round-trip Sucrerie complet (incl. .mbz Page/Livre) : dépôt → relecture → ré-export.
 *   P5 — Documents DOCX/ODT/PDF (sous-ensemble borné, 1 fixture/type) : export sans erreur + déterminisme.
 *
 * SEEDING : on injecte mulberry32 (Math.random) + Date figée AVANT tout script de page via
 * page.addInitScript, en recopiant les constantes de bootstrap.mjs (Node et navigateur
 * comparables). On expose window.__reseed(seed) pour réinitialiser le PRNG avant chaque
 * export (équivalent de resetRandom() côté Node) → déterminisme par-export.
 *
 * BASELINE P2 : on RECALCULE la baseline Node (sanitizer identité) ICI, pour TOUTES les
 * fixtures (report.json n'en couvre que 2). Même graine, mêmes fixtures, même run → la
 * SEULE différence browser↔Node est l'effet de DOMPurify réel (ou une divergence d'env).
 */

import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const EXAMPLES_DIR = resolve(REPO_ROOT, 'assets/data/examples');
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;
const HARNESS_URL = `${BASE_URL}/tests/roundtrip/browser-harness.html`;
const REPORT_PATH = resolve(__dirname, 'report-phase2.json');

// --- Constantes de seeding (RECOPIÉES de bootstrap.mjs pour comparabilité Node↔browser) ---
const SEED = 0x9e3779b9;
const FROZEN_EPOCH = Date.UTC(2026, 5, 16, 12, 0, 0); // 2026-06-16T12:00:00Z

const argv = process.argv.slice(2);
const getArg = (n) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : null; };
const QUIET = argv.includes('--quiet');
const SKIP_DOCS = argv.includes('--skip-docs');
const SKIP = (getArg('skip') || '').split(',').filter(Boolean);
const ONLY = (getArg('only') || '').split(',').filter(Boolean);
const skipPhase = (p) => SKIP.includes(p) || (p === 'P5' && SKIP_DOCS);

function log(...a) { console.log(...a); }
function vlog(...a) { if (!QUIET) console.log(...a); }

// ===========================================================================
// Script d'init injecté AVANT tout script de page (seeding mulberry32 + Date figée)
// ===========================================================================
const INIT_SCRIPT = `
(() => {
  const SEED = ${SEED};
  const FROZEN_EPOCH = ${FROZEN_EPOCH};
  let _seedState = SEED >>> 0;
  function mulberry32() {
    _seedState |= 0;
    _seedState = (_seedState + 0x6d2b79f5) | 0;
    let t = Math.imul(_seedState ^ (_seedState >>> 15), 1 | _seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  Math.random = mulberry32;
  window.__reseed = (seed) => { _seedState = ((seed === undefined ? SEED : seed) >>> 0); };

  const _RealDate = Date;
  function FrozenDate(...args) {
    if (!(this instanceof FrozenDate)) return new _RealDate(FROZEN_EPOCH).toString();
    if (args.length === 0) return new _RealDate(FROZEN_EPOCH);
    return new _RealDate(...args);
  }
  FrozenDate.prototype = _RealDate.prototype;
  FrozenDate.now = () => FROZEN_EPOCH;
  FrozenDate.parse = _RealDate.parse;
  FrozenDate.UTC = _RealDate.UTC;
  window.Date = FrozenDate;
})();
`;

// ===========================================================================
// 1. Serveur statique (tests/serveur-statique.py) sur la racine du dépôt
// ===========================================================================
function startServer() {
  return new Promise((resolveSrv, rejectSrv) => {
    const srv = spawn('python3', ['tests/serveur-statique.py', String(PORT)], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let settled = false;
    srv.stderr.on('data', () => {}); // python loggue les requêtes sur stderr ; on ignore
    srv.on('error', (e) => { if (!settled) { settled = true; rejectSrv(e); } });
    // Poll jusqu'à ce que le port réponde
    const started = Date.now();
    const poll = async () => {
      try {
        const r = await fetch(`${BASE_URL}/tests/roundtrip/browser-harness.html`, { method: 'HEAD' });
        if (r.ok || r.status === 200) { settled = true; resolveSrv(srv); return; }
      } catch { /* pas encore prêt */ }
      if (Date.now() - started > 15000) { settled = true; rejectSrv(new Error('serveur statique non démarré (15s)')); return; }
      setTimeout(poll, 200);
    };
    poll();
  });
}

// ===========================================================================
// 2. Découverte des fixtures (réutilise fixtures-map.mjs)
// ===========================================================================
import { listFixtures } from './fixtures-map.mjs';

// ===========================================================================
// 3. Canonicalisation — réutilise canonicalize.mjs (Node-side, sur les blobs
//    rapatriés en base64 depuis le browser). bootstrap.mjs est importé par
//    canonicalize.mjs → il installe ses propres stubs/seed Node, sans effet ici
//    (on ne s'en sert QUE pour décompresser/hasher, pas pour ré-exporter).
// ===========================================================================
import { canonicalize } from './canonicalize.mjs';

function b64ToBytes(b64) {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// Scrub d'un .xml Moodle standalone (identique à harness.mjs)
function scrubStandaloneXml(text) {
  return text
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>')
    .replace(/(<id>)\d+(<\/id>)/gi, '$1<ID>$2')
    .replace(/(>)(1[0-9]{9})(<)/g, '$1<TS>$3');
}

/** Canonicalise un blob (base64) selon son kind d'archive. */
async function canonFromB64(b64, archiveKind) {
  const bytes = b64ToBytes(b64);
  if (archiveKind === 'h5p') {
    const c = await canonicalize(bytes, 'h5p');
    return { totalSha256: c.totalSha256, files: c.files, canonSize: c.files.reduce((s, f) => s + f.canonSize, 0) };
  }
  if (archiveKind === 'mbz') {
    const c = await canonicalize(bytes, 'mbz');
    return { totalSha256: c.totalSha256, files: c.files, canonSize: c.files.reduce((s, f) => s + f.canonSize, 0) };
  }
  if (archiveKind === 'xml') {
    const scrubbed = scrubStandaloneXml(new TextDecoder().decode(bytes));
    const enc = new TextEncoder().encode(scrubbed);
    return { totalSha256: sha256Bytes(enc), files: [{ name: 'content.xml', canonSize: enc.length }], canonSize: enc.length };
  }
  // docx/odt : ce sont des zips → canonicalize en mode 'h5p' (unzip JSZip) puis scrub timestamps OOXML/ODF.
  if (archiveKind === 'zipdoc') {
    return canonZipDoc(bytes);
  }
  throw new Error('archiveKind inconnu: ' + archiveKind);
}

// ===========================================================================
// Canonicalisation DOCX/ODT (zip) avec scrub des timestamps embarqués.
//   DOCX (OOXML) : docProps/core.xml porte dcterms:created/modified. docx.js peut aussi
//                  mettre des dates. ODT : meta.xml porte meta:creation-date / dc:date.
//   On scrub ces dates + tout timestamp ISO, puis hash par fichier.
// ===========================================================================
import { ensureJSZip } from './bootstrap.mjs';
function scrubDocXml(text) {
  return text
    // dates ISO 8601 complètes
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, '<DATE>')
    // OOXML core props
    .replace(/(<dcterms:created[^>]*>)[^<]*(<\/dcterms:created>)/gi, '$1<DATE>$2')
    .replace(/(<dcterms:modified[^>]*>)[^<]*(<\/dcterms:modified>)/gi, '$1<DATE>$2')
    // ODF meta
    .replace(/(<meta:creation-date>)[^<]*(<\/meta:creation-date>)/gi, '$1<DATE>$2')
    .replace(/(<dc:date>)[^<]*(<\/dc:date>)/gi, '$1<DATE>$2')
    .replace(/(<meta:editing-duration>)[^<]*(<\/meta:editing-duration>)/gi, '$1<DUR>$2');
}
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
  return { totalSha256: total.digest('hex'), files, canonSize: files.reduce((s, f) => s + f.canonSize, 0) };
}

// ===========================================================================
// 4. Baseline Node (sanitizer IDENTITÉ) pour P2 — content/content.json par fixture H5P.
//    On lance un sous-processus Node qui réutilise EXACTEMENT le pipeline de harness.mjs
//    (bootstrap + heal + shuffle + process + createH5PBlob) avec le sanitizer identité,
//    et émet le content.json (chaîne) en JSON sur stdout. Recalculé pour TOUTES les fixtures.
// ===========================================================================
const NODE_BASELINE_SCRIPT = resolve(__dirname, '_node-baseline.mjs');

async function computeNodeBaseline(h5pFixtures) {
  // Génère un script éphémère qui produit { file: contentJsonString } pour chaque fixture.
  const script = `
import {
  resetRandom, installIdentitySanitizer
} from './bootstrap.mjs';
import { readFile } from 'node:fs/promises';
const healer = await import('../../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../../js/h5p/processors/index.js');
import { h5pModules } from '../../js/core/definitions.js';

await installIdentitySanitizer();

function applyDragShuffle(jsonObj, moduleKey) {
  if (moduleKey === 'DragAndDrop' && Array.isArray(jsonObj.elements) && jsonObj.elements.length > 1) {
    const n = jsonObj.elements.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
    const oldToNew = new Array(n); indices.forEach((o, nw) => { oldToNew[o] = nw; });
    jsonObj.elements = indices.map(o => jsonObj.elements[o]);
    if (Array.isArray(jsonObj.dropZones)) jsonObj.dropZones = jsonObj.dropZones.map(z => ({ ...z, correctElements: (z.correctElements||[]).map(idx => oldToNew[typeof idx==='string'?parseInt(idx,10):idx]).filter(i=>i!==undefined) }));
  }
  if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') && Array.isArray(jsonObj.questions)) {
    jsonObj.questions.forEach(q => {
      if (q.library && q.library.startsWith('H5P.DragQuestion') && q.params && Array.isArray(q.params.elements) && q.params.elements.length > 1) {
        const n = q.params.elements.length; const indices = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
        const oldToNew = new Array(n); indices.forEach((o, nw) => { oldToNew[o] = nw; });
        q.params.elements = indices.map(o => q.params.elements[o]);
        if (Array.isArray(q.params.dropZones)) q.params.dropZones = q.params.dropZones.map(z => ({ ...z, correctElements: (z.correctElements||[]).map(idx => oldToNew[typeof idx==='string'?parseInt(idx,10):idx]).filter(i=>i!==undefined) }));
      }
    });
  }
}

const fixtures = ${JSON.stringify(h5pFixtures.map(f => ({ file: f.file, path: f.path, moduleKey: f.moduleKey })))};
const out = {};
for (const fx of fixtures) {
  try {
    resetRandom();
    const raw = await readFile(fx.path, 'utf8');
    let obj;
    try { obj = JSON.parse(raw); } catch { obj = JSON.parse(healer.healJsonString(raw)); }
    obj = healer.healJsonObject(obj, fx.moduleKey);
    obj = healer.healActivitySpecificFields(obj, fx.moduleKey);
    obj = healer.healStructureForActivity(obj, fx.moduleKey);
    applyDragShuffle(obj, fx.moduleKey);
    let content = obj, dyn = [];
    const pr = await processH5PContent(fx.moduleKey, obj);
    if (pr) { if (pr.content && pr.dependencies) { content = pr.content; } else { content = pr; } }
    out[fx.file] = { contentJson: JSON.stringify(content, null, 2) };
  } catch (e) {
    out[fx.file] = { error: e.message };
  }
}
process.stdout.write(JSON.stringify(out));
`;
  await writeFile(NODE_BASELINE_SCRIPT, script, 'utf8');
  return new Promise((res, rej) => {
    const child = spawn('node', [NODE_BASELINE_SCRIPT], { cwd: __dirname });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => stdout += d);
    child.stderr.on('data', (d) => stderr += d);
    child.on('close', (code) => {
      if (code !== 0) return rej(new Error(`baseline Node exit ${code}: ${stderr.slice(0, 2000)}`));
      try { res(JSON.parse(stdout)); } catch (e) { rej(new Error('baseline parse: ' + e.message + ' / stderr=' + stderr.slice(0, 1000))); }
    });
  });
}

// ===========================================================================
// Diff structurel JSON (réutilise la logique de harness.mjs, condensée)
// ===========================================================================
function structuralDiff(a, b, path = '$', acc = [], limit = 40) {
  if (acc.length >= limit) return acc;
  if (a === b) return acc;
  const ta = jtype(a), tb = jtype(b);
  if (ta !== tb) { acc.push({ path, kind: 'type', a: `${ta}:${trunc(a)}`, b: `${tb}:${trunc(b)}` }); return acc; }
  if (ta === 'array') {
    if (a.length !== b.length) acc.push({ path, kind: 'array-length', a: a.length, b: b.length });
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n && acc.length < limit; i++) structuralDiff(a[i], b[i], `${path}[${i}]`, acc, limit);
    return acc;
  }
  if (ta === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (acc.length >= limit) break;
      if (!(k in a)) { acc.push({ path: `${path}.${k}`, kind: 'missing-in-node', a: undefined, b: trunc(b[k]) }); continue; }
      if (!(k in b)) { acc.push({ path: `${path}.${k}`, kind: 'missing-in-browser', a: trunc(a[k]), b: undefined }); continue; }
      structuralDiff(a[k], b[k], `${path}.${k}`, acc, limit);
    }
    return acc;
  }
  acc.push({ path, kind: 'value', a: trunc(a), b: trunc(b) });
  return acc;
}
function jtype(v) { if (v === null) return 'null'; if (Array.isArray(v)) return 'array'; return typeof v; }
function trunc(v, n = 160) { let s; try { s = typeof v === 'string' ? v : JSON.stringify(v); } catch { s = String(v); } if (s == null) return s; return s.length > n ? s.slice(0, n) + `…(+${s.length - n})` : s; }

// Masque les UUID volatils (subContentId) avant diff (régénérés par Math.random, comparables
// seulement si les 2 côtés consomment le RNG identiquement — ce qui est le cas après __reseed,
// mais on masque par sécurité pour isoler l'effet DOMPurify).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function maskUuids(v) {
  if (Array.isArray(v)) return v.map(maskUuids);
  if (v && typeof v === 'object') { const o = {}; for (const [k, val] of Object.entries(v)) { o[k] = (k === 'subContentId') ? '<UUID>' : maskUuids(val); } return o; }
  if (typeof v === 'string' && UUID_RE.test(v)) return '<UUID>';
  return v;
}

// ===========================================================================
// MAIN
// ===========================================================================
let server, browser;
async function main() {
  log('Caramel — Banc de fidélité d\'export PHASE 2 (Playwright/Chromium réel)');
  log('Node', process.version, '| epoch figée 2026-06-16T12:00:00Z | RNG mulberry32 seedé (graine 0x9e3779b9)');

  let allFixtures = await listFixtures('all');
  let h5pFixtures = allFixtures.filter(f => f.kind === 'h5p');
  let moodleFixtures = allFixtures.filter(f => f.kind === 'moodle');
  if (ONLY.length) {
    h5pFixtures = h5pFixtures.filter(f => ONLY.includes(f.moduleKey));
    moodleFixtures = moodleFixtures.filter(f => ONLY.includes(f.moduleKey));
  }
  log(`\nFixtures : ${h5pFixtures.length} H5P, ${moodleFixtures.length} Moodle` + (ONLY.length ? ` (filtre: ${ONLY.join(',')})` : ''));

  // --- Baseline Node (P2) : calculée d'abord (sous-processus), avant de lancer le browser ---
  log('\n[setup] Calcul de la baseline Node (sanitizer identité) pour P2…');
  let nodeBaseline = {};
  if (!skipPhase('P2')) {
    try {
      nodeBaseline = await computeNodeBaseline(h5pFixtures);
      const okCount = Object.values(nodeBaseline).filter(v => !v.error).length;
      log(`[setup] Baseline Node : ${okCount}/${h5pFixtures.length} content.json calculés.`);
    } catch (e) {
      log('[setup] ÉCHEC baseline Node (P2 dégradé) :', e.message);
    }
  }

  // --- Serveur + browser ---
  log('\n[setup] Démarrage serveur statique + Chromium headless…');
  server = await startServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(INIT_SCRIPT);

  // Blocage réseau ÉTANCHE : le harnais ne doit JAMAIS toucher la prod (proxy n8n,
  // Gotenberg, CDN…). On intercepte TOUT mais on laisse PASSER explicitement le serveur
  // statique local — donc le chargement des modules ES locaux (y compris le fichier local
  // js/export/pdf-via-gotenberg.js, servi par localhost) n'est PAS cassé ; seul le vrai
  // appel réseau externe est aborté → la voie Gotenberg échoue vite → fallback jsPDF.
  // (Remplace les anciens globs par-hôte `*.scalingo.io`/`n8n-caramel*` qui laissaient
  //  filer ~8 requêtes vers la prod : une allow-list localhost est étanche par construction.)
  await context.route('**/*', (route) => {
    const url = route.request().url();
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
      || /^(data|blob|about):/i.test(url);
    return isLocal ? route.continue() : route.abort();
  });

  HARNESS_CTX.context = context;
  HARNESS_CTX.page = await createPage();
  let page = HARNESS_CTX.page;
  const consoleErrors = HARNESS_CTX.consoleErrors;

  const meta = await page.evaluate(() => window.HARNESS.meta);
  log(`[setup] Harness prêt. lang=${meta.currentLang}, DOMPurify=${meta.domPurifyReady} (v${meta.dompurifyVersion}), translationsLoaded=${meta.translationsLoaded}`);
  if (!meta.domPurifyReady) {
    log('[setup] ⚠ ATTENTION : DOMPurify NON préchargé → sanitizeSync partirait en fallback fail-closed. Les exports HTML ne refléteraient PAS un vrai utilisateur. P2 INVALIDE.');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    frozenEpoch: '2026-06-16T12:00:00Z',
    seed: '0x9e3779b9',
    chromium: (await browser.version()),
    domPurify: { ready: meta.domPurifyReady, version: meta.dompurifyVersion },
    fixtureCounts: { h5p: h5pFixtures.length, moodle: moodleFixtures.length },
    P1: {}, P2: {}, P3: {}, P4: {}, P5: {},
    blockers: []
  };

  // On recrée la page entre les phases (et après les gros lots H5P de P1/P2) pour libérer
  // la mémoire Chromium accumulée — cause de hang observée sous pression mémoire.
  // ===== P1 — Formats natifs, TOUTES activités =====
  if (!skipPhase('P1')) { await runP1(HARNESS_CTX.page, h5pFixtures, moodleFixtures, report); await resetPage('fin P1'); }
  // ===== P2 — DOMPurify cross-check (in-browser réel vs identité + vs baseline Node) =====
  if (!skipPhase('P2')) { await runP2(HARNESS_CTX.page, h5pFixtures, report, nodeBaseline); await resetPage('fin P2'); }
  // ===== P3 — Déterminisme in-browser =====
  if (!skipPhase('P3')) { await runP3(HARNESS_CTX.page, h5pFixtures, moodleFixtures, report); await resetPage('fin P3'); }
  // ===== P4 — Round-trip Sucrerie =====
  if (!skipPhase('P4')) { await runP4(HARNESS_CTX.page, h5pFixtures, moodleFixtures, report); await resetPage('fin P4'); }
  // ===== P5 — Documents (sous-ensemble borné) =====
  if (!skipPhase('P5')) await runP5(HARNESS_CTX.page, h5pFixtures, moodleFixtures, report);

  report.pageRecreations = HARNESS_CTX.recreations;

  report.consoleErrors = consoleErrors.slice(0, 50);

  // _h5pBlobs = base64 de TOUS les .h5p (plusieurs Mo), stocké transitoirement pour
  // alimenter la comparaison secondaire de P2. On le retire avant d'écrire le rapport
  // (sinon report-phase2.json pèse des Mo et devient illisible).
  delete report._h5pBlobs;

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  log(`\nRapport écrit : ${REPORT_PATH}`);
  printSummary(report);
}

// ---------------------------------------------------------------------------
// Contrôleur browser robuste.
//   HARNESS_CTX.page : la page courante (recréable). Tous les helpers passent par
//   safeEval() qui :
//     - met un TIMEOUT NODE-SIDE sur page.evaluate (une page wedgée ne peut PAS bloquer
//       le runner indéfiniment ; le timeout interne à la page ne suffit pas si l'event
//       loop de la page est figé) ;
//     - en cas de timeout/crash, RECRÉE la page (mémoire fraîche) et renvoie une erreur
//       exploitable → le run continue au lieu de pendre.
//   On recrée aussi la page entre phases (resetPage) pour éviter l'accumulation mémoire
//   Chromium sur des centaines d'exports (cause de hang observée sous pression mémoire).
// ---------------------------------------------------------------------------
const HARNESS_CTX = { context: null, page: null, consoleErrors: [], recreations: 0 };
const EVAL_TIMEOUT_MS = 45000;

async function createPage() {
  const page = await HARNESS_CTX.context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') HARNESS_CTX.consoleErrors.push(msg.text()); });
  page.on('pageerror', (e) => HARNESS_CTX.consoleErrors.push('pageerror: ' + e.message));
  await page.goto(HARNESS_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__harnessReady === true || window.__harnessBootError, { timeout: 60000 });
  const bootError = await page.evaluate(() => window.__harnessBootError || null);
  if (bootError) throw new Error('boot page échoué: ' + bootError);
  return page;
}

async function resetPage(reason = '') {
  try { if (HARNESS_CTX.page) await HARNESS_CTX.page.close(); } catch {}
  HARNESS_CTX.page = await createPage();
  if (reason) vlog(`[ctx] page recréée (${reason}) — total recréations: ${HARNESS_CTX.recreations}`);
}

/**
 * Exécute pageFunction dans la page courante avec timeout Node-side. En cas de timeout
 * (page wedgée), recrée la page et renvoie { ok:false, error:'page-timeout', recovered:true }.
 */
async function safeEval(pageFunction, arg, label) {
  const page = HARNESS_CTX.page;
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('__SAFEEVAL_TIMEOUT__')), EVAL_TIMEOUT_MS); });
  try {
    const res = await Promise.race([page.evaluate(pageFunction, arg), timeout]);
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    const isTimeout = (e.message || '').includes('__SAFEEVAL_TIMEOUT__') || (e.message || '').includes('Target closed') || (e.message || '').includes('crash');
    HARNESS_CTX.recreations++;
    try { await resetPage(`après ${isTimeout ? 'TIMEOUT' : 'erreur'} sur ${label}`); } catch (re) { /* recreation échouée */ }
    return { ok: false, error: isTimeout ? `page-timeout(${EVAL_TIMEOUT_MS}ms) sur ${label}` : ('eval: ' + e.message), recovered: true };
  }
}

// Helpers d'appel browser (re-seed avant chaque export pour déterminisme par-export).
// Le 1er paramètre `page` est ignoré (compat de signature) : on passe par HARNESS_CTX.page.
async function callExportH5P(_page, moduleKey, jsonObj, reseed = true) {
  return safeEval(async ({ moduleKey, jsonObj, reseed }) => {
    if (reseed && window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportH5P(moduleKey, jsonObj)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack||'').slice(0,500) }; }
  }, { moduleKey, jsonObj, reseed }, `exportH5P:${moduleKey}`);
}
async function callExportH5PIdentity(_page, moduleKey, jsonObj, reseed = true) {
  return safeEval(async ({ moduleKey, jsonObj, reseed }) => {
    if (reseed && window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportH5PIdentity(moduleKey, jsonObj)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack||'').slice(0,500) }; }
  }, { moduleKey, jsonObj, reseed }, `exportH5PIdentity:${moduleKey}`);
}
async function callExportMoodle(_page, moduleKey, jsonStr, reseed = true) {
  return safeEval(async ({ moduleKey, jsonStr, reseed }) => {
    if (reseed && window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportMoodle(moduleKey, jsonStr)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack||'').slice(0,500) }; }
  }, { moduleKey, jsonStr, reseed }, `exportMoodle:${moduleKey}`);
}
async function callExportDocument(_page, moduleKey, jsonObj, format, reseed = true) {
  return safeEval(async ({ moduleKey, jsonObj, format, reseed }) => {
    if (reseed && window.__reseed) window.__reseed();
    try { return { ok: true, ...(await window.HARNESS.exportDocument(moduleKey, jsonObj, format)) }; }
    catch (e) { return { ok: false, error: e.message, stack: (e.stack||'').slice(0,500) }; }
  }, { moduleKey, jsonObj, format, reseed }, `exportDocument:${moduleKey}:${format}`);
}

// Parse défensif d'une fixture EXACTEMENT comme handleH5PCreation : JSON.parse standard,
// puis healJsonString() en secours si le brut contient des échappements LaTeX nus (\frac, \pi…)
// que JSON.parse rejette. Sans ce secours, une fixture « LaTeX nu » (ex: quiz_qcm_3.json) serait
// faussement comptée en erreur alors qu'un vrai export la réparerait. La string passée au
// browser DOIT être pré-parsée (exportH5P prend un OBJET), donc on parse côté Node ici.
// bootstrap.mjs (importé par canonicalize.mjs au top) a déjà stubé `document` → l'import de
// json-healer.js (qui transitivement touche notifications.js) ne crashe pas.
let _healerMod = null;
async function getHealer() {
  if (!_healerMod) _healerMod = await import('../../js/h5p/json-healer.js');
  return _healerMod;
}
async function loadFixtureObj(fx) {
  const raw = await readFile(fx.path, 'utf8');
  try { return { obj: JSON.parse(raw), raw }; }
  catch {
    try {
      const healer = await getHealer();
      return { obj: JSON.parse(healer.healJsonString(raw)), raw, healed: true };
    } catch (e2) {
      return { obj: null, raw, parseError: e2.message };
    }
  }
}

// ===========================================================================
// P1 — Formats natifs, TOUTES activités (H5P .h5p ; Moodle .mbz/.xml incl. Page/Livre)
// ===========================================================================
function section(t) { log('\n' + '='.repeat(78) + '\n' + t + '\n' + '='.repeat(78)); }

async function runP1(page, h5pFixtures, moodleFixtures, report) {
  section('P1 — Formats numériques natifs, TOUTES activités (.h5p / .mbz / .xml)');
  const h5p = [], moodle = [];
  // Stocke les base64 H5P pour réutilisation en P2 (évite de ré-exporter).
  report._h5pBlobs = {};

  for (const fx of h5pFixtures) {
    const { obj, parseError } = await loadFixtureObj(fx);
    let row = { file: fx.file, moduleKey: fx.moduleKey, format: 'h5p', ok: false };
    if (!obj) { row.error = 'parse fixture impossible même après healJsonString: ' + (parseError || ''); h5p.push(row); continue; }
    const res = await callExportH5P(page, fx.moduleKey, obj);
    if (!res.ok) { row.error = res.error; h5p.push(row); vlog(`[P1] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ERREUR: ${res.error}`); continue; }
    try {
      const canon = await canonFromB64(res.base64, 'h5p');
      row.ok = true; row.size = res.size; row.canonSize = canon.canonSize; row.sha256 = canon.totalSha256; row.fileCount = canon.files.length;
      report._h5pBlobs[fx.file] = res.base64;
    } catch (e) { row.error = 'canon: ' + e.message; }
    h5p.push(row);
    vlog(`[P1] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ${row.ok ? `OK ${row.size}o sha=${row.sha256.slice(0,12)}…` : 'ERREUR ' + row.error}`);
  }

  for (const fx of moodleFixtures) {
    const raw = await readFile(fx.path, 'utf8');
    const archiveKind = (fx.moduleKey === 'glossaireXml' || fx.moduleKey === 'test_elea') ? 'xml' : 'mbz';
    let row = { file: fx.file, moduleKey: fx.moduleKey, format: archiveKind, ok: false };
    const res = await callExportMoodle(page, fx.moduleKey, raw);
    if (!res.ok) { row.error = res.error; moodle.push(row); vlog(`[P1] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ERREUR: ${res.error}`); continue; }
    try {
      const canon = await canonFromB64(res.base64, archiveKind);
      row.ok = true; row.size = res.size; row.canonSize = canon.canonSize; row.sha256 = canon.totalSha256; row.fileCount = canon.files.length;
    } catch (e) { row.error = 'canon: ' + e.message; }
    moodle.push(row);
    vlog(`[P1] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ${row.ok ? `OK ${row.size}o sha=${row.sha256.slice(0,12)}…` : 'ERREUR ' + row.error}`);
  }

  report.P1 = {
    h5p, moodle,
    summary: {
      h5pOk: h5p.filter(r => r.ok).length, h5pErr: h5p.filter(r => !r.ok).length,
      moodleOk: moodle.filter(r => r.ok).length, moodleErr: moodle.filter(r => !r.ok).length
    }
  };
  log(`[P1] H5P: ${report.P1.summary.h5pOk}/${h5p.length} OK | Moodle: ${report.P1.summary.moodleOk}/${moodle.length} OK`);
}

// ===========================================================================
// P2 — DOMPurify cross-check (LIVRABLE CLÉ).
//
//   Méthode RIGOUREUSE (isolation pure) : pour chaque fixture H5P, on exporte IN-BROWSER
//   DEUX FOIS, même page, même graine (re-seed) :
//     (A) avec DOMPurify RÉEL  → ce qu'un vrai utilisateur obtient.
//     (B) avec sanitizer IDENTITÉ (window.DOMPurify.sanitize patché en String(x), exactement
//         comme bootstrap.installIdentitySanitizer côté Node) → ce que le harnais Node produit.
//   TOUT le reste est identique (traductions FR, pipeline, RNG) → la SEULE différence entre
//   les deux content/content.json est l'effet de DOMPurify réel. C'est LA mesure propre.
//
//   Comparaison SECONDAIRE (contexte) : browser-réel vs baseline Node externe. Celle-ci
//   conflate l'effet DOMPurify AVEC d'éventuelles différences de traductions (le harnais Node
//   d'origine ne charge pas la locale FR → labels a11y différents). On la garde mais on la
//   marque explicitement comme « inclut les écarts de traduction ».
// ===========================================================================
async function extractContentJsonFromB64(b64) {
  const JSZip = await ensureJSZip();
  const zip = await JSZip.loadAsync(b64ToBytes(b64));
  return zip.files['content/content.json'].async('string');
}

async function runP2(page, h5pFixtures, report, nodeBaseline) {
  section('P2 — DOMPurify RÉEL vs IDENTITÉ (in-browser, isolation pure) — LIVRABLE CLÉ');
  const results = [];
  for (const fx of h5pFixtures) {
    const { obj } = await loadFixtureObj(fx);
    let row = { file: fx.file, moduleKey: fx.moduleKey, ok: null };
    if (!obj) { row.note = 'parse fixture impossible'; results.push(row); continue; }
    try {
      const real = await callExportH5P(page, fx.moduleKey, obj);          // DOMPurify réel
      const ident = await callExportH5PIdentity(page, fx.moduleKey, obj); // identité
      if (!real.ok || !ident.ok) { row.ok = null; row.note = 'export: ' + (real.error || ident.error); results.push(row); continue; }
      const realStr = await extractContentJsonFromB64(real.base64);
      const identStr = await extractContentJsonFromB64(ident.base64);
      if (realStr === identStr) {
        row.ok = true; row.identical = true;
      } else {
        row.ok = false;
        let ro, io;
        try { ro = maskUuids(JSON.parse(realStr)); io = maskUuids(JSON.parse(identStr)); }
        catch { ro = realStr; io = identStr; }
        const diff = structuralDiff(io, ro); // a=identité(=node-like), b=réel(=browser)
        row.diffCount = diff.length;
        row.diff = diff;
        row.lenIdentity = identStr.length;
        row.lenReal = realStr.length;
      }
    } catch (e) { row.ok = null; row.note = 'compare: ' + e.message; }
    results.push(row);
    vlog(`[P2] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ${row.ok === true ? 'identique (DOMPurify sans effet)' : row.ok === false ? `DIFFÈRE (${row.diffCount} champs, Δlen ${row.lenReal - row.lenIdentity})` : 'N/A ' + (row.note||'')}`);
  }

  const differing = results.filter(r => r.ok === false);
  const identical = results.filter(r => r.ok === true);

  // --- Comparaison secondaire vs baseline Node externe (avec caveat traduction) ---
  const vsNode = [];
  const blobs = report._h5pBlobs || {};
  for (const [file, b64] of Object.entries(blobs)) {
    const base = nodeBaseline[file];
    if (!base || base.error) continue;
    try {
      const browserStr = await extractContentJsonFromB64(b64);
      vsNode.push({ file, identical: browserStr === base.contentJson });
    } catch { /* ignore */ }
  }

  report.P2 = {
    method: 'in-browser real-DOMPurify vs identity-sanitizer (pure isolation)',
    compared: results.length,
    identical: identical.length,
    differing: differing.length,
    differingDetail: differing,
    results,
    secondaryVsNodeBaseline: {
      note: 'browser-réel vs baseline Node externe ; CONFLATE effet DOMPurify ET écarts de traduction (Node ne charge pas la locale FR) — informatif seulement',
      compared: vsNode.length,
      identical: vsNode.filter(r => r.identical).length,
      differing: vsNode.filter(r => !r.identical).length
    }
  };

  log(`[P2] ${identical.length}/${results.length} content.json IDENTIQUES (DOMPurify réel == identité). ${differing.length} DIFFÈRENT.`);
  if (differing.length) {
    log('[P2] >>> Activités où DOMPurify RÉEL modifie l\'output (effet pur, hors traduction) :');
    for (const d of differing) {
      log(`   • ${d.moduleKey} / ${d.file}  (Δlen ${d.lenReal - d.lenIdentity}, ${d.diffCount} champ(s))`);
      for (const x of (d.diff || []).slice(0, 5)) {
        log(`       ${x.path} [${x.kind}]`);
        log(`          identité : ${x.a}`);
        log(`          réel     : ${x.b}`);
      }
    }
  } else {
    log('[P2] AUCUNE différence : DOMPurify réel ne modifie PAS le content.json sur ces fixtures.');
    log('     → le sanitizer identité du harnais Node était une approximation SÛRE (caveat de fidélité levé).');
  }
  log(`[P2] (secondaire, avec écart-traduction) browser↔Node baseline : ${report.P2.secondaryVsNodeBaseline.identical}/${report.P2.secondaryVsNodeBaseline.compared} identiques.`);
}

// ===========================================================================
// P3 — Déterminisme in-browser : export 2× (même page, re-seed) → canon identique
// ===========================================================================
async function runP3(page, h5pFixtures, moodleFixtures, report) {
  section('P3 — Déterminisme in-browser (export 2×, même page, re-seed)');
  // Spread représentatif : 1 fixture par type H5P + Page + Livre + 2-3 autres Moodle.
  const spread = [];
  const seenH5p = new Set();
  for (const fx of h5pFixtures) { if (!seenH5p.has(fx.moduleKey)) { seenH5p.add(fx.moduleKey); spread.push({ ...fx, ek: 'h5p' }); } }
  const wantedMoodle = ['Page', 'Livre', 'Millionnaire', 'Appariement', 'QCM', 'Devoir', 'glossaireXml', 'test_elea'];
  const seenM = new Set();
  for (const fx of moodleFixtures) { if (wantedMoodle.includes(fx.moduleKey) && !seenM.has(fx.moduleKey)) { seenM.add(fx.moduleKey); spread.push({ ...fx, ek: (fx.moduleKey==='glossaireXml'||fx.moduleKey==='test_elea')?'xml':'mbz' }); } }
  log(`[P3] Spread de ${spread.length} fixtures (types: ${spread.map(s=>s.moduleKey).join(', ')})`);

  const results = [];
  for (const fx of spread) {
    let row = { file: fx.file, moduleKey: fx.moduleKey, ek: fx.ek, ok: null };
    try {
      let r1, r2;
      if (fx.ek === 'h5p') {
        const { obj } = await loadFixtureObj(fx);
        r1 = await callExportH5P(page, fx.moduleKey, obj);
        r2 = await callExportH5P(page, fx.moduleKey, obj);
      } else {
        const raw = await readFile(fx.path, 'utf8');
        r1 = await callExportMoodle(page, fx.moduleKey, raw);
        r2 = await callExportMoodle(page, fx.moduleKey, raw);
      }
      if (!r1.ok || !r2.ok) { row.ok = null; row.error = (r1.error || r2.error); results.push(row); vlog(`[P3] ${fx.moduleKey.padEnd(18)} ERREUR ${row.error}`); continue; }
      const c1 = await canonFromB64(r1.base64, fx.ek);
      const c2 = await canonFromB64(r2.base64, fx.ek);
      row.ok = c1.totalSha256 === c2.totalSha256;
      row.sha1 = c1.totalSha256; row.sha2 = c2.totalSha256;
      if (!row.ok) {
        // localiser les fichiers divergents
        const m2 = new Map(c2.files.map(f => [f.name, f.canonSha256]));
        row.diffFiles = c1.files.filter(f => m2.get(f.name) !== f.canonSha256).map(f => f.name);
      }
    } catch (e) { row.ok = null; row.error = e.message; }
    results.push(row);
    vlog(`[P3] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(34)} ${row.ok === true ? 'DÉTERMINISTE' : row.ok === false ? 'NON-DÉTERMINISTE ['+(row.diffFiles||[]).join(',')+']' : 'ERREUR ' + row.error}`);
  }
  report.P3 = {
    spreadSize: spread.length,
    deterministic: results.filter(r => r.ok === true).length,
    nonDeterministic: results.filter(r => r.ok === false).length,
    errors: results.filter(r => r.ok === null).length,
    results
  };
  log(`[P3] ${report.P3.deterministic}/${spread.length} déterministes | ${report.P3.nonDeterministic} non-déterministes | ${report.P3.errors} erreurs`);
}

// ===========================================================================
// P4 — Round-trip Sucrerie (incl. Page/Livre .mbz + plusieurs .h5p)
//   verbatim : base64(bridge)/décodé == octets d'origine ; blob intact après extract.
//   re-export : ré-exporter le MÊME contenu → canon identique au 1er export.
// ===========================================================================
async function runP4(page, h5pFixtures, moodleFixtures, report) {
  section('P4 — Round-trip Sucrerie (dépôt → relecture → ré-export, incl. Page/Livre)');
  const spread = [];
  for (const mk of ['DragAndDrop', 'Flashcards', 'MultipleChoice', 'Crossword', 'QuizSet', 'InteractiveBook', 'Timeline']) {
    const fx = h5pFixtures.find(f => f.moduleKey === mk); if (fx) spread.push({ ...fx, ek: 'h5p', fmt: 'h5p' });
  }
  for (const mk of ['Page', 'Livre', 'Millionnaire', 'QCM']) {
    const fx = moodleFixtures.find(f => f.moduleKey === mk); if (fx) spread.push({ ...fx, ek: 'mbz', fmt: 'mbz' });
  }
  log(`[P4] Spread de ${spread.length} fixtures (${spread.map(s=>s.moduleKey).join(', ')})`);

  const results = [];
  for (const fx of spread) {
    let row = { file: fx.file, moduleKey: fx.moduleKey, fmt: fx.fmt, verbatimOk: null, reExportOk: null };
    try {
      // 1er export
      let r1;
      if (fx.ek === 'h5p') { const { obj } = await loadFixtureObj(fx); r1 = await callExportH5P(page, fx.moduleKey, obj); }
      else { const raw = await readFile(fx.path, 'utf8'); r1 = await callExportMoodle(page, fx.moduleKey, raw); }
      if (!r1.ok) { row.error = r1.error; results.push(row); vlog(`[P4] ${fx.moduleKey} EXPORT ERREUR ${r1.error}`); continue; }
      const originalB64 = r1.base64;
      const originalBytes = b64ToBytes(originalB64);

      // round-trip in-browser (bridge base64 + extract markdown) — via safeEval (timeout + page courante)
      const rt = await safeEval(async ({ inputBase64, format }) => {
        try { return { ok: true, ...(await window.HARNESS.roundtripSucrerie(inputBase64, format)) }; }
        catch (e) { return { ok: false, error: e.message }; }
      }, { inputBase64: originalB64, format: fx.fmt }, `roundtrip:${fx.moduleKey}`);
      if (!rt.ok) { row.error = 'roundtrip: ' + rt.error; results.push(row); vlog(`[P4] ${fx.moduleKey} ROUNDTRIP ERREUR ${rt.error}`); continue; }

      // verbatim : base64 du bridge, décodé, == octets d'origine
      const bridgeDecoded = b64ToBytes(rt.bridgeBase64);
      row.verbatimOk = bridgeDecoded.length === originalBytes.length && Buffer.compare(Buffer.from(bridgeDecoded), Buffer.from(originalBytes)) === 0;
      row.blobUntouched = rt.blobUntouched;
      row.markdownLen = rt.markdownLen;
      row.activityType = rt.activityType;

      // re-export : ré-exporter le MÊME contenu → canon identique
      let r2;
      if (fx.ek === 'h5p') { const { obj } = await loadFixtureObj(fx); r2 = await callExportH5P(page, fx.moduleKey, obj); }
      else { const raw = await readFile(fx.path, 'utf8'); r2 = await callExportMoodle(page, fx.moduleKey, raw); }
      if (r2.ok) {
        const c1 = await canonFromB64(originalB64, fx.ek);
        const c2 = await canonFromB64(r2.base64, fx.ek);
        row.reExportOk = c1.totalSha256 === c2.totalSha256;
        row.size1 = r1.size; row.size2 = r2.size;
      } else { row.reExportError = r2.error; }
    } catch (e) { row.error = e.message; }
    results.push(row);
    vlog(`[P4] ${fx.moduleKey.padEnd(18)} ${fx.file.padEnd(30)} verbatim=${row.verbatimOk} blobIntact=${row.blobUntouched} mdLen=${row.markdownLen} reExport=${row.reExportOk}`);
  }
  report.P4 = {
    spreadSize: spread.length,
    verbatimPass: results.filter(r => r.verbatimOk === true).length,
    verbatimFail: results.filter(r => r.verbatimOk === false).length,
    reExportPass: results.filter(r => r.reExportOk === true).length,
    reExportFail: results.filter(r => r.reExportOk === false).length,
    results
  };
  log(`[P4] verbatim ${report.P4.verbatimPass}/${spread.length} OK | re-export identique ${report.P4.reExportPass}/${spread.length} OK`);
}

// ===========================================================================
// P5 — Documents (1 fixture/type) : DOCX/ODT/PDF, export sans erreur + déterminisme.
// ===========================================================================
async function runP5(page, h5pFixtures, moodleFixtures, report) {
  section('P5 — Documents DOCX/ODT/PDF (1 fixture représentative par TYPE)');
  // 1 fixture par type H5P + chaque type Moodle.
  const picks = [];
  const seen = new Set();
  for (const fx of [...h5pFixtures, ...moodleFixtures]) {
    if (!seen.has(fx.moduleKey)) { seen.add(fx.moduleKey); picks.push(fx); }
  }
  log(`[P5] ${picks.length} fixtures choisies (1/type) : ${picks.map(p => p.moduleKey + ':' + p.file).join(', ')}`);

  const results = [];
  for (const fx of picks) {
    const { obj } = await loadFixtureObj(fx);
    let row = { file: fx.file, moduleKey: fx.moduleKey, formats: {} };
    if (!obj) { row.error = 'parse fixture impossible'; results.push(row); continue; }
    for (const fmt of ['docx', 'odt', 'pdf']) {
      let cell = { ok: false };
      try {
        const r1 = await callExportDocument(page, fx.moduleKey, obj, fmt);
        if (!r1.ok) { cell.error = r1.error; row.formats[fmt] = cell; continue; }
        cell.ok = true; cell.size = r1.size; cell.pdfPath = r1.pdfPath || null;
        // déterminisme : 2e export → canon identique
        const r2 = await callExportDocument(page, fx.moduleKey, obj, fmt);
        if (r2.ok) {
          if (fmt === 'pdf') {
            // PDF jsPDF : binaire non-zip. On compare la taille + sha brut (jsPDF embarque la
            // date figée → devrait être déterministe). On enregistre aussi un texte len approx.
            const b1 = b64ToBytes(r1.base64), b2 = b64ToBytes(r2.base64);
            cell.deterministic = b1.length === b2.length && Buffer.compare(Buffer.from(b1), Buffer.from(b2)) === 0;
            cell.sha = sha256Bytes(b1);
          } else {
            const c1 = await canonFromB64(r1.base64, 'zipdoc');
            const c2 = await canonFromB64(r2.base64, 'zipdoc');
            cell.deterministic = c1.totalSha256 === c2.totalSha256;
            cell.sha = c1.totalSha256;
            cell.canonSize = c1.canonSize;
          }
        } else { cell.deterministic = null; cell.error2 = r2.error; }
      } catch (e) { cell.error = e.message; }
      row.formats[fmt] = cell;
    }
    results.push(row);
    const fmtStr = ['docx','odt','pdf'].map(f => { const c = row.formats[f]; return `${f}=${c.ok?(c.size+'o'+(c.deterministic===false?'!nondét':'')+(f==='pdf'&&c.pdfPath?'('+c.pdfPath+')':'')):'ERR:'+(c.error||'').slice(0,40)}`; }).join(' ');
    vlog(`[P5] ${fx.moduleKey.padEnd(18)} ${fmtStr}`);
  }

  const tally = (fmt, pred) => results.filter(r => r.formats[fmt] && pred(r.formats[fmt])).length;
  report.P5 = {
    picks: picks.map(p => ({ moduleKey: p.moduleKey, file: p.file })),
    summary: {
      docx: { ok: tally('docx', c=>c.ok), err: tally('docx', c=>!c.ok), nonDet: tally('docx', c=>c.deterministic===false) },
      odt:  { ok: tally('odt',  c=>c.ok), err: tally('odt',  c=>!c.ok), nonDet: tally('odt',  c=>c.deterministic===false) },
      pdf:  { ok: tally('pdf',  c=>c.ok), err: tally('pdf',  c=>!c.ok), nonDet: tally('pdf',  c=>c.deterministic===false),
              gotenberg: tally('pdf', c=>c.pdfPath && c.pdfPath.includes('gotenberg') && !c.pdfPath.includes('fallback')),
              jspdf: tally('pdf', c=>c.pdfPath && c.pdfPath.includes('jspdf')) }
    },
    results
  };
  log(`[P5] DOCX ${report.P5.summary.docx.ok}ok/${report.P5.summary.docx.err}err | ODT ${report.P5.summary.odt.ok}ok/${report.P5.summary.odt.err}err | PDF ${report.P5.summary.pdf.ok}ok/${report.P5.summary.pdf.err}err (jsPDF:${report.P5.summary.pdf.jspdf})`);
}

// ===========================================================================
// Résumé final
// ===========================================================================
function printSummary(report) {
  section('RÉSUMÉ PHASE 2');
  if (report.P1.summary) log(`P1 Natifs     : H5P ${report.P1.summary.h5pOk}/${report.P1.h5p.length} OK, Moodle ${report.P1.summary.moodleOk}/${report.P1.moodle.length} OK`);
  if (report.P2.compared !== undefined) log(`P2 DOMPurify  : ${report.P2.identical}/${report.P2.compared} identiques | ${report.P2.differing} diffèrent (effet DOMPurify réel)`);
  if (report.P3.spreadSize) log(`P3 Déterm.    : ${report.P3.deterministic}/${report.P3.spreadSize} déterministes, ${report.P3.nonDeterministic} non-déterministes, ${report.P3.errors} err`);
  if (report.P4.spreadSize) log(`P4 Round-trip : verbatim ${report.P4.verbatimPass}/${report.P4.spreadSize}, re-export ${report.P4.reExportPass}/${report.P4.spreadSize}`);
  if (report.P5.summary) log(`P5 Documents  : DOCX ${report.P5.summary.docx.ok}ok ODT ${report.P5.summary.odt.ok}ok PDF ${report.P5.summary.pdf.ok}ok (PDF via jsPDF:${report.P5.summary.pdf.jspdf}, gotenberg:${report.P5.summary.pdf.gotenberg})`);
}

// ---------------------------------------------------------------------------
async function cleanup() {
  try { if (browser) await browser.close(); } catch {}
  try { if (server) { server.kill('SIGTERM'); } } catch {}
  // Supprime le script éphémère de baseline Node (généré pour P2).
  try { const { unlink } = await import('node:fs/promises'); await unlink(NODE_BASELINE_SCRIPT); } catch {}
}

main()
  .then(async () => { await cleanup(); process.exit(0); })
  .catch(async (e) => { console.error('\nFATAL:', e); await cleanup(); process.exit(2); });

// Sécurité : tuer le serveur si le process meurt
process.on('SIGINT', async () => { await cleanup(); process.exit(130); });
process.on('exit', () => { try { if (server) server.kill('SIGKILL'); } catch {} });
