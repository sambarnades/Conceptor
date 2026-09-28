/** Supports individuels dans un parcours : vrais champs, services doublés, octets exportés relus. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8147;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser, pass = 0, vision = 0;
const comptesVision = [];
const ok = (nom, value) => { assert.ok(value, nom); pass++; console.log('✓', nom); };
const sourceVideo = 'https://www.youtube.com/watch?v=abcdefghijk';
const transcription = 'WEBVTT\n\n00:00:00.000 --> 00:00:15.000\nLes étoiles brillent dans le ciel nocturne.\n\n00:00:15.000 --> 00:00:30.000\nUn cyprès se dresse au premier plan.\n';
const captures = process.env.QA_CAPTURES || '/tmp/caramel-sources-captures';
const carte = (id, module) => ({ id, module, titre: `Observer — ${id}`, objectif: 'Observer le paysage', consigne: 'Identifier les éléments du tableau', palier: 'decouverte', duree: 8 });
const scenario = { produit: 'caramel-parcours', format: 1, cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'auto' },
    plan: { titre: 'Explorer le ciel et le paysage', objectifGeneral: 'Observer et expliquer', notionsPivots: ['étoiles', 'cyprès'],
        etapes: [{ id: 'e1', titre: 'Observer', cartes: [carte('image1', 'ImageHotspots'), carte('image2', 'ImageHotspots'), carte('video', 'InteractiveVideo'), carte('sans', 'FindTheHotspot'), carte('texte', 'parcours_etiquette')] }] } };
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async r => {
        const u = new URL(r.request().url());
        if (u.hostname === '127.0.0.1') return r.continue();
        if (u.pathname.endsWith('/caramel-vision-detect-bas')) {
            vision++; comptesVision.push(r.request().postDataJSON().count);
            return r.fulfill({ json: { imageDescription: 'Deux formes colorées', scale: 100, zones: [{ x: 25, y: 40, label: 'Étoile', description: 'Une forme jaune' }, { x: 70, y: 60, label: 'Cyprès', description: 'Une forme verte' }] } });
        }
        if (u.pathname.endsWith('/caramel-video-transcript-bas')) return r.fulfill({ json: { hasAutoSubs: false } });
        return r.abort();
    });
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
    await page.evaluate(async () => {
        const { __testHooks } = await import('/js/parcours/index.js');
        window.appelsSources = [];
        __testHooks.doublerModele(async (prompt, carte) => {
            window.appelsSources.push({ id: carte.id, prompt });
            if (carte.module === 'InteractiveVideo') return JSON.stringify({ title: 'Vidéo', interactions: [{ type: 'truefalse', time: 16, question: 'Le cyprès est au premier plan.', correct: true }] });
            if (carte.module === 'parcours_etiquette') return JSON.stringify({ title: 'Observer', intro: 'Décrivez le ciel.' });
            return JSON.stringify({ title: 'Image', hotspots: [{ x: 25, y: 40, header: 'Étoile', text: 'Un astre.' }, { x: 70, y: 60, header: 'Cyprès', text: 'Un arbre.' }] });
        });
    });
    await page.fill('#qui', 'Professeur d’arts plastiques'); await page.fill('#quoi', 'Un paysage nocturne');
    await page.click('#parcours-button');
    await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
    await page.waitForSelector('.pc-title-input');
    ok('les quatre activités à média gardent leur type à l’import', await page.locator('.pc-source').count() === 4);
    const images = await page.evaluate(() => ['#d4e8ff', '#fff0cd'].map(couleur => {
        const c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
        x.fillStyle = couleur; x.fillRect(0, 0, 320, 200); x.fillStyle = '#f2bb20'; x.fillRect(65, 65, 30, 30); x.fillStyle = '#216e37'; x.fillRect(210, 85, 28, 80);
        return c.toDataURL('image/png');
    }));
    for (let i = 0; i < 2; i++) {
        await page.locator(`[data-carte="image${i + 1}"] input[type=file]`).setInputFiles({ name: `paysage-${i + 1}.png`, mimeType: 'image/png', buffer: Buffer.from(images[i].split(',')[1], 'base64') });
        await page.waitForFunction(id => !!document.querySelector(`[data-carte="${id}"] .pc-source__apercu`)?.getAttribute('src'), `image${i + 1}`);
    }
    ok('joindre les fichiers ne lance pas encore de requête vision', vision === 0);
    const video = page.locator('[data-carte="video"] input[type=url]');
    await video.fill(sourceVideo);
    ok('saisir une URL conserve le focus sans repeindre la carte', await video.evaluate(n => n === document.activeElement));
    await page.locator('[data-carte="video"] .pc-source summary').click();
    await page.locator('[data-carte="video"] .pc-source textarea').fill(transcription);
    mkdirSync(captures, { recursive: true });
    await page.locator('[data-carte="image1"]').scrollIntoViewIfNeeded(); await page.screenshot({ path: resolve(captures, 'plan-1440.png') });
    await page.locator('.pc-cta').last().click();
    await page.waitForFunction(() => document.querySelectorAll('.pc-carte--faite').length === 4, null, { timeout: 45000 });
    ok('trois médias prêts et une activité texte sont fabriqués', await page.locator('.pc-carte--faite').count() === 4);
    ok('le support manquant reste à compléter, sans appel au modèle', await page.evaluate(() => !window.appelsSources.some(a => a.id === 'sans')) && await page.locator('.pc-carte--source').count() === 1);
    ok('la vision tourne une fois par image dans la file', vision === 2);
    ok('le nombre de zones demandé suit le calibrage de la carte', comptesVision.every(n => n === 4));
    ok('le vrai prompt vidéo contient le transcript et le contexte de la carte', await page.evaluate(() => {
        const p = window.appelsSources.find(a => a.id === 'video').prompt;
        return p.includes('cyprès') && p.includes('Observer — video') && p.includes('Un paysage nocturne');
    }));
    ok('les prompts image réutilisent les positions analysées', await page.evaluate(() => window.appelsSources.filter(a => a.id.startsWith('image')).every(a => a.prompt.includes('25') && a.prompt.includes('70') && a.prompt.includes('Étoile'))));
    const octets = await page.evaluate(async () => {
        const { brouillon } = await import('/js/parcours/state.js');
        const { versScenario, depuisScenario } = await import('/js/parcours/scenario-io.js');
        const { mediaFilesPour, contenuPourEdition, recueillirMedias } = await import('/js/parcours/sources.js');
        const { activiteDepuisCarte, assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { construireCoursDocumentaire } = await import('/js/parcours/fiche-sequence.js');
        await (await import('/js/core/lib-loader.js')).loadJSZip();
        const d = depuisScenario(JSON.stringify(versScenario(brouillon()))); const cartes = d.plan.etapes[0].cartes;
        const paquets = await Promise.all(cartes.slice(0, 2).map(activiteDepuisCarte));
        const zips = await Promise.all(paquets.map(p => window.JSZip.loadAsync(p.h5pBytes)));
        const binaires = await Promise.all(zips.map((z, i) => z.file('content/' + cartes[i].contenu.image.path).async('base64')));
        const exacts = binaires.every((b, i) => b === cartes[i].medias[cartes[i].contenu.image.path].split(',')[1]);
        const isoles = zips.every(z => Object.keys(z.files).filter(n => n.startsWith('content/images/') && !z.files[n].dir).length === 1);
        const edition = contenuPourEdition(cartes[0]); edition.hotspots[0].header = 'Étoile corrigée';
        const sauvegarde = await recueillirMedias(cartes[0], edition, d.plan); Object.assign(cartes[0], sauvegarde);
        const rendu = await activiteDepuisCarte(cartes[0]);
        const z = await window.JSZip.loadAsync(rendu.h5pBytes);
        const conserve = await z.file('content/' + cartes[0].contenu.image.path).async('base64') === binaires[0];
        const cours = await assemblerParcours(d.plan, { platformId: 'elea', timestamp: 1789070000 });
        const { loadMoodleLibs } = await import('/js/core/lib-loader.js'); await loadMoodleLibs();
        const tar = window.fflate.gunzipSync(cours.bytes); const fichiers = {};
        for (let o = 0; o + 512 <= tar.length;) {
            const nom = new TextDecoder().decode(tar.subarray(o, o + 100)).replace(/\0.*$/, ''); if (!nom) break;
            const taille = parseInt(new TextDecoder().decode(tar.subarray(o + 124, o + 136)).replace(/[^0-7]/g, ''), 8) || 0;
            fichiers[nom] = tar.subarray(o + 512, o + 512 + taille); o += 512 + Math.ceil(taille / 512) * 512;
        }
        const imagesFinales = [];
        for (const [nom, bytes] of Object.entries(fichiers)) {
            if (!nom.startsWith('files/') || bytes[0] !== 80 || bytes[1] !== 75) continue;
            const h5p = await window.JSZip.loadAsync(bytes);
            for (const [path, f] of Object.entries(h5p.files)) if (path.startsWith('content/images/') && !f.dir) imagesFinales.push(await f.async('base64'));
        }
        let rejecte = false; try { const invalide = versScenario(d); invalide.plan.etapes[0].cartes[0].medias['../intrus'] = 'data:image/png;base64,eA=='; depuisScenario(JSON.stringify(invalide)); } catch { rejecte = true; }
        return { exacts, isoles, distincts: binaires[0] !== binaires[1], conserve, hydrate: !!edition.image.dataURL,
            nettoye: !JSON.stringify(sauvegarde.contenu).includes('data:image'), rejecte,
            mbz: binaires.every(b => imagesFinales.includes(b)) && imagesFinales.length === 2,
            activites: cours.activites.length, exclues: cours.exclues.length,
            video: cartes[2].contenu.videoSource.url,
            documentaire: construireCoursDocumentaire(d.plan).activities[0].jsonData._backgroundImage?.startsWith('data:image/'),
            count: mediaFilesPour(cartes[0]).size };
    });
    for (const [key, label] of Object.entries({ exacts: 'les fichiers H5P portent les octets exacts de chaque image', isoles: 'aucune image étrangère dans les deux H5P', distincts: 'les deux images restent différentes', conserve: 'édition et réempaquetage conservent l’image', hydrate: 'l’éditeur individuel reçoit l’image pour son aperçu', nettoye: 'les octets restent séparés du JSON de contenu', rejecte: 'un chemin importé hors des médias est refusé', mbz: 'le MBZ final contient les deux images exactes dans les H5P', documentaire: 'le document du parcours reçoit aussi son image' })) ok(label, octets[key]);
    ok('le lien vidéo utilisé est celui de la carte', octets.video === sourceVideo);
    ok('le parcours exporte quatre activités et signale celle incomplète', octets.activites === 4 && octets.exclues === 1);
    // Vraie ouverture de l’éditeur et du lecteur individuel depuis la fabrication.
    await page.locator('[data-carte="image1"] [data-action="editer"]').click();
    await page.waitForSelector('.json-editor');
    ok('l’éditeur visuel existant s’ouvre avec l’image attachée', await page.locator('.pc-editeur img[src^="data:image/"]').count() > 0);
    await page.locator('.ih-modebtn[data-mode="plan"]').click();
    await page.locator('.json-editor__nav-section[data-section-id="general"] button').first().click();
    await page.locator('.json-editor input[data-path="title"]').fill('Image relue');
    await page.locator('.json-editor input[type=file]').first().setInputFiles({ name: 'nouveau-fond.png', mimeType: 'image/png', buffer: Buffer.from(images[1].split(',')[1], 'base64') });
    await page.waitForFunction(image => [...document.querySelectorAll('.json-editor img')].some(n => n.src === image), images[1]);
    await page.locator('.json-editor [data-action="save"]').click();
    await page.waitForFunction(() => document.querySelector('#pc-lecture-titre')?.textContent === 'Image relue');
    ok('enregistrer dans l’éditeur individuel garde le support sur la carte', await page.evaluate(async () => {
        const c = (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[0];
        return c.titre === 'Image relue' && !!c.medias[c.contenu.image.path] && c.source.path === c.contenu.image.path && Object.keys(c.medias).length === 1;
    }));
    await page.locator('.pc-editeur__fermer').click();
    await page.locator('[data-carte="image1"] button').filter({ has: page.locator('.fa-eye') }).click();
    await page.waitForSelector('.pc-editeur iframe', { timeout: 30000 });
    ok('le lecteur H5P existant ouvre le paquet avec son image', await page.locator('.pc-editeur iframe').count() > 0);
    await page.keyboard.press('Escape');
    const autres = await page.evaluate(async () => {
        const { creerFile } = await import('/js/parcours/parcours-runner.js');
        const { joindreImage, sourceManquante } = await import('/js/parcours/sources.js');
        const { brouillon } = await import('/js/parcours/state.js');
        const d = structuredClone(brouillon()); const c = d.plan.etapes[0].cartes[0];
        c.source = null; const avant = JSON.stringify(c.contenu); let appels = 0;
        const file = creerFile(d, { appelModele: async () => { appels++; return '{}'; } }); await file.refaire(c.id);
        const conserve = JSON.stringify(c.contenu) === avant && appels === 0;
        delete c.contenu; c.source = { type: 'image', path: 'images/absente.png' }; c.medias = {};
        const quota = sourceManquante(c);
        const b = new Blob(['invalide'], { type: 'image/png' });
        let illisible = false; try { await joindreImage(c, b, d.plan); } catch { illisible = true; }
        return { conserve, quota, illisible };
    });
    ok('une régénération sans support garde le contenu relu et ne paie aucun appel', autres.conserve);
    ok('une reprise sans octets détecte le support à joindre de nouveau', autres.quota);
    ok('un faux fichier image est refusé', autres.illisible);
    await page.evaluate(async () => { window.brouillonSources = structuredClone((await import('/js/parcours/state.js')).brouillon()); });
    let detections = 0;
    await page.route('**/caramel-video-transcript-bas', async r => {
        detections++;
        const auto = r.request().postDataJSON().youtubeUrl?.includes('auto');
        await r.fulfill({ json: auto ? { hasAutoSubs: true, duration: 30, segments: [{ start: 0, end: 15, text: 'Le ciel est bleu.' }, { start: 15, end: 30, text: 'Un arbre au premier plan.' }] } : { hasAutoSubs: false } });
    });
    const auto = await page.evaluate(async () => {
        const { creerFile } = await import('/js/parcours/parcours-runner.js');
        const { brouillon } = await import('/js/parcours/state.js');
        const d = structuredClone(brouillon()), c = d.plan.etapes[0].cartes.find(c => c.module === 'InteractiveVideo');
        c.contenu = null; c.source = { type: 'video', url: 'https://youtu.be/autovideoxx', transcription: '' };
        d.plan.etapes[0].cartes = [c]; let appels = 0, prompt = '';
        const file = creerFile(d, { appelModele: async p => { appels++; prompt = p; return JSON.stringify({ interactions: [{ timestamp: 15, type: 'truefalse', question: 'Le ciel est bleu.', correct: true }] }); } });
        await file.demarrer(); const premier = file.etat().faites === 1;
        await file.refaire(c.id); const cache = appels === 2;
        const precedent = JSON.stringify(c.contenu);
        c.source.url = 'https://youtu.be/sansvideoxx'; await file.refaire(c.id);
        return { premier, cache, prompt, ancien: precedent === JSON.stringify(c.contenu), appels, erreur: file.etat().lignes[0].erreurKey };
    });
    ok('la transcription automatique du service est injectée sans collage', auto.premier && auto.prompt.includes('Le ciel est bleu.'));
    ok('refaire avec le même support réutilise l’analyse, changer le lien la renouvelle', auto.cache && detections === 2);
    ok('une transcription absente bloque le LLM et conserve le contenu relu', auto.appels === 2 && auto.ancien && auto.erreur === 'parcours_source_transcription_echec');
    // Arrêter pendant la détection doit interrompre le réseau ET empêcher le modèle.
    let requeteDetectee;
    const detection = new Promise(r => { requeteDetectee = r; });
    await page.route('**/caramel-video-transcript-bas', r => { requeteDetectee(); /* en vol jusqu’à AbortSignal */ });
    await page.evaluate(async () => {
        const { creerFile } = await import('/js/parcours/parcours-runner.js');
        const { brouillon } = await import('/js/parcours/state.js');
        const d = structuredClone(brouillon()), c = d.plan.etapes[0].cartes.find(c => c.module === 'InteractiveVideo');
        c.contenu = null; c.source = { type: 'video', url: 'https://youtu.be/stopvideoxx' }; d.plan.etapes[0].cartes = [c];
        window.appelsArret = 0; window.fileArret = creerFile(d, { appelModele: async () => { window.appelsArret++; return '{}'; } });
    });
    const enVol = page.evaluate(() => window.fileArret.demarrer());
    await detection; await page.evaluate(() => window.fileArret.arreter());
    const arrete = await enVol;
    ok('arrêter pendant la détection rend la main sans lancer la génération', !arrete.enMarche && arrete.lignes[0].statut === 'annulee' && await page.evaluate(() => window.appelsArret === 0));
    await page.evaluate(async () => {
        (await import('/js/parcours/state.js')).majBrouillon(window.brouillonSources);
        (await import('/js/parcours/index.js')).__testHooks.allerA(2);
    });
    // Le contrôle reste disponible en fabrication, et l’URL ne refait rien silencieusement.
    await page.locator('[data-carte="video"] input[type=url]').fill('https://youtu.be/zyxwvutsrqp');
    ok('changer le support affiche la nécessité de refaire sans effacer le contenu', await page.locator('[data-carte="video"] .pc-source__message').last().isVisible());
    ok('un nouveau lien ne réutilise pas silencieusement l’ancienne transcription', await page.evaluate(async () => {
        const c = (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[2];
        return (await import('/js/parcours/sources.js')).transcriptionDecalee(c);
    }));
    await page.locator('[data-carte="video"] .pc-source__transcription button').click();
    ok('la transcription conservée peut être validée explicitement pour le nouveau lien', await page.evaluate(async () => {
        const c = (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[2];
        return !(await import('/js/parcours/sources.js')).transcriptionDecalee(c) && !!c.source.transcription;
    }));
    for (const [width, lang] of [[390, 'fr'], [390, 'ar'], [390, 'br']]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(async l => (await import('/js/core/translation.js')).loadTranslations(l), lang);
        ok(`${lang} : les supports ne débordent pas sur téléphone`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        ok(`${lang} : les boutons du support restent dans leur carte`, await page.locator('.pc-source').evaluateAll(nodes => nodes.every(n => [...n.querySelectorAll('button')].filter(b => b.getClientRects().length).every(b => b.getBoundingClientRect().right <= n.getBoundingClientRect().right + 1 && b.getBoundingClientRect().left >= n.getBoundingClientRect().left - 1))));
        ok(`${lang} : aucune clé brute dans les champs de support`, !/parcours_source_|editor_ih_background|video_manual_toggle/.test(await page.locator('#pc-atelier').innerText()));
        await page.locator('[data-carte="image1"]').scrollIntoViewIfNeeded(); await page.screenshot({ path: resolve(captures, `fabrication-${lang}-${width}.png`) });
    }
    ok('aucune erreur JavaScript', errors.length === 0);
    console.log(`Sources du parcours : ${pass} PASS / 0 FAIL`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
