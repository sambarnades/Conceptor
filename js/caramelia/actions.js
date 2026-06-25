/**
 * Caramelia — Interactions avec le DOM Caramel principal
 * Remplit les champs qui/quoi, trouve les tuiles, déclenche les générations.
 *
 * Le pipeline réel reste celui de Caramel (handlers existants).
 * Caramelia ne fait que cliquer aux bons endroits avec attente robuste
 * via MutationObserver (et non setTimeout en cascade).
 *
 * @module caramelia/actions
 */

import { CONFIG } from './config.js';
import { addBotMessage } from './dom.js';
import { t, tActivity } from './i18n.js';

// ── Remplissage des champs principaux Caramel ──
// `key` est l'une des clés de CONFIG.caramelSelectors (qui|quoi|niveau|nombreQuestions).
// Centralise le couplage avec les IDs Caramel.
export function fillFormField(key, val) {
    const sel = CONFIG.caramelSelectors[key];
    if (!sel) return;
    const f = document.querySelector(sel);
    if (!f) return;
    f.value = val ?? '';
    f.dispatchEvent(new Event('input', { bubbles: true }));
    f.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Déclenche la génération des prompts cachés (Caramel écoute les events `input`
 * sur qui/quoi et reconstruit ses prompts à la volée).
 */
export function triggerPromptGeneration() {
    try {
        const quiEl = document.querySelector(CONFIG.caramelSelectors.qui);
        const quoiEl = document.querySelector(CONFIG.caramelSelectors.quoi);
        if (quiEl) quiEl.dispatchEvent(new Event('input', { bubbles: true }));
        if (quoiEl) quoiEl.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {
        console.warn('[Caramelia] triggerPromptGeneration:', e);
    }
}

// ── Recherche de tuile ──
export function findActivityTile(moduleKey) {
    for (const sel of CONFIG.caramelSelectors.tileSelectors(moduleKey)) {
        const el = document.querySelector(sel);
        if (el) return el;
    }
    // Fallback : recherche textuelle
    const allTiles = document.querySelectorAll(CONFIG.caramelSelectors.tileFallback);
    // Pour le fallback text-search on enlève le suffixe (sinon on n'aurait pas de match dans le DOM Caramel)
    const label = (tActivity(moduleKey, { suffix: false }) || '').toLowerCase();
    if (label.length > 3) {
        for (const tile of allTiles) {
            if (tile.textContent.toLowerCase().includes(label)) return tile;
        }
    }
    return null;
}

/**
 * Watcher singleton : un seul MutationObserver mutualisé pour tous les
 * `waitForElement` concurrents. Sur un batch de N générations, on évite
 * d'avoir N observateurs qui scannent tous le subtree complet de body
 * à chaque mutation (= O(N × mutations)). Ici, O(1) observateur, et on le
 * disconnect quand plus personne n'attend (overhead nul à l'idle).
 */
const pendingWatchers = new Map(); // id -> { selector, resolve, timer }
let sharedObserver = null;
let nextWatcherId = 0;

function checkPending() {
    if (pendingWatchers.size === 0) return;
    for (const [id, w] of pendingWatchers) {
        const el = document.querySelector(w.selector);
        if (el) {
            clearTimeout(w.timer);
            pendingWatchers.delete(id);
            w.resolve(el);
        }
    }
    if (pendingWatchers.size === 0 && sharedObserver) {
        sharedObserver.disconnect();
        sharedObserver = null;
    }
}

function ensureObserver() {
    if (sharedObserver) return;
    sharedObserver = new MutationObserver(checkPending);
    sharedObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Attend qu'un élément matchant le sélecteur apparaisse dans le DOM.
 * Plus robuste que setTimeout fixe : s'adapte à la vitesse réelle d'ouverture
 * de la sidebar (chargement async, animations, connexion lente…).
 */
function waitForElement(selector, { timeoutMs = CONFIG.timing.sidebarMaxWait } = {}) {
    const existing = document.querySelector(selector);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve) => {
        const id = ++nextWatcherId;
        const timer = setTimeout(() => {
            if (pendingWatchers.delete(id)) resolve(null);
            if (pendingWatchers.size === 0 && sharedObserver) {
                sharedObserver.disconnect();
                sharedObserver = null;
            }
        }, timeoutMs);
        pendingWatchers.set(id, { selector, resolve, timer });
        ensureObserver();
    });
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Pour une activité à URL vidéo (InteractiveVideo) : remplit le champ « Lien de la vidéo »
 * dans la sidebar ouverte, déclenche la détection + transcription (Caramel le fait sur l'event
 * `input`), puis ATTEND que la section passe en `data-state="ready"` (transcription prête =
 * bouton de génération débloqué). Les vidéos longues PodEduc sont transcrites par lots → on
 * laisse jusqu'à 3 min. Renvoie true si prêt, false si erreur/collage manuel/timeout.
 * @param {string} moduleKey
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function fillVideoUrlAndWait(moduleKey, url) {
    const input = await waitForElement(CONFIG.caramelSelectors.videoUrlInput(moduleKey), { timeoutMs: 6000 });
    if (!input) return false;
    input.value = url;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const section = document.querySelector(CONFIG.caramelSelectors.videoSection(moduleKey));
    if (!section) return false;
    return new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            const st = section.dataset.state;
            if (st === 'ready') return resolve(true);
            if (st === 'error' || st === 'manual') return resolve(false);
            if (Date.now() - start > 180000) return resolve(false);
            setTimeout(tick, 500);
        };
        tick();
    });
}

