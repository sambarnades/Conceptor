/**
 * @file Gestion de l'intégration avec l'IA LLM.
 * Ce module gère la configuration des modèles disponibles, l'interface du sélecteur de modèles,
 * et la communication avec l'API du LLM via un serveur proxy (n8n).
 */

import { debugLog, DEBUG } from '../core/utils.js';
import { ENDPOINTS } from '../core/endpoints.js';
import { decideRagContextFromDom } from './rag-orchestrator.js';

// La clé API n'est pas stockée ici pour des raisons de sécurité.
// Elle est gérée côté serveur par le proxy n8n.

/**
 * @constant {Array<Object>} AVAILABLE_MODELS
 * Liste des modèles d'IA disponibles via l'API du LLM.
 */

// Cycle ILaaS de l'automne 2026 : `gpt-oss-120b` et `mistral-small-3.2-24b` sont arrêtés le
// 30-09-2026, `llama-3.3-70b` avait déjà quitté le catalogue ; retirés d'ici.
// `qwen-3.8-27b` remplace progressivement `qwen-3.6-35b-instruct`. Au 28-09-2026 il n'est PAS
// encore au catalogue : le Worker n8n échoue alors en ~2 s et retombe sur son premier fallback,
// `qwen-3.6-35b-instruct` (mesuré : `fallback_level: 1`, 6 s en tout). C'est voulu — « 3.8 sinon
// 3.6 » sans toucher n8n. L'id est déduit de la convention ILaaS (`qwen-3.6-35b-instruct`) :
// le vérifier au catalogue dès son arrivée (sonde n8n, mode `liste`), faute de quoi Qwen
// resterait en 3.6 à vie, sans rien dire.
export const AVAILABLE_MODELS = [
    { id: 'gemma-4-31b', displayName: 'Gemma 4', param: '31', owned_by: 'Google', type: 'text-generation', featured: true, order: 1, sizeTag: 'small' },
    { id: 'qwen-3.8-27b', displayName: 'Qwen 3.8', param: '27', owned_by: 'Qwen', type: 'text-generation', featured: true, order: 2, sizeTag: 'large' },
    { id: 'mistral-small-4-119b', displayName: 'Mistral Small 4', param: '119', owned_by: 'Mistral AI', type: 'text-generation', featured: true, order: 3, sizeTag: 'xl' },
    { id: 'qwen-3.6-35b-instruct', displayName: 'Qwen 3.6', param: '35', owned_by: 'Qwen', type: 'text-generation' },
    { id: 'llama-3.1-8b', displayName: 'LLaMa-3.1-8B', param: '8', owned_by: 'Neural Magic', type: 'text-generation' },
    { id: 'mistral-medium-latest', displayName: 'Mistral Medium', param: '~70', owned_by: 'Mistral AI', type: 'text-generation' }
];

/**
 * @constant {string} DEFAULT_MODEL
 * Modèle LLM utilisé par défaut sur tout le site Caramel.
 */
export const DEFAULT_MODEL = 'mistral-small-4-119b';

/**
 * @constant {Object} ACTIVITY_MODEL_OVERRIDES
 * Surcharge du modèle par défaut pour certaines activités spécifiques.
 * Clé : moduleKey de l'activité, en-tête dans definitions.js (ex: 'QuizSetQCM')
 * Valeur : ID du modèle LLM à utiliser pour cette activité
 */
