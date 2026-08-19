/**
 * run_validators_oracle.mjs — Oracle de comportement de `js/editor/validators.js`.
 *
 * `getTypeSpecificErrors` portait 27 branches `if (moduleKey === '…')` indépendantes
 * sur 32 clés dans une fonction de 676 lignes, suivies d'une queue de validations
 * TRANSVERSALES qui s'exécutent quel que soit le module. Sa refactorisation en
 * registre `TYPE_RULES` devait préserver EXACTEMENT :
 *   - l'ensemble des erreurs produites,
 *   - leur ORDRE dans le tableau (l'éditeur les affiche dans cet ordre),
 *   - les exceptions levées sur données malformées (comportement observable).
 *
 * DEUX matrices, car le module a deux points d'entrée indépendants :
 *
 *  1. TYPE_RULES — `getValidationErrors(data, { _moduleKey, sections: [] })`.
 *     Le schéma sans `sections` neutralise la validation par champ : 100 % des
 *     erreurs proviennent alors de la fonction visée.
 *     (115 exemples réels + 60 fixtures adverses) × 40 clés de module.
 *     Croiser chaque fixture avec TOUTES les clés est délibéré : passer un JSON de
 *     mots croisés sous la clé `Flashcards` est ce qui stresse les branches
 *     défensives (champ absent, mauvais type) qu'un jeu de fixtures « bien typées »
 *     ne visiterait jamais.
 *
 *  2. validateField — 14 configurations × 27 valeurs. Sans elle, les validateurs
 *     élémentaires (`feedbackRanges`, `minItems`, `pattern`…) ne seraient couverts
 *     par AUCUN oracle, puisque la matrice 1 les court-circuite par construction.
 *
 * Les écarts sont CLASSÉS : une refactorisation pure doit produire zéro écart ;
 * un durcissement volontaire ne doit produire que des `crash-corrigé`. Tout
 * `crash-introduit` ou `comportement-modifié` fait échouer le test.
 *
 * Lancer : node tests/run_validators_oracle.mjs
 *   --write   (re)génère la baseline au lieu de la comparer
 *
 * Baseline : tests/fixtures/validators-baseline.json
 * Complément structurel : tests/run_validators_rules_tests.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { installIdentitySanitizer } from './roundtrip/bootstrap.mjs';
await installIdentitySanitizer();

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASELINE = join(HERE, 'fixtures', 'validators-baseline.json');
const WRITE = process.argv.includes('--write');

const { getValidationErrors } = await import('../js/editor/validators.js');
const { allModules } = await import('../js/core/definitions.js');

// ---------------------------------------------------------------------------
// Clés de module testées
// ---------------------------------------------------------------------------
// Toutes les clés du registre + celles citées dans validators.js mais absentes
// du registre (alias Éléa) + les cas dégénérés (vide, inconnue).
const KEYS_FROM_VALIDATORS = [
    'QuizSet', 'QuizSetQCM', 'QuizSetVF', 'MultipleChoice', 'TrueFalse',
    'ImageHotspots', 'FindTheHotspot', 'FindMultipleHotspots', 'FindTheWords',
    'FillInTheBlanks', 'ComplexFillTheBlanks', 'MarkTheWords', 'DragTheWords',
    'DragAndDrop', 'Crossword', 'Flashcards', 'DialogCards', 'Timeline',
    'Essay', 'Summary', 'SingleChoiceSet', 'SortParagraphs', 'Chart',
    'Millionnaire', 'Appariement', 'QCM', 'glossaireXml', 'Page',
    'Livre', 'elea_livre', 'CoursePresentation', 'InteractiveBook'
];
const MODULE_KEYS = [...new Set([
    ...KEYS_FROM_VALIDATORS,
    ...Object.keys(allModules),
    '',                    // schéma sans _moduleKey
    '__inconnu__'          // clé sans aucune règle
])].sort();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const EXAMPLES_DIR = join(ROOT, 'assets', 'data', 'examples');
const fixtures = [];

// Parse défensif IDENTIQUE à `handleH5PCreation` : `JSON.parse` d'abord, puis
// `healJsonString()` en secours. Certaines fixtures contiennent volontairement du
// LaTeX nu (`\frac`, `\pi`…) que `JSON.parse` rejette — ex. `quiz_qcm_3.json`. Les
// ignorer reviendrait à retirer de l'oracle exactement les données les plus
// difficiles (cf. le même secours dans `tests/roundtrip/playwright-harness.mjs`).
const { healJsonString } = await import('../js/h5p/json-healer.js');
for (const f of readdirSync(EXAMPLES_DIR).filter(n => n.endsWith('.json')).sort()) {
    const brut = readFileSync(join(EXAMPLES_DIR, f), 'utf8');
    let data;
    try {
        data = JSON.parse(brut);
    } catch {
        try { data = JSON.parse(healJsonString(brut)); }
        catch (e2) { console.log(`  ⚠ exemple irrécupérable ignoré : ${f} (${e2.message})`); continue; }
    }
    fixtures.push({ name: 'ex:' + f, data });
}

// Fixtures adverses : visent les gardes défensifs (mauvais type, vide, imbriqué
// incomplet) que les exemples réels — tous bien formés — ne traversent jamais.
const ADVERSES = {
    'vide': {},
    'null-partout': { questions: null, answers: null, hotspots: null, cards: null, chapters: null },
    'questions-vide': { questions: [] },
    'questions-objets-nus': { questions: [{}, {}] },
    'questions-sans-library': { questions: [{ params: {} }] },
    'questions-strings-sans-trou': { questions: ['une phrase', 'une autre'] },
    'questions-strings-avec-trou': { questions: ['une *phrase*', 'une autre'] },
    'questions-strings-melange': { questions: ['sans trou', 'avec *trou*'] },
    'questions-string-scalaire': { questions: 'pas un tableau' },
    'questions-avec-answers-sans-correct': { questions: [{ answers: [{ text: 'a', correct: false }] }] },
    'questions-avec-answers-correct': { questions: [{ answers: [{ text: 'a', correct: true }] }] },
    'questions-answers-vides': { questions: [{ answers: [] }] },
    'answers-vide': { answers: [] },
    'answers-aucun-correct': { answers: [{ text: 'a', correct: false }, { text: 'b', correct: false }] },
    'answers-un-correct': { answers: [{ text: 'a', correct: true }] },
    'answers-scalaire': { answers: 'pas un tableau' },
    'textField-sans-trou': { textField: 'du texte tout simple' },
    'textField-avec-trou': { textField: 'du *texte* simple' },
    'textField-vide': { textField: '' },
    'textField-nombre': { textField: 42 },
    'hotspots-vide': { hotspots: [] },
    'hotspots-bloc-vide': { hotspots: [{ content: [{}] }] },
    'hotspots-bloc-null': { hotspots: [{ content: [null] }] },
    'hotspots-bloc-texte-vide': { hotspots: [{ content: [{ type: 'text', text: '' }] }] },
    'hotspots-bloc-image-sans-fichier': { hotspots: [{ content: [{ type: 'image', image: null }] }] },
    'hotspots-content-scalaire': { hotspots: [{ content: 'nope' }] },
    'hotspots-scalaire': { hotspots: 'nope' },
    'hotspots-correct-absent': { hotspots: [{ correct: false }, { correct: false }] },
    'hotspots-correct-present': { hotspots: [{ correct: true }] },
    'chapters-vide': { chapters: [] },
    'chapters-bloc-vide': { chapters: [{ content: [{}] }] },
    'chapters-content-scalaire': { chapters: [{ content: 42 }] },
    'chapters-scalaire': { chapters: {} },
    'slides-vide': { slides: [] },
    'slides-elements-vides': { slides: [{ elements: [] }] },
    'cards-vide': { cards: [] },
    'dialogs-vide': { dialogs: [] },
    'words-vide': { words: [] },
    'elements-dropzones-vides': { elements: [], dropZones: [] },
    'title-seul': { title: 'Titre' },
    // Trous `null` dans les collections : atteignables par l'édition JSON brute et
    // par une suppression d'élément mal séquencée. Ces cellules capturent des
    // EXCEPTIONS dans la baseline d'origine (cf. run_validators_rules_tests.mjs).
    'questions-null-dedans': { questions: [null] },
    'questions-null-melange': { questions: [{ library: 'X' }, null] },
    'answers-null-dedans': { answers: [null] },
    'cards-null-dedans': { cards: [null] },
    'dialogs-null-dedans': { dialogs: [null] },
    'choices-null-dedans': { choices: [null] },
    'hotspots-null-dedans': { hotspots: [null] },
    'chapters-null-dedans': { chapters: [null] },
    'slides-null-dedans': { slides: [null] },
    'elements-null-dedans': { elements: [null], dropZones: [null] },
    'words-null-dedans': { words: [null] },
    'entries-null-dedans': { entries: [null] },
    'pages-null-dedans': { pages: [null] },
    'items-null-dedans': { items: [null] },
    'statements-null-dedans': { statements: [null] },
    'summaries-null-dedans': { summaries: [null] },
    'paragraphs-null-dedans': { paragraphs: [null] },
    'tous-tableaux-null-dedans': {
        questions: [null], answers: [null], hotspots: [null], cards: [null],
        dialogs: [null], chapters: [null], slides: [null], words: [null],
        elements: [null], dropZones: [null], choices: [null], entries: [null],
        pages: [null], items: [null], statements: [null], summaries: [null],
        paragraphs: [null]
    },
    'tableaux-vides-partout': {
        questions: [], answers: [], hotspots: [], cards: [], dialogs: [],
        chapters: [], slides: [], words: [], elements: [], dropZones: [],
        statements: [], summaries: [], paragraphs: [], entries: [], pages: []
    },
    'scalaires-partout': {
        questions: 1, answers: 1, hotspots: 1, cards: 1, dialogs: 1,
        chapters: 1, slides: 1, words: 1, elements: 1, dropZones: 1
    }
};
for (const [name, data] of Object.entries(ADVERSES)) {
    fixtures.push({ name: 'adv:' + name, data });
}

// ---------------------------------------------------------------------------
// Exécution de la matrice
// ---------------------------------------------------------------------------
/** Signature compacte, lisible et diffable d'un tableau d'erreurs. */
function signature(errors) {
    if (!Array.isArray(errors)) return ['<NON-TABLEAU:' + typeof errors + '>'];
    return errors.map(e => `${e?.path}|${e?.field}|${e?.message}`);
}

