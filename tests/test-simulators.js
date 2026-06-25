/**
 * Tests de non-regression pour la refactorisation des simulateurs Caramel.
 *
 * Verifie que le decoupage de simulators.js en modules individuels
 * (js/simulators/*.js) n'a rien casse :
 *   1. Le registre exporte les bonnes fonctions
 *   2. Tous les titleKeys sont enregistres
 *   3. Les imports dynamiques resolvent correctement
 *   4. Les helpers partagés exportent les bonnes fonctions
 *   5. Chaque simulateur se monte sans erreur sur des donnees minimales
 *   6. Le rendu produit la structure DOM attendue
 *
 * Usage : ouvrir tests/test-simulators.html depuis le serveur local.
 */

import { renderSimulator, hasSimulator } from '../js/simulators/index.js';
import { tr, formatTextSafe, fixMathSpacing, createFullscreenButton, safeUrl, escapeAttr } from '../js/simulators/helpers.js';
import renderPage from '../js/simulators/page.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

function assertEqual(actual, expected, message) {
    const match = JSON.stringify(actual) === JSON.stringify(expected);
    assert(match, message, match ? null : { expected: JSON.stringify(expected), actual: JSON.stringify(actual) });
}

function assertDefined(value, message) {
    assert(value !== undefined && value !== null, message, { actual: String(value) });
}

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

function group(name) {
    _ctx.stepName = name;
}

/** Cree un conteneur DOM temporaire pour les tests de rendu */
function createTestContainer() {
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:800px;height:600px;';
    document.body.appendChild(div);
    return div;
}

function removeTestContainer(div) {
    if (div && div.parentNode) div.parentNode.removeChild(div);
}

// =======================================================================
// NOMS DES ETAPES
// =======================================================================

export const STEP_NAMES = [
    '',
    'Registre (index.js)',
    'Helpers partages',
    'Imports dynamiques',
    'Rendu Millionnaire',
    'Rendu Appariement',
    'Rendu Glossaire',
    'Rendu QCM',
    'Rendu Test Elea',
    'Rendu Page',
    'Rendu Livre',
    'Rendu Devoir',
    'Securite XSS (SEC-01)'
];

export const STEP_DESCRIPTIONS = {
    1: 'Verifie que index.js exporte renderSimulator et hasSimulator, et que tous les titleKeys sont enregistres.',
    2: 'Verifie que helpers.js exporte tr, formatTextSafe, fixMathSpacing, createFullscreenButton avec le bon comportement.',
    3: 'Verifie que chaque import dynamique du registre resout un module avec un export default function.',
    4: 'Monte le simulateur Millionnaire sur des donnees minimales et verifie la structure DOM.',
    5: 'Monte le simulateur Appariement sur des donnees minimales et verifie la structure DOM.',
    6: 'Monte le simulateur Glossaire sur des donnees minimales et verifie la structure DOM.',
    7: 'Monte le simulateur QCM sur des donnees minimales et verifie la structure DOM.',
    8: 'Monte le simulateur Test Elea sur des donnees minimales et verifie la structure DOM.',
    9: 'Monte le simulateur Page sur des donnees minimales et verifie la structure DOM.',
    10: 'Monte le simulateur Livre avec du previewHtml et verifie la structure DOM.',
    11: 'Monte le simulateur Devoir sur des donnees minimales et verifie la structure DOM.',
    12: 'SEC-01 : verifie que safeUrl()/escapeAttr() neutralisent les schemas dangereux (javascript:/data:/vbscript:) et la fermeture d\'attribut dans le rendu par blocs de Page, sans alterer les URLs legitimes.'
};

// =======================================================================
// DONNEES DE TEST MINIMALES
// =======================================================================

