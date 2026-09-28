/** Quiz QCM : source Éléa, formules, retouches et réglages de reprise. */
export async function verifierQuizQcm() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '3'])check(buildActivityPrompt('prompt_quizset_qcm',{nombreQuestions,quoi:'Racine carrée',isAdvanced:!!nombreQuestions}).includes('endGame'),lang+' : options absentes');
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/QuizSetQCM/content.json').then(r=>r.json());
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'QuizSetQCM',titleKey:'h5p_quiz_set_qcm_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['standard','sans-reprise']) {
   const c=structuredClone(native);c.title='Racines carrées RELU';c.randomQuestions=false;c.introPage={showIntroPage:false};
   c.questions.forEach(q=>{q.params.behaviour.randomAnswers=false;q.params.behaviour.singlePoint=true;});
   await open(c);section('questions');set('questions.0.metadata.title','Domaine RELU');
   set('questions.0.params.answers.1.tipsAndFeedback.chosenFeedback','La racine carrée est définie pour un nombre positif ou nul. RELU');
   section('feedback');set('endGame.showRetryButton',kind==='standard');set('endGame.showSolutionButton',true);
   section('settings');set('override.retryButton',kind==='standard'?'on':'off');set('override.showSolutionButton','on');set('disableBackwardsNavigation',false);
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'QuizSetQCM',title:'Quiz QCM — '+kind,content:saved.data});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.questions.length===3 && content.questions.every(q=>q.library.startsWith('H5P.MultiChoice')),'Type perdu');
   check(content.questions[0].metadata.title==='Domaine RELU' && content.questions[0].subContentId===native.questions[0].subContentId,'Retouche ou identifiant perdu');
   check(content.questions[0].params.answers[1].tipsAndFeedback.chosenFeedback.includes('RELU'),'Retour perdu');
   cases.push({key:'QuizSetQCM',id:'quiz-qcm-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),mathObjects:true,required:['RELU','16','4']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
