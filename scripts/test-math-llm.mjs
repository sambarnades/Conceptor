/**
 * test-math-llm.mjs — QA E2E « activités mathématiques » via le VRAI LLM (proxy n8n, FACTURÉ).
 *
 * Pour chaque (activité × sujet math × répétition), le script reproduit le parcours réel de
 * Caramel de bout en bout :
 *   1. assemble le prompt EXACTEMENT comme prompt-generator.js (buildActivityPrompt, fr.json) ;
 *   2. appelle le LLM (submit → poll, endpoints -bas) ;
 *   3. passe la sortie dans le PIPELINE RÉEL :
 *        cleanJsonInput → JSON.parse | healJsonString → healJsonObject → healActivitySpecificFields
 *        → healStructureForActivity → processH5PContent → createH5PBlob   (H5P)
 *        ou  handle*Creation (dispatch generation:complete, blob capté)   (Moodle/Éléa) ;
 *   4. vérifie : parse OK, besoin du healer, LaTeX présent + préservé, équilibre des délimiteurs
 *        \(...\) / \[...\] et des accolades, build OK (taille du .h5p/.mbz) ;
 *   5. ROBUSTESSE COLLAGE IA EXTERNE : ré-enveloppe la sortie brute dans de la prose
 *        (« Voici : … Bonne journée ! ») et confirme que cleanJsonInput la récupère.
 *
 * Périmètre : activités PORTEUSES DE MATH hors Image/Vidéo interactive.
 * S'appuie sur le bootstrap headless de tests/roundtrip (mêmes stubs que le banc de fidélité).
 *
 * Lancer DEPUIS LA RACINE du dépôt :
 *   node scripts/test-math-llm.mjs                         # matrice par défaut (13 act. × 3 sujets)
 *   node scripts/test-math-llm.mjs --acts=MultipleChoice,test_elea --topics=2 --reps=2
 *   node scripts/test-math-llm.mjs --topicOff=3 --topics=3 # sujets « durs » (dérivées, proba, trigo)
 * Options : --acts=  --topics=N  --topicOff=N  --reps=N  --conc=N
 * Sorties brutes + _results.json dans /tmp/math-llm-test/.
 */
import '../tests/roundtrip/bootstrap.mjs'; // DOIT être le premier import (stubs DOM + seed)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = '/tmp/math-llm-test';
mkdirSync(OUT, { recursive: true });
const T = JSON.parse(readFileSync(resolve(REPO, 'js/locales/fr.json'), 'utf8'));

const boot = await import('../tests/roundtrip/bootstrap.mjs');
await boot.installIdentitySanitizer();
await boot.ensureJSZip(); await boot.ensureFflate(); await boot.ensureTar();

const healer = await import(resolve(REPO, 'js/h5p/json-healer.js'));
const { processH5PContent, getModuleMetadata } = await import(resolve(REPO, 'js/h5p/processors/index.js'));
const { createH5PBlob } = await import(resolve(REPO, 'js/h5p/h5p-creator.js'));
const { cleanJsonInput } = await import(resolve(REPO, 'js/core/utils.js'));
const moodle = await import(resolve(REPO, 'js/moodle/moodle-creator.js'));

