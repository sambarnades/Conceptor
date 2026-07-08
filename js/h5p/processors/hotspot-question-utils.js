/**
 * Helpers partagés des processeurs « Find the Hotspot » et « Find Multiple Hotspots »
 * (H5P.ImageHotspotQuestion 1.8 / H5P.ImageMultipleHotspotQuestion 1.0).
 *
 * Les deux players partagent la même structure de zone :
 *   { userSettings: { correct, feedbackText },
 *     computedSettings: { x, y, width, height, figure } }
 * avec x/y = COIN HAUT-GAUCHE en % de l'image et width/height en %.
 *
 * Le format intermédiaire plat (LLM / éditeur) utilise x/y = CENTRE de la zone en %,
 * aligné sur les zones renvoyées par le flux vision (services/hotspot-vision.js) :
 * la conversion centre → coin se fait ici, bornée pour rester dans l'image.
 *
 * @module processors/hotspot-question-utils
 */

import { translations } from '../../core/translation.js';
import { debugLog } from '../../core/utils.js';

/** Taille par défaut d'une zone (en % de l'image) : cliquable confortablement, ajustable dans l'éditeur. */
export const DEFAULT_HOTSPOT_SIZE = 20;

/** Borne une valeur en pourcentage [0,100] ; `fallback` si non finie. */
export function clampPct(v, fallback = 50) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, n));
}

/** Borne une taille de zone en pourcentage [1,100] ; `fallback` si non finie. */
export function clampSizePct(v, fallback = DEFAULT_HOTSPOT_SIZE) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.max(1, Math.min(100, n));
}

/** Arrondi à 2 décimales (lisibilité du content.json). */
function round2(n) {
    return Math.round(n * 100) / 100;
}

/**
 * Construit les `computedSettings` d'une zone à partir de la forme plate
 * { x, y (centre), width, height, figure } — ou les réutilise tels quels si
 * un JSON collé fournit déjà des `computedSettings` (coin haut-gauche).
 * @param {Object} h - Hotspot plat (LLM/éditeur) ou semi-structuré.
 * @returns {Object} computedSettings { x, y, width, height, figure }.
 */
export function buildComputedSettings(h) {
    const spot = h || {};
    if (spot.computedSettings && typeof spot.computedSettings === 'object') {
        const cs = spot.computedSettings;
        const width = clampSizePct(cs.width);
        const height = clampSizePct(cs.height);
        return {
            x: round2(Math.max(0, Math.min(100 - width, clampPct(cs.x, 0)))),
            y: round2(Math.max(0, Math.min(100 - height, clampPct(cs.y, 0)))),
            width,
            height,
            figure: cs.figure === 'rectangle' ? 'rectangle' : 'circle'
        };
    }
    const width = clampSizePct(spot.width);
    const height = clampSizePct(spot.height);
    const cx = clampPct(spot.x);
    const cy = clampPct(spot.y);
    return {
        // Centre → coin haut-gauche, borné pour que la zone reste entière dans l'image.
        x: round2(Math.max(0, Math.min(100 - width, cx - width / 2))),
        y: round2(Math.max(0, Math.min(100 - height, cy - height / 2))),
        width,
        height,
        figure: spot.figure === 'rectangle' ? 'rectangle' : 'circle'
    };
}

/** Écart minimal entre les BORDS de deux zones après séparation (en % de l'image). */
const SEPARATION_GAP = 1;
/** Taille plancher (en %) : en dessous, une zone devient difficile à cliquer — on ne réduit plus. */
const SEPARATION_MIN_SIZE = 5;
/** Tolérance de chevauchement : un empiètement plus fin est ignoré (stabilité des arrondis à 2 décimales). */
const SEPARATION_EPS = 0.05;

/** Arrondi à 2 décimales par DÉFAUT (jamais vers le haut : la séparation acquise reste garantie). */
function floor2(n) {
    return Math.floor(n * 100) / 100;
}

/**
 * Empêche les zones de se SUPERPOSER. Dans les deux players, les zones sont des divs positionnés :
 * sur un chevauchement, seule celle du DESSUS reçoit le clic — une zone correcte enterrée sous un
 * leurre rend l'activité infaisable. Le cas arrive dès la génération : centres vision rapprochés
 * + taille par défaut (20 %) ⇒ recouvrement.
 *
 * Principe : les CENTRES (positions pédagogiques renvoyées par la vision) ne bougent JAMAIS ; seules
 * les TAILLES sont réduites, proportionnellement (un cercle reste un cercle) et par paires, jusqu'à
 * laisser SEPARATION_GAP entre les boîtes englobantes sur au moins un axe. Plancher
 * SEPARATION_MIN_SIZE : deux centres quasi confondus gardent un chevauchement résiduel assumé
 * (déplacer un centre trahirait la position détectée). Convergence garantie : les tailles ne font
 * que décroître.
 *
 * Appelée UNIQUEMENT sur la forme PLATE (chemin IA) : la forme complète (content.json importé /
 * réédité dans l'éditeur visuel, où les zones sont affichées à taille réelle) reste fidèle au
 * document de l'auteur — un chevauchement manuel y est visible et assumé.
 *
 * @param {Array<{computedSettings: Object}>} h5pHotspots - Zones H5P (coins haut-gauche en %).
 * @returns {Array} Le même tableau, `computedSettings` ajustés en place.
 */
