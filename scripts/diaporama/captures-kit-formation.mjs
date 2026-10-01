#!/usr/bin/env node
/**
 * Les captures d'écran propres au kit de formation (`generer-kit-formation.mjs`), celles
 * que `scripts/captures-interface.mjs` ne fait pas pour le tutoriel et le wiki : le menu
 * des modèles, le mode Guidé avec une réponse collée, la fenêtre « Votre sucrerie est
 * prête ! », l'aperçu, l'aide à l'import, l'éditeur, le dépôt sur la Sucrerie, et, côté
 * parcours, les boutons du cadrage, l'annulation d'une modification, l'ouverture de
 * chemins, la fin du parcours, la vue élève et la livraison.
 *
 *   node scripts/diaporama/captures-kit-formation.mjs
 *   node scripts/diaporama/captures-kit-formation.mjs --seulement=apercu,editeur
 *   node scripts/diaporama/captures-kit-formation.mjs --port=8371
 *
 * Aucun appel au modèle, réseau coupé (seul le serveur local répond). L'activité montrée
 * est le texte à trous d'un parcours RÉEL du banc (`tests/fixtures/parcours-reels/
 * revision-fractions.json`), collé dans le panneau de droite du mode Guidé, comme le
 * ferait un enseignant revenant d'une autre IA. Les parcours sont repris par le vrai
 * bouton « Importer un modèle » de l'atelier.
 *
 * Sortie : `assets/presentation/kit-formation/captures/*.webp` (conversion par PIL).
 */
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { ROOT, chromium } from './commun.mjs';

const argv = process.argv.slice(2);
const option = nom => (argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=')[1];
const seulement = option('seulement')?.split(',').filter(Boolean);
const PORT = Number(option('port') || 8371);
const DOSSIER = join(ROOT, 'assets/presentation/kit-formation/captures');
const FRACTIONS = join(ROOT, 'tests/fixtures/parcours-reels/revision-fractions.json');
const PROPORTIONNALITE = join(ROOT, 'tests/fixtures/parcours-reels/elea-proportionnalite-chemins.json');
const QUI = 'Professeur de mathématiques';
const QUOI = 'Les fractions en 5e : simplifier une fraction';

/** Figer l'image ; l'en-tête fixe, la bulle de Caramelia et les notifications masqueraient la zone. */
const CSS = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
    + '.app-bar{position:static!important}#caramelia-fab,#notification-toast-container,#emergency-notification-container{display:none!important}'
    // Le voile sombre derrière les fenêtres déborderait dans les coins arrondis des captures :
    // il prend la couleur de fond des diapositives.
    + '.preview-modal-overlay,.generation-result-modal{background:#F5F5F7!important;backdrop-filter:none!important}';

mkdirSync(DOSSIER, { recursive: true });
const temp = mkdtempSync(join(tmpdir(), 'captures-kit-'));
const serveur = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { serveur.kill('SIGTERM'); } catch { /* déjà arrêté */ } rmSync(temp, { recursive: true, force: true }); });
await new Promise(r => setTimeout(r, 1500));
const navigateur = await chromium.launch();

async function ouvrir({ largeur = 1260, hauteur = 900 } = {}) {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 2, locale: 'fr-FR' });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0);
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: CSS });
    page.erreurs = erreurs;
    return page;
}

function versWebp(png, nom) {
    const r = spawnSync('python3', ['-c',
        'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=90, method=6)', png, join(DOSSIER, `${nom}.webp`)]);
    if (r.status !== 0) throw new Error(`conversion WebP : ${r.stderr}`);
    console.log(`  ✓ ${nom}.webp`);
}

/** Capture d'un élément (Playwright le fait défiler dans sa zone au besoin). */
async function element(page, nom, locator) {
    const png = join(temp, `${nom}.png`);
    await locator.screenshot({ path: png });
    versWebp(png, nom);
}

/** Capture du rectangle qui englobe tous les éléments visibles des sélecteurs, dans la fenêtre. */
async function zone(page, nom, selecteurs, marge = 12) {
    const clip = await page.evaluate(({ selecteurs, marge }) => {
        const b = selecteurs.flatMap(s => [...document.querySelectorAll(s)]).map(n => n.getBoundingClientRect()).filter(r => r.width && r.height);
        if (!b.length) return null;
        const x = Math.max(0, Math.min(...b.map(r => r.left)) - marge), y = Math.max(0, Math.min(...b.map(r => r.top)) - marge);
        return { x, y, width: Math.min(window.innerWidth, Math.max(...b.map(r => r.right)) + marge) - x, height: Math.min(window.innerHeight, Math.max(...b.map(r => r.bottom)) + marge) - y };
    }, { selecteurs, marge });
    if (!clip) throw new Error(`rien à capturer : ${selecteurs.join(', ')}`);
    const png = join(temp, `${nom}.png`);
    await page.screenshot({ path: png, clip });
    versWebp(png, nom);
}

