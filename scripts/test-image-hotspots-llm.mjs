// scripts/test-image-hotspots-llm.mjs
// QA E2E « Image interactive » (H5P.ImageHotspots) sur les VRAIS workflows n8n prod (suffixe -bas,
// endpoints lus dans js/core/endpoints.js → on tape EXACTEMENT ce que tape l'app déployée).
//
// Chaîne testée, à l'identique de la prod :
//   image (dataURL) → VISION (caramel-vision-detect-bas, modèle Qwen 3.6 VL, prompt vision localisé
//                     `hotspot_vision_prompt` comme hotspot-vision.js) → zones [{x,y,label,description}]
//                   → prompt assemblé comme prompt-generator.js (clés prompt_image_hotspots_* de <lang>.json,
//                     en-tête SOURCES avec width×height réels de l'image, comme en prod)
//                   → LLM TEXTE (caramel/llm/submit-bas + result-bas) sur mistral-small-4 / qwen / gemma
//                   → healer RÉEL (json-healer.js) → processeur RÉEL (processors/ImageHotspots.js)
//                   → content.json H5P.ImageHotspots 1.11  → VALIDATION
//
// Les appels LLM sont FACTURÉS. Les répétitions servent à mesurer la fiabilité après MAJ du workflow.
//
// Usage :
//   node scripts/test-image-hotspots-llm.mjs [imagePath] [repeats] [--models=m1,m2] [--qui=..] [--quoi=..] [--niveau=..] [--count=N]
//   ex : node scripts/test-image-hotspots-llm.mjs /tmp/ih-test/flower.png 5 --quoi="anatomie de la fleur" --niveau="Cycle 4"

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { extname, basename } from 'path';

// ── Stub DOM minimal : la chaîne du healer importe utils.js → notifications.js / translation.js qui
//    touchent `document` au chargement du module. On le pose AVANT tout import dynamique de ces modules.
//    `navigator` est en lecture seule dans Node ≥ 22 (déjà fourni) → on ne le réassigne pas.
const ensureGlobal = (name, val) => { try { if (typeof globalThis[name] === 'undefined') globalThis[name] = val; } catch { /* getter-only (ex. navigator) */ } };
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, setAttribute() {}, appendChild() {}, removeChild() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], remove() {}, focus() {} });
ensureGlobal('window', { location: { search: '' }, addEventListener() {}, matchMedia: () => ({ matches: false }) });
ensureGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
ensureGlobal('sessionStorage', { getItem: () => null, setItem() {}, removeItem() {} });
ensureGlobal('document', {
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  createElement: stubEl, createElementNS: stubEl, body: stubEl(), documentElement: stubEl(),
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, activeElement: null,
});
ensureGlobal('CustomEvent', class { constructor(t, o) { this.type = t; Object.assign(this, o); } });

// ── Imports DYNAMIQUES (après le stub) des modules Caramel RÉELS utilisés en prod ──
const { ENDPOINTS } = await import('../js/core/endpoints.js');
const Healer = await import('../js/h5p/json-healer.js');
const ImageHotspots = (await import('../js/h5p/processors/ImageHotspots.js')).default;

const REPO = process.cwd();
let OUT = '/tmp/ih-llm-test'; // affiné en sous-dossier par langue après lecture de la CLI

const SUBMIT = ENDPOINTS.llmSubmit;
const RESULT = ENDPOINTS.llmResult;
const VISION = ENDPOINTS.visionDetect;
const DEFAULT_LLM = 'mistral-small-4-119b';   // = DEFAULT_MODEL (ACTIVITY_MODEL_OVERRIDES vide pour ImageHotspots)
const VISION_MODEL = 'qwen-3.8-27b'; // = DEFAULT_VISION_MODEL (repli n8n sur qwen-3.6-35b-instruct)

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pct = (n, d) => d ? `${Math.round(100 * n / d)}%` : '—';

