import { translations } from '../translation.js';
import { formatTextToHtml } from '../utils.js';

export const machineName = 'H5P.Blanks';
export const version = { major: 1, minor: 14 };
export const extraDependencies = [
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 }
];



export default {
    process: (jsonObj) => {
        // Cas spécifique rétrocompatibilité: ancien format avec `textBlocks`
        if (jsonObj.textBlocks) {
            return {
                questions: jsonObj.textBlocks
            };
        }

        // Cas standard
        return {
            text: formatTextToHtml(jsonObj.taskDescription || ""),
            questions: (jsonObj.questions || []).map(q => {
                // On garde les questions telles quelles, car Blanks supporte mal le wrapping auto dans certains cas
                return q;
            }),
            showSolutions: translations.h5p_show_solution || "Afficher les solutions",
            tryAgain: translations.h5p_try_again || "Recommencer",
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            notFilledOut: translations.h5p_blanks_not_filled_out || "Veuillez remplir tous les champs.",
            answerIsCorrect: translations.h5p_blanks_answer_is_correct || "&#039;:ans&#039; est correct",
            answerIsWrong: translations.h5p_blanks_answer_is_wrong || "&#039;:ans&#039; est incorrect",
            answeredCorrectly: translations.h5p_blanks_answered_correctly || "Réponse correcte",
            answeredIncorrectly: translations.h5p_blanks_answered_incorrectly || "Réponse incorrecte",
            solutionLabel: translations.h5p_blanks_solution_label || "Réponse correcte :",
            inputLabel: translations.h5p_blanks_input_label || "Champ @num sur @total",
            inputHasTipLabel: translations.h5p_blanks_input_has_tip_label || "Indice disponible",
            tipLabel: translations.h5p_tip_label || "Indice",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            submitAnswer: translations.h5p_submit_answer || "Valider",
            behaviour: {
                enableSolutionsButton: true,
                autoCheck: true,
                caseSensitive: false,
                showSolutionsRequiresInput: true,
                separateLines: false,
                enableRetry: true,
                confirmCheckDialog: false,
                confirmRetryDialog: false,
                acceptSpellingErrors: false,
                enableCheckButton: true
            },
            confirmCheck: {
                header: translations.h5p_finish_header || "Terminer ?",
                body: translations.h5p_finish_body || "Êtes-vous sûr de vouloir terminer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_finish_label || "Terminer"
            },
            confirmRetry: {
                header: translations.h5p_retry_header || "Recommencer ?",
                body: translations.h5p_retry_body || "Êtes-vous sûr de vouloir recommencer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_retry_confirm_label || "Confirmer"
            },
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_blanks_feedback || "Vous avez @score sur @total blancs corrects."
            }],
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
            a11yCheckingModeHeader: translations.h5p_blanks_checking_mode_header || "Mode de vérification"
        };
    },

    // Méthode pour adapter une question FillInTheBlanks dans un QuizSet
    transformForQuizSet: (question) => {
        if (question.params.taskDescription) {
            question.params.text = formatTextToHtml(question.params.taskDescription);
        }
        question.params.checkAnswer = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain = translations.h5p_try_again || "Recommencer";
        question.params.showSolutions = translations.h5p_show_solution || "Afficher les solutions";
        question.params.scoreBarLabel = translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points";
        question.params.notFilledOut = translations.h5p_blanks_not_filled_out || "Veuillez remplir tous les champs.";
        question.params.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            caseSensitive: false,
            autoCheck: false,
            ...question.params.behaviour
        };
        return question;
    }
};
