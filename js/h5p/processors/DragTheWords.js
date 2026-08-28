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


/**
 * Libellés d'interface de H5P.DragText.
 *
 * Factorisés parce que `process()` (activité autonome) et `transformForQuizSet()`
 * (question DANS un Quiz ou une Vidéo interactive) doivent en produire EXACTEMENT
 * les mêmes : les deux listes avaient divergé et la voie conteneur n'en posait plus
 * que 4 sur 18 — les 14 autres retombaient sur le défaut ANGLAIS de la lib.
 * @returns {Object}
 */
function libelles() {
    return {
        dropZoneIndex: translations.h5p_drag_words_drop_zone_index || "Zone de dépôt @index.",
        empty: translations.h5p_drag_words_drop_zone_empty || "La zone de dépôt @index est vide.",
        contains: translations.h5p_drag_words_drop_zone_contains || "La zone de dépôt @index contient l'élément @draggable.",
        tipLabel: translations.h5p_tip_label || "Indice",
        correctText: translations.h5p_drag_words_correct_text || "Correct !",
        incorrectText: translations.h5p_drag_words_incorrect_text || "Incorrect !",
        resetDropTitle: translations.h5p_drag_words_reset_drop_title || "Réinitialiser le dépôt",
        resetDropDescription: translations.h5p_drag_words_reset_drop_description || "Êtes-vous certain de vouloir réinitialiser cette zone de dépôt ?",
        grabbed: translations.h5p_drag_words_grabbed || "L'élément est saisi.",
        cancelledDragging: translations.h5p_drag_words_cancelled_dragging || "Déplacement annulé.",
        correctAnswer: translations.h5p_drag_words_correct_answer || "Réponse correcte :",
        feedbackHeader: translations.h5p_drag_words_feedback_header || "Commentaire de retour",
        scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
        submitAnswer: translations.h5p_submit_answer || "Valider",
        ariaDraggableIndex: translations.h5p_drag_words_aria_draggable_index || "@index sur @count éléments.",
        a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
        a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
        a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
    };
}

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
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt),
            ...libelles()
        };
    },

    transformForQuizSet: (question) => {
        if (question.params.taskDescription) {
            question.params.taskDescription = formatTextToHtml(question.params.taskDescription);
        }
        if (question.params.textField) {
            question.params.textField = cleanDragTextTextField(question.params.textField);
        }
        // Mêmes libellés que l'activité autonome (cf. libelles()) : sans ça, la
        // question intégrée affichait « Submit », « Correct! », « Show tip »… en anglais.
        Object.assign(question.params, libelles(), {
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolution: translations.h5p_show_solution || "Afficher la solution"
        });
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

