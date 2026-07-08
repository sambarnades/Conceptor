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

import { parseJsonStrict, balancedBatches, BATCH_CONFIG } from '../js/services/llm-batch.js';
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
