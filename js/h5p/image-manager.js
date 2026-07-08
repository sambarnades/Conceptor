/**
 * Gestionnaire d'images pour les activités H5P
 *
 * Module central gérant le cycle de vie complet des images utilisateur :
 * import, redimensionnement, compression, registre mémoire, nettoyage.
 * Tout est 100% client-side via Canvas API.
 *
 * @module h5p/image-manager
 */

import { debugLog } from '../core/utils.js';
import { generateUUID } from '../core/utils.js';

// =======================================================================
// CONFIGURATION
// =======================================================================

const IMAGE_CONFIG = {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
    maxFileSize: 5 * 1024 * 1024,  // 5 Mo
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    outputFormat: 'image/jpeg',
    outputExtension: 'jpg',
    pathPrefix: 'images/'
};

/**
 * Config dédiée à l'IMAGE DE FOND d'« Image interactive » (H5P.ImageHotspots).
 * Contrairement à processImage(), on PRÉSERVE le format (pas de JPEG forcé / fond blanc)
 * et on autorise une grande dimension (le fond est l'élément principal de l'activité).
 */
const BG_IMAGE_CONFIG = {
    maxDimension: 1920,             // borne la plus grande dimension (ratio préservé)
    maxFileSize: 12 * 1024 * 1024,  // 12 Mo
    // Informatif. La validation réelle ET la conversion des formats non décodables nativement se
    // font dans classifyImage()/ensureCanvasDecodable(). ENTRÉES acceptées : PNG, JPEG, WebP, GIF,
    // BMP, AVIF, SVG (canvas natif) + HEIC/HEIF, TIFF (conversion lazy). SORTIE embarquée dans le
    // .h5p : toujours PNG ou JPEG (WebP conservé si fourni) — formats lus de façon fiable par H5P.Image.
    acceptedInputs: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/avif', 'image/svg+xml', 'image/heic', 'image/heif', 'image/tiff'],
    jpegQuality: 0.9
};

// Extensions → MIME, pour inférer le format quand File.type est vide (fréquent pour un HEIC déposé,
// ou un fichier glissé depuis certains gestionnaires de fichiers).
const EXT_TO_MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif', svg: 'image/svg+xml',
    heic: 'image/heic', heif: 'image/heif', tif: 'image/tiff', tiff: 'image/tiff'
};

// =======================================================================
// REGISTRE INTERNE
// =======================================================================

/**
 * @typedef {Object} ImageEntry
 * @property {string} id - Identifiant unique (chemin dans le JSON, ex: "cards.0.image")
 * @property {string} h5pPath - Chemin dans le ZIP H5P (ex: "images/image-a1b2c3d4.jpg")
 * @property {Blob} blob - Blob compressé prêt pour le packaging
 * @property {string} dataURL - Data URL pour la prévisualisation
 * @property {number} width - Largeur en pixels (après redimensionnement)
 * @property {number} height - Hauteur en pixels (après redimensionnement)
 * @property {string} mime - Type MIME (ex: "image/jpeg")
 * @property {number} originalSize - Taille originale en octets
 * @property {number} compressedSize - Taille compressée en octets
 */

/** @type {Map<string, ImageEntry>} */
const imageRegistry = new Map();

/**
 * @typedef {Object} MediaEntry
 * @property {string} id - Identifiant unique (chemin dans le JSON, ex: "hotspots.0.content.1.audioFile")
 * @property {string} h5pPath - Chemin dans le ZIP H5P (ex: "audios/audio-a1b2c3d4.mp3")
 * @property {Blob} blob - Blob du média (embarqué tel quel, pas de transcodage)
 * @property {string} dataURL - URL blob: pour la prévisualisation (pas de base64 : fichiers lourds)
 * @property {string} mime - Type MIME (ex: "audio/mpeg", "video/mp4")
 * @property {'audio'|'video'} kind - Nature du média
 * @property {number} originalSize - Taille originale en octets
 * @property {number} compressedSize - Taille embarquée en octets (= originalSize, pas de transcodage)
 */

