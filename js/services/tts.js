/**
 * @file Service de synthèse vocale (TTS) — activité « Dictée » (H5P.Dictation).
 *
 * Miroir EN SENS INVERSE de la transcription (services/video-transcript.js) : au lieu de
 * audio → texte, on envoie du texte et on reçoit des MP3. Le travail vit côté serveur
 * (service Rust Piper/OpenJTalk sur Scaleway, relais n8n, cf. `ENDPOINTS.tts`) — aucune clé
 * ni modèle en frontend, cf. docs/PRD_DICTATION.md §4 et §11.
 *
 * Contrat serveur (PRD §11.2) :
 *   POST CONFIG.ttsUrl  { sentences: [".."], lang: "fr", voice: "female"|"male", slow?: bool }
 *   200 → { supported, lang, voiceUsed, gender, genderFallback, slow,
 *           audios: [ { mime:"audio/mpeg", data:"<base64>", durationSeconds }, … ] }
 *   `lang` = codes Caramel TELS QUELS (fr en es de it nl pt ar zh jp el) : AUCUN mapping
 *   jp→ja côté client, le serveur s'en charge.
 *
 * Catalogue des voix (PRD §11.2) :
 *   GET CONFIG.ttsVoicesUrl → { langs: { fr: { female:{id,quality}, male:{…}|null }, … } }
 *   → un genre à null est indisponible pour la langue (grisé dans le panneau réglages).
 *
 * CACHE : chaque phrase synthétisée est mémorisée (clé lang|voice|slow|texte → Blob).
 * Le chemin H5P est DÉTERMINISTE (audios/dictation-<hash>.mp3) : une phrase inchangée
 * garde le même chemin d'une régénération à l'autre — le fichier d'origine est alors
 * recopié depuis le .h5p par regenerateH5PFile (aucun nouvel appel réseau), et le panneau
 * réglages de l'éditeur ne re-synthétise que les phrases réellement modifiées (diff).
 *
 * @module services/tts
 */

import { debugLog, classifyError } from '../core/utils.js';
import { CONFIG } from '../caramelia/config.js';
import { currentLang } from '../core/translation.js';

// Limites du contrat serveur (PRD §11.2) : >50 phrases → 400 too_many_sentences,
// >600 caractères/phrase → 400 sentence_too_long. On borne côté client pour un message clair.
export const TTS_MAX_SENTENCES = 50;
export const TTS_MAX_SENTENCE_LENGTH = 600;

// Une dictée (≤ ~15 phrases) répond en 1-10 s à chaud, ~15 s à froid (réveil du container).
// 55 s reste sous le mur ~60 s du routeur Scalingo (même timeout que le workflow n8n).
const TTS_FETCH_TIMEOUT_MS = 55000;
const VOICES_FETCH_TIMEOUT_MS = 20000;

/** Langues couvertes par le service (codes Caramel, cf. PRD §11.2). */
export const TTS_LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

// ── Cache de synthèse (session) ─────────────────────────────────────────────
// Map clé de phrase → { blob, mime, durationSeconds, voiceUsed, genderFallback }.
// Alimenté par synthesizeSentences() ET par primeTtsCache() (ré-hydratation depuis un .h5p
// existant à l'ouverture de l'éditeur). Jamais vidé : quelques dizaines de Ko par phrase.
const ttsCache = new Map();

/**
 * Hash 32 bits (FNV-1a) rendu en hexa sur 8 caractères — suffisant pour discriminer les
 * phrases d'une dictée, et STABLE entre sessions (le chemin H5P en dépend).
 * @param {string} str
 * @returns {string} 8 caractères hexadécimaux.
 */
