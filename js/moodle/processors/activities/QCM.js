/**
 * @file Processeur pour l'activité QCM (SimpleQuiz) de Moodle.
 * Génère tous les fichiers nécessaires à l'archive MBZ.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildMoodleBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml, rewriteTag } from '../../mbz-utils.js';

/**
 * Métadonnées du module QCM.
 */
export const metadata = {
    moduleName: 'simplequiz',
    moduleVersion: '2023112400',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'ACTIVITY_INTRO_HTML',
        'QUESTIONS_JSON',
        'COURSE_FULLNAME',
        'COURSE_SHORTNAME',
        'COURSE_ID',
        'MODULE_ID',
        'SECTION_ID',
        'ACTIVITY_ID',
        'COURSE_CONTEXTID',
        'ACTIVITY_CONTEXTID',
        'TIMESTAMP',
        'BACKUP_DATE',
        'CATEGORY_ID',
        'COURSE_ITEM_ID',
        'GRADE_ITEM_ID'
    ]
};

/**
 * Template XML pour l'activité simplequiz.
 */
const SIMPLEQUIZ_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="simplequiz" contextid="{{ACTIVITY_CONTEXTID}}">
  <simplequiz id="{{ACTIVITY_ID}}">
    <course>{{COURSE_ID}}</course>
    <name>{{ACTIVITY_TITLE}}</name>
    <intro>{{ACTIVITY_INTRO_HTML}}</intro>
    <introformat>1</introformat>
    <questions>{{QUESTIONS_JSON}}</questions>
    <grade>100</grade>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <completionminattempts>1</completionminattempts>
  </simplequiz>
</activity>`;

/**
 * Construit tous les fichiers pour une activité QCM.
 * @param {Object} data - Les données avec les placeholders remplis
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/simplequiz_${data.MODULE_ID}`;

    // ========================================
    // Fichiers racine
    // ========================================
    files['moodle_backup.xml'] = buildMoodleBackup(data, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, data);
    //files['grade_history.xml'] = TEMPLATES.GRADE_HISTORY_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;
    //files['badges.xml'] = TEMPLATES.BADGES_XML;

    // ========================================
    // Fichiers de l'activité
    // ========================================
    files[`${activityDir}/simplequiz.xml`] = replacePlaceholders(SIMPLEQUIZ_XML, data);
    files[`${activityDir}/module.xml`] = replacePlaceholders(
        TEMPLATES.getModuleXml(metadata.moduleName, metadata.moduleVersion),
        data
    );
    files[`${activityDir}/grades.xml`] = replacePlaceholders(
        TEMPLATES.getActivityGradesXml(metadata.moduleName),
        data
    );
    files[`${activityDir}/inforef.xml`] = replacePlaceholders(TEMPLATES.ACTIVITY_INFOREF_XML, data);
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    //files[`${activityDir}/grade_history.xml`] = TEMPLATES.ACTIVITY_GRADE_HISTORY_XML;
    //files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Lit l'archive d'un QCM (simplequiz) déjà extraite par `mbz-utils.extractMbz`
 * et reconstruit le JSON tel que l'éditeur l'attend.
 *
 * Pendant inverse de `buildFiles`. Ne touche pas aux fichiers — uniquement
 * de la lecture XML.
 *
 * @param {Object<string, Uint8Array>} files - Map issue de extractMbz
 * @param {string} activityDir - ex: 'activities/simplequiz_25'
 * @returns {{ title: string, questions: Array, _context: { moduleId, activityId, activityContextId } }}
 * @throws {Error} qcm_missing_xml | qcm_invalid_xml | qcm_questions_json_invalid
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/simplequiz.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`qcm_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > simplequiz')) {
        throw new Error('qcm_invalid_xml_no_simplequiz');
    }

    const title         = tagText(doc, 'simplequiz > name');
    const questionsRaw  = tagText(doc, 'simplequiz > questions');

    let questions = [];
    if (questionsRaw && questionsRaw.trim()) {
        try {
            questions = JSON.parse(questionsRaw);
        } catch (e) {
            throw new Error(`qcm_questions_json_invalid:${e.message}`);
        }
    }

    return {
        title,
        questions,
        // Contexte technique nécessaire pour reconstruire un .mbz cohérent
        // sans repasser par buildFiles (cf. serializeFiles).
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Patch in-place les fichiers extraits avec les données éditées.
 * Approche minimale : on rewrite uniquement les balises éditables (`name`,
 * `questions`) dans le XML existant — ne casse pas les autres champs (timecreated,
 * grade, completionminattempts...) et ne nécessite pas de regénérer toute la
 * famille de fichiers.
 *
 * @param {{ title: string, questions: Array }} data
 * @param {Object<string, Uint8Array>} files - Map mutable, sera modifiée
 * @param {string} activityDir
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/simplequiz.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`qcm_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name',      escapeXml(data.title || ''));
    xml = rewriteTag(xml, 'questions', escapeXml(JSON.stringify(data.questions || [])));

    files[xmlPath] = window.fflate.strToU8(xml);
}

/**
 * Export par défaut du processeur.
 */
export default {
    metadata,
    buildFiles,
    parseFiles,
    serializeFiles
};
