/**
 * Caramelia — Création DOM (widget, messages, typing, checklist)
 * @module caramelia/dom
 */

import { CONFIG } from './config.js';
import { state } from './state.js';
import { esc, md, scrollBottom } from './utils.js';
import { t, tActivity } from './i18n.js';

// ── Création du widget (FAB + panel) ──
export function createWidget() {
    const fab = document.createElement('button');
    fab.className = 'caramelia-fab';
    fab.id = 'caramelia-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', t('ui_aria_open'));
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-controls', 'caramelia-panel');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = `
        <img src="${esc(CONFIG.logo)}" alt="${esc(CONFIG.name)}"/>
        <span class="caramelia-fab__badge"></span>`;

    const panel = document.createElement('div');
    panel.className = 'caramelia-panel';
    panel.id = 'caramelia-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', t('ui_aria_dialog'));
    panel.innerHTML = `
        <header class="caramelia-header">
            <img class="caramelia-header__avatar" src="${esc(CONFIG.logo)}" alt=""/>
            <div class="caramelia-header__info">
                <p class="caramelia-header__name">${esc(CONFIG.name)}</p>
            </div>
            <button type="button" class="caramelia-header__expand" aria-label="${esc(t('ui_aria_expand'))}" title="${esc(t('ui_aria_expand'))}">
                <i class="fas fa-expand-alt"></i>
            </button>
            <button type="button" class="caramelia-header__close" aria-label="${esc(t('ui_aria_close'))}">✕</button>
        </header>
        <div class="caramelia-messages" role="log" aria-label="${esc(t('ui_aria_log'))}"></div>
        <div class="caramelia-sr-live" role="status" aria-live="polite" aria-atomic="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;"></div>
        <div class="caramelia-input-area">
            <div class="caramelia-input-bar">
                <button type="button" class="caramelia-attach-btn" aria-label="${esc(t('ui_aria_attach'))}" title="${esc(t('ui_aria_attach'))}">
                    <i class="fas fa-paperclip" aria-hidden="true"></i>
                </button>
                <input type="file" class="caramelia-file-input" hidden multiple accept=".pdf,.docx,.pptx,.odt,.odp,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.presentation,image/png,image/jpeg"/>
                <div class="caramelia-input-slot">
                    <input type="text" class="caramelia-input" placeholder="${esc(t('ui_input_placeholder'))}" aria-label="${esc(t('ui_aria_message'))}"/>
                    <div class="caramelia-recording" hidden aria-hidden="true">
                        <span class="caramelia-recording__time">00:00</span>
                        <canvas class="caramelia-recording__waves"></canvas>
                    </div>
                </div>
                <!-- Bouton X d'annulation : placé AVANT le micro pour qu'il apparaisse à gauche
                     de celui-ci (sinon, en apparition, il pousserait le bouton envoyer vers la
                     droite). Visible UNIQUEMENT pendant l'enregistrement, via la règle CSS
                     sibling sur .caramelia-input-slot--recording. Le micro à droite conserve
                     son rôle de stop and transcribe. -->
                <button type="button" class="caramelia-mic-cancel-btn" aria-label="${esc(t('ui_aria_mic_cancel'))}" title="${esc(t('ui_aria_mic_cancel'))}">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <button type="button" class="caramelia-mic-btn" aria-label="${esc(t('ui_aria_mic_start'))}" title="${esc(t('ui_aria_mic_start'))}" aria-pressed="false">
                    <i class="fas fa-microphone" aria-hidden="true"></i>
                </button>
                <button type="button" class="caramelia-send-btn" aria-label="${esc(t('ui_aria_send'))}">
                    <i class="fas fa-paper-plane" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    state.elements = {
        fab,
        panel,
        messages: panel.querySelector('.caramelia-messages'),
        srLive: panel.querySelector('.caramelia-sr-live'),
        input: panel.querySelector('.caramelia-input'),
        sendBtn: panel.querySelector('.caramelia-send-btn'),
        closeBtn: panel.querySelector('.caramelia-header__close'),
        expandBtn: panel.querySelector('.caramelia-header__expand'),
        attachBtn: panel.querySelector('.caramelia-attach-btn'),
        fileInput: panel.querySelector('.caramelia-file-input'),
        micBtn: panel.querySelector('.caramelia-mic-btn'),
        micCancelBtn: panel.querySelector('.caramelia-mic-cancel-btn'),
        recording: panel.querySelector('.caramelia-recording'),
    };
}

