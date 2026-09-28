/** Banque native Test partagée ; le wrapper du cours appartient à l'hôte. */
import { buildQuestionEntries as buildSharedQuestionEntries, parseClozeGaps } from './mbz-course-builder.js';
export { parseClozeGaps };
// ownerid/createdby/modifiedby des questions. On met 0 (utilisateur « système/absent »,
// comme le userid des entrées de Glossaire) plutôt que 2 (= admin par défaut « Administrateur
// éléa ») : au restore, un id non-mappé retombe sur l'UTILISATEUR QUI RESTAURE (le prof) via le
// défaut de `get_mappingid('user', …, $restorer)` de Moodle → « Créé par <le prof> » au lieu de
// « Administrateur éléa ». (Éléa n'a pas de champ auteur en texte libre : on ne peut pas écrire
// littéralement « Caramel » sans embarquer un compte utilisateur.) À confirmer par import réel.
const QUIZ_HOSTNAME = 'caramel.forge.apps.education.fr';
const QUIZ_MODULE_VERSION = '2024100700';         // version du module quiz Moodle 4.5

// IDs internes de banque : plage HAUTE disjointe des IDs cours/module Caramel.
const QUIZ_ID_BASE   = 2000000;
const QUIZ_ID_STRIDE = 1000000;                   // garde-fou (banque irréaliste au-delà)

// =========================================================================
// Helpers (PURS)
// =========================================================================

/** Échappe le TEXTE d'un élément XML : uniquement `& < >` (byte-fidèle à la réf
 *  Éléa qui laisse `'"` littéraux). Le HTML interne devient donc `&lt;p&gt;…`. */
