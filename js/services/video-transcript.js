/**
 * @file Service de détection vidéo + récupération de transcription timée.
 *
 * Deux flux indépendants (cf. docs/PRD_VIDEO_INTERACTIVE.md) :
 *   ① Source de lecture  : la rendition mp4 progressive que le .h5p embarque (par URL, non bundlée).
 *   ② Transcription timée : les segments {start,end,text} injectés dans le prompt.
 *
 * Trois plateformes :
 *   - PeerTube apps.education : detectVideo() résout tout CÔTÉ NAVIGATEUR (API publique, CORS `*`) ;
 *     transcription via captions (instantané) sinon voie Albert (webhook n8n).
 *   - PodEduc (esup-pod) : page sans CORS + API 401 → detectVideo() délègue au webhook n8n en mode
 *     « détection » (POST `{ url }`, scrape serveur de l'URL mp4) ; transcription via la voie Albert
 *     (POST `{ mediaUrl }` au même webhook) car PodEduc n'expose aucun sous-titre public.
 *   - YouTube (best-effort, hors socle souverain) : LECTURE par le handler natif H5P.VideoYouTube
 *     (mime `video/YouTube`, aucun téléchargement) ; TRANSCRIPTION via le proxy caramel-proxy
 *     (Flask/yt-dlp) en DEUX temps — détection rapide `{ youtubeUrl }` (sous-titres auto si présents,
 *     sinon `canAudio:true` + durée), puis 2ᵉ appel `{ youtubeUrl, audio:true }` → repli Whisper
 *     (Albert) quand il n'y a pas de sous-titres. La langue est AUTO-DÉTECTÉE côté serveur. Si tout
 *     échoue (anti-bot…) → collage manuel ; la lecture reste possible même alors.
 *
 * Filet de sécurité (collage manuel) : parsePastedTranscript().
 *
 * Objet transcription NORMALISÉ (identique quelle que soit la voie) :
 *   { source, language, duration, text, segments:[{start,end,text}], vtt, captionUrl? }
 *
 * @module services/video-transcript
 */

import { debugLog, classifyError } from '../core/utils.js';
import { CONFIG } from '../caramelia/config.js';
import { currentLang } from '../core/translation.js';

// Caramel → code de langue YouTube (la plupart sont identiques ; seul 'jp' diffère → 'ja').
const YT_LANG_MAP = { jp: 'ja' };
/** Langue de sous-titres à demander à YouTube = langue de l'interface Caramel (repli 'fr'). */
function youtubeUiLang() {
    const ui = String(currentLang || 'fr').toLowerCase();
    return YT_LANG_MAP[ui] || ui;
}

const FETCH_TIMEOUT_MS = 15000;
const DETECT_TIMEOUT_MS = 30000;  // détection PodEduc serveur (GET page + scrape, rapide)
const ALBERT_TIMEOUT_MS = 180000; // transcription serveur (vidéos courtes/moyennes)
const YT_AUDIO_TIMEOUT_MS = 290000; // repli YouTube audio→Albert (téléchargement + transcodage + lots Whisper)
// Détection YouTube : avec le proxy en 2 temps (caramel-proxy ≥ 1.2.0), la détection NE lance plus
// Albert — elle liste/télécharge au plus les sous-titres existants (~10-15 s) + un court scrape de
// durée (~0,5 s), puis renvoie `canAudio` pour le 2ᵉ appel. 60 s couvrent largement un démarrage à
// froid sans laisser l'utilisateur planté ~5 min si le proxy se bloque. Le gros du travail (repli
// Albert quand il n'y a pas de sous-titres) part en 2ᵉ appel `audio:true` (YT_AUDIO_TIMEOUT_MS).
const YT_DETECT_TIMEOUT_MS = 60000;

/**
 * Estime la DURÉE de transcription (en secondes) selon le schéma qui sera suivi, à partir du
 * résultat de detectVideo(). Sert d'indication d'attente dans l'UI (voile « Transcription en cours »).
 *
 * Calibré empiriquement le 2026-06-14 (webhook dev2) :
 *   - YOUTUBE sous-titres auto : l'attente est dominée par la DÉTECTION (yt-dlp côté serveur récupère
 *       les sous-titres) ; la transcription est ensuite servie du cache, quasi instantanée. Mesuré
 *       ~10 s pour 23 min ⇒ attente quasi FIXE, faible dépendance à la durée (≈ 9 s + 0,1 s/min).
 *       Comme la plateforme se déduit de l'URL, on peut estimer SANS la durée (utile : on affiche
 *       l'estimation dès le collage, avant même l'appel yt-dlp).
 *   - Voie SOUS-TITRES PeerTube (Whisper VTT déjà publié) : un simple GET du VTT → quasi instantané.
 *   - Voie ALBERT (PeerTube/PodEduc sans sous-titres ; fichier entier OU lots HLS recollés) :
 *       mesures 20 s → 0,5 s · 50 s → 0,7 s · 89 s → 2,2 s · 5 min → 1,8 s · 48 min → ~21 s
 *       ⇒ régression robuste ≈ 3 s + 0,5 s par MINUTE de vidéo.
 *   - Repli YOUTUBE AUDIO→Albert (yt-dlp bestaudio + Whisper côté proxy) : lent, proportionnel à la
 *       durée. Depuis caramel-proxy ≥ 1.2.0 la durée réelle est connue dès la détection (scrape
 *       `lengthSeconds`) ⇒ estimation ≈ 18 s + 5 s/min, bornée au timeout (~285 s).
 *
 * @param {Object} detect - Résultat de detectVideo(), OU un stub minimal `{platform}` avant détection.
 * @returns {number|null} Estimation en secondes, ou null si on ne peut rien estimer (durée inconnue
 *   sur une plateforme proportionnelle à la durée).
 */
