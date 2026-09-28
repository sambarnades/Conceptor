/** Audit manuel des vrais paquets et de leurs champs face aux semantics embarqués. Hors CI. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { listH5pFixtures } from '../tests/roundtrip/fixtures-map.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const fixtures = await listH5pFixtures();
const port = 8158;
const server = spawn('python3',['tests/serveur-statique.py',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
try {
    for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/index.html`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch(); const page=await browser.newPage();
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
    const rapport=await page.evaluate(async fixtures=>{
        const { h5pModules }=await import('/js/core/definitions.js');
        const { packageActivity }=await import('/js/core/package-activity.js');
        const { normalizeDataForEditor,denormalizeDataForSave }=await import('/js/editor/content-detector.js');
        const { healJsonString }=await import('/js/h5p/json-healer.js');
        const { initJsonEditor, saveChanges, destroyEditor, getEditorState }=await import('/js/editor/index.js');
        const { loadJSZip }=await import('/js/core/lib-loader.js'); await loadJSZip();
        const canvas=document.createElement('canvas'); canvas.width=120;canvas.height=80;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#0056b3';ctx.fillRect(0,0,120,80);
        const png=await new Promise(r=>canvas.toBlob(r,'image/png'));
        // Vrai WAV PCM silencieux pour tester les octets embarqués sans appeler le TTS.
        const wav=new ArrayBuffer(844);const w=new DataView(wav);const text=(at,s)=>[...s].forEach((c,i)=>w.setUint8(at+i,c.charCodeAt(0)));
        text(0,'RIFF');w.setUint32(4,836,true);text(8,'WAVEfmt ');w.setUint32(16,16,true);w.setUint16(20,1,true);w.setUint16(22,1,true);w.setUint32(24,8000,true);w.setUint32(28,16000,true);w.setUint16(32,2,true);w.setUint16(34,16,true);text(36,'data');w.setUint32(40,800,true);
        const audio=new Blob([wav],{type:'audio/wav'});
        const cache=new Map();
        async function semantics(lib){
            if(!cache.has(lib)){const r=await fetch(`/js/vendor/h5p-libs/${lib.replace(' ','-')}/semantics.json`);cache.set(lib,r.ok?await r.json():null);}
            return cache.get(lib);
        }
        const reports=[];
        for(const [module,config]of Object.entries(h5pModules).filter(([,c])=>!c.hidden)){
            const report={module,fixtures:[],erreurs:[],champs:[]};reports.push(report);
            const available=fixtures.filter(f=>f.moduleKey===module);
            // Chaque exemple représente parfois un autre sous-type de question.
            for(const fixture of available){
                const entry={fichier:fixture.file,paquet:false,edition:false,anomalies:[],champs:[]};report.fixtures.push(entry);
                try{
                    const source=await(await fetch(`/assets/data/examples/${fixture.file}`)).text();
                    let raw; try { raw=JSON.parse(source); } catch { raw=JSON.parse(healJsonString(source)); }
                    const media=new Map();
                    function assets(v){if(!v||typeof v!=='object')return; if(typeof v.path==='string'&&/^images\//.test(v.path))media.set(v.path,png); for(const value of Object.values(v))assets(value);}
                    assets(raw);
                    if(module==='ImageHotspots'&&!raw.image){raw.image={path:'images/audit.png',mime:'image/png',width:120,height:80};media.set('images/audit.png',png);}
                    if(module==='FindTheHotspot'){
                        const settings=raw.imageHotspotQuestion?.backgroundImageSettings;
                        if(settings&&!settings.backgroundImage){settings.backgroundImage={path:'images/audit.png',mime:'image/png',width:120,height:80};media.set('images/audit.png',png);}
                    }
                    if(module==='Dictation'){raw.sentences.forEach((s,i)=>{s.sample=[{path:`audios/audit-${i}.wav`,mime:'audio/wav'}];delete s.sampleAlternative;media.set(`audios/audit-${i}.wav`,audio);});raw.tts={...(raw.tts||{}),slow:false};}
                    const packaged=await packageActivity({moduleKey:module,content:raw,mediaFiles:media,title:`Audit ${module}`});
                    const zip=await window.JSZip.loadAsync(packaged.bytes);const metadata=JSON.parse(await zip.file('h5p.json').async('string'));
                    const content=JSON.parse(await zip.file('content/content.json').async('string'));
                    const dep=metadata.preloadedDependencies.find(d=>d.machineName===metadata.mainLibrary);
                    const main=`${dep.machineName} ${dep.majorVersion}.${dep.minorVersion}`;
                    entry.bibliotheque=main;entry.paquet=true;entry.octets=packaged.bytes.length;
                    async function checkValue(v,f,path){
                        entry.champs.push(`${main}:${path}`);
                        if(f.type==='group'){if(f.fields?.length===1&&(f.fields[0].name===f.name||(f.fields[0].type==='library'&&v?.library)))return checkValue(v,f.fields[0],path);return check(v,f.fields,path);}
                        if(f.type==='list'){if(!Array.isArray(v)){entry.anomalies.push(`${path}: liste attendue`);return;}for(let i=0;i<v.length;i++)await checkValue(v[i],f.field,`${path}[${i}]`);return;}
                        if(f.type==='library'&&v?.library){const ss=await semantics(v.library);if(ss)await check(v.params,ss,`${path}(${v.library}).params`);else entry.anomalies.push(`${path}: semantics absent ${v.library}`);return;}
                        if(f.type==='text'&&typeof v!=='string')entry.anomalies.push(`${path}: texte attendu (${typeof v})`);
                        if(f.type==='boolean'&&typeof v!=='boolean')entry.anomalies.push(`${path}: booléen attendu (${typeof v})`);
                        if(f.type==='number'&&typeof v!=='number')entry.anomalies.push(`${path}: nombre attendu (${typeof v})`);
                        if(f.type==='image'&&v?.path&&!/^(https?:|data:)/.test(v.path)&&!zip.file(`content/${v.path}`))entry.anomalies.push(`${path}: image absente du ZIP`);
                    }
                    async function check(v,fields,path=''){
                        if(!v||typeof v!=='object'||!Array.isArray(fields))return;
                        const known=new Set(fields.map(f=>f.name));
                        for(const key of Object.keys(v))if(!known.has(key))entry.anomalies.push(`${path?path+'.':''}${key}: hors semantics`);
                        for(const field of fields){const value=v[field.name],p=`${path?path+'.':''}${field.name}`;if(value!==undefined)await checkValue(value,field,p);else if(!field.optional&&field.default===undefined&&field.type!=='group')entry.anomalies.push(`${p}: absent sans défaut`);}
                    }
                    await check(content,await semantics(main));
                    const schemaKey=/^QuizSet/.test(module)?'QuizSet':module;
                    // Aller-retour des données éditables, avec sérialisation JSON réelle.
                    const editor=normalizeDataForEditor(structuredClone(raw),schemaKey);
                    const saved=JSON.parse(JSON.stringify(denormalizeDataForSave(editor,schemaKey)));
                    const again=await packageActivity({moduleKey:module,content:saved,mediaFiles:media,title:`Audit ${module}`});
                    const z=await window.JSZip.loadAsync(again.bytes);
                    entry.edition=!!JSON.parse(await z.file('content/content.json').async('string'));
                    // Le premier exemple de chaque module traverse aussi le vrai formulaire,
                    // ses événements de saisie, sa validation et sa sauvegarde publique.
                    if(fixture===available[0]){
                        const host=document.createElement('div');document.body.appendChild(host);
                        try {
                            const opened=await initJsonEditor({type:'h5p',moduleKey:module,titleKey:config.name},host,raw);
                            if(!opened)throw Error('Ouverture du formulaire impossible');
                            const field=[...host.querySelectorAll('input[data-path],textarea[data-path],[contenteditable="true"][data-path]')]
                                .find(e=>/^(title|description|question|taskDescription|timeline.headline|items.0.title|hotspotName|intro|choices.0.question|figureDefinition|slides.0.title)$/.test(e.dataset.path));
                            if(!field)throw Error('Champ de retouche témoin absent: '+[...host.querySelectorAll('[data-path]')].map(e=>e.dataset.path).join(', '));
                            const token=`REToucheAUDIT${module}`;
                            const path=field.dataset.path;
                            if(field.isContentEditable)field.textContent=token;else field.value=token;
                            field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
                            const result=await saveChanges();
                            if(!result)throw Error(`Validation après retouche: ${JSON.stringify(getEditorState().validationErrors)}`);
                            const savedJson=JSON.parse(JSON.stringify(result.data));
                            const final=await packageActivity({moduleKey:module,content:savedJson,mediaFiles:media,title:token});
                            const finalZip=await window.JSZip.loadAsync(final.bytes);
                            const finalContent=await finalZip.file('content/content.json').async('string');
                            if(!JSON.stringify(savedJson).includes(token)||!finalContent.includes(token)&&!(path==='title'&&(await finalZip.file('h5p.json').async('string')).includes(token)))throw Error(`Retouche perdue: ${path}`);
                            destroyEditor();host.innerHTML='';
                            if(!await initJsonEditor({type:'h5p',moduleKey:module,titleKey:config.name},host,savedJson))throw Error('Réouverture impossible');
                            if(!JSON.stringify(getEditorState().currentData).includes(token))throw Error('Retouche perdue à la réouverture');
                            entry.formulaire={champ:path,saisie:true,sauvegarde:true,paquet:true,reouverture:true};
                        }finally{destroyEditor();host.remove();}
                    }
                }catch(e){report.erreurs.push({fixture:fixture.file,message:e.message});}
            }
            if(!available.length)report.erreurs.push({message:'Aucun exemple pour ce module actif'});
            report.champs=[...new Set(report.fixtures.flatMap(f=>f.champs.map(p=>p.replace(/\[\d+\]/g,'[]'))))];
            report.fixtures.forEach(f=>delete f.champs);
        }
        return reports;
    },fixtures.map(({moduleKey,file})=>({moduleKey,file})));
    const dir=resolve(root,'tests/sonde-parcours/audit-activites-2026-09-11');await mkdir(dir,{recursive:true});
    await writeFile(resolve(dir,'paquets-semantics.json'),JSON.stringify(rapport,null,2)+'\n');
    for(const r of rapport)console.log(`${r.module}: ${r.fixtures.filter(f=>f.paquet).length}/${r.fixtures.length} paquets, ${r.champs.length} chemins, ${r.erreurs.length} erreurs, ${r.fixtures.reduce((n,f)=>n+f.anomalies.length,0)} écarts à qualifier`);
}finally{await browser?.close();server.kill('SIGTERM');}
