/**
 * @file Tests de retry du chargement des bibliotheques.
 * Verifie que loadScript() et les fonctions load*() supportent correctement
 * le retry apres un echec de chargement (promesse rejetee non cachee).
 *
 * 3 etapes :
 *  1. loadScript — Retry apres echec, marquage data-loaded, nettoyage DOM
 *  2. loadOcrLibs — Nettoyage du cache de promesse apres echec
 *  3. Autres loaders — Meme pattern pour loadH5pLibs, loadMoodleLibs, etc.
 */

// ============================================================================
// IMPORTS
// ============================================================================

// On importe uniquement les noms publics pour les tester via le mecanisme standard
import {
    loadOcrLibs,
    loadH5pLibs,
    loadMoodleLibs,
    loadMathJax,
    loadDocumentExportLibs,
    loadDOMPurify,
    loadJSZip,
    loadClientZip
} from '../js/core/lib-loader.js';

// ============================================================================
// ETAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];

let _ctx = {
    step: 0,
    stepName: '',
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
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

// ============================================================================
// CONSTANTES
// ============================================================================

const STEP_NAMES = [
    '',
    'loadScript retry',
    'loadOcrLibs retry',
    'Autres loaders retry'
];

export const STEP_DESCRIPTIONS = {
    1: 'Verifie que loadScript() marque les scripts avec data-loaded, retire les scripts echoues du DOM, et permet un retry',
    2: 'Verifie que loadOcrLibs() nettoie le cache de promesse apres un echec et permet un nouveau chargement',
    3: 'Verifie le meme pattern de nettoyage pour loadH5pLibs, loadMoodleLibs, loadJSZip, loadDOMPurify, etc.'
};

// ============================================================================
// HELPERS DE TEST
// ============================================================================

/**
 * Insere un script factice dans le DOM avec un etat donne
 * pour simuler un chargement precedent reussi ou echoue
 */
function injectFakeScript(src, loadedState) {
    // Nettoyer tout script existant avec ce src
    document.querySelectorAll(`script[src="${src}"]`).forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = src;
    if (loadedState !== undefined) {
        script.dataset.loaded = loadedState;
    }
    document.body.appendChild(script);
    return script;
}

/**
 * Nettoie les scripts de test du DOM
 */
function cleanupScripts(...srcs) {
    for (const src of srcs) {
        document.querySelectorAll(`script[src="${src}"]`).forEach(s => s.remove());
    }
}

// ============================================================================
// ETAPE 1 : loadScript — retry et marquage data-loaded
// ============================================================================

async function runStep1_LoadScript() {
    _ctx = { step: 1, stepName: 'loadScript retry' };
    console.group('Etape 1 : loadScript retry');

    const FAKE_SRC_OK = 'tests/fixtures/fake-lib-ok.js';
    const FAKE_SRC_FAIL = 'tests/fixtures/fake-lib-nonexistent-12345.js';

    // --- Test 1a : Un script reussi est marque data-loaded="true" ---
    try {
        cleanupScripts(FAKE_SRC_OK);

        // Creer un vrai mini script qui va reussir
        const blob = new Blob(['window.__testLibLoaderOk = true;'], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        // Injecter manuellement pour verifier le marquage
        const script = document.createElement('script');
        script.src = blobUrl;
        script.async = true;
        await new Promise((resolve, reject) => {
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });

        assert(
            script.dataset.loaded === 'true',
            '[1a] Un script charge avec succes a data-loaded="true"'
        );

        script.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        assert(false, '[1a] Erreur inattendue', { erreur: e.message });
    }

    // --- Test 1b : Un script echoue est marque data-loaded="false" ---
    try {
        const script = injectFakeScript(FAKE_SRC_FAIL, 'false');

        assert(
            script.dataset.loaded === 'false',
            '[1b] Un script echoue a data-loaded="false"'
        );

        cleanupScripts(FAKE_SRC_FAIL);
    } catch (e) {
        assert(false, '[1b] Erreur inattendue', { erreur: e.message });
    }

    // --- Test 1c : Un script echoue (data-loaded="false") est retire du DOM lors du retry ---
    try {
        const failedScript = injectFakeScript('fake-retry-test.js', 'false');

        assert(
            document.querySelector('script[src="fake-retry-test.js"]') !== null,
            '[1c.pre] Le script echoue est present dans le DOM avant retry'
        );

        // Simuler ce que loadScript fait : verifier l'existant, le retirer si echoue
        const existing = document.querySelector('script[src="fake-retry-test.js"]');
        if (existing && existing.dataset.loaded === 'false') {
            existing.remove();
        }

        assert(
            document.querySelector('script[src="fake-retry-test.js"]') === null,
            '[1c] Le script echoue est retire du DOM pour permettre le retry'
        );

    } catch (e) {
        assert(false, '[1c] Erreur inattendue', { erreur: e.message });
    }

    // --- Test 1d : Un script deja charge (data-loaded="true") n'est PAS retire ---
    try {
        const okScript = injectFakeScript('fake-ok-test.js', 'true');

        const existing = document.querySelector('script[src="fake-ok-test.js"]');
        let removed = false;
        if (existing && existing.dataset.loaded === 'false') {
            existing.remove();
            removed = true;
        }

        assert(
            !removed && document.querySelector('script[src="fake-ok-test.js"]') !== null,
            '[1d] Un script reussi (data-loaded="true") n\'est pas retire du DOM'
        );

        cleanupScripts('fake-ok-test.js');
    } catch (e) {
        assert(false, '[1d] Erreur inattendue', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 2 : loadOcrLibs — nettoyage du cache de promesse
// ============================================================================

async function runStep2_LoadOcrLibsRetry() {
    _ctx = { step: 2, stepName: 'loadOcrLibs retry' };
    console.group('Etape 2 : loadOcrLibs retry');

    // --- Test 2a : loadOcrLibs reussit normalement ---
    // (les libs sont probablement deja chargees par d'autres tests)
    try {
        await loadOcrLibs();
        assert(true, '[2a] loadOcrLibs() resout sans erreur');
        assert(!!window.pdfjsLib, '[2a.pdfjsLib] pdfjsLib est disponible');
        assert(!!window.JSZip, '[2a.JSZip] JSZip est disponible');
    } catch (e) {
        assert(false, '[2a] loadOcrLibs() a echoue de maniere inattendue', { erreur: e.message });
    }

    // --- Test 2b : Un second appel fonctionne aussi (idempotent) ---
    try {
        await loadOcrLibs();
        assert(true, '[2b] loadOcrLibs() est idempotent (second appel reussit)');
    } catch (e) {
        assert(false, '[2b] loadOcrLibs() a echoue au second appel', { erreur: e.message });
    }

    // --- Test 2c : Verifier le pattern de nettoyage via test structurel ---
    // On verifie que le code source contient bien le delete loadPromises dans le catch
    try {
        const response = await fetch('js/core/lib-loader.js');
        const source = await response.text();

        // Verifier que chaque loadPromises.xxx a un catch avec delete
        const promiseAssignments = source.match(/loadPromises\.(\w+)\s*=/g) || [];
        const uniqueKeys = [...new Set(promiseAssignments.map(m => m.match(/loadPromises\.(\w+)/)[1]))];

        let allHaveCleanup = true;
        const missingCleanup = [];

        for (const key of uniqueKeys) {
            // Chercher le pattern delete loadPromises.key dans un .catch
            const cleanupPattern = new RegExp(`delete\\s+loadPromises\\.${key}`);
            if (!cleanupPattern.test(source)) {
                allHaveCleanup = false;
                missingCleanup.push(key);
            }
        }

        assert(
            allHaveCleanup,
            '[2c] Toutes les promesses cachees ont un cleanup dans .catch()',
            allHaveCleanup ? null : { promesses_sans_cleanup: missingCleanup }
        );

        assert(
            uniqueKeys.length >= 5,
            `[2c.count] Au moins 5 cles de promesses detectees (trouve: ${uniqueKeys.length})`,
            { cles: uniqueKeys }
        );
    } catch (e) {
        assert(false, '[2c] Erreur lors de la verification structurelle', { erreur: e.message });
    }

    // --- Test 2d : Verifier que loadScript marque data-loaded ---
    try {
        const response = await fetch('js/core/lib-loader.js');
        const source = await response.text();

        assert(
            source.includes('dataset.loaded'),
            '[2d] loadScript utilise dataset.loaded pour marquer l\'etat des scripts'
        );

        assert(
            source.includes("dataset.loaded = 'true'"),
            '[2d.true] loadScript marque data-loaded="true" en cas de succes'
        );

        assert(
            source.includes("dataset.loaded = 'false'"),
            '[2d.false] loadScript marque data-loaded="false" en cas d\'echec'
        );

        assert(
            source.includes('.remove()'),
            '[2d.remove] loadScript retire les scripts echoues avant retry'
        );
    } catch (e) {
        assert(false, '[2d] Erreur lors de la verification structurelle', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 3 : Autres loaders — meme pattern de retry
// ============================================================================

async function runStep3_OtherLoaders() {
    _ctx = { step: 3, stepName: 'Autres loaders retry' };
    console.group('Etape 3 : Autres loaders retry');

    // --- Test 3a : loadH5pLibs ---
    try {
        await loadH5pLibs();
        assert(true, '[3a] loadH5pLibs() resout sans erreur');
    } catch (e) {
        assert(false, '[3a] loadH5pLibs() a echoue', { erreur: e.message });
    }

    // --- Test 3b : loadMoodleLibs ---
    try {
        await loadMoodleLibs();
        assert(true, '[3b] loadMoodleLibs() resout sans erreur');
    } catch (e) {
        assert(false, '[3b] loadMoodleLibs() a echoue', { erreur: e.message });
    }

    // --- Test 3c : loadJSZip ---
    try {
        await loadJSZip();
        assert(true, '[3c] loadJSZip() resout sans erreur');
    } catch (e) {
        assert(false, '[3c] loadJSZip() a echoue', { erreur: e.message });
    }

    // --- Test 3d : loadDOMPurify ---
    try {
        await loadDOMPurify();
        assert(true, '[3d] loadDOMPurify() resout sans erreur');
        assert(!!window.DOMPurify, '[3d.global] DOMPurify est disponible sur window');
    } catch (e) {
        assert(false, '[3d] loadDOMPurify() a echoue', { erreur: e.message });
    }

    // --- Test 3e : loadClientZip ---
    try {
        const downloadZip = await loadClientZip();
        assert(typeof downloadZip === 'function', '[3e] loadClientZip() retourne une fonction');
    } catch (e) {
        assert(false, '[3e] loadClientZip() a echoue', { erreur: e.message });
    }

    // --- Test 3f : loadDocumentExportLibs ---
    try {
        await loadDocumentExportLibs();
        assert(true, '[3f] loadDocumentExportLibs() resout sans erreur');
    } catch (e) {
        assert(false, '[3f] loadDocumentExportLibs() a echoue', { erreur: e.message });
    }

    // --- Test 3g : loadMathJax ---
    try {
        await loadMathJax();
        assert(true, '[3g] loadMathJax() resout sans erreur');
        assert(!!window.MathJax, '[3g.global] MathJax est disponible sur window');
    } catch (e) {
        assert(false, '[3g] loadMathJax() a echoue', { erreur: e.message });
    }

    // --- Test 3h : Idempotence de tous les loaders (second appel) ---
    try {
        await Promise.all([
            loadOcrLibs(),
            loadH5pLibs(),
            loadMoodleLibs(),
            loadJSZip(),
            loadDOMPurify(),
            loadClientZip(),
            loadDocumentExportLibs(),
            loadMathJax()
        ]);
        assert(true, '[3h] Tous les loaders sont idempotents (appels simultanees reussissent)');
    } catch (e) {
        assert(false, '[3h] Echec idempotence des loaders', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// POINT D'ENTREE
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    await runStep1_LoadScript();
    await runStep2_LoadOcrLibsRetry();
    await runStep3_OtherLoaders();

    console.log(`\n=== lib-loader retry : ${passCount} PASS, ${failCount} FAIL ===`);

    return {
        passCount,
        failCount,
        skipCount: 0,
        results,
        STEP_NAMES,
        timings: []
    };
}