function fnv1aHex(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Clé de cache d'une phrase pour un réglage (lang, voice, slow) donné.
 * @param {string} text
 * @param {{lang?:string, voice?:string, slow?:boolean}} [opts]
 * @returns {string}
 */
export function ttsCacheKey(text, { lang = 'fr', voice = 'female', slow = false } = {}) {
    return `${lang}|${voice}|${slow ? 'slow' : 'normal'}|${String(text).trim()}`;
}

/**
 * Chemin H5P déterministe du MP3 d'une phrase : dépend UNIQUEMENT de (lang, voice, slow, texte).
 * Une phrase inchangée → même chemin → le fichier d'origine du .h5p est réutilisé tel quel
 * à la régénération (cf. regenerateH5PFile, recopie des assets encore référencés).
 * @param {string} text
 * @param {{lang?:string, voice?:string, slow?:boolean}} [opts]
 * @returns {string} ex. "audios/dictation-1a2b3c4d.mp3"
 */
export function ttsAudioPath(text, opts = {}) {
    return `audios/dictation-${fnv1aHex(ttsCacheKey(text, opts))}.mp3`;
}

/** @returns {{blob:Blob, mime:string}|undefined} Entrée de cache pour une phrase (synthèse OU ré-hydratée depuis un .h5p). */
export function getCachedAudio(text, opts = {}) {
    const key = ttsCacheKey(text, opts);
    return ttsCache.get(key) || ttsCache.get(`path:${fnv1aHex(key)}`);
}

/**
 * Injecte un blob dans le cache SANS appel réseau — utilisé pour ré-hydrater le cache depuis
 * les `audios/dictation-<hash>.mp3` d'un .h5p rouvert (l'éditeur peut alors relire les audios
 * et le processor éviter toute re-synthèse des phrases inchangées).
 * Le hash du chemin étant dérivé de la clé, on indexe AUSSI par chemin.
 * @param {string} h5pPath - ex. "audios/dictation-1a2b3c4d.mp3"
 * @param {Blob} blob
 */
export function primeTtsCacheFromPath(h5pPath, blob) {
    const m = /audios\/dictation-([0-9a-f]{8})\.mp3$/.exec(String(h5pPath));
    if (!m) return;
    ttsCache.set(`path:${m[1]}`, { blob, mime: blob.type || 'audio/mpeg' });
}

/** @returns {{blob:Blob, mime:string}|undefined} Entrée ré-hydratée par chemin (hash). */
function getPrimedByKey(key) {
    return ttsCache.get(`path:${fnv1aHex(key)}`);
}

// Audios MANUELS (« Ma voix » / import) d'un .h5p rouvert : chemin → Blob. Permet au
// panneau de RELIRE une voix personnelle sans re-téléversement (le blob vient du ZIP).
const manualAudios = new Map();

/** Mémorise un audio manuel du .h5p (tout `audios/*` NON produit par la synthèse). */
export function primeManualAudio(h5pPath, blob) {
    if (h5pPath) manualAudios.set(String(h5pPath), blob);
}

/** @returns {Blob|undefined} Audio manuel ré-hydraté depuis le .h5p. */
export function getManualAudio(h5pPath) {
    return manualAudios.get(String(h5pPath));
}

/**
 * fetch avec timeout (AbortController) + propagation d'une annulation externe.
 * (Même utilitaire local que video-transcript.js — volontairement dupliqué : les deux
 * services restent autonomes.)
 */
async function fetchWithTimeout(url, options = {}, timeout = TTS_FETCH_TIMEOUT_MS, signal = null) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const onAbort = () => controller.abort();
    if (signal) {
        if (signal.aborted) controller.abort();
        else signal.addEventListener('abort', onAbort, { once: true });
    }
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
        if (signal) signal.removeEventListener('abort', onAbort);
    }
}

/**
 * Décode un MP3 base64 en Blob.
 * @param {string} b64
 * @param {string} [mime='audio/mpeg']
 * @returns {Blob}
 */
