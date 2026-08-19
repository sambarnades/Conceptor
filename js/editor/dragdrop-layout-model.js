/**
 * Modèle de layout du Glisser-déposer (H5P.DragQuestion) — MATH PURE, PARTAGÉ
 * (partagé éditeur Caramel ↔ Sucrerie, cf. CLAUDE.md item 7 — byte-identique).
 *
 * Source unique de vérité du placement des zones de dépôt et des étiquettes :
 *   - grille adaptative « auto » (historique), avec compensation de la surlargeur
 *     du thème H5P (DragQuestion ≥ 1.15) ;
 *   - disposition « custom » (layoutMode: 'custom') : géométries explicites
 *     x/y/width/height en % du canvas portées par chaque zone / étiquette.
 *
 * Consommé par :
 *   - Caramel  : js/h5p/processors/DragAndDrop.js (process → content.json)
 *   - Sucrerie : assets/js/editor/h5p-native-adapters.js (processDragAndDrop —
 *     reconstruction du content.json au save, pré-détection géométrique à l'import)
 *   - Les deux : js/editor/dragdrop-layout-panel.js (canvas de l'éditeur)
 *
 * AUCUN import, AUCUNE dépendance DOM : importable tel quel dans Node (tests).
 *
 * @module editor/dragdrop-layout-model
 */

// ============================================================================
// DIMENSIONS PAR DÉFAUT DU CANVAS (en pixels)
// Positions (x,y) converties en % et dimensions (width,height) en EM pour H5P.
// H5P DragQuestion : style="left:x%;top:y%;width:w em;height:h em"
// fontSize = containerWidth/settingsWidth * 16px → 1em = 16px à taille native.
// ============================================================================

export const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT_MIN = 500;

// Position des étiquettes : 'up' = en haut, 'down' = en bas, 'center' = empilées au centre
const DEFAULT_ELEMENT_POSITION = 'down';

// Décalage entre chaque étiquette empilée en mode 'center' (en % du canvas)
const STACK_OFFSET_PCT = 0.3;
// Décalage vertical de la pile en mode 'center' (négatif = vers le haut)
const STACK_VERTICAL_SHIFT_PCT = -10;

// Surlargeur rendue par le thème H5P (DragQuestion ≥ 1.15 / H5P.Components),
// hors width déclaré. Deux cas très différents :
//   - ZONES : bordures/arrondis seulement → compensation légère.
//   - ÉTIQUETTES (draggables) : poignée de déplacement (--handle-width: 1rem = 16 px)
//     + padding 0.3em de chaque côté + bordures 2 px, le tout HORS width déclaré
//     (la boîte est aussi décalée à gauche par translateX(-poignée)) → sans
//     compensation suffisante, les étiquettes se touchent (constat 2026-07).
const H5P_THEME_CHROME_PX = 10;      // zones (bordures)
const ELEMENT_CHROME_PX = 26;        // étiquettes (poignée + paddings + bordures)

// ============================================================================
// DIMENSIONS DES ÉTIQUETTES (en pixels)
// ============================================================================

export const ELEMENT_WIDTH_PX = 150;
export const ELEMENT_HEIGHT_PX = 38;
// Hauteur spécifique pour les étiquettes contenant une image (~3× le texte)
// Largeur identique à ELEMENT_WIDTH_PX pour garder l'alignement en rangée
export const IMAGE_ELEMENT_HEIGHT_PX = 110;
const ELEMENT_GAP_PX = 15;           // espacement horizontal entre étiquettes
// Espacement vertical entre lignes d'étiquettes : le thème rend chaque draggable
// plus HAUT que sa hauteur déclarée (padding 0.3em haut/bas + bordures 2 px) —
// il faut l'absorber pour garder un vrai jour entre les rangées.
const ELEMENT_ROW_GAP_PX = 22;
const ELEMENT_BOTTOM_MARGIN_PX = 18;  // marge basse (absorbe aussi le débordement du thème)
const ELEMENT_SIDE_MARGIN_PX = 12;    // marge latérale

