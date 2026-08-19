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

import { escapeXml } from './moodle-formats.js';
import { TEMPLATES } from './processors/shared/templates.js';
import { buildCourseBackup } from './processors/shared/moodle-backup.js';
import { replacePlaceholders } from './processors/shared/placeholder.js';

// ownerid/createdby/modifiedby des questions. On met 0 (utilisateur « système/absent »,
// comme le userid des entrées de Glossaire) plutôt que 2 (= admin par défaut « Administrateur
// éléa ») : au restore, un id non-mappé retombe sur l'UTILISATEUR QUI RESTAURE (le prof) via le
// défaut de `get_mappingid('user', …, $restorer)` de Moodle → « Créé par <le prof> » au lieu de
// « Administrateur éléa ». (Éléa n'a pas de champ auteur en texte libre : on ne peut pas écrire
// littéralement « Caramel » sans embarquer un compte utilisateur.) À confirmer par import réel.
const QUIZ_OWNER_ID = 0;
const QUIZ_PENALTY  = '0.3333333';                // pénalité standard des questions top-level
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

/** Enveloppe en `<p>…</p>` si absent (miroir de mbz-utils.wrapP). */
function wrapPq(text) {
  const s = String(text || '');
  if (!s) return '';
  return /^\s*<p[\s>]/i.test(s) ? s : `<p>${s}</p>`;
}

/** Champ HTML (questiontext non-cloze, feedbacks, answertext QCM/match) : wrapP puis échappe. */
const htmlField  = (s) => escXmlText(wrapPq(s));
/** Champ TEXTE brut (answertext V/F/numérique/courte, questiontext cloze). */
const plainField = (s) => escXmlText(s);
/** Fraction backup : 7 décimales sur l'échelle 0-1. */
const frac7 = (x) => Number(x || 0).toFixed(7);
/** Stamp Moodle déterministe (unicité, non structurel). */
const quizStamp = (ts, seq) => `${QUIZ_HOSTNAME}+${ts}+${String(seq).padStart(6, '0')}`;

// =========================================================================
// Cloze GIFT (PUR)
// =========================================================================
//
// Sous-types cloze Moodle 4.5 : noms LONGS + abréviations officielles. L'éditeur
// n'émet que les noms longs, mais un Test IMPORTÉ d'un autre Moodle peut employer
// les abréviations — non reconnues = trou perdu → multianswer cassé au restore.
// On les capture toutes (triées longueur ↓ pour éviter qu'une abréviation courte
// ne mange un préfixe).
const CLOZE_TYPE_TOKENS = [
  'SHORTANSWER_C', 'SHORTANSWER', 'MULTICHOICE_VS', 'MULTICHOICE_HS', 'MULTICHOICE_V',
  'MULTICHOICE_H', 'MULTICHOICE_S', 'MULTICHOICE', 'MULTIRESPONSE_HS', 'MULTIRESPONSE_H',
  'MULTIRESPONSE_S', 'MULTIRESPONSE', 'NUMERICAL',
  'MCVS', 'MCHS', 'MRHS', 'MRVS', 'MCV', 'MCH', 'MCS', 'MRH', 'MRS', 'MWC', 'SAC',
  'MC', 'MR', 'MW', 'SA', 'NM',
].sort((a, b) => b.length - a.length);
const CLOZE_RE = new RegExp('\\{(\\d+):(' + CLOZE_TYPE_TOKENS.join('|') + '):([^}]+)\\}', 'g');

/** Sous-type cloze → famille de plugin. `single:false` = multiréponse (MR*). */
function clozeFamily(type) {
  const u = String(type).toUpperCase();
  if (u.startsWith('NUMERICAL') || u === 'NM') return { kind: 'numerical' };
  if (u.startsWith('MULTIRESPONSE') || u.startsWith('MR')) return { kind: 'multichoice', single: false };
  if (u.startsWith('MULTICHOICE') || u.startsWith('MC')) return { kind: 'multichoice', single: true };
  return { kind: 'shortanswer' }; // SHORTANSWER, SA, SAC, SHORTANSWER_C, MW, MWC
}

