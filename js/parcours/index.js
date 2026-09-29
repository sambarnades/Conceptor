/**
 * @file Parcours — l'entrée sous le formulaire, l'atelier DANS la page.
 *
 * L'atelier n'est pas une fenêtre posée par-dessus Caramel : c'est un autre
 * contenu de la même page (D39). Le formulaire de l'accueil — qui, quoi, les
 * onglets Rapide/Avancé, les pièces jointes — reste à sa place et continue de
 * vivre ; sous lui, la barre de filtres et la grille des tuiles s'effacent, et
 * l'atelier prend leur place, à la même largeur. Sous le formulaire, un
 * commutateur « Une activité | Un parcours » change le contenu affiché (D63).
 *
 * Ce que ça change pour l'enseignant : ce qu'il tape dans le sujet, au-dessus,
 * compte tout de suite ; il n'y a plus de « fermer » ni de barre fixée au bas
 * de l'écran ; et la fabrication démarre d'elle-même dès qu'il a validé le
 * plan — c'est le clic sur « Fabriquer » qui autorise la dépense, pas un
 * second bouton sur l'écran d'après.
 *
 * Pour désactiver : retirer le <link> de `css/components/parcours.css` et
 * l'appel à `initParcours()` dans `js/main.js`.
 *
 * @module parcours/index
 */

import { t } from '../core/translation.js';
import { debugLog, classifyError } from '../core/utils.js';
import {
    generateRawWithLLM,
    beginGeneration, requestCancelGeneration, isCancellation, isCancelRequested,
} from '../services/llm.js';
import { CONFIG } from './config.js';
import { ouvrirBrouillon, brouillon, brouillonEnAttente, majBrouillon, surChangement } from './state.js';
import { construireCadrage, etatAction } from './screen-cadrage.js';
import { sourceManquante } from './sources.js';
import { construirePlan, normaliserPlan, validerPlan, planDepuisTrame } from './screen-plan.js';
import { construireFabrication, validerFabrication } from './screen-fabrication.js';
import { construireLivraison } from './screen-livraison.js';
import { cartesAPlat, extraireJson } from './parcours-runner.js';
import { construireActionsScenario, confirmerRemplacement } from './scenario-actions.js';
import { bonbon } from './dom.js';
import { construireSelecteurModele, modeleParcours } from './model-selector.js';
import { releverParcours, ORIGINES_PLAN } from './stats-parcours.js';

let entree = null;
let observerBarre = null;
/** La section de l'atelier, tant qu'elle est dans la page. */
let atelier = null;
/** Ce que l'écran courant a rendu : son nœud, et parfois un `rafraichir`. */
let ecran = null;
/** Les blocs de la page que l'atelier a effacés, avec leur `display` d'avant. */
let masques = [];
/** Guette les pièces jointes du formulaire, pour la note de l'écran de cadrage. */
let observateur = null;
let desabonner = null;
/** Doublure du modèle de langue pour la fabrication (bancs d'essai seulement). */
let doublure = null;

/** Index de l'écran affiché : 0 cadrage, 1 plan, 2 fabrication, 3 livraison. */
let etape = 0;
/** L'écran le plus avancé atteint depuis l'ouverture : le fil y ramène d'un clic. */
let etapeMax = 0;
/** Vrai pendant l'appel de plan : la barre d'action bascule en « annuler ». */
let enCours = false;
/** La file de fabrication de l'écran 3, tant qu'il est monté. */
let file = null;
let actionsScenario = null;
let selecteurActionbar = null;
let generationPlan = 0;
/** Minuteur du message « c'est plus long que d'habitude » du panneau d'attente. */
let minuteurAttente = null;
let langueEnAttente = false;

/* ------------------------------------------------------------------ *
 *  Le commutateur « Une activité | Un parcours », sous le formulaire
 * ------------------------------------------------------------------ */

/** Choix du résultat sous le formulaire commun, avant les filtres ou l’atelier. */
function construireEntree() {
    const groupe = document.createElement('div');
    groupe.className = 'pc-commutateur';
    groupe.id = 'pc-commutateur';
    groupe.setAttribute('role', 'radiogroup');
    groupe.setAttribute('aria-label', tPrete('parcours_commutateur_aria') || 'Que souhaitez-vous créer ?');

    const segment = (id, mode, icone, cle, defaut) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.id = id;
        b.className = 'pc-commutateur__b';
        b.dataset.mode = mode;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        const i = document.createElement('i');
        i.className = `fas ${icone} pc-commutateur__icone`;
        i.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'pc-commutateur__label';
        label.dataset.key = cle;
        label.textContent = defaut;
        b.append(i, label);
        return b;
    };

    const activite = segment('activites-button', 'activite', 'fa-table-cells-large',
        'parcours_commutateur_activite', 'Une activité');
    const parcours = segment('parcours-button', 'parcours', 'fa-route',
        'parcours_commutateur_parcours', 'Un parcours');

    // Point de reprise : un parcours en cours de conception attend. Sur le
    // segment « Un parcours », caché quand il est allumé (on y est).
    const reprise = document.createElement('span');
    reprise.className = 'pc-commutateur__reprise';
    reprise.setAttribute('aria-hidden', 'true');
    parcours.append(reprise);

    activite.addEventListener('click', () => { if (atelier) fermerAtelier(); });
    parcours.addEventListener('click', () => { if (!atelier) ouvrirAtelier(); });

    // Un groupe radio : les flèches passent d'un segment à l'autre et
    // choisissent ; Tab n'entre qu'une fois dans le groupe.
    groupe.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const versParcours = e.key === 'End' || (e.key !== 'Home' && !atelier);
        if (versParcours && !atelier) { ouvrirAtelier({ focaliser: false }); parcours.focus(); }
        else if (!versParcours && atelier) { fermerAtelier({ focaliser: false }); activite.focus(); }
    });

    groupe.append(activite, parcours);
    return groupe;
}

/** Une traduction si elle est arrivée, sinon rien — jamais la clé brute. */
function tPrete(cle) {
    const v = t(cle);
    return v === cle ? '' : v;
}

