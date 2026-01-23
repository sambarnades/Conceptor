/**
 * @file Module de chargement dynamique des bibliothèques.
 * Charge les bibliothèques JavaScript uniquement quand elles sont nécessaires,
 * avec préchargement intelligent pendant les temps morts de l'utilisateur.
 */

// ============================================================================
// CONFIGURATION DES CHEMINS DES BIBLIOTHÈQUES
// Modifier ici si vous déplacez ou renommez une bibliothèque
// ============================================================================

const LIB_PATHS = {
    // OCR / Extraction de texte
    PDF_JS: 'js/libs/pdf-js/pdf.min.js',
    PDF_JS_WORKER: 'js/libs/pdf-js/pdf.worker.min.js',
    TESSERACT: 'js/libs/tesseract/tesseract.min.js',
    MAMMOTH: 'js/libs/mammoths/mammoth.browser.min.js',
    JSZIP: 'js/libs/jszip/jszip.min.js',

    // H5P
    CLIENT_ZIP: 'js/libs/client-zip/worker.js',
    H5P_STANDALONE: 'js/libs/h5p-standalone/main.bundle.js',

    // Moodle
    FFLATE: 'js/libs/fflate/index.js',
    TAR_JS: 'js/libs/tar-js/tar.bundle.js',

    // Math rendering
    MATHJAX: 'js/libs/mathjax/tex-svg.js',

    // Document export
    JSPDF: 'js/libs/jspdf/jspdf.umd.min.js',
    JSPDF_AUTOTABLE: 'js/libs/jspdf-autotable/jspdf.plugin.autotable.min.js',
    DOCX: 'js/libs/docx/index.umd.js'
};

// ============================================================================
// ÉTAT ET GESTION DU CHARGEMENT
// ============================================================================

// État de chargement des bibliothèques
const loadState = {
    pdfjs: false,
    tesseract: false,
    mammoth: false,
    jszip: false,
    clientZip: false,
    h5pStandalone: false,
    fflate: false,
    tarjs: false,
    mathjax: false,
    jspdf: false,
    docx: false
};

// Promesses de chargement pour éviter les chargements multiples
const loadPromises = {};

/**
 * Charge un script de manière dynamique
 * @param {string} src - Chemin vers le fichier JS
 * @returns {Promise} - Promesse résolue quand le script est chargé
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Vérifier si le script est déjà chargé
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Échec du chargement: ${src}`));
        document.body.appendChild(script);
    });
}

// ============================================================================
// FONCTIONS DE CHARGEMENT PAR GROUPE
// ============================================================================

/**
 * Charge les bibliothèques OCR (PDF.js, Tesseract, mammoth, JSZip)
 * Utilisé pour l'extraction de texte depuis PDF, DOCX, ODT, images
 */
export async function loadOcrLibs() {
    if (loadState.pdfjs && loadState.tesseract && loadState.mammoth && loadState.jszip) {
        return; // Déjà chargé
    }

    if (!loadPromises.ocr) {
        loadPromises.ocr = (async () => {
            const promises = [];

            // PDF.js
            if (!loadState.pdfjs && !window.pdfjsLib) {
                promises.push(
                    loadScript(LIB_PATHS.PDF_JS)
                        .then(() => {
                            // Configurer le worker PDF.js
                            if (window.pdfjsLib) {
                                window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIB_PATHS.PDF_JS_WORKER;
                            }
                            loadState.pdfjs = true;
                        })
                );
            }

            // Tesseract
            if (!loadState.tesseract && !window.Tesseract) {
                promises.push(
                    loadScript(LIB_PATHS.TESSERACT)
                        .then(() => { loadState.tesseract = true; })
                );
            }

            // mammoth
            if (!loadState.mammoth && !window.mammoth) {
                promises.push(
                    loadScript(LIB_PATHS.MAMMOTH)
                        .then(() => { loadState.mammoth = true; })
                );
            }

            // JSZip (pour ODT)
            if (!loadState.jszip && !window.JSZip) {
                promises.push(
                    loadScript(LIB_PATHS.JSZIP)
                        .then(() => { loadState.jszip = true; })
                );
            }

            await Promise.all(promises);
        })();
    }

    return loadPromises.ocr;
}

/**
 * Charge les bibliothèques H5P (client-zip, h5p-standalone)
 * Utilisé pour créer des archives H5P et afficher les contenus H5P
 */
