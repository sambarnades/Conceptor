/** Recette du Résumé depuis le contenu réellement réenregistré dans Éléa. */
export async function verifierResume() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { validateSchema } = await import('../../js/editor/validators.js');
    const { getSchemaForType } = await import('../../js/editor/content-detector.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const { formatContentForDocument } = await import('../../js/export/document-formatter.js');
    const check = (ok, message) => { if (!ok) throw Error(message); };
    const native = await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Summary/content.json').then(r => r.json());
    const { loadTranslations } = await import('../../js/core/translation.js');
    const { buildActivityPrompt } = await import('../../js/services/prompt-generator.js');
    for (const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
        await loadTranslations(lang);
        for (const nombreQuestions of ['', '2']) {
            const prompt=buildActivityPrompt('prompt_summary',{qui:'Enseignant',quoi:'Capitales',nombreQuestions,isAdvanced:!!nombreQuestions,ocrContent:'France : Paris. Italie : Rome.'});
            check(!prompt.includes('[NOMBRE_ELEMENTS]'), lang+' : nombre non interpolé');
            check(prompt.includes('100') && prompt.includes('`summary`') && prompt.includes('`tip`'), lang+' : règles Résumé absentes');
        }
    }
    await loadTranslations('fr');
    const schema = getSchemaForType('Summary');
    for (const summaries of [[], Array.from({length:101}, () => native.summaries[0]), [{summary:['Unique']}], [{summary:['Correct', '']}], [{summary:[]} ]]) {
        const invalid = {...native, summaries};
        check(!validateSchema(invalid, schema), 'Contenu invalide accepté par le schéma');
        let refused = false; try { await packageActivity({moduleKey:'Summary', content:invalid}); } catch { refused = true; }
        check(refused, 'Contenu invalide empaqueté');
    }
    check(validateSchema({...native, summaries:Array.from({length:100}, () => structuredClone(native.summaries[0]))}, schema), 'Borne 100 refusée');
    const host = document.createElement('div'); document.body.append(host);
    const open = async data => { destroyEditor(); host.innerHTML=''; check(await initJsonEditor({type:'h5p',moduleKey:'Summary',titleKey:'h5p_summary_name'},host,data), 'Éditeur absent'); host.querySelector('.json-editor__nav-section[data-section-id="summaries"] > button').click(); };
    try {
        const data = structuredClone(native);
        data.summaries.push({summary:['Rome est la capitale de l’Italie.', 'Madrid est la capitale de l’Italie.', 'Paris est la capitale de l’Italie.'],tip:'Pense au Colisée.',subContentId:'a52127f6-c9f5-48f8-99e0-55a04b572bb7'});
        await open(data);
        const field = host.querySelector('[data-path="summaries.0.tip"]'); check(field, 'Champ indice absent');
        const value = 'La Seine traverse la capitale française. RELU dans Caramel.';
        if (field.isContentEditable) field.textContent=value; else field.value=value;
        field.dispatchEvent(new Event('input',{bubbles:true})); field.dispatchEvent(new Event('change',{bubbles:true}));
        const saved = await saveChanges(); check(saved, 'Sauvegarde refusée');
        await open(saved.data);
        const reopened = await saveChanges(); check(reopened, 'Réouverture refusée');
        check(JSON.stringify(reopened.data).includes(value), 'Indice perdu après réouverture');
        const pkg = await packageActivity({moduleKey:'Summary',title:'Résumé des capitales',content:reopened.data});
        const zip = await window.JSZip.loadAsync(pkg.bytes); const content=JSON.parse(await zip.file('content/content.json').async('string'));
        check(content.summaries[0].tip.includes(value), 'Indice perdu dans le paquet');
        check(content.summaries[0].subContentId === native.summaries[0].subContentId, 'Identifiant natif perdu');
        const exercise={library:'H5P.Summary 1.10',...content};
        const cases=[
            {key:'Summary',id:'resume-capitales',data:content,paquet:Array.from(pkg.bytes)},
            {key:'CoursePresentation',id:'resume-presentation',data:{slides:[{type:'quiz',title:'Capitales',exercise}]}},
            {key:'InteractiveBook',id:'resume-livre',data:{title:'Capitales',chapters:[{title:'Révision',content:[{type:'exercise',...exercise}]}]}}
        ];
        for (const c of cases) {
            const before=JSON.stringify(c.data); const doc=await formatContentForDocument(c.key,c.data);
            const options=doc.sections.filter(s=>s.type==='checkbox').map(s=>s.text);
            check(options.includes('B. Paris est la capitale de la France.'), c.id+' : ordre de la fiche incorrect');
            check(doc.sections.some(s=>s.style==='correctAnswer' && s.text.includes('B. Paris est la capitale de la France.')), c.id+' : corrigé incohérent');
            check(JSON.stringify(c.data)===before,c.id+' : source mutée');
            c.required=['La Seine traverse', 'RELU dans Caramel', 'Rome est la capitale'];
        }
        return cases;
    } finally {destroyEditor();host.remove();}
}