/**
 * (Re)pose l'état du commutateur : le segment allumé, le point de reprise,
 * les titres et le nom du groupe. Les libellés visibles portent `data-key` :
 * `translatePage()` les traduit à l'arrivée du dictionnaire et à chaque
 * changement de langue ; ici on ne les écrit que si la traduction est là.
 */
function traduireEntree() {
    if (!entree) return;
    const ouvert = Boolean(atelier);
    const activite = entree.querySelector('#activites-button');
    const parcours = entree.querySelector('#parcours-button');
    if (!activite || !parcours) return;

    for (const [b, cle] of [[activite, 'parcours_commutateur_activite'], [parcours, 'parcours_commutateur_parcours']]) {
        const texte = tPrete(cle);
        const label = b.querySelector('.pc-commutateur__label');
        if (texte && label) label.textContent = texte;
    }
    activite.setAttribute('aria-checked', String(!ouvert));
    parcours.setAttribute('aria-checked', String(ouvert));
    // Un seul arrêt de tabulation : le segment allumé.
    activite.tabIndex = ouvert ? -1 : 0;
    parcours.tabIndex = ouvert ? 0 : -1;

    const titreA = tPrete('parcours_commutateur_activite_title');
    const titreP = tPrete('parcours_entree_title');
    if (titreA) activite.title = titreA; else activite.removeAttribute('title');
    if (titreP) parcours.title = titreP; else parcours.removeAttribute('title');
    const nom = tPrete('parcours_commutateur_aria');
    entree.setAttribute('aria-label', nom || 'Que souhaitez-vous créer ?');

    parcours.classList.toggle('pc-commutateur__b--reprise', !ouvert && brouillonEnAttente());
}

/* ------------------------------------------------------------------ *
 *  La tête de l'atelier : marque, fil des étapes, retour aux tuiles
 * ------------------------------------------------------------------ */

/**
 * La tête de l'atelier : son nom, et le fil des étapes. Rien d'autre.
 *
 * Le choix Activité/Parcours reste sous le formulaire commun, au-dessus.
 */
function construireTete() {
    const tete = document.createElement('header');
    tete.className = 'pc-atelier__tete';

    // Pas un titre de section : les écrans ont chacun le leur (`.pc-hero h2`),
    // et l'atelier est une région nommée par ce libellé. Focalisable pour que
    // l'ouverture soit annoncée, sans entrer dans l'ordre de tabulation.
    const titre = document.createElement('p');
    titre.className = 'pc-atelier__titre';
    titre.id = 'pc-titre';
    titre.dataset.key = 'parcours_titre';
    titre.tabIndex = -1;
    titre.textContent = t('parcours_titre');

    const fil = document.createElement('ol');
    fil.className = 'pc-steps';
    fil.id = 'pc-steps';

    tete.append(titre, fil);
    return tete;
}

/**
 * Peut-on rejoindre l'écran `n` par le fil ?
 *
 * Tout écran déjà atteint depuis l'ouverture est à un clic, à deux réserves :
 * ce qu'on y ferait doit avoir un sens (pas de fabrication sans plan valide,
 * pas de livraison sans activité prête), et rien ne bouge pendant un appel —
 * la barre d'action porte alors un bouton d'arrêt, c'est lui qu'on attend.
 */
function accessibleParLeFil(n) {
    if (n === etape || n > etapeMax || enCours) return false;
    if (file && file.enMarche()) return false;
    const d = brouillon();
    if (n >= 1 && !(d && d.plan)) return false;
    if (n >= 2 && !validerPlan(d).pret) return false;
    if (n === 3 && !validerFabrication(d).pret) return false;
    return true;
}

/**
 * Repeint le fil des étapes selon l'écran courant.
 *
 * Le fil est aussi la navigation : un écran déjà vu est un bouton, l'écran
 * courant est marqué, ceux qui restent sont inertes — on y arrive par l'action
 * primaire. Sous 900 px, seuls les numéros restent visibles ; les libellés
 * passent en nom accessible, ils ne disparaissent pas.
 */
function majTete() {
    if (!atelier) return;
    const fil = atelier.querySelector('#pc-steps');
    if (!fil) return;

    fil.replaceChildren();
    CONFIG.steps.forEach((step, idx) => {
        if (idx > 0) {
            const sep = document.createElement('li');
            sep.className = 'pc-steps__sep';
            sep.setAttribute('aria-hidden', 'true');
            fil.append(sep);
        }
        const li = document.createElement('li');
        li.className = 'pc-steps__item' + (idx === etape ? ' pc-steps__item--current' : '');
        if (idx === etape) li.setAttribute('aria-current', 'step');

        const nomComplet = t(step.labelKey) + ', ' + t('parcours_etape_sur')
            .split('@n').join(String(idx + 1))
            .split('@total').join(String(CONFIG.steps.length));

        const cliquable = accessibleParLeFil(idx);
        const cible = document.createElement(cliquable ? 'button' : 'span');
        cible.className = 'pc-steps__cible';
        if (cliquable) {
            cible.type = 'button';
            cible.addEventListener('click', () => allerA(idx));
            li.classList.add('pc-steps__item--lien');
        }
        cible.setAttribute('aria-label', nomComplet);
        cible.title = nomComplet;

        const num = document.createElement('span');
        num.className = 'pc-steps__num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(idx + 1);
        const label = document.createElement('span');
        label.className = 'pc-steps__label';
        label.setAttribute('aria-hidden', 'true');
        label.textContent = t(step.labelKey);
        cible.append(num, label);
        li.append(cible);
        fil.append(li);
    });
}

/* ------------------------------------------------------------------ *
 *  « Personnaliser les instructions » — l'autre voie, à côté de l'action primaire
 * ------------------------------------------------------------------ */

/**
 * L'action primaire génère en un clic avec l'IA de Caramel. « Personnaliser
 * les instructions »
 * est l'autre voie, comme dans la modale d'une activité (D64, retour
 * d'Emmanuel du 14 sept. 2026 : un interrupteur à côté du bouton n'avait pas
 * de sens). Au cadrage, il ouvre la fenêtre du plan ; sur le plan, il mène aux
 * activités sans rien générer, chacune gardant sa propre personnalisation.
 */
