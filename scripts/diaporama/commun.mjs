/**
 * Ce que partagent les diaporamas de `scripts/diaporama/` : la charte, la version et la
 * date, la préparation des captures, le rendu des icônes et des QR codes, les aides de
 * mise en page (cartes, captures, pastilles, puces…) et la conversion par LibreOffice.
 *
 * Consommé par :
 *   - `generer-diaporama.mjs`      — le diaporama de présentation de /decouvrir/ ;
 *   - `generer-kit-formation.mjs`  — le kit de formation rapide (prise en main).
 *
 * Rien ici ne s'exécute à l'import : chaque script garde sa liste d'images, d'icônes et
 * de diapositives, et appelle ces fonctions avec elles. Toucher à une aide de mise en
 * page change les DEUX diaporamas : relancer les deux et regarder le rendu.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
export const PptxGenJS = require('pptxgenjs');
export const { chromium } = require('playwright');

// ─────────────────────────────────────────────────────────────── Version et date
/**
 * La version est lue dans le pied de page d'`index.html` ; la date est celle du jour, ou
 * `dateOption` (AAAA-MM-JJ).
 */
export function versionEtDate(dateOption) {
    const VERSION = readFileSync(join(ROOT, 'index.html'), 'utf8').match(/Caramel v(\d+\.\d+\.\d+)/)?.[1];
    if (!VERSION) throw new Error('version introuvable dans le pied de page d’index.html');
    const jour = dateOption ? new Date(`${dateOption}T12:00:00`) : new Date();
    // La date du jour en heure LOCALE : `toISOString()` passe en UTC et, après minuit à
    // Paris, donnait la veille (« 2026-09-30 » à côté de « 1er octobre 2026 »).
    const DATE_ISO = [jour.getFullYear(), String(jour.getMonth() + 1).padStart(2, '0'), String(jour.getDate()).padStart(2, '0')].join('-');
    // « 1er octobre », pas « 1 octobre » : l'ordinal du premier du mois, que `toLocaleDateString` n'écrit pas.
    const DATE = jour.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ');
    const MOIS = jour.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { VERSION, DATE_ISO, DATE, MOIS };
}

// ─────────────────────────────────────────────────────────────── Charte
// Les couleurs de l'application (css/base/style.css) : fond gris clair, cartes blanches,
// bleu pour les actions, caramel pour la marque. Aucune teinte inventée.
export const C = {
    encre: '1D1D1F', encre2: '4A4A4F', encre3: '6E6E73',
    fond: 'F5F5F7', surface: 'FFFFFF', trait: 'E5E5EA',
    creme: 'FFF7EC', creme2: 'FFECD4',
    caramel: 'F39438', caramelFonce: 'B4551A', caramelTexte: '8F4014',
    bleu: '007AFF', bleuFonce: '0056B3', bleuDoux: 'EAF3FF',
    h5p: '0862C4', elea: 'B9459B', magistere: '064CA4', moodle: '8F4800',
    prune: '9A4F7E', roseClair: 'FFE8EE', vert: '1F7A3F', vertDoux: 'E8F5EC', grisDoux: 'EDEDF0',
};
export const POLICE = 'Arial';
export const W = 13.333, H = 7.5, X0 = 0.6, XW = W - 2 * X0;

