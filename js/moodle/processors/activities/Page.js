/**
 * @file Processeur pour l'activité Page de Moodle.
 * Génère tous les fichiers nécessaires à l'archive MBZ, incluant course et section.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildCourseBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';

/**
 * Métadonnées du module Page.
 */
export const metadata = {
    moduleName: 'page',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'PAGE_NAME',
        'CONTENT',
        'INTRO',
        'COURSE_FULLNAME',
        'COURSE_SHORTNAME',
        'COURSE_ID',
        'MODULE_ID',
        'SECTION_ID',
        'ACTIVITY_ID',
        'COURSE_CONTEXTID',
        'ACTIVITY_CONTEXTID',
        'TIMESTAMP',
        'BACKUP_DATE'
    ]
};

/**
 * Template XML pour l'activité page.
 */
const PAGE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="page" contextid="{{ACTIVITY_CONTEXTID}}">
  <page id="{{ACTIVITY_ID}}">
    <name>{{PAGE_NAME}}</name>
    <intro>{{INTRO}}</intro>
    <introformat>1</introformat>
    <content>{{CONTENT}}</content>
    <contentformat>1</contentformat>
    <legacyfiles>0</legacyfiles>
    <legacyfileslast>$@NULL@$</legacyfileslast>
    <display>5</display>
    <displayoptions>a:2:{s:10:"printintro";s:1:"0";s:17:"printlastmodified";s:1:"0";}</displayoptions>
    <revision>1</revision>
    <timemodified>{{TIMESTAMP}}</timemodified>
  </page>
</activity>`;

/**
 * Template pour module.xml de Page (sans grades).
 */
const PAGE_MODULE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<module id="{{MODULE_ID}}" version="${metadata.moduleVersion}">
  <modulename>page</modulename>
  <sectionid>{{SECTION_ID}}</sectionid>
  <sectionnumber>0</sectionnumber>
  <idnumber></idnumber>
  <added>{{TIMESTAMP}}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>0</groupmode>
  <groupingid>0</groupingid>
  <completion>2</completion>
  <completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>1</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`;

/**
 * Template grades.xml vide pour Page (pas de notes).
 */
const PAGE_GRADES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`;

/**
 * Template inforef.xml vide pour Page (pas de grade_item).
 */
const PAGE_INFOREF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`;

/**
 * Template gradebook.xml VIDE pour Page (pas de notes).
 * Page n'a pas de système de notation, donc le gradebook est vide.
 */
const PAGE_GRADEBOOK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gradebook>
  <attributes>
  </attributes>
  <grade_categories>
  </grade_categories>
  <grade_items>
  </grade_items>
  <grade_letters>
  </grade_letters>
  <grade_settings>
    <grade_setting id="">
      <name>minmaxtouse</name>
      <value>1</value>
    </grade_setting>
  </grade_settings>
</gradebook>`;

/**
 * Template block.xml pour course_toolbar.
 */
const BLOCK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<block id="{{BLOCK_ID}}" contextid="{{BLOCK_CONTEXTID}}" version="2025070700">
  <blockname>course_toolbar</blockname>
  <parentcontextid>{{COURSE_CONTEXTID}}</parentcontextid>
  <showinsubcontexts>0</showinsubcontexts>
  <pagetypepattern>course-view-*</pagetypepattern>
  <subpagepattern>$@NULL@$</subpagepattern>
  <defaultregion>side-pre</defaultregion>
  <defaultweight>0</defaultweight>
  <configdata></configdata>
  <timecreated>{{TIMESTAMP}}</timecreated>
  <timemodified>{{TIMESTAMP}}</timemodified>
  <block_positions>
  </block_positions>
</block>`;

/**
 * Template inforef.xml vide pour block.
 */
const BLOCK_INFOREF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`;

/**
 * Construit tous les fichiers pour une activité Page.
 * @param {Object} data - Les données avec les placeholders remplis
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/page_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    // Ajouter des IDs supplémentaires pour les enrols et block
    const blockId = 1000 + Math.floor(Math.random() * 9000);
    const extendedData = {
        ...data,
        ENROL_MANUAL_ID: data.ENROL_MANUAL_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_GUEST_ID: data.ENROL_GUEST_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_SELF_ID: data.ENROL_SELF_ID || (10000 + Math.floor(Math.random() * 90000)),
        BLOCK_ID: blockId,
        BLOCK_CONTEXTID: data.COURSE_CONTEXTID + 1
    };

    const blockDir = `course/blocks/course_toolbar_${blockId}`;

    // ========================================
    // Fichiers racine (exact comme modele_base original)
    // ========================================
    files['moodle_backup.xml'] = buildCourseBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = PAGE_GRADEBOOK_XML;  // Page n'a pas de notes - gradebook vide
    //files['grade_history.xml'] = TEMPLATES.GRADE_HISTORY_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;
    //files['badges.xml'] = TEMPLATES.BADGES_XML;

    // ========================================
    // Fichiers course/ (exact comme modele_base original)
    // ========================================
    files['course/course.xml'] = replacePlaceholders(TEMPLATES.COURSE_XML, extendedData);
    files['course/enrolments.xml'] = replacePlaceholders(TEMPLATES.COURSE_ENROLMENTS_XML, extendedData);
    files['course/inforef.xml'] = TEMPLATES.COURSE_INFOREF_XML;
    files['course/roles.xml'] = TEMPLATES.ACTIVITY_ROLES_XML;
    files['course/completiondefaults.xml'] = TEMPLATES.COURSE_COMPLETIONDEFAULTS_XML;
    files['course/contentbank.xml'] = TEMPLATES.COURSE_CONTENTBANK_XML;
    files['course/calendar.xml'] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files['course/filters.xml'] = TEMPLATES.ACTIVITY_FILTERS_XML;

    // ========================================
    // Fichiers course/blocks/ (exact comme modele_base original)
    // ========================================
    files[`${blockDir}/block.xml`] = replacePlaceholders(BLOCK_XML, extendedData);
    files[`${blockDir}/inforef.xml`] = BLOCK_INFOREF_XML;
    files[`${blockDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;

    // ========================================
    // Fichiers sections/section_XXX/
    // ========================================
    files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SECTION_XML, extendedData);
    files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;

    // ========================================
    // Fichiers de l'activité
    // ========================================
    files[`${activityDir}/page.xml`] = replacePlaceholders(PAGE_XML, extendedData);
    files[`${activityDir}/module.xml`] = replacePlaceholders(PAGE_MODULE_XML, extendedData);
    files[`${activityDir}/grades.xml`] = PAGE_GRADES_XML;
    files[`${activityDir}/inforef.xml`] = PAGE_INFOREF_XML;
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    //files[`${activityDir}/grade_history.xml`] = TEMPLATES.ACTIVITY_GRADE_HISTORY_XML;
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

/**
 * Export par défaut du processeur.
 */
export default {
    metadata,
    buildFiles
};
