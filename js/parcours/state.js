/**
 * @file Parcours — état du brouillon en cours de conception.
 *
 * Un seul brouillon à la fois, conservé dans `sessionStorage` : on peut fermer
 * l'atelier, revenir aux activités, et reprendre là où on en était. La pastille
 * flottante porte alors un point de rappel.
 *
 * Le contexte n'est JAMAIS ressaisi ni recopié : il est LU à la volée sur la
 * page d'accueil — qui, quoi, niveau, ET le corpus joint (PDF, pages web,
 * images océrisées, transcriptions). L'atelier n'en propose aucune copie
 * modifiable : deux formulaires pour la même information, c'est un formulaire
 * de trop, et celui de l'atelier aurait fatalement oublié les pièces jointes.
 *
 * @module parcours/state
 */

import { CONFIG } from './config.js';
import { texteAffiche } from '../core/texte-affiche.js';

/** @type {Object|null} Brouillon courant (null tant que l'atelier n'a pas été ouvert). */
let draft = null;
let sauvegarde = 'complet';
export function etatSauvegarde() { return sauvegarde; }

/** Abonnés notifiés à chaque mutation (l'écran se redessine). */
const listeners = new Set();

/**
 * Lit la valeur d'un champ de l'application principale.
 * @param {string} selector
 * @returns {string} La valeur nettoyée, ou une chaîne vide.
 */
function readField(selector) {
    const el = document.querySelector(selector);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
}

/**
 * Contexte lu en direct sur la page d'accueil.
 *
 * `sources` liste les pièces jointes telles que `services/ocr.js` les affiche
 * (nom + couleur), et `corpusLength` mesure le texte extrait — celui-là même
 * que consulte `rag-orchestrator.js` pour décider s'il envoie les programmes
 * scolaires. Un corpus fourni prime sur le programme : c'est la référence de
 * l'enseignant, et le parcours doit s'y ancrer.
 *
 * @returns {{qui:string, quoi:string, niveau:string, corpus:string, corpusLength:number, sources:Array<{nom:string,couleur:string}>}}
 */
export function contexteHerite() {
    const s = CONFIG.caramelSelectors;

    const corpusEl = document.querySelector(s.corpus);
    // Même lecture que le générateur de prompts : la zone est masquée en mode Rapide.
    const corpus = texteAffiche(corpusEl).trim();

    const sources = Array.from(document.querySelectorAll(s.sourceTags)).map(tag => {
        const nomEl = tag.querySelector(s.sourceNom);
        return {
            nom: nomEl ? (nomEl.textContent || '').trim() : '',
            couleur: tag.style.backgroundColor || '',
        };
    }).filter(src => src.nom);

    return {
        qui: readField(s.qui),
        quoi: readField(s.quoi),
        niveau: readField(s.niveau),
        // Le TEXTE, pas seulement sa longueur : c'est lui qui part dans le
        // prompt de plan. Il n'est jamais persisté (cf. `persister`).
        corpus,
        corpusLength: corpus.length,
        sources,
    };
}

function nouveauBrouillon() {
    return {
        version: CONFIG.version,
        creeLe: Date.now(),
        platform: CONFIG.defaults.platform,
        format: CONFIG.defaults.format,
        ampleur: CONFIG.defaults.ampleur,
        trame: CONFIG.defaults.trame,
        /** Rempli à l'étape suivante (appel de plan). */
        plan: null,
    };
}

/**
 * Existe-t-il un brouillon repris d'une session précédente ?
 * Consulté par la pastille pour afficher son point de rappel, SANS charger
 * l'atelier ni écrire quoi que ce soit.
 * @returns {boolean}
 */
export function brouillonEnAttente() {
    try {
        const raw = sessionStorage.getItem(CONFIG.storageKey);
        if (!raw) return false;
        const d = JSON.parse(raw);
        // Un brouillon ne « compte » que si l'utilisateur y a mis du sien :
        // un simple passage sur l'écran de cadrage n'allume pas la pastille.
        return Boolean(d && d.plan);
    } catch {
        return false;
    }
}