const cells = {};
let throwCount = 0, nonEmptyCount = 0;

for (const { name, data } of fixtures) {
    for (const key of MODULE_KEYS) {
        let sig;
        try {
            const errs = getValidationErrors(structuredClone(data), { _moduleKey: key, sections: [] });
            sig = signature(errs);
            if (sig.length) nonEmptyCount++;
        } catch (e) {
            sig = ['<THROW:' + e.constructor.name + ':' + e.message + '>'];
            throwCount++;
        }
        if (sig.length) cells[`${name}##${key}`] = sig;   // les cellules vides restent implicites
    }
}

// ---------------------------------------------------------------------------
// Seconde matrice : validateField — l'autre moitié du module
// ---------------------------------------------------------------------------
// `validateField` route vers les validateurs élémentaires selon `config`. Sans
// cette matrice, `validators.feedbackRanges` / `minItems` / `pattern`… ne sont
// couverts par AUCUN oracle : la matrice `sections: []` ci-dessus les court-circuite
// délibérément pour isoler TYPE_RULES.
const FIELD_CONFIGS = {
    'requis': { required: true },
    'optionnel': {},
    'minLength-3': { minLength: 3 },
    'maxLength-5': { maxLength: 5 },
    'pattern-num': { pattern: /^\d+$/ },
    'number': { type: 'number' },
    'number-borne': { type: 'number', min: 1, max: 10 },
    'array-min2': { type: 'array', minItems: 2 },
    'array-max2': { type: 'array', maxItems: 2 },
    'feedbackRanges': { type: 'feedbackRanges' },
    'feedbackRanges-requis': { type: 'feedbackRanges', required: true },
    'custom-toujours-ok': { validate: () => true },
    'custom-toujours-ko': { validate: () => 'message custom' },
    'requis+minLength': { required: true, minLength: 4 }
};

