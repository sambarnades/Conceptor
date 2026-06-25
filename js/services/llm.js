/**
 * @file Gestion de l'intégration avec l'IA LLM.
 * Ce module gère la configuration des modèles disponibles, l'interface du sélecteur de modèles,
 * et la communication avec l'API du LLM via un serveur proxy (n8n).
 */

import { debugLog, DEBUG } from '../core/utils.js';
import { ENDPOINTS } from '../core/endpoints.js';

// La clé API n'est pas stockée ici pour des raisons de sécurité.
// Elle est gérée côté serveur par le proxy n8n.

/**
 * @constant {Array<Object>} AVAILABLE_MODELS
 * Liste des modèles d'IA disponibles via l'API du LLM.
 */

export const AVAILABLE_MODELS = [
    { id: 'qwen-3.6-35b-instruct', displayName: 'Qwen 3.6', param: '35', owned_by: 'Qwen', type: 'text-generation', featured: true, order: 1, sizeTag: 'large' },
    { id: 'mistral-small-4-119b', displayName: 'Mistral Small 4', param: '119', owned_by: 'Mistral AI', type: 'text-generation', featured: true, order: 2, sizeTag: 'xl' },
    { id: 'gpt-oss-120b', displayName: 'GPT-OSS', param: '120', owned_by: 'OpenAI', type: 'text-generation', featured: true, order: 3, sizeTag: 'xl' },
    { id: 'mistral-small-3.2-24b', displayName: 'Mistral-Small-3.2', param: '24', owned_by: 'Mistral AI', type: 'text-generation', sizeTag: 'small' },
    { id: 'llama-3.3-70b', displayName: 'LLaMa-3.3', param: '70', owned_by: 'RedHatAI', type: 'text-generation' },
    { id: 'llama-3.1-8b', displayName: 'LLaMa-3.1-8B', param: '8', owned_by: 'Neural Magic', type: 'text-generation' },
    { id: 'gemma-4-31b', displayName: 'Gemma 4', param: '31', owned_by: 'Google', type: 'text-generation' },
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
    // Aucun override actif pour le moment : toutes les activités passent par DEFAULT_MODEL.
    // Anciens overrides (à réactiver après benchmark de mistral-small-4-119b) :
    // 'QuizSetQCM': 'gpt-oss-120b',        // Plus rapide et plus fiable pour les QCM
    // 'QuizSetVF': 'gpt-oss-120b',         // Idem pour les Vrai/Faux
    // 'QuizSet': 'gpt-oss-120b',           // Idem pour les Quiz génériques
    // 'Page': 'gpt-oss-120b',              // Idem pour Page
    // 'Livre': 'gpt-oss-120b',             // Idem pour Livre (Page multi-chapitres)
    // 'test_elea': 'gpt-oss-120b',         // Idem pour Test (XML)
    // 'CoursePresentation': 'gpt-oss-120b', // Structure complexe avec slides et sous-exercices
    // 'InteractiveBook': 'gpt-oss-120b',   // Structure conteneur riche (chapitres + blocs) — réactiver après benchmark
    // 'InteractiveVideo': 'gpt-oss-120b'   // Conteneur vidéo + interactions horodatées — réactiver après benchmark
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

// Délai avant le premier poll : la plupart des LLM mettent au moins 5s à répondre,
// inutile de poller plus tôt et de gaspiller des requêtes.
const POLL_INITIAL_DELAY_MS = 5000;
// Intervalle entre 2 polls successifs.
const POLL_INTERVAL_MS = 3000;
// Timeout global de sécurité : si on n'a toujours rien après 5 minutes, on abandonne.
const POLL_TIMEOUT_MS = 300000;

/**
 * Lit le contexte RAG programmes scolaires depuis le DOM : discipline (champ "qui"),
 * sujet pédagogique (champ "quoi") et niveau saisis par l'enseignant. Le Worker n8n
 * s'en sert pour une recherche RAG non-bloquante sur les programmes officiels
 * (collection 56). Renvoie null si tout est vide (le Worker ignore alors le RAG).
 * @returns {{sujet:string, discipline:string, niveau:string}|null}
 */
function readRagContextFromDom() {
    const ragSujet = document.getElementById('quoi')?.value?.trim() || '';
    const ragDiscipline = document.getElementById('qui')?.value?.trim() || '';
    const ragNiveau = document.getElementById('niveau')?.value?.trim() || '';
    if (ragSujet || ragDiscipline || ragNiveau) {
        return { sujet: ragSujet, discipline: ragDiscipline, niveau: ragNiveau };
    }
    return null;
}

/**
 * Primitive bas-niveau : envoie UN prompt au LLM via le proxy n8n (submit/poll) et
 * renvoie le résultat BRUT enrichi (contenu nettoyé + métadonnées tokens/modèle).
 * C'est la brique réutilisée à la fois par `generateH5PWithLLM` (1 prompt → 1 JSON)
 * et par le moteur de génération par lots `services/llm-batch.js` (N appels).
 *
 * Pipeline :
 *   1. POST submit → {taskId} (~100ms)
 *   2. GET result?taskId=xxx en boucle (POLL_INTERVAL_MS), timeout POLL_TIMEOUT_MS
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
        // === Étape 1 : Soumission ===
        if (perfMod) perfMod.markStart('llm', 'Soumission requête n8n');
        const submitResponse = await fetch(LLM_SUBMIT_URL, {
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
        await new Promise(resolve => setTimeout(resolve, POLL_INITIAL_DELAY_MS));

        let pollCount = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Sécurité : timeout global
            if (Date.now() - startTime > POLL_TIMEOUT_MS) {
                throw new Error('Délai dépassé : la génération a pris trop de temps (5 minutes). Veuillez réessayer.');
            }

            pollCount++;
            const pollUrl = `${LLM_RESULT_URL}?taskId=${encodeURIComponent(taskId)}`;
            let pollResponse;
            try {
                pollResponse = await fetch(pollUrl, { method: 'GET' });
            } catch (networkError) {
                // Erreur réseau transitoire : on attend et on retente
                console.warn(`[LLM] Erreur réseau au poll #${pollCount}, retry dans ${POLL_INTERVAL_MS}ms`, networkError);
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
                continue;
            }

            if (!pollResponse.ok) {
                throw new Error(`Erreur du proxy n8n (poll) : ${pollResponse.status} ${pollResponse.statusText}`);
            }

            const pollData = await pollResponse.json();

            if (pollData.status === 'processing') {
                // Encore en cours, on attend et on retente
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
                continue;
            }

            if (pollData.status === 'done') {
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
        console.error("Erreur lors de l'appel au proxy n8n pour le LLM", error);
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
    const rag = readRagContextFromDom();
    const result = await generateRawWithLLM(prompt, model, { activityMeta, rag });
    return result.content;
}