export function estimateTranscriptionSeconds(detect) {
    if (!detect) return null;
    const dur = Number(detect.duration);
    const min = (Number.isFinite(dur) && dur > 0) ? dur / 60 : 0;

    // YouTube : estimable dès que la plateforme est connue (URL), même sans durée — l'attente est
    // l'appel yt-dlp de détection, pas la transcription (servie du cache ensuite).
    if (detect.platform === 'youtube') {
        const hasSubs = !!(detect.captions && detect.captions.available)
            || !!(detect._transcript && Array.isArray(detect._transcript.segments) && detect._transcript.segments.length > 0);
        // Repli AUDIO (aucun sous-titre mais clé Albert serveur) : lent, PROPORTIONNEL à la durée
        // (yt-dlp télécharge l'audio + Whisper le transcrit). Depuis caramel-proxy ≥ 1.2.0, la durée
        // réelle est renvoyée dès la détection (scrape `lengthSeconds`) → estimation précise au lieu
        // d'un forfait. Calibré ~18 s + 5 s/min (mesuré 3 min → 27-43 s, on couvre le pire à froid),
        // borné au timeout (~285 s). Sans durée (scrape échoué) → repli forfaitaire ~45 s.
        if (detect.canAudio && !hasSubs) {
            return min > 0 ? Math.min(285, Math.round(18 + min * 5)) : 45;
        }
        // Sous-titres auto (cas courant) : ~10 s quasi fixe (mesuré 23 min → 10 s le 2026-06-14).
        return Math.round(9 + min * 0.1);
    }

    // Au-delà (PeerTube/PodEduc), l'attente est la transcription : proportionnelle à la durée.
    if (!Number.isFinite(dur) || dur <= 0) return null;

    // Sous-titres PeerTube déjà publiés → simple GET VTT, quasi instantané.
    if (detect.captions && detect.captions.available) return Math.max(2, Math.round(2 + min * 0.05));

    // Voie Albert standard (PeerTube/PodEduc) : ~3 s + 0,5 s par minute de vidéo.
    return Math.round(3 + min * 0.5);
}

/**
 * fetch avec timeout (AbortController) — évite de bloquer l'UI si l'API ne répond pas.
 * @param {string} url
 * @param {Object} [options]
 * @param {number} [timeout=FETCH_TIMEOUT_MS]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT_MS, signal = null) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    // Propage une annulation externe (bouton « Arrêter » de l'UI) au fetch courant.
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

// ======================================================================
// Détection de plateforme
// ======================================================================

/**
 * Extrait { origin, id } d'une URL PeerTube (apps.education).
 * Gère /w/<shortUUID> et /videos/watch/<uuid>.
 * @param {string} rawUrl
 * @returns {{origin:string, id:string}|null}
 */
function parsePeerTubeUrl(rawUrl) {
    let u;
    try {
        u = new URL(String(rawUrl).trim());
    } catch {
        return null;
    }
    if (!/^https?:$/.test(u.protocol)) return null;
    // PeerTube : /w/<id> (court) ou /videos/watch/<uuid>
    const m = u.pathname.match(/\/w\/([\w-]+)/) || u.pathname.match(/\/videos\/watch\/([\w-]+)/);
    if (!m) return null;
    return { origin: u.origin, id: m[1] };
}

/**
 * Indique si une URL est une vidéo PeerTube reconnue (Lot 1).
 * @param {string} url
 * @returns {boolean}
 */
export function isPeerTube(url) {
    return parsePeerTubeUrl(url) !== null;
}

/**
 * Extrait { id, url } d'une URL YouTube (watch, youtu.be, embed, shorts, live).
 * L'id YouTube fait 11 caractères [A-Za-z0-9_-]. URL canonique renvoyée pour la lecture
 * (le handler natif H5P.VideoYouTube reconnaît /watch?v=<id>).
 * @param {string} rawUrl
 * @returns {{id:string, url:string}|null}
 */
function parseYouTubeUrl(rawUrl) {
    let u;
    try {
        u = new URL(String(rawUrl).trim());
    } catch {
        return null;
    }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    let id = null;
    if (host === 'youtu.be') {
        id = (u.pathname.split('/')[1] || '').trim() || null;
    } else if (/^(?:m\.|music\.)?youtube(?:-nocookie)?\.com$/.test(host)) {
        if (u.pathname === '/watch') {
            id = u.searchParams.get('v');
        } else {
            const m = u.pathname.match(/^\/(?:embed|shorts|v|live)\/([\w-]+)/);
            if (m) id = m[1];
        }
    }
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return { id, url: `https://www.youtube.com/watch?v=${id}` };
}

/**
 * Indique si une URL est une vidéo YouTube reconnue.
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTube(url) {
    return parseYouTubeUrl(url) !== null;
}

/**
 * Reconnaît la plateforme d'une URL.
 * @param {string} url
 * @returns {'peertube'|'podeduc'|'youtube'|'unknown'}
 */
export function detectPlatform(url) {
    if (isYouTube(url)) return 'youtube';
    if (isPeerTube(url)) return 'peertube';
    try {
        const u = new URL(String(url).trim());
        if (/(^|\.)podeduc\.apps\.education\.fr$/i.test(u.host) && /\/video\//.test(u.pathname)) {
            return 'podeduc';
        }
    } catch { /* ignore */ }
    return 'unknown';
}

// ======================================================================
// Sélection de la rendition de lecture (PeerTube)
// ======================================================================

/**
 * Collecte toutes les renditions mp4 vidéo (resolution.id > 0) depuis files[] et
 * streamingPlaylists[].files[], triées par résolution CROISSANTE.
 * Règle (cf. audit) : ne JAMAIS reconstruire l'URL — utiliser fileUrl tel quel (fédération).
 * @param {Object} apiVideo - L'objet vidéo de l'API PeerTube.
 * @returns {Array<{url:string, mime:string, resolution:number}>}
 */
function collectRenditions(apiVideo) {
    const candidates = [];
    const collect = (files, kind) => {
        if (!Array.isArray(files)) return;
        for (const f of files) {
            const resId = f?.resolution?.id;
            const url = f?.fileUrl || f?.fileDownloadUrl;
            if (!url || typeof resId !== 'number') continue;
            if (resId > 0) {
                candidates.push({ url, mime: 'video/mp4', resolution: resId, kind });
            } else if (resId === 0 && kind === 'progressive') {
                // Rendition AUDIO-SEULE (web-videos « -0.mp4 ») : idéale pour Albert (poids minimal,
                // ex. 5,9 Mo vs 41 Mo en 480p → tient sous 20 Mo bien plus longtemps). NON jouable
                // comme vidéo → taguée 'audio' et exclue de pickPlayableRendition.
                candidates.push({ url, mime: 'audio/mp4', resolution: 0, kind: 'audio' });
            }
        }
    };
    // On collecte LES DEUX : progressif (legacy web-videos) ET HLS fragmenté (fileUrl par résolution).
    // Important : pour la transcription serveur (Albert/n8n), le mp4 HLS « fragmented » est
    // téléchargeable alors que le progressif « web-videos » peut échouer (redirection stockage objet).
    collect(apiVideo?.files, 'progressive');
    if (Array.isArray(apiVideo?.streamingPlaylists)) {
        for (const sp of apiVideo.streamingPlaylists) collect(sp?.files, 'hls');
    }
    candidates.sort((a, b) => a.resolution - b.resolution);
    return candidates;
}

