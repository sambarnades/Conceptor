/**
 * @file Rendu « pastilles numérotées » + helpers d'export pour l'« Image interactive ».
 * Aucun format bureautique (DOCX/ODT/PDF) ne sait peindre des numéros PAR-DESSUS une image. La
 * seule voie fiable (déjà éprouvée pour le QR de la Vidéo interactive) est de **pré-composer un PNG**
 * au `<canvas>` : image de fond + pastilles numérotées aux positions des points, puis l'insérer
 * comme une image normale + une légende numérotée à côté. Ce module fournit aussi l'extraction de
 * l'image de fond depuis le `.h5p` (le registre mémoire étant vidé après packaging).
 * @module renderers/hotspot-overlay-renderer
 */

// Borne la plus grande dimension du PNG composé (poids du fichier dans le document).
const MAX_DIM = 1400;
const DEFAULT_COLOR = '#981d99';

/**
 * Compose l'image de fond + des pastilles numérotées (1..N) aux positions (x%,y%) des points.
 * @param {string} bgSrc - Image de fond : data URL (cas normal) ou toute URL chargeable par <img>.
 * @param {Array<{x:number,y:number,n:number}>} positions - Points : x,y en POURCENTAGES 0–100 ;
 *   `n` = numéro affiché dans la pastille.
 * @param {{color?:string}} [opts] - `color` : couleur de remplissage des pastilles (défaut #981d99).
 * @returns {Promise<string|null>} data URL PNG composée, ou `null` si le fond est introuvable/illisible
 *   (l'appelant retombe alors sur une légende sans image).
 */
export async function composeNumberedHotspotImage(bgSrc, positions, opts = {}) {
    if (!bgSrc) return null;
    const color = opts.color || DEFAULT_COLOR;

    let img;
    try {
        img = await loadImage(bgSrc);
    } catch {
        return null;
    }
    if (!img.width || !img.height) return null;

    // Mise à l'échelle (ratio préservé) sous la borne MAX_DIM.
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);

    // Pastilles proportionnelles à la taille (lisibles sans masquer le fond).
    const r = Math.max(12, Math.round(Math.min(w, h) * 0.025));
    const ring = Math.max(2, Math.round(r * 0.18));
    const textColor = readableTextColor(color);
    ctx.font = `bold ${Math.round(r * 1.2)}px Arial, "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    (Array.isArray(positions) ? positions : []).forEach((p) => {
        const cx = clampPct(p.x) / 100 * w;
        const cy = clampPct(p.y) / 100 * h;
        // Disque coloré + cerclage blanc (contraste sur n'importe quel fond).
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = ring;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        // Numéro centré.
        ctx.fillStyle = textColor;
        ctx.fillText(String(p.n), cx, cy + Math.round(r * 0.06));
    });

    try {
        return canvas.toDataURL('image/png');
    } catch {
        return null; // canvas « taché » (ne devrait pas arriver avec une data URL same-origin)
    }
}

/**
 * Localise l'objet image de fond {path, mime} dans le JSON d'une activité à image de fond,
 * quelle que soit sa forme : plate (`image`, Image interactive / formats intermédiaires),
 * complète Find the Hotspot (`imageHotspotQuestion.backgroundImageSettings`, aplatie) ou
 * complète Find Multiple Hotspots (`imageMultipleHotspotQuestion.backgroundImageSettings.backgroundImage`).
 * @param {Object} jsonData
 * @returns {{path:string, mime?:string}|null}
 */
function findBackgroundImageField(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') return null;
    const candidates = [
        jsonData.image,
        jsonData.imageHotspotQuestion?.backgroundImageSettings,
        jsonData.imageHotspotQuestion?.backgroundImageSettings?.backgroundImage,
        jsonData.imageMultipleHotspotQuestion?.backgroundImageSettings?.backgroundImage
    ];
    for (const c of candidates) {
        if (c && typeof c === 'object' && typeof c.path === 'string' && c.path) return c;
    }
    return null;
}

/**
 * Ré-extrait l'image de fond embarquée dans un `.h5p` à image de fond (Image interactive,
 * Find the Hotspot, Find Multiple Hotspots) et la renvoie en data URL.
 * Nécessaire à l'export documentaire : le registre mémoire (`image-manager`) est vidé après le
 * packaging, donc on relit le fond directement depuis l'archive. Renvoie `null` si introuvable
 * (l'export retombe alors sur une légende sans image).
 * @param {Blob} h5pBlob - L'archive `.h5p`.
 * @param {Object} jsonData - Le JSON de l'activité (porte le chemin/mime du fond, toute forme).
 * @returns {Promise<string|null>} data URL de l'image de fond, ou null.
 */
export async function extractBackgroundFromH5p(h5pBlob, jsonData) {
    try {
        const imgField = findBackgroundImageField(jsonData);
        if (!h5pBlob || !imgField) return null;
        const { loadJSZip } = await import('../core/lib-loader.js');
        await loadJSZip();
        const zip = await window.JSZip.loadAsync(h5pBlob);
        const file = zip.file(`content/${imgField.path}`);
        if (!file) return null;
        const b64 = await file.async('base64');
        const mime = imgField.mime || 'image/png';
        return `data:${mime};base64,${b64}`;
    } catch {
        return null;
    }
}

/** Borne une valeur en pourcentage dans [0, 100] (défaut 50 si non finie). */
function clampPct(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
}

/** Choisit noir ou blanc pour le numéro selon la luminance de la couleur de pastille. */
function readableTextColor(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#ffffff';
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? '#000000' : '#ffffff';
}

/** Charge une image depuis une URL/data URL. */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('IMG_LOAD_FAILED'));
        im.src = src;
    });
}
