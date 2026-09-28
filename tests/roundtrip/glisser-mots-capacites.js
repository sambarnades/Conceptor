/** Champs natifs DragText, fiches par mot et trois médias de consigne. */
export async function verifierGlisserMots() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {formatContentForDocument}=await import('../../js/export/document-formatter.js');
 const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const {parseDragTextWord}=await import('../../js/h5p/drag-text-grammar.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_drag_the_words',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(!prompt.includes('[NOMBRE_ELEMENTS]') && prompt.includes('media.type') && prompt.includes('distractors') && prompt.includes('\\+'),lang+' : prompt incomplet');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/DragTheWords/content.json').then(r=>r.json());
 const data={...native,taskDescription:'Complète les deux capitales. RELU',textField:'La capitale de la France est *Paris:La Seine\\+Paris est la capitale française.\\-Cherche la ville française.*. En Italie, la capitale est *Rome:Le Colisée\\+Rome est la capitale italienne.\\-Cherche la ville italienne.*.',distractors:'*Madrid*',overallFeedback:[{from:0,to:99,feedback:'Repère le pays associé à chaque capitale.'},{from:100,to:100,feedback:'Les deux capitales sont correctement associées.'}]};
 const host=document.createElement('div');document.body.append(host);
 const section=id=>host.querySelector(`.json-editor__nav-section[data-section-id="${id}"] > button`).click();
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'DragTheWords',titleKey:'h5p_drag_the_words_name'},host,data),'Éditeur absent');};
 const set=(el,value)=>{check(el,'Champ absent');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  await open(data);section('text');
  const tip=host.querySelector('[data-drag-word-index="0"][data-drag-word-property="tip"]');check(tip,'Fiche par mot absente');set(tip,'La Seine traverse cette ville. RELU');
  set(host.querySelector('[data-drag-word-index="0"][data-drag-word-property="correctFeedback"]'),'Paris est bien la capitale française.');
  const main=host.querySelector('[data-path="textField"][contenteditable]');
  check(main && !main.textContent.includes('\\+') && !main.textContent.includes('La Seine'),'Codes de feedback visibles dans le texte principal');
  main.textContent += ' Les deux pays sont en Europe.';main.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,200));
  const edited=await saveChanges();check(edited,'Sauvegarde refusée');await open(edited.data);section('text');
  check(host.querySelector('[data-drag-word-index="0"][data-drag-word-property="tip"]').value.includes('RELU'),'Indice perdu');
  const reopened=await saveChanges();check(reopened,'Réouverture refusée');
  const mediaFolder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/medias/';
  const png=await fetch(mediaFolder+'zones.png').then(r=>r.blob());
  const wav=await fetch(mediaFolder+'dictee-paris.wav').then(r=>r.blob());
  const cover=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/livre-couverture/livre-couverture-video.h5p').then(r=>r.arrayBuffer()));
  const videoEntry=Object.values(cover.files).find(f=>f.name.endsWith('.webm'));
  const video=await videoEntry.async('blob');
  let previousData=reopened.data;
  for(const [kind,library,name,blob,mime] of [['image','H5P.Image 1.1','zones.png',png,'image/png'],['audio','H5P.Audio 1.5','dictee-paris.wav',wav,'audio/wav'],['video','H5P.Video 1.6','extrait.webm',video,'video/webm']]) {
   const c=structuredClone(previousData);
   c.behaviour.instantFeedback=kind==='audio';c.behaviour.enableCheckButton=kind!=='audio';
   if(kind==='video'){c.behaviour.enableRetry=false;c.behaviour.enableSolutionsButton=false;}
   await open(c);section('general');
   const select=host.querySelector('[data-path="media.type.library"]');check(select,'Sélecteur média absent');set(select,library);
   const fieldPath='media.type.params.'+({image:'file',audio:'files',video:'sources'}[kind]);
   const input=host.querySelector(`[data-path="${fieldPath}"] input[type="file"]`);check(input,'Upload absent : '+kind);
   const dt=new DataTransfer();dt.items.add(new File([blob],name,{type:mime}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
   for(let i=0;i<150 && !host.querySelector(`[data-path="${fieldPath}"] .json-editor__image-preview img, [data-path="${fieldPath}"] ${kind}`)?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
   const saved=await saveChanges();check(saved,'Sauvegarde média refusée');previousData=structuredClone(saved.data);
   const media=getAllMedia();
   const pkg=await packageActivity({moduleKey:'DragTheWords',title:'Glisser les capitales — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.media.type.library===library,'Type média perdu');
   if(kind!=='image')check(!content.media.type.params.file,'Ancienne image conservée après changement de média');
   const file=content.media.type.params.file || content.media.type.params.files?.[0] || content.media.type.params.sources?.[0];
   check(file?.path && zip.file('content/'+file.path),'Média absent du paquet : '+kind);
   check(content.textField.includes('RELU') && content.textField.includes('\\+Paris est bien'),'Indice/retour perdu au paquet');
   // Les images restent lisibles pour le formatage direct hors ZIP.
   if(kind==='image') saved.data.media.type.params.file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
   cases.push({key:'DragTheWords',id:'glisser-mots-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Paris est bien','Madrid','La Seine']});
  }
  const embedded={...reopened.data};
  for(const [key,data] of [
   ['QuizSet',{questions:[{library:'H5P.DragText 1.10',params:embedded}]}],
   ['CoursePresentation',{slides:[{type:'quiz',exercise:{library:'H5P.DragText 1.10',...embedded}}]}],
   ['InteractiveBook',{chapters:[{title:'Capitales',content:[{type:'exercise',library:'H5P.DragText 1.10',...embedded}]}]}]
  ]) {
   const doc=await formatContentForDocument(key,data);const split=doc.sections.findIndex(s=>s.type==='pageBreak');
   const student=JSON.stringify(doc.sections.slice(0,split));const teacher=JSON.stringify(doc.sections.slice(split));
   check(student.includes('La Seine') && !student.includes('Paris est bien') && teacher.includes('Paris est bien'),key+' : indices/retours mal placés');
  }
  return cases;
 } finally {destroyEditor();host.remove();}
}
