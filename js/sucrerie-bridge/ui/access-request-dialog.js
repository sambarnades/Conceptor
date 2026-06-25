/**
 * access-request-dialog.js — Modale de demande d'accès, INTÉGRÉE au pont.
 *
 * Affichée quand un email pro non whitelisté est saisi à l'étape email du dépôt.
 * Au lieu de renvoyer vers un site externe, on ouvre CE formulaire directement
 * dans l'hôte (Caramel / aManDe). Soumet à l'endpoint Sucrerie
 * `/sucrerie-access-request` (même backend que la modale Story C1 de la Sucrerie :
 * stockage dans sucrerie.access_request + mail admin, réponse RGPD-safe).
 *
 * AUTO-PORTÉ : crée son propre DOM ET injecte son propre CSS (aucun markup ni
 * style pré-existant requis). C'est volontaire — `styles.css` du pont diverge
 * entre Caramel et aManDe, donc embarquer le style ici garantit une reproduction
 * byte-identique par simple `cp` de ce fichier. Réutilise tout de même les classes
 * overlay/dialog/boutons déjà présentes dans les deux `styles.css`.
 */

import { SUCRERIE_BRIDGE } from '../config.js';
import { t } from '../i18n/index.js';

const OVERLAY_DATA = 'data-sucrerie-bridge-access';
const STYLE_ID = 'sucrerie-bridge-access-styles';
const MOTIF_MIN_LENGTH = 20;

/**
 * Ouvre la modale de demande d'accès.
 * @param {object} opts
 * @param {string} [opts.email]        — email à pré-remplir (celui qui vient d'être refusé)
 * @param {Object} [opts.translations] — dictionnaire i18n courant du pont
 * @param {HTMLElement} [opts.triggerElement] — élément à re-focus à la fermeture
 */
export function openAccessRequestDialog({ email = '', translations = null, triggerElement = null } = {}) {
    ensureAccessRequestStyles();
    document.querySelectorAll(`[${OVERLAY_DATA}]`).forEach(el => el.remove());

    const tr = (key) => t(key, translations);

    const overlay = document.createElement('div');
    overlay.className = 'sucrerie-bridge__confirm-overlay';
    overlay.setAttribute(OVERLAY_DATA, '');

    const dialog = document.createElement('div');
    dialog.className = 'sucrerie-bridge__confirm-dialog sucrerie-bridge__access-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    dialog.innerHTML = `
        <h3 class="sucrerie-bridge__confirm-title">${esc(tr('sucrerie_bridge_error_email_request_access'))}</h3>
        <div data-access-form-area>
        <p class="sucrerie-bridge__access-desc">${esc(tr('sucrerie_bridge_access_desc'))}</p>
        <form class="sucrerie-bridge__access-form" novalidate>
            <label class="sucrerie-bridge__access-label">
                <span>${esc(tr('sucrerie_bridge_access_email_label'))}</span>
                <input type="email" name="email" autocomplete="email" required>
            </label>
            <div class="sucrerie-bridge__access-row">
                <label class="sucrerie-bridge__access-label">
                    <span>${esc(tr('sucrerie_bridge_field_firstname'))}</span>
                    <input type="text" name="first_name" autocomplete="given-name" maxlength="100" required>
                </label>
                <label class="sucrerie-bridge__access-label">
                    <span>${esc(tr('sucrerie_bridge_field_lastname'))}</span>
                    <input type="text" name="last_name" autocomplete="family-name" maxlength="100" required>
                </label>
            </div>
            <label class="sucrerie-bridge__access-label">
                <span>${esc(tr('sucrerie_bridge_access_structure_label'))}</span>
                <input type="text" name="structure" maxlength="200" placeholder="${esc(tr('sucrerie_bridge_access_structure_placeholder'))}">
            </label>
            <label class="sucrerie-bridge__access-label">
                <span>${esc(tr('sucrerie_bridge_access_motif_label'))}</span>
                <textarea name="motif" rows="4" minlength="20" maxlength="2000" required placeholder="${esc(tr('sucrerie_bridge_access_motif_placeholder'))}"></textarea>
            </label>
            <p class="sucrerie-bridge__access-error" data-access-error role="alert" hidden></p>
            <div class="sucrerie-bridge__confirm-actions">
                <button type="button" class="sucrerie-bridge__btn-ghost" data-action="cancel">${esc(tr('sucrerie_bridge_btn_cancel'))}</button>
                <button type="submit" class="sucrerie-bridge__btn-primary" data-action="submit">${esc(tr('sucrerie_bridge_access_submit'))}</button>
            </div>
        </form>
        </div>
        <div class="sucrerie-bridge__access-sent" data-access-sent hidden>
            <div class="sucrerie-bridge__confirm-icon sucrerie-bridge__confirm-icon--success">
                <i class="fas fa-circle-check" aria-hidden="true"></i>
            </div>
            <p class="sucrerie-bridge__confirm-message">${esc(tr('sucrerie_bridge_access_sent'))}</p>
            <div class="sucrerie-bridge__confirm-actions">
                <button type="button" class="sucrerie-bridge__btn-primary" data-action="close">${esc(tr('sucrerie_bridge_access_close'))}</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const previousFocus = triggerElement || document.activeElement;
    const form     = dialog.querySelector('form');
    const formArea = dialog.querySelector('[data-access-form-area]');
    const sent     = dialog.querySelector('[data-access-sent]');
    const errEl   = dialog.querySelector('[data-access-error]');
    const emailIn = dialog.querySelector('input[name="email"]');
    if (email) emailIn.value = email;

    const cleanup = () => {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        try { previousFocus && previousFocus.focus && previousFocus.focus(); } catch { /* ignore */ }
    };
    const onKey = (ev) => {
        if (ev.key === 'Escape') { ev.stopImmediatePropagation(); ev.preventDefault(); cleanup(); }
    };
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cleanup(); });
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', cleanup);
    dialog.querySelector('[data-action="close"]').addEventListener('click', cleanup);

    const setError = (key) => { errEl.textContent = tr(key); errEl.hidden = false; };

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const data = new FormData(form);
        const val = (k) => String(data.get(k) || '').trim();
        const emailV = val('email').toLowerCase();
        const firstName = val('first_name');
        const lastName  = val('last_name');
        const structure = val('structure');
        const motif     = val('motif');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailV)) { setError('sucrerie_bridge_error_email_invalid'); emailIn.focus(); return; }
        if (!firstName) { setError('sucrerie_bridge_access_error_first_name'); return; }
        if (!lastName)  { setError('sucrerie_bridge_access_error_last_name');  return; }
        if (motif.length < MOTIF_MIN_LENGTH) { setError('sucrerie_bridge_access_error_motif'); return; }

        errEl.hidden = true;
        const submitBtn = dialog.querySelector('[data-action="submit"]');
        submitBtn.disabled = true;
        try {
            const resp = await fetch(SUCRERIE_BRIDGE.endpoints.accessRequest, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailV, first_name: firstName, last_name: lastName,
                    structure, motif
                })
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            formArea.hidden = true;
            sent.hidden = false;
            dialog.querySelector('[data-action="close"]')?.focus();
        } catch (err) {
            setError('sucrerie_bridge_access_error_submit');
            submitBtn.disabled = false;
        }
    });

    // Focus : email vide → email ; pré-rempli → prénom.
    setTimeout(() => {
        (email ? form.querySelector('input[name="first_name"]') : emailIn)?.focus();
    }, 30);
}

