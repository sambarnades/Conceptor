/**
 * Service VISION — détection des zones clés d'une image (activité « Image interactive »).
 *
 * Envoie l'image de fond (dataURL base64) + le contexte pédagogique au modèle vision
 * (`DEFAULT_VISION_MODEL` ci-dessous, via ILaaS derrière le proxy n8n) et récupère ~4-5 zones clés :
 * `{ x, y, label, description }` avec x/y en POURCENTAGES (0–100).
 *
 * Appel SYNCHRONE (webhook → ILaaS → réponse). Contrat & implémentation serveur :
 *   n8n-workflows-bas/Caramel · Vision Image Hotspots — Détection (bas).json
 *   endpoint : ENDPOINTS.visionDetect
 *
 * REPLI : si l'endpoint n'est pas déployé / échoue, l'appelant capte l'erreur et laisse
 * l'utilisateur placer les zones à la main dans l'éditeur (l'activité reste fonctionnelle).
 *
 * @module services/hotspot-vision
 */

import { ENDPOINTS } from '../core/endpoints.js';
import { debugLog, classifyError } from '../core/utils.js';
import { translations } from '../core/translation.js';

const VISION_TIMEOUT_MS = 120000; // la vision peut être lente ; aligné sur le timeout n8n du node

// Schéma JSON littéral (langue-neutre) ajouté au prompt localisé. Gardé HORS des locales pour
// qu'une traduction ne puisse jamais casser le format attendu par le parseur du workflow n8n.
const VISION_JSON_SCHEMA = '{"imageDescription":"...","zones":[{"x":number,"y":number,"label":string,"description":string}]}';

/**
 * Construit le prompt vision DANS LA LANGUE DE L'INTERFACE, à partir de la locale courante
 * (clé i18n `hotspot_vision_prompt`, placeholders `{context}` et `{count}`). Il est envoyé au
 * workflow via `body.prompt`, qui l'utilise tel quel (sinon il retombe sur son prompt FR par
 * défaut). Rédiger TOUT le prompt dans la langue cible fiabilise la langue de sortie du modèle
 * vision (il répond dans la langue dans laquelle on lui parle) — cf. le repli FR intermittent
 * observé quand on ne lui donnait qu'une consigne de langue en fin de prompt français.
 * @param {{qui?:string,quoi?:string,niveau?:string}} [context]
 * @param {number} [count] - Nombre de zones demandé (mode Avancé) ; 5 par défaut.
 * @returns {string|null} prompt localisé, ou null si la clé locale est absente (→ repli serveur).
 */
function buildLocalizedVisionPrompt(context = {}, count) {
    const tpl = translations && translations.hotspot_vision_prompt;
    if (!tpl || typeof tpl !== 'string') return null;
    const ctxBlock = [context.qui, context.quoi, context.niveau]
        .map((s) => (s || '').toString().trim()).filter(Boolean).join(' · ') || '—';
    const n = (count && count > 0) ? count : 5;
    return tpl.replace(/\{context\}/g, ctxBlock).replace(/\{count\}/g, String(n)) + '\n' + VISION_JSON_SCHEMA;
}

/**
 * Modèle vision par défaut : Qwen 3.6 (VL). Benchmark interne 2026-06 : grounding des
 * coordonnées PIXEL-PERFECT (≫ Mistral Small, grossier ; ≫ Gemma, instable). Rapide (~1 s).
 */
export const DEFAULT_VISION_MODEL = 'qwen-3.6-35b-instruct';

/**
 * Détecte les zones clés d'une image via le modèle vision.
 *
 * Le modèle renvoie, par zone : des COORDONNÉES x,y (en %), un LABEL et une DESCRIPTION
 * (zone + entourage), plus une DESCRIPTION GLOBALE de l'image. Tout est ensuite injecté
 * dans le prompt pour que le LLM texte rédige le contenu de chaque point.
 *
 * @param {string} imageDataUrl - Image de fond encodée (`data:image/...;base64,...`).
 * @param {Object} [opts]
 * @param {{qui?:string,quoi?:string,niveau?:string}} [opts.context] - Contexte pédagogique.
 * @param {number} [opts.count] - Nombre de zones à FORCER (mode Avancé). Omis en Rapide → le
 *   serveur en détermine ~4-5 selon l'image (un peu plus/moins si justifié).
 * @param {string} [opts.lang='fr'] - Langue des descriptions (= langue de l'interface).
 * @param {string} [opts.model] - Modèle vision (défaut : Qwen 3.6).
 * @param {AbortSignal} [opts.signal] - Pour annuler (bouton « Arrêter » / changement d'image).
 * @returns {Promise<{zones: Array<{x:number,y:number,label:string,description:string}>, imageDescription:string, model?:string}>}
 * @throws {Error} enrichi par classifyError en cas d'échec réseau/HTTP.
 */
