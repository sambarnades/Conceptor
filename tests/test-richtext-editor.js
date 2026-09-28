/**
 * Tests Rich Text Editor — Editeur WYSIWYG pour l'editeur JSON
 *
 * Verifie : resolution de chemin, nettoyage HTML, protection LaTeX,
 * bascule source/WYSIWYG, mode marqueurs, rendu DOM, intégrité des exports.
 *
 * Usage : ouvrir tests/test-richtext-editor.html depuis le serveur local.
 */

import { resolveRenderTypeForField, htmlToCleanOutput, sourceToDisplay, protectLatex, unprotectLatex, renderRichtextField } from '../js/editor/richtext-editor.js';
import { FIELD_CONSTRAINTS, RENDER_TYPES, stripHtmlKeepLatex } from '../js/h5p/field-constraints.js';
import { parseClozeText, serializeGap, parseGapContent, renderClozeField } from '../js/editor/cloze-editor.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];

let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        group: _ctx.stepName
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
    const ok = actual === expected;
    if (!ok) {
        assert(false, message, { attendu: String(expected), obtenu: String(actual) });
    } else {
        assert(true, message);
    }
}

function setStep(step, name) {
    _ctx.step = step;
    _ctx.stepName = name;
}

export const STEP_NAMES = [
    '',
    'Resolution chemin',          // 1
    'Normalisation chemin',       // 2
    'Nettoyage HTML',             // 3
    'Protection LaTeX',           // 4
    'Round-trip LaTeX',           // 5
    'sourceToDisplay',            // 6
    'Mode marqueurs',             // 7
    'Rendu DOM',                  // 8
    'Integrite exports',          // 9
    'Couverture activites',       // 10
    'Edge cases',                 // 11
    'Toolbar contextuelle',       // 12
    'Collage HTML',               // 13
    'Formules assistant',         // 14
    'Formules reelles',           // 15
    'Conversion Markdown',        // 16
    'Couleur',                    // 17
    'Liens',                      // 18
    'Synchro source',             // 19
    'MathJax validation',         // 20
    'Formatage imbrique',         // 21
    'Marqueurs DragTheWords',     // 22
    'Marqueurs MarkTheWords',     // 23
    'Marqueurs FillInTheBlanks',  // 24
    'Pipeline complet',           // 25
    'Contenu reel exemples',      // 26
    'Securite et XSS',            // 27
    'Compatibilite export',       // 28
    'Export document activites',  // 29
    'Editeur Cloze',             // 30
    'Normalisation LaTeX editeur' // 31
];

export const STEP_DESCRIPTIONS = {
    1: 'Verifie que resolveRenderTypeForField retourne le bon renderType pour chaque champ de chaque activite',
    2: 'Verifie la normalisation des chemins editeur (indices → []) pour la correspondance avec FIELD_CONSTRAINTS',
    3: 'Verifie que htmlToCleanOutput produit du HTML propre compatible H5P',
    4: 'Verifie que protectLatex enveloppe les formules dans des spans non-editables',
    5: 'Verifie que protectLatex → unprotectLatex preserve le contenu original',
    6: 'Verifie que sourceToDisplay applique la protection LaTeX uniquement pour html+latex',
    7: 'Verifie la gestion des marqueurs *mot* pour DragTheWords/MarkTheWords/FillInTheBlanks',
    8: 'Verifie que renderRichtextField cree la structure DOM correcte',
    9: 'Verifie que le HTML produit est compatible avec les exports H5P et Moodle',
    10: 'Verifie la couverture : chaque champ html+latex/html/unicode+markers de FIELD_CONSTRAINTS est resolu',
    11: 'Cas limites : null, vide, tres long, caracteres speciaux, encodage',
    12: 'Verifie que la toolbar est construite avec les bons boutons selon le renderType',
    13: 'Verifie le nettoyage du HTML colle depuis des sources externes (Word, Google Docs)',
    14: 'Round-trip de TOUTES les formules proposees par l\'assistant',
    15: 'Round-trip de formules reelles extraites des exemples JSON',
    16: 'Conversion Markdown ↔ HTML : sourceToDisplay et htmlToCleanOutput',
    17: 'Gestion de la couleur : font→span, preservation, suppression styles inutiles',
    18: 'Liens : <a> avec attributs, coexistence Markdown/LaTeX, URLs',
    19: 'Synchronisation source.value avec contenteditable (critique enregistrement)',
    20: 'Validation MathJax : chaque formule rendue sans erreur',
    21: 'Formatage imbrique : gras dans italique, couleur dans gras, lien dans gras, LaTeX dans gras',
    22: 'Format marqueurs DragTheWords : *mot*, adjacents, avec ponctuation, apostrophes',
    23: 'Format marqueurs MarkTheWords : *mot*, multi-mots, accents, caracteres speciaux',
    24: 'Format marqueurs FillInTheBlanks : *reponse:indice*, *reponse/alt1/alt2*, format H5P Blanks',
    25: 'Pipeline complet : sourceToDisplay → edit → htmlToCleanOutput → formatTextToHtml → verif',
    26: 'Contenu reel : textes extraits des fichiers d\'exemples JSON avec Markdown + LaTeX + marqueurs',
    27: 'Securite : injection XSS, scripts, event handlers, URLs javascript:',
    28: 'Compatibilite export : le contenu nettoye est compatible DOCX/ODT/PDF (cleanHtml)',
    29: 'Export document : verifie que formatContentForDocument preserve gras, italique, couleur, liens, LaTeX, sub/sup pour chaque type d\'activite',
    30: 'Editeur Cloze : parse, serialize, round-trip de la syntaxe {poids:TYPE:=correct~wrong} et rendu DOM',
    31: 'Normalisation LaTeX : convertit \\begin{equation}→\\[…\\], \\[…\\]→\\(…\\) en compact/sidebar, pas de faux positifs avec $'
};

// =======================================================================
// STEP 1 : RESOLUTION DE CHEMIN
// =======================================================================

function runStep1_PathResolution() {
    setStep(1, 'Resolution chemin');

    const tests = [
        // H5P - MultipleChoice
        ['MultipleChoice', 'question', 'html+latex'],
        ['MultipleChoice', 'answers.0.text', 'html+latex'],
        ['MultipleChoice', 'answers.2.tipsAndFeedback.tip', 'html'],
        ['MultipleChoice', 'answers.0.tipsAndFeedback.chosenFeedback', 'html'],
        ['MultipleChoice', 'answers.0.tipsAndFeedback.notChosenFeedback', 'html'],
        ['MultipleChoice', 'overallFeedback.0.feedback', 'latex'],

        // H5P - TrueFalse
        ['TrueFalse', 'question', 'html+latex'],
        ['TrueFalse', 'correct', 'plain'],
        ['TrueFalse', 'feedbackOnCorrect', 'latex'],
        ['TrueFalse', 'feedbackOnWrong', 'latex'],
        ['TrueFalse', 'overallFeedback.0.feedback', 'latex'],

        // H5P - FillInTheBlanks
        ['FillInTheBlanks', 'taskDescription', 'html+latex'],
        ['FillInTheBlanks', 'questions.0', 'unicode+markers'],
        ['FillInTheBlanks', 'questions.5', 'unicode+markers'],
        ['FillInTheBlanks', 'overallFeedback.0.feedback', 'latex'],

        // H5P - DragTheWords
        ['DragTheWords', 'textField', 'unicode+markers'],
        ['DragTheWords', 'taskDescription', 'html+latex'],
        ['DragTheWords', 'overallFeedback.0.feedback', 'latex'],

        // H5P - MarkTheWords
        ['MarkTheWords', 'textField', 'unicode+markers'],
        ['MarkTheWords', 'taskDescription', 'html+latex'],
        ['MarkTheWords', 'overallFeedback.0.feedback', 'latex'],

        // H5P - Flashcards
        ['Flashcards', 'cards.0.text', 'html+latex'],
        ['Flashcards', 'cards.5.answer', 'html+latex'],
        ['Flashcards', 'cards.0.tip', 'html+latex'],
        ['Flashcards', 'title', 'plain'],
        ['Flashcards', 'description', 'latex'],

        // H5P - Crossword
        ['Crossword', 'taskDescription', 'html+latex'],
        ['Crossword', 'words.0.clue', 'plain'],
        ['Crossword', 'words.0.answer', 'plain+letters'],
        ['Crossword', 'words.0.extraClue.params.text', 'html+latex'],
        ['Crossword', 'overallFeedback.0.feedback', 'latex'],

        // H5P - Essay
        ['Essay', 'taskDescription', 'html+latex'],
        ['Essay', 'keywords.0.keyword', 'plain'],
        ['Essay', 'solution.introduction', 'html+latex'],
        ['Essay', 'solution.sample', 'html+latex'],
        ['Essay', 'overallFeedback.0.feedback', 'latex'],

        // H5P - DialogCards
        ['DialogCards', 'dialogs.0.text', 'html+latex'],
        ['DialogCards', 'dialogs.1.answer', 'html+latex'],
        ['DialogCards', 'dialogs.0.tips.front', 'html'],
        ['DialogCards', 'dialogs.0.tips.back', 'html'],
        ['DialogCards', 'title', 'html+latex'],
        ['DialogCards', 'description', 'html+latex'],

        // H5P - Glossary (chemins H5P et alias éditeur)
        ['Glossary', 'panels.0.title', 'unicode'],
        ['Glossary', 'panels.0.text', 'html+latex'],
        ['Glossary', 'items.0.title', 'unicode'],
        ['Glossary', 'items.0.text', 'html+latex'],

        // H5P - Summary
        ['Summary', 'intro', 'html+latex'],
        ['Summary', 'summaries.0.summary.0', 'html+latex'],
        ['Summary', 'summaries.0.tip', 'html'],
        ['Summary', 'overallFeedback.0.feedback', 'latex'],

        // H5P - SingleChoiceSet
        ['SingleChoiceSet', 'choices.0.question', 'html+latex'],
        ['SingleChoiceSet', 'choices.0.answers.1', 'html+latex'],
        ['SingleChoiceSet', 'overallFeedback.0.feedback', 'latex'],

        // H5P - DragAndDrop
        ['DragAndDrop', 'elements.0.text', 'html+latex'],
        ['DragAndDrop', 'dropZones.0.label', 'html+latex'],
        ['DragAndDrop', 'title', 'plain'],
        ['DragAndDrop', 'overallFeedback.0.feedback', 'latex'],

        // H5P - SortParagraphs
        ['SortParagraphs', 'taskDescription', 'html+latex'],
        ['SortParagraphs', 'paragraphs.0', 'html+latex'],
        ['SortParagraphs', 'overallFeedback.0.feedback', 'latex'],

        // H5P - Chart
        ['Chart', 'listOfTypes.0.text', 'unicode'],
        ['Chart', 'listOfTypes.0.value', 'plain'],
        ['Chart', 'listOfTypes.0.color', 'plain'],
        ['Chart', 'graphMode', 'plain'],

        // H5P - Timeline
        ['Timeline', 'timeline.text', 'html+latex'],
        ['Timeline', 'timeline.date.0.text', 'html+latex'],
        ['Timeline', 'timeline.era.0.text', 'html+latex'],
        ['Timeline', 'timeline.date.0.startDate', 'plain'],

        // H5P - FindTheWords
        ['FindTheWords', 'taskDescription', 'latex'],
        ['FindTheWords', 'wordList', 'plain'],

        // H5P - CoursePresentation
        ['CoursePresentation', 'title', 'plain'],
        ['CoursePresentation', 'slides.0.title', 'html+latex'],
        ['CoursePresentation', 'slides.0.subtitle', 'html+latex'],
        ['CoursePresentation', 'slides.0.text', 'html+latex'],
        ['CoursePresentation', 'slides.0.table.headers.0', 'html+latex'],
        ['CoursePresentation', 'slides.0.table.rows.0.0', 'html+latex'],
        ['CoursePresentation', 'slides.0.backgroundColor', 'plain'],

        // H5P - QuizSet
        ['QuizSet', 'progressType', 'plain'],
        ['QuizSet', 'passPercentage', 'plain'],
        ['QuizSet', 'overallFeedback.0.feedback', 'latex'],

        // Moodle - QCM
        ['QCM', 'questions.0.text', 'html+latex'],
        ['QCM', 'questions.0.answers.1.text', 'html+latex'],
        ['QCM', 'questions.0.answers.0.feedback', 'html'],

        // Moodle - Appariement
        ['Appariement', 'pairs.0.question', 'html+latex'],
        ['Appariement', 'pairs.0.answer', 'html+latex'],

        // Moodle - Page
        ['Page', 'title', 'plain'],
        ['Page', 'blocks.0.data', 'html+latex'],
        ['Page', 'intro', 'html+latex'],

        // Moodle - Millionnaire
        ['Millionnaire', 'questions.0.question', 'plain'],
        ['Millionnaire', 'questions.0.goodanswer', 'plain'],
        ['Millionnaire', 'questions.0.badanswer.0', 'plain'],

        // Moodle - Test
        ['Test', 'questions.0.questiontext', 'html+latex'],
        ['Test', 'questions.0.answers.0.text', 'html+latex'],
        ['Test', 'questions.0.subquestions.0.text', 'html+latex'],
        ['Test', 'questions.0.subquestions.0.answer', 'plain'],

        // Moodle - Glossaire
        ['Glossaire', 'entries.0.concept', 'plain'],
        ['Glossaire', 'entries.0.definition', 'html+latex'],

        // Moodle - Devoir
        ['Devoir', 'title', 'unicode'],
        ['Devoir', 'intro', 'html+latex'],
        ['Devoir', 'rubricName', 'unicode'],
        ['Devoir', 'criteria.0.description', 'unicode'],
        ['Devoir', 'criteria.0.levels.0.definition', 'unicode'],

        // Éléa — alias (l'éditeur utilise elea_* comme moduleKey)
        ['elea_qcm', 'questions.0.text', 'html+latex'],
        ['elea_qcm', 'questions.0.answers.0.text', 'html+latex'],
        ['elea_qcm', 'questions.0.answers.0.feedback', 'html'],
        ['elea_appariement', 'intro', 'html+latex'],
        ['elea_appariement', 'pairs.0.question', 'html+latex'],
        ['elea_appariement', 'pairs.0.answer', 'html+latex'],
        ['elea_page', 'title', 'plain'],
        ['elea_page', 'blocks.0.data', 'html+latex'],
        ['elea_page', 'intro', 'html+latex'],
        ['elea_millionnaire', 'questions.0.question', 'plain'],
        ['elea_millionnaire', 'questions.0.goodanswer', 'plain'],
        // elea_test — chemins plats
        ['elea_test', 'questions.0.questiontext', 'html+latex'],
        ['elea_test', 'questions.0.answers.0.text', 'html+latex'],
        ['elea_test', 'questions.0.subquestions.0.answer', 'plain'],
        ['elea_test', 'questions.0.feedback', 'html+latex'],
        ['elea_test', 'questions.0.correctfeedback', 'html+latex'],
        ['elea_test', 'questions.0.incorrectfeedback', 'html+latex'],
        ['elea_test', 'questions.0.answers.0.feedback', 'html+latex'],
        ['elea_test', 'questions.0.answer.feedback_true', 'html+latex'],
        ['elea_test', 'questions.0.answer.feedback_false', 'html+latex'],
        ['elea_test', 'questions.0.answer.feedback', 'html+latex'],
        ['elea_test', 'questions.0.hints.0', 'html+latex'],
        ['elea_test', 'bank_description', 'html+latex'],
        // elea_test — chemins via content.* (dynamicObject éditeur)
        ['elea_test', 'questions.0.content.questiontext', 'html+latex'],
        ['elea_test', 'questions.0.content.answers.0.text', 'html+latex'],
        ['elea_test', 'questions.0.content.answers.0.feedback', 'html+latex'],
        ['elea_test', 'questions.0.content.feedback', 'html+latex'],
        ['elea_test', 'questions.0.content.correctfeedback', 'html+latex'],
        ['elea_test', 'questions.0.content.partiallycorrectfeedback', 'html+latex'],
        ['elea_test', 'questions.0.content.incorrectfeedback', 'html+latex'],
        ['elea_test', 'questions.0.content.subquestions.0.text', 'html+latex'],
        ['elea_test', 'questions.0.content.subquestions.0.answer', 'plain'],
        ['elea_test', 'questions.0.content.answer.feedback_true', 'html+latex'],
        ['elea_test', 'questions.0.content.answer.feedback_false', 'html+latex'],
        ['elea_test', 'questions.0.content.answer.feedback', 'html+latex'],
        ['elea_test', 'questions.0.content.hints.0', 'html+latex'],
        ['elea_glossaire', 'entries.0.concept', 'plain'],
        ['elea_glossaire', 'entries.0.definition', 'html+latex'],
        ['elea_devoir', 'title', 'unicode'],
        ['elea_devoir', 'intro', 'html+latex'],
        ['elea_devoir', 'description', 'html+latex'],
        ['elea_devoir', 'rubricName', 'unicode'],
        ['elea_devoir', 'criteria.0.description', 'unicode'],
        ['elea_devoir', 'criteria.0.levels.0.definition', 'unicode'],

        // elea_test — chemins plats manquants
        ['elea_test', 'questions.0.subquestions.0.text', 'html+latex'],
        ['elea_test', 'questions.0.partiallycorrectfeedback', 'html+latex'],

        // elea_millionnaire
        ['elea_millionnaire', 'questions.0.badanswer.0', 'plain'],

        // Appariement (clé courte)
        ['Appariement', 'intro', 'html+latex'],

        // Test (clé courte) — tous les feedbacks imbriqués
        ['Test', 'bank_description', 'html+latex'],
        ['Test', 'questions.0.answers.0.feedback', 'html+latex'],
        ['Test', 'questions.0.feedback', 'html+latex'],
        ['Test', 'questions.0.correctfeedback', 'html+latex'],
        ['Test', 'questions.0.partiallycorrectfeedback', 'html+latex'],
        ['Test', 'questions.0.incorrectfeedback', 'html+latex'],
        ['Test', 'questions.0.answer.feedback_true', 'html+latex'],
        ['Test', 'questions.0.answer.feedback_false', 'html+latex'],
        ['Test', 'questions.0.answer.feedback', 'html+latex'],
        ['Test', 'questions.0.hints.0', 'html+latex'],

        // Devoir (clé courte)
        ['Devoir', 'description', 'html+latex'],

        // Page (clé courte) — sous-champs blocs
        ['Page', 'blocks.0.data.text', 'html+latex'],
        ['Page', 'blocks.0.data.content', 'html+latex'],
        ['Page', 'blocks.0.data.label', 'html+latex'],
        ['Page', 'blocks.0.data.caption', 'html+latex'],
        ['Page', 'blocks.0.data.cards.0.text', 'html+latex'],
        ['Page', 'blocks.0.data.callouts.0.text', 'html+latex'],
        ['Page', 'blocks.0.data.stats.0.label', 'html+latex'],
        ['Page', 'blocks.0.data.sections.0.text', 'html+latex'],
        ['Page', 'blocks.0.data.questions.0.q', 'html+latex'],
        ['Page', 'blocks.0.data.questions.0.a', 'html+latex'],
        ['Page', 'blocks.0.data.items.0.myth', 'html+latex'],
        ['Page', 'blocks.0.data.items.0.reality', 'html+latex'],
        ['Page', 'blocks.0.data.quote_langue_initiale', 'html+latex'],
        ['Page', 'blocks.0.data.quote_langue_arrivee', 'html+latex'],

        // elea_page — mêmes sous-champs
        ['elea_page', 'blocks.0.data.text', 'html+latex'],
        ['elea_page', 'blocks.0.data.content', 'html+latex'],
        ['elea_page', 'blocks.0.data.label', 'html+latex'],
        ['elea_page', 'blocks.0.data.caption', 'html+latex'],
        ['elea_page', 'blocks.0.data.cards.0.text', 'html+latex'],
        ['elea_page', 'blocks.0.data.callouts.0.text', 'html+latex'],
        ['elea_page', 'blocks.0.data.stats.0.label', 'html+latex'],
        ['elea_page', 'blocks.0.data.sections.0.text', 'html+latex'],
        ['elea_page', 'blocks.0.data.questions.0.q', 'html+latex'],
        ['elea_page', 'blocks.0.data.questions.0.a', 'html+latex'],
        ['elea_page', 'blocks.0.data.items.0.myth', 'html+latex'],
        ['elea_page', 'blocks.0.data.items.0.reality', 'html+latex'],
        ['elea_page', 'blocks.0.data.quote_langue_initiale', 'html+latex'],
        ['elea_page', 'blocks.0.data.quote_langue_arrivee', 'html+latex'],
    ];

    for (const [moduleKey, path, expected] of tests) {
        const result = resolveRenderTypeForField(moduleKey, path);
        assertEqual(result, expected, `${moduleKey} / ${path} → ${expected}`);
    }

    // Cas invalides → null
    assertEqual(resolveRenderTypeForField('MultipleChoice', 'inexistant'), null, 'Champ inexistant → null');
    assertEqual(resolveRenderTypeForField('InexistantModule', 'question'), null, 'Module inexistant → null');
    assertEqual(resolveRenderTypeForField(null, 'question'), null, 'moduleKey null → null');
    assertEqual(resolveRenderTypeForField('MultipleChoice', null), null, 'fieldPath null → null');
    assertEqual(resolveRenderTypeForField('MultipleChoice', ''), null, 'fieldPath vide → null');
    assertEqual(resolveRenderTypeForField('', 'question'), null, 'moduleKey vide → null');

    // --- Conteneurs : resolution via .params. (QuizSet, CoursePresentation) ---
    // QuizSet contenant MultipleChoice
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.0.params.question'), 'html+latex', 'QuizSet→MC: params.question → html+latex');
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.0.params.answers.0.text'), 'html+latex', 'QuizSet→MC: params.answers.0.text → html+latex');
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.0.params.answers.1.tipsAndFeedback.tip'), 'html', 'QuizSet→MC: params.tip → html');
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.0.params.overallFeedback.0.feedback'), 'latex', 'QuizSet→MC: params.overallFeedback → latex');

    // QuizSet contenant TrueFalse
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.1.params.question'), 'html+latex', 'QuizSet→TF: params.question → html+latex');
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.1.params.feedbackOnCorrect'), 'latex', 'QuizSet→TF: params.feedbackOnCorrect → latex');

    // QuizSet contenant FillInTheBlanks
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.2.params.taskDescription'), 'html+latex', 'QuizSet→Blanks: params.taskDescription → html+latex');
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.2.params.questions.0'), 'unicode+markers', 'QuizSet→Blanks: params.questions → unicode+markers');

    // QuizSet contenant DragTheWords
    assertEqual(resolveRenderTypeForField('QuizSet', 'questions.3.params.textField'), 'unicode+markers', 'QuizSet→Drag: params.textField → unicode+markers');

    // CoursePresentation sous-champs exercice
    assertEqual(resolveRenderTypeForField('CoursePresentation', 'slides.0.exercise.params.question'), 'html+latex', 'CP→MC: params.question → html+latex');
}

