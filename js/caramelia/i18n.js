/**
 * Caramelia — Internationalisation
 * Suit la langue de Caramel (currentLang depuis core/translation.js).
 * Les locales Caramelia sont chargées depuis js/caramelia/locales/{lang}.json.
 *
 * Stratégie : recharge la locale à chaque ouverture du panel si la langue
 * Caramel a changé entre-temps.
 *
 * @module caramelia/i18n
 */

import { currentLang, t as caramelT } from '../core/translation.js';
import { CONFIG } from './config.js';

const SUPPORTED = ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br'];
const FALLBACK = 'fr';

let translations = {};
let loadedLang = null;

/**
 * Charge la locale demandée. Idempotent : ne refait rien si déjà chargée.
 * Fallback automatique sur fr si la langue n'est pas supportée ou si fetch échoue.
 */
export async function loadLocale(lang) {
    const target = SUPPORTED.includes(lang) ? lang : FALLBACK;
    if (target === loadedLang) return;
    try {
        const res = await fetch(`js/caramelia/locales/${target}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        translations = await res.json();
        loadedLang = target;
    } catch (err) {
        console.warn(`[Caramelia] i18n: échec chargement ${target}, fallback ${FALLBACK}`, err);
        if (target !== FALLBACK) await loadLocale(FALLBACK);
    }
}

/**
 * Recharge si la langue Caramel a changé. À appeler à l'ouverture du panel.
 */
export async function syncLocale() {
    if (currentLang !== loadedLang) await loadLocale(currentLang);
}

/**
 * Récupère une chaîne traduite avec interpolation {var}.
 * Retourne la clé brute si introuvable (utile en debug).
 */
export function t(key, vars = {}) {
    let str = translations[key];
    if (str === undefined) {
        console.warn(`[Caramelia] clé i18n manquante: ${key} (lang: ${loadedLang})`);
        return key;
    }
    for (const [k, v] of Object.entries(vars)) {
        str = str.split(`{${k}}`).join(v ?? '');
    }
    return str;
}

/**
 * Retourne la langue actuellement chargée pour Caramelia.
 */
export function getLang() {
    return loadedLang || FALLBACK;
}

/**
 * Nom complet de la langue (utilisé dans les prompts LLM).
 */
export function getLangFullName() {
    return t('lang_full_name');
}

/**
 * Récupère le nom officiel d'une activité depuis le système de traduction
 * de Caramel principal (single source of truth), avec un suffixe de plateforme.
 *
 * Fallback : la clé activity_X de Caramelia si le mapping ou la clé Caramel
 * sont absents (devrait rester rare en pratique).
 *
 * @param {string} moduleKey - Clé Caramelia (ex: "Flashcards", "QCM")
 * @param {object} [opts]
 * @param {boolean} [opts.suffix=true] - Ajouter le suffixe (H5P) / (Éléa)
 * @returns {string}
 */
export function tActivity(moduleKey, { suffix = true } = {}) {
    const map = CONFIG.activityCaramelMap[moduleKey];
    if (!map) return t(`activity_${moduleKey}`);

    let name = caramelT(map.caramelKey);
    // Caramel renvoie la clé brute si non trouvée → fallback Caramelia
    if (!name || name === map.caramelKey) {
        name = t(`activity_${moduleKey}`);
    }
    if (suffix && CONFIG.platformSuffix[map.platform]) {
        name += CONFIG.platformSuffix[map.platform];
    }
    return name;
}
