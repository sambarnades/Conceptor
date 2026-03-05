/**
 * @file Generateur de grille de mots croises a partir des donnees JSON (sans rendu H5P).
 *
 * Utilise un algorithme glouton pour placer les mots sur une grille 2D,
 * puis dessine la grille vide et la grille corrigee sur des canvas offscreen.
 *
 * Ce module est utilise quand le H5P n'est pas disponible (modale de resultat de generation).
 * Le module crossword-grid-capture.js reste utilise quand le H5P est rendu (modale de previsualisation).
 */

// ===================== Constantes de rendu (identiques a crossword-grid-capture.js) =====================

const CELL_SIZE = 48;
const BORDER_WIDTH = 1;
const OUTER_BORDER_WIDTH = 2;
const CLUE_FONT_SIZE = 11;
const LETTER_FONT_SIZE = 22;
const EMPTY_CELL_COLOR = '#173354';
const ACTIVE_CELL_COLOR = '#ffffff';
const SOLUTION_CELL_COLOR = '#f0f7ff';
const BORDER_COLOR = '#b0b0b0';
const OUTER_BORDER_COLOR = '#1d1d1f';
const CLUE_NUMBER_COLOR = '#555555';
const LETTER_COLOR = '#1d1d1f';

// ===================== Algorithme de placement =====================

/**
 * Normalise un mot pour le placement (majuscules, sans accents, sans espaces/tirets).
 */
function normalizeAnswer(answer) {
    return answer
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s\-']/g, '');
}

/**
 * Place les mots sur une grille 2D via un algorithme glouton.
 * Retourne { grid, placements } ou null si echec.
 *
 * @param {Array<{answer: string, clue: string}>} words
 * @returns {{ grid: string[][], placements: Array<{word, row, col, direction, normalizedAnswer}> } | null}
 */
function layoutWords(words) {
    if (!words || words.length === 0) return null;

    // Preparer les mots : normaliser les reponses, trier par longueur decroissante
    const prepared = words.map((w, i) => ({
        original: w,
        index: i,
        answer: normalizeAnswer(w.answer || ''),
    })).filter(w => w.answer.length > 0)
      .sort((a, b) => b.answer.length - a.answer.length);

    if (prepared.length === 0) return null;

    // Grille extensible : on stocke les placements et on calcule les bornes a la fin
    const placements = [];
    // Map (row,col) -> lettre
    const occupied = new Map();

    const key = (r, c) => `${r},${c}`;
    const getCell = (r, c) => occupied.get(key(r, c)) || null;
    const setCell = (r, c, ch) => occupied.set(key(r, c), ch);

    // Placer le premier mot horizontalement a l'origine
    const first = prepared[0];
    placements.push({ word: first, row: 0, col: 0, direction: 'across' });
    for (let i = 0; i < first.answer.length; i++) {
        setCell(0, i, first.answer[i]);
    }

    // Placer les mots suivants
    for (let wi = 1; wi < prepared.length; wi++) {
        const word = prepared[wi];
        let bestScore = -1;
        let bestPlacement = null;

        // Chercher la meilleure intersection avec les lettres deja placees
        for (const [cellKey, cellChar] of occupied) {
            const [cr, cc] = cellKey.split(',').map(Number);

            for (let li = 0; li < word.answer.length; li++) {
                if (word.answer[li] !== cellChar) continue;

                // Essayer across (horizontal) : le mot passe par (cr, cc - li)
                const acrossPlacement = tryPlace(word, cr, cc - li, 'across', li, occupied, key, getCell);
                if (acrossPlacement && acrossPlacement.score > bestScore) {
                    bestScore = acrossPlacement.score;
                    bestPlacement = acrossPlacement;
                }

                // Essayer down (vertical) : le mot passe par (cr - li, cc)
                const downPlacement = tryPlace(word, cr - li, cc, 'down', li, occupied, key, getCell);
                if (downPlacement && downPlacement.score > bestScore) {
                    bestScore = downPlacement.score;
                    bestPlacement = downPlacement;
                }
            }
        }

        if (bestPlacement) {
            placements.push({ word, row: bestPlacement.row, col: bestPlacement.col, direction: bestPlacement.direction });
            const dr = bestPlacement.direction === 'down' ? 1 : 0;
            const dc = bestPlacement.direction === 'across' ? 1 : 0;
            for (let i = 0; i < word.answer.length; i++) {
                setCell(bestPlacement.row + i * dr, bestPlacement.col + i * dc, word.answer[i]);
            }
        }
        // Si pas de placement, on saute le mot (pas bloquant)
    }

    if (placements.length === 0) return null;

    // Calculer les bornes de la grille
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (const [cellKey] of occupied) {
        const [r, c] = cellKey.split(',').map(Number);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
    }

    // Decaler pour que la grille commence a (0,0)
    const rows = maxRow - minRow + 1;
    const cols = maxCol - minCol + 1;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (const [cellKey, ch] of occupied) {
        const [r, c] = cellKey.split(',').map(Number);
        grid[r - minRow][c - minCol] = ch;
    }

    // Ajuster les positions des placements
    const adjustedPlacements = placements.map(p => ({
        ...p,
        row: p.row - minRow,
        col: p.col - minCol
    }));

    return { grid, placements: adjustedPlacements, rows, cols };
}

/**
 * Teste si un mot peut etre place a une position donnee sans conflit.
 * Retourne null si impossible, ou { row, col, direction, score } si ok.
 */
