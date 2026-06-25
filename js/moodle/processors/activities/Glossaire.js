/**
 * @file Processeur pour l'activité Glossaire de Moodle.
 * Génère tous les fichiers nécessaires à l'archive MBZ.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildCourseBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, rewriteTag, escapeXml as xmlEscape } from '../../mbz-utils.js';
import { escapeXml } from '../../moodle-formats.js';

/**
 * Métadonnées du module Glossaire.
 */
export const metadata = {
    moduleName: 'glossary',
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
        'BACKUP_DATE'
    ]
};

/**
 * Template XML pour l'activité glossary.
 */
const GLOSSARY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="glossary" contextid="{{ACTIVITY_CONTEXTID}}">
  <glossary id="{{ACTIVITY_ID}}">
    <name>{{ACTIVITY_TITLE}}</name>
    <intro></intro>
    <introformat>1</introformat>
    <allowduplicatedentries>0</allowduplicatedentries>
    <displayformat>dictionary</displayformat>
    <mainglossary>0</mainglossary>
    <showspecial>1</showspecial>
    <showalphabet>1</showalphabet>
    <showall>1</showall>
    <allowcomments>0</allowcomments>
    <allowprintview>1</allowprintview>
    <usedynalink>1</usedynalink>
    <defaultapproval>1</defaultapproval>
    <globalglossary>0</globalglossary>
    <entbypage>10</entbypage>
    <editalways>0</editalways>
    <rsstype>0</rsstype>
    <rssarticles>0</rssarticles>
    <assessed>0</assessed>
    <assesstimestart>0</assesstimestart>
    <assesstimefinish>0</assesstimefinish>
    <scale>100</scale>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <completionentries>1</completionentries>
    <entries>
{{ENTRIES_XML}}
    </entries>
    <entriestags>
    </entriestags>
    <categories>
    </categories>
  </glossary>
</activity>`;

/**
 * Template pour module.xml du Glossaire (completion différent).
 */
const GLOSSARY_MODULE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<module id="{{MODULE_ID}}" version="${metadata.moduleVersion}">
  <modulename>glossary</modulename>
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
  <completionview>0</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`;

/**
 * Template grades.xml vide pour Glossaire.
 */
const GLOSSARY_GRADES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`;

/**
 * Template inforef.xml vide pour Glossaire.
 */
const GLOSSARY_INFOREF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`;

/**
 * Génère le XML des entrées du glossaire.
 * @param {Array} entries - Tableau d'entrées [{concept: string, definition: string}]
 * @returns {string} XML des entrées
 */
export function buildEntriesXml(entries) {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return '';
    }

    return entries.map((entry, index) => {
        const entryId = 1000 + index;
        return `      <entry id="${entryId}">
        <userid>0</userid>
        <concept>${escapeXml(entry.concept || '')}</concept>
        <definition>${escapeXml(entry.definition || '')}</definition>
        <definitionformat>1</definitionformat>
        <definitiontrust>0</definitiontrust>
        <attachment></attachment>
        <timecreated>{{TIMESTAMP}}</timecreated>
        <timemodified>{{TIMESTAMP}}</timemodified>
        <teacherentry>0</teacherentry>
        <sourceglossaryid>0</sourceglossaryid>
        <usedynalink>1</usedynalink>
        <casesensitive>0</casesensitive>
        <fullmatch>0</fullmatch>
        <approved>1</approved>
        <aliases>
        </aliases>
        <ratings>
        </ratings>
      </entry>`;
    }).join('\n');
}

