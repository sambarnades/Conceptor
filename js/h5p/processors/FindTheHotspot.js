/**
 * Processeur H5P — Find the Hotspot (H5P.ImageHotspotQuestion 1.8)
 *
 * Transforme le JSON intermédiaire (généré par l'IA OU ré-édité dans l'éditeur visuel)
 * en `content.json` H5P.ImageHotspotQuestion 1.8.
 *
 * Deux formes d'entrée tolérées (le processeur est idempotent vis-à-vis de l'éditeur) :
 *  1. Format PLAT issu du LLM :
 *     { taskDescription, hotspots: [{ x, y, width, height, correct, feedbackText, label }],
 *       noneSelectedFeedback }
 *     x/y = CENTRE de la zone en % (aligné sur les zones du flux vision), width/height en %.
 *  2. Format COMPLET (content.json réédité / dénormalisé par l'éditeur) :
 *     { imageHotspotQuestion: { backgroundImageSettings, hotspotSettings } }
 *
 * L'image de FOND (`data.image`) est injectée par l'UI (registre image-manager) — JAMAIS
 * demandée au LLM, exactement comme pour Image interactive. ⚠️ Le player 1.8 lit la forme
 * APLATIE `backgroundImageSettings.path` (groupe H5P à champ unique — cf. paquet Éléa) :
 * ne pas imbriquer sous `backgroundImageSettings.backgroundImage`.
 *
 * Toutes les dépendances sont statiques (déclarées dans processors/index.js → processorMetadata),
 * donc le processeur retourne directement le `content` (pas de { content, dependencies }).
 *
 * @module processors/FindTheHotspot
 */

import { debugLog } from '../../core/utils.js';
import { translations } from '../../core/translation.js';
import {
    clampPct,
    clampSizePct,
    buildComputedSettings,
    buildHotspotL10nDefaults,
    healFullHotspotContent,
    separateOverlappingHotspots
} from './hotspot-question-utils.js';

export default {
    /**
     * @param {Object} data - JSON intermédiaire (plat ou complet).
     * @returns {Object} content.json H5P.ImageHotspotQuestion 1.8.
     */
    process(data) {
        const src = data || {};

        // Forme COMPLÈTE : content.json déjà structuré (import / dénormalisation éditeur).
        // On complète seulement les libellés/défauts manquants sans restructurer.
        if (src.imageHotspotQuestion && typeof src.imageHotspotQuestion === 'object') {
            const content = healFullHotspotContent(src, 'imageHotspotQuestion');
            const root = content.imageHotspotQuestion;
            // Ce player lit la forme APLATIE : un JSON collé en forme imbriquée
            // ({ backgroundImageSettings: { backgroundImage: {...} } }) est aplati ici.
            if (root.backgroundImageSettings?.backgroundImage?.path) {
                root.backgroundImageSettings = root.backgroundImageSettings.backgroundImage;
            }
            // Fond manquant dans la forme complète : repli sur l'image plate injectée par l'UI.
            if (!root.backgroundImageSettings?.path && src.image) {
                root.backgroundImageSettings = src.image;
            }
            delete content.image; // reliquat plat éventuel (injection UI)
            const hs = root.hotspotSettings;
            hs.showFeedbackAsPopup = hs.showFeedbackAsPopup !== false;
            hs.l10n = { ...buildHotspotL10nDefaults(), ...(hs.l10n || {}) };
            content.scoreBarLabel = content.scoreBarLabel
                || translations.h5p_score_bar_label || 'Vous avez obtenu :num sur :total points';
            content.a11yRetry = content.a11yRetry
                || translations.h5p_a11y_retry || 'Recommencer l\'exercice. Réinitialiser toutes les réponses et recommencer.';
            debugLog('FindTheHotspot', `content.json (forme complète) : ${hs.hotspot.length} zone(s)`);
            return content;
        }

        // Forme PLATE (LLM) : centres % → coins haut-gauche % attendus par le player.
        const hotspots = Array.isArray(src.hotspots) ? src.hotspots : [];
        // Zones superposées (centres vision rapprochés + taille défaut 20 %) : la zone du dessous
        // serait incliquable → tailles réduites jusqu'à séparation, centres intacts.
        const h5pHotspots = separateOverlappingHotspots(hotspots.map((h) => ({
            userSettings: {
                correct: h.correct === true,
                feedbackText: h.feedbackText || ''
            },
            computedSettings: buildComputedSettings(h)
        })));

        const content = {
            imageHotspotQuestion: {
                // Image de fond : objet H5P {path,mime,width,height,copyright} injecté par l'UI,
                // stocké APLATI (le player lit `backgroundImageSettings.path`).
                backgroundImageSettings: src.image || {},
                hotspotSettings: {
                    taskDescription: src.taskDescription || '',
                    hotspot: h5pHotspots,
                    noneSelectedFeedback: src.noneSelectedFeedback
                        || translations.h5p_hotspot_none_selected_feedback || 'Vous n\'avez pas trouvé de zone, essayez encore !',
                    showFeedbackAsPopup: src.showFeedbackAsPopup !== false,
                    l10n: buildHotspotL10nDefaults()
                }
            },
            scoreBarLabel: translations.h5p_score_bar_label || 'Vous avez obtenu :num sur :total points',
            a11yRetry: translations.h5p_a11y_retry || 'Recommencer l\'exercice. Réinitialiser toutes les réponses et recommencer.'
        };

        debugLog('FindTheHotspot', `content.json généré : ${content.imageHotspotQuestion.hotspotSettings.hotspot.length} zone(s), `
            + `${hotspots.filter((h) => h.correct === true).length} correcte(s)`);
        return content;
    }
};

// Ré-exports pour les tests (mêmes helpers que FindMultipleHotspots).
export { clampPct, clampSizePct, buildComputedSettings };
