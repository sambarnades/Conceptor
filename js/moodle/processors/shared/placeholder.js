/**
 * @file Utilitaires pour le remplacement des placeholders dans les templates XML.
 * Les placeholders suivent le format {{NOM_VARIABLE}}.
 */

/**
 * Remplace tous les placeholders {{VARIABLE}} dans une chaîne template.
 * @param {string} template - Le template avec des placeholders
 * @param {Object} data - Les paires clé-valeur pour le remplacement
 * @returns {string} La chaîne avec les placeholders remplacés
 */
export function replacePlaceholders(template, data) {
    if (!template) return template;

    // Passe UNIQUE sur le template : chaque {{CLÉ}} présent DANS LE TEMPLATE est
    // remplacé au plus une fois par sa valeur, et les valeurs insérées ne sont
    // JAMAIS re-scannées. Conséquence : un {{AUTRE_CLÉ}} tapé par l'utilisateur
    // dans une valeur (intro, titre, JSON d'associations…) reste LITTÉRAL au lieu
    // d'être ré-substitué par une autre donnée (collision de placeholders qui
    // pouvait injecter du markup brut ou corrompre le texte selon l'ordre des clés).
    // La forme « fonction de remplacement » neutralise aussi les motifs spéciaux
    // ($1, $&, $$…) dans les valeurs — plus besoin d'échapper les $ manuellement.
    return String(template).replace(/\{\{(\w+)\}\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : match
    );
}

/**
 * Extrait tous les noms de placeholders d'un template.
 * @param {string} template - Le template à analyser
 * @returns {string[]} Tableau des noms de placeholders uniques
 */
export function extractPlaceholders(template) {
    if (!template) return [];
    const matches = template.matchAll(/\{\{(\w+)\}\}/g);
    return [...new Set([...matches].map(m => m[1]))];
}

/**
 * Valide que tous les placeholders d'un template ont des données correspondantes.
 * @param {string} template - Le template à valider
 * @param {Object} data - Les données de remplacement
 * @returns {{ valid: boolean, missing: string[] }} Résultat de validation
 */
export function validatePlaceholders(template, data) {
    const placeholders = extractPlaceholders(template);
    const missing = placeholders.filter(p => !(p in data));
    return { valid: missing.length === 0, missing };
}
