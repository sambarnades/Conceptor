/** Saisie réelle des options de tri et de grille, deux sauvegardes et documents. */
export async function verifierGrillesEtTri() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const { generateFindTheWordsGridImages } = await import('../../js/renderers/find-the-words-grid-generator.js');
    const host = document.createElement('div'); document.body.append(host);
    const check = (ok, message) => { if (!ok) throw Error(message); };
    const orientations = ['horizontal', 'horizontalBack', 'vertical', 'verticalUp', 'diagonal', 'diagonalBack', 'diagonalUp', 'diagonalUpBack'];
    const cases = [
        { key: 'SortParagraphs', titleKey: 'h5p_sort_the_paragraphs_name', id: 'tri-options', data: { taskDescription: 'Place Début en premier, Fin en dernier et Observer au milieu.', paragraphs: ['Début', 'Observer', 'Observer', 'Fin'], behaviour: { scoringMode: 'positions', applyPenalties: false } }, first: { duplicatesInterchangeable: false, addButtonsForMovement: false }, final: { duplicatesInterchangeable: true, addButtonsForMovement: true }, required: ['Observer'] },
        { key: 'FindTheWords', titleKey: 'h5p_find_the_words_name', id: 'grille-options', data: { taskDescription: 'Retrouve les capitales de la France, de l’Italie et de l’Espagne.', wordList: 'PARIS,ROME,MADRID' }, first: { fillPool: 'XYZ', preferOverlap: false }, final: { fillPool: 'Z', preferOverlap: true, showVocabulary: false, ...Object.fromEntries(orientations.map(k => ['orientations.' + k, k === 'horizontal'])) }, required: ['PARIS', 'ROME', 'MADRID'] }
    ];
    const ouvrir = async (c, data) => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type: 'h5p', moduleKey: c.key, titleKey: c.titleKey }, host, data), 'Éditeur absent');
        host.querySelector('[data-section-id="settings"] > button').click();
    };
    const saisir = values => {
        for (const [key, value] of Object.entries(values)) {
            const input = host.querySelector(`[data-path="behaviour.${key}"]`); check(input, 'Champ absent : ' + key);
            if (typeof value === 'boolean') { if (input.checked !== value) input.click(); }
            else { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }
        }
    };
    const relire = values => {
        for (const [key, value] of Object.entries(values)) {
            const input = host.querySelector(`[data-path="behaviour.${key}"]`);
            check(input && (typeof value === 'boolean' ? input.checked : input.value) === value, 'Retouche perdue : ' + key);
        }
    };
    const result = [];
    try {
        for (const c of cases) {
            await ouvrir(c, c.data); saisir(c.first);
            const first = await saveChanges(); check(first, 'Première sauvegarde refusée');
            await ouvrir(c, first.data); relire(c.first); saisir(c.final);
            const second = await saveChanges(); check(second, 'Deuxième sauvegarde refusée');
            await ouvrir(c, second.data); relire(c.final);
            const pkg = await packageActivity({ moduleKey: c.key, title: c.id, content: second.data });
            const zip = await window.JSZip.loadAsync(pkg.bytes);
            const native = JSON.parse(await zip.file('content/content.json').async('string'));
            for (const [path, value] of Object.entries(c.final)) check(path.split('.').reduce((v, k) => v?.[k], native.behaviour) === value, 'Option absente du paquet : ' + path);
            let grid;
            if (c.key === 'FindTheWords') {
                const images = await generateFindTheWordsGridImages(native.wordList, native.behaviour);
                check(images.emptyGrid && images.solutionGrid, 'Grilles absentes');
                second.data._gridImage = images.emptyGrid; second.data._solutionGridImage = images.solutionGrid;
                grid = images.grid;
            }
            result.push({ key: c.key, id: c.id, data: second.data, required: c.required, paquet: Array.from(pkg.bytes), options: native.behaviour, grid });
        }
    } finally { destroyEditor(); host.remove(); }
    return result;
}
