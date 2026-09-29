/**
 * run_langue_contenu.mjs — La langue de ce que Caramel fait écrire au modèle (D87 du PRD
 * parcours), et les jetons de « Série de choix uniques ».
 *
 * 1. RÈGLE COMMUNE (`prompt_regles_pedagogiques_communes`) : dans les 11 locales hors
 *    breton, la règle de langue n'est plus l'ancienne formule ambiguë (« rédige dans la
 *    langue cible… »), qui laissait un cours d'anglais sortir en français ; elle porte
 *    l'exception des langues vivantes (repère commun aux 11 langues : le cadre européen,
 *    CECRL / CEFR / MCER…). Le breton garde sa règle « tout en breton », voulue.
 * 2. Elle ARRIVE dans les prompts réels : Page, Livre, quiz (buildActivityPrompt).
 * 3. PARCOURS : le prompt du plan et celui d'un module de la plateforme portent la même
 *    exception (`regleLangue`).
 * 4. SÉRIE DE CHOIX UNIQUES : la bibliothèque attend `:num` / `:total` ; les 12 locales
 *    écrivaient `@slide` / `@total`, et le lecteur d'écran annonçait « Diapositive @slide
 *    sur @total ». Contre-épreuve : une traduction aux anciens jetons est réparée.
 *
 * Le COMPORTEMENT du modèle (une Page d'anglais sort en anglais) ne se teste qu'avec le
 * vrai modèle : mesures du 29 sept. 2026 dans D87. Ce banc garde ce qui les a permises.
 *
 * Lancement :  node tests/run_langue_contenu.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const { installIdentitySanitizer } = await import('./roundtrip/bootstrap.mjs');
// Sans DOMPurify en Node, le nettoyeur échappe tout et le dit à chaque appel : celui du banc roundtrip.
await installIdentitySanitizer();

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const locale = l => JSON.parse(readFileSync(resolve(root, `js/locales/${l}.json`), 'utf8'));
const { translations } = await import('../js/core/translation.js');
const charger = l => {
    for (const k of Object.keys(translations)) delete translations[k];
    Object.assign(translations, locale('en'), l === 'br' ? locale('fr') : {}, locale(l));
};

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + String(detail).slice(0, 300) : ''}`); }
}

// ------------------------------------------------------------------ 1. la règle commune
const ANCIENNES = {
    fr: 'rédige dans la langue cible (français sauf indication contraire)',
    en: 'write in the target language (English unless otherwise specified)',
    es: 'redacta en la lengua meta',
    de: 'Verfasse den Text in der Zielsprache',
    it: 'scrivi nella lingua di destinazione',
    nl: 'schrijf in de doeltaal',
    pt: 'redige na língua-alvo',
    ar: 'حرّر بلغة الهدف',
    zh: '用目标语言撰写',
    jp: '対象言語で記述すること',
    el: 'σύνταξε στη γλώσσα-στόχο',
};
const CADRE_EUROPEEN = /CECRL|CEFR|MCER|GER|QCER|ERK|QECR|الإطار الأوروبي|欧洲语言共同参考框架|ΚΕΠΑ/;
for (const [l, ancienne] of Object.entries(ANCIENNES)) {
    const regle = locale(l).prompt_regles_pedagogiques_communes;
    ok(`${l} : l’ancienne règle ambiguë a disparu`, !regle.includes(ancienne));
    ok(`${l} : l’exception des langues vivantes est là`, CADRE_EUROPEEN.test(regle));
}
ok('br : la règle « tout en breton » est gardée', /BREZHONEG/.test(locale('br').prompt_regles_pedagogiques_communes));

// ------------------------------------------------------------------ 2. dans les prompts réels
charger('fr');
const { buildActivityPrompt } = await import('../js/services/prompt-generator.js');
const demande = { qui: 'Professeur d’anglais en lycée', quoi: 'Identités et échanges : le voyage aux États-Unis', niveau: 'Seconde', isAdvanced: true, nombreQuestions: '' };
for (const prefixe of ['prompt_elea_page', 'prompt_elea_livre', 'prompt_quizset_qcm']) {
    const prompt = buildActivityPrompt(prefixe, demande);
    ok(`${prefixe} : le prompt porte l’exception des langues vivantes`, prompt.includes('Exception, les langues vivantes') && prompt.includes('même quand le thème est culturel'));
}

// ------------------------------------------------------------------ 3. le parcours
const { construirePromptPlan, construirePromptModuleParcours } = await import('../js/parcours/scenario-prompt.js');
const EXCEPTION_PARCOURS = 'sauf pour une séquence de langue vivante';
try {
    const { prompt } = construirePromptPlan({ platform: 'elea', format: 'distanciel', contexte: { qui: demande.qui, quoi: demande.quoi } });
    ok('parcours : le prompt du plan porte l’exception', prompt.includes(EXCEPTION_PARCOURS));
    ok('parcours : plus de « Rédige TOUS les textes en … » sans exception', !/Rédige TOUS les textes en \w+\.\n/.test(prompt));
} catch (e) { ok('parcours : le prompt du plan se construit', false, e.stack || e.message); }
try {
    const draft = { platform: 'elea', format: 'distanciel', contexte: { qui: demande.qui, quoi: demande.quoi }, plan: { titre: 'Identities', etapes: [] } };
    const { prompt } = construirePromptModuleParcours(draft, { module: 'parcours_forum', titre: 'Débat', consigne: '', objectifs: [] });
    ok('parcours : le prompt d’un module de la plateforme porte l’exception', prompt.includes(EXCEPTION_PARCOURS));
} catch (e) { ok('parcours : le prompt d’un module se construit', false, e.stack || e.message); }

// ------------------------------------------------------------------ 4. Série de choix uniques
const { default: singleChoiceSet } = await import('../js/h5p/processors/SingleChoiceSet.js');
const source = { choices: [{ question: 'Q ?', answers: ['bonne', 'fausse'] }] };
const libelles = () => {
    const sortie = singleChoiceSet.process(structuredClone(source));
    return (sortie.content || sortie).l10n || {};
};
for (const l of ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br']) {
    charger(l);
    const { slideOfTotal = '', solutionListQuestionNumber = '' } = libelles();
    ok(`${l} : « diapositive x sur y » aux jetons de la bibliothèque`, slideOfTotal.includes(':num') && slideOfTotal.includes(':total') && !slideOfTotal.includes('@'), slideOfTotal);
    ok(`${l} : « question x » aux jetons de la bibliothèque`, solutionListQuestionNumber.includes(':num') && !solutionListQuestionNumber.includes('@'), solutionListQuestionNumber);
}
// Contre-épreuve : une traduction restée aux anciens jetons est réparée par le processeur.
charger('fr');
translations.h5p_single_choice_slide_of_total = 'Diapositive @slide sur @total';
translations.h5p_single_choice_solution_list_question_number = 'Question @question';
const repare = libelles();
ok('contre-épreuve : anciens jetons réparés (@slide/@total)', repare.slideOfTotal === 'Diapositive :num sur :total', repare.slideOfTotal);
ok('contre-épreuve : anciens jetons réparés (@question)', repare.solutionListQuestionNumber === 'Question :num', repare.solutionListQuestionNumber);

console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`langue du contenu et jetons : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
