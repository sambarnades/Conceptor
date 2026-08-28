import { readFileSync } from 'fs';

const locales = ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br'];
const keys = [
  'prompt_accordion_structure_json',
  'prompt_multiple_choice_structure_json',
  'prompt_true_false_structure_json',
  'prompt_quizset_structure_json',
  'prompt_quizset_qcm_structure_json',
  'prompt_quizset_vf_structure_json',
  'prompt_course_presentation_structure_json',
  'prompt_timeline_structure_json',
  'prompt_single_choice_set_structure_json',
  'prompt_sort_the_paragraphs_structure_json',
  'prompt_summary_structure_json',
  'prompt_dialog_cards_structure_json',
  'prompt_drag_and_drop_structure_json',
  'prompt_elea_appariement_structure_json',
  'prompt_elea_qcm_structure_json',
  'prompt_essay_structure_json',
  'prompt_flashcards_structure_json',
  'prompt_chart_structure_json',
  'prompt_crossword_structure_json',
  'prompt_drag_the_words_structure_json',
  'prompt_fill_in_the_blanks_structure_json',
  'prompt_mark_the_words_structure_json',
  'prompt_find_the_words_structure_json',
  'prompt_elea_devoir_structure_json',
  'prompt_elea_glossaire_structure_json',
  'prompt_elea_millionnaire_structure_json',
  'prompt_image_hotspots_structure_json',
];

// Full LaTeX (frac{1}{2}) — activités avec support LaTeX complet dans les contenus
const fullLatexKeys = new Set(keys.filter(k =>
  !k.includes('chart') && !k.includes('find_the_words') &&
  !k.includes('millionnaire') && !k.includes('glossaire') && !k.includes('devoir') &&
  !k.includes('drag_the_words') && !k.includes('fill_in_the_blanks') && !k.includes('mark_the_words')
));

// Partial LaTeX — LaTeX dans taskDescription seulement, pas de frac{1}{2} dans les exemples,
// mais mention du composant spécifique
const partialLatexKeys = new Set(keys.filter(k =>
  k.includes('drag_the_words') || k.includes('fill_in_the_blanks') || k.includes('mark_the_words')
));

// Unicode only — pas de LaTeX, caractères Unicode pour maths
const unicodeKeys = new Set(keys.filter(k =>
  k.includes('chart') || k.includes('millionnaire') || k.includes('glossaire') || k.includes('devoir')
));

// Plain text only — ni LaTeX ni Unicode maths
const plainKeys = new Set(keys.filter(k => k.includes('find_the_words')));

// Crossword — LaTeX pour clues + letters-only answers (SHORT_EX)
const crosswordKeys = new Set(keys.filter(k => k.includes('crossword')));

for (const lang of locales) {
  const json = JSON.parse(readFileSync(`js/locales/${lang}.json`, 'utf8'));
  const issues = [];
  for (const k of keys) {
    const short = k.replace('prompt_','').replace('_structure_json','');
    if (!json[k]) { issues.push(short + '[MISSING]'); continue; }
    const val = json[k];

    // Vérif: pas de vieux pattern (2^3)^2
    if (val.includes('(2^3)^2')) issues.push(short + '[old-pattern]');

    // Full LaTeX : doit avoir frac{1}{2}
    if (fullLatexKeys.has(k) && !val.includes('frac{1}{2}')) issues.push(short + '[no-latex-ex]');

    // Partial LaTeX : doit mentionner le composant ou "Unicode"
    if (partialLatexKeys.has(k)) {
      const hasComponentRef = val.includes('DragTheWords') || val.includes('FillInTheBlanks') ||
        val.includes('MarkTheWords') || val.includes('Unicode') || val.includes('taskDescription');
      if (!hasComponentRef) issues.push(short + '[no-component-ref]');
    }

    // Crossword : doit avoir frac{1}{2} ET mention alphabétique/letters
    if (crosswordKeys.has(k)) {
      if (!val.includes('frac{1}{2}') && !val.includes('A-Z')) issues.push(short + '[no-crossword-constraint]');
    }

    // Unicode : doit avoir α
    if (unicodeKeys.has(k) && !val.includes('α')) issues.push(short + '[no-unicode]');

    // Plain : doit mentionner FindTheWords ou "texte brut" / "plain text"
    if (plainKeys.has(k)) {
      if (!val.includes('FindTheWords') && !val.includes('plain text') && !val.includes('texte brut') && !val.includes('نص') && !val.includes('纯文本'))
        issues.push(short + '[no-plain-constraint]');
    }
  }
  const total = keys.filter(k => json[k]).length;
  console.log(`${lang}: ${issues.length === 0 ? `ALL OK (${total}/${keys.length})` : issues.length + ' issues: ' + issues.join(', ')}`);
}