export const ACTIVITY_MODEL_OVERRIDES = {
    // Aucun override actif : toutes les activités passent par DEFAULT_MODEL.
    //
    // ⚠️ NE PAS y inscrire de contournement d'INDISPONIBILITÉ. Une panne ILaaS est passagère et
    // la cascade de fallbacks du Worker est là pour l'absorber ; un override figé, lui, survit à
    // la panne et détourne durablement une activité vers un modèle qui n'était pas le bon choix.
    // Épisode fondateur (2026-08-26/27) : `mistral-small-4-119b` — le DEFAULT_MODEL — partait en
    // fallback à TOUS les coups, y compris sur un prompt de 90 caractères (mesuré 6/6 sur les
    // webhooks de PROD, ~4 s par essai perdu), pendant que `gpt-oss-120b` et
    // `qwen-3.6-35b-instruct` répondaient en 4-5 s. Symptôme d'un modèle en carafe, PAS d'un
    // prompt trop lourd ni du mur des 59 s (un mur de temps échoue à 59 s, pas à 4 s).
    // Sonde de diagnostic, à refaire avant toute conclusion :
    //     node scripts/test-interactive-video-llm.mjs --prod --model <id> --transcript <fichier>
    // Appels ISOLÉS obligatoires : trois requêtes rapprochées saturent le backend PARTAGÉ et
    // fabriquent des fallbacks en cascade qu'on prend à tort pour un défaut du modèle.
    //
    // Anciens overrides, pour mémoire : `gpt-oss-120b` est arrêté par ILaaS le 30-09-2026, ils ne
    // peuvent plus être réactivés tels quels. Un override futur exige un benchmark, pour un motif
    // de QUALITÉ ou de VITESSE reproductible — jamais pour une panne du jour :
    // 'QuizSetQCM': 'gpt-oss-120b',        // Plus rapide et plus fiable pour les QCM
    // 'QuizSetVF': 'gpt-oss-120b',         // Idem pour les Vrai/Faux
    // 'QuizSet': 'gpt-oss-120b',           // Idem pour les Quiz génériques
    // 'Page': 'gpt-oss-120b',              // Idem pour Page
    // 'Livre': 'gpt-oss-120b',             // Idem pour Livre (Page multi-chapitres)
    // 'test_elea': 'gpt-oss-120b',         // Idem pour Test (XML)
    // 'CoursePresentation': 'gpt-oss-120b', // Structure complexe avec slides et sous-exercices
    // 'InteractiveBook': 'gpt-oss-120b',   // Structure conteneur riche (chapitres + blocs)
    // 'InteractiveVideo': 'gpt-oss-120b'   // Conteneur vidéo + interactions horodatées ; seul des 3 à
                                            // RECOPIER les horodatages réels (motif de QUALITÉ, à mesurer)
};

// =======================================================================

/**
 * Remplit le menu déroulant du sélecteur de modèles avec les informations appropriées.
 * @param {string} moduleKey - La clé identifiant le module (ex: 'Timeline').
 * @param {Array<Object>} models - La liste des modèles disponibles (généralement AVAILABLE_MODELS).
 * @param {function} onSelectCallback - La fonction à appeler lorsqu'un modèle est sélectionné.
 * @param {string} selectedModel - L'ID du modèle actuellement sélectionné.
 * @param {Object} translations - L'objet contenant les traductions de l'interface.
 */
export function populateModelSelector(moduleKey, models, onSelectCallback, selectedModel, translations) {
    const dropdown = document.getElementById(`model-selector-dropdown-${moduleKey}`);
    if (!dropdown) return;
    dropdown.innerHTML = ''; // Vider la liste

    const textModels = models.filter(model => model.type === 'text-generation' || model.type === 'image-text-to-text');
    const featuredModels = textModels.filter(model => model.featured);
    // En mode ?debug, on affiche tous les modèles (utile pour tester les nouveaux modèles ILaaS).
    // Sinon, on n'affiche que les modèles "featured" (3 par défaut).
    const baseModels = (DEBUG || featuredModels.length === 0) ? textModels : featuredModels;
    const modelsToShow = baseModels.slice().sort((a, b) => {
        const ao = (typeof a.order === 'number') ? a.order : Number.POSITIVE_INFINITY;
        const bo = (typeof b.order === 'number') ? b.order : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return String(a.id).localeCompare(String(b.id));
    });

    modelsToShow.forEach(model => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'menuitem');
        listItem.setAttribute('tabindex', '0');
        listItem.dataset.modelId = model.id;

        const sizeTag = model.sizeTag;

        // Remplacement global des tirets (replace('-', …) ne remplaçait que le premier)
        const summaryKey = sizeTag ? `llm_${sizeTag}_summary` : `${model.id.replace(/-/g, '_')}_summary`;
        const technicalKey = sizeTag ? `llm_${sizeTag}_technical` : `${model.id.replace(/-/g, '_')}_technical`;

        // Fallback : si aucun résumé spécifique n'est défini (modèle sans sizeTag, ex. modèles
        // affichés uniquement en mode ?debug), on génère un résumé par défaut depuis les
        // métadonnées du modèle via la clé i18n llm_default_summary.
        const summary = translations[summaryKey]
            || (translations.llm_default_summary || '')
                .replace('{name}', model.displayName || model.id)
                .replace('{company}', model.owned_by || '')
                .replace('{params}', model.param || '?');
        const modelSource = model.owned_by || translations[technicalKey] || '';

        const parameterUnit = translations.llm_model_parameters_unit || '';
        const parameters = model.param
            ? `${model.param}${parameterUnit ? ` ${parameterUnit}` : ''}`.trim()
            : (parameterUnit || '');

        const displayName = model.displayName
            || (sizeTag ? (translations[`llm_display_${sizeTag}`] || '') : '')
            || model.id;
        listItem.innerHTML = `
            <strong>${displayName}</strong><br>
            <small>${summary}</small>
            <div class="model-pills-container">
                <div class="model-pills">
                    <span class="pill-label">${translations.llm_model_parameters}</span>
                    <span class="pill-value">${parameters}</span>
                </div>
                <div class="model-pills">
                    <span class="pill-label">${translations.llm_model_source}</span>
                    <span class="pill-value">${modelSource}</span>
                </div>
            </div>
        `;
        
        if (model.id === selectedModel) {
            listItem.classList.add('selected');
        }
        const selectModel = () => {
            onSelectCallback(model.id);
            const allItems = dropdown.querySelectorAll('li');
            allItems.forEach(item => item.classList.remove('selected'));
            listItem.classList.add('selected');
        };
        listItem.addEventListener('click', selectModel);
        listItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectModel();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = listItem.nextElementSibling;
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = listItem.previousElementSibling;
                if (prev) prev.focus();
            }
        });
        dropdown.appendChild(listItem);
    });
}

