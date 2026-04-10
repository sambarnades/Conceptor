/**
 * Processeur H5P — Frise chronologique
 *
 * Enveloppe la structure timeline, ajoute les valeurs par défaut
 * (zoomLevel, langue, hauteur) et formate le texte Markdown en HTML
 * pour le contenu principal et chaque date/ère.
 *
 * @module processors/Timeline
 * @exports {Object} default.process - Transformation principale
 */
import { currentLang } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        // Si la structure "timeline" n'existe pas, on l'enveloppe
        const timelineData = jsonObj.timeline ? jsonObj : { timeline: jsonObj };

        // Ajout des champs manquants avec des valeurs par défaut
        timelineData.timeline.defaultZoomLevel = timelineData.timeline.defaultZoomLevel || "0";
        const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        timelineData.timeline.language = timelineData.timeline.language || h5pLang;
        // height peut venir de l'éditeur au niveau racine (pas dans timeline)
        timelineData.timeline.height = timelineData.timeline.height || jsonObj.height || 600;

        // Formater le texte principal
        if (timelineData.timeline.text) {
            timelineData.timeline.text = formatTextToHtml(timelineData.timeline.text);
        }

        // Formater le texte dans chaque "date"
        if (timelineData.timeline && timelineData.timeline.date && Array.isArray(timelineData.timeline.date)) {
            timelineData.timeline.date.forEach(d => {
                if (d.text) {
                    d.text = formatTextToHtml(d.text);
                }
                if (!d.asset) {
                    d.asset = {};
                }
            });
        }

        // Formater le texte dans chaque "era"
        if (timelineData.timeline && timelineData.timeline.era && Array.isArray(timelineData.timeline.era)) {
            timelineData.timeline.era.forEach(e => {
                if (e.text && !e.text.trim().startsWith('<div>')) {
                    e.text = `<div>${e.text.trim()}</div>`;
                }
            });
        }

        return timelineData;
    }
};
