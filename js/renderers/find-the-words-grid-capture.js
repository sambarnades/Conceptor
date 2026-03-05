/**
 * @file Capture de la grille de mots mêlés H5P pour export document.
 * Accède à l'instance H5P via l'iframe H5PStandalone, extrait les données de la grille,
 * et redessine la grille (vide + solution) sur des canvas offscreen.
 */

// Taille de cellule pour le rendu export (indépendant du rendu H5P)
const CELL_SIZE = 40;
const GRID_PADDING = 4;
const FONT_SIZE_RATIO = 0.45; // ratio par rapport à CELL_SIZE
const EXPORT_SCALE = 2; // Facteur d'échelle pour un rendu haute résolution (export document)
const BG_COLOR = '#ffffff';
const GRID_LINE_COLOR = '#e0e0e0';
const LETTER_COLOR = '#333333';
// Couleurs du surlignage solution (style H5P "show solution" : bleu + pointillés)
const MARK_COLOR_STROKE = 'rgba(51, 102, 255, 0.9)';
const MARK_COLOR_FILL = 'rgba(51, 102, 255, 0.1)';
const MARK_LINE_DASH = [8, 4];

/**
 * Capture la grille de mots mêlés (vide et corrigée) depuis le H5P dans la modale.
 * @param {HTMLElement} modal - L'élément .preview-modal
 * @returns {Promise<{emptyGrid: Object|null, solutionGrid: Object|null}>}
 */
export async function captureFindTheWordsGrid(modal) {
    const result = { emptyGrid: null, solutionGrid: null };

    try {
        // 1. Trouver l'instance H5P (via iframe H5PStandalone ou window direct)
        const instanceData = getH5PInstanceData(modal);
        if (!instanceData) {
            console.warn('[FindTheWordsCapture] Impossible de récupérer les données de la grille');
            return result;
        }

        const { wordGrid, vocabulary, gridOrientations, gridHeight, gridWidth } = instanceData;

        // 2. Dessiner la grille vide (lettres uniquement)
        result.emptyGrid = await renderAndExport(wordGrid, null, null);

        // 3. Trouver les positions des mots et dessiner la grille solution
        const wordLocations = findAllWordLocations(wordGrid, vocabulary, gridOrientations, gridHeight, gridWidth);
        if (wordLocations.length > 0) {
            result.solutionGrid = await renderAndExport(wordGrid, wordLocations, null);
        }

    } catch (error) {
        console.error('[FindTheWordsCapture] Erreur lors de la capture:', error);
    }

    return result;
}

// ===================== ACCÈS À L'INSTANCE H5P =====================

/**
 * Récupère les données de l'instance H5P FindTheWords.
 * Tente d'abord via l'iframe (H5PStandalone), puis via window.H5P directement.
 */
function getH5PInstanceData(modal) {
    // Stratégie 1 : Accès via l'iframe H5PStandalone
    const iframe = modal.querySelector('.h5p-iframe');
    if (iframe) {
        try {
            const iframeWin = iframe.contentWindow;
            if (iframeWin && iframeWin.H5P && iframeWin.H5P.instances) {
                const instance = iframeWin.H5P.instances.find(inst =>
                    inst.grid && inst.grid.wordGrid && inst.vocabulary
                );
                if (instance) {
                    return extractInstanceData(instance);
                }
            }
        } catch (e) {
            console.warn('[FindTheWordsCapture] Accès iframe impossible (cross-origin ?):', e.message);
        }
    }

    // Stratégie 2 : Accès via window.H5P directement (fallback)
    if (window.H5P && window.H5P.instances) {
        const instance = window.H5P.instances.find(inst =>
            inst.grid && inst.grid.wordGrid && inst.vocabulary
        );
        if (instance) {
            return extractInstanceData(instance);
        }
    }

    return null;
}

/**
 * Extrait les données nécessaires d'une instance H5P.FindTheWords.
 */
