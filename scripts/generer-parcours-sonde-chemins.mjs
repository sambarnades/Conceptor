/**
 * generer-parcours-sonde-chemins.mjs — Le `.mbz` qui éprouve les CHEMINS sur la
 * plateforme (D90-D101), avec sa fiche de relevé pour trois élèves.
 *
 * **Ce que seule la plateforme peut dire.** Le banc `run_parcours_aiguillage.mjs`
 * rejoue les règles de disponibilité de Moodle sur tous les scores ; il ne peut pas
 * dire si la RESTAURATION traduit l'élément de note cité par une condition
 * (`restore_update_availability`), ni si le lecteur H5P d'Éléa rend bien une note
 * à la première tentative. Un identifiant mal traduit vaut 0 : aucun chemin ne
 * s'ouvre, pour personne, et cela ne se voit qu'une fois la classe devant (D24).
 *
 * **Deux aiguillages dans un même cours**, pour un seul import :
 *   A. un Quiz QCM H5P de 5 questions — dont UNE à deux bonnes réponses, qui doit
 *      valoir un seul point (D93) — ouvre trois chemins ;
 *   B. dans l'étape commune qui suit, un Test Moodle ouvre deux chemins ;
 *   puis une étape commune, et la Fin du parcours (D96).
 * Des H5P sans note (Cartes de dialogue, Frise) s'y achèvent à la consultation
 * (D100) ; chaque activité porte sa durée (D97).
 *
 * Mêmes principes que `generer-parcours-sonde.mjs` : fixtures du dépôt, aucun
 * appel réseau, chemin de production exact (`assemblerParcours`), titre horodaté
 * pour reconnaître le fichier importé.
 *
 * Lancement :  node scripts/generer-parcours-sonde-chemins.mjs [--sortie=<dossier>]
 * Sortie par défaut : `tests/sonde-parcours/sonde-chemins-elea.{mbz,md}`
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8124;
const arg = n => (process.argv.find(x => x.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=') || null;
const SORTIE = resolve(ROOT, arg('sortie') || 'tests/sonde-parcours');
const TIMESTAMP = 1759200000;
const HORODATAGE = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');

const serveur = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { serveur.kill('SIGTERM'); } catch { /* déjà arrêté */ } });
for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) break; } catch { /* pas prêt */ }
    await new Promise(r => setTimeout(r, 150));
}

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e.message || e)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0, null, { timeout: 60000, polling: 200 });