// ───────────────────────── CLI ─────────────────────────
const rawArgs = process.argv.slice(2);
const flags = {};
const pos = [];
for (const a of rawArgs) { const m = a.match(/^--([^=]+)=(.*)$/); if (m) flags[m[1]] = m[2]; else if (a.startsWith('--')) flags[a.slice(2)] = true; else pos.push(a); }
const IMAGE_PATH = pos[0] || `${REPO}/../../../private/tmp/ih-test/flower.png`;
const REPEATS = Math.max(1, parseInt(pos[1] || '5', 10));
const MODELS = (flags.models ? String(flags.models).split(',') : [DEFAULT_LLM, 'qwen-3.8-27b', 'gemma-4-31b']).map(s => s.trim()).filter(Boolean);
const CTX = { qui: flags.qui || 'un professeur de SVT', quoi: flags.quoi || 'légender les organes d\'une fleur', niveau: flags.niveau || 'Cycle 4 (collège)' };
const FORCE_COUNT = flags.count ? parseInt(flags.count, 10) : null;
const LANG = String(flags.lang || 'fr').toLowerCase();
const JUDGE_MODEL = flags.judge === true ? 'mistral-small-4-119b' : (flags.judge ? String(flags.judge) : null);

// Locale → on assemble le prompt depuis les MÊMES clés que prod, dans la langue cible.
let T;
try { T = JSON.parse(readFileSync(`${REPO}/js/locales/${LANG}.json`, 'utf8')); }
catch { console.error(`❌ Locale introuvable : js/locales/${LANG}.json`); process.exit(1); }
OUT = `${OUT}/${LANG}`; mkdirSync(OUT, { recursive: true });

// ───────────────── VISION (réplique services/hotspot-vision.js) ─────────────────
function dataUrlFromFile(path) {
  const buf = readFileSync(path);
  const ext = extname(path).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Dimensions réelles de l'image par lecture des en-têtes binaires (aucune dépendance npm).
// En prod, l'UI connaît width/height via l'élément <img> et les passe en imageMeta au prompt
// (ui.js → injectImageZonesIntoPrompt). Ici on les extrait des octets PNG/JPEG/GIF/WebP.
function readImageSize(buf) {
  // PNG : signature 8 octets puis chunk IHDR → width/height en uint32 big-endian (octets 16-23).
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG : on parcourt les marqueurs jusqu'à un SOFn (0xC0-0xCF sauf DHT 0xC4, JPG 0xC8, DAC 0xCC).
  if (buf.length > 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xFF) { off++; continue; }
      const marker = buf[off + 1];
      if (marker === 0xFF) { off++; continue; }                        // bourrage
      if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD9)) { off += 2; continue; } // sans payload
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return { width: buf.readUInt16BE(off + 7), height: buf.readUInt16BE(off + 5) };
      }
      off += 2 + len;
    }
    return null;
  }
  // GIF : "GIF87a"/"GIF89a" puis width/height en uint16 little-endian (octets 6-9).
  if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP : conteneur RIFF, chunks VP8X (étendu), VP8 (lossy) ou VP8L (lossless).
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    if (fourcc === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF };
    if (fourcc === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3FFF) + 1, height: ((b >> 14) & 0x3FFF) + 1 };
    }
  }
  return null;
}

// Réplique de buildLocalizedVisionPrompt (services/hotspot-vision.js) : prompt vision ENTIÈREMENT
// dans la langue cible (clé i18n `hotspot_vision_prompt`, placeholders {context}/{count}), suivi du
// schéma JSON littéral langue-neutre. Prod : envoyé en `body.prompt` ; si la clé locale manque,
// on n'envoie rien et le workflow retombe sur son prompt FR par défaut (même repli qu'en prod).
const VISION_JSON_SCHEMA = '{"imageDescription":"...","zones":[{"x":number,"y":number,"label":string,"description":string}]}';
function buildLocalizedVisionPrompt(context = {}, count) {
  const tpl = T && T.hotspot_vision_prompt;
  if (!tpl || typeof tpl !== 'string') return null;
  const ctxBlock = [context.qui, context.quoi, context.niveau]
    .map(s => (s || '').toString().trim()).filter(Boolean).join(' · ') || '—';
  const n = (count && count > 0) ? count : 5;
  return tpl.replace(/\{context\}/g, ctxBlock).replace(/\{count\}/g, String(n)) + '\n' + VISION_JSON_SCHEMA;
}

