/**
 * Tests de coherence des definitions de Caramel
 *
 * Verifie que toutes les activites definies dans definitions.js sont correctement
 * cablees : processeurs, prompts, exemples, traductions, images, IDs uniques.
 *
 * Usage : ouvrir tests/test-definitions.html depuis le serveur local.
 */

import { allModules, h5pModules, moodleModules, customOrder } from '../js/core/definitions.js';
import { processH5PContent, getModuleMetadata } from '../js/h5p/processors/index.js';
import { supportedActivities } from '../js/moodle/processors/index.js';

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

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

/** Verifie qu'un fichier existe via fetch HEAD */
async function fileExists(url) {
    try {
        const resp = await fetch(url, { method: 'HEAD' });
        return resp.ok;
    } catch {
        return false;
    }
}

// =======================================================================
// ETAPE 1 : CHAMPS REQUIS DES MODULES
// =======================================================================

async function runStep1_RequiredFields() {
    console.group('Etape 1 : Champs requis des modules');

    // 1a. Modules H5P
    _ctx = { step: 1, stepName: 'Champs requis', file: '', module: '', source: 'h5p' };
    for (const [key, mod] of Object.entries(h5pModules)) {
        _ctx.module = key;
        assert(mod.name && typeof mod.name === 'string',
            `[1a.name] ${key} : name="${mod.name}"`);
        assert(mod.machineName && typeof mod.machineName === 'string',
            `[1a.machine] ${key} : machineName="${mod.machineName}"`);
        assert(mod.description && typeof mod.description === 'string',
            `[1a.desc] ${key} : description="${mod.description}"`);
        assert(mod.image && typeof mod.image === 'string',
            `[1a.image] ${key} : image definie`);
        assert(mod.promptId && typeof mod.promptId === 'string',
            `[1a.promptId] ${key} : promptId="${mod.promptId}"`);
        assert(mod.jsonInputId && typeof mod.jsonInputId === 'string',
            `[1a.jsonInput] ${key} : jsonInputId="${mod.jsonInputId}"`);
        assert(mod.createBtnId && typeof mod.createBtnId === 'string',
            `[1a.createBtn] ${key} : createBtnId="${mod.createBtnId}"`);
        assert(Array.isArray(mod.categories),
            `[1a.categories] ${key} : categories est un tableau`);
        assert(Array.isArray(mod.platforms) && mod.platforms.length > 0,
            `[1a.platforms] ${key} : platforms non vide`);
        assert(Array.isArray(mod.formats) && mod.formats.length > 0,
            `[1a.formats] ${key} : formats non vide`);
    }

    // 1b. Modules Moodle
    _ctx.source = 'moodle';
    for (const [key, mod] of Object.entries(moodleModules)) {
        _ctx.module = key;
        assert(mod.name && typeof mod.name === 'string',
            `[1b.name] ${key} : name="${mod.name}"`);
        assert(mod.description && typeof mod.description === 'string',
            `[1b.desc] ${key} : description="${mod.description}"`);
        assert(mod.image && typeof mod.image === 'string',
            `[1b.image] ${key} : image definie`);
        assert(Array.isArray(mod.categories),
            `[1b.categories] ${key} : categories est un tableau`);
        assert(Array.isArray(mod.formats) && mod.formats.length > 0,
            `[1b.formats] ${key} : formats non vide`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : PROCESSEURS H5P
// =======================================================================

async function runStep2_H5PProcessors() {
    console.group('Etape 2 : Processeurs H5P');
    _ctx = { step: 2, stepName: 'Processeurs H5P', file: '', module: '', source: 'h5p' };

    for (const key of Object.keys(h5pModules)) {
        _ctx.module = key;

        // 2a. Le processeur existe et se charge
        const t0 = performance.now();
        const metadata = getModuleMetadata(key);
        const t1 = performance.now();

        assert(
            metadata !== null,
            `[2a.Meta] ${key} : getModuleMetadata retourne des donnees`,
            metadata === null ? { hint: 'Verifier que le processeur est enregistre dans h5p/processors/index.js' } : null
        );

        if (metadata) {
            assert(
                metadata.machineName && typeof metadata.machineName === 'string',
                `[2b.Machine] ${key} : processeur machineName="${metadata.machineName}"`
            );
            // version peut etre un string ("1.0") ou un objet ({major:1,minor:0})
            const hasVersion = metadata.version && (typeof metadata.version === 'string' || typeof metadata.version === 'object');
            const versionLabel = typeof metadata.version === 'object'
                ? `${metadata.version.major}.${metadata.version.minor}`
                : metadata.version;
            assert(
                hasVersion,
                `[2c.Version] ${key} : processeur version="${versionLabel}"`
            );
        }

        recordTiming('Processeurs H5P', `getModuleMetadata(${key})`, t1 - t0);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : PROCESSEURS MOODLE
// =======================================================================

async function runStep3_MoodleProcessors() {
    console.group('Etape 3 : Processeurs Moodle');
    _ctx = { step: 3, stepName: 'Processeurs Moodle', file: '', module: '', source: 'moodle' };

    // Mapping entre cle definitions.js et cle processeur Moodle
    const defToProcessor = {
        'test_elea': 'Test',
        'glossaireXml': 'Glossaire',
        'Millionnaire': 'Millionnaire',
        'Appariement': 'Appariement',
        'QCM': 'QCM',
        'Page': 'Page',
        'Devoir': 'Devoir',
        'gift': null // pas de processeur MBZ, utilise moodle-formats.js
    };

    for (const [defKey, mod] of Object.entries(moodleModules)) {
        _ctx.module = defKey;
        const processorKey = defToProcessor[defKey];

        if (processorKey === null) {
            // Module sans processeur MBZ (ex: gift qui utilise un autre chemin)
            continue;
        }

        if (processorKey === undefined) {
            assert(false, `[3a.Map] ${defKey} : pas de mapping vers un processeur Moodle`,
                { hint: 'Ajouter le mapping dans defToProcessor du test' });
            continue;
        }

        assert(
            supportedActivities.includes(processorKey),
            `[3a.Proc] ${defKey} : processeur "${processorKey}" dans supportedActivities`,
            { available: supportedActivities, expected: processorKey }
        );
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : FICHIERS DE PROMPTS
// =======================================================================

async function runStep4_PromptFiles() {
    console.group('Etape 4 : Fichiers de prompts');
    _ctx = { step: 4, stepName: 'Prompts', file: '', module: '', source: '' };

    // Mapping entre cle module et nom de fichier prompt
    const promptFileMap = {
        'Timeline': 'timeline.md',
        'Flashcards': 'flashcards.md',
        'QuizSet': 'quizset.md',
        'QuizSetQCM': 'quizset_qcm.md',
        'QuizSetVF': 'quizset_vf.md',
        'Glossary': 'accordion.md',
        'Crossword': 'crosswords.md',
        'Essay': 'essay.md',
        'Summary': 'summary.md',
        'DragTheWords': 'drag_the_words.md',
        'DragAndDrop': 'drag_and_drop.md',
        'FillInTheBlanks': 'fill_in_the_blanks.md',
        'MarkTheWords': 'mark_the_words.md',
        'TrueFalse': '_truefalse.md',
        'MultipleChoice': '_multiplechoice.md',
        'FindTheWords': 'find_the_words.md',
        'SortParagraphs': 'sort_the_paragraphs.md',
        'SingleChoiceSet': 'single_choice_set.md',
        'DialogCards': 'dialog_cards.md',
        'ComplexFillTheBlanks': 'fill_in_the_blanks.md',
        'Chart': 'chart.md',
        'CoursePresentation': 'course_presentation.md',
        'test_elea': 'elea_test.md',
        'glossaireXml': 'elea_glossaire.md',
        'Millionnaire': 'elea_millionnaire.md',
        'Appariement': 'elea_appariement.md',
        'QCM': 'elea_qcm.md',
        'Page': 'elea_pages.md',
        'Devoir': 'elea_devoir.md',
        'gift': 'elea_test.md'
    };

    for (const key of Object.keys(allModules)) {
        _ctx.module = key;
        const filename = promptFileMap[key];

        if (!filename) {
            assert(false, `[4a.Map] ${key} : pas de mapping vers un fichier prompt`,
                { hint: 'Ajouter le mapping dans promptFileMap du test' });
            continue;
        }

        const url = `assets/data/prompts/${filename}`;
        const exists = await fileExists(url);
        assert(exists, `[4a.File] ${key} : prompt ${filename} existe`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : FICHIERS D'EXEMPLES
// =======================================================================

async function runStep5_ExampleFiles() {
    console.group('Etape 5 : Fichiers d\'exemples');
    _ctx = { step: 5, stepName: 'Exemples', file: '', module: '', source: '' };

    // Mapping entre cle module et prefixe de fichier exemple
    const examplePrefixMap = {
        'Timeline': 'timeline',
        'Flashcards': 'flashcards',
        'QuizSet': 'quiz_mixte',
        'QuizSetQCM': 'quiz_qcm',
        'QuizSetVF': 'quiz_vraifaux',
        'Glossary': 'accordion',
        'Crossword': 'crosswords',
        'Essay': 'essay',
        'Summary': 'summary',
        'DragTheWords': 'drag_the_words',
        'DragAndDrop': 'drag_and_drop',
        'FillInTheBlanks': 'fill_in_the_blanks',
        'MarkTheWords': 'mark_the_words',
        'TrueFalse': 'true_false',
        'MultipleChoice': 'multiple_choice',
        'FindTheWords': 'find_the_words',
        'SortParagraphs': 'sort_the_paragraphs',
        'SingleChoiceSet': 'single_choice_set',
        'DialogCards': 'dialog_cards',
        'ComplexFillTheBlanks': 'complex_fill_blanks',
        'Chart': 'charts',
        'CoursePresentation': 'course_presentation',
        'test_elea': 'test',
        'glossaireXml': 'glossaire_xml',
        'Millionnaire': 'millionnaire',
        'Appariement': 'appariement',
        'QCM': 'qcm',
        'Page': 'page',
        'Devoir': 'devoir',
        'gift': null // pas de fichier d'exemple propre
    };

    for (const key of Object.keys(allModules)) {
        _ctx.module = key;
        const mod = allModules[key];
        const prefix = examplePrefixMap[key];

        if (prefix === null) continue; // pas d'exemple attendu
        if (mod.hidden) continue; // modules caches : pas d'exemple requis
        if (prefix === undefined) {
            assert(false, `[5a.Map] ${key} : pas de mapping vers un prefixe d'exemple`,
                { hint: 'Ajouter le mapping dans examplePrefixMap du test' });
            continue;
        }

        // Tester si au moins prefix_1.json existe
        const url = `assets/data/examples/${prefix}_1.json`;
        const exists = await fileExists(url);
        assert(exists, `[5a.File] ${key} : exemple ${prefix}_1.json existe`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : UNICITE DES IDS
// =======================================================================

async function runStep6_UniqueIds() {
    console.group('Etape 6 : Unicite des IDs');
    _ctx = { step: 6, stepName: 'Unicite IDs', file: '', module: '', source: '' };

    const fields = ['promptId', 'jsonInputId', 'createBtnId'];

    for (const field of fields) {
        const values = [];
        const duplicates = [];

        for (const [key, mod] of Object.entries(allModules)) {
            const val = mod[field];
            if (!val) continue;
            if (values.includes(val)) {
                duplicates.push({ key, value: val });
            }
            values.push(val);
        }

        assert(
            duplicates.length === 0,
            `[6a.${field}] ${field} : ${values.length} valeurs, ${duplicates.length} doublon(s)`,
            duplicates.length > 0 ? { duplicates: duplicates.map(d => `${d.key} = "${d.value}"`) } : null
        );
    }

    // 6b. Unicite des name (cles de traduction)
    const nameValues = [];
    const nameDuplicates = [];
    for (const [key, mod] of Object.entries(allModules)) {
        if (!mod.name) continue;
        if (nameValues.includes(mod.name)) {
            nameDuplicates.push({ key, value: mod.name });
        }
        nameValues.push(mod.name);
    }
    assert(
        nameDuplicates.length === 0,
        `[6b.name] Translation keys : ${nameValues.length} valeurs, ${nameDuplicates.length} doublon(s)`,
        nameDuplicates.length > 0 ? { duplicates: nameDuplicates.map(d => `${d.key} = "${d.value}"`) } : null
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : CUSTOM ORDER ET COHERENCE
// =======================================================================

async function runStep7_CustomOrder() {
    console.group('Etape 7 : customOrder et coherence');
    _ctx = { step: 7, stepName: 'customOrder', file: '', module: '', source: '' };

    // 7a. Pas de doublon dans customOrder
    const seen = new Set();
    const dupes = [];
    for (const key of customOrder) {
        if (seen.has(key)) dupes.push(key);
        seen.add(key);
    }
    assert(
        dupes.length === 0,
        `[7a.Dupes] customOrder : ${dupes.length} doublon(s)`,
        dupes.length > 0 ? { duplicates: dupes } : null
    );

    // 7b. Chaque entree de customOrder existe dans allModules
    const missing = customOrder.filter(k => !allModules[k]);
    assert(
        missing.length === 0,
        `[7b.Exist] customOrder : ${missing.length} module(s) inexistant(s)`,
        missing.length > 0 ? { keys: missing } : null
    );

    // 7c. Chaque module visible (non hidden) est dans customOrder
    const visibleModules = Object.keys(allModules).filter(k => !allModules[k].hidden);
    const notInOrder = visibleModules.filter(k => !customOrder.includes(k));
    assert(
        notInOrder.length === 0,
        `[7c.Coverage] ${notInOrder.length} module(s) visible(s) absent(s) de customOrder`,
        notInOrder.length > 0 ? { keys: notInOrder } : null
    );

    // 7d. Nombre total de modules
    const h5pCount = Object.keys(h5pModules).length;
    const moodleCount = Object.keys(moodleModules).length;
    const allCount = Object.keys(allModules).length;
    assert(
        allCount === h5pCount + moodleCount,
        `[7d.Count] allModules (${allCount}) = h5pModules (${h5pCount}) + moodleModules (${moodleCount})`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 8 : TRADUCTIONS (cles dans fr.json)
// =======================================================================

async function runStep8_TranslationKeys() {
    console.group('Etape 8 : Cles de traduction');
    _ctx = { step: 8, stepName: 'Traductions', file: '', module: '', source: '' };

    // Charger fr.json
    let frKeys;
    try {
        const resp = await fetch('./js/locales/fr.json');
        const fr = await resp.json();
        frKeys = new Set(Object.keys(fr));
    } catch (e) {
        assert(false, '[8.Load] Impossible de charger fr.json', { error: e.message });
        console.groupEnd();
        return;
    }

    // 8a. Chaque module a sa cle de nom
    for (const [key, mod] of Object.entries(allModules)) {
        _ctx.module = key;
        if (mod.name) {
            assert(frKeys.has(mod.name),
                `[8a.Name] ${key} : cle "${mod.name}" dans fr.json`);
        }
    }

    // 8b. Chaque module a sa cle de description
    for (const [key, mod] of Object.entries(allModules)) {
        _ctx.module = key;
        if (mod.description) {
            assert(frKeys.has(mod.description),
                `[8b.Desc] ${key} : cle "${mod.description}" dans fr.json`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 9 : IMAGES DES ACTIVITES
// =======================================================================

async function runStep9_Images() {
    console.group('Etape 9 : Images des activites');
    _ctx = { step: 9, stepName: 'Images', file: '', module: '', source: '' };

    for (const [key, mod] of Object.entries(allModules)) {
        _ctx.module = key;
        if (!mod.image) continue;

        // Ignorer les URLs externes
        if (mod.image.startsWith('http')) {
            assert(true, `[9a.Image] ${key} : URL externe (non testee)`);
            continue;
        }

        const exists = await fileExists(mod.image);
        assert(exists, `[9a.Image] ${key} : ${mod.image} existe`);
    }

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Champs requis',
    'Processeurs H5P',
    'Processeurs Moodle',
    'Prompts',
    'Exemples',
    'Unicite IDs',
    'customOrder',
    'Traductions',
    'Images'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que chaque module (H5P et Moodle) dans definitions.js possede tous les champs obligatoires : name, description, image, machineName, promptId, jsonInputId, createBtnId, categories, platforms, formats.\n\nExemple : si on oublie le promptId d\'un nouveau module H5P, ce test le detecte.',
    'Verifie que chaque module H5P a un processeur enregistre dans h5p/processors/index.js et que getModuleMetadata retourne machineName et version.\n\nExemple : si on cree un nouveau type H5P mais qu\'on oublie de l\'ajouter dans processorLoaders, ce test echoue.',
    'Verifie que chaque module Moodle a un processeur dans moodle/processors/index.js via la liste supportedActivities.\n\nExemple : si on ajoute un module Moodle sans creer son processeur, ce test le signale.',
    'Verifie que chaque module a un fichier de prompt (.md) dans assets/data/prompts/. C\'est le template qui genere les instructions pour l\'IA.\n\nExemple : si on ajoute une activite sans ecrire son prompt, la generation IA ne fonctionnera pas.',
    'Verifie que chaque module a au moins un fichier d\'exemple JSON dans assets/data/examples/. Les exemples servent aux tests et au mode demo.\n\nExemple : les fichiers comme timeline_1.json, crosswords_1.json sont testes ici.',
    'Verifie l\'unicite des identifiants HTML (promptId, jsonInputId, createBtnId) et des cles de traduction (name). Des doublons causeraient des conflits dans le DOM.\n\nExemple : deux modules avec le meme createBtnId = le bouton declencherait deux generations.',
    'Verifie le tableau customOrder : pas de doublons, chaque entree correspond a un module existant, et chaque module visible est present dans l\'ordre d\'affichage.\n\nExemple : un module oublie dans customOrder n\'apparaitrait pas dans l\'onglet "Tout".',
    'Verifie que chaque module a ses cles de traduction (name, description) presentes dans fr.json. C\'est le lien entre definitions.js et le systeme i18n.\n\nExemple : si on ajoute un module avec name="h5p_new_name" mais qu\'on oublie d\'ajouter cette cle dans fr.json.',
    'Verifie que chaque image d\'activite referencee dans definitions.js existe reellement sur le disque. Evite les icones manquantes sur l\'accueil.\n\nExemple : si on renomme une image sans mettre a jour definitions.js, la tuile sera sans visuel.'
];

export async function runAllTests() {
    console.log('=== Tests coherence definitions Caramel (9 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    await runStep1_RequiredFields();
    await runStep2_H5PProcessors();
    await runStep3_MoodleProcessors();
    await runStep4_PromptFiles();
    await runStep5_ExampleFiles();
    await runStep6_UniqueIds();
    await runStep7_CustomOrder();
    await runStep8_TranslationKeys();
    await runStep9_Images();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