/**
 * Choisit la rendition de LECTURE : progressif de préférence (compatibilité <video>),
 * la plus haute ≤ 720p (confort/poids), sinon la plus basse ; repli HLS si pas de progressif.
 * @param {Array} renditions - Renditions triées croissant (cf. collectRenditions).
 * @returns {{url:string, mime:string, resolution:number}|null}
 */
function pickPlayableRendition(renditions) {
    if (!renditions || renditions.length === 0) return null;
    // Lecture = vidéo uniquement (jamais la rendition audio-seule 0p).
    const videos = renditions.filter(r => r.kind !== 'audio');
    if (videos.length === 0) return null;
    // Préférer HLS « fragmented » : sur PeerTube en HLS-only (défaut moderne), le progressif
    // `web-videos/*.mp4` listé par l'API est 404 (fichiers supprimés au profit du HLS).
    // Repli progressif pour les anciennes vidéos sans streamingPlaylists.
    const hls = videos.filter(r => r.kind === 'hls');
    const pool = hls.length ? hls : videos;
    const upTo720 = pool.filter(c => c.resolution <= 720);
    return upTo720.length ? upTo720[upTo720.length - 1] : pool[0];
}

/**
 * Ordonne les renditions pour la voie Albert : HLS « fragmented » d'abord (téléchargeable par n8n),
 * puis progressif en repli ; chaque groupe trié par résolution croissante (plus petit = < 20 Mo).
 * @param {Array} renditions
 * @returns {Array}
 */
function albertCandidates(renditions) {
    const list = renditions || [];
    const audio = list.filter(r => r.kind === 'audio');                                          // poids minimal → essayé en 1er
    const hls = list.filter(r => r.kind === 'hls').sort((a, b) => a.resolution - b.resolution);
    const prog = list.filter(r => r.kind === 'progressive').sort((a, b) => a.resolution - b.resolution);
    return [...audio, ...hls, ...prog];
}

// ======================================================================
// detectVideo
// ======================================================================

/**
 * Détecte une vidéo (LOT 1 : PeerTube apps.education uniquement, côté navigateur).
 * @param {string} url
 * @returns {Promise<Object>} Objet de détection :
 *   { supported, platform, title, duration, thumbnail, playable,
 *     videoSource:{type,url,mime}, captions:{available,lang,fileUrl,source}, error? }
 */
export async function detectVideo(url) {
    const platform = detectPlatform(url);

    if (platform === 'peertube') {
        return detectPeerTube(url);
    }
    if (platform === 'podeduc') {
        return detectPodEduc(url);
    }
    if (platform === 'youtube') {
        return detectYouTube(url);
    }
    return { supported: false, platform: 'unknown', playable: false, error: 'unsupported_platform' };
}

/**
 * Détection PeerTube via l'API REST publique (sans auth, CORS `*`).
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function detectPeerTube(url) {
    const parsed = parsePeerTubeUrl(url);
    if (!parsed) {
        return { supported: false, platform: 'peertube', playable: false, error: 'bad_url' };
    }
    const { origin, id } = parsed;
    try {
        const videoRes = await fetchWithTimeout(`${origin}/api/v1/videos/${encodeURIComponent(id)}`);
        if (!videoRes.ok) {
            return { supported: false, platform: 'peertube', playable: false, error: `http_${videoRes.status}` };
        }
        const v = await videoRes.json();
        const renditions = collectRenditions(v);
        const rendition = pickPlayableRendition(renditions);

        // URL de la playlist HLS (master m3u8) : base du découpage en lots fMP4 pour les vidéos
        // LONGUES sans sous-titres (la voie « fichier entier » audio-seul/HLS dépasserait la limite
        // 20 Mo d'Albert au-delà de ~17 min). Le HLS PeerTube est fragmenté (fMP4 + #EXT-X-MAP).
        const hlsSp = Array.isArray(v?.streamingPlaylists) ? v.streamingPlaylists.find(sp => sp && sp.playlistUrl) : null;
        const hlsPlaylistUrl = hlsSp ? hlsSp.playlistUrl : null;

        // Sous-titres : endpoint séparé. On préfère le français, sinon la 1ère piste.
        let captions = { available: false, lang: null, fileUrl: null, source: 'none' };
        try {
            const capRes = await fetchWithTimeout(`${origin}/api/v1/videos/${encodeURIComponent(id)}/captions`);
            if (capRes.ok) {
                const capData = await capRes.json();
                const list = Array.isArray(capData?.data) ? capData.data : [];
                if (list.length > 0) {
                    const fr = list.find(c => (c?.language?.id || '').toLowerCase().startsWith('fr'));
                    const chosen = fr || list[0];
                    const capUrl = chosen?.fileUrl || (chosen?.captionPath ? origin + chosen.captionPath : null);
                    if (capUrl) {
                        captions = {
                            available: true,
                            lang: (chosen?.language?.id || 'fr'),
                            fileUrl: capUrl,
                            source: 'platform'
                        };
                    }
                }
            }
        } catch (e) {
            debugLog('video-transcript', 'captions fetch échec (non bloquant)', e);
        }

        const playable = !!rendition;
        return {
            supported: true,
            platform: 'peertube',
            title: v?.name || '',
            duration: typeof v?.duration === 'number' ? v.duration : null,
            // Langue déclarée de la vidéo (PeerTube) — sert d'indice à Whisper quand il n'y a pas de
            // sous-titres, pour ne pas transcrire de force en français une vidéo étrangère.
            language: (v?.language?.id) || null,
            thumbnail: v?.thumbnailPath ? origin + v.thumbnailPath : (v?.previewPath ? origin + v.previewPath : null),
            playable,
            videoSource: playable ? { type: 'html5', url: rendition.url, mime: rendition.mime } : null,
            renditions, // triées croissant — utilisées pour la voie Albert (plus basse rendition)
            hlsPlaylistUrl, // master m3u8 → découpage fMP4 (vidéos longues sans sous-titres)
            captions
        };
    } catch (error) {
        const info = classifyError(error);
        debugLog('video-transcript', 'detectPeerTube erreur', error);
        return { supported: false, platform: 'peertube', playable: false, error: info.category || 'network' };
    }
}

// ======================================================================
// detectPodEduc — résolution serveur (page sans CORS, API publique 401)
// ======================================================================

/**
 * Détecte une vidéo PodEduc (esup-pod). La page n'expose ni CORS ni API publique : impossible
 * de résoudre l'URL mp4 côté navigateur. On délègue au MÊME webhook n8n que la transcription,
 * en mode « détection » : appelé avec `{ url }` (sans `mediaUrl`), il GET la page côté serveur,
 * scrape l'URL mp4 progressive + titre + durée, et répond SANS lancer Albert (rapide).
 * La transcription suit ensuite le chemin Albert standard (mediaUrl) via fetchTranscript —
 * exactement comme PeerTube une fois la rendition résolue.
 * @param {string} url - URL de la page vidéo PodEduc.
 * @returns {Promise<Object>} Même forme que detectPeerTube (videoSource, renditions, captions…).
 */
