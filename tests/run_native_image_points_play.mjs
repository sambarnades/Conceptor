/** Points interactifs : ouvertures, plein écran, vraie lecture audio/vidéo et fermeture. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8195','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8195/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1100,height:1100}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let archive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(archive),contentType:'application/octet-stream'}));
 for(const kind of ['icones','image']) {
  archive=archiveRecette('sucrerie-image-points-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const points=frame.locator('.h5p-image-hotspot');await points.first().waitFor();
  if(await points.count()!==3)throw Error('Point absent');const media=[];
  for(let i=0;i<3;i++) {
   await points.nth(i).click();const popup=frame.getByRole('dialog');await popup.waitFor();await page.waitForTimeout(500);
   if(i===0) {
    if(!(await popup.innerText()).includes('Deuxième paragraphe RELU'))throw Error('Deuxième texte absent');
    const full=await popup.evaluate(el=>el.classList.contains('fullscreen-popup'));if(full!==(kind==='image'))throw Error('Plein écran ignoré');
    await page.screenshot({path:'/tmp/image-points-'+kind+'-jeu.png',fullPage:true});
   }
   if(i===1) {const img=popup.locator('img');await img.first().waitFor();if(!await img.first().evaluate(el=>el.naturalWidth>0))throw Error('Image absente');}
   if(i>0) {
    const played=await popup.locator('audio,video').first().evaluate(async el=>{el.muted=true;await el.play();await new Promise(r=>el.addEventListener('timeupdate',r,{once:true}));const value={duration:el.duration,currentTime:el.currentTime,loop:el.loop};el.pause();return value;});
    if(!(played.currentTime>0 && played.duration>0))throw Error('Média non lu');media.push(played);
   }
   await popup.locator('.h5p-image-hotspot-close-popup-button').click();await popup.waitFor({state:'hidden'});
  }
  reports.push({kind,points:3,media});console.log(kind+' : trois points, plein écran, image, audio et vidéo vérifiés');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/image-points-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
