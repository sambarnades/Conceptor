/**
 * Processeur H5P — Cartes mémoires
 *
 * Construit des fiches avec titre, description, cartes (texte/réponse/indice
 * formatés en HTML) et traductions complètes pour l'UI (navigation,
 * vérification, résultats).
 *
 * @module processors/Flashcards
 * @exports {Object} default.process - Transformation principale
 */
import { translations, currentLang } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;

        // Valeurs par défaut et traductions
        return {
            title: jsonObj.title || translations.h5p_flashcards_name,
            description: formatTextToHtml(jsonObj.description || translations.h5p_flashcards_description),
            cards: jsonObj.cards ? jsonObj.cards.map(card => ({
                text: formatTextToHtml(card.text || ""),
                answer: formatTextToHtml(card.answer || ""),
                tip: formatTextToHtml(card.tip || "")
            })) : [],
            progressText: translations.h5p_flashcards_progress_text || "Carte @card sur @total",
            next: translations.h5p_next || "Suivant",
            previous: translations.h5p_previous || "Précédent",
            checkAnswerText: translations.h5p_check_answer || "Vérifier",
            enableRetry: true,
            showSolutionsRequiresInput: true,
            defaultAnswerText: translations.h5p_flashcards_your_answer || "Votre réponse",
            correctAnswerText: translations.h5p_correct_text || "Correct !",
            incorrectAnswerText: translations.h5p_incorrect_text || "Incorrect !",
            showSolutionText: translations.h5p_flashcards_show_solution || "Réponse correcte",
            results: translations.h5p_flashcards_results || "Résultats",
            ofCorrect: translations.h5p_flashcards_of_correct || "@score réponses correctes sur un total de @total",
            showResults: translations.h5p_flashcards_show_results || "Montrer les résultats",
            answerShortText: translations.h5p_flashcards_answer_short || "R :",
            retry: translations.h5p_try_again || "Recommencer",
            caseSensitive: false,
            cardAnnouncement: translations.h5p_flashcards_card_announcement || "Réponse incorrecte. La réponse correcte était @answer",
            correctAnswerAnnouncement: translations.h5p_flashcards_correct_announcement || "@answer est correct.",
            pageAnnouncement: translations.h5p_flashcards_page_announcement || "Page @current sur @total",
            randomCards: false,
            language: h5pLang
        };
    }
};