// ============================================================================
// ZONES DE DÉPÔT
// ============================================================================

const ZONE_TOP_MARGIN_PX = 10;       // marge depuis le haut du canvas
const ZONE_GAP_PX = 10;              // espacement HORIZONTAL entre zones
// Espacement VERTICAL entre rangées de zones : plus grand que l'horizontal car le thème
// H5P.Components (DragQuestion ≥ 1.15) rend le libellé AU-DESSUS de la zone avec le même
// fond — sans écart franc, les rangées fusionnent visuellement en un seul bloc.
const ZONE_ROW_GAP_PX = 16;
const ZONE_MIN_HEIGHT_PX = 80;       // hauteur minimale d'une zone
const ZONE_ELEMENTS_GAP_PX = 15;     // séparation entre zones et étiquettes
// Hauteur réservée au libellé rendu AU-DESSUS de la zone (.h5p-dropzone_label :
// bottom:100%, line-height 1.25em ≈ 20 px à taille native) + marge de sécurité.
// La zone est réduite d'autant depuis le haut de son emplacement de grille.
const ZONE_LABEL_OFFSET_PX = 24;

// ============================================================================
// DISPOSITION PERSONNALISÉE (layoutMode: 'custom')
// Chaque zone / étiquette peut porter x/y/width/height en % du canvas ; un item
// sans coordonnées reçoit son emplacement automatique. La hauteur du canvas
// devient pilotable via canvasHeight (px, bornée ci-dessous).
// ============================================================================

export const CUSTOM_CANVAS_MIN_HEIGHT = 300;
export const CUSTOM_CANVAS_MAX_HEIGHT = 2000;
const CUSTOM_ZONE_MIN_SIZE_PCT = 2;   // taille minimale d'un item en % du canvas

// ============================================================================
// UTILITAIRES
// ============================================================================

export const round2 = (n) => Math.round(n * 100) / 100;

/** Vérifie si un élément possède une image uploadée */
export const hasElementImage = (el) => !!(el && el.image && el.image.path);

/** Un item (zone ou étiquette) porte-t-il une géométrie personnalisée complète ? */
export function hasCustomGeometry(item) {
    return !!item && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(Number(item[k])));
}

/**
 * Borne la géométrie personnalisée d'un item : taille minimale, et item
 * entièrement contenu dans le canvas (même règle WYSIWYG que les hotspots).
 */
export function clampZoneGeometry(item) {
    const width = Math.max(CUSTOM_ZONE_MIN_SIZE_PCT, Math.min(100, Number(item.width)));
    const height = Math.max(CUSTOM_ZONE_MIN_SIZE_PCT, Math.min(100, Number(item.height)));
    const x = Math.max(0, Math.min(100 - width, Number(item.x)));
    const y = Math.max(0, Math.min(100 - height, Number(item.y)));
    return { x: round2(x), y: round2(y), width: round2(width), height: round2(height) };
}

// ============================================================================
// GRILLE ADAPTATIVE POUR LES ZONES
// ============================================================================

/**
 * Grille adaptative pour les zones de dépôt.
 * @param {number} count - Nombre de zones (2-10)
 * @returns {Array<{cols: number}>} - Colonnes par ligne
 */
function getZoneGridLayout(count) {
    switch (count) {
        case 2: return [{ cols: 2 }];
        case 3: return [{ cols: 3 }];
        case 4: return [{ cols: 2 }, { cols: 2 }];
        case 5: return [{ cols: 3 }, { cols: 2 }];
        case 6: return [{ cols: 3 }, { cols: 3 }];
        case 7: return [{ cols: 4 }, { cols: 3 }];
        case 8: return [{ cols: 4 }, { cols: 4 }];
        case 9: return [{ cols: 3 }, { cols: 3 }, { cols: 3 }];
        case 10: return [{ cols: 4 }, { cols: 3 }, { cols: 3 }];
        default: return [{ cols: Math.min(count, 4) }];
    }
}

