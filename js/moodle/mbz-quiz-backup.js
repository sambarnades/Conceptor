/**
 * @file Générateur du format BACKUP d'un Test (mod_quiz) — banque de questions
 * restaurable + wiring du quiz. PUR (aucun `window`/DOM → testable en Node).
 *
 * ── Import vs Backup ────────────────────────────────────────────────────────
 * Le `.xml` du Test (racine `<quiz>`, `generateMoodleXml` de moodle-formats.js)
 * est un fichier d'IMPORT de banque de questions : parfait pour « Importer des
 * questions », mais ce n'est PAS ce qu'attend une RESTAURATION de cours/activité.
 * Une restauration lit le format BACKUP : `questions.xml` racine en
 * `<question_categories>` → `question_bank_entry` → `question_version` →
 * `question` (+ un bloc `plugin_qtype_*` par type), et `quiz.xml` câble chaque
 * slot via `<questionbankentryid>` (PAS l'id de question).
 *
 * Ce module RÉGÉNÈRE ce format BACKUP depuis le MÊME modèle éditeur que le `.xml` :
 *   { bank_name, bank_description, questions:[{ type, content }] }
 *   type ∈ multichoice | matching | truefalse | numerical | shortanswer | cloze
 *
 * Portage FIDÈLE du générateur validé par import Éléa 4.5 réel (2026-07-13) du
 * dépôt frère Sucrerie (`assets/js/moodle/mbz-course-builder.js`, section « Test
 * (mod_quiz) — banque de questions au format BACKUP »). Différence : on prend les
 * IDs de cours/module en paramètre (`ctx`) au lieu du schéma multi-activités fixe
 * de Sucrerie, car Caramel exporte un backup MONO-activité (patron : processeur
 * Page). Les IDs internes de banque sont dans une plage HAUTE disjointe (base
 * 2 000 000) — sans collision avec les IDs cours/module Caramel (≤ 99 999) ; ils
 * sont de toute façon remappés au restore : seules comptent les COHÉRENCES
 * INTERNES (slot↔qbe, sequence↔enfants, trueanswer↔answer, inforef↔catégories).
 *
 * PIÈGES (chacun a coûté un bug côté Sucrerie) :
 *  1. fraction IMPORT 0-100 (attribut) → BACKUP 0-1 (élément 7 déc.) : ÷100.
 *  2. cloze defaultmark/maxmark = SOMME des poids GIFT (pas le nb de trous).
 *  3. abréviations GIFT (SA/MC/NM/MR/MCH/MCV…) toutes reconnues (trié longueur ↓).
 *  4. échappement d'élément XML = `& < >` seulement ; wrapP sur questiontext
 *     non-cloze/feedbacks/answertext QCM+match ; PAS de wrapP sur answertext
 *     V-F/num/courte ni questiontext cloze.
 *  5. truefalse answertext = `Vrai`/`Faux`.
 *  6. cloze GIFT : `=x`→1, `%N%x`→N/100, réponse nue→0.
 *  7. `questionbank=1` dans moodle_backup.xml (posé par buildCourseBackup) ; PAS
 *     de comments.xml côté quiz.
 */

import { buildQuizBackup } from './test-backup-builder.js';
export { buildQuizBackup, buildQuestionEntries, escXmlText, parseClozeGaps } from './test-backup-builder.js';
import { escapeXml } from './moodle-formats.js';
import { TEMPLATES } from './processors/shared/templates.js';
import { buildCourseBackup } from './processors/shared/moodle-backup.js';
import { replacePlaceholders } from './processors/shared/placeholder.js';
const QUIZ_MODULE_VERSION = '2024100700';

/**
 * Assemble la map COMPLÈTE des fichiers d'un backup cours MONO-activité pour un
 * Test (mod_quiz), au format BACKUP restaurable. Patron : processeur Page
 * (buildCourseBackup + TEMPLATES). `buildCourseBackup` pose déjà `questionbank=1`.
 * PAS de comments.xml côté quiz (conforme réf Éléa). PURE (aucun `window`/DOM) →
 * l'oracle valide chaque XML par xmllint sans navigateur.
 *
 * @param {{ bank_name?, bank_description?, questions:Array }} canonical - modèle
 *        CANONIQUE (même donnée que generateMoodleXml, fractions 0-100)
 * @param {Object} base - IDs (générés par MoodleProcessors.generateBaseData) :
 *        COURSE_ID, MODULE_ID, SECTION_ID, ACTIVITY_ID, COURSE_CONTEXTID,
 *        ACTIVITY_CONTEXTID, TIMESTAMP, BACKUP_DATE, CATEGORY_ID, COURSE_ITEM_ID,
 *        GRADE_ITEM_ID, COURSE_SHORTNAME
 * @param {string} title - Titre de l'activité (brut)
 * @param {number} ts - epoch (s)
 * @returns {Object<string,string>} map { chemin: contenu }
 */
