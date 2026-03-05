/**
 * @file Gestion de l'intégration avec l'IA LLM.
 * Ce module gère la configuration des modèles disponibles, l'interface du sélecteur de modèles,
 * et la communication avec l'API du LLM via un serveur proxy (n8n).
 */

import { debugLog } from '../core/utils.js';

// La clé API n'est pas stockée ici pour des raisons de sécurité.
// Elle est gérée côté serveur par le proxy n8n.

/**
 * @constant {Array<Object>} AVAILABLE_MODELS
 * Liste des modèles d'IA disponibles via l'API du LLM.
 */

export const AVAILABLE_MODELS = [
    { id: 'mistral-small-3.2-24b', displayName: 'Mistral-Small-3.2', param: '24', owned_by: 'Mistral AI', type: 'text-generation', featured: true, order: 1, sizeTag: 'small' },
    { id: 'qwen-3-30b', displayName: 'Qwen 3 30B', param: '30', owned_by: 'Qwen', type: 'text-generation', featured: true, order: 2, sizeTag: 'large' },
    { id: 'gpt-oss-120b', displayName: 'GPT-OSS', param: '120', owned_by: 'OpenAI', type: 'text-generation', featured: true, order: 3, sizeTag: 'xl' },
    { id: 'llama-3.3-70b', displayName: 'LLaMa-3.3', param: '70', owned_by: 'RedHatAI', type: 'text-generation'},
    { id: 'llama-3.1-8b', displayName: 'LLaMa-3.1-8B', param: '8', owned_by: 'Neural Magic', type: 'text-generation' }
];

/**
 * @constant {string} DEFAULT_MODEL
 * Modèle LLM utilisé par défaut sur tout le site Caramel.
 */
export const DEFAULT_MODEL = 'mistral-small-3.2-24b';

/**
 * @constant {Object} ACTIVITY_MODEL_OVERRIDES
 * Surcharge du modèle par défaut pour certaines activités spécifiques.
 * Clé : moduleKey de l'activité, en-tête dans definitions.js (ex: 'QuizSetQCM')
 * Valeur : ID du modèle LLM à utiliser pour cette activité
 */
