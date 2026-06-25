// scripts/test-interactive-book-llm.mjs
// QA E2E du prompt « Livre interactif » : assemble le prompt comme Caramel, appelle le VRAI
// LLM (proxy n8n, appels facturés), puis valide la sortie contre les 4 classes de bugs
// (tableau Markdown dans un bloc texte, marqueurs *…* manquants pour Blanks/DragText,
// consigne MarkTheWords « compléter/manquant », feedback). Écrit les livres dans /tmp/ib-llm-test/.
// Usage : node scripts/test-interactive-book-llm.mjs [N]   (N = nb de disciplines, défaut 10)
// Harness de test E2E — génère des Livres interactifs via le vrai LLM Mistral (proxy n8n)
// et valide la sortie contre les 4 classes de bugs corrigées.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const REPO = process.cwd(); // lancer depuis la racine du dépôt
const OUT = '/tmp/ib-llm-test';
mkdirSync(OUT, { recursive: true });
const T = JSON.parse(readFileSync(REPO + '/js/locales/fr.json', 'utf8'));

const SUBMIT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/submit-dev2';
const RESULT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/result-dev2';
const MODEL = 'mistral-small-4-119b';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- Réplique exacte de buildActivityPrompt('prompt_interactive_book', ...) ----
function assembleBookPrompt({ qui, quoi, niveau, nombre }) {
  const isAdvanced = !!niveau;
  let ctx = T.prompt_contexte_pedagogique_commun || '';
  ctx = ctx.replace(/\[QUI\]/g, qui || T.prompt_fallback_teacher || 'un enseignant')
           .replace(/\[QUOI\]/g, quoi || T.prompt_fallback_activity || 'créer une activité pédagogique');
  if (isAdvanced && niveau) ctx = ctx.replace(/\[NIVEAU\]/g, niveau);
  else ctx = ctx.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');

  let rs = T.prompt_interactive_book_regles_specifiques || '';
  if (nombre && String(nombre).trim()) {
    rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, label, rapid, adv) => label + adv.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombre));
    rs = rs.replace(/\[NOMBRE_ELEMENTS\]/g, nombre);
  } else {
    rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, label, rapid) => label + rapid);
  }
  const rp = T.prompt_regles_pedagogiques_communes || '';
  const sj = T.prompt_interactive_book_structure_json || '';
  const ex = T.prompt_interactive_book_exemple_rendu || '';
  let p = `# ${T.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}\n${ctx}\n\n# ${T.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}\n${rs}\n\n# ${T.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}\n${rp}\n`;
  p += `\n# ${T.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}\n${sj}\n\n# ${T.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}\n${ex}`;
  return p;
}

// ---- Réplique de extractJsonContent (llm.js) ----
function extractJson(content) {
  if (!content || typeof content !== 'string') throw new Error('contenu vide');
  const m = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (m && m[1]) return m[1].trim();
  const fb = content.indexOf('{'), fk = content.indexOf('[');
  let start = -1;
  if (fb > -1 && fk > -1) start = Math.min(fb, fk); else start = fb > -1 ? fb : fk;
  if (start < 0) return content.trim();
  const cand = content.substring(start);
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = 0; i < cand.length; i++) {
    const c = cand[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') depth++;
    if (c === '}' || c === ']') depth--;
    if (depth === 0) { end = i; break; }
  }
  return end > -1 ? cand.substring(0, end + 1).trim() : cand.trim();
}

async function callLLM(prompt) {
  const sub = await fetch(SUBMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model: MODEL }) });
  if (!sub.ok) throw new Error('submit HTTP ' + sub.status);
  const { taskId } = await sub.json();
  if (!taskId) throw new Error('taskId manquant');
  await sleep(5000);
  const start = Date.now(); let notFound = 0;
  while (Date.now() - start < 240000) {
    let d;
    try { const r = await fetch(RESULT + '?taskId=' + encodeURIComponent(taskId)); d = await r.json(); }
    catch { await sleep(3000); continue; }
    if (d.status === 'done') return { content: d.content, model: d.model, taskId, seconds: Math.round((Date.now() - start) / 1000) };
    if (d.status === 'error') throw new Error('LLM error: ' + (d.message || '?'));
    if (d.status === 'not_found') { if (++notFound > 10) throw new Error('not_found persistant'); await sleep(3000); continue; }
    await sleep(3000); // processing
  }
  throw new Error('timeout 240s');
}

