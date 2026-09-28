/** Relecture du fichier déjà généré, sans nouvel appel IA ; lecteur YouTube autorisé. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = dirname(fileURLToPath(import.meta.url)), root = resolve(base, '../../..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8149, server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
try {
 for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
 browser = await chromium.launch(); const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));
 await page.route('**/*',r=>{
   const u = new URL(r.request().url());
   if (u.hostname==='127.0.0.1' || /(^|\.)(youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com|gstatic\.com|googleapis\.com)$/.test(u.hostname)) return r.continue();
   return r.abort();
 });
 await page.goto(`http://127.0.0.1:${port}/index.html`);await page.waitForSelector('#parcours-button');await page.click('#parcours-button');
 await page.locator('#pc-scenario-fichier').setInputFiles({name:'video.json',mimeType:'application/json',buffer:await readFile(resolve(base,'video-fr/scenario.json'))});
 await page.waitForSelector('.pc-title-input');
 await page.locator('[data-carte="c1"] button').filter({has:page.locator('.fa-eye')}).click();
 await page.waitForSelector('.pc-editeur iframe');
 let etat={};
 for(let i=0;i<40;i++) {
  for(const f of page.frames()) {
   try {
    const r=await f.evaluate(()=>{
      const instance=window.H5P?.instances?.[0];if(!instance?.video)return null;
      const v=instance.video;
      return {temps:v.getCurrentTime?.(),duree:v.getDuration?.(),lecteur:!!v,questions:instance.interactions?.length,
        cadres:[...document.querySelectorAll('iframe')].map(n=>n.src)};
    });
    if(r) {etat=r;if(r.duree>0)await f.evaluate(()=>window.H5P.instances[0].video.play());}
   }catch{}
  }
  if(etat.temps>1)break;
  await page.waitForTimeout(500);
 }
 await page.screenshot({path:resolve(base,'video-fr/lecteur-reseau.png'),fullPage:true});
 await writeFile(resolve(base,'video-fr/lecteur.json'),JSON.stringify({etat,erreurs},null,2));console.log(JSON.stringify({etat,erreurs}));
} finally {await browser?.close();server.kill('SIGTERM');}
