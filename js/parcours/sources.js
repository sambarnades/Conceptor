/** Sources et octets propres à CHAQUE carte, sans registre global partagé. */
import { allModules } from '../core/definitions.js';
import { currentLang } from '../core/translation.js';
import { MODULES_PARCOURS } from './modules-parcours.js';

const IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const CHEMIN = /^(?:images|audios|videos)\/[A-Za-z0-9._-]+$/;
const caches = new WeakMap();

export function typeSource(module) {
    const d = allModules[module];
    if (d) return d.requiresVideoUrl ? 'video' : d.requiresBackgroundImage ? 'image' : null;
    // Un module de parcours peut, lui aussi, attendre ce que le modèle ne sait
    // pas inventer : l'adresse d'un lien web (`source: 'lien'`, D70).
    return MODULES_PARCOURS[module]?.source || null;
}

export function urlVideo(valeur) {
    try {
        const u = new URL(String(valeur || '').trim());
        return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '';
    } catch { return ''; }
}

export function sourceManquante(carte) {
    const type = typeSource(carte.module);
    if (!type) return false;
    if (type === 'video') return carte.source?.type !== type || !urlVideo(carte.source.url) || transcriptionDecalee(carte);
    if (type === 'lien') return carte.source?.type !== type || !urlVideo(carte.source.url);
    return carte.source?.type !== type || !IMAGE.test(carte.medias?.[carte.source.path] || '');
}

export function transcriptionDecalee(carte) {
    const s = carte.source;
    return !!(s?.transcription?.trim() && s.transcriptionUrl && urlVideo(s.transcriptionUrl) !== urlVideo(s.url));
}

/** Seuls les chemins locaux effectivement utilisés voyagent dans le paquet. */
export function cheminsMedias(contenu) {
    return new Set((JSON.stringify(contenu || {}).match(/"(?:images|audios|videos)\/[A-Za-z0-9._-]+"/g) || []).map(s => s.slice(1, -1)));
}

