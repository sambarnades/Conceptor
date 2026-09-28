/** Mots mêlés : sélection réelle sur canvas, erreurs, solutions et reprise. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {archiveRecette} from './archives-recette.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8193','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:8193/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1050,height:850}});page.setDefaultTimeout(12000);
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 let currentArchive;const reports=[];
 await page.route('**/sonde-locale.h5p',async r=>r.fulfill({body:await readFile(currentArchive),contentType:'application/octet-stream'}));
 for(const kind of ['visible','cache']) {
  currentArchive=archiveRecette('sucrerie-mots-meles-'+kind+'.h5p');
  await page.goto('http://127.0.0.1:8193/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
  await page.evaluate(async()=>window.__monterArchive(await(await fetch('/sonde-locale.h5p')).blob()));
  const frame=page.frameLocator('.h5p-iframe'),canvas=frame.locator('#drawing-canvas');await canvas.waitFor();
  if(await frame.getByText('Villes RELU',{exact:true}).isVisible()!==(kind==='visible'))throw Error('Visibilité du vocabulaire incorrecte');
  // Aucun mot sélectionné : résultat nul, solution, puis nouvelle grille.
  await frame.getByRole('button',{name:'Vérifier',exact:true}).click();
  let text=await frame.locator('body').innerText();if(!text.includes('0 sur 4'))throw Error(text);
  await frame.getByRole('button',{name:'Afficher la solution',exact:true}).click();
  await frame.getByRole('button',{name:'Recommencer',exact:true}).click();
  const grid=await canvas.evaluate(el=>el.ownerDocument.defaultView.H5P.instances[0].grid.wordGrid);
  const dirs=kind==='visible'?[[1,0]]:[[0,-1]];
  for(const word of ['PARIS','ROME','ΑΘΗΝΑ','ÉTÉ']) {
   let found;
   for(let y=0;y<grid.length;y++)for(let x=0;x<grid[0].length;x++)for(const [dx,dy] of dirs) {
    if([...word].every((letter,i)=>grid[y+dy*i]?.[x+dx*i]?.toUpperCase()===letter))found={x,y,dx,dy};
   }
   if(!found)throw Error('Mot introuvable '+word);
   const box=await canvas.boundingBox(),size=box.width/grid[0].length;
   const x=box.x+(found.x+.5)*size,y=box.y+(found.y+.5)*size;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+found.dx*(word.length-1)*size,y+found.dy*(word.length-1)*size,{steps:word.length*3});await page.mouse.up();
  }
  if(await frame.getByRole('button',{name:'Vérifier',exact:true}).isVisible())await frame.getByRole('button',{name:'Vérifier',exact:true}).click();text=await frame.locator('body').innerText();
  if(!text.includes('4 sur 4')){await page.screenshot({path:'/tmp/mots-meles-echec.png',fullPage:true});throw Error(text);}
  await page.screenshot({path:'/tmp/mots-meles-'+kind+'-jeu.png',fullPage:true});
  reports.push({kind,pointage:'centre des cases',score:'4/4',erreur:'0/4',solution:true,reprise:true,grid,texte:text});console.log(kind+' : 0/4, solution, reprise et 4/4 vérifiés');
 }
 await writeFile('/tmp/mots-meles-jeu.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
