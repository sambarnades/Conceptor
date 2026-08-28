/**
 * Caramelia — Point d'entrée
 * Bootstrap du chatbot flottant. À désactiver : retirer la balise
 * <script type="module" src="js/caramelia/index.js"> dans index.html.
 *
 * Architecture :
 *   index.js        → bootstrap (ce fichier)
 *   config.js       → constantes (CONFIG, fuzzyMap, enums, timing)
 *   state.js        → état partagé
 *   i18n.js         → détection langue Caramel + helper t()
 *   utils.js        → escape, markdown léger, scroll
 *   dom.js          → création widget, messages, checklist
 *   extractor.js    → extraction d'intention LLM (<DATA>...</DATA>)
 *   chat.js         → mode aide (chat libre)
 *   actions.js      → interactions DOM Caramel (tuiles, sidebar, MutationObserver)
 *   flow.js         → orchestration des conversations (router intelligent)
 *   locales/*.json  → 11 langues
 *
 * @module caramelia
 */

import { state } from './state.js';
import { CONFIG } from './config.js';
import { loadLocale, syncLocale, getLang } from './i18n.js';
import { currentLang } from '../core/translation.js';
import { createWidget, refreshWidgetLabels, addUserMessage } from './dom.js';
import { showWelcome, handleUserInput, resetConversation } from './flow.js';
import { t } from './i18n.js';
import { sanitizeUserInput } from './security.js';
import { setupDragAndDrop, handleAttachment } from './attachment.js';
import { attachMic, isMicSupported } from './voice.js';

// Mémorise le dernier élément focus avant ouverture pour restaurer le focus à la fermeture (a11y)
let lastFocusedBeforeOpen = null;

// ── Application d'un changement de langue ──
/**
 * Répercute une langue fraîchement chargée sur ce qui est DÉJÀ à l'écran.
 *
 * Recharger la locale ne suffit pas : `refreshWidgetLabels()` ne repeint que le
 * châssis (aria-labels, title, placeholder). Les seuls textes VISIBLES du panneau
 * sont les bulles et leurs boutons de réponse rapide, peints une fois pour toutes
 * par `addBotMessage()` — ils restaient donc dans l'ancienne langue.
 *
 * Règle retenue : on ne repeint que si la conversation n'a pas commencé (bulle
 * d'accueil seule, aucun flux engagé). Une vraie conversation est un HISTORIQUE :
 * on ne la réécrit pas rétroactivement — les messages suivants, eux, sortiront
 * dans la nouvelle langue puisque `t()` lit la locale rechargée.
 */
function applyLanguageChange() {
    // `refreshWidgetLabels()` sort en early-return quand le widget n'existe pas, mais
    // `resetConversation()` descend jusqu'à `addBotMessage()`, qui fait
    // `state.elements.messages.appendChild(...)` SANS garde. Comme ce code est appelé
    // par un setInterval de 2 s qui survit à la page l'ayant créé (`test-caramelia-ui.js`
    // réimporte ce module dans une iframe), on refuse de repeindre un widget absent
    // plutôt que de lever une TypeError toutes les 2 secondes.
    if (!state.elements.fab || !state.elements.messages) return;

    refreshWidgetLabels();
    const conversationVierge = state.history.length <= 1 && !state.currentFlow;
    if (conversationVierge) resetConversation();
}

// ── Toggle ──
async function toggle() {
    state.isOpen = !state.isOpen;
    state.elements.fab.classList.toggle('caramelia-fab--open', state.isOpen);
    state.elements.panel.classList.toggle('caramelia-panel--open', state.isOpen);
    state.elements.fab.setAttribute('aria-label', state.isOpen ? t('ui_aria_close') : t('ui_aria_open'));
    state.elements.fab.setAttribute('aria-expanded', state.isOpen ? 'true' : 'false');

    if (state.isOpen) {
        lastFocusedBeforeOpen = document.activeElement;

        // Si la langue Caramel a changé entre-temps, recharger la locale et repeindre.
        // Ce chemin sert quand l'utilisateur ouvre le panneau dans les 2 s qui suivent
        // le changement de drapeau, avant que le poller de watchLanguageChanges() ait vu.
        const prev = getLang();
        await syncLocale();
        if (getLang() !== prev) applyLanguageChange();

        if (!state.history.length) showWelcome();
        setTimeout(() => state.elements.input.focus(), 350);
    } else {
        // Restaurer le focus sur ce qui l'avait avant (FAB par défaut), sans bloc visible si l'élément a disparu
        const target = (lastFocusedBeforeOpen && document.body.contains(lastFocusedBeforeOpen))
            ? lastFocusedBeforeOpen
            : state.elements.fab;
        target.focus();
        lastFocusedBeforeOpen = null;
    }
}

