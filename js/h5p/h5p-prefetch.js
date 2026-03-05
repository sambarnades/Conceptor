/**
 * @file Préchargement anticipé des assets H5P (bibliothèques h5p-libs).
 *
 * Ce module résout l'arbre de dépendances d'une activité H5P et pré-charge
 * tous les fichiers (library.json, JS, CSS) en mémoire (Map).
 *
 * Le cache mémoire est consulté par le fetch interceptor de h5p-manager.js :
 * quand H5PStandalone demande un fichier de bibliothèque, il est servi
 * instantanément depuis la RAM au lieu de faire un aller-retour réseau.
 *
 * Contrôle d'intégrité : chaque bibliothèque est vérifiée (library.json valide,
 * tous les assets JS/CSS récupérés avec succès). Les bibliothèques en échec
 * peuvent être re-tentées automatiquement ou manuellement.
 *
 * @module h5p/h5p-prefetch
 * @exports {Function} prefetchH5PLibraries - Lance le préchargement pour un moduleKey
 * @exports {Function} getPrefetchStatus - Retourne l'état de toutes les bibliothèques
 * @exports {Function} retryFailed - Re-tente le préchargement des bibliothèques en échec
 * @exports {Map} assetCache - Cache mémoire partagé (URL → {blob, contentType})
 */

import { LIB_PATHS } from '../core/lib-loader.js';
import { getModuleMetadata } from './processors/index.js';
import { debugLog } from '../core/utils.js';
import * as perf from '../core/perf-tracker.js';

const librariesBasePath = LIB_PATHS.H5P_LIBRARIES;

/**
 * Cache mémoire des assets préchargés.
 * Clé = URL relative (ex: 'js/vendor/h5p-libs/H5P.Flashcards-1.6/library.json')
 * Valeur = { blob: Blob, contentType: string }
 *
 * Exporté pour être consommé par le fetch interceptor de h5p-manager.js.
 * @type {Map<string, {blob: Blob, contentType: string}>}
 */
export const assetCache = new Map();

/**
 * État de préchargement par bibliothèque.
 * Clé = nom du répertoire (ex: 'H5P.Flashcards-1.6')
 * Valeur = { status: 'ok'|'partial'|'failed', total: N, loaded: N, failed: [...urls] }
 * @type {Map<string, {status: string, total: number, loaded: number, failed: string[]}>}
 */
const libStatus = new Map();

/**
 * Infos de dépendance sauvegardées pour pouvoir re-tenter les bibliothèques en échec.
 * @type {Map<string, {machineName: string, majorVersion: number, minorVersion: number}>}
 */
const depInfoByDir = new Map();

/**
 * Construit le nom de répertoire h5p-libs à partir des infos de dépendance.
 * Format : {machineName}-{majorVersion}.{minorVersion}
 * @param {string} machineName - Ex: 'H5P.Flashcards'
 * @param {number} major - Version majeure
 * @param {number} minor - Version mineure
 * @returns {string} Ex: 'H5P.Flashcards-1.7'
 */
function buildDirName(machineName, major, minor) {
    return `${machineName}-${major}.${minor}`;
}

/**
 * Détermine le Content-Type d'un fichier à partir de son extension.
 * @param {string} filename
 * @returns {string}
 */
function getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'json': 'application/json',
        'js': 'application/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'eot': 'application/vnd.ms-fontobject'
    };
    return types[ext] || 'application/octet-stream';
}

/**
 * Pré-charge tous les assets h5p-libs nécessaires pour une activité.
 * Résout récursivement l'arbre de dépendances via library.json.
 * Stocke chaque fichier en mémoire dans assetCache.
 *
 * Si une bibliothèque est déjà entièrement chargée (status 'ok'), elle est sautée.
 * Les bibliothèques partiellement chargées ou en échec sont re-tentées.
 *
 * @param {string} moduleKey - Clé du module H5P (ex: 'Flashcards', 'QuizSet')
 */
