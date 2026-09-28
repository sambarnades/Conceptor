/** Fonds personnels : formats réels, gestes de l’atelier et archive Moodle relue. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8149;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const sorties = '/tmp/caramel-fonds-captures'; mkdirSync(sorties, { recursive: true });
let browser, pass = 0;
const ok = (nom, condition, detail = '') => { assert.ok(condition, `${nom} ${detail}`); pass++; console.log(`  ✓ ${nom}`); };
const scenario = { produit: 'caramel-parcours', format: 1,
    cadrage: { platform: 'elea', format: 'presentiel', ampleur: 'courte', trame: 'revision' },
    plan: { titre: 'Les Trente Glorieuses', objectifGeneral: 'Comprendre les transformations de la société.', notionsPivots: ['La croissance', 'La consommation', 'Les inégalités', 'La reconstruction', 'Les loisirs'],
        etapes: [{ id: 'e1', titre: 'Découvrir et discuter', cartes: [
            { id: 'c1', module: 'Flashcards', titre: 'Les notions essentielles', consigne: 'Retrouvez chaque notion.', duree: 10, palier: 'decouverte', contenu: { title: 'Les notions', cards: [{ text: 'Les Trente Glorieuses', answer: 'Une période de forte croissance' }] } },
            { id: 'c2', module: 'parcours_forum', titre: 'Les transformations', consigne: 'Justifiez votre réponse.', duree: 10, palier: 'transfert', contenu: { title: 'Les transformations', intro: 'Quelles limites à la croissance ?' } },
        ] }] } };
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
    await page.click('#parcours-button');
    await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
    await page.waitForSelector('.pc-title-input');
    await page.locator('.pc-plan-notions summary').click();
    await page.waitForTimeout(100);
    ok('les cinq notions sont des pastilles entières, sans débordement', await page.locator('.pc-plan-notions').evaluate(n => {
        const pastilles = [...n.querySelectorAll('.pc-notion:not(.pc-notion--ajout)')];
        const bloc = n.getBoundingClientRect();
        return pastilles.length === 5 && pastilles.every(p => { const r = p.getBoundingClientRect(); return r.left >= bloc.left && r.right <= bloc.right; });
    }));
    ok('les options dépliées ne tracent plus de séparateurs', await page.locator('.pc-plan-complements').evaluate(n =>
        getComputedStyle(n).borderTopWidth === '0px' && [...n.children].every(c => getComputedStyle(c).borderTopWidth === '0px')));
    const details = page.locator('.pc-carte__details').first(); await details.locator('summary').click();
    const consigne = details.locator('textarea'); await page.waitForTimeout(100);
    const petite = await consigne.evaluate(n => n.clientHeight);
    ok('une courte consigne ne laisse pas 200 px de vide', petite < 100);
    await consigne.fill('Expliquez les transformations de la société et leurs limites. '.repeat(20));
    ok('la consigne grandit sans barre de défilement', await consigne.evaluate(n => n.clientHeight > 150 && n.scrollHeight <= n.clientHeight + 1));
    await consigne.fill('Justifiez votre réponse.');
    ok('raccourcir le texte réduit aussi le champ', await consigne.evaluate(n => n.clientHeight) === petite);
    await page.locator('.pc-plan-reglages summary').click();
    ok('la carte reste désactivée et le dépôt masqué au départ', !await page.locator('#pc-reglage-carte').isChecked() && !await page.locator('.pc-fond-tuile').isVisible());
    await page.locator('#pc-reglage-carte').check();
    ok('la tuile + accompagne les trente thèmes', await page.locator('.pc-fond-tuile').isVisible() && await page.locator('.pc-galerie [role=radio]').count() === 30);
    await page.locator('#pc-fond-fichier').setInputFiles(resolve(root, 'tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg'));
    await page.waitForFunction(() => document.querySelector('.pc-fond-tuile')?.getAttribute('aria-pressed') === 'true');
    await page.waitForTimeout(100);
    ok('le fond choisi montre les repères des deux activités', await page.locator('.pc-fond-apercu circle').count() === 2);
    const formats = await page.evaluate(async () => {
        const { preparerImageCarte } = await import('/js/parcours/carte-image.js');
        const resultats = {};
        for (const ext of ['png', 'gif', 'bmp', 'tiff', 'heic', 'avif']) {
            const fichier = await (await fetch(`/tests/fixtures/parcours-fonds/degrade.${ext}`)).blob();
            try {
                // MIME vide : cas courant d’un fichier déposé depuis le Finder.
                const image = await preparerImageCarte(new File([fichier], `degrade.${ext}`));
                const bitmap = await createImageBitmap(await (await fetch(image.dataURL)).blob());
                const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
                const pixel = [...ctx.getImageData(500, 312, 1, 1).data]; bitmap.close();
                resultats[ext] = { jpeg: image.dataURL.startsWith('data:image/jpeg;'), width: image.width, height: image.height, pixel };
            } catch (e) { resultats[ext] = { erreur: e.message }; }
        }
        for (const mime of ['image/jpeg', 'image/webp']) {
            const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 400;
            canvas.getContext('2d').fillRect(0, 0, 300, 400);
            const blob = await new Promise(r => canvas.toBlob(r, mime));
            const image = await preparerImageCarte(new File([blob], 'portrait', { type: mime }));
            resultats[mime] = { jpeg: image.dataURL.startsWith('data:image/jpeg;'), width: image.width, height: image.height };
        }
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="orange"/></svg>';
        const image = await preparerImageCarte(new File([svg], 'dessin.svg', { type: 'image/svg+xml' }));
        resultats.svg = { jpeg: image.dataURL.startsWith('data:image/jpeg;'), width: image.width, height: image.height };
        return resultats;
    });
    for (const [format, r] of Object.entries(formats)) {
        ok(`${format} est décodé puis converti en JPEG`, r.jpeg && r.width === 1000, JSON.stringify(r));
        ok(`${format} conserve les proportions et les pixels`, format.startsWith('image/') ? r.height === 1333
            : format === 'svg' ? r.height === 500 : r.height === 625 && Math.abs(r.pixel[0] - 110) < 15 && Math.abs(r.pixel[1] - 110) < 15 && Math.abs(r.pixel[2] - 160) < 15, JSON.stringify(r));
    }
    const exporte = await page.evaluate(async () => {
        const { brouillon, majBrouillon } = await import('/js/parcours/state.js');
        const { versScenario, depuisScenario } = await import('/js/parcours/scenario-io.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const draft = brouillon(); const origine = draft.plan.carte.image.dataURL;
        const scenario = versScenario(draft); const relu = depuisScenario(JSON.stringify(scenario));
        const cours = await assemblerParcours(relu.plan, { platformId: 'elea', timestamp: 1789080000 });
        const tar = window.fflate.gunzipSync(cours.bytes), files = {};
        for (let p = 0; p + 512 <= tar.length;) {
            const nom = new TextDecoder().decode(tar.slice(p, p + 100)).replace(/\0.*$/, ''); if (!nom) break;
            const taille = parseInt(new TextDecoder().decode(tar.slice(p + 124, p + 136)).replace(/\0.*$/, '').trim(), 8) || 0;
            files[nom] = tar.slice(p + 512, p + 512 + taille); p += 512 + Math.ceil(taille / 512) * 512;
        }
        const xml = nom => new DOMParser().parseFromString(new TextDecoder().decode(files[nom]), 'application/xml');
        const racine = xml('files.xml'), entrees = [...racine.querySelectorAll('file')];
        const carte = Object.keys(files).find(n => /\/mapmodules.xml$/.test(n));
        const map = xml(carte), contexte = map.documentElement.getAttribute('contextid');
        const image = entrees.find(n => n.querySelector('component').textContent === 'mod_mapmodules' && n.querySelector('filename').textContent !== '.');
        const hash = image.querySelector('contenthash').textContent;
        const bytes = files[`files/${hash.slice(0, 2)}/${hash}`];
        const calcule = [...new Uint8Array(await crypto.subtle.digest('SHA-1', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
        const inforef = xml(carte.replace('mapmodules.xml', 'inforef.xml'));
        const originalBytes = Uint8Array.from(atob(origine.split(',')[1]), c => c.charCodeAt(0));
        let urlRefusee = false; try { const mauvais = structuredClone(scenario); mauvais.plan.carte.image.dataURL = 'https://exemple.fr/photo.jpg'; depuisScenario(JSON.stringify(mauvais)); } catch { urlRefusee = true; }
        let manquantRefuse = false; try { const manque = structuredClone(relu.plan); delete manque.carte.image.dataURL; await assemblerParcours(manque, { platformId: 'elea' }); } catch (e) { manquantRefuse = e.message === 'parcours_carte_perso_manquante'; }
        let fauxRefuse = false; try { const faux = structuredClone(relu.plan); faux.carte.image.dataURL = 'data:image/jpeg;base64,Ym9uam91cg=='; await assemblerParcours(faux, { platformId: 'elea' }); } catch (e) { fauxRefuse = e.message === 'parcours_carte_perso_manquante'; }
        // Repli réel sous quota : garder le nom et le choix sans prétendre garder les octets.
        const set = Storage.prototype.setItem;
        let sauvegarde;
        try {
            Storage.prototype.setItem = function(k, v) { if (v.includes('data:image/')) throw new DOMException('quota', 'QuotaExceededError'); return set.call(this, k, v); };
            majBrouillon({ plan: draft.plan }); sauvegarde = JSON.parse(sessionStorage.getItem('caramel_parcours_draft'));
        } finally { Storage.prototype.setItem = set; majBrouillon({ plan: draft.plan }); }
        const autre = await assemblerParcours(relu.plan, { platformId: 'magistere' });
        const sans = await assemblerParcours({ ...relu.plan, carte: { ...relu.plan.carte, actif: false } }, { platformId: 'elea' });
        return { bytes: Array.from(cours.bytes), scenario,
            reprise: relu.plan.carte.image.dataURL === origine,
            nom: map.querySelector('mapmodules > name').textContent,
            contexte: image.querySelector('contextid').textContent === contexte,
            zone: image.querySelector('filearea').textContent === 'maps' && image.querySelector('itemid').textContent === '0',
            idsUniques: new Set(entrees.map(n => n.getAttribute('id'))).size === entrees.length,
            reference: inforef.querySelector('fileref file id').textContent === image.getAttribute('id'),
            octets: hash === calcule && originalBytes.length === bytes.length && bytes.every((b, i) => b === originalBytes[i]),
            h5p: entrees.filter(n => n.querySelector('component').textContent === 'mod_h5pactivity').length === 2,
            quota: sauvegarde.contenusNonPersistes && sauvegarde.plan.carte.personnalisee && !sauvegarde.plan.carte.image.dataURL && draft.plan.carte.image.dataURL === origine,
            urlRefusee, manquantRefuse, fauxRefuse,
            autres: !autre.activites.some(a => a.moduleName === 'mapmodules') && !sans.activites.some(a => a.moduleName === 'mapmodules') };
    });
    for (const [cle, label] of Object.entries({ reprise: 'le scénario conserve exactement le fond choisi', contexte: 'le fichier cible le contexte renuméroté de la carte', zone: 'le fond utilise la zone mod_mapmodules/maps/0', idsUniques: 'les identifiants de fichiers sont uniques', reference: 'inforef référence le fond embarqué', octets: 'le pool du MBZ contient les octets exacts et leur SHA-1', h5p: 'le paquet H5P voisin est conservé', quota: 'le repli sous quota conserve un manque explicite', urlRefusee: 'une URL extérieure dans le scénario est refusée', manquantRefuse: 'un fond perdu demande de joindre à nouveau le fichier', fauxRefuse: 'une fausse image est refusée avant téléchargement', autres: 'la carte reste facultative et propre à Éléa' })) ok(label, exporte[cle]);
    ok('le nom respecte la grammaire exacte du greffon', exporte.nom === 'Carte personnalisée : fond-parcours.jpg');
    writeFileSync(resolve(sorties, 'parcours-fond-personnel.mbz'), Buffer.from(exporte.bytes));
    writeFileSync(resolve(sorties, 'scenario-fond-personnel.json'), JSON.stringify(exporte.scenario, null, 2));
    await page.locator('.pc-galerie [data-theme="cerveau"]').click();
    ok('choisir un thème conserve la photo pour y revenir', !await page.locator('.pc-fond-apercu').isVisible() && await page.locator('.pc-fond-tuile img').count() === 1);
    await page.locator('.pc-fond-tuile').click();
    await page.locator('#pc-fond-fichier').setInputFiles({ name: 'invalide.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('invalide') });
    await page.waitForFunction(() => document.querySelector('.pc-fond-message').textContent.includes('illisible'));
    ok('un remplacement invalide conserve le fond précédent', await page.locator('.pc-fond-apercu img').isVisible());
    await page.locator('#pc-fond-fichier').setInputFiles(resolve(root, 'tests/fixtures/parcours-fonds/degrade.heic'));
    await page.waitForFunction(() => document.querySelector('.pc-fond-nom').textContent === 'degrade.heic');
    ok('le remplacement par un HEIC fonctionne depuis le vrai champ fichier', await page.locator('.pc-fond-apercu img').evaluate(n => n.src.startsWith('data:image/jpeg;')));
    await page.locator('#pc-fond-fichier').setInputFiles({ name: 'trop-lourd.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(12 * 1024 * 1024 + 1) });
    await page.waitForFunction(() => document.querySelector('.pc-fond-message').textContent.includes('12'));
    ok('une image trop lourde conserve le fond déjà choisi', await page.locator('.pc-fond-nom').textContent() === 'degrade.heic');
    // Une conversion locale lente ne doit pas annuler le choix effectué entre-temps.
    await page.evaluate(() => {
        window.bitmapAvantFond = window.createImageBitmap;
        window.createImageBitmap = async (...args) => {
            await new Promise(r => { window.finAttenteFond = r; });
            const b = await window.bitmapAvantFond(...args); window.finConversionFond = true; return b;
        };
    });
    await page.locator('#pc-fond-fichier').setInputFiles(resolve(root, 'tests/fixtures/parcours-fonds/degrade.png'));
    await page.waitForFunction(() => typeof window.finAttenteFond === 'function');
    await page.locator('.pc-galerie [data-theme="cerveau"]').click();
    await page.evaluate(() => window.finAttenteFond());
    await page.waitForFunction(() => window.finConversionFond);
    await page.evaluate(() => { window.createImageBitmap = window.bitmapAvantFond; });
    ok('choisir un thème pendant la conversion garde le dernier choix', await page.locator('.pc-galerie [data-theme="cerveau"]').getAttribute('aria-checked') === 'true'
        && await page.locator('.pc-fond-nom').textContent() === 'degrade.heic');
    // Photo pour les captures ; la conversion HEIC ci-dessus reste vérifiée.
    await page.locator('#pc-fond-fichier').setInputFiles(resolve(root, 'tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg'));
    await page.waitForFunction(() => document.querySelector('.pc-fond-nom').textContent.endsWith('.jpg'));
    for (const [width, lang] of [[1440, 'fr'], [390, 'fr'], [390, 'ar'], [390, 'br']]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(async lang => { await (await import('/js/core/translation.js')).loadTranslations(lang); await (await import('/js/parcours/index.js')).__testHooks.allerA(1); }, lang);
        await page.waitForTimeout(100);
        await page.locator('.pc-plan-reglages').scrollIntoViewIfNeeded();
        ok(`${lang}/${width} : aucun débordement avec fond personnel`, await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
        ok(`${lang}/${width} : aucune clé brute dans les nouveaux contrôles`, !/parcours_carte_perso_/.test(await page.locator('.pc-carte-images').innerText()));
        await page.screenshot({ path: resolve(sorties, `fond-${lang}-${width}.png`), animations: 'disabled' });
        await page.locator('.pc-plan-notions summary').click();
        await page.locator('.pc-carte__details summary').first().click();
        await page.waitForTimeout(100);
        ok(`${lang}/${width} : les textes dépliés sont entiers`, await page.locator('.pc-page--plan').evaluate(n =>
            [...n.querySelectorAll('textarea')].filter(c => c.clientWidth).every(c => c.scrollHeight <= c.clientHeight + 1)));
        await page.locator('.pc-plan-notions').screenshot({ path: resolve(sorties, `notions-${lang}-${width}.png`) });
        await page.locator('.pc-carte__details').first().screenshot({ path: resolve(sorties, `consigne-${lang}-${width}.png`) });
    }
    await page.locator('.pc-fond-controles button').last().click();
    ok('retirer la photo rend la tuile + et le thème précédent', !await page.locator('.pc-fond-apercu').isVisible() && await page.locator('.pc-galerie [aria-checked=true]').count() === 1);
    ok('aucune erreur JavaScript', errors.length === 0, errors.join('; '));
    console.log(`Fonds personnels : ${pass} PASS / 0 FAIL`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