// ============================================================================
// ALGORITHME DE LAYOUT OPTIMISÉ
//
// Stratégie :
// 1. Calculer combien d'étiquettes par ligne → nombre de lignes → hauteur totale
// 2. Calculer la hauteur nécessaire pour les zones (grille adaptative)
// 3. Hauteur du canvas = zones + séparation + étiquettes + marges
// 4. Selon elementPosition : 'down' = en bas / 'up' = en haut / 'center' = empilées au centre
// ============================================================================

/**
 * Calcule le nombre d'étiquettes par ligne et le nombre de lignes.
 */
function computeElementRowInfo(elementCount, canvasW) {
    if (elementCount === 0) return { perRow: 1, rowCount: 0 };
    const availableW = canvasW - 2 * ELEMENT_SIDE_MARGIN_PX;
    const slotW = ELEMENT_WIDTH_PX + ELEMENT_CHROME_PX + ELEMENT_GAP_PX;
    const perRow = Math.max(1, Math.floor((availableW + ELEMENT_GAP_PX) / slotW));
    const rowCount = Math.ceil(elementCount / perRow);
    return { perRow, rowCount };
}

/**
 * Calcule la hauteur totale occupée par les étiquettes en pixels.
 * Tient compte des éléments image (plus hauts) pour chaque rangée.
 * @param {number} rowCount - Nombre de rangées
 * @param {Array} elements - Tableau des éléments (pour détecter les images)
 * @param {number} perRow - Nombre d'éléments par rangée
 * @returns {{ totalHeight: number, rowHeights: number[] }}
 */
function computeElementAreaHeight(rowCount, elements = [], perRow = 1) {
    if (rowCount === 0) return { totalHeight: 0, rowHeights: [] };

    const rowHeights = [];
    for (let r = 0; r < rowCount; r++) {
        const start = r * perRow;
        const end = Math.min(start + perRow, elements.length);
        let hasImage = false;
        for (let i = start; i < end; i++) {
            if (hasElementImage(elements[i])) { hasImage = true; break; }
        }
        rowHeights.push(hasImage ? IMAGE_ELEMENT_HEIGHT_PX : ELEMENT_HEIGHT_PX);
    }

    const totalHeight = rowHeights.reduce((s, h) => s + h, 0)
        + (rowCount - 1) * ELEMENT_ROW_GAP_PX
        + ELEMENT_BOTTOM_MARGIN_PX;

    return { totalHeight, rowHeights };
}

/**
 * Calcule la hauteur nécessaire pour les zones en pixels.
 * Distribue équitablement la hauteur entre les lignes de la grille.
 */
function computeZoneAreaHeight(zoneCount) {
    if (zoneCount === 0) return 0;
    const layout = getZoneGridLayout(zoneCount);
    const zoneRows = layout.length;
    const zoneRowHeight = ZONE_MIN_HEIGHT_PX;
    return ZONE_TOP_MARGIN_PX
        + zoneRows * zoneRowHeight
        + (zoneRows - 1) * ZONE_ROW_GAP_PX;
}

/**
 * Calcule la hauteur optimale du canvas et les hauteurs de chaque section.
 * @param {Array} elements - Tableau des éléments (pour détecter les images)
 * @param {'up'|'down'|'center'} elemPosition - Position des étiquettes
 * @param {number|null} canvasHOverride - Hauteur imposée en px (mode personnalisé) —
 *   remplace la hauteur auto-calculée, l'espace excédentaire va aux zones comme d'habitude
 */
