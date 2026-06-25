// scripts/test-interactive-video-llm.mjs
// QA E2E de la Vidéo interactive : récupère la transcription RÉELLE d'une vidéo (réplique la cascade
// PeerTube / PodEduc / YouTube de js/services/video-transcript.js), assemble le prompt comme Caramel,
// appelle le VRAI LLM (proxy n8n, appels facturés) sur Mistral / Qwen / GPT-OSS, puis valide la sortie :
// timestamps réels & dans la durée, marqueurs *mot* des Blanks, résidu Markdown dans les feedbacks,
// langue des questions. Écrit les JSON dans /tmp/iv-llm-test/.
//
// Usage : node scripts/test-interactive-video-llm.mjs "<url-vidéo>" ["<discipline>"] ["<objectif>"] ["<niveau>"]
//   ex : node scripts/test-interactive-video-llm.mjs "https://tube-...apps.education.fr/w/xxxx" "Anglais" "Compréhension orale" "Lycée"
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
// Mêmes fonctions DÉTERMINISTES que la prod (processeur + ui.js) : on les importe pour mesurer
// la sortie RÉELLE livrée à l'utilisateur (timestamps calés + nombre plafonné), pas seulement la
// sortie brute du modèle. Module pur, sans dépendance navigateur → importable en Node.
import { snapInteractions, capInteractions } from '../js/h5p/processors/interactive-video-snap.js';

const REPO = process.cwd();
const OUT = '/tmp/iv-llm-test'; mkdirSync(OUT, { recursive: true });
const T = JSON.parse(readFileSync(REPO + '/js/locales/fr.json', 'utf8'));
const WEBHOOK = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-dev2';
const SUBMIT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/submit-dev2';
const RESULT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/result-dev2';
const MODELS = ['mistral-small-4-119b', 'qwen-3.6-35b-instruct', 'gpt-oss-120b'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchTO(url, opts = {}, to = 30000) { const c = new AbortController(); const id = setTimeout(() => c.abort(), to); try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(id); } }