async function detectPodEduc(url) {
    const endpoint = CONFIG && CONFIG.videoTranscriptUrl;
    if (!endpoint) return { supported: false, platform: 'podeduc', playable: false, error: 'no_endpoint' };
    try {
        const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Pas de mediaUrl → le workflow bascule en mode détection (scrape de la page).
            body: JSON.stringify({ url })
        }, DETECT_TIMEOUT_MS);
        if (!res.ok) {
            return { supported: false, platform: 'podeduc', playable: false, error: `detect_http_${res.status}` };
        }
        const data = await res.json().catch(() => null);
        if (!data || !data.playable || !data.videoSource || !data.videoSource.url) {
            return { supported: false, platform: 'podeduc', playable: false, error: 'podeduc_no_media' };
        }
        // Défensif : le scrape serveur peut renvoyer une URL RELATIVE (/media/...) si l'origin
        // n'a pas pu être reconstruit côté n8n. On la résout contre l'URL de la page (qu'on connaît).
        const abs = (u) => { try { return new URL(u, url).href; } catch { return u; } };
        const videoSource = { ...data.videoSource, url: abs(data.videoSource.url) };
        const rawRenditions = Array.isArray(data.renditions) && data.renditions.length
            ? data.renditions
            : [{ url: data.videoSource.url, mime: data.videoSource.mime || 'video/mp4', resolution: 0, kind: 'progressive' }];
        const renditions = rawRenditions.map(r => ({ ...r, url: abs(r.url) }));
        return {
            supported: true,
            platform: 'podeduc',
            title: data.title || '',
            duration: (data.duration != null) ? Number(data.duration) : null,
            thumbnail: null,
            playable: true,
            videoSource,
            renditions, // pour la voie Albert (plus basse rendition d'abord)
            // PodEduc n'expose aucun sous-titre public (cf. audit) → toujours la voie Albert.
            captions: { available: false, lang: null, fileUrl: null, source: 'none' }
        };
    } catch (error) {
        const info = classifyError(error);
        debugLog('video-transcript', 'detectPodEduc erreur', error);
        return { supported: false, platform: 'podeduc', playable: false, error: info.category || 'network' };
    }
}

// ======================================================================
// detectYouTube — lecture via le player natif H5P + sous-titres auto (serveur yt-dlp)
// ======================================================================

/**
 * Détecte une vidéo YouTube. La LECTURE est gérée par le handler natif H5P.VideoYouTube
 * (mime `video/YouTube`) — aucun téléchargement, donc la vidéo est toujours « playable » dès
 * que l'URL est valide. La TRANSCRIPTION suit le proxy caramel-proxy en DEUX temps : cet appel
 * de DÉTECTION (`{ youtubeUrl }`, sans `audio`) ramène les métadonnées + les sous-titres auto
 * S'ILS EXISTENT (alors stockés dans `_transcript`, servis sans 2ᵉ appel) ; sinon il répond vite
 * `canAudio:true` + la durée réelle, et fetchTranscript déclenche le 2ᵉ appel `audio:true`
 * (repli Whisper/Albert, budget long). La langue est auto-détectée côté serveur.
 *
 * Important : YouTube est « best-effort » (hors socle souverain). Si le serveur échoue
 * (anti-bot datacenter…), on reste « playable » et on bascule sur le collage manuel —
 * jamais d'échec dur tant que l'URL est valide.
 * @param {string} url
 * @returns {Promise<Object>} Même forme que detectPeerTube (videoSource, captions, _transcript?).
 */
