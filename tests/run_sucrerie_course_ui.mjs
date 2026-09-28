// Scénario manuel hors CI : tous les services externes sont simulés.
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url));const {chromium}=createRequire(root+'/tests/roundtrip/package.json')('playwright');
const server=spawn('python3',['tests/serveur-statique.py','8169','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:8169/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[],calls=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const url=r.request().url();
  if(/sucrerie-allowed-domains/.test(url))return r.fulfill({json:{domains:[{pattern:'example.test',kind:'exact'}]}});
  if(/sucrerie-profile-lookup/.test(url))return r.fulfill({json:{exists:true}});
  if(/sucrerie-enrich/.test(url)){calls.push(r.request().postDataJSON());return r.fulfill({json:{moderation:'approuve',titre:'Sonde du parcours',description:'Réviser les organes de la fleur',objectifs:'Identifier les organes',tags:['fleur'],systeme_educatif:'francais',discipline_slug:'svt',niveaux:['college-3e'],langue:'fr'}});}
  if(/sucrerie-publish/.test(url)){calls.push(r.request().postDataJSON());return r.fulfill({json:{status:'pending_confirmation',public_id:'test-local',moderation:'approuve',email_masked:'test@example.test'}});}
  return r.abort();
 });
 await page.route('**/tests/course-preview.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="fr"><head><base href="/"><link rel="stylesheet" href="/css/base/style.css"><link rel="stylesheet" href="/css/base/custom.css"><link rel="stylesheet" href="/js/sucrerie-bridge/styles.css"></head><body><button id="origin">Partager</button></body></html>'}));
 await page.goto('http://127.0.0.1:8169/tests/course-preview.html');
 await page.evaluate(async()=>{
  document.querySelector('#origin').focus();
  const blob=await(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/sonde-images-test.mbz')).blob();
  window.sourceBlob=blob;
  await(await import('/js/sucrerie-bridge/ui/course-panel.js')).openCourseDeposit({blob,title:'Sonde du parcours',courseText:'Présentation et consignes de la sonde du parcours.'});
 });
 await page.screenshot({path:'/tmp/caramel-course-depot.png',fullPage:true});
 await page.locator('input[type=email]').fill('test@example.test');
 await page.locator('[data-action=continue]').click();
 await page.locator('[data-action=publish]').waitFor({state:'visible',timeout:60000});
 console.log('Enrichissement',calls);
 await page.screenshot({path:'/tmp/caramel-course-metadonnees.png',fullPage:true});
 await page.locator('input[name=author_display]').fill('Enseignant test');
 await page.locator('input[name=legal_accept]').check();
 await page.locator('[data-action=publish]').click();
 await page.locator('[data-success-title]').waitFor({state:'visible',timeout:15000});
 const payload=calls.find(c=>c.binary_base64);
 console.log('Publication simulée',{format:payload?.content_format,type:payload?.activity_type,bytes:payload?.binary_base64?.length});
 const original=await page.evaluate(async()=>btoa(String.fromCharCode(...new Uint8Array(await window.sourceBlob.arrayBuffer()))));
 if(payload?.binary_base64!==original||payload?.activity_type!=='parcours')throw new Error('Contrat de transfert incorrect');
 console.log('Succès',await page.locator('.sucrerie-bridge-course').innerText());
 await page.locator('.preview-modal__close').click();
 console.log('Fermeture',await page.locator('.sucrerie-bridge-course').count(),await page.evaluate(()=>document.activeElement.id));
 console.log('JS',errors);if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser?.close();server.kill('SIGTERM');}
