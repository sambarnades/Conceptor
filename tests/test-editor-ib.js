/**
 * Tests e2e : Editeur InteractiveBook
 *
 * Injecte les 2 exemples JSON dans l'editeur, verifie :
 * - Detection du type InteractiveBook (sans collision avec elea_livre)
 * - Schema a 2 niveaux d'array (chapters[] → content[] nested)
 * - Blocs polymorphes via _blockType + showWhen
 * - Normalisation (library → _exerciseLibrary, params → exercise, type → _blockType)
 * - Denormalisation (inverse) + aller-retour idempotent
 * - DragQuestion : correctElements ↔ zoneIndices
 * - Robustesse : chapitre vide, bloc sans type, couverture vide
 *
 * Usage : ouvrir tests/test-editor-ib.html depuis le serveur local.
 */

import {
    detectContentType,
    normalizeDataForEditor,
    denormalizeDataForSave,
    getSchemaForType
} from '../js/editor/content-detector.js';

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

async function loadExample(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.json();
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/** Applique la logique showWhen pour lister les champs visibles d'un bloc */
function getVisibleFields(itemSchema, blockData) {
    const visible = {};
    for (const [key, config] of Object.entries(itemSchema)) {
        if (config.showWhen) {
            const sw = config.showWhen;
            const refValue = blockData[sw.field];
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

    // -------------------------------------------------------------------
    // GROUPE 1 : Schema InteractiveBook (2 niveaux d'array)
    // -------------------------------------------------------------------
    group('Schema InteractiveBook');

    const schema = getSchemaForType('InteractiveBook');
    assertDefined(schema, 'Schema InteractiveBook existe');
    assert(schema.sections && schema.sections.length === 3, '3 sections (general, chapters, options)');

    const generalSection = schema.sections.find(s => s.id === 'general');
    const chaptersSection = schema.sections.find(s => s.id === 'chapters');
    const optionsSection = schema.sections.find(s => s.id === 'options');
    assertDefined(generalSection, 'Section general existe');
    assertDefined(chaptersSection, 'Section chapters existe');
    assertDefined(optionsSection, 'Section options existe');

    // Section general : titre + couverture
    assertDefined(generalSection.fields.title, 'Champ title existe');
    assertDefined(generalSection.fields.cover, 'Champ cover existe');
    assertEqual(generalSection.fields.cover.type, 'object', 'cover est un object');
    assertDefined(generalSection.fields.cover.schema.description, 'cover.description existe');

    // Section options
    assertEqual(optionsSection.fields.baseColor.type, 'color', 'baseColor est de type color');
    assertEqual(optionsSection.fields.showTableOfContents.type, 'checkbox', 'showTableOfContents est un checkbox');
    assertEqual(optionsSection.fields.displaySummary.type, 'checkbox', 'displaySummary est un checkbox');

    // Niveau 1 : chapters[]
    const chaptersField = chaptersSection.fields.chapters;
    assertDefined(chaptersField, 'Champ chapters existe');
    assertEqual(chaptersField.type, 'array', 'chapters est un array');
    assertEqual(chaptersField.minItems, 2, 'chapters minItems = 2');
    assertEqual(chaptersField.dynamicTitleField, 'title', 'dynamicTitleField = title');
    assertDefined(chaptersField.itemSchema, 'chapters a un itemSchema');
    assertDefined(chaptersField.itemSchema.title, 'Champ chapitre.title existe');

    // Niveau 2 : content[] imbrique (nested)
    const contentField = chaptersField.itemSchema.content;
    assertDefined(contentField, 'Champ chapitre.content existe');
    assertEqual(contentField.type, 'array', 'content est un array');
    assertEqual(contentField.nested, true, 'content est nested (array dans array)');
    assertEqual(contentField.minItems, 1, 'content minItems = 1');
    assertEqual(contentField.dynamicTitleField, '_blockType', 'dynamicTitleField = _blockType');

    // Blocs polymorphes
    const blockSchema = contentField.itemSchema;
    assertDefined(blockSchema._blockType, 'Champ _blockType existe');
    assertEqual(blockSchema._blockType.type, 'select', '_blockType est un select');
    assertEqual(blockSchema._blockType.options.length, 4, '4 types de blocs (text, table, image, exercise)');
    assertDefined(blockSchema.text, 'Champ text existe');
    assertDefined(blockSchema.tableStyle, 'Champ tableStyle existe');
    assertDefined(blockSchema.table, 'Champ table existe');
    assertDefined(blockSchema.image, 'Champ image existe');
    assertDefined(blockSchema._exerciseLibrary, 'Champ _exerciseLibrary existe');
    assertDefined(blockSchema.exercise, 'Champ exercise existe');
    assertEqual(blockSchema.exercise.type, 'dynamicObject', 'exercise est un dynamicObject');
    assertEqual(blockSchema.exercise.selector, '_exerciseLibrary', 'exercise.selector = _exerciseLibrary');
    assertEqual(blockSchema._exerciseLibrary.options.length, 9, '9 types d\'exercices');
    assertEqual(blockSchema.image.altTextField, 'alt', 'image.altTextField = alt');

    // Schemas d'exercices partages avec CP : verifier quelques entrees
    const exSchemas = blockSchema.exercise.schemas;
    assertDefined(exSchemas['H5P.MultiChoice 1.16'], 'Schema MultiChoice partage present');
    assertDefined(exSchemas['H5P.Summary 1.10'], 'Schema Summary partage present');
    assertDefined(exSchemas['H5P.DragQuestion 1.15'], 'Schema DragQuestion partage present');
    assertDefined(exSchemas['H5P.MultiChoice 1.16'].overallFeedback, 'overallFeedback (feedbackRanges) present');

    // -------------------------------------------------------------------
    // GROUPE 2 : showWhen par type de bloc
    // -------------------------------------------------------------------
    group('showWhen par type de bloc');

    const expectedFields = {
        'text': ['_blockType', 'text'],
        'table': ['_blockType', 'tableStyle', 'table'],
        'image': ['_blockType', 'image'],
        'exercise': ['_blockType', '_exerciseLibrary', 'exercise']
    };
    for (const [blockType, expected] of Object.entries(expectedFields)) {
        const visible = getVisibleFields(blockSchema, { _blockType: blockType });
        assertEqual(Object.keys(visible).sort(), expected.sort(), `Champs visibles pour bloc "${blockType}"`);
    }

    // -------------------------------------------------------------------
    // GROUPE 3 : Detection
    // -------------------------------------------------------------------
    group('Detection');

    const ex1 = await loadExample('interactive_book_1.json');
    const ex2 = await loadExample('interactive_book_2.json');

    const det1 = detectContentType(deepClone(ex1));
    assertDefined(det1, 'Exemple 1 detecte');
    assertEqual(det1?.moduleKey, 'InteractiveBook', 'Exemple 1 → InteractiveBook');

    const det2 = detectContentType(deepClone(ex2));
    assertEqual(det2?.moduleKey, 'InteractiveBook', 'Exemple 2 → InteractiveBook');

    // Par titleKey (prioritaire)
    const detKey = detectContentType(deepClone(ex1), 'h5p_interactive_book_name');
    assertEqual(detKey?.moduleKey, 'InteractiveBook', 'Detection par titleKey');

    // Pas de collision avec le Livre Elea (chapters[].blocks)
    const eleaLivre = { theme: 'default', chapters: [{ title: 'Ch', blocks: [{ type: '01', data: {} }] }] };
    const detElea = detectContentType(eleaLivre);
    assertEqual(detElea?.moduleKey, 'elea_livre', 'chapters[].blocks → elea_livre (pas InteractiveBook)');

    // -------------------------------------------------------------------
    // GROUPE 4 : Normalisation
    // -------------------------------------------------------------------
    group('Normalisation');

    const norm1 = normalizeDataForEditor(deepClone(ex1), 'InteractiveBook');
    const ch1blocks = norm1.chapters[0].content;
    assertEqual(ch1blocks[0]._blockType, 'text', 'Bloc 1 → _blockType text');
    assert(!('type' in ch1blocks[0]), 'type supprime apres normalisation (text)');
    assertEqual(ch1blocks[1]._blockType, 'table', 'Bloc 2 → _blockType table');
    assertDefined(ch1blocks[1].table.headers, 'table.headers preserve');
    assertEqual(ch1blocks[2]._blockType, 'exercise', 'Bloc 3 → _blockType exercise');
    assertEqual(ch1blocks[2]._exerciseLibrary, 'H5P.MultiChoice 1.16', 'library → _exerciseLibrary');
    assertDefined(ch1blocks[2].exercise, 'params enveloppes dans exercise');
    assertEqual(ch1blocks[2].exercise.question, 'Combien de planètes compte le système solaire ?', 'question dans exercise');
    assert(!('library' in ch1blocks[2].exercise), 'library retiree des params exercise');
    assertEqual(ch1blocks[2].exercise.answers.length, 3, '3 reponses preservees');

    // DragQuestion : correctElements → zoneIndices
    const norm2 = normalizeDataForEditor(deepClone(ex2), 'InteractiveBook');
    const dragBlock = norm2.chapters[3].content.find(b => b._exerciseLibrary === 'H5P.DragQuestion 1.15');
    assertDefined(dragBlock, 'Bloc DragQuestion trouve');
    if (dragBlock) {
        assertDefined(dragBlock.exercise.elements[0].zoneIndices, 'zoneIndices cree');
        assertEqual(dragBlock.exercise.elements[0].zoneIndices, [0], 'element 0 → zone 0');
        assertEqual(dragBlock.exercise.elements[1].zoneIndices, [1], 'element 1 → zone 1');
        assert(!('correctElements' in dragBlock.exercise.dropZones[0]), 'correctElements supprime pendant edition');
    }

    // -------------------------------------------------------------------
    // GROUPE 5 : Denormalisation + aller-retour
    // -------------------------------------------------------------------
    group('Denormalisation');

    const denorm1 = denormalizeDataForSave(deepClone(norm1), 'InteractiveBook');
    const dch1 = denorm1.chapters[0].content;
    assertEqual(dch1[0].type, 'text', 'Bloc 1 → type text restaure');
    assert(!('_blockType' in dch1[0]), '_blockType supprime');
    assertEqual(dch1[1].type, 'table', 'Bloc 2 → type table restaure');
    assertEqual(dch1[2].type, 'exercise', 'Bloc 3 → type exercise restaure');
    assertEqual(dch1[2].library, 'H5P.MultiChoice 1.16', '_exerciseLibrary → library restaure');
    assertEqual(dch1[2].question, 'Combien de planètes compte le système solaire ?', 'params exercise aplatis');
    assert(!('exercise' in dch1[2]), 'wrapper exercise supprime');
    assert(!('_exerciseLibrary' in dch1[2]), '_exerciseLibrary supprime');

    // DragQuestion : zoneIndices → correctElements
    const denorm2 = denormalizeDataForSave(deepClone(norm2), 'InteractiveBook');
    const dDrag = denorm2.chapters[3].content.find(b => b.library === 'H5P.DragQuestion 1.15');
    assertDefined(dDrag, 'DragQuestion denormalise');
    if (dDrag) {
        assertEqual(dDrag.dropZones[0].correctElements, [0, 2], 'zone 0 correctElements restaures');
        assertEqual(dDrag.dropZones[1].correctElements, [1, 3], 'zone 1 correctElements restaures');
        assert(!('zoneIndices' in dDrag.elements[0]), 'zoneIndices supprime a la sauvegarde');
    }

    // Aller-retour : normalize(denormalize(normalize(x))) === normalize(x)
    const roundtrip = normalizeDataForEditor(deepClone(denorm1), 'InteractiveBook');
    assertEqual(roundtrip, norm1, 'Aller-retour normalize ↔ denormalize idempotent (ex 1)');
    const roundtrip2 = normalizeDataForEditor(deepClone(denorm2), 'InteractiveBook');
    assertEqual(roundtrip2, norm2, 'Aller-retour normalize ↔ denormalize idempotent (ex 2)');

    // Le denormalise doit etre structurellement equivalent a l'original (champs metier)
    assertEqual(denorm1.chapters.length, ex1.chapters.length, 'Nombre de chapitres preserve');
    assertEqual(denorm1.title, ex1.title, 'Titre preserve');
    assertEqual(denorm1.cover, ex1.cover, 'Couverture preservee');
    assertEqual(denorm1.baseColor, ex1.baseColor, 'baseColor preserve');

    // -------------------------------------------------------------------
    // GROUPE 6 : Robustesse
    // -------------------------------------------------------------------
    group('Robustesse');

    // Couverture vide → supprimee a la sauvegarde
    const emptyCover = denormalizeDataForSave({
        title: 'T', cover: { description: '  ' },
        chapters: [{ title: 'A', content: [{ _blockType: 'text', text: 'x' }] }]
    }, 'InteractiveBook');
    assert(!('cover' in emptyCover), 'Couverture vide supprimee');

    // Bloc sans _blockType ni type → infere text
    const noType = denormalizeDataForSave({
        chapters: [{ title: 'A', content: [{ text: 'juste du texte' }] }]
    }, 'InteractiveBook');
    assertEqual(noType.chapters[0].content[0].type, 'text', 'Bloc sans type → text');

    // Bloc exercise sans library → conserve (validators le signalera)
    const noLib = denormalizeDataForSave({
        chapters: [{ title: 'A', content: [{ _blockType: 'exercise', exercise: { question: 'Q' } }] }]
    }, 'InteractiveBook');
    assertEqual(noLib.chapters[0].content[0].type, 'exercise', 'Bloc exercise sans library conserve');
    assertEqual(noLib.chapters[0].content[0].library, '', 'library vide (a signaler par validation)');

    // Chapitre au contenu non-array → laisse tel quel sans crash
    const weird = normalizeDataForEditor({ chapters: [{ title: 'X', content: 'pas un tableau' }] }, 'InteractiveBook');
    assertDefined(weird, 'content non-array ne crashe pas');

    return { passCount, failCount, results };
}
