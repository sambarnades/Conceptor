/**
 * Tests ultra-complets du pipeline Caramel (6 etapes)
 *
 * Reproduit le flux reel : JSON brut IA → healer → processeur → blob → editeur → re-export.
 * Verifie a chaque etape : LaTeX preserves, textes pedagogiques intacts, structure valide.
 *
 * Usage : ouvrir tests/test-edit-export-flow.html depuis le serveur local.
 */

import {
    detectContentType,
    normalizeDataForEditor,
    denormalizeDataForSave,
    getSchemaForType
} from '../js/editor/content-detector.js';

import {
    healJsonString,
    healJsonObject,
    healActivitySpecificFields,
    healStructureForActivity,
    normalizeDoubleEscapedLatex,
    repairBrokenLatexEscapes,
    autoWrapLatex,
    convertLatexDelimitersDeep,
    convertLatexEnvironmentsDeep
} from '../js/h5p/json-healer.js';

import {
    processH5PContent,
    getModuleMetadata
} from '../js/h5p/processors/index.js';

import {
    getActivityFiles,
    generateBaseData
} from '../js/moodle/processors/index.js';

import { loadJSZip, loadMoodleLibs } from '../js/core/lib-loader.js';
import { generateMoodleXml, generateMoodleGift } from '../js/moodle/moodle-formats.js';
import { createH5PBlob } from '../js/h5p/h5p-creator.js';
import { createMbz } from '../js/moodle/moodle-creator.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];

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

// skip() supprime : tous les cas doivent etre traites (PASS ou FAIL, jamais SKIP)

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

// =======================================================================
// HELPERS
// =======================================================================

/** Charge un fichier JSON en tant que string brut (pas parse) */
async function fetchRawText(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.text();
}

/** Charge et parse un fichier JSON */
async function fetchJson(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.json();
}

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

/** Verifie que toutes les valeurs texte de l'original existent dans le resultat */
function allTextValuesPreserved(original, result) {
    const originalTexts = extractTextValues(original);
    const resultTexts = extractTextValues(result);
    const missing = originalTexts.filter(t => !resultTexts.includes(t));
    return { ok: missing.length === 0, missing };
}

/**
 * Extrait tous les blocs LaTeX \(...\) d'un objet JSON.
 * Cherche dans la representation JSON stringifiee.
 */
function extractLatexPatterns(obj) {
    const patterns = [];
    const jsonStr = JSON.stringify(obj);
    // Pattern : \( ... \) dans le JSON (echappes en \\( ... \\))
    const regex = /\\\\?\([\s\S]*?\\\\?\)/g;
    let match;
    while ((match = regex.exec(jsonStr)) !== null) {
        patterns.push(match[0]);
    }
    return [...new Set(patterns)]; // Deduplique
}

/** Verifie que les patterns LaTeX de l'original sont presents dans le resultat */
function verifyLatexPreserved(originalPatterns, resultObj) {
    if (originalPatterns.length === 0) return { ok: true, missing: [], count: 0 };
    const resultStr = JSON.stringify(resultObj);
    const missing = originalPatterns.filter(p => !resultStr.includes(p));
    return { ok: missing.length === 0, missing, count: originalPatterns.length };
}

/**
 * Detecte les commandes LaTeX brutes non converties en Unicode dans un textField.
 * Utilise pour verifier que DragTheWords et MarkTheWords convertissent bien le LaTeX.
 * Ignore les commandes a l'interieur de delimiteurs \(...\) (qui seront rendues par MathJax).
 */
function findRawLatexCommands(text) {
    if (!text || typeof text !== 'string') return [];
    // Retirer les blocs \(...\) (ceux-ci sont rendus par MathJax, pas besoin de Unicode)
    const stripped = text.replace(/\\\([^)]*?\\\)/g, '');
    // Chercher les commandes LaTeX restantes (backslash + lettres)
    const regex = /\\([a-zA-Z]{2,})(?![a-zA-Z])/g;
    const found = [];
    let match;
    while ((match = regex.exec(stripped)) !== null) {
        found.push(match[0]);
    }
    return [...new Set(found)];
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

/**
 * Simule une edition : modifie le premier champ texte significatif trouve.
 * Retourne true si une modification a ete effectuee.
 */
function simulateEdit(obj, marker = ' __EDITED_BY_TEST__') {
    if (obj === null || obj === undefined) return false;
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === 'object' && item !== null && simulateEdit(item, marker)) return true;
        }
        return false;
    }
    // Cles de contenu pedagogique (prioritaires pour le marqueur d'edition)
    const CONTENT_KEYS = new Set([
        'text', 'title', 'question', 'taskDescription', 'description', 'clue',
        'feedback', 'answer', 'label', 'front', 'back', 'textField',
        'figureDefinition', 'wordListHeader', 'definition', 'name'
    ]);
    // Cles de config a NE PAS marquer (valeurs techniques)
    const CONFIG_KEYS = new Set([
        'graphMode', 'chartType', 'color', 'fontColor', 'type', 'library',
        'machineName', 'path', 'alt', 'license', 'contentType', 'subContentId',
        'progressType', 'fillPool'
    ]);
    if (typeof obj === 'object') {
        // 1. Priorite : chercher une cle de contenu
        for (const key of Object.keys(obj)) {
            if (CONTENT_KEYS.has(key) && typeof obj[key] === 'string' && obj[key].trim().length > 5 && !obj[key].includes('__EDITED')) {
                obj[key] = obj[key] + marker;
                return true;
            }
        }
        // 2. Fallback : toute chaine >5 sauf config et H5P
        for (const key of Object.keys(obj)) {
            if (!CONFIG_KEYS.has(key) && typeof obj[key] === 'string' && obj[key].trim().length > 5 && !obj[key].includes('H5P.') && !obj[key].includes('__EDITED')) {
                obj[key] = obj[key] + marker;
                return true;
            }
        }
        // 3. Recurse dans les sous-objets
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && simulateEdit(obj[key], marker)) return true;
        }
    }
    return false;
}

/** Verifie que le marqueur d'edition est present quelque part dans l'objet */
function containsEditMarker(obj, marker = '__EDITED_BY_TEST__') {
    const str = JSON.stringify(obj);
    return str.includes(marker);
}

// Marqueur pour identifier les elements ajoutes par le test
const ADDED_ELEMENT_MARKER = '__ADDED_BY_TEST__';

/**
 * Simule l'ajout d'un element dans un tableau (critere, paire, question, bloc).
 * Pour Devoir, ajoute aussi un niveau au premier critere existant (test imbrication).
 * Retourne un objet descriptif ou null si le type n'est pas concerne.
 */
function simulateAddElement(obj, moduleKey) {
    if (!obj || typeof obj !== 'object') return null;

    switch (moduleKey) {
        case 'elea_devoir': {
            if (!Array.isArray(obj.criteria) || obj.criteria.length === 0) return null;
            const originalCount = obj.criteria.length;
            // 1. Ajouter un nouveau critere complet
            obj.criteria.push({
                description: `Critere ${ADDED_ELEMENT_MARKER}`,
                levels: [
                    { score: 0, definition: `Niveau 0 ${ADDED_ELEMENT_MARKER}` },
                    { score: 1, definition: `Niveau 1 ${ADDED_ELEMENT_MARKER}` }
                ]
            });
            // 2. Ajouter un niveau au premier critere existant (test tableau imbrique)
            const firstCriterion = obj.criteria[0];
            const originalLevelCount = firstCriterion.levels.length;
            const maxScore = Math.max(...firstCriterion.levels.map(l => l.score));
            firstCriterion.levels.push({
                score: maxScore + 1,
                definition: `Niveau supplementaire ${ADDED_ELEMENT_MARKER}`
            });
            return {
                added: true, arrayKey: 'criteria',
                originalCount, newCount: obj.criteria.length,
                nestedAdd: {
                    criterionIndex: 0, levelArrayKey: 'levels',
                    originalLevelCount, newLevelCount: firstCriterion.levels.length
                }
            };
        }
        case 'elea_appariement': {
            if (!Array.isArray(obj.pairs)) return null;
            const originalCount = obj.pairs.length;
            obj.pairs.push({
                question: `Question ${ADDED_ELEMENT_MARKER}`,
                answer: `Reponse ${ADDED_ELEMENT_MARKER}`
            });
            return { added: true, arrayKey: 'pairs', originalCount, newCount: obj.pairs.length };
        }
        case 'elea_millionnaire': {
            if (!Array.isArray(obj.questions)) return null;
            const originalCount = obj.questions.length;
            obj.questions.push({
                question: `Question ${ADDED_ELEMENT_MARKER}`,
                goodanswer: `Bonne reponse ${ADDED_ELEMENT_MARKER}`,
                badanswer: [`Mauvaise 1 ${ADDED_ELEMENT_MARKER}`, `Mauvaise 2 ${ADDED_ELEMENT_MARKER}`, `Mauvaise 3 ${ADDED_ELEMENT_MARKER}`]
            });
            return { added: true, arrayKey: 'questions', originalCount, newCount: obj.questions.length };
        }
        case 'elea_qcm': {
            if (!Array.isArray(obj.questions)) return null;
            const originalCount = obj.questions.length;
            obj.questions.push({
                text: `Question ${ADDED_ELEMENT_MARKER}`,
                answers: [
                    { text: `Bonne reponse ${ADDED_ELEMENT_MARKER}`, correct: true },
                    { text: `Mauvaise reponse ${ADDED_ELEMENT_MARKER}`, correct: false }
                ]
            });
            return { added: true, arrayKey: 'questions', originalCount, newCount: obj.questions.length };
        }
        case 'elea_page': {
            if (!Array.isArray(obj.blocks)) return null;
            const originalCount = obj.blocks.length;
            // Structure conforme au schema : type = valeur du select, data = objet pageBlockData
            obj.blocks.push({
                type: '#12_context_paragraphs',
                data: {
                    title: `Titre ${ADDED_ELEMENT_MARKER}`,
                    paragraphs: [
                        { text: `Paragraphe ${ADDED_ELEMENT_MARKER}` }
                    ]
                }
            });
            return { added: true, arrayKey: 'blocks', originalCount, newCount: obj.blocks.length };
        }
        default:
            return null;
    }
}

/** Verifie la structure H5P selon le type */
function verifyH5PStructure(content, moduleKey) {
    const issues = [];
    if (!content || typeof content !== 'object') {
        issues.push('contenu null ou non-objet');
        return { ok: false, issues };
    }

    // QuizSet : verifier questions[].library et subContentId
    if (moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') {
        if (!Array.isArray(content.questions) || content.questions.length === 0) {
            issues.push('questions manquantes ou vides');
        } else {
            content.questions.forEach((q, i) => {
                if (!q.library) issues.push(`question[${i}].library manquant`);
                if (!q.subContentId) issues.push(`question[${i}].subContentId manquant`);
                // DragQuestion : verifier la structure processee (dropZones avec dimensions, elements avec position)
                if (q.library && q.library.startsWith('H5P.DragQuestion') && q.params) {
                    if (!Array.isArray(q.params.question?.task?.dropZones) || q.params.question.task.dropZones.length === 0) {
                        issues.push(`question[${i}] DragQuestion : dropZones manquantes dans question.task`);
                    }
                    if (!Array.isArray(q.params.question?.task?.elements) || q.params.question.task.elements.length === 0) {
                        issues.push(`question[${i}] DragQuestion : elements manquants dans question.task`);
                    }
                }
            });
        }
    }

    // Types avec behaviour
    const typesWithBehaviour = ['MultipleChoice', 'TrueFalse', 'FillInTheBlanks',
        'DragTheWords', 'MarkTheWords', 'Essay', 'Summary', 'FindTheWords',
        'SingleChoiceSet', 'SortParagraphs', 'QuizSet', 'QuizSetQCM', 'QuizSetVF'];
    if (typesWithBehaviour.includes(moduleKey)) {
        if (!content.behaviour) issues.push('behaviour manquant');
    }

    return { ok: issues.length === 0, issues };
}

/**
 * Construit les donnees Moodle a partir du JSON heale pour getActivityFiles.
 * Reproduit la logique des handlers de moodle-creator.js.
 */
