/**
 * @file Processeur pour l'activité Livre de Moodle (module book).
 * Génère tous les fichiers nécessaires à l'archive MBZ pour un livre multi-chapitres.
 *
 * Réutilise toute la mécanique Page sauf le template d'activité :
 * - book.xml au lieu de page.xml
 * - <chapters> contenant N <chapter> au lieu d'un <content> plat
 *
 * Les chapitres reçoivent leur HTML déjà composé via CHAPTERS_XML
 * (préparé en amont par moodle-creator.js qui invoque generateHtmlFromBlocks
 * une fois par chapitre avec le thème global).
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildCourseBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml, rewriteTag } from '../../mbz-utils.js';

/**
 * Métadonnées du module Livre.
 */
export const metadata = {
    moduleName: 'book',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'BOOK_NAME',
        'INTRO',
        'NUMBERING',
        'NAVSTYLE',
        'CUSTOMTITLES',
        'CHAPTERS_XML',
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
 * Template XML pour l'activité book.
 * Le bloc CHAPTERS_XML est composé par moodle-creator.js avec une boucle
 * sur les chapitres, chacun rendu en HTML via generateHtmlFromBlocks().
 */
const BOOK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="book" contextid="{{ACTIVITY_CONTEXTID}}">
  <book id="{{ACTIVITY_ID}}">
    <name>{{BOOK_NAME}}</name>
    <intro>{{INTRO}}</intro>
    <introformat>1</introformat>
    <numbering>{{NUMBERING}}</numbering>
    <navstyle>{{NAVSTYLE}}</navstyle>
    <customtitles>{{CUSTOMTITLES}}</customtitles>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <chapters>
{{CHAPTERS_XML}}
    </chapters>
    <chaptertags>
    </chaptertags>
  </book>
</activity>`;

/**
 * Template module.xml pour Book (sans grades, comme Page).
 */
const BOOK_MODULE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<module id="{{MODULE_ID}}" version="${metadata.moduleVersion}">
  <modulename>book</modulename>
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
 * Template grades.xml vide pour Livre (pas de notes, comme Page).
 */
const BOOK_GRADES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`;

/**
 * Template inforef.xml vide pour Livre (pas de grade_item).
 */
const BOOK_INFOREF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`;

/**
 * Template gradebook.xml VIDE pour Livre (pas de notes).
 * Identique à PAGE_GRADEBOOK_XML.
 */
const BOOK_GRADEBOOK_XML = `<?xml version="1.0" encoding="UTF-8"?>
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
 * Template block.xml pour course_toolbar (identique à Page).
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
 * Construit tous les fichiers pour une activité Livre.
 * @param {Object} data - Les données avec les placeholders remplis (incluant CHAPTERS_XML précomposé)
 * @param {Object} options - Options de génération
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 */
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/book_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    // IDs additionnels (enrols + block) - identique à Page
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
    // Fichiers racine (identiques à Page)
    // ========================================
    files['moodle_backup.xml'] = buildCourseBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = BOOK_GRADEBOOK_XML;  // Livre n'a pas de notes
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;

    // ========================================
    // Fichiers course/ (identiques à Page)
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
    // Fichiers course/blocks/ (identiques à Page)
    // ========================================
    files[`${blockDir}/block.xml`] = replacePlaceholders(BLOCK_XML, extendedData);
    files[`${blockDir}/inforef.xml`] = BLOCK_INFOREF_XML;
    files[`${blockDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;

    // ========================================
    // Fichiers sections/section_XXX/ (identiques à Page)
    // ========================================
    files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SECTION_XML, extendedData);
    files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;

    // ========================================
    // Fichiers de l'activité (LIVRE-SPÉCIFIQUE)
    // ========================================
    files[`${activityDir}/book.xml`] = replacePlaceholders(BOOK_XML, extendedData);
    files[`${activityDir}/module.xml`] = replacePlaceholders(BOOK_MODULE_XML, extendedData);
    files[`${activityDir}/grades.xml`] = BOOK_GRADES_XML;
    files[`${activityDir}/inforef.xml`] = BOOK_INFOREF_XML;
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

// =========================================================================
// INVERSE : .mbz extrait → JSON éditeur
// =========================================================================

/**
 * Lit l'archive d'un Livre (book) déjà extraite par `mbz-utils.extractMbz`.
 * Chaque chapter est représenté avec un seul block HTML pour cohérence avec
 * la convention de l'éditeur.
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir
 * @returns {{
 *   title: string,
 *   chapters: Array<{ title: string, subchapter: boolean, blocks: Array<{type:'html', html:string}> }>,
 *   _context: { moduleId, activityId, activityContextId }
 * }}
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/book.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`livre_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > book')) {
        throw new Error('livre_invalid_xml_no_root');
    }

    const chapters = Array.from(doc.querySelectorAll('book > chapters > chapter')).map(c => ({
        title:      c.querySelector('title')?.textContent ?? '',
        subchapter: c.querySelector('subchapter')?.textContent === '1',
        blocks:     [{ type: 'html', html: c.querySelector('content')?.textContent ?? '' }]
    }));

    return {
        title: tagText(doc, 'book > name'),
        chapters,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Patch in-place : `name` + reconstruction de `<chapters>` (chaque chapter
 * entièrement régénéré).
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/book.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`livre_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name', escapeXml(data.title || ''));

    const timestamp = Math.floor(Date.now() / 1000);
    const chaptersXml = (data.chapters || []).map((c, i) => {
        const html = (c.blocks || [])
            .map(b => b.type === 'html' ? (b.html || '') : '')
            .join('\n');
        return `      <chapter id="${100 + i}">
        <pagenum>${i + 1}</pagenum>
        <subchapter>${c.subchapter ? 1 : 0}</subchapter>
        <title>${escapeXml(c.title || `Chapitre ${i + 1}`)}</title>
        <content>${escapeXml(html)}</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>${timestamp}</timemodified>
        <importsrc></importsrc>
      </chapter>`;
    }).join('\n');

    xml = rewriteTag(xml, 'chapters', '\n' + chaptersXml + '\n    ');

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
