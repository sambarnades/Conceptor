/**
 * @file Gestionnaire H5P pour la visualisation.
 * Ce module gère l'extraction et l'affichage des fichiers H5P en mémoire via JSZip et un intercepteur Fetch.
 */

// Import de loadJSZip et des chemins centralisés depuis lib-loader
import { loadJSZip, LIB_PATHS } from '../core/lib-loader.js';

import { debugLog } from '../core/utils.js';

/** Compteur de hits/miss sur le cache mémoire prefetch (pour les logs de performance) */
let _cacheHits = 0;
let _cacheMisses = 0;

/**
 * Référence vers le cache mémoire de h5p-prefetch.js.
 * Chargée de façon lazy au premier accès pour éviter une dépendance circulaire.
 * @type {Map<string, {blob: Blob, contentType: string}>|null}
 */
let _prefetchCache = null;

/**
 * Récupère le cache mémoire depuis h5p-prefetch.js (lazy, une seule fois).
 * @returns {Promise<Map>}
 */
async function getPrefetchCache() {
    if (_prefetchCache) return _prefetchCache;
    try {
        const mod = await import('./h5p-prefetch.js');
        _prefetchCache = mod.assetCache;
    } catch {
        _prefetchCache = new Map();
    }
    return _prefetchCache;
}