const SUBMIT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/submit-bas';
const RESULT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/result-bas';
const MODEL = 'mistral-small-4-119b';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- Réplique fidèle de buildActivityPrompt (prompt-generator.js) ---
function buildActivityPrompt(prefix, { qui, quoi, niveau, nombreQuestions, ocrContent, isAdvanced }) {
    const pt = T;
    let ctx = pt.prompt_contexte_pedagogique_commun || '';
    ctx = ctx.replace(/\[QUI\]/g, qui || pt.prompt_fallback_teacher || 'un enseignant')
             .replace(/\[QUOI\]/g, quoi || pt.prompt_fallback_activity || 'créer une activité pédagogique');
    if (isAdvanced && niveau) ctx = ctx.replace(/\[NIVEAU\]/g, niveau);
    else ctx = ctx.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');
    let rs = pt[`${prefix}_regles_specifiques`] || '';
    if (nombreQuestions && nombreQuestions.toString().trim()) {
        rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, l, r, a) => l + a.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions));
        rs = rs.replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
    } else {
        rs = rs.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, l, r) => l + r);
    }
    const rp = pt.prompt_regles_pedagogiques_communes || '';
    let sources = '';
    if (ocrContent && ocrContent.trim()) sources = (pt[`${prefix}_sources`] || pt.prompt_sources_communes || '').replace('[RAG]', ocrContent.trim());
    const sj = pt[`${prefix}_structure_json`] || '', ex = pt[`${prefix}_exemple_rendu`] || '';
    let prompt = `# ${pt.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}\n${ctx}\n\n# ${pt.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}\n${rs}\n\n# ${pt.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}\n${rp}\n`;
    if (sources) prompt += `\n# ${pt.prompt_header_sources || 'SOURCES'}\n${sources}\n`;
    prompt += `\n# ${pt.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}\n${sj}\n\n# ${pt.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}\n${ex}`;
    return prompt;
}

async function callLLM(prompt) {
    const sub = await fetch(SUBMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model: MODEL }) });
    if (!sub.ok) throw new Error('submit HTTP ' + sub.status);
    const { taskId } = await sub.json();
    if (!taskId) throw new Error('taskId manquant');
    await sleep(4000);
    const start = Date.now(); let notFound = 0;
    while (Date.now() - start < 200000) {
        let d;
        try { const r = await fetch(RESULT + '?taskId=' + encodeURIComponent(taskId)); d = await r.json(); } catch { await sleep(3000); continue; }
        if (d.status === 'done') return { content: d.content, seconds: Math.round((Date.now() - start) / 1000) };
        if (d.status === 'error') throw new Error('LLM error: ' + (d.message || '?'));
        if (d.status === 'not_found') { if (++notFound > 12) throw new Error('not_found persistant'); await sleep(3000); continue; }
        await sleep(3000);
    }
    throw new Error('timeout 200s');
}

