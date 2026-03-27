/**
 * Processeur H5P — Glisser les mots
 *
 * Formate les consignes et le champ texte : supprime les délimiteurs LaTeX
 * parasites et convertit le LaTeX interne en Unicode pour les mots glissables.
 *
 * @module processors/DragTheWords
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';
import { latexToUnicode } from '../json-healer.js';
import { buildMediaStructure } from '../image-manager.js';


export default {
    process: (jsonObj) => {
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription || ""),
            textField: cleanDragTextTextField(jsonObj.textField),
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolution: translations.h5p_show_solution || "Afficher la solution",
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                instantFeedback: false,
                enableCheckButton: true,
                ...(jsonObj.behaviour || {})
            },
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_drag_words_score_feedback || "Score : @score sur @total."
            }],
            dropZoneIndex: "Drop Zone @index.",
            empty: "Drop Zone @index is empty.",
            contains: "Drop Zone @index contains draggable @draggable.",
            tipLabel: translations.h5p_tip_label || "Indice",
            correctText: translations.h5p_drag_words_correct_text || "Correct !",
            incorrectText: translations.h5p_drag_words_incorrect_text || "Incorrect !",
            resetDropTitle: "Reset drop",
            resetDropDescription: "Are you sure you want to reset this drop zone?",
            grabbed: "Draggable is grabbed.",
            cancelledDragging: "Cancelled dragging.",
            correctAnswer: "Correct answer:",
            feedbackHeader: "Feedback",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt),
            submitAnswer: translations.h5p_submit_answer || "Valider",
            ariaDraggableIndex: "@index sur @count éléments.",
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
        };
    },

    transformForQuizSet: (question) => {
        if (question.params.taskDescription) {
            question.params.taskDescription = formatTextToHtml(question.params.taskDescription);
        }
        if (question.params.textField) {
            question.params.textField = cleanDragTextTextField(question.params.textField);
        }
        question.params.checkAnswer = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain = translations.h5p_try_again || "Recommencer";
        question.params.showSolution = translations.h5p_show_solution || "Afficher la solution";
        question.params.scoreBarLabel = translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points";
        question.params.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            instantFeedback: false,
            randomAccounts: true, // Note from original: often 'randomAccounts' or 'randomizableAnswers' depending on version
            ...question.params.behaviour
        };
        return question;
    }
};

/**
 * Nettoie et formate le champ texte de DragText.
 * 1. Supprime les délimiteurs LaTeX parasites \( ... \) englobant tout le texte
 * 2. Convertit le LaTeX DANS les marqueurs *...* en Unicode (les mots à glisser ne supportent pas le LaTeX)
 * 3. Convertit les formules \(...\) hors marqueurs en Unicode
 *
 * @param {string} text
 * @returns {string}
 */
function cleanDragTextTextField(text) {
    if (!text) return "";
    let cleaned = text;

    // 1. Supprimer les wrappers \( et \) parasites (texte entier)
    if (cleaned.trim().startsWith('\\(') && cleaned.trim().endsWith('\\)')) {
        cleaned = cleaned.trim().slice(2, -2).trim();
    }

    // 2. Convertir LaTeX dans les marqueurs *...* en Unicode
    cleaned = cleaned.replace(/\*([^*]+)\*/g, (match, content) => {
        if (/\\[a-zA-Z]/.test(content) || /\^/.test(content)) {
            return `*${latexToUnicode(content).trim()}*`;
        }
        return match;
    });

    // 3. Convertir les formules \(...\) hors marqueurs en Unicode
    // Note : [\s\S]*? au lieu de [^)]*? pour gérer les ) internes (ex: (-5)^{2})
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => {
        return latexToUnicode(inner).trim();
    });

    return cleaned;
}

