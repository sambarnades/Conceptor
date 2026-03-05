/**
 * Processeur H5P — Rédaction
 *
 * Traite les essais avec mots-clés normalisés, formatage HTML de la consigne
 * et comportement (limites de caractères, pourcentages). Accepte les formats
 * 'word' (IA/QuizSet) et 'keyword' (H5P natif).
 *
 * @module processors/Essay
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation avec normalisation des mots-clés
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';

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
                percentageMastering: 100,
                pointsHost: 1,
                linebreakReplacement: " ",
                overrideForgiveMistakes: "on",
                overrideCaseSensitive: "off"
            },
            overallFeedback: jsonObj.overallFeedback || [{ from: 0, to: 100, feedback: "" }],
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolution: translations.h5p_show_solution || "Afficher la solution",
            feedbackHeader: translations.h5p_essay_feedback_header || "Commentaire",
            solutionTitle: translations.h5p_essay_solution_title || "Exemple de solution",
            remainingChars: translations.h5p_essay_remaining_chars || "Caractères restants : @chars",
            notEnoughChars: translations.h5p_essay_not_enough_chars || "Vous devez saisir au moins @chars caractères !",
            messageSave: translations.h5p_essay_message_save || "enregistré",
            placeholderText: translations.h5p_essay_placeholder_text || "Commencez à rédiger ici...",
            solution: {
                introduction: jsonObj.solution?.introduction || "",
                sample: jsonObj.solution?.sample || (jsonObj.keywords ? `<div>${jsonObj.keywords.map(k => k.keyword || k).join(', ')}</div>` : "")
            },
            media: {
                disableImageZooming: false
            },
            ariaYourResult: translations.h5p_essay_aria_your_result || "Vous avez obtenu @score sur @total points",
            ariaNavigatedToSolution: translations.h5p_essay_aria_navigated_to_solution || "Navigation vers la solution.",
            submitAnswer: translations.h5p_submit_answer || "Submit",
            ariaCheck: translations.h5p_a11y_check || "Check the answers.",
            ariaShowSolution: translations.h5p_a11y_show_solution || "Show the solution. You will be provided with a sample solution.",
            ariaRetry: translations.h5p_a11y_retry || "Retry the task. You can improve your previous answer if the author allowed that."
        };
    },

    transformForQuizSet: (question) => {
        // 1. Convertir le Markdown de la consigne en HTML (cohérence avec process())
        if (question.params.taskDescription) {
            question.params.taskDescription = formatTextToHtml(question.params.taskDescription);
        }

        // 2. Normaliser les mots-clés : accepter word/keyword, points plats ou imbriqués
        if (question.params.keywords && Array.isArray(question.params.keywords)) {
            question.params.keywords = question.params.keywords.map(kw => {
                if (typeof kw === 'string') {
                    return {
                        keyword: kw,
                        options: { points: 1, caseSensitive: false, occurrences: 1, forgiveMistakes: false, feedbackIncludedWord: "keyword", feedbackMissedWord: "none" }
                    };
                }
                const isObj = typeof kw === 'object' && kw !== null;
                if (!isObj) {
                    return {
                        keyword: String(kw),
                        options: { points: 1, caseSensitive: false, occurrences: 1, forgiveMistakes: false, feedbackIncludedWord: "keyword", feedbackMissedWord: "none" }
                    };
                }
                // Accepter "word" (format QuizSet/IA) ou "keyword" (format H5P)
                const keywordText = kw.keyword || kw.word || "";
                // Accepter points plat ou imbriqué dans options (attention aux valeurs 0 qui sont falsy)
                const points = kw.points !== undefined && kw.points !== null ? kw.points
                    : (kw.options && kw.options.points !== undefined && kw.options.points !== null ? kw.options.points : 1);
                const caseSensitive = kw.caseSensitive !== undefined ? kw.caseSensitive
                    : (kw.options && kw.options.caseSensitive !== undefined ? kw.options.caseSensitive : false);
                return {
                    keyword: keywordText,
                    options: {
                        points: points,
                        caseSensitive: caseSensitive,
                        occurrences: (kw.options && kw.options.occurrences) || 1,
                        forgiveMistakes: (kw.options && kw.options.forgiveMistakes) || false,
                        feedbackIncludedWord: (kw.options && kw.options.feedbackIncludedWord) || "keyword",
                        feedbackMissedWord: (kw.options && kw.options.feedbackMissedWord) || "none"
                    }
                };
            });
        }

        // 3. Traductions complètes (alignées sur process())
        question.params.checkAnswer = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain = translations.h5p_try_again || "Recommencer";
        question.params.showSolution = translations.h5p_show_solution || "Afficher la solution";
        question.params.feedbackHeader = translations.h5p_essay_feedback_header || "Commentaire";
        question.params.solutionTitle = translations.h5p_essay_solution_title || "Exemple de solution";
        question.params.remainingChars = translations.h5p_essay_remaining_chars || "Caractères restants : @chars";
        question.params.notEnoughChars = translations.h5p_essay_not_enough_chars || "Vous devez saisir au moins @chars caractères !";
        question.params.messageSave = translations.h5p_essay_message_save || "enregistré";
        question.params.placeholderText = translations.h5p_essay_placeholder_text || "Commencez à rédiger ici...";
        question.params.submitAnswer = translations.h5p_submit_answer || "Submit";
        question.params.ariaYourResult = translations.h5p_essay_aria_your_result || "Vous avez obtenu @score sur @total points";
        question.params.ariaNavigatedToSolution = translations.h5p_essay_aria_navigated_to_solution || "Navigation vers la solution.";
        question.params.ariaCheck = translations.h5p_a11y_check || "Check the answers.";
        question.params.ariaShowSolution = translations.h5p_a11y_show_solution || "Show the solution. You will be provided with a sample solution.";
        question.params.ariaRetry = translations.h5p_a11y_retry || "Retry the task. You can improve your previous answer if the author allowed that.";

        // 4. Comportement complet (aligné sur process())
        question.params.behaviour = {
            inputFieldSize: "10",
            enableRetry: true,
            ignoreScoring: false,
            minimumLength: 10,
            maximumLength: 10000,
            percentagePassing: 50,
            percentageMastering: 100,
            pointsHost: 1,
            linebreakReplacement: " ",
            overrideForgiveMistakes: "on",
            overrideCaseSensitive: "off",
            ...question.params.behaviour
        };

        // 5. Feedback global par défaut
        question.params.overallFeedback = question.params.overallFeedback || [{ from: 0, to: 100, feedback: "" }];

        // 6. Solution auto-générée à partir des mots-clés si absente
        if (!question.params.solution) {
            const keywordsList = (question.params.keywords || []).map(k => k.keyword || '').filter(Boolean);
            question.params.solution = {
                introduction: "",
                sample: keywordsList.length > 0 ? `<div>${keywordsList.join(', ')}</div>` : ""
            };
        }

        // 7. Media par défaut
        question.params.media = question.params.media || { disableImageZooming: false };

        return question;
    }
};