function base64ToBlob(b64, mime = 'audio/mpeg') {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// ── Catalogue des voix ───────────────────────────────────────────────────────

// Cache session du catalogue (il ne change qu'au déploiement serveur).
let voicesCatalog = null;

/**
 * Récupère le catalogue des voix par langue (mémoïsé pour la session).
 * @param {AbortSignal} [signal]
 * @returns {Promise<{langs: Object<string, {female:Object|null, male:Object|null}>}|null>}
 *   null si l'endpoint est injoignable (le panneau affiche alors les 2 genres sans grisage).
 */
export async function fetchTtsVoices(signal = null) {
    if (voicesCatalog) return voicesCatalog;
    const url = CONFIG && CONFIG.ttsVoicesUrl;
    if (!url) return null;
    try {
        const res = await fetchWithTimeout(url, { method: 'GET' }, VOICES_FETCH_TIMEOUT_MS, signal);
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        if (data && data.langs) voicesCatalog = data;
        return voicesCatalog;
    } catch (e) {
        debugLog('tts', 'catalogue voix injoignable (non bloquant)', e);
        return null;
    }
}

/**
 * Indique si un genre est disponible pour une langue d'après le catalogue.
 * Sans catalogue chargé, répond true (le serveur fait de toute façon le repli de genre).
 * @param {string} lang - Code Caramel (fr, en, …, jp).
 * @param {'female'|'male'} gender
 * @returns {boolean}
 */
export function isVoiceAvailable(lang, gender) {
    const entry = voicesCatalog && voicesCatalog.langs && voicesCatalog.langs[lang];
    if (!entry) return true;
    return !!entry[gender];
}

// ── Synthèse ─────────────────────────────────────────────────────────────────

/**
 * Synthétise un lot de phrases (UN SEUL POST, cache par phrase).
 *
 * Les phrases déjà en cache (même lang/voice/slow) ou ré-hydratées depuis un .h5p ne sont
 * PAS renvoyées au serveur : seul le sous-ensemble manquant part en réseau, puis les
 * résultats sont recollés dans l'ordre d'entrée.
 *
 * @param {string[]} sentences - Textes des phrases (ordre préservé).
 * @param {Object} [opts]
 * @param {string}  [opts.lang] - Code langue Caramel (défaut : langue de l'UI).
 * @param {'female'|'male'} [opts.voice='female'] - Genre demandé (repli serveur si absent).
 * @param {boolean} [opts.slow=false] - Débit ralenti (piste « lecture lente »).
 * @param {AbortSignal} [opts.signal] - Annulation externe.
 * @param {function} [opts.onProgress] - Jauge UI ({stage:'tts', current, total}).
 * @returns {Promise<{audios: Array<{blob:Blob, mime:string, h5pPath:string, durationSeconds:number|null}>,
 *   voiceUsed:string|null, genderFallback:boolean} | {error:string, supportedLangs?:string[]}>}
 */
export async function synthesizeSentences(sentences, opts = {}) {
    const {
        lang = (currentLang || 'fr'),
        voice = 'female',
        slow = false,
        signal = null,
        onProgress = null
    } = opts;

    const texts = (sentences || []).map(s => String(s || '').trim());
    if (texts.length === 0) return { error: 'no_sentences' };
    if (texts.some(t => !t)) return { error: 'empty_sentence' };
    if (texts.length > TTS_MAX_SENTENCES) return { error: 'too_many_sentences' };
    const tooLong = texts.find(t => t.length > TTS_MAX_SENTENCE_LENGTH);
    if (tooLong) return { error: 'sentence_too_long' };

    const keyOpts = { lang, voice, slow };
    const results = new Array(texts.length).fill(null);
    const missing = []; // { index, text }

    for (let i = 0; i < texts.length; i++) {
        const key = ttsCacheKey(texts[i], keyOpts);
        const hit = ttsCache.get(key) || getPrimedByKey(key);
        if (hit && hit.blob) {
            results[i] = {
                blob: hit.blob,
                mime: hit.mime || 'audio/mpeg',
                h5pPath: ttsAudioPath(texts[i], keyOpts),
                durationSeconds: hit.durationSeconds ?? null
            };
        } else {
            missing.push({ index: i, text: texts[i] });
        }
    }

    let voiceUsed = null;
    let genderFallback = false;

    if (missing.length > 0) {
        const url = CONFIG && CONFIG.ttsUrl;
        if (!url) return { error: 'no_endpoint' };
        if (signal?.aborted) return { error: 'aborted' };
        if (onProgress) onProgress({ stage: 'tts', current: 0, total: 1 });

        let res;
        try {
            res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentences: missing.map(m => m.text), lang, voice, slow })
            }, TTS_FETCH_TIMEOUT_MS, signal);
        } catch (e) {
            if (signal?.aborted) return { error: 'aborted' };
            debugLog('tts', 'synthèse : erreur réseau', e);
            return { error: classifyError(e).category || 'network' };
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const err = (data && (data.error || data.message)) || `http_${res.status}`;
            debugLog('tts', `synthèse : HTTP ${res.status}`, data);
            return { error: err, ...(data && data.supportedLangs ? { supportedLangs: data.supportedLangs } : {}) };
        }
        if (!data || !Array.isArray(data.audios) || data.audios.length !== missing.length) {
            return { error: 'bad_response' };
        }

        voiceUsed = data.voiceUsed || null;
        genderFallback = !!data.genderFallback;

        for (let j = 0; j < missing.length; j++) {
            const { index, text } = missing[j];
            const a = data.audios[j];
            if (!a || !a.data) return { error: 'bad_response' };
            const mime = a.mime || 'audio/mpeg';
            const blob = base64ToBlob(a.data, mime);
            const entry = {
                blob, mime,
                durationSeconds: (a.durationSeconds != null) ? Number(a.durationSeconds) : null,
                voiceUsed, genderFallback
            };
            ttsCache.set(ttsCacheKey(text, keyOpts), entry);
            results[index] = {
                blob, mime,
                h5pPath: ttsAudioPath(text, keyOpts),
                durationSeconds: entry.durationSeconds
            };
        }
        if (onProgress) onProgress({ stage: 'tts', current: 1, total: 1 });
        debugLog('tts', `synthèse OK : ${missing.length} phrase(s) (${texts.length - missing.length} en cache), voix=${voiceUsed}, fallback=${genderFallback}`);
    } else {
        debugLog('tts', `synthèse : ${texts.length} phrase(s) servies du cache (aucun appel réseau)`);
    }

    return { audios: results, voiceUsed, genderFallback };
}
