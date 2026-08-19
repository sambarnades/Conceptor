/**
 * run_prompt_id_resolution.mjs — Résolution du `promptId` d'une activité.
 *
 * Le lien « clé de module → identifiant du textarea de prompt » était RÉÉCRIT À LA
 * MAIN en cinq endroits, avec des couvertures divergentes :
 *
 *   | site                                            | test_elea | glossaireXml |
 *   |-------------------------------------------------|-----------|--------------|
 *   | ui.js — construction du panneau                 |     ✓     |      ✓       |
 *   | ui.js — `promptIdForCopy` (boutons IA externes) |     ✓     |      ✓       |
 *   | ui.js — restauration à l'ouverture de la tuile  |     ✓     |      ✓       |
 *   | prompt-generator.js — `prefixForModule`         |     ✓     |      ✓       |
 *   | prompt-generator.js — rafraîchissement post-gén.|     ✓     |      ✗       |
 *
 * La dernière ligne est un défaut observable : la tuile « Glossaire » ouverte, un clic
 * sur « Générer les prompts » remplit bien `hidden-glossaireXmlResultat` mais PAS le
 * textarea visible — l'utilisateur voit un champ vide et doit refermer/rouvrir la tuile.
 *
 * Ce banc vérifie dans Chromium, pour CHAQUE activité Moodle/Éléa visible, que le
 * prompt généré atterrit dans le textarea affiché. Il couvre le défaut ci-dessus et
 * interdit qu'une sixième copie de la résolution réintroduise une divergence.
 *
 * Lancement :  node tests/run_prompt_id_resolution.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8106;

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

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) pass++;
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); }
};

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    // ---------------------------------------------------------------- 1. cohérence statique
    const resolution = await page.evaluate(async () => {
        const { allModules } = await import('/js/core/definitions.js');
        const { prefixForModule } = await import('/js/services/prompt-generator.js');
        const out = {};
        for (const [k, m] of Object.entries(allModules)) {
            out[k] = { hidden: !!m.hidden, promptId: m.promptId ?? null, prefix: prefixForModule(k) };
        }
        return out;
    });

    // Toute activité VISIBLE qui déclare un prompt doit être résoluble par prefixForModule :
    // c'est ce que consomme la génération par lots (`services/llm-batch.js`).
    const visiblesSansPrefixe = Object.entries(resolution)
        .filter(([, v]) => !v.hidden && v.promptId && !v.prefix)
        .map(([k]) => k);
    ok('toute activité visible avec promptId est résolue par prefixForModule',
        visiblesSansPrefixe.length === 0, visiblesSansPrefixe.join(', '));

    // Les deux Éléa sans `promptId` déclaré (aliasés à la main partout) doivent l'être aussi.
    for (const k of ['test_elea', 'glossaireXml']) {
        ok(`prefixForModule('${k}') est résolu malgré l'absence de promptId`,
            !!resolution[k]?.prefix, `obtenu : ${resolution[k]?.prefix}`);
    }

    // ------------------------------------------------- 2. le prompt atterrit dans le textarea
    const cibles = Object.entries(resolution)
        .filter(([k, v]) => !v.hidden && (v.promptId || k === 'test_elea' || k === 'glossaireXml'))
        .map(([k]) => k);

    console.log(`\n${cibles.length} activité(s) Moodle/Éléa visible(s) à vérifier : ${cibles.join(', ')}\n`);

    for (const moduleKey of cibles) {
        const res = await page.evaluate(async (moduleKey) => {
            const { allModules } = await import('/js/core/definitions.js');
            const ui = await import('/js/ui/ui.js');
            const { generatePrompts } = await import('/js/services/prompt-generator.js');

            const tuile = document.querySelector(`[data-module="${moduleKey}"]`);
            if (!tuile) return { erreur: 'tuile absente du DOM' };

            // Fermer un éventuel panneau ouvert, puis ouvrir celui visé.
            if (typeof ui.closeSidebar === 'function') { try { ui.closeSidebar(); } catch { /* déjà fermé */ } }
            ui.toggleActivityContent(moduleKey, tuile);
            await new Promise(r => setTimeout(r, 60));

            const module = allModules[moduleKey];
            const promptId = module.promptId
                || (moduleKey === 'test_elea' ? 'test_eleaResultat'
                    : moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : null);
            const visible = document.getElementById(promptId);
            if (!visible) return { erreur: `textarea #${promptId} absent après ouverture` };

            // Remplir les champs du mode simple pour que generatePrompts() ne refuse pas.
            const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
            set('qui', 'des élèves de CM2');
            set('quoi', 'les volcans');
            set('niveau', 'CM2');

            visible.value = '';                       // état initial NON rempli
            generatePrompts();                        // ← la tuile est OUVERTE pendant la génération
            await new Promise(r => setTimeout(r, 60));

            const cache = document.getElementById(`hidden-${promptId}`);
            return {
                promptId,
                promptGenere: !!(cache && cache.value && cache.value.length > 30),
                textareaRempli: !!(visible.value && visible.value.length > 30),
                identiques: !!(cache && visible.value === cache.value)
            };
        }, moduleKey);

        if (res.erreur) { ok(`${moduleKey} : ouverture du panneau`, false, res.erreur); continue; }
        ok(`${moduleKey} : le prompt est généré (hidden-${res.promptId})`, res.promptGenere);
        ok(`${moduleKey} : le textarea VISIBLE est rempli sans rouvrir la tuile`,
            res.textareaRempli,
            'le prompt existe en champ caché mais n\'a pas été recopié dans le textarea affiché');
        if (res.promptGenere && res.textareaRempli) {
            ok(`${moduleKey} : le texte affiché est exactement le prompt généré`, res.identiques);
        }
    }

    await browser.close();

    if (pageErrors.length) {
        console.log(`\n${new Set(pageErrors).size} erreur(s) JS de page (indicatif) :`);
        for (const e of [...new Set(pageErrors)].slice(0, 5)) console.log('   • ' + e.slice(0, 130));
    }

    console.log('\n========================================');
    console.log(`résolution du promptId : ${pass} OK / ${fail} échec(s)`);
    console.log('========================================');
    if (fail) { console.log(echecs.join('\n')); exitCode = 1; }
    else console.log('✅ Tous les tests passent.');
} catch (e) {
    console.error('ÉCHEC : ' + (e && e.stack || e));
    exitCode = 1;
} finally {
    stop();
}
process.exit(exitCode);