function computeLayout(elements, zoneCount, canvasW, elemPosition = 'down', canvasHOverride = null) {
    const { perRow, rowCount } = computeElementRowInfo(elements.length, canvasW);
    const zoneAreaH = computeZoneAreaHeight(zoneCount);
    const { totalHeight: elemTotalH, rowHeights } = computeElementAreaHeight(rowCount, elements, perRow);

    if (elemPosition === 'center') {
        // En mode center, les étiquettes flottent par-dessus les zones
        // Le canvas ne réserve pas d'espace vertical pour les étiquettes
        const totalH = canvasHOverride || Math.max(DEFAULT_CANVAS_HEIGHT_MIN, zoneAreaH);
        return {
            canvasH: totalH,
            zoneAreaH: totalH,
            elemAreaH: 0,
            elemPerRow: perRow,
            elemRowCount: rowCount,
            elemRowHeights: rowHeights
        };
    }

    // Hauteur totale = marges + zones + séparation + étiquettes
    const totalH = canvasHOverride || Math.max(
        DEFAULT_CANVAS_HEIGHT_MIN,
        zoneAreaH + ZONE_ELEMENTS_GAP_PX + elemTotalH
    );

    // Si la hauteur est plus grande que le minimum, redistribuer l'espace excédentaire aux zones
    const extraH = totalH - (zoneAreaH + ZONE_ELEMENTS_GAP_PX + elemTotalH);
    const adjustedZoneAreaH = zoneAreaH + Math.max(0, extraH);

    return {
        canvasH: totalH,
        zoneAreaH: adjustedZoneAreaH,
        elemAreaH: elemTotalH,
        elemPerRow: perRow,
        elemRowCount: rowCount,
        elemRowHeights: rowHeights
    };
}

/**
 * Positionne les zones de dépôt dans le canvas.
 * @param {number} yOffsetPx - Décalage vertical supplémentaire en pixels (pour le mode 'up')
 * @returns {Array<{x, y, width, height}>} positions en % du canvas
 */
function computeZonePositions(zoneCount, zoneAreaH, canvasW, canvasH, yOffsetPx = 0) {
    if (zoneCount === 0) return [];

    const layout = getZoneGridLayout(zoneCount);
    const zoneRows = layout.length;

    // Convertir en %
    const topPct = ((ZONE_TOP_MARGIN_PX + yOffsetPx) / canvasH) * 100;
    const gapYPct = (ZONE_ROW_GAP_PX / canvasH) * 100;
    // Écart horizontal : écart voulu + surlargeur du thème (bordures hors width)
    const gapXPct = ((ZONE_GAP_PX + H5P_THEME_CHROME_PX) / canvasW) * 100;
    const sidePct = (ELEMENT_SIDE_MARGIN_PX / canvasW) * 100;

    // Hauteur disponible pour les zones = zoneAreaH - marge haute
    const usableH = zoneAreaH - ZONE_TOP_MARGIN_PX;
    const rowHeightPx = (usableH - (zoneRows - 1) * ZONE_ROW_GAP_PX) / zoneRows;
    const rowHeightPct = (rowHeightPx / canvasH) * 100;

    // Décalage du label : réduire chaque zone de ZONE_LABEL_OFFSET_PX depuis le haut
    const labelOffsetPct = (ZONE_LABEL_OFFSET_PX / canvasH) * 100;

    const positions = [];
    let idx = 0;

    for (let row = 0; row < zoneRows; row++) {
        const cols = layout[row].cols;
        const colWidthPct = (100 - 2 * sidePct - (cols - 1) * gapXPct) / cols;
        const yPct = topPct + row * (rowHeightPct + gapYPct);

        for (let col = 0; col < cols; col++) {
            positions.push({
                x: round2(sidePct + col * (colWidthPct + gapXPct)),
                y: round2(yPct + labelOffsetPct),
                width: round2(colWidthPct),
                height: round2(Math.max(0, rowHeightPct - labelOffsetPct))
            });
            idx++;
            if (idx >= zoneCount) break;
        }
        if (idx >= zoneCount) break;
    }

    return positions;
}

