/**
 * Processeur H5P — Texte à trous
 *
 * Produit des questions à remplir avec comportement complet, traductions
 * et gestion des dialogues de confirmation. Gère la rétrocompatibilité
 * avec l'ancien format textBlocks.
 *
 * @module processors/FillInTheBlanks
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';
import { prepareQuestionMedia } from '../question-media.js';

/**
 * Libellés d'interface de H5P.Blanks.
 *
 * Factorisés parce que `process()` (activité autonome) et `transformForQuizSet()`
 * (question DANS un Quiz ou une Vidéo interactive) doivent produire les MÊMES :
 * la voie conteneur omettait les quatre chaînes `a11y*`, restées en anglais pour
 * les lecteurs d'écran.
 * @returns {Object}
 */
function libelles() {
    return {
        checkAnswer: translations.h5p_check_answer || "Vérifier",
        tryAgain: translations.h5p_try_again || "Recommencer",
        showSolutions: translations.h5p_show_solution || "Afficher les solutions",
        scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
        notFilledOut: translations.h5p_blanks_not_filled_out || "Veuillez remplir tous les champs.",
        a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
        a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
        a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
        a11yCheckingModeHeader: translations.h5p_blanks_checking_mode_header || "Mode de vérification",
        // DÉFAUT AMONT (H5P.Blanks 1.14.37) : les semantics déclarent
        // `a11yCheckingModeHeader`, mais le code lit `params.a11yHeader`
        // (blanks.js:203) — clé absente des semantics. La valeur française
        // partait donc à la poubelle et les lecteurs d'écran annonçaient
        // « Checking mode ». On alimente LES DEUX, en attendant un correctif amont.
        a11yHeader: translations.h5p_blanks_checking_mode_header || "Mode de vérification"
    };
}

const FillInTheBlanks = {
    process: (jsonObj) => {
        jsonObj = {...jsonObj, questions:jsonObj.questions || jsonObj.textBlocks || []};
        if (!Array.isArray(jsonObj.questions) || !jsonObj.questions.length) throw Error('Blanks : un paragraphe à compléter est requis.');

        // Cas standard — on nettoie le taskDescription si le LLM y a mis des marqueurs de trous *mot*
        let taskDesc = jsonObj.taskDescription ?? jsonObj.text ?? "";
        const blanksPattern = /\*[^*]+\*/g;
        const blanksMatches = taskDesc.match(blanksPattern);
        if (blanksMatches && blanksMatches.length > 0) {
            // Supprime les astérisques autour des mots (conserve le mot en texte brut)
            taskDesc = taskDesc.replace(blanksPattern, match => match.slice(1, -1));
        }

        return {
            media: prepareQuestionMedia(jsonObj),
            text: formatTextToHtml(taskDesc),
            questions: (jsonObj.questions || []).map(q => {
                // H5P.Blanks attend des strings avec marqueurs *mot* — normalise si l'IA a généré des objets
                if (typeof q === 'string') return q;
                if (typeof q === 'object' && q !== null) return q.text || q.question || '';
                return String(q);
            }),
            showSolutions: jsonObj.showSolutions ?? (translations.h5p_show_solution || "Afficher les solutions"),
            tryAgain: jsonObj.tryAgain ?? (translations.h5p_try_again || "Recommencer"),
            checkAnswer: jsonObj.checkAnswer ?? (translations.h5p_check_answer || "Vérifier"),
            notFilledOut: jsonObj.notFilledOut ?? (translations.h5p_blanks_not_filled_out || "Veuillez remplir tous les champs."),
            answerIsCorrect: jsonObj.answerIsCorrect ?? (translations.h5p_blanks_answer_is_correct || "&#039;:ans&#039; est correct"),
            answerIsWrong: jsonObj.answerIsWrong ?? (translations.h5p_blanks_answer_is_wrong || "&#039;:ans&#039; est incorrect"),
            answeredCorrectly: jsonObj.answeredCorrectly ?? (translations.h5p_blanks_answered_correctly || "Réponse correcte"),
            answeredIncorrectly: jsonObj.answeredIncorrectly ?? (translations.h5p_blanks_answered_incorrectly || "Réponse incorrecte"),
            solutionLabel: jsonObj.solutionLabel ?? (translations.h5p_blanks_solution_label || "Réponse correcte :"),
            inputLabel: jsonObj.inputLabel ?? (translations.h5p_blanks_input_label || "Champ @num sur @total"),
            inputHasTipLabel: jsonObj.inputHasTipLabel ?? (translations.h5p_blanks_input_has_tip_label || "Indice disponible"),
            tipLabel: jsonObj.tipLabel ?? (translations.h5p_tip_label || "Indice"),
            scoreBarLabel: jsonObj.scoreBarLabel ?? (translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points"),
            submitAnswer: jsonObj.submitAnswer ?? (translations.h5p_submit_answer || "Valider"),
            behaviour: {
                enableSolutionsButton: true,
                autoCheck: false,
                caseSensitive: true,
                showSolutionsRequiresInput: true,
                separateLines: false,
                enableRetry: true,
                allowRetryIfCorrect: false,
                confirmCheckDialog: false,
                confirmRetryDialog: false,
                acceptSpellingErrors: false,
                enableCheckButton: true,
                ...(jsonObj.behaviour || {})
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
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_blanks_feedback || "Vous avez @score sur @total blancs corrects."
            }],
            ...Object.fromEntries(Object.entries(libelles()).map(([key, value]) => [key,jsonObj[key] ?? value]))
        };
    },

    // Méthode pour adapter une question FillInTheBlanks dans un QuizSet
    transformForQuizSet: (question) => {
        question.params = {...question.params, ...FillInTheBlanks.process(question.params)};
        delete question.params.taskDescription;
        return question;
    }
};
export default FillInTheBlanks;
