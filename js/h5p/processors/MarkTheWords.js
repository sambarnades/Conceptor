/**
 * Processeur H5P — Surligner les mots
 *
 * Formate consignes et champ texte (supprime LaTeX parasites, convertit
 * LaTeX en Unicode, divise les multi-mots marqués *mot1 mot2* en
 * marqueurs individuels *mot1* *mot2*).
 *
 * @module processors/MarkTheWords
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, debugLog } from '../../core/utils.js';
import { latexToUnicode } from '../json-healer.js';
import { prepareQuestionMedia } from '../question-media.js';

/**
 * Libellés d'interface de H5P.MarkTheWords.
 *
 * Factorisés parce que `process()` (activité autonome) et `transformForQuizSet()`
 * (question DANS un Quiz ou une Vidéo interactive) doivent en produire EXACTEMENT
 * les mêmes : les deux listes avaient divergé et la voie conteneur n'en posait plus
 * que 4 sur 15 — les autres retombaient sur le défaut ANGLAIS de la lib.
 * @returns {Object}
 */
function libelles() {
    return {
        correctAnswer: translations.h5p_mark_words_correct_answer || "Correct !",
        incorrectAnswer: translations.h5p_mark_words_incorrect_answer || "Incorrect !",
        missedAnswer: translations.h5p_mark_words_missed_answer || "Manqué !",
        displaySolutionDescription: translations.h5p_mark_words_display_solution_description || "La tâche est mise à jour pour contenir la solution.",
        scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
        submitAnswerButton: translations.h5p_submit_answer || "Valider",
        a11yFullTextLabel: translations.h5p_mark_words_a11y_full_text_label || "Texte complet lisible",
        a11yClickableTextLabel: translations.h5p_mark_words_a11y_clickable_text_label || "Texte complet où les mots peuvent être marqués",
        a11ySolutionModeHeader: translations.h5p_mark_words_a11y_solution_mode_header || "Mode solution",
        a11yCheckingHeader: translations.h5p_mark_words_a11y_checking_header || "Mode de vérification",
        a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
        a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
        a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
    };
}

const MarkTheWords = {
    process: (jsonObj) => {
        debugLog('mark-the-words', '[MarkTheWords Processor] Processing...');
        debugLog('mark-the-words', '[MarkTheWords Processor] translations.h5p_check_answer:', translations.h5p_check_answer);
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription || ""),
            textField: cleanMarkTheWordsTextField(jsonObj.textField),
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                enableCheckButton: true,
                showScorePoints: true,
                ...(jsonObj.behaviour || {})
            },
            overallFeedback: jsonObj.overallFeedback || [{ from:0, to:100, feedback:"" }],
            checkAnswerButton: jsonObj.checkAnswerButton ?? (translations.h5p_check_answer || "Vérifier"),
            tryAgainButton: jsonObj.tryAgainButton ?? (translations.h5p_try_again || "Recommencer"),
            showSolutionButton: jsonObj.showSolutionButton ?? (translations.h5p_show_solution || "Afficher la solution"),
            media: prepareQuestionMedia(jsonObj),
            ...Object.fromEntries(Object.entries(libelles()).map(([key, value]) => [key,jsonObj[key] ?? value]))
        };
    },

    transformForQuizSet: (question) => {
        question.params = {...question.params, ...MarkTheWords.process(question.params)};
        return question;
    }
};
export default MarkTheWords;

/**
 * Nettoie et formate le champ texte de MarkTheWords.
 * 1. Convertit **mot** (gras markdown) en *mot* (marqueur MarkTheWords)
 * 2. Supprime les délimiteurs LaTeX parasites \( ... \)
 * 3. Convertit le LaTeX basique en Unicode
 * 4. Corrige apostrophe + astérisque
 * 5. Corrige les astérisques multi-mots (*mot1 mot2* -> *mot1* *mot2*)
 *
 * @param {string} text
 * @returns {string}
 */
function cleanMarkTheWordsTextField(text) {
    if (!text || typeof text !== 'string') return "";
    let cleaned = text;

    // 1. Convertir **mot** (gras markdown généré par le LLM) en *mot* (marqueur MarkTheWords)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '*$1*');

    // 2. Supprimer les wrappers \( et \) parasites
    if (cleaned.trim().startsWith('\\(') && cleaned.trim().endsWith('\\)')) {
        cleaned = cleaned.trim().slice(2, -2).trim();
    }

    // 3. Conversion LaTeX -> Unicode (module partagé avec DragTheWords)
    cleaned = latexToUnicode(cleaned);

    // 4. Apostrophe + astérisque : l'*oiseau* → l' *oiseau*
    cleaned = cleaned.replace(/(['''])\*/g, "$1 *");

    // 5. Healer pour MarkTheWords : *mot1 mot2* -> *mot1* *mot2*
    cleaned = cleaned.replace(/\*([^*]+)\*/g, (match, content) => {
        if (!content.includes(' ')) return match;
        // Découpe par espace et ré-enveloppe chaque morceau non-vide
        return content.split(/\s+/).filter(w => w.length > 0).map(w => `*${w}*`).join(' ');
    });

    return cleaned;
}
