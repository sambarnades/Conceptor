#!/usr/bin/env node
/**
 * Fabrique le diaporama de présentation de Caramel, pour les collègues qui forment
 * dans leur établissement, et la version que la page /decouvrir/ fait défiler.
 *
 *   node scripts/diaporama/generer-diaporama.mjs                  tout
 *   node scripts/diaporama/generer-diaporama.mjs --date=2026-09-29
 *   node scripts/diaporama/generer-diaporama.mjs --sans-rendu     le .pptx seul
 *
 * **À relancer à chaque version de Caramel** : la version est lue dans le pied de page
 * d'`index.html`, la date est celle du jour (ou `--date`). Les deux figurent sur la
 * couverture, en pied de chaque diapositive et dans `diaporama.json`.
 *
 * Ce qui sort, dans `assets/presentation/diaporama/` (publié avec `assets/`) :
 *   - `caramel-presentation.pptx` — PowerPoint, sans animation, notes du présentateur ;
 *   - `caramel-presentation.odp`  — LibreOffice Impress, converti par LibreOffice ;
 *   - `caramel-presentation.pdf`  — à imprimer ou à projeter tel quel ;
 *   - `diapositives/NN.webp`      — le rendu de chaque diapositive, pour la visionneuse ;
 *   - `diaporama.json`            — version, date, fichiers, titres et notes (lu par le banc) ;
 *   - dans `decouvrir/index.html`, entre les repères `diaporama:debut` et `diaporama:fin`, la
 *     visionneuse ÉCRITE EN DUR : première diapositive, sommaire, toutes les notes, tailles des
 *     fichiers. Rien ne s'y charge après coup, donc rien ne saute à l'affichage (pas de FOUC) ;
 *     le script de la page ne fait que passer d'une diapositive à l'autre.
 *
 * Les captures viennent de `assets/images/wiki/` (refaites par
 * `scripts/captures-interface.mjs` : les refaire AVANT si l'interface a changé), sauf
 * celle de la Sucrerie, site externe, gardée dans `scripts/diaporama/sources/`.
 *
 * Outillage (hors produit, comme Playwright) : pptxgenjs et playwright dans
 * `tests/roundtrip/` (`npm install` là-bas), Python + PIL, LibreOffice (`soffice`),
 * `pdftoppm` (Poppler). Les icônes sont celles de Font Awesome, déjà dans `css/vendor/`,
 * rendues en PNG par Playwright ; les QR codes, par la bibliothèque déjà dans `js/vendor/`.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const PptxGenJS = require('pptxgenjs');
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const option = nom => (argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=')[1];
const SANS_RENDU = argv.includes('--sans-rendu');

const SORTIE = join(ROOT, 'assets/presentation/diaporama');
const NOM = 'caramel-presentation';
const temp = mkdtempSync(join(tmpdir(), 'diaporama-'));
process.on('exit', () => rmSync(temp, { recursive: true, force: true }));

// ─────────────────────────────────────────────────────────────── Version et date
const VERSION = readFileSync(join(ROOT, 'index.html'), 'utf8').match(/Caramel v(\d+\.\d+\.\d+)/)?.[1];
if (!VERSION) throw new Error('version introuvable dans le pied de page d’index.html');
const jour = option('date') ? new Date(`${option('date')}T12:00:00`) : new Date();
const DATE_ISO = jour.toISOString().slice(0, 10);
const DATE = jour.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const MOIS = jour.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

// ─────────────────────────────────────────────────────────────── Charte
// Les couleurs de l'application (css/base/style.css) : fond gris clair, cartes blanches,
// bleu pour les actions, caramel pour la marque. Aucune teinte inventée.
const C = {
    encre: '1D1D1F', encre2: '4A4A4F', encre3: '6E6E73',
    fond: 'F5F5F7', surface: 'FFFFFF', trait: 'E5E5EA',
    creme: 'FFF7EC', creme2: 'FFECD4',
    caramel: 'F39438', caramelFonce: 'B4551A', caramelTexte: '8F4014',
    bleu: '007AFF', bleuFonce: '0056B3', bleuDoux: 'EAF3FF',
    h5p: '0862C4', elea: 'B9459B', magistere: '064CA4', moodle: '8F4800',
    prune: '9A4F7E', roseClair: 'FFE8EE', vert: '1F7A3F', vertDoux: 'E8F5EC', grisDoux: 'EDEDF0',
};
const POLICE = 'Arial';
const W = 13.333, H = 7.5, X0 = 0.6, XW = W - 2 * X0;

const LIENS = {
    caramel: 'https://caramel.forge.apps.education.fr/',
    decouvrir: 'https://caramel.forge.apps.education.fr/decouvrir/',
    sucrerie: 'https://sucrerie.forge.apps.education.fr/',
    wiki: 'https://forge.apps.education.fr/caramel/caramel/-/wikis/home',
    tchap: 'https://edurl.fr/caramel-tchap',
    video: 'https://podeduc.apps.education.fr/video/161411-caramel-7/',
    forge: 'https://forge.apps.education.fr/caramel/caramel',
    tickets: 'https://forge.apps.education.fr/caramel/caramel/-/issues',
    bas: 'https://caramel.forge.apps.education.fr/bas/',
    sucrerieTchap: 'https://edurl.fr/sucrerie-tchap',
};

// Les chiffres de fréquentation ne se lisent nulle part dans le dépôt : ils viennent des
// supports de formation de l'équipe. Les ACTUALISER ici (valeurs et date) quand l'équipe
// en publie de nouveaux ; la date s'affiche en note sous les chiffres.
const CHIFFRES = { generations: '159 000', tchap: '300+', date: 'septembre 2026' };
const sansProtocole = url => url.replace(/^https:\/\//, '').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────── Images
/**
 * Les captures passent par PIL : recadrage éventuel, largeur plafonnée, JPEG 4:4:4
 * (le sous-échantillonnage des couleurs baverait sur le texte des interfaces).
 * PowerPoint et LibreOffice ne lisent pas tous le WebP : tout sort en JPEG ou PNG.
 */
const IMAGES = {
    accueil: { src: 'assets/images/wiki/caramel-accueil.webp', max: 2000 },
    rapide: { src: 'assets/images/wiki/caramel-mode-rapide.png', max: 2000 },
    avance: { src: 'assets/images/wiki/caramel-mode-avance.png', max: 1800 },
    activites: { src: 'assets/images/wiki/caramel-activites.png', max: 2000 },
    generation: { src: 'assets/images/wiki/caramel-generation.webp', max: 1600 },
    apercu: { src: 'assets/images/wiki/modale_visualisation.PNG', crop: [180, 0, 1580, 660], max: 1600 },
    barre: { src: 'assets/images/wiki/vers-sucrerie.webp', max: 1405 },
    editeur: { src: 'assets/images/wiki/caramel-menu-edition.webp', crop: [64, 20, 1216, 780], max: 1400 },
    cadrage: { src: 'assets/images/wiki/parcours-cadrage.webp', crop: [0, 540, 2184, 2044], max: 1800 },
    chemins: { src: 'assets/images/wiki/parcours-chemins.webp', crop: [0, 690, 2184, 1650], max: 1800 },
    eleve: { src: 'assets/images/wiki/parcours-eleve.webp', max: 1400 },
    plan: { src: 'assets/images/wiki/parcours-plan.webp', crop: [0, 0, 2184, 1990], max: 1600 },
    fabrication: { src: 'assets/images/wiki/parcours-fabrication.webp', crop: [0, 0, 2184, 1400], max: 1600 },
    livraison: { src: 'assets/images/wiki/parcours-livraison.webp', crop: [0, 0, 2184, 1605], max: 1600 },
    caramelia: { src: 'assets/images/wiki/caramelia-assistant.png', max: 1256 },
    sucrerie: { src: 'scripts/diaporama/sources/sucrerie-accueil.webp', crop: [0, 0, 2880, 1640], max: 1800 },
    emmanuel: { src: 'assets/images/presentation/emmanuel-gaunard.jpg', crop: [0, 80, 987, 1067], max: 600 },
    gauthier: { src: 'assets/images/presentation/gauthier-remande.jpg', crop: [37, 0, 1006, 969], max: 600 },
};

function preparerImages() {
    const travaux = Object.entries(IMAGES).map(([cle, i]) => ({ cle, src: join(ROOT, i.src), crop: i.crop || null, max: i.max, out: join(temp, `${cle}.jpg`) }));
    const script = `
import json, sys
from PIL import Image
res = {}
for t in json.load(open(sys.argv[1])):
    im = Image.open(t['src']).convert('RGB')
    if t['crop']: im = im.crop(tuple(t['crop']))
    if im.width > t['max']:
        im = im.resize((t['max'], round(im.height * t['max'] / im.width)), Image.LANCZOS)
    im.save(t['out'], 'JPEG', quality=90, subsampling=0, optimize=True)
    res[t['cle']] = [im.width, im.height]
print(json.dumps(res))`;
    const fichier = join(temp, 'travaux.json');
    writeFileSync(fichier, JSON.stringify(travaux));
    const r = spawnSync('python3', ['-c', script, fichier], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`préparation des images : ${r.stderr}`);
    const tailles = JSON.parse(r.stdout);
    for (const t of travaux) IMAGES[t.cle] = { ...IMAGES[t.cle], chemin: t.out, largeur: tailles[t.cle][0], hauteur: tailles[t.cle][1] };
}

// ─────────────────────────────────────────────────────────────── Icônes, logos, QR codes
const ICONES = {}; // clé → chemin PNG
/** Une icône demandée sans avoir été rendue dans cette couleur arrête tout : pptxgenjs, lui, poserait un cadre vide. */
const icone = (nom, couleur) => {
    const cle = `${nom}|${couleur}`;
    if (Object.keys(ICONES).length && !ICONES[cle]) throw new Error(`icône non rendue : ${nom} en #${couleur} (l’ajouter à ICONES_A_RENDRE)`);
    return cle;
};
const ICONES_A_RENDRE = [
    ['sliders', C.caramelFonce], ['eye', C.caramelFonce], ['file-pen', C.caramelFonce],
    ['user-shield', C.caramelFonce], ['laptop', C.caramelFonce], ['server', C.caramelFonce], ['microphone', C.caramelFonce],
    ['circle-info', C.bleuFonce], ['circle-check', C.vert], ['circle-minus', C.encre3], ['file-lines', C.caramelFonce],
    ['paste', C.caramelFonce], ['file-arrow-up', C.caramelFonce], ['image', C.caramelFonce], ['headphones', C.caramelFonce], ['link', C.caramelFonce],
    ['display', C.caramelFonce], ['print', C.caramelFonce], ['share-nodes', C.prune],
    ['magnifying-glass', C.caramelFonce], ['user-lock', C.caramelFonce], ['copyright', C.caramelFonce], ['flask', C.caramelFonce], ['bug', C.caramelFonce],
    ['circle-question', C.caramelFonce], ['puzzle-piece', C.prune], ['book', C.caramelFonce], ['comments', C.caramelFonce], ['code-branch', C.caramelFonce], ['users', C.caramelFonce],
    ['globe', C.caramelFonce], ['film', C.caramelFonce], ['star', C.caramelFonce], ['wand-magic-sparkles', C.caramelFonce], ['puzzle-piece', C.caramelFonce],
    ['arrow-right', C.encre3], ['envelope', C.bleuFonce], ['lock', C.caramelFonce], ['route', C.caramelFonce], ['pen-to-square', C.caramelFonce],
];

