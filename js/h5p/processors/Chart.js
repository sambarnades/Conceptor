/**
 * Processeur H5P — Diagramme
 *
 * Le JSON généré par l'IA est déjà au format H5P.Chart attendu : ce processeur
 * se contente de le recopier et d'y ajouter le libellé accessible du graphique
 * (`figureDefinition`), seul champ traduisible de la lib. Sans lui, un lecteur
 * d'écran annonce « Chart » en anglais même sur une activité en français.
 *
 * @module processors/Chart
 * @exports {Object} default.process - Retourne le JSON complété
 */
import { translations } from '../../core/translation.js';

export default {
    process: (jsonObj) => {
        return {
            ...jsonObj,
            figureDefinition: jsonObj.figureDefinition
                || translations.h5p_chart_figure_definition
                || "Graphique"
        };
    }
};