/**
 * Registre des médias AUDIO/VIDÉO embarqués (distinct d'imageRegistry pour ne pas polluer
 * getAllImages() / l'auto-dépendance H5P.Image des autres activités). Utilisé par l'éditeur
 * visuel d'« Image interactive » (H5P.ImageHotspots) pour l'ajout manuel de médias dans un point.
 * @type {Map<string, MediaEntry>}
 */
const mediaRegistry = new Map();

// MIME ↔ extension par nature de média. Le blob est embarqué TEL QUEL (pas de transcodage côté
// navigateur, trop coûteux) ; on se contente de valider et de nommer le fichier correctement.
const AUDIO_EXT_TO_MIME = {
    mp3: 'audio/mpeg', mpeg: 'audio/mpeg', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg',
    wav: 'audio/wav', wave: 'audio/wav', webm: 'audio/webm', m4a: 'audio/mp4', mp4: 'audio/mp4',
    aac: 'audio/aac', flac: 'audio/flac'
};
const AUDIO_MIME_TO_EXT = {
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
    'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/webm': 'webm', 'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/flac': 'flac'
};
const VIDEO_EXT_TO_MIME = {
    mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', ogg: 'video/ogg'
};
const VIDEO_MIME_TO_EXT = {
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv', 'video/quicktime': 'mp4', 'video/x-m4v': 'mp4'
};
const MEDIA_TABLES = {
    audio: { extToMime: AUDIO_EXT_TO_MIME, mimeToExt: AUDIO_MIME_TO_EXT, prefix: 'audios/', stem: 'audio', maxSize: 25 * 1024 * 1024, defExt: 'mp3', defMime: 'audio/mpeg' },
    video: { extToMime: VIDEO_EXT_TO_MIME, mimeToExt: VIDEO_MIME_TO_EXT, prefix: 'videos/', stem: 'video', maxSize: 80 * 1024 * 1024, defExt: 'mp4', defMime: 'video/mp4' }
};

// =======================================================================
// API PUBLIQUE
// =======================================================================

/**
 * Traite une image utilisateur : validation, redimensionnement, compression.
 * @param {File|Blob} file - Fichier image (depuis <input> ou drag & drop)
 * @param {Object} [options] - Options de traitement
 * @param {number} [options.maxWidth=800] - Largeur max en px
 * @param {number} [options.maxHeight=600] - Hauteur max en px
 * @param {number} [options.quality=0.85] - Qualité JPEG (0-1)
 * @returns {Promise<ImageEntry>} L'entrée image prête
 * @throws {Error} Si le fichier est invalide ou trop gros
 */
export async function processImage(file, options = {}) {
    const maxWidth = options.maxWidth || IMAGE_CONFIG.maxWidth;
    const maxHeight = options.maxHeight || IMAGE_CONFIG.maxHeight;
    const quality = options.quality || IMAGE_CONFIG.quality;

    // Validation du type
    const mime = file.type || 'image/jpeg';
    if (!IMAGE_CONFIG.acceptedTypes.includes(mime)) {
        throw new Error('FORMAT_INVALID');
    }

    // Validation de la taille
    if (file.size > IMAGE_CONFIG.maxFileSize) {
        throw new Error('SIZE_EXCEEDED');
    }

    const originalSize = file.size;
    debugLog('ImageManager', `Traitement image: ${mime}, ${(originalSize / 1024).toFixed(0)} Ko`);

    // Charger l'image pour obtenir les dimensions originales
    const imageBitmap = await loadImageFromBlob(file);

    // Calculer les dimensions redimensionnées (respect du ratio)
    const { width, height } = calculateResizedDimensions(
        imageBitmap.width, imageBitmap.height, maxWidth, maxHeight
    );

    // Redimensionner et compresser via Canvas
    const blob = await resizeImage(imageBitmap, width, height, quality);
    const compressedSize = blob.size;

    // Générer le chemin H5P unique
    const h5pPath = generateH5PPath();

    // Créer la data URL pour prévisualisation
    const dataURL = await blobToDataURL(blob);

    const entry = {
        id: '',  // Sera défini par registerImage()
        h5pPath,
        blob,
        dataURL,
        width,
        height,
        mime: IMAGE_CONFIG.outputFormat,
        originalSize,
        compressedSize
    };

    debugLog('ImageManager', `Image traitée: ${width}×${height}, ${(compressedSize / 1024).toFixed(0)} Ko (${Math.round(compressedSize / originalSize * 100)}%)`);

    return entry;
}