async function rendreIconesEtQr() {
    const fa = pathToFileURL(join(ROOT, 'css/vendor/fontawesome/7.3.1/css/all.min.css')).href;
    const qrLib = pathToFileURL(join(ROOT, 'js/vendor/qrcode/2.0.4/qrcode.js')).href;
    const img = f => pathToFileURL(join(ROOT, f)).href;
    const html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${fa}">
<style>body{margin:0;background:transparent}.i{width:256px;height:256px;display:flex;align-items:center;justify-content:center;font-size:190px}
.l{width:512px;height:512px;display:flex;align-items:center;justify-content:center}.l img{width:512px;height:512px;object-fit:contain}
.q{width:600px;height:600px;background:#fff}.q svg{width:600px;height:600px;display:block}</style>
${ICONES_A_RENDRE.map(([n, c], k) => `<div class="i" id="i${k}"><i class="fas fa-${n}" style="color:#${c}"></i></div>`).join('')}
<div class="l" id="logo-caramel"><img src="${img('assets/images/branding/logo_caramel.svg')}"></div>
<div class="l" id="logo-sucrerie"><img src="${img('assets/images/branding/sucrerie.svg')}"></div>
<div class="l" id="logo-tchap"><img src="${img('assets/images/branding/tchap.svg')}"></div>
<div class="l" id="logo-caramelia"><img src="${img('assets/images/branding/logo_caramel_2.png')}"></div>
<div class="q" id="qr-caramel"></div><div class="q" id="qr-decouvrir"></div><div class="q" id="qr-sucrerie"></div>
<script src="${qrLib}"></script>
<script>
for (const [id, url] of ${JSON.stringify([['qr-caramel', LIENS.caramel], ['qr-decouvrir', LIENS.decouvrir], ['qr-sucrerie', LIENS.sucrerie]])}) {
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    document.getElementById(id).innerHTML = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}
</script>`;
    const fichier = join(temp, 'icones.html');
    writeFileSync(fichier, html);
    const navigateur = await chromium.launch();
    const page = await navigateur.newPage({ deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(fichier).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    for (const [k, [n, c]] of ICONES_A_RENDRE.entries()) {
        const out = join(temp, `icone-${k}.png`);
        await page.locator(`#i${k}`).screenshot({ path: out, omitBackground: true });
        ICONES[`${n}|${c}`] = out;
    }
    for (const id of ['logo-caramel', 'logo-sucrerie', 'logo-tchap', 'logo-caramelia', 'qr-caramel', 'qr-decouvrir', 'qr-sucrerie']) {
        const out = join(temp, `${id}.png`);
        await page.locator(`#${id}`).screenshot({ path: out, omitBackground: id.startsWith('logo') });
        ICONES[id] = out;
    }
    await navigateur.close();
}

// ─────────────────────────────────────────────────────────────── Aides de mise en page
let pres;
const ombre = () => ({ type: 'outer', blur: 9, offset: 2, angle: 90, color: '000000', opacity: 0.09 });

function texte(s, contenu, opts) {
    s.addText(contenu, { fontFace: POLICE, color: C.encre, margin: 0, valign: 'top', isTextBox: true, ...opts });
}

function carte(s, x, y, w, h, { fond = C.surface, bord = C.trait, avecOmbre = true, rayon = 0.16 } = {}) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w, h, rectRadius: rayon, fill: { color: fond },
        line: bord ? { color: bord, width: 0.75 } : { type: 'none' },
        ...(avecOmbre ? { shadow: ombre() } : {}),
    });
}

/** Une capture posée sur une carte blanche, comme les captures du tutoriel. Rend sa hauteur. */
function capture(s, cle, x, y, { w, h, marge = 0.08 }) {
    const i = IMAGES[cle];
    const ratio = i.largeur / i.hauteur;
    let lw = w ?? h * ratio, lh = h ?? w / ratio;
    if (w && h) { if (w / h > ratio) { lw = h * ratio; lh = h; } else { lw = w; lh = w / ratio; } }
    const cx = w && h ? x + (w - lw) / 2 : x;
    carte(s, cx - marge, y - marge, lw + 2 * marge, lh + 2 * marge, { rayon: 0.12 });
    s.addImage({ path: i.chemin, x: cx, y, w: lw, h: lh, altText: i.alt || '' });
    return { x: cx, y, w: lw, h: lh };
}

/** Un pictogramme dans une pastille crème, le motif des cartes de la page de présentation. */
function pastille(s, nom, x, y, { taille = 0.56, fond = C.creme2, couleur = C.caramelFonce, rond = false } = {}) {
    s.addShape(rond ? pres.shapes.OVAL : pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: taille, h: taille, fill: { color: fond }, line: { type: 'none' }, ...(rond ? {} : { rectRadius: taille * 0.28 }),
    });
    const p = taille * 0.24;
    s.addImage({ path: ICONES[icone(nom, couleur)], x: x + p, y: y + p, w: taille - 2 * p, h: taille - 2 * p });
}

function numero(s, n, x, y, { taille = 0.46, fond = C.bleu, couleur = 'FFFFFF', corps = 15 } = {}) {
    s.addShape(pres.shapes.OVAL, { x, y, w: taille, h: taille, fill: { color: fond }, line: { type: 'none' } });
    texte(s, String(n), { x, y, w: taille, h: taille, align: 'center', valign: 'middle', fontSize: corps, bold: true, color: couleur });
}

/**
 * Paragraphes à puces ; chaque élément est une chaîne ou un tableau de segments.
 * La puce ne va QUE sur le premier segment : pptxgenjs ouvre un nouveau paragraphe à
 * chaque segment qui la porte (un « gras » suivi de son texte faisait deux puces).
 */
function puces(s, elements, { x, y, w, h, corps = 15, couleur = C.encre2, espace = 8, puce = true }) {
    const runs = [];
    elements.forEach((el, k) => {
        const segments = typeof el === 'string' ? [{ text: el }] : el;
        segments.forEach((seg, j) => {
            const dernier = j === segments.length - 1;
            runs.push({
                text: seg.text,
                options: {
                    ...(puce && j === 0 ? { bullet: { indent: corps * 1.05 } } : {}),
                    paraSpaceAfter: espace, color: couleur, ...seg.options,
                    ...(dernier && k < elements.length - 1 ? { breakLine: true } : {}),
                },
            });
        });
    });
    texte(s, runs, { x, y, w, h, fontSize: corps, lineSpacingMultiple: 1.05 });
}

const gras = text => ({ text, options: { bold: true, color: C.encre } });
const exposant = n => ({ text: String(n), options: { superscript: true } });
const lien = (text, url, extra = {}) => ({ text, options: { hyperlink: { url, tooltip: url }, color: C.bleuFonce, ...extra } });

// ─────────────────────────────────────────────────────────────── Les diapositives
// Chaque entrée : partie, titre, notes (dites au présentateur, et lues sous l'image
// dans la visionneuse de la page) et la fonction qui dessine.
const DIAPOSITIVES = [];
const diapo = (d) => DIAPOSITIVES.push(d);

function entete(s, partie, titre) {
    if (partie) texte(s, partie, { x: X0, y: 0.42, w: XW, h: 0.3, fontSize: 12, bold: true, color: C.caramelTexte });
    texte(s, titre, { x: X0, y: 0.72, w: XW, h: 0.72, fontSize: 30, bold: true, valign: 'middle' });
}

function notesDeBas(s, runs) {
    texte(s, runs, { x: X0, y: 6.28, w: XW, h: 0.66, fontSize: 9.5, color: C.encre3, valign: 'bottom', lineSpacingMultiple: 1.05 });
}

const PARTIES = ['1 · Nos principes', '2 · Créer une activité', '3 · Créer un parcours', '4 · Partager et se faire aider'];

// 1 ── Couverture
diapo({
    titre: 'Caramel', fond: C.surface, sansPied: true,
    notes: `Caramel est une application web gratuite, sans compte, qui prépare avec l'IA des activités interactives et des parcours complets pour Éléa, Magistère et Moodle. Ce diaporama présente ce qu'elle fait, comment elle fonctionne et ce à quoi nous tenons : la main laissée à l'enseignant et la protection des données. Il correspond à Caramel ${VERSION} ; il est mis à jour à chaque version.`,
    dessiner(s) {
        s.addImage({ path: ICONES['logo-caramel'], x: 0.85, y: 1.15, w: 1.15, h: 1.15 });
        texte(s, 'Caramel', { x: 0.85, y: 2.45, w: 5.6, h: 0.95, fontSize: 54, bold: true });
        texte(s, 'Préparer avec l’IA des activités interactives et des parcours pour Éléa, Magistère et Moodle', { x: 0.85, y: 3.45, w: 5.4, h: 1.25, fontSize: 21, color: C.encre2, lineSpacingMultiple: 1.1 });
        texte(s, 'Création Assistée de Ressources et d’Activités Magistère et Éléa', { x: 0.85, y: 4.72, w: 5.4, h: 0.3, fontSize: 12, italic: true, color: C.encre3 });
        texte(s, [lien('caramel.forge.apps.education.fr', LIENS.caramel, { bold: true })], { x: 0.85, y: 5.55, w: 5.4, h: 0.35, fontSize: 16 });
        texte(s, `Support de présentation · Caramel v${VERSION} · ${DATE}`, { x: 0.85, y: 6.05, w: 5.6, h: 0.3, fontSize: 12, color: C.encre3 });
        capture(s, 'accueil', 6.7, 1.45, { w: 6.1 });
    },
});

// 2 ── Qui sommes-nous
diapo({
    titre: 'Qui sommes-nous ?',
    notes: 'Caramel est né de deux enseignants en poste, qui l’ont d’abord conçu pour leurs propres classes. Emmanuel Gaunard enseigne les mathématiques et est chargé de mission à la DRANE de Grenoble ; Gauthier Remande enseigne les lettres et l’histoire en lycée professionnel, dans l’académie de Nantes. Le projet est un logiciel libre, développé en ouvert sur la Forge des communs numériques éducatifs : chacun peut en lire le code, signaler un problème ou proposer une idée.',
    dessiner(s) {
        entete(s, null, 'Qui sommes-nous ?');
        texte(s, 'Deux enseignants, un projet commun pour préparer et partager des activités pédagogiques.', { x: X0, y: 1.5, w: XW, h: 0.4, fontSize: 17, color: C.encre2 });
        const personnes = [
            { cle: 'emmanuel', nom: 'Emmanuel Gaunard', fonction: 'Professeur de mathématiques\nChargé de mission DRANE', academie: 'Académie de Grenoble', mail: 'emmanuel.gaunard@ac-grenoble.fr' },
            { cle: 'gauthier', nom: 'Gauthier Remande', fonction: 'Professeur de Lettres-Histoire\nen lycée professionnel\nMembre de l’équipe nationale Éléa', academie: 'Académie de Nantes', mail: 'gauthier.remande@ac-nantes.fr' },
        ];
        const lw = (XW - 0.4) / 2;
        personnes.forEach((p, k) => {
            const x = X0 + k * (lw + 0.4), y = 2.2;
            carte(s, x, y, lw, 2.6);
            s.addImage({ path: IMAGES[p.cle].chemin, x: x + 0.35, y: y + 0.375, w: 1.85, h: 1.85, rounding: true, altText: `Portrait de ${p.nom}` });
            texte(s, p.nom, { x: x + 2.55, y: y + 0.3, w: lw - 2.8, h: 0.45, fontSize: 21, bold: true });
            texte(s, p.fonction, { x: x + 2.55, y: y + 0.8, w: lw - 2.8, h: 0.8, fontSize: 13.5, color: C.encre2, lineSpacingMultiple: 1.05 });
            texte(s, p.academie, { x: x + 2.55, y: y + 1.66, w: lw - 2.8, h: 0.3, fontSize: 13, color: C.encre3 });
            s.addImage({ path: ICONES[icone('envelope', C.bleuFonce)], x: x + 2.55, y: y + 2.09, w: 0.2, h: 0.2 });
            texte(s, [lien(p.mail, `mailto:${p.mail}`)], { x: x + 2.85, y: y + 2.05, w: lw - 3.0, h: 0.3, fontSize: 13 });
        });
        const bas = [
            ['code-branch', 'Un logiciel libre', 'Licence GNU AGPL v3, code ouvert sur la Forge des communs numériques éducatifs.'],
            ['users', 'Une communauté', 'Des collègues qui testent, signalent et proposent, sur Tchap et dans les tickets.'],
            ['star', 'Gratuit, sans compte', 'Ni abonnement, ni inscription, ni publicité : Caramel s’ouvre dans le navigateur.'],
        ];
        const bw = (XW - 0.6) / 3;
        bas.forEach(([ic, t, d], k) => {
            const x = X0 + k * (bw + 0.3), y = 5.2;
            pastille(s, ic, x, y);
            texte(s, t, { x: x + 0.72, y: y - 0.02, w: bw - 0.75, h: 0.3, fontSize: 14, bold: true });
            texte(s, d, { x: x + 0.72, y: y + 0.3, w: bw - 0.75, h: 0.75, fontSize: 12, color: C.encre2 });
        });
    },
});

