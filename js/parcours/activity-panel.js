/**
 * Relecture d’un parcours : le même panneau depuis le plan, la fabrication
 * et la livraison. Les lecteurs et l’éditeur sont ceux de l’activité unique
 * (`rendu-activite.js`, partagé avec la vue ouverte depuis les notifications).
 * Les transitions asynchrones portent un numéro : fermer/changer d’activité
 * pendant un chargement ne peut jamais repeindre le panneau suivant.
 *
 * Ouvert sur le parcours entier (`carte === null`), le panneau commence par la
 * VUE DU PARCOURS : l'accueil, chaque étape avec son texte, puis ses activités,
 * forum et textes de liaison compris (D65). « Vue du parcours » y ramène.
 */
import { recueillirMedias } from './sources.js';
import { t } from '../core/translation.js';
import { nomModule } from './activity-router.js';
import { majBrouillon } from './state.js';
import { cartesAPlat } from './parcours-runner.js';
import { el, action } from './dom.js';
import { confirmerAbandon } from './confirm-abandon.js';
import { titreActivite, rendreApercu, rendreEdition, attendreEditeur, prechargerBibliotheques } from './rendu-activite.js';
import { construireVueParcours } from './vue-parcours.js';

// Réexporté : la fabrication et la relecture le prennent ici.
export { titreActivite };

let panneau = null;

