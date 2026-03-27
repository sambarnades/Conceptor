/**
 * Processeur H5P — Glisser-déposer
 *
 * Calcule les dimensions optimales du canvas avec layout adaptatif,
 * positionne les draggables et drop zones en pourcentages, et construit
 * la structure H5P complète avec feedback global.
 *
 * @module processors/DragAndDrop
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';

// ============================================================================
// DIMENSIONS PAR DÉFAUT DU CANVAS (en pixels)
// Positions (x,y) converties en % et dimensions (width,height) en EM pour H5P.
// H5P DragQuestion : style="left:x%;top:y%;width:w em;height:h em"
// fontSize = containerWidth/settingsWidth * 16px → 1em = 16px à taille native.
// ============================================================================

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT_MIN = 500;

// Position des étiquettes : 'up' = en haut, 'down' = en bas, 'center' = empilées au centre
const DEFAULT_ELEMENT_POSITION = 'down';

// Décalage entre chaque étiquette empilée en mode 'center' (en % du canvas)
const STACK_OFFSET_PCT = 0.3;
// Décalage vertical de la pile en mode 'center' (négatif = vers le haut)
const STACK_VERTICAL_SHIFT_PCT = -10;

// ============================================================================
// DIMENSIONS DES ÉTIQUETTES (en pixels)
// ============================================================================

const ELEMENT_WIDTH_PX = 150;
const ELEMENT_HEIGHT_PX = 38;
// Hauteur spécifique pour les étiquettes contenant une image (~3× le texte)
// Largeur identique à ELEMENT_WIDTH_PX pour garder l'alignement en rangée
const IMAGE_ELEMENT_HEIGHT_PX = 110;
const ELEMENT_GAP_PX = 15;           // espacement horizontal entre étiquettes
const ELEMENT_ROW_GAP_PX = 15;       // espacement vertical entre lignes d'étiquettes
const ELEMENT_BOTTOM_MARGIN_PX = 12;  // marge depuis le bas du canvas
const ELEMENT_SIDE_MARGIN_PX = 12;    // marge latérale

// ============================================================================
// ZONES DE DÉPÔT
// ============================================================================

const ZONE_TOP_MARGIN_PX = 10;       // marge depuis le haut du canvas
const ZONE_GAP_PX = 10;              // espacement entre zones
const ZONE_MIN_HEIGHT_PX = 80;       // hauteur minimale d'une zone
const ZONE_ELEMENTS_GAP_PX = 15;     // séparation entre zones et étiquettes
const ZONE_LABEL_OFFSET_PX = 10;     // décalage haut pour compenser le débordement du label

// ============================================================================
// UTILITAIRE
// ============================================================================

const round2 = (n) => Math.round(n * 100) / 100;

/** Vérifie si un élément possède une image uploadée */
const hasElementImage = (el) => el && el.image && el.image.path;

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
    const perRow = Math.max(1, Math.floor((availableW + ELEMENT_GAP_PX) / (ELEMENT_WIDTH_PX + ELEMENT_GAP_PX)));
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
        + (zoneRows - 1) * ZONE_GAP_PX;
}

/**
 * Calcule la hauteur optimale du canvas et les hauteurs de chaque section.
 * @param {Array} elements - Tableau des éléments (pour détecter les images)
 * @param {'up'|'down'|'center'} elemPosition - Position des étiquettes
 */
