/**
 * Pré-filtre profanity client-side.
 *
 * Charge en lazy une wordlist par langue (LDNOOBW snapshot, cf.
 * `vendor/profanity/v1/README.md`) et expose `testProfanity(text, lang)` qui
 * retourne le 1er terme matché ou `null`. Permet de bloquer immédiatement les
 * insultes évidentes côté frontend, sans round-trip au LLM de modération.
 *
 * Les wordlists sont mutualisées (Map en mémoire) — un seul fetch par langue
 * pendant toute la durée de vie du module. La taille moyenne d'une liste est
 * de ~1-4 KB, charge négligeable.
 *
 * Le matching :
 *   - Insensible à la casse
 *   - Word-boundary `\b` pour les langues à espaces (fr/en/es/de/it/nl/pt/ar/el)
 *   - Substring simple pour les langues sans espaces (zh/ja) — `\b` n'a pas
 *     de sens pour des idéogrammes
 *
 * Normalisation anti-contournement (cf. `normalize()` plus bas) appliquée à
 * la fois aux termes de la wordlist (au moment de la compilation) et au texte
 * testé. Couvre : casse, diacritiques (`çōnnárd`), confusables cyrilliques
 * (`сonnard`), leetspeak basique (`c0nn4rd`), séparateurs entre lettres
 * (`c.o.n.n.a.r.d`, `c o n n a r d`). Invisible pour l'utilisateur — son texte
 * d'origine reste intact, on ne normalise qu'une copie temporaire pour le match.
 *
 * Si la langue demandée n'a pas de wordlist (404, fetch échoué, …), la
 * fonction retourne `null` silencieusement — la modération LLM côté workflow
 * prend le relais comme filet.
 */

import { SUCRERIE_BRIDGE } from '../config.js';

const PROFANITY_VERSION = 'v1';

/** Langues supportées par cette version (cf. vendor/profanity/v1/). */
const SUPPORTED_LANGS = new Set(['fr','en','es','de','it','nl','pt','ar','zh','ja','el']);

/** Mapping locale Caramel → code wordlist LDNOOBW (Caramel utilise 'jp', LDNOOBW 'ja'). */
const LANG_ALIAS = { jp: 'ja' };

/**
 * Langues écrites sans espaces : on n'utilise pas `\b` pour matcher mais une
 * recherche substring (les frontières de mots n'ont pas de sens en CJK).
 */
const NO_BOUNDARY_LANGS = new Set(['zh', 'ja']);

/**
 * Langues à écriture latine. C'est sur ce sous-ensemble qu'on applique les
 * traitements anti-contournement spécifiques au latin : confusables cyrilliques,
 * leetspeak, collapse de séparateurs entre lettres.
 */
const LATIN_LANGS = new Set(['fr', 'en', 'es', 'de', 'it', 'nl', 'pt']);

/**
 * Mapping confusables Cyrillique → Latin. Couvre les lettres cyrilliques
 * dont le glyphe est visuellement identique ou quasi-identique à une lettre
 * latine, et qu'un attaquant peut donc utiliser pour échapper au filtre
 * (ex. `сonnard` avec un `с` cyrillique U+0441). Limité au latin ; on
 * n'applique pas ce mapping aux wordlists `el`/`ar` dont l'écriture est
 * censée rester dans son alphabet d'origine.
 */
const CONFUSABLE_TO_LATIN = {
    'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x','і':'i','ј':'j',
    'ѕ':'s','к':'k','м':'m','н':'h','т':'t','в':'b','ԁ':'d','ɡ':'g','ո':'n',
    'ӏ':'l'
};
const CONFUSABLE_REGEX = new RegExp('[' + Object.keys(CONFUSABLE_TO_LATIN).join('') + ']', 'g');

/** Substitutions leetspeak basiques. Volontairement minimal pour éviter les
 *  faux positifs trop agressifs (ex. on ne mappe pas `8→b`). */
