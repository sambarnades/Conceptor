/**
 * mbz-quiz-backup.mjs — Oracle headless du générateur BACKUP d'un Test (mod_quiz).
 *
 * Épingle le portage (depuis Sucrerie, validé par import Éléa 4.5 réel) du format
 * BACKUP restaurable : `questions.xml` racine `<question_categories>` + wiring
 * `quiz.xml` (slot → questionbankentryid) + inforef 5 catégories. Contrôle :
 *   1. bonne formation XML (`xmllint --noout`) des 3 fichiers ;
 *   2. cohérences internes (slot↔qbe, sequence↔enfants, enfant.parent↔parent,
 *      trueanswer/falseanswer↔answer, numerical_record.answer↔answer,
 *      inforef↔catégories, qbe.questioncategoryid↔bank, usingcontextid↔module) ;
 *   3. fractions IMPORT 0-100 → BACKUP 0-1 à 7 décimales ;
 *   4. cloze : defaultmark = Σ poids GIFT, abréviations (NM/MCH/SA) reconnues,
 *      enfants NON slottés ;
 *   5. échappement d'élément XML (`& < >` seulement) + wrapP conditionnel ;
 *   6. réglages du Test (`quiz_settings`, D86) : défauts = Test créé sur Éléa (séquence
 *      et valeurs des balises de la référence sept-2026), Test « réglé », masques de
 *      relecture, pages des slots, feedback global, achèvement/carnet du Test seul, et
 *      parité octet pour octet du bloc de réglages entre Test seul et Test de parcours.
 *
 * Node pur (aucun DOM ; le parseur BACKUP de Sucrerie/Caramel exige un DOM et est
 * donc validé côté navigateur + import réel). Lancer :
 *   node tests/roundtrip/mbz-quiz-backup.mjs
 *
 * @module tests/roundtrip/mbz-quiz-backup
 */
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const { buildQuizBackup, assembleTestBackupFiles } = await import(join(REPO, 'js/moodle/mbz-quiz-backup.js'));