/**
 * Extrait le contenu JSON d'une réponse brute du LLM.
 * Gère les blocs de code markdown, les réponses JSON directes, etc.
 * @param {string} content - Le contenu brut à parser.
 * @returns {string} Le contenu JSON nettoyé.
 * @throws {Error} Si aucun contenu exploitable n'est trouvé.
 */
function extractJsonContent(content) {
    if (!content || typeof content !== 'string') {
        throw new Error("La réponse du proxy n8n est vide ou dans un format inattendu.");
    }

    // 1. Extraire le JSON d'un bloc de code markdown (```json ... ``` ou ```json{...}```)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1].trim();
    }

    // 2. Chercher le début d'un objet ou tableau JSON
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');
    let startIndex = -1;

    if (firstBrace > -1 && firstBracket > -1) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace > -1) {
        startIndex = firstBrace;
    } else {
        startIndex = firstBracket;
    }

    if (startIndex > -1) {
        // Log warning si du texte a été ignoré avant le JSON
        if (startIndex > 0) {
            console.warn('[LLM] Texte ignoré avant le JSON:', content.substring(0, startIndex).trim());
        }

        const jsonCandidate = content.substring(startIndex);

        // 3. Vérifier l'intégrité du JSON en comptant les accolades/crochets
        let depth = 0;
        let inString = false;
        let escaped = false;
        let endIndex = -1;

        for (let i = 0; i < jsonCandidate.length; i++) {
            const c = jsonCandidate[i];
            if (escaped) { escaped = false; continue; }
            if (c === '\\' && inString) { escaped = true; continue; }
            if (c === '"') { inString = !inString; continue; }
            if (inString) continue;

            // Compter TOUTES les accolades et crochets, pas seulement openChar
            if (c === '{' || c === '[') depth++;
            if (c === '}' || c === ']') depth--;

            if (depth === 0) { endIndex = i; break; }
        }

        if (endIndex > -1) {
            // JSON complet trouvé (ne garder que le premier bloc)
            return jsonCandidate.substring(0, endIndex + 1).trim();
        }

        // JSON potentiellement tronqué, retourner tel quel
        return jsonCandidate.trim();
    }

    return content.trim();
}

// =======================================================================
// Endpoints n8n (architecture polling Postgres v5.2)
// =======================================================================
// Submit  : POST → {taskId, status: 'pending'}, retour quasi instantané (~100ms)
// Result  : GET ?taskId=xxx → {status: 'processing'|'done'|'error'|'not_found', ...}
//
// Le client soumet une fois, puis poll Result toutes les ~3 secondes
// jusqu'à recevoir status='done' (ou 'error').
//
// URLs centralisées dans core/endpoints.js (réécrites en prod par la CI).
// =======================================================================
const LLM_SUBMIT_URL = ENDPOINTS.llmSubmit;
const LLM_RESULT_URL = ENDPOINTS.llmResult;