export async function prefetchH5PLibraries(moduleKey) {
    const meta = getModuleMetadata(moduleKey);
    if (!meta) return;

    const { machineName, version, extraDependencies } = meta;

    // Point de départ : bibliothèque principale + dépendances déclarées dans processorMetadata
    const initialDeps = [
        { machineName, majorVersion: version.major, minorVersion: version.minor },
        ...extraDependencies
    ];

    // QuizSet / QuizSetQCM / QuizSetVF : précharger aussi TOUS les sous-types de questions
    // car H5PStandalone les charge dynamiquement à partir du JSON généré par le LLM.
    // Sans ça, chaque sous-type (MultiChoice, TrueFalse, Blanks, etc.) génère un CACHE MISS.
    if (moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') {
        const quizSubTypes = [
            'MultipleChoice', 'TrueFalse', 'FillInTheBlanks', 'DragTheWords',
            'MarkTheWords', 'DragAndDrop', 'SingleChoiceSet', 'Summary',
            'Essay', 'SortParagraphs', 'ComplexFillTheBlanks'
        ];
        for (const subKey of quizSubTypes) {
            const subMeta = getModuleMetadata(subKey);
            if (subMeta) {
                initialDeps.push({
                    machineName: subMeta.machineName,
                    majorVersion: subMeta.version.major,
                    minorVersion: subMeta.version.minor
                });
                // Ajouter aussi les extraDependencies du sous-type
                initialDeps.push(...subMeta.extraDependencies);
            }
        }
    }

    // Dédupliquer les dépendances (QuizSet peut générer beaucoup de doublons
    // car les sous-types partagent des dépendances communes comme FontAwesome, MathDisplay, etc.)
    const seen = new Set();
    const uniqueDeps = [];
    for (const dep of initialDeps) {
        const key = buildDirName(dep.machineName, dep.majorVersion, dep.minorVersion);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueDeps.push(dep);
        }
    }

    debugLog('h5p-prefetch', `Démarrage préchargement pour ${moduleKey} (${uniqueDeps.length} dépendances uniques, ${initialDeps.length - uniqueDeps.length} doublons éliminés)`);
    perf.markStart('prefetch', `prefetchH5PLibraries(${moduleKey})`, { uniqueDeps: uniqueDeps.length, duplicatesRemoved: initialDeps.length - uniqueDeps.length });

    await resolveAndPrefetch(uniqueDeps);

    // Bilan
    const stats = { ok: 0, partial: 0, failed: 0 };
    for (const [, info] of libStatus) {
        stats[info.status]++;
    }
    perf.markEnd('prefetch', `prefetchH5PLibraries(${moduleKey})`, {
        ok: stats.ok, partial: stats.partial, failed: stats.failed,
        totalLibs: libStatus.size, cachedFiles: assetCache.size
    });
    debugLog('h5p-prefetch', `Préchargement terminé pour ${moduleKey} — ${stats.ok} ok, ${stats.partial} partielles, ${stats.failed} en échec (${libStatus.size} total, ${assetCache.size} fichiers en cache)`);
}

/**
 * Retourne l'état de préchargement de toutes les bibliothèques.
 * Utile pour le debug (?debug) ou pour vérifier avant un rendu.
 * @returns {Object} { libraries: {dirName: statusInfo}, summary: {ok, partial, failed, total}, cacheSize: number }
 */
export function getPrefetchStatus() {
    const libraries = {};
    const summary = { ok: 0, partial: 0, failed: 0, total: libStatus.size };

    for (const [dir, info] of libStatus) {
        libraries[dir] = { ...info };
        summary[info.status]++;
    }

    return { libraries, summary, cacheSize: assetCache.size };
}

/**
 * Re-tente le préchargement des bibliothèques en échec ou partiellement chargées.
 * Appelable manuellement ou automatiquement avant un rendu H5P.
 * @returns {Promise<number>} Nombre de bibliothèques corrigées
 */
export async function retryFailed() {
    const toRetry = [];

    for (const [dirName, info] of libStatus) {
        if (info.status !== 'ok') {
            const depInfo = depInfoByDir.get(dirName);
            if (depInfo) {
                // Réinitialiser pour permettre un nouveau passage
                libStatus.delete(dirName);
                toRetry.push(depInfo);
            }
        }
    }

    if (toRetry.length === 0) return 0;

    debugLog('h5p-prefetch', `Re-tentative pour ${toRetry.length} bibliothèques en échec`);
    await resolveAndPrefetch(toRetry);

    // Compter combien sont passées en 'ok'
    let fixed = 0;
    for (const dep of toRetry) {
        const dir = buildDirName(dep.machineName, dep.majorVersion, dep.minorVersion);
        const info = libStatus.get(dir);
        if (info && info.status === 'ok') fixed++;
    }

    debugLog('h5p-prefetch', `Re-tentative terminée — ${fixed}/${toRetry.length} corrigées`);
    return fixed;
}

/**
 * Résout récursivement les dépendances et pré-charge les assets en mémoire.
 * Pour chaque dépendance :
 *   1. Fetch library.json — stocke en cache mémoire + parse
 *   2. Fetch tous les JS/CSS — stocke chacun en cache mémoire (Blob)
 *   3. Enregistre l'état (ok / partial / failed) dans libStatus
 *   4. Collecte les sous-dépendances pour résolution récursive
 *
 * @param {Array<{machineName: string, majorVersion: number, minorVersion: number}>} dependencies
 */
