/**
 * @file Capture de la grille de mots croisés H5P pour export document.
 * Lit le DOM de l'iframe H5P et redessine la grille (vide + corrigée) sur des canvas offscreen.
 */

import {
    CW_CELL_SIZE as CELL_SIZE,
    CW_BORDER_WIDTH as BORDER_WIDTH,
    CW_OUTER_BORDER_WIDTH as OUTER_BORDER_WIDTH,
    CW_CLUE_FONT_SIZE as CLUE_FONT_SIZE,
    CW_LETTER_FONT_SIZE as LETTER_FONT_SIZE,
    CW_DEFAULT_COLORS as DEFAULT_COLORS,
    buildCrosswordColors as buildColors,
    canvasToBlob
} from './grid-canvas-utils.js';

// Variable de module pour stocker le theme actuel (injecte par captureCrosswordGrid)
let _currentColors = DEFAULT_COLORS;

/**
 * Capture la grille de mots croisés (vide et corrigée) depuis le H5P dans la modale.
 * @param {HTMLElement} modal - L'élément .preview-modal
 * @param {Array} [words] - Tableau des mots du JSON (avec answer, clue) pour la grille corrigée
 * @returns {Promise<{emptyGrid: Object|null, solutionGrid: Object|null}>}
 */
export async function captureCrosswordGrid(modal, words, theme) {
    const result = { emptyGrid: null, solutionGrid: null, placements: [], unplacedWords: [] };
    _currentColors = buildColors(theme);

    try {
        // 1. Trouver l'iframe H5P
        const iframe = modal.querySelector('.h5p-iframe');
        if (!iframe) {
            console.warn('[CrosswordCapture] Iframe H5P non trouvée');
            return result;
        }

        // 2. Accéder au document de l'iframe
        let iframeDoc;
        try {
            iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        } catch (e) {
            console.warn('[CrosswordCapture] Accès contentDocument impossible (cross-origin ?)', e);
            return result;
        }
        if (!iframeDoc) return result;

        // 3. Trouver la table de la grille
        const gridTable = iframeDoc.querySelector('.h5p-crossword-grid');
        if (!gridTable) {
            console.warn('[CrosswordCapture] Table .h5p-crossword-grid non trouvée');
            return result;
        }

        // 4. Lire la structure de la grille
        const gridModel = readGridFromTable(gridTable);
        if (!gridModel || gridModel.rows === 0 || gridModel.cols === 0) {
            console.warn('[CrosswordCapture] Grille vide ou illisible');
            return result;
        }

        // 5. Grille vide
        result.emptyGrid = await renderAndExport(gridModel, null);

        // 6. Grille corrigée + placements annotés (si mots fournis)
        if (words && words.length > 0) {
            try {
                const { letters, placements, unplaced } = buildSolutionData(iframeDoc, gridModel, words);
                result.placements = placements;
                result.unplacedWords = unplaced;
                if (letters) {
                    result.solutionGrid = await renderAndExport(gridModel, letters);
                }
            } catch (err) {
                console.warn('[CrosswordCapture] Impossible de construire la grille corrigée:', err);
            }
        }

    } catch (error) {
        console.error('[CrosswordCapture] Erreur lors de la capture:', error);
    }

    return result;
}

/**
 * Construit la matrice de lettres-solution + les placements annotés (clueId, direction, word)
 * en lisant les indices du DOM H5P et en les associant aux mots du JSON.
 * @returns {{ letters: Array<Array<string|null>>|null, placements: Array, unplaced: Array }}
 */
function buildSolutionData(iframeDoc, gridModel, words) {
    const empty = { letters: null, placements: [], unplaced: [] };

    // Lire les listes d'indices (Horizontal / Vertical) depuis le DOM H5P
    const clues = readCluesFromDOM(iframeDoc);
    if (clues.across.length === 0 && clues.down.length === 0) {
        console.warn('[CrosswordCapture] Aucun indice trouvé dans le DOM');
        return empty;
    }

    // Matrice de lettres (null = pas de lettre)
    const letters = Array.from({ length: gridModel.rows }, () =>
        Array(gridModel.cols).fill(null)
    );

    const placements = [];
    const matchedWords = new Set();

    const collect = (clueList, direction, dRow, dCol) => {
        for (const clue of clueList) {
            const word = matchClueToWord(clue.text, words);
            if (!word) continue;
            const pos = findClueCellPosition(gridModel, clue.id);
            if (!pos) continue;
            placeWord(letters, word.answer, pos.row, pos.col, dRow, dCol, gridModel);
            placements.push({
                clueId: String(clue.id),
                direction,
                row: pos.row,
                col: pos.col,
                word
            });
            matchedWords.add(word);
        }
    };

    collect(clues.across, 'across', 0, 1);
    collect(clues.down, 'down', 1, 0);

    if (placements.length === 0) {
        console.warn('[CrosswordCapture] Aucun mot placé sur la grille');
        return empty;
    }

    // Mots du JSON qui n'ont pas été matchés à un indice du DOM H5P
    const unplaced = words.filter(w => !matchedWords.has(w));

    return { letters, placements, unplaced };
}

/**
 * Lit les listes d'indices Horizontal/Vertical depuis le DOM H5P.
 */
function readCluesFromDOM(iframeDoc) {
    const result = { across: [], down: [] };
    const groups = iframeDoc.querySelectorAll('.h5p-crossword-input-fields-group');

    groups.forEach((group, index) => {
        const direction = index === 0 ? 'across' : 'down';
        const wrappers = group.querySelectorAll('.h5p-crossword-input-fields-group-wrapper');

        wrappers.forEach(wrapper => {
            const idEl = wrapper.querySelector('.h5p-crossword-input-fields-group-clue-id');
            const clueEl = wrapper.querySelector('.h5p-crossword-input-fields-group-clue');

            if (idEl && clueEl) {
                result[direction].push({
                    id: idEl.textContent.trim(),
                    text: clueEl.textContent.trim()
                });
            }
        });
    });

    return result;
}

