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
import { formatTextToHtml, generateUUID } from '../../core/utils.js';

/** Les anciens jetons Caramel (@slide, @total, @question) → ceux de la bibliothèque (:num, :total). */
const jetonsSingleChoice = texte => texte && texte.replaceAll('@slide', ':num').replaceAll('@total', ':total').replaceAll('@question', ':num');


export default {
    process: (jsonObj) => {
        if (!Array.isArray(jsonObj.choices) || !jsonObj.choices.length) throw Error('SingleChoiceSet : au moins une question est requise.');
        for (const choice of jsonObj.choices) {
            if (!Array.isArray(choice.answers) || choice.answers.length < 2 || choice.answers.length > 4) throw Error('SingleChoiceSet : chaque question exige deux à quatre réponses.');
        }
        return {
            ...jsonObj,
            choices: (Array.isArray(jsonObj.choices) ? jsonObj.choices : []).map(choice => ({
                ...choice,
                question: formatTextToHtml(choice.question || ''),
                answers: (Array.isArray(choice.answers) ? choice.answers : []).map(a =>
                    typeof a === 'string' ? formatTextToHtml(a) : a
                ),
                subContentId: choice.subContentId || generateUUID()
            })),
            overallFeedback: jsonObj.overallFeedback || [{ "from": 0, "to": 100, "feedback": "You got :numcorrect of :maxscore correct" }],
            behaviour: {
                timeoutCorrect: 2000,
                timeoutWrong: 3000,
                soundEffectsEnabled: true,
                enableRetry: true,
                enableSolutionsButton: true,
                passPercentage: 100,
                autoContinue: true,
                ...(jsonObj.behaviour || {})
            },
            l10n: {
                retryButtonLabel: translations.h5p_try_again || "Recommencer",
                solutionViewTitle: translations.h5p_single_choice_solution_view_title || "Solution",
                correctText: translations.h5p_correct_text || "Correct !",
                incorrectText: translations.h5p_incorrect_text || "Incorrect !",
                muteButtonLabel: translations.h5p_single_choice_mute_button_label || "Désactiver le son",
                closeButtonLabel: translations.h5p_close || "Fermer",
                // Jetons imposés par la lib : `:num` / `:total` (et non @slide/@total,
                // qui s'affichaient en clair à l'élève). Réparés aussi sur la traduction :
                // les 12 locales écrivaient @slide/@total, et le lecteur d'écran annonçait
                // « Diapositive @slide sur @total » (zone aria-live).
                slideOfTotal: jetonsSingleChoice(translations.h5p_single_choice_slide_of_total) || "Diapositive :num sur :total",
                nextButtonLabel: translations.h5p_next || "Suivant",
                scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
                solutionListQuestionNumber: jetonsSingleChoice(translations.h5p_single_choice_solution_list_question_number) || "Question :num",
                a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
                a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
                shouldSelect: translations.h5p_single_choice_should_select || "Devrait sélectionner",
                shouldNotSelect: translations.h5p_single_choice_should_not_select || "Ne devrait pas sélectionner",
                // Depuis H5P.SingleChoiceSet 1.11.88 (design system `h5p-theme`) :
                // navigation et écran de résultats refondus, 7 libellés neufs.
                // `showSolutionButtonLabel` a disparu des semantics en échange.
                nextButton: translations.h5p_next || "Suivant",
                showResultsButtonLabel: translations.h5p_show_results || "Montrer les résultats",
                resultHeader: translations.h5p_result_header || "Votre résultat :",
                totalScore: translations.h5p_total_score || ":score bonnes réponses sur :maxScore",
                resultTableHeader: translations.h5p_result_table_header || "Question",
                resultScoreTableHeader: translations.h5p_score_header || "Score",
                correctAnswerIntroduction: translations.h5p_correct_answer_intro || "Bonne réponse",
                ...(jsonObj.l10n || {}),
                // Réparer les anciens jetons Caramel, tout en conservant les traductions personnalisées.
                ...(jsonObj.l10n?.slideOfTotal ? {slideOfTotal: jetonsSingleChoice(jsonObj.l10n.slideOfTotal)} : {}),
                ...(jsonObj.l10n?.solutionListQuestionNumber ? {solutionListQuestionNumber: jetonsSingleChoice(jsonObj.l10n.solutionListQuestionNumber)} : {})
            }
        };
    }
};