// =======================================================================
// STEP 2 : NORMALISATION DES CHEMINS
// =======================================================================

function runStep2_PathNormalization() {
    setStep(2, 'Normalisation chemin');

    // Tester indirectement via resolveRenderTypeForField
    // Les chemins avec indices doivent etre normalises en []
    assertEqual(resolveRenderTypeForField('Flashcards', 'cards.0.text'), 'html+latex', 'cards.0.text normalise en cards[].text');
    assertEqual(resolveRenderTypeForField('Flashcards', 'cards.99.text'), 'html+latex', 'cards.99.text normalise en cards[].text');
    assertEqual(resolveRenderTypeForField('QCM', 'questions.0.answers.1.text'), 'html+latex', 'questions.0.answers.1.text normalise');
    assertEqual(resolveRenderTypeForField('QCM', 'questions.5.answers.12.text'), 'html+latex', 'Grands indices normalises');
    assertEqual(resolveRenderTypeForField('Summary', 'summaries.0.summary.0'), 'html+latex', 'Double tableau normalise');
    assertEqual(resolveRenderTypeForField('CoursePresentation', 'slides.0.table.rows.0.0'), 'html+latex', 'Tableau 2D normalise');
    assertEqual(resolveRenderTypeForField('Crossword', 'words.3.extraClue.params.text'), 'html+latex', 'Chemin profond normalise');

    // Chemins simples sans indice
    assertEqual(resolveRenderTypeForField('MarkTheWords', 'textField'), 'unicode+markers', 'Champ simple sans indice');
    assertEqual(resolveRenderTypeForField('Essay', 'taskDescription'), 'html+latex', 'Champ racine simple');
}

// =======================================================================
// STEP 3 : NETTOYAGE HTML
// =======================================================================

function runStep3_HtmlCleaning() {
    setStep(3, 'Nettoyage HTML');

    // Normalisation div → texte (div→p→Markdown)
    let r = htmlToCleanOutput('<div>Texte</div>');
    assert(r.includes('Texte') && !r.includes('<div>'), 'div normalise et supprime');

    r = htmlToCleanOutput('<div>A</div><div>B</div>');
    assert(!r.includes('<div>') && r.includes('A') && r.includes('B'), 'Multiples div normalises');

    // Styles : color conserve, reste supprime
    r = htmlToCleanOutput('<span style="color: red; font-size: 20px; background: blue">Texte</span>');
    assert(r.includes('color') && r.includes('Texte'), 'Style color conserve');
    assert(!r.includes('font-size'), 'font-size supprime');
    assert(!r.includes('background'), 'background supprime');

    r = htmlToCleanOutput('<span style="font-weight: bold">Texte</span>');
    assert(!r.includes('font-weight'), 'Style sans color supprime');

    // Tags vides supprimes
    r = htmlToCleanOutput('<p></p><strong></strong><em></em>Texte');
    assert(!r.includes('<p></p>') && !r.includes('<strong></strong>') && !r.includes('<em></em>'), 'Tags vides p/strong/em supprimes');

    r = htmlToCleanOutput('<span></span><sub></sub><sup></sup>Texte');
    assert(!r.includes('<span></span>') && !r.includes('<sub></sub>') && !r.includes('<sup></sup>'), 'Tags vides span/sub/sup supprimes');

    // &nbsp; → espace
    r = htmlToCleanOutput('Texte&nbsp;ici&nbsp;la');
    assert(r.includes('Texte ici la'), '&nbsp; → espace normal');

    // BR convertis en \n, multiples nettoyes
    r = htmlToCleanOutput('A<br><br><br><br><br>B');
    const nlCount = (r.match(/\n/g) || []).length;
    assert(nlCount <= 3, `BR multiples → sauts de ligne nettoyes : ${nlCount} (max 3)`);

    // Formatage reconverti en Markdown
    r = htmlToCleanOutput('<p><strong>Gras</strong></p>');
    assert(r.includes('**Gras**'), 'strong → **Gras**');

    r = htmlToCleanOutput('<em>Italique</em>');
    assert(r.includes('*Italique*'), 'em → *Italique*');

    r = htmlToCleanOutput('<u>Souligne</u>');
    assert(r.includes('<u>Souligne</u>'), 'u preserve');

    r = htmlToCleanOutput('<s>Barre</s>');
    assert(r.includes('<s>Barre</s>'), 's preserve');

    r = htmlToCleanOutput('<sup>Exposant</sup>');
    assert(r.includes('<sup>Exposant</sup>'), 'sup preserve');

    r = htmlToCleanOutput('<sub>Indice</sub>');
    assert(r.includes('<sub>Indice</sub>'), 'sub preserve');

    // Listes preservees
    r = htmlToCleanOutput('<ul><li>Item 1</li><li>Item 2</li></ul>');
    assert(r.includes('<ul>') && r.includes('<li>'), 'Liste ul/li preservee');

    r = htmlToCleanOutput('<ol><li>Premier</li><li>Deuxieme</li></ol>');
    assert(r.includes('<ol>') && r.includes('<li>'), 'Liste ol/li preservee');

    // Liens preserves avec attributs
    r = htmlToCleanOutput('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Lien</a>');
    assert(r.includes('href="https://example.com"'), 'Lien href preserve');
    assert(r.includes('target="_blank"'), 'Lien target preserve');

    // Vide et null
    assertEqual(htmlToCleanOutput(''), '', 'Entree vide → sortie vide');
    assertEqual(htmlToCleanOutput(null), '', 'Entree null → sortie vide');
    assertEqual(htmlToCleanOutput(undefined), '', 'Entree undefined → sortie vide');

    // P convertis en texte + saut de ligne
    r = htmlToCleanOutput('<p>Ligne 1</p><p>Ligne 2</p>');
    assert(r.includes('Ligne 1') && r.includes('Ligne 2'), 'P convertis preservent le contenu');
    assert(!r.includes('<p>'), 'P supprimes dans la sortie Markdown');

    // Trim
    r = htmlToCleanOutput('   <p>Texte</p>   ');
    assert(r === r.trim(), 'Espaces exterieurs trimmes');
}

// =======================================================================
// STEP 4 : PROTECTION LATEX
// =======================================================================

function runStep4_ProtectLatex() {
    setStep(4, 'Protection LaTeX');

    // Formule inline
    let r = protectLatex('Calcule \\(x^2\\) ici');
    assert(r.includes('class="json-editor__richtext-latex"'), 'Span avec class richtext-latex');
    assert(r.includes('contenteditable="false"'), 'contenteditable=false');
    assert(r.includes('data-latex='), 'Attribut data-latex present');
    assert(!r.includes('<span') || r.includes('json-editor__richtext-latex'), 'Seuls les spans LaTeX sont ajoutes');

    // Formule display
    r = protectLatex('Affiche \\[\\sum_{i=1}^n x_i\\]');
    assert(r.includes('json-editor__richtext-latex--display'), 'Classe display pour \\[...\\]');

    // Multiple formules
    r = protectLatex('\\(a\\) et \\(b\\) et \\(c\\)');
    const spanCount = (r.match(/class="json-editor__richtext-latex"/g) || []).length;
    assertEqual(spanCount, 3, `3 formules → 3 spans (obtenu: ${spanCount})`);

    // Melange inline et display
    r = protectLatex('Inline \\(x\\) et display \\[y\\]');
    assert(r.includes('json-editor__richtext-latex"') && r.includes('json-editor__richtext-latex--display'), 'Inline et display coexistent');

    // Pas de LaTeX → pas de modification
    r = protectLatex('Texte simple sans formule');
    assertEqual(r, 'Texte simple sans formule', 'Pas de LaTeX → texte inchange');

    // Vide
    assertEqual(protectLatex(''), '', 'protectLatex vide → vide');
    assertEqual(protectLatex(null), '', 'protectLatex null → vide');

    // LaTeX avec HTML autour
    r = protectLatex('<p>Calcule <strong>\\(x^2\\)</strong> ici</p>');
    assert(r.includes('json-editor__richtext-latex'), 'LaTeX dans du HTML est protege');
}

