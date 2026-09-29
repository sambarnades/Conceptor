#!/usr/bin/env node
/**
 * L'habillage de la vidéo de présentation : l'écran filmé posé sur un fond, une
 * caméra qui suit l'action, les étapes du film en haut, les phrases clés en
 * bandeau, des cartons animés (titre, parties, « À savoir », fin), et la musique.
 *
 *   node scripts/video-demo/habillage.mjs                     les deux versions
 *   node scripts/video-demo/habillage.mjs --version=voix      la version commentée (ta voix + musique discrète)
 *   node scripts/video-demo/habillage.mjs --version=musique   la version sans voix, rythmée, avec musique
 *   … --essai=40:70   ne rend que ces secondes (sans son), pour régler un détail
 *   … --musique=<fichier>   une autre musique pour la version sans voix (à la place de la composée)
 *
 * Prérequis : le tournage (`tourner.mjs`), la passe à blanc qui relève les gestes
 * (`tourner.mjs --journal`), et pour la version commentée le montage des voix
 * (`caramel-7-demo.mp4`, produit par le studio ou `--mixer`).
 *
 * **La caméra** lit le journal des gestes : elle cadre la cible d'un clic ou d'une
 * saisie (zoom jusqu'à ×1,55), revient au plan large pendant un défilement et
 * TOUJOURS quand une durée réelle est affichée à l'écran — ces notes d'honnêteté
 * doivent rester lisibles. Ses mouvements passent par un ressort amorti.
 *
 * **La version sans voix** n'a plus à attendre la fin d'une phrase dite : les
 * passages où l'écran ne bouge pas sont accélérés (jusqu'à ×4,5), sans jamais
 * raccourcir une phrase clé sous son temps de lecture. Rien de ce qui bouge n'est
 * accéléré. Les parties commencent sur une mesure de la musique.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createReadStream, existsSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { SCENES } from './scenario.mjs';
import { composer, ecrireWav } from './musique.mjs';
import { chronologie, lireMontage } from './montage.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const option = (nom, defaut) => (argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=').slice(1).join('=') || defaut;
const SORTIE = resolve(option('sortie', join(ROOT, 'tests/.video-demo')));
const CADRES = join(SORTIE, 'cadres');
const TRAVAIL = join(SORTIE, 'habillage');
const IPS = 30;
const BPM = 104, MESURE = 4 * 60 / BPM;
const OUVRIERS = Number(option('ouvriers', 3));
const PORT = 8260;
const VERSIONS = option('version', 'voix,musique').split(',');
const ESSAI = option('essai', null)?.split(':').map(Number);

mkdirSync(TRAVAIL, { recursive: true });
if (!existsSync(join(SORTIE, 'journal.json'))) { console.error('Pas de journal des gestes : node scripts/video-demo/tourner.mjs --journal'); process.exit(1); }
if (!existsSync(CADRES) || readdirSync(CADRES).length < 100) {
    console.log('Extraction des images de la vidéo muette…');
    mkdirSync(CADRES, { recursive: true });
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', join(SORTIE, 'caramel-7-demo-muette.mp4'), '-q:v', '3', join(CADRES, '%05d.jpg')], { stdio: 'inherit' });
}

const { marques, duree: DUREE_MARQUES } = JSON.parse(readFileSync(join(SORTIE, 'marques.json'), 'utf8'));
const journal = JSON.parse(readFileSync(join(SORTIE, 'journal.json'), 'utf8')).scenes;
const S = Object.fromEntries(marques.map(m => [m.id, m]));
const NB = readdirSync(CADRES).filter(f => f.endsWith('.jpg')).length;
const DUREE_SOURCE = NB / IPS;
const CARTES_SOURCE = new Set(['titre', 'limites', 'fin']);

const PARTIES = [
    null,
    { debut: 'saisie', titre: 'Une activité', sous: 'Du formulaire au fichier H5P, en passant par la relecture' },
    { debut: 'commutateur', titre: 'Un parcours', sous: 'Nouveau : un cours complet, de la trame au fichier .mbz' },
    { debut: 'limites', titre: 'À savoir', sous: 'Ce que l’outil ne fait pas à votre place' },
];
const partieDe = id => { let p = 0; for (const s of marques) { if (PARTIES.some(x => x?.debut === s.id)) p = PARTIES.findIndex(x => x?.debut === s.id); if (s.id === id) return p; } return 0; };

/* ------------------------------------------------------------------ *
 *  La caméra, en temps source
 * ------------------------------------------------------------------ */