export function mediaFilesPour(carte) {
    const files = new Map();
    for (const path of cheminsMedias(carte.contenu)) {
        const uri = carte.medias?.[path];
        if (!uri) continue; // Le créateur H5P signale lui-même les octets manquants.
        const m = /^data:([\w.+/-]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(uri);
        if (!m) continue;
        files.set(path, new Blob([Uint8Array.from(atob(m[2]), c => c.charCodeAt(0))], { type: m[1] }));
    }
    return files;
}

export function purgerMedias(carte) {
    if (!carte.medias) return;
    const utiles = cheminsMedias(carte.contenu);
    if (carte.source?.type === 'image') utiles.add(carte.source.path);
    carte.medias = Object.fromEntries(Object.entries(carte.medias).filter(([p]) => utiles.has(p)));
}

/** Les widgets de l'éditeur individuel attendent une dataURL pour leur aperçu. */
export function contenuPourEdition(carte) {
    const contenu = structuredClone(carte.contenu || { title: carte.titre || '' });
    if (!carte.contenu && carte.source?.type === 'image') {
        const { path, mime, width, height } = carte.source;
        contenu.image = { path, mime, width, height, copyright: { license: 'U' } };
    }
    parcourirObjets(contenu, ref => {
        if (carte.medias?.[ref.path]) ref.dataURL = carte.medias[ref.path];
    });
    return contenu;
}

function parcourirObjets(obj, fn) {
    if (!obj || typeof obj !== 'object') return;
    fn(obj);
    Object.values(obj).forEach(v => parcourirObjets(v, fn));
}

/** Garder les octets ajoutés dans l'éditeur ; aucun média d'une autre carte ne voyage. */
export async function recueillirMedias(carte, donnees, plan) {
    const { getAllMedia } = await import('../h5p/image-manager.js');
    const registre = getAllMedia();
    const contenu = structuredClone(donnees);
    const medias = { ...carte.medias };
    parcourirObjets(contenu, ref => {
        if (CHEMIN.test(ref.path || '') && /^data:(image|audio|video)\//.test(ref.dataURL || '')) medias[ref.path] = ref.dataURL;
        // Les chemins et octets sont stockés séparément : ni blob: éphémère, ni doublon base64.
        if (CHEMIN.test(ref.path || '')) delete ref.dataURL;
    });
    for (const path of cheminsMedias(contenu)) {
        const blob = registre.get(path);
        if (!blob || medias[path]) continue;
        medias[path] = await new Promise((resolve, reject) => {
            const lecteur = new FileReader();
            lecteur.onload = () => resolve(lecteur.result);
            lecteur.onerror = () => reject(lecteur.error);
            lecteur.readAsDataURL(blob);
        });
    }
    const candidate = { ...carte, contenu, medias };
    // Remplacer le fond dans l'éditeur remplace aussi le support des prochaines
    // générations. Une simple retouche de texte conserve un éventuel support en attente.
    const image = contenu.image;
    const fondModifie = typeSource(carte.module) === 'image' && image?.path
        && image.path !== carte.contenu?.image?.path && medias[image.path];
    if (fondModifie) {
        candidate.source = { type: 'image', path: image.path, nom: image.path.split('/').pop(),
            mime: image.mime, width: image.width, height: image.height };
        candidate.sourceUtilisee = JSON.stringify(candidate.source);
    }
    purgerMedias(candidate);
    verifierPoids(candidate, carte, plan);
    return { contenu, medias: candidate.medias,
        ...(fondModifie ? { source: candidate.source, sourceUtilisee: candidate.sourceUtilisee } : {}) };
}

function verifierPoids(candidate, carte, plan) {
    const cartes = plan.etapes.flatMap(e => e.cartes);
    const poids = cartes.reduce((s, c) => s + Object.values((c === carte ? candidate : c).medias || {}).reduce((n, uri) => n + uri.length, 0), 0);
    // Réserver de la place aux textes sous le plafond de 30 Mio du scénario.
    if (poids + (plan.carte?.image?.dataURL?.length || 0) > 20 * 1024 * 1024) throw new Error('parcours_source_limite');
}

/** Valider les données importées, sans charger une URL fournie par le fichier. */
export function relireSources(carte) {
    const medias = {};
    for (const [p, uri] of Object.entries(carte.medias || {})) {
        if (!CHEMIN.test(p) || typeof uri !== 'string' || !/^data:(?:image\/(?:png|jpeg|webp)|audio\/[\w.+-]+|video\/[\w.+-]+);base64,[A-Za-z0-9+/]+={0,2}$/.test(uri)) throw new Error('parcours_scenario_illisible');
        medias[p] = uri;
    }
    const src = carte.source;
    let source = null;
    if (src?.type === 'lien') source = { type: 'lien', url: urlVideo(src.url) };
    if (src?.type === 'video') source = { type: 'video', url: urlVideo(src.url), transcription: String(src.transcription || ''),
        ...(src.transcriptionUrl ? { transcriptionUrl: urlVideo(src.transcriptionUrl) } : {}) };
    if (src?.type === 'image' && CHEMIN.test(src.path || '')) {
        source = { type: 'image', path: src.path, nom: String(src.nom || ''), mime: String(src.mime || 'image/png'),
            width: Math.max(1, Math.min(10000, Number(src.width) || 1)), height: Math.max(1, Math.min(10000, Number(src.height) || 1)) };
    }
    return { ...(source ? { source } : {}), ...(Object.keys(medias).length ? { medias } : {}),
        ...(typeof carte.sourceUtilisee === 'string' ? { sourceUtilisee: carte.sourceUtilisee } : {}) };
}

/** Décodage local seulement. La vision ne démarre qu’à la fabrication. */
export async function joindreImage(carte, fichier, plan, encoreActive = () => true) {
    const module = carte.module;
    const jeton = {};
    caches.set(carte, jeton);
    const { processBackgroundImage } = await import('../h5p/image-manager.js');
    const image = await processBackgroundImage(fichier);
    if (caches.get(carte) !== jeton || carte.module !== module || !encoreActive()
        || !plan.etapes.some(e => e.cartes.includes(carte))) return false;
    const candidate = { ...carte, source: { type: 'image', path: image.h5pPath, nom: fichier.name || '',
        mime: image.mime, width: image.width, height: image.height }, medias: { ...carte.medias, [image.h5pPath]: image.dataURL } };
    purgerMedias(candidate);
    verifierPoids(candidate, carte, plan);
    carte.source = candidate.source;
    carte.medias = candidate.medias;
    return true;
}

function annulation(signal) {
    if (signal?.aborted) throw Object.assign(new Error('Source annulée'), { code: 'GENERATION_CANCELLED' });
}

/** Analyse à la demande, dans la même file séquentielle que la génération. */
export async function preparerSource(draft, carte, signal, count = null) {
    const type = typeSource(carte.module);
    if (!type) return null;
    if (sourceManquante(carte)) throw new Error('parcours_source_manquante');
    // Un lien ne s'analyse pas : on ne va pas chercher la page, on donne son
    // adresse au module (et au prompt, pour que la consigne en parle juste).
    if (type === 'lien') return { type, url: urlVideo(carte.source.url) };
    const signature = JSON.stringify([carte.source, carte.module, carte.objectif, carte.consigne, draft.contexte?.qui, draft.contexte?.quoi, currentLang, count]);
    if (caches.get(carte)?.signature === signature) return caches.get(carte).valeur;
    annulation(signal);
    let valeur;
    if (type === 'image') {
        const { detectImageZones } = await import('../services/hotspot-vision.js');
        const analyse = await detectImageZones(carte.medias[carte.source.path], {
            context: { ...draft.contexte, quoi: [draft.contexte?.quoi, carte.objectif, carte.consigne].filter(Boolean).join(' — ') },
            lang: currentLang, count, signal,
        });
        if (!analyse.zones?.length) throw new Error('parcours_source_analyse_echec');
        valeur = { type, ...analyse, image: { path: carte.source.path, mime: carte.source.mime,
            width: carte.source.width, height: carte.source.height, copyright: { license: 'U' } } };
    } else {
        const { detectVideo, fetchTranscript, parsePastedTranscript } = await import('../services/video-transcript.js');
        const detect = await detectVideo(carte.source.url, signal);
        annulation(signal);
        if (!detect.playable) throw new Error('parcours_source_video_invalide');
        const transcript = carte.source.transcription?.trim()
            ? parsePastedTranscript(carte.source.transcription, currentLang)
            : await fetchTranscript(carte.source.url, detect, null, signal);
        annulation(signal);
        if (transcript.error || !(transcript.segments?.length || transcript.text?.trim())) throw new Error('parcours_source_transcription_echec');
        valeur = { type, detect, transcript };
    }
    annulation(signal);
    caches.set(carte, { signature, valeur });
    return valeur;
}

export async function appliquerSource(contenu, source, module) {
    if (!source) return contenu;
    if (source.type === 'lien') {
        contenu.externalurl = source.url;
        return contenu;
    }
    if (source.type === 'image') {
        contenu.image = source.image;
        if (module === 'ImageHotspots') {
            contenu.backgroundImageAltText = source.imageDescription || '';
            contenu.globalIconType ||= 'numbers';
        }
    } else {
        if (Array.isArray(contenu)) contenu = { interactions: contenu };
        const { snapVideoTimestamps } = await import('../ui/media-helpers.js');
        snapVideoTimestamps(contenu, source.transcript, source.detect);
        contenu.videoSource = source.detect.videoSource;
        if (source.detect.duration > 0) contenu.duration = source.detect.duration;
        // Les sous-titres restent une option du lecteur/éditeur, pas un ajout implicite.
    }
    return contenu;
}