const scenario = JSON.parse(readFileSync(FRACTIONS, 'utf8'));
const trous = scenario.plan.etapes.flatMap(e => e.cartes).find(c => c.module === 'FillInTheBlanks').contenu;

/** La tuile « Texte à trous », ouverte après avoir rempli le formulaire. */
async function ouvrirTuile(page) {
    await page.fill('#qui', QUI);
    await page.fill('#quoi', QUOI);
    await page.click('[data-module="FillInTheBlanks"]');
    await page.waitForSelector('#module-sidebar.open');
    await page.waitForTimeout(700);
}

/** Mode Guidé, réponse d'une autre IA collée à droite, « Générer l'activité ». */
async function genererDepuisReponseCollee(page) {
    await ouvrirTuile(page);
    await page.locator('#module-sidebar .switch').click();
    await page.waitForTimeout(500);
    await page.fill('#blanksJsonInput', JSON.stringify(trous, null, 2));
    await page.waitForTimeout(600);
}

async function apercu(page) {
    await genererDepuisReponseCollee(page);
    await page.click('#createBlanksH5P');
    await page.waitForSelector('.generation-result-modal__btn--secondary', { state: 'visible' });
    await page.waitForTimeout(600);
    await page.click('.generation-result-modal__btn--secondary');
    await page.waitForSelector('.preview-modal__help-btn', { state: 'visible' });
    // Le lecteur H5P se charge dans un cadre : lui laisser le temps de s'afficher.
    await page.waitForTimeout(5000);
}

async function ouvrirParcours(page, fichier, quoi = QUOI) {
    await page.fill('#qui', QUI);
    await page.fill('#quoi', quoi);
    await page.click('#parcours-button');
    await page.waitForTimeout(600);
    await page.setInputFiles('#pc-scenario-fichier', fichier);
    await page.waitForSelector('.pc-etape');
    await page.waitForTimeout(900);
}

/** L'ancêtre commun le plus proche de plusieurs éléments, marqué pour la capture. */
async function marquerAncetre(page, selecteurs, { attribut = 'data-capture-kit', monter = 0 } = {}) {
    await page.evaluate(({ selecteurs, attribut, monter }) => {
        const noeuds = selecteurs.map(s => document.querySelector(s)).filter(Boolean);
        let a = noeuds[0];
        while (a && !noeuds.every(n => a.contains(n))) a = a.parentElement;
        for (let k = 0; k < monter && a?.parentElement; k++) a = a.parentElement;
        a?.setAttribute(attribut, '');
    }, { selecteurs, attribut, monter });
    return page.locator(`[${attribut}]`).first();
}

