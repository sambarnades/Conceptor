/**
 * Registre des thèmes visuels pour l'activité Page Moodle/Éléa.
 *
 * Chaque thème est un module autonome exportant :
 *   - id         : identifiant unique du thème
 *   - config     : { wrapperStyle, inheritedStyles }
 *   - renderers  : { '#01_hero_header': (data, ctx) => Element, … }
 *
 * Pour ajouter un thème :
 *   1. Créer un module dans js/moodle/page-themes/nouveau.js
 *   2. L'importer ici et l'ajouter à PAGE_THEMES
 *   3. Ajouter l'option dans le schéma éditeur (content-detector.js)
 *   4. Ajouter la clé de traduction dans les 11 fichiers de langue
 */

import eleaTheme from './page-themes/elea.js';
import dsfrTheme from './page-themes/dsfr.js';
import accessibleTheme from './page-themes/accessible.js';
import dynamiqueTheme from './page-themes/dynamique.js';

// =========================================================================
// REGISTRE DES THÈMES
// =========================================================================
const PAGE_THEMES = {
    elea: eleaTheme,
    dsfr: dsfrTheme,
    accessible: accessibleTheme,
    dynamique: dynamiqueTheme
};

export const DEFAULT_THEME_ID = 'elea';

/**
 * Retourne l'objet thème complet (config + renderers) pour l'identifiant demandé.
 * Fallback silencieux sur le thème Éléa si l'identifiant est inconnu ou absent.
 * @param {string} [themeId] - Identifiant du thème ('elea', 'dsfr', …)
 * @returns {{ id: string, config: { wrapperStyle: string, inheritedStyles: string }, renderers: Object }}
 */
export function getTheme(themeId) {
    return PAGE_THEMES[themeId] || PAGE_THEMES[DEFAULT_THEME_ID];
}