// 3 ── Origines
diapo({
    titre: 'D’où vient Caramel ?',
    notes: `Au départ, en 2025, il y a deux enseignants et deux outils, pour un même besoin : gagner du temps grâce à l’IA. Gauthier voulait accélérer la création d’activités H5P pour Éléa ; sa première interface a été présentée au MoodleMoot de juin 2025. Emmanuel voulait refaire plus vite ses parcours Magistère, avec un site qui générait des activités H5P. Leur rencontre, grâce à Bertrand Chartier, a fait converger les deux projets en un seul outil commun, sur la Forge des communs numériques éducatifs. Le projet est bénévole ; il est soutenu par la Direction du numérique pour l’éducation et son incubateur, qui fournissent l’accès à des modèles d’IA hébergés en France. Les chiffres datent de ${CHIFFRES.date}.`,
    dessiner(s) {
        entete(s, null, 'D’où vient Caramel ?');
        texte(s, 'Deux enseignants, deux outils, un même besoin : gagner du temps grâce à l’IA.', { x: X0, y: 1.5, w: XW, h: 0.4, fontSize: 17, color: C.encre2 });
        const temps = [
            ['Début 2025', 'Côté Gauthier', 'Gagner du temps sur la création des H5P pour Éléa. Une première interface, présentée au MoodleMoot de juin 2025.'],
            ['Début 2025', 'Côté Emmanuel', 'Refaire plus vite ses parcours Magistère. Un site qui génère des activités H5P avec l’IA.'],
            ['Été 2025', 'Naissance de Caramel', 'Leur rencontre, grâce à Bertrand Chartier, réunit les deux projets en un outil commun, sur la Forge.'],
        ];
        const cw = (XW - 0.6) / 3;
        temps.forEach(([quand, t, d], k) => {
            const x = X0 + k * (cw + 0.3), y = 2.15;
            const fin = k === 2;
            carte(s, x, y, cw, 2.2, fin ? { fond: C.creme, bord: 'EEE0CF' } : {});
            texte(s, quand, { x: x + 0.3, y: y + 0.25, w: cw - 0.6, h: 0.3, fontSize: 12, bold: true, color: C.caramelTexte });
            texte(s, t, { x: x + 0.3, y: y + 0.55, w: cw - 0.6, h: 0.4, fontSize: 18, bold: true });
            texte(s, d, { x: x + 0.3, y: y + 1.0, w: cw - 0.6, h: 1.1, fontSize: 13.5, color: C.encre2 });
            if (k < 2) s.addImage({ path: ICONES[icone('arrow-right', C.encre3)], x: x + cw + 0.06, y: y + 0.98, w: 0.18, h: 0.18 });
        });
        const chiffres = [[CHIFFRES.generations, 'générations d’activités', 'depuis novembre 2025'], [CHIFFRES.tchap, 'membres', 'dans la communauté Tchap'], ['Pépite', 'de la Forge', '2026']];
        chiffres.forEach(([n, l, d], k) => {
            const x = X0 + k * (cw + 0.3), y = 4.65;
            texte(s, n, { x, y, w: cw, h: 0.6, fontSize: 32, bold: true, color: C.caramelFonce });
            texte(s, [gras(`${l} `), { text: d, options: { color: C.encre3 } }], { x, y: y + 0.62, w: cw, h: 0.55, fontSize: 13 });
        });
        notesDeBas(s, [{ text: `Un projet bénévole, soutenu par la Direction du numérique pour l’éducation (DNE) et son incubateur. Chiffres de ${CHIFFRES.date}.` }]);
    },
});

// 4 ── En bref
diapo({
    titre: 'Caramel en bref',
    notes: 'Caramel prépare des activités prêtes à importer dans la plateforme de l’établissement. Trente-cinq types d’activités sont proposés : vingt-sept au format H5P, le format libre d’activités interactives que lisent Éléa, Magistère et Moodle, et huit modules propres à Moodle, comme la Page, le Livre ou le Test. Tout se passe dans le navigateur, sans compte. On peut aussi obtenir une version papier de chaque activité, en Word, LibreOffice ou PDF.',
    dessiner(s) {
        entete(s, null, 'Caramel en bref');
        texte(s, 'Une application web qui prépare avec l’IA des activités prêtes à importer dans votre plateforme. Vous relisez, vous corrigez, vous décidez.', { x: X0, y: 1.5, w: XW, h: 0.7, fontSize: 17, color: C.encre2 });
        const chiffres = [
            ['35', 'types d’activités', '27 H5P¹ · 8 Moodle'],
            ['3', 'plateformes', 'Éléa · Magistère · Moodle'],
            ['12', 'langues d’interface', 'du breton au japonais'],
            ['0 €', 'et aucun compte', 'tout se passe dans le navigateur'],
        ];
        const cw = (XW - 0.75) / 4;
        chiffres.forEach(([n, l, d], k) => {
            const x = X0 + k * (cw + 0.25), y = 2.45;
            carte(s, x, y, cw, 1.95);
            texte(s, n, { x: x + 0.3, y: y + 0.25, w: cw - 0.6, h: 0.8, fontSize: 44, bold: true, color: C.caramelFonce });
            texte(s, l, { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 0.35, fontSize: 15, bold: true });
            texte(s, d, { x: x + 0.3, y: y + 1.42, w: cw - 0.6, h: 0.35, fontSize: 12, color: C.encre3 });
        });
        texte(s, 'Ce que Caramel produit', { x: X0, y: 4.75, w: 5, h: 0.35, fontSize: 15, bold: true });
        const formats = [
            ['.h5p', 'activité interactive', C.h5p], ['.mbz', 'activité ou cours Moodle', C.moodle], ['.xml', 'questions, glossaire', C.magistere],
            ['DOCX', 'Word', C.encre2], ['ODT', 'LibreOffice', C.encre2], ['PDF', 'à imprimer', C.encre2],
        ];
        const fw = (XW - 5 * 0.2) / 6;
        formats.forEach(([f, d, c], k) => {
            const x = X0 + k * (fw + 0.2), y = 5.2;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: fw, h: 0.78, rectRadius: 0.12, fill: { color: C.surface }, line: { color: c, width: 1 } });
            texte(s, f, { x, y: y + 0.1, w: fw, h: 0.32, fontSize: 15, bold: true, color: c, align: 'center' });
            texte(s, d, { x, y: y + 0.44, w: fw, h: 0.26, fontSize: 11, color: C.encre3, align: 'center' });
        });
        notesDeBas(s, [exposant(1), { text: ' H5P : format libre d’activités interactives (quiz, textes à trous, vidéos interactives…), lu nativement par Éléa, Magistère et Moodle. Un fichier .mbz est une sauvegarde Moodle : une activité seule, ou un cours entier.' }]);
    },
});

// 5 ── Au programme
diapo({
    titre: 'Au programme',
    notes: 'La présentation suit quatre temps. D’abord ce qui nous tient à cœur, parce que c’est ce qui distingue Caramel : la main laissée à l’enseignant, la protection des données, les programmes intégrés à bon escient. Ensuite la création d’une activité, étape par étape. Puis la création d’un parcours complet. Enfin le partage sur la Sucrerie et les appuis pour se faire aider.',
    dessiner(s) {
        entete(s, null, 'Au programme');
        const items = [
            ['Nos principes', 'Vous gardez la main, vos données sont protégées, les programmes sont intégrés quand c’est utile.'],
            ['Créer une activité', 'Décrire, ajouter ses sources, choisir, générer, relire, télécharger, importer.'],
            ['Créer un parcours', 'Cadrage, plan, fabrication, livraison : un cours complet dans un seul fichier.'],
            ['Partager et se faire aider', 'La Sucrerie, Caramelia, le tutoriel, le wiki, et les bons réflexes.'],
        ];
        const cw = (XW - 0.4) / 2;
        items.forEach(([t, d], k) => {
            const x = X0 + (k % 2) * (cw + 0.4), y = 1.75 + Math.floor(k / 2) * 2.45;
            carte(s, x, y, cw, 2.15);
            numero(s, k + 1, x + 0.4, y + 0.5, { taille: 0.66, corps: 21 });
            texte(s, t, { x: x + 1.4, y: y + 0.48, w: cw - 1.75, h: 0.45, fontSize: 22, bold: true });
            texte(s, d, { x: x + 1.4, y: y + 1.0, w: cw - 1.75, h: 0.95, fontSize: 15, color: C.encre2 });
        });
    },
});

// 6 ── La main
diapo({
    partie: PARTIES[0], titre: 'L’IA propose, vous décidez',
    notes: 'C’est le principe fondateur de Caramel : l’intelligence artificielle est une assistante, l’enseignant pilote. Avant la génération, c’est vous qui posez le cadre, et le prompt envoyé à l’IA n’est pas une boîte noire : on peut le lire et le modifier. Pendant, vous choisissez la voie — l’IA intégrée ou celle de votre choix — et vous relisez tout dans l’aperçu et l’éditeur. Après, rien n’est figé : le fichier se retravaille dans la plateforme ou dans un traitement de texte.',
    dessiner(s) {
        entete(s, PARTIES[0], 'L’IA propose, vous décidez');
        texte(s, 'À chaque étape, l’enseignant garde la main : avant, pendant et après la génération.', { x: X0, y: 1.5, w: XW, h: 0.4, fontSize: 17, color: C.encre2 });
        const colonnes = [
            ['sliders', 'Avant', ['Vous décrivez le besoin : public, thème, niveau, nombre de questions.', 'Vous choisissez vos sources : un cours, un PDF, une page web.', 'Le prompt envoyé à l’IA est visible et modifiable.']],
            ['eye', 'Pendant', ['Génération en un clic avec l’IA intégrée, ou copie du prompt vers l’IA de votre choix.', 'L’aperçu montre l’activité telle que les élèves la verront.', 'L’éditeur visuel corrige chaque question, réponse et retour.']],
            ['file-pen', 'Après', ['L’activité importée se modifie dans l’éditeur H5P de la plateforme.', 'Les exports Word et LibreOffice gardent des formules éditables.', 'Un parcours se rouvre dans Caramel pour être repris.']],
        ];
        const cw = (XW - 0.6) / 3;
        colonnes.forEach(([ic, t, lignes], k) => {
            const x = X0 + k * (cw + 0.3), y = 2.2;
            carte(s, x, y, cw, 4.05);
            pastille(s, ic, x + 0.35, y + 0.35, { taille: 0.62 });
            texte(s, t, { x: x + 1.15, y: y + 0.4, w: cw - 1.4, h: 0.5, fontSize: 22, bold: true, valign: 'middle' });
            puces(s, lignes, { x: x + 0.35, y: y + 1.2, w: cw - 0.65, h: 2.7, corps: 14, espace: 10 });
        });
    },
});

