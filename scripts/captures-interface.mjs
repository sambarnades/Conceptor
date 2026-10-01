#!/usr/bin/env node
/**
 * Refait les captures d'écran de l'interface montrées par le tutoriel et le wiki.
 *
 * **Pourquoi un script.** Les captures vieillissent sans prévenir : le jour où le
 * commutateur « Une activité | Un parcours » est apparu sous le formulaire, toutes
 * celles de l'accueil sont devenues fausses, et personne ne l'a vu. Refaire une
 * capture à la main, c'est aussi refaire son cadrage, sa taille, son contenu — et
 * ne jamais tomber deux fois sur la même image. Ici tout est fixé : taille de
 * fenêtre, densité, langue, sujet saisi, et le parcours montré est un parcours
 * RÉEL du banc (`tests/fixtures/parcours-reels/revision-fractions.json`), repris
 * par le vrai bouton d'import de l'atelier. Aucun appel au modèle, réseau coupé.
 *
 *   node scripts/captures-interface.mjs                 toutes les captures
 *   node scripts/captures-interface.mjs --seulement=parcours-plan,accueil-rapide
 *
 * Les captures existantes gardent leur nom et leur format (PNG) : douze tutoriels
 * et le wiki les référencent. Les captures du parcours, nouvelles, sont en WebP
 * (conversion par PIL : `python3 -c "import PIL"` doit répondre).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8215;
const DOSSIER = join(ROOT, 'assets/images/wiki');
const SCENARIO = join(ROOT, 'tests/fixtures/parcours-reels/revision-fractions.json');
const QUI = 'Professeur de mathématiques';
const QUOI = 'Les fractions : égalité, simplification, comparaison, addition et soustraction';

/** Figer l'image : ni animation, ni curseur clignotant. */
const CSS_FIGE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
/** Pour un cadrage dans la page : l'en-tête fixe et la bulle de Caramelia masqueraient la zone. */
const CSS_CADRAGE = '.app-bar{position:static!important}#caramelia-fab,#notification-toast-container,#emergency-notification-container{display:none!important}';

const argv = process.argv.slice(2);
const seulement = (argv.find(a => a.startsWith('--seulement=')) || '').split('=')[1]?.split(',').filter(Boolean);
const temp = mkdtempSync(join(tmpdir(), 'captures-'));

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { server.kill('SIGTERM'); } catch { /* déjà arrêté */ } rmSync(temp, { recursive: true, force: true }); });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch();

async function ouvrir({ largeur = 1260, hauteur = 900, densite = 2, cadrage = true } = {}) {
    const page = await browser.newPage({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: densite, locale: 'fr-FR' });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0);
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: CSS_FIGE + (cadrage ? CSS_CADRAGE : '') });
    page.erreurs = erreurs;
    return page;
}

/**
 * Le rectangle qui englobe tous les éléments donnés, en coordonnées de la page.
 * `cadre` prend la LARGEUR d'un autre élément (l'atelier entier plutôt que son
 * contenu, pour ne pas couper sa bordure).
 */
async function zone(page, selecteurs, marge = 16, cadre = null) {
    const r = await page.evaluate(({ selecteurs, marge, cadre }) => {
        const boites = selecteurs.flatMap(s => [...document.querySelectorAll(s)])
            .map(n => n.getBoundingClientRect()).filter(b => b.width && b.height);
        if (!boites.length) return null;
        const c = cadre && document.querySelector(cadre)?.getBoundingClientRect();
        const gauche = c ? c.left : Math.min(...boites.map(b => b.left));
        const droite = c ? c.right : Math.max(...boites.map(b => b.right));
        const x = Math.max(0, gauche - marge), y = Math.max(0, Math.min(...boites.map(b => b.top)) + window.scrollY - marge);
        const bas = Math.max(...boites.map(b => b.bottom)) + window.scrollY + marge;
        return { x, y, width: droite + marge - x, height: bas - y };
    }, { selecteurs, marge, cadre });
    if (!r) throw new Error(`rien à capturer : ${selecteurs.join(', ')}`);
    return r;
}

/** Capture une zone ; `webp` passe par PIL (les captures du parcours). */
async function capturer(page, nom, selecteurs, { marge = 16, webp = false, cadre = null } = {}) {
    const clip = await zone(page, selecteurs, marge, cadre);
    const png = webp ? join(temp, `${nom}.png`) : join(DOSSIER, nom);
    await page.screenshot({ path: png, clip, fullPage: true, type: 'png' });
    if (webp) versWebp(png, join(DOSSIER, `${nom}.webp`));
    console.log(`  ✓ ${webp ? nom + '.webp' : nom}  (${Math.round(clip.width)}×${Math.round(clip.height)})`);
}

