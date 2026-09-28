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
import { prepareQuestionMedia } from '../question-media.js';


/**
 * Libellés d'interface de H5P.TrueFalse (bloc `l10n`).
 *
 * Factorisés parce que `process()` (activité autonome) et `transformForQuizSet()`
 * (question DANS un Quiz ou une Vidéo interactive) doivent produire les MÊMES :
 * la voie conteneur omettait les trois chaînes `a11y*`, restées en anglais pour
 * les lecteurs d'écran.
 * @returns {Object}
 */
function libellesL10n() {
    return {
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
    };
}

function feedbacksEffectifs(data) {
    const ranges = Array.isArray(data.overallFeedback) ? data.overallFeedback : [];
    return {
        feedbackOnCorrect: data.feedbackOnCorrect ?? data.behaviour?.feedbackOnCorrect ?? ranges.find(f => Number(f.to) === 100)?.feedback ?? '',
        feedbackOnWrong: data.feedbackOnWrong ?? data.behaviour?.feedbackOnWrong ?? ranges.find(f => Number(f.from) === 0)?.feedback ?? '',
    };
}

const TrueFalse = {
    process: (jsonObj) => {
        if (![true,false,'true','false'].includes(jsonObj.correct)) throw Error('TrueFalse : réponse vraie ou fausse requise.');
        const result = {
            ...jsonObj,
            question: formatTextToHtml(jsonObj.question),
            correct: String(jsonObj.correct), // Ensure it's a string
            l10n: {
                ...libellesL10n(),
                ...(jsonObj.l10n || {})
            },
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                confirmCheckDialog: false,
                confirmRetryDialog: false,
                autoCheck: false,
                enableCheckButton: true,
                ...(jsonObj.behaviour || {}),
                ...feedbacksEffectifs(jsonObj)
            },
            confirmCheck: {
                header: translations.h5p_finish_header || "Terminer ?",
                body: translations.h5p_finish_body || "Êtes-vous sûr de vouloir terminer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_finish_label || "Terminer",
                ...(jsonObj.confirmCheck || {})
            },
            confirmRetry: {
                header: translations.h5p_retry_header || "Recommencer ?",
                body: translations.h5p_retry_body || "Êtes-vous sûr de vouloir recommencer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_retry_confirm_label || "Confirmer",
                ...(jsonObj.confirmRetry || {})
            },
            media: prepareQuestionMedia(jsonObj)
        };
        for (const key of ['feedbackOnCorrect','feedbackOnWrong','overallFeedback','mediaImage','mediaImageAlt']) delete result[key];
        return result;
    },

    transformForQuizSet: (question) => {
        question.params = TrueFalse.process(question.params);
        delete question.params.feedbackOnCorrect;
        delete question.params.feedbackOnWrong;
        delete question.params.overallFeedback;
        return question;
    }
};
export default TrueFalse;
