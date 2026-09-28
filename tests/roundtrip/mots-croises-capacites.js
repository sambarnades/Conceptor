/** Mots croisés : positions, mot-solution, indice image et réouverture. */
export async function verifierMotsCroises() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {generateCrosswordGridImages}=await import('../../js/renderers/crossword-grid-generator.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/Crossword.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '2']) {
   const prompt=buildActivityPrompt('prompt_crossword',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(['solutionWord','fixWord','poolSize','extraClue.library'].every(k=>prompt.includes(k)),lang+' : options absentes');
  }
 }
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/';
 const native=await fetch(folder+'Crossword/content.json').then(r=>r.json());native.title='Capitales';native.taskDescription='Retrouve les capitales. RELU';native.l10n.extraClue='Indice RELU';native.solutionWord='ROME';
 native.overallFeedback=[{from:0,to:100,feedback:'Utilise les lettres communes aux capitales.'}];
 check(processor.process(native).words[0].extraClue.subContentId===native.words[0].extraClue.subContentId,'Identifiant perdu');
 const imageNative=await fetch(folder+'SortParagraphs/content.json').then(r=>r.json());
 const retour=await window.JSZip.loadAsync(await fetch(folder+'SortParagraphs/14-SortParagraphs.h5p').then(r=>r.arrayBuffer()));
 const file=imageNative.media.type.params.file,png=new Blob([await retour.file('content/'+file.path).async('uint8array')],{type:file.mime});
 file.dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(png);});
 const media=new Map([[file.path,png]]);
 const fixedPool=await generateCrosswordGridImages([...native.words,{answer:'MADRID',clue:'Espagne'}],native.theme,{poolSize:2},'ROME');
 check(fixedPool.placements.length===2,'Le tirage doit conserver les mots fixes');
 const unicodePackage=await packageActivity({moduleKey:'Crossword',content:{words:[{answer:'ΑΘΗΝΑ',clue:'Athènes'},{answer:'ΑΡΗΣ',clue:'Arès'}]}});
 const unicodeZip=await window.JSZip.loadAsync(unicodePackage.bytes);
 check(JSON.parse(await unicodeZip.file('content/content.json').async('string')).words[0].answer==='ΑΘΗΝΑ','Alphabet grec perdu');
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Crossword',titleKey:'h5p_crossword_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['fixes','image','audio','video']) {
   const c=structuredClone(native);
   if(kind==='image'){c.words[1].extraClue=structuredClone(imageNative.media.type);c.words.forEach(w=>w.fixWord=false);c.theme.backgroundImage=structuredClone(file);}
   if(['audio','video'].includes(kind)){
    const zipMedia=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/glisser-mots/sucrerie-glisser-mots-'+kind+'.h5p').then(r=>r.arrayBuffer()));
    const source=JSON.parse(await zipMedia.file('content/content.json').async('string')).media.type;
    c.words[1].extraClue=source;
    for(const entry of Object.values(zipMedia.files).filter(f=>f.name.startsWith('content/') && f.name!=='content/content.json' && !f.dir))media.set(entry.name.slice(8),await entry.async('blob'));
   }
   await open(c);section('general');set('solutionWord','ROME');section('words');set('words.0.fixWord',kind==='fixes');
   section('settings');set('behaviour.poolSize','');set('behaviour.scoreWords',kind==='fixes');set('behaviour.enableInstantFeedback',false);
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   check(saved.data.solutionWord==='ROME' && saved.data.words[0].fixWord===(kind==='fixes'),'Option perdue');
   const pkg=await packageActivity({moduleKey:'Crossword',title:'Mots croisés — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.l10n.extraClue==='Indice RELU','Libellé perdu');
   if(kind==='image')check(content.words[1].extraClue.library==='H5P.Image 1.1' && zip.file('content/'+file.path),'Indice image perdu');
   if(['audio','video'].includes(kind)){cases.push({key:'Crossword',id:'mots-croises-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),mediaOnly:true,required:[]});continue;}
   if(kind==='image')saved.data.words[1].extraClue.params.file.dataURL=file.dataURL;
   const images=await generateCrosswordGridImages(saved.data.words,content.theme,content.behaviour,content.solutionWord);
   check(images.emptyGrid && images.solutionGrid && !images.unplacedWords.length,'Grille incomplète');
   if(kind==='fixes')check(images.placements.some(p=>p.word.answer==='ROME' && p.row===0 && p.col===2 && p.direction==='down'),'Position fixe perdue sur papier');
   if(kind==='image')check(images.placements.some(p=>p.word.extraClue?.params?.file?.dataURL?.startsWith('data:image/')),'Indice non résolu dans les définitions papier');
   saved.data._gridImage=images.emptyGrid;saved.data._solutionGridImage=images.solutionGrid;saved.data._cluePlacements=images.placements;
   cases.push({key:'Crossword',id:'mots-croises-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','PARIS','ROME'],placements:images.placements});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
