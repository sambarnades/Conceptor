/**
 * @file Pont d'intégration embarquée (iframe) — mode `?embed=block`.
 *
 * Permet d'héberger Caramel dans une iframe (ex: bloc d'Éléa/Moodle) et de
 * communiquer avec la page parente via `postMessage`, SANS sortir de la fenêtre :
 *   - le parent pré-remplit le contexte (qui / quoi / niveau) ;
 *   - quand une activité est générée, ses octets sont renvoyés au parent qui peut
 *     les déposer directement dans le cours.
 *
 * C'est la « Couche 1 » du plan d'intégration Éléa :
 *   docs/specific-plans/PLAN_INTEGRATION_ELEA_BLOCK.md
 *
 * ADDITIF & SANS RÉGRESSION : {@link initEmbedBridge} est un no-op complet hors
 * mode embed (`?embed` absent de l'URL). En mode normal, rien n'est modifié.
 *
 * Le blob renvoyé est capté depuis l'événement `generation:complete` déjà émis
 * par h5p-creator.js / moodle-creator.js — aucun chemin de génération n'est touché.
 *
 * --- Protocole postMessage ---
 * Toutes les enveloppes portent `{ source:'caramel', type:'caramel:*', version, payload }`
 * (sortant) et sont reconnues en entrée par un `type` préfixé `caramel:`.
 *
 * SÉCURITÉ — `?origin=` est OBLIGATOIRE (fail-closed) :
 * l'URL d'embarquement doit fournir l'origine de la page parente, ex.
 * `?embed=block&origin=https://elea.example.fr` (à défaut, l'origine du
 * `document.referrer` est utilisée). Si AUCUNE origine parente ne peut être
 * résolue, le pont est verrouillé : il n'émet AUCUN message sortant (jamais de
 * `targetOrigin '*'`, donc jamais d'octets d'activité diffusés en aveugle) et
 * il ignore TOUS les messages entrants. Un avertissement de configuration est
 * alors affiché en console (visible même hors `?debug`).
 *
 * Parent → iframe :
 *   caramel:init      { qui?, quoi?, niveau?, nombreQuestions?, lang? }  — pré-remplit le contexte.
 *   caramel:generate  { activity, qui?, quoi?, niveau?, nombreQuestions?, model? }
 *                       — pré-remplit (si fourni) puis lance la génération « en un clic ».
 *                       `model` = ID de modèle LLM (cf. AVAILABLE_MODELS) ; appliqué si rendu dans
 *                       le sélecteur (3 "featured" hors ?debug), sinon modèle par défaut + `model:null`.
 *
 * iframe → parent :
 *   caramel:ready       { version }                       — émis au chargement.
 *   caramel:init:ack    { applied: string[] }             — accusé de réception d'un init.
 *   caramel:generating  { moduleKey, model, requestedModel } — génération démarrée (clic LLM émis).
 *   caramel:generated   { moduleKey, titleKey, filename, mime, size, bytes }
 *                                                          — bytes = ArrayBuffer (transféré).
 *   caramel:error       { moduleKey?, message }           — erreur de pont/génération.
 *
 * @module embed/embed-bridge
 */

// Sélecteurs DOM Caramel : source unique de vérité (cf. commentaire dans config.js).
// config.js est une donnée pure SANS import — l'importer ne tire PAS la chat Caramelia.
import { CONFIG } from '../caramelia/config.js';
import { debugLog } from '../core/utils.js';

const EMBED_PARAM = 'embed';
const PROTOCOL_VERSION = 1;
const EMBED_CSS_HREF = 'css/embed.css';

// Sélecteur d'un item du dropdown de modèle LLM dans la sidebar d'activité.
// Ces IDs/attributs appartiennent à l'app principale, pas au couplage Caramelia :
//   - dropdown `#model-selector-dropdown-${moduleKey}` (js/ui/ui.js, attachLLMLogic) ;
//   - items `<li data-model-id="${model.id}">` (js/services/llm.js, populateModelSelector).
// Hors mode ?debug, seuls les 3 modèles "featured" sont rendus (cf. populateModelSelector).
const modelItemSelector = (moduleKey, modelId) =>
    `#model-selector-dropdown-${moduleKey} li[data-model-id="${modelId}"]`;

