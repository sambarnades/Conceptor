/**
 * Client de l'endpoint `/sucrerie-profile-lookup` (workflow D).
 *
 * Pivot du modèle d'identité auteur : au dépôt, on ne redemande prénom/nom QUE
 * si le compte est NOUVEAU. La signature publique « Nom d'auteur·rice » reste
 * toujours demandée. La réponse est volontairement minimale — `{ exists }` —
 * sans aucune PII (ni prénom, ni nom) : l'email est normalisé/haché côté serveur
 * (insensible à la casse).
 *
 * Tolérant : tout échec réseau renvoie `{ exists: false }` (on retombe alors sur
 * « demander prénom/nom » — jamais bloquant pour le dépôt).
 *
 * Miroir du client Sucrerie `assets/js/services/api.js > lookupProfile`.
 */

import { SUCRERIE_BRIDGE } from '../config.js';

/**
 * @param {string} email
 * @returns {Promise<{exists: boolean}>}
 */
export async function fetchProfileLookup(email) {
    const e = String(email || '').trim().toLowerCase();
    if (!e || !SUCRERIE_BRIDGE.endpoints.profileLookup) return { exists: false };
    try {
        const res = await fetch(SUCRERIE_BRIDGE.endpoints.profileLookup, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: e })
        });
        let data = null;
        try { data = await res.json(); } catch { /* non-JSON */ }
        return { exists: !!(data && data.exists) };
    } catch {
        return { exists: false };
    }
}
