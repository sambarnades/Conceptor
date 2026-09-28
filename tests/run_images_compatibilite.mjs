/** Hors CI : vrais octets WebP → PNG, ajout initial, ancien scénario, édition et MBZ. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8155;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
try {
    for (let n = 0; n < 100; n++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch(); const page = await browser.newPage();
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
    const resultats = await page.evaluate(async () => {
        const preuves = []; const ok = (nom, valeur) => { if (!valeur) throw Error(nom); preuves.push(nom); };
        const images = await import('/js/h5p/image-manager.js');
        const { normaliserImagesDuPaquet } = await import('/js/h5p/package-images.js');
        const { createH5PBlob } = await import('/js/h5p/h5p-creator.js');
        const { activiteDepuisCarte, assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { contenuPourEdition, recueillirMedias } = await import('/js/parcours/sources.js');
        const { versScenario, depuisScenario } = await import('/js/parcours/scenario-io.js');
        const libs = await import('/js/core/lib-loader.js'); await libs.loadJSZip();
        const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 80;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#e02b65'; ctx.fillRect(20, 20, 80, 40);
        const webp = await new Promise(r => canvas.toBlob(r, 'image/webp'));
        const dataURL = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(webp); });
        const entree = await images.processBackgroundImage(new File([webp], 'image.webp', { type: 'image/webp' }));
        ok('ajout du fond : vraie conversion PNG, chemin et MIME concordants', entree.mime === 'image/png' && entree.h5pPath.endsWith('.png') && entree.blob.type === 'image/png');
        const bitmap = await createImageBitmap(entree.blob); ctx.clearRect(0, 0, 120, 80); ctx.drawImage(bitmap, 0, 0); bitmap.close();
        ok('la conversion garde les dimensions, la transparence et les pixels colorés', entree.width === 120 && entree.height === 80 && ctx.getImageData(0, 0, 1, 1).data[3] === 0 && ctx.getImageData(60, 40, 1, 1).data[3] === 255);
        const contenu = { image: { path: 'images/image.webp', mime: 'image/webp' }, autre: { path: 'images/image.png', mime: 'image/png' }, imbrique: [{ path: 'images/image.webp' }] };
        const medias = new Map([['images/image.webp', webp], ['images/image.png', entree.blob], ['images/parasite.webp', new Blob(['invalide'], { type: 'image/webp' })]]);
        const copie = JSON.stringify(contenu); const normalise = await normaliserImagesDuPaquet(contenu, medias);
        ok('ancien contenu : collision de nom évitée et toutes les références réécrites', normalise.contenu.image.path === 'images/image-converti-1.png' && normalise.contenu.imbrique[0].path === normalise.contenu.image.path);
        ok('le contenu source et son registre restent inchangés', JSON.stringify(contenu) === copie && medias.has('images/image.webp') && !medias.has('images/image-converti-1.png'));
        const accent = await normaliserImagesDuPaquet({image:{path:'images/Ma fleur été.webp'}},new Map([['images/Ma fleur été.webp',webp]]));
        ok('anciens noms de fichiers avec espaces et accents convertis',accent.contenu.image.path==='images/Ma fleur été.png' && accent.medias.has('images/Ma fleur été.png'));
        const paquet = await createH5PBlob(contenu, 'H5P.ImageHotspots', [], { mediaFiles: medias });
        const zip = await window.JSZip.loadAsync(paquet);
        ok('aucun fichier WebP ni média parasite dans le ZIP final', !Object.keys(zip.files).some(p => /\.webp$/i.test(p)));
        const octets = await zip.file('content/images/image-converti-1.png').async('uint8array');
        ok('les octets sont du PNG, pas un WebP simplement renommé', [...octets.slice(0, 8)].join(',') === '137,80,78,71,13,10,26,10');
        const fixtures = [['ImageHotspots', 'image_hotspots'], ['FindTheHotspot', 'find_the_hotspot'], ['FindMultipleHotspots', 'find_multiple_hotspots']];
        const cartes = [];
        for (const [module, fichier] of fixtures) {
            const brut = await (await fetch(`/assets/data/examples/${fichier}_1.json`)).json();
            brut.image = { path: 'images/image.webp', mime: 'image/webp', width: 120, height: 80 };
            const carte = { id: module, module, titre: brut.title, contenu: brut, source: { type: 'image', ...brut.image }, medias: { 'images/image.webp': dataURL } };
            const archive = await activiteDepuisCarte(carte);
            const z = await window.JSZip.loadAsync(archive.h5pBytes);
            ok(`${module} : paquet réel sans référence WebP`, !/\.webp/.test(await z.file('content/content.json').async('string')) && Object.keys(z.files).some(p => p.endsWith('.png')));
            cartes.push(carte);
        }
        const plan = { titre: 'Sonde des fonds WebP', etapes: [{ id: 'e1', titre: 'Observer', cartes }] };
        const draft = depuisScenario(JSON.stringify(versScenario({ platform: 'elea', plan })));
        const edite = contenuPourEdition(draft.plan.etapes[0].cartes[0]); edite.hotspots[0].header = 'Retouche conservée';
        Object.assign(draft.plan.etapes[0].cartes[0], await recueillirMedias(draft.plan.etapes[0].cartes[0], edite, draft.plan));
        const refait = await activiteDepuisCarte(draft.plan.etapes[0].cartes[0]);
        const z = await window.JSZip.loadAsync(refait.h5pBytes);
        ok('reprise et édition : texte retouché conservé avec image convertie', (await z.file('content/content.json').async('string')).includes('Retouche conservée') && !Object.keys(z.files).some(p => p.endsWith('.webp')));
        const cours = await assemblerParcours(draft.plan, { platformId: 'elea' });
        ok('les trois activités entrent dans le MBZ du parcours', cours.activites.length === 3 && cours.blob.size > 0);
        return preuves;
    });
    resultats.forEach(n => console.log(`✓ ${n}`)); console.log(`Images compatibles : ${resultats.length} PASS / 0 FAIL`);
    assert.ok(resultats.length >= 11);
} finally { await browser?.close(); server.kill('SIGTERM'); }
