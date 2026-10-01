#!/usr/bin/env node
/**
 * Tourne la vidéo de présentation de Caramel 7, dans le vrai Caramel servi en
 * local, et la monte : vidéo muette à commenter, version avec une voix témoin,
 * sous-titres, et texte de la voix off minuté.
 *
 *   node scripts/video-demo/tourner.mjs --enregistrer-ia   1. interroge le VRAI modèle et garde ses réponses
 *   node scripts/video-demo/tourner.mjs --enregistrer-ia=plan-attente,fabrication
 *                                                          (1 bis) ne réinterroge que ces scènes ; les autres
 *                                                          rejouent leurs réponses gardées
 *   node scripts/video-demo/tourner.mjs                    2. tourne en rejouant ces réponses, puis monte
 *
 * Options : --video=parcours (la vidéo « Créer un parcours » ; défaut : la présentation, cf.
 * video.mjs), --voix=Thomas (voix `say` de macOS pour la voix témoin), --debit=160
 * (mots/minute : une voix humaine posée, un peu plus lente que la synthèse par
 * défaut), --sortie=<dossier> (défaut : celui de la vidéo, cf. video.mjs), --garder-images,
 * --jusqua=<scène> (s'arrêter après une scène, sans caméra : mise au point).
 *
 *   node scripts/video-demo/studio.mjs                     3. enregistre les VRAIES voix, prompteur et micro, puis monte
 *   node scripts/video-demo/tourner.mjs --mixer=<dossier>  (ou) pose des voix enregistrées ailleurs, un fichier par bloc
 *   node scripts/video-demo/tourner.mjs --texte            réécrit voix-off.md depuis marques.json
 *
 * **Pourquoi deux passes.** Le jour du tournage, ILaaS peut être lent ou en panne
 * (piège 5 du CLAUDE.md), et une génération réelle dure de 15 s à plusieurs
 * minutes. La première passe pose les vraies questions au vrai modèle et garde
 * ses réponses, TELLES QUELLES, dans `tests/fixtures/video-demo/reponses-ia.json`,
 * avec leur durée réelle. La seconde les rejoue au niveau du réseau (les webhooks
 * submit/result, comme `tests/qa-manuel/k-quiz-lots.mjs`) : tout le pipeline de
 * Caramel tourne pour de bon, seul le modèle est remplacé par son enregistrement.
 * Une passe d'enregistrement relancée ne réinterroge que les demandes inconnues.
 *
 * **Honnêteté du montage.** Les attentes sont raccourcies (sondage accéléré,
 * réponses rendues en 1 à 3 s), et chaque attente raccourcie affiche à l'écran
 * sa durée RÉELLE, mesurée à l'enregistrement. La voix off la dit aussi.
 *
 * Aucune requête ne sort vers autre chose que le modèle : la mesure d'audience
 * et les statistiques d'usage sont coupées, pour que la démonstration ne compte
 * pas comme un usage réel.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { SCRIPT_PAGE, creerMain } from './plateau.mjs';
import { VIDEO, SCENARIO } from './video.mjs';
import { chronologie, filtrePrise, lireMontage, poserPrise, reglageAudio } from './montage.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { SCENES, CARTON_TITRE, RETOUCHE } = SCENARIO;
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const option = (nom, defaut) => (argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=').slice(1).join('=') || defaut;
const ENREGISTRER = argv.some(a => a === '--enregistrer-ia' || a.startsWith('--enregistrer-ia='));
/**
 * Les scènes à réinterroger (`--enregistrer-ia=a,b`) ; vide : toutes. Les autres
 * rejouent leurs réponses gardées : refaire la partie « parcours » ne doit pas
 * changer le quiz, dont la scène « edition » corrige une erreur RÉELLE du modèle.
 */
const A_ENREGISTRER = new Set(option('enregistrer-ia', '').split(',').filter(Boolean));
const enregistreScene = id => ENREGISTRER && (!A_ENREGISTRER.size || A_ENREGISTRER.has(id));
const SORTIE = resolve(option('sortie', VIDEO.sortie));
const VOIX = option('voix', 'Thomas');
const DEBIT = Number(option('debit', 160));
/** Arrêter après cette scène, sans montage : pour mettre une scène au point. */
const JUSQUA = option('jusqua', null);
/**
 * Passe à blanc : rejoue le tournage aux mêmes minutages, sans caméra, et relève
 * seulement le journal des gestes (tests/.video-demo/7.1/journal.json), scène par scène.
 * Les gestes étant calés sur les phrases de la voix, leurs instants relatifs à la
 * scène sont ceux de la vidéo déjà tournée : l'habillage s'en sert sans retourner.
 */
