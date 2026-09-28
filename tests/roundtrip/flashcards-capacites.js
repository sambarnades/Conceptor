/** Cartes mémoire : référence native, sauvegarde, options et documents. */
export async function verifierFlashcards() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/Flashcards.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_flashcards',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(['showSolutionsRequiresInput','caseSensitive','randomCards'].every(k=>prompt.includes(k)),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Flashcards/content.json').then(r=>r.json());
 check(processor.process({...native,checkAnswerText:'Vérifier RELU'}).checkAnswerText==='Vérifier RELU','Libellé personnalisé perdu');
 check(processor.process({...native,cards:[{tip:{tip:'Indice RELU'}}]}).cards[0].tip.includes('Indice RELU'),'Indice natif groupé perdu');
 let rejected=false;try{processor.process({cards:[]});}catch{rejected=true;}check(rejected,'Paquet sans carte accepté');
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Flashcards',titleKey:'h5p_flashcards_name'},host,data),'Éditeur absent');};
 const cases=[];
 try {
  const retour=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Flashcards/10-Flashcards.h5p').then(r=>r.arrayBuffer()));
  const image=new Blob([await retour.file('content/'+native.cards[0].image.path).async('uint8array')],{type:'image/png'});
  const bitmap=await createImageBitmap(image);check(bitmap.width===120 && bitmap.height===80,'Image native non décodable');bitmap.close();
  native.cards[0].image.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(image);});
  native.cards[0].tip={tip:'Pense à la Seine. RELU'};
  await open(native);host.querySelector('.json-editor__nav-section[data-section-id="general"] > button').click();
  const description=host.querySelector('[data-path="description"]');description.textContent='Écris la capitale. RELU Caramel';description.dispatchEvent(new Event('input',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);
  const reopened=await saveChanges();check(reopened.data.description.includes('RELU Caramel'),'Description perdue');
  check(reopened.data.cards[0].tip.includes('Seine'),'Indice perdu');
  for(const kind of ['saisie','libre']) {
   const c=structuredClone(reopened.data);
   Object.assign(c,{showSolutionsRequiresInput:kind==='saisie',caseSensitive:kind==='saisie',randomCards:kind==='libre'});
   const pkg=await packageActivity({moduleKey:'Flashcards',title:'Cartes mémoire — '+kind,content:c,mediaFiles:new Map([[c.cards[0].image.path,image]])});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(zip.file('content/'+content.cards[0].image.path),'Image absente');
   check(content.cards[0].image.copyright.author==='Atelier de test','Crédits perdus');
   check(!content.cards[1].image,'Image vide conservée : le lecteur resterait en chargement');
   check(content.caseSensitive===(kind==='saisie'),'Casse perdue');
   cases.push({key:'Flashcards',id:'flashcards-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome','Atelier de test']});
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
