import { translations } from '../translation.js';
import { formatTextToHtml } from '../utils.js';


export const machineName = 'H5P.SortParagraphs';
export const version = { major: 0, minor: 11 };
export const extraDependencies = [
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
];

export default {
    process: (jsonObj) => {
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription),
            paragraphs: jsonObj.paragraphs.map(p => formatTextToHtml(p)),
            overallFeedback: jsonObj.overallFeedback || [{ "from": 0, "to": 100 }],
            behaviour: {
                scoringMode: "transitions",
                applyPenalties: true,
                duplicatesInterchangeable: true,
                enableRetry: true,
                enableSolutionsButton: true,
                addButtonsForMovement: true
            },
            l10n: {
                checkAnswer: translations.h5p_check_answer || "Vérifier",
                submitAnswer: translations.h5p_submit_answer || "Valider",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                up: translations.h5p_sort_paragraphs_up || "Monter",
                down: translations.h5p_sort_paragraphs_down || "Descendre",
                disabled: translations.h5p_sort_paragraphs_disabled || "Désactivé",
                resume: translations.h5p_resume || "Reprendre",
                audioDirection: translations.h5p_audio_direction || "Direction de l'audio"
            },
            a11y: {
                check: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
                showSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
                retry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
                yourResult: translations.h5p_essay_ariaYourResult || "Vous avez obtenu @score sur @total points",
                paragraph: translations.h5p_sort_paragraphs_paragraph || "Paragraphe",
                correct: translations.h5p_correct_text || "Correct !",
                wrong: translations.h5p_incorrect_text || "Incorrect !",
                point: translations.h5p_sort_paragraphs_point || "@score point",
                sevenOfNine: translations.h5p_sort_paragraphs_seven_of_nine || "@current sur @total",
                currentPosition: translations.h5p_sort_paragraphs_current_position || "Position actuelle dans la liste",
                instructionsSelected: translations.h5p_sort_paragraphs_instructions_selected || "Appuyez sur la barre d'espace pour réorganiser",
                instructionsGrabbed: translations.h5p_sort_paragraphs_instructions_grabbed || "Appuyez sur les flèches haut et bas pour changer de position, sur la barre d'espace pour déposer, sur échap pour annuler",
                grabbed: translations.h5p_sort_paragraphs_grabbed || "Saisi",
                moved: translations.h5p_sort_paragraphs_moved || "Déplacé",
                dropped: translations.h5p_sort_paragraphs_dropped || "Déposé",
                reorderCancelled: translations.h5p_sort_paragraphs_reorder_cancelled || "Réorganisation annulée",
                finalPosition: translations.h5p_sort_paragraphs_final_position || "Position finale",
                nextParagraph: translations.h5p_sort_paragraphs_next_paragraph || "Paragraphe suivant",
                correctParagraph: translations.h5p_sort_paragraphs_correct_paragraph || "Paragraphe correct à la position",
                listDescription: translations.h5p_sort_paragraphs_list_description || "Liste de paragraphes triables.",
                listDescriptionCheckAnswer: translations.h5p_sort_paragraphs_list_description_check || "Liste de paragraphes avec résultats.",
                listDescriptionShowSolution: translations.h5p_sort_paragraphs_list_description_solution || "Liste de paragraphes avec solutions."
            }
        };
    }
};
