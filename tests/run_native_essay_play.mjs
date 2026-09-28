/** Rédaction : saisie, erreurs, variante, solution et remise sans notation en H5P natif local. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8184','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8184/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:950}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['image','audio','video']) {
  currentArchive=archiveRecette('sucrerie-redaction-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8184/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const input=frame.locator('textarea');await input.waitFor();
  if(await input.getAttribute('rows')!=='10' || await input.getAttribute('maxlength')!=='200' || await input.getAttribute('placeholder')!=='Le Soleil...') throw Error('Contraintes de saisie perdues');
  const check=frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first();
  await input.fill('court');await check.click();
  if(!(await frame.locator('body').innerText()).includes('10 caractères'))throw Error('Longueur minimale non vérifiée');
  await input.fill('Le Soleil éclaire la Terre.');await check.click();
  if(kind!=='audio') {
   if(!(await frame.locator('body').innerText()).includes('Pense à l’énergie'))throw Error('Retour absent non affiché');
   if(kind==='image') {
    await frame.getByText('Afficher la solution',{exact:true}).and(frame.locator(':visible')).first().click();
    if(!(await frame.locator('body').innerText()).includes('Le Soleil fournit de l’énergie.'))throw Error('Modèle absent');
    await frame.getByText('Recommencer',{exact:true}).and(frame.locator(':visible')).first().click();
    await input.fill('Cette energie vient du Soleil.');await check.click();
    await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('2/2'),{},{timeout:3000});
    if(!(await frame.locator('body').innerText()).includes('Énergie bien mentionnée. RELU'))throw Error('Retour de variante absent');
   } else if(await frame.getByText('Recommencer',{exact:true}).isVisible().catch(()=>false))throw Error('Reprise désactivée visible');
  } else {
   if(await frame.locator('.h5p-joubelui-score-bar').isVisible().catch(()=>false))throw Error('Score affiché malgré ignoreScoring');
  }
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/redaction-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,minimumVerifie:true,rows:10,maxlength:200,texte:text});
  console.log(kind+' : saisie et comportement natif vérifiés');
 }
 await writeFile('/tmp/redaction-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
