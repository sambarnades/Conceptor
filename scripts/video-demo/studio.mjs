#!/usr/bin/env node
/**
 * Le studio de voix off : la vidéo muette, un prompteur qui suit la lecture, un
 * bouton micro. On lit au fil de la vidéo ; chaque bloc enregistré est rangé sur
 * le disque, prêt pour le mixage, et « Monter la vidéo » produit le film final.
 *
 *   node scripts/video-demo/studio.mjs          ouvre http://127.0.0.1:8250/ dans le navigateur
 *
 * Options : --port=8250, --sortie=<dossier du tournage>, --prises=<dossier des voix>,
 * --sans-navigateur.
 *
 * Prérequis : un tournage (`node scripts/video-demo/tourner.mjs`), qui laisse la
 * vidéo muette et ses marques dans tests/.video-demo/.
 *
 * **Pourquoi pas dans la page partagée.** Le cadre des artefacts refuse le micro
 * à tout le monde, sans même le demander. Ici la page est servie par l'ordinateur
 * lui-même (127.0.0.1), que les navigateurs traitent en contexte sûr : le micro
 * y est permis. Le serveur n'écoute QUE la boucle locale.
 *
 * **Où vont les prises.** tests/.video-demo/voix-off/<bloc>.wav, un fichier par
 * bloc, calé sur le début de sa scène : exactement ce qu'attend
 * `tourner.mjs --mixer`. Une prise refaite remplace la précédente ; recharger
 * la page ne perd rien.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { ecrireMontage, lireMontage } from './montage.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const option = (nom, defaut) => (process.argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=').slice(1).join('=') || defaut;
/** --sortie : le dossier du tournage (marques, vidéo muette, vidéo finale) ; --prises : où ranger les voix. */
const SORTIE = resolve(option('sortie', join(ROOT, 'tests/.video-demo')));
const PRISES = resolve(option('prises', join(SORTIE, 'voix-off')));
const MARQUES = join(SORTIE, 'marques.json');
const MUETTE = join(SORTIE, 'caramel-7-demo-muette.mp4');
const FINALE = join(SORTIE, 'caramel-7-demo.mp4');
const PORT = Number(option('port', 8250));
const TAILLE_MAX = 60 * 1024 * 1024;
/** Le dossier visible où l'on retrouve la vidéo finale (tests/.video-demo est masqué par le Finder). */
const BUREAU = join(homedir(), 'Desktop', 'Caramel 7 - vidéos');
const HABILLEE = join(SORTIE, 'caramel-7-demo-habillee.mp4');
const COPIE_HABILLEE = join(BUREAU, 'Caramel 7 - démonstration commentée.mp4');   // une prise de bloc : quelques Mo ; au-delà, c'est une erreur

if (!existsSync(MARQUES) || !existsSync(MUETTE)) {
    console.error('Pas de tournage : lancer d’abord  node scripts/video-demo/tourner.mjs');
    process.exit(1);
}
mkdirSync(PRISES, { recursive: true });
const blocs = () => JSON.parse(readFileSync(MARQUES, 'utf8')).marques.map(m => m.id);

/** Durée d'un WAV PCM d'après son en-tête (celui qu'écrit le studio). */
function dureeWav(f) {
    try {
        const b = readFileSync(f);
        const debit = b.readUInt32LE(28);
        let i = 12;
        while (i + 8 <= b.length) {
            const id = b.toString('ascii', i, i + 4), n = b.readUInt32LE(i + 4);
            if (id === 'data') return n / debit;
            i += 8 + n + (n % 2);
        }
    } catch { /* fichier illisible : durée inconnue */ }
    return null;
}

/** Sert un fichier, avec les requêtes partielles sans lesquelles une vidéo ne se déplace pas. */
function servir(req, res, fichier, type) {
    if (!existsSync(fichier)) { res.writeHead(404); return res.end(); }
    const taille = statSync(fichier).size;
    const plage = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    const entetes = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    if (plage) {
        const debut = plage[1] ? Number(plage[1]) : taille - Number(plage[2]);
        const fin = plage[1] && plage[2] ? Math.min(Number(plage[2]), taille - 1) : taille - 1;
        if (debut >= taille || debut > fin) { res.writeHead(416, { 'Content-Range': `bytes */${taille}` }); return res.end(); }
        res.writeHead(206, { ...entetes, 'Content-Range': `bytes ${debut}-${fin}/${taille}`, 'Content-Length': fin - debut + 1 });
        return createReadStream(fichier, { start: debut, end: fin }).pipe(res);
    }
    res.writeHead(200, { ...entetes, 'Content-Length': taille });
    createReadStream(fichier).pipe(res);
}

const json = (res, code, corps) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(corps)); };

let montageEnCours = false;

