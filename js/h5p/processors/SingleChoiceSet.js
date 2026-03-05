/**
 * Processeur H5P — Série de choix uniques
 *
 * Ajoute UUID aux choix, configure le comportement (timeouts, sons,
 * passage automatique) et ajoute traductions complètes (boutons,
 * labels, accessibilité).
 *
 * @module processors/SingleChoiceSet
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { generateUUID } from '../../core/utils.js';


export default {
    process: (jsonObj) => {
        return {
            choices: (Array.isArray(jsonObj.choices) ? jsonObj.choices : []).map(choice => ({
                ...choice,
                subContentId: generateUUID()
            })),
            overallFeedback: jsonObj.overallFeedback || [{ "from": 0, "to": 100, "feedback": "You got :numcorrect of :maxscore correct" }],
            behaviour: {
                timeoutCorrect: 1000,
                timeoutWrong: 1000,
                soundEffectsEnabled: true,
                enableRetry: true,
                enableSolutionsButton: true,
                passPercentage: 100,
                autoContinue: true
            },
            l10n: {
                showSolutionButtonLabel: translations.h5p_show_solution || "Afficher la solution",
                retryButtonLabel: translations.h5p_try_again || "Recommencer",
                solutionViewTitle: translations.h5p_single_choice_solution_view_title || "Solution",
                correctText: translations.h5p_correct_text || "Correct !",
                incorrectText: translations.h5p_incorrect_text || "Incorrect !",
                muteButtonLabel: translations.h5p_single_choice_mute_button_label || "Désactiver le son",
                closeButtonLabel: translations.h5p_close || "Fermer",
                slideOfTotal: translations.h5p_single_choice_slide_of_total || "Diapositive @slide sur @total",
                nextButtonLabel: translations.h5p_next || "Suivant",
                scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
                solutionListQuestionNumber: translations.h5p_single_choice_solution_list_question_number || "Question @question",
                a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
                a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
                shouldSelect: translations.h5p_single_choice_should_select || "Devrait sélectionner",
                shouldNotSelect: translations.h5p_single_choice_should_not_select || "Ne devrait pas sélectionner"
            }
        };
    }
};
