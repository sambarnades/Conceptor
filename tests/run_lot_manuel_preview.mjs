/** Vérifie l'ouverture du lot fourni à l'utilisateur, sans reconstruire ses H5P. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const folder = 'tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26';
const { chromium } = createRequire(new URL('./roundtrip/package.json', import.meta.url))('playwright');
const cases = JSON.parse(await readFile(root + folder + '/inventaire.json', 'utf8'));
// Captures et rapport vont hors du dépôt : un passage ordinaire réécrivait les 26 aperçus
// VERSIONNÉS et laissait l'arbre de travail modifié. `--recette` les met à jour à dessein.
const sortie = process.argv.includes('--recette') ? root + folder : (process.env.QA_CAPTURES || '/tmp/caramel-lot-manuel-preview');
const server = spawn('python3', ['tests/serveur-statique.py', '8181', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
const report = [];
try {
    for (let n = 0; n < 100; n++) {
        try { if ((await fetch('http://127.0.0.1:8181/')).ok) break; } catch {}
        await new Promise(r => setTimeout(r, 100));
    }
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1050, height: 900 } });
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await mkdir(sortie + '/apercus', { recursive: true });
    const only = process.argv.find(a => a.startsWith('--only='))?.slice(7).split(',');
    const archive = process.argv.find(a => a.startsWith('--archive='))?.slice(10);
    // N° 23 : l'archive remise à l'utilisateur imbriquait l'image (défaut confirmé, BILAN_RETOURS.md) ;
    // elle reste telle quelle, en preuve. La correction validée sur Éléa est la référence du banc.
    const CORRIGES = { FindTheHotspot: 'correctifs/23-FindTheHotspot-corrige.h5p' };
    for (const c of cases.filter(c => !only || only.includes(c.module))) {
        const errors = [];
        const onError = e => errors.push(e.stack || e.message);
        page.on('pageerror', onError);
        try {
            await page.goto('http://127.0.0.1:8181/tests/preview-feedback-harness.html');
            await page.waitForFunction(() => window.__pret === true);
            await page.evaluate(async url => {
                const blob = await (await fetch(url)).blob();
                await window.__monterArchive(blob);
            }, '/' + folder + '/' + (archive || CORRIGES[c.module] || 'a-importer/' + c.fichier));
            await page.waitForFunction(() => {
                const doc = document.querySelector('.h5p-iframe')?.contentDocument;
                return doc?.body?.querySelectorAll('*').length > 5;
            }, null, { timeout: 10000 });
            await page.waitForTimeout(c.module === 'Timeline' ? 1500 : 350);
            const visible = await page.evaluate(() => {
                const doc = document.querySelector('.h5p-iframe').contentDocument;
                return { texte: doc.body.innerText.slice(0, 220), noeuds: doc.body.querySelectorAll('*').length,
                    imagesCassees: [...doc.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')) };
            });
            if (/No background image was added|No image was added|Failed to load/i.test(visible.texte)) throw Error('Erreur affichée par le contenu : ' + visible.texte);
            if (c.module === 'FindTheHotspot') {
                const frame = page.frameLocator('.h5p-iframe');
                await frame.locator('img.hotspot-image').waitFor({ state: 'visible' });
                if (!await frame.locator('img.hotspot-image').evaluate(i => i.naturalWidth > 0)) throw Error('Image de fond absente');
                // Le centre du rectangle 2 est une bonne réponse réelle.
                const picture = frame.locator('img.hotspot-image');
                const box = await picture.boundingBox();
                await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.47);
                await page.waitForTimeout(200);
                visible.apresClic = await frame.locator('body').innerText();
                if (!visible.apresClic.includes('Zone 2 sélectionnée.')) throw Error('La bonne zone ne répond pas');
            }
            await page.screenshot({ path: sortie + '/apercus/' + c.module + ((archive || CORRIGES[c.module]) ? '-corrige' : '') + '.png', fullPage: true });
            report.push({ module: c.module, ouvert: true, ...visible, erreurs: errors });
            console.log(c.module + ' : ouvert' + (errors.length ? ' ; ' + errors.join(' / ') : ''));
        } catch (e) {
            report.push({ module: c.module, ouvert: false, erreurs: [...errors, e.message] });
            console.log(c.module + ' : ÉCHEC ' + e.message.replace(/\n/g, ' ⏎ '));
        } finally { page.off('pageerror', onError); }
    }
    const suffix = only ? '-' + only.join('-') : '';
    await writeFile(sortie + '/controle-apercus' + suffix + '.json', JSON.stringify(report, null, 2) + '\n');
    const failed = report.filter(r => !r.ouvert || r.erreurs.length || r.imagesCassees?.length);
    console.log(`${report.length - failed.length}/${report.length} ouvertures sans erreur signalée.`);
    if (failed.length) process.exitCode = 1;
} finally { await browser?.close(); server.kill('SIGTERM'); }