/**
 * Découpe un texte cloze en texte parent (marqueurs `{#N}`) + trous. Le parent
 * stocke `{#1}…{#N}` là où étaient les `{poids:TYPE:…}`, comme un vrai backup
 * multianswer.
 * @returns {{ parentText:string, gaps:Array<{raw,weight,type,content}> }}
 */
export function parseClozeGaps(text) {
  const src = String(text || '');
  const gaps = [];
  let parentText = '', last = 0, m, n = 0;
  const re = new RegExp(CLOZE_RE.source, 'g');
  while ((m = re.exec(src)) !== null) {
    parentText += src.slice(last, m.index) + `{#${++n}}`;
    gaps.push({ raw: m[0], weight: m[1], type: m[2], content: m[3] });
    last = m.index + m[0].length;
  }
  parentText += src.slice(last);
  return { parentText, gaps };
}

/**
 * Réponses d'un trou cloze → {text, fraction (0-1), feedback}. Sémantique Moodle
 * STANDARD : `=x`→1, `%N%x`→N/100, nu→0 ; `#fb` = feedback GIFT optionnel.
 * NUMERICAL : `=valeur:tolérance`. Fractions DÉJÀ sur 0-1.
 */
function parseGapAnswers(gap) {
  const fam = clozeFamily(gap.type);
  if (fam.kind === 'numerical') {
    const clean = String(gap.content).replace(/^=/, '');
    const [val, tol] = clean.split(':');
    return { kind: 'numerical', number: (val || '').trim(), tolerance: (tol || '0').trim() };
  }
  const answers = String(gap.content).split('~').map(tok => {
    let t = tok, fraction = 0;
    if (t.startsWith('=')) { fraction = 1; t = t.slice(1); }
    else { const pm = t.match(/^%(-?\d+(?:\.\d+)?)%/); if (pm) { fraction = parseFloat(pm[1]) / 100; t = t.slice(pm[0].length); } }
    let feedback = '';
    const h = t.indexOf('#');
    if (h >= 0) { feedback = t.slice(h + 1); t = t.slice(0, h); }
    return { text: t, fraction, feedback };
  });
  return { kind: fam.kind, single: fam.single, answers };
}

// =========================================================================
// Blocs plugin_qtype_* (indentation alignée sur la réf Éléa). Les réponses
// portent une fraction DÉJÀ sur 0-1. `alloc()` = compteur d'IDs local au quiz.
// =========================================================================

function answerXml(id, text, fraction, feedback, format /* 0 plain | 1 html */) {
  const at = format === 1 ? htmlField(text) : plainField(text);
  return `                    <answer id="${id}">
                      <answertext>${at}</answertext>
                      <answerformat>${format}</answerformat>
                      <fraction>${frac7(fraction)}</fraction>
                      <feedback>${htmlField(feedback)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>`;
}

function multichoicePlugin(c, alloc, answers /* {text,fraction0to1,feedback} */) {
  const single = String(c.single ?? 'true').trim() === 'false' ? '0' : '1';
  const ansXml = answers.map(a => answerXml(alloc(), a.text, a.fraction, a.feedback, 1)).join('\n');
  return `                <plugin_qtype_multichoice_question>
                  <answers>
${ansXml}
                  </answers>
                  <multichoice id="${alloc()}">
                    <layout>0</layout>
                    <single>${single}</single>
                    <shuffleanswers>1</shuffleanswers>
                    <correctfeedback>${htmlField(c.correctfeedback)}</correctfeedback>
                    <correctfeedbackformat>1</correctfeedbackformat>
                    <partiallycorrectfeedback>${htmlField(c.partiallycorrectfeedback)}</partiallycorrectfeedback>
                    <partiallycorrectfeedbackformat>1</partiallycorrectfeedbackformat>
                    <incorrectfeedback>${htmlField(c.incorrectfeedback)}</incorrectfeedback>
                    <incorrectfeedbackformat>1</incorrectfeedbackformat>
                    <answernumbering>none</answernumbering>
                    <shownumcorrect>1</shownumcorrect>
                    <showstandardinstruction>1</showstandardinstruction>
                  </multichoice>
                </plugin_qtype_multichoice_question>`;
}

