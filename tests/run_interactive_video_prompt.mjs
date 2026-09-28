/**
 * run_interactive_video_prompt.mjs — En-tête des SOURCES du prompt « Vidéo interactive ».
 *
 * DÉFAUT COUVERT (vidéo YouTube de 288 s, 113 horodatages) : `buildVideoHeader` annonçait
 * systématiquement, EN FIN DE PROMPT (bloc SOURCES, donc APRÈS les règles), une ligne du type
 *
 *   « (NOMBRE MAXIMUM DE QUESTIONS : … → AU MAXIMUM 113 questions au total,
 *      QUEL QUE SOIT LE NOMBRE DEMANDÉ. N'en produis jamais davantage.) »
 *
 * qui CONTREDIT frontalement la règle « Nombre de questions : … JAMAIS plus de 10 au total »
 * écrite quelques lignes plus haut, en se présentant comme un écrasement explicite de celle-ci.
 * Un modèle qui suit la dernière consigne part rédiger des dizaines de questions, la génération
 * dépasse le **mur des 59 s** du proxy n8n et échoue (cf. docs/guide-generation-par-lots.md §1 :
 * « 10 questions ≈ échec » pour le modèle par défaut).
 *
 * ⚠️ Ce défaut n'est PAS la cause de l'incident de prod du 2026-08-26 sur cette vidéo (tâches n8n
 * 1564109 / 1564152) : `mistral-small-4-119b` était en panne côté ILaaS et repartait en fallback
 * même sur un prompt de 90 caractères. Le défaut couvert ici a été trouvé chemin faisant ; il est
 * réel, mais il mordait sur les vidéos LONGUES, pas sur celle-là.
 *
 * Le plafond physique n'a pas disparu : il reste appliqué de façon DÉTERMINISTE après génération
 * par `snapInteractions` (une question par ancre). L'en-tête ne doit le RAPPELER que lorsqu'il
 * borne réellement quelque chose — c'est-à-dire quand il y a MOINS d'horodatages que de questions
 * demandées.
 *
 * La transcription de test est la VRAIE transcription de la vidéo qui a échoué
 * (tests/fixtures/interactive-video-transcript.json, extraite du payload n8n).
 *
 * Lancement :  node tests/run_interactive_video_prompt.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8107;

const FIXTURE = JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/interactive-video-transcript.json'), 'utf8'));

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stop);

async function waitForServer(ms = 15000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return true; }
        catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

const CAP_LINE = 'NOMBRE MAXIMUM DE QUESTIONS';
let failures = 0;
const check = (ok, label, detail = '') => {
    console.log(`${ok ? '✅' : '🐞'} ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures++;
};

if (!await waitForServer()) { console.error('❌ serveur local indisponible'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => { console.error('❌ erreur de page :', e.message); failures++; });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
// Le dictionnaire complet (fr.json + socle en.json, cf. BASE_LOCALE) arrive APRÈS DOMContentLoaded :
// sans cette attente, les modèles de prompt sont vides et le cas 1 échoue au hasard.
await page.evaluate(async () => { await (await import('/js/core/translation.js')).loadTranslations('fr'); });

/**
 * Construit le prompt « Vidéo interactive » DANS LA PAGE, avec le vrai module, pour un jeu de
 * segments et un nombre de questions donné (null = mode Rapide, champ vide).
 */
const buildPrompt = (segments, duration, nombreQuestions) => page.evaluate(async ({ segments, duration, nombreQuestions }) => {
    const mod = await import('/js/services/prompt-generator.js');
    // Mode Guidé si un nombre est demandé (readContextParams ne lit `nombreQuestions` qu'en Avancé).
    const simple = document.querySelector('.mode-tab[data-mode="simple"]');
    if (simple) simple.classList.toggle('active', !nombreQuestions);
    const champ = document.getElementById('nombreQuestions');
    if (champ) champ.value = nombreQuestions == null ? '' : String(nombreQuestions);
    return mod.buildVideoInteractivePrompt(segments, duration);
}, { segments, duration, nombreQuestions });

// ── Cas 1 : LE CAS DE PROD — 113 horodatages, mode Rapide (aucun nombre demandé) ──
const long = await buildPrompt(FIXTURE.segments, FIXTURE.duration, null);
check(!long.includes(CAP_LINE), 'Cas prod (113 ancres, mode Rapide) : aucune ligne « nombre maximum »',
    long.includes(CAP_LINE) ? long.split('\n').find(l => l.includes(CAP_LINE)).slice(0, 120) : '');