const K = 1920 / 1440;             // px CSS de la fenêtre filmée → px de la vidéo
const PAD = 120, ZMAX = 1.55;
const zoomPour = r => Math.max(1, Math.min(ZMAX, Math.min(1920 / (r.w + 2 * PAD), 1080 / (r.h + 2 * PAD))));
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; };

const focus = [], large = [];
for (const m of marques) {
    if (CARTES_SOURCE.has(m.id)) continue;
    const gestes = journal[m.id]?.gestes || [];
    gestes.forEach((g, i) => {
        const t = m.debut + g.dt, tf = m.debut + (g.dtFin ?? g.dt);
        if (g.boite && ['clic', 'survol', 'saisie'].includes(g.type)) {
            const b = g.boite;
            // Une saisie s'écrit à partir de la gauche du champ ; ailleurs, on cadre autour du centre de la cible.
            const r = g.type === 'saisie' ? { x: b.x, y: b.y - 30, w: Math.min(b.w, 560), h: b.h + 60 }
                : (() => { const w = Math.min(b.w, 700), h = Math.min(b.h, 380); return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h }; })();
            const avant = { clic: 0.45, survol: 0.3, saisie: 0.1 }[g.type], apres = { clic: 1.0, survol: 0.7, saisie: 1.0 }[g.type];
            focus.push({ d: t - avant, f: tf + apres, r: { x: r.x * K, y: r.y * K, w: r.w * K, h: r.h * K } });
        }
        if (g.type === 'defiler') large.push([t - 0.25, tf + 0.35]);
        if (g.type === 'note') {
            const fin = gestes.slice(i + 1).find(x => x.type === 'note-fin');
            large.push([t - 0.2, (fin ? m.debut + fin.dt : m.fin) + 0.4]);
        }
    });
}
focus.sort((a, b) => a.d - b.d);
const plans = [];
for (const f of focus) {
    const p = plans.at(-1);
    if (p && f.d <= p.f + 0.8 && zoomPour(union(p.r, f.r)) >= 1.25) { p.f = Math.max(p.f, f.f); p.r = union(p.r, f.r); }
    else plans.push({ ...f });
}
for (const p of plans) {
    p.z = zoomPour(p.r);
    const hx = 960 / p.z, hy = 540 / p.z;
    p.cx = Math.max(hx, Math.min(1920 - hx, p.r.x + p.r.w / 2));
    p.cy = Math.max(hy, Math.min(1080 - hy, p.r.y + p.r.h / 2));
}
const LARGE = [1, 960, 540];
function cible(s) {
    if (large.some(([a, b]) => s >= a && s <= b)) return LARGE;
    const p = plans.find(x => s >= x.d && s <= x.f && x.z >= 1.1);
    return p ? [p.z, p.cx, p.cy] : LARGE;
}
console.log(`Caméra : ${plans.filter(p => p.z >= 1.1).length} plans rapprochés, ${large.length} retours au plan large imposés.`);

/* ------------------------------------------------------------------ *
 *  Les phrases clés, en temps source
 * ------------------------------------------------------------------ */
const CLES = [];
for (const sc of SCENES) {
    if (!sc.cles) continue;
    const m = S[sc.id];
    sc.cles.forEach(([idx, texte], j) => {
        const a = m.debut + m.phrases[idx].offset;
        const suivante = sc.cles[j + 1];
        const b = suivante ? m.debut + m.phrases[suivante[0]].offset : m.fin;
        CLES.push({ a, b, texte, partie: partieDe(sc.id), id: sc.id, derniere: !suivante });
    });
}
const lecture = txt => Math.max(2.8, Math.min(5.5, txt.length / 14 + 1.0));

/* ------------------------------------------------------------------ *
 *  L'activité à l'écran (version sans voix) : ce qui bouge n'est pas accéléré
 * ------------------------------------------------------------------ */
