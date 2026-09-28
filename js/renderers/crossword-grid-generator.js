/**
 * @file Generateur de grille de mots croises a partir des donnees JSON (sans rendu H5P).
 *
 * Utilise un algorithme glouton pour placer les mots sur une grille 2D,
 * puis dessine la grille vide et la grille corrigee sur des canvas offscreen.
 *
 * Ce module est utilise quand le H5P n'est pas disponible (modale de resultat de generation).
 * Le module crossword-grid-capture.js reste utilise quand le H5P est rendu (modale de previsualisation).
 */

// ===================== Constantes de rendu (partagees : grid-canvas-utils.js) =====================

import { debugLog } from '../core/utils.js';
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

// Borne defensive PROPRE AU GENERATEUR : au-dela de 64x64, le canvas (64*48 = 3072 px
// de cote) devient enorme et peut faire echouer toBlob / exploser la memoire. Une grille
// legitime ne depasse jamais cette taille (nombre de mots limite par le prompt).
// La variante « capture » n'a pas ce plafond (sa taille est bornee par le rendu H5P).
const MAX_GRID_DIM = 64;

// ===================== Algorithme de placement =====================

/**
 * Normalise un mot pour le placement (majuscules natives, accents conservés, sans espaces/tirets).
 */
function normalizeAnswer(answer) {
    return answer
        .replace(/ß/g,'ẞ').toUpperCase()
        .normalize('NFC')
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

    // Mots ignores des le depart (reponse vide)
    const unplaced = words.filter(w => normalizeAnswer(w.answer || '').length === 0);

    if (prepared.length === 0) return { placements: [], unplaced };

    // Grille extensible : on stocke les placements et on calcule les bornes a la fin
    const placements = [];
    // Map (row,col) -> lettre
    const occupied = new Map();

    const key = (r, c) => `${r},${c}`;
    const getCell = (r, c) => occupied.get(key(r, c)) || null;
    const setCell = (r, c, ch) => occupied.set(key(r, c), ch);

    // Les coordonnées natives sont à base 1 ; les mots fixes sont placés en premier.
    const fixed = prepared.filter(word => word.original.fixWord);
    for (const word of fixed) {
        const row = Number(word.original.row) - 1, col = Number(word.original.column) - 1;
        const direction = word.original.orientation || 'across';
        if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 ||
            row >= MAX_GRID_DIM || col >= MAX_GRID_DIM || !['across','down'].includes(direction)) return null;
        const dr = direction === 'down' ? 1 : 0, dc = direction === 'across' ? 1 : 0;
        for (let i=0;i<word.answer.length;i++) {
            const r=row+i*dr,c=col+i*dc,existing=getCell(r,c);
            if(r>=MAX_GRID_DIM || c>=MAX_GRID_DIM || (existing && existing!==word.answer[i]))return null;
        }
        placements.push({word,row,col,direction});
        for(let i=0;i<word.answer.length;i++)setCell(row+i*dr,col+i*dc,word.answer[i]);
    }
    const remaining = prepared.filter(word => !word.original.fixWord);
    if (!placements.length && remaining.length) {
        const first=remaining.shift();placements.push({word:first,row:0,col:0,direction:'across'});
        for(let i=0;i<first.answer.length;i++)setCell(0,i,first.answer[i]);
    }
    for (let wi = 0; wi < remaining.length; wi++) {
        const word = remaining[wi];
        let bestScore = -1;
        let bestPlacement = null;

        // Chercher la meilleure intersection avec les lettres deja placees
        for (const [cellKey, cellChar] of occupied) {
            const [cr, cc] = cellKey.split(',').map(Number);

            for (let li = 0; li < word.answer.length; li++) {
                if (word.answer[li] !== cellChar) continue;

                // Essayer across (horizontal) : le mot passe par (cr, cc - li)
                const acrossPlacement = tryPlace(word, cr, cc - li, 'across', li, occupied, key, getCell);
                if (acrossPlacement && (!fixed.length || (acrossPlacement.row>=0 && acrossPlacement.col>=0)) && acrossPlacement.score > bestScore) {
                    bestScore = acrossPlacement.score;
                    bestPlacement = acrossPlacement;
                }

                // Essayer down (vertical) : le mot passe par (cr - li, cc)
                const downPlacement = tryPlace(word, cr - li, cc, 'down', li, occupied, key, getCell);
                if (downPlacement && (!fixed.length || (downPlacement.row>=0 && downPlacement.col>=0)) && downPlacement.score > bestScore) {
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
        } else {
            unplaced.push(word.original);
        }
    }

    if (placements.length === 0) return { placements: [], unplaced };

    // Calculer les bornes de la grille
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (const [cellKey] of occupied) {
        const [r, c] = cellKey.split(',').map(Number);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
    }

    if (fixed.length) { minRow=0; minCol=0; }

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

    return { grid, placements: adjustedPlacements, rows, cols, unplaced };
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
    const clueStarts = placements
        .map(p => ({ row: p.row, col: p.col }))
        .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);

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

    // Enrichir chaque placement avec son clueId (pour l'export documents)
    const annotatedPlacements = placements.map(p => ({
        clueId: clueIdMap.get(`${p.row},${p.col}`) || null,
        direction: p.direction,
        row: p.row,
        col: p.col,
        word: p.word.original
    }));

    return {
        gridModel: { rows, cols, cells },
        solutionLetters,
        annotatedPlacements
    };
}