export function separateOverlappingHotspots(h5pHotspots) {
    const zones = (Array.isArray(h5pHotspots) ? h5pHotspots : [])
        .map((h) => h && h.computedSettings)
        .filter((cs) => cs && Number.isFinite(cs.x) && Number.isFinite(cs.width));
    if (zones.length < 2) return h5pHotspots;

    // Centres EFFECTIFS (après bornage des coins par buildComputedSettings) : figés une fois pour toutes.
    const centers = zones.map((cs) => ({ cx: cs.x + cs.width / 2, cy: cs.y + cs.height / 2 }));
    let touched = false;
    for (let pass = 0; pass < 8; pass++) {
        let changed = false;
        for (let i = 0; i < zones.length; i++) {
            for (let j = i + 1; j < zones.length; j++) {
                const a = zones[i], b = zones[j];
                const dx = Math.abs(centers[i].cx - centers[j].cx);
                const dy = Math.abs(centers[i].cy - centers[j].cy);
                const halfW = (a.width + b.width) / 2;
                const halfH = (a.height + b.height) / 2;
                // Séparées (écart minimal compris) sur au moins un axe → rien à faire.
                if (dx >= halfW + SEPARATION_GAP - SEPARATION_EPS
                    || dy >= halfH + SEPARATION_GAP - SEPARATION_EPS) continue;
                // Axe demandant la plus PETITE réduction ; facteur commun aux deux zones.
                const f = Math.max((dx - SEPARATION_GAP) / halfW, (dy - SEPARATION_GAP) / halfH, 0);
                for (const cs of [a, b]) {
                    const w = Math.max(SEPARATION_MIN_SIZE, floor2(cs.width * f));
                    const h = Math.max(SEPARATION_MIN_SIZE, floor2(cs.height * f));
                    if (w !== cs.width || h !== cs.height) {
                        cs.width = w;
                        cs.height = h;
                        changed = true;
                        touched = true;
                    }
                }
            }
        }
        if (!changed) break; // plus rien à réduire : séparées, ou paires résiduelles au plancher
    }
    if (touched) {
        // Coins recalculés depuis les centres préservés (re-bornés par sécurité, no-op en pratique).
        zones.forEach((cs, k) => {
            cs.x = round2(Math.max(0, Math.min(100 - cs.width, centers[k].cx - cs.width / 2)));
            cs.y = round2(Math.max(0, Math.min(100 - cs.height, centers[k].cy - cs.height / 2)));
        });
        debugLog('hotspot-utils', `zones superposées → tailles réduites (centres conservés) : ${zones.map((z) => `${z.width}×${z.height}`).join(', ')}`);
    }
    return h5pHotspots;
}

/**
 * Libellés localisés des boutons du popup de feedback (semantics `l10n`, FTH uniquement).
 * Clés partagées avec les autres types question (h5p_try_again / h5p_close).
 */
export function buildHotspotL10nDefaults() {
    return {
        retryText: translations.h5p_try_again || 'Recommencer',
        closeText: translations.h5p_close || 'Fermer'
    };
}

/**
 * Répare la forme COMPLÈTE (content.json réédité / dénormalisé par l'éditeur) sans la
 * restructurer : garantit `hotspotSettings.hotspot[]` et des zones aux coordonnées bornées.
 * @param {Object} src - JSON complet { [rootKey]: { backgroundImageSettings, hotspotSettings } }.
 * @param {string} rootKey - 'imageHotspotQuestion' ou 'imageMultipleHotspotQuestion'.
 * @returns {Object} copie profonde réparée.
 */
export function healFullHotspotContent(src, rootKey) {
    const content = structuredClone(src);
    const root = content[rootKey] = content[rootKey] || {};
    const hs = root.hotspotSettings = root.hotspotSettings || {};
    const hotspots = Array.isArray(hs.hotspot) ? hs.hotspot : [];
    hs.hotspot = hotspots.map((h) => ({
        ...h,
        userSettings: {
            correct: h?.userSettings?.correct === true,
            feedbackText: h?.userSettings?.feedbackText || ''
        },
        computedSettings: buildComputedSettings(h)
    }));
    return content;
}
