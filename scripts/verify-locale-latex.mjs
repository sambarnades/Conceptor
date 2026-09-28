import { readFileSync } from 'fs';

const json = JSON.parse(readFileSync('js/locales/fr.json', 'utf8'));
const en = JSON.parse(readFileSync('js/locales/en.json', 'utf8'));
const de = JSON.parse(readFileSync('js/locales/de.json', 'utf8'));

const checks = [
  ['accordion', 'prompt_accordion_structure_json', ['frac{1}{2}', 'α, β, √'], ['(2^3)^2']],
  ['chart', 'prompt_chart_structure_json', ['α, β, π'], []],
  ['multiple_choice', 'prompt_multiple_choice_structure_json', ['frac{1}{2}', 'tipsAndFeedback'], ['(2^3)^2']],
  // Mots croisés : « lettres alphabétiques » est devenu « lettres de la langue cible, accents
  // conservés » (grilles accentuées et non latines) ; l'interdiction du LaTeX dans `answer` demeure.
  ['crossword', 'prompt_crossword_structure_json', ['frac{1}{2}', 'Aucun espace, symbole mathématique ou LaTeX'], []],
  ['drag_the_words', 'prompt_drag_the_words_structure_json', ['DragTheWords', 'Unicode'], []],
  ['essay', 'prompt_essay_structure_json', ['frac{1}{2}', 'texte brut'], []],
  ['flashcards', 'prompt_flashcards_structure_json', ['frac{1}{2}', 'texte brut'], []],
  ['elea_glossaire', 'prompt_elea_glossaire_structure_json', ['α, β, √', 'texte brut'], ['(2^3)^2']],
  ['elea_millionnaire', 'prompt_elea_millionnaire_structure_json', ['α, β, √', 'INTERDIT'], ['(2^3)^2']],
  ['summary', 'prompt_summary_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['timeline', 'prompt_timeline_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['true_false', 'prompt_true_false_structure_json', ['frac{1}{2}', 'tipsAndFeedback'], []],
  ['quizset', 'prompt_quizset_structure_json', ['frac{1}{2}', 'tipsAndFeedback'], []],
  ['find_the_words', 'prompt_find_the_words_structure_json', ['FindTheWords'], []],
  // Texte à trous : la règle ne cite plus la bibliothèque (6.3.0) — maths des trous en Unicode.
  ['fill_blanks', 'prompt_fill_in_the_blanks_structure_json', ['Maths dans les trous', 'Unicode'], []],
  ['mark_words', 'prompt_mark_the_words_structure_json', ['MarkTheWords'], []],
  ['dialog_cards', 'prompt_dialog_cards_structure_json', ['frac{1}{2}'], []],
  ['drag_and_drop', 'prompt_drag_and_drop_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['elea_devoir', 'prompt_elea_devoir_structure_json', ['α, β'], []],
  ['elea_qcm', 'prompt_elea_qcm_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['elea_appariement', 'prompt_elea_appariement_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['single_choice', 'prompt_single_choice_set_structure_json', ['frac{1}{2}'], ['(2^3)^2']],
  ['sort_paragraphs', 'prompt_sort_the_paragraphs_structure_json', ['frac{1}{2}'], ['(2^3)^2']]
];

console.log('=== FR.JSON ===');
let pass = 0, fail = 0;
for (const [name, key, mustHave, mustNotHave] of checks) {
  const val = json[key];
  if (!val) { console.log('SKIP ' + name + ': key not found'); continue; }
  const missing = mustHave.filter(s => !val.includes(s));
  const unwanted = mustNotHave.filter(s => val.includes(s));
  if (missing.length || unwanted.length) {
    console.log('FAIL ' + name + ':' + (missing.length ? ' missing=[' + missing.join(', ') + ']' : '') + (unwanted.length ? ' unwanted=[' + unwanted.join(', ') + ']' : ''));
    fail++;
  } else {
    console.log('OK   ' + name);
    pass++;
  }
}
console.log('\nFR Result: ' + pass + ' pass, ' + fail + ' fail');

// Vérifier EN et DE pour quelques clés
console.log('\n=== EN.JSON (échantillon) ===');
const enChecks = [
  ['en:accordion', 'prompt_accordion_structure_json', ['frac{1}{2}', 'MUST NOT'], ['(2^3)^2']],
  ['en:multiple_choice', 'prompt_multiple_choice_structure_json', ['frac{1}{2}', 'tipsAndFeedback'], ['(2^3)^2']],
  ['en:essay', 'prompt_essay_structure_json', ['frac{1}{2}', 'plain text'], []],
  ['en:glossaire', 'prompt_elea_glossaire_structure_json', ['α, β', 'plain text'], ['(2^3)^2']],
  ['en:millionnaire', 'prompt_elea_millionnaire_structure_json', ['α, β', 'FORBIDDEN'], ['(2^3)^2']],
];
for (const [name, key, mustHave, mustNotHave] of enChecks) {
  const val = en[key];
  if (!val) { console.log('SKIP ' + name); continue; }
  const missing = mustHave.filter(s => !val.includes(s));
  const unwanted = mustNotHave.filter(s => val.includes(s));
  if (missing.length || unwanted.length) {
    console.log('FAIL ' + name + ':' + (missing.length ? ' missing=[' + missing.join(', ') + ']' : '') + (unwanted.length ? ' unwanted=[' + unwanted.join(', ') + ']' : ''));
  } else {
    console.log('OK   ' + name);
  }
}

console.log('\n=== DE.JSON (échantillon) ===');
const deChecks = [
  ['de:accordion', 'prompt_accordion_structure_json', ['frac{1}{2}', 'DÜRFEN KEIN'], ['(2^3)^2']],
  ['de:multiple_choice', 'prompt_multiple_choice_structure_json', ['frac{1}{2}', 'tipsAndFeedback'], []],
  ['de:essay', 'prompt_essay_structure_json', ['frac{1}{2}', 'reiner Text'], []],
];
for (const [name, key, mustHave, mustNotHave] of deChecks) {
  const val = de[key];
  if (!val) { console.log('SKIP ' + name); continue; }
  const missing = mustHave.filter(s => !val.includes(s));
  const unwanted = mustNotHave.filter(s => val.includes(s));
  if (missing.length || unwanted.length) {
    console.log('FAIL ' + name + ':' + (missing.length ? ' missing=[' + missing.join(', ') + ']' : '') + (unwanted.length ? ' unwanted=[' + unwanted.join(', ') + ']' : ''));
  } else {
    console.log('OK   ' + name);
  }
}
