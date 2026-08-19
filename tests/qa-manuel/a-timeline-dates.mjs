/**
 * Scénario (a) — Frise chronologique : PARCOURIR ne doit pas réécrire les dates.
 *
 * Défaut visé (6.3.0) : le champ AFFICHE « 05/05/1789 » alors que le modèle stocke le
 * format H5P « 1789,05,05 ». Sans reconversion à la collecte, il suffisait de CLIQUER
 * sur les événements — sans rien saisir — pour que la chaîne affichée écrase le modèle
 * et parte dans le .h5p, illisible pour TimelineJS.
 * Correctif : branche `input.dataset.timelineDate === 'true'` de collectInputValues.
 *
 * Le contrôle porte sur la DATE, pas sur la chaîne : « 1789,05,05 » → « 1789,5,5 » est la
 * forme canonique de H5P (non zéro-paddée), c'est un ré-encodage voulu. L'équivalence est
 * volontairement étroite — « 05/05/1789 » n'y passe pas.
 */
import { navigateur, ouvrir, section, enregistrer, bloc, titre } from './lib.mjs';

const canon = d => String(d).split(',').map((x, i) => i === 0 ? x : String(parseInt(x, 10))).join(',');
const FORMAT_H5P = /^-?\d{1,4}(,\d{1,2}(,\d{1,2})?)?$/;  // année seule et années négatives comprises

const { b, p } = await navigateur();
bloc('(a) FRISE CHRONOLOGIQUE — parcourir sans rien modifier');
let rouge = 0;

for (const fx of ['timeline_1.json', 'timeline_2.json', 'timeline_3.json']) {
    titre(fx);
    const avant = await p.evaluate(async f => {
        const r = await window.__qa.ouvrir(f, 'Timeline');
        return (r.brut.timeline?.date || []).map(d => d.startDate);
    }, fx);

    const parcourir = async () => {
        await section(p, 'Événements');
        const subs = await p.$$('[data-array-path="timeline.date"] .json-editor__nav-subitem');
        for (const s of subs) { await s.click(); await p.waitForTimeout(50); }
        return subs.length;
    };

    const n = await parcourir();
    // Ce que l'utilisateur LIT dans le champ (preuve que la conversion est bien nécessaire)
    const affiche = await p.evaluate(() =>
        [...document.querySelectorAll('#conteneur [data-timeline-date="true"]')].map(i => i.value));

    const s1 = await enregistrer(p);
    const d1 = s1.ok ? await p.evaluate(() => window.__qa.modele().timeline.date.map(d => d.startDate)) : null;

    // 2e cycle : rouvrir SUR LE RÉSULTAT, reparcourir, ré-enregistrer → doit être un point fixe
    let d2 = null;
    if (d1) {
        const modele = await p.evaluate(() => window.__qa.modele());
        await p.evaluate(async d => { await window.__qa.ouvrirDonnees(d, 'Timeline'); }, modele);
        await p.waitForTimeout(500);
        await parcourir();
        const s2 = await enregistrer(p);
        d2 = s2.ok ? await p.evaluate(() => window.__qa.modele().timeline.date.map(d => d.startDate)) : null;
    }

    console.log(`  ${n} événements cliqués, 0 saisie`);
    console.log(`  champ affiché à l'écran : ${JSON.stringify(affiche.slice(0, 2))}`);
    console.log(`  modèle avant : ${JSON.stringify(avant.slice(0, 3))}`);
    console.log(`  modèle après : ${JSON.stringify(d1?.slice(0, 3))}`);

    const memeDate = d1 && avant.length === d1.length && avant.every((d, i) => canon(d) === canon(d1[i]));
    const format = d1 && d1.every(d => FORMAT_H5P.test(String(d)));
    const stable = d1 && d2 && JSON.stringify(d1) === JSON.stringify(d2);
    for (const [ok, vrai, faux] of [
        [memeDate, `même date pour les ${avant.length} événements`, 'DATE CHANGÉE'],
        [format, 'format H5P conservé (aucun JJ/MM/AAAA dans le modèle)', 'format localisé dans le modèle'],
        [stable, 'point fixe au 2e cycle', 'dérive au 2e cycle'],
    ]) { console.log(`  ${ok ? '✅' : '❌'} ${ok ? vrai : faux}`); if (!ok) rouge++; }
}

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (a) conforme' : `❌ ${rouge} contrôle(s) en échec`}`);
process.exit(rouge === 0 ? 0 : 1);