const CAPTURES = {
    // ── Partie 1 : générer une activité
    'modeles': async () => {
        const page = await ouvrir();
        await ouvrirTuile(page);
        await page.click('#model-selector-btn-FillInTheBlanks');
        await page.waitForTimeout(500);
        // La carte de la fenêtre (titre, description, interrupteur) et le menu déroulé.
        await marquerAncetre(page, ['#module-sidebar .modal-title', '#module-sidebar .mode-switch-container']);
        await zone(page, 'modeles', ['[data-capture-kit]', '#model-selector-dropdown-FillInTheBlanks'], 10);
        return page;
    },
    'guide': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await genererDepuisReponseCollee(page);
        await element(page, 'guide', page.locator('#module-sidebar'));
        return page;
    },
    'resultat': async () => {
        const page = await ouvrir();
        await genererDepuisReponseCollee(page);
        await page.click('#createBlanksH5P');
        await page.waitForSelector('.generation-result-modal__btn--secondary', { state: 'visible' });
        await page.waitForTimeout(600);
        await page.click('.generation-result-modal__dropdown-toggle');
        await page.waitForTimeout(500);
        await zone(page, 'resultat', ['.generation-result-modal__card', '.generation-result-modal__dropdown'], 10);
        return page;
    },
    'apercu': async () => {
        const page = await ouvrir();
        await apercu(page);
        await element(page, 'apercu', page.locator('.preview-modal'));
        return page;
    },
    'aide-import': async () => {
        const page = await ouvrir();
        await apercu(page);
        await page.click('.preview-modal__help-btn');
        await page.waitForSelector('.help-popover__content', { state: 'visible' });
        await page.waitForTimeout(800);
        await element(page, 'aide-import', page.locator('.help-popover'));
        return page;
    },
    'editeur': async () => {
        const page = await ouvrir();
        await apercu(page);
        await page.click('.preview-modal__edit-btn');
        await page.waitForTimeout(1500);
        // La première phrase : l'éditeur des trous, plus parlant que la consigne.
        await page.locator('.preview-modal *', { hasText: /^La fraction 12\/18/ }).last().click();
        await page.waitForTimeout(800);
        await element(page, 'editeur', page.locator('.preview-modal'));
        return page;
    },
    'sucrerie': async () => {
        const page = await ouvrir();
        await apercu(page);
        await page.click('.sucrerie-bridge__btn');
        await page.waitForSelector('.sucrerie-bridge__panel', { state: 'visible' });
        await page.waitForTimeout(800);
        await element(page, 'sucrerie', page.locator('.preview-modal'));
        return page;
    },

    // ── Partie 2 : concevoir un parcours
    'cadrage-actions': async () => {
        const page = await ouvrir();
        await page.fill('#qui', QUI);
        await page.fill('#quoi', QUOI);
        await page.click('#parcours-button');
        await page.waitForSelector('.pc-trames');
        await page.locator('.pc-trames > *', { hasText: 'Réviser avant l' }).first().click();
        await page.waitForTimeout(500);
        const pied = await marquerAncetre(page, ['#pc-cta', '#pc-modele', '#pc-guide-open']);
        await pied.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await element(page, 'cadrage-actions', pied);
        return page;
    },
    'annulation': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcours(page, FRACTIONS);
        // Changer le type de la deuxième activité : le bandeau d'annulation apparaît.
        await page.locator('.pc-select.pc-choix').nth(1).click();
        await page.waitForSelector('dialog.pc-mosaique[open]');
        await page.waitForTimeout(400);
        await page.locator('dialog.pc-mosaique button', { hasText: 'Mots croisés' }).first().click();
        await page.waitForSelector('.pc-annulation', { state: 'visible' });
        await page.waitForTimeout(500);
        // Le bandeau s'affiche en haut du plan, au-dessus des étapes.
        await page.locator('.pc-annulation').scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await zone(page, 'annulation', ['.pc-annulation'], 14);
        return page;
    },
    'ouvrir-chemins': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcours(page, FRACTIONS);
        const bouton = page.locator('button', { hasText: 'Ouvrir des chemins selon ce test' }).first();
        await bouton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await element(page, 'ouvrir-chemins', page.locator('.pc-etape', { has: bouton }).first());
        return page;
    },
    'fin-parcours': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcours(page, FRACTIONS);
        const fin = page.locator('#pc-atelier *:not(script)', { hasText: 'Une page « Bilan du parcours »' }).last();
        // Remonter au bloc de la section « Fin du parcours » entier.
        const bloc = await fin.evaluateHandle(n => n.closest('.pc-etape, .pc-block, section, .pc-fin') || n.parentElement);
        await bloc.asElement().scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const png = join(temp, 'fin-parcours.png');
        await bloc.asElement().screenshot({ path: png });
        versWebp(png, 'fin-parcours');
        return page;
    },
    'eleve-fin': async () => {
        const page = await ouvrir({ hauteur: 1000 });
        await ouvrirParcours(page, PROPORTIONNALITE, 'La proportionnalité en 5e');
        await page.click('.pc-aiguillage__voir');
        await page.waitForSelector('dialog.pc-eleve[open]');
        await page.locator('.pc-eleve .pc-segment__b', { hasText: 'Parcours terminé' }).click();
        await page.waitForTimeout(500);
        // La fin de la page du cours : la section « Fin du parcours » et sa page de bilan.
        const fin = page.locator('dialog.pc-eleve *', { hasText: /^Fin du parcours$/ }).last();
        const section = await fin.evaluateHandle(n => { let a = n; while (a && a.parentElement && !/Bilan du parcours/.test(a.innerText)) a = a.parentElement; return a; });
        await section.asElement().scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const png = join(temp, 'eleve-fin.png');
        await section.asElement().screenshot({ path: png });
        versWebp(png, 'eleve-fin');
        return page;
    },
    'livraison': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page, FRACTIONS);
        await page.click('#pc-cta');
        await page.waitForFunction(() => /Livraison/.test(document.querySelector('#pc-steps .pc-steps__item--current')?.textContent || ''), null, { timeout: 60000 });
        await page.waitForTimeout(1500);
        await element(page, 'livraison', page.locator('.pc-body'));
        return page;
    },
    'livraison-chemins': async () => {
        const page = await ouvrir();
        await ouvrirParcours(page, PROPORTIONNALITE, 'La proportionnalité en 5e');
        await page.click('#pc-cta');
        await page.waitForFunction(() => /Livraison/.test(document.querySelector('#pc-steps .pc-steps__item--current')?.textContent || ''), null, { timeout: 60000 });
        await page.waitForTimeout(1500);
        const carte = await marquerAncetre(page, ['.pc-livrer__mbz', '.pc-body ol'], { monter: 1 });
        await element(page, 'livraison-chemins', carte);
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
    } catch (e) { echecs++; console.error(`  ✗ ${e.message.split('\n')[0]}`); }
}
await navigateur.close();
serveur.kill('SIGTERM');
process.exitCode = echecs ? 1 : 0;
