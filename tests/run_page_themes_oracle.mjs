/**
 * run_page_themes_oracle.mjs — Oracle de rendu des thèmes de Page Moodle/Éléa.
 *
 * Les 4 thèmes (`js/moodle/page-themes/*.js`) produisent du DOM réel et sont donc
 * explicitement DIFFÉRÉS par le banc Node (`harness.mjs` : « Page/Livre → génération
 * HTML via page-themes qui exige un vrai DOM »). Aucun test navigateur ne les couvrait
 * non plus : ~3100 lignes sans oracle, alors que les 4 thèmes réimplémentent les
 * MÊMES 18 blocs et qu'un correctif d'accessibilité ou d'échappement peut n'atterrir
 * que dans l'un d'eux.
 *
 * Ce script exécute les 4 × 18 renderers dans Chromium avec un jeu de données commun,
 * puis hache le `outerHTML` obtenu. Il sert :
 *   - de BASELINE de non-régression (`--update` pour régénérer après un changement voulu) ;
 *   - de détecteur de DIVERGENCE structurelle entre thèmes (mêmes balises, mêmes
 *     attributs d'accessibilité — seul le style doit différer).
 *
 * Lancement :  node tests/run_page_themes_oracle.mjs [--update]
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');

const BASELINE_PATH = join(ROOT, 'tests/fixtures/page-themes-baseline.json');
const UPDATE = process.argv.includes('--update');
const PORT = 8097;

// ---------------------------------------------------------------- serveur
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
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

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });

    const rendered = await page.evaluate(async () => {
        const { getTheme } = await import('/js/moodle/page-themes.js');
        const { formatTextToHtml, escapeHtmlTags } = await import('/js/core/utils.js');
        const { preloadSanitizer, isSanitizerLoaded } = await import('/js/export/sanitizer.js');

        // DÉTERMINISME : `formatTextToHtml` passe par `sanitizeSync`, qui est fail-closed —
        // TANT QUE DOMPurify n'est pas chargé, il échappe TOUT le HTML ; une fois chargé, il
        // laisse passer les balises autorisées. Sans cette attente, le premier rendu d'une
        // session diffère de tous les suivants (constaté : 68 blocs sur 72).
        await preloadSanitizer();
        if (!isSanitizerLoaded()) throw new Error('DOMPurify non chargé : rendu non déterministe');

        // Jeu de données couvrant les 18 blocs. Volontairement « sale » : accents,
        // chevrons, apostrophes, guillemets, champs manquants — pour que l'oracle
        // capture aussi le comportement d'échappement de chaque thème.
        const D = {
            title: "L'« Empire » <romain> & ses provinces",
            text: 'Un texte avec <b>gras</b> et une "citation".',
            subtitle: "Sous-titre d'essai",
            intro: 'Introduction & contexte.',
            items: ["Premier <item>", "Deuxième 'item'", 'Troisième & item'],
            links: [{ text: 'Lien A', href: 'https://example.org/a?x=1&y=2' },
                    { text: "Lien B <b>", href: 'javascript:alert(1)' }],
            events: [{ date: '-27', label: "Fondation de l'Empire" }, { date: '476', label: 'Chute' }],
            callouts: [{ type: 'info', text: 'Note & remarque' }, { type: 'warning', text: 'Attention <!>' }],
            stats: [{ value: '1 200', label: "km d'aqueducs" }, { value: '50 M', label: 'habitants' }],
            headers: ['Terme', 'Définition'],
            rows: [['Forum', 'Place publique & marché'], ['Thermes', "Bains publics"]],
            entries: [{ term: 'Forum', definition: 'Place publique' }, { term: 'Villa', definition: 'Domaine' }],
            chips: ['Forum', 'Thermes', 'Villa'],
            cards: [{ title: 'Colisée', text: 'Amphithéâtre', img_src: 'assets/img/logo.png', img_alt: 'Colisée' },
                    { title: 'Panthéon', text: 'Temple' }],
            left: { title: 'César', caption: 'Général', img_src: 'assets/img/logo.png', img_alt: 'César' },
            right: { title: 'Auguste', caption: 'Empereur', img_src: 'assets/img/logo.png', img_alt: 'Auguste' },
            term: 'Romanisation', definition: "Diffusion du mode de vie romain & de la langue.",
            paragraphs: ['Premier paragraphe.', 'Second & paragraphe.'],
            name: 'Pont du Gard', description: 'Aqueduc romain',
            questions: [{ q: 'Quand ?', a: '-27' }, { q: 'Où ?', a: 'Rome' }],
            myths: ['Mythe A'], realities: ['Réalité B'],
            method: 'Observer & décrire', img_src: 'assets/img/logo.png', img_alt: 'schéma',
            steps: ['Observer le document', "Relever les indices <clés>", 'Rédiger la synthèse & conclure'],
            quote: 'Alea jacta est', translation: 'Le sort en est jeté', author: 'César',
            sources: [{ label: 'Source A', url: 'https://example.org' }],
            caption: 'Légende & suite'
        };

        const ctx = {
            formatTextToHtml, escapeHtmlTags,
            jsonData: D,
            t: (key, fallback) => fallback || key,
            // `headingTag` est une FONCTION (profondeur → balise), pas une chaîne :
            // cf. moodle-creator.js — `(depth = 0) => 'h' + clamp(headingBase + depth)`.
            headingTag: (depth = 0) => 'h' + Math.min(6, Math.max(1, 2 + depth)),
            // `heroLevel` vaut null en export Éléa/Moodle (la plateforme pose le <h1>) ;
            // un entier en contexte .html autonome. On teste le cas EXPORT (null).
            heroLevel: null
        };

        const THEMES = ['elea', 'dsfr', 'accessible', 'dynamique'];
        const out = {};
        for (const id of THEMES) {
            const theme = getTheme(id);
            out[id] = { config: theme.config, blocks: {} };
            for (const [key, fn] of Object.entries(theme.renderers)) {
                try {
                    const el = fn(D, ctx);
                    out[id].blocks[key] = el && el.outerHTML ? el.outerHTML : String(el);
                } catch (e) {
                    out[id].blocks[key] = 'ERREUR: ' + e.message;
                }
            }
        }
        return out;
    });

    await browser.close();

    if (errors.length) {
        console.log(`⚠ ${errors.length} erreur(s) JS de page :`);
        errors.slice(0, 5).forEach(e => console.log('   ' + e.split('\n')[0]));
    }

    // ------------------------------------------------------------ hachage
    const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
    const digest = {};
    for (const [themeId, t] of Object.entries(rendered)) {
        digest[themeId] = { config: sha(JSON.stringify(t.config)), blocks: {} };
        for (const [k, html] of Object.entries(t.blocks)) {
            digest[themeId].blocks[k] = { sha: sha(html), len: html.length };
        }
    }

    // --------------------------------------------------- erreurs de rendu
    let renderErrors = 0;
    for (const [themeId, t] of Object.entries(rendered)) {
        for (const [k, html] of Object.entries(t.blocks)) {
            if (html.startsWith('ERREUR: ')) {
                renderErrors++;
                console.log(`   ❌ ${themeId} / ${k} → ${html}`);
            }
        }
    }

    // ------------------------------------------- divergence entre thèmes
    // Les 4 thèmes doivent produire la MÊME structure (balises + attributs a11y) ;
    // seul le style inline doit différer. On compare la « squelette » de chaque bloc.
    const skeleton = (html) => html
        .replace(/\s+style="[^"]*"/g, '')          // le style est LE point de variation légitime
        .replace(/\s+class="[^"]*"/g, '')
        .replace(/>[^<]*</g, '><');                 // on ne garde que la structure de balises
    const structuralDiffs = [];
    const themeIds = Object.keys(rendered);
    const refId = themeIds[0];
    for (const key of Object.keys(rendered[refId].blocks)) {
        const ref = skeleton(rendered[refId].blocks[key]);
        for (const other of themeIds.slice(1)) {
            const cur = skeleton(rendered[other].blocks[key]);
            if (cur !== ref) structuralDiffs.push({ key, a: refId, b: other });
        }
    }

    // -------------------------------------------------- accessibilité
    // Un attribut a11y présent dans un thème et absent d'un autre = dérive typique.
    const a11yDiffs = [];
    const A11Y = ['aria-label', 'aria-hidden', 'aria-labelledby', 'role', 'alt=', 'scope=', 'lang='];
    for (const key of Object.keys(rendered[refId].blocks)) {
        for (const attr of A11Y) {
            const presence = themeIds.map(id => rendered[id].blocks[key].includes(attr));
            if (presence.some(Boolean) && !presence.every(Boolean)) {
                a11yDiffs.push({
                    key, attr,
                    presents: themeIds.filter((_, i) => presence[i]),
                    absents: themeIds.filter((_, i) => !presence[i])
                });
            }
        }
    }

    // ------------------------------------------------------- baseline
    let baseDiffs = [];
    if (UPDATE || !existsSync(BASELINE_PATH)) {
        writeFileSync(BASELINE_PATH, JSON.stringify(digest, null, 1), 'utf8');
        console.log(`   baseline ${UPDATE ? 'mise à jour' : 'créée'} → tests/fixtures/page-themes-baseline.json`);
    } else {
        const base = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
        for (const themeId of Object.keys(digest)) {
            const b = base[themeId];
            if (!b) { baseDiffs.push(`thème ${themeId} absent de la baseline`); continue; }
            if (b.config !== digest[themeId].config) baseDiffs.push(`${themeId} / config`);
            for (const k of Object.keys(digest[themeId].blocks)) {
                const bb = b.blocks[k], dd = digest[themeId].blocks[k];
                if (!bb) { baseDiffs.push(`${themeId} / ${k} (nouveau bloc)`); continue; }
                if (bb.sha !== dd.sha) baseDiffs.push(`${themeId} / ${k} : ${bb.len} → ${dd.len} octets`);
            }
            for (const k of Object.keys(b.blocks)) {
                if (!digest[themeId].blocks[k]) baseDiffs.push(`${themeId} / ${k} (bloc DISPARU)`);
            }
        }
    }

    // --------------------------------------------------------- rapport
    const nBlocks = Object.values(digest).reduce((s, t) => s + Object.keys(t.blocks).length, 0);
    console.log('');
    console.log(`   ${Object.keys(digest).length} thèmes × 18 blocs = ${nBlocks} rendus`);
    console.log(`   divergences structurelles entre thèmes : ${structuralDiffs.length}`);
    const byKey = {};
    for (const d of structuralDiffs) (byKey[d.key] = byKey[d.key] || []).push(d.b);
    for (const [k, others] of Object.entries(byKey)) {
        console.log(`      ${k} → ${refId} diffère de ${[...new Set(others)].join(', ')}`);
    }
    console.log(`   attributs d'accessibilité inégaux      : ${a11yDiffs.length}`);
    for (const d of a11yDiffs.slice(0, 12)) {
        console.log(`      ${d.key} · ${d.attr} → présent: ${d.presents.join(',')} | absent: ${d.absents.join(',')}`);
    }
    if (baseDiffs.length) {
        console.log('');
        console.log(`   ❌ ${baseDiffs.length} écart(s) vs baseline :`);
        baseDiffs.slice(0, 25).forEach(d => console.log('      ' + d));
    }

    console.log('');
    console.log('========================================');
    console.log(`page-themes : ${nBlocks} rendus | ${renderErrors} erreur(s) | ${baseDiffs.length} écart(s) baseline`);
    console.log('========================================');
    exitCode = (renderErrors === 0 && baseDiffs.length === 0) ? 0 : 1;
    if (exitCode === 0) console.log('✅ Thèmes conformes à la baseline.');
} catch (e) {
    console.error('❌ ' + (e.message || e));
    exitCode = 2;
} finally {
    stop();
}
process.exit(exitCode);
