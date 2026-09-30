/** Confirmation propre à l'atelier, sans dialogue natif superposé. */
import { t } from './vocabulaire.js';
import { el, action } from './dom.js';

/**
 * Demande de confirmer une action qui perd du travail.
 *
 * Le bouton qui GARDE reçoit le focus : Entrée ou Échap ne perdent rien.
 *
 * @param {HTMLElement} panneau - Rendu inerte pendant la question.
 * @param {Object} textes - Clés i18n.
 * @param {string} textes.titre
 * @param {string} textes.texte
 * @param {string} textes.garder
 * @param {string} textes.garderIcone
 * @param {string} textes.quitter
 * @param {string} textes.quitterIcone
 * @param {{cle:string, icone:string, faire:Function}} [textes.annexe] - Une action qui
 *   ne tranche pas (exporter avant de remplacer) : elle s'exécute, la question reste posée.
 * @returns {Promise<boolean>} Vrai si l'utilisateur choisit de quitter.
 */
export function confirmer(panneau, { titre: cleTitre, texte: cleTexte, garder: cleGarder, garderIcone, quitter: cleQuitter, quitterIcone, annexe = null }) {
    const depart = document.activeElement;
    const voile = el('div', 'pc-confirmation');
    voile.setAttribute('role', 'alertdialog');
    voile.setAttribute('aria-modal', 'true');
    voile.setAttribute('aria-labelledby', 'pc-confirmation-titre');
    voile.setAttribute('aria-describedby', 'pc-confirmation-texte');
    const boite = el('div', 'pc-confirmation__boite');
    const titre = el('h2', null, t(cleTitre));
    titre.id = 'pc-confirmation-titre';
    const texte = el('p', null, t(cleTexte));
    texte.id = 'pc-confirmation-texte';
    const boutons = el('div', 'pc-confirmation__actions');
    return new Promise(resolve => {
        const continuer = action(cleGarder, garderIcone, () => finir(false));
        const abandonner = action(cleQuitter, quitterIcone, () => finir(true), 'pc-secondaire pc-confirmation__abandon');
        const autre = annexe ? action(annexe.cle, annexe.icone, () => annexe.faire(), 'pc-secondaire pc-confirmation__annexe') : null;
        const ordre = [autre, continuer, abandonner].filter(Boolean);
        const inertAvant = panneau.inert;
        panneau.inert = true;
        function finir(accord) {
            document.removeEventListener('keydown', clavier, true);
            voile.remove(); panneau.inert = inertAvant;
            if (depart?.isConnected) depart.focus({ preventScroll: true });
            resolve(accord);
        }
        function clavier(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finir(false); }
            if (e.key === 'Tab') {
                // Le focus reste dans la question, dans l'ordre des boutons.
                e.preventDefault(); e.stopImmediatePropagation();
                const i = ordre.indexOf(document.activeElement);
                ordre[(i + (e.shiftKey ? -1 : 1) + ordre.length) % ordre.length].focus();
            }
        }
        document.addEventListener('keydown', clavier, true);
        voile.addEventListener('click', e => { if (e.target === voile) finir(false); });
        boutons.append(...ordre);
        boite.append(titre, texte, boutons); voile.append(boite); document.body.append(voile);
        continuer.focus();
    });
}

/** Une retouche non enregistrée : la garder, ou l'abandonner. */
export function confirmerAbandon(panneau) {
    return confirmer(panneau, {
        titre: 'editor_confirm_discard_title',
        texte: 'editor_confirm_discard',
        garder: 'editor_confirm_close_cancel',
        garderIcone: 'fa-pen-to-square',
        quitter: 'editor_discard_btn',
        quitterIcone: 'fa-xmark',
    });
}

/** Remplacer un contenu prêt par une nouvelle génération. */
export function confirmerRegeneration(panneau) {
    return confirmer(panneau, {
        titre: 'parcours_fab_refaire',
        texte: 'parcours_refaire_confirmation',
        garder: 'parcours_refaire_garder',
        garderIcone: 'fa-arrow-left',
        quitter: 'parcours_fab_refaire',
        quitterIcone: 'fa-arrows-rotate',
    });
}