export async function detectImageZones(imageDataUrl, opts = {}) {
    const { context = {}, count, lang = 'fr', model = DEFAULT_VISION_MODEL, signal } = opts;

    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        throw new Error("detectImageZones : dataURL image base64 attendue.");
    }

    // Combine un timeout interne avec le signal externe éventuel.
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (signal) {
        if (signal.aborted) ac.abort();
        else signal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(() => ac.abort(), VISION_TIMEOUT_MS);

    const body = { image: imageDataUrl, context, lang };
    if (count && count > 0) body.count = count; // mode Avancé : force le nombre de zones
    if (model) body.model = model;
    // Prompt entièrement traduit dans la langue de l'interface → langue de sortie fiable.
    // Repli automatique sur le prompt par défaut du workflow si la clé locale manque.
    const localizedPrompt = buildLocalizedVisionPrompt(context, count);
    if (localizedPrompt) body.prompt = localizedPrompt;

    debugLog('hotspot-vision', `analyse vision (${Math.round(imageDataUrl.length / 1024)} Ko, count=${count})`);

    let response;
    try {
        response = await fetch(ENDPOINTS.visionDetect, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ac.signal,
        });
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        const classified = classifyError(err);
        const e = new Error(classified.technicalMessage || err.message);
        e.userMessageKey = classified.userMessageKey;
        e.category = classified.category;
        throw e;
    } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
    }

    if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(`Vision : HTTP ${response.status} ${response.statusText}${txt ? ' — ' + txt.slice(0, 200) : ''}`);
    }

    const data = await response.json().catch(() => null);
    if (!data || !Array.isArray(data.zones)) {
        throw new Error(data && data.error ? `Vision : ${data.error}` : 'Vision : réponse inattendue (zones absentes).');
    }

    // Normalisation défensive (le serveur ramène déjà en % 0-100, on re-sécurise côté client).
    // Échelle décidée à la MAJORITÉ des valeurs, pas au MAX (audit N9) : une seule valeur
    // aberrante > 100 dans un jeu de vrais % divisait TOUT le jeu par 10 ; désormais elle est
    // clampée individuellement. Majorité > 100 ⇒ 0-1000 natif Qwen (÷10) ; tout ≤ 1 ⇒ 0-1 (×100).
    // Si le workflow renvoie un jour son échelle (`data.scale` = 100 | 1000), elle fait foi —
    // seul moyen de distinguer un 0-1000 dont toutes les zones tombent ≤ 100 (coin haut-gauche).
    const raw = data.zones.filter((z) => z && typeof z === 'object');
    const vals = [];
    raw.forEach((z) => {
        const x = Number(z.x), y = Number(z.y);
        if (Number.isFinite(x)) vals.push(Math.abs(x));
        if (Number.isFinite(y)) vals.push(Math.abs(y));
    });
    const maxV = vals.length ? Math.max(...vals) : 0;
    let div;
    const declaredScale = Number(data.scale);
    if (Number.isFinite(declaredScale) && declaredScale > 0) {
        div = declaredScale / 100;
    } else {
        const over = vals.filter((v) => v > 100).length;
        if (over > vals.length / 2) div = 10;
        else if (maxV > 0 && maxV <= 1) div = 0.01;
        else div = 1; // % : les rares valeurs > 100 seront clampées par toPct
    }
    const toPct = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return 50;
        return Math.round(Math.max(0, Math.min(100, n / div)) * 10) / 10;
    };
    let zones = raw.map((z) => ({
        x: toPct(z.x),
        y: toPct(z.y),
        label: String(z.label || '').slice(0, 80),
        description: String(z.description || '').slice(0, 400),
    }));

    // Garantie « count » (mode Avancé) : on ne renvoie JAMAIS plus de zones que demandé.
    // En revanche on NE complète PAS en sous-nombre : le modèle plafonne au nombre de zones
    // réellement saillantes de l'image et refuse d'en inventer (comportement VOULU — mieux vaut
    // 5 zones réelles que 8 dont 3 hallucinées). L'enseignant ajuste ensuite dans l'éditeur.
    if (count && count > 0 && zones.length > count) {
        debugLog('hotspot-vision', `count=${count} demandé, ${zones.length} reçues → tronquées aux ${count} premières`);
        zones = zones.slice(0, count);
    }

    const imageDescription = String(data.imageDescription || '').slice(0, 600);
    debugLog('hotspot-vision', `${zones.length} zone(s) détectée(s)${count ? ` (count demandé=${count})` : ''}${imageDescription ? ' + description globale' : ''}`);
    return { zones, imageDescription, model: data.model };
}
