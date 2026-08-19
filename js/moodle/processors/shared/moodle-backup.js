/**
 * @file Builder pour le fichier moodle_backup.xml.
 * Ce fichier est le manifest principal de l'archive MBZ.
 *
 * Les trois variantes de sauvegarde (`activity`, `course`, `singleactivity`) partagent
 * ~90 % de leur structure. Elles étaient auparavant écrites en trois templates complets
 * quasi identiques (~570 lignes, dont 3 copies des 21 réglages `<level>root</level>`) :
 * un correctif appliqué à l'une pouvait manquer aux deux autres, et l'écart réel entre
 * variantes était noyé dans le XML dupliqué.
 *
 * Désormais : UN squelette (`buildBackupManifest`) + une table de variantes qui décrit
 * exactement ce qui change. `null` dans `rootSettings` = réglage ABSENT de cette variante
 * (ce n'est pas la même chose que la valeur `'0'`).
 *
 * ⚠️ La sortie est un contrat d'import Moodle/Éléa : l'ORDRE des éléments et l'indentation
 * font partie du format attendu. Toute modification ici doit rester byte-identique sauf
 * intention explicite — garde-fou : `node tests/run_moodle_backup_tests.mjs`.
 */

import { replacePlaceholders } from './placeholder.js';

/**
 * Constantes pour la version Moodle cible (4.5).
 */
const MOODLE_VERSION = '2024100706';
const MOODLE_RELEASE = '4.5.6 (Build: 20250811)';
const BACKUP_VERSION = '2024100700';
const BACKUP_RELEASE = '4.5';
const ORIGINAL_WWWROOT = 'https://caramel.forge.apps.education.fr/';
const SITE_IDENTIFIER_HASH = '31f4b05dd157f31e868a2589d8961f99';

/**
 * Constantes Moodle 4.1 pour les sauvegardes singleactivity.
 */
const MOODLE_41_VERSION = '2022112818';
const MOODLE_41_RELEASE = '4.1.18 (Build: 20250414)';
const BACKUP_41_VERSION = '2022112800';
const BACKUP_41_RELEASE = '4.1';

const MOODLE_45 = {
    version: MOODLE_VERSION,
    release: MOODLE_RELEASE,
    backupVersion: BACKUP_VERSION,
    backupRelease: BACKUP_RELEASE
};

const MOODLE_41 = {
    version: MOODLE_41_VERSION,
    release: MOODLE_41_RELEASE,
    backupVersion: BACKUP_41_VERSION,
    backupRelease: BACKUP_41_RELEASE
};

// =========================================================================
// Réglages racine — ordre canonique
// =========================================================================

/**
 * Ordre d'émission des réglages `<level>root</level>`. Cet ordre est celui produit
 * par Moodle lui-même ; ne pas réordonner.
 * `filename` est traité à part (sa valeur dépend de la variante).
 */
const ROOT_SETTING_ORDER = [
    'imscc11', 'users', 'anonymize', 'role_assignments', 'activities', 'blocks',
    'files', 'filters', 'comments', 'badges', 'calendarevents', 'userscompletion',
    'logs', 'grade_histories', 'questionbank', 'groups', 'competencies',
    'customfield', 'contentbankcontent', 'xapistate', 'legacyfiles'
];

// =========================================================================
// Table des variantes — TOUT ce qui distingue les trois sauvegardes
// =========================================================================