const FIELD_VALUES = {
    'null': null,
    'undefined': undefined,
    'chaine-vide': '',
    'espaces': '   ',
    'texte': 'abcdef',
    'texte-court': 'ab',
    'zero': 0,
    'nombre': 7,
    'nombre-hors-borne': 99,
    'nan': NaN,
    'false': false,
    'true': true,
    'tableau-vide': [],
    'tableau-1': ['a'],
    'tableau-3': ['a', 'b', 'c'],
    'tableau-null-dedans': [null],
    'objet-vide': {},
    'plage-valide': [{ from: 0, to: 100, feedback: '' }],
    'plage-double': [{ from: 0, to: 49, feedback: 'x' }, { from: 50, to: 100, feedback: 'y' }],
    'plage-trouee': [{ from: 0, to: 30 }, { from: 60, to: 100 }],
    'plage-chevauchante': [{ from: 0, to: 60 }, { from: 50, to: 100 }],
    'plage-mauvais-debut': [{ from: 10, to: 100 }],
    'plage-mauvaise-fin': [{ from: 0, to: 90 }],
    'plage-null-dedans': [null],
    'plage-null-melange': [{ from: 0, to: 100 }, null],
    'plage-scalaires': ['x', 'y'],
    'plage-objet-nu': [{}]
};

const { validateField } = await import('../js/editor/validators.js');

for (const [cn, config] of Object.entries(FIELD_CONFIGS)) {
    for (const [vn, value] of Object.entries(FIELD_VALUES)) {
        let sig;
        try {
            const r = validateField(value, config);
            sig = [`valid=${r?.valid}`, ...(r?.errors ?? [])];
        } catch (e) {
            sig = ['<THROW:' + e.constructor.name + ':' + e.message + '>'];
            throwCount++;
        }
        cells[`field:${cn}##${vn}`] = sig;
    }
}
const fieldCellCount = Object.keys(FIELD_CONFIGS).length * Object.keys(FIELD_VALUES).length;

