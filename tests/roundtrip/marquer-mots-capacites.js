/** Recette des champs natifs Blanks, confirmations et variantes de réponse. */
export async function verifierMarquerMots() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/MarkTheWords.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_mark_the_words',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('showScorePoints') && prompt.includes('enableSolutionsButton') && prompt.includes('media.type.library'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/MarkTheWords/content.json').then(r=>r.json());
 check(processor.process({...native,checkAnswerButton:'Vérifier RELU'}).checkAnswerButton==='Vérifier RELU','Libellé natif perdu');
 const data={...native,taskDescription:'Sélectionne les capitales. RELU',textField:'*Paris* Lyon *Rome* Milan',overallFeedback:[{from:0,to:99,feedback:'Repère les capitales.'},{from:100,to:100,feedback:'Les capitales sont trouvées.'}]};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'MarkTheWords',titleKey:'h5p_mark_the_words_name'},host,data),'Éditeur absent');};
 const set=(el,value)=>{check(el,'Champ absent');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  await open(data);section('general');
  const text=host.querySelector('[data-path="taskDescription"]');check(text?.textContent?.includes('RELU') || text?.value?.includes('RELU'),'Consigne non chargée');
  const mediaFolder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/medias/';
  const png=await fetch(mediaFolder+'zones.png').then(r=>r.blob());
  const input=host.querySelector('[data-path="media.type.params.file"] input[type="file"]');
  const dt=new DataTransfer();dt.items.add(new File([png],'zones.png',{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  for(let i=0;i<150 && !host.querySelector('[data-path="media.type.params.file"] .json-editor__image-preview img')?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
  section('text');const words=host.querySelector('[data-path="textField"][contenteditable]');words.textContent='*Paris* Lyon *Rome* Milan Nice';words.dispatchEvent(new Event('input',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('text');
  check(host.querySelector('[data-path="textField"][contenteditable]').textContent.includes('Nice'),'Texte perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  for(const kind of ['complet','sans-aides']) {
   const c=structuredClone(reopened.data);
   if(kind==='sans-aides')Object.assign(c.behaviour,{enableRetry:false,enableSolutionsButton:false,showScorePoints:false});
   const pkg=await packageActivity({moduleKey:'MarkTheWords',title:'Marquer les mots — '+kind,content:c,mediaFiles:getAllMedia()});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.taskDescription.includes('RELU') && content.textField.includes('Nice'),'Consigne ou texte perdu');
   check(zip.file('content/'+content.media.type.params.file.path),'Image absente');
   c.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'MarkTheWords',id:'marquer-mots-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome','Nice']});
  }
  for(const [key,data] of [
   ['QuizSet',{questions:[{library:'H5P.MarkTheWords 1.11',params:reopened.data}]}],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.MarkTheWords 1.11',...reopened.data}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.MarkTheWords 1.11',...reopened.data}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);const split=doc.sections.findIndex(s=>s.type==='pageBreak');
   check(JSON.stringify(doc.sections.slice(0,split)).includes('Nice') && JSON.stringify(doc.sections.slice(split)).includes('Rome'),key+' : texte/corrigé perdus');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
