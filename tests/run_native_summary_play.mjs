/** Jeu réel du Résumé repaqueté localement après réédition ; aucun service externe. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8183','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8183/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(archiveRecette('sucrerie-resume-capitales.h5p')),contentType:'application/octet-stream'}));
 await page.goto('http://127.0.0.1:8183/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
 await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
 const frame=page.frameLocator('.h5p-iframe');await frame.getByRole('radio').first().waitFor();
 await frame.locator('.joubel-tip-container').click();
 if (!(await frame.locator('body').innerText()).includes('RELU Sucrerie')) throw Error('Indice absent du lecteur');
 await frame.getByRole('radio',{name:'Paris est la capitale de l’Italie.',exact:true}).first().click();
 await frame.locator('.summary-failed').waitFor();
 await frame.getByRole('radio',{name:'Paris est la capitale de la France.',exact:true}).click();
 await frame.getByRole('radio',{name:'Rome est la capitale de l’Italie.',exact:true}).click();
 await frame.locator('.h5p-joubelui-score-bar').waitFor();
 const text=await frame.locator('body').innerText();
 if (!text.includes('1/2') && !text.includes('1 / 2')) throw Error('Score attendu 1/2 : '+text);
 await writeFile('/tmp/resume-jeu.json',JSON.stringify({indice:true,erreur:true,reussite:true,score:'1/2',texte:text},null,2));
 console.log('Résumé : indice affiché, erreur puis deux bonnes réponses, score 1/2.');
 await page.screenshot({path:'/tmp/resume-jeu.png',fullPage:true});
}finally{await browser?.close();server.kill('SIGTERM');}