const globalHash = createHash('sha256')
    .update(JSON.stringify(Object.keys(cells).sort().map(k => [k, cells[k]])))
    .digest('hex');

const report = {
    _doc: 'Oracle de js/editor/validators.js::getTypeSpecificErrors — NE PAS éditer à la main. Régénérer : node tests/run_validators_oracle.mjs --write',
    fixtures: fixtures.length,
    moduleKeys: MODULE_KEYS.length,
    cellsEvaluated: fixtures.length * MODULE_KEYS.length + fieldCellCount,
    cellsWithErrors: Object.keys(cells).length,
    throwCells: throwCount,
    globalHash,
    cells
};

console.log('========================================');
console.log(`matrice TYPE_RULES : ${fixtures.length} fixtures × ${MODULE_KEYS.length} clés = ${fixtures.length * MODULE_KEYS.length} évaluations`);
console.log(`matrice validateField : ${Object.keys(FIELD_CONFIGS).length} configs × ${Object.keys(FIELD_VALUES).length} valeurs = ${fieldCellCount} évaluations`);
console.log(`          ${report.cellsWithErrors} cellules porteuses d'erreurs, ${throwCount} exception(s)`);
console.log(`          sha256 = ${globalHash.slice(0, 32)}…`);

if (WRITE || !existsSync(BASELINE)) {
    writeFileSync(BASELINE, JSON.stringify(report, null, 1) + '\n', 'utf8');
    console.log(`baseline ${existsSync(BASELINE) && !WRITE ? 'créée' : 'écrite'} : tests/fixtures/validators-baseline.json`);
    console.log('========================================');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Comparaison à la baseline
// ---------------------------------------------------------------------------
const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const deltas = [];

if (base.cellsEvaluated !== report.cellsEvaluated) {
    deltas.push(`taille de matrice : baseline ${base.cellsEvaluated} → actuel ${report.cellsEvaluated} `
        + '(fixtures ou clés ajoutées/retirées — régénérer volontairement avec --write)');
}

const isThrow = (sig) => Array.isArray(sig) && String(sig[0] ?? '').startsWith('<THROW:');

/**
 * Classer les écarts est ce qui rend l'oracle exploitable : une refactorisation pure
 * doit produire ZÉRO écart, tandis qu'un durcissement volontaire ne doit produire que
 * des `crash-corrigé`. Tout `comportement-modifié` ou `crash-introduit` est un rejet.
 */
const CATEGORIES = { 'crash-corrigé': [], 'crash-introduit': [], 'comportement-modifié': [] };

const allCellKeys = [...new Set([...Object.keys(base.cells), ...Object.keys(cells)])].sort();
for (const k of allCellKeys) {
    const a = base.cells[k], b = cells[k];
    const sa = JSON.stringify(a ?? []), sb = JSON.stringify(b ?? []);
    if (sa === sb) continue;
    const cat = isThrow(a) && !isThrow(b) ? 'crash-corrigé'
        : !isThrow(a) && isThrow(b) ? 'crash-introduit'
            : 'comportement-modifié';
    CATEGORIES[cat].push(`${k}\n      baseline : ${sa}\n      actuel   : ${sb}`);
    deltas.push(k);
}

if (deltas.length === 0) {
    console.log(`\n✅ Comportement identique à la baseline (0 écart sur ${report.cellsEvaluated} évaluations).`);
    console.log('========================================');
    process.exit(0);
}

console.log(`\n⚠ ${deltas.length} écart(s) vs baseline :`);
for (const [cat, list] of Object.entries(CATEGORIES)) {
    if (!list.length) continue;
    console.log(`\n  ── ${cat} : ${list.length} cellule(s)`);
    for (const d of list.slice(0, 12)) console.log('     • ' + d);
    if (list.length > 12) console.log(`     … et ${list.length - 12} autre(s)`);
}

const bloquants = CATEGORIES['crash-introduit'].length + CATEGORIES['comportement-modifié'].length;
console.log('\n========================================');
if (bloquants === 0) {
    console.log(`Écarts UNIQUEMENT du type « crash-corrigé » (${CATEGORIES['crash-corrigé'].length}).`);
    console.log('Si ce durcissement est volontaire : node tests/run_validators_oracle.mjs --write');
} else {
    console.log(`❌ ${bloquants} écart(s) BLOQUANT(S) (crash introduit ou comportement modifié).`);
}
console.log('========================================');
process.exit(1);