// ── Expansion ──
function toggleExpand() {
    state.isExpanded = !state.isExpanded;
    state.elements.panel.classList.toggle('caramelia-panel--expanded', state.isExpanded);
    const label = state.isExpanded ? t('ui_aria_shrink') : t('ui_aria_expand');
    state.elements.expandBtn.setAttribute('aria-label', label);
    state.elements.expandBtn.setAttribute('title', label);
    state.elements.expandBtn.querySelector('i').className = state.isExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
}

function close() {
    if (state.isOpen) toggle();
    if (state.isExpanded) toggleExpand();
}

// ── Détection langue Caramel : refresh widget si elle change ──
function watchLanguageChanges() {
    let lastLang = currentLang;
    // Polling léger toutes les 2s : moins fragile qu'écouter un sélecteur précis
    setInterval(async () => {
        if (currentLang !== lastLang) {
            lastLang = currentLang;
            await loadLocale(currentLang);
            applyLanguageChange();
        }
    }, 2000);
}

// ── Click hors panel : ne ferme pas si on clique dans une modal Caramel ──
function isInsideCaramelModal(target) {
    if (!target || !(target instanceof Element)) return false;
    return !!target.closest(
        '.modal, .modal-overlay, #module-sidebar, .notification-center, ' +
        '.json-editor, .help-modal, .preview-modal, .formula-assistant'
    );
}

// ── Bind events ──
function bindEvents() {
    state.elements.fab.addEventListener('click', toggle);
    state.elements.closeBtn.addEventListener('click', close);
    if (state.elements.expandBtn) {
        state.elements.expandBtn.addEventListener('click', toggleExpand);
    }
    state.elements.sendBtn.addEventListener('click', submitInput);
    state.elements.input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submitInput(); }
    });
    // Bouton trombone : ouvre le sélecteur de fichiers, puis délègue à handleAttachment
    if (state.elements.attachBtn && state.elements.fileInput) {
        state.elements.attachBtn.addEventListener('click', () => state.elements.fileInput.click());
        state.elements.fileInput.addEventListener('change', (e) => {
            for (const file of e.target.files) handleAttachment(file);
            e.target.value = ''; // permet de re-sélectionner le même fichier
        });
    }
    // Bouton micro : enregistre puis envoie au webhook de transcription.
    // On masque le bouton si le navigateur ne supporte pas l'API
    // (Safari < 14, contexte non sécurisé, etc.) plutôt que d'afficher
    // un bouton qui jetterait à chaque clic.
    if (state.elements.micBtn && state.elements.recording) {
        if (isMicSupported()) {
            attachMic({
                button: state.elements.micBtn,
                recording: state.elements.recording,
                cancelButton: state.elements.micCancelBtn,
                targetInput: state.elements.input,
                webhookUrl: CONFIG.audioWebhookUrl,
            });
        } else {
            state.elements.micBtn.hidden = true;
            // Sans micro fonctionnel, le bouton ✕ associé n'a pas lieu d'exister non plus.
            if (state.elements.micCancelBtn) state.elements.micCancelBtn.remove();
        }
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && state.isOpen) close();
    });
    state.elements.panel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
        if (!state.isOpen) return;
        if (state.elements.fab.contains(e.target)) return;
        if (isInsideCaramelModal(e.target)) return;
        close();
    });
}

function submitInput() {
    const raw = (state.elements.input.value || '').trim();
    if (!raw) return;
    state.elements.input.value = '';
    // Nettoyage léger (caractères de contrôle, marqueurs internes, longueur max)
    const text = sanitizeUserInput(raw);
    if (!text) return;
    addUserMessage(text);
    handleUserInput(text);
}

// ── Boot ──
async function boot() {
    // Charger la locale courante avant de créer le widget (pour avoir les bons aria-labels)
    await loadLocale(currentLang);
    createWidget();
    bindEvents();
    setupDragAndDrop();
    watchLanguageChanges();
    console.log(`[Caramelia] 🍬 Chatbot v${CONFIG.version} initialisé (lang: ${getLang()})`);
}

// API debug exposée sur window (utile avec ?debug)
if (window.location.search.includes('debug')) {
    window.Caramelia = {
        open: () => { if (!state.isOpen) toggle(); },
        close,
        reset: resetConversation,
        state,
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
