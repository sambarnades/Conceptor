// scripts/test-caramelia-questions.mjs
// Banc de QA du chatbot Caramelia : rejoue le payload EXACT du client (mode `auto`)
// contre le webhook n8n, sur une batterie de questions en langage naturel — contexte
// Éducation nationale ET hors EN (formation professionnelle, entreprise, supérieur).
//
// Il ne teste pas « le prompt » dans l'abstrait : il rejoue `fenceUserMessage()` et
// `buildExtractSchemaBlock()` importés DEPUIS LES SOURCES du dépôt, puis reclasse la
// réponse avec la même logique que `chat.js` (bloc <DATA> exploitable = création,
// sinon = réponse texte). Ce qui casse ici casse chez l'enseignant.
//
// Usage :
//   node scripts/test-caramelia-questions.mjs                 # tout, sur `bas`
//   node scripts/test-caramelia-questions.mjs --prod          # contre la prod
//   node scripts/test-caramelia-questions.mjs --tag meta      # un seul groupe
//   node scripts/test-caramelia-questions.mjs --id llm-list   # un seul cas
//   node scripts/test-caramelia-questions.mjs --concurrency 1 # sérialise (backend chargé)
//   node scripts/test-caramelia-questions.mjs --sim <src/construire-messages.js>
//                                                             # essaie un prompt AVANT de l'importer
//
// Sorties : tableau de synthèse en console + JSON détaillé dans /tmp/caramelia-qa/.
//
// ⚠️ Chaque cas coûte un appel LLM sur un backend PARTAGÉ. Concurrence 2 au
// maximum : au-delà, on fabrique des 503 qu'on prend ensuite pour des défauts
// du prompt (constaté pendant la mise au point de ce banc, le 27-08-2026).

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { CONFIG } from '../js/caramelia/config.js';
import { fenceUserMessage } from '../js/caramelia/security.js';
import { CASES } from './lib/caramelia-questions.mjs';

const ARGV = process.argv.slice(2);
const argOf = (name, def) => { const i = ARGV.indexOf(name); return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : def; };
const ENV = ARGV.includes('--prod') ? 'prod' : 'bas';
const WEBHOOK = `https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramelia-${ENV}`;
const CONCURRENCY = Math.max(1, Number(argOf('--concurrency', '2')) || 2);
const ONLY_TAG = argOf('--tag', null);
const ONLY_ID = argOf('--id', null);
// `--sim <chemin/construire-messages.js>` : essaie un prompt système AVANT de le
// déployer sur n8n. Le prompt candidat est glissé dans le champ `message` et
// envoyé sur la voie `help` — la seule qui n'impose pas de format de sortie.
// Ce n'est PAS la production (le prompt de la voie help s'ajoute par-dessus, et
// le RAG nourrit ce dernier plutôt que le candidat) : ça sert à comparer deux
// rédactions entre elles, pas à certifier un taux. La mesure qui fait foi reste
// une passe sans `--sim` après import du workflow.
const SIM = argOf('--sim', null);
const OUT = '/tmp/caramelia-qa';
mkdirSync(OUT, { recursive: true });

// ── Schéma de création : extrait de la SOURCE (extractor.js) plutôt que recopié, pour
// qu'une évolution du schéma se propage automatiquement au banc.
function loadExtractSchemaBuilder() {
    const src = readFileSync(new URL('../js/caramelia/extractor.js', import.meta.url), 'utf8');
    const start = src.indexOf('export function buildExtractSchemaBlock');
    if (start < 0) throw new Error('buildExtractSchemaBlock introuvable dans extractor.js');
    const bodyStart = src.indexOf('{', start);
    let depth = 0, i = bodyStart;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
    }
    const body = src.slice(bodyStart + 1, i);
    // eslint-disable-next-line no-new-func
    return new Function('CONFIG', 'langFullName', body);
}
const buildExtractSchemaBlock = loadExtractSchemaBuilder();