const r = await page.evaluate(async ({ TIMESTAMP, HORODATAGE }) => {
    const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
    const A = await import('/js/parcours/aiguillage.js');
    const ex = async n => (await fetch(`/assets/data/examples/${n}.json`)).json();
    const [qcm, test, page0, dtw, fib, frise, dialogue, vf] = await Promise.all(
        ['quiz_qcm_1', 'test_1', 'page_1', 'drag_the_words_1', 'fill_in_the_blanks_1', 'timeline_1', 'dialog_cards_1', 'quiz_vraifaux_1'].map(ex));
    const carte = (id, titre, module, contenu, duree, controle) => ({
        id, titre, objectif: controle, consigne: '', module, moduleReplie: false, palier: 'entrainement',
        duree, verrouillee: false, contenu: structuredClone(contenu),
    });
    const plan = {
        titre: `Sonde chemins ${HORODATAGE} — elea`,
        objectifGeneral: 'Vérifier que chaque élève suit un chemin et un seul, jusqu’à la fin du parcours',
        introduction: 'Texte d’accueil de la sonde. La durée estimée du parcours doit s’afficher juste en dessous.',
        conclusion: 'Mot de la fin de la sonde : il doit s’afficher sous « Bravo ! Le parcours est terminé. ».',
        notionsPivots: [], origine: 'sonde', personnalise: false,
        carte: { actif: false, theme: 'paysage' },
        // Cochée à dessein : avec des chemins, elle ne doit rien écraser (D33, D90).
        progression: { actif: true },
        etapes: [
            { id: 'e1', titre: '1 — Se positionner', objectif: 'Faire le point', introduction: 'Lis la page, puis fais le quiz : ta première tentative décide de la suite.',
              cartes: [carte('a1', 'Sonde — Page de départ', 'Page', page0, 5, 'Se lit ; achevée à la consultation.'),
                  carte('a2', 'Sonde — Quiz qui oriente (A)', 'QuizSetQCM', qcm, 8, 'Pas de bouton « Recommencer » ; la question 4 (deux bonnes réponses) vaut UN point : score sur 5.')] },
            { id: 'e2', titre: 'Renforcer (A) — revoir pas à pas', objectif: 'Revoir', introduction: 'Chemin « Renforcer » du quiz A.', chemin: { depuis: 0 },
              cartes: [carte('b1', 'Sonde A · Renforcer — Glisser les mots', 'DragTheWords', dtw, 8, 'Correction immédiate (réglage du chemin).'),
                  carte('b2', 'Sonde A · Renforcer — Cartes de dialogue', 'DialogCards', dialogue, 6, 'Jamais notée : achevée à la CONSULTATION (D100).')] },
            { id: 'e3', titre: 'Consolider (A) — s’entraîner', objectif: 'S’entraîner', introduction: 'Chemin « Consolider » du quiz A.', chemin: { depuis: 40 },
              cartes: [carte('c1', 'Sonde A · Consolider — Texte à trous', 'FillInTheBlanks', fib, 8, 'Se fait et rend une note.'),
                  carte('c2', 'Sonde A · Consolider — Frise', 'Timeline', frise, 6, 'Jamais notée : achevée à la CONSULTATION (D100).')] },
            { id: 'e4', titre: 'Approfondir (A) — aller plus loin', objectif: 'Approfondir', introduction: 'Chemin « Approfondir » du quiz A.', chemin: { depuis: 75 },
              cartes: [carte('d1', 'Sonde A · Approfondir — Texte à trous', 'FillInTheBlanks', fib, 8, 'Pas de bouton « Voir la solution » (réglage du chemin).'),
                  carte('d2', 'Sonde A · Approfondir — Vrai ou faux', 'QuizSetVF', vf, 6, 'Se fait et rend une note.')] },
            { id: 'e5', titre: '2 — Faire le point', objectif: 'Vérifier', introduction: 'Étape commune du quiz A, qui contient le test B.',
              cartes: [carte('f1', 'Sonde — Test qui oriente (B)', 'test_elea', test, 15, 'UNE seule tentative autorisée.')] },
            { id: 'e6', titre: 'Renforcer (B) — revoir', objectif: 'Revoir', chemin: { depuis: 0 },
              cartes: [carte('g1', 'Sonde B · Renforcer — Vrai ou faux', 'QuizSetVF', vf, 8, 'Correction immédiate.')] },
            { id: 'e7', titre: 'Approfondir (B) — aller plus loin', objectif: 'Approfondir', chemin: { depuis: 60 },
              cartes: [carte('h1', 'Sonde B · Approfondir — Texte à trous', 'FillInTheBlanks', fib, 8, 'Pas de bouton « Voir la solution ».')] },
            { id: 'e8', titre: '3 — Ensemble', objectif: 'Réinvestir', introduction: 'Étape commune du test B.',
              cartes: [carte('i1', 'Sonde — Page commune', 'Page', page0, 5, 'Se lit ; achevée à la consultation.')] },
        ],
    };
    const paquet = await assemblerParcours(plan, { timestamp: TIMESTAMP, platformId: 'elea' });
    const groupes = A.aiguillagesDuPlan(plan);
    const aiguillages = groupes.map((g, i) => {
        const t = paquet.tests[i];
        return {
            test: g.test.titre, n: t.n,
            chemins: g.chemins.map((c, j) => ({
                role: c.role, titre: c.etape.titre,
                plage: A.plagesEnReponses(t.bornes, t.n)[j],
                seuils: [j === 0 ? null : A.seuilMoodle(t.bornes[j - 1], t.n), j === g.chemins.length - 1 ? null : A.seuilMoodle(t.bornes[j], t.n)],
            })),
        };
    });
    const d = A.dureeParEleve(plan);
    return {
        octets: Array.from(paquet.bytes), titre: plan.titre, aiguillages, duree: d,
        sections: paquet.sections.length, activites: paquet.activites.length - (paquet.textes || 0), textes: paquet.textes || 0,
        exclues: paquet.exclues, fin: paquet.fin, durees: paquet.durees,
        etapes: plan.etapes.map(e => ({ titre: e.titre, chemin: Boolean(e.chemin), cartes: e.cartes.map(c => ({ titre: c.titre, module: c.module, controle: c.objectif })) })),
        conclusion: plan.conclusion,
    };
}, { TIMESTAMP, HORODATAGE });
await navigateur.close();

