/**
 * Pont Caramel ↔ La Sucrerie — point d'entrée.
 *
 * Exporte `mountSucrerieButton({ modal, notification })` appelé par
 * `js/ui/notifications.js` à chaque ouverture/navigation de la modale de
 * visualisation (point d'extension unique : 1 ligne).
 *
 * Si le kill switch (`SUCRERIE_BRIDGE.enabled`) est `false`, la fonction
 * retourne immédiatement sans rien créer dans le DOM ni charger la moindre
 * ressource.
 *
 * Phase 1 : bouton visible + no-op au clic.
 * Phases ultérieures : welcome-screen, deposit-flow, success-screen.
 */

import { SUCRERIE_BRIDGE } from './config.js';
import { loadTranslations } from './i18n/index.js';
import { injectButton } from './ui/button.js';
import { runSucrerieFlow } from './ui/deposit-flow.js';

let _stylesLoaded = false;
let _currentMount = null;          // { modal, notification, userIntent } du dernier mount
let _langObserverInstalled = false;
let _langChangeToken = 0;          // anti-course si l'utilisateur enchaîne plusieurs switches

/**
 * Garantit que la feuille de styles du pont est chargée.
 *
 * Cas nominal : le `<link rel="stylesheet" data-sucrerie-bridge>` est déclaré
 * en statique dans `index.html` (pour éviter le FOUC sur le bouton de la
 * modale, désormais lui aussi statique). On le détecte ici et on ne fait
 * rien.
 *
 * Fallback : si le `<link>` statique est absent (vieille copie sandbox ou
 * intégration custom), on l'injecte à la volée pour préserver l'ergonomie
 * historique.
 */
function ensureStyles() {
    if (_stylesLoaded) return;
    if (document.querySelector('link[data-sucrerie-bridge]')) {
        _stylesLoaded = true;
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./styles.css', import.meta.url).href;
    link.dataset.sucrerieBridge = '';
    document.head.appendChild(link);
    _stylesLoaded = true;
}

/**
 * Installe (idempotent) un MutationObserver sur `<html>` qui détecte les
 * changements d'attribut `lang` provoqués par le sélecteur de langue de l'app
 * hôte. Approche host-agnostique : ne dépend d'aucun event custom (Caramel,
 * Sucrerie, aManDe peuvent tous utiliser leur propre mécanisme — seul compte
 * la mise à jour de `document.documentElement.lang`, qui est standard HTML).
 *
 * Sur changement :
 *   - le cache i18n est naturellement bypassé (indexé par lang dans i18n/index.js) ;
 *   - si un flow Sucrerie est ouvert (panneau de dépôt affiché), on appelle
 *     `panel.refreshTranslations()` pour ré-appliquer les chaînes au DOM en
 *     place : les saisies utilisateur, l'état du segmented control, du badge
 *     recheck, du bouton publier et de l'écran succès sont préservés ;
 *   - sinon, on ré-injecte uniquement le bouton avec les nouvelles traductions.
 */
function ensureLangObserver() {
    if (_langObserverInstalled) return;
    _langObserverInstalled = true;

    const observer = new MutationObserver(async () => {
        if (!_currentMount) return;
        const { modal, notification, userIntent } = _currentMount;
        if (!modal || !modal.isConnected) { _currentMount = null; return; }

        const myToken = ++_langChangeToken;
        let translations = {};
        try {
            translations = await loadTranslations();
        } catch { /* libellés bruts en fallback */ }
        if (myToken !== _langChangeToken) return; // un switch plus récent prend le relais

        // Flow ouvert : ré-applique les traductions au panneau existant
        // (préserve saisies, listeners, état du segmented control + niveaux).
        const flow = modal._sucrerieBridgeFlow;
        if (flow && typeof flow.refreshTranslations === 'function') {
            flow.refreshTranslations(translations);
            return;
        }

        // Pas de flow ouvert : ré-injection simple du bouton.
        injectButton({
            modal,
            notification,
            translations,
            onClick: () => runSucrerieFlow({ modal, notification, translations, userIntent })
        });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}

/**
 * Monte le bouton "Vers la Sucrerie" dans le footer de la modale de visualisation.
 *
 * @param {Object}      ctx
 * @param {HTMLElement} ctx.modal        — élément `.preview-modal`
 * @param {Object}      ctx.notification — notification Caramel courante (.blob, .titleKey, .type, …)
 * @param {Object}      [ctx.userIntent] — champs initiaux du formulaire Caramel/aManDe
 *                                         ({qui, quoi}) qui aident l'IA d'enrichissement
 *                                         à mieux deviner le système éducatif et la
 *                                         discipline. Optionnel — vide en cas d'app
 *                                         hôte qui ne dispose pas de ces champs.
 * @returns {Promise<void>}
 */
export async function mountSucrerieButton({ modal, notification, userIntent }) {
    if (!SUCRERIE_BRIDGE.enabled) return;
    if (!modal || !notification) return;

    // Cleanup défensif : si un flow Sucrerie a été démarré sur une précédente
    // ouverture de la modale et n'a PAS été proprement arrêté (ex. l'utilisateur
    // ouvre directement une autre activité depuis la liste sans passer par le
    // bouton X qu'on intercepte), des résidus persistent dans le DOM. On les
    // retire ici pour repartir d'un état propre — la visualisation native
    // Caramel doit reprendre le dessus.
    cleanupResidualFlow(modal);

    ensureStyles();
    ensureLangObserver();

    let translations = {};
    try {
        translations = await loadTranslations();
    } catch {
        // Fallback : on injecte quand même le bouton avec les libellés bruts FR
        translations = {};
    }

    injectButton({
        modal,
        notification,
        translations,
        onClick: () => runSucrerieFlow({ modal, notification, translations, userIntent })
    });

    // Mémorise la dernière monture pour permettre au MutationObserver de
    // ré-injecter le bouton avec les bonnes traductions si l'utilisateur change
    // de langue pendant que la modale est ouverte.
    _currentMount = { modal, notification, userIntent };
}

/**
 * Retire toute trace d'un flow Sucrerie précédent dans la modale :
 *   - panneau orphelin (`[data-sucrerie-bridge-panel]`)
 *   - classe `preview-modal--sucrerie` qui masque la visualisation native
 *   - référence d'instance `modal._sucrerieBridgeFlow` (qui appelle exit()
 *     proprement si le flow est encore vivant — désinstalle aussi les guards
 *     beforeunload/F5 etc.)
 */
function cleanupResidualFlow(modal) {
    if (modal._sucrerieBridgeFlow && typeof modal._sucrerieBridgeFlow.exit === 'function') {
        try { modal._sucrerieBridgeFlow.exit(); } catch { /* no-op */ }
    }
    modal.classList.remove('preview-modal--sucrerie');
    modal.querySelectorAll('[data-sucrerie-bridge-panel]').forEach(el => el.remove());
    modal._sucrerieBridgeFlow = null;
}
