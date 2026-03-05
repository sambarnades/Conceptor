/**
 * Tests de generation, telechargement et visualisation Caramel
 *
 * Verifie le flux complet : prechargement → generation blob → validation ZIP/MBZ → telechargement → visualisation.
 * Teste aussi les optimisations : structuredClone, lookup map, prechargement des modules.
 *
 * Usage : ouvrir tests/test-generation-download.html depuis le serveur local.
 */

import {
    healJsonString,
    healJsonObject,
    healActivitySpecificFields,
    healStructureForActivity
} from '../js/h5p/json-healer.js';

import {
    processH5PContent,
    getModuleMetadata
} from '../js/h5p/processors/index.js';

import {
    getActivityFiles,
    generateBaseData
} from '../js/moodle/processors/index.js';

import { loadClientZip, loadMoodleLibs, loadDOMPurify, loadJSZip, loadH5pLibs } from '../js/core/lib-loader.js';
import { generateMoodleXml, generateMoodleGift } from '../js/moodle/moodle-formats.js';
import { createH5PBlob } from '../js/h5p/h5p-creator.js';
import { createMbz } from '../js/moodle/moodle-creator.js';
import { allModules, h5pModules, moodleModules } from '../js/core/definitions.js';
import { formatContentForDocument } from '../js/export/document-formatter.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = []; // Mesures de performance

// Contexte courant pour enrichir automatiquement les resultats
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

function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        return a.every((item, i) => deepEqual(item, b[i]));
    }
    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => deepEqual(a[key], b[key]));
    }
    return false;
}

/** Enregistre une mesure de performance */
function recordTiming(category, operation, durationMs, iterations = 1) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100, iterations });
}

// =======================================================================
// HELPERS
// =======================================================================

/** Charge un fichier JSON en tant que string brut (pas parse) */
async function fetchRawText(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.text();
}

