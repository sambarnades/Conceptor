/**
 * @file Parcours — relevé d'usage des parcours (table Grist `PARCOURS`).
 *
 * Deux choses partent vers n8n, et deux seulement :
 *
 *  • **une ligne par plan créé** (IA intégrée, modèle, IA externe, scénario
 *    repris), postée au workflow « 5. Caramel LLM · Stats » avec
 *    `kind: 'parcours'`. C'est le MÊME webhook que la ligne agrégée des
 *    générations par lots : aucune 14ᵉ URL à faire injecter par la CI
 *    (`.gitlab-ci.yml` exige ses 13 variables, une de plus casserait le build
 *    tant qu'elle n'est pas déclarée) ;
 *  • **`parcoursId` joint à chaque activité fabriquée**, dans `activityMeta` :
 *    le Worker l'écrit dans `DONNEES.Parcours_id`, et les formules de Grist
 *    relient ainsi un parcours à ses activités sans qu'aucune ligne soit
 *    réécrite après coup.
 *
 * **RGPD — ce qui part est FERMÉ.** Des identifiants pris dans des listes
 * (modèle de parcours, plateforme, format, ampleur, origine du plan), des
 * compteurs, des horodatages, le modèle d'IA et la version de Caramel. JAMAIS
 * le sujet, le titre, les notions, les objectifs, le niveau, la discipline, les
 * titres de cartes ni les sources. `parcoursId` est tiré au hasard à chaque
 * nouveau plan : il ne suit ni une personne ni une session. Le workflow n8n
 * refiltre chaque champ (liste blanche) avant Grist.
 *
 * Best-effort : un relevé perdu ne gêne jamais l'enseignant, et n'est jamais
 * attendu.
 *
 * @module parcours/stats-parcours
 */

import { debugLog, getCaramelVersionFromFooter } from '../core/utils.js';
import { ENDPOINTS } from '../core/endpoints.js';
import { allModules } from '../core/definitions.js';
import { MODULES_PARCOURS } from './modules-parcours.js';

/** Origines d'un plan, telles que la table `PARCOURS` les compte. */
export const ORIGINES_PLAN = Object.freeze({
    ia: 'ia',
    iaExterne: 'ia_externe',
    modele: 'modele',
    import: 'import',
});

/** @returns {string} Un identifiant aléatoire, sans lien avec l'enseignant. */
export function nouvelIdParcours() {
    try {
        if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
            return globalThis.crypto.randomUUID();
        }
    } catch { /* contexte non sécurisé : repli ci-dessous */ }
    return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function versionCaramel() {
    try { return getCaramelVersionFromFooter() || ''; } catch { return ''; }
}

/**
 * `activityMeta` d'une activité fabriquée dans un parcours. Mêmes clés que
 * l'accueil (`ui.js`) pour ce que le Worker lit — `nameKey`, `caramelVersion` —
 * plus `parcoursId`. Un brouillon repris d'avant ce relevé reçoit son
 * identifiant ici ; il sera persisté avec la carte.
 *
 * @param {Object} draft
 * @param {string} cle - Clé du module de la carte.
 * @returns {Object}
 */
export function metaActiviteParcours(draft, cle) {
    if (draft && !draft.statsId) draft.statsId = nouvelIdParcours();
    const meta = {
        moduleKey: cle,
        category: 'parcours',
        nameKey: (MODULES_PARCOURS[cle] && MODULES_PARCOURS[cle].nameKey)
            || (allModules[cle] && allModules[cle].name)
            || cle,
        parcoursId: (draft && draft.statsId) || '',
    };
    const version = versionCaramel();
    if (version) meta.caramelVersion = version;
    return meta;
}

function compterActivites(plan) {
    const etapes = (plan && Array.isArray(plan.etapes)) ? plan.etapes : [];
    return {
        nbEtapes: etapes.length,
        nbActivites: etapes.reduce((n, e) => n + ((e && Array.isArray(e.cartes)) ? e.cartes.length : 0), 0),
    };
}

/**
 * Poste la ligne `PARCOURS` d'un plan et renvoie l'identifiant à ranger dans
 * le brouillon (`statsId`).
 *
 * @param {Object} draft - Le brouillon (plateforme, format, ampleur, trame).
 * @param {Object|null} plan - Le plan créé (null si la composition a échoué).
 * @param {Object} opts
 * @param {string} opts.origine - Une valeur de `ORIGINES_PLAN`.
 * @param {string} [opts.statut='ok'] - 'ok' | 'hors_cadrage' | 'echec'.
 * @param {Date}   [opts.debut] - Début de la composition (défaut : maintenant).
 * @param {Object} [opts.mesures] - Pour un plan composé par l'IA intégrée :
 *        { model, modelDemande, fallbackLevel, essais, promptTokens, completionTokens }.
 * @returns {string} L'identifiant du parcours.
 */
export function releverParcours(draft, plan, { origine, statut = 'ok', debut = null, mesures = {} } = {}) {
    const id = nouvelIdParcours();
    const { nbEtapes, nbActivites } = compterActivites(plan);
    const fin = new Date();
    const corps = {
        kind: 'parcours',
        parcours_id: id,
        origine,
        statut,
        modele_parcours: (draft && draft.trame) || '',
        plateforme: (draft && draft.platform) || '',
        format: (draft && draft.format) || '',
        ampleur: (draft && draft.ampleur) || '',
        nb_etapes: nbEtapes,
        nb_activites: nbActivites,
        model: mesures.model || '',
        model_demande: mesures.modelDemande || '',
        niveau_secours: mesures.fallbackLevel || 0,
        essais: mesures.essais || 0,
        prompt_tokens: mesures.promptTokens || 0,
        completion_tokens: mesures.completionTokens || 0,
        started_at: (debut || fin).toISOString(),
        completed_at: fin.toISOString(),
        caramel_version: versionCaramel(),
    };
    if (ENDPOINTS.llmStats && typeof fetch === 'function') {
        fetch(ENDPOINTS.llmStats, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corps),
        }).catch(err => debugLog('parcours', `Relevé du parcours non envoyé (non bloquant) : ${err.message}`));
    }
    debugLog('parcours', `relevé parcours ${origine}/${statut} : ${nbActivites} activité(s)`);
    return id;
}