const BACKUP_VARIANTS = {
    /** Sauvegarde d'une activité seule (Test, QCM, Appariement, Devoir). */
    activity: {
        moodle: MOODLE_45,
        filename: (moduleName) => `sauvegarde-moodle2-activity-{{MODULE_ID}}-${moduleName}{{MODULE_ID}}-caramel.mbz`,
        includeFiles: '1',
        courseFormat: 'singleactivity',
        courseFullname: '{{COURSE_FULLNAME}}',
        detailBackupId: 'df6efda5e4345c33d5c6fb0efd80d6b3',
        detailType: 'activity',
        // <insubsection> présent dans le bloc <activity>
        activityInsubsection: true,
        // pas de bloc <sections>/<course> dans <contents>, ni de réglages de section
        withSectionsAndCourse: false,
        sectionParentFields: false,
        withSectionSettings: false,
        rootSettings: {
            imscc11: null,            // ABSENT de cette variante
            users: '0', anonymize: '0', role_assignments: '0', activities: '1',
            blocks: '1', files: '1', filters: '1', comments: '0', badges: '1',
            calendarevents: '1', userscompletion: '0', logs: '0', grade_histories: '0',
            questionbank: '1', groups: '1', competencies: '0', customfield: '1',
            contentbankcontent: '1', xapistate: '0', legacyfiles: '1'
        }
    },

    /** Sauvegarde de type cours (Page, Livre, Glossaire, banque de questions). */
    course: {
        moodle: MOODLE_45,
        filename: () => 'sauvegarde-moodle2-course-{{COURSE_ID}}-{{COURSE_SHORTNAME}}-caramel.mbz',
        includeFiles: '1',
        courseFormat: 'topics',
        courseFullname: '{{COURSE_FULLNAME}}',
        detailBackupId: 'b1904924ce499b878a2f32a7569d6ad0',
        detailType: 'course',
        activityInsubsection: true,
        withSectionsAndCourse: true,
        sectionParentFields: true,     // <parentcmid>/<modname> dans <section>
        withSectionSettings: true,
        rootSettings: {
            imscc11: '0',
            users: '0', anonymize: '0', role_assignments: '0', activities: '1',
            blocks: '1', files: '1', filters: '1', comments: '0', badges: '1',
            calendarevents: '1', userscompletion: '0', logs: '0', grade_histories: '0',
            questionbank: '1', groups: '1', competencies: '0', customfield: '1',
            contentbankcontent: '1', xapistate: '0', legacyfiles: '1'
        }
    },

    /** Sauvegarde « singleactivity » Moodle 4.1 (Millionnaire). */
    singleactivity: {
        moodle: MOODLE_41,
        filename: () => 'modele.mbz',
        includeFiles: '0',
        courseFormat: 'singleactivity',
        courseFullname: '{{ACTIVITY_TITLE}}',   // et non COURSE_FULLNAME
        detailBackupId: '6dadfa92577123d3c42a6c8c137387d4',
        detailType: 'course',
        activityInsubsection: false,   // pas de <insubsection>
        withSectionsAndCourse: true,
        sectionParentFields: false,    // pas de <parentcmid>/<modname>
        withSectionSettings: true,
        rootSettings: {
            imscc11: '0',
            users: '0', anonymize: '0', role_assignments: '0', activities: '1',
            blocks: '0', files: '0', filters: '0', comments: '0', badges: '0',
            calendarevents: '0', userscompletion: '0', logs: '0', grade_histories: '0',
            questionbank: '0', groups: '0', competencies: '0', customfield: '0',
            contentbankcontent: '0', xapistate: null, legacyfiles: '0'  // xapistate ABSENT
        }
    }
};

// =========================================================================
// Fabriques de fragments XML
// =========================================================================

/** Un `<setting>` de niveau root. */
const rootSetting = (name, value) => `      <setting>
        <level>root</level>
        <name>${name}</name>
        <value>${value}</value>
      </setting>`;

/** Un `<setting>` de niveau section. */
const sectionSetting = (suffix, value) => `      <setting>
        <level>section</level>
        <section>section_{{SECTION_ID}}</section>
        <name>section_{{SECTION_ID}}_${suffix}</name>
        <value>${value}</value>
      </setting>`;

/** Un `<setting>` de niveau activité. */
const activitySetting = (moduleName, suffix, value) => `      <setting>
        <level>activity</level>
        <activity>${moduleName}_{{MODULE_ID}}</activity>
        <name>${moduleName}_{{MODULE_ID}}_${suffix}</name>
        <value>${value}</value>
      </setting>`;

/**
 * Assemble le bloc `<settings>` complet d'une variante.
 * @param {Object} variant - Entrée de BACKUP_VARIANTS.
 * @param {string} moduleName
 * @param {string} filename - Valeur du réglage `filename`.
 * @returns {string}
 */
function buildSettings(variant, moduleName, filename) {
    const parts = [rootSetting('filename', filename)];

    for (const name of ROOT_SETTING_ORDER) {
        const value = variant.rootSettings[name];
        if (value === null || value === undefined) continue;   // réglage absent de la variante
        parts.push(rootSetting(name, value));
    }

    if (variant.withSectionSettings) {
        parts.push(sectionSetting('included', '1'));
        parts.push(sectionSetting('userinfo', '0'));
    }

    parts.push(activitySetting(moduleName, 'included', '1'));
    parts.push(activitySetting(moduleName, 'userinfo', '0'));

    return parts.join('\n');
}

/**
 * Assemble le bloc `<contents>` d'une variante.
 * @param {Object} variant - Entrée de BACKUP_VARIANTS.
 * @param {string} moduleName
 * @returns {string}
 */