export function escXmlText(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/** Même contrat de questions pour un Test seul et pour un parcours. */
export function buildQuestionEntries(question, context) {
  return buildSharedQuestionEntries(question, { ...context, hostname: QUIZ_HOSTNAME });
}
const frac7 = (x) => Number(x || 0).toFixed(7);
const quizStamp = (ts, seq) => `${QUIZ_HOSTNAME}+${ts}+${String(seq).padStart(6, '0')}`;

/** Une `<question_category>` (base 2 espaces). `entries` = XML des qbe (ou ''). */
function questionCategoryXml({ id, name, contextid, contextlevel, contextinstanceid, info, stamp, parent, sortorder, entries }) {
  const body = entries && entries.length
    ? `\n${entries}\n    `
    : `\n    `;
  return `  <question_category id="${id}">
    <name>${escXmlText(name)}</name>
    <contextid>${contextid}</contextid>
    <contextlevel>${contextlevel}</contextlevel>
    <contextinstanceid>${contextinstanceid}</contextinstanceid>
    <info>${escXmlText(info)}</info>
    <infoformat>0</infoformat>
    <stamp>${stamp}</stamp>
    <parent>${parent}</parent>
    <sortorder>${sortorder}</sortorder>
    <idnumber>$@NULL@$</idnumber>
    <question_bank_entries>${body}</question_bank_entries>
  </question_category>`;
}

// =========================================================================
// Assemblage mono-activité (PUR)
// =========================================================================

/**
 * Construit les fichiers BACKUP-spécifiques d'un Test mono-activité :
 * `questions.xml` racine + `quiz.xml` (avec wiring) + `inforef.xml` (5 catégories
 * + grade_item). Les fichiers de « carcasse » (module.xml, grades.xml, roles,
 * calendar, filters) et le wrapper cours (moodle_backup, course/*, sections/*)
 * sont fournis par l'hôte via les TEMPLATES Caramel + buildCourseBackup.
 *
 * @param {{ bank_name?:string, bank_description?:string, questions:Array<{type,content}> }} model
 *        (modèle CANONIQUE = même donnée que `generateMoodleXml`, fractions 0-100)
 * @param {Object} ctx - IDs alloués par l'hôte (generateBaseData) :
 *   { courseId, courseContextId, courseShortname, moduleId, activityId,
 *     activityContextId, gradeItemId, title }
 * @param {number} ts - epoch (s), injecté (déterminisme testable)
 * @returns {{
 *   questionsXml:string, quizXml:string, inforefXml:string,
 *   sumgrades:number,
 *   categoryIds:{ topCourse, defCourse, bank, moduleTop, moduleDef }
 * }}
 */
export function buildQuizBackup(model, ctx, ts) {
  const {
    courseId, courseContextId, courseShortname,
    moduleId, activityId, activityContextId, gradeItemId, title,
  } = ctx;

  const bankName = String((model && model.bank_name) || title || 'Test').trim() || 'Test';
  const bankDescription = String((model && model.bank_description) || '');
  const questions = Array.isArray(model && model.questions) ? model.questions : [];

  // Allocateur d'IDs local au quiz (plage haute disjointe ; garde-fou stride).
  const idBase = ctx.idBase ?? QUIZ_ID_BASE;
  let seq = idBase;
  const alloc = () => {
    const id = seq++;
    if (seq - idBase >= QUIZ_ID_STRIDE) throw new Error('quiz_id_overflow');
    return id;
  };

  // Catégories : top/Défaut (contexte cours, partagées) + bank (contexte cours)
  // + top/Défaut (contexte module).
  const topCourseCatId = alloc();
  const defCourseCatId = alloc();
  const bankCatId      = alloc();
  const moduleTopCatId = alloc();
  const moduleDefCatId = alloc();

  // Génération des questions → qbe + slots (enfants cloze non slottés).
  const qbeBlocks = [];
  const slots = [];
  for (const q of questions) {
    const { entries, slot } = buildQuestionEntries(q, { alloc, bankCatId, ts, options: model.options });
    qbeBlocks.push(...entries);
    if (slot) slots.push(slot);
  }

  const topCourseCat = questionCategoryXml({
    id: topCourseCatId, name: 'top', contextid: courseContextId, contextlevel: 50,
    contextinstanceid: courseId, info: '', stamp: quizStamp(ts, topCourseCatId), parent: 0, sortorder: 0, entries: '',
  });
  const defCourseCat = questionCategoryXml({
    id: defCourseCatId, name: `Défaut pour ${courseShortname}`, contextid: courseContextId, contextlevel: 50,
    contextinstanceid: courseId,
    info: `La catégorie par défaut pour les questions partagées dans le contexte « ${courseShortname} ».`,
    stamp: quizStamp(ts, defCourseCatId), parent: topCourseCatId, sortorder: 999, entries: '',
  });
  const bankCat = questionCategoryXml({
    id: bankCatId, name: bankName, contextid: courseContextId, contextlevel: 50,
    contextinstanceid: courseId, info: bankDescription, stamp: quizStamp(ts, bankCatId),
    parent: topCourseCatId, sortorder: 999, entries: qbeBlocks.join('\n'),
  });
  const moduleTopCat = questionCategoryXml({
    id: moduleTopCatId, name: 'top', contextid: activityContextId, contextlevel: 70,
    contextinstanceid: moduleId, info: '', stamp: quizStamp(ts, moduleTopCatId), parent: 0, sortorder: 0, entries: '',
  });
  const moduleDefCat = questionCategoryXml({
    id: moduleDefCatId, name: `Défaut pour ${title}`, contextid: activityContextId, contextlevel: 70,
    contextinstanceid: moduleId,
    info: `La catégorie par défaut pour les questions partagées dans le contexte « ${title} ».`,
    stamp: quizStamp(ts, moduleDefCatId), parent: moduleTopCatId, sortorder: 999, entries: '',
  });

  const questionsXml = `<?xml version="1.0" encoding="UTF-8"?>
<question_categories>
${[topCourseCat, defCourseCat, bankCat, moduleTopCat, moduleDefCat].join('\n')}
</question_categories>`;

  // quiz.xml : wiring des slots (slot → questionbankentryid). Les enfants cloze
  // NE sont PAS slottés (seul le parent multianswer l'est).
  const sumgrades = slots.reduce((s, sl) => s + sl.maxmark, 0);
  const instancesXml = slots.map((sl, i) => `      <question_instance id="${alloc()}">
        <quizid>${activityId}</quizid>
        <slot>${i + 1}</slot>
        <page>1</page>
        <displaynumber>$@NULL@$</displaynumber>
        <requireprevious>0</requireprevious>
        <maxmark>${frac7(sl.maxmark)}</maxmark>
        <quizgradeitemid>$@NULL@$</quizgradeitemid>
        <question_reference id="${alloc()}">
          <usingcontextid>${activityContextId}</usingcontextid>
          <component>mod_quiz</component>
          <questionarea>slot</questionarea>
          <questionbankentryid>${sl.qbeId}</questionbankentryid>
          <version>$@NULL@$</version>
        </question_reference>
      </question_instance>`).join('\n');

  const quizXml = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="${activityId}" moduleid="${moduleId}" modulename="quiz" contextid="${activityContextId}">
  <quiz id="${activityId}">
    <name>${escXmlText(title)}</name>
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
    <sumgrades>${sumgrades.toFixed(5)}</sumgrades>
    <grade>10.00000</grade>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
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
${instancesXml}
    </question_instances>
    <sections>
      <section id="${alloc()}">
        <firstslot>1</firstslot>
        <heading></heading>
        <shufflequestions>0</shufflequestions>
      </section>
    </sections>
    <feedbacks>
      <feedback id="${alloc()}">
        <feedbacktext></feedbacktext>
        <feedbacktextformat>1</feedbacktextformat>
        <mingrade>0.00000</mingrade>
        <maxgrade>11.00000</maxgrade>
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

  // inforef.xml : les 5 catégories + le grade_item du quiz.
  const inforefXml = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <grade_itemref>
    <grade_item>
      <id>${gradeItemId}</id>
    </grade_item>
  </grade_itemref>
  <question_categoryref>
    <question_category>
      <id>${topCourseCatId}</id>
    </question_category>
    <question_category>
      <id>${defCourseCatId}</id>
    </question_category>
    <question_category>
      <id>${bankCatId}</id>
    </question_category>
    <question_category>
      <id>${moduleTopCatId}</id>
    </question_category>
    <question_category>
      <id>${moduleDefCatId}</id>
    </question_category>
  </question_categoryref>
</inforef>`;

  return {
    questionsXml, quizXml, inforefXml, sumgrades,
    categoryIds: {
      topCourse: topCourseCatId, defCourse: defCourseCatId, bank: bankCatId,
      moduleTop: moduleTopCatId, moduleDef: moduleDefCatId,
    },
  };
}