/**
 * Cadencement du polling. Objet EXPORTÉ et mutable, et non trois `const` privées,
 * pour une seule raison : le rendre observable et surchargeable par les tests.
 *
 * Sans cela, la boucle de polling — soumission, reprise sur erreur réseau, statuts
 * `error`/`not_found`, timeout global — était strictement intestable : le moindre cas
 * imposait 5 s d'attente initiale, et le chemin « délai dépassé » 5 MINUTES. C'est
 * précisément pourquoi ce module, sur le chemin critique de chaque génération, n'a
 * jamais eu le moindre test.
 *
 * Les valeurs de PRODUCTION sont celles écrites ici ; `tests/test-llm-service.js` les
 * abaisse à quelques millisecondes le temps d'une assertion puis les restaure, et
 * vérifie en fin de suite qu'elles ont bien retrouvé leur valeur nominale.
 *
 *  · initialDelayMs — la plupart des LLM mettent au moins 5 s à répondre : poller plus
 *    tôt ne ferait que gaspiller des requêtes.
 *  · intervalMs     — intervalle entre 2 polls successifs.
 *  · timeoutMs      — garde-fou global : au-delà, on abandonne avec un message clair.
 */
export const POLL_TIMINGS = {
    initialDelayMs: 5000,
    intervalMs: 3000,
    timeoutMs: 300000
};

// =======================================================================
// Annulation d'une génération en cours
// =======================================================================
// Toute génération — mono-appel comme génération par lots — passe par
// `generateRawWithLLM`. C'est donc ici, et nulle part ailleurs, qu'on installe
// le point d'arrêt : un seul drapeau suffit à couper l'attente, quel que soit le
// nombre d'appels que l'activité demande.
//
// Ce qu'on arrête vraiment : **l'attente côté navigateur**. La tâche déjà
// soumise continue sa vie côté serveur (elle est en file dans Postgres) et
// finira par se terminer dans le vide. On ne prétend donc pas « annuler la
// génération » côté serveur — on rend simplement la main à l'enseignant, ce qui
// est précisément ce qu'il demande quand il clique.

const CANCELLED = 'GENERATION_CANCELLED';
let cancelRequested = false;
const inFlightControllers = new Set();   // requêtes en vol, à interrompre net
const sleepWakers = new Set();           // attentes de polling, à réveiller net

/** Vrai si `err` est une annulation utilisateur, et non un échec technique. */
export function isCancellation(err) {
    return !!err && err.code === CANCELLED;
}

function cancellationError() {
    const err = new Error('Génération interrompue à la demande de l\'utilisateur.');
    err.code = CANCELLED;
    return err;
}

/**
 * À appeler au DÉMARRAGE d'une génération : réarme le drapeau.
 * Surtout pas au début de `generateRawWithLLM` — une génération par lots
 * l'appelle N fois et effacerait l'annulation demandée entre deux lots.
 */
export function beginGeneration() {
    cancelRequested = false;
}

/** Vrai si l'utilisateur a demandé l'arrêt de la génération en cours. */
export function isCancelRequested() {
    return cancelRequested;
}

/**
 * Demande l'arrêt de la génération en cours. Effet immédiat : les requêtes en
 * vol sont interrompues et les attentes de polling réveillées, sans quoi on
 * resterait jusqu'à 5 s (délai initial) ou 3 s (intervalle) sur un bouton déjà
 * cliqué — largement assez pour croire qu'il n'a rien fait.
 */
export function requestCancelGeneration() {
    cancelRequested = true;
    for (const ctrl of inFlightControllers) {
        try { ctrl.abort(); } catch { /* déjà terminée */ }
    }
    inFlightControllers.clear();
    for (const wake of Array.from(sleepWakers)) wake();
}

/** Attente interruptible : se réveille aussi sur `requestCancelGeneration()`. */
function sleepOrCancel(ms) {
    return new Promise(resolve => {
        const done = () => { clearTimeout(timer); sleepWakers.delete(done); resolve(); };
        const timer = setTimeout(done, ms);
        sleepWakers.add(done);
    });
}

/** `fetch` dont on garde la poignée d'interruption le temps de la requête. */
async function fetchInterruptible(url, opts = {}) {
    const ctrl = new AbortController();
    inFlightControllers.add(ctrl);
    try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
        inFlightControllers.delete(ctrl);
    }
}

/** Lève l'annulation si elle a été demandée. À appeler à chaque point d'attente. */
function throwIfCancelled() {
    if (cancelRequested) throw cancellationError();
}

/**
 * Lit le contexte RAG programmes scolaires depuis le DOM : discipline (champ "qui"),
 * sujet pédagogique (champ "quoi") et niveau saisis par l'enseignant. Le Worker n8n
 * s'en sert pour une recherche RAG non-bloquante sur les programmes officiels
 * (collection 56). La pertinence ET le cycle (multilingue) sont décidés par
 * l'orchestrateur (`services/rag-orchestrator.js`) : `context` vaut null si le RAG
 * doit être ignoré (champs vides, public hors scolaire, thème sans ancrage
 * programme, corpus fourni) ; `reason` sert uniquement au log ?debug local.
 * @returns {{context: (Object|null), reason: string, cycle: string}}
 */