// ---- détection tableau markdown dans un texte ----
function hasMarkdownTable(text) {
  if (!text || text.indexOf('|') === -1) return false;
  const lines = String(text).split(/\\n|\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    const sep = lines[i + 1].trim();
    if (lines[i].includes('|') && sep.includes('|') && sep.includes('-') && /^[\s|:-]+$/.test(sep)) return true;
  }
  return false;
}
const HAS_MARKER = s => /\*[^*\s][^*]*\*/.test(String(s || ''));
const libBase = lib => String(lib || '').trim().split(/\s+/)[0].toLowerCase();

// ---- validation d'un livre ----
function validateBook(json) {
  const issues = [];   // bugs durs
  const warns = [];    // avertissements
  const stats = { chapters: 0, blocks: 0, exercises: {}, tables: 0, textBlocks: 0 };
  if (!json || !Array.isArray(json.chapters)) { issues.push('STRUCTURE: pas de chapters[]'); return { issues, warns, stats }; }
  stats.chapters = json.chapters.length;
  json.chapters.forEach((ch, ci) => {
    const loc = `ch${ci + 1}${ch.title ? ' «' + String(ch.title).slice(0, 30) + '»' : ''}`;
    if (!Array.isArray(ch.content)) { warns.push(`${loc}: content[] absent`); return; }
    ch.content.forEach((b, bi) => {
      stats.blocks++;
      const where = `${loc}/bloc${bi + 1}`;
      const type = (b.type || (b.library ? 'exercise' : 'text')).toLowerCase();
      if (type === 'text') {
        stats.textBlocks++;
        if (hasMarkdownTable(b.text)) issues.push(`${where} [TABLEAU_MD_DANS_TEXTE] tableau Markdown dans un bloc text au lieu d'un bloc table`);
      } else if (type === 'table') {
        stats.tables++;
        if (!b.table || !Array.isArray(b.table.headers) || !Array.isArray(b.table.rows)) warns.push(`${where} [TABLE] structure table incomplète`);
      } else if (type === 'exercise' || b.library) {
        const lib = libBase(b.library);
        stats.exercises[lib] = (stats.exercises[lib] || 0) + 1;
        const scored = ['h5p.multichoice','h5p.blanks','h5p.dragtext','h5p.markthewords','h5p.summary','h5p.singlechoiceset','h5p.dragquestion'];
        if (lib === 'h5p.blanks') {
          const qs = Array.isArray(b.questions) ? b.questions : [];
          if (qs.length === 0) issues.push(`${where} [BLANKS_VIDE] aucune question`);
          qs.forEach((q, qi) => {
            const s = typeof q === 'string' ? q : (q && (q.text || q.question)) || '';
            if (!HAS_MARKER(s)) issues.push(`${where} [BLANKS_SANS_MARQUEUR] question ${qi + 1} sans *…* : "${String(s).slice(0, 60)}"`);
          });
          if (b.taskDescription && HAS_MARKER(b.taskDescription)) warns.push(`${where} [BLANKS_TASKDESC_MARQUEUR] marqueur *…* dans taskDescription`);
        } else if (lib === 'h5p.dragtext') {
          if (!HAS_MARKER(b.textField)) issues.push(`${where} [DRAGTEXT_SANS_MARQUEUR] textField sans *…* : "${String(b.textField).slice(0, 60)}"`);
        } else if (lib === 'h5p.markthewords') {
          if (!HAS_MARKER(b.textField)) issues.push(`${where} [MTW_SANS_MARQUEUR] textField sans *…*`);
          if (/complét|manquant/i.test(b.taskDescription || '')) issues.push(`${where} [MTW_CONSIGNE] consigne « compléter/manquant » : "${String(b.taskDescription).slice(0, 70)}"`);
        } else if (lib === 'h5p.truefalse') {
          if (b.correct !== 'true' && b.correct !== 'false') warns.push(`${where} [TF_CORRECT] correct=${JSON.stringify(b.correct)} (attendu "true"/"false")`);
        }
        if (scored.includes(lib)) {
          const ofb = b.overallFeedback;
          if (!Array.isArray(ofb) || ofb.length === 0) warns.push(`${where} [SANS_FEEDBACK] overallFeedback absent (${lib})`);
        }
      } else {
        warns.push(`${where} [TYPE_INCONNU] type="${type}"`);
      }
    });
  });
  return { issues, warns, stats };
}

