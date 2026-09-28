/** Présentation native : retouches des placements, commentaires, sous-questions et options. */
export async function verifierPresentation(){
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']){await loadTranslations(lang);for(const nombreElements of ['', '5'])check(buildActivityPrompt('prompt_course_presentation',{nombreElements,quoi:'Capitales',isAdvanced:!!nombreElements}).includes('summarySlideRetryButton'),lang+' : prompt incomplet');}await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/CoursePresentation/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const media=new Map(),nodes={};
 for(const kind of ['audio','video']){
  const zip=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/glisser-mots/sucrerie-glisser-mots-'+kind+'.h5p').then(r=>r.arrayBuffer()));
  nodes[kind]=JSON.parse(await zip.file('content/content.json').async('string')).media.type;
  for(const entry of Object.values(zip.files).filter(f=>f.name.startsWith('content/')&&f.name!=='content/content.json'&&!f.dir))media.set(entry.name.slice(8),await entry.async('blob'));
 }
 nodes.audio.params.playerMode='full';nodes.audio.params.controls=true;nodes.audio.params.autoplay=false;
 const imageZip=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/trouver-plusieurs-zones/trouver-plusieurs-zones-complet.h5p').then(r=>r.arrayBuffer()));
 const file=JSON.parse(await imageZip.file('content/content.json').async('string')).imageMultipleHotspotQuestion.backgroundImageSettings.backgroundImage;
 const blob=new Blob([await imageZip.file('content/'+file.path).async('uint8array')],{type:file.mime});media.set(file.path,blob);
 const dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});
 const element=(action,x,y,width,height)=>({x,y,width,height,backgroundOpacity:0,displayAsButton:false,alwaysDisplayComments:false,buttonSize:"big",goToSlideType:"specified",action});
 const text=(value,id)=>({library:'H5P.AdvancedText 1.1',params:{text:value},subContentId:id});
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'CoursePresentation',titleKey:'h5p_course_presentation_name'},host,data),'Éditeur absent');};
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try{
  for(const kind of ['complet','sans-bilan']){
   const input=structuredClone(native);
   // Deux exercices sur une même diapositive : l'export historique en perdait un.
   const extra=structuredClone(native.presentation.slides[1].elements[0]);extra.action.subContentId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';extra.action.params.question='Rome est la capitale italienne. RELU';extra.action.params.behaviour.feedbackOnCorrect='Rome est la capitale italienne.';extra.action.params.behaviour.feedbackOnWrong='Rome est bien la capitale italienne.';extra.x=36;extra.y=53;extra.width=62;extra.height=42;
   input.presentation.slides[0].elements[0].height=45;input.presentation.slides[0].elements.push(extra);
   input.presentation.slides.push({keywords:[{main:'Médias RELU'}],elements:[
    element(text('Premier texte RELU','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),2,2,96,10),
    element(text('Deuxième texte RELU','cccccccc-cccc-4ccc-8ccc-cccccccccccc'),2,13,96,10),
    element({library:'H5P.Image 1.1',params:{file:{...file,dataURL},alt:'Trois rectangles RELU'},subContentId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'},2,25,45,45),
    element(structuredClone(nodes.audio),50,25,45,15),element(structuredClone(nodes.video),50,43,45,45)
   ]});
   if(kind==='complet')for(const slide of input.presentation.slides.slice(1))for(const el of slide.elements){el.x=36+el.x*0.62;el.width*=0.62;}
   await open(input);
   set('presentation.slides.0.elements.0.buttonLabel','Ouvrir la question RELU');
   set('presentation.slides.0.elements.0.x',36);set('presentation.slides.0.elements.0.width',62);
   set('presentation.slides.0.elements.0.solution','Commentaire pédagogique RELU');set('presentation.slides.0.elements.0.alwaysDisplayComments',false);
   set('presentation.slides.0.elements.0.action.params.question','Quelle ville est la capitale française ? RELU');
   host.querySelector('[data-section-id="options"] > button').click();
   set('presentation.keywordListEnabled',true);set('presentation.keywordListAlwaysShow',kind==='complet');
   set('override.hideSummarySlide',kind==='sans-bilan');
   let saved=await saveChanges();check(saved,'Sauvegarde refusée : '+host.innerText.slice(-6000));await open(saved.data);saved=await saveChanges();check(saved,'Réouverture refusée');
   const pkg=await packageActivity({moduleKey:'CoursePresentation',title:'Présentation '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   const first=content.presentation.slides[0].elements[0];
   check(first.x===36&&first.width===62&&first.solution.includes('RELU')&&first.buttonLabel==='Ouvrir la question RELU','Placement ou commentaire perdu');
   check(first.action.subContentId===native.presentation.slides[0].elements[0].action.subContentId,'Identifiant perdu');
   check(first.action.params.question.includes('RELU')&&content.override.hideSummarySlide===(kind==='sans-bilan'),'Contenu ou option perdus');
   saved.data.presentation.slides[4].elements[2].action.params.file.dataURL=dataURL;
   check(content.presentation.slides[0].elements.length===2&&content.presentation.slides[4].elements.length===5,'Éléments perdus');
   cases.push({key:'CoursePresentation',id:'presentation-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Madrid','Rome','Premier texte','Deuxième texte','Correction']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
