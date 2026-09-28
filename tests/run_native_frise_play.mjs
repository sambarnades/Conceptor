/** Frise : navigation réelle, hauteur, image de fond et vignette. */
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
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1100,height:1200}});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let archive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(archive),contentType:'application/octet-stream'}));
 for(const kind of ['compacte','haute']) {
  archive=archiveRecette('sucrerie-frise-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');await frame.locator('.vco-slider').waitFor();
  const height=await frame.locator('.h5p-timeline').evaluate(el=>el.getBoundingClientRect().height);
  if(Math.abs(height-(kind==='compacte'?550:800))>2)throw Error('Hauteur ignorée : '+height);
  await page.waitForFunction(()=>document.querySelector('.h5p-iframe')?.contentDocument?.querySelector('.vco-slider')?.style.backgroundImage.startsWith('url('));
  const background=await frame.locator('.vco-slider').evaluate(async el=>{const url=el.style.backgroundImage.slice(5,-2);const img=new Image();img.src=url;await img.decode();return img.naturalWidth;});
  if(background!==800)throw Error('Fond non chargé');
  const next=frame.locator('.nav-next');await next.click();await page.waitForTimeout(1100);
  await page.screenshot({path:'/tmp/frise-'+kind+'-jeu.png',fullPage:true});
  const texte=await frame.locator('body').innerText();if(!texte.includes('Lire et comprendre RELU'))throw Error('Événement absent');
  await next.click();await page.waitForTimeout(1100);await next.click();await page.waitForTimeout(1100);
  const lastVisible=await frame.locator('.vco-slider').evaluate(el=>{const area=el.getBoundingClientRect();return [...el.querySelectorAll('h1,h2,h3')].some(h=>{const r=h.getBoundingClientRect();return h.textContent.trim()==='Rédiger' && r.width>0 && r.left>=area.left && r.right<=area.right;});});
  if(!lastVisible)throw Error('Dernier événement hors écran');
  await frame.locator('.nav-previous').click();
  reports.push({kind,height,texte});console.log(kind+' : hauteur '+height+', fond et navigation vérifiés');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/frise-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