const TEST_DATA = {
    millionnaire: {
        title: 'Test Millionnaire',
        questions: [
            { question: 'Quelle est la capitale de la France ?', goodanswer: 'Paris', badanswer: ['Lyon', 'Marseille', 'Toulouse'] },
            { question: '2 + 2 = ?', goodanswer: '4', badanswer: ['3', '5', '6'] }
        ]
    },
    appariement: {
        title: 'Test Appariement',
        pairs: [
            { question: 'France', answer: 'Paris' },
            { question: 'Allemagne', answer: 'Berlin' },
            { question: 'Espagne', answer: 'Madrid' }
        ]
    },
    glossaire: {
        name: 'Test Glossaire',
        entries: [
            { concept: 'Algorithme', definition: 'Suite finie d\'instructions' },
            { concept: 'Variable', definition: 'Espace de stockage nomme' }
        ]
    },
    qcm: {
        title: 'Test QCM',
        questions: [
            {
                text: 'Quel langage est utilise pour le web ?',
                answers: [
                    { text: 'JavaScript', correct: true },
                    { text: 'Python', correct: false },
                    { text: 'C++', correct: false }
                ]
            }
        ]
    },
    eleaTest: {
        bank_name: 'Test Elea',
        bank_description: 'Description du test',
        questions: [
            {
                type: 'multichoice',
                content: {
                    name: 'Q1',
                    questiontext: 'Question de test',
                    single: true,
                    answers: [
                        { text: 'Bonne reponse', fraction: 100, feedback: 'Correct !' },
                        { text: 'Mauvaise reponse', fraction: 0, feedback: 'Incorrect.' }
                    ]
                }
            }
        ]
    },
    page: {
        title: 'Test Page',
        intro: 'Introduction de la page',
        blocks: [
            { type: '#01_hero_header', data: { title: 'Hero Title', subtitle: 'Subtitle' } },
            { type: '#11_definition_box', data: { title: 'Definition', text: 'Ceci est une definition.' } }
        ]
    },
    livre: {
        title: 'Test Livre',
        chapters: [{ title: 'Chapitre 1', content: 'Contenu' }]
    },
    devoir: {
        title: 'Test Devoir',
        rubricName: 'Grille de test',
        description: 'Description du devoir',
        criteria: [
            {
                description: 'Critere 1',
                levels: [
                    { definition: 'Insuffisant', score: 0 },
                    { definition: 'Suffisant', score: 5 },
                    { definition: 'Excellent', score: 10 }
                ]
            }
        ]
    }
};

// =======================================================================
// ETAPE 1 : REGISTRE (index.js)
// =======================================================================

