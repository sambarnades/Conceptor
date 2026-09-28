/**
 * (k) Quiz en mode Rapide : plan + deux lots de front, lot en échec redécoupé — DOM RÉEL.
 *
 * Recalibration du 2026-09-28 (docs/calibration-batch-2026-09.md). Ce scénario clique comme
 * un enseignant — Qui / Quoi, tuile « Quiz (QCM) », « Générer en un clic », en mode Rapide —
 * avec les webhooks LLM BOUCHONNÉS : aucun appel réel, aucun coût, aucune dépendance à ILaaS.
 * Le faux Worker répond selon le prompt reçu (plan ou lot de N questions) et fait échouer le
 * premier lot de 3, comme la cascade du vrai Worker s'effondre ~3 % du temps.
 *
 * Ce qu'il verrouille :
 *  1. le mode Rapide d'un QCM passe désormais par les lots (defaultCount : 5), plus par un
 *     mono-appel « 5 questions minimum » à la sortie non bornée ;
 *  2. après le plan, les deux lots partent DE FRONT (concurrency 2) ;
 *  3. le lot de 3 en échec est REDÉCOUPÉ (2 + 1), pas relancé à l'identique ;
 *  4. le quiz de 5 questions est fabriqué : la modale de résultat s'ouvre ;
 *  5. acte 2 — « Arrêter » pendant deux lots en vol coupe les DEUX : plus aucune requête.
 *
 * Prérequis : `python3 tests/serveur-statique.py 8010` à la RACINE du dépôt.
 * Usage     : node tests/qa-manuel/k-quiz-lots.mjs
 *             node tests/qa-manuel/k-quiz-lots.mjs --contre-epreuve
 *
 * La contre-épreuve désarme chaque réglage TOUR À TOUR — en réécrivant le module SERVI au
 * navigateur (`page.route`), jamais le fichier sur disque — et exige le ROUGE.
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';

const URL_APP = 'http://localhost:8010/index.html';
const MODULE = 'QuizSetQCM';
const CONTRE = process.argv.includes('--contre-epreuve');

// ── Désarmements : [fichier servi, texte du réglage, texte désarmé] ────────────────
const DESARMEMENTS = {
    'deux lots de front': ['js/services/llm-batch.js', '    concurrency: 2,', '    concurrency: 1,'],
    'redécoupage d\'un lot en échec': ['js/services/llm-batch.js', '            if (slice.length > 1) {', '            if (false) {'],
    'mode Rapide par lots (defaultCount)': ['js/ui/ui.js', '        requestedCount = module.chunking.defaultCount;', ''],
    'consigne de types transmise au plan': ['js/services/llm-batch.js', ', planHint: chunking.planHint });', ' });'],
};

let echecs = 0;
function verifier(condition, libelle, detail) {
    if (condition) { console.log(`  OK   ${libelle}`); return; }
    echecs++;
    console.log(`  KO   ${libelle}`);
    if (detail !== undefined) console.log('       ', detail);
}

// ── Faux Worker ─────────────────────────────────────────────────────────────
const RETRO = [0, 26, 51, 76].map((from, i) => ({ from, to: [25, 50, 75, 100][i], feedback: `Retour ${i + 1}.` }));
function plan(n) {
    return { title: 'Quiz de test', overallFeedback: RETRO,
        plan: Array.from({ length: n }, (_, i) => ({ n: i + 1, intitule: `Notion ${i + 1}`, angle: `Angle ${i + 1}` })) };
}
function lot(taille, base) {
    return { questions: Array.from({ length: taille }, (_, i) => ({
        library: 'H5P.MultiChoice 1.16', metadata: { title: `Question ${base + i}` },
        params: { question: `Énoncé numéro ${base + i} ?`, behaviour: { singleAnswer: true },
            answers: [{ text: 'Juste', correct: true }, { text: 'Faux A', correct: false }, { text: 'Faux B', correct: false }] },
    })) };
}

let taches, soumissions, polls, modeActe;
function reinitialiser(mode) { taches = new Map(); soumissions = []; polls = 0; modeActe = mode; }

async function jouer(navigateur, desarme = null) {
    echecs = 0;
    const page = await navigateur.newPage({ viewport: { width: 1500, height: 1000 } });
    if (desarme) {
        const [fichier, avant, apres] = DESARMEMENTS[desarme];
        await page.route(`**/${fichier}*`, async route => {
            const reponse = await route.fetch();
            const source = await reponse.text();
            if (!source.includes(avant)) throw new Error(`réglage introuvable dans ${fichier} : « ${avant} »`);
            return route.fulfill({ response: reponse, body: source.split(avant).join(apres) });
        });
    }
    page.on('pageerror', e => console.log('  [pageerror]', String(e).slice(0, 200)));

    await page.route('**/webhook/caramel/llm/submit-*', route => {
        const { prompt } = JSON.parse(route.request().postData() || '{}');
        const estPlan = !/À PRODUIRE MAINTENANT/.test(prompt);
        const taille = estPlan ? null : +((prompt.match(/EXACTEMENT (\d+) question/) || [])[1] || 0);
        const id = `qa-k-${soumissions.length + 1}`;
        const s = { id, genre: estPlan ? 'plan' : 'lot', taille, t: Date.now(), prompt };
        soumissions.push(s);
        // Le premier lot de 3 échoue côté Worker (les trois modèles de la cascade).
        const echec = modeActe === 'normal' && !estPlan && taille === 3 && !prompt.includes('H5P.DragText')
            && !soumissions.some(x => x !== s && x.genre === 'lot' && x.taille === 3);
        taches.set(id, { ...s, echec, base: soumissions.filter(x => x.genre === 'lot').length * 10 });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taskId: id, status: 'pending' }) });
    });
    await page.route('**/webhook/caramel/llm/result-*', route => {
        polls++;
        const id = new URL(route.request().url()).searchParams.get('taskId');
        const tache = taches.get(id);
        const repondre = (corps) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corps) });
        if (!tache) return repondre({ status: 'not_found' });
        if (modeActe === 'suspendu' && tache.genre === 'lot') return repondre({ status: 'processing' });
        if (tache.echec) return repondre({ status: 'error', message: 'La génération a échoué après 3 tentatives avec différents modèles.' });
        const contenu = tache.genre === 'plan' ? plan(5) : lot(tache.taille, tache.base);
        return repondre({ status: 'done', content: JSON.stringify(contenu), model: 'mistral-small-4-119b', fallback_level: 0,
            prompt_tokens: 1000, completion_tokens: 500 });
    });
    // Les stats agrégées ne doivent rien écrire nulle part.
    await page.route('**/webhook/caramel/llm/stats-*', route => route.fulfill({ status: 200, body: '{}' }));

    // Chaque acte repart d'une page neuve : un acte en échec ne doit pas faire planter le suivant.
    async function ouvrirTuile(module) {
        await page.goto(URL_APP);
        await page.waitForSelector(`[data-module="${module}"]`, { timeout: 15000 });
        await page.fill('#qui', 'Enseignant de SVT');
        await page.fill('#quoi', 'la photosynthèse');
        await page.click(`[data-module="${module}"]`);
        await page.waitForSelector(`#generate-llm-${module}`, { state: 'visible', timeout: 10000 });
        await page.waitForTimeout(900);   // debounce de reconstruction des prompts
    }
    const modale = page.locator('#generation-result-modal');

    // ── Acte 1 : génération complète ────────────────────────────────────────────
    await ouvrirTuile(MODULE);
    verifier(await page.locator('.mode-tab[data-mode="simple"].active').count() === 1, 'le mode Rapide est actif');
    reinitialiser('normal');
    await page.click(`#generate-llm-${MODULE}`);
    await modale.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

    const genres = soumissions.map(s => s.genre + (s.taille ? s.taille : ''));
    verifier(soumissions[0] && soumissions[0].genre === 'plan',
        'mode Rapide : un plan est demandé d\'abord (et non un mono-appel « 5 minimum »)', JSON.stringify(genres));
    const [l1, l2] = soumissions.filter(s => s.genre === 'lot');
    verifier(l1 && l2 && Math.abs(l2.t - l1.t) < 1000 && [l1.taille, l2.taille].sort().join() === '2,3',
        'les deux lots (3 + 2) partent de front', JSON.stringify(soumissions.map(s => [s.genre, s.taille, s.t - soumissions[0].t])));
    const apres = soumissions.slice(3).map(s => s.taille);
    verifier(apres.length === 2 && apres.sort().join() === '1,2',
        'le lot de 3 en échec est redécoupé en 2 + 1, pas relancé tel quel', JSON.stringify(genres));
    verifier(await modale.isVisible(), 'le quiz est fabriqué : la modale de résultat s\'ouvre');
    const servies = [...taches.values()].filter(x => x.genre === 'lot' && !x.echec).reduce((n, x) => n + x.taille, 0);
    verifier(servies === 5, 'les lots acceptés totalisent exactement 5 questions', `questions = ${servies}`);

    // ── Acte 2 : « Arrêter » pendant deux lots en vol ───────────────────────────
    console.log('\n  — acte 2 : arrêt avec deux lots en vol —');
    await ouvrirTuile(MODULE);
    reinitialiser('suspendu');
    const bouton = page.locator('#caramel-cancel-generation');
    const overlay = page.locator('#caramel-animation-overlay');
    await page.click(`#generate-llm-${MODULE}`);
    const debut = Date.now();
    while (soumissions.filter(s => s.genre === 'lot').length < 2 && Date.now() - debut < 30000) await page.waitForTimeout(200);
    verifier(soumissions.filter(s => s.genre === 'lot').length === 2, 'deux lots sont en vol');
    await page.waitForTimeout(1500);
    await bouton.click({ timeout: 5000 }).catch(() => {});   // absent si rien n'est en vol : constaté ci-dessus
    await overlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    verifier(await overlay.isHidden(), 'l\'arrêt referme l\'overlay');
    const soumisAvant = soumissions.length, pollsAvant = polls;
    await page.waitForTimeout(7000);   // > délai initial + un intervalle de sondage
    verifier(soumissions.length === soumisAvant && polls === pollsAvant,
        'plus aucune soumission ni aucun sondage après l\'arrêt (les deux lots sont coupés)',
        `soumissions ${soumisAvant} → ${soumissions.length}, polls ${pollsAvant} → ${polls}`);

    // ── Acte 3 : quiz MIXTE — le plan attribue les types (planHint) ─────────────
    console.log('\n  — acte 3 : quiz mixte, types attribués par le plan —');
    await ouvrirTuile('QuizSet');
    reinitialiser('normal');
    await page.click('#generate-llm-QuizSet');
    await modale.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    const planMixte = soumissions.find(x => x.genre === 'plan');
    verifier(planMixte && /TYPES D'EXERCICES/.test(planMixte.prompt),
        'le prompt du plan du quiz mixte demande d\'attribuer un type à chaque question');
    verifier(!soumissions.filter(x => x.genre === 'lot').some(x => /TYPES D'EXERCICES/.test(x.prompt)),
        'la consigne reste propre au plan (les lots reçoivent le plan, pas la consigne)');
    verifier(await modale.isVisible(), 'le quiz mixte est fabriqué');
    await page.close();
    return echecs;
}

