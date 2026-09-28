/** Série de choix uniques : limites, identifiants, délais et ordre papier. */
export async function verifierChoixUniques() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/SingleChoiceSet.js');
 const {getSchemaForType}=await import('../../js/editor/content-detector.js');
 const {getValidationErrors}=await import('../../js/editor/validators.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_single_choice_set',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(prompt.includes('timeoutCorrect') && prompt.includes('autoContinue') && prompt.includes('passPercentage'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/SingleChoiceSet/content.json').then(r=>r.json());
 const processed=processor.process(native);
 check(processed.choices[0].subContentId===native.choices[0].subContentId,'Identifiant remplacé');
 check(processed.l10n.slideOfTotal.includes(':num') && !processed.l10n.slideOfTotal.includes('@slide'),'Ancien jeton non réparé');
 check(processor.process({...native,l10n:{...native.l10n,retryButtonLabel:'Encore RELU'}}).l10n.retryButtonLabel==='Encore RELU','Libellé perdu');
 for(const n of [0,1,5]) {
  const invalid={...native,choices:[{question:'Question',answers:Array(n).fill('Paris')}]};
  let rejected=false;try{processor.process(invalid);}catch{rejected=true;}
  check(rejected,'Nombre de réponses accepté : '+n);
  check(getValidationErrors(invalid,getSchemaForType('SingleChoiceSet')).some(e=>e.path==='choices.0.answers'),'Limite éditeur absente : '+n);
 }
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'SingleChoiceSet',titleKey:'h5p_single_choice_set_name'},host,data),'Éditeur absent');};
 const cases=[];
 try {
  const data={...native,choices:[...native.choices,{question:'Capitale de l’Italie ?',answers:['Rome','Madrid','Paris'],subContentId:crypto.randomUUID()}]};
  await open(data);host.querySelector('.json-editor__nav-section[data-section-id="settings"] > button').click();
  const timeout=host.querySelector('[data-path="behaviour.timeoutWrong"]');timeout.value='700';timeout.dispatchEvent(new Event('input',{bubbles:true}));timeout.dispatchEvent(new Event('change',{bubbles:true}));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);
  const reopened=await saveChanges();check(reopened.data.behaviour.timeoutWrong===700,'Délai perdu');
  check(reopened.data.choices[0].subContentId===native.choices[0].subContentId,'Identifiant perdu après réouverture');
  for(const kind of ['manuel','automatique']) {
   const c=structuredClone(reopened.data);
   Object.assign(c.behaviour,{autoContinue:kind==='automatique',timeoutCorrect:300,timeoutWrong:700,soundEffectsEnabled:false,enableRetry:kind==='manuel',enableSolutionsButton:kind==='manuel'});
   const pkg=await packageActivity({moduleKey:'SingleChoiceSet',title:'Série de choix uniques — '+kind,content:c});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.choices[0].subContentId===native.choices[0].subContentId,'Identifiant perdu dans le paquet');
   cases.push({key:'SingleChoiceSet',id:'choix-uniques-'+kind,data:c,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome']});
  }
  for(const [key,data] of [
   ['SingleChoiceSet',reopened.data],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.SingleChoiceSet 1.11',...reopened.data}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.SingleChoiceSet 1.11',...reopened.data}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);
   const boxes=doc.sections.filter(s=>s.type==='checkbox');
   check(boxes[0].text!=='A. Paris',key+' : bonne réponse divulguée en premier');
   const correct=doc.sections.filter(s=>s.style==='correctAnswer');
   check(correct[0].text.includes('C. Paris'),key+' : corrigé incohérent');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
