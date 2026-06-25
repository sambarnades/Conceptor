/**
 * Utilitaires pour la manipulation d'objets JSON
 */

/**
 * Recupere une valeur imbriquee dans un objet a partir d'un chemin (ex: 'words.0.answer')
 * @param {Object} obj - L'objet source
 * @param {string} path - Le chemin vers la valeur
 * @returns {*} La valeur trouvee ou undefined
 */
export function getNestedValue(obj, path) {
    if (!path) return obj;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
    }
    return current;
}

/** Cles interdites dans un chemin (protection contre la pollution de prototype) */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Definit une valeur imbriquee dans un objet a partir d'un chemin
 * @param {Object} obj - L'objet source
 * @param {string} path - Le chemin vers la valeur
 * @param {*} value - La valeur a definir
 */
export function setNestedValue(obj, path, value) {
    if (!path) return;
    const keys = path.split('.');
    // Garde anti prototype pollution : on ignore tout chemin contenant une cle dangereuse
    if (keys.some(k => FORBIDDEN_KEYS.has(k))) return;
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
            // Creer l'objet ou le tableau manquant (ou remplacer une primitive)
            const nextKey = keys[i + 1];
            current[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
