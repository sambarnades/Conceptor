/**
 * run_grid_canvas_utils_tests.mjs — Tests d'ÉQUIVALENCE de `js/renderers/grid-canvas-utils.js`.
 *
 * Ce fichier mutualise des helpers qui existaient en 2 à 4 copies dans les modules
 * crossword-grid-{generator,capture}.js et find-the-words-grid-{generator,capture}.js.
 * Le test embarque une COPIE DE RÉFÉRENCE des implémentations d'origine (relevées avant
 * extraction) et vérifie que les versions partagées produisent exactement les mêmes
 * résultats — y compris `drawWordHighlight`, dont on enregistre la séquence complète
 * d'appels canvas pour comparer trait pour trait.
 *
 * Lancement :  node tests/run_grid_canvas_utils_tests.mjs
 * Aucune dépendance : le module partagé est pur (pas de DOM, pas d'import produit).
 */
import {
    canvasToBlob,
    lightenColor, buildCrosswordColors, CW_DEFAULT_COLORS,
    orientationFns, checkOrientations, drawWordHighlight,
    FTW_MARK_COLOR_STROKE, FTW_MARK_COLOR_FILL, FTW_MARK_LINE_DASH,
    CW_CELL_SIZE, FTW_CELL_SIZE
} from '../js/renderers/grid-canvas-utils.js';

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}

// =======================================================================
// COPIES DE RÉFÉRENCE — implémentations d'origine, avant extraction.
// NE PAS « corriger » : elles servent d'oracle.
// =======================================================================

const REF_DEFAULT_COLORS = {
    EMPTY_CELL_COLOR: '#173354',
    ACTIVE_CELL_COLOR: '#ffffff',
    SOLUTION_CELL_COLOR: '#f0f7ff',
    BORDER_COLOR: '#b0b0b0',
    OUTER_BORDER_COLOR: '#1d1d1f',
    CLUE_NUMBER_COLOR: '#555555',
    LETTER_COLOR: '#1d1d1f'
};

function ref_lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function ref_buildColors(theme) {
    if (!theme) return REF_DEFAULT_COLORS;
    return {
        EMPTY_CELL_COLOR: theme.backgroundColor || REF_DEFAULT_COLORS.EMPTY_CELL_COLOR,
        ACTIVE_CELL_COLOR: theme.cellBackgroundColor || REF_DEFAULT_COLORS.ACTIVE_CELL_COLOR,
        SOLUTION_CELL_COLOR: theme.cellBackgroundColor ? ref_lightenColor(theme.cellBackgroundColor, 0.05) : REF_DEFAULT_COLORS.SOLUTION_CELL_COLOR,
        BORDER_COLOR: theme.gridColor || REF_DEFAULT_COLORS.BORDER_COLOR,
        OUTER_BORDER_COLOR: theme.gridColor || REF_DEFAULT_COLORS.OUTER_BORDER_COLOR,
        CLUE_NUMBER_COLOR: theme.clueIdColor || REF_DEFAULT_COLORS.CLUE_NUMBER_COLOR,
        LETTER_COLOR: theme.cellColor || REF_DEFAULT_COLORS.LETTER_COLOR
    };
}

const ref_orientationFns = {
    horizontal:     (x, y, i) => ({ x: x + i, y }),
    horizontalBack: (x, y, i) => ({ x: x - i, y }),
    vertical:       (x, y, i) => ({ x, y: y + i }),
    verticalUp:     (x, y, i) => ({ x, y: y - i }),
    diagonal:       (x, y, i) => ({ x: x + i, y: y + i }),
    diagonalBack:   (x, y, i) => ({ x: x - i, y: y + i }),
    diagonalUp:     (x, y, i) => ({ x: x + i, y: y - i }),
    diagonalUpBack: (x, y, i) => ({ x: x - i, y: y - i })
};

const ref_checkOrientations = {
    horizontal:     (x, y, h, w, l) => w >= x + l,
    horizontalBack: (x, y, h, w, l) => x + 1 >= l,
    vertical:       (x, y, h, w, l) => h >= y + l,
    verticalUp:     (x, y, h, w, l) => y + 1 >= l,
    diagonal:       (x, y, h, w, l) => (w >= x + l) && (h >= y + l),
    diagonalBack:   (x, y, h, w, l) => (x + 1 >= l) && (h >= y + l),
    diagonalUp:     (x, y, h, w, l) => (w >= x + l) && (y + 1 >= l),
    diagonalUpBack: (x, y, h, w, l) => (x + 1 >= l) && (y + 1 >= l)
};

const REF_MARK_COLOR_STROKE = 'rgba(51, 102, 255, 0.9)';
const REF_MARK_COLOR_FILL = 'rgba(51, 102, 255, 0.1)';
const REF_MARK_LINE_DASH = [8, 4];

