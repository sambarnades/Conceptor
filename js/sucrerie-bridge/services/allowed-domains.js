/**
 * Client de l'endpoint `/sucrerie-allowed-domains` (workflow B) + matching local.
 *
 * POURQUOI CE MODULE EXISTE (régression 2026-08-16)
 * ─────────────────────────────────────────────────
 * Le pont validait l'email avec une regex FIGÉE dans `config.js` :
 *
 *     /^[^\s@]+@(ac-[a-z-]+\.fr|education\.gouv\.fr|region-academique-[a-z-]+\.fr|reseau-canope\.fr)$/i
 *
 * Elle était « alignée à l'identique sur la regex backend Sucrerie » — vrai au
 * moment où elle a été écrite, faux depuis que la Sucrerie est passée à la table
 * `sucrerie.allowed_domain` (migrations 2026-05-13 puis 2026-06-02). La regex n'a
 * pas suivi : au 2026-08-16 elle refusait 30 des 79 patterns RÉELLEMENT autorisés,
 * dont les trois académies d'outre-mer hors `.fr` (`ac-noumea.nc`, `ac-polynesie.pf`,
 * `ac-wf.wf`, plus `education.pf`), toutes les universités (`sorbonne-universite.fr`,
 * `u-paris.fr`, `unige.ch`, `uqtr.ca`…), la Belgique (`cfwb.be`, `efp.be`,
 * `formaform.be`) et les accès nominatifs.
 *
 * Et le refus était un blocage DUR côté pont (`return` sans jamais appeler le
 * backend) : une enseignante de l'académie de Nouvelle-Calédonie, parfaitement
 * autorisée, se voyait proposer un formulaire de demande d'accès comme seule issue.
 * Cas réel : une demande d'accès reçue le 2026-08-04 pour une adresse whitelistée
 * depuis le 2026-06-02.
 *
 * LA LEÇON : ne jamais recopier une whitelist. On lit la source, en live.
 * L'endpoint est public, `Access-Control-Allow-Origin: *`, `Cache-Control: 300 s`.
 *
 * Miroir de `sucrerie/assets/js/core/allowed-domain.js` (matching) et de
 * `sucrerie/assets/js/core/config.js > ensureAllowedDomainsLoaded` (chargement).
 * Le backend (workflow C, nœud « Sucrerie - Preparer publication ») revalide de
 * toute façon : ici c'est de l'UX, pas un contrôle de sécurité.
 *
 * Tests : node tests/run_sucrerie_allowed_domains.mjs
 */

import { SUCRERIE_BRIDGE } from '../config.js';

/**
 * @typedef {Object} AllowedDomain
 * @property {string} pattern - Ex: 'ac-noumea.nc', 'education.gouv.fr', 'jean@example.fr'
 * @property {'exact'|'suffix'} kind
 */

let _cache = null;
let _loadPromise = null;

/** Échappe les méta-caractères regex sauf `*` (qui devient un wildcard). */
function escapeRegexExceptStar(s) {
    return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

/** `ac-*.fr` → source regex ; `*` matche `[a-z0-9-]+` (pas de point). */
function suffixPatternToRegexSource(pattern) {
    return escapeRegexExceptStar(pattern).replace(/\*/g, '[a-z0-9-]+');
}

/**
 * Teste un email (déjà normalisé trim+lowercase) contre UN pattern.
 *
 * `kind='exact'` a DEUX sémantiques selon la présence d'un `@` :
 *   - sans `@` (`ac-noumea.nc`)      → tout le domaine  (`endsWith('@' + pattern)`)
 *   - avec `@` (`josepgalan@ivic.cat`) → cette adresse SEULE (égalité stricte)
 *
 * @param {string} email
 * @param {AllowedDomain} domain
 * @returns {boolean}
 */
export function matchSingleDomain(email, domain) {
    if (!email || !domain || !domain.pattern || !domain.kind) return false;
    const pattern = domain.pattern.trim().toLowerCase();

    if (domain.kind === 'exact') {
        if (pattern.includes('@')) return email === pattern;
        return email.endsWith('@' + pattern);
    }

    if (domain.kind === 'suffix') {
        const hasAt = pattern.includes('@');
        const parts = hasAt ? pattern.split('@', 2) : ['', pattern];
        const localSrc = hasAt ? suffixPatternToRegexSource(parts[0]) : '[^\\s@]+';
        const domainSrc = suffixPatternToRegexSource(hasAt ? parts[1] : pattern);
        return new RegExp('^' + localSrc + '@' + domainSrc + '$', 'i').test(email);
    }

    return false;
}

/**
 * Teste un email contre la liste complète.
 * @param {string} email
 * @param {Array<AllowedDomain>} domains
 * @returns {boolean}
 */
export function matchAgainstDomains(email, domains) {
    if (!email || typeof email !== 'string') return false;
    if (!Array.isArray(domains) || domains.length === 0) return false;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return false;
    return domains.some(d => matchSingleDomain(normalized, d));
}

/**
 * Charge la whitelist (mémoïsée, une seule requête par session de page).
 *
 * En cas d'échec — y compris timeout — on NE met PAS en cache et on relâche la
 * promesse mémoïsée : un nouvel essai partira au prochain appel. Sans ce
 * relâchement, un backend qui ouvre la connexion sans répondre figerait la
 * promesse POUR TOUJOURS (BUG-10 côté Sucrerie, même correctif).
 *
 * @returns {Promise<Array<AllowedDomain>>} liste, ou [] si indisponible
 */
export function ensureAllowedDomainsLoaded() {
    if (_cache) return Promise.resolve(_cache);
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
        const url = SUCRERIE_BRIDGE.endpoints.allowedDomains;
        if (!url) { _loadPromise = null; return []; }
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: ctrl.signal
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const list = Array.isArray(data) ? data
                : (data && Array.isArray(data.domains) ? data.domains : null);
            if (!list || list.length === 0) throw new Error('Empty domains list');
            const sanitized = list
                .filter(d => d && typeof d.pattern === 'string' && (d.kind === 'exact' || d.kind === 'suffix'))
                .map(d => ({ pattern: d.pattern, kind: d.kind }));
            if (sanitized.length === 0) throw new Error('No valid domain entry');
            _cache = sanitized;
            return _cache;
        } catch {
            _loadPromise = null;   // relâche → retry possible
            return [];
        } finally {
            clearTimeout(timer);
        }
    })();

    return _loadPromise;
}

/**
 * La whitelist est-elle chargée ? Sert à décider si le pont a le DROIT de
 * bloquer localement : sans liste, il ne bloque pas et laisse le backend
 * (authoritative) trancher — plutôt que d'inventer un refus (cf. deposit-flow).
 * @returns {boolean}
 */
export function areAllowedDomainsLoaded() {
    return Array.isArray(_cache) && _cache.length > 0;
}

/**
 * Validation UX d'un email contre la whitelist courante. **Fail-closed** :
 * liste non chargée → `false`. À toujours lire AVEC `areAllowedDomainsLoaded()`
 * pour distinguer « refusé » de « pas encore su ».
 * @param {string} email
 * @returns {boolean}
 */
export function isEmailAllowed(email) {
    return matchAgainstDomains(email, _cache || []);
}

/** Remise à zéro — réservée aux tests. */
export function _resetAllowedDomainsCache() {
    _cache = null;
    _loadPromise = null;
}
