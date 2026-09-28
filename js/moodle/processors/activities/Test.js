/**
 * @file Processeur pour l'activité Test (Quiz natif Moodle).
 * Génère tous les fichiers nécessaires à l'archive MBZ.
 * Note: Ce processeur nécessite des données complexes incluant les questions.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildMoodleBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml, rewriteTag, stripParagraphWrap, wrapP } from '../../mbz-utils.js';
import { generateMoodleXml, canonicalizeTestModel } from '../../moodle-formats.js';
import { parseFiles, serializeFiles, parseStandaloneXml, serializeStandaloneXml } from '../../test-io.js';
export { parseFiles, serializeFiles, parseStandaloneXml, serializeStandaloneXml };

/**
 * Métadonnées du module Test/Quiz.
 */
export const metadata = {
    moduleName: 'quiz',
    moduleVersion: '2023112300',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
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
        'GRADE_ITEM_ID',
        'QUESTIONS_XML_CONTENT',
        'QUESTION_INSTANCES_XML'
    ]
};

/**
 * Template XML pour l'activité quiz.
 */
const QUIZ_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="quiz" contextid="{{ACTIVITY_CONTEXTID}}">
  <quiz id="{{ACTIVITY_ID}}">
    <name>{{ACTIVITY_TITLE}}</name>
    <intro></intro>
    <introformat>1</introformat>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <timelimit>0</timelimit>
    <overduehandling>autosubmit</overduehandling>
    <graceperiod>0</graceperiod>
    <preferredbehaviour>deferredfeedback</preferredbehaviour>
    <canredoquestions>0</canredoquestions>
    <attempts_number>0</attempts_number>
    <attemptonlast>0</attemptonlast>
    <grademethod>1</grademethod>
    <decimalpoints>2</decimalpoints>
    <questiondecimalpoints>-1</questiondecimalpoints>
    <reviewattempt>69888</reviewattempt>
    <reviewcorrectness>4352</reviewcorrectness>
    <reviewmaxmarks>69888</reviewmaxmarks>
    <reviewmarks>4352</reviewmarks>
    <reviewspecificfeedback>4352</reviewspecificfeedback>
    <reviewgeneralfeedback>4352</reviewgeneralfeedback>
    <reviewrightanswer>4352</reviewrightanswer>
    <reviewoverallfeedback>4352</reviewoverallfeedback>
    <questionsperpage>1</questionsperpage>
    <navmethod>free</navmethod>
    <shuffleanswers>1</shuffleanswers>
    <sumgrades>{{SUM_GRADES}}</sumgrades>
    <grade>{{GRADE}}</grade>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <password></password>
    <subnet></subnet>
    <browsersecurity>-</browsersecurity>
    <delay1>0</delay1>
    <delay2>0</delay2>
    <showuserpicture>0</showuserpicture>
    <showblocks>0</showblocks>
    <completionattemptsexhausted>0</completionattemptsexhausted>
    <completionminattempts>0</completionminattempts>
    <allowofflineattempts>0</allowofflineattempts>
    <subplugin_quizaccess_seb_quiz>
    </subplugin_quizaccess_seb_quiz>
    <quiz_grade_items>
    </quiz_grade_items>
    <question_instances>
{{QUESTION_INSTANCES_XML}}
    </question_instances>
    <sections>
      <section id="{{SECTION_ID}}">
        <firstslot>1</firstslot>
        <heading></heading>
        <shufflequestions>0</shufflequestions>
      </section>
    </sections>
    <feedbacks>
      <feedback id="{{FEEDBACK_ID}}">
        <feedbacktext></feedbacktext>
        <feedbacktextformat>1</feedbacktextformat>
        <mingrade>0.00000</mingrade>
        <maxgrade>{{SUM_GRADES}}</maxgrade>
      </feedback>
    </feedbacks>
    <overrides>
    </overrides>
    <grades>
    </grades>
    <attempts>
    </attempts>
  </quiz>
</activity>`;

/**
 * Construit tous les fichiers pour une activité Test.
 * @param {Object} data - Les données avec les placeholders remplis
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/quiz_${data.MODULE_ID}`;

    // Valeurs par défaut pour les grades
    const extendedData = {
        ...data,
        SUM_GRADES: data.SUM_GRADES || '10.00000',
        GRADE: data.GRADE || '10.00000',
        FEEDBACK_ID: data.FEEDBACK_ID || (1000 + Math.floor(Math.random() * 9000)),
        QUESTION_INSTANCES_XML: data.QUESTION_INSTANCES_XML || ''
    };

    // ========================================
    // Fichiers racine
    // ========================================
    files['moodle_backup.xml'] = buildMoodleBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, extendedData);
    files['grade_history.xml'] = TEMPLATES.GRADE_HISTORY_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;
    files['badges.xml'] = TEMPLATES.BADGES_XML;

    // Questions XML - doit être fourni par le caller ou généré dynamiquement
    files['questions.xml'] = data.QUESTIONS_XML_CONTENT || TEMPLATES.QUESTIONS_XML;

    // ========================================
    // Fichiers de l'activité
    // ========================================
    files[`${activityDir}/quiz.xml`] = replacePlaceholders(QUIZ_XML, extendedData);
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
    files[`${activityDir}/grade_history.xml`] = TEMPLATES.ACTIVITY_GRADE_HISTORY_XML;
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Export par défaut du processeur.
 */
export default {
    metadata,
    buildFiles,
    parseFiles,
    serializeFiles,
    parseStandaloneXml,
    serializeStandaloneXml
};