const JOURNAL = argv.includes('--journal');
const FIXTURE = VIDEO.fixture;
const PORT = 8241;
const VUE = { width: 1440, height: 810 };
const DENSITE = 1920 / 1440;          // 1440×810 CSS → 1920×1080 à l'image
const IPS = 30;
const MARGE_SCENE = 700;              // silence après la dernière phrase d'une scène (ms)
const BLANC_PHRASES = 0.35;           // entre deux phrases d'une même scène (s)

for (const d of [SORTIE, join(SORTIE, 'voix'), join(SORTIE, 'fichiers'), join(SORTIE, 'controle')]) mkdirSync(d, { recursive: true });
mkdirSync(dirname(FIXTURE), { recursive: true });

/* ------------------------------------------------------------------ *
 *  Les vraies voix : --mixer=<dossier>
 * ------------------------------------------------------------------ *
 * Chacun enregistre ses blocs de `voix-off.md`, un fichier par scène, nommé
 * comme la scène (`apercu.m4a`, `07-apercu.wav`, `plan-attente.mp3`…). Chaque
 * fichier est posé au début de sa scène sur la vidéo muette du dernier tournage
 * (`marques.json`), sans rien retourner. Le niveau est harmonisé (norme de
 * diffusion web, -16 LUFS) : deux voix enregistrées sur deux micros différents
 * ne sautent pas d'un volume à l'autre.
 */
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Le texte de la voix off, minuté, écrit depuis les marques du tournage (`--texte` le réécrit seul). */
function ecrireTexte({ duree, marques }) {
    const md = [`# ${VIDEO.titre} — texte de la voix off`, '',
        `Durée totale : **${mmss(duree)}**. Chaque bloc commence au minutage indiqué ; son texte tient dans le temps de la scène à un débit posé (${DEBIT} mots/min).`,
        'Les attentes raccourcies au montage sont signalées à l’écran avec leur durée réelle.', '',
        `**Pour enregistrer vos voix** : \`node scripts/video-demo/studio.mjs${VIDEO.id === 'presentation' ? '' : ` --video=${VIDEO.id}`}\` ouvre le studio (vidéo, prompteur, micro) ; `
        + `on lit au fil de la vidéo, chaque bloc est rangé dans \`${SORTIE.replace(ROOT + '/', '')}/voix-off/\`, et « Monter la vidéo » produit le film. `
        + 'Pour des voix enregistrées ailleurs : un fichier audio par bloc, nommé comme lui (`apercu.m4a`…), puis '
        + '`node scripts/video-demo/tourner.mjs --mixer=<dossier>`. Les sous-titres fournis ne valent que pour le texte lu tel quel.', ''];
    let chap = null;
    for (const mq of marques) {
        if (mq.chapitre !== undefined && mq.chapitre !== chap) { chap = mq.chapitre; if (chap) md.push(`## ${chap}`, ''); }
        md.push(`**${mmss(mq.debut)} – ${mmss(mq.fin)}** · bloc \`${mq.id}\``, '', mq.phrases.map(p => p.texte).join(' '), '');
    }
    writeFileSync(join(SORTIE, 'voix-off.md'), md.join('\n'));
}
if (argv.includes('--texte')) { ecrireTexte(JSON.parse(readFileSync(join(SORTIE, 'marques.json'), 'utf8'))); process.exit(0); }

/**
 * La progression lue par le studio (qui lance ce script) : une ligne `@progression <0..1> <étape>`
 * sur la sortie, seulement quand on la demande — en terminal, elle encombrerait.
 */
const progression = (f, etape) => { if (process.env.STUDIO_PROGRESSION) console.log(`@progression ${f.toFixed(4)} ${etape}`); };

