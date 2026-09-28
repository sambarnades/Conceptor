/** Continuité des quatre écrans, petits écrans et champs de plan extensibles (D55). */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(join(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8128;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const captures = process.env.QA_CAPTURES || '/tmp/caramel-harmonie-captures';
const scenario = {
    produit: 'caramel-parcours', format: 1, version: '0.1.0',
    cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'auto' },
    plan: { titre: 'Les Trente Glorieuses : révision et analyse',
        objectifGeneral: 'Expliquer les transformations économiques et sociales et les limites de la croissance pendant les Trente Glorieuses.',
        notionsPivots: ['la croissance', 'la consommation de masse'], origine: 'ia',
        etapes: [
            { id: 'e1', titre: 'Comprendre la croissance', objectif: 'Identifier les transformations', cartes: [
                { id: 'c1', module: 'parcours_forum', titre: 'Comparer les transformations de la société', objectif: 'Expliquer les transformations', consigne: 'Justifiez votre réponse.', duree: 15, palier: 'decouverte', contenu: { title: 'Comparer les transformations', intro: 'Quelles transformations observez-vous ?' } },
            ] },
            { id: 'e2', titre: 'Discuter les limites', objectif: 'Argumenter', cartes: [
                { id: 'c2', module: 'parcours_sondage', titre: 'Quelles limites à la croissance ?', objectif: 'Identifier une limite', consigne: 'Choisissez une réponse.', duree: 10, palier: 'transfert', contenu: { title: 'Les limites', intro: 'Quelle limite approfondir ?', options: ['Les inégalités', 'Les pollutions'] } },
            ] },
        ] },
};
let browser, pass = 0;
const ok = (nom, condition, detail = '') => { assert.ok(condition, `${nom} ${detail}`); pass++; console.log(`  ✓ ${nom}`); };
const styleFormulaire = () => {
    const form = document.querySelector('.prompt-generator');
    const s = getComputedStyle(form);
    return JSON.stringify({ styles: ['padding', 'marginBottom', 'boxShadow', 'borderRadius'].map(k => s[k]),
        largeur: form.getBoundingClientRect().width,
        champs: ['qui', 'quoi'].map(id => {
            const champ = document.getElementById(id), b = champ.getBoundingClientRect();
            return [champ.value, b.x, b.width, b.height];
        }) });
};
const cadre = () => {
    const atelier = document.querySelector('#pc-atelier'), s = getComputedStyle(atelier);
    return JSON.stringify(['backgroundColor', 'borderRadius', 'paddingInlineStart', 'paddingInlineEnd', 'boxShadow'].map(k => s[k]));
};
try {
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {}
        await new Promise(r => setTimeout(r, 100));
    }
    browser = await chromium.launch();
    await mkdir(captures, { recursive: true });
    for (const [width, lang] of [[1440, 'fr'], [1024, 'fr'], [768, 'de'], [600, 'fr'], [390, 'fr'], [360, 'fr'], [390, 'ar'], [390, 'br']]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForSelector('#parcours-button');
        await page.evaluate(async lang => await (await import('/js/core/translation.js')).loadTranslations(lang), lang);
        await page.fill('#qui', 'Professeur d’histoire-géographie');
        await page.fill('#quoi', 'Les Trente Glorieuses en 3e');
        const formulaire = await page.evaluate(styleFormulaire);
        await page.click('#parcours-button');
        const reference = await page.evaluate(cadre);
        await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
        await page.waitForSelector('.pc-title-input');
        for (const etape of [0, 1, 2, 3]) {
            // Ici l'objet de l'épreuve est le rendu à chaque écran. Les clics et
            // générations sont couverts par atelier/relecture et les essais ILaaS.
            await page.evaluate(async n => (await import('/js/parcours/index.js')).__testHooks.allerA(n), etape);
            await page.waitForTimeout(100);
            const prefixe = `${width}/${lang}/écran ${etape + 1}`;
            ok(`${prefixe} : cadre identique au cadrage`, await page.evaluate(cadre) === reference);
            ok(`${prefixe} : formulaire habituel intact`, await page.evaluate(styleFormulaire) === formulaire);
            const mesures = await page.evaluate(() => {
                const at = document.querySelector('#pc-atelier').getBoundingClientRect();
                const retour = document.querySelector('#pc-back').getBoundingClientRect();
                const action = document.querySelector('#pc-cta').getBoundingClientRect();
                const note = document.querySelector('#pc-action-note').getBoundingClientRect();
                const visibles = [...document.querySelectorAll('.pc-navigation button, .pc-actionbar button')]
                    .filter(n => n.getClientRects().length);
                const label = document.querySelector('.pc-steps__item--current .pc-steps__label');
                return {
                    deborde: document.documentElement.scrollWidth - innerWidth,
                    boutonsDedans: visibles.every(n => { const b = n.getBoundingClientRect(); return b.left >= at.left && b.right <= at.right; }),
                    noteApres: !note.height || note.top >= action.bottom,
                    boutonsAlignes: !retour.height || Math.abs(retour.top + retour.height / 2 - action.top - action.height / 2) < 2,
                    etapeLisible: getComputedStyle(label).display !== 'none',
                };
            });
            ok(`${prefixe} : navigation lisible, actions alignées et aucun débordement`,
                mesures.deborde === 0 && mesures.boutonsDedans && mesures.noteApres && mesures.boutonsAlignes && mesures.etapeLisible, JSON.stringify(mesures));
            if (etape === 1) ok(`${prefixe} : titre et objectif entiers, sans hauteur vide excessive`, await page.evaluate(() =>
                [...document.querySelectorAll('.pc-title-input, .pc-plan-objectif')].every(n => n.scrollHeight <= n.clientHeight + 1 && n.clientHeight < 160)));
            if (width === 1440 || width === 390) {
                await page.evaluate(() => document.querySelector('#pc-atelier').scrollIntoView({ block: 'start', behavior: 'instant' }));
                await page.screenshot({ path: join(captures, `${lang}-${width}-etape-${etape + 1}.png`), animations: 'disabled' });
            }
        }
        if (width === 1440) {
            await page.evaluate(async () => (await import('/js/parcours/index.js')).__testHooks.allerA(1));
            const titre = page.locator('.pc-title-input');
            const court = await titre.evaluate(n => n.clientHeight);
            const long = 'Comprendre la croissance économique et les transformations sociales dans la France des Trente Glorieuses. '.repeat(5);
            await titre.fill(long);
            const grand = await titre.evaluate(n => n.clientHeight);
            ok('un titre long agrandit le champ et se sauvegarde', grand > court && await page.evaluate(() => JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.titre) === long);
            await page.setViewportSize({ width: 390, height: 1000 });
            await page.waitForTimeout(100);
            ok('le titre se réajuste à la largeur du téléphone', await titre.evaluate(n => n.scrollHeight <= n.clientHeight + 1 && n.clientHeight > 200));
            await titre.fill(scenario.plan.titre);
            ok('raccourcir le titre retire l’espace devenu inutile', await titre.evaluate(n => n.clientHeight < 150));
            const options = page.locator('.pc-plan-reglages');
            ok('les deux réglages facultatifs restent décochés et repliés au départ', await options.getAttribute('open') === null && await options.locator('input:checked').count() === 0);
            await options.locator('summary').click();
            await page.locator('#pc-reglage-carte').check();
            await page.locator('#pc-reglage-carte').uncheck();
            await page.locator('#pc-reglage-progression').check();
            await page.locator('.pc-steps__item').first().locator('button').click();
            await page.locator('.pc-steps__item').nth(1).locator('button').click();
            ok('un réglage actif est exposé à la reprise du plan', await options.getAttribute('open') !== null && await page.locator('#pc-reglage-progression').isChecked());
        }
        await page.click('#activites-button');
        ok(`${width}/${lang} : retour aux activités sans erreur JavaScript`, errors.length === 0 && await page.locator('.activity-grid').isVisible(), errors.join('; '));
        await page.close();
    }
    console.log(`Harmonie du parcours : ${pass} PASS / 0 FAIL`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
