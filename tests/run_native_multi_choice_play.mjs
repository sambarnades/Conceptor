/** Choix multiple : indices, confirmations et réponses uniques ou multiples. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8188','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8188/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['multiple','unique']) {
  currentArchive=archiveRecette('sucrerie-choix-multiple-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8188/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const role=kind==='multiple'?'checkbox':'radio';
  await frame.getByRole(role).first().waitFor();
  const answer=name=>frame.getByRole(role).filter({hasText:name});
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await answer('Paris').click();
  if(kind==='multiple') {
   await button('Vérifier').click();
   if(!(await frame.locator('body').innerText()).includes('Choix relus ?'))throw Error('Dialogue modifié absent');
   await button('Annuler').click();await button('Vérifier').click();await button('Confirmer la vérification').click();
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('1/2'));
   await button('Afficher la solution').click();await button('Recommencer').click();
   await button('Confirmer la reprise').click();await answer('Paris').click();await answer('Rome').click();
   await button('Vérifier').click();await button('Confirmer la vérification').click();
  } else {
   if(await button('Vérifier').isVisible().catch(()=>false) || await button('Recommencer').isVisible().catch(()=>false) || await button('Afficher la solution').isVisible().catch(()=>false))throw Error('Commande désactivée visible');
  }
  const score=kind==='multiple'?'2/2':'1/1';
  await page.waitForFunction(score=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(score),score);
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/choix-multiple-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score,texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 // Variante dérivée : le seuil tout-ou-rien doit réellement changer le score.
 currentArchive=archiveRecette('sucrerie-choix-multiple-multiple.h5p');
 await page.goto('http://127.0.0.1:8188/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
 await page.evaluate(async()=>{
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/js/vendor/jszip/3.10.2/jszip.min.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
  const zip=await window.JSZip.loadAsync(await(await fetch('/sonde-locale.h5p')).arrayBuffer());
  const c=JSON.parse(await zip.file('content/content.json').async('string'));
  Object.assign(c.behaviour,{singlePoint:true,passPercentage:100,confirmCheckDialog:false,confirmRetryDialog:false});
  zip.file('content/content.json',JSON.stringify(c));await window.__monterArchive(await zip.generateAsync({type:'blob'}));
 });
 const frame=page.frameLocator('.h5p-iframe');
 const answer=name=>frame.getByRole('checkbox').filter({hasText:name});
 const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
 await answer('Paris').click();await button('Vérifier').click();
 await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('0/1'));
 await button('Recommencer').click();await answer('Paris').click();await answer('Rome').click();await button('Vérifier').click();
 await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('1/1'));
 reports.push({kind:'point-unique-seuil-100',scores:['0/1','1/1'],texte:await frame.locator('body').innerText()});
 console.log('Point unique : seuil 100 %, réponse partielle 0/1 puis complète 1/1');
 await writeFile('/tmp/choix-multiple-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
