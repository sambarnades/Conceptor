/**
 * @file Parcours — écran 2 : le plan.
 *
 * L'écran décisif. Le modèle a proposé un déroulé ; l'enseignant le lit, le
 * corrige, puis décide. RIEN n'est encore généré : c'est ce qui rend le module
 * honnête, et ce qui évite de dépenser huit générations sur un scénario faux.
 *
 * Réordonnancement par boutons plutôt que par glisser-déposer : au doigt comme
 * au clavier, une flèche est plus sûre qu'un glissé, et c'est accessible sans
 * effort. Le glisser-déposer pourra s'ajouter par-dessus, jamais à la place.
 *
 * @module parcours/screen-plan
 */

import { construireSaisieSource } from './source-input.js';
import { typeSource, sourceManquante, purgerMedias } from './sources.js';
import { t } from './vocabulaire.js';
import { dureeTotale, formaterDuree, expliquerEstimation } from './duree.js';
// Réexportés : l'écran de livraison et les bancs les prennent ici.
export { dureeTotale, formaterDuree };
import { nomModule, imageModule, iconeModule, modulesDisponibles, resoudreModule, moduleDeTrame } from './activity-router.js';
import { majBrouillon } from './state.js';
import { palierEtape, trameParId, TRAMES } from './templates.js';
import { normaliserPalier } from './calibrage.js';
import { relirePlan, nbAttentions, ciblesSignalees } from './garde-fous.js';
import { carteDisponible, carteParDefaut, normaliserCarte } from './carte-progression.js';
import { CARTES_STANDARD, vignetteCarte, libelleCarte } from './cartes-standard.js';
import { progressionParDefaut, normaliserProgression } from './progression.js';
import { analyserPlan } from './types-apprentissage.js';
import { ouvrirActivite } from './activity-panel.js';
import { action } from './dom.js';
import { boutonChoixModule } from './choix-module.js';
import { construireFondPersonnel } from './carte-image-input.js';
import {
    normaliserAiguillages, ouvrirChemins, problemesAiguillage, CHEMINS_DEFAUT, MODULE_AIGUILLEUR_DEFAUT,
    aiguillagesDuPlan, estChemin, changerNombreDeChemins, fermerChemins, peutAiguiller, bornesEnReponses,
    plagesEnReponses, pourcentageDeBorne, nombreQuestions, dureeParEleve, activitesParEleve, aDesChemins,
    aiguillageDuTest, CHEMINS_MAX, CHEMINS_MIN,
} from './aiguillage.js';
import { moduleSAcheve } from './modules-parcours.js';
import { ouvrirVueEleve, textePlage } from './vue-eleve.js';

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

/** Bouton d'action discret d'une carte. */
function bouton(iconeNom, labelKey, onClick, { danger = false } = {}) {
    const b = el('button', 'pc-icon-btn' + (danger ? ' pc-icon-btn--danger' : ''));
    b.type = 'button';
    b.title = t(labelKey);
    b.setAttribute('aria-label', t(labelKey));
    b.append(icone(iconeNom));
    b.addEventListener('click', onClick);
    return b;
}

/* ------------------------------------------------------------------ *
 *  Normalisation du plan renvoyé par le modèle
 * ------------------------------------------------------------------ */

const PALIERS = ['decouverte', 'entrainement', 'transfert'];

/**
 * Met le plan brut en forme et rattrape ce que le modèle a mal fait.
 *
 * Un plan qui arrive avec un identifiant de module inventé, une durée en
 * toutes lettres ou un palier fantaisiste ne doit PAS faire échouer l'écran :
 * on répare, et on marque ce qu'on a réparé pour que l'enseignant le voie.
 *
 * @param {Object} brut - Le JSON renvoyé par le modèle.
 * @param {string} platformId
 * @returns {Object} Plan normalisé.
 */
/**
 * Les pictogrammes des chiffres clés (étapes, activités, durée) : trois tracés
 * simples, dessinés ici plutôt qu'empruntés, en couleur héritée. Demande
 * d'Emmanuel (28 sept. 2026) : le chiffre seul, sans repère, se lisait mal.
 */
const PICTOS = {
    etapes: [['path', { d: 'M9 6h11M9 12h11M9 18h11' }], ['circle', { cx: 4.5, cy: 6, r: 1.2 }], ['circle', { cx: 4.5, cy: 12, r: 1.2 }], ['circle', { cx: 4.5, cy: 18, r: 1.2 }]],
    activites: [[3.5, 3.5], [13.5, 3.5], [3.5, 13.5], [13.5, 13.5]].map(([x, y]) => ['rect', { x, y, width: 7, height: 7, rx: 1.6 }]),
    duree: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7.5V12l3 2' }]],
    // Un tronc qui se sépare en trois : les chemins (D90).
    chemins: [['path', { d: 'M12 21v-7.5M12 13.5 5.5 6.5M12 13.5l6.5-7M12 13.5V4.5' }], ['circle', { cx: 5, cy: 5.5, r: 1.6 }], ['circle', { cx: 12, cy: 3.6, r: 1.6 }], ['circle', { cx: 19, cy: 5.5, r: 1.6 }]],
};

function picto(nom) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', class: 'pc-summary__picto' })) svg.setAttribute(k, v);
    for (const [balise, attributs] of PICTOS[nom]) {
        const trait = document.createElementNS(NS, balise);
        for (const [k, v] of Object.entries(attributs)) trait.setAttribute(k, String(v));
        svg.append(trait);
    }
    return svg;
}

/**
 * Une tuile de chiffre clé : le pictogramme à gauche, la valeur et son libellé
 * à droite. Partagée par le plan et la livraison, qui montrent les mêmes trois.
 * @param {'etapes'|'activites'|'duree'} nom
 * @param {string|number} valeur
 * @param {string|HTMLElement} libelle - Texte, ou élément déjà construit.
 * @returns {HTMLElement}
 */
export function tuileChiffre(nom, valeur, libelle) {
    const bloc = el('div', 'pc-summary__item pc-summary__item--kpi');
    const texte = el('span', 'pc-summary__texte');
    texte.append(el('span', 'pc-summary__val', String(valeur)),
        typeof libelle === 'string' ? el('span', 'pc-summary__lab', libelle) : libelle);
    bloc.append(picto(nom), texte);
    return bloc;
}

/**
 * Les trois repères du bandeau, les MÊMES sur l'écran du plan et à la livraison.
 *
 * Avec des chemins, ce qui compte est ce que fait UN élève : son nombre
 * d'activités et sa durée ; ce que Caramel fabrique vient en second (D90).
 * Additionner tous les chemins annoncerait une durée qu'aucun élève ne vit.
 *
 * @param {Object} plan
 * @returns {HTMLElement[]}
 */
export function tuilesSynthese(plan) {
    const groupes = aiguillagesDuPlan(plan);
    if (groupes.length) {
        const a = activitesParEleve(plan);
        const d = dureeParEleve(plan);
        return [
            tuileChiffre('chemins', groupes.reduce((s, g) => s + g.chemins.length, 0), t('parcours_plan_n_chemins')),
            tuileChiffre('activites', a.min === a.max ? a.max : `${a.min}–${a.max}`,
                tr('parcours_plan_par_eleve', { f: nbCartes(plan) })),
            tuileChiffre('duree', d.min === d.max ? formaterDuree(d.max) : `${formaterDuree(d.min)}–${formaterDuree(d.max)}`,
                t('parcours_plan_duree_eleve')),
        ];
    }
    return [
        tuileChiffre('etapes', plan.etapes.length, t('parcours_plan_n_etapes')),
        tuileChiffre('activites', nbCartes(plan), t('parcours_plan_n_activites')),
        tuileDuree(plan),
    ];
}

/**
 * La tuile « durée totale » du bandeau de synthèse, avec son infobulle : la
 * durée est une ESTIMATION, et l'enseignant doit savoir d'où elle vient sans
 * chercher. Partagée avec l'écran de livraison, pour que les deux disent
 * exactement la même chose au même endroit.
 * @param {Object} plan
 * @returns {HTMLElement}
 */
export function tuileDuree(plan) {
    const lab = el('span', 'pc-summary__lab', t('parcours_plan_duree_totale'));
    const info = el('span', 'pc-info');
    info.setAttribute('role', 'img');
    info.tabIndex = 0;
    info.title = expliquerEstimation();
    info.setAttribute('aria-label', expliquerEstimation());
    info.append(icone('fa-circle-info'));
    lab.append(document.createTextNode(' '), info);
    return tuileChiffre('duree', formaterDuree(dureeTotale(plan)), lab);
}

/**
 * Un texte du plan, propre : sans blancs autour, et une MAJUSCULE en tête.
 *
 * Le modèle rend volontiers des objectifs en minuscule (« identifier les
 * dates… »), à la manière d'une liste ; à l'écran ils sont des phrases, et
 * une phrase commence par une majuscule (retour d'Emmanuel, 6 sept. 2026).
 * `toLocaleUpperCase` respecte les alphabets à casse et laisse les autres
 * intacts — un objectif en chinois ou en arabe ressort tel quel.
 */
function phrase(valeur) {
    const s = String(valeur || '').trim();
    return s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : '';
}

