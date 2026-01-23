/**
 * @file Gestion de l'intégration avec l'IA LLM.
 * Ce module gère la configuration des modèles disponibles, l'interface du sélecteur de modèles,
 * et la communication avec l'API du LLM via un serveur proxy (n8n).
 */

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
 * Envoie un prompt à l'API du LLM via le proxy n8n et retourne le contenu généré.
 * @param {string} prompt - Le prompt à envoyer au modèle d'IA.
 * @param {string} model - L'ID du modèle d'IA à utiliser.
 * @returns {Promise<string>} Le contenu textuel généré par l'IA, nettoyé des blocs de code.
 * @throws {Error} Si la réponse du proxy n'est pas valide ou si une erreur réseau survient.
 */
export async function generateH5PWithLLM(prompt, model, activityMeta) {
    console.log(`Appel au proxy n8n pour l'API du LLM avec le modèle ${model} et le prompt :`, prompt);

    const proxyUrl = "https://n8n.incubateur.education.gouv.fr/webhook/llm";

    const requestBody = {
        prompt: prompt,
        model: model // Utiliser le modèle passé en paramètre
    };

    if (activityMeta) {
        requestBody.activity = activityMeta;
    }

    if (requestBody.activity) {
        console.log('LLM webhook payload activity:', requestBody.activity);
    }

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Erreur du proxy n8n : ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const rawResponse = await response.text();
        let content = null;

        try {
            // On essaie d'abord de parser la réponse comme du JSON
            const data = JSON.parse(rawResponse);

            if (typeof data === 'object' && data !== null) {
                if (data.choices && data.choices.length > 0) { // Cas 1: Le proxy renvoie la réponse brute du LLM
                    content = data.choices[0].message.content;
                } else if (data.content) { // Cas 2: Le proxy renvoie un objet { "content": "..." }
                    content = data.content;
                }
            }
        } catch (e) {
            // Si le parsing échoue, ce n'est pas grave. On suppose que la réponse est une chaîne de caractères brute.
        }

        // Si on n'a pas trouvé de contenu dans l'objet JSON, ou si ce n'était pas du JSON,
        // on utilise la réponse brute comme contenu.
        if (content === null) {
            content = rawResponse;
        }

        if (content && typeof content === 'string') {
            // On extrait le JSON s'il est dans un bloc de code
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                return jsonMatch[1].trim();
            }

            // Si pas de bloc de code, on cherche le début d'un objet ou tableau JSON
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
                return content.substring(startIndex).trim();
            }
            
            return content.trim(); // Fallback : on retourne le contenu, même si ce n'est pas du JSON
        } else {
            console.error("Réponse inattendue ou vide du proxy n8n:", rawResponse);
            throw new Error("La réponse du proxy n8n est vide ou dans un format inattendu.");
        }

    } catch (error) {
        console.error("Erreur lors de l'appel au proxy n8n pour le LLM", error);
        throw error;
    }
}
