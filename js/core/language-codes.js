/**
 * Codes de langue normalisés — source unique de vérité, partagée avec Sucrerie.
 *
 * Les clés de locale de Caramel/Sucrerie ne sont PAS toutes des codes de langue
 * valides : `jp` est un code PAYS (le japonais est `ja` en ISO 639-1) et `zh`
 * seul ne dit pas quelle variante. Les recopier tels quels produit un
 * `<html lang="jp">` invalide, que les synthèses vocales ignorent, et fait
 * chercher aux librairies un fichier de locale qui n'existe pas.
 *
 * Ce module était dupliqué en trois endroits (table privée de
 * `document-exporter.js`, table de `core/translation.js`, et écriture verbatim
 * du code de locale dans `editor/content-translate.js` côté Sucrerie) : deux des
 * trois se trompaient sur `jp`. D'où la centralisation ici.
 *
 * SANS AUCUN IMPORT, pour rester acyclique (`document-exporter.js` importe déjà
 * `core/translation.js` : la table ne pouvait donc pas vivre dans l'un des deux).
 * Même contrat que `core/escape.js`.
 *
 * Quatre sorties, parce que les consommateurs n'attendent pas le même format :
 *  - `language` : ISO 639-1 nu. C'est ce qu'attend `language` dans `h5p.json`,
 *    dont le validateur H5P impose /^[a-z]{1,5}$/ — un code à tiret y serait
 *    rejeté à l'import. Sert aussi à l'attribut `lang` du document.
 *  - `h5p`      : code de langue H5P, avec variante régionale là où H5P en a une
 *    (`zh-cn`). Alimente `defaultLanguage` de `h5p.json`, d'où h5p-standalone
 *    tire le `lang` de l'iframe du lecteur, ainsi que les champs `language` du
 *    `content.json` (locale TimelineJS, Cartes mémoires…).
 *  - `country` / `bcp47` : locale complète pour les exports documentaires
 *    (attribut de langue Word/ODT, qui veut `fr-FR` et non `fr`).
 *
 * @module core/language-codes
 */

/**
 * Locale de l'interface → codes normalisés.
 * @constant {Object<string, {language: string, country: string, bcp47: string, h5p: string}>}
 */
export const LANGUAGE_CODES = Object.freeze({
    fr: { language: 'fr', country: 'FR', bcp47: 'fr-FR', h5p: 'fr' },
    en: { language: 'en', country: 'GB', bcp47: 'en-GB', h5p: 'en' },
    es: { language: 'es', country: 'ES', bcp47: 'es-ES', h5p: 'es' },
    de: { language: 'de', country: 'DE', bcp47: 'de-DE', h5p: 'de' },
    it: { language: 'it', country: 'IT', bcp47: 'it-IT', h5p: 'it' },
    nl: { language: 'nl', country: 'NL', bcp47: 'nl-NL', h5p: 'nl' },
    pt: { language: 'pt', country: 'PT', bcp47: 'pt-PT', h5p: 'pt' },
    ar: { language: 'ar', country: 'SA', bcp47: 'ar-SA', h5p: 'ar' },
    zh: { language: 'zh', country: 'CN', bcp47: 'zh-CN', h5p: 'zh-cn' },
    jp: { language: 'ja', country: 'JP', bcp47: 'ja-JP', h5p: 'ja' },
    el: { language: 'el', country: 'GR', bcp47: 'el-GR', h5p: 'el' }
});

/**
 * Codes normalisés d'une locale.
 *
 * Locale inconnue → anglais : c'est la langue de repli de H5P lui-même, et un
 * code valide vaut mieux qu'un code inventé pour l'accessibilité. Les exports
 * documentaires conservent leur propre repli français à l'appel (`|| LANGUAGE_CODES.fr`).
 *
 * @param {string} locale - Clé de locale (ex: 'fr', 'jp').
 * @returns {{language: string, country: string, bcp47: string, h5p: string}}
 */
export function languageCodes(locale) {
    return LANGUAGE_CODES[locale] || LANGUAGE_CODES.en;
}
