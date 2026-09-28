/**
 * @file Parcours — la durée du parcours : son calcul et son écriture.
 *
 * Une seule façon d'écrire une durée, partout : « 45 min », « 1 h », « 3 h 25 ».
 * Jamais « 3,4 h » — personne ne compte les heures en dixièmes (retour
 * d'Emmanuel, 6 sept. 2026). Ce module est importé par l'écran du plan, celui
 * de la livraison ET la relecture didactique, qui ne peut pas dépendre d'un
 * écran sans boucler.
 *
 * L'estimation est simple, et dite telle quelle à l'utilisateur : la SOMME des
 * durées posées sur chaque activité, que l'enseignant ajuste carte par carte.
 * Elle ne compte ni ses consignes ni les transitions.
 *
 * @module parcours/duree
 */

import { t } from '../core/translation.js';

/** Traduction avec jetons `@x`. */
function tr(cle, jetons) {
    let s = t(cle);
    for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/**
 * Durée totale du parcours, en minutes : la somme des durées des cartes.
 * @param {Object} plan
 * @returns {number}
 */
export function dureeTotale(plan) {
    return (plan && plan.etapes || []).reduce(
        (s, e) => s + (e.cartes || []).reduce((s2, c) => s2 + (Number(c.duree) || 0), 0), 0);
}

/**
 * Une durée en minutes, écrite pour être lue : « 45 min », « 1 h », « 3 h 25 ».
 * @param {number} minutes
 * @returns {string}
 */
export function formaterDuree(minutes) {
    const m0 = Math.max(0, Math.round(Number(minutes) || 0));
    if (m0 < 60) return tr('parcours_plan_duree_min', { n: m0 });
    const h = Math.floor(m0 / 60);
    const m = m0 % 60;
    return m ? tr('parcours_plan_duree_hm', { h, m: String(m).padStart(2, '0') })
             : tr('parcours_plan_duree_h', { h });
}

/**
 * L'explication de l'estimation, en une phrase, pour l'infobulle qui accompagne
 * chaque affichage de la durée totale.
 * @returns {string}
 */
export function expliquerEstimation() {
    return t('parcours_plan_duree_estimation');
}
