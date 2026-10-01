#!/usr/bin/env node
/**
 * Le studio de voix off : la vidéo muette, un prompteur qui suit la lecture, un
 * bouton micro. On lit au fil de la vidéo ; chaque bloc enregistré est rangé sur
 * le disque, prêt pour le mixage, et « Générer la vidéo » produit le film final
 * (montage des voix, habillage, copie sur le Bureau), pourcentage à l'appui.
 *
 *   node scripts/video-demo/studio.mjs          ouvre http://127.0.0.1:8250/ dans le navigateur
 *
 * Options : --port=8250, --sortie=<dossier du tournage>, --prises=<dossier des voix>,
 * --sans-navigateur.
 *
 * Prérequis : un tournage (`node scripts/video-demo/tourner.mjs`), qui laisse la
 * vidéo muette et ses marques dans tests/.video-demo/7.1/.
 *
 * **Pourquoi pas dans la page partagée.** Le cadre des artefacts refuse le micro
 * à tout le monde, sans même le demander. Ici la page est servie par l'ordinateur
 * lui-même (127.0.0.1), que les navigateurs traitent en contexte sûr : le micro
 * y est permis. Le serveur n'écoute QUE la boucle locale.
 *
 * **Où vont les prises.** tests/.video-demo/7.1/voix-off/<bloc>.wav, un fichier par
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
import { ecrireMontage, lireMontage, RALLONGE_MAX } from './montage.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const option = (nom, defaut) => (process.argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=').slice(1).join('=') || defaut;
/** --sortie : le dossier du tournage (marques, vidéo muette, vidéo finale) ; --prises : où ranger les voix. */
const SORTIE = resolve(option('sortie', join(ROOT, 'tests/.video-demo/7.1')));
const PRISES = resolve(option('prises', join(SORTIE, 'voix-off')));
const MARQUES = join(SORTIE, 'marques.json');
const MUETTE = join(SORTIE, 'caramel-7-demo-muette.mp4');
const FINALE = join(SORTIE, 'caramel-7-demo.mp4');
const PORT = Number(option('port', 8250));
const TAILLE_MAX = 60 * 1024 * 1024;
/** Le dossier visible où l'on retrouve la vidéo finale (tests/.video-demo est masqué par le Finder). */
const BUREAU = join(homedir(), 'Desktop', 'Caramel 7 - vidéos');
const HABILLEE = join(SORTIE, 'caramel-7-demo-habillee.mp4');
const COPIE_HABILLEE = join(BUREAU, 'Caramel 7.1 - démonstration commentée.mp4');   // une prise de bloc : quelques Mo ; au-delà, c'est une erreur

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

/**
 * Le travail en cours : une seule génération à la fois, lancée par le studio ou la table,
 * suivie en pourcentage par GET /travail. Les scripts annoncent leur avancée par des lignes
 * `@progression <0..1> <étape>` (variable STUDIO_PROGRESSION) ; chaque étape pèse une part
 * du total, à peu près celle de sa durée (le montage ≈ 1 min, l'habillage ≈ 5 min).
 */
const ETAPES = {
    apercu: [{ nom: 'Montage des voix', script: 'tourner.mjs', args: () => [`--sortie=${SORTIE}`, `--mixer=${PRISES}`], poids: 1 }],
    finale: [
        { nom: 'Montage des voix', script: 'tourner.mjs', args: () => [`--sortie=${SORTIE}`, `--mixer=${PRISES}`], poids: 0.2 },
        { nom: 'Habillage : caméra, cartons, musique', script: 'habillage.mjs', args: () => ['--version=voix', `--sortie=${SORTIE}`], poids: 0.78 },
        { nom: 'Copie sur le Bureau', poids: 0.02 },
    ],
};
let travail = { etat: 'libre' };

function etatTravail() {
    const { job, ...t } = travail;
    const ecoule = t.debut ? ((t.fin || Date.now()) - t.debut) / 1000 : 0;
    const restant = t.etat === 'en-cours' && t.pourcentage > 3 ? ecoule * (100 - t.pourcentage) / t.pourcentage : null;
    return { ...t, ecoule, restant, journal: (t.journal || '').slice(-4000), etapes: t.quoi ? ETAPES[t.quoi].map(e => e.nom) : [] };
}

