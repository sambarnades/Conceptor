/**
 * Configuration du pont Caramel ↔ La Sucrerie.
 *
 * `enabled` est le kill switch :
 *   - `true`  : le bouton est injecté dans le footer de la modale de visualisation.
 *   - `false` : `mountSucrerieButton` est un no-op total (aucun DOM créé, aucun fetch).
 *
 * Pour désactiver le bouton sans toucher au reste du code (ex. avant un test
 * collègues), passer `enabled: false` puis push.
 *
 * Les endpoints pointent sur la prod Sucrerie (workflow n8n unifié multi-sites).
 * Quand un endpoint dev sera disponible, find-replace ici uniquement.
 *
 * NB : ces URLs ne sont VOLONTAIREMENT pas dans le registre central
 * js/core/endpoints.js — ce dossier est miroir byte-identique vers aManDe et ne
 * peut pas importer un module Caramel-spécifique. Elles restent gérées ici.
 */
export const SUCRERIE_BRIDGE = Object.freeze({
    enabled: true,

    // Identifiant du site hôte — propagé dans le payload de publication
    // (champs `source` / `submitted_via`). Seule clé autorisée à diverger
    // entre Caramel et aManDe pour que le dossier sucrerie-bridge reste
    // strictement identique partout ailleurs.
    sourceId: 'caramel',

    endpoints: Object.freeze({
        // Refonte 2026-05-24 : `/sucrerie-enrich` est passé en async (pattern
        // Caramel à 4 workflows). Submit répond { taskId, status: 'pending' }
        // en ~100 ms ; le client polle `enrichResult` toutes les 3 s jusqu'à
        // status: 'done' | 'error'. Les services services/enrich.js et
        // services/recheck.js détectent automatiquement le mode (présence
        // d'un taskId dans la réponse Submit = async, sinon legacy sync).
        enrich:       'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-enrich',
        enrichResult: 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-enrich-result',
        publish:      'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-publish',
        // Demande d'accès (email pro non whitelisté) — même endpoint que la modale
        // Story C1 de la Sucrerie. Soumis depuis la modale intégrée au pont.
        accessRequest:'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-access-request',
        // Lookup « le compte existe-t-il ? » (workflow D). Décide si le formulaire
        // de dépôt redemande prénom/nom (compte nouveau) ou seulement la signature
        // publique « Nom d'auteur·rice » (compte connu). Réponse minimale
        // { exists:boolean }, zéro PII. Échec réseau → exists:false (jamais bloquant).
        profileLookup:'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-profile-lookup',
        // Whitelist des domaines email autorisés au dépôt (workflow B, lecture
        // directe de la table `sucrerie.allowed_domain`). Public, CORS `*`,
        // Cache-Control 300 s. Consommé par services/allowed-domains.js — qui a
        // REMPLACÉ la regex figée `emailDomainPattern` (voir l'en-tête de ce
        // service : elle avait dérivé et refusait 30 des 79 domaines réellement
        // autorisés, dont l'académie de Nouvelle-Calédonie).
        allowedDomains:'https://n8n-caramel.osc-fr1.scalingo.io/webhook/sucrerie-allowed-domains'
    }),

    // URL publique d'une activité Sucrerie une fois publiée (consommée pour
    // afficher un lien "Voir dans le catalogue" sur l'écran de succès).
    viewUrlPattern: 'https://sucrerie.forge.apps.education.fr/?id={public_id}',

    // ⚠️ `emailDomainPattern` a été SUPPRIMÉ le 2026-08-16. C'était une copie
    // figée de la whitelist ; elle a dérivé de la base et bloquait des
    // enseignants autorisés (détail dans services/allowed-domains.js).
    // Toute validation d'email passe désormais par ce service, qui lit
    // l'endpoint `allowedDomains` en live. NE PAS réintroduire de liste en dur.

    // Domaines de l'Éducation nationale française hors `.fr` — académies
    // d'outre-mer. Sert UNIQUEMENT à la pré-sélection du système éducatif
    // (heuristique cosmétique, écrasable par l'IA et par l'utilisateur), jamais
    // à autoriser quoi que ce soit.
    frenchEducationExtraDomains: Object.freeze([
        'ac-noumea.nc', 'ac-polynesie.pf', 'ac-wf.wf', 'education.pf'
    ]),

    // Préfixe sessionStorage propre au pont (évite collision avec `caramel_*` existant)
    storagePrefix: 'caramel_sucrerie_'
});
