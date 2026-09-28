/** Mots croisés : indices, mot-solution, conservation des réponses et deux barèmes. */
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
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1100,height:1000}});page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['fixes','image','audio','video']) {
  currentArchive=archiveRecette('sucrerie-mots-croises-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe'),input=clue=>frame.locator('.h5p-crossword-input-fields-group-input').and(frame.getByRole('textbox',{name:new RegExp(clue)}));
  await input('France').waitFor();
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  const mediasLus=[];
  const extras=frame.locator('.h5p-crossword-input-fields-group-extra-clue');
  for(let extra=0;extra<await extras.count();extra++){
  await extras.nth(extra).click();
  const overlay=frame.getByRole('dialog');await overlay.waitFor({state:'visible'});
  if(!((await overlay.innerText()).includes('RELU') || await overlay.locator('img,audio,video').count()))throw Error('Indice absent');
  if(await overlay.locator('img').count()){await page.waitForFunction(()=>[...document.querySelector('.h5p-iframe').contentDocument.querySelectorAll('[role=dialog] img')].some(img=>img.naturalWidth===800));}
  if(await overlay.locator('audio,video').count()){
   const played=await overlay.locator('audio,video').first().evaluate(async el=>{el.muted=true;await el.play();await new Promise(r=>el.addEventListener('timeupdate',r,{once:true}));const result={duration:el.duration,currentTime:el.currentTime};el.pause();return result;});
   mediasLus.push(played);
   if(!(played.duration>0 && played.currentTime>0))throw Error('Indice média non lu');
  }
  await overlay.getByRole('button').first().click();
  }
  const fill=async(clue,value)=>{await input(clue).fill(value);await input(clue).press('End');await page.waitForTimeout(60);};
  await fill('France','PARIS');await button('Vérifier').click();await page.waitForTimeout(350);
  const partiel=await frame.locator('body').innerText();
  await button('Recommencer').click();await page.waitForTimeout(150);
  const retained=await input('France').inputValue();if(!retained.includes('PARIS'))throw Error('Réponse correcte non conservée');
  await button('Vérifier').click();await button('Afficher la solution').click();await button('Recommencer').click();await page.waitForTimeout(150);
  await fill('France','PARIS');await fill('Italie','ROME');if(await button('Vérifier').isVisible())await button('Vérifier').click();
  const score=kind==='fixes'?'2/2':'8/8';
  await page.waitForFunction(score=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(score),score,{timeout:7000});
  const texte=await frame.locator('body').innerText();
  const solution=await frame.locator('.h5p-crossword-solution-word').innerText();
  if(solution.replace(/[\s0-9]/g,'')!=='ROME')throw Error('Mot-solution non rempli : '+solution);
  await page.screenshot({path:'/tmp/mots-croises-'+kind+'-jeu.png',fullPage:true});reports.push({kind,score,partiel,retained,solution,mediasLus,texte});console.log(kind+' : indice, reprise et '+score);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/mots-croises-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