function buildMoodleData(moduleKey, healedObj) {
    const title = healedObj.title || healedObj.name || 'Test Activity';
    const base = generateBaseData(title);
    // Surcharger le titre avec escapeXml
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
// CAS DE TEST
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
    { file: 'quiz_mixte_5.json', titleKey: 'h5p_quiz_set_description', expectedModule: 'QuizSet', source: 'h5p' },
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

// Collection des fichiers generes pour le ZIP master (v1 = generation initiale, v2 = apres edition)
const generatedFiles = new Map();

/** Genere le contenu XML d'import Glossaire Moodle a partir du JSON heale */
function generateGlossaireXmlContent(healedObj) {
    let entriesXml = '';
    for (const entry of (healedObj.entries || [])) {
        if (!entry.concept || !entry.definition) continue;
        let aliasesXml = '';
        if (Array.isArray(entry.aliases) && entry.aliases.length > 0) {
            aliasesXml = '<ALIASES>' + entry.aliases.map(a =>
                `<ALIAS><NAME>${escapeXml(a)}</NAME></ALIAS>`
            ).join('') + '</ALIASES>';
        }
        entriesXml += `
      <ENTRY>
        <CONCEPT>${escapeXml(entry.concept)}</CONCEPT>
        <DEFINITION>${escapeXml(entry.definition)}</DEFINITION>
        <FORMAT>1</FORMAT>
        <USEDYNALINK>1</USEDYNALINK>
        ${aliasesXml}
      </ENTRY>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<GLOSSARY>
  <INFO>
    <NAME>${escapeXml(healedObj.name || 'Glossaire')}</NAME>
    <ENTRIES>${entriesXml}
    </ENTRIES>
  </INFO>
</GLOSSARY>`;
}

/** Cree un blob MBZ via le meme pipeline que moodle-creator.js */
async function createMbzBlob(files) {
    const gzData = await createMbz(files);
    return new Blob([gzData], { type: 'application/octet-stream' });
}

/** Verifie qu'aucune chaine ne contient de LaTeX double-echappe residuel (\\( ou \\[) */
function checkNoDoubleEscapedLatex(obj) {
    const texts = extractTextValues(obj);
    const bad = texts.filter(t => t.includes('\\\\(') || t.includes('\\\\['));
    return { ok: bad.length === 0, count: bad.length, samples: bad.slice(0, 3) };
}

// =======================================================================
// ETAPE 1 : CHARGEMENT DU JSON BRUT
// =======================================================================

async function runStep1_LoadRawJson() {
    console.group('Etape 1 : Chargement du JSON brut');

    for (const tc of testCases) {
        _ctx = { step: 1, stepName: 'Chargement', file: tc.file, module: tc.expectedModule, source: tc.source };
        try {
            const rawText = await fetchRawText(tc.file);
            assert(
                rawText && rawText.trim().length > 0,
                `[1.Chargement] ${tc.file} : fichier charge (${rawText.length} caracteres)`
            );
            pipelineState.set(tc.file, { rawText });
        } catch (e) {
            assert(false, `[1.Chargement] ${tc.file} : exception - ${e.message}`);
            pipelineState.set(tc.file, { error: e.message });
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : PIPELINE HEALER COMPLET
// =======================================================================

async function runStep2_HealerPipeline() {
    console.group('Etape 2 : Pipeline Healer');

    for (const tc of testCases) {
        _ctx = { step: 2, stepName: 'Healer', file: tc.file, module: tc.expectedModule, source: tc.source };
        const state = pipelineState.get(tc.file);
        if (!state || state.error) {
            assert(false, `[2.Healer] ${tc.file} : bloque (echec etape 1)`);
            continue;
        }

        try {
            // 2a. Heal de la string brute
            const healedString = healJsonString(state.rawText);
            assert(
                typeof healedString === 'string' && healedString.length > 0,
                `[2a.HealString] ${tc.file} : string healee (${healedString.length} car.)`
            );

            // 2b. Parse JSON
            let jsonObj;
            try {
                jsonObj = JSON.parse(healedString);
            } catch (parseErr) {
                // Si le parse echoue meme apres healString, c'est un vrai echec du healer
                assert(false, `[2b.Parse] ${tc.file} : echec parse apres healString - ${parseErr.message}`);
                state.error = 'parse_failed';
                continue;
            }
            assert(
                jsonObj !== null && typeof jsonObj === 'object',
                `[2b.Parse] ${tc.file} : JSON parse reussi`
            );

            // Extraire les patterns LaTeX avant healing (pour comparaison)
            state.latexPatternsRaw = extractLatexPatterns(jsonObj);

            // 2c. Heal de l'objet
            const moduleKeyForHeal = tc.expectedModule;
            jsonObj = healJsonObject(jsonObj, moduleKeyForHeal);
            assert(
                jsonObj !== null && typeof jsonObj === 'object',
                `[2c.HealObject] ${tc.file} : objet heale`
            );

            // 2d. Heal des champs specifiques a l'activite
            jsonObj = healActivitySpecificFields(jsonObj, moduleKeyForHeal);
            assert(
                jsonObj !== null && typeof jsonObj === 'object',
                `[2d.HealFields] ${tc.file} : champs specifiques heales`
            );

            // 2e. Heal structurel
            jsonObj = healStructureForActivity(jsonObj, moduleKeyForHeal);
            assert(
                jsonObj !== null && typeof jsonObj === 'object',
                `[2e.HealStructure] ${tc.file} : structure healee`
            );

            // 2f. Detection du type
            const detected = detectContentType(jsonObj, tc.titleKey);
            assert(
                detected !== null && detected.moduleKey === tc.expectedModule,
                `[2f.Detection] ${tc.file} : moduleKey = "${detected?.moduleKey}" (attendu "${tc.expectedModule}")`
            );

            // 2g. Schema existe
            const schema = getSchemaForType(tc.expectedModule);
            assert(
                schema !== null && schema.sections && schema.sections.length > 0,
                `[2g.Schema] ${tc.file} : schema avec ${schema?.sections?.length || 0} sections`
            );

            // 2h. Normalisation LaTeX double-echappe (pipeline Moodle)
            // Pour les types Moodle, appliquer normalizeDoubleEscapedLatex comme le fait healLatexForMoodle
            if (tc.source === 'moodle' || tc.source === 'moodle_xml') {
                jsonObj = normalizeDoubleEscapedLatex(jsonObj);
            }

            // 2i. Verification : pas de LaTeX double-echappe residuel
            const dblCheck = checkNoDoubleEscapedLatex(jsonObj);
            assert(
                dblCheck.ok,
                `[2h.DoubleEscape] ${tc.file} : pas de LaTeX double-echappe residuel${dblCheck.ok ? '' : ' (' + dblCheck.count + ' chaines)'}`,
                !dblCheck.ok ? { samples: dblCheck.samples } : null
            );

            // 2j. Verification math : detecter les commandes double-echappees dans les blocs \(...\)
            const mathStringsAfterHeal = collectMathStrings(jsonObj);
            if (mathStringsAfterHeal.length > 0) {
                const allHealedStr = extractTextValues(jsonObj);
                const dblCmdIssues = [];
                allHealedStr.forEach(s => dblCmdIssues.push(...detectDoubleEscapedCommands(s)));
                assert(dblCmdIssues.length === 0,
                    `[2j.MathEncoding] ${tc.file} : pas de commandes LaTeX double-echappees apres healing (${mathStringsAfterHeal.length} formules)${dblCmdIssues.length > 0 ? ' - ' + dblCmdIssues.join('; ') : ''}`,
                    dblCmdIssues.length > 0 ? { issues: dblCmdIssues, mathStrings: mathStringsAfterHeal.slice(0, 5) } : null);
            }

            // 2k. Verification : pas de commandes LaTeX nues hors blocs \(...\)
            // Detecte les raccourcis LaTeX non convertis (ex: \ge, \le, \times, \sqrt) dans le texte brut
            const BARE_LATEX_CMDS = /(?<!\\[(\[])\\(ge|le|geq|leq|neq|times|div|sqrt|frac|alpha|beta|gamma|delta|pi|theta|sigma|infty|pm|approx|equiv|sim|nabla|partial|sum|prod|int|forall|exists|in|subset|cup|cap|emptyset|rightarrow|leftarrow|Rightarrow|Leftarrow|cdot|circ)(?![a-zA-Z])/;
            const allTextsForBareCheck = extractTextValues(jsonObj);
            const bareLatexIssues = [];
            for (const txt of allTextsForBareCheck) {
                // Retirer les blocs \(...\) et \[...\] qui sont destines a MathJax
                const withoutMathBlocks = txt
                    .replace(/\\\([\s\S]*?\\\)/g, '')
                    .replace(/\\\[[\s\S]*?\\\]/g, '');
                const match = withoutMathBlocks.match(BARE_LATEX_CMDS);
                if (match) {
                    bareLatexIssues.push(`"\\${match[1]}" dans: "${txt.substring(0, 80)}"`);
                }
            }
            assert(
                bareLatexIssues.length === 0,
                `[2k.BareLatex] ${tc.file} : pas de commandes LaTeX nues hors blocs math`,
                bareLatexIssues.length > 0 ? { issues: bareLatexIssues.slice(0, 5) } : null
            );

            // Extraire les patterns LaTeX apres healing
            state.latexPatternsHealed = extractLatexPatterns(jsonObj);

            // Stocker le resultat pour les etapes suivantes
            state.healedObj = jsonObj;
        } catch (e) {
            assert(false, `[2.Healer] ${tc.file} : exception inattendue - ${e.message}`);
            state.error = 'healer_exception';
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : GENERATION DU CONTENU FINAL + VERIFICATION BLOB
// =======================================================================

async function runStep3_ContentGeneration() {
    console.group('Etape 3 : Generation du contenu + blob');

    // Charger JSZip pour la relecture/verification des blobs H5P et le ZIP master
    let jsZipReady = false;
    try {
        await loadJSZip();
        jsZipReady = typeof JSZip !== 'undefined';
    } catch (e) {
        console.warn('[Etape 3] JSZip non disponible, verification ZIP en skip');
    }

    // Charger fflate pour la relecture/verification des blobs MBZ
    // (createMbz charge les libs lui-meme pour la generation)
    try {
        await loadMoodleLibs();
    } catch (e) {
        console.warn('[Etape 3] Libs Moodle non disponibles pour verification');
    }

    for (const tc of testCases) {
        _ctx = { step: 3, stepName: 'Generation', file: tc.file, module: tc.expectedModule, source: tc.source };
        const state = pipelineState.get(tc.file);
        if (!state || state.error || !state.healedObj) {
            assert(false, `[3.Generation] ${tc.file} : bloque (echec etape 2)`);
            continue;
        }

        try {
            if (tc.source === 'h5p') {
                // --- H5P : processeur + ZIP ---
                const clone = JSON.parse(JSON.stringify(state.healedObj));
                const processedContent = await processH5PContent(tc.expectedModule, clone);

                assert(
                    processedContent !== null && processedContent !== undefined,
                    `[3a.Process] ${tc.file} : processeur H5P retourne du contenu`
                );

                // Extraire le contenu final (peut etre {content, dependencies} ou direct)
                let contentJson = processedContent;
                if (processedContent && processedContent.content) {
                    contentJson = processedContent.content;
                    state.dynamicDependencies = processedContent.dependencies || [];
                }
                state.processedContent = contentJson;

                // Verification LaTeX apres processing
                if (state.latexPatternsHealed.length > 0) {
                    const latexCheck = verifyLatexPreserved(state.latexPatternsHealed, contentJson);
                    assert(
                        latexCheck.ok,
                        `[3b.LaTeX] ${tc.file} : ${latexCheck.count} patterns LaTeX preserves apres processing${latexCheck.ok ? '' : ' (' + latexCheck.missing.length + ' manquants)'}`,
                        !latexCheck.ok ? { missing: latexCheck.missing } : null
                    );
                }

                // 3b2. Verification math : commandes double-echappees apres processing
                const mathStringsAfterProc = collectMathStrings(contentJson);
                if (mathStringsAfterProc.length > 0) {
                    const allProcStr = extractTextValues(contentJson);
                    const dblCmdProc = [];
                    allProcStr.forEach(s => dblCmdProc.push(...detectDoubleEscapedCommands(s)));
                    assert(dblCmdProc.length === 0,
                        `[3b2.MathEncoding] ${tc.file} : pas de commandes LaTeX double-echappees apres processing (${mathStringsAfterProc.length} formules)${dblCmdProc.length > 0 ? ' - ' + dblCmdProc.join('; ') : ''}`,
                        dblCmdProc.length > 0 ? { issues: dblCmdProc, mathStrings: mathStringsAfterProc.slice(0, 5) } : null);
                }

                // Verification de la structure H5P
                const structCheck = verifyH5PStructure(contentJson, tc.expectedModule);
                assert(
                    structCheck.ok,
                    `[3c.Structure] ${tc.file} : structure H5P valide${structCheck.ok ? '' : ' - ' + structCheck.issues.join(', ')}`,
                    !structCheck.ok ? { issues: structCheck.issues } : null
                );

                // Verification conversion LaTeX→Unicode pour DragTheWords et MarkTheWords
                // Ces activites ne supportent pas MathJax : tout le LaTeX doit etre converti en Unicode
                if ((tc.expectedModule === 'DragTheWords' || tc.expectedModule === 'MarkTheWords') && contentJson.textField) {
                    const rawLatex = findRawLatexCommands(contentJson.textField);
                    assert(
                        rawLatex.length === 0,
                        `[3c2.Unicode] ${tc.file} : LaTeX converti en Unicode dans textField${rawLatex.length > 0 ? ' (restants: ' + rawLatex.join(', ') + ')' : ''}`,
                        rawLatex.length > 0 ? { rawCommands: rawLatex } : null
                    );
                }

                // Verification pour les QuizSet : sous-questions imbriquees
                if ((tc.expectedModule === 'QuizSet' || tc.expectedModule === 'QuizSetQCM' || tc.expectedModule === 'QuizSetVF')
                    && Array.isArray(contentJson.questions)) {
                    contentJson.questions.forEach((q, i) => {
                        if (!q.library || !q.params) return;
                        const lib = q.library.split(' ')[0];
                        // DragText/MarkTheWords : LaTeX converti en Unicode
                        if ((lib === 'H5P.DragText' || lib === 'H5P.MarkTheWords') && q.params.textField) {
                            const rawLatex = findRawLatexCommands(q.params.textField);
                            assert(
                                rawLatex.length === 0,
                                `[3c2.Unicode] ${tc.file} question[${i}] (${lib}) : LaTeX converti en Unicode${rawLatex.length > 0 ? ' (restants: ' + rawLatex.join(', ') + ')' : ''}`,
                                rawLatex.length > 0 ? { rawCommands: rawLatex } : null
                            );
                        }
                        // DragQuestion : structure processee par transformForQuizSet
                        if (lib === 'H5P.DragQuestion') {
                            const task = q.params.question?.task;
                            assert(
                                task && Array.isArray(task.dropZones) && task.dropZones.length > 0,
                                `[3c3.DragQ] ${tc.file} question[${i}] : DragQuestion dropZones processees (${task?.dropZones?.length || 0} zones)`
                            );
                            assert(
                                task && Array.isArray(task.elements) && task.elements.length > 0,
                                `[3c3.DragQ] ${tc.file} question[${i}] : DragQuestion elements processes (${task?.elements?.length || 0} elements)`
                            );
                        }
                    });
                }

                // --- Blob H5P (ZIP via client-zip, meme pipeline que h5p-creator.js) ---
                const metadata = getModuleMetadata(tc.expectedModule);
                if (metadata) {
                    const dependencies = [
                        ...metadata.extraDependencies,
                        { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor }
                    ];

                    const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
                        title: contentJson.title || 'Test Activity',
                        lang: 'fr'
                    });

                    assert(
                        h5pBlob && h5pBlob.size > 0,
                        `[3d.ZIP] ${tc.file} : H5P cree (${h5pBlob.size} octets)`
                    );

                    // Relire le ZIP (JSZip pour verification)
                    if (jsZipReady) {
                        const readBack = await JSZip.loadAsync(h5pBlob);
                        const contentFile = readBack.file('content/content.json');
                        assert(
                            contentFile !== null,
                            `[3e.ZIP.Read] ${tc.file} : content/content.json extractible du ZIP`
                        );

                        if (contentFile) {
                            const contentReadBack = JSON.parse(await contentFile.async('text'));
                            const h5pFile = readBack.file('h5p.json');
                            const h5pReadBack = h5pFile ? JSON.parse(await h5pFile.async('text')) : null;

                            assert(
                                h5pReadBack && h5pReadBack.mainLibrary === metadata.machineName,
                                `[3f.ZIP.H5P] ${tc.file} : h5p.json mainLibrary = "${h5pReadBack?.mainLibrary}"`
                            );

                            // Verifier LaTeX dans le blob relu
                            if (state.latexPatternsHealed.length > 0) {
                                const blobLatex = verifyLatexPreserved(state.latexPatternsHealed, contentReadBack);
                                assert(
                                    blobLatex.ok,
                                    `[3g.ZIP.LaTeX] ${tc.file} : LaTeX preserve dans le blob ZIP${blobLatex.ok ? '' : ' (' + blobLatex.missing.length + ' manquants)'}`
                                );
                            }

                            state.blobContent = contentReadBack;
                        }
                    }

                    // Collecter le blob pour le ZIP master
                    generatedFiles.set(`v1_generation_initiale/${tc.file.replace('.json', '.h5p')}`, h5pBlob);
                }

            } else if (tc.source === 'moodle' && tc.moodleActivityKey) {
                // --- Moodle : getActivityFiles + MBZ ---
                const moodleData = buildMoodleData(tc.expectedModule, state.healedObj);
                let files;
                try {
                    files = getActivityFiles(tc.moodleActivityKey, moodleData);
                } catch (e) {
                    assert(false, `[3a.MoodleFiles] ${tc.file} : getActivityFiles echoue - ${e.message}`);
                    continue;
                }

                const fileCount = Object.keys(files).length;
                assert(
                    fileCount > 0,
                    `[3a.MoodleFiles] ${tc.file} : ${fileCount} fichiers generes`
                );

                // Verifier qu'il y a un fichier moodle_backup.xml
                const hasBackup = Object.keys(files).some(f => f.includes('moodle_backup'));
                assert(
                    hasBackup,
                    `[3b.MoodleBackup] ${tc.file} : moodle_backup.xml present`
                );

                state.moodleFiles = files;

                // --- Blob MBZ via createMbz (meme pipeline que moodle-creator.js) ---
                try {
                    const gzData = await createMbz(files);

                    assert(
                        gzData && gzData.length > 0,
                        `[3c.MBZ] ${tc.file} : MBZ cree (${gzData.length} octets)`
                    );

                    // Relire le MBZ (gunzipSync pour decompresser le GZIP)
                    const decompressed = fflate.gunzipSync(gzData);
                    const tarFiles = parseTar(decompressed);
                    const tarFileCount = Object.keys(tarFiles).length;

                    assert(
                        tarFileCount > 0,
                        `[3d.MBZ.Read] ${tc.file} : ${tarFileCount} fichiers extraits du MBZ`
                    );

                    state.mbzContent = tarFiles;

                    // Collecter le blob pour le ZIP master
                    generatedFiles.set(`v1_generation_initiale/${tc.file.replace('.json', '.mbz')}`, new Blob([gzData], { type: 'application/octet-stream' }));
                } catch (e) {
                    assert(false, `[3c.MBZ] ${tc.file} : echec createMbz - ${e.message}`);
                }

            } else if (tc.source === 'moodle_xml') {
                // Moodle XML direct (test, glossaire) : generation des fichiers d'export
                assert(
                    state.healedObj !== null && typeof state.healedObj === 'object',
                    `[3a.XMLData] ${tc.file} : donnees JSON healees valides pour export XML`
                );
                // Verifier que les donnees contiennent du contenu pedagogique
                const textValues = extractTextValues(state.healedObj);
                assert(
                    textValues.length > 0,
                    `[3b.XMLContent] ${tc.file} : ${textValues.length} valeurs texte dans le JSON heale`
                );
                state.processedContent = state.healedObj;

                // Generer les fichiers d'export et les collecter pour le ZIP master
                try {
                    if (tc.expectedModule === 'elea_glossaire') {
                        const xmlContent = generateGlossaireXmlContent(state.healedObj);
                        assert(xmlContent.includes('<GLOSSARY>'), `[3c.XMLGen] ${tc.file} : XML glossaire genere`);
                        generatedFiles.set(`v1_generation_initiale/${tc.file.replace('.json', '.xml')}`, new Blob([xmlContent], { type: 'text/xml' }));
                    } else if (tc.expectedModule === 'elea_test') {
                        const xmlContent = generateMoodleXml(state.healedObj);
                        const giftContent = generateMoodleGift(state.healedObj);
                        assert(xmlContent.length > 0, `[3c.XMLGen] ${tc.file} : XML test genere (${xmlContent.length} car.)`);
                        assert(giftContent.length > 0, `[3d.GIFTGen] ${tc.file} : GIFT genere (${giftContent.length} car.)`);
                        generatedFiles.set(`v1_generation_initiale/${tc.file.replace('.json', '.xml')}`, new Blob([xmlContent], { type: 'text/xml' }));
                        generatedFiles.set(`v1_generation_initiale/${tc.file.replace('.json', '.gift.txt')}`, new Blob([giftContent], { type: 'text/plain' }));
                    }
                } catch (e) {
                    assert(false, `[3c.XMLGen] ${tc.file} : echec generation XML/GIFT - ${e.message}`);
                }
            }
        } catch (e) {
            assert(false, `[3.Generation] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : EDITION VIA L'EDITEUR (NORMALISATION)
// =======================================================================

async function runStep5_EditorNormalize() {
    console.group('Etape 5 : Edition (normalisation)');

    for (const tc of testCases) {
        _ctx = { step: 5, stepName: 'Edition', file: tc.file, module: tc.expectedModule, source: tc.source };
        const state = pipelineState.get(tc.file);
        if (!state || state.error || !state.healedObj) {
            assert(false, `[5.Editor] ${tc.file} : bloque (echec etape precedente)`);
            continue;
        }

        try {
            const clone = JSON.parse(JSON.stringify(state.healedObj));
            const normalized = normalizeDataForEditor(clone, tc.expectedModule);

            assert(
                normalized !== null && normalized !== undefined,
                `[5a.Normalize] ${tc.file} : normalisation reussie`
            );

            // Verification des textes preserves (sauf Glossary qui change de structure)
            if (tc.expectedModule !== 'Glossary') {
                const check = allTextValuesPreserved(state.healedObj, normalized);
                assert(
                    check.ok,
                    `[5b.Textes] ${tc.file} : textes preserves apres normalisation${check.ok ? '' : ' (' + check.missing.length + ' manquants)'}`,
                    !check.ok ? { moduleKey: tc.expectedModule, missingValues: check.missing.slice(0, 5) } : null
                );
            } else {
                // Glossary : verifier la transformation tableau → {items: [...]}
                const originalData = state.healedObj;
                if (Array.isArray(originalData)) {
                    assert(
                        !Array.isArray(normalized) && Array.isArray(normalized.items),
                        `[5b.Glossary] ${tc.file} : tableau → {items: [...]}`
                    );
                }
            }

            // 5b2. Verification math : commandes double-echappees apres normalisation editeur
            const mathStringsAfterNorm = collectMathStrings(normalized);
            if (mathStringsAfterNorm.length > 0) {
                const allNormStr = extractTextValues(normalized);
                const dblCmdNorm = [];
                allNormStr.forEach(s => dblCmdNorm.push(...detectDoubleEscapedCommands(s)));
                assert(dblCmdNorm.length === 0,
                    `[5b2.MathEncoding] ${tc.file} : pas de commandes LaTeX double-echappees apres normalisation editeur (${mathStringsAfterNorm.length} formules)${dblCmdNorm.length > 0 ? ' - ' + dblCmdNorm.join('; ') : ''}`,
                    dblCmdNorm.length > 0 ? { issues: dblCmdNorm, mathStrings: mathStringsAfterNorm.slice(0, 5) } : null);
            }

            // Simuler une edition
            const editClone = JSON.parse(JSON.stringify(normalized));
            const edited = simulateEdit(editClone);
            assert(
                edited,
                `[5c.Edit] ${tc.file} : edition simulee (marqueur ajoute)`
            );
            assert(
                containsEditMarker(editClone),
                `[5d.EditMarker] ${tc.file} : marqueur __EDITED_BY_TEST__ present`
            );

            // Simuler l'ajout d'un element (activites Elea : tableaux criteria/pairs/questions/blocks)
            const addResult = simulateAddElement(editClone, tc.expectedModule);
            if (addResult) {
                assert(
                    addResult.newCount === addResult.originalCount + 1,
                    `[5e.AddElement] ${tc.file} : element ajoute dans ${addResult.arrayKey} (${addResult.originalCount} → ${addResult.newCount})`
                );
                if (addResult.nestedAdd) {
                    assert(
                        addResult.nestedAdd.newLevelCount === addResult.nestedAdd.originalLevelCount + 1,
                        `[5e2.AddLevel] ${tc.file} : niveau ajoute dans criteria[0].levels (${addResult.nestedAdd.originalLevelCount} → ${addResult.nestedAdd.newLevelCount})`
                    );
                }
                state.addElementResult = addResult;
            }

            state.normalizedObj = normalized;
            state.editedObj = editClone;
        } catch (e) {
            assert(false, `[5.Editor] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : SAUVEGARDE (DENORMALISATION) + VERIFICATION NON-PERTE
// =======================================================================

async function runStep6_SaveDenormalize() {
    console.group('Etape 6 : Sauvegarde (denormalisation)');

    for (const tc of testCases) {
        _ctx = { step: 6, stepName: 'Sauvegarde', file: tc.file, module: tc.expectedModule, source: tc.source };
        const state = pipelineState.get(tc.file);
        if (!state || !state.editedObj) {
            assert(false, `[6.Save] ${tc.file} : bloque (echec etape precedente)`);
            continue;
        }

        try {
            const clone = JSON.parse(JSON.stringify(state.editedObj));
            const saved = denormalizeDataForSave(clone, tc.expectedModule);

            assert(
                saved !== null && saved !== undefined,
                `[6a.Denormalize] ${tc.file} : denormalisation reussie`
            );

            // Le marqueur d'edition doit survivre
            assert(
                containsEditMarker(saved),
                `[6b.EditMarker] ${tc.file} : marqueur __EDITED_BY_TEST__ preserve apres sauvegarde`
            );

            // Verification des textes preserves (vs l'original heale, en excluant le marqueur)
            // On verifie que les valeurs de l'original sont dans le resultat
            if (tc.expectedModule !== 'Glossary') {
                const origTexts = extractTextValues(state.healedObj);
                const savedTexts = extractTextValues(saved);
                // Chercher les textes originaux dans les textes sauves (en tenant compte du marqueur)
                const missing = origTexts.filter(t => {
                    return !savedTexts.some(st => st.includes(t) || t.includes(st.replace(' __EDITED_BY_TEST__', '')));
                });
                assert(
                    missing.length === 0,
                    `[6c.Textes] ${tc.file} : textes originaux preserves apres save${missing.length > 0 ? ' (' + missing.length + ' manquants)' : ''}`,
                    missing.length > 0 ? { missingValues: missing.slice(0, 5) } : null
                );
            }

            // Verification LaTeX
            if (state.latexPatternsHealed && state.latexPatternsHealed.length > 0) {
                const latexCheck = verifyLatexPreserved(state.latexPatternsHealed, saved);
                assert(
                    latexCheck.ok,
                    `[6d.LaTeX] ${tc.file} : LaTeX preserve apres round-trip edition${latexCheck.ok ? '' : ' (' + latexCheck.missing.length + ' manquants)'}`,
                    !latexCheck.ok ? { missing: latexCheck.missing } : null
                );
            }

            // Verifier que les elements ajoutes ont survecu la denormalisation
            if (state.addElementResult) {
                const { arrayKey, newCount, nestedAdd } = state.addElementResult;
                const savedArray = saved[arrayKey];
                assert(
                    Array.isArray(savedArray) && savedArray.length === newCount,
                    `[6e.AddElement] ${tc.file} : element ajoute preserve apres denormalisation (${arrayKey}: ${savedArray?.length || 0}/${newCount})`
                );
                assert(
                    JSON.stringify(saved).includes(ADDED_ELEMENT_MARKER),
                    `[6f.AddMarker] ${tc.file} : marqueur ADDED_BY_TEST present apres denormalisation`
                );
                if (nestedAdd) {
                    const levels = savedArray?.[nestedAdd.criterionIndex]?.levels;
                    assert(
                        Array.isArray(levels) && levels.length === nestedAdd.newLevelCount,
                        `[6e2.AddLevel] ${tc.file} : niveau ajoute preserve dans criteria[0].levels (${levels?.length || 0}/${nestedAdd.newLevelCount})`
                    );
                }
            }

            state.savedObj = saved;
        } catch (e) {
            assert(false, `[6.Save] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : RE-GENERATION APRES EDITION (VERIFICATION FINALE)
// =======================================================================

async function runStep7_RegenerateVerify() {
    console.group('Etape 7 : Re-generation apres edition');

    for (const tc of testCases) {
        _ctx = { step: 7, stepName: 'Re-export', file: tc.file, module: tc.expectedModule, source: tc.source };
        const state = pipelineState.get(tc.file);
        if (!state || !state.savedObj) {
            assert(false, `[7.Regen] ${tc.file} : bloque (echec etape precedente)`);
            continue;
        }

        try {
            // Re-heal structurel (comme le ferait regenerateH5PFile)
            let reHealed = JSON.parse(JSON.stringify(state.savedObj));
            reHealed = healStructureForActivity(reHealed, tc.expectedModule);

            if (tc.source === 'h5p') {
                // Re-processing H5P
                const clone = JSON.parse(JSON.stringify(reHealed));
                const reProcessed = await processH5PContent(tc.expectedModule, clone);

                let reContent = reProcessed;
                if (reProcessed && reProcessed.content) {
                    reContent = reProcessed.content;
                }

                assert(
                    reContent !== null && reContent !== undefined,
                    `[7a.ReProcess] ${tc.file} : re-processing H5P reussi`
                );

                // Le marqueur doit survivre
                assert(
                    containsEditMarker(reContent),
                    `[7b.EditMarker] ${tc.file} : marqueur __EDITED_BY_TEST__ dans le contenu re-genere`
                );

                // Structure toujours valide
                const structCheck = verifyH5PStructure(reContent, tc.expectedModule);
                assert(
                    structCheck.ok,
                    `[7c.Structure] ${tc.file} : structure H5P toujours valide${structCheck.ok ? '' : ' - ' + structCheck.issues.join(', ')}`
                );

                // Verification conversion LaTeX→Unicode pour DragTheWords et MarkTheWords (re-export)
                if ((tc.expectedModule === 'DragTheWords' || tc.expectedModule === 'MarkTheWords') && reContent.textField) {
                    const rawLatex = findRawLatexCommands(reContent.textField);
                    assert(
                        rawLatex.length === 0,
                        `[7c2.Unicode] ${tc.file} : LaTeX converti en Unicode apres re-export${rawLatex.length > 0 ? ' (restants: ' + rawLatex.join(', ') + ')' : ''}`,
                        rawLatex.length > 0 ? { rawCommands: rawLatex } : null
                    );
                }

                // LaTeX preserves
                if (state.latexPatternsHealed && state.latexPatternsHealed.length > 0) {
                    const latexCheck = verifyLatexPreserved(state.latexPatternsHealed, reContent);
                    assert(
                        latexCheck.ok,
                        `[7d.LaTeX] ${tc.file} : LaTeX preserve dans la re-generation${latexCheck.ok ? '' : ' (' + latexCheck.missing.length + ' manquants)'}`
                    );
                }

                // Stocker le contenu re-exporte pour l'etape 8
                state.reProcessedContent = reContent;

                // ZIP re-cree via createH5PBlob (meme pipeline que h5p-creator.js)
                const metadata = getModuleMetadata(tc.expectedModule);
                if (metadata) {
                    const dependencies = [
                        ...metadata.extraDependencies,
                        { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor }
                    ];

                    const reBlob = await createH5PBlob(reContent, metadata.machineName, dependencies, {
                        title: reContent.title || 'Re-export',
                        lang: 'fr'
                    });
                    assert(
                        reBlob && reBlob.size > 0,
                        `[7e.ZIP] ${tc.file} : H5P re-genere (${reBlob.size} octets)`
                    );

                    // Collecter le blob pour le ZIP master
                    generatedFiles.set(`v2_apres_edition/${tc.file.replace('.json', '.h5p')}`, reBlob);
                }

            } else if (tc.source === 'moodle' && tc.moodleActivityKey) {
                // Re-generation Moodle
                const moodleData = buildMoodleData(tc.expectedModule, reHealed);
                let files;
                try {
                    files = getActivityFiles(tc.moodleActivityKey, moodleData);
                    assert(
                        Object.keys(files).length > 0,
                        `[7a.MoodleRegen] ${tc.file} : fichiers Moodle re-generes (${Object.keys(files).length} fichiers)`
                    );

                    // Creer le blob MBZ via createMbz (meme pipeline que moodle-creator.js)
                    const mbzBlob = await createMbzBlob(files);
                    assert(mbzBlob && mbzBlob.size > 0, `[7b.MBZ] ${tc.file} : MBZ re-genere (${mbzBlob.size} octets)`);
                    generatedFiles.set(`v2_apres_edition/${tc.file.replace('.json', '.mbz')}`, mbzBlob);
                } catch (e) {
                    assert(false, `[7a.MoodleRegen] ${tc.file} : echec re-generation - ${e.message}`);
                }

                // Verifier que les elements ajoutes ont survecu la re-generation MBZ
                if (state.addElementResult) {
                    const { arrayKey, newCount, nestedAdd } = state.addElementResult;
                    const reHealedArray = reHealed[arrayKey];
                    assert(
                        Array.isArray(reHealedArray) && reHealedArray.length === newCount,
                        `[7f.AddElement] ${tc.file} : element ajoute preserve dans MBZ re-genere (${arrayKey}: ${reHealedArray?.length || 0}/${newCount})`
                    );
                    assert(
                        JSON.stringify(reHealed).includes(ADDED_ELEMENT_MARKER),
                        `[7g.AddMarker] ${tc.file} : marqueur ADDED_BY_TEST present dans MBZ re-genere`
                    );
                    if (nestedAdd) {
                        const levels = reHealedArray?.[nestedAdd.criterionIndex]?.levels;
                        assert(
                            Array.isArray(levels) && levels.length === nestedAdd.newLevelCount,
                            `[7f2.AddLevel] ${tc.file} : niveau ajoute preserve dans MBZ (criteria[0].levels: ${levels?.length || 0}/${nestedAdd.newLevelCount})`
                        );
                    }
                }

                // Stocker pour l'etape 8
                state.reProcessedContent = reHealed;

            } else if (tc.source === 'moodle_xml') {
                // Types XML direct : verifier que les donnees sont toujours coherentes
                assert(
                    reHealed !== null && typeof reHealed === 'object',
                    `[7a.XMLRegen] ${tc.file} : donnees re-healees valides`
                );
                assert(
                    containsEditMarker(reHealed),
                    `[7b.XMLMarker] ${tc.file} : marqueur __EDITED_BY_TEST__ preserve`
                );

                // Stocker pour l'etape 8
                state.reProcessedContent = reHealed;

                // Generer les fichiers d'export et les collecter pour le ZIP master
                try {
                    if (tc.expectedModule === 'elea_glossaire') {
                        const xmlContent = generateGlossaireXmlContent(reHealed);
                        generatedFiles.set(`v2_apres_edition/${tc.file.replace('.json', '.xml')}`, new Blob([xmlContent], { type: 'text/xml' }));
                    } else if (tc.expectedModule === 'elea_test') {
                        const xmlContent = generateMoodleXml(reHealed);
                        const giftContent = generateMoodleGift(reHealed);
                        generatedFiles.set(`v2_apres_edition/${tc.file.replace('.json', '.xml')}`, new Blob([xmlContent], { type: 'text/xml' }));
                        generatedFiles.set(`v2_apres_edition/${tc.file.replace('.json', '.gift.txt')}`, new Blob([giftContent], { type: 'text/plain' }));
                    }
                } catch (e) {
                    console.warn(`[7.XMLGen] ${tc.file} : generation XML/GIFT v2 echouee -`, e.message);
                }
            }
        } catch (e) {
            assert(false, `[7.Regen] ${tc.file} : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// GENERATION DU ZIP MASTER
// =======================================================================

/**
 * Genere un ZIP contenant toutes les activites generees avec succes.
 * Structure : v1_generation_initiale/ (premiere generation) et v2_apres_edition/ (apres edition).
 * @returns {Promise<Blob|null>} Le blob ZIP ou null si JSZip n'est pas disponible.
 */
export async function generateMasterZip() {
    if (typeof JSZip === 'undefined') {
        console.warn('[MasterZIP] JSZip non disponible');
        return null;
    }
    if (generatedFiles.size === 0) {
        console.warn('[MasterZIP] Aucun fichier genere a empaqueter');
        return null;
    }

    const zip = new JSZip();
    let fileCount = 0;

    for (const [path, blob] of generatedFiles) {
        zip.file(path, blob);
        fileCount++;
    }

    console.log(`[MasterZIP] Empaquetage de ${fileCount} fichiers...`);
    const masterBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    console.log(`[MasterZIP] ZIP master genere : ${(masterBlob.size / 1024).toFixed(1)} Ko`);
    return masterBlob;
}

/**
 * Telecharge le ZIP master contenant toutes les activites generees.
 */
export async function downloadMasterZip() {
    const blob = await generateMasterZip();
    if (!blob) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `caramel_test_exports_${dateStr}.zip`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    console.log(`[MasterZIP] Telechargement : ${fileName}`);
}

/** Nombre de fichiers collectes pour le ZIP */
export function getGeneratedFilesCount() {
    return generatedFiles.size;
}

// =======================================================================
// ETAPE 4 : ENCODAGE MATH (PRE-EDITION)
// =======================================================================

// --- 4.0 Cas de test synthetiques ---
// JSON bruts simulant les differents encodages que l'IA produit.
// Les rawJson sont ecrits comme l'IA les genererait (backslashs JSON).

const MATH_TEST_CASES = [
    // --- H5P avec MathJax (formules preservees) ---
    {
        moduleKey: 'MultipleChoice',
        description: 'QCM H5P - formules sqrt et frac',
        rawJson: '{"question":"Calculer \\\\(\\\\sqrt{9}\\\\)","answers":[{"text":"\\\\(\\\\frac{1}{3}\\\\)","correct":false},{"text":"3","correct":true}],"behaviour":{"singleAnswer":true}}',
        expectedPatterns: ['\\(\\sqrt{9}\\)', '\\(\\frac{1}{3}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'DragAndDrop',
        description: 'DragAndDrop - formules dans elements',
        rawJson: '{"title":"Test math","dropZones":[{"label":"Zone A","correctElements":[0,1]}],"elements":[{"text":"\\\\(\\\\sqrt{x}\\\\)"},{"text":"\\\\(\\\\frac{1}{x}\\\\)"}]}',
        expectedPatterns: ['\\(\\sqrt{x}\\)', '\\(\\frac{1}{x}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'TrueFalse',
        description: 'VraiFaux - formule dans question',
        rawJson: '{"question":"\\\\(\\\\sqrt{x^2}=|x|\\\\)","correct":"true"}',
        expectedPatterns: ['\\(\\sqrt{x^2}=|x|\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'FillInTheBlanks',
        description: 'Blanks - formule inline dans question',
        rawJson: '{"taskDescription":"Completer","questions":["f(x)=\\\\(\\\\sqrt{x}\\\\) est definie pour *x>=0*"]}',
        expectedPatterns: ['\\(\\sqrt{x}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'Essay',
        description: 'Essay - formule dans consigne',
        rawJson: '{"taskDescription":"Expliquer \\\\(\\\\sqrt{x}\\\\) et \\\\(x^{1/2}\\\\)","keywords":[{"keyword":"racine"}]}',
        expectedPatterns: ['\\(\\sqrt{x}\\)', '\\(x^{1/2}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'Flashcards',
        description: 'Flashcards - formule recto/verso',
        rawJson: '{"title":"Test","cards":[{"text":"\\\\(\\\\sqrt{16}\\\\)","answer":"4"}]}',
        expectedPatterns: ['\\(\\sqrt{16}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'DialogCards',
        description: 'DialogCards - formule recto',
        rawJson: '{"title":"Test","dialogs":[{"text":"\\\\(\\\\pi \\\\approx 3.14\\\\)","answer":"Pi"}]}',
        expectedPatterns: ['\\(\\pi \\approx 3.14\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'SingleChoiceSet',
        description: 'SingleChoiceSet - formule dans choix',
        rawJson: '{"title":"Test","choices":[{"question":"\\\\(\\\\sqrt{25}\\\\) = ?","answers":["5","25","10"]}]}',
        expectedPatterns: ['\\(\\sqrt{25}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- H5P sans MathJax (conversion Unicode) ---
    {
        moduleKey: 'DragTheWords',
        description: 'DragTheWords - formule convertie en Unicode',
        rawJson: '{"taskDescription":"Completer","textField":"La racine de 9 est *3*. La formule est \\\\(\\\\sqrt{x}\\\\)."}',
        expectedPatterns: ['\u221A(x)'],
        forbiddenPatterns: ['\\sqrt'],
        mathMode: 'unicode',
        source: 'h5p'
    },
    {
        moduleKey: 'MarkTheWords',
        description: 'MarkTheWords - formule convertie en Unicode',
        rawJson: '{"taskDescription":"Surligner","textField":"La *fonction* f(x)=\\\\(\\\\sqrt{x}\\\\) est *croissante*."}',
        expectedPatterns: ['\u221A(x)'],
        forbiddenPatterns: ['\\sqrt'],
        mathMode: 'unicode',
        source: 'h5p'
    },
    {
        moduleKey: 'FindTheWords',
        description: 'FindTheWords - LaTeX OK dans taskDescription, interdit dans wordList',
        rawJson: '{"taskDescription":"Trouver les mots lies a \\\\(\\\\sqrt{x}\\\\)","wordList":"RACINE,\\\\(\\\\sqrt{x}\\\\),CARRE,\\u03C0"}',
        expectedPatterns: ['\\(\\sqrt{x}\\)'],
        // wordList ne doit contenir ni LaTeX ni symboles Unicode math
        wordListForbidden: ['\\(', '\\sqrt', '\u03C0', '\u221A'],
        mathMode: 'wordlist',
        source: 'h5p'
    },
    // --- H5P Crossword : answer sans math ni espaces ---
    {
        moduleKey: 'Crossword',
        description: 'Crossword - answer sans math/espaces, clue avec MathJax OK',
        rawJson: '{"title":"Test math","words":[{"answer":"Racine carrée","clue":"Notee \\\\(\\\\sqrt{x}\\\\)"},{"answer":"\\\\(\\\\pi\\\\)","clue":"Constante pi"},{"answer":"Cosinus","clue":"Rapport adjacent/hypotenuse"}],"taskDescription":"Retrouvez les termes"}',
        expectedPatterns: ['\\(\\sqrt{x}\\)'],
        // answers ne doivent contenir ni math ni espaces
        answerForbidden: { noMath: true, noSpaces: true },
        mathMode: 'answer-clean',
        source: 'h5p'
    },
    // --- H5P Chart : texte brut uniquement, pas de LaTeX ---
    {
        moduleKey: 'Chart',
        description: 'Chart - pas de LaTeX dans les champs text',
        rawJson: '{"chartType":"bar","listOfTypes":[{"text":"\\\\(\\\\sqrt{x}\\\\)","value":10},{"text":"Normale","value":20}]}',
        expectedPatterns: [],
        textForbiddenLatex: true,
        mathMode: 'no-latex',
        source: 'h5p'
    },
    // --- Cas pathologiques ---
    {
        moduleKey: 'TrueFalse',
        description: 'VraiFaux - delimiteurs $ au lieu de \\\\(...\\\\)',
        rawJson: '{"question":"$\\\\sqrt{4}=2$","correct":"true"}',
        expectedPatterns: ['\\(\\sqrt{4}=2\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'MultipleChoice',
        description: 'QCM - LaTeX nu sans delimiteurs',
        rawJson: '{"question":"Calculer \\\\sqrt{9}","answers":[{"text":"3","correct":true},{"text":"9","correct":false}]}',
        expectedPatterns: ['\\('],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- Nouveaux cas : environnements LaTeX (ChatGPT/GPT-4) ---
    {
        moduleKey: 'MultipleChoice',
        description: 'QCM - \\\\begin{equation} converti en \\\\[...\\\\]',
        rawJson: '{"question":"Calculer \\\\begin{equation}\\\\sqrt{144}\\\\end{equation}","answers":[{"text":"12","correct":true},{"text":"72","correct":false}]}',
        expectedPatterns: ['\\[\\sqrt{144}\\]'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'DialogCards',
        description: 'DialogCards - \\\\begin{align} converti en \\\\[...\\\\]',
        rawJson: '{"title":"Test","dialogs":[{"text":"\\\\begin{align}(a+b)^2 = a^2+2ab+b^2\\\\end{align}","answer":"Identite remarquable"}]}',
        expectedPatterns: ['\\[(a+b)^2 = a^2+2ab+b^2\\]'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    {
        moduleKey: 'Flashcards',
        description: 'Flashcards - \\\\begin{math} converti en \\\\(...\\\\)',
        rawJson: '{"title":"Test","cards":[{"text":"\\\\begin{math}\\\\cos(x)\\\\end{math}","answer":"cosinus"}]}',
        expectedPatterns: ['\\(\\cos(x)\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- Nouveaux cas : \\displaystyle inutile ---
    {
        moduleKey: 'Essay',
        description: 'Essay - \\\\displaystyle supprime dans formule inline',
        rawJson: '{"taskDescription":"Calculer \\\\(\\\\displaystyle\\\\frac{1}{2}\\\\)","keywords":[{"keyword":"fraction"}]}',
        expectedPatterns: ['\\(\\frac{1}{2}\\)'],
        forbiddenPatterns: ['\\displaystyle'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- Nouveaux cas : entites HTML dans LaTeX ---
    {
        moduleKey: 'FillInTheBlanks',
        description: 'Blanks - entites HTML corrigees dans LaTeX',
        rawJson: '{"taskDescription":"Completer","questions":["Si \\\\(x &gt; 0\\\\) alors \\\\(\\\\sqrt{x}\\\\) est *defini*"]}',
        expectedPatterns: ['\\(x > 0\\)', '\\(\\sqrt{x}\\)'],
        forbiddenPatterns: ['&gt;', '&lt;'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- Nouveaux cas : delimiteurs mixtes ---
    {
        moduleKey: 'MultipleChoice',
        description: 'QCM - delimiteur mixte \\\\( ... $ repare',
        rawJson: '{"question":"Calculer \\\\(\\\\sqrt{16}$","answers":[{"text":"4","correct":true},{"text":"8","correct":false}]}',
        expectedPatterns: ['\\(\\sqrt{16}\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    },
    // --- Moodle (formules preservees) ---
    {
        moduleKey: 'QCM',
        description: 'QCM Moodle - formules preservees',
        rawJson: '{"title":"Test math","questions":[{"text":"Calculer \\\\(\\\\sqrt{16}\\\\)","answers":[{"text":"4","iscorrect":1},{"text":"8","iscorrect":0}]}]}',
        expectedPatterns: ['\\(\\sqrt{16}\\)'],
        mathMode: 'mathjax',
        source: 'moodle'
    },
    // --- Devoir (LaTeX → Unicode, pas de MathJax dans les rubriques Moodle) ---
    {
        moduleKey: 'Devoir',
        description: 'Devoir - commandes LaTeX orphelines dans criteres → Unicode',
        rawJson: '{"title":"Test","criteria":[{"description":"Utiliser \\\\times et v \\\\geq 0","levels":[{"score":0,"definition":"Non atteint"},{"score":1,"definition":"Score \\\\geq 50"},{"score":2,"definition":"Multiplie \\\\times 2"}]},{"description":"Critere stable","levels":[{"score":0,"definition":"Debut"},{"score":1,"definition":"Milieu"},{"score":2,"definition":"Fin"}]}]}',
        expectedPatterns: ['\u00D7', '\u2265'],
        forbiddenPatterns: ['\\times', '\\geq'],
        mathMode: 'no-latex',
        source: 'moodle',
        criteriaForbiddenLatex: true
    },
    {
        moduleKey: 'Devoir',
        description: 'Devoir - blocs \\\\(...\\\\) dans niveaux → Unicode',
        rawJson: '{"title":"Maths","criteria":[{"description":"Ma\u00EEtrise de \\\\(\\\\sqrt{x}\\\\)","levels":[{"score":0,"definition":"Ne sait pas calculer \\\\(\\\\sqrt{4}\\\\)"},{"score":1,"definition":"Calcule \\\\(\\\\sqrt{x}\\\\) pour x entier"},{"score":2,"definition":"Ma\u00EEtrise \\\\(\\\\frac{a}{b}\\\\)"}]},{"description":"Critere stable","levels":[{"score":0,"definition":"Debut"},{"score":1,"definition":"Milieu"},{"score":2,"definition":"Fin"}]}]}',
        expectedPatterns: ['\u221A(x)', '\u221A(4)', 'a/b'],
        forbiddenPatterns: ['\\(', '\\sqrt', '\\frac'],
        mathMode: 'no-latex',
        source: 'moodle',
        criteriaForbiddenLatex: true
    },
    // --- QuizSet avec sous-question DragQuestion ---
    {
        moduleKey: 'QuizSet',
        description: 'QuizSet - sous-question DragQuestion avec formules LaTeX dans elements',
        rawJson: '{"title":"Quiz math","questions":[{"library":"H5P.DragQuestion 1.14","metadata":{"title":"Classement"},"params":{"title":"Classe les expressions","dropZones":[{"label":"Positif","correctElements":[0,1]},{"label":"Negatif","correctElements":[2]}],"elements":[{"text":"\\\\(\\\\sqrt{9}\\\\)"},{"text":"\\\\(\\\\frac{1}{2}\\\\)"},{"text":"\\\\(-3\\\\)"}],"overallFeedback":[{"from":0,"to":50,"feedback":"A revoir."},{"from":51,"to":100,"feedback":"Bien."}]}},{"library":"H5P.TrueFalse 1.8","metadata":{"title":"VF"},"params":{"question":"\\\\(\\\\sqrt{4}=2\\\\)","correct":"true"}}],"overallFeedback":[{"from":0,"to":50,"feedback":"Moyen."},{"from":51,"to":100,"feedback":"Bien."}]}',
        expectedPatterns: ['\\(\\sqrt{9}\\)', '\\(\\frac{1}{2}\\)', '\\(-3\\)', '\\(\\sqrt{4}=2\\)'],
        mathMode: 'mathjax',
        source: 'h5p'
    }
];

// --- 4.1 Helpers pour la verification math ---

/** Liste des commandes LaTeX courantes pour detection */
const LATEX_COMMANDS = ['sqrt', 'frac', 'pi', 'times', 'alpha', 'beta', 'geq', 'leq',
    'theta', 'lambda', 'sigma', 'omega', 'delta', 'nabla', 'partial', 'sum', 'int',
    'vec', 'hat', 'cdot', 'rightarrow', 'infty', 'neq', 'approx', 'overline', 'text'];

/**
 * Detecte les commandes LaTeX double-echappees a l'interieur de blocs \(...\).
 * Ex: \(\\sqrt{x}\) → detecte \\sqrt comme probleme.
 * @param {string} str
 * @returns {string[]} Liste des commandes double-echappees trouvees
 */
function detectDoubleEscapedCommands(str) {
    if (!str || typeof str !== 'string') return [];
    const issues = [];
    // Chercher les blocs \(...\) (simple-echappe = correct)
    const blockRegex = /\\\([\s\S]*?\\\)/g;
    let match;
    while ((match = blockRegex.exec(str)) !== null) {
        const block = match[0];
        // Dans ce bloc, chercher \\cmd (double backslash + commande)
        for (const cmd of LATEX_COMMANDS) {
            if (block.includes('\\\\' + cmd)) {
                issues.push('\\\\' + cmd + ' dans ' + block.substring(0, 40));
            }
        }
    }
    // Aussi detecter les delimiteurs double-echappes : \\( ou \\)
    if (str.includes('\\\\(') || str.includes('\\\\)') || str.includes('\\\\[') || str.includes('\\\\]')) {
        issues.push('delimiteurs double-echappes : \\\\( ou \\\\)');
    }
    return issues;
}

/**
 * Detecte si une chaine contient des formules mathematiques.
 * Cherche les commandes LaTeX ou les delimiteurs \(, \[, $.
 * @param {string} str
 * @returns {boolean}
 */
function containsMathFormulas(str) {
    if (!str || typeof str !== 'string') return false;
    // Delimiteurs MathJax
    if (str.includes('\\(') || str.includes('\\[') || str.includes('$')) return true;
    // Commandes LaTeX
    for (const cmd of LATEX_COMMANDS) {
        if (str.includes('\\' + cmd)) return true;
    }
    // Caracteres Unicode math (apres conversion latexToUnicode)
    if (/[\u221A\u03B1-\u03C9\u03A0-\u03A9\u2200-\u22FF\u2190-\u21FF]/.test(str)) return true;
    return false;
}

/**
 * Parcourt recursivement un objet et collecte toutes les chaines contenant du math.
 * @param {any} obj
 * @returns {string[]}
 */
function collectMathStrings(obj) {
    const results = [];
    if (typeof obj === 'string') {
        if (containsMathFormulas(obj)) results.push(obj);
    } else if (Array.isArray(obj)) {
        obj.forEach(item => results.push(...collectMathStrings(item)));
    } else if (obj !== null && typeof obj === 'object') {
        Object.values(obj).forEach(val => results.push(...collectMathStrings(val)));
    }
    return results;
}

/**
 * Verifie l'encodage math dans un objet : cherche les expectedPatterns,
 * verifie l'absence de forbiddenPatterns, detecte les double-echappements.
 * @param {any} obj - L'objet a verifier
 * @param {string[]} expectedPatterns - Patterns attendus dans les chaines
 * @param {string[]} [forbiddenPatterns] - Patterns interdits
 * @returns {{ ok: boolean, issues: string[] }}
 */
function verifyMathInObject(obj, expectedPatterns, forbiddenPatterns) {
    const issues = [];
    const jsonStr = JSON.stringify(obj);
    const allStrings = extractTextValues(obj);

    // Verifier les patterns attendus
    for (const pattern of expectedPatterns) {
        const found = allStrings.some(s => s.includes(pattern));
        if (!found) {
            issues.push(`Pattern attendu absent : "${pattern}"`);
        }
    }

    // Verifier les patterns interdits
    if (forbiddenPatterns) {
        for (const pattern of forbiddenPatterns) {
            const found = allStrings.some(s => s.includes(pattern));
            if (found) {
                issues.push(`Pattern interdit present : "${pattern}"`);
            }
        }
    }

    // Detecter les double-echappements
    for (const str of allStrings) {
        const dblIssues = detectDoubleEscapedCommands(str);
        issues.push(...dblIssues);
    }

    return { ok: issues.length === 0, issues };
}

/**
 * Pipeline healLatexForMoodle reproduit depuis moodle-creator.js
 */
function healLatexForMoodle(data) {
    let healed = normalizeDoubleEscapedLatex(data);
    healed = repairBrokenLatexEscapes(healed);
    healed = convertLatexEnvironmentsDeep(healed);
    healed = convertLatexDelimitersDeep(healed);
    healed = autoWrapLatex(healed);
    healed = normalizeDoubleEscapedLatex(healed);
    return healed;
}

// --- 4.2 Types d'activites et leur mode math ---
const UNICODE_MATH_TYPES = new Set(['DragTheWords', 'MarkTheWords']);
// FindTheWords : taskDescription supporte MathJax (H5P.MathDisplay), mais wordList ne doit contenir ni LaTeX ni Unicode math
const WORDLIST_NO_MATH_TYPES = new Set(['FindTheWords']);
// Crossword : clue/taskDescription supportent MathJax (H5P.MathDisplay), mais answer = grille de lettres → ni math ni espaces
const ANSWER_NO_MATH_NO_SPACE_TYPES = new Set(['Crossword']);
// Chart : pas de MathDisplay, les champs text ne doivent contenir que du texte brut + Unicode, pas de LaTeX
const TEXT_NO_LATEX_TYPES = new Set(['Chart']);
// Devoir : les rubriques Moodle ne supportent pas MathJax, tout LaTeX doit être converti en Unicode
const DEVOIR_NO_LATEX_TYPES = new Set(['elea_devoir']);
const MOODLE_TYPES = new Set(['QCM', 'Appariement', 'Page', 'Millionnaire', 'elea_qcm', 'elea_appariement', 'elea_page', 'elea_millionnaire', 'elea_test', 'elea_glossaire', 'elea_devoir']);

// --- 4.3 Etape 4 : Volet A (synthetiques) + Volet B (exemples existants) ---

async function runStep4_MathEncoding() {
    console.group('Etape 4 : Encodage Math (pre-edition)');

    // ==========================================
    // VOLET A : Tests synthetiques
    // ==========================================
    console.group('Volet A : Tests synthetiques');

    for (const tc of MATH_TEST_CASES) {
        _ctx = { step: 4, stepName: 'Math pre-edit', file: `synth:${tc.moduleKey}`, module: tc.moduleKey, source: tc.source };

        try {
            // 4a. healJsonString + parse
            const healedStr = healJsonString(tc.rawJson);
            let parsed;
            try {
                parsed = JSON.parse(healedStr);
            } catch (e) {
                assert(false, `[4a.Parse] ${tc.description} : echec parse apres healJsonString - ${e.message}`,
                    { healedStr: healedStr.substring(0, 200) });
                continue;
            }
            assert(true, `[4a.Parse] ${tc.description} : parse OK`);

            // 4b. healJsonObject
            let healed = healJsonObject(parsed, tc.moduleKey);
            // On log mais on ne bloque pas si c'est un type unicode (les patterns changent apres processing)
            if (tc.mathMode === 'unicode') {
                // Pour unicode, verifier juste pas de double-echappement
                const allStr = extractTextValues(healed);
                const dblIssues = [];
                allStr.forEach(s => dblIssues.push(...detectDoubleEscapedCommands(s)));
                assert(dblIssues.length === 0, `[4b.HealObject] ${tc.description} : pas de double-echappement${dblIssues.length > 0 ? ' - ' + dblIssues.join('; ') : ''}`,
                    dblIssues.length > 0 ? { issues: dblIssues, mathStrings: collectMathStrings(healed) } : null);
            } else if (tc.mathMode === 'no-latex') {
                // no-latex (Chart, Devoir...) : la conversion LaTeX → Unicode se fait dans
                // healActivitySpecificFields ou healStructureForActivity, pas dans healJsonObject.
                // On verifie seulement l'absence de double-echappement a ce stade.
                const allStr = extractTextValues(healed);
                const dblIssues = [];
                allStr.forEach(s => dblIssues.push(...detectDoubleEscapedCommands(s)));
                assert(dblIssues.length === 0, `[4b.HealObject] ${tc.description} : pas de double-echappement${dblIssues.length > 0 ? ' - ' + dblIssues.join('; ') : ''}`,
                    dblIssues.length > 0 ? { issues: dblIssues, mathStrings: collectMathStrings(healed) } : null);
            } else if (tc.mathMode === 'wordlist') {
                // FindTheWords : taskDescription peut avoir du MathJax, mais wordList non
                const mathCheck = verifyMathInObject(healed, tc.expectedPatterns, tc.forbiddenPatterns);
                assert(mathCheck.ok, `[4b.HealObject] ${tc.description} : MathJax OK dans taskDescription${mathCheck.ok ? '' : ' - ' + mathCheck.issues.join('; ')}`,
                    !mathCheck.ok ? { issues: mathCheck.issues } : null);
            } else {
                const mathCheck = verifyMathInObject(healed, tc.expectedPatterns, tc.forbiddenPatterns);
                assert(mathCheck.ok, `[4b.HealObject] ${tc.description} : encodage math apres healJsonObject${mathCheck.ok ? '' : ' - ' + mathCheck.issues.join('; ')}`,
                    !mathCheck.ok ? { issues: mathCheck.issues, mathStrings: collectMathStrings(healed) } : null);
            }

            // 4c. healActivitySpecificFields
            healed = healActivitySpecificFields(healed, tc.moduleKey);
            // Pas de verification intermediaire sauf double-echappement
            const allStr4c = extractTextValues(healed);
            const dblIssues4c = [];
            allStr4c.forEach(s => dblIssues4c.push(...detectDoubleEscapedCommands(s)));
            assert(dblIssues4c.length === 0, `[4c.HealFields] ${tc.description} : pas de double-echappement apres healActivitySpecificFields${dblIssues4c.length > 0 ? ' - ' + dblIssues4c.join('; ') : ''}`,
                dblIssues4c.length > 0 ? { issues: dblIssues4c, mathStrings: collectMathStrings(healed) } : null);

            // 4d. healStructureForActivity
            healed = healStructureForActivity(healed, tc.moduleKey);

            // 4e. Processing (H5P ou Moodle)
            let finalContent = healed;
            if (tc.source === 'moodle') {
                // Pipeline Moodle
                finalContent = healLatexForMoodle(healed);
                assert(true, `[4e.MoodleLatex] ${tc.description} : pipeline healLatexForMoodle applique`);
            } else {
                // Processeur H5P
                try {
                    const processed = await processH5PContent(tc.moduleKey, JSON.parse(JSON.stringify(healed)));
                    if (processed && processed.content) {
                        finalContent = processed.content;
                    } else if (processed) {
                        finalContent = processed;
                    }
                    assert(true, `[4e.H5PProcess] ${tc.description} : processeur H5P execute`);
                } catch (e) {
                    assert(false, `[4e.H5PProcess] ${tc.description} : echec processeur - ${e.message}`);
                    continue;
                }
            }

            // 4f. Verification finale des patterns attendus
            const finalCheck = verifyMathInObject(finalContent, tc.expectedPatterns, tc.forbiddenPatterns);
            assert(finalCheck.ok, `[4f.Final] ${tc.description} : encodage math final correct${finalCheck.ok ? '' : ' - ' + finalCheck.issues.join('; ')}`,
                !finalCheck.ok ? { issues: finalCheck.issues, mathStrings: collectMathStrings(finalContent) } : null);

            // 4f2. Verification wordList pour FindTheWords : ni LaTeX ni Unicode math
            if (tc.wordListForbidden && finalContent.wordList) {
                const wl = finalContent.wordList;
                const wlIssues = [];
                for (const pattern of tc.wordListForbidden) {
                    if (wl.includes(pattern)) wlIssues.push(`"${pattern}" dans wordList`);
                }
                assert(wlIssues.length === 0, `[4f2.WordList] ${tc.description} : wordList sans LaTeX/Unicode math${wlIssues.length > 0 ? ' - ' + wlIssues.join('; ') : ''}`,
                    wlIssues.length > 0 ? { wordList: wl, issues: wlIssues } : null);
            }

            // 4f3. Verification answers pour Crossword : ni math ni espaces
            if (tc.answerForbidden && Array.isArray(finalContent.words)) {
                const ansIssues = [];
                for (const word of finalContent.words) {
                    const ans = word.answer || '';
                    if (tc.answerForbidden.noMath) {
                        if (/\\[a-zA-Z]/.test(ans)) ansIssues.push(`"${ans}" contient commande LaTeX`);
                        if (ans.includes('\\(') || ans.includes('\\)')) ansIssues.push(`"${ans}" contient delimiteurs \\(...\\)`);
                        if (/[\u221A\u03B1-\u03C9\u03A0-\u03A9\u2200-\u22FF\u2190-\u21FF]/.test(ans)) ansIssues.push(`"${ans}" contient Unicode math`);
                    }
                    if (tc.answerForbidden.noSpaces && ans.includes(' ')) {
                        ansIssues.push(`"${ans}" contient des espaces`);
                    }
                }
                assert(ansIssues.length === 0, `[4f3.Answer] ${tc.description} : answers propres${ansIssues.length > 0 ? ' - ' + ansIssues.join('; ') : ''}`,
                    ansIssues.length > 0 ? { words: finalContent.words.map(w => w.answer), issues: ansIssues } : null);
            }

            // 4f4. Verification champs text pour Chart : pas de LaTeX
            if (tc.textForbiddenLatex && finalContent.listOfTypes) {
                const txtIssues = [];
                for (const item of finalContent.listOfTypes) {
                    const txt = item.text || '';
                    if (/\\[a-zA-Z]/.test(txt)) txtIssues.push(`"${txt}" contient commande LaTeX`);
                    if (txt.includes('\\(') || txt.includes('\\)')) txtIssues.push(`"${txt}" contient delimiteurs \\(...\\)`);
                }
                assert(txtIssues.length === 0, `[4f4.ChartText] ${tc.description} : text sans LaTeX${txtIssues.length > 0 ? ' - ' + txtIssues.join('; ') : ''}`,
                    txtIssues.length > 0 ? { items: finalContent.listOfTypes.map(i => i.text), issues: txtIssues } : null);
            }

            // 4f5. Verification criteres Devoir : ni commandes LaTeX ni delimiteurs \(...\)
            if (tc.criteriaForbiddenLatex && Array.isArray(finalContent.criteria)) {
                const critIssues = [];
                for (const criterion of finalContent.criteria) {
                    const desc = criterion.description || '';
                    if (/\\[a-zA-Z]/.test(desc)) critIssues.push(`description "${desc.substring(0, 40)}" : commande LaTeX`);
                    if (desc.includes('\\(') || desc.includes('\\)')) critIssues.push(`description "${desc.substring(0, 40)}" : delimiteurs \\(...\\)`);
                    for (const level of (criterion.levels || [])) {
                        const def = level.definition || '';
                        if (/\\[a-zA-Z]/.test(def)) critIssues.push(`definition "${def.substring(0, 40)}" : commande LaTeX`);
                        if (def.includes('\\(') || def.includes('\\)')) critIssues.push(`definition "${def.substring(0, 40)}" : delimiteurs \\(...\\)`);
                    }
                }
                assert(critIssues.length === 0, `[4f5.DevoirLatex] ${tc.description} : criteres et niveaux sans LaTeX${critIssues.length > 0 ? ' - ' + critIssues.join('; ') : ''}`,
                    critIssues.length > 0 ? { issues: critIssues } : null);
            }

        } catch (e) {
            assert(false, `[4.Synth] ${tc.description} : exception inattendue - ${e.message}`);
        }
    }

    console.groupEnd();

    // ==========================================
    // VOLET B : Verification des exemples existants
    // ==========================================
    console.group('Volet B : Exemples existants');

    for (const tc of testCases) {
        const state = pipelineState.get(tc.file);
        if (!state || state.error || !state.healedObj) continue;

        _ctx = { step: 4, stepName: 'Math pre-edit', file: tc.file, module: tc.expectedModule, source: tc.source };

        // Detecter si le fichier contient des formules math
        const mathStringsHealed = collectMathStrings(state.healedObj);
        if (mathStringsHealed.length === 0) continue; // Pas de math, rien a verifier

        // 4g. Verification du JSON heale : pas de double-echappement
        const allHealedStr = extractTextValues(state.healedObj);
        const dblIssuesHealed = [];
        allHealedStr.forEach(s => dblIssuesHealed.push(...detectDoubleEscapedCommands(s)));
        assert(dblIssuesHealed.length === 0,
            `[4g.ExampleHealed] ${tc.file} : pas de double-echappement apres healing (${mathStringsHealed.length} formules)${dblIssuesHealed.length > 0 ? ' - ' + dblIssuesHealed.join('; ') : ''}`,
            dblIssuesHealed.length > 0 ? { issues: dblIssuesHealed, mathStrings: mathStringsHealed.slice(0, 5) } : null);

        // 4h. Verification du contenu traite (apres processing)
        const processedContent = state.processedContent || state.blobContent;
        if (processedContent) {
            if (UNICODE_MATH_TYPES.has(tc.expectedModule)) {
                // DragTheWords / MarkTheWords : pas de commandes LaTeX brutes dans textField
                const textField = processedContent.textField || '';
                if (textField) {
                    const rawLatexInTextField = [];
                    for (const cmd of LATEX_COMMANDS) {
                        const stripped = textField.replace(/\\\([\s\S]*?\\\)/g, '');
                        if (stripped.includes('\\' + cmd)) {
                            rawLatexInTextField.push('\\' + cmd);
                        }
                    }
                    assert(rawLatexInTextField.length === 0,
                        `[4h.ExampleUnicode] ${tc.file} : LaTeX converti en Unicode${rawLatexInTextField.length > 0 ? ' (restants: ' + rawLatexInTextField.join(', ') + ')' : ''}`,
                        rawLatexInTextField.length > 0 ? { rawCommands: rawLatexInTextField, textField: textField.substring(0, 200) } : null);
                }
            } else if (WORDLIST_NO_MATH_TYPES.has(tc.expectedModule)) {
                // FindTheWords : taskDescription OK avec MathJax, mais wordList sans LaTeX ni Unicode math
                const wl = processedContent.wordList || '';
                if (wl) {
                    const wlIssues = [];
                    if (/\\[a-zA-Z]/.test(wl)) wlIssues.push('commandes LaTeX dans wordList');
                    if (wl.includes('\\(') || wl.includes('\\)')) wlIssues.push('delimiteurs \\(...\\) dans wordList');
                    if (/[\u221A\u03B1-\u03C9\u03A0-\u03A9\u2200-\u22FF\u2190-\u21FF]/.test(wl)) wlIssues.push('symboles Unicode math dans wordList');
                    assert(wlIssues.length === 0,
                        `[4h.ExampleWordList] ${tc.file} : wordList sans LaTeX/Unicode math${wlIssues.length > 0 ? ' - ' + wlIssues.join('; ') : ''}`,
                        wlIssues.length > 0 ? { wordList: wl, issues: wlIssues } : null);
                }
            } else if (ANSWER_NO_MATH_NO_SPACE_TYPES.has(tc.expectedModule)) {
                // Crossword : answers sans math ni espaces
                const words = processedContent.words || [];
                if (words.length > 0) {
                    const ansIssues = [];
                    for (const word of words) {
                        const ans = word.answer || '';
                        if (/\\[a-zA-Z]/.test(ans)) ansIssues.push(`"${ans}" : commande LaTeX`);
                        if (ans.includes('\\(') || ans.includes('\\)')) ansIssues.push(`"${ans}" : delimiteurs \\(...\\)`);
                        if (/[\u221A\u03B1-\u03C9\u03A0-\u03A9\u2200-\u22FF\u2190-\u21FF]/.test(ans)) ansIssues.push(`"${ans}" : Unicode math`);
                        if (ans.includes(' ')) ansIssues.push(`"${ans}" : contient des espaces`);
                    }
                    assert(ansIssues.length === 0,
                        `[4h.ExampleAnswer] ${tc.file} : answers sans math/espaces${ansIssues.length > 0 ? ' - ' + ansIssues.join('; ') : ''}`,
                        ansIssues.length > 0 ? { answers: words.map(w => w.answer), issues: ansIssues } : null);
                }
            } else if (TEXT_NO_LATEX_TYPES.has(tc.expectedModule)) {
                // Chart : pas de LaTeX dans les champs text
                const items = processedContent.listOfTypes || [];
                if (items.length > 0) {
                    const txtIssues = [];
                    for (const item of items) {
                        const txt = item.text || '';
                        if (/\\[a-zA-Z]/.test(txt)) txtIssues.push(`"${txt}" : commande LaTeX`);
                        if (txt.includes('\\(') || txt.includes('\\)')) txtIssues.push(`"${txt}" : delimiteurs \\(...\\)`);
                    }
                    assert(txtIssues.length === 0,
                        `[4h.ExampleChartText] ${tc.file} : text sans LaTeX${txtIssues.length > 0 ? ' - ' + txtIssues.join('; ') : ''}`,
                        txtIssues.length > 0 ? { texts: items.map(i => i.text), issues: txtIssues } : null);
                }
            } else if (DEVOIR_NO_LATEX_TYPES.has(tc.expectedModule)) {
                // Devoir : criteria descriptions et level definitions sans LaTeX
                const criteria = processedContent.criteria || [];
                if (criteria.length > 0) {
                    const critIssues = [];
                    for (const criterion of criteria) {
                        const desc = criterion.description || '';
                        if (/\\[a-zA-Z]/.test(desc)) critIssues.push(`"${desc.substring(0, 40)}" : commande LaTeX`);
                        if (desc.includes('\\(') || desc.includes('\\)')) critIssues.push(`"${desc.substring(0, 40)}" : delimiteurs \\(...\\)`);
                        for (const level of (criterion.levels || [])) {
                            const def = level.definition || '';
                            if (/\\[a-zA-Z]/.test(def)) critIssues.push(`"${def.substring(0, 40)}" : commande LaTeX`);
                            if (def.includes('\\(') || def.includes('\\)')) critIssues.push(`"${def.substring(0, 40)}" : delimiteurs \\(...\\)`);
                        }
                    }
                    assert(critIssues.length === 0,
                        `[4h.DevoirLatex] ${tc.file} : criteres et niveaux sans LaTeX${critIssues.length > 0 ? ' - ' + critIssues.join('; ') : ''}`,
                        critIssues.length > 0 ? { criteria: criteria.map(c => c.description), issues: critIssues } : null);
                }
            } else if (!MOODLE_TYPES.has(tc.expectedModule)) {
                // H5P MathJax : verifier pas de double-echappement dans le contenu traite
                const allProcessedStr = extractTextValues(processedContent);
                const dblIssuesProcessed = [];
                allProcessedStr.forEach(s => dblIssuesProcessed.push(...detectDoubleEscapedCommands(s)));
                assert(dblIssuesProcessed.length === 0,
                    `[4h.ExampleMathJax] ${tc.file} : pas de double-echappement apres processing${dblIssuesProcessed.length > 0 ? ' - ' + dblIssuesProcessed.join('; ') : ''}`,
                    dblIssuesProcessed.length > 0 ? { issues: dblIssuesProcessed, mathStrings: collectMathStrings(processedContent).slice(0, 5) } : null);
            }
        }
    }

    console.groupEnd();
    console.groupEnd();
}

// =======================================================================
// ETAPE 8 : ENCODAGE MATH (POST RE-EXPORT)
// =======================================================================

async function runStep8_MathEncodingPostEdit() {
    console.group('Etape 8 : Encodage Math (post re-export)');

    // ==========================================
    // VOLET A : Tests synthetiques - pipeline complet (heal → process → edit → save → re-process)
    // ==========================================
    console.group('Volet A : Synthetiques round-trip complet');

    for (const tc of MATH_TEST_CASES) {
        _ctx = { step: 8, stepName: 'Math post-edit', file: `synth:${tc.moduleKey}`, module: tc.moduleKey, source: tc.source };

        try {
            // Pipeline complet : heal → process → normalize → edit → denormalize → re-heal → re-process
            const healedStr = healJsonString(tc.rawJson);
            let parsed;
            try { parsed = JSON.parse(healedStr); } catch { continue; }

            let healed = healJsonObject(parsed, tc.moduleKey);
            healed = healActivitySpecificFields(healed, tc.moduleKey);
            healed = healStructureForActivity(healed, tc.moduleKey);

            // Normalisation editeur
            const normalized = normalizeDataForEditor(JSON.parse(JSON.stringify(healed)), tc.moduleKey);
            if (!normalized) continue;

            // Simulation edition
            const editClone = JSON.parse(JSON.stringify(normalized));
            simulateEdit(editClone);

            // Denormalisation
            const saved = denormalizeDataForSave(JSON.parse(JSON.stringify(editClone)), tc.moduleKey);
            if (!saved) continue;

            // Re-heal structurel
            let reHealed = healStructureForActivity(JSON.parse(JSON.stringify(saved)), tc.moduleKey);

            // Re-processing final
            let finalContent = reHealed;
            if (tc.source === 'moodle') {
                finalContent = healLatexForMoodle(reHealed);
            } else {
                try {
                    const processed = await processH5PContent(tc.moduleKey, JSON.parse(JSON.stringify(reHealed)));
                    if (processed && processed.content) finalContent = processed.content;
                    else if (processed) finalContent = processed;
                } catch (e) {
                    assert(false, `[8a.RoundTrip] ${tc.description} : echec re-processing - ${e.message}`);
                    continue;
                }
            }

            // Verification finale : les patterns math doivent survivre au round-trip complet
            const finalCheck = verifyMathInObject(finalContent, tc.expectedPatterns, tc.forbiddenPatterns);
            assert(finalCheck.ok, `[8a.RoundTrip] ${tc.description} : math preservees apres round-trip complet${finalCheck.ok ? '' : ' - ' + finalCheck.issues.join('; ')}`,
                !finalCheck.ok ? { issues: finalCheck.issues, mathStrings: collectMathStrings(finalContent) } : null);

        } catch (e) {
            assert(false, `[8.Synth] ${tc.description} : exception - ${e.message}`);
        }
    }

    console.groupEnd();

    // ==========================================
    // VOLET B : Exemples existants apres re-export
    // ==========================================
    console.group('Volet B : Exemples existants post re-export');

    for (const tc of testCases) {
        const state = pipelineState.get(tc.file);
        if (!state || state.error || !state.reProcessedContent) continue;

        _ctx = { step: 8, stepName: 'Math post-edit', file: tc.file, module: tc.expectedModule, source: tc.source };

        const reContent = state.reProcessedContent;

        // Detecter si le contenu re-exporte contient des formules math
        const mathStringsReExport = collectMathStrings(reContent);
        if (mathStringsReExport.length === 0) continue;

        // 8b. Verification : pas de double-echappement apres le round-trip complet
        const allReStr = extractTextValues(reContent);
        const dblIssuesRe = [];
        allReStr.forEach(s => dblIssuesRe.push(...detectDoubleEscapedCommands(s)));
        assert(dblIssuesRe.length === 0,
            `[8b.ExamplePostEdit] ${tc.file} : pas de double-echappement apres round-trip (${mathStringsReExport.length} formules)${dblIssuesRe.length > 0 ? ' - ' + dblIssuesRe.join('; ') : ''}`,
            dblIssuesRe.length > 0 ? { issues: dblIssuesRe, mathStrings: mathStringsReExport.slice(0, 5) } : null);

        // 8c. Pour les types Unicode : verifier que le LaTeX a ete converti apres re-export
        if (UNICODE_MATH_TYPES.has(tc.expectedModule)) {
            const textField = reContent.textField || reContent.taskDescription || '';
            if (textField) {
                const rawLatexPost = [];
                for (const cmd of LATEX_COMMANDS) {
                    const stripped = textField.replace(/\\\([\s\S]*?\\\)/g, '');
                    if (stripped.includes('\\' + cmd)) rawLatexPost.push('\\' + cmd);
                }
                assert(rawLatexPost.length === 0,
                    `[8c.ExampleUnicodePost] ${tc.file} : LaTeX converti en Unicode apres re-export${rawLatexPost.length > 0 ? ' (restants: ' + rawLatexPost.join(', ') + ')' : ''}`,
                    rawLatexPost.length > 0 ? { rawCommands: rawLatexPost } : null);
            }
        }

        // 8d. Comparaison pre/post : les formules math ne doivent pas avoir ete degradees
        const preContent = state.processedContent || state.blobContent;
        if (preContent) {
            const mathPre = collectMathStrings(preContent);
            const mathPost = collectMathStrings(reContent);
            // On verifie que le nombre de formules n'a pas diminue significativement
            if (mathPre.length > 0) {
                const ratioPreserved = mathPost.length / mathPre.length;
                assert(ratioPreserved >= 0.8,
                    `[8d.MathPreserved] ${tc.file} : formules math preservees apres edit (${mathPost.length}/${mathPre.length} = ${(ratioPreserved * 100).toFixed(0)}%)`,
                    ratioPreserved < 0.8 ? { pre: mathPre.slice(0, 5), post: mathPost.slice(0, 5) } : null);
            }
        }
    }

    console.groupEnd();
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

/** Liste des cas de test exportee pour l'interface */
export { testCases };

/** Noms des etapes du pipeline */
export const STEP_NAMES = [
    '', // index 0 inutilise
    'Chargement',
    'Healer',
    'Generation',
    'Math pre-edit',
    'Edition',
    'Sauvegarde',
    'Re-export',
    'Math post-edit'
];

/** Table de reference : encodage math attendu par type d'activite */
export const MATH_REFERENCE = [
    // --- H5P MathJax : formules preservees \(...\) ---
    { moduleKey: 'MultipleChoice', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans question et reponses', example: 'Calculer \\(\\sqrt{9}\\)', rendered: 'Calculer √9 (rendu MathJax)' },
    { moduleKey: 'TrueFalse', mathMode: 'mathjax', source: 'h5p', description: 'Formule dans la question', example: '\\(x^2 + 1 = 0\\) a des solutions reelles', rendered: 'x²+1=0 a des solutions reelles' },
    { moduleKey: 'FillInTheBlanks', mathMode: 'mathjax', source: 'h5p', description: 'Formule inline dans les questions', example: 'f(x)=\\(\\sqrt{x}\\) est definie pour *x>=0*', rendered: 'f(x)=√x est definie pour [x>=0]' },
    { moduleKey: 'DragAndDrop', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les elements et zones', example: '<p>\\(\\frac{1}{x}\\)</p>', rendered: '1/x (rendu MathJax dans element)' },
    { moduleKey: 'Essay', mathMode: 'mathjax', source: 'h5p', description: 'Formule dans la consigne', example: 'Expliquer \\(\\sqrt{x}\\) et \\(x^{1/2}\\)', rendered: 'Expliquer √x et x^(1/2)' },
    { moduleKey: 'Flashcards', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans text et answer', example: '\\(\\sqrt{16}\\)', rendered: '√16' },
    { moduleKey: 'DialogCards', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans text et answer', example: '\\(\\pi \\approx 3.14\\)', rendered: 'π ≈ 3.14' },
    { moduleKey: 'SingleChoiceSet', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans question et answers', example: '\\(\\sqrt{25}\\) = ?', rendered: '√25 = ?' },
    { moduleKey: 'SortParagraphs', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les paragraphes', example: '\\(x^2\\) puis \\(x^3\\)', rendered: 'x² puis x³' },
    { moduleKey: 'Summary', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les enonces', example: '\\(\\sum_{i=1}^{n} i\\)', rendered: 'Σᵢ₌₁ⁿ i' },
    { moduleKey: 'Crossword', mathMode: 'mathjax+answer', source: 'h5p', description: 'clue/taskDescription : MathJax OK (H5P.MathDisplay). answer : NI math NI espaces (grille). Healer : lettre grecque LaTeX/Unicode → mot (\\(\\pi\\)→PI), espaces supprimes, formules complexes = entree supprimee', example: 'clue: "Notee \\(\\sqrt{x}\\)" OK, answer: "RACINE" (pas "Racine carree"), "\\(\\pi\\)"→"PI"', rendered: 'clue rendue par MathJax, answer = lettres sans espace', forbidden: 'answer: \\sqrt, \\(, π, √, espaces' },
    { moduleKey: 'Glossary', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les definitions', example: 'Racine carree : \\(\\sqrt{x}\\)', rendered: 'Racine carree : √x' },
    { moduleKey: 'Timeline', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les textes des evenements', example: 'Decouverte de \\(E=mc^2\\)', rendered: 'Decouverte de E=mc²' },
    { moduleKey: 'ComplexFillTheBlanks', mathMode: 'mathjax', source: 'h5p', description: 'Formules inline dans les trous', example: '\\(\\frac{a}{b}\\) = *a/b*', rendered: 'a/b = [a/b]' },
    { moduleKey: 'QuizSet', mathMode: 'mathjax', source: 'h5p', description: 'Formules dans les sous-questions (sauf DragText/MarkTheWords). DragQuestion : formules MathJax preservees dans elements et zones', example: 'Calculer \\(\\int_0^1 x\\,dx\\)', rendered: '∫₀¹ x dx' },
    // --- H5P Unicode : LaTeX converti en caracteres Unicode ---
    { moduleKey: 'DragTheWords', mathMode: 'unicode', source: 'h5p', description: 'LaTeX converti en Unicode par latexToUnicode()', example: 'La racine de 9 est *3*. Formule : \\(\\sqrt{x}\\)', rendered: 'La racine de 9 est [3]. Formule : \\u221A(x)', forbidden: '\\sqrt, \\frac (brut)' },
    { moduleKey: 'MarkTheWords', mathMode: 'unicode', source: 'h5p', description: 'LaTeX converti en Unicode par latexToUnicode()', example: 'f(x)=\\(\\sqrt{x}\\) est *croissante*', rendered: 'f(x)=\\u221A(x) est [croissante]', forbidden: '\\sqrt, \\frac (brut)' },
    { moduleKey: 'FindTheWords', mathMode: 'mathjax+wordlist', source: 'h5p', description: 'taskDescription : MathJax OK (H5P.MathDisplay). wordList : NI LaTeX NI Unicode math (grille de lettres)', example: 'taskDescription: "\\(\\sqrt{x}\\)" OK, wordList: "RACINE,CARRE"', rendered: 'taskDescription rendue par MathJax, wordList = mots simples uniquement', forbidden: 'wordList: \\sqrt, \\(, π, √ (tout math)' },
    // --- H5P sans math ---
    { moduleKey: 'Chart', mathMode: 'no-latex', source: 'h5p', description: 'Pas de MathDisplay. Healer convertit LaTeX→Unicode via latexToUnicode(). Champs text : texte brut + Unicode uniquement', example: 'text: "\\(\\sqrt{x}\\)" → "√(x)", "Constante \\(\\pi\\)" → "Constante π"', rendered: 'Texte brut + symboles Unicode', forbidden: '\\sqrt, \\frac, \\(, \\) (tout LaTeX)' },
    // --- Cas pathologiques corriges par le healer ---
    { moduleKey: '(tous)', mathMode: 'mathjax', source: 'h5p', description: 'Healer : \\begin{equation}→\\[...\\], \\begin{align}→\\[...\\], \\begin{math}→\\(...\\). Environnements LaTeX generes par ChatGPT/GPT-4', example: '\\begin{equation}\\sqrt{x}\\end{equation} → \\[\\sqrt{x}\\]', rendered: 'Formule display ou inline selon environnement' },
    { moduleKey: '(tous)', mathMode: 'mathjax', source: 'h5p', description: 'Healer : \\displaystyle supprime dans les formules inline/display (inutile pour MathJax H5P)', example: '\\(\\displaystyle\\frac{1}{2}\\) → \\(\\frac{1}{2}\\)', rendered: 'Fraction sans displaystyle' },
    { moduleKey: '(tous)', mathMode: 'mathjax', source: 'h5p', description: 'Healer : entites HTML corrigees dans blocs LaTeX (&lt;→<, &gt;→>, &amp;→&, &le;→\\leq, &ge;→\\geq)', example: '\\(x &gt; 0\\) → \\(x > 0\\)', rendered: 'Comparaison correcte' },
    { moduleKey: '(tous)', mathMode: 'mathjax', source: 'h5p', description: 'Healer : delimiteurs mixtes repares (\\( ... $ → \\( ... \\), $ ... \\) → \\( ... \\)). Blocs vides \\(\\) supprimes', example: '\\(\\sqrt{16}$ → \\(\\sqrt{16}\\)', rendered: 'Formule avec delimiteurs corrects' },
    // --- Moodle : formules preservees pour MathJax Moodle ---
    { moduleKey: 'QCM', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans text et answers (MathJax Moodle)', example: 'Calculer \\(\\sqrt{16}\\)', rendered: 'Calculer √16 (rendu MathJax Moodle)' },
    { moduleKey: 'Appariement', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans questions et reponses', example: '\\(\\frac{1}{2}\\)', rendered: '1/2' },
    { moduleKey: 'Page', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans le contenu HTML', example: '<p>\\(\\sqrt{x}\\)</p>', rendered: '√x' },
    { moduleKey: 'Millionnaire', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans questions et reponses', example: '\\(2^{10}\\) = ?', rendered: '2¹⁰ = ?' },
    { moduleKey: 'Test', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans questions XML/GIFT', example: '\\(\\pi r^2\\)', rendered: 'πr²' },
    { moduleKey: 'Glossaire', mathMode: 'mathjax', source: 'moodle', description: 'Formules dans definitions', example: '\\(\\nabla f\\)', rendered: '∇f' },
];

export async function runAllTests() {
    console.log('=== Tests ultra-complets du pipeline Caramel (8 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    pipelineState.clear();
    generatedFiles.clear();

    await runStep1_LoadRawJson();
    await runStep2_HealerPipeline();
    await runStep3_ContentGeneration();
    await runStep4_MathEncoding();
    await runStep5_EditorNormalize();
    await runStep6_SaveDenormalize();
    await runStep7_RegenerateVerify();
    await runStep8_MathEncodingPostEdit();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);
    console.log(`[MasterZIP] ${generatedFiles.size} fichiers collectes pour le ZIP master`);

    return { passCount, failCount, skipCount, results, testCases, STEP_NAMES, MATH_REFERENCE, generatedFilesCount: generatedFiles.size };
}
