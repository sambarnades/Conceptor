/**
 * Mise à jour du bouton "Vers la Sucrerie" dans le footer de la modale.
 *
 * Le bouton est désormais présent en **statique** dans le HTML hôte
 * (`<button data-sucrerie-bridge-btn>` dans `.preview-modal__footer-left`),
 * pour qu'il s'affiche en même temps que le reste de la modale (plus aucun
 * affichage en décalé). Cette fonction se contente de :
 *   - retrouver le bouton via l'attribut `data-sucrerie-bridge-btn` ;
 *   - mettre à jour le libellé / l'icône / l'aria-label avec les traductions ;
 *   - basculer en état "Déjà partagé" disabled si la notification courante a
 *     déjà été publiée pendant la session (cf. sessionStorage) ;
 *   - (re)attacher le handler de clic, en remplaçant proprement un éventuel
 *     handler précédent (cas de la navigation prev/next entre notifications).
 *
 * Fallback : si l'élément statique est absent (vieille copie d'index.html
 * antérieure au refactor), on le crée à la volée pour garder le comportement
 * historique.
 *
 * Pour masquer le bouton en production : ajouter `hidden` ou
 * `style="display:none"` sur le `<button>` statique — pas besoin de toucher au
 * JS, et le kill switch `SUCRERIE_BRIDGE.enabled` reste la voie propre pour
 * couper aussi la logique métier.
 */

import { SUCRERIE_BRIDGE } from '../config.js';

const BUTTON_DATA_ATTR = 'data-sucrerie-bridge-btn';

function notificationKey(notification) {
    if (notification.id) return String(notification.id);
    const size = notification.blob?.size || 0;
    return `${notification.titleKey || 'unknown'}_${size}`;
}

function isAlreadyShared(notification) {
    try {
        const key = `${SUCRERIE_BRIDGE.storagePrefix}shared_${notificationKey(notification)}`;
        return !!sessionStorage.getItem(key);
    } catch {
        return false;
    }
}

/**
 * Crée le bouton à la volée et l'insère dans le footer-left, après le groupe
 * "Télécharger" s'il existe (fallback si le HTML statique n'a pas le bouton).
 */
function createFallbackButton(footerLeft) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sucrerie-bridge__btn action-btn';
    btn.setAttribute(BUTTON_DATA_ATTR, '');

    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = 'fas fa-share-from-square';

    const span = document.createElement('span');
    span.className = 'sucrerie-bridge__btn-label-long';

    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' '));
    btn.appendChild(span);

    const downloadGroup = footerLeft.querySelector('.preview-modal__download-group');
    if (downloadGroup && downloadGroup.nextSibling) {
        footerLeft.insertBefore(btn, downloadGroup.nextSibling);
    } else {
        footerLeft.appendChild(btn);
    }
    return btn;
}

/**
 * @param {Object} ctx
 * @param {HTMLElement}      ctx.modal        — élément `.preview-modal`
 * @param {Object}           ctx.notification — notification Caramel courante
 * @param {Object}           ctx.translations — pack i18n chargé
 * @param {(ev: MouseEvent) => void} ctx.onClick — handler clic
 * @returns {HTMLButtonElement|null}
 */
export function injectButton({ modal, notification, translations, onClick }) {
    const footerLeft = modal.querySelector('.preview-modal__footer-left');
    if (!footerLeft) return null;

    // Le bouton existe normalement déjà dans le HTML statique de la modale.
    // S'il manque (vieille copie ou contexte exotique), on le crée à la volée.
    let btn = footerLeft.querySelector(`[${BUTTON_DATA_ATTR}]`);
    if (!btn) btn = createFallbackButton(footerLeft);

    let icon = btn.querySelector('i');
    let span = btn.querySelector('.sucrerie-bridge__btn-label-long');

    // Auto-réparation si la structure interne a divergé (sécurité défensive).
    if (!icon) {
        icon = document.createElement('i');
        icon.setAttribute('aria-hidden', 'true');
        btn.insertBefore(icon, btn.firstChild);
    }
    if (!span) {
        span = document.createElement('span');
        span.className = 'sucrerie-bridge__btn-label-long';
        btn.appendChild(span);
    }

    const alreadyShared = isAlreadyShared(notification);
    const labelDefault = translations.sucrerie_bridge_btn || 'Vers la Sucrerie';
    const labelShared  = translations.sucrerie_bridge_already_shared || 'Déjà partagé';
    const label = alreadyShared ? labelShared : labelDefault;
    const aria  = translations.sucrerie_bridge_btn_aria || labelDefault;

    btn.setAttribute('aria-label', aria);
    icon.className = alreadyShared ? 'fas fa-circle-check' : 'fas fa-share-from-square';
    span.textContent = label;

    // Retire un éventuel handler précédent (navigation prev/next entre
    // notifications) avant d'attacher le nouveau. La référence est stockée
    // sur l'élément pour pouvoir la retrouver à l'appel suivant.
    if (btn._sucrerieClickHandler) {
        btn.removeEventListener('click', btn._sucrerieClickHandler);
        btn._sucrerieClickHandler = null;
    }

    if (alreadyShared) {
        btn.disabled = true;
    } else {
        btn.disabled = false;
        const handler = (ev) => onClick(ev, { modal, notification });
        btn._sucrerieClickHandler = handler;
        btn.addEventListener('click', handler);
    }

    return btn;
}