function activite() {
    const brut = spawnSync('ffmpeg', ['-v', 'error', '-i', join(SORTIE, 'caramel-7-demo-muette.mp4'), '-vf', 'scale=96:54,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 }).stdout;
    const T = 96 * 54, n = Math.floor(brut.length / T), bouge = new Uint8Array(n);
    for (let i = 1; i < n; i++) {
        let d = 0;
        for (let j = 0; j < T; j++) d += Math.abs(brut[i * T + j] - brut[(i - 1) * T + j]);
        bouge[i] = d / T > 0.08 ? 1 : 0;
    }
    // Les gestes comptent comme de l'activité, même quand l'image change peu (un survol).
    for (const m of marques) for (const g of journal[m.id]?.gestes || []) {
        if (!g.dtFin) continue;
        for (let i = Math.floor((m.debut + g.dt) * IPS); i <= Math.ceil((m.debut + g.dtFin) * IPS) && i < n; i++) bouge[i] = 1;
    }
    // Dilatation : on laisse souffler un tiers de seconde autour de chaque mouvement.
    const dil = new Uint8Array(n), r = Math.round(0.35 * IPS);
    for (let i = 0; i < n; i++) if (bouge[i]) for (let j = Math.max(0, i - r); j <= Math.min(n - 1, i + r); j++) dil[j] = 1;
    return dil;
}

/* ------------------------------------------------------------------ *
 *  Les feuilles de montage
 * ------------------------------------------------------------------ */
/**
 * Une phrase clé trop brève pour être lue emprunte du temps à la suivante, si
 * celle-ci en a de reste ; sinon elle s'allonge jusqu'au prochain carton.
 */
function equilibrer(legendes, cartes) {
    legendes.sort((a, b) => a.d - b.d);
    legendes.forEach((l, i) => {
        const manque = lecture(l.texte) - (l.f - l.d);
        if (manque <= 0) return;
        const suiv = legendes[i + 1];
        const carte = cartes.filter(c => c.d >= l.f - 0.01).sort((a, b) => a.d - b.d)[0];
        const plafond = Math.min(suiv ? suiv.f - 0.5 : Infinity, carte ? carte.d - 0.2 : Infinity);
        if (suiv && suiv.d - l.f < 0.8) {
            const pris = Math.min(manque, Math.max(0, (suiv.f - suiv.d) - lecture(suiv.texte)), plafond - l.f);
            if (pris > 0) { l.f += pris; suiv.d += pris; }
        } else l.f = Math.min(l.f + manque, plafond);
    });
    return legendes;
}

function feuilleVoix() {
    // Les rallonges de la table de montage : l'image se fige à la fin des blocs rallongés,
    // et tout ce qui suit se décale d'autant (comme le montage des voix, `tourner.mjs --mixer`).
    const { blocs, versMonte: M, dureeMontee } = chronologie(marques, DUREE_MARQUES, lireMontage(SORTIE).rallonges);
    const N = Math.round((dureeMontee + 1.5) * IPS);
    const cadres = [];
    for (const b of blocs) {
        const i0 = Math.round(b.debut * IPS), i1 = Math.round(b.coupe * IPS);
        for (let i = i0; i < i1; i++) { const s = Math.min(i, NB - 1); cadres.push({ s, cible: cible(s / IPS) }); }
        const fige = Math.min(i1 - 1, NB - 1);
        for (let k = 0; k < Math.round(b.rallonge * IPS); k++) cadres.push({ s: fige, cible: cible(fige / IPS) });
    }
    while (cadres.length < N) cadres.push({ ...cadres.at(-1) });
    cadres.length = N;
    const R = Object.fromEntries(blocs.map(b => [b.id, b.rallonge]));
    const cartes = [{ nom: 'titre', d: 0, f: M(S.accueil.debut) + 0.5 }];
    for (const n of [1, 2, 3]) {
        const d = M(S[PARTIES[n].debut].debut);
        cartes.push({ nom: 'chapitre', n, titre: PARTIES[n].titre, sous: PARTIES[n].sous, d, f: d + 1.9 });
    }
    const L = S.limites;
    cartes.push({ nom: 'savoir', d: M(L.debut) + 1.9, f: M(S.fin.debut) + 0.3, puces: [1, 2, 3, 4, 6].map(i => M(L.debut + L.phrases[i].offset)) });
    cartes.push({ nom: 'fin', d: M(S.fin.debut) + 0.3, f: N / IPS + 1 });
    // La dernière phrase clé d'une scène reste affichée pendant la rallonge de son bloc.
    const legendes = CLES.map(c => ({ d: M(c.a) + 0.1, f: M(c.b) - 0.15 + (c.derniere ? R[c.id] : 0), texte: c.texte, n: c.partie || 'i' }))
        .map(l => { const ch = cartes.find(x => x.nom === 'chapitre' && l.d >= x.d && l.d < x.f); if (ch) l.d = ch.f + 0.1; return l; })
        .filter(l => l.f - l.d > 1.2);
    const chapitres = [{ d: 0, n: 0 }, ...[1, 2, 3].map(n => ({ d: M(S[PARTIES[n].debut].debut), n }))];
    const sections = [
        { debut: 0, style: 'intro' }, { debut: M(S.saisie.debut), style: 'couplet' }, { debut: M(S.commutateur.debut), style: 'plein' },
        { debut: M(S.limites.debut), style: 'calme' }, { debut: M(S.fin.debut), style: 'final' },
    ];
    return { nom: 'voix', cadres, cartes, legendes: equilibrer(legendes, cartes), chapitres, sections, duree: N / IPS };
}

function feuilleMusique() {
    const bouge = activite();
    // Facteur d'accélération des passages immobiles, fenêtre de phrase clé par fenêtre.
    const facteur = new Float32Array(NB).fill(4.5);
    for (const c of CLES) {
        const i0 = Math.floor(c.a * IPS), i1 = Math.min(NB, Math.ceil(c.b * IPS));
        let A = 0, St = 0;
        for (let i = i0; i < i1; i++) bouge[i] ? A++ : St++;
        A /= IPS; St /= IPS;
        const R = lecture(c.texte);
        // Sous 1, l'image immobile est tenue plus longtemps : invisible, et la phrase se lit.
        const f = A >= R ? 4.5 : Math.max(0.5, Math.min(4.5, St / Math.max(0.01, R - A)));
        for (let i = i0; i < i1; i++) facteur[i] = f;
    }
    const cadres = [], cartes = [], chapitres = [{ d: 0, n: 0 }], sections = [{ debut: 0, style: 'intro' }];
    const t = () => cadres.length / IPS;
    const carte = (c, duree) => { const d = t(); cartes.push({ ...c, d, f: d + duree }); for (let k = 0; k < Math.round(duree * IPS); k++) cadres.push({ s: null }); };
    const tenirJusquaMesure = () => {
        const s = cadres.at(-1)?.s ?? 0, cible_ = Math.ceil(t() / MESURE - 1e-6) * MESURE;
        while (t() < cible_ - 1e-6) cadres.push({ s, cible: cible(s / IPS) });
    };
    const jouer = (a, b) => {                       // de a à b secondes source, en accélérant l'immobile
        let s = a * IPS;
        while (s < b * IPS) {
            const i = Math.min(NB - 1, Math.floor(s));
            cadres.push({ s: i, cible: cible(i / IPS) });
            s += bouge[i] ? 1 : facteur[i];
        }
    };
    const vers = []; // correspondance temps source → temps de sortie, pour les phrases clés
    carte({ nom: 'titre' }, 2 * MESURE);
    const debutAccueil = t();
    jouer(S.accueil.debut + 0.7, S.accueil.fin);
    for (const n of [1, 2]) {
        tenirJusquaMesure();
        const d = t();
        carte({ nom: 'chapitre', n, titre: PARTIES[n].titre, sous: PARTIES[n].sous }, MESURE);
        chapitres.push({ d, n });
        sections.push({ debut: d, style: n === 1 ? 'couplet' : 'plein' });
        const scenes = n === 1 ? ['saisie', 'telechargement'] : ['commutateur', 'livraison'];
        jouer(S[scenes[0]].debut, S[scenes[1]].fin);
    }
    tenirJusquaMesure();
    const dSavoir = t();
    chapitres.push({ d: dSavoir, n: 3 });
    sections.push({ debut: dSavoir, style: 'calme' });
    carte({ nom: 'chapitre', n: 3, titre: PARTIES[3].titre, sous: PARTIES[3].sous }, MESURE);
    const dPuces = t() + 1.0;
    carte({ nom: 'savoir', puces: [0, 1, 2, 3, 4].map(i => dPuces + i * 3.4) }, 9 * MESURE);
    sections.push({ debut: t(), style: 'final' });
    carte({ nom: 'fin' }, 3 * MESURE + 1.2);
    // Les phrases clés : fenêtre source [a, b] → les cadres qui la montrent.
    const legendes = [];
    for (const c of CLES) {
        const k0 = cadres.findIndex(x => x.s !== null && x.s >= c.a * IPS);
        let k1 = k0; while (k1 + 1 < cadres.length && cadres[k1 + 1].s !== null && cadres[k1 + 1].s < c.b * IPS) k1++;
        if (k0 < 0) continue;
        legendes.push({ d: k0 / IPS + 0.1, f: (k1 + 1) / IPS - 0.15, texte: c.texte, n: c.partie || 'i' });
    }
    return { nom: 'musique', cadres, cartes, legendes: equilibrer(legendes, cartes), chapitres, sections, duree: cadres.length / IPS, debutAccueil };
}

/** Le ressort de la caméra, image par image en temps de sortie. */
function filmer(feuille) {
    let x = [...LARGE], v = [0, 0, 0], precedent = null;
    const w = 6.5, dt = 1 / IPS / 4;
    for (const c of feuille.cadres) {
        if (c.s === null) { precedent = null; continue; }
        const but = c.cible;
        if (precedent === null) { x = [...but]; v = [0, 0, 0]; }      // après un carton, on repart cadré
        for (let n = 0; n < 4; n++) for (let j = 0; j < 3; j++) { const a = w * w * (but[j] - x[j]) - 2 * w * v[j]; v[j] += a * dt; x[j] += v[j] * dt; }
        // Un cadre ne sort jamais de l'image.
        const z = Math.max(1, x[0]), hx = 960 / z, hy = 540 / z;
        c.cam = [+z.toFixed(4), +Math.max(hx, Math.min(1920 - hx, x[1])).toFixed(2), +Math.max(hy, Math.min(1080 - hy, x[2])).toFixed(2)];
        precedent = c;
        delete c.cible;
    }
    return feuille;
}

/* ------------------------------------------------------------------ *
 *  Le rendu : Chromium dessine, ffmpeg encode
 * ------------------------------------------------------------------ */
const serveur = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = p === '/' || p === '/habillage.html' ? join(ICI, 'habillage.html')
        : p === '/logo.svg' ? join(ROOT, 'assets/images/branding/logo_caramel.svg')
        : p.startsWith('/cadres/') ? join(CADRES, p.slice(8).replace(/[^0-9.jpg]/g, '')) : null;
    if (!f || !existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg', 'Cache-Control': 'max-age=3600' });
    createReadStream(f).pipe(res);
});
await new Promise(r => serveur.listen(PORT, '127.0.0.1', r));
const navigateur = await chromium.launch();

async function rendreVideo(feuille, fichier, [k0, k1]) {
    const tl = { ips: IPS, duree: feuille.duree, cadres: feuille.cadres.map(c => ({ s: c.s, cam: c.cam || LARGE })),
        cartes: feuille.cartes, legendes: feuille.legendes, chapitres: feuille.chapitres };
    const tranches = [];
    const pas = Math.ceil((k1 - k0) / OUVRIERS);
    for (let w = 0; w < OUVRIERS; w++) { const a = k0 + w * pas, b = Math.min(k1, a + pas); if (a < b) tranches.push([a, b]); }
    const debut = Date.now();
    let faits = 0;
    const segments = await Promise.all(tranches.map(async ([a, b], w) => {
        const seg = join(TRAVAIL, `${feuille.nom}-${w}.mp4`);
        const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
        page.on('pageerror', e => console.log('  [page]', e.message));
        await page.goto(`http://127.0.0.1:${PORT}/habillage.html`);
        await page.evaluate(tl => window.initialiser(tl), tl);
        const enc = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(IPS), '-c:v', 'mjpeg', '-i', '-',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(IPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
        const fini = new Promise((ok, ko) => enc.on('close', c => c === 0 ? ok() : ko(new Error(`ffmpeg segment ${w} : ${c}`))));
        for (let k = a; k < b; k++) {
            await page.evaluate(k => window.rendre(k), k);
            const img = await page.screenshot({ type: 'jpeg', quality: 92 });
            if (!enc.stdin.write(img)) await new Promise(r => enc.stdin.once('drain', r));
            if (++faits % 600 === 0) console.log(`  ${feuille.nom} : ${faits} / ${k1 - k0} images (${Math.round((Date.now() - debut) / 1000)} s)`);
        }
        enc.stdin.end();
        await fini;
        await page.close();
        return seg;
    }));
    const liste = join(TRAVAIL, `${feuille.nom}-segments.txt`);
    writeFileSync(liste, segments.map(s => `file '${s}'`).join('\n') + '\n');
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', fichier]);
    if (r.status !== 0) throw new Error(`concaténation : ${r.stderr}`);
    segments.forEach(s => rmSync(s, { force: true }));
    console.log(`  ✓ images : ${k1 - k0} en ${Math.round((Date.now() - debut) / 1000)} s`);
}

function ff(args, quoi) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg (${quoi}) : ${r.stderr}`);
}

for (const version of VERSIONS) {
    const feuille = filmer(version === 'voix' ? feuilleVoix() : feuilleMusique());
    writeFileSync(join(TRAVAIL, `feuille-${version}.json`), JSON.stringify({ ...feuille, cadres: feuille.cadres.length }, null, 1));
    const k0 = ESSAI ? Math.round(ESSAI[0] * IPS) : 0, k1 = ESSAI ? Math.min(feuille.cadres.length, Math.round(ESSAI[1] * IPS)) : feuille.cadres.length;
    console.log(`\n▶ version ${version} : ${Math.floor(feuille.duree / 60)} min ${String(Math.round(feuille.duree % 60)).padStart(2, '0')} s, ${feuille.legendes.length} phrases clés${ESSAI ? ` — essai ${ESSAI[0]}–${ESSAI[1]} s` : ''}`);
    const video = join(TRAVAIL, `${version}-image.mp4`);
    await rendreVideo(feuille, video, [k0, k1]);
    if (ESSAI) { ff(['-i', video, '-c', 'copy', join(SORTIE, `essai-${version}.mp4`)], 'essai'); console.log(`  → ${join(SORTIE, `essai-${version}.mp4`).replace(ROOT + '/', '')}`); continue; }

    // La musique.
    const musique = join(TRAVAIL, `${version}-musique.wav`);
    const externe = version === 'musique' ? option('musique', null) : null;
    if (!externe) ecrireWav(musique, composer({ duree: feuille.duree, sections: feuille.sections, bpm: BPM, lit: version === 'voix' }));
    const D = feuille.duree.toFixed(3);
    const sortie = join(SORTIE, version === 'voix' ? 'caramel-7-demo-habillee.mp4' : 'caramel-7-demo-musicale.mp4');
    if (version === 'voix') {
        const voix = join(SORTIE, 'caramel-7-demo.mp4');
        if (!existsSync(voix)) throw new Error('Pas de voix montée : lancer le studio (« Monter la vidéo ») ou tourner.mjs --mixer');
        // La musique s'efface sous la voix (compresseur piloté par la voix), et remonte dans les silences.
        ff(['-i', video, '-i', voix, '-i', musique, '-filter_complex',
            `[1:a]aresample=48000,apad,atrim=0:${D},asplit[v1][v2];[2:a]aresample=48000,atrim=0:${D},volume=0.2,afade=t=in:d=1.5,afade=t=out:st=${(feuille.duree - 3).toFixed(2)}:d=3[m];`
            + `[m][v1]sidechaincompress=threshold=0.025:ratio=6:attack=20:release=500[md];[v2][md]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false[a]`,
            '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', D, sortie], 'mixage voix');
    } else {
        const src = externe ? resolve(externe) : musique;
        ff(['-i', video, ...(externe ? ['-stream_loop', '-1'] : []), '-i', src, '-filter_complex',
            `[1:a]aresample=48000,atrim=0:${D},afade=t=in:d=0.4,afade=t=out:st=${(feuille.duree - 3).toFixed(2)}:d=3,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.84:level=false[a]`,
            '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', D, sortie], 'mixage musique');
    }
    console.log(`  ✓ ${sortie.replace(ROOT + '/', '')}`);
}
await navigateur.close();
serveur.close();