const MIXER = option('mixer', null);
if (MIXER) {
    const { readdirSync } = await import('node:fs');
    const dossier = resolve(MIXER);
    const { duree, marques } = JSON.parse(readFileSync(join(SORTIE, 'marques.json'), 'utf8'));
    const muet = join(SORTIE, 'caramel-7-demo-muette.mp4');
    // Les rallonges de la table de montage : chaque bloc peut durer un peu plus que sa scène.
    const montage = lireMontage(SORTIE);
    const chrono = chronologie(marques, duree, montage.rallonges);
    if (chrono.totalRallonges) console.log(`  rallonges : ${chrono.blocs.filter(b => b.rallonge).map(b => `${b.id} +${b.rallonge} s`).join(', ')}`);
    const dureeAudio = f => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim());
    const fichiers = readdirSync(dossier).filter(f => /\.(m4a|mp3|wav|aac|ogg|opus|flac|aiff?)$/i.test(f));
    const poses = [];
    for (const mq of marques) {
        const f = fichiers.find(x => x.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]/, '') === mq.id);
        if (!f) { console.log(`  · ${mq.id} : pas d'enregistrement (silence)`); continue; }
        const d = dureeAudio(join(dossier, f));
        // La place d'un bloc court jusqu'au bloc suivant (le dernier, jusqu'à la fin du film), rallonge comprise.
        const b = chrono.blocs.find(x => x.id === mq.id);
        const place = b.place + b.rallonge;
        // Les réglages de la table de montage : part gardée, gain, décalage (la prise reste intacte).
        const r = reglageAudio(montage, mq.id, d);
        const retouches = [r.debut > 0 && `début coupé ${r.debut.toFixed(2)} s`, r.fin < d - 0.01 && `fin coupée à ${r.fin.toFixed(2)} s`,
            r.gain && `${r.gain > 0 ? '+' : ''}${r.gain} dB`, r.decalage && `décalée de ${r.decalage > 0 ? '+' : ''}${r.decalage.toFixed(2)} s`].filter(Boolean);
        console.log(`  ✓ ${mq.id} : ${f} (${d.toFixed(1)} s pour ${place.toFixed(1)} s de scène${b.rallonge ? `, dont ${b.rallonge} s de rallonge` : ''})${retouches.length ? ` · ${retouches.join(', ')}` : ''}`);
        if (r.fin + r.decalage > place + 0.5) console.warn(`    ⚠ déborde de ${(r.fin + r.decalage - place).toFixed(1)} s sur la scène suivante : lire un peu plus vite, ou rallonger le bloc dans la table de montage`);
        poses.push({ f: join(dossier, f), ...poserPrise(b, r) });
    }
    if (!poses.length) { console.error(`Aucun fichier audio reconnu dans ${dossier}`); process.exit(1); }

    // Le bruit de fond de la pièce : le niveau des 5 % de fenêtres de 50 ms les plus
    // calmes, toutes prises confondues. La normalisation à -16 LUFS remonte la voix
    // d'une dizaine de dB, et ce souffle avec elle : on l'atténue d'abord (afftdn),
    // réglé sur ce plancher mesuré plutôt que sur une valeur au hasard.
    let debruiter = '';
    if (!argv.includes('--sans-debruitage')) {
        const niveaux = [];
        for (const p of poses) {
            const brut = spawnSync('ffmpeg', ['-v', 'error', '-i', p.f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }).stdout;
            const x = new Int16Array(brut.buffer, brut.byteOffset, Math.floor(brut.length / 2));
            for (let i = 0; i + 800 <= x.length; i += 800) {
                let s = 0; for (let j = i; j < i + 800; j++) s += x[j] * x[j];
                niveaux.push(20 * Math.log10(Math.sqrt(s / 800) / 32768 + 1e-9));
            }
        }
        niveaux.sort((a, b) => a - b);
        const plancher = niveaux[Math.floor(niveaux.length * 0.05)];
        if (plancher > -60) {
            const nf = Math.round(Math.min(-25, Math.max(-75, plancher)));
            debruiter = `afftdn=nf=${nf}:nr=12:tn=1,`;
            console.log(`  bruit de fond mesuré : ${plancher.toFixed(0)} dB → débruitage réglé sur ${nf} dB`);
        } else console.log(`  bruit de fond mesuré : ${plancher.toFixed(0)} dB → pas de débruitage`);
    }

    // On tient le carton final un peu plus longtemps : le dernier mot ne tombe pas sur une coupure sèche.
    const TENUE = 1.5;
    const total = chrono.dureeMontee + TENUE;
    const sortie = join(SORTIE, 'caramel-7-demo.mp4');
    // L'image : bloc par bloc, chacun figé sur sa dernière vue le temps de sa rallonge.
    const avecRallonges = chrono.totalRallonges > 0;
    const image = avecRallonges
        ? [`[0:v]split=${chrono.blocs.length}${chrono.blocs.map((_, k) => `[s${k}]`).join('')}`,
            ...chrono.blocs.map((b, k) => `[s${k}]trim=start=${b.debut.toFixed(3)}:end=${b.coupe.toFixed(3)},setpts=PTS-STARTPTS${b.rallonge ? `,tpad=stop_mode=clone:stop_duration=${b.rallonge}` : ''}[b${k}]`),
            `${chrono.blocs.map((_, k) => `[b${k}]`).join('')}concat=n=${chrono.blocs.length}:v=1:a=0,tpad=stop_mode=clone:stop_duration=${TENUE}[image]`].join(';')
        : `[0:v]tpad=stop_mode=clone:stop_duration=${TENUE}[image]`;
    // Chaque prise : sa part gardée, fondue aux coupes, à son gain (montage.mjs).
    const filtres = poses.map((p, k) => filtrePrise(p, k, debruiter));
    const mix = `${poses.map((_, k) => `[a${k}]`).join('')}amix=inputs=${poses.length}:normalize=0:dropout_transition=0,highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,apad,atrim=0:${total.toFixed(3)}[v]`;
    // `-progress` : l'instant encodé, d'où le pourcentage que suit le studio.
    const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostats', '-progress', 'pipe:1', '-y', '-i', muet, ...poses.flatMap(p => ['-i', p.f]),
        '-filter_complex', [image, ...filtres, mix].join(';'),
        '-map', '[image]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', sortie]);
    let erreurs = '', dernier = -1;
    job.stderr.on('data', d => { erreurs += d; });
    job.stdout.on('data', d => {
        const m = /out_time_us=(\d+)/.exec(String(d).split('\n').reverse().join('\n'));
        if (!m) return;
        const f = Math.min(1, Number(m[1]) / 1e6 / total);
        if (f - dernier >= 0.01) { dernier = f; progression(f, 'montage des voix'); }
    });
    const code = await new Promise(ok => job.on('close', ok));
    if (code !== 0) { console.error(erreurs); process.exit(1); }
    progression(1, 'montage des voix');
    console.log(`\n✓ ${sortie.replace(ROOT + '/', '')}`);
    process.exit(0);
}

