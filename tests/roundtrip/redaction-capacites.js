/** Champs natifs DragText, fiches par mot et trois médias de consigne. */
export async function verifierRedaction() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_essay',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('media.type') && prompt.includes('feedbackIncludedWord') && prompt.includes('percentageMastering'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const {default:processor}=await import('../../js/h5p/processors/Essay.js');
 for(const invalid of [{keywords:[]},{keywords:[{keyword:'x',options:{points:-1}}]},{keywords:[{keyword:'x',options:{occurrences:0}}]},{keywords:[{keyword:'x'}],behaviour:{percentagePassing:101}}]) {
  let rejected=false;try{processor.process(invalid);}catch{rejected=true;}check(rejected,'Rédaction invalide acceptée');
 }
 const controls=processor.process({keywords:[{keyword:'x',options:{points:0,occurrences:1}}],checkAnswer:'Vérifier RELU',behaviour:{minimumLength:0,maximumLength:0}});
 check(controls.checkAnswer==='Vérifier RELU' && controls.keywords[0].options.points===0 && controls.behaviour.overrideForgiveMistakes===undefined,'Natif ou borne zéro écrasé');
 check(processor.process({keywords:['soleil']}).keywords[0].keyword==='soleil','Mot-clé historique perdu');
 const embeddedNative=processor.transformForQuizSet({library:'H5P.Essay 1.5',params:structuredClone(controls)});check(embeddedNative.params.checkAnswer==='Vérifier RELU','Libellé imbriqué écrasé');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Essay/content.json').then(r=>r.json());
 const data={...native,taskDescription:'Explique le rôle du Soleil. RELU',placeholderText:'Le Soleil...',overallFeedback:[{from:0,to:99,feedback:'Précise ce que le Soleil fournit.'},{from:100,to:100,feedback:'Le rôle du Soleil est identifié.'}],keywords:[{keyword:'énergie',alternatives:['energie'],options:{points:2,occurrences:1,caseSensitive:false,forgiveMistakes:false,feedbackIncluded:'Énergie bien mentionnée.',feedbackMissed:'Pense à l’énergie.',feedbackIncludedWord:'alternative',feedbackMissedWord:'keyword'}}],solution:{introduction:'Une proposition',sample:'Le Soleil fournit de l’énergie.'},behaviour:{...native.behaviour,minimumLength:10,maximumLength:200,inputFieldSize:'3',overrideForgiveMistakes:'',overrideCaseSensitive:'',percentagePassing:50,percentageMastering:100}};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Essay',titleKey:'h5p_essay_name'},host,data),'Éditeur absent');};
 const set=(el,value)=>{check(el,'Champ absent');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  await open(data);section('keywords');
  const setKeyword=(key,value)=>set(host.querySelector(`[data-path="keywords.0.options.${key}"]`),value);
  setKeyword('feedbackIncluded','Énergie bien mentionnée. RELU');
  setKeyword('feedbackIncludedWord','answer');
  section('settings');
  set(host.querySelector('[data-path="behaviour.inputFieldSize"]'),'3');
  set(host.querySelector('[data-path="behaviour.percentagePassing"]'),'75');
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('keywords');
  check(host.querySelector('[data-path="keywords.0.options.feedbackIncluded"]').value.includes('RELU'),'Retour perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  check(reopened.data.keywords[0].options.feedbackIncludedWord==='answer','Mot de retour perdu');
  check(reopened.data.behaviour.percentagePassing===75,'Seuil perdu');
  const mediaFolder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/medias/';
  const png=await fetch(mediaFolder+'zones.png').then(r=>r.blob());
  const wav=await fetch(mediaFolder+'dictee-paris.wav').then(r=>r.blob());
  const cover=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/livre-couverture/livre-couverture-video.h5p').then(r=>r.arrayBuffer()));
  const videoEntry=Object.values(cover.files).find(f=>f.name.endsWith('.webm'));
  const video=await videoEntry.async('blob');
  let previousData=reopened.data;
  for(const [kind,library,name,blob,mime] of [['image','H5P.Image 1.1','zones.png',png,'image/png'],['audio','H5P.Audio 1.5','dictee-paris.wav',wav,'audio/wav'],['video','H5P.Video 1.6','extrait.webm',video,'video/webm']]) {
   const c=structuredClone(previousData);
   c.behaviour.ignoreScoring=kind==='audio';c.behaviour.pointsHost=3;
   c.behaviour.enableRetry=kind!=='video';
   await open(c);section('general');
   const select=host.querySelector('[data-path="media.type.library"]');check(select,'Sélecteur média absent');set(select,library);
   const fieldPath='media.type.params.'+({image:'file',audio:'files',video:'sources'}[kind]);
   const input=host.querySelector(`[data-path="${fieldPath}"] input[type="file"]`);check(input,'Upload absent : '+kind);
   const dt=new DataTransfer();dt.items.add(new File([blob],name,{type:mime}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
   for(let i=0;i<150 && !host.querySelector(`[data-path="${fieldPath}"] .json-editor__image-preview img, [data-path="${fieldPath}"] ${kind}`)?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
   const saved=await saveChanges();check(saved,'Sauvegarde média refusée');previousData=structuredClone(saved.data);
   const media=getAllMedia();
   const pkg=await packageActivity({moduleKey:'Essay',title:'Rédaction énergie — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.media.type.library===library,'Type média perdu');
   if(kind!=='image')check(!content.media.type.params.file,'Ancienne image conservée après changement de média');
   const file=content.media.type.params.file || content.media.type.params.files?.[0] || content.media.type.params.sources?.[0];
   check(file?.path && zip.file('content/'+file.path),'Média absent du paquet : '+kind);
   check(content.keywords[0].options.feedbackIncluded.includes('RELU') && content.keywords[0].options.feedbackIncludedWord==='answer','Retour perdu au paquet');
   // Les images restent lisibles pour le formatage direct hors ZIP.
   if(kind==='image') saved.data.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'Essay',id:'redaction-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Énergie bien mentionnée','Soleil']});
  }
  const doc=await formatContentForDocument('QuizSet',{questions:[{library:'H5P.Essay 1.5',params:reopened.data}]});
  const split=doc.sections.findIndex(s=>s.type==='pageBreak');
  check(!JSON.stringify(doc.sections.slice(0,split)).includes('Énergie bien mentionnée') && JSON.stringify(doc.sections.slice(split)).includes('Énergie bien mentionnée'),'Corrigé imbriqué incorrect');
  return cases;
 } finally {destroyEditor();host.remove();}
}