// ===================== TRANSCRIPTION (cascade répliquée) =====================
function collectRenditions(v) {
  const out = []; const collect = (files, kind) => { if (!Array.isArray(files)) return; for (const f of files) { const rid = f?.resolution?.id; const url = f?.fileUrl || f?.fileDownloadUrl; if (!url || typeof rid !== 'number') continue; if (rid > 0) out.push({ url, resolution: rid, kind }); else if (rid === 0 && kind === 'progressive') out.push({ url, resolution: 0, kind: 'audio' }); } };
  collect(v?.files, 'progressive'); if (Array.isArray(v?.streamingPlaylists)) for (const sp of v.streamingPlaylists) collect(sp?.files, 'hls'); out.sort((a, b) => a.resolution - b.resolution); return out;
}
const albertCandidates = l => { const a = (l || []).filter(r => r.kind === 'audio'); const h = (l || []).filter(r => r.kind === 'hls').sort((x, y) => x.resolution - y.resolution); const p = (l || []).filter(r => r.kind === 'progressive').sort((x, y) => x.resolution - y.resolution); return [...a, ...h, ...p]; };
async function albert(mediaUrl, language, range = null, initRange = null, initUrl = null) {
  const payload = { mediaUrl, language }; if (range) payload.range = range; if (initRange) { payload.initRange = initRange; if (initUrl) payload.initUrl = initUrl; }
  const r = await fetchTO(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 200000);
  if (!r.ok) return { error: 'albert_http_' + r.status }; const d = await r.json().catch(() => null); if (!d) return { error: 'albert_bad_json' };
  const segments = (Array.isArray(d.segments) ? d.segments : []).map(s => ({ start: +s.start || 0, end: +s.end || 0, text: String(s.text || '').trim() })).filter(s => s.text);
  return { language: d.language || language, duration: d.duration != null ? +d.duration : (segments.at(-1)?.end ?? null), segments };
}
async function lowestHlsVariant(masterUrl) {
  try { const r = await fetchTO(masterUrl, {}, 15000); if (!r.ok) return masterUrl; const txt = await r.text(); if (!/#EXT-X-STREAM-INF/i.test(txt)) return masterUrl;
    const lines = txt.split(/\r?\n/), vs = []; for (let i = 0; i < lines.length; i++) { if (!/^#EXT-X-STREAM-INF:/i.test(lines[i])) continue; const res = (lines[i].match(/RESOLUTION=\d+x(\d+)/i) || [])[1]; let uri = null; for (let j = i + 1; j < lines.length; j++) { const l = lines[j].trim(); if (l && !l.startsWith('#')) { uri = l; break; } } if (uri) vs.push({ res: +res || 0, uri }); }
    if (!vs.length) return masterUrl; vs.sort((a, b) => a.res - b.res); try { return new URL(vs[0].uri, masterUrl).href; } catch { return vs[0].uri; }
  } catch { return masterUrl; }
}
async function hlsChunks(planUrl, language, fallbackSrc) {
  const r = await fetchTO(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hlsPlanUrl: planUrl }) }, 40000);
  const plan = r.ok ? await r.json().catch(() => null) : null;
  if (!plan?.tsUrl || !Array.isArray(plan.chunks) || !plan.chunks.length) return fallbackSrc ? albert(fallbackSrc, language) : { error: 'hls_no_plan' };
  const all = []; for (let i = 0; i < plan.chunks.length; i++) { const c = plan.chunks[i]; process.stdout.write(`  transcription lot ${i + 1}/${plan.chunks.length}\r`); const t = await albert(plan.tsUrl, language, c.range, plan.initRange || null, plan.initUrl || null); if (t.error || !t.segments?.length) continue; const base = Math.min(...t.segments.map(s => s.start)); const off = +c.offset || 0; for (const s of t.segments) all.push({ start: +(s.start - base + off).toFixed(3), end: +(s.end - base + off).toFixed(3), text: s.text }); }
  process.stdout.write('\n'); if (!all.length) return { error: 'albert_empty' }; all.sort((a, b) => a.start - b.start);
  return { language, duration: plan.duration || all.at(-1).end, segments: all };
}
function platform(url) { const u = new URL(url); if (/youtube\.com|youtu\.be/.test(u.host)) return 'youtube'; if (/podeduc\.apps\.education\.fr/.test(u.host)) return 'podeduc'; if (/\/w\/|\/videos\/watch\//.test(u.pathname)) return 'peertube'; return 'unknown'; }
async function fetchTranscript(url) {
  const p = platform(url);
  if (p === 'peertube') {
    const u = new URL(url); const id = (u.pathname.match(/\/w\/([\w-]+)/) || u.pathname.match(/\/videos\/watch\/([\w-]+)/))[1]; const origin = u.origin;
    const v = await (await fetchTO(`${origin}/api/v1/videos/${id}`)).json();
    const lang = v?.language?.id || 'fr'; const dur = v.duration; const renditions = collectRenditions(v);
    // sous-titres si dispo
    try { const cap = await (await fetchTO(`${origin}/api/v1/videos/${id}/captions`)).json(); const list = cap?.data || []; if (list.length) { const ch = list.find(c => (c?.language?.id || '').startsWith('fr')) || list[0]; const cu = ch?.fileUrl || (ch?.captionPath ? origin + ch.captionPath : null); if (cu) { const vtt = await (await fetchTO(cu)).text(); const seg = parseVtt(vtt); if (seg.length) return { language: ch?.language?.id || lang, duration: dur, segments: seg, captionUrl: cu }; } } } catch {}
    const master = (v.streamingPlaylists || []).find(sp => sp?.playlistUrl)?.playlistUrl || null;
    if (dur > 1020 && master) { const c = await hlsChunks(await lowestHlsVariant(master), lang, renditions[0]?.url); if (!c.error) return c; }
    for (const r of albertCandidates(renditions)) { const t = await albert(r.url, lang); if (!t.error && t.segments?.length) return t; }
    if (master) return hlsChunks(await lowestHlsVariant(master), lang, renditions[0]?.url);
    return { error: 'no_rendition' };
  }
  if (p === 'podeduc') {
    const det = await (await fetchTO(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }, 40000)).json();
    if (!det?.playable || !det.videoSource?.url) return { error: 'podeduc_no_media' };
    const src = new URL(det.videoSource.url, url).href; return hlsChunks(src.replace(/\.mp4(\?.*)?$/i, '.m3u8$1'), 'fr', src);
  }
  if (p === 'youtube') {
    const r = await fetchTO(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ youtubeUrl: url, language: 'fr', audio: true }) }, 290000);
    if (!r.ok) return { error: 'yt_http_' + r.status }; const d = await r.json().catch(() => null);
    const segments = (Array.isArray(d?.segments) ? d.segments : []).map(s => ({ start: +s.start || 0, end: +s.end || 0, text: String(s.text || '').trim() })).filter(s => s.text);
    if (!segments.length) return { error: d?.error || 'yt_empty' };
    return { language: d.language || 'fr', duration: d.duration != null ? +d.duration : segments.at(-1).end, segments };
  }
  return { error: 'unsupported_platform' };
}
function parseVtt(raw) { const segs = []; const blocks = String(raw).replace(/\r/g, '').split(/\n{2,}/); const TIM = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/; const toS = ts => { const p = ts.replace(',', '.').split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; }; for (const b of blocks) { const ls = b.split('\n').filter(l => l.trim()); const i = ls.findIndex(l => TIM.test(l)); if (i < 0) continue; const [a, c] = ls[i].split('-->').map(x => x.trim().split(/\s+/)[0]); const txt = ls.slice(i + 1).map(l => l.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' '); if (txt) segs.push({ start: toS(a), end: toS(c), text: txt }); } return segs; }