function construireBoutonGuide() {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'pc-guide-open';
    b.className = 'pc-secondaire pc-guide-open';
    const i = document.createElement('i');
    i.className = 'fas fa-sliders';
    i.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.dataset.key = 'parcours_mode_guide';
    label.textContent = t('parcours_mode_guide');
    b.append(i, label);
    b.addEventListener('click', async () => {
        if (enCours || file?.enMarche()) return;
        if (etape === 0) {
            // Ouvrable sans sujet : on peut y reprendre un scénario. « Générer en un
            // clic », lui, attend le sujet, comme « Composer le plan ».
            const { ouvrirPlanExterne } = await import('./external-ai.js');
            if (atelier && etape === 0 && !enCours) {
                ouvrirPlanExterne(ouvrirBrouillon(), () => allerA(1), { genererEnUnClic: etatAction().pret ? composerPlan : null });
            }
        } else if (etape === 1 && validerPlan(brouillon()).pret) {
            allerA(2);
        }
    });
    return b;
}

/** Le bouton ne s'affiche que là où il y a un choix à faire. */
function majBoutonGuide() {
    const b = atelier?.querySelector('#pc-guide-open');
    if (!b) return;
    const label = b.querySelector('span');
    const labelKey = etape === 0 ? 'parcours_personnaliser_plan' : 'parcours_mode_guide';
    if (label) {
        label.dataset.key = labelKey;
        label.textContent = t(labelKey);
    }
    const d = brouillon();
    const utile = !enCours && !file?.enMarche()
        && (etape === 0 || (etape === 1 && cartesAFabriquer(d) > 0));
    b.hidden = !utile;
    b.disabled = etape === 1 && !validerPlan(d).pret;
}

/* ------------------------------------------------------------------ *
 *  Barre d'action — le pied de l'atelier, dans le flux de la page
 * ------------------------------------------------------------------ */

function construireActionbar() {
    const bar = document.createElement('footer');
    bar.className = 'pc-actionbar';

    const inner = document.createElement('div');
    inner.className = 'pc-actionbar__inner';

    const gauche = document.createElement('div');
    gauche.className = 'pc-actionbar__gauche';

    const retour = document.createElement('button');
    retour.type = 'button';
    retour.className = 'pc-back';
    retour.id = 'pc-back';
    const ri = document.createElement('i');
    ri.className = 'fas fa-arrow-left';
    ri.setAttribute('aria-hidden', 'true');
    const labelRetour = document.createElement('span');
    labelRetour.dataset.key = 'parcours_retour';
    labelRetour.textContent = t('parcours_retour');
    retour.append(ri, labelRetour);
    retour.addEventListener('click', () => { if (etape > 0) allerA(etape - 1); });

    // Voie « je sais déjà ce que je veux » : le squelette du modèle, tout de
    // suite, sans appel au modèle de langue. N'apparaît que si une trame est
    // choisie — « laissez Caramel proposer » n'a par définition pas de structure.
    const modele = document.createElement('button');
    modele.type = 'button';
    modele.className = 'pc-secondaire';
    modele.id = 'pc-modele';
    const mi2 = document.createElement('i');
    mi2.className = 'fas fa-layer-group';
    mi2.setAttribute('aria-hidden', 'true');
    modele.append(mi2, document.createTextNode(t('parcours_cta_modele')));
    modele.title = t('parcours_cta_modele_hint');
    modele.addEventListener('click', partirDuModele);

    // Juste à droite, l'autre départ sans IA (D85) : rouvrir un scénario .json exporté
    // à la livraison. Il déclenche le champ fichier des actions du scénario, qui lit,
    // contrôle, demande avant de remplacer un parcours en cours, puis ouvre le plan.
    const importer = document.createElement('button');
    importer.type = 'button';
    importer.className = 'pc-secondaire';
    importer.id = 'pc-importer-modele';
    const ii = document.createElement('i');
    ii.className = 'fas fa-file-import';
    ii.setAttribute('aria-hidden', 'true');
    importer.append(ii, document.createTextNode(t('parcours_importer_modele')));
    importer.title = t('parcours_importer_modele_hint');
    importer.addEventListener('click', () => {
        if (!enCours && !file?.enMarche()) atelier?.querySelector('#pc-scenario-fichier')?.click();
    });

    // Les deux départs forment UN élément de la grille du pied : ses boutons de gauche
    // partagent une seule cellule, où « Retour » et eux ne se montrent jamais ensemble.
    const departs = document.createElement('div');
    departs.className = 'pc-actionbar__departs';
    departs.id = 'pc-departs';
    departs.append(modele, importer);

    const note = document.createElement('p');
    note.className = 'pc-actionbar__note';
    note.id = 'pc-action-note';
    gauche.append(retour, departs, note);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'pc-cta';
    cta.id = 'pc-cta';
    cta.addEventListener('click', onCta);

    const droite = document.createElement('div'); droite.className = 'pc-actionbar__droite';
    selecteurActionbar?.detruire();
    selecteurActionbar = construireSelecteurModele('pc-actionbar');
    selecteurActionbar.racine.id = 'pc-actionbar-generation';
    selecteurActionbar.principale.append(cta);
    droite.append(selecteurActionbar.racine);
    queueMicrotask(() => selecteurActionbar?.brancher());
    inner.append(gauche, construireBoutonGuide(), droite);
    bar.append(inner);
    return bar;
}