/* ------------------------------------------------------------------ *
 *  Les réponses du modèle
 * ------------------------------------------------------------------ */

const cle = prompt => createHash('sha1').update(prompt).digest('hex');
const store = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8'))
    : { format: 1, note: 'Réponses RÉELLES du modèle, gardées telles quelles pour la vidéo de présentation (scripts/video-demo/).', appels: [] };
if (!ENREGISTRER && !store.appels.length) {
    console.error('Aucune réponse enregistrée : lancer d’abord  node scripts/video-demo/tourner.mjs --enregistrer-ia');
    process.exit(1);
}
const sauverStore = () => writeFileSync(FIXTURE, JSON.stringify(store, null, 1) + '\n');
// Les scènes réinterrogées perdent leurs anciennes réponses : on garde les nouvelles seules.
if (ENREGISTRER && A_ENREGISTRER.size) {
    const avant = store.appels.length;
    store.appels = store.appels.filter(a => !A_ENREGISTRER.has(a.scene));
    if (avant !== store.appels.length) console.log(`${avant - store.appels.length} réponse(s) gardée(s) retirée(s) : ${[...A_ENREGISTRER].join(', ')} seront réinterrogées.`);
}

/** Durée réelle d'une scène à IA : de la première demande à la dernière réponse. */
function dureesReelles() {
    const d = {};
    for (const s of SCENES.filter(x => x.ia)) {
        const a = store.appels.filter(x => x.scene === s.id);
        if (a.length) d[s.id] = Math.max(...a.map(x => x.recuA)) - Math.min(...a.map(x => x.soumisA));
    }
    return d;
}
const D = ENREGISTRER ? {} : dureesReelles();

/* ------------------------------------------------------------------ *
 *  La voix témoin : sert à minuter les scènes, et à écouter le rythme
 * ------------------------------------------------------------------ */

