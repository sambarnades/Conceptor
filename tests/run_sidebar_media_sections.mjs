/**
 * run_sidebar_media_sections.mjs — Couverture des sections média de la barre latérale.
 *
 * `initVideoUrlSection()` (474 l.) et `initBackgroundImageSection()` (425 l.) sont les
 * deux plus grosses fonctions de `js/ui/ui.js`, et AUCUN test ne les exerçait :
 * `tests/test-ui.js`, `test-integration.js` et `test-css.js` ne contiennent pas une
 * seule occurrence de « InteractiveVideo », « ImageHotspots », « video-url » ou
 * « background-image ». Le banc Node ne peut pas les atteindre non plus (DOM réel).
 *
 * Ce fichier ouvre l'application dans Chromium, déplie la barre latérale des 4 modules
 * qui déclenchent ces sections (`requiresVideoUrl` / `requiresBackgroundImage`) et
 * vérifie le câblage : présence des éléments, état initial, accessibilité, et les
 * interactions qui ne déclenchent aucun appel réseau (popover d'aide, saisie de lien,
 * bouton d'effacement). Il sert de filet avant/après extraction de ces sections.
 *
 * Lancement :  node tests/run_sidebar_media_sections.mjs [--headed]
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');

const headed = process.argv.includes('--headed');
const PORT = 8096;

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
const failures = [];
function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n     ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n     obtenu: ${a}`);
}

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch({ headless: !headed });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.module-card, [data-module]', { timeout: 20000 });

    // -------------------------------------------------------------- helpers
    /** Ouvre la barre latérale d'un module et attend son rendu. */
    async function openModule(moduleKey) {
        await page.evaluate((key) => {
            const tile = document.querySelector(`[data-module="${key}"]`);
            if (!tile) throw new Error(`tuile introuvable : ${key}`);
            tile.click();
        }, moduleKey);
        await page.waitForFunction(
            (key) => {
                const sb = document.getElementById('module-sidebar');
                return sb && sb.classList.contains('open') && sb.querySelector(`#generation-button-group-${key}`);
            },
            moduleKey,
            { timeout: 15000, polling: 200 }
        );
    }

    async function closeSidebar() {
        await page.evaluate(() => window.closeSidebar && window.closeSidebar());
        await page.waitForFunction(
            () => !document.getElementById('module-sidebar')?.classList.contains('open'),
            null, { timeout: 5000, polling: 100 }
        );
    }

    // =====================================================================
    // 1. Section VIDÉO (InteractiveVideo)
    // =====================================================================
    {
        const KEY = 'InteractiveVideo';
        await openModule(KEY);

        const shape = await page.evaluate((key) => {
            const sb = document.getElementById('module-sidebar');
            const section = sb.querySelector(`#video-url-section-${key}`);
            if (!section) return { present: false };
            const input = sb.querySelector(`#video-url-input-${key}`);
            return {
                present: true,
                state: section.getAttribute('data-state'),
                hasInput: !!input,
                inputType: input?.getAttribute('type'),
                inputAriaLabel: input?.getAttribute('aria-label'),
                inputValue: input?.value,
                hasHelpBtn: !!sb.querySelector(`#video-help-btn-${key}`),
                helpAriaLabel: sb.querySelector(`#video-help-btn-${key}`)?.getAttribute('aria-label'),
                hasProgress: !!section.querySelector('.video-url-field__progress'),
                hasOverlay: !!section.querySelector('.video-url-field__overlay'),
            };
        }, KEY);

        ok('vidéo : section rendue', shape.present, JSON.stringify(shape));
        if (shape.present) {
            eq('vidéo : état initial « empty »', shape.state, 'empty');
            ok('vidéo : champ de lien présent', shape.hasInput);
            eq('vidéo : champ de type url', shape.inputType, 'url');
            ok('vidéo : champ étiqueté (aria-label)', !!shape.inputAriaLabel, String(shape.inputAriaLabel));
            eq('vidéo : champ initialement vide', shape.inputValue, '');
            ok('vidéo : bouton d\'aide présent', shape.hasHelpBtn);
            ok('vidéo : bouton d\'aide étiqueté', !!shape.helpAriaLabel);
            ok('vidéo : jauge de progression présente', shape.hasProgress);
            ok('vidéo : voile de progression présent', shape.hasOverlay);
        }

        // --- popover d'aide : ouverture + fermeture par Échap (aucun réseau) ---
        await page.click(`#video-help-btn-${KEY}`);
        await page.waitForSelector('.video-popover', { timeout: 5000 });
        // `openVideoPopover` pose le focus dans un `setTimeout(…, 50)` (media-helpers.js) :
        // `waitForSelector` rend la main dès que le nœud est dans le DOM, donc AVANT que le
        // focus n'ait bougé. Lire `activeElement` tout de suite était une course — elle
        // passait par chance jusqu'à ce qu'un chargement de module voisin décale le timing.
        // On ATTEND donc l'état visé, avec un délai borné qui échoue si le focus ne vient pas.
        let focusArrive = true;
        try {
            await page.waitForFunction(() => {
                const p = document.querySelector('.video-popover');
                return !!p && p.contains(document.activeElement);
            }, null, { timeout: 3000, polling: 25 });
        } catch { focusArrive = false; }

        const popover = await page.evaluate(() => {
            const p = document.querySelector('.video-popover');
            return {
                open: !!p,
                hasBackdrop: !!document.querySelector('.video-popover__backdrop'),
                focusInside: !!p && p.contains(document.activeElement),
            };
        });
        popover.focusInside = popover.focusInside && focusArrive;
        ok('vidéo : popover d\'aide s\'ouvre', popover.open);
        ok('vidéo : popover a un fond assombri', popover.hasBackdrop);
        ok('vidéo : focus déplacé dans le popover (a11y)', popover.focusInside);

        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.video-popover'), null,
            { timeout: 5000, polling: 100 });
        const afterEsc = await page.evaluate(() => ({
            popoverGone: !document.querySelector('.video-popover'),
            backdropGone: !document.querySelector('.video-popover__backdrop'),
            sidebarStillOpen: !!document.getElementById('module-sidebar')?.classList.contains('open'),
        }));
        ok('vidéo : Échap ferme le popover', afterEsc.popoverGone);
        ok('vidéo : Échap retire aussi le fond', afterEsc.backdropGone);
        // Le point subtil : Échap ne doit PAS fermer la modale parente (capture phase)
        ok('vidéo : Échap ne ferme PAS la barre latérale', afterEsc.sidebarStillOpen);

        // --- saisie d'un lien invalide : pas de requête réseau, état inchangé ---
        await page.fill(`#video-url-input-${KEY}`, 'pas-une-url');
        await page.waitForTimeout(300);
        const afterBadInput = await page.evaluate((key) => {
            const s = document.querySelector(`#video-url-section-${key}`);
            return { state: s?.getAttribute('data-state') };
        }, KEY);
        ok('vidéo : lien invalide ne passe pas en état « chargement »',
            afterBadInput.state !== 'loading', `état=${afterBadInput.state}`);

        await closeSidebar();
    }

    // =====================================================================
    // 2. Section IMAGE DE FOND (les 3 modules à image)
    // =====================================================================
    for (const KEY of ['ImageHotspots', 'FindTheHotspot', 'FindMultipleHotspots']) {
        await openModule(KEY);

        const shape = await page.evaluate((key) => {
            const sb = document.getElementById('module-sidebar');
            const section = sb.querySelector(`#img-bg-section-${key}`);
            if (!section) return { present: false };
            const pick = sb.querySelector(`#img-bg-pick-${key}`);
            const input = sb.querySelector(`#img-bg-input-${key}`);
            return {
                present: true,
                state: section.getAttribute('data-state'),
                hasPick: !!pick,
                hasFileInput: !!input,
                fileInputType: input?.getAttribute('type'),
                fileAccept: input?.getAttribute('accept'),
                hasHelpBtn: !!sb.querySelector(`#img-bg-help-btn-${key}`),
                hasThumb: !!pick?.querySelector('.img-bg-thumb'),
                hasProgress: !!section.querySelector('.video-url-field__progress'),
            };
        }, KEY);

        ok(`${KEY} : section image rendue`, shape.present, JSON.stringify(shape));
        if (!shape.present) continue;

        eq(`${KEY} : état initial « empty »`, shape.state, 'empty');
        ok(`${KEY} : bouton de sélection présent`, shape.hasPick);
        ok(`${KEY} : champ fichier présent`, shape.hasFileInput);
        eq(`${KEY} : champ de type file`, shape.fileInputType, 'file');
        ok(`${KEY} : champ fichier restreint aux images`, !!shape.fileAccept, String(shape.fileAccept));
        ok(`${KEY} : bouton d'aide présent`, shape.hasHelpBtn);
        ok(`${KEY} : vignette présente`, shape.hasThumb);
        ok(`${KEY} : jauge de progression présente`, shape.hasProgress);

        // Popover d'aide de la section image (partage openVideoPopover avec la vidéo)
        await page.click(`#img-bg-help-btn-${KEY}`);
        await page.waitForSelector('.video-popover', { timeout: 5000 });
        const helpOpen = await page.evaluate(() => !!document.querySelector('.video-popover'));
        ok(`${KEY} : popover d'aide s'ouvre`, helpOpen);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.video-popover'), null,
            { timeout: 5000, polling: 100 });
        ok(`${KEY} : popover se referme`,
            await page.evaluate(() => !document.querySelector('.video-popover')));

        await closeSidebar();
    }

    // =====================================================================
    // 3. Modules SANS section média : rien ne doit être rendu
    //    (garde `if (!module.requiresVideoUrl) return;`)
    // =====================================================================
    {
        await openModule('QuizSet');
        const absent = await page.evaluate(() => {
            const sb = document.getElementById('module-sidebar');
            return {
                noVideo: !sb.querySelector('[id^="video-url-section-"]'),
                noImage: !sb.querySelector('[id^="img-bg-section-"]'),
            };
        });
        ok('QuizSet : aucune section vidéo rendue', absent.noVideo);
        ok('QuizSet : aucune section image rendue', absent.noImage);
        await closeSidebar();
    }

    // =====================================================================
    // 4. Ouverture/fermeture répétée : pas de fuite d'ID ni de piège à focus
    //    (c'est exactement ce que le bug de closeSidebar() provoquait)
    // =====================================================================
    {
        for (let i = 0; i < 3; i++) {
            await openModule('InteractiveVideo');
            await closeSidebar();
        }
        await openModule('InteractiveVideo');
        const dup = await page.evaluate((key) => {
            const all = document.querySelectorAll(`#video-url-section-${key}`);
            const inputs = document.querySelectorAll(`#video-url-input-${key}`);
            return { sections: all.length, inputs: inputs.length };
        }, 'InteractiveVideo');
        eq('cycles répétés : une seule section vidéo dans le DOM', dup.sections, 1);
        eq('cycles répétés : un seul champ de lien dans le DOM', dup.inputs, 1);

        await closeSidebar();
        const afterClose = await page.evaluate(() => ({
            sidebarClosed: !document.getElementById('module-sidebar')?.classList.contains('open'),
            focusNotTrapped: document.activeElement === document.body
                || !document.getElementById('module-sidebar')?.contains(document.activeElement),
        }));
        ok('cycles répétés : barre latérale bien fermée', afterClose.sidebarClosed);
        ok('cycles répétés : focus non piégé dans la barre fermée', afterClose.focusNotTrapped);
    }

    await browser.close();

    if (pageErrors.length) {
        console.log(`\n   ⚠ ${pageErrors.length} erreur(s) JS de page :`);
        pageErrors.slice(0, 8).forEach(e => console.log('     ' + e.split('\n')[0]));
    }

    console.log('');
    if (failures.length) failures.forEach(f => console.log(f));
    console.log('========================================');
    console.log(`sections média sidebar : ${pass} OK / ${fail} échec(s)`);
    console.log('========================================');
    // Une exception JS non rattrapée casse la section sans faire échouer d'assertion :
    // c'est précisément ce qu'une extraction ratée produirait.
    if (fail === 0 && pageErrors.length === 0) console.log('✅ Tous les tests passent.');
    exitCode = (fail === 0 && pageErrors.length === 0) ? 0 : 1;
} catch (e) {
    console.error('❌ ' + (e.message || e));
    exitCode = 2;
} finally {
    stop();
}
process.exit(exitCode);