function matchPlugin(c, alloc) {
  const matchesXml = (c.subquestions || []).map(sq => `                    <match id="${alloc()}">
                      <questiontext>${htmlField(sq.text)}</questiontext>
                      <questiontextformat>1</questiontextformat>
                      <answertext>${plainField(sq.answer)}</answertext>
                    </match>`).join('\n');
  return `                <plugin_qtype_match_question>
                  <matchoptions id="${alloc()}">
                    <shuffleanswers>1</shuffleanswers>
                    <correctfeedback>${htmlField(c.correctfeedback)}</correctfeedback>
                    <correctfeedbackformat>1</correctfeedbackformat>
                    <partiallycorrectfeedback>${htmlField(c.partiallycorrectfeedback)}</partiallycorrectfeedback>
                    <partiallycorrectfeedbackformat>1</partiallycorrectfeedbackformat>
                    <incorrectfeedback>${htmlField(c.incorrectfeedback)}</incorrectfeedback>
                    <incorrectfeedbackformat>1</incorrectfeedbackformat>
                    <shownumcorrect>1</shownumcorrect>
                  </matchoptions>
                  <matches>
${matchesXml}
                  </matches>
                </plugin_qtype_match_question>`;
}

function truefalsePlugin(c, alloc) {
  const a = c.answer || {};
  const idTrue = alloc(), idFalse = alloc();
  return `                <plugin_qtype_truefalse_question>
                  <answers>
                    <answer id="${idTrue}">
                      <answertext>Vrai</answertext>
                      <answerformat>0</answerformat>
                      <fraction>${frac7(a.value ? 1 : 0)}</fraction>
                      <feedback>${htmlField(a.feedback_true)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>
                    <answer id="${idFalse}">
                      <answertext>Faux</answertext>
                      <answerformat>0</answerformat>
                      <fraction>${frac7(a.value ? 0 : 1)}</fraction>
                      <feedback>${htmlField(a.feedback_false)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>
                  </answers>
                  <truefalse id="${alloc()}">
                    <trueanswer>${idTrue}</trueanswer>
                    <falseanswer>${idFalse}</falseanswer>
                    <showstandardinstruction>0</showstandardinstruction>
                  </truefalse>
                </plugin_qtype_truefalse_question>`;
}

function numericalPlugin(number, tolerance, feedback, alloc) {
  const ansId = alloc();
  return `                <plugin_qtype_numerical_question>
                  <answers>
                    <answer id="${ansId}">
                      <answertext>${plainField(number)}</answertext>
                      <answerformat>0</answerformat>
                      <fraction>1.0000000</fraction>
                      <feedback>${htmlField(feedback)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>
                  </answers>
                  <numerical_units>
                  </numerical_units>
                  <numerical_options>
                    <numerical_option id="${alloc()}">
                      <showunits>3</showunits>
                      <unitsleft>0</unitsleft>
                      <unitgradingtype>0</unitgradingtype>
                      <unitpenalty>0.1000000</unitpenalty>
                    </numerical_option>
                  </numerical_options>
                  <numerical_records>
                    <numerical_record id="${alloc()}">
                      <answer>${ansId}</answer>
                      <tolerance>${plainField(tolerance)}</tolerance>
                    </numerical_record>
                  </numerical_records>
                </plugin_qtype_numerical_question>`;
}

function shortanswerPlugin(answers /* {text,fraction0to1,feedback} */, usecase, alloc) {
  const ansXml = answers.map(a => answerXml(alloc(), a.text, a.fraction, a.feedback, 0)).join('\n');
  return `                <plugin_qtype_shortanswer_question>
                  <answers>
${ansXml}
                  </answers>
                  <shortanswer id="${alloc()}">
                    <usecase>${usecase ? 1 : 0}</usecase>
                  </shortanswer>
                </plugin_qtype_shortanswer_question>`;
}

