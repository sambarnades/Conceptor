/**
 * simulators/helpers.js — Utilitaires partagés par tous les simulateurs.
 *
 * Regroupe les helpers qui étaient en haut de l'ancien simulators.js monolithique.
 */

import { translations } from '../core/translation.js';
import { markdownToHtml } from '../core/utils.js';
import { sanitizeSync } from '../export/sanitizer.js';

/** Helper raccourci pour accéder aux traductions avec fallback */
export const tr = (key, fallback) => (translations && translations[key]) || fallback;

/**
 * Helper pour formater le texte Markdown en HTML sécurisé.
 * ORDRE : Sanitize d'abord, puis conversion Markdown (préserve le formatage).
 * @param {string} text - Texte brut avec formatage Markdown basique
 * @returns {string} - HTML sanitizé
 */
export function formatTextSafe(text) {
    if (!text) return '';
    return markdownToHtml(sanitizeSync(text, 'EDUCATIONAL'));
}

/**
 * SEC-01 — Échappement pour le contexte ATTRIBUT entre guillemets doubles.
 * sanitizeSync() est un assainisseur de CORPS HTML : sur une chaîne nue il
 * n'encode PAS `"` et ne retire PAS `javascript:` → inutilisable pour une valeur
 * interpolée dans href="${…}"/src="${…}". On encode &, ", < et > pour interdire
 * la fermeture d'attribut (`x" onerror="…`) et l'ouverture de balise.
 * @param {*} value
 * @returns {string}
 */
export function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * SEC-01 — Validation de schéma d'URL avant injection dans href/src.
 * N'autorise que http:, https:, mailto:, les ancres `#…` et les chemins relatifs.
 * Tout autre schéma (javascript:, data:, vbscript:, blob:, file:…) → `fallback`.
 * Les caractères de contrôle/espaces sont retirés AVANT la détection du schéma
 * (les navigateurs ignorent tab/LF/CR : `java\nscript:` s'exécuterait sinon).
 * @param {string} url
 * @param {string} [fallback='#'] - repli ('' conseillé pour <img src>)
 * @returns {string}
 */
export function safeUrl(url, fallback = '#') {
    const raw = String(url == null ? '' : url).trim();
    if (!raw) return fallback;
    const cleaned = raw.replace(/[\u0000-\u0020\u007F-\u009F]/g, '');
    const m = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (!m) return raw; // ancre, chemin relatif, query — pas de schéma
    const scheme = m[1].toLowerCase();
    return (scheme === 'http' || scheme === 'https' || scheme === 'mailto') ? raw : fallback;
}

/**
 * Ajoute des espaces autour des délimiteurs mathématiques LaTeX pour améliorer la lisibilité.
 * Ne s'applique que si le délimiteur est collé à un caractère (lettre ou chiffre).
 * @param {string} text - Texte brut
 * @returns {string} - Texte avec espaces autour de LaTeX
 */
export function fixMathSpacing(text) {
    if (!text) return '';
    const nbs = '\u00A0';
    return text
        .replace(/([a-zA-Z0-9à-ÿÀ-Ÿ])\s?(\\\(|\\\[)/g, '$1' + nbs + '$2')
        .replace(/(\\\)|\\\])\s?([a-zA-Z0-9à-ÿÀ-Ÿ])/g, '$1' + nbs + '$2');
}

/**
 * Résout la cible du plein écran à partir du bouton : le conteneur de rendu du
 * simulateur (marqué `data-sim-root` par renderSimulator), avec replis pour les
 * contextes connus (modale Caramel). Évalué au CLIC, pas à la création.
 * @param {HTMLElement} btn
 * @returns {HTMLElement}
 */
function resolveFullscreenTarget(btn) {
    return btn.closest('[data-sim-root]')
        || btn.closest('.preview-modal__preview, .sim-mount')
        || btn.parentElement
        || document.documentElement;
}

/**
 * Écouteur global (enregistré une seule fois) qui synchronise l'icône de TOUS
 * les boutons plein écran des simulateurs à chaque `fullscreenchange`. Évite la
 * dépendance à une délégation par contexte (le bouton interne marchait jusqu'ici
 * uniquement dans la modale Caramel — mort en éditeur/embed Sucrerie).
 */
let _fsIconSyncRegistered = false;
function ensureFullscreenIconSync() {
    if (_fsIconSyncRegistered) return;
    _fsIconSyncRegistered = true;
    document.addEventListener('fullscreenchange', () => {
        const isFS = !!document.fullscreenElement;
        document.querySelectorAll('.preview-modal__fullscreen-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-compress', isFS);
                icon.classList.toggle('fa-expand', !isFS);
            }
            const label = isFS ? tr('exit_fullscreen', 'Quitter le plein écran') : tr('fullscreen', 'Plein écran');
            btn.title = label;
            btn.setAttribute('aria-label', label);
        });
    });
}