async function runStep1_Registry() {
    console.group('Etape 1 : Registre (index.js)');
    _ctx = { step: 1, stepName: 'Registre', file: 'simulators/index.js', module: '', source: 'simulators' };

    // 1a. Exports
    assertDefined(renderSimulator, '[1a] renderSimulator est exporte');
    assert(typeof renderSimulator === 'function', '[1a] renderSimulator est une fonction');
    assertDefined(hasSimulator, '[1a] hasSimulator est exporte');
    assert(typeof hasSimulator === 'function', '[1a] hasSimulator est une fonction');

    // 1b. Tous les titleKeys attendus sont enregistres
    const expectedKeys = [
        'elea_millionnaire_name',
        'elea_appariement_name',
        'elea_glossaire_xml_name',
        'elea_qcm_name',
        'elea_test_xml_name',
        'elea_page_name',
        'elea_livre_name',
        'elea_devoir_name'
    ];

    for (const key of expectedKeys) {
        assert(hasSimulator(key), `[1b] hasSimulator("${key}") === true`);
    }

    // 1c. Un titleKey inconnu retourne false
    assert(!hasSimulator('nonexistent_key'), '[1c] hasSimulator("nonexistent_key") === false');
    assert(!hasSimulator(''), '[1c] hasSimulator("") === false');

    // 1d. renderSimulator retourne false pour un titleKey inconnu
    const result = await renderSimulator('nonexistent_key', document.createElement('div'), {});
    assertEqual(result, false, '[1d] renderSimulator retourne false pour un titleKey inconnu');

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : HELPERS PARTAGES
// =======================================================================

async function runStep2_Helpers() {
    console.group('Etape 2 : Helpers partages');
    _ctx = { step: 2, stepName: 'Helpers', file: 'simulators/helpers.js', module: '', source: 'simulators' };

    // 2a. tr() avec fallback
    const fallbackResult = tr('nonexistent_key_xyz', 'Fallback text');
    assertEqual(fallbackResult, 'Fallback text', '[2a] tr() retourne le fallback si la cle n\'existe pas');

    // 2b. formatTextSafe
    assertDefined(formatTextSafe, '[2b] formatTextSafe est exporte');
    assert(typeof formatTextSafe === 'function', '[2b] formatTextSafe est une fonction');
    const safeResult = formatTextSafe('Hello **world**');
    assert(typeof safeResult === 'string', '[2b] formatTextSafe retourne une string');
    assert(safeResult.length > 0, '[2b] formatTextSafe retourne un resultat non vide');
    assertEqual(formatTextSafe(''), '', '[2b] formatTextSafe("") retourne ""');
    assertEqual(formatTextSafe(null), '', '[2b] formatTextSafe(null) retourne ""');

    // 2c. fixMathSpacing
    assertDefined(fixMathSpacing, '[2c] fixMathSpacing est exporte');
    assert(typeof fixMathSpacing === 'function', '[2c] fixMathSpacing est une fonction');
    assertEqual(fixMathSpacing(''), '', '[2c] fixMathSpacing("") retourne ""');
    assertEqual(fixMathSpacing(null), '', '[2c] fixMathSpacing(null) retourne ""');
    // Verifie que l'espacement est ajoute avant les delimiteurs LaTeX
    const mathResult = fixMathSpacing('texte\\(x\\)suite');
    assert(mathResult.includes('\u00A0'), '[2c] fixMathSpacing ajoute un espace insecable avant \\(');

    // 2d. createFullscreenButton
    assertDefined(createFullscreenButton, '[2d] createFullscreenButton est exporte');
    assert(typeof createFullscreenButton === 'function', '[2d] createFullscreenButton est une fonction');
    const btn = createFullscreenButton(true);
    assert(btn instanceof HTMLButtonElement, '[2d] createFullscreenButton retourne un HTMLButtonElement');
    assert(btn.classList.contains('preview-modal__fullscreen-btn'), '[2d] Le bouton a la classe preview-modal__fullscreen-btn');
    assert(btn.classList.contains('preview-modal__fullscreen-btn--integrated'), '[2d] Le bouton a la classe --integrated');
    assert(btn.hasAttribute('aria-label'), '[2d] Le bouton a un aria-label');

    // 2d bis. Sans le mode integre
    const btn2 = createFullscreenButton(false);
    assert(!btn2.classList.contains('preview-modal__fullscreen-btn--integrated'), '[2d] Sans integrated, pas de classe --integrated');

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : IMPORTS DYNAMIQUES
// =======================================================================

async function runStep3_DynamicImports() {
    console.group('Etape 3 : Imports dynamiques');
    _ctx = { step: 3, stepName: 'Imports dynamiques', file: 'simulators/index.js', module: '', source: 'simulators' };

    const moduleFiles = [
        { key: 'elea_millionnaire_name', file: 'millionnaire.js' },
        { key: 'elea_appariement_name', file: 'appariement.js' },
        { key: 'elea_glossaire_xml_name', file: 'glossaire.js' },
        { key: 'elea_qcm_name', file: 'qcm.js' },
        { key: 'elea_test_xml_name', file: 'elea-test.js' },
        { key: 'elea_page_name', file: 'page.js' },
        { key: 'elea_livre_name', file: 'livre.js' },
        { key: 'elea_devoir_name', file: 'devoir.js' }
    ];

    for (const { key, file } of moduleFiles) {
        _ctx.module = file;
        const t0 = performance.now();
        try {
            const mod = await import(`../js/simulators/${file}`);
            const elapsed = performance.now() - t0;
            recordTiming('import', file, elapsed);

            assertDefined(mod.default, `[3] ${file} a un export default`);
            assert(typeof mod.default === 'function', `[3] ${file} : export default est une fonction`);
        } catch (err) {
            assert(false, `[3] ${file} : import echoue`, { error: err.message });
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPES 4-11 : RENDU DES SIMULATEURS
// =======================================================================

async function runSimulatorRenderTest(step, titleKey, data, checks) {
    const container = createTestContainer();
    _ctx = { step, stepName: STEP_NAMES[step], file: `simulators/${titleKey}`, module: titleKey, source: 'simulators' };

    const t0 = performance.now();
    try {
        const result = await renderSimulator(titleKey, container, data);
        const elapsed = performance.now() - t0;
        recordTiming('render', titleKey, elapsed);

        assert(result === true, `[${step}] renderSimulator retourne true`);
        assert(container.children.length > 0, `[${step}] Le conteneur n'est pas vide apres le rendu`);

        // Verifications specifiques
        for (const check of checks) {
            check(container, step);
        }
    } catch (err) {
        assert(false, `[${step}] Rendu echoue pour ${titleKey}`, { error: err.message, stack: err.stack?.substring(0, 200) });
    }

    removeTestContainer(container);
}

async function runStep4_Millionnaire() {
    console.group('Etape 4 : Rendu Millionnaire');
    await runSimulatorRenderTest(4, 'elea_millionnaire_name', TEST_DATA.millionnaire, [
        (c, s) => assert(c.querySelector('.millionnaire-simulator'), `[${s}] Conteneur .millionnaire-simulator present`),
        (c, s) => assert(c.querySelector('.millionnaire-question-box'), `[${s}] Boite de question presente`),
        (c, s) => assert(c.querySelector('.millionnaire-answers'), `[${s}] Zone de reponses presente`),
        (c, s) => assert(c.querySelector('.millionnaire-pyramid'), `[${s}] Pyramide presente`),
        (c, s) => {
            const btns = c.querySelectorAll('.millionnaire-answer-btn');
            assert(btns.length >= 2, `[${s}] Au moins 2 boutons de reponse (trouve: ${btns.length})`);
        },
        (c, s) => {
            // Le format Millionnaire impose 6 questions → pyramide toujours à 6 paliers.
            const levels = c.querySelectorAll('.millionnaire-level');
            assert(levels.length === 6, `[${s}] 6 niveaux dans la pyramide (trouve: ${levels.length})`);
        }
    ]);
    console.groupEnd();
}

async function runStep5_Appariement() {
    console.group('Etape 5 : Rendu Appariement');
    await runSimulatorRenderTest(5, 'elea_appariement_name', TEST_DATA.appariement, [
        (c, s) => assert(c.querySelector('.matching-simulator'), `[${s}] Conteneur .matching-simulator present`),
        (c, s) => assert(c.querySelector('.matching-header'), `[${s}] Header present`),
        (c, s) => assert(c.querySelector('.matching-pools'), `[${s}] Pools d'elements presents`),
        (c, s) => {
            const items = c.querySelectorAll('.matching-pool-item');
            assert(items.length === 6, `[${s}] 6 elements dans les pools (3 gauche + 3 droite, trouve: ${items.length})`);
        },
        (c, s) => assert(c.querySelector('.matching-check-btn'), `[${s}] Bouton "Verifier" present`),
        (c, s) => {
            const checkBtn = c.querySelector('.matching-check-btn');
            assert(checkBtn && checkBtn.disabled, `[${s}] Bouton "Verifier" desactive tant que tout n'est pas apparie`);
        }
    ]);
    console.groupEnd();
}

async function runStep6_Glossaire() {
    console.group('Etape 6 : Rendu Glossaire');
    await runSimulatorRenderTest(6, 'elea_glossaire_xml_name', TEST_DATA.glossaire, [
        (c, s) => assert(c.querySelector('.glossary-simulator'), `[${s}] Conteneur .glossary-simulator present`),
        (c, s) => assert(c.querySelector('.glossary-header'), `[${s}] Header present`),
        (c, s) => {
            const entries = c.querySelectorAll('.glossary-entry-compact');
            assert(entries.length === 2, `[${s}] 2 entrees de glossaire (trouve: ${entries.length})`);
        },
        (c, s) => {
            const terms = c.querySelectorAll('.glossary-term');
            assert(terms.length === 2, `[${s}] 2 termes (trouve: ${terms.length})`);
            // Verifie le tri alphabetique
            if (terms.length >= 2) {
                assert(terms[0].textContent === 'Algorithme', `[${s}] Premier terme = "Algorithme" (tri alpha)`);
                assert(terms[1].textContent === 'Variable', `[${s}] Deuxieme terme = "Variable" (tri alpha)`);
            }
        }
    ]);
    console.groupEnd();
}

async function runStep7_QCM() {
    console.group('Etape 7 : Rendu QCM');
    await runSimulatorRenderTest(7, 'elea_qcm_name', TEST_DATA.qcm, [
        (c, s) => assert(c.querySelector('.qcm-simulator'), `[${s}] Conteneur .qcm-simulator present`),
        (c, s) => assert(c.querySelector('.qcm-question-label'), `[${s}] Label de question present`),
        (c, s) => {
            const cards = c.querySelectorAll('.qcm-answer-card');
            assert(cards.length === 3, `[${s}] 3 cartes de reponse (trouve: ${cards.length})`);
        },
        (c, s) => assert(c.querySelector('.qcm-btn'), `[${s}] Bouton d'action present`),
        (c, s) => {
            const btn = c.querySelector('.qcm-btn');
            assert(btn && btn.disabled, `[${s}] Bouton desactive avant selection`);
        }
    ]);
    console.groupEnd();
}

async function runStep8_EleaTest() {
    console.group('Etape 8 : Rendu Test Elea');
    await runSimulatorRenderTest(8, 'elea_test_xml_name', TEST_DATA.eleaTest, [
        (c, s) => assert(c.querySelector('.elea-test-simulator'), `[${s}] Conteneur .elea-test-simulator present`),
        (c, s) => assert(c.querySelector('.elea-test-header'), `[${s}] Header present`),
        (c, s) => assert(c.querySelector('.elea-test-card'), `[${s}] Carte de question presente`),
        (c, s) => assert(c.querySelector('.elea-question-text'), `[${s}] Texte de question present`),
        (c, s) => assert(c.querySelector('.elea-options-list'), `[${s}] Liste d'options presente (multichoice)`),
        (c, s) => {
            const options = c.querySelectorAll('.elea-option-item');
            assert(options.length === 2, `[${s}] 2 options (trouve: ${options.length})`);
        },
        (c, s) => assert(c.querySelector('.elea-test-progress'), `[${s}] Barre de progression presente`),
        (c, s) => assert(c.querySelector('.elea-btn.primary'), `[${s}] Bouton "Verifier" present`)
    ]);
    console.groupEnd();
}

async function runStep9_Page() {
    console.group('Etape 9 : Rendu Page');
    await runSimulatorRenderTest(9, 'elea_page_name', TEST_DATA.page, [
        (c, s) => assert(c.querySelector('.elea-page-simulator'), `[${s}] Conteneur .elea-page-simulator present`),
        (c, s) => assert(c.querySelector('.elea-page-main-header'), `[${s}] Header principal present`),
        (c, s) => assert(c.querySelector('.elea-hero-header'), `[${s}] Bloc hero header present`),
        (c, s) => assert(c.querySelector('.elea-definition-box'), `[${s}] Bloc definition present`),
        (c, s) => {
            const blocks = c.querySelectorAll('.elea-page-block');
            assert(blocks.length === 2, `[${s}] 2 blocs rendus (trouve: ${blocks.length})`);
        }
    ]);
    console.groupEnd();
}

async function runStep10_Livre() {
    console.group('Etape 10 : Rendu Livre');
    const container = createTestContainer();
    _ctx = { step: 10, stepName: 'Rendu Livre', file: 'simulators/livre.js', module: 'elea_livre_name', source: 'simulators' };

    const previewHtml = '<div class="livre-test-content"><h2>Chapitre 1</h2><p>Contenu du chapitre</p></div>';

    try {
        const result = await renderSimulator('elea_livre_name', container, TEST_DATA.livre, previewHtml);
        assert(result === true, '[10] renderSimulator retourne true');
        assert(container.children.length > 0, '[10] Le conteneur n\'est pas vide');
        assert(container.querySelector('.elea-livre-fidelity-wrapper'), '[10] Wrapper fidelity present');
        assert(container.querySelector('.livre-test-content'), '[10] Le previewHtml est injecte');
        assert(container.querySelector('.preview-modal__fullscreen-btn'), '[10] Bouton plein ecran present');
    } catch (err) {
        assert(false, '[10] Rendu echoue pour Livre', { error: err.message });
    }

    // Test sans previewHtml
    container.innerHTML = '';
    try {
        const result2 = await renderSimulator('elea_livre_name', container, TEST_DATA.livre);
        assert(result2 === true, '[10] renderSimulator retourne true meme sans previewHtml');
        assert(container.textContent.includes('Aperçu non disponible') || container.textContent.includes('non disponible'),
            '[10] Message d\'apercu non disponible affiche sans previewHtml');
    } catch (err) {
        assert(false, '[10] Rendu echoue pour Livre sans previewHtml', { error: err.message });
    }

    removeTestContainer(container);
    console.groupEnd();
}

async function runStep11_Devoir() {
    console.group('Etape 11 : Rendu Devoir');
    await runSimulatorRenderTest(11, 'elea_devoir_name', TEST_DATA.devoir, [
        (c, s) => assert(c.querySelector('.devoir-simulator'), `[${s}] Conteneur .devoir-simulator present`),
        (c, s) => assert(c.querySelector('.devoir-header'), `[${s}] Header present`),
        (c, s) => assert(c.querySelector('.devoir-table'), `[${s}] Tableau de grille present`),
        (c, s) => {
            const rows = c.querySelectorAll('.devoir-table tr');
            assert(rows.length === 1, `[${s}] 1 ligne de critere (trouve: ${rows.length})`);
        },
        (c, s) => {
            const levels = c.querySelectorAll('.devoir-td-level');
            assert(levels.length === 3, `[${s}] 3 niveaux dans la grille (trouve: ${levels.length})`);
        },
        (c, s) => assert(c.querySelector('.devoir-total'), `[${s}] Total present`),
        (c, s) => {
            const total = c.querySelector('.devoir-total');
            assert(total && total.textContent.includes('10'), `[${s}] Note maximale = 10`);
        }
    ]);
    console.groupEnd();
}

// =======================================================================
// POINT D'ENTREE
// =======================================================================

/**
 * Etape 12 — SEC-01 : XSS en contexte d'attribut dans le rendu par blocs de Page.
 * Les href/src issus d'un .mbz sont interpoles dans des attributs ; sanitizeSync()
 * (assainisseur de CORPS) ne protege pas ce contexte. safeUrl()+escapeAttr() doivent
 * neutraliser javascript:/data:/vbscript:/breakout, sans alterer les URLs legitimes.
 */
async function runStep12_Xss() {
    console.group('Etape 12 : Securite XSS (SEC-01)');
    _ctx = { step: 12, stepName: STEP_NAMES[12], file: 'simulators/helpers.js + page.js', module: '', source: 'simulators' };

    const BREAKOUT = 'x" onerror="fetch(\'https://evil.example\')" data-x="';
    const BAD = [
        ['javascript:', 'javascript:alert(document.domain)'],
        ['JaVaScRiPt: (casse)', 'JaVaScRiPt:alert(1)'],
        ['javascript: saut de ligne', 'java\nscript:alert(1)'],
        ['javascript: tab', 'java\tscript:alert(1)'],
        ['data:text/html', 'data:text/html;base64,PHM+'],
        ['vbscript:', 'vbscript:msgbox(1)'],
        ['blob:', 'blob:https://evil.example/u'],
        ['file:', 'file:///etc/passwd'],
    ];
    const GOOD = ['https://example.org/p', 'http://e.org?a=1&b=2', 'mailto:a@b.c', '#s', '/abs.html', 'rel.html', '../p.png'];

    // 1) safeUrl : rejets + URLs legitimes
    for (const [label, url] of BAD) {
        assert(safeUrl(url) === '#' && safeUrl(url, '') === '', `safeUrl rejette ${label}`, { got: safeUrl(url) });
    }
    for (const url of GOOD) {
        assert(safeUrl(url) === url, `safeUrl preserve ${url}`, { got: safeUrl(url) });
    }
    assert(safeUrl('') === '#' && safeUrl(null) === '#', 'safeUrl vide/null → fallback');

    // 2) escapeAttr : anti-breakout
    const esc = escapeAttr(BREAKOUT);
    assert(!esc.includes('"') && esc.includes('&quot;'), 'escapeAttr encode le guillemet (anti-breakout)', { got: esc });
    assert(escapeAttr('a&b<c>') === 'a&amp;b&lt;c&gt;', 'escapeAttr encode & < >');

    // 3) renderPage (chemin par blocs) : aucun schema dangereux ni handler on* ne survit
    const ctrl = /[\u0000-\u0020]/g;
    const noXss = (label, c) => {
        // On inspecte les VRAIS attributs du DOM, pas la chaîne sérialisée : une
        // charge encodée (`x&quot; onerror=&quot;…`) coincée dans une VALEUR
        // d'attribut est inerte, mais une regex sur innerHTML y verrait à tort
        // un « onerror= » (faux positif). La bonne propriété : aucun élément n'a
        // d'attribut dont le NOM commence par « on ».
        const elWithHandler = [...c.querySelectorAll('*')].find(el =>
            [...el.attributes].some(a => /^on/i.test(a.name)));
        assert(!elWithHandler, `[${label}] aucun attribut on* réel`,
            elWithHandler ? { outerHTML: elWithHandler.outerHTML } : null);
        c.querySelectorAll('a[href]').forEach(a => assert(
            !/^(javascript|data|vbscript|blob|file):/i.test((a.getAttribute('href') || '').replace(ctrl, '')),
            `[${label}] href sans schema dangereux`, { href: a.getAttribute('href') }));
        c.querySelectorAll('img[src]').forEach(img => assert(
            !/^(javascript|data|vbscript|blob|file):/i.test((img.getAttribute('src') || '').replace(ctrl, '')),
            `[${label}] src sans schema dangereux`, { src: img.getAttribute('src') }));
    };

    let c = document.createElement('div');
    renderPage(c, { blocks: [{ type: '#02_nav_summary', data: { links: [{ href: 'javascript:alert(1)', text: 'x' }] } }] }, null);
    noXss('nav_summary js:', c);
    assert(c.querySelector('a') && c.querySelector('a').getAttribute('href') === '#', 'href javascript: → #');

    c = document.createElement('div');
    renderPage(c, { blocks: [{ type: '#08_monuments_grid', data: { monuments: [{ img_src: BREAKOUT, img_alt: 'a" onmouseover="x', name: 'M', description: 'd' }] } }] }, null);
    noXss('monuments breakout', c);

    c = document.createElement('div');
    renderPage(c, { blocks: [{ type: '#09_figures_comparison', data: { figures: [{ img_src: 'javascript:alert(1)', img_alt: 'a', caption: 'c' }] } }] }, null);
    noXss('figures js:', c);
    assert(c.querySelector('img') && (c.querySelector('img').getAttribute('src') || '') === '', 'img_src javascript: → vide');

    c = document.createElement('div');
    renderPage(c, { blocks: [{ type: '#18_sito_graphy', data: { links: [{ href: 'data:text/html,<script>alert(1)</script>', text: 'l' }] } }] }, null);
    noXss('sitography data:', c);
    {
        const a = c.querySelector('a');
        assert(a && a.getAttribute('href') === '#', 'href data: → #');
        // Audit 2026-06 (S09) : noreferrer ajoute en plus de noopener
        const rel = (a && a.getAttribute('rel') || '').split(/\s+/);
        assert(rel.includes('noopener') && rel.includes('noreferrer'), 'rel=noopener noreferrer sur target=_blank');
    }

    // 4) Non-regression : URLs legitimes inchangees dans le rendu
    c = document.createElement('div');
    renderPage(c, { blocks: [
        { type: '#02_nav_summary', data: { links: [{ href: '#partie-1', text: 'P1' }] } },
        { type: '#18_sito_graphy', data: { links: [{ href: 'https://example.org/doc?a=1&b=2', text: 'Doc' }] } },
        { type: '#08_monuments_grid', data: { monuments: [{ img_src: 'images/c.jpg', img_alt: 'Colisee', name: 'C', description: 'd' }] } },
    ] }, null);
    {
        const anchors = c.querySelectorAll('a');
        assert(anchors[0] && anchors[0].getAttribute('href') === '#partie-1', 'ancre inchangee');
        assert(anchors[1] && anchors[1].getAttribute('href') === 'https://example.org/doc?a=1&b=2', 'URL https inchangee');
        const img = c.querySelector('img');
        assert(img && img.getAttribute('src') === 'images/c.jpg', 'chemin relatif inchange');
        assert(img && img.getAttribute('alt') === 'Colisee', 'alt inchange');
    }
    console.groupEnd();
}

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_Registry();
    await runStep2_Helpers();
    await runStep3_DynamicImports();
    await runStep4_Millionnaire();
    await runStep5_Appariement();
    await runStep6_Glossaire();
    await runStep7_QCM();
    await runStep8_EleaTest();
    await runStep9_Page();
    await runStep10_Livre();
    await runStep11_Devoir();
    await runStep12_Xss();

    const totalElapsed = performance.now() - t0;
    recordTiming('total', 'Tous les tests simulateurs', totalElapsed);

    console.log(`\n=== RESULTATS ===`);
    console.log(`PASS: ${passCount} | FAIL: ${failCount} | TOTAL: ${passCount + failCount}`);
    console.log(`Duree: ${(totalElapsed / 1000).toFixed(2)}s`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
