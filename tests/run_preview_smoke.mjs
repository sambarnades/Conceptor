/**
 * run_preview_smoke.mjs — « Est-ce que ça s'OUVRE ? », pour TOUS les types H5P.
 *
 * Complément de run_preview_feedback.mjs (qui inspecte finement les champs de
 * feedback sur 10 activités) : ici on ne regarde qu'une chose, mais sur TOUTES
 * les fixtures d'exemple de TOUS les types H5P — l'activité se construit-elle et
 * s'affiche-t-elle réellement dans h5p-standalone ?
 *
 * Pour chaque fixture : healer → processeur → createH5PBlob → H5PManager.load,
 * puis on vérifie que l'iframe H5P contient un contenu non vide, qu'aucun message
 * d'erreur de chargement n'est affiché, et on capture l'écran.
 *
 * La suite navigateur couvre la CONSTRUCTION du .h5p ; elle ne monte pas le
 * lecteur. C'est ce banc qui détecte un contenu qui « ne s'ouvre plus ».
 *
 * Lancement :  node tests/run_preview_smoke.mjs [--module=X] [--sortie=<dossier>]
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    console.error('❌ Playwright introuvable. Installer : cd tests/roundtrip && npm install');
    process.exit(2);
}

const args = process.argv.slice(2);
const filtreModule = (args.find(a => a.startsWith('--module=')) || '').replace('--module=', '');
const SORTIE = (args.find(a => a.startsWith('--sortie=')) || '').replace('--sortie=', '')
    || join(ROOT, 'tests/.captures-smoke');
const PORT = 8091;

// ------------------------------------------------------- table des fixtures
// Source de vérité : la table de cas de tests/test-edit-export-flow.js (elle
// associe déjà chaque exemple à son module). On y ajoute les types dont les
// exemples n'y figurent pas, par convention de nommage.
function chargerCas() {
    const src = readFileSync(join(ROOT, 'tests/test-edit-export-flow.js'), 'utf8');
    const re = /\{\s*file:\s*'([^']+)',[^}]*?expectedModule:\s*'([^']+)',\s*source:\s*'([^']+)'/g;
    const cas = [];
    for (const m of src.matchAll(re)) {
        if (m[3] === 'h5p') cas.push({ fichier: m[1], module: m[2] });
    }
    const dejaLa = new Set(cas.map(c => c.fichier));
    const PREFIXES = [
        ['dictation_', 'Dictation'],
        ['find_multiple_hotspots_', 'FindMultipleHotspots'],
        ['find_the_hotspot_', 'FindTheHotspot'],
        ['image_hotspots_', 'ImageHotspots'],
        ['interactive_book_', 'InteractiveBook'],
        ['interactive_video_', 'InteractiveVideo']
    ];
    const fs = require('fs');
    for (const f of fs.readdirSync(join(ROOT, 'assets/data/examples')).sort()) {
        if (!f.endsWith('.json') || dejaLa.has(f)) continue;
        const p = PREFIXES.find(([pre]) => f.startsWith(pre));
        if (p) cas.push({ fichier: f, module: p[1] });
    }
    return cas;
}

// ------------------------------------------------------------------ serveur
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: ROOT, stdio: 'ignore'
});
const stopServer = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

async function attendreServeur(timeoutMs = 15000) {
    const fin = Date.now() + timeoutMs;
    while (Date.now() < fin) {
        try {
            const r = await fetch(`http://127.0.0.1:${PORT}/tests/preview-feedback-harness.html`, { method: 'HEAD' });
            if (r.ok) return true;
        } catch { /* pas encore prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

// ---------------------------------------------------------------------- run
let ok = 0, casses = 0, sansMedia = 0;
const rapport = [];
const parModule = new Map();

try {
    if (!await attendreServeur()) {
        console.error(`❌ Serveur HTTP non démarré sur ${PORT}`);
        process.exit(2);
    }
    mkdirSync(SORTIE, { recursive: true });

    let cas = chargerCas();
    if (filtreModule) cas = cas.filter(c => c.module === filtreModule);
    console.log(`▶ ${cas.length} fixtures, ${new Set(cas.map(c => c.module)).size} types H5P\n`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });

    for (const c of cas) {
        const erreurs = [];
        const onErr = e => erreurs.push(String(e.message || e));
        page.on('pageerror', onErr);

        let statut, detail = '';
        try {
            await page.goto(`http://127.0.0.1:${PORT}/tests/preview-feedback-harness.html`,
                { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__pret === true, null, { timeout: 30000 });

            // Texte BRUT : plusieurs fixtures ne sont pas du JSON valide en l'état
            // (backslashes LaTeX) — c'est healJsonString(), dans la page, qui répare.
            const json = readFileSync(join(ROOT, 'assets/data/examples', c.fichier), 'utf8');
            const res = await page.evaluate(async ([cle, data]) => {
                try {
                    await window.__monter(cle, data);
                    return { ok: true };
                } catch (e) {
                    return { ok: false, err: String(e && e.message || e) };
                }
            }, [c.module, json]);

            if (!res.ok) {
                // Les activités à média (fond d'image, audio de dictée…) référencent
                // des fichiers du registre média, absents hors upload utilisateur.
                // Ce n'est pas un défaut de rendu : on le distingue explicitement.
                if (/Média\(s\) référencé|absent/i.test(res.err)) {
                    statut = 'MEDIA'; detail = 'média utilisateur requis (non fourni par la fixture)';
                } else {
                    statut = 'KO'; detail = res.err.slice(0, 140);
                }
            } else {
                await page.waitForSelector('.h5p-iframe', { timeout: 30000 });
                await page.waitForTimeout(1200);

                const vu = await page.evaluate(() => {
                    const hote = document.getElementById('preview');
                    const erreurAffichee = hote.querySelector('.error-msg');
                    if (erreurAffichee) return { erreur: erreurAffichee.textContent.slice(0, 160) };
                    const ifr = hote.querySelector('.h5p-iframe');
                    const doc = ifr && ifr.contentDocument;
                    if (!doc || !doc.body) return { vide: true, raison: 'iframe inaccessible' };
                    return {
                        texte: (doc.body.innerText || '').replace(/\s+/g, ' ').trim().length,
                        noeuds: doc.body.querySelectorAll('*').length
                    };
                });

                if (vu.erreur) { statut = 'KO'; detail = vu.erreur; }
                else if (vu.vide) { statut = 'KO'; detail = vu.raison; }
                else if (vu.noeuds < 5) { statut = 'KO'; detail = `contenu vide (${vu.noeuds} nœuds)`; }
                else { statut = 'OK'; detail = `${vu.noeuds} nœuds, ${vu.texte} car.`; }

                await page.screenshot({ path: join(SORTIE, `${c.module}__${c.fichier.replace('.json', '')}.png`) });
            }
        } catch (e) {
            statut = 'KO'; detail = String(e.message || e).split('\n')[0].slice(0, 140);
        } finally {
            page.off('pageerror', onErr);
        }

        if (statut === 'OK') ok++; else if (statut === 'MEDIA') sansMedia++; else casses++;
        const agg = parModule.get(c.module) || { ok: 0, ko: 0, media: 0 };
        agg[statut === 'OK' ? 'ok' : statut === 'MEDIA' ? 'media' : 'ko']++;
        parModule.set(c.module, agg);

        if (statut !== 'OK') {
            console.log(`  ${statut === 'MEDIA' ? '⊘' : '❌'} ${c.module}/${c.fichier} — ${detail}`);
        }
        rapport.push({ ...c, statut, detail, erreursJs: erreurs.slice(0, 2) });
    }

    await browser.close();
    writeFileSync(join(SORTIE, 'rapport.json'), JSON.stringify(rapport, null, 2));

    console.log('\n--- par type H5P ---');
    for (const [mod, a] of [...parModule].sort()) {
        const marque = a.ko > 0 ? '❌' : (a.ok > 0 ? '✅' : '⊘');
        console.log(`  ${marque} ${mod.padEnd(22)} ouvre=${a.ok} casse=${a.ko} médiaRequis=${a.media}`);
    }
    console.log('');
    console.log('========================================');
    console.log(`ouverture dans h5p-standalone : ${ok} OK / ${casses} cassées / ${sansMedia} média requis`);
    console.log(`captures : ${SORTIE}`);
    console.log('========================================');
} catch (e) {
    console.error('❌ ' + (e.message || e));
    casses = 1;
} finally {
    stopServer();
}
process.exit(casses > 0 ? 1 : 0);