// 7 ── Les données
diapo({
    partie: PARTIES[0], titre: 'Vos données sont protégées',
    notes: 'Caramel ne demande aucun compte et ne collecte aucune donnée personnelle. Les documents que vous déposez sont lus dans votre navigateur : le fichier lui-même ne part sur aucun serveur. La génération en un clic s’appuie sur des modèles d’IA hébergés en France, sur des serveurs de l’Enseignement supérieur et de la recherche (le projet ILaaS), et non sur des IA grand public. La voix fait exception, et c’est dit dans l’application : elle est transcrite par Albert, le service souverain de la DINUM, sans être conservée. Rappel utile en formation : on ne saisit jamais de données personnelles d’élèves.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Vos données sont protégées');
        const blocs = [
            ['user-shield', 'Ni compte, ni suivi', 'Aucune donnée personnelle collectée, aucun cookie de suivi. Rien à créer pour commencer.'],
            ['laptop', 'Vos documents restent chez vous', 'Le texte des PDF, DOCX, images… est extrait dans votre navigateur : les fichiers ne partent sur aucun serveur.'],
            ['server', 'Des IA hébergées en France', [{ text: 'La génération en un clic passe par ILaaS, des serveurs de l’Enseignement supérieur et de la recherche. Aucune IA grand public' }, exposant(1), { text: '.' }]],
            ['microphone', 'La voix, transcrite en France', 'Dictée ou fichier audio : transcription par Albert, service souverain de la DINUM. L’audio n’est pas conservé.'],
        ];
        const cw = (XW - 0.3) / 2;
        blocs.forEach(([ic, t, d], k) => {
            const x = X0 + (k % 2) * (cw + 0.3), y = 1.7 + Math.floor(k / 2) * 1.62;
            carte(s, x, y, cw, 1.42);
            pastille(s, ic, x + 0.3, y + 0.32, { taille: 0.62 });
            texte(s, t, { x: x + 1.15, y: y + 0.25, w: cw - 1.4, h: 0.35, fontSize: 17, bold: true });
            texte(s, typeof d === 'string' ? d : d, { x: x + 1.15, y: y + 0.63, w: cw - 1.4, h: 0.7, fontSize: 13, color: C.encre2 });
        });
        carte(s, X0, 5.0, XW, 0.7, { fond: C.bleuDoux, bord: 'C5DAF2', avecOmbre: false });
        s.addImage({ path: ICONES[icone('circle-info', C.bleuFonce)], x: X0 + 0.3, y: 5.2, w: 0.3, h: 0.3 });
        texte(s, [gras('Bon réflexe : '), { text: 'ne saisissez jamais de nom ni d’information personnelle d’élève, ni dans les champs, ni dans les documents.', options: { color: C.encre } }], { x: X0 + 0.8, y: 5.0, w: XW - 1.1, h: 0.7, fontSize: 14, valign: 'middle' });
        notesDeBas(s, [exposant(1), { text: ' Deux cas, signalés dans l’application, vous engagent autrement : l’import d’une page web par son lien (le texte est extrait par nos serveurs, en France ; l’adresse n’est pas conservée) et le prompt que vous copiez vers une IA externe (les conditions de ce service s’appliquent). Détails : mentions légales de Caramel.' }]);
    },
});

// 8 ── Programmes
diapo({
    partie: PARTIES[0], titre: 'Les programmes scolaires, intégrés quand c’est utile',
    notes: 'Quand votre demande relève de l’école — un niveau de classe, un « professeur de 4e », une « seconde bac pro » — Caramel recherche dans les programmes officiels les passages utiles et les joint à la demande envoyée à l’IA : l’activité colle au programme de la classe. Quand la demande sort du scolaire — enseignement supérieur, formation d’adultes, thème imaginaire — il ne le fait pas, car les programmes n’apporteraient que du bruit. Et quand vous fournissez vos propres documents, ce sont eux la référence. Il n’y a aucun bouton : la décision se déduit de ce que vous avez saisi, dans les douze langues de l’interface.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Les programmes scolaires, intégrés quand c’est utile');
        // La demande, à gauche.
        const gx = X0, gy = 2.4, gw = 3.55, gh = 2.35;
        carte(s, gx, gy, gw, gh);
        texte(s, 'Votre demande', { x: gx + 0.3, y: gy + 0.25, w: gw - 0.6, h: 0.35, fontSize: 16, bold: true });
        const champ = (y, etiquette, valeur) => {
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + 0.3, y, w: gw - 0.6, h: 0.62, rectRadius: 0.1, fill: { color: 'FAFAFA' }, line: { color: C.trait, width: 0.75 } });
            texte(s, [{ text: `${etiquette}\n`, options: { fontSize: 10, color: C.encre3, breakLine: false } }, { text: valeur, options: { fontSize: 13, color: C.encre } }], { x: gx + 0.45, y: y + 0.07, w: gw - 0.9, h: 0.5 });
        };
        champ(gy + 0.75, 'Qui êtes-vous ?', 'Professeur de mathématiques');
        champ(gy + 1.5, 'Que souhaitez-vous aborder ?', 'Les fractions en 5e');
        // Les trois issues, à droite.
        const dx = X0 + 4.45, dw = XW - 4.45, dh = 1.2;
        const issues = [
            ['circle-check', C.vertDoux, C.vert, 'Un niveau ou un public scolaire est reconnu', [{ text: 'Caramel cherche dans les programmes officiels les passages utiles et les joint à la demande' }, exposant(1), { text: '. Exemples : « professeur de 4e », « CM2 », « seconde bac pro ».' }]],
            ['circle-minus', C.grisDoux, C.encre3, 'Public hors scolaire, ou thème libre', 'Enseignement supérieur, formation d’adultes, sujet imaginaire : les programmes n’apporteraient que du bruit. Ils ne sont pas ajoutés.'],
            ['file-lines', C.creme2, C.caramelFonce, 'Vous avez fourni vos documents', 'Vos sources font référence : l’IA travaille à partir d’elles, sans y mêler les programmes.'],
        ];
        issues.forEach(([ic, fond, couleur, t, d], k) => {
            const y = 1.58 + k * (dh + 0.16);
            carte(s, dx, y, dw, dh);
            pastille(s, ic, dx + 0.28, y + 0.29, { taille: 0.62, fond, couleur, rond: true });
            texte(s, t, { x: dx + 1.1, y: y + 0.17, w: dw - 1.35, h: 0.34, fontSize: 15, bold: true });
            texte(s, d, { x: dx + 1.1, y: y + 0.52, w: dw - 1.35, h: 0.62, fontSize: 12.5, color: C.encre2 });
            // Le trait qui relie la demande à chaque issue.
            const x1 = gx + gw, y1 = gy + gh / 2, x2 = dx, y2 = y + dh / 2;
            s.addShape(pres.shapes.LINE, {
                x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.max(Math.abs(y2 - y1), 0.001), flipV: y2 < y1,
                line: { color: 'C7C7CC', width: 1.25, endArrowType: 'triangle' },
            });
        });
        texte(s, 'Aucun réglage : la décision se déduit de ce que vous avez saisi, dans les 12 langues de l’interface.', { x: X0, y: 5.78, w: XW, h: 0.35, fontSize: 14, bold: true, color: C.encre });
        notesDeBas(s, [exposant(1), { text: ' Avec la génération en un clic. Technique dite RAG (génération augmentée par la recherche) : seuls les extraits pertinents des programmes sont transmis à l’IA. Un prompt copié vers une autre IA lui demande de s’appuyer sur les programmes officiels, sans en joindre les extraits.' }]);
    },
});

// 9 ── Décrire
diapo({
    partie: PARTIES[1], titre: '1. Décrivez votre besoin',
    notes: 'Tout commence par deux champs. Qui êtes-vous : une réponse courte suffit, « professeur de mathématiques », « formatrice académique ». Que souhaitez-vous aborder : c’est le cœur de la demande, et plus elle est précise, meilleure est l’activité — le thème, le niveau, les contraintes. Le mode avancé ajoute des champs structurés, dont le nombre de questions, et la zone des documents. Chaque champ peut aussi se dicter au micro.',
    dessiner(s) {
        entete(s, PARTIES[1], '1. Décrivez votre besoin');
        capture(s, 'rapide', X0 + 0.35, 1.7, { w: XW - 0.7 });
        const cols = [
            ['Mode rapide', 'Deux champs : qui vous êtes, ce que vous voulez aborder. Soyez précis : thème, niveau, contraintes.'],
            ['Mode avancé', 'Discipline, niveau, nombre de questions, consignes particulières… et vos documents.'],
            ['Au micro', 'Chaque champ se remplit aussi à la voix : un clic sur le micro, et vous parlez.'],
        ];
        const cw = (XW - 0.6) / 3;
        cols.forEach(([t, d], k) => {
            const x = X0 + k * (cw + 0.3), y = 5.05;
            texte(s, t, { x, y, w: cw, h: 0.35, fontSize: 17, bold: true });
            texte(s, d, { x, y: y + 0.42, w: cw, h: 0.9, fontSize: 14, color: C.encre2 });
        });
    },
});

// 10 ── Sources
diapo({
    partie: PARTIES[1], titre: '2. Ajoutez vos sources, si vous le souhaitez',
    notes: 'C’est facultatif, mais c’est souvent là que Caramel donne le meilleur. Dans le mode avancé, on colle un texte ou on dépose ses documents : un cours, un manuel en PDF, un diaporama, une photo de page, un enregistrement audio ou vidéo dont la bande-son est transcrite, ou encore une page web par son lien. L’IA travaille alors exclusivement à partir de ces sources : elles priment sur ses connaissances générales et sur les programmes. Sans document, l’IA s’appuie sur ses connaissances.',
    dessiner(s) {
        entete(s, PARTIES[1], '2. Ajoutez vos sources, si vous le souhaitez');
        texte(s, 'Avec vos documents, l’IA travaille exclusivement à partir d’eux : ils priment sur ses connaissances et sur les programmes.', { x: X0, y: 1.62, w: 5.55, h: 0.95, fontSize: 16, color: C.encre2 });
        const lignes = [
            ['paste', 'Coller un texte', 'jusqu’à 120 000 caractères'],
            ['file-arrow-up', 'Déposer des fichiers', 'PDF, DOCX, PPTX, ODT, ODP'],
            ['image', 'Des images', 'le texte est reconnu (OCR)'],
            ['headphones', 'De l’audio, de la vidéo', 'la bande-son est transcrite'],
            ['link', 'Une page web', 'collez simplement son lien'],
        ];
        lignes.forEach(([ic, t, d], k) => {
            const y = 2.75 + k * 0.72;
            pastille(s, ic, X0, y, { taille: 0.5 });
            texte(s, [gras(`${t}  `), { text: d, options: { color: C.encre2 } }], { x: X0 + 0.7, y, w: 4.9, h: 0.5, fontSize: 14, valign: 'middle' });
        });
        capture(s, 'avance', X0 + 5.95, 1.62, { w: XW - 5.95, h: 4.65 });
    },
});

