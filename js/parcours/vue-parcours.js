/**
 * @file Parcours — la vue du parcours : le cours tel que l'élève le parcourra.
 *
 * Retour d'Emmanuel du 14 sept. 2026 : relire un parcours activité par
 * activité donnait l'impression d'un enchaînement de H5P. Or ce qui construit
 * le parcours, ce sont aussi ses phrases (l'accueil, l'introduction de chaque
 * étape), ses textes de liaison, son forum, son sondage. Cette vue les montre
 * dans l'ordre du cours, comme la page d'Éléa : une section par étape, son
 * texte, puis ses activités, chacune avec son type écrit en clair.
 *
 * Deux usages, un seul rendu :
 *   • `construireVueParcours()` — le sommaire, dans le panneau de relecture de
 *     l'atelier ;
 *   • `monterVueParcours()` — le sommaire ET chaque activité, aperçu et
 *     édition, dans la modale d'aperçu de la zone de notifications (D65).
 *
 * Le DOM est construit par assemblage de nœuds ; les textes de l'enseignant
 * passent par le nettoyeur de Caramel avant d'être rendus en HTML.
 *
 * @module parcours/vue-parcours
 */
import { t } from './vocabulaire.js';
import { formatTextToHtml } from '../core/utils.js';
import { cartesAPlat } from './parcours-runner.js';
import { nomModule, imageModule, iconeModule } from './activity-router.js';
import { estModuleParcours, MODULES_PARCOURS } from './modules-parcours.js';
import { construireFiche } from './fiche-sequence.js';
import { formaterDuree } from './duree.js';
import { el, icone, tr, action } from './dom.js';
import { titreActivite, rendreApercu, rendreEdition, attendreEditeur, prechargerBibliotheques } from './rendu-activite.js';
import { recueillirMedias } from './sources.js';
import { confirmerAbandon } from './confirm-abandon.js';
import { aiguillagesDuPlan, nombreQuestions, bornesEnReponses, plagesEnReponses } from './aiguillage.js';
import { ouvrirVueEleve, textePlage } from './vue-eleve.js';

/** Un texte de l'enseignant, en HTML nettoyé. */
async function prose(texte, classe = 'pc-vue__prose') {
    const bloc = el('div', classe);
    const { sanitizeSync } = await import('../export/sanitizer.js');
    bloc.innerHTML = sanitizeSync(formatTextToHtml(String(texte || '')), 'EDUCATIONAL');
    return bloc;
}

/** La vignette d'une activité : l'image de la tuile, ou l'icône d'un module de parcours. */
function vignette(module) {
    const bloc = el('span', 'pc-vue__vignette');
    const src = imageModule(module);
    if (src) {
        const img = el('img');
        img.src = src; img.alt = ''; img.width = 32; img.height = 32; img.loading = 'lazy';
        bloc.append(img);
    } else {
        bloc.classList.add('pc-vue__vignette--icone');
        bloc.append(icone(iconeModule(module) || 'fa-puzzle-piece'));
    }
    return bloc;
}

/**
 * Le sommaire du parcours, dans l'ordre du cours.
 *
 * @param {Object} plan
 * @param {Object} o
 * @param {string} [o.platform]
 * @param {Function} o.onOuvrir - `(carte) => void`, au clic sur une activité.
 * @returns {Promise<HTMLElement>}
 */
