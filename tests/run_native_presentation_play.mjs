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
 for(const kind of ['complet','sans-bilan']) {
  archive=archiveRecette('sucrerie-presentation-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  await frame.locator('.h5p-course-presentation').waitFor();
  const visible=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  const next=async()=>{await frame.getByRole('button',{name:'Diapositive suivante',exact:true}).click();await page.waitForTimeout(350);};
  const score=()=>frame.locator('body').evaluate(el=>{const cp=el.ownerDocument.defaultView.H5P.instances.find(i=>i.presentation&&i.slides);return {score:cp.getScore(),max:cp.getMaxScore(),slides:cp.slides.length};});
  const jouer=async correct=>{
   await visible('Rome').click();await visible('Vérifier').click();
   let mc=frame.locator('.h5p-multichoice:visible');
   await mc.locator('.h5p-theme-retry:visible').click();await visible('Paris').click();await visible('Vérifier').click();
   await visible('Vrai').click();await next();await visible(correct?'Vrai':'Faux').click();await next();
   const inputs=frame.locator('input.h5p-text-input:visible');await inputs.nth(0).fill('Paris');await inputs.nth(0).press('Tab');await inputs.nth(1).fill('Rome');await inputs.nth(1).press('Tab');await visible('Vérifier').click();
   await next();await visible('Paris').click();await visible('Rome').click();await visible('Vérifier').click();await next();
   const img=frame.locator('.h5p-image img:visible');await img.waitFor();if(!await img.evaluate(el=>el.naturalWidth>0))throw Error('Image non chargée');
   for(const type of ['audio','video']){const media=frame.locator(type).last();await media.evaluate(async el=>{await el.play();await new Promise(resolve=>{if(el.currentTime>0)return resolve();el.addEventListener('timeupdate',resolve,{once:true});});el.pause();});}
   const result=await score();if(result.score!==(correct?7:6)||result.max!==7)throw Error('Score natif '+JSON.stringify(result));
   await page.screenshot({path:'/tmp/presentation-'+kind+'-medias.png',fullPage:true});
   if(kind==='complet'){
    await next();const confirm=frame.getByRole('button',{name:'Confirmer',exact:true});if(await confirm.isVisible())await confirm.click();
    await page.waitForTimeout(300);
   }
   await page.screenshot({path:'/tmp/presentation-'+kind+'-jeu.png',fullPage:true});return result;
  };
  const initial=await jouer(false);let reprise=false;
  if(kind==='complet'){
   const retry=visible('Recommencer');await retry.click();
   await jouer(true);reprise=true;
   await visible('Afficher la solution').click();await page.waitForTimeout(300);
   await frame.getByTitle('Afficher les commentaires',{exact:true}).click();
   await frame.getByRole('dialog').waitFor();
   if(!(await frame.locator('body').innerText()).includes('Commentaire pédagogique RELU'))throw Error('Commentaire absent du corrigé natif');
   await page.screenshot({path:'/tmp/presentation-'+kind+'-solution.png',fullPage:true});
  }else if(initial.slides!==5)throw Error('Bilan caché ignoré');
  reports.push({kind,initial,reprise,medias:true});console.log(kind+' : '+JSON.stringify(reports.at(-1)));

 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/presentation-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
