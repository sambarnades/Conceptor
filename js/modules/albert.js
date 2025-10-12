/**
 * @file Gestion de l'intégration avec l'IA Albert.
 * Ce module gère la configuration des modèles disponibles, l'interface du sélecteur de modèles,
 * et la communication avec l'API d'Albert via un serveur proxy (n8n).
 */

// La clé API n'est pas stockée ici pour des raisons de sécurité.
// Elle est gérée côté serveur par le proxy n8n.

/**
 * @constant {Array<Object>} AVAILABLE_MODELS
 * Liste des modèles d'IA disponibles via l'API Albert.
 */
export const AVAILABLE_MODELS = [
    { id: 'albert-small', type: 'text-generation', owned_by: 'OpenGateLLM' },
    { id: 'albert-large', type: 'image-text-to-text', owned_by: 'Albert API (prod)' },
    { id: 'albert-code', type: 'text-generation', owned_by: 'OpenGateLLM' },
    { id: 'embeddings-small', type: 'text-embeddings-inference', owned_by: 'OpenGateLLM' },
    { id: 'rerank-small', type: 'text-classification', owned_by: 'OpenGateLLM' }
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

    textModels.forEach(model => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'menuitem');
        listItem.dataset.modelId = model.id;

        const summaryKey = `${model.id.replace('-', '_')}_summary`;
        const technicalKey = `${model.id.replace('-', '_')}_technical`;

        const summary = translations[summaryKey] || '';
        const technical = translations[technicalKey] || '';
        const parametersKey = `albert_model_parameters_${model.id.split('-')[1]}`;
        const parameters = translations[parametersKey] || '';

        listItem.innerHTML = `
            <strong>${model.id}</strong><br>
            <small>${summary}</small>
            <div class="model-pills-container">
                <div class="model-pills">
                    <span class="pill-label">${translations.albert_model_parameters}</span>
                    <span class="pill-value">${parameters}</span>
                </div>
                <div class="model-pills">
                    <span class="pill-label">${translations.albert_model_source}</span>
                    <span class="pill-value">${technical}</span>
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
 * Envoie un prompt à l'API Albert via le proxy n8n et retourne le contenu généré.
 * @param {string} prompt - Le prompt à envoyer au modèle d'IA.
 * @param {string} model - L'ID du modèle d'IA à utiliser (ex: 'albert-large').
 * @returns {Promise<string>} Le contenu textuel généré par l'IA, nettoyé des blocs de code.
 * @throws {Error} Si la réponse du proxy n'est pas valide ou si une erreur réseau survient.
 */
export async function generateH5PWithAlbert(prompt, model) {
    console.log(`Appel au proxy n8n pour l'API Albert avec le modèle ${model} et le prompt :`, prompt);

    const proxyUrl = "https://n8n.remande.fr/webhook/albert-proxy";

    const requestBody = {
        prompt: prompt,
        model: model // Utiliser le modèle passé en paramètre
    };

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
                if (data.choices && data.choices.length > 0) { // Cas 1: Le proxy renvoie la réponse brute d'Albert
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
            const jsonMatch = content.match(/```json\s*([\s-S]*?)\s*```/);
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
        console.error("Erreur lors de l'appel au proxy n8n Albert:", error);
        throw error;
    }
}