// ===================== PROMPT + LLM (réplique buildVideoInteractivePrompt) =====================
const MMSS = t => { t = Math.max(0, Math.floor(+t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
function formatTranscript(segments, maxLines = 300) { let it = segments.map(s => ({ ts: +s.start || 0, text: String(s.text || '').replace(/\s+/g, ' ').trim() })).filter(s => s.text); if (!it.length) return ''; if (it.length > maxLines) { const gs = Math.ceil(it.length / maxLines), g = []; for (let i = 0; i < it.length; i += gs) { const c = it.slice(i, i + gs); g.push({ ts: c[0].ts, text: c.map(x => x.text).join(' ') }); } it = g; } return it.map(l => `[${MMSS(l.ts)}] ${l.text}`).join('\n'); }
// Ancres présentées au modèle (mêmes secondes `[mm:ss]` que formatTranscript, après regroupement) — cf. getTranscriptAnchors().
function promptAnchors(segments, maxLines = 300) { let it = segments.map(s => ({ ts: +s.start || 0, text: String(s.text || '').replace(/\s+/g, ' ').trim() })).filter(s => s.text); if (!it.length) return []; if (it.length > maxLines) { const gs = Math.ceil(it.length / maxLines), g = []; for (let i = 0; i < it.length; i += gs) g.push({ ts: it[i].ts }); it = g; } return it.map(l => Math.max(0, Math.floor(+l.ts || 0))); }
const toBoolH = v => typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : (typeof v === 'string' ? !['false', 'faux', 'non', 'no', '0', 'f', 'n', ''].includes(v.trim().toLowerCase()) : !!v));
// Réplique stripFeedbackMarkdown du processeur (les feedbacks sont rendus tels quels par H5P).
const stripFb = t => (!t || typeof t !== 'string') ? t : t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\n]+?)\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/~~([^~]+)~~/g, '$1').trim();
// Applique au JSON intermédiaire les transformations DÉTERMINISTES du processeur (TrueFalse→bool, strip feedback).
function applyProcessorTransforms(it) {
  const ty = String(it.type || '').toLowerCase();
  if (ty === 'truefalse') return { ...it, correct: toBoolH(it.correct), feedbackOnCorrect: stripFb(it.feedbackOnCorrect), feedbackOnWrong: stripFb(it.feedbackOnWrong) };
  if (ty === 'multichoice' && Array.isArray(it.answers)) return { ...it, answers: it.answers.map(a => ({ ...a, feedback: stripFb(a.feedback), chosenFeedback: stripFb(a.chosenFeedback), notChosenFeedback: stripFb(a.notChosenFeedback) })) };
  return it;
}
function assemblePrompt(transcript, { qui, quoi, niveau, nombre }) {
  let ctx = T.prompt_contexte_pedagogique_commun.replace(/\[QUI\]/g, qui).replace(/\[QUOI\]/g, quoi);
  if (niveau) ctx = ctx.replace(/\[NIVEAU\]/g, niveau); else ctx = ctx.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');
  let rs = T.prompt_interactive_video_regles_specifiques;
  if (nombre) rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, l, r, a) => l + a.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombre)).replace(/\[NOMBRE_ELEMENTS\]/g, nombre);
  else rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, l, r) => l + r);
  const dur = transcript.duration; const header = dur ? `(Durée de la vidéo : ${Math.round(dur)} secondes — tous les "timestamp" doivent rester dans cet intervalle)\n\n` : '';
  const sources = (T.prompt_interactive_video_sources || T.prompt_sources_communes).replace('[RAG]', (header + formatTranscript(transcript.segments)).trim());
  return `# ${T.prompt_header_pedagogical_context}\n${ctx}\n\n# ${T.prompt_header_specific_rules}\n${rs}\n\n# ${T.prompt_header_pedagogical_rules}\n${T.prompt_regles_pedagogiques_communes}\n\n# ${T.prompt_header_sources}\n${sources}\n\n# ${T.prompt_header_json_structure}\n${T.prompt_interactive_video_structure_json}\n\n# ${T.prompt_header_rendering_example}\n${T.prompt_interactive_video_exemple_rendu}`;
}
function extractJson(content) { const m = content.match(/```json\s*([\s\S]*?)\s*```/); if (m && m[1]) return m[1].trim(); const fb = content.indexOf('{'), fk = content.indexOf('['); let s = fb > -1 && fk > -1 ? Math.min(fb, fk) : (fb > -1 ? fb : fk); if (s < 0) return content.trim(); const c = content.substring(s); let d = 0, q = false, e = false, end = -1; for (let i = 0; i < c.length; i++) { const ch = c[i]; if (e) { e = false; continue; } if (ch === '\\' && q) { e = true; continue; } if (ch === '"') { q = !q; continue; } if (q) continue; if (ch === '{' || ch === '[') d++; if (ch === '}' || ch === ']') d--; if (d === 0) { end = i; break; } } return end > -1 ? c.substring(0, end + 1).trim() : c.trim(); }
async function callLLM(prompt, model) { const sub = await fetch(SUBMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model }) }); if (!sub.ok) throw new Error('submit ' + sub.status); const { taskId } = await sub.json(); if (!taskId) throw new Error('no taskId'); await sleep(5000); const t0 = Date.now(); let nf = 0; while (Date.now() - t0 < 240000) { let d; try { d = await (await fetch(RESULT + '?taskId=' + encodeURIComponent(taskId))).json(); } catch { await sleep(3000); continue; } if (d.status === 'done') return { content: d.content, model: d.model, seconds: Math.round((Date.now() - t0) / 1000) }; if (d.status === 'error') throw new Error('LLM: ' + (d.message || '?')); if (d.status === 'not_found') { if (++nf > 10) throw new Error('not_found'); await sleep(3000); continue; } await sleep(3000); } throw new Error('timeout'); }