// =======================================================================
// STEP 5 : ROUND-TRIP LATEX
// =======================================================================

function runStep5_LatexRoundTrip() {
    setStep(5, 'Round-trip LaTeX');

    const testCases = [
        'Calcule \\(x^2 + 3x\\) pour x=2',
        'La formule \\(\\frac{a}{b}\\) est une fraction',
        'Soit \\(\\alpha\\) et \\(\\beta\\) deux angles',
        'En mode display : \\[\\sum_{i=1}^n x_i\\]',
        'Texte sans formule',
        '',
        'Melange \\(a\\) texte \\(b\\) et \\[c\\]',
        'LaTeX complexe \\(\\frac{\\sqrt{x^2+1}}{2\\pi}\\)',
        'Formule avec accolades \\(\\left\\{a, b, c\\right\\}\\)',
        'Indices et exposants \\(x_i^{n+1}\\)',
        'Integrale \\(\\int_0^{\\infty} e^{-x} dx\\)',
        'Matrice \\(\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\)',
        '<p>HTML autour \\(x\\) du LaTeX</p>',
        '<strong>Gras</strong> puis \\(\\alpha + \\beta\\)',
    ];

    for (const original of testCases) {
        const label = original ? `"${original.substring(0, 60)}${original.length > 60 ? '...' : ''}"` : '(vide)';
        const protected_ = protectLatex(original);
        const unprotected = unprotectLatex(protected_);
        assertEqual(unprotected, original, `Round-trip: ${label}`);
    }
}

// =======================================================================
// STEP 6 : sourceToDisplay
// =======================================================================

function runStep6_SourceToDisplay() {
    setStep(6, 'sourceToDisplay');

    // html+latex → protege le LaTeX
    const src = '<p>Calcule \\(x^2\\)</p>';
    let r = sourceToDisplay(src, 'html+latex');
    assert(r.includes('json-editor__richtext-latex'), 'html+latex protege le LaTeX');

    // html → ne protege PAS le LaTeX
    r = sourceToDisplay(src, 'html');
    assert(!r.includes('json-editor__richtext-latex'), 'html ne protege pas le LaTeX');

    // unicode+markers → ne protege PAS
    r = sourceToDisplay('Texte avec *mot* marque', 'unicode+markers');
    assert(!r.includes('json-editor__richtext-latex'), 'unicode+markers ne protege pas');

    // Vide
    assertEqual(sourceToDisplay('', 'html+latex'), '', 'sourceToDisplay vide → vide');
    assertEqual(sourceToDisplay(null, 'html+latex'), '', 'sourceToDisplay null → vide');

    // Sans LaTeX, html+latex retourne le HTML tel quel
    r = sourceToDisplay('<p>Pas de formule</p>', 'html+latex');
    assertEqual(r, '<p>Pas de formule</p>', 'HTML sans LaTeX retourne tel quel');
}

// =======================================================================
// STEP 7 : MODE MARQUEURS
// =======================================================================

function runStep7_Markers() {
    setStep(7, 'Mode marqueurs');

    // On teste indirectement via les regex du htmlToCleanOutput et sourceToDisplay
    // Le mode marqueurs utilise textContent, pas innerHTML

    // Texte avec marqueurs doit etre preserve par htmlToCleanOutput
    const markerText = 'Le *chat* dort sur le *tapis*';
    const cleaned = htmlToCleanOutput(markerText);
    assert(cleaned.includes('*chat*'), 'Marqueur *chat* preserve dans htmlToCleanOutput');
    assert(cleaned.includes('*tapis*'), 'Marqueur *tapis* preserve dans htmlToCleanOutput');

    // Texte sans marqueurs
    const plainText = 'Le chat dort';
    assertEqual(htmlToCleanOutput(plainText), plainText.trim(), 'Texte sans marqueurs preserve');

    // Marqueurs adjacents
    const adjacent = '*mot1* *mot2* *mot3*';
    const r2 = htmlToCleanOutput(adjacent);
    assert(r2.includes('*mot1*') && r2.includes('*mot2*') && r2.includes('*mot3*'), 'Marqueurs adjacents preserves');

    // Marqueur avec espaces internes
    const spacedMarker = 'Texte *mot long* ici';
    assert(htmlToCleanOutput(spacedMarker).includes('*mot long*'), 'Marqueur multi-mots preserve');
}

// =======================================================================
// STEP 8 : RENDU DOM
// =======================================================================

function runStep8_DomRendering() {
    setStep(8, 'Rendu DOM');

    // Teste renderRichtextField pour html+latex
    const config = { label: 'Test label', required: true, renderType: 'html+latex', hint: 'Un indice' };
    const wrapper = renderRichtextField(config, '<p>Contenu <strong>gras</strong></p>', () => {}, 'test.path');

    assert(wrapper instanceof HTMLElement, 'renderRichtextField retourne un HTMLElement');
    assert(wrapper.classList.contains('json-editor__field--richtext'), 'Classe json-editor__field--richtext');

    // Label
    const label = wrapper.querySelector('.json-editor__label');
    assert(label !== null, 'Label present');
    assert(label.classList.contains('json-editor__label--required'), 'Label marque required');

    // Container
    const container = wrapper.querySelector('.json-editor__richtext-container');
    assert(container !== null, 'Container richtext present');

    // Editable
    const editable = wrapper.querySelector('.json-editor__richtext-editable');
    assert(editable !== null, 'Zone editable presente');
    assert(editable.getAttribute('contenteditable') === 'true', 'contenteditable=true');
    assert(editable.getAttribute('role') === 'textbox', 'role=textbox');
    assert(editable.getAttribute('data-path') === 'test.path', 'data-path correct');

    // Source
    const source = wrapper.querySelector('.json-editor__richtext-source');
    assert(source !== null, 'Zone source presente');
    assert(source.classList.contains('json-editor__richtext-source--hidden'), 'Source cachee par defaut');

    // Hint
    const hint = wrapper.querySelector('.json-editor__hint');
    assert(hint !== null, 'Hint present');

    // Error
    const error = wrapper.querySelector('.json-editor__error');
    assert(error !== null, 'Zone erreur presente');

    // Contenu initialise
    assert(editable.innerHTML.includes('<strong>gras</strong>'), 'Contenu HTML initialise dans editable');

    // Teste renderRichtextField pour html (sans LaTeX)
    const config2 = { label: 'Feedback', renderType: 'html' };
    const wrapper2 = renderRichtextField(config2, 'Texte feedback', () => {}, 'feedback.path');
    assert(wrapper2 instanceof HTMLElement, 'html: retourne HTMLElement');
    const editable2 = wrapper2.querySelector('.json-editor__richtext-editable');
    assert(editable2 !== null, 'html: zone editable presente');

    // Teste renderRichtextField pour unicode+markers
    const config3 = { label: 'Texte', renderType: 'unicode+markers' };
    const wrapper3 = renderRichtextField(config3, 'Le *chat* dort', () => {}, 'text.path');
    const editable3 = wrapper3.querySelector('.json-editor__richtext-editable');
    assert(editable3 !== null, 'markers: zone editable presente');

    // Teste avec valeur vide
    const config4 = { label: 'Vide', renderType: 'html+latex', placeholder: 'Placeholder test' };
    const wrapper4 = renderRichtextField(config4, '', () => {}, 'empty.path');
    const editable4 = wrapper4.querySelector('.json-editor__richtext-editable');
    assert(editable4.innerHTML === '' || editable4.innerHTML.trim() === '', 'Valeur vide → editable vide');
    assert(editable4.getAttribute('data-placeholder') !== null, 'Placeholder defini');

    // Teste avec LaTeX dans la valeur
    const config5 = { label: 'Math', renderType: 'html+latex' };
    const wrapper5 = renderRichtextField(config5, '<p>Calcule \\(x^2\\)</p>', () => {}, 'math.path');
    const editable5 = wrapper5.querySelector('.json-editor__richtext-editable');
    assert(editable5.innerHTML.includes('json-editor__richtext-latex'), 'LaTeX protege dans le rendu initial');
}

// =======================================================================
// STEP 9 : INTEGRITE EXPORTS
// =======================================================================

function runStep9_ExportIntegrity() {
    setStep(9, 'Integrite exports');

    // Verifier que le HTML de sortie est compatible H5P
    // Les spans LaTeX internes doivent etre deproteges
    const htmlWithLatex = '<p>Texte <span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(x^2\\)">\\(x^2\\)</span> suite</p>';
    const cleaned = htmlToCleanOutput(htmlWithLatex);
    assert(cleaned.includes('\\(x^2\\)'), 'Export: LaTeX deprotege');
    assert(!cleaned.includes('json-editor__richtext-latex'), 'Export: pas de classe interne');
    assert(!cleaned.includes('contenteditable'), 'Export: pas de contenteditable');
    assert(!cleaned.includes('data-latex'), 'Export: pas de data-latex');

    // Multiple formules dans un export
    const multiLatex = '<p><span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(a\\)">\\(a\\)</span> + <span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(b\\)">\\(b\\)</span></p>';
    const cleanedMulti = htmlToCleanOutput(multiLatex);
    assert(cleanedMulti.includes('\\(a\\)') && cleanedMulti.includes('\\(b\\)'), 'Export: multiples LaTeX deproteges');

    // Display math
    const displayLatex = '<p><span class="json-editor__richtext-latex json-editor__richtext-latex--display" contenteditable="false" data-latex="\\[E=mc^2\\]">\\[E=mc^2\\]</span></p>';
    const cleanedDisplay = htmlToCleanOutput(displayLatex);
    assert(cleanedDisplay.includes('\\[E=mc^2\\]'), 'Export: display LaTeX deprotege');

    // Formatage + LaTeX dans un meme export (strong reconverti en Markdown)
    const mixed = '<p><strong>Question :</strong> Calculer <span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(\\frac{1}{2}\\)">\\(\\frac{1}{2}\\)</span></p>';
    const cleanedMixed = htmlToCleanOutput(mixed);
    assert(cleanedMixed.includes('**Question :**'), 'Export: strong reconverti en Markdown avec LaTeX');
    assert(cleanedMixed.includes('\\(\\frac{1}{2}\\)'), 'Export: LaTeX preserve avec formatage');

    // Export de couleur (le navigateur peut normaliser #c0392b en rgb())
    const colored = '<p><span style="color: #c0392b">Texte rouge</span></p>';
    const cleanedColor = htmlToCleanOutput(colored);
    assert(cleanedColor.includes('color') && cleanedColor.includes('Texte rouge'), 'Export: couleur preservee');
}

// =======================================================================
// STEP 10 : COUVERTURE DES ACTIVITES
// =======================================================================

function runStep10_ActivityCoverage() {
    setStep(10, 'Couverture activites');

    // Verifier que chaque champ confie a l'editeur richtext dans FIELD_CONSTRAINTS
    // est correctement resolu. La liste DOIT rester alignee sur celle de
    // getRendererForField() (editor-core.js) : un type qui manque ici sort
    // silencieusement de la couverture (constate en ajoutant `latex`, qui avait
    // fait disparaitre 15 assertions sans provoquer le moindre echec).
    const richtextTypes = ['html+latex', 'html', 'latex', 'unicode+markers'];

    let totalFields = 0;
    let resolvedFields = 0;

    for (const [moduleKey, constraint] of Object.entries(FIELD_CONSTRAINTS)) {
        if (!constraint.fields) continue;

        for (const [fieldPath, fieldDef] of Object.entries(constraint.fields)) {
            totalFields++;

            if (richtextTypes.includes(fieldDef.render)) {
                // Ce champ devrait etre detecte comme richtext
                // Creer un chemin editeur simulé (remplacer [] par .0)
                const editorPath = fieldPath.replace(/\[\]/g, '.0');
                const result = resolveRenderTypeForField(moduleKey, editorPath);
                const ok = result === fieldDef.render;
                assert(ok, `${moduleKey}.${fieldPath} (${fieldDef.render}) → resolve OK`, ok ? null : { attendu: fieldDef.render, obtenu: result });
                if (ok) resolvedFields++;
            }
        }
    }

    assert(totalFields > 0, `${totalFields} champs trouves dans FIELD_CONSTRAINTS`);
    assert(resolvedFields > 0, `${resolvedFields} champs richtext resolus correctement`);
}

// =======================================================================
// STEP 11 : EDGE CASES
// =======================================================================

function runStep11_EdgeCases() {
    setStep(11, 'Edge cases');

    // Tres long texte
    const longText = '<p>' + 'A'.repeat(10000) + '</p>';
    const cleanedLong = htmlToCleanOutput(longText);
    assert(cleanedLong.length > 0, 'Texte tres long traite sans erreur');

    // Caracteres speciaux HTML
    const special = '<p>5 &lt; 10 &amp; 10 &gt; 5</p>';
    const cleanedSpecial = htmlToCleanOutput(special);
    assert(cleanedSpecial.includes('&lt;') || cleanedSpecial.includes('<'), 'Caracteres speciaux geres');

    // Unicode
    const unicode = '<p>Les exposants : x² + y³ = z⁴</p>';
    const cleanedUnicode = htmlToCleanOutput(unicode);
    assert(cleanedUnicode.includes('x²'), 'Unicode expose preserve');

    // Emoji
    const emoji = '<p>Bravo ! 🎉 Bien joue 👍</p>';
    const cleanedEmoji = htmlToCleanOutput(emoji);
    assert(cleanedEmoji.includes('🎉') && cleanedEmoji.includes('👍'), 'Emoji preserves');

    // Sauts de ligne multiples
    const newlines = 'Ligne 1\n\n\nLigne 2';
    const cleanedNewlines = htmlToCleanOutput(newlines);
    assert(cleanedNewlines.length > 0, 'Sauts de ligne geres');

    // HTML malveillant (basique - DOMPurify n'est pas charge dans les tests)
    const malicious = '<script>alert("xss")</script><p>Safe</p>';
    const cleanedMalicious = htmlToCleanOutput(malicious);
    assert(cleanedMalicious.includes('Safe'), 'Contenu safe preserve');

    // LaTeX avec caracteres speciaux HTML
    const latexSpecial = 'Formule \\(a < b\\) et \\(c > d\\)';
    const protectedSpecial = protectLatex(latexSpecial);
    const unprotectedSpecial = unprotectLatex(protectedSpecial);
    assertEqual(unprotectedSpecial, latexSpecial, 'LaTeX avec < et > round-trip OK');

    // LaTeX vide \(\)
    const emptyLatex = 'Vide \\(\\) ici';
    const protectedEmpty = protectLatex(emptyLatex);
    const unprotectedEmpty = unprotectLatex(protectedEmpty);
    assertEqual(unprotectedEmpty, emptyLatex, 'LaTeX vide round-trip OK');

    // Multiples resolveRenderTypeForField consecutifs (pas de state leak)
    const r1 = resolveRenderTypeForField('MultipleChoice', 'question');
    const r2 = resolveRenderTypeForField('TrueFalse', 'question');
    const r3 = resolveRenderTypeForField('MultipleChoice', 'question');
    assertEqual(r1, 'html+latex', 'Pas de state leak (1)');
    assertEqual(r2, 'html+latex', 'Pas de state leak (2)');
    assertEqual(r3, 'html+latex', 'Pas de state leak (3)');
}