/**
 * Traite l'IMAGE DE FOND d'une activité « Image interactive » (H5P.ImageHotspots).
 * PRÉSERVE le format (PNG/JPEG/WebP ; GIF → PNG) et la transparence, borne seulement la
 * plus grande dimension à `maxDimension` (défaut 1920). À utiliser à la place de processImage()
 * pour le fond, qui ne doit PAS être bridé à 800×600 ni aplati en JPEG.
 *
 * @param {File|Blob} file - Fichier image de fond.
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1920] - Borne de la plus grande dimension.
 * @returns {Promise<ImageEntry>} L'entrée image prête (mime/extension préservés).
 * @throws {Error} 'FORMAT_INVALID' | 'SIZE_EXCEEDED'
 */
export async function processBackgroundImage(file, options = {}) {
    const maxDimension = options.maxDimension || BG_IMAGE_CONFIG.maxDimension;
    if (file.size > BG_IMAGE_CONFIG.maxFileSize) {
        throw new Error('SIZE_EXCEEDED');
    }

    // 1. Garantir un Blob décodable par le canvas : HEIC/HEIF/TIFF sont convertis (lib lazy) ;
    //    PNG/JPEG/WebP/GIF/BMP/AVIF/SVG passent tels quels. Lève FORMAT_INVALID si inconnu/illisible.
    const { blob: decodable, mime: inMime } = await ensureCanvasDecodable(file);

    // 2. Normaliser la SORTIE vers un format embarquable de façon fiable par H5P.Image (PNG/JPEG/WebP) ;
    //    tout autre format décodable (GIF/BMP/AVIF/SVG…) est ré-encodé en PNG (sans perte, alpha gardé).
    const EMBEDDABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const outMime = EMBEDDABLE.has(inMime) ? inMime : 'image/png';
    const ext = outMime === 'image/jpeg' ? 'jpg' : (outMime === 'image/webp' ? 'webp' : 'png');

    const originalSize = file.size;
    debugLog('ImageManager', `Fond: ${file.type || inMime || '?'} → ${outMime}, ${(originalSize / 1024).toFixed(0)} Ko`);

    let img;
    try {
        img = await loadImageFromBlob(decodable);
    } catch {
        throw new Error('FORMAT_INVALID');
    }
    // SVG sans dimensions intrinsèques (ou décodage partiel) → pas de pixels exploitables.
    if (!img.width || !img.height) throw new Error('FORMAT_INVALID');

    const { width, height } = calculateResizedDimensions(img.width, img.height, maxDimension, maxDimension);
    const blob = await rasterizeImage(img, width, height, outMime, BG_IMAGE_CONFIG.jpegQuality);
    const h5pPath = `${IMAGE_CONFIG.pathPrefix}image-${generateUUID().replace(/-/g, '').substring(0, 8)}.${ext}`;
    const dataURL = await blobToDataURL(blob);

    debugLog('ImageManager', `Fond traité: ${width}×${height} ${outMime}, ${(blob.size / 1024).toFixed(0)} Ko`);

    return {
        id: '', h5pPath, blob, dataURL,
        width, height, mime: outMime,
        originalSize, compressedSize: blob.size
    };
}

