/**
 * Tests du coeur d'empaquetage sans effet de bord : packageActivity()
 *
 * Vérifie que js/core/package-activity.js produit, pour chaque exemple H5P,
 * un fichier .h5p valide (ZIP relisible, content.json + h5p.json corrects)
 * — SANS déclencher de téléchargement ni de notification.
 *
 * C'est le garde-fou de la « Couche 0 » du plan d'intégration Éléa / API
 * (docs/specific-plans/PLAN_INTEGRATION_ELEA_BLOCK.md).
 *
 * Usage : ouvrir tests/test-package-activity.html depuis le serveur local.
 */

import { packageActivity, detectPlatform } from '../js/core/package-activity.js';
import { getModuleMetadata } from '../js/h5p/processors/index.js';
import { loadJSZip, loadH5pLibs } from '../js/core/lib-loader.js';
// Réutilise la liste canonique des cas de test (DRY).
import { testCases } from './test-generation-download.js';

// =======================================================================
// MICRO-HARNESS
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { group: '', file: '', module: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        group: _ctx.group,
        file: _ctx.file,
        module: _ctx.module
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message, diagnostic || '');
    } else {
        passCount++;
    }
    results.push(entry);
}

async function fetchRawText(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.text();
}

// =======================================================================
// GROUPE 1 : EMPAQUETAGE H5P SUR TOUS LES EXEMPLES
// =======================================================================

async function runH5PPackaging() {
    _ctx = { group: 'H5P', file: '', module: '' };
    const jsZipReady = typeof JSZip !== 'undefined';

    const h5pCases = testCases.filter(tc => tc.source === 'h5p');

    for (const tc of h5pCases) {
        _ctx = { group: 'H5P', file: tc.file, module: tc.expectedModule };

        try {
            const rawText = await fetchRawText(tc.file);

            // Appel principal : empaquetage sans effet de bord.
            const result = await packageActivity({
                moduleKey: tc.expectedModule,
                content: rawText
            });

            // --- Forme du retour ---
            assert(
                result && result.bytes instanceof Uint8Array && result.bytes.length > 100,
                `[bytes] ${tc.file} : Uint8Array non vide (${result?.bytes?.length || 0} octets)`
            );
            assert(
                result && result.blob instanceof Blob && result.blob.size > 100,
                `[blob] ${tc.file} : Blob non vide (${result?.blob?.size || 0} octets)`
            );
            assert(
                result && typeof result.filename === 'string' && result.filename.endsWith('.h5p'),
                `[filename] ${tc.file} : nom de fichier .h5p ("${result?.filename}")`
            );
            assert(
                result && result.platform === 'h5p',
                `[platform] ${tc.file} : plateforme = "${result?.platform}" (attendu h5p)`
            );

            // --- Cohérence avec les métadonnées ---
            const metadata = getModuleMetadata(tc.expectedModule);
            assert(
                result && metadata && result.mainLibrary === metadata.machineName,
                `[mainLibrary] ${tc.file} : "${result?.mainLibrary}" (attendu "${metadata?.machineName}")`
            );

            // --- Relecture du ZIP ---
            if (jsZipReady && result && result.blob) {
                const zip = await JSZip.loadAsync(result.blob);

                const contentFile = zip.file('content/content.json');
                assert(contentFile !== null, `[zip] ${tc.file} : content/content.json présent`);
                if (contentFile) {
                    const text = await contentFile.async('text');
                    let ok = false;
                    try { JSON.parse(text); ok = true; } catch (e) { /* invalide */ }
                    assert(ok, `[zip] ${tc.file} : content/content.json est du JSON valide`);
                }

                const h5pFile = zip.file('h5p.json');
                assert(h5pFile !== null, `[zip] ${tc.file} : h5p.json présent`);
                if (h5pFile) {
                    const h5pJson = JSON.parse(await h5pFile.async('text'));
                    assert(
                        h5pJson.mainLibrary === metadata.machineName,
                        `[zip] ${tc.file} : h5p.json mainLibrary = "${h5pJson.mainLibrary}"`
                    );
                    assert(
                        Array.isArray(h5pJson.preloadedDependencies) && h5pJson.preloadedDependencies.length > 0,
                        `[zip] ${tc.file} : ${h5pJson.preloadedDependencies?.length || 0} dépendance(s)`
                    );
                    // La lib principale doit figurer dans les dépendances préchargées.
                    const mainInDeps = h5pJson.preloadedDependencies.some(d => d.machineName === h5pJson.mainLibrary);
                    assert(mainInDeps, `[zip] ${tc.file} : mainLibrary présente dans preloadedDependencies`);
                }
            }
        } catch (e) {
            assert(false, `[exception] ${tc.file} : ${e.message}`, { stack: e.stack });
        }
    }
}

