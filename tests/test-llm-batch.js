/**
 * Tests unitaires — Génération par lots : parse des réponses LLM avec rattrapage healer
 *
 * Vérifie la correction du bug majeur de l'audit fonctionnel 2026-07 (docs/AUDIT_FONCTIONNEL_2026-07.md §2.1) :
 * `parseJsonStrict` (js/services/llm-batch.js) faisait un JSON.parse brut sur les réponses
 * du plan et de chaque lot, alors que le pipeline mono-appel répare d'abord la chaîne via
 * `healJsonString` (h5p-creator.js). Un lot de maths avec un `\frac` mal échappé faisait
 * donc échouer TOUTE la génération par lots.
 *
 * La correction injecte `healJsonString` en rattrapage dans `parseJsonStrict`. Ces tests
 * vérifient : réparation effective (LaTeX, caractères de contrôle), absence de
 * sur-correction sur JSON valide, erreurs propres sur contenu irréparable, et parité
 * avec le pipeline mono-appel.
 *
 * Usage : ouvrir tests/test-llm-batch.html depuis le serveur local (ou via test-all.html).
 */

import { parseJsonStrict, balancedBatches, BATCH_CONFIG, fillWithSplit, buildOutlinePrompt, shouldChunk, batchSizeFor } from '../js/services/llm-batch.js';
import { healJsonString } from '../js/h5p/json-healer.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let currentSection = '';

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, section: currentSection, diagnostic };
    if (condition) {
        passCount++;
    } else {
        failCount++;
        console.error('FAIL:', message, diagnostic || '');
    }
    results.push(entry);
}

function section(name) {
    currentSection = name;
}

/**
 * Simule une sortie LLM à backslashes SIMPLES (invalide en JSON) à partir d'un
 * template lisible à backslashes doublés. Ex. '\\\\frac' (source) → '\\frac' (brut LLM).
 */
function llmRaw(template) {
    return template.replace(/\\\\/g, '\\');
}