/**
 * Classe un fichier image selon son type MIME (avec repli sur l'extension si `File.type` est vide).
 * @param {File|Blob} file
 * @returns {{ kind: 'native'|'heic'|'tiff'|'unknown', mime: string }}
 *   - native : décodable directement par le canvas (PNG/JPEG/WebP/GIF/BMP/AVIF/SVG)
 *   - heic / tiff : nécessite une conversion préalable (lib lazy)
 *   - unknown : non géré
 */
function classifyImage(file) {
    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
    const effMime = mime || EXT_TO_MIME[ext] || '';
    if (effMime === 'image/heic' || effMime === 'image/heif') return { kind: 'heic', mime: effMime };
    if (effMime === 'image/tiff') return { kind: 'tiff', mime: effMime };
    if (effMime.startsWith('image/')) return { kind: 'native', mime: effMime };
    return { kind: 'unknown', mime: effMime };
}

/**
 * Garantit que le fichier est décodable par le canvas. Les formats non décodables nativement par les
 * navigateurs (HEIC/HEIF des iPhone, TIFF) sont convertis EN AMONT, de façon transparente, via une
 * bibliothèque chargée à la demande (heic2any / UTIF). Les autres formats sont renvoyés tels quels.
 * @param {File|Blob} file
 * @returns {Promise<{ blob: Blob, mime: string }>} Blob décodable + son MIME effectif.
 * @throws {Error} 'FORMAT_INVALID' si le format est inconnu ou si la conversion échoue.
 */
async function ensureCanvasDecodable(file) {
    const { kind, mime } = classifyImage(file);

    if (kind === 'native') {
        return { blob: file, mime };
    }

    if (kind === 'heic') {
        try {
            const { loadHeic2any } = await import('../core/lib-loader.js');
            await loadHeic2any();
            // HEIC sont des photos → JPEG (plus léger que PNG, pas d'alpha à préserver).
            const out = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
            const blob = Array.isArray(out) ? out[0] : out;   // HEIC multi-images (live photo) → 1ʳᵉ
            if (!blob) throw new Error('HEIC_EMPTY');
            return { blob, mime: 'image/jpeg' };
        } catch (e) {
            debugLog('ImageManager', 'Conversion HEIC/HEIF échouée', e);
            throw new Error('FORMAT_INVALID');
        }
    }

    if (kind === 'tiff') {
        try {
            const { loadUTIF } = await import('../core/lib-loader.js');
            await loadUTIF();
            const buf = await file.arrayBuffer();
            const ifds = window.UTIF.decode(buf);
            if (!ifds || !ifds.length) throw new Error('TIFF_EMPTY');
            window.UTIF.decodeImage(buf, ifds[0]);
            const rgba = window.UTIF.toRGBA8(ifds[0]);          // deflate géré via pako (chargée par loadUTIF)
            const w = ifds[0].width, h = ifds[0].height;
            if (!w || !h || !rgba || !rgba.length) throw new Error('TIFF_EMPTY');
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('CANVAS_FAILED');
            const imgData = ctx.createImageData(w, h);
            imgData.data.set(rgba);
            ctx.putImageData(imgData, 0, 0);
            const blob = await new Promise((resolve, reject) =>
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('CANVAS_FAILED'))), 'image/png'));
            return { blob, mime: 'image/png' };
        } catch (e) {
            debugLog('ImageManager', 'Conversion TIFF échouée', e);
            throw new Error('FORMAT_INVALID');
        }
    }

    throw new Error('FORMAT_INVALID');
}

/**
 * Construit l'objet `image` (fond) du content.json H5P.ImageHotspots à partir d'une entrée.
 * @param {ImageEntry} entry
 * @returns {{path:string,mime:string,copyright:Object,width:number,height:number}|null}
 */
