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

        // URLs blob: créées par URL.createObjectURL pour les médias embarqués de la preview
        // (cf. _embedImagesAsDataUrls). Suivies ici pour être révoquées à chaque load()/destroy()
        // — sinon chaque cycle édition → re-preview épingle une nouvelle copie des blobs en mémoire.
        this._mediaObjectUrls = [];

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
                            if (path === 'content/content.json') {
                                // Injecter les images du ZIP comme data URLs dans content.json
                                // pour que H5P.getPath les reconnaisse comme absolues
                                const text = await file.async('string');
                                const json = JSON.parse(text);
                                await h5pManager._embedImagesAsDataUrls(json);
                                return new Response(JSON.stringify(json), {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } else if (path.endsWith('.json')) {
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

        // Révoquer les URLs blob: du rendu précédent AVANT d'en recréer (anti-fuite mémoire).
        // destroy() le fait aussi, mais on l'appelle explicitement ici par sécurité
        // (destroy() peut être invoqué avec un conteneur différent par du code externe).
        this._revokeMediaObjectUrls();
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
            // Vidéo interactive : on réservera une boîte 16/9 pendant le chargement (cf. plus bas).
            const isInteractiveVideo = h5pJson.mainLibrary === 'H5P.InteractiveVideo';

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

            // Audit S11 : H5P.MathDisplay (embarqué dans les activités math) charge
            // par défaut MathJax 2.7.5 depuis cdnjs.cloudflare.com. h5p-standalone
            // fusionne un window.H5PIntegration préexistant dans son intégration :
            // on pointe ici le renderer vers la copie locale MathJax 2.7.9
            // (js/vendor/mathjax-2/) — PREVIEW UNIQUEMENT, le .h5p exporté garde le
            // défaut de la lib côté Moodle/Éléa.
            window.H5PIntegration = window.H5PIntegration || {};
            window.H5PIntegration.libraryConfig = {
                ...(window.H5PIntegration.libraryConfig || {}),
                'H5P.MathDisplay': {
                    renderer: {
                        mathjax: {
                            src: new URL('js/vendor/mathjax-2/2.7.9/MathJax.js', document.baseURI).href,
                            config: {
                                extensions: ['tex2jax.js'],
                                showMathMenu: false,
                                jax: ['input/TeX', 'output/HTML-CSS'],
                                tex2jax: { ignoreClass: 'ckeditor' },
                                messageStyle: 'none',
                                // Forcer les polices TeX vendorées (pas de détection
                                // STIX locale → pas de fichiers de fontes manquants)
                                'HTML-CSS': { availableFonts: ['TeX'], webFont: 'TeX' }
                            }
                        }
                    }
                }
            };

            if (perfMod) perfMod.markStart('render', 'H5PStandalone.H5P()');
            if (perfMod) perfMod.event('render', `mainLibrary: ${h5pJson.mainLibrary}, deps: ${h5pJson.preloadedDependencies?.length || 0}`);
            // Vidéo interactive : réserver une boîte 16/9 AVANT le montage, pour que la vidéo
            // apparaisse à la bonne hauteur dès l'affichage (et non « trop courte » jusqu'au resize).
            if (isInteractiveVideo) container.classList.add('h5p-preview--iv-loading');
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

            // Forcer un resize différé pour les sous-contenus qui s'initialisent
            // après le chargement asynchrone de leurs dépendances (ex: DragQuestion
            // dépend de jQuery.ui qui peut ne pas être prêt au moment de l'init).
            this._scheduleResize(container);

            // Vidéo interactive : relâcher la réserve 16/9 dès que h5p pose la vraie hauteur.
            if (isInteractiveVideo) this._releaseIVReserveWhenSized(container);

            // Rendre les formules LaTeX via MathJax dans la preview
            // (H5P.MathDisplay charge MathJax dans le vrai player Éléa/Moodle,
            // mais h5p-standalone ne l'active pas — on le fait ici manuellement)
            this._renderMathInPreview(container);

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
     * Révoque toutes les URLs blob: créées pour les médias embarqués de la preview
     * et vide la liste de suivi. Idempotent (appel multiple sans effet de bord).
     */
    _revokeMediaObjectUrls() {
        for (const url of this._mediaObjectUrls) {
            try { URL.revokeObjectURL(url); } catch { /* URL déjà révoquée ou invalide */ }
        }
        this._mediaObjectUrls = [];
    }

    /**
     * Nettoie le conteneur et réinitialise l'état
     */
    destroy(containerElement) {
        // Révoquer les URLs blob: des médias embarqués (anti-fuite mémoire)
        this._revokeMediaObjectUrls();

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
     * Planifie des événements resize différés pour forcer la ré-initialisation
     * des sous-contenus H5P dans un CoursePresentation.
     *
     * Problème : CP met preventResize=true sur les sous-instances (DragQuestion, etc.)
     * et ne propage jamais le resize vers elles. Leur seul resize est un
     * setTimeout(200) interne. Si les dimensions du conteneur ne sont pas stables
     * à ce moment (ex: sidebar keywordList en cours de rendu), les drop zones
     * ne se positionnent pas.
     *
     * Solution : accéder aux elementInstances dans l'iframe, désactiver
     * preventResize et déclencher le resize directement sur chaque sous-instance.
     *
     * @param {HTMLElement} container - Le conteneur H5P
     */
    _scheduleResize(container) {
        const fixSubInstances = () => {
            const iframe = container.querySelector('iframe');
            if (!iframe || !iframe.contentWindow) return;

            try {
                const iframeH5P = iframe.contentWindow.H5P;
                if (!iframeH5P || !iframeH5P.instances) return;

                // L'instance principale (CoursePresentation)
                const cpInstance = iframeH5P.instances[0];
                if (!cpInstance || !cpInstance.elementInstances) return;

                // Parcourir tous les slides et leurs instances
                for (const slideInstances of cpInstance.elementInstances) {
                    if (!slideInstances) continue;
                    for (const inst of slideInstances) {
                        if (!inst) continue;
                        // Désactiver preventResize pour permettre les futurs resize
                        if (inst.preventResize === true) {
                            inst.preventResize = false;
                        }
                        // Déclencher le resize si l'instance est attachée au DOM
                        if (inst.trigger && inst.$) {
                            iframeH5P.trigger(inst, 'resize');
                        }
                    }
                }

                // Resize global sur l'iframe
                iframe.contentWindow.dispatchEvent(new Event('resize'));
            } catch {
                // Cross-origin ou iframe pas prête — on réessaie au prochain tick
            }
        };

        // Plusieurs tentatives avec délais croissants :
        // 500ms → scripts simples déjà chargés
        // 2s → scripts réseau + rendu sidebar
        // 5s → connexions lentes
        setTimeout(fixSubInstances, 500);
        setTimeout(fixSubInstances, 2000);
        setTimeout(fixSubInstances, 5000);
    }

    /**
     * Relâche la réserve 16/9 d'une Vidéo interactive (classe `h5p-preview--iv-loading`) une fois que
     * h5p-standalone a posé une hauteur de lecteur STABLE. À chaque `resize`, le frame bundle fait
     * `iframe.style.height = "1px"` puis `= scrollHeight + "px"` ; le player IV pose souvent une ou
     * plusieurs hauteurs INTERMÉDIAIRES (le temps que la vidéo charge ses métadonnées) avant la
     * hauteur finale. Relâcher au 1ᵉʳ changement faisait « sauter » la boîte (bandeau court + blanc
     * dessous, cf. capture auteur). On attend donc la STABILISATION : plus aucun changement de hauteur
     * pendant ~900 ms → on relâche (à ce moment la réserve 16/9 et la hauteur réelle coïncident pour
     * une vidéo 16/9 ⇒ transition invisible). Tant que ça bouge, le 16/9 reste affiché proprement.
     * Garde-fou : relâchement au plus tard à 8 s, pour ne jamais figer une mauvaise hauteur.
     * @param {HTMLElement} container - Le conteneur H5P
     */
    _releaseIVReserveWhenSized(container) {
        const release = () => container.classList.remove('h5p-preview--iv-loading');
        const iframe = container.querySelector('iframe');
        // Une hauteur inline en px (> 1) signe que le resizer h5p a tourné.
        const isSized = (el) => {
            const h = el && el.style && el.style.height;
            return !!h && h.endsWith('px') && parseFloat(h) > 1;
        };
        if (!iframe) { setTimeout(release, 1500); return; }

        let released = false;
        let settleTimer = null;
        const finish = () => {
            if (released) return;
            released = true;
            try { obs.disconnect(); } catch { /* déjà déconnecté */ }
            clearTimeout(settleTimer);
            clearTimeout(guard);
            release();
        };
        // Débounce : (re)programme le relâchement 900 ms après le DERNIER changement de hauteur.
        const scheduleSettle = () => {
            if (!isSized(iframe)) return;
            clearTimeout(settleTimer);
            settleTimer = setTimeout(finish, 900);
        };
        const obs = new MutationObserver(scheduleSettle);
        try {
            obs.observe(iframe, { attributes: true, attributeFilter: ['style'] });
        } catch {
            // MutationObserver indisponible (très ancien navigateur) → repli temporisé.
            setTimeout(release, 2500);
            return;
        }
        scheduleSettle(); // au cas où la hauteur serait déjà posée
        // Filet : relâcher quoi qu'il arrive (resize en boucle, iframe cross-origin…).
        const guard = setTimeout(finish, 8000);
    }

    /**
     * Rend les formules LaTeX dans la preview H5P via MathJax.
     * H5P.MathDisplay gère cela dans le vrai player Éléa/Moodle,
     * mais h5p-standalone ne l'active pas.
     * On injecte MathJax directement dans l'iframe avec un chemin absolu.
     */
    _renderMathInPreview(container) {
        let injected = false;

        const tryRender = () => {
            try {
                if (injected) return;

                const iframe = container.querySelector('iframe');
                if (!iframe) return;

                const iframeWin = iframe.contentWindow;
                const iframeDoc = iframe.contentDocument || iframeWin?.document;
                if (!iframeDoc || !iframeDoc.body) return;

                // Vérifier si le contenu contient des formules LaTeX
                const html = iframeDoc.body.innerHTML;
                if (!html.includes('\\(') && !html.includes('\\[') && !html.includes('$$')) return;

                // Si MathJax est déjà dans l'iframe, juste re-typeset
                if (iframeWin.MathJax && iframeWin.MathJax.typesetPromise) {
                    iframeWin.MathJax.typesetPromise([iframeDoc.body]);
                    return;
                }

                injected = true;

                // Configurer MathJax dans l'iframe AVANT le chargement du script
                const configScript = iframeDoc.createElement('script');
                configScript.type = 'text/javascript';
                configScript.textContent = [
                    'window.MathJax = {',
                    '  tex: {',
                    '    inlineMath: [["\\\\(","\\\\)"],["$","$"]],',
                    '    displayMath: [["\\\\[","\\\\]"],["$$","$$"]],',
                    '    processEscapes: true,',
                    '    processEnvironments: true',
                    '  },',
                    '  svg: { fontCache: "global" },',
                    '  startup: {',
                    '    ready: function() {',
                    '      MathJax.startup.defaultReady();',
                    '      MathJax.startup.promise.then(function() {',
                    '        window.dispatchEvent(new Event("resize"));',
                    '      });',
                    '    }',
                    '  }',
                    '};'
                ].join('\n');
                iframeDoc.head.appendChild(configScript);

                // Charger le script MathJax avec une URL absolue résolue depuis la base
                // du document (fonctionne aussi quand l'app est servie sous un sous-chemin,
                // ex. GitLab Pages projet)
                const mathScript = iframeDoc.createElement('script');
                mathScript.type = 'text/javascript';
                mathScript.src = new URL(LIB_PATHS.MATHJAX, document.baseURI).href;
                mathScript.async = true;
                iframeDoc.head.appendChild(mathScript);

                debugLog('H5P', 'MathJax injecté dans la preview iframe: ' + mathScript.src);
            } catch (e) {
                debugLog('H5P', 'MathJax preview: ' + e.message);
            }
        };

        // Plusieurs tentatives — le contenu H5P charge de façon asynchrone
        setTimeout(tryRender, 1000);
        setTimeout(tryRender, 3000);
        setTimeout(tryRender, 6000);
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

    /**
     * Parcourt récursivement un objet JSON et remplace les chemins d'images
     * (propriété `path` commençant par `images/`) par des data URLs extraites du ZIP.
     *
     * Grâce au patch de frame.bundle.js, H5P.getPath reconnaît les data: URLs
     * comme absolues et les retourne telles quelles → les <img> chargent directement.
     *
     * @param {Object} obj - Objet JSON (content.json parsé) à modifier en place
     */
    async _embedImagesAsDataUrls(obj) {
        if (!obj || typeof obj !== 'object' || !this.currentZip) return;

        const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
        const imageRe = /^images\/.+\.(jpe?g|png|gif|webp|svg)$/i;
        // Médias audio/vidéo embarqués (H5P.ImageHotspots) : servis en URL blob: (plus léger que le
        // base64 pour les gros fichiers). Le patch de H5P.getPath reconnaît `blob:` comme URL absolue.
        const mediaRe = /^(audios?|videos?)\/.+\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|webm|mp4|ogv|mov|m4v)$/i;

        // Collecter toutes les promesses pour traitement parallèle
        const promises = [];

        // Image → data URL base64 (reconnu par le patch getPath).
        const embedImage = (relPath, setter) => {
            const zipPath = 'content/' + relPath;
            const file = this.currentZip.file(zipPath);
            if (!file) return;
            promises.push(file.async('base64').then(base64 => {
                const ext = relPath.split('.').pop().toLowerCase();
                const mime = mimeTypes[ext] || 'image/jpeg';
                setter(`data:${mime};base64,${base64}`);
                debugLog('h5p-manager', `Image embarquée: ${zipPath}`);
            }).catch(e => console.warn(`[h5p-manager] Erreur lecture image ${zipPath}:`, e)));
        };
        // Audio/vidéo → URL blob: (évite des chaînes base64 énormes pour les vidéos).
        const embedMedia = (relPath, setter) => {
            const zipPath = 'content/' + relPath;
            const file = this.currentZip.file(zipPath);
            if (!file) return;
            promises.push(file.async('blob').then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                // Suivre l'URL pour la révoquer au prochain load()/destroy() (anti-fuite mémoire)
                this._mediaObjectUrls.push(objectUrl);
                setter(objectUrl);
                debugLog('h5p-manager', `Média embarqué: ${zipPath}`);
            }).catch(e => console.warn(`[h5p-manager] Erreur lecture média ${zipPath}:`, e)));
        };

        const walk = (node) => {
            if (!node || typeof node !== 'object') return;

            // Champ `path` (H5P.Image.file, H5P.Audio.files[], H5P.Video.sources[], etc.)
            if (typeof node.path === 'string') {
                if (imageRe.test(node.path)) embedImage(node.path, v => { node.path = v; });
                else if (mediaRe.test(node.path)) embedMedia(node.path, v => { node.path = v; });
            }

            // Valeurs string qui pointent vers un asset local (ex: Timeline asset.media) — hors `path` (déjà traité)
            for (const key of Object.keys(node)) {
                if (key === 'path') continue;
                const val = node[key];
                if (typeof val !== 'string') continue;
                if (imageRe.test(val)) embedImage(val, v => { node[key] = v; });
                else if (mediaRe.test(val)) embedMedia(val, v => { node[key] = v; });
            }

            // Parcourir récursivement
            for (const key of Object.keys(node)) {
                const val = node[key];
                if (Array.isArray(val)) {
                    val.forEach(item => walk(item));
                } else if (val && typeof val === 'object') {
                    walk(val);
                }
            }
        };

        walk(obj);
        await Promise.all(promises);
    }
}

// Propriétés statiques pour le partage entre instances et appels concurrents
H5PManager._loadingPromise = null;
H5PManager._cachedRef = null;
