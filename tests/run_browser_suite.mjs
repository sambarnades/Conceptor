/**
 * run_browser_suite.mjs — Pilote headless de la suite de tests navigateur.
 *
 * `tests/test-all.html` agrège 42 suites, dont six (`css`, `ui`, `caramelia-ui`,
 * `ui-chrome`, `embed-bridge`, `integration`) chargent `index.html` dans une iframe :
 * ce sont les seules à couvrir `js/ui/ui.js` dans son vrai DOM, que le banc Node
 * (`tests/roundtrip/harness.mjs`) ne peut pas atteindre.
 *
 * Ce script sert le dépôt en HTTP, ouvre la page dans Chromium (Playwright, déjà
 * présent dans `tests/roundtrip/node_modules`), attend le bilan final et renvoie un
 * code de sortie exploitable en non-régression.
 *
 * Lancement :  node tests/run_browser_suite.mjs [--suite=ui,css] [--headed]
 * Prérequis  :  python3 (serveur statique) + playwright installé côté roundtrip.
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
const only = (args.find(a => a.startsWith('--suite=')) || '').replace('--suite=', '');
const headed = args.includes('--headed');
const PORT = 8099;

// ----------------------------------------------------------------- serveur
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], {
    cwd: ROOT, stdio: 'ignore'
});
const stopServer = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

async function waitForServer(timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const r = await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' });
            if (r.ok) return true;
        } catch { /* pas encore prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

// ------------------------------------------------------------------- run
let exitCode = 0;
try {
    if (!await waitForServer()) {
        console.error(`❌ Le serveur HTTP n'a pas démarré sur le port ${PORT}`);
        process.exit(2);
    }

    const browser = await chromium.launch({ headless: !headed });
    const page = await browser.newPage();

    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    page.on('console', msg => {
        const t = msg.text();
        if (/^=== TOUS LES TESTS/.test(t)) console.log('   ' + t.trim());
    });

    const url = `http://127.0.0.1:${PORT}/tests/test-all.html`
        + (only ? `?suite=${encodeURIComponent(only)}` : '');
    console.log(`▶ ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Le runner exécute les suites en séquence puis journalise le bilan.
    // On attend que toutes les lignes de suite aient quitté l'état « en attente ».
    // NB : la signature est waitForFunction(fn, arg, options) — les options doivent
    // venir en TROISIÈME position, sinon Playwright retombe sur son délai de 30 s.
    await page.waitForFunction(() => {
        const rows = document.querySelectorAll('.summary-table tbody tr');
        if (!rows.length) return false;
        return ![...rows].some(r => /attente|en cours/i.test(r.textContent));
    }, null, { timeout: 600000, polling: 500 });

    // Extraction du détail par suite depuis le tableau récapitulatif
    const report = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.summary-table tbody tr')];
        const suites = rows.map(r => {
            const cells = [...r.querySelectorAll('td')].map(c => c.textContent.trim());
            return { cells };
        });
        const cards = [...document.querySelectorAll('.global-summary__card')]
            .map(c => c.textContent.trim());
        // Détail des assertions en échec : sans lui, un test instable ne dit pas
        // QUELLE fixture a lâché, alors que c'est toute l'information utile.
        const failures = [...document.querySelectorAll('.suite-detail__row--fail')]
            .map(r => r.textContent.trim().replace(/\s+/g, ' ').slice(0, 300));
        return { suites, cards, failures, bodyText: document.body.innerText.slice(0, 400) };
    });

    console.log('');
    console.log('   ' + report.cards.join('  |  '));
    console.log('');

    // Le bilan global : premières cartes = PASS / FAIL
    const nums = report.cards.map(c => parseInt(c, 10));
    const totalPass = Number.isFinite(nums[0]) ? nums[0] : null;
    const totalFail = Number.isFinite(nums[1]) ? nums[1] : null;

    // Une suite qui LÈVE (import cassé, module absent) n'a produit aucune assertion :
    // elle ne pèse ni sur PASS ni sur FAIL. Sans le contrôle ci-dessous elle passait donc
    // la porte en silence — un `export` renommé suffisait à retirer une suite de la
    // couverture sans que rien ne le signale.
    const suitesEnErreur = [];
    for (const s of report.suites) {
        const line = s.cells.join(' | ');
        if (/FAIL|ERREUR|error/i.test(line)) console.log('   ❌ ' + line);
        if (/ERREUR/i.test(line)) suitesEnErreur.push(s.cells[0] || line);
    }

    for (const f of (report.failures || [])) console.log('     ↳ ' + f);

    if (pageErrors.length) {
        console.log('');
        console.log(`   ⚠ ${pageErrors.length} erreur(s) JS de page :`);
        for (const e of pageErrors.slice(0, 10)) console.log('     ' + e.split('\n')[0]);
    }

    await browser.close();

    // Référence : 14415 PASS / 0 FAIL sur 42 suites (2026-09-28).
    //
    // L'unique échec toléré jusqu'à la v6.3.0 — `[1c.el] Taille el.json = 563 Ko
    // (seuil 560 Ko)` dans `test-performance.js` — était un GARDE ANTI-BLOAT du payload
    // i18n dépassé par la croissance légitime des locales. Vérifié avant relèvement du
    // seuil : parité stricte à 2728 clés sur les 11 langues, minification à 1,9 %,
    // duplication à 0,6 % — c'est du contenu, pas du gaspillage. Seuil porté à 590 Ko.
    //
    // Quatre suites ont été ajoutées après la régression Caramelia (un helper remplacé
    // par une RÉ-EXPORTATION, qui ne crée pas de liaison locale → `ReferenceError` à
    // l'appel, panneau vide, module chargé sans erreur) :
    //   · module-hygiene  — détection STATIQUE du défaut sur tout le graphe de modules
    //   · caramelia-ui    — widget Caramelia (rendu, bouton, panneau, actions)
    //   · ui-chrome       — tutoriel, version-checker, animations, debug, micro
    //   · embed-bridge    — pont `?embed` (fail-closed, contrôle d'origine)
    // Réintroduire la régression fait échouer les TROIS premières (30 assertions).
    //
    // Quatre suites de SOLIDITÉ complètent l'ensemble :
    //   · vendor-patches   — les 5 patchs de js/vendor/ (aperçu H5P) ; leur perte lors
    //                        d'une MAJ vendor était jusqu'ici totalement silencieuse
    //   · activity-wiring  — cohérence definitions ↔ processeurs ↔ fixtures ↔ prompts ↔
    //                        locales ↔ field-constraints ↔ whitelist Sucrerie, GEL de
    //                        la résolution des types de rendu (dépendante de l'ordre),
    //                        images de tuile LOCALES, et classification des erreurs
    //                        de génération (plus aucun `error.message` brut à l'écran)
    //   · llm-service      — services/llm.js, le chemin réseau de CHAQUE génération :
    //                        soumission, polling, reprise sur coupure réseau, délai
    //                        global, extraction du JSON. Le module n'avait AUCUN test —
    //                        `POLL_TIMINGS` a été exporté pour le rendre testable en
    //                        millisecondes au lieu de 5 minutes.
    //   · legal-notices    — règle CLAUDE.md « toute lib vendor est créditée », qui
    //                        n'était vérifiée nulle part : qrcode-generator, les 221
    //                        bibliothèques h5p-libs et flag-icons y avaient échappé.
    //                        Pendant Node (disque) : tests/run_legal_notices.mjs
    //   · editor-activities — l'éditeur sur TOUT le catalogue : les 116 fixtures
    //                        d'exemple (schéma détecté, contenu enregistrable tel quel,
    //                        aucun texte perdu, cycle idempotent, menus dont la valeur
    //                        figure dans les options) et les 33 schémas dans le vrai DOM
    //                        (ouvrir, parcourir toutes les vues, ajouter, supprimer —
    //                        y compris dans un tableau imbriqué —, enregistrer deux fois).
    //                        Généralise `editor-lifecycle`, dont le cycle DOM ne portait
    //                        que sur le Livre interactif. Couvre aussi les renvois PAR
    //                        INDICE d'un tableau vers un autre (zones du Glisser-déposer) :
    //                        déclaration croisée dans les schémas, arithmétique des quatre
    //                        mutations, geste réel dans le DOM, et survie des associations
    //                        jusqu'au .h5p produit.
    //
    // La porte est à ZÉRO échec : tout FAIL fait échouer le script.
    //
    // Les « erreurs JS de page » ne sont PAS une porte : plusieurs suites provoquent
    // volontairement des exceptions (robustesse du healer, entrées invalides). Elles
    // restent affichées à titre indicatif.
    const BASELINE_FAIL = Number(process.env.CARAMEL_BROWSER_BASELINE_FAIL ?? 0);

    console.log('');
    console.log('========================================');
    console.log(`suite navigateur : ${totalPass} PASS / ${totalFail} FAIL (référence : ${BASELINE_FAIL} échec pré-existant)`);
    console.log('========================================');

    if (suitesEnErreur.length) {
        console.log(`❌ ${suitesEnErreur.length} suite(s) n'ont pas pu s'exécuter : ${suitesEnErreur.join(', ')}`);
        console.log('   (une suite en erreur ne produit AUCUNE assertion — elle ne compte donc pas dans les FAIL)');
        exitCode = 1;
    } else if (totalFail === null) {
        console.log('❌ Bilan illisible — la page n\'a pas produit de récapitulatif.');
        exitCode = 2;
    } else if (totalFail > BASELINE_FAIL) {
        console.log(`❌ ${totalFail - BASELINE_FAIL} échec(s) de PLUS que la référence.`);
        exitCode = 1;
    } else {
        if (totalFail < BASELINE_FAIL) {
            console.log(`ℹ ${BASELINE_FAIL - totalFail} échec(s) de MOINS que la référence — penser à abaisser BASELINE_FAIL.`);
        }
        console.log('✅ Suite navigateur conforme à la référence.');
        exitCode = 0;
    }
} catch (e) {
    console.error('❌ ' + (e.message || e));
    exitCode = 2;
} finally {
    stopServer();
}
process.exit(exitCode);
