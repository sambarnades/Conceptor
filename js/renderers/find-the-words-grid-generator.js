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
 * Normalise un mot pour le placement (majuscules, sans accents, sans espaces/tirets).
 */
function normalizeWord(word) {
    return word
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s\-']/g, '');
}

// ===================== Algorithme de placement =====================

/**
 * Genere une grille de mots meles a partir d'une liste de mots.
 * @param {string[]} words - Mots normalises a placer
 * @returns {{ wordGrid: string[][], wordLocations: Array, height: number, width: number } | null}
 */
function generateGrid(words) {
    if (!words || words.length === 0) return null;

    // Trier par longueur decroissante pour placer les plus longs d'abord
    const sorted = [...words].sort((a, b) => b.length - a.length);
    const longestWord = sorted[0].length;

    // Dimensionner la grille : au moins longestWord, avec marge pour les mots croises
    const gridSize = Math.max(longestWord + 2, Math.ceil(Math.sqrt(words.join('').length * 2.5)), 10);
    const height = gridSize;
    const width = gridSize;

    // Grille vide (null = pas encore rempli)
    const grid = Array.from({ length: height }, () => Array(width).fill(null));
    const wordLocations = [];

    // Essayer de placer chaque mot
    for (const word of sorted) {
        const placed = placeWord(grid, word, height, width);
        if (placed) {
            wordLocations.push(placed);
        }
    }

    if (wordLocations.length === 0) return null;

    // Remplir les cases vides avec des lettres aleatoires
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (grid[r][c] === null) {
                grid[r][c] = FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
            }
        }
    }

    return { wordGrid: grid, wordLocations, height, width };
}

/**
 * Essaie de placer un mot dans la grille avec un placement aleatoire.
 * Teste toutes les orientations et positions possibles dans un ordre aleatoire.
 */
function placeWord(grid, word, height, width) {
    const orientations = shuffle([...DEFAULT_ORIENTATIONS]);

    for (const orientation of orientations) {
        const check = checkOrientations[orientation];
        const next = orientationFns[orientation];

        // Generer toutes les positions valides pour cette orientation
        const positions = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (check(x, y, height, width, word.length)) {
                    positions.push({ x, y });
                }
            }
        }

        // Melanger les positions pour un placement aleatoire
        shuffle(positions);

        for (const pos of positions) {
            if (canPlace(grid, word, pos.x, pos.y, next)) {
                // Placer le mot
                for (let i = 0; i < word.length; i++) {
                    const p = next(pos.x, pos.y, i);
                    grid[p.y][p.x] = word[i];
                }
                return { x: pos.x, y: pos.y, orientation, word, overlap: word.length };
            }
        }
    }

    return null;
}

/**
 * Verifie si un mot peut etre place a la position donnee sans conflit.
 */
function canPlace(grid, word, x, y, next) {
    for (let i = 0; i < word.length; i++) {
        const pos = next(x, y, i);
        const existing = grid[pos.y]?.[pos.x];
        if (existing !== null && existing !== word[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Melange un tableau en place (Fisher-Yates).
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
 * @returns {Promise<{emptyGrid: Object|null, solutionGrid: Object|null}>}
 */
export async function generateFindTheWordsGridImages(wordList) {
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
        const gridResult = generateGrid(words);
        if (!gridResult) {
            console.warn('[FindTheWordsGenerator] Generation de grille impossible');
            return result;
        }

        // Grille vide (lettres sans surlignage)
        result.emptyGrid = await renderAndExport(gridResult.wordGrid, null);

        // Grille corrigee (avec surlignage des mots)
        result.solutionGrid = await renderAndExport(gridResult.wordGrid, gridResult.wordLocations);

    } catch (error) {
        console.error('[FindTheWordsGenerator] Erreur:', error);
    }

    return result;
}
