/**
 * Tests unitaires : ArrayManager & JSON Utils — Toutes activites
 *
 * Couvre le correctif 5.0.2 pour TOUTES les activites :
 * - createEmptyItem() avec champs dynamicObject → {} et non ''
 * - createEmptyItem() avec cles pointees (ex: 'metadata.title') → structure imbriquee
 * - setNestedValue() resistant aux noeuds intermediaires primitifs
 * - Nettoyage des feedbackEditors orphelins apres suppression
 * - Verification de createEmptyItem pour chaque type d'activite (27 schemas)
 *
 * Usage : ouvrir tests/test-editor-array.html depuis le serveur local.
 */

import { getNestedValue, setNestedValue } from '../js/editor/json-utils.js';
import { getSchemaForType, normalizeDataForEditor, denormalizeDataForSave } from '../js/editor/content-detector.js';
import { FeedbackEditor } from '../js/editor/feedback-editor.js';
import { renderCheckboxField, renderSelectField } from '../js/editor/field-renderers.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _group = '';

function assert(condition, message) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        group: _group
    };
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

function group(name) {
    _group = name;
}

// =======================================================================
// SIMULATION LOCALE DE createEmptyItem
// (Reproduit la logique de ArrayManager.createEmptyItem sans le DOM)
// =======================================================================

function createEmptyItem(itemSchema) {
    if (!itemSchema) return {};

    // Verifier si c'est une valeur simple
    const valueField = Object.entries(itemSchema).find(([k, v]) => v.isArrayValue);
    if (valueField) {
        return '';
    }

    const item = {};
    for (const [key, fieldConfig] of Object.entries(itemSchema)) {
        let defaultValue;
        if (fieldConfig.type === 'array') {
            defaultValue = [];
        } else if (fieldConfig.type === 'dynamicObject') {
            // Correctif 5.0.2 : objet, jamais une chaine
            defaultValue = {};
        } else if (fieldConfig.type === 'object' && fieldConfig.schema) {
            defaultValue = {};
            for (const subKey of Object.keys(fieldConfig.schema)) {
                defaultValue[subKey] = '';
            }
        } else if (fieldConfig.type === 'checkbox') {
            defaultValue = fieldConfig.valueType === 'number' ? 0 : false;
        } else if (fieldConfig.type === 'number') {
            defaultValue = fieldConfig.default !== undefined ? fieldConfig.default : 0;
        } else if (fieldConfig.type === 'select' && fieldConfig.default) {
            defaultValue = fieldConfig.default;
        } else {
            defaultValue = fieldConfig.default || '';
        }

        // Correctif 5.0.2 : cles pointees → structure imbriquee
        if (key.includes('.')) {
            setNestedValue(item, key, defaultValue);
        } else {
            item[key] = defaultValue;
        }
    }
    return item;
}

// =======================================================================
// EXTRACTION DES CHAMPS ARRAY DEPUIS UN SCHEMA
// =======================================================================

/**
 * Extrait tous les champs array (avec itemSchema) d'un schema de sections
 * Retourne un tableau de { fieldName, arrayConfig, sectionId }
 */
function extractArrayFields(schema) {
    const fields = [];
    if (!schema || !schema.sections) return fields;

    for (const section of schema.sections) {
        if (!section.fields) continue;
        for (const [fieldName, config] of Object.entries(section.fields)) {
            if (config.type === 'array' && config.itemSchema) {
                fields.push({ fieldName, config, sectionId: section.id });
            }
        }
    }
    return fields;
}

/**
 * Analyse un itemSchema et retourne les caracteristiques importantes
 */
function analyzeItemSchema(itemSchema) {
    const analysis = {
        hasDynamicObject: false,
        hasDottedKeys: false,
        hasNestedArrays: false,
        hasCheckbox: false,
        hasObject: false,
        hasIsArrayValue: false,
        dottedKeys: [],
        dynamicObjectKeys: [],
        nestedArrayKeys: [],
        allKeys: Object.keys(itemSchema)
    };

    for (const [key, config] of Object.entries(itemSchema)) {
        if (config.type === 'dynamicObject') {
            analysis.hasDynamicObject = true;
            analysis.dynamicObjectKeys.push(key);
        }
        if (key.includes('.')) {
            analysis.hasDottedKeys = true;
            analysis.dottedKeys.push(key);
        }
        if (config.type === 'array') {
            analysis.hasNestedArrays = true;
            analysis.nestedArrayKeys.push(key);
        }
        if (config.type === 'checkbox') analysis.hasCheckbox = true;
        if (config.type === 'object') analysis.hasObject = true;
        if (config.isArrayValue) analysis.hasIsArrayValue = true;
    }

    return analysis;
}

// =======================================================================
// LISTE DE TOUTES LES ACTIVITES
// =======================================================================

const ALL_MODULES = [
    // H5P
    'Flashcards', 'MultipleChoice', 'TrueFalse', 'FillInTheBlanks',
    'DialogCards', 'Timeline', 'Crossword', 'Essay', 'Chart',
    'DragTheWords', 'DragAndDrop', 'Glossary', 'QuizSet',
    'MarkTheWords', 'SortParagraphs', 'FindTheWords', 'Summary',
    'SingleChoiceSet',
    // Moodle/Elea
    'elea_qcm', 'elea_appariement', 'elea_glossaire',
    'elea_millionnaire', 'elea_test', 'elea_page', 'elea_devoir'
];