check(long.includes(`(Durée de la vidéo : ${FIXTURE.duration} secondes`),
    'Cas prod : la ligne de durée est conservée (borne des timestamps)');
check(long.includes('JAMAIS plus de 10 au total'),
    'Cas prod : la règle éditoriale « JAMAIS plus de 10 » reste la seule consigne de volume');
check(/\[0:10\] Dans l'industrie agroalimentaire/.test(long),
    'Cas prod : la transcription horodatée est bien injectée en SOURCES');

// ── Cas 2 : transcription PAUVRE (4 ancres) — la ligne redevient informative ──
const court = [
    { start: 0, end: 30, text: 'Introduction.' },
    { start: 30, end: 60, text: 'Première idée.' },
    { start: 60, end: 90, text: 'Deuxième idée.' },
    { start: 90, end: 120, text: 'Troisième idée.' },
    { start: 120, end: 150, text: 'Conclusion.' },
];
const petit = await buildPrompt(court, 150, null);
check(petit.includes(CAP_LINE), 'Transcription pauvre (4 ancres < 10) : la ligne « nombre maximum » est émise');
check(petit.includes('AU MAXIMUM 4 questions au total'), 'Transcription pauvre : le plafond annoncé vaut 4');
check(!petit.includes('quel que soit le nombre demandé'),
    'Transcription pauvre : la formule qui écrasait les règles a disparu');

// ── Cas 3 : mode Guidé, 30 questions demandées sur 113 ancres → pas de bornage à annoncer ──
const guide113 = await buildPrompt(FIXTURE.segments, FIXTURE.duration, 30);
check(!guide113.includes(CAP_LINE), 'Guidé 30 questions / 113 ancres : rien à annoncer (les ancres ne bornent pas)');
check(guide113.includes('30 questions au maximum'), 'Guidé 30 questions : la demande de l’enseignant est transmise');

// ── Cas 4 : mode Guidé, 30 questions demandées sur 4 ancres ──
// `clampVideoCount` ramène déjà la demande à 4 DANS LES RÈGLES : l'en-tête n'a plus rien à
// rappeler, et surtout plus rien à contredire. Une seule consigne de volume, jamais deux.
const guide4 = await buildPrompt(court, 150, 30);
check(guide4.includes('4 questions au maximum'),
    'Guidé 30 questions / 4 ancres : le nombre demandé est ramené au plafond (clampVideoCount)');
check(!guide4.includes(CAP_LINE),
    'Guidé 30 questions / 4 ancres : pas de second plafond dans l’en-tête (les règles le portent déjà)');
check(!/questions au maximum[\s\S]*AU MAXIMUM/.test(guide4),
    'Aucun prompt ne contient deux consignes de volume concurrentes');

// ── Cas 5 : SECONDE COUTURE — le prompt affiché/copiable (generatePrompts → videoSourcesFor) ──
// `setVideoTranscriptSources` est appelé à la RÉCUPÉRATION de la transcription, alors que le
// nombre de questions peut être saisi APRÈS. L'en-tête doit donc être assemblé au moment du
// prompt, pas à la mémorisation : on vérifie qu'un nombre saisi après coup est bien pris en compte.
const copie = await page.evaluate(async ({ segments, duration }) => {
    const mod = await import('/js/services/prompt-generator.js');
    mod.setVideoTranscriptSources(segments, duration);   // transcription d'abord…
    document.querySelector('.mode-tab[data-mode="simple"]')?.classList.remove('active');
    document.getElementById('qui').value = 'Formateur';
    document.getElementById('quoi').value = 'démarche HACCP';
    document.getElementById('niveau').value = '';
    document.getElementById('nombreQuestions').value = '3';   // …nombre saisi APRÈS
    mod.generatePrompts();   // écrit les prompts dans des <textarea id="hidden-…">
    return { prompt: document.getElementById('hidden-interactiveVideoResultat')?.value || '' };
}, { segments: court, duration: 150 });
check(!!copie.prompt, 'Couture « prompt copiable » : un prompt Vidéo interactive est bien produit');
check(copie.prompt.includes('3 questions au maximum'),
    'Couture « prompt copiable » : le nombre saisi APRÈS la transcription est pris en compte');
check(!copie.prompt.includes(CAP_LINE),
    'Couture « prompt copiable » : aucune ligne « nombre maximum » concurrente');
check(copie.prompt.includes('(Durée de la vidéo : 150 secondes'),
    'Couture « prompt copiable » : la ligne de durée est présente');

await browser.close();
stop();
console.log(failures ? `\n❌ ${failures} échec(s)` : '\n✅ Tout est vert');
process.exit(failures ? 1 : 0);