export function normaliserPlan(brut, platformId) {
    const plan = {
        titre: phrase(brut && brut.titre),
        objectifGeneral: phrase(brut && brut.objectifGeneral),
        // Les textes que l'élève lit dans le cours : l'accueil en tête, puis une
        // introduction au début de chaque étape (D64). Ils scénarisent le
        // parcours sans consommer de place dans le budget des activités.
        introduction: phrase(brut && brut.introduction),
        // Le mot de la fin, lu par l'élève dans la section « Fin du parcours » (D96).
        conclusion: phrase(brut && brut.conclusion),
        notionsPivots: Array.isArray(brut && brut.notionsPivots)
            ? brut.notionsPivots.map(n => String(n).trim()).filter(Boolean)
            : [],
        etapes: [],
        origine: 'ia',
        personnalise: false,
        // La Carte de progression n'est pas proposée par le modèle : c'est un
        // réglage du parcours, décidé sur l'écran du plan. On pose donc son
        // état par défaut, quoi que le modèle ait renvoyé.
        carte: normaliserCarte(brut && brut.carte),
        progression: normaliserProgression(brut && brut.progression),
    };

    const etapes = Array.isArray(brut && brut.etapes) ? brut.etapes : [];
    let compteur = 0;

    for (const e of etapes) {
        const etape = {
            id: `e${++compteur}`,
            titre: phrase(e && e.titre),
            objectif: phrase(e && e.objectif),
            introduction: phrase(e && e.introduction),
            cartes: [],
        };
        const cartes = Array.isArray(e && e.cartes) ? e.cartes : [];
        for (const c of cartes) {
            const palier = normaliserPalier(c && c.palier) || 'entrainement';
            const { cle, exact } = resoudreModule(c && c.module, platformId, palier);
            const duree = Number.parseInt(c && c.duree, 10);
            etape.cartes.push({
                id: `c${++compteur}`,
                titre: phrase(c && c.titre),
                objectif: phrase(c && c.objectif),
                consigne: phrase(c && c.consigne),
                module: cle,
                // `moduleReplie` signale un identifiant que le modèle a inventé :
                // la carte le montre, l'enseignant tranche. Le réparateur du plan
                // (D107) le pose aussi quand il a remplacé le module.
                moduleReplie: !exact || (c && c.moduleReplie === true),
                palier,
                duree: Number.isFinite(duree) && duree > 0 ? Math.min(duree, 180) : 10,
                verrouillee: false,
            });
        }
        // Le modèle marque un chemin par son rôle (`"chemin": "renforcer"`) :
        // le rôle se déduit de la position, les seuils se posent ci-dessous.
        if (e && e.chemin) etape.chemin = { depuis: Number(e.chemin && e.chemin.depuis) };
        plan.etapes.push(etape);
    }
    return normaliserAiguillages(plan);
}

/**
 * Fabrique le squelette d'un plan à partir d'une trame, SANS appel au modèle.
 *
 * C'est la voie « je sais déjà ce que je veux » : instantanée, gratuite, et
 * elle rend la main à l'enseignant sur la structure. Les titres d'activité
 * restent VIDES, avec leur invite : un titre pré-rempli du nom du type
 * (« Vrai/Faux ») disait « c'est déjà écrit » là où il fallait dire « à toi
 * d'écrire », bégayait avec le sélecteur de module juste en dessous, et — pire —
 * passait tel quel au modèle comme « titre attendu », puis s'imposait au contenu
 * généré. Vide, c'est le modèle qui titre, et l'enseignant qui corrige
 * (relecture UX du 6 sept. 2026).
 *
 * @param {string} trameId
 * @param {string} platformId
 * @returns {Object|null} Le plan, ou null si la trame n'a pas de structure.
 */
/**
 * Étapes d'une « Structure libre », par ampleur. La trame ne fixe rien : on
 * donne le nombre d'étapes que l'ampleur laisse attendre, et rien dedans.
 */
const ETAPES_LIBRE = { courte: 2, moyenne: 3, longue: 4 };

/**
 * Le squelette d'une trame, sans appel au modèle (D11).
 *
 * @param {string} trameId
 * @param {string} platformId
 * @param {string} [ampleur] - Choisit la variante de la trame. La « Structure
 *   libre » ouvre N étapes VIDES, à composer soi-même.
 *   Sans ce cas, « Partir du modèle » ne faisait rien du tout sur cette
 *   trame — un bouton muet (retour d'Emmanuel, 6 sept. 2026).
 * @returns {Object|null} `null` si la trame n'existe pas.
 */
export function planDepuisTrame(trameId, platformId, ampleur = 'moyenne', { structure = 'lineaire', chemins = CHEMINS_DEFAUT } = {}) {
    const trame = trameParId(trameId, ampleur, chemins);
    if (!trame) return null;

    if (!Array.isArray(trame.modules)) {
        const n = ETAPES_LIBRE[ampleur] || ETAPES_LIBRE.moyenne;
        const vides = Array.from({ length: n }, (_, i) => ({
            id: `e${i + 1}`, titre: '', objectif: '', introduction: '', cartes: [],
        }));
        const plan = {
            titre: '',
            objectifGeneral: '',
            introduction: '',
            conclusion: '',
            notionsPivots: [],
            etapes: vides,
            origine: trameId,
            personnalise: false,
            carte: carteParDefaut(),
            progression: progressionParDefaut(),
        };
        // Des chemins sans modèle : une étape avec le test qui aiguille, les
        // chemins à composer, une étape commune à la fin.
        if (structure === 'chemins') {
            const { cle } = resoudreModule(MODULE_AIGUILLEUR_DEFAUT, platformId, 'entrainement');
            plan.etapes = [
                { id: 'e1', titre: '', objectif: '', introduction: '', cartes: [{
                    id: 'c1', titre: '', objectif: '', consigne: '', module: cle, moduleReplie: false,
                    palier: 'entrainement', duree: 12, verrouillee: false,
                }] },
                { id: 'e2', titre: '', objectif: '', introduction: '', cartes: [] },
                { id: 'e3', titre: '', objectif: '', introduction: '', cartes: [] },
            ];
            ouvrirChemins(plan, 1, chemins, prefixe => `${prefixe}_${crypto.randomUUID()}`);
        }
        return plan;
    }

    let compteur = 0;
    const aig = trame.aiguillage;
    const etapes = trame.modules.map((modulesEtape, i) => ({
        id: `e${++compteur}`,
        titre: '',
        objectif: '',
        introduction: '',
        // Une étape d'une trame à chemins est l'un des chemins : le premier
        // part de 0, les suivants des seuils par défaut (D90).
        ...(aig && i >= aig.debut && i < aig.debut + aig.nombre
            ? { chemin: { depuis: i === aig.debut ? 0 : aig.seuils[i - aig.debut - 1] } } : {}),
        cartes: modulesEtape.map((propose, j) => {
            const { cle, exact } = resoudreModule(moduleDeTrame(propose, platformId), platformId, palierEtape(trame, i));
            return {
                id: `c${++compteur}`,
                titre: '',
                objectif: '',
                consigne: '',
                module: cle,
                // Une trame peut nommer un module absent de la plateforme visée
                // — un greffon Éléa sur Magistère, par exemple. Le routeur lui
                // substitue alors un repli, et la carte DOIT le dire : c'était
                // écrit `false` en dur ici, si bien que la voie « partir du
                // modèle » (D11) substituait en silence, là où la voie IA
                // marquait la carte. Deux chemins, deux comportements, pour la
                // même situation.
                moduleReplie: !exact,
                palier: palierEtape(trame, i),
                duree: trame.durees?.[i]?.[j] || 10,
                verrouillee: false,
            };
        }),
    }));

    return {
        titre: '',
        objectifGeneral: '',
        introduction: '',
        conclusion: '',
        notionsPivots: [],
        etapes,
        origine: trameId,
        personnalise: false,
        carte: carteParDefaut(),
        progression: progressionParDefaut(),
    };
}


/** Nombre d'activités du parcours. */
export function nbCartes(plan) {
    return (plan.etapes || []).reduce((n, e) => n + (e.cartes || []).length, 0);
}


/* ------------------------------------------------------------------ *
 *  Écran
 * ------------------------------------------------------------------ */

/**
 * Construit l'écran de plan.
 * @param {Object} draft - Brouillon, `draft.plan` déjà rempli.
 * @param {Object} api   - { rafraichirAction, fermer }
 * @returns {{node: HTMLElement}}
 */