/**
 * Positionne les étiquettes dans le canvas.
 * Gère les hauteurs hétérogènes (texte vs image) grâce à rowHeights.
 * @param {Array} elements - Tableau des éléments (pour détecter les images)
 * @param {number} perRow - Nombre d'éléments par rangée
 * @param {number} canvasW - Largeur du canvas en pixels
 * @param {number} canvasH - Hauteur du canvas en pixels
 * @param {'up'|'down'|'center'} position - 'down' = en bas, 'up' = en haut, 'center' = empilées au centre
 * @param {number[]} rowHeights - Hauteur en pixels de chaque rangée
 * @returns {Array<{x, y, width, height}>} positions en % du canvas
 */
function computeElementPositions(elements, perRow, canvasW, canvasH, position = 'down', rowHeights = []) {
    if (elements.length === 0) return [];

    const elemWPct = (ELEMENT_WIDTH_PX / canvasW) * 100;

    // Mode center : toutes les étiquettes empilées au centre avec léger décalage
    if (position === 'center') {
        const defaultHPct = (ELEMENT_HEIGHT_PX / canvasH) * 100;
        const centerX = (100 - elemWPct) / 2;
        const centerY = (100 - defaultHPct) / 2 + STACK_VERTICAL_SHIFT_PCT;
        const positions = [];
        for (let i = 0; i < elements.length; i++) {
            const thisHPx = hasElementImage(elements[i]) ? IMAGE_ELEMENT_HEIGHT_PX : ELEMENT_HEIGHT_PX;
            positions.push({
                x: round2(centerX + i * STACK_OFFSET_PCT),
                y: round2(centerY + i * STACK_OFFSET_PCT),
                width: round2(elemWPct),
                height: round2((thisHPx / canvasH) * 100)
            });
        }
        return positions;
    }

    // Pas horizontal : écart voulu + surlargeur du thème (poignée + paddings + bordures)
    const gapWPct = ((ELEMENT_GAP_PX + ELEMENT_CHROME_PX) / canvasW) * 100;
    const marginPct = (ELEMENT_BOTTOM_MARGIN_PX / canvasH) * 100;

    const rowCount = Math.ceil(elements.length / perRow);
    const positions = [];
    let idx = 0;

    for (let row = 0; row < rowCount; row++) {
        const elemsThisRow = Math.min(perRow, elements.length - idx);
        // Centrer horizontalement
        const rowWidthPct = elemsThisRow * elemWPct + (elemsThisRow - 1) * gapWPct;
        const startXPct = (100 - rowWidthPct) / 2;

        let yPct;
        if (position === 'up') {
            // Depuis le haut : cumuler les hauteurs des rangées précédentes
            let aboveH = 0;
            for (let r = 0; r < row; r++) {
                aboveH += (rowHeights[r] || ELEMENT_HEIGHT_PX) + ELEMENT_ROW_GAP_PX;
            }
            yPct = marginPct + (aboveH / canvasH) * 100;
        } else {
            // Depuis le bas : cumuler les hauteurs des rangées en dessous
            let belowH = 0;
            for (let r = row + 1; r < rowCount; r++) {
                belowH += (rowHeights[r] || ELEMENT_HEIGHT_PX) + ELEMENT_ROW_GAP_PX;
            }
            const rowHPct = ((rowHeights[row] || ELEMENT_HEIGHT_PX) / canvasH) * 100;
            yPct = 100 - marginPct - rowHPct - (belowH / canvasH) * 100;
        }

        for (let col = 0; col < elemsThisRow; col++) {
            const thisHPx = hasElementImage(elements[idx]) ? IMAGE_ELEMENT_HEIGHT_PX : ELEMENT_HEIGHT_PX;
            positions.push({
                x: round2(startXPct + col * (elemWPct + gapWPct)),
                y: round2(yPct),
                width: round2(elemWPct),
                height: round2((thisHPx / canvasH) * 100)
            });
            idx++;
        }
    }

    return positions;
}