export class H5PManager {
    constructor() {
        this.currentZip = null;
        this.currentContent = null;
        this.containerId = null;

        // Compteur de génération pour annuler les chargements obsolètes lors de navigation rapide
        this._loadGeneration = 0;

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
        const h5pManager = this;
        window.fetch = async (input, init) => {
            let url = typeof input === 'string' ? input : input.url;

            // 1. Interception des fichiers locaux du ZIP (contenu H5P)
            if (url && url.includes('/__h5p_local__/')) {
                // Nettoyage de l'URL pour obtenir le chemin relatif dans le ZIP
                // Le format attendu est .../__h5p_local__/path/to/file
                const parts = url.split('/__h5p_local__/');
                // On prend la dernière partie pour gérer les cas où l'URL de base contiendrait aussi le pattern (peu probable mais bon)
                let path = parts[parts.length - 1];

                // Nettoyer les query params éventuels
                path = path.split('?')[0];

                if (h5pManager.currentZip) {
                    const file = h5pManager.currentZip.file(path);
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
                                const mimeType = h5pManager.getMimeType(path);
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

            // 2. Interception des bibliothèques h5p-libs : servir depuis le cache mémoire du prefetch
            if (url && url.includes(LIB_PATHS.H5P_LIBRARIES)) {
                const cache = await getPrefetchCache();
                // Extraire le chemin relatif pour correspondre aux clés du cache
                // L'URL peut être absolue (https://...) ou relative (js/vendor/h5p-libs/...)
                const libIdx = url.indexOf(LIB_PATHS.H5P_LIBRARIES);
                const cacheKey = url.substring(libIdx).split('?')[0];

                if (cache.has(cacheKey)) {
                    _cacheHits++;
                    const entry = cache.get(cacheKey);
                    debugLog('h5p-manager', `⚡ CACHE HIT [${_cacheHits}] ${cacheKey.split('/').pop()}`);
                    return new Response(entry.blob, {
                        status: 200,
                        headers: { 'Content-Type': entry.contentType }
                    });
                }
                _cacheMisses++;
                debugLog('h5p-manager', `🌐 CACHE MISS [${_cacheMisses}] ${cacheKey} → réseau`);
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
        // Incrémenter la génération pour invalider tout chargement précédent en cours
        const loadGen = ++this._loadGeneration;

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
            const _loadT0 = performance.now();
            if (!window.JSZip) {
                await loadJSZip();
                debugLog('h5p-manager', `JSZip chargé en ${(performance.now() - _loadT0).toFixed(0)}ms`);
            }
            // Vérifier si un nouveau chargement a été lancé entre-temps (navigation rapide)
            if (loadGen !== this._loadGeneration) return null;

            if (!window.JSZip) throw new Error("JSZip not available");

            // Chargement du ZIP selon le type d'entrée
            if (source instanceof window.JSZip) {
                this.currentZip = source;
            } else {
                this.currentZip = await window.JSZip.loadAsync(source);
            }
            if (loadGen !== this._loadGeneration) return null;

            // Vérification et extraction h5p.json
            if (!this.currentZip.file("h5p.json")) {
                throw new Error("Structure H5P invalide : h5p.json manquant");
            }
            const h5pJsonStr = await this.currentZip.file("h5p.json").async("string");
            if (loadGen !== this._loadGeneration) return null;
            const h5pJson = JSON.parse(h5pJsonStr);

            // Extraction content/content.json
            if (!this.currentZip.file("content/content.json")) {
                throw new Error("Structure H5P invalide : content/content.json manquant");
            }
            const contentStr = await this.currentZip.file("content/content.json").async("string");
            if (loadGen !== this._loadGeneration) return null;
            this.currentContent = JSON.parse(contentStr);

            // Configuration H5P Standalone - approche hybride
            // On injecte le JSON pour la fiabilité, et on fournit un path pour la résolution des assets internes au ZIP.
            // Le path /__h5p_local__ sera intercepté par notre fetch override.
            const options = {
                h5pJsonPath: '/__h5p_local__',
                h5pJson: h5pJson,
                contentJson: this.currentContent,
                frameJs: LIB_PATHS.H5P_FRAME_JS,
                frameCss: LIB_PATHS.H5P_FRAME_CSS,
                librariesPath: LIB_PATHS.H5P_LIBRARIES,
                title: h5pJson.title || '',
                frame: true,
                copyright: true,
                export: false,
                icon: false,
                fullScreen: true
            };

            // Re-tenter le préchargement des bibliothèques en échec (best-effort, non bloquant)
            import('./h5p-prefetch.js')
                .then(m => m.retryFailed())
                .catch(() => {});

            // Rendu
            // On s'assure que H5PStandalone est dispo
            let perfMod;
            try { perfMod = (await import('../core/perf-tracker.js')); } catch { perfMod = null; }

            if (perfMod) perfMod.markStart('render', 'ensureH5PLibLoaded');
            await this.ensureH5PLibLoaded();
            if (perfMod) perfMod.markEnd('render', 'ensureH5PLibLoaded');
            if (loadGen !== this._loadGeneration) return null;

            if (!window.H5PStandalone) {
                console.error("H5PStandalone global object not found. Available globals:", Object.keys(window).filter(k => k.toLowerCase().includes('h5p')));
                throw new Error("H5PStandalone library could not be loaded.");
            }

            // Réinitialiser les compteurs pour ce rendu
            _cacheHits = 0;
            _cacheMisses = 0;

            if (perfMod) perfMod.markStart('render', 'H5PStandalone.H5P()');
            if (perfMod) perfMod.event('render', `mainLibrary: ${h5pJson.mainLibrary}, deps: ${h5pJson.preloadedDependencies?.length || 0}`);
            const h5p = new window.H5PStandalone.H5P(container, options);
            await h5p.ready;
            if (perfMod) {
                perfMod.markEnd('render', 'H5PStandalone.H5P()', {
                    cacheHits: _cacheHits, cacheMisses: _cacheMisses
                });
                perfMod.endSession();
            }

            // Vérification finale après le rendu H5P
            if (loadGen !== this._loadGeneration) return null;

            return {
                zip: this.currentZip,
                content: this.currentContent,
                meta: await this.extractMetadata()
            };

        } catch (error) {
            // Ignorer silencieusement les erreurs des chargements annulés
            if (loadGen !== this._loadGeneration) return null;
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
            container.innerHTML = '';
        }

        // Nettoyer les instances H5P globales pour éviter les conflits d'IDs
        if (window.H5P && window.H5P.instances) {
            window.H5P.instances = [];
        }

        // Supprimer les scripts et styles H5P injectés dans le <head> par le player
        // (ils portent l'attribut data-h5p et s'accumulent à chaque rendu).
        // IMPORTANT : préserver le script principal H5PStandalone (h5p-standalone-main.js)
        // et les scripts du framework (frame.bundle.js) pour éviter de les recharger
        // à chaque rendu (coûte ~5s sur un hébergement lent).
        const playerScript = LIB_PATHS.H5P_STANDALONE;
        const frameSrc = LIB_PATHS.H5P_FRAME_JS;
        document.querySelectorAll('head [data-h5p]').forEach(el => {
            const src = el.getAttribute('src') || '';
            const href = el.getAttribute('href') || '';
            // Ne pas supprimer le player H5PStandalone ni le framework
            if (src.includes(playerScript) || src.includes(frameSrc)) return;
            if (href.includes(LIB_PATHS.H5P_FRAME_CSS)) return;
            el.remove();
        });

        // Nettoyer l'objet H5PIntegration pour éviter les collisions de contentId
        if (window.H5PIntegration) {
            window.H5PIntegration.contents = {};
        }
    }

    /**
     * S'assure que la bibliothèque H5PStandalone est chargée.
     * Utilise une promesse partagée pour éviter les appels concurrents.
     */
    ensureH5PLibLoaded() {
        // Vérification rapide : le global existe déjà
        if (window.H5PStandalone) {
            // Toujours sauvegarder la référence pour pouvoir la restaurer
            // si le global est effacé entre deux rendus (par H5P framework ou destroy)
            H5PManager._cachedRef = window.H5PStandalone;
            return Promise.resolve();
        }

        // Restaurer depuis le cache si le global a disparu
        if (H5PManager._cachedRef) {
            window.H5PStandalone = H5PManager._cachedRef;
            return Promise.resolve();
        }

        // Si un chargement est déjà en cours, retourner la même promesse
        if (H5PManager._loadingPromise) {
            return H5PManager._loadingPromise;
        }

        H5PManager._loadingPromise = new Promise((resolve, reject) => {
            const scriptSrc = LIB_PATHS.H5P_STANDALONE;
            let script = document.querySelector(`script[src="${scriptSrc}"]`);

            // Si le script existe déjà dans le DOM, attendre que le global apparaisse
            if (script) {
                let attempts = 0;
                const check = setInterval(() => {
                    attempts++;
                    if (window.H5PStandalone) {
                        clearInterval(check);
                        H5PManager._cachedRef = window.H5PStandalone;
                        H5PManager._loadingPromise = null;
                        resolve();
                    } else if (attempts > 50) {
                        clearInterval(check);
                        // Le script est présent mais ne s'exécute plus : le supprimer et réessayer
                        script.remove();
                        H5PManager._loadingPromise = null;
                        this.ensureH5PLibLoaded().then(resolve, reject);
                    }
                }, 100);
                return;
            }

            // Créer et insérer le script
            script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;

            script.onload = () => {
                setTimeout(() => {
                    if (window.H5PStandalone) {
                        H5PManager._cachedRef = window.H5PStandalone;
                    }
                    H5PManager._loadingPromise = null;
                    resolve();
                }, 50);
            };

            script.onerror = () => {
                console.error("Failed to load H5PStandalone script");
                H5PManager._loadingPromise = null;
                reject(new Error("Failed to load H5PStandalone"));
            };

            document.body.appendChild(script);
        });

        return H5PManager._loadingPromise;
    }
}

// Propriétés statiques pour le partage entre instances et appels concurrents
H5PManager._loadingPromise = null;
H5PManager._cachedRef = null;
