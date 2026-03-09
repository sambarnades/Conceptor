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
import { getSchemaForType } from '../js/editor/content-detector.js';
import { FeedbackEditor } from '../js/editor/feedback-editor.js';

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
    // Resultat
    // -------------------------------------------------------------------
    console.log(`\n=== Tests Editeur: ${passCount} PASS, ${failCount} FAIL ===`);

    return { passCount, failCount, results };
}
