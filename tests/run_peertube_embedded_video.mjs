/** Régression Firefox/Chromium : MP4 progressif embarqué, navigation et résumé.
 * Usage : node tests/run_peertube_embedded_video.mjs /chemin/video-progressive.mp4
 * Média local fourni explicitement ; aucun service distant appelé.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const { chromium } = createRequire(new URL('./roundtrip/package.json', import.meta.url))('playwright');
if (!process.argv[2]) throw new Error('Fournir un MP4 progressif local de plus de 5 secondes.');
const media = await readFile(process.argv[2]);
const server = spawn('python3', ['tests/serveur-statique.py', '8196', '--bind', '127.0.0.1'], {stdio:'ignore'});
let browser;
try {
    for (let n=0; n<100; n++) {
        try { if ((await fetch('http://127.0.0.1:8196/')).ok) break; } catch {}
        await new Promise(resolve=>setTimeout(resolve,100));
    }
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.route('**/progressif.mp4', route=>route.fulfill({body:media, contentType:'application/octet-stream'}));
    await page.route('https://tube.exemple.fr/**', route=>route.fulfill({json:
        route.request().url().endsWith('/captions') ? {data:[]} : {
            duration:225,
            files:[{resolution:{id:480}, fileUrl:'https://tube.exemple.fr/statique-inexistant.mp4',
                fileDownloadUrl:'http://127.0.0.1:8196/progressif.mp4'}], streamingPlaylists:[]
        }
    }));
    await page.goto('http://127.0.0.1:8196/tests/preview-feedback-harness.html');
    await page.waitForFunction(()=>window.__pret);
    const source = await page.evaluate(async()=>{
        const {detectVideo} = await import('/js/services/video-transcript.js');
        const info = await detectVideo('https://tube.exemple.fr/w/67bdf6c4-1649-40b0-b62d-baa0c1fe5246');
        if (!info.videoSource?.embed) throw new Error('La détection doit demander l’embarquement.');
        const result = await window.__monter('InteractiveVideo', {
            title:'Régression PeerTube', videoSource:info.videoSource, interactions:[],
            summary:{intro:'Choisir la bonne affirmation.', statements:[['Réponse correcte.','Autre réponse.']]}
        });
        return result.contentJson.interactiveVideo.video.files[0].path;
    });
    if (!source.startsWith('videos/')) throw new Error('Source distante conservée : '+source);
    const frame = page.frameLocator('.h5p-iframe');
    await frame.locator('video').waitFor({state:'attached'});
    await page.waitForFunction(()=>{
        const video=document.querySelector('.h5p-iframe')?.contentDocument?.querySelector('video');
        return video && Number.isFinite(video.duration) && video.duration>5 && video.seekable.length && video.seekable.end(0)>video.duration-1;
    });
    await frame.getByRole('button',{name:'Lecture (k)',exact:true}).click();
    await frame.locator('.h5p-seekbar-interaction.h5p-summary-interaction').click();
    await frame.locator('.h5p-summary-interaction[role="button"]').click();
    await frame.getByRole('radio',{name:'Réponse correcte.',exact:true}).waitFor();
    console.log('PASS : détection → processeur → archive → réouverture → navigation → résumé visible.');
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