export function buildBackgroundImageField(entry) {
    if (!entry || !entry.h5pPath) return null;
    return {
        path: entry.h5pPath,
        mime: entry.mime || 'image/png',
        copyright: { license: 'U' },
        width: entry.width || 0,
        height: entry.height || 0
    };
}

/**
 * Enregistre une image dans le registre.
 * @param {string} id - Identifiant (chemin JSON, ex: "cards.0.image")
 * @param {ImageEntry} entry - Entrée image retournée par processImage()
 */
export function registerImage(id, entry) {
    // Si une image existait déjà pour cet id, la nettoyer
    if (imageRegistry.has(id)) {
        const old = imageRegistry.get(id);
        if (old.dataURL && old.dataURL.startsWith('blob:')) {
            URL.revokeObjectURL(old.dataURL);
        }
    }
    entry.id = id;
    imageRegistry.set(id, entry);
    debugLog('ImageManager', `Image enregistrée: ${id} → ${entry.h5pPath}`);
}

/**
 * Supprime une image du registre et libère la mémoire.
 * @param {string} id - Identifiant de l'image
 */
export function unregisterImage(id) {
    const entry = imageRegistry.get(id);
    if (entry) {
        if (entry.dataURL && entry.dataURL.startsWith('blob:')) {
            URL.revokeObjectURL(entry.dataURL);
        }
        imageRegistry.delete(id);
        debugLog('ImageManager', `Image supprimée: ${id}`);
    }
}

/**
 * Récupère une image du registre.
 * @param {string} id - Identifiant
 * @returns {ImageEntry|undefined}
 */
export function getImage(id) {
    return imageRegistry.get(id);
}

/**
 * Retourne toutes les images pour le packaging ZIP.
 * @returns {Map<string, Blob>} Map h5pPath → Blob
 */
export function getAllImages() {
    const result = new Map();
    for (const entry of imageRegistry.values()) {
        result.set(entry.h5pPath, entry.blob);
    }
    return result;
}

/**
 * Vide les registres complets (images ET médias audio/vidéo) et révoque toutes les URLs.
 * Appelée après chaque packaging : les médias embarqués (audio/vidéo) suivent le même cycle
 * de vie que les images.
 */
export function clearAllImages() {
    for (const entry of imageRegistry.values()) {
        if (entry.dataURL && entry.dataURL.startsWith('blob:')) {
            URL.revokeObjectURL(entry.dataURL);
        }
    }
    imageRegistry.clear();
    for (const entry of mediaRegistry.values()) {
        if (entry.dataURL && entry.dataURL.startsWith('blob:')) {
            URL.revokeObjectURL(entry.dataURL);
        }
    }
    mediaRegistry.clear();
    debugLog('ImageManager', 'Registres (images + médias) vidés');
}

/**
 * @returns {boolean} true si au moins une image est enregistrée
 */
export function hasImages() {
    return imageRegistry.size > 0;
}

/**
 * @returns {number} Nombre d'images dans le registre
 */
export function getImageCount() {
    return imageRegistry.size;
}

/**
 * Construit la structure media H5P standard à partir d'une image.
 * Utilisé par MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords.
 * @param {Object|null} imageData - Données image { path, mime, width, height } ou null
 * @param {string} [altText=''] - Texte alternatif
 * @returns {Object} Structure media H5P
 */
export function buildMediaStructure(imageData, altText = '') {
    if (!imageData || !imageData.path) {
        return { disableImageZooming: false };
    }

    return {
        type: {
            library: "H5P.Image 1.1",
            params: {
                file: {
                    path: imageData.path,
                    mime: imageData.mime || "image/jpeg",
                    width: imageData.width || 0,
                    height: imageData.height || 0
                },
                alt: altText || "",
                decorative: false
            },
            subContentId: generateUUID(),
            metadata: {
                contentType: "Image",
                license: "U",
                title: "Untitled Image"
            }
        },
        disableImageZooming: false
    };
}

// =======================================================================
// MÉDIAS EMBARQUÉS (AUDIO / VIDÉO) — H5P.ImageHotspots
// =======================================================================

