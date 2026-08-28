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
import { languageCodes } from '../../core/language-codes.js';
import { formatTextToHtml } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        // Code de langue normalisé : `jp` est une clé de locale Caramel, pas un
        // code de langue (le japonais est `ja`) — la lib ne le reconnaîtrait pas.
        const h5pLang = languageCodes(currentLang).h5p;

        // Valeurs par défaut et traductions
        return {
            title: jsonObj.title || translations.h5p_flashcards_name,
            description: formatTextToHtml(jsonObj.description || translations.h5p_flashcards_description),
            cards: (Array.isArray(jsonObj.cards) ? jsonObj.cards : []).map(card => ({
                text: formatTextToHtml(card.text || ""),
                answer: formatTextToHtml(card.answer || ""),
                tip: formatTextToHtml(card.tip || ""),
                // Image optionnelle — structure attendue par H5P.Flashcards semantics
                ...(card.image && card.image.path ? {
                    image: {
                        path: card.image.path,
                        mime: card.image.mime || "image/jpeg",
                        copyright: { license: "U" },
                        width: card.image.width || 0,
                        height: card.image.height || 0
                    },
                    imageAltText: card.imageAltText || ""
                } : {})
            })),
            progressText: translations.h5p_flashcards_progress_text || "Carte @card sur @total",
            next: translations.h5p_next || "Suivant",
            previous: translations.h5p_previous || "Précédent",
            checkAnswerText: translations.h5p_check_answer || "Vérifier",
            enableRetry: jsonObj.behaviour?.enableRetry ?? true,
            showSolutionsRequiresInput: true,
            defaultAnswerText: translations.h5p_flashcards_your_answer || "Votre réponse",
            correctAnswerText: translations.h5p_correct_text || "Correct !",
            incorrectAnswerText: translations.h5p_incorrect_text || "Incorrect !",
            showSolutionText: translations.h5p_flashcards_show_solution || "Réponse correcte",
            results: translations.h5p_flashcards_results || "Résultats",
            // Absent des semantics : ce libellé ne vit que dans l'objet de défauts de
            // la lib (flashcards.js:32), d'où l'infobulle du bouton d'indice
            // (flashcards.js:377). Identique en français, mais pas en arabe,
            // chinois, japonais ni grec.
            informationText: translations.h5p_information || "Information",
            // Depuis H5P.Flashcards 1.7.23 l'écran de résultats est un tableau
            // à deux colonnes ; ces deux en-têtes sont ses libellés.
            cardsHeader: translations.h5p_flashcards_cards_header || "Cartes",
            scoreHeader: translations.h5p_flashcards_score_header || "Score",
            ofCorrect: translations.h5p_flashcards_of_correct || "@score réponses correctes sur un total de @total",
            showResults: translations.h5p_flashcards_show_results || "Montrer les résultats",
            answerShortText: translations.h5p_flashcards_answer_short || "R :",
            retry: translations.h5p_try_again || "Recommencer",
            caseSensitive: jsonObj.behaviour?.caseSensitive ?? false,
            cardAnnouncement: translations.h5p_flashcards_card_announcement || "Réponse incorrecte. La réponse correcte était @answer",
            correctAnswerAnnouncement: translations.h5p_flashcards_correct_announcement || "@answer est correct.",
            pageAnnouncement: translations.h5p_flashcards_page_announcement || "Page @current sur @total",
            randomCards: jsonObj.behaviour?.randomCards ?? false,
            language: h5pLang
        };
    }
};
