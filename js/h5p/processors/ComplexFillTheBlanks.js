/**
 * Processeur H5P — Texte à trous complexe (H5P.AdvancedBlanks)
 *
 * Le JSON est supposé déjà au format H5P.AdvancedBlanks : ce processeur le
 * recopie et y ajoute les libellés d'interface. Ceux-ci vivent à la RACINE des
 * params (pas dans un groupe `l10n`, contrairement à la plupart des libs).
 * Sans eux, boutons et dialogues restaient en anglais quelle que soit la langue.
 *
 * Les valeurs déjà présentes dans le JSON d'entrée sont respectées (l'étalement
 * de `jsonObj` vient en dernier).
 *
 * @module processors/ComplexFillTheBlanks
 * @exports {Object} default.process - Retourne le JSON complété des libellés UI
 */
import { translations } from '../../core/translation.js';

export default {
    process: (jsonObj) => {
        return {
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            submitAnswer: translations.h5p_submit_answer || "Valider",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolutions: translations.h5p_show_solution || "Afficher la solution",
            notFilledOut: translations.h5p_blanks_not_filled_out || "Veuillez remplir tous les champs.",
            tipLabel: translations.h5p_tip_label || "Indice",
            spellingMistakeWarning: translations.h5p_advanced_blanks_spelling_warning || "Vérifiez votre orthographe : @mistake",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            confirmCheck: {
                header: translations.h5p_finish_header || "Terminer ?",
                body: translations.h5p_finish_body || "Êtes-vous sûr de vouloir terminer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_finish_label || "Terminer"
            },
            confirmRetry: {
                header: translations.h5p_retry_header || "Recommencer ?",
                body: translations.h5p_retry_body || "Êtes-vous sûr de vouloir recommencer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_retry_confirm_label || "Confirmer"
            },
            ...jsonObj
        };
    }
};