// Format d'ID de modèle autorisé (évite toute injection dans le sélecteur d'attribut).
const MODEL_ID_RE = /^[a-zA-Z0-9._-]+$/;

let allowedOrigin = null; // origine parente autorisée (ou null si inconnue)
let inFlight = null;      // génération pilotée en cours : { moduleKey, timer } ou null

/**
 * Indique si la page tourne en mode embarqué (`?embed` présent dans l'URL).
 * @returns {boolean}
 */
export function isEmbedded() {
    try {
        return new URLSearchParams(window.location.search).has(EMBED_PARAM);
    } catch (e) {
        return false;
    }
}

/**
 * Résout l'origine parente autorisée : param `?origin=...` en priorité,
 * sinon l'origine du référent (document.referrer), sinon null (inconnue).
 * @returns {string|null}
 */
export function resolveAllowedOrigin() {
    let explicit = null;
    try {
        explicit = new URLSearchParams(window.location.search).get('origin');
    } catch (e) { /* ignore */ }
    if (explicit) {
        try { return new URL(explicit).origin; } catch (e) { /* ignore */ }
    }
    if (typeof document !== 'undefined' && document.referrer) {
        try { return new URL(document.referrer).origin; } catch (e) { /* ignore */ }
    }
    return null;
}

/**
 * Poste une enveloppe vers la fenêtre parente.
 *
 * FAIL-CLOSED : sans origine parente résolue (`allowedOrigin` null), on n'émet
 * RIEN — jamais de `targetOrigin '*'`. On ne peut pas non plus cibler un
 * message d'erreur de configuration (pas d'origine pour le viser) : on se
 * contente de tracer l'abandon. Cf. avertissement émis dans initEmbedBridge().
 *
 * @param {string} type - type `caramel:*`.
 * @param {Object} payload
 * @param {Transferable[]} [transfer] - objets transférables (ex: ArrayBuffer).
 */
function postToParent(type, payload, transfer) {
    if (typeof window === 'undefined' || window.parent === window) return; // pas dans une iframe
    if (!allowedOrigin) {
        debugLog('embed', `message sortant "${type}" abandonné : origine parente inconnue (fail-closed)`);
        return;
    }
    try {
        window.parent.postMessage(
            { source: 'caramel', type, version: PROTOCOL_VERSION, payload },
            allowedOrigin,
            transfer || []
        );
    } catch (e) {
        console.warn('[embed] postMessage échoué:', e && e.message);
    }
}

/**
 * Remplit un champ texte et déclenche input/change (comme une saisie utilisateur),
 * pour que les écouteurs de Caramel (génération de prompts cachés, etc.) réagissent.
 * @param {string} id
 * @param {*} value
 * @returns {boolean} true si le champ existait et a été rempli.
 */
function setField(id, value) {
    if (value === undefined || value === null) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

/**
 * Applique un payload d'init (pré-remplissage du contexte).
 * @param {Object} payload
 * @returns {string[]} liste des champs effectivement appliqués.
 */
export function applyInit(payload = {}) {
    const applied = [];
    const map = { qui: 'qui', quoi: 'quoi', niveau: 'niveau', nombreQuestions: 'nombreQuestions' };
    for (const [key, id] of Object.entries(map)) {
        if (setField(id, payload[key])) applied.push(key);
    }
    // Langue : best-effort, sans bloquer (re-traduction asynchrone).
    if (payload.lang) {
        import('../core/translation.js')
            .then(m => m.loadTranslations && m.loadTranslations(payload.lang))
            .catch(() => { /* la langue reste celle par défaut */ });
        applied.push('lang');
    }
    return applied;
}

/**
 * Attend qu'un sélecteur apparaisse dans le DOM (polling léger).
 * @param {string} selector
 * @param {number} timeoutMs
 * @returns {Promise<Element|null>}
 */
function waitForSelector(selector, timeoutMs) {
    const existing = document.querySelector(selector);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            if (Date.now() - start > timeoutMs) return resolve(null);
            setTimeout(tick, CONFIG.timing.sidebarPoll || 100);
        };
        tick();
    });
}

