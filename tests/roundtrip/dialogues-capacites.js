/** Cartes de dialogue : confirmation, médias natifs, sauvegarde et modes. */
export async function verifierDialogues() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/DialogCards.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_dialog_cards',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(prompt.includes('confirmStartingOver') && prompt.includes('maxProficiency'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/DialogCards/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 check(processor.process({...native,next:'Suite RELU'}).next==='Suite RELU','Libellé personnalisé perdu');
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'DialogCards',titleKey:'h5p_dialog_cards_name'},host,data),'Éditeur absent');};
 const cases=[];
 try {
  const retour=await window.JSZip.loadAsync(await fetch(folder+'11-DialogCards.h5p').then(r=>r.arrayBuffer()));
  const media=new Map();
  for(const file of [native.dialogs[0].image,native.dialogs[0].audio[0]]) {
   const blob=new Blob([await retour.file('content/'+file.path).async('uint8array')],{type:file.mime});media.set(file.path,blob);
   file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});
  }
  const ac=new AudioContext();try{const decoded=await ac.decodeAudioData(await media.get(native.dialogs[0].audio[0].path).arrayBuffer());check(decoded.duration>1,'Audio inexploitable');}finally{await ac.close();}
  await open(native);host.querySelector('.json-editor__nav-section[data-section-id="settings"] > button').click();
  const body=host.querySelector('[data-path="confirmStartingOver.body"]');body.value='Toute progression sera perdue. RELU Caramel';body.dispatchEvent(new Event('input',{bubbles:true}));body.dispatchEvent(new Event('change',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);
  const reopened=await saveChanges();check(reopened.data.confirmStartingOver.body.includes('RELU Caramel'),'Confirmation perdue');
  for(const kind of ['normal','repetition']) {
   const c=structuredClone(reopened.data);c.mode=kind;
   Object.assign(c.behaviour,{enableRetry:true,disableBackwardsNavigation:kind==='normal',randomCards:false,maxProficiency:3,quickProgression:true});
   Object.assign(c.confirmStartingOver,{header:'Reprendre les capitales ?',confirmLabel:'Tout recommencer'});
   const pkg=await packageActivity({moduleKey:'DialogCards',title:'Cartes de dialogue — '+kind,content:c,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(zip.file('content/'+content.dialogs[0].image.path) && zip.file('content/'+content.dialogs[0].audio[0].path),'Média absent');
   check(!content.dialogs[1].image,'Image vide conservée');
   check(content.confirmStartingOver.body.includes('RELU Caramel'),'Dialogue perdu dans le paquet');
   cases.push({key:'DialogCards',id:'dialogues-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome','Atelier de test']});
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
