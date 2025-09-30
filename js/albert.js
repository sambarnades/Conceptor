// Fichier pour l'intégration de l'IA Albert pour la génération de contenu H5P

// La clé API ne doit pas être stockée ici. Elle doit être gérée de manière sécurisée par le serveur proxy (n8n).

async function generateH5PWithAlbert(prompt) {
    console.log("Appel au proxy n8n pour l'API Albert avec le prompt :", prompt);

    // Utilisation de l'URL de webhook n8n pour la production.
    const proxyUrl = "https://n8n.remande.fr/webhook/albert-proxy";

    const requestBody = {
        prompt: prompt
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