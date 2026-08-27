/**
 * (g) Bouton « Arrêter » d'une génération en cours — DOM RÉEL de l'application.
 *
 * Ce scénario clique dans `index.html` comme un enseignant : il remplit Qui/Quoi,
 * ouvre une tuile, lance « Générer en un clic », attend la marmite, puis clique
 * sur « Arrêter ». Le webhook LLM est BOUCHONNÉ (la soumission rend un taskId,
 * le polling répond « processing » indéfiniment) : aucun appel réel n'est émis,
 * le scénario ne coûte rien et ne dépend pas de la disponibilité d'ILaaS.
 *
 * Ce qu'il verrouille, et qu'aucune suite ne couvrait :
 *  1. le bouton est ABSENT tant qu'aucune génération ne tourne ;
 *  2. il apparaît dès que la marmite s'affiche ;
 *  3. le clic coupe l'attente PENDANT le délai initial de 5 s — c'est le test de
 *     l'attente interruptible : avec un `setTimeout` nu, il aurait fallu attendre
 *     la fin du délai, et le bouton aurait semblé ne rien faire ;
 *  4. l'overlay se referme, le bouton disparaît ;
 *  5. le champ JSON ne reçoit PAS un message d'échec — un arrêt volontaire n'est
 *     pas une panne, et l'enseignant n'a rien à effacer avant de relancer.
 *
 * Prérequis : `python3 -m http.server 8010` à la RACINE du dépôt.
 * Usage     : node tests/qa-manuel/g-arret-generation.mjs
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';

const URL_APP = 'http://localhost:8010/index.html';
const MODULE = 'Timeline';          // activité simple, sans image ni vidéo requise
const DELAI_INITIAL_MS = 5000;      // POLL_TIMINGS.initialDelayMs

let echecs = 0;
function verifier(condition, libelle, detail) {
    if (condition) { console.log(`  OK   ${libelle}`); return; }
    echecs++;
    console.log(`  KO   ${libelle}`);
    if (detail !== undefined) console.log('       ', detail);
}

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1500, height: 1000 } });
page.on('pageerror', e => console.log('  [pageerror]', String(e).slice(0, 200)));

// ── Bouchon réseau : la tâche est acceptée, puis ne se termine JAMAIS.
let nbPolls = 0;
await page.route('**/webhook/caramel/llm/submit-*', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ taskId: 'qa-arret-generation', status: 'pending' }),
}));
await page.route('**/webhook/caramel/llm/result-*', route => {
    nbPolls++;
    return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ status: 'processing' }),
    });
});

await page.goto(URL_APP);
await page.waitForSelector(`[data-module="${MODULE}"]`, { timeout: 15000 });

const bouton = page.locator('#caramel-cancel-generation');
const overlay = page.locator('#caramel-animation-overlay');

// 1. Au repos, rien ne doit dépasser.
verifier(await bouton.count() === 1, 'le bouton d\'arrêt existe dans la page');
verifier(await bouton.isHidden(), 'il est masqué tant qu\'aucune génération ne tourne');

// ── Gestes de l'enseignant : Qui / Quoi, puis la tuile, puis « Générer ».
await page.fill('#qui', 'Enseignant d\'histoire');
await page.fill('#quoi', 'la Révolution française');
await page.click(`[data-module="${MODULE}"]`);
await page.waitForSelector(`#generate-llm-${MODULE}`, { timeout: 10000 });
// Caramel reconstruit ses prompts cachés sur un debounce de 500 ms après la saisie.
await page.waitForTimeout(900);
await page.click(`#generate-llm-${MODULE}`);

// 2. La marmite tourne, le bouton est là.
await overlay.waitFor({ state: 'visible', timeout: 10000 });
await bouton.waitFor({ state: 'visible', timeout: 5000 });
verifier(true, 'il apparaît dès que la génération démarre');

// 3. Clic PENDANT le délai initial : c'est le cas qui exige une attente interruptible.
const t0 = Date.now();
await bouton.click();
await overlay.waitFor({ state: 'hidden', timeout: DELAI_INITIAL_MS });
const ecoule = Date.now() - t0;
verifier(ecoule < DELAI_INITIAL_MS - 1500,
    `l'arrêt est immédiat, sans attendre la fin du délai initial (${ecoule} ms)`,
    `attendu nettement moins de ${DELAI_INITIAL_MS} ms`);
verifier(nbPolls === 0, 'aucun sondage n\'a été émis après l\'arrêt', `polls = ${nbPolls}`);

// 4. Retour à l'état de repos.
verifier(await bouton.isHidden(), 'le bouton disparaît une fois la génération arrêtée');

// 5. Le champ JSON ne doit pas contenir de message d'échec.
const contenuJson = await page.evaluate(() => {
    const zone = document.querySelector('#timelineJsonInput');
    return zone ? zone.value : '';
});
verifier(!/échou|erreur|error/i.test(contenuJson),
    'aucun message d\'échec n\'est laissé dans le champ JSON',
    JSON.stringify(contenuJson.slice(0, 160)));

// 6. Une notification informe de l'arrêt (et ne se déguise pas en erreur).
// On vise `.notification-toast` NOMMÉMENT, et on l'ATTEND. Un sélecteur large du
// genre `[class*="notification"]` attrapait la cloche du centre de notifications,
// toujours présente et dont l'état varie : le test passait ou non selon le moment.
await page.waitForSelector('.notification-toast', { timeout: 5000 });
const notif = await page.evaluate(() => {
    const n = document.querySelector('.notification-toast');
    return { texte: n.textContent.trim().slice(0, 160), estErreur: n.classList.contains('error') };
});
verifier(!notif.estErreur,
    'la notification d\'arrêt n\'est pas présentée comme une erreur',
    JSON.stringify(notif));
verifier(/arrêt|arrêtée|attend/i.test(notif.texte),
    'elle dit bien que la génération est arrêtée',
    JSON.stringify(notif.texte));

// ── Acte 2 : arrêt PENDANT le sondage, pas seulement pendant le délai initial.
// C'est un autre chemin de code : le premier clic réveille une attente, celui-ci
// interrompt une requête EN VOL. Sans le test d'annulation dans le `catch` réseau
// du sondage, l'interruption serait prise pour un incident passager et la boucle
// repartirait — l'overlay ne se fermerait jamais.
console.log('\n  — acte 2 : arrêt en plein sondage —');
nbPolls = 0;
await page.click(`#generate-llm-${MODULE}`);
await overlay.waitFor({ state: 'visible', timeout: 10000 });
await bouton.waitFor({ state: 'visible', timeout: 5000 });
// On laisse passer le délai initial + un sondage, pour être sûr d'être dans la boucle.
await page.waitForTimeout(DELAI_INITIAL_MS + 1200);
verifier(nbPolls >= 1, 'le sondage a bien démarré avant l\'arrêt', `polls = ${nbPolls}`);

const pollsAvantArret = nbPolls;
await bouton.click();
await overlay.waitFor({ state: 'hidden', timeout: 8000 });
verifier(await bouton.isHidden(), 'l\'arrêt en plein sondage referme l\'overlay');

// Laisser du temps à une éventuelle boucle survivante pour se manifester.
await page.waitForTimeout(4000);
verifier(nbPolls === pollsAvantArret,
    'le sondage s\'est réellement arrêté (aucune requête après le clic)',
    `avant = ${pollsAvantArret}, après = ${nbPolls}`);

await navigateur.close();
console.log(echecs === 0 ? '\n✅ (g) arrêt de génération : conforme\n' : `\n❌ (g) ${echecs} vérification(s) en échec\n`);
process.exit(echecs === 0 ? 0 : 1);