function buildContents(variant, moduleName) {
    const insubsection = variant.activityInsubsection
        ? '\n          <insubsection></insubsection>'
        : '';

    let xml = `    <contents>
      <activities>
        <activity>
          <moduleid>{{MODULE_ID}}</moduleid>
          <sectionid>{{SECTION_ID}}</sectionid>
          <modulename>${moduleName}</modulename>
          <title>{{ACTIVITY_TITLE}}</title>
          <directory>activities/${moduleName}_{{MODULE_ID}}</directory>${insubsection}
        </activity>
      </activities>`;

    if (variant.withSectionsAndCourse) {
        const parentFields = variant.sectionParentFields
            ? '\n          <parentcmid></parentcmid>\n          <modname></modname>'
            : '';
        xml += `
      <sections>
        <section>
          <sectionid>{{SECTION_ID}}</sectionid>
          <title>0</title>
          <directory>sections/section_{{SECTION_ID}}</directory>${parentFields}
        </section>
      </sections>
      <course>
        <courseid>{{COURSE_ID}}</courseid>
        <title>{{COURSE_SHORTNAME}}</title>
        <directory>course</directory>
      </course>`;
    }

    xml += `
    </contents>`;
    return xml;
}

/**
 * Génère le contenu de moodle_backup.xml pour une variante donnée.
 * @param {'activity'|'course'|'singleactivity'} variantName
 * @param {Object} data - Les données avec les placeholders
 * @param {string} moduleName - Nom du module (epikmatch, simplequiz, page, …)
 * @returns {string} Le contenu XML du fichier moodle_backup.xml
 */
function buildBackupManifest(variantName, data, moduleName) {
    const variant = BACKUP_VARIANTS[variantName];
    if (!variant) throw new Error(`Variante de sauvegarde inconnue : ${variantName}`);

    const { moodle } = variant;
    const filename = variant.filename(moduleName);

    const template = `<?xml version="1.0" encoding="UTF-8"?>
<moodle_backup>
  <information>
    <name>${filename}</name>
    <moodle_version>${moodle.version}</moodle_version>
    <moodle_release>${moodle.release}</moodle_release>
    <backup_version>${moodle.backupVersion}</backup_version>
    <backup_release>${moodle.backupRelease}</backup_release>
    <backup_date>{{BACKUP_DATE}}</backup_date>
    <mnet_remoteusers>0</mnet_remoteusers>
    <include_files>${variant.includeFiles}</include_files>
    <include_file_references_to_external_content>0</include_file_references_to_external_content>
    <original_wwwroot>${ORIGINAL_WWWROOT}</original_wwwroot>
    <original_site_identifier_hash>${SITE_IDENTIFIER_HASH}</original_site_identifier_hash>
    <original_course_id>{{COURSE_ID}}</original_course_id>
    <original_course_format>${variant.courseFormat}</original_course_format>
    <original_course_fullname>${variant.courseFullname}</original_course_fullname>
    <original_course_shortname>{{COURSE_SHORTNAME}}</original_course_shortname>
    <original_course_startdate>0</original_course_startdate>
    <original_course_enddate>0</original_course_enddate>
    <original_course_contextid>{{COURSE_CONTEXTID}}</original_course_contextid>
    <original_system_contextid>1</original_system_contextid>
    <details>
      <detail backup_id="${variant.detailBackupId}">
        <type>${variant.detailType}</type>
        <format>moodle2</format>
        <interactive>1</interactive>
        <mode>10</mode>
        <execution>1</execution>
        <executiontime>0</executiontime>
      </detail>
    </details>
${buildContents(variant, moduleName)}
    <settings>
${buildSettings(variant, moduleName, filename)}
    </settings>
  </information>
</moodle_backup>`;

    return replacePlaceholders(template, data);
}

// =========================================================================
// API publique — signatures inchangées
// =========================================================================

/**
 * Génère le contenu du fichier moodle_backup.xml pour une sauvegarde de type "activity".
 * @param {Object} data - Les données avec les placeholders
 * @param {string} moduleName - Nom du module (epikmatch, simplequiz, etc.)
 * @returns {string} Le contenu XML du fichier moodle_backup.xml
 */
export function buildMoodleBackup(data, moduleName) {
    return buildBackupManifest('activity', data, moduleName);
}

/**
 * Génère le contenu du fichier moodle_backup.xml pour une sauvegarde de type "course".
 * Utilisé pour les activités Page qui incluent course et section.
 * @param {Object} data - Les données avec les placeholders
 * @param {string} moduleName - Nom du module (page, etc.)
 * @returns {string} Le contenu XML du fichier moodle_backup.xml
 */
export function buildCourseBackup(data, moduleName) {
    return buildBackupManifest('course', data, moduleName);
}

/**
 * Génère le contenu du fichier moodle_backup.xml pour une sauvegarde de type "singleactivity".
 * Utilisé pour Millionnaire et activités similaires avec format singleactivity.
 * @param {Object} data - Les données avec les placeholders
 * @param {string} moduleName - Nom du module (millionnairev2, etc.)
 * @returns {string} Le contenu XML du fichier moodle_backup.xml
 */
export function buildSingleActivityBackup(data, moduleName) {
    return buildBackupManifest('singleactivity', data, moduleName);
}
