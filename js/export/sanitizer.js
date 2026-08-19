/**
 * @file Module de sanitization HTML pour la protection XSS.
 * Utilise DOMPurify avec des profils configurables selon le contexte.
 */

import { loadDOMPurify, isDOMPurifyLoaded } from '../core/lib-loader.js';
import { escapeHtml } from '../core/escape.js';

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
            'lang', 'dir', 'role', 'tabindex',
            'aria-label', 'aria-hidden', 'aria-level', 'aria-describedby', 'aria-current',
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
        // Déclencher immédiatement le chargement de DOMPurify (non bloquant)
        // pour réduire la fenêtre pendant laquelle le fallback est utilisé
        preloadSanitizer();
        // Fallback FAIL-CLOSED : sans DOMPurify, on échappe TOUT le HTML.
        // Un filtrage regex serait contournable (ex: <img src=x onerror=alert(1)>
        // avec handler non quoté) — on préfère perdre la mise en forme que laisser
        // passer un vecteur XSS.
        console.warn('[Sanitizer] DOMPurify non chargé, échappement complet du HTML (fail-closed)');
        return escapeAllHtml(dirty);
    }

    const profile = PROFILES[profileName] || PROFILES.EDUCATIONAL;
    return purifier.sanitize(dirty, profile);
}

/**
 * Échappe tous les caractères HTML significatifs (fallback fail-closed
 * quand DOMPurify n'est pas encore chargé)
 * @param {string} str
 * @returns {string}
 */
function escapeAllHtml(str) {
    // `String(str)` conservé : c'est le repli fail-closed de `sanitizeSync`, dont
    // les appelants peuvent passer n'importe quoi. Voir escapeHtmlTags pour la
    // même précaution sur les entrées nulles.
    return escapeHtml(String(str));
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
