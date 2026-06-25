/**
 * @file Processeur pour l'activité Devoir (assign) de Moodle.
 * Génère tous les fichiers nécessaires à l'archive MBZ, y compris
 * la grille d'évaluation critériée (rubric) dans grading.xml.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildMoodleBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml as xmlEscape, rewriteTag } from '../../mbz-utils.js';
import { escapeXml as escapeXmlText } from '../../moodle-formats.js';

/**
 * Métadonnées du module Devoir.
 */
export const metadata = {
    moduleName: 'assign',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'ACTIVITY_INTRO_HTML',
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
 * Template XML pour l'activité assign.
 */
const ASSIGN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="assign" contextid="{{ACTIVITY_CONTEXTID}}">
  <assign id="{{ACTIVITY_ID}}">
    <name>{{ACTIVITY_TITLE}}</name>
    <intro>{{ACTIVITY_INTRO_HTML}}</intro>
    <introformat>1</introformat>
    <alwaysshowdescription>1</alwaysshowdescription>
    <submissiondrafts>0</submissiondrafts>
    <sendnotifications>0</sendnotifications>
    <sendlatenotifications>0</sendlatenotifications>
    <sendstudentnotifications>1</sendstudentnotifications>
    <duedate>0</duedate>
    <cutoffdate>0</cutoffdate>
    <gradingduedate>0</gradingduedate>
    <allowsubmissionsfromdate>0</allowsubmissionsfromdate>
    <grade>100</grade>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <completionsubmit>1</completionsubmit>
    <requiresubmissionstatement>0</requiresubmissionstatement>
    <teamsubmission>0</teamsubmission>
    <requireallteammemberssubmit>0</requireallteammemberssubmit>
    <teamsubmissiongroupingid>0</teamsubmissiongroupingid>
    <blindmarking>0</blindmarking>
    <hidegrader>0</hidegrader>
    <revealidentities>0</revealidentities>
    <attemptreopenmethod>untilpass</attemptreopenmethod>
    <maxattempts>1</maxattempts>
    <markingworkflow>0</markingworkflow>
    <markingallocation>0</markingallocation>
    <markinganonymous>0</markinganonymous>
    <preventsubmissionnotingroup>0</preventsubmissionnotingroup>
    <activity></activity>
    <activityformat>1</activityformat>
    <timelimit>0</timelimit>
    <submissionattachments>0</submissionattachments>
    <userflags></userflags>
    <submissions></submissions>
    <grades></grades>
    <plugin_configs>
      <plugin_config id="{{PLUGIN_CONFIG_ID_1}}">
        <plugin>onlinetext</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_2}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_3}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>maxfilesubmissions</name>
        <value>20</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_4}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>maxsubmissionsizebytes</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_5}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>filetypeslist</name>
        <value></value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_6}}">
        <plugin>comments</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_7}}">
        <plugin>comments</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_8}}">
        <plugin>comments</plugin>
        <subtype>assignfeedback</subtype>
        <name>commentinline</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_9}}">
        <plugin>editpdf</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_10}}">
        <plugin>offline</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_11}}">
        <plugin>file</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
    </plugin_configs>
    <overrides></overrides>
  </assign>
</activity>`;

/**
 * Options par défaut de la rubrique Moodle.
 * Active la visibilité pour enseignants et élèves, les remarques et les scores.
 */
const RUBRIC_OPTIONS = JSON.stringify({
    sortlevelsasc: '1',
    lockzeropoints: '1',
    alwaysshowdefinition: '1',
    showdescriptionteacher: '1',
    showdescriptionstudent: '1',
    showscoreteacher: '1',
    showscorestudent: '1',
    enableremarks: '1',
    showremarksstudent: '1'
});

/**
 * Construit le fichier grading.xml à partir des critères de la grille.
 * @param {Array} criteria - Tableau de critères avec levels
 * @param {Object} data - Données avec les placeholders
 * @returns {string} Contenu XML du fichier grading.xml
 */
function buildGradingXml(criteria, data) {
    const gradingAreaId = 100 + Math.floor(Math.random() * 900);
    const rubricDefinitionId = 100 + Math.floor(Math.random() * 900);
    const criterionBaseId = 1000 + Math.floor(Math.random() * 9000);
    const levelBaseId = 10000 + Math.floor(Math.random() * 90000);
    const maxLevels = Math.max(...criteria.map(c => (c.levels || []).length), 1);

    // Construire les critères XML
    let criteriaXml = '';
    criteria.forEach((criterion, i) => {
        const criterionId = criterionBaseId + i;
        const description = escapeXmlText(criterion.description || '');
        let levelsXml = '';

        (criterion.levels || []).forEach((level, j) => {
            const levelId = levelBaseId + (i * maxLevels) + j;
            const score = parseFloat(level.score || 0).toFixed(5);
            const definition = escapeXmlText(level.definition || '');
            levelsXml += `
                <level id="${levelId}">
                  <score>${score}</score>
                  <definition>${definition}</definition>
                  <definitionformat>0</definitionformat>
                </level>`;
        });

        criteriaXml += `
            <criterion id="${criterionId}">
              <sortorder>${i + 1}</sortorder>
              <description>${description}</description>
              <descriptionformat>0</descriptionformat>
              <levels>${levelsXml}
              </levels>
            </criterion>`;
    });

    const rubricName = escapeXmlText(data.RUBRIC_NAME || '');
    const introHtml = data.ACTIVITY_INTRO_HTML || '';
    const timestamp = data.TIMESTAMP || Math.floor(Date.now() / 1000);

    return `<?xml version="1.0" encoding="UTF-8"?>
