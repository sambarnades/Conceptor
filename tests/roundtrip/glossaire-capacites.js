/** Accordéon natif : texte, niveaux de titres, identifiants et réouverture. */
export async function verifierGlossaire() {
 const {initJsonEditor,saveChanges,destroyEditor}=await import('../../js/editor/index.js');
 const {packageActivity}=await import('../../js/core/package-activity.js');
 const {loadTranslations}=await import('../../js/core/translation.js');
 const {buildActivityPrompt}=await import('../../js/services/prompt-generator.js');
 const {default:processor}=await import('../../js/h5p/processors/Glossary.js');
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
  await loadTranslations(lang);
  for(const nombreQuestions of ['', '3']) {
   const prompt=buildActivityPrompt('prompt_accordion',{nombreQuestions,quoi:'Révolution française',isAdvanced:!!nombreQuestions});
   check(['panels','hTag','100'].every(k=>prompt.includes(k)),lang+' : structure absente');
  }
 }
 await loadTranslations('fr');
 const native=await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Glossary/content.json').then(r=>r.json());
 const snapshot=JSON.stringify(native);const processed=processor.process(native);
 check(JSON.stringify(native)===snapshot,'Le processeur mute la source');
 check(processed.panels[0].content.subContentId===native.panels[0].content.subContentId,'Identifiant réécrit');
 const host=document.createElement('div');document.body.append(host);
 const open=async data=>{destroyEditor();host.innerHTML='';check(await initJsonEditor({type:'h5p',moduleKey:'Glossary',titleKey:'h5p_glossary_name'},host,data),'Éditeur absent');};
 const set=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);check(el,path);if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cases=[];
 try {
  for(const kind of ['h2','h4']) {
   await open(structuredClone(native));host.querySelector('[data-section-id="entries"] > button').click();
   set('items.0.text','RELU : le roi détient les pouvoirs.');
   host.querySelector('[data-section-id="settings"] > button').click();set('hTag',kind);
   let saved=await saveChanges();check(saved,'Sauvegarde refusée');await open(saved.data);saved=await saveChanges();
   check(saved.data.hTag===kind && saved.data.panels[0].content.params.text.includes('RELU'),'Retouche perdue');
   const pkg=await packageActivity({moduleKey:'Glossary',title:'Glossaire — '+kind,content:saved.data});
   const zip=await window.JSZip.loadAsync(pkg.bytes),content=JSON.parse(await zip.file('content/content.json').async('string'));
   check(content.panels.length===6 && content.panels[0].content.subContentId===native.panels[0].content.subContentId,'Identifiant ou entrée perdu');
   check(content.hTag===kind,'Niveau perdu');
   cases.push({key:'Glossary',id:'glossaire-'+kind,data:saved.data,paquet:Array.from(pkg.bytes),required:['RELU','Constitution','1791']});
  }
  const simple=await packageActivity({moduleKey:'Glossary',content:[{title:'Terme',text:'Définition'}]});
  check(simple.bytes.length>0,'Ancien tableau refusé');
  return cases;
 }finally{destroyEditor();host.remove();}
}
