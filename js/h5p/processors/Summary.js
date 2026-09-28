/**
 * Processeur H5P — Résumé
 *
 * Génère des affirmations à évaluer avec UUID uniques par résumé,
 * indices et feedback global personnalisé.
 *
 * @module processors/Summary
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';


/**
 * Libellés d'interface de H5P.Summary.
 *
 * Exportés parce que la Vidéo interactive construit SA tâche de résumé finale avec
 * la MÊME bibliothèque (`buildSummary()` dans InteractiveVideo.js) : les deux listes
 * étaient recopiées à la main et avaient divergé de 5 entrées, qui retombaient sur
 * le défaut ANGLAIS de la lib (« Show tip », « Correct answers. »…).
 * @returns {Object}
 */
export function libellesSummary() {
    return {
        solvedLabel: translations.h5p_summary_solved_label || "Progression :",
        scoreLabel: translations.h5p_summary_score_label || "Mauvaises réponses :",
        resultLabel: translations.h5p_summary_result_label || "Votre résultat",
        labelCorrect: translations.h5p_summary_label_correct || "Correct.",
        labelIncorrect: translations.h5p_summary_label_incorrect || "Incorrect ! Veuillez réessayer.",
        labelCorrectAnswers: translations.h5p_summary_label_correct_answers || "Réponses correctes.",
        tipButtonLabel: translations.h5p_tip_label || "Indice",
        scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
        progressText: translations.h5p_summary_progress_text || "Progression :num sur :total",
        alternativeIncorrectLabel: translations.h5p_summary_alternative_incorrect_label || "Incorrect"
    };
}

export default {
    process: (jsonObj) => {
        if (!Array.isArray(jsonObj.summaries) || jsonObj.summaries.length < 1 || jsonObj.summaries.length > 100) {
            throw new Error('Summary : entre 1 et 100 groupes sont requis.');
        }
        for (const [index, group] of jsonObj.summaries.entries()) {
            if (!Array.isArray(group?.summary) || group.summary.length < 2 ||
                group.summary.some(text => typeof text !== 'string' || !text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim())) {
                throw new Error(`Summary : le groupe ${index + 1} requiert au moins deux affirmations non vides, la première correcte.`);
            }
        }
        return {
            intro: jsonObj.intro || translations.h5p_summary_intro || "Choisissez l'affirmation correcte.",
            summaries: (Array.isArray(jsonObj.summaries) ? jsonObj.summaries : []).map(s => ({
                ...s,
                summary: Array.isArray(s.summary) ? s.summary.map(text => formatTextToHtml(text)) : s.summary,
                subContentId: s.subContentId || generateUUID(),
                tip: (typeof s.tip === "object" ? s.tip?.tip : s.tip) || ""
            })),
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_summary_feedback || "Vous avez @score sur @total affirmations correctes (@percent %)."
            }],
            ...Object.fromEntries(Object.entries(libellesSummary()).map(([key, fallback]) => [key, jsonObj[key] ?? fallback]))
        };
    }
};