const serveur = createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && (p === '/' || p === '/studio.html')) return servir(req, res, join(ICI, 'studio.html'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && p === '/table') return servir(req, res, join(ICI, 'table.html'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && p === '/marques.json') return servir(req, res, MARQUES, 'application/json; charset=utf-8');
    // Les rallonges de la table de montage.
    if (req.method === 'GET' && p === '/montage') return json(res, 200, lireMontage(SORTIE));
    if (req.method === 'PUT' && p === '/montage') {
        let corps = '';
        req.on('data', c => { corps += c; if (corps.length > 100000) req.destroy(); });
        req.on('end', () => {
            try { const m = ecrireMontage(SORTIE, JSON.parse(corps)); console.log(`  ⇥ rallonges : ${Object.entries(m.rallonges).map(([k, v]) => `${k} +${v} s`).join(', ') || 'aucune'}`); json(res, 200, m); }
            catch { json(res, 400, { erreur: 'montage illisible' }); }
        });
        return;
    }
    if (req.method === 'POST' && p === '/reveler') {
        let corps = '';
        req.on('data', c => { corps += c; });
        req.on('end', () => {
            let quoi = 'habillee'; try { quoi = JSON.parse(corps).quoi; } catch { /* défaut */ }
            const f = quoi === 'montee' ? FINALE : existsSync(COPIE_HABILLEE) ? COPIE_HABILLEE : HABILLEE;
            if (process.platform === 'darwin' && existsSync(f)) spawn('open', ['-R', f], { stdio: 'ignore' });
            json(res, 200, { ok: existsSync(f), fichier: f });
        });
        return;
    }
    if (req.method === 'GET' && p === '/video.mp4') return servir(req, res, MUETTE, 'video/mp4');
    if (req.method === 'GET' && p === '/finale.mp4') return servir(req, res, FINALE, 'video/mp4');
    if (req.method === 'GET' && p === '/logo.svg') return servir(req, res, join(ROOT, 'assets/images/branding/logo_caramel.svg'), 'image/svg+xml');

    if (req.method === 'GET' && p === '/prises') {
        const ids = new Set(blocs());
        const prises = readdirSync(PRISES).filter(f => f.endsWith('.wav') && ids.has(f.slice(0, -4)))
            .map(f => ({ id: f.slice(0, -4), duree: dureeWav(join(PRISES, f)), le: statSync(join(PRISES, f)).mtimeMs }));
        return json(res, 200, { prises, finale: existsSync(FINALE) ? statSync(FINALE).mtimeMs : null, dossier: PRISES.replace(ROOT + '/', '') });
    }

    const m = /^\/prises\/([a-z0-9-]+)\.wav$/.exec(p);
    if (m) {
        const id = m[1];
        if (!blocs().includes(id)) return json(res, 404, { erreur: `bloc inconnu : ${id}` });
        const f = join(PRISES, `${id}.wav`);
        if (req.method === 'GET') return servir(req, res, f, 'audio/wav');
        if (req.method === 'DELETE') { if (existsSync(f)) unlinkSync(f); return json(res, 200, { ok: true }); }
        if (req.method === 'PUT') {
            const morceaux = [];
            let taille = 0;
            req.on('data', c => { taille += c.length; if (taille <= TAILLE_MAX) morceaux.push(c); });
            req.on('end', () => {
                if (taille > TAILLE_MAX) return json(res, 413, { erreur: 'prise trop lourde' });
                const b = Buffer.concat(morceaux);
                if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') return json(res, 400, { erreur: 'ce n’est pas un WAV' });
                writeFileSync(f, b);
                console.log(`  ● ${id}.wav  (${dureeWav(f)?.toFixed(1)} s)`);
                json(res, 200, { ok: true, duree: dureeWav(f) });
            });
            return;
        }
    }

    if (req.method === 'POST' && p === '/monter') {
        if (montageEnCours) return json(res, 409, { erreur: 'montage déjà en cours' });
        montageEnCours = true;
        const job = spawn(process.execPath, [join(ICI, 'tourner.mjs'), `--sortie=${SORTIE}`, `--mixer=${PRISES}`], { cwd: ROOT });
        let journal = '';
        job.stdout.on('data', d => { journal += d; });
        job.stderr.on('data', d => { journal += d; });
        job.on('close', code => {
            montageEnCours = false;
            console.log(code === 0 ? '  ✓ vidéo montée' : '  ✗ montage en échec');
            json(res, code === 0 ? 200 : 500, { ok: code === 0, journal, fichier: FINALE.replace(ROOT + '/', '') });
        });
        return;
    }

    // L'habillage de la version commentée (caméra, cartons, musique discrète sous la voix).
    if (req.method === 'POST' && p === '/habiller') {
        if (montageEnCours) return json(res, 409, { erreur: 'un traitement est déjà en cours' });
        montageEnCours = true;
        const job = spawn(process.execPath, [join(ICI, 'habillage.mjs'), '--version=voix', `--sortie=${SORTIE}`], { cwd: ROOT });
        let journal = '';
        job.stdout.on('data', d => { journal += d; });
        job.stderr.on('data', d => { journal += d; });
        job.on('close', code => {
            montageEnCours = false;
            let copie = null;
            if (code === 0) {
                // Recopiée là où on la retrouve : le dossier de sortie est masqué par le Finder.
                try { mkdirSync(BUREAU, { recursive: true }); copyFileSync(HABILLEE, COPIE_HABILLEE); copie = COPIE_HABILLEE.replace(homedir(), '~'); }
                catch (e) { journal += `\nCopie sur le Bureau impossible : ${e.message}`; }
            }
            console.log(code === 0 ? `  ✓ vidéo habillée${copie ? ` → ${copie}` : ''}` : '  ✗ habillage en échec');
            json(res, code === 0 ? 200 : 500, { ok: code === 0, journal, fichier: HABILLEE.replace(ROOT + '/', ''), copie });
        });
        return;
    }
    if (req.method === 'GET' && p === '/habillee.mp4') return servir(req, res, join(SORTIE, 'caramel-7-demo-habillee.mp4'), 'video/mp4');

    res.writeHead(404);
    res.end();
});

serveur.listen(PORT, '127.0.0.1', () => {
    const adresse = `http://127.0.0.1:${PORT}/`;
    console.log(`Studio voix off : ${adresse}\nPrises : ${PRISES.replace(ROOT + '/', '')}/\n(Ctrl+C pour arrêter)`);
    if (process.platform === 'darwin' && !process.argv.includes('--sans-navigateur')) spawn('open', [adresse], { stdio: 'ignore' });
});
