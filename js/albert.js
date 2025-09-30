// Fichier pour l'intégration de l'IA Albert pour la génération de contenu H5P

// La clé API ne doit pas être stockée ici. Elle doit être gérée de manière sécurisée par le serveur proxy (n8n).

// =======================================================================
// LISTE DES MODÈLES ALBERT DISPONIBLES
// Modifiez cette liste pour ajouter, supprimer ou changer les modèles.
// =======================================================================
const AVAILABLE_MODELS = [
    { id: 'albert-small', type: 'text-generation', owned_by: 'OpenGateLLM' },
    { id: 'albert-large', type: 'image-text-to-text', owned_by: 'Albert API (prod)' },
    { id: 'albert-code', type: 'text-generation', owned_by: 'OpenGateLLM' },
    { id: 'embeddings-small', type: 'text-embeddings-inference', owned_by: 'OpenGateLLM' },
    { id: 'rerank-small', type: 'text-classification', owned_by: 'OpenGateLLM' }
];
// =======================================================================

// Fonction pour peupler un sélecteur de modèles spécifique
function populateModelSelector(moduleKey, models, onSelectCallback, selectedModel) {
    const dropdown = document.getElementById(`model-selector-dropdown-${moduleKey}`);
    if (!dropdown) return;
    dropdown.innerHTML = ''; // Vider la liste

    const textModels = models.filter(model => model.type === 'text-generation' || model.type === 'image-text-to-text');

    textModels.forEach(model => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'menuitem');
        listItem.dataset.modelId = model.id;
        listItem.innerHTML = `<strong>${model.id}</strong><br><small>(${model.owned_by})</small>`;
        if (model.id === selectedModel) {
            listItem.classList.add('selected');
        }
        listItem.addEventListener('click', () => {
            onSelectCallback(model.id); // Appeler le callback avec le modèle sélectionné
            
            // Mettre à jour la classe 'selected'
            const allItems = dropdown.querySelectorAll('li');
            allItems.forEach(item => item.classList.remove('selected'));
            listItem.classList.add('selected');

            dropdown.style.display = 'none';
            document.getElementById(`model-selector-btn-${moduleKey}`).setAttribute('aria-expanded', 'false');
        });
        dropdown.appendChild(listItem);
    });
}

async function generateH5PWithAlbert(prompt, model) {
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
            return content.trim(); // On retourne le contenu, même si ce n'est pas du JSON
        } else {
            console.error("Réponse inattendue ou vide du proxy n8n:", rawResponse);
            throw new Error("La réponse du proxy n8n est vide ou dans un format inattendu.");
        }

    } catch (error) {
        console.error("Erreur lors de l'appel au proxy n8n Albert:", error);
        throw error;
    }
}

// La gestion de l'interface est maintenant déplacée dans script.js
// pour être attachée dynamiquement lorsque le contenu est créé.