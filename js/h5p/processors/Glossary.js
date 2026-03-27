/**
 * Processeur H5P — Glossaire (Accordéon)
 *
 * Accepte deux formats (tableau ou objet.panels), transforme chaque
 * panneau en structure Accordion complète avec H5P.AdvancedText,
 * UUID et métadonnées.
 *
 * @module processors/Glossary
 * @exports {Object} default.process - Transformation principale
 */
import { formatTextToHtml, generateUUID } from '../../core/utils.js';

export default {
    process: (jsonObj) => {
        // Détecter si c'est le nouveau format simplifié (un tableau) ou l'ancien (un objet avec "panels")
        const panelsData = Array.isArray(jsonObj) ? jsonObj : (jsonObj && jsonObj.panels ? jsonObj.panels : null);

        if (!panelsData || !Array.isArray(panelsData)) {
            console.error('[Glossary] Format de données invalide:', jsonObj);
            throw new Error('Le format JSON pour le Glossary doit être soit un tableau, soit un objet avec une propriété "panels" contenant un tableau.');
        }

        const transformedPanels = panelsData.map((item, i) => {
            if (!item || typeof item !== 'object') {
                console.warn(`[Glossary] Élément ${i} invalide (null ou non-objet), ignoré.`);
                return { title: "", content: { params: { text: "" }, library: "H5P.AdvancedText 1.1", subContentId: generateUUID(), metadata: { contentType: "Text", license: "U", title: "" } } };
            }
            // Si l'item a déjà la structure complète, on ne fait que générer l'UUID
            if (item.content && item.content.params) {
                // Important: on ne réécrit pas subContentId si déjà présent pour éviter de casser des liens? 
                // Dans le doute, le code d'origine le faisait donc on le fait.
                item.content.subContentId = generateUUID();
                return item;
            }
            // Sinon, on transforme la structure simple en structure complète
            return {
                title: item.title || "",
                content: {
                    params: {
                        text: formatTextToHtml(item.text || "")
                    },
                    library: "H5P.AdvancedText 1.1",
                    subContentId: generateUUID(),
                    metadata: {
                        contentType: "Text",
                        license: "U",
                        title: item.title || "" // On utilise le titre du panneau comme titre de métadonnée
                    }
                }
            };
        });

        // hTag peut venir de l'éditeur (attaché au tableau par denormalize)
        const hTag = (jsonObj && !Array.isArray(jsonObj) ? jsonObj.hTag : null)
            || (Array.isArray(jsonObj) ? jsonObj.hTag : null)
            || "h2";

        return {
            panels: transformedPanels,
            hTag
        };
    }
};