export const LIENS = {
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
export const sansProtocole = url => url.replace(/^https:\/\//, '').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────── Images
/**
 * Les captures passent par PIL : recadrage éventuel, largeur plafonnée, JPEG 4:4:4
 * (le sous-échantillonnage des couleurs baverait sur le texte des interfaces).
 * PowerPoint et LibreOffice ne lisent pas tous le WebP : tout sort en JPEG ou PNG.
 * `images` : { clé: { src, crop?, max, coins? } } — complété en place de `chemin`, `largeur`, `hauteur`.
 * `coins: true` blanchit les quatre coins d'une capture de fenêtre aux angles arrondis, où
 * transparaît le voile sombre de la page : sur la carte blanche de la diapositive, ils
 * dessinaient des triangles gris. À réserver aux captures d'UN élément (fenêtre, panneau),
 * dont les coins sont isolés : sur une capture de page, le remplissage déborderait.
 */
export function preparerImages(images, temp) {
    const travaux = Object.entries(images).map(([cle, i]) => ({ cle, src: join(ROOT, i.src), crop: i.crop || null, max: i.max, coins: i.coins || undefined, out: join(temp, `${cle}.jpg`) }));
    const script = `
import json, sys
from PIL import Image, ImageDraw
res = {}
for t in json.load(open(sys.argv[1])):
    im = Image.open(t['src']).convert('RGB')
    if t.get('coins'):
        for c in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
            ImageDraw.floodfill(im, c, (255, 255, 255), thresh=60)
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
    for (const t of travaux) images[t.cle] = { ...images[t.cle], chemin: t.out, largeur: tailles[t.cle][0], hauteur: tailles[t.cle][1] };
}

// ─────────────────────────────────────────────────────────────── Icônes, logos, QR codes
/**
 * Rend en PNG les icônes Font Awesome demandées (`[nom, couleur]`), les logos et les QR
 * codes ; remplit `icones` : « nom|couleur » → chemin, et « logo-… » / « qr-… » → chemin.
 * `qr` : liste de [id, url] (les id commencent par « qr- »).
 */
export async function rendreIconesEtQr({ aRendre, icones, temp, qr }) {
    const fa = pathToFileURL(join(ROOT, 'css/vendor/fontawesome/7.3.1/css/all.min.css')).href;
    const qrLib = pathToFileURL(join(ROOT, 'js/vendor/qrcode/2.0.4/qrcode.js')).href;
    const img = f => pathToFileURL(join(ROOT, f)).href;
    const html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${fa}">
<style>body{margin:0;background:transparent}.i{width:256px;height:256px;display:flex;align-items:center;justify-content:center;font-size:190px}
.l{width:512px;height:512px;display:flex;align-items:center;justify-content:center}.l img{width:512px;height:512px;object-fit:contain}
.q{width:600px;height:600px;background:#fff}.q svg{width:600px;height:600px;display:block}</style>
${aRendre.map(([n, c], k) => `<div class="i" id="i${k}"><i class="fas fa-${n}" style="color:#${c}"></i></div>`).join('')}
<div class="l" id="logo-caramel"><img src="${img('assets/images/branding/logo_caramel.svg')}"></div>
<div class="l" id="logo-sucrerie"><img src="${img('assets/images/branding/sucrerie.svg')}"></div>
<div class="l" id="logo-tchap"><img src="${img('assets/images/branding/tchap.svg')}"></div>
<div class="l" id="logo-caramelia"><img src="${img('assets/images/branding/logo_caramel_2.png')}"></div>
${qr.map(([id]) => `<div class="q" id="${id}"></div>`).join('')}
<script src="${qrLib}"></script>
<script>
for (const [id, url] of ${JSON.stringify(qr)}) {
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
    for (const [k, [n, c]] of aRendre.entries()) {
        const out = join(temp, `icone-${k}.png`);
        await page.locator(`#i${k}`).screenshot({ path: out, omitBackground: true });
        icones[`${n}|${c}`] = out;
    }
    for (const id of ['logo-caramel', 'logo-sucrerie', 'logo-tchap', 'logo-caramelia', ...qr.map(([id]) => id)]) {
        const out = join(temp, `${id}.png`);
        await page.locator(`#${id}`).screenshot({ path: out, omitBackground: id.startsWith('logo') });
        icones[id] = out;
    }
    await navigateur.close();
}

// ─────────────────────────────────────────────────────────────── Aides de mise en page
/**
 * Les espaces insécables de la typographie française : après « et avant », avant : ; ? !
 * Sans eux, un guillemet ou un deux-points finit seul en début ou en fin de ligne.
 */
export const insecables = t => String(t)
    .replace(/« /g, '«\u00A0').replace(/ »/g, '\u00A0»')
    .replace(/ ([:;?!])/g, '\u00A0$1');

/**
 * Les aides de dessin, liées à un diaporama : `presentation()` rend la présentation
 * pptxgenjs en cours (créée plus tard, dans `construire()`), `images` et `icones` sont
 * les tables du script appelant.
 */
export function outilsDeMiseEnPage({ presentation, images, icones, typographie = null }) {
    /** Une icône demandée sans avoir été rendue dans cette couleur arrête tout : pptxgenjs, lui, poserait un cadre vide. */
    const icone = (nom, couleur) => {
        const cle = `${nom}|${couleur}`;
        if (Object.keys(icones).length && !icones[cle]) throw new Error(`icône non rendue : ${nom} en #${couleur} (l’ajouter à ICONES_A_RENDRE)`);
        return cle;
    };

    const ombre = () => ({ type: 'outer', blur: 9, offset: 2, angle: 90, color: '000000', opacity: 0.09 });

    /**
     * `typographie` (facultatif) : une fonction appliquée à chaque chaîne avant pose — par
     * exemple les espaces insécables de `insecables()`. Sans elle, le texte passe tel quel.
     */
    const typo = contenu => !typographie ? contenu
        : typeof contenu === 'string' ? typographie(contenu)
        : contenu.map(r => ({ ...r, text: typographie(r.text) }));

    function texte(s, contenu, opts) {
        s.addText(typo(contenu), { fontFace: POLICE, color: C.encre, margin: 0, valign: 'top', isTextBox: true, ...opts });
    }

    function carte(s, x, y, w, h, { fond = C.surface, bord = C.trait, avecOmbre = true, rayon = 0.16 } = {}) {
        s.addShape(presentation().shapes.ROUNDED_RECTANGLE, {
            x, y, w, h, rectRadius: rayon, fill: { color: fond },
            line: bord ? { color: bord, width: 0.75 } : { type: 'none' },
            ...(avecOmbre ? { shadow: ombre() } : {}),
        });
    }

    /** Une capture posée sur une carte blanche, comme les captures du tutoriel. Rend sa hauteur. */
    function capture(s, cle, x, y, { w, h, marge = 0.08 }) {
        const i = images[cle];
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
        s.addShape(rond ? presentation().shapes.OVAL : presentation().shapes.ROUNDED_RECTANGLE, {
            x, y, w: taille, h: taille, fill: { color: fond }, line: { type: 'none' }, ...(rond ? {} : { rectRadius: taille * 0.28 }),
        });
        const p = taille * 0.24;
        s.addImage({ path: icones[icone(nom, couleur)], x: x + p, y: y + p, w: taille - 2 * p, h: taille - 2 * p });
    }

    function numero(s, n, x, y, { taille = 0.46, fond = C.bleu, couleur = 'FFFFFF', corps = 15 } = {}) {
        s.addShape(presentation().shapes.OVAL, { x, y, w: taille, h: taille, fill: { color: fond }, line: { type: 'none' } });
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

    function entete(s, partie, titre) {
        if (partie) texte(s, partie, { x: X0, y: 0.42, w: XW, h: 0.3, fontSize: 12, bold: true, color: C.caramelTexte });
        texte(s, titre, { x: X0, y: 0.72, w: XW, h: 0.72, fontSize: 30, bold: true, valign: 'middle' });
    }

    function notesDeBas(s, runs) {
        texte(s, runs, { x: X0, y: 6.28, w: XW, h: 0.66, fontSize: 9.5, color: C.encre3, valign: 'bottom', lineSpacingMultiple: 1.05 });
    }

    return { icone, ombre, texte, carte, capture, pastille, numero, puces, gras, exposant, lien, entete, notesDeBas };
}

// ─────────────────────────────────────────────────────────────── Rendu (LibreOffice, Poppler)
export function soffice() {
    for (const c of ['/Applications/LibreOffice.app/Contents/MacOS/soffice', 'soffice', 'libreoffice']) {
        if (c.startsWith('/') ? existsSync(c) : spawnSync('which', [c]).status === 0) return c;
    }
    throw new Error('LibreOffice (soffice) introuvable : relancer avec --sans-rendu pour le .pptx seul');
}

/**
 * Convertit `<temp>/<nom>.pptx` en `format` (pdf, odp) par LibreOffice, avec un profil
 * propre (`profil`, dossier ; par défaut dans `temp`) : un autre LibreOffice ouvert sur
 * le profil commun ferait échouer la conversion sans message.
 */
export function convertir(temp, nom, format, profil = join(temp, 'profil-lo')) {
    const r = spawnSync(soffice(), [`-env:UserInstallation=${pathToFileURL(profil).href}`, '--headless', '--convert-to', format, '--outdir', temp, join(temp, `${nom}.pptx`)], { encoding: 'utf8', timeout: 180000 });
    const sortie = join(temp, `${nom}.${format}`);
    if (r.status !== 0 || !existsSync(sortie)) throw new Error(`conversion ${format} : ${r.stderr || r.stdout}`);
    return sortie;
}

/**
 * Rend chaque page du PDF en WebP dans `cible` (vidée d'abord), à 120 ppp : 1600 pixels de
 * large sur 13,33 pouces. Rend [[nom, largeur, hauteur], …].
 */
export function rendreImages(pdf, temp, cible) {
    const dossier = join(temp, 'pages');
    mkdirSync(dossier);
    const r = spawnSync('pdftoppm', ['-png', '-r', '120', pdf, join(dossier, 'p')], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`pdftoppm : ${r.stderr}`);
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