function ref_drawWordHighlight(ctx, location, cellSize, padding) {
    const next = ref_orientationFns[location.orientation];
    const word = location.word;
    const startX = location.x;
    const startY = location.y;
    const endPos = next(startX, startY, word.length - 1);
    const x1 = padding + startX * cellSize + cellSize / 2;
    const y1 = padding + startY * cellSize + cellSize / 2;
    const x2 = padding + endPos.x * cellSize + cellSize / 2;
    const y2 = padding + endPos.y * cellSize + cellSize / 2;
    const radius = Math.floor(cellSize * 0.45);
    ctx.save();
    ctx.strokeStyle = REF_MARK_COLOR_STROKE;
    ctx.fillStyle = REF_MARK_COLOR_FILL;
    ctx.lineWidth = 2;
    ctx.setLineDash(REF_MARK_LINE_DASH);
    ctx.beginPath();
    if (word.length === 1) {
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    } else {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = (-dy / len) * radius;
        const ny = (dx / len) * radius;
        const angle = Math.atan2(dy, dx);
        ctx.moveTo(x1 + nx, y1 + ny);
        ctx.lineTo(x2 + nx, y2 + ny);
        ctx.arc(x2, y2, radius, angle + Math.PI / 2, angle - Math.PI / 2, true);
        ctx.lineTo(x1 - nx, y1 - ny);
        ctx.arc(x1, y1, radius, angle - Math.PI / 2, angle + Math.PI / 2, true);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// =======================================================================
// Contexte canvas enregistreur — capture la séquence exacte d'opérations
// =======================================================================

function recordingCtx() {
    const log = [];
    const rec = (op) => (...args) => log.push([op, ...args]);
    const handler = {
        get(target, prop) {
            if (prop === '__log') return log;
            if (!(prop in target)) target[prop] = rec(prop);
            return target[prop];
        },
        set(target, prop, value) {
            log.push(['set:' + String(prop), value]);
            return true;
        }
    };
    return new Proxy({}, handler);
}

// =======================================================================
// 1. Constantes : valeurs figées (un ajustement involontaire doit se voir)
// =======================================================================
eq('CW_CELL_SIZE = 48', CW_CELL_SIZE, 48);
eq('FTW_CELL_SIZE = 40', FTW_CELL_SIZE, 40);
eq('CW_DEFAULT_COLORS conforme à l\'original', CW_DEFAULT_COLORS, REF_DEFAULT_COLORS);
eq('FTW_MARK_COLOR_STROKE conforme', FTW_MARK_COLOR_STROKE, REF_MARK_COLOR_STROKE);
eq('FTW_MARK_COLOR_FILL conforme', FTW_MARK_COLOR_FILL, REF_MARK_COLOR_FILL);
eq('FTW_MARK_LINE_DASH conforme', FTW_MARK_LINE_DASH, REF_MARK_LINE_DASH);

// =======================================================================
// 2. lightenColor : équivalence sur un balayage de couleurs et d'amounts
// =======================================================================
{
    const hexes = ['#000000', '#ffffff', '#173354', '#f0f7ff', '#1d1d1f', '#b0b0b0',
                   '#ff0000', '#00ff00', '#0000ff', '#7f7f7f', '#010203', '#fefdfc'];
    const amounts = [0, 0.05, 0.1, 0.5, 0.9, 1];
    let diverged = 0;
    for (const h of hexes) for (const a of amounts) {
        if (lightenColor(h, a) !== ref_lightenColor(h, a)) diverged++;
    }
    eq(`lightenColor : équivalent sur ${hexes.length * amounts.length} combinaisons`, diverged, 0);
    // Valeurs d'ancrage explicites
    eq('lightenColor(#000000, 0) = #000000', lightenColor('#000000', 0), '#000000');
    eq('lightenColor(#ffffff, 1) sature à #ffffff', lightenColor('#ffffff', 1), '#ffffff');
    eq('lightenColor(#173354, 0.05) ancrage', lightenColor('#173354', 0.05), ref_lightenColor('#173354', 0.05));
}

// =======================================================================
// 3. buildCrosswordColors : équivalence sur thèmes partiels et complets
// =======================================================================
{
    const themes = [
        undefined, null,
        {},
        { backgroundColor: '#123456' },
        { cellBackgroundColor: '#abcdef' },
        { gridColor: '#0f0f0f' },
        { clueIdColor: '#777777' },
        { cellColor: '#222222' },
        { backgroundColor: '#111111', cellBackgroundColor: '#222222', gridColor: '#333333',
          clueIdColor: '#444444', cellColor: '#555555' }
    ];
    let diverged = 0;
    const details = [];
    for (const th of themes) {
        const a = JSON.stringify(buildCrosswordColors(th));
        const b = JSON.stringify(ref_buildColors(th));
        if (a !== b) { diverged++; details.push(`theme=${JSON.stringify(th)}\n     partagé=${a}\n     ref    =${b}`); }
    }
    eq(`buildCrosswordColors : équivalent sur ${themes.length} thèmes`, diverged, 0);
    if (details.length) failures.push('   ' + details.join('\n   '));
    // Le cas « pas de thème » doit rendre la palette par défaut telle quelle
    eq('buildCrosswordColors(undefined) = palette par défaut', buildCrosswordColors(undefined), REF_DEFAULT_COLORS);
    // cellBackgroundColor pilote SOLUTION_CELL_COLOR via lightenColor(+0.05)
    eq('SOLUTION_CELL_COLOR dérivé de cellBackgroundColor',
        buildCrosswordColors({ cellBackgroundColor: '#abcdef' }).SOLUTION_CELL_COLOR,
        ref_lightenColor('#abcdef', 0.05));
}

// =======================================================================
// 4. orientationFns / checkOrientations : équivalence exhaustive
// =======================================================================
{
    const names = Object.keys(ref_orientationFns);
    eq('orientationFns : mêmes 8 clés', Object.keys(orientationFns).sort(), names.slice().sort());
    eq('checkOrientations : mêmes 8 clés', Object.keys(checkOrientations).sort(), Object.keys(ref_checkOrientations).sort());

    let divO = 0, divC = 0;
    for (const n of names) {
        for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) for (let i = 0; i < 6; i++) {
            const a = JSON.stringify(orientationFns[n](x, y, i));
            const b = JSON.stringify(ref_orientationFns[n](x, y, i));
            if (a !== b) divO++;
        }
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) for (let l = 1; l <= 5; l++) {
            const a = checkOrientations[n](x, y, 5, 5, l);
            const b = ref_checkOrientations[n](x, y, 5, 5, l);
            if (a !== b) divC++;
        }
    }
    eq(`orientationFns : équivalent sur ${names.length * 216} cas`, divO, 0);
    eq(`checkOrientations : équivalent sur ${names.length * 125} cas`, divC, 0);
}

