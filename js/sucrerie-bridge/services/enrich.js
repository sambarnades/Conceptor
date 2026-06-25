/**
 * Client de l'endpoint `/sucrerie-enrich` (passe 1 modération + suggestions IA).
 *
 * Refonte 2026-05-24 : pipeline passé en async (pattern Caramel à 4 workflows).
 * Toute la mécanique submit + poll vit dans ./_poll.js et est partagée avec
 * services/recheck.js. Ce fichier reste un wrapper mince qui :
 *   - normalise le body
 *   - délègue à submitAndPollEnrich
 *
 * Le contrat retour est inchangé pour l'appelant :
 *   { moderation, moderation_reason, moderation_score, titre,
 *     description, objectifs, tags[], discipline_slug, niveaux[], langue, … }
 *
 * En cas d'échec backend (3 fallbacks LLM KO, timeout, tâche purgée), renvoie
 * un objet `en_attente` au lieu de throw — l'appelant publie en mode caché et
 * l'admin Sucrerie arbitre via le digest. Pas de pop-up utilisateur.
 */

import { submitAndPollEnrich } from './_poll.js';

/**
 * @param {Object} payload
 * @param {string} payload.markdown
 * @param {string} payload.activity_type
 * @param {string} [payload.user_intent_who]   — champ "Qui" du formulaire initial Caramel/aManDe
 * @param {string} [payload.user_intent_what]  — champ "Quoi" du formulaire initial Caramel/aManDe
 * @returns {Promise<Object>} réponse JSON enrichissement (ou en_attente si pipeline KO)
 * @throws {Error} si Submit échoue en HTTP non-OK
 */
export async function fetchEnrich(payload) {
    return submitAndPollEnrich({
        markdown:         payload.markdown,
        activity_type:    payload.activity_type   || '',
        user_intent_who:  payload.user_intent_who  || '',
        user_intent_what: payload.user_intent_what || ''
    });
}