function readRagContextFromDom() {
    return decideRagContextFromDom(debugLog);
}

/**
 * Primitive bas-niveau : envoie UN prompt au LLM via le proxy n8n (submit/poll) et
 * renvoie le résultat BRUT enrichi (contenu nettoyé + métadonnées tokens/modèle).
 * C'est la brique réutilisée à la fois par `generateH5PWithLLM` (1 prompt → 1 JSON)
 * et par le moteur de génération par lots `services/llm-batch.js` (N appels).
 *
 * Pipeline :
 *   1. POST submit → {taskId} (~100ms)
 *   2. GET result?taskId=xxx en boucle (POLL_TIMINGS.intervalMs), timeout POLL_TIMINGS.timeoutMs
 *   3. done → résultat ; error/not_found → throw
 *
 * @param {string} prompt - Le prompt à envoyer.
 * @param {string} model - L'ID du modèle.
 * @param {Object} [opts]
 * @param {Object} [opts.activityMeta] - Métadonnées d'activité (Grist/stats côté Worker).
 * @param {Object} [opts.rag] - Contexte RAG explicite ({sujet,discipline,niveau}) ou null.
 * @param {string} [opts.stats] - 'skip' pour les sous-appels du découpage (le Worker
 *        n'écrit alors PAS de ligne Grist → 1 seule ligne agrégée par génération).
 * @returns {Promise<{content:string, rawContent:string, promptTokens:number, completionTokens:number, model:string, fallbackLevel:number, durationS:number}>}
 * @throws {Error} Si la soumission échoue, si le LLM échoue, ou si le timeout est atteint.
 */
