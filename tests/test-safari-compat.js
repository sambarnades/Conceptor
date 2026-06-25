/**
 * @file Tests de compatibilite Safari pour les polyfills PDF.js.
 * Verifie que les polyfills Promise.withResolvers, structuredClone et
 * ReadableStream async iteration fonctionnent correctement et que PDF.js
 * peut extraire du texte meme sur les navigateurs qui ne supportent pas
 * ces API nativement.
 *
 * 4 etapes :
 *  1. Presence des polyfills dans lib-loader.js
 *  2. Comportement de Promise.withResolvers (natif ou polyfill)
 *  3. Comportement de structuredClone (natif ou polyfill)
 *  4. Chargement PDF.js et extraction de texte via getTextContent()
 */

import { loadOcrLibs, LIB_PATHS } from '../js/core/lib-loader.js';

// ============================================================================
// ETAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];

let _ctx = {
    step: 0,
    stepName: '',
    group: ''
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
        group: _ctx.group
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
    'Presence polyfills',
    'Promise.withResolvers',
    'structuredClone',
    'PDF.js getTextContent'
];

export const STEP_DESCRIPTIONS = {
    1: 'Verifie que les polyfills (Promise.withResolvers, structuredClone, ReadableStream async iteration) sont definis et que le worker compat existe',
    2: 'Teste Promise.withResolvers() : resolution, rejet, instances independantes',
    3: 'Teste structuredClone() : deep copy, types primitifs, objets imbriques',
    4: 'Charge PDF.js, cree un PDF minimal et extrait le texte via getTextContent()'
};

// ============================================================================
// ETAPE 1 : PRESENCE DES POLYFILLS
// ============================================================================

