/** Frise : hauteur native, zoom, langue, périodes, vignette et image de fond. */
export async function verifierFrise() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {await loadTranslations(lang);for(const nombreElements of ['', '3'])check(buildActivityPrompt('prompt_timeline',{nombreElements,quoi:'Lecture',isAdvanced:!!nombreElements}).includes('timeline.height'),lang+' : prompt incomplet');}
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Timeline/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const source=await window.JSZip.loadAsync(await fetch(folder+'21-Timeline.h5p').then(r=>r.arrayBuffer()));
 const file=native.timeline.backgroundImage,blob=new Blob([await source.file('content/'+file.path).async('uint8array')],{type:file.mime});
 const media=new Map([[file.path,blob]]);
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Timeline',titleKey:'h5p_timeline_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  for(const kind of ['compacte','haute']) {
   const c=structuredClone(native);c.timeline.date[0].endDate='2026,09,12';c.timeline.date[0].asset={thumbnail:structuredClone(file),caption:'Trois étapes',credit:'Image de recette CC0'};
   c.timeline.era=[{startDate:'2026,09,11',endDate:'2026,09,13',headline:'Séance RELU',text:'De la lecture à la synthèse.',tag:'Lecture'}];
   await open(c);section('events');set('timeline.date.0.headline','Lire et comprendre RELU');set('timeline.date.0.tag','Lecture');
   section('settings');set('timeline.height',kind==='compacte'?450:750);set('timeline.defaultZoomLevel',kind==='compacte'?-1:2);set('timeline.language',kind==='compacte'?'fr':'en');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'Timeline',title:'Frise — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.timeline.height===(kind==='compacte'?450:750),'Hauteur ignorée');check(content.timeline.date[0].headline.includes('RELU') && content.timeline.date[0].endDate.split(',').map(Number).join(',')==='2026,9,12','Événement perdu : '+JSON.stringify(content.timeline.date[0]));
   check(content.timeline.era[0].tag==='Lecture' && zip.file('content/'+file.path),'Période ou image perdue');
   cases.push({key:'Timeline',id:'frise-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','2026','CC0']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