/**
 * Attend que Caramel ait régénéré ses prompts cachés (`textarea[id^="hidden-"]`).
 * Caramel debounce le contextChange à 500ms après l'event `input` sur qui/quoi —
 * sans cette attente, la sidebar peut s'ouvrir avec un prompt vide.
 */
function waitForHiddenPrompts({ timeoutMs = CONFIG.timing.promptReadyMaxWait } = {}) {
    return new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            if (document.querySelector(CONFIG.caramelSelectors.hiddenPrompts)) return resolve(true);
            if (Date.now() - start > timeoutMs) return resolve(false);
            setTimeout(tick, 100);
        };
        tick();
    });
}

/**
 * Attend que la sidebar Caramel se referme (signal de fin de génération).
 * `attachLLMLogic` appelle `closeSidebar()` au succès, on observe la classe `open`.
 * Fallback : si la sidebar reste ouverte (LLM en erreur silencieuse, hang…),
 * on force la fermeture après le timeout pour ne pas bloquer la file d'attente.
 */
/**
 * Renvoie `{forced}` : true si on a dû fermer la sidebar manuellement après timeout
 * (signal de génération bloquée), false si elle s'est fermée normalement via
 * `attachLLMLogic.closeSidebar()` (signal de succès attendu).
 */
function waitForSidebarClose({ timeoutMs = CONFIG.timing.generationMaxWait } = {}) {
    const { sidebar: sidebarSel, sidebarOpenClass, sidebarCloseBtn } = CONFIG.caramelSelectors;
    const sidebar = document.querySelector(sidebarSel);
    if (!sidebar || !sidebar.classList.contains(sidebarOpenClass)) return Promise.resolve({ forced: false });

    return new Promise((resolve) => {
        let resolved = false;
        const finish = (forced) => { if (!resolved) { resolved = true; observer.disconnect(); resolve({ forced }); } };

        const observer = new MutationObserver(() => {
            if (!sidebar.classList.contains(sidebarOpenClass)) finish(false);
        });
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

        setTimeout(() => {
            if (resolved) return;
            // Fallback : la génération est restée bloquée — on force la fermeture
            const closeBtn = document.querySelector(sidebarCloseBtn);
            if (closeBtn) closeBtn.click();
            finish(true);
        }, timeoutMs);
    });
}

/**
 * Lance UNE génération : ouvre la tuile, clique sur LLM, attend la fin réelle.
 *
 * IMPORTANT : on NE ferme PAS la sidebar manuellement après le clic LLM.
 * `attachLLMLogic` (ui.js) le fait lui-même au succès via `closeSidebar()`.
 * La fermer prématurément vidait le DOM (sidebar.innerHTML = '' après 400ms),
 * ce qui détachait `jsonInputTarget` et faisait échouer silencieusement
 * `createBtn.click()` → animation qui tourne en boucle.
 *
 * Détection d'échec silencieux : on snapshot `batchIds.length` avant et après.
 * Si la sidebar se referme sans qu'aucune notification n'ait été créée,
 * c'est que `attachLLMLogic` a échoué côté Caramel (LLM 500, validation H5P
 * cassée…). Sans ce signal, l'utilisateur croit que tout va bien et finit
 * avec un ZIP partiel sans comprendre pourquoi.
 */