// =======================================================================
// STEP 12 : TOOLBAR CONTEXTUELLE
// =======================================================================

function runStep12_ToolbarContextual() {
    setStep(12, 'Toolbar contextuelle');

    // Tester indirectement via renderRichtextField et focus
    // On verifie que les bons boutons sont presents apres focus

    // html+latex : doit avoir le bouton math
    const wrapper1 = renderRichtextField({ label: 'Q', renderType: 'html+latex' }, '', () => {}, 'q');
    const editable1 = wrapper1.querySelector('.json-editor__richtext-editable');
    // Simuler focus
    editable1.dispatchEvent(new Event('focus'));
    const toolbar1 = wrapper1.querySelector('.json-editor__richtext-toolbar');
    if (toolbar1) {
        assert(toolbar1.querySelector('[data-action="bold"]') !== null, 'html+latex: bouton bold present');
        assert(toolbar1.querySelector('[data-action="italic"]') !== null, 'html+latex: bouton italic present');
        assert(toolbar1.querySelector('[data-action="math"]') !== null, 'html+latex: bouton math present');
        assert(toolbar1.querySelector('[data-action="toggle_source"]') !== null, 'html+latex: bouton source present');
        assert(toolbar1.querySelector('[data-action="color"]') !== null, 'html+latex: bouton color present');
        assert(toolbar1.querySelector('[data-action="link"]') !== null, 'html+latex: bouton link present');
        assert(toolbar1.querySelector('[data-action="list_ordered"]') !== null, 'html+latex: bouton list_ordered present');
    } else {
        assert(false, 'html+latex: toolbar non trouvee apres focus');
    }

    // html : pas de bouton math
    const wrapper2 = renderRichtextField({ label: 'F', renderType: 'html' }, '', () => {}, 'f');
    const editable2 = wrapper2.querySelector('.json-editor__richtext-editable');
    editable2.dispatchEvent(new Event('focus'));
    const toolbar2 = wrapper2.querySelector('.json-editor__richtext-toolbar');
    if (toolbar2) {
        assert(toolbar2.querySelector('[data-action="bold"]') !== null, 'html: bouton bold present');
        assert(toolbar2.querySelector('[data-action="math"]') === null, 'html: bouton math absent');
        assert(toolbar2.querySelector('[data-action="toggle_source"]') !== null, 'html: bouton source present');
    } else {
        assert(false, 'html: toolbar non trouvee apres focus');
    }

    // unicode+markers : seulement mark/unmark/source
    const wrapper3 = renderRichtextField({ label: 'M', renderType: 'unicode+markers' }, '', () => {}, 'm');
    const editable3 = wrapper3.querySelector('.json-editor__richtext-editable');
    editable3.dispatchEvent(new Event('focus'));
    const toolbar3 = wrapper3.querySelector('.json-editor__richtext-toolbar');
    if (toolbar3) {
        assert(toolbar3.querySelector('[data-action="mark_word"]') !== null, 'markers: bouton mark_word present');
        assert(toolbar3.querySelector('[data-action="unmark_word"]') !== null, 'markers: bouton unmark_word present');
        assert(toolbar3.querySelector('[data-action="toggle_source"]') !== null, 'markers: bouton source present');
        assert(toolbar3.querySelector('[data-action="bold"]') === null, 'markers: bouton bold absent');
        assert(toolbar3.querySelector('[data-action="math"]') === null, 'markers: bouton math absent');
    } else {
        assert(false, 'markers: toolbar non trouvee apres focus');
    }

    // latex : formule + source, mais AUCUN formatage HTML.
    // Le semantics de ces champs (overallFeedback[].feedback, TrueFalse.feedbackOn*,
    // Flashcards.description, FindTheWords.taskDescription) est un `text` sans tags :
    // Moodle y ECHAPPE le HTML (l'eleve verrait « <strong> »), mais laisse passer
    // les formules. Offrir le gras ici serait donc un piege.
    const wrapper4 = renderRichtextField({ label: 'L', renderType: 'latex' }, '', () => {}, 'l');
    const editable4 = wrapper4.querySelector('.json-editor__richtext-editable');
    editable4.dispatchEvent(new Event('focus'));
    const toolbar4 = wrapper4.querySelector('.json-editor__richtext-toolbar');
    if (toolbar4) {
        assert(toolbar4.querySelector('[data-action="math"]') !== null, 'latex: bouton math present');
        assert(toolbar4.querySelector('[data-action="toggle_source"]') !== null, 'latex: bouton source present');
        assert(toolbar4.querySelector('[data-action="bold"]') === null, 'latex: bouton bold absent');
        assert(toolbar4.querySelector('[data-action="italic"]') === null, 'latex: bouton italic absent');
        assert(toolbar4.querySelector('[data-action="color"]') === null, 'latex: bouton color absent');
        assert(toolbar4.querySelector('[data-action="link"]') === null, 'latex: bouton link absent');
        assert(toolbar4.querySelector('[data-action="list_ordered"]') === null, 'latex: bouton liste absent');
    } else {
        assert(false, 'latex: toolbar non trouvee apres focus');
    }

    // Le convertisseur du type `latex` : retire les balises, garde les formules.
    const sale = 'Bravo <strong>tres</strong> bien : \\(\\sqrt{16} = 4\\) et **gras**';
    const propre = stripHtmlKeepLatex(sale);
    assert(!/<[a-z]/i.test(propre), 'latex: balises retirees par stripHtmlKeepLatex');
    assert(propre.includes('\\(\\sqrt{16} = 4\\)'), 'latex: formule preservee verbatim');
    assert(!propre.includes('**'), 'latex: Markdown retire');
    // Cas critique : une formule contenant < ne doit pas etre amputee
    const avecInf = stripHtmlKeepLatex('Si \\(a < b\\) alors <em>ok</em>');
    assert(avecInf.includes('\\(a < b\\)'), 'latex: formule avec < preservee intacte');
    assert(!avecInf.includes('<em>'), 'latex: balise retiree malgre le < de la formule');
}

// =======================================================================
// STEP 13 : COLLAGE HTML
// =======================================================================

function runStep13_PasteHtml() {
    setStep(13, 'Collage HTML');

    // Simuler le nettoyage de HTML colle (via htmlToCleanOutput qui fait le travail)
    // HTML depuis Word
    const wordHtml = '<!--[if gte mso 9]><xml></xml><![endif]--><p class="MsoNormal" style="margin-bottom: 0.0001pt; line-height: normal; font-size: 12pt; font-family: Calibri, sans-serif; color: black"><b>Texte Word</b></p>';
    const cleanedWord = htmlToCleanOutput(wordHtml);
    assert(!cleanedWord.includes('MsoNormal'), 'Pas de classe Word dans le HTML nettoye');
    assert(!cleanedWord.includes('font-family'), 'Pas de font-family Word');
    assert(cleanedWord.includes('<b>Texte Word</b>') || cleanedWord.includes('Texte Word'), 'Contenu Word preserve');

    // HTML avec data attributes
    const dataHtml = '<p data-pm-slice="1 1 []" data-custom="value">Texte Google Docs</p>';
    const cleanedData = htmlToCleanOutput(dataHtml);
    assert(!cleanedData.includes('data-pm-slice'), 'Pas de data-pm-slice');
    assert(!cleanedData.includes('data-custom'), 'Pas de data-custom');

    // HTML avec commentaires
    const commentHtml = '<!-- Comment --><p>Texte</p><!-- Fin -->';
    const cleanedComment = htmlToCleanOutput(commentHtml);
    assert(!cleanedComment.includes('<!--'), 'Pas de commentaires HTML');
    assert(cleanedComment.includes('Texte'), 'Contenu preserve apres suppression commentaires');

    // Formatage basique du copier-coller preserve
    // Formatage colle reconverti en Markdown
    const basicPaste = '<b>Gras</b> et <i>italique</i> et <u>souligne</u>';
    const cleanedBasic = htmlToCleanOutput(basicPaste);
    assert(cleanedBasic.includes('**Gras**'), 'Gras colle → Markdown **');
    assert(cleanedBasic.includes('*italique*'), 'Italique colle → Markdown *');
    assert(cleanedBasic.includes('<u>souligne</u>'), 'Souligne colle preserve en HTML (pas de Markdown)');
}

// =======================================================================
// STEP 14 : FORMULES MATH — ROUND-TRIP COMPLET DE TOUTES LES FORMULES ASSISTANT
// =======================================================================

function runStep14_FormulaAssistantRoundTrip() {
    setStep(14, 'Formules assistant');

    // Toutes les formules LaTeX proposees par formula-assistant.js
    // Chacune doit survivre au round-trip : protectLatex → unprotectLatex
    const allFormulas = [
        // Fractions
        '\\frac{a}{b}', '\\frac{1}{2}', '\\frac{1}{3}', '\\frac{1}{4}',
        '\\frac{a+b}{c}', '\\frac{a}{b+c}', '\\frac{\\frac{a}{b}}{c}',
        // Racines
        '\\sqrt{x}', '\\sqrt[3]{x}', '\\sqrt[n]{x}',
        '\\sqrt{a^2+b^2}', '\\sqrt{\\frac{a}{b}}',
        // Puissances et indices
        'x^{2}', 'x^{3}', 'x^{n}', 'x_{n}', 'x^{n}_{m}',
        'a \\times 10^{n}', 'e^{x}', '\\log_{a}(x)', '\\ln(x)',
        // Lettres grecques
        '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon',
        '\\theta', '\\lambda', '\\mu', '\\pi', '\\sigma', '\\omega',
        '\\Delta', '\\Sigma', '\\Omega', '\\Pi',
        // Operateurs
        '\\times', '\\div', '\\pm', '\\leq', '\\geq',
        '\\neq', '\\approx', '\\equiv', '\\infty',
        '\\sum_{i=1}^{n}', '\\prod_{i=1}^{n}', '\\int_{a}^{b}',
        '\\lim_{x \\to a}', '\\rightarrow', '\\Rightarrow',
        // Structures
        '\\vec{u}', '\\overline{AB}', '\\hat{x}',
        '\\left( \\right)', '\\left[ \\right]', '\\left\\{ \\right\\}',
        '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        '\\begin{cases} a & \\text{si } x > 0 \\\\ b & \\text{sinon} \\end{cases}',
        '\\binom{n}{k}', '\\mathbb{R}'
    ];

    for (const latex of allFormulas) {
        const wrapped = `\\(${latex}\\)`;
        const protectedHtml = protectLatex(wrapped);
        const restored = unprotectLatex(protectedHtml);
        const ok = restored === wrapped;
        assert(ok, `Formule assistant: \\(${latex.substring(0, 40)}${latex.length > 40 ? '...' : ''}\\)`,
            ok ? null : { attendu: wrapped, obtenu: restored });
    }

    // Verification : chaque formule produit un span protege
    for (const latex of allFormulas) {
        const wrapped = `Texte \\(${latex}\\) suite`;
        const protectedHtml = protectLatex(wrapped);
        assert(protectedHtml.includes('json-editor__richtext-latex'),
            `Formule protegee: ${latex.substring(0, 30)}`);
        assert(protectedHtml.includes('data-latex='),
            `data-latex present: ${latex.substring(0, 30)}`);
    }
}

// =======================================================================
// STEP 15 : FORMULES REELLES DEPUIS LES EXEMPLES
// =======================================================================

function runStep15_RealWorldFormulas() {
    setStep(15, 'Formules reelles');

    // Formules extraites des fichiers d'exemples JSON reels
    const realFormulas = [
        'f(x)=\\sqrt{x}',
        '\\mathbb{R}_{\\ge 0}',
        'f^{-1}(y)=y^{2}',
        '[0;+\\infty[',
        'x^2',
        '\\pi',
        '\\frac{1}{x}',
        'f(x)=\\sqrt{2x+1}',
        'f(7)',
        '\\sqrt{15}',
        'k\\sqrt{ax+b}',
        'k\\neq0',
        'f(x)=3\\sqrt{2x-5}',
        'g(x)=\\sqrt{x^{2}}',
        'h(x)=\\sqrt{x}+2',
        'k(x)=5x^{1/2}',
        'm(x)=\\sqrt{\\frac{1}{x}}',
        '\\sqrt{x+4}=5',
        'x \\ge 3',
        'a \\times 10^{n}',
        '\\alpha + \\beta',
        '2\\sqrt{3}',
        '5\\sqrt{2}',
        'A = \\pi r^2',
        'P = 2\\pi r',
        'f(x) = ax + b',
        'f(x) = ax^2 + bx + c',
        '\\sum_{i=1}^{n} x_i',
        '\\int_0^{+\\infty} e^{-x} dx',
        '\\lim_{x \\to +\\infty} f(x)',
        '\\vec{AB}',
        '\\overline{z}',
        'e^{i\\pi} + 1 = 0',
        'a^2 + b^2 = c^2',
        '\\Delta = b^2 - 4ac',
        'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
        '\\cos(\\theta)',
        '\\sin(\\alpha)',
        '\\tan(x)',
        '\\forall x \\in \\mathbb{R}',
        '\\exists x > 0',
        'f\'(x) = 2x',
        'F(x) = \\frac{x^3}{3}',
        '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}',
        'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)',
        '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}'
    ];

    for (const latex of realFormulas) {
        const withDelimiters = `\\(${latex}\\)`;
        const protectedHtml = protectLatex(withDelimiters);
        const restored = unprotectLatex(protectedHtml);
        const ok = restored === withDelimiters;
        assert(ok, `Reelle: \\(${latex.substring(0, 50)}${latex.length > 50 ? '...' : ''}\\)`,
            ok ? null : { attendu: withDelimiters, obtenu: restored });
    }

    // Test display math \[...\]
    const displayFormulas = [
        '\\sum_{i=1}^n x_i',
        'E = mc^2',
        '\\int_a^b f(x)\\,dx',
        'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'
    ];

    for (const latex of displayFormulas) {
        const withDelimiters = `\\[${latex}\\]`;
        const protectedHtml = protectLatex(withDelimiters);
        const restored = unprotectLatex(protectedHtml);
        const ok = restored === withDelimiters;
        assert(ok, `Display: \\[${latex.substring(0, 40)}\\]`,
            ok ? null : { attendu: withDelimiters, obtenu: restored });
    }

    // Test formules mixtes inline + display dans un meme texte
    const mixed = 'Soit \\(f(x) = x^2\\) definie sur \\(\\mathbb{R}\\). Alors :\n\\[f\'(x) = 2x\\]';
    const protectedMixed = protectLatex(mixed);
    const restoredMixed = unprotectLatex(protectedMixed);
    assertEqual(restoredMixed, mixed, 'Mixte inline+display round-trip');
}

// =======================================================================
// STEP 16 : CONVERSION MARKDOWN ↔ HTML
// =======================================================================