<areas>
  <area id="${gradingAreaId}">
    <areaname>submissions</areaname>
    <activemethod>rubric</activemethod>
    <definitions>
      <definition id="${rubricDefinitionId}">
        <method>rubric</method>
        <name>${rubricName}</name>
        <description>${introHtml}</description>
        <descriptionformat>1</descriptionformat>
        <status>20</status>
        <timecreated>${timestamp}</timecreated>
        <timemodified>${timestamp}</timemodified>
        <options>${escapeXmlText(RUBRIC_OPTIONS)}</options>
        <plugin_gradingform_rubric_definition>
          <criteria>${criteriaXml}
          </criteria>
        </plugin_gradingform_rubric_definition>
        <instances></instances>
      </definition>
    </definitions>
  </area>
</areas>`;
}

/**
 * Construit tous les fichiers pour une activité Devoir.
 * @param {Object} data - Les données avec les placeholders remplis + CRITERIA et RUBRIC_NAME
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/assign_${data.MODULE_ID}`;

    // Générer les IDs séquentiels pour les plugin_configs
    const pluginBaseId = 100000 + Math.floor(Math.random() * 900000);
    for (let i = 1; i <= 11; i++) {
        data[`PLUGIN_CONFIG_ID_${i}`] = pluginBaseId + i;
    }

    // ========================================
    // Fichiers racine
    // ========================================
    files['moodle_backup.xml'] = buildMoodleBackup(data, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, data);
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;

    // ========================================
    // Fichiers de l'activité
    // ========================================
    files[`${activityDir}/assign.xml`] = replacePlaceholders(ASSIGN_XML, data);
    files[`${activityDir}/grading.xml`] = buildGradingXml(data.CRITERIA || [], data);
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
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Lit l'archive d'un Devoir (assign) déjà extraite par `mbz-utils.extractMbz`
 * et reconstruit le JSON éditeur. La grille d'évaluation (rubric) est dans un
 * fichier séparé `grading.xml` du même dossier d'activité.
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir - ex: 'activities/assign_25'
 * @returns {{
 *   title: string,
 *   criteria: Array<{ description, levels: Array<{ score, definition }> }>,
 *   _context: { moduleId, activityId, activityContextId }
 * }}
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/assign.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`devoir_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > assign')) {
        throw new Error('devoir_invalid_xml_no_root');
    }

    const title = tagText(doc, 'assign > name');

    // grading.xml — peut être absent si pas de rubric
    const criteria = [];
    const gradingPath  = `${activityDir}/grading.xml`;
    const gradingBytes = files[gradingPath];
    if (gradingBytes) {
        const gradingXml = new TextDecoder('utf-8').decode(gradingBytes);
        const gdoc = parseXml(gradingXml);
        for (const cr of gdoc.querySelectorAll('criterion')) {
            const description = cr.querySelector('description')?.textContent ?? '';
            const levels = Array.from(cr.querySelectorAll('level')).map(lv => ({
                score:      parseFloat(lv.querySelector('score')?.textContent ?? '0'),
                definition: lv.querySelector('definition')?.textContent ?? ''
            }));
            criteria.push({ description, levels });
        }
    }

    return {
        title,
        criteria,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Patch in-place : `name` dans assign.xml + reconstruction des `<criteria>`
 * dans grading.xml (s'il existe).
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/assign.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`devoir_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name', xmlEscape(data.title || ''));
    files[xmlPath] = window.fflate.strToU8(xml);

    // grading.xml — reconstruire les criteria si présents
    const gradingPath  = `${activityDir}/grading.xml`;
    const gradingBytes = files[gradingPath];
    if (gradingBytes && Array.isArray(data.criteria)) {
        let gradingXml = new TextDecoder('utf-8').decode(gradingBytes);
        const criteriaXml = data.criteria.map((c, i) => {
            const levelsXml = (c.levels || []).map((lv, j) => `
              <level id="${10000 + i * 10 + j}">
                <score>${parseFloat(lv.score || 0).toFixed(5)}</score>
                <definition>${xmlEscape(lv.definition || '')}</definition>
                <definitionformat>0</definitionformat>
              </level>`).join('');
            return `
          <criterion id="${1000 + i}">
            <sortorder>${i + 1}</sortorder>
            <description>${xmlEscape(c.description || '')}</description>
            <descriptionformat>0</descriptionformat>
            <levels>${levelsXml}
            </levels>
          </criterion>`;
        }).join('');
        gradingXml = rewriteTag(gradingXml, 'criteria', criteriaXml + '\n          ');
        files[gradingPath] = window.fflate.strToU8(gradingXml);
    }
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
