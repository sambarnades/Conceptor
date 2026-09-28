/** Cartes mémoire : saisie obligatoire, casse, indices, navigation et résultats. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8190','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8190/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['saisie','libre']) {
  currentArchive=archiveRecette('sucrerie-flashcards-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8190/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const current=()=>frame.locator('.h5p-card.h5p-current');
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await frame.locator('input[type="text"]').first().waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelector('.h5p-iframe').contentDocument.images).some(im=>im.naturalWidth===120));
  for(let n=0;n<2;n++) {
   const card=current();const input=card.locator('input[type="text"]');
   const cardText=await card.innerText();
   if(kind==='saisie' && n===0){await card.locator('.joubel-tip-container').click();if(!(await frame.locator('body').innerText()).includes('Pense à la Seine. RELU'))throw Error('Indice absent');await card.locator('.joubel-tip-container').click();}
   if(n===0) {
    await card.getByText('Vérifier',{exact:true}).click();
    if(kind==='saisie') {
     if(await input.isDisabled())throw Error('Solution révélée sans saisie');
     await input.fill('paris');await card.getByText('Vérifier',{exact:true}).click();
    } else if(!await input.isDisabled())throw Error('Solution libre non disponible');
   } else {
    await input.fill(cardText.includes('France')?'paris':'rome');await card.getByText('Vérifier',{exact:true}).click();
   }
   if(n===0)await frame.getByRole('button',{name:'Suivant',exact:true}).click();
  }
  await button('Montrer les résultats').click();
  const score=kind==='saisie'?'0/2':'1/2';
  await page.waitForFunction(needle=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(needle),kind==='saisie'?'0 réponses correctes':'1 réponses correctes');
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/flashcards-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score,texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 await writeFile('/tmp/flashcards-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
