/** Trouver la zone : hors zone, erreur, reprise, réussite ; popup et feedback intégré. */
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
 for(const kind of ['manuel','automatique']){
  archive=archiveRecette('sucrerie-livre-natif-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');await frame.locator('.h5p-interactive-book').waitFor();
  const visible=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  const img=frame.locator('.h5p-image img').first();if(!await img.evaluate(el=>el.naturalWidth>0))throw Error('Image absente');
  await visible('Paris est en Italie.').click();await visible('Paris est en France.').click();
  const mark=frame.getByRole('checkbox');
  if(kind==='manuel')await mark.check();else if(await mark.count())throw Error('Validation manuelle présente en mode automatique');
  await frame.getByRole('button',{name:'Page suivante',exact:true}).first().click();
  await visible('Vrai').click();
  await frame.locator('video').evaluate(async el=>{await el.play();await new Promise(resolve=>{if(el.currentTime>0)return resolve();el.addEventListener('timeupdate',resolve,{once:true});});el.pause();});
  const captions=await frame.locator('video').evaluate(async el=>{for(let n=0;n<100&&!el.textTracks[0]?.cues?.length;n++)await new Promise(r=>setTimeout(r,20));const track=el.textTracks[0];return {label:track?.label,mode:track?.mode,cue:track?.cues?.[0]?.text};});if(captions.cue!=='Drapeau RELU'||captions.mode!=='showing')throw Error('Sous-titres absents '+JSON.stringify(captions));
  await page.screenshot({path:'/tmp/livre-natif-'+kind+'-sous-titres.png',fullPage:true});
  if(kind==='manuel')await mark.check();
  await frame.getByRole('button',{name:'Page suivante',exact:true}).first().click();
  await page.waitForTimeout(700);
  await visible('1/2').waitFor();
  if(!(await frame.locator('body').innerText()).includes('100%'))throw Error('Progression incomplète');
  let reprise=false;
  if(kind==='manuel'){
   await frame.getByRole('button',{name:'Recommencer',exact:true}).and(frame.locator(':visible')).click();
   await visible('Paris est en France.').click();await mark.check();
   await frame.getByRole('button',{name:'Page suivante',exact:true}).first().click();await visible('Vrai').click();await mark.check();
   await frame.getByRole('button',{name:'Page suivante',exact:true}).first().click();await visible('2/2').waitFor();reprise=true;
  }else if(await frame.getByRole('button',{name:'Recommencer',exact:true}).and(frame.locator(':visible')).count())throw Error('Reprise interdite pourtant affichée');
  reports.push({kind,initial:'1/2',reprise,final:reprise?'2/2':'1/2',progression:'100%',image:true,video:true,captions});console.log(JSON.stringify(reports.at(-1)));
  await page.screenshot({path:'/tmp/livre-natif-'+kind+'-jeu.png',fullPage:true});
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/livre-natif-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