function extractInstanceData(instance) {
    const grid = instance.grid;
    return {
        wordGrid: grid.wordGrid,
        vocabulary: instance.vocabulary.words,
        gridOrientations: grid.options.orientations,
        gridHeight: grid.options.height,
        gridWidth: grid.options.width
    };
}

// ===================== RECHERCHE DE MOTS =====================

const orientationFns = {
    horizontal:     (x, y, i) => ({ x: x + i, y }),
    horizontalBack: (x, y, i) => ({ x: x - i, y }),
    vertical:       (x, y, i) => ({ x, y: y + i }),
    verticalUp:     (x, y, i) => ({ x, y: y - i }),
    diagonal:       (x, y, i) => ({ x: x + i, y: y + i }),
    diagonalBack:   (x, y, i) => ({ x: x - i, y: y + i }),
    diagonalUp:     (x, y, i) => ({ x: x + i, y: y - i }),
    diagonalUpBack: (x, y, i) => ({ x: x - i, y: y - i })
};

const checkOrientations = {
    horizontal:     (x, y, h, w, l) => w >= x + l,
    horizontalBack: (x, y, h, w, l) => x + 1 >= l,
    vertical:       (x, y, h, w, l) => h >= y + l,
    verticalUp:     (x, y, h, w, l) => y + 1 >= l,
    diagonal:       (x, y, h, w, l) => (w >= x + l) && (h >= y + l),
    diagonalBack:   (x, y, h, w, l) => (x + 1 >= l) && (h >= y + l),
    diagonalUp:     (x, y, h, w, l) => (w >= x + l) && (y + 1 >= l),
    diagonalUpBack: (x, y, h, w, l) => (x + 1 >= l) && (y + 1 >= l)
};

const skipOrientations = {
    horizontal:     (x, y)    => ({ x: 0, y: y + 1 }),
    horizontalBack: (x, y, l) => ({ x: l - 1, y }),
    vertical:       (x, y)    => ({ x: 0, y: y + 100 }),
    verticalUp:     (x, y, l) => ({ x: 0, y: l - 1 }),
    diagonal:       (x, y)    => ({ x: 0, y: y + 1 }),
    diagonalBack:   (x, y, l) => ({ x: l - 1, y: x >= l - 1 ? y + 1 : y }),
    diagonalUp:     (x, y, l) => ({ x: 0, y: y < l - 1 ? l - 1 : y + 1 }),
    diagonalUpBack: (x, y, l) => ({ x: l - 1, y: x >= l - 1 ? y + 1 : y })
};

/**
 * Cherche toutes les positions des mots dans la grille.
 * Reproduit la logique de h5p-find-the-words-word-grid.js mark().
 */
function findAllWordLocations(wordGrid, vocabulary, allowedOrientations, height, width) {
    const locations = [];

    vocabulary.forEach(word => {
        const wordLocations = findWordLocations(wordGrid, allowedOrientations, word, height, width);
        if (wordLocations.length > 0 && wordLocations[0].overlap === word.length) {
            wordLocations[0].word = word;
            locations.push(wordLocations[0]);
        }
    });

    return locations;
}

/**
 * Trouve les emplacements possibles d'un mot dans la grille (remplie).
 */
function findWordLocations(wordGrid, allowedOrientations, word, height, width) {
    const locations = [];
    const wordLength = word.length;

    allowedOrientations.forEach(orientation => {
        const check = checkOrientations[orientation];
        const next = orientationFns[orientation];
        const skipTo = skipOrientations[orientation];

        let x = 0, y = 0;

        while (y < height) {
            if (check(x, y, height, width, wordLength)) {
                const overlap = calcOverlap(word, wordGrid, x, y, next);
                if (overlap >= 0) {
                    locations.push({ x, y, orientation, overlap });
                }
                x++;
                if (x >= width) { x = 0; y++; }
            } else {
                const nextPossible = skipTo(x, y, wordLength);
                x = nextPossible.x;
                y = nextPossible.y;
            }
        }
    });

    return locations;
}

