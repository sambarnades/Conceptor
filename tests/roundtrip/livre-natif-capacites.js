/** Livre natif : édition, paramètres des blocs, variantes de progression et médias. */
export async function verifierLivreNatif(){
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {getSchemaForType}=await import('../../js/editor/content-detector.js');
 const {getValidationErrors}=await import('../../js/editor/validators.js');
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/';
 const native=await fetch(folder+'InteractiveBook/content.json').then(r=>r.json());
 const media=new Map();
 const readArchive=async url=>{const zip=await window.JSZip.loadAsync(await fetch(url).then(r=>r.arrayBuffer()));for(const [path,file] of Object.entries(zip.files))if(!file.dir&&/^content\/(images|audios|videos)\//.test(path))media.set(path.slice(8),await file.async('blob'));return JSON.parse(await zip.file('content/content.json').async('string'));};
 await readArchive(folder+'InteractiveBook/26-InteractiveBook.h5p');
 const vf=await fetch(folder+'TrueFalse/content.json').then(r=>r.json());delete vf.media;
 const video=(await readArchive('/tests/sonde-parcours/audit-activites-2026-09-11/glisser-mots/sucrerie-glisser-mots-video.h5p')).media.type;
 video.params.a11y=[{label:'Français RELU',kind:'captions',srcLang:'fr'}];
 const host=document.createElement('div');document.body.append(host);
 const ouvrir=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'InteractiveBook'},host,data),'Ouverture livre natif refusée');};
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,'Champ absent '+path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try{
  await ouvrir({title:'Livre généré',chapters:[{title:'Page générée',content:[{type:'text',text:'Texte à compléter.'}]}]});
  host.querySelector('[data-action="book-native"]').click();
  for(let n=0;n<300&&!host.querySelector('[data-section-id="labels"]');n++)await new Promise(r=>setTimeout(r,20));
  check(host.querySelector('[data-section-id="labels"]'),'Réglages complets du livre généré absents');
  let converted=await saveChanges();check(converted?.data.chapters[0].params.content[0].content.params.text.includes('Texte à compléter.'),'Conversion du livre généré perd son texte');
  // Contre-épreuve : une simple retouche ne change aucune autre feuille native.
  await ouvrir(native);host.querySelector('[data-section-id="chapters"] > button').click();set('chapters.0.metadata.title','Page relue dans Caramel');
  let saved=await saveChanges();check(saved,'Première sauvegarde refusée');await ouvrir(saved.data);saved=await saveChanges();check(saved,'Seconde sauvegarde refusée');
  const original=structuredClone(native);original.chapters[0].metadata.title='Page relue dans Caramel';check(JSON.stringify(saved.data)===JSON.stringify(original),'Un champ non retouché a changé');
  const schema=getSchemaForType('InteractiveBook',native);
  check(getValidationErrors({...native,chapters:[]},schema).length>0,'Livre vide accepté');
  const fifty={...native,chapters:Array.from({length:50},()=>structuredClone(native.chapters[1]))};check(!getValidationErrors(fifty,schema).length,'50 pages refusées');fifty.chapters.push(fifty.chapters[0]);check(getValidationErrors(fifty,schema).some(e=>e.path==='chapters'),'51 pages acceptées');
  for(const kind of ['manuel','automatique']){
   const input=structuredClone(native);input.chapters[1].params.content.push({content:{library:'H5P.TrueFalse 1.8',params:structuredClone(vf),subContentId:crypto.randomUUID(),metadata:{title:'Capitale espagnole',license:'U'}},useSeparator:'enabled'},{content:structuredClone(video),useSeparator:'auto'});
   await ouvrir(input);host.querySelector('[data-section-id="chapters"] > button').click();set('chapters.0.metadata.title','Page RELU Caramel');
   const row='chapters.0.params.content.0.content.params.columns';
   set(row+'.0.width',45);set(row+'.1.width',55);
   set(row+'.1.content.params.content.1.params.summaries.0.tip','Indice RELU : trois couleurs.');
   host.querySelector('[data-section-id="options"] > button').click();set('behaviour.progressAuto',kind==='automatique');set('behaviour.enableRetry',kind==='manuel');
   host.querySelector('[data-section-id="chapters"] > button').click();host.querySelector('[data-section-id="chapters"] [data-index="1"]').click();
   const trackPath='chapters.1.params.content.2.content.params.a11y.0.track';const fileInput=host.querySelector(`[data-path="${trackPath}"] input[type="file"]`);check(fileInput,'Champ de piste absent');
   const transfer=new DataTransfer();transfer.items.add(new File(['WEBVTT\n\n00:00.000 --> 00:02.000\nDrapeau RELU\n'],'sous-titres.vtt',{type:'text/vtt'}));fileInput.files=transfer.files;fileInput.dispatchEvent(new Event('change',{bubbles:true}));
   for(let n=0;n<100&&!host.querySelector(`[data-path="${trackPath}"] span`).textContent;n++)await new Promise(r=>setTimeout(r,20));
   saved=await saveChanges();check(saved,'Sauvegarde variante refusée '+host.innerText.slice(-3000));await ouvrir(saved.data);saved=await saveChanges();check(saved,'Réouverture variante refusée');
   check(saved.data.chapters[0].params.content[0].content.params.columns[1].content.params.content[1].params.summaries[0].tip.includes('Indice RELU'),'Indice perdu');
   const pkg=await packageActivity({moduleKey:'InteractiveBook',title:'Livre '+kind,content:saved.data,mediaFiles:new Map([...media,...(await import('../../js/h5p/image-manager.js')).getAllMedia()])});
   const archiveOut=await window.JSZip.loadAsync(pkg.bytes);const track=saved.data.chapters[1].params.content[2].content.params.a11y[0].track;check((await archiveOut.file('content/'+track.path).async('string')).includes('Drapeau RELU'),'Piste non embarquée');
   // Les exports papier reçoivent les mêmes médias que le paquet, avec leur URL locale.
   const hydrate=async obj=>{if(!obj||typeof obj!=='object')return;if(obj.path&&media.has(obj.path)&&String(obj.mime||'').startsWith('image/'))obj.dataURL=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob([media.get(obj.path)],{type:obj.mime}));});for(const value of Object.values(obj))if(value&&typeof value==='object')await hydrate(value);};await hydrate(saved.data);
   cases.push({key:'InteractiveBook',id:'livre-natif-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Madrid','Correction']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
