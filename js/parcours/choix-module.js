/**
 * @file Parcours — choisir le type d'une activité du plan, en mosaïque.
 *
 * La liste déroulante était devenue trop longue pour être lue : une trentaine
 * d'activités Caramel, puis une vingtaine de modules de la plateforme, tous en
 * texte (retour d'Emmanuel, 28 sept. 2026). La mosaïque montre chaque type avec
 * la vignette qu'il a déjà partout ailleurs dans Caramel — celle de la tuile de
 * l'accueil, ou pour un module de la plateforme celle du sélecteur d'activités
 * d'Éléa —, rangé dans les deux mêmes rubriques, et un filtre au clavier.
 *
 * Un vrai `<dialog>` modal : Échap ferme, le focus y reste enfermé tant qu'il
 * est ouvert et revient au bouton qui l'a ouvert. Chaque type est un bouton ;
 * celui de la carte est marqué `aria-pressed`.
 *
 * @module parcours/choix-module
 */

import { t } from './vocabulaire.js';
import { h5pModules } from '../core/definitions.js';
import { el, icone } from './dom.js';
import { imageModule, iconeModule, nomModule } from './activity-router.js';
import { MODULES_PARCOURS } from './modules-parcours.js';

let compteur = 0;

/** La vignette d'un type (image, ou son icône à défaut). */
export function vignetteModule(cle, taille = 40) {
    const src = imageModule(cle);
    if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        // Une vignette H5P n'est pas carrée : on ne lui impose que sa largeur.
        if (h5pModules[cle]) img.className = 'pc-vignette--h5p';
        else { img.width = taille; img.height = taille; }
        return img;
    }
    return icone(iconeModule(cle) || 'fa-puzzle-piece');
}

/** Minuscules, sans accents : « Leçon » se trouve en tapant « lecon ». */
function plat(texte) {
    return String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Le bouton qui remplace la liste déroulante : la vignette et le nom du type
 * choisi, et un chevron. Garde la classe `pc-select` : même gabarit que les
 * autres réglages de la carte.
 *
 * @param {Object} p
 * @param {string} p.actuel - Clé du type de la carte.
 * @param {Array} p.modules - `modulesDisponibles()` de la plateforme.
 * @param {(cle:string) => void} p.surChoix
 * @returns {HTMLButtonElement}
 */
export function boutonChoixModule({ actuel, modules, surChoix }) {
    const bouton = el('button', 'pc-select pc-choix');
    bouton.type = 'button';
    bouton.setAttribute('aria-haspopup', 'dialog');
    bouton.setAttribute('aria-label', `${t('parcours_plan_type_aria')} : ${nomModule(actuel)}`);
    bouton.dataset.module = actuel;
    bouton.append(vignetteModule(actuel, 20), el('span', 'pc-choix__nom', nomModule(actuel)), icone('fa-chevron-down'));
    bouton.addEventListener('click', () => ouvrirMosaique({ actuel, modules, surChoix, declencheur: bouton }));
    return bouton;
}

/**
 * Ouvre la mosaïque.
 *
 * @param {Object} p
 * @param {string} p.actuel
 * @param {Array<{cle:string, nom:string, categories:string[]}>} p.modules
 * @param {(cle:string) => void} p.surChoix - Appelé avec le type retenu, APRÈS fermeture.
 * @param {HTMLElement} [p.declencheur] - Reçoit le focus à la fermeture.
 * @returns {HTMLDialogElement}
 */
export function ouvrirMosaique({ actuel, modules, surChoix, declencheur }) {
    const id = `pc-mosaique-${++compteur}`;
    const dialogue = el('dialog', 'pc-mosaique');
    dialogue.setAttribute('aria-labelledby', `${id}-titre`);

    const tete = el('div', 'pc-mosaique__tete');
    const titre = el('h2', 'pc-mosaique__titre', t('parcours_mosaique_titre'));
    titre.id = `${id}-titre`;
    const fermer = el('button', 'pc-mosaique__fermer');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', t('parcours_mosaique_fermer'));
    fermer.append(icone('fa-xmark'));
    fermer.addEventListener('click', () => dialogue.close());
    tete.append(titre, fermer);

    const filtre = el('input', 'pc-form__saisie pc-mosaique__filtre');
    filtre.type = 'search';
    filtre.placeholder = t('parcours_mosaique_filtrer');
    filtre.setAttribute('aria-label', t('parcours_mosaique_filtrer'));

    const corps = el('div', 'pc-mosaique__corps');
    const vide = el('p', 'pc-block__hint pc-mosaique__vide', t('parcours_mosaique_aucun'));
    vide.hidden = true;

    // Les deux rubriques du plan : ce que Caramel fabrique de bout en bout, et
    // les modules de la plateforme, par ordre alphabétique.
    const groupes = [
        ['parcours_plan_groupe_caramel', modules.filter(m => !m.categories.includes('parcours'))],
        ['parcours_plan_groupe_plateforme', modules.filter(m => m.categories.includes('parcours'))
            .sort((a, b) => a.nom.localeCompare(b.nom))],
    ];
    // Un type hors palette (carte venue d'une autre plateforme) reste visible,
    // en tête : on ne le fait pas disparaître sans le dire.
    if (actuel && !modules.some(m => m.cle === actuel)) {
        groupes.unshift(['parcours_mosaique_actuel', [{ cle: actuel, nom: nomModule(actuel), categories: [] }]]);
    }

    const sections = [];
    for (const [cleGroupe, liste] of groupes) {
        if (!liste.length) continue;
        const section = el('section', 'pc-mosaique__groupe');
        const hGroupe = el('h3', 'pc-mosaique__rubrique', t(cleGroupe));
        hGroupe.id = `${id}-${cleGroupe}`;
        const grille = el('div', 'pc-mosaique__grille');
        grille.setAttribute('role', 'group');
        grille.setAttribute('aria-labelledby', hGroupe.id);
        const tuiles = liste.map(m => {
            const tuile = el('button', 'pc-tuile');
            tuile.type = 'button';
            tuile.dataset.moduleChoix = m.cle;
            tuile.setAttribute('aria-pressed', String(m.cle === actuel));
            const def = MODULES_PARCOURS[m.cle];
            if (def) tuile.title = t(def.descKey);
            tuile.append(vignetteModule(m.cle, 40), el('span', 'pc-tuile__nom', m.nom));
            // Rien à générer : l'IA n'écrit que la consigne, le contenu viendra
            // de la classe (forum, wiki, glossaire à construire…). Un pictogramme
            // discret, expliqué par la légende de la rubrique.
            if (def?.rienAGenerer) {
                const picto = icone('fa-inbox');
                picto.classList.add('pc-tuile__rien');
                tuile.append(picto);
                tuile.title = `${t(def.descKey)} — ${t('parcours_mosaique_rien')}`;
            }
            tuile.addEventListener('click', () => {
                dialogue.close();
                if (m.cle !== actuel) surChoix(m.cle);
            });
            grille.append(tuile);
            return { tuile, texte: plat(`${m.nom} ${m.cle} ${def ? t(def.descKey) : ''}`) };
        });
        section.append(hGroupe);
        if (liste.some(m => MODULES_PARCOURS[m.cle]?.rienAGenerer)) {
            const legende = el('p', 'pc-mosaique__legende');
            legende.append(icone('fa-inbox'), document.createTextNode(t('parcours_mosaique_rien')));
            section.append(legende);
        }
        section.append(grille);
        corps.append(section);
        sections.push({ section, tuiles });
    }
    corps.append(vide);

    filtre.addEventListener('input', () => {
        const q = plat(filtre.value).trim();
        let total = 0;
        for (const { section, tuiles } of sections) {
            let n = 0;
            for (const { tuile, texte } of tuiles) {
                const garde = !q || texte.includes(q);
                tuile.hidden = !garde;
                if (garde) n++;
            }
            section.hidden = n === 0;
            total += n;
        }
        vide.hidden = total > 0;
    });
    // Entrée dans le filtre : le premier type visible.
    filtre.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        corps.querySelector('.pc-tuile:not([hidden])')?.click();
    });

    // Un clic sur le voile (hors de la boîte) ferme, comme Échap.
    dialogue.addEventListener('click', e => { if (e.target === dialogue) dialogue.close(); });
    dialogue.addEventListener('close', () => {
        dialogue.remove();
        if (declencheur?.isConnected) declencheur.focus({ preventScroll: true });
    });

    dialogue.append(tete, filtre, corps);
    document.body.append(dialogue);
    dialogue.showModal();
    // Le focus sur le type actuel : on voit d'où l'on part, et Tab continue.
    (corps.querySelector('.pc-tuile[aria-pressed="true"]') || filtre).focus();
    return dialogue;
}
