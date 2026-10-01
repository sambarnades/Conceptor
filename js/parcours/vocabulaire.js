/**
 * @file Parcours — le vocabulaire de la plateforme visée (D105).
 *
 * Une même phrase ne nomme pas le même public selon la plateforme : des ÉLÈVES
 * sur Éléa, des STAGIAIRES sur Magistère (et un formateur), des ÉTUDIANTS sur un
 * Moodle (demande d'Emmanuel, 1er oct. 2026 : « dans les choix de bifurcation et
 * tout, c'est important à respecter »). Remplacer un mot dans une phrase ne marche
 * pas dans douze langues (articles, élisions, accords, cas) : chaque texte qui
 * nomme le public a donc, au besoin, ses VARIANTES rédigées, sous la clé
 * `<clé>_magistere` et `<clé>_moodle` ; la clé de base parle d'élèves (Éléa).
 *
 * `t()` d'ici remplace celui de `core/translation.js` dans l'atelier : une clé sans
 * variante se traduit comme avant. La plateforme est celle du brouillon, sauf si
 * l'appelant la donne (fiche de séquence, assemblage du cours).
 *
 * @module parcours/vocabulaire
 */

import { t as traduire, translations } from '../core/translation.js';
import { brouillon } from './state.js';

/** Les plateformes dont le public n'est pas celui d'Éléa. */
const AVEC_VARIANTES = new Set(['magistere', 'moodle']);

/** La plateforme du brouillon en cours, ou `null`. */
export function plateformeCourante() {
    try { return brouillon()?.platform || null; } catch { return null; }
}

/**
 * La clé à employer pour cette plateforme : sa variante si elle existe, sinon
 * elle-même. Sert aussi aux attributs `data-key`, que `translatePage()` relit
 * au changement de langue.
 * @param {string} cle
 * @param {string|null} [plateforme]
 * @returns {string}
 */
export function cleSelonPlateforme(cle, plateforme = plateformeCourante()) {
    if (AVEC_VARIANTES.has(plateforme)) {
        const variante = `${cle}_${plateforme}`;
        if (translations && Object.prototype.hasOwnProperty.call(translations, variante)) return variante;
    }
    return cle;
}

/**
 * Traduit une clé dans le vocabulaire de la plateforme.
 * @param {string} cle
 * @param {string|null} [plateforme] - Par défaut, celle du brouillon.
 * @returns {string}
 */
export function t(cle, plateforme) {
    return traduire(cleSelonPlateforme(cle, plateforme === undefined ? plateformeCourante() : plateforme));
}

/**
 * La valeur brute du dictionnaire, dans le vocabulaire de la plateforme — pour les
 * textes écrits dans le cours, qui gardent un repli français si la clé manque.
 * @param {string} cle
 * @param {string|null} plateforme
 * @returns {string|undefined}
 */
export function texteSelonPlateforme(cle, plateforme) {
    return translations?.[cleSelonPlateforme(cle, plateforme)];
}
