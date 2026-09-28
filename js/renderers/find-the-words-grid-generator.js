/**
 * @file Generateur de grille de mots meles a partir des donnees JSON (sans rendu H5P).
 *
 * Place les mots sur une grille 2D dans differentes orientations,
 * remplit les cases vides avec des lettres aleatoires,
 * puis dessine la grille vide et la grille corrigee sur des canvas offscreen.
 *
 * Ce module est utilise quand le H5P n'est pas disponible (modale de resultat de generation).
 * Le module find-the-words-grid-capture.js reste utilise quand le H5P est rendu (modale de previsualisation).
 */

// ===================== Constantes de rendu + orientations (partagees : grid-canvas-utils.js) =====================

import {
    FTW_CELL_SIZE as CELL_SIZE,
    FTW_GRID_PADDING as GRID_PADDING,
    FTW_FONT_SIZE_RATIO as FONT_SIZE_RATIO,
    FTW_EXPORT_SCALE as EXPORT_SCALE,
    FTW_BG_COLOR as BG_COLOR,
    FTW_GRID_LINE_COLOR as GRID_LINE_COLOR,
    FTW_LETTER_COLOR as LETTER_COLOR,
    orientationFns,
    checkOrientations,
    drawWordHighlight,
    canvasToBlob
} from './grid-canvas-utils.js';

// Orientations utilisees pour le placement (memes que H5P par defaut)
const DEFAULT_ORIENTATIONS = [
    'horizontal', 'horizontalBack',
    'vertical', 'verticalUp',
    'diagonal', 'diagonalBack',
    'diagonalUp', 'diagonalUpBack'
];

const FILL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ===================== Normalisation =====================

/**
 * Normalise un mot pour le placement (majuscules, accents conservés, sans espaces/tirets).
 */
function normalizeWord(word) {
    return word
        .toUpperCase()
        .normalize('NFC')
        .replace(/[\s\-']/g, '');
}

// ===================== Algorithme de placement =====================

/**
 * Genere une grille de mots meles a partir d'une liste de mots.
 * @param {string[]} words - Mots à placer
 * @param {object} behaviour - Alphabet, orientations et préférence de chevauchement
 * @param {Function} random - Source aléatoire injectable pour rejouer une disposition
 * @returns {{ wordGrid: string[][], wordLocations: Array, height: number, width: number } | null}
 */
export function generateFindTheWordsGrid(words, behaviour = {}, random = Math.random) {
    if (!Array.isArray(words) || !words.length) return null;
    const sorted = [...new Set(words.map(normalizeWord).filter(Boolean))].sort((a, b) => b.length - a.length);
    // Même ordre de grandeur que les limites d'import Caramel ; aucune liste
    // partiellement placée ne doit être présentée comme une grille complète.
    if (!sorted.length || sorted.length > 50 || sorted.some(word => word.length > 30)) return null;
    const orientations = DEFAULT_ORIENTATIONS.filter(key => behaviour.orientations?.[key] !== false);
    const pool = Array.from(String(behaviour.fillPool ?? FILL_LETTERS).normalize('NFC').toUpperCase());
    if (!orientations.length || !pool.length || !pool.some(letter => letter.trim())) return null;
    const preferOverlap = behaviour.preferOverlap !== false;
    const initialSize = Math.max(sorted[0].length + 2, Math.ceil(Math.sqrt(sorted.join('').length * 2.5)), 10);
    const maxSize = Math.max(initialSize, sorted.length + sorted[0].length + 2);
    for (let size = initialSize; size <= maxSize; size = Math.min(maxSize, size + 5)) {
        const grid = Array.from({ length: size }, () => Array(size).fill(null));
        const wordLocations = [];
        for (const word of sorted) {
            const placed = placeWord(grid, word, orientations, preferOverlap, random);
            if (!placed) break;
            wordLocations.push(placed);
        }
        if (wordLocations.length === sorted.length) {
            for (const row of grid) {
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === null) row[x] = pool[Math.floor(random() * pool.length)];
                }
            }
            return { wordGrid: grid, wordLocations, height: size, width: size };
        }
        if (size === maxSize) break;
    }
    return null;
}

