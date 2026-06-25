/**
 * Helper interne partagé entre services/enrich.js et services/recheck.js.
 *
 * Implémente le pattern Submit + Poll du pipeline async `/sucrerie-enrich` :
 *   1. POST /sucrerie-enrich → { taskId, status: 'pending' } en ~100 ms
 *   2. GET /sucrerie-enrich-result?taskId=… toutes les 3 s jusqu'à
 *      status='done' | 'error' | timeout absolu 200 s
 *
 * Rétro-compat : si Submit renvoie l'ancien shape synchrone (avec un champ
 * `moderation` direct, sans `taskId`), on le retourne tel quel sans polling.
 * Permet de déployer le bridge AVANT la bascule backend sans tout casser.
 *
 * Annulation : si un AbortSignal est passé, on l'écoute pendant les sleeps
 * et on le propage aux fetches. Utilisé par recheck.js (debounce de saisie).
 */

import { SUCRERIE_BRIDGE } from '../config.js';

const POLL_INTERVAL_MS = 3000;
const POLL_DEADLINE_MS = 200_000;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Soumet une tâche enrich et poll le résultat jusqu'à complétion.
 *
 * @param {Object} body              corps POST envoyé à /sucrerie-enrich (markdown, activity_type, …)
 * @param {Object} [opts]
 * @param {AbortSignal} [opts.signal] signal d'annulation (propagé aux fetches + sleeps)
 * @returns {Promise<Object>} réponse `done` (shape enrichment complet) OU objet `en_attente` si échec backend
 * @throws {DOMException} si annulé via signal (name='AbortError')
 * @throws {Error}        si Submit échoue en HTTP non-OK
 */
export async function submitAndPollEnrich(body, opts = {}) {
    const signal = opts.signal;

    // ----- 1. Submit ---------------------------------------------------------
    const submitRes = await fetchJsonWithTimeout(
        SUCRERIE_BRIDGE.endpoints.enrich,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        FETCH_TIMEOUT_MS,
        'enrich',
        signal
    );

    // ----- 2. Discrimination async vs sync legacy ----------------------------
    // Mode async (nouveau) : { taskId, status: 'pending' }
    // Mode sync legacy     : { moderation, titre, description, ... }
    const isAsync = submitRes && typeof submitRes.taskId === 'string' && submitRes.status === 'pending';
    if (!isAsync) {
        return submitRes;
    }

    // ----- 3. Polling --------------------------------------------------------
    return pollUntilDone(submitRes.taskId, signal);
}

/**
 * Objet `en_attente` standard, renvoyé sans throw quand le pipeline échoue
 * proprement (3 fallbacks LLM KO, timeout, tâche purgée). L'appelant peut
 * publier l'activité en mode caché et laisser l'admin Sucrerie arbitrer.
 */
export function enAttenteFallback(reason) {
    return {
        moderation: 'en_attente',
        moderation_reason: reason || 'Service de modération temporairement indisponible — validation manuelle requise',
        moderation_score: 0,
        titre: '',
        description: '',
        objectifs: '',
        tags: [],
        systeme_educatif: '',
        discipline_slug: '',
        niveaux: [],
        niveau_libre: '',
        public_cible: '',
        langue: 'fr'
    };
}

// ============================================================================
// Helpers internes
// ============================================================================

async function fetchJsonWithTimeout(url, opts, timeoutMs, label, externalSignal) {
    // Combine timeout interne + signal externe (abort caller)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        if (!res.ok) {
            throw new Error(`${label}_http_${res.status}`);
        }
        return await res.json();
    } finally {
        clearTimeout(timer);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    }
}

async function pollUntilDone(taskId, externalSignal) {
    const deadline = Date.now() + POLL_DEADLINE_MS;
    const url = `${SUCRERIE_BRIDGE.endpoints.enrichResult}?taskId=${encodeURIComponent(taskId)}`;

    while (Date.now() < deadline) {
        await sleepWithAbort(POLL_INTERVAL_MS, externalSignal);

        let pollRes;
        try {
            pollRes = await fetchJsonWithTimeout(url, { method: 'GET' }, FETCH_TIMEOUT_MS, 'poll', externalSignal);
        } catch (err) {
            // Si annulation propagée par signal externe → on rethrow pour que
            // le caller (recheck.js) puisse catch DOMException AbortError
            // comme avec l'ancien code.
            if (err && err.name === 'AbortError') throw err;
            // Erreur réseau ponctuelle : on retente au prochain tick.
            continue;
        }

        if (pollRes.status === 'done') return pollRes;
        if (pollRes.status === 'error') return enAttenteFallback(pollRes.message || '3 fallbacks LLM échoués');
        if (pollRes.status === 'not_found') return enAttenteFallback('Tâche introuvable (expirée)');
        // status === 'processing' → continue à poller
    }

    return enAttenteFallback('Délai dépassé (200 s sans réponse Worker)');
}

/**
 * setTimeout(ms) qui se résout immédiatement si externalSignal est aborté
 * (throw AbortError comme ferait fetch). Permet d'interrompre le sleep
 * entre 2 polls quand l'utilisateur a annulé.
 */
function sleepWithAbort(ms, externalSignal) {
    return new Promise((resolve, reject) => {
        if (externalSignal?.aborted) {
            return reject(new DOMException('Aborted', 'AbortError'));
        }
        const timer = setTimeout(() => {
            if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        if (externalSignal) externalSignal.addEventListener('abort', onAbort, { once: true });
    });
}