export async function loadH5pLibs() {
    if (loadState.clientZip && loadState.h5pStandalone) {
        return;
    }

    if (!loadPromises.h5p) {
        loadPromises.h5p = (async () => {
            const promises = [];

            // H5P Standalone (pour l'affichage)
            if (!loadState.h5pStandalone && !window.H5P) {
                promises.push(
                    loadScript(LIB_PATHS.H5P_STANDALONE)
                        .then(() => { loadState.h5pStandalone = true; })
                );
            }

            // client-zip (pour la création d'archives)
            if (!loadState.clientZip) {
                promises.push(
                    loadScript(LIB_PATHS.CLIENT_ZIP)
                        .then(() => { loadState.clientZip = true; })
                );
            }

            await Promise.all(promises);
        })();
    }

    return loadPromises.h5p;
}

/**
 * Charge les bibliothèques Moodle (fflate, tar-js)
 * Utilisé pour créer des archives Moodle (.mbz)
 */
export async function loadMoodleLibs() {
    if (loadState.fflate && loadState.tarjs) {
        return;
    }

    if (!loadPromises.moodle) {
        loadPromises.moodle = (async () => {
            const promises = [];

            if (!loadState.fflate && !window.fflate) {
                promises.push(
                    loadScript(LIB_PATHS.FFLATE)
                        .then(() => { loadState.fflate = true; })
                );
            }

            if (!loadState.tarjs && !window.Tar) {
                promises.push(
                    loadScript(LIB_PATHS.TAR_JS)
                        .then(() => { loadState.tarjs = true; })
                );
            }

            await Promise.all(promises);
        })();
    }

    return loadPromises.moodle;
}

/**
 * Charge la bibliothèque MathJax
 * Utilisé pour le rendu mathématique dans les simulateurs
 */
export async function loadMathJax() {
    if (loadState.mathjax) {
        return;
    }

    if (!loadPromises.mathjax) {
        loadPromises.mathjax = (async () => {
            if (!loadState.mathjax && !window.MathJax) {
                // Configuration MathJax avant le chargement
                window.MathJax = {
                    tex: {
                        inlineMath: [['\\(', '\\)'], ['$', '$']],
                        displayMath: [['\\[', '\\]'], ['$$', '$$']],
                        processEscapes: true,
                        processEnvironments: true
                    },
                    svg: {
                        fontCache: 'global'
                    },
                    startup: {
                        ready: () => {
                            MathJax.startup.defaultReady();
                        }
                    }
                };

                await loadScript(LIB_PATHS.MATHJAX);
                loadState.mathjax = true;
            }
        })();
    }

    return loadPromises.mathjax;
}

/**
 * Charge uniquement JSZip (96KB) - utile pour plusieurs formats sans charger les libs OCR lourdes
 */
export async function loadJSZip() {
    if (loadState.jszip || window.JSZip) {
        loadState.jszip = true;
        return;
    }

    if (!loadPromises.jszip) {
        loadPromises.jszip = loadScript(LIB_PATHS.JSZIP).then(() => {
            loadState.jszip = true;
        });
    }

    return loadPromises.jszip;
}

/**
 * Précharge les bibliothèques OCR via <link rel="preload"> sans les exécuter
 * Cela permet au navigateur de télécharger les fichiers en arrière-plan
 * pour qu'ils soient en cache quand l'utilisateur uploade un fichier
 */
export function preloadOcrLibsHints() {
    const preloadPaths = [
        { path: LIB_PATHS.PDF_JS, as: 'script' },
        { path: LIB_PATHS.TESSERACT, as: 'script' },
        { path: LIB_PATHS.MAMMOTH, as: 'script' },
        { path: LIB_PATHS.JSZIP, as: 'script' }
    ];

    preloadPaths.forEach(({ path, as }) => {
        // Éviter les doublons
        if (document.querySelector(`link[rel="preload"][href="${path}"]`)) {
            return;
        }
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = path;
        document.head.appendChild(link);
    });
}

/**
 * Charge les bibliothèques d'export de documents (jsPDF, docx)
 * Utilisé pour l'export en PDF et DOCX
 */
export async function loadDocumentExportLibs() {
    if (loadState.jspdf && loadState.docx && loadState.jszip) {
        return;
    }

    if (!loadPromises.documentExport) {
        loadPromises.documentExport = (async () => {
            const promises = [];

            // jsPDF
            if (!loadState.jspdf && !window.jspdf) {
                promises.push(
                    loadScript(LIB_PATHS.JSPDF)
                        .then(() => loadScript(LIB_PATHS.JSPDF_AUTOTABLE))
                        .then(() => { loadState.jspdf = true; })
                );
            }

            // docx
            if (!loadState.docx && !window.docx) {
                promises.push(
                    loadScript(LIB_PATHS.DOCX)
                        .then(() => { loadState.docx = true; })
                );
            }

            // JSZip (pour ODT)
            if (!loadState.jszip && !window.JSZip) {
                promises.push(
                    loadScript(LIB_PATHS.JSZIP)
                        .then(() => { loadState.jszip = true; })
                );
            }

            await Promise.all(promises);
        })();
    }

    return loadPromises.documentExport;
}

