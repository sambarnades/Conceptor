/** Trouver la zone : hors zone, erreur, reprise, réussite ; popup et feedback intégré. */
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
 for(const kind of ['popup','integre']) {
  archive=archiveRecette('sucrerie-trouver-zone-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const img=frame.locator('.hotspot-image');await img.waitFor();if(!await img.evaluate(el=>el.naturalWidth===800))throw Error('Image absente');
  const click=async(x,y)=>{const box=await img.boundingBox();await page.mouse.click(box.x+box.width*x/100,box.y+box.height*y/100);await page.waitForTimeout(400);};
  const retry=async()=>{await frame.getByRole('button',{name:/Recommencer l/}).and(frame.locator(':visible')).click();await page.waitForTimeout(200);};
  await click(5,5);let text=await frame.locator('body').innerText();if(!text.includes('Clique dans un rectangle. RELU') || !text.includes('0/1'))throw Error('Hors zone : '+text);await retry();
  await click(20,47);text=await frame.locator('body').innerText();if(!text.includes('Zone 1 sélectionnée.') || !text.includes('0/1'))throw Error('Erreur : '+text);await retry();
  await click(50,47);text=await frame.locator('body').innerText();if(!text.includes('Tu as trouvé le rectangle violet. RELU') || !text.includes('1/1'))throw Error('Réussite : '+text);
  const popup=frame.locator('.h5p-question-feedback.h5p-question-popup:visible');if(Boolean(await popup.count())!==(kind==='popup'))throw Error('Mode feedback ignoré');
  await page.screenshot({path:'/tmp/trouver-zone-'+kind+'-jeu.png',fullPage:true});reports.push({kind,score:'1/1',horsZone:true,erreur:true,reprise:true,text});console.log(kind+' : hors zone, erreur, reprise et 1/1 vérifiés');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/trouver-zone-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