/** `<question_hints>` (0 = qtype supporte shownumcorrect/clearwrong → 0, sinon NULL). */
function hintsXml(hints, hasOpts, alloc) {
  const list = Array.isArray(hints) ? hints.filter(h => h != null && String(h).length) : [];
  if (!list.length) return `                <question_hints>
                </question_hints>`;
  const nz = hasOpts ? '0' : '$@NULL@$';
  const body = list.map(h => `                  <question_hint id="${alloc()}">
                    <hint>${htmlField(typeof h === 'string' ? h : (h && h._value) || '')}</hint>
                    <hintformat>1</hintformat>
                    <shownumcorrect>${nz}</shownumcorrect>
                    <clearwrong>${nz}</clearwrong>
                    <options>$@NULL@$</options>
                  </question_hint>`).join('\n');
  return `                <question_hints>
${body}
                </question_hints>`;
}

/**
 * Enveloppe `<question_bank_entry>` (base 6 espaces) autour d'une question déjà
 * rendue en `<plugin_qtype_*>`.
 */
function questionBankEntry({ qbeId, versionId, questionId, parentId, bankCatId, name, questiontext,
  generalfeedback, defaultmark, penalty, qtype, stamp, ts, pluginXml, hints }) {
  return `      <question_bank_entry id="${qbeId}">
        <questioncategoryid>${bankCatId}</questioncategoryid>
        <idnumber>$@NULL@$</idnumber>
        <ownerid>${QUIZ_OWNER_ID}</ownerid>
        <question_version>
          <question_versions id="${versionId}">
            <version>1</version>
            <status>ready</status>
            <questions>
              <question id="${questionId}">
                <parent>${parentId}</parent>
                <name>${escXmlText(name)}</name>
                <questiontext>${questiontext}</questiontext>
                <questiontextformat>1</questiontextformat>
                <generalfeedback>${generalfeedback}</generalfeedback>
                <generalfeedbackformat>1</generalfeedbackformat>
                <defaultmark>${frac7(defaultmark)}</defaultmark>
                <penalty>${penalty}</penalty>
                <qtype>${qtype}</qtype>
                <length>1</length>
                <stamp>${stamp}</stamp>
                <timecreated>${ts}</timecreated>
                <timemodified>${ts}</timemodified>
                <createdby>${QUIZ_OWNER_ID}</createdby>
                <modifiedby>${QUIZ_OWNER_ID}</modifiedby>
${pluginXml}
                <plugin_qbank_comment_question>
                  <comments>
                  </comments>
                </plugin_qbank_comment_question>
                <plugin_qbank_customfields_question>
                  <customfields>
                  </customfields>
                </plugin_qbank_customfields_question>
${hints}
                <tags>
                </tags>
              </question>
            </questions>
          </question_versions>
        </question_version>
      </question_bank_entry>`;
}

/** Bloc plugin d'un ENFANT cloze selon son sous-type (fractions déjà 0-1). */
function clozeChildPlugin(parsed, alloc) {
  if (parsed.kind === 'numerical') return numericalPlugin(parsed.number, parsed.tolerance, '', alloc);
  if (parsed.kind === 'multichoice') {
    return multichoicePlugin({ single: parsed.single === false ? 'false' : 'true' }, alloc,
      parsed.answers.map(a => ({ text: a.text, fraction: a.fraction, feedback: a.feedback })));
  }
  return shortanswerPlugin(parsed.answers.map(a => ({ text: a.text, fraction: a.fraction, feedback: a.feedback })), 0, alloc);
}

/**
 * Transforme UNE question du modèle en 1..N `question_bank_entry` + l'info de
 * slot. Cloze → parent multianswer (answers vide, sequence=enfants) + N enfants
 * NON slottés (parent=idParent).
 * @returns {{ entries:string[], slot:{ qbeId:number, maxmark:number }|null }}
 */
