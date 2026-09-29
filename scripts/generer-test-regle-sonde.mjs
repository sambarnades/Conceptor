/**
 * generer-test-regle-sonde.mjs — Sondes d'aller-retour des RÉGLAGES DU TEST (D86).
 *
 * Les réglages d'un Test (`quiz_settings` : comportement des questions, tentatives,
 * navigation, questions par page, relecture, feedback global) s'écrivent dans le
 * `quiz.xml` du `.mbz`. Rien de tout cela n'est annoncé avant d'avoir été restauré
 * sur la plateforme (D24 du PRD parcours) : ce script fabrique les fichiers à
 * importer pour de vrai.
 *
 *   1. `test-defauts-<horodatage>.mbz`  — Test seul, SANS réglage : doit arriver
 *      avec les réglages d'un Test créé à la main sur Éléa ;
 *   2. `test-regle-<horodatage>.mbz`    — Test seul RÉGLÉ : interactif avec
 *      plusieurs essais, 2 tentatives (dernière tentative retenue), 15 minutes,
 *      une question par page, navigation séquentielle, « seulement sa note », et
 *      un feedback global à deux plages ;
 *   3. `parcours-test-regle-<horodatage>.mbz` — un COURS d'une section portant le
 *      même Test réglé, par la voie du parcours (mêmes fonctions de réglage, autre
 *      constructeur).
 *
 * Même pipeline que la production, dans un vrai navigateur : `buildTestMbz`
 * (heal LaTeX → canonicalisation → `assembleTestBackupFiles` → `createMbz`) et
 * `assemblerParcours`. Contenu : la fixture `assets/data/examples/test_1.json`
 * (10 questions, six types, des indices sur trois d'entre elles — utiles pour
 * voir les essais supplémentaires du mode interactif). Aucun appel réseau.
 *
 * L'horodatage de génération est porté par le TITRE (visible après l'import) : on
 * sait ainsi quelle sonde on a vraiment restaurée.
 *
 * Lancement :  node scripts/generer-test-regle-sonde.mjs [--sortie=<dossier>]
 * Sortie par défaut : `tests/.sondes-elea/` (hors git).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8398;

const argv = process.argv.slice(2);
const argSortie = argv.find(a => a.startsWith('--sortie='));
const SORTIE = resolve(ROOT, argSortie ? argSortie.split('=').slice(1).join('=') : 'tests/.sondes-elea');

const maintenant = new Date();
const HORODATAGE = maintenant.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
const deux = (n) => String(n).padStart(2, '0');
const SUFFIXE = `${maintenant.getFullYear()}${deux(maintenant.getMonth() + 1)}${deux(maintenant.getDate())}-${deux(maintenant.getHours())}${deux(maintenant.getMinutes())}`;

/** Le Test « réglé » : ce qu'on demande à la plateforme de restituer. */
const REGLE = {
    preferredbehaviour: 'interactive',
    attempts: 2,
    grademethod: 4,
    timelimit_minutes: 15,
    questionsperpage: 1,
    navmethod: 'sequential',
    shuffleanswers: 1,
    review: 'marks',
    overallfeedback: [
        { from: 0, to: 49, feedback: 'Sonde : plage basse (moins de 5/10). Reprenez la leçon.' },
        { from: 50, to: 100, feedback: 'Sonde : plage haute (5/10 et plus). Bravo.' },
    ],
};

const url = `http://127.0.0.1:${PORT}`;
const repond = async () => { try { return (await fetch(`${url}/index.html`, { method: 'HEAD' })).ok; } catch { return false; } };
// Un serveur déjà présent sur ce port servirait peut-être une AUTRE copie du dépôt
// (autre worktree) : on refuse plutôt que de fabriquer une sonde d'un autre code.
if (await repond()) {
    console.error(`❌ Le port ${PORT} est déjà servi : impossible de garantir que la sonde vient de ce dépôt.`);
    process.exit(2);
}
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà arrêté */ } };
process.on('exit', stop);