const navigateur = await chromium.launch();
let total = 0;
try {
    if (!CONTRE) {
        total = await jouer(navigateur);
        console.log(total === 0 ? '\n✅ (k) quiz par lots : conforme\n' : `\n❌ (k) ${total} vérification(s) en échec\n`);
    } else {
        const bilan = [];
        for (const desarme of Object.keys(DESARMEMENTS)) {
            console.log(`\n### désarmé : ${desarme}`);
            let ko, exception = null;
            // Une exception n'est pas un ROUGE : le désarmement a pu casser la page au lieu
            // de révéler le défaut.
            try { ko = await jouer(navigateur, desarme); } catch (e) { exception = String(e.message || e).split('\n')[0]; }
            bilan.push(exception ? `  KO   exception (${exception}) — ${desarme}` : ko ? `  OK   vire au ROUGE (${ko} KO) — ${desarme}` : `  KO   reste VERT — ${desarme}`);
            if (exception || !ko) total++;
        }
        console.log('\n### CONTRE-ÉPREUVE — chaque réglage désarmé doit donner le ROUGE\n' + bilan.join('\n'));
        console.log(total ? `\n❌ contre-épreuve : ${total} désarmement(s) sans effet` : '\n✅ contre-épreuve : chaque réglage est nécessaire');
    }
} finally {
    await navigateur.close();
}
process.exit(total === 0 ? 0 : 1);