/**
 * Attend que Caramel ait régénéré ses prompts cachés après une saisie de contexte
 * (Caramel debounce ~500ms les events `input` sur qui/quoi).
 * @returns {Promise<boolean>}
 */
function waitForHiddenPrompts() {
    return waitForSelector(CONFIG.caramelSelectors.hiddenPrompts, CONFIG.timing.promptReadyMaxWait)
        .then(el => !!el);
}

/** Localise la tuile d'activité via les sélecteurs canoniques (sans fallback textuel). */
function findTile(moduleKey) {
    for (const sel of CONFIG.caramelSelectors.tileSelectors(moduleKey)) {
        const el = document.querySelector(sel);
        if (el) return el;
    }
    return null;
}

function closeSidebar() {
    const btn = document.querySelector(CONFIG.caramelSelectors.sidebarCloseBtn);
    if (btn) btn.click();
}

/**
 * Pilote une génération « en un clic » comme le ferait l'utilisateur, en
 * réutilisant le pipeline réel de Caramel (tuile → bouton LLM). Le blob produit
 * est ensuite renvoyé au parent par {@link onGenerationComplete} via
 * l'événement `generation:complete` (succès). En cas d'échec de pilotage
 * (tuile/bouton introuvables) on lève ; un timeout couvre les échecs silencieux
 * du LLM (qui n'émettent pas `generation:complete`).
 *
 * @param {string} moduleKey
 * @param {string} [requestedModel] - ID de modèle LLM souhaité (sinon défaut de Caramel).
 */
async function driveGeneration(moduleKey, requestedModel) {
    // Régénère les prompts cachés à partir du contexte courant.
    const quiEl = document.querySelector(CONFIG.caramelSelectors.qui);
    const quoiEl = document.querySelector(CONFIG.caramelSelectors.quoi);
    if (quiEl) quiEl.dispatchEvent(new Event('input', { bubbles: true }));
    if (quoiEl) quoiEl.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForHiddenPrompts();

    const tile = findTile(moduleKey);
    if (!tile) throw new Error(`tuile introuvable pour ${moduleKey}`);
    tile.click();

    const llmBtn = await waitForSelector(CONFIG.caramelSelectors.llmBtn(moduleKey), CONFIG.timing.sidebarMaxWait);
    if (!llmBtn) {
        closeSidebar();
        throw new Error(`bouton LLM introuvable pour ${moduleKey}`);
    }

    // Sélection du modèle LLM (optionnelle) : on clique l'item correspondant du
    // dropdown — même masqué, son handler met à jour `selectedModel` côté Caramel.
    // Si le modèle demandé n'est pas rendu (non "featured" hors ?debug, ou inconnu),
    // on poursuit avec le modèle par défaut de Caramel et on le signale via `model:null`.
    let appliedModel = null;
    if (requestedModel && MODEL_ID_RE.test(requestedModel)) {
        // Attendre que le dropdown soit peuplé (≥1 item) plutôt que le modèle précis :
        // si le modèle demandé n'est pas rendu, on retombe immédiatement sur le défaut
        // au lieu d'attendre le timeout complet.
        await waitForSelector(`#model-selector-dropdown-${moduleKey} li`, CONFIG.timing.sidebarMaxWait);
        const item = document.querySelector(modelItemSelector(moduleKey, requestedModel));
        if (item) {
            item.click();
            appliedModel = requestedModel;
        }
    }

    // Armer un timeout : un échec LLM silencieux n'émet PAS generation:complete.
    if (inFlight) clearTimeout(inFlight.timer);
    inFlight = {
        moduleKey,
        timer: setTimeout(() => {
            if (inFlight) {
                inFlight = null;
                postToParent('caramel:error', { moduleKey, message: 'timeout de génération' });
            }
        }, CONFIG.timing.generationMaxWait)
    };

    // `model` = modèle effectivement appliqué (null si défaut), `requestedModel` = ce qui a été demandé.
    postToParent('caramel:generating', { moduleKey, model: appliedModel, requestedModel: requestedModel || null });
    llmBtn.click();
}

