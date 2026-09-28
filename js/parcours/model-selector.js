/** Sélecteur de modèle partagé par toutes les générations d'un parcours. */
import { translations } from '../core/translation.js';
import { AVAILABLE_MODELS, DEFAULT_MODEL, populateModelSelector } from '../services/llm.js';
import { el, icone } from './dom.js';

let modele = DEFAULT_MODEL;
const selecteurs = new Set();

export function modeleParcours() {
    return modele;
}

function synchroniser() {
    for (const { liste } of selecteurs) {
        liste.querySelectorAll('[data-model-id]').forEach(item => {
            item.classList.toggle('selected', item.dataset.modelId === modele);
        });
    }
}

/**
 * Construit le même bouton scindé que « Générer en un clic ».
 * `brancher()` doit être appelé une fois le nœud inséré dans le document.
 */
export function construireSelecteurModele(cle) {
    const racine = el('div', 'action-buttons-group generation-button-group llm-selector-group pc-llm-selector');
    const ligne = el('div', 'llm-buttons-row');
    const principale = el('div', 'main-action-button');
    const suite = el('div', 'more-actions-button');
    const bouton = el('button', 'action-btn primary-btn dropdown-toggle');
    bouton.type = 'button';
    bouton.id = `model-selector-btn-${cle}`;
    bouton.setAttribute('aria-haspopup', 'true');
    bouton.setAttribute('aria-expanded', 'false');
    bouton.setAttribute('aria-label', translations.select_model || 'Sélectionner le modèle');
    bouton.append(icone('fa-chevron-down'));
    const liste = el('ul', 'model-selector-dropdown');
    liste.id = `model-selector-dropdown-${cle}`;
    liste.setAttribute('role', 'menu');
    suite.append(bouton);
    ligne.append(principale, suite);
    racine.append(ligne, liste);

    let branche = false;
    const entree = { liste };
    const fermer = () => {
        liste.classList.remove('show');
        bouton.setAttribute('aria-expanded', 'false');
    };
    const clicDocument = e => {
        if (!racine.contains(e.target)) fermer();
    };
    const echap = e => {
        if (e.key === 'Escape' && liste.classList.contains('show')) {
            fermer();
            bouton.focus();
        }
    };
    function brancher() {
        if (branche) return;
        branche = true;
        populateModelSelector(cle, AVAILABLE_MODELS, id => {
            modele = id;
            synchroniser();
            fermer();
        }, modele, translations);
        selecteurs.add(entree);
        bouton.addEventListener('click', e => {
            e.stopPropagation();
            const ouvert = liste.classList.toggle('show');
            bouton.setAttribute('aria-expanded', String(ouvert));
            if (ouvert) (liste.querySelector('.selected') || liste.querySelector('li'))?.focus();
        });
        document.addEventListener('click', clicDocument);
        document.addEventListener('keydown', echap);
    }
    function detruire() {
        selecteurs.delete(entree);
        document.removeEventListener('click', clicDocument);
        document.removeEventListener('keydown', echap);
    }
    return { racine, principale, bouton, liste, brancher, detruire, fermer };
}
