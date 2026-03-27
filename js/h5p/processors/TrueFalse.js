/**
 * Processeur H5P — Vrai/Faux
 *
 * Convertit les valeurs vrai/faux en chaînes, formate la question en HTML,
 * ajoute traductions UI et comportement. transformForQuizSet adapte
 * overallFeedback en feedbacks ciblés vrai/faux.
 *
 * @module processors/TrueFalse
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation avec feedbacks ciblés
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';
import { buildMediaStructure } from '../image-manager.js';


export default {
    process: (jsonObj) => {
        return {
            ...jsonObj,
            question: formatTextToHtml(jsonObj.question),
            correct: String(jsonObj.correct), // Ensure it's a string
            l10n: {
                trueText: translations.h5p_true_false_true_text || "Vrai",
                falseText: translations.h5p_true_false_false_text || "Faux",
                score: translations.h5p_score || "Vous avez obtenu @score sur @total points",
                checkAnswer: translations.h5p_check_answer || "Vérifier",
                showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
                tryAgain: translations.h5p_try_again || "Recommencer",
                wrongAnswerMessage: translations.h5p_true_false_wrong_answer_message || "Mauvaise réponse",
                correctAnswerMessage: translations.h5p_true_false_correct_answer_message || "Bonne réponse",
                scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
                submitAnswer: translations.h5p_submit_answer || "Valider",
                a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
                a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
                a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
            },
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                confirmCheckDialog: false,
                confirmRetryDialog: false,
                autoCheck: false,
                enableCheckButton: true,
                feedbackOnCorrect: jsonObj.feedbackOnCorrect,
                feedbackOnWrong: jsonObj.feedbackOnWrong,
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
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt)
        };
    },

    transformForQuizSet: (question) => {
        // Déplacer les feedbacks au bon endroit (venant de la racine params si présents)
        if (question.params.feedbackOnCorrect || question.params.feedbackOnWrong) {
            question.params.behaviour = question.params.behaviour || {};
            question.params.behaviour.feedbackOnCorrect = question.params.feedbackOnCorrect;
            question.params.behaviour.feedbackOnWrong = question.params.feedbackOnWrong;
            delete question.params.feedbackOnCorrect;
            delete question.params.feedbackOnWrong;
        }

        // Added: Ensure text formatting is applied
        question.params.question = formatTextToHtml(question.params.question);

        // Si overallFeedback est présent (généré par l'IA sous forme de plages), on le transforme
        // pour True/False qui ne supporte que feedbackOnCorrect et feedbackOnWrong
        if (question.params.overallFeedback && Array.isArray(question.params.overallFeedback)) {
            const feedbacks = question.params.overallFeedback;
            // On cherche le feedback pour l'échec (0%)
            const wrongFeedback = feedbacks.find(f => f.from === 0);
            if (wrongFeedback && wrongFeedback.feedback) {
                question.params.behaviour = question.params.behaviour || {};
                question.params.behaviour.feedbackOnWrong = wrongFeedback.feedback;
            }
            // On cherche le feedback pour la réussite (100%)
            const correctFeedback = feedbacks.find(f => f.to === 100);
            if (correctFeedback && correctFeedback.feedback) {
                question.params.behaviour = question.params.behaviour || {};
                question.params.behaviour.feedbackOnCorrect = correctFeedback.feedback;
            }
            // On supprime l'original car True/False ne le gère pas
            delete question.params.overallFeedback;
        }

        // Ajouter les traductions de l'interface
        question.params.l10n = {
            trueText: translations.h5p_true_false_true_text || "Vrai",
            falseText: translations.h5p_true_false_false_text || "Faux",
            score: translations.h5p_score || "Vous avez obtenu @score sur @total points",
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
            tryAgain: translations.h5p_try_again || "Recommencer",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            submitAnswer: translations.h5p_submit_answer || "Valider",
            wrongAnswerMessage: translations.h5p_true_false_wrong_answer_message || "Mauvaise réponse",
            correctAnswerMessage: translations.h5p_true_false_correct_answer_message || "Bonne réponse",
            ...question.params.l10n
        };

        // Nettoyer et définir le comportement
        question.params.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            enableCheckButton: true,
            confirmCheckDialog: false,
            confirmRetryDialog: false,
            autoCheck: false,
            ...question.params.behaviour
        };

        return question;
    }
};
