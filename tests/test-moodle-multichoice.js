/**
 * Tests unitaires pour le bug "multichoice reponses multiples → single dans Elea"
 *
 * Verifie la chaine complete :
 * 1. determineSingleMode() — auto-detection single/multiple
 * 2. generateMoodleXml() — XML avec <single>true/false</single>
 * 3. generateMoodleGift() — GIFT avec format multi-answer (%fraction%)
 * 4. normalizeDataForEditor() — injection du champ single manquant
 * 5. Exemples JSON existants — coherence des fichiers test_*.json
 *
 * Usage : ouvrir tests/test-moodle-multichoice.html depuis le serveur local.
 */

import { generateMoodleXml, generateMoodleGift, normalizeFractions, VALID_MOODLE_FRACTIONS } from '../js/moodle/moodle-formats.js';
import { normalizeDataForEditor, detectContentType } from '../js/editor/content-detector.js';

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

// =======================================================================
// DONNEES DE TEST
// =======================================================================

/** Question a reponse unique — 1 seule fraction > 0 */
const SINGLE_ANSWER_QUESTION = {
    type: 'multichoice',
    content: {
        name: 'Q1 - Capitale',
        questiontext: 'Quelle est la capitale de la France ?',
        feedback: 'Paris est la capitale.',
        answers: [
            { text: 'Paris', fraction: 100, feedback: 'Exact !' },
            { text: 'Lyon', fraction: 0, feedback: 'Non.' },
            { text: 'Marseille', fraction: 0, feedback: 'Non.' }
        ]
    }
};

/** Question a reponses multiples — plusieurs fractions > 0 */
const MULTIPLE_ANSWERS_QUESTION = {
    type: 'multichoice',
    content: {
        name: 'Q2 - Energies',
        questiontext: 'Lesquelles sont renouvelables ?',
        feedback: 'Solaire et eolien sont renouvelables.',
        answers: [
            { text: 'Solaire', fraction: 50, feedback: 'Oui.' },
            { text: 'Eolien', fraction: 50, feedback: 'Oui.' },
            { text: 'Petrole', fraction: 0, feedback: 'Non.' },
            { text: 'Charbon', fraction: 0, feedback: 'Non.' }
        ]
    }
};

/** Question avec single explicite en string (comme venant de l'editeur) */
const EXPLICIT_SINGLE_STRING = {
    type: 'multichoice',
    content: {
        name: 'Q3 - Explicit string',
        questiontext: 'Test explicite string',
        feedback: 'Test.',
        single: 'false',
        answers: [
            { text: 'A', fraction: 50, feedback: '' },
            { text: 'B', fraction: 50, feedback: '' },
            { text: 'C', fraction: 0, feedback: '' }
        ]
    }
};

/** Question avec single explicite en boolean (comme possiblement du LLM) */
const EXPLICIT_SINGLE_BOOLEAN = {
    type: 'multichoice',
    content: {
        name: 'Q4 - Explicit boolean',
        questiontext: 'Test explicite boolean false',
        feedback: 'Test.',
        single: false,
        answers: [
            { text: 'A', fraction: 50, feedback: '' },
            { text: 'B', fraction: 50, feedback: '' },
            { text: 'C', fraction: 0, feedback: '' }
        ]
    }
};

/** Banque de questions mixte */
const MIXED_BANK = {
    bank_name: 'Test mixte',
    bank_description: 'Banque de test',
    questions: [
        SINGLE_ANSWER_QUESTION,
        MULTIPLE_ANSWERS_QUESTION,
        EXPLICIT_SINGLE_STRING,
        EXPLICIT_SINGLE_BOOLEAN,
        {
            type: 'truefalse',
            content: {
                name: 'Q5 - VF',
                questiontext: 'Le ciel est bleu.',
                feedback: 'Oui.',
                answer: { value: true, feedback_true: 'Oui.', feedback_false: 'Non.' }
            }
        }
    ]
};

// =======================================================================
// TESTS
// =======================================================================

