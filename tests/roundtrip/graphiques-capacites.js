/** Recette des champs natifs Chart, de leurs limites et de la sauvegarde. */
export async function verifierGraphiques() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { validateSchema } = await import('../../js/editor/validators.js');
    const { getSchemaForType } = await import('../../js/editor/content-detector.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const check = (ok, message) => { if (!ok) throw Error(message); };
    const cases = [
        { key: 'Chart', id: 'graphique-secteurs', required: ['Lecture individuelle', 'Lecture en binôme', 'Discussion collective'],
            data: { graphMode: 'barChart', figureDefinition: 'Répartition fictive d’une heure de lecture', listOfTypes: [
                { text: 'Lecture individuelle', value: 0.125, color: '#369', fontColor: '#fff' },
                { text: 'Lecture en binôme', value: 0.25, color: '#663399', fontColor: '#fff' },
                { text: 'Discussion collective', value: 0.5, color: '#996600', fontColor: '#fff' }
            ] }, mode: 'pieChart', value: 0.375 },
        { key: 'Chart', id: 'graphique-barres', required: ['Mesure A', 'Mesure B', 'Mesure C'],
            data: { graphMode: 'pieChart', figureDefinition: 'Mesures fictives — petites valeurs décimales', listOfTypes: [
                { text: 'Mesure A', value: 0.0001, color: '#036', fontColor: '#fff' },
                { text: 'Mesure B', value: 0.0004, color: '#663399', fontColor: '#fff' },
                { text: 'Mesure C', value: 0.0012, color: '#996600', fontColor: '#fff' }
            ] }, mode: 'barChart', value: 0.0005 }
    ];
    const host = document.createElement('div'); document.body.append(host);
    const open = async data => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type: 'h5p', moduleKey: 'Chart', titleKey: 'h5p_chart_name' }, host, data), 'Éditeur Chart absent');
        host.querySelector('[data-section-id="data"] > button')?.click();
    };
    const field = path => {
        if (!host.querySelector(`[data-path="${path}"]`)) host.querySelector(`[data-section-id="${path.startsWith('listOfTypes.') ? 'data' : 'general'}"] > button`)?.click();
        if (!host.querySelector(`[data-path="${path}"]`) && path.startsWith('listOfTypes.')) host.querySelector(`[data-section-id="data"] .json-editor__nav-subitem[data-index="${path.split('.')[1]}"]`)?.click();
        const f = host.querySelector(`[data-path="${path}"]`); check(f, 'Champ absent : ' + path); return f;
    };
    const input = (path, value) => { const f = field(path); f.value = value; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); };
    const result = [];
    try {
        for (const c of cases) {
            for (const bad of [0, -1, 0.00001, 0.12345, Infinity]) {
                const invalid = structuredClone(c.data); invalid.listOfTypes[0].value = bad;
                check(!validateSchema(invalid, getSchemaForType('Chart')), 'Valeur invalide acceptée : ' + bad);
                let refused = false;
                try { await packageActivity({ moduleKey: 'Chart', title: c.id, content: invalid }); } catch { refused = true; }
                check(refused, 'Valeur invalide empaquetée : ' + bad);
            }
            await open(c.data);
            check(field('listOfTypes.0.color').value === (c.id === 'graphique-secteurs' ? '#336699' : '#003366'), 'Couleur courte mal affichée');
            check(field('listOfTypes.0.fontColor').value === '#ffffff', 'Blanc court mal affiché');
            check(field('listOfTypes.0.value').min === '0.0001' && field('listOfTypes.0.value').step === '0.0001', 'Limites absentes du champ');
            input('graphMode', c.mode); input('listOfTypes.1.value', c.value);
            const saved = await saveChanges(); check(saved, 'Sauvegarde refusée');
            await open(saved.data);
            check(field('graphMode').value === c.mode && Number(field('listOfTypes.1.value').value) === c.value, 'Retouches perdues à la réouverture');
            const reopened = await saveChanges(); check(reopened, 'Seconde sauvegarde refusée');
            const pkg = await packageActivity({ moduleKey: 'Chart', title: c.id, content: reopened.data });
            const zip = await window.JSZip.loadAsync(pkg.bytes);
            const native = JSON.parse(await zip.file('content/content.json').async('string'));
            check(native.graphMode === c.mode && native.listOfTypes[1].value === c.value, 'Retouches perdues dans le paquet');
            result.push({ key: c.key, id: c.id, required: c.required, data: reopened.data, paquet: Array.from(pkg.bytes) });
        }
    } finally { destroyEditor(); host.remove(); }
    return result;
}
