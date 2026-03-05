/**
 * Tests de performance de Caramel (Suite 10)
 *
 * Benchmarks des operations critiques :
 * 1. Chargement i18n (fetch locales, tailles, translatePage)
 * 2. JSON Healer (healJsonString, pipeline complet)
 * 3. Processeurs H5P (processH5PContent, 19 types)
 * 4. Creation blob H5P (createH5PBlob, 6 types representatifs)
 *
 * Les seuils sont genereux (2-3x le temps attendu) pour eviter les faux positifs.
 * La valeur principale est l'onglet Performances qui affiche les temps reels.
 *
 * Pas d'iframe — imports ES6 directs.
 *
 * Usage : ouvrir tests/test-performance.html depuis le serveur local.
 */

import { loadTranslations, translatePage, translations } from '../js/core/translation.js';
import { cleanJsonInput } from '../js/core/utils.js';
import { healJsonString, healJsonObject, healActivitySpecificFields, healStructureForActivity } from '../js/h5p/json-healer.js';
import { processH5PContent, getModuleMetadata } from '../js/h5p/processors/index.js';
import { createH5PBlob } from '../js/h5p/h5p-creator.js';
import { loadClientZip } from '../js/core/lib-loader.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
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
// CONSTANTES
// =======================================================================

const LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

/** 19 fixtures H5P (meme mapping que les autres suites de test) */
const H5P_FIXTURES = [
    { file: 'timeline_1.json',            moduleKey: 'Timeline' },
    { file: 'flashcards_1.json',          moduleKey: 'Flashcards' },
    { file: 'quiz_mixte_1.json',          moduleKey: 'QuizSet' },
    { file: 'quiz_qcm_1.json',            moduleKey: 'QuizSetQCM' },
    { file: 'quiz_vraifaux_1.json',        moduleKey: 'QuizSetVF' },
    { file: 'accordion_1.json',            moduleKey: 'Glossary' },
    { file: 'crosswords_1.json',           moduleKey: 'Crossword' },
    { file: 'essay_1.json',               moduleKey: 'Essay' },
    { file: 'summary_1.json',             moduleKey: 'Summary' },
    { file: 'drag_the_words_1.json',       moduleKey: 'DragTheWords' },
    { file: 'drag_and_drop_1.json',        moduleKey: 'DragAndDrop' },
    { file: 'fill_in_the_blanks_1.json',   moduleKey: 'FillInTheBlanks' },
    { file: 'mark_the_words_1.json',       moduleKey: 'MarkTheWords' },
    { file: 'mark_the_words_3.json',       moduleKey: 'MarkTheWords' },
    { file: 'mark_the_words_4.json',       moduleKey: 'MarkTheWords' },
    { file: 'true_false_1.json',           moduleKey: 'TrueFalse' },
    { file: 'multiple_choice_1.json',      moduleKey: 'MultipleChoice' },
    { file: 'find_the_words_1.json',       moduleKey: 'FindTheWords' },
    { file: 'sort_the_paragraphs_1.json',  moduleKey: 'SortParagraphs' },
    { file: 'single_choice_set_1.json',    moduleKey: 'SingleChoiceSet' },
    { file: 'dialog_cards_1.json',         moduleKey: 'DialogCards' },
    { file: 'charts_1.json',              moduleKey: 'Chart' },
    { file: 'quiz_qcm_5.json',            moduleKey: 'QuizSetQCM' }
];

/** Types representatifs pour le test de creation de blob (etape 4) */
const BLOB_TEST_MODULES = ['Timeline', 'MultipleChoice', 'QuizSet', 'Crossword', 'Flashcards', 'DragAndDrop'];

const EXAMPLES_DIR = '../assets/data/examples';
const LOCALES_DIR = '../js/locales';