export const ACTIVITY_MODEL_OVERRIDES = {
    'QuizSetQCM': 'gpt-oss-120b',  // Plus rapide et plus fiable pour les QCM
    'QuizSetVF': 'gpt-oss-120b',    // Idem pour les Vrai/Faux
    'QuizSet': 'gpt-oss-120b',    // Idem pour les Quiz génériques
    'Page': 'gpt-oss-120b',       // Idem pour Page
    'test_elea': 'gpt-oss-120b' // Idem pour Test (XML)
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
    const modelsToShow = (featuredModels.length > 0)
        ? featuredModels.slice().sort((a, b) => {
            const ao = (typeof a.order === 'number') ? a.order : Number.POSITIVE_INFINITY;
            const bo = (typeof b.order === 'number') ? b.order : Number.POSITIVE_INFINITY;
            if (ao !== bo) return ao - bo;
            return String(a.id).localeCompare(String(b.id));
        })
        : textModels;

    modelsToShow.forEach(model => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'menuitem');
        listItem.dataset.modelId = model.id;

        const sizeTag = model.sizeTag;

        const summaryKey = sizeTag ? `llm_${sizeTag}_summary` : `${model.id.replace('-', '_')}_summary`;
        const technicalKey = sizeTag ? `llm_${sizeTag}_technical` : `${model.id.replace('-', '_')}_technical`;

        const summary = translations[summaryKey] || '';
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
        listItem.addEventListener('click', () => {
            onSelectCallback(model.id); // Le callback gère maintenant la fermeture

            // Mettre à jour la classe 'selected'
            const allItems = dropdown.querySelectorAll('li');
            allItems.forEach(item => item.classList.remove('selected'));
            listItem.classList.add('selected');
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

/**
 * Envoie un prompt à l'API du LLM via le proxy n8n et retourne le contenu généré.
 * Utilise un pattern asynchrone avec Wait node : soumission → réponse immédiate
 * avec resumeUrl → requête différée unique pour récupérer le résultat.
 *
 * @param {string} prompt - Le prompt à envoyer au modèle d'IA.
 * @param {string} model - L'ID du modèle d'IA à utiliser.
 * @param {Object} [activityMeta] - Métadonnées de l'activité (moduleKey, category, etc.)
 * @returns {Promise<string>} Le contenu textuel généré par l'IA, nettoyé des blocs de code.
 * @throws {Error} Si la réponse du proxy n'est pas valide ou si une erreur réseau survient.
 */
export async function generateH5PWithLLM(prompt, model, activityMeta) {
    debugLog('LLM', `Appel au proxy n8n avec le modèle ${model}`);

    const proxyUrl = "https://n8n.incubateur.education.gouv.fr/webhook/llmdev2";

    const requestBody = {
        prompt: prompt,
        model: model
    };

    if (activityMeta) {
        requestBody.activity = activityMeta;
    }

    let perfMod;
    try { perfMod = await import('../core/perf-tracker.js'); } catch { perfMod = null; }

    try {
        // === Étape 1 : Soumission de la requête ===
        if (perfMod) perfMod.markStart('llm', 'Soumission requête n8n');
        const submitResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!submitResponse.ok) {
            const errorBody = await submitResponse.text();
            throw new Error(`Erreur du proxy n8n : ${submitResponse.status} ${submitResponse.statusText} - ${errorBody}`);
        }

        const submitData = await submitResponse.json();

        // Vérifier qu'on a bien un taskId et une resumeUrl (pattern Wait node)
        if (!submitData.taskId || !submitData.resumeUrl) {
            // Fallback : réponse directe (ancien comportement)
            console.warn('Réponse sans taskId/resumeUrl, traitement en mode direct.');
            const content = submitData.content || JSON.stringify(submitData);
            return extractJsonContent(content);
        }

        const { taskId, resumeUrl } = submitData;
        if (perfMod) perfMod.markEnd('llm', 'Soumission requête n8n', { taskId });
        debugLog('LLM', `Tâche soumise. TaskId: ${taskId}. Récupération via resumeUrl...`);

        // === Étape 2 : Requête unique vers resumeUrl ===
        // Court délai pour laisser le workflow n8n atteindre le nœud Wait
        // avant d'appeler resumeUrl (évite le 404 "no waiting webhook")
        await new Promise(resolve => setTimeout(resolve, 500));

        // Le Wait node de n8n bloque jusqu'à ce que le LLM ait terminé,
        // puis renvoie le résultat final directement.
        const RESUME_TIMEOUT_MS = 300000; // 5 minutes max
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RESUME_TIMEOUT_MS);
        const startTime = Date.now();

        try {
            if (perfMod) perfMod.markStart('llm', 'Attente réponse LLM (resumeUrl)');
            const resultResponse = await fetch(resumeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!resultResponse.ok) {
                const errorBody = await resultResponse.text();
                throw new Error(`Erreur lors de la récupération du résultat : ${resultResponse.status} ${resultResponse.statusText} - ${errorBody}`);
            }

            const resultData = await resultResponse.json();
            const llmDurationS = Math.round((Date.now() - startTime) / 1000);
            if (perfMod) perfMod.markEnd('llm', 'Attente réponse LLM (resumeUrl)', {
                durationSeconds: llmDurationS,
                contentLength: resultData.content ? resultData.content.length : 0
            });
            debugLog('LLM', `Résultat reçu après ${llmDurationS}s.`);

            if (resultData.status === 'error') {
                throw new Error(resultData.message || 'Erreur lors de la génération par l\'IA.');
            }

            return extractJsonContent(resultData.content);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('Délai dépassé : la génération a pris trop de temps (5 minutes). Veuillez réessayer avec un modèle plus rapide.');
            }
            throw fetchError;
        }

    } catch (error) {
        console.error("Erreur lors de l'appel au proxy n8n pour le LLM", error);
        throw error;
    }
}
