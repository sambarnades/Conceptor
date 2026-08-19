/**
 * Modale de confirmation stylée Sucrerie.
 *
 * Remplace `window.confirm()` (dialogue navigateur natif moche) par une vraie
 * modale aux couleurs de la Sucrerie. API Promise pour usage async.
 *
 * Note : `beforeunload` continue d'utiliser le dialogue natif (impossible
 * d'afficher une modale custom pendant un unload, contrainte navigateur).
 */

import { escapeHtml as escape } from '../../core/escape.js';

const OVERLAY_DATA = 'data-sucrerie-bridge-confirm';

/**
 * @param {Object} opts
 * @param {string} opts.message       — texte principal
 * @param {string} [opts.title]       — titre (optionnel)
 * @param {string} [opts.confirmLabel] — libellé bouton de confirmation
 * @param {string} [opts.cancelLabel]  — libellé bouton d'annulation
 * @param {string} [opts.variant]     — 'danger' (rouge) | 'warning' (défaut, berry)
 * @returns {Promise<boolean>}        — true si confirmé, false sinon
 */
export function showConfirmDialog(opts = {}) {
    const {
        message = '',
        title = '',
        confirmLabel = 'Confirmer',
        cancelLabel = 'Annuler',
        variant = 'warning'
    } = opts;

    return new Promise((resolve) => {
        // Si une modale précédente traîne (cas rare), on la nettoie
        document.querySelectorAll(`[${OVERLAY_DATA}]`).forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'sucrerie-bridge__confirm-overlay';
        overlay.setAttribute(OVERLAY_DATA, '');

        const dialog = document.createElement('div');
        dialog.className = 'sucrerie-bridge__confirm-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        dialog.innerHTML = `
            <div class="sucrerie-bridge__confirm-icon sucrerie-bridge__confirm-icon--${escape(variant)}">
                <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
            </div>
            ${title ? `<h3 class="sucrerie-bridge__confirm-title">${escape(title)}</h3>` : ''}
            <p class="sucrerie-bridge__confirm-message">${escape(message)}</p>
            <div class="sucrerie-bridge__confirm-actions">
                <button type="button" class="sucrerie-bridge__btn-ghost" data-action="cancel">
                    ${escape(cancelLabel)}
                </button>
                <button type="button" class="sucrerie-bridge__btn-primary" data-action="confirm">
                    ${escape(confirmLabel)}
                </button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const previousFocus = document.activeElement;

        const cleanup = (result) => {
            document.removeEventListener('keydown', onKey, true);
            overlay.remove();
            try { previousFocus && previousFocus.focus && previousFocus.focus(); } catch { /* ignore */ }
            resolve(!!result);
        };

        dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
        dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) cleanup(false);
        });

        const onKey = (ev) => {
            if (ev.key === 'Escape') {
                ev.stopImmediatePropagation();
                ev.preventDefault();
                cleanup(false);
            } else if (ev.key === 'Enter' && ev.target.tagName !== 'TEXTAREA') {
                ev.stopImmediatePropagation();
                ev.preventDefault();
                cleanup(true);
            }
        };
        document.addEventListener('keydown', onKey, true);

        // Focus par défaut sur le bouton Annuler (option la moins destructrice)
        setTimeout(() => {
            dialog.querySelector('[data-action="cancel"]')?.focus();
        }, 30);
    });
}

// Doublon retiré : sémantique strictement identique au canonique.
// (`escape` masquait en plus la globale du même nom.)
