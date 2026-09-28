/** Texte à trous : indices, confirmations, variantes et correction automatique. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8186','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8186/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['complet','sans-aides']) {
  currentArchive=archiveRecette('sucrerie-marquer-mots-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8186/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');await frame.getByRole('option').first().waitFor();
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await frame.getByRole('option',{name:'Paris',exact:true}).click();
  if(kind==='complet')await frame.getByRole('option',{name:'Lyon',exact:true}).click();
  await button('Vérifier').click();
  if(kind==='complet') {
   await frame.locator('.h5p-question-minus-one-container').waitFor({state:'attached'});
   await button('Afficher la solution').click();await button('Recommencer').click();
   await frame.getByRole('option',{name:'Paris',exact:true}).click();await frame.getByRole('option',{name:'Rome',exact:true}).click();await button('Vérifier').click();
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('2/2'));
  } else {
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('1/2'));
   if(await button('Recommencer').isVisible().catch(()=>false) || await button('Afficher la solution').isVisible().catch(()=>false))throw Error('Commande désactivée visible');
   if(await frame.locator('.h5p-question-plus-one-container').count())throw Error('Points par mot désactivés visibles');
  }
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/marquer-mots-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score:kind==='complet'?'2/2':'1/2',texte:text});console.log(kind+' : sélection et options natives vérifiées');
 }
 await writeFile('/tmp/marquer-mots-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