// ===================== VALIDATION =====================
const MD = s => /\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\\\(|\\\[|~~|\]\([^)]+\)/.test(String(s || ''));
function detectLang(texts) { const b = ' ' + texts.join(' ').toLowerCase() + ' '; const fr = (b.match(/\b(le|la|les|une|des|est|dans|que|qui|pour|avec|sur|vous|quelle|quel|comment|pourquoi|au|aux|du|ne|pas|sont|selon)\b/g) || []).length; const en = (b.match(/\b(the|is|are|what|which|who|how|why|does|do|of|and|to|in|with|you|on|at|for|according)\b/g) || []).length; return fr > en * 1.3 ? 'FR' : (en > fr * 1.3 ? 'EN' : 'mixte'); }
function validate(json, transcript) {
  const issues = [], warns = [], types = {}; const realTs = new Set(transcript.segments.map(s => Math.floor(+s.start || 0))); const dur = transcript.duration || Infinity; const q = [];
  if (!Array.isArray(json.interactions)) { issues.push('pas d interactions[]'); return { issues, warns, n: 0, types, lang: '?', summary: false }; }
  let prev = -1;
  json.interactions.forEach((it, i) => { const w = `Q${i + 1}@${it.timestamp}s`; const ty = String(it.type || '').toLowerCase(); types[ty] = (types[ty] || 0) + 1; const ts = +it.timestamp;
    if (!Number.isFinite(ts)) issues.push(`${w} timestamp invalide`); else { if (ts <= 0) issues.push(`${w} timestamp ≤ 0`); if (ts > dur + 2) issues.push(`${w} HORS-DURÉE (>${Math.round(dur)})`); if (![...realTs].some(r => Math.abs(r - ts) <= 1)) warns.push(`${w} timestamp non réel`); if (ts <= prev) issues.push(`${w} ordre non croissant`); prev = ts; }
    if (it.question) q.push(String(it.question));
    if (ty === 'multichoice') { const a = it.answers || []; if (!a.some(x => x.correct === true)) issues.push(`${w} aucune bonne réponse`); a.forEach(x => { if (MD(x.feedback)) issues.push(`${w} MARKDOWN feedback`); x.text && q.push(String(x.text)); }); }
    else if (ty === 'truefalse') { if (typeof it.correct !== 'boolean') warns.push(`${w} correct non booléen`); if (MD(it.feedbackOnCorrect) || MD(it.feedbackOnWrong)) issues.push(`${w} MARKDOWN feedback`); }
    else if (ty === 'blanks') { const t = it.text || (Array.isArray(it.questions) ? it.questions.join(' ') : ''); if (!/\*[^*\s][^*]*\*/.test(t)) issues.push(`${w} BLANKS sans marqueur *mot*`); t && q.push(String(t)); }
    else issues.push(`${w} type inconnu (${ty})`);
  });
  const sm = json.summary; const hasSummary = !!(sm && Array.isArray(sm.statements) && sm.statements.length); if (hasSummary) sm.statements.flat().forEach(s => q.push(String(s)));
  return { issues, warns, n: json.interactions.length, types, lang: detectLang(q), summary: hasSummary };
}