/**
 * Injecte (une seule fois) le CSS du widget : styles de la modale + du bouton
 * « Demander un accès » affiché sous le champ email. Embarqué ici plutôt que dans
 * styles.css car celui-ci diverge entre Caramel et aManDe → garde la reproduction
 * triviale (cp de ce seul fichier).
 */
export function ensureAccessRequestStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.sucrerie-bridge__access-dialog { max-width: 480px; text-align: left; }
.sucrerie-bridge__access-desc { margin: 0 0 18px; color: #5a5050; font-size: 0.9em; line-height: 1.5; }
.sucrerie-bridge__access-form { display: flex; flex-direction: column; gap: 12px; }
.sucrerie-bridge__access-row { display: flex; gap: 12px; flex-wrap: wrap; }
.sucrerie-bridge__access-row > .sucrerie-bridge__access-label { flex: 1 1 140px; min-width: 0; }
.sucrerie-bridge__access-label { display: flex; flex-direction: column; gap: 5px; font-size: 0.82em; font-weight: 600; color: var(--sucrerie-berry, #643c45); }
.sucrerie-bridge__access-label input,
.sucrerie-bridge__access-label textarea { font: inherit; font-weight: 400; color: #1a1a1a; padding: 9px 11px; border: 1px solid #d8c9cd; border-radius: 8px; background: #fff; width: 100%; box-sizing: border-box; }
.sucrerie-bridge__access-label textarea { resize: vertical; min-height: 76px; }
.sucrerie-bridge__access-label input:focus,
.sucrerie-bridge__access-label textarea:focus { outline: none; border-color: var(--sucrerie-berry, #643c45); box-shadow: 0 0 0 3px rgba(100, 60, 69, 0.12); }
.sucrerie-bridge__access-error { margin: 2px 0 0; color: #a83836; font-size: 0.85em; font-weight: 600; }
.sucrerie-bridge__access-dialog .sucrerie-bridge__confirm-actions { margin-top: 6px; }
.sucrerie-bridge__access-sent { text-align: center; }
.sucrerie-bridge__confirm-icon--success { background: #e3f4e8; color: #2e7d4f; }
.sucrerie-bridge__email-error-msg { display: block; }
.sucrerie-bridge__access-request-btn { display: inline-flex; align-items: center; gap: 7px; margin-top: 10px; padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(100, 60, 69, 0.18); background: var(--sucrerie-pink, #ffd9df); color: var(--sucrerie-berry, #643c45); font: inherit; font-size: 0.88em; font-weight: 600; cursor: pointer; transition: background-color 0.15s ease; }
.sucrerie-bridge__access-request-btn:hover { background: var(--sucrerie-pink-hover, #fcc3ce); }
.sucrerie-bridge__access-request-btn i { font-size: 0.9em; opacity: 0.85; }
`;
    (document.head || document.documentElement).appendChild(style);
}

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
