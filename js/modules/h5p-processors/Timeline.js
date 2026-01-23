import { currentLang } from '../translation.js';
import { formatTextToHtml } from '../utils.js';

export const machineName = 'H5P.Timeline';
export const version = { major: 1, minor: 1 };
export const extraDependencies = [
    { machineName: 'TimelineJS', majorVersion: 1, minorVersion: 1 },
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
];

export default {
    process: (jsonObj) => {
        // Si la structure "timeline" n'existe pas, on l'enveloppe
        const timelineData = jsonObj.timeline ? jsonObj : { timeline: jsonObj };

        // Ajout des champs manquants avec des valeurs par défaut
        timelineData.timeline.defaultZoomLevel = timelineData.timeline.defaultZoomLevel || "0";
        const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        timelineData.timeline.language = timelineData.timeline.language || h5pLang;
        timelineData.timeline.height = timelineData.timeline.height || 600;

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
