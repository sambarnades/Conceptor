/** Vidéo native : géométrie, interactions, signets, résumé et piste embarquée. */
export async function verifierVideoNative(){
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');const {getAllMedia}=await import('../../js/h5p/image-manager.js');
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const {loadTranslations}=await import('../../js/core/translation.js');const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']){await loadTranslations(lang);for(const nombreElements of ['', '2']){const prompt=buildActivityPrompt('prompt_interactive_video',{nombreElements,quoi:'Capitales',isAdvanced:!!nombreElements});for(const key of ['displayMode','bookmarks','endscreens','summary.displayAt','pause:false'])check(prompt.includes(key),lang+' : '+key+' absent du prompt');}}await loadTranslations('fr');
 const folder='/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/InteractiveVideo/';
 const native=await fetch(folder+'content.json').then(r=>r.json());
 const archive=await window.JSZip.loadAsync(await fetch(folder+'27-InteractiveVideo.h5p').then(r=>r.arrayBuffer()));const media=new Map();
 for(const [path,file] of Object.entries(archive.files))if(!file.dir&&/^content\/(images|audios|videos)\//.test(path))media.set(path.slice(8),await file.async('blob'));
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');
 const stream=canvas.captureStream(12),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(r=>{recorder.onstop=r;});recorder.start();
 for(let i=0;i<72;i++){ctx.fillStyle='#173d89';ctx.fillRect(0,0,640,360);ctx.fillStyle='white';ctx.font='36px sans-serif';ctx.fillText('Capitales — RELU',100,150);ctx.fillStyle='#ef4444';ctx.fillRect(i*8,260,30,30);await new Promise(r=>setTimeout(r,85));}recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
 const video=new File(chunks,'capitales.webm',{type:'video/webm'});
 const host=document.createElement('div');document.body.append(host);const cases=[];
 const open=async value=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'InteractiveVideo'},host,value),'Ouverture vidéo refusée');};
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,'Champ absent '+path);if(typeof value==='boolean'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const upload=async(path,file)=>{const input=host.querySelector(`[data-path="${path}"] input[type="file"]`);check(input,'Upload absent '+path);const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,250));};
 try{
  await open({title:'Vidéo générée',videoSource:{url:'https://example.invalid/video.webm',mime:'video/webm'},interactions:[{timestamp:1,pause:false,type:'truefalse',question:'Paris est en France.',correct:true}],override:{retryButton:'off'},bookmarks:[{time:2,label:'Repère généré'}]});
  host.querySelector('[data-action="video-native"]').click();for(let n=0;n<300&&!host.querySelector('[data-section-id="labels"]');n++)await new Promise(r=>setTimeout(r,20));
  check(host.querySelector('[data-section-id="labels"]'),'Options complètes du modèle généré absentes');const generated=await saveChanges();check(generated?.data.override.retryButton==='off'&&generated.data.interactiveVideo.assets.bookmarks[0].time===2,'Options générées perdues au passage natif');
  for(const kind of ['affiche','bouton']){
   const input=structuredClone(native);input.interactiveVideo.summary.task.params.summaries[0].summary=['Paris est en France.','Paris est en Italie.'];
   input.interactiveVideo.assets.bookmarks=[{time:2,label:'Repère RELU'}];input.interactiveVideo.assets.endscreens=[{time:5.8,label:'Bilan RELU'}];
   await open(input);await upload('interactiveVideo.video.files',video);
   const quality=(index,label)=>{const el=host.querySelector(`[data-path="interactiveVideo.video.files"] [data-native-source="quality"][data-source-index="${index}"]`);check(el,'Libellé de source absent');el.value=label;el.dispatchEvent(new Event('change',{bubbles:true}));};quality(0,'Source A');
   host.querySelector('[data-path="interactiveVideo.video.files"] [data-action="add-video-source"]').click();await upload('interactiveVideo.video.files.1',video);quality(1,'Source B');
   await upload('interactiveVideo.video.textTracks.videoTrack.0.track',new File(['WEBVTT\n\n00:00.000 --> 00:06.000\nCapitales RELU\n'],'capitales.vtt',{type:'text/vtt'}));
   set('interactiveVideo.video.textTracks.videoTrack.0.srcLang','fr');set('interactiveVideo.video.startScreenOptions.shortStartDescription','Observe puis réponds. RELU');
   host.querySelector('[data-section-id="interactions"] > button').click();const p='interactiveVideo.assets.interactions.0';
   set(p+'.duration.from',0.3);set(p+'.duration.to',2);set(p+'.displayType',kind==='affiche'?'poster':'button');set(p+'.label','Capitale RELU');set(p+'.x',10);set(p+'.y',10);set(p+'.width',80);set(p+'.height',75);
   set(p+'.action.params.question','Quelle ville est la capitale française ? RELU');set(p+'.action.metadata.title','Capitale française RELU');
   host.querySelector('[data-section-id="options"] > button').click();set('override.showBookmarksmenuOnLoad',false);set('override.showRewind10',true);set('override.retryButton',kind==='affiche'?'on':'off');
   let saved=await saveChanges();check(saved,'Sauvegarde vidéo refusée '+host.innerText.slice(-5000));await open(saved.data);saved=await saveChanges();check(saved,'Réouverture vidéo refusée '+host.innerText.slice(-3000));
   check(saved.data.interactiveVideo.video.files.map(s=>s.metadata?.qualityName).join() === 'Source A,Source B','Sources ou qualités perdues');
   const q=saved.data.interactiveVideo.assets.interactions[0];check(!('seekTo' in q.adaptivity.correct)&&!('seekTo' in q.adaptivity.wrong),'Saut désactivé transformé en saut vers zéro');check(!('showSolutionButton' in saved.data.override),'Héritage des solutions remplacé par un forçage');check(q.action.subContentId===native.interactiveVideo.assets.interactions[0].action.subContentId&&q.duration.from===0.3&&q.x===10,'Identifiant, temps ou placement perdu');
   const pkg=await packageActivity({moduleKey:'InteractiveVideo',title:'Vidéo '+kind,content:saved.data,mediaFiles:new Map([...media,...getAllMedia()])});
   const zip=await window.JSZip.loadAsync(pkg.bytes),nativeOut=JSON.parse(await zip.file('content/content.json').async('string'));check(nativeOut.interactiveVideo.assets.bookmarks[0].time===2,'Signet perdu');
   const poster=saved.data.interactiveVideo.video.startScreenOptions.poster;poster.dataURL='data:image/png;base64,'+await archive.file('content/'+poster.path).async('base64');
   cases.push({key:'InteractiveVideo',id:'video-native-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Paris','Rome','Correction']});
  }
  return cases;
 }finally{destroyEditor();host.remove();}
}
