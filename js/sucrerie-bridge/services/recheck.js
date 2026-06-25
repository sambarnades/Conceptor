/**
 * Re-modération légère après modification utilisateur d'un champ texte du
 * formulaire (titre, description, objectifs, tags). Réutilise l'endpoint
 * `/sucrerie-enrich` mais en mode "modération seule" (flag `recheck_only`) :
 * seul le verdict est exploité côté frontend, le reste (suggestions IA) est
 * ignoré.
 *
 * Refonte 2026-05-24 : pipeline passé en async (cf. _poll.js). Pendant la
 * fenêtre de bascule backend, le mode sync legacy est encore supporté de
 * façon transparente.
 *
 * --- Annulation ---
 *
 * Le caller doit gérer le debounce et passer un `AbortSignal` pour annuler
 * une vérif obsolète (utilisateur qui retape avant la fin de la précédente).
 * Le signal est propagé à TOUS les fetches (Submit + chaque poll) ET aux
 * sleeps entre 2 polls, donc l'annulation est immédiate.
 *
 * En cas d'abort, la fonction throw une DOMException avec name='AbortError',
 * comportement identique à fetch() vanilla. Le caller catch comme avant.
 */

import { submitAndPollEnrich } from './_poll.js';

/**
 * @param {Object}      payload
 * @param {string}      payload.markdown       — markdown reconstruit depuis le formulaire édité
 * @param {string}      payload.activity_type  — type d'activité Caramel (ex. "H5P.Timeline")
 * @param {AbortSignal} [signal]
 * @returns {Promise<{moderation: string, moderation_reason: string, moderation_score: number}>}
 */
export async function fetchRecheck(payload, signal) {
    const data = await submitAndPollEnrich({
        markdown:      payload.markdown,
        activity_type: payload.activity_type || '',
        recheck_only:  true   // hint backend : mode modération seule
    }, { signal });

    return {
        moderation:        data.moderation || 'approuve',
        moderation_reason: data.moderation_reason || '',
        moderation_score:  data.moderation_score || 0
    };
}

/**
 * Reconstruit un markdown synthétique à partir des valeurs courantes du
 * formulaire pour la re-vérif. On garde une forme proche de celle envoyée
 * en passe 1 (titre + description + objectifs + tags) — pas le contenu
 * complet de l'activité, qui n'a pas changé.
 */
export function buildRecheckMarkdown(form) {
    const parts = [];
    if (form.title)       parts.push(`# ${form.title}`);
    if (form.description) parts.push(`**Description :** ${form.description}`);
    if (form.objectifs)   parts.push(`**Objectifs :** ${form.objectifs}`);
    if (Array.isArray(form.tags) && form.tags.length) {
        parts.push(`**Tags :** ${form.tags.join(', ')}`);
    }
    return parts.join('\n\n');
}
