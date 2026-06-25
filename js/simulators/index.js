/**
 * simulators/index.js — Registre et point d'entrée unique des simulateurs.
 *
 * Expose `renderSimulator(titleKey, container, data, previewHtml)` qui :
 *   1. Résout le titleKey vers le module approprié
 *   2. Import dynamique du module (lazy)
 *   3. Appelle la fonction render du module
 *
 * Remplace le if/else dans notifications.js par un dispatch centralisé.
 */

const registry = {
    'elea_millionnaire_name':  () => import('./millionnaire.js'),
    'elea_appariement_name':   () => import('./appariement.js'),
    'elea_glossaire_xml_name': () => import('./glossaire.js'),
    'elea_qcm_name':           () => import('./qcm.js'),
    'elea_test_xml_name':      () => import('./elea-test.js'),
    'elea_page_name':          () => import('./page.js'),
    'elea_livre_name':         () => import('./livre.js'),
    'elea_devoir_name':        () => import('./devoir.js'),
};

/**
 * Simulateurs SCORABLES : ceux qui notent l'élève et émettent, en mode élève,
 * un CustomEvent `simulator:completed` (detail.scorePct) à l'écran de fin.
 * Sert au parcours collection (déblocage progressif / seuil de réussite) côté
 * Sucrerie. Les autres (glossaire, devoir, page, livre) sont
 * consultatifs : aucune complétion émise.
 */
export const SCORABLE_SIMULATORS = new Set([
    'elea_qcm_name',
    'elea_millionnaire_name',
    'elea_appariement_name',
    'elea_test_xml_name',
]);

/**
 * @param {string} titleKey
 * @returns {boolean} true si le simulateur note l'élève et émet une complétion.
 */
export function isScorableSimulator(titleKey) {
    return SCORABLE_SIMULATORS.has(titleKey);
}

/**
 * Rend un simulateur dans le conteneur donné.
 *
 * @param {string} titleKey - Clé i18n identifiant le type d'activité
 * @param {HTMLElement} container - Conteneur DOM
 * @param {Object} data - Données JSON de l'activité
 * @param {string} [previewHtml] - HTML pré-généré (pour Page et Livre)
 * @param {{mode?: 'teacher'|'student'}} [options] - Mode d'affichage :
 *   - 'student' (défaut) : comportement « jeu » strict (lien partagé élève).
 *   - 'teacher' : consultation auteur (navigation libre, révélation, pas de
 *     game-over). Jamais d'émission `simulator:completed`.
 * @returns {Promise<boolean>} true si un simulateur a été rendu, false sinon
 */
export async function renderSimulator(titleKey, container, data, previewHtml, options = {}) {
    const loader = registry[titleKey];
    if (!loader) return false;

    const mode = options.mode === 'teacher' ? 'teacher' : 'student';

    const mod = await loader();
    mod.default(container, data, previewHtml, { mode });

    // Marqueurs lus par le contexte appelant (posés APRÈS le rendu : le
    // simulateur fait `container.innerHTML = ''` mais ne touche pas les attributs
    // du conteneur lui-même).
    //  - data-sim-root : cible du bouton plein écran autonome (helpers.js).
    //  - data-simulator-scorable : l'activité émettra `simulator:completed`
    //    (uniquement en mode élève sur un simulateur scorable) → le parcours
    //    collection sait qu'il doit attendre une fin réelle (cf. embed Sucrerie).
    container.setAttribute('data-sim-root', '');
    // Marqueur de TYPE scorable (indépendant du mode) : lu par les contextes de
    // consultation (modale de lecture Sucrerie) pour afficher le bouton « Aperçu
    // élève », et par l'embed élève pour le déblocage de collection (là le mode
    // est forcément 'student', donc un type scorable émettra `simulator:completed`).
    if (isScorableSimulator(titleKey)) {
        container.dataset.simulatorScorable = '1';
    } else {
        delete container.dataset.simulatorScorable;
    }
    return true;
}

/**
 * Vérifie si un titleKey correspond à un simulateur connu.
 * @param {string} titleKey
 * @returns {boolean}
 */
export function hasSimulator(titleKey) {
    return titleKey in registry;
}
