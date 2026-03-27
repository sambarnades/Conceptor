/**
 * Processeur H5P — Résumé
 *
 * Génère des affirmations à évaluer avec UUID uniques par résumé,
 * comportement d'essai/solution et feedback global personnalisé.
 *
 * @module processors/Summary
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';


export default {
    process: (jsonObj) => {
        return {
            intro: jsonObj.intro || translations.h5p_summary_intro || "Choisissez l'affirmation correcte.",
            summaries: (Array.isArray(jsonObj.summaries) ? jsonObj.summaries : []).map(s => ({
                ...s,
                summary: Array.isArray(s.summary) ? s.summary.map(text => formatTextToHtml(text)) : s.summary,
                subContentId: generateUUID(),
                tip: s?.tip || ""
            })),
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                passPercentage: 50,
                ...(jsonObj.behaviour || {})
            },
            solvedLabel: translations.h5p_summary_solved_label || "Progression :",
            scoreLabel: translations.h5p_summary_score_label || "Mauvaises réponses :",
            resultLabel: translations.h5p_summary_result_label || "Votre résultat",
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_summary_feedback || "Vous avez @score sur @total affirmations correctes (@percent %)."
            }],
            labelCorrect: translations.h5p_summary_label_correct || "Correct.",
            labelIncorrect: translations.h5p_summary_label_incorrect || "Incorrect ! Veuillez réessayer.",
            labelCorrectAnswers: translations.h5p_summary_label_correct_answers || "Réponses correctes.",
            tipButtonLabel: translations.h5p_tip_label || "Indice",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            progressText: translations.h5p_summary_progress_text || "Progression :num sur :total",
            alternativeIncorrectLabel: translations.h5p_summary_alternative_incorrect_label || "Incorrect"
        };
    }
};
