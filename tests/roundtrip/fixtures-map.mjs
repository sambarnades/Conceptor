/**
 * fixtures-map.mjs — Mapping fixture (assets/data/examples/*.json) → moduleKey Caramel.
 *
 * Il n'existe PAS de manifeste explicite fixture→module dans le code (les exemples
 * sont chargés par convention de nommage côté éditeur). On reconstruit donc le mapping
 * par préfixe snake_case → moduleKey, en s'appuyant sur les clés de definitions.js.
 *
 * Vérifié : les 112 fichiers de assets/data/examples/ correspondent aux préfixes
 * ci-dessous. Les préfixes Moodle (page, livre, devoir, millionnaire, appariement,
 * qcm, test, glossaire_xml, quiz_mixte→QuizSet, quiz_qcm→QuizSetQCM, quiz_vraifaux→QuizSetVF)
 * sont inclus pour la phase Moodle, mais `listH5pFixtures()` ne renvoie QUE les H5P.
 *
 * @module fixtures-map
 */

import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const EXAMPLES_DIR = resolve(__dirname, '../../assets/data/examples');

/**
 * Préfixe snake_case du nom de fixture → moduleKey.
 * L'ordre n'importe pas : on matche par préfixe le plus long d'abord (cf. resolveModuleKey).
 * `kind` : 'h5p' ou 'moodle'.
 */
export const PREFIX_TO_MODULE = [
    // --- H5P ---
    { prefix: 'timeline', moduleKey: 'Timeline', kind: 'h5p' },
    { prefix: 'flashcards', moduleKey: 'Flashcards', kind: 'h5p' },
    { prefix: 'accordion', moduleKey: 'Glossary', kind: 'h5p' },        // H5P.Accordion = Glossary (Caramel)
    { prefix: 'crosswords', moduleKey: 'Crossword', kind: 'h5p' },
    { prefix: 'essay', moduleKey: 'Essay', kind: 'h5p' },
    { prefix: 'summary', moduleKey: 'Summary', kind: 'h5p' },
    { prefix: 'drag_the_words', moduleKey: 'DragTheWords', kind: 'h5p' },
    { prefix: 'drag_and_drop', moduleKey: 'DragAndDrop', kind: 'h5p' },
    { prefix: 'fill_in_the_blanks', moduleKey: 'FillInTheBlanks', kind: 'h5p' },
    { prefix: 'mark_the_words', moduleKey: 'MarkTheWords', kind: 'h5p' },
    { prefix: 'true_false', moduleKey: 'TrueFalse', kind: 'h5p' },
    { prefix: 'multiple_choice', moduleKey: 'MultipleChoice', kind: 'h5p' },
    { prefix: 'find_the_words', moduleKey: 'FindTheWords', kind: 'h5p' },
    { prefix: 'sort_the_paragraphs', moduleKey: 'SortParagraphs', kind: 'h5p' },
    { prefix: 'single_choice_set', moduleKey: 'SingleChoiceSet', kind: 'h5p' },
    { prefix: 'dialog_cards', moduleKey: 'DialogCards', kind: 'h5p' },
    { prefix: 'charts', moduleKey: 'Chart', kind: 'h5p' },
    { prefix: 'course_presentation', moduleKey: 'CoursePresentation', kind: 'h5p' },
    { prefix: 'interactive_book', moduleKey: 'InteractiveBook', kind: 'h5p' },
    { prefix: 'interactive_video', moduleKey: 'InteractiveVideo', kind: 'h5p' },
    // QuizSet familles — préfixes les plus spécifiques d'abord
    { prefix: 'quiz_qcm', moduleKey: 'QuizSetQCM', kind: 'h5p' },
    { prefix: 'quiz_vraifaux', moduleKey: 'QuizSetVF', kind: 'h5p' },
    { prefix: 'quiz_mixte', moduleKey: 'QuizSet', kind: 'h5p' },

    // --- Moodle / Éléa (phase ultérieure) ---
    { prefix: 'glossaire_xml', moduleKey: 'glossaireXml', kind: 'moodle' },
    { prefix: 'millionnaire', moduleKey: 'Millionnaire', kind: 'moodle' },
    { prefix: 'appariement', moduleKey: 'Appariement', kind: 'moodle' },
    { prefix: 'qcm', moduleKey: 'QCM', kind: 'moodle' },
    { prefix: 'devoir', moduleKey: 'Devoir', kind: 'moodle' },
    { prefix: 'page', moduleKey: 'Page', kind: 'moodle' },
    { prefix: 'livre', moduleKey: 'Livre', kind: 'moodle' },
    { prefix: 'test', moduleKey: 'test_elea', kind: 'moodle' }
];

// Trié par longueur de préfixe décroissante pour matcher le plus spécifique d'abord
// (ex: 'quiz_qcm' avant un hypothétique 'quiz').
const SORTED = [...PREFIX_TO_MODULE].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Résout le moduleKey d'un nom de fichier de fixture.
 * @param {string} filename - ex: 'drag_and_drop_1.json'
 * @returns {{moduleKey: string, kind: string}|null}
 */
export function resolveModuleKey(filename) {
    const base = filename.replace(/\.json$/i, '');
    for (const entry of SORTED) {
        // match exact OU préfixe suivi de _<chiffre/mot> (ex: drag_and_drop_1, quiz_qcm_formules_test)
        if (base === entry.prefix || base.startsWith(entry.prefix + '_')) {
            return { moduleKey: entry.moduleKey, kind: entry.kind };
        }
    }
    return null;
}

/**
 * Liste toutes les fixtures d'un kind donné, avec leur moduleKey résolu.
 * @param {'h5p'|'moodle'|'all'} kind
 * @returns {Promise<Array<{file: string, path: string, moduleKey: string, kind: string}>>}
 */
export async function listFixtures(kind = 'all') {
    const all = (await readdir(EXAMPLES_DIR)).filter(f => f.endsWith('.json')).sort();
    const out = [];
    const unmatched = [];
    for (const file of all) {
        const r = resolveModuleKey(file);
        if (!r) { unmatched.push(file); continue; }
        if (kind !== 'all' && r.kind !== kind) continue;
        out.push({ file, path: resolve(EXAMPLES_DIR, file), moduleKey: r.moduleKey, kind: r.kind });
    }
    if (unmatched.length) {
        console.warn('[fixtures-map] fixtures non mappées (ignorées) :', unmatched.join(', '));
    }
    return out;
}

/** Liste uniquement les fixtures H5P. */
export function listH5pFixtures() {
    return listFixtures('h5p');
}

/** Liste uniquement les fixtures Moodle. */
export function listMoodleFixtures() {
    return listFixtures('moodle');
}
