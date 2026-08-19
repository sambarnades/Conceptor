/**
 * Service VISION — analyse d'une image jointe au corpus (mode avancé) :
 * description globale + transcription fidèle du texte contenu dans l'image.
 *
 * Réutilise le MÊME webhook n8n que la détection de zones d'« Image interactive »
 * (ENDPOINTS.visionDetect, cf. services/hotspot-vision.js) : le workflow accepte un
 * `prompt` d'override complet et son parseur renvoie toujours
 * `{ imageDescription, zones:[{x,y,label,description}] }`. On mappe donc le besoin
 * sur ce contrat SANS AUCUNE modification serveur :
 *   - `imageDescription` = description globale (rédigée dans la langue de l'interface) ;
 *   - `zones[].description` = segments (≤ 400 caractères) du texte transcrit, dans
 *     l'ordre de lecture (le parseur serveur tronque chaque description à 500) ;
 *   - image SANS texte → une zone unique dont la description vaut `NO_TEXT` : le
 *     parseur serveur traite `zones` vide comme une erreur (et re-tente l'appel),
 *     ce marqueur l'évite tout en restant filtrable côté client.
 *
 * REPLI : l'appelant (services/ocr.js) capte toute erreur et retombe sur l'OCR
 * Tesseract historique — l'extraction d'une image ne doit jamais échouer à cause de l'IA.
 *
 * @module services/image-analysis
 */

import { ENDPOINTS } from '../core/endpoints.js';
import { debugLog, classifyError } from '../core/utils.js';
import { translations } from '../core/translation.js';
import { DEFAULT_VISION_MODEL } from './hotspot-vision.js';

const ANALYSIS_TIMEOUT_MS = 120000; // aligné sur le timeout du node HTTP du workflow n8n

/** Marqueur langue-neutre renvoyé par le modèle quand l'image ne contient aucun texte. */
const NO_TEXT_MARKER = 'NO_TEXT';

// Schéma JSON littéral (langue-neutre) ajouté au prompt localisé — même contrat que
// hotspot-vision.js. Gardé HORS des locales pour qu'une traduction ne puisse jamais
// casser le format attendu par le parseur du workflow n8n.
const VISION_JSON_SCHEMA = '{"imageDescription":"...","zones":[{"x":number,"y":number,"label":string,"description":string}]}';

// Repli FR si la clé locale manque. CONTRAIREMENT à hotspot-vision.js (où l'absence de
// prompt fait retomber sur le prompt serveur), on envoie TOUJOURS notre prompt : le
// prompt par défaut du workflow demande des zones cliquables, pas une transcription.
const FALLBACK_PROMPT_FR = `Tu es un expert en analyse d'images et de documents pédagogiques. Rédige le champ "imageDescription" EXCLUSIVEMENT en français.

Analyse l'image fournie (photo, schéma, diagramme, carte, tableau, graphique, page de document…).

1) Champ "imageDescription" : décris ce que montre l'image en 2 à 4 phrases (nature du document, sujet, éléments importants, données ou relations visibles).
2) Champ "zones" : si l'image contient du texte lisible (titres, paragraphes, légendes, étiquettes, valeurs, formules), transcris-le INTÉGRALEMENT et FIDÈLEMENT, dans sa langue d'origine et dans l'ordre de lecture. Découpe la transcription en segments de 400 caractères maximum : un élément du tableau "zones" par segment, le texte transcrit dans le champ "description" (mets x=500, y=500 et label="texte" pour chaque élément). Ne traduis pas, ne corrige pas, ne résume pas le texte transcrit. Limite la transcription totale à environ 3500 caractères ; si le texte est plus long, transcris le début et termine le dernier segment par "[…]".
Si l'image ne contient AUCUN texte lisible, renvoie une seule zone dont le champ "description" vaut exactement "NO_TEXT".
N'invente rien qui ne soit pas visible dans l'image.
Réponds STRICTEMENT en JSON valide, sans aucun texte autour, au format :`;

