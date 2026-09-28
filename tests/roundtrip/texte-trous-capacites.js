/** Recette des champs natifs Blanks, confirmations et variantes de réponse. */
export async function verifierTexteTrous() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/FillInTheBlanks.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_fill_in_the_blanks',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('showSolutionsRequiresInput') && prompt.includes('allowRetryIfCorrect') && prompt.includes('confirmCheck/confirmRetry') && prompt.includes('media.type.library'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/FillInTheBlanks/content.json').then(r=>r.json());
 check(processor.process(native).text.includes('RELU'),'Consigne native perdue');
 check(processor.process({textBlocks:['Pays : *France*.'],confirmCheck:{header:'RELU'}}).confirmCheck.header==='RELU','Ancien format incomplet');
 const data={...native,questions:['France : *Paris:La Seine*. Italie : *Rome/Roma:Le Colisée*.'],behaviour:{...native.behaviour,confirmCheckDialog:true,confirmRetryDialog:true,autoCheck:false,allowRetryIfCorrect:true},confirmCheck:{...native.confirmCheck,header:'Vérifier les capitales ?',body:'Relis tes réponses. RELU',confirmLabel:'Confirmer la vérification'},confirmRetry:{...native.confirmRetry,header:'Reprendre les capitales ?',confirmLabel:'Confirmer la reprise'}};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'FillInTheBlanks',titleKey:'h5p_fill_in_the_blanks_name'},host,data),'Éditeur absent');};
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
  section('settings');set(host.querySelector('[data-path="confirmCheck.body"]'),'Relis tes réponses. RELU Caramel');
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('settings');
  check(host.querySelector('[data-path="confirmCheck.body"]').value.includes('RELU Caramel'),'Dialogue perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  for(const kind of ['manuel','automatique']) {
   const c=structuredClone(reopened.data);
   if(kind==='automatique')Object.assign(c.behaviour,{autoCheck:true,enableCheckButton:false,confirmCheckDialog:false,confirmRetryDialog:false,caseSensitive:false,separateLines:true,showSolutionsRequiresInput:true,acceptSpellingErrors:true});
   const pkg=await packageActivity({moduleKey:'FillInTheBlanks',title:'Texte à trous — '+kind,content:c,mediaFiles:getAllMedia()});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.text.includes('RELU') && content.confirmCheck.body.includes('RELU Caramel'),'Consigne ou dialogue perdu');
   check(zip.file('content/'+content.media.type.params.file.path),'Image absente');
   c.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'FillInTheBlanks',id:'texte-trous-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Roma','La Seine','Le Colisée']});
  }
  for(const [key,data] of [
   ['QuizSet',{questions:[{library:'H5P.Blanks 1.14',params:reopened.data}]}],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.Blanks 1.14',...reopened.data}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.Blanks 1.14',...reopened.data}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);const split=doc.sections.findIndex(s=>s.type==='pageBreak');
   check(JSON.stringify(doc.sections.slice(0,split)).includes('La Seine') && JSON.stringify(doc.sections.slice(split)).includes('Rome / Roma'),key+' : indices/variantes perdus');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