// 11 ── Choisir
diapo({
    partie: PARTIES[1], titre: '3. Choisissez l’activité',
    notes: 'Chaque tuile est un type d’activité. Les filtres aident à s’y retrouver : par famille — quiz et tests, manipulation de texte, mémorisation et découverte — et par plateforme. Les activités H5P fonctionnent sur Éléa, Magistère et Moodle ; les modules Moodle, comme la Page, le Livre ou le Test, deviennent des éléments natifs du cours. Un clic sur une tuile ouvre sa fenêtre de génération.',
    dessiner(s) {
        entete(s, PARTIES[1], '3. Choisissez l’activité');
        const r = capture(s, 'activites', X0, 1.75, { w: 8.05 });
        const x = X0 + 8.55, w = XW - 8.55;
        puces(s, [
            [gras('35 tuiles'), { text: ' : 27 activités H5P, interactives, et 8 modules Moodle natifs.' }],
            [gras('Des filtres par famille'), { text: ' : quiz et tests, manipulation de texte, mémorisation et découverte.' }],
            [gras('Et par plateforme'), { text: ' : H5P, Éléa, Magistère, Moodle.' }],
        ], { x, y: 1.8, w, h: 3.2, corps: 14.5, espace: 12 });
        texte(s, 'Quelques exemples', { x: X0, y: r.y + r.h + 0.4, w: 5, h: 0.3, fontSize: 13, bold: true, color: C.encre3 });
        const exemples = ['Texte à trous', 'Glisser-déposer', 'Mots croisés', 'Frise chronologique', 'Dictée', 'Vidéo interactive', 'Livre', 'Test', 'Glossaire'];
        let ex = X0; const ey = r.y + r.h + 0.78;
        for (const e of exemples) {
            const ew = 0.3 + e.length * 0.085;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ex, y: ey, w: ew, h: 0.38, rectRadius: 0.19, fill: { color: C.surface }, line: { color: C.trait, width: 0.75 } });
            texte(s, e, { x: ex, y: ey, w: ew, h: 0.38, fontSize: 12, color: C.encre2, align: 'center', valign: 'middle' });
            ex += ew + 0.14;
        }
    },
});

// 12 ── Générer
diapo({
    partie: PARTIES[1], titre: '4. Générez : le prompt reste entre vos mains',
    notes: 'La fenêtre d’une tuile offre deux usages. En mode Simple, un seul bouton, « Générer en un clic » : l’IA intégrée, hébergée en France, prépare l’activité en quelques dizaines de secondes, et plusieurs modèles sont au choix. En mode Guidé, le prompt apparaît : c’est l’ensemble des consignes envoyées à l’IA. On peut le lire, le modifier, le verrouiller, ou le copier vers l’IA de son choix puis coller sa réponse dans le panneau de droite. Rien n’est caché : ce que l’IA reçoit, vous pouvez le lire.',
    dessiner(s) {
        entete(s, PARTIES[1], '4. Générez : le prompt reste entre vos mains');
        const x = X0, w = 6.1;
        texte(s, 'Mode Simple', { x, y: 1.75, w, h: 0.4, fontSize: 19, bold: true });
        texte(s, 'Un bouton : « Générer en un clic ». L’IA intégrée, hébergée en France, prépare l’activité. Plusieurs modèles au choix.', { x, y: 2.2, w, h: 0.9, fontSize: 15, color: C.encre2 });
        texte(s, 'Mode Guidé', { x, y: 3.3, w, h: 0.4, fontSize: 19, bold: true });
        texte(s, [{ text: 'Le prompt' }, exposant(1), { text: ' s’affiche : lisez-le, modifiez-le, verrouillez-le. Copiez-le vers l’IA de votre choix, puis collez sa réponse à droite.' }], { x, y: 3.75, w, h: 0.95, fontSize: 15, color: C.encre2 });
        carte(s, x, 4.95, w, 0.85, { fond: C.creme, bord: 'EEE0CF', avecOmbre: false });
        pastille(s, 'eye', x + 0.22, 5.1, { taille: 0.55, fond: C.creme2 });
        texte(s, 'Rien n’est caché : ce que l’IA reçoit, vous pouvez le lire.', { x: x + 0.95, y: 4.95, w: w - 1.1, h: 0.85, fontSize: 15, bold: true, valign: 'middle', color: C.caramelTexte });
        capture(s, 'generation', X0 + 6.65, 1.65, { w: XW - 6.65, h: 4.6 });
        notesDeBas(s, [exposant(1), { text: ' Prompt : les consignes envoyées à l’IA — votre contexte, des règles pédagogiques, le format attendu par la plateforme.' }]);
    },
});

// 13 ── Relire
diapo({
    partie: PARTIES[1], titre: '5. Relisez et corrigez',
    notes: 'Une fois l’activité générée, l’aperçu la montre telle que les élèves la verront, et on peut la jouer. L’éditeur visuel, derrière le bouton « Éditer », reprend chaque élément : à gauche la liste des questions ou des cartes, à droite le détail. Texte enrichi, formules mathématiques avec un assistant, images, réglages : tout se corrige sans toucher au code. C’est l’étape à ne jamais sauter — l’IA peut se tromper.',
    dessiner(s) {
        entete(s, PARTIES[1], '5. Relisez et corrigez');
        // Les deux largeurs cumulées doivent tenir dans la page, marges et écart compris.
        const ra = IMAGES.apercu.largeur / IMAGES.apercu.hauteur, re = IMAGES.editeur.largeur / IMAGES.editeur.hauteur;
        const hauteur = Math.min(3.4, (XW - 0.16 - 0.5) / (ra + re));
        const a = capture(s, 'apercu', X0 + 0.08, 1.8, { h: hauteur });
        const e = capture(s, 'editeur', X0 + XW - 0.08 - hauteur * IMAGES.editeur.largeur / IMAGES.editeur.hauteur, 1.8, { h: hauteur });
        const yl = 1.8 + hauteur + 0.35;
        texte(s, 'L’aperçu', { x: a.x, y: yl, w: a.w, h: 0.35, fontSize: 17, bold: true });
        texte(s, 'L’activité telle que les élèves la verront, à essayer avant tout téléchargement.', { x: a.x, y: yl + 0.4, w: a.w, h: 0.6, fontSize: 14, color: C.encre2 });
        texte(s, 'L’éditeur visuel', { x: e.x, y: yl, w: e.w, h: 0.35, fontSize: 17, bold: true });
        texte(s, 'Chaque question, réponse et retour : texte enrichi, formules mathématiques, images, réglages.', { x: e.x, y: yl + 0.4, w: e.w, h: 0.6, fontSize: 14, color: C.encre2 });
    },
});

// 14 ── Télécharger
diapo({
    partie: PARTIES[1], titre: '6. Téléchargez, imprimez, partagez',
    notes: 'La barre du bas de l’aperçu rassemble les sorties. Pour la plateforme : le fichier H5P, ou selon l’activité un .mbz ou un .xml pour la banque de questions et le glossaire. Pour la classe : une version imprimable en Word, LibreOffice ou PDF, où les formules mathématiques restent éditables. Et pour les collègues : « Vers la Sucrerie » dépose l’activité dans la bibliothèque partagée.',
    dessiner(s) {
        entete(s, PARTIES[1], '6. Téléchargez, imprimez, partagez');
        capture(s, 'barre', X0 + 0.9, 1.75, { w: XW - 1.8 });
        const blocs = [
            ['display', C.creme2, C.caramelFonce, 'Pour la plateforme', '.h5p, .mbz, .xml (banque de questions, glossaire) : à importer dans Éléa, Magistère ou Moodle.'],
            ['print', C.creme2, C.caramelFonce, 'Pour la classe', 'DOCX, ODT, PDF : l’énoncé et son corrigé, sur papier. Les formules restent éditables dans Word et LibreOffice.'],
            ['share-nodes', C.roseClair, C.prune, 'Pour les collègues', '« Vers la Sucrerie » dépose l’activité dans la bibliothèque partagée (partie 4).'],
        ];
        const cw = (XW - 0.6) / 3;
        blocs.forEach(([ic, fond, couleur, t, d], k) => {
            const x = X0 + k * (cw + 0.3), y = 3.05;
            carte(s, x, y, cw, 2.75);
            pastille(s, ic, x + 0.35, y + 0.35, { taille: 0.62, fond, couleur });
            texte(s, t, { x: x + 0.35, y: y + 1.17, w: cw - 0.7, h: 0.4, fontSize: 18, bold: true });
            texte(s, d, { x: x + 0.35, y: y + 1.62, w: cw - 0.7, h: 1.0, fontSize: 14, color: C.encre2 });
        });
    },
});

// 15 ── Importer
diapo({
    partie: PARTIES[1], titre: '7. Importez dans votre cours, et continuez à modifier',
    notes: 'Chaque format a son chemin d’import, détaillé avec captures dans le tutoriel intégré. Le fichier H5P s’ajoute comme toute activité H5P ; sur Éléa, un simple glisser-déposer dans la section suffit aussi. Le .mbz s’importe sans écraser le contenu du cours. Le .xml alimente la banque de questions ou un glossaire. Et l’activité n’est jamais figée : elle se modifie dans l’éditeur H5P de la plateforme, ou hors ligne avec des logiciels comme Lumi ou Logiquiz ; Digiquiz permet de la diffuser sans plateforme.',
    dessiner(s) {
        entete(s, PARTIES[1], '7. Importez dans votre cours, et continuez à modifier');
        const formats = [
            ['.h5p', C.h5p, 'Ajouter une activité ou une ressource › Contenu interactif (H5P) › Téléverser le fichier.'],
            ['.mbz', C.moodle, 'Menu d’édition › Import/Export › Importer un parcours › déposer le fichier. Le contenu du cours n’est pas écrasé.'],
            ['.xml', C.magistere, 'Banque de questions › Importer (format XML Magistère), ou Glossaire › Importer des articles.'],
        ];
        const lw = 7.35;
        formats.forEach(([f, c, d], k) => {
            const y = 1.7 + k * 1.22;
            carte(s, X0, y, lw, 1.04);
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X0 + 0.28, y: y + 0.27, w: 1.0, h: 0.5, rectRadius: 0.1, fill: { color: C.surface }, line: { color: c, width: 1.25 } });
            texte(s, f, { x: X0 + 0.28, y: y + 0.27, w: 1.0, h: 0.5, fontSize: 16, bold: true, color: c, align: 'center', valign: 'middle' });
            texte(s, d, { x: X0 + 1.55, y: y + 0.1, w: lw - 1.8, h: 0.84, fontSize: 13.5, color: C.encre2, valign: 'middle' });
        });
        const rx = X0 + lw + 0.35, rw = XW - lw - 0.35;
        carte(s, rx, 1.7, rw, 3.48, { fond: C.creme, bord: 'EEE0CF', avecOmbre: false });
        pastille(s, 'pen-to-square', rx + 0.35, 2.0, { taille: 0.62 });
        texte(s, 'Et après ?', { x: rx + 0.35, y: 2.8, w: rw - 0.7, h: 0.4, fontSize: 19, bold: true });
        puces(s, [
            'Dans la plateforme, l’activité se modifie avec l’éditeur H5P, comme toute autre.',
            'Hors plateforme, le .h5p s’ouvre dans Lumi ou Logiquiz, et se diffuse avec Digiquiz.',
            'Les documents DOCX et ODT se retravaillent dans Word ou LibreOffice.',
        ], { x: rx + 0.35, y: 3.25, w: rw - 0.6, h: 1.85, corps: 13, espace: 6 });
        texte(s, [gras('Le tutoriel intégré'), { text: ' (bouton « Tutoriel » en haut de Caramel) détaille chaque import, captures à l’appui.' }], { x: X0, y: 5.45, w: XW, h: 0.4, fontSize: 14, color: C.encre2 });
        notesDeBas(s, [{ text: 'Menus d’Éléa ; les intitulés peuvent varier légèrement sur Magistère et Moodle.' }]);
    },
});

