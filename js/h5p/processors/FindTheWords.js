/**
 * Processeur H5P — Mots mêlés
 *
 * Nettoie le formatage HTML/Markdown de la consigne tout en préservant
 * les expressions LaTeX (MathJax via H5P.MathDisplay), conserve la
 * liste de mots, configure les orientations et l'alphabet de remplissage.
 *
 * @module processors/FindTheWords
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';

/**
 * Nettoie le texte en supprimant le formatage HTML/Markdown
 * tout en préservant les expressions LaTeX \(...\).
 * FindTheWords supporte MathJax dans taskDescription via H5P.MathDisplay.
 * @param {string} text - Texte avec potentiellement du HTML ou Markdown
 * @returns {string} - Texte nettoyé avec LaTeX préservé
 */
function stripFormatting(text) {
    if (!text) return '';
    // Extraire et protéger les expressions LaTeX \(...\)
    const latexPlaceholders = [];
    let protected_ = text.replace(/\\\([\s\S]*?\\\)/g, (match) => {
        latexPlaceholders.push(match);
        return `%%LATEX_${latexPlaceholders.length - 1}%%`;
    });
    // Supprimer le Markdown gras **text** et *text*
    protected_ = protected_
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
    // Restaurer les expressions LaTeX
    protected_ = protected_.replace(/%%LATEX_(\d+)%%/g, (_, i) => latexPlaceholders[i]);
    return protected_;
}

export default {
    process: (jsonObj) => {
        const words = (Array.isArray(jsonObj.wordList) ? jsonObj.wordList : String(jsonObj.wordList || '').split(',')).map(word => String(word).trim().normalize('NFC')).filter(Boolean);
        if (!words.length || words.some(word => !/^[\p{L}\p{M}]+$/u.test(word))) throw new Error(translations.validation_find_letters || 'Utilisez des mots composés de lettres, sans espaces ni chiffres.');
        const behaviour = jsonObj.behaviour || {};
        const orientations = Object.fromEntries(['horizontal', 'horizontalBack', 'vertical', 'verticalUp', 'diagonal', 'diagonalBack', 'diagonalUp', 'diagonalUpBack']
            .map(key => [key, behaviour.orientations?.[key] !== false]));
        const fillPool = behaviour.fillPool ?? translations.h5p_find_words_fill_pool ?? 'abcdefghijklmnopqrstuvwxyz';
        if (!String(fillPool).trim()) throw new Error(translations.validation_find_fill_pool || 'Indiquez au moins une lettre de remplissage.');
        if (!Object.values(orientations).some(Boolean)) throw new Error(translations.validation_find_orientation || 'Choisissez au moins une orientation.');
        return {
            ...jsonObj,
            // Nettoyage HTML/Markdown avec préservation LaTeX (MathJax)
            taskDescription: stripFormatting(jsonObj.taskDescription || ""),
            wordList: words.join(","),
            behaviour: {
                preferOverlap: true,
                showVocabulary: true,
                enableShowSolution: true,
                enableRetry: true,
                ...behaviour,
                orientations,
                fillPool
            },
            l10n: {
                check: translations.h5p_check_answer || "Vérifier",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                found: translations.h5p_find_words_found || "@found sur @totalWords mots trouvés",
                timeSpent: translations.h5p_find_words_time_spent || "Temps écoulé",
                score: translations.h5p_score || "Vous avez obtenu @score sur @total points",
                wordListHeader: translations.h5p_find_words_word_list_header || "Liste de mots",
                ...jsonObj.l10n
            }
        };
    }
};