/** Choisir parmi tous les placements valides, ou seulement le chevauchement maximal. */
function placeWord(grid, word, orientations, preferOverlap, random) {
    let positions = [];
    let maxOverlap = -1;
    const height = grid.length, width = grid[0].length;
    for (const orientation of orientations) {
        const check = checkOrientations[orientation], next = orientationFns[orientation];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!check(x, y, height, width, word.length)) continue;
                const overlap = countOverlap(grid, word, x, y, next);
                if (overlap < 0 || (preferOverlap && overlap < maxOverlap)) continue;
                if (preferOverlap && overlap > maxOverlap) positions = [];
                maxOverlap = Math.max(maxOverlap, overlap);
                positions.push({ x, y, orientation, word, overlap });
            }
        }
    }
    if (!positions.length) return null;
    const position = positions[Math.floor(random() * positions.length)];
    for (let i = 0; i < word.length; i++) {
        const p = orientationFns[position.orientation](position.x, position.y, i);
        grid[p.y][p.x] = word[i];
    }
    return position;
}

/** Nombre de lettres communes, ou -1 si une lettre est incompatible. */
function countOverlap(grid, word, x, y, next) {
    let overlap = 0;
    for (let i = 0; i < word.length; i++) {
        const p = next(x, y, i), existing = grid[p.y][p.x];
        if (existing === word[i]) overlap++;
        else if (existing !== null) return -1;
    }
    return overlap;
}

// ===================== Rendu Canvas =====================

/**
 * Dessine la grille sur un canvas offscreen et exporte en PNG + Blob.
 * Copie du rendu de find-the-words-grid-capture.js pour un visuel identique.
 */
async function renderAndExport(wordGrid, wordLocations) {
    const rows = wordGrid.length;
    const cols = wordGrid[0].length;

    const canvasW = cols * CELL_SIZE + GRID_PADDING * 2;
    const canvasH = rows * CELL_SIZE + GRID_PADDING * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW * EXPORT_SCALE;
    canvas.height = canvasH * EXPORT_SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

    // Fond blanc
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Quadrillage
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
        const y = GRID_PADDING + r * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(GRID_PADDING, y);
        ctx.lineTo(GRID_PADDING + cols * CELL_SIZE, y);
        ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
        const x = GRID_PADDING + c * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, GRID_PADDING);
        ctx.lineTo(x, GRID_PADDING + rows * CELL_SIZE);
        ctx.stroke();
    }

    // Surlignages des mots (avant les lettres)
    if (wordLocations && wordLocations.length > 0) {
        wordLocations.forEach(loc => {
            drawWordHighlight(ctx, loc, CELL_SIZE, GRID_PADDING);
        });
    }

    // Lettres
    const fontSize = Math.round(CELL_SIZE * FONT_SIZE_RATIO);
    ctx.fillStyle = LETTER_COLOR;
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const letter = wordGrid[r][c];
            if (letter) {
                const cx = GRID_PADDING + c * CELL_SIZE + CELL_SIZE / 2;
                const cy = GRID_PADDING + r * CELL_SIZE + CELL_SIZE / 2;
                ctx.fillText(letter.toUpperCase(), cx, cy);
            }
        }
    }

    // Export
    const dataURL = canvas.toDataURL('image/png');
    const blob = await canvasToBlob(canvas);

    return {
        dataURL,
        blob,
        width: canvasW,
        height: canvasH,
        mimeType: 'image/png'
    };
}

// ===================== API publique =====================

/**
 * Genere les images de grille (vide + corrigee) directement a partir des donnees JSON.
 * Ne necessite aucun rendu H5P.
 *
 * @param {string} wordList - Liste de mots separee par des virgules (ex: "BASTILLE,NATION,CITOYEN")
 * @param {object} behaviour - Options natives de la grille
 * @returns {Promise<{emptyGrid: Object|null, solutionGrid: Object|null, grid?: Object}>}
 */
export async function generateFindTheWordsGridImages(wordList, behaviour = {}) {
    const result = { emptyGrid: null, solutionGrid: null };

    try {
        if (!wordList || typeof wordList !== 'string') {
            console.warn('[FindTheWordsGenerator] wordList invalide');
            return result;
        }

        // Parser et normaliser les mots
        const words = wordList.split(',')
            .map(w => normalizeWord(w.trim()))
            .filter(w => w.length > 0);

        if (words.length === 0) {
            console.warn('[FindTheWordsGenerator] Aucun mot valide');
            return result;
        }

        // Generer la grille
        const gridResult = generateFindTheWordsGrid(words, behaviour);
        if (!gridResult) {
            console.warn('[FindTheWordsGenerator] Generation de grille impossible');
            return result;
        }

        result.grid = gridResult;

        // Grille vide (lettres sans surlignage)
        result.emptyGrid = await renderAndExport(gridResult.wordGrid, null);

        // Grille corrigee (avec surlignage des mots)
        result.solutionGrid = await renderAndExport(gridResult.wordGrid, gridResult.wordLocations);

    } catch (error) {
        console.error('[FindTheWordsGenerator] Erreur:', error);
    }

    return result;
}