// 16 ── Parcours : cadrage
diapo({
    partie: PARTIES[2], titre: 'Un parcours complet, en quatre temps',
    notes: 'Au-delà d’une activité, Caramel prépare un parcours entier : plusieurs activités organisées en étapes, livrées dans un seul fichier de cours. Le commutateur « Un parcours », sous le formulaire, ouvre l’atelier. Le cadrage tient en quatre questions : la plateforme, le déroulé — en classe, à distance ou les deux —, l’ampleur, d’une séance à une séquence entière, et le chemin des élèves : le même pour tous, ou des chemins selon les résultats d’un test. On peut aussi partir d’une trame toute faite : trois sont proposées, les autres sont à un clic.',
    dessiner(s) {
        entete(s, PARTIES[2], 'Un parcours complet, en quatre temps');
        const etapes = [['Cadrage', 'vos réglages'], ['Plan', 'relu et modifié'], ['Fabrication', 'activité par activité'], ['Livraison', 'un seul fichier de cours']];
        const ew = XW / 4;
        etapes.forEach(([t, d], k) => {
            const x = X0 + k * ew, y = 1.65;
            numero(s, k + 1, x, y + 0.02, { taille: 0.5, fond: k === 0 ? C.bleu : C.surface, couleur: k === 0 ? 'FFFFFF' : C.encre2, corps: 15 });
            if (k > 0) s.addShape(pres.shapes.OVAL, { x, y: y + 0.02, w: 0.5, h: 0.5, fill: { type: 'none' }, line: { color: 'C7C7CC', width: 1 } });
            texte(s, t, { x: x + 0.65, y: y - 0.02, w: ew - 0.8, h: 0.32, fontSize: 16, bold: true, color: k === 0 ? C.bleuFonce : C.encre });
            texte(s, d, { x: x + 0.65, y: y + 0.3, w: ew - 0.8, h: 0.3, fontSize: 12, color: C.encre3 });
            if (k < 3) s.addShape(pres.shapes.LINE, { x: x + ew - 0.45, y: y + 0.27, w: 0.3, h: 0, line: { color: 'C7C7CC', width: 1.25 } });
        });
        const r = capture(s, 'cadrage', X0 + 0.08, 2.65, { h: 3.55 });
        const x = r.x + r.w + 0.5, w = X0 + XW - x;
        puces(s, [
            [gras('« Un parcours »'), { text: ', sous le formulaire, ouvre l’atelier.' }],
            [gras('Quatre réglages'), { text: ' : la plateforme, le déroulé (en classe, à distance, les deux), l’ampleur (d’une séance à une séquence), un même chemin pour tous ou des chemins selon les résultats.' }],
            [gras('Ou une trame'), { text: ' toute faite : réviser avant une évaluation, découvrir une notion…' }],
        ], { x, y: 2.65, w, h: 3.6, corps: 14.5, espace: 12 });
    },
});

// 17 ── Parcours : plan
diapo({
    partie: PARTIES[2], titre: 'Le plan : relu, modifiable, à vous',
    notes: 'L’IA propose un plan : des étapes, des activités, leur durée et leurs consignes. Rien n’est imposé. On réordonne, on change le type d’une activité, on ajuste une durée, on ajoute ou on retire. Le cadenas réserve une place pour une activité dont on fournira soi-même le contenu. Une relecture didactique signale ce qui mérite attention, selon six repères. C’est seulement quand le plan vous convient que la fabrication commence.',
    dessiner(s) {
        entete(s, PARTIES[2], 'Le plan : relu, modifiable, à vous');
        const r = capture(s, 'plan', X0 + 0.08, 1.7, { h: 4.55 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('L’IA propose'), { text: ' les étapes, les activités, leur durée et leurs consignes.' }],
            [gras('Vous ajustez'), { text: ' : réordonner, changer un type d’activité, modifier une durée, ajouter, retirer.' }],
            [gras('Le cadenas'), { text: ' réserve une activité dont vous fournirez vous-même le contenu.' }],
            [gras('Une relecture didactique'), { text: ' signale ce qui mérite votre attention, selon six repères.' }],
        ], { x, y: 1.75, w, h: 4.5, corps: 15, espace: 14 });
    },
});

// 17 bis ── Parcours : des chemins selon les résultats (7.1.0)
diapo({
    partie: PARTIES[2], titre: 'Des chemins selon les résultats',
    notes: 'Au cadrage, on peut choisir des chemins selon les résultats. Un test — un quiz ou un Test de la plateforme — oriente chaque élève, d’après sa note à la première tentative, vers l’un de deux à quatre chemins : reprendre les bases, renforcer, consolider, approfondir. Chaque élève ne voit que le sien, puis tous se retrouvent pour une étape commune. Dans le plan, les seuils se règlent en nombre de bonnes réponses, jamais en pourcentage, et « Voir comme un élève » montre la page du cours telle qu’un élève la verra, selon son score. Le cours pose lui-même les restrictions d’accès ; on l’importe dans un cours vide. Pour réorienter un élève, il suffit de modifier sa note au test.',
    dessiner(s) {
        entete(s, PARTIES[2], 'Des chemins selon les résultats');
        const hEleve = 4.6;
        const lwEleve = hEleve * IMAGES.eleve.largeur / IMAGES.eleve.hauteur;
        const e = capture(s, 'eleve', X0 + XW - 0.08 - lwEleve, 1.7, { h: hEleve });
        const c = capture(s, 'chemins', X0 + 0.08, 1.7, { w: e.x - 0.55 - (X0 + 0.08) });
        const y = c.y + c.h + 0.35;
        puces(s, [
            [gras('Un test oriente'), { text: ' : sa note, à la première tentative, ouvre à chaque élève l’un de 2 à 4 chemins.' }],
            [gras('Chacun ne voit que le sien'), { text: ', puis tous se retrouvent ; les seuils se règlent en bonnes réponses.' }],
            [gras('Voir comme un élève'), { text: ' : la page du cours telle qu’il la verra, selon son score.' }],
        ], { x: c.x, y, w: c.w, h: 6.95 - y, corps: 14, espace: 8 });
    },
});

// 18 ── Parcours : fabrication et livraison
diapo({
    partie: PARTIES[2], titre: 'Fabrication et livraison : un seul fichier de cours',
    notes: 'La fabrication génère les activités une à une, sous vos yeux. Chacune peut être relue, essayée, modifiée ou générée à nouveau. À la livraison, un seul fichier .mbz contient tout le cours : sections, activités, consignes. Il se restaure dans un cours de la plateforme — un cours vide pour un parcours à chemins. Chaque parcours se termine par une section « Fin du parcours », et chaque activité affiche sa durée estimée. S’y ajoutent la fiche de séquence et le détail des activités en Word, LibreOffice ou PDF, et un fichier de scénario qui permet de rouvrir le parcours dans Caramel pour le reprendre plus tard.',
    dessiner(s) {
        entete(s, PARTIES[2], 'Fabrication et livraison : un seul fichier de cours');
        const hauteur = 3.45;
        const f = capture(s, 'fabrication', X0 + 0.08, 1.75, { h: hauteur });
        const lw = hauteur * IMAGES.livraison.largeur / IMAGES.livraison.hauteur;
        const l = capture(s, 'livraison', X0 + XW - 0.08 - lw, 1.75, { h: hauteur });
        texte(s, 'Fabrication', { x: f.x, y: 5.4, w: f.w, h: 0.35, fontSize: 17, bold: true });
        texte(s, 'Chaque activité est générée, puis relue, essayée, modifiée ou générée à nouveau.', { x: f.x, y: 5.77, w: f.w, h: 0.65, fontSize: 13.5, color: C.encre2 });
        texte(s, 'Livraison', { x: l.x, y: 5.4, w: l.w, h: 0.35, fontSize: 17, bold: true });
        texte(s, 'Un .mbz contient tout le cours. En plus : la fiche de séquence (DOCX, ODT, PDF) et le scénario pour reprendre plus tard.', { x: l.x, y: 5.77, w: l.w, h: 0.65, fontSize: 13.5, color: C.encre2 });
    },
});

// 19 ── Sucrerie
diapo({
    partie: PARTIES[3], titre: 'La Sucrerie : partager et piocher',
    notes: 'La Sucrerie est la bibliothèque publique qui accompagne Caramel. On y consulte et on y essaie les activités des collègues, on les télécharge dans de nombreux formats, et on y dépose les siennes — directement depuis Caramel avec le bouton « Vers la Sucrerie ». Déposer est un choix volontaire qui vaut publication : l’activité est diffusée sous licence libre CC BY-SA, et l’adresse académique sert seulement d’identifiant. On certifie détenir les droits et qu’aucune donnée personnelle n’y figure.',
    dessiner(s) {
        entete(s, PARTIES[3], 'La Sucrerie : partager et piocher');
        const w = 5.2;
        s.addImage({ path: ICONES['logo-sucrerie'], x: X0, y: 1.7, w: 0.75, h: 0.75 });
        texte(s, 'Une bibliothèque publique d’activités pédagogiques, en grande partie créées avec Caramel.', { x: X0 + 0.95, y: 1.68, w: w - 0.95, h: 0.8, fontSize: 15, color: C.encre2, valign: 'middle' });
        puces(s, [
            [gras('Consulter'), { text: ' et essayer les activités des collègues.' }],
            [gras('Télécharger'), { text: ' en version numérique ou papier : H5P, MBZ, DOCX, ODT, PDF…' }],
            [gras('Déposer'), { text: ' les vôtres, depuis Caramel avec « Vers la Sucrerie »' }, exposant(1), { text: '.' }],
            [gras('Regrouper'), { text: ' en collections thématiques, partagées par un seul lien.' }],
        ], { x: X0, y: 2.65, w, h: 2.1, corps: 14, espace: 7 });
        s.addImage({ path: ICONES['qr-sucrerie'], x: X0, y: 4.72, w: 1.2, h: 1.2 });
        texte(s, [{ text: 'Scannez ou ouvrez\n', options: { color: C.encre3, fontSize: 12 } }, lien('sucrerie.forge.apps.education.fr', LIENS.sucrerie, { bold: true, fontSize: 14 })], { x: X0 + 1.4, y: 4.9, w: w - 1.4, h: 0.8 });
        capture(s, 'sucrerie', X0 + w + 0.55, 1.7, { w: XW - w - 0.55 });
        notesDeBas(s, [exposant(1), { text: ' Déposer est volontaire et vaut publication, sous licence CC BY-SA 4.0. On se connecte avec son adresse académique (les adresses personnelles ne sont pas acceptées), qui sert uniquement d’identifiant. Vous certifiez détenir les droits et qu’aucune donnée personnelle ne figure dans l’activité.' }]);
    },
});

