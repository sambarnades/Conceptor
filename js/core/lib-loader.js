/**
 * @file Module de chargement dynamique des bibliothèques.
 * Charge les bibliothèques JavaScript uniquement quand elles sont nécessaires,
 * avec préchargement intelligent pendant les temps morts de l'utilisateur.
 */

// ============================================================================
// CONFIGURATION DES CHEMINS DES BIBLIOTHÈQUES
// Modifier ici si vous déplacez ou renommez une bibliothèque
// ============================================================================

export const LIB_PATHS = {
    // OCR / Extraction de texte
    PDF_JS: 'js/vendor/pdf-js/6.1.200/pdf.min.mjs',
    PDF_JS_WORKER: 'js/vendor/pdf-js/6.1.200/pdf.worker.compat.mjs',
    TESSERACT: 'js/vendor/tesseract/7.0.0/tesseract.min.js',
    // Fichiers Tesseract auto-hébergés (sinon téléchargés depuis cdn.jsdelivr.net au runtime, sans SRI)
    TESSERACT_WORKER: 'js/vendor/tesseract/7.0.0/worker.min.js',
    TESSERACT_CORE: 'js/vendor/tesseract/7.0.0/core',   // répertoire : le worker y choisit la variante *-lstm.wasm.js
    TESSERACT_LANG: 'js/vendor/tesseract/7.0.0/lang',   // répertoire : contient <lang>.traineddata.gz
    MAMMOTH: 'js/vendor/mammoth/1.12.0/mammoth.browser.min.js',
    JSZIP: 'js/vendor/jszip/3.10.1/jszip.min.js',

    // H5P
    CLIENT_ZIP: 'js/vendor/client-zip/2.5.0/index.js',
    H5P_STANDALONE: 'js/vendor/h5p-standalone/3.8.2/main.bundle.js',
    H5P_FRAME_JS: 'js/vendor/h5p-standalone/3.8.2/frame.bundle.js',
    H5P_FRAME_CSS: 'js/vendor/h5p-standalone/3.8.2/styles/h5p.css',
    H5P_LIBRARIES: 'js/vendor/h5p-libs',

    // Moodle
    FFLATE: 'js/vendor/fflate/0.8.3/index.js',
    TAR_JS: 'js/vendor/tar-js/0.3.0/tar.bundle.js',

    // Math rendering
    MATHJAX: 'js/vendor/mathjax/3.2.2/tex-svg.js',

    // Document export
    JSPDF: 'js/vendor/jspdf/4.2.1/jspdf.umd.min.js',
    JSPDF_AUTOTABLE: 'js/vendor/jspdf-autotable/5.0.8/jspdf.plugin.autotable.min.js',
    DOCX: 'js/vendor/docx/8.6.0/index.umd.js',

    // Security
    DOMPURIFY: 'js/vendor/dompurify/3.4.11/purify.min.js',

    // QR code (génération du QR de la vidéo source dans les exports documentaires)
    QRCODE: 'js/vendor/qrcode/2.0.4/qrcode.js',

    // Conversion d'images exotiques (image de fond « Image interactive ») — lazy, chargées
    // UNIQUEMENT si l'utilisateur joint un fichier de ce type :
    HEIC2ANY: 'js/vendor/heic2any/0.0.4/heic2any.min.js', // HEIC/HEIF (photos iPhone) → JPEG/PNG (inclut libheif, worker blob)
    UTIF: 'js/vendor/utif/3.1.0/UTIF.js',                 // TIFF → RGBA → PNG
    PAKO: 'js/vendor/pako/2.1.0/pako.min.js',             // zlib (MIT AND Zlib) — requis par UTIF pour les TIFF compressés (deflate)

    // Caramelia (chatbot flottant)
    CARAMELIA: 'js/caramelia/index.js',

    // Fonts (Liberation Sans - drop-in replacement for Arial, SIL OFL license)
    FONT_LIBERATION_SANS_REGULAR: 'js/vendor/fonts/LiberationSans-Regular.ttf',
    FONT_LIBERATION_SANS_BOLD: 'js/vendor/fonts/LiberationSans-Bold.ttf',
    FONT_LIBERATION_SANS_ITALIC: 'js/vendor/fonts/LiberationSans-Italic.ttf',
    FONT_LIBERATION_SANS_BOLDITALIC: 'js/vendor/fonts/LiberationSans-BoldItalic.ttf'
};