async function detectZones(imageDataUrl, { context, count, model = VISION_MODEL } = {}) {
  // Body IDENTIQUE à la prod (hotspot-vision.js detectImageZones) : image, context, lang (= langue
  // demandée par --lang, pas 'fr' figé), count si >0, model, puis prompt localisé si disponible.
  const body = { image: imageDataUrl, context, lang: LANG };
  if (count && count > 0) body.count = count;
  if (model) body.model = model;
  const localizedPrompt = buildLocalizedVisionPrompt(context, count);
  if (localizedPrompt) body.prompt = localizedPrompt;
  else console.log(`   ⚠ clé hotspot_vision_prompt absente de js/locales/${LANG}.json → repli sur le prompt FR du workflow (comme en prod)`);
  const c = new AbortController(); const id = setTimeout(() => c.abort(), 120000);
  let r;
  try { r = await fetch(VISION, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: c.signal }); }
  finally { clearTimeout(id); }
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`Vision HTTP ${r.status} ${r.statusText}${t ? ' — ' + t.slice(0, 200) : ''}`); }
  const data = await r.json().catch(() => null);
  if (!data || !Array.isArray(data.zones)) throw new Error(data && data.error ? `Vision: ${data.error}` : 'Vision: zones absentes');
  // Normalisation d'échelle identique au client (hotspot-vision.js, audit N9) : décision à la
  // MAJORITÉ (une aberrante isolée est clampée, pas divisée), `data.scale` fait foi s'il existe.
  const raw = data.zones.filter(z => z && typeof z === 'object');
  const vals = []; raw.forEach(z => { const x = +z.x, y = +z.y; if (Number.isFinite(x)) vals.push(Math.abs(x)); if (Number.isFinite(y)) vals.push(Math.abs(y)); });
  const maxV = vals.length ? Math.max(...vals) : 0;
  let div;
  const declaredScale = Number(data.scale);
  if (Number.isFinite(declaredScale) && declaredScale > 0) div = declaredScale / 100;
  else {
    const over = vals.filter(v => v > 100).length;
    div = over > vals.length / 2 ? 10 : (maxV > 0 && maxV <= 1 ? 0.01 : 1);
  }
  const toPct = v => { const n = +v; if (!Number.isFinite(n)) return 50; return Math.round(Math.max(0, Math.min(100, n / div)) * 10) / 10; };
  const zones = raw.map(z => ({ x: toPct(z.x), y: toPct(z.y), label: String(z.label || '').slice(0, 80), description: String(z.description || '').slice(0, 400) }));
  return { zones, imageDescription: String(data.imageDescription || data.description || ''), model: data.model || model };
}

// ───────────────── PROMPT (réplique prompt-generator.js : formatZonesForPrompt + buildActivityPrompt) ─────────────────
function formatZonesForPrompt(zones, imageMeta = null, imageDescription = '') {
  if (!Array.isArray(zones) || zones.length === 0) return '';
  const desc = (imageDescription || '').replace(/\s+/g, ' ').trim();
  const globalLine = desc ? `DESCRIPTION GLOBALE DE L'IMAGE : ${desc}\n\n` : '';
  const head = (imageMeta && imageMeta.width)
    ? `(Image de fond : ${imageMeta.width}×${imageMeta.height}px. Les positions x,y sont des POURCENTAGES 0–100 à RECOPIER tels quels.)\n\n`
    : '(Les positions x,y sont des POURCENTAGES 0–100 à RECOPIER tels quels.)\n\n';
  const lines = zones.map((z, i) => {
    const x = Number(z.x), y = Number(z.y);
    const xs = Number.isFinite(x) ? x.toFixed(1) : '?'; const ys = Number.isFinite(y) ? y.toFixed(1) : '?';
    const label = z.label ? `${z.label} — ` : '';
    const zdesc = (z.description || '').replace(/\s+/g, ' ').trim();
    return `Zone ${i + 1} — x=${xs}% y=${ys}% : ${label}${zdesc}`;
  });
  return (globalLine + head + lines.join('\n')).trim();
}
function buildActivityPrompt(prefix, { qui, quoi, niveau, nombreQuestions, ocrContent, isAdvanced }) {
  const pt = T;
  let ctx = (pt.prompt_contexte_pedagogique_commun || '')
    .replace(/\[QUI\]/g, qui || pt.prompt_fallback_teacher || 'un enseignant')
    .replace(/\[QUOI\]/g, quoi || pt.prompt_fallback_activity || 'créer une activité pédagogique');
  if (isAdvanced && niveau) ctx = ctx.replace(/\[NIVEAU\]/g, niveau);
  else ctx = ctx.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');

  let rs = pt[`${prefix}_regles_specifiques`] || '';
  if (nombreQuestions && nombreQuestions.toString().trim()) {
    rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, label, rapid, adv) => label + adv.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions))
           .replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
  } else {
    rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, label, rapid) => label + rapid);
  }
  const reglesPed = pt.prompt_regles_pedagogiques_communes || '';
  let sources = '';
  if (ocrContent && ocrContent.trim()) sources = (pt[`${prefix}_sources`] || pt.prompt_sources_communes || '').replace('[RAG]', ocrContent.trim());
  const structureJson = pt[`${prefix}_structure_json`] || '';
  const exempleRendu = pt[`${prefix}_exemple_rendu`] || '';
  let prompt = `# ${pt.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}\n${ctx}\n\n# ${pt.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}\n${rs}\n\n# ${pt.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}\n${reglesPed}\n`;
  if (sources) prompt += `\n# ${pt.prompt_header_sources || 'SOURCES'}\n${sources}\n`;
  prompt += `\n# ${pt.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}\n${structureJson}\n\n# ${pt.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}\n${exempleRendu}`;
  return prompt;
}
function buildImageHotspotsPrompt(zones, imageMeta, imageDescription, ctx, forceCount) {
  const isAdvanced = !!(ctx.niveau || forceCount);
  return buildActivityPrompt('prompt_image_hotspots', {
    qui: ctx.qui, quoi: ctx.quoi, niveau: ctx.niveau,
    nombreQuestions: forceCount ? String(forceCount) : null,
    ocrContent: formatZonesForPrompt(zones, imageMeta, imageDescription), isAdvanced,
  });
}

