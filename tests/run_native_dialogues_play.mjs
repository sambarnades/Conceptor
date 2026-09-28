/** Cartes de dialogue : audio, recto/verso, répétition et confirmation. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8191','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8191/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['normal','repetition']) {
  currentArchive=archiveRecette('sucrerie-dialogues-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8191/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const button=text=>frame.getByRole('button',{name:text,exact:true}).and(frame.locator(':visible')).first();
  await button('Retourner').waitFor();
  let duration=null;const manches=[];
  if(kind==='normal') {
  const audio=frame.locator('.h5p-audio-minimal-button').first();await audio.waitFor();
  await audio.evaluate(el=>{const win=el.ownerDocument.defaultView,original=win.HTMLMediaElement.prototype.play;win.HTMLMediaElement.prototype.play=function(...args){this.muted=true;win.__audioLu=this;return original.apply(this,args);};});
  await audio.click();await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentWindow?.__audioLu?.currentTime>0.05);
  duration=await audio.evaluate(el=>el.ownerDocument.defaultView.__audioLu.duration);
  if(!(duration>1))throw Error('Audio non lu');
  }
  if(kind==='normal') {
   await button('Retourner').press('Enter');await button('Suivant').click();
   await frame.getByText('Italie',{exact:true}).and(frame.locator(':visible')).waitFor();
   if(await button('Précédent').isVisible().catch(()=>false))throw Error('Retour arrière interdit encore présent');
   await button('Retourner').press('Enter');
  } else {
   await frame.locator('.h5p-dialogcards-answer-button.incorrect:visible').press('Enter');
   await frame.getByRole('group',{name:/Carte 2 sur/}).locator('.h5p-dialogcards-answer-button.correct').press('Enter');
   await frame.locator('.h5p-dialogcards-show-summary:visible').press('Enter');
   const premiereManche=await frame.locator('body').innerText();manches.push(premiereManche);
   if(!premiereManche.includes('Manches terminées :') || !premiereManche.includes('Passer à la manche 2'))throw Error('Progression absente');
   await button('Passer à la manche 2').click();
   await frame.getByText('Manche 2',{exact:true}).and(frame.locator(':visible')).waitFor();
   await frame.getByRole('group',{name:/Carte 1 sur/}).locator('.h5p-dialogcards-answer-button.correct').press('Enter');
   await frame.getByRole('group',{name:/Carte 2 sur/}).locator('.h5p-dialogcards-answer-button.correct').press('Enter');
   await frame.locator('.h5p-dialogcards-show-summary:visible').press('Enter');

   manches.push(await frame.locator('body').innerText());
   await button('Recommencer').click();
   await button('Annuler').click();await button('Recommencer').click();
   if(!(await frame.locator('body').innerText()).includes('Reprendre RELU Sucrerie ?'))throw Error('Confirmation personnalisée absente');
   await button('Tout recommencer').click();await button('Retourner').waitFor();
  }
  const score='navigation et audio';
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/dialogues-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score,duration,manches,texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 await writeFile('/tmp/dialogues-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
