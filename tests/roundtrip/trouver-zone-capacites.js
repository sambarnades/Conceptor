/** Trouver la zone : image native aplatie, formes, feedback et libellés. */
export async function verifierTrouverZone() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {await loadTranslations(lang);for(const nombreElements of ['', '3'])check(buildActivityPrompt('prompt_find_the_hotspot',{nombreElements,quoi:'Trois zones',isAdvanced:!!nombreElements}).includes('showFeedbackAsPopup'),lang+' : prompt incomplet');}await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/FindTheHotspot/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const source=await window.JSZip.loadAsync(await fetch(folder+'23-FindTheHotspot.h5p').then(r=>r.arrayBuffer()));
 const file=native.imageHotspotQuestion.backgroundImageSettings,blob=new Blob([await source.file('content/'+file.path).async('uint8array')],{type:file.mime});
 const dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});const media=new Map([[file.path,blob]]);
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'FindTheHotspot',titleKey:'h5p_find_the_hotspot_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['popup','integre']) {
   const c=structuredClone(native);c.title='Trouver la zone RELU';c.imageHotspotQuestion.backgroundImageSettings.dataURL=dataURL;
   await open(c);section('general');set('showFeedbackAsPopup',kind==='popup');set('noneSelectedFeedback','Clique dans un rectangle. RELU');set('_l10n.retryText','Réessayer RELU');
   section('hotspots');host.querySelector('[data-section-id="hotspots"] .json-editor__nav-subitem[data-index="1"]').click();set('hotspots.1.figure',kind==='popup'?'rectangle':'circle');set('hotspots.1.feedbackText','Tu as trouvé le rectangle violet. RELU');set('hotspots.1.label','Violet RELU');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'FindTheHotspot',title:'Trouver la zone — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string')),hs=content.imageHotspotQuestion.hotspotSettings;
   check(content.imageHotspotQuestion.backgroundImageSettings.path && zip.file('content/'+file.path),'Image absente ou mal imbriquée');
   check(hs.showFeedbackAsPopup===(kind==='popup') && hs.l10n.retryText==='Réessayer RELU','Options perdues');
   check(hs.hotspot[1].computedSettings.figure===(kind==='popup'?'rectangle':'circle') && hs.hotspot[1].userSettings.feedbackText.includes('RELU'),'Zone perdue');
   saved.data._backgroundImage=dataURL;
   cases.push({key:'FindTheHotspot',id:'trouver-zone-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','violet','Correction']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
