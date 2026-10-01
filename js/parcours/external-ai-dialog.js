/**
 * @file Parcours — la fenêtre « Personnaliser les instructions ».
 *
 * C'est LA modale de génération d'une activité, pour le plan ou pour une
 * activité du parcours (retour d'Emmanuel du 14 sept. 2026 : l'expérience doit
 * être la même, transparente, facile). Mêmes classes, donc même rendu :
 * en-tête blanc avec vignette, titre, étiquette et interrupteur « Simple |
 * Guidé » ; panneaux « 1/2 Obtenir le prompt à copier » et « 2/2 Coller la
 * réponse de l'IA » ; barre d'outils à icônes (Copier le prompt, Plein écran,
 * cadenas) branchée sur `setupToolbarListeners` de Caramel, pas sur une copie.
 *
 * Le bouton du panneau 2 se comporte comme celui d'une activité : zone vide,
 * « Générer en un clic » confie la génération à l'IA de Caramel ; réponse
 * collée, il l'utilise (vérification, réparation, application en un clic).
 * En « Simple », les panneaux se replient et le bouton passe dans l'en-tête.
 *
 * Exception assumée à D8 : l'atelier cible ici les classes de la modale
 * d'activité, pour qu'une évolution de celle-ci profite aux deux.
 *
 * Aucun appel à un modèle tant que « Générer en un clic » n'est pas cliqué.
 *
 * @module parcours/external-ai-dialog
 */
import { translatePage } from '../core/translation.js';
import { t } from './vocabulaire.js';
import { setupToolbarListeners, syncPanelHeights, setupModalAccessibility } from '../core/utils.js';
import { el, icone } from './dom.js';
import { construireSelecteurModele, modeleParcours } from './model-selector.js';

/** Réponse collée mais pas encore utilisée, retrouvée à la réouverture. */
const saisies = new WeakMap();
/** La fenêtre ouverte, pour la refermer depuis l'extérieur (reprise de scénario). */
let fermerOuverte = null;

/** Un message traduit si c'est une clé de l'atelier, le texte brut sinon. */
function message(e) {
    const texte = String(e?.message || e || '');
    return texte.startsWith('parcours_') ? t(texte) : texte;
}

/** Referme la fenêtre du mode Guidé si elle est ouverte. */
export function fermerDialogueExterne() {
    fermerOuverte?.();
}

/** Un bouton de barre d'outils, icône au-dessus du libellé, comme dans l'activité. */
function outil(classe, iconeNom, cle) {
    const b = el('button', `toolbar-btn ${classe}`);
    b.type = 'button';
    b.dataset.tooltipKey = cle;
    const texte = el('span', 'toolbar-btn-text');
    texte.dataset.key = cle;
    b.append(icone(iconeNom), texte);
    return b;
}

/**
 * Ouvre la fenêtre du mode Guidé.
 *
 * @param {Object} o
 * @param {Object} o.owner - Clé de mémoire de la saisie (le brouillon, ou la carte).
 * @param {string} o.title
 * @param {string} [o.etiquette] - Pastille devant la description (« H5P », « Éléa », « Plan »).
 * @param {'h5p'|'elea'} [o.famille] - Couleur de la pastille, comme dans la modale d'activité.
 * @param {string} [o.description]
 * @param {string} [o.image] - Vignette du module, à défaut `o.iconeNom`.
 * @param {string} [o.iconeNom]
 * @param {string} o.libelleUtiliser - Libellé du bouton quand une réponse est collée.
 * @param {Function} o.preparer - `(signal) => Promise<{prompt, ...contexte}>`
 * @param {Function} o.verifier - `(texte, contexte, signal) => Promise<{value}>`
 * @param {Function} o.appliquer - `(valeur, contexte) => false|void`
 * @param {Function} [o.genererEnUnClic] - Appelé après fermeture, zone de réponse vide.
 * @param {boolean} [o.scenario] - Ajoute « Reprendre un scénario » à la barre du panneau 2.
 * @returns {HTMLElement}
 */