const DISCIPLINES = [
  { id: '01-si-ingenieur', qui: "Sciences de l'ingénieur", quoi: "Le langage du réel : grandeurs physiques et unités du Système International (SI)", niveau: 'Première STI2D', nombre: '' },
  { id: '02-maths-proportion', qui: 'Mathématiques', quoi: 'La proportionnalité et les pourcentages', niveau: 'Cycle 4 (4e)', nombre: '4' },
  { id: '03-histoire-revolution', qui: 'Histoire', quoi: "La Révolution française et l'Empire (1789-1815)", niveau: '4e', nombre: '' },
  { id: '04-svt-photosynthese', qui: 'SVT', quoi: 'La photosynthèse et la nutrition des plantes', niveau: '5e', nombre: '4' },
  { id: '05-francais-figures', qui: 'Français', quoi: 'Les figures de style dans la poésie', niveau: '3e', nombre: '' },
  { id: '06-geo-climat', qui: 'Géographie', quoi: 'Le changement climatique et ses conséquences', niveau: '5e', nombre: '4' },
  { id: '07-anglais-presentperfect', qui: 'Anglais', quoi: 'Le present perfect et le vocabulaire du voyage', niveau: 'A2 (cycle 4)', nombre: '' },
  { id: '08-emc-institutions', qui: 'Enseignement moral et civique', quoi: 'Les institutions de la Ve République', niveau: '3e', nombre: '4' },
  { id: '09-pc-etats-matiere', qui: 'Physique-chimie', quoi: "Les états de la matière et les changements d'état", niveau: '5e', nombre: '' },
  { id: '10-eco-offre-demande', qui: 'Économie-gestion', quoi: "L'offre, la demande et la formation des prix", niveau: 'Première STMG', nombre: '4' },
];

async function runOne(d) {
  const prompt = assembleBookPrompt(d);
  const res = { id: d.id, qui: d.qui, quoi: d.quoi };
  try {
    const { content, model, seconds } = await callLLM(prompt);
    res.seconds = seconds; res.model = model;
    writeFileSync(`${OUT}/${d.id}.raw.txt`, content);
    let json;
    try { json = JSON.parse(extractJson(content)); }
    catch (e) { res.parseError = e.message; res.status = 'JSON_INVALIDE'; return res; }
    writeFileSync(`${OUT}/${d.id}.json`, JSON.stringify(json, null, 2));
    const v = validateBook(json);
    res.stats = v.stats; res.issues = v.issues; res.warns = v.warns;
    res.status = v.issues.length === 0 ? 'OK' : 'BUGS';
  } catch (e) { res.status = 'ERREUR_APPEL'; res.error = e.message; }
  return res;
}

// concurrence limitée
async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  });
  await Promise.all(workers);
  return out;
}

const limit = parseInt(process.argv[2] || '10', 10);
const toRun = DISCIPLINES.slice(0, limit);
console.log(`Génération de ${toRun.length} livre(s) via ${MODEL}…\n`);
const results = await pool(toRun, 3, async (d) => {
  process.stdout.write(`▶ ${d.id} (${d.qui})…\n`);
  const r = await runOne(d);
  process.stdout.write(`  ${r.status === 'OK' ? '✅' : r.status === 'BUGS' ? '🐞' : '❌'} ${d.id} — ${r.status}` + (r.seconds ? ` (${r.seconds}s)` : '') + (r.error ? ' — ' + r.error : '') + (r.issues ? ` — ${r.issues.length} bug(s)` : '') + '\n');
  return r;
});
writeFileSync(`${OUT}/_results.json`, JSON.stringify(results, null, 2));
console.log('\n===== SYNTHÈSE =====');
for (const r of results) {
  console.log(`\n## ${r.id} — ${r.qui} — ${r.status}` + (r.seconds ? ` (${r.seconds}s, ${r.model})` : ''));
  if (r.stats) console.log(`   chapitres=${r.stats.chapters} blocs=${r.stats.blocks} textes=${r.stats.textBlocks} tables=${r.stats.tables} exos=${JSON.stringify(r.stats.exercises)}`);
  if (r.parseError) console.log('   ❌ JSON: ' + r.parseError);
  if (r.error) console.log('   ❌ ' + r.error);
  (r.issues || []).forEach(x => console.log('   🐞 ' + x));
  (r.warns || []).forEach(x => console.log('   ⚠  ' + x));
}
const ok = results.filter(r => r.status === 'OK').length;
const bugs = results.filter(r => r.status === 'BUGS').length;
const err = results.filter(r => r.status === 'ERREUR_APPEL' || r.status === 'JSON_INVALIDE').length;
console.log(`\n===== BILAN : ${ok} OK / ${bugs} avec bug(s) / ${err} erreur(s) sur ${results.length} =====`);
