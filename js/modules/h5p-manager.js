/**
 * @file Gestionnaire H5P pour la visualisation.
 * Ce module gère l'extraction et l'affichage des fichiers H5P en mémoire via JSZip et un intercepteur Fetch.
 */

// On importe downloadZip si besoin de re-télécharger
import { downloadZip } from '../libs/client-zip/index.js';
// Import de loadJSZip pour charger JSZip sans charger les autres libs OCR lourdes
import { loadJSZip } from './lib-loader.js';

const CONFIG = {
    H5P: {
        // Chemin vers le dossier contenant les bibliothèques H5P (h5p-libs)
        // Adapté à la structure de Caramel : js/libs/h5p-libs
        LIBRARIES_PATH: 'js/libs/h5p-libs',
        FRAME_JS: 'js/libs/h5p-standalone/frame.bundle.js',
        FRAME_CSS: 'js/libs/h5p-standalone/styles/h5p.css'
    }
};

export class H5PManager {
    constructor() {
        this.currentZip = null;
        this.currentContent = null;
        this.containerId = null;

        // Intercepteur Fetch pour lire les fichiers locaux depuis le ZIP
        this.initFetchInterceptor();
    }

    /**
     * Initialise l'intercepteur de requêtes fetch pour servir les fichiers depuis le ZIP en mémoire
     * au lieu de faire des requêtes HTTP réelles pour les assets du H5P.
     */
    initFetchInterceptor() {
        // Éviter d'empiler les intercepteurs si la classe est instanciée plusieurs fois ou rechargée
        if (window._h5pFetchInterceptorActive) return;

        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            let url = typeof input === 'string' ? input : input.url;

            // On intercepte uniquement les URL contenant le marqueur spécial
            if (url && url.includes('/__h5p_local__/')) {
                // Nettoyage de l'URL pour obtenir le chemin relatif dans le ZIP
                // Le format attendu est .../__h5p_local__/path/to/file
                const parts = url.split('/__h5p_local__/');
                // On prend la dernière partie pour gérer les cas où l'URL de base contiendrait aussi le pattern (peu probable mais bon)
                let path = parts[parts.length - 1];

                // Nettoyer les query params éventuels
                path = path.split('?')[0];

                if (this.currentZip) {
                    const file = this.currentZip.file(path);
                    if (file) {
                        try {
                            if (path.endsWith('.json')) {
                                const text = await file.async('string');
                                return new Response(text, {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } else {
                                const blob = await file.async('blob');
                                const mimeType = this.getMimeType(path);
                                return new Response(blob, {
                                    status: 200,
                                    headers: { 'Content-Type': mimeType }
                                });
                            }
                        } catch (e) {
                            console.error(`Error reading ${path} from zip:`, e);
                            return new Response('Error reading file from ZIP', { status: 500 });
                        }
                    } else {
                        console.warn(`File not found in local ZIP: ${path}`);
                    }
                }
                return new Response('File not found in local ZIP', { status: 404 });
            }

            return originalFetch(input, init);
        };

        window._h5pFetchInterceptorActive = true;
    }

    getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'mp4': 'video/mp4',
            'mp3': 'audio/mpeg',
            'svg': 'image/svg+xml',
            'json': 'application/json',
            'css': 'text/css',
            'js': 'application/javascript',
            'html': 'text/html'
        };
        return map[ext] || 'application/octet-stream';
    }

    /**
     * Charge et affiche un fichier H5P
     * @param {File|Blob|JSZip} source - Le fichier .h5p ou l'objet JSZip
     * @param {HTMLElement|string} targetContainer - L'élément DOM ou son ID
     * @returns {Promise<Object>} Données chargées
     */
    async load(source, targetContainer) {
        // Résolution du conteneur
        let container;
        if (typeof targetContainer === 'string') {
            this.containerId = targetContainer;
            container = document.getElementById(this.containerId);
        } else {
            container = targetContainer;
            this.containerId = container.id || 'h5p-dynamic-container';
        }

        if (!container) throw new Error(`Container not found`);

        this.destroy(container); // Nettoyer l'existant sur ce conteneur

        try {
            // Chargement de JSZip si pas encore là (utilise loadJSZip pour éviter de charger les libs OCR lourdes)
            if (!window.JSZip) {
                await loadJSZip();
            }
            if (!window.JSZip) throw new Error("JSZip not available");

            // Chargement du ZIP selon le type d'entrée
            if (source instanceof window.JSZip) {
                this.currentZip = source;
            } else {
                this.currentZip = await window.JSZip.loadAsync(source);
            }

            // Vérification et extraction h5p.json
            if (!this.currentZip.file("h5p.json")) {
                throw new Error("Structure H5P invalide : h5p.json manquant");
            }
            const h5pJsonStr = await this.currentZip.file("h5p.json").async("string");
            const h5pJson = JSON.parse(h5pJsonStr);

            // Extraction content/content.json
            if (!this.currentZip.file("content/content.json")) {
                // Certains H5P ont content.json à la racine ? Non, spec standard.
                // Mais vérifions.
                throw new Error("Structure H5P invalide : content/content.json manquant");
            }
            const contentStr = await this.currentZip.file("content/content.json").async("string");
            this.currentContent = JSON.parse(contentStr);

            // Configuration H5P Standalone - approche hybride
            // On injecte le JSON pour la fiabilité, et on fournit un path pour la résolution des assets internes au ZIP.
            // Le path /__h5p_local__ sera intercepté par notre fetch override.
            const options = {
                h5pJsonPath: '/__h5p_local__',
                h5pJson: h5pJson,
                contentJson: this.currentContent,
                frameJs: CONFIG.H5P.FRAME_JS,
                frameCss: CONFIG.H5P.FRAME_CSS,
                librariesPath: CONFIG.H5P.LIBRARIES_PATH,
                frame: true,
                copyright: true,
                export: false,
                icon: false,
                fullScreen: true
            };

            // Rendu
            // On s'assure que H5PStandalone est dispo
            await this.ensureH5PLibLoaded();

            if (!window.H5PStandalone) {
                console.error("H5PStandalone global object not found. Available globals:", Object.keys(window).filter(k => k.toLowerCase().includes('h5p')));
                throw new Error("H5PStandalone library could not be loaded.");
            }

            const h5p = new window.H5PStandalone.H5P(container, options);
            await h5p.ready;

            return {
                zip: this.currentZip,
                content: this.currentContent,
                meta: await this.extractMetadata()
            };

        } catch (error) {
            console.error("H5P Load Error:", error);
            container.innerHTML = `<div class="error-msg" style="color:red; pading:10px;">Erreur de chargement H5P: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Extrait les métadonnées (titre, auteur...) du h5p.json
     */
    async extractMetadata() {
        let meta = { title: 'Sans titre', author: '', mainLibrary: '', preloadedDependencies: [] };
        if (this.currentZip && this.currentZip.file("h5p.json")) {
            try {
                const h5pJson = JSON.parse(await this.currentZip.file("h5p.json").async("string"));
                if (h5pJson.title) meta.title = h5pJson.title;
                if (h5pJson.authors && h5pJson.authors.length > 0) meta.author = h5pJson.authors[0].name;
                if (h5pJson.mainLibrary) meta.mainLibrary = h5pJson.mainLibrary;
                if (h5pJson.preloadedDependencies) meta.preloadedDependencies = h5pJson.preloadedDependencies;
            } catch (e) { console.warn("Erreur lecture métadonnées", e); }
        }
        return meta;
    }

    /**
     * Reconstruit un fichier .h5p téléchargeable
     */
    async download(title = "activite") {
        if (!this.currentZip) return;
        const blob = await this.currentZip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.h5p`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Nettoie le conteneur et réinitialise l'état
     */
    destroy(containerElement) {
        // Résolution du conteneur si ID passé ou stocké
        let container = containerElement;
        if (!container && this.containerId) {
            container = document.getElementById(this.containerId);
        }

        if (container) {
            // Utiliser la méthode non-officielle ou juste vider le HTML
            // H5PStandalone ne semble pas avoir de méthode 'destroy' propre documentée publiquement
            // mais on peut vider le DOM.
            container.innerHTML = '';
        }

        // Nettoyer l'intégration globale H5P si nécessaire, pour éviter les conflits d'IDs
        // Attention : cela peut affecter d'autres H5P sur la page, mais ici nous sommes dans une modale unique.
        if (window.H5P && window.H5P.instances) {
            window.H5P.instances = [];
        }
    }

    /**
     * S'assure que la bibliothèque H5PStandalone est chargée
     */
    ensureH5PLibLoaded() {
        return new Promise((resolve) => {
            if (window.H5PStandalone) {
                resolve();
                return;
            }

            const scriptSrc = 'js/libs/h5p-standalone/main.bundle.js';
            let script = document.querySelector(`script[src="${scriptSrc}"]`);

            // Si le script existe mais que l'objet global est absent, on force le rechargement
            // en supprimant l'ancienne balise script pour forcer la ré-exécution
            if (script) {
                console.warn("H5PStandalone script tag found but global object missing. Forcing reload.");
                script.remove();
            }

            // Création propre d'un nouveau script
            script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;

            // Gestionnaire de chargement
            script.onload = () => {
                // Petit délai de sécurité pour l'initialisation interne
                setTimeout(() => resolve(), 50);
            };

            script.onerror = () => {
                console.error("Failed to load H5PStandalone script");
                resolve(); // On laisse le timeout gérer ou l'erreur suivante
            };

            document.body.appendChild(script);

            // Timeout de sécurité si onload ne déclenche pas
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.H5PStandalone) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts > 50) { // 5 secondes max
                    clearInterval(checkInterval);
                    console.error("Timeout waiting for H5PStandalone");
                    resolve();
                }
            }, 100);
        });
    }
}
