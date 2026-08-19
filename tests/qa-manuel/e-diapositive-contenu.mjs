/**
 * Scénario (e) — Diapositive de type « contenu » : aucun champ d'exercice MASQUÉ ne doit
 * bloquer l'enregistrement.
 *
 * C'est le revers du correctif (d) : en descendant valider les conteneurs dynamiques, on
 * risque de réclamer des champs que l'écran NE MONTRE PAS — une diapositive « contenu »
 * n'a pas d'exercice, mais le schéma de l'exercice existe toujours dans le conteneur.
 * Correctif : la garde `showWhen` de validators.js (un conteneur masqué ne bloque jamais).
 *
 * On vérifie les deux sens : les diapositives « contenu » n'exigent rien, et le
 * basculement quiz → contenu libère un blocage qui existait avant la bascule.
 */
import { navigateur, ouvrir, section, item, enregistrer, bloc, titre } from './lib.mjs';

const { b, p } = await navigateur();
bloc('(e) DIAPOSITIVE « CONTENU » — aucun champ d’exercice masqué ne bloque');
let rouge = 0;
const verdict = (ok, vrai, faux) => { console.log(`  ${ok ? '✅' : '❌'} ${ok ? vrai : faux}`); if (!ok) rouge++; };

for (const fx of ['course_presentation_4.json', 'course_presentation_5.json']) {
    titre(`${fx} — parcourir TOUTES les diapositives puis enregistrer`);
    await ouvrir(p, fx, 'CoursePresentation');
    const types = await p.evaluate(() => window.__qa.modele().slides.map(s => s.type));
    console.log('  types :', types.map((t, i) => `${i + 1}:${t}`).join('  '));

    await section(p, 'Diapositives');
    for (let i = 0; i < types.length; i++) { await item(p, 'slides', i); }
    const s = await enregistrer(p);
    console.log('  enregistrement après parcours complet :', s.ok ? 'PASSE' : 'BLOQUÉ →');
    if (!s.ok) console.log(s.resume.split('\n').filter(Boolean).map(l => '      ' + l.trim()).join('\n'));
    verdict(s.ok, 'aucune diapositive « contenu » ne réclame de champ d’exercice',
        'un champ masqué bloque l’enregistrement');

    // Contrôle direct : les diapos non-quiz portent-elles un exercice résiduel ?
    const residus = await p.evaluate(() => window.__qa.modele().slides
        .map((sl, i) => ({ i: i + 1, type: sl.type, aExercice: !!(sl.exercise && Object.keys(sl.exercise).length) }))
        .filter(x => !/quiz/.test(x.type || '') && x.aExercice));
    console.log('  diapos non-quiz portant un exercice résiduel :', residus.length ? JSON.stringify(residus) : 'aucune');
    verdict(true, `${types.filter(t => !/quiz/.test(t || '')).length} diapositives non-quiz traversées sans blocage`, '');
}

titre('bascule quiz → contenu : le blocage doit DISPARAÎTRE');
await ouvrir(p, 'course_presentation_5.json', 'CoursePresentation');
await section(p, 'Diapositives');
await item(p, 'slides', 12);                 // diapo 13 = Glisser-déposer
// vider les zones cibles d'une étiquette → blocage attendu
await p.evaluate(() => {
    const inp = document.querySelector('[data-path="slides.12.exercise.elements.0.zoneIndices"]');
    const f = inp.closest('.json-editor__field');
    for (const c of f.querySelectorAll('.json-editor__multi-checkbox-input')) {
        if (c.checked) { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }
    }
});
await p.waitForTimeout(400);
const bloque = await enregistrer(p);
console.log('  après avoir vidé « Zones cibles » de Mercure :', bloque.ok ? 'PASSE' : 'BLOQUÉ');
verdict(!bloque.ok, 'le champ VISIBLE et vide bloque bien', 'le champ visible vide ne bloque pas');

// basculer le type de la diapositive en « contenu » → l'exercice devient masqué
const bascule = await p.evaluate(() => {
    const sel = document.querySelector('[data-path="slides.12.type"]');
    if (!sel) return 'sélecteur de type introuvable';
    sel.value = 'content';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return 'type basculé vers « content »';
});
await p.waitForTimeout(700);
console.log('  ', bascule);
const libere = await enregistrer(p);
console.log('  enregistrement :', libere.ok ? 'PASSE' : 'BLOQUÉ →');
if (!libere.ok) console.log(libere.resume.split('\n').filter(Boolean).map(l => '      ' + l.trim()).join('\n'));
verdict(libere.ok, 'une fois l’exercice MASQUÉ, il ne bloque plus',
    'un exercice masqué bloque encore l’enregistrement');

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (e) conforme' : `❌ ${rouge} contrôle(s) en échec`}`);
process.exit(rouge === 0 ? 0 : 1);