// ── Mode `--sim` : reconstruit le prompt système candidat depuis le code du nœud
// n8n, pour tester une rédaction sans avoir à importer le workflow.
function loadCandidatePrompt(path) {
    const src = readFileSync(path, 'utf8');
    const grab = (decl) => {
        const at = src.indexOf(decl);
        if (at < 0) throw new Error(`${decl} introuvable dans ${path}`);
        const open = src.indexOf('`', at) + 1;
        const close = src.indexOf('`', open);
        return src.slice(open, close);
    };
    const tpl = grab('const systemPrompt = `');   // 1re occurrence = branche 'auto'
    const publics = grab('const PUBLICS = `');
    const facts = grab('const PUBLIC_FACTS = `');
    // eslint-disable-next-line no-new-func
    const render = new Function('lang', 'ver', 'contextStr', 'kbBlock', 'extractSchema', 'PUBLICS', 'PUBLIC_FACTS',
        'return `' + tpl + '`');
    return (lang, extractSchema, context) => render(
        lang, CONFIG.version, JSON.stringify(context),
        '<KNOWLEDGE_BASE>(documentation fournie par la recherche documentaire du serveur)</KNOWLEDGE_BASE>',
        extractSchema, publics, facts,
    );
}
const candidatePrompt = SIM ? loadCandidatePrompt(SIM) : null;

// ── Réplique de la classification client (chat.js → extractor.js). Volontairement
// minimale : on veut savoir ce que le CLIENT ferait de la réponse, pas re-valider le JSON.
function parseDataBlock(raw) {
    const m = String(raw || '').match(/<DATA>([\s\S]*?)(?:<\/DATA>|$)/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return { __invalid: m[1].trim().slice(0, 200) }; }
}
function isMeaningfulIntent(d) {
    if (!d || typeof d !== 'object' || d.__invalid) return false;
    return !!((Array.isArray(d.moduleKeys) && d.moduleKeys.length) || d.quoi || d.qui || d.niveau || d.besoinClarification);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ask(text, { history = [], lang = 'français', context = {} } = {}) {
    const ctx = { page: 'Caramel', url: '/', activeMode: 'rapide', qui: null, quoi: null, lang: 'fr', carameliaVersion: CONFIG.version, ...context };
    const schema = buildExtractSchemaBlock(CONFIG, lang);
    const payload = candidatePrompt
        ? { message: `${candidatePrompt(lang, schema, ctx)}\n\n${fenceUserMessage(text)}`, context: ctx, history, intent: 'help', lang, extractSchema: '' }
        : { message: fenceUserMessage(text), context: ctx, history, intent: 'auto', lang, extractSchema: schema, securityFlag: null };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    const t0 = Date.now();
    try {
        const res = await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
        });
        const ms = Date.now() - t0;
        if (!res.ok) return { ok: false, ms, error: `HTTP ${res.status}` };
        const data = await res.json().catch(() => null);
        const raw = String(data?.response || data?.message || '');
        const parsed = parseDataBlock(raw);
        const kind = parsed && isMeaningfulIntent(parsed) ? 'creation' : 'answer';
        const answer = raw.replace(/<DATA>[\s\S]*?(?:<\/DATA>|$)/g, '').trim();
        return { ok: true, ms, raw, kind, data: parsed, answer };
    } catch (e) {
        return { ok: false, ms: Date.now() - t0, error: e.name === 'AbortError' ? 'timeout' : e.message };
    } finally { clearTimeout(timer); }
}

// ── Vérifications déclaratives d'un cas -------------------------------------------------
function check(c, r) {
    const fails = [];
    if (!r.ok) return [`appel échoué : ${r.error}`];
    if (c.expect && c.expect !== 'any' && r.kind !== c.expect) {
        fails.push(`attendu ${c.expect}, obtenu ${r.kind}`);
    }
    const hay = (r.kind === 'creation' ? JSON.stringify(r.data) : r.answer).toLowerCase();
    for (const w of c.must || []) {
        const hit = Array.isArray(w) ? w.some(x => hay.includes(x.toLowerCase())) : hay.includes(String(w).toLowerCase());
        if (!hit) fails.push(`manque « ${Array.isArray(w) ? w.join(' | ') : w} »`);
    }
    for (const w of c.mustNot || []) {
        if (hay.includes(String(w).toLowerCase())) fails.push(`ne devrait pas contenir « ${w} »`);
    }
    if (r.kind === 'creation') {
        const d = r.data || {};
        for (const [k, v] of Object.entries(c.data || {})) {
            const got = d[k];
            const okv = Array.isArray(v)
                ? (Array.isArray(got) && v.every(x => got.includes(x)))
                : (v === null ? got == null : String(got || '').toLowerCase().includes(String(v).toLowerCase()));
            if (!okv) fails.push(`champ ${k} = ${JSON.stringify(got)} (attendu ${JSON.stringify(v)})`);
        }
        if (c.expect === 'creation' && !d.qui) fails.push('DATA sans "qui"');
        if (c.expect === 'creation' && !d.quoi) fails.push('DATA sans "quoi"');
    }
    return fails;
}