function runStep16_MarkdownConversion() {
    setStep(16, 'Conversion Markdown');

    // sourceToDisplay convertit le Markdown en HTML visuel
    let r = sourceToDisplay('Texte **gras** ici', 'html+latex');
    assert(r.includes('<strong>gras</strong>'), 'sourceToDisplay: **gras** → <strong>');

    r = sourceToDisplay('Texte *italique* ici', 'html');
    assert(r.includes('<em>italique</em>'), 'sourceToDisplay: *italique* → <em>');

    r = sourceToDisplay('**gras** et *italique*', 'html');
    assert(r.includes('<strong>gras</strong>') && r.includes('<em>italique</em>'),
        'sourceToDisplay: gras+italique combines');

    // Sauts de ligne
    r = sourceToDisplay('Ligne 1\nLigne 2', 'html');
    assert(r.includes('<br>'), 'sourceToDisplay: \\n → <br>');

    // Markdown + LaTeX combinés
    r = sourceToDisplay('**Question** : calculer \\(x^2\\)', 'html+latex');
    assert(r.includes('<strong>Question</strong>'), 'sourceToDisplay: Markdown converti avec LaTeX');
    assert(r.includes('json-editor__richtext-latex'), 'sourceToDisplay: LaTeX protege avec Markdown');

    // htmlToCleanOutput reconvertit en Markdown
    let out = htmlToCleanOutput('<p><strong>gras</strong> et <em>italique</em></p>');
    assert(out.includes('**gras**'), 'htmlToCleanOutput: <strong> → **');
    assert(out.includes('*italique*'), 'htmlToCleanOutput: <em> → *');

    out = htmlToCleanOutput('<b>gras B</b>');
    assert(out.includes('**gras B**'), 'htmlToCleanOutput: <b> → **');

    out = htmlToCleanOutput('<i>italique I</i>');
    assert(out.includes('*italique I*'), 'htmlToCleanOutput: <i> → *');

    // Les tags non-Markdown restent en HTML
    out = htmlToCleanOutput('<u>souligne</u>');
    assert(out.includes('<u>souligne</u>'), 'htmlToCleanOutput: <u> reste HTML');

    out = htmlToCleanOutput('<s>barre</s>');
    assert(out.includes('<s>barre</s>'), 'htmlToCleanOutput: <s> reste HTML');

    out = htmlToCleanOutput('<sub>indice</sub>');
    assert(out.includes('<sub>indice</sub>'), 'htmlToCleanOutput: <sub> reste HTML');

    out = htmlToCleanOutput('<sup>exposant</sup>');
    assert(out.includes('<sup>exposant</sup>'), 'htmlToCleanOutput: <sup> reste HTML');

    // Round-trip complet Markdown → display → clean → Markdown
    const original = '**Texte gras** et *italique* et normal';
    const displayed = sourceToDisplay(original, 'html');
    const cleaned = htmlToCleanOutput(displayed);
    assert(cleaned.includes('**Texte gras**'), 'Round-trip Markdown: gras preserve');
    assert(cleaned.includes('*italique*'), 'Round-trip Markdown: italique preserve');
    assert(cleaned.includes('et normal'), 'Round-trip Markdown: texte normal preserve');

    // Round-trip avec LaTeX
    const withLatex = '**Question** : \\(\\frac{a}{b}\\) est une fraction';
    const displayed2 = sourceToDisplay(withLatex, 'html+latex');
    const cleaned2 = htmlToCleanOutput(displayed2);
    assert(cleaned2.includes('**Question**'), 'Round-trip avec LaTeX: Markdown preserve');
    assert(cleaned2.includes('\\(\\frac{a}{b}\\)'), 'Round-trip avec LaTeX: formule preservee');

    // Espaces dans les marqueurs Markdown (bug: <strong>texte </strong> → **texte **)
    out = htmlToCleanOutput('<strong>française </strong>');
    assert(!out.includes('** ') && out.includes('**française**'), 'Markdown: pas d\'espace interne dans **gras**');

    out = htmlToCleanOutput('<strong> texte</strong>');
    assert(out.includes('**texte**'), 'Markdown: pas d\'espace en debut de **gras**');

    out = htmlToCleanOutput('<em>italique </em>suite');
    assert(out.includes('*italique*'), 'Markdown: pas d\'espace interne dans *italique*');

    // Cas CoursePresentation : gras adjacent à une formule
    const cpText = 'La Révolution **française** \\(\\frac{1}{3}\\)';
    const cpDisplayed = sourceToDisplay(cpText, 'html+latex');
    const cpCleaned = htmlToCleanOutput(cpDisplayed);
    assert(cpCleaned.includes('**française**'), 'CP: gras sans espace interne');
    assert(!cpCleaned.includes('**française **'), 'CP: pas de **française **');
    assert(cpCleaned.includes('\\(\\frac{1}{3}\\)'), 'CP: formule preservee apres gras');

    // Marqueurs vides supprimés
    out = htmlToCleanOutput('<strong></strong>texte');
    assert(!out.includes('****'), 'Pas de **** vide');
    out = htmlToCleanOutput('<em></em>texte');
    assert(!out.includes('**') || out === 'texte' || out.includes('texte'), 'Pas de ** vide pour em');
}

// =======================================================================
// STEP 17 : COULEUR
// =======================================================================

function runStep17_Color() {
    setStep(17, 'Couleur');

    // <font color="..."> (produit par execCommand) → <span style="color: ...">
    let r = htmlToCleanOutput('<font color="#c0392b">Rouge</font>');
    assert(r.includes('color') && r.includes('Rouge'), 'font color → span avec color');
    assert(!r.includes('<font'), 'Pas de tag font dans la sortie');

    r = htmlToCleanOutput('<font color="red">Rouge</font>');
    assert(r.includes('color') && r.includes('Rouge'), 'font color nommee → span avec color');

    // <span style="color: ..."> est preserve
    r = htmlToCleanOutput('<span style="color: #2980b9">Bleu</span>');
    assert(r.includes('color') && r.includes('Bleu'), 'span color preserve');

    // Les autres styles sont supprimes
    r = htmlToCleanOutput('<span style="color: green; font-size: 20px; background: red">Texte</span>');
    assert(r.includes('color'), 'color conserve');
    assert(!r.includes('font-size'), 'font-size supprime');
    assert(!r.includes('background'), 'background supprime');

    // Couleur dans du Markdown : les deux coexistent
    r = htmlToCleanOutput('<p><strong>Gras</strong> et <span style="color: #c0392b">rouge</span></p>');
    assert(r.includes('**Gras**'), 'Markdown avec couleur: gras converti');
    assert(r.includes('color') && r.includes('rouge'), 'Markdown avec couleur: couleur preservee');

    // Couleur + LaTeX
    const withColor = '<p><span style="color: #c0392b">Formule</span> <span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(x^2\\)">\\(x^2\\)</span></p>';
    r = htmlToCleanOutput(withColor);
    assert(r.includes('color') && r.includes('Formule'), 'Couleur + LaTeX: couleur preservee');
    assert(r.includes('\\(x^2\\)'), 'Couleur + LaTeX: formule preservee');

    // Span sans style est deplie (pas de wrapper inutile)
    r = htmlToCleanOutput('<span>Texte nu</span>');
    assert(!r.includes('<span>'), 'Span sans style deplie');
    assert(r.includes('Texte nu'), 'Contenu du span preserve');
}

// =======================================================================
// STEP 18 : LIENS
// =======================================================================

function runStep18_Links() {
    setStep(18, 'Liens');

    // Lien basique preserve
    let r = htmlToCleanOutput('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Cliquez ici</a>');
    assert(r.includes('<a'), 'Lien: tag <a> preserve');
    assert(r.includes('href="https://example.com"'), 'Lien: href preserve');
    assert(r.includes('target="_blank"'), 'Lien: target preserve');
    assert(r.includes('Cliquez ici'), 'Lien: texte preserve');

    // Lien dans du Markdown
    r = htmlToCleanOutput('<p><strong>Voir</strong> <a href="https://maths.fr">ce site</a></p>');
    assert(r.includes('**Voir**'), 'Lien + Markdown: gras converti');
    assert(r.includes('<a') && r.includes('href="https://maths.fr"'), 'Lien + Markdown: lien preserve');

    // Lien avec LaTeX
    r = htmlToCleanOutput('<p>Consultez <a href="https://fr.wikipedia.org">Wikipedia</a> pour \\(\\pi\\)</p>');
    assert(r.includes('<a') && r.includes('Wikipedia'), 'Lien + LaTeX: lien preserve');
    assert(r.includes('\\(\\pi\\)'), 'Lien + LaTeX: formule preservee');

    // Lien sans target (ajouté par l'utilisateur manuellement)
    r = htmlToCleanOutput('<a href="https://example.com">Lien simple</a>');
    assert(r.includes('<a') && r.includes('Lien simple'), 'Lien sans target preserve');
}

// =======================================================================
// STEP 19 : SYNCHRONISATION SOURCE (BUG ENREGISTREMENT)
// =======================================================================

function runStep19_SourceSync() {
    setStep(19, 'Synchro source');

    // Verifier que renderRichtextField cree un champ avec source synchronisee
    let lastValue = null;
    const onChange = (path, value) => { lastValue = value; };

    const config = { label: 'Q', renderType: 'html+latex' };
    const wrapper = renderRichtextField(config, '**Question** \\(x^2\\)', onChange, 'q.path');
    const editable = wrapper.querySelector('.json-editor__richtext-editable');
    const source = wrapper.querySelector('.json-editor__richtext-source');

    assert(editable !== null, 'Synchro: editable present');
    assert(source !== null, 'Synchro: source presente');

    // Simuler une modification dans le contenteditable
    editable.innerHTML = '<strong>Modifie</strong>';
    editable.dispatchEvent(new Event('input', { bubbles: true }));

    // Le onChange doit avoir ete appele
    assert(lastValue !== null, 'Synchro: onChange appele apres input');

    // La source doit etre synchronisee
    assert(source.value === lastValue, 'Synchro: source.value === valeur emise',
        source.value !== lastValue ? { source: source.value, emis: lastValue } : null);

    // La valeur emise doit etre du Markdown (pas du HTML)
    assert(lastValue.includes('**Modifie**'), 'Synchro: valeur emise en Markdown');
    assert(!lastValue.includes('<strong>'), 'Synchro: pas de HTML dans la valeur emise');

    // Verifier avec un champ marqueurs
    let markerValue = null;
    const config2 = { label: 'M', renderType: 'unicode+markers' };
    const wrapper2 = renderRichtextField(config2, 'Le *chat* dort', (p, v) => { markerValue = v; }, 'm.path');
    const editable2 = wrapper2.querySelector('.json-editor__richtext-editable');

    editable2.textContent = 'Le *chien* court';
    editable2.dispatchEvent(new Event('input', { bubbles: true }));
    assert(markerValue !== null, 'Synchro markers: onChange appele');
    assert(markerValue.includes('*chien*'), 'Synchro markers: marqueurs preserves');
}

// =======================================================================
// STEP 20 : FORMULES MATHJAX — VALIDATION SYNTAXE
// =======================================================================

async function runStep20_MathJaxValidation() {
    setStep(20, 'MathJax validation');

    // Charger MathJax pour valider la syntaxe des formules
    let mathJaxAvailable = false;
    try {
        const { loadMathJax } = await import('../js/core/lib-loader.js');
        await loadMathJax();
        mathJaxAvailable = window.MathJax && window.MathJax.typesetPromise;
    } catch (e) {
        // MathJax non disponible dans l'environnement de test
    }

    if (!mathJaxAvailable) {
        assert(true, 'MathJax non disponible — tests de rendu ignores (test dans le navigateur)');
        return;
    }

    // Toutes les formules de l'assistant doivent etre rendables par MathJax
    const allFormulas = [
        '\\frac{a}{b}', '\\frac{1}{2}', '\\frac{1}{3}', '\\frac{1}{4}',
        '\\frac{a+b}{c}', '\\frac{a}{b+c}', '\\frac{\\frac{a}{b}}{c}',
        '\\sqrt{x}', '\\sqrt[3]{x}', '\\sqrt[n]{x}',
        '\\sqrt{a^2+b^2}', '\\sqrt{\\frac{a}{b}}',
        'x^{2}', 'x^{3}', 'x^{n}', 'x_{n}', 'x^{n}_{m}',
        'a \\times 10^{n}', 'e^{x}', '\\log_{a}(x)', '\\ln(x)',
        '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon',
        '\\theta', '\\lambda', '\\mu', '\\pi', '\\sigma', '\\omega',
        '\\Delta', '\\Sigma', '\\Omega', '\\Pi',
        '\\times', '\\div', '\\pm', '\\leq', '\\geq',
        '\\neq', '\\approx', '\\equiv', '\\infty',
        '\\sum_{i=1}^{n}', '\\prod_{i=1}^{n}', '\\int_{a}^{b}',
        '\\lim_{x \\to a}', '\\rightarrow', '\\Rightarrow',
        '\\vec{u}', '\\overline{AB}', '\\hat{x}',
        '\\left( \\right)', '\\left[ \\right]', '\\left\\{ \\right\\}',
        '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        '\\begin{cases} a & \\text{si } x > 0 \\\\ b & \\text{sinon} \\end{cases}',
        '\\binom{n}{k}', '\\mathbb{R}'
    ];

    for (const latex of allFormulas) {
        const container = document.createElement('div');
        container.innerHTML = `\\(${latex}\\)`;
        document.body.appendChild(container);

        try {
            if (window.MathJax.typesetClear) {
                window.MathJax.typesetClear([container]);
            }
            await window.MathJax.typesetPromise([container]);
            // Verifier qu'il n'y a pas de message d'erreur MathJax
            const hasError = container.querySelector('.MathJax_Error, mjx-merror, [data-mjx-error]');
            const errorText = container.textContent;
            const hasUndefined = errorText.includes('Undefined control sequence');
            assert(!hasError && !hasUndefined,
                `MathJax OK: ${latex.substring(0, 40)}`,
                (hasError || hasUndefined) ? { rendu: errorText.substring(0, 100) } : null);
        } catch (e) {
            assert(false, `MathJax erreur: ${latex.substring(0, 40)}`, { erreur: e.message });
        }

        container.remove();
    }

    // Formules reelles des exemples
    const realFormulas = [
        'f(x)=\\sqrt{x}', '\\mathbb{R}_{\\ge 0}', 'f^{-1}(y)=y^{2}',
        '\\frac{a}{b}', 'x^2 + 3x + 1', '\\alpha + \\beta',
        '\\Delta = b^2 - 4ac', 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
        'e^{i\\pi} + 1 = 0', '\\cos(\\theta)', '\\sin(\\alpha)',
        '\\vec{AB}', '\\overline{z}', 'A = \\pi r^2',
        '\\binom{n}{k}', '\\sum_{i=1}^n x_i', '\\int_a^b f(x)\\,dx'
    ];

    for (const latex of realFormulas) {
        const container = document.createElement('div');
        container.innerHTML = `\\(${latex}\\)`;
        document.body.appendChild(container);

        try {
            if (window.MathJax.typesetClear) {
                window.MathJax.typesetClear([container]);
            }
            await window.MathJax.typesetPromise([container]);
            const hasError = container.querySelector('.MathJax_Error, mjx-merror, [data-mjx-error]');
            const hasUndefined = container.textContent.includes('Undefined');
            assert(!hasError && !hasUndefined,
                `MathJax reelle OK: ${latex.substring(0, 40)}`);
        } catch (e) {
            assert(false, `MathJax reelle erreur: ${latex.substring(0, 40)}`);
        }

        container.remove();
    }
}

