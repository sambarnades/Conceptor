/** Texte à trous : indices, confirmations, variantes et correction automatique. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8185','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8185/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['manuel','automatique']) {
  currentArchive=archiveRecette('sucrerie-texte-trous-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8185/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const inputs=frame.locator('input[type="text"]');await inputs.first().waitFor();
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await frame.locator('.joubel-tip-container').first().click();
  if(!(await frame.locator('body').innerText()).includes('La Seine'))throw Error('Indice absent');
  await frame.locator('.joubel-tip-container').first().click();
  if(kind==='manuel') {
   await inputs.nth(0).fill('Madrid');await inputs.nth(1).fill('Roma');await button('Vérifier').click();
   if(!(await frame.locator('body').innerText()).includes('Capitales relues ?'))throw Error('Dialogue modifié absent');
   await button('Annuler').click();
   if(await inputs.nth(0).isDisabled())throw Error('Annulation de vérification ignorée');
   await button('Vérifier').click();await button('Confirmer la vérification').click();
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('1/2'));
   await button('Afficher la solution').click();
   await button('Recommencer').click();
   if(!(await frame.locator('body').innerText()).includes('Reprendre les capitales ?'))throw Error('Dialogue reprise absent');
   await button('Confirmer la reprise').click();
   await inputs.nth(0).fill('Paris');await inputs.nth(1).fill('Roma');await button('Vérifier').click();await button('Confirmer la vérification').click();
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('2/2'));
   if(!await button('Recommencer').isVisible())throw Error('Reprise après réussite absente');
  } else {
   if(await button('Vérifier').isVisible().catch(()=>false))throw Error('Bouton Vérifier désactivé présent');
   await inputs.nth(0).fill('pariss');await inputs.nth(0).press('Tab');
   await inputs.nth(1).fill('roma');await inputs.nth(1).press('Tab');
   await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('2/2'));
  }
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/texte-trous-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,indice:true,score:'2/2',texte:text});console.log(kind+' : indice, variantes et comportement natif vérifiés');
 }
 await writeFile('/tmp/texte-trous-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