export async function generateRawWithLLM(prompt, model, { activityMeta = null, rag = null, stats = null } = {}) {
    debugLog('LLM', `Appel au proxy n8n avec le modèle ${model}${stats ? ` (stats=${stats})` : ''}`);

    const requestBody = { prompt, model };
    if (activityMeta) requestBody.activity = activityMeta;
    if (rag) requestBody.rag = rag;
    // Sous-appel d'une génération par lots : on demande au Worker de NE PAS écrire
    // dans Grist (la ligne agrégée unique est écrite en fin par le moteur de lots).
    if (stats) requestBody.stats = stats;

    let perfMod;
    try { perfMod = await import('../core/perf-tracker.js'); } catch { perfMod = null; }

    try {
        // Une génération par lots enchaîne N appels : si l'arrêt a été demandé
        // pendant le lot précédent, on ne soumet pas le suivant.
        throwIfCancelled();

        // === Étape 1 : Soumission ===
        if (perfMod) perfMod.markStart('llm', 'Soumission requête n8n');
        const submitResponse = await fetchInterruptible(LLM_SUBMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!submitResponse.ok) {
            // Le corps brut de la réponse serveur ne doit pas remonter jusqu'à
            // l'utilisateur : on le journalise en debug et on ne garde qu'un
            // message court (status + statusText) dans l'erreur.
            const errorBody = await submitResponse.text().catch(() => '');
            debugLog('llm', `Corps de la réponse d'erreur n8n (submit) : ${errorBody}`);
            throw new Error(`Erreur du proxy n8n (submit) : ${submitResponse.status} ${submitResponse.statusText}`);
        }

        const submitData = await submitResponse.json();
        if (!submitData.taskId) {
            throw new Error('Réponse submit invalide : taskId manquant.');
        }

        const { taskId } = submitData;
        if (perfMod) perfMod.markEnd('llm', 'Soumission requête n8n', { taskId });
        debugLog('LLM', `Tâche soumise. TaskId: ${taskId}. Démarrage du polling...`);

        // === Étape 2 : Polling ===
        if (perfMod) perfMod.markStart('llm', 'Polling LLM result');
        const startTime = Date.now();

        // Délai initial : on laisse au Worker le temps de démarrer le LLM
        // (la plupart des appels mettent au moins 5s à répondre)
        await sleepOrCancel(POLL_TIMINGS.initialDelayMs);
        throwIfCancelled();

        let pollCount = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Sécurité : timeout global
            if (Date.now() - startTime > POLL_TIMINGS.timeoutMs) {
                throw new Error('Délai dépassé : la génération a pris trop de temps (5 minutes). Veuillez réessayer.');
            }

            pollCount++;
            const pollUrl = `${LLM_RESULT_URL}?taskId=${encodeURIComponent(taskId)}`;
            let pollResponse;
            try {
                pollResponse = await fetchInterruptible(pollUrl, { method: 'GET' });
            } catch (networkError) {
                // Une interruption volontaire arrive ici sous forme d'AbortError :
                // sans ce test, elle serait prise pour un incident réseau et le
                // polling repartirait de plus belle.
                throwIfCancelled();
                // Erreur réseau transitoire : on attend et on retente
                console.warn(`[LLM] Erreur réseau au poll #${pollCount}, retry dans ${POLL_TIMINGS.intervalMs}ms`, networkError);
                await sleepOrCancel(POLL_TIMINGS.intervalMs);
                throwIfCancelled();
                continue;
            }

            if (!pollResponse.ok) {
                throw new Error(`Erreur du proxy n8n (poll) : ${pollResponse.status} ${pollResponse.statusText}`);
            }

            const pollData = await pollResponse.json();

            if (pollData.status === 'processing') {
                // Encore en cours, on attend et on retente
                await sleepOrCancel(POLL_TIMINGS.intervalMs);
                throwIfCancelled();
                continue;
            }

            if (pollData.status === 'done') {
                // Course : l'arrêt a pu être demandé pendant que ce dernier poll
                // était en vol. Rendre le résultat quand même produirait le
                // fichier que l'enseignant vient d'annuler — on le jette. C'est
                // le seul endroit à couvrir : les quatre chemins de génération
                // passent tous par ici.
                throwIfCancelled();
                const llmDurationS = Math.round((Date.now() - startTime) / 1000);
                if (perfMod) perfMod.markEnd('llm', 'Polling LLM result', {
                    durationSeconds: llmDurationS,
                    contentLength: pollData.content ? pollData.content.length : 0,
                    pollCount: pollCount,
                    fallbackLevel: pollData.fallback_level || 0
                });
                debugLog('LLM', `Résultat reçu après ${llmDurationS}s et ${pollCount} polls (modèle final : ${pollData.model}).`);
                return {
                    content: extractJsonContent(pollData.content),
                    rawContent: pollData.content || '',
                    promptTokens: pollData.prompt_tokens || 0,
                    completionTokens: pollData.completion_tokens || 0,
                    model: pollData.model || model,
                    fallbackLevel: pollData.fallback_level || 0,
                    durationS: llmDurationS
                };
            }

            if (pollData.status === 'error') {
                throw new Error(pollData.message || 'Erreur lors de la génération par l\'IA.');
            }

            if (pollData.status === 'not_found') {
                throw new Error('Tâche introuvable côté serveur : elle a peut-être expiré. Veuillez réessayer.');
            }

            // Status inattendu (ne devrait jamais arriver)
            throw new Error(`Status inattendu reçu du proxy n8n : ${pollData.status}`);
        }

    } catch (error) {
        // Une annulation n'est pas un incident : la journaliser en `error` ferait
        // remonter une fausse alerte dans la console de l'enseignant.
        if (isCancellation(error)) {
            debugLog('LLM', 'Génération interrompue à la demande de l\'utilisateur.');
        } else {
            console.error("Erreur lors de l'appel au proxy n8n pour le LLM", error);
        }
        throw error;
    }
}

/**
 * Envoie un prompt au LLM via le proxy n8n et renvoie le contenu JSON nettoyé.
 * Wrapper historique au-dessus de `generateRawWithLLM` : signature et comportement
 * INCHANGÉS (lit le contexte RAG depuis le DOM, écrit 1 ligne Grist côté Worker).
 *
 * @param {string} prompt - Le prompt à envoyer au modèle d'IA.
 * @param {string} model - L'ID du modèle d'IA à utiliser.
 * @param {Object} [activityMeta] - Métadonnées de l'activité (moduleKey, category, etc.)
 * @returns {Promise<string>} Le contenu textuel généré par l'IA, nettoyé des blocs de code.
 * @throws {Error} Si la soumission échoue, si le LLM échoue, ou si le timeout est atteint.
 */
export async function generateH5PWithLLM(prompt, model, activityMeta) {
    // La raison de la décision RAG n'est PAS transmise au serveur (aucune
    // persistance souhaitée) : elle n'existe que dans le log ?debug.
    const { context: rag } = readRagContextFromDom();
    const result = await generateRawWithLLM(prompt, model, { activityMeta, rag });
    return result.content;
}