/**
 * Crée et retourne un bouton plein écran AUTONOME pour les simulateurs.
 * Le clic bascule le plein écran sur le conteneur de rendu du simulateur
 * (résolu via `data-sim-root`) — fonctionne dans tous les contextes (modale
 * Caramel, preview éditeur, embed), sans dépendre d'une délégation externe.
 * @param {boolean} integrated - Si vrai, ajoute une classe pour une intégration plus discrète dans les en-têtes.
 * @returns {HTMLButtonElement}
 */
export function createFullscreenButton(integrated = true) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preview-modal__fullscreen-btn';
    if (integrated) btn.classList.add('preview-modal__fullscreen-btn--integrated');

    const title = tr('fullscreen', 'Plein écran');
    btn.title = title;
    btn.setAttribute('aria-label', title);

    const isFS = !!document.fullscreenElement;
    btn.innerHTML = isFS ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } else {
            const target = resolveFullscreenTarget(btn);
            if (target && target.requestFullscreen) target.requestFullscreen().catch(() => {});
        }
    });
    ensureFullscreenIconSync();

    return btn;
}

/**
 * Émet la complétion d'un simulateur scorable (mode élève uniquement) : un
 * CustomEvent `simulator:completed` qui remonte (bubbles) jusqu'au contexte
 * (embed Sucrerie) pour le parcours collection (déblocage / seuil de réussite).
 * No-op hors mode élève.
 * @param {HTMLElement} container - conteneur de rendu du simulateur
 * @param {'teacher'|'student'} mode
 * @param {number} scorePct - score de réussite 0–100
 */
export function emitSimulatorCompleted(container, mode, scorePct) {
    if (!container || mode !== 'student') return;
    const pct = Math.max(0, Math.min(100, Math.round(Number(scorePct) || 0)));
    container.dispatchEvent(new CustomEvent('simulator:completed', {
        detail: { scorePct: pct },
        bubbles: true,
    }));
}

/**
 * A11Y-03/04/05 — active un pseudo-bouton (div role="button") au clavier
 * (Enter / Espace), en miroir de son onclick.
 * @param {HTMLElement} el
 * @param {(e: KeyboardEvent) => void} handler
 */
export function activateOnKey(el, handler) {
    if (!el || typeof handler !== 'function') return;
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            handler(e);
        }
    });
}

/**
 * A11Y-06 — préserve le focus clavier à travers un re-render destructif
 * (`container.innerHTML = ''` puis reconstruction). Mémorise la clé
 * `data-focus-key` de l'élément actif avant le wipe, re-focuse l'équivalent
 * après, sinon retombe sur `fallbackSelector` puis le premier focusable.
 * @param {HTMLElement} container
 * @param {() => void} renderFn
 * @param {string} [fallbackSelector]
 */
export function rerenderPreservingFocus(container, renderFn, fallbackSelector) {
    if (!container) { renderFn(); return; }
    const active = document.activeElement;
    const wasInside = !!(active && container.contains(active));
    const key = wasInside ? active.getAttribute('data-focus-key') : null;

    renderFn();

    if (!wasInside) return;
    if (key) {
        const escaped = (window.CSS && CSS.escape) ? CSS.escape(key) : key;
        const same = container.querySelector(`[data-focus-key="${escaped}"]`);
        if (same) {
            // preventScroll : ne pas « tirer » la vue vers l'élément refocalisé
            // (flèche / bouton d'action) au changement de question — sinon rebond.
            same.focus({ preventScroll: true });
            if (document.activeElement === same) return;
        }
    }
    const fb = (fallbackSelector && container.querySelector(fallbackSelector)) ||
               container.querySelector('button:not([disabled]), [tabindex="0"]');
    if (fb) fb.focus({ preventScroll: true });
}