// =======================================================================
// 5. drawWordHighlight : équivalence trait pour trait
// =======================================================================
{
    const cases = [];
    for (const orientation of Object.keys(ref_orientationFns)) {
        for (const word of ['A', 'AB', 'MOT', 'LONGUEMOT']) {
            cases.push({ location: { word, x: 3, y: 3, orientation }, cellSize: 40, padding: 4 });
            cases.push({ location: { word, x: 5, y: 2, orientation }, cellSize: 48, padding: 0 });
        }
    }
    let diverged = 0;
    const firstDiff = [];
    for (const c of cases) {
        const c1 = recordingCtx(), c2 = recordingCtx();
        drawWordHighlight(c1, c.location, c.cellSize, c.padding);
        ref_drawWordHighlight(c2, c.location, c.cellSize, c.padding);
        const a = JSON.stringify(c1.__log), b = JSON.stringify(c2.__log);
        if (a !== b) {
            diverged++;
            if (firstDiff.length === 0) firstDiff.push(`cas=${JSON.stringify(c)}\n     partagé=${a}\n     ref    =${b}`);
        }
    }
    eq(`drawWordHighlight : séquence canvas identique sur ${cases.length} cas`, diverged, 0);
    if (firstDiff.length) failures.push('   ' + firstDiff[0]);

    // Le mot d'une lettre doit tracer un cercle complet (et non un stadium)
    const c = recordingCtx();
    drawWordHighlight(c, { word: 'A', x: 0, y: 0, orientation: 'horizontal' }, 40, 4);
    const arcs = c.__log.filter(e => e[0] === 'arc');
    eq('mot d\'une lettre : un seul arc (cercle complet)', arcs.length, 1);
    // log = ['arc', cx, cy, radius, startAngle, endAngle] → les angles sont en 4..5
    eq('mot d\'une lettre : arc sur 2π', arcs[0].slice(4), [0, 2 * Math.PI]);

    // Un mot de plusieurs lettres trace 2 arcs (les deux extrémités) + 2 segments
    const c2 = recordingCtx();
    drawWordHighlight(c2, { word: 'MOT', x: 0, y: 0, orientation: 'horizontal' }, 40, 4);
    eq('mot long : 2 arcs', c2.__log.filter(e => e[0] === 'arc').length, 2);
    eq('mot long : 2 lineTo', c2.__log.filter(e => e[0] === 'lineTo').length, 2);
    // save/restore équilibrés, pointillés remis à zéro
    eq('save/restore équilibrés', c2.__log.filter(e => e[0] === 'save').length, c2.__log.filter(e => e[0] === 'restore').length);
    eq('setLineDash remis à [] en sortie', c2.__log.filter(e => e[0] === 'setLineDash').pop(), ['setLineDash', []]);
}