const LEET_MAP = { '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '@':'a', '$':'s' };
const LEET_REGEX = /[013457@$]/g;

/** Cache : code langue normalisé → instance compilée { regex, hasFallbackSet } | null si absent. */
const _cache = new Map();
/** Promesses en vol pour éviter les fetchs concurrents pour la même langue. */
const _inflight = new Map();

/**
 * Normalise un code langue Caramel/aManDe vers le slug wordlist supporté.
 * Retourne null si non supporté → l'appelant doit bypasser silencieusement.
 */
function normalizeLang(lang) {
    if (!lang) return null;
    const lower = String(lang).toLowerCase().split('-')[0];
    const aliased = LANG_ALIAS[lower] || lower;
    return SUPPORTED_LANGS.has(aliased) ? aliased : null;
}

/**
 * Construit l'URL absolue de la wordlist pour la version courante. Utilise
 * `import.meta.url` pour résoudre par rapport au module, ce qui marche que
 * Caramel serve depuis localhost ou depuis un sous-dossier de prod.
 */
function buildWordlistUrl(lang) {
    return new URL(`../vendor/profanity/${PROFANITY_VERSION}/${lang}.txt`, import.meta.url).href;
}

/**
 * Échappe les caractères regex spéciaux dans un terme.
 */
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalisation anti-contournement. Renvoie une représentation canonique du
 * texte d'entrée pour la comparaison contre la wordlist. Invisible côté UI :
 * on ne touche jamais au texte saisi par l'utilisateur, c'est une copie locale
 * utilisée uniquement pour le match. Le code langue est supposé déjà normalisé
 * (cf. `normalizeLang()`).
 *
 *   1. CJK (zh/ja) : NFKC seul (fullwidth → halfwidth), pas de leet/confusable.
 *   2. Arabe : NFKC + suppression des diacritiques arabes (tashkeel).
 *   3. Grec : NFKD + strip combining marks + lowercase. Pas de mapping
 *      confusable (la wordlist EST en grec).
 *   4. Latin : NFKD + strip combining marks + lowercase + confusables Cyril.
 *      → Latin + leetspeak + collapse séparateurs entre lettres.
 *
 * Le collapse de séparateurs ne s'active que si la séquence "lettre-sep-lettre"
 * se répète AU MOINS deux fois consécutives (`f.u.c.k`, `c o n n a r d`), pour
 * ne pas écraser le simple espace entre deux mots normaux (`tu connard` reste
 * deux mots).
 */
export function normalize(text, lang) {
    let s = String(text);
    if (!s) return s;

    if (lang === 'zh' || lang === 'ja') {
        return s.normalize('NFKC');
    }

    if (lang === 'ar') {
        return s.normalize('NFKC').replace(/[ً-ٰٟ]/g, '');
    }

    s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

    if (LATIN_LANGS.has(lang)) {
        s = s.replace(CONFUSABLE_REGEX, c => CONFUSABLE_TO_LATIN[c] || c);
        s = s.replace(LEET_REGEX, c => LEET_MAP[c] || c);
        // \b en tête : on ne déclenche le collapse que si la séquence commence
        // sur une vraie frontière de mot, sinon `tu c.o.n.n.a.r.d` → `tuconnard`
        // (le ` c` aurait été happé) et le `\bconnard\b` du matcher principal
        // ne matcherait plus rien.
        s = s.replace(/\b[a-z](?:[\s.\-_*'·•][a-z]){2,}/g, m => m.replace(/[\s.\-_*'·•]+/g, ''));
    }

    return s;
}

/**
 * Compile une wordlist (texte brut, un terme par ligne) en `RegExp` matchable.
 * Les termes sont triés par longueur décroissante pour que les variantes
 * longues (ex. "fils de pute") soient matchées avant les courtes ("pute").
 *
 * Les termes sont passés par `normalize()` pour qu'ils s'alignent avec le
 * texte d'entrée — qui sera lui aussi normalisé au moment du test. Sans
 * cette double normalisation, un terme contenant un diacritique (ex. liste
 * espagnole `coño`) ne matcherait jamais une entrée normalisée (`cono`).
 */
export function compileWordlist(text, lang) {
    const raw = text
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('#'));
    if (raw.length === 0) return null;

    const terms = Array.from(new Set(
        raw.map(t => normalize(t, lang)).filter(t => t.length > 0)
    ));
    if (terms.length === 0) return null;

    terms.sort((a, b) => b.length - a.length);
    const escaped = terms.map(escapeRegex);
    // Frontière Unicode-aware (`\p{L}` / `\p{N}`) plutôt que `\b` ASCII : `\b`
    // ne se déclenche pas entre une lettre grecque/arabe et un espace (les
    // caractères non-latins ne sont pas dans `\w`), ce qui rendait le matcher
    // silencieusement borgne pour `el` et `ar`.
    // Frontière GAUCHE sans lookbehind (Safari < 16.4 jette une SyntaxError sur
    // `(?<!...)` à la compilation du RegExp) : on consomme le caractère précédent
    // via un groupe NON capturant `(?:^|[^\p{L}\p{N}])` — le terme matché reste
    // donc en groupe 1, et le résultat est identique au lookbehind pour un
    // `match()` non global (premier terme trouvé).
    const pattern = NO_BOUNDARY_LANGS.has(lang)
        ? `(${escaped.join('|')})`
        : `(?:^|[^\\p{L}\\p{N}])(${escaped.join('|')})(?![\\p{L}\\p{N}])`;
    return new RegExp(pattern, 'iu');
}

