import { translations } from '../translation.js';
import { generateUUID } from '../utils.js';


export const machineName = 'H5P.Summary';
export const version = { major: 1, minor: 10 };
export const extraDependencies = [
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
];

export default {
    process: (jsonObj) => {
        return {
            intro: jsonObj.intro || translations.h5p_summary_intro || "Choisissez l'affirmation correcte.",
            summaries: jsonObj.summaries.map(s => ({
                ...s,
                subContentId: generateUUID(),
                tip: s.tip || ""
            })),
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                passPercentage: 50
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