function tryPlace(word, startRow, startCol, direction, intersectIdx, occupied, key, getCell) {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    let score = 0;

    for (let i = 0; i < word.answer.length; i++) {
        const r = startRow + i * dr;
        const c = startCol + i * dc;
        const existing = getCell(r, c);

        if (existing) {
            if (existing !== word.answer[i]) return null; // Conflit de lettre
            score += 1; // Intersection valide
        } else {
            // Verifier les cellules adjacentes (pas de mots colles en parallele)
            if (direction === 'across') {
                // Verifier au-dessus et en-dessous
                if (getCell(r - 1, c) && i !== intersectIdx) return null;
                if (getCell(r + 1, c) && i !== intersectIdx) return null;
            } else {
                // Verifier a gauche et a droite
                if (getCell(r, c - 1) && i !== intersectIdx) return null;
                if (getCell(r, c + 1) && i !== intersectIdx) return null;
            }
        }
    }

    // Verifier les cases avant et apres le mot (pas de prolongation)
    const beforeR = startRow - dr;
    const beforeC = startCol - dc;
    if (getCell(beforeR, beforeC)) return null;
    const afterR = startRow + word.answer.length * dr;
    const afterC = startCol + word.answer.length * dc;
    if (getCell(afterR, afterC)) return null;

    return { row: startRow, col: startCol, direction, score };
}

// ===================== Construction du gridModel =====================

/**
 * Construit le gridModel et les solutionLetters a partir du resultat du placement.
 */
function buildGridModel(layoutResult) {
    const { grid, placements, rows, cols } = layoutResult;

    // Construire les cellules
    const cells = [];
    const solutionLetters = [];

    // Attribuer les numeros d'indices dans l'ordre lecture (haut→bas, gauche→droite)
    const clueStarts = [];
    for (const p of placements) {
        clueStarts.push({ row: p.row, col: p.col, direction: p.direction, word: p.word });
    }
    clueStarts.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);

    // Map (row,col) -> clueId (premiere occurrence)
    const clueIdMap = new Map();
    let clueNum = 1;
    for (const cs of clueStarts) {
        const k = `${cs.row},${cs.col}`;
        if (!clueIdMap.has(k)) {
            clueIdMap.set(k, String(clueNum++));
        }
    }

    for (let r = 0; r < rows; r++) {
        const row = [];
        const lettersRow = [];
        for (let c = 0; c < cols; c++) {
            const ch = grid[r][c];
            if (ch === null) {
                row.push({ empty: true, clueId: null });
                lettersRow.push(null);
            } else {
                const clueId = clueIdMap.get(`${r},${c}`) || null;
                row.push({ empty: false, clueId });
                lettersRow.push(ch);
            }
        }
        cells.push(row);
        solutionLetters.push(lettersRow);
    }

    return {
        gridModel: { rows, cols, cells },
        solutionLetters
    };
}

// ===================== Rendu Canvas =====================

/**
 * Dessine la grille sur un canvas offscreen.
 * Copie exacte de la fonction dans crossword-grid-capture.js pour un rendu identique.
 */
function renderGridToCanvas(gridModel, solutionLetters) {
    const { rows, cols, cells } = gridModel;
    const isSolution = !!solutionLetters;

    const padding = OUTER_BORDER_WIDTH;
    const width = cols * CELL_SIZE + padding * 2;
    const height = rows * CELL_SIZE + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < (cells[r]?.length || 0); c++) {
            const cell = cells[r][c];
            const x = padding + c * CELL_SIZE;
            const y = padding + r * CELL_SIZE;

            if (cell.empty) {
                ctx.fillStyle = EMPTY_CELL_COLOR;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = OUTER_BORDER_COLOR;
                ctx.lineWidth = BORDER_WIDTH;
                ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
            } else {
                const letter = solutionLetters?.[r]?.[c];
                ctx.fillStyle = (isSolution && letter) ? SOLUTION_CELL_COLOR : ACTIVE_CELL_COLOR;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                ctx.strokeStyle = BORDER_COLOR;
                ctx.lineWidth = BORDER_WIDTH;
                ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

                if (cell.clueId) {
                    ctx.fillStyle = CLUE_NUMBER_COLOR;
                    ctx.font = `bold ${CLUE_FONT_SIZE}px -apple-system, "Segoe UI", Arial, sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(cell.clueId, x + 3, y + 2);
                }

                if (letter) {
                    ctx.fillStyle = LETTER_COLOR;
                    ctx.font = `bold ${LETTER_FONT_SIZE}px -apple-system, "Segoe UI", Arial, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(letter, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 2);
                }
            }
        }
    }

    ctx.strokeStyle = OUTER_BORDER_COLOR;
    ctx.lineWidth = OUTER_BORDER_WIDTH;
    ctx.strokeRect(padding / 2, padding / 2, cols * CELL_SIZE + padding, rows * CELL_SIZE + padding);

    return canvas;
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob a retourne null'));
        }, 'image/png');
    });
}

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

// ===================== API publique =====================

/**
 * Genere les images de grille (vide + corrigee) directement a partir des mots JSON.
 * Ne necessite aucun rendu H5P.
 *
 * @param {Array<{answer: string, clue: string}>} words - Tableau de mots avec reponse et indice
 * @returns {Promise<{emptyGrid: Object|null, solutionGrid: Object|null}>}
 */
export async function generateCrosswordGridImages(words) {
    const result = { emptyGrid: null, solutionGrid: null };

    try {
        const layout = layoutWords(words);
        if (!layout) {
            console.warn('[CrosswordGenerator] Placement des mots impossible');
            return result;
        }

        const { gridModel, solutionLetters } = buildGridModel(layout);

        // Grille vide (sans lettres)
        result.emptyGrid = await renderAndExport(gridModel, null);

        // Grille corrigee (avec lettres)
        result.solutionGrid = await renderAndExport(gridModel, solutionLetters);

    } catch (error) {
        console.error('[CrosswordGenerator] Erreur:', error);
    }

    return result;
}