// ===================== Rendu Canvas =====================

/**
 * Dessine la grille sur un canvas offscreen.
 * Copie exacte de la fonction dans crossword-grid-capture.js pour un rendu identique.
 */
function renderGridToCanvas(gridModel, solutionLetters, colors) {
    const C = colors || DEFAULT_COLORS;
    const { cells } = gridModel;
    let { rows, cols } = gridModel;
    const isSolution = !!solutionLetters;

    // Clamp defensif des dimensions du canvas (voir MAX_GRID_DIM).
    // L'appelant (generateCrosswordGridImages) tolere une grille tronquee.
    if (rows > MAX_GRID_DIM || cols > MAX_GRID_DIM) {
        debugLog('CrosswordGenerator', `Grille ${rows}x${cols} au-dela de ${MAX_GRID_DIM}x${MAX_GRID_DIM} : rendu tronque`);
        rows = Math.min(rows, MAX_GRID_DIM);
        cols = Math.min(cols, MAX_GRID_DIM);
    }

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
        for (let c = 0; c < Math.min(cells[r]?.length || 0, cols); c++) {
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

                if(cell.solutionId){
                    ctx.strokeStyle='#0055aa';ctx.fillStyle='#0055aa';ctx.lineWidth=1;
                    ctx.beginPath();ctx.arc(x+CELL_SIZE-9,y+CELL_SIZE-9,7,0,Math.PI*2);ctx.stroke();
                    ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cell.solutionId,x+CELL_SIZE-9,y+CELL_SIZE-9);
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

    ctx.strokeStyle = C.OUTER_BORDER_COLOR;
    ctx.lineWidth = OUTER_BORDER_WIDTH;
    ctx.strokeRect(padding / 2, padding / 2, cols * CELL_SIZE + padding, rows * CELL_SIZE + padding);

    return canvas;
}

async function renderAndExport(gridModel, solutionLetters, colors) {
    const canvas = renderGridToCanvas(gridModel, solutionLetters, colors);
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
export async function generateCrosswordGridImages(words, theme, behaviour = {}, solutionWord = "") {
    const result = { emptyGrid: null, solutionGrid: null, placements: [], unplacedWords: [] };

    try {
        const pool=Number(behaviour.poolSize);
        const selected=pool>=2 ? words.filter(w=>w.fixWord).concat(words.filter(w=>!w.fixWord).slice(0,Math.max(0,pool-words.filter(w=>w.fixWord).length))) : words;
        const layout = layoutWords(selected);
        if (!layout) {
            console.warn('[CrosswordGenerator] Placement des mots impossible');
            return result;
        }

        if (layout.unplaced && layout.unplaced.length > 0) {
            result.unplacedWords = layout.unplaced;
        }

        if (!layout.grid || layout.placements.length === 0) {
            return result;
        }

        const colors = buildColors(theme);
        const { gridModel, solutionLetters, annotatedPlacements } = buildGridModel(layout);

        result.placements = annotatedPlacements;
        // Chiffres cerclés pour extraire le mot-solution sans révéler ses lettres.
        if(solutionWord){
            const used=new Set();let complete=true;
            [...normalizeAnswer(solutionWord)].forEach((letter,index)=>{
                let found=false;
                for(let row=0;row<solutionLetters.length && !found;row++)for(let col=0;col<solutionLetters[row].length && !found;col++){
                    const key=row+','+col;
                    if(solutionLetters[row][col]===letter && !used.has(key)){gridModel.cells[row][col].solutionId=index+1;used.add(key);found=true;}
                }
                if(!found)complete=false;
            });
            if(!complete)throw new Error('Mot-solution absent de la grille');
        }

        // Grille vide (sans lettres)
        result.emptyGrid = await renderAndExport(gridModel, null, colors);

        // Grille corrigee (avec lettres)
        result.solutionGrid = await renderAndExport(gridModel, solutionLetters, colors);

    } catch (error) {
        console.error('[CrosswordGenerator] Erreur:', error);
    }

    return result;
}
