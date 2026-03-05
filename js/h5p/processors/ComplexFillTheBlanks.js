/**
 * Processeur H5P — Texte à trous complexe
 *
 * Passe-travers minimal : retourne le JSON d'entrée sans modification.
 * Le JSON est supposé déjà au format H5P.AdvancedBlanks.
 *
 * @module processors/ComplexFillTheBlanks
 * @exports {Object} default.process - Retourne le JSON tel quel
 */
export default {
    process: (jsonObj) => {
        return { ...jsonObj }; // Le JSON est déjà au bon format
    }
};