// Seuils de performance (genereux pour eviter les tests flaky)
const THRESHOLDS = {
    LOCALE_FETCH: 500,          // ms par locale
    LOCALE_SIZE: 400 * 1024,    // 400 Ko par fichier
    TOTAL_LOCALES_SIZE: 4 * 1024 * 1024, // 4 Mo total
    TRANSLATE_PAGE: 200,        // ms
    HEAL_STRING: 100,           // ms par fixture
    HEAL_STRING_AVG: 50,        // ms moyenne
    HEAL_PIPELINE: 200,         // ms pipeline complet
    PROCESS_H5P: 500,           // ms par type (inclut lazy-load)
    PROCESS_H5P_AVG: 200,       // ms moyenne
    CLIENT_ZIP_LOAD: 2000,      // ms chargement client-zip
    CREATE_BLOB: 1000,          // ms par blob
    CREATE_BLOB_AVG: 500        // ms moyenne
};

// Stockage partage entre etapes
const fixtureTexts = {};   // moduleKey → texte brut JSON
const fixtureData = {};    // moduleKey → objet parse
const processedResults = {}; // moduleKey → resultat processH5PContent

// =======================================================================
// ETAPE 1 : PERFORMANCE i18n
// =======================================================================

async function runStep1_I18n() {
    console.group('Etape 1 : Performance i18n');
    _ctx = { step: 1, stepName: 'i18n', file: '', module: '', source: '' };
    const t0 = performance.now();

    let totalSize = 0;

    // Fetch chaque locale et mesurer temps + taille
    for (const lang of LANGS) {
        const url = `${LOCALES_DIR}/${lang}.json`;
        const tFetch = performance.now();
        try {
            const resp = await fetch(url);
            const text = await resp.text();
            const duration = performance.now() - tFetch;
            const size = new Blob([text]).size;
            totalSize += size;

            assert(
                resp.ok,
                `[1a.${lang}] Fetch ${lang}.json → HTTP ${resp.status}`,
                !resp.ok ? { status: resp.status } : null
            );

            assert(
                duration < THRESHOLDS.LOCALE_FETCH,
                `[1b.${lang}] Fetch ${lang}.json en ${Math.round(duration)}ms (seuil ${THRESHOLDS.LOCALE_FETCH}ms)`,
                duration >= THRESHOLDS.LOCALE_FETCH ? { duree: Math.round(duration) } : null
            );

            const sizeKo = Math.round(size / 1024);
            assert(
                size < THRESHOLDS.LOCALE_SIZE,
                `[1c.${lang}] Taille ${lang}.json = ${sizeKo} Ko (seuil ${Math.round(THRESHOLDS.LOCALE_SIZE / 1024)} Ko)`,
                size >= THRESHOLDS.LOCALE_SIZE ? { taille: sizeKo } : null
            );

            recordTiming('i18n', `Fetch ${lang}.json (${sizeKo} Ko)`, duration);
        } catch (e) {
            assert(false, `[1a.${lang}] Exception fetch ${lang}.json : ${e.message}`);
            assert(false, `[1b.${lang}] Timing non mesurable`);
            assert(false, `[1c.${lang}] Taille non mesurable`);
        }
    }

    // Taille totale
    const totalMo = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    assert(
        totalSize < THRESHOLDS.TOTAL_LOCALES_SIZE,
        `[1d.Total] Taille totale locales = ${totalMo} Mo (seuil ${Math.round(THRESHOLDS.TOTAL_LOCALES_SIZE / 1024 / 1024)} Mo)`,
        totalSize >= THRESHOLDS.TOTAL_LOCALES_SIZE ? { taille: totalMo } : null
    );

    // Benchmark translatePage() sur un conteneur synthetique
    try {
        // Charger les traductions francaises pour avoir les cles
        await loadTranslations('fr');

        const container = document.createElement('div');
        container.style.display = 'none';
        const sampleKeys = Object.keys(translations).slice(0, 50);
        for (const key of sampleKeys) {
            const span = document.createElement('span');
            span.setAttribute('data-key', key);
            span.textContent = key;
            container.appendChild(span);
        }
        document.body.appendChild(container);

        const tTranslate = performance.now();
        translatePage(container);
        const duration = performance.now() - tTranslate;

        document.body.removeChild(container);

        assert(
            duration < THRESHOLDS.TRANSLATE_PAGE,
            `[1e.translatePage] translatePage(50 elements) en ${Math.round(duration)}ms (seuil ${THRESHOLDS.TRANSLATE_PAGE}ms)`,
            duration >= THRESHOLDS.TRANSLATE_PAGE ? { duree: Math.round(duration) } : null
        );
        recordTiming('i18n', `translatePage (50 data-key)`, duration);
    } catch (e) {
        assert(false, `[1e.translatePage] Exception : ${e.message}`, { stack: e.stack?.substring(0, 200) });
    }

    recordTiming('i18n', 'Etape complete', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : JSON HEALER
// =======================================================================

async function runStep2_JsonHealer() {
    console.group('Etape 2 : JSON Healer');
    _ctx = { step: 2, stepName: 'Healer', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Charger toutes les fixtures comme texte brut
    let loaded = 0;
    for (const entry of H5P_FIXTURES) {
        try {
            const resp = await fetch(`${EXAMPLES_DIR}/${entry.file}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = await resp.text();
            fixtureTexts[entry.moduleKey] = text;
            fixtureData[entry.moduleKey] = JSON.parse(text);
            loaded++;
        } catch (e) {
            console.warn(`Fixture ${entry.file} non chargee :`, e.message);
        }
    }

    // Benchmark healJsonString() sur chaque fixture
    let totalHealTime = 0;
    let healCount = 0;

    for (const entry of H5P_FIXTURES) {
        const raw = fixtureTexts[entry.moduleKey];
        if (!raw) continue;

        const tHeal = performance.now();
        try {
            const healed = healJsonString(raw);
            const duration = performance.now() - tHeal;
            totalHealTime += duration;
            healCount++;

            assert(
                duration < THRESHOLDS.HEAL_STRING,
                `[2a.${entry.moduleKey}] healJsonString en ${Math.round(duration)}ms (seuil ${THRESHOLDS.HEAL_STRING}ms)`,
                duration >= THRESHOLDS.HEAL_STRING ? { duree: Math.round(duration), taille: raw.length } : null
            );
            recordTiming('Healer', `healJsonString(${entry.moduleKey})`, duration);
        } catch (e) {
            assert(false, `[2a.${entry.moduleKey}] Exception : ${e.message}`);
        }
    }

    // Moyenne healJsonString
    if (healCount > 0) {
        const avg = totalHealTime / healCount;
        assert(
            avg < THRESHOLDS.HEAL_STRING_AVG,
            `[2b.Moyenne] healJsonString moyenne = ${Math.round(avg)}ms (seuil ${THRESHOLDS.HEAL_STRING_AVG}ms)`,
            avg >= THRESHOLDS.HEAL_STRING_AVG ? { moyenne: Math.round(avg), count: healCount } : null
        );
        recordTiming('Healer', `Moyenne (${healCount} fixtures)`, avg);
    }

    // Benchmark pipeline complet sur 6 types representatifs
    const pipelineTypes = ['Timeline', 'MultipleChoice', 'QuizSet', 'Crossword', 'Flashcards', 'DragAndDrop'];

    for (const moduleKey of pipelineTypes) {
        const raw = fixtureTexts[moduleKey];
        if (!raw) continue;

        const tPipe = performance.now();
        try {
            const cleaned = cleanJsonInput(raw);
            const healed = healJsonString(cleaned);
            const parsed = JSON.parse(healed);
            const objHealed = healJsonObject(structuredClone(parsed), moduleKey);
            healActivitySpecificFields(objHealed, moduleKey);
            healStructureForActivity(objHealed, moduleKey);
            const duration = performance.now() - tPipe;

            assert(
                duration < THRESHOLDS.HEAL_PIPELINE,
                `[2c.${moduleKey}] Pipeline complet en ${Math.round(duration)}ms (seuil ${THRESHOLDS.HEAL_PIPELINE}ms)`,
                duration >= THRESHOLDS.HEAL_PIPELINE ? { duree: Math.round(duration) } : null
            );
            recordTiming('Healer', `Pipeline complet(${moduleKey})`, duration);
        } catch (e) {
            assert(false, `[2c.${moduleKey}] Exception pipeline : ${e.message}`);
        }
    }

    recordTiming('Healer', 'Etape complete', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : PROCESSEURS H5P
// =======================================================================

async function runStep3_Processors() {
    console.group('Etape 3 : Processeurs H5P');
    _ctx = { step: 3, stepName: 'Processeurs', file: '', module: '', source: '' };
    const t0 = performance.now();

    let totalProcessTime = 0;
    let processCount = 0;
    const failedTypes = [];

    for (const entry of H5P_FIXTURES) {
        const fixture = fixtureData[entry.moduleKey];
        if (!fixture) {
            assert(false, `[3a.${entry.moduleKey}] Fixture non disponible`);
            failedTypes.push(entry.moduleKey);
            continue;
        }

        const tProcess = performance.now();
        try {
            // Preparer le JSON (heal avant process, comme en production)
            const healed = healJsonObject(structuredClone(fixture), entry.moduleKey);
            healActivitySpecificFields(healed, entry.moduleKey);
            healStructureForActivity(healed, entry.moduleKey);

            const result = await processH5PContent(entry.moduleKey, structuredClone(healed));
            const duration = performance.now() - tProcess;
            totalProcessTime += duration;
            processCount++;

            assert(
                result !== null && result !== undefined,
                `[3a.${entry.moduleKey}] processH5PContent retourne un resultat (${Math.round(duration)}ms)`,
                result == null ? { resultat: 'null' } : null
            );

            assert(
                duration < THRESHOLDS.PROCESS_H5P,
                `[3b.${entry.moduleKey}] processH5PContent en ${Math.round(duration)}ms (seuil ${THRESHOLDS.PROCESS_H5P}ms)`,
                duration >= THRESHOLDS.PROCESS_H5P ? { duree: Math.round(duration) } : null
            );

            // Stocker pour l'etape 4
            if (result) {
                processedResults[entry.moduleKey] = result;
            }

            recordTiming('Processeurs', `processH5PContent(${entry.moduleKey})`, duration);
        } catch (e) {
            assert(false, `[3a.${entry.moduleKey}] Exception : ${e.message}`, { stack: e.stack?.substring(0, 200) });
            assert(false, `[3b.${entry.moduleKey}] Timing non mesurable`);
            failedTypes.push(entry.moduleKey);
        }
    }

    // Moyenne
    if (processCount > 0) {
        const avg = totalProcessTime / processCount;
        assert(
            avg < THRESHOLDS.PROCESS_H5P_AVG,
            `[3c.Moyenne] processH5PContent moyenne = ${Math.round(avg)}ms (seuil ${THRESHOLDS.PROCESS_H5P_AVG}ms)`,
            avg >= THRESHOLDS.PROCESS_H5P_AVG ? { moyenne: Math.round(avg), count: processCount } : null
        );
        recordTiming('Processeurs', `Moyenne (${processCount} types)`, avg);
    }

    recordTiming('Processeurs', 'Etape complete', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : CREATION BLOB H5P
// =======================================================================

async function runStep4_BlobCreation() {
    console.group('Etape 4 : Creation blob H5P');
    _ctx = { step: 4, stepName: 'Blobs', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Precharger client-zip
    const tZip = performance.now();
    try {
        await loadClientZip();
        const duration = performance.now() - tZip;
        assert(
            duration < THRESHOLDS.CLIENT_ZIP_LOAD,
            `[4a.ClientZip] Chargement client-zip en ${Math.round(duration)}ms (seuil ${THRESHOLDS.CLIENT_ZIP_LOAD}ms)`,
            duration >= THRESHOLDS.CLIENT_ZIP_LOAD ? { duree: Math.round(duration) } : null
        );
        recordTiming('Blobs', 'Chargement client-zip', duration);
    } catch (e) {
        assert(false, `[4a.ClientZip] Exception : ${e.message}`);
        // On continue quand meme — createH5PBlob charge client-zip en interne si besoin
    }

    // Creer les blobs pour 6 types representatifs
    let totalBlobTime = 0;
    let blobCount = 0;

    for (const moduleKey of BLOB_TEST_MODULES) {
        const processed = processedResults[moduleKey];
        if (!processed) {
            assert(false, `[4b.${moduleKey}] Pas de resultat traite (etape 3 echouee ?)`);
            assert(false, `[4c.${moduleKey}] Blob non cree`);
            continue;
        }

        const meta = getModuleMetadata(moduleKey);
        if (!meta) {
            assert(false, `[4b.${moduleKey}] Metadata non trouvee`);
            assert(false, `[4c.${moduleKey}] Blob non cree`);
            continue;
        }

        // Construire la liste des dependances (mainLibrary + extraDependencies)
        const mainDep = { machineName: meta.machineName, majorVersion: 1, minorVersion: 0 };
        const dependencies = [mainDep, ...meta.extraDependencies];

        const tBlob = performance.now();
        try {
            const blob = await createH5PBlob(processed, meta.machineName, dependencies, {
                title: `Perf test ${moduleKey}`,
                lang: 'fr'
            });
            const duration = performance.now() - tBlob;
            totalBlobTime += duration;
            blobCount++;

            // Verifier que c'est un Blob valide (duck-typing pour cross-context)
            const isBlob = blob && typeof blob.size === 'number' && typeof blob.type === 'string';
            assert(
                isBlob && blob.size > 0,
                `[4b.${moduleKey}] createH5PBlob → ${isBlob ? Math.round(blob.size / 1024) + ' Ko' : 'invalide'} (${Math.round(duration)}ms)`,
                !isBlob || blob.size === 0 ? { size: blob?.size, type: typeof blob } : null
            );

            assert(
                duration < THRESHOLDS.CREATE_BLOB,
                `[4c.${moduleKey}] createH5PBlob en ${Math.round(duration)}ms (seuil ${THRESHOLDS.CREATE_BLOB}ms)`,
                duration >= THRESHOLDS.CREATE_BLOB ? { duree: Math.round(duration) } : null
            );

            recordTiming('Blobs', `createH5PBlob(${moduleKey})`, duration);
        } catch (e) {
            assert(false, `[4b.${moduleKey}] Exception : ${e.message}`, { stack: e.stack?.substring(0, 200) });
            assert(false, `[4c.${moduleKey}] Timing non mesurable`);
        }
    }

    // Moyenne
    if (blobCount > 0) {
        const avg = totalBlobTime / blobCount;
        assert(
            avg < THRESHOLDS.CREATE_BLOB_AVG,
            `[4d.Moyenne] createH5PBlob moyenne = ${Math.round(avg)}ms (seuil ${THRESHOLDS.CREATE_BLOB_AVG}ms)`,
            avg >= THRESHOLDS.CREATE_BLOB_AVG ? { moyenne: Math.round(avg), count: blobCount } : null
        );
        recordTiming('Blobs', `Moyenne (${blobCount} types)`, avg);
    }

    recordTiming('Blobs', 'Etape complete', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'i18n',
    'Healer',
    'Processeurs',
    'Blobs'
];

export const STEP_DESCRIPTIONS = [
    '',
    `Mesure les temps de chargement des ${LANGS.length} fichiers de traduction (fetch + taille < ${Math.round(THRESHOLDS.LOCALE_SIZE / 1024)} Ko, total < ${Math.round(THRESHOLDS.TOTAL_LOCALES_SIZE / 1024 / 1024)} Mo) et benchmark translatePage() sur 50 elements.`,
    `Benchmark healJsonString() sur les ${H5P_FIXTURES.length} fixtures H5P (seuil < ${THRESHOLDS.HEAL_STRING}ms, moyenne < ${THRESHOLDS.HEAL_STRING_AVG}ms) et le pipeline complet (clean + heal + healObj + healActivity + healStructure) sur 6 types.`,
    `Benchmark processH5PContent() pour les ${H5P_FIXTURES.length} types H5P (seuil < ${THRESHOLDS.PROCESS_H5P}ms chacun, moyenne < ${THRESHOLDS.PROCESS_H5P_AVG}ms). Inclut le chargement paresseux du processeur.`,
    `Benchmark createH5PBlob() pour ${BLOB_TEST_MODULES.length} types representatifs (seuil < ${THRESHOLDS.CREATE_BLOB}ms, moyenne < ${THRESHOLDS.CREATE_BLOB_AVG}ms). Inclut le chargement de client-zip.`
];

/**
 * Lance tous les tests de performance.
 */
export async function runAllTests() {
    console.log(`=== Tests Performance Caramel (4 etapes) ===`);
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_I18n();
    await runStep2_JsonHealer();
    await runStep3_Processors();
    await runStep4_BlobCreation();

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests performance', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
