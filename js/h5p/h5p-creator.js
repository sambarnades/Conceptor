/**
 * @file Gestion de la création des activités H5P.
 * Ce module prend en charge la transformation du JSON généré par l'IA en une structure H5P valide,
 * l'enrichissement avec les traductions et les paramètres par défaut, et le packaging
 * de l'ensemble dans un fichier .h5p téléchargeable.
 */

import { h5pModules } from '../core/definitions.js';
import { translations, currentLang } from '../core/translation.js';
import { addNotification } from '../ui/notifications.js';
import {
    processH5PContent,
    getModuleMetadata
} from './processors/index.js';
import { detectMathInContent, debugLog, DEBUG, classifyError } from '../core/utils.js';
import * as JSONHealer from './json-healer.js';
import { loadClientZip } from '../core/lib-loader.js';
import * as perf from '../core/perf-tracker.js';
import { getAllImages, hasImages, clearAllImages } from './image-manager.js';

let downloadZip;

/**
 * Point d'entrée pour la création d'un fichier H5P.
 * Adapte le JSON en fonction du type de module, puis appelle la fonction de packaging.
 * @param {string} moduleKey - La clé identifiant le module H5P (ex: 'Timeline').
 * @param {string} jsonInput - La chaîne JSON brute générée par l'IA.
 */
