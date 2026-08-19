/**
 * @file Coeur d'empaquetage d'activité, sans effet de bord.
 *
 * `packageActivity()` prend un JSON de contenu (déjà produit par l'IA ou fourni
 * par un appelant externe) et **retourne les octets** du fichier d'activité
 * (.h5p / .mbz) au lieu de déclencher un téléchargement, d'afficher une
 * notification ou de lire le DOM.
 *
 * C'est la « Couche 0 » du plan d'intégration Éléa / API :
 *   docs/specific-plans/PLAN_INTEGRATION_ELEA_BLOCK.md
 *
 * Cette fonction est ADDITIVE : elle réutilise les mêmes fonctions pures que le
 * pipeline de production (json-healer → processors → creator) sans modifier le
 * chemin de génération+téléchargement existant ({@link handleH5PCreation}). Le
 * comportement de l'application reste donc strictement inchangé.
 *
 * Plateformes :
 *   - 'h5p'    : IMPLÉMENTÉ (21 types via les processeurs H5P).
 *   - 'moodle' : NON ENCORE IMPLÉMENTÉ — le shaping réel des données Moodle vit
 *                dans les handlers dédiés de moodle-creator.js (IDs aléatoires,
 *                generateHtmlFromBlocks pour Page/Livre, etc.). Sera traité dans
 *                un incrément séparé pour garantir une sortie .mbz identique à
 *                celle de l'application. Lève une erreur explicite en attendant.
 *
 * @module core/package-activity
 */

import { h5pModules } from './definitions.js';
import { translations, currentLang } from './translation.js';
import { horodatageFichier } from './utils.js';
import {
    healJsonString,
    healJsonObject,
    healActivitySpecificFields,
    healStructureForActivity
} from '../h5p/json-healer.js';
import { processH5PContent, getModuleMetadata } from '../h5p/processors/index.js';
import { createH5PBlob, stripMarkdownAndHtml } from '../h5p/h5p-creator.js';
import { debugLog } from './utils.js';

/**
 * @typedef {Object} PackagedActivity
 * @property {Uint8Array} bytes      - Octets bruts du fichier d'activité.
 * @property {Blob}       blob       - Le même contenu enveloppé en Blob (MIME application/octet-stream).
 * @property {string}     filename   - Nom de fichier suggéré (ex: "h5p-timeline-caramel-20260605-fr.h5p").
 * @property {string}     mime       - Type MIME ("application/octet-stream").
 * @property {string}     platform   - 'h5p' | 'moodle'.
 * @property {string}     moduleKey  - La clé de module utilisée.
 * @property {string}     [mainLibrary] - Nom technique de la lib principale (H5P uniquement).
 * @property {Object}     content    - Le contenu JSON final empaqueté (après healing + processeur).
 */

/**
 * Détecte la plateforme à partir de la clé de module.
 * @param {string} moduleKey
 * @returns {'h5p'|'moodle'|null}
 */
function detectPlatform(moduleKey) {
    if (h5pModules[moduleKey] || getModuleMetadata(moduleKey)) return 'h5p';
    // Tout le reste (Page, Livre, QCM, Millionnaire, Appariement, Devoir, ...)
    // est traité côté Moodle. On ne maintient pas ici la liste exhaustive :
    // l'absence de métadonnées H5P suffit à router vers Moodle.
    return 'moodle';
}

/**
 * Construit un nom de fichier daté cohérent avec celui de l'application.
 * Reproduit la convention de {@link packageAndDownloadH5P} (h5p-creator.js).
 * @param {string} filenameBase - base lisible (ex: nom anglais du module).
 * @param {string} ext - extension sans point (ex: 'h5p').
 * @param {string} lang
 * @returns {string}
 */
function buildFileName(filenameBase, ext, lang) {
    const dateString = horodatageFichier();
    const cleanType = String(filenameBase || 'activity')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const safeLang = lang === 'zh' ? 'zh-cn' : (lang || 'fr');
    return `h5p-${cleanType}-caramel-${dateString}-${safeLang}.${ext}`;
}

/**
 * Empaquette une activité H5P : healing → processeur → métadonnées → blob.
 * Reproduit fidèlement la logique de {@link handleH5PCreation} (h5p-creator.js)
 * SAUF les effets de bord (lecture DOM du titre, notifications, dispatchEvent,
 * téléchargement, registre d'images). Le mélange aléatoire des éléments
 * DragAndDrop/QuizSet est désactivé par défaut (l'appelant fournit un contenu
 * qu'on respecte tel quel ; cf. option `shuffleElements`).
 *
 * @param {string} moduleKey
 * @param {Object|string} content - Objet JSON OU chaîne JSON brute.
 * @param {Object} [options]
 * @param {string} [options.title] - Titre explicite (sinon content.title puis traduction).
 * @param {string} [options.lang] - Langue (défaut: currentLang).
 * @returns {Promise<PackagedActivity>}
 */
