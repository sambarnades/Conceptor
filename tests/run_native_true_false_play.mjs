/** Texte à trous : indices, confirmations, variantes et correction automatique. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8187','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8187/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['manuel','automatique']) {
  currentArchive=archiveRecette('sucrerie-vrai-faux-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8187/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');await frame.getByRole('radio').first().waitFor();
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await frame.getByRole('radio').filter({hasText:'Faux'}).click();
  if(kind==='manuel') {
   await button('Vérifier').click();
   if(!(await frame.locator('body').innerText()).includes('Madrid relu ?'))throw Error('Dialogue modifié absent');
   await button('Annuler').click();
   await button('Vérifier').click();await button('Confirmer la vérification').click();
   if(!(await frame.locator('body').innerText()).includes('RELU Caramel'))throw Error('Retour incorrect absent');
   await button('Afficher la solution').click();await button('Recommencer').click();
   if(!(await frame.locator('body').innerText()).includes('Reprendre Madrid ?'))throw Error('Dialogue reprise absent');
   await button('Confirmer la reprise').click();await frame.getByRole('radio').filter({hasText:'Vrai'}).click();
   await button('Vérifier').click();await button('Confirmer la vérification').click();
  } else {
   if(await button('Vérifier').isVisible().catch(()=>false) || await button('Recommencer').isVisible().catch(()=>false) || await button('Afficher la solution').isVisible().catch(()=>false))throw Error('Commande désactivée visible');
   if(!(await frame.locator('body').innerText()).includes('Rome est la capitale italienne'))throw Error('Retour automatique absent');
  }
  await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('1/1'));
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/vrai-faux-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score:'1/1',texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 await writeFile('/tmp/vrai-faux-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