// 20 ── Aide
diapo({
    partie: PARTIES[3], titre: 'Vous n’êtes jamais seul',
    notes: 'Plusieurs appuis accompagnent les collègues après la formation. Caramelia, l’assistante intégrée — la bulle en bas à droite — répond aux questions sur l’outil et peut préparer une activité ou un parcours avec vous. Le tutoriel, en haut de l’écran, reprend chaque étape pas à pas. Le wiki est le guide complet. Et le salon Tchap réunit la communauté : questions, idées, entraide.',
    dessiner(s) {
        entete(s, PARTIES[3], 'Vous n’êtes jamais seul');
        const r = capture(s, 'caramelia', X0 + 0.08, 1.75, { w: 6.55 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        const appuis = [
            ['logo-caramelia', 'Caramelia', 'L’assistante intégrée répond sur l’outil et peut préparer une activité ou un parcours avec vous.'],
            ['circle-question', 'Le tutoriel', 'Bouton « Tutoriel » en haut de Caramel : pas à pas, imports compris.'],
            ['book', 'Le wiki', 'Le guide complet, captures à l’appui.'],
            ['logo-tchap', 'Tchap', 'Le salon de la communauté : questions, idées, entraide.'],
        ];
        appuis.forEach(([ic, t, d], k) => {
            const y = 1.75 + k * 1.1;
            if (ic.startsWith('logo')) {
                s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.56, h: 0.56, rectRadius: 0.16, fill: { color: C.creme2 }, line: { type: 'none' } });
                s.addImage({ path: ICONES[ic], x: x + 0.1, y: y + 0.1, w: 0.36, h: 0.36 });
            } else pastille(s, ic, x, y);
            texte(s, t, { x: x + 0.75, y: y - 0.03, w: w - 0.75, h: 0.32, fontSize: 16, bold: true });
            texte(s, d, { x: x + 0.75, y: y + 0.3, w: w - 0.75, h: 0.7, fontSize: 13, color: C.encre2 });
        });
    },
});

// 21 ── Bons réflexes
diapo({
    partie: PARTIES[3], titre: 'Les bons réflexes',
    notes: 'Cinq réflexes à transmettre. Relire avant de diffuser : l’IA peut se tromper sur un fait, une réponse, une consigne ; l’enseignant reste l’auteur de ce qu’il donne aux élèves. Protéger les élèves : aucune donnée personnelle. Respecter les droits des documents et des images utilisés. Tester l’activité sur un espace de test avant la classe. Et signaler les problèmes : c’est ainsi que Caramel s’améliore.',
    dessiner(s) {
        entete(s, PARTIES[3], 'Les bons réflexes');
        const reflexes = [
            ['magnifying-glass', 'Relire avant de diffuser', 'L’IA peut se tromper : un fait, une réponse, une consigne ambiguë. Vous restez l’auteur de ce que vous donnez aux élèves.'],
            ['user-lock', 'Protéger les élèves', 'Aucun nom, aucune donnée personnelle, ni dans les champs, ni dans les documents.'],
            ['copyright', 'Respecter les droits', 'Documents, images et textes utilisés doivent pouvoir l’être. En déposant sur la Sucrerie, vous le certifiez.'],
            ['flask', 'Tester avant la classe', 'Importez d’abord dans un espace de test et jouez l’activité comme un élève.'],
            ['bug', 'Signaler un problème', 'Un ticket sur la Forge ou un message sur Tchap, avec si possible le fichier JSON concerné.'],
        ];
        const cw = (XW - 0.3) / 2, ch = 1.5;
        reflexes.forEach(([ic, t, d], k) => {
            const x = X0 + (k % 2) * (cw + 0.3), y = 1.65 + Math.floor(k / 2) * (ch + 0.22);
            carte(s, x, y, cw, ch);
            pastille(s, ic, x + 0.3, y + 0.34, { taille: 0.62 });
            texte(s, t, { x: x + 1.15, y: y + 0.26, w: cw - 1.4, h: 0.36, fontSize: 17, bold: true });
            texte(s, d, { x: x + 1.15, y: y + 0.66, w: cw - 1.4, h: 0.75, fontSize: 13.5, color: C.encre2 });
        });
        const x = X0 + cw + 0.3, y = 1.65 + 2 * (ch + 0.22);
        carte(s, x, y, cw, ch, { fond: C.creme, bord: 'EEE0CF', avecOmbre: false });
        texte(s, 'L’IA propose, vous décidez.', { x: x + 0.3, y, w: cw - 0.6, h: ch, fontSize: 22, bold: true, color: C.caramelTexte, valign: 'middle', align: 'center' });
    },
});

// 22 ── Atelier
diapo({
    partie: null, titre: 'Proposer un atelier de 45 minutes',
    notes: 'Une proposition de déroulé pour une séance d’établissement. Cinq minutes de vidéo pour poser le décor, dix minutes de démonstration en direct sur une activité de la discipline du groupe, vingt minutes d’atelier où chacun prépare une activité pour sa classe, la relit et la corrige, puis dix minutes de retour collectif. Pour un format plus ludique, testé au MoodleMoot 2026 : chaque groupe prépare au moins trois activités sur un même thème et les rassemble dans une collection sur la Sucrerie, que les autres découvrent ensuite.',
    dessiner(s) {
        entete(s, null, 'Proposer un atelier de 45 minutes');
        const temps = [
            ['5 min', 'La vidéo', 'La présentation de Caramel 7 pour poser le décor : ce que l’outil prépare, et ses limites.'],
            ['10 min', 'En direct', 'Une démonstration sur une activité de la discipline du groupe, de la demande à l’aperçu.'],
            ['20 min', 'L’atelier', 'Chacun prépare une activité pour sa classe, la relit, la corrige, puis la dépose sur un espace de test.'],
            ['10 min', 'Le retour collectif', 'Ce que l’IA a bien fait, ce qu’il a fallu reprendre, et la place de la Sucrerie pour partager.'],
        ];
        const cw = (XW - 0.75) / 4;
        temps.forEach(([duree, t, d], k) => {
            const x = X0 + k * (cw + 0.25), y = 1.7;
            carte(s, x, y, cw, 3.1);
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: y + 0.32, w: 1.0, h: 0.42, rectRadius: 0.21, fill: { color: C.creme2 }, line: { type: 'none' } });
            texte(s, duree, { x: x + 0.3, y: y + 0.32, w: 1.0, h: 0.42, fontSize: 13, bold: true, color: C.caramelTexte, align: 'center', valign: 'middle' });
            texte(s, t, { x: x + 0.3, y: y + 0.98, w: cw - 0.6, h: 0.4, fontSize: 18, bold: true });
            texte(s, d, { x: x + 0.3, y: y + 1.45, w: cw - 0.6, h: 1.55, fontSize: 14, color: C.encre2 });
        });
        carte(s, X0, 5.15, XW, 1.25, { fond: C.roseClair, bord: 'EDDCE5', avecOmbre: false });
        pastille(s, 'puzzle-piece', X0 + 0.3, 5.48, { taille: 0.6, fond: C.surface, couleur: C.prune });
        texte(s, [
            { text: 'Variante en défi\n', options: { bold: true, color: C.prune, fontSize: 15 } },
            { text: 'Chaque groupe prépare au moins trois activités sur un même thème et les rassemble dans une collection sur la Sucrerie, que les autres groupes découvrent ensuite.', options: { color: C.encre2, fontSize: 13.5 } },
        ], { x: X0 + 1.15, y: 5.2, w: XW - 1.45, h: 1.15, valign: 'middle' });
    },
});

// 23 ── Liens
diapo({
    partie: null, titre: 'Liens utiles',
    notes: 'Tous les liens utiles, cliquables dans le diaporama. Le premier QR code ouvre Caramel directement sur un téléphone ou une tablette ; le second mène à la page de présentation, où l’on retrouve ce diaporama, la vidéo et des activités à essayer. Le bac à sable permet aux curieux de tester les nouveautés avant tout le monde, et de les commenter sur Tchap.',
    dessiner(s) {
        entete(s, null, 'Liens utiles');
        const liens = [
            ['wand-magic-sparkles', 'Caramel', LIENS.caramel],
            ['star', 'Découvrir Caramel : vidéo, diaporama, activités à essayer', LIENS.decouvrir],
            ['share-nodes', 'La Sucrerie, et son salon Tchap', LIENS.sucrerie, LIENS.sucrerieTchap],
            ['book', 'Le wiki : le guide complet', LIENS.wiki],
            ['comments', 'Le salon Tchap de Caramel', LIENS.tchap],
            ['film', 'La vidéo « Caramel 7 » (Podeduc)', LIENS.video],
            ['code-branch', 'Le code, les tickets, les nouveautés de chaque version', LIENS.forge],
            ['flask', 'Le bac à sable : les nouveautés avant tout le monde', LIENS.bas],
        ];
        const lw = 8.3;
        carte(s, X0, 1.55, lw, 4.85);
        liens.forEach(([ic, t, url, url2], k) => {
            const y = 1.75 + k * 0.57;
            pastille(s, ic, X0 + 0.3, y, { taille: 0.44, couleur: ic === 'share-nodes' ? C.prune : C.caramelFonce, fond: ic === 'share-nodes' ? C.roseClair : C.creme2 });
            const adresses = [lien(sansProtocole(url), url, { fontSize: 11 })];
            if (url2) adresses.push({ text: '  ·  ', options: { fontSize: 11, color: C.encre3 } }, lien(sansProtocole(url2), url2, { fontSize: 11 }));
            texte(s, [gras(`${t}\n`), ...adresses], { x: X0 + 0.95, y: y - 0.06, w: lw - 1.2, h: 0.52, fontSize: 13 });
        });
        const qx = X0 + lw + 0.4, qw = XW - lw - 0.4;
        [['qr-caramel', 'Ouvrir Caramel', LIENS.caramel], ['qr-decouvrir', 'Découvrir Caramel', LIENS.decouvrir]].forEach(([id, t, url], k) => {
            const y = 1.55 + k * 2.55;
            carte(s, qx, y, qw, 2.3);
            s.addImage({ path: ICONES[id], x: qx + 0.3, y: y + 0.3, w: 1.7, h: 1.7 });
            texte(s, t, { x: qx + 2.15, y: y + 0.55, w: qw - 2.3, h: 0.6, fontSize: 15, bold: true });
            texte(s, 'Scannez avec un téléphone ou une tablette.', { x: qx + 2.15, y: y + 1.15, w: qw - 2.3, h: 0.7, fontSize: 11.5, color: C.encre3 });
        });
    },
});

