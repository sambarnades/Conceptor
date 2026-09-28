/** Essai manuel réel : génération individuelle réemployée dans le parcours, ILaaS en série. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = dirname(fileURLToPath(import.meta.url)), root = resolve(base, '../../..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8148, server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const image = await readFile(resolve(root, 'tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg'));
const transcript = JSON.parse(await readFile(resolve(root, 'tests/fixtures/interactive-video-transcript.json'), 'utf8'));
const cas = [
    { id: 'image-fr', module: 'ImageHotspots', lang: 'fr' },
    { id: 'zone-fr', module: 'FindTheHotspot', lang: 'fr' },
    { id: 'zones-fr', module: 'FindMultipleHotspots', lang: 'fr' },
    { id: 'image-br', module: 'ImageHotspots', lang: 'br' },
    { id: 'video-fr', module: 'InteractiveVideo', lang: 'fr' },
];
if (process.argv[2] === 'quatre') cas.splice(0, cas.length, { id: 'image-quatre-fr', module: 'ImageHotspots', lang: 'fr', duree: 8 });
let browser; const bilans = [];
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch();
    for (const c of cas) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); const demandes = [], reponses = [], erreurs = [];
        page.on('pageerror', e => erreurs.push(e.message));
        await page.route('**/*', r => {
            const u = new URL(r.request().url());
            if (u.hostname === '127.0.0.1') return r.continue();
            if (u.hostname === 'n8n-caramel.osc-fr1.scalingo.io' && u.pathname.endsWith('-bas') && u.pathname.startsWith('/webhook/')) {
                if (r.request().method() === 'POST') { const d = r.request().postDataJSON(); demandes.push({ url: u.pathname, ...d, ...(d.image ? { image: '[image du fixture Van Gogh]' } : {}) }); }
                return r.continue();
            }
            return r.abort();
        });
        page.on('response', async r => { if (!r.url().includes('/webhook/')) return; try { const d = await r.json(); if (d.status !== 'pending' && d.status !== 'processing') reponses.push({ url: new URL(r.url()).pathname, data: d }); } catch {} });
        await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
        await page.evaluate(async l => (await import('/js/core/translation.js')).loadTranslations(l), c.lang);
        const video = c.module === 'InteractiveVideo';
        await page.fill('#qui', video ? 'Formateur en hygiène alimentaire' : c.lang === 'br' ? 'Kelenner arzoù kaer er skolaj' : 'Professeur d’arts plastiques au collège');
        await page.fill('#quoi', video ? 'Comprendre HACCP à partir de cette vidéo de formation.' : c.lang === 'br' ? 'Sellet ouzh An noz steredennet gant Van Gogh : an oabl, ar stered, ar gwez hag ar gêriadenn.' : 'Observer La Nuit étoilée de Van Gogh : ciel, étoiles, cyprès et village.');
        await page.click('#parcours-button');
        const titre = video ? 'Comprendre la démarche HACCP' : c.lang === 'br' ? 'Sellet ouzh An noz steredennet' : 'Observer La Nuit étoilée';
        const consigne = video ? 'Poser des questions sur les principes présentés dans la vidéo.' : c.module === 'FindTheHotspot' ? 'Demander de repérer le grand cyprès au premier plan.' : c.module === 'FindMultipleHotspots' ? 'Repérer les astres lumineux dans le ciel.' : c.lang === 'br' ? 'Displegañ ar pezh a weler war ar skeudenn, e brezhoneg.' : 'Expliquer les éléments visibles du tableau et leur place dans la composition.';
        const scenario = { produit: 'caramel-parcours', format: 1, cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'auto' }, plan: { titre, objectifGeneral: titre, notionsPivots: video ? ['danger', 'prévention', 'contrôle'] : c.lang === 'br' ? ['oabl', 'stered', 'gwez'] : ['ciel', 'étoiles', 'cyprès'], etapes: [{ id: 'e1', titre, cartes: [{ id: 'c1', titre, objectif: titre, consigne, module: c.module, duree: c.duree || 10, palier: 'decouverte' }] }] } };
        await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'essai.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
        await page.waitForSelector('.pc-source');
        if (video) {
            await page.locator('.pc-source input[type=url]').fill(transcript._url);
            // Vrai support et vraie transcription du fixture existant, mode manuel explicitement choisi.
            await page.locator('.pc-source summary').click();
            const heure = s => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.000`;
            const vtt = 'WEBVTT\n\n' + transcript.segments.map(s => `${heure(Math.floor(s.start))} --> ${heure(Math.ceil(s.end))}\n${s.text}`).join('\n\n');
            await page.locator('.pc-source textarea').fill(vtt);
        } else {
            await page.locator('.pc-source input[type=file]').setInputFiles({ name: 'van-gogh-nuit-etoilee.jpg', mimeType: 'image/jpeg', buffer: image });
            await page.waitForFunction(() => !!document.querySelector('.pc-source__apercu')?.getAttribute('src'));
        }
        await page.locator('.pc-cta').last().click();
        await page.waitForFunction(() => document.querySelector('.pc-carte--faite, .pc-carte--echouee'), null, { timeout: 420000 });
        const resultat = await page.evaluate(async () => {
            const { brouillon } = await import('/js/parcours/state.js');
            const { versScenario } = await import('/js/parcours/scenario-io.js');
            const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
            const d = brouillon(); let bytes = null, echecExport = null;
            try { const p = await assemblerParcours(d.plan, { platformId: d.platform }); bytes = Array.from(p.bytes); } catch (e) { echecExport = e.message; }
            return { scenario: versScenario(d), bytes, echecExport, message: document.querySelector('.pc-carte__alerte')?.textContent || '' };
        });
        const dossier = resolve(base, c.id); await mkdir(dossier, { recursive: true });
        await writeFile(resolve(dossier, 'scenario.json'), JSON.stringify(resultat.scenario, null, 2));
        await writeFile(resolve(dossier, 'trace.json'), JSON.stringify({ cas: c, demandes, reponses, erreurs, message: resultat.message, echecExport: resultat.echecExport }, null, 2));
        if (resultat.bytes) await writeFile(resolve(dossier, 'parcours.mbz'), Buffer.from(resultat.bytes));
        const bilan = { id: c.id, genere: !!resultat.scenario.plan.etapes[0].cartes[0].contenu, exporte: !!resultat.bytes, erreurs, message: resultat.message };
        bilans.push(bilan); await writeFile(resolve(base, process.argv[2] === 'quatre' ? 'bilan-quatre.json' : 'bilan.json'), JSON.stringify(bilans, null, 2)); console.log(JSON.stringify(bilan));
        if (bilan.genere) {
            await page.locator('[data-carte="c1"] button').filter({ has: page.locator('.fa-eye') }).click();
            await page.waitForSelector('.pc-editeur iframe', { timeout: 45000 });
            await page.waitForTimeout(1500);
        }
        await page.screenshot({ path: resolve(dossier, 'apercu.png'), fullPage: true });
        await page.close();
    }
} finally { await browser?.close(); server.kill('SIGTERM'); }