// ===================== MAIN =====================
const [url, qui = 'Enseignant', quoi = 'créer une vidéo interactive sur ce contenu', niveau = ''] = process.argv.slice(2);
if (!url) { console.error('Usage : node scripts/test-interactive-video-llm.mjs "<url>" ["discipline"] ["objectif"] ["niveau"]'); process.exit(1); }
console.log(`\n🎬 Transcription de ${url} …`);
const transcript = await fetchTranscript(url);
if (transcript.error) { console.error('❌ Transcription impossible : ' + transcript.error); process.exit(1); }
console.log(`✅ ${transcript.segments.length} segments, langue=${transcript.language}, durée=${Math.round(transcript.duration)}s`);
writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
const prompt = assemblePrompt(transcript, { qui, quoi, niveau, nombre: '' });
console.log(`\n📝 Contexte : ${qui} / ${quoi}${niveau ? ' / ' + niveau : ''}\n`);
const anchors = promptAnchors(transcript.segments);
const nonReal = a => a.filter(x => /non réel/.test(x)).length;
const outRange = a => a.filter(x => /HORS-DURÉE/.test(x)).length;
for (const model of MODELS) {
  try {
    const { content, model: actual, seconds } = await callLLM(prompt, model);
    let json; try { json = JSON.parse(extractJson(content)); } catch (e) { console.log(`❌ ${model} → JSON invalide`); continue; }
    writeFileSync(`${OUT}/${model}.json`, JSON.stringify(json, null, 2));

    // (1) Sortie BRUTE du modèle.
    const v = validate(json, transcript);
    // (2) Sortie PROD : snap des timestamps + plafond + normalisation TrueFalse (ce que reçoit l'élève).
    const snap = snapInteractions(Array.isArray(json.interactions) ? json.interactions : [], anchors, { maxDuration: transcript.duration });
    const cap = capInteractions(snap.interactions, transcript.duration);
    const procInteractions = cap.interactions.map(applyProcessorTransforms);
    const prodJson = { ...json, interactions: procInteractions };
    writeFileSync(`${OUT}/${model}.prod.json`, JSON.stringify(prodJson, null, 2));
    const vp = validate(prodJson, transcript);

    const tag = (vp.issues.length || nonReal(vp.warns)) ? '🐞' : '✅';
    console.log(`${tag} ${model}${actual !== model ? ` (→ ${actual} fallback)` : ''} (${seconds}s) | langue:${vp.lang} résumé:${vp.summary}`);
    console.log(`     BRUTE : ${v.n} questions ${JSON.stringify(v.types)} | ${nonReal(v.warns)} non-réels, ${outRange(v.issues)} hors-durée, ${v.warns.filter(x => /non booléen/.test(x)).length} TF non-bool`);
    console.log(`     PROD  : ${vp.n} questions ${JSON.stringify(vp.types)} | ${nonReal(vp.warns)} non-réels, ${outRange(vp.issues)} hors-durée | snap{snap:${snap.report.snapped},drop:${snap.report.dropped},maxShift:${snap.report.maxShift}s} cap{retiré:${cap.report.removed}/cap${cap.report.cap}}`);
    vp.issues.forEach(x => console.log('     🐞 PROD ' + x));
    vp.warns.filter(x => /non réel/.test(x)).forEach(x => console.log('     ⚠  PROD ' + x));
  } catch (e) { console.log(`❌ ${model} → ${e.message}`); }
  await sleep(1500);
}
console.log(`\nSorties JSON dans ${OUT}/`);