// ───────────────── LLM (submit/poll, réplique services/llm.js) ─────────────────
function extractJson(content) {
  const m = content.match(/```json\s*([\s\S]*?)\s*```/); if (m && m[1]) return m[1].trim();
  const fb = content.indexOf('{'), fk = content.indexOf('['); let s = fb > -1 && fk > -1 ? Math.min(fb, fk) : (fb > -1 ? fb : fk);
  if (s < 0) return content.trim();
  const c = content.substring(s); let d = 0, q = false, e = false, end = -1;
  for (let i = 0; i < c.length; i++) { const ch = c[i]; if (e) { e = false; continue; } if (ch === '\\' && q) { e = true; continue; } if (ch === '"') { q = !q; continue; } if (q) continue; if (ch === '{' || ch === '[') d++; if (ch === '}' || ch === ']') d--; if (d === 0) { end = i; break; } }
  return end > -1 ? c.substring(0, end + 1).trim() : c.trim();
}
async function callLLM(prompt, model) {
  const sub = await fetch(SUBMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model }) });
  if (!sub.ok) throw new Error('submit ' + sub.status);
  const { taskId } = await sub.json(); if (!taskId) throw new Error('no taskId');
  await sleep(5000); const t0 = Date.now(); let nf = 0;
  while (Date.now() - t0 < 240000) {
    let d; try { d = await (await fetch(RESULT + '?taskId=' + encodeURIComponent(taskId))).json(); } catch { await sleep(3000); continue; }
    if (d.status === 'done') return { content: d.content, model: d.model || model, seconds: Math.round((Date.now() - t0) / 1000), fb: d.fallback_level || 0, pt: d.prompt_tokens || 0, ct: d.completion_tokens || 0 };
    if (d.status === 'error') throw new Error('LLM: ' + (d.message || '?'));
    if (d.status === 'not_found') { if (++nf > 10) throw new Error('not_found'); await sleep(3000); continue; }
    await sleep(3000);
  }
  throw new Error('timeout');
}

// ───────────────── PIPELINE prod (heal + processeur RÉELS) ─────────────────
function runPipeline(rawContent) {
  let obj;
  try { obj = JSON.parse(rawContent); }
  catch { obj = JSON.parse(Healer.healJsonString(rawContent)); }
  const mk = 'ImageHotspots';
  obj = Healer.healJsonObject(obj, mk);
  if (typeof Healer.healActivitySpecificFields === 'function') obj = Healer.healActivitySpecificFields(obj, mk);
  obj = Healer.healStructureForActivity(obj, mk);
  const content = ImageHotspots.process(obj);
  return { intermediate: obj, content };
}

// ───────────────── VALIDATION ─────────────────
// Le prompt AUTORISE le Markdown gras/italique (`**`, `*`) et le HTML simple, mais INTERDIT les
// délimiteurs LaTeX `$...$` (doit être `\( ... \)`). On ne signale donc QUE le `$...$` fautif.
const BAD_LATEX = s => /(^|[^\\$])\$[^$\n]{1,}\$/.test(String(s || ''));