/** Les sous-titres et la synthèse découpent le texte au même endroit : la phrase. */
const decouper = texte => texte.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«])/).map(s => s.trim()).filter(Boolean);
/** Ce que la synthèse lit de travers : pour la voix témoin seulement. */
const PRONONCER = [[/\bH5P\b/g, 'H 5 P'], [/\bODT\b/g, 'O D T'], [/\bPDF\b/g, 'P D F'], [/\bIA\b/g, 'I A']];

function dureeAudio(fichier) {
    const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fichier], { encoding: 'utf8' });
    return Number(r.stdout.trim());
}

function preparerVoix() {
    const voix = {};
    for (const s of SCENES) {
        const lu = decouper(s.voix({ d: D }));
        const affiche = s.sousTitres ? decouper(s.sousTitres({ d: D })) : lu;
        if (affiche.length !== lu.length) throw new Error(`scène ${s.id} : voix et sous-titres n'ont pas le même nombre de phrases`);
        let t = 0;
        const phrases = lu.map((texte, k) => {
            const dit = PRONONCER.reduce((x, [re, par]) => x.replace(re, par), texte);
            const f = join(SORTIE, 'voix', `${s.id}-${k}-${cle(VOIX + DEBIT + dit).slice(0, 8)}.wav`);
            if (!existsSync(f)) {
                const r = spawnSync('say', ['-v', VOIX, '-r', String(DEBIT), '-o', f, '--file-format=WAVE', '--data-format=LEI16@24000', dit]);
                if (r.status !== 0) throw new Error(`say : ${r.stderr}`);
            }
            const duree = dureeAudio(f);
            const p = { texte: affiche[k], fichier: f, offset: t, duree };
            t += duree + BLANC_PHRASES;
            return p;
        });
        voix[s.id] = { phrases, duree: t - BLANC_PHRASES };
    }
    return voix;
}

/* ------------------------------------------------------------------ *
 *  Le plateau
 * ------------------------------------------------------------------ */

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { server.kill('SIGTERM'); } catch { /* déjà arrêté */ } });
await new Promise(r => setTimeout(r, 1500));

const voix = preparerVoix();
const totalVoix = Object.values(voix).reduce((n, v) => n + v.duree, 0);
console.log(`Voix témoin « ${VOIX} » à ${DEBIT} mots/min : ${Math.round(totalVoix)} s de texte sur ${SCENES.length} scènes.`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VUE, deviceScaleFactor: DENSITE, locale: 'fr-FR', acceptDownloads: true });
await context.addInitScript(SCRIPT_PAGE);
const page = await context.newPage();
page.setDefaultTimeout(30000);
const erreurs = [];
page.on('pageerror', e => { erreurs.push(e.message); console.log('  [pageerror]', e.message.slice(0, 200)); });
page.on('download', async dl => {
    const f = join(SORTIE, 'fichiers', dl.suggestedFilename());
    await dl.saveAs(f).catch(() => {});
    console.log(`  ↓ ${dl.suggestedFilename()}`);
});

let sceneCourante = null;

// ── Le réseau. Les routes déclarées EN DERNIER passent en premier.
await page.route('**/*', r => {
    const u = new URL(r.request().url());
    return u.hostname === '127.0.0.1' ? r.continue() : r.abort();
});
await page.route('**/webhook/caramel/llm/stats-*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

const rejeux = new Map();     // taskId factice → { appel, t0, delai }
const utilises = new Set();
const reels = new Map();      // taskId réel → demande en cours d'enregistrement
let nRejeu = 0;

function choisirAppel(prompt) {
    const k = cle(prompt);
    let i = store.appels.findIndex((a, j) => !utilises.has(j) && a.cle === k);
    if (i < 0 && !enregistreScene(sceneCourante)) {
        // Le prompt a bougé depuis l'enregistrement (texte d'un gabarit retouché…) :
        // on rend la réponse suivante de la même scène, dans l'ordre, et on le dit.
        i = store.appels.findIndex((a, j) => !utilises.has(j) && a.scene === sceneCourante);
        if (i >= 0) console.warn(`  ⚠ prompt inconnu en scène « ${sceneCourante} » : réponse n° ${i} rendue dans l'ordre (réenregistrer si le contenu doit suivre).`);
    }
    if (i >= 0) utilises.add(i);
    return i;
}

await page.route('**/webhook/caramel/llm/submit-*', async route => {
    const corps = JSON.parse(route.request().postData() || '{}');
    const i = choisirAppel(corps.prompt || '');
    if (i < 0) {
        if (!enregistreScene(sceneCourante)) return route.fulfill({ status: 500, body: 'aucune réponse enregistrée pour cette demande' });
        return route.continue();                       // demande nouvelle : au vrai modèle
    }
    const appel = store.appels[i];
    const taskId = `demo-${++nRejeu}`;
    const delai = ENREGISTRER ? 300 : Math.min(2600, Math.max(1200, appel.dureeMs * 0.08));
    rejeux.set(taskId, { appel, t0: Date.now(), delai });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taskId, status: 'pending' }) });
});
await page.route('**/webhook/caramel/llm/result-*', async route => {
    const taskId = new URL(route.request().url()).searchParams.get('taskId');
    const r = rejeux.get(taskId);
    if (!r) return route.continue();
    const repondre = corps => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corps) });
    if (Date.now() - r.t0 < r.delai) return repondre({ status: 'processing' });
    const a = r.appel;
    return repondre(a.statut === 'error'
        ? { status: 'error', message: a.message }
        : { status: 'done', content: a.contenu, model: a.modele, fallback_level: a.repli || 0, prompt_tokens: 0, completion_tokens: 0 });
});

