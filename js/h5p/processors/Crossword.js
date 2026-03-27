/**
 * Processeur H5P — Mots croisés
 *
 * Formate la consigne et les indices supplémentaires (extraClue) en HTML,
 * ajoute UUID et métadonnées H5P.AdvancedText pour chaque indice extra.
 *
 * @module processors/Crossword
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        return {
            ...jsonObj, // Conserve title, words, taskDescription, and overallFeedback
            taskDescription: formatTextToHtml(jsonObj.taskDescription),
            behaviour: {
                enableInstantFeedback: false,
                scoreWords: true,
                applyPenalties: false,
                enableRetry: true,
                enableSolutionsButton: true,
                ...(jsonObj.behaviour || {})
            },
            l10n: {
                across: translations.h5p_crossword_across || "Horizontal",
                down: translations.h5p_crossword_down || "Vertical",
                checkAnswer: translations.h5p_check_answer || "Vérifier",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                extraClue: translations.h5p_crossword_extra_clue || "Indice supplémentaire",
                closeWindow: translations.h5p_close || "Fermer",
                submitAnswer: translations.h5p_submit_answer || "Valider"
            },
            // Thème visuel optionnel (couleurs de la grille + image d'arrière-plan)
            theme: {
                backgroundColor: '#173354',
                gridColor: '#000000',
                cellBackgroundColor: '#ffffff',
                cellColor: '#000000',
                clueIdColor: '#606060',
                cellBackgroundColorHighlight: '#3e8de8',
                cellColorHighlight: '#ffffff',
                clueIdColorHighlight: '#e0e0e0',
                ...((() => { const { _preset, ...rest } = (jsonObj.theme || {}); return rest; })()),
                // Image d'arrière-plan optionnelle
                ...(jsonObj.backgroundImage && jsonObj.backgroundImage.path ? {
                    backgroundImage: {
                        path: jsonObj.backgroundImage.path,
                        mime: jsonObj.backgroundImage.mime || "image/jpeg",
                        copyright: { license: "U" },
                        width: jsonObj.backgroundImage.width || 0,
                        height: jsonObj.backgroundImage.height || 0
                    }
                } : {})
            },
            // Traiter les extraClues pour ajouter les métadonnées nécessaires
            words: (Array.isArray(jsonObj.words) ? jsonObj.words : []).map(word => {
                if (word.extraClue && word.extraClue.params && word.extraClue.params.text) {
                    // Appliquer le formatage sur le texte de l'indice
                    word.extraClue.params.text = formatTextToHtml(word.extraClue.params.text);

                    return {
                        ...word,
                        extraClue: {
                            ...word.extraClue,
                            library: "H5P.AdvancedText 1.1",
                            subContentId: generateUUID(),
                            metadata: {
                                contentType: "Text",
                                license: "U",
                                title: "Extra clue"
                            }
                        }
                    };
                }
                return word;
            })
        };
    }
};