// Ce que le CLIENT pousse réellement dans l'historique après un tour de création :
// pas le bloc <DATA> brut, mais le récapitulatif affiché à l'écran (dom.js n'archive
// que le texte des bulles). Rejouer le bloc brut fausserait les cas multi-tours.
function recapAsHistory(d) {
    let out = "J'ai bien compris ✨\n";
    if (d?.qui) out += `- **Qui** : ${d.qui}\n`;
    if (d?.quoi) out += `- **Quoi** : ${d.quoi}\n`;
    if (d?.niveau) out += `- **Niveau** : ${d.niveau}\n`;
    if (d?.nombreQuestions) out += `- **Nombre de questions** : ${d.nombreQuestions}\n`;
    return out;
}

async function runCase(c) {
    // Cas multi-tours : on rejoue les tours précédents pour construire l'historique réel.
    const history = [];
    let r = null;
    for (const turn of (c.turns || [c.q])) {
        r = await ask(turn, { history, lang: c.lang || 'français', context: c.context });
        if (!r.ok) break;
        history.push({ role: 'user', content: turn });
        history.push({ role: 'assistant', content: r.kind === 'creation' ? recapAsHistory(r.data) : r.answer });
        await sleep(400);
    }
    const fails = check(c, r);
    return { ...c, result: r, fails, pass: fails.length === 0 };
}

async function main() {
    let cases = CASES;
    if (ONLY_TAG) cases = cases.filter(c => c.tag === ONLY_TAG);
    if (ONLY_ID) cases = cases.filter(c => c.id === ONLY_ID);
    if (!cases.length) { console.error('Aucun cas ne correspond au filtre.'); process.exit(2); }

    console.log(`\nCaramelia QA — ${cases.length} cas — webhook ${WEBHOOK} — concurrence ${CONCURRENCY}${SIM ? ` — SIMULATION du prompt ${SIM}` : ""}\n`);
    const results = new Array(cases.length);
    let next = 0, done = 0;
    async function worker() {
        while (next < cases.length) {
            const i = next++;
            const res = await runCase(cases[i]);
            results[i] = res;
            done++;
            const badge = res.pass ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mKO  \x1b[0m';
            console.log(`${badge} [${String(done).padStart(2)}/${cases.length}] ${res.tag.padEnd(10)} ${res.id.padEnd(26)} ${String(res.result?.ms ?? '-').padStart(6)}ms  ${res.result?.kind ?? res.result?.error ?? ''}`);
            if (!res.pass) for (const f of res.fails) console.log(`        ↳ ${f}`);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const ko = results.filter(r => !r.pass);
    const byTag = {};
    for (const r of results) {
        byTag[r.tag] ??= { total: 0, ko: 0 };
        byTag[r.tag].total++;
        if (!r.pass) byTag[r.tag].ko++;
    }
    console.log('\n── Synthèse par groupe ─────────────────────────────');
    for (const [tag, s] of Object.entries(byTag)) {
        const pct = Math.round(((s.total - s.ko) / s.total) * 100);
        console.log(`  ${tag.padEnd(12)} ${String(s.total - s.ko).padStart(2)}/${String(s.total).padEnd(2)} (${pct}%)`);
    }
    console.log(`\n  TOTAL        ${results.length - ko.length}/${results.length}\n`);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = `${OUT}/run-${ENV}-${stamp}.json`;
    writeFileSync(file, JSON.stringify({ env: ENV, webhook: WEBHOOK, when: stamp, results }, null, 2), 'utf8');
    console.log(`Détail complet : ${file}\n`);
    process.exit(ko.length ? 1 : 0);
}

main();
