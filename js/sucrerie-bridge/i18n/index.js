/**
 * Mini-loader i18n autonome pour le pont Sucrerie.
 *
 * N'écrit rien dans le système i18n de l'app hôte — clés isolées dans le dossier
 * i18n du pont, préfixe `sucrerie_bridge_*`. Source unique de la langue :
 * `document.documentElement.lang` (mis à jour par le sélecteur de langue de
 * l'hôte, quel qu'il soit : Caramel, Sucrerie, aManDe). Le cache est indexé par
 * langue, donc changer `lang` puis rappeler `loadTranslations()` charge
 * automatiquement le pack correspondant. Le pont écoute ce changement via
 * MutationObserver dans `index.js`.
 *
 * Toute langue inconnue retombe sur FR (puis sur `{}` si même FR échoue).
 */

const _cache = new Map();           // lang -> dict (figé une fois chargé)
const _loadingPromises = new Map(); // lang -> Promise<dict> en cours

function getCurrentLang() {
    return (document.documentElement.lang || 'fr').toLowerCase().split('-')[0];
}

/**
 * Charge le pack de traductions correspondant à la langue courante.
 * Re-lit `document.documentElement.lang` à chaque appel : suit donc le
 * sélecteur de langue de l'hôte sans recompilation ni invalidation manuelle.
 * @returns {Promise<Object>} dictionnaire clé→texte
 */
export function loadTranslations() {
    const lang = getCurrentLang();
    if (_cache.has(lang)) return Promise.resolve(_cache.get(lang));
    if (_loadingPromises.has(lang)) return _loadingPromises.get(lang);

    const promise = fetchLocale(lang)
        .catch(() => (lang === 'fr' ? {} : fetchLocale('fr').catch(() => ({}))))
        .then(data => {
            const dict = data || {};
            _cache.set(lang, dict);
            _loadingPromises.delete(lang);
            return dict;
        });

    _loadingPromises.set(lang, promise);
    return promise;
}

async function fetchLocale(lang) {
    const url = new URL(`./${lang}.json`, import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`locale ${lang} not found`);
    return res.json();
}

/**
 * Récupère une clé traduite avec fallback sur la clé brute.
 * @param {string} key
 * @param {Object} translations
 * @returns {string}
 */
export function t(key, translations) {
    if (translations && Object.prototype.hasOwnProperty.call(translations, key)) {
        return translations[key];
    }
    return key;
}
