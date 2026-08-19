/**
 * Processeur H5P — Ordonner les paragraphes
 *
 * Formate la consigne en HTML, enveloppe chaque paragraphe dans <p>
 * avec conversion Markdown, configure le comportement de tri et
 * nombreuses traductions d'accessibilité.
 *
 * @module processors/SortParagraphs
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, markdownToHtml } from '../../core/utils.js';


/**
 * Formate le texte markdown en HTML et l'enveloppe dans une balise <p>.
 * H5P.SortParagraphs attend chaque paragraphe enveloppé dans <p>...</p>.
 * @param {string} text - Texte avec éventuellement du markdown
 * @returns {string} - HTML formaté enveloppé dans <p>
 */
function formatParagraphText(text) {
    if (!text) return '<p></p>';
    const trimmed = text.trim();
    // Idempotence : si le texte est DÉJÀ enveloppé dans un unique <p>…</p>
    // (cas d'une ré-ingestion d'un contenu déjà traité), ne pas redoubler la
    // balise — sinon `<p>…</p>` → `<p><p>…</p></p>` à chaque passe. `markdownToHtml`
    // ne produit jamais de <p> en tête, donc un <p> initial ⇒ contenu déjà formaté.
    if (/^<p[\s>][\s\S]*<\/p>$/i.test(trimmed) && (trimmed.match(/<p[\s>]/gi) || []).length === 1) {
        return trimmed;
    }
    // Convertir markdown en HTML en protégeant le LaTeX, avec \n → <br>
    const formatted = markdownToHtml(trimmed, { newlineToBr: true });
    // Envelopper dans <p> comme attendu par H5P.SortParagraphs
    return `<p>${formatted}</p>`;
}

export default {
    process: (jsonObj) => {
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription),
            // Utiliser formatParagraphText pour éviter les <p> multiples dans chaque paragraphe
            paragraphs: (Array.isArray(jsonObj.paragraphs) ? jsonObj.paragraphs : []).map(p => formatParagraphText(p)),
            overallFeedback: jsonObj.overallFeedback || [{ "from": 0, "to": 100 }],
            behaviour: {
                scoringMode: "transitions",
                applyPenalties: true,
                duplicatesInterchangeable: true,
                enableRetry: true,
                enableSolutionsButton: true,
                addButtonsForMovement: true,
                ...(jsonObj.behaviour || {})
            },
            l10n: {
                checkAnswer: translations.h5p_check_answer || "Vérifier",
                submitAnswer: translations.h5p_submit_answer || "Valider",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                up: translations.h5p_sort_paragraphs_up || "Monter",
                down: translations.h5p_sort_paragraphs_down || "Descendre",
                disabled: translations.h5p_sort_paragraphs_disabled || "Désactivé",
                resume: translations.h5p_resume || "Reprendre",
                audioDirection: translations.h5p_audio_direction || "Direction de l'audio"
            },
            a11y: {
                check: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
                showSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
                retry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",
                yourResult: translations.h5p_sort_paragraphs_a11y_your_result || "Vous avez obtenu @score sur @total points",
                paragraph: translations.h5p_sort_paragraphs_paragraph || "Paragraphe",
                correct: translations.h5p_correct_text || "Correct !",
                wrong: translations.h5p_incorrect_text || "Incorrect !",
                point: translations.h5p_sort_paragraphs_point || "@score point",
                sevenOfNine: translations.h5p_sort_paragraphs_seven_of_nine || "@current sur @total",
                currentPosition: translations.h5p_sort_paragraphs_current_position || "Position actuelle dans la liste",
                instructionsSelected: translations.h5p_sort_paragraphs_instructions_selected || "Appuyez sur la barre d'espace pour réorganiser",
                instructionsGrabbed: translations.h5p_sort_paragraphs_instructions_grabbed || "Appuyez sur les flèches haut et bas pour changer de position, sur la barre d'espace pour déposer, sur échap pour annuler",
                grabbed: translations.h5p_sort_paragraphs_grabbed || "Saisi",
                moved: translations.h5p_sort_paragraphs_moved || "Déplacé",
                dropped: translations.h5p_sort_paragraphs_dropped || "Déposé",
                reorderCancelled: translations.h5p_sort_paragraphs_reorder_cancelled || "Réorganisation annulée",
                finalPosition: translations.h5p_sort_paragraphs_final_position || "Position finale",
                nextParagraph: translations.h5p_sort_paragraphs_next_paragraph || "Paragraphe suivant",
                correctParagraph: translations.h5p_sort_paragraphs_correct_paragraph || "Paragraphe correct à la position",
                listDescription: translations.h5p_sort_paragraphs_list_description || "Liste de paragraphes triables.",
                listDescriptionCheckAnswer: translations.h5p_sort_paragraphs_list_description_check || "Liste de paragraphes avec résultats.",
                listDescriptionShowSolution: translations.h5p_sort_paragraphs_list_description_solution || "Liste de paragraphes avec solutions."
            }
        };
    }
};