/** Ce que fait l'action primaire dépend de l'écran — et de l'état. */
function onCta() {
    // Un appel de plan en vol : le bouton primaire est un bouton d'arrêt.
    if (enCours) { requestCancelGeneration(); return; }

    if (etape === 0) { composerPlan(); return; }
    // Valider le plan, c'est autoriser la fabrication : elle démarre en
    // arrivant sur l'écran suivant, sans second bouton à trouver.
    if (etape === 1) {
        const d = brouillon();
        if (validerPlan(d).pret) {
            if (!cartesAFabriquer(d) && !supportsManquants(d) && validerFabrication(d).pret) allerA(3);
            else allerA(2, { demarrer: true });
        }
        return;
    }

    if (etape === 2) {
        if (!file) return;
        // Fabrication en cours → arrêter. Sinon : reprendre ce qui reste, ou
        // passer à la livraison quand il ne reste plus rien à fabriquer.
        if (file.enMarche()) { file.arreter(); return; }
        const snap = file.etat();
        if (snap.restantes > 0 || snap.echecs > 0) { file.demarrer(); return; }
        // Livrer un parcours vide n'aurait aucun sens : au moins une activité.
        if (validerFabrication(brouillon()).pret) allerA(3);
        return;
    }

    fermerAtelier();
}

/** Nombre de cartes du plan qu'il reste à fabriquer. */
function cartesAFabriquer(draft) {
    const plan = draft && draft.plan;
    if (!plan) return 0;
    return cartesAPlat(plan).filter(({ carte }) => !carte.contenu && !carte.verrouillee && !sourceManquante(carte)).length;
}

function supportsManquants(draft) {
    return cartesAPlat(draft?.plan).filter(({ carte }) => !carte.contenu && !carte.verrouillee && sourceManquante(carte)).length;
}

/** Met à jour le pied de page selon l'écran et l'état. */
function rafraichirAction() {
    if (!atelier) return;
    actionsScenario?.rafraichir();
    if (langueEnAttente && !enCours && !file?.enMarche()) {
        langueEnAttente = false;
        queueMicrotask(() => { if (atelier) allerA(etape, { resterSurPlace: true }); });
    }
    // L'écran peut avoir une part à repeindre quand le formulaire change
    // (la note des pièces jointes du cadrage).
    if (ecran && typeof ecran.rafraichir === 'function') ecran.rafraichir();

    const cta = atelier.querySelector('#pc-cta');
    const note = atelier.querySelector('#pc-action-note');
    const retour = atelier.querySelector('#pc-back');
    const choixModele = atelier.querySelector('#pc-actionbar-generation');
    const flecheModele = choixModele?.querySelector('.dropdown-toggle');
    if (!cta || !note || !retour) return;

    // Le fil suit l'état : ses liens se gèlent pendant un appel, se rouvrent
    // après, et la livraison s'y allume dès qu'une activité est prête.
    majTete();
    majBoutonGuide();

    retour.hidden = etape === 0;

    // « Partir du modèle » (la voie sans IA, D11) n'existe que sur le cadrage,
    // et n'a de sens qu'une trame choisie. Il ne DISPARAÎT plus pour autant
    // quand « Laissez Caramel proposer » est coché : il se grise en disant
    // pourquoi. Caché, l'enseignant qui veut éviter l'IA ne découvrait la voie
    // qu'en cliquant une trame par hasard (relecture UX du 6 sept. 2026).
    // « Importer un modèle » (D85) partage sa place et ses conditions : cadrage seul, hors appel.
    const departs = atelier.querySelector('#pc-departs');
    if (departs) departs.hidden = enCours || etape !== 0;
    const importer = atelier.querySelector('#pc-importer-modele');
    if (importer) importer.title = t('parcours_importer_modele_hint');
    const modele = atelier.querySelector('#pc-modele');
    if (modele) {
        const d = brouillon();
        modele.hidden = enCours || etape !== 0;
        const sansTrame = !d || d.trame === 'auto';
        modele.disabled = sansTrame;
        modele.title = t(sansTrame ? 'parcours_cta_modele_choisir' : 'parcours_cta_modele_hint');
        modele.setAttribute('aria-disabled', String(sansTrame));
    }

    if (enCours) {
        // Le panneau d'attente porte le message ET son bouton « Arrêter » :
        // la barre n'a plus rien à dire, et deux arrêts à l'écran feraient hésiter.
        cta.hidden = true;
        if (choixModele) choixModele.hidden = true;
        cta.removeAttribute('aria-describedby');
        note.textContent = '';
        return;
    }

    cta.hidden = false;
    if (choixModele) choixModele.hidden = false;
    cta.classList.remove('pc-cta--annuler');

    // La fabrication est le seul écran dont l'action change EN COURS DE ROUTE :
    // elle arrête, puis reprend, puis laisse passer.
    if (etape === 2 && file) {
        const snap = file.etat();
        if (snap.enMarche) {
            cta.disabled = false;
            if (flecheModele) flecheModele.disabled = true;
            cta.classList.add('pc-cta--annuler');
            cta.replaceChildren(document.createTextNode(t('parcours_annuler')));
            cta.removeAttribute('aria-describedby');
            // La jauge et les lignes montrent l'avancement : rien à ajouter.
            note.textContent = '';
            return;
        }
        const reste = snap.restantes > 0 || snap.echecs > 0;
        const jamais = snap.faites === 0;
        cta.disabled = !reste && !validerFabrication(brouillon()).pret;
        if (choixModele) choixModele.classList.toggle('pc-llm-selector--sans-menu', !reste);
        if (flecheModele) flecheModele.disabled = cta.disabled;
        cta.removeAttribute('aria-describedby');
        // Des activités déjà prêtes (fabriquées, collées depuis une autre IA ou
        // reprises d'un scénario) ne sont jamais refaites : le bouton le dit, il
        // COMPLÈTE le parcours (retour d'Emmanuel du 14 sept. 2026).
        cta.replaceChildren(document.createTextNode(
            !reste ? t('parcours_cta_livrer')
                : jamais ? t('parcours_fab_lancer')
                : tJetons('parcours_cta_completer', { n: snap.restantes + snap.echecs })));
        // Une seule ligne utile, et rien quand tout est prêt : l'écran le montre.
        // Les lignes portent déjà « Support à ajouter » ou « À compléter à la main ».
        note.textContent = '';
        return;
    }

    if (etape === 3) {
        cta.disabled = false;
        if (choixModele) choixModele.classList.add('pc-llm-selector--sans-menu');
        cta.removeAttribute('aria-describedby');
        cta.replaceChildren(document.createTextNode(t('parcours_liv_terminer')));
        note.textContent = '';
        return;
    }

    const { pret, raisonKey } = etape === 0 ? etatAction() : validerPlan(brouillon());

    // Sur le plan, le bouton dit ce qu'il va coûter : le nombre d'activités
    // que le clic lance. C'est LA validation explicite avant la dépense — la
    // fabrication démarre ensuite d'elle-même.
    let libelle;
    if (etape === 0) {
        libelle = t('parcours_cta_plan');
    } else {
        const d = brouillon();
        const n = cartesAFabriquer(d);
        const total = d && d.plan ? cartesAPlat(d.plan).length : 0;
        const pretes = d && d.plan ? cartesAPlat(d.plan).filter(({ carte }) => carte.contenu).length : 0;
        const livrable = !supportsManquants(d) && validerFabrication(d).pret;
        // Un plan vide dit « (0 activités) », à côté de la raison qui le grise ;
        // un parcours prêt peut rejoindre directement la livraison.
        if (!n && total && livrable) libelle = t('parcours_cta_livrer');
        else if (n > 0 && pretes > 0) libelle = tJetons('parcours_cta_completer', { n });
        else if (n > 0 || total === 0) libelle = tJetons('parcours_cta_fabriquer', { n });
        else libelle = t('parcours_step_fabrication');
    }
    cta.replaceChildren(document.createTextNode(libelle));

    cta.disabled = !pret;
    const genere = etape === 0 || (etape === 1 && cartesAFabriquer(brouillon()) > 0);
    if (choixModele) choixModele.classList.toggle('pc-llm-selector--sans-menu', !genere);
    if (flecheModele) flecheModele.disabled = cta.disabled;
    // Un `aria-describedby` vide reste un pointeur vers rien : on retire
    // l'attribut plutôt que de le vider.
    if (pret || (etape === 0 && raisonKey === 'parcours_cta_besoin_sujet')) cta.removeAttribute('aria-describedby');
    else cta.setAttribute('aria-describedby', 'pc-action-note');

    // Le pied ne porte pas de texte d'accompagnement (retour d'Emmanuel du 14 sept.
    // 2026) : seulement la raison qui grise le bouton, et les échecs.
    note.textContent = !pret && raisonKey !== 'parcours_cta_besoin_sujet' ? t(raisonKey) : '';
}

