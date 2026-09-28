/** Dictée : lecture, erreurs, variantes, reprise et synthèse réelle. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8192','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8192/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['classique','variantes']) {
  currentArchive=archiveRecette('sucrerie-dictee-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8192/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  const input=frame.locator('textarea').first();await input.waitFor();
  const play=frame.locator('.h5p-audio-minimal-button').first();
  await play.evaluate(el=>{const win=el.ownerDocument.defaultView,original=win.HTMLMediaElement.prototype.play;win.HTMLMediaElement.prototype.play=function(...args){this.muted=true;win.__audioLu=this;return original.apply(this,args);};});
  await play.click();await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentWindow?.__audioLu?.currentTime>0.05);
  const duration=await play.evaluate(el=>el.ownerDocument.defaultView.__audioLu.duration);
  if(!(duration>1))throw Error('Audio non lu');
  let erreur;
  if(kind==='classique') {
   await input.fill('Madrid');await button('Vérifier').click();
   await button('Voir la solution').click();erreur=await frame.locator('body').innerText();
   await button('Recommencer').click();
  }
  await input.fill(kind==='classique'?'Paris est la capitale de la France':'Paris est la capitale de la République');
  await button('Vérifier').click();
  await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes('7/7'));
  const score='7/7';
  const text=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/dictee-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,score,duration,erreur,texte:text});console.log(kind+' : réponses, retours et comportement natif vérifiés');
 }
 for(const cas of [
  {kind:'separateur',text:'Paris _est _la _capitale _de _la _France',answer:'Paris est la capitale de la France',textual:{wordSeparator:'_',overrideRTL:'off',autosplit:false},score:'7/7'},
  {kind:'segmentation-cjk',text:'北京',answer:'北京',textual:{wordSeparator:' ',overrideRTL:'on',autosplit:true},score:'2/2'}
 ]) {
  await page.goto('http://127.0.0.1:8192/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.addScriptTag({url:'http://127.0.0.1:8192/js/vendor/jszip/3.10.2/jszip.min.js'});
  await page.evaluate(async cas=>{
   const zip=await window.JSZip.loadAsync(await fetch('/sonde-locale.h5p').then(r=>r.arrayBuffer()));
   const content=JSON.parse(await zip.file('content/content.json').async('string'));
   content.sentences[0].text=cas.text;content.behaviour.scoring.ignorePunctuation=false;Object.assign(content.behaviour.textual,cas.textual);
   zip.file('content/content.json',JSON.stringify(content));
   await window.__monterArchive(await zip.generateAsync({type:'blob'}));
  },cas);
  const frame=page.frameLocator('.h5p-iframe'),input=frame.locator('textarea').first();await input.waitFor();
  await input.fill(cas.answer);await frame.getByText('Vérifier',{exact:true}).first().click();
  await page.waitForFunction(score=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(score),cas.score,{timeout:5000}).catch(async e=>{throw Error(cas.kind+': '+await frame.locator('body').innerText());});
  const direction=await input.evaluate(el=>getComputedStyle(el).direction);
  const rtl=await input.evaluate(el=>el.ownerDocument.defaultView.H5P.instances[0].sentences[0].containsRTL);
  if(rtl!==(cas.textual.overrideRTL==='on'))throw Error('Sens RTL non appliqué aux solutions');
  reports.push({kind:cas.kind,score:cas.score,direction,rtl,note:'Sonde technique de segmentation ; audio français conservé, non joué.'});
 }
 const tts=await page.evaluate(async()=>{
  const blob=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/dictee/tts/audio-0.mp3').then(r=>r.blob());
  const audio=new Audio(URL.createObjectURL(blob));audio.muted=true;await audio.play();
  await new Promise(resolve=>audio.addEventListener('timeupdate',resolve,{once:true}));
  const result={duration:audio.duration,currentTime:audio.currentTime};audio.pause();return result;
 });
 if(!(tts.duration>1 && tts.currentTime>0))throw Error('Synthèse réelle non lisible');
 reports.push({kind:'synthese-reelle',...tts});
 await writeFile('/tmp/dictee-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