async function runTests() {
    // ===================================================================
    // 1. XML Generation — <single> tag
    // ===================================================================
    section('1. XML — balise <single>');

    const xml = generateMoodleXml(MIXED_BANK);

    // Extraire toutes les balises <single>...</single>
    const singleMatches = [...xml.matchAll(/<single>(true|false)<\/single>/g)];
    assert(singleMatches.length === 4, `4 balises <single> trouvees (got ${singleMatches.length})`);

    // Q1 : reponse unique (1 fraction > 0, pas de champ single) → true
    assert(singleMatches[0]?.[1] === 'true',
        'Q1 (auto-detect, 1 bonne reponse) → <single>true</single>',
        `Got: ${singleMatches[0]?.[1]}`);

    // Q2 : reponses multiples (2 fractions > 0, pas de champ single) → false
    assert(singleMatches[1]?.[1] === 'false',
        'Q2 (auto-detect, 2 bonnes reponses) → <single>false</single>',
        `Got: ${singleMatches[1]?.[1]}`);

    // Q3 : single explicite string "false" → false
    assert(singleMatches[2]?.[1] === 'false',
        'Q3 (single="false" explicite string) → <single>false</single>',
        `Got: ${singleMatches[2]?.[1]}`);

    // Q4 : single explicite boolean false → false
    assert(singleMatches[3]?.[1] === 'false',
        'Q4 (single=false explicite boolean) → <single>false</single>',
        `Got: ${singleMatches[3]?.[1]}`);

    // ===================================================================
    // 2. GIFT Generation — format multi-answer
    // ===================================================================
    section('2. GIFT — format reponses multiples');

    const gift = generateMoodleGift(MIXED_BANK);

    // Q1 single answer : doit utiliser = pour la bonne reponse
    const q1Lines = gift.split('::Q1')[1]?.split('::Q2')[0] || '';
    assert(q1Lines.includes('=<p>Paris</p>'),
        'Q1 GIFT : bonne reponse avec prefixe = (single)',
        q1Lines.substring(0, 200));

    // Q2 multiple answers : doit utiliser %fraction% pour les bonnes reponses
    const q2Lines = gift.split('::Q2')[1]?.split('::Q3')[0] || '';
    assert(q2Lines.includes('%50%'),
        'Q2 GIFT : bonnes reponses avec %fraction% (multiple)',
        q2Lines.substring(0, 300));
    assert(!q2Lines.includes('=<p>'),
        'Q2 GIFT : pas de prefixe = en mode multiple',
        q2Lines.substring(0, 300));

    // ===================================================================
    // 3. Editor normalization — injection de single manquant
    // ===================================================================
    section('3. Editeur — normalisation');

    // Données sans champ single, comme ce que le LLM génère
    const dataNoSingle = structuredClone({
        bank_name: 'Test',
        bank_description: 'Test',
        questions: [
            {
                type: 'multichoice',
                content: {
                    name: 'Q1',
                    questiontext: 'Test ?',
                    feedback: 'Ok.',
                    answers: [
                        { text: 'A', fraction: 100, feedback: '' },
                        { text: 'B', fraction: 0, feedback: '' }
                    ]
                }
            },
            {
                type: 'multichoice',
                content: {
                    name: 'Q2',
                    questiontext: 'Test multi ?',
                    feedback: 'Ok.',
                    answers: [
                        { text: 'A', fraction: 50, feedback: '' },
                        { text: 'B', fraction: 50, feedback: '' },
                        { text: 'C', fraction: 0, feedback: '' }
                    ]
                }
            }
        ]
    });

    const normalized = normalizeDataForEditor(dataNoSingle, 'elea_test');

    assert(normalized.questions[0].content.single === 'true',
        'Normalisation : Q1 (1 bonne) → single="true" injecte',
        `Got: ${normalized.questions[0].content.single}`);

    assert(normalized.questions[1].content.single === 'false',
        'Normalisation : Q2 (2 bonnes) → single="false" injecte',
        `Got: ${normalized.questions[1].content.single}`);

    // Données avec single déjà présent — ne doit pas être écrasé
    const dataWithSingle = structuredClone(dataNoSingle);
    dataWithSingle.questions[0].content.single = 'false'; // volontairement opposé
    const normalized2 = normalizeDataForEditor(dataWithSingle, 'elea_test');
    assert(normalized2.questions[0].content.single === 'false',
        'Normalisation : single existant preserve (pas ecrase)',
        `Got: ${normalized2.questions[0].content.single}`);

    // ===================================================================
    // 4. Roundtrip : JSON → XML → re-parse verification
    // ===================================================================
    section('4. Roundtrip JSON → XML coherence');

    // Simuler le flux editeur : normaliser → modifier → re-generer XML
    const editData = structuredClone(MIXED_BANK);
    const editNormalized = normalizeDataForEditor(editData, 'elea_test');

    // L'editeur change Q1 de single à multiple
    editNormalized.questions[0].content.single = 'false';
    editNormalized.questions[0].content.answers[1].fraction = 50;
    editNormalized.questions[0].content.answers[0].fraction = 50;

    const xmlAfterEdit = generateMoodleXml(editNormalized);
    const singleAfterEdit = [...xmlAfterEdit.matchAll(/<single>(true|false)<\/single>/g)];

    assert(singleAfterEdit[0]?.[1] === 'false',
        'Roundtrip : Q1 modifiee en multiple → <single>false</single>',
        `Got: ${singleAfterEdit[0]?.[1]}`);

    // ===================================================================
    // 5. Exemples JSON existants — coherence
    // ===================================================================
    section('5. Exemples JSON — coherence');

    const exampleFiles = ['test_1.json', 'test_2.json', 'test_3.json', 'test_4.json', 'test_5.json'];
    for (const file of exampleFiles) {
        try {
            const resp = await fetch(`assets/data/examples/${file}`);
            if (!resp.ok) { assert(false, `${file} : chargement echoue (${resp.status})`); continue; }
            const data = await resp.json();

            // Verifier que generateMoodleXml ne plante pas
            let xmlOk = false;
            try {
                const exXml = generateMoodleXml(data);
                xmlOk = exXml.includes('<quiz>') && exXml.includes('</quiz>');
            } catch (e) {
                assert(false, `${file} : generateMoodleXml() a plante`, e.message);
                continue;
            }
            assert(xmlOk, `${file} : generateMoodleXml() produit un XML valide`);

            // Verifier la coherence single/multi pour chaque question multichoice
            if (data.questions) {
                data.questions.forEach((q, i) => {
                    if (q.type !== 'multichoice') return;
                    const answers = q.content.answers || [];
                    const correctCount = answers.filter(a => Number(a.fraction) > 0).length;

                    if (q.content.single !== undefined) {
                        // Si single est explicite, verifier la coherence avec les fractions
                        if (q.content.single === 'false' || q.content.single === false) {
                            assert(correctCount > 1,
                                `${file} Q${i+1} : single=false → ${correctCount} bonnes reponses (OK si > 1)`,
                                JSON.stringify(answers.map(a => a.fraction)));
                        }
                    }
                    // Verifier que l'auto-detection produit le bon resultat dans le XML
                    const singleXml = generateMoodleXml({ questions: [q] });
                    const singleTag = singleXml.match(/<single>(true|false)<\/single>/);
                    if (singleTag) {
                        const expected = correctCount > 1 ? 'false' : 'true';
                        const actual = singleTag[1];
                        // Si pas de champ single, l'auto-detection doit correspondre
                        if (q.content.single === undefined) {
                            assert(actual === expected,
                                `${file} Q${i+1} : auto-detect → <single>${expected}</single>`,
                                `Got: ${actual}, correctCount: ${correctCount}`);
                        }
                    }
                });
            }
        } catch (e) {
            assert(false, `${file} : erreur inattendue`, e.message);
        }
    }

    // ===================================================================
    // 6. Cas limites
    // ===================================================================
    section('6. Cas limites');

    // Question sans reponses
    const noAnswers = { bank_name: 'T', questions: [{ type: 'multichoice', content: { name: 'Q', questiontext: 'Q?', feedback: '', answers: [] } }] };
    try {
        const xmlNoAns = generateMoodleXml(noAnswers);
        assert(xmlNoAns.includes('<single>true</single>'),
            'Aucune reponse → <single>true</single> par defaut');
    } catch (e) {
        assert(false, 'Aucune reponse : ne doit pas planter', e.message);
    }

    // Question avec single="true" en string (editeur)
    const singleTrue = { bank_name: 'T', questions: [{ type: 'multichoice', content: { name: 'Q', questiontext: 'Q?', feedback: '', single: 'true', answers: [{ text: 'A', fraction: 50 }, { text: 'B', fraction: 50 }] } }] };
    const xmlSingleTrue = generateMoodleXml(singleTrue);
    assert(xmlSingleTrue.includes('<single>true</single>'),
        'single="true" explicite respecte meme avec 2 fractions > 0',
        'Le champ explicite a priorite sur l auto-detection');

    // Question avec single=true en boolean
    const singleBoolTrue = { bank_name: 'T', questions: [{ type: 'multichoice', content: { name: 'Q', questiontext: 'Q?', feedback: '', single: true, answers: [{ text: 'A', fraction: 50 }, { text: 'B', fraction: 50 }] } }] };
    const xmlBoolTrue = generateMoodleXml(singleBoolTrue);
    assert(xmlBoolTrue.includes('<single>true</single>'),
        'single=true (boolean) explicite respecte');

    // ===================================================================
    // 7. Normalisation des fractions Moodle
    // ===================================================================
    section('7. Normalisation des fractions');

    // Helper : verifie que toutes les fractions sont valides Moodle
    function isValidMoodleFraction(f) {
        return f === 0 || VALID_MOODLE_FRACTIONS.some(v => Math.abs(v - f) < 0.001);
    }
    function sumPositive(answers) {
        return answers.reduce((s, a) => s + (a.fraction > 0 ? a.fraction : 0), 0);
    }

    // 7a. Fractions deja valides → pas de changement
    const validAnswers = [
        { text: 'A', fraction: 50 },
        { text: 'B', fraction: 50 },
        { text: 'C', fraction: 0 }
    ];
    const norm7a = normalizeFractions(validAnswers);
    assert(norm7a[0].fraction === 50 && norm7a[1].fraction === 50,
        '7a. Fractions valides (50+50) → inchangees');

    // 7b. Fractions invalides du bug reel : 45+45=90
    const bug45 = [
        { text: 'A', fraction: 45 },
        { text: 'B', fraction: 45 },
        { text: 'C', fraction: 0 },
        { text: 'D', fraction: 0 }
    ];
    const norm7b = normalizeFractions(bug45);
    const sum7b = sumPositive(norm7b);
    assert(Math.abs(sum7b - 100) < 0.01,
        `7b. Bug 45+45 → somme corrigee = ${sum7b.toFixed(2)} (attendu 100)`,
        JSON.stringify(norm7b.map(a => a.fraction)));
    assert(norm7b.every(a => isValidMoodleFraction(a.fraction)),
        '7b. Toutes les fractions sont des valeurs Moodle valides',
        JSON.stringify(norm7b.map(a => a.fraction)));

    // 7c. Bug reel : 40+40=80
    const bug40 = [
        { text: 'A', fraction: 40 },
        { text: 'B', fraction: 40 },
        { text: 'C', fraction: 0 },
        { text: 'D', fraction: 0 }
    ];
    const norm7c = normalizeFractions(bug40);
    const sum7c = sumPositive(norm7c);
    assert(Math.abs(sum7c - 100) < 0.01,
        `7c. Bug 40+40 → somme corrigee = ${sum7c.toFixed(2)} (attendu 100)`,
        JSON.stringify(norm7c.map(a => a.fraction)));
    assert(norm7c.every(a => isValidMoodleFraction(a.fraction)),
        '7c. Toutes les fractions sont des valeurs Moodle valides',
        JSON.stringify(norm7c.map(a => a.fraction)));

    // 7d. Bug reel : 50+30=80
    const bug5030 = [
        { text: 'A', fraction: 50 },
        { text: 'B', fraction: 30 },
        { text: 'C', fraction: 0 },
        { text: 'D', fraction: 0 }
    ];
    const norm7d = normalizeFractions(bug5030);
    const sum7d = sumPositive(norm7d);
    assert(Math.abs(sum7d - 100) < 0.01,
        `7d. Bug 50+30 → somme corrigee = ${sum7d.toFixed(2)} (attendu 100)`,
        JSON.stringify(norm7d.map(a => a.fraction)));
    assert(norm7d.every(a => isValidMoodleFraction(a.fraction)),
        '7d. Toutes les fractions sont des valeurs Moodle valides',
        JSON.stringify(norm7d.map(a => a.fraction)));

    // 7e. 3 reponses positives : 33.33333+33.33333+33.33334 → normalise
    const threeEqual = [
        { text: 'A', fraction: 33.33333 },
        { text: 'B', fraction: 33.33333 },
        { text: 'C', fraction: 33.33334 },
        { text: 'D', fraction: 0 }
    ];
    const norm7e = normalizeFractions(threeEqual);
    const sum7e = sumPositive(norm7e);
    assert(Math.abs(sum7e - 100) < 0.01,
        `7e. 3 reponses ≈33.33 → somme = ${sum7e.toFixed(2)} (attendu 100)`,
        JSON.stringify(norm7e.map(a => a.fraction)));
    assert(norm7e.every(a => isValidMoodleFraction(a.fraction)),
        '7e. Toutes les fractions Moodle valides',
        JSON.stringify(norm7e.map(a => a.fraction)));

    // 7f. 1 seule reponse positive (reponse unique) → 100
    const singlePos = [
        { text: 'A', fraction: 75 },
        { text: 'B', fraction: 0 },
        { text: 'C', fraction: 0 }
    ];
    const norm7f = normalizeFractions(singlePos);
    assert(norm7f[0].fraction === 100,
        '7f. 1 seule positive (75) → normalisee a 100',
        `Got: ${norm7f[0].fraction}`);

    // 7g. 4 reponses positives egales : 25+25+25+25 → OK
    const fourEqual = [
        { text: 'A', fraction: 25 },
        { text: 'B', fraction: 25 },
        { text: 'C', fraction: 25 },
        { text: 'D', fraction: 25 }
    ];
    const norm7g = normalizeFractions(fourEqual);
    const sum7g = sumPositive(norm7g);
    assert(Math.abs(sum7g - 100) < 0.01,
        `7g. 4×25 → somme = ${sum7g.toFixed(2)} (attendu 100)`);
    assert(norm7g.every(a => a.fraction === 25 || a.fraction === 0),
        '7g. 4×25 inchangees');

    // 7h. 5 reponses positives : 20+20+20+20+20 → OK
    const fiveEqual = [
        { text: 'A', fraction: 20 },
        { text: 'B', fraction: 20 },
        { text: 'C', fraction: 20 },
        { text: 'D', fraction: 20 },
        { text: 'E', fraction: 20 },
        { text: 'F', fraction: 0 }
    ];
    const norm7h = normalizeFractions(fiveEqual);
    const sum7h = sumPositive(norm7h);
    assert(Math.abs(sum7h - 100) < 0.01,
        `7h. 5×20 → somme = ${sum7h.toFixed(2)} (attendu 100)`);

    // 7i. Tableau vide → pas de crash
    const normEmpty = normalizeFractions([]);
    assert(Array.isArray(normEmpty) && normEmpty.length === 0,
        '7i. Tableau vide → tableau vide retourne');

    // 7j. Toutes les fractions a 0 → pas de changement
    const allZero = [
        { text: 'A', fraction: 0 },
        { text: 'B', fraction: 0 }
    ];
    const normZero = normalizeFractions(allZero);
    assert(normZero[0].fraction === 0 && normZero[1].fraction === 0,
        '7j. Toutes a 0 → inchangees');

    // ===================================================================
    // 8. Normalisation dans le pipeline XML complet
    // ===================================================================
    section('8. Normalisation integree au XML');

    // Reproduire le bug exact de la collegue : Q9 avec fractions 45+45
    const bugBank = {
        bank_name: 'Test Bug Fractions',
        bank_description: 'Reproduit le bug reel',
        questions: [
            {
                type: 'multichoice',
                content: {
                    name: 'Q9 - Adaptations',
                    questiontext: 'Quelles adaptations ?',
                    feedback: 'Test.',
                    single: 'false',
                    answers: [
                        { text: 'Feuilles larges', fraction: 45, feedback: 'Correct.' },
                        { text: 'Haute chlorophylle', fraction: 45, feedback: 'Correct.' },
                        { text: 'Cuticule epaisse', fraction: 0, feedback: 'Non.' },
                        { text: 'Orientation verticale', fraction: 0, feedback: 'Non.' }
                    ]
                }
            },
            {
                type: 'multichoice',
                content: {
                    name: 'Q6 - Hormones',
                    questiontext: 'Quelles hormones ?',
                    feedback: 'Test.',
                    single: 'false',
                    answers: [
                        { text: 'Auxine', fraction: 50, feedback: '' },
                        { text: 'Gibberelline', fraction: 30, feedback: '' },
                        { text: 'Cytokinine', fraction: 0, feedback: '' },
                        { text: 'Ethylene', fraction: 0, feedback: '' }
                    ]
                }
            },
            {
                type: 'multichoice',
                content: {
                    name: 'Q11 - Mycorhizes',
                    questiontext: 'Lesquelles sont correctes ?',
                    feedback: 'Test.',
                    single: 'false',
                    answers: [
                        { text: 'Surface absorption', fraction: 40, feedback: '' },
                        { text: 'Mutuel benefique', fraction: 40, feedback: '' },
                        { text: 'Plantes aquatiques', fraction: 0, feedback: '' },
                        { text: 'Fixation azote', fraction: 0, feedback: '' }
                    ]
                }
            }
        ]
    };

    const bugXml = generateMoodleXml(bugBank);

    // Extraire toutes les fractions du XML genere
    const xmlFractions = [...bugXml.matchAll(/fraction="([^"]+)"/g)].map(m => parseFloat(m[1]));
    const invalidXmlFractions = xmlFractions.filter(f => !isValidMoodleFraction(f));
    assert(invalidXmlFractions.length === 0,
        `8a. Aucune fraction invalide dans le XML (${xmlFractions.length} fractions)`,
        invalidXmlFractions.length > 0 ? `Invalides: ${JSON.stringify(invalidXmlFractions)}` : null);

    // Verifier que chaque question a des fractions positives sommant a 100
    const questionBlocks = bugXml.split('<question type="multichoice">').slice(1);
    questionBlocks.forEach((block, i) => {
        const fracs = [...block.matchAll(/fraction="([^"]+)"/g)].map(m => parseFloat(m[1]));
        const posSum = fracs.filter(f => f > 0).reduce((s, f) => s + f, 0);
        assert(Math.abs(posSum - 100) < 0.01,
            `8b. Question ${i+1} : somme fractions positives = ${posSum.toFixed(2)} (attendu 100)`,
            `Fractions: ${JSON.stringify(fracs)}`);
    });

    // GIFT aussi
    const bugGift = generateMoodleGift(bugBank);
    // Extraire les %fraction% du GIFT
    const giftFractions = [...bugGift.matchAll(/%([0-9.]+)%/g)].map(m => parseFloat(m[1]));
    const invalidGiftFractions = giftFractions.filter(f => !isValidMoodleFraction(f));
    assert(invalidGiftFractions.length === 0,
        `8c. Aucune fraction invalide dans le GIFT (${giftFractions.length} fractions)`,
        invalidGiftFractions.length > 0 ? `Invalides: ${JSON.stringify(invalidGiftFractions)}` : null);

    // ===================================================================
    // RENDER
    // ===================================================================
    render();
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
            html += `<div class="diagnostic">${r.diagnostic}</div>`;
        }
        html += '</div>';
    }
    if (currentSec) html += '</div>';
    container.innerHTML = html;

    // Titre de la page avec le resultat
    document.title = failCount === 0
        ? `PASS (${passCount}) — Test Moodle Multichoice`
        : `FAIL (${failCount}) — Test Moodle Multichoice`;
}

runTests().catch(err => {
    console.error('Erreur fatale:', err);
    document.getElementById('results').innerHTML = `<div class="result result--fail">Erreur fatale : ${err.message}</div>`;
});