// ============================================================================
// LAYOUT COMPLET (auto + personnalisé) — POINT D'ENTRÉE
// ============================================================================

/**
 * Calcule le layout complet du canvas (dimensions + positions zones/étiquettes en %).
 *
 * Deux modes selon `jsonObj.layoutMode` :
 *   - 'auto' (défaut/absent) : grille adaptative historique ;
 *   - 'custom' : chaque zone ET chaque étiquette utilise ses x/y/width/height (%) si
 *     présents — un item ajouté sans coordonnées retombe sur son emplacement auto (grille
 *     pour les zones, rangées pour les étiquettes) — et la hauteur du canvas peut être
 *     imposée via `canvasHeight` (px).
 *
 * @returns {{canvasW: number, canvasH: number, zonePositions: Array, elemPositions: Array}}
 */
export function computeCanvasLayout(jsonObj) {
    const dropZones = Array.isArray(jsonObj.dropZones) ? jsonObj.dropZones : [];
    const elements = Array.isArray(jsonObj.elements) ? jsonObj.elements : [];

    // Dimensions du canvas : largeur configurable, hauteur auto-calculée
    const canvasW = jsonObj.canvasWidth || DEFAULT_CANVAS_WIDTH;
    const zoneCount = Math.min(dropZones.length, 10);

    // Position des étiquettes : 'up' = en haut, 'down' = en bas (défaut)
    const elemPosition = jsonObj.elementPosition || DEFAULT_ELEMENT_POSITION;
    const isCustom = jsonObj.layoutMode === 'custom';

    // En mode 'up', ajouter une marge supplémentaire sous les étiquettes
    const upExtraGapPx = elemPosition === 'up' ? 10 : 0;

    // Hauteur imposée (mode personnalisé uniquement, bornée)
    let customH = null;
    if (isCustom && Number.isFinite(Number(jsonObj.canvasHeight))) {
        customH = Math.max(CUSTOM_CANVAS_MIN_HEIGHT,
            Math.min(CUSTOM_CANVAS_MAX_HEIGHT, Math.round(Number(jsonObj.canvasHeight))));
    }

    // Layout optimisé (hauteur auto ou imposée, tient compte des images)
    const layout = computeLayout(elements, zoneCount, canvasW, elemPosition,
        customH === null ? null : customH - upExtraGapPx);
    const canvasH = layout.canvasH + upExtraGapPx;

    // Décalage vertical des zones selon la position des étiquettes
    const zoneOffsetPx = elemPosition === 'up'
        ? layout.elemAreaH + ZONE_ELEMENTS_GAP_PX + upExtraGapPx
        : 0;

    // Positions des zones : grille auto, puis substitution des géométries personnalisées
    const autoZonePositions = computeZonePositions(
        zoneCount, layout.zoneAreaH, canvasW, canvasH, zoneOffsetPx
    );
    const zonePositions = isCustom
        ? dropZones.slice(0, zoneCount).map((zone, i) =>
            hasCustomGeometry(zone) ? clampZoneGeometry(zone) : autoZonePositions[i])
        : autoZonePositions;

    // Positions des étiquettes (hauteurs adaptées texte/image), puis substitution des
    // géométries personnalisées — une étiquette jamais déplacée garde son placement auto
    // (le flux reste vivant quand on ajoute/retire des étiquettes).
    const autoElemPositions = computeElementPositions(
        elements, layout.elemPerRow, canvasW, canvasH, elemPosition, layout.elemRowHeights
    );
    const elemPositions = isCustom
        ? autoElemPositions.map((pos, i) =>
            hasCustomGeometry(elements[i]) ? clampZoneGeometry(elements[i]) : pos)
        : autoElemPositions;

    return { canvasW, canvasH, zonePositions, elemPositions };
}
