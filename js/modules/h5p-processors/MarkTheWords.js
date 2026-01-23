import { translations } from '../translation.js';
import { formatTextToHtml } from '../utils.js';

export const machineName = 'H5P.MarkTheWords';
export const version = { major: 1, minor: 11 };
export const extraDependencies = [
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 }
];

export default {
    process: (jsonObj) => {
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription || ""),
            textField: jsonObj.textField,
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                enableCheckButton: true,
                showScorePoints: true
            },
            overallFeedback: jsonObj.overallFeedback || [{ "from": 0, "to": 100, "feedback": "You got @score of @total points." }],
            checkAnswerButton: translations.h5p_check_answer || "Vérifier",
            tryAgainButton: translations.h5p_try_again || "Recommencer",
            showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
            correctAnswer: translations.h5p_mark_words_correct_answer || "Correct !",
            incorrectAnswer: translations.h5p_mark_words_incorrect_answer || "Incorrect !",
            missedAnswer: translations.h5p_mark_words_missed_answer || "Manqué !",
            displaySolutionDescription: translations.h5p_mark_words_display_solution_description || "La tâche est mise à jour pour contenir la solution.",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            submitAnswerButton: translations.h5p_submit_answer || "Valider",
            a11yFullTextLabel: translations.h5p_mark_words_a11y_full_text_label || "Texte complet lisible",
            a11yClickableTextLabel: translations.h5p_mark_words_a11y_clickable_text_label || "Texte complet où les mots peuvent être marqués",
            media: {
                "disableImageZooming": false
            },
            a11ySolutionModeHeader: translations.h5p_mark_words_a11y_solution_mode_header || "Mode solution",
            a11yCheckingHeader: translations.h5p_mark_words_a11y_checking_header || "Mode de vérification",
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
        };
    },

    transformForQuizSet: (question) => {
        question.params.checkAnswerButton = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgainButton = translations.h5p_try_again || "Recommencer";
        question.params.showSolutionButton = translations.h5p_show_solution || "Afficher la solution";
        question.params.scoreBarLabel = translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points";
        question.params.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            ...question.params.behaviour
        };
        return question;
    }
};