async function detectYouTube(url) {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
        return { supported: false, platform: 'youtube', playable: false, error: 'bad_url' };
    }
    // Lecture native YouTube : pas de téléchargement, l'URL canonique suffit au handler H5P.
    const videoSource = { type: 'html5', url: parsed.url, mime: 'video/YouTube' };
    const thumbnail = `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
    const base = {
        supported: true,
        platform: 'youtube',
        title: '',
        duration: null,
        thumbnail,
        playable: true,
        videoSource,
        renditions: [],
        captions: { available: false, lang: null, fileUrl: null, source: 'none' }
    };

    const endpoint = CONFIG && CONFIG.videoTranscriptUrl;
    if (!endpoint) return { ...base, transcriptError: 'no_endpoint' };

    // Langue demandée = langue de l'interface Caramel. Ce n'est qu'un INDICE de PRÉFÉRENCE pour
    // choisir la piste de sous-titres : le serveur retombe sur la langue d'origine de la vidéo si
    // elle n'a pas cette piste, et pour le repli audio Whisper auto-détecte la vraie langue.
    const reqLang = youtubeUiLang();
    try {
        const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Mode YouTube du webhook (proxy yt-dlp) — distinct de mediaUrl/hlsPlanUrl/url.
            body: JSON.stringify({ youtubeUrl: parsed.url, language: reqLang })
            // DÉTECTION seule (pas de repli Albert ici) : appel rapide, cf. YT_DETECT_TIMEOUT_MS.
        }, YT_DETECT_TIMEOUT_MS);
        if (!res.ok) {
            return { ...base, transcriptError: `detect_http_${res.status}` };
        }
        const data = (await res.json().catch(() => null)) || {};
        const segments = Array.isArray(data.segments)
            ? data.segments
                .map(s => ({ start: Number(s.start) || 0, end: Number(s.end) || 0, text: String(s.text || '').trim() }))
                .filter(s => s.text.length > 0)
            : [];
        const hasSubs = !!data.hasAutoSubs && segments.length > 0;
        const lang = data.language || reqLang;
        const duration = (data.duration != null) ? Number(data.duration)
            : (segments.length ? segments[segments.length - 1].end : null);
        const transcript = hasSubs ? {
            source: 'youtube-subs',
            language: lang,
            duration,
            text: (data.text && String(data.text).trim()) || segments.map(s => s.text).join(' '),
            segments,
            vtt: data.vtt || segmentsToVtt(segments)
        } : null;
        return {
            ...base,
            title: data.title || '',
            duration,
            captions: hasSubs
                ? { available: true, lang, fileUrl: null, source: 'youtube-subs' }
                : base.captions,
            _transcript: transcript,
            // Repli audio→Albert disponible (clé Albert posée côté serveur) si pas de sous-titres.
            canAudio: !!data.canAudio,
            ...(hasSubs ? {} : { transcriptError: data.error || 'no_subs' })
        };
    } catch (error) {
        debugLog('video-transcript', 'detectYouTube erreur', error);
        // La lecture reste possible : on renvoie un détect « playable » sans transcription.
        return { ...base, transcriptError: classifyError(error).category || 'network' };
    }
}

/**
 * Repli YouTube : transcription par la voie AUDIO→Albert (côté serveur, 2ᵉ temps). Déclenché quand
 * la vidéo n'a pas de sous-titres mais que le serveur a une clé Albert (detect.canAudio). Le proxy
 * caramel-proxy télécharge l'audio (yt-dlp -x mp3) et le transcrit avec Whisper (Albert), langue
 * auto-détectée. LENT → timeout long + jauge indéterminée. La lecture reste l'embed natif.
 * @param {string} url
 * @param {function} [onProgress]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>} transcript normalisé ou { error }.
 */
async function transcribeYouTubeAudio(url, onProgress = null, signal = null) {
    const endpoint = CONFIG && CONFIG.videoTranscriptUrl;
    if (!endpoint) return { error: 'no_endpoint' };
    const parsed = parseYouTubeUrl(url);
    if (!parsed) return { error: 'bad_url' };
    if (onProgress) onProgress({ stage: 'plan' }); // étape indéterminée (audio + transcodage + Whisper)
    try {
        const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtubeUrl: parsed.url, language: youtubeUiLang(), audio: true })
        }, YT_AUDIO_TIMEOUT_MS, signal);
        if (!res.ok) return { error: `albert_http_${res.status}` };
        const data = await res.json().catch(() => null);
        if (!data) return { error: 'albert_bad_json' };
        const segments = Array.isArray(data.segments)
            ? data.segments
                .map(s => ({ start: Number(s.start) || 0, end: Number(s.end) || 0, text: String(s.text || '').trim() }))
                .filter(s => s.text.length > 0)
            : [];
        if (segments.length === 0) return { error: data.error || 'albert_empty' };
        if (onProgress) onProgress({ stage: 'transcribe', current: 1, total: 1 });
        return {
            source: 'albert',
            language: data.language || youtubeUiLang(),
            duration: (data.duration != null) ? Number(data.duration) : segments[segments.length - 1].end,
            text: (data.text && String(data.text).trim()) || segments.map(s => s.text).join(' '),
            segments,
            vtt: data.vtt || segmentsToVtt(segments)
        };
    } catch (error) {
        debugLog('video-transcript', 'transcribeYouTubeAudio erreur', error);
        return { error: classifyError(error).category || 'network' };
    }
}

// ======================================================================
// fetchTranscript (chemin captions → voie Albert)
// ======================================================================

/**
 * Récupère la transcription timée (sous-titres existants si dispo, sinon voie Albert).
 * @param {string} url
 * @param {Object} [detectInfo] - Résultat de detectVideo() (évite un 2ᵉ appel API).
 * @param {function} [onProgress] - Callback de progression (jauge UI) : reçoit
 *   { stage:'plan' } | { stage:'transcribe', current, total }.
 * @param {AbortSignal} [signal] - Permet d'arrêter la transcription en cours (bouton « Arrêter »).
 * @returns {Promise<Object>} Objet transcript normalisé, ou { error } si indisponible.
 */
export async function fetchTranscript(url, detectInfo = null, onProgress = null, signal = null) {
    const info = detectInfo || await detectVideo(url);
    if (signal?.aborted) return { error: 'aborted' };

    if (info?.captions?.available && info.captions.fileUrl) {
        try {
            const res = await fetchWithTimeout(info.captions.fileUrl, {}, undefined, signal);
            if (!res.ok) return { error: `captions_http_${res.status}` };
            const raw = await res.text();
            const segments = parseVtt(raw);
            const text = segments.map(s => s.text).join(' ').trim();
            const duration = info.duration
                || (segments.length ? segments[segments.length - 1].end : null);
            return {
                source: 'captions',
                language: info.captions.lang || 'fr',
                duration,
                text,
                segments,
                vtt: raw,
                captionUrl: info.captions.fileUrl
            };
        } catch (error) {
            debugLog('video-transcript', 'fetchTranscript captions erreur', error);
            // On n'abandonne pas : on tente la voie Albert ci-dessous.
        }
    }

    // 1b. YouTube : les sous-titres auto (timés) ont déjà été récupérés à la détection (un seul
    //     appel yt-dlp côté serveur). On les sert depuis le cache du détect — pas de 2ᵉ appel.
    //     Sans sous-titres (anti-bot, vidéo sans fr-orig…) → collage manuel (la lecture reste OK).
    if (info?.platform === 'youtube') {
        if (info._transcript && Array.isArray(info._transcript.segments) && info._transcript.segments.length > 0) {
            if (onProgress) onProgress({ stage: 'transcribe', current: 1, total: 1 });
            return info._transcript;
        }
        // Pas de sous-titres : repli audio→Albert (lent, côté serveur) si le serveur l'autorise
        // (clé Albert posée → detect.canAudio). Sinon → collage manuel. La lecture reste OK.
        if (info.canAudio) {
            return transcribeYouTubeAudio(url, onProgress, signal);
        }
        return { error: 'needs_manual' };
    }

    // 2a. PodEduc : transcription par LOTS HLS. PodEduc n'a souvent que le 360p (une vidéo de
    //     48 min = 160 Mo ≫ limite 20 Mo d'Albert), et ffmpeg (Execute Command) est indisponible
    //     sur n8n. On découpe donc le flux HLS `.ts` en plages d'octets < 18 Mo (mode « plan » du
    //     webhook), on transcrit chaque lot (en-tête Range), et on recolle les timestamps avec
    //     l'offset exact de chaque lot. La lecture, elle, reste sur le mp4 (videoSource).
    if (info?.platform === 'podeduc' && info.videoSource && info.videoSource.url) {
        // m3u8 de variante esup-pod = même base que le mp4 (ex. 360p.mp4 → 360p.m3u8).
        const variantUrl = info.videoSource.url.replace(/\.mp4(\?.*)?$/i, '.m3u8$1');
        return transcribeViaHlsChunks(info, variantUrl, onProgress, signal);
    }

    // 2b. PeerTube sans caption : voie Albert sur la rendition (HLS-fragmented → progressif ;
    //     le progressif « web-videos » peut renvoyer un corps vide). 1ʳᵉ rendition qui produit
    //     des segments. Les vidéos PeerTube courtes/moyennes tiennent sous 20 Mo en basse rendition ;
    //     les LONGUES (> ~17 min) passent par le découpage HLS fMP4 (init #EXT-X-MAP + lots).
    if (info?.platform === 'peertube' && Array.isArray(info.renditions) && info.renditions.length > 0) {
        const lang = (info.captions && info.captions.lang) || info.language || 'fr';
        // Seuil : au-delà de ~17 min, même l'audio-seul (~13 Mo à 19 min) dépasse la limite 20 Mo.
        const longVideo = typeof info.duration === 'number' && info.duration > 1020;
        // Résout master→variante la plus basse CÔTÉ CLIENT (CORS PeerTube `*` + URL natif) : le plan
        // n8n parse alors directement la variante (son sandbox task-runner ne suit le master qu'en
        // repli, sans constructeur URL). null si pas de HLS.
        const planUrl = info.hlsPlaylistUrl ? await lowestHlsVariant(info.hlsPlaylistUrl, signal) : null;

        // 1) Vidéos LONGUES → découpage HLS fMP4 d'emblée (évite un échec 413 sur le fichier entier).
        if (longVideo && planUrl) {
            if (signal?.aborted) return { error: 'aborted' };
            const chunked = await transcribeViaHlsChunks(info, planUrl, onProgress, signal);
            if (!chunked.error && Array.isArray(chunked.segments) && chunked.segments.length > 0) return chunked;
            // sinon : on retombe sur la voie « fichier entier » ci-dessous (filet)
        }

        // 2) Voie Albert « fichier entier » (courtes/moyennes : audio-seul d'abord, puis HLS/progressif).
        const candidates = albertCandidates(info.renditions);
        let lastError = 'albert_empty';
        if (onProgress) onProgress({ stage: 'transcribe', current: 0, total: 1 }); // 1 appel (indéterminé)
        for (const r of candidates) {
            if (signal?.aborted) return { error: 'aborted' };
            const t = await transcribeViaAlbert(r.url, lang, null, signal);
            if (!t.error && Array.isArray(t.segments) && t.segments.length > 0) {
                if (onProgress) onProgress({ stage: 'transcribe', current: 1, total: 1 });
                return t;
            }
            lastError = t.error || 'albert_empty';
        }

        // 3) Dernier recours : découpage HLS fMP4 même « court » si le fichier entier a échoué
        //    (ex. pas d'audio-seul + rendition unique > 20 Mo).
        if (planUrl && !longVideo) {
            if (signal?.aborted) return { error: 'aborted' };
            const chunked = await transcribeViaHlsChunks(info, planUrl, onProgress, signal);
            if (!chunked.error && Array.isArray(chunked.segments) && chunked.segments.length > 0) return chunked;
            lastError = chunked.error || lastError;
        }
        return { error: lastError };
    }

    // 3. Pas de média résolu côté navigateur (plateforme inconnue) → collage manuel.
    return { error: 'needs_manual' };
}

// ======================================================================
// Voie Albert (webhook n8n caramel-video-transcript)
// ======================================================================

/**
 * Teste si une URL média est joignable (HEAD). PeerTube répond CORS `*` ; un échec (HEAD
 * refusé / CORS) n'est pas bloquant — le webhook télécharge de toute façon côté serveur.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isReachable(url) {
    try {
        const r = await fetchWithTimeout(url, { method: 'HEAD' }, 8000);
        return r.ok || r.status === 206;
    } catch {
        return false;
    }
}

/**
 * Transcrit une rendition (ou une plage d'octets d'un .ts / fMP4) via le webhook n8n dédié.
 * @param {string} mediaUrl - URL média publique (téléchargée côté serveur).
 * @param {string} language - Code langue ISO (défaut 'fr').
 * @param {string|null} [range] - Plage d'octets « start-end » (lot HLS) ; null = fichier entier.
 * @param {AbortSignal} [signal] - Annulation externe (bouton « Arrêter »).
 * @param {string|null} [initRange] - Plage d'octets de l'init fMP4 (#EXT-X-MAP, PeerTube) à préfixer
 *   au lot côté serveur ; null pour le .ts PodEduc (segments auto-suffisants).
 * @param {string|null} [initUrl] - URL du fichier contenant l'init si différent de mediaUrl (sinon mediaUrl).
 * @returns {Promise<Object>} Objet transcript normalisé, ou { error }.
 */
async function transcribeViaAlbert(mediaUrl, language = 'fr', range = null, signal = null, initRange = null, initUrl = null) {
    const endpoint = CONFIG && CONFIG.videoTranscriptUrl;
    if (!endpoint) return { error: 'no_endpoint' };
    try {
        const payload = { mediaUrl, language };
        if (range) payload.range = range;
        // fMP4 (PeerTube) : l'init #EXT-X-MAP (ftyp+moov) est préfixé au lot côté serveur,
        // sinon le segment moof/mdat seul n'est pas décodable par le moteur.
        if (initRange) { payload.initRange = initRange; if (initUrl) payload.initUrl = initUrl; }
        const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, ALBERT_TIMEOUT_MS, signal);
        if (!res.ok) return { error: `albert_http_${res.status}` };
        const data = await res.json().catch(() => null);
        if (!data) return { error: 'albert_bad_json' };
        const segments = Array.isArray(data.segments)
            ? data.segments
                .map(s => ({ start: Number(s.start) || 0, end: Number(s.end) || 0, text: String(s.text || '').trim() }))
                .filter(s => s.text.length > 0)
            : [];
        const text = (data.text && String(data.text).trim()) || segments.map(s => s.text).join(' ');
        const duration = (data.duration != null) ? Number(data.duration)
            : (segments.length ? segments[segments.length - 1].end : null);
        return {
            source: data.source || 'albert',
            language: data.language || language || 'fr',
            duration,
            text,
            segments,
            vtt: data.vtt || segmentsToVtt(segments)
        };
    } catch (error) {
        debugLog('video-transcript', 'transcribeViaAlbert erreur', error);
        return { error: classifyError(error).category || 'network' };
    }
}

/**
 * Résout une playlist HLS MASTER (#EXT-X-STREAM-INF) vers l'URL de la variante de plus basse
 * résolution (poids minimal, audio suffisant). Fait CÔTÉ CLIENT : PeerTube sert le m3u8 en CORS `*`
 * et le navigateur a le constructeur URL (≠ sandbox task-runner n8n). Si l'URL est déjà une variante
 * ou en cas d'échec réseau, renvoie l'URL telle quelle (le plan n8n suivra le master en repli).
 * @param {string} masterUrl
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
async function lowestHlsVariant(masterUrl, signal = null) {
    try {
        const res = await fetchWithTimeout(masterUrl, {}, FETCH_TIMEOUT_MS, signal);
        if (!res.ok) return masterUrl;
        const txt = await res.text();
        if (!/#EXT-X-STREAM-INF/i.test(txt)) return masterUrl; // déjà une variante
        const lines = txt.split(/\r?\n/);
        const variants = [];
        for (let i = 0; i < lines.length; i++) {
            const inf = lines[i].match(/^#EXT-X-STREAM-INF:(.*)$/i);
            if (!inf) continue;
            const bw = (inf[1].match(/BANDWIDTH=(\d+)/i) || [])[1];
            const res2 = (inf[1].match(/RESOLUTION=\d+x(\d+)/i) || [])[1];
            let uri = null;
            for (let j = i + 1; j < lines.length; j++) { const l = lines[j].trim(); if (l && !l.startsWith('#')) { uri = l; break; } }
            if (uri) variants.push({ bw: Number(bw) || 0, res: Number(res2) || 0, uri });
        }
        if (!variants.length) return masterUrl;
        variants.sort((a, b) => (a.res - b.res) || (a.bw - b.bw));
        try { return new URL(variants[0].uri, masterUrl).href; } catch { return variants[0].uri; }
    } catch (error) {
        debugLog('video-transcript', 'lowestHlsVariant échec (repli master)', error);
        return masterUrl;
    }
}

/**
 * Transcrit une vidéo par LOTS HLS (contourne la limite 20 Mo d'Albert sans ffmpeg). Générique :
 *   - PodEduc : m3u8 de variante listant un .ts unique par byte-ranges (#EXT-X-BYTERANGE) — chaque
 *     lot (paquets TS) est auto-suffisant.
 *   - PeerTube : m3u8 MASTER → le serveur suit vers la variante la plus basse, fMP4 fragmenté
 *     (#EXT-X-MAP init + #EXT-X-BYTERANGE moof/mdat). Le serveur PRÉFIXE l'init à chaque lot
 *     (sinon le segment n'est pas décodable). Le client relaie `plan.initRange`/`plan.initUrl`.
 * Recollage : retire le min du lot puis ajoute l'offset EXTINF (robuste que le moteur renvoie des
 * temps 0-based ou basés sur le PTS d'origine). Repli si pas de plan → appel direct sur le média.
 * @param {Object} info - Résultat de detectVideo() (videoSource, duration…).
 * @param {string} planUrl - m3u8 envoyé au mode « plan » (variante PodEduc OU master PeerTube).
 * @param {function} [onProgress]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>} Objet transcript normalisé, ou { error }.
 */
async function transcribeViaHlsChunks(info, planUrl, onProgress = null, signal = null) {
    const endpoint = CONFIG && CONFIG.videoTranscriptUrl;
    if (!endpoint) return { error: 'no_endpoint' };
    const src = (info.videoSource && info.videoSource.url) || '';
    const lang = (info.captions && info.captions.lang) || 'fr';

    // 1. Plan de découpage (côté serveur : GET m3u8, suit master→variante si besoin, byte-ranges).
    if (onProgress) onProgress({ stage: 'plan' });
    let plan = null;
    try {
        const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hlsPlanUrl: planUrl })
        }, DETECT_TIMEOUT_MS, signal);
        if (res.ok) plan = await res.json().catch(() => null);
    } catch (error) {
        debugLog('video-transcript', 'plan HLS échec', error);
    }
    if (signal?.aborted) return { error: 'aborted' };

    // Repli : pas de plan exploitable → tentative directe sur le média (vidéo courte < 20 Mo).
    if (!plan || !plan.tsUrl || !Array.isArray(plan.chunks) || plan.chunks.length === 0) {
        if (!src) return { error: 'hls_no_plan' };
        if (onProgress) onProgress({ stage: 'transcribe', current: 0, total: 1 });
        const t = await transcribeViaAlbert(src, lang, null, signal);
        if (onProgress) onProgress({ stage: 'transcribe', current: 1, total: 1 });
        return t;
    }

    // 2. Transcription lot par lot + recollage des timestamps.
    const tsUrl = plan.tsUrl;
    const initRange = plan.initRange || null;   // fMP4 (PeerTube) ; null pour le .ts PodEduc auto-suffisant
    const initUrl = plan.initUrl || null;       // init dans un fichier séparé (sinon = tsUrl côté serveur)
    const total = plan.chunks.length;
    const allSegments = [];
    let okChunks = 0;
    for (let i = 0; i < plan.chunks.length; i++) {
        if (signal?.aborted) break; // arrêt manuel : on stoppe les lots restants
        const chunk = plan.chunks[i];
        if (onProgress) onProgress({ stage: 'transcribe', current: i, total });
        const t = await transcribeViaAlbert(tsUrl, lang, chunk.range, signal, initRange, initUrl);
        if (t.error || !Array.isArray(t.segments) || t.segments.length === 0) {
            debugLog('video-transcript', 'lot HLS sans segment', chunk.range, t.error);
            continue; // transcription partielle plutôt que rien
        }
        const base = Math.min(...t.segments.map(s => s.start));
        const offset = Number(chunk.offset) || 0;
        for (const s of t.segments) {
            allSegments.push({
                start: +(s.start - base + offset).toFixed(3),
                end: +(s.end - base + offset).toFixed(3),
                text: s.text
            });
        }
        okChunks++;
    }
    if (onProgress) onProgress({ stage: 'transcribe', current: total, total });
    if (allSegments.length === 0) return { error: 'albert_empty' };
    allSegments.sort((a, b) => a.start - b.start);
    return {
        source: 'albert',
        language: lang,
        duration: plan.duration || info.duration || allSegments[allSegments.length - 1].end,
        text: allSegments.map(s => s.text).join(' ').trim(),
        segments: allSegments,
        vtt: segmentsToVtt(allSegments),
        ...(okChunks < plan.chunks.length ? { partial: true } : {})
    };
}

// ======================================================================
// parseVtt — parseur WebVTT (réutilisé pour le collage manuel au LOT 3)
// ======================================================================

/**
 * Convertit un timestamp WebVTT/SRT en secondes.
 * Accepte HH:MM:SS.mmm, MM:SS.mmm, et la virgule SRT (HH:MM:SS,mmm).
 * @param {string} ts
 * @returns {number}
 */
export function timecodeToSeconds(ts) {
    if (!ts) return 0;
    const clean = String(ts).trim().replace(',', '.');
    const parts = clean.split(':').map(Number);
    if (parts.some(n => Number.isNaN(n))) return 0;
    let s = 0;
    if (parts.length === 3) s = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) s = parts[0] * 60 + parts[1];
    else s = parts[0] || 0;
    return Math.max(0, s);
}

/**
 * Parse un contenu WebVTT en segments [{start,end,text}].
 * Tolérant : ignore l'en-tête WEBVTT, les NOTE, les identifiants de cue numériques.
 * @param {string} raw
 * @returns {Array<{start:number,end:number,text:string}>}
 */
export function parseVtt(raw) {
    if (!raw || typeof raw !== 'string') return [];
    const segments = [];
    // Découpe en blocs séparés par une ou plusieurs lignes vides.
    const blocks = raw.replace(/\r/g, '').split(/\n{2,}/);
    const TIMING = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/;

    for (const block of blocks) {
        const lines = block.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) continue;
        // Trouver la ligne de timing (peut être précédée d'un id de cue).
        const timingIdx = lines.findIndex(l => TIMING.test(l));
        if (timingIdx === -1) continue;
        const timingLine = lines[timingIdx];
        const [startRaw, endRaw] = timingLine.split('-->').map(p => p.trim().split(/\s+/)[0]);
        const start = timecodeToSeconds(startRaw);
        const end = timecodeToSeconds(endRaw);
        // Le texte = lignes après le timing, nettoyées des balises VTT (<00:00:01.000>, <c>, etc.).
        const textLines = lines.slice(timingIdx + 1)
            .map(l => l.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean);
        const text = textLines.join(' ').trim();
        if (text.length > 0) {
            segments.push({ start, end: end > start ? end : start, text });
        }
    }
    return segments;
}

/**
 * Reconstruit un contenu WebVTT à partir de segments[] (utile quand on n'a que les segments).
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @returns {string}
 */
export function segmentsToVtt(segments) {
    const fmt = (t) => {
        t = Math.max(0, Number(t) || 0);
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.floor(t % 60);
        const ms = Math.round((t - Math.floor(t)) * 1000);
        const p = (n, l = 2) => String(n).padStart(l, '0');
        return `${p(h)}:${p(m)}:${p(s)}.${p(ms, 3)}`;
    };
    let vtt = 'WEBVTT\n';
    for (const seg of (segments || [])) {
        vtt += `\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}\n`;
    }
    return vtt;
}

// ======================================================================
// Filet de sécurité — collage manuel nettoyé/mis en forme (PRD §15)
// ======================================================================

/** Nettoyage léger d'un texte : recolle les césures, normalise les espaces. */
function cleanPlainText(s) {
    return String(s || '')
        .replace(/-\s*\n\s*/g, '')      // césures « mot-\nsuite » → « motsuite »
        .replace(/\s+/g, ' ')           // espaces multiples
        .replace(/\s+([,;.!?])/g, '$1') // espace avant ponctuation simple
        .trim();
}

/** Construit un objet transcript normalisé à partir de segments parsés manuellement. */
function normalizeManual(segments, source, language) {
    const text = segments.map(s => s.text).join(' ').trim();
    const duration = segments.length ? segments[segments.length - 1].end : null;
    return { source, language: language || 'fr', duration, text, segments, vtt: segmentsToVtt(segments) };
}

/**
 * Parse un texte collé par l'utilisateur (filet de sécurité). Détecte WebVTT, SRT,
 * transcript horodaté (`[h:mm:ss] texte` / `m:ss texte`) ou texte brut, nettoie et
 * renvoie le MÊME objet normalisé que les autres voies (segments[] + vtt, ou untimed).
 * @param {string} raw
 * @param {string} [language='fr']
 * @returns {Object} Objet transcript normalisé, ou { error } si vide.
 */
export function parsePastedTranscript(raw, language = 'fr') {
    const text0 = String(raw || '').trim();
    if (!text0) return { error: 'empty' };

    // 1. WebVTT / SRT (présence de flèches de timing « --> »)
    if (/-->/.test(text0)) {
        const segments = parseVtt(text0).map(s => ({ ...s, text: cleanPlainText(s.text) })).filter(s => s.text);
        if (segments.length) {
            const isVtt = /^\s*WEBVTT/.test(text0);
            return normalizeManual(segments, isVtt ? 'manual-vtt' : 'manual-srt', language);
        }
    }

    // 2. Transcript horodaté ligne par ligne : « [0:23] texte » ou « 1:05 texte »
    const lines = text0.split(/\r?\n/).filter(l => l.trim());
    const tsLine = /^\s*\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s+(.+)$/;
    const tsCount = lines.filter(l => tsLine.test(l)).length;
    if (lines.length >= 2 && tsCount >= Math.ceil(lines.length / 2)) {
        const segs = [];
        for (const line of lines) {
            const m = line.match(tsLine);
            if (m) segs.push({ start: timecodeToSeconds(m[1]), end: 0, text: cleanPlainText(m[2]) });
        }
        for (let i = 0; i < segs.length; i++) {
            segs[i].end = (i + 1 < segs.length) ? segs[i + 1].start : segs[i].start + 5;
        }
        const filtered = segs.filter(s => s.text);
        if (filtered.length) return normalizeManual(filtered, 'manual-text', language);
    }

    // 3. Texte brut sans timing → nettoyage, non timé (questions réparties uniformément en aval)
    const cleaned = cleanPlainText(text0.replace(/\n+/g, ' '));
    return { source: 'manual-text', language, duration: null, text: cleaned, segments: [], vtt: '', untimed: true };
}
