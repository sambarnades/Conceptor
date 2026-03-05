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

    let result = template;
    for (const key in data) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        // Gère le caractère $ spécial dans les chaînes de remplacement
        const replacement = String(data[key]).replace(/\$/g, '$$$$');
        result = result.replace(regex, replacement);
    }
    return result;
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