function versWebp(source, cible) {
    const r = spawnSync('python3', ['-c',
        'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=88, method=6)', source, cible]);
    if (r.status !== 0) throw new Error(`conversion WebP : ${r.stderr}`);
}

async function remplirFormulaire(page) {
    await page.fill('#qui', QUI);
    await page.fill('#quoi', QUOI);
}

/**
 * Le parcours du banc, repris par le vrai bouton d'import de l'atelier.
 * `aFabriquer` : les N dernières activités arrivent SANS contenu, et une doublure
 * du modèle (crochet d'essai de l'atelier) rend leur contenu d'origine après un
 * délai — de quoi montrer une fabrication en cours sans appeler l'IA.
 */
async function ouvrirParcours(page, { aFabriquer = 0 } = {}) {
    await remplirFormulaire(page);
    await page.click('#parcours-button');
    await page.waitForTimeout(600);
    let fichier = SCENARIO;
    if (aFabriquer) {
        const scenario = JSON.parse(readFileSync(SCENARIO, 'utf8'));
        const cartes = scenario.plan.etapes.flatMap(e => e.cartes);
        const origines = {};
        for (const c of cartes.slice(-aFabriquer)) { origines[c.id] = c.contenu; c.contenu = null; }
        fichier = join(temp, 'scenario-a-fabriquer.json');
        writeFileSync(fichier, JSON.stringify(scenario));
        await page.evaluate(async (origines) => {
            const parcours = await import('/js/parcours/index.js');
            parcours.__testHooks.doublerModele(async (prompt, carte) => {
                await new Promise(r => setTimeout(r, 2500));
                return JSON.stringify(origines[carte.id]);
            });
        }, origines);
    }
    await page.setInputFiles('#pc-scenario-fichier', fichier);
    await page.waitForSelector('.pc-etape');
    await page.waitForTimeout(800);
}

/**
 * Le même parcours réel, mis en CHEMINS (D90) : son quiz diagnostic oriente vers
 * trois chemins — ses deux étapes de révision et une étape « Aller plus loin » —,
 * puis tous se retrouvent pour le test final. Les deux activités ajoutées n'ont
 * pas de contenu : le plan les montre à générer, comme dans l'atelier.
 */
async function ouvrirParcoursAChemins(page) {
    await remplirFormulaire(page);
    await page.click('#parcours-button');
    await page.waitForTimeout(600);
    const scenario = JSON.parse(readFileSync(SCENARIO, 'utf8'));
    const [test, bases, entrainement, bilan] = scenario.plan.etapes;
    const aFaire = (id, module, titre, duree) => ({ id, module, titre, duree, palier: 'transfert', objectif: titre, consigne: '', verrouillee: false, contenu: null });
    scenario.format = 2;
    scenario.cadrage = { ...scenario.cadrage, trame: 'differenciation', structure: 'chemins', chemins: 3 };
    scenario.plan.conclusion = 'Tu sais maintenant comparer, simplifier et additionner des fractions.';
    scenario.plan.etapes = [
        test,
        // Chaque chemin a SON introduction : l'élève ne sait rien des autres (D94).
        { ...bases, titre: 'Revoir les bases pas à pas', chemin: { depuis: 0 },
          introduction: 'Reprends les règles une à une, avec des exemples résolus, puis refais-les sur ton brouillon.' },
        { ...entrainement, titre: 'S’entraîner sur les points difficiles', chemin: { depuis: 40 },
          introduction: 'Entraîne-toi sur les calculs qui posent le plus de problèmes, puis vérifie tes résultats.' },
        { id: 'e20', titre: 'Aller plus loin', objectif: 'Appliquer les fractions à des situations nouvelles', chemin: { depuis: 75 },
          introduction: 'Applique ce que tu sais à des situations nouvelles, et explique ta méthode.',
          cartes: [aFaire('c21', 'Essay', 'Expliquer sa méthode de comparaison', 12), aFaire('c22', 'SortParagraphs', 'Remettre un calcul dans l’ordre', 10)] },
        bilan,
    ];
    const fichier = join(temp, 'scenario-chemins.json');
    writeFileSync(fichier, JSON.stringify(scenario));
    await page.setInputFiles('#pc-scenario-fichier', fichier);
    await page.waitForSelector('.pc-aiguillage');
    await page.waitForTimeout(800);
}