// ============================================================================
// POLYFILLS POUR COMPATIBILITÉ SAFARI
// Promise.withResolvers() — absent sur Safari < 17.4
// structuredClone() — absent sur Safari < 15.4
// ReadableStream async iteration — absent sur Safari < 17.6
// Tous utilisés par PDF.js 5.x (getTextContent, streamTextContent, etc.)
// ============================================================================

if (typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = function (value) {
        return JSON.parse(JSON.stringify(value));
    };
}

// Uint8Array hex / base64 (proposition TC39 « Uint8Array to/from base64 and hex »).
// Utilisés par PDF.js 5.x : .toBase64() pour embarquer les polices au rendu,
// Uint8Array.fromBase64() pour les signatures. Le worker utilise en plus .toHex()
// pour le fingerprint du document (cf. pdf.worker.compat.mjs).
// Absents sur Chrome < 140, Safari < 18.2, Firefox < 133 → « toHex is not a function »
// et la transcription PDF échoue entièrement. Polyfills additifs, sans régression.
if (typeof Uint8Array.prototype.toHex === 'undefined') {
    Uint8Array.prototype.toHex = function () {
        let s = '';
        for (let i = 0; i < this.length; i++) {
            s += this[i].toString(16).padStart(2, '0');
        }
        return s;
    };
}

if (typeof Uint8Array.fromHex === 'undefined') {
    Uint8Array.fromHex = function (hex) {
        const len = hex.length >> 1;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            out[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return out;
    };
}

if (typeof Uint8Array.prototype.toBase64 === 'undefined') {
    Uint8Array.prototype.toBase64 = function () {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < this.length; i += chunk) {
            bin += String.fromCharCode.apply(null, this.subarray(i, i + chunk));
        }
        return btoa(bin);
    };
}

if (typeof Uint8Array.fromBase64 === 'undefined') {
    Uint8Array.fromBase64 = function (b64) {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            out[i] = bin.charCodeAt(i);
        }
        return out;
    };
}

// ReadableStream[Symbol.asyncIterator] — utilisé par PDF.js 5.x dans
// getTextContent() qui fait `for await (const t of stream)`.
// Absent sur Safari < 17.6, provoque "undefined is not a function".
if (typeof ReadableStream !== 'undefined' &&
    !ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
        const reader = this.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) return;
                yield value;
            }
        } finally {
            reader.releaseLock();
        }
    };
}

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
    docx: false,
    dompurify: false,
    qrcode: false,
    heic2any: false,
    utif: false,
    pako: false,
    fonts: false,
    caramelia: false
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
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            // Ne résoudre que si le script a bien été exécuté (pas un échec précédent)
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            } else if (existing.dataset.loaded === 'false') {
                // Script échoué précédemment : le retirer et réessayer
                existing.remove();
            } else {
                // Script en cours de chargement
                resolve();
                return;
            }
        }

        // Charger (ou recharger) le script
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = () => {
                script.dataset.loaded = 'false';
                reject(new Error(`Échec du chargement: ${src}`));
            };
            document.body.appendChild(script);
        }
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

            // PDF.js (v5+ = ES module, chargé via import() dynamique)
            if (!loadState.pdfjs && !window.pdfjsLib) {
                promises.push(
                    import('../../' + LIB_PATHS.PDF_JS)
                        .then((pdfjsModule) => {
                            // Exposer le module en tant que global pour compatibilité
                            window.pdfjsLib = pdfjsModule;
                            window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIB_PATHS.PDF_JS_WORKER;
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
        })().catch((error) => {
            // Nettoyer le cache pour permettre une nouvelle tentative
            delete loadPromises.ocr;
            throw error;
        });
    }

    return loadPromises.ocr;
}

/**
 * Charge la bibliothèque client-zip (ES module) pour la création d'archives H5P.
 * Utilise import() dynamique car c'est un module ES, pas un script classique.
 * @returns {Promise<Function>} La fonction downloadZip
 */
let _downloadZip = null;

