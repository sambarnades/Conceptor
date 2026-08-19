/**
 * latex-display-wrap.mjs — Garde-fou d'autoWrapLatex (json-healer.js, pipeline
 * LaTeX PARTAGÉ H5P + Moodle).
 *
 * BUG corrigé : une formule display `\[…\]` (ou issue de `$$…$$`, `\begin{equation}`,
 * `\begin{align}`) contenant une commande reconnue (\frac, \sqrt…) était RÉ-EMBALLÉE
 * en inline → `\(\[…\]\)` (math display nichée dans de l'inline, invalide) ET, quand
 * du texte l'entourait, TOUTE la prose était wrappée en math (ex. « Quelle est la
 * valeur de \[\sqrt{144}\] ? » → `\(Quelle est … \[\sqrt{144}\] ?\)`). Correctif :
 * la garde du « cas simple » (envelopper toute la chaîne) exclut désormais aussi les
 * délimiteurs display `\[` `\]`, renvoyant ces chaînes vers la branche mixte qui
 * préserve les blocs display et ne convertit que le LaTeX nu HORS blocs.
 *
 * Node pur via bootstrap.mjs. Lancer : node tests/roundtrip/latex-display-wrap.mjs
 * @module tests/roundtrip/latex-display-wrap
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
await import('./bootstrap.mjs');
const jh = await import(join(REPO, 'js/h5p/json-healer.js'));
const { healLatexForTest } = await import(join(REPO, 'js/moodle/moodle-creator.js'));

let passed = 0, failed = 0; const fails = [];
function ok(cond, label, detail) {
  if (cond) passed++; else { failed++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}
const healMoodle = (s) => healLatexForTest({ f: s }).f;

console.log('=== 1. Pipeline Moodle : display math NON ré-emballé en inline ===');
const DW = '\\(\\['; // signature buggée : \(\[
for (const [inp, exp, why] of [
  ['\\[\\frac{a}{b}\\]', '\\[\\frac{a}{b}\\]', 'display \\[…\\] préservé (pas \\(\\[…\\]\\))'],
  ['\\begin{equation}\\frac{a}{b}\\end{equation}', '\\[\\frac{a}{b}\\]', '\\begin{equation} → \\[…\\]'],
  ['$$\\frac{a}{b}$$', '\\[\\frac{a}{b}\\]', '$$…$$ → \\[…\\]'],
  ['Quelle est la valeur de \\[\\sqrt{144}\\] ?', 'Quelle est la valeur de \\[\\sqrt{144}\\] ?', 'prose autour d\'un bloc display NON wrappée en math'],
]) {
  const out = healMoodle(inp);
  ok(out === exp, why, `in=${JSON.stringify(inp)} out=${JSON.stringify(out)}`);
  ok(!out.includes(DW), `pas de signature \\(\\[ : ${JSON.stringify(inp)}`);
}

console.log('=== 2. Non-régression : le LaTeX nu inline est TOUJOURS wrappé ===');
for (const [inp, exp] of [
  ['\\frac{a}{b}', '\\(\\frac{a}{b}\\)'],           // nu → inline (inchangé)
  ['\\sqrt{2}', '\\(\\sqrt{2}\\)'],
  ['texte \\(x^2\\) inline', 'texte \\(x^2\\) inline'], // déjà inline → inchangé
  ['pas de latex ici', 'pas de latex ici'],          // aucune commande → inchangé
]) {
  const out = healMoodle(inp);
  ok(out === exp, `nu/inline inchangé : ${JSON.stringify(inp)}`, `out=${JSON.stringify(out)}`);
}

console.log('=== 3. Pipeline H5P (healJsonObject) : même correctif, aucune \\(\\[ résiduelle ===');
// Champs réalistes H5P : question (display) + réponses (inline) mélangés.
const h5pObj = {
  question: 'Quelle est la valeur de $$\\sqrt{144}$$ ?',
  answers: [
    { text: '\\frac{144}{12}', tipsAndFeedback: { tip: 'Pense à \\(\\frac{a}{b}\\)' } },
    { text: '\\begin{equation}\\frac{x}{y}\\end{equation}' },
  ],
};
const healed = jh.healJsonObject(structuredClone(h5pObj), 'MultipleChoice');
const asStr = JSON.stringify(healed);
ok(!asStr.includes(DW), 'H5P : aucune signature \\(\\[ après heal', asStr.slice(0, 160));
ok(healed.question.includes('\\[\\sqrt{144}\\]') && !healed.question.startsWith('\\('),
  'H5P : question prose non wrappée, display préservé', JSON.stringify(healed.question));
ok(healed.answers[0].text === '\\(\\frac{144}{12}\\)', 'H5P : réponse nu → inline (inchangé)', JSON.stringify(healed.answers[0].text));

console.log('=== 4. Idempotence : re-heal ne change plus rien ===');
for (const s of ['\\[\\frac{a}{b}\\]', 'Quelle est \\[\\sqrt{9}\\] ?', '\\(\\frac{a}{b}\\)']) {
  const once = healMoodle(s);
  const twice = healMoodle(once);
  ok(once === twice, `idempotent : ${JSON.stringify(s)}`, `${JSON.stringify(once)} vs ${JSON.stringify(twice)}`);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} OK, ${failed} KO`);
if (failed) { for (const f of fails) console.log(`   - ${f.label}${f.detail ? ': ' + f.detail : ''}`); process.exit(1); }
