/**
 * Processeur H5P — Diagramme
 *
 * Passe-travers minimal : retourne le JSON d'entrée sans modification.
 * Le JSON généré par l'IA est déjà au format H5P.Chart attendu.
 *
 * @module processors/Chart
 * @exports {Object} default.process - Retourne le JSON tel quel
 */
export default {
    process: (jsonObj) => {
        return { ...jsonObj };
    }
};
