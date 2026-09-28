/** Quiz mixte : introduction, tirage, navigation, erreur et reprise. */
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
 for(const kind of ['complet','tirage','sans-resultats']) {
  currentArchive=archiveRecette('sucrerie-quiz-mixte-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  if(kind==='complet')await page.waitForFunction(()=>[...document.querySelector('.h5p-iframe').contentDocument.querySelectorAll('img')].some(img=>img.naturalWidth===800));
  await button('Commencer RELU').click();
  const n=kind==='tirage'?2:3;
  const play=async allCorrect=>{
   const questions=[];
   for(let i=0;i<n;i++) {
    const current=frame.locator('.question-container:visible');await current.waitFor();
    const text=await current.innerText();questions.push(text);
    const good=allCorrect || i>0;
    if(text.includes('France'))await current.getByRole('radio').or(current.getByRole('checkbox')).filter({hasText:good?'Paris':'Rome'}).click();
    else if(text.includes('Italie'))await current.getByRole('radio').filter({hasText:good?'Vrai':'Faux'}).click();
    else {await current.locator('input[type=text]').fill(good?'Madrid':'Paris');await current.locator('input[type=text]').press('Tab');}
    if(kind!=='sans-resultats')await current.getByText('Vérifier',{exact:true}).click();
    else if(await current.getByText('Vérifier',{exact:true}).isVisible())throw Error('Vérification individuelle non désactivée');
    if(kind==='tirage' && i>0 && await frame.locator('.h5p-theme-previous').isVisible() && await frame.locator('.h5p-theme-previous').isEnabled())throw Error('Retour arrière autorisé');
    if(i<n-1)await frame.locator('.h5p-theme-next').click();else await button('Terminer').click();
   }
   if(kind==='sans-resultats'){await button('Terminé RELU').waitFor();if(await button('Recommencer').isVisible() || await button('Afficher la solution').isVisible())throw Error('Commande finale désactivée présente');return {texte:await frame.locator('body').innerText(),questions,sansResultats:true};}
   let videoLue=null;
   if(kind==='tirage'){
    const video=frame.locator('video:visible');await video.waitFor();
    videoLue=await video.evaluate(async el=>{el.muted=true;await el.play();await new Promise(r=>el.addEventListener('timeupdate',r,{once:true}));return {duration:el.duration,currentTime:el.currentTime};});
    if(!(videoLue.currentTime>0))throw Error('Vidéo de résultat non lue');
    if(await button('Passer la vidéo').isVisible())await button('Passer la vidéo').click();
   }
   await button('Recommencer').waitFor();
   const texte=await frame.locator('body').innerText();
   const score=(allCorrect?n:n-1)+'/'+n;
   if(!texte.includes((allCorrect?n:n-1)+' bonnes réponses sur '+n))throw Error('Score attendu '+score+' : '+texte);
   return {score,texte,questions,videoLue};
  };
  if(kind==='sans-resultats'){const resultat=await play(true);await page.screenshot({path:'/tmp/quiz-mixte-'+kind+'-jeu.png',fullPage:true});reports.push({kind,...resultat});console.log('sans résultats : validation globale et message final');continue;}
  const erreur=await play(false);await button('Recommencer').click();
  if(await button('Commencer RELU').isVisible())await button('Commencer RELU').click();
  const reussite=await play(true);
  await page.screenshot({path:'/tmp/quiz-mixte-'+kind+'-jeu.png',fullPage:true});
  await button('Afficher la solution').click();await frame.locator('.question-container:visible').waitFor();
  reports.push({kind,erreur,reussite,solution:true});console.log(kind+' : erreur '+erreur.score+', reprise '+reussite.score+', solution');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/quiz-mixte-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
