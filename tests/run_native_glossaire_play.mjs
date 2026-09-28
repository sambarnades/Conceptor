/** Accordéon : niveaux sémantiques, navigation clavier et définitions. */
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
 for(const kind of ['h2','h4']) {
  currentArchive=archiveRecette('sucrerie-glossaire-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8195/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe');
  const headings=frame.locator('.h5p-panel-button');await headings.first().waitFor();
  if(await headings.count()!==6)throw Error('Panneau absent');
  const tag=await headings.first().evaluate(el=>el.parentElement.tagName.toLowerCase());
  if(tag!==kind)throw Error('Niveau natif incorrect : '+tag);
  await headings.first().focus();await headings.first().press('Enter');
  await frame.getByText('RELU Sucrerie : le roi détient les pouvoirs.',{exact:true}).waitFor({state:'visible'});
  await headings.first().press('Space');
  await frame.getByText('RELU Sucrerie : le roi détient les pouvoirs.',{exact:true}).waitFor({state:'hidden'});
  const definitions=[];
  for(let i=0;i<6;i++){await headings.nth(i).click();await page.waitForTimeout(350);definitions.push(await frame.locator('body').innerText());}
  const texte=definitions.join('\n');
  if(!texte.includes('1791') || !texte.includes('RELU'))throw Error('Définition absente');
  await page.screenshot({path:'/tmp/glossaire-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,tag,panneaux:6,clavier:true,texte});console.log(kind+' : six panneaux, ouverture et fermeture au clavier');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile('/tmp/glossaire-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