export function construirePlan(draft, api) {
    const page = el('div', 'pc-page pc-page--plan');
    const plan = draft.plan;
    const modules = modulesDisponibles(draft.platform);

    // --- En-tête : titre du parcours, éditable sur place.
    const hero = el('div', 'pc-hero');
    const titre = el('textarea', 'pc-title-input');
    titre.rows = 1;
    titre.placeholder = t('parcours_plan_titre_aria');
    titre.value = plan.titre || '';
    titre.setAttribute('aria-label', t('parcours_plan_titre_aria'));
    titre.addEventListener('input', () => {
        plan.titre = titre.value;
        persister();
    });
    const origine = el('p', 'pc-origine');
    function majOrigine() {
        origine.replaceChildren();
        if (plan.personnalise) {
            origine.className = 'pc-origine pc-origine--perso';
            origine.append(icone('fa-pen'), document.createTextNode(t('parcours_plan_personnalise')));
            return;
        }
        origine.className = 'pc-origine';
        const trame = trameParId(plan.origine);
        origine.append(
            icone(trame ? 'fa-layer-group' : 'fa-wand-magic-sparkles'),
            document.createTextNode(trame
                ? tr('parcours_plan_origine_modele', { t: t(trame.nameKey) })
                : t('parcours_plan_origine_ia')),
        );
    }
    majOrigine();

    const entete = el('div', 'pc-plan__entete');
    entete.append(titre, origine);
    hero.append(entete);
    const objectifGeneral = el('textarea', 'pc-plan-objectif');
    objectifGeneral.rows = 1;
    objectifGeneral.value = plan.objectifGeneral || '';
    objectifGeneral.placeholder = t('parcours_objectif_general');
    objectifGeneral.setAttribute('aria-label', t('parcours_objectif_general'));
    objectifGeneral.addEventListener('input', () => { plan.objectifGeneral = objectifGeneral.value; persister(); });
    hero.append(objectifGeneral);
    const relire = action('parcours_lecture_parcours', 'fa-eye', () => ouvrirActivite(draft, null, {
        apresEnregistrement: () => { persister(); dessiner(); },
    }));
    relire.hidden = !plan.etapes.some(e => e.cartes.some(c => c.contenu));
    hero.append(relire);

    // Tous les textes du plan restent lisibles en entier, même sur téléphone.
    // L'observateur ne réagit qu'à la largeur : la hauteur ajustée ne boucle pas.
    function ajusterChamps() {
        for (const champ of page.querySelectorAll('textarea')) {
            if (!champ.isConnected || !champ.clientWidth) continue;
            champ.style.height = 'auto';
            const style = getComputedStyle(champ);
            const bordures = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
            champ.style.height = `${champ.scrollHeight + bordures}px`;
        }
    }
    let largeur = 0;
    const observation = new ResizeObserver(([entree]) => {
        if (entree.contentRect.width === largeur) return;
        largeur = entree.contentRect.width;
        ajusterChamps();
    });
    observation.observe(page);
    page.addEventListener('input', ajusterChamps);
    // Un champ replié n'a pas de largeur mesurable. `toggle` ne bouillonne pas.
    page.addEventListener('toggle', ajusterChamps, true);
    const nettoyages = [];

    // --- Bandeau de synthèse : ce que le parcours pèse, en direct.
    const synthese = el('div', 'pc-summary');
    const majSynthese = () => synthese.replaceChildren(...tuilesSynthese(plan));

    // --- Relecture didactique : six repères passés sur le plan (§ 5 du PRD).
    //
    // Elle AFFICHE, elle ne bloque jamais — `validerPlan()` n'en tient aucun
    // compte, et c'est délibéré : l'enseignant connaît sa classe, sa progression
    // et le temps qu'il lui reste, trois choses que ce code ignore. Le bloc se
    // redessine à chaque retouche du plan, pour que la correction se voie tout
    // de suite : c'est ce qui en fait une relecture, et non un rapport.
    const blocRelecture = el('div', 'pc-relecture');
    let constats = [];
    let cibles = { etapes: new Set(), cartes: new Set() };
    let toutVoir = false;

    function majRelecture() {
        constats = relirePlan(plan);
        cibles = ciblesSignalees(constats);
        const n = nbAttentions(constats);
        blocRelecture.replaceChildren();
        blocRelecture.classList.toggle('pc-relecture--ok', n === 0);

        const tete = el('div', 'pc-relecture__tete');
        tete.append(
            icone(n ? 'fa-triangle-exclamation' : 'fa-circle-check'),
            el('span', 'pc-relecture__titre', t('parcours_gf_titre')),
            el('span', 'pc-relecture__compte',
               n ? tr('parcours_gf_n_attentions', { n: String(n) }) : t('parcours_gf_rien')),
        );

        // Le dépliage n'a de sens que s'il reste quelque chose à montrer.
        if (n < constats.length) {
            const plier = el('button', 'pc-relecture__plier');
            plier.type = 'button';
            plier.append(document.createTextNode(
                t(toutVoir ? 'parcours_gf_masquer_tout' : 'parcours_gf_voir_tout')));
            plier.addEventListener('click', () => { toutVoir = !toutVoir; majRelecture(); });
            tete.append(plier);
        }
        blocRelecture.append(tete);

        const montres = toutVoir ? constats : constats.filter(c => !c.ok);
        if (montres.length) {
            const liste = el('ul', 'pc-relecture__liste');
            for (const c of montres) {
                const li = el('li', `pc-relecture__item${c.ok ? ' pc-relecture__item--ok' : ''}`);
                // Le constat de durée livre des minutes : on les écrit en heures
                // et minutes, et l'infobulle dit d'où vient l'estimation.
                const jetons = { ...(c.jetons || {}) };
                if (Number.isFinite(c.minutes)) jetons.d = formaterDuree(c.minutes);
                for (const [k, v] of Object.entries(c.durees || {})) jetons[k] = formaterDuree(v);
                const texte = el('span', null, tr(c.messageKey, jetons));
                if (c.cle === 'duree_tenable') texte.title = expliquerEstimation();
                li.append(icone(c.ok ? 'fa-check' : 'fa-circle-exclamation'), texte);
                liste.append(li);
            }
            blocRelecture.append(liste);
        }
        if (n || toutVoir) blocRelecture.append(el('p', 'pc-relecture__hint', t('parcours_gf_hint')));
    }

    // --- Notions pivots : le socle qui sera injecté dans chaque génération.
    //
    // Des pastilles, pas un bloc de texte : un mot-clé par pastille, une
    // majuscule à l'affichage, un clic pour corriger, une croix pour retirer, et
    // un champ au bout pour ajouter. Retour d'Emmanuel du 14 sept. 2026 : la zone
    // de texte « une notion par ligne » se lisait comme un brouillon sans forme.
    // La majuscule reste un affichage : la notion part au modèle telle qu'écrite,
    // pour être reprise mot pour mot au fil des phrases.
    const blocNotions = el('details', 'pc-plan-option pc-plan-notions');
    const resumeNotions = el('summary', 'pc-block__title');
    blocNotions.append(resumeNotions, el('p', 'pc-block__hint', t('parcours_notions_editer_hint')));
    const listeNotions = el('ul', 'pc-notions pc-notions--edition');
    listeNotions.setAttribute('aria-label', t('parcours_plan_notions_titre'));
    blocNotions.append(listeNotions);

    function enregistrerNotions(liste, focaliser = null) {
        plan.notionsPivots = liste.map(n => String(n).trim()).filter(Boolean);
        persister();
        dessinerNotions(focaliser);
    }

    function champNotion(valeur, { classe, onValider, onAnnuler, placeholder }) {
        const champ = el('input', classe);
        champ.type = 'text';
        champ.value = valeur;
        champ.placeholder = placeholder || '';
        champ.setAttribute('aria-label', placeholder || t('parcours_plan_notions_titre'));
        const ajuster = () => { champ.size = Math.max(placeholder ? placeholder.length : 6, champ.value.length + 1); };
        ajuster();
        champ.addEventListener('input', ajuster);
        let fini = false;
        champ.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); fini = true; onValider(champ.value, true); }
            if (e.key === 'Escape' && onAnnuler) { e.preventDefault(); e.stopPropagation(); fini = true; onAnnuler(); }
        });
        champ.addEventListener('blur', () => { if (!fini) onValider(champ.value, false); });
        return champ;
    }

    function dessinerNotions(focaliser = null) {
        const notionsActuelles = plan.notionsPivots || [];
        resumeNotions.textContent = notionsActuelles.length
            ? `${t('parcours_plan_notions_titre')} (${notionsActuelles.length})`
            : t('parcours_plan_notions_titre');
        listeNotions.replaceChildren();
        notionsActuelles.forEach((notion, i) => {
            const li = el('li', 'pc-notion');
            const texte = el('button', 'pc-notion__texte', phrase(notion));
            texte.type = 'button';
            texte.title = tr('parcours_notion_modifier', { t: phrase(notion) });
            texte.setAttribute('aria-label', texte.title);
            texte.addEventListener('click', () => {
                const champ = champNotion(notion, {
                    classe: 'pc-notion__champ',
                    onValider: (valeur) => {
                        const liste = [...(plan.notionsPivots || [])];
                        if (valeur.trim()) liste[i] = valeur; else liste.splice(i, 1);
                        enregistrerNotions(liste, valeur.trim() ? i : 'ajout');
                    },
                    onAnnuler: () => dessinerNotions(i),
                });
                li.replaceChildren(champ);
                champ.focus();
                champ.select();
            });
            const retirer = el('button', 'pc-notion__retirer');
            retirer.type = 'button';
            retirer.title = tr('parcours_notion_retirer', { t: phrase(notion) });
            retirer.setAttribute('aria-label', retirer.title);
            retirer.append(icone('fa-xmark'));
            retirer.addEventListener('click', () => {
                const liste = [...(plan.notionsPivots || [])];
                liste.splice(i, 1);
                enregistrerNotions(liste, 'ajout');
            });
            li.append(texte, retirer);
            listeNotions.append(li);
        });
        const liAjout = el('li', 'pc-notion pc-notion--ajout');
        const ajout = champNotion('', {
            classe: 'pc-notion__champ pc-notion__champ--ajout',
            placeholder: t('parcours_notion_ajouter'),
            onValider: (valeur, entree) => {
                if (!valeur.trim()) return;
                enregistrerNotions([...(plan.notionsPivots || []), valeur], entree ? 'ajout' : null);
            },
        });
        liAjout.append(icone('fa-plus'), ajout);
        listeNotions.append(liAjout);
        if (focaliser === 'ajout') ajout.focus();
        else if (Number.isInteger(focaliser)) listeNotions.children[focaliser]?.querySelector('button')?.focus();
    }
    dessinerNotions();

    // Rappel de mise à jour du bloc d'ouverture progressive : sa case dépend du
    // NOMBRE d'étapes, qui change sous les doigts de l'enseignant.
    let majProgression = () => {};
    let majFondPersonnel = () => {};
    let majCarteChemins = () => {};

    // --- La Carte de progression : la couverture du parcours (Éléa seul).
    //
    // Elle se règle ICI et non à la livraison parce qu'elle fait partie de la
    // FORME du parcours, pas de son emballage : elle se pose en section 0, en
    // tête de cours, et montre toutes les étapes sur un seul chemin. Elle ne
    // consomme aucune génération et ne compte pas dans le plafond de douze
    // activités — c'est pourquoi elle n'apparaît pas non plus dans le bandeau
    // de synthèse.
    //
    // Décochée par défaut, tant que l'aller-retour réel n'a pas eu lieu (D24) :
    // le mode d'échec de ce greffon n'est pas une carte laide, c'est un import
    // de cours perdu.
    //
    // UN SEUL bloc « Réglages du cours » pour la Carte et l'ouverture progressive
    // (relecture UX du 6 sept. 2026) : deux blocs à titre, chapeau et note
    // faisaient trois écrans de réglages avant d'atteindre les étapes, l'objet
    // même de la page. Chaque réglage garde sa ligne et sa note ; seul le titre
    // est mis en commun.
    const blocReglages = el('details', 'pc-plan-option pc-plan-reglages');
    // Les options facultatives ne repoussent plus les activités hors de vue.
    // Un réglage déjà actif reste exposé à la reprise du plan.
    blocReglages.open = Boolean(plan.carte?.actif || plan.progression?.actif);
    blocReglages.append(
        el('summary', 'pc-block__title', t(carteDisponible(draft.platform)
            ? 'parcours_reglages_titre_elea' : 'parcours_reglages_titre')),
        el('p', 'pc-block__hint', t('parcours_reglages_hint')),
    );

    // Les réglages tiennent dans UNE carte blanche, une ligne par réglage :
    // l'interrupteur, le libellé et sa note sur deux lignes, l'annexe à droite.
    // L'interrupteur reprend celui de Caramel (le Simple/Avancé du panneau
    // d'activité) : même piste grise, même bouton blanc, même bleu une fois
    // allumé — un peu plus petit, parce qu'il est en liste et non en titre.
    const carteReglages = el('div', 'pc-reglages');
    blocReglages.append(carteReglages);

    /**
     * Une ligne de réglage. Le libellé est un vrai `<label>` de l'interrupteur :
     * cliquer le texte bascule, comme cliquer l'interrupteur.
     */
    function ligneReglage(id, titreKey, noteKey) {
        const ligne = el('div', 'pc-reglage');
        const interrupteur = el('label', 'pc-switch');
        const bascule = document.createElement('input');
        bascule.type = 'checkbox';
        bascule.id = id;
        interrupteur.append(bascule, el('span', 'pc-switch__piste'));
        const texte = el('div', 'pc-reglage__texte');
        const titre = el('label', 'pc-reglage__titre', t(titreKey));
        titre.htmlFor = id;
        const note = el('p', 'pc-reglage__note', t(noteKey));
        texte.append(titre, note);
        ligne.append(interrupteur, texte);
        return { ligne, bascule, note };
    }

    if (carteDisponible(draft.platform)) {
        plan.carte = normaliserCarte(plan.carte);

        const { ligne, bascule, note: noteCarte } = ligneReglage('pc-reglage-carte', 'parcours_carte_poser', 'parcours_carte_note');
        bascule.checked = Boolean(plan.carte.actif);
        // Pas de Carte avec des chemins (D95) : le greffon montrerait à chaque
        // élève les activités des AUTRES chemins, verrouillées pour toujours. Le
        // choix de l'enseignant est gardé, et revient si les chemins disparaissent.
        majCarteChemins = () => {
            const avec = aDesChemins(plan);
            bascule.disabled = avec;
            bascule.checked = !avec && Boolean(plan.carte.actif);
            ligne.classList.toggle('pc-reglage--off', avec);
            noteCarte.textContent = t(avec ? 'parcours_carte_chemins' : 'parcours_carte_note');
            majCarte();
        };

        // Le choix du thème est une GALERIE horizontale des trente visuels, qui
        // n'apparaît que la case cochée : on choisit une image en la voyant,
        // pas un mot dans un menu (retour d'Emmanuel, 6 sept. 2026). Les noms
        // ne sont PAS traduits : ce sont les valeurs que le greffon relit dans
        // son propre catalogue, et celles qui s'afficheront dans le titre de
        // l'activité (« Carte standard : paysage ») ; on les classe dans
        // l'ordre de la langue de l'interface, une majuscule en tête.
        const galerie = el('div', 'pc-galerie');
        galerie.setAttribute('role', 'radiogroup');
        galerie.setAttribute('aria-label', t('parcours_carte_theme'));
        const images = el('div', 'pc-carte-images');
        const personnel = construireFondPersonnel(plan, () => {
            choisirTheme(plan.carte.theme, false);
            persister();
        });
        nettoyages.push(personnel.detruire);
        majFondPersonnel = personnel.actualiser;
        images.append(personnel.tuile, galerie, personnel.suite);
        const themes = [...CARTES_STANDARD].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
        const items = [];
        for (const th of themes) {
            const item = el('button', 'pc-galerie__item');
            item.type = 'button';
            item.dataset.theme = th.nom;
            item.setAttribute('role', 'radio');
            const img = document.createElement('img');
            img.src = vignetteCarte(th.nom);
            img.alt = '';
            img.width = 180; img.height = 72;
            img.loading = 'lazy';
            img.decoding = 'async';
            const tick = el('span', 'pc-choice__tick');
            tick.append(icone('fa-check'));
            item.append(img, tick, el('span', 'pc-galerie__nom', libelleCarte(th.nom)));
            item.addEventListener('click', () => choisirTheme(th.nom, true));
            items.push(item);
            galerie.append(item);
        }
        // Un seul arrêt de tabulation pour la galerie ; les flèches y circulent.
        galerie.addEventListener('keydown', (e) => {
            const i = items.indexOf(document.activeElement);
            if (i === -1) return;
            let cible = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') cible = (i + 1) % items.length;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') cible = (i - 1 + items.length) % items.length;
            if (e.key === 'Home') cible = 0;
            if (e.key === 'End') cible = items.length - 1;
            if (cible === -1) return;
            e.preventDefault();
            choisirTheme(items[cible].dataset.theme, true);
            items[cible].focus();
        });

        function choisirTheme(nom, persiste) {
            if (persiste) {
                plan.carte.theme = nom; delete plan.carte.personnalisee;
                personnel.annuler();
            }
            for (const it of items) {
                const actif = !plan.carte.personnalisee && it.dataset.theme === nom;
                it.setAttribute('aria-checked', String(actif));
                it.tabIndex = actif || (plan.carte.personnalisee && it === items[0]) ? 0 : -1;
                it.classList.toggle('pc-galerie__item--choisi', actif);
            }
            personnel.actualiser();
            if (persiste) persister();
        }

        const majCarte = () => {
            galerie.hidden = !bascule.checked;
            images.hidden = !bascule.checked;
            if (bascule.checked && !plan.carte.personnalisee) {
                // La vignette choisie se met en vue dans la rangée — une fois
                // l'écran posé dans la page (à la construction, il ne l'est
                // pas encore), et sans faire défiler la page elle-même.
                const choisi = items.find(it => it.dataset.theme === plan.carte.theme);
                if (choisi && typeof choisi.scrollIntoView === 'function') {
                    requestAnimationFrame(() => {
                        if (galerie.isConnected) choisi.scrollIntoView({ block: 'nearest', inline: 'center' });
                    });
                }
            }
        };
        bascule.addEventListener('change', () => {
            plan.carte.actif = bascule.checked;
            if (!bascule.checked) personnel.annuler();
            majCarte();
            persister();
        });
        choisirTheme(plan.carte.theme, false);
        majCarte();
        majCarteChemins();

        ligne.append(images);
        carteReglages.append(ligne);
    }

    // --- L'ouverture progressive : ce que la Carte donne à voir, en vigueur.
    //
    // Posée sur la SECTION et non sur chaque activité (cf. `progression.js`) :
    // c'est littéralement ce que le réglage annonce, et l'étape s'affiche grisée
    // une seule fois, avec sa raison, au lieu de la répéter par activité.
    //
    // Elle vaut sur les trois plateformes — les restrictions d'accès sont du
    // noyau Moodle, pas un greffon — mais elle exige DEUX étapes : sur une seule,
    // il n'y a rien à ouvrir après quoi que ce soit. La case se désactive alors
    // en le disant, plutôt que de se laisser cocher sans effet.
    plan.progression = normaliserProgression(plan.progression);
    {
        const { ligne, bascule, note: raison } =
            ligneReglage('pc-reglage-progression', 'parcours_progression_activer', 'parcours_progression_note');
        bascule.checked = Boolean(plan.progression.actif);
        // La note dit aussi POURQUOI la case se refuse : elle est vivante.
        raison.classList.add('pc-progression__raison');
        raison.setAttribute('role', 'status');

        majProgression = () => {
            const assez = plan.etapes.length >= 2;
            bascule.disabled = !assez;
            ligne.classList.toggle('pc-reglage--off', !assez);
            raison.textContent = assez
                ? t(aDesChemins(plan) ? 'parcours_progression_note_chemins' : 'parcours_progression_note')
                : t('parcours_progression_trop_court');
        };
        bascule.addEventListener('change', () => {
            plan.progression.actif = bascule.checked;
            persister();
        });
        majProgression();

        carteReglages.append(ligne);
    }

    // --- Les étapes.
    //
    // Trois façons d'agir sur le plan cohabitent — les flèches (le chemin du
    // clavier), le glisser par la vignette (celui de la souris), « ajouter »
    // (qui crée) — plus le cadenas, dont l'icône seule ne dit pas ce qu'il
    // fait. Aucune n'est « la bonne » ; ce que demande l'accessibilité, ce
    // n'est pas d'en retirer, c'est de les NOMMER en clair, une fois, en tête.
    const blocEtapes = el('div', 'pc-block');
    {
        const head = el('div', 'pc-block__head');
        head.append(
            el('h3', 'pc-block__title', t('parcours_plan_etapes_titre')),
            el('p', 'pc-block__hint', t('parcours_plan_etapes_hint')),
        );
        blocEtapes.append(head);
    }
    const etapesNode = el('div', 'pc-etapes');
    blocEtapes.append(etapesNode);
    let avantSuppression = null;
    const annulation = el('div', 'pc-annulation');
    annulation.hidden = true;
    const messageAnnulation = el('span');
    messageAnnulation.setAttribute('role', 'status');
    const annuler = action('parcours_annuler_modification', 'fa-rotate-left', () => {
        if (!avantSuppression) return;
        Object.assign(plan, avantSuppression);
        avantSuppression = null;
        annulation.hidden = true;
        persister(); dessiner();
        etapesNode.querySelector('input')?.focus();
    });
    annulation.append(messageAnnulation, annuler);
    blocEtapes.prepend(annulation);

    function garderAvant(cle) {
        avantSuppression = structuredClone(plan);
        messageAnnulation.textContent = t(cle);
        annulation.hidden = false;
    }

    function persister() {
        // Dès qu'on touche au plan proposé, ce n'est plus le modèle : c'est le
        // parcours de l'enseignant. Le bandeau le dit.
        if (!plan.personnalise) { plan.personnalise = true; majOrigine(); }
        majBrouillon({ plan });
        majSynthese();
        majRelecture();
        majProgression();
        majCarteChemins();
        dessinerMiroir();
        relire.hidden = !plan.etapes.some(e => e.cartes.some(c => c.contenu));
        api.rafraichirAction();
    }

    /** L'accueil du parcours : la « section 0 » du cours, avant les étapes. */
    function construireAccueil() {
        const node = el('section', 'pc-etape pc-etape--accueil');
        node.dataset.etape = 'accueil';
        const head = el('header', 'pc-etape__head');
        const num = el('span', 'pc-etape__num pc-etape__num--accueil');
        num.append(icone('fa-house'));
        const champs = el('div', 'pc-etape__champs');
        const intitule = el('p', 'pc-etape__nom-fixe', t('parcours_plan_intro_parcours'));
        intitule.id = 'pc-accueil-titre';
        const texte = el('textarea', 'pc-etape__intro');
        texte.rows = 1;
        texte.value = plan.introduction || '';
        texte.placeholder = t('parcours_plan_intro_parcours_ph');
        texte.setAttribute('aria-labelledby', 'pc-accueil-titre');
        texte.addEventListener('input', () => { plan.introduction = texte.value; persister(); });
        champs.append(intitule, texte);
        head.append(num, champs);
        node.append(head);
        return node;
    }

    /** La fin du parcours : ce que l'élève lit quand il a tout terminé (D96). */
    function construireFin() {
        const node = el('section', 'pc-etape pc-etape--fin');
        node.dataset.etape = 'fin';
        const head = el('header', 'pc-etape__head');
        const num = el('span', 'pc-etape__num pc-etape__num--fin');
        num.append(icone('fa-flag-checkered'));
        const champs = el('div', 'pc-etape__champs');
        const intitule = el('p', 'pc-etape__nom-fixe', t('parcours_fin_titre'));
        intitule.id = 'pc-fin-titre';
        const bravo = el('p', 'pc-fin__bravo', t('parcours_fin_bravo'));
        const texte = el('textarea', 'pc-etape__intro');
        texte.rows = 1;
        texte.value = plan.conclusion || '';
        texte.placeholder = t('parcours_fin_ph');
        texte.setAttribute('aria-labelledby', 'pc-fin-titre');
        texte.addEventListener('input', () => { plan.conclusion = texte.value; persister(); });
        champs.append(intitule, bravo, texte, el('p', 'pc-block__hint', t('parcours_fin_note')),
            el('p', 'pc-block__hint', t('parcours_fin_bilan_note')));
        head.append(num, champs);
        node.append(head);
        return node;
    }

    /**
     * L'aiguillage : le test, la barre des scores, les plages de chaque chemin
     * (réglables, nommées par leur rôle, jamais par une lettre — retour
     * d'Emmanuel, 30 sept. 2026), puis les chemins côte à côte.
     */
    function construireAiguillage(g) {
        const node = el('section', 'pc-aiguillage');
        node.dataset.etape = g.chemins[0].etape.id;
        const k = g.chemins.length;
        const n = g.test ? nombreQuestions(g.test, k) : 10;
        const bornes = bornesEnReponses(g.chemins.slice(1).map(c => c.depuis), n);
        const plages = plagesEnReponses(bornes, n);

        const tete = el('header', 'pc-aiguillage__tete');
        const titre = el('h4', 'pc-aiguillage__titre');
        titre.append(icone('fa-code-fork'), document.createTextNode(g.test
            ? tr('parcours_aig_titre', { t: g.test.titre || g.test.contenu?.title || nomModule(g.test.module) })
            : t('parcours_aig_titre_sans_test')));
        const voir = action('parcours_aig_voir_eleve', 'fa-eye', () => ouvrirVueEleve(plan, { platform: draft.platform }),
            'pc-secondaire pc-aiguillage__voir');
        tete.append(titre, voir);
        node.append(tete, el('p', 'pc-aiguillage__aide', t('parcours_aig_aide')));

        // La barre : un carré par score possible, de la couleur du chemin qu'il ouvre.
        const barre = el('div', 'pc-aiguillage__barre');
        barre.setAttribute('role', 'img');
        barre.setAttribute('aria-label', g.chemins.map((c, j) =>
            `${t(`parcours_role_${c.role}`)} : ${textePlage(plages[j], n)}`).join(' ; '));
        const cases = el('div', 'pc-aiguillage__cases');
        cases.style.gridTemplateColumns = `repeat(${n + 1}, minmax(0, 1fr))`;
        for (let s = 0; s <= n; s++) {
            const j = bornes.filter(b => s >= b).length;
            cases.append(el('span', `pc-aiguillage__case pc-role--${g.chemins[j].role}`, String(s)));
        }
        const axe = el('div', 'pc-aiguillage__axe');
        axe.append(el('span', null, t('parcours_aig_axe_debut')), el('span', null, tr('parcours_aig_axe_fin', { n })));
        barre.append(cases, axe);
        node.append(barre);

        // Une ligne par chemin : son rôle, sa plage ; à partir du deuxième, deux
        // boutons déplacent le début de sa plage d'une bonne réponse.
        const lignes = el('ul', 'pc-aiguillage__plages');
        g.chemins.forEach((c, j) => {
            const li = el('li', 'pc-aiguillage__plage');
            const role = el('span', `pc-role pc-role--${c.role}`, t(`parcours_role_${c.role}`));
            role.title = t(`parcours_role_${c.role}_hint`);
            li.append(role, el('span', 'pc-aiguillage__intervalle', textePlage(plages[j], n)));
            if (j > 0) {
                const bas = (j > 1 ? bornes[j - 2] : 0) + 1;
                const haut = j < k - 1 ? bornes[j] - 1 : n;
                const pas = el('span', 'pc-aiguillage__pas');
                for (const [sens, image, cle] of [[-1, 'fa-minus', 'parcours_aig_plus_tot'], [1, 'fa-plus', 'parcours_aig_plus_tard']]) {
                    const b = bouton(image, cle, () => {
                        const nouveau = bornes[j - 1] + sens;
                        if (nouveau < bas || nouveau > haut) return;
                        c.etape.chemin.depuis = pourcentageDeBorne(nouveau, n);
                        persister(); dessiner();
                    });
                    const libelle = tr(cle, { r: t(`parcours_role_${c.role}`) });
                    b.title = libelle;
                    b.setAttribute('aria-label', libelle);
                    b.dataset.pas = `${c.etape.id}:${sens}`;
                    b.disabled = bornes[j - 1] + sens < bas || bornes[j - 1] + sens > haut;
                    pas.append(b);
                }
                li.append(pas);
            }
            lignes.append(li);
        });
        node.append(lignes);

        const colonnes = el('div', `pc-chemins pc-chemins--${k}`);
        g.chemins.forEach((c, j) => colonnes.append(construireChemin(c, plages[j], n)));
        node.append(colonnes);

        const actions = el('div', 'pc-aiguillage__actions');
        const nouvelId = prefixe => `${prefixe}_${crypto.randomUUID()}`;
        if (k < CHEMINS_MAX) actions.append(action('parcours_aig_ajouter', 'fa-plus', () => {
            changerNombreDeChemins(plan, g.debut, 1, nouvelId); persister(); dessiner();
        }, 'pc-secondaire'));
        if (k > CHEMINS_MIN) actions.append(action('parcours_aig_retirer', 'fa-minus', () => {
            garderAvant('parcours_aig_retire'); changerNombreDeChemins(plan, g.debut, -1, nouvelId); persister(); dessiner();
        }, 'pc-secondaire'));
        actions.append(action('parcours_aig_fermer', 'fa-arrow-right-long', () => {
            garderAvant('parcours_aig_ferme'); fermerChemins(plan, g.debut); persister(); dessiner();
        }, 'pc-secondaire'));
        node.append(actions);
        return node;
    }

    /** Un chemin : son rôle et sa plage, son titre lu par l'élève, ses activités. */
    function construireChemin(c, plage, n) {
        const etape = c.etape;
        const iEtape = plan.etapes.indexOf(etape);
        const node = el('section', `pc-chemin pc-chemin--${c.role}`);
        node.dataset.etape = etape.id;
        if (cibles.etapes.has(etape.id)) node.classList.add('pc-etape--attention');
        const head = el('header', 'pc-chemin__tete');
        const role = el('span', `pc-role pc-role--${c.role}`, t(`parcours_role_${c.role}`));
        role.title = t(`parcours_role_${c.role}_hint`);
        head.append(role, el('span', 'pc-chemin__plage', textePlage(plage, n)));
        const nomRole = t(`parcours_role_${c.role}`);
        const titreChemin = el('input', 'pc-etape__titre pc-chemin__titre');
        titreChemin.type = 'text';
        titreChemin.value = etape.titre;
        titreChemin.placeholder = t('parcours_chemin_titre_ph');
        titreChemin.setAttribute('aria-label', tr('parcours_chemin_titre_aria', { r: nomRole }));
        titreChemin.addEventListener('input', () => { etape.titre = titreChemin.value; persister(); });
        const objectif = el('input', 'pc-etape__objectif');
        objectif.type = 'text';
        objectif.value = etape.objectif;
        objectif.placeholder = t('parcours_plan_etape_objectif_ph');
        objectif.setAttribute('aria-label', tr('parcours_chemin_objectif_aria', { r: nomRole }));
        objectif.addEventListener('input', () => { etape.objectif = objectif.value; persister(); });
        const intro = el('textarea', 'pc-etape__intro');
        intro.rows = 1;
        intro.value = etape.introduction || '';
        intro.placeholder = t('parcours_plan_intro_etape_ph');
        intro.setAttribute('aria-label', tr('parcours_chemin_intro_aria', { r: nomRole }));
        intro.addEventListener('input', () => { etape.introduction = intro.value; persister(); });
        head.append(titreChemin, objectif, intro);
        node.append(head);

        const liste = el('div', 'pc-cartes');
        etape.cartes.forEach((carte, iCarte) => liste.append(construireCarte(carte, etape, iEtape, iCarte)));
        const ajouter = el('button', 'pc-add');
        ajouter.type = 'button';
        ajouter.disabled = nbCartes(plan) >= 12;
        ajouter.append(icone('fa-plus'), document.createTextNode(t('parcours_plan_ajouter_activite')));
        ajouter.addEventListener('click', () => {
            etape.cartes.push({
                id: `c_${crypto.randomUUID()}`, titre: '', objectif: '', consigne: '',
                module: modules[0] ? modules[0].cle : 'Page', moduleReplie: false,
                palier: 'entrainement', duree: 10, verrouillee: false,
            });
            persister(); dessiner();
        });
        liste.append(ajouter);
        node.append(liste);
        const d = etape.cartes.reduce((s, x) => s + (Number(x.duree) || 0), 0);
        const pied = el('p', 'pc-chemin__pied');
        pied.append(icone('fa-clock'), document.createTextNode(formaterDuree(d)));
        node.append(pied);
        return node;
    }

    function dessiner() {
        const actif = document.activeElement;
        const id = actif?.closest('[data-carte], [data-etape]')?.dataset;
        const nom = actif?.getAttribute('aria-label');
        // La relecture d'ABORD : les étapes et les activités se dessinent
        // ensuite en consultant `cibles` pour se marquer elles-mêmes.
        majRelecture();
        etapesNode.replaceChildren(construireAccueil());
        // Les étapes communes sont numérotées dans l'ordre où l'élève les
        // rencontre ; un aiguillage n'a pas de numéro : ses chemins sont une
        // seule étape pour chaque élève, vue par l'enseignant en colonnes.
        const groupes = aiguillagesDuPlan(plan);
        let numero = 0;
        plan.etapes.forEach((etape, iEtape) => {
            const g = groupes.find(x => iEtape >= x.debut && iEtape <= x.fin);
            if (g) {
                if (iEtape === g.debut) etapesNode.append(construireAiguillage(g));
                return;
            }
            etapesNode.append(construireEtape(etape, iEtape, ++numero));
        });
        etapesNode.append(construireFin());
        majSynthese();
        majFondPersonnel();
        // Les champs redessinés reprennent la hauteur de leur texte : sans cela, ajouter
        // un chemin ou déplacer une carte repliait les introductions à une ligne.
        ajusterChamps();
        if (nom && id) {
            const parent = [...etapesNode.querySelectorAll('[data-carte], [data-etape]')]
                .find(n => id.carte ? n.dataset.carte === id.carte : n.dataset.etape === id.etape);
            const cible = [...(parent?.querySelectorAll('[aria-label]') || [])]
                .find(n => n.getAttribute('aria-label') === nom);
            (cible || annuler).focus({ preventScroll: true });
        }
    }

    /* ---------------------------------------------------------------- *
     *  Glisser-déposer — EN SURCOUCHE des flèches, jamais à leur place.
     *
     *  Les quatre boutons de chaque carte restent intacts : ils sont le chemin
     *  accessible (clavier, lecteur d'écran, tactile), et le glissement n'est
     *  qu'une commodité de souris par-dessus. C'est pourquoi la poignée n'entre
     *  pas dans l'ordre de tabulation : exposer aux technologies d'assistance un
     *  second chemin, moins bon que celui qui existe déjà, ne rend service à
     *  personne.
     *
     *  **La poignée est la VIGNETTE, pas la carte entière.** Rendre la carte
     *  `draggable` casserait la sélection de texte dans ses champs — le
     *  navigateur démarre un glissement au lieu de sélectionner —, or cet écran
     *  sert d'abord à écrire des titres et des objectifs. La vignette, elle, n'a
     *  aucun autre usage : elle est décorative, donc libre.
     * ---------------------------------------------------------------- */

    /** La carte en cours de glissement : `{etape, carte, id}` ou `null`. */
    let glisse = null;

    /** Retire toutes les marques d'insertion laissées par un survol. */
    function effacerMarques() {
        for (const n of etapesNode.querySelectorAll('.pc-carte--avant, .pc-carte--apres, .pc-cartes--cible')) {
            n.classList.remove('pc-carte--avant', 'pc-carte--apres', 'pc-cartes--cible');
        }
    }

    /**
     * Déplace une carte dans le plan, puis redessine.
     *
     * Ne fait RIEN si le déplacement ne change pas l'ordre : sans cette garde,
     * reposer une carte à l'endroit où on l'a prise marquerait le plan comme
     * « personnalisé » (D12) alors que rien n'a bougé.
     */
    function deplacerCarte(src, iEtapeCible, indexCible) {
        if (src.etape === iEtapeCible && (indexCible === src.carte || indexCible === src.carte + 1)) return;
        const carte = plan.etapes[src.etape].cartes.splice(src.carte, 1)[0];
        if (!carte) return;
        // Retirer la carte décale les index suivants de la MÊME étape.
        const index = (src.etape === iEtapeCible && src.carte < indexCible) ? indexCible - 1 : indexCible;
        plan.etapes[iEtapeCible].cartes.splice(index, 0, carte);
        persister();
        dessiner();
    }

    /**
     * Déplace une étape commune d'un cran. Un aiguillage se franchit d'un bloc :
     * l'étape passe de l'autre côté de tous ses chemins, sans jamais s'y glisser
     * (elle séparerait les chemins en deux aiguillages).
     */
    function deplacerEtape(iEtape, sens) {
        const cible = iEtape + sens;
        if (cible < 0 || cible >= plan.etapes.length) return;
        const g = aiguillagesDuPlan(plan).find(x => cible >= x.debut && cible <= x.fin);
        const [etape] = plan.etapes.splice(iEtape, 1);
        if (!g) plan.etapes.splice(cible, 0, etape);
        else plan.etapes.splice(sens < 0 ? g.debut : g.fin, 0, etape);
        persister(); dessiner();
    }

    function construireEtape(etape, iEtape, numero = iEtape + 1) {
        const node = el('section', 'pc-etape');
        node.dataset.etape = etape.id;
        // Une étape signalée par la relecture porte une marque discrète : sans
        // elle, un constat qui dit « 2 étapes sur 5 » laisserait chercher
        // lesquelles.
        if (cibles.etapes.has(etape.id)) node.classList.add('pc-etape--attention');

        const head = el('header', 'pc-etape__head');
        const num = el('span', 'pc-etape__num', String(numero));
        const champs = el('div', 'pc-etape__champs');

        const titreEtape = el('input', 'pc-etape__titre');
        titreEtape.type = 'text';
        titreEtape.value = etape.titre;
        titreEtape.placeholder = t('parcours_plan_etape_titre_ph');
        titreEtape.setAttribute('aria-label', tr('parcours_plan_etape_titre_aria', { n: numero }));
        titreEtape.addEventListener('input', () => { etape.titre = titreEtape.value; persister(); });

        const objEtape = el('input', 'pc-etape__objectif');
        objEtape.type = 'text';
        objEtape.value = etape.objectif;
        objEtape.placeholder = t('parcours_plan_etape_objectif_ph');
        objEtape.setAttribute('aria-label', tr('parcours_plan_etape_objectif_aria', { n: numero }));
        objEtape.addEventListener('input', () => { etape.objectif = objEtape.value; persister(); });

        // Le texte que l'élève lit en arrivant sur l'étape, posé en tête de sa
        // section dans le cours (D64). Vide, rien n'est ajouté au cours.
        const introEtape = el('textarea', 'pc-etape__intro');
        introEtape.rows = 1;
        introEtape.value = etape.introduction || '';
        introEtape.placeholder = t('parcours_plan_intro_etape_ph');
        introEtape.setAttribute('aria-label', tr('parcours_plan_intro_aria', { n: numero }));
        introEtape.addEventListener('input', () => { etape.introduction = introEtape.value; persister(); });

        champs.append(titreEtape, objEtape, introEtape);

        const actions = el('div', 'pc-etape__actions');
        actions.append(
            bouton('fa-arrow-up', 'parcours_plan_monter_etape', () => deplacerEtape(iEtape, -1)),
            bouton('fa-arrow-down', 'parcours_plan_descendre_etape', () => deplacerEtape(iEtape, 1)),
            bouton('fa-trash-can', 'parcours_plan_supprimer_etape', () => {
                garderAvant('parcours_etape_supprimee');
                plan.etapes.splice(iEtape, 1);
                persister(); dessiner();
            }, { danger: true }),
        );

        head.append(num, champs, actions);
        node.append(head);

        const listeCartes = el('div', 'pc-cartes');

        // Le conteneur accepte le dépôt, ce qui couvre deux cas que les cartes
        // ne couvrent pas : une étape VIDE (aucune carte à survoler) et l'espace
        // sous la dernière carte. Sans lui, on ne pourrait pas déposer dans une
        // étape qu'on vient de créer.
        listeCartes.addEventListener('dragover', (e) => {
            if (!glisse) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!e.target.closest('.pc-carte')) {
                effacerMarques();
                listeCartes.classList.add('pc-cartes--cible');
            }
        });
        listeCartes.addEventListener('drop', (e) => {
            if (!glisse || e.target.closest('.pc-carte')) return;
            e.preventDefault();
            const src = glisse;
            glisse = null;
            effacerMarques();
            deplacerCarte(src, iEtape, plan.etapes[iEtape].cartes.length);
        });

        etape.cartes.forEach((carte, iCarte) => {
            listeCartes.append(construireCarte(carte, etape, iEtape, iCarte));
        });

        const ajouter = el('button', 'pc-add');
        ajouter.type = 'button';
        ajouter.disabled = nbCartes(plan) >= 12;
        ajouter.append(icone('fa-plus'), document.createTextNode(t('parcours_plan_ajouter_activite')));
        ajouter.addEventListener('click', () => {
            etape.cartes.push({
                id: `c_${crypto.randomUUID()}`,
                titre: '',
                objectif: '',
                consigne: '',
                module: modules[0] ? modules[0].cle : 'Page',
                moduleReplie: false,
                palier: 'entrainement',
                duree: 10,
                verrouillee: false,
            });
            persister(); dessiner();
            [...etapesNode.querySelectorAll('[data-carte]')].find(n => n.dataset.carte === etape.cartes.at(-1).id)
                ?.querySelector('input')?.focus();
        });
        listeCartes.append(ajouter);

        node.append(listeCartes);

        // Une étape qui se termine par un test peut ouvrir des chemins : l'étape
        // suivante se décline alors en autant de chemins, parallèles (D90). Un
        // seul aiguillage par parcours dans cette version.
        const dernierTest = [...etape.cartes].reverse().find(peutAiguiller);
        if (dernierTest && !aDesChemins(plan)) {
            const ouvrir = action('parcours_aig_ouvrir', 'fa-code-fork', () => {
                const suivante = plan.etapes[iEtape + 1];
                if (!suivante) plan.etapes.push({ id: `e_${crypto.randomUUID()}`, titre: '', objectif: '', introduction: '', cartes: [] });
                ouvrirChemins(plan, iEtape + 1, draft.chemins || CHEMINS_DEFAUT, prefixe => `${prefixe}_${crypto.randomUUID()}`);
                persister(); dessiner();
            }, 'pc-secondaire pc-etape__chemins');
            ouvrir.title = t('parcours_aig_ouvrir_hint');
            node.append(ouvrir);
        }
        return node;
    }

    function construireCarte(carte, etape, iEtape, iCarte) {
        const node = el('article', 'pc-carte');
        node.dataset.carte = carte.id;
        if (cibles.cartes.has(carte.id)) node.classList.add('pc-carte--attention');
        if (carte.verrouillee) node.classList.add('pc-carte--verrouillee');

        // Cible de dépôt : au-dessus ou au-dessous, selon que le pointeur est
        // dans la moitié haute ou basse de la carte survolée. Le trait se
        // dessine du côté où la carte tombera — c'est la seule chose que
        // l'utilisateur a besoin de savoir pendant qu'il glisse.
        node.addEventListener('dragover', (e) => {
            if (!glisse || glisse.id === carte.id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const r = node.getBoundingClientRect();
            const avant = e.clientY < r.top + r.height / 2;
            effacerMarques();
            node.classList.add(avant ? 'pc-carte--avant' : 'pc-carte--apres');
        });
        node.addEventListener('drop', (e) => {
            if (!glisse) return;
            e.preventDefault();
            e.stopPropagation();
            const r = node.getBoundingClientRect();
            const avant = e.clientY < r.top + r.height / 2;
            const src = glisse;
            glisse = null;
            effacerMarques();
            deplacerCarte(src, iEtape, iCarte + (avant ? 0 : 1));
        });

        // Vignette du module, comme sur les tuiles de la page d'accueil — et
        // poignée de glissement (cf. l'encadré plus haut). Elle reste hors de
        // l'ordre de tabulation : les flèches sont le chemin accessible.
        const vignette = el('div', 'pc-carte__icone');
        vignette.draggable = true;
        vignette.title = t('parcours_plan_glisser');
        vignette.addEventListener('dragstart', (e) => {
            glisse = { etape: iEtape, carte: iCarte, id: carte.id };
            node.classList.add('pc-carte--glissee');
            e.dataTransfer.effectAllowed = 'move';
            // Certains navigateurs annulent un glissement dont le transfert est
            // vide ; l'identifiant ne sert qu'à ça, l'état vit dans `glisse`.
            e.dataTransfer.setData('text/plain', carte.id);
            // La carte ENTIÈRE suit le pointeur, pas la seule vignette : sans
            // cela on croirait déplacer l'icône.
            if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(node, 20, 20);
        });
        vignette.addEventListener('dragend', () => {
            glisse = null;
            node.classList.remove('pc-carte--glissee');
            effacerMarques();
        });
        const src = imageModule(carte.module);
        if (src) {
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.width = 34; img.height = 34;
            img.loading = 'lazy';
            vignette.append(img);
        } else {
            // Un module de parcours (forum, sondage, étiquette) n'a pas de
            // vignette : il porte son icône. Le puzzle reste le dernier recours.
            vignette.append(icone(iconeModule(carte.module) || 'fa-puzzle-piece'));
        }

        const corps = el('div', 'pc-carte__corps');

        const titreCarte = el('input', 'pc-carte__titre');
        titreCarte.type = 'text';
        titreCarte.value = carte.titre || carte.contenu?.title || '';
        titreCarte.placeholder = t('parcours_plan_carte_titre_ph');
        titreCarte.setAttribute('aria-label', t('parcours_plan_carte_titre_ph'));
        titreCarte.addEventListener('input', () => {
            carte.titre = titreCarte.value;
            if (carte.contenu) carte.contenu.title = carte.titre;
            persister();
        });

        const objCarte = el('input', 'pc-carte__objectif');
        objCarte.type = 'text';
        objCarte.value = carte.objectif;
        objCarte.placeholder = t('parcours_plan_carte_objectif_ph');
        objCarte.setAttribute('aria-label', t('parcours_plan_carte_objectif_ph'));
        objCarte.addEventListener('input', () => { carte.objectif = objCarte.value; persister(); });

        // --- Ligne de réglages : type d'activité, durée, palier.
        const reglages = el('div', 'pc-carte__reglages');

        // Le type d'activité se choisit dans une mosaïque (vignette + nom, deux
        // rubriques, filtre) : la liste déroulante était devenue illisible.
        const choixModule = boutonChoixModule({
            actuel: carte.module,
            modules,
            surChoix: cle => {
                if (carte.contenu) garderAvant('parcours_type_modifie');
                if (typeSource(carte.module) !== typeSource(cle)) delete carte.source;
                carte.sourceUtilisee = null;
                carte.module = cle;
                carte.moduleReplie = false;
                carte.contenu = null;
                purgerMedias(carte);
                persister(); dessiner();
                // La carte vient d'être redessinée : le focus revient au bouton
                // de type de CETTE carte, pas au haut de la page.
                page.querySelector(`[data-carte="${CSS.escape(String(carte.id))}"] .pc-choix`)?.focus({ preventScroll: true });
            },
        });

        const duree = el('label', 'pc-duree');
        const dureeInput = el('input', 'pc-duree__input');
        dureeInput.type = 'number';
        dureeInput.min = '1';
        dureeInput.max = '180';
        dureeInput.value = String(carte.duree);
        dureeInput.setAttribute('aria-label', t('parcours_plan_duree_aria'));
        dureeInput.addEventListener('input', () => {
            const v = Number.parseInt(dureeInput.value, 10);
            carte.duree = Number.isFinite(v) && v > 0 ? Math.min(v, 180) : 0;
            persister();
        });
        duree.append(dureeInput, el('span', 'pc-duree__unite', t('parcours_plan_minutes')));

        const palier = el('span', `pc-palier pc-palier--${carte.palier}`, t(`parcours_palier_${carte.palier}`));
        // Une pastille sans explication ne dit rien à qui découvre : le survol
        // (et le nom accessible) portent ce que le palier signifie.
        palier.title = t(`parcours_palier_${carte.palier}_hint`);
        palier.setAttribute('aria-label', t(`parcours_palier_${carte.palier}_hint`));

        reglages.append(choixModule, duree, palier);

        // Le modèle a proposé un type qui n'existe pas : on le dit, on ne le cache pas.
        corps.append(titreCarte, objCarte);
        // Le test dont la note ouvre les chemins porte sa marque (D90).
        if (aiguillageDuTest(plan, carte)) {
            const marque = el('p', 'pc-carte__aiguille');
            marque.append(icone('fa-code-fork'), document.createTextNode(t('parcours_aig_pivot')));
            marque.title = t('parcours_aig_pivot_hint');
            corps.append(marque);
        }
        // Le Test d'une trame « Évaluer » part réglé en épreuve (D102) : on le dit.
        const trameDuParcours = TRAMES.find(tr => tr.id === draft.trame);
        if (carte.module === 'test_elea' && trameDuParcours?.reglagesTest) {
            const marque = el('p', 'pc-carte__aiguille pc-carte__epreuve');
            marque.append(icone('fa-stopwatch'), document.createTextNode(tr('parcours_carte_epreuve', { d: formaterDuree(Number(carte.duree) || 20) })));
            corps.append(marque);
        }
        if (carte.moduleReplie) {
            const alerte = el('p', 'pc-carte__alerte');
            alerte.append(icone('fa-triangle-exclamation'), document.createTextNode(t('parcours_plan_module_replie')));
            corps.append(alerte);
        }

        const actions = el('div', 'pc-carte__actions');
        actions.append(
            bouton(carte.verrouillee ? 'fa-lock' : 'fa-lock-open',
                   carte.verrouillee ? 'parcours_plan_deverrouiller' : 'parcours_plan_verrouiller',
                   () => { carte.verrouillee = !carte.verrouillee; persister(); dessiner(); }),
            // Une activité passe d'une étape à l'autre par les flèches — jamais
            // d'un chemin à une autre étape : les chemins se composent côte à
            // côte, et une activité qui glisserait de l'un à l'autre changerait
            // d'élèves sans qu'on le voie.
            bouton('fa-arrow-up', 'parcours_plan_monter_activite', () => {
                if (iCarte === 0) {
                    if (iEtape === 0 || estChemin(etape) || estChemin(plan.etapes[iEtape - 1])) return;
                    plan.etapes[iEtape - 1].cartes.push(etape.cartes.splice(iCarte, 1)[0]);
                } else {
                    etape.cartes.splice(iCarte - 1, 0, etape.cartes.splice(iCarte, 1)[0]);
                }
                persister(); dessiner();
            }),
            bouton('fa-arrow-down', 'parcours_plan_descendre_activite', () => {
                if (iCarte === etape.cartes.length - 1) {
                    if (iEtape === plan.etapes.length - 1 || estChemin(etape) || estChemin(plan.etapes[iEtape + 1])) return;
                    plan.etapes[iEtape + 1].cartes.unshift(etape.cartes.splice(iCarte, 1)[0]);
                } else {
                    etape.cartes.splice(iCarte + 1, 0, etape.cartes.splice(iCarte, 1)[0]);
                }
                persister(); dessiner();
            }),
            bouton('fa-trash-can', 'parcours_plan_supprimer_activite', () => {
                garderAvant('parcours_activite_supprimee');
                etape.cartes.splice(iCarte, 1);
                persister(); dessiner();
            }, { danger: true }),
        );

        // Les réglages sont une colonne de la carte, sur la même rangée que le
        // texte — pas une troisième ligne sous lui.
        node.append(vignette, corps, reglages, actions);

        const complements = el('div', 'pc-carte__complements');
        const details = el('details', 'pc-carte__details');
        details.append(el('summary', null, t('parcours_consigne_palier')));
        const consigne = el('textarea', 'pc-form__saisie');
        consigne.rows = 2;
        consigne.value = carte.consigne || '';
        consigne.placeholder = t('parcours_consigne');
        consigne.setAttribute('aria-label', t('parcours_consigne'));
        consigne.addEventListener('input', () => { carte.consigne = consigne.value; persister(); });
        const choixPalier = el('select', 'pc-select');
        choixPalier.setAttribute('aria-label', t('parcours_palier_aria'));
        for (const p of PALIERS) {
            const opt = el('option', null, t(`parcours_palier_${p}`));
            opt.value = p; opt.selected = p === carte.palier;
            choixPalier.append(opt);
        }
        choixPalier.addEventListener('change', () => {
            carte.palier = choixPalier.value;
            palier.textContent = t(`parcours_palier_${carte.palier}`);
            palier.className = `pc-palier pc-palier--${carte.palier}`;
            palier.title = t(`parcours_palier_${carte.palier}_hint`);
            palier.setAttribute('aria-label', palier.title);
            persister();
        });
        details.append(consigne, choixPalier);
        if (carte.contenu) details.append(el('p', 'pc-block__hint', t('parcours_consigne_contenu_existant')));
        const contenuActions = el('div', 'pc-carte__contenu-actions');
        const editer = action('parcours_fab_editer', 'fa-pen-to-square', () => ouvrirActivite(draft, carte, {
            mode: 'edition', apresEnregistrement: () => { persister(); dessiner(); },
        }));
        editer.dataset.action = 'editer';
        contenuActions.append(el('span', 'pc-carte__etat', t(carte.contenu ? 'parcours_fab_statut_faite'
            : carte.verrouillee ? 'parcours_fab_statut_reservee' : sourceManquante(carte) ? 'parcours_source_manquante' : 'parcours_fab_statut_attente')));
        if (carte.contenu || carte.verrouillee) contenuActions.append(editer);
        if (carte.contenu) contenuActions.append(action('parcours_lecture_apercu', 'fa-eye', () => ouvrirActivite(draft, carte, {
            apresEnregistrement: () => { persister(); dessiner(); },
        })));
        complements.append(details, contenuActions);
        node.append(complements);
        const source = construireSaisieSource(carte, plan, () => {
            contenuActions.querySelector('.pc-carte__etat').textContent = t(carte.contenu ? 'parcours_fab_statut_faite'
                : carte.verrouillee ? 'parcours_fab_statut_reservee' : sourceManquante(carte) ? 'parcours_source_manquante' : 'parcours_fab_statut_attente');
            persister();
        });
        if (source) node.append(source.node);
        return node;
    }

    // --- Le miroir : ce que le parcours fait travailler (D4).
    //
    // Il est EN BAS, et c'est délibéré. On n'entre pas dans l'atelier par une
    // méthode de conception — la bibliothèque de trames est là pour ça ; on en
    // sort en voyant ce qu'on a construit. Un miroir se regarde après avoir bâti,
    // pas avant.
    //
    // Forme : une rangée de tuiles, pas un graphique. Cinq nombres tenant entre 0
    // et 6, dont l'information principale est justement le ZÉRO — or un zéro
    // n'occupe aucune largeur dans une barre, donc une barre cacherait ce qu'on
    // veut montrer. Les tuiles réemploient `.pc-summary`, déjà en place pour le
    // bandeau du haut : aucun vocabulaire visuel nouveau (D3).
    //
    // Il AFFICHE et ne bloque jamais, comme les six garde-fous — et il se garde
    // même d'énoncer une répartition idéale, parce qu'il n'y en a pas.
    const blocMiroir = el('div', 'pc-block');
    const miroirCorps = el('div', 'pc-miroir');
    {
        const head = el('div', 'pc-block__head');
        head.append(
            el('h3', 'pc-block__title', t('parcours_types_titre')),
            el('p', 'pc-block__hint', t('parcours_types_hint')),
        );
        blocMiroir.append(head, miroirCorps);
    }

    function dessinerMiroir() {
        miroirCorps.replaceChildren();
        const bilan = analyserPlan(plan);

        const tuiles = el('div', 'pc-summary');
        for (const { famille, n } of bilan.comptes) {
            const tuile = el('div', `pc-summary__item${n === 0 ? ' pc-summary__item--vide' : ''}`);
            tuile.append(
                el('span', 'pc-summary__val', String(n)),
                el('span', 'pc-summary__lab', t(`parcours_type_${famille}`)),
            );
            tuiles.append(tuile);
        }
        miroirCorps.append(tuiles);

        // Les constats, en toutes lettres : une absence marquée par la seule
        // pâleur d'une tuile serait une information portée par la couleur seule.
        const constats = [];
        if (bilan.absentes.length) {
            constats.push(tr('parcours_types_absentes', {
                f: bilan.absentes.map(f => t(`parcours_type_${f}`)).join(' · '),
            }));
        } else if (bilan.total) {
            constats.push(t('parcours_types_toutes'));
        }
        if (bilan.dominante) {
            constats.push(tr('parcours_types_dominante', {
                f: t(`parcours_type_${bilan.dominante.famille}`),
            }));
        }
        if (bilan.nonClasses) {
            constats.push(tr('parcours_types_non_classes', { n: bilan.nonClasses }));
        }
        for (const c of constats) miroirCorps.append(el('p', 'pc-miroir__constat', c));
    }
    dessinerMiroir();

    // --- Ajouter une étape.
    const ajouterEtape = el('button', 'pc-add pc-add--etape');
    ajouterEtape.type = 'button';
    ajouterEtape.append(icone('fa-plus'), document.createTextNode(t('parcours_plan_ajouter_etape')));
    ajouterEtape.addEventListener('click', () => {
        plan.etapes.push({ id: `e_${crypto.randomUUID()}`, titre: '', objectif: '', introduction: '', cartes: [] });
        persister(); dessiner();
        etapesNode.lastElementChild?.querySelector('input')?.focus();
    });

    dessiner();

    const apercu = el('div', 'pc-overview');
    apercu.append(hero, synthese);
    const complements = el('div', 'pc-plan-complements');
    complements.append(blocNotions, blocReglages);
    page.append(apercu, blocRelecture, complements, blocEtapes, ajouterEtape, blocMiroir);
    return { node: page, rafraichir: ajusterChamps, detruire: () => {
        observation.disconnect(); nettoyages.forEach(fn => fn());
    } };
}