function lancerTravail(quoi) {
    travail = { quoi, etat: 'en-cours', debut: Date.now(), pourcentage: 0, indice: 0, etape: '', detail: '', journal: '' };
    const t = travail;
    (async () => {
        let base = 0;
        for (const [i, e] of ETAPES[quoi].entries()) {
            t.indice = i; t.etape = e.nom; t.detail = '';
            if (e.script) {
                const code = await new Promise(ok => {
                    const job = spawn(process.execPath, [join(ICI, e.script), ...e.args()], { cwd: ROOT, env: { ...process.env, STUDIO_PROGRESSION: '1' } });
                    t.job = job;
                    let reste = '';
                    job.stdout.on('data', d => {
                        const lignes = (reste + d).split('\n');
                        reste = lignes.pop();
                        for (const l of lignes) {
                            const m = /^@progression ([\d.]+) ?(.*)$/.exec(l);
                            if (m) { t.pourcentage = Math.min(99.5, (base + e.poids * Number(m[1])) * 100); if (m[2]) t.detail = m[2]; }
                            else if (l.trim()) t.journal += l + '\n';
                        }
                    });
                    job.stderr.on('data', d => { t.journal += d; });
                    job.on('close', ok);
                });
                t.job = null;
                if (code !== 0) {
                    t.etat = t.annule ? 'annule' : 'echec'; t.fin = Date.now();
                    console.log(t.annule ? '  ■ génération annulée' : `  ✗ ${e.nom} en échec`);
                    return;
                }
            } else {
                // La vidéo finale, recopiée là où on la retrouve : le dossier de sortie est masqué par le Finder.
                try { mkdirSync(BUREAU, { recursive: true }); copyFileSync(HABILLEE, COPIE_HABILLEE); t.copie = COPIE_HABILLEE.replace(homedir(), '~'); }
                catch (err) { t.journal += `\nCopie sur le Bureau impossible : ${err.message}`; }
            }
            base += e.poids;
            t.pourcentage = Math.min(99.5, base * 100);
        }
        t.etat = 'fini'; t.pourcentage = 100; t.fin = Date.now();
        t.video = quoi === 'finale' ? '/habillee.mp4' : '/finale.mp4';
        t.fichier = (quoi === 'finale' ? HABILLEE : FINALE).replace(ROOT + '/', '');
        console.log(`  ✓ ${quoi === 'finale' ? `vidéo finale${t.copie ? ` → ${t.copie}` : ''}` : 'aperçu monté'} (${Math.round((t.fin - t.debut) / 1000)} s)`);
    })();
}

const serveur = createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && (p === '/' || p === '/studio.html')) return servir(req, res, join(ICI, 'studio.html'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && p === '/table') return servir(req, res, join(ICI, 'table.html'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && p === '/marques.json') return servir(req, res, MARQUES, 'application/json; charset=utf-8');
    // Les réglages de la table de montage (rallonges, audio) et les textes du prompteur.
    // `rallongeMax` : la borne des rallonges, pour que le studio et la table règlent pareil.
    if (req.method === 'GET' && p === '/montage') return json(res, 200, { ...lireMontage(SORTIE), rallongeMax: RALLONGE_MAX });
    if (req.method === 'PUT' && p === '/montage') {
        let corps = '';
        req.on('data', c => { corps += c; if (corps.length > 100000) req.destroy(); });
        req.on('end', () => {
            // Chaque page n'envoie que ce qu'elle règle (rallonges, audio ou textes) : le reste est gardé.
            try { const m = ecrireMontage(SORTIE, { ...lireMontage(SORTIE), ...JSON.parse(corps) }); json(res, 200, m); }
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

    // La génération : l'aperçu (voix posées sur l'image) ou la vidéo finale (montage puis habillage).
    if (req.method === 'GET' && p === '/travail') return json(res, 200, etatTravail());
    if (req.method === 'POST' && p === '/travail') {
        let corps = '';
        req.on('data', c => { corps += c; });
        req.on('end', () => {
            let quoi = 'finale'; try { quoi = JSON.parse(corps).quoi; } catch { /* défaut */ }
            if (!ETAPES[quoi]) return json(res, 400, { erreur: `travail inconnu : ${quoi}` });
            if (travail.etat === 'en-cours') return json(res, 409, { erreur: 'une génération est déjà en cours', ...etatTravail() });
            lancerTravail(quoi);
            json(res, 202, etatTravail());
        });
        return;
    }
    if (req.method === 'POST' && p === '/travail/annuler') {
        if (travail.etat === 'en-cours') { travail.annule = true; travail.job?.kill('SIGTERM'); }
        return json(res, 200, etatTravail());
    }
    if (req.method === 'GET' && p === '/travail.js') return servir(req, res, join(ICI, 'travail.js'), 'text/javascript; charset=utf-8');
    if (req.method === 'GET' && p === '/habillee.mp4') return servir(req, res, join(SORTIE, 'caramel-7-demo-habillee.mp4'), 'video/mp4');

    res.writeHead(404);
    res.end();
});

serveur.listen(PORT, '127.0.0.1', () => {
    const adresse = `http://127.0.0.1:${PORT}/`;
    console.log(`Studio voix off : ${adresse}\nPrises : ${PRISES.replace(ROOT + '/', '')}/\n(Ctrl+C pour arrêter)`);
    if (process.platform === 'darwin' && !process.argv.includes('--sans-navigateur')) spawn('open', [adresse], { stdio: 'ignore' });
});
