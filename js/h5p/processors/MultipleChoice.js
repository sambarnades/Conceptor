/**
 * Processeur H5P — Choix multiples
 *
 * Formate question et réponses en HTML, ajoute traductions UI et comportement
 * (mélange des réponses, feedback, etc.).
 *
 * @module processors/MultipleChoice
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';
import { buildMediaStructure } from '../image-manager.js';


export default {
    process: (jsonObj) => {
        return {
            ...jsonObj, // Conserve la question, les réponses et le overallFeedback
            question: formatTextToHtml(jsonObj.question),
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt),
            answers: (Array.isArray(jsonObj.answers) ? jsonObj.answers : []).map(answer => ({
                ...answer,
                text: formatTextToHtml(answer.text)
            })),
            UI: {
                checkAnswerButton: translations.h5p_check_answer || "Vérifier",
                showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
                tryAgainButton: translations.h5p_try_again || "Recommencer",
                submitAnswerButton: translations.h5p_submit_answer || "Valider",
                scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points"
            },
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                type: 'auto',
                singlePoint: false,
                randomAnswers: true,
                showSolutionsRequiresInput: true,
                confirmCheckDialog: false,
                confirmRetryDialog: false,
                autoCheck: false,
                passPercentage: 50,
                showScorePoints: true,
                ...(jsonObj.behaviour || {})
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
            overallFeedback: jsonObj.overallFeedback || [
                { from: 0, to: 100, feedback: "" }
            ]
        };
    },

    transformForQuizSet: (question) => {
        question.params.UI = {
            checkAnswerButton: translations.h5p_check_answer || "Vérifier",
            showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
            tryAgainButton: translations.h5p_try_again || "Recommencer",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            submitAnswerButton: translations.h5p_submit_answer || "Valider",
            tipsLabel: translations.h5p_tip_label || "Indice",
            tipAvailable: translations.h5p_blanks_input_has_tip_label || "Indice disponible",
            feedbackAvailable: translations.h5p_quiz_feedback_available || "Feedback disponible",
            readFeedback: translations.h5p_quiz_read_feedback || "Lire le commentaire",
            wrongAnswer: translations.h5p_quiz_wrong_answer || "Mauvaise réponse",
            correctAnswer: translations.h5p_quiz_correct_answer || "Bonne réponse",
            shouldCheck: translations.h5p_quiz_should_check || "Il fallait cocher ici",
            shouldNotCheck: translations.h5p_quiz_should_not_check || "Il ne fallait pas cocher ici !",
            noInput: translations.h5p_quiz_no_input || "Répondez s'il vous plait avant de visionner la solution.",
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
            ...question.params.UI
        };

        // Added: Ensure text formatting is applied
        question.params.question = formatTextToHtml(question.params.question);
        if (question.params.answers) {
            question.params.answers = question.params.answers.map(a => ({
                ...a,
                text: formatTextToHtml(a.text)
            }));
        }

        question.params.behaviour = {
            type: "auto",
            singleAnswer: true,
            enableRetry: true,
            enableSolutionsButton: true,
            randomAnswers: true,
            ...question.params.behaviour
        };
        if (question.params.answers) {
            question.params.answers.forEach(a => {
                a.tipsAndFeedback = { tip: "", chosenFeedback: "", notChosenFeedback: "", ...a.tipsAndFeedback };
            });
        }
        return question;
    }
};