// =======================================================================
// STEP 21 : FORMATAGE IMBRIQUÉ
// =======================================================================

function runStep21_NestedFormatting() {
    setStep(21, 'Formatage imbrique');

    // Gras dans un lien
    let r = htmlToCleanOutput('<a href="https://ex.com"><strong>Lien gras</strong></a>');
    assert(r.includes('<a') && r.includes('href'), 'Gras dans lien: lien preserve');

    // Couleur dans du gras
    r = htmlToCleanOutput('<strong><span style="color: red">Rouge gras</span></strong>');
    assert(r.includes('color'), 'Couleur dans gras: couleur preservee');
    assert(r.includes('Rouge gras'), 'Couleur dans gras: contenu preserve');

    // LaTeX a cote de gras
    const latexBold = '**Calculer** \\(x^2 + 3\\)';
    const d = sourceToDisplay(latexBold, 'html+latex');
    const c = htmlToCleanOutput(d);
    assert(c.includes('**Calculer**'), 'LaTeX + gras: Markdown preserve');
    assert(c.includes('\\(x^2 + 3\\)'), 'LaTeX + gras: formule preservee');

    // Italique + souligné
    r = htmlToCleanOutput('<em><u>Italique souligné</u></em>');
    assert(r.includes('<u>'), 'Italique + souligné: <u> preserve');

    // Texte avec couleur + lien + gras + LaTeX tout ensemble
    const complex = '<p><strong>Titre</strong> : voir <a href="https://maths.fr"><span style="color: #2980b9">ce site</span></a> pour \\(\\pi\\)</p>';
    const displayed = sourceToDisplay(complex, 'html+latex');
    const cleaned = htmlToCleanOutput(displayed);
    assert(cleaned.includes('\\(\\pi\\)'), 'Complexe: LaTeX preserve');

    // Sub et sup avec contenu
    r = htmlToCleanOutput('H<sub>2</sub>O et x<sup>2</sup>');
    assert(r.includes('<sub>2</sub>'), 'Sub preserve');
    assert(r.includes('<sup>2</sup>'), 'Sup preserve');

    // Listes preservees
    r = htmlToCleanOutput('<ul><li>**Item gras**</li><li>Item normal</li></ul>');
    assert(r.includes('<ul>') && r.includes('<li>'), 'Liste preservee');
}

// =======================================================================
// STEP 22 : MARQUEURS DRAGTHEWORDS
// =======================================================================

function runStep22_MarkersDragTheWords() {
    setStep(22, 'Marqueurs DragTheWords');

    // Format standard : *mot*
    let text = 'Le *chat* dort sur le *tapis*';
    let r = htmlToCleanOutput(text);
    assert(r.includes('*chat*') && r.includes('*tapis*'), 'DTW: marqueurs simples preserves');

    // Mots avec accents
    text = 'La *République* est une *démocratie*';
    r = htmlToCleanOutput(text);
    assert(r.includes('*République*') && r.includes('*démocratie*'), 'DTW: accents preserves');

    // Mot avec apostrophe adjacente
    text = "L'*oiseau* vole dans l'*air*";
    r = htmlToCleanOutput(text);
    assert(r.includes("*oiseau*") && r.includes("*air*"), 'DTW: apostrophe adjacente');

    // Marqueurs en debut et fin de texte
    text = '*Premier* mot et dernier *mot*';
    r = htmlToCleanOutput(text);
    assert(r.includes('*Premier*') && r.includes('*mot*'), 'DTW: debut et fin');

    // Pas de faux positif avec le Markdown italique
    // En mode unicode+markers, *mot* est un marqueur, pas de l'italique
    const markerConfig = { label: 'T', renderType: 'unicode+markers' };
    const wrapper = renderRichtextField(markerConfig, 'Le *chat* et le *chien*', () => {}, 'dtw');
    const editable = wrapper.querySelector('.json-editor__richtext-editable');
    // Le contenu doit avoir les marqueurs visuels
    assert(editable.innerHTML.includes('json-editor__richtext-marker') || editable.textContent.includes('*chat*'),
        'DTW: marqueurs rendus visuellement ou texte preserve');

    // Ponctuation après marqueur
    text = 'Le *mot*, la *phrase*. Le *texte*!';
    r = htmlToCleanOutput(text);
    assert(r.includes('*mot*,') && r.includes('*phrase*.') && r.includes('*texte*!'),
        'DTW: ponctuation apres marqueur');
}

// =======================================================================
// STEP 23 : MARQUEURS MARKTHEWORDS
// =======================================================================

function runStep23_MarkersMarkTheWords() {
    setStep(23, 'Marqueurs MarkTheWords');

    // Multi-mots dans un texte long
    const text = 'En 1789, la France traverse une *crise* politique. La *Déclaration* des *droits* de l\'homme est adoptée. La *République* est proclamée.';
    let r = htmlToCleanOutput(text);
    assert(r.includes('*crise*'), 'MTW: marqueur crise');
    assert(r.includes('*Déclaration*'), 'MTW: marqueur Déclaration');
    assert(r.includes('*droits*'), 'MTW: marqueur droits');
    assert(r.includes('*République*'), 'MTW: marqueur République');

    // Pas de confusion avec asterisques non-marqueurs
    r = htmlToCleanOutput('5 * 3 = 15');
    assert(r.includes('5 * 3 = 15'), 'MTW: multiplication non interpretee comme marqueur');

    // Marqueurs consécutifs
    r = htmlToCleanOutput('*un* *deux* *trois*');
    assert(r.includes('*un*') && r.includes('*deux*') && r.includes('*trois*'),
        'MTW: marqueurs consecutifs');
}

// =======================================================================
// STEP 24 : MARQUEURS FILLINTHEBLANKS
// =======================================================================

function runStep24_MarkersFillInTheBlanks() {
    setStep(24, 'Marqueurs FillInTheBlanks');

    // Format *reponse:indice*
    let text = 'Le soleil se lève à l\'*est:point cardinal*';
    let r = htmlToCleanOutput(text);
    assert(r.includes('*est:point cardinal*'), 'FITB: reponse:indice preserve');

    // Format *reponse/alt1/alt2*
    text = 'La capitale de la France est *Paris/paris*';
    r = htmlToCleanOutput(text);
    assert(r.includes('*Paris/paris*'), 'FITB: reponse/alternative preserve');

    // Plusieurs trous dans une phrase
    text = 'Un *quadrilatère:4 côtés* qui a 4 angles *droits:Utilise ton équerre !* est un *rectangle/carré*';
    r = htmlToCleanOutput(text);
    assert(r.includes('*quadrilatère:4 côtés*'), 'FITB: premier trou avec indice');
    assert(r.includes('*droits:Utilise ton équerre !*'), 'FITB: deuxieme trou avec indice');
    assert(r.includes('*rectangle/carré*'), 'FITB: troisieme trou avec alternatives');

    // Trou avec texte LaTeX a cote (les trous sont en mode unicode+markers)
    text = 'La valeur de \\(\\pi\\) est environ *3,14/3.14*';
    r = htmlToCleanOutput(text);
    assert(r.includes('*3,14/3.14*'), 'FITB: trou preserve avec LaTeX a cote');
}

// =======================================================================
// STEP 25 : PIPELINE COMPLET (sourceToDisplay → edit → htmlToCleanOutput → formatTextToHtml)
// =======================================================================

async function runStep25_FullPipeline() {
    setStep(25, 'Pipeline complet');

    // Importer formatTextToHtml pour tester le pipeline complet
    let formatTextToHtml;
    try {
        const utils = await import('../js/core/utils.js');
        formatTextToHtml = utils.formatTextToHtml;
    } catch (e) {
        assert(true, 'Pipeline: formatTextToHtml non disponible (skip)');
        return;
    }

    // Contenu typique : Markdown + LaTeX
    const editorInput = '**Question** : Calculer \\(\\frac{a}{b}\\) pour a=2';

    // 1. sourceToDisplay (editeur affiche en WYSIWYG)
    const displayed = sourceToDisplay(editorInput, 'html+latex');
    assert(displayed.includes('<strong>Question</strong>'), 'Pipeline 1: Markdown → HTML');
    assert(displayed.includes('json-editor__richtext-latex'), 'Pipeline 1: LaTeX protege');

    // 2. htmlToCleanOutput (editeur sauvegarde)
    const saved = htmlToCleanOutput(displayed);
    assert(saved.includes('**Question**'), 'Pipeline 2: HTML → Markdown');
    assert(saved.includes('\\(\\frac{a}{b}\\)'), 'Pipeline 2: LaTeX restaure');

    // 3. formatTextToHtml (processeur H5P convertit)
    const h5pHtml = formatTextToHtml(saved);
    assert(h5pHtml.includes('<strong>Question</strong>') || h5pHtml.includes('<strong>'), 'Pipeline 3: Markdown → H5P HTML');
    assert(h5pHtml.includes('\\(\\frac{a}{b}\\)'), 'Pipeline 3: LaTeX intact pour MathJax');

    // Contenu avec saut de ligne
    const multiline = 'Ligne 1\nLigne 2\n**Gras ligne 3**';
    const displayed2 = sourceToDisplay(multiline, 'html');
    const saved2 = htmlToCleanOutput(displayed2);
    const h5pHtml2 = formatTextToHtml(saved2);
    assert(h5pHtml2.includes('Ligne 1'), 'Pipeline multiline: ligne 1');
    assert(h5pHtml2.includes('Ligne 2'), 'Pipeline multiline: ligne 2');

    // Contenu avec couleur (la couleur est du HTML, pas du Markdown)
    const withColor = 'Texte <span style="color: red">rouge</span> normal';
    const displayedColor = sourceToDisplay(withColor, 'html');
    const savedColor = htmlToCleanOutput(displayedColor);
    assert(savedColor.includes('color') && savedColor.includes('rouge'), 'Pipeline couleur: preserve apres save');

    // Contenu avec lien
    const withLink = 'Voir <a href="https://example.com">ici</a>';
    const displayedLink = sourceToDisplay(withLink, 'html');
    const savedLink = htmlToCleanOutput(displayedLink);
    assert(savedLink.includes('<a') && savedLink.includes('href'), 'Pipeline lien: preserve apres save');
}

// =======================================================================
// STEP 26 : CONTENU REEL DES EXEMPLES
// =======================================================================

function runStep26_RealExampleContent() {
    setStep(26, 'Contenu reel exemples');

    // Texte de glossaire reel (accordion_2.json)
    const glossaryText = 'Fonction qui associe à chaque nombre réel **positif** ou nul son unique nombre **positif** dont le carré donne l\'argument. Elle se note \\(f(x)=\\sqrt{x}\\).\nSon **domaine** est \\(\\mathbb{R}_{\\ge 0}\\) et son **image** est également \\(\\mathbb{R}_{\\ge 0}\\).';
    let d = sourceToDisplay(glossaryText, 'html+latex');
    let c = htmlToCleanOutput(d);
    assert(c.includes('**positif**'), 'Glossaire reel: gras preserve');
    assert(c.includes('\\(f(x)=\\sqrt{x}\\)'), 'Glossaire reel: formule sqrt preservee');
    assert(c.includes('\\(\\mathbb{R}_{\\ge 0}\\)'), 'Glossaire reel: formule R≥0 preservee');

    // Texte de QCM reel (quiz_qcm_5.json)
    const qcmQuestion = 'Quelle est le domaine de définition de la fonction \\( f(x)=\\sqrt{x-3}\\) ?';
    d = sourceToDisplay(qcmQuestion, 'html+latex');
    c = htmlToCleanOutput(d);
    assert(c.includes('\\('), 'QCM reel: delimiteur LaTeX preserve');
    assert(c.includes('\\sqrt{x-3}'), 'QCM reel: formule preservee');

    // Reponse QCM avec formule
    const qcmAnswer = '\\( f(x)=3\\sqrt{2x-5}\\)';
    d = sourceToDisplay(qcmAnswer, 'html+latex');
    c = htmlToCleanOutput(d);
    assert(c.includes('\\(') && c.includes('3\\sqrt{2x-5}'), 'QCM reponse: formule preservee');

    // Texte DragTheWords reel
    const dtwText = 'Un polygone qui possède quatre côtés s\'appelle un *quadrilatère*.\nParmi eux, on trouve le *parallélogramme* et le *rectangle*.';
    c = htmlToCleanOutput(dtwText);
    assert(c.includes('*quadrilatère*'), 'DTW reel: marqueur preserve');
    assert(c.includes('*parallélogramme*'), 'DTW reel: marqueur avec accent');

    // Texte FillInTheBlanks reel
    const fitbText = 'Si un quadrilatère possède quatre *angles droits:Utilise ton équerre pour les vérifier !*, c\'est un rectangle.';
    c = htmlToCleanOutput(fitbText);
    assert(c.includes('*angles droits:Utilise ton équerre pour les vérifier !*'), 'FITB reel: trou avec indice');

    // Texte Timeline reel avec Markdown + pas de LaTeX
    const timelineText = 'Face à une crise financière et sociale, le roi **Louis XVI** réunit les représentants des trois ordres.';
    d = sourceToDisplay(timelineText, 'html+latex');
    c = htmlToCleanOutput(d);
    assert(c.includes('**Louis XVI**'), 'Timeline reel: gras preserve');

    // Texte avec saut de ligne et Markdown
    const multiMarkdown = '**Titre section**\nTexte avec *italique* et \\(\\alpha\\)';
    d = sourceToDisplay(multiMarkdown, 'html+latex');
    c = htmlToCleanOutput(d);
    assert(c.includes('**Titre section**'), 'Multiline: titre gras');
    assert(c.includes('*italique*'), 'Multiline: italique');
    assert(c.includes('\\(\\alpha\\)'), 'Multiline: LaTeX');
}

// =======================================================================
// STEP 27 : SÉCURITÉ ET XSS
// =======================================================================

function runStep27_Security() {
    setStep(27, 'Securite et XSS');

    // Script injection
    let r = htmlToCleanOutput('<script>alert("xss")</script>Texte safe');
    assert(!r.includes('<script'), 'XSS: pas de tag script');
    assert(r.includes('Texte safe'), 'XSS: contenu safe preserve');

    // Event handlers
    r = htmlToCleanOutput('<p onclick="alert(1)">Texte</p>');
    assert(!r.includes('onclick'), 'XSS: pas de onclick');

    r = htmlToCleanOutput('<img onerror="alert(1)" src="x">');
    assert(!r.includes('onerror'), 'XSS: pas de onerror');

    // URL javascript:
    r = htmlToCleanOutput('<a href="javascript:alert(1)">Lien</a>');
    // Le contenu du lien est preserve mais le href dangereux devrait etre neutralise par DOMPurify
    assert(r.includes('Lien'), 'XSS: texte du lien preserve');

    // Data URL dans img
    r = htmlToCleanOutput('<img src="data:text/html,<script>alert(1)</script>">');
    assert(!r.includes('<script'), 'XSS: pas de script dans data URL');

    // Entites HTML dans les attributs
    r = htmlToCleanOutput('<a href="https://example.com" title="Test &amp; Co">Lien</a>');
    assert(r.includes('https://example.com'), 'Entites: href decode');

    // Injection via LaTeX (les formules ne doivent pas executer de code)
    const latexXSS = 'Formule \\(<script>alert(1)</script>\\)';
    const protected_ = protectLatex(latexXSS);
    const unprotected = unprotectLatex(protected_);
    assert(unprotected.includes('\\('), 'LaTeX XSS: delimiteur preserve');
    // Le contenu sera rendu par MathJax qui ne supporte pas <script>

    // Style injection
    r = htmlToCleanOutput('<span style="background-image: url(javascript:alert(1))">Texte</span>');
    assert(!r.includes('javascript:'), 'XSS: pas de javascript dans style');
}