async function launchSingleGeneration(moduleKey, idx, total, batchIds, videoUrl) {
    const label = tActivity(moduleKey);
    addBotMessage(t('launch_progress', { idx, total, label }));

    const tile = findActivityTile(moduleKey);
    if (!tile) {
        addBotMessage(t('launch_tile_not_found', { label }));
        return;
    }

    tile.click();

    // Activité à URL vidéo : remplir le lien + attendre la transcription AVANT de cliquer
    // « Générer » (le bouton reste verrouillé tant que la transcription n'est pas prête).
    if (videoUrl && CONFIG.requiresVideoUrlKeys.includes(moduleKey)) {
        addBotMessage(t('video_url_detecting'));
        const ready = await fillVideoUrlAndWait(moduleKey, videoUrl);
        if (!ready) {
            addBotMessage(t('video_url_failed', { label }));
            const closeBtn = document.querySelector(CONFIG.caramelSelectors.sidebarCloseBtn);
            if (closeBtn) closeBtn.click();
            await delay(CONFIG.timing.afterCloseDelay);
            return;
        }
    }

    const llmBtn = await waitForElement(CONFIG.caramelSelectors.llmBtn(moduleKey));
    if (!llmBtn) {
        addBotMessage(t('launch_btn_not_found', { label }));
        const closeBtn = document.querySelector(CONFIG.caramelSelectors.sidebarCloseBtn);
        if (closeBtn) closeBtn.click();
        await delay(CONFIG.timing.afterCloseDelay);
        return;
    }

    const beforeCount = batchIds ? batchIds.length : 0;
    llmBtn.click();
    console.log(`[Caramelia] 🚀 Génération lancée: ${moduleKey}`);

    // Attente de la fin réelle (la sidebar se referme via attachLLMLogic au succès)
    const { forced } = await waitForSidebarClose();
    const afterCount = batchIds ? batchIds.length : beforeCount + 1;

    if (forced) {
        // Fermeture forcée après timeout : génération vraiment bloquée (LLM hang, etc.)
        addBotMessage(t('launch_timeout_failure', { label }));
    } else if (afterCount === beforeCount) {
        // Sidebar fermée normalement mais aucune notification créée :
        // attachLLMLogic a échoué silencieusement (LLM 500, validation, etc.)
        addBotMessage(t('launch_silent_failure', { label }));
    }

    await delay(CONFIG.timing.afterCloseDelay);
}

/**
 * Lance plusieurs générations en série (le centre de notifications les empile).
 * Capte les IDs des notifications créées pendant la chaîne pour permettre
 * un téléchargement ZIP groupé propre à ce batch (sans inclure les notifs antérieures).
 *
 * @returns {Promise<string[]>} IDs des notifications ajoutées pendant la chaîne
 */
export async function launchGenerations(moduleKeys, { qui, quoi, videoUrl } = {}) {
    if (qui !== undefined) fillFormField('qui', qui);
    if (quoi !== undefined) fillFormField('quoi', quoi);
    triggerPromptGeneration();

    const list = moduleKeys.map(k => '- ' + tActivity(k)).join('\n');
    addBotMessage(t('launch_intro', { count: moduleKeys.length, list }));

    // Capture des IDs ajoutés pendant ce batch (pour ZIP ciblé en fin de chaîne)
    const batchIds = [];
    const onAdded = (e) => {
        if (e.detail && e.detail.id) batchIds.push(e.detail.id);
    };
    document.addEventListener('notification:added', onAdded);

    try {
        // Attendre que Caramel ait fini de régénérer les prompts cachés (debounce 500ms)
        // Sans ça, le 1er tile.click() ouvrirait la sidebar sur un prompt vide.
        await waitForHiddenPrompts();

        for (let i = 0; i < moduleKeys.length; i++) {
            await launchSingleGeneration(moduleKeys[i], i + 1, moduleKeys.length, batchIds, videoUrl);
        }
    } finally {
        document.removeEventListener('notification:added', onAdded);
    }

    return batchIds;
}
