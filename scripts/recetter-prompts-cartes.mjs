/** Deux appels IA explicitement autorisés : prompts anonymes, endpoints bas seuls.
 * Aucun RAG, aucune ingestion, aucune statistique. Exécution manuelle uniquement.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {ENDPOINTS} from '../js/core/endpoints.js';
const root=new URL('../tests/sonde-parcours/audit-activites-2026-09-11/',import.meta.url);
const output=new URL('prompts/resultats/',root);await mkdir(output,{recursive:true});
for(const endpoint of [ENDPOINTS.llmSubmit,ENDPOINTS.llmResult]){
 const u=new URL(endpoint);
 if(u.origin!=='https://n8n-caramel.osc-fr1.scalingo.io'||!/^\/webhook\/caramel\/llm\/(submit|result)-bas$/.test(u.pathname))throw Error('Le service de développement bas est requis');
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
for(const [moduleKey,name] of [['DialogCards','dialog_cards'],['Flashcards','flashcards']]){
 const prompt=await readFile(new URL('prompts/'+name+'.md',root),'utf8');
 console.log(moduleKey+' : soumission sur bas');
 const response=await fetch(ENDPOINTS.llmSubmit,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,model:'mistral-small-4-119b',stats:'skip'}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Soumission HTTP '+response.status);const {taskId}=await response.json();if(!taskId)throw Error('Identifiant de tâche absent');
 const started=Date.now();let result;
 while(Date.now()-started<240000){
  await pause(4000);const r=await fetch(ENDPOINTS.llmResult+'?taskId='+encodeURIComponent(taskId),{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Lecture HTTP '+r.status);
  const d=await r.json();if(d.status==='done'){result=d;break;}if(d.status==='error')throw Error('Génération échouée : '+String(d.message||'sans détail'));
 }
 if(!result)throw Error('Délai de génération dépassé');
 const raw=String(result.content).replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,'');
 const data=JSON.parse(raw);await writeFile(new URL(moduleKey+'.json',output),JSON.stringify(data,null,2)+'\n');
 const b=data.behaviour||{};
 if(moduleKey==='DialogCards'){
  if(data.mode!=='repetition'||b.maxProficiency!==3||b.quickProgression!==true||b.disableBackwardsNavigation!==true)throw Error('Réglages de répétition non respectés');
  if(data.dialogs?.length!==3||data.dialogs.some(c=>c.audio?.length))throw Error('Nombre de cartes incorrect ou audio inventé');
 }else{
  for(const k of ['showSolutionsRequiresInput','caseSensitive','randomCards'])if((data[k]??b[k])!==false)throw Error('Réglage non respecté : '+k);
  if(data.cards?.length!==3)throw Error('Nombre de cartes incorrect');
 }
 await writeFile(new URL(moduleKey+'-preuve.json',output),JSON.stringify({date:new Date().toISOString(),service:'bas',modelRequested:'mistral-small-4-119b',modelReturned:result.model||null,seconds:Math.round((Date.now()-started)/1000),cartes:3,reglagesVerifies:true,rag:false,stats:'skip'},null,2)+'\n');
 console.log(moduleKey+' : trois cartes et réglages vérifiés');
}