let code = 0;
try {
    const fin = Date.now() + 15000;
    while (!await repond()) {
        if (Date.now() > fin) throw new Error(`serveur HTTP absent sur ${PORT}`);
        await new Promise(r => setTimeout(r, 150));
    }
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(String(e.message || e)));
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.goto(`${url}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0, null, { timeout: 60000, polling: 200 });

    const sondes = await page.evaluate(async ({ REGLE, HORODATAGE }) => {
        const { buildTestMbz } = await import('/js/moodle/moodle-creator.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const fixture = await (await fetch('/assets/data/examples/test_1.json')).json();
        const octets = async (blob) => [...new Uint8Array(await blob.arrayBuffer())];

        const defauts = { ...structuredClone(fixture), title: `Sonde réglages Test — défauts (${HORODATAGE})` };
        const regle = { ...structuredClone(fixture), title: `Sonde réglages Test — réglé (${HORODATAGE})`, quiz_settings: REGLE };
        const d = await buildTestMbz(defauts);
        const r = await buildTestMbz(regle);

        const plan = {
            titre: `Sonde réglages Test — parcours (${HORODATAGE})`,
            objectifGeneral: 'Vérifier que les réglages du Test traversent le constructeur de cours.',
            notionsPivots: ['réglages du test'],
            origine: 'evaluation',
            etapes: [{
                id: 'e1', titre: 'Évaluation', objectif: 'Le Test réglé',
                cartes: [{
                    id: 'c1', titre: 'Sonde — Test réglé (parcours)', module: 'test_elea',
                    palier: 'transfert', duree: 20, verrouillee: false,
                    contenu: { ...structuredClone(fixture), title: 'Sonde — Test réglé (parcours)', quiz_settings: REGLE },
                }],
            }],
        };
        const p = await assemblerParcours(plan, { platformId: 'elea' });
        return {
            defauts: await octets(d.blob),
            regle: await octets(r.blob),
            parcours: [...p.bytes],
        };
    }, { REGLE, HORODATAGE });

    await mkdir(SORTIE, { recursive: true });
    const fichiers = [
        [`test-defauts-${SUFFIXE}.mbz`, sondes.defauts],
        [`test-regle-${SUFFIXE}.mbz`, sondes.regle],
        [`parcours-test-regle-${SUFFIXE}.mbz`, sondes.parcours],
    ];
    for (const [nom, o] of fichiers) {
        await writeFile(join(SORTIE, nom), Uint8Array.from(o));
        console.log(`✓ ${join(SORTIE, nom)} (${o.length} octets)`);
    }
    if (erreurs.length) { console.error('⚠ erreurs de page :', erreurs); code = 1; }
    await browser.close();

    console.log(`
À vérifier sur Éléa après restauration (titres horodatés « ${HORODATAGE} ») :
  Test « défauts » — Paramètres du test :
    • Comportement des questions : Feedback différé ; Tentatives : Illimité ;
    • Mise en page : « Jamais, toutes les questions sur une page » (et, dans
      « Questions », une seule page) ; Navigation : Libre ; Mélanger : Oui ;
    • Options de relecture : TOUTES les cases cochées dans les quatre colonnes,
      sauf « Feedback global » dans « Pendant la tentative » ;
    • Achèvement : « Recevoir une note » ; carnet de notes : note maximale 10.
  Test « réglé » — Paramètres du test :
    • Comportement : Interactif avec essais multiples ; Tentatives : 2 ;
      Méthode d'évaluation : Dernière tentative ; Temps : 15 minutes ;
    • Mise en page : une question par page (10 pages dans « Questions ») ;
      Navigation : Séquentielle ;
    • Relecture : « Pendant la tentative » : La tentative, Si correct, Points,
      Feedback spécifique, Feedback général (PAS « Réponse juste ») ; les trois
      colonnes « après » : Points (et Note max.) + Feedback global seulement ;
    • Feedback global : deux plages, limite 50 % ;
    • En aperçu (prévisualisation) : « Vérifier » sur chaque question, un essai
      de plus après une erreur quand la question a un indice (Q01, Q03, Q04),
      pas de retour arrière, chronomètre de 15 min ; à la fin, la note et le
      feedback global, SANS accès à la relecture des réponses.
  Parcours — le Test de la section « Évaluation » : mêmes paramètres que le Test réglé.
Puis ré-exporter les trois depuis Éléa et comparer les quiz.xml
(tests/fixtures/moodle-reference/sept-2026/elea/quiz.xml pour les défauts).`);
} catch (e) {
    console.error('❌', e.message || e);
    code = 1;
} finally {
    stop();
}
process.exit(code);
