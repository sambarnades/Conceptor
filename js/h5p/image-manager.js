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
 * Vide le registre complet et révoque toutes les URLs.
 */
export function clearAllImages() {
    for (const entry of imageRegistry.values()) {
        if (entry.dataURL && entry.dataURL.startsWith('blob:')) {
            URL.revokeObjectURL(entry.dataURL);
        }
    }
    imageRegistry.clear();
    debugLog('ImageManager', 'Registre vidé');
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