/** Echappement XML basique pour la construction des donnees Moodle */
function escapeXml(str) {
    if (typeof str !== 'string') return String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** Construit les donnees Moodle a partir du JSON heale pour getActivityFiles */
function buildMoodleData(moduleKey, healedObj) {
    const title = healedObj.title || healedObj.name || 'Test Activity';
    const base = generateBaseData(title);
    base.ACTIVITY_TITLE = escapeXml(title);
    base.COURSE_FULLNAME = escapeXml(title);

    switch (moduleKey) {
        case 'elea_qcm':
            return {
                ...base,
                ACTIVITY_INTRO_HTML: escapeXml('<p>Test QCM</p>'),
                QUESTIONS_JSON: escapeXml(JSON.stringify(healedObj.questions || []))
            };
        case 'elea_appariement': {
            const pairs = healedObj.pairs || [];
            const questions = {};
            const responses = {};
            pairs.forEach((pair, i) => {
                questions[i + 1] = `<p>${String(pair.question || '').trim()}</p>`;
                responses[i + 1] = `<p>${String(pair.answer || '').trim()}</p>`;
            });
            return {
                ...base,
                ACTIVITY_INTRO_HTML: escapeXml('<p>Test Appariement</p>'),
                ASSOCIATIONS_JSON: escapeXml(JSON.stringify({ questions, responses }))
            };
        }
        case 'elea_millionnaire':
            return {
                ...base,
                ACTIVITY_INTRO_HTML: '<p>Test Millionnaire</p>',
                QUESTIONS_JSON: escapeXml(JSON.stringify(healedObj.questions || []))
            };
        case 'elea_page':
            return {
                ...base,
                PAGE_NAME: escapeXml(title),
                CONTENT: escapeXml('<p>Test page content</p>'),
                INTRO: escapeXml(healedObj.intro || '')
            };
        case 'elea_devoir': {
            let introHtml = healedObj.description ? String(healedObj.description).trim() : 'Consultez la grille d\'évaluation ci-dessous.';
            if (!introHtml.match(/^\s*<p[\s>]/i)) {
                introHtml = `<p dir="ltr" style="text-align: left;">${introHtml}</p>`;
            }
            return {
                ...base,
                ACTIVITY_INTRO_HTML: escapeXml(introHtml),
                RUBRIC_NAME: healedObj.rubricName || healedObj.title || 'Grille d\'évaluation',
                CRITERIA: healedObj.criteria || []
            };
        }
        default:
            return base;
    }
}

/** Mini parseur TAR pour lire les archives MBZ decompressees */
function parseTar(tarBytes) {
    const files = {};
    let offset = 0;
    const decoder = new TextDecoder();
    while (offset < tarBytes.length - 512) {
        const header = tarBytes.slice(offset, offset + 512);
        const name = decoder.decode(header.slice(0, 100)).replace(/\0/g, '').trim();
        if (!name) break;
        const sizeOctal = decoder.decode(header.slice(124, 136)).replace(/\0/g, '').trim();
        const size = parseInt(sizeOctal, 8) || 0;
        offset += 512;
        if (size > 0) {
            files[name] = decoder.decode(tarBytes.slice(offset, offset + size));
            offset += Math.ceil(size / 512) * 512;
        }
    }
    return files;
}

// =======================================================================
// CAS DE TEST (memes que test-edit-export-flow.js)
// =======================================================================

const testCases = [
    // === H5P ===
    { file: 'accordion_1.json', titleKey: 'h5p_glossary_name', expectedModule: 'Glossary', source: 'h5p' },
    { file: 'accordion_2.json', titleKey: 'h5p_glossary_name', expectedModule: 'Glossary', source: 'h5p' },
    { file: 'charts_1.json', titleKey: 'h5p_chart_name', expectedModule: 'Chart', source: 'h5p' },
    { file: 'charts_2.json', titleKey: 'h5p_chart_name', expectedModule: 'Chart', source: 'h5p' },
    { file: 'charts_3.json', titleKey: 'h5p_chart_name', expectedModule: 'Chart', source: 'h5p' },
    { file: 'crosswords_1.json', titleKey: 'h5p_crossword_name', expectedModule: 'Crossword', source: 'h5p' },
    { file: 'crosswords_2.json', titleKey: 'h5p_crossword_name', expectedModule: 'Crossword', source: 'h5p' },
    { file: 'crosswords_3.json', titleKey: 'h5p_crossword_name', expectedModule: 'Crossword', source: 'h5p' },
    { file: 'dialog_cards_1.json', titleKey: 'h5p_dialog_cards_name', expectedModule: 'DialogCards', source: 'h5p' },
    { file: 'dialog_cards_2.json', titleKey: 'h5p_dialog_cards_name', expectedModule: 'DialogCards', source: 'h5p' },
    { file: 'dialog_cards_3.json', titleKey: 'h5p_dialog_cards_name', expectedModule: 'DialogCards', source: 'h5p' },
    { file: 'drag_and_drop_1.json', titleKey: 'h5p_drag_and_drop_name', expectedModule: 'DragAndDrop', source: 'h5p' },
    { file: 'drag_and_drop_2.json', titleKey: 'h5p_drag_and_drop_name', expectedModule: 'DragAndDrop', source: 'h5p' },
    { file: 'drag_the_words_1.json', titleKey: 'h5p_drag_the_words_name', expectedModule: 'DragTheWords', source: 'h5p' },
    { file: 'drag_the_words_2.json', titleKey: 'h5p_drag_the_words_name', expectedModule: 'DragTheWords', source: 'h5p' },
    { file: 'drag_the_words_3.json', titleKey: 'h5p_drag_the_words_name', expectedModule: 'DragTheWords', source: 'h5p' },
    { file: 'essay_1.json', titleKey: 'h5p_essay_name', expectedModule: 'Essay', source: 'h5p' },
    { file: 'essay_2.json', titleKey: 'h5p_essay_name', expectedModule: 'Essay', source: 'h5p' },
    { file: 'essay_3.json', titleKey: 'h5p_essay_name', expectedModule: 'Essay', source: 'h5p' },
    { file: 'fill_in_the_blanks_1.json', titleKey: 'h5p_fill_in_the_blanks_name', expectedModule: 'FillInTheBlanks', source: 'h5p' },
    { file: 'fill_in_the_blanks_2.json', titleKey: 'h5p_fill_in_the_blanks_name', expectedModule: 'FillInTheBlanks', source: 'h5p' },
    { file: 'fill_in_the_blanks_3.json', titleKey: 'h5p_fill_in_the_blanks_name', expectedModule: 'FillInTheBlanks', source: 'h5p' },
    { file: 'find_the_words_1.json', titleKey: 'h5p_find_the_words_name', expectedModule: 'FindTheWords', source: 'h5p' },
    { file: 'find_the_words_2.json', titleKey: 'h5p_find_the_words_name', expectedModule: 'FindTheWords', source: 'h5p' },
    { file: 'find_the_words_3.json', titleKey: 'h5p_find_the_words_name', expectedModule: 'FindTheWords', source: 'h5p' },
    { file: 'flashcards_1.json', titleKey: 'h5p_flashcards_name', expectedModule: 'Flashcards', source: 'h5p' },
    { file: 'flashcards_2.json', titleKey: 'h5p_flashcards_name', expectedModule: 'Flashcards', source: 'h5p' },
    { file: 'flashcards_3.json', titleKey: 'h5p_flashcards_name', expectedModule: 'Flashcards', source: 'h5p' },
    { file: 'mark_the_words_1.json', titleKey: 'h5p_mark_the_words_name', expectedModule: 'MarkTheWords', source: 'h5p' },
    { file: 'mark_the_words_2.json', titleKey: 'h5p_mark_the_words_name', expectedModule: 'MarkTheWords', source: 'h5p' },
    { file: 'mark_the_words_3.json', titleKey: 'h5p_mark_the_words_name', expectedModule: 'MarkTheWords', source: 'h5p' },
    { file: 'mark_the_words_4.json', titleKey: 'h5p_mark_the_words_name', expectedModule: 'MarkTheWords', source: 'h5p' },
    { file: 'multiple_choice_1.json', titleKey: 'h5p_multiple_choice_name', expectedModule: 'MultipleChoice', source: 'h5p' },
    { file: 'multiple_choice_3.json', titleKey: 'h5p_multiple_choice_name', expectedModule: 'MultipleChoice', source: 'h5p' },
    { file: 'quiz_mixte_1.json', titleKey: 'h5p_quiz_set_description', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_mixte_2.json', titleKey: 'h5p_quiz_set_description', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_mixte_3.json', titleKey: 'h5p_quiz_set_description', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_mixte_4.json', titleKey: 'h5p_quiz_set_description', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_qcm_1.json', titleKey: 'h5p_quiz_set_qcm_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_qcm_2.json', titleKey: 'h5p_quiz_set_qcm_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_qcm_3.json', titleKey: 'h5p_quiz_set_qcm_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_qcm_4.json', titleKey: 'h5p_quiz_set_qcm_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_qcm_5.json', titleKey: 'h5p_quiz_set_qcm_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_vraifaux_1.json', titleKey: 'h5p_quiz_set_vf_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'quiz_vraifaux_2.json', titleKey: 'h5p_quiz_set_vf_name', expectedModule: 'QuizSet', source: 'h5p' },
    { file: 'single_choice_set_1.json', titleKey: 'h5p_single_choice_set_name', expectedModule: 'SingleChoiceSet', source: 'h5p' },
    { file: 'single_choice_set_2.json', titleKey: 'h5p_single_choice_set_name', expectedModule: 'SingleChoiceSet', source: 'h5p' },
    { file: 'sort_the_paragraphs_1.json', titleKey: 'h5p_sort_the_paragraphs_name', expectedModule: 'SortParagraphs', source: 'h5p' },
    { file: 'sort_the_paragraphs_2.json', titleKey: 'h5p_sort_the_paragraphs_name', expectedModule: 'SortParagraphs', source: 'h5p' },
    { file: 'summary_1.json', titleKey: 'h5p_summary_name', expectedModule: 'Summary', source: 'h5p' },
    { file: 'summary_2.json', titleKey: 'h5p_summary_name', expectedModule: 'Summary', source: 'h5p' },
    { file: 'timeline_1.json', titleKey: 'h5p_timeline_name', expectedModule: 'Timeline', source: 'h5p' },
    { file: 'timeline_2.json', titleKey: 'h5p_timeline_name', expectedModule: 'Timeline', source: 'h5p' },
    { file: 'timeline_3.json', titleKey: 'h5p_timeline_name', expectedModule: 'Timeline', source: 'h5p' },
    { file: 'true_false_1.json', titleKey: 'h5p_true_false_name', expectedModule: 'TrueFalse', source: 'h5p' },
    { file: 'true_false_2.json', titleKey: 'h5p_true_false_name', expectedModule: 'TrueFalse', source: 'h5p' },
    { file: 'true_false_3.json', titleKey: 'h5p_true_false_name', expectedModule: 'TrueFalse', source: 'h5p' },

    // === Moodle/Elea (avec MBZ) ===
    { file: 'appariement_1.json', titleKey: 'elea_appariement_name', expectedModule: 'elea_appariement', source: 'moodle', moodleActivityKey: 'Appariement' },
    { file: 'appariement_2.json', titleKey: 'elea_appariement_name', expectedModule: 'elea_appariement', source: 'moodle', moodleActivityKey: 'Appariement' },
    { file: 'qcm_1.json', titleKey: 'elea_qcm_name', expectedModule: 'elea_qcm', source: 'moodle', moodleActivityKey: 'QCM' },
    { file: 'qcm_2.json', titleKey: 'elea_qcm_name', expectedModule: 'elea_qcm', source: 'moodle', moodleActivityKey: 'QCM' },
    { file: 'millionnaire_1.json', titleKey: 'elea_millionnaire_name', expectedModule: 'elea_millionnaire', source: 'moodle', moodleActivityKey: 'Millionnaire' },
    { file: 'millionnaire_2.json', titleKey: 'elea_millionnaire_name', expectedModule: 'elea_millionnaire', source: 'moodle', moodleActivityKey: 'Millionnaire' },
    { file: 'page_1.json', titleKey: 'elea_page_name', expectedModule: 'elea_page', source: 'moodle', moodleActivityKey: 'Page' },
    { file: 'page_2.json', titleKey: 'elea_page_name', expectedModule: 'elea_page', source: 'moodle', moodleActivityKey: 'Page' },
    { file: 'page_3.json', titleKey: 'elea_page_name', expectedModule: 'elea_page', source: 'moodle', moodleActivityKey: 'Page' },
    { file: 'devoir_1.json', titleKey: 'elea_devoir_name', expectedModule: 'elea_devoir', source: 'moodle', moodleActivityKey: 'Devoir' },
    { file: 'devoir_5.json', titleKey: 'elea_devoir_name', expectedModule: 'elea_devoir', source: 'moodle', moodleActivityKey: 'Devoir' },
    { file: 'devoir_6.json', titleKey: 'elea_devoir_name', expectedModule: 'elea_devoir', source: 'moodle', moodleActivityKey: 'Devoir' },

    // === Moodle/Elea (XML direct, pas MBZ) ===
    { file: 'glossaire_xml_1.json', titleKey: 'elea_glossaire_xml_name', expectedModule: 'elea_glossaire', source: 'moodle_xml' },
    { file: 'glossaire_xml_2.json', titleKey: 'elea_glossaire_xml_name', expectedModule: 'elea_glossaire', source: 'moodle_xml' },
    { file: 'test_1.json', titleKey: 'elea_test_xml_name', expectedModule: 'elea_test', source: 'moodle_xml' },
    { file: 'test_2.json', titleKey: 'elea_test_xml_name', expectedModule: 'elea_test', source: 'moodle_xml' },
    { file: 'test_3.json', titleKey: 'elea_test_xml_name', expectedModule: 'elea_test', source: 'moodle_xml' }
];

// Etat partage entre les etapes pour chaque fichier
const pipelineState = new Map();

// =======================================================================
// ETAPE 1 : PRECHARGEMENT DES MODULES ET BIBLIOTHEQUES
// =======================================================================

async function runStep1_Preloading() {
    console.group('Etape 1 : Prechargement des modules et bibliotheques');

    _ctx = { step: 1, stepName: 'Prechargement', file: '', module: '', source: '' };

    // 1a. Import dynamique de h5p-creator.js
    try {
        const t0 = performance.now();
        const h5pMod = await import('../js/h5p/h5p-creator.js');
        const t1 = performance.now();
        assert(
            typeof h5pMod.createH5PBlob === 'function',
            `[1a.H5PCreator] import h5p-creator.js : createH5PBlob disponible (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'import h5p-creator.js (1er)', t1 - t0);

        // 2e appel = cache hit
        const t2 = performance.now();
        await import('../js/h5p/h5p-creator.js');
        const t3 = performance.now();
        recordTiming('Prechargement', 'import h5p-creator.js (cache)', t3 - t2);
        assert(
            (t3 - t2) < 50,
            `[1a.H5PCreator.Cache] 2e import cache : ${(t3 - t2).toFixed(1)}ms (attendu <50ms)`
        );
    } catch (e) {
        assert(false, `[1a.H5PCreator] import h5p-creator.js echoue : ${e.message}`);
    }

    // 1b. Import dynamique de moodle-creator.js
    try {
        const t0 = performance.now();
        const moodleMod = await import('../js/moodle/moodle-creator.js');
        const t1 = performance.now();
        assert(
            typeof moodleMod.createMbz === 'function',
            `[1b.MoodleCreator] import moodle-creator.js : createMbz disponible (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'import moodle-creator.js (1er)', t1 - t0);
    } catch (e) {
        assert(false, `[1b.MoodleCreator] import moodle-creator.js echoue : ${e.message}`);
    }

    // 1c. Import dynamique de document-exporter.js
    try {
        const t0 = performance.now();
        const exportMod = await import('../js/export/document-exporter.js');
        const t1 = performance.now();
        const hasExports = typeof exportMod.exportToDOCX === 'function'
            || typeof exportMod.exportToPDF === 'function'
            || typeof exportMod.exportToODT === 'function';
        assert(
            hasExports,
            `[1c.DocExporter] import document-exporter.js : exports disponibles (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'import document-exporter.js (1er)', t1 - t0);
    } catch (e) {
        assert(false, `[1c.DocExporter] import document-exporter.js echoue : ${e.message}`);
    }

    // 1d. loadClientZip
    try {
        const t0 = performance.now();
        const dlZip = await loadClientZip();
        const t1 = performance.now();
        assert(
            typeof dlZip === 'function',
            `[1d.ClientZip] loadClientZip() : fonction retournee (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'loadClientZip()', t1 - t0);
    } catch (e) {
        assert(false, `[1d.ClientZip] loadClientZip() echoue : ${e.message}`);
    }

    // 1e. loadMoodleLibs
    try {
        const t0 = performance.now();
        await loadMoodleLibs();
        const t1 = performance.now();
        assert(
            window.fflate && window.Tar,
            `[1e.MoodleLibs] loadMoodleLibs() : fflate=${!!window.fflate}, Tar=${!!window.Tar} (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'loadMoodleLibs()', t1 - t0);
    } catch (e) {
        assert(false, `[1e.MoodleLibs] loadMoodleLibs() echoue : ${e.message}`);
    }

    // 1f. loadDOMPurify
    try {
        const t0 = performance.now();
        await loadDOMPurify();
        const t1 = performance.now();
        assert(
            !!window.DOMPurify,
            `[1f.DOMPurify] loadDOMPurify() : DOMPurify disponible (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'loadDOMPurify()', t1 - t0);
    } catch (e) {
        assert(false, `[1f.DOMPurify] loadDOMPurify() echoue : ${e.message}`);
    }

    // 1g. loadJSZip
    try {
        const t0 = performance.now();
        await loadJSZip();
        const t1 = performance.now();
        assert(
            typeof JSZip !== 'undefined',
            `[1g.JSZip] loadJSZip() : JSZip disponible (${(t1 - t0).toFixed(1)}ms)`
        );
        recordTiming('Prechargement', 'loadJSZip()', t1 - t0);
    } catch (e) {
        assert(false, `[1g.JSZip] loadJSZip() echoue : ${e.message}`);
    }

    // 1h. loadH5pLibs
    try {
        const t0 = performance.now();
        await loadH5pLibs();
        const t1 = performance.now();
        assert(true, `[1h.H5PLibs] loadH5pLibs() : charge (${(t1 - t0).toFixed(1)}ms)`);
        recordTiming('Prechargement', 'loadH5pLibs()', t1 - t0);
    } catch (e) {
        assert(false, `[1h.H5PLibs] loadH5pLibs() echoue : ${e.message}`);
    }

    // 1i. h5p-prefetch — import et exports
    try {
        const t0 = performance.now();
        const prefetchMod = await import('../js/h5p/h5p-prefetch.js');
        const t1 = performance.now();
        assert(
            typeof prefetchMod.prefetchH5PLibraries === 'function',
            `[1i.Prefetch] import h5p-prefetch.js : prefetchH5PLibraries disponible (${(t1 - t0).toFixed(1)}ms)`
        );
        assert(
            typeof prefetchMod.getPrefetchStatus === 'function',
            `[1i.PrefetchStatus] import h5p-prefetch.js : getPrefetchStatus disponible`
        );
        assert(
            typeof prefetchMod.retryFailed === 'function',
            `[1i.RetryFailed] import h5p-prefetch.js : retryFailed disponible`
        );
        assert(
            prefetchMod.assetCache instanceof Map,
            `[1i.AssetCache] import h5p-prefetch.js : assetCache est une Map (cache memoire)`
        );
        recordTiming('Prechargement', 'import h5p-prefetch.js', t1 - t0);
    } catch (e) {
        assert(false, `[1i.Prefetch] import h5p-prefetch.js echoue : ${e.message}`);
    }

    // 1j. h5p-prefetch — prefetch reel sur un type leger (Chart = 0 extra deps)
    try {
        const prefetchMod = await import('../js/h5p/h5p-prefetch.js');
        const t0 = performance.now();
        await prefetchMod.prefetchH5PLibraries('Chart');
        const t1 = performance.now();

        const status = prefetchMod.getPrefetchStatus();
        const chartLib = status.libraries['H5P.Chart-1.2'];
        assert(
            chartLib && chartLib.status === 'ok',
            `[1j.PrefetchChart] prefetchH5PLibraries("Chart") : H5P.Chart-1.2 status=${chartLib?.status} (${(t1 - t0).toFixed(1)}ms)`,
            chartLib?.status !== 'ok' ? { status: chartLib } : null
        );
        recordTiming('Prechargement', 'prefetchH5PLibraries("Chart")', t1 - t0);
    } catch (e) {
        assert(false, `[1j.PrefetchChart] prefetchH5PLibraries("Chart") echoue : ${e.message}`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : EQUIVALENCE structuredClone
// =======================================================================

async function runStep2_StructuredClone() {
    console.group('Etape 2 : Equivalence structuredClone');

    let totalJsonTime = 0;
    let totalCloneTime = 0;
    let totalIterations = 0;

    for (const tc of testCases) {
        _ctx = { step: 2, stepName: 'structuredClone', file: tc.file, module: tc.expectedModule, source: tc.source };

        try {
            const rawText = await fetchRawText(tc.file);
            const healedString = healJsonString(rawText);
            const obj = JSON.parse(healedString);

            // Comparer les deux methodes
            const t0 = performance.now();
            const jsonClone = JSON.parse(JSON.stringify(obj));
            const t1 = performance.now();
            const scClone = structuredClone(obj);
            const t2 = performance.now();

            const jsonTime = t1 - t0;
            const cloneTime = t2 - t1;
            totalJsonTime += jsonTime;
            totalCloneTime += cloneTime;
            totalIterations++;

            // Verifier l'equivalence
            const areEqual = deepEqual(jsonClone, scClone);
            assert(
                areEqual,
                `[2.Clone] ${tc.file} : structuredClone ≡ JSON roundtrip (json=${jsonTime.toFixed(1)}ms, clone=${cloneTime.toFixed(1)}ms)`
            );
        } catch (e) {
            assert(false, `[2.Clone] ${tc.file} : exception - ${e.message}`);
        }
    }

    // Timing global
    if (totalIterations > 0) {
        recordTiming('structuredClone', 'JSON.parse(JSON.stringify())', totalJsonTime, totalIterations);
        recordTiming('structuredClone', 'structuredClone()', totalCloneTime, totalIterations);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : GENERATION H5P — BLOB VALIDE ET TELECHARGEABLE
// =======================================================================

async function runStep3_H5PGeneration() {
    console.group('Etape 3 : Generation H5P + blob + telechargement');

    const jsZipReady = typeof JSZip !== 'undefined';

    for (const tc of testCases) {
        if (tc.source !== 'h5p') continue;
        _ctx = { step: 3, stepName: 'H5P Blob', file: tc.file, module: tc.expectedModule, source: tc.source };

        try {
            // Pipeline complet : raw → heal → process → blob
            const rawText = await fetchRawText(tc.file);
            const healedString = healJsonString(rawText);
            let jsonObj = JSON.parse(healedString);
            jsonObj = healJsonObject(jsonObj, tc.expectedModule);
            jsonObj = healActivitySpecificFields(jsonObj, tc.expectedModule);
            jsonObj = healStructureForActivity(jsonObj, tc.expectedModule);

            // Stocker pour etape 6
            pipelineState.set(tc.file, { healedObj: jsonObj });

            // Processeur H5P
            const clone = structuredClone(jsonObj);
            const processedContent = await processH5PContent(tc.expectedModule, clone);
            let contentJson = processedContent;
            let dynamicDeps = [];
            if (processedContent && processedContent.content) {
                contentJson = processedContent.content;
                dynamicDeps = processedContent.dependencies || [];
            }

            assert(
                contentJson !== null && contentJson !== undefined,
                `[3a.Process] ${tc.file} : processeur retourne du contenu`
            );

            // Creer le blob H5P
            const metadata = getModuleMetadata(tc.expectedModule);
            if (!metadata) {
                assert(false, `[3b.Meta] ${tc.file} : metadata introuvable pour ${tc.expectedModule}`);
                continue;
            }

            const dependencies = [
                ...metadata.extraDependencies,
                { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
                ...dynamicDeps
            ];

            const t0 = performance.now();
            const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
                title: contentJson.title || 'Test Activity',
                lang: 'fr'
            });
            const t1 = performance.now();

            // Assertion blob valide
            assert(
                h5pBlob && h5pBlob.size > 100,
                `[3b.Blob] ${tc.file} : blob H5P cree (${h5pBlob.size} octets, ${(t1 - t0).toFixed(1)}ms)`
            );

            // Relire le ZIP avec JSZip
            if (jsZipReady && h5pBlob) {
                const readBack = await JSZip.loadAsync(h5pBlob);

                // Verifier content/content.json
                const contentFile = readBack.file('content/content.json');
                assert(
                    contentFile !== null,
                    `[3c.ZIP] ${tc.file} : content/content.json present dans le ZIP`
                );

                if (contentFile) {
                    const contentText = await contentFile.async('text');
                    let parsedOk = false;
                    try { JSON.parse(contentText); parsedOk = true; } catch (e) { /* JSON invalide */ }
                    assert(parsedOk, `[3c2.JSON] ${tc.file} : content/content.json est du JSON valide`);
                }

                // Verifier h5p.json
                const h5pFile = readBack.file('h5p.json');
                assert(h5pFile !== null, `[3d.ZIP] ${tc.file} : h5p.json present dans le ZIP`);

                if (h5pFile) {
                    const h5pJson = JSON.parse(await h5pFile.async('text'));
                    assert(
                        h5pJson.mainLibrary === metadata.machineName,
                        `[3d2.MainLib] ${tc.file} : mainLibrary = "${h5pJson.mainLibrary}" (attendu "${metadata.machineName}")`
                    );
                    assert(
                        Array.isArray(h5pJson.preloadedDependencies) && h5pJson.preloadedDependencies.length > 0,
                        `[3d3.Deps] ${tc.file} : ${h5pJson.preloadedDependencies?.length || 0} dependances`
                    );
                }
            }

            // Simulation telechargement
            if (h5pBlob) {
                const url = URL.createObjectURL(h5pBlob);
                assert(
                    url && url.startsWith('blob:'),
                    `[3e.Download] ${tc.file} : objectURL valide (${url.substring(0, 30)}...)`
                );
                URL.revokeObjectURL(url);
            }

            recordTiming('H5P Blob', `${tc.expectedModule} (${tc.file})`, t1 - t0);

        } catch (e) {
            assert(false, `[3.H5P] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : GENERATION MOODLE MBZ — BLOB VALIDE ET TELECHARGEABLE
// =======================================================================

async function runStep4_MoodleMBZ() {
    console.group('Etape 4 : Generation Moodle MBZ + blob');

    for (const tc of testCases) {
        if (tc.source !== 'moodle') continue;
        _ctx = { step: 4, stepName: 'Moodle MBZ', file: tc.file, module: tc.expectedModule, source: tc.source };

        try {
            const rawText = await fetchRawText(tc.file);
            const healedString = healJsonString(rawText);
            let jsonObj = JSON.parse(healedString);
            jsonObj = healJsonObject(jsonObj, tc.expectedModule);
            jsonObj = healActivitySpecificFields(jsonObj, tc.expectedModule);
            jsonObj = healStructureForActivity(jsonObj, tc.expectedModule);

            pipelineState.set(tc.file, { healedObj: jsonObj });

            // Construire les donnees Moodle
            const moodleData = buildMoodleData(tc.expectedModule, jsonObj);
            const activityKey = tc.moodleActivityKey;

            // Generer les fichiers via le processeur Moodle
            const files = getActivityFiles(activityKey, moodleData);
            assert(
                files && Object.keys(files).length > 0,
                `[4a.Files] ${tc.file} : ${Object.keys(files).length} fichiers generes`
            );

            // Creer le MBZ
            const t0 = performance.now();
            const gzData = await createMbz(files);
            const t1 = performance.now();

            const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });
            assert(
                mbzBlob.size > 100,
                `[4b.Blob] ${tc.file} : MBZ cree (${mbzBlob.size} octets, ${(t1 - t0).toFixed(1)}ms)`
            );

            // Decompresser et verifier TAR
            if (window.fflate && gzData) {
                try {
                    const tarBytes = fflate.decompressSync(new Uint8Array(gzData));
                    const tarFiles = parseTar(tarBytes);
                    const fileNames = Object.keys(tarFiles);
                    const hasMoodleBackup = fileNames.some(f => f.includes('moodle_backup.xml'));
                    assert(
                        hasMoodleBackup,
                        `[4c.TAR] ${tc.file} : moodle_backup.xml present dans le TAR (${fileNames.length} fichiers)`
                    );
                } catch (decompErr) {
                    assert(false, `[4c.TAR] ${tc.file} : decompression echouee - ${decompErr.message}`);
                }
            }

            // Simulation telechargement
            const url = URL.createObjectURL(mbzBlob);
            assert(
                url && url.startsWith('blob:'),
                `[4d.Download] ${tc.file} : objectURL MBZ valide`
            );
            URL.revokeObjectURL(url);

            recordTiming('Moodle MBZ', `${tc.expectedModule} (${tc.file})`, t1 - t0);

        } catch (e) {
            assert(false, `[4.MBZ] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : GENERATION MOODLE XML/GIFT — CONTENU VALIDE
// =======================================================================

async function runStep5_MoodleXML() {
    console.group('Etape 5 : Generation Moodle XML/GIFT');

    for (const tc of testCases) {
        if (tc.source !== 'moodle_xml') continue;
        _ctx = { step: 5, stepName: 'XML/GIFT', file: tc.file, module: tc.expectedModule, source: tc.source };

        try {
            const rawText = await fetchRawText(tc.file);
            const healedString = healJsonString(rawText);
            let jsonObj = JSON.parse(healedString);
            jsonObj = healJsonObject(jsonObj, tc.expectedModule);
            jsonObj = healActivitySpecificFields(jsonObj, tc.expectedModule);
            jsonObj = healStructureForActivity(jsonObj, tc.expectedModule);

            pipelineState.set(tc.file, { healedObj: jsonObj });

            if (tc.expectedModule === 'elea_test') {
                // Test XML Moodle (banque de questions)
                const xmlContent = generateMoodleXml(jsonObj);
                assert(
                    xmlContent && xmlContent.length > 50,
                    `[5a.XML] ${tc.file} : XML genere (${xmlContent?.length || 0} caracteres)`
                );
                assert(
                    xmlContent && (xmlContent.includes('<?xml') || xmlContent.includes('<quiz')),
                    `[5a2.XML] ${tc.file} : contient en-tete XML ou balise quiz`
                );

                // Test GIFT
                const giftContent = generateMoodleGift(jsonObj);
                assert(
                    giftContent && giftContent.length > 10,
                    `[5b.GIFT] ${tc.file} : GIFT genere (${giftContent?.length || 0} caracteres)`
                );
                assert(
                    giftContent && giftContent.includes('{'),
                    `[5b2.GIFT] ${tc.file} : contient accolades (format GIFT)`
                );
            } else if (tc.expectedModule === 'elea_glossaire') {
                // Glossaire XML
                const entries = jsonObj.entries || [];
                assert(
                    entries.length > 0,
                    `[5c.Glossaire] ${tc.file} : ${entries.length} entrees dans le glossaire`
                );

                // Generer le XML de glossaire
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<GLOSSARY><INFO><NAME>' +
                    escapeXml(jsonObj.name || 'Glossaire') + '</NAME><ENTRIES>';
                for (const entry of entries) {
                    if (!entry.concept || !entry.definition) continue;
                    xml += '<ENTRY><CONCEPT>' + escapeXml(entry.concept) + '</CONCEPT>' +
                        '<DEFINITION>' + escapeXml(entry.definition) + '</DEFINITION></ENTRY>';
                }
                xml += '</ENTRIES></INFO></GLOSSARY>';

                assert(
                    xml.includes('<GLOSSARY>') && xml.includes('<ENTRY>'),
                    `[5c2.GlossaireXML] ${tc.file} : XML glossaire valide`
                );
            }
        } catch (e) {
            assert(false, `[5.XML] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : VISUALISATION H5P (SMOKE TEST)
// =======================================================================

async function runStep6_H5PVisualization() {
    console.group('Etape 6 : Visualisation H5P (smoke test)');

    _ctx = { step: 6, stepName: 'Visualisation', file: '', module: '', source: 'h5p' };

    // Sous-ensemble representatif pour les tests de visualisation
    const vizTypes = {
        'Timeline': { key: 'timeline.date', check: (c) => Array.isArray(c.timeline?.date) },
        'MultipleChoice': { key: 'answers', check: (c) => Array.isArray(c.answers) },
        'Flashcards': { key: 'cards', check: (c) => Array.isArray(c.cards || c.dialogs) },
        'QuizSet': { key: 'questions', check: (c) => Array.isArray(c.questions) },
        'Crossword': { key: 'words', check: (c) => Array.isArray(c.words) },
        'DialogCards': { key: 'dialogs', check: (c) => Array.isArray(c.dialogs) },
        'Glossary': { key: 'panels', check: (c) => Array.isArray(c.panels) },
        'FillInTheBlanks': { key: 'questions', check: (c) => Array.isArray(c.questions) }
    };

    const jsZipReady = typeof JSZip !== 'undefined';

    for (const tc of testCases) {
        if (tc.source !== 'h5p') continue;
        if (!vizTypes[tc.expectedModule]) continue;
        // Ne prendre que le premier fichier par type pour le smoke test
        const alreadyTested = results.some(r =>
            r.step === 6 && r.module === tc.expectedModule && r.status === 'PASS'
        );
        if (alreadyTested) continue;

        _ctx = { step: 6, stepName: 'Visualisation', file: tc.file, module: tc.expectedModule, source: tc.source };

        try {
            const state = pipelineState.get(tc.file);
            if (!state || !state.healedObj) {
                assert(false, `[6.Viz] ${tc.file} : pas de donnees healees (etape 3 manquante)`);
                continue;
            }

            const clone = structuredClone(state.healedObj);
            const processedContent = await processH5PContent(tc.expectedModule, clone);
            let contentJson = processedContent;
            if (processedContent && processedContent.content) {
                contentJson = processedContent.content;
            }

            // Verifier la structure specifique au type
            const vizDef = vizTypes[tc.expectedModule];
            const structOk = vizDef.check(contentJson);
            assert(
                structOk,
                `[6a.Structure] ${tc.file} (${tc.expectedModule}) : structure "${vizDef.key}" presente`
            );

            // Creer le blob et relire le content.json depuis le ZIP
            const metadata = getModuleMetadata(tc.expectedModule);
            if (metadata && jsZipReady) {
                const deps = [
                    ...metadata.extraDependencies,
                    { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor }
                ];
                const blob = await createH5PBlob(contentJson, metadata.machineName, deps, { title: 'Viz Test', lang: 'fr' });
                const zip = await JSZip.loadAsync(blob);
                const contentFile = zip.file('content/content.json');
                const h5pFile = zip.file('h5p.json');

                if (contentFile && h5pFile) {
                    const reContent = JSON.parse(await contentFile.async('text'));
                    const reH5p = JSON.parse(await h5pFile.async('text'));

                    // Coherence mainLibrary ↔ preloadedDependencies
                    const mainInDeps = reH5p.preloadedDependencies.some(
                        d => d.machineName === reH5p.mainLibrary
                    );
                    assert(
                        mainInDeps,
                        `[6b.Deps] ${tc.file} : mainLibrary "${reH5p.mainLibrary}" presente dans preloadedDependencies`
                    );

                    // Verification que le contenu relu est structurellement identique
                    const reStructOk = vizDef.check(reContent);
                    assert(
                        reStructOk,
                        `[6c.Relecture] ${tc.file} : contenu relu du ZIP valide pour ${tc.expectedModule}`
                    );
                }
            }
        } catch (e) {
            assert(false, `[6.Viz] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : LOOKUP MAP ET REGISTRE DE MODULES
// =======================================================================

async function runStep7_LookupMap() {
    console.group('Etape 7 : Lookup map et registre de modules');

    _ctx = { step: 7, stepName: 'Lookup map', file: '', module: '', source: '' };

    // 7a. Construire la meme map que ui.js
    const modulesByTitleKey = new Map();
    for (const [key, mod] of Object.entries(allModules)) {
        if (mod.name) {
            modulesByTitleKey.set(mod.name, { key, mod });
        }
    }

    const totalModules = Object.keys(allModules).length;
    assert(
        modulesByTitleKey.size > 0,
        `[7a.Map] modulesByTitleKey construite : ${modulesByTitleKey.size} entrees sur ${totalModules} modules`
    );

    // 7b. Verifier pas de collision (chaque titleKey doit etre unique)
    const titleKeys = Object.values(allModules).map(m => m.name).filter(Boolean);
    const uniqueKeys = new Set(titleKeys);
    assert(
        titleKeys.length === uniqueKeys.size,
        `[7b.Unique] Pas de collision de titleKey : ${uniqueKeys.size} uniques sur ${titleKeys.length}`
    );

    // 7c. Verifier chaque module via la map
    for (const [key, mod] of Object.entries(allModules)) {
        _ctx = { step: 7, stepName: 'Lookup map', file: '', module: key, source: '' };

        if (!mod.name) continue;

        const lookup = modulesByTitleKey.get(mod.name);
        assert(
            lookup && lookup.key === key,
            `[7c.Lookup] ${key} : map.get("${mod.name}") → key="${lookup?.key}" (attendu "${key}")`
        );
    }

    // 7d. Verifier les champs requis des modules H5P
    _ctx = { step: 7, stepName: 'Lookup map', file: '', module: '', source: 'h5p' };
    for (const [key, mod] of Object.entries(h5pModules)) {
        _ctx.module = key;
        assert(
            mod.machineName && typeof mod.machineName === 'string',
            `[7d.H5P] ${key} : machineName="${mod.machineName}"`
        );
        assert(
            mod.createBtnId && typeof mod.createBtnId === 'string',
            `[7d.H5P] ${key} : createBtnId="${mod.createBtnId}"`
        );
        assert(
            mod.promptId && typeof mod.promptId === 'string',
            `[7d.H5P] ${key} : promptId="${mod.promptId}"`
        );
        assert(
            mod.jsonInputId && typeof mod.jsonInputId === 'string',
            `[7d.H5P] ${key} : jsonInputId="${mod.jsonInputId}"`
        );
    }

    // 7e. Verifier les champs requis des modules Moodle
    _ctx.source = 'moodle';
    for (const [key, mod] of Object.entries(moodleModules)) {
        _ctx.module = key;
        assert(
            mod.name && typeof mod.name === 'string',
            `[7e.Moodle] ${key} : name="${mod.name}"`
        );
        assert(
            Array.isArray(mod.categories) && mod.categories.length > 0,
            `[7e.Moodle] ${key} : categories=${JSON.stringify(mod.categories)}`
        );
    }

    // 7f. Verifier coherence testCases ↔ modules existants
    _ctx = { step: 7, stepName: 'Lookup map', file: '', module: '', source: '' };
    for (const tc of testCases) {
        if (tc.source === 'h5p') {
            assert(
                !!h5pModules[tc.expectedModule],
                `[7f.TestCase] ${tc.file} : h5pModules["${tc.expectedModule}"] existe`
            );
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 8 : EXPORT DOCUMENTAIRE (DOCX / ODT / PDF)
// =======================================================================

async function runStep8_DocumentExport() {
    console.group('Etape 8 : Export documentaire (formatContentForDocument)');

    // Modules Moodle qui ne supportent pas l'export document
    const noDocExport = new Set(['elea_test', 'elea_glossaire']);

    for (const tc of testCases) {
        _ctx = { step: 8, stepName: 'Export doc', file: tc.file, module: tc.expectedModule, source: tc.source };

        // Determiner la cle de module pour le formateur
        // H5P : expectedModule directement (ex: 'QuizSet', 'Timeline')
        // Moodle : moodleActivityKey (ex: 'QCM', 'Page') ou expectedModule
        let formatKey = tc.expectedModule;
        if (tc.source === 'moodle' && tc.moodleActivityKey) {
            formatKey = tc.moodleActivityKey;
        }

        // Ignorer les modules sans export document
        if (noDocExport.has(tc.expectedModule)) continue;

        try {
            // Recuperer le JSON heale depuis le pipeline state (etapes 3-5)
            const state = pipelineState.get(tc.file);
            let jsonObj;
            if (state && state.healedObj) {
                jsonObj = structuredClone(state.healedObj);
            } else {
                // Fallback : charger et healer a la volee
                const rawText = await fetchRawText(tc.file);
                const healedString = healJsonString(rawText);
                jsonObj = JSON.parse(healedString);
                jsonObj = healJsonObject(jsonObj, tc.expectedModule);
                jsonObj = healActivitySpecificFields(jsonObj, tc.expectedModule);
                jsonObj = healStructureForActivity(jsonObj, tc.expectedModule);
            }

            // Appeler le formateur
            const t0 = performance.now();
            const formatted = await formatContentForDocument(formatKey, jsonObj);
            const t1 = performance.now();

            // Assertions de base : objet retourne avec title et sections
            assert(
                formatted && typeof formatted === 'object',
                `[8a.Format] ${tc.file} (${formatKey}) : formatContentForDocument retourne un objet`
            );

            if (!formatted) continue;

            // Titre non-vide
            assert(
                formatted.title && typeof formatted.title === 'string' && formatted.title.trim().length > 0,
                `[8b.Title] ${tc.file} (${formatKey}) : titre present = "${(formatted.title || '').substring(0, 50)}"`
            );

            // Sections est un tableau non-vide
            assert(
                Array.isArray(formatted.sections) && formatted.sections.length > 0,
                `[8c.Sections] ${tc.file} (${formatKey}) : ${formatted.sections?.length || 0} section(s) generee(s) (${(t1 - t0).toFixed(1)}ms)`
            );

            // Verifier que chaque section a un type valide
            if (Array.isArray(formatted.sections)) {
                const validTypes = new Set([
                    'header', 'paragraph', 'image', 'separator', 'pageBreak',
                    'table', 'bulletPoint', 'checkbox', 'flashcardTable',
                    'numberedItem', 'quote', 'code'
                ]);
                const invalidSections = formatted.sections.filter(s => !s.type || !validTypes.has(s.type));
                assert(
                    invalidSections.length === 0,
                    `[8d.Types] ${tc.file} (${formatKey}) : tous les types de section sont valides`,
                    invalidSections.length > 0 ? {
                        issues: invalidSections.map(s => `type inconnu: "${s.type}" (contenu: ${JSON.stringify(s).substring(0, 80)})`)
                    } : null
                );
            }

            recordTiming('Export doc', `${formatKey} (${tc.file})`, t1 - t0);

        } catch (e) {
            assert(false, `[8.Export] ${tc.file} (${formatKey}) : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export { testCases, timings };

export const STEP_NAMES = [
    '', // index 0 inutilise
    'Prechargement',
    'structuredClone',
    'H5P Blob',
    'Moodle MBZ',
    'XML/GIFT',
    'Visualisation',
    'Lookup map',
    'Export doc'
];

/** Descriptions detaillees des etapes (pour tooltips dans le dashboard HTML) */
export const STEP_DESCRIPTIONS = [
    '', // index 0 inutilise
    'Verifie que tous les modules JS (h5p-creator, moodle-creator, document-exporter) et les bibliotheques externes (client-zip, fflate, JSZip, DOMPurify, h5p-standalone) se chargent correctement. Mesure aussi le temps du 2e appel (cache navigateur).\n\nExemple concret : quand vous cliquez "Generer", ces libs sont prechargees pendant que l\'IA travaille.',
    'Compare structuredClone() et JSON.parse(JSON.stringify()) sur chaque fichier d\'exemple pour verifier qu\'ils produisent des resultats identiques. C\'est l\'optimisation qui accelere le clonage des donnees apres generation.\n\nExemple concret : le JSON genere par l\'IA est clone avant transformation pour garder l\'original intact (bouton "Editer").',
    'Pipeline complet H5P : healing du JSON IA → processeur specifique (ex: Timeline, Crossword) → creation du fichier .h5p (ZIP) → relecture du ZIP pour verifier content.json et h5p.json → simulation de telechargement via objectURL.\n\nExemple concret : quand vous generez un "Quiz mixte", ce test verifie que le .h5p produit est un ZIP valide importable dans Moodle.',
    'Pipeline complet Moodle MBZ : healing → construction des donnees Moodle → generation des fichiers XML → packaging en archive TAR+GZIP (.mbz) → decompression pour verifier moodle_backup.xml.\n\nExemple concret : quand vous generez un "QCM Elea", ce test verifie que le .mbz contient bien tous les fichiers XML attendus par Moodle.',
    'Generation des formats Moodle textuels : XML (banque de questions) et GIFT pour les activites elea_test, plus le glossaire XML.\n\nExemple concret : quand vous generez un "Test Elea", le XML produit doit commencer par <?xml et contenir les questions au format Moodle.',
    'Smoke test de visualisation : pour 8 types representatifs (Timeline, QCM, Flashcards, QuizSet, Crossword, DialogCards, Glossary, FillInTheBlanks), verifie que la structure JSON est coherente apres relecture du ZIP et que mainLibrary est dans preloadedDependencies.\n\nExemple concret : quand vous cliquez "Visualiser", le contenu est relu depuis le .h5p — ce test verifie que cette relecture fonctionne.',
    'Verifie le registre central des modules : construction de la map modulesByTitleKey (optimisation O(1)), unicite des cles de traduction, presence des champs requis (machineName, createBtnId, promptId pour H5P ; name, categories pour Moodle).\n\nExemple concret : chaque tuile de l\'accueil correspond a un module — ce test verifie qu\'aucun module n\'a de conflit de nom.',
    'Teste formatContentForDocument() pour chaque activite : verifie que le titre est present, que les sections (paragraphes, tableaux, en-tetes, listes, cartes flash...) sont generees avec des types valides.\n\nExemple concret : quand vous cliquez "Exporter DOCX/ODT/PDF", ce formateur transforme le JSON en structure de document — ce test verifie cette transformation.'
];

export async function runAllTests() {
    console.log('=== Tests generation, telechargement et visualisation Caramel (8 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;
    pipelineState.clear();

    await runStep1_Preloading();
    await runStep2_StructuredClone();
    await runStep3_H5PGeneration();
    await runStep4_MoodleMBZ();
    await runStep5_MoodleXML();
    await runStep6_H5PVisualization();
    await runStep7_LookupMap();
    await runStep8_DocumentExport();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, testCases, STEP_NAMES, timings };
}