if (erreurs.length || r.exclues.length) {
    console.error('Sonde incomplète :', erreurs.join(' | '), JSON.stringify(r.exclues));
    process.exit(1);
}

const plage = ([de, a], n) => (de === a ? `${de} sur ${n}` : `de ${de} à ${a} sur ${n}`);
const minutes = m => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`);
const [A, B] = r.aiguillages;
const choisir = (g, rang) => g.chemins[rang === 'bas' ? 0 : rang === 'haut' ? g.chemins.length - 1 : 1];
const eleves = [
    { nom: 'Élève 1', a: 'bas', b: 'bas' },
    { nom: 'Élève 2', a: 'milieu', b: 'haut' },
    { nom: 'Élève 3', a: 'haut', b: 'haut' },
];

const l = [];
l.push('# Sonde des chemins — Éléa (D90-D101)', '');
l.push(`Fichier : \`sonde-chemins-elea.mbz\` — généré par \`node scripts/generer-parcours-sonde-chemins.mjs\``, '');
l.push(`> **Une fois importé, le cours doit s’appeler « ${r.titre} ».** Sinon, c’est un ancien`);
l.push('> fichier : régénérez et réimportez.', '');
l.push('Aucun texte produit par une IA : les activités viennent des exemples du dépôt. La sonde');
l.push('n’éprouve que la MÉCANIQUE des chemins — ce qu’aucun banc local ne peut trancher.', '');
l.push('## Préparer', '');
l.push('1. Créer un cours **VIDE** (D98) : dans un cours déjà rempli, Moodle range nos sections dans');
l.push('   les siennes et les restrictions des chemins s’appliqueraient à ses sections à lui.');
l.push('2. Restauration → déposer le `.mbz` → **« Fusionner la sauvegarde avec ce cours »**, tout par');
l.push('   défaut. Noter tout avertissement de l’assistant.');
l.push('3. Inscrire **trois comptes élèves**. Garder une fenêtre enseignant ouverte à côté.', '');
l.push('## a. Vu par l’enseignant, juste après l’import', '');
l.push(`- [ ] ${r.sections - 1} sections nommées, dans l’ordre :`);
for (const e of r.etapes) l.push(`      - ${e.titre}`);
l.push('      - Fin du parcours');
l.push(`- [ ] En tête du cours, l’accueil dit **« Durée estimée du parcours : ${minutes(r.duree.max)} »**.`);
l.push('- [ ] Sous chaque activité, sa description commence par **« Durée estimée : … »**.');
l.push('- [ ] Chaque chemin s’ouvre par une étiquette **« Visible par vous seul »**, marquée cachée');
l.push('      aux étudiants, qui dit à quels élèves il s’ouvre (voir les plages ci-dessous).');
l.push('- [ ] Ouvrir la restriction d’accès d’un chemin : elle cite **le quiz A** (ou **le test B**) par');
l.push('      son nom — pas « activité manquante ». **C’est LE contrôle du remappage de la note.**');
l.push('- [ ] La section « Fin du parcours » porte une restriction (achèvement de tout le parcours).', '');
for (const g of [A, B]) {
    l.push(`**Aiguillage ${g === A ? 'A' : 'B'} — « ${g.test} » (${g.n} questions)**`, '');
    for (const c of g.chemins) {
        const [min, max] = c.seuils;
        const note = [min !== null ? `≥ ${min} %` : '', max !== null ? `< ${max} %` : ''].filter(Boolean).join(' et ');
        l.push(`- ${c.titre} : ${plage(c.plage, g.n)} (restriction : note ${note})`);
    }
    l.push('');
}
l.push('## b. Trois élèves, chacun son chemin', '');
l.push('Pour chaque élève, **recharger la page du cours** après chaque activité terminée : Moodle');
l.push('recalcule les restrictions à l’affichage.', '');
for (const el of eleves) {
    const ca = choisir(A, el.a);
    const cb = choisir(B, el.b);
    l.push(`### ${el.nom}`, '');
    l.push('- [ ] Au départ : seule l’étape « 1 — Se positionner » est visible. **Aucun chemin, ni');
    l.push('      « Faire le point », ni « Fin du parcours ».** Sous le quiz, le texte « Les activités');
    l.push('      suivantes s’afficheront ci-dessous dès la fin du test ».');
    l.push(`- [ ] Quiz A : obtenir **${plage(ca.plage, A.n)}** bonnes réponses, puis « Terminer ». Pas de bouton « Recommencer ».`);
    l.push(`- [ ] Recharger : **« ${ca.titre} » et lui seul** apparaît ; aucun autre chemin, même grisé.`);
    l.push('- [ ] Faire ses activités (les Cartes de dialogue et la Frise s’achèvent en les ouvrant).');
    l.push('- [ ] Recharger : « 2 — Faire le point » apparaît. Le Test B n’autorise qu’**une** tentative.');
    l.push(`- [ ] Test B : **${plage(cb.plage, B.n)}** bonnes réponses. Recharger : **« ${cb.titre} »** seul.`);
    l.push('- [ ] Le terminer : « 3 — Ensemble » apparaît ; la terminer : **« Fin du parcours »** apparaît,');
    l.push(`      avec « Bravo ! Le parcours est terminé. » puis « ${r.conclusion} »`, '');
}
l.push('## c. Réorienter un élève', '');
l.push('- [ ] Enseignant : carnet de notes → **Élève 1** → remplacer sa note au quiz A par la note maximale.');
l.push(`- [ ] Élève 1 recharge : « ${A.chemins.at(-1).titre} » apparaît, « ${A.chemins[0].titre} » disparaît ;`);
l.push('      ce qu’il a déjà fait reste fait, et la suite reste ouverte.', '');
l.push('## d. Le point par question (D93)', '');
l.push('- [ ] Au quiz A, la question 4 a DEUX bonnes réponses : les cocher toutes les deux rapporte');
l.push(`      **un** point. Le score final se lit « … sur ${A.n} », jamais sur ${A.n + 1}.`, '');
l.push('## e. Le retour', '');
l.push('- [ ] Ré-exporter le cours et y relire `sections/*/section.xml` : dans `availabilityjson`,');
l.push('      l’`id` de chaque condition « grade » est celui du `grade_item` du quiz A ou du test B');
l.push('      dans le cours d’accueil (`activities/*/grades.xml`), et non 0.', '');
l.push('## À reporter dans le PRD', '');
l.push('Résultat dans `docs/PRD_PARCOURS.md` : § 11 (journal) si tout passe, § 7 (pièges) sinon,');
l.push('et la case « aller-retour » de D90 cochée. **Rien n’est annoncé avant (D24).**');

await mkdir(SORTIE, { recursive: true });
await writeFile(join(SORTIE, 'sonde-chemins-elea.mbz'), Buffer.from(r.octets));
await writeFile(join(SORTIE, 'sonde-chemins-elea.md'), l.join('\n') + '\n');
console.log(`✓ sonde-chemins-elea.mbz — ${(r.octets.length / 1024).toFixed(1)} Ko, ${r.activites} activités, ${r.textes} textes, ${r.sections - 1} sections`);
for (const g of r.aiguillages) console.log(`  ${g.test} (${g.n} questions) : ${g.chemins.map(c => `${c.role} ${plage(c.plage, g.n)}`).join(' · ')}`);
console.log(`  Fiche de relevé : ${join(SORTIE, 'sonde-chemins-elea.md')}`);
process.exit(0);