export function assembleTestBackupFiles(canonical, base, title, ts) {
  const quizBackup = buildQuizBackup(canonical, {
    courseId: base.COURSE_ID,
    courseContextId: base.COURSE_CONTEXTID,
    courseShortname: base.COURSE_SHORTNAME,
    moduleId: base.MODULE_ID,
    activityId: base.ACTIVITY_ID,
    activityContextId: base.ACTIVITY_CONTEXTID,
    gradeItemId: base.GRADE_ITEM_ID,
    title,
  }, ts);

  const activityDir = `activities/quiz_${base.MODULE_ID}`;
  const sectionDir = `sections/section_${base.SECTION_ID}`;
  const extended = {
    ...base,
    // Les templates passent par replacePlaceholders (substitution brute) → titre échappé XML.
    ACTIVITY_TITLE: escapeXml(title),
    COURSE_FULLNAME: escapeXml(title),
    ENROL_MANUAL_ID: 10000 + Math.floor(Math.random() * 90000),
    ENROL_GUEST_ID: 10000 + Math.floor(Math.random() * 90000),
    ENROL_SELF_ID: 10000 + Math.floor(Math.random() * 90000),
  };

  const files = {};
  // Fichiers racine (patron Page)
  files['moodle_backup.xml'] = buildCourseBackup(extended, 'quiz');   // questionbank=1 déjà posé
  files['files.xml'] = TEMPLATES.FILES_XML;
  files['roles.xml'] = TEMPLATES.ROLES_XML;
  files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
  files['scales.xml'] = TEMPLATES.SCALES_XML;
  files['gradebook.xml'] = replacePlaceholders(TEMPLATES.GRADEBOOK_XML, extended);
  files['groups.xml'] = TEMPLATES.GROUPS_XML;
  files['questions.xml'] = quizBackup.questionsXml;   // BACKUP (remplace le stub vide)
  files['completion.xml'] = TEMPLATES.COMPLETION_XML;
  // Fichiers course/
  files['course/course.xml'] = replacePlaceholders(TEMPLATES.COURSE_XML, extended);
  files['course/enrolments.xml'] = replacePlaceholders(TEMPLATES.COURSE_ENROLMENTS_XML, extended);
  files['course/inforef.xml'] = TEMPLATES.COURSE_INFOREF_XML;
  files['course/roles.xml'] = TEMPLATES.ACTIVITY_ROLES_XML;
  files['course/completiondefaults.xml'] = TEMPLATES.COURSE_COMPLETIONDEFAULTS_XML;
  files['course/contentbank.xml'] = TEMPLATES.COURSE_CONTENTBANK_XML;
  files['course/calendar.xml'] = TEMPLATES.ACTIVITY_CALENDAR_XML;
  files['course/filters.xml'] = TEMPLATES.ACTIVITY_FILTERS_XML;
  // Fichiers sections/
  files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SECTION_XML, extended);
  files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;
  // Fichiers de l'activité quiz (PAS de comments.xml — conforme réf Éléa)
  files[`${activityDir}/quiz.xml`] = quizBackup.quizXml;
  files[`${activityDir}/inforef.xml`] = quizBackup.inforefXml;   // 5 catégories + grade_item
  files[`${activityDir}/module.xml`] = replacePlaceholders(TEMPLATES.getModuleXml('quiz', QUIZ_MODULE_VERSION), extended);
  files[`${activityDir}/grades.xml`] = replacePlaceholders(TEMPLATES.getActivityGradesXml('quiz'), extended);
  files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
  files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
  files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;
  return files;
}

export const QUIZ_BACKUP_CONSTANTS = { QUIZ_MODULE_VERSION };