/**
 * Charge (avec cache) la wordlist d'une langue. Renvoie `null` si non supporté
 * ou en cas d'échec réseau. Idempotent — multiple appels concurrents partagent
 * la même promesse en vol.
 */
async function loadWordlist(lang) {
    const norm = normalizeLang(lang);
    if (!norm) return null;
    if (_cache.has(norm)) return _cache.get(norm);
    if (_inflight.has(norm)) return _inflight.get(norm);

    const promise = (async () => {
        try {
            const res = await fetch(buildWordlistUrl(norm), { cache: 'force-cache' });
            if (!res.ok) {
                _cache.set(norm, null);
                return null;
            }
            const text = await res.text();
            const compiled = compileWordlist(text, norm);
            _cache.set(norm, compiled);
            return compiled;
        } catch {
            _cache.set(norm, null);
            return null;
        } finally {
            _inflight.delete(norm);
        }
    })();
    _inflight.set(norm, promise);
    return promise;
}

/**
 * Pré-charge en arrière-plan la wordlist d'une langue (à appeler dès qu'on
 * connaît la langue de l'activité, pour minimiser la latence sur la 1ʳᵉ frappe).
 */
export function preloadProfanityList(lang) {
    loadWordlist(lang); // fire-and-forget
}

/**
 * Teste un texte contre la wordlist d'une langue. Retourne le 1er terme
 * matché (string) ou `null` si rien ne matche / langue non supportée.
 *
 * @param {string} text
 * @param {string} lang  - code Caramel ('fr', 'en', 'jp', …)
 * @returns {Promise<string|null>}
 */
export async function testProfanity(text, lang) {
    if (!text) return null;
    const compiled = await loadWordlist(lang);
    if (!compiled) return null;
    const norm = normalizeLang(lang);
    const probe = norm ? normalize(text, norm) : String(text);
    const m = probe.match(compiled);
    return m ? m[1] || m[0] : null;
}

/**
 * Variante synchrone : teste UNIQUEMENT si la wordlist est déjà chargée en
 * cache. Utile dans les hot paths (debounce 800 ms) où on veut éviter
 * d'attendre un fetch à chaque frappe — si pas en cache, on retourne null et
 * on déclenche le préchargement en arrière-plan.
 */
export function testProfanitySync(text, lang) {
    if (!text) return null;
    const norm = normalizeLang(lang);
    if (!norm) return null;
    const compiled = _cache.get(norm);
    if (!compiled) {
        // Pas en cache → on précharge pour la prochaine frappe
        if (compiled !== null) loadWordlist(norm);
        return null;
    }
    const m = normalize(text, norm).match(compiled);
    return m ? m[1] || m[0] : null;
}

/**
 * Indique si une wordlist est déjà compilée en mémoire (utile pour les tests
 * et le debug).
 */
export function isProfanityListReady(lang) {
    const norm = normalizeLang(lang);
    if (!norm) return false;
    return _cache.has(norm) && _cache.get(norm) !== null;
}

// Note : SUCRERIE_BRIDGE est importé pour signaler l'intention "ce module
// appartient au bridge" même s'il n'est pas utilisé directement — utile pour
// les futurs hooks (ex. désactiver le filtre via SUCRERIE_BRIDGE.profanityEnabled).
void SUCRERIE_BRIDGE;
