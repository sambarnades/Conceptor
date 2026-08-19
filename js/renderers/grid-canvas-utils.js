/**
 * @file Constantes et helpers de rendu canvas PARTAGÉS entre les variantes
 * « generator » (grille reconstruite depuis le JSON, sans H5P) et « capture »
 * (grille relue depuis le DOM de l'iframe H5P) des grilles Mots croisés et
 * Mots mêlés.
 *
 * Ces quatre modules dessinent la MÊME grille sur canvas ; seule la SOURCE des
 * données diffère. Les constantes de rendu et les helpers purs vivent donc ici,
 * pour qu'un ajustement visuel (taille de cellule, couleur de surlignage) ne
 * puisse plus n'atterrir que dans deux fichiers sur quatre.
 *
 * Les préfixes `CW_` (Crossword) et `FTW_` (FindTheWords) évitent la collision
 * de noms : `CELL_SIZE` vaut 48 pour les mots croisés et 40 pour les mots mêlés.
 * Les consommateurs importent avec alias (`CW_CELL_SIZE as CELL_SIZE`) afin que
 * leurs sites d'appel restent inchangés.
 *
 * NB : `renderGridToCanvas` n'est volontairement PAS mutualisé — la variante
 * « generator » des mots croisés applique un plafond `MAX_GRID_DIM` que la
 * variante « capture » n'a pas. Les unifier changerait le comportement.
 */

// =======================================================================
// Générique — commun aux quatre modules
// =======================================================================

/**
 * Convertit un canvas en Blob PNG.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>} Rejette si le navigateur renvoie un blob nul.
 */
export function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob a retourné null'));
        }, 'image/png');
    });
}

// =======================================================================
// Mots croisés (H5P.Crossword)
// =======================================================================

export const CW_CELL_SIZE = 48;
export const CW_BORDER_WIDTH = 1;
export const CW_OUTER_BORDER_WIDTH = 2;
export const CW_CLUE_FONT_SIZE = 11;
export const CW_LETTER_FONT_SIZE = 22;

/** Couleurs par défaut (utilisées si aucun thème n'est fourni). */
export const CW_DEFAULT_COLORS = {
    EMPTY_CELL_COLOR: '#173354',
    ACTIVE_CELL_COLOR: '#ffffff',
    SOLUTION_CELL_COLOR: '#f0f7ff',
    BORDER_COLOR: '#b0b0b0',
    OUTER_BORDER_COLOR: '#1d1d1f',
    CLUE_NUMBER_COLOR: '#555555',
    LETTER_COLOR: '#1d1d1f'
};

/**
 * Éclaircit légèrement une couleur hex pour la grille solution.
 * @param {string} hex - Couleur au format `#rrggbb`.
 * @param {number} amount - Fraction de blanc à ajouter (0 → 1).
 * @returns {string} Couleur éclaircie au format `#rrggbb`.
 */
export function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Construit la palette de couleurs à partir d'un thème H5P Crossword optionnel.
 * @param {Object} [theme] - Objet thème H5P (backgroundColor, cellColor, etc.)
 * @returns {Object} Palette de couleurs pour le rendu.
 */
export function buildCrosswordColors(theme) {
    if (!theme) return CW_DEFAULT_COLORS;
    return {
        EMPTY_CELL_COLOR: theme.backgroundColor || CW_DEFAULT_COLORS.EMPTY_CELL_COLOR,
        ACTIVE_CELL_COLOR: theme.cellBackgroundColor || CW_DEFAULT_COLORS.ACTIVE_CELL_COLOR,
        SOLUTION_CELL_COLOR: theme.cellBackgroundColor ? lightenColor(theme.cellBackgroundColor, 0.05) : CW_DEFAULT_COLORS.SOLUTION_CELL_COLOR,
        BORDER_COLOR: theme.gridColor || CW_DEFAULT_COLORS.BORDER_COLOR,
        OUTER_BORDER_COLOR: theme.gridColor || CW_DEFAULT_COLORS.OUTER_BORDER_COLOR,
        CLUE_NUMBER_COLOR: theme.clueIdColor || CW_DEFAULT_COLORS.CLUE_NUMBER_COLOR,
        LETTER_COLOR: theme.cellColor || CW_DEFAULT_COLORS.LETTER_COLOR
    };
}

// =======================================================================
// Mots mêlés (H5P.FindTheWords)
// =======================================================================

export const FTW_CELL_SIZE = 40;
export const FTW_GRID_PADDING = 4;
export const FTW_FONT_SIZE_RATIO = 0.45; // ratio par rapport à CELL_SIZE
export const FTW_EXPORT_SCALE = 2;       // rendu haute résolution (export document)
export const FTW_BG_COLOR = '#ffffff';
export const FTW_GRID_LINE_COLOR = '#e0e0e0';
export const FTW_LETTER_COLOR = '#333333';
// Couleurs du surlignage solution (style H5P « show solution » : bleu + pointillés)
export const FTW_MARK_COLOR_STROKE = 'rgba(51, 102, 255, 0.9)';
export const FTW_MARK_COLOR_FILL = 'rgba(51, 102, 255, 0.1)';
export const FTW_MARK_LINE_DASH = [8, 4];

/** Déplacement d'une case selon l'orientation, à l'index `i` du mot. */
export const orientationFns = {
    horizontal:     (x, y, i) => ({ x: x + i, y }),
    horizontalBack: (x, y, i) => ({ x: x - i, y }),
    vertical:       (x, y, i) => ({ x, y: y + i }),
    verticalUp:     (x, y, i) => ({ x, y: y - i }),
    diagonal:       (x, y, i) => ({ x: x + i, y: y + i }),
    diagonalBack:   (x, y, i) => ({ x: x - i, y: y + i }),
    diagonalUp:     (x, y, i) => ({ x: x + i, y: y - i }),
    diagonalUpBack: (x, y, i) => ({ x: x - i, y: y - i })
};

/** Un mot de longueur `l` tient-il à partir de (x,y) dans une grille h×w ? */
export const checkOrientations = {
    horizontal:     (x, y, h, w, l) => w >= x + l,
    horizontalBack: (x, y, h, w, l) => x + 1 >= l,
    vertical:       (x, y, h, w, l) => h >= y + l,
    verticalUp:     (x, y, h, w, l) => y + 1 >= l,
    diagonal:       (x, y, h, w, l) => (w >= x + l) && (h >= y + l),
    diagonalBack:   (x, y, h, w, l) => (x + 1 >= l) && (h >= y + l),
    diagonalUp:     (x, y, h, w, l) => (w >= x + l) && (y + 1 >= l),
    diagonalUpBack: (x, y, h, w, l) => (x + 1 >= l) && (y + 1 >= l)
};

/**
 * Trace le surlignage « stadium » d'un mot trouvé : deux demi-cercles aux
 * extrémités reliés par deux segments parallèles.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{word: string, x: number, y: number, orientation: string}} location
 * @param {number} cellSize
 * @param {number} padding
 */
export function drawWordHighlight(ctx, location, cellSize, padding) {
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
    ctx.strokeStyle = FTW_MARK_COLOR_STROKE;
    ctx.fillStyle = FTW_MARK_COLOR_FILL;
    ctx.lineWidth = 2;
    ctx.setLineDash(FTW_MARK_LINE_DASH);

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
