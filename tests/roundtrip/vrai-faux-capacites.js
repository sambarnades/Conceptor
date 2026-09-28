/** Recette des champs natifs Blanks, confirmations et variantes de réponse. */
export async function verifierVraiFaux() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/TrueFalse.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_true_false',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('autoCheck') && prompt.includes('feedbackOnWrong') && prompt.includes('confirmCheck/confirmRetry') && prompt.includes('media.type.library'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/TrueFalse/content.json').then(r=>r.json());
 check(processor.process({...native,l10n:{...native.l10n,trueText:'Oui RELU'}}).l10n.trueText==='Oui RELU','Libellé natif perdu');
 let rejected=false;try{processor.process({question:'Test',correct:'inconnu'});}catch{rejected=true;}check(rejected,'Réponse invalide acceptée');
 const data={...native,behaviour:{...native.behaviour,confirmCheckDialog:true,confirmRetryDialog:true,autoCheck:false,enableCheckButton:true},confirmCheck:{...native.confirmCheck,header:'Vérifier Madrid ?',body:'Relis ton choix. RELU',confirmLabel:'Confirmer la vérification'},confirmRetry:{...native.confirmRetry,header:'Reprendre Madrid ?',confirmLabel:'Confirmer la reprise'}};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'TrueFalse',titleKey:'h5p_true_false_name'},host,data),'Éditeur absent');};
 const set=(el,value)=>{check(el,'Champ absent');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  await open(data);section('question');
  const text=host.querySelector('[data-path="question"]');check(text?.textContent?.includes('Madrid') || text?.value?.includes('Madrid'),'Question non chargée');
  const mediaFolder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/medias/';
  const png=await fetch(mediaFolder+'zones.png').then(r=>r.blob());
  const input=host.querySelector('[data-path="media.type.params.file"] input[type="file"]');
  const dt=new DataTransfer();dt.items.add(new File([png],'zones.png',{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  for(let i=0;i<150 && !host.querySelector('[data-path="media.type.params.file"] .json-editor__image-preview img')?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
  section('settings');set(host.querySelector('[data-path="confirmCheck.body"]'),'Relis tes réponses. RELU Caramel');
  section('feedback');const feedback=host.querySelector('[data-path="feedbackOnWrong"][contenteditable]');feedback.textContent='Madrid est bien la capitale espagnole. RELU Caramel';feedback.dispatchEvent(new Event('input',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('settings');
  check(host.querySelector('[data-path="confirmCheck.body"]').value.includes('RELU Caramel'),'Dialogue perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  for(const kind of ['manuel','automatique']) {
   const c=structuredClone(reopened.data);
   if(kind==='automatique')Object.assign(c.behaviour,{autoCheck:true,enableCheckButton:false,confirmCheckDialog:false,confirmRetryDialog:false,enableRetry:false,enableSolutionsButton:false});
   if(kind==='automatique'){c.correct='false';c.question='Madrid est la capitale de l’Italie.';c.behaviour.feedbackOnCorrect='Rome est la capitale italienne. RELU';c.behaviour.feedbackOnWrong='Madrid est la capitale espagnole, pas italienne. RELU';}
   const pkg=await packageActivity({moduleKey:'TrueFalse',title:'Vrai/Faux — '+kind,content:c,mediaFiles:getAllMedia()});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.question.includes('Madrid') && content.behaviour.feedbackOnWrong.includes('RELU'),'Question ou retour perdu');
   check(zip.file('content/'+content.media.type.params.file.path),'Image absente');
   c.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'TrueFalse',id:'vrai-faux-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Madrid','capitale espagnole']});
  }
  for(const [key,data] of [
   ['QuizSet',{questions:[{library:'H5P.TrueFalse 1.8',params:reopened.data}]}],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.TrueFalse 1.8',...reopened.data}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.TrueFalse 1.8',...reopened.data}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);const split=doc.sections.findIndex(s=>s.type==='pageBreak');
   check(!JSON.stringify(doc.sections.slice(0,split)).includes('RELU Caramel') && JSON.stringify(doc.sections.slice(split)).includes('RELU Caramel'),key+' : retours mal placés');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
