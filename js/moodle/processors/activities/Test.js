/**
 * @file Processeur pour l'activité Test (Quiz natif Moodle).
 * Génère tous les fichiers nécessaires à l'archive MBZ.
 * Note: Ce processeur nécessite des données complexes incluant les questions.
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildMoodleBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';
import { parseXml, tagText, escapeXml, rewriteTag, stripParagraphWrap, wrapP } from '../../mbz-utils.js';

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
 * Parse une `<question>` Moodle vers la structure éditeur attendue.
 * Supporte 6 types : multichoice, matching, truefalse, numerical, shortanswer, cloze.
 */
function parseQuestionContent(q, type) {
    const txt  = (sel) => q.querySelector(sel)?.textContent ?? '';
    const name = q.querySelector(':scope > name > text')?.textContent ?? '';
    const questiontext = stripParagraphWrap(q.querySelector(':scope > questiontext > text')?.textContent ?? '');
    const feedback     = stripParagraphWrap(q.querySelector(':scope > generalfeedback > text')?.textContent ?? '');
    const hints        = Array.from(q.querySelectorAll(':scope > hint > text')).map(h => h.textContent ?? '');

    switch (type) {
        case 'multichoice': {
            const single = (q.querySelector(':scope > single')?.textContent ?? 'true').trim();
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     stripParagraphWrap(a.querySelector('text')?.textContent ?? ''),
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, single, answers, feedback, hints,
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'matching': {
            const subquestions = Array.from(q.querySelectorAll(':scope > subquestion')).map(sq => ({
                text:   stripParagraphWrap(sq.querySelector('text')?.textContent ?? ''),
                answer: sq.querySelector('answer > text')?.textContent ?? ''
            }));
            return {
                name, questiontext, subquestions, feedback, hints,
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'truefalse': {
            const answers = Array.from(q.querySelectorAll(':scope > answer'));
            const trueAns  = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'true');
            const falseAns = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'false');
            return {
                name, questiontext,
                answer: {
                    value:          parseFloat(trueAns?.getAttribute('fraction') || '0') > 0,
                    feedback_true:  stripParagraphWrap(trueAns?.querySelector('feedback > text')?.textContent ?? ''),
                    feedback_false: stripParagraphWrap(falseAns?.querySelector('feedback > text')?.textContent ?? '')
                },
                feedback, hints
            };
        }
        case 'numerical': {
            const a = q.querySelector(':scope > answer');
            return {
                name, questiontext,
                answer: {
                    number:    parseFloat(a?.querySelector('text')?.textContent ?? '0'),
                    tolerance: parseFloat(a?.querySelector('tolerance')?.textContent ?? '0'),
                    feedback:  stripParagraphWrap(a?.querySelector('feedback > text')?.textContent ?? '')
                },
                feedback, hints
            };
        }
        case 'shortanswer': {
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     a.querySelector('text')?.textContent ?? '',
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, answers, feedback, hints,
                usecase: parseInt(txt(':scope > usecase') || '0', 10)
            };
        }
        case 'cloze': {
            // questiontext garde les marqueurs Moodle {1:MULTICHOICE:=foo~bar} bruts
            return { name, questiontext, feedback, hints };
        }
        default:
            return null;
    }
}

/**
 * Lit l'archive d'un Test (quiz) déjà extraite par `mbz-utils.extractMbz`.
 *
 * Les questions vivent dans `questions.xml` à la racine du backup (pas dans
 * le dossier d'activité). `quiz.xml` ne contient que la configuration et les
 * références (`<question_instances>`).
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir
 * @returns {{
 *   title: string,
 *   bank_name: string,
 *   bank_description: string,
 *   options: Object,
 *   questions: Array<{ type: string, content: Object }>,
 *   _context: { moduleId, activityId, activityContextId }
 * }}
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/quiz.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`test_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > quiz')) {
        throw new Error('test_invalid_xml_no_root');
    }

    const title = tagText(doc, 'quiz > name');

    // questions.xml — racine du MBZ
    const qBytes = files['questions.xml'];
    let bank_name = title, bank_description = '';
    const questions = [];

    if (qBytes) {
        const qDoc = parseXml(new TextDecoder('utf-8').decode(qBytes));
        for (const q of qDoc.querySelectorAll('question')) {
            const type = q.getAttribute('type');
            if (type === 'category') {
                const cat = q.querySelector('category > text')?.textContent ?? '';
                bank_name = cat.split('/').pop() || title;
                bank_description = q.querySelector('info > text')?.textContent ?? '';
                continue;
            }
            const content = parseQuestionContent(q, type);
            if (content) questions.push({ type, content });
        }
    }

    return {
        title,
        bank_name,
        bank_description,
        options: {},
        questions,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/**
 * Sérialise une `<question>` complète selon son type.
 */