export async function loadClientZip() {
    if (_downloadZip) {
        return _downloadZip;
    }

    if (!loadPromises.clientZip) {
        loadPromises.clientZip = (async () => {
            const mod = await import('../../' + LIB_PATHS.CLIENT_ZIP);
            _downloadZip = mod.downloadZip;
            loadState.clientZip = true;
            return _downloadZip;
        })().catch((error) => {
            delete loadPromises.clientZip;
            throw error;
        });
    }

    return loadPromises.clientZip;
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

            // client-zip (ES module, pour la création d'archives)
            if (!loadState.clientZip) {
                promises.push(loadClientZip());
            }

            await Promise.all(promises);
        })().catch((error) => {
            delete loadPromises.h5p;
            throw error;
        });
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
        })().catch((error) => {
            delete loadPromises.moodle;
            throw error;
        });
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
        })().catch((error) => {
            delete loadPromises.mathjax;
            throw error;
        });
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
        }).catch((error) => {
            delete loadPromises.jszip;
            throw error;
        });
    }

    return loadPromises.jszip;
}

/**
 * Charge DOMPurify (~20KB) pour la sanitization HTML
 * Utilisé pour protéger contre les injections XSS dans le contenu LLM
 */
export async function loadDOMPurify() {
    if (loadState.dompurify || window.DOMPurify) {
        loadState.dompurify = true;
        return;
    }

    if (!loadPromises.dompurify) {
        loadPromises.dompurify = loadScript(LIB_PATHS.DOMPURIFY).then(() => {
            loadState.dompurify = true;
        }).catch((error) => {
            delete loadPromises.dompurify;
            throw error;
        });
    }

    return loadPromises.dompurify;
}

/**
 * Charge les polices Liberation Sans pour jsPDF
 * Télécharge les fichiers TTF et les enregistre dans l'instance jsPDF
 * @param {jsPDF} doc - Instance jsPDF dans laquelle enregistrer les polices
 */
export async function loadPDFFonts(doc) {
    if (!doc) return;

    if (!loadPromises.fonts) {
        loadPromises.fonts = (async () => {
            const fontConfigs = [
                { path: LIB_PATHS.FONT_LIBERATION_SANS_REGULAR, name: 'LiberationSans-Regular.ttf', style: 'normal' },
                { path: LIB_PATHS.FONT_LIBERATION_SANS_BOLD, name: 'LiberationSans-Bold.ttf', style: 'bold' },
                { path: LIB_PATHS.FONT_LIBERATION_SANS_ITALIC, name: 'LiberationSans-Italic.ttf', style: 'italic' },
                { path: LIB_PATHS.FONT_LIBERATION_SANS_BOLDITALIC, name: 'LiberationSans-BoldItalic.ttf', style: 'bolditalic' }
            ];

            const results = await Promise.all(
                fontConfigs.map(async (config) => {
                    const response = await fetch(config.path);
                    const buffer = await response.arrayBuffer();
                    // Convertir ArrayBuffer en string binaire pour jsPDF
                    const binary = new Uint8Array(buffer);
                    let binaryStr = '';
                    for (let i = 0; i < binary.length; i++) {
                        binaryStr += String.fromCharCode(binary[i]);
                    }
                    return { ...config, data: binaryStr };
                })
            );

            // Stocker les données pour réutilisation dans d'autres instances jsPDF
            window._liberationSansFonts = results;
            loadState.fonts = true;
        })().catch((error) => {
            delete loadPromises.fonts;
            throw error;
        });
    }

    await loadPromises.fonts;

    // Enregistrer les polices dans l'instance jsPDF fournie
    if (window._liberationSansFonts) {
        window._liberationSansFonts.forEach(font => {
            doc.addFileToVFS(font.name, font.data);
            doc.addFont(font.name, 'LiberationSans', font.style);
        });
    }
}

/**
 * Vérifie si DOMPurify est chargé
 */
export function isDOMPurifyLoaded() {
    return loadState.dompurify && window.DOMPurify;
}

/**
 * Charge la bibliothèque QR code (~57KB, MIT) — expose le global `window.qrcode`
 * (factory `qrcode(typeNumber, ecLevel)`). Utilisé par l'export documentaire de la
 * Vidéo interactive pour générer le QR de la vidéo source.
 */
