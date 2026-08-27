/**
 * (h) Vidéo interactive YouTube — aucun sous-titre affiché quand l'auteur n'en a pas demandé.
 *
 * Le bug : `H5P.VideoYouTube` appelle `player.loadModule('captions')`, ce qui ACTIVE la
 * piste de sous-titres par défaut du lecteur YouTube. Sur une vidéo à sous-titres
 * AUTOMATIQUES (kind « asr »), cette piste existe toujours → les sous-titres s'affichent
 * dès la lecture, alors que la case « Intégrer les sous-titres » est décochée. Et comme
 * `getOption('captions','tracklist')` revient VIDE pour une piste asr, H5P n'émet jamais
 * l'événement `captions` : il n'y a même pas de bouton « CC » pour les couper.
 *
 * L'oracle ne peut être que VISUEL : le lecteur YouTube est un iframe cross-origin, son
 * DOM est hors de portée, et `getOption('captions','track')` continue de renvoyer la
 * piste asr APRÈS extinction (il décrit la sélection, pas l'affichage). On compare donc
 * les pixels de la bande basse (là où YouTube pose ses sous-titres) sur une image FIGÉE
 * de la vidéo, la bande haute servant de témoin : si elle bouge, les deux passes ne sont
 * pas sur la même image et la mesure ne veut rien dire.
 *
 * Réseau requis (YouTube). Prérequis : `python3 -m http.server 8010` à la racine.
 * Usage : node tests/qa-manuel/h-sous-titres-youtube.mjs
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';

const HOTE = 'http://localhost:8010/tests/qa-manuel/hote-video-youtube.html';
const SOURCE = 'js/vendor/h5p-libs/H5P.Video-1.6/scripts/youtube.js';
const TEMOIN = 'tests/qa-manuel/.temoin-youtube.js';
// Vidéo signalée en 6.3.3 : sous-titres français AUTOMATIQUES, aucun sous-titre manuel.
const VIDEO = 'kdQc9LXR1n4';
const INSTANT = 12; // secondes — un passage où YouTube affiche une réplique.
const LARGEUR = 700, HAUTEUR = 394;

let echecs = 0;
const verifier = (ok, titre, detail = '') => {
    console.log(`  ${ok ? '✅' : '❌'} ${titre}${detail ? ` — ${detail}` : ''}`);
    if (!ok) echecs++;
};

// ── Copie désarmée du handler (contre-épreuve). Remplacement LITTÉRAL : si la ligne
//    visée disparaît du source, on échoue bruyamment au lieu de comparer deux fois la
//    même chose et de conclure à tort que le correctif est couvert.
const source = readFileSync(SOURCE, 'utf-8');
const ANCRE = `      var disableDefaultCaptions = function () {
        if (captionsTrackChosen || (options.tracks && options.tracks.length)) {
          return;
        }`;
if (!source.includes(ANCRE)) {
    console.error(`\n❌ ancre de désarmement introuvable dans ${SOURCE} — le correctif a changé de forme.\n`);
    process.exit(1);
}
writeFileSync(TEMOIN, source.replace(ANCRE, ANCRE.replace(
    'var disableDefaultCaptions = function () {',
    'var disableDefaultCaptions = function () {\n        if (true) { return; } // CONTRE-ÉPREUVE : correctif désarmé')));

/** Capture la vidéo figée à `INSTANT`. @returns {Buffer} PNG */
async function capturer({ temoin = false, tracks = [] } = {}) {
    const navigateur = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const page = await navigateur.newPage({ viewport: { width: LARGEUR, height: HAUTEUR } });
    await page.goto(HOTE + (temoin ? '?temoin' : ''), { waitUntil: 'load' });
    await page.waitForFunction(() => window.__sondePrete, null, { timeout: 20000 });
    await page.evaluate(([id, t]) => window.__lancer(id, t), [VIDEO, tracks]);
    await page.waitForFunction(() => window.__pret, null, { timeout: 30000 });
    // Lire d'abord : le module de sous-titres ne s'initialise qu'une fois la lecture
    // lancée (c'est `onApiChange` qui le charge), puis figer sur l'image de référence.
    await page.evaluate(() => { window.__lecteur.mute(); window.__lecteur.play(); });
    await page.waitForTimeout(6000);
    await page.evaluate((t) => window.__lecteur.seek(t), INSTANT);
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__lecteur.pause());
    await page.waitForTimeout(1500);
    const png = await page.screenshot();
    await navigateur.close();
    return png;
}

