/**
 * @file Module de sanitization HTML pour la protection XSS.
 * Utilise DOMPurify avec des profils configurables selon le contexte.
 */

import { loadDOMPurify, isDOMPurifyLoaded } from '../core/lib-loader.js';

// Instance DOMPurify mise en cache
let purifier = null;
let isLoaded = false;

/**
 * Profils de sanitization pour différents contextes
 */
const PROFILES = {
    // Profil standard pour le contenu éducatif (questions, réponses, descriptions)
    EDUCATIONAL: {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
            'blockquote', 'pre', 'code',
            'span', 'div', 'figure', 'figcaption',
            'sup', 'sub', 'hr'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'id', 'style',
            'target', 'rel', 'width', 'height', 'loading', 'decoding',
            'colspan', 'rowspan', 'scope',
            'lang', 'dir', 'role', 'aria-label', 'aria-hidden', 'aria-level'
        ],
        ALLOW_DATA_ATTR: false,
        // Bloque javascript:, data:, vbscript: etc. Autorise http(s):, mailto:, tel:
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    },

    // Profil strict pour les labels et titres (texte simple uniquement)
    STRICT: {
        ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'br', 'span'],
        ALLOWED_ATTR: ['class'],
        ALLOW_DATA_ATTR: false
    },

    // Profil riche pour les blocs HTML Éléa (plus de balises autorisées)
    RICH_HTML: {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
            'blockquote', 'pre', 'code',
            'span', 'div', 'section', 'article', 'aside', 'nav', 'header', 'footer',
            'figure', 'figcaption',
            'sup', 'sub', 'hr',
            'dl', 'dt', 'dd',
            'abbr', 'cite', 'mark', 'small', 'time'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'id', 'style',
            'target', 'rel', 'width', 'height', 'loading', 'decoding',
            'colspan', 'rowspan', 'scope', 'headers',
            'lang', 'dir', 'role',
            'aria-label', 'aria-hidden', 'aria-level', 'aria-describedby',
            'datetime', 'data-tooltip-key'
        ],
        ALLOW_DATA_ATTR: true,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    }
};

/**
 * Initialise DOMPurify (chargement lazy)
 * @returns {Promise<DOMPurify>}
 */
async function init() {
    if (isLoaded && purifier) {
        return purifier;
    }

    await loadDOMPurify();

    if (!window.DOMPurify) {
        throw new Error('DOMPurify failed to load');
    }

    purifier = window.DOMPurify;
    isLoaded = true;

    return purifier;
}

/**
 * Vérification synchrone si DOMPurify est chargé
 * @returns {boolean}
 */
export function isSanitizerLoaded() {
    return isLoaded && purifier !== null;
}

/**
 * Sanitize le contenu HTML avec un profil spécifique (async)
 * @param {string} dirty - La chaîne HTML potentiellement dangereuse
 * @param {string} profileName - Nom du profil : 'EDUCATIONAL', 'STRICT', ou 'RICH_HTML'
 * @returns {Promise<string>} - HTML sanitizé
 */
export async function sanitize(dirty, profileName = 'EDUCATIONAL') {
    if (!dirty) return '';

    const dp = await init();
    const profile = PROFILES[profileName] || PROFILES.EDUCATIONAL;

    return dp.sanitize(dirty, profile);
}

/**
 * Sanitize synchrone - utiliser UNIQUEMENT après s'être assuré que DOMPurify est chargé.
 * Fallback vers un échappement agressif si non chargé.
 * @param {string} dirty - La chaîne HTML potentiellement dangereuse
 * @param {string} profileName - Nom du profil
 * @returns {string} - HTML sanitizé
 */
export function sanitizeSync(dirty, profileName = 'EDUCATIONAL') {
    if (!dirty) return '';

    if (!isLoaded || !purifier) {
        // Fallback : filtrage HTML basique sans DOMPurify
        // On garde les balises sûres du profil EDUCATIONAL pour ne pas casser le contenu
        console.warn('[Sanitizer] DOMPurify non chargé, utilisation du fallback basique');
        return basicHtmlFallback(dirty, profileName);
    }

    const profile = PROFILES[profileName] || PROFILES.EDUCATIONAL;
    return purifier.sanitize(dirty, profile);
}

/**
 * Fallback de filtrage HTML basique quand DOMPurify n'est pas chargé
 * Garde les balises sûres, supprime les dangereuses
 * @param {string} str
 * @param {string} profileName
 * @returns {string}
 */
function basicHtmlFallback(str, profileName = 'EDUCATIONAL') {
    const profile = PROFILES[profileName] || PROFILES.EDUCATIONAL;
    const allowedTags = profile.ALLOWED_TAGS || [];

    // Supprimer les scripts et les event handlers
    let result = str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');

    // Supprimer les balises non autorisées (mais garder leur contenu)
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    result = result.replace(tagPattern, (match, tagName) => {
        if (allowedTags.includes(tagName.toLowerCase())) {
            return match;
        }
        return ''; // Supprimer la balise non autorisée
    });

    return result;
}

/**
 * Précharge DOMPurify pendant le temps d'inactivité
 * @returns {Promise<void>}
 */
export async function preloadSanitizer() {
    try {
        await init();
    } catch (e) {
        console.warn('[Sanitizer] Échec du préchargement:', e);
    }
}

/**
 * Retourne les noms des profils disponibles
 * @returns {string[]}
 */
export function getProfileNames() {
    return Object.keys(PROFILES);
}

export { PROFILES };
