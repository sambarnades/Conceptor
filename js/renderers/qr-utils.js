/**
 * @file Génération de QR codes (PNG data URL) pour les exports documentaires.
 * S'appuie sur la lib vendor `qrcode-generator` (MIT, global `window.qrcode`), chargée
 * paresseusement. Le rendu se fait sur un <canvas> pour produire un PNG net (compatible
 * docx.ImageRun, jsPDF.addImage et ODT draw:image), plutôt que le GIF de createDataURL().
 *
 * @module renderers/qr-utils
 */

import { loadQRCode } from '../core/lib-loader.js';
import { debugLog } from '../core/utils.js';

/**
 * Génère un QR code et le renvoie en PNG data URL.
 * @param {string} text - Texte/URL à encoder (l'URL de la vidéo source).
 * @param {Object} [opts]
 * @param {number} [opts.cellSize=6] - Taille d'un module en pixels (résolution du PNG).
 * @param {number} [opts.margin=4]   - Marge silencieuse en modules (quiet zone, ≥ 4 recommandé).
 * @param {string} [opts.dark='#000000']  - Couleur des modules.
 * @param {string} [opts.light='#ffffff'] - Couleur du fond.
 * @param {string} [opts.ecLevel='M'] - Niveau de correction d'erreur ('L','M','Q','H').
 * @returns {Promise<string|null>} PNG data URL, ou null si génération impossible.
 */
export async function generateQRDataURL(text, opts = {}) {
    const value = (text == null ? '' : String(text)).trim();
    if (!value) return null;

    const { cellSize = 6, margin = 4, dark = '#000000', light = '#ffffff', ecLevel = 'M' } = opts;

    try {
        await loadQRCode();
        const factory = window.qrcode;
        if (typeof factory !== 'function') throw new Error('lib qrcode indisponible');

        // Encodage des octets en UTF-8 (URLs éventuellement accentuées) ; les scanners
        // interprètent le mode « byte » en UTF-8. ASCII pur → identique au défaut.
        try {
            if (factory.stringToBytesFuncs && factory.stringToBytesFuncs['UTF-8']) {
                factory.stringToBytes = factory.stringToBytesFuncs['UTF-8'];
            }
        } catch { /* défaut conservé */ }

        // typeNumber 0 = choix automatique de la plus petite version qui contient les données.
        const qr = factory(0, ecLevel);
        qr.addData(value);
        qr.make();

        const count = qr.getModuleCount();
        const sizePx = (count + margin * 2) * cellSize;

        const canvas = document.createElement('canvas');
        canvas.width = sizePx;
        canvas.height = sizePx;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d indisponible');

        ctx.fillStyle = light;
        ctx.fillRect(0, 0, sizePx, sizePx);
        ctx.fillStyle = dark;
        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (qr.isDark(r, c)) {
                    ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
                }
            }
        }

        return canvas.toDataURL('image/png');
    } catch (error) {
        debugLog('qr-utils', 'génération QR échec', error);
        return null;
    }
}
