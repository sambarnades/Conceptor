/** Réglages natifs du quiz mixte et documents du tirage. */
export async function verifierQuizMixte() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '3']) {
   const prompt=buildActivityPrompt('prompt_quizset',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(['introPage','poolSize','endGame','override'].every(k=>prompt.includes(k)),lang+' : options absentes');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/QuizSet/content.json').then(r=>r.json());
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/';
 const sourceImage=await fetch(folder+'lot-utilisateur-26/retours-elea/SortParagraphs/content.json').then(r=>r.json());
 const file=sourceImage.media.type.params.file;
 const imageZip=await window.JSZip.loadAsync(await fetch(folder+'lot-utilisateur-26/retours-elea/SortParagraphs/14-SortParagraphs.h5p').then(r=>r.arrayBuffer()));
 const imageBlob=await imageZip.file('content/'+file.path).async('blob');
 file.dataURL=await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(imageBlob);});
 const media=new Map([[file.path,imageBlob]]);
 const videoZip=await window.JSZip.loadAsync(await fetch(folder+'glisser-mots/sucrerie-glisser-mots-video.h5p').then(r=>r.arrayBuffer()));
 const video=JSON.parse(await videoZip.file('content/content.json').async('string')).media.type.params.sources;
 for(const entry of Object.values(videoZip.files).filter(f=>f.name.startsWith('content/') && f.name!=='content/content.json' && !f.dir))media.set(entry.name.slice(8),await entry.async('blob'));
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'QuizSet',titleKey:'h5p_quiz_set_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['complet','tirage','sans-resultats']) {
   const c=structuredClone(native);c.title='Capitales RELU';
   c.questions=[
    {library:'H5P.MultiChoice 1.16',subContentId:'quiz-q1',metadata:{title:'France'},params:{question:'Capitale de la France ?',answers:[{text:'Paris',correct:true},{text:'Rome',correct:false}],behaviour:{randomAnswers:false,singlePoint:true}}},
    {library:'H5P.TrueFalse 1.8',subContentId:'quiz-q2',metadata:{title:'Italie'},params:{question:'Rome est la capitale de l’Italie.',correct:'true'}},
    {library:'H5P.Blanks 1.14',subContentId:'quiz-q3',metadata:{title:'Espagne'},params:{text:'Complète la capitale.',questions:['La capitale de l’Espagne est *Madrid*.']}}
   ];
   if(kind==='complet'){c.introPage.backgroundImage=structuredClone(file);c.introPage.backgroundImageAltText='Trois zones colorées';}
   if(kind==='tirage'){c.endGame.showAnimations=true;c.endGame.skippable=true;c.endGame.successVideo=video;c.endGame.failVideo=video;}
   c.endGame.overallFeedback=[{from:0,to:100,feedback:'RELU : relie chaque capitale à son pays.'}];
   await open(c);section('general');set('introPage.showIntroPage',true);set('introPage.title','Avant de commencer RELU');set('introPage.introduction','RELU : réponds aux questions sur les capitales.');set('introPage.startButtonText','Commencer RELU');set('progressType',kind==='complet'?'textual':'dots');set('passPercentage',60);
   section('settings');set('disableBackwardsNavigation',kind==='tirage');set('poolSize',kind==='tirage'?'2':'');set('override.checkButton',kind!=='sans-resultats');set('override.showSolutionButton','on');set('override.retryButton','on');
   section('feedback');set('endGame.showResultPage',kind!=='sans-resultats');set('endGame.showRetryButton',kind!=='sans-resultats');set('endGame.showSolutionButton',kind!=='sans-resultats');set('endGame.noResultMessage','Terminé RELU');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'QuizSet',title:'Quiz mixte — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.introPage.startButtonText==='Commencer RELU' && content.questions.length===3,'Contenu perdu');
   check(content.endGame.overallFeedback[0].feedback.includes('RELU') && content.questions[0].subContentId==='quiz-q1','Retour ou identifiant perdu');
   check(kind==='tirage'?content.poolSize===2:content.poolSize===undefined,'Tirage perdu');
   if(kind==='complet')saved.data.introPage.backgroundImage.dataURL=file.dataURL;
   cases.push({key:'QuizSet',id:'quiz-mixte-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),mediaOnly:kind==='sans-resultats',required:kind==='complet'?['RELU','Paris','Madrid']:['RELU','Paris']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
