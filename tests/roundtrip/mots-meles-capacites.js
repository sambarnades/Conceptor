/** Mots mêlés : export Éléa, huit orientations, accents, sauvegarde et grilles papier. */
export async function verifierMotsMeles() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {generateFindTheWordsGridImages,generateFindTheWordsGrid}=await import('../../js/renderers/find-the-words-grid-generator.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/FindTheWords.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '6']) {
   const prompt=buildActivityPrompt('prompt_find_the_words',{nombreQuestions,quoi:'Capitales',isAdvanced:!!nombreQuestions});
   check(prompt.includes('fillPool') && prompt.includes('preferOverlap'),lang+' : options absentes');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/FindTheWords/content.json').then(r=>r.json());
 native.l10n.wordListHeader='Villes RELU';
 check(processor.process(native).l10n.wordListHeader==='Villes RELU','Libellé perdu');
 for(const wordList of ['',[],[''], 'PARIS,ROME2','PARIS,NEW YORK']) {
  let refused=false;try{processor.process({...native,wordList});}catch{refused=true;}check(refused,'Liste invalide acceptée');
 }
 const orientations=Object.keys(native.behaviour.orientations);
 for(const key of orientations) {
  const behaviour={...native.behaviour,orientations:Object.fromEntries(orientations.map(k=>[k,k===key]))};
  const grid=generateFindTheWordsGrid(['ÉTÉ','ΑΘΗΝΑ','PARIS'],behaviour);
  check(grid?.wordLocations.length===3,'Placement incomplet : '+key);
 }
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'FindTheWords',titleKey:'h5p_find_the_words_name'},host,data),'Éditeur absent');host.querySelector('[data-section-id="settings"] > button').click();};
 const set=(path,value)=>{const el=host.querySelector(`[data-path="behaviour.${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['visible','cache']) {
   const data=structuredClone(native);data.wordList='PARIS,ROME,ΑΘΗΝΑ,ÉTÉ';
   await open(data);set('showVocabulary',kind==='visible');set('preferOverlap',kind==='visible');set('fillPool','XYZ');
   for(const key of orientations)set('orientations.'+key,key===(kind==='visible'?'horizontal':'verticalUp'));
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   check(saved.data.behaviour.showVocabulary===(kind==='visible'),'Vocabulaire perdu');
   const pkg=await packageActivity({moduleKey:'FindTheWords',title:'Mots mêlés — '+kind,content:saved.data});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.l10n.wordListHeader==='Villes RELU' && content.wordList.includes('ÉTÉ') && content.wordList.includes('ΑΘΗΝΑ'),'Libellé ou accents perdus');
   const images=await generateFindTheWordsGridImages(content.wordList,content.behaviour);
   check(images.emptyGrid && images.solutionGrid,'Grilles absentes');
   saved.data._gridImage=images.emptyGrid;saved.data._solutionGridImage=images.solutionGrid;
   cases.push({key:'FindTheWords',id:'mots-meles-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','PARIS','ROME'],grid:images.grid});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
