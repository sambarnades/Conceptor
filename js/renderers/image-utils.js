/**
 * @file Utilitaires pour le traitement des images dans les exports de documents.
 * Ce module gère le téléchargement, la conversion et le dimensionnement des images.
 */

import { debugLog } from '../core/utils.js';

// Constantes
const DEFAULT_TIMEOUT = 10000; // 10 secondes
export const DOCX_FIXED_HEIGHT = 150; // mm
export const PDF_FIXED_HEIGHT = 80; // mm
export const ODT_FIXED_HEIGHT = 100; // mm
export const MAX_WIDTH_DOCX = 160; // mm
export const MAX_WIDTH_PDF = 170; // mm
export const MAX_WIDTH_ODT = 165; // mm
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Télécharge une image depuis une URL et la convertit en data URL base64
 * @param {string} url - URL de l'image à télécharger
 * @param {Object} options - Options de téléchargement
 * @param {number} options.timeout - Timeout en millisecondes (défaut: 10000)
 * @returns {Promise<Object>} - { dataURL, width, height, mimeType, blob }
 */
export async function fetchImageAsDataURL(url, options = {}) {
    // Valider l'URL avant tout fetch : seuls http(s) sont autorisés.
    // Le rejet est intercepté par l'appelant (document-exporter) qui ignore l'image.
    if (!validateImageUrl(url)) {
        debugLog('ImageUtils', `URL d'image invalide ou non supportée, image ignorée : ${url}`);
        throw new Error(`Invalid or unsupported image URL: ${url}`);
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;

    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        // Tenter de fetch avec CORS
        const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors',
            cache: 'default'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Vérifier la taille
        if (blob.size > MAX_IMAGE_SIZE) {
            throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
        }

        // Convertir en data URL
        const dataURL = await blobToDataURL(blob);

        // Charger les dimensions
        const dimensions = await loadImageDimensions(dataURL);

        return {
            dataURL,
            width: dimensions.width,
            height: dimensions.height,
            mimeType: blob.type || 'image/jpeg',
            blob
        };

    } catch (error) {
        clearTimeout(timeoutId);

        // Si CORS a échoué, essayer en mode no-cors (limité, mais peut fonctionner)
        if (error.name === 'TypeError' && error.message.includes('CORS')) {
            console.warn('CORS error, trying no-cors mode (limited functionality)');
            throw new Error('CORS blocked: cannot access image from this domain');
        }

        // Autres erreurs
        if (error.name === 'AbortError') {
            throw new Error(`Image loading timeout after ${timeout}ms`);
        }

        throw error;
    }
}

/**
 * Calcule les dimensions d'une image en maintenant le ratio
 * @param {number} originalWidth - Largeur originale en pixels
 * @param {number} originalHeight - Hauteur originale en pixels
 * @param {number} fixedHeight - Hauteur fixe désirée en mm
 * @param {number} maxWidth - Largeur maximum en mm
 * @returns {Object} - { width, height } en mm
 */
export function calculateDimensions(originalWidth, originalHeight, fixedHeight, maxWidth) {
    if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
        // Dimensions par défaut si invalides
        return { width: 100, height: 100 };
    }

    // Calculer le ratio
    const aspectRatio = originalWidth / originalHeight;

    // Calculer la largeur proportionnelle avec la hauteur fixe
    let width = fixedHeight * aspectRatio;
    let height = fixedHeight;

    // Si la largeur dépasse le maximum, recalculer avec largeur fixe
    if (width > maxWidth) {
        width = maxWidth;
        height = maxWidth / aspectRatio;
    }

    return {
        width: Math.round(width * 100) / 100,  // Arrondir à 2 décimales
        height: Math.round(height * 100) / 100
    };
}

/**
 * Valide une URL d'image
 * @param {string} url - URL à valider
 * @returns {boolean} - true si l'URL est valide
 */
export function validateImageUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);
        // Accepter uniquement http et https
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

/**
 * Charge les dimensions d'une image depuis un data URL
 * @param {string} dataURL - Data URL de l'image
 * @returns {Promise<Object>} - { width, height } en pixels
 */
async function loadImageDimensions(dataURL) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image dimensions'));
        };

        img.src = dataURL;
    });
}

/**
 * Convertit un Blob en data URL
 * @param {Blob} blob - Blob à convertir
 * @returns {Promise<string>} - Data URL
 */
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(new Error('Failed to convert blob to data URL'));
        };

        reader.readAsDataURL(blob);
    });
}

/**
 * Convertit un data URL base64 en ArrayBuffer
 * @param {string} dataURL - Data URL à convertir
 * @returns {ArrayBuffer} - ArrayBuffer des données de l'image
 */
export function base64ToArrayBuffer(dataURL) {
    // Extraire la partie base64 après la virgule
    const base64 = dataURL.split(',')[1];

    if (!base64) {
        throw new Error('Invalid data URL format');
    }

    // Décoder base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}
