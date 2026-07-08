/**
 * Processeur H5P — Image Hotspots (H5P.ImageHotspots 1.11)
 *
 * Transforme le JSON intermédiaire (généré par l'IA OU ré-édité dans l'éditeur visuel)
 * en `content.json` H5P.ImageHotspots 1.11.
 *
 * Deux formes d'entrée tolérées (le processeur est idempotent vis-à-vis de l'éditeur) :
 *  1. Format PLAT issu du LLM : { hotspots: [{ x, y, header, text }] }  (texte uniquement)
 *  2. Format ENRICHI issu de l'éditeur : { hotspots: [{ position:{x,y}, header,
 *     content: [{ library, params, ... }] }] }  (Texte / Image / Audio / Vidéo)
 *
 * L'image de FOND (`data.image`) est injectée par l'UI (registre image-manager) — JAMAIS
 * demandée au LLM, exactement comme `videoSource` pour la Vidéo interactive.
 *
 * Toutes les dépendances sont statiques (déclarées dans processors/index.js → processorMetadata),
 * donc le processeur retourne directement le `content` (pas de { content, dependencies }).
 *
 * @module processors/ImageHotspots
 */

import { generateUUID, formatTextToHtml, debugLog } from '../../core/utils.js';
import { translations } from '../../core/translation.js';
import { sanitizeSync } from '../../export/sanitizer.js';

const DEFAULTS = {
    globalColor: '#981d99',
    globalIconType: 'numbers',   // numérotation 1,2,3… (cf. PRD D2 + export numéroté)
    globalIcon: 'plus'
};

/**
 * Complétion de version des libraries de sous-contenu (audit N10) : un JSON collé avec
 * `library: "H5P.Text"` (sans version) produirait un content.json que le player ne résout
 * pas. Versions alignées sur les extraDependencies déclarées dans processors/index.js.
 */
const LIBRARY_VERSIONS = {
    'H5P.Text': 'H5P.Text 1.1',
    'H5P.Image': 'H5P.Image 1.1',
    'H5P.Audio': 'H5P.Audio 1.5',
    'H5P.Video': 'H5P.Video 1.6',
    // Alias tolérés (valeurs `_contentType` de l'éditeur)
    'text': 'H5P.Text 1.1',
    'image': 'H5P.Image 1.1',
    'audio': 'H5P.Audio 1.5',
    'video': 'H5P.Video 1.6'
};

/** Borne une valeur en pourcentage [0,100] ; défaut 50 si non finie. */
function clampPct(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return 50;
    return Math.max(0, Math.min(100, n));
}

/** contentType lisible (« Text », « Image »…) déduit de la library (« H5P.Text 1.1 »). */
function contentTypeFromLibrary(library) {
    const m = /^H5P\.(\w+)/.exec(library || '');
    return m ? m[1] : 'Text';
}

/** Construit un sous-contenu H5P.Text à partir d'un HTML/markdown. */
function makeTextContent(html) {
    return {
        params: { text: html },
        library: 'H5P.Text 1.1',
        metadata: { contentType: 'Text', license: 'U', title: 'Sans titre Text' },
        subContentId: generateUUID()
    };
}

/**
 * Normalise un sous-contenu déjà structuré (éditeur) : garantit metadata + subContentId
 * et laisse les `params` tels quels (Image/Audio/Vidéo/Texte).
 */
function normalizeStructuredContent(node) {
    if (!node || typeof node !== 'object') return null;
    let library = node.library || node._contentType;
    if (!library) return null;
    // Compléter la version si absente (« H5P.Text » → « H5P.Text 1.1 », audit N10).
    if (!/\s\d+\.\d+$/.test(library)) library = LIBRARY_VERSIONS[library] || library;
    const params = node.params || {};
    // Sanitiser le HTML du chemin enrichi (le chemin plat passe déjà par formatTextToHtml
    // → sanitizeSync ; sans ça, un JSON collé peut embarquer du HTML actif, audit N10).
    if (/^H5P\.Text\b/.test(library) && typeof params.text === 'string') {
        params.text = sanitizeSync(params.text);
    }
    return {
        params,
        library,
        metadata: node.metadata || {
            contentType: contentTypeFromLibrary(library),
            license: 'U',
            title: `Sans titre ${contentTypeFromLibrary(library)}`
        },
        subContentId: node.subContentId || generateUUID()
    };
}

