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
import { computeCanvasLayout, hasElementImage, round2 } from '../../editor/dragdrop-layout-model.js';

// Toute la MATH de layout (grille auto, mode personnalisé, surlargeur du thème H5P)
// vit dans js/editor/dragdrop-layout-model.js — fichier PARTAGÉ byte-identique avec
// Sucrerie (qui l'utilise pour sa reconstruction au save et sa pré-détection d'import).
// Ce processeur ne garde que l'ASSEMBLAGE du content.json (libellés, i18n, feedback).

// Ré-export : l'éditeur (index.js) injecte cette fonction dans le panneau de disposition.
export { computeCanvasLayout };

// ============================================================================
// PROCESSEUR PRINCIPAL
// ============================================================================

export default {
    process: (jsonObj) => {
        const dropZones = Array.isArray(jsonObj.dropZones) ? jsonObj.dropZones : [];
        const elements = Array.isArray(jsonObj.elements) ? jsonObj.elements : [];
        const zoneCount = Math.min(dropZones.length, 10);

        const { canvasW, canvasH, zonePositions, elemPositions } = computeCanvasLayout(jsonObj);

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

            if (el._native?.type) {
              const original = el._native.type;
              if (original.library?.split(' ')[0] === elementType.library.split(' ')[0]) {
                elementType.subContentId = original.subContentId || elementType.subContentId;
                elementType.metadata = { ...original.metadata };
                elementType.params = { ...original.params, ...elementType.params };
                if (isImage) {
                  elementType.params.file = { ...original.params?.file, ...elementType.params.file };
                  elementType.params.decorative = original.params?.decorative ?? false;
                }
              }
            }
            // Dimensions en em dérivées de la position calculée (% → px → em). En layout auto,
            // pos.width/height valent exactement ELEMENT_WIDTH_PX / ELEMENT_HEIGHT_PX (ou
            // IMAGE_ELEMENT_HEIGHT_PX) convertis en % : le résultat est identique à l'historique.
            // En layout personnalisé, l'étiquette redimensionnée dans l'éditeur est respectée.
            const nat = el._native || {};
            return {
                type: elementType,
                x: pos.x,
                y: pos.y,
                width: round2((pos.width / 100) * canvasW / 16),
                height: round2((pos.height / 100) * canvasH / 16),
                dropZones: Array.isArray(el.allowedZones) ? el.allowedZones.map(String) : Array.isArray(nat.dropZones) ? nat.dropZones.map(String) : allZoneIndices,
                backgroundOpacity: nat.backgroundOpacity ?? 100,
                multiple: nat.multiple ?? false
            };
        });

        // Construction des zones de dépôt H5P
        const h5pDropZones = dropZones.slice(0, zoneCount).map((zone, zIdx) => {
            const pos = zonePositions[zIdx] || { x: 0, y: 0, width: 30, height: 20 };
            const correctEls = Array.isArray(zone.correctElements)
                ? zone.correctElements.map(idx => String(idx))
                : [];
            const nat = zone._native || {};
            return {
                label: `<div>${formatTextToHtml(zone.label || "")}</div>`,
                showLabel: nat.showLabel ?? true,
                x: pos.x,
                y: pos.y,
                width: round2((pos.width / 100) * canvasW / 16),
                height: round2((pos.height / 100) * canvasH / 16),
                correctElements: correctEls,
                backgroundOpacity: nat.backgroundOpacity ?? 100,
                tipsAndFeedback: nat.tipsAndFeedback || {
                    tip: "",
                    feedbackOnCorrect: "",
                    feedbackOnIncorrect: ""
                },
                single: nat.single ?? false,
                autoAlign: nat.autoAlign ?? true
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

        const result = {
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
        const original = jsonObj._nativeRoot || {};
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'string' && typeof original[key] === 'string' && key !== 'title') result[key] = original[key];
        }
        result.localize = { ...result.localize, ...original.localize };
        return { ...original, ...result };
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