/**
 * Prompt d'analyse DANS LA LANGUE DE L'INTERFACE (clé i18n `ocr_vision_prompt`, sans
 * placeholder), suivi du schéma JSON langue-neutre. Rédiger tout le prompt dans la
 * langue cible fiabilise la langue de la description (le modèle répond dans la langue
 * dans laquelle on lui parle) ; la TRANSCRIPTION, elle, reste dans la langue du texte
 * de l'image (le prompt l'exige explicitement).
 * @returns {string}
 */
function buildAnalysisPrompt() {
    const tpl = translations && translations.ocr_vision_prompt;
    const prompt = (tpl && typeof tpl === 'string') ? tpl : FALLBACK_PROMPT_FR;
    return prompt + '\n' + VISION_JSON_SCHEMA;
}

/**
 * Analyse une image : description globale + transcription du texte visible.
 *
 * @param {string} imageDataUrl - Image encodée (`data:image/...;base64,...`), idéalement
 *   déjà redimensionnée (cf. processBackgroundImage d'image-manager.js, 1920 px max).
 * @param {Object} [opts]
 * @param {string} [opts.lang='fr'] - Langue de l'interface (langue de la description).
 * @param {string} [opts.model] - Modèle vision (défaut : Qwen 3.6, cf. hotspot-vision.js).
 * @param {AbortSignal} [opts.signal] - Pour annuler (bouton « Arrêter » de la zone OCR).
 * @returns {Promise<{description:string, text:string, model?:string}>} `text` = '' si
 *   l'image ne contient aucun texte lisible.
 * @throws {Error} enrichi par classifyError (réseau/HTTP) ou réponse inexploitable.
 */
export async function analyzeImage(imageDataUrl, opts = {}) {
    const { lang = 'fr', model = DEFAULT_VISION_MODEL, signal } = opts;

    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        throw new Error('analyzeImage : dataURL image base64 attendue.');
    }

    // Combine un timeout interne avec le signal externe éventuel (même schéma que
    // detectImageZones dans hotspot-vision.js).
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (signal) {
        if (signal.aborted) ac.abort();
        else signal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(() => ac.abort(), ANALYSIS_TIMEOUT_MS);

    const body = { image: imageDataUrl, lang, model, prompt: buildAnalysisPrompt() };

    debugLog('image-analysis', `analyse vision du corpus (${Math.round(imageDataUrl.length / 1024)} Ko, lang=${lang})`);

    let response;
    try {
        response = await fetch(ENDPOINTS.visionDetect, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ac.signal,
        });
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        const classified = classifyError(err);
        const e = new Error(classified.technicalMessage || err.message);
        e.userMessageKey = classified.userMessageKey;
        e.category = classified.category;
        throw e;
    } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
    }

    if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(`Vision : HTTP ${response.status} ${response.statusText}${txt ? ' — ' + txt.slice(0, 200) : ''}`);
    }

    const data = await response.json().catch(() => null);
    if (!data || !Array.isArray(data.zones)) {
        throw new Error(data && data.error ? `Vision : ${data.error}` : 'Vision : réponse inattendue (zones absentes).');
    }

    const description = String(data.imageDescription || '').trim();
    // Le texte transcrit est réparti dans les descriptions des zones, dans l'ordre de
    // lecture ; le marqueur NO_TEXT (image sans texte) est filtré.
    const segments = data.zones
        .map((z) => (z && z.description != null) ? String(z.description).trim() : '')
        .filter((s) => s && s.toUpperCase() !== NO_TEXT_MARKER);
    const text = segments.join('\n');

    if (!description && !text) {
        throw new Error(data.error ? `Vision : ${data.error}` : 'Vision : réponse vide (ni description ni texte).');
    }

    debugLog('image-analysis', `description ${description.length} car., texte transcrit ${text.length} car. (${segments.length} segment(s))`);
    return { description, text, model: data.model };
}
