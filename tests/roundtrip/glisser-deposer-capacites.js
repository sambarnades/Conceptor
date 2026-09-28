/** Réexport Éléa : géométrie, identité, indices et réglages du glisser-déposer. */
export async function verifierGlisserDeposer() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {await loadTranslations(lang);for(const nombreElements of ['', '8'])check(buildActivityPrompt('prompt_drag_and_drop',{nombreElements,quoi:'Verbes',isAdvanced:!!nombreElements}).includes('tipsAndFeedback'),lang+' : prompt incomplet');}
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/DragAndDrop/content.json').then(r=>r.json());
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/SortParagraphs/';
 const imageSource=await fetch(folder+'content.json').then(r=>r.json());
 const imageZip=await window.JSZip.loadAsync(await fetch(folder+'14-SortParagraphs.h5p').then(r=>r.arrayBuffer()));
 const file=imageSource.media.type.params.file, blob=new Blob([await imageZip.file('content/'+file.path).async('uint8array')],{type:file.mime});
 file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});
 const media=new Map([[file.path,blob]]);
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'DragAndDrop',titleKey:'h5p_drag_and_drop_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  await open({title:'Une zone et un distracteur',dropZones:[{label:'Verbes',correctElements:[0]}],elements:[{text:'marcher'},{text:'table'}]});
  const boundary=await saveChanges();check(boundary && boundary.data.dropZones[0].correctElements.length===1,'Une zone ou distracteur refusé');
  const boundaryPkg=await packageActivity({moduleKey:'DragAndDrop',content:boundary.data});
  cases.push({key:'DragAndDrop',id:'glisser-deposer-distracteur',data:boundary.data,paquet:Array.from(boundaryPkg.bytes),mediaOnly:true,required:[]});
  for(const kind of ['standard','sans-reprise']) {
   const c=structuredClone(native);c.title='Classez les verbes RELU';
   if(kind==='sans-reprise') {
    const e=c.question.task.elements[0];e.type.library='H5P.Image 1.1';e.type.params={file:structuredClone(file),alt:'marcher',decorative:false};
   }
   await open(c);section('dropZones');set('dropZones.0._native.tipsAndFeedback.tip','Cherchez la terminaison de l’infinitif. RELU');set('dropZones.0._native.tipsAndFeedback.feedbackOnCorrect','Ces verbes se terminent en -er. RELU');
   section('settings');set('behaviour.enableRetry',kind==='standard');set('behaviour.dropZoneHighlighting','always');set('behaviour.autoAlignSpacing',4);set('behaviour.dragHandleVisibility',true);
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'DragAndDrop',title:'Glisser-déposer — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   const task=content.question.task;
   if(kind==='sans-reprise')check(task.elements[0].type.library==='H5P.Image 1.1' && zip.file('content/'+file.path),'Image perdue');
   check(task.elements.length===8 && task.dropZones.length===3,'Contenu perdu');
   task.elements.forEach((e,i)=>check(e.type.subContentId===native.question.task.elements[i].type.subContentId,'Identifiant perdu '+i));
   check(task.dropZones[0].tipsAndFeedback.tip.includes('RELU'),'Indice perdu');
   check(content.behaviour.enableRetry===(kind==='standard') && content.behaviour.autoAlignSpacing===4,'Options perdues');
   cases.push({key:'DragAndDrop',id:'glisser-deposer-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','marcher','finir']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