/**
 * Précharge uniquement les bibliothèques légères (<100KB) en arrière-plan
 * Les bibliothèques lourdes (MathJax, PDF.js, Tesseract, mammoth, docx, jsPDF)
 * sont chargées uniquement à la demande réelle de l'utilisateur
 */
export function preloadLightLibs() {
    const idleLoad = (loadFn) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadFn().catch(() => { }), { timeout: 5000 });
        } else {
            setTimeout(() => loadFn().catch(() => { }), 100);
        }
    };

    // Libs légères uniquement : client-zip (6KB), h5p-standalone (17KB), fflate (32KB), tar-js (7KB), jszip (96KB)
    idleLoad(loadH5pLibs);    // ~23 KB total (client-zip + h5p-standalone)
    idleLoad(loadMoodleLibs); // ~39 KB total (fflate + tar-js)
}

/**
 * @deprecated Utiliser preloadLightLibs() à la place
 * Précharge toutes les bibliothèques - conservé pour compatibilité
 */
export function preloadAllLibs() {
    preloadLightLibs();
    // Les libs lourdes ne sont plus préchargées automatiquement
    // Elles seront chargées à la demande via les fonctions load*()
}

// ============================================================================
// PRÉCHARGEMENT INTELLIGENT
// ============================================================================

/**
 * Initialise les déclencheurs de préchargement intelligent
 * Stratégie hybride : libs légères en idle, libs lourdes uniquement à la demande
 */
export function initSmartPreloading() {
    let hasStartedTyping = false;
    let hasOpenedAdvancedMode = false;
    let lightLibsPreloaded = false;

    // Helper pour charger en idle
    const idleLoad = (loadFn) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadFn().catch(() => { }), { timeout: 5000 });
        } else {
            setTimeout(() => loadFn().catch(() => { }), 100);
        }
    };

    // Déclencheur 1: Premier caractère tapé dans les champs principaux
    // -> Précharge uniquement les libs légères (H5P, Moodle)
    const mainFields = document.querySelectorAll('#qui, #quoi');
    mainFields.forEach(field => {
        field.addEventListener('input', () => {
            if (!hasStartedTyping) {
                hasStartedTyping = true;
                // Précharger les libs légères pendant la saisie
                idleLoad(loadH5pLibs);
                idleLoad(loadMoodleLibs);
            }
        }, { once: true });
    });

    // Déclencheur 2: Clic sur "Mode Avancé"
    // -> Précharge les libs OCR via <link rel="preload"> pour les télécharger en arrière-plan
    // Les scripts ne sont pas exécutés, juste téléchargés et mis en cache
    const advancedTab = document.querySelector('[data-mode="advanced"]');
    if (advancedTab) {
        advancedTab.addEventListener('click', () => {
            if (!hasOpenedAdvancedMode) {
                hasOpenedAdvancedMode = true;
                // Précharger les libs OCR (téléchargement en arrière-plan sans exécution)
                preloadOcrLibsHints();
                // Charger JSZip (léger, utile pour plusieurs formats)
                idleLoad(loadJSZip);
            }
        }, { once: true });
    }

    // Déclencheur 3: Drag effectif sur la zone de dépôt
    // -> Précharge les libs OCR seulement quand l'utilisateur commence vraiment un drag
    const dragDropArea = document.querySelector('.drag-drop-area');
    if (dragDropArea) {
        dragDropArea.addEventListener('dragenter', () => {
            // Charger les libs OCR dès qu'un fichier est glissé
            loadOcrLibs().catch(() => { });
        }, { once: true });
    }

    // Déclencheur 4: Préchargement des libs légères après 5 secondes d'inactivité
    // Les libs lourdes (OCR, MathJax, export) ne sont JAMAIS préchargées automatiquement
    let idleTimer;
    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (!lightLibsPreloaded) {
                lightLibsPreloaded = true;
                // Après 5s d'inactivité, précharger uniquement les libs légères
                preloadLightLibs();
            }
        }, 5000);
    };

    // Démarrer le timer d'inactivité
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
        document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Vérifie si les bibliothèques OCR sont chargées
 */
export function areOcrLibsLoaded() {
    return window.pdfjsLib && window.Tesseract && window.mammoth && window.JSZip;
}

/**
 * Vérifie si les bibliothèques Moodle sont chargées
 */
export function areMoodleLibsLoaded() {
    return window.fflate && window.Tar;
}

/**
 * Vérifie si MathJax est chargé
 */
export function isMathJaxLoaded() {
    return window.MathJax && window.MathJax.typesetPromise;
}

/**
 * Vérifie si les bibliothèques d'export de documents sont chargées
 */
export function areDocumentExportLibsLoaded() {
    return window.jspdf && window.docx && window.JSZip;
}
