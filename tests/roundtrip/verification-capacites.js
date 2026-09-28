/** Options natives de vérification : vrais champs, deux sauvegardes et paquets. */
export async function verifierOptionsReponse() {
    const { initJsonEditor, saveChanges, destroyEditor } = await import('../../js/editor/index.js');
    const { packageActivity } = await import('../../js/core/package-activity.js');
    const { H5PManager } = await import('../../js/h5p/h5p-manager.js');
    const check = (ok, message) => { if (!ok) throw Error(message); };
    const items = [
        { key: 'MultipleChoice', library: 'H5P.MultiChoice 1.16', data: { question: 'Quelle ville est la capitale de la France ?', answers: [{ text: 'Paris', correct: true }, { text: 'Rome', correct: false }], behaviour: { type: 'single', randomAnswers: false, autoCheck: false } } },
        { key: 'TrueFalse', library: 'H5P.TrueFalse 1.8', data: { question: 'Madrid est la capitale de l’Espagne.', correct: 'true', feedbackOnCorrect: 'Madrid est la capitale espagnole.', feedbackOnWrong: 'Madrid est bien la capitale espagnole.', behaviour: { autoCheck: true } } },
        { key: 'FillInTheBlanks', library: 'H5P.Blanks 1.14', data: { taskDescription: 'Complète les deux capitales.', questions: ['France : *Paris*. Italie : *Rome*.'], behaviour: { autoCheck: false, caseSensitive: false } } },
        { key: 'MarkTheWords', library: 'H5P.MarkTheWords 1.11', data: { taskDescription: 'Sélectionne les capitales.', textField: '*Paris* Lyon *Rome* Milan', behaviour: {} } }
    ];
    const titles = { MultipleChoice: 'h5p_multiple_choice_name', TrueFalse: 'h5p_true_false_name', FillInTheBlanks: 'h5p_fill_in_the_blanks_name', MarkTheWords: 'h5p_mark_the_words_name', QuizSet: 'h5p_quiz_set_name', CoursePresentation: 'h5p_course_presentation_name', InteractiveBook: 'h5p_interactive_book_name' };
    const host = document.createElement('div'); document.body.append(host);
    const ouvrir = async (key, data, section) => {
        destroyEditor(); host.innerHTML = '';
        check(await initJsonEditor({ type: 'h5p', moduleKey: key, titleKey: titles[key] }, host, data), 'Éditeur absent : ' + key);
        host.querySelector(`[data-section-id="${section}"] > button`).click();
    };
    const champs = (key, prefix = 'behaviour') => {
        const values = { enableCheckButton: false };
        if (key === 'MultipleChoice' || key === 'FillInTheBlanks') values.showSolutionsRequiresInput = false;
        if (key === 'FillInTheBlanks') values.allowRetryIfCorrect = true;
        return Object.entries(values).map(([k,v]) => [prefix + '.' + k, v]);
    };
    const saisir = ([path, value]) => {
        const el = host.querySelector(`input[data-path="${path}"]`); check(el, 'Champ absent : ' + path);
        if (el.checked !== value) el.click();
    };
    const relire = ([path, value]) => check(host.querySelector(`input[data-path="${path}"]`)?.checked === value, 'Option perdue : ' + path);
    const cases = items.map(i => ({ key: i.key, id: 'verification-' + i.key, data: i.data, section: 'settings', paths: champs(i.key), required: [i.key === 'TrueFalse' ? 'Madrid' : 'Paris'] }));
    cases.push({ key: 'QuizSet', id: 'verification-quiz', section: 'questions', data: { title: 'Quatre vérifications', questions: items.map(i => ({ library: i.library, metadata: { title: i.key }, params: i.data })) }, paths: items.flatMap((i,n) => champs(i.key, `questions.${n}.params.behaviour`)), required: ['Paris','Madrid','Rome'] });
    cases.push({ key: 'CoursePresentation', id: 'verification-presentation', section: 'slides', data: { slides: items.map(i => ({ title: i.key, type: 'quiz', exercise: { library: i.library, ...i.data } })) }, paths: items.flatMap((i,n) => champs(i.key, `slides.${n}.exercise.behaviour`)), required: ['Paris','Madrid','Rome'] });
    cases.push({ key: 'InteractiveBook', id: 'verification-livre', section: 'chapters', data: { title: 'Quatre vérifications', showTableOfContents: true, chapters: [{ title: 'Comparer les capitales', content: items.map(i => ({ type: 'exercise', library: i.library, ...i.data })) }] }, paths: items.flatMap((i,n) => champs(i.key, `chapters.0.content.${n}.exercise.behaviour`)), required: ['Paris','Madrid','Rome'] });
    const visit = (c, callback) => {
        if (c.key === 'CoursePresentation' || c.key === 'QuizSet') {
            items.forEach((item,n) => {
                host.querySelector(`.json-editor__nav-items[data-section-id="${c.section}"] [data-index="${n}"]`).click();
                c.paths.filter(([path]) => path.startsWith(`${c.section}.${n}.`)).forEach(callback);
            });
        } else c.paths.forEach(callback);
    };
    const result = [];
    try {
        for (const c of cases) {
            console.log('Options : ' + c.id);
            await ouvrir(c.key, c.data, c.section); visit(c, saisir);
            const first = await saveChanges(); check(first, 'Sauvegarde refusée : ' + c.id);
            await ouvrir(c.key, first.data, c.section); visit(c, relire);
            // Repasser sur une valeur vraie puis fausse : le contrôle doit écrire le modèle.
            const last = c.paths.at(-1); saisir([last[0], !last[1]]); saisir(last);
            const second = await saveChanges(); check(second, 'Deuxième sauvegarde refusée : ' + c.id);
            const lireOptions = native => {
                if (!['QuizSet','CoursePresentation','InteractiveBook'].includes(c.key)) return [native.behaviour];
                const opts = [];
                const collect = value => {
                    if (!value || typeof value !== 'object') return;
                    if (items.some(i => i.library === value.library)) opts.push(value.params.behaviour);
                    Object.values(value).forEach(collect);
                };
                collect(native); return opts;
            };
            const sansBoutons = await packageActivity({ moduleKey: c.key, title: c.id, content: second.data });
            const zipSansBoutons = await window.JSZip.loadAsync(sansBoutons.bytes);
            const optionsSansBoutons = lireOptions(JSON.parse(await zipSansBoutons.file('content/content.json').async('string')));
            check(optionsSansBoutons.length === (items.some(i => i.key === c.key) ? 1 : 4), 'Sous-activités manquantes : ' + c.id);
            check(optionsSansBoutons.every(b => b.enableCheckButton === false), 'False perdu à l’export : ' + c.id);
            // Paquets jouables : Vérifier reste visible lorsque cette sonde n'a pas d'autocorrection.
            const data = second.data;
            const restore = value => { if (!value || typeof value !== 'object') return; if (value.behaviour && !value.behaviour.autoCheck) value.behaviour.enableCheckButton = true; Object.values(value).forEach(v => { if (typeof v === 'object') restore(v); }); };
            restore(data);
            const pkg = await packageActivity({ moduleKey: c.key, title: c.id, content: data });
            const zip = await window.JSZip.loadAsync(pkg.bytes);
            const native = JSON.parse(await zip.file('content/content.json').async('string'));
            const opts = lireOptions(native);
            const count = c.key === 'TrueFalse' ? 1 : ['QuizSet','CoursePresentation','InteractiveBook'].includes(c.key) ? 4 : 1;
            check(opts.length === count, 'Options absentes du paquet : ' + c.id + ' ' + JSON.stringify(opts));
            for (const b of opts) {
                check(b.enableCheckButton === !b.autoCheck, 'Bouton perdu dans le paquet : ' + c.id);
                if ('showSolutionsRequiresInput' in b) check(b.showSolutionsRequiresInput === false, 'Condition solution perdue : ' + c.id);
                if ('allowRetryIfCorrect' in b) check(b.allowRetryIfCorrect === true, 'Reprise après réussite perdue : ' + c.id);
            }
            result.push({ key: c.key, id: c.id, data, required: c.required, paquet: Array.from(pkg.bytes), options: opts, optionsSansBoutons });
        }
    } finally { destroyEditor(); host.remove(); }
    // Le vrai lecteur H5P doit masquer Vérifier pour le Vrai/Faux automatique.
    const manager = new H5PManager(); // Comme l’hôte : un lecteur réutilisé entre activités.
    for (const c of result.slice(0,4)) {
        const visibleText = c.key === 'FillInTheBlanks' ? 'Complète les deux capitales.' : c.required[0];
        const preview = document.createElement('div'); preview.style.width = '950px'; document.body.append(preview);
        try {
            await manager.load(new Blob([new Uint8Array(c.paquet)]), preview);
            let body;
            for (let n=0; n<100; n++) { body = preview.querySelector('iframe')?.contentDocument?.body; if (body?.textContent.includes(visibleText) && body.querySelector('.h5p-question-content')) break; await new Promise(r=>setTimeout(r,30)); }
            check(body?.textContent.includes(visibleText), 'Lecteur vide : ' + c.id + ' ' + body?.textContent.slice(0, 500));
            const button = body.querySelector('.h5p-question-check-answer');
            check(c.key === 'TrueFalse' ? !button || button.offsetParent === null : button?.offsetParent !== null, 'Visibilité Vérifier incorrecte : ' + c.id);
        } finally { manager.destroy(preview); preview.remove(); }
    }
    return result;
}