/**
 * Charge le brouillon (ou en crée un neuf) et y attache le contexte du moment.
 * @returns {Object} Le brouillon courant.
 */
export function ouvrirBrouillon() {
    if (!draft) {
        try {
            const raw = sessionStorage.getItem(CONFIG.storageKey);
            draft = raw ? JSON.parse(raw) : null;
        } catch {
            draft = null;
        }
    }
    const planValide = !draft?.plan || (Array.isArray(draft.plan.etapes)
        && draft.plan.etapes.every(e => e && Array.isArray(e.cartes)
            && e.cartes.every(c => c && typeof c === 'object' && !Array.isArray(c))));
    if (!draft || draft.version !== CONFIG.version || !planValide) {
        draft = nouveauBrouillon();
        sauvegarde = 'complet';
    }
    if (draft.contenusNonPersistes) sauvegarde = 'plan';

    // Le contexte est RELU à chaque ouverture, jamais mémorisé : compléter le
    // sujet ou joindre un document après coup profite ainsi au parcours, sans
    // que rien n'ait à être resaisi.
    draft.contexte = contexteHerite();
    return draft;
}

/** @returns {Object|null} Le brouillon courant, sans le charger. */
export function brouillon() {
    return draft;
}

/**
 * Applique une modification et notifie les abonnés.
 * @param {Object} patch - Champs à écraser au premier niveau.
 */
export function majBrouillon(patch) {
    if (!draft) ouvrirBrouillon();
    Object.assign(draft, patch);
    persister();
    listeners.forEach(fn => fn(draft));
}

/** Efface le brouillon (bouton « Recommencer »). */
export function reinitialiser() {
    draft = nouveauBrouillon();
    sauvegarde = 'complet';
    try { sessionStorage.removeItem(CONFIG.storageKey); } catch { /* quota / mode privé */ }
    listeners.forEach(fn => fn(draft));
    return draft;
}

function persister() {
    // Le contexte n'est pas sérialisé : il est relu sur la page d'accueil, qui
    // en est la seule source de vérité.
    const { contexte, contenusNonPersistes, ...aGarder } = draft;
    try {
        sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(aGarder));
        delete draft.contenusNonPersistes;
        sauvegarde = 'complet';
        return;
    } catch {
        // Douze activités générées, ce sont douze JSON de contenu : le quota de
        // `sessionStorage` peut y passer. Plutôt que de tout perdre, on retente
        // SANS les contenus — le plan seul tient dans quelques kilo-octets, et
        // c'est lui que la pastille de reprise promet de retrouver.
    }
    try {
        const allege = {
            ...aGarder,
            contenusNonPersistes: true,
            plan: aGarder.plan ? {
                ...aGarder.plan,
                ...(aGarder.plan.carte?.image ? { carte: { ...aGarder.plan.carte,
                    image: { ...aGarder.plan.carte.image, dataURL: undefined } } } : {}),
                etapes: (aGarder.plan.etapes || []).map(e => ({
                    ...e,
                    cartes: (e.cartes || []).map(({ contenu, medias, ...reste }) => reste),
                })),
            } : null,
        };
        sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(allege));
        sauvegarde = 'plan';
    } catch {
        sauvegarde = 'aucune';
        // sessionStorage indisponible (mode privé) : l'atelier reste
        // parfaitement utilisable, seule la reprise après fermeture est perdue.
    }
}

/**
 * S'abonne aux mutations du brouillon.
 * @param {Function} fn
 * @returns {Function} Fonction de désabonnement.
 */
export function surChangement(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/**
 * Le brouillon est-il prêt pour l'appel de plan ?
 * Le sujet est le SEUL champ réellement indispensable : sans lui, l'IA n'a rien
 * à scénariser. Le reste a des valeurs par défaut acceptables.
 * @returns {{ pret: boolean, raisonKey: string|null }}
 */
export function validerCadrage() {
    const d = draft || ouvrirBrouillon();
    d.contexte = contexteHerite();
    if (!d.contexte.quoi) {
        return { pret: false, raisonKey: 'parcours_cta_besoin_sujet' };
    }
    return { pret: true, raisonKey: null };
}