/**
 * Traite un fichier audio/vidéo en vue de l'embarquer dans le .h5p. PAS de transcodage
 * (trop coûteux côté navigateur) : on valide le type/la taille, on génère un chemin H5P et on
 * conserve le blob tel quel. La preview utilise une URL blob:.
 * @param {File|Blob} file
 * @param {'audio'|'video'} kind
 * @returns {Promise<MediaEntry>}
 * @throws {Error} 'FORMAT_INVALID' | 'SIZE_EXCEEDED'
 */
async function processMediaFile(file, kind) {
    const t = MEDIA_TABLES[kind];
    if (!t) throw new Error('FORMAT_INVALID');

    const name = (file.name || '').toLowerCase();
    const ext0 = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
    // MIME effectif : on fait confiance à File.type s'il est cohérent, sinon repli sur l'extension
    // (File.type est souvent vide pour un fichier glissé ou issu de certains gestionnaires).
    let mime = (file.type || '').toLowerCase();
    if (!mime.startsWith(kind + '/')) {
        mime = t.extToMime[ext0] || '';
    }
    if (!mime) throw new Error('FORMAT_INVALID');
    if (file.size > t.maxSize) throw new Error('SIZE_EXCEEDED');

    const ext = t.mimeToExt[mime] || (t.extToMime[ext0] ? ext0 : t.defExt);
    // MIME de SORTIE canonique : on l'aligne sur l'extension résolue (ex. video/quicktime → video/mp4,
    // audio/x-m4a → audio/mp4, audio/x-wav → audio/wav) pour que H5P.Audio/Video le lise (canPlayType
    // rejette souvent les MIME exotiques) en preview ET sur Éléa/Lumi. Le chemin .ext et le mime concordent.
    const outMime = t.extToMime[ext] || mime;
    const hash = generateUUID().replace(/-/g, '').substring(0, 8);
    const h5pPath = `${t.prefix}${t.stem}-${hash}.${ext}`;
    const dataURL = URL.createObjectURL(file);

    debugLog('ImageManager', `Média ${kind}: ${file.type || mime} → ${outMime}, ${(file.size / 1024).toFixed(0)} Ko → ${h5pPath}`);

    return {
        id: '', h5pPath, blob: file, dataURL, mime: outMime, kind,
        originalSize: file.size, compressedSize: file.size
    };
}

/**
 * Traite un fichier audio (mp3/ogg/wav/webm/m4a…) → MediaEntry embarquable.
 * @param {File|Blob} file
 * @returns {Promise<MediaEntry>}
 */
export function processAudioFile(file) {
    return processMediaFile(file, 'audio');
}

/**
 * Traite un fichier vidéo (mp4/webm/ogv…) → MediaEntry embarquable.
 * @param {File|Blob} file
 * @returns {Promise<MediaEntry>}
 */
export function processVideoFile(file) {
    return processMediaFile(file, 'video');
}

/**
 * Enregistre un média (audio/vidéo) dans le registre média.
 * @param {string} id - Identifiant (chemin JSON)
 * @param {MediaEntry} entry
 */
export function registerMedia(id, entry) {
    if (mediaRegistry.has(id)) {
        const old = mediaRegistry.get(id);
        if (old.dataURL && old.dataURL.startsWith('blob:')) URL.revokeObjectURL(old.dataURL);
    }
    entry.id = id;
    mediaRegistry.set(id, entry);
    debugLog('ImageManager', `Média enregistré: ${id} → ${entry.h5pPath}`);
}

/**
 * Supprime un média du registre et libère la mémoire.
 * @param {string} id
 */
export function unregisterMedia(id) {
    const entry = mediaRegistry.get(id);
    if (entry) {
        if (entry.dataURL && entry.dataURL.startsWith('blob:')) URL.revokeObjectURL(entry.dataURL);
        mediaRegistry.delete(id);
        debugLog('ImageManager', `Média supprimé: ${id}`);
    }
}

