/**
 * @file Gestion de la création des activités H5P.
 * Ce module prend en charge la transformation du JSON généré par l'IA en une structure H5P valide,
 * l'enrichissement avec les traductions et les paramètres par défaut, et le packaging
 * de l'ensemble dans un fichier .h5p téléchargeable.
 */

import { h5pModules } from './definitions.js';
import { translations, currentLang } from './translation.js';
import { addNotification } from './notifications.js';
import {
    processH5PContent,
    getModuleMetadata
} from './h5p-processors/index.js';

let downloadZip;

/**
 * Point d'entrée pour la création d'un fichier H5P.
 * Adapte le JSON en fonction du type de module, puis appelle la fonction de packaging.
 * @param {string} moduleKey - La clé identifiant le module H5P (ex: 'Timeline').
 * @param {string} jsonInput - La chaîne JSON brute générée par l'IA.
 */
export function handleH5PCreation(moduleKey, jsonInput) {
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
    // Note: Pour une pureté totale, le titre devrait être dans le JSON ou passé en argument,
    // mais on garde la compatibilité avec l'existant.
    let titleOverride = null;
    if (moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') {
        const titleInput = document.getElementById('quoi');
        if (titleInput && titleInput.value.trim()) {
            titleOverride = titleInput.value.trim();
        }
    }

    try {
        const jsonObj = JSON.parse(jsonInput);
        let content = jsonObj;
        let options = { title: titleOverride || jsonObj.title || translations[module.name] };
        let dynamicDependencies = [];

        // 1. Traitement spécifique via le processeur du module
        const processingResult = processH5PContent(moduleKey, jsonObj);

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

        // 4. Packaging et téléchargement
        packageAndDownloadH5P(
            module.englishName || moduleKey,
            metadata.machineName,
            content,
            options,
            dependencies,
            module.name, // Clé de traduction pour le titre
            moduleKey // Clé du module pour l'export de documents
        );

    } catch (error) {
        handleError(moduleKey, error);
    }
}

// =======================================================================
// Logique de packaging (Zip + Téléchargement) unifiée
// =======================================================================

(async () => {
    try {
        const mod = await import('../libs/client-zip/index.js');
        downloadZip = mod.downloadZip;
    } catch (e) {
        console.error("Failed to load client-zip", e);
        addNotification({
            type: 'h5p',
            title: 'Activité H5P',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorMessage: 'Erreur de chargement du module de compression.'
        });
    }
})();

/**
 * Crée le fichier .h5p et déclenche le téléchargement.
 * @param {string} filenameBase - Base du nom de fichier (ex: 'timeline').
 * @param {string} mainLibraryName - Nom technique de la lib principale (ex: 'H5P.Timeline').
 * @param {Object} contentJson - Le contenu JSON final.
 * @param {Object} options - Options (titre, description...).
 * @param {Array} dependencies - Liste des dépendances {point machineName, majorVersion, minorVersion}.
 * @param {string} [titleKey] - Clé de traduction pour le titre (optionnel).
 * @param {string} [moduleKey] - Clé du module pour l'export de documents (optionnel).
 */
async function packageAndDownloadH5P(filenameBase, mainLibraryName, contentJson, options, dependencies, titleKey, moduleKey) {
    if (!downloadZip) {
        addNotification({
            type: 'h5p',
            title: translations[titleKey] || options.title || 'Quiz H5P',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorMessage: 'Le module de compression n\'est pas prêt.'
        });
        return;
    }

    try {
        const files = [];

        // 1. content.json
        if (options.description) {
            contentJson.description = options.description;
        }
        files.push({
            name: "content/content.json",
            input: new TextEncoder().encode(JSON.stringify(contentJson, null, 2)),
            unixPermissions: 0o100644
        });

        // 2. h5p.json (Manifeste)
        // Dédoublonnage des dépendances par sécurité
        const uniqueDependencies = Array.from(new Map(dependencies.map(d => [d.machineName, d])).values());

        const h5pJson = {
            title: stripMarkdownAndHtml(options.title || contentJson.title || "Activity"),
            extraTitle: stripMarkdownAndHtml(options.title || contentJson.title || "Activity"),
            language: "und", // Ou currentLang si supporté par H5P core
            mainLibrary: mainLibraryName,
            embedTypes: ["iframe"],
            license: "U",
            defaultLanguage: currentLang === 'zh' ? 'zh-cn' : currentLang,
            preloadedDependencies: uniqueDependencies
        };

        files.push({
            name: "h5p.json",
            input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)),
            unixPermissions: 0o100644
        });

        // 3. Génération du Zip
        const zipBlob = await downloadZip(files).blob();
        const url = URL.createObjectURL(zipBlob);

        // 4. Téléchargement
        const a = document.createElement('a');
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');

        const cleanType = filenameBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `h5p-${cleanType}-caramel-${dateString}-${lang}.h5p`;

        a.download = fileName;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Fichier ${fileName} généré avec succès.`);

        // 5. Ajouter à la liste des notifications avec toast popup (remplace l'ancienne notification)
        // Utilise titleKey pour le nom du module traduit et fileName pour le nom du fichier
        addNotification({
            type: 'h5p',
            title: translations[titleKey] || options.title || 'Quiz H5P',
            titleKey: titleKey, // Clé de traduction pour rafraîchissement lors du changement de langue
            fileName: fileName, // Nom du fichier généré pour l'affichage dans la notification
            blob: zipBlob,
            jsonData: contentJson, // Données JSON pour l'export DOCX/PDF/ODT
            moduleKey: moduleKey, // Clé du module pour l'export de documents
            status: 'success'
        });

    } catch (error) {
        console.error("Erreur lors du packaging H5P:", error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'h5p',
            title: translations[titleKey] || options.title || 'Quiz H5P',
            blob: new Blob([''], { type: 'text/plain' }), // Blob vide pour les erreurs
            status: 'error',
            errorMessage: error.message
        });
    }
}

function stripMarkdownAndHtml(text) {
    if (!text) return "";
    return text
        .replace(/<[^>]*>/g, '') // Supprime HTML
        .replace(/\*\*(.*?)\*\*/g, '$1') // Supprime bold MD
        .replace(/\*(.*?)\*/g, '$1') // Supprime italic MD
        .replace(/\n/g, ' ') // Supprime retours ligne
        .trim();
}

function handleError(moduleKey, error) {
    console.error(`Erreur (${moduleKey}):`, error);

    // Récupérer le module pour obtenir son nom traduit
    const module = h5pModules[moduleKey];
    const moduleTitle = module && module.name ? (translations[module.name] || module.englishName) : (translations.h5p_quiz_set_name || 'Quiz H5P');

    // Ajouter notification d'erreur (remplace l'ancienne notification)
    addNotification({
        type: 'h5p',
        title: moduleTitle,
        blob: new Blob([''], { type: 'text/plain' }), // Blob vide pour les erreurs
        status: 'error',
        errorMessage: error.message
    });
}
