/** Tri : média natif, bornes, barèmes, sauvegardes et documents. */
export async function verifierTriParagraphes() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/SortParagraphs.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '4']) {
   const prompt=buildActivityPrompt('prompt_sort_the_paragraphs',{nombreQuestions,quoi:'Démarche',isAdvanced:!!nombreQuestions});
   check(prompt.includes('media.type.library') && prompt.includes('duplicatesInterchangeable'),lang+' : options absentes');
  }
 }
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/SortParagraphs/';
 const native=await fetch(folder+'content.json').then(r=>r.json());native.l10n.up='Monter RELU';native.a11y.listDescription='Ordre RELU';
 check(processor.process(native).l10n.up==='Monter RELU','Libellé perdu');
 let refused=false;try{processor.process({...native,paragraphs:['A','B']});}catch{refused=true;}check(refused,'Deux paragraphes acceptés');
 const zip=await window.JSZip.loadAsync(await fetch(folder+'14-SortParagraphs.h5p').then(r=>r.arrayBuffer()));
 const file=native.media.type.params.file;const png=new Blob([await zip.file('content/'+file.path).async('uint8array')],{type:file.mime});
 check((await createImageBitmap(png)).width===800,'Image invalide');
 file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
 const media=new Map([[file.path,png]]);
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'SortParagraphs',titleKey:'h5p_sort_the_paragraphs_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['positions','transitions']) {
   await open(native);section('general');check(host.querySelectorAll('[data-path="media.type.params.alt"]').length===1,'Texte alternatif en double');set('media.type.params.alt','Trois zones RELU');section('settings');
   set('behaviour.scoringMode',kind);set('behaviour.applyPenalties',kind==='transitions');set('behaviour.duplicatesInterchangeable',true);set('behaviour.addButtonsForMovement',kind==='positions');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   check(saved.data.media.type.params.alt==='Trois zones RELU','Texte alternatif perdu à la réouverture');
   const pkg=await packageActivity({moduleKey:'SortParagraphs',title:'Classer — '+kind,content:saved.data,mediaFiles:media});
   const pkgZip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await pkgZip.file('content/content.json').async('string'));
   check(content.media.type.params.file.copyright.license==='PD' && pkgZip.file('content/'+file.path),'Image ou crédits absents');
   check(content.a11y.listDescription==='Ordre RELU' && content.behaviour.scoringMode===kind,'Réglages perdus');
   saved.data.media.type.params.file.dataURL=file.dataURL;
   cases.push({key:'SortParagraphs',id:'tri-paragraphes-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Début','Observer','Fin']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
