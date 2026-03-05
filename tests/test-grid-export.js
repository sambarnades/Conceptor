/**
 * Tests d'integration des images de grille dans les exports documents (Suite 12)
 *
 * Verifie que les images _gridImage et _solutionGridImage sont bien integrees
 * dans les exports DOCX/PDF/ODT pour Crossword et FindTheWords, depuis :
 * 1. Le formateur de document (formatContentForDocument)
 * 2. La modale de resultat de generation (ui.js — capture proactive)
 * 3. La modale de previsualisation (notifications.js — capture apres rendu H5P)
 *
 * Tests sans iframe — imports ES6 directs + verification structurelle du code source.
 *
 * Usage : ouvrir tests/test-grid-export.html depuis le serveur local.
 */

import { formatContentForDocument } from '../js/export/document-formatter.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

// =======================================================================
// FIXTURES : donnees de grille simulees
// =======================================================================

/** Image de grille fictive (simule le retour de captureCrosswordGrid / captureFindTheWordsGrid) */
function makeFakeGridImage() {
    return {
        dataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        blob: new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' }),
        width: 480,
        height: 480,
        mimeType: 'image/png'
    };
}

// =======================================================================
// ETAPE 1 : formatContentForDocument — integration _gridImage
// =======================================================================

async function runStep1_FormatterGridIntegration() {
    console.group('Etape 1 : Formatage avec images de grille');
    _ctx = { step: 1, stepName: 'Formatage grille', file: 'document-formatter.js', module: '', source: '' };
    const t0 = performance.now();

    // --- 1a. Crossword SANS images (cas de base) ---
    const crosswordFixture = await fetch('../assets/data/examples/crosswords_1.json').then(r => r.json());

    const resultNoGrid = await formatContentForDocument('Crossword', structuredClone(crosswordFixture));
    const imagesSansGrid = resultNoGrid.sections.filter(s => s.type === 'image');
    assert(
        imagesSansGrid.length === 0,
        '[1a.Crossword] Sans _gridImage : aucune section image',
        { found: imagesSansGrid.length }
    );

    // --- 1b. Crossword AVEC images ---
    const crosswordWithGrid = {
        ...structuredClone(crosswordFixture),
        _gridImage: makeFakeGridImage(),
        _solutionGridImage: makeFakeGridImage()
    };
    const resultWithGrid = await formatContentForDocument('Crossword', crosswordWithGrid);
    const imagesAvecGrid = resultWithGrid.sections.filter(s => s.type === 'image');
    assert(
        imagesAvecGrid.length === 2,
        '[1b.Crossword] Avec _gridImage + _solutionGridImage : 2 sections image',
        { found: imagesAvecGrid.length }
    );

    // Verifier que les images sont bien les bonnes (grille vide avant le pageBreak, corrigee apres)
    const pageBreakIdx = resultWithGrid.sections.findIndex(s => s.type === 'pageBreak');
    const emptyGridIdx = resultWithGrid.sections.findIndex(s => s.type === 'image');
    const solGridIdx = resultWithGrid.sections.findLastIndex(s => s.type === 'image');
    assert(
        emptyGridIdx < pageBreakIdx && solGridIdx > pageBreakIdx,
        '[1c.Crossword] Grille vide avant pageBreak, grille corrigee apres',
        { emptyGridIdx, pageBreakIdx, solGridIdx }
    );

    // Verifier imageData present sur les sections image
    assert(
        imagesAvecGrid.every(s => s.imageData && s.imageData.dataURL),
        '[1d.Crossword] Les sections image contiennent imageData.dataURL',
        { hasData: imagesAvecGrid.map(s => !!s.imageData?.dataURL) }
    );

    // --- 1e. Crossword avec _gridImage SEULE (pas de solution) ---
    const crosswordPartial = {
        ...structuredClone(crosswordFixture),
        _gridImage: makeFakeGridImage()
    };
    const resultPartial = await formatContentForDocument('Crossword', crosswordPartial);
    const imagesPartial = resultPartial.sections.filter(s => s.type === 'image');
    assert(
        imagesPartial.length === 1,
        '[1e.Crossword] Avec _gridImage seule : 1 section image',
        { found: imagesPartial.length }
    );

    // --- 2a. FindTheWords SANS images ---
    const ftwFixture = await fetch('../assets/data/examples/find_the_words_1.json').then(r => r.json());

    const ftwNoGrid = await formatContentForDocument('FindTheWords', structuredClone(ftwFixture));
    const ftwImagesSans = ftwNoGrid.sections.filter(s => s.type === 'image');
    assert(
        ftwImagesSans.length === 0,
        '[2a.FindTheWords] Sans _gridImage : aucune section image',
        { found: ftwImagesSans.length }
    );

    // --- 2b. FindTheWords AVEC images ---
    const ftwWithGrid = {
        ...structuredClone(ftwFixture),
        _gridImage: makeFakeGridImage(),
        _solutionGridImage: makeFakeGridImage()
    };
    const ftwResult = await formatContentForDocument('FindTheWords', ftwWithGrid);
    const ftwImagesAvec = ftwResult.sections.filter(s => s.type === 'image');
    assert(
        ftwImagesAvec.length === 2,
        '[2b.FindTheWords] Avec _gridImage + _solutionGridImage : 2 sections image',
        { found: ftwImagesAvec.length }
    );

    // Verifier position : grille vide avant pageBreak, corrigee apres
    const ftwPageBreak = ftwResult.sections.findIndex(s => s.type === 'pageBreak');
    const ftwEmptyIdx = ftwResult.sections.findIndex(s => s.type === 'image');
    const ftwSolIdx = ftwResult.sections.findLastIndex(s => s.type === 'image');
    assert(
        ftwEmptyIdx < ftwPageBreak && ftwSolIdx > ftwPageBreak,
        '[2c.FindTheWords] Grille vide avant pageBreak, grille corrigee apres',
        { ftwEmptyIdx, ftwPageBreak, ftwSolIdx }
    );

    // Verifier imageData
    assert(
        ftwImagesAvec.every(s => s.imageData && s.imageData.dataURL),
        '[2d.FindTheWords] Les sections image contiennent imageData.dataURL',
        { hasData: ftwImagesAvec.map(s => !!s.imageData?.dataURL) }
    );

    recordTiming('Etape 1', 'Formatage avec grilles', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : Verification structurelle du code source — modale de resultat
// =======================================================================

async function runStep2_GenerationModalCodeCheck() {
    console.group('Etape 2 : Code modale de resultat (ui.js)');
    _ctx = { step: 2, stepName: 'Modale resultat', file: 'ui/ui.js', module: '', source: '' };
    const t0 = performance.now();

    const uiSource = await fetch('../js/ui/ui.js').then(r => r.text());

    // 2a. Variable de promesse de capture de grille
    assert(
        uiSource.includes('_gridCapturePromise'),
        '[2a] Variable _gridCapturePromise declaree dans ui.js'
    );

    // 2b. Fonction de capture proactive en arriere-plan
    assert(
        uiSource.includes('_captureGridInBackground'),
        '[2b] Fonction _captureGridInBackground presente dans ui.js'
    );

    // 2c. Verification que la capture est lancee pour Crossword et FindTheWords
    assert(
        uiSource.includes("moduleKey === 'Crossword'") && uiSource.includes("moduleKey === 'FindTheWords'"),
        '[2c] Capture proactive declenchee pour Crossword et FindTheWords'
    );

    // 2d. Import dynamique du generateur standalone Crossword
    assert(
        uiSource.includes('crossword-grid-generator.js'),
        '[2d] Import de crossword-grid-generator.js (generateur standalone)'
    );

    // 2e. Import dynamique du generateur standalone FindTheWords
    assert(
        uiSource.includes('find-the-words-grid-generator.js'),
        '[2e] Import de find-the-words-grid-generator.js (generateur standalone)'
    );

    // 2g. Enrichissement des donnees d'export avec _gridImage
    assert(
        uiSource.includes('_gridImage') && uiSource.includes('_solutionGridImage'),
        '[2g] Enrichissement des donnees export avec _gridImage et _solutionGridImage'
    );

    // 2h. Await de _gridCapturePromise dans le handler d'export
    assert(
        uiSource.includes('await _gridCapturePromise'),
        '[2h] Export attend la promesse de capture avant d\'exporter'
    );

    // 2i. Nettoyage de la promesse a la fermeture
    assert(
        uiSource.includes('_gridCapturePromise = null'),
        '[2i] Promesse nettoyee a la fermeture de la modale'
    );

    // 2j. Le generateur Crossword recoit les words du JSON
    assert(
        uiSource.includes('generateCrosswordGridImages') && uiSource.includes('jsonData.words'),
        '[2j] generateCrosswordGridImages recoit les mots du JSON'
    );

    // 2k. Le generateur FindTheWords recoit le wordList du JSON
    assert(
        uiSource.includes('generateFindTheWordsGridImages') && uiSource.includes('jsonData.wordList'),
        '[2k] generateFindTheWordsGridImages recoit le wordList du JSON'
    );

    recordTiming('Etape 2', 'Verification code ui.js', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : Verification structurelle — modale de previsualisation
// =======================================================================

async function runStep3_PreviewModalCodeCheck() {
    console.group('Etape 3 : Code modale de previsualisation (notifications.js)');
    _ctx = { step: 3, stepName: 'Modale preview', file: 'ui/notifications.js', module: '', source: '' };
    const t0 = performance.now();

    const notifSource = await fetch('../js/ui/notifications.js').then(r => r.text());

    // 3a. Variable de promesse de rendu H5P
    assert(
        notifSource.includes('_h5pRenderPromise'),
        '[3a] Variable _h5pRenderPromise declaree dans notifications.js'
    );

    // 3b. Stockage de la promesse de rendu H5P
    assert(
        notifSource.includes('_h5pRenderPromise = loadJSZip'),
        '[3b] Promesse de rendu H5P stockee lors du chargement'
    );

    // 3c. Attente du rendu H5P avant la capture
    assert(
        notifSource.includes('await _h5pRenderPromise'),
        '[3c] Capture de grille attend que le H5P soit charge'
    );

    // 3d. Condition de garde sur moduleKey Crossword/FindTheWords avant await
    const awaitPattern = /if\s*\(\s*_h5pRenderPromise\s*&&\s*\(moduleKey\s*===\s*'Crossword'\s*\|\|\s*moduleKey\s*===\s*'FindTheWords'\)/;
    assert(
        awaitPattern.test(notifSource),
        '[3d] Condition de garde : attente H5P seulement pour Crossword/FindTheWords'
    );

    // 3e. Capture Crossword avec les mots
    assert(
        notifSource.includes('captureCrosswordGrid(modal, jsonDataToExport.words)'),
        '[3e] captureCrosswordGrid recoit modal et jsonDataToExport.words'
    );

    // 3f. Capture FindTheWords
    assert(
        notifSource.includes('captureFindTheWordsGrid(modal)'),
        '[3f] captureFindTheWordsGrid recoit modal'
    );

    // 3g. _gridImage injectee pour Crossword
    const crosswordGridInject = notifSource.includes("_gridImage: grids.emptyGrid");
    assert(
        crosswordGridInject,
        '[3g] _gridImage injectee dans les donnees d\'export'
    );

    // 3h. _solutionGridImage injectee
    const solGridInject = notifSource.includes("_solutionGridImage: grids.solutionGrid");
    assert(
        solGridInject,
        '[3h] _solutionGridImage injectee dans les donnees d\'export'
    );

    // 3i. Nettoyage de _h5pRenderPromise
    assert(
        notifSource.includes('_h5pRenderPromise = null'),
        '[3i] Promesse de rendu H5P nettoyee dans cleanupPreview'
    );

    // 3j. Erreur de capture silencieuse (warn, pas error)
    assert(
        notifSource.includes("console.warn('Capture grille mots crois"),
        '[3j] Echec de capture Crossword gere en warning (non bloquant)'
    );

    // 3k. Erreur de capture FindTheWords silencieuse
    assert(
        notifSource.includes("console.warn('Capture grille mots m"),
        '[3k] Echec de capture FindTheWords gere en warning (non bloquant)'
    );

    recordTiming('Etape 3', 'Verification code notifications.js', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : Coherence entre les deux chemins d'export
// =======================================================================

async function runStep4_CrossPathCoherence() {
    console.group('Etape 4 : Coherence entre les chemins d\'export');
    _ctx = { step: 4, stepName: 'Coherence', file: '', module: '', source: '' };
    const t0 = performance.now();

    const uiSource = await fetch('../js/ui/ui.js').then(r => r.text());
    const notifSource = await fetch('../js/ui/notifications.js').then(r => r.text());

    // 4a. Les deux chemins utilisent les memes proprietes _gridImage / _solutionGridImage
    assert(
        uiSource.includes('_gridImage') && notifSource.includes('_gridImage'),
        '[4a] Les deux chemins injectent _gridImage'
    );
    assert(
        uiSource.includes('_solutionGridImage') && notifSource.includes('_solutionGridImage'),
        '[4b] Les deux chemins injectent _solutionGridImage'
    );

    // 4c. Modale resultat utilise les generateurs standalone
    assert(
        uiSource.includes('crossword-grid-generator.js') && uiSource.includes('find-the-words-grid-generator.js'),
        '[4c] Modale resultat utilise les generateurs standalone (Crossword + FindTheWords)'
    );

    // 4d. Modale preview utilise les captures H5P
    assert(
        notifSource.includes('crossword-grid-capture.js') && notifSource.includes('find-the-words-grid-capture.js'),
        '[4d] Modale preview utilise les captures H5P (Crossword + FindTheWords)'
    );

    // 4e. Les deux chemins utilisent originalJsonData || jsonData pour les donnees
    const uiDataPattern = /originalJsonData\s*\|\|\s*notification\.jsonData|notification\.originalJsonData\s*\|\|\s*notification\.jsonData/;
    assert(
        uiDataPattern.test(uiSource),
        '[4e] Modale resultat : donnees lues depuis originalJsonData || jsonData'
    );
    assert(
        uiDataPattern.test(notifSource) || notifSource.includes('notification.originalJsonData || notification.jsonData'),
        '[4f] Modale preview : donnees lues depuis originalJsonData || jsonData'
    );

    // 4g. Les deux chemins appellent les memes exporteurs
    for (const fn of ['exportToDOCX', 'exportToPDF', 'exportToODT']) {
        assert(
            uiSource.includes(fn) && notifSource.includes(fn),
            `[4g.${fn}] Les deux chemins appellent ${fn}`
        );
    }

    // 4h. Crossword fixture : verifier que words est un tableau (prerequis pour la capture)
    const crosswordFixture = await fetch('../assets/data/examples/crosswords_1.json').then(r => r.json());
    assert(
        Array.isArray(crosswordFixture.words) && crosswordFixture.words.length > 0,
        '[4h] Fixture Crossword a un tableau words non vide',
        { wordsLength: crosswordFixture.words?.length }
    );

    // 4i. Chaque mot a answer et clue (necessaire pour la grille corrigee)
    const allWordsValid = crosswordFixture.words.every(w => w.answer && w.clue);
    assert(
        allWordsValid,
        '[4i] Tous les mots ont answer et clue',
        { sample: crosswordFixture.words.slice(0, 2).map(w => ({ answer: w.answer, clue: w.clue?.substring(0, 30) })) }
    );

    // 4j. FindTheWords fixture : wordList est une chaine separee par des virgules
    const ftwFixture = await fetch('../assets/data/examples/find_the_words_1.json').then(r => r.json());
    assert(
        typeof ftwFixture.wordList === 'string' && ftwFixture.wordList.includes(','),
        '[4j] Fixture FindTheWords a un wordList comma-separated',
        { wordList: ftwFixture.wordList?.substring(0, 50) }
    );

    recordTiming('Etape 4', 'Coherence chemins export', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXPORT / API
// =======================================================================

export const STEP_NAMES = [
    '',
    'Formatage grille',
    'Modale resultat',
    'Modale preview',
    'Coherence'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que formatContentForDocument integre correctement les images _gridImage et _solutionGridImage dans les sections pour Crossword et FindTheWords (avec/sans images, positionnement avant/apres pageBreak).',
    'Verifie structurellement que ui.js contient la generation proactive de grille (_captureGridInBackground), les imports des generateurs standalone, l\'attente de la promesse, et le nettoyage.',
    'Verifie structurellement que notifications.js stocke la promesse de rendu H5P (_h5pRenderPromise), attend le chargement avant la capture, et gere les erreurs silencieusement.',
    'Verifie la coherence entre les deux chemins d\'export : memes proprietes, memes modules de capture, memes exporteurs, memes sources de donnees.'
];

/**
 * Lance tous les tests de capture de grille pour export.
 */
export async function runAllTests() {
    console.log('=== Tests Integration Grille Export (4 etapes) ===');
    passCount = 0;
    failCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_FormatterGridIntegration();
    await runStep2_GenerationModalCodeCheck();
    await runStep3_PreviewModalCodeCheck();
    await runStep4_CrossPathCoherence();

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests grille export', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL ===`);

    return { passCount, failCount, skipCount: 0, results, STEP_NAMES, timings };
}