export async function handleH5PCreation(moduleKey, jsonInput) {
    const module = h5pModules[moduleKey];
    if (!module) {
        addNotification({
            type: 'h5p',
            title: 'Activité H5P',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorMessage: `Module '${moduleKey}' non trouvé.`
        });
        return;
    }

    // Gestion spécifique du titre pour QuizSet/QuizSetQCM s'il vient d'un input DOM spécifique
    let titleOverride = null;
    if (moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') {
        const titleInput = document.getElementById('quoi');
        if (titleInput && titleInput.value.trim()) {
            titleOverride = titleInput.value.trim();
        }
    }

    try {
        let jsonObj;
        perf.markStart('healer', 'JSON parse + healing complet');
        try {
            // Tentative de JSON.parse standard (Stratégie Défensive)
            jsonObj = JSON.parse(jsonInput);
        } catch (parseError) {
            console.warn("[H5P Creator] Échec du parse initial, tentative de réparation (String Healer)...", parseError);
            const healedString = JSONHealer.healJsonString(jsonInput);
            jsonObj = JSON.parse(healedString); // Peut encore throw si irréparable
        }

        // Stocker le JSON brut avant healing (mode debug uniquement)
        const _debugRawJson = DEBUG ? structuredClone(jsonObj) : null;

        // Réparation et normalisation (Object Healer)
        // Stratégie Systématique : On l'exécute même si le JSON semble valide,
        // pour normaliser le LaTeX nu (\pi, \geq...) et les versions de bibliothèques H5P.
        debugLog('H5P', 'Analyse et normalisation du JSON via Object Healer.');
        jsonObj = JSONHealer.healJsonObject(jsonObj, moduleKey);

        // Nettoyage spécifique par activité (MarkTheWords multi-mots, DragText LaTeX dans marqueurs)
        // Appliqué AVANT le clone pour que l'éditeur affiche un JSON déjà propre.
        jsonObj = JSONHealer.healActivitySpecificFields(jsonObj, moduleKey);

        // Healing structurel : complète les champs techniques manquants (behaviour, overallFeedback, etc.)
        jsonObj = JSONHealer.healStructureForActivity(jsonObj, moduleKey);
        perf.markEnd('healer', 'JSON parse + healing complet');

        // Stocker le JSON healé (mode debug uniquement)
        const _debugHealedJson = DEBUG ? structuredClone(jsonObj) : null;

        // DragAndDrop : mélanger les étiquettes une seule fois (à la création IA)
        // pour qu'elles n'apparaissent pas dans l'ordre des zones (sinon la réponse est évidente).
        // Ce code ne s'exécute PAS lors de la régénération après édition (regenerateH5PFile),
        // ce qui permet à l'enseignant de contrôler l'ordre via l'éditeur.
        if (moduleKey === 'DragAndDrop' && Array.isArray(jsonObj.elements) && jsonObj.elements.length > 1) {
            const n = jsonObj.elements.length;
            const indices = Array.from({ length: n }, (_, i) => i);
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const oldToNew = new Array(n);
            indices.forEach((oldIdx, newIdx) => { oldToNew[oldIdx] = newIdx; });
            jsonObj.elements = indices.map(oldIdx => jsonObj.elements[oldIdx]);
            if (Array.isArray(jsonObj.dropZones)) {
                jsonObj.dropZones = jsonObj.dropZones.map(zone => ({
                    ...zone,
                    correctElements: (zone.correctElements || []).map(idx => {
                        const i = typeof idx === 'string' ? parseInt(idx, 10) : idx;
                        return oldToNew[i];
                    }).filter(idx => idx !== undefined)
                }));
            }
        }

        // QuizSet : mélanger les étiquettes des sous-questions DragQuestion (même logique que DragAndDrop autonome)
        // pour qu'elles n'apparaissent pas dans l'ordre des zones (sinon la réponse est évidente).
        // Ce code ne s'exécute PAS lors de la régénération après édition (regenerateH5PFile).
        if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF')
            && Array.isArray(jsonObj.questions)) {
            jsonObj.questions.forEach(q => {
                if (q.library && q.library.startsWith('H5P.DragQuestion')
                    && q.params && Array.isArray(q.params.elements) && q.params.elements.length > 1) {
                    const n = q.params.elements.length;
                    const indices = Array.from({ length: n }, (_, i) => i);
                    for (let i = n - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [indices[i], indices[j]] = [indices[j], indices[i]];
                    }
                    const oldToNew = new Array(n);
                    indices.forEach((oldIdx, newIdx) => { oldToNew[oldIdx] = newIdx; });
                    q.params.elements = indices.map(oldIdx => q.params.elements[oldIdx]);
                    if (Array.isArray(q.params.dropZones)) {
                        q.params.dropZones = q.params.dropZones.map(zone => ({
                            ...zone,
                            correctElements: (zone.correctElements || []).map(idx => {
                                const i = typeof idx === 'string' ? parseInt(idx, 10) : idx;
                                return oldToNew[i];
                            }).filter(idx => idx !== undefined)
                        }));
                    }
                }
            });
        }

        // Deep clone du JSON original AVANT transformation (pour édition Markdown-First)
        const originalJson = structuredClone(jsonObj);
        let content = jsonObj;
        let options = { title: titleOverride || jsonObj.title || translations[module.name] };
        let dynamicDependencies = [];

        // 1. Traitement spécifique via le processeur du module (async : chargement paresseux)
        perf.markStart('processor', `processH5PContent(${moduleKey})`);
        const processingResult = await processH5PContent(moduleKey, jsonObj);
        perf.markEnd('processor', `processH5PContent(${moduleKey})`);

        if (processingResult) {
            // Le processeur peut retourner soit le contenu direct, soit un objet { content, dependencies }
            if (processingResult.content && processingResult.dependencies) {
                content = processingResult.content;
                dynamicDependencies = processingResult.dependencies;
            } else {
                content = processingResult;
            }

            // Gestion des cas particuliers post-traitement affectant les options
            if (moduleKey === 'Flashcards') {
                options.description = content.description;
            }
        } else {
            console.warn(`Aucun processeur trouvé pour ${moduleKey}, utilisation du JSON brut.`);
        }

        // 2. Récupération des métadonnées (nom technique et version)
        const metadata = getModuleMetadata(moduleKey);
        if (!metadata) {
            throw new Error(`Métadonnées introuvables pour le module ${moduleKey}`);
        }

        // 3. Construction de la liste des dépendances
        const dependencies = [
            ...metadata.extraDependencies, // Ex: TimelineJS (doit venir AVANT la lib principale)
            {
                machineName: metadata.machineName,
                majorVersion: metadata.version.major,
                minorVersion: metadata.version.minor
            },
            ...dynamicDependencies // Ex: Dépendances des enfants du QuizSet
        ];

        // 4. Récupérer les images du registre (si présentes)
        const imageFiles = hasImages() ? getAllImages() : null;

        // 5. Packaging et téléchargement
        packageAndDownloadH5P(
            module.englishName || moduleKey,
            metadata.machineName,
            content,
            options,
            dependencies,
            module.name, // Clé de traduction pour le titre
            moduleKey, // Clé du module pour l'export de documents
            originalJson, // JSON original Markdown (pour édition)
            { _debugRawJson, _debugHealedJson }, // Debug data (null si DEBUG désactivé)
            imageFiles // Images utilisateur (Map h5pPath → Blob, ou null)
        );

    } catch (error) {
        handleError(moduleKey, error);
    }
}