// ── L'enregistrement des vraies réponses (passe 1 seulement).
if (ENREGISTRER) {
    page.on('request', req => {
        if (req.method() === 'POST' && /\/llm\/submit-/.test(req.url())) req._soumisA = Date.now();
    });
    page.on('response', async resp => {
        const url = resp.url();
        try {
            if (/\/llm\/submit-/.test(url) && resp.request().method() === 'POST') {
                const { taskId } = await resp.json();
                if (!taskId || rejeux.has(taskId)) return;
                const prompt = JSON.parse(resp.request().postData() || '{}').prompt || '';
                reels.set(taskId, { scene: sceneCourante, cle: cle(prompt), prompt, soumisA: resp.request()._soumisA || Date.now() });
                console.log(`  → modèle interrogé (${sceneCourante}, ${prompt.length} car.)`);
            } else if (/\/llm\/result-/.test(url)) {
                const taskId = new URL(url).searchParams.get('taskId');
                const r = reels.get(taskId);
                if (!r) return;
                const data = await resp.json();
                if (data.status !== 'done' && data.status !== 'error') return;
                reels.delete(taskId);
                const recuA = Date.now();
                store.appels.push({ ...r, recuA, dureeMs: recuA - r.soumisA, statut: data.status,
                    contenu: data.content ?? null, message: data.message ?? null, modele: data.model ?? null, repli: data.fallback_level ?? 0 });
                sauverStore();
                console.log(`  ← réponse ${data.status} en ${Math.round((recuA - r.soumisA) / 1000)} s (${data.model || '?'}, repli ${data.fallback_level ?? 0})`);
            }
        } catch (e) { console.warn('  enregistrement :', e.message); }
    });
}

/* ------------------------------------------------------------------ *
 *  La caméra : le screencast de Chromium, image par image
 * ------------------------------------------------------------------ */

async function demarrerCamera() {
    const dossier = join(SORTIE, 'images');
    rmSync(dossier, { recursive: true, force: true });
    mkdirSync(dossier, { recursive: true });
    const cdp = await context.newCDPSession(page);
    const images = [];
    const ecritures = [];
    cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
        const f = join(dossier, `i${String(images.length).padStart(6, '0')}.jpg`);
        images.push({ t: Date.now(), f });
        ecritures.push(writeFile(f, Buffer.from(data, 'base64')));
        cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    return {
        images, dossier,
        async arreter() { await cdp.send('Page.stopScreencast').catch(() => {}); await Promise.all(ecritures); },
    };
}

/* ------------------------------------------------------------------ *
 *  Le tournage
 * ------------------------------------------------------------------ */

await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const m = creerMain(page);
if (!ENREGISTRER) {
    // Sondage resserré : l'attente à l'écran suit la réponse rejouée, pas les 5 s
    // de délai initial prévus pour un vrai modèle (POLL_TIMINGS est exporté pour ça).
    await page.evaluate(async () => {
        const llm = await import('/js/services/llm.js');
        llm.POLL_TIMINGS.initialDelayMs = 600;
        llm.POLL_TIMINGS.intervalMs = 400;
    });
}
await m.carton(CARTON_TITRE);
await m.pause(1000);