// =======================================================================
// TESTS
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;
    currentSection = '';

    // ===================================================================
    // 1. JSON valide — aucune sur-correction (healer appliqué mais idempotent)
    // ===================================================================
    section('1. JSON valide — pas de sur-correction');

    const validLot = JSON.stringify({
        questions: [
            { question: 'Que vaut \\(x^2\\) pour x = 3 ?', answers: ['9', '6'], correct: 0 },
            { question: 'Texte accentué : élève, où, çà.', answers: ['a', 'b'], correct: 1 }
        ]
    });
    const parsedValid = parseJsonStrict(validLot, 'Lot', healJsonString);
    assert(JSON.stringify(parsedValid) === JSON.stringify(JSON.parse(validLot)),
        'JSON valide : résultat identique à un JSON.parse direct (healer idempotent)');
    assert(parsedValid.questions.length === 2,
        'JSON valide : les 2 questions sont présentes');
    assert(parsedValid.questions[0].question === 'Que vaut \\(x^2\\) pour x = 3 ?',
        'JSON valide : le LaTeX correctement échappé est préservé à l\'identique',
        `Got: ${parsedValid.questions[0].question}`);

    const validPlan = '{"title": "Quiz fractions", "overallFeedback": "Bravo !", "plan": [{"n": 1, "intitule": "Additions"}]}';
    const parsedPlan = parseJsonStrict(validPlan, 'Plan', healJsonString);
    assert(parsedPlan.plan[0].intitule === 'Additions',
        'Plan valide : parsé sans altération');

    // ===================================================================
    // 2. Rattrapage healer — LaTeX mal échappé (LE bug corrigé)
    // ===================================================================
    section('2. Rattrapage healer — LaTeX mal échappé');

    // Lot de maths typique : le LLM émet \frac, \sqrt, \times avec des backslashes SIMPLES.
    const brokenLot = llmRaw('{"questions": [{"question": "Calcule \\\\(\\\\frac{1}{2} + \\\\frac{1}{3}\\\\)", "answers": ["\\\\(\\\\frac{5}{6}\\\\)", "\\\\(\\\\frac{2}{5}\\\\)"], "correct": 0}, {"question": "Simplifie \\\\(\\\\sqrt{16} \\\\times 2\\\\)", "answers": ["8", "4"], "correct": 0}]}');

    let precondition = false;
    try { JSON.parse(brokenLot); } catch { precondition = true; }
    assert(precondition,
        'Précondition : le lot brut à backslashes simples est bien un JSON invalide');

    let debugMessages = [];
    const debugSpy = (mod, msg) => debugMessages.push(`${mod}: ${msg}`);

    let healedLot = null;
    try {
        healedLot = parseJsonStrict(brokenLot, 'Lot', healJsonString, debugSpy);
        assert(true, 'Lot LaTeX mal échappé : parseJsonStrict ne lève PAS (rattrapage healer)');
    } catch (e) {
        assert(false, 'Lot LaTeX mal échappé : parseJsonStrict ne lève PAS (rattrapage healer)', e.message);
    }

    if (healedLot) {
        assert(Array.isArray(healedLot.questions) && healedLot.questions.length === 2,
            'Lot réparé : les 2 questions sont présentes');
        assert(healedLot.questions[0].question.includes('\\frac{1}{2}'),
            'Lot réparé : la commande \\frac est préservée dans la question',
            `Got: ${healedLot.questions[0].question}`);
        assert(healedLot.questions[0].answers[0].includes('\\frac{5}{6}'),
            'Lot réparé : la commande \\frac est préservée dans les réponses',
            `Got: ${healedLot.questions[0].answers[0]}`);
        assert(healedLot.questions[1].question.includes('\\sqrt{16}') && healedLot.questions[1].question.includes('\\times'),
            'Lot réparé : \\sqrt et \\times préservés',
            `Got: ${healedLot.questions[1].question}`);
        assert(debugMessages.some(m => m.includes('llm-batch') && m.includes('réparé')),
            'Lot réparé : le passage par le healer est tracé en debug',
            `Messages: ${debugMessages.join(' | ')}`);
    }

    // Corruption SILENCIEUSE : "\times" et "\frac" à backslash simple sont du JSON
    // VALIDE (\t = tabulation, \f = form feed) → un parse direct ne lève pas mais
    // corrompt le contenu (tab + « imes »). Le healer appliqué AVANT parse (parité
    // mono-appel) doit préserver les commandes LaTeX.
    const silentLot = llmRaw('{"questions": [{"question": "Calcule 2 \\\\times 3 et \\\\frac{1}{2}", "answers": ["6"], "correct": 0}]}');
    const silentDirect = JSON.parse(silentLot); // parse SANS healer : ne lève pas…
    assert(!silentDirect.questions[0].question.includes('\\times'),
        'Précondition : un parse direct corrompt silencieusement \\times (échappement \\t valide)');
    const silentHealed = parseJsonStrict(silentLot, 'Lot', healJsonString);
    assert(silentHealed.questions[0].question.includes('\\times') && silentHealed.questions[0].question.includes('\\frac{1}{2}'),
        'Corruption silencieuse évitée : \\times et \\frac préservés (healer AVANT parse)',
        `Got: ${silentHealed.questions[0].question}`);

    // Plan cassé de la même façon (backslash LaTeX dans un intitulé).
    const brokenPlan = llmRaw('{"title": "Quiz \\\\(\\\\pi\\\\)", "overallFeedback": "Bien !", "plan": [{"n": 1, "intitule": "Aire du disque \\\\(\\\\pi r^2\\\\)"}]}');
    try {
        const healedPlan = parseJsonStrict(brokenPlan, 'Plan', healJsonString);
        assert(healedPlan.plan[0].intitule.includes('\\pi'),
            'Plan LaTeX mal échappé : réparé, \\pi préservé dans l\'intitulé',
            `Got: ${healedPlan.plan[0].intitule}`);
    } catch (e) {
        assert(false, 'Plan LaTeX mal échappé : réparé, \\pi préservé dans l\'intitulé', e.message);
    }

    // ===================================================================
    // 3. Rattrapage healer — caractères de contrôle bruts (Gemini)
    // ===================================================================
    section('3. Rattrapage healer — caractères de contrôle bruts');

    // Saut de ligne LITTÉRAL dans une string JSON (interdit par la spec).
    const rawNewline = '{"questions": [{"question": "Ligne 1\nLigne 2", "answers": ["a"], "correct": 0}]}';
    try {
        const obj = parseJsonStrict(rawNewline, 'Lot', healJsonString);
        // NB : l'heuristique du healer peut transformer \n littéral suivi d'une minuscule
        // en \\n (commande LaTeX potentielle) — comportement IDENTIQUE au mono-appel.
        const v = obj.questions[0].question;
        assert(v === 'Ligne 1\nLigne 2' || v === 'Ligne 1\\nLigne 2',
            'Saut de ligne littéral : parse réussit sans perte de contenu (parité mono-appel)',
            `Got: ${JSON.stringify(v)}`);
    } catch (e) {
        assert(false, 'Saut de ligne littéral : parse réussit sans perte de contenu (parité mono-appel)', e.message);
    }

    const rawTab = '{"title": "Col1\tCol2"}';
    try {
        const obj = parseJsonStrict(rawTab, 'Plan', healJsonString);
        assert(typeof obj.title === 'string' && obj.title.includes('Col1'),
            'Tabulation littérale : parse réussit',
            `Got: ${JSON.stringify(obj.title)}`);
    } catch (e) {
        assert(false, 'Tabulation littérale : parse réussit', e.message);
    }

    // ===================================================================
    // 4. Contenu irréparable — erreurs propres et messages exploitables
    // ===================================================================
    section('4. Contenu irréparable — erreurs propres');

    let err = null;
    try { parseJsonStrict('Désolé, je ne peux pas générer ce contenu {', 'Lot', healJsonString); }
    catch (e) { err = e; }
    assert(err !== null && err.message.startsWith('Lot : JSON invalide'),
        'Contenu irréparable : erreur « Lot : JSON invalide (…) » (message d\'origine conservé)',
        err ? err.message : 'aucune erreur levée');

    err = null;
    try { parseJsonStrict('42', 'Plan', healJsonString); }
    catch (e) { err = e; }
    assert(err !== null && err.message.includes('objet JSON attendu'),
        'Scalaire (42) : rejeté avec « objet JSON attendu »',
        err ? err.message : 'aucune erreur levée');

    err = null;
    try { parseJsonStrict('"juste une chaîne"', 'Lot', healJsonString); }
    catch (e) { err = e; }
    assert(err !== null && err.message.includes('objet JSON attendu'),
        'Chaîne JSON seule : rejetée avec « objet JSON attendu »',
        err ? err.message : 'aucune erreur levée');

    // Sans healer fourni (robustesse : signature à 2 arguments toujours valide).
    // NB : \pi et non \frac — car "\f" est un échappement JSON VALIDE (form feed),
    // alors que "\p" est invalide et fait bien lever JSON.parse.
    err = null;
    try { parseJsonStrict(llmRaw('{"a": "\\\\pi r^2"}'), 'Lot'); }
    catch (e) { err = e; }
    assert(err !== null && err.message.startsWith('Lot : JSON invalide'),
        'Sans healer injecté : comportement strict d\'origine (erreur, pas de crash)',
        err ? err.message : 'aucune erreur levée');

    // ===================================================================
    // 5. Parité avec le pipeline mono-appel
    // ===================================================================
    section('5. Parité mono-appel');

    // Le mono-appel fait JSON.parse(healJsonString(brut)) (h5p-creator.js).
    // parseJsonStrict doit produire EXACTEMENT le même objet sur le même brut.
    const parityRaw = llmRaw('{"questions": [{"question": "Résous \\\\(\\\\frac{x}{4} = 3\\\\)", "answers": ["x = 12", "x = 7"], "correct": 0, "feedback": "On multiplie par 4 : \\\\(x = 3 \\\\times 4\\\\)"}]}');
    try {
        const monoResult = JSON.parse(healJsonString(parityRaw));
        const batchResult = parseJsonStrict(parityRaw, 'Lot', healJsonString);
        assert(JSON.stringify(monoResult) === JSON.stringify(batchResult),
            'Même brut cassé : parseJsonStrict ≡ pipeline mono-appel (objets identiques)',
            `mono: ${JSON.stringify(monoResult).substring(0, 150)}\nbatch: ${JSON.stringify(batchResult).substring(0, 150)}`);
    } catch (e) {
        assert(false, 'Même brut cassé : parseJsonStrict ≡ pipeline mono-appel (objets identiques)', e.message);
    }

    // ===================================================================
    // 6. Non-régression — helpers purs du découpage en lots
    // ===================================================================
    section('6. Non-régression — découpage en lots');

    const b10 = balancedBatches(10, BATCH_CONFIG.batchSize);
    assert(b10.reduce((a, x) => a + x, 0) === 10,
        `balancedBatches(10, ${BATCH_CONFIG.batchSize}) : la somme des lots vaut 10`,
        `Got: [${b10.join(', ')}]`);
    assert(b10.every(x => x <= BATCH_CONFIG.batchSize),
        `balancedBatches(10, ${BATCH_CONFIG.batchSize}) : aucun lot ne dépasse la taille max`);

    const b20 = balancedBatches(20, 4);
    assert(b20.length === 5 && b20.every(x => x === 4),
        'balancedBatches(20, 4) : 5 lots de 4');

    assert(balancedBatches(0, 4).length === 0,
        'balancedBatches(0, 4) : aucun lot');

    // ===================================================================
    // 7. Lot en échec : redécoupé, pas relancé à l'identique (calibration 2026-09-28)
    // ===================================================================
    section('7. Redécoupage d\'un lot en échec');

    // Faux modèle : échoue sur les lots listés (par taille ou par 1er intitulé), sinon
    // renvoie un item par intitulé. Journalise chaque appel.
    function fauxModele({ echoueSi = () => false } = {}) {
        const appels = [];
        const attempt = async (slice) => {
            appels.push(slice.map(p => p.n).join(','));
            if (echoueSi(slice, appels.length)) throw new Error('panne simulée');
            return slice.map(p => ({ question: 'Q' + p.n }));
        };
        return { appels, attempt };
    }
    const tranche = [{ n: 1 }, { n: 2 }, { n: 3 }];

    {
        const m = fauxModele();
        const items = await fillWithSplit(tranche, m.attempt, { pauseMs: 0 });
        assert(m.appels.length === 1 && items.length === 3,
            'Lot sain : un seul appel, 3 items', `appels : ${JSON.stringify(m.appels)}`);
    }
    {
        // Le lot de 3 échoue (serveur lent) : ses moitiés [1,2] et [3] passent.
        const m = fauxModele({ echoueSi: (s) => s.length === 3 });
        let items = [];
        try { items = await fillWithSplit(tranche, m.attempt, { pauseMs: 0 }); } catch { /* constaté ci-dessous */ }
        assert(JSON.stringify(m.appels) === JSON.stringify(['1,2,3', '1,2', '3']),
            'Lot de 3 en échec : redécoupé en [1,2] puis [3], jamais relancé tel quel',
            `appels : ${JSON.stringify(m.appels)}`);
        assert(items.map(i => i.question).join() === 'Q1,Q2,Q3',
            'Redécoupage : l\'ordre des items suit celui du plan');
    }
    {
        // L'item seul est relancé `retries` fois, puis l'erreur remonte.
        const m = fauxModele({ echoueSi: () => true });
        let err = null;
        try { await fillWithSplit([{ n: 7 }], m.attempt, { retries: 1, pauseMs: 0 }); } catch (e) { err = e; }
        assert(err && m.appels.length === 2,
            'Item seul en échec : 1 relance (retries = 1) puis l\'erreur remonte',
            `appels : ${m.appels.length}`);
    }
    {
        // Panne franche sur un lot de 3 : [1,2,3] → [1,2] → [1] relancé une fois → abandon.
        const m = fauxModele({ echoueSi: () => true });
        let err = null;
        try { await fillWithSplit(tranche, m.attempt, { budget: { left: 4 }, pauseMs: 0 }); } catch (e) { err = e; }
        assert(err && JSON.stringify(m.appels) === JSON.stringify(['1,2,3', '1,2', '1', '1']),
            'Panne franche : abandon après 4 appels, sans attendre la moitié restante (tout-ou-rien)',
            `appels : ${JSON.stringify(m.appels)}`);
    }
    {
        // Le budget est PARTAGÉ : épuisé par un autre lot, il coupe court aux relances.
        const m = fauxModele({ echoueSi: () => true });
        const budget = { left: 2 };
        let err = null;
        try { await fillWithSplit([{ n: 9 }], m.attempt, { budget, retries: 5, pauseMs: 0 }); } catch (e) { err = e; }
        assert(err && m.appels.length === 3 && budget.left < 0,
            'Budget de 2 échecs : abandon au 3e appel malgré retries = 5',
            `appels : ${m.appels.length}, budget : ${budget.left}`);
    }
    {
        // « Arrêter » n'est pas une panne : aucun redécoupage.
        const m = fauxModele();
        const attempt = async (slice) => {
            m.appels.push(slice.length);
            const e = new Error('annulé'); e.code = 'GENERATION_CANCELLED'; throw e;
        };
        let err = null;
        try { await fillWithSplit(tranche, attempt, { pauseMs: 0 }); } catch (e) { err = e; }
        assert(err && err.code === 'GENERATION_CANCELLED' && m.appels.length === 1,
            'Annulation : remonte aussitôt, sans redécoupage ni relance');
    }

    // ===================================================================
    // 8. Plan : consigne propre à l'activité (quiz mixte → types attribués)
    // ===================================================================
    section('8. Consigne de plan propre à l\'activité');

    const tFaux = { prompt_quizset_structure_json: 'STRUCT', batch_outline_hint_quiz_types: 'TYPES : varie-les sur les {count} éléments.' };
    const base = { prefix: 'prompt_quizset', params: { qui: 'un prof', quoi: 'la mer', ocrContent: '' }, t: tFaux, count: 5, path: 'questions', itemName: 'question', carcasse: ['title', 'overallFeedback'] };
    const sansHint = buildOutlinePrompt(base);
    const avecHint = buildOutlinePrompt({ ...base, planHint: 'batch_outline_hint_quiz_types' });
    assert(avecHint.includes('TYPES : varie-les sur les 5 éléments.'),
        'planHint : la consigne est ajoutée au plan, jetons {count} substitués');
    assert(avecHint.startsWith(sansHint),
        'planHint : ajoutée APRÈS la contrainte, le reste du prompt de plan est inchangé');
    assert(buildOutlinePrompt({ ...base, planHint: 'cle_absente' }) === sansHint,
        'planHint dont la clé manque : prompt de plan identique à celui sans consigne');

    // ===================================================================
    // 9. Réglages des trois quiz (definitions.js)
    // ===================================================================
    section('9. Réglages des quiz');

    const { h5pModules } = await import('../js/core/definitions.js');
    const qcm = h5pModules.QuizSetQCM, mixte = h5pModules.QuizSet, vf = h5pModules.QuizSetVF;
    assert(shouldChunk(qcm, qcm.chunking.defaultCount) && shouldChunk(mixte, mixte.chunking.defaultCount),
        'QCM et quiz mixte : le mode Rapide (defaultCount) passe par les lots');
    assert(!shouldChunk(qcm, 3) && shouldChunk(qcm, 4),
        'QCM : 3 questions en un appel, découpage dès 4');
    assert(!shouldChunk(vf, 8) && shouldChunk(vf, 9) && batchSizeFor(vf) === 8,
        'Vrai/Faux (items légers) : un appel jusqu\'à 8, lots de 8 au-delà');
    assert(batchSizeFor(qcm) === 3 && BATCH_CONFIG.concurrency === 2,
        'QCM : lots de 3, deux lots menés de front');
    assert(mixte.chunking.planHint === 'batch_outline_hint_quiz_types' && !qcm.chunking.planHint,
        'Seul le quiz mixte demande au plan d\'attribuer les types');

    // ===================================================================
    // RENDER (mode standalone uniquement)
    // ===================================================================
    if (typeof document !== 'undefined' && document.getElementById('summary')) {
        render();
    }

    return { passCount, failCount, results };
}

