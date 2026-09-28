/** Relecture homogène, annulation unique et export sans saut de présentation. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8153;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const captures = '/tmp/caramel-stabilite-captures'; mkdirSync(captures, { recursive: true });
const test = JSON.parse(readFileSync(resolve(root, 'assets/data/examples/test_1.json')));
const scenario = { produit: 'caramel-parcours', format: 1, cadrage: { platform: 'elea', ampleur: 'courte', format: 'distanciel' },
    plan: { titre: 'L’Italie au XXe siècle', objectifGeneral: 'Comprendre les transformations politiques.', notionsPivots: ['La démocratie'], etapes: [{ id: 'e1', titre: 'Vérifier et échanger', cartes: [
        { id: 'test', module: 'test_elea', titre: 'Test final sur l’Italie', duree: 20, palier: 'transfert', contenu: test },
        { id: 'forum', module: 'parcours_forum', titre: 'Confronter ses idées', duree: 10, palier: 'transfert', contenu: { title: 'Confronter ses idées', intro: 'Quelle transformation retenez-vous ?' } },
    ] }] } };
let browser, pass = 0;
const ok = (nom, condition, detail = '') => { assert.ok(condition, `${nom} ${detail}`); pass++; console.log(`  ✓ ${nom}`); };
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch();
    for (const [width, lang] of [[1440, 'fr'], [390, 'fr'], [390, 'ar'], [390, 'br']]) {
        const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'no-preference' });
        const natifs = [], erreurs = [], telechargements = [];
        page.on('download', d => telechargements.push(d));
        page.on('dialog', async d => { natifs.push(d.message()); await d.dismiss(); });
        page.on('pageerror', e => erreurs.push(e.message));
        await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
        await page.evaluate(async l => (await import('/js/core/translation.js')).loadTranslations(l), lang);
        await page.click('#parcours-button');
        await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
        await page.waitForSelector('.pc-title-input');
        await page.locator('[data-carte=test] [data-action=editer]').click();
        await page.waitForSelector('.json-editor input[data-path=bank_name]');
        const nomTraduit = await page.evaluate(async () => (await import('/js/core/translation.js')).t('elea_test_xml_name'));
        ok(`${lang}/${width} : le Test a son vrai nom traduit`, await page.locator('.pc-lecture__type').textContent() === nomTraduit
            && !(await page.locator('.json-editor__header').textContent()).includes('elea_test'));
        ok(`${lang}/${width} : un seul titre principal visible`, !await page.locator('.json-editor__header').isVisible() && await page.locator('.pc-editeur__titre').isVisible());
        ok(`${lang}/${width} : cadre et pied d’édition restent dans l’écran`, await page.evaluate(() => {
            const c = document.querySelector('.pc-editeur__cadre').getBoundingClientRect();
            const save = document.querySelector('.json-editor [data-action=save]').getBoundingClientRect();
            return c.left > 0 && c.right < innerWidth && save.top >= 0 && save.bottom < innerHeight
                && document.querySelector('.pc-editeur__hote').scrollWidth <= document.querySelector('.pc-editeur__hote').clientWidth;
        }));
        await page.screenshot({ path: resolve(captures, `edition-${lang}-${width}.png`) });
        const titre = page.locator('input[data-path=bank_name]');
        await titre.fill('Ma retouche à conserver');
        await page.locator('.json-editor [data-action=cancel]').click();
        await page.waitForSelector('.pc-confirmation');
        ok(`${lang}/${width} : Annuler ouvre un seul dialogue intégré`, await page.locator('[role=alertdialog]').count() === 1 && await page.locator('.json-editor__modal-overlay').count() === 0 && natifs.length === 0);
        ok(`${lang}/${width} : les commandes du panneau sont suspendues`, await page.locator('.pc-editeur').evaluate(n => n.inert));
        await page.keyboard.press('Shift+Tab');
        ok(`${lang}/${width} : le clavier reste dans la confirmation`, await page.evaluate(() => document.activeElement === document.querySelector('.pc-confirmation button:last-child')));
        await page.keyboard.press('Escape');
        await page.waitForSelector('.pc-confirmation', { state: 'detached' });
        ok(`${lang}/${width} : Échap garde la saisie et rend le focus à Annuler`, await titre.inputValue() === 'Ma retouche à conserver'
            && await page.locator('.json-editor [data-action=cancel]').evaluate(n => n === document.activeElement));
        // Un clic sur le mode déjà sélectionné ne demande pas d’abandon.
        await page.locator('.pc-lecture__modes button').last().click();
        ok(`${lang}/${width} : le mode actif ne redemande pas de confirmation`, await page.locator('.pc-confirmation').count() === 0);
        for (const cible of ['.pc-editeur__fermer', '.pc-lecture__navigation button:last-child', '.pc-lecture__modes button:first-child']) {
            await page.locator(cible).click(); await page.waitForSelector('.pc-confirmation');
            await page.locator('.pc-confirmation button').first().click();
            ok(`${lang}/${width} : refuser l’abandon conserve les données (${cible})`, await titre.inputValue() === 'Ma retouche à conserver');
        }
        await page.locator('.json-editor [data-action=cancel]').click();
        await page.screenshot({ path: resolve(captures, `annulation-${lang}-${width}.png`) });
        await page.locator('.pc-confirmation button').last().click();
        await page.waitForSelector('.pc-editeur', { state: 'detached' });
        ok(`${lang}/${width} : abandonner ferme sans seconde popup et sans sauvegarder`, natifs.length === 0
            && await page.evaluate(() => JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.etapes[0].cartes[0].contenu.bank_name) === test.bank_name);
        await page.locator('[data-carte=test] [data-action=editer]').click();
        await page.waitForSelector('.json-editor input[data-path=bank_name]');
        await page.locator('.json-editor input[data-path=bank_name]').fill('Banque relue');
        await page.locator('.json-editor [data-action=save]').click();
        await page.waitForSelector('.pc-editeur .elea-test-intro');
        ok(`${lang}/${width} : enregistrer conserve le contenu et ouvre le simulateur`, await page.evaluate(() => JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.etapes[0].cartes[0].contenu.bank_name) === 'Banque relue');
        await page.screenshot({ path: resolve(captures, `apercu-${lang}-${width}.png`) });
        await page.locator('.elea-test-intro__start').click();
        await page.waitForSelector('.elea-question-name');
        ok(`${lang}/${width} : l’aperçu permet de consulter les vraies questions`, await page.locator('.elea-question-name').isVisible());
        await page.locator('.pc-editeur__fermer').click();
        await page.evaluate(async () => (await import('/js/parcours/index.js')).__testHooks.allerA(3));
        for (let exportIndex = 0; exportIndex < 7; exportIndex++) {
            const bouton = page.locator('.pc-export').nth(exportIndex);
            await bouton.scrollIntoViewIfNeeded(); await page.waitForTimeout(80);
            await page.evaluate(() => {
                window.suiviExport = true; window.vuesExport = [];
                const mesurer = () => {
                    const atelier = document.querySelector('#pc-atelier'), s = getComputedStyle(atelier);
                    return JSON.stringify({ y: scrollY, hauteur: document.body.scrollHeight,
                        cadre: [s.backgroundColor, s.opacity, s.borderRadius, s.fontFamily],
                        commandes: [...atelier.querySelectorAll('.pc-export,#pc-cta')].map(n => {
                            const b = n.getBoundingClientRect(), css = getComputedStyle(n);
                            return [b.x, b.y, b.width, b.height, css.opacity, css.fontFamily, css.fontSize];
                        }) });
                };
                window.vuesExport.push(mesurer());
                function suivre() { if (!window.suiviExport) return; window.vuesExport.push(mesurer()); requestAnimationFrame(suivre); }
                requestAnimationFrame(suivre);
            });
            const [dl, indisponibles] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), exportIndex === 0
                ? page.evaluate(() => {
                    const boutons = [...document.querySelectorAll('.pc-export')];
                    // Plusieurs clics dans le même tour, même entre formats.
                    boutons.forEach(b => b.click()); boutons[0].click();
                    return boutons.filter(b => b.getAttribute('aria-disabled') === 'true').length;
                }) : bouton.click()]);
            await page.waitForTimeout(100);
            if (exportIndex === 0) ok(`${lang}/${width} : les clics concurrents ne lancent qu’un téléchargement`, indisponibles === 7 && telechargements.length === 1);
            const vues = await page.evaluate(() => { window.suiviExport = false; return [...new Set(window.vuesExport)]; });
            ok(`${lang}/${width} : ${dl.suggestedFilename()} sans changement de géométrie, police ou opacité`, vues.length === 1, JSON.stringify(vues));
            ok(`${lang}/${width} : les commandes sont rendues disponibles`, await page.locator('.pc-export[aria-disabled],.pc-export[aria-busy]').count() === 0);
        }
        await page.screenshot({ path: resolve(captures, `livraison-${lang}-${width}.png`) });
        ok(`${lang}/${width} : aucun dialogue natif ou échec JavaScript`, natifs.length === 0 && erreurs.length === 0, [...natifs, ...erreurs].join('; '));
        // Vérification du nom dans l’éditeur individuel : la correction vaut aussi hors parcours.
        if (width === 1440) {
            const traduction = await page.evaluate(async contenu => {
                const api = await import('/js/editor/index.js'), i18n = await import('/js/core/translation.js');
                const hote = document.createElement('div'); document.body.append(hote);
                const erreurs = [];
                for (const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
                    await i18n.loadTranslations(lang);
                    await api.initJsonEditor({ moduleKey: 'test_elea', type: 'mbz', titleKey: 'elea_test_xml_name' }, hote, contenu);
                    const titre = hote.querySelector('.json-editor__title').textContent;
                    if (!titre.includes(i18n.t('elea_test_xml_name')) || titre.includes('elea_test')) erreurs.push(lang);
                    api.destroyEditor();
                }
                hote.remove(); return erreurs;
            }, test);
            ok('le nom du Test est traduit dans les douze langues aussi hors parcours', traduction.length === 0, traduction.join(','));
        }
        await page.close();
    }
    console.log(`Stabilité parcours : ${pass} PASS / 0 FAIL`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