const ATELIER = '#pc-atelier';

const CAPTURES = {
    // ── Les captures de l'accueil : elles montrent désormais le commutateur.
    'accueil-rapide': async () => {
        const page = await ouvrir();
        await capturer(page, 'caramel-mode-rapide.png', ['.prompt-generator', '.pc-commutateur']);
        return page;
    },
    'accueil-avance': async () => {
        const page = await ouvrir();
        await page.click('.mode-tab[data-mode="advanced"]');
        await page.waitForTimeout(500);
        await capturer(page, 'caramel-mode-avance.png', ['.prompt-generator', '.pc-commutateur']);
        return page;
    },
    'accueil-activites': async () => {
        const page = await ouvrir();
        await capturer(page, 'caramel-activites.png', ['.pc-commutateur', '.filter-bar', '.grid > [data-module]:nth-child(-n+10)']);
        return page;
    },
    'caramelia': async () => {
        const page = await ouvrir({ largeur: 1256, hauteur: 761, densite: 1, cadrage: false });
        await page.click('#caramelia-fab');
        await page.waitForSelector('#caramelia-panel .caramelia-msg__bubble');
        await page.waitForTimeout(600);
        await page.screenshot({ path: join(DOSSIER, 'caramelia-assistant.png'), type: 'png' });
        console.log('  ✓ caramelia-assistant.png  (fenêtre 1256×761)');
        return page;
    },
    // ── Pour le diaporama de présentation (scripts/diaporama/) : l'accueil entier, en-tête
    // compris, et la fenêtre d'une tuile en mode Guidé, où le prompt se lit et se modifie.
    'accueil-entier': async () => {
        const page = await ouvrir({ largeur: 1440, hauteur: 900, cadrage: false });
        await page.addStyleTag({ content: '#caramelia-fab,#notification-toast-container,#emergency-notification-container{display:none!important}' });
        const png = join(temp, 'caramel-accueil.png');
        await page.screenshot({ path: png, type: 'png' });
        versWebp(png, join(DOSSIER, 'caramel-accueil.webp'));
        console.log('  ✓ caramel-accueil.webp  (fenêtre 1440×900)');
        return page;
    },
    'generation-guide': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await page.fill('#qui', QUI);
        await page.fill('#quoi', 'Les fractions en 5e : égalité, simplification, comparaison');
        await page.click('[data-module="QuizSetQCM"]');
        await page.waitForSelector('#module-sidebar.open');
        await page.locator('#module-sidebar .switch').click();
        await page.waitForSelector('#quizSetQcmResultat', { state: 'visible' });
        await page.waitForTimeout(800);
        const png = join(temp, 'caramel-generation.png');
        await page.locator('#module-sidebar').screenshot({ path: png });
        versWebp(png, join(DOSSIER, 'caramel-generation.webp'));
        console.log('  ✓ caramel-generation.webp');
        return page;
    },
    'tutoriel': async () => {
        const page = await ouvrir({ largeur: 1221, hauteur: 878, densite: 1, cadrage: false });
        await page.click('#help-button');
        await page.waitForSelector('#tutorial-modal', { state: 'visible' });
        await page.waitForTimeout(600);
        await page.screenshot({ path: join(DOSSIER, 'modale_tutoriels.PNG'), type: 'png' });
        console.log('  ✓ modale_tutoriels.PNG  (fenêtre 1221×878)');
        return page;
    },

    // ── Les étapes du parcours, sur un parcours réel.
    'parcours-cadrage': async () => {
        const page = await ouvrir();
        await remplirFormulaire(page);
        await page.click('#parcours-button');
        await page.waitForSelector('.pc-choice');
        await page.waitForTimeout(600);
        // Jusqu'à la question des chemins (D91), sous l'ampleur.
        await capturer(page, 'parcours-cadrage', ['.prompt-generator', '.pc-commutateur', '.pc-navigation', '.pc-page > .pc-block:nth-of-type(-n+4)', '.pc-page > .pc-block:has(.pc-choices--2)'], { webp: true });
        return page;
    },
    'parcours-trames': async () => {
        const page = await ouvrir();
        await remplirFormulaire(page);
        await page.click('#parcours-button');
        await page.waitForSelector('.pc-trames');
        // Une séance : la vitrine montre ses quatre intentions (D102).
        await page.click('.pc-choice[data-choix="courte"]');
        await page.locator('.pc-trames > *', { hasText: 'Réviser avant l' }).first().click();
        await page.waitForTimeout(600);
        // L'en-tête et les deux premières rangées : la bibliothèque entière ferait une image démesurée.
        // Trois modèles, puis « Voir les autres modèles » (D92).
        await capturer(page, 'parcours-trames', ['.pc-page > .pc-block:has(.pc-trames) > .pc-block__head', '.pc-trames > *:nth-child(-n+7)', '.pc-trames__autres'], { webp: true, cadre: ATELIER });
        return page;
    },
    'parcours-plan': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page);
        await capturer(page, 'parcours-plan', ['.pc-navigation', '.pc-overview', '.pc-relecture', '.pc-etape:nth-of-type(-n+2)'], { webp: true, cadre: ATELIER });
        return page;
    },
    // ── Les chemins selon les résultats (D90, D99).
    'parcours-chemins': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcoursAChemins(page);
        await capturer(page, 'parcours-chemins', ['.pc-etape:has(.pc-carte__aiguille)', '.pc-aiguillage'], { webp: true, cadre: ATELIER });
        return page;
    },
    'parcours-eleve': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcoursAChemins(page);
        await page.click('.pc-aiguillage__voir');
        await page.waitForSelector('dialog.pc-eleve[open]');
        await page.locator('.pc-eleve .pc-segment__b', { hasText: 'Pendant son chemin' }).click();
        await page.locator('#pc-eleve-score').fill('4');
        await page.waitForTimeout(400);
        const png = join(temp, 'parcours-eleve.png');
        await page.locator('dialog.pc-eleve').screenshot({ path: png });
        versWebp(png, join(DOSSIER, 'parcours-eleve.webp'));
        console.log('  ✓ parcours-eleve.webp');
        return page;
    },
    'parcours-mosaique': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcours(page);
        await page.click('.pc-select.pc-choix');
        await page.waitForSelector('dialog.pc-mosaique[open]');
        await page.waitForTimeout(600);
        const png = join(temp, 'parcours-mosaique.png');
        await page.locator('dialog.pc-mosaique').screenshot({ path: png });
        versWebp(png, join(DOSSIER, 'parcours-mosaique.webp'));
        console.log('  ✓ parcours-mosaique.webp');
        return page;
    },
    'parcours-miroir': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page);
        await capturer(page, 'parcours-miroir', ['.pc-block:has(> .pc-miroir)', '.pc-block:has(> .pc-miroir) + *'], { webp: true, cadre: ATELIER });
        return page;
    },
    'parcours-fabrication': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page, { aFabriquer: 3 });
        await page.click('#pc-cta');
        // La première activité prête, la deuxième en cours : la fabrication, sous les yeux.
        await page.waitForFunction(() => (document.querySelector('.pc-body')?.innerText || '').includes('4 activité(s) sur 6'), null, { timeout: 30000 });
        await page.waitForTimeout(300);
        await capturer(page, 'parcours-fabrication', ['.pc-navigation', '.pc-body'], { webp: true, cadre: ATELIER });
        return page;
    },
    'parcours-livraison': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page);
        await page.click('#pc-cta');
        await page.waitForFunction(() => /Livraison/.test(document.querySelector('#pc-steps .pc-steps__item--current')?.textContent || ''), null, { timeout: 30000 });
        await page.waitForTimeout(1500);
        await capturer(page, 'parcours-livraison', ['.pc-navigation', '.pc-body'], { webp: true, cadre: ATELIER });
        return page;
    },
};

let echecs = 0;
for (const [nom, faire] of Object.entries(CAPTURES)) {
    if (seulement && !seulement.includes(nom)) continue;
    console.log(`▶ ${nom}`);
    try {
        const page = await faire();
        if (page.erreurs.length) { echecs++; console.error(`  ✗ erreurs JavaScript : ${page.erreurs.join(' | ')}`); }
        await page.close();
    } catch (e) { echecs++; console.error(`  ✗ ${e.message}`); }
}
await browser.close();
// Le serveur tient la boucle d'événements ouverte : sans cet arrêt, le script ne rend jamais la main.
server.kill('SIGTERM');
process.exitCode = echecs ? 1 : 0;
