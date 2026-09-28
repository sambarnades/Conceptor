/** Trouver la zone : image native aplatie, formes, feedback et libellés. */
export async function verifierTrouverPlusieursZones() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {await loadTranslations(lang);for(const nombreElements of ['', '3'])check(buildActivityPrompt('prompt_find_multiple_hotspots',{nombreElements,quoi:'Trois zones',isAdvanced:!!nombreElements}).includes('questionTitle'),lang+' : prompt incomplet');}await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/FindMultipleHotspots/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const source=await window.JSZip.loadAsync(await fetch(folder+'24-FindMultipleHotspots.h5p').then(r=>r.arrayBuffer()));
 const file=native.imageMultipleHotspotQuestion.backgroundImageSettings.backgroundImage,blob=new Blob([await source.file('content/'+file.path).async('uint8array')],{type:file.mime});
 const dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});const media=new Map([[file.path,blob]]);
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'FindMultipleHotspots',titleKey:'h5p_find_multiple_hotspots_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['complet','plafond']) {
   const c=structuredClone(native);c.title='Trouver plusieurs zones RELU';c.imageMultipleHotspotQuestion.hotspotSettings.taskDescription=kind==='complet'?'Clique sur les zones 1 et 3.':'Clique sur une zone bleue ou orange.';c.imageMultipleHotspotQuestion.backgroundImageSettings.backgroundImage.dataURL=dataURL;
   await open(c);section('general');set('questionTitle','Titre interne RELU');set('numberHotspots',kind==='complet'?2:1);set('alreadySelectedFeedback','Zone déjà trouvée. RELU');set('noneSelectedFeedback','Clique dans un rectangle. RELU');
   section('hotspots');host.querySelector('[data-section-id="hotspots"] .json-editor__nav-subitem[data-index="1"]').click();set('hotspots.1.figure',kind==='complet'?'rectangle':'circle');set('hotspots.1.feedbackText','Le rectangle violet est incorrect. RELU');set('hotspots.1.label','Violet RELU');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'FindMultipleHotspots',title:'Trouver plusieurs zones — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string')),hs=content.imageMultipleHotspotQuestion.hotspotSettings;
   check(content.imageMultipleHotspotQuestion.backgroundImageSettings.backgroundImage.path && zip.file('content/'+file.path),'Image absente ou mal imbriquée');
   check(hs.numberHotspots===(kind==='complet'?2:1) && content.imageMultipleHotspotQuestion.backgroundImageSettings.questionTitle==='Titre interne RELU' && hs.alreadySelectedFeedback==='Zone déjà trouvée. RELU','Options perdues');
   check(hs.hotspot[1].computedSettings.figure===(kind==='complet'?'rectangle':'circle') && hs.hotspot[1].userSettings.feedbackText.includes('RELU'),'Zone perdue');
   saved.data._backgroundImage=dataURL;
   cases.push({key:'FindMultipleHotspots',id:'trouver-plusieurs-zones-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','violet','Correction']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