/**
 * Le plan est-il fabricable ?
 * @param {Object} draft
 * @returns {{pret:boolean, raisonKey:string|null}}
 */
export function validerPlan(draft) {
    const plan = draft && draft.plan;
    if (!plan || !nbCartes(plan)) return { pret: false, raisonKey: 'parcours_plan_vide' };
    if (nbCartes(plan) > 12) return { pret: false, raisonKey: 'parcours_plan_trop_long' };
    const disponibles = new Set(modulesDisponibles(draft.platform).map(m => m.cle));
    if (plan.etapes.some(e => e.cartes.some(c => !disponibles.has(c.module)))) {
        return { pret: false, raisonKey: 'parcours_plan_module_incompatible' };
    }
    if (plan.etapes.some(e => e.cartes.some(c => !Number.isFinite(c.duree) || c.duree < 1 || c.duree > 180))) {
        return { pret: false, raisonKey: 'parcours_plan_duree_invalide' };
    }
    // Un aiguillage incomplet laisserait des élèves sans suite : ce n'est pas un
    // conseil de relecture, c'est un cours qui ne marcherait pas (D94).
    const probleme = problemesAiguillage(plan, { sansAchevement: cle => !moduleSAcheve(cle) })[0];
    if (probleme) return { pret: false, raisonKey: `parcours_aiguillage_${probleme.code}` };
    return { pret: true, raisonKey: null };
}
