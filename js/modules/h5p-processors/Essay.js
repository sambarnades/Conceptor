import { translations } from '../translation.js';
import { formatTextToHtml } from '../utils.js';

export const machineName = 'H5P.Essay';
export const version = { major: 1, minor: 5 };
export const extraDependencies = [
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 }
];



export default {
    process: (jsonObj) => {
        return {
            ...jsonObj,
            taskDescription: formatTextToHtml(jsonObj.taskDescription),
            keywords: (jsonObj.keywords || []).map(kw => {
                const isObj = typeof kw === 'object' && kw !== null;
                return {
                    keyword: isObj ? (kw.keyword || "") : kw,
                    options: {
                        points: 1,
                        caseSensitive: false,
                        occurrences: 1,
                        forgiveMistakes: false,
                        feedbackIncludedWord: "keyword",
                        feedbackMissedWord: "none",
                        ...(isObj ? kw.options : {})
                    }
                };
            }),
            behaviour: {
                inputFieldSize: "10",
                enableRetry: true,
                ignoreScoring: false,
                minimumLength: 10,
                maximumLength: 10000,
                percentagePassing: 50,
                percentageMastering: 80,
                pointsHost: 1,
                linebreakReplacement: " ",
                overrideForgiveMistakes: "on",
                overrideCaseSensitive: "off"
            },
            overallFeedback: jsonObj.overallFeedback || [{ from: 0, to: 100, feedback: "" }],
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolution: translations.h5p_show_solution || "Afficher la solution",
            feedbackHeader: translations.h5p_essay_feedbackHeader || "Commentaire",
            solutionTitle: translations.h5p_essay_solutionTitle || "Exemple de solution",
            remainingChars: translations.h5p_essay_remainingChars || "Caractères restants : @chars",
            notEnoughChars: translations.h5p_essay_notEnoughChars || "Vous devez saisir au moins @chars caractères !",
            messageSave: translations.h5p_essay_messageSave || "enregistré",
            placeholderText: translations.h5p_essay_placeholderText || "Commencez à rédiger ici...",
            solution: {
                introduction: jsonObj.solution?.introduction || "",
                sample: jsonObj.solution?.sample || (jsonObj.keywords ? `<div>${jsonObj.keywords.map(k => k.keyword || k).join(', ')}</div>` : "")
            },
            media: {
                disableImageZooming: false
            },
            ariaYourResult: translations.h5p_essay_ariaYourResult || "Vous avez obtenu @score sur @total points",
            ariaNavigatedToSolution: translations.h5p_essay_ariaNavigatedToSolution || "Navigation vers la solution.",
            submitAnswer: translations.h5p_submit_answer || "Submit",
            ariaCheck: translations.h5p_a11y_check || "Check the answers.",
            ariaShowSolution: translations.h5p_a11y_show_solution || "Show the solution. You will be provided with a sample solution.",
            ariaRetry: translations.h5p_a11y_retry || "Retry the task. You can improve your previous answer if the author allowed that."
        };
    },

    transformForQuizSet: (question) => {
        question.params.checkAnswer = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain = translations.h5p_try_again || "Recommencer";
        question.params.showSolution = translations.h5p_show_solution || "Afficher la solution";
        question.params.behaviour = {
            inputFieldSize: "10",
            enableRetry: true,
            ...question.params.behaviour
        };
        // Ajouter automatiquement les options aux keywords s'ils existent (logique migrée du QuizSet)
        if (question.params.keywords && Array.isArray(question.params.keywords)) {
            question.params.keywords = question.params.keywords.map(kw => {
                // Si le keyword est juste une chaîne, le convertir en objet
                if (typeof kw === 'string') {
                    return {
                        keyword: kw,
                        options: { points: 1, caseSensitive: false }
                    };
                }
                // Si c'est déjà un objet, s'assurer qu'il a les options
                if (!kw.options) {
                    kw.options = { points: 1, caseSensitive: false };
                }
                return kw;
            });
        }
        return question;
    }
};
