/**
 * @file Parcours — écran 3 : la fabrication.
 *
 * L'écran d'attente. Il doit tenir une promesse simple : à tout instant,
 * l'enseignant sait où en est chaque activité, ce qu'il reste, et ce qui a
 * échoué. Rien ne tourne « quelque part » sans qu'il le voie.
 *
 * Trois choix d'affichage, tous dictés par le fait qu'on fait attendre :
 *
 *  • **Une ligne par activité, groupée par étape** — le même découpage que le
 *    plan qu'il vient de relire. Retrouver son plan pendant l'attente vaut
 *    mieux qu'une barre de progression anonyme.
 *  • **La ligne en cours est désignée**, pas seulement animée : on ne fabrique
 *    qu'une activité à la fois (D7), autant le montrer plutôt que de laisser
 *    croire à un travail parallèle.
 *  • **Un échec ne bloque rien.** La ligne passe au rouge, la file continue, et
 *    le bouton « refaire » attend sur place.
 *
 * @module parcours/screen-fabrication
 */

import { construireSaisieSource } from './source-input.js';
import { t } from '../core/translation.js';
import { nomModule, imageModule, iconeModule } from './activity-router.js';
import { creerFile, cartesAPlat, ETATS } from './parcours-runner.js';
import { ouvrirActivite, titreActivite } from './activity-panel.js';
import { action, bonbon } from './dom.js';
import { confirmerRegeneration } from './confirm-abandon.js';

/* ------------------------------------------------------------------ *
 *  Fabrique de nœuds
 * ------------------------------------------------------------------ */

function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
}

function icone(nom) {
    const i = document.createElement('i');
    i.className = `fas ${nom}`;
    i.setAttribute('aria-hidden', 'true');
    return i;
}

