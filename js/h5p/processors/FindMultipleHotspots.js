/**
 * Processeur H5P — Find Multiple Hotspots (H5P.ImageMultipleHotspotQuestion 1.0)
 *
 * Transforme le JSON intermédiaire (généré par l'IA OU ré-édité dans l'éditeur visuel)
 * en `content.json` H5P.ImageMultipleHotspotQuestion 1.0.
 *
 * Deux formes d'entrée tolérées (le processeur est idempotent vis-à-vis de l'éditeur) :
 *  1. Format PLAT issu du LLM :
 *     { title, taskDescription, hotspotName, numberHotspots,
 *       hotspots: [{ x, y, width, height, correct, feedbackText, label }],
 *       noneSelectedFeedback, alreadySelectedFeedback }
 *     x/y = CENTRE de la zone en % (aligné sur les zones du flux vision), width/height en %.
 *  2. Format COMPLET (content.json réédité / dénormalisé par l'éditeur) :
 *     { imageMultipleHotspotQuestion: { backgroundImageSettings, hotspotSettings } }
 *
 * L'image de FOND (`data.image`) est injectée par l'UI (registre image-manager) — JAMAIS
 * demandée au LLM. ⚠️ Contrairement à Find the Hotspot, le player 1.0 lit la forme
 * IMBRIQUÉE `backgroundImageSettings.backgroundImage.path` (groupe à 2 champs, non aplati).
 *
 * Particularités du player (vérifiées dans le code vendoré) :
 *  - Seules les zones `correct: true` comptent : score max = numberHotspots si fourni et
 *    ≤ nb de zones correctes, sinon nb de zones correctes.
 *  - Le feedback d'une zone correcte est composé par le player :
 *    « {feedbackText} {score} of {max} {hotspotName}. » → feedbackText doit être une
 *    amorce de phrase (ex. « Bravo, vous avez trouvé »), consigne portée par le prompt.
 *
 * @module processors/FindMultipleHotspots
 */

import { debugLog } from '../../core/utils.js';
import { translations } from '../../core/translation.js';
import { buildComputedSettings, healFullHotspotContent, separateOverlappingHotspots } from './hotspot-question-utils.js';

export default {
    /**
     * @param {Object} data - JSON intermédiaire (plat ou complet).
     * @returns {Object} content.json H5P.ImageMultipleHotspotQuestion 1.0.
     */
    process(data) {
        const src = data || {};

        // Forme COMPLÈTE : content.json déjà structuré (import / dénormalisation éditeur).
        if (src.imageMultipleHotspotQuestion && typeof src.imageMultipleHotspotQuestion === 'object') {
            const content = healFullHotspotContent(src, 'imageMultipleHotspotQuestion');
            const root = content.imageMultipleHotspotQuestion;
            // Ce player lit la forme IMBRIQUÉE : un JSON collé en forme aplatie
            // ({ backgroundImageSettings: { path, mime… } }) est ré-imbriqué ici.
            const bis = root.backgroundImageSettings = root.backgroundImageSettings || {};
            if (bis.path && !bis.backgroundImage) {
                root.backgroundImageSettings = { questionTitle: bis.questionTitle || '', backgroundImage: bis };
            }
            // Fond manquant dans la forme complète : repli sur l'image plate injectée par l'UI.
            if (!root.backgroundImageSettings.backgroundImage?.path && src.image) {
                root.backgroundImageSettings.backgroundImage = src.image;
            }
            delete content.image; // reliquat plat éventuel (injection UI)
            const hs = root.hotspotSettings;
            const correctCount = hs.hotspot.filter((h) => h.userSettings.correct).length;
            hs.numberHotspots = normalizeNumberHotspots(hs.numberHotspots, correctCount);
            debugLog('FindMultipleHotspots', `content.json (forme complète) : ${hs.hotspot.length} zone(s), ${correctCount} correcte(s)`);
            return content;
        }

        // Forme PLATE (LLM) : centres % → coins haut-gauche % attendus par le player.
        const hotspots = Array.isArray(src.hotspots) ? src.hotspots : [];
        const correctCount = hotspots.filter((h) => h.correct === true).length;
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
            imageMultipleHotspotQuestion: {
                backgroundImageSettings: {
                    // Titre utilisé dans les résumés/statistiques des plateformes.
                    questionTitle: src.questionTitle || src.title || '',
                    // Image de fond : objet H5P {path,mime,width,height,copyright} injecté par l'UI.
                    backgroundImage: src.image || {}
                },
                hotspotSettings: {
                    taskDescription: src.taskDescription || '',
                    // Nom pluriel de ce qu'on cherche (« légumes », « erreurs »…) : le player
                    // l'insère dans le feedback composé « … X of Y {hotspotName}. ».
                    hotspotName: src.hotspotName || '',
                    numberHotspots: normalizeNumberHotspots(src.numberHotspots, correctCount),
                    hotspot: h5pHotspots,
                    noneSelectedFeedback: src.noneSelectedFeedback
                        || translations.h5p_hotspot_none_selected_feedback || 'Vous n\'avez pas trouvé de zone, essayez encore !',
                    alreadySelectedFeedback: src.alreadySelectedFeedback
                        || translations.h5p_hotspot_already_selected_feedback || 'Vous avez déjà trouvé cette zone !'
                }
            }
        };

        debugLog('FindMultipleHotspots', `content.json généré : ${hotspots.length} zone(s), ${correctCount} correcte(s), `
            + `à trouver=${content.imageMultipleHotspotQuestion.hotspotSettings.numberHotspots}`);
        return content;
    }
};

/**
 * Borne `numberHotspots` à [1, nb de zones correctes] ; retombe sur le nb de zones
 * correctes si absent/invalide (même repli que le player, mais explicité dans le JSON).
 */
function normalizeNumberHotspots(value, correctCount) {
    const n = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return correctCount || 1;
    return Math.min(n, Math.max(correctCount, 1));
}