export async function loadQRCode() {
    if (loadState.qrcode || window.qrcode) {
        loadState.qrcode = true;
        return;
    }

    if (!loadPromises.qrcode) {
        loadPromises.qrcode = loadScript(LIB_PATHS.QRCODE).then(() => {
            loadState.qrcode = true;
        }).catch((error) => {
            delete loadPromises.qrcode;
            throw error;
        });
    }

    return loadPromises.qrcode;
}

/**
 * Charge heic2any (~1,3 Mo, MIT ; inclut libheif LGPL) — expose le global `window.heic2any`.
 * Lazy : appelé UNIQUEMENT quand l'utilisateur joint une image HEIC/HEIF (photo iPhone) comme
 * image de fond d'« Image interactive ». La conversion (HEIC → JPEG/PNG) tourne dans un Web Worker
 * blob auto-contenu par la lib.
 */
export async function loadHeic2any() {
    if (loadState.heic2any || window.heic2any) {
        loadState.heic2any = true;
        return;
    }

    if (!loadPromises.heic2any) {
        loadPromises.heic2any = loadScript(LIB_PATHS.HEIC2ANY).then(() => {
            loadState.heic2any = true;
        }).catch((error) => {
            delete loadPromises.heic2any;
            throw error;
        });
    }

    return loadPromises.heic2any;
}

/**
 * Charge pako (~46 Ko, MIT AND Zlib) — expose le global `window.pako`. Dépendance de UTIF pour
 * décompresser les TIFF en deflate. DOIT être chargée AVANT UTIF.js : ce dernier capte `self.pako`
 * dans une variable au moment de son exécution (un chargement ultérieur de pako serait ignoré).
 */
export async function loadPako() {
    if (loadState.pako || window.pako) {
        loadState.pako = true;
        return;
    }

    if (!loadPromises.pako) {
        loadPromises.pako = loadScript(LIB_PATHS.PAKO).then(() => {
            loadState.pako = true;
        }).catch((error) => {
            delete loadPromises.pako;
            throw error;
        });
    }

    return loadPromises.pako;
}

/**
 * Charge UTIF.js (~57 Ko, MIT) — expose le global `window.UTIF`. Lazy : appelé UNIQUEMENT quand
 * l'utilisateur joint une image TIFF comme image de fond d'« Image interactive ». Décode le TIFF en
 * RGBA. pako est chargée AVANT (UTIF la capte à l'exécution) → prend en charge aussi les TIFF deflate.
 */
export async function loadUTIF() {
    if (loadState.utif || window.UTIF) {
        loadState.utif = true;
        return;
    }

    if (!loadPromises.utif) {
        loadPromises.utif = (async () => {
            await loadPako();                  // pako DOIT être globale avant l'exécution d'UTIF.js
            await loadScript(LIB_PATHS.UTIF);
            loadState.utif = true;
        })().catch((error) => {
            delete loadPromises.utif;
            throw error;
        });
    }

    return loadPromises.utif;
}

/**
 * Charge le module Caramelia (chatbot flottant)
 * Module ES, chargé via import() dynamique pour ne pas bloquer le rendu initial.
 */
export async function loadCaramelia() {
    if (loadState.caramelia) {
        return;
    }

    if (!loadPromises.caramelia) {
        loadPromises.caramelia = import('../../' + LIB_PATHS.CARAMELIA)
            .then(() => { loadState.caramelia = true; })
            .catch((error) => {
                delete loadPromises.caramelia;
                throw error;
            });
    }

    return loadPromises.caramelia;
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
        // Les .mjs sont des modules ES (chargés via import()) : préchargés avec
        // rel="modulepreload" pour que le mode credentials corresponde au fetch
        // du module. Avec rel="preload" as="script" le navigateur jette le
        // preload (« credentials mode does not match ») et re-télécharge le module.
        const isModule = path.endsWith('.mjs');
        const rel = isModule ? 'modulepreload' : 'preload';

        // Éviter les doublons
        if (document.querySelector(`link[rel="${rel}"][href="${path}"]`)) {
            return;
        }
        const link = document.createElement('link');
        link.rel = rel;
        if (!isModule) {
            link.as = as;
        }
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
        })().catch((error) => {
            delete loadPromises.documentExport;
            throw error;
        });
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

    // Chatbot Caramelia : chargement immédiat en idle, sans attendre le timer d'inactivité
    // (doit être disponible dès le démarrage indépendamment de l'interaction utilisateur)
    idleLoad(loadCaramelia);

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