function render() {
    const summaryEl = document.getElementById('summary');
    summaryEl.innerHTML = `
        <div class="summary__card card--pass">${passCount}<small>PASS</small></div>
        <div class="summary__card card--fail">${failCount}<small>FAIL</small></div>
        <div class="summary__card card--total">${passCount + failCount}<small>TOTAL</small></div>
    `;

    const container = document.getElementById('results');
    let currentSec = '';
    let html = '';

    for (const r of results) {
        if (r.section !== currentSec) {
            if (currentSec) html += '</div>';
            currentSec = r.section;
            html += `<div class="section"><h2>${currentSec}</h2>`;
        }
        const cls = r.status === 'PASS' ? 'result--pass' : 'result--fail';
        html += `<div class="result ${cls}">${r.status === 'PASS' ? '&#10003;' : '&#10007;'} ${r.message}`;
        if (r.diagnostic && r.status === 'FAIL') {
            html += `<div class="diagnostic">${String(r.diagnostic).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`;
        }
        html += '</div>';
    }
    if (currentSec) html += '</div>';
    container.innerHTML = html;

    document.title = failCount === 0
        ? `PASS (${passCount}) — Test génération par lots`
        : `FAIL (${failCount}) — Test génération par lots`;
}

// Auto-exécution en mode standalone (ouverture directe du HTML)
if (typeof document !== 'undefined' && document.getElementById('summary')) {
    runAllTests().catch(err => {
        console.error('Erreur fatale:', err);
        document.getElementById('results').innerHTML = `<div class="result result--fail">Erreur fatale : ${err.message}</div>`;
    });
}