/**
 * Construit tous les fichiers pour une activité Glossaire.
 * @param {Object} data - Les données avec les placeholders remplis
 * @param {Object} options - Options de génération (entries: Array)
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/glossary_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    // Générer les entrées XML si fournies
    const entriesXml = options.entries ? buildEntriesXml(options.entries) : (data.ENTRIES_XML || '');

    // Ajouter des IDs supplémentaires pour les enrols
    const extendedData = {
        ...data,
        ENTRIES_XML: entriesXml,
        ENROL_MANUAL_ID: data.ENROL_MANUAL_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_GUEST_ID: data.ENROL_GUEST_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_SELF_ID: data.ENROL_SELF_ID || (10000 + Math.floor(Math.random() * 90000))
    };

    // ========================================
    // Fichiers racine
    // ========================================
    files['moodle_backup.xml'] = buildCourseBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, extendedData);
    files['grade_history.xml'] = TEMPLATES.GRADE_HISTORY_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;

    // ========================================
    // Fichiers course/
    // ========================================
    files['course/course.xml'] = replacePlaceholders(TEMPLATES.COURSE_XML, extendedData);
    files['course/enrolments.xml'] = replacePlaceholders(TEMPLATES.COURSE_ENROLMENTS_XML, extendedData);
    files['course/inforef.xml'] = TEMPLATES.COURSE_INFOREF_XML;
    files['course/roles.xml'] = TEMPLATES.ACTIVITY_ROLES_XML;
    files['course/completiondefaults.xml'] = TEMPLATES.COURSE_COMPLETIONDEFAULTS_XML;
    files['course/contentbank.xml'] = TEMPLATES.COURSE_CONTENTBANK_XML;

    // ========================================
    // Fichiers sections/section_XXX/
    // ========================================
    files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SECTION_XML, extendedData);
    files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;

    // ========================================
    // Fichiers de l'activité
    // ========================================
    files[`${activityDir}/glossary.xml`] = replacePlaceholders(GLOSSARY_XML, extendedData);
    files[`${activityDir}/module.xml`] = replacePlaceholders(GLOSSARY_MODULE_XML, extendedData);
    files[`${activityDir}/grades.xml`] = GLOSSARY_GRADES_XML;
    files[`${activityDir}/inforef.xml`] = GLOSSARY_INFOREF_XML;
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    files[`${activityDir}/grade_history.xml`] = TEMPLATES.ACTIVITY_GRADE_HISTORY_XML;
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Lit l'archive d'un Glossaire (glossary) déjà extraite par
 * `mbz-utils.extractMbz` et reconstruit le JSON éditeur.
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir - ex: 'activities/glossary_25'
 * @returns {{ name: string, entries: Array<{concept, definition}>, _context: { moduleId, activityId, activityContextId } }}
 *   `name` (et non `title` comme les autres processors) car c'est ce qu'attend
 *   le schema `elea_glossaire` dans `editor/content-detector.js` (intouchable).
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/glossary.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`glossaire_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > glossary')) {
        throw new Error('glossaire_invalid_xml_no_root');
    }

    const name = tagText(doc, 'glossary > name');

    const entries = Array.from(doc.querySelectorAll('glossary > entries > entry')).map(e => ({
        concept:    e.querySelector('concept')?.textContent ?? '',
        definition: e.querySelector('definition')?.textContent ?? ''
    }));

    return {
        name,
        entries,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Patch in-place : on régénère intégralement la liste `<entries>` (chaque
 * `<entry>` est entièrement reconstruit) plus le `<name>`. Les autres
 * options Moodle (allowduplicatedentries, displayformat, etc.) sont laissées
 * telles quelles.
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/glossary.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`glossaire_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name', xmlEscape(data.name || ''));

    const entriesXml = (data.entries || []).map((e, i) => `      <entry id="${1000 + i}">
        <userid>0</userid>
        <concept>${xmlEscape(e.concept || '')}</concept>
        <definition>${xmlEscape(e.definition || '')}</definition>
        <definitionformat>1</definitionformat>
        <definitiontrust>0</definitiontrust>
        <attachment></attachment>
        <teacherentry>0</teacherentry>
        <sourceglossaryid>0</sourceglossaryid>
        <usedynalink>1</usedynalink>
        <casesensitive>0</casesensitive>
        <fullmatch>0</fullmatch>
        <approved>1</approved>
        <aliases></aliases>
        <ratings></ratings>
      </entry>`).join('\n');

    xml = rewriteTag(xml, 'entries', '\n' + entriesXml + '\n    ');

    files[xmlPath] = window.fflate.strToU8(xml);
}

// =========================================================================
// FORMAT STANDALONE — Glossary XML import/export Moodle (root <GLOSSARY>)
// =========================================================================
//
// Format complètement différent du `glossary.xml` interne au MBZ :
//  - balises UPPERCASE (NAME, ENTRIES, ENTRY, CONCEPT, DEFINITION, ALIASES)
//  - structure imbriquée <GLOSSARY><INFO>...<ENTRIES><ENTRY>...
// C'est le format que Caramel exporte directement via "Banque de glossaires".

/**
 * Parse un XML Glossary standalone (<GLOSSARY>...) vers le JSON éditeur.
 * Le shape de sortie est aligné avec `parseFiles` (champs name, entries)
 * pour que l'éditeur traite les deux origines de manière uniforme.
 *
 * @param {string} xml - Contenu du fichier `.xml` standalone
 * @returns {{ name: string, entries: Array<{ concept, definition, aliases }> }}
 */
