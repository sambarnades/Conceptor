/**
 * Tests e2e : Editeur CoursePresentation
 *
 * Injecte les 5 exemples JSON dans l'editeur, verifie :
 * - Detection du type CoursePresentation
 * - Normalisation (exercise.library → _exerciseLibrary)
 * - Schema correct avec showWhen
 * - Rendu de chaque type de slide (title, content, content-with-table, quiz, content-quiz, summary)
 * - Champs conditionnels (showWhen) filtres correctement
 * - Tables : headers et rows extraits
 * - Couleurs : champ color present
 * - Exercices : dynamicObject avec schemas corrects
 * - Modification de donnees + sauvegarde (denormalize)
 * - Aller-retour normalize → denormalize preserve les donnees
 *
 * Usage : ouvrir tests/test-editor-cp.html depuis le serveur local.
 */

import {
    detectContentType,
    normalizeDataForEditor,
    denormalizeDataForSave,
    getSchemaForType
} from '../js/editor/content-detector.js';
import { getNestedValue, setNestedValue } from '../js/editor/json-utils.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _group = '';

function assert(condition, message) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, group: _group };
    if (condition) {
        passCount++;
    } else {
        failCount++;
        console.error('FAIL:', _group, '-', message);
    }
    results.push(entry);
}

function assertEqual(actual, expected, message) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) {
        message += ` (attendu: ${JSON.stringify(expected)}, obtenu: ${JSON.stringify(actual)})`;
    }
    assert(pass, message);
}

function assertDefined(value, message) {
    assert(value !== undefined && value !== null, message);
}

function group(name) {
    _group = name;
}

// =======================================================================
// CHARGEMENT DES EXEMPLES
// =======================================================================

async function loadExample(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.json();
}

// =======================================================================
// HELPERS
// =======================================================================

/** Extrait toutes les valeurs texte d'un objet (recursif) */
function extractTextValues(obj, texts = []) {
    if (obj === null || obj === undefined) return texts;
    if (typeof obj === 'string' && obj.trim().length > 0) {
        texts.push(obj);
    } else if (Array.isArray(obj)) {
        obj.forEach(item => extractTextValues(item, texts));
    } else if (typeof obj === 'object') {
        Object.values(obj).forEach(val => extractTextValues(val, texts));
    }
    return texts;
}

/** Deep clone */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Retourne les champs du itemSchema qui sont visibles pour un slide donne
 * en appliquant la logique showWhen
 */
function getVisibleFields(itemSchema, slideData) {
    const visible = {};
    for (const [key, config] of Object.entries(itemSchema)) {
        if (config.showWhen) {
            const sw = config.showWhen;
            const refValue = slideData[sw.field];
            const matches = sw.values
                ? sw.values.includes(refValue)
                : refValue === sw.value;
            if (!matches) continue;
        }
        visible[key] = config;
    }
    return visible;
}

