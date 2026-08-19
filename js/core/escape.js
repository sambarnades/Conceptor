/**
 * @file Échappement — SOURCE UNIQUE DE VÉRITÉ.
 *
 * Ce module regroupe les primitives d'échappement qui existaient auparavant en
 * ~20 copies divergentes sous les noms `escapeHtml`, `escapeText`, `esc`,
 * `escapeAllHtml`, `escapeXml`, `stripHtml`. Trois sémantiques incompatibles
 * cohabitaient sous le même nom `escapeHtml`, dont deux étaient **dangereuses en
 * contexte d'attribut** (l'une n'échappait pas `'`, l'autre — basée sur
 * `textContent`→`innerHTML` — n'échappait ni `"` ni `'`), et deux levaient un
 * `TypeError` sur une entrée non-chaîne.
 *
 * ⚠️ AUCUN import ici, volontairement : `core/utils.js`, `export/sanitizer.js` et
 * `ui/notifications.js` s'importent mutuellement ; un module d'échappement pur
 * peut être importé de partout sans créer de cycle.
 *
 * NB : `js/moodle/moodle-formats.js` conserve son propre `escapeXml`, qui n'est
 * PAS un doublon : il encode en plus TOUT caractère non-ASCII en référence
 * numérique (`&#233;`), ce qu'exige le XML des sauvegardes Moodle. Ne pas fusionner.
 */

// =======================================================================
// HTML
// =======================================================================

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/**
 * Échappe les cinq caractères significatifs en HTML.
 *
 * Échappe `"` et `'` en plus de `& < >` : le résultat est donc sûr AUSSI BIEN en
 * contenu de nœud texte qu'en valeur d'attribut (guillemets simples ou doubles).
 * C'est un sur-ensemble volontaire — dans un nœud texte, `&quot;` s'affiche `"`,
 * le rendu est identique, et on supprime la classe de bugs « helper choisi pour
 * du texte puis réutilisé dans un attribut ».
 *
 * Robuste à toute entrée : `null`/`undefined` → `''`, nombres et objets coercés
 * (les anciennes variantes levaient un `TypeError` sur un nombre, et `0`
 * devenait `''` à cause d'un test de véracité).
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
}

/**
 * Alias explicite d'`escapeHtml` pour les valeurs d'attribut.
 * Même implémentation ; le nom documente l'intention sur le site d'appel.
 * @param {*} value
 * @returns {string}
 */
export const escapeHtmlAttr = escapeHtml;

/**
 * Retire les balises HTML et normalise les espaces.
 * @param {*} value
 * @returns {string} Texte nu, espaces compactés, sans espaces de bord.
 */
export function stripHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// =======================================================================
// XML
// =======================================================================

const XML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
};

/**
 * Un code point est-il légal dans un document XML 1.0 ?
 *
 * Interdits : les caractères de contrôle C0 hors `\t` `\n` `\r`, les demi-codets
 * (surrogates) isolés, et les non-caractères U+FFFE / U+FFFF. Ces caractères ne
 * peuvent PAS être représentés en XML 1.0, même sous forme de référence
 * numérique — il faut les supprimer.
 *
 * @param {number} cp - Code point.
 * @returns {boolean}
 */
export function isXmlChar(cp) {
    if (cp === 0x09 || cp === 0x0A || cp === 0x0D) return true;
    if (cp < 0x20) return false;                       // autres contrôles C0
    if (cp >= 0xD800 && cp <= 0xDFFF) return false;    // demi-codets isolés
    if (cp === 0xFFFE || cp === 0xFFFF) return false;  // non-caractères
    return true;
}

/**
 * Échappe une valeur pour insertion dans du texte XML, ET supprime les
 * caractères illégaux en XML 1.0.
 *
 * Le filtrage des caractères de contrôle n'est pas cosmétique : un ``
 * présent dans une sortie de LLM et recopié tel quel produit un `.mbz` / `.odt`
 * que Moodle et LibreOffice REFUSENT d'ouvrir. Deux des anciennes copies
 * omettaient ce filtrage.
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeXml(value) {
    if (value === null || value === undefined) return '';
    let out = '';
    const s = String(value);
    for (const ch of s) {
        const cp = ch.codePointAt(0);
        if (!isXmlChar(cp)) continue;                  // caractère illégal → supprimé
        out += XML_ESCAPES[ch] || ch;
    }
    return out;
}