// =======================================================================
// GROUPE 2 : ABSENCE D'EFFET DE BORD
// =======================================================================

async function runNoSideEffects() {
    _ctx = { group: 'Pureté', file: '', module: '' };

    // 2a. Aucun téléchargement déclenché : on espionne les <a download> créés.
    const anchorsBefore = document.querySelectorAll('a[download]').length;

    // 2b. Aucune mutation de l'objet d'entrée.
    const tc = testCases.find(t => t.source === 'h5p');
    try {
        const raw = await fetchRawText(tc.file);
        const inputObj = JSON.parse(raw);
        const snapshot = JSON.stringify(inputObj);

        await packageActivity({ moduleKey: tc.expectedModule, content: inputObj });

        assert(
            JSON.stringify(inputObj) === snapshot,
            `[mutation] ${tc.file} : l'objet d'entrée n'est pas muté par packageActivity`
        );
    } catch (e) {
        assert(false, `[mutation] exception : ${e.message}`);
    }

    const anchorsAfter = document.querySelectorAll('a[download]').length;
    assert(
        anchorsAfter === anchorsBefore,
        `[download] aucun <a download> créé (${anchorsBefore} → ${anchorsAfter})`
    );

    // 2c. Équivalence objet ⇄ chaîne : empaqueter le même contenu via objet ou
    //     via chaîne JSON doit produire la même bibliothèque principale.
    try {
        const raw = await fetchRawText(tc.file);
        const viaString = await packageActivity({ moduleKey: tc.expectedModule, content: raw });
        const viaObject = await packageActivity({ moduleKey: tc.expectedModule, content: JSON.parse(raw) });
        assert(
            viaString.mainLibrary === viaObject.mainLibrary && viaString.bytes.length > 0 && viaObject.bytes.length > 0,
            `[équivalence] objet et chaîne produisent le même type (${viaString.mainLibrary})`
        );
    } catch (e) {
        assert(false, `[équivalence] exception : ${e.message}`);
    }
}

// =======================================================================
// GROUPE 3 : VALIDATION DES ENTRÉES ET STUB MOODLE
// =======================================================================

async function runGuards() {
    _ctx = { group: 'Garde-fous', file: '', module: '' };

    // 3a. moduleKey manquant.
    let threw = false;
    try { await packageActivity({ content: '{}' }); } catch (e) { threw = true; }
    assert(threw, `[guard] moduleKey manquant lève une erreur`);

    // 3b. content manquant.
    threw = false;
    try { await packageActivity({ moduleKey: 'Timeline' }); } catch (e) { threw = true; }
    assert(threw, `[guard] content manquant lève une erreur`);

    // 3c. Module H5P inconnu.
    threw = false;
    try { await packageActivity({ moduleKey: 'NImporteQuoi', content: '{}', platform: 'h5p' }); }
    catch (e) { threw = true; }
    assert(threw, `[guard] module H5P inconnu lève une erreur`);

    // 3d. Détection de plateforme.
    assert(detectPlatform('Timeline') === 'h5p', `[detect] Timeline → h5p`);
    assert(detectPlatform('QuizSet') === 'h5p', `[detect] QuizSet → h5p`);
    assert(detectPlatform('Page') === 'moodle', `[detect] Page → moodle`);
    assert(detectPlatform('Livre') === 'moodle', `[detect] Livre → moodle`);

    // 3e. Stub Moodle : doit lever une erreur explicite (pas encore implémenté).
    for (const key of ['Page', 'Livre', 'Millionnaire']) {
        threw = false;
        let msg = '';
        try { await packageActivity({ moduleKey: key, content: '{"title":"x"}' }); }
        catch (e) { threw = true; msg = e.message; }
        assert(
            threw && /moodle/i.test(msg),
            `[stub] ${key} (moodle) lève une erreur explicite "pas encore supportée"`
        );
    }
}

// =======================================================================
// EXÉCUTION
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    // Précharger les libs nécessaires (JSZip pour relire les ZIP ; client-zip
    // est chargé par createH5PBlob lui-même).
    await loadJSZip();
    await loadH5pLibs();

    await runH5PPackaging();
    await runNoSideEffects();
    await runGuards();

    console.log(`\n=== packageActivity : ${passCount} PASS, ${failCount} FAIL ===`);
    return { passCount, failCount, results };
}
