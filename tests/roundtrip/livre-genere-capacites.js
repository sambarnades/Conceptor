/** Relire dans l'éditeur la sortie réelle du troisième essai IA autorisé. */
export async function verifierLivreGenere() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const original = await (await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/prompts/resultats/InteractiveBook.json')).json();
    const check = (ok, msg) => { if (!ok) throw Error(msg); };
    const host = document.createElement('div'); document.body.append(host);
    const ouvrir = async data => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type:'h5p', moduleKey:'InteractiveBook', titleKey:'h5p_interactive_book_name' }, host, data), 'Livre généré non éditable');
    };
    const saisir = (path, value) => {
        const el = host.querySelector(`[data-path="${path}"]`); check(el, 'Champ absent : ' + path);
        if (el.isContentEditable) el.textContent = value; else el.value = value;
        el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true}));
    };
    try {
        await ouvrir(original);
        host.querySelector('[data-section-id="general"] > button').click();
        saisir('cover.description','Observe les pays et retrouve leurs capitales.');
        host.querySelector('[data-section-id="chapters"] > button').click();
        const path = 'chapters.0.content.0.columns.1.content.0.exercise';
        // Les indices ajoutaient des connaissances non fournies, dont une fausse.
        for (let n=0; n<3; n++) for (const side of ['front','back']) saisir(path + `.dialogs.${n}.tips.${side}`, '');
        // Supprimer dans le vrai tableau le Vrai/Faux ajouté sans demande.
        const extra = host.querySelector('[data-path="chapters.0.content.1._blockType"]')?.closest('.json-editor__array-item');
        check(extra, 'Bloc supplémentaire introuvable');
        extra.querySelector('[data-action="delete"]').click();
        for (let n=0; n<100 && !document.querySelector('.json-editor__modal-btn--danger'); n++) await new Promise(r=>setTimeout(r,10));
        const confirm = [...document.querySelectorAll('.json-editor__modal-btn')].find(b=>b.textContent==='Supprimer');
        check(confirm, 'Confirmation de suppression absente'); confirm.click();
        await new Promise(r=>setTimeout(r,0));
        const first = await saveChanges(); check(first, 'Livre généré refusé à la sauvegarde');
        await ouvrir(first.data); host.querySelector('[data-section-id="chapters"] > button').click();
        check(!host.querySelector('[data-path="chapters.0.content.1._blockType"]'), 'Bloc supprimé revenu');
        const tip = host.querySelector(`[data-path="${path}.dialogs.1.tips.front"]`);
        check((tip.value ?? tip.textContent) === '', 'Correction perdue');
        const saved = await saveChanges(); check(saved, 'Réouverture refusée');
        const pkg = await packageActivity({moduleKey:'InteractiveBook',title:saved.data.title,content:saved.data});
        const zip = await window.JSZip.loadAsync(pkg.bytes); const native = JSON.parse(await zip.file('content/content.json').async('string'));
        check(native.chapters.length===1 && native.chapters[0].params.content.length===1, 'Nombre de pages/blocs incorrect');
        check(!JSON.stringify(native).includes('ibérique'), 'Indice erroné conservé');
        return {key:'InteractiveBook',id:'livre-genere-relu',data:saved.data,paquet:Array.from(pkg.bytes),required:['Observe les pays','France','Paris','Italie','Rome','Espagne','Madrid']};
    } finally {destroyEditor();host.remove();}
}
