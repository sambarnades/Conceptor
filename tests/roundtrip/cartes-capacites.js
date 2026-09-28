/** Recette navigateur du lot cartes : vrais widgets, sauvegarde, ZIP et réouverture. */
export async function verifierCartesCapacites() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const { getAllMedia } = await import('../../js/h5p/image-manager.js');
    const host=document.createElement('div');document.body.append(host);
    const controle=(ok,message)=>{if(!ok)throw Error(message);};
    const section=id=>{const b=host.querySelector(`[data-section-id="${id}"] > button`);controle(b,`Section ${id} absente`);b.click();};
    const saisir=(path,value)=>{const el=host.querySelector(`[data-path="${path}"]`);controle(el,`Champ ${path} absent`);if(el.type==='checkbox'){if(el.checked!==value)el.click();}else{if(el.isContentEditable)el.textContent=value;else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
    const notice=key=>({type:'h5p',moduleKey:key,titleKey:{DialogCards:'h5p_dialog_cards_name',Flashcards:'h5p_flashcards_name',Summary:'h5p_summary_name',SingleChoiceSet:'h5p_single_choice_set_name'}[key]});
    const ouvrir=async(key,data,blob,options={})=>{destroyEditor();host.innerHTML='';controle(await initJsonEditor({...notice(key),blob},host,data,options),'Éditeur non initialisé : '+key);};
    const sauver=async()=>{const result=await saveChanges();controle(result,'Sauvegarde rejetée');return result.data;};
    const canvas=document.createElement('canvas');canvas.width=120;canvas.height=80;const ctx=canvas.getContext('2d');['#173d89','#fff','#e43b44'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(40*i,0,40,80);});
    const png=await new Promise(r=>canvas.toBlob(r,'image/png'));
    const image={path:'images/drapeau.png',mime:'image/png',width:120,height:80,dataURL:canvas.toDataURL(),copyright:{title:'Drapeau tricolore',author:'Atelier de test',license:'CC BY',version:'4.0'}};
    const dialogue={title:'Associer un pays et sa capitale',description:'Observe le drapeau, écoute et nomme la capitale.',dialogs:[{text:'France',answer:'Paris',image,tips:{front:'La Seine traverse cette ville.',back:'Capitale française.'}},{text:'Italie',answer:'Rome'}],mode:'normal'};
    await ouvrir('DialogCards',dialogue);section('dialogs');
    // Sonde parlée produite localement par la voix française du système ;
    // le même fichier permet la recette de lecture dans Éléa.
    const bytes=new Uint8Array(await (await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/carte-capitale.wav')).arrayBuffer());
    // Un en-tête WAV seul est un fichier valide pour l'upload, mais aucun son
    // ne peut être lu. Vérifier le décodage et le signal avant le dépôt.
    const audioContext=new AudioContext();
    try {
        const decoded=await audioContext.decodeAudioData(bytes.slice().buffer);
        controle(decoded.duration>1,'Sonde audio trop courte ou vide');
        controle(decoded.getChannelData(0).some(v=>Math.abs(v)>0.01),'Sonde audio silencieuse');
    } finally { await audioContext.close(); }
    const input=host.querySelector('[data-path="dialogs.0.audio"] input[type="file"]');controle(input,'Widget audio de carte absent');const dt=new DataTransfer();dt.items.add(new File([bytes],'carte.wav',{type:'audio/wav'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    for(let i=0;i<100&&!host.querySelector('audio')?.getAttribute('src');i++)await new Promise(r=>setTimeout(r,20));
    controle(host.querySelector('audio')?.getAttribute('src'),'Audio téléversé non prévisualisable');
    // Départs/retours rapides entre cartes puis réglages avancés.
    for(const i of [1,0,1,0])host.querySelector(`.json-editor__nav-items[data-section-id="dialogs"] [data-index="${i}"]`).click();
    section('settings');saisir('mode','repetition');saisir('behaviour.maxProficiency',3);saisir('behaviour.quickProgression',true);saisir('behaviour.scaleTextNotCard',false);
    let edited=await sauver();const media=new Map(getAllMedia());media.set(image.path,png);
    const paquet=await packageActivity({moduleKey:'DialogCards',content:edited,title:'Cartes avec audio',mediaFiles:media});
    const zip=await window.JSZip.loadAsync(paquet.bytes);const content=JSON.parse(await zip.file('content/content.json').async('string'));
    controle(content.dialogs[0].audio?.length===1,'Audio perdu par le processeur');controle(zip.file('content/'+content.dialogs[0].audio[0].path),'Audio absent du ZIP');controle(!JSON.stringify(content).includes('blob:'),'URL temporaire dans le ZIP');
    const blob=new Blob([paquet.bytes]);await ouvrir('DialogCards',content,blob);section('dialogs');controle(host.querySelector('audio')?.src.startsWith('blob:'),'Audio natif non réhydraté');controle(host.querySelector('img')?.src.startsWith('data:image/'),'Image native non réhydratée');
    section('settings');controle(host.querySelector('[data-path="mode"]').value==='repetition','Mode perdu');controle(host.querySelector('[data-path="behaviour.maxProficiency"]').value==='3','Progression perdue');
    edited=await sauver();await ouvrir('DialogCards',edited,blob);section('dialogs');controle(host.querySelector('audio')?.src.startsWith('blob:'),'Audio de seconde réouverture absent');
    // Annulation via le contrat de l'hôte : la copie fournie ne doit pas être mutée.
    const avant=JSON.stringify(edited);saisir('dialogs.0.answer','Modification à annuler');destroyEditor();controle(JSON.stringify(edited)===avant,'Annulation : source mutée');
    const flash={title:'Nommer les capitales',description:'Écris la capitale avant de retourner la carte.',cards:[{text:'France',answer:'Paris',tip:'Pense à la Seine.',image},{text:'Italie',answer:'Rome'}],showSolutionsRequiresInput:true,caseSensitive:true,randomCards:true};
    await ouvrir('Flashcards',flash);section('settings');saisir('behaviour.showSolutionsRequiresInput',false);saisir('behaviour.caseSensitive',false);saisir('behaviour.randomCards',false);const flashEdited=await sauver();await ouvrir('Flashcards',flashEdited);section('settings');controle(host.querySelector('[data-path="behaviour.showSolutionsRequiresInput"]').checked===false,'Saisie avant solution réactivée');
    const summary={intro:'Choisis la bonne affirmation.',summaries:[{summary:['Paris est la capitale de la France.','Paris est la capitale de l’Italie.'],tip:'Repère le pays du drapeau tricolore.'}]};
    await ouvrir('Summary',summary);section('summaries');saisir('summaries.0.tip','Repère le pays représenté par le drapeau.');const summaryEdited=await sauver();await ouvrir('Summary',summaryEdited);section('summaries');controle(host.querySelector('[data-path="summaries.0.tip"]').textContent.includes('Repère le pays') || host.querySelector('[data-path="summaries.0.tip"]').value?.includes('Repère le pays'),'Indice perdu');
    const single={choices:[{question:'Capitale de la France ?',answers:['Paris','Rome','Madrid']}],behaviour:{autoContinue:true,timeoutCorrect:1200,timeoutWrong:2300}};
    await ouvrir('SingleChoiceSet',single);section('settings');saisir('behaviour.timeoutCorrect',0);saisir('behaviour.timeoutWrong',2300);const singleEdited=await sauver();await ouvrir('SingleChoiceSet',singleEdited);section('settings');controle(host.querySelector('[data-path="behaviour.timeoutCorrect"]').value==='0','Délai zéro perdu');
    destroyEditor();host.remove();
    const cases = [
        {key:'DialogCards',id:'dialogues-audio-edites',data:edited,required:['Observe le drapeau','Atelier de test','4.0']},
        {key:'Flashcards',id:'flashcards-editees',data:flashEdited,required:['Écris la capitale','Atelier de test','4.0']},
        {key:'Summary',id:'resume-indice',data:summaryEdited,required:['Repère le pays']},
        {key:'SingleChoiceSet',id:'choix-unique-delais',data:singleEdited,required:['Paris','Rome']}
    ];
    for(const c of cases) {
        const p=c.key==='DialogCards'?paquet:await packageActivity({moduleKey:c.key,content:c.data,title:c.id,mediaFiles:media});
        c.paquet=Array.from(p.bytes);
    }
    return cases;
}
