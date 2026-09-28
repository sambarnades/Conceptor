/** Recette des champs natifs MultiChoice, confirmations et modes de réponse. */
export async function verifierChoixMultiple() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/MultipleChoice.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_multiple_choice',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('autoCheck') && prompt.includes('singlePoint') && prompt.includes('confirmCheck/confirmRetry') && prompt.includes('media.type.library'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/MultipleChoice/content.json').then(r=>r.json());
 check(processor.process({...native,UI:{...native.UI,checkAnswerButton:'Vérifier RELU'}}).UI.checkAnswerButton==='Vérifier RELU','Libellé natif perdu');
 let rejected=false;try{processor.process({question:'Test',answers:[]});}catch{rejected=true;}check(rejected,'Aucune réponse acceptée');
 check(processor.process({answers:[{text:'Test',correct:'false'}]}).answers[0].correct===false,'Booléen texte incorrect');
 check(processor.process({answers:[{text:'Test',correct:true}]}).answers.length===1,'Borne native minimale refusée');
 const data={...native,question:'Sélectionne les capitales de France et d’Italie. RELU',answers:[
  {text:'Paris',correct:true,tipsAndFeedback:{tip:'La Seine. RELU',chosenFeedback:'Paris est la capitale française.',notChosenFeedback:'Pense à la capitale française.'}},
  {text:'Rome',correct:true,tipsAndFeedback:{tip:'Le Colisée.',chosenFeedback:'Rome est la capitale italienne.',notChosenFeedback:'Pense à la capitale italienne.'}},
  {text:'Lyon',correct:false,tipsAndFeedback:{chosenFeedback:'Lyon est une ville française, mais pas sa capitale.'}}
 ],behaviour:{...native.behaviour,type:'multi',randomAnswers:false,confirmCheckDialog:true,confirmRetryDialog:true,autoCheck:false,enableCheckButton:true,passPercentage:100},confirmCheck:{...native.confirmCheck,header:'Vérifier les capitales ?',body:'Relis tes choix. RELU',confirmLabel:'Confirmer la vérification'},confirmRetry:{...native.confirmRetry,header:'Reprendre les capitales ?',confirmLabel:'Confirmer la reprise'}};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'MultipleChoice',titleKey:'h5p_multiple_choice_name'},host,data),'Éditeur absent');};
 const set=(el,value)=>{check(el,'Champ absent');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  await open(data);section('question');
  const text=host.querySelector('[data-path="question"]');check(text?.textContent?.includes('capitales') || text?.value?.includes('capitales'),'Question non chargée');
  const mediaFolder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/medias/';
  const png=await fetch(mediaFolder+'zones.png').then(r=>r.blob());
  const input=host.querySelector('[data-path="media.type.params.file"] input[type="file"]');
  const dt=new DataTransfer();dt.items.add(new File([png],'zones.png',{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  for(let i=0;i<150 && !host.querySelector('[data-path="media.type.params.file"] .json-editor__image-preview img')?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
  section('settings');set(host.querySelector('[data-path="confirmCheck.body"]'),'Relis tes réponses. RELU Caramel');
  section('answers');const feedback=host.querySelector('[data-path="answers.0.tipsAndFeedback.chosenFeedback"][contenteditable]');feedback.textContent='Paris est la capitale française. RELU Caramel';feedback.dispatchEvent(new Event('input',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('settings');
  check(host.querySelector('[data-path="confirmCheck.body"]').value.includes('RELU Caramel'),'Dialogue perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  for(const kind of ['multiple','unique']) {
   const c=structuredClone(reopened.data);
   if(kind==='unique')Object.assign(c.behaviour,{type:'single',autoCheck:true,enableCheckButton:false,confirmCheckDialog:false,confirmRetryDialog:false,enableRetry:false,enableSolutionsButton:false,randomAnswers:true});
   if(kind==='unique'){c.answers[1].correct=false;c.question='Quelle ville est la capitale de la France ? RELU';c.answers[1].tipsAndFeedback.chosenFeedback='Rome est la capitale italienne.';c.answers[1].tipsAndFeedback.notChosenFeedback='Rome ne convient pas pour la France.';}
   const pkg=await packageActivity({moduleKey:'MultipleChoice',title:'Choix multiple — '+kind,content:c,mediaFiles:getAllMedia()});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.question.includes('capitale') && content.answers[0].tipsAndFeedback.chosenFeedback.includes('RELU'),'Question ou retour perdu');
   check(zip.file('content/'+content.media.type.params.file.path),'Image absente');
   c.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'MultipleChoice',id:'choix-multiple-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome','La Seine']});
  }
  for(const [key,data] of [
   ['QuizSet',{questions:[{library:'H5P.MultiChoice 1.16',params:reopened.data}]}],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.MultiChoice 1.16',...reopened.data}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.MultiChoice 1.16',...reopened.data}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);const split=doc.sections.findIndex(s=>s.type==='pageBreak');
   check(!JSON.stringify(doc.sections.slice(0,split)).includes('RELU Caramel') && JSON.stringify(doc.sections.slice(split)).includes('RELU Caramel'),key+' : retours mal placés');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