const LATEX_CMDS = /\\(frac|sqrt|times|div|pi|geq|leq|neq|alpha|beta|theta|sum|int|lim|left|right|cdot|circ|infty|vec|overline|mathbb|mathrm|sin|cos|tan|log|ln|pm|approx|Delta|equiv)\b/g;
const LATEX_DELIMS = /\\\(|\\\)|\\\[|\\\]/g;
function latexScore(s) {
    const str = typeof s === 'string' ? s : JSON.stringify(s);
    return (str.match(LATEX_CMDS) || []).length + (str.match(LATEX_DELIMS) || []).length
        + (str.match(/\^\{|\^[0-9a-zA-Z]/g) || []).length + (str.match(/_\{|_[0-9a-zA-Z]/g) || []).length;
}

function healFull(obj, moduleKey) {
    let o = healer.healJsonObject(structuredClone(obj), moduleKey);
    o = healer.healActivitySpecificFields(o, moduleKey);
    return healer.healStructureForActivity(o, moduleKey);
}
async function buildH5P(obj, moduleKey) {
    const healed = healFull(obj, moduleKey);
    const processed = await processH5PContent(moduleKey, healed);
    const content = (processed && processed.content && processed.dependencies) ? processed.content : processed;
    const meta = getModuleMetadata(moduleKey);
    const deps = [...meta.extraDependencies, { machineName: meta.machineName, majorVersion: meta.version.major, minorVersion: meta.version.minor }];
    const blob = await createH5PBlob(content, meta.machineName, deps, { title: content.title || 'Activity', lang: 'fr' });
    return { content, blob };
}

const TOPICS = [
    { id: 'fractions', qui: 'un professeur de mathématiques', quoi: 'les opérations sur les fractions (addition, multiplication, simplification)', niveau: 'Cycle 4 (5e)' },
    { id: 'pythagore', qui: 'un professeur de mathématiques', quoi: 'le théorème de Pythagore et le calcul de longueurs avec des racines carrées', niveau: '4e' },
    { id: 'second-degre', qui: 'un professeur de mathématiques', quoi: 'les équations du second degré, le discriminant Δ et la formule des racines', niveau: 'Première' },
    { id: 'derivees', qui: 'un professeur de mathématiques', quoi: "les dérivées de fonctions usuelles et le calcul de f'(x)", niveau: 'Terminale' },
    { id: 'proba', qui: 'un professeur de mathématiques', quoi: 'les probabilités conditionnelles et les fractions de probabilité', niveau: 'Première' },
    { id: 'trigo', qui: 'un professeur de mathématiques', quoi: 'la trigonométrie : sinus, cosinus, tangente et valeurs remarquables avec π', niveau: 'Première' },
];
const H5P_ACTS = {
    MultipleChoice: 'prompt_multiple_choice', TrueFalse: 'prompt_true_false', FillInTheBlanks: 'prompt_fill_in_the_blanks',
    Flashcards: 'prompt_flashcards', Summary: 'prompt_summary', DialogCards: 'prompt_dialog_cards',
    QuizSetQCM: 'prompt_quizset_qcm', SingleChoiceSet: 'prompt_single_choice_set',
    CoursePresentation: 'prompt_course_presentation', InteractiveBook: 'prompt_interactive_book',
};
const MOODLE_ACTS = {
    test_elea: { prefix: 'prompt_elea_test', run: (c) => moodle.handleTestXmlCreation(c) },
    QCM: { prefix: 'prompt_elea_qcm', run: (c) => moodle.handleQCMCreation(c) },
    Millionnaire: { prefix: 'prompt_elea_millionnaire', run: (c) => moodle.handleMillionnaireCreation(c) },
};
const COUNTED = new Set(['MultipleChoice', 'TrueFalse', 'FillInTheBlanks', 'Flashcards', 'Summary', 'DialogCards', 'QuizSetQCM', 'SingleChoiceSet', 'test_elea', 'QCM']);

async function runCell(actKey, kind, prefix, topic, rep, moodleRun) {
    const label = `${actKey}·${topic.id}·r${rep}`;
    const nombre = COUNTED.has(actKey) ? '5' : '';
    const prompt = buildActivityPrompt(prefix, { qui: topic.qui, quoi: topic.quoi, niveau: topic.niveau, nombreQuestions: nombre, ocrContent: '', isAdvanced: true });
    const res = { label, actKey, kind, topic: topic.id, rep };
    try {
        const { content: raw, seconds } = await callLLM(prompt);
        res.seconds = seconds;
        writeFileSync(`${OUT}/${label}.raw.txt`, raw);
        const cleaned = cleanJsonInput(raw);
        res.rawLatex = latexScore(raw);
        let obj, neededHealer = false;
        try { obj = JSON.parse(cleaned); } catch { obj = JSON.parse(healer.healJsonString(cleaned)); neededHealer = true; }
        res.neededHealer = neededHealer;
        // Robustesse collage IA externe : prose autour de la sortie brute
        const wrapped = `Bien sûr ! Voici l'activité :\n\n${raw}\n\nDis-moi si tu veux des ajustements. 😊`;
        try { JSON.parse(cleanJsonInput(wrapped)); res.proseRecovered = true; }
        catch { try { JSON.parse(healer.healJsonString(cleanJsonInput(wrapped))); res.proseRecovered = true; } catch { res.proseRecovered = false; } }
        if (kind === 'h5p') {
            const { content } = await buildH5P(obj, actKey);
            const built = JSON.stringify(content);
            res.builtLatex = latexScore(built);
            res.imbalance = healer.checkLatexBalance(content);
            res.status = 'OK';
        } else {
            boot.drainDispatchedEvents();
            await moodleRun(raw);
            const ev = boot.lastDispatched('generation:complete');
            const errEv = boot.lastDispatched('generation:error');
            if (errEv && !ev) { res.status = 'BUILD_FAIL'; res.error = errEv.detail?.errorMessage; return res; }
            const blob = ev?.detail?.blob;
            res.blobSize = blob ? (blob.size ?? blob.byteLength ?? 0) : 0;
            const hf = moodle.healLatexForTest(structuredClone(obj));
            res.builtLatex = latexScore(JSON.stringify(hf));
            res.imbalance = healer.checkLatexBalance(hf);
            res.status = res.blobSize > 0 ? 'OK' : 'BUILD_EMPTY';
        }
    } catch (e) { res.status = res.status || 'ERROR'; res.error = e.message; }
    return res;
}

async function pool(items, n, fn) {
    const out = []; let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
    return out;
}

const argv = process.argv.slice(2);
const getArg = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const actsArg = getArg('acts', '');
const nTopics = parseInt(getArg('topics', '3'), 10), topicOff = parseInt(getArg('topicOff', '0'), 10);
const nReps = parseInt(getArg('reps', '1'), 10), conc = parseInt(getArg('conc', '3'), 10);

let acts;
if (actsArg) acts = actsArg.split(',').map(s => s.trim()).filter(Boolean).map(k => {
    if (H5P_ACTS[k]) return { key: k, kind: 'h5p', prefix: H5P_ACTS[k] };
    if (MOODLE_ACTS[k]) return { key: k, kind: 'moodle', prefix: MOODLE_ACTS[k].prefix, run: MOODLE_ACTS[k].run };
    throw new Error('activité inconnue : ' + k);
});
else acts = [
    ...Object.entries(H5P_ACTS).map(([key, prefix]) => ({ key, kind: 'h5p', prefix })),
    ...Object.entries(MOODLE_ACTS).map(([key, v]) => ({ key, kind: 'moodle', prefix: v.prefix, run: v.run })),
];
const topics = TOPICS.slice(topicOff, topicOff + nTopics);
const cells = [];
for (const a of acts) for (const t of topics) for (let r = 1; r <= nReps; r++) cells.push({ a, t, r });
console.log(`Matrice : ${acts.length} activités × ${topics.length} sujets × ${nReps} rép = ${cells.length} cellules (conc=${conc}, ${MODEL})\n`);

boot.resetRandom();
const results = await pool(cells, conc, async ({ a, t, r }) => {
    const res = await runCell(a.key, a.kind, a.prefix, t, r, a.run);
    const icon = res.status === 'OK' ? '✅' : '❌';
    const flags = [res.neededHealer ? 'healer' : '', res.proseRecovered === false ? 'PROSE-KO' : '', (res.imbalance && res.imbalance.length) ? 'DÉSÉQUILIBRE' : ''].filter(Boolean).join(' ');
    console.log(`${icon} ${res.label.padEnd(34)} ${String(res.status).padEnd(11)} ${res.seconds ? res.seconds + 's' : ''} latex:${res.rawLatex ?? '?'}→${res.builtLatex ?? '?'} ${flags} ${res.error ? '— ' + res.error : ''}`);
    return res;
});
writeFileSync(`${OUT}/_results.json`, JSON.stringify(results, null, 2));

const ok = results.filter(r => r.status === 'OK').length;
const imb = results.filter(r => r.imbalance && r.imbalance.length);
console.log('\n============ SYNTHÈSE ============');
console.log(`  ✅ OK build : ${ok}/${results.length}`);
console.log(`  🔧 healer (parse) : ${results.filter(r => r.neededHealer).length}`);
console.log(`  🧪 collage IA externe NON récupéré : ${results.filter(r => r.proseRecovered === false).length}`);
console.log(`  ⚖️  formules LaTeX déséquilibrées : ${imb.length}`);
for (const r of imb) console.log(`     - ${r.label} : ${r.imbalance.join(' ; ')}`);
for (const r of results.filter(r => r.error)) console.log(`  ❌ ${r.label} [${r.status}] : ${r.error}`);
console.log(`\nSorties dans ${OUT}`);
