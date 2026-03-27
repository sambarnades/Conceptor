/**
 * Test pipeline complet H5P — timing par activite
 *
 * Pour chaque activite (19 types) :
 *  1. Charge la fixture JSON
 *  2. Traitement processeur (healer + processor)
 *  3. Packaging H5P (createH5PBlob)
 *  4. Prechargement bibliotheques (prefetchH5PLibraries)
 *  5. Rendu H5P (H5PManager.load)
 *
 * Mesure le temps de chaque etape et affiche un tableau recapitulatif.
 *
 * Usage : ouvrir tests/test-h5p-prefetch.html depuis le serveur local.
 */

// ============================================================================
// ETAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];
const timings = [];

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; console.error('FAIL:', message); }
    else { passCount++; }
    results.push(entry);
}

// ============================================================================
// FIXTURES — meme table que test-integration.js
// ============================================================================

const ALL_H5P = [
    { key: 'Chart',            fixture: 'charts_1.json' },
    { key: 'Timeline',         fixture: 'timeline_1.json' },
    { key: 'Flashcards',       fixture: 'flashcards_1.json' },
    { key: 'Glossary',         fixture: 'accordion_1.json' },
    { key: 'Crossword',        fixture: 'crosswords_1.json' },
    { key: 'Essay',            fixture: 'essay_1.json' },
    { key: 'Summary',          fixture: 'summary_1.json' },
    { key: 'DragTheWords',     fixture: 'drag_the_words_1.json' },
    { key: 'DragAndDrop',      fixture: 'drag_and_drop_1.json' },
    { key: 'FillInTheBlanks',  fixture: 'fill_in_the_blanks_1.json' },
    { key: 'MarkTheWords',     fixture: 'mark_the_words_1.json' },
    { key: 'MarkTheWords',     fixture: 'mark_the_words_3.json' },
    { key: 'MarkTheWords',     fixture: 'mark_the_words_4.json' },
    { key: 'TrueFalse',        fixture: 'true_false_1.json' },
    { key: 'MultipleChoice',   fixture: 'multiple_choice_1.json' },
    { key: 'FindTheWords',     fixture: 'find_the_words_1.json' },
    { key: 'SortParagraphs',   fixture: 'sort_the_paragraphs_1.json' },
    { key: 'SingleChoiceSet',  fixture: 'single_choice_set_1.json' },
    { key: 'DialogCards',      fixture: 'dialog_cards_1.json' },
    { key: 'QuizSet',          fixture: 'quiz_mixte_1.json' },
    { key: 'QuizSetQCM',       fixture: 'quiz_qcm_1.json' },
    { key: 'QuizSetQCM',       fixture: 'quiz_qcm_5.json' },
    { key: 'QuizSetQCM',       fixture: 'quiz_qcm_formules_test.json' }
];

// ============================================================================
// MODULES (charges une seule fois)
// ============================================================================

let processH5PContent, getModuleMetadata, createH5PBlob, prefetchH5PLibraries,
    getPrefetchStatus, H5PManager;

async function loadModules() {
    const t0 = performance.now();

    const [procMod, creatorMod, prefetchMod, managerMod] = await Promise.all([
        import('../js/h5p/processors/index.js'),
        import('../js/h5p/h5p-creator.js'),
        import('../js/h5p/h5p-prefetch.js'),
        import('../js/h5p/h5p-manager.js')
    ]);

    processH5PContent = procMod.processH5PContent;
    getModuleMetadata = procMod.getModuleMetadata;
    createH5PBlob = creatorMod.createH5PBlob;
    prefetchH5PLibraries = prefetchMod.prefetchH5PLibraries;
    getPrefetchStatus = prefetchMod.getPrefetchStatus;
    H5PManager = managerMod.H5PManager;

    const dur = Math.round(performance.now() - t0);
    assert(true, `[init] Modules charges en ${dur}ms`);
    return dur;
}

// ============================================================================
// PIPELINE PAR ACTIVITE
// ============================================================================

