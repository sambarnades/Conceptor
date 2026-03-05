/**
 * Processeur H5P — Mots mêlés
 *
 * Supprime tout formatage HTML/Markdown de la consigne (FindTheWords
 * ne le supporte pas), conserve la liste de mots, configure les
 * orientations et l'alphabet de remplissage.
 *
 * @module processors/FindTheWords
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';

/**
 * Nettoie le texte en supprimant tout formatage HTML/Markdown.
 * FindTheWords ne supporte pas le HTML dans taskDescription.
 * @param {string} text - Texte avec potentiellement du HTML ou Markdown
 * @returns {string} - Texte brut sans formatage
 */
function stripFormatting(text) {
    if (!text) return '';
    return text
        // Supprimer le Markdown gras **text** et *text*
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        // Supprimer les balises HTML
        .replace(/<[^>]*>/g, '')
        // Décoder les entités HTML courantes
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

export default {
    process: (jsonObj) => {
        return {
            // FindTheWords ne supporte pas le HTML dans taskDescription
            taskDescription: stripFormatting(jsonObj.taskDescription || ""),
            wordList: jsonObj.wordList || "",
            behaviour: {
                orientations: {
                    horizontal: true,
                    horizontalBack: true,
                    vertical: true,
                    verticalUp: true,
                    diagonal: true,
                    diagonalBack: true,
                    diagonalUp: true,
                    diagonalUpBack: true
                },
                fillPool: translations.h5p_find_words_fill_pool || "abcdefghijklmnopqrstuvwxyz",
                preferOverlap: true,
                showVocabulary: true,
                enableShowSolution: true,
                enableRetry: true
            },
            l10n: {
                check: translations.h5p_check_answer || "Vérifier",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                found: translations.h5p_find_words_found || "@found sur @totalWords mots trouvés",
                timeSpent: translations.h5p_find_words_time_spent || "Temps écoulé",
                score: translations.h5p_score || "Vous avez obtenu @score sur @total points",
                wordListHeader: translations.h5p_find_words_word_list_header || "Liste de mots"
            }
        };
    }
};