function calcOverlap(word, wordGrid, x, y, fnGetSquare) {
    let overlap = 0;
    for (let i = 0; i < word.length; i++) {
        const pos = fnGetSquare(x, y, i);
        if (!wordGrid[pos.y] || wordGrid[pos.y][pos.x] === undefined) return -1;
        const square = wordGrid[pos.y][pos.x];
        if (square === word[i]) {
            overlap++;
        } else {
            return -1;
        }
    }
    return overlap;
}

// ===================== RENDU CANVAS =====================

/**
 * Dessine la grille sur un canvas offscreen et exporte en PNG + Blob.
 * @param {string[][]} wordGrid - Matrice de caractères
 * @param {Object[]|null} wordLocations - Positions des mots à surligner (null = grille vide)
 */
async function renderAndExport(wordGrid, wordLocations) {
    const rows = wordGrid.length;
    const cols = wordGrid[0].length;

    const canvasW = cols * CELL_SIZE + GRID_PADDING * 2;
    const canvasH = rows * CELL_SIZE + GRID_PADDING * 2;

    const canvas = document.createElement('canvas');
    // Résolution haute qualité pour l'export document
    canvas.width = canvasW * EXPORT_SCALE;
    canvas.height = canvasH * EXPORT_SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

    // Fond blanc
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Dessiner le quadrillage
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

    // Dessiner les surlignages AVANT les lettres pour qu'elles restent lisibles
    if (wordLocations && wordLocations.length > 0) {
        wordLocations.forEach(loc => {
            drawWordHighlight(ctx, loc, CELL_SIZE, GRID_PADDING);
        });
    }

    // Dessiner les lettres
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

/**
 * Dessine le surlignage d'un mot trouvé.
 * Reproduit le style H5P "show solution" : fond bleu clair + bordure pointillée bleue,
 * forme stadium (rectangle aux bords arrondis) englobant toutes les lettres.
 */
function drawWordHighlight(ctx, location, cellSize, padding) {
    const next = orientationFns[location.orientation];
    const word = location.word;
    const startX = location.x;
    const startY = location.y;
    const endPos = next(startX, startY, word.length - 1);

    // Centres des cellules de début et fin
    const x1 = padding + startX * cellSize + cellSize / 2;
    const y1 = padding + startY * cellSize + cellSize / 2;
    const x2 = padding + endPos.x * cellSize + cellSize / 2;
    const y2 = padding + endPos.y * cellSize + cellSize / 2;

    // Rayon des demi-cercles : assez grand pour couvrir une cellule entière
    const radius = Math.floor(cellSize * 0.45);

    ctx.save();
    ctx.strokeStyle = MARK_COLOR_STROKE;
    ctx.fillStyle = MARK_COLOR_FILL;
    ctx.lineWidth = 2;
    ctx.setLineDash(MARK_LINE_DASH);

    // Forme stadium : deux demi-cercles aux extrémités reliés par des lignes droites
    ctx.beginPath();

    if (word.length === 1) {
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    } else {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        // Vecteur perpendiculaire normalisé, mis à l'échelle du rayon
        const nx = (-dy / len) * radius;
        const ny = (dx / len) * radius;
        // Angle de la direction du mot
        const angle = Math.atan2(dy, dx);

        // Côté droit (de start vers end)
        ctx.moveTo(x1 + nx, y1 + ny);
        ctx.lineTo(x2 + nx, y2 + ny);
        // Demi-cercle à l'extrémité end (courbe vers l'extérieur, sens anti-horaire)
        ctx.arc(x2, y2, radius, angle + Math.PI / 2, angle - Math.PI / 2, true);
        // Côté gauche (de end vers start)
        ctx.lineTo(x1 - nx, y1 - ny);
        // Demi-cercle à l'extrémité start (courbe vers l'extérieur, sens anti-horaire)
        ctx.arc(x1, y1, radius, angle - Math.PI / 2, angle + Math.PI / 2, true);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

/**
 * Convertit un canvas en Blob PNG.
 */
function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob a retourné null'));
        }, 'image/png');
    });
}