// =======================================================================
// TESTS
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    const examples = [
        { file: 'course_presentation_1.json', name: 'Revolution francaise' },
        { file: 'course_presentation_2.json', name: 'Fonctions mathematiques' },
        { file: 'course_presentation_3.json', name: 'Histoire de Rome' },
        { file: 'course_presentation_4.json', name: 'Revolution (9 exercices)' },
        { file: 'course_presentation_5.json', name: 'Systeme solaire' }
    ];

    // -------------------------------------------------------------------
    // GROUPE 1 : Schema CoursePresentation
    // -------------------------------------------------------------------
    group('Schema CoursePresentation');

    const schema = getSchemaForType('CoursePresentation');
    assertDefined(schema, 'Schema CoursePresentation existe');
    assert(schema.sections && schema.sections.length >= 2, 'Au moins 2 sections (options + slides)');

    const optionsSection = schema.sections.find(s => s.id === 'options');
    const slidesSection = schema.sections.find(s => s.id === 'slides');
    assertDefined(optionsSection, 'Section options existe');
    assertDefined(slidesSection, 'Section slides existe');

    // Verifier les champs options
    assertDefined(optionsSection.fields.globalBackgroundColor, 'Champ globalBackgroundColor existe');
    assertEqual(optionsSection.fields.globalBackgroundColor.type, 'color', 'globalBackgroundColor est de type color');

    // Verifier le champ slides array
    const slidesField = slidesSection.fields.slides;
    assertDefined(slidesField, 'Champ slides existe');
    assertEqual(slidesField.type, 'array', 'slides est un array');
    assertEqual(slidesField.minItems, 2, 'slides minItems = 2');
    assertDefined(slidesField.itemSchema, 'slides a un itemSchema');

    // Verifier les champs itemSchema
    const itemSchema = slidesField.itemSchema;
    assertDefined(itemSchema.type, 'Champ type existe dans itemSchema');
    assertEqual(itemSchema.type.type, 'select', 'type est un select');
    assertEqual(itemSchema.type.options.length, 6, '6 types de slides');

    assertDefined(itemSchema.title, 'Champ title existe');
    assertDefined(itemSchema.subtitle, 'Champ subtitle existe');
    assertDefined(itemSchema.text, 'Champ text existe');
    assertDefined(itemSchema.tableStyle, 'Champ tableStyle existe');
    assertDefined(itemSchema.table, 'Champ table existe');
    assertDefined(itemSchema._exerciseLibrary, 'Champ _exerciseLibrary existe');
    assertDefined(itemSchema.exercise, 'Champ exercise existe');
    assertDefined(itemSchema.backgroundColor, 'Champ backgroundColor existe');

    // Verifier le type color
    assertEqual(itemSchema.backgroundColor.type, 'color', 'backgroundColor est de type color');

    // Verifier dynamicTitleField
    assertEqual(slidesField.dynamicTitleField, 'type', 'dynamicTitleField = type');

    // -------------------------------------------------------------------
    // GROUPE 2 : showWhen - Logique de visibilite conditionnelle
    // -------------------------------------------------------------------
    group('showWhen logique');

    // Verifier les showWhen
    assertEqual(itemSchema.subtitle.showWhen.field, 'type', 'subtitle showWhen.field = type');
    assertEqual(itemSchema.subtitle.showWhen.value, 'title', 'subtitle visible pour title');

    assertEqual(itemSchema.text.showWhen.field, 'type', 'text showWhen.field = type');
    assert(itemSchema.text.showWhen.values.includes('content'), 'text visible pour content');
    assert(itemSchema.text.showWhen.values.includes('content-with-table'), 'text visible pour content-with-table');
    assert(itemSchema.text.showWhen.values.includes('content-quiz'), 'text visible pour content-quiz');
    assert(!itemSchema.text.showWhen.values.includes('title'), 'text PAS visible pour title');
    assert(!itemSchema.text.showWhen.values.includes('quiz'), 'text PAS visible pour quiz');

    assertEqual(itemSchema.tableStyle.showWhen.value, 'content-with-table', 'tableStyle visible pour content-with-table');
    assertEqual(itemSchema.table.showWhen.value, 'content-with-table', 'table visible pour content-with-table');

    assert(itemSchema._exerciseLibrary.showWhen.values.includes('quiz'), '_exerciseLibrary visible pour quiz');
    assert(itemSchema._exerciseLibrary.showWhen.values.includes('content-quiz'), '_exerciseLibrary visible pour content-quiz');
    assert(itemSchema._exerciseLibrary.showWhen.values.includes('summary'), '_exerciseLibrary visible pour summary');

    assert(itemSchema.exercise.showWhen.values.includes('quiz'), 'exercise visible pour quiz');
    assert(!itemSchema.exercise.showWhen.values.includes('title'), 'exercise PAS visible pour title');

    // backgroundColor n'a PAS de showWhen (visible pour tous)
    assert(!itemSchema.backgroundColor.showWhen, 'backgroundColor toujours visible (pas de showWhen)');

    // -------------------------------------------------------------------
    // GROUPE 3 : showWhen applique a chaque type de slide
    // -------------------------------------------------------------------
    group('showWhen par type de slide');

    const slideTypes = ['title', 'content', 'content-with-table', 'quiz', 'content-quiz', 'summary'];
    const expectedFields = {
        'title': ['type', 'title', 'subtitle', 'backgroundColor', 'slideImage'],
        'content': ['type', 'title', 'text', 'backgroundColor', 'slideImage'],
        'content-with-table': ['type', 'layout', 'title', 'text', 'tableStyle', 'table', 'backgroundColor', 'slideImage'],
        'quiz': ['type', 'title', '_exerciseLibrary', 'exercise', 'backgroundColor', 'slideImage'],
        'content-quiz': ['type', 'layout', 'title', 'text', '_exerciseLibrary', 'exercise', 'backgroundColor', 'slideImage'],
        'summary': ['type', 'title', '_exerciseLibrary', 'exercise', 'backgroundColor', 'slideImage']
    };

    for (const slideType of slideTypes) {
        const mockSlide = { type: slideType };
        const visible = getVisibleFields(itemSchema, mockSlide);
        const visibleKeys = Object.keys(visible);
        const expected = expectedFields[slideType];

        for (const key of expected) {
            assert(visibleKeys.includes(key), `${slideType}: champ '${key}' visible`);
        }
        // Verifier qu'aucun champ inattendu n'est visible
        for (const key of visibleKeys) {
            assert(expected.includes(key), `${slideType}: champ '${key}' attendu dans la liste visible`);
        }
    }

    // -------------------------------------------------------------------
    // GROUPE 4 : exerciseLibrary select options
    // -------------------------------------------------------------------
    group('exerciseLibrary select');

    const exLibField = itemSchema._exerciseLibrary;
    assertEqual(exLibField.type, 'select', '_exerciseLibrary est un select');
    assertEqual(exLibField.options.length, 9, '9 types d\'exercices');

    const expectedLibraries = [
        'H5P.MultiChoice 1.16', 'H5P.TrueFalse 1.8', 'H5P.Blanks 1.14',
        'H5P.DragText 1.10', 'H5P.MarkTheWords 1.11', 'H5P.SingleChoiceSet 1.11',
        'H5P.Summary 1.10', 'H5P.DragQuestion 1.15', 'H5P.Dialogcards 1.9'
    ];
    for (const lib of expectedLibraries) {
        const found = exLibField.options.find(o => o.value === lib);
        assertDefined(found, `Option ${lib} presente`);
        assert(found && found.label && found.label.startsWith('editor_cp_ex_'), `${lib} a un label de traduction`);
    }

    // -------------------------------------------------------------------
    // GROUPE 5 : exercise dynamicObject schemas
    // -------------------------------------------------------------------
    group('exercise dynamicObject');

    const exerciseField = itemSchema.exercise;
    assertEqual(exerciseField.type, 'dynamicObject', 'exercise est un dynamicObject');
    assertEqual(exerciseField.selector, '_exerciseLibrary', 'exercise.selector = _exerciseLibrary');
    assertDefined(exerciseField.schemas, 'exercise.schemas existe');

    for (const lib of expectedLibraries) {
        assertDefined(exerciseField.schemas[lib], `Schema pour ${lib} existe`);
    }

    // Verifier quelques schemas specifiques
    const mcSchema = exerciseField.schemas['H5P.MultiChoice 1.16'];
    assertDefined(mcSchema.question, 'MultiChoice: champ question');
    assertDefined(mcSchema.answers, 'MultiChoice: champ answers');
    assertEqual(mcSchema.answers.type, 'array', 'MultiChoice: answers est un array');
    assertDefined(mcSchema.overallFeedback, 'MultiChoice: overallFeedback');

    const tfSchema = exerciseField.schemas['H5P.TrueFalse 1.8'];
    assertDefined(tfSchema.question, 'TrueFalse: champ question');
    assertDefined(tfSchema.correct, 'TrueFalse: champ correct');

    const blanksSchema = exerciseField.schemas['H5P.Blanks 1.14'];
    assertDefined(blanksSchema.taskDescription, 'Blanks: champ taskDescription');
    assertDefined(blanksSchema.questions, 'Blanks: champ questions');

    const summarySchema = exerciseField.schemas['H5P.Summary 1.10'];
    assertDefined(summarySchema.summaries, 'Summary: champ summaries');
    assertDefined(summarySchema.intro, 'Summary: champ intro');

    // -------------------------------------------------------------------
    // GROUPE 6-8 : Injection, normalisation et denormalisation des 3 exemples
    // -------------------------------------------------------------------

    for (const example of examples) {
        const originalData = await loadExample(example.file);

        // ------ 6. Detection du type ------
        group(`Detection [${example.name}]`);

        const detected = detectContentType(originalData);
        assertDefined(detected, `Type detecte pour ${example.name}`);
        assertEqual(detected.moduleKey, 'CoursePresentation', `Detecte comme CoursePresentation`);
        assertEqual(detected.source, 'h5p', `Source = h5p`);

        // ------ 7. Normalisation ------
        group(`Normalisation [${example.name}]`);

        const data = deepClone(originalData);
        const normalized = normalizeDataForEditor(data, 'CoursePresentation');
        assertDefined(normalized, 'Donnees normalisees non null');
        assert(Array.isArray(normalized.slides), 'slides est un tableau');
        assertEqual(normalized.slides.length, originalData.slides.length, `Nombre de slides preserve (${originalData.slides.length})`);

        // Verifier que les titres sont preserves
        for (let i = 0; i < normalized.slides.length; i++) {
            assertEqual(normalized.slides[i].title, originalData.slides[i].title, `Slide ${i}: titre preserve`);
            assertEqual(normalized.slides[i].type, originalData.slides[i].type, `Slide ${i}: type preserve`);
        }

        // Verifier extraction _exerciseLibrary
        for (let i = 0; i < normalized.slides.length; i++) {
            const origSlide = originalData.slides[i];
            const normSlide = normalized.slides[i];

            if (origSlide.exercise && origSlide.exercise.library) {
                assertEqual(normSlide._exerciseLibrary, origSlide.exercise.library,
                    `Slide ${i}: _exerciseLibrary extrait (${origSlide.exercise.library})`);
                assert(!normSlide.exercise.library || normSlide.exercise.library === undefined,
                    `Slide ${i}: exercise.library supprime apres extraction`);
            }
        }

        // Verifier texte preservé
        for (let i = 0; i < normalized.slides.length; i++) {
            if (originalData.slides[i].text) {
                assertEqual(normalized.slides[i].text, originalData.slides[i].text,
                    `Slide ${i}: texte preserve`);
            }
        }

        // Verifier subtitle preservé
        for (let i = 0; i < normalized.slides.length; i++) {
            if (originalData.slides[i].subtitle) {
                assertEqual(normalized.slides[i].subtitle, originalData.slides[i].subtitle,
                    `Slide ${i}: subtitle preserve`);
            }
        }

        // ------ 8. Verification des structures specifiques ------
        group(`Structures [${example.name}]`);

        for (let i = 0; i < normalized.slides.length; i++) {
            const slide = normalized.slides[i];

            switch (slide.type) {
                case 'title':
                    assertDefined(slide.subtitle, `Slide ${i} (title): subtitle present`);
                    break;

                case 'content':
                    assertDefined(slide.text, `Slide ${i} (content): text present`);
                    assert(typeof slide.text === 'string' && slide.text.length > 0,
                        `Slide ${i} (content): text non vide`);
                    break;

                case 'content-with-table':
                    assertDefined(slide.text, `Slide ${i} (content-with-table): text present`);
                    assertDefined(slide.table, `Slide ${i} (content-with-table): table present`);
                    assert(Array.isArray(slide.table.headers), `Slide ${i}: table.headers est un array`);
                    assert(slide.table.headers.length > 0, `Slide ${i}: table.headers non vide`);
                    assert(Array.isArray(slide.table.rows), `Slide ${i}: table.rows est un array`);
                    assert(slide.table.rows.length > 0, `Slide ${i}: table.rows non vide`);
                    // Verifier que chaque row a autant de cellules que de headers
                    for (let r = 0; r < slide.table.rows.length; r++) {
                        assert(Array.isArray(slide.table.rows[r]),
                            `Slide ${i}: table.rows[${r}] est un array`);
                        assertEqual(slide.table.rows[r].length, slide.table.headers.length,
                            `Slide ${i}: row ${r} a ${slide.table.headers.length} cellules`);
                    }
                    break;

                case 'quiz':
                    assertDefined(slide._exerciseLibrary, `Slide ${i} (quiz): _exerciseLibrary present`);
                    assertDefined(slide.exercise, `Slide ${i} (quiz): exercise present`);
                    break;

                case 'content-quiz':
                    assertDefined(slide.text, `Slide ${i} (content-quiz): text present`);
                    assertDefined(slide._exerciseLibrary, `Slide ${i} (content-quiz): _exerciseLibrary present`);
                    assertDefined(slide.exercise, `Slide ${i} (content-quiz): exercise present`);
                    break;

                case 'summary':
                    assertDefined(slide._exerciseLibrary, `Slide ${i} (summary): _exerciseLibrary present`);
                    assertDefined(slide.exercise, `Slide ${i} (summary): exercise present`);
                    // Summary doit utiliser H5P.Summary
                    assertEqual(slide._exerciseLibrary, 'H5P.Summary 1.10',
                        `Slide ${i} (summary): utilise H5P.Summary 1.10`);
                    break;
            }
        }

        // ------ 9. Exercices specifiques ------
        group(`Exercices [${example.name}]`);

        for (let i = 0; i < normalized.slides.length; i++) {
            const slide = normalized.slides[i];
            if (!slide.exercise || !slide._exerciseLibrary) continue;

            const lib = slide._exerciseLibrary;
            const ex = slide.exercise;

            if (lib === 'H5P.MultiChoice 1.16') {
                assertDefined(ex.question, `Slide ${i} MC: question presente`);
                assert(typeof ex.question === 'string' && ex.question.length > 0,
                    `Slide ${i} MC: question non vide`);
                assert(Array.isArray(ex.answers), `Slide ${i} MC: answers est un array`);
                assert(ex.answers.length >= 2, `Slide ${i} MC: au moins 2 reponses`);
                // Au moins une reponse correcte
                assert(ex.answers.some(a => a.correct === true),
                    `Slide ${i} MC: au moins 1 reponse correcte`);
            }

            if (lib === 'H5P.TrueFalse 1.8') {
                assertDefined(ex.question, `Slide ${i} TF: question presente`);
                assertDefined(ex.correct, `Slide ${i} TF: correct present`);
                assert(ex.correct === 'true' || ex.correct === 'false',
                    `Slide ${i} TF: correct est 'true' ou 'false'`);
            }

            if (lib === 'H5P.Blanks 1.14') {
                assertDefined(ex.taskDescription, `Slide ${i} Blanks: taskDescription present`);
                assert(Array.isArray(ex.questions), `Slide ${i} Blanks: questions est un array`);
            }

            if (lib === 'H5P.DragText 1.10') {
                assertDefined(ex.taskDescription, `Slide ${i} DragText: taskDescription present`);
                assertDefined(ex.textField, `Slide ${i} DragText: textField present`);
                assert(ex.textField.includes('*'), `Slide ${i} DragText: textField contient des marqueurs *`);
            }

            if (lib === 'H5P.MarkTheWords 1.11') {
                assertDefined(ex.taskDescription, `Slide ${i} MarkTheWords: taskDescription present`);
                assertDefined(ex.textField, `Slide ${i} MarkTheWords: textField present`);
                assert(ex.textField.includes('*'), `Slide ${i} MarkTheWords: textField contient des marqueurs *`);
            }

            if (lib === 'H5P.SingleChoiceSet 1.11') {
                assert(Array.isArray(ex.choices), `Slide ${i} SCS: choices est un array`);
                assert(ex.choices.length >= 2, `Slide ${i} SCS: au moins 2 questions`);
                for (let c = 0; c < ex.choices.length; c++) {
                    assertDefined(ex.choices[c].question, `Slide ${i} SCS: choice ${c} a une question`);
                    assert(Array.isArray(ex.choices[c].answers), `Slide ${i} SCS: choice ${c} a des answers`);
                    assert(ex.choices[c].answers.length >= 2, `Slide ${i} SCS: choice ${c} a au moins 2 reponses`);
                }
            }

            if (lib === 'H5P.DragQuestion 1.15') {
                assertDefined(ex.title, `Slide ${i} DragQuestion: title present`);
                assert(Array.isArray(ex.dropZones), `Slide ${i} DragQuestion: dropZones est un array`);
                assert(Array.isArray(ex.elements), `Slide ${i} DragQuestion: elements est un array`);
                assert(ex.dropZones.length >= 2, `Slide ${i} DragQuestion: au moins 2 zones`);
                assert(ex.elements.length >= 2, `Slide ${i} DragQuestion: au moins 2 elements`);
            }

            if (lib === 'H5P.Dialogcards 1.9') {
                assert(Array.isArray(ex.dialogs), `Slide ${i} Dialogcards: dialogs est un array`);
                assert(ex.dialogs.length >= 2, `Slide ${i} Dialogcards: au moins 2 cartes`);
                for (let d = 0; d < ex.dialogs.length; d++) {
                    assertDefined(ex.dialogs[d].text, `Slide ${i} Dialogcards: carte ${d} a un text`);
                    assertDefined(ex.dialogs[d].answer, `Slide ${i} Dialogcards: carte ${d} a une answer`);
                }
            }

            if (lib === 'H5P.Summary 1.10') {
                assert(Array.isArray(ex.summaries), `Slide ${i} Summary: summaries est un array`);
                assert(ex.summaries.length >= 1, `Slide ${i} Summary: au moins 1 groupe`);
                for (let s = 0; s < ex.summaries.length; s++) {
                    assert(Array.isArray(ex.summaries[s].summary),
                        `Slide ${i} Summary: groupe ${s} a un array summary`);
                    assert(ex.summaries[s].summary.length >= 2,
                        `Slide ${i} Summary: groupe ${s} a au moins 2 propositions`);
                }
            }
        }

        // ------ 10. Aller-retour normalize → denormalize ------
        group(`Aller-retour [${example.name}]`);

        const dataCopy = deepClone(originalData);
        const norm = normalizeDataForEditor(dataCopy, 'CoursePresentation');
        const denorm = denormalizeDataForSave(deepClone(norm), 'CoursePresentation');

        assertEqual(denorm.title, originalData.title, 'Titre preserve apres aller-retour');
        assertEqual(denorm.slides.length, originalData.slides.length, 'Nombre de slides preserve');

        for (let i = 0; i < denorm.slides.length; i++) {
            const orig = originalData.slides[i];
            const result = denorm.slides[i];

            assertEqual(result.type, orig.type, `Slide ${i}: type preserve`);
            assertEqual(result.title, orig.title, `Slide ${i}: titre preserve`);

            // Verifier que _exerciseLibrary a ete reinjecte dans exercise.library
            if (orig.exercise && orig.exercise.library) {
                assertDefined(result.exercise, `Slide ${i}: exercise existe apres denorm`);
                assertEqual(result.exercise.library, orig.exercise.library,
                    `Slide ${i}: exercise.library reinjecte (${orig.exercise.library})`);
                assert(!result._exerciseLibrary, `Slide ${i}: _exerciseLibrary supprime apres denorm`);
            }

            // Verifier le nettoyage des champs par type
            if (orig.type === 'title') {
                assert(!result.text, `Slide ${i} title: text supprime`);
                assert(!result.table, `Slide ${i} title: table supprime`);
                assert(!result.exercise, `Slide ${i} title: exercise supprime`);
            }
            if (orig.type === 'content') {
                assert(!result.subtitle, `Slide ${i} content: subtitle supprime`);
                assert(!result.table, `Slide ${i} content: table supprime`);
                assert(!result.exercise, `Slide ${i} content: exercise supprime`);
            }
            if (orig.type === 'content-with-table') {
                assert(!result.subtitle, `Slide ${i} content-with-table: subtitle supprime`);
                assertDefined(result.table, `Slide ${i} content-with-table: table preserve`);
            }
            if (orig.type === 'quiz') {
                assert(!result.text, `Slide ${i} quiz: text supprime`);
                assert(!result.subtitle, `Slide ${i} quiz: subtitle supprime`);
                assertDefined(result.exercise, `Slide ${i} quiz: exercise preserve`);
            }
        }

        // Verifier textes preserves dans le cycle complet
        const originalTexts = extractTextValues(originalData);
        const resultTexts = extractTextValues(denorm);
        const criticalTexts = originalTexts.filter(t => t.length > 20); // Textes significatifs
        for (const text of criticalTexts) {
            assert(resultTexts.includes(text),
                `Texte preserve: "${text.substring(0, 50)}..."`);
        }
    }

    // -------------------------------------------------------------------
    // GROUPE 9 : Modifications et sauvegarde
    // -------------------------------------------------------------------
    group('Modifications et sauvegarde');

    const modData = await loadExample('course_presentation_2.json');
    const modNorm = normalizeDataForEditor(deepClone(modData), 'CoursePresentation');

    // Modifier le titre
    modNorm.title = 'Titre modifie par le test';
    // Modifier le texte d'un slide content
    const contentSlide = modNorm.slides.find(s => s.type === 'content');
    if (contentSlide) {
        contentSlide.text = 'Texte modifie __TEST__';
    }

    // Ajouter un nouveau slide
    const newSlide = {
        type: 'content',
        title: 'Nouveau slide test',
        text: 'Contenu du nouveau slide',
        backgroundColor: '#ff5733'
    };
    modNorm.slides.push(newSlide);

    // Modifier une table
    const tableSlide = modNorm.slides.find(s => s.type === 'content-with-table');
    if (tableSlide) {
        tableSlide.table.headers.push('Nouvelle colonne');
        tableSlide.table.rows.forEach(row => row.push(''));
        tableSlide.tableStyle = 'dsfr';
    }

    // Modifier un exercice
    const quizSlide = modNorm.slides.find(s => s.type === 'quiz' && s._exerciseLibrary === 'H5P.MultiChoice 1.16');
    if (quizSlide) {
        quizSlide.exercise.question = 'Question modifiee par le test ?';
        quizSlide.exercise.answers.push({
            text: 'Nouvelle reponse',
            correct: false,
            tipsAndFeedback: { chosenFeedback: 'Feedback test' }
        });
    }

    // Changer le type d'exercice d'un slide
    const contentQuizSlide = modNorm.slides.find(s => s.type === 'content-quiz');
    if (contentQuizSlide) {
        contentQuizSlide._exerciseLibrary = 'H5P.Blanks 1.14';
        contentQuizSlide.exercise = {
            taskDescription: 'Nouvelle description',
            questions: ['Premiere *reponse* ici.'],
            overallFeedback: [{ from: 0, to: 50, feedback: 'A revoir' }, { from: 51, to: 100, feedback: 'Bien' }]
        };
    }

    // Denormaliser
    const modDenorm = denormalizeDataForSave(deepClone(modNorm), 'CoursePresentation');

    assertEqual(modDenorm.title, 'Titre modifie par le test', 'Titre modifie preserve');
    assertEqual(modDenorm.slides.length, modData.slides.length + 1, 'Nouveau slide ajoute');

    // Verifier le nouveau slide
    const addedSlide = modDenorm.slides[modDenorm.slides.length - 1];
    assertEqual(addedSlide.title, 'Nouveau slide test', 'Nouveau slide: titre correct');
    assertEqual(addedSlide.text, 'Contenu du nouveau slide', 'Nouveau slide: texte correct');
    assertEqual(addedSlide.backgroundColor, '#ff5733', 'Nouveau slide: couleur correcte');

    // Verifier la table modifiee
    const modifiedTableSlide = modDenorm.slides.find(s => s.type === 'content-with-table');
    if (modifiedTableSlide) {
        assert(modifiedTableSlide.table.headers.includes('Nouvelle colonne'),
            'Table: nouvelle colonne ajoutee');
        assertEqual(modifiedTableSlide.tableStyle, 'dsfr', 'Table: style DSFR');
    }

    // Verifier exercice modifie
    const modifiedQuiz = modDenorm.slides.find(s =>
        s.exercise && s.exercise.library === 'H5P.MultiChoice 1.16');
    if (modifiedQuiz) {
        assertEqual(modifiedQuiz.exercise.question, 'Question modifiee par le test ?',
            'MC: question modifiee');
        assert(modifiedQuiz.exercise.answers.length >= 5,
            'MC: nouvelle reponse ajoutee');
    }

    // Verifier changement de type d'exercice
    const changedExSlide = modDenorm.slides.find(s =>
        s.type === 'content-quiz' && s.exercise && s.exercise.library === 'H5P.Blanks 1.14');
    if (changedExSlide) {
        assertEqual(changedExSlide.exercise.library, 'H5P.Blanks 1.14',
            'Changement type exercice: library reinjectee');
        assertEqual(changedExSlide.exercise.text, 'Nouvelle description',
            'Changement type exercice: consigne native text conservée');
    }

    // -------------------------------------------------------------------
    // GROUPE 10 : Couleurs
    // -------------------------------------------------------------------
    group('Couleurs');

    // Verifier que le schema supporte les couleurs
    assertEqual(itemSchema.backgroundColor.type, 'color', 'backgroundColor: type color dans schema');
    assertEqual(optionsSection.fields.globalBackgroundColor.type, 'color', 'globalBackgroundColor: type color dans schema');

    // Verifier qu'on peut assigner des couleurs valides
    const colorData = await loadExample('course_presentation_1.json');
    const colorNorm = normalizeDataForEditor(deepClone(colorData), 'CoursePresentation');
    colorNorm.globalBackgroundColor = '#2c3e50';
    colorNorm.slides[0].backgroundColor = '#e74c3c';

    const colorDenorm = denormalizeDataForSave(deepClone(colorNorm), 'CoursePresentation');
    assertEqual(colorDenorm.globalBackgroundColor, '#2c3e50', 'Couleur globale preservee');
    assertEqual(colorDenorm.slides[0].backgroundColor, '#e74c3c', 'Couleur slide preservee');

    // -------------------------------------------------------------------
    // GROUPE 11 : Tables - structure et styles
    // -------------------------------------------------------------------
    group('Tables');

    const tableData = await loadExample('course_presentation_1.json');
    const tableNorm = normalizeDataForEditor(deepClone(tableData), 'CoursePresentation');
    const tableSlideTest = tableNorm.slides.find(s => s.type === 'content-with-table');

    assertDefined(tableSlideTest, 'Slide content-with-table trouve dans exemple 1');
    if (tableSlideTest) {
        assertEqual(tableSlideTest.table.headers.length, 3, 'Table: 3 colonnes');
        assertEqual(tableSlideTest.table.rows.length, 4, 'Table: 4 lignes');
        assertEqual(tableSlideTest.table.headers[0], 'Date', 'Table: premiere colonne = Date');
        assertEqual(tableSlideTest.table.rows[0][0], '5 mai 1789', 'Table: premiere cellule correcte');
    }

    // Tester tous les styles
    const validStyles = ['default', 'striped', 'bordered', 'dark-header', 'minimal', 'dsfr'];
    const styleOptions = itemSchema.tableStyle.options.map(o => o.value);
    for (const style of validStyles) {
        assert(styleOptions.includes(style), `Style '${style}' dans les options`);
    }

    // -------------------------------------------------------------------
    // GROUPE 12 : Table schema (headers + rows)
    // -------------------------------------------------------------------
    group('Table schema');

    const tableSchema = itemSchema.table;
    assertEqual(tableSchema.type, 'object', 'table: type object');
    assertDefined(tableSchema.schema.headers, 'table.schema.headers existe');
    assertDefined(tableSchema.schema.rows, 'table.schema.rows existe');
    assertEqual(tableSchema.schema.headers.type, 'array', 'headers: type array');
    assertEqual(tableSchema.schema.rows.type, 'array', 'rows: type array');

    // Verifier isArrayValue pour les items simples
    assertDefined(tableSchema.schema.headers.itemSchema._value, 'headers: itemSchema._value existe');
    assert(tableSchema.schema.headers.itemSchema._value.isArrayValue, 'headers: isArrayValue = true');
    assert(tableSchema.schema.rows.itemSchema._value.isArrayValue, 'rows: isArrayValue = true');

    // -------------------------------------------------------------------
    // GROUPE 13 : Robustesse - Donnees manquantes ou malformees
    // -------------------------------------------------------------------
    group('Robustesse');

    // Slides vides
    {
        const emptyData = { title: 'Test vide', slides: [] };
        const norm = normalizeDataForEditor(deepClone(emptyData), 'CoursePresentation');
        assertEqual(norm.slides.length, 0, 'Slides vides: tableau vide preserve');
    }

    // Slide sans exercice pour un type quiz (malformation IA)
    {
        const badData = {
            title: 'Test malformation',
            slides: [
                { type: 'title', title: 'Titre' },
                { type: 'quiz', title: 'Quiz sans exercice' }
            ]
        };
        let noError = true;
        try {
            const norm = normalizeDataForEditor(deepClone(badData), 'CoursePresentation');
            denormalizeDataForSave(deepClone(norm), 'CoursePresentation');
        } catch (e) {
            noError = false;
        }
        assert(noError, 'Slide quiz sans exercice: pas d\'erreur');
    }

    // Slide avec exercice.library inconnue
    {
        const unknownLib = {
            title: 'Test lib inconnue',
            slides: [
                { type: 'title', title: 'Titre' },
                { type: 'quiz', title: 'Quiz', exercise: { library: 'H5P.Unknown 1.0', question: 'Test' } }
            ]
        };
        let noError = true;
        try {
            const norm = normalizeDataForEditor(deepClone(unknownLib), 'CoursePresentation');
            assertEqual(norm.slides[1]._exerciseLibrary, 'H5P.Unknown 1.0',
                'Library inconnue: _exerciseLibrary preserve');
        } catch (e) {
            noError = false;
        }
        assert(noError, 'Library inconnue: pas d\'erreur');
    }

    // -------------------------------------------------------------------
    // GROUPE 14 : LaTeX preservé (exemple 2 avec maths)
    // -------------------------------------------------------------------
    group('LaTeX');

    const latexData = await loadExample('course_presentation_2.json');
    const latexNorm = normalizeDataForEditor(deepClone(latexData), 'CoursePresentation');
    const latexDenorm = denormalizeDataForSave(deepClone(latexNorm), 'CoursePresentation');

    // Verifier que le LaTeX est preserve dans le texte
    const latexSlide = latexDenorm.slides.find(s => s.text && s.text.includes('\\\\('));
    if (latexSlide) {
        assert(latexSlide.text.includes('\\\\('), 'LaTeX: delimiteurs \\( preserves dans text');
        assert(latexSlide.text.includes('f(x)'), 'LaTeX: f(x) present dans text');
    }

    // Verifier LaTeX dans les exercices
    const latexQuiz = latexDenorm.slides.find(s =>
        s.exercise && s.exercise.question && s.exercise.question.includes('\\\\('));
    if (latexQuiz) {
        assert(latexQuiz.exercise.question.includes('\\\\('),
            'LaTeX: delimiteurs preserves dans question');
    }

    // -------------------------------------------------------------------
    // Resultat
    // -------------------------------------------------------------------
    console.log(`\n=== Tests Editeur CP: ${passCount} PASS, ${failCount} FAIL ===`);

    return { passCount, failCount, results };
}
