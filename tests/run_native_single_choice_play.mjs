/** Série de choix uniques : passage manuel/automatique, erreurs et résultats. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8189','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8189/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['manuel','automatique']) {
  currentArchive=archiveRecette('sucrerie-choix-uniques-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8189/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const answer=(name,index=0)=>frame.locator('.h5p-sc-slide.h5p-sc').nth(index).getByRole('radio').filter({hasText:name}).first();
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await answer(kind==='manuel'?'Madrid':'Paris').press('Space');
  if(kind==='manuel')await frame.locator('.h5p-theme-next').click();
  await frame.locator('.h5p-sc-current-slide').getByText('Capitale de l’Italie ?', {exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.querySelectorAll('.h5p-sc-current-slide').length===1);
  await answer('Rome',1).press('Space');
  if(kind==='manuel')await button('Montrer les résultats').click();
  const score=kind==='manuel'?'1/2':'2/2';
  await page.waitForFunction(score=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(score),kind==='manuel'?'1 bonnes réponses sur 2':'2 bonnes réponses sur 2');
  if(kind==='automatique' && await button('Recommencer').isVisible().catch(()=>false))throw Error('Reprise désactivée présente');
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/choix-uniques-'+kind+'-jeu.png',fullPage:true});
  if(kind==='manuel'){await button('Recommencer').click();await frame.locator('.h5p-sc-slide.h5p-sc').first().locator('.h5p-sc-question').waitFor();}
  reports.push({kind,score,texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 await writeFile('/tmp/choix-uniques-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