const camera = ENREGISTRER || JUSQUA || JOURNAL ? null : await demarrerCamera();
// La première image du screencast peut être périmée (antérieure au carton) et il
// n'en vient plus aucune tant que rien ne bouge : on force un rafraîchissement.
await page.evaluate(() => window.__demo.rafraichir());
await m.pause(400);
const t0 = Date.now();
const marques = [];

for (const s of SCENES) {
    sceneCourante = s.id;
    const v = voix[s.id];
    const debut = Date.now();
    console.log(`▶ ${s.id}  (voix ${v.duree.toFixed(1)} s)`);
    if ('chapitre' in s) await m.chapitre(s.chapitre);
    const phrase = async n => {
        if (ENREGISTRER || !v.phrases[n]) return;
        const reste = debut + v.phrases[n].offset * 1000 - Date.now();
        if (reste > 0) await page.waitForTimeout(reste);
    };
    try {
        await s.jouer({ m, page, phrase, d: D, retouche: RETOUCHE });
    } catch (e) {
        await page.screenshot({ path: join(SORTIE, 'controle', `ECHEC-${s.id}.png`) }).catch(() => {});
        console.error(`  ✗ scène « ${s.id} » : ${e.message.split('\n')[0]}`);
        if (camera) await camera.arreter();
        await browser.close();
        server.kill('SIGTERM');
        process.exit(1);
    }
    if (!ENREGISTRER) {
        const reste = debut + v.duree * 1000 + MARGE_SCENE - Date.now();
        if (reste > 0) await page.waitForTimeout(reste);
    }
    const fin = Date.now();
    // Les gestes de la scène, en secondes depuis son début.
    const gestes = m.journal.filter(e => e.t >= debut && e.t <= fin).map(({ t, fin: f, ...e }) =>
        ({ ...e, dt: +((t - debut) / 1000).toFixed(3), ...(f ? { dtFin: +((f - debut) / 1000).toFixed(3) } : {}) }));
    marques.push({ id: s.id, chapitre: s.chapitre, ecran: s.ecran || '', debut: (debut - t0) / 1000, fin: (fin - t0) / 1000, voix: v, gestes });
    await page.screenshot({ path: join(SORTIE, 'controle', `${String(marques.length).padStart(2, '0')}-${s.id}.png`) }).catch(() => {});
    if (!ENREGISTRER && (fin - debut) / 1000 > v.duree + 4) {
        console.log(`  ⏱ la scène dure ${((fin - debut) / 1000).toFixed(1)} s pour ${v.duree.toFixed(1)} s de voix : silence de ${((fin - debut) / 1000 - v.duree).toFixed(1)} s`);
    }
    if (JUSQUA === s.id) break;
}
const tFin = Date.now();
if (camera) await camera.arreter();
await browser.close();
server.kill('SIGTERM');

if (erreurs.length) console.warn(`⚠ ${erreurs.length} erreur(s) JavaScript pendant le tournage`);
if (JOURNAL) {
    const f = join(SORTIE, 'journal.json');
    writeFileSync(f, JSON.stringify({ vue: VUE, scenes: Object.fromEntries(marques.map(mq => [mq.id, { duree: mq.fin - mq.debut, gestes: mq.gestes }])) }, null, 1));
    console.log(`Journal des gestes : ${f.replace(ROOT + '/', '')} (${marques.reduce((n, mq) => n + mq.gestes.length, 0)} gestes)`);
    process.exit(0);
}
if (JUSQUA) {
    console.log(`Arrêt après « ${JUSQUA} » (captures dans ${join(SORTIE, 'controle').replace(ROOT + '/', '')}/).`);
    process.exit(0);
}
if (ENREGISTRER) {
    sauverStore();
    console.log(`\n${store.appels.length} réponse(s) du modèle gardée(s) dans ${FIXTURE.replace(ROOT + '/', '')}`);
    for (const [k, v] of Object.entries(dureesReelles())) console.log(`  ${k} : ${Math.round(v / 1000)} s réelles`);
    process.exit(0);
}

/* ------------------------------------------------------------------ *
 *  Le montage
 * ------------------------------------------------------------------ */

const duree = (tFin - t0) / 1000 + 0.5;
console.log(`\nMontage : ${camera.images.length} images, ${duree.toFixed(1)} s`);