function buildQuestionXml(question) {
    const c = question.content || {};
    const name  = escapeXml(c.name || '');
    const qtext = wrapP(c.questiontext || '');
    const fb    = wrapP(c.feedback || '');
    const hintsXml = (c.hints || []).map(h => `
    <hint format="html"><text><![CDATA[${wrapP(typeof h === 'string' ? h : h._value || '')}]]></text></hint>`).join('');

    switch (question.type) {
        case 'multichoice': {
            const single = String(c.single ?? 'true');
            const answersXml = (c.answers || []).map(a => `
    <answer fraction="${a.fraction || 0}" format="moodle_auto_format">
      <text>${escapeXml(a.text || '')}</text>
      <feedback format="html"><text><![CDATA[${wrapP(a.feedback || '')}]]></text></feedback>
    </answer>`).join('');
            const cf = `
    <correctfeedback format="html"><text><![CDATA[${wrapP(c.correctfeedback || '')}]]></text></correctfeedback>
    <partiallycorrectfeedback format="html"><text><![CDATA[${wrapP(c.partiallycorrectfeedback || '')}]]></text></partiallycorrectfeedback>
    <incorrectfeedback format="html"><text><![CDATA[${wrapP(c.incorrectfeedback || '')}]]></text></incorrectfeedback>`;
            return `
  <question type="multichoice">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${qtext}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>
    <single>${single}</single>
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>abc</answernumbering>${cf}${answersXml}${hintsXml}
  </question>`;
        }
        case 'matching': {
            const subsXml = (c.subquestions || []).map(sq => `
    <subquestion format="html">
      <text><![CDATA[${wrapP(sq.text || '')}]]></text>
      <answer><text>${escapeXml(sq.answer || '')}</text></answer>
    </subquestion>`).join('');
            const cf = `
    <correctfeedback format="html"><text><![CDATA[${wrapP(c.correctfeedback || '')}]]></text></correctfeedback>
    <partiallycorrectfeedback format="html"><text><![CDATA[${wrapP(c.partiallycorrectfeedback || '')}]]></text></partiallycorrectfeedback>
    <incorrectfeedback format="html"><text><![CDATA[${wrapP(c.incorrectfeedback || '')}]]></text></incorrectfeedback>`;
            return `
  <question type="matching">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${qtext}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>
    <shuffleanswers>true</shuffleanswers>${cf}${subsXml}${hintsXml}
  </question>`;
        }
        case 'truefalse': {
            const a  = c.answer || {};
            // Robustesse : la chaîne "false" est truthy en JS, on normalise explicitement.
            const isTrue = a.value === true || a.value === 'true';
            const fT = isTrue ? 100 : 0, fF = isTrue ? 0 : 100;
            return `
  <question type="truefalse">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${qtext}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>
    <answer fraction="${fT}" format="moodle_auto_format">
      <text>true</text>
      <feedback format="html"><text><![CDATA[${wrapP(a.feedback_true || '')}]]></text></feedback>
    </answer>
    <answer fraction="${fF}" format="moodle_auto_format">
      <text>false</text>
      <feedback format="html"><text><![CDATA[${wrapP(a.feedback_false || '')}]]></text></feedback>
    </answer>${hintsXml}
  </question>`;
        }
        case 'numerical': {
            const a = c.answer || {};
            return `
  <question type="numerical">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${qtext}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>
    <answer fraction="100" format="moodle_auto_format">
      <text>${a.number || 0}</text>
      <tolerance>${a.tolerance || 0}</tolerance>
      <feedback format="html"><text><![CDATA[${wrapP(a.feedback || '')}]]></text></feedback>
    </answer>${hintsXml}
  </question>`;
        }
        case 'shortanswer': {
            const answersXml = (c.answers || []).map(a => `
    <answer fraction="${a.fraction || 0}" format="moodle_auto_format">
      <text>${escapeXml(a.text || '')}</text>
      <feedback format="html"><text><![CDATA[${wrapP(a.feedback || '')}]]></text></feedback>
    </answer>`).join('');
            return `
  <question type="shortanswer">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${qtext}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>
    <usecase>${c.usecase || 0}</usecase>${answersXml}${hintsXml}
  </question>`;
        }
        case 'cloze': {
            return `
  <question type="cloze">
    <name><text>${name}</text></name>
    <questiontext format="html"><text><![CDATA[${c.questiontext || ''}]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[${fb}]]></text></generalfeedback>${hintsXml}
  </question>`;
        }
        default:
            return '';
    }
}