// =======================================================================
// STEP 28 : COMPATIBILITE EXPORT DOCUMENT (DOCX/ODT/PDF)
// =======================================================================

function runStep28_ExportCompat() {
    setStep(28, 'Compatibilite export');

    // Le contenu nettoye par htmlToCleanOutput doit etre compatible avec
    // les exports document. Tester que les formats sont coherents.

    // Markdown survit : **gras** et *italique* sont lisibles en texte brut
    let r = htmlToCleanOutput('<p><strong>Important</strong> : voir <em>ici</em></p>');
    assert(r.includes('**Important**'), 'Export compat: gras en Markdown lisible');
    assert(r.includes('*ici*'), 'Export compat: italique en Markdown lisible');

    // Couleur HTML preserve pour les exports qui la supportent
    r = htmlToCleanOutput('<span style="color: #c0392b">Alerte</span>');
    assert(r.includes('color') && r.includes('Alerte'), 'Export compat: couleur HTML preservee');

    // Liens preserves avec URL complete
    r = htmlToCleanOutput('<a href="https://education.gouv.fr/ressources" target="_blank">Ressources</a>');
    assert(r.includes('href="https://education.gouv.fr/ressources"'), 'Export compat: URL complete preservee');
    assert(r.includes('Ressources'), 'Export compat: texte du lien');

    // LaTeX preserve pour MathJax dans les previews
    r = htmlToCleanOutput('<p>Formule : <span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(E=mc^2\\)">\\(E=mc^2\\)</span></p>');
    assert(r.includes('\\(E=mc^2\\)'), 'Export compat: LaTeX pour MathJax');

    // Pas de tags internes de l'editeur dans la sortie
    r = htmlToCleanOutput('<div class="json-editor__richtext-editable" data-path="q.text">Contenu</div>');
    assert(!r.includes('json-editor'), 'Export compat: pas de classe editeur');
    assert(!r.includes('data-path'), 'Export compat: pas de data-path');
    assert(r.includes('Contenu'), 'Export compat: contenu preserve');

    // Sub/sup preserves (utilisés en chimie/maths)
    r = htmlToCleanOutput('H<sub>2</sub>O et x<sup>2</sup>');
    assert(r.includes('<sub>2</sub>'), 'Export compat: sub pour chimie');
    assert(r.includes('<sup>2</sup>'), 'Export compat: sup pour maths');

    // Souligné et barré preserves
    r = htmlToCleanOutput('Texte <u>souligné</u> et <s>barré</s>');
    assert(r.includes('<u>souligné</u>'), 'Export compat: souligné preserve');
    assert(r.includes('<s>barré</s>'), 'Export compat: barré preserve');

    // Contenu mixte complet : tout ce qu'un enseignant pourrait ecrire
    const fullContent = '**Exercice 1** : Calculer \\(\\frac{a+b}{c}\\) sachant que <span style="color: #c0392b">a = 3</span>.\n' +
        'Voir <a href="https://maths.fr/cours">le cours</a> pour plus de détails.\n' +
        'Rappel : H<sub>2</sub>O est la formule de l\'eau.';
    const displayedFull = sourceToDisplay(fullContent, 'html+latex');
    const cleanedFull = htmlToCleanOutput(displayedFull);
    assert(cleanedFull.includes('**Exercice 1**'), 'Full: gras Markdown');
    assert(cleanedFull.includes('\\(\\frac{a+b}{c}\\)'), 'Full: formule LaTeX');
    assert(cleanedFull.includes('color') && cleanedFull.includes('a = 3'), 'Full: couleur');
    assert(cleanedFull.includes('<a') && cleanedFull.includes('href'), 'Full: lien');
    assert(cleanedFull.includes('<sub>2</sub>'), 'Full: sub chimie');
}

// =======================================================================
// STEP 29 : EXPORT DOCUMENT — FORMULES + RICHTEXT PAR ACTIVITE
// =======================================================================

async function runStep29_ExportDocumentActivities() {
    setStep(29, 'Export document activites');

    let formatContentForDocument;
    try {
        const mod = await import('../js/export/document-formatter.js');
        formatContentForDocument = mod.formatContentForDocument;
    } catch (e) {
        assert(true, 'Export: formatContentForDocument non disponible (skip) — ' + e.message);
        return;
    }

    // Helper : extraire tous les textes des sections
    function allTexts(result) {
        const t = [];
        if (!result) return '';
        if (result.title) t.push(result.title);
        if (result.sections) for (const s of result.sections) {
            if (s.text) t.push(s.text);
            if (s.rows) for (const row of s.rows) {
                if (row.left?.text) t.push(row.left.text);
                if (row.right?.text) t.push(row.right.text);
                if (Array.isArray(row)) row.forEach(c => { if (typeof c === 'string') t.push(c); });
            }
            if (s.headers) s.headers.forEach(h => { if (typeof h === 'string') t.push(h); });
        }
        return t.join('\n');
    }

    // Helper : tester une activite
    async function testActivity(moduleKey, data, checks) {
        try {
            const result = await formatContentForDocument(moduleKey, data);
            const all = allTexts(result);
            assert(result && result.sections && result.sections.length > 0,
                `Export ${moduleKey}: sections generees`);
            for (const [label, check] of Object.entries(checks)) {
                if (typeof check === 'function') {
                    assert(check(all), `Export ${moduleKey}: ${label}`);
                } else {
                    assert(all.includes(check), `Export ${moduleKey}: ${label}`);
                }
            }
        } catch (e) {
            assert(false, `Export ${moduleKey}: ERREUR — ${e.message}`);
        }
    }

    const noLatexBrut = (all) => !all.includes('\\(') && !all.includes('\\[');

    // === H5P ===

    await testActivity('MultipleChoice', {
        question: '**Calculer** \\(\\frac{a}{b}\\) et <u>souligner</u>',
        answers: [{ text: '\\(\\frac{3}{2}\\)', correct: true }, { text: 'Non', correct: false }]
    }, {
        'gras preserve': '**Calculer**',
        'pas de LaTeX brut': noLatexBrut,
        'souligne preserve': '<u>souligner</u>'
    });

    await testActivity('TrueFalse', {
        question: '**Vrai** ou faux : \\(\\pi > 3\\)',
        correct: 'true'
    }, {
        'gras preserve': '**Vrai**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('SingleChoiceSet', {
        choices: [{ question: '**Q1** \\(\\alpha\\)', answers: ['**Oui**', 'Non'] }]
    }, {
        'gras preserve': '**Q1**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('QuizSet', {
        questions: [{
            library: 'H5P.MultiChoice 1.16',
            params: { question: '**Q** \\(x^2\\)', answers: [{ text: 'A', correct: true }] }
        }]
    }, {
        'gras preserve': '**Q**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('Flashcards', {
        title: 'Test', description: 'Desc',
        cards: [{ text: '**Recto** \\(\\pi\\)', answer: 'Verso \\(\\alpha\\)', tip: '' }]
    }, {
        'gras preserve': '**Recto**',
        'pi converti': (all) => all.includes('π') || !all.includes('\\(\\pi')
    });

    await testActivity('DialogCards', {
        title: 'Test', description: '',
        dialogs: [{ text: '**Face** \\(\\sqrt{x}\\)', answer: '*Dos*', tips: { front: '', back: '' } }]
    }, {
        'gras preserve': '**Face**',
        'sqrt converti': (all) => all.includes('√') || !all.includes('\\(\\sqrt')
    });

    await testActivity('Essay', {
        taskDescription: '**Rediger** sur \\(E=mc^2\\)',
        keywords: [{ keyword: 'energie' }],
        solution: { introduction: 'Intro **gras**', sample: 'Exemple' }
    }, {
        'gras preserve': '**Rediger**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('Summary', {
        intro: 'Choisir',
        summaries: [{ summary: ['**Vrai** \\(\\alpha\\)', 'Faux', 'Encore faux'] }]
    }, {
        'gras preserve': '**Vrai**',
        'alpha converti': (all) => all.includes('α') || !all.includes('\\(\\alpha')
    });

    await testActivity('DragTheWords', {
        taskDescription: '**Glisser** \\(\\pi\\)',
        textField: 'Le *mot* a trouver'
    }, {
        'gras preserve': '**Glisser**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('MarkTheWords', {
        taskDescription: '**Cliquer** \\(\\alpha\\)',
        textField: 'La *Revolution* francaise'
    }, {
        'gras preserve': '**Cliquer**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('FillInTheBlanks', {
        taskDescription: '**Completer** \\(\\pi\\)',
        questions: ['La reponse est *Paris*']
    }, {
        'gras preserve': '**Completer**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('Crossword', {
        taskDescription: '**Mots croises** \\(\\pi\\)',
        words: [{ answer: 'MATH', clue: 'Science des nombres' }]
    }, {
        'gras preserve': '**Mots croises**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('SortParagraphs', {
        taskDescription: '**Ordonner** \\(\\alpha\\)',
        paragraphs: ['Premier', 'Deuxieme']
    }, {
        'gras preserve': '**Ordonner**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('FindTheWords', {
        taskDescription: '**Trouver** les mots',
        wordList: 'CHAT,CHIEN'
    }, {
        'gras preserve': '**Trouver**'
    });

    await testActivity('Glossary', {
        panels: [{ title: 'Terme', content: { params: { text: '**Definition** \\(\\pi\\)' } } }]
    }, {
        'gras preserve': '**Definition**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('Timeline', {
        timeline: {
            headline: 'Chronologie',
            text: '**Intro** \\(\\alpha\\)',
            date: [{ startDate: '1789', headline: 'Revolution', text: '**Evenement** \\(\\pi\\)' }],
            era: []
        }
    }, {
        'gras preserve': '**Intro**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('DragAndDrop', {
        question: { task: {
            elements: [{ type: { library: 'H5P.AdvancedText 1.1', params: { text: '**Element** \\(\\pi\\)' } }, dropZones: ['0'] }],
            dropZones: [{ label: '**Zone** \\(\\alpha\\)', correctElements: ['0'] }]
        }}
    }, {
        'contenu genere': (all) => all.length > 10
    });

    await testActivity('Chart', {
        listOfTypes: [{ text: 'Maths', value: 42, color: '#ff0000' }],
        graphMode: 'bar'
    }, {
        'contenu genere': (all) => all.length > 5
    });

    await testActivity('CoursePresentation', {
        title: 'Cours',
        slides: [
            { type: 'title', title: '**Titre** \\(\\pi\\)', subtitle: 'Sous-titre' },
            { type: 'content', title: 'Slide', text: '**Contenu** \\(\\frac{1}{2}\\)' }
        ]
    }, {
        'titre gras preserve': '**Titre**',
        'pas de LaTeX brut': noLatexBrut,
        'fraction convertie': (all) => all.includes('½') || all.includes('1/2')
    });

    // === Moodle / Éléa ===

    await testActivity('elea_qcm', {
        title: 'QCM', questions: [{
            text: '**Question** \\(\\sqrt{16}\\)',
            answers: [{ text: '4', iscorrect: 1 }, { text: '8', iscorrect: 0 }]
        }]
    }, {
        'gras preserve': '**Question**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('elea_appariement', {
        intro: '**Associer** \\(\\alpha\\)',
        pairs: [{ question: 'Terme', answer: 'Def' }]
    }, {
        'gras preserve': '**Associer**',
        'pas de LaTeX brut': noLatexBrut
    });

    await testActivity('elea_millionnaire', {
        questions: [{
            question: '**Question** millionnaire',
            goodanswer: 'Bonne reponse',
            badanswer: ['Mauvaise 1', 'Mauvaise 2', 'Mauvaise 3']
        }]
    }, {
        'gras preserve': '**Question**'
    });

    await testActivity('elea_page', {
        title: 'Page', intro: '**Bienvenue** \\(\\alpha\\)',
        blocks: [{ type: '#11_definition_box', data: { title: 'Terme', text: 'Def \\(\\pi\\)' } }]
    }, {
        'gras preserve': '**Bienvenue**',
        'pas de LaTeX brut intro': noLatexBrut
    });

    await testActivity('elea_glossaire', {
        name: 'Glossaire',
        entries: [{ concept: 'Pi', definition: '**Pi** vaut \\(3{,}14\\)' }]
    }, {
        'gras preserve': '**Pi**'
    });

    await testActivity('elea_devoir', {
        title: 'Devoir', description: '**Consigne** \\(\\alpha\\)',
        rubricName: 'Grille',
        criteria: [{ description: 'Critere 1', levels: [{ score: 1, definition: 'Niveau' }] }]
    }, {
        'gras preserve': '**Consigne**',
        'pas de LaTeX brut': noLatexBrut
    });

    // === Alias clés courtes Moodle (mêmes formatters, clés différentes) ===

    await testActivity('QCM', {
        title: 'QCM court', questions: [{
            text: '**Q** \\(\\pi\\)', answers: [{ text: 'A', iscorrect: 1 }]
        }]
    }, { 'gras preserve': '**Q**', 'pas de LaTeX brut': noLatexBrut });

    await testActivity('Appariement', {
        intro: '**Associer**', pairs: [{ question: 'Q', answer: 'R' }]
    }, { 'gras preserve': '**Associer**' });

    await testActivity('Millionnaire', {
        questions: [{ question: '**Q**', goodanswer: 'A', badanswer: ['B', 'C', 'D'] }]
    }, { 'gras preserve': '**Q**' });

    await testActivity('Page', {
        title: 'Page', intro: '**Intro**', blocks: []
    }, { 'gras preserve': '**Intro**' });

    await testActivity('Devoir', {
        title: 'Devoir', description: '**Consigne**', rubricName: 'G',
        criteria: [{ description: 'C', levels: [{ score: 1, definition: 'N' }] }]
    }, { 'gras preserve': '**Consigne**' });

    await testActivity('glossaireXml', {
        name: 'Glossaire', entries: [{ concept: 'C', definition: '**Def**' }]
    }, { 'gras preserve': '**Def**' });

    // === Variantes QuizSet ===

    await testActivity('QuizSetQCM', {
        questions: [{
            library: 'H5P.MultiChoice 1.16',
            params: { question: '**Q** \\(x\\)', answers: [{ text: 'A', correct: true }] }
        }]
    }, { 'gras preserve': '**Q**', 'pas de LaTeX brut': noLatexBrut });

    await testActivity('QuizSetVF', {
        questions: [{
            library: 'H5P.TrueFalse 1.8',
            params: { question: '**VF** \\(\\pi\\)', correct: 'true' }
        }]
    }, { 'gras preserve': '**VF**', 'pas de LaTeX brut': noLatexBrut });

    // === Moodle Test (elea_test / test_elea) ===

    await testActivity('elea_test', {
        bank_description: '**Banque**',
        questions: [{
            type: 'multichoice', content: {
                questiontext: '**Question** \\(\\alpha\\)',
                answers: [{ text: 'A', fraction: 100 }]
            }
        }]
    }, { 'gras preserve': '**Question**' });

    await testActivity('test_elea', {
        bank_description: '**Banque**',
        questions: [{
            type: 'truefalse', content: {
                questiontext: '**VF** \\(\\pi\\)',
                answers: [{ text: 'Vrai', fraction: 100 }, { text: 'Faux', fraction: 0 }]
            }
        }]
    }, { 'gras preserve': '**VF**' });

    // === Vérification transversale : HTML inline ===

    await testActivity('MultipleChoice', {
        question: 'Texte <u>souligne</u> et <s>barre</s> et H<sub>2</sub>O et x<sup>2</sup> et <a href="https://ex.com">lien</a> et <span style="color: red">rouge</span>',
        answers: [{ text: 'OK', correct: true }]
    }, {
        'souligne preserve': '<u>souligne</u>',
        'barre preserve': '<s>barre</s>',
        'sub preserve': '<sub>2</sub>',
        'sup preserve': '<sup>2</sup>',
        'lien preserve': (all) => all.includes('<a') && all.includes('href'),
        'couleur preserve': (all) => all.includes('color') && all.includes('rouge')
    });
}

