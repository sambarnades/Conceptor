import { readFileSync } from 'fs';

const locales = ['de','nl','pt','ar','zh','jp','el'];
const keysToCheck = [
  'prompt_accordion_structure_json',
  'prompt_elea_appariement_structure_json',
  'prompt_elea_qcm_structure_json',
  'prompt_elea_glossaire_structure_json',
  'prompt_multiple_choice_structure_json',
];

for (const lang of locales) {
  const json = JSON.parse(readFileSync(`js/locales/${lang}.json`, 'utf8'));
  for (const k of keysToCheck) {
    const val = json[k];
    if (!val) continue;
    const idx = val.indexOf('(2^3)^2');
    if (idx >= 0) {
      const short = k.replace('prompt_','').replace('_structure_json','');
      console.log(`=== ${lang}:${short} ===`);
      console.log(JSON.stringify(val.slice(Math.max(0,idx-120), idx+50)));
      console.log();
    }
    // Check if enrichLatexFeedback worked (for multiple_choice)
    if (k === 'prompt_multiple_choice_structure_json' && !val.includes('frac{1}{2}')) {
      const short = k.replace('prompt_','').replace('_structure_json','');
      console.log(`=== ${lang}:${short} MISSING LATEX EXAMPLES ===`);
      console.log('Last 200:', JSON.stringify(val.slice(-200)));
      console.log();
    }
  }
}
