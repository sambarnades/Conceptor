import { formatTextToHtml, generateUUID } from '../utils.js';

export const machineName = 'H5P.Accordion';
export const version = { major: 1, minor: 0 };
export const extraDependencies = [
    { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
];

export default {
    process: (jsonObj) => {
        // Détecter si c'est le nouveau format simplifié (un tableau) ou l'ancien (un objet avec "panels")
        const panelsData = Array.isArray(jsonObj) ? jsonObj : (jsonObj && jsonObj.panels ? jsonObj.panels : null);

        if (!panelsData || !Array.isArray(panelsData)) {
            console.error('[Glossary] Format de données invalide:', jsonObj);
            throw new Error('Le format JSON pour le Glossary doit être soit un tableau, soit un objet avec une propriété "panels" contenant un tableau.');
        }

        const transformedPanels = panelsData.map(item => {
            // Si l'item a déjà la structure complète, on ne fait que générer l'UUID
            if (item.content && item.content.params) {
                // Important: on ne réécrit pas subContentId si déjà présent pour éviter de casser des liens? 
                // Dans le doute, le code d'origine le faisait donc on le fait.
                item.content.subContentId = generateUUID();
                return item;
            }
            // Sinon, on transforme la structure simple en structure complète
            return {
                title: item.title,
                content: {
                    params: {
                        text: formatTextToHtml(item.text)
                    },
                    library: "H5P.AdvancedText 1.1",
                    subContentId: generateUUID(),
                    metadata: {
                        contentType: "Text",
                        license: "U",
                        title: item.title // On utilise le titre du panneau comme titre de métadonnée
                    }
                }
            };
        });

        return {
            panels: transformedPanels,
            hTag: "h2"
        };
    }
};