/**
 * Taux de pixels différents entre deux PNG, par bande horizontale.
 * Le décodage PNG se fait DANS un navigateur (canvas) : Node n'a pas de décodeur natif
 * et le dépôt n'embarque aucune bibliothèque d'image côté Node.
 */
async function comparer(a, b) {
    const navigateur = await chromium.launch();
    const page = await navigateur.newPage();
    const taux = await page.evaluate(async ([da, db, h]) => {
        const charger = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = d; });
        const [ia, ib] = await Promise.all([charger(da), charger(db)]);
        const px = (img) => {
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            return c.getContext('2d').getImageData(0, 0, img.width, img.height);
        };
        const [pa, pb] = [px(ia), px(ib)];
        const bande = (y0, y1, x1) => {
            let diff = 0, total = 0;
            for (let y = y0; y < y1; y++) for (let x = 0; x < x1; x++) {
                const i = (y * ia.width + x) * 4;
                total++;
                if (Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1])
                    + Math.abs(pa.data[i + 2] - pb.data[i + 2]) > 60) diff++;
            }
            return total ? diff / total : 0;
        };
        // Bande basse = zone des sous-titres YouTube (centrés). Elle s'arrête à 60 % de la
        // largeur : la vidéo étant en pause, YouTube pose en bas à DROITE ses vignettes
        // « Plus de vidéos », qui changent à chaque exécution et feraient un bruit de
        // plusieurs points. Bande haute = témoin : elle atteste que les deux passes
        // comparent bien la même image de la vidéo.
        const droite = Math.round(ia.width * 0.60);
        return { basse: bande(Math.round(h * 0.80), h, droite), haute: bande(0, Math.round(h * 0.45), ia.width) };
    }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`, HAUTEUR]);
    await navigateur.close();
    return taux;
}

const pct = (v) => `${(v * 100).toFixed(2)} %`;

try {
    console.log('\n(h) Vidéo interactive YouTube — sous-titres non sollicités\n');

    console.log('  — capture des trois états (YouTube, ~30 s) —');
    const [corrige, desarme, avecPiste] = [
        await capturer({}),                                       // case décochée + correctif
        await capturer({ temoin: true }),                         // case décochée, correctif désarmé
        await capturer({ tracks: [{ label: 'Transcription', kind: 'subtitles', srcLang: 'fr',
                                    track: { path: 'transcription.vtt', mime: 'text/vtt' } }] })
    ];
    // QA_CAPTURES=<dossier> : écrit les trois captures sur disque. Indispensable pour
    // diagnostiquer un écart — l'oracle est visuel, il faut pouvoir regarder l'image.
    if (process.env.QA_CAPTURES) {
        writeFileSync(`${process.env.QA_CAPTURES}/h-corrige.png`, corrige);
        writeFileSync(`${process.env.QA_CAPTURES}/h-desarme.png`, desarme);
        writeFileSync(`${process.env.QA_CAPTURES}/h-avec-piste.png`, avecPiste);
    }

    // 1. Contre-épreuve : désarmer le correctif DOIT changer la bande des sous-titres.
    const t1 = await comparer(corrige, desarme);
    console.log(`     bande basse ${pct(t1.basse)} · bande haute (témoin) ${pct(t1.haute)}`);
    verifier(t1.haute < 0.02, 'les deux passes montrent bien la même image de la vidéo',
        `témoin haut = ${pct(t1.haute)}`);
    verifier(t1.basse > 0.02, 'correctif désarmé → le sous-titre YouTube réapparaît (contre-épreuve ROUGE)',
        `bande basse = ${pct(t1.basse)}`);

    // 2. Case COCHÉE : l'auteur a déclaré une piste → comportement natif préservé.
    //    NB : ce cas ne se produit pas encore avec une source YouTube (Caramel ne pose
    //    `transcript.captionUrl` que pour PeerTube, donc `textTracks.videoTrack` reste
    //    vide). Il vaut pour les sources qui en déclarent une, et garantit que le
    //    garde-fou ne débordera pas le jour où le VTT YouTube sera embarqué.
    const t2 = await comparer(avecPiste, desarme);
    console.log(`     bande basse ${pct(t2.basse)} · bande haute (témoin) ${pct(t2.haute)}`);
    verifier(t2.basse < 0.02, 'case « Intégrer les sous-titres » cochée → sous-titres conservés',
        `écart avec l'état natif = ${pct(t2.basse)}`);
}
finally {
    rmSync(TEMOIN, { force: true });
}

console.log(echecs === 0
    ? '\n✅ (h) sous-titres YouTube : conforme\n'
    : `\n❌ (h) ${echecs} vérification(s) en échec\n`);
process.exit(echecs === 0 ? 0 : 1);