/**
 * Construit l'XML complet `questions.xml` à partir d'une bank + questions.
 */
function buildQuestionsXml(data) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>`;
    if (data.bank_name) {
        xml += `
  <question type="category">
    <category><text>$course$/top/${escapeXml(data.bank_name)}</text></category>
    <info format="moodle_auto_format"><text>${escapeXml(data.bank_description || '')}</text></info>
    <idnumber></idnumber>
  </question>`;
    }
    for (const q of (data.questions || [])) xml += buildQuestionXml(q);
    return xml + '\n</quiz>';
}

/**
 * Patch in-place : `name` dans quiz.xml + reconstruction complète de
 * questions.xml (les `<question_instances>` Moodle internes sont conservés
 * tels quels — round-trip OK pour les tests Caramel où ces IDs sont déjà
 * présents dans le XML d'origine).
 */
export function serializeFiles(data, files, activityDir) {
    const xmlPath  = `${activityDir}/quiz.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`test_missing_xml:${xmlPath}`);

    let xml = new TextDecoder('utf-8').decode(xmlBytes);
    xml = rewriteTag(xml, 'name', escapeXml(data.title || data.bank_name || ''));
    files[xmlPath] = window.fflate.strToU8(xml);

    files['questions.xml'] = window.fflate.strToU8(buildQuestionsXml(data));
}

// =========================================================================
// FORMAT STANDALONE — Moodle Question XML (root <quiz>, banque de questions)
// =========================================================================
//
// Le format standalone exporté par Caramel pour une banque de questions est
// quasi-identique au `questions.xml` interne d'un MBZ : même racine `<quiz>`,
// mêmes éléments `<question type="...">`, même structure interne par type.
// On peut donc réutiliser `parseQuestionContent` tel quel.

/**
 * Parse un XML "Banque de questions" standalone (<quiz>...) vers le JSON éditeur.
 * Shape de sortie alignée avec `parseFiles` pour l'éditeur unifié.
 *
 * @param {string} xml
 * @returns {{ title, bank_name, bank_description, options, questions }}
 */
export function parseStandaloneXml(xml) {
    const doc = parseXml(xml);
    const root = doc.documentElement;
    if (!root || root.tagName !== 'quiz') {
        throw new Error('test_standalone_invalid_root');
    }

    let bank_name = '', bank_description = '';
    const questions = [];

    for (const q of root.querySelectorAll(':scope > question')) {
        const type = q.getAttribute('type');
        if (type === 'category') {
            const cat = q.querySelector('category > text')?.textContent ?? '';
            // category ressemble à "$course$/top/Nom/Sous-catégorie" — on garde la dernière feuille
            bank_name = cat.split('/').pop() || '';
            bank_description = q.querySelector('info > text')?.textContent ?? '';
            continue;
        }
        const content = parseQuestionContent(q, type);
        if (content) questions.push({ type, content });
    }

    return {
        title: bank_name,
        bank_name,
        bank_description,
        options: {},
        questions
    };
}

/**
 * Reconstruit l'XML standalone à partir du JSON éditeur.
 * Réutilise `buildQuestionsXml` qui produit exactement le format attendu.
 *
 * @param {{ bank_name, bank_description, questions }} data
 * @returns {string}
 */
export function serializeStandaloneXml(data) {
    return buildQuestionsXml(data);
}

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