function tr(cle, jetons) {
    let s = t(cle);
    if (jetons) for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/**
 * Les trois statuts de la fabrication portent le caramel de la marque plutôt
 * qu'une icône : vide tant qu'on attend, en train de se remplir pendant la
 * génération, plein quand l'activité est prête. Un caramel = UNE activité —
 * c'est pour ça que la jauge globale, elle, reste une barre.
 */
const BONBONS = {
    [ETATS.attente]: 'vide',
    [ETATS.encours]: 'remplissage',
    [ETATS.faite]: 'plein',
};

/**
 * Le signe de gauche du statut : un caramel pour la fabrication, une icône sinon.
 *
 * @param {string} statut
 * @param {boolean} revele - Vrai au SEUL passage vers « prête ». La mise en
 *   couleur est un événement, pas un état : sans ce drapeau, chaque repeinture
 *   de l'écran (il y en a une par changement de la file) la rejouerait sur
 *   toutes les lignes déjà faites.
 */
function marqueurStatut(statut, revele = false) {
    const niveau = BONBONS[statut];
    if (niveau) return bonbon(niveau, `pc-bonbon--mini${revele ? ' pc-bonbon--revele' : ''}`);
    const signe = SIGNES[statut] || SIGNES[ETATS.attente];
    return icone(signe.icone);
}

/** L'icône et la couleur d'un statut. */
const SIGNES = {
    [ETATS.reservee]: { icone: 'fa-lock', cle: 'parcours_fab_statut_reservee' },
    [ETATS.source]: { icone: 'fa-paperclip', cle: 'parcours_source_manquante' },
    [ETATS.attente]: { icone: 'fa-hourglass-half', cle: 'parcours_fab_statut_attente' },
    [ETATS.encours]: { icone: 'fa-spinner', cle: 'parcours_fab_statut_encours' },
    [ETATS.faite]: { icone: 'fa-check', cle: 'parcours_fab_statut_faite' },
    [ETATS.echouee]: { icone: 'fa-triangle-exclamation', cle: 'parcours_fab_statut_echouee' },
    [ETATS.annulee]: { icone: 'fa-ban', cle: 'parcours_fab_statut_annulee' },
};

/* ------------------------------------------------------------------ *
 *  Écran
 * ------------------------------------------------------------------ */

/**
 * Construit l'écran de fabrication.
 *
 * @param {Object} draft - Le brouillon, `draft.plan` validé.
 * @param {Object} api   - { rafraichirAction, fermer, appelModele? }
 * @returns {{node: HTMLElement, file: Object}}
 */
export function construireFabrication(draft, api) {
    const page = el('div', 'pc-page');
    const plan = draft.plan;

    const hero = el('div', 'pc-hero');
    hero.append(
        el('h2', 'pc-hero__titre', plan.titre || t('parcours_titre')),
        el('p', 'pc-hero__sous', t('parcours_fab_intro')),
    );

    // --- Barre d'avancement globale.
    const avancement = el('div', 'pc-avancement');
    const jauge = el('div', 'pc-avancement__piste');
    const remplissage = el('div', 'pc-avancement__part');
    jauge.append(remplissage);
    jauge.setAttribute('role', 'progressbar');
    jauge.setAttribute('aria-label', t('parcours_step_fabrication'));
    jauge.setAttribute('aria-valuemin', '0');
    const compte = el('p', 'pc-avancement__texte');
    compte.setAttribute('role', 'status');
    avancement.append(jauge, compte);

    // --- Les lignes, groupées par étape.
    const liste = el('div', 'pc-block');
    /** @type {Map<string, {ligne:HTMLElement, statut:HTMLElement, actions:HTMLElement}>} */
    const noeuds = new Map();

    for (const etape of (plan.etapes || [])) {
        if (!etape.cartes || !etape.cartes.length) continue;
        const bloc = el('section', 'pc-etape pc-etape--fab');
        const head = el('header', 'pc-etape__head');
        head.append(el('h3', 'pc-etape__nom', etape.titre || t('parcours_step_plan')));
        bloc.append(head);

        const cartes = el('div', 'pc-cartes');
        for (const carte of etape.cartes) {
            cartes.append(construireLigne(carte));
        }
        bloc.append(cartes);
        liste.append(bloc);
    }

    function construireLigne(carte) {
        const ligne = el('article', 'pc-carte pc-carte--fab');
        ligne.dataset.carte = carte.id;

        const vignette = el('div', 'pc-carte__icone');
        const src = imageModule(carte.module);
        if (src) {
            const img = document.createElement('img');
            img.src = src; img.alt = ''; img.width = 34; img.height = 34; img.loading = 'lazy';
            vignette.append(img);
        } else {
            // Un module de parcours (forum, sondage, étiquette) n'a pas de
            // vignette : il porte son icône. Le puzzle reste le dernier recours.
            vignette.append(icone(iconeModule(carte.module) || 'fa-puzzle-piece'));
        }

        const corps = el('div', 'pc-carte__corps');
        corps.append(
            // Le titre du plan, sinon celui que le modèle a donné, sinon le type :
            // une carte fabriquée porte son vrai titre, pas le nom de son module.
            el('p', 'pc-carte__nom', titreActivite(carte)),
            el('p', 'pc-carte__meta', nomModule(carte.module)),
        );

        const statut = el('div', 'pc-statut');
        const actions = el('div', 'pc-carte__actions');

        ligne.append(vignette, corps, statut, actions);
        const source = construireSaisieSource(carte, plan, () => file.actualiser(carte.id));
        if (source) ligne.append(source.node);
        noeuds.set(carte.id, { ligne, statut, actions, carte, source });
        return ligne;
    }

    /* -------------------------------------------------------------- *
     *  La file
     * -------------------------------------------------------------- */

    // `appelModele` n'est fourni que par les bancs d'essai : une doublure du
    // modèle de langue, pour éprouver l'écran sans réseau ni quota.
    const file = creerFile(draft, { surChangement: peindre, appelModele: api.appelModele || null });

    function peindre(snap) {
        // Avancement global.
        const pct = snap.total ? Math.round((snap.faites / snap.total) * 100) : 0;
        remplissage.style.width = `${pct}%`;
        jauge.setAttribute('aria-valuenow', String(snap.faites));
        jauge.setAttribute('aria-valuemax', String(snap.total));
        compte.textContent = tr('parcours_fab_progression', { n: snap.faites, total: snap.total });

        for (const l of snap.lignes) {
            const n = noeuds.get(l.id);
            if (!n) continue;
            const signe = SIGNES[l.statut] || SIGNES[ETATS.attente];

            n.source?.actualiser(snap.enMarche);
            n.ligne.className = `pc-carte pc-carte--fab pc-carte--${l.statut}`;
            n.statut.replaceChildren();
            const devientPrete = n.statutPrecedent !== undefined
                && n.statutPrecedent !== l.statut && l.statut === ETATS.faite;
            n.statutPrecedent = l.statut;
            n.statut.append(marqueurStatut(l.statut, devientPrete), el('span', null, t(signe.cle)));

            n.ligne.querySelector('.pc-carte__nom').textContent = titreActivite(n.carte);
            n.actions.replaceChildren();
            const editer = action('parcours_fab_editer', 'fa-pen-to-square',
                () => ouvrirActivite(draft, n.carte, { mode: 'edition', apresEnregistrement: () => file.actualiser(l.id) }));
            editer.dataset.action = 'editer';
            n.actions.append(editer);
            if (n.carte.contenu) {
                const apercuAction = action('parcours_lecture_apercu', 'fa-eye',
                    () => ouvrirActivite(draft, n.carte, { apresEnregistrement: () => file.actualiser(l.id) }));
                apercuAction.dataset.action = 'apercu';
                n.actions.append(apercuAction);
            }
            // Une seule entrée IA par ligne. La fenêtre qui s'ouvre permet soit
            // de lancer directement, soit de personnaliser les instructions :
            // afficher ces deux chemins comme deux boutons ici serait un doublon.
            // Sur un contenu prêt, l'icône de rotation suffit à dire « on refait » :
            // même libellé et même icône que la confirmation qui suit.
            if (!n.carte.verrouillee) {
                const externe = action(n.carte.contenu ? 'parcours_fab_refaire' : 'parcours_fab_generer_ia',
                    n.carte.contenu ? 'fa-arrows-rotate' : 'fa-wand-magic-sparkles', async () => {
                        const { ouvrirActiviteExterne } = await import('./external-ai.js');
                        ouvrirActiviteExterne(draft, n.carte, () => file.actualiser(l.id), {
                            genererEnUnClic: async modele => {
                                if (n.carte.contenu && !await confirmerRegeneration(page)) return;
                                await file.refaire(l.id, modele);
                            },
                        });
                    });
                externe.dataset.action = 'external'; n.actions.append(externe);
            }
            // Pendant une génération, les boutons ne doivent pas sembler actifs
            // alors que refaire() refuse la demande ou qu’un contenu va changer.
            n.actions.querySelectorAll('button').forEach(b => { b.disabled = snap.enMarche; });

            // Le motif de l'échec est écrit sur la ligne, pas relégué à la console.
            const ancienne = n.ligne.querySelector('.pc-carte__alerte');
            if (ancienne) ancienne.remove();
            if (l.erreurKey) {
                const alerte = el('p', 'pc-carte__alerte');
                alerte.append(icone('fa-circle-info'), document.createTextNode(t(l.erreurKey)));
                n.ligne.querySelector('.pc-carte__corps').append(alerte);
            }
        }

        const sortie = page.querySelector('.pc-fab-livrer');
        if (sortie) sortie.hidden = snap.enMarche || !snap.faites || !(snap.restantes || snap.echecs || snap.reservees || snap.sourcesManquantes);
        api.rafraichirAction();
    }

    const livrer = action('parcours_cta_livrer', 'fa-arrow-right', () => api.allerA(3));
    livrer.classList.add('pc-fab-livrer');
    const apercu = el('div', 'pc-overview');
    apercu.append(hero, avancement);
    page.append(apercu, liste, livrer);
    peindre(file.etat());
    return { node: page, file };
}

/**
 * Le parcours est-il livrable ?
 * Il suffit d'UNE activité prête : mieux vaut livrer un parcours amputé, en le
 * disant, que de retenir tout le travail à cause d'une carte qui résiste.
 *
 * @param {Object} draft
 * @returns {{pret:boolean, raisonKey:string|null}}
 */
export function validerFabrication(draft) {
    const plan = draft && draft.plan;
    if (!plan) return { pret: false, raisonKey: 'parcours_plan_vide' };
    const faites = cartesAPlat(plan).filter(({ carte }) => carte.contenu).length;
    if (!faites) return { pret: false, raisonKey: 'parcours_fab_avant_depart' };
    return { pret: true, raisonKey: null };
}