export async function construireVueParcours(plan, { platform, onOuvrir }) {
    const page = el('div', 'pc-vue');
    const tete = el('header', 'pc-vue__tete');
    tete.append(el('h3', 'pc-vue__titre', String(plan.titre || '').trim() || t('parcours_fiche_sans_titre')));
    if (plan.objectifGeneral) tete.append(el('p', 'pc-vue__objectif', plan.objectifGeneral));
    const meta = el('ul', 'pc-vue__meta');
    for (const m of construireFiche(plan, { platformId: platform }).meta) meta.append(el('li', null, m));
    tete.append(meta);
    // Ce que VERRA l'élève, chemin compris (D99) : la même fenêtre que depuis le plan.
    tete.append(action('parcours_aig_voir_eleve', 'fa-eye', () => ouvrirVueEleve(plan, { platform }), 'pc-secondaire pc-vue__eleve', platform));
    page.append(tete);
    const groupes = aiguillagesDuPlan(plan);

    // Section 0 : l'accueil du cours, et la Carte de progression si elle est posée.
    const carteActive = Boolean(plan.carte?.actif) && platform === 'elea';
    if (String(plan.introduction || '').trim() || carteActive) {
        const accueil = el('section', 'pc-vue__section pc-vue__section--accueil');
        const h = el('h4', 'pc-vue__section-titre');
        h.append(icone('fa-house'), document.createTextNode(t('parcours_plan_intro_parcours')));
        accueil.append(h);
        if (String(plan.introduction || '').trim()) accueil.append(await prose(plan.introduction));
        if (carteActive) {
            const ligne = el('div', 'pc-vue__activite pc-vue__activite--fixe');
            const v = el('span', 'pc-vue__vignette pc-vue__vignette--icone');
            v.append(icone('fa-map-location-dot'));
            const corps = el('span', 'pc-vue__corps');
            corps.append(el('span', 'pc-vue__nom', t('parcours_fiche_meta_carte')));
            ligne.append(v, corps);
            accueil.append(ligne);
        }
        page.append(accueil);
    }

    // Comme sur l'écran du plan, seules les étapes communes sont numérotées : un
    // chemin se nomme par son rôle et dit à qui il s'ouvre (D90, D99).
    let numero = 0;
    for (const [i, etape] of (plan.etapes || []).entries()) {
        const section = el('section', 'pc-vue__section');
        const h = el('h4', 'pc-vue__section-titre');
        const g = groupes.find(x => i >= x.debut && i <= x.fin);
        if (!g) numero += 1;
        if (!g) h.append(el('span', 'pc-vue__numero', String(numero)));
        h.append(document.createTextNode(String(etape.titre || '').trim()
            || (g ? t(`parcours_role_${g.chemins[i - g.debut].role}`) : tr('parcours_fiche_etape', { n: numero }))));
        if (g) {
            const j = i - g.debut;
            const n = g.test ? nombreQuestions(g.test, g.chemins.length) : 10;
            const plage = plagesEnReponses(bornesEnReponses(g.chemins.slice(1).map(c => c.depuis), n), n)[j];
            section.classList.add('pc-vue__section--chemin');
            h.append(el('span', `pc-role pc-role--${g.chemins[j].role}`, t(`parcours_role_${g.chemins[j].role}`)),
                el('span', 'pc-vue__plage', textePlage(plage, n)));
        }
        section.append(h);
        if (etape.objectif) section.append(el('p', 'pc-vue__objectif-etape', etape.objectif));
        if (String(etape.introduction || '').trim()) section.append(await prose(etape.introduction));

        const liste = el('ul', 'pc-vue__activites');
        for (const carte of etape.cartes || []) {
            const li = el('li');
            // Un « Texte de liaison » est du texte posé dans la page : il se lit
            // en place, comme dans le cours, et reste modifiable d'un clic.
            const texteDeLiaison = estModuleParcours(carte.module)
                && MODULES_PARCOURS[carte.module].moduleName === 'label' && carte.contenu?.intro;
            const bouton = el('button', 'pc-vue__activite');
            bouton.type = 'button';
            bouton.dataset.carte = carte.id;
            bouton.disabled = !carte.contenu;
            const corps = el('span', 'pc-vue__corps');
            corps.append(el('span', 'pc-vue__nom', titreActivite(carte)));
            const infos = el('span', 'pc-vue__infos');
            infos.append(el('span', 'pc-vue__type', nomModule(carte.module)));
            if (carte.duree) infos.append(el('span', null, formaterDuree(carte.duree)));
            corps.append(infos);
            bouton.append(vignette(carte.module), corps);
            if (!carte.contenu) bouton.append(el('span', 'pc-vue__statut', t('parcours_vue_non_generee')));
            else bouton.append(icone('fa-chevron-right'));
            bouton.setAttribute('aria-label', `${nomModule(carte.module)} : ${titreActivite(carte)}`);
            bouton.addEventListener('click', () => onOuvrir(carte));
            li.append(bouton);
            if (texteDeLiaison) li.append(await prose(carte.contenu.intro, 'pc-vue__prose pc-vue__prose--liaison'));
            liste.append(li);
        }
        section.append(liste);
        page.append(section);
    }
    // La fin du parcours, telle que l'élève la lira (D96).
    const fin = el('section', 'pc-vue__section pc-vue__section--fin');
    const hFin = el('h4', 'pc-vue__section-titre');
    hFin.append(icone('fa-flag-checkered'), document.createTextNode(t('parcours_fin_titre')));
    fin.append(hFin, el('p', 'pc-vue__objectif-etape', t('parcours_fin_bravo')));
    if (String(plan.conclusion || '').trim()) fin.append(await prose(plan.conclusion));
    page.append(fin);
    return page;
}

