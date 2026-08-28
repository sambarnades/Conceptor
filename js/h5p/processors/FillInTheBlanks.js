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
import { buildMediaStructure } from '../image-manager.js';

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

export default {
    process: (jsonObj) => {
        // Cas spécifique rétrocompatibilité: ancien format avec `textBlocks`
        if (jsonObj.textBlocks) {
            return {
                questions: jsonObj.textBlocks
            };
        }

        // Cas standard — on nettoie le taskDescription si le LLM y a mis des marqueurs de trous *mot*
        let taskDesc = jsonObj.taskDescription || "";
        const blanksPattern = /\*[^*]+\*/g;
        const blanksMatches = taskDesc.match(blanksPattern);
        if (blanksMatches && blanksMatches.length > 0) {
            // Supprime les astérisques autour des mots (conserve le mot en texte brut)
            taskDesc = taskDesc.replace(blanksPattern, match => match.slice(1, -1));
        }

        return {
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt),
            text: formatTextToHtml(taskDesc),
            questions: (jsonObj.questions || []).map(q => {
                // H5P.Blanks attend des strings avec marqueurs *mot* — normalise si l'IA a généré des objets
                if (typeof q === 'string') return q;
                if (typeof q === 'object' && q !== null) return q.text || q.question || '';
                return String(q);
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
                enableCheckButton: true,
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
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_blanks_feedback || "Vous avez @score sur @total blancs corrects."
            }],
            ...libelles()
        };
    },

    // Méthode pour adapter une question FillInTheBlanks dans un QuizSet
    transformForQuizSet: (question) => {
        if (question.params.taskDescription) {
            question.params.text = formatTextToHtml(question.params.taskDescription);
        }
        Object.assign(question.params, libelles());
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
