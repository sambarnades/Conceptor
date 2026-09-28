/** Vidéo native : erreur, reprise, sources, sous-titres, signet, résumé et soumission. */
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
 for(const kind of ['affiche','bouton']){
  archive=archiveRecette('sucrerie-video-native-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');await frame.locator('.h5p-interactive-video').waitFor();
  const visible=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  await frame.getByRole('button',{name:'Lecture (k)',exact:true}).click();
  if(kind==='bouton')await visible('Capitale RELU').click();
  await visible('Rome').click();await visible('Vérifier').click();
  if(kind==='affiche'){await frame.locator('.h5p-theme-retry:visible').click();await visible('Paris').click();await visible('Vérifier').click();}
  else if(await frame.locator('.h5p-theme-retry:visible').count())throw Error('Reprise désactivée affichée');
  await frame.getByRole('button',{name:'Continuer',exact:true}).click();
  const pause=frame.getByRole('button',{name:'Pause (k)',exact:true});if(await pause.count())await pause.click();
  await frame.getByRole('button',{name:'Qualité de la vidéo',exact:true}).click();await visible('Source B').click();
  await frame.getByRole('button',{name:'Signets',exact:true}).click();await visible('Repère RELU').click();
  const player=frame.locator('video');
  const media=await player.evaluate(el=>({time:el.currentTime,tracks:[...el.textTracks].map(t=>({mode:t.mode,cue:t.cues?.[0]?.text}))}));
  if(media.time<1.9||!media.tracks.some(t=>t.mode==='showing'&&t.cue==='Capitales RELU'))throw Error('Signet ou sous-titres absents '+JSON.stringify(media));
  await page.screenshot({path:'/tmp/video-native-'+kind+'-sous-titres.png',fullPage:true});
  const play=frame.getByRole('button',{name:'Lecture (k)',exact:true});if(await play.count())await play.click();
  await frame.locator('.h5p-summary-interaction[role="button"]').click();
  await visible('Paris est en France.').click();await page.waitForTimeout(300);
  const state=await frame.locator('body').evaluate(el=>{const i=el.ownerDocument.defaultView.H5P.instances[0];return {score:i.getScore(),max:i.getMaxScore(),quality:i.video.getQuality()};});
  if(state.score!==(kind==='affiche'?2:1)||state.max!==2||state.quality!=='q2')throw Error('Score ou qualité incorrect '+JSON.stringify(state));
  await frame.getByRole('button',{name:'Close',exact:true}).click();
  await page.waitForTimeout(500);if(await play.count())await play.click();
  await page.waitForTimeout(2800);
  await frame.getByRole('button',{name:'Soumettre les réponses',exact:true}).click();
  await visible('Vos réponses ont été soumises !').waitFor();
  reports.push({kind,...state,media,reprise:kind==='affiche',soumission:true});console.log(JSON.stringify(reports.at(-1)));
  await page.screenshot({path:'/tmp/video-native-'+kind+'-jeu.png',fullPage:true});
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/video-native-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
