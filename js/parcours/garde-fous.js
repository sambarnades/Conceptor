/**
 * @file Parcours — la relecture didactique du plan.
 *
 * Six contrôles passés sur le plan AVANT la moindre génération. Ils **affichent,
 * ils ne bloquent jamais** : un plan qui les échoue tous reste fabricable. C'est
 * une relecture de collègue, pas une validation d'inspecteur — l'enseignant sait
 * des choses que ce fichier ignore (sa classe, sa progression, le temps qu'il
 * lui reste), et la dernière décision lui appartient.
 *
 * Le moment n'est pas indifférent : relire APRÈS la génération coûterait huit
 * appels au modèle pour s'entendre dire que la structure était bancale. Ici, le
 * plan tient en un écran et se corrige en deux clics.
 *
 * **Ce qu'on ne contrôle pas, et pourquoi.** Trois tentations ont été écartées :
 *   - la QUALITÉ des textes (« cet objectif est-il bien formulé ? ») — il
 *     faudrait un modèle pour en juger, donc un appel, donc une attente, pour un
 *     avis moins sûr que celui de la personne qui lit ;
 *   - le VERBE D'ACTION en tête d'objectif — l'interface parle douze langues, et
 *     un détecteur de verbe français ne dirait rien de juste en grec ou en
 *     chinois. On vérifie la présence, et le message conseille le reste ;
 *   - la DURÉE de chaque activité — `normaliserPlan` lui donne un repli de 10
 *     minutes, un contrôle de présence serait donc toujours vert. C'est la
 *     tenue d'ensemble qu'on regarde à la place (§ 5 du PRD).
 *
 * Chaque contrôle rend un `Constat` : jamais une exception, jamais un blocage.
 *
 * Un plan à chemins (D90) reçoit trois repères de plus — un test qui oriente,
 * assez de questions, des chemins parallèles —, et les deux contrôles qui lisent
 * la SUITE des activités (alternance, durée) la lisent chemin par chemin.
 *
 * Seul import : `aiguillage.js`, lui aussi pur — le banc Node tourne sans DOM.
 *
 * @module parcours/garde-fous
 */

import {
    aiguillagesDuPlan, aDesChemins, suitesPossibles, dureeParEleve, nombreQuestions, QUESTIONS_CONSEILLEES,
} from './aiguillage.js';

/**
 * Modules qui rendent un VERDICT à l'élève, tout de suite et sans l'enseignant.
 *
 * **Ce n'est pas la catégorie `quiz` de `definitions.js`**, et il ne faut pas
 * les confondre : celle-là sert à filtrer les tuiles de la page d'accueil et
 * range `Devoir` parmi les quiz (il se note, mais l'enseignant corrige à la
 * main, des jours plus tard) tout en laissant dehors `DragTheWords`,
 * `FillInTheBlanks` ou `Crossword` (qui corrigent à la seconde). Pour une
 * relecture didactique, c'est l'inverse qui compte : **l'élève repart-il en
 * sachant s'il a juste ?**
 *
 * Les trois conteneurs (`CoursePresentation`, `InteractiveBook`,
 * `InteractiveVideo`) y figurent parce que le parcours les remplit de questions
 * — c'est ce que leur prompt demande.
 *
 * `DialogCards` en est absent à dessein : on retourne une carte, on ne répond
 * pas. `Flashcards` y est : l'élève saisit puis se voit corrigé.
 */
const RENDENT_UN_VERDICT = new Set([
    // H5P — exercices auto-correctifs
    'QuizSet', 'QuizSetQCM', 'QuizSetVF', 'TrueFalse', 'MultipleChoice',
    'SingleChoiceSet', 'DragTheWords', 'DragAndDrop', 'FillInTheBlanks',
    'ComplexFillTheBlanks', 'MarkTheWords', 'FindTheWords', 'SortParagraphs',
    'Crossword', 'Summary', 'Essay', 'Flashcards', 'Dictation',
    'FindTheHotspot', 'FindMultipleHotspots',
    // H5P — conteneurs, que le parcours remplit de questions
    'CoursePresentation', 'InteractiveBook', 'InteractiveVideo',
    // Moodle / Éléa
    'test_elea', 'QCM', 'Millionnaire', 'Appariement',
    // Modules de la plateforme : la Leçon ne laisse passer qu'avec la bonne
    // réponse — c'est un verdict, rendu page par page.
    'parcours_lecon',
]);

/** Au-delà, ce n'est plus une activité mais une séance. */
const MINUTES_MAX_ACTIVITE = 30;

/** Au-delà, le parcours déborde d'une séance double — on le dit, sans plus. */
const MINUTES_AVANT_ALERTE = 120;