/** Traduction avec jetons `@nom`. */
function tJetons(cle, jetons) {
    let s = t(cle);
    for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/* ------------------------------------------------------------------ *
 *  Navigation entre écrans
 * ------------------------------------------------------------------ */

const ECRANS = [
    (draft, api) => construireCadrage(api),
    (draft, api) => construirePlan(draft, api),
    (draft, api) => construireFabrication(draft, { ...api, appelModele: doublure }),
    (draft, api) => construireLivraison(draft, api),
];

/**
 * Affiche l'écran `n`.
 *
 * @param {number} n
 * @param {Object} [options]
 * @param {boolean} [options.demarrer] - Lancer la fabrication en arrivant sur
 *   l'écran 3 : c'est ce que fait le clic sur « Fabriquer » depuis le plan. Un
 *   retour sur cet écran (langue changée, reprise) ne relance rien tout seul.
 */
function allerA(n, { demarrer = false, resterSurPlace = false } = {}) {
    if (!atelier) return;
    if (enCours || file?.enMarche()) return;
    // Quitter la fabrication libère sa file : on ne laisse pas une file vivre
    // derrière un écran démonté, ses appels retomberaient dans le vide.
    if (etape === 2 && n !== 2 && file) {
        if (file.enMarche()) file.arreter();
        file = null;
    }
    if (n !== etape) actionsScenario?.effacerEtat();
    etape = n;
    atelier.classList.toggle('pc-atelier--cadrage', n === 0);
    etapeMax = Math.max(etapeMax, n);
    const corps = atelier.querySelector('.pc-body');
    if (!corps) return;
    ecran?.detruire?.();
    ecran = ECRANS[n](ouvrirBrouillon(), { rafraichirAction, fermer: fermerAtelier, allerA });
    if (n === 2) file = ecran.file;
    corps.replaceChildren(ecran.node);
    // `rafraichirAction` repeint aussi le fil des étapes.
    rafraichirAction();
    if (!resterSurPlace) {
        if (n === 0) {
            // Revenir au cadrage ramène aussi aux champs qui en font partie.
            defilerEnHaut();
            entree?.querySelector('#parcours-button')?.focus({ preventScroll: true });
        } else {
            defilerEnTete();
            atelier.querySelector('#pc-titre')?.focus({ preventScroll: true });
        }
    }

    if (n === 2 && demarrer && file && !file.enMarche() && file.etat().restantes > 0) {
        file.demarrer();
        debugLog('parcours', 'fabrication lancée depuis le plan');
    }
}

/**
 * Amène la tête de l'atelier sous la barre d'application. La page défile,
 * pas un cadre interne : l'atelier est un contenu de la page comme les tuiles
 * qu'il remplace. La marge de défilement de la section fait le reste.
 */
function defilerEnTete() {
    if (!atelier || typeof atelier.scrollIntoView !== 'function') return;
    const reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    atelier.scrollIntoView({ block: 'start', behavior: reduit ? 'instant' : 'smooth' });
}

/** Ramène la page en haut, sur le formulaire et les tuiles. */
function defilerEnHaut() {
    const cible = atelier;
    // La suppression du plan change la hauteur de page. Laisser le navigateur
    // appliquer son ancrage avant de remonter, sinon il peut redécaler le scroll
    // après notre scrollTo. Ne pas agir si l'utilisateur a déjà changé d'écran.
    requestAnimationFrame(() => requestAnimationFrame(() => {
        if (atelier !== cible || (atelier && etape !== 0)) return;
        const reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduit ? 'instant' : 'smooth' });
    }));
}

/**
 * Le temps de l'appel de plan, le cadrage s'efface au profit d'un panneau
 * d'attente — DANS le flux, à la place de l'écran, et non par-dessus : la
 * page a une hauteur de page, un voile absolu centrerait son anneau hors de
 * l'écran. La barre d'action reste visible, avec son bouton d'arrêt.
 */