/**
 * Capte `generation:complete` et renvoie les octets de l'activité au parent.
 * @param {CustomEvent} e
 */
async function onGenerationComplete(e) {
    // Lever le timeout d'une génération pilotée, quel que soit le module abouti.
    if (inFlight) {
        clearTimeout(inFlight.timer);
        inFlight = null;
    }
    try {
        const detail = (e && e.detail) || {};
        const blob = detail.blob;
        if (!blob || typeof blob.arrayBuffer !== 'function') return;
        // Ignorer les blobs d'erreur (vides).
        if (blob.size <= 0) return;

        const bytes = await blob.arrayBuffer();
        postToParent('caramel:generated', {
            moduleKey: detail.moduleKey || null,
            titleKey: detail.titleKey || null,
            filename: detail.fileName || null,
            mime: blob.type || 'application/octet-stream',
            size: blob.size,
            bytes
        }, [bytes]);
    } catch (err) {
        postToParent('caramel:error', { message: (err && err.message) || 'generation:complete' });
    }
}

/**
 * Traite un message entrant de la fenêtre parente.
 * @param {MessageEvent} event
 */
function onParentMessage(event) {
    // FAIL-CLOSED : sans origine parente résolue, on ignore TOUT message entrant.
    if (!allowedOrigin) {
        debugLog('embed', `message entrant ignoré (origine "${event.origin}") : origine parente inconnue (fail-closed)`);
        return;
    }
    // Validation d'origine : seule l'origine autorisée est acceptée.
    if (event.origin !== allowedOrigin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
    if (!data.type.startsWith('caramel:')) return;

    switch (data.type) {
        case 'caramel:init': {
            const applied = applyInit(data.payload || {});
            postToParent('caramel:init:ack', { applied });
            break;
        }
        case 'caramel:generate': {
            const payload = data.payload || {};
            const moduleKey = payload.activity || payload.moduleKey;
            if (!moduleKey || !CONFIG.allModuleKeys.includes(moduleKey)) {
                postToParent('caramel:error', { moduleKey: moduleKey || null, message: `activité inconnue: ${moduleKey}` });
                break;
            }
            // Pré-remplit le contexte fourni (si présent), puis pilote la génération.
            applyInit(payload);
            // Fire-and-forget : le résultat repart via generation:complete → caramel:generated.
            driveGeneration(moduleKey, payload.model).catch(err => {
                if (inFlight) { clearTimeout(inFlight.timer); inFlight = null; }
                postToParent('caramel:error', { moduleKey, message: (err && err.message) || 'échec de génération' });
            });
            break;
        }
        default:
            break;
    }
}

/**
 * Injecte la feuille de style compacte (une seule fois).
 */
function injectEmbedStyles() {
    if (document.querySelector(`link[href="${EMBED_CSS_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = EMBED_CSS_HREF;
    document.head.appendChild(link);
}

/**
 * Initialise le pont embarqué. **No-op si `?embed` est absent** (mode normal).
 * À appeler une fois, après le montage du DOM principal.
 * @returns {boolean} true si le pont a été activé.
 */
export function initEmbedBridge() {
    if (!isEmbedded()) return false; // mode normal : aucun effet, zéro régression.

    allowedOrigin = resolveAllowedOrigin();
    if (!allowedOrigin) {
        // Erreur de configuration d'intégration : visible même hors ?debug.
        const msg = '[embed] origine parente inconnue (ni ?origin= valide, ni referrer exploitable) : '
            + 'pont verrouillé (fail-closed) — aucun message ne sera émis ni accepté. '
            + 'Ajoutez ?origin=<origine de la page parente> à l\'URL d\'embarquement.';
        console.warn(msg);
        debugLog('embed', msg);
    }
    document.body.classList.add('caramel-embed');
    injectEmbedStyles();

    window.addEventListener('message', onParentMessage);
    document.addEventListener('generation:complete', onGenerationComplete);

    postToParent('caramel:ready', { version: PROTOCOL_VERSION });
    return true;
}

// Réexports internes pour les tests.
export const __testHooks = { onParentMessage, onGenerationComplete, setField, PROTOCOL_VERSION };
