/**
 * Processeur H5P — Mots croisés
 *
 * Formate la consigne et les indices supplémentaires (extraClue) en HTML,
 * ajoute UUID et métadonnées H5P.AdvancedText pour chaque indice extra.
 *
 * @module processors/Crossword
 * @exports {Object} default.process - Transformation principale
 */
import { prepareQuestionMedia } from '../question-media.js';
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        if(!Array.isArray(jsonObj.words) || jsonObj.words.length<2)throw new Error(translations.h5p_crossword_could_not_generate_too_few_words);
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
                submitAnswer: translations.h5p_submit_answer || "Valider",
                // Messages d'échec de génération de la grille : rendus par la lib
                // à l'affichage, donc à traduire ici comme le reste.
                couldNotGenerateCrossword: translations.h5p_crossword_could_not_generate
                    || "Impossible de générer les mots-croisés avec les mots saisis. Veuillez réessayer avec moins de mots ou utiliser des mots qui ont plus de caractères en commun.",
                couldNotGenerateCrosswordTooFewWords: translations.h5p_crossword_could_not_generate_too_few_words
                    || "Impossible de générer les mots-croisés. Vous devez saisir au moins deux mots.",
                probematicWords: translations.h5p_crossword_problematic_words
                    || "Certains mots n'ont pas pu être placés. Mot(s) problématique(s): @words",
                ...jsonObj.l10n
            },
            // Groupe a11y : lu UNIQUEMENT par les lecteurs d'écran. Il n'était pas
            // écrit du tout, donc une grille française était annoncée en anglais.
            a11y: {
                crosswordGrid: translations.h5p_crossword_a11y_grid
                    || "Utiliser les touches fléchées pour naviguer et les lettres du clavier pour saisir les caractères. Utiliser Tab pour faire usage des champs d'entrée au lieu de la grille.",
                column: translations.h5p_crossword_a11y_column || "Colonne",
                row: translations.h5p_crossword_a11y_row || "Ligne",
                across: translations.h5p_crossword_across || "Horizontal",
                down: translations.h5p_crossword_down || "Vertical",
                empty: translations.h5p_crossword_a11y_empty || "Vide",
                resultFor: translations.h5p_crossword_a11y_result_for || "Résultat pour : @clue",
                correct: translations.h5p_crossword_a11y_correct || "Réponse correcte",
                wrong: translations.h5p_crossword_a11y_wrong || "Faux",
                point: translations.h5p_crossword_a11y_point || "point",
                solutionFor: translations.h5p_crossword_a11y_solution_for || "Pour @clue, la solution est : @solution",
                extraClueFor: translations.h5p_crossword_a11y_extra_clue_for || "Afficher l'indice supplémentaire pour @clue",
                letterSevenOfNine: translations.h5p_crossword_a11y_letter_position || "Lettre @position de @length",
                lettersWord: translations.h5p_crossword_a11y_letters_word || "Mot de @length lettres",
                check: translations.h5p_crossword_a11y_check || "Vérifier les caractères. Les réponses seront marquées correctes, incorrectes ou sans réponse.",
                showSolution: translations.h5p_crossword_a11y_show_solution || "Afficher la solution. Le mot-croisé sera ensuite rempli avec la solution correcte.",
                retry: translations.h5p_crossword_a11y_retry || "Réessayer la tâche. Réinitialiser toutes les réponses et recommencer l'activité.",
                yourResult: translations.h5p_crossword_a11y_your_result || "Vous avez obtenu @score sur @total points.",
                ...jsonObj.a11y
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
                        copyright: jsonObj.backgroundImage.copyright || { license: "U" },
                        width: jsonObj.backgroundImage.width || 0,
                        height: jsonObj.backgroundImage.height || 0
                    }
                } : {})
            },
            // Traiter les extraClues pour ajouter les métadonnées nécessaires
            words: (Array.isArray(jsonObj.words) ? jsonObj.words : []).map(word => {
                if(word.extraClue?.library && !word.extraClue.library.startsWith('H5P.AdvancedText'))return {...word,extraClue:prepareQuestionMedia({media:{type:word.extraClue}})?.type};
                if (word.extraClue && word.extraClue.params && word.extraClue.params.text) {
                    // Appliquer le formatage sur le texte de l'indice
                    word.extraClue.params.text = formatTextToHtml(word.extraClue.params.text);

                    return {
                        ...word,
                        extraClue: {
                            ...word.extraClue,
                            library: "H5P.AdvancedText 1.1",
                            subContentId: word.extraClue.subContentId || generateUUID(),
                            metadata: {
                                contentType: "Text",
                                license: "U",
                                title: "Extra clue",
                                ...word.extraClue.metadata
                            }
                        }
                    };
                }
                return word;
            })
        };
    }
};