async function runActivityPipeline(entry, container, manager) {
    const { key, fixture } = entry;
    const timing = { moduleKey: key, fixture: 0, process: 0, package: 0, prefetch: 0, render: 0, total: 0, error: null };

    const tTotal = performance.now();

    // 1. Charger la fixture
    let fixtureData;
    try {
        const t0 = performance.now();
        const resp = await fetch(`assets/data/examples/${fixture}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        fixtureData = await resp.json();
        timing.fixture = performance.now() - t0;
    } catch (e) {
        timing.error = `fixture: ${e.message}`;
        timing.total = performance.now() - tTotal;
        assert(false, `[${key}] Fixture ${fixture} : ${e.message}`);
        timings.push(timing);
        return;
    }

    // 2. Processeur
    let content, meta;
    try {
        const t0 = performance.now();
        meta = getModuleMetadata(key);
        if (!meta) throw new Error('pas de metadonnees');
        const input = structuredClone(fixtureData);
        const processed = await processH5PContent(key, input);
        content = processed?.content ?? processed;
        if (!content || Object.keys(content).length === 0) throw new Error('contenu vide');
        timing.process = performance.now() - t0;
    } catch (e) {
        timing.error = `process: ${e.message}`;
        timing.total = performance.now() - tTotal;
        assert(false, `[${key}] Processeur : ${e.message}`);
        timings.push(timing);
        return;
    }

    // 3. Packaging
    let blob;
    try {
        const t0 = performance.now();
        blob = await createH5PBlob(content, meta.machineName, meta.extraDependencies, {
            title: `Test ${key}`, lang: 'fr'
        });
        if (!blob || blob.size === 0) throw new Error('blob vide');
        timing.package = performance.now() - t0;
    } catch (e) {
        timing.error = `package: ${e.message}`;
        timing.total = performance.now() - tTotal;
        assert(false, `[${key}] Packaging : ${e.message}`);
        timings.push(timing);
        return;
    }

    // 4. Prechargement bibliotheques
    try {
        const t0 = performance.now();
        await prefetchH5PLibraries(key);
        timing.prefetch = performance.now() - t0;
    } catch (e) {
        timing.error = `prefetch: ${e.message}`;
        // Non bloquant — on continue le rendu
        timing.prefetch = performance.now() - (performance.now() - timing.package);
    }

    // 5. Rendu H5P
    try {
        container.innerHTML = '';
        const t0 = performance.now();
        await manager.load(blob, container);
        timing.render = performance.now() - t0;
    } catch (e) {
        timing.error = `render: ${e.message}`;
        timing.render = 0;
    }

    timing.total = performance.now() - tTotal;

    // Resultat
    const renderCls = timing.render < 500 ? 'rapide' : timing.render < 2000 ? 'moyen' : 'LENT';
    assert(
        !timing.error,
        `[${key}] ${Math.round(timing.total)}ms total — rendu ${Math.round(timing.render)}ms (${renderCls})` +
        (timing.error ? ` — ${timing.error}` : ''),
        timing.error ? { error: timing.error } : null
    );

    timings.push(timing);
}

// ============================================================================
// BILAN PREFETCH
// ============================================================================

function runPrefetchBilan() {
    const status = getPrefetchStatus();
    assert(
        status.summary.failed === 0,
        `[Bilan] ${status.summary.ok} libs ok / ${status.summary.total} total — ${status.cacheSize} fichiers en cache`,
        status.summary.failed > 0 ? {
            failed: Object.entries(status.libraries).filter(([,v]) => v.status === 'failed').map(([k]) => k)
        } : null
    );
}

// ============================================================================
// EXECUTION PRINCIPALE
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    // Charger tous les modules
    const importDur = await loadModules();

    // Creer un conteneur de rendu (le creer dynamiquement s'il n'existe pas, ex: lance depuis test-all.html)
    let container = document.getElementById('h5p-render-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'h5p-render-container';
        container.style.cssText = 'position:absolute;width:800px;height:600px;overflow:hidden;opacity:0;pointer-events:none;';
        document.body.appendChild(container);
    }
    const manager = new H5PManager();

    // Pipeline pour chaque activite
    for (let i = 0; i < ALL_H5P.length; i++) {
        console.log(`[${i + 1}/${ALL_H5P.length}] ${ALL_H5P[i].key}...`);
        await runActivityPipeline(ALL_H5P[i], container, manager);
    }

    // Bilan prefetch
    runPrefetchBilan();

    const totalDuration = performance.now() - t0;
    console.log(`\n=== ${passCount} PASS, ${failCount} FAIL — ${Math.round(totalDuration)}ms total ===\n`);

    return { passCount, failCount, results, timings, totalDuration, importDur };
}
