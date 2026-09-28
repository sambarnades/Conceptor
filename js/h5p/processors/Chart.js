/**
 * Processeur H5P — Diagramme
 *
 * Le JSON généré par l'IA est déjà au format H5P.Chart attendu : ce processeur
 * vérifie ses valeurs natives et y ajoute le libellé accessible du graphique
 * (`figureDefinition`), seul champ traduisible de la lib. Sans lui, un lecteur
 * d'écran annonce « Chart » en anglais même sur une activité en français.
 *
 * @module processors/Chart
 * @exports {Object} default.process - Retourne le JSON complété
 */
import { translations } from '../../core/translation.js';

export default {
    process: (jsonObj) => {
        if (!['pieChart', 'barChart'].includes(jsonObj.graphMode)) throw new Error(translations.editor_error_pattern || 'Type de graphique invalide.');
        if (!Array.isArray(jsonObj.listOfTypes) || !jsonObj.listOfTypes.length) throw new Error(translations.validation_no_chart_data || 'Au moins une donnée est requise.');
        const listOfTypes = jsonObj.listOfTypes.map(item => {
            const value = Number(item?.value);
            const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
            const decimals = Math.max(0, (mantissa.split('.')[1] || '').length - Number(exponent));
            if (!Number.isFinite(value) || value < 0.0001 || decimals > 4) throw new Error(translations.validation_chart_value || 'Valeur minimale : 0,0001 ; quatre décimales au maximum.');
            return { ...item, value };
        });
        return {
            ...jsonObj,
            listOfTypes,
            figureDefinition: jsonObj.figureDefinition
                || translations.h5p_chart_figure_definition
                || "Graphique"
        };
    }
};