// =======================================================================
// 6. canvasToBlob : résolution et rejet
// =======================================================================
{
    const blobLike = { size: 12, type: 'image/png' };
    const okCanvas = { toBlob: (cb, mime) => { ok('canvasToBlob demande image/png', mime === 'image/png'); cb(blobLike); } };
    const nullCanvas = { toBlob: (cb) => cb(null) };

    const r1 = await canvasToBlob(okCanvas);
    eq('canvasToBlob résout le blob', r1, blobLike);

    let msg = null;
    try { await canvasToBlob(nullCanvas); } catch (e) { msg = e.message; }
    eq('canvasToBlob rejette si blob null', msg, 'Canvas toBlob a retourné null');
}

// =======================================================================
// 7. Bout-en-bout : les 2 générateurs tournent vraiment avec le module partagé
//    (prouve que le recâblage des constantes/helpers est correct dans le VRAI
//    chemin d'appel, pas seulement équivalent en isolation).
// =======================================================================
{
    // Stub canvas minimal : 2D context no-op + toDataURL/toBlob
    const madeCanvases = [];
    globalThis.document = {
        createElement(tag) {
            if (tag !== 'canvas') return {};
            const c = {
                width: 0, height: 0,
                getContext: () => new Proxy({}, {
                    get: (t, p) => {
                        if (p === 'measureText') return () => ({ width: 10 });
                        if (!(p in t)) t[p] = () => {};
                        return t[p];
                    },
                    set: () => true
                }),
                toDataURL: () => 'data:image/png;base64,STUB',
                toBlob: (cb) => cb({ size: 1024, type: 'image/png' })
            };
            madeCanvases.push(c);
            return c;
        },
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    globalThis.window = globalThis;
    if (!globalThis.location) globalThis.location = { search: '', href: 'http://localhost/' };

    const { generateCrosswordGridImages } = await import('../js/renderers/crossword-grid-generator.js');
    const { generateFindTheWordsGridImages } = await import('../js/renderers/find-the-words-grid-generator.js');

    // --- Mots croisés ---
    const cwWords = [
        { answer: 'CHAT', clue: 'Animal domestique qui miaule' },
        { answer: 'CHIEN', clue: 'Meilleur ami de l\'homme' },
        { answer: 'TABLE', clue: 'Meuble à quatre pieds' },
        { answer: 'ARBRE', clue: 'Végétal à tronc' }
    ];
    const cw = await generateCrosswordGridImages(cwWords);
    ok('crossword : grille vide produite', cw.emptyGrid !== null, JSON.stringify(cw).slice(0, 200));
    ok('crossword : grille solution produite', cw.solutionGrid !== null);
    eq('crossword : mimeType PNG', cw.emptyGrid?.mimeType, 'image/png');
    ok('crossword : au moins un mot placé', (cw.placements?.length || 0) > 0);
    ok('crossword : dimensions non nulles', cw.emptyGrid?.width > 0 && cw.emptyGrid?.height > 0,
        `w=${cw.emptyGrid?.width} h=${cw.emptyGrid?.height}`);

    // Avec un thème : la palette doit être appliquée sans erreur
    const cwThemed = await generateCrosswordGridImages(cwWords, { cellBackgroundColor: '#abcdef', gridColor: '#123456' });
    ok('crossword : thème appliqué sans erreur', cwThemed.emptyGrid !== null);

    // --- Mots mêlés ---
    const ftw = await generateFindTheWordsGridImages('CHAT,CHIEN,TABLE,ARBRE,SOLEIL');
    ok('find-the-words : grille vide produite', ftw.emptyGrid !== null, JSON.stringify(ftw).slice(0, 200));
    ok('find-the-words : grille solution produite', ftw.solutionGrid !== null);
    eq('find-the-words : mimeType PNG', ftw.emptyGrid?.mimeType, 'image/png');
    ok('find-the-words : dimensions non nulles', ftw.emptyGrid?.width > 0 && ftw.emptyGrid?.height > 0,
        `w=${ftw.emptyGrid?.width} h=${ftw.emptyGrid?.height}`);

    // Entrées dégradées : ne doivent pas lever
    let threw = false;
    try {
        await generateFindTheWordsGridImages('');
        await generateFindTheWordsGridImages(null);
        await generateCrosswordGridImages([]);
    } catch { threw = true; }
    ok('entrées vides/nulles : aucune exception', !threw);
}

// =======================================================================
// Bilan
// =======================================================================
console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`grid-canvas-utils : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
