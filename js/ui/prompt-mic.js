/**
 * Branche le micro Caramelia sur les champs texte du prompt-generator
 * (Mode Rapide et Mode Avancé) : `#qui`, `#quoi`, `#niveau`.
 *
 * Réutilise tel quel `attachMic`/`isMicSupported` de `js/caramelia/voice.js`
 * et le webhook audio de Caramelia (`CONFIG.audioWebhookUrl`). Aucune
 * duplication de pipeline : c'est le même backend Whisper qui sert
 * Caramelia et le formulaire principal.
 *
 * Différence de UX par rapport à Caramelia :
 *   - Pas de chat panel → on n'utilise pas `addBotMessage` pour les erreurs.
 *     À la place, on affiche une petite bulle ephemère `.prompt-mic-error`
 *     juste sous le champ concerné (cf. css/base/style.css).
 *   - Bouton plus discret (28px au lieu de 32px) intégré dans l'input — voir
 *     `.pg-mic-btn` côté CSS.
 *
 * Si le navigateur ne supporte pas getUserMedia/MediaRecorder, on retire
 * tous les boutons micro pour ne pas afficher une fonctionnalité non
 * opérationnelle.
 */

import { attachMic, isMicSupported } from '../caramelia/voice.js';
import { CONFIG } from '../caramelia/config.js';
import { loadLocale } from '../caramelia/i18n.js';
import { currentLang } from '../core/translation.js';

const ERROR_MESSAGES = {
    mic_error_permission: "Accès au micro refusé. Autorisez l'accès dans les paramètres du navigateur.",
    mic_error_unavailable: "Le micro n'est pas disponible sur cet appareil.",
    mic_error_network: 'La transcription a échoué. Vérifiez votre connexion.',
    mic_too_short: 'Enregistrement trop court — parlez un peu plus longtemps.',
    mic_empty: "Aucun texte n'a pu être transcrit. Réessayez en parlant plus distinctement.",
};

/** IDs des champs texte à équiper. Le `#nombreQuestions` (numérique) est exclu volontairement. */
const TARGET_INPUT_IDS = ['qui', 'quoi', 'niveau'];

/** Affiche une bulle d'erreur ephemère sous l'input puis la retire. */
function flashError(wrapper, message) {
    if (!wrapper) return;
    wrapper.querySelectorAll('.prompt-mic-error').forEach((el) => el.remove());
    const el = document.createElement('div');
    el.className = 'prompt-mic-error';
    el.setAttribute('role', 'alert');
    el.textContent = message;
    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

/**
 * Branche les micros sur les inputs cibles. Idempotent : appeler plusieurs
 * fois ne dédouble pas les listeners (chaque bouton n'est attaché qu'une fois,
 * marqué via `data-pg-mic-attached`).
 */
export async function initPromptMic() {
    const supported = isMicSupported();

    // Précharge la locale Caramelia (utilisée par voice.js pour les aria-labels
    // « Dicter / Arrêter la dictée »). Sans ça, t() renvoie la clé brute tant
    // que le panel chatbot n'a pas été ouvert.
    if (supported) {
        try { await loadLocale(currentLang); } catch { /* fallback FR géré par i18n.js */ }
    }

    for (const id of TARGET_INPUT_IDS) {
        const input = document.getElementById(id);
        if (!input) continue;
        const wrapper = input.closest('.input-icon-wrapper');
        if (!wrapper) continue;
        const button = wrapper.querySelector('.pg-mic-btn');
        const recording = wrapper.querySelector('.caramelia-recording');
        const cancelButton = wrapper.querySelector('.pg-mic-cancel-btn');
        const confirmButton = wrapper.querySelector('.pg-mic-confirm-btn');
        if (!button || !recording) continue;

        if (!supported) {
            // Navigateur sans getUserMedia/MediaRecorder : on retire purement
            // et simplement les boutons — pas d'UI promettant ce qu'on ne peut tenir.
            button.remove();
            if (cancelButton) cancelButton.remove();
            if (confirmButton) confirmButton.remove();
            continue;
        }

        if (button.dataset.pgMicAttached === '1') continue;
        button.dataset.pgMicAttached = '1';

        attachMic({
            button,
            recording,
            cancelButton,
            confirmButton,
            targetInput: input,
            webhookUrl: CONFIG.audioWebhookUrl,
            // Palette gris-bleu pour les barres d'onde, en cohérence avec
            // le bouton micro du formulaire (le doré reste l'apanage de Caramelia).
            waveColor: '#5f7382',
            waveWarnColor: '#C0392B', // warn → rouge conservé (signal universel)
            onError: (messageKey) => {
                const msg = ERROR_MESSAGES[messageKey] || ERROR_MESSAGES.mic_error_unavailable;
                flashError(wrapper, msg);
            },
        });
    }
}