// Vérification de la LANGUE de sortie. Langues à écriture propre → ratio de caractères dans le script ;
// langues latines → score de mots-outils (la cible doit dominer ou être ~à égalité avec le 1er).
const SCRIPTS = { ar: /[؀-ۿ]/, zh: /[一-鿿]/, jp: /[぀-ヿ]/, el: /[Ͱ-Ͽ]/ };
const STOPWORDS = {
  fr: ['le', 'la', 'les', 'une', 'des', 'est', 'dans', 'que', 'qui', 'pour', 'avec', 'sur', 'sont', 'aux', 'du', 'ne', 'pas', 'cette', 'son', 'ses'],
  en: ['the', 'is', 'are', 'of', 'and', 'to', 'in', 'with', 'this', 'that', 'its', 'for', 'on', 'at', 'by', 'which', 'from'],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'que', 'en', 'es', 'con', 'para', 'por', 'su', 'del', 'al', 'se', 'como'],
  de: ['der', 'die', 'das', 'und', 'ist', 'den', 'dem', 'ein', 'eine', 'mit', 'für', 'von', 'im', 'auf', 'des', 'zu', 'sich', 'sind'],
  it: ['il', 'la', 'le', 'gli', 'un', 'una', 'di', 'che', 'in', 'con', 'per', 'del', 'della', 'si', 'sono', 'come', 'dei'],
  nl: ['de', 'het', 'een', 'en', 'is', 'van', 'met', 'voor', 'op', 'die', 'dat', 'zijn', 'te', 'wordt', 'door'],
  pt: ['os', 'as', 'um', 'uma', 'de', 'que', 'em', 'com', 'para', 'por', 'do', 'da', 'dos', 'das', 'se', 'como', 'é', 'são'],
};
function langCheck(texts, lang) {
  const joined = texts.join(' ');
  if (SCRIPTS[lang]) {
    const total = (joined.match(/[^\s\d\p{P}]/gu) || []).length || 1;
    const hit = (joined.match(new RegExp(SCRIPTS[lang].source, 'gu')) || []).length;
    const ratio = hit / total;
    return { ok: ratio > 0.25, detected: ratio > 0.25 ? lang : '?', info: `${Math.round(ratio * 100)}% script` };
  }
  const b = ' ' + joined.toLowerCase() + ' ';
  const score = {};
  for (const [l, ws] of Object.entries(STOPWORDS)) score[l] = ws.reduce((n, w) => n + (b.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length, 0);
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const detected = ranked[0][1] > 0 ? ranked[0][0] : '?';
  const ok = detected === lang || (score[lang] > 0 && score[lang] >= ranked[0][1] * 0.6);
  return { ok, detected, info: `${lang}:${score[lang] || 0} vs ${detected}:${ranked[0][1]}` };
}

// ── Juge LLM de PERTINENCE pédagogique (lit zones + image + points générés → score) ──
// On donne au juge le NOM complet de la langue (pas le code "el"/"jp" qu'il confond avec l'espagnol/autre).
const LANG_NAMES = { fr: 'français', en: 'anglais', es: 'espagnol', de: 'allemand', it: 'italien', nl: 'néerlandais', pt: 'portugais', ar: 'arabe', zh: 'chinois (mandarin)', jp: 'japonais', el: 'grec' };
function buildJudgePrompt(intermediate, vision, lang) {
  const langName = LANG_NAMES[lang] || lang;
  const zones = vision.zones.map((z, i) => `Zone ${i + 1} (x=${z.x},y=${z.y}) [${z.label}] : ${z.description}`).join('\n');
  const points = (intermediate.hotspots || []).map((h, i) => {
    const x = h.x !== undefined ? h.x : (h.position ? h.position.x : '?');
    const y = h.y !== undefined ? h.y : (h.position ? h.position.y : '?');
    return `Point ${i + 1} (x=${x},y=${y}) « ${h.header} » : ${String(h.text || '').replace(/<[^>]+>/g, '')}`;
  }).join('\n');
  return `Tu es un évaluateur pédagogique rigoureux et sévère. On a généré une activité « Image interactive » : à partir de ZONES détectées dans une image, un POINT (titre + explication) a été rédigé pour chaque zone.

IMAGE (description globale) : ${vision.imageDescription || '(non fournie)'}
LANGUE ATTENDUE des points : ${langName}

ZONES détectées :
${zones}

POINTS générés :
${points}

Évalue la PERTINENCE réelle. Pour CHAQUE point, juge en booléens :
- relevant : le point correspond bien à SA zone (même sujet/position) ;
- accurate : contenu factuellement et scientifiquement EXACT (signale toute erreur) ;
- grounded : rien d'inventé qui ne soit présent dans l'image/les zones ;
- lang_ok : rédigé dans la langue attendue ci-dessus.
Donne un "overall" /10 (sois exigeant : 10 = parfait, 7 = correct, <5 = problèmes réels) et un "verdict" court.
Réponds UNIQUEMENT en JSON, sans texte autour :
{"overall":<0-10>,"verdict":"<phrase>","points":[{"i":1,"relevant":true,"accurate":true,"grounded":true,"lang_ok":true,"issue":""}],"global_issues":[]}`;
}
async function judgeOne(intermediate, vision, lang, model) {
  const r = await callLLM(buildJudgePrompt(intermediate, vision, lang), model);
  return JSON.parse(extractJson(r.content));
}
function near(a, b, tol = 1.0) { return Number.isFinite(+a) && Number.isFinite(+b) && Math.abs(+a - +b) <= tol; }

function validateVision(zones) {
  const issues = [];
  if (!zones.length) issues.push('aucune zone détectée');
  if (zones.length < 3 || zones.length > 10) issues.push(`nb zones inhabituel (${zones.length})`);
  zones.forEach((z, i) => {
    if (!(z.x >= 0 && z.x <= 100)) issues.push(`zone${i + 1}.x hors [0,100] (${z.x})`);
    if (!(z.y >= 0 && z.y <= 100)) issues.push(`zone${i + 1}.y hors [0,100] (${z.y})`);
    if (!z.description) issues.push(`zone${i + 1} sans description`);
  });
  return issues;
}

function validateGeneration(intermediate, content, zones) {
  const issues = [], warns = [], texts = [];
  const hs = Array.isArray(intermediate.hotspots) ? intermediate.hotspots : null;
  if (!hs) { issues.push('hotspots[] absent du JSON LLM'); return { issues, warns, n: 0, lang: '?' }; }

  // Règle « 1 point par zone »
  if (hs.length !== zones.length) warns.push(`nb hotspots (${hs.length}) ≠ nb zones (${zones.length})`);

  hs.forEach((h, i) => {
    const w = `H${i + 1}`;
    const x = h.x !== undefined ? +h.x : (h.position ? +h.position.x : NaN);
    const y = h.y !== undefined ? +h.y : (h.position ? +h.position.y : NaN);
    if (!(x >= 0 && x <= 100)) issues.push(`${w}.x hors [0,100] (${x})`);
    if (!(y >= 0 && y <= 100)) issues.push(`${w}.y hors [0,100] (${y})`);
    // Recopie des positions de la zone correspondante (rule: RECOPIE EXACTEMENT)
    const z = zones[i];
    if (z && !(near(x, z.x, 1.0) && near(y, z.y, 1.0))) warns.push(`${w} position non recopiée (LLM ${x},${y} vs zone ${z.x},${z.y})`);
    const header = String(h.header || '').trim();
    const text = String(h.text || '').trim();
    if (!header) issues.push(`${w} header vide`);
    else if (header.split(/\s+/).length > 6) warns.push(`${w} header long (${header.split(/\s+/).length} mots): "${header}"`);
    if (!text) issues.push(`${w} text vide`);
    if (BAD_LATEX(text)) warns.push(`${w} délimiteur LaTeX $...$ interdit (utiliser \\( \\))`);
    texts.push(header, text);
  });

  if (!intermediate.title) warns.push('title absent');
  if (intermediate.image !== undefined) issues.push('champ image présent (interdit — injecté par l\'UI)');
  if (intermediate.globalColor && !/^#[0-9a-fA-F]{3,8}$/.test(intermediate.globalColor)) warns.push(`globalColor non hex (${intermediate.globalColor})`);

  // content.json final (post-processeur)
  const ch = Array.isArray(content.hotspots) ? content.hotspots : [];
  if (ch.length !== hs.length) issues.push(`processeur: ${ch.length} hotspots vs ${hs.length} en entrée`);
  ch.forEach((h, i) => {
    const w = `C${i + 1}`;
    if (!(h.position && h.position.x >= 0 && h.position.x <= 100 && h.position.y >= 0 && h.position.y <= 100)) issues.push(`${w} position invalide`);
    const c0 = Array.isArray(h.content) ? h.content[0] : null;
    if (!c0) issues.push(`${w} content[] vide`);
    else {
      if (c0.library !== 'H5P.Text 1.1') issues.push(`${w} library inattendue (${c0.library})`);
      if (!c0.subContentId) issues.push(`${w} subContentId manquant`);
      if (!(c0.params && String(c0.params.text || '').trim())) issues.push(`${w} params.text vide`);
    }
  });
  if (!content.globalIconType) warns.push('content.globalIconType absent');

  const lc = langCheck(texts.filter(Boolean), LANG);
  if (!lc.ok) issues.push(`langue inattendue : cible "${LANG}", détecté "${lc.detected}" (${lc.info})`);
  return { issues, warns, n: hs.length, lang: lc.detected, langOk: lc.ok };
}

// ───────────────────────── MAIN ─────────────────────────
console.log('\n════════════════════════════════════════════════════════════════');
console.log('  QA « Image interactive » (H5P.ImageHotspots) — workflows prod -bas');
console.log('════════════════════════════════════════════════════════════════');
console.log(`Endpoints :\n  vision = ${VISION}\n  submit = ${SUBMIT}\n  result = ${RESULT}`);
console.log(`Image     : ${IMAGE_PATH}`);
console.log(`Langue    : ${LANG}  (prompt assemblé depuis js/locales/${LANG}.json)`);
console.log(`Contexte  : ${CTX.qui} / ${CTX.quoi}${CTX.niveau ? ' / ' + CTX.niveau : ''}${FORCE_COUNT ? ` / ${FORCE_COUNT} points` : ''}`);
console.log(`Modèles   : ${MODELS.join(', ')}  |  répétitions/​modèle (défaut) = ${REPEATS}${JUDGE_MODEL ? `  |  juge pertinence = ${JUDGE_MODEL}` : ''}`);

let imageDataUrl;
try { imageDataUrl = dataUrlFromFile(IMAGE_PATH); }
catch (e) { console.error(`\n❌ Image illisible (${IMAGE_PATH}) : ${e.message}`); process.exit(1); }

// 1) VISION ───────────────────────────────────────────────
console.log('\n── 1. VISION (détection des zones) ──');
let vision;
try {
  const t0 = Date.now();
  vision = await detectZones(imageDataUrl, { context: CTX, count: FORCE_COUNT, model: VISION_MODEL });
  const visIssues = validateVision(vision.zones);
  console.log(`${visIssues.length ? '🐞' : '✅'} ${vision.zones.length} zones en ${Math.round((Date.now() - t0) / 1000)}s (modèle ${vision.model})`);
  vision.zones.forEach((z, i) => console.log(`   Zone ${i + 1}: x=${z.x} y=${z.y}  ${z.label ? '[' + z.label + '] ' : ''}${z.description.slice(0, 70)}`));
  if (vision.imageDescription) console.log(`   Description globale : ${vision.imageDescription.slice(0, 120)}`);
  visIssues.forEach(x => console.log('   🐞 VISION ' + x));
  writeFileSync(`${OUT}/vision.json`, JSON.stringify(vision, null, 2));
} catch (e) {
  console.error(`❌ VISION échec : ${e.message}`);
  console.error('   → impossible de poursuivre la chaîne complète (zones requises pour le prompt). Arrêt.');
  process.exit(2);
}

// Dimensions réelles de l'image, comme en prod (ui.js passe { width, height } de l'image chargée
// à buildImageHotspotsPrompt → en-tête SOURCES « Image de fond : W×Hpx »). Repli null si en-tête illisible.
const imageMeta = readImageSize(readFileSync(IMAGE_PATH));
if (imageMeta) console.log(`Image     : ${imageMeta.width}×${imageMeta.height}px (en-tête SOURCES comme en prod)`);
else console.log('⚠ Dimensions image illisibles (en-tête binaire) → en-tête SOURCES sans W×H (prod les enverrait)');
const prompt = buildImageHotspotsPrompt(vision.zones, imageMeta, vision.imageDescription, CTX, FORCE_COUNT);
writeFileSync(`${OUT}/prompt.txt`, prompt);
console.log(`\n── 2. PROMPT assemblé (${prompt.length} chars) → ${OUT}/prompt.txt ──`);

// 2) GÉNÉRATION RÉPÉTÉE ───────────────────────────────────
console.log('\n── 3. GÉNÉRATION (LLM → healer → processeur → validation) ──');
const stats = {};
const generated = []; // {tag, intermediate} des runs OK — pour le juge de pertinence
async function oneRun(model, tag) {
  try {
    const r = await callLLM(prompt, model);
    let pipe;
    try { pipe = runPipeline(r.content); }
    catch (e) { console.log(`🐞 ${tag} (${r.seconds}s) → pipeline KO : ${e.message}`); (stats[model] ??= { ok: 0, ko: 0 }).ko++; writeFileSync(`${OUT}/${tag}.raw.txt`, r.content); return; }
    const v = validateGeneration(pipe.intermediate, pipe.content, vision.zones);
    const ok = v.issues.length === 0;
    (stats[model] ??= { ok: 0, ko: 0 })[ok ? 'ok' : 'ko']++;
    const fbTag = r.fb ? ` (→ fallback niv.${r.fb} = ${r.model})` : '';
    console.log(`${ok ? '✅' : '🐞'} ${tag}${fbTag} (${r.seconds}s, ${r.ct} tok) | ${v.n} points, langue ${v.lang}${v.langOk ? '' : ' ⚠'}${v.warns.length ? `, ${v.warns.length} warn` : ''}`);
    v.issues.forEach(x => console.log('     🐞 ' + x));
    v.warns.forEach(x => console.log('     ⚠  ' + x));
    writeFileSync(`${OUT}/${tag}.intermediate.json`, JSON.stringify(pipe.intermediate, null, 2));
    writeFileSync(`${OUT}/${tag}.content.json`, JSON.stringify(pipe.content, null, 2));
    if (ok) generated.push({ tag, intermediate: pipe.intermediate });
  } catch (e) {
    (stats[model] ??= { ok: 0, ko: 0 }).ko++;
    console.log(`❌ ${tag} → ${e.message}`);
  }
}

// Modèle par défaut : REPEATS runs (fiabilité). Autres modèles featured : 1 run (robustesse cross-modèle).
for (let i = 0; i < REPEATS; i++) { await oneRun(DEFAULT_LLM, `${DEFAULT_LLM}#${i + 1}`); await sleep(1200); }
for (const m of MODELS.filter(m => m !== DEFAULT_LLM)) { await oneRun(m, `${m}#1`); await sleep(1200); }

// 3) PERTINENCE (juge LLM) ────────────────────────────────
let judgeAvg = null;
if (JUDGE_MODEL && generated.length) {
  console.log(`\n── 4. PERTINENCE (juge LLM = ${JUDGE_MODEL}, sur ${Math.min(generated.length, 8)} activité(s)) ──`);
  const sample = generated.slice(0, 8); // plafonne le coût du juge
  const scores = [];
  for (const g of sample) {
    try {
      const j = await judgeOne(g.intermediate, vision, LANG, JUDGE_MODEL);
      const ov = Number(j.overall); if (Number.isFinite(ov)) scores.push(ov);
      const bad = (j.points || []).filter(p => !(p.relevant && p.accurate && p.grounded && p.lang_ok));
      console.log(`   ${g.tag}: ${j.overall}/10 — ${j.verdict || ''}`);
      bad.forEach(p => console.log(`      ⚠ point ${p.i}: ${p.issue || '—'} [rel=${p.relevant} exact=${p.accurate} fondé=${p.grounded} langue=${p.lang_ok}]`));
      (j.global_issues || []).forEach(x => console.log(`      ⚠ ${x}`));
      writeFileSync(`${OUT}/${g.tag}.judge.json`, JSON.stringify(j, null, 2));
    } catch (e) { console.log(`   ${g.tag}: juge KO (${e.message})`); }
    await sleep(1200);
  }
  if (scores.length) { judgeAvg = scores.reduce((a, b) => a + b, 0) / scores.length; console.log(`   ➜ Pertinence moyenne : ${judgeAvg.toFixed(1)}/10 (${scores.length} jugée(s))`); }
}

// 4) BILAN ────────────────────────────────────────────────
console.log('\n════════════════════════ BILAN ════════════════════════');
let totOk = 0, totN = 0;
for (const [m, s] of Object.entries(stats)) { const n = s.ok + s.ko; totOk += s.ok; totN += n; console.log(`  ${m.padEnd(24)} : ${s.ok}/${n} OK (${pct(s.ok, n)})`); }
console.log(`  ${'TOTAL'.padEnd(24)} : ${totOk}/${totN} OK (${pct(totOk, totN)})`);
if (judgeAvg !== null) console.log(`  ${'PERTINENCE (juge)'.padEnd(24)} : ${judgeAvg.toFixed(1)}/10`);
console.log(`\nSorties JSON/prompt dans ${OUT}/`);
process.exit(totOk === totN ? 0 : 1);