function voile(actif) {
    if (!atelier) return;
    const corps = atelier.querySelector('.pc-body');
    if (!corps) return;
    let v = corps.querySelector('.pc-veil');
    if (actif && !v) {
        v = document.createElement('div');
        v.className = 'pc-veil';
        v.setAttribute('role', 'status');
        v.setAttribute('aria-live', 'polite');

        // L'anneau tourne AUTOUR du caramel qui se remplit : une seule image
        // d'attente, à la marque, là où un anneau nu ne disait rien.
        const loader = document.createElement('div');
        loader.className = 'pc-veil__loader';
        loader.setAttribute('aria-hidden', 'true');
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 132 132');
        svg.setAttribute('class', 'pc-veil__anneau');
        svg.setAttribute('aria-hidden', 'true');
        for (const classe of ['pc-veil__anneau-piste', 'pc-veil__anneau-arc']) {
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', '66'); c.setAttribute('cy', '66'); c.setAttribute('r', '62');
            c.setAttribute('class', classe);
            svg.append(c);
        }
        loader.append(svg, bonbon('remplissage'));

        const txt = document.createElement('p');
        txt.className = 'pc-veil__txt';
        txt.textContent = t('parcours_plan_en_cours');
        const sous = document.createElement('p');
        sous.className = 'pc-veil__sub';
        sous.textContent = t('parcours_plan_en_cours_sub');

        // Les trois jalons ne sont PAS décoratifs : ils suivent l'appel réel
        // (envoi → attente du modèle → contrôle du format). Un faux
        // avancement serait pire que pas d'avancement du tout.
        const jalons = document.createElement('ol');
        jalons.className = 'pc-veil__jalons';
        for (const cle of JALONS) {
            const li = document.createElement('li');
            li.className = 'pc-jalon pc-jalon--attente';
            const puce = document.createElement('span');
            puce.className = 'pc-jalon__puce';
            puce.setAttribute('aria-hidden', 'true');
            const nom = document.createElement('span');
            nom.className = 'pc-jalon__nom';
            nom.textContent = t(cle);
            li.append(puce, nom);
            jalons.append(li);
        }

        const duree = document.createElement('p');
        duree.className = 'pc-veil__duree';
        duree.textContent = t('parcours_plan_duree');

        // L'arrêt est ICI, à côté de ce qu'il arrête. La barre d'action du bas
        // se tait pendant ce temps : deux « Arrêter » à l'écran, c'est un de trop.
        const arret = document.createElement('button');
        arret.type = 'button';
        arret.className = 'pc-veil__arret';
        arret.setAttribute('aria-label', t('parcours_plan_arret_aria'));
        const carre = document.createElement('i');
        carre.className = 'fas fa-stop';
        carre.setAttribute('aria-hidden', 'true');
        const libelle = document.createElement('span');
        libelle.textContent = t('parcours_annuler');
        arret.append(carre, libelle);
        arret.addEventListener('click', () => {
            // Une demande d'arrêt suffit : le second clic n'arrêterait rien de plus.
            arret.disabled = true;
            requestCancelGeneration();
        });

        v.append(loader, txt, sous, jalons, duree, arret);
        corps.append(v);
        atelier.classList.add('pc-atelier--voile');
        jalonVoile(0);
        // Passé la durée habituelle, on le DIT, plutôt que de laisser croire
        // que c'est bloqué (l'appel a jusqu'à 59 s, et il y a un rattrapage).
        clearTimeout(minuteurAttente);
        minuteurAttente = setTimeout(() => {
            const d = atelier && atelier.querySelector('.pc-veil__duree');
            if (d) d.textContent = t('parcours_plan_duree_longue');
        }, 45000);
        defilerEnTete();
    } else if (!actif && v) {
        clearTimeout(minuteurAttente);
        minuteurAttente = null;
        v.remove();
        atelier.classList.remove('pc-atelier--voile');
    }
}

/** Les trois jalons de la composition, dans l'ordre où ils arrivent. */
const JALONS = ['parcours_plan_jalon_envoi', 'parcours_plan_jalon_modele', 'parcours_plan_jalon_format'];

/**
 * Marque l'avancement du panneau d'attente : ce qui est fait, ce qui court,
 * ce qui vient. Appelé aux vrais points de bascule de `composerPlan()`.
 *
 * @param {number} index - Le jalon en cours (0, 1 ou 2).
 */
function jalonVoile(index) {
    if (!atelier) return;
    atelier.querySelectorAll('.pc-veil__jalons .pc-jalon').forEach((li, i) => {
        li.className = `pc-jalon pc-jalon--${i < index ? 'fait' : i === index ? 'encours' : 'attente'}`;
        if (i === index) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
    });
}

/** Ouvre le tableau de bord sur le squelette du modèle, sans appeler le modèle. */
async function partirDuModele() {
    const draft = ouvrirBrouillon();
    const plan = planDepuisTrame(draft.trame, draft.platform, draft.ampleur);
    if (!plan) return;
    if (draft.plan && !await confirmerRemplacement(atelier)) return;
    majBrouillon({ plan, statsId: releverParcours(draft, plan, { origine: ORIGINES_PLAN.modele }) });
    allerA(1);
    debugLog('parcours', `plan local depuis la trame « ${draft.trame} »`);
}

/* ------------------------------------------------------------------ *
 *  Appel de plan
 * ------------------------------------------------------------------ */