// 1. Les images, à cadence fixe : pour chaque image de sortie (k / IPS), la dernière
// capture arrivée à cet instant. Le screencast n'émet qu'au changement, souvent à
// quelques millisecondes d'écart : le démultiplexeur « concat » de ffmpeg, avec
// des « duration » de 10 ms, décalait tout le film de plusieurs secondes (constaté
// au premier montage : la génération apparaissait 9 s avant son clic).
function ffmpeg(args, quoi) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) throw new Error(`ffmpeg (${quoi}) : ${r.stderr}`);
}

const MUET = join(SORTIE, 'caramel-7-demo-muette.mp4');
{
    const images = camera.images;
    const n = Math.round(duree * IPS);
    const enc = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(IPS), '-c:v', 'mjpeg', '-i', '-',
        '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
        '-r', String(IPS), '-movflags', '+faststart', MUET], { stdio: ['pipe', 'inherit', 'inherit'] });
    const fini = new Promise((ok, ko) => enc.on('close', c => c === 0 ? ok() : ko(new Error(`ffmpeg (vidéo) : code ${c}`))));
    let j = 0, courante = -1, octets = null;
    for (let k = 0; k < n; k++) {
        const t = t0 + (k * 1000) / IPS;
        while (j + 1 < images.length && images[j + 1].t <= t) j++;
        if (j !== courante) { courante = j; octets = readFileSync(images[j].f); }
        if (!enc.stdin.write(octets)) await new Promise(r => enc.stdin.once('drain', r));
    }
    enc.stdin.end();
    await fini;
}
console.log(`  ✓ ${MUET.replace(ROOT + '/', '')}`);

// 2. La voix témoin, chaque phrase posée à son instant.
const poses = marques.flatMap(mq => mq.voix.phrases.map(p => ({ ...p, t: mq.debut + p.offset })));
const VOIX_WAV = join(SORTIE, 'voix-temoin.wav');
{
    const entrees = poses.flatMap(p => ['-i', p.fichier]);
    const filtres = poses.map((p, k) => `[${k}]adelay=${Math.round(p.t * 1000)}:all=1[a${k}]`);
    const mix = `${poses.map((_, k) => `[a${k}]`).join('')}amix=inputs=${poses.length}:normalize=0:dropout_transition=0,apad,atrim=0:${duree.toFixed(3)}[v]`;
    ffmpeg([...entrees, '-filter_complex', [...filtres, mix].join(';'), '-map', '[v]', '-ar', '48000', '-ac', '1', VOIX_WAV], 'voix');
}
const AVEC_VOIX = join(SORTIE, 'caramel-7-demo-voix-temoin.mp4');
ffmpeg(['-i', MUET, '-i', VOIX_WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', AVEC_VOIX], 'mixage');
console.log(`  ✓ ${AVEC_VOIX.replace(ROOT + '/', '')}`);

// 3. Les sous-titres : une phrase par sous-titre, au rythme de la voix témoin.
const tc = (s, sep = ',') => {
    const ms = Math.max(0, Math.round(s * 1000));
    const h = Math.floor(ms / 3600000), mi = Math.floor(ms / 60000) % 60, se = Math.floor(ms / 1000) % 60;
    return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const srt = poses.map((p, k) => {
    const fin = Math.min(p.t + p.duree + 0.3, k + 1 < poses.length ? poses[k + 1].t - 0.05 : duree);
    return `${k + 1}\n${tc(p.t)} --> ${tc(fin)}\n${p.texte}\n`;
}).join('\n');
writeFileSync(join(SORTIE, 'caramel-7-demo.srt'), srt);
writeFileSync(join(SORTIE, 'caramel-7-demo.vtt'), 'WEBVTT\n\n' + srt.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2'));

// 4. Les marques du tournage, et le texte de la voix off qui en découle.
const bilan = { duree, marques: marques.map(({ voix: v, ...r }) => ({ ...r, phrases: v.phrases.map(({ fichier, ...p }) => p) })) };
writeFileSync(join(SORTIE, 'marques.json'), JSON.stringify(bilan, null, 1));
ecrireTexte(bilan);

if (!argv.includes('--garder-images')) rmSync(camera.dossier, { recursive: true, force: true });
console.log(`\n✓ ${mmss(duree)} de vidéo dans ${SORTIE.replace(ROOT + '/', '')}/`);