export function buildQuestionEntries(modelQ, { alloc, bankCatId, ts }) {
  const type = String(modelQ.type || '');
  const c = modelQ.content || {};
  const name = c.name || '';

  // Cloze (multianswer) : parent + enfants -----------------------------------
  if (type === 'cloze') {
    const { parentText, gaps } = parseClozeGaps(c.questiontext);
    const parentQbe = alloc(), parentVer = alloc(), parentQid = alloc();
    const childIds = [], childEntries = [];
    // defaultmark d'un multianswer = SOMME des poids GIFT des trous (Moodle 4.5 lit
    // ces valeurs verbatim au restore) ; chaque enfant porte SON poids. Cas éditeur
    // = tous poids 1 → somme == nb de trous.
    let totalWeight = 0;
    for (const gap of gaps) {
      const parsed = parseGapAnswers(gap);
      const weight = parseInt(gap.weight, 10) || 1;
      totalWeight += weight;
      const cQbe = alloc(), cVer = alloc(), cQid = alloc();
      childIds.push(cQid);
      const plugin = clozeChildPlugin(parsed, alloc);
      const childQtype = parsed.kind === 'numerical' ? 'numerical'
        : parsed.kind === 'multichoice' ? 'multichoice' : 'shortanswer';
      childEntries.push(questionBankEntry({
        qbeId: cQbe, versionId: cVer, questionId: cQid, parentId: parentQid, bankCatId,
        name, questiontext: plainField(gap.raw), generalfeedback: '', defaultmark: weight, penalty: '0.0000000',
        qtype: childQtype, stamp: quizStamp(ts, cQbe), ts, pluginXml: plugin,
        hints: hintsXml([], false, alloc),
      }));
    }
    const parentMark = totalWeight || 1;
    const parentPlugin = `                <plugin_qtype_multianswer_question>
                  <answers>
                  </answers>
                  <multianswer id="${alloc()}">
                    <question>${parentQid}</question>
                    <sequence>${childIds.join(',')}</sequence>
                  </multianswer>
                </plugin_qtype_multianswer_question>`;
    const parentEntry = questionBankEntry({
      qbeId: parentQbe, versionId: parentVer, questionId: parentQid, parentId: 0, bankCatId,
      name, questiontext: plainField(parentText), generalfeedback: htmlField(c.feedback),
      defaultmark: parentMark, penalty: QUIZ_PENALTY, qtype: 'multianswer',
      stamp: quizStamp(ts, parentQbe), ts, pluginXml: parentPlugin,
      hints: hintsXml(c.hints, false, alloc),
    });
    return { entries: [parentEntry, ...childEntries], slot: { qbeId: parentQbe, maxmark: parentMark } };
  }

  // Types simples ------------------------------------------------------------
  const qbeId = alloc(), versionId = alloc(), questionId = alloc();
  let pluginXml, qtype, hasOpts = false;
  if (type === 'multichoice') {
    qtype = 'multichoice'; hasOpts = true;
    pluginXml = multichoicePlugin(c, alloc,
      (c.answers || []).map(a => ({ text: a.text, fraction: (a.fraction || 0) / 100, feedback: a.feedback })));
  } else if (type === 'matching') {
    qtype = 'match'; hasOpts = true;
    pluginXml = matchPlugin(c, alloc);
  } else if (type === 'truefalse') {
    qtype = 'truefalse';
    pluginXml = truefalsePlugin(c, alloc);
  } else if (type === 'numerical') {
    qtype = 'numerical';
    const a = c.answer || {};
    pluginXml = numericalPlugin(a.number, a.tolerance, a.feedback, alloc);
  } else if (type === 'shortanswer') {
    qtype = 'shortanswer';
    pluginXml = shortanswerPlugin(
      (c.answers || []).map(a => ({ text: a.text, fraction: (a.fraction || 0) / 100, feedback: a.feedback })),
      c.usecase, alloc);
  } else {
    return { entries: [], slot: null };   // type inconnu → ignoré (jamais slotté)
  }
  const entry = questionBankEntry({
    qbeId, versionId, questionId, parentId: 0, bankCatId, name,
    questiontext: htmlField(c.questiontext), generalfeedback: htmlField(c.feedback),
    defaultmark: 1, penalty: QUIZ_PENALTY, qtype, stamp: quizStamp(ts, qbeId), ts,
    pluginXml, hints: hintsXml(c.hints, hasOpts, alloc),
  });
  return { entries: [entry], slot: { qbeId, maxmark: 1 } };
}

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
  let seq = QUIZ_ID_BASE;
  const alloc = () => {
    const id = seq++;
    if (seq - QUIZ_ID_BASE >= QUIZ_ID_STRIDE) throw new Error('quiz_id_overflow');
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
    const { entries, slot } = buildQuestionEntries(q, { alloc, bankCatId, ts });
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