// 24 ── Fin
diapo({
    titre: 'À vous de jouer !', fond: C.surface, sansPied: true,
    notes: `Pour conclure : Caramel s’ouvre à l’adresse caramel.forge.apps.education.fr, gratuitement et sans compte. Invitez chacun à préparer une activité pour sa propre classe, à la relire dans l’éditeur, puis à la déposer sur un espace de test. Les contacts des deux co-créateurs figurent ici pour toute question. Ce support correspond à Caramel ${VERSION}, dans sa version du ${DATE}.`,
    dessiner(s) {
        s.addImage({ path: ICONES['logo-caramel'], x: (W - 1.2) / 2, y: 0.95, w: 1.2, h: 1.2 });
        texte(s, 'À vous de jouer !', { x: X0, y: 2.3, w: XW, h: 0.9, fontSize: 44, bold: true, align: 'center' });
        texte(s, 'Préparez votre première activité en quelques minutes : gratuit, sans compte, dans votre navigateur.', { x: X0 + 1.5, y: 3.2, w: XW - 3, h: 0.5, fontSize: 18, color: C.encre2, align: 'center' });
        s.addImage({ path: ICONES['qr-caramel'], x: (W - 1.55) / 2, y: 3.95, w: 1.55, h: 1.55 });
        texte(s, [lien('caramel.forge.apps.education.fr', LIENS.caramel, { bold: true })], { x: X0, y: 5.65, w: XW, h: 0.4, fontSize: 18, align: 'center' });
        texte(s, [
            { text: 'Emmanuel Gaunard · ' }, lien('emmanuel.gaunard@ac-grenoble.fr', 'mailto:emmanuel.gaunard@ac-grenoble.fr'),
            { text: '     Gauthier Remande · ' }, lien('gauthier.remande@ac-nantes.fr', 'mailto:gauthier.remande@ac-nantes.fr'),
        ], { x: X0, y: 6.3, w: XW, h: 0.3, fontSize: 12, color: C.encre2, align: 'center' });
        texte(s, `Caramel v${VERSION} · support mis à jour le ${DATE}`, { x: X0, y: 6.75, w: XW, h: 0.3, fontSize: 11, color: C.encre3, align: 'center' });
    },
});

// ─────────────────────────────────────────────────────────────── Assemblage
function construire() {
    pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    pres.author = 'Emmanuel Gaunard, Gauthier Remande';
    pres.company = 'Caramel';
    pres.title = `Caramel ${VERSION} — présentation`;
    pres.subject = 'Présenter Caramel en formation';
    pres.lang = 'fr-FR';
    const total = DIAPOSITIVES.length;
    DIAPOSITIVES.forEach((d, k) => {
        const s = pres.addSlide();
        s.background = { color: d.fond || C.fond };
        d.dessiner(s);
        if (!d.sansPied) {
            texte(s, `Caramel v${VERSION} · Présentation · ${MOIS}`, { x: X0, y: 7.02, w: 6, h: 0.26, fontSize: 9, color: C.encre3 });
            texte(s, `${k + 1} / ${total}`, { x: W - X0 - 1.5, y: 7.02, w: 1.5, h: 0.26, fontSize: 9, color: C.encre3, align: 'right' });
        }
        s.addNotes(d.notes);
    });
    return pres.writeFile({ fileName: join(temp, `${NOM}.pptx`) });
}

// ─────────────────────────────────────────────────────────────── Rendu (LibreOffice, Poppler)
function soffice() {
    for (const c of ['/Applications/LibreOffice.app/Contents/MacOS/soffice', 'soffice', 'libreoffice']) {
        if (c.startsWith('/') ? existsSync(c) : spawnSync('which', [c]).status === 0) return c;
    }
    throw new Error('LibreOffice (soffice) introuvable : relancer avec --sans-rendu pour le .pptx seul');
}

function convertir(format) {
    const profil = pathToFileURL(join(temp, 'profil-lo')).href;
    const r = spawnSync(soffice(), [`-env:UserInstallation=${profil}`, '--headless', '--convert-to', format, '--outdir', temp, join(temp, `${NOM}.pptx`)], { encoding: 'utf8', timeout: 180000 });
    const sortie = join(temp, `${NOM}.${format}`);
    if (r.status !== 0 || !existsSync(sortie)) throw new Error(`conversion ${format} : ${r.stderr || r.stdout}`);
    return sortie;
}

function rendreImages(pdf) {
    const dossier = join(temp, 'pages');
    mkdirSync(dossier);
    // 120 ppp sur 13,33 pouces : 1600 pixels de large, assez pour un écran de page web.
    const r = spawnSync('pdftoppm', ['-png', '-r', '120', pdf, join(dossier, 'p')], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`pdftoppm : ${r.stderr}`);
    const cible = join(SORTIE, 'diapositives');
    rmSync(cible, { recursive: true, force: true });
    mkdirSync(cible, { recursive: true });
    const script = `
import sys, os, json
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
res = []
for i, f in enumerate(sorted(os.listdir(src))):
    im = Image.open(os.path.join(src, f)).convert('RGB')
    nom = f'{i + 1:02d}.webp'
    im.save(os.path.join(dst, nom), 'WEBP', quality=84, method=6)
    res.append([nom, im.width, im.height])
print(json.dumps(res))`;
    const p = spawnSync('python3', ['-c', script, dossier, cible], { encoding: 'utf8' });
    if (p.status !== 0) throw new Error(`conversion WebP : ${p.stderr}`);
    return JSON.parse(p.stdout);
}

// ─────────────────────────────────────────────────────────────── Visionneuse de la page
const html = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tailleLisible = n => `${(n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;

/**
 * La visionneuse de /decouvrir/ est écrite dans la page, entre deux repères : la première
 * diapositive, le sommaire et TOUTES les notes y sont dès le premier affichage. Les notes sont
 * masquées par défaut (bouton « Notes ») et empilées dans une même case de grille, seule la
 * courante visible : ouverte, la zone prend la hauteur de la plus longue et ne bouge plus.
 */
function ecrireVisionneuse(m) {
    const d = m.diapositives, premiere = d[0];
    const racine = '../assets/presentation/diaporama/';
    const fichiers = [
        ['pptx', 'fa-file-powerpoint', 'PowerPoint', '.pptx'],
        ['odp', 'fa-file-lines', 'LibreOffice Impress', '.odp'],
        ['pdf', 'fa-file-pdf', 'PDF', 'à imprimer'],
    ];
    const r = '                ';
    const bloc = `<!-- diaporama:debut — écrit par scripts/diaporama/generer-diaporama.mjs : ne pas modifier à la main, relancer le script -->
            <div class="diaporama" id="visionneuse">
                <div class="diaporama__cadre">
                    <figure class="diaporama__scene" id="diapo-scene" tabindex="0">
                        <img id="diapo-image" src="${racine}${premiere.image}" alt="Diapositive 1 sur ${d.length} : ${html(premiere.titre)}" width="${premiere.largeur}" height="${premiere.hauteur}">
                    </figure>
                    <div class="diaporama__commandes">
                        <button type="button" class="diaporama__bouton" id="diapo-precedente" data-decouvrir-aria="slides_prev" aria-label="Diapositive précédente" disabled><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
                        <button type="button" class="diaporama__bouton" id="diapo-suivante" data-decouvrir-aria="slides_next" aria-label="Diapositive suivante"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                        <select class="diaporama__choix" id="diapo-choix" data-decouvrir-aria="slides_goto" aria-label="Aller à la diapositive">
${d.map((x, k) => `${r}        <option value="${k}" data-image="${x.image}"${k ? '' : ' selected'}>${k + 1}. ${html(x.titre)}</option>`).join('\n')}
                        </select>
                        <span class="diaporama__compteur" id="diapo-compteur">1 / ${d.length}</span>
                        <button type="button" class="diaporama__bouton diaporama__bouton--texte" id="diapo-notes-bouton" aria-expanded="false" aria-controls="diapo-notes-zone"><i class="fas fa-align-left" aria-hidden="true"></i><span data-decouvrir-key="slides_notes_toggle">Notes</span></button>
                        <button type="button" class="diaporama__bouton" id="diapo-plein-ecran" data-decouvrir-aria="slides_fullscreen" aria-label="Plein écran"><i class="fas fa-expand" aria-hidden="true"></i></button>
                    </div>
                    <div class="diaporama__notes" id="diapo-notes-zone" hidden>
                        <h3 data-decouvrir-key="slides_notes">Ce que l'on peut dire</h3>
                        <div class="diaporama__pile" id="diapo-notes">
${d.map((x, k) => `${r}        <p${k ? ' aria-hidden="true"' : ' class="actuelle"'}>${html(x.notes)}</p>`).join('\n')}
                        </div>
                    </div>
                </div>
                <ul class="diaporama__fichiers" id="diapo-fichiers">
${fichiers.map(([f, icone, nom, detail]) => `${r}    <li><a href="${racine}${m.fichiers[f].chemin}" download="Caramel-v${m.version}-presentation.${f}" data-format="${f}"><i class="fas ${icone}" aria-hidden="true"></i><span>${nom} <small>${detail} · ${tailleLisible(m.fichiers[f].octets)}</small></span><i class="fas fa-download" aria-hidden="true"></i></a></li>`).join('\n')}
                </ul>
                <p class="diaporama__version" id="diapo-version">Caramel v${m.version} · diaporama mis à jour le ${m.dateLisible}</p>
            </div>
            <!-- diaporama:fin -->`;
    const chemin = join(ROOT, 'decouvrir/index.html');
    const page = readFileSync(chemin, 'utf8');
    const motif = /<!-- diaporama:debut[\s\S]*?<!-- diaporama:fin -->/;
    if (!motif.test(page)) throw new Error('repères diaporama:debut / diaporama:fin absents de decouvrir/index.html');
    writeFileSync(chemin, page.replace(motif, () => bloc));
}

// ─────────────────────────────────────────────────────────────── Programme
console.log(`▶ Diaporama Caramel v${VERSION} — ${DATE}`);
preparerImages();
await rendreIconesEtQr();
await construire();
mkdirSync(SORTIE, { recursive: true });
copyFileSync(join(temp, `${NOM}.pptx`), join(SORTIE, `${NOM}.pptx`));
console.log(`  ✓ ${NOM}.pptx (${DIAPOSITIVES.length} diapositives)`);

if (SANS_RENDU) process.exit(0);

const pdf = convertir('pdf');
copyFileSync(pdf, join(SORTIE, `${NOM}.pdf`));
console.log(`  ✓ ${NOM}.pdf`);
copyFileSync(convertir('odp'), join(SORTIE, `${NOM}.odp`));
console.log(`  ✓ ${NOM}.odp`);
const pages = rendreImages(pdf);
if (pages.length !== DIAPOSITIVES.length) throw new Error(`${pages.length} pages rendues pour ${DIAPOSITIVES.length} diapositives`);
console.log(`  ✓ diapositives/ (${pages.length} images)`);

const taille = f => statSync(join(SORTIE, f)).size;
const manifeste = {
    '//': 'Écrit par scripts/diaporama/generer-diaporama.mjs — ne pas modifier à la main, relancer le script.',
    version: VERSION,
    date: DATE_ISO,
    dateLisible: DATE,
    fichiers: Object.fromEntries(['pptx', 'odp', 'pdf'].map(f => [f, { chemin: `${NOM}.${f}`, octets: taille(`${NOM}.${f}`) }])),
    diapositives: DIAPOSITIVES.map((d, k) => ({
        numero: k + 1,
        partie: d.partie ? d.partie.replace(/^\d+ · /, '') : null,
        titre: d.titre,
        image: `diapositives/${pages[k][0]}`,
        largeur: pages[k][1],
        hauteur: pages[k][2],
        notes: d.notes,
    })),
};
writeFileSync(join(SORTIE, 'diaporama.json'), JSON.stringify(manifeste, null, 2) + '\n');
console.log('  ✓ diaporama.json');
ecrireVisionneuse(manifeste);
console.log('  ✓ decouvrir/index.html (visionneuse)');
// Nettoyage de fichiers d'une version précédente qui ne seraient plus produits.
for (const f of readdirSync(SORTIE)) {
    if (!['diapositives', 'diaporama.json', `${NOM}.pptx`, `${NOM}.odp`, `${NOM}.pdf`].includes(f)) console.warn(`  ! fichier inattendu dans la sortie : ${f}`);
}
