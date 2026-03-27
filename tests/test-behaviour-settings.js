/**
 * Tests des reglages avances (behaviour) dans l'editeur
 *
 * Verifie pour chaque type H5P :
 * 1. Generation par defaut (sans behaviour) → valeurs par defaut preservees
 * 2. Generation avec behaviour modifie → valeurs propagees dans le processeur
 * 3. Round-trip editeur : schema → normalize → denormalize → processeur
 * 4. L'editeur expose bien une section "settings" avec les bons champs
 *
 * Usage : ouvrir tests/test-behaviour-settings.html depuis le serveur local.
 */

import {
    detectContentType,
    normalizeDataForEditor,
    denormalizeDataForSave,
    getSchemaForType
} from '../js/editor/content-detector.js';

import { processH5PContent } from '../js/h5p/processors/index.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let currentModule = '';

function assert(condition, message) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, module: currentModule, group: currentModule };
    if (condition) passCount++;
    else { failCount++; console.error('FAIL:', message); }
    results.push(entry);
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

// =======================================================================
// DONNEES DE TEST MINIMALES PAR TYPE
// =======================================================================

const minimalData = {
    MultipleChoice: {
        question: "Question test ?",
        answers: [
            { text: "Bonne reponse", correct: true, tipsAndFeedback: { tip: "", chosenFeedback: "", notChosenFeedback: "" } },
            { text: "Mauvaise reponse", correct: false, tipsAndFeedback: { tip: "", chosenFeedback: "", notChosenFeedback: "" } }
        ],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    TrueFalse: {
        question: "Le ciel est bleu ?",
        correct: "true",
        feedbackOnCorrect: "Bravo",
        feedbackOnWrong: "Non"
    },
    FillInTheBlanks: {
        taskDescription: "Completez les phrases",
        questions: ["La capitale de la France est *Paris*"],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    Flashcards: {
        title: "Test Flashcards",
        description: "Description",
        cards: [{ text: "Recto", answer: "Verso" }]
    },
    Crossword: {
        title: "Test Crossword",
        taskDescription: "Mots croises",
        words: [
            { clue: "Indice 1", answer: "MOT" },
            { clue: "Indice 2", answer: "TEST" }
        ],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    DragTheWords: {
        taskDescription: "Glissez les mots",
        textField: "Le *chat* est sur le *tapis*",
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    MarkTheWords: {
        taskDescription: "Marquez les mots",
        textField: "Le *chat* est *grand*",
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    DragAndDrop: {
        title: "Test DragAndDrop",
        dropZones: [{ label: "Zone A" }, { label: "Zone B" }],
        elements: [
            { text: "Element 1", zoneIndices: [0] },
            { text: "Element 2", zoneIndices: [1] }
        ],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    Essay: {
        taskDescription: "Redigez un texte",
        keywords: [{ keyword: "important", options: { points: 1 } }],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    SortParagraphs: {
        taskDescription: "Ordonnez les paragraphes",
        paragraphs: ["Premier", "Deuxieme", "Troisieme"],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    SingleChoiceSet: {
        choices: [{ question: "Question ?", answers: ["Bonne", "Mauvaise"] }],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    Summary: {
        intro: "Choisissez la bonne affirmation",
        summaries: [{ summary: ["Correct", "Incorrect"], tip: "" }],
        overallFeedback: [{ from: 0, to: 100, feedback: "" }]
    },
    DialogCards: {
        title: "Test Dialog",
        description: "Description",
        dialogs: [{ text: "Recto", answer: "Verso" }]
    },
    FindTheWords: {
        taskDescription: "Trouvez les mots",
        wordList: "CHAT,CHIEN,OISEAU"
    },
    Glossary: [
        { title: "Terme 1", text: "Definition 1" },
        { title: "Terme 2", text: "Definition 2" }
    ],
    Timeline: {
        timeline: {
            headline: "Frise test",
            text: "Description",
            type: "default",
            date: [{ startDate: "2024", headline: "Evenement", text: "Texte" }]
        }
    }
};

// =======================================================================
// DEFINITIONS DES REGLAGES PAR TYPE
// =======================================================================

const behaviourTests = {
    MultipleChoice: {
        defaults: { enableRetry: true, randomAnswers: true, autoCheck: false, singlePoint: false, passPercentage: 50, showScorePoints: true },
        overrides: { enableRetry: false, randomAnswers: false, autoCheck: true, passPercentage: 80 },
        path: 'behaviour'
    },
    TrueFalse: {
        defaults: { enableRetry: true, enableSolutionsButton: true, autoCheck: false, confirmCheckDialog: false },
        overrides: { enableRetry: false, autoCheck: true },
        path: 'behaviour'
    },
    FillInTheBlanks: {
        defaults: { caseSensitive: false, acceptSpellingErrors: false, autoCheck: true, separateLines: false },
        overrides: { caseSensitive: true, acceptSpellingErrors: true, autoCheck: false, separateLines: true },
        path: 'behaviour'
    },
    Flashcards: {
        defaults: { enableRetry: true, caseSensitive: false, randomCards: false },
        overrides: { enableRetry: false, caseSensitive: true, randomCards: true },
        // Flashcards a les champs au niveau racine (pas dans behaviour)
        path: 'root',
        rootFields: { enableRetry: 'enableRetry', caseSensitive: 'caseSensitive', randomCards: 'randomCards' }
    },
    Crossword: {
        defaults: { enableRetry: true, enableSolutionsButton: true, enableInstantFeedback: false, scoreWords: true, applyPenalties: false },
        overrides: { enableInstantFeedback: true, scoreWords: false, applyPenalties: true },
        path: 'behaviour'
    },
    DragTheWords: {
        defaults: { enableRetry: true, enableSolutionsButton: true, instantFeedback: false },
        overrides: { instantFeedback: true, enableRetry: false },
        path: 'behaviour'
    },
    MarkTheWords: {
        defaults: { enableRetry: true, enableSolutionsButton: true, showScorePoints: true },
        overrides: { enableRetry: false, showScorePoints: false },
        path: 'behaviour'
    },
    DragAndDrop: {
        defaults: { enableRetry: true, applyPenalties: true, showScorePoints: true },
        overrides: { applyPenalties: false, showScorePoints: false },
        path: 'behaviour'
    },
    Essay: {
        defaults: { enableRetry: true, minimumLength: 10, maximumLength: 10000, overrideCaseSensitive: 'off', overrideForgiveMistakes: 'on' },
        overrides: { minimumLength: 50, maximumLength: 500, overrideCaseSensitive: 'on' },
        path: 'behaviour'
    },
    SortParagraphs: {
        defaults: { enableRetry: true, enableSolutionsButton: true, scoringMode: 'transitions', applyPenalties: true },
        overrides: { scoringMode: 'positions', applyPenalties: false },
        path: 'behaviour'
    },
    SingleChoiceSet: {
        defaults: { soundEffectsEnabled: true, autoContinue: true, passPercentage: 100 },
        overrides: { soundEffectsEnabled: false, autoContinue: false, passPercentage: 50 },
        path: 'behaviour'
    },
    Summary: {
        defaults: { enableRetry: true, enableSolutionsButton: true, passPercentage: 50 },
        overrides: { enableRetry: false, passPercentage: 75 },
        path: 'behaviour'
    },
    DialogCards: {
        defaults: { enableRetry: true, randomCards: false },
        overrides: { randomCards: true, enableRetry: false },
        path: 'behaviour'
    }
};

// =======================================================================
// TESTS
// =======================================================================

async function runTests() {
    // ---- Test 1 : Chaque type a une section settings dans le schema ----
    currentModule = 'Schema editeur';
    const typesWithSettings = Object.keys(behaviourTests);
    for (const type of typesWithSettings) {
        const schema = getSchemaForType(type);
        assert(schema !== null, `${type} : schema editeur existe`);
        if (schema) {
            const settingsSection = schema.sections.find(s => s.id === 'settings');
            assert(settingsSection !== null && settingsSection !== undefined, `${type} : section "settings" presente dans le schema`);
            if (settingsSection) {
                assert(settingsSection.startCollapsed === true, `${type} : section settings est repliee par defaut`);
            }
        }
    }

    // Glossary et Timeline (schemas speciaux)
    const glossarySchema = getSchemaForType('Glossary');
    assert(glossarySchema !== null, 'Glossary : schema editeur existe');
    if (glossarySchema) {
        const settingsSection = glossarySchema.sections.find(s => s.id === 'settings');
        assert(settingsSection !== null && settingsSection !== undefined, 'Glossary : section settings presente');
        if (settingsSection) {
            assert(settingsSection.fields.hTag !== undefined, 'Glossary : champ hTag present');
        }
    }

    const timelineSchema = getSchemaForType('Timeline');
    assert(timelineSchema !== null, 'Timeline : schema editeur existe');
    if (timelineSchema) {
        const settingsSection = timelineSchema.sections.find(s => s.id === 'settings');
        assert(settingsSection !== null && settingsSection !== undefined, 'Timeline : section settings presente');
        if (settingsSection) {
            assert(settingsSection.fields.height !== undefined, 'Timeline : champ height present');
        }
    }

    // QuizSet
    const quizSetSchema = getSchemaForType('QuizSet');
    assert(quizSetSchema !== null, 'QuizSet : schema editeur existe');
    if (quizSetSchema) {
        const generalSection = quizSetSchema.sections.find(s => s.id === 'general');
        if (generalSection) {
            assert(generalSection.fields.progressType?.type === 'select', 'QuizSet : progressType est un select (pas hidden)');
            assert(generalSection.fields.passPercentage?.type === 'number', 'QuizSet : passPercentage visible');
            assert(generalSection.fields.randomQuestions !== undefined, 'QuizSet : randomQuestions present');
        }
    }

    // ---- Test 2 : Generation par defaut (sans behaviour dans l'input) ----
    currentModule = 'Defaults sans behaviour';
    for (const [type, config] of Object.entries(behaviourTests)) {
        const data = JSON.parse(JSON.stringify(minimalData[type]));
        try {
            const result = await processH5PContent(type, data);
            const processed = result.content || result;

            if (config.path === 'behaviour') {
                assert(processed.behaviour !== undefined, `${type} : behaviour present dans le resultat`);
                if (processed.behaviour) {
                    for (const [key, value] of Object.entries(config.defaults)) {
                        assert(processed.behaviour[key] === value,
                            `${type} : defaut behaviour.${key} = ${JSON.stringify(value)} (recu: ${JSON.stringify(processed.behaviour[key])})`);
                    }
                }
            } else if (config.path === 'root') {
                for (const [schemaKey, rootKey] of Object.entries(config.rootFields)) {
                    assert(processed[rootKey] === config.defaults[schemaKey],
                        `${type} : defaut ${rootKey} = ${JSON.stringify(config.defaults[schemaKey])} (recu: ${JSON.stringify(processed[rootKey])})`);
                }
            }
        } catch (e) {
            assert(false, `${type} : erreur lors de la generation par defaut: ${e.message}`);
        }
    }

    // ---- Test 3 : Generation avec behaviour modifie ----
    currentModule = 'Overrides behaviour';
    for (const [type, config] of Object.entries(behaviourTests)) {
        const data = JSON.parse(JSON.stringify(minimalData[type]));
        // Injecter le behaviour modifie
        if (config.path === 'behaviour') {
            data.behaviour = { ...config.overrides };
        } else if (config.path === 'root') {
            data.behaviour = { ...config.overrides };
        }

        try {
            const result = await processH5PContent(type, data);
            const processed = result.content || result;

            if (config.path === 'behaviour') {
                for (const [key, value] of Object.entries(config.overrides)) {
                    assert(processed.behaviour[key] === value,
                        `${type} : override behaviour.${key} = ${JSON.stringify(value)} (recu: ${JSON.stringify(processed.behaviour[key])})`);
                }
            } else if (config.path === 'root') {
                for (const [schemaKey, rootKey] of Object.entries(config.rootFields)) {
                    if (config.overrides[schemaKey] !== undefined) {
                        assert(processed[rootKey] === config.overrides[schemaKey],
                            `${type} : override ${rootKey} = ${JSON.stringify(config.overrides[schemaKey])} (recu: ${JSON.stringify(processed[rootKey])})`);
                    }
                }
            }
        } catch (e) {
            assert(false, `${type} : erreur lors de la generation avec overrides: ${e.message}`);
        }
    }

    // ---- Test 4 : Round-trip editeur (normalize → denormalize preserves behaviour) ----
    currentModule = 'Round-trip editeur';
    for (const [type, config] of Object.entries(behaviourTests)) {
        const data = JSON.parse(JSON.stringify(minimalData[type]));
        if (config.path === 'behaviour') {
            data.behaviour = { ...config.overrides };
        } else if (config.path === 'root') {
            data.behaviour = { ...config.overrides };
        }

        try {
            // Normalize pour l'editeur
            const normalized = normalizeDataForEditor(JSON.parse(JSON.stringify(data)), type);
            // Denormalize pour la sauvegarde
            const denormalized = denormalizeDataForSave(JSON.parse(JSON.stringify(normalized)), type);

            if (config.path === 'behaviour') {
                assert(denormalized.behaviour !== undefined, `${type} : behaviour survit au round-trip editeur`);
                if (denormalized.behaviour) {
                    for (const [key, value] of Object.entries(config.overrides)) {
                        assert(denormalized.behaviour[key] === value,
                            `${type} : round-trip behaviour.${key} = ${JSON.stringify(value)} (recu: ${JSON.stringify(denormalized.behaviour[key])})`);
                    }
                }
            } else if (config.path === 'root') {
                assert(denormalized.behaviour !== undefined, `${type} : behaviour survit au round-trip editeur`);
            }
        } catch (e) {
            assert(false, `${type} : erreur round-trip editeur: ${e.message}`);
        }
    }

    // ---- Test 5 : DialogCards mode field ----
    currentModule = 'Champs speciaux';
    {
        const data = JSON.parse(JSON.stringify(minimalData.DialogCards));
        data.mode = 'repetition';
        try {
            const result = await processH5PContent('DialogCards', data);
            const processed = result.content || result;
            assert(processed.mode === 'repetition', 'DialogCards : mode "repetition" propage');
        } catch (e) {
            assert(false, `DialogCards mode: ${e.message}`);
        }
    }

    // ---- Test 6 : Crossword theme ----
    {
        const data = JSON.parse(JSON.stringify(minimalData.Crossword));
        data.theme = { backgroundColor: '#ff0000', cellColor: '#00ff00' };
        try {
            const result = await processH5PContent('Crossword', data);
            const processed = result.content || result;
            assert(processed.theme !== undefined, 'Crossword : theme present dans le resultat');
            if (processed.theme) {
                assert(processed.theme.backgroundColor === '#ff0000', 'Crossword : theme.backgroundColor override');
                assert(processed.theme.cellColor === '#00ff00', 'Crossword : theme.cellColor override');
                assert(processed.theme.gridColor === '#000000', 'Crossword : theme.gridColor defaut preserve');
            }
        } catch (e) {
            assert(false, `Crossword theme: ${e.message}`);
        }
    }

    // ---- Test 7 : Timeline height ----
    {
        const data = JSON.parse(JSON.stringify(minimalData.Timeline));
        data.height = 800;
        try {
            const result = await processH5PContent('Timeline', data);
            const processed = result.content || result;
            const height = processed.timeline?.height || processed.height;
            assert(height === 800, `Timeline : height = 800 (recu: ${height})`);
        } catch (e) {
            assert(false, `Timeline height: ${e.message}`);
        }
    }

    // ---- Test 8 : QuizSet randomQuestions & progressType ----
    {
        const data = {
            title: "Quiz test",
            progressType: "textual",
            passPercentage: 75,
            randomQuestions: true,
            questions: [{
                library: "H5P.MultiChoice 1.16",
                subContentId: "test-123",
                metadata: { title: "Q1" },
                params: {
                    question: "Test ?",
                    answers: [{ text: "A", correct: true }, { text: "B", correct: false }]
                }
            }],
            overallFeedback: [{ from: 0, to: 100, feedback: "" }]
        };
        try {
            const result = await processH5PContent('QuizSet', data);
            const processed = result.content || result;
            assert(processed.progressType === 'textual', `QuizSet : progressType = textual (recu: ${processed.progressType})`);
            assert(processed.passPercentage === 75, `QuizSet : passPercentage = 75 (recu: ${processed.passPercentage})`);
            assert(processed.behaviour?.randomQuestions === true, `QuizSet : behaviour.randomQuestions = true (recu: ${processed.behaviour?.randomQuestions})`);
        } catch (e) {
            assert(false, `QuizSet settings: ${e.message}`);
        }
    }

    // ---- Test 9 : FindTheWords orientations ----
    {
        const data = JSON.parse(JSON.stringify(minimalData.FindTheWords));
        data.behaviour = {
            showVocabulary: false,
            orientations: { horizontal: true, horizontalBack: false, vertical: true, verticalUp: false, diagonal: false, diagonalBack: false, diagonalUp: false, diagonalUpBack: false }
        };
        try {
            const result = await processH5PContent('FindTheWords', data);
            const processed = result.content || result;
            assert(processed.behaviour?.showVocabulary === false, 'FindTheWords : showVocabulary = false');
            assert(processed.behaviour?.orientations?.horizontalBack === false, 'FindTheWords : orientations.horizontalBack = false');
            assert(processed.behaviour?.orientations?.horizontal === true, 'FindTheWords : orientations.horizontal = true');
        } catch (e) {
            assert(false, `FindTheWords orientations: ${e.message}`);
        }
    }

    return { passCount, failCount, results };
}

// =======================================================================
// API PUBLIQUE (pour test-all.html)
// =======================================================================

export { runTests as runAllTests };

// =======================================================================
// AFFICHAGE (mode standalone)
// =======================================================================

async function main() {
    const { passCount, failCount, results } = await runTests();

    // Afficher le resume
    const summaryEl = document.getElementById('summary');
    if (!summaryEl) return; // Mode import depuis test-all.html
    summaryEl.innerHTML = `
        <div class="summary__card card--pass">${passCount}<small>PASS</small></div>
        <div class="summary__card card--fail">${failCount}<small>FAIL</small></div>
        <div class="summary__card card--total">${passCount + failCount}<small>TOTAL</small></div>
    `;

    // Afficher les resultats groupes par module
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';
    let currentMod = '';
    for (const r of results) {
        if (r.module !== currentMod) {
            currentMod = r.module;
            const header = document.createElement('div');
            header.className = 'module-header';
            header.textContent = currentMod;
            resultsEl.appendChild(header);
        }
        const div = document.createElement('div');
        div.className = `result result--${r.status.toLowerCase()}`;
        div.textContent = `${r.status} : ${r.message}`;
        resultsEl.appendChild(div);
    }
}

// Lancement auto en mode standalone (detecte la presence du DOM cible)
if (document.getElementById('summary')) {
    main().catch(e => {
        document.getElementById('results').innerHTML = `<div class="result result--fail">Erreur fatale : ${e.message}</div>`;
        console.error(e);
    });
}