function computeLayout(elements, zoneCount, canvasW, elemPosition = 'down') {
    const { perRow, rowCount } = computeElementRowInfo(elements.length, canvasW);
    const zoneAreaH = computeZoneAreaHeight(zoneCount);
    const { totalHeight: elemTotalH, rowHeights } = computeElementAreaHeight(rowCount, elements, perRow);

    if (elemPosition === 'center') {
        // En mode center, les étiquettes flottent par-dessus les zones
        // Le canvas ne réserve pas d'espace vertical pour les étiquettes
        const totalH = Math.max(DEFAULT_CANVAS_HEIGHT_MIN, zoneAreaH);
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
    const totalH = Math.max(
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
    const gapYPct = (ZONE_GAP_PX / canvasH) * 100;
    const gapXPct = (ZONE_GAP_PX / canvasW) * 100;
    const sidePct = (ELEMENT_SIDE_MARGIN_PX / canvasW) * 100;

    // Hauteur disponible pour les zones = zoneAreaH - marge haute
    const usableH = zoneAreaH - ZONE_TOP_MARGIN_PX;
    const rowHeightPx = (usableH - (zoneRows - 1) * ZONE_GAP_PX) / zoneRows;
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

    const gapWPct = (ELEMENT_GAP_PX / canvasW) * 100;
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
// PROCESSEUR PRINCIPAL
// ============================================================================

export default {
    process: (jsonObj) => {
        const dropZones = Array.isArray(jsonObj.dropZones) ? jsonObj.dropZones : [];
        const elements = Array.isArray(jsonObj.elements) ? jsonObj.elements : [];

        // Dimensions du canvas : largeur configurable, hauteur auto-calculée
        const canvasW = jsonObj.canvasWidth || DEFAULT_CANVAS_WIDTH;
        const zoneCount = Math.min(dropZones.length, 10);

        // Position des étiquettes : 'up' = en haut, 'down' = en bas (défaut)
        const elemPosition = jsonObj.elementPosition || DEFAULT_ELEMENT_POSITION;

        // Layout optimisé (hauteur calculée automatiquement, tient compte des images)
        const layout = computeLayout(elements, zoneCount, canvasW, elemPosition);

        // En mode 'up', ajouter une marge supplémentaire sous les étiquettes
        const upExtraGapPx = elemPosition === 'up' ? 10 : 0;
        const canvasH = layout.canvasH + upExtraGapPx;

        // Décalage vertical des zones selon la position des étiquettes
        const zoneOffsetPx = elemPosition === 'up'
            ? layout.elemAreaH + ZONE_ELEMENTS_GAP_PX + upExtraGapPx
            : 0;

        // Positions des zones
        const zonePositions = computeZonePositions(
            zoneCount, layout.zoneAreaH, canvasW, canvasH, zoneOffsetPx
        );

        // Positions des étiquettes (hauteurs adaptées texte/image)
        const elemPositions = computeElementPositions(
            elements, layout.elemPerRow, canvasW, canvasH, elemPosition, layout.elemRowHeights
        );

        // Toutes les zones (chaque élément peut être glissé dans n'importe quelle zone)
        const allZoneIndices = Array.from({ length: zoneCount }, (_, i) => String(i));

        // Construction des éléments H5P (draggables)
        const h5pElements = elements.map((el, i) => {
            const pos = elemPositions[i] || { x: 0, y: 90, width: 10, height: 5 };

            // Si l'élément a une image, créer un H5P.Image 1.1 au lieu de AdvancedText
            const isImage = hasElementImage(el);
            const elementType = isImage ? {
                library: "H5P.Image 1.1",
                params: {
                    file: {
                        path: el.image.path,
                        mime: el.image.mime || "image/jpeg",
                        width: el.image.width || 0,
                        height: el.image.height || 0
                    },
                    alt: el.imageAltText || el.text || "",
                    decorative: false
                },
                subContentId: generateUUID(),
                metadata: {
                    contentType: "Image",
                    license: "U",
                    title: "Untitled Image"
                }
            } : {
                library: "H5P.AdvancedText 1.1",
                params: {
                    text: `<p>${formatTextToHtml(el.text || "")}</p>`
                },
                subContentId: generateUUID(),
                metadata: {
                    contentType: "Text",
                    license: "U",
                    title: "Untitled Text"
                }
            };

            return {
                type: elementType,
                x: pos.x,
                y: pos.y,
                width: round2(ELEMENT_WIDTH_PX / 16),
                height: round2((isImage ? IMAGE_ELEMENT_HEIGHT_PX : ELEMENT_HEIGHT_PX) / 16),
                dropZones: allZoneIndices,
                backgroundOpacity: 100,
                multiple: false
            };
        });

        // Construction des zones de dépôt H5P
        const h5pDropZones = dropZones.slice(0, zoneCount).map((zone, zIdx) => {
            const pos = zonePositions[zIdx] || { x: 0, y: 0, width: 30, height: 20 };
            const correctEls = Array.isArray(zone.correctElements)
                ? zone.correctElements.map(idx => String(idx))
                : [];
            return {
                label: `<div>${formatTextToHtml(zone.label || "")}</div>`,
                showLabel: true,
                x: pos.x,
                y: pos.y,
                width: round2((pos.width / 100) * canvasW / 16),
                height: round2((pos.height / 100) * canvasH / 16),
                correctElements: correctEls,
                backgroundOpacity: 100,
                tipsAndFeedback: {
                    tip: "",
                    feedbackOnCorrect: "",
                    feedbackOnIncorrect: ""
                },
                single: false,
                autoAlign: true
            };
        });

        // OverallFeedback — tableau plat attendu par H5P.Question.determineOverallFeedback(feedbacks, ratio)
        const overallFeedback = jsonObj.overallFeedback || [
            { from: 0, to: 10, feedback: "Des efforts sont nécessaires." },
            { from: 11, to: 30, feedback: "Tu y es presque." },
            { from: 31, to: 50, feedback: "C'est un bon début." },
            { from: 51, to: 70, feedback: "Bon travail !" },
            { from: 71, to: 90, feedback: "Très bon score !" },
            { from: 91, to: 100, feedback: "Excellent !" }
        ];

        return {
            title: jsonObj.title || "",
            scoreShow: translations.h5p_check_answer || "Vérifier",
            submit: translations.h5p_submit_answer || "Valider",
            tryAgain: translations.h5p_try_again || "Recommencer",
            scoreExplanation: translations.h5p_drag_drop_score_explanation || "Les bonnes réponses donnent +1 point. Les mauvaises réponses donnent -1 point. Le score minimum est de 0.",
            question: {
                settings: {
                    size: {
                        width: canvasW,
                        height: canvasH
                    },
                    // Image d'arrière-plan optionnelle
                    ...(jsonObj.backgroundImage && jsonObj.backgroundImage.path ? {
                        background: {
                            path: jsonObj.backgroundImage.path,
                            mime: jsonObj.backgroundImage.mime || "image/jpeg",
                            copyright: { license: "U" },
                            width: jsonObj.backgroundImage.width || canvasW,
                            height: jsonObj.backgroundImage.height || canvasH
                        }
                    } : {})
                },
                task: {
                    elements: h5pElements,
                    dropZones: h5pDropZones
                }
            },
            overallFeedback: overallFeedback,
            behaviour: {
                enableRetry: true,
                enableCheckButton: true,
                singlePoint: false,
                applyPenalties: true,
                enableScoreExplanation: true,
                dropZoneHighlighting: "dragging",
                autoAlignSpacing: 2,
                enableFullScreen: true,
                showScorePoints: true,
                showTitle: true,
                ...(jsonObj.behaviour || {})
            },
            localize: {
                fullscreen: translations.h5p_fullscreen || "Plein écran",
                exitFullscreen: translations.h5p_exit_fullscreen || "Quitter le plein écran"
            },
            grabbablePrefix: translations.h5p_drag_drop_grabbable_prefix || "Élément déplaçable {num} sur {total}.",
            grabbableSuffix: translations.h5p_drag_drop_grabbable_suffix || "Placé dans la zone de dépôt {num}.",
            dropzonePrefix: translations.h5p_drag_drop_dropzone_prefix || "Zone de dépôt {num} sur {total}.",
            noDropzone: translations.h5p_drag_drop_no_dropzone || "Pas de zone de dépôt.",
            tipLabel: translations.h5p_tip_label || "Voir l'indice.",
            tipAvailable: translations.h5p_drag_drop_tip_available || "Indice disponible",
            correctAnswer: translations.h5p_correct_text || "Bonne réponse",
            wrongAnswer: translations.h5p_incorrect_text || "Mauvaise réponse",
            feedbackHeader: translations.h5p_drag_drop_feedback_header || "Résultat",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            scoreExplanationButtonLabel: translations.h5p_drag_drop_score_explanation_btn || "Voir l'explication du score",
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
        };
    },

    /**
     * Transformation pour intégration comme sous-question dans un QuizSet ou CoursePresentation.
     * Force la position 'center' par défaut pour les conteneurs contraints (CP, QuizSet)
     * car 'down' place les étiquettes en bas du canvas, hors zone visible dans un conteneur réduit.
     * @param {Object} question - L'objet question contenant { library, params, metadata, subContentId }
     * @returns {Object} La question modifiée avec params transformés en structure H5P complète
     */
    transformForQuizSet(question) {
        question.params = this.process(question.params);
        // Désactiver le plein écran en contexte imbriqué (CP/QuizSet gèrent leur propre plein écran)
        if (question.params.behaviour) {
            question.params.behaviour.enableFullScreen = false;
        }
        return question;
    }
};
