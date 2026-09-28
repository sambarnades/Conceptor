/** Contrôles manuels hors CI : enregistrement, vrais paquets et DOCX/ODT/PDF.
 * Pas d'appel IA, TTS ou conversion distante. Les PDF utilisent le repli local.
 * Lancement : node tests/run_h5p_capabilities_documents.mjs [--all]
 * --all ajoute un exemple de chacune des 27 activités au contrôle ciblé.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { listH5pFixtures } from './roundtrip/fixtures-map.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const output = '/tmp/caramel-capacites-documents'; await mkdir(output, { recursive: true });
const fixtures = await listH5pFixtures();
const first = fixtures.filter((f, i, all) => all.findIndex(v => v.moduleKey === f.moduleKey) === i);
const port = 8171;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
const errors = [];
try {
    for (let i=0; i<100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r=>setTimeout(r,100)); }
    browser = await chromium.launch(); const page = await browser.newPage({ acceptDownloads: true });
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
    page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
    page.on('console', msg => { if(msg.type()==='error' && !msg.text().startsWith('Failed to load resource')) console.error(msg.text()); });
    page.on('dialog', async dialog => { errors.push(dialog.message()); console.error(dialog.message()); await dialog.dismiss(); });
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForSelector('#parcours-button');
    const cases = await page.evaluate(async ({first, all, cardsOnly, rowsOnly, coversOnly, checksOnly, generatedBook, gridsSort, chartsOnly, summaryOnly, dragWordsOnly, essayOnly, blanksOnly, markOnly, trueFalseOnly, multiChoiceOnly, singleChoiceOnly, flashOnly, dialogsOnly, dictationOnly, findWordsOnly, sortOnly, crosswordOnly, glossaryOnly, mixedQuizOnly, qcmQuizOnly, vfQuizOnly, dndOnly, timelineOnly, imagePointsOnly, findZoneOnly, findMultipleOnly, presentationOnly, nativeBookOnly, nativeVideoOnly}) => {
        const { loadTranslations } = await import('/js/core/translation.js'); await loadTranslations('fr');
        // Même couture que l'oracle documentaire existant : observer les vrais Blobs
        // destinés au téléchargement. Chromium limite les téléchargements automatiques
        // successifs ; leur autorisation UI ne fait pas partie du contrat de format.
        const createObjectURL = URL.createObjectURL.bind(URL);
        window.auditBlobs=[];
        URL.createObjectURL = blob => { if (blob instanceof Blob) window.auditBlobs.push(blob); return createObjectURL(blob); };
        const { preloadSanitizer } = await import('/js/export/sanitizer.js'); await preloadSanitizer();
        const { normalizeDataForEditor, denormalizeDataForSave } = await import('/js/editor/content-detector.js');
        const { initJsonEditor, saveChanges, destroyEditor } = await import('/js/editor/index.js');
        const { packageActivity } = await import('/js/core/package-activity.js');
        const { loadJSZip } = await import('/js/core/lib-loader.js'); await loadJSZip();
        if(nativeVideoOnly){const {verifierVideoNative}=await import('/tests/roundtrip/video-native-capacites.js');const cases=await verifierVideoNative();window.auditCases=cases;return cases.map(({data,...report})=>report);}
        if(nativeBookOnly){const {verifierLivreNatif}=await import('/tests/roundtrip/livre-natif-capacites.js');const cases=await verifierLivreNatif();window.auditCases=cases;return cases.map(({data,...report})=>report);}
        if (presentationOnly) {
            const { verifierPresentation } = await import('/tests/roundtrip/presentation-capacites.js');
            const cases = await verifierPresentation(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (findMultipleOnly) {
            const { verifierTrouverPlusieursZones } = await import('/tests/roundtrip/trouver-plusieurs-zones-capacites.js');
            const cases = await verifierTrouverPlusieursZones(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (findZoneOnly) {
            const { verifierTrouverZone } = await import('/tests/roundtrip/trouver-zone-capacites.js');
            const cases = await verifierTrouverZone(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (imagePointsOnly) {
            const { verifierImagePoints } = await import('/tests/roundtrip/image-points-capacites.js');
            const cases = await verifierImagePoints(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (timelineOnly) {
            const { verifierFrise } = await import('/tests/roundtrip/frise-capacites.js');
            const cases = await verifierFrise(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (dndOnly) {
            const { verifierGlisserDeposer } = await import('/tests/roundtrip/glisser-deposer-capacites.js');
            const cases = await verifierGlisserDeposer(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (vfQuizOnly) {
            const { verifierQuizVf } = await import('/tests/roundtrip/quiz-vf-capacites.js');
            const cases = await verifierQuizVf(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (qcmQuizOnly) {
            const { verifierQuizQcm } = await import('/tests/roundtrip/quiz-qcm-capacites.js');
            const cases = await verifierQuizQcm(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (mixedQuizOnly) {
            const { verifierQuizMixte } = await import('/tests/roundtrip/quiz-mixte-capacites.js');
            const cases = await verifierQuizMixte(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (glossaryOnly) {
            const { verifierGlossaire } = await import('/tests/roundtrip/glossaire-capacites.js');
            const cases = await verifierGlossaire(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (crosswordOnly) {
            const { verifierMotsCroises } = await import('/tests/roundtrip/mots-croises-capacites.js');
            const cases = await verifierMotsCroises(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (sortOnly) {
            const { verifierTriParagraphes } = await import('/tests/roundtrip/tri-paragraphes-capacites.js');
            const cases = await verifierTriParagraphes(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (findWordsOnly) {
            const { verifierMotsMeles } = await import('/tests/roundtrip/mots-meles-capacites.js');
            const cases = await verifierMotsMeles(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (dictationOnly) {
            const { verifierDictee } = await import('/tests/roundtrip/dictee-capacites.js');
            const cases = await verifierDictee(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (dialogsOnly) {
            const { verifierDialogues } = await import('/tests/roundtrip/dialogues-capacites.js');
            const cases = await verifierDialogues(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (flashOnly) {
            const { verifierFlashcards } = await import('/tests/roundtrip/flashcards-capacites.js');
            const cases = await verifierFlashcards(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (singleChoiceOnly) {
            const { verifierChoixUniques } = await import('/tests/roundtrip/choix-uniques-capacites.js');
            const cases = await verifierChoixUniques(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (multiChoiceOnly) {
            const { verifierChoixMultiple } = await import('/tests/roundtrip/choix-multiple-capacites.js');
            const cases = await verifierChoixMultiple(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (trueFalseOnly) {
            const { verifierVraiFaux } = await import('/tests/roundtrip/vrai-faux-capacites.js');
            const cases = await verifierVraiFaux(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (markOnly) {
            const { verifierMarquerMots } = await import('/tests/roundtrip/marquer-mots-capacites.js');
            const cases = await verifierMarquerMots(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (blanksOnly) {
            const { verifierTexteTrous } = await import('/tests/roundtrip/texte-trous-capacites.js');
            const cases = await verifierTexteTrous(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (essayOnly) {
            const { verifierRedaction } = await import('/tests/roundtrip/redaction-capacites.js');
            const cases = await verifierRedaction(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (dragWordsOnly) {
            const { verifierGlisserMots } = await import('/tests/roundtrip/glisser-mots-capacites.js');
            const cases = await verifierGlisserMots(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (summaryOnly) {
            const { verifierResume } = await import('/tests/roundtrip/resume-capacites.js');
            const cases = await verifierResume(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (chartsOnly) {
            const { verifierGraphiques } = await import('/tests/roundtrip/graphiques-capacites.js');
            const cases = await verifierGraphiques(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (gridsSort) {
            const { verifierGrillesEtTri } = await import('/tests/roundtrip/grilles-tri-capacites.js');
            const cases = await verifierGrillesEtTri(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (generatedBook) {
            const { verifierLivreGenere } = await import('/tests/roundtrip/livre-genere-capacites.js');
            const c = await verifierLivreGenere(); window.auditCases = [c];
            const { data, ...report } = c; return [report];
        }
        if (checksOnly) {
            const { verifierOptionsReponse } = await import('/tests/roundtrip/verification-capacites.js');
            const cases = await verifierOptionsReponse(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (coversOnly) {
            const { verifierLivreCouverture } = await import('/tests/roundtrip/livre-couverture-capacites.js');
            const cases = await verifierLivreCouverture(); window.auditCases = cases;
            return cases.map(({data, ...report}) => report);
        }
        if (rowsOnly) {
            const { verifierLivreColonnes } = await import('/tests/roundtrip/livre-colonnes-capacites.js');
            const c = await verifierLivreColonnes(); window.auditCases = [c];
            const { data, ...report } = c; return [report];
        }
        const drag = { taskDescription: 'Complète la phrase.', textField: 'Un *triangle:INDICE_SECRET* et un *rapport 1/2*.', distractors: '*cercle*' };
        // Saisie réelle du nouveau champ dans le formulaire, puis sauvegarde et réouverture.
        const host = document.createElement('div'); document.body.append(host);
        await initJsonEditor({type:'h5p',moduleKey:'DragTheWords',titleKey:'h5p_drag_the_words_name'},host,drag);
        host.querySelector('[data-section-id="text"] > button').click();
        const input = host.querySelector('[data-path="distractors"]');
        if (!input) throw Error('Champ distractors absent');
        if (input.isContentEditable) input.textContent='*DISTRACTEUR_RETENU*'; else input.value='*DISTRACTEUR_RETENU*';
        input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));
        const edited = await saveChanges(); if(!edited) throw Error('Sauvegarde impossible');
        destroyEditor();host.innerHTML='';
        await initJsonEditor({type:'h5p',moduleKey:'DragTheWords',titleKey:'h5p_drag_the_words_name'},host,edited.data);
        const reopened = await saveChanges();destroyEditor();host.remove();
        if (!JSON.stringify(reopened.data).includes('DISTRACTEUR_RETENU')) throw Error('Distracteur perdu à la réouverture');
        const essay = {taskDescription:'Explique le phénomène.', solution:{introduction:'Une réponse possible',sample:'REPONSE_MODELE_COMPLETE'},keywords:[{keyword:'Énergie',alternatives:['VARIANTE_RETENUE'],options:{points:0,occurrences:2,feedbackIncluded:'RETOUR_PRESENT',feedbackMissed:'RETOUR_ABSENT'}}]};
        const cases = [
            {key:'DragTheWords',id:'drag-edite',data:reopened.data,required:['DISTRACTEUR_RETENU','rapport 1/2']},
            {key:'Essay',id:'essay-edite',data:denormalizeDataForSave(normalizeDataForEditor(essay,'Essay'),'Essay'),required:['REPONSE_MODELE_COMPLETE','VARIANTE_RETENUE','RETOUR_PRESENT','RETOUR_ABSENT']},
            {key:'QuizSet',id:'quiz-imbrique',data:{title:'Quiz complet',questions:[{library:'H5P.DragText 1.10',params:reopened.data},{library:'H5P.Essay 1.5',params:essay}]},required:['DISTRACTEUR_RETENU','REPONSE_MODELE_COMPLETE']},
            {key:'CoursePresentation',id:'presentation-imbriquee',data:{slides:[{type:'quiz',title:'Exercice',exercise:{library:'H5P.DragText 1.10',...reopened.data}}]},required:['DISTRACTEUR_RETENU']},
            {key:'InteractiveBook',id:'livre-imbrique',data:{title:'Livre',chapters:[{title:'Chapitre',content:[{type:'exercise',library:'H5P.DragText 1.10',...reopened.data}]}]},required:['DISTRACTEUR_RETENU']}
        ];
        for (const c of cases.slice(0,3)) {
            const pkg = await packageActivity({moduleKey:c.key,content:c.data,title:c.id});
            const zip = await window.JSZip.loadAsync(pkg.bytes);
            const json = await zip.file('content/content.json').async('string');
            for (const token of c.required.filter(t=>!t.includes('/'))) if(!json.includes(token)) throw Error(`${c.id} : perte dans content.json : ${token}`);
        }
        if(all) for (const f of first) {
            const raw = await (await fetch(`/assets/data/examples/${f.file}`)).text();
            const {healJsonString}=await import('/js/h5p/json-healer.js');
            const data = JSON.parse(healJsonString(raw));
            cases.push({key:f.moduleKey,id:`catalogue-${f.moduleKey}`,data:denormalizeDataForSave(normalizeDataForEditor(data,f.moduleKey.startsWith('QuizSet')?'QuizSet':f.moduleKey),f.moduleKey.startsWith('QuizSet')?'QuizSet':f.moduleKey),required:[]});
        }
        const { verifierCartesCapacites } = await import('/tests/roundtrip/cartes-capacites.js');
        cases.push(...await verifierCartesCapacites());
        const selected=cardsOnly?cases.filter(c=>c.paquet):cases;
        window.auditCases=selected;
        return selected.map(({key,id,required,paquet})=>({key,id,required,paquet}));
    },{first:first.map(({moduleKey,file})=>({moduleKey,file})),all:process.argv.includes('--all'),cardsOnly:process.argv.includes('--cards-only'),rowsOnly:process.argv.includes('--rows-only'),coversOnly:process.argv.includes('--covers-only'),checksOnly:process.argv.includes('--checks-only'),generatedBook:process.argv.includes('--book-generated'),gridsSort:process.argv.includes('--grids-sort'),chartsOnly:process.argv.includes('--charts-only'),summaryOnly:process.argv.includes('--summary-only'),dragWordsOnly:process.argv.includes('--drag-words-only'),essayOnly:process.argv.includes('--essay-only'),blanksOnly:process.argv.includes('--blanks-only'),markOnly:process.argv.includes('--mark-only'),trueFalseOnly:process.argv.includes('--true-false-only'),multiChoiceOnly:process.argv.includes('--multi-choice-only'),singleChoiceOnly:process.argv.includes('--single-choice-only'),flashOnly:process.argv.includes('--flash-only'),dialogsOnly:process.argv.includes('--dialogs-only'),dictationOnly:process.argv.includes('--dictation-only'),findWordsOnly:process.argv.includes('--find-words-only'),sortOnly:process.argv.includes('--sort-only'),crosswordOnly:process.argv.includes('--crossword-only'),glossaryOnly:process.argv.includes('--glossary-only'),mixedQuizOnly:process.argv.includes('--mixed-quiz-only'),qcmQuizOnly:process.argv.includes('--qcm-quiz-only'),vfQuizOnly:process.argv.includes('--vf-quiz-only'),dndOnly:process.argv.includes('--dnd-only'),timelineOnly:process.argv.includes('--timeline-only'),imagePointsOnly:process.argv.includes('--image-points-only'),findZoneOnly:process.argv.includes('--find-zone-only'),findMultipleOnly:process.argv.includes('--find-multiple-only'),presentationOnly:process.argv.includes('--presentation-only'),nativeBookOnly:process.argv.includes('--native-book-only'),nativeVideoOnly:process.argv.includes('--native-video-only')});
    const report=[];
    if (process.argv.includes('--grids-sort')) await writeFile(resolve(output, 'grilles-tri-options.json'), JSON.stringify(cases.map(({paquet, ...c}) => c), null, 2) + '\n');
    for (let index=0; index<cases.length; index++) {
        const c=cases[index];
        if(c.paquet) await writeFile(resolve(output,`${c.id}.h5p`),new Uint8Array(c.paquet));
        if(c.mediaOnly){console.log(c.id+' : paquet vérifié');continue;}
        for(const [ext,fn] of [['docx','exportToDOCX'],['odt','exportToODT'],['pdf','exportToPDFLegacy']]) {
            console.log(`${c.id}.${ext}…`);
            await page.evaluate(async ({index,fn})=>{window.auditBlobs=[];const e=await import('/js/export/document-exporter.js');const c=window.auditCases[index];await e[fn](c.key,c.data);},{index,fn});
            const mime = {docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',odt:'application/zip',pdf:'application/pdf'}[ext];
            await page.waitForFunction(mime=>window.auditBlobs.some(b=>b.type===mime),mime,{timeout:20000});
            const base64=await page.evaluate(async mime=>{const blob=window.auditBlobs.find(b=>b.type===mime);const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.slice(i,i+16384));return btoa(s);},mime);
            const file=resolve(output,`${c.id}.${ext}`);await writeFile(file,Buffer.from(base64,'base64'));
            let text;
            if(ext==='pdf') text=execFileSync('pdftotext',[file,'-'],{encoding:'utf8'});
            else text=execFileSync('unzip',['-p',file,ext==='docx'?'word/document.xml':'content.xml'],{encoding:'utf8',maxBuffer:20*1024*1024});
            if(ext==='odt' && c.mathObjects)text+=execFileSync('unzip',['-p',file,'Object */content.xml'],{encoding:'utf8',maxBuffer:20*1024*1024});
            if(text.length<40) throw Error(`${c.id}.${ext}: vide`);
            if (ext === 'docx' && c.key === 'FindTheWords' && process.argv.includes('--grids-sort')) {
                const refs = [...text.matchAll(/<a:blip\b[^>]*r:embed="([^"]+)"/g)].map(m => m[1]);
                if (refs.length !== 2 || new Set(refs).size !== 2) throw Error(`${c.id}: la grille élève et le corrigé partagent leur image DOCX`);
            }
            if (c.key === 'SortParagraphs' && process.argv.includes('--grids-sort')) {
                if (ext === 'docx') {
                    const paragraphs = text.split('</w:p>').map(p => [...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join(''));
                    for (const expected of ['1. Début', '2. Observer', '3. Observer', '4. Fin']) if (!paragraphs.includes(expected)) throw Error(`Numéro DOCX incorrect : ${expected}`);
                } else if (ext === 'odt') {
                    for (const n of [1, 2, 3, 4]) if (!text.includes(`text:start-value="${n}"`)) throw Error(`Numéro ODT manquant : ${n}`);
                }
            }
            for(const token of c.required) if(!text.includes(token))throw Error(`${c.id}.${ext}: contenu manquant ${token}`);
            // Depuis 1b8ffe6f, l'indice DragText est imprimé À DESSEIN sur l'énoncé (« Indice 1 : … »),
            // comme le lecteur natif avant vérification. Il ne doit ni coller à la réponse, ni figurer au corrigé.
            if (c.required.includes('DISTRACTEUR_RETENU')) {
                const corrige = text.lastIndexOf('Correction');
                if (corrige === -1 || text.includes(':INDICE_SECRET') || text.slice(corrige).includes('INDICE_SECRET'))
                    throw Error(`${c.id}.${ext}: indice divulgué dans la réponse`);
                if (!text.includes('Indice 1 : INDICE_SECRET')) throw Error(`${c.id}.${ext}: indice absent de l'énoncé`);
            }
            report.push({activity:c.key,case:c.id,format:ext,file,verifiedTokens:c.required});
        }
        console.log(`${c.id} : DOCX, ODT, PDF lisibles${c.required.length?' ; retouches retrouvées':''}`);
    }
    if(errors.length)throw Error(errors.join('\n'));
    await writeFile(resolve(output,'rapport.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`${report.length} documents vérifiés ; aucun appel externe abouti. ${output}`);
} finally { await browser?.close(); server.kill('SIGTERM'); }