async function composerPlan(modele = modeleParcours()) {
    if (enCours || !etatAction().pret) return;
    const draft = ouvrirBrouillon();
    // La question laisse le temps d'un second clic : on revérifie après elle.
    if (draft.plan && (!await confirmerRemplacement(atelier) || enCours)) return;
    const tour = ++generationPlan;
    enCours = true;
    voile(true);
    rafraichirAction();
    beginGeneration();
    // Mesures du plan pour la ligne `PARCOURS` : l'appel lui-même passe en
    // `stats: 'skip'`, un plan n'est pas une activité de `DONNEES`.
    const debut = new Date();
    const mesures = { modelDemande: modele, essais: 0, promptTokens: 0, completionTokens: 0 };

    try {
        const { construirePromptPlan } = await import('./scenario-prompt.js');
        const { controlerCalibrage, remarquesComposition } = await import('./calibrage.js');
        if (tour !== generationPlan) return;
        const { prompt, calibrage, modules } = construirePromptPlan(draft);
        let demande = prompt;
        let brut;
        // Un seul rattrapage, en série, sur le même modèle. Aucun contenu généré
        // n'est découpé pour faire rentrer artificiellement le plan dans la borne.
        for (let essai = 0; essai < 2; essai++) {
            jalonVoile(1);
            const res = await generateRawWithLLM(demande, modele, {
                activityMeta: { moduleKey: 'parcours-plan', category: 'parcours' },
                stats: 'skip',
            });
            mesures.essais += 1;
            mesures.promptTokens += res.promptTokens || 0;
            mesures.completionTokens += res.completionTokens || 0;
            mesures.model = res.model || modele;
            mesures.fallbackLevel = res.fallbackLevel || 0;
            if (tour !== generationPlan || !atelier) return;
            // La réponse est là : reste à en tirer le JSON et à le contrôler.
            jalonVoile(2);
            brut = await extraireJson(res.content);
            if (tour !== generationPlan || !atelier) return;
            if (isCancelRequested()) throw Object.assign(new Error('Composition annulée.'), { code: 'GENERATION_CANCELLED' });
            const erreurs = controlerCalibrage(brut, calibrage, modules);
            // Les remarques de composition ne comptent qu'à la première réponse :
            // elles demandent la reprise, jamais l'échec (D81).
            const remarques = essai === 0 ? remarquesComposition(brut) : [];
            if (!erreurs.length && !remarques.length) break;
            debugLog('parcours', `calibrage du plan, tentative ${essai + 1}`, erreurs, remarques);
            if (essai === 1) {
                const erreur = new Error('Plan hors du cadrage après deux tentatives.');
                erreur.code = 'PARCOURS_CALIBRAGE';
                throw erreur;
            }
            const sous = atelier.querySelector('.pc-veil__sub');
            if (sous) sous.textContent = t('parcours_plan_recalibrage');
            jalonVoile(1);
            // Repartir du sujet et de son corpus : recopier le plan trop long
            // dans la reprise incitait le modèle à conserver sa structure fautive.
            demande = `${prompt}\n\n## NOUVELLE COMPOSITION APRÈS CONTRÔLE\n` +
                `La proposition précédente n’a pas respecté le contrat :\n${[...erreurs, ...remarques].slice(0, 16).join('\n')}\n` +
                `Recompose le plan COMPLET à partir du sujet et des documents ci-dessus, avec EXACTEMENT ${calibrage.exemple.reduce((a, b) => a + b, 0)} activités : ` +
                `${calibrage.exemple.length} étapes de respectivement ${calibrage.exemple.join(', ')} activité(s). ` +
                'Conserve les objectifs essentiels et la conclusion, regroupe les sous-tâches dans les consignes. ' +
                'Compte les cartes avant de répondre. Retourne uniquement le JSON complet.';
        }
        const plan = normaliserPlan(brut, draft.platform);
        if (tour !== generationPlan || !atelier) return;
        if (!plan.etapes.length) throw new Error('Plan vide.');
        majBrouillon({ plan, statsId: releverParcours(draft, plan, { origine: ORIGINES_PLAN.ia, debut, mesures }) });
        enCours = false;
        voile(false);
        allerA(1);
        debugLog('parcours', `plan reçu : ${plan.etapes.length} étape(s)`, plan);
    } catch (e) {
        if (tour !== generationPlan) return;
        enCours = false;
        voile(false);
        rafraichirAction();
        if (isCancellation(e)) { debugLog('parcours', 'plan annulé'); return; }
        // Le modèle a répondu mais le plan n'a pas été retenu : les jetons sont
        // dépensés, la ligne le dit. Sans réponse (réseau), rien n'est relevé.
        if (mesures.essais > 0) {
            releverParcours(draft, null, { origine: ORIGINES_PLAN.ia, debut, mesures,
                statut: e.code === 'PARCOURS_CALIBRAGE' ? 'hors_cadrage' : 'echec' });
        }
        const info = classifyError ? classifyError(e) : null;
        const note = atelier && atelier.querySelector('#pc-action-note');
        if (note) note.textContent = t(e.code === 'PARCOURS_CALIBRAGE' ? 'parcours_plan_calibrage_echec'
            : info && info.userMessageKey ? info.userMessageKey : 'parcours_plan_echec');
        console.error('[parcours] composition du plan échouée :', e);
    }
}

/* ------------------------------------------------------------------ *
 *  L'atelier dans la page
 * ------------------------------------------------------------------ */

/**
 * Le formulaire de l'accueil vit au-dessus de l'atelier : ce qu'on y tape
 * compte tout de suite. Le sujet conditionne l'action du cadrage, les pièces
 * jointes nourrissent sa note — on repeint le pied à chaque saisie.
 */
function surSaisieFormulaire(e) {
    if (!atelier || etape !== 0) return;
    const cible = e.target;
    if (!(cible instanceof Element)) return;
    const s = CONFIG.caramelSelectors;
    if (cible.matches(`${s.qui}, ${s.quoi}, ${s.niveau}, ${s.corpus}`)) rafraichirAction();
}

/** Guette l'apparition ou le retrait d'une pièce jointe. */
function guetterSources() {
    if (observateur || typeof MutationObserver !== 'function') return;
    const zone = document.querySelector(CONFIG.caramelSelectors.zoneSources);
    if (!zone) return;
    observateur = new MutationObserver(() => { if (atelier && etape === 0) rafraichirAction(); });
    observateur.observe(zone, { childList: true, subtree: true });
}