export function ouvrirDialogueExterne({
    owner, title, etiquette, famille = 'h5p', description, image, iconeNom, libelleUtiliser,
    preparer, verifier, appliquer, genererEnUnClic, scenario = false,
}) {
    fermerDialogueExterne();

    const voile = el('div', 'pc-guide-voile');
    const modale = el('div', 'pc-guide pc-external advanced-view');
    modale.setAttribute('role', 'dialog');
    modale.setAttribute('aria-modal', 'true');
    modale.setAttribute('aria-labelledby', 'pc-external-title');

    // --- En-tête : la carte blanche de la modale d'activité.
    const groupe = el('div', 'modal-header-group');
    const entete = el('div', 'modal-header');
    const intitule = el('div', 'modal-title-container');
    if (image) {
        const img = el('img', 'modal-title-icon');
        img.src = image; img.alt = '';
        intitule.append(img);
    } else {
        const pastille = el('span', 'modal-title-icon pc-guide__icone');
        pastille.append(icone(iconeNom || 'fa-route'));
        intitule.append(pastille);
    }
    const titre = el('h2', 'modal-title', title);
    titre.id = 'pc-external-title';
    intitule.append(titre);

    const haut = el('div', 'top-controls-container');
    const selecteurHaut = construireSelecteurModele('pc-guide-haut');
    const groupeHaut = selecteurHaut.racine;
    const boutonHaut = el('button', 'action-btn primary-btn');
    boutonHaut.type = 'button';
    selecteurHaut.principale.append(boutonHaut);
    haut.append(groupeHaut);

    const actionsEntete = el('div', 'modal-header-actions');
    const fermer = el('button', 'close-btn', '×');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', t('close_modal'));
    actionsEntete.append(fermer);
    entete.append(intitule, haut, actionsEntete);

    const tuto = el('div', 'tuto-controls-wrapper');
    const contenuTuto = el('div', 'modal-tuto-content');
    const ligne = el('p');
    if (etiquette) ligne.append(el('span', `modal-description-label ${famille === 'elea' ? 'elea-label-modal' : 'h5p-label-modal'}`, etiquette), document.createTextNode(' '));
    if (description) ligne.append(document.createTextNode(description));
    contenuTuto.append(ligne);
    const bascule = el('div', 'mode-switch-container');
    const interrupteur = el('label', 'switch');
    const caseMode = el('input', 'mode-toggle-checkbox');
    caseMode.type = 'checkbox';
    caseMode.checked = true;
    caseMode.setAttribute('aria-label', t('advanced_mode'));
    interrupteur.append(caseMode, el('span', 'slider round'));
    const simple = el('span', 'switch-label'); simple.dataset.key = 'simple_mode';
    const guide = el('span', 'switch-label'); guide.dataset.key = 'advanced_mode';
    bascule.append(simple, interrupteur, guide);
    tuto.append(contenuTuto, bascule);
    groupe.append(entete, tuto);

    // --- Panneau 1 : le prompt, verrouillé par défaut.
    const gauche = el('div', 'modal-panel');
    const tete1 = el('div', 'modal-panel-header');
    const h1 = el('h3'); h1.dataset.key = 'get_prompt_step';
    tete1.append(h1);
    const barre1 = el('div', 'floating-toolbar');
    const copier = outil('copy-prompt-btn', 'fa-copy', 'copy_prompt');
    barre1.append(copier, outil('fullscreen-btn', 'fa-expand', 'fullscreen_prompt'), outil('lock-btn', 'fa-lock', 'unlock_prompt'));
    const zone1 = el('div', 'prompt-area');
    const cadre1 = el('div', 'textarea-container');
    const prompt = el('textarea');
    prompt.id = 'pc-guide-prompt';
    prompt.readOnly = true;
    prompt.setAttribute('aria-label', t('get_prompt_step'));
    cadre1.append(prompt); zone1.append(cadre1);
    const pied1 = el('div', 'modal-panel-footer');
    const groupeAide = el('div', 'action-buttons-group');
    const aide = el('p', 'ia-guidance-text');
    aide.append(icone('fa-info-circle'), document.createTextNode(' ' + t('info_prompt_copy')));
    groupeAide.append(aide); pied1.append(groupeAide);
    gauche.append(tete1, barre1, zone1, pied1);

    // --- Panneau 2 : la réponse, éditable.
    const droite = el('div', 'modal-panel');
    const tete2 = el('div', 'modal-panel-header');
    tete2.append(el('h3', null, t('parcours_external_reply')));
    const barre2 = el('div', 'floating-toolbar');
    if (scenario) {
        // Reprendre un scénario .json : l'usage avancé vit ici, avec la réponse collée.
        const importer = outil('pc-guide__import', 'fa-folder-open', 'parcours_liv_scenario_importer');
        importer.id = 'pc-guide-importer';
        importer.addEventListener('click', () => document.querySelector('#pc-scenario-fichier')?.click());
        barre2.append(importer);
    }
    barre2.append(outil('fullscreen-btn', 'fa-expand', 'fullscreen_prompt'), outil('lock-btn', 'fa-lock-open', 'lock_prompt'));
    const zone2 = el('div', 'prompt-area');
    const cadre2 = el('div', 'textarea-container');
    const reponse = el('textarea');
    reponse.id = 'pc-guide-reponse';
    reponse.value = saisies.get(owner) || '';
    reponse.placeholder = t('guided_mode_json_placeholder');
    reponse.setAttribute('aria-label', t('parcours_external_reply'));
    cadre2.append(reponse); zone2.append(cadre2);
    const etat = el('p', 'pc-guide__etat');
    etat.setAttribute('role', 'status');
    etat.tabIndex = -1;
    const pied2 = el('div', 'modal-panel-footer');
    const selecteurBas = construireSelecteurModele('pc-guide-bas');
    const groupeBas = selecteurBas.racine;
    const boutonBas = el('button', 'action-btn primary-btn');
    boutonBas.type = 'button';
    boutonBas.id = 'pc-guide-generer';
    selecteurBas.principale.append(boutonBas); pied2.append(groupeBas);
    droite.append(tete2, barre2, zone2, etat, pied2);

    const principal = el('div', 'modal-main-content');
    principal.append(gauche, droite);
    modale.append(groupe, principal);

    // --- État et actions.
    const abort = new AbortController();
    let contexte = null, busy = true, ferme = false;

    function maj() {
        const colle = Boolean(reponse.value.trim());
        const libelle = colle ? libelleUtiliser : t('generate_one_click');
        for (const s of [selecteurHaut, selecteurBas]) {
            s.racine.classList.toggle('pc-llm-selector--sans-menu', colle || !genererEnUnClic);
            s.bouton.disabled = busy;
            if (colle || !genererEnUnClic) s.fermer();
        }
        for (const b of [boutonHaut, boutonBas]) {
            b.textContent = libelle;
            // Sans réponse collée, il faut une génération possible ; avec, un prompt prêt.
            b.disabled = busy || (colle ? !contexte : !genererEnUnClic);
        }
        modale.setAttribute('aria-busy', String(busy));
    }

    async function agir() {
        if (busy) return;
        const texte = reponse.value;
        if (!texte.trim()) {
            if (!genererEnUnClic) return;
            saisies.delete(owner);
            fermerTout();
            genererEnUnClic(modeleParcours());
            return;
        }
        busy = true; etat.textContent = ''; maj();
        try {
            const resultat = await verifier(texte, contexte, abort.signal);
            if (ferme) return;
            if (await appliquer(resultat.value, contexte, modale) === false) return;
            saisies.delete(owner);
            fermerTout();
        } catch (e) {
            if (ferme) return;
            etat.textContent = t('parcours_external_invalid') + '\n' + message(e);
            etat.focus();
        } finally {
            if (!ferme) { busy = false; maj(); }
        }
    }
    boutonHaut.addEventListener('click', agir);
    boutonBas.addEventListener('click', agir);

    reponse.addEventListener('input', () => {
        etat.textContent = '';
        saisies.set(owner, reponse.value);
        maj();
    });

    caseMode.addEventListener('change', () => {
        modale.classList.toggle('advanced-view', caseMode.checked);
        requestAnimationFrame(() => syncPanelHeights(modale));
    });

    // Réponse de la reprise de scénario (voir `scenario-actions.js`).
    const surScenario = (e) => {
        if (e.detail?.ok) fermerTout();
        else if (e.detail?.message) { etat.textContent = e.detail.message; etat.focus(); }
    };
    document.addEventListener('pc:scenario-import', surScenario);

    const resynchroniser = () => syncPanelHeights(modale);
    window.addEventListener('resize', resynchroniser);

    let nettoyerClavier = () => {};
    function fermerTout() {
        if (ferme) return;
        ferme = true;
        fermerOuverte = null;
        abort.abort();
        nettoyerClavier();
        window.removeEventListener('resize', resynchroniser);
        document.removeEventListener('pc:scenario-import', surScenario);
        selecteurHaut.detruire();
        selecteurBas.detruire();
        // Un plein écran ouvert sur l'une des zones ne doit pas survivre à la fenêtre.
        document.querySelector('.fullscreen-overlay')?.remove();
        voile.remove();
        modale.remove();
        document.body.classList.remove('pc-locked');
    }
    fermerOuverte = fermerTout;
    fermer.addEventListener('click', fermerTout);
    voile.addEventListener('click', fermerTout);

    document.body.append(voile, modale);
    selecteurHaut.brancher();
    selecteurBas.brancher();
    document.body.classList.add('pc-locked');
    translatePage(modale);
    setupToolbarListeners(modale);
    requestAnimationFrame(resynchroniser);
    nettoyerClavier = setupModalAccessibility(modale, {
        onClose: () => { if (!document.querySelector('.fullscreen-overlay')) fermerTout(); },
        focusSelector: '.copy-prompt-btn',
    });
    maj();

    preparer(abort.signal).then(resultat => {
        if (ferme) return;
        contexte = resultat;
        prompt.value = resultat.prompt;
        busy = false;
        maj();
        requestAnimationFrame(resynchroniser);
    }).catch(e => {
        if (ferme) return;
        busy = false;
        etat.textContent = message(e);
        maj();
    });
    return modale;
}
