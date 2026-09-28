/** Glisser-déposer : vrai déplacement clavier, erreur, score et reprise. */
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
 for(const kind of ['standard','sans-reprise','distracteur']) {
  archive=kind==='distracteur'?archiveRecette('glisser-deposer-distracteur.h5p'):archiveRecette('sucrerie-glisser-deposer-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const drags=frame.locator('.h5p-draggable');await drags.first().waitFor();
  const zones=frame.locator('.h5p-dropzone');
  if(kind==='sans-reprise') {const img=drags.first().locator('img');await img.waitFor();if(!(await img.evaluate(el=>el.naturalWidth>0)))throw Error('Image non chargée');}
  const placer=async wrong=>{
   if(kind==='distracteur') {await drags.nth(wrong?1:0).press('Space');await zones.first().press('Space');return;}
   for(let i=0;i<8;i++) {
    const target=wrong && i===0?1:i<3?0:i<5?1:2;
    await drags.nth(i).press('Space');await zones.nth(target).press('Space');
   }
  };
  await placer(true);await frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first().click();
  await page.waitForTimeout(700);const erreur=await frame.locator('body').innerText();
  if(!erreur.includes(kind==='distracteur'?'0/1':'6/8'))throw Error('Score erreur inattendu : '+erreur);
  if(kind!=='sans-reprise') {
   await frame.getByText('Recommencer',{exact:true}).and(frame.locator(':visible')).first().click();
   await placer(false);await frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first().click();
   await page.waitForTimeout(700);
   if(!(await frame.locator('body').innerText()).includes(kind==='distracteur'?'1/1':'8/8'))throw Error('Réussite absente');
  }else if(await frame.getByText('Recommencer',{exact:true}).and(frame.locator(':visible')).count())throw Error('Reprise encore visible');
  await page.screenshot({path:'/tmp/glisser-deposer-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,erreur,texte:await frame.locator('body').innerText()});console.log(kind+' : score et reprise vérifiés');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/glisser-deposer-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