function ouvrirAtelier({ focaliser = true } = {}) {
    if (atelier) return;
    const s = CONFIG.caramelSelectors;
    const hote = document.querySelector(s.hote);
    if (!hote) {
        debugLog('parcours', 'pas d’hôte pour l’atelier : rien n’est ouvert');
        return;
    }

    const draft = ouvrirBrouillon();
    // Un plan déjà composé ramène directement à son tableau de bord.
    etape = draft.plan ? 1 : 0;
    etapeMax = etape;

    atelier = document.createElement('section');
    atelier.className = 'pc-atelier';
    atelier.id = 'pc-atelier';
    atelier.setAttribute('aria-labelledby', 'pc-titre');

    const corps = document.createElement('div');
    corps.className = 'pc-body';

    actionsScenario = construireActionsScenario({ allerA, occupe: () => enCours || Boolean(file?.enMarche()) });
    const navigation = document.createElement('div');
    navigation.className = 'pc-navigation';
    navigation.append(construireTete(), actionsScenario.node);
    atelier.append(navigation, corps, construireActionbar());

    // Les tuiles et leurs filtres s'effacent ; l'atelier prend leur place —
    // littéralement : il est inséré là où commençait le premier bloc effacé.
    // `hidden` seul ne suffit PAS : la grille et la barre de filtres ont un
    // `display` posé par la feuille de style de Caramel, qui l'emporte sur
    // celui de l'attribut. Le style en ligne, lui, gagne sur tout — et on
    // rend à chaque bloc exactement celui qu'il avait.
    masques = s.remplaces
        .map(sel => hote.querySelector(sel))
        .filter(el => el && !el.hidden)
        .map(el => ({ el, display: el.style.display }));
    const premier = masques.length ? masques[0].el : null;
    for (const { el } of masques) { el.hidden = true; el.style.display = 'none'; }
    if (premier) hote.insertBefore(atelier, premier); else hote.append(atelier);

    // Un premier cadrage prolonge le formulaire : changer de mode ne doit
    // ni l'envoyer hors écran, ni sauter ses champs dans le parcours clavier.
    // Reprendre un plan existant garde en revanche son accès direct au plan.
    allerA(etape, { resterSurPlace: etape === 0 || !focaliser });
    requestAnimationFrame(() => atelier && atelier.classList.add('pc-atelier--open'));

    document.addEventListener('input', surSaisieFormulaire, true);
    guetterSources();
    traduireEntree();

    if (focaliser) {
        const cible = etape === 0 ? entree?.querySelector('#parcours-button') : atelier.querySelector('#pc-titre');
        cible?.focus({ preventScroll: true });
    }

    debugLog('parcours', `atelier ouvert (écran ${etape + 1})`);
}

function fermerAtelier({ focaliser = true } = {}) {
    if (!atelier) return;
    // Quitter pendant une fabrication l'arrête : rien ne tourne hors de vue.
    if (file) { if (file.enMarche()) file.arreter(); file = null; }
    if (enCours) requestCancelGeneration();
    generationPlan++;
    ecran?.detruire?.();
    selecteurActionbar?.detruire();
    selecteurActionbar = null;
    atelier.remove();
    atelier = null;
    ecran = null;
    actionsScenario = null;
    enCours = false;

    document.removeEventListener('input', surSaisieFormulaire, true);
    if (observateur) { observateur.disconnect(); observateur = null; }

    for (const { el, display } of masques) { el.hidden = false; el.style.display = display; }
    masques = [];

    traduireEntree();
    if (focaliser) {
        // Ouvrir avait fait descendre la page jusqu'à l'atelier ; fermer la
        // ramène en haut, aux tuiles — sans quoi on reste devant un vide, là
        // où l'atelier était (retour d'Emmanuel, 7 sept. 2026).
        defilerEnHaut();
        const segment = entree && entree.querySelector('#activites-button');
        if (segment && document.contains(segment)) segment.focus({ preventScroll: true });
    }

    debugLog('parcours', 'atelier fermé');
}

/** La bascule du bouton d'en-tête : tuiles ⇄ atelier. */
function basculerAtelier() {
    if (atelier) fermerAtelier(); else ouvrirAtelier();
}

/* ------------------------------------------------------------------ *
 *  Amorçage
 * ------------------------------------------------------------------ */

/**
 * Pose le commutateur sous le formulaire commun.
 * Ne construit l'atelier qu'au premier clic — coût sur la page d'accueil : une
 * pilule à deux segments.
 *
 * Sans formulaire commun, le module ne pose pas de sélecteur.
 */
export function initParcours() {
    if (entree) return;
    const s = CONFIG.caramelSelectors;
    const ancre = document.querySelector(s.entreeApres);
    if (!ancre) return;
    entree = construireEntree();
    traduireEntree();
    ancre.after(entree);
    const barre = document.querySelector(s.barre);
    const placer = () => document.querySelector(s.hote)?.style.setProperty('--pc-header-height', `${barre?.getBoundingClientRect().height || 0}px`);
    placer();
    if (barre && typeof ResizeObserver === 'function') {
        observerBarre = new ResizeObserver(placer);
        observerBarre.observe(barre);
    }

    // Le changement de langue repeint l'entrée ET l'atelier s'il est ouvert —
    // sur place, sans déplacer le focus ni relancer quoi que ce soit.
    window.addEventListener('caramel:language-changed', () => {
        traduireEntree();
        if (atelier) {
            if (enCours || file?.enMarche()) langueEnAttente = true;
            else allerA(etape, { resterSurPlace: true });
        }
    });

    desabonner = surChangement(() => traduireEntree());
    debugLog('parcours', 'commutateur sous le formulaire');
}

/** Retire complètement le module (utilisé par les tests). */
export function destroyParcours() {
    observerBarre?.disconnect(); observerBarre = null;
    if (desabonner) { desabonner(); desabonner = null; }
    if (atelier) fermerAtelier({ focaliser: false });
    if (entree) { entree.remove(); entree = null; }
}

export const __testHooks = {
    ouvrirAtelier, fermerAtelier, basculerAtelier, rafraichirAction, allerA, extraireJson,
    /** Remplace le modèle de langue de la fabrication (bancs d'essai). */
    doublerModele: (fn) => { doublure = fn; },
};
