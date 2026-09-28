/** Couverture image/vidéo, progression manuelle et livre d'une seule page. */
export async function verifierLivreCouverture() {
    const { initJsonEditor, saveChanges, destroyEditor, discardChanges, getEditorState } = await import('/js/editor/index.js');
    const { packageActivity } = await import('/js/core/package-activity.js');
    const { getAllMedia } = await import('/js/h5p/image-manager.js');
    const check = (value, message) => { if (!value) throw Error(message); };
    const host = document.createElement('div'); document.body.append(host);
    const ouvrir = async (data, blob) => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type: 'h5p', moduleKey: 'InteractiveBook', titleKey: 'h5p_interactive_book_name', blob }, host, data), 'Livre non ouvert');
        host.querySelector('.json-editor__array-item-subsection-header[role="button"]').click();
    };
    const saisir = (path, value) => {
        const el = host.querySelector(`[data-path="${path}"]`); check(el, 'Champ absent : ' + path);
        if (el.type === 'checkbox') el.checked = value;
        else if (el.isContentEditable) el.textContent = value;
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const fichier = async (path, file) => {
        const input = host.querySelector(`[data-path="${path}"] input[type="file"]`); check(input, 'Fichier absent : ' + path);
        const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 120; i++) {
            if (host.querySelector(`[data-path="${path}"] ${file.type.startsWith('video') ? 'video' : 'img'}`)?.getAttribute('src')) return;
            await new Promise(r => setTimeout(r, 30));
        }
        throw Error('Média non chargé : ' + path);
    };
    const data = { title: 'Observer avant de commencer', cover: { enabled: true, description: 'Observe les couleurs, puis ouvre le livre.' }, chapters: [{ title: 'Une seule page', content: [{ type: 'text', text: 'Le drapeau français est bleu, blanc et rouge.' }] }] };
    await ouvrir(data);
    saisir('cover._contentType', 'image');
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const peindre = () => ['#173d89', '#ffffff', '#e43b44'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * 100, 0, 100, 200); });
    peindre(); const png = await new Promise(r => canvas.toBlob(r));
    await fichier('cover.image', new File([png], 'couverture.png', { type: 'image/png' }));
    saisir('cover.imageAlt', 'Bleu, blanc et rouge');
    host.querySelector('[data-section-id="options"] > button').click();
    saisir('progressAuto', false); saisir('enableRetry', false); saisir('showTableOfContents', false);
    const imageSave = await saveChanges(); check(imageSave, 'Couverture image refusée : ' + JSON.stringify(getEditorState().validationErrors));
    check(imageSave.data.cover.media.params.alt === 'Bleu, blanc et rouge', 'Description image perdue');
    await ouvrir(imageSave.data);
    check(host.querySelector('[data-path="cover.imageAlt"]').value === 'Bleu, blanc et rouge', 'Image non rouverte');
    saisir('cover.enabled', false);
    const disabled = await saveChanges(); check(disabled?.data.cover.enabled === false && disabled.data.cover.media, 'Désactivation destructive');
    await ouvrir(disabled.data); saisir('cover.enabled', true);
    saisir('cover.description', 'Retouche à annuler'); discardChanges();
    check(!host.textContent.includes('Retouche à annuler'), 'Annulation non appliquée');
    // Générer une courte animation locale : de vrais photogrammes, sans service tiers.
    const stream = canvas.captureStream(12); const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const recorded = new Promise(r => { recorder.onstop = r; }); recorder.start();
    for (let i = 0; i < 12; i++) {
        peindre(); ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.arc(20 + i * 23, 100, 10, 0, Math.PI * 2); ctx.fill();
        await new Promise(r => setTimeout(r, 120));
    }
    recorder.stop(); await recorded; stream.getTracks().forEach(t => t.stop());
    const video = new Blob(chunks, { type: 'video/webm' }); check(video.size > 1000, 'Vidéo vide');
    saisir('cover.enabled', true); saisir('cover._contentType', 'video');
    await fichier('cover.videoFile', new File([video], 'couleurs.webm', { type: 'video/webm' }));
    await fichier('cover.videoPoster', new File([png], 'affiche.png', { type: 'image/png' }));
    saisir('cover.videoLoop', true); saisir('cover.videoAutoplay', false); saisir('cover.videoControls', true);
    const videoSave = await saveChanges(); check(videoSave, 'Couverture vidéo refusée');
    await ouvrir(videoSave.data);
    check(host.querySelector('[data-path="cover.videoFile"] video'), 'Vidéo non rouverte');
    check(host.querySelector('[data-path="cover.videoLoop"]').checked, 'Boucle perdue');
    const second = await saveChanges(); check(second, 'Deuxième sauvegarde vidéo refusée');
    const results = [];
    for (const [kind, saved] of [['image', imageSave], ['video', second]]) {
        const packed = await packageActivity({ moduleKey: 'InteractiveBook', title: saved.data.title, content: saved.data, mediaFiles: new Map(getAllMedia()) });
        const zip = await window.JSZip.loadAsync(packed.bytes); const native = JSON.parse(await zip.file('content/content.json').async('string'));
        check(native.showCoverPage && native.chapters.length === 1, 'Couverture ou page unique perdue');
        check(native.behaviour.progressAuto === false && native.behaviour.enableRetry === false && native.behaviour.defaultTableOfContents === false, 'Options false perdues');
        const media = native.bookCover.coverMedium; check(media.library.startsWith(kind === 'image' ? 'H5P.Image' : 'H5P.Video'), 'Type de couverture incorrect');
        const path = kind === 'image' ? media.params.file.path : media.params.sources[0].path;
        check(zip.file('content/' + path), 'Média absent du paquet');
        if (kind === 'video') {
            check(media.params.playback.loop === true && media.params.visuals.controls === true, 'Commandes vidéo perdues');
            check(zip.file('content/' + media.params.visuals.poster.path), 'Affiche absente du paquet');
        }
        check(!JSON.stringify(native).includes('data:') && !JSON.stringify(native).includes('blob:'), 'URL provisoire dans le paquet');
        if (kind === 'video') {
            check(media.metadata.contentType === 'Video' && !media.params.file, 'Métadonnées du type précédent conservées');
            await ouvrir(saved.data, new Blob([packed.bytes]));
            const player = host.querySelector('[data-path="cover.videoFile"] video');
            await player.play(); await new Promise(r => setTimeout(r, 350));
            check(player.currentTime > 0, 'Vidéo rouverte depuis le ZIP illisible'); player.pause();
        }
        results.push({ key: 'InteractiveBook', id: 'livre-couverture-' + kind, data: saved.data, required: ['Observe les couleurs', 'Le drapeau français'], paquet: Array.from(packed.bytes) });
    }
    destroyEditor(); host.remove();
    return results;
}
