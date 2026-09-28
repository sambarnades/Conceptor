/** Tri : média, déplacement clavier, deux barèmes et reprise. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8194','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8194/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:1100}});page.setDefaultTimeout(12000);const nativeErrors=[];page.on('pageerror',e=>nativeErrors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['positions','transitions']) {
  currentArchive=archiveRecette('sucrerie-tri-paragraphes-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8194/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');const items=frame.locator('.h5p-sort-paragraphs-paragraph');await items.first().waitFor();
  const img=frame.locator('img').first();await img.waitFor();if(await img.evaluate(el=>el.naturalWidth)!==800)throw Error('Image absente');
  const order=async words=>{
   for(let target=0;target<words.length;target++) {
    const texts=await items.locator('.h5p-sort-paragraphs-paragraph-container').allTextContents();
    const at=texts.findIndex((t,i)=>i>=target && t.trim()===words[target]);if(at<0)throw Error(JSON.stringify(texts));
    if(at===target)continue;
    const item=await items.nth(at).elementHandle();await item.press('Space');
    for(let pos=at;pos>target;pos--){
     await page.keyboard.press('ArrowUp');
     for(let n=0;n<100;n++){if(await item.evaluate(el=>[...el.ownerDocument.querySelectorAll('.h5p-sort-paragraphs-paragraph')].indexOf(el))===pos-1)break;await page.waitForTimeout(20);}
    }
    await page.keyboard.press('Space');
   }
  };
  await order(['Fin','Observer','Observer','Début']);await frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first().click();
  const erreur=await frame.locator('body').innerText();
  await frame.getByText('Afficher la solution',{exact:true}).and(frame.locator(':visible')).first().click();
  await page.waitForTimeout(650); // Animation native de solution et focus différé de 550 ms.
  await frame.getByText('Recommencer',{exact:true}).and(frame.locator(':visible')).first().click();
  await page.waitForTimeout(250); // Reprise native : recentrage du focus différé de 100 ms.
  const reprise=!nativeErrors.length;
  if(!reprise)throw Error(nativeErrors.join('\n'));
  await order(['Début','Observer','Observer','Fin']);await frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first().click();
  const score=kind==='positions'?'4/4':'3/3';
  await page.waitForFunction(score=>document.querySelector('.h5p-iframe')?.contentDocument?.body.innerText.includes(score),score,{timeout:7000}).catch(async()=>{throw Error(await frame.locator('body').innerText());});
  const texte=await frame.locator('body').innerText();
  await page.screenshot({path:'/tmp/tri-paragraphes-'+kind+'-jeu.png',fullPage:true});reports.push({kind,score,erreur,reprise,erreursNatives:nativeErrors.splice(0),texte});console.log(kind+' : déplacement clavier et '+score+' ; reprise='+reprise);
 }
 await writeFile('/tmp/tri-paragraphes-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