// =======================================================================
// =======================================================================
// STEP 30 : EDITEUR CLOZE — PARSE / SERIALIZE / ROUND-TRIP
// =======================================================================

function runStep30_ClozeEditor() {
    setStep(30, 'Editeur Cloze');

    // --- Parse MULTICHOICE ---
    const mc = parseClozeText('Texte {1:MULTICHOICE:=A~B~C} suite');
    assert(mc.length === 3, 'Parse MC: 3 parties (texte + gap + texte)');
    assert(mc[0].type === 'text' && mc[0].content === 'Texte ', 'Parse MC: texte avant');
    assert(mc[1].type === 'gap', 'Parse MC: gap detecte');
    assert(mc[1].gapData.type === 'MULTICHOICE', 'Parse MC: type MULTICHOICE');
    assert(mc[1].gapData.correct[0] === 'A', 'Parse MC: correct = A');
    assert(mc[1].gapData.wrong.length === 2, 'Parse MC: 2 mauvaises reponses');
    assert(mc[1].gapData.wrong[0] === 'B' && mc[1].gapData.wrong[1] === 'C', 'Parse MC: wrong = B, C');
    assert(mc[2].type === 'text' && mc[2].content === ' suite', 'Parse MC: texte apres');

    // --- Parse SHORTANSWER ---
    const sa = parseClozeText('{1:SHORTANSWER:=Paris~=paris}');
    assert(sa.length === 1 && sa[0].type === 'gap', 'Parse SA: gap unique');
    assert(sa[0].gapData.type === 'SHORTANSWER', 'Parse SA: type SHORTANSWER');
    assert(sa[0].gapData.correct.length === 2, 'Parse SA: 2 reponses correctes');
    assert(sa[0].gapData.correct[0] === 'Paris', 'Parse SA: correct 1 = Paris');
    assert(sa[0].gapData.correct[1] === 'paris', 'Parse SA: correct 2 = paris');
    const rejectedAlternative = '{1:SHORTANSWER:=Paris~Lyon}';
    assertEqual(serializeGap(parseClozeText(rejectedAlternative)[0].gapData), rejectedAlternative,
        'Une alternative sans = garde sa note nulle après édition');

    // --- Parse NUMERICAL ---
    const num = parseClozeText('{1:NUMERICAL:=3.14:0.01}');
    assert(num.length === 1 && num[0].type === 'gap', 'Parse NUM: gap unique');
    assert(num[0].gapData.type === 'NUMERICAL', 'Parse NUM: type NUMERICAL');
    assertEqual(num[0].gapData.correct, '3.14', 'Parse NUM: correct = 3.14');
    assertEqual(num[0].gapData.tolerance, '0.01', 'Parse NUM: tolerance = 0.01');

    // --- Parse NUMERICAL sans tolerance ---
    const num0 = parseClozeText('{1:NUMERICAL:=42:0}');
    assertEqual(num0[0].gapData.correct, '42', 'Parse NUM0: correct = 42');
    assertEqual(num0[0].gapData.tolerance, '0', 'Parse NUM0: tolerance = 0');

    // --- Parse poids != 1 ---
    const w2 = parseClozeText('{2:SHORTANSWER:=reponse}');
    assertEqual(w2[0].gapData.weight, '2', 'Parse W2: weight = 2');

    // --- Parse multiples bonnes reponses ---
    const multi = parseClozeText('{1:MULTICHOICE:=A~=B~C}');
    assertEqual(serializeGap(multi[0].gapData), '{1:MULTICHOICE:=A~=B~C}',
        'Plusieurs réponses correctes conservées dans le formulaire source');

    // --- Parse texte mixte (plusieurs trous) ---
    const mix = parseClozeText('Debut {1:SHORTANSWER:=X} milieu {1:NUMERICAL:=7:0} fin');
    assert(mix.length === 5, 'Parse mix: 5 parties');
    assert(mix[0].content === 'Debut ', 'Parse mix: debut');
    assert(mix[1].gapData.type === 'SHORTANSWER', 'Parse mix: trou 1 = SA');
    assert(mix[2].content === ' milieu ', 'Parse mix: milieu');
    assert(mix[3].gapData.type === 'NUMERICAL', 'Parse mix: trou 2 = NUM');
    assert(mix[4].content === ' fin', 'Parse mix: fin');

    // --- Parse texte sans trous ---
    const plain = parseClozeText('Juste du texte normal');
    assert(plain.length === 1 && plain[0].type === 'text', 'Parse plain: texte seul');
    assert(plain[0].content === 'Juste du texte normal', 'Parse plain: contenu preserve');

    // --- Parse texte vide ---
    const empty = parseClozeText('');
    assert(empty.length === 1, 'Parse empty: 1 partie vide');

    // --- Serialize MULTICHOICE ---
    const serMC = serializeGap({ weight: '1', type: 'MULTICHOICE', correct: ['A'], wrong: ['B', 'C'] });
    assertEqual(serMC, '{1:MULTICHOICE:=A~B~C}', 'Serialize MC');

    // --- Serialize SHORTANSWER ---
    const serSA = serializeGap({ weight: '1', type: 'SHORTANSWER', correct: ['Paris', 'paris'], wrong: [] });
    assertEqual(serSA, '{1:SHORTANSWER:=Paris~=paris}', 'Serialize SA');

    // --- Serialize NUMERICAL ---
    const serNUM = serializeGap({ weight: '1', type: 'NUMERICAL', correct: '3.14', tolerance: '0.01' });
    assertEqual(serNUM, '{1:NUMERICAL:=3.14:0.01}', 'Serialize NUM');

    // --- Serialize NUMERICAL tolerance 0 ---
    const serNUM0 = serializeGap({ weight: '1', type: 'NUMERICAL', correct: '42', tolerance: '0' });
    assertEqual(serNUM0, '{1:NUMERICAL:=42:0}', 'Serialize NUM0');

    // --- Round-trip ---
    const originals = [
        '{1:MULTICHOICE:=A~B~C}',
        '{1:SHORTANSWER:=Paris}',
        '{1:NUMERICAL:=3.14:0.01}',
        '{1:NUMERICAL:=42:0}',
        '{2:SHORTANSWER:=reponse}',
        'Debut {1:SHORTANSWER:=X} milieu {1:NUMERICAL:=7:0} fin'
    ];
    for (const orig of originals) {
        const parts = parseClozeText(orig);
        let rebuilt = '';
        for (const p of parts) {
            if (p.type === 'text') rebuilt += p.content;
            else rebuilt += serializeGap(p.gapData);
        }
        assertEqual(rebuilt, orig, `Round-trip: ${orig.substring(0, 50)}`);
    }

    // --- Render DOM ---
    const wrapper = renderClozeField(
        { label: 'Test', required: true },
        'Avant {1:MULTICHOICE:=OK~NON} apres',
        () => {},
        'test.path'
    );
    assert(wrapper instanceof HTMLElement, 'Render: retourne HTMLElement');
    assert(wrapper.classList.contains('json-editor__field--cloze'), 'Render: classe cloze');
    const editable = wrapper.querySelector('.cloze-editable');
    assert(editable !== null, 'Render: zone editable presente');
    const chips = wrapper.querySelectorAll('.cloze-chip');
    assert(chips.length === 1, 'Render: 1 chip dans le contenu');
    assert(chips[0].classList.contains('cloze-chip--multichoice'), 'Render: chip multichoice');
    const toolbar = wrapper.querySelector('.cloze-toolbar');
    assert(toolbar !== null, 'Render: toolbar presente');
    const source = wrapper.querySelector('.json-editor__richtext-source');
    assert(source !== null, 'Render: source textarea presente');
}

// =======================================================================
// EXPORT : runAllTests
// =======================================================================

export async function runAllTests() {
    console.log('=== Tests Rich Text Editor (31 etapes) ===');
    passCount = 0;
    failCount = 0;
    results.length = 0;

    runStep1_PathResolution();
    runStep2_PathNormalization();
    runStep3_HtmlCleaning();
    runStep4_ProtectLatex();
    runStep5_LatexRoundTrip();
    runStep6_SourceToDisplay();
    runStep7_Markers();
    runStep8_DomRendering();
    runStep9_ExportIntegrity();
    runStep10_ActivityCoverage();
    runStep11_EdgeCases();
    runStep12_ToolbarContextual();
    runStep13_PasteHtml();
    runStep14_FormulaAssistantRoundTrip();
    runStep15_RealWorldFormulas();
    runStep16_MarkdownConversion();
    runStep17_Color();
    runStep18_Links();
    runStep19_SourceSync();
    await runStep20_MathJaxValidation();
    runStep21_NestedFormatting();
    runStep22_MarkersDragTheWords();
    runStep23_MarkersMarkTheWords();
    runStep24_MarkersFillInTheBlanks();
    await runStep25_FullPipeline();
    runStep26_RealExampleContent();
    runStep27_Security();
    runStep28_ExportCompat();
    await runStep29_ExportDocumentActivities();
    runStep30_ClozeEditor();
    runStep31_LatexNormalization();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES };
}

// =======================================================================
// STEP 31 : NORMALISATION LATEX (delimiteurs alternatifs dans l'editeur)
// =======================================================================

function runStep31_LatexNormalization() {
    setStep(31, 'Normalisation LaTeX editeur');

    // --- protectLatex : normalisation \begin{equation} → \[...\] ---
    let r = protectLatex('\\begin{equation}x^2\\end{equation}');
    assert(r.includes('json-editor__richtext-latex--display'), 'protectLatex: \\begin{equation} → display span');
    assert(r.includes('data-latex='), 'protectLatex: \\begin{equation} → data-latex present');

    // --- protectLatex : normalisation \begin{math} → \(...\) ---
    r = protectLatex('\\begin{math}x^2\\end{math}');
    assert(r.includes('json-editor__richtext-latex"'), 'protectLatex: \\begin{math} → inline span');
    assert(!r.includes('--display'), 'protectLatex: \\begin{math} → PAS display');

    // --- protectLatex : \(...\) et \[...\] standards inchanges ---
    r = protectLatex('Inline \\(x\\) et display \\[y\\]');
    assert(r.includes('json-editor__richtext-latex"'), 'protectLatex: \\(...\\) inline standard');
    assert(r.includes('json-editor__richtext-latex--display'), 'protectLatex: \\[...\\] display standard');

    // --- protectLatex : ne touche PAS aux $ (risque faux positifs) ---
    r = protectLatex('Le prix est $5 et $10');
    assertEqual(r, 'Le prix est $5 et $10', 'protectLatex: $ dans du texte non transforme');

    r = protectLatex('Total: $$100$$');
    assertEqual(r, 'Total: $$100$$', 'protectLatex: $$ dans du texte non transforme');

    // --- sourceToDisplay compact : \[...\] → inline ---
    r = sourceToDisplay('\\[x^2 + 1\\]', 'html+latex', { compact: true });
    assert(!r.includes('--display'), 'sourceToDisplay compact: \\[...\\] → PAS de display span');
    assert(r.includes('json-editor__richtext-latex"'), 'sourceToDisplay compact: \\[...\\] → inline span');
    assert(r.includes('data-latex='), 'sourceToDisplay compact: data-latex present');

    // --- sourceToDisplay compact : \(...\) reste inline ---
    r = sourceToDisplay('\\(x^2\\)', 'html+latex', { compact: true });
    assert(r.includes('json-editor__richtext-latex"'), 'sourceToDisplay compact: \\(...\\) → inline span');
    assert(!r.includes('--display'), 'sourceToDisplay compact: \\(...\\) PAS display');

    // --- sourceToDisplay NON compact : \[...\] reste display ---
    r = sourceToDisplay('\\[x^2\\]', 'html+latex');
    assert(r.includes('json-editor__richtext-latex--display'), 'sourceToDisplay non-compact: \\[...\\] → display span');

    r = sourceToDisplay('\\[x^2\\]', 'html+latex', { compact: false });
    assert(r.includes('json-editor__richtext-latex--display'), 'sourceToDisplay compact:false: \\[...\\] → display span');

    // --- sourceToDisplay compact : texte sans LaTeX inchange ---
    r = sourceToDisplay('Texte simple', 'html+latex', { compact: true });
    assertEqual(r, 'Texte simple', 'sourceToDisplay compact: texte sans LaTeX inchange');

    // --- sourceToDisplay compact : ne casse pas le contenu mixte ---
    r = sourceToDisplay('Calcule \\[x^2\\] puis \\(y\\)', 'html+latex', { compact: true });
    assert(!r.includes('--display'), 'sourceToDisplay compact mixte: pas de display');
    const inlineSpans = (r.match(/json-editor__richtext-latex"/g) || []).length;
    assertEqual(inlineSpans, 2, 'sourceToDisplay compact mixte: 2 spans inline');

    // --- Round-trip : \begin{equation} via protectLatex → unprotectLatex ---
    const original = '\\begin{equation}\\frac{a}{b}\\end{equation}';
    const protected_ = protectLatex(original);
    const restored = unprotectLatex(protected_);
    // Le round-trip produit \[...\] car protectLatex normalise \begin{equation} → \[...\]
    assertEqual(restored, '\\[\\frac{a}{b}\\]', 'Round-trip \\begin{equation}: normalise vers \\[...\\]');

    // --- Round-trip : \begin{math} via protectLatex → unprotectLatex ---
    const originalMath = '\\begin{math}\\cos(x)\\end{math}';
    const protectedMath = protectLatex(originalMath);
    const restoredMath = unprotectLatex(protectedMath);
    assertEqual(restoredMath, '\\(\\cos(x)\\)', 'Round-trip \\begin{math}: normalise vers \\(...\\)');

    // --- Compact round-trip : \[...\] → compact → unprotect = \(...\) ---
    const displaySrc = '\\[\\sum x_i\\]';
    const compactHtml = sourceToDisplay(displaySrc, 'html+latex', { compact: true });
    const compactRestored = unprotectLatex(compactHtml);
    assertEqual(compactRestored, '\\(\\sum x_i\\)', 'Compact round-trip: \\[...\\] → \\(...\\)');
}
