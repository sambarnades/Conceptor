/**
 * @file Helpers PARTAGÉS par les quatre thèmes de Page (elea, dsfr, accessible, dynamique).
 *
 * Les thèmes restent volontairement autonomes pour leur mise en forme : chacun a sa
 * propre palette et ses propres styles inline, et c'est ce qui fait leur intérêt.
 * En revanche, les helpers PURS (aucune couleur, aucun style) n'ont aucune raison
 * d'exister en quatre exemplaires — un correctif n'y atterrissait qu'une fois sur quatre.
 *
 * Garde-fou de non-régression : `node tests/run_page_themes_oracle.mjs`, qui rend les
 * 4 × 18 blocs dans un vrai DOM et compare les sha256 à une baseline.
 */

/**
 * Choisit la balise d'enveloppe adaptée à un fragment HTML.
 *
 * Renvoie `'div'` si le fragment contient déjà un `<p>`, `'p'` sinon. Motif : un
 * `<p>` imbriqué dans un `<p>` est invalide — le parseur HTML ferme alors le
 * paragraphe parent, ce qui casse la mise en page dans Moodle/Éléa.
 *
 * @param {string} html - Fragment HTML déjà mis en forme.
 * @returns {'div'|'p'}
 */
export function safeTag(html) {
    return /<p[\s>]/i.test(html) ? 'div' : 'p';
}