/**
 * Le parcours dans la modale d'aperçu d'une notification : le sommaire, puis
 * chaque activité en aperçu ou en édition, sans quitter la modale.
 *
 * @param {HTMLElement} conteneur - `.preview-modal__preview`
 * @param {Object} notification - Porte `parcours: { plan, platform, ... }`.
 * Harmonisé avec la modale d'une activité seule (retour du 15 sept. 2026) :
 *  - les seules flèches de l'en-tête restent celles qui passent d'une
 *    notification à l'autre ; l'activité précédente et la suivante se prennent
 *    au bas de l'activité, nommées, comme la navigation d'activités d'Éléa ;
 *  - en édition, l'éditeur occupe toute la zone et Annuler / Enregistrer sont
 *    dans le pied de la modale (`enregistrerEdition`, `annulerEdition`) ;
 *  - l'attente est le rond de chargement de Caramel.
 *
 * @param {Object} o
 * @param {Function} o.surEdition - `(etat) => void` : `{ editable, enEdition, module, aide }`,
 *   pour que la modale montre son bouton « Éditer » ou son pied d'édition.
 * @param {Function} o.surModification - `(plan) => Promise<void>` : régénère le fichier.
 * @returns {{basculerEdition:Function, enregistrerEdition:Function, annulerEdition:Function,
 *   fermetureAutorisee:Function, detruire:Function}}
 */