/**
 * @param {string} id
 * @returns {MediaEntry|undefined}
 */
export function getMedia(id) {
    return mediaRegistry.get(id);
}

/**
 * Retourne TOUS les fichiers à embarquer dans le .h5p (images + audio + vidéo), pour le packaging.
 * Les chemins (`images/…`, `audios/…`, `videos/…`) déterminent le sous-dossier d'écriture.
 * @returns {Map<string, Blob>} Map h5pPath → Blob
 */
export function getAllMedia() {
    const result = new Map();
    for (const entry of imageRegistry.values()) result.set(entry.h5pPath, entry.blob);
    for (const entry of mediaRegistry.values()) result.set(entry.h5pPath, entry.blob);
    return result;
}

/**
 * @returns {boolean} true si au moins un média (image, audio ou vidéo) est enregistré.
 */
export function hasMedia() {
    return imageRegistry.size > 0 || mediaRegistry.size > 0;
}

// =======================================================================
// FONCTIONS INTERNES
// =======================================================================

/**
 * Charge une image depuis un Blob.
 * @param {Blob} blob
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('LOAD_FAILED'));
        };
        img.src = url;
    });
}

/**
 * Calcule les dimensions redimensionnées en respectant le ratio.
 * @param {number} origW - Largeur originale
 * @param {number} origH - Hauteur originale
 * @param {number} maxW - Largeur max
 * @param {number} maxH - Hauteur max
 * @returns {{ width: number, height: number }}
 */
function calculateResizedDimensions(origW, origH, maxW, maxH) {
    if (origW <= maxW && origH <= maxH) {
        return { width: origW, height: origH };
    }

    const ratioW = maxW / origW;
    const ratioH = maxH / origH;
    const ratio = Math.min(ratioW, ratioH);

    return {
        width: Math.round(origW * ratio),
        height: Math.round(origH * ratio)
    };
}

/**
 * Redimensionne une image via Canvas et l'exporte en JPEG.
 * @param {HTMLImageElement} img - Image source
 * @param {number} width - Largeur cible
 * @param {number} height - Hauteur cible
 * @param {number} quality - Qualité JPEG (0-1)
 * @returns {Promise<Blob>}
 */
function resizeImage(img, width, height, quality) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('CANVAS_FAILED'));
            return;
        }

        // Fond blanc (pour les PNG/WebP avec transparence → JPEG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('CANVAS_FAILED'));
                }
            },
            IMAGE_CONFIG.outputFormat,
            quality
        );
    });
}

/**
 * Redimensionne une image en PRÉSERVANT son format (PNG/WebP gardent la transparence ;
 * seul le JPEG reçoit un fond blanc car il n'a pas d'alpha). Utilisé pour l'image de fond.
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 * @param {string} mime - 'image/png' | 'image/jpeg' | 'image/webp'
 * @param {number} quality - Qualité pour JPEG/WebP (0-1)
 * @returns {Promise<Blob>}
 */
function rasterizeImage(img, width, height, mime, quality) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('CANVAS_FAILED'));
            return;
        }
        // Le JPEG n'a pas de canal alpha → fond blanc pour éviter le noir sur transparence.
        if (mime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('CANVAS_FAILED'))),
            mime,
            mime === 'image/png' ? undefined : quality
        );
    });
}

/**
 * Génère un chemin unique pour l'image dans le ZIP H5P.
 * @returns {string} Ex: "images/image-a1b2c3d4.jpg"
 */
function generateH5PPath() {
    const hash = generateUUID().replace(/-/g, '').substring(0, 8);
    return `${IMAGE_CONFIG.pathPrefix}image-${hash}.${IMAGE_CONFIG.outputExtension}`;
}

/**
 * Convertit un Blob en data URL.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('READ_FAILED'));
        reader.readAsDataURL(blob);
    });
}