async function runStep1_Presence() {
    _ctx = { step: 1, stepName: 'Presence polyfills', group: 'Polyfills' };
    console.group('Etape 1 : Presence des polyfills');

    // Promise.withResolvers doit etre disponible (natif ou polyfill)
    assert(
        typeof Promise.withResolvers === 'function',
        '[1a] Promise.withResolvers est une fonction (natif ou polyfill)'
    );

    // structuredClone doit etre disponible (natif ou polyfill)
    assert(
        typeof globalThis.structuredClone === 'function',
        '[1b] structuredClone est une fonction (natif ou polyfill)'
    );

    // Le fichier worker compat doit exister
    try {
        const resp = await fetch(LIB_PATHS.PDF_JS_WORKER, { method: 'HEAD' });
        assert(
            resp.ok,
            '[1c] Le fichier worker compat existe sur le serveur',
            { chemin: LIB_PATHS.PDF_JS_WORKER, status: resp.status }
        );
    } catch (e) {
        assert(false, '[1c] Le fichier worker compat existe sur le serveur', {
            chemin: LIB_PATHS.PDF_JS_WORKER,
            erreur: e.message
        });
    }

    // Le chemin du worker doit pointer vers le wrapper compat
    assert(
        LIB_PATHS.PDF_JS_WORKER.includes('compat'),
        '[1d] LIB_PATHS.PDF_JS_WORKER pointe vers le wrapper compat',
        { chemin: LIB_PATHS.PDF_JS_WORKER }
    );

    // ReadableStream async iteration doit etre disponible (natif ou polyfill)
    assert(
        typeof ReadableStream !== 'undefined' &&
        typeof ReadableStream.prototype[Symbol.asyncIterator] === 'function',
        '[1f] ReadableStream[Symbol.asyncIterator] est une fonction (natif ou polyfill)',
        { info: 'Requis par PDF.js 5.x getTextContent() qui fait for await...of sur un ReadableStream' }
    );

    // Le fichier worker original doit aussi exister (le compat l'importe)
    const originalWorkerPath = LIB_PATHS.PDF_JS_WORKER.replace('compat', 'min');
    try {
        const resp = await fetch(originalWorkerPath, { method: 'HEAD' });
        assert(
            resp.ok,
            '[1e] Le fichier worker original (pdf.worker.min.mjs) existe aussi',
            { chemin: originalWorkerPath, status: resp.status }
        );
    } catch (e) {
        assert(false, '[1e] Le fichier worker original (pdf.worker.min.mjs) existe aussi', {
            chemin: originalWorkerPath,
            erreur: e.message
        });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 2 : PROMISE.WITHRESOLVERS
// ============================================================================

async function runStep2_PromiseWithResolvers() {
    _ctx = { step: 2, stepName: 'Promise.withResolvers', group: 'Promise.withResolvers' };
    console.group('Etape 2 : Promise.withResolvers');

    // --- Retourne un objet avec promise, resolve, reject ---
    try {
        const result = Promise.withResolvers();
        assert(
            result !== null && typeof result === 'object',
            '[2a] Promise.withResolvers() retourne un objet'
        );
        assert(
            result.promise instanceof Promise,
            '[2b] result.promise est une instance de Promise'
        );
        assert(
            typeof result.resolve === 'function',
            '[2c] result.resolve est une fonction'
        );
        assert(
            typeof result.reject === 'function',
            '[2d] result.reject est une fonction'
        );
    } catch (e) {
        assert(false, '[2a-d] Promise.withResolvers() basic', { erreur: e.message });
    }

    // --- Resolution ---
    try {
        const { promise, resolve } = Promise.withResolvers();
        resolve('test-value');
        const value = await promise;
        assert(
            value === 'test-value',
            '[2e] resolve() resout la promesse avec la bonne valeur',
            { attendu: 'test-value', obtenu: value }
        );
    } catch (e) {
        assert(false, '[2e] resolve() resout la promesse', { erreur: e.message });
    }

    // --- Rejet ---
    try {
        const { promise, reject } = Promise.withResolvers();
        const testError = new Error('test-rejection');
        reject(testError);
        try {
            await promise;
            assert(false, '[2f] reject() devrait rejeter la promesse');
        } catch (err) {
            assert(
                err === testError,
                '[2f] reject() rejette la promesse avec la bonne erreur'
            );
        }
    } catch (e) {
        assert(false, '[2f] reject() test', { erreur: e.message });
    }

    // --- Instances independantes ---
    try {
        const a = Promise.withResolvers();
        const b = Promise.withResolvers();
        assert(
            a.promise !== b.promise,
            '[2g] Deux appels retournent des promesses differentes'
        );
        a.resolve('a');
        b.resolve('b');
        const [va, vb] = await Promise.all([a.promise, b.promise]);
        assert(
            va === 'a' && vb === 'b',
            '[2h] Les instances sont independantes (a="a", b="b")',
            { va, vb }
        );
    } catch (e) {
        assert(false, '[2g-h] Instances independantes', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 3 : STRUCTUREDCLONE
// ============================================================================

async function runStep3_StructuredClone() {
    _ctx = { step: 3, stepName: 'structuredClone', group: 'structuredClone' };
    console.group('Etape 3 : structuredClone');

    // --- Deep copy d'un objet simple ---
    try {
        const original = { a: 1, b: 'hello', c: true, d: null };
        const clone = structuredClone(original);
        assert(
            JSON.stringify(clone) === JSON.stringify(original),
            '[3a] Deep copy d\'un objet simple preservee',
            { original, clone }
        );
        assert(
            clone !== original,
            '[3b] Le clone est un objet distinct de l\'original'
        );
    } catch (e) {
        assert(false, '[3a-b] Deep copy simple', { erreur: e.message });
    }

    // --- Deep copy d'un objet imbrique ---
    try {
        const original = {
            level1: {
                level2: {
                    value: 42,
                    array: [1, 2, 3]
                }
            }
        };
        const clone = structuredClone(original);
        clone.level1.level2.value = 999;
        clone.level1.level2.array.push(4);
        assert(
            original.level1.level2.value === 42,
            '[3c] Modification du clone ne modifie pas l\'original (valeur)',
            { original: original.level1.level2.value, clone: clone.level1.level2.value }
        );
        assert(
            original.level1.level2.array.length === 3,
            '[3d] Modification du clone ne modifie pas l\'original (tableau)',
            { originalLength: original.level1.level2.array.length, cloneLength: clone.level1.level2.array.length }
        );
    } catch (e) {
        assert(false, '[3c-d] Deep copy imbriquee', { erreur: e.message });
    }

    // --- Tableaux ---
    try {
        const original = [1, [2, 3], { key: 'value' }];
        const clone = structuredClone(original);
        assert(
            Array.isArray(clone),
            '[3e] structuredClone d\'un tableau retourne un tableau'
        );
        assert(
            clone.length === 3 && clone[1][0] === 2 && clone[2].key === 'value',
            '[3f] Contenu du tableau clone est correct',
            { clone }
        );
    } catch (e) {
        assert(false, '[3e-f] Clone de tableaux', { erreur: e.message });
    }

    // --- Types primitifs ---
    try {
        assert(structuredClone(42) === 42, '[3g] Clone de number');
        assert(structuredClone('hello') === 'hello', '[3h] Clone de string');
        assert(structuredClone(true) === true, '[3i] Clone de boolean');
        assert(structuredClone(null) === null, '[3j] Clone de null');
    } catch (e) {
        assert(false, '[3g-j] Clone de primitifs', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 4 : PDF.JS GETTEXTCONTENT
// ============================================================================

async function runStep4_PdfJsGetTextContent() {
    _ctx = { step: 4, stepName: 'PDF.js getTextContent', group: 'PDF.js' };
    console.group('Etape 4 : PDF.js getTextContent');

    // --- Chargement de PDF.js ---
    try {
        await loadOcrLibs();
        assert(
            !!window.pdfjsLib,
            '[4a] window.pdfjsLib est disponible apres loadOcrLibs()'
        );
        assert(
            typeof window.pdfjsLib.getDocument === 'function',
            '[4b] pdfjsLib.getDocument est une fonction'
        );
    } catch (e) {
        assert(false, '[4a-b] Chargement PDF.js', { erreur: e.message, stack: e.stack });
        console.groupEnd();
        return;
    }

    // --- Creer un PDF minimal en memoire et extraire le texte ---
    // On utilise jsPDF pour creer un vrai PDF, puis on le lit avec PDF.js
    try {
        // Charger jsPDF si pas encore fait
        if (!window.jspdf) {
            const { loadDocumentExportLibs } = await import('../js/core/lib-loader.js');
            await loadDocumentExportLibs();
        }

        // Creer un PDF avec du texte connu
        const testText = 'Caramel Safari compatibility test 2024';
        const doc = new window.jspdf.jsPDF();
        doc.text(testText, 20, 20);
        const pdfBlob = doc.output('blob');

        assert(
            pdfBlob instanceof Blob && pdfBlob.size > 0,
            '[4c] PDF de test cree avec succes',
            { taille: pdfBlob.size }
        );

        // Charger le PDF avec PDF.js
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        assert(
            pdfDoc.numPages === 1,
            '[4d] Le PDF de test a 1 page',
            { numPages: pdfDoc.numPages }
        );

        // Extraire le texte de la premiere page
        const page = await pdfDoc.getPage(1);
        assert(
            page !== null && page !== undefined,
            '[4e] getPage(1) retourne un objet page'
        );

        const textContent = await page.getTextContent();
        assert(
            textContent !== null && textContent !== undefined,
            '[4f] getTextContent() retourne un resultat (pas d\'erreur sur Safari)'
        );

        assert(
            Array.isArray(textContent.items),
            '[4g] textContent.items est un tableau',
            { type: typeof textContent.items }
        );

        const extractedText = textContent.items.map(item => item.str).join(' ');
        assert(
            extractedText.length > 0,
            '[4h] Du texte a ete extrait du PDF',
            { texteExtrait: extractedText }
        );

        // Verifier que le texte extrait contient le texte original
        // (la correspondance exacte depend du rendu de jsPDF, on verifie les mots cles)
        const containsKeywords = extractedText.includes('Caramel') || extractedText.includes('Safari') || extractedText.includes('compatibility');
        assert(
            containsKeywords,
            '[4i] Le texte extrait contient les mots attendus',
            { texteOriginal: testText, texteExtrait: extractedText }
        );

    } catch (e) {
        assert(false, '[4c-i] Extraction texte PDF via getTextContent()', {
            erreur: e.message,
            stack: e.stack,
            conseil: 'Si cette erreur survient uniquement sur Safari, verifier que les polyfills sont charges AVANT pdf.js'
        });
    }

    // --- Tester le pipeline complet comme dans ocr.js ---
    try {
        const testText = 'Les eleves etudient les mathematiques avec des formules.';
        const doc = new window.jspdf.jsPDF();
        doc.text(testText, 20, 20);
        doc.text('Page 1 avec du contenu pedagogique.', 20, 40);
        const pdfBlob = doc.output('blob');

        // Simuler le pipeline de ocr.js : file.arrayBuffer() → getDocument({data}) → getTextContent
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map(item => item.str);
        const fullText = strings.join(' ');

        assert(
            fullText.length > 10,
            '[4j] Pipeline complet ocr.js (arrayBuffer → getDocument → getTextContent) fonctionne',
            { longueurTexte: fullText.length, extrait: fullText.substring(0, 80) }
        );
    } catch (e) {
        assert(false, '[4j] Pipeline complet ocr.js', {
            erreur: e.message,
            stack: e.stack
        });
    }

    console.groupEnd();
}

// ============================================================================
// EXECUTION PRINCIPALE
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    await runStep1_Presence();
    await runStep2_PromiseWithResolvers();
    await runStep3_StructuredClone();
    await runStep4_PdfJsGetTextContent();

    console.log(`\n=== SAFARI COMPAT : ${passCount} PASS, ${failCount} FAIL ===\n`);

    return { passCount, failCount, skipCount: 0, results, STEP_NAMES };
}