/**
 * Normalise un texte pour la comparaison (supprime HTML, ponctuation superflue, espaces multiples).
 */
function normalizeText(text) {
    return text
        .replace(/<[^>]+>/g, '')   // Supprimer les tags HTML
        .replace(/\s+/g, ' ')      // Normaliser les espaces
        .trim()
        .toLowerCase();
}

/**
 * Associe un texte d'indice à un mot du JSON.
 */
function matchClueToWord(clueText, words) {
    const normalized = normalizeText(clueText);

    // Correspondance exacte d'abord
    for (const word of words) {
        if (normalizeText(word.clue) === normalized) return word;
    }

    // Correspondance partielle (le texte DOM peut être tronqué ou légèrement différent)
    for (const word of words) {
        const wordNorm = normalizeText(word.clue);
        if (wordNorm.includes(normalized) || normalized.includes(wordNorm)) return word;
    }

    return null;
}

/**
 * Trouve la position (row, col) d'une cellule avec un numéro d'indice donné.
 */
function findClueCellPosition(gridModel, clueId) {
    const id = String(clueId);
    for (let r = 0; r < gridModel.rows; r++) {
        for (let c = 0; c < gridModel.cols; c++) {
            if (gridModel.cells[r]?.[c]?.clueId === id) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

/**
 * Place un mot lettre par lettre sur la matrice de solution.
 */
function placeWord(letters, answer, startRow, startCol, dRow, dCol, gridModel) {
    const chars = answer.toUpperCase();
    for (let i = 0; i < chars.length; i++) {
        const r = startRow + i * dRow;
        const c = startCol + i * dCol;
        if (r >= 0 && r < gridModel.rows && c >= 0 && c < gridModel.cols) {
            letters[r][c] = chars[i];
        }
    }
}

// ===================== Lecture de la grille =====================

/**
 * Lit la structure de la grille depuis la table HTML du H5P.
 */
function readGridFromTable(table) {
    const tbody = table.querySelector('tbody') || table;
    const trs = tbody.querySelectorAll('tr');
    if (trs.length === 0) return null;

    const cells = [];
    let maxCols = 0;

    trs.forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => {
            const isEmpty = td.classList.contains('h5p-crossword-cell-empty');
            let clueId = null;
            const marker = td.querySelector('.h5p-crossword-cell-clue-id-marker');
            if (marker) clueId = marker.textContent.trim();
            row.push({ empty: isEmpty, clueId });
        });
        if (row.length > maxCols) maxCols = row.length;
        cells.push(row);
    });

    return { rows: cells.length, cols: maxCols, cells };
}

// ===================== Rendu Canvas =====================

/**
 * Dessine la grille sur un canvas et exporte en PNG.
 * @param {Object} gridModel - Modèle de grille
 * @param {Array<Array<string|null>>|null} solutionLetters - Lettres à afficher (null = grille vide)
 */
async function renderAndExport(gridModel, solutionLetters) {
    const canvas = renderGridToCanvas(gridModel, solutionLetters);
    const dataURL = canvas.toDataURL('image/png');
    const blob = await canvasToBlob(canvas);

    return {
        dataURL,
        blob,
        width: canvas.width,
        height: canvas.height,
        mimeType: 'image/png'
    };
}

/**
 * Dessine la grille sur un canvas offscreen.
 */
function renderGridToCanvas(gridModel, solutionLetters) {
    const C = _currentColors;
    const { rows, cols, cells } = gridModel;
    const isSolution = !!solutionLetters;

    const padding = OUTER_BORDER_WIDTH;
    const width = cols * CELL_SIZE + padding * 2;
    const height = rows * CELL_SIZE + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < (cells[r]?.length || 0); c++) {
            const cell = cells[r][c];
            const x = padding + c * CELL_SIZE;
            const y = padding + r * CELL_SIZE;

            if (cell.empty) {
                ctx.fillStyle = C.EMPTY_CELL_COLOR;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = C.OUTER_BORDER_COLOR;
                ctx.lineWidth = BORDER_WIDTH;
                ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
            } else {
                const letter = solutionLetters?.[r]?.[c];
                ctx.fillStyle = (isSolution && letter) ? C.SOLUTION_CELL_COLOR : C.ACTIVE_CELL_COLOR;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                ctx.strokeStyle = C.BORDER_COLOR;
                ctx.lineWidth = BORDER_WIDTH;
                ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

                if (cell.clueId) {
                    ctx.fillStyle = C.CLUE_NUMBER_COLOR;
                    ctx.font = `bold ${CLUE_FONT_SIZE}px -apple-system, "Segoe UI", Arial, sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(cell.clueId, x + 3, y + 2);
                }

                if (letter) {
                    ctx.fillStyle = C.LETTER_COLOR;
                    ctx.font = `bold ${LETTER_FONT_SIZE}px -apple-system, "Segoe UI", Arial, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(letter, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 2);
                }
            }
        }
    }

    // Bordure extérieure
    ctx.strokeStyle = C.OUTER_BORDER_COLOR;
    ctx.lineWidth = OUTER_BORDER_WIDTH;
    ctx.strokeRect(padding / 2, padding / 2, cols * CELL_SIZE + padding, rows * CELL_SIZE + padding);

    return canvas;
}

/**
 * Convertit un canvas en Blob PNG.
 */