// =======================================================================
// Logique de packaging (Zip + Téléchargement) unifiée
// =======================================================================

/**
 * Crée le fichier .h5p et déclenche le téléchargement.
 * @param {string} filenameBase - Base du nom de fichier (ex: 'timeline').
 * @param {string} mainLibraryName - Nom technique de la lib principale (ex: 'H5P.Timeline').
 * @param {Object} contentJson - Le contenu JSON final (transformé en HTML).
 * @param {Object} options - Options (titre, description...).
 * @param {Array} dependencies - Liste des dépendances {point machineName, majorVersion, minorVersion}.
 * @param {string} [titleKey] - Clé de traduction pour le titre (optionnel).
 * @param {string} [moduleKey] - Clé du module pour l'export de documents (optionnel).
 * @param {Object} [originalJson] - JSON original en Markdown (pour édition, optionnel).
 * @param {Map<string, Blob>} [imageFiles] - Images utilisateur (h5pPath → Blob, optionnel).
 */
async function packageAndDownloadH5P(filenameBase, mainLibraryName, contentJson, options, dependencies, titleKey, moduleKey, originalJson, debugData = {}, imageFiles = null) {
    // Chargement lazy de client-zip (à la demande, au lieu d'une IIFE au top-level)
    if (!downloadZip) {
        try {
            downloadZip = await loadClientZip();
        } catch (e) {
            console.error("Failed to load client-zip", e);
            addNotification({
                type: 'h5p',
                title: translations[titleKey] || options.title || 'Quiz H5P',
                blob: new Blob([''], { type: 'text/plain' }),
                status: 'error',
                errorMessage: 'Erreur de chargement du module de compression.'
            });
            // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
            document.dispatchEvent(new CustomEvent('generation:error', {
                detail: { moduleKey }
            }));
            return;
        }
    }

    try {
        if (options.description) {
            contentJson.description = options.description;
        }

        // Génération du blob H5P via la fonction partagée
        perf.markStart('packaging', 'createH5PBlob (ZIP)');
        const zipBlob = await createH5PBlob(contentJson, mainLibraryName, dependencies, {
            title: options.title || contentJson.title,
            lang: currentLang,
            imageFiles: imageFiles
        });
        // Recréer le blob avec le MIME type correct pour forcer Safari/iPad à respecter l'extension .h5p
        const h5pBlob = new Blob([zipBlob], { type: 'application/octet-stream' });
        perf.markEnd('packaging', 'createH5PBlob (ZIP)', { blobSize: h5pBlob.size });

        // 4. Générer le nom de fichier
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');

        const cleanType = filenameBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `h5p-${cleanType}-caramel-${dateString}-${lang}.h5p`;

        debugLog('H5P', `Fichier ${fileName} généré avec succès.`);

        // 5. Ajouter à la liste des notifications (silent = pas de toast, la modale de résultat s'en charge)
        const notification = {
            type: 'h5p',
            title: translations[titleKey] || options.title || 'Quiz H5P',
            titleKey: titleKey,
            fileName: fileName,
            blob: h5pBlob,
            jsonData: contentJson,
            originalJsonData: originalJson,
            moduleKey: moduleKey,
            status: 'success',
            silent: true
        };
        if (debugData._debugRawJson) notification._debugRawJson = debugData._debugRawJson;
        if (debugData._debugHealedJson) notification._debugHealedJson = debugData._debugHealedJson;
        const notificationId = addNotification(notification);

        // 6. Libérer la mémoire des images après packaging réussi
        if (imageFiles) {
            clearAllImages();
        }

        // 7. Dispatcher l'événement pour la modale de résultat
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: h5pBlob, fileName, titleKey, moduleKey }
        }));

    } catch (error) {
        debugLog('H5P', "Erreur lors du packaging H5P:", error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'h5p',
            title: translations[titleKey] || options.title || 'Quiz H5P',
            blob: new Blob([''], { type: 'text/plain' }), // Blob vide pour les erreurs
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey }
        }));
    }
}

export function stripMarkdownAndHtml(text) {
    if (!text) return "";
    return text
        .replace(/<[^>]*>/g, '') // Supprime HTML
        .replace(/\*\*(.*?)\*\*/g, '$1') // Supprime bold MD
        .replace(/\*(.*?)\*/g, '$1') // Supprime italic MD
        .replace(/\n/g, ' ') // Supprime retours ligne
        .trim();
}