export function monterVueParcours(conteneur, notification, { surEdition = () => {}, surModification = async () => {} } = {}) {
    const { plan, platform } = notification.parcours;
    let courante = null;
    let mode = 'sommaire';
    let tour = 0;
    let poignee = { annuler: () => {}, detruire: () => {}, estModifie: () => false };
    let detruit = false;

    const racine = el('div', 'pc-vue-apercu');
    const barre = el('div', 'pc-vue-apercu__barre');
    const retour = action('parcours_vue_titre', 'fa-list-ul', () => aller(null, 'sommaire'), 'pc-secondaire pc-vue-apercu__retour');
    const lieu = el('span', 'pc-vue-apercu__lieu');
    barre.append(retour, lieu);
    const annonce = el('p', 'pc-lecture__annonce');
    annonce.setAttribute('role', 'status');
    const hote = el('div', 'pc-vue-apercu__hote');
    const suite = el('nav', 'pc-vue-apercu__suite');
    const precedent = voisine('pc-vue-apercu__precedente', 'fa-arrow-left', () => changer(-1));
    const suivant = voisine('pc-vue-apercu__suivante', 'fa-arrow-right', () => changer(1));
    const position = el('span', 'pc-lecture__position');
    suite.append(precedent, position, suivant);
    racine.append(barre, annonce, hote, suite);
    conteneur.replaceChildren(racine);

    /** Un lien vers l'activité voisine : sa flèche et son titre. */
    function voisine(classe, image, clic) {
        const bouton = el('button', `pc-secondaire ${classe}`);
        bouton.type = 'button';
        const titre = el('span', 'pc-vue-apercu__voisine');
        if (image === 'fa-arrow-left') bouton.append(icone(image), titre);
        else bouton.append(titre, icone(image));
        bouton.addEventListener('click', clic);
        return bouton;
    }

    /** Le rond de chargement de la modale, avec son texte. */
    function attente(cle) {
        const bloc = el('div', 'json-editor__loading pc-vue-apercu__attente');
        bloc.append(el('div', 'json-editor__loading-spinner'), el('span', null, t(cle)));
        return bloc;
    }

    const lues = () => cartesAPlat(plan).filter(({ carte }) => carte.contenu);

    async function abandonAutorise() {
        if (!poignee.estModifie()) return true;
        return confirmerAbandon(conteneur.closest('.preview-modal') || racine);
    }

    function nettoyer() {
        poignee.annuler?.();
        poignee.detruire?.();
        poignee = { annuler: () => {}, detruire: () => {}, estModifie: () => false };
    }

    async function changer(delta) {
        const liste = lues().map(x => x.carte);
        const i = liste.indexOf(courante);
        const prochaine = courante === null ? (delta > 0 ? liste[0] : null) : liste[i + delta];
        if (prochaine === undefined) return;
        await aller(prochaine, prochaine ? 'apercu' : 'sommaire');
    }

    async function aller(carte, prochainMode, { force = false } = {}) {
        if (detruit) return;
        if (!force && !await abandonAutorise()) return;
        const monTour = ++tour;
        const valide = () => !detruit && tour === monTour;
        await attendreEditeur();
        if (!valide()) return;
        nettoyer();
        courante = carte;
        mode = prochainMode;
        racine.classList.toggle('pc-vue-apercu--edition', mode === 'edition');
        annonce.textContent = '';

        const liste = lues();
        const index = liste.findIndex(x => x.carte === courante);
        const edition = mode === 'edition';
        racine.classList.toggle('pc-vue-apercu--edition', edition);
        barre.hidden = courante === null || edition;
        suite.hidden = courante === null || edition;
        lieu.textContent = '';
        if (courante) {
            const etape = liste[index].etape;
            const n = (plan.etapes || []).indexOf(etape) + 1;
            lieu.append(el('span', 'pc-vue-apercu__etape', String(etape.titre || '').trim()
                ? tr('parcours_fiche_etape_titree', { n, t: etape.titre }) : tr('parcours_fiche_etape', { n })),
                el('span', 'pc-vue-apercu__activite', `${nomModule(courante.module)} · ${titreActivite(courante)}`));
            position.textContent = `${index + 1} / ${liste.length}`;
            for (const [bouton, cle, carteVoisine] of [
                [precedent, 'parcours_lecture_precedente', liste[index - 1]?.carte],
                [suivant, 'parcours_lecture_suivante', liste[index + 1]?.carte],
            ]) {
                // L'emplacement reste réservé : le numéro ne bouge pas d'une activité à l'autre.
                bouton.style.visibility = carteVoisine ? '' : 'hidden';
                bouton.disabled = !carteVoisine;
                bouton.querySelector('.pc-vue-apercu__voisine').textContent = carteVoisine ? titreActivite(carteVoisine) : '';
                bouton.setAttribute('aria-label', carteVoisine ? `${t(cle)} : ${titreActivite(carteVoisine)}` : t(cle));
                bouton.title = bouton.getAttribute('aria-label');
            }
        }
        surEdition({
            editable: Boolean(courante),
            enEdition: edition,
            module: courante?.module,
            // L'aide de l'éditeur visuel ; les modules de parcours n'en ont pas.
            aide: Boolean(courante) && !estModuleParcours(courante.module),
        });
        hote.replaceChildren(attente(edition ? 'editor_loading' : 'loading'));
        hote.scrollTop = 0;
        try {
            if (mode === 'sommaire') {
                const vue = await construireVueParcours(plan, { platform, onOuvrir: c => aller(c, 'apercu') });
                if (!valide()) return;
                hote.replaceChildren(vue);
            } else if (mode === 'edition') {
                const edition = await rendreEdition(hote, courante, {
                    valide,
                    dansLaModale: true,
                    onSave: donnees => enregistrer(courante, donnees),
                    onRequestCancel: () => aller(courante, 'apercu'),
                });
                // Un affichage dépassé ne remplace jamais la poignée du suivant :
                // celui-ci ne pourrait plus être annulé ni nettoyé.
                if (valide()) poignee = { annuler: () => {}, ...edition };
            } else {
                const lecture = await rendreApercu(hote, courante, {
                    valide, avantLecteur: p => { poignee = { ...poignee, annuler: p.annuler }; },
                });
                if (valide()) poignee = { detruire: () => {}, estModifie: () => false, ...lecture };
            }
        } catch (e) {
            if (!valide()) return;
            hote.replaceChildren(el('p', 'pc-editeur__erreur', t('parcours_lecture_echec')));
            console.error('[parcours] vue du parcours :', e);
        }
    }

    async function enregistrer(cible, donnees) {
        const monTour = tour;
        try {
            Object.assign(cible, await recueillirMedias(cible, donnees, plan));
        } catch (e) {
            annonce.textContent = t(e.message === 'parcours_source_limite' ? e.message : 'editor_image_error_processing');
            return;
        }
        if (typeof donnees.title === 'string') cible.titre = donnees.title;
        poignee.estModifie = () => false;
        try {
            // Le fichier de la notification suit la retouche : le MBZ téléchargé
            // ensuite, et le dépôt vers Sucrerie, contiennent la nouvelle version.
            await surModification(plan);
        } catch (e) {
            console.error('[parcours] régénération du parcours :', e);
            annonce.textContent = t('parcours_liv_echec');
            return;
        }
        if (detruit || monTour !== tour) return;
        await aller(cible, 'apercu', { force: true });
        annonce.textContent = t('parcours_contenu_enregistre');
    }

    // Pendant la lecture du sommaire, les bibliothèques des activités prêtes se
    // préchargent : ouvrir l'une d'elles ne les attend plus.
    aller(null, 'sommaire', { force: true })
        .then(() => { if (!detruit) prechargerBibliotheques(lues().map(x => x.carte.module)); });

    return {
        basculerEdition: () => { if (courante) aller(courante, mode === 'edition' ? 'apercu' : 'edition'); },
        enregistrerEdition: async () => { if (mode === 'edition') await poignee.enregistrer?.(); },
        annulerEdition: () => (mode === 'edition' && courante ? aller(courante, 'apercu') : undefined),
        fermetureAutorisee: abandonAutorise,
        detruire: () => { detruit = true; tour++; nettoyer(); },
    };
}
