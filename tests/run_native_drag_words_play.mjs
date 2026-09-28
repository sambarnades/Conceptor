/** Jeu réel du Glisser les mots repaqueté localement après réédition ; aucun service externe. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8183','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8183/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive=archiveRecette('glisser-mots-image.h5p');
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 await page.goto('http://127.0.0.1:8183/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
 await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
 const frame=page.frameLocator('.h5p-iframe');await frame.locator('.h5p-draggable').first().waitFor();
 await frame.locator('.joubel-tip-container').first().click();
 if (!(await frame.locator('body').innerText()).includes('La Seine')) throw Error('Indice absent');
 await frame.locator('.joubel-tip-container').first().click();
 const drag=async(text,index)=>{
   const from=await frame.locator('.h5p-draggable').filter({hasText:text}).first().boundingBox();
   const to=await frame.locator('.h5p-dropzone').nth(index).boundingBox();
   await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();
   await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:15});await page.mouse.up();
 };
 await drag('Madrid',0);await drag('Rome',1);await frame.getByText('Vérifier',{exact:true}).first().click();

 await page.screenshot({path:'/tmp/glisser-mots-apres-verifier.png',fullPage:true});
 await frame.locator('.h5p-dropzone-wrong').waitFor();

 await frame.getByText('Recommencer',{exact:true}).first().click();
 await drag('Paris',0);await drag('Rome',1);await frame.getByText('Vérifier',{exact:true}).first().click();
 await frame.locator('.h5p-dropzone-correct').first().waitFor();
 await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('2/2'));
 const result=await frame.locator('body').innerText();
 if(!result.includes('2/2')) throw Error('Score final incorrect : '+result);
 await writeFile('/tmp/glisser-mots-jeu.json',JSON.stringify({indice:true,erreur:true,reprise:true,score:'2/2',texte:result},null,2));
 console.log('Glisser les mots : indice, erreur, reprise puis 2/2.');
 await page.screenshot({path:'/tmp/glisser-mots-jeu.png',fullPage:true});
 const mediaReports=[];
 for(const kind of ['audio','video']) {
   currentArchive=archiveRecette('glisser-mots-'+kind+'.h5p');
   await page.goto('http://127.0.0.1:8183/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
   await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
   await frame.locator('.h5p-draggable').first().waitFor();
   let duration;
   if(kind==='audio') {
     const button=frame.locator('.h5p-audio-minimal-button');await button.waitFor();
     await button.evaluate(el=>{
       const win=el.ownerDocument.defaultView, original=win.HTMLMediaElement.prototype.play;
       win.HTMLMediaElement.prototype.play=function(...args){this.muted=true;win.__audioLu=this;return original.apply(this,args);};
     });
     await button.click();
     await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentWindow?.__audioLu?.currentTime>0.05);
     duration=await button.evaluate(el=>el.ownerDocument.defaultView.__audioLu.duration);
   } else {
     const media=frame.locator('video').first();await media.waitFor({state:'attached'});
     duration=await media.evaluate(async el=>{el.muted=true;await el.play();return el.duration;});
   }
   if(!(duration>1))throw Error('Média trop court ou non décodé : '+kind);
   if(kind==='audio' && await frame.getByText('Vérifier',{exact:true}).first().isVisible())throw Error('Bouton vérifier présent en mode immédiat');
   await drag('Madrid',0);await drag('Rome',1);
   if(kind==='video')await frame.getByText('Vérifier',{exact:true}).first().click();
   await frame.locator('.h5p-dropzone-wrong').waitFor();
   if(kind==='video') {
     for(const name of ['Recommencer','Afficher la solution']) if(await frame.getByText(name,{exact:true}).first().isVisible())throw Error('Option désactivée encore visible : '+name);
   }
   await page.screenshot({path:'/tmp/glisser-mots-'+kind+'-jeu.png',fullPage:true});
   mediaReports.push({kind,duration,lecture:true,erreur:true,verificationImmediate:kind==='audio',repriseSolutionDesactivees:kind==='video'});
 }
 await writeFile('/tmp/glisser-mots-medias-jeu.json',JSON.stringify(mediaReports,null,2));
 console.log('Audio/vidéo lus ; correction immédiate et absence des commandes désactivées vérifiées.');
}finally{await browser?.close();server.kill('SIGTERM');}