/**
 * Annonce un texte aux lecteurs d'écran via une zone live dédiée et invisible.
 * Permet de ne PAS annoncer le bruit (avatars, boutons quick-reply, animation typing)
 * tout en informant l'utilisateur SR des messages utiles. Le markdown est dépouillé
 * pour éviter de lire "deux astérisques gras deux astérisques".
 */
function announceSr(text) {
    const live = state.elements.srLive;
    if (!live) return;
    const plain = String(text || '').replace(/[*_`#>~|]/g, '').replace(/\n+/g, '. ').trim();
    // Reset → set : certains SR ignorent une mise à jour si le texte est identique
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = plain; });
}

/**
 * Ré-applique les traductions sur les éléments du widget après changement de langue.
 */
export function refreshWidgetLabels() {
    const { fab, panel, messages, input, sendBtn, closeBtn, expandBtn, attachBtn, micBtn, micCancelBtn } = state.elements;
    if (!fab) return;
    fab.setAttribute('aria-label', state.isOpen ? t('ui_aria_close') : t('ui_aria_open'));
    panel.setAttribute('aria-label', t('ui_aria_dialog'));
    if (messages) messages.setAttribute('aria-label', t('ui_aria_log'));
    closeBtn.setAttribute('aria-label', t('ui_aria_close'));
    if (expandBtn) {
        const label = state.isExpanded ? t('ui_aria_shrink') : t('ui_aria_expand');
        expandBtn.setAttribute('aria-label', label);
        expandBtn.setAttribute('title', label);
    }
    input.setAttribute('placeholder', t('ui_input_placeholder'));
    input.setAttribute('aria-label', t('ui_aria_message'));
    sendBtn.setAttribute('aria-label', t('ui_aria_send'));
    if (attachBtn) {
        attachBtn.setAttribute('aria-label', t('ui_aria_attach'));
        attachBtn.setAttribute('title', t('ui_aria_attach'));
    }
    if (micBtn) {
        const isRec = micBtn.classList.contains('caramelia-mic-btn--recording');
        const label = isRec ? t('ui_aria_mic_stop') : t('ui_aria_mic_start');
        micBtn.setAttribute('aria-label', label);
        micBtn.setAttribute('title', label);
    }
    if (micCancelBtn) {
        const cancelLabel = t('ui_aria_mic_cancel');
        micCancelBtn.setAttribute('aria-label', cancelLabel);
        micCancelBtn.setAttribute('title', cancelLabel);
    }
}

// ── Messages ──
export function addBotMessage(text, quickReplies = []) {
    state.history.push({ role: 'bot', text });
    const w = document.createElement('div');
    w.className = 'caramelia-msg caramelia-msg--bot';
    w.innerHTML = `<img class="caramelia-msg__avatar" src="${esc(CONFIG.logo)}" alt=""/><div class="caramelia-msg__bubble">${md(text)}</div>`;
    announceSr(text);

    if (quickReplies.length) {
        // Seul le dernier choix reste actif : une ancienne réponse ne doit pas
        // relancer une intention que la conversation a déjà dépassée.
        state.elements.messages.querySelectorAll('.caramelia-quick-replies').forEach(e => e.remove());
        const qr = document.createElement('div');
        qr.className = 'caramelia-quick-replies';
        for (const r of quickReplies) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'caramelia-quick-btn';
            b.textContent = r.label;
            b.addEventListener('click', () => {
                if (!b.isConnected || state.generationRunning) return;
                state.elements.messages.querySelectorAll('.caramelia-quick-replies').forEach(e => e.remove());
                r.action();
            });
            qr.appendChild(b);
        }
        w.querySelector('.caramelia-msg__bubble').appendChild(qr);
    }

    state.elements.messages.appendChild(w);
    scrollBottom();
    return w;
}

export function addUserMessage(text) {
    state.history.push({ role: 'user', text });
    const w = document.createElement('div');
    w.className = 'caramelia-msg caramelia-msg--user';
    w.innerHTML = `<div class="caramelia-msg__bubble"><p>${esc(text)}</p></div>`;
    state.elements.messages.appendChild(w);
    scrollBottom();
}

export function showTyping() {
    const w = document.createElement('div');
    w.className = 'caramelia-typing';
    w.setAttribute('data-typing', 'true');
    // L'animation visuelle est inutile aux SR — on l'ignore et on annonce un texte clair.
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = `<img class="caramelia-msg__avatar" src="${esc(CONFIG.logo)}" alt=""/>
        <div class="caramelia-typing__dots">
            <span class="caramelia-typing__dot"></span>
            <span class="caramelia-typing__dot"></span>
            <span class="caramelia-typing__dot"></span>
        </div>`;
    state.elements.messages.appendChild(w);
    announceSr(t('ui_typing_status'));
    scrollBottom();
    return w;
}

export function removeTyping() {
    const t = state.elements.messages.querySelector('[data-typing]');
    if (t) t.remove();
}

/**
 * Affiche une checklist d'activités (catégorie ou liste pré-sélectionnée).
 * @param {string[]} moduleKeys — clés à afficher d'emblée
 * @param {string[]} preselected — clés à cocher par défaut
 * @param {string} introKey — clé i18n pour le texte d'intro (defaut: checklist_intro)
 * @param {Function} onValidate — callback(selectedKeys[])
 * @param {{expandKeys?: string[]}} [opts] — `expandKeys` = liste complète révélable
 *   via un bouton « voir toutes les activités » (réponse au retour terrain :
 *   "on ne voyait que quelques activités à cocher"). Les clés déjà visibles sont
 *   ignorées.
 */
export function addCheckboxList(moduleKeys, preselected = [], introKey = 'checklist_intro', onValidate, { expandKeys = [] } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'caramelia-msg caramelia-msg--bot';

    const bubble = document.createElement('div');
    bubble.className = 'caramelia-msg__bubble';
    bubble.innerHTML = `<p>${esc(t(introKey))}</p>`;

    // Wrapper pour le dégradé "scroll indicator" en bas de la liste.
    // Le dégradé est désactivé via une classe quand toutes les activités tiennent
    // dans la fenêtre de 200px (pas de scroll possible → pas besoin du voile).
    const formWrap = document.createElement('div');
    formWrap.className = 'caramelia-checklist-wrap';

    const form = document.createElement('div');
    form.className = 'caramelia-checklist';
    const preset = new Set(preselected);
    const addItem = (key, checked) => {
        const lbl = document.createElement('label');
        lbl.className = 'caramelia-check-item';
        lbl.innerHTML = `<input type="checkbox" value="${esc(key)}"${checked ? ' checked' : ''}/><span>${esc(tActivity(key))}</span>`;
        form.appendChild(lbl);
    };
    for (const key of moduleKeys) addItem(key, preset.has(key));
    formWrap.appendChild(form);

    // Recalcule l'indicateur de scroll (utile après révélation des activités cachées).
    const refreshScrollHint = () => requestAnimationFrame(() => {
        formWrap.classList.toggle('caramelia-checklist-wrap--no-scroll', form.scrollHeight <= form.clientHeight + 1);
    });
    refreshScrollHint();

    const actions = document.createElement('div');
    actions.className = 'caramelia-quick-replies';

    // Bouton « voir toutes les activités » : révèle les clés non encore affichées.
    const hidden = expandKeys.filter(k => !moduleKeys.includes(k));
    if (hidden.length) {
        const showAll = document.createElement('button');
        showAll.type = 'button';
        showAll.className = 'caramelia-quick-btn';
        showAll.textContent = t('checklist_show_all');
        showAll.addEventListener('click', () => {
            for (const key of hidden) addItem(key, false);
            showAll.remove();
            refreshScrollHint();
        });
        actions.appendChild(showAll);
    }

    const selAll = document.createElement('button');
    selAll.type = 'button';
    selAll.className = 'caramelia-quick-btn';
    selAll.textContent = t('checklist_select_all');
    selAll.addEventListener('click', () => form.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true));

    const deselAll = document.createElement('button');
    deselAll.type = 'button';
    deselAll.className = 'caramelia-quick-btn';
    deselAll.textContent = t('checklist_deselect_all');
    deselAll.addEventListener('click', () => form.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false));

    const valBtn = document.createElement('button');
    valBtn.type = 'button';
    valBtn.className = 'caramelia-quick-btn caramelia-quick-btn--primary';
    valBtn.textContent = t('checklist_validate');
    valBtn.addEventListener('click', () => {
        if (!wrapper.isConnected || state.generationRunning) return;
        const selected = Array.from(form.querySelectorAll('input:checked')).map(cb => cb.value);
        if (!selected.length) { addBotMessage(t('checklist_empty')); return; }
        wrapper.remove();
        onValidate(selected);
    });

    actions.appendChild(selAll);
    actions.appendChild(deselAll);
    actions.appendChild(valBtn);

    bubble.appendChild(formWrap);
    bubble.appendChild(actions);
    wrapper.innerHTML = `<img class="caramelia-msg__avatar" src="${esc(CONFIG.logo)}" alt=""/>`;
    wrapper.appendChild(bubble);
    state.elements.messages.appendChild(wrapper);
    announceSr(t(introKey));
    scrollBottom();
}
