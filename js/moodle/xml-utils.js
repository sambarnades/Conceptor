/** Helpers XML communs aux lecteurs Moodle des deux sites. */
/**
 * Parse un XML, lève si invalide.
 * @param {string} str
 * @returns {Document}
 */
export function parseXml(str) {
    const doc = new DOMParser().parseFromString(str, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('mbz_xml_invalid:' + err.textContent.slice(0, 120));
    return doc;
}

/**
 * Récupère le textContent du premier nœud matchant le sélecteur (ou '').
 */
export const tagText = (doc, sel) => doc.querySelector(sel)?.textContent ?? '';

/**
 * Échappe les caractères XML.
 * Supprime aussi les caractères illégaux en XML 1.0 (contrôles C0 hors \t \n \r,
 * demi-codets isolés, non-caractères) : un seul suffit à faire rejeter le .mbz à
 * l'import. Implémentation canonique dans `core/escape.js` — ré-exportée ici pour
 * ne pas changer les ~9 imports existants.
 */
export { escapeXml } from '../core/escape.js';

/**
 * Remplace le contenu du premier `<tag>...</tag>` trouvé (non récursif).
 * Utile pour patcher un XML existant sans le re-sérialiser entièrement.
 */
export function rewriteTag(xml, tag, newInner) {
    // LEC-14 : (1) on échappe les métacaractères du nom de balise (anti-injection
    // regex), (2) on tolère des attributs sur la balise ouvrante `<tag attr="…">`,
    // (3) on passe par une fonction de remplacement pour que les `$` éventuels de
    // `newInner` (JSON sérialisé) ne soient PAS interprétés comme motifs ($1, $&…).
    const t = String(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<${t}(?:\\s[^>]*)?>)[\\s\\S]*?(</${t}>)`);
    return xml.replace(re, (_m, open, close) => open + newInner + close);
}

/**
 * Strippe les `<p>...</p>` enveloppants (un seul niveau) — utile pour
 * réinjecter du HTML Moodle dans un textarea sans paragraphe parasite.
 */
export function stripParagraphWrap(html) {
    if (!html) return '';
    const m = html.match(/^\s*<p[^>]*>([\s\S]*?)<\/p>\s*$/i);
    // LEC-14 : ne stripper que si UN SEUL paragraphe enveloppe tout le contenu.
    // Une capture contenant `</p>` ou `<p…` = plusieurs paragraphes → on laisse
    // intact, sinon corruption round-trip (`<p>A</p><p>B</p>` → `A</p><p>B`).
    if (m && !/<\/p>|<p[\s>]/i.test(m[1])) return m[1];
    return html;
}

/**
 * Wrappe un texte dans `<p>...</p>` s'il ne l'est pas déjà.
 */
export function wrapP(text) {
    if (!text) return '';
    return /^\s*<p[\s>]/i.test(text) ? text : `<p>${text}</p>`;
}
