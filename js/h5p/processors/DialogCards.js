/**
 * Processeur H5P — Cartes de dialogue
 *
 * Transforme les dialogues (texte/réponse/indices) en HTML avec
 * alignement, compile titre et description, configure le comportement
 * et traductions (manches, résumés, etc.).
 *
 * @module processors/DialogCards
 * @exports {Object} default.process - Transformation principale
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';


export default {
    process: (jsonObj) => {
        if (!Array.isArray(jsonObj.dialogs) || !jsonObj.dialogs.length) throw Error('DialogCards : au moins une carte est requise.');
        const formatDialogText = (text) => {
            if (!text) return '';
            const html = formatTextToHtml(text);
            return html.replace(/<p>/g, '<p style="text-align: center;">');
        };

        const transformedDialogs = (Array.isArray(jsonObj.dialogs) ? jsonObj.dialogs : []).map(dialog => {
            const { text, answer, tips } = dialog;
            return {
                ...dialog,
                text: formatDialogText(text),
                answer: formatDialogText(answer),
                tips: {
                    front: tips?.front || '',
                    back: tips?.back || ''
                },
                // Le champ natif audio est une liste de sources alternatives.
                // Conserver les crédits et les métadonnées des médias importés.
                ...(dialog.audio ? { audio: (Array.isArray(dialog.audio) ? dialog.audio : [dialog.audio])
                    .filter(source => source?.path).map(({ dataURL, kind, ...source }) => source) } : {}),
                // Image optionnelle — structure attendue par H5P.Dialogcards semantics
                ...(dialog.image && dialog.image.path ? {
                    image: {
                        ...dialog.image,
                        path: dialog.image.path,
                        mime: dialog.image.mime || "image/jpeg",
                        copyright: dialog.image.copyright || { license: "U" },
                        width: dialog.image.width || 0,
                        height: dialog.image.height || 0
                    },
                    imageAltText: dialog.imageAltText || ""
                } : {image: undefined})
            };
        });

        const result = {
            ...jsonObj,
            title: (jsonObj.title && !jsonObj.title.startsWith('<p>')) ? `<p>${jsonObj.title}</p>` : jsonObj.title,
            description: formatTextToHtml(jsonObj.description),
            dialogs: transformedDialogs,
            behaviour: {
                enableRetry: true,
                disableBackwardsNavigation: false,
                scaleTextNotCard: true,
                randomCards: false,
                maxProficiency: 5,
                quickProgression: false,
                ...(jsonObj.behaviour || {})
            },
            answer: translations.h5p_dialog_cards_answer || "Retourner",
            next: translations.h5p_next || "Suivant",
            prev: translations.h5p_previous || "Précédent",
            retry: translations.h5p_try_again || "Recommencer",
            progressText: translations.h5p_dialog_cards_progress_text || "Carte @card sur @total",
            cardFrontLabel: translations.h5p_dialog_cards_card_front_label || "Recto de la carte",
            cardBackLabel: translations.h5p_dialog_cards_card_back_label || "Verso de la carte",
            tipButtonLabel: translations.h5p_tip_label || "Indice",
            audioNotSupported: translations.h5p_dialog_cards_audio_not_supported || "Votre navigateur ne supporte pas ce format audio",
            mode: jsonObj.mode || "normal",
            correctAnswer: translations.h5p_dialog_cards_correct_answer || "J'ai eu bon !",
            incorrectAnswer: translations.h5p_dialog_cards_incorrect_answer || "Je me suis trompé",
            round: translations.h5p_dialog_cards_round || "Manche @round",
            cardsLeft: translations.h5p_dialog_cards_cards_left || "Cartes restantes : @number",
            nextRound: translations.h5p_dialog_cards_next_round || "Passer à la manche @round",
            startOver: translations.h5p_dialog_cards_start_over || "Recommencer",
            showSummary: translations.h5p_dialog_cards_show_summary || "Suivant",
            summary: translations.h5p_dialog_cards_summary || "Résumé",
            summaryCardsRight: translations.h5p_dialog_cards_summary_cards_right || "Cartes que vous avez réussies :",
            summaryCardsWrong: translations.h5p_dialog_cards_summary_cards_wrong || "Cartes que vous avez manquées :",
            summaryCardsNotShown: translations.h5p_dialog_cards_summary_cards_not_shown || "Cartes non montrées :",
            summaryOverallScore: translations.h5p_dialog_cards_summary_overall_score || "Score global",
            summaryCardsCompleted: translations.h5p_dialog_cards_summary_cards_completed || "Cartes que vous avez apprises :",
            summaryCompletedRounds: translations.h5p_dialog_cards_summary_completed_rounds || "Manches terminées :",
            summaryAllDone: translations.h5p_dialog_cards_summary_all_done || "Bien joué ! Vous avez réussi toutes les @cards cartes @max fois de suite !",
            confirmStartingOver: {
                header: translations.h5p_finish_header || "Terminer ?",
                body: translations.h5p_finish_body || "Êtes-vous sûr de vouloir terminer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_finish_label || "Terminer",
                ...(jsonObj.confirmStartingOver || {})
            }
        };
        for (const [key,value] of Object.entries(jsonObj)) {
            if (typeof value === 'string' && !['title','description','mode'].includes(key) && key in result) result[key]=value;
        }
        return result;
    }
};