/** Trois d'affilée : c'est le seuil où la répétition s'installe. */
const SERIE_MAX = 3;

/**
 * @typedef {Object} Constat
 * @property {string}   cle        Identifiant stable du contrôle.
 * @property {boolean}  ok         Le contrôle passe-t-il ?
 * @property {string}   messageKey Clé i18n du message à afficher.
 * @property {Object}   [jetons]   Jetons de substitution du message.
 * @property {string[]} [etapes]   Ids des étapes concernées, s'il y en a.
 * @property {string[]} [cartes]   Ids des activités concernées, s'il y en a.
 */

/** Toutes les cartes du plan, dans l'ordre de lecture. */
function cartesAPlat(plan) {
    return (plan.etapes || []).flatMap(e => e.cartes || []);
}

/** Deux textes disent-ils la même chose ? (casse, espaces et ponctuation mis à part) */
function memeTexte(a, b) {
    const n = s => String(s || '').toLowerCase().replace(/[\s.,;:!?…«»"'()-]/g, '');
    const x = n(a);
    return Boolean(x) && x === n(b);
}

/* ------------------------------------------------------------------ *
 *  Les six contrôles
 * ------------------------------------------------------------------ */

/**
 * 1. Le parcours annonce-t-il où il va ?
 *
 * Un objectif général, distinct du titre. « Les états de la matière » est un
 * titre ; « comprendre pourquoi un corps change d'état » est un objectif. Le
 * modèle recopie volontiers le premier à la place du second — c'est le défaut
 * qu'on attrape ici, et il est visible dans toutes les langues.
 */
function annonceOuIlVa(plan) {
    const objectif = String(plan.objectifGeneral || '').trim();
    if (!objectif) {
        return { cle: 'objectif_general', ok: false, messageKey: 'parcours_gf_objectif_absent' };
    }
    if (memeTexte(objectif, plan.titre)) {
        return { cle: 'objectif_general', ok: false, messageKey: 'parcours_gf_objectif_recopie' };
    }
    return { cle: 'objectif_general', ok: true, messageKey: 'parcours_gf_objectif_ok' };
}

/**
 * 2. Y a-t-il au moins une activité qui vérifie ?
 *
 * Un parcours qui n'expose l'élève qu'à des pages et des vidéos ne lui apprend
 * pas où il en est — et n'apprend rien à l'enseignant non plus.
 */
function auMoinsUneVerification(plan) {
    const cartes = cartesAPlat(plan);
    const verif = cartes.filter(c => RENDENT_UN_VERDICT.has(c.module));
    if (!verif.length) {
        return { cle: 'une_verification', ok: false, messageKey: 'parcours_gf_verif_absente' };
    }
    return {
        cle: 'une_verification', ok: true,
        messageKey: 'parcours_gf_verif_ok', jetons: { n: String(verif.length) },
    };
}

/**
 * 3. Trois fois le même type d'affilée ?
 *
 * Trois QCM à la suite, c'est le moment où la classe décroche. On regarde la
 * suite des activités À PLAT, par-dessus les étapes : un élève qui enchaîne ne
 * voit pas les frontières qu'on a tracées. Avec des chemins, on regarde la suite
 * de CHAQUE élève — la sienne, chemin compris, jamais celui des autres (D34).
 */
function pasTroisIdentiques(plan) {
    const coupables = new Map();
    for (const cartes of suitesPossibles(plan)) {
        let debut = 0;
        for (let i = 1; i <= cartes.length; i++) {
            if (i < cartes.length && cartes[i].module === cartes[debut].module) continue;
            if (i - debut >= SERIE_MAX) for (const c of cartes.slice(debut, i)) coupables.set(c.id, c);
            debut = i;
        }
    }
    if (coupables.size) {
        return {
            cle: 'pas_trois_identiques', ok: false,
            messageKey: 'parcours_gf_serie_ko',
            jetons: { n: String(coupables.size) },
            cartes: [...coupables.keys()],
        };
    }
    return { cle: 'pas_trois_identiques', ok: true, messageKey: 'parcours_gf_serie_ok' };
}

/**
 * 4. Chaque étape porte-t-elle un objectif, distinct de son titre ?
 *
 * On ne juge pas la formulation — douze langues, et aucun détecteur de verbe
 * qui vaille en grec comme en breton. On vérifie qu'il y a quelque chose, et
 * que ce quelque chose n'est pas le titre recopié. Le message, lui, conseille
 * le verbe d'action : un conseil se traduit, une heuristique non.
 */
function objectifParEtape(plan) {
    const etapes = plan.etapes || [];
    const nues = etapes.filter(e => !String(e.objectif || '').trim() || memeTexte(e.objectif, e.titre));
    if (nues.length) {
        return {
            cle: 'objectif_par_etape', ok: false,
            messageKey: 'parcours_gf_etape_sans_objectif',
            jetons: { n: String(nues.length), total: String(etapes.length) },
            etapes: nues.map(e => e.id),
        };
    }
    return { cle: 'objectif_par_etape', ok: true, messageKey: 'parcours_gf_etape_objectif_ok' };
}

/**
 * 5. Le volume horaire tient-il debout ?
 *
 * Deux mesures, deux natures. Une activité de plus de 30 minutes n'est pas une
 * activité, c'est une séance déguisée : elle se découpe, et c'est un DÉFAUT du
 * plan. Un parcours de plus de deux heures, en revanche, peut être une séquence
 * assumée sur plusieurs séances : on le SIGNALE sans le reprocher.
 */
function dureeTenable(plan) {
    const cartes = cartesAPlat(plan);
    const trop = cartes.filter(c => Number(c.duree) > MINUTES_MAX_ACTIVITE);
    // Ce que fait UN élève : avec des chemins, le plus long d'entre eux.
    const total = dureeParEleve(plan).max;

    if (trop.length) {
        return {
            cle: 'duree_tenable', ok: false,
            messageKey: 'parcours_gf_duree_activite_ko',
            jetons: { n: String(trop.length), max: String(MINUTES_MAX_ACTIVITE) },
            cartes: trop.map(c => c.id),
        };
    }
    if (total > MINUTES_AVANT_ALERTE) {
        return {
            cle: 'duree_tenable', ok: false,
            messageKey: 'parcours_gf_duree_totale_longue',
            // Ce module n'importe rien (banc Node pur) : il livre les MINUTES,
            // et l'écran les écrit « 3 h 25 » avec `duree.js` — jamais « 3,4 h ».
            jetons: { d: `${total} min` },
            minutes: total,
        };
    }
    return { cle: 'duree_tenable', ok: true, messageKey: 'parcours_gf_duree_ok' };
}

/**
 * 6. À l'entraînement, l'élève sait-il s'il a juste ?
 *
 * C'est le sens même du palier : on s'entraîne pour se corriger. Une étape
 * d'entraînement où rien ne corrige — une page à lire, un glossaire à
 * parcourir, un devoir que l'enseignant relèvera la semaine suivante — laisse
 * l'élève sans retour au moment précis où il en a besoin.
 *
 * **Le contrôle porte sur l'ÉTAPE, pas sur chaque activité**, et cette nuance
 * fait toute la différence. Une étape d'entraînement composée d'une page de
 * rappel PUIS de deux exercices est parfaitement saine : la page est le
 * support, les exercices sont l'entraînement. Juger carte par carte
 * reprocherait la page — première version de ce contrôle, corrigée quand on l'a
 * passé sur les trames livrées avec Caramel : il accusait cinq étapes
 * irréprochables (`DialogCards` + `FillInTheBlanks`, `Chart` + `Essay`…) et
 * n'aurait appris à personne à mieux construire une séance.
 *
 * On signale donc les étapes où l'élève n'est JAMAIS corrigé, et on nomme leurs
 * activités pour qu'on voie de quoi elles sont faites.
 */
function entrainementAvecRetour(plan) {
    const muettes = (plan.etapes || []).filter(e =>
        (e.cartes || []).some(c => c.palier === 'entrainement')
        && !(e.cartes || []).some(c => RENDENT_UN_VERDICT.has(c.module)));
    if (muettes.length) {
        return {
            cle: 'entrainement_avec_retour', ok: false,
            messageKey: 'parcours_gf_entrainement_muet',
            jetons: { n: String(muettes.length) },
            etapes: muettes.map(e => e.id),
            cartes: muettes.flatMap(e => (e.cartes || []).map(c => c.id)),
        };
    }
    return { cle: 'entrainement_avec_retour', ok: true, messageKey: 'parcours_gf_entrainement_ok' };
}

/* ------------------------------------------------------------------ *
 *  Les repères des chemins (D90)
 * ------------------------------------------------------------------ */

/**
 * 7. Un test oriente-t-il les élèves ? Sans lui, aucun chemin ne s'ouvre. (La
 * validation du plan bloque aussi : ici, on dit où et quoi faire.)
 */
function testQuiOriente(plan) {
    const sans = aiguillagesDuPlan(plan).filter(g => !g.test);
    if (sans.length) {
        return {
            cle: 'chemins_test', ok: false, messageKey: 'parcours_gf_chemins_test_ko',
            etapes: sans.map(g => (g.etapeTest || g.chemins[0].etape).id),
        };
    }
    return { cle: 'chemins_test', ok: true, messageKey: 'parcours_gf_chemins_test_ok' };
}

/**
 * 8. Assez de questions pour aiguiller ? Trier en trois sur cinq questions,
 * c'est laisser une seule réponse décider du chemin.
 */
function assezDeQuestions(plan) {
    for (const g of aiguillagesDuPlan(plan)) {
        if (!g.test) continue;
        const k = g.chemins.length;
        const n = nombreQuestions(g.test, k);
        const conseil = QUESTIONS_CONSEILLEES[k];
        if (n < conseil) {
            return {
                cle: 'chemins_questions', ok: false, messageKey: 'parcours_gf_chemins_questions_ko',
                jetons: { n: String(n), k: String(k), c: String(conseil) }, cartes: [g.test.id],
            };
        }
    }
    return { cle: 'chemins_questions', ok: true, messageKey: 'parcours_gf_chemins_questions_ok' };
}

/**
 * 9. Les chemins sont-ils parallèles ? Même nombre d'activités, durées proches :
 * chaque élève a le même temps pour le même objectif (Gauthier, sept. 2026).
 */
function cheminsParalleles(plan) {
    for (const g of aiguillagesDuPlan(plan)) {
        const durees = g.chemins.map(c => (c.etape.cartes || []).reduce((s, x) => s + (Number(x.duree) || 0), 0));
        const tailles = g.chemins.map(c => (c.etape.cartes || []).length);
        const min = Math.min(...durees);
        const max = Math.max(...durees);
        if ((max && min < 0.75 * max) || Math.max(...tailles) - Math.min(...tailles) > 1) {
            return {
                cle: 'chemins_paralleles', ok: false, messageKey: 'parcours_gf_chemins_paralleles_ko',
                // Des MINUTES, écrites par l'écran avec `duree.js` (« 1 h 05 », jamais
                // un « min » latin figé en arabe ou en chinois) — cf. `dureeTenable`.
                jetons: { min: `${min} min`, max: `${max} min` }, durees: { min, max },
                etapes: g.chemins.map(c => c.etape.id),
            };
        }
    }
    return { cle: 'chemins_paralleles', ok: true, messageKey: 'parcours_gf_chemins_paralleles_ok' };
}

/* ------------------------------------------------------------------ *
 *  L'entrée publique
 * ------------------------------------------------------------------ */

/** Les six contrôles, dans l'ordre où ils s'affichent. */
const CONTROLES = [
    annonceOuIlVa,
    auMoinsUneVerification,
    objectifParEtape,
    entrainementAvecRetour,
    pasTroisIdentiques,
    dureeTenable,
];

/** Les repères propres aux chemins, ajoutés aux six quand le plan en a. */
const CONTROLES_CHEMINS = [testQuiOriente, assezDeQuestions, cheminsParalleles];

/**
 * Relit un plan et rend les six constats.
 *
 * PURE et sans DOM : c'est ce qui permet de la faire tourner dans un banc, et
 * ce qui garantit qu'aucun contrôle ne peut faire tomber l'écran du plan.
 *
 * @param {Object} plan - Le plan normalisé.
 * @returns {Constat[]} Les six constats, dans le même ordre ; neuf avec des chemins.
 */
export function relirePlan(plan) {
    const p = plan && typeof plan === 'object' ? plan : { etapes: [] };
    const controles = aDesChemins(p) ? [...CONTROLES, ...CONTROLES_CHEMINS] : CONTROLES;
    return controles.map((controle) => {
        try {
            return controle(p);
        } catch {
            // Un contrôle qui casse ne doit pas emporter la relecture, et encore
            // moins l'écran : on le déclare simplement muet.
            return { cle: 'inconnu', ok: true, messageKey: 'parcours_gf_indisponible' };
        }
    });
}

/**
 * Combien de points d'attention ?
 * @param {Constat[]} constats
 * @returns {number}
 */
export function nbAttentions(constats) {
    return constats.filter(c => !c.ok).length;
}

/**
 * Les identifiants d'étapes et d'activités signalés, pour les marquer à l'écran.
 * @param {Constat[]} constats
 * @returns {{etapes:Set<string>, cartes:Set<string>}}
 */
export function ciblesSignalees(constats) {
    const etapes = new Set();
    const cartes = new Set();
    for (const c of constats) {
        if (c.ok) continue;
        for (const id of c.etapes || []) etapes.add(id);
        for (const id of c.cartes || []) cartes.add(id);
    }
    return { etapes, cartes };
}
