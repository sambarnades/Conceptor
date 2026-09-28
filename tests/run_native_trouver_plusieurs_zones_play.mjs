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
 for(const kind of ['complet','plafond']) {
  archive=archiveRecette('sucrerie-trouver-plusieurs-zones-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const img=frame.locator('.hotspot-image');await img.waitFor();if(!await img.evaluate(el=>el.naturalWidth===800))throw Error('Image absente');
  const click=async(x,y)=>{const box=await img.boundingBox();await page.mouse.click(box.x+box.width*x/100,box.y+box.height*y/100);await page.waitForTimeout(400);};
  const score=async expected=>{const text=await frame.locator('body').innerText();if(!text.includes(expected))throw Error('Score attendu '+expected+' : '+text);return text;};
  const max=kind==='complet'?2:1;
  await click(5,5);let text=await score('0/'+max);if(!text.includes('Clique dans un rectangle. RELU'))throw Error('Feedback hors zone absent');
  await click(50,47);text=await score('0/'+max);if(!text.includes('Le rectangle violet est incorrect. RELU'))throw Error('Feedback erreur absent');
  await click(20,47);await score('1/'+max);
  if(kind==='complet') {
   await click(20,47);text=await score('1/2');if(!text.includes('Zone déjà trouvée. RELU'))throw Error('Double clic compté ou feedback absent');
   await click(80,47);await score('2/2');
  }else{await click(80,47);await score('1/1');}
  await page.screenshot({path:'/tmp/trouver-plusieurs-zones-'+kind+'-jeu.png',fullPage:true});
  const retry=frame.getByRole('button',{name:'Retry',exact:true});
  const retryVisible=await retry.isVisible();
  if(retryVisible){await retry.click();await click(50,47);await score('0/'+max);await click(80,47);await score('1/'+max);}
  reports.push({kind,max,horsZone:true,erreur:true,doubleClicSansPoint:kind==='complet',plafondRespecte:kind==='plafond',repriseVisible:retryVisible});console.log(kind+' : hors zone, erreur, score '+max+'/'+max+' et plafond vérifiés ; reprise visible '+retryVisible);

 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/trouver-plusieurs-zones-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