let passed = 0, failed = 0;
const fails = [];
function ok(cond, label, detail) {
  if (cond) { passed++; }
  else { failed++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}
const ids = (re, s) => { const out = []; let m; const r = new RegExp(re, 'g'); while ((m = r.exec(s)) !== null) out.push(m[1]); return out; };

// --- Modèle CANONIQUE d'échantillon (fractions 0-100, comme generateMoodleXml) ---
const ctx = {
  courseId: 1234, courseContextId: 55555, courseShortname: 'test-xyz',
  moduleId: 98765, activityId: 321, activityContextId: 55557, gradeItemId: 4321,
  title: 'Mon Test',
};
const TS = 1700000000;
const model = {
  bank_name: 'Banque & <démo>', bank_description: 'Desc "avec" \'apostrophes\'',
  questions: [
    { type: 'multichoice', content: {
      name: 'Q01', questiontext: 'Choix ? A & <b>', single: 'true',
      answers: [{ text: 'Bonne & <i>', fraction: 100, feedback: 'oui' }, { text: 'Mauvaise', fraction: 0, feedback: 'non' }],
      correctfeedback: 'Bravo', incorrectfeedback: 'Dommage', hints: ['un indice'],
    } },
    { type: 'multichoice', content: {  // multi-réponses : test des fractions 50/33.33333/16.66667/0
      name: 'Q02', questiontext: 'Plusieurs bonnes', single: 'false',
      answers: [
        { text: 'a', fraction: 50 }, { text: 'b', fraction: 33.33333 },
        { text: 'c', fraction: 16.66667 }, { text: 'd', fraction: 0 },
      ],
    } },
    { type: 'matching', content: {
      name: 'Q03', questiontext: 'Associez', subquestions: [{ text: 'Chat', answer: 'Miaou' }, { text: 'Chien', answer: 'Ouaf' }],
    } },
    { type: 'truefalse', content: {
      name: 'Q04', questiontext: 'Vrai ou faux ?', answer: { value: true, feedback_true: 'exact', feedback_false: 'faux' },
    } },
    { type: 'numerical', content: {
      name: 'Q05', questiontext: 'Valeur de pi ?', answer: { number: '3.14', tolerance: '0.01', feedback: 'pi' },
    } },
    { type: 'shortanswer', content: {
      name: 'Q06', questiontext: 'Capitale de la France ?', usecase: 1,
      answers: [{ text: 'Paris', fraction: 100 }, { text: 'paris', fraction: 50 }],
    } },
    { type: 'cloze', content: {  // poids 1+2+1+3 = 7 ; noms longs + abréviations NM/MCH/SA
      name: 'Q07', feedback: 'feedback cloze',
      questiontext: 'Le {1:SHORTANSWER:=chat} pèse {2:NM:=5:0.1} kg, choix {1:MCH:=a~b}, réponse {3:SA:=z}.',
    } },
  ],
};

const r = buildQuizBackup(model, ctx, TS);
const { questionsXml, quizXml, inforefXml, sumgrades, categoryIds } = r;

// --- 1. xmllint --------------------------------------------------------------
console.log('=== 1. Bonne formation XML (xmllint) ===');
const dir = mkdtempSync(join(tmpdir(), 'mbz-quiz-'));
for (const [name, xml] of [['questions.xml', questionsXml], ['quiz.xml', quizXml], ['inforef.xml', inforefXml]]) {
  const p = join(dir, name);
  writeFileSync(p, xml);
  try { execFileSync('xmllint', ['--noout', p], { stdio: ['ignore', 'ignore', 'pipe'] }); ok(true, `${name} bien formé`); }
  catch (e) { ok(false, `${name} bien formé`, String(e.stderr || e)); }
}

// --- 2. Cohérences internes --------------------------------------------------
console.log('=== 2. Cohérences internes ===');
const qbeIds = ids('<question_bank_entry id="(\\d+)">', questionsXml);
const slotQbe = ids('<questionbankentryid>(\\d+)</questionbankentryid>', quizXml);
// 7 questions top-level (6 simples + 1 cloze parente) → 7 slots. Les 4 enfants
// cloze sont des qbe NON slottés → 11 qbe au total, 7 slots.
ok(qbeIds.length === 11, '11 question_bank_entry (7 top-level + 4 enfants cloze)', `qbe=${qbeIds.length}`);
ok(slotQbe.length === 7, '7 slots (cloze parente slottée, enfants non slottés)', `slots=${slotQbe.length}`);
ok(slotQbe.every(id => qbeIds.includes(id)), 'chaque slot pointe une question_bank_entry existante');
ok(new Set(slotQbe).size === 7, 'slots distincts');

// question id → parent
const qParent = {};
{ let m; const re = /<question id="(\d+)">\s*<parent>(\d+)<\/parent>/g; while ((m = re.exec(questionsXml)) !== null) qParent[m[1]] = m[2]; }
// multianswer parent + sequence
const ma = questionsXml.match(/<multianswer id="\d+">\s*<question>(\d+)<\/question>\s*<sequence>([\d,]*)<\/sequence>/);
ok(!!ma, 'bloc multianswer présent (cloze)');
if (ma) {
  const parentQid = ma[1];
  const childQids = ma[2].split(',').filter(Boolean);
  ok(childQids.length === 4, 'sequence = 4 enfants cloze', `n=${childQids.length}`);
  ok(childQids.every(cid => qParent[cid] === parentQid), 'chaque enfant.parent == id de la question parente');
  // enfants NON slottés : leur qbe ne doit pas apparaître dans les slots
  // (on vérifie via le fait que les slots == nb de questions top-level = 6)
  ok(childQids.every(cid => qParent[cid] !== '0'), 'enfants cloze ont parent ≠ 0');
}

// truefalse : trueanswer/falseanswer ∈ answer ids du bloc
const tfBlock = (quizXml + questionsXml).match(/<plugin_qtype_truefalse_question>[\s\S]*?<\/plugin_qtype_truefalse_question>/);
ok(!!tfBlock, 'bloc truefalse présent');
if (tfBlock) {
  const b = tfBlock[0];
  const ans = ids('<answer id="(\\d+)">', b);
  const trueA = (b.match(/<trueanswer>(\d+)<\/trueanswer>/) || [])[1];
  const falseA = (b.match(/<falseanswer>(\d+)<\/falseanswer>/) || [])[1];
  ok(ans.includes(trueA) && ans.includes(falseA), 'trueanswer/falseanswer ∈ answer ids');
  ok(/<answertext>Vrai<\/answertext>/.test(b) && /<answertext>Faux<\/answertext>/.test(b), 'answertext = Vrai/Faux (plein, sans <p>)');
}

// numerical : numerical_record.answer == answer id du bloc
const numBlock = questionsXml.match(/<plugin_qtype_numerical_question>[\s\S]*?<\/plugin_qtype_numerical_question>/);
ok(!!numBlock, 'bloc numerical présent');
if (numBlock) {
  const b = numBlock[0];
  const ansId = (b.match(/<answer id="(\d+)">/) || [])[1];
  const recAns = (b.match(/<numerical_record id="\d+">\s*<answer>(\d+)<\/answer>/) || [])[1];
  ok(ansId === recAns, 'numerical_record.answer == answer id');
}

// inforef == les 5 catégories ; qbe.questioncategoryid == bank ; usingcontextid == module ctx
const inforefCats = ids('<question_category>\\s*<id>(\\d+)</id>', inforefXml).sort();
const expectCats = Object.values(categoryIds).map(String).sort();
ok(JSON.stringify(inforefCats) === JSON.stringify(expectCats), 'inforef liste exactement les 5 catégories', `${inforefCats} vs ${expectCats}`);
const bankRefs = ids('<questioncategoryid>(\\d+)</questioncategoryid>', questionsXml);
ok(bankRefs.every(id => id === String(categoryIds.bank)), 'toutes les qbe pointent la catégorie bank');
ok(new RegExp(`<usingcontextid>${ctx.activityContextId}</usingcontextid>`).test(quizXml), 'question_reference.usingcontextid == contexte module');
ok(new RegExp(`<contextinstanceid>${ctx.courseId}</contextinstanceid>`).test(questionsXml), 'catégories cours : contextinstanceid == courseId');
ok(new RegExp(`<contextinstanceid>${ctx.moduleId}</contextinstanceid>`).test(questionsXml), 'catégories module : contextinstanceid == moduleId');

// --- 3. Fractions 0-100 → 0-1 (7 déc.) --------------------------------------
console.log('=== 3. Fractions 0-100 → 0-1 (7 décimales) ===');
ok(questionsXml.includes('<fraction>1.0000000</fraction>'), '100 → 1.0000000');
ok(questionsXml.includes('<fraction>0.5000000</fraction>'), '50 → 0.5000000');
ok(questionsXml.includes('<fraction>0.3333333</fraction>'), '33.33333 → 0.3333333');
ok(questionsXml.includes('<fraction>0.1666667</fraction>'), '16.66667 → 0.1666667');
ok(questionsXml.includes('<fraction>0.0000000</fraction>'), '0 → 0.0000000');

// --- 4. Cloze : poids, abréviations, sumgrades ------------------------------
console.log('=== 4. Cloze (poids GIFT, abréviations) ===');
ok(questionsXml.includes('<defaultmark>7.0000000</defaultmark>'), 'defaultmark cloze == Σ poids GIFT (1+2+1+3=7)');
// abréviations : les 4 trous (SHORTANSWER long + NM/MCH/SA abrégés) doivent tous
// être reconnus → questiontext PARENT = {#1}..{#4} SANS aucun GIFT brut résiduel.
const parentQid = ma ? ma[1] : '';
const parentText = parentQid
  ? (questionsXml.match(new RegExp(`<question id="${parentQid}">[\\s\\S]*?<questiontext>([\\s\\S]*?)</questiontext>`)) || [])[1] || ''
  : '';
ok(/\{#1\}[\s\S]*\{#2\}[\s\S]*\{#3\}[\s\S]*\{#4\}/.test(parentText), 'parent cloze : marqueurs {#1}..{#4}');
ok(parentText !== '' && !/\{\d+:[A-Za-z]/.test(parentText), 'aucun GIFT brut résiduel dans le parent (toutes abréviations consommées)');
// enfants : un numerical (NM), un multichoice (MCH), deux shortanswer (SHORTANSWER, SA)
ok((questionsXml.match(/<qtype>shortanswer<\/qtype>/g) || []).length >= 2 + 1, 'enfants shortanswer (SA/SHORTANSWER) + Q06');
ok((questionsXml.match(/<qtype>numerical<\/qtype>/g) || []).length >= 2, 'enfant numerical (NM) + Q05');
// sumgrades = 6 simples (dont cloze=7) ... calcul : Q01..Q06 = 1 chacun (6) + cloze 7 = 13
ok(Math.abs(sumgrades - (6 + 7)) < 1e-9, 'sumgrades == Σ maxmark (6 simples + cloze 7 = 13)', `sumgrades=${sumgrades}`);
ok(quizXml.includes(`<sumgrades>${(6 + 7).toFixed(5)}</sumgrades>`), 'quiz.xml sumgrades = 13.00000');

// --- 5. Échappement + wrapP -------------------------------------------------
console.log('=== 5. Échappement (& < >) + wrapP ===');
ok(questionsXml.includes('&amp;') && questionsXml.includes('&lt;b&gt;'), '& → &amp; ; <b> → &lt;b&gt;');
ok(questionsXml.includes('"avec"') && questionsXml.includes("'apostrophes'"), "\" et ' restent littéraux (élément XML)");
ok(/<answertext>&lt;p&gt;Bonne &amp; &lt;i&gt;&lt;\/p&gt;<\/answertext>/.test(questionsXml), 'answertext QCM wrapP <p> + échappé');
ok(/<questiontext>&lt;p&gt;Choix \? A &amp; &lt;b&gt;&lt;\/p&gt;<\/questiontext>/.test(questionsXml), 'questiontext non-cloze wrapP <p> + échappé');
ok(/<answertext>3\.14<\/answertext>/.test(questionsXml), 'answertext numérique PLAIN (sans <p>)');

// --- 6. Assemblage COMPLET mono-activité (patron Page) : xmllint tous fichiers ---
console.log('=== 6. Assemblage complet mono-activité (xmllint tous XML) ===');
const base = {
  ACTIVITY_TITLE: 'Mon Test & <démo>', COURSE_FULLNAME: 'Mon Test & <démo>', COURSE_SHORTNAME: 'test-abc123',
  COURSE_ID: 1234, MODULE_ID: 98765, SECTION_ID: 4567, ACTIVITY_ID: 321,
  COURSE_CONTEXTID: 55555, ACTIVITY_CONTEXTID: 55557, TIMESTAMP: TS, BACKUP_DATE: TS,
  CATEGORY_ID: 234, COURSE_ITEM_ID: 3456, GRADE_ITEM_ID: 4321,
};
const backupTitle = 'Mon Test & <démo>';   // titre avec caractères à échapper dans le wrapper
const files = assembleTestBackupFiles(model, base, backupTitle, TS);
let nXml = 0;
for (const [path, content] of Object.entries(files)) {
  if (!path.endsWith('.xml')) continue;
  nXml++;
  const p = join(dir, path.replace(/\//g, '__'));
  writeFileSync(p, content);
  try { execFileSync('xmllint', ['--noout', p], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) { ok(false, `xmllint ${path}`, String(e.stderr || e).split('\n')[0]); }
}
ok(nXml >= 20, `≥20 fichiers XML validés xmllint`, `n=${nXml}`);
ok(files['questions.xml'].includes('<question_categories>'), 'questions.xml racine = format BACKUP <question_categories>');
ok(/<name>questionbank<\/name>\s*<value>1<\/value>/.test(files['moodle_backup.xml']), 'moodle_backup.xml : questionbank=1');
ok(!Object.keys(files).some(p => /^activities\/quiz_\d+\/comments\.xml$/.test(p)), 'PAS de comments.xml côté quiz');
ok(files[`activities/quiz_${base.MODULE_ID}/module.xml`].includes('version="2024100700"'), 'module.xml quiz : version 2024100700');
// Wrapper : escapeXml (moodle-formats) échappe & < > ET numérise le non-ASCII (é→&#233;),
// comme Page. On vérifie l'échappement structurel (& <) et l'absence de <démo> brut.
ok(files['moodle_backup.xml'].includes('Mon Test &amp; &lt;') && !/<title>[^<]*<démo>/.test(files['moodle_backup.xml']),
  'titre échappé dans moodle_backup.xml (& < > échappés)');
ok(Object.keys(files).includes(`activities/quiz_${base.MODULE_ID}/inforef.xml`), 'inforef.xml quiz présent (5 cats + grade_item)');

// --- 7. Canonicalisation PURE du modèle (canonicalizeTestModel, sans DOM) -----
console.log('=== 7. Canonicalisation du modèle (pré-BACKUP, sans DOM) ===');
const { canonicalizeTestModel } = await import(join(REPO, 'js/moodle/moodle-formats.js'));
const rawModel = {
  bank_name: 'B', bank_description: 'D',
  questions: [
    { type: 'truefalse', content: { name: 'T', questiontext: 'x', answer: { value: 'false' } } }, // string "false" TRUTHY en JS
    { type: 'multichoice', content: { name: 'M', questiontext: 'y', single: 'true', answers: [{ text: 'a', fraction: 50 }, { text: 'b', fraction: 50 }] } },
    { type: 'numerical', content: { name: 'N', questiontext: 'z', answer: { number: '0,83', tolerance: '±0.5' } } },
  ],
};
const canon = canonicalizeTestModel(rawModel);
ok(canon.questions[0].content.answer.value === false, 'truefalse "false" (chaîne) → booléen false (piège corrigé)');
ok(canon.questions[1].content.answers.filter(a => a.fraction === 100).length === 1, 'multichoice single → exactement 1 réponse à 100');
ok(canon.questions[2].content.answer.number === '0.83', 'numérique « 0,83 » → « 0.83 » (virgule→point)');
ok(canon.bank_name === 'B' && canon.bank_description === 'D', 'bank_name/description préservés');
const feedbackIACanon = canonicalizeTestModel({ ...rawModel, overallfeedback: [
  { from: 0, to: 25, feedback: 'Reprends la chronologie.' },
  { from: 26, to: 50, feedback: 'Repère les causes et les conséquences.' },
  { from: 51, to: 75, feedback: 'Consolide les notions encore hésitantes.' },
  { from: 76, to: 100, feedback: 'Tu maîtrises les repères essentiels.' },
] });
ok(feedbackIACanon.quiz_settings?.overallfeedback?.length === 4
  && !('overallfeedback' in feedbackIACanon) && !('overallFeedback' in feedbackIACanon),
  'feedback global IA : replié dans quiz_settings, sans doublon à la racine');
const feedbackIAXml = buildQuizBackup(feedbackIACanon, ctx, TS).quizXml;
ok((feedbackIAXml.match(/<feedbacktext>[^<]+<\/feedbacktext>/g) || []).length === 4
  && feedbackIAXml.includes('Reprends la chronologie.'),
  'feedback global IA : les quatre messages atteignent quiz.xml');
// BACKUP depuis le modèle canonicalisé : réponse correcte = Faux (value=false) → Faux fraction 1, Vrai 0.
const canonBackup = buildQuizBackup(canon, ctx, TS);
const tf = (canonBackup.questionsXml.match(/<plugin_qtype_truefalse_question>[\s\S]*?<\/plugin_qtype_truefalse_question>/) || [''])[0];
ok(/<answertext>Vrai<\/answertext>\s*<answerformat>0<\/answerformat>\s*<fraction>0\.0000000<\/fraction>/.test(tf), 'value=false → Vrai fraction 0');
ok(/<answertext>Faux<\/answertext>\s*<answerformat>0<\/answerformat>\s*<fraction>1\.0000000<\/fraction>/.test(tf), 'value=false → Faux fraction 1 (bonne réponse)');

// --- 8. Réglages du Test (`quiz_settings`, D86 du PRD parcours) ----------------
console.log('=== 8. Réglages du Test (quiz_settings) ===');
const { readFileSync } = await import('node:fs');
const {
  buildQuizActivityFiles, resoudreReglagesTest, masquesRevue, presetDeRevue, REGLAGES_TEST_DEFAUT,
} = await import(join(REPO, 'js/moodle/mbz-course-builder.js'));
const REF_ELEA = readFileSync(join(REPO, 'tests/fixtures/moodle-reference/sept-2026/elea/quiz.xml'), 'utf8');
/** Enfants directs de `<quiz>` (indentation 4), dans l'ordre. */
const enfantsQuiz = (xml) => [...xml.slice(xml.indexOf('<quiz id='), xml.lastIndexOf('</quiz>'))
  .matchAll(/^ {4}<([a-z_0-9]+)[ >/]/gm)].map(m => m[1]);
const valeur = (xml, tag) => (xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`)) || [])[1];
const pages = (xml) => [...xml.matchAll(/<page>(\d+)<\/page>/g)].map(m => Number(m[1]));
const REVUES = ['attempt', 'correctness', 'maxmarks', 'marks', 'specificfeedback', 'generalfeedback', 'rightanswer', 'overallfeedback'];

// 8a. Défauts (aucune clé) = un Test créé sur Éléa, balise pour balise.
const defaut = buildQuizBackup(model, ctx, TS).quizXml;
ok(JSON.stringify(enfantsQuiz(defaut)) === JSON.stringify(enfantsQuiz(REF_ELEA)),
  'quiz.xml : mêmes balises, dans le même ordre, que la référence Éléa (précreateattempts compris)',
  `${enfantsQuiz(defaut).length} vs ${enfantsQuiz(REF_ELEA).length}`);
for (const tag of ['timeopen', 'timeclose', 'timelimit', 'overduehandling', 'graceperiod', 'preferredbehaviour',
  'canredoquestions', 'attempts_number', 'attemptonlast', 'grademethod', 'decimalpoints', 'questiondecimalpoints',
  ...REVUES.map(c => `review${c}`), 'navmethod', 'shuffleanswers', 'grade', 'browsersecurity', 'precreateattempts']) {
  ok(valeur(defaut, tag) === valeur(REF_ELEA, tag), `défaut : <${tag}> = Éléa (${valeur(REF_ELEA, tag)})`, `obtenu ${valeur(defaut, tag)}`);
}
ok(valeur(defaut, 'questionsperpage') === '0', 'défaut : questionsperpage = 0 (toutes les questions sur une page, comme les slots)');
ok(pages(defaut).length === 7 && pages(defaut).every(p => p === 1), 'défaut : les 7 slots en page 1');
ok(/<feedbacks>\s*<feedback id="\d+">\s*<feedbacktext><\/feedbacktext>[\s\S]*?<mingrade>0\.00000<\/mingrade>\s*<maxgrade>11\.00000<\/maxgrade>\s*<\/feedback>\s*<\/feedbacks>/.test(defaut),
  'défaut : une plage de feedback vide 0 → 11, comme Éléa');
ok(buildQuizBackup({ ...model, quiz_settings: {} }, ctx, TS).quizXml === defaut, 'quiz_settings vide = défauts (octet pour octet)');
ok(buildQuizBackup({ ...model, quiz_settings: { preferredbehaviour: 'bidon', attempts: -3, grademethod: 9, questionsperpage: 'x', navmethod: 1, review: 'rien', timelimit_minutes: -5 } }, ctx, TS).quizXml === defaut,
  'valeurs hors domaine → défauts (rien d\'invalide n\'atteint le XML)');

// 8b. Test « réglé » : interactif, 2 tentatives, séquentiel, 1 question par page, note seule.
const REGLE = { preferredbehaviour: 'interactive', attempts: 2, navmethod: 'sequential', questionsperpage: 1, review: 'marks' };
const regle = buildQuizBackup({ ...model, quiz_settings: REGLE }, ctx, TS).quizXml;
const attendu = {
  preferredbehaviour: 'interactive', attempts_number: '2', grademethod: '1', navmethod: 'sequential', questionsperpage: '1',
  reviewattempt: '65536', reviewcorrectness: '65536', reviewmaxmarks: '69904', reviewmarks: '69904',
  reviewspecificfeedback: '65536', reviewgeneralfeedback: '65536', reviewrightanswer: '0', reviewoverallfeedback: '4368',
  graceperiod: '86400', timelimit: '0', shuffleanswers: '1',
};
for (const [tag, v] of Object.entries(attendu)) ok(valeur(regle, tag) === v, `réglé : <${tag}> = ${v}`, `obtenu ${valeur(regle, tag)}`);
ok(JSON.stringify(pages(regle)) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]), 'réglé : une question par page → pages 1..7', pages(regle).join(','));
ok(JSON.stringify(enfantsQuiz(regle)) === JSON.stringify(enfantsQuiz(REF_ELEA)), 'réglé : séquence de balises inchangée');
const deux = buildQuizBackup({ ...model, quiz_settings: { questionsperpage: 2 } }, ctx, TS).quizXml;
ok(JSON.stringify(pages(deux)) === JSON.stringify([1, 1, 2, 2, 3, 3, 4]), 'deux questions par page → pages 1,1,2,2,3,3,4', pages(deux).join(','));
const autres = buildQuizBackup({ ...model, quiz_settings: { timelimit_minutes: 20, grademethod: 4, shuffleanswers: 0, preferredbehaviour: 'immediatefeedback' } }, ctx, TS).quizXml;
ok(valeur(autres, 'timelimit') === '1200' && valeur(autres, 'grademethod') === '4' && valeur(autres, 'shuffleanswers') === '0'
  && valeur(autres, 'preferredbehaviour') === 'immediatefeedback', 'temps limite 20 min → 1200 s ; dernière tentative ; sans mélange ; immédiat');
// En interactif/immédiat, les retours ont le bit « pendant » : sinon « Vérifier » n'affiche rien.
ok(['correctness', 'marks', 'specificfeedback', 'generalfeedback'].every(c => Number(valeur(autres, `review${c}`)) & 0x10000),
  'immédiat : correction, points et retours visibles PENDANT la tentative');
ok(Number(valeur(autres, 'reviewoverallfeedback')) === 4368, 'le feedback global n\'est jamais « pendant » (Moodle ne le permet pas)');
// Préréglage « note et retours » en différé : tout sauf la bonne réponse.
const mf = masquesRevue('deferredfeedback', 'marks_feedback');
ok(mf.rightanswer === 0 && ['attempt', 'correctness', 'maxmarks', 'marks', 'specificfeedback', 'generalfeedback'].every(c => mf[c] === 69904) && mf.overallfeedback === 4368,
  '« note et retours » : tout comme Éléa, sauf la bonne réponse');
ok(presetDeRevue('interactive', masquesRevue('interactive', 'marks')) === 'marks' && presetDeRevue('deferredfeedback', { ...mf, rightanswer: 16 }) === 'custom',
  'relecture : un préréglage se reconnaît, des masques inconnus restent « custom »');
ok(buildQuizBackup({ ...model, quiz_settings: { review: 'custom', review_masks: { ...mf, rightanswer: 16 } } }, ctx, TS).quizXml.includes('<reviewrightanswer>16</reviewrightanswer>'),
  'masques « custom » (Test importé) réécrits tels quels');

// 8c. Feedback global par plage de note (échelle de <grade>, la plus haute plage monte à 11).
const fb = buildQuizBackup({ ...model, quiz_settings: { overallfeedback: [
  { from: 0, to: 49, feedback: 'À revoir' }, { from: 50, to: 79, feedback: 'Bien' }, { from: 80, to: 100, feedback: 'Très bien & <b>' }] } }, ctx, TS).quizXml;
const plages = [...fb.matchAll(/<feedbacktext>([^<]*)<\/feedbacktext>\s*<feedbacktextformat>1<\/feedbacktextformat>\s*<mingrade>([\d.]+)<\/mingrade>\s*<maxgrade>([\d.]+)<\/maxgrade>/g)]
  .map(m => `${m[2]}-${m[3]}:${m[1]}`);
ok(JSON.stringify(plages) === JSON.stringify([
  '8.00000-11.00000:&lt;p&gt;Très bien &amp; &lt;b&gt;&lt;/p&gt;', '5.00000-8.00000:&lt;p&gt;Bien&lt;/p&gt;', '0.00000-5.00000:&lt;p&gt;À revoir&lt;/p&gt;']),
  'feedback global : trois plages sur la note (0-5, 5-8, 8-11), texte échappé', plages.join(' | '));
ok(buildQuizBackup({ ...model, quiz_settings: { overallfeedback: [{ from: 0, to: 50, feedback: '' }, { from: 51, to: 100, feedback: ' ' }] } }, ctx, TS).quizXml === defaut,
  'feedback global sans texte (les deux tranches vides de l\'éditeur) = défaut');
for (const [nom, xml] of [['réglé', regle], ['feedback global', fb]]) {
  const p = join(dir, `quiz-${nom.replace(/\W+/g, '-')}.xml`);
  writeFileSync(p, xml);
  try { execFileSync('xmllint', ['--noout', p], { stdio: ['ignore', 'ignore', 'pipe'] }); ok(true, `quiz.xml ${nom} bien formé`); }
  catch (e) { ok(false, `quiz.xml ${nom} bien formé`, String(e.stderr || e)); }
}

// 8d. Test seul : achèvement et carnet cohérents avec Éléa.
const moduleXml = files[`activities/quiz_${base.MODULE_ID}/module.xml`];
const gradesXml = files[`activities/quiz_${base.MODULE_ID}/grades.xml`];
ok(valeur(moduleXml, 'completion') === '2' && valeur(moduleXml, 'completiongradeitemnumber') === '0',
  'Test seul : achèvement « note reçue » (completiongradeitemnumber 0, comme Éléa)');
ok(valeur(gradesXml, 'grademax') === valeur(files[`activities/quiz_${base.MODULE_ID}/quiz.xml`], 'grade'),
  'Test seul : grademax du carnet = <grade> du quiz (10)', `${valeur(gradesXml, 'grademax')}`);
const refModule = readFileSync(join(REPO, 'tests/fixtures/moodle-reference/sept-2026/elea/quiz.module.xml'), 'utf8');
const refGrades = readFileSync(join(REPO, 'tests/fixtures/moodle-reference/sept-2026/elea/quiz.grades.xml'), 'utf8');
ok(valeur(moduleXml, 'completiongradeitemnumber') === valeur(refModule, 'completiongradeitemnumber')
  && valeur(gradesXml, 'grademax') === valeur(refGrades, 'grademax'), 'Test seul : mêmes valeurs que les fichiers relevés sur Éléa');
const filesRegles = assembleTestBackupFiles({ ...model, quiz_settings: REGLE }, base, backupTitle, TS);
ok(pages(filesRegles[`activities/quiz_${base.MODULE_ID}/quiz.xml`]).at(-1) === 7, 'Test seul assemblé : les réglages atteignent le quiz.xml du .mbz');

// 8e. Parité Test seul / Test de parcours : mêmes réglages → mêmes balises.
const reglagesDe = (xml) => xml.slice(xml.indexOf('<timeopen>'), xml.indexOf('<subplugin_quizaccess_seb_quiz>'));
for (const [nom, s] of [['défauts', undefined], ['réglé', REGLE]]) {
  const parcours = buildQuizActivityFiles({ kind: 'quiz', model: { ...model, quiz_settings: s }, title: 'Mon Test' }, { index: 0, sectionId: 800001, timestamp: TS });
  const qx = Object.entries(parcours.files).find(([p]) => p.endsWith('/quiz.xml'))[1];
  const seul = buildQuizBackup({ ...model, quiz_settings: s }, ctx, TS).quizXml;
  ok(reglagesDe(qx) === reglagesDe(seul) && JSON.stringify(pages(qx)) === JSON.stringify(pages(seul)),
    `parité ${nom} : le Test de parcours écrit les mêmes réglages et les mêmes pages que le Test seul`);
}
ok(JSON.stringify(Object.keys(resoudreReglagesTest(undefined)).filter(k => k in REGLAGES_TEST_DEFAUT)) === JSON.stringify(Object.keys(REGLAGES_TEST_DEFAUT)),
  'resoudreReglagesTest : toutes les clés par défaut présentes');

// --- Bilan ------------------------------------------------------------------
console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} OK, ${failed} KO`);
if (failed) { for (const f of fails) console.log(`   - ${f.label}${f.detail ? ': ' + f.detail : ''}`); process.exit(1); }
