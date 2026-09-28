/** Recette des colonnes natives : formulaire réel, médias et deux sauvegardes. */
export async function verifierLivreColonnes() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const { getAllMedia } = await import('../../js/h5p/image-manager.js');
    const { getSchemaForType, normalizeDataForEditor } = await import('../../js/editor/content-detector.js');
    const { getValidationErrors } = await import('../../js/editor/validators.js');
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const host = document.createElement('div'); document.body.append(host);
    const data = { title: 'Comparer deux représentations', chapters: [
        { title: 'Observer puis répondre', content: [{ type: 'row', columns: [
            { width: 40, content: [{ type: 'text', text: 'Observe le drapeau.' }, { type: 'image', image: {}, alt: 'Drapeau tricolore' }] },
            { width: 60, content: [
                { type: 'exercise', library: 'H5P.Dialogcards 1.9', description: 'Associe le pays et sa capitale.', dialogs: [{ text: 'France', answer: 'Paris', tips: { front: 'Pense à la Seine.', back: 'Capitale française.' } }], mode: 'repetition', behaviour: { quickProgression: true, maxProficiency: 3 } },
                { type: 'exercise', library: 'H5P.Summary 1.10', intro: 'Repère le pays.', summaries: [{ summary: ['Paris est en France.', 'Paris est en Italie.'], tip: 'Observe les trois couleurs.' }] }
            ] }
        ] }] },
        { title: 'Bilan', content: [{ type: 'text', text: 'Explique ton choix.' }] }
    ] };
    const p = 'chapters.0.content.0.columns';
    const ouvrir = async value => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type: 'h5p', moduleKey: 'InteractiveBook', titleKey: 'h5p_interactive_book_name' }, host, value), 'Éditeur livre absent');
        host.querySelector('[data-section-id="chapters"] > button').click();
    };
    const saisir = (path, value) => {
        const el = host.querySelector(`[data-path="${path}"]`); check(el, 'Champ absent : ' + path);
        if (el.isContentEditable) el.textContent = value; else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const televerser = async (path, file) => {
        const input = host.querySelector(`[data-path="${path}"] input[type="file"]`); check(input, 'Téléversement absent : ' + path);
        const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 100; i++) {
            if (host.querySelector(`[data-path="${path}"] ${file.type.startsWith('audio') ? 'audio' : 'img'}`)?.getAttribute('src')) return;
            await new Promise(r => setTimeout(r, 30));
        }
        throw Error('Média sans aperçu : ' + path);
    };
    await ouvrir(data);
    check(host.querySelector(`[data-path="${p}.0.content.1.alt"]`).value === 'Drapeau tricolore', 'Texte alternatif absent du widget');
    saisir(p + '.0.width', 35); saisir(p + '.1.width', 65);
    saisir(p + '.0.content.0.text', 'Drapeau observé dans la première colonne.');
    const wav = await (await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/carte-capitale.wav')).arrayBuffer();
    await televerser(p + '.1.content.0.exercise.dialogs.0.audio', new File([wav], 'capitale.wav', { type: 'audio/wav' }));
    const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 80;
    const ctx = canvas.getContext('2d'); ['#173d89', '#ffffff', '#e43b44'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * 40, 0, 40, 80); });
    await televerser(p + '.0.content.1.image', new File([await new Promise(r => canvas.toBlob(r))], 'drapeau.png', { type: 'image/png' }));
    // Même sous-formulaire après des allers-retours entre chapitres.
    for (const index of [1, 0, 1, 0]) host.querySelector(`.json-editor__nav-items[data-section-id="chapters"] [data-index="${index}"]`).click();
    check(host.querySelector(`[data-path="${p}.0.width"]`).value === '35', 'Largeur perdue à la navigation');
    const first = await saveChanges(); check(first, 'Première sauvegarde refusée');
    check(first.data.chapters[0].content[0].type === 'row', 'Row aplatie à la sauvegarde');
    await ouvrir(first.data);
    check(host.querySelector(`[data-path="${p}.1.content.0.exercise.dialogs.0.audio"] audio`), 'Audio imbriqué perdu à la réouverture');
    saisir(p + '.1.content.0.exercise.dialogs.0.answer', 'Paris, en France.');
    const second = await saveChanges(); check(second, 'Deuxième sauvegarde refusée');
    const invalid = structuredClone(second.data); invalid.chapters[0].content[0].columns[1].width = 80;
    check(getValidationErrors(normalizeDataForEditor(invalid, 'InteractiveBook'), getSchemaForType('InteractiveBook')).some(e => e.path === p), 'Total de largeurs incohérent accepté');
    const missingImage = structuredClone(second.data); delete missingImage.chapters[0].content[0].columns[0].content[1].image;
    check(getValidationErrors(normalizeDataForEditor(missingImage, 'InteractiveBook'), getSchemaForType('InteractiveBook')).some(e => e.path === p + '.0.content.1'), 'Image de colonne manquante acceptée');
    const packageResult = await packageActivity({ moduleKey: 'InteractiveBook', title: second.data.title, content: second.data, mediaFiles: new Map(getAllMedia()) });
    const zip = await window.JSZip.loadAsync(packageResult.bytes);
    const native = JSON.parse(await zip.file('content/content.json').async('string'));
    const row = native.chapters[0].params.content[0].content;
    check(row.library === 'H5P.Row 1.3', 'Bibliothèque Row absente');
    check(row.params.columns.map(c => c.width).join() === '35,65', 'Largeurs différentes du formulaire');
    check(row.params.columns.every(c => c.content.library === 'H5P.RowColumn 1.3'), 'RowColumn absente');
    const dialogs = row.params.columns[1].content.params.content[0].params;
    check(dialogs.dialogs[0].answer.includes('Paris, en France.'), 'Réponse modifiée perdue');
    check(dialogs.behaviour.quickProgression === true && dialogs.mode === 'repetition', 'Réglage imbriqué perdu');
    check(zip.file('content/' + dialogs.dialogs[0].audio[0].path), 'Audio imbriqué absent du ZIP');
    const image = row.params.columns[0].content.params.content[1].params.file;
    check(zip.file('content/' + image.path), 'Image imbriquée absente du ZIP');
    const manifest = JSON.parse(await zip.file('h5p.json').async('string'));
    for (const machineName of ['H5P.Row', 'H5P.RowColumn', 'H5P.Dialogcards', 'H5P.Summary']) check(manifest.preloadedDependencies.some(d => d.machineName === machineName), 'Dépendance manquante : ' + machineName);
    check(!JSON.stringify(native).includes('blob:') && !JSON.stringify(native).includes('data:'), 'URL provisoire embarquée');
    destroyEditor(); host.remove();
    const { H5PManager } = await import('../../js/h5p/h5p-manager.js');
    const preview = document.createElement('div'); preview.style.width = '1000px'; document.body.append(preview);
    const manager = new H5PManager();
    try {
        await manager.load(new Blob([packageResult.bytes]), preview);
        let body;
        for (let i = 0; i < 100; i++) {
            body = preview.querySelector('iframe')?.contentDocument?.body;
            if (body?.textContent.includes('Drapeau observé')) break;
            await new Promise(r => setTimeout(r, 30));
        }
        check(body?.textContent.includes('Drapeau observé'), 'Aperçu Row vide');
        check(body.querySelectorAll('.h5p-row-content').length === 2, 'Deux colonnes absentes du lecteur');
        check(body.querySelector('.h5p-row-content').style.flexBasis === '35%', 'Largeur non appliquée par Row');
    } finally { manager.destroy(preview); preview.remove(); }
    return { key: 'InteractiveBook', id: 'livre-colonnes-edite', data: second.data, required: ['Drapeau observé', 'Paris, en France.', 'Observe les trois couleurs.', 'Pense à la Seine.'], paquet: Array.from(packageResult.bytes) };
}
