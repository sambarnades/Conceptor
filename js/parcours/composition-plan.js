/**
 * @file Parcours — composer le plan avec le modèle : réparer, contrôler, reprendre
 * une fois, garder le meilleur (D58, D107).
 *
 * D58 refusait le plan après deux écarts au cadrage : l'enseignant revenait au
 * cadrage, sans plan. Désormais chaque réponse est d'abord réparée
 * (`reparation-plan.js`) ; la reprise n'est demandée que pour ce qui reste, avec
 * ces seuls écarts ; après elle, le meilleur des plans réparés est ramené à la
 * forme demandée (dernier recours) et RETENU. Seule une réponse sans plan du
 * tout — pas un objet JSON, deux fois, ou aucune activité — échoue encore.
 *
 * Sans DOM : l'atelier (`index.js`) et le relevé sur le vrai modèle en partagent
 * la boucle, l'appel au modèle et la lecture du JSON étant passés par l'appelant.
 *
 * @module parcours/composition-plan
 */
import { controlerCalibrage, remarquesComposition } from './calibrage.js';
import { reparerPlan, graviteCadrage } from './reparation-plan.js';

/**
 * La demande de reprise : le prompt d'origine, puis les écarts qui restent après
 * réparation. Le plan fautif n'est pas recopié : le recopier incitait le modèle à
 * garder sa structure (D58).
 */
export function demandeDeReprise(prompt, calibrage, ecarts) {
    return `${prompt}\n\n## NOUVELLE COMPOSITION APRÈS CONTRÔLE\n` +
        `La proposition précédente n’a pas respecté le contrat :\n${ecarts.slice(0, 16).join('\n')}\n` +
        `Recompose le plan COMPLET à partir du sujet et des documents ci-dessus, avec EXACTEMENT ${calibrage.exemple.reduce((a, b) => a + b, 0)} activités : ` +
        `${calibrage.exemple.length} étapes de respectivement ${calibrage.exemple.join(', ')} activité(s). ` +
        'Conserve les objectifs essentiels et la conclusion, regroupe les sous-tâches dans les consignes. ' +
        'Compte les cartes avant de répondre. Retourne uniquement le JSON complet.';
}

/** La reprise d'une réponse qui n'était pas un objet JSON. */
export function demandeDeJson(prompt) {
    return `${prompt}\n\n## NOUVELLE RÉPONSE\nTa réponse précédente n’était pas un objet JSON lisible. ` +
        'Retourne uniquement l’objet JSON complet, de `{` à `}`, sans texte ni bloc de code autour.';
}

/**
 * Compose le plan.
 *
 * @param {Object} o
 * @param {string} o.prompt - `construirePromptPlan(draft).prompt`.
 * @param {Object} o.calibrage
 * @param {Array} o.modules - Le catalogue autorisé.
 * @param {Function} o.appeler - `async (demande, essai) => texte` : la réponse brute du modèle.
 * @param {Function} o.lireJson - `async (texte) => objet` (lève si illisible).
 * @param {Object} [o.reparation] - Options de `reparerPlan` (résoudre, sujet, textes).
 * @param {Function} [o.surReprise] - Avant la reprise (le panneau d'attente le dit).
 * @param {Function} [o.continuer] - `() => boolean` après chaque réponse ; faux : on
 *        abandonne sans rien rendre (l'écran a changé). Elle peut lever (arrêt demandé).
 * @returns {Promise<null|{plan:Object|null, essais:number, erreurs:string[], corrections:string[]}>}
 *          `null` si abandonné ; `plan` nul si aucune réponse n'était un objet JSON.
 */
export async function composerAvecReprise({ prompt, calibrage, modules, appeler, lireJson,
    reparation = {}, surReprise = () => {}, continuer = () => true }) {
    const candidats = [];
    let demande = prompt;
    let essais = 0;
    for (let essai = 0; essai < 2; essai++) {
        const texte = await appeler(demande, essai);
        essais += 1;
        if (!continuer()) return null;
        let brut = null;
        try { brut = await lireJson(texte); } catch { brut = null; }
        if (!continuer()) return null;
        if (!brut || typeof brut !== 'object' || Array.isArray(brut)) {
            if (essai === 1) break;
            surReprise();
            demande = demandeDeJson(prompt);
            continue;
        }
        const { plan, corrections } = reparerPlan(brut, calibrage, modules, reparation);
        const erreurs = controlerCalibrage(plan, calibrage, modules);
        // Les remarques de composition ne comptent qu'à la première réponse :
        // elles demandent la reprise, jamais l'échec (D81).
        const remarques = essai === 0 ? remarquesComposition(plan) : [];
        candidats.push({ plan, erreurs, corrections });
        if ((!erreurs.length && !remarques.length) || essai === 1) break;
        surReprise();
        demande = demandeDeReprise(prompt, calibrage, [...erreurs, ...remarques]);
    }
    if (!candidats.length) return { plan: null, essais, erreurs: [], corrections: [] };
    // Le dernier recours sur chaque plan encore écarté, puis le moins écarté ;
    // à égalité, la reprise, composée en connaissant les écarts du premier.
    const finals = candidats.map(c => {
        if (!c.erreurs.length) return { ...c, gravite: 0 };
        const r = reparerPlan(c.plan, calibrage, modules, { ...reparation, dernierRecours: true });
        const erreurs = controlerCalibrage(r.plan, calibrage, modules);
        return { plan: r.plan, erreurs, corrections: [...c.corrections, ...r.corrections], gravite: graviteCadrage(erreurs) + erreurs.length / 100 };
    });
    const meilleur = finals.reduce((a, b) => (b.gravite <= a.gravite ? b : a));
    return { plan: meilleur.plan, essais, erreurs: meilleur.erreurs, corrections: meilleur.corrections };
}

/**
 * Un plan qu'on peut retenir : au moins une étape avec une activité.
 * @param {Object} plan - Le plan normalisé.
 */
export function planUtilisable(plan) {
    return Boolean(plan && Array.isArray(plan.etapes) && plan.etapes.some(e => Array.isArray(e.cartes) && e.cartes.length));
}