async function packageH5P(moduleKey, content, options = {}) {
    const lang = options.lang || currentLang || 'fr';

    // 1. Parsing défensif (objet ou chaîne), avec réparation de chaîne en secours.
    let jsonObj;
    if (typeof content === 'string') {
        try {
            jsonObj = JSON.parse(content);
        } catch (e) {
            jsonObj = JSON.parse(healJsonString(content));
        }
    } else if (content && typeof content === 'object') {
        // Clone pour ne pas muter l'objet de l'appelant.
        jsonObj = structuredClone(content);
    } else {
        throw new Error(`packageActivity: contenu invalide pour ${moduleKey} (ni objet ni chaîne).`);
    }

    // 2. Healing (obligatoire — même séquence que handleH5PCreation).
    jsonObj = healJsonObject(jsonObj, moduleKey);
    jsonObj = healActivitySpecificFields(jsonObj, moduleKey);
    jsonObj = healStructureForActivity(jsonObj, moduleKey);

    // 3. Processeur spécifique au module (lazy-load).
    const processingResult = await processH5PContent(moduleKey, jsonObj);
    let finalContent = jsonObj;
    let dynamicDependencies = [];
    if (processingResult) {
        if (processingResult.content && processingResult.dependencies) {
            finalContent = processingResult.content;
            dynamicDependencies = processingResult.dependencies;
        } else {
            finalContent = processingResult;
        }
    } else {
        debugLog('package-activity', `Aucun processeur pour ${moduleKey}, JSON brut utilisé.`);
    }

    // 4. Métadonnées + dépendances (ordre identique à handleH5PCreation).
    const metadata = getModuleMetadata(moduleKey);
    if (!metadata) {
        throw new Error(`packageActivity: métadonnées introuvables pour le module H5P ${moduleKey}.`);
    }
    const dependencies = [
        ...metadata.extraDependencies,
        {
            machineName: metadata.machineName,
            majorVersion: metadata.version.major,
            minorVersion: metadata.version.minor
        },
        ...dynamicDependencies
    ];

    // 5. Titre : explicite > contenu > traduction du nom de module.
    const module = h5pModules[moduleKey];
    const title = options.title
        || finalContent.title
        || (module && translations[module.name])
        || moduleKey;

    // 6. Blob H5P (createH5PBlob gère le filtrage MathDisplay et le h5p.json).
    const zipBlob = await createH5PBlob(finalContent, metadata.machineName, dependencies, {
        title,
        lang
    });
    const blob = new Blob([zipBlob], { type: 'application/octet-stream' });
    const bytes = new Uint8Array(await zipBlob.arrayBuffer());

    const filename = buildFileName(
        (module && module.englishName) || moduleKey,
        'h5p',
        lang
    );

    return {
        bytes,
        blob,
        filename,
        mime: 'application/octet-stream',
        platform: 'h5p',
        moduleKey,
        mainLibrary: metadata.machineName,
        content: finalContent
    };
}

/**
 * Point d'entrée unique : empaquette une activité et retourne ses octets,
 * sans effet de bord (pas de téléchargement, pas de notification, pas de DOM).
 *
 * @param {Object} params
 * @param {string} params.moduleKey - Clé de module (ex: 'Timeline', 'QuizSet').
 * @param {Object|string} params.content - Contenu JSON (objet ou chaîne brute).
 * @param {'h5p'|'moodle'} [params.platform] - Forçage de plateforme (sinon auto-détectée).
 * @param {string} [params.title] - Titre explicite.
 * @param {string} [params.lang] - Langue (défaut: currentLang).
 * @returns {Promise<PackagedActivity>}
 * @throws {Error} si le module est inconnu, le contenu invalide, ou la plateforme non supportée.
 */
export async function packageActivity({ moduleKey, content, platform, title, lang } = {}) {
    if (!moduleKey || typeof moduleKey !== 'string') {
        throw new Error('packageActivity: `moduleKey` requis (chaîne).');
    }
    if (content === undefined || content === null) {
        throw new Error('packageActivity: `content` requis (objet JSON ou chaîne).');
    }

    const resolvedPlatform = platform || detectPlatform(moduleKey);

    if (resolvedPlatform === 'h5p') {
        return packageH5P(moduleKey, content, { title, lang });
    }

    if (resolvedPlatform === 'moodle') {
        // Voir l'en-tête du fichier : le shaping Moodle réel vit dans les
        // handlers de moodle-creator.js et sera extrait dans un incrément dédié.
        throw new Error(
            `packageActivity: plateforme 'moodle' (module ${moduleKey}) pas encore supportée. ` +
            `Le coeur d'empaquetage Moodle sera ajouté dans un incrément séparé ` +
            `(cf. docs/specific-plans/PLAN_INTEGRATION_ELEA_BLOCK.md, Couche 0).`
        );
    }

    throw new Error(`packageActivity: plateforme inconnue '${resolvedPlatform}'.`);
}

// Réexport utilitaire (pratique pour les tests / appelants).
export { detectPlatform, stripMarkdownAndHtml };
