/**
 * Client de l'endpoint `/sucrerie-publish` (passe 2 modération + persistance).
 *
 * Réponses attendues (cf. workflow PostgreSQL.json `Sucrerie - Reponse`) :
 *   - succès :         { status: 'published', public_id, content_id, title, moderation }
 *   - en attente :     { status: 'pending_confirmation', public_id, moderation, email_masked }
 *                      (double opt-in, CDC §5.5/§9 : un dépôt depuis Caramel est
 *                       TOUJOURS anonyme → confirmation par e-mail requise. Le front
 *                       lit `data.status` — défaut 'published' — pour rester tolérant
 *                       tant que le gate backend n'est pas activé.)
 *   - rejet passe 2 :  { error: 'moderation_blocked', moderation: 'rejete', moderation_reason }
 *
 * Le magic link de gestion est envoyé par email côté backend — le front ne
 * le récupère jamais (le serveur le hash).
 */

import { SUCRERIE_BRIDGE } from '../config.js';

/**
 * @param {Object} payload — voir deposit-flow.js#buildPublishPayload
 * @returns {Promise<Object>} JSON serveur (peut contenir `error`)
 * @throws {Error} si fetch HTTP non-OK et aucun JSON exploitable
 */
export async function fetchPublish(payload) {
    const res = await fetch(SUCRERIE_BRIDGE.endpoints.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // On essaie TOUJOURS de parser le JSON : la passe 2 peut renvoyer un
    // statut HTTP 200 avec `error: 'moderation_blocked'` dans le corps.
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }

    if (!res.ok && !data) {
        throw new Error(`publish_http_${res.status}`);
    }
    if (!data) {
        throw new Error('publish_empty_response');
    }
    return data;
}