/**
/**
 * Crée un Blob H5P (.h5p) à partir du contenu et des métadonnées.
 * Utilise client-zip avec le même format que packageAndDownloadH5P.
 * Réutilisable par les tests et la régénération après édition.
 * @param {Object} contentJson - Le contenu JSON final de l'activité.
 * @param {string} mainLibraryName - Nom technique (ex: 'H5P.Timeline').
 * @param {Array} dependencies - Liste des dépendances [{machineName, majorVersion, minorVersion}].
 * @param {Object} [options] - Options : title, lang, imageFiles.
 * @param {Map<string, Blob>} [options.imageFiles] - Images (h5pPath → Blob, optionnel).
 * @returns {Promise<Blob>} Le blob ZIP brut (tel que produit par client-zip).
 */
export async function createH5PBlob(contentJson, mainLibraryName, dependencies, options = {}) {
    const dlZip = downloadZip || await loadClientZip();

    const contentJsonString = JSON.stringify(contentJson, null, 2);
    const hasMathFormulas = detectMathInContent(contentJsonString);

    const files = [];

    // 1. content/content.json
    files.push({
        name: "content/content.json",
        input: new TextEncoder().encode(contentJsonString),
        unixPermissions: 0o100644
    });

    // 2. Images utilisateur (si présentes) — dans content/images/
    const imageFiles = options.imageFiles;
    if (imageFiles && imageFiles.size > 0) {
        for (const [path, blob] of imageFiles) {
            const arrayBuffer = await blob.arrayBuffer();
            files.push({
                name: `content/${path}`,
                input: new Uint8Array(arrayBuffer),
                unixPermissions: 0o100644
            });
        }
        debugLog('H5P', `${imageFiles.size} image(s) ajoutée(s) au ZIP`);
    }

    // 3. h5p.json — dédoublonnage + filtrage MathDisplay + ajout H5P.Image si images
    let uniqueDependencies = Array.from(new Map(dependencies.map(d => [d.machineName, d])).values());
    if (!hasMathFormulas) {
        uniqueDependencies = uniqueDependencies.filter(d => d.machineName !== 'H5P.MathDisplay');
    }

    // Ajouter H5P.Image 1.1 si des images sont présentes et pas déjà dans les dépendances
    if (imageFiles && imageFiles.size > 0) {
        const hasImageDep = uniqueDependencies.some(d => d.machineName === 'H5P.Image');
        if (!hasImageDep) {
            uniqueDependencies.push({
                machineName: 'H5P.Image',
                majorVersion: 1,
                minorVersion: 1
            });
        }
    }

    const title = options.title || contentJson.title || "Activity";
    const lang = options.lang || 'fr';

    const h5pJson = {
        title: stripMarkdownAndHtml(title),
        extraTitle: stripMarkdownAndHtml(title),
        language: "und",
        mainLibrary: mainLibraryName,
        embedTypes: ["iframe"],
        license: "U",
        defaultLanguage: lang === 'zh' ? 'zh-cn' : lang,
        preloadedDependencies: uniqueDependencies
    };

    files.push({
        name: "h5p.json",
        input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)),
        unixPermissions: 0o100644
    });

    // 4. ZIP avec client-zip (retourne le blob brut, sans re-wrapping MIME)
    return await dlZip(files).blob();
}

function handleError(moduleKey, error) {
    debugLog('H5P', `Erreur (${moduleKey}):`, error);

    // Classifier l'erreur pour obtenir un message utilisateur approprié
    const errorInfo = classifyError(error);

    // Récupérer le module pour obtenir son nom traduit
    const module = h5pModules[moduleKey];
    const moduleTitle = module && module.name ? (translations[module.name] || module.englishName) : (translations.h5p_quiz_set_name || 'Quiz H5P');

    // Ajouter notification d'erreur (remplace l'ancienne notification)
    addNotification({
        type: 'h5p',
        title: moduleTitle,
        blob: new Blob([''], { type: 'text/plain' }), // Blob vide pour les erreurs
        status: 'error',
        errorCategory: errorInfo.category,
        userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
        technicalMessage: errorInfo.technicalMessage
    });

    // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
    document.dispatchEvent(new CustomEvent('generation:error', {
        detail: { moduleKey }
    }));
}
