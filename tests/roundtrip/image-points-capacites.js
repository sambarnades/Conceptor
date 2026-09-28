/** Image à points : icônes, plein écran et tous les blocs multimédias. */
export async function verifierImagePoints() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {await loadTranslations(lang);for(const nombreElements of ['', '3'])check(buildActivityPrompt('prompt_image_hotspots',{nombreElements,quoi:'Trois zones',isAdvanced:!!nombreElements}).includes('alwaysFullscreen'),lang+' : prompt incomplet');}
 await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/ImageHotspots/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const source=await window.JSZip.loadAsync(await fetch(folder+'22-ImageHotspots.h5p').then(r=>r.arrayBuffer()));
 const file=native.image,blob=new Blob([await source.file('content/'+file.path).async('uint8array')],{type:file.mime});
 const dataURL=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});
 const media=new Map([[file.path,blob]]),nodes={};
 for(const kind of ['audio','video']) {
  const zip=await window.JSZip.loadAsync(await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/glisser-mots/sucrerie-glisser-mots-'+kind+'.h5p').then(r=>r.arrayBuffer()));
  nodes[kind]=JSON.parse(await zip.file('content/content.json').async('string')).media.type;
  for(const entry of Object.values(zip.files).filter(f=>f.name.startsWith('content/') && f.name!=='content/content.json' && !f.dir))media.set(entry.name.slice(8),await entry.async('blob'));
 }
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'ImageHotspots',titleKey:'h5p_image_hotspots_name'},host,data),'Éditeur absent');};
 const section=id=>host.querySelector(`[data-section-id="${id}"] > button`).click();
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const cases=[];
 try {
  for(const kind of ['icones','image']) {
   const c=structuredClone(native);c.title='Trois points RELU';c.image.dataURL=dataURL;c.globalIconType='icon';
   c.hotspots[0].content.push({library:'H5P.Text 1.1',params:{text:'Deuxième paragraphe RELU'},subContentId:'11111111-1111-4111-8111-111111111111'});
   c.hotspots[1].content.push({library:'H5P.Image 1.1',params:{file:structuredClone(file),alt:'Trois rectangles RELU'},subContentId:'22222222-2222-4222-8222-222222222222'});
   c.hotspots[1].content.push(structuredClone(nodes.audio));c.hotspots[2].content.push(structuredClone(nodes.video));
   if(kind==='image'){c.hotspots[0].hotspotIconImage=structuredClone(file);c.globalIconImage=structuredClone(file);}
   await open(c);section('hotspots');set('hotspots.0.header','Premier point RELU');set('hotspots.0.alwaysFullscreen',kind==='image');set('hotspots.0.hotspotIconType',kind==='image'?'image':'icon');
   if(kind==='icones'){set('hotspots.0.hotspotIcon','check');set('hotspots.0.hotspotColor','#cc3300');}
   host.querySelector('[data-section-id="hotspots"] .json-editor__nav-subitem[data-index="1"]').click();
   set('hotspots.1.content.2._origParams.playerMode','full');
   set('hotspots.1.content.2._origParams.autoplay',false);
   host.querySelector('[data-section-id="hotspots"] .json-editor__nav-subitem[data-index="2"]').click();
   set('hotspots.2.content.1._origParams.playback.loop',true);
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   const pkg=await packageActivity({moduleKey:'ImageHotspots',title:'Image à points — '+kind,content:saved.data,mediaFiles:media});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.hotspots[0].content[0].subContentId===native.hotspots[0].content[0].subContentId,'Identifiant perdu');
   check(content.hotspots[0].alwaysFullscreen===(kind==='image') && content.hotspots[0].hotspotIconType===(kind==='image'?'image':'icon'),'Réglages perdus');
   check(content.hotspots[1].content[2].params.playerMode==='full' && content.hotspots[2].content[1].params.playback.loop,'Options média perdues');
   check(content.hotspots[1].content.length===3 && content.hotspots[2].content[1].library==='H5P.Video 1.6','Médias perdus');
   saved.data._backgroundImage=dataURL;saved.data.hotspots[1].content[1].params.file.dataURL=dataURL;
   cases.push({key:'ImageHotspots',id:'image-points-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Deuxième paragraphe','Trois rectangles']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
