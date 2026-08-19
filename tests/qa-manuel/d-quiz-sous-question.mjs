/**
 * Scénario (d) — Quiz mixte : ajouter une sous-question puis enregistrer sans rien saisir.
 *
 * Défaut visé (6.3.0) : les champs obligatoires vivant DANS un conteneur dynamique
 * (`dynamicObject` : sous-question de Quiz, exercice de diapositive, bloc de Livre)
 * n'étaient pas validés — une sous-question vide passait en silence. Symétriquement, un
 * message qui n'indique QUE le chemin brut est introuvable dans un éditeur maître-détail.
 * Correctifs : descente dans les `dynamicObject` et repli `itemLabel` (validators.js).
 *
 * Attendu : le blocage nomme « Question N › Paramètres de la question › Énoncé de la
 * question », et l'enregistrement repasse dès que l'énoncé est rempli.
 */
import { navigateur, ouvrir, section, item, enregistrer, bloc, titre } from './lib.mjs';

const { b, p } = await navigateur();
bloc('(d) QUIZ MIXTE — ajout d’une sous-question');
let rouge = 0;
const verdict = (ok, vrai, faux) => { console.log(`  ${ok ? '✅' : '❌'} ${ok ? vrai : faux}`); if (!ok) rouge++; };

titre('quiz_mixte_1.json — ajouter une question, enregistrer à vide');
await ouvrir(p, 'quiz_mixte_1.json', 'QuizSet');

// L'activité telle qu'elle naît doit être enregistrable (aucune activité ne naît bloquée)
const avant = await enregistrer(p);
verdict(avant.ok, 'la fixture est enregistrable TELLE QUELLE avant toute modification',
    'la fixture naît déjà bloquée :\n' + (avant.resume || ''));

await section(p, 'Questions');
const n0 = await p.evaluate(() => window.__qa.modele().questions.length);
await p.locator('.json-editor__nav-add-btn', { hasText: 'Ajouter une question' }).first().click();
await p.waitForTimeout(700);
const n1 = await p.evaluate(() => window.__qa.modele().questions.length);
console.log(`  questions : ${n0} → ${n1}`);
verdict(n1 === n0 + 1, 'question RÉELLEMENT ajoutée', 'aucune question ajoutée : test non concluant');

const apres = await enregistrer(p);
console.log('  enregistrement :', apres.ok ? 'PASSE' : 'BLOQUÉ →');
if (!apres.resume) console.log('    (aucun résumé)');
else console.log(apres.resume.split('\n').filter(Boolean).map(l => '      ' + l.trim()).join('\n'));

verdict(!apres.ok, 'l’enregistrement est bloqué tant que l’énoncé est vide',
    'la sous-question vide passe en silence (défaut 6.3.0)');
const attendu = `Question ${n1} › Paramètres de la question › Énoncé de la question`;
verdict(!!apres.resume && apres.resume.includes(attendu),
    `le message nomme « ${attendu} »`, `le message ne contient pas « ${attendu} »`);
verdict(!!apres.resume && !/questions\.\d+\./.test(apres.resume),
    'aucun chemin brut (questions.N.…) dans le message', 'le message expose un chemin brut');
// Seule la question NEUVE doit être fautive
const autres = (apres.resume || '').match(/Question (\d+)/g) || [];
verdict(new Set(autres).size === 1 && autres[0] === `Question ${n1}`,
    'seule la question neuve est signalée, pas ses voisines',
    'des questions préexistantes sont signalées : ' + [...new Set(autres)].join(', '));

titre('puis remplir l’énoncé → l’enregistrement doit repasser');
await item(p, 'questions', n1 - 1);
const rempli = await p.evaluate(() => {
    // L'énoncé est un champ richtext (contenteditable) ou un textarea, selon le type de question
    const cible = [...document.querySelectorAll('#conteneur [data-path]')]
        .find(e => /\.question$/.test(e.dataset.path) && (e.isContentEditable || e.tagName === 'TEXTAREA' || e.tagName === 'INPUT'));
    if (!cible) return { ok: false, chemins: [...document.querySelectorAll('#conteneur [data-path]')].map(e => e.dataset.path).slice(0, 15) };
    if (cible.isContentEditable) { cible.focus(); cible.textContent = 'Quelle est la capitale de la France ?'; }
    else { cible.value = 'Quelle est la capitale de la France ?'; }
    cible.dispatchEvent(new Event('input', { bubbles: true }));
    cible.dispatchEvent(new Event('change', { bubbles: true }));
    cible.dispatchEvent(new Event('blur', { bubbles: true }));
    return { ok: true, chemin: cible.dataset.path };
});
console.log('  champ énoncé :', JSON.stringify(rempli));
await p.waitForTimeout(400);
const final = await enregistrer(p);
console.log('  enregistrement :', final.ok ? 'PASSE' : 'BLOQUÉ →\n' + (final.resume || '').split('\n').filter(Boolean).map(l => '      ' + l.trim()).join('\n'));
verdict(final.ok || !/Énoncé de la question/.test(final.resume || ''),
    'l’énoncé rempli ne bloque plus', 'l’énoncé rempli bloque encore');

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (d) conforme' : `❌ ${rouge} contrôle(s) en échec`}`);
process.exit(rouge === 0 ? 0 : 1);
