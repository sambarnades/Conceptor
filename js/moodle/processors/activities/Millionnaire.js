/**
 * @file Processeur pour l'activité Millionnaire V2 de Moodle.
 * Génère tous les fichiers nécessaires à l'archive MBZ.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildSingleActivityBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml as xmlEscape, rewriteTag } from '../../mbz-utils.js';

/**
 * Métadonnées du module Millionnaire.
 */
export const metadata = {
    moduleName: 'millionnairev2',
    moduleVersion: '2023112300',
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
 * Intro par défaut pour le Millionnaire.
 */
const DEFAULT_INTRO = '<p dir="ltr" style="text-align: left;">Réponds aux questions qui te seront posées !</p>';

/**
 * Template XML pour l'activité millionnairev2.
 */
const MILLIONNAIRE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="millionnairev2" contextid="{{ACTIVITY_CONTEXTID}}">
  <millionnairev2 id="{{ACTIVITY_ID}}">
    <course>{{COURSE_ID}}</course>
    <name>{{ACTIVITY_TITLE}}</name>
    <intro>{{ACTIVITY_INTRO_HTML}}</intro>
    <introformat>1</introformat>
    <questions>{{QUESTIONS_JSON}}</questions>
    <grade>100</grade>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <completionminattempts>1</completionminattempts>
  </millionnairev2>
</activity>`;

/**
 * Construit tous les fichiers pour une activité Millionnaire.
 * @param {Object} data - Les données avec les placeholders remplis
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
function escapeXml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/millionnairev2_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    // Ajouter des IDs supplémentaires pour les enrols et l'intro par défaut
    const extendedData = {
        ...data,
        ACTIVITY_INTRO_HTML: escapeXml(data.ACTIVITY_INTRO_HTML || DEFAULT_INTRO),
        ENROL_MANUAL_ID: data.ENROL_MANUAL_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_GUEST_ID: data.ENROL_GUEST_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_SELF_ID: data.ENROL_SELF_ID || (10000 + Math.floor(Math.random() * 90000))
    };

    // ========================================
    // Fichiers racine (exact comme modele_base original)
    // ========================================
    files['moodle_backup.xml'] = buildSingleActivityBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, extendedData);
    //files['grade_history.xml'] = TEMPLATES.GRADE_HISTORY_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;
    // Note: PAS de badges.xml dans modele_base original

    // ========================================
    // Fichiers course/ (exact comme modele_base original)
    // ========================================
    files['course/course.xml'] = replacePlaceholders(
        TEMPLATES.getSingleActivityCourseXml(metadata.moduleName),
        extendedData
    );
    files['course/enrolments.xml'] = replacePlaceholders(TEMPLATES.COURSE_ENROLMENTS_XML, extendedData);
    files['course/inforef.xml'] = TEMPLATES.COURSE_INFOREF_XML;
    files['course/roles.xml'] = TEMPLATES.ACTIVITY_ROLES_XML;
    files['course/completiondefaults.xml'] = TEMPLATES.COURSE_COMPLETIONDEFAULTS_XML;
    // Note: PAS de contentbank.xml, calendar.xml, filters.xml dans modele_base original

    // ========================================
    // Fichiers sections/section_XXX/ (format singleactivity simplifié)
    // ========================================
    files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SINGLEACTIVITY_SECTION_XML, extendedData);
    files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;

    // ========================================
    // Fichiers de l'activité (exact comme modele_base original)
    // ========================================
    files[`${activityDir}/millionnairev2.xml`] = replacePlaceholders(MILLIONNAIRE_XML, extendedData);
    files[`${activityDir}/module.xml`] = replacePlaceholders(
        TEMPLATES.getModuleXml(metadata.moduleName, metadata.moduleVersion),
        extendedData
    );
    files[`${activityDir}/grades.xml`] = replacePlaceholders(
        TEMPLATES.getActivityGradesXml(metadata.moduleName),
        extendedData
    );
    files[`${activityDir}/inforef.xml`] = replacePlaceholders(TEMPLATES.ACTIVITY_INFOREF_XML, extendedData);
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    //files[`${activityDir}/grade_history.xml`] = TEMPLATES.ACTIVITY_GRADE_HISTORY_XML;
    // Note: PAS de calendar.xml, filters.xml dans modele_base original

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Lit l'archive d'un Millionnaire (millionnairev2) déjà extraite par
 * `mbz-utils.extractMbz` et reconstruit le JSON éditeur.
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir - ex: 'activities/millionnairev2_25'
 * @returns {{ title: string, questions: Array, _context: { moduleId, activityId, activityContextId } }}
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/millionnairev2.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`millionnaire_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > millionnairev2')) {
        throw new Error('millionnaire_invalid_xml_no_root');
    }

    const title        = tagText(doc, 'millionnairev2 > name');
    const questionsRaw = tagText(doc, 'millionnairev2 > questions');

    let questions = [];
    if (questionsRaw && questionsRaw.trim()) {
        try { questions = JSON.parse(questionsRaw); }
        catch (e) { throw new Error(`millionnaire_questions_json_invalid:${e.message}`); }
    }

    return {
        title,
        questions,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Patch in-place les balises éditables (`name`, `questions`).
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/millionnairev2.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`millionnaire_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name',      xmlEscape(data.title || ''));
    xml = rewriteTag(xml, 'questions', xmlEscape(JSON.stringify(data.questions || [])));

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