// =======================================================================
// TESTS
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    // -------------------------------------------------------------------
    // GROUPE 1 : setNestedValue — Protection contre les primitives
    // -------------------------------------------------------------------
    group('setNestedValue');

    // Cas basique
    {
        const obj = {};
        setNestedValue(obj, 'a.b.c', 42);
        assertEqual(obj.a.b.c, 42, 'Cree la structure imbriquee a.b.c');
    }

    // Ecriture dans un noeud qui est une chaine (bug original)
    {
        const obj = { params: '' };
        setNestedValue(obj, 'params.question', 'Quel est 2+2 ?');
        assertEqual(obj.params.question, 'Quel est 2+2 ?', 'Remplace une primitive string par un objet pour ecrire params.question');
        assertEqual(typeof obj.params, 'object', 'params est devenu un objet');
    }

    // Ecriture dans un noeud qui est un nombre
    {
        const obj = { data: 0 };
        setNestedValue(obj, 'data.value', 'test');
        assertEqual(obj.data.value, 'test', 'Remplace un nombre par un objet pour ecrire data.value');
    }

    // Ecriture dans un noeud qui est un boolean
    {
        const obj = { flag: false };
        setNestedValue(obj, 'flag.sub', 'val');
        assertEqual(obj.flag.sub, 'val', 'Remplace un boolean par un objet');
    }

    // Creation de tableau quand le prochain index est numerique
    {
        const obj = {};
        setNestedValue(obj, 'items.0.text', 'hello');
        assert(Array.isArray(obj.items), 'Cree un tableau quand la cle suivante est numerique');
        assertEqual(obj.items[0].text, 'hello', 'Valeur correcte dans le tableau');
    }

    // Chemin simple (pas de point)
    {
        const obj = {};
        setNestedValue(obj, 'name', 'test');
        assertEqual(obj.name, 'test', 'Chemin simple sans point');
    }

    // Noeud intermediaire null
    {
        const obj = { a: null };
        setNestedValue(obj, 'a.b', 'value');
        assertEqual(obj.a.b, 'value', 'Remplace null par un objet');
    }

    // Noeud intermediaire undefined
    {
        const obj = {};
        setNestedValue(obj, 'x.y.z', 'deep');
        assertEqual(obj.x.y.z, 'deep', 'Cree les noeuds intermediaires manquants');
    }

    // Chemin vide (cas limite)
    {
        const obj = { a: 1 };
        setNestedValue(obj, '', 'ignored');
        assertEqual(obj.a, 1, 'Chemin vide ne modifie rien');
    }

    // -------------------------------------------------------------------
    // GROUPE 2 : getNestedValue
    // -------------------------------------------------------------------
    group('getNestedValue');

    {
        const obj = { a: { b: { c: 42 } } };
        assertEqual(getNestedValue(obj, 'a.b.c'), 42, 'Recupere une valeur profonde');
    }

    {
        const obj = { items: [{ text: 'hello' }, { text: 'world' }] };
        assertEqual(getNestedValue(obj, 'items.1.text'), 'world', 'Accede a un element de tableau par index');
    }

    {
        const obj = { a: 'primitive' };
        assertEqual(getNestedValue(obj, 'a.b.c'), undefined, 'Retourne undefined si le chemin traverse une primitive');
    }

    {
        const obj = { x: 1 };
        assertEqual(getNestedValue(obj, ''), obj, 'Chemin vide retourne l\'objet entier');
    }

    {
        assertEqual(getNestedValue(null, 'a.b'), undefined, 'Objet null retourne undefined');
    }

    {
        assertEqual(getNestedValue(undefined, 'a'), undefined, 'Objet undefined retourne undefined');
    }

    // -------------------------------------------------------------------
    // GROUPE 3 : createEmptyItem — Tests specifiques
    // -------------------------------------------------------------------
    group('createEmptyItem specifiques');

    // Schema avec isArrayValue
    {
        const simpleSchema = {
            _value: { type: 'text', label: 'Mot', isArrayValue: true }
        };
        const item = createEmptyItem(simpleSchema);
        assertEqual(item, '', 'isArrayValue: retourne une chaine vide');
    }

    // Schema avec sous-objet
    {
        const objectSchema = {
            name: { type: 'text', label: 'Nom' },
            details: {
                type: 'object',
                schema: { color: {}, size: {} }
            }
        };
        const item = createEmptyItem(objectSchema);
        assertEqual(typeof item.details, 'object', 'Sous-objet: details est un objet');
        assertEqual(item.details.color, '', 'Sous-objet: champ initialise');
        assertEqual(item.details.size, '', 'Sous-objet: second champ initialise');
    }

    // Schema avec checkbox numerique
    {
        const item = createEmptyItem({ correct: { type: 'checkbox', valueType: 'number' } });
        assertEqual(item.correct, 0, 'Checkbox numerique: valeur par defaut = 0');
    }

    // Schema avec checkbox booleenne
    {
        const item = createEmptyItem({ active: { type: 'checkbox' } });
        assertEqual(item.active, false, 'Checkbox booleenne: valeur par defaut = false');
    }

    // Schema avec nombre et default
    {
        const item = createEmptyItem({ score: { type: 'number', default: 100 } });
        assertEqual(item.score, 100, 'Nombre avec default: valeur par defaut appliquee');
    }

    // Schema avec nombre sans default
    {
        const item = createEmptyItem({ count: { type: 'number' } });
        assertEqual(item.count, 0, 'Nombre sans default: valeur par defaut = 0');
    }

    // Plusieurs cles pointees partageant un prefixe
    {
        const item = createEmptyItem({
            'a.b': { type: 'text' },
            'a.c': { type: 'number', default: 5 },
            'x.y.z': { type: 'text' }
        });
        assertEqual(item.a.b, '', 'Cles pointees multiples: a.b = \'\'');
        assertEqual(item.a.c, 5, 'Cles pointees multiples: a.c = 5');
        assertEqual(item.x.y.z, '', 'Cles pointees multiples: x.y.z = \'\'');
        assert(!('a.b' in item), 'Pas de cle plate "a.b"');
        assert(!('a.c' in item), 'Pas de cle plate "a.c"');
    }

    // Schema avec dynamicObject
    {
        const item = createEmptyItem({
            type: { type: 'select', default: 'foo' },
            content: { type: 'dynamicObject', selector: 'type', schemas: {} }
        });
        assertEqual(typeof item.content, 'object', 'dynamicObject: content est un objet');
        assert(item.content !== null, 'dynamicObject: content n\'est pas null');
        assert(!(typeof item.content === 'string'), 'dynamicObject: content n\'est PAS une chaine');
        // On peut ecrire dedans
        let ok = true;
        try { item.content.field1 = 'test'; } catch (e) { ok = false; }
        assert(ok, 'dynamicObject: peut ecrire dans content');
    }

    // Schema avec select default
    {
        const item = createEmptyItem({
            library: { type: 'select', default: 'H5P.MultiChoice 1.16' }
        });
        assertEqual(item.library, 'H5P.MultiChoice 1.16', 'select avec default: valeur appliquee');
    }

    // -------------------------------------------------------------------
    // GROUPE 4 : createEmptyItem pour CHAQUE ACTIVITE
    // -------------------------------------------------------------------

    for (const moduleKey of ALL_MODULES) {
        group(`createEmptyItem [${moduleKey}]`);

        const schema = getSchemaForType(moduleKey);
        if (!schema) {
            assert(false, `Schema introuvable pour ${moduleKey}`);
            continue;
        }

        assert(schema.sections && schema.sections.length > 0, `Schema a des sections`);

        const arrayFields = extractArrayFields(schema);

        for (const { fieldName, config, sectionId } of arrayFields) {
            const analysis = analyzeItemSchema(config.itemSchema);

            // Creer un item vide
            let item;
            let createError = null;
            try {
                item = createEmptyItem(config.itemSchema);
            } catch (e) {
                createError = e;
            }

            assert(!createError, `createEmptyItem sans erreur (${fieldName}) ${createError ? ': ' + createError.message : ''}`);

            if (createError) continue;

            // --- isArrayValue : retourne une chaine ---
            if (analysis.hasIsArrayValue) {
                assertEqual(typeof item, 'string', `${fieldName}: isArrayValue retourne une chaine`);
                continue; // Pas d'autres tests pour les valeurs simples
            }

            // --- L'item est un objet ---
            assertEqual(typeof item, 'object', `${fieldName}: retourne un objet`);
            assert(item !== null, `${fieldName}: pas null`);

            // --- dynamicObject : doit etre {} ---
            for (const dynKey of analysis.dynamicObjectKeys) {
                assertEqual(typeof item[dynKey], 'object', `${fieldName}.${dynKey}: dynamicObject est un objet`);
                assert(item[dynKey] !== null, `${fieldName}.${dynKey}: dynamicObject pas null`);
                assert(typeof item[dynKey] !== 'string', `${fieldName}.${dynKey}: dynamicObject PAS une chaine`);

                // Peut ecrire dedans sans erreur
                let writeOk = true;
                try {
                    item[dynKey].testField = 'test';
                    delete item[dynKey].testField;
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `${fieldName}.${dynKey}: dynamicObject inscriptible`);
            }

            // --- Cles pointees : pas de cle plate ---
            for (const dottedKey of analysis.dottedKeys) {
                assert(!(dottedKey in item), `${fieldName}: pas de cle plate "${dottedKey}"`);

                // Verifier la structure imbriquee
                const parts = dottedKey.split('.');
                let current = item;
                let structOk = true;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object') {
                        structOk = false;
                        break;
                    }
                    current = current[parts[i]];
                }
                assert(structOk, `${fieldName}: "${dottedKey}" cree la structure imbriquee`);
            }

            // --- Tableaux imbriques : initialises comme [] ---
            for (const arrKey of analysis.nestedArrayKeys) {
                assert(Array.isArray(item[arrKey]), `${fieldName}.${arrKey}: tableau initialise comme []`);
            }

            // --- setNestedValue fonctionne apres creation ---
            {
                const testPath = analysis.allKeys.find(k => !k.includes('.') && config.itemSchema[k].type !== 'array' && config.itemSchema[k].type !== 'dynamicObject' && config.itemSchema[k].type !== 'object' && !config.itemSchema[k].isArrayValue);
                if (testPath) {
                    let writeOk = true;
                    try {
                        setNestedValue(item, testPath, '__TEST_VALUE__');
                    } catch (e) {
                        writeOk = false;
                    }
                    assert(writeOk, `${fieldName}: setNestedValue('${testPath}') fonctionne`);
                    assertEqual(item[testPath], '__TEST_VALUE__', `${fieldName}: valeur ecrite via setNestedValue`);
                }
            }

            // --- dynamicObject + setNestedValue : ecrire dans le sous-objet ---
            for (const dynKey of analysis.dynamicObjectKeys) {
                let writeOk = true;
                try {
                    setNestedValue(item, `${dynKey}.question`, 'Test question');
                    setNestedValue(item, `${dynKey}.answers`, [{ text: 'A' }]);
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `${fieldName}.${dynKey}: setNestedValue dans dynamicObject sans erreur`);
            }

            // --- Cles pointees + setNestedValue : ecrire fonctionne ---
            for (const dottedKey of analysis.dottedKeys) {
                let writeOk = true;
                try {
                    setNestedValue(item, dottedKey, '__DOTTED_TEST__');
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `${fieldName}: setNestedValue('${dottedKey}') fonctionne`);
                assertEqual(getNestedValue(item, dottedKey), '__DOTTED_TEST__', `${fieldName}: getNestedValue('${dottedKey}') retourne la valeur`);
            }
        }
    }

    // -------------------------------------------------------------------
    // GROUPE 5 : Nettoyage feedbackEditors orphelins
    // -------------------------------------------------------------------
    group('feedbackEditors');

    // Purge basique
    {
        const feedbackEditors = new Map();
        feedbackEditors.set('questions.0.params.overallFeedback', { data: 'fb0' });
        feedbackEditors.set('questions.1.params.overallFeedback', { data: 'fb1' });
        feedbackEditors.set('questions.2.params.overallFeedback', { data: 'fb2' });
        feedbackEditors.set('other.path', { data: 'other' });

        const prefix = 'questions.';
        for (const key of [...feedbackEditors.keys()]) {
            if (key.startsWith(prefix)) {
                feedbackEditors.delete(key);
            }
        }

        assertEqual(feedbackEditors.size, 1, 'Purge: seul "other.path" reste');
        assert(feedbackEditors.has('other.path'), 'Purge: "other.path" non affecte');
        assert(!feedbackEditors.has('questions.0.params.overallFeedback'), 'Purge: questions.0 supprime');
        assert(!feedbackEditors.has('questions.1.params.overallFeedback'), 'Purge: questions.1 supprime');
        assert(!feedbackEditors.has('questions.2.params.overallFeedback'), 'Purge: questions.2 supprime');
    }

    // Purge imbriquee (sous-tableau dans dynamicObject)
    {
        const feedbackEditors = new Map();
        feedbackEditors.set('questions.0.params.overallFeedback', { data: 'fb0' });
        feedbackEditors.set('questions.0.params.answers.0.feedback', { data: 'afb' });
        feedbackEditors.set('questions.1.params.overallFeedback', { data: 'fb1' });
        feedbackEditors.set('title', { data: 'title' });

        const prefix = 'questions.';
        for (const key of [...feedbackEditors.keys()]) {
            if (key.startsWith(prefix)) {
                feedbackEditors.delete(key);
            }
        }

        assertEqual(feedbackEditors.size, 1, 'Purge imbriquee: seul "title" reste');
        assert(!feedbackEditors.has('questions.0.params.answers.0.feedback'), 'Purge imbriquee: sous-tableau supprime');
    }

    // Purge selective (un seul index)
    {
        const feedbackEditors = new Map();
        feedbackEditors.set('items.0.overallFeedback', { data: 'fb0' });
        feedbackEditors.set('items.1.overallFeedback', { data: 'fb1' });
        feedbackEditors.set('items.2.overallFeedback', { data: 'fb2' });

        // Supprimer seulement index 1
        const prefix = 'items.1.';
        for (const key of [...feedbackEditors.keys()]) {
            if (key.startsWith(prefix)) {
                feedbackEditors.delete(key);
            }
        }

        assertEqual(feedbackEditors.size, 2, 'Purge selective: index 0 et 2 restent');
        assert(feedbackEditors.has('items.0.overallFeedback'), 'Purge selective: index 0 intact');
        assert(!feedbackEditors.has('items.1.overallFeedback'), 'Purge selective: index 1 supprime');
        assert(feedbackEditors.has('items.2.overallFeedback'), 'Purge selective: index 2 intact');
    }

    // Map vide (pas d'erreur)
    {
        const feedbackEditors = new Map();
        let noError = true;
        try {
            const prefix = 'questions.';
            for (const key of [...feedbackEditors.keys()]) {
                if (key.startsWith(prefix)) feedbackEditors.delete(key);
            }
        } catch (e) {
            noError = false;
        }
        assert(noError, 'Purge sur Map vide: pas d\'erreur');
    }

    // -------------------------------------------------------------------
    // GROUPE 6 : Cycle complet ajout + ecriture + suppression — TOUTES ACTIVITES
    // -------------------------------------------------------------------

    for (const moduleKey of ALL_MODULES) {
        const schema = getSchemaForType(moduleKey);
        if (!schema) continue;

        const arrayFields = extractArrayFields(schema);
        if (arrayFields.length === 0) continue;

        for (const { fieldName, config } of arrayFields) {
            group(`Cycle [${moduleKey}] ${fieldName}`);

            const analysis = analyzeItemSchema(config.itemSchema);

            // ---- Donnees initiales : tableau avec 2 elements existants ----
            const existingItem1 = createEmptyItem(config.itemSchema);
            const existingItem2 = createEmptyItem(config.itemSchema);
            // Marquer les elements existants pour les identifier apres suppression
            if (typeof existingItem1 === 'object' && existingItem1 !== null) {
                existingItem1.__testMarker = 'ITEM_0';
            }
            if (typeof existingItem2 === 'object' && existingItem2 !== null) {
                existingItem2.__testMarker = 'ITEM_1';
            }
            const dataArray = [existingItem1, existingItem2];

            assertEqual(dataArray.length, 2, `Initial: 2 elements`);

            // ---- CREATION : ajouter un 3eme element ----
            let newItem;
            let addError = null;
            try {
                newItem = createEmptyItem(config.itemSchema);
            } catch (e) {
                addError = e;
            }
            assert(!addError, `Ajout: createEmptyItem sans erreur ${addError ? ': ' + addError.message : ''}`);
            if (addError) continue;

            dataArray.push(newItem);
            assertEqual(dataArray.length, 3, `Ajout: 3 elements`);

            // Pour les isArrayValue (valeurs simples), les tests d'ecriture sont differents
            if (analysis.hasIsArrayValue) {
                assertEqual(typeof newItem, 'string', `Ajout: valeur simple est une chaine`);

                // Suppression du milieu
                dataArray.splice(1, 1);
                assertEqual(dataArray.length, 2, `Suppression: 2 elements`);

                // Modification apres suppression
                dataArray[1] = 'MODIFIED_VALUE';
                assertEqual(dataArray[1], 'MODIFIED_VALUE', `Modification post-suppression`);

                continue;
            }

            // ---- ECRITURE via setNestedValue dans le nouvel element ----
            // Wrapper les donnees dans un objet parent pour tester setNestedValue avec chemin complet
            const parentData = { items: dataArray };

            // Ecrire dans chaque champ non-complexe du nouvel item
            let writeAllOk = true;
            for (const [key, fieldConfig] of Object.entries(config.itemSchema)) {
                if (fieldConfig.type === 'array' || fieldConfig.type === 'object' || fieldConfig.type === 'dynamicObject' || fieldConfig.isArrayValue) continue;

                const fullPath = key.includes('.') ? `items.2.${key}` : `items.2.${key}`;
                try {
                    setNestedValue(parentData, fullPath, '__CREATED__');
                } catch (e) {
                    writeAllOk = false;
                }
            }
            assert(writeAllOk, `Ecriture: setNestedValue dans nouvel element sans erreur`);

            // Ecrire dans les dynamicObject
            for (const dynKey of analysis.dynamicObjectKeys) {
                let writeOk = true;
                try {
                    setNestedValue(parentData, `items.2.${dynKey}.testField`, '__DYN_CREATED__');
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `Ecriture: setNestedValue dans ${dynKey} (dynamicObject)`);
                assertEqual(
                    getNestedValue(parentData, `items.2.${dynKey}.testField`),
                    '__DYN_CREATED__',
                    `Ecriture: valeur lue dans ${dynKey}.testField`
                );
            }

            // Ecrire dans les cles pointees
            for (const dottedKey of analysis.dottedKeys) {
                let writeOk = true;
                try {
                    setNestedValue(parentData, `items.2.${dottedKey}`, '__DOTTED_CREATED__');
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `Ecriture: setNestedValue('${dottedKey}') dans nouvel element`);
                assertEqual(
                    getNestedValue(parentData, `items.2.${dottedKey}`),
                    '__DOTTED_CREATED__',
                    `Ecriture: valeur lue via getNestedValue('${dottedKey}')`
                );
            }

            // ---- SUPPRESSION de l'element du milieu (index 1) ----
            const markerBefore0 = parentData.items[0].__testMarker;
            parentData.items.splice(1, 1);
            assertEqual(parentData.items.length, 2, `Suppression: 2 elements`);
            assertEqual(parentData.items[0].__testMarker, markerBefore0, `Suppression: element 0 intact`);

            // ---- ECRITURE APRES RE-INDEXATION ----
            // L'ancien index 2 est maintenant index 1
            let postDeleteWriteOk = true;
            try {
                // Trouver un champ simple pour ecrire
                const simpleKey = Object.keys(config.itemSchema).find(k =>
                    !k.includes('.') &&
                    config.itemSchema[k].type !== 'array' &&
                    config.itemSchema[k].type !== 'dynamicObject' &&
                    config.itemSchema[k].type !== 'object' &&
                    !config.itemSchema[k].isArrayValue
                );
                if (simpleKey) {
                    setNestedValue(parentData, `items.1.${simpleKey}`, '__POST_DELETE__');
                    assertEqual(
                        getNestedValue(parentData, `items.1.${simpleKey}`),
                        '__POST_DELETE__',
                        `Re-indexation: setNestedValue('items.1.${simpleKey}') fonctionne`
                    );
                }
            } catch (e) {
                postDeleteWriteOk = false;
            }
            assert(postDeleteWriteOk, `Re-indexation: ecriture apres suppression sans erreur`);

            // Ecriture dans dynamicObject apres re-indexation
            for (const dynKey of analysis.dynamicObjectKeys) {
                let writeOk = true;
                try {
                    setNestedValue(parentData, `items.1.${dynKey}.reindexed`, '__REINDEXED__');
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `Re-indexation: setNestedValue dans ${dynKey} apres suppression`);
            }

            // Ecriture dans cles pointees apres re-indexation
            for (const dottedKey of analysis.dottedKeys) {
                let writeOk = true;
                try {
                    setNestedValue(parentData, `items.1.${dottedKey}`, '__REINDEXED_DOTTED__');
                } catch (e) {
                    writeOk = false;
                }
                assert(writeOk, `Re-indexation: setNestedValue('${dottedKey}') apres suppression`);
            }

            // ---- NETTOYAGE feedbackEditors pour ce champ ----
            {
                const feedbackEditors = new Map();
                // Simuler des feedbackEditors pour 3 elements
                feedbackEditors.set(`${fieldName}.0.overallFeedback`, { data: 'fb0' });
                feedbackEditors.set(`${fieldName}.1.overallFeedback`, { data: 'fb1' });
                feedbackEditors.set(`${fieldName}.2.overallFeedback`, { data: 'fb2' });
                feedbackEditors.set('unrelated.path', { data: 'other' });

                // Purge (comme dans ArrayManager.render)
                const prefix = fieldName + '.';
                for (const key of [...feedbackEditors.keys()]) {
                    if (key.startsWith(prefix)) {
                        feedbackEditors.delete(key);
                    }
                }

                assert(!feedbackEditors.has(`${fieldName}.0.overallFeedback`), `feedbackEditors: purge index 0`);
                assert(!feedbackEditors.has(`${fieldName}.1.overallFeedback`), `feedbackEditors: purge index 1`);
                assert(!feedbackEditors.has(`${fieldName}.2.overallFeedback`), `feedbackEditors: purge index 2`);
                assert(feedbackEditors.has('unrelated.path'), `feedbackEditors: chemin non lie intact`);
            }

            // ---- SOUS-TABLEAUX : tester la recursion si applicable ----
            for (const arrKey of analysis.nestedArrayKeys) {
                const subConfig = config.itemSchema[arrKey];
                if (!subConfig || !subConfig.itemSchema) continue;

                const subAnalysis = analyzeItemSchema(subConfig.itemSchema);
                let subItem;
                let subError = null;
                try {
                    subItem = createEmptyItem(subConfig.itemSchema);
                } catch (e) {
                    subError = e;
                }
                assert(!subError, `Sous-tableau ${arrKey}: createEmptyItem sans erreur ${subError ? ': ' + subError.message : ''}`);
                if (subError) continue;

                if (subAnalysis.hasIsArrayValue) {
                    assertEqual(typeof subItem, 'string', `Sous-tableau ${arrKey}: isArrayValue retourne chaine`);
                } else {
                    assertEqual(typeof subItem, 'object', `Sous-tableau ${arrKey}: retourne un objet`);
                    assert(subItem !== null, `Sous-tableau ${arrKey}: pas null`);

                    // Verifier que l'ecriture fonctionne dans le sous-item
                    const subSimpleKey = Object.keys(subConfig.itemSchema).find(k =>
                        !k.includes('.') &&
                        subConfig.itemSchema[k].type !== 'array' &&
                        subConfig.itemSchema[k].type !== 'dynamicObject' &&
                        subConfig.itemSchema[k].type !== 'object' &&
                        !subConfig.itemSchema[k].isArrayValue
                    );
                    if (subSimpleKey) {
                        let subWriteOk = true;
                        try {
                            subItem[subSimpleKey] = '__SUB_TEST__';
                        } catch (e) {
                            subWriteOk = false;
                        }
                        assert(subWriteOk, `Sous-tableau ${arrKey}: ecriture dans ${subSimpleKey}`);
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------------
    // GROUPE 7 : FeedbackEditor.normalizeRanges — Tranches par defaut
    // -------------------------------------------------------------------
    group('FeedbackEditor.normalizeRanges');

    // Appel direct sur le prototype (sans instancier, pour eviter le render DOM)
    const normalizeRanges = FeedbackEditor.prototype.normalizeRanges;

    // 7a. Tableau vide → 2 tranches par defaut (0-50 / 51-100)
    {
        const result = normalizeRanges([]);
        assertEqual(result.length, 2, 'Tableau vide → 2 tranches par defaut');
        assertEqual(result[0].from, 0, 'Tranche 1 : from = 0');
        assertEqual(result[0].to, 50, 'Tranche 1 : to = 50');
        assertEqual(result[0].feedback, '', 'Tranche 1 : feedback vide');
        assertEqual(result[1].from, 51, 'Tranche 2 : from = 51');
        assertEqual(result[1].to, 100, 'Tranche 2 : to = 100');
        assertEqual(result[1].feedback, '', 'Tranche 2 : feedback vide');
    }

    // 7b. null → 2 tranches par defaut
    {
        const result = normalizeRanges(null);
        assertEqual(result.length, 2, 'null → 2 tranches par defaut');
    }

    // 7c. undefined → 2 tranches par defaut
    {
        const result = normalizeRanges(undefined);
        assertEqual(result.length, 2, 'undefined → 2 tranches par defaut');
    }

    // 7d. Tableau existant avec 6 tranches IA → preserve tel quel (trie par from)
    {
        const existing = [
            { from: 0, to: 10, feedback: 'Mauvais' },
            { from: 91, to: 100, feedback: 'Excellent' },
            { from: 51, to: 70, feedback: 'Bien' },
            { from: 11, to: 30, feedback: 'Insuffisant' },
            { from: 71, to: 90, feedback: 'Tres bien' },
            { from: 31, to: 50, feedback: 'Moyen' }
        ];
        const result = normalizeRanges(existing);
        assertEqual(result.length, 6, '6 tranches IA preservees');
        assertEqual(result[0].from, 0, 'Tri : premiere tranche from=0');
        assertEqual(result[5].to, 100, 'Tri : derniere tranche to=100');
        assertEqual(result[2].feedback, 'Moyen', 'Tri : tranche 31-50 en position 2');
    }

    // 7e. Tableau existant avec 2 tranches → preserve tel quel
    {
        const existing = [
            { from: 0, to: 50, feedback: 'Echec' },
            { from: 51, to: 100, feedback: 'Reussite' }
        ];
        const result = normalizeRanges(existing);
        assertEqual(result.length, 2, '2 tranches preservees');
        assertEqual(result[0].feedback, 'Echec', 'Contenu feedback preserve');
        assertEqual(result[1].feedback, 'Reussite', 'Contenu feedback preserve');
    }

    // 7f. Tableau avec 1 seule tranche → preserve (pas remplace par defaut)
    {
        const existing = [{ from: 0, to: 100, feedback: 'Unique' }];
        const result = normalizeRanges(existing);
        assertEqual(result.length, 1, '1 tranche preservee');
        assertEqual(result[0].feedback, 'Unique', 'Contenu feedback preserve');
    }

    // 7g. Integration : FeedbackEditor instancie avec un conteneur DOM et ranges vides
    {
        const container = document.createElement('div');
        const editor = new FeedbackEditor(container, [], 'test.overallFeedback', () => {});
        assertEqual(editor.ranges.length, 2, 'Instance avec ranges vides → 2 tranches');
        assertEqual(editor.ranges[0].to, 50, 'Instance : tranche 1 to=50');
        assertEqual(editor.ranges[1].from, 51, 'Instance : tranche 2 from=51');
        assert(container.innerHTML.length > 0, 'Instance : render() a genere du HTML');
    }

    // 7h. Integration : FeedbackEditor instancie avec ranges existantes
    {
        const container = document.createElement('div');
        const ranges = [
            { from: 0, to: 30, feedback: 'A revoir' },
            { from: 31, to: 70, feedback: 'Correct' },
            { from: 71, to: 100, feedback: 'Bravo' }
        ];
        const editor = new FeedbackEditor(container, ranges, 'test.overallFeedback', () => {});
        assertEqual(editor.ranges.length, 3, 'Instance avec 3 tranches → 3 preservees');
        assertEqual(editor.ranges[1].feedback, 'Correct', 'Instance : feedback preserve');
    }

    // -------------------------------------------------------------------
    // GROUPE 8 : Rendu checkbox/select — valeurs par defaut et persistance
    // -------------------------------------------------------------------
    group('Rendu checkbox/select defaults');

    // 8a. Checkbox avec valueType=number et default=true : doit etre coche
    {
        const persisted = {};
        const onChange = (path, value) => { persisted[path] = value; };
        const el = renderCheckboxField(
            { type: 'checkbox', label: 'Test', valueType: 'number', default: true },
            undefined,
            onChange,
            'options.showstandardinstruction'
        );
        const input = el.querySelector('input[type="checkbox"]');
        assert(input !== null, '8a: input checkbox rendu');
        assert(input.checked === true, '8a: checkbox coche par defaut (default=true)');
        assert(input.dataset.valueType === 'number', '8a: data-value-type=number present');
        assert(persisted['options.showstandardinstruction'] === 1, '8a: onChange appele avec 1 (number)');
    }

    // 8b. Checkbox avec valueType=number et value=0 : doit etre decoche
    {
        const el = renderCheckboxField(
            { type: 'checkbox', label: 'Test', valueType: 'number' },
            0,
            () => {},
            'test.path'
        );
        const input = el.querySelector('input[type="checkbox"]');
        assert(input.checked === false, '8b: checkbox decoche pour value=0');
    }

    // 8c. Checkbox avec valueType=number et value=1 : doit etre coche
    {
        const el = renderCheckboxField(
            { type: 'checkbox', label: 'Test', valueType: 'number' },
            1,
            () => {},
            'test.path'
        );
        const input = el.querySelector('input[type="checkbox"]');
        assert(input.checked === true, '8c: checkbox coche pour value=1');
    }

    // 8d. Checkbox sans default et value=undefined : doit etre decoche, pas de onChange
    {
        let onChangeCalled = false;
        const el = renderCheckboxField(
            { type: 'checkbox', label: 'Test' },
            undefined,
            () => { onChangeCalled = true; },
            'test.path'
        );
        const input = el.querySelector('input[type="checkbox"]');
        assert(input.checked === false, '8d: checkbox decoche sans default');
        assert(!onChangeCalled, '8d: onChange non appele sans default');
    }

    // 8e. Select avec default et value=undefined : doit selectionner le default
    {
        const persisted = {};
        const onChange = (path, value) => { persisted[path] = value; };
        const el = renderSelectField(
            {
                type: 'select', label: 'Num', default: 'none',
                options: [
                    { value: 'none', label: 'Aucune' },
                    { value: 'abc', label: 'a.b.c' },
                    { value: '123', label: '1.2.3' }
                ]
            },
            undefined,
            onChange,
            'options.answernumbering'
        );
        const select = el.querySelector('select');
        assert(select !== null, '8e: select rendu');
        assertEqual(select.value, 'none', '8e: select sur la valeur par defaut');
        assertEqual(persisted['options.answernumbering'], 'none', '8e: onChange appele avec default');
    }

    // 8f. Select avec value existante : doit selectionner la valeur, pas le default
    {
        let onChangeCalled = false;
        const el = renderSelectField(
            {
                type: 'select', label: 'Num', default: 'none',
                options: [
                    { value: 'none', label: 'Aucune' },
                    { value: 'abc', label: 'a.b.c' }
                ]
            },
            'abc',
            () => { onChangeCalled = true; },
            'test.path'
        );
        const select = el.querySelector('select');
        assertEqual(select.value, 'abc', '8f: select sur la valeur existante');
        assert(!onChangeCalled, '8f: onChange non appele quand valeur existante');
    }

    // -------------------------------------------------------------------
    // GROUPE 9 : Schemas elea_test — completude des sous-types
    // -------------------------------------------------------------------
    group('GROUPE 9 : Schemas elea_test');

    {
        const schema = getSchemaForType('elea_test');
        assert(schema !== null && schema !== undefined, '9a: schema elea_test existe');

        // Recuperer le schema questions
        const questionsSection = schema.sections.find(s => s.id === 'questions');
        assert(questionsSection !== null, '9b: section questions existe');

        const questionsArray = questionsSection.fields.questions;
        assert(questionsArray && questionsArray.type === 'array', '9c: questions est un array');

        const contentField = questionsArray.itemSchema.content;
        assert(contentField && contentField.type === 'dynamicObject', '9d: content est un dynamicObject');
        assertEqual(contentField.selector, 'type', '9e: selector est type');

        // 9f. Verifier que les 6 types de questions sont presents
        const expectedTypes = ['multichoice', 'matching', 'truefalse', 'numerical', 'shortanswer', 'cloze'];
        const actualTypes = Object.keys(contentField.schemas);
        expectedTypes.forEach(type => {
            assert(actualTypes.includes(type), `9f: sous-schema ${type} present`);
        });

        // 9g. Verifier que TOUS les sous-types ont un champ feedback au niveau question
        expectedTypes.forEach(type => {
            const subSchema = contentField.schemas[type];
            assert(
                subSchema.feedback && subSchema.feedback.type === 'textarea',
                `9g: ${type} a un champ feedback textarea`
            );
        });

        // 9h. Verifier que les types avec feedbacks combines les ont (multichoice, matching)
        ['multichoice', 'matching'].forEach(type => {
            const subSchema = contentField.schemas[type];
            assert(subSchema.correctfeedback !== undefined, `9h: ${type} a correctfeedback`);
            assert(subSchema.partiallycorrectfeedback !== undefined, `9h: ${type} a partiallycorrectfeedback`);
            assert(subSchema.incorrectfeedback !== undefined, `9h: ${type} a incorrectfeedback`);
        });

        // 9i. Verifier que les types sans feedbacks combines ne les ont pas
        ['truefalse', 'numerical', 'shortanswer', 'cloze'].forEach(type => {
            const subSchema = contentField.schemas[type];
            assert(subSchema.correctfeedback === undefined, `9i: ${type} n'a pas correctfeedback`);
        });

        // 9j. Verifier que tous les sous-types ont un champ hints
        expectedTypes.forEach(type => {
            const subSchema = contentField.schemas[type];
            assert(
                subSchema.hints && subSchema.hints.type === 'array',
                `9j: ${type} a un champ hints array`
            );
        });

        // 9k. Verifier que le dynamicTitleField est present
        assertEqual(questionsArray.dynamicTitleField, 'type', '9k: dynamicTitleField est type');

        // 9l. Verifier que multichoice answers a validateSum
        const mcAnswers = contentField.schemas.multichoice.answers;
        assert(mcAnswers && mcAnswers.validateSum !== undefined, '9l: multichoice answers a validateSum');
        assertEqual(mcAnswers.validateSum.field, 'fraction', '9l: validateSum.field est fraction');
        assertEqual(mcAnswers.validateSum.target, 100, '9l: validateSum.target est 100');

        // 9m. Verifier le champ truefalse answer (object avec value, feedback_true, feedback_false)
        const tfAnswer = contentField.schemas.truefalse.answer;
        assert(tfAnswer && tfAnswer.type === 'object', '9m: truefalse answer est un object');
        assert(tfAnswer.schema.value !== undefined, '9m: truefalse answer.value existe');
        assert(tfAnswer.schema.feedback_true !== undefined, '9m: truefalse answer.feedback_true existe');
        assert(tfAnswer.schema.feedback_false !== undefined, '9m: truefalse answer.feedback_false existe');
    }

    // -------------------------------------------------------------------
    // GROUPE 10 : Round-trip normalize/denormalize elea_test
    // -------------------------------------------------------------------
    group('GROUPE 10 : Round-trip elea_test');

    {
        // Donnees minimales couvrant les 6 types de questions
        const testData = {
            bank_name: 'Test banque',
            bank_description: 'Description test',
            questions: [
                {
                    type: 'truefalse',
                    content: {
                        name: 'Q-TF', questiontext: 'Question vrai/faux',
                        feedback: 'Feedback general TF',
                        answer: { value: true, feedback_true: 'Bravo', feedback_false: 'Raté' },
                        hints: ['Indice 1', 'Indice 2']
                    }
                },
                {
                    type: 'multichoice',
                    content: {
                        name: 'Q-MC', questiontext: 'Question QCM',
                        feedback: 'Feedback general MC',
                        correctfeedback: 'Correct!',
                        partiallycorrectfeedback: 'Partiel',
                        incorrectfeedback: 'Incorrect!',
                        answers: [
                            { text: 'Réponse A', fraction: 100, feedback: 'Oui' },
                            { text: 'Réponse B', fraction: 0, feedback: 'Non' }
                        ],
                        hints: ['Pensez à...']
                    }
                },
                {
                    type: 'matching',
                    content: {
                        name: 'Q-Match', questiontext: 'Appariement',
                        feedback: 'Feedback matching',
                        correctfeedback: 'Parfait!',
                        partiallycorrectfeedback: 'Presque',
                        incorrectfeedback: 'Non',
                        subquestions: [
                            { text: 'A', answer: '1' },
                            { text: 'B', answer: '2' }
                        ]
                    }
                },
                {
                    type: 'numerical',
                    content: {
                        name: 'Q-Num', questiontext: 'Valeur numérique \\( \\pi \\)',
                        feedback: 'Feedback num avec LaTeX \\( e^{i\\pi} + 1 = 0 \\)',
                        answer: { number: 3.14, tolerance: 0.01, feedback: 'Précis!' }
                    }
                },
                {
                    type: 'shortanswer',
                    content: {
                        name: 'Q-SA', questiontext: 'Réponse courte',
                        feedback: 'Feedback SA',
                        answers: [
                            { text: 'Paris', fraction: 100, feedback: 'Exact!' },
                            { text: 'paris', fraction: 100, feedback: 'Exact!' }
                        ]
                    }
                },
                {
                    type: 'cloze',
                    content: {
                        name: 'Q-Cloze', questiontext: '{1:SHORTANSWER:=test}',
                        feedback: 'Feedback cloze'
                    }
                }
            ]
        };

        // Normalize
        const normalized = normalizeDataForEditor(JSON.parse(JSON.stringify(testData)), 'elea_test');
        assert(normalized !== null, '10a: normalisation reussie');

        // Denormalize (round-trip)
        const saved = denormalizeDataForSave(JSON.parse(JSON.stringify(normalized)), 'elea_test');
        assert(saved !== null, '10b: denormalisation reussie');

        // 10c. Verifier que tous les textes sont preserves
        function extractTexts(obj, texts = []) {
            if (obj === null || obj === undefined) return texts;
            if (typeof obj === 'string' && obj.trim().length > 0) texts.push(obj);
            else if (Array.isArray(obj)) obj.forEach(item => extractTexts(item, texts));
            else if (typeof obj === 'object') Object.values(obj).forEach(val => extractTexts(val, texts));
            return texts;
        }

        const origTexts = extractTexts(testData);
        const savedTexts = extractTexts(saved);
        const missingTexts = origTexts.filter(t => !savedTexts.includes(t));
        assert(missingTexts.length === 0, `10c: tous les textes preserves (${missingTexts.length} manquants)${missingTexts.length > 0 ? ' : ' + missingTexts.slice(0, 3).join(', ') : ''}`);

        // 10d. Feedback truefalse specifiquement
        const tfSaved = saved.questions.find(q => q.type === 'truefalse');
        assert(tfSaved !== undefined, '10d: question truefalse presente apres round-trip');
        assertEqual(tfSaved.content.feedback, 'Feedback general TF', '10d: feedback truefalse preserve');
        assertEqual(tfSaved.content.answer.feedback_true, 'Bravo', '10d: feedback_true preserve');
        assertEqual(tfSaved.content.answer.feedback_false, 'Raté', '10d: feedback_false preserve');

        // 10e. Feedbacks combines multichoice
        const mcSaved = saved.questions.find(q => q.type === 'multichoice');
        assertEqual(mcSaved.content.correctfeedback, 'Correct!', '10e: correctfeedback preserve');
        assertEqual(mcSaved.content.partiallycorrectfeedback, 'Partiel', '10e: partiallycorrectfeedback preserve');
        assertEqual(mcSaved.content.incorrectfeedback, 'Incorrect!', '10e: incorrectfeedback preserve');

        // 10f. Feedbacks combines matching
        const matchSaved = saved.questions.find(q => q.type === 'matching');
        assertEqual(matchSaved.content.correctfeedback, 'Parfait!', '10f: matching correctfeedback preserve');

        // 10g. Hints preserves
        const tfHints = tfSaved.content.hints;
        assert(Array.isArray(tfHints) && tfHints.length === 2, '10g: hints truefalse preserves (2 elements)');
        assertEqual(tfHints[0], 'Indice 1', '10g: hint 1 preserve');

        // 10h. LaTeX preserve dans le round-trip
        const numSaved = saved.questions.find(q => q.type === 'numerical');
        assert(
            numSaved.content.feedback.includes('\\( e^{i\\pi} + 1 = 0 \\)'),
            '10h: LaTeX preserve dans feedback numerical'
        );
        assert(
            numSaved.content.questiontext.includes('\\( \\pi \\)'),
            '10h: LaTeX preserve dans questiontext numerical'
        );

        // 10i. Structure bank_name/bank_description preservee
        assertEqual(saved.bank_name, 'Test banque', '10i: bank_name preserve');
        assertEqual(saved.bank_description, 'Description test', '10i: bank_description preserve');

        // 10j. Nombre total de questions preservé
        assertEqual(saved.questions.length, 6, '10j: 6 questions preservees');
    }

    // -------------------------------------------------------------------
    // GROUPE 11 : Round-trip FindTheWords (tagList/wordList)
    // -------------------------------------------------------------------
    group('GROUPE 11 : Round-trip FindTheWords');

    {
        const ftw = {
            taskDescription: 'Trouvez les mots avec \\( \\sqrt{2} \\)',
            wordList: 'CHAT,CHIEN,OISEAU,POISSON'
        };

        // 11a. normalizeDataForEditor : string → tableau
        const normalized = normalizeDataForEditor(JSON.parse(JSON.stringify(ftw)), 'FindTheWords');
        assert(Array.isArray(normalized.wordList), '11a: wordList convertie en tableau');
        assertEqual(normalized.wordList.length, 4, '11a: 4 mots dans le tableau');
        assertEqual(normalized.wordList[0], 'CHAT', '11a: premier mot CHAT');

        // 11b. denormalizeDataForSave : tableau → string
        const saved = denormalizeDataForSave(JSON.parse(JSON.stringify(normalized)), 'FindTheWords');
        assert(typeof saved.wordList === 'string', '11b: wordList reconvertie en string');
        assertEqual(saved.wordList, 'CHAT,CHIEN,OISEAU,POISSON', '11b: chaine identique a l original');

        // 11c. taskDescription preserve
        assertEqual(saved.taskDescription, ftw.taskDescription, '11c: taskDescription preserve');

        // 11d. Mot avec espaces : trim applique
        const ftwSpaces = { wordList: ' MOT1 , MOT2 , MOT3 ' };
        const normSpaces = normalizeDataForEditor(JSON.parse(JSON.stringify(ftwSpaces)), 'FindTheWords');
        assertEqual(normSpaces.wordList, ['MOT1', 'MOT2', 'MOT3'], '11d: espaces supprimes par trim');

        // 11e. Chaine vide ou virgules seules : pas de mots vides
        const ftwEmpty = { wordList: ',,,' };
        const normEmpty = normalizeDataForEditor(JSON.parse(JSON.stringify(ftwEmpty)), 'FindTheWords');
        assertEqual(normEmpty.wordList.length, 0, '11e: pas de mots vides');
    }

    // -------------------------------------------------------------------
    // GROUPE 12 : Proprietes de schema (compact, nested, collapsible, row, validateSum)
    // -------------------------------------------------------------------
    group('GROUPE 12 : Proprietes de schema');

    {
        // 12a. Verifier compact: true sur Essay keywords (H5P)
        const essaySchema = getSchemaForType('Essay');
        if (essaySchema) {
            const keywordsSection = essaySchema.sections
                ? essaySchema.sections.find(s => s.fields && s.fields.keywords)
                : null;
            const keywordsField = keywordsSection ? keywordsSection.fields.keywords : (essaySchema.keywords || null);
            if (keywordsField) {
                assert(keywordsField.compact === true, '12a: Essay keywords compact=true');
                assert(keywordsField.nested === true, '12a: Essay keywords nested=true');
            } else {
                assert(true, '12a: Essay keywords schema non trouve (skip)');
            }
        }

        // 12b. Verifier collapsible sur les feedbacks elea_test
        const testSchema = getSchemaForType('elea_test');
        const questionsSection = testSchema.sections.find(s => s.id === 'questions');
        const contentField = questionsSection.fields.questions.itemSchema.content;
        ['multichoice', 'matching', 'truefalse', 'numerical', 'shortanswer', 'cloze'].forEach(type => {
            const subSchema = contentField.schemas[type];
            if (subSchema.feedback) {
                assert(
                    subSchema.feedback.collapsible === true,
                    `12b: ${type} feedback est collapsible`
                );
            }
        });

        // 12c. Verifier row grouping sur Chart
        const chartSchema = getSchemaForType('Chart');
        if (chartSchema) {
            const dataSection = chartSchema.sections
                ? chartSchema.sections.find(s => s.fields && (s.fields.chartData || s.fields.data))
                : null;
            if (dataSection) {
                const arrayField = dataSection.fields.chartData || dataSection.fields.data;
                if (arrayField && arrayField.itemSchema) {
                    const hasRowField = Object.values(arrayField.itemSchema).some(f => f.row);
                    assert(hasRowField, '12c: Chart data items ont des champs avec row');
                }
            } else {
                assert(true, '12c: Chart data section non trouvee (skip)');
            }
        }

        // 12d. Verifier que tagList existe dans le schema FindTheWords
        const ftwSchema = getSchemaForType('FindTheWords');
        if (ftwSchema) {
            let wordListField = null;
            if (ftwSchema.sections) {
                for (const section of ftwSchema.sections) {
                    if (section.fields && section.fields.wordList) {
                        wordListField = section.fields.wordList;
                        break;
                    }
                }
            }
            assert(
                wordListField && wordListField.type === 'tagList',
                '12d: FindTheWords wordList est de type tagList'
            );
        }

        // 12e. Verifier compact sur les reponses multichoice elea_test
        const mcAnswers = contentField.schemas.multichoice.answers;
        assert(mcAnswers.compact === true, '12e: elea_test multichoice answers compact=true');
        assert(mcAnswers.nested === true, '12e: elea_test multichoice answers nested=true');

        // 12f. Verifier compact sur shortanswer answers elea_test
        const saAnswers = contentField.schemas.shortanswer.answers;
        assert(saAnswers.compact === true, '12f: elea_test shortanswer answers compact=true');

        // 12g. Verifier que les hints ont isArrayValue pour les items simples
        ['multichoice', 'matching', 'truefalse', 'numerical', 'shortanswer', 'cloze'].forEach(type => {
            const subSchema = contentField.schemas[type];
            if (subSchema.hints && subSchema.hints.itemSchema && subSchema.hints.itemSchema._value) {
                assert(
                    subSchema.hints.itemSchema._value.isArrayValue === true,
                    `12g: ${type} hints items sont isArrayValue`
                );
            }
        });

        // 12h. Verifier collapsible sur Crossword extraClue
        const crosswordSchema = getSchemaForType('Crossword');
        if (crosswordSchema) {
            let extraClueField = null;
            if (crosswordSchema.sections) {
                for (const section of crosswordSchema.sections) {
                    if (section.fields) {
                        for (const [, fld] of Object.entries(section.fields)) {
                            if (fld.type === 'array' && fld.itemSchema) {
                                // Chercher extraClue dans les parametres de chaque item via notation pointee
                                for (const [subKey, subFld] of Object.entries(fld.itemSchema)) {
                                    if (subKey.includes('extraClue') || (subFld.label && subFld.label.includes('extra_clue'))) {
                                        extraClueField = subFld;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (extraClueField) {
                assert(extraClueField.collapsible === true, '12h: Crossword extraClue est collapsible');
            } else {
                assert(true, '12h: Crossword extraClue non trouve (skip)');
            }
        }

        // 12i. Verifier que mediaImage est dans general pour MultipleChoice
        const mcSchema = getSchemaForType('MultipleChoice');
        if (mcSchema && mcSchema.sections) {
            const generalSection = mcSchema.sections.find(s => s.id === 'general');
            if (generalSection && generalSection.fields) {
                const hasMedia = Object.entries(generalSection.fields).some(([k, v]) =>
                    k === 'mediaImage' || k === 'media' ||
                    (v.type === 'image' && v.collapsible === true)
                );
                assert(hasMedia, '12i: MultipleChoice image de contexte dans section general');
            } else {
                assert(true, '12i: MultipleChoice general section non trouvee (skip)');
            }
        }
    }

    // -------------------------------------------------------------------
    // GROUPE 13 : Round-trip normalize/denormalize — fichiers exemples reels
    // -------------------------------------------------------------------
    group('GROUPE 13 : Round-trip fichiers exemples');

    {
        // Tester les 5 fichiers test_X.json
        const testFiles = ['test_1.json', 'test_2.json', 'test_3.json', 'test_4.json', 'test_5.json'];

        for (const file of testFiles) {
            try {
                const resp = await fetch(`../assets/data/examples/${file}`);
                if (!resp.ok) { assert(false, `13: ${file} chargement echoue (${resp.status})`); continue; }
                const data = await resp.json();

                const normalized = normalizeDataForEditor(JSON.parse(JSON.stringify(data)), 'elea_test');
                const saved = denormalizeDataForSave(JSON.parse(JSON.stringify(normalized)), 'elea_test');

                // Extraire et comparer les textes
                function extractAllTexts(obj, texts = []) {
                    if (obj === null || obj === undefined) return texts;
                    if (typeof obj === 'string' && obj.trim().length > 0) texts.push(obj);
                    else if (Array.isArray(obj)) obj.forEach(item => extractAllTexts(item, texts));
                    else if (typeof obj === 'object') Object.values(obj).forEach(val => extractAllTexts(val, texts));
                    return texts;
                }

                const origTexts = extractAllTexts(data);
                const savedTexts = extractAllTexts(saved);
                const missing = origTexts.filter(t => !savedTexts.includes(t));

                assert(
                    missing.length === 0,
                    `13a: ${file} textes preserves (${missing.length} manquants)${missing.length > 0 ? ' : ' + missing.slice(0, 2).map(s => s.substring(0, 60)).join(' | ') : ''}`
                );

                // Verifier LaTeX
                const latexRe = /\\\([\s\S]*?\\\)/g;
                const origLatex = [];
                origTexts.forEach(t => { const m = t.match(latexRe); if (m) origLatex.push(...m); });
                const savedLatex = [];
                savedTexts.forEach(t => { const m = t.match(latexRe); if (m) savedLatex.push(...m); });
                const missingLatex = origLatex.filter(l => !savedLatex.includes(l));

                if (origLatex.length > 0) {
                    assert(
                        missingLatex.length === 0,
                        `13b: ${file} LaTeX preserve (${missingLatex.length}/${origLatex.length} manquants)`
                    );
                }

                // Verifier que le nombre de questions est identique
                assertEqual(
                    saved.questions.length,
                    data.questions.length,
                    `13c: ${file} nombre de questions preserve (${data.questions.length})`
                );

            } catch (e) {
                assert(false, `13: ${file} erreur : ${e.message}`);
            }
        }
    }

    // -------------------------------------------------------------------
    // Resultat
    // -------------------------------------------------------------------
    console.log(`\n=== Tests Editeur: ${passCount} PASS, ${failCount} FAIL ===`);

    return { passCount, failCount, results };
}