async function resolveAndPrefetch(dependencies) {
    const subDeps = [];

    const promises = dependencies.map(async (dep) => {
        const dirName = buildDirName(dep.machineName, dep.majorVersion, dep.minorVersion);

        // Déjà chargée avec succès → on saute
        const existing = libStatus.get(dirName);
        if (existing && existing.status === 'ok') return;

        // Sauvegarder les infos de dépendance pour retryFailed()
        depInfoByDir.set(dirName, dep);

        const basePath = `${librariesBasePath}/${dirName}`;
        const libJsonUrl = `${basePath}/library.json`;

        const libT0 = performance.now();
        try {
            // 1. Récupérer et stocker library.json
            const resp = await fetch(libJsonUrl);
            if (!resp.ok) {
                libStatus.set(dirName, { status: 'failed', total: 0, loaded: 0, failed: [`library.json (${resp.status})`] });
                debugLog('h5p-prefetch', `✗ ${dirName} — library.json introuvable (${resp.status})`);
                return;
            }

            // Lire le contenu comme texte pour le parser ET le stocker
            const libJsonText = await resp.text();

            let libJson;
            try {
                libJson = JSON.parse(libJsonText);
            } catch {
                libStatus.set(dirName, { status: 'failed', total: 0, loaded: 0, failed: ['library.json (JSON invalide)'] });
                debugLog('h5p-prefetch', `✗ ${dirName} — library.json JSON invalide`);
                return;
            }

            // Vérification minimale de la structure
            if (!libJson.machineName) {
                libStatus.set(dirName, { status: 'failed', total: 0, loaded: 0, failed: ['library.json (structure invalide)'] });
                debugLog('h5p-prefetch', `✗ ${dirName} — library.json sans machineName`);
                return;
            }

            // Stocker library.json en cache mémoire
            assetCache.set(libJsonUrl, {
                blob: new Blob([libJsonText], { type: 'application/json' }),
                contentType: 'application/json'
            });

            // 2. Collecter et fetch les assets preloaded (JS + CSS)
            const assetUrls = [
                ...(libJson.preloadedJs || []).map(f => `${basePath}/${f.path}`),
                ...(libJson.preloadedCss || []).map(f => `${basePath}/${f.path}`)
            ];

            const failedAssets = [];
            let loadedCount = 0;

            // Lancer tous les fetch en parallèle et stocker en mémoire
            const assetResults = await Promise.allSettled(
                assetUrls.map(async (url) => {
                    // Déjà en cache → succès immédiat
                    if (assetCache.has(url)) return url;

                    const assetResp = await fetch(url);
                    if (!assetResp.ok) {
                        throw new Error(`${assetResp.status}`);
                    }

                    // Lire le contenu et stocker en tant que Blob
                    const blob = await assetResp.blob();
                    if (blob.size === 0) {
                        throw new Error('contenu vide');
                    }

                    const contentType = getContentType(url);
                    assetCache.set(url, { blob, contentType });
                    return url;
                })
            );

            for (let i = 0; i < assetResults.length; i++) {
                if (assetResults[i].status === 'fulfilled') {
                    loadedCount++;
                } else {
                    failedAssets.push(assetUrls[i].split('/').pop());
                }
            }

            // 3. Déterminer le statut final
            const total = assetUrls.length;
            let status;
            if (failedAssets.length === 0) {
                status = 'ok';
            } else if (loadedCount > 0) {
                status = 'partial';
            } else if (total === 0) {
                // Bibliothèque sans assets propres (ex: certaines dépendances abstraites)
                status = 'ok';
            } else {
                status = 'failed';
            }

            libStatus.set(dirName, { status, total, loaded: loadedCount, failed: failedAssets });

            if (status === 'ok') {
                debugLog('h5p-prefetch', `✓ ${dirName} — ${total} assets en cache mémoire`);
            } else {
                debugLog('h5p-prefetch', `⚠ ${dirName} — ${loadedCount}/${total} assets (${failedAssets.length} en échec : ${failedAssets.join(', ')})`);
            }

            // 4. Collecter les sous-dépendances pour résolution récursive
            if (libJson.preloadedDependencies) {
                for (const subDep of libJson.preloadedDependencies) {
                    const subDir = buildDirName(subDep.machineName, subDep.majorVersion, subDep.minorVersion);
                    const subExisting = libStatus.get(subDir);
                    if (!subExisting || subExisting.status !== 'ok') {
                        subDeps.push(subDep);
                    }
                }
            }
        } catch {
            // Erreur réseau globale pour cette bibliothèque
            libStatus.set(dirName, { status: 'failed', total: 0, loaded: 0, failed: ['erreur réseau'] });
            debugLog('h5p-prefetch', `✗ ${dirName} — erreur réseau`);
        }
    });

    await Promise.allSettled(promises);

    // Résolution récursive des sous-dépendances découvertes
    if (subDeps.length > 0) {
        await resolveAndPrefetch(subDeps);
    }
}