/**
 * Construit la liste `content[]` d'un hotspot à partir des deux formes possibles.
 * @returns {Array<Object>}
 */
function buildHotspotContent(h) {
    // Forme ENRICHIE : un tableau `content` déjà présent (éditeur / JSON collé)
    if (Array.isArray(h.content) && h.content.length) {
        const normalized = h.content.map(normalizeStructuredContent).filter(Boolean);
        if (normalized.length) return normalized;
        // Tous les blocs étaient invalides : on retombe sur la forme plate ci-dessous.
    }
    // Forme PLATE : un champ `text` (généré par le LLM). Repli sur le titre si le texte
    // est vide : un hotspot à `content: []` serait silencieusement SAUTÉ par le player
    // (point visible dans l'éditeur, absent de l'activité — audit N4).
    const html = formatTextToHtml(h.text || '') || formatTextToHtml(h.header || '');
    return html ? [makeTextContent(html)] : [];
}

export default {
    /**
     * @param {Object} data - JSON intermédiaire (plat ou enrichi).
     * @returns {Object} content.json H5P.ImageHotspots 1.11.
     */
    process(data) {
        const src = data || {};
        const hotspots = Array.isArray(src.hotspots) ? src.hotspots : [];

        const content = {
            // Image de fond : objet H5P {path,mime,width,height,copyright} injecté par l'UI.
            image: src.image || undefined,
            backgroundImageAltText: src.backgroundImageAltText || '',
            globalIconType: src.globalIconType || DEFAULTS.globalIconType,
            globalIcon: src.globalIcon || DEFAULTS.globalIcon,
            // Icône-image personnalisée (paquet importé) : à préserver, sinon perdue au
            // repackaging (audit N5). `undefined` = clé absente du JSON final.
            globalIconImage: src.globalIconImage || undefined,
            globalColor: src.globalColor || DEFAULTS.globalColor,
            hotspots: hotspots.map((h) => {
                const pos = h.position || {};
                const node = {
                    position: {
                        x: clampPct(h.x !== undefined ? h.x : pos.x),
                        y: clampPct(h.y !== undefined ? h.y : pos.y),
                        legacyPositioning: pos.legacyPositioning === true
                    },
                    alwaysFullscreen: !!h.alwaysFullscreen,
                    hotspotIconType: h.hotspotIconType || 'default',
                    hotspotIcon: h.hotspotIcon || (src.globalIcon || DEFAULTS.globalIcon),
                    hotspotColor: h.hotspotColor || src.globalColor || DEFAULTS.globalColor,
                    content: buildHotspotContent(h)
                };
                if (h.header) node.header = h.header;
                if (h.hotspotIconImage) node.hotspotIconImage = h.hotspotIconImage; // audit N5
                return node;
            }),
            // Libellés d'accessibilité : localisés dans la langue de l'interface (audit N8).
            // Le `||` préserve un libellé déjà présent (JSON réédité) sans le re-traduire.
            untitledHotspotLabel: src.untitledHotspotLabel || translations.h5p_untitled_hotspot || 'Point sans titre',
            closeButtonLabel: src.closeButtonLabel || translations.h5p_close || 'Fermer',
            containsAudioVideoLabel: src.containsAudioVideoLabel || translations.h5p_contains_audio_video || 'Contient de l\'audio ou de la vidéo'
        };

        debugLog('ImageHotspots', `content.json généré : ${content.hotspots.length} hotspot(s), icon=${content.globalIconType}`);
        return content;
    }
};
