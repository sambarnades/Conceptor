/** Dictée : médias natifs, crédits, réglages linguistiques et sauvegarde sans réseau. */
export async function verifierDictee() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/Dictation.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_dictation',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(['wordSeparator','overrideRTL','autosplit','alternateSolution'].every(k=>prompt.includes(k)),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Dictation/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 native.sentences[0].sample[0].copyright={license:'CC BY',version:'4.0',author:'Atelier de test',title:'Phrase sur Paris'};
 native.sentences[0].sample.push({...native.sentences[0].sample[0]});
 const processed=await processor.process({...native,l10n:{...native.l10n,checkAnswer:'Vérifier RELU'}});
 check(processed.l10n.checkAnswer==='Vérifier RELU','Libellé perdu');
 check(processed.sentences[0].sample.length===2 && processed.sentences[0].sample[0].copyright.author==='Atelier de test','Sources ou crédits perdus');
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Dictation',titleKey:'h5p_dictation_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,'Champ absent : '+path);if(el.type==='checkbox'){if(el.checked!==value)el.click();}else{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  const retour=await window.JSZip.loadAsync(await fetch(folder+'12-Dictation.h5p').then(r=>r.arrayBuffer()));
  const media=new Map();
  for(const file of [...native.sentences[0].sample,...native.sentences[0].sampleAlternative]) {
   const blob=new Blob([await retour.file('content/'+file.path).async('uint8array')],{type:file.mime});media.set(file.path,blob);
   file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});
  }
  await open(native);section('settings');
  set('behaviour.wordSeparator',' ');set('behaviour.overrideRTL','off');set('behaviour.autosplit',true);set('behaviour.alternateSolution','all');set('behaviour.tries','');
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);
  const reopened=await saveChanges();check(reopened.data.behaviour.textual.overrideRTL==='off','Sens perdu');
  check(reopened.data.behaviour.tries===undefined,'Limite vide transformée en zéro');
  check(reopened.data.sentences[0].sample.length===2,'Source alternative perdue à la réouverture');
  for(const kind of ['classique','variantes']) {
   const c=structuredClone(reopened.data);
   c.sentences[0].text=kind==='classique'?'Paris est la capitale de la France.':'Paris est la capitale de la France|République.';
   Object.assign(c.behaviour,{tries:1,triesAlternative:1,playButtonDelay:0,disablePause:true,enableRetry:true,enableSolutionsButton:true});
   Object.assign(c.behaviour.scoring,{ignorePunctuation:true,zeroMistakeMode:kind==='variantes',typoFactor:'50'});
   c.behaviour.feedbackPresentation.alternateSolution='all';
   const pkg=await packageActivity({moduleKey:'Dictation',title:'Dictée — '+kind,content:c,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.sentences[0].sample.length===2 && zip.file('content/'+content.sentences[0].sample[0].path),'Sources absentes du paquet');
   check(content.behaviour.textual.overrideRTL==='off','Réglage linguistique perdu');
   cases.push({key:'Dictation',id:'dictee-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','France','Atelier de test']});
  }
  // Véritable remplacement audio dans le widget : une nouvelle source remplace les alternatives.
  section('sentences');const input=host.querySelector('[data-path="sentences.0.sample"] input[type="file"]');
  const before=host.querySelector('[data-path="sentences.0.sample"] audio')?.src;
  const file=media.values().next().value;const dt=new DataTransfer();dt.items.add(new File([file],'phrase-importee.wav',{type:'audio/wav'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  for(let i=0;i<100 && host.querySelector('[data-path="sentences.0.sample"] audio')?.src===before;i++)await new Promise(r=>setTimeout(r,20));
  const uploaded=await saveChanges();check(uploaded.data.sentences[0].sample.length===1,'Remplacement audio non enregistré');
  return cases;
 } finally {destroyEditor();host.remove();}
}