export function parseStandaloneXml(xml) {
    const doc = parseXml(xml);
    const root = doc.documentElement;
    if (!root || root.tagName !== 'GLOSSARY') {
        throw new Error('glossaire_standalone_invalid_root');
    }

    const name = root.querySelector('INFO > NAME')?.textContent ?? '';

    const entries = Array.from(root.querySelectorAll('INFO > ENTRIES > ENTRY')).map(e => ({
        concept:    e.querySelector('CONCEPT')?.textContent ?? '',
        definition: e.querySelector('DEFINITION')?.textContent ?? '',
        // Les aliases sont propres au format standalone (absents du MBZ classique).
        // Conservés pour ne pas perdre d'info au round-trip.
        aliases: Array.from(e.querySelectorAll('ALIASES > ALIAS > NAME'))
            .map(n => n.textContent ?? '')
            .filter(s => s.length > 0)
    }));

    return { name, entries };
}

/**
 * Reconstruit l'XML Glossary standalone à partir du JSON éditeur.
 * Émet un format minimal mais valide (Moodle accepte l'absence de plusieurs
 * options secondaires comme DISPLAYFORMAT, FULLMATCH, etc. — on les met
 * avec des valeurs par défaut raisonnables).
 *
 * @param {{ name: string, entries: Array<{concept, definition, aliases?: string[]}> }} data
 * @returns {string} XML standalone prêt à être téléchargé
 */
export function serializeStandaloneXml(data) {
    const name = xmlEscape(data.name || '');

    const entriesXml = (data.entries || []).map(e => {
        const aliasesXml = (e.aliases || []).length === 0
            ? '<ALIASES></ALIASES>'
            : '<ALIASES>'
                + e.aliases.map(a => `<ALIAS><NAME>${xmlEscape(a)}</NAME></ALIAS>`).join('')
                + '</ALIASES>';

        return `      <ENTRY>
        <CONCEPT>${xmlEscape(e.concept || '')}</CONCEPT>
        <DEFINITION>${xmlEscape(e.definition || '')}</DEFINITION>
        <FORMAT>1</FORMAT>
        <DEFINITIONTRUST>0</DEFINITIONTRUST>
        <USEDYNALINK>1</USEDYNALINK>
        <CASESENSITIVE>0</CASESENSITIVE>
        <FULLMATCH>0</FULLMATCH>
        <TEACHERENTRY>1</TEACHERENTRY>
        ${aliasesXml}
      </ENTRY>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<GLOSSARY>
  <INFO>
    <NAME>${name}</NAME>
    <INTRO><p dir="ltr" style="text-align: left;"></p></INTRO>
    <INTROFORMAT>1</INTROFORMAT>
    <ALLOWDUPLICATEDENTRIES>0</ALLOWDUPLICATEDENTRIES>
    <DISPLAYFORMAT>dictionary</DISPLAYFORMAT>
    <SHOWSPECIAL>1</SHOWSPECIAL>
    <SHOWALPHABET>1</SHOWALPHABET>
    <SHOWALL>1</SHOWALL>
    <ALLOWCOMMENTS>0</ALLOWCOMMENTS>
    <USEDYNALINK>0</USEDYNALINK>
    <DEFAULTAPPROVAL>0</DEFAULTAPPROVAL>
    <GLOBALGLOSSARY>0</GLOBALGLOSSARY>
    <ENTBYPAGE>10</ENTBYPAGE>
    <ENTRIES>
${entriesXml}
    </ENTRIES>
  </INFO>
</GLOSSARY>`;
}

/**
 * Export par défaut du processeur.
 */
export default {
    metadata,
    buildFiles,
    buildEntriesXml,
    parseFiles,
    serializeFiles,
    parseStandaloneXml,
    serializeStandaloneXml
};
