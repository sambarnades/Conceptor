/** Quiz Vrai/Faux : formules, erreurs, reprise et correction. */
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
 for(const kind of ['standard','sans-solution']) {
  currentArchive=archiveRecette('sucrerie-quiz-vf-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const button=text=>frame.getByText(text,{exact:true}).and(frame.locator(':visible')).first();
  const play=async allCorrect=>{
   for(let i=0;i<3;i++) {
    const current=frame.locator('.question-container:visible');await current.waitFor();
    await page.waitForFunction(()=>{const m=document.querySelector('.h5p-iframe')?.contentWindow?.MathJax;return !!(m?.Hub || m?.typesetPromise);});
    await current.evaluate(async el=>{const m=el.ownerDocument.defaultView.MathJax;if(m.Hub)await new Promise(resolve=>m.Hub.Queue(resolve));else{await m.startup.promise;await m.typesetPromise([el]);}});
    await current.evaluate(el=>el.ownerDocument.fonts.ready);
    const answers=current.getByRole('radio');
    const index=!allCorrect && i===0?0:[1,0,0][i];
    await answers.nth(index).click();await current.getByText('Vérifier',{exact:true}).click();
    if(i===0)await page.screenshot({path:'/tmp/quiz-vf-'+kind+'-formules.png',fullPage:true});
    if(i<2)await frame.locator('.h5p-theme-next').click();else await button('Terminer').click();
   }
   await button('Recommencer').waitFor();const texte=await frame.locator('body').innerText();
   const score=(allCorrect?3:2)+'/3';
   if(!texte.includes((allCorrect?3:2)+' bonnes réponses sur 3'))throw Error('Score attendu '+score+' : '+texte);
   return {score,texte};
  };
  const erreur=await play(false);await button('Recommencer').click();const reprise=await play(true);
  await page.screenshot({path:'/tmp/quiz-vf-'+kind+'-jeu.png',fullPage:true});
  if(kind==='standard'){await button('Afficher la solution').click();await frame.locator('.question-container:visible').waitFor();}
  else if(await button('Afficher la solution').isVisible())throw Error('Solution désactivée présente');
  reports.push({kind,erreur,reprise,solution:kind==='standard'});console.log(kind+' : erreur 2/3, reprise 3/3, solution '+(kind==='standard'?'disponible':'désactivée'));

 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/quiz-vf-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