/** Ouvre une activité, ou la vue du parcours ; précédentes/suivantes suivent l’ordre du plan. */
export async function ouvrirActivite(draft, carte, { mode = 'apercu', apresEnregistrement = () => {} } = {}) {
    if (panneau) return;
    const depart = document.activeElement;
    const cartes = cartesAPlat(draft.plan).map(x => x.carte);
    // `null` : la vue du parcours, le cours entier dans l'ordre.
    let courante = carte || null;
    if (!courante && !cartes.length) return;
    let revision = 0;
    let ferme = false;
    let editeur = null;
    let lecteur = null;
    let confirmation = false;
    let modeAffiche = null;
    let estModifie = () => false;
    let detacherClavierLecteur = () => {};

    const voile = el('div', 'pc-editeur');
    panneau = voile;
    voile.setAttribute('role', 'dialog');
    voile.setAttribute('aria-modal', 'true');
    voile.setAttribute('aria-labelledby', 'pc-lecture-titre');
    const barre = el('header', 'pc-editeur__barre');
    const cadre = el('div', 'pc-editeur__cadre');
    const intitule = el('div', 'pc-editeur__intitule');
    const type = el('span', 'pc-lecture__type');
    const titre = el('h2', 'pc-editeur__titre');
    titre.id = 'pc-lecture-titre';
    const fermer = action('parcours_lecture_fermer', 'fa-xmark', demanderFermeture, 'pc-editeur__fermer');
    fermer.setAttribute('aria-label', t('parcours_lecture_fermer'));
    const outils = el('div', 'pc-lecture__outils');
    const navigation = el('div', 'pc-lecture__navigation');
    const sommaire = action('parcours_vue_titre', 'fa-list-ul', () => allerSommaire(), 'pc-secondaire pc-lecture__sommaire');
    const precedent = action('parcours_lecture_precedente', 'fa-arrow-left', () => changer(-1));
    const suivant = action('parcours_lecture_suivante', 'fa-arrow-right', () => changer(1));
    const position = el('span', 'pc-lecture__position');
    navigation.append(sommaire, precedent, position, suivant);
    const modes = el('div', 'pc-lecture__modes');
    const apercu = action('parcours_lecture_apercu', 'fa-eye', () => afficher('apercu'));
    const modifier = action('parcours_fab_editer', 'fa-pen-to-square', () => afficher('edition'));
    modes.append(apercu, modifier);
    outils.append(navigation, modes);
    const hote = el('div', 'pc-editeur__hote');
    hote.id = 'pc-lecture-contenu';
    const annonce = el('p', 'pc-lecture__annonce');
    annonce.setAttribute('role', 'status');
    intitule.append(type, titre);
    barre.append(intitule, fermer);
    cadre.append(barre, outils, annonce, hote);
    voile.append(cadre);
    document.body.append(voile);
    document.body.classList.add('pc-locked');
    fermer.focus();

    // Comme toute modale de consultation, un clic sur le voile ferme le
    // panneau. Un clic dans le cadre ne remonte jamais jusqu'à cette condition ;
    // en édition, la protection des modifications reste assurée par
    // `demanderFermeture()` et sa confirmation intégrée.
    voile.addEventListener('click', e => {
        if (e.target === voile) demanderFermeture();
    });

    async function abandonAutorise() {
        if (confirmation || ferme) return false;
        if (!estModifie()) return true;
        confirmation = true;
        try { return await confirmerAbandon(voile); }
        finally { confirmation = false; }
    }

    function nettoyer() {
        detacherClavierLecteur();
        detacherClavierLecteur = () => {};
        if (editeur) { editeur.detruire(); editeur = null; }
        if (lecteur) { lecteur.annuler(); lecteur = null; }
        estModifie = () => false;
    }

    async function demanderFermeture() {
        if (!await abandonAutorise()) return;
        ferme = true;
        revision++;
        nettoyer();
        document.removeEventListener('keydown', clavier);
        voile.remove();
        document.body.classList.remove('pc-locked');
        panneau = null;
        // Un enregistrement peut avoir redessiné la carte : retrouver son
        // bouton plutôt que de rendre le focus à un nœud détaché.
        const retour = depart?.isConnected ? depart : [...document.querySelectorAll('[data-carte]')]
            .find(n => n.dataset.carte === courante?.id)?.querySelector('[data-action="editer"]');
        retour?.focus({ preventScroll: true });
    }

    function clavier(e) {
        // L’éditeur ouvre ses propres dialogues (formules, confirmation).
        // Leur clavier leur appartient ; ne pas fermer les deux à la fois.
        const autre = document.activeElement?.closest('[role="dialog"], [role="alertdialog"]');
        if (autre && autre !== voile && !voile.contains(autre)) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); demanderFermeture(); }
        if (e.key !== 'Tab') return;
        const accessibles = [...voile.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], iframe, [tabindex="0"], [contenteditable="true"]')]
            .filter(n => n.getClientRects().length && !n.closest('[hidden]'));
        const premier = accessibles[0], dernier = accessibles.at(-1);
        if (!premier) return;
        if (!voile.contains(document.activeElement) || (!e.shiftKey && document.activeElement === dernier)) {
            e.preventDefault(); premier.focus();
        } else if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    }
    document.addEventListener('keydown', clavier);

    function relierClavierLecteur() {
        // Les événements d’une iframe ne remontent pas à la page. Permettre
        // Tab dans le vrai H5P, puis revenir aux commandes du panneau. Le
        // lecteur crée sa frame puis y écrit un nouveau document : suivre les
        // deux moments, sans attendre les métadonnées de manager.load().
        const cadres = new Map();
        function observerCadres() {
            for (const cadre of hote.querySelectorAll('iframe')) {
                if (cadres.has(cadre)) continue;
                let retirer = () => {};
                const attacher = () => {
                    retirer();
                    const doc = cadre.contentDocument;
                    if (!doc) return;
                    const handler = e => {
                        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); demanderFermeture(); return; }
                        if (e.key !== 'Tab') return;
                        const controles = [...doc.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')]
                            .filter(n => n.tabIndex >= 0 && n.getClientRects().length && !n.closest('[hidden]'));
                        if (!e.shiftKey && doc.activeElement === controles.at(-1)) { e.preventDefault(); fermer.focus(); }
                        else if (e.shiftKey && doc.activeElement === controles[0]) { e.preventDefault(); modifier.focus(); }
                    };
                    doc.addEventListener('keydown', handler, true);
                    retirer = () => doc.removeEventListener('keydown', handler, true);
                };
                cadre.addEventListener('load', attacher);
                cadres.set(cadre, () => { retirer(); cadre.removeEventListener('load', attacher); });
                attacher();
            }
        }
        const observation = new MutationObserver(observerCadres);
        observation.observe(hote, { childList: true, subtree: true });
        observerCadres();
        detacherClavierLecteur = () => { observation.disconnect(); cadres.forEach(retirer => retirer()); };
    }

    /**
     * La navigation ne mélange jamais consultation et fabrication :
     * - en aperçu, seulement les contenus déjà prêts ;
     * - en édition, toutes les cartes du plan.
     * Depuis la vue du parcours, on privilégie l'aperçu s'il en existe un.
     */
    function navigationPour(modeDemande = modeAffiche) {
        if (modeDemande !== 'edition') {
            const pretes = cartes.filter(c => c.contenu);
            if (pretes.length) return { cartes: pretes, mode: 'apercu' };
        }
        return { cartes, mode: 'edition' };
    }

    async function changer(delta) {
        if (!await abandonAutorise()) return;
        const navigation = navigationPour();
        const index = courante ? navigation.cartes.indexOf(courante) + delta : (delta > 0 ? 0 : -1);
        const prochaine = navigation.cartes[index];
        if (!prochaine) return;
        courante = prochaine;
        afficher(navigation.mode, true);
    }

    async function allerSommaire() {
        if (!courante || !await abandonAutorise()) return;
        courante = null;
        afficher('sommaire', true);
    }

    async function enregistrer(donnees) {
        const cible = courante;
        const tour = revision;
        try {
            const resultat = await recueillirMedias(cible, donnees, draft.plan);
            if (ferme || tour !== revision || cible !== courante) return;
            Object.assign(cible, resultat);
        } catch (e) {
            annonce.textContent = t(e.message === 'parcours_source_limite' ? e.message : 'editor_image_error_processing');
            return;
        }
        if (typeof donnees.title === 'string') courante.titre = donnees.title;
        draft.plan.personnalise = true;
        majBrouillon({ plan: draft.plan });
        estModifie = () => false;
        apresEnregistrement(courante);
        afficher('apercu', true);
        modifier.focus({ preventScroll: true });
        annonce.textContent = t('parcours_contenu_enregistre');
    }

    async function afficher(prochainMode, force = false) {
        if (!force && prochainMode === modeAffiche) return;
        if (ferme || (!force && !await abandonAutorise())) return;
        const tour = ++revision;
        // initJsonEditor est global. Attendre son éventuel montage avant de
        // le détruire, sinon un montage tardif écraserait l’activité suivante.
        await attendreEditeur();
        if (ferme || tour !== revision) return;
        nettoyer();
        mode = prochainMode;
        modeAffiche = mode;
        const surSommaire = courante === null;
        const navigation = navigationPour(mode);
        const indexNavigation = surSommaire ? -1 : navigation.cartes.indexOf(courante);
        titre.textContent = surSommaire ? (String(draft.plan.titre || '').trim() || t('parcours_fiche_sans_titre')) : titreActivite(courante);
        type.textContent = surSommaire ? t('parcours_vue_titre') : nomModule(courante.module);
        position.textContent = surSommaire ? '' : `${indexNavigation + 1} / ${navigation.cartes.length}`;
        sommaire.hidden = surSommaire;
        modes.hidden = surSommaire;
        precedent.disabled = surSommaire || indexNavigation <= 0;
        suivant.disabled = !surSommaire && indexNavigation >= navigation.cartes.length - 1;
        apercu.disabled = surSommaire || !courante.contenu;
        apercu.setAttribute('aria-pressed', String(mode === 'apercu'));
        modifier.setAttribute('aria-pressed', String(mode === 'edition'));
        annonce.textContent = '';
        hote.replaceChildren(el('p', 'pc-lecture__attente', t('parcours_lecture_chargement')));
        hote.scrollTop = 0;
        const cible = courante;
        const valide = () => !ferme && revision === tour;
        try {
            if (surSommaire) {
                const vue = await construireVueParcours(draft.plan, {
                    platform: draft.platform,
                    onOuvrir: c => { courante = c; afficher(c.contenu ? 'apercu' : 'edition', true); },
                });
                if (!valide()) return;
                hote.replaceChildren(vue);
            } else if (mode === 'edition') {
                const edition = await rendreEdition(hote, cible, {
                    valide,
                    onSave: donnees => enregistrer(donnees),
                    onRequestCancel: demanderFermeture,
                });
                if (!valide()) { edition.detruire(); return; }
                editeur = edition;
                estModifie = edition.estModifie;
            } else {
                const lecture = await rendreApercu(hote, cible, {
                    valide,
                    avantLecteur: poignee => { lecteur = poignee; relierClavierLecteur(); },
                });
                if (valide()) lecteur = lecture;
            }
        } catch (e) {
            if (!valide()) return;
            modeAffiche = null;
            hote.replaceChildren(el('p', 'pc-editeur__erreur', t('parcours_lecture_echec')));
            console.error('[parcours] ouverture de l’activité :', e);
        }
    }

    await afficher(courante === null ? 'sommaire' : (courante.contenu ? mode : 'edition'), true);
    // La première activité affichée, les bibliothèques des autres activités
    // prêtes se préchargent, les suivantes d'abord : passer de l'une à l'autre
    // ne les attend plus.
    if (ferme) return;
    const rang = courante ? cartes.indexOf(courante) : -1;
    prechargerBibliotheques([...cartes.slice(rang + 1), ...cartes.slice(0, rang + 1)]
        .filter(c => c.contenu).map(c => c.module));
}
