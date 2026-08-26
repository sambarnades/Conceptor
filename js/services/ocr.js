/**
 * @file Gestion de l'extraction de texte depuis différents formats de fichiers.
 * Supporte : PDF (texte natif + OCR), TXT (texte brut, sans aucune bibliothèque),
 * DOCX, PPTX, ODT, ODP, PNG, JPEG, AUDIO et VIDÉO (bande-son), plus une série de
 * formats acceptés SILENCIEUSEMENT (non listés dans les libellés) : MD, CSV, TSV,
 * HTML, SRT, VTT, RTF, EPUB, XLSX, ODS, WEBP, BMP, HEIC/HEIF, TIFF et les archives ZIP
 * Utilise PDF.js, Tesseract.js, mammoth.js et JSZip ; l'audio est transcrit
 * par le webhook Whisper/Albert (le même que le micro Caramelia), via un
 * découpage en lots préparé côté navigateur (Web Audio API).
 * Les images passent d'abord par l'ANALYSE VISION (services/image-analysis.js :
 * description + transcription par le modèle vision), avec repli Tesseract.
 */

import { showNotification, escapeHtmlTags, debugLog } from '../core/utils.js';
import { translations, currentLang } from '../core/translation.js';
import { loadOcrLibs, LIB_PATHS } from '../core/lib-loader.js';
import { CONFIG } from '../caramelia/config.js';

// Types MIME supportés
const SUPPORTED_TYPES = {
    'application/pdf': 'pdf',
    // Texte brut : aucune bibliothèque, le fichier EST déjà le texte.
    'text/plain': 'text',
    'text/markdown': 'text',
    'text/csv': 'text',
    'text/tab-separated-values': 'text',
    // Balisage : même lecture, suivie d'un dépouillement des balises.
    'text/html': 'html',
    'application/xhtml+xml': 'html',
    // Sous-titres : même lecture, suivie du retrait des horodatages.
    'text/vtt': 'subtitles',
    'application/x-subrip': 'subtitles',
    // RTF : texte, mais noyé dans des commandes de mise en forme.
    'application/rtf': 'rtf',
    'text/rtf': 'rtf',
    // EPUB : ZIP de XHTML (mêmes outils que l'ODT).
    'application/epub+zip': 'epub',
    // Photos d'iPhone et TIFF : décodés en amont par heic2any / UTIF, puis
    // traités comme n'importe quelle image (vision + repli OCR).
    'image/heic': 'image',
    'image/heif': 'image',
    'image/tiff': 'image',
    // TABLEURS + ARCHIVES : acceptés SILENCIEUSEMENT, comme WebP/BMP ci-dessous —
    // volontairement absents de SUPPORTED_FORMATS_LABEL et des libellés i18n, mais
    // présents dans l'`accept` de l'input (sans quoi le sélecteur de fichiers les grise).
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    // Office ANCIEN (BIFF/OLE2 : .doc, .xls, .ppt d'avant 2007) : reconnu pour
    // pouvoir l'EXPLIQUER, pas pour le lire — décoder ces binaires demanderait
    // une bibliothèque de près d'un mégaoctet.
    'application/vnd.ms-excel': 'office-ancien',
    'application/msword': 'office-ancien',
    'application/vnd.ms-powerpoint': 'office-ancien',
    // iWork : ce SONT des ZIP, mais leur contenu est du protobuf compressé en
    // Snappy — hors de portée. Reconnus pour orienter vers un export.
    'application/vnd.apple.pages': 'iwork',
    'application/vnd.apple.numbers': 'iwork',
    'application/vnd.apple.keynote': 'iwork',
    // Archive : dépliée, chaque document interne rejoint la file d'attente.
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/jpg': 'image',
    // WebP/BMP : acceptés SILENCIEUSEMENT (volontairement absents de SUPPORTED_FORMATS_LABEL
    // et des libellés i18n). Vision : ILaaS/Qwen décode le data:image/webp tel quel, et le BMP
    // est ré-encodé en PNG par processBackgroundImage avant envoi ; repli Tesseract :
    // conversion PNG préalable via canvas pour les deux (cf. processImage).
    'image/webp': 'image',
    'image/bmp': 'image',
    'image/x-ms-bmp': 'image',
    // Audio → transcription Whisper/Albert (décodés par decodeAudioData)
    'audio/mpeg': 'audio',
    'audio/mp3': 'audio',
    'audio/mp4': 'audio',
    'audio/x-m4a': 'audio',
    'audio/aac': 'audio',
    'audio/wav': 'audio',
    'audio/x-wav': 'audio',
    'audio/wave': 'audio',
    'audio/ogg': 'audio',
    'audio/webm': 'audio',
    'audio/flac': 'audio',
    'audio/x-flac': 'audio',
    'audio/opus': 'audio',
    // Vidéo → on n'extrait QUE la piste audio (transcription). decodeAudioData
    // sait décoder la piste audio d'un conteneur vidéo (MP4/AAC, MOV, WebM…)
    // sans demuxing manuel. Le décodage dépend des codecs du navigateur
    // (fiable sur Chromium ; plus inégal sur Firefox pour le MP4).
    'video/mp4': 'audio',
    'video/quicktime': 'audio',
    'video/webm': 'audio',
    'video/x-m4v': 'audio'
};

// Extensions pour fallback (certains navigateurs ne détectent pas bien le MIME)
const EXTENSION_MAP = {
    'pdf': 'pdf',
    'txt': 'text',
    'md': 'text',
    'markdown': 'text',
    'csv': 'text',
    'tsv': 'text',
    'html': 'html',
    'htm': 'html',
    'xhtml': 'html',
    'srt': 'subtitles',
    'vtt': 'subtitles',
    'rtf': 'rtf',
    'epub': 'epub',
    'heic': 'image',
    'heif': 'image',
    'tif': 'image',
    'tiff': 'image',
    'xlsx': 'xlsx',   // accepté silencieusement (cf. SUPPORTED_TYPES)
    'ods': 'ods',     // idem
    'zip': 'zip',     // idem
    'xls': 'office-ancien',
    'doc': 'office-ancien',
    'ppt': 'office-ancien',
    'pages': 'iwork',
    'numbers': 'iwork',
    'key': 'iwork',
    'docx': 'docx',
    'pptx': 'pptx',
    'odt': 'odt',
    'odp': 'odp',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'webp': 'image',   // accepté silencieusement (cf. SUPPORTED_TYPES)
    'bmp': 'image',    // accepté silencieusement (cf. SUPPORTED_TYPES)
    'mp3': 'audio',
    'm4a': 'audio',
    'aac': 'audio',
    'wav': 'audio',
    'wave': 'audio',
    'ogg': 'audio',
    'oga': 'audio',
    'opus': 'audio',
    'webm': 'audio',
    'flac': 'audio',
    // Conteneurs vidéo : on n'extrait que la piste audio (cf. SUPPORTED_TYPES)
    'mp4': 'audio',
    'm4v': 'audio',
    'mov': 'audio'
};

// Conteneurs vidéo : sert à prévenir l'utilisateur qu'on n'extrait que l'audio.
const VIDEO_EXTENSIONS = new Set(['mp4', 'm4v', 'mov', 'webm']);
const VIDEO_MIME_PREFIX = 'video/';

/**
 * Indique si le fichier est un conteneur vidéo (→ extraction audio seule).
 */
function isVideoFile(file) {
    if (file.type && file.type.startsWith(VIDEO_MIME_PREFIX)) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    return VIDEO_EXTENSIONS.has(ext);
}

// Libellé des formats acceptés (réutilisé pour le message d'erreur et l'API publique).
// WEBP et BMP sont acceptés mais VOLONTAIREMENT non listés (éviter la confusion
// WEBP/WEBM et ne pas allonger le libellé) — ne pas les ajouter ici sans décision explicite.
const SUPPORTED_FORMATS_LABEL = 'PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG, MP3, M4A, WAV, OGG, FLAC, MP4, MOV, WEBM (audio extrait)';

// --- Garde-fous des archives ZIP ---
// Une archive est décompressée EN MÉMOIRE : sans plafond, une « bombe zip »
// (quelques Ko qui se déplient en plusieurs Go) fige l'onglet. On s'arrête donc
// au premier des deux seuils atteint, et on le DIT à l'utilisateur.
const MAX_ZIP_FILES = 30;
const MAX_ZIP_BYTES = 100 * 1024 * 1024;

// --- Paramètres de transcription audio ---
const MAX_AUDIO_SECONDS = 90 * 60;   // plafond : 90 min (au-delà → message clair)
const AUDIO_CHUNK_SECONDS = 300;     // lots de 5 min (≈ 9,6 Mo en WAV 16 kHz mono → sous la limite Albert)
const AUDIO_TARGET_RATE = 16000;     // 16 kHz mono : format attendu par Whisper, upload minimal

/**
 * Construit les options Tesseract communes en pointant worker, core et données
 * de langue vers les fichiers auto-hébergés (js/vendor/tesseract/7.0.0/).
 * Sans ces options, tesseract.js télécharge tout depuis cdn.jsdelivr.net au
 * runtime, sans SRI. Les chemins sont résolus en URLs absolues via
 * document.baseURI pour supporter un déploiement sous sous-chemin.
 * @param {function} logger - Callback de progression Tesseract
 * @returns {Object} Options à passer à Tesseract.recognize
 */
function getTesseractOptions(logger) {
    return {
        workerPath: new URL(LIB_PATHS.TESSERACT_WORKER, document.baseURI).href,
        corePath: new URL(LIB_PATHS.TESSERACT_CORE, document.baseURI).href,
        langPath: new URL(LIB_PATHS.TESSERACT_LANG, document.baseURI).href,
        logger
    };
}

/**
 * Détecte le type de fichier par MIME ou extension (synchrone).
 */
function detectFileType(file) {
    // D'abord essayer par type MIME
    if (file.type && SUPPORTED_TYPES[file.type]) {
        return SUPPORTED_TYPES[file.type];
    }
    // Fallback sur l'extension
    const ext = file.name.split('.').pop().toLowerCase();
    return EXTENSION_MAP[ext] || null;
}

// Nombre d'octets lus pour la reconnaissance par signature (couvre l'en-tête
// ZIP d'un fichier OpenDocument, dont la chaîne « mimetype » démarre à l'offset 30).
const SNIFF_BYTES = 96;

/**
 * Signatures binaires reconnues, testées dans l'ordre. `offset` est la position
 * du motif ; `texte` permet d'écrire une signature ASCII lisible.
 */
const SIGNATURES = [
    { type: 'pdf',   offset: 0, texte: '%PDF' },
    { type: 'image', offset: 0, octets: [0x89, 0x50, 0x4E, 0x47] },        // PNG
    { type: 'image', offset: 0, octets: [0xFF, 0xD8, 0xFF] },              // JPEG
    { type: 'image', offset: 0, texte: 'BM' },                             // BMP
    { type: 'image', offset: 8, texte: 'WEBP' },                           // RIFF….WEBP
    { type: 'audio', offset: 8, texte: 'WAVE' },                           // RIFF….WAVE
    { type: 'audio', offset: 0, texte: 'ID3' },                            // MP3 étiqueté
    { type: 'audio', offset: 0, texte: 'fLaC' },
    { type: 'audio', offset: 0, texte: 'OggS' },
    // Conteneurs ISO-BMFF : « ftyp » à l'offset 4, MARQUE à l'offset 8. Les
    // marques image DOIVENT être testées AVANT le cas général, sinon une photo
    // d'iPhone serait prise pour une bande-son.
    { type: 'image', offset: 4, texte: 'ftypheic' },
    { type: 'image', offset: 4, texte: 'ftypheix' },
    { type: 'image', offset: 4, texte: 'ftyphevc' },
    { type: 'image', offset: 4, texte: 'ftypmif1' },
    { type: 'image', offset: 4, texte: 'ftypmsf1' },
    { type: 'image', offset: 0, octets: [0x49, 0x49, 0x2A, 0x00] },        // TIFF petit-boutiste
    { type: 'image', offset: 0, octets: [0x4D, 0x4D, 0x00, 0x2A] },        // TIFF gros-boutiste
    { type: 'audio', offset: 4, texte: 'ftyp' },                           // MP4/M4A/MOV → piste audio
    // OpenDocument : le ZIP commence toujours par l'entrée « mimetype » STOCKÉE
    // en clair, donc lisible sans dézipper (offset 30 = début du nom + contenu).
    { type: 'odt',   offset: 30, texte: 'mimetypeapplication/vnd.oasis.opendocument.text' },
    { type: 'odp',   offset: 30, texte: 'mimetypeapplication/vnd.oasis.opendocument.presentation' },
    { type: 'ods',   offset: 30, texte: 'mimetypeapplication/vnd.oasis.opendocument.spreadsheet' },
    { type: 'epub',  offset: 30, texte: 'mimetypeapplication/epub+zip' },
    // Conteneur OLE2, COMMUN au .xls, au .doc et au .ppt d'avant 2007 : la
    // signature ne dit pas lequel des trois. Le message de refus doit donc
    // rester générique — c'est ce qui le rend juste dans les trois cas.
    { type: 'office-ancien', offset: 0, octets: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] }
    // Volontairement ABSENT : la signature ZIP nue (PK\x03\x04). Un .docx, un .h5p
    // ou un .odt sans extension seraient alors pris pour des archives à déplier et
    // recevraient « aucun document exploitable » — moins clair que le refus de format.
];

/**
 * Reconnaît un format à partir des premiers octets du fichier.
 * Exporté pour les tests (aucun accès disque, entrée = Uint8Array).
 * @param {Uint8Array} octets - Début du fichier (au moins SNIFF_BYTES octets si possible)
 * @returns {string|null} Type interne ('pdf', 'image', 'audio', 'odt', 'odp') ou null
 */
export function sniffFileType(octets) {
    if (!octets || !octets.length) return null;
    for (const sig of SIGNATURES) {
        const motif = sig.octets || Array.from(sig.texte, c => c.charCodeAt(0));
        if (sig.offset + motif.length > octets.length) continue;
        if (motif.every((o, i) => octets[sig.offset + i] === o)) return sig.type;
    }
    return null;
}

/**
 * Détecte le type d'un fichier, en RETOMBANT sur sa signature binaire quand ni
 * le type MIME ni l'extension ne concluent.
 *
 * Indispensable au glisser-déposer : `File.type` est dérivé par le navigateur de
 * l'EXTENSION, jamais du contenu. Un PDF déposé sans extension (ou renommé, ou
 * fourni par une source qui n'annonce aucun type MIME) arrivait donc ici avec
 * `type: ''` et déclenchait un « Format non supporté » IMMÉDIAT, alors que le
 * même fichier choisi via le sélecteur de fichiers passait — car il porte
 * généralement son extension. Lire quatre octets tranche la question.
 *
 * @param {File|Blob} file
 * @returns {Promise<string|null>}
 */
export async function detectFileTypeAsync(file) {
    const parNom = detectFileType(file);
    if (parNom) return parNom;
    try {
        const debut = await file.slice(0, SNIFF_BYTES).arrayBuffer();
        return sniffFileType(new Uint8Array(debut));
    } catch (e) {
        // Dossier déposé, fichier supprimé entre-temps, volume distant déconnecté…
        debugLog('ocr', 'Lecture de la signature impossible :', e && e.message);
        return null;
    }
}

/**
 * Fichiers réellement présents dans un événement `drop`.
 *
 * `dataTransfer.files` NE SUFFIT PAS : il est vide quand le glisser vient d'un
 * lien web ou d'une application qui ne fournit qu'un « fichier promis », et
 * certaines sources ne renseignent que `dataTransfer.items`. On compte à part
 * les DOSSIERS, qu'on refuse avec un message explicite plutôt que de les
 * laisser filer vers l'extracteur sous l'étiquette « format non supporté ».
 *
 * Exporté pour les tests. À appeler SYNCHRONEMENT dans le gestionnaire de dépôt :
 * `items` n'est plus lisible une fois l'événement terminé.
 *
 * @param {DataTransfer|null} dataTransfer
 * @returns {{fichiers: File[], dossiers: number}}
 */
export function readDroppedFiles(dataTransfer) {
    const resultat = { fichiers: [], dossiers: 0 };
    if (!dataTransfer) return resultat;

    const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
    for (const item of items) {
        if (item.kind !== 'file') continue;
        // webkitGetAsEntry() est la SEULE façon de distinguer un dossier d'un
        // fichier (un dossier déposé arrive sinon comme un File de type vide).
        let entree = null;
        try {
            entree = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
        } catch (e) { /* source non explorable : traité comme un fichier */ }
        if (entree && entree.isDirectory) { resultat.dossiers++; continue; }
        const fichier = item.getAsFile();
        if (fichier) resultat.fichiers.push(fichier);
    }

    // Repli : navigateur sans DataTransferItemList exploitable.
    if (!resultat.fichiers.length && !resultat.dossiers && dataTransfer.files) {
        resultat.fichiers = Array.from(dataTransfer.files);
    }
    return resultat;
}

/**
 * Extrait le texte natif d'une page PDF via PDF.js
 */
async function extractTextFromPdfPage(page) {
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str);
    return strings.join(' ');
}

/**
 * Effectue l'OCR sur une page PDF (pour pages scannées)
 */
async function ocrPdfPage(page, pageNum, totalPages, updateStatus) {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = canvas.toDataURL('image/png');

    updateStatus(`${translations.ocr_recognizing_page || 'Reconnaissance (OCR) de la page'} ${pageNum}/${totalPages}...`);

    const { data: { text } } = await Tesseract.recognize(imageData, 'fra', getTesseractOptions(m => {
        if (m.status === 'recognizing text') {
            updateStatus(`${translations.ocr_recognizing_page || 'Reconnaissance (OCR) de la page'} ${pageNum}/${totalPages} (${(m.progress * 100).toFixed(0)}%)...`);
        }
    }));

    return text;
}

/**
 * Traite un fichier PDF - extraction intelligente (texte natif ou OCR selon le contenu)
 */
async function processPdf(file, updateStatus, checkCancel = () => {}) {
    const { pdfjsLib } = window;
    if (!pdfjsLib) {
        throw new Error("PDF.js n'est pas chargé.");
    }

    // Compat Safari/worker : lire le fichier en ArrayBuffer plutôt que de faire
    // re-fetcher une blob: URL par PDF.js (le fetch d'une blob: URL échoue dans
    // certains navigateurs/contexte worker ; évite aussi une blob URL jamais révoquée).
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = '';
    const TEXT_THRESHOLD = 50; // Minimum de caractères pour considérer une page comme "textuelle"

    for (let i = 1; i <= pdf.numPages; i++) {
        checkCancel();
        updateStatus(`${translations.pdf_processing_page || 'Traitement de la page'} ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);

        // Essayer d'abord l'extraction de texte natif
        const nativeText = await extractTextFromPdfPage(page);

        if (nativeText.trim().length >= TEXT_THRESHOLD) {
            // Page avec texte natif - extraction rapide
            fullText += nativeText + '\n\n';
        } else {
            // Page probablement scannée - utiliser OCR
            checkCancel();
            updateStatus(`${translations.ocr_scanned_page || 'Page scannée détectée, OCR en cours'} ${i}/${pdf.numPages}...`);
            const ocrText = await ocrPdfPage(page, i, pdf.numPages, updateStatus);
            fullText += ocrText + '\n\n';
        }
    }

    return fullText;
}

/**
 * Nettoyage défensif : ne garder que du texte. Utilisé par l'import de page web
 * (le webhook renvoie déjà du texte, ceci neutralise tout résidu), mais AUSSI
 * par les fichiers HTML déposés et par les chapitres d'un EPUB — même besoin,
 * même traitement. Défini au niveau MODULE pour cette raison.
 *
 * Les balises sont retirées AVANT le décodage des entités : décoder d'abord
 * ferait réapparaître un `&lt;script&gt;` sous forme de balise.
 */
function cleanImportedText(raw) {
    let s = String(raw || '');
    // Les blocs SCRIPT et STYLE doivent partir AVEC leur contenu : retirer les
    // seules balises laisserait la feuille de style et le code dans le corpus
    // (« p{color:red} » en tête de texte). Vaut aussi pour l'import de page web,
    // qui partage cette fonction.
    s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
         .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
         .replace(/<!--[\s\S]*?-->/g, ' ');
    s = s.replace(/<[^>]+>/g, ' ');
    // Décodage des entités via le DOM (textarea = pas d'exécution de script)
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    s = ta.value;
    s = s.replace(/[ \t\f\v ]+/g, ' ')
         .replace(/ *\n */g, '\n')
         .replace(/\n{3,}/g, '\n\n');
    return s.trim();
}

/**
 * Traite un fichier texte brut (.txt).
 *
 * Aucune bibliothèque : le fichier EST le texte. Seul l'ENCODAGE demande un
 * soin particulier — un .txt ne déclare pas le sien. On tente l'UTF-8 en mode
 * STRICT (`fatal: true`) : s'il échoue, c'est un fichier hérité (Windows /
 * anciens éditeurs) et on repasse en Windows-1252, qui couvre le français.
 * Sans le mode strict, `TextDecoder` remplacerait silencieusement chaque octet
 * invalide par « <?> » et « élève » sortirait en « �l�ve ».
 */
async function lireTexte(file) {
    const buffer = await file.arrayBuffer();
    let texte;
    try {
        texte = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        texte = new TextDecoder('windows-1252').decode(buffer);
    }
    // BOM éventuel (Bloc-notes en écrit un) + fins de ligne Windows/Mac classiques
    return texte.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

/** Texte brut : .txt, mais aussi .md, .csv et .tsv, qui sont déjà lisibles tels quels. */
async function processText(file, updateStatus) {
    updateStatus(translations.txt_processing || 'Lecture du fichier texte...');
    return lireTexte(file);
}

/**
 * Page HTML enregistrée depuis un navigateur, ou export d'ENT.
 * Le dépouillement des balises est celui de l'import de page web
 * (`cleanImportedText`) : même besoin, même traitement.
 */
async function processHtml(file, updateStatus) {
    updateStatus(translations.html_processing || 'Extraction du texte de la page...');
    return cleanImportedText(await lireTexte(file));
}

/**
 * Sous-titres .srt / .vtt : on ne garde que les répliques.
 *
 * Les horodatages (`00:01:02,500 --> 00:01:05,000`), les numéros de séquence et
 * l'en-tête WEBVTT n'apportent rien au corpus et noieraient le texte. Les
 * répliques consécutives identiques (répétées d'un bloc à l'autre par certains
 * générateurs automatiques) sont fusionnées.
 */
async function processSubtitles(file, updateStatus) {
    updateStatus(translations.subtitles_processing || 'Extraction des sous-titres...');

    const lignes = (await lireTexte(file)).split('\n');
    const repliques = [];
    for (const brute of lignes) {
        const ligne = brute.trim();
        if (!ligne) continue;
        if (/^WEBVTT/i.test(ligne) || /^(NOTE|STYLE|REGION)\b/.test(ligne)) continue;
        if (/^\d+$/.test(ligne)) continue;                       // numéro de séquence
        if (/-->/.test(ligne)) continue;                         // horodatage
        // Balises de position/couleur autorisées par le format VTT
        const texte = ligne.replace(/<[^>]+>/g, '').trim();
        if (!texte) continue;
        if (repliques[repliques.length - 1] === texte) continue; // doublon de bloc
        repliques.push(texte);
    }
    return repliques.join('\n');
}

/**
 * RTF : extraction du texte, sans bibliothèque.
 *
 * Un RTF est un arbre de groupes `{}` mêlant texte et commandes `\mot`. Deux
 * précautions indispensables :
 *  - les groupes de DESTINATION (`\fonttbl`, `\stylesheet`, `\colortbl`, `\info`,
 *    et tout groupe `{\*\…}`) contiennent des définitions, PAS du texte : les
 *    laisser passer remplirait le corpus de noms de polices. On les saute avec
 *    un suivi de PROFONDEUR d'accolades, une expression régulière ne sachant pas
 *    apparier des accolades imbriquées ;
 *  - les caractères accentués sont encodés `\'e9` (octet ANSI) ou `\u233?`
 *    (point de code), jamais en clair.
 */
function rtfEnTexte(rtf) {
    const DESTINATIONS = /^(fonttbl|colortbl|stylesheet|info|pict|object|themedata|colorschememapping|latentstyles|datastore|generator|listtable|listoverridetable|rsidtbl|xmlnstbl)$/;
    let sortie = '';
    let i = 0;
    let profondeurIgnoree = -1;   // profondeur à laquelle un groupe ignoré a commencé
    let profondeur = 0;
    // `\uN` est TOUJOURS suivi de N caractères de repli destinés aux lecteurs qui
    // ne comprennent pas l'Unicode (« \u232?cle »). Leur nombre est donné par
    // `\ucN`, et vaut 1 par défaut. Ne pas les sauter laisse un « ? » en plein mot.
    let replis = 1;

    while (i < rtf.length) {
        const c = rtf[i];

        if (c === '{') { profondeur++; i++; continue; }
        if (c === '}') {
            if (profondeurIgnoree >= 0 && profondeur === profondeurIgnoree) profondeurIgnoree = -1;
            profondeur--; i++; continue;
        }

        if (c === '\\') {
            // Caractère ANSI échappé : \'e9
            const ansi = /^\\'([0-9a-fA-F]{2})/.exec(rtf.slice(i, i + 4));
            if (ansi) {
                if (profondeurIgnoree < 0) sortie += String.fromCharCode(parseInt(ansi[1], 16));
                i += 4; continue;
            }
            // Échappements littéraux : \\ \{ \}
            if ('\\{}'.includes(rtf[i + 1])) {
                if (profondeurIgnoree < 0) sortie += rtf[i + 1];
                i += 2; continue;
            }
            // Commande : \mot[-]<nombre>[espace]
            const cmd = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i));
            if (cmd) {
                const mot = cmd[1];
                if (mot === 'uc' && cmd[2] !== undefined) {
                    replis = Math.max(0, parseInt(cmd[2], 10));
                } else if (mot === 'u' && cmd[2] !== undefined) {
                    if (profondeurIgnoree < 0) sortie += String.fromCharCode((parseInt(cmd[2], 10) + 65536) % 65536);
                    i += cmd[0].length + replis;   // le point de code ET ses caractères de repli
                    continue;
                } else if (mot === 'par' || mot === 'line' || mot === 'pard' || mot === 'sect') {
                    if (profondeurIgnoree < 0) sortie += '\n';
                } else if (mot === 'tab') {
                    if (profondeurIgnoree < 0) sortie += '\t';
                } else if (DESTINATIONS.test(mot) && profondeurIgnoree < 0) {
                    profondeurIgnoree = profondeur;
                }
                i += cmd[0].length; continue;
            }
            // Groupe ignorable : {\*\…}
            if (rtf[i + 1] === '*') { if (profondeurIgnoree < 0) profondeurIgnoree = profondeur; i += 2; continue; }
            i++; continue;
        }

        if (profondeurIgnoree < 0) sortie += c;
        i++;
    }

    return sortie.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function processRtf(file, updateStatus) {
    updateStatus(translations.rtf_processing || 'Extraction du texte RTF...');
    return rtfEnTexte(await lireTexte(file));
}

/**
 * EPUB : ZIP de fichiers XHTML.
 *
 * L'ORDRE de lecture ne se devine pas des noms de fichiers : il est donné par
 * la « spine » du fichier OPF, lui-même désigné par `META-INF/container.xml`.
 * On suit ce chemin, avec un repli alphabétique si le livre est mal formé.
 */
async function processEpub(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.epub_processing || 'Extraction du livre numérique...');

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parser = new DOMParser();
    const lireXml = async (chemin) => {
        const entree = zip.file(chemin);
        return entree ? parser.parseFromString(await entree.async('text'), 'application/xml') : null;
    };

    let chapitres = [];
    const container = await lireXml('META-INF/container.xml');
    const cheminOpf = container
        ? (parNomLocal(container, 'rootfile')[0] || {}).getAttribute?.('full-path')
        : null;

    if (cheminOpf) {
        const opf = await lireXml(cheminOpf);
        if (opf) {
            const base = cheminOpf.includes('/') ? cheminOpf.slice(0, cheminOpf.lastIndexOf('/') + 1) : '';
            const parId = {};
            parNomLocal(opf, 'item').forEach(item => { parId[item.getAttribute('id')] = item.getAttribute('href'); });
            chapitres = parNomLocal(opf, 'itemref')
                .map(ref => parId[ref.getAttribute('idref')])
                .filter(Boolean)
                .map(href => base + href.replace(/^\.\//, ''));
        }
    }
    if (chapitres.length === 0) {
        chapitres = zip.file(/\.x?html?$/i).map(entree => entree.name).sort();
    }

    const morceaux = [];
    for (const chemin of chapitres) {
        const entree = zip.file(chemin) || zip.file(decodeURIComponent(chemin));
        if (!entree) continue;
        const texte = cleanImportedText(await entree.async('text'));
        if (texte) morceaux.push(texte);
    }
    return morceaux.join('\n\n');
}

/**
 * Éléments d'un document XML portant ce nom LOCAL (indépendamment du préfixe de
 * namespace). Les formats bureautiques en abusent (`table:table-cell`, `r:id`…)
 * et `querySelectorAll` y est piégeux : on filtre sur `localName`, comme le fait
 * déjà `processOdt()`.
 */
function parNomLocal(racine, nomLocal) {
    return Array.from(racine.getElementsByTagName('*')).filter(el => el.localName === nomLocal);
}

/** Assemble des lignes de cellules en texte, sans lignes ni colonnes vides en fin. */
function tableauEnTexte(lignes) {
    return lignes
        .map(cellules => {
            const copie = cellules.slice();
            while (copie.length && !copie[copie.length - 1]) copie.pop();
            return copie.join(' | ');
        })
        .filter(ligne => ligne.trim() !== '')
        .join('\n');
}

/**
 * Traite un classeur XLSX via JSZip.
 *
 * Un .xlsx est un ZIP de XML. Deux particularités du format :
 *  - une cellule TEXTE ne contient pas son texte mais un INDICE vers la table
 *    commune `xl/sharedStrings.xml` (`<c t="s"><v>12</v></c>`) ;
 *  - l'ordre et les noms des feuilles vivent dans `xl/workbook.xml`, qui ne
 *    désigne les fichiers que par un `r:id` traduit par `workbook.xml.rels` —
 *    l'ordre des `sheetN.xml` dans l'archive ne fait PAS foi.
 *
 * Les DATES sortent en nombre brut (numéro de série Excel) : les convertir
 * demanderait la table des formats de nombres, hors de propos pour un corpus.
 */
async function processXlsx(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.xlsx_processing || 'Extraction du tableur...');

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parser = new DOMParser();
    const lire = async (chemin) => {
        const entree = zip.file(chemin);
        return entree ? parser.parseFromString(await entree.async('text'), 'application/xml') : null;
    };

    // Table des chaînes partagées
    const chaines = [];
    const docChaines = await lire('xl/sharedStrings.xml');
    if (docChaines) {
        parNomLocal(docChaines, 'si').forEach(si => {
            // Un <si> peut être découpé en plusieurs <t> (texte enrichi) : on recolle.
            chaines.push(parNomLocal(si, 't').map(t => t.textContent).join(''));
        });
    }

    // Feuilles : nom + chemin réel, via les relations
    const relations = {};
    const docRels = await lire('xl/_rels/workbook.xml.rels');
    if (docRels) {
        parNomLocal(docRels, 'Relationship').forEach(rel => {
            relations[rel.getAttribute('Id')] = rel.getAttribute('Target');
        });
    }
    const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const feuilles = [];
    const docClasseur = await lire('xl/workbook.xml');
    if (docClasseur) {
        parNomLocal(docClasseur, 'sheet').forEach(feuille => {
            const rid = feuille.getAttributeNS(NS_REL, 'id') || feuille.getAttribute('r:id');
            const cible = relations[rid];
            if (cible) {
                feuilles.push({ nom: feuille.getAttribute('name') || '', chemin: 'xl/' + cible.replace(/^\/?xl\//, '') });
            }
        });
    }
    // Repli : classeur sans relations exploitables → ordre des fichiers de l'archive.
    if (feuilles.length === 0) {
        zip.file(/^xl\/worksheets\/sheet\d+\.xml$/).forEach(entree => feuilles.push({ nom: '', chemin: entree.name }));
    }

    /** Valeur affichable d'une cellule <c>. */
    const valeur = (cellule) => {
        const type = cellule.getAttribute('t');
        if (type === 'inlineStr') return parNomLocal(cellule, 't').map(t => t.textContent).join('');
        const v = parNomLocal(cellule, 'v')[0];
        if (!v) return '';
        if (type === 's') {
            const indice = parseInt(v.textContent, 10);
            return chaines[indice] !== undefined ? chaines[indice] : '';
        }
        return v.textContent;
    };

    const morceaux = [];
    for (const feuille of feuilles) {
        const doc = await lire(feuille.chemin);
        if (!doc) continue;
        const lignes = parNomLocal(doc, 'row').map(ligne => parNomLocal(ligne, 'c').map(valeur));
        const texte = tableauEnTexte(lignes);
        if (!texte) continue;
        morceaux.push(feuilles.length > 1 && feuille.nom ? `=== ${feuille.nom} ===\n${texte}` : texte);
    }

    return morceaux.join('\n\n');
}

/**
 * Traite un classeur ODS via JSZip (même `content.xml` que l'ODT, mais en tables).
 *
 * Piège du format : ODF compresse les cellules identiques avec
 * `table:number-columns-repeated`, et remplit la fin de chaque ligne avec des
 * cellules VIDES répétées jusqu'à un millier de fois. On ne déplie donc une
 * répétition QUE si la cellule a un contenu, et on la borne.
 */
async function processOds(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.ods_processing || 'Extraction du tableur...');

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const contenu = zip.file('content.xml');
    if (!contenu) return '';
    const doc = new DOMParser().parseFromString(await contenu.async('text'), 'application/xml');

    const MAX_REPETITION = 50;
    const tables = parNomLocal(doc, 'table');
    const morceaux = [];

    tables.forEach(table => {
        const lignes = parNomLocal(table, 'table-row').map(ligne => {
            const cellules = [];
            Array.from(ligne.children)
                .filter(c => c.localName === 'table-cell' || c.localName === 'covered-table-cell')
                .forEach(cellule => {
                    const texte = parNomLocal(cellule, 'p').map(p => p.textContent.trim()).filter(Boolean).join(' ');
                    const repetition = parseInt(cellule.getAttribute('table:number-columns-repeated') || '1', 10) || 1;
                    const nb = texte ? Math.min(repetition, MAX_REPETITION) : 1;
                    for (let i = 0; i < nb; i++) cellules.push(texte);
                });
            return cellules;
        });
        const texte = tableauEnTexte(lignes);
        if (!texte) return;
        const nom = table.getAttribute('table:name') || '';
        morceaux.push(tables.length > 1 && nom ? `=== ${nom} ===\n${texte}` : texte);
    });

    return morceaux.join('\n\n');
}

/**
 * Déplie une archive ZIP en fichiers exploitables, SANS les traiter : chacun
 * rejoint ensuite la file d'attente comme s'il avait été déposé lui-même.
 *
 * Trois refus délibérés :
 *  - les archives IMBRIQUÉES ne sont pas dépliées (une archive qui se contient
 *    elle-même suffit à faire exploser la mémoire) ;
 *  - les entrées dont l'extension n'est pas reconnue sont ignorées SANS être
 *    décompressées — c'est ce qui rend le plafond de taille efficace ;
 *  - `__MACOSX/` et les fichiers cachés, que macOS glisse dans toute archive.
 *
 * @returns {Promise<{fichiers: File[], tronquee: boolean}>}
 */
async function extraireArchive(file, updateStatus, checkCancel = () => {}) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.zip_processing || "Ouverture de l'archive...");

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entrees = Object.values(zip.files)
        .filter(entree => !entree.dir)
        .filter(entree => !/(^|\/)__MACOSX\//.test(entree.name) && !/(^|\/)\./.test(entree.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    const fichiers = [];
    let octets = 0;
    let tronquee = false;

    for (const entree of entrees) {
        checkCancel();
        if (fichiers.length >= MAX_ZIP_FILES) { tronquee = true; break; }

        const nomCourt = entree.name.split('/').pop();
        // detectFileType n'a besoin que de .name et .type : pas la peine de
        // décompresser pour savoir si l'entrée nous intéresse.
        const typeInterne = detectFileType({ name: nomCourt, type: '' });
        if (!typeInterne || typeInterne === 'zip' || typeInterne === 'office-ancien' || typeInterne === 'iwork') continue;

        const blob = await entree.async('blob');
        octets += blob.size;
        if (octets > MAX_ZIP_BYTES) { tronquee = true; break; }

        // Le nom garde la trace de l'archive d'origine : l'étiquette du corpus
        // reste lisible quand plusieurs archives sont déposées.
        fichiers.push(new File([blob], `${file.name} › ${nomCourt}`, { type: blob.type || '' }));
    }

    return { fichiers, tronquee };
}

/**
 * Traite un fichier DOCX via mammoth.js
 */
async function processDocx(file, updateStatus) {
    if (!window.mammoth) {
        throw new Error("mammoth.js n'est pas chargé.");
    }

    updateStatus(translations.docx_processing || 'Extraction du texte DOCX...');

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return result.value;
}

/**
 * Traite un fichier ODT via JSZip (parsing du content.xml)
 */
async function processOdt(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.odt_processing || 'Extraction du texte ODT...');

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const contentXml = await zip.file('content.xml').async('text');

    // Parser le XML et extraire le texte
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contentXml, 'application/xml');

    // Extraire tout le texte des éléments text:p et text:h
    const textElements = xmlDoc.querySelectorAll('*');
    let fullText = '';

    textElements.forEach(el => {
        if (el.localName === 'p' || el.localName === 'h') {
            const text = el.textContent.trim();
            if (text) {
                fullText += text + '\n';
            }
        }
    });

    return fullText;
}

/**
 * Traite un fichier ODP via JSZip (parsing du content.xml)
 */
async function processOdp(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.odp_processing || 'Extraction du texte ODP...');

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const contentXml = await zip.file('content.xml').async('text');

    // Parser le XML et extraire le texte
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contentXml, 'application/xml');

    // Extraire tout le texte des éléments text:p et text:h (même structure qu'ODT)
    const textElements = xmlDoc.querySelectorAll('*');
    let fullText = '';

    textElements.forEach(el => {
        if (el.localName === 'p' || el.localName === 'h') {
            const text = el.textContent.trim();
            if (text) {
                fullText += text + '\n';
            }
        }
    });

    return fullText;
}

/**
 * Traite un fichier PPTX via JSZip (parsing des slides XML)
 */
async function processPptx(file, updateStatus) {
    if (!window.JSZip) {
        throw new Error("JSZip n'est pas chargé.");
    }

    updateStatus(translations.pptx_processing || 'Extraction du texte PPTX...');

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Récupérer tous les fichiers slide*.xml dans ppt/slides/
    const slideFiles = [];
    zip.folder('ppt/slides').forEach((relativePath, file) => {
        if (relativePath.match(/^slide\d+\.xml$/)) {
            slideFiles.push({ name: relativePath, file });
        }
    });

    // Trier les slides par numéro
    slideFiles.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)[0]);
        const numB = parseInt(b.name.match(/\d+/)[0]);
        return numA - numB;
    });

    let fullText = '';

    // Traiter chaque slide
    for (const slideFile of slideFiles) {
        const slideXml = await slideFile.file.async('text');

        // Parser le XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(slideXml, 'application/xml');

        // Extraire tous les éléments de texte <a:t> (DrawingML text)
        const textElements = xmlDoc.getElementsByTagName('a:t');

        for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent.trim();
            if (text) {
                fullText += text + '\n';
            }
        }

        fullText += '\n'; // Séparation entre slides
    }

    return fullText;
}

/**
 * Analyse une image via le modèle vision (description globale + transcription fidèle
 * du texte), pour enrichir le corpus au-delà du simple OCR : un schéma, un diagramme
 * ou une photo sans texte deviennent exploitables. Toute erreur est captée par
 * processImage(), qui retombe sur Tesseract.
 * @param {File} file
 * @param {function} updateStatus
 * @param {function} checkCancel - lève une AbortError si l'utilisateur arrête
 * @returns {Promise<string>} Texte prêt pour le corpus (description + texte transcrit)
 */
async function analyzeImageWithVision(file, updateStatus, checkCancel) {
    updateStatus(translations.ocr_preparing || 'Préparation de l\'analyse...');

    // Même prétraitement que le fond d'« Image interactive » (1920 px max, formats
    // larges dont HEIC/TIFF) : borne le poids envoyé au webhook vision.
    const [{ processBackgroundImage }, { analyzeImage }] = await Promise.all([
        import('../h5p/image-manager.js'),
        import('./image-analysis.js')
    ]);
    const entry = await processBackgroundImage(file);
    checkCancel();

    updateStatus(translations.ocr_vision_analyzing || 'Analyse de l\'image par l\'IA...');

    // Le bouton « Arrêter » est un drapeau sondé (pas un AbortSignal) : on le
    // convertit en abort réseau pour ne pas laisser filer un appel de 2 minutes.
    const ac = new AbortController();
    const poll = setInterval(() => {
        try { checkCancel(); } catch (e) { ac.abort(); }
    }, 400);
    let result;
    try {
        result = await analyzeImage(entry.dataURL, { lang: currentLang, signal: ac.signal });
    } finally {
        clearInterval(poll);
    }
    checkCancel();

    const parts = [];
    if (result.description) {
        parts.push(`[${translations.ocr_vision_description_label || 'Description de l\'image (IA)'}]\n${result.description}`);
    }
    if (result.text) {
        parts.push(`[${translations.ocr_vision_text_label || 'Texte contenu dans l\'image'}]\n${result.text}`);
    }
    return parts.join('\n\n');
}

/**
 * Rastérise une image en PNG (dataURL) via canvas. Repli Tesseract pour les formats
 * que son décodeur interne (leptonica) ne lit pas de façon fiable (WebP, certaines
 * variantes BMP — RLE, 32 bits) : le canvas du navigateur, lui, les décode partout.
 * @param {File} file
 * @returns {Promise<string>} dataURL PNG
 */
function rasterizeToPngDataUrl(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('FORMAT_INVALID'));
        };
        img.src = url;
    });
}

/**
 * Traite une image (PNG/JPEG/WebP/BMP) : analyse vision d'abord (description +
 * transcription), repli sur l'OCR Tesseract si l'IA est indisponible ou répond mal.
 */
async function processImage(file, updateStatus, checkCancel = () => {}) {
    // HEIC/HEIF (format PAR DÉFAUT des photos d'iPhone) et TIFF ne sont décodables
    // ni par le canvas ni par Tesseract : sans cette conversion préalable, l'analyse
    // vision ET l'OCR échouent tous les deux. La conversion est celle du flux
    // « Image interactive » (heic2any / UTIF, chargées à la demande) : une seule
    // implémentation pour les deux flux.
    const estAConvertir = /^image\/(heic|heif|tiff)$/i.test(file.type || '')
        || /\.(heic|heif|tiff?)$/i.test(file.name || '');
    if (estAConvertir) {
        updateStatus(translations.image_converting || 'Conversion de l\'image...');
        try {
            const { ensureCanvasDecodable } = await import('../h5p/image-manager.js');
            const { blob, mime } = await ensureCanvasDecodable(file);
            file = new File([blob], file.name.replace(/\.[^.]+$/, mime === 'image/jpeg' ? '.jpg' : '.png'), { type: mime });
        } catch (e) {
            debugLog('ocr', 'Conversion HEIC/TIFF échouée', e);
            throw new Error('IMAGE_CONVERSION_FAILED');
        }
        checkCancel();
    }

    try {
        const visionText = await analyzeImageWithVision(file, updateStatus, checkCancel);
        if (visionText) return visionText;
    } catch (error) {
        if (error.name === 'AbortError') throw error; // annulation utilisateur : on s'arrête vraiment
        debugLog('ocr', 'Analyse vision indisponible → repli OCR Tesseract', error);
        showNotification(
            translations.ocr_vision_fallback || 'Analyse IA de l\'image indisponible — reconnaissance de caractères (OCR) classique utilisée.',
            'info'
        );
    }
    checkCancel();

    updateStatus(translations.ocr_image_processing || 'Reconnaissance (OCR) de l\'image...');

    // WebP/BMP → PNG avant Tesseract (décodeur interne peu fiable sur ces formats).
    const needsPng = /^image\/(webp|bmp|x-ms-bmp)$/.test(file.type || '') || /\.(webp|bmp)$/i.test(file.name || '');
    const imageUrl = needsPng ? await rasterizeToPngDataUrl(file) : URL.createObjectURL(file);

    const { data: { text } } = await Tesseract.recognize(imageUrl, 'fra', getTesseractOptions(m => {
        if (m.status === 'recognizing text') {
            updateStatus(`${translations.ocr_image_processing || 'Reconnaissance (OCR) de l\'image'} (${(m.progress * 100).toFixed(0)}%)...`);
        } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
            updateStatus(translations.ocr_initializing || 'Initialisation de l\'OCR...');
        } else if (m.status === 'loading language traineddata') {
            updateStatus(translations.ocr_loading_language || 'Chargement du modèle de langue...');
        } else if (m.status === 'initializing api') {
            updateStatus(translations.ocr_preparing || 'Préparation de l\'analyse...');
        }
    }));

    if (!needsPng) URL.revokeObjectURL(imageUrl); // dataURL PNG (webp/bmp) : rien à révoquer
    return text;
}

/**
 * Encode un Float32Array PCM mono en WAV 16-bit (little-endian).
 * @param {Float32Array} samples - Échantillons PCM normalisés [-1, 1]
 * @param {number} sampleRate - Fréquence d'échantillonnage (Hz)
 * @returns {Blob} Blob audio/wav
 */
function encodeWavMono16(samples, sampleRate) {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);            // taille du bloc fmt
    view.setUint16(20, 1, true);             // PCM
    view.setUint16(22, 1, true);             // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (mono 16-bit)
    view.setUint16(32, 2, true);             // block align
    view.setUint16(34, 16, true);            // bits par échantillon
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Transcrit un fichier audio via le webhook Whisper/Albert (le même que le micro
 * Caramelia). Le découpage est PRÉPARÉ EN AMONT côté navigateur : on décode tout
 * le fichier (Web Audio API), on le rééchantillonne en 16 kHz mono, puis on le
 * tranche en lots de 5 min envoyés séquentiellement. Chaque lot fait avancer la
 * barre d'état (pourcentage réel = lot courant / total). Plafond : 90 min.
 * @param {File} file
 * @param {function} updateStatus
 * @param {function} checkCancel - lève une AbortError si l'utilisateur arrête
 * @returns {Promise<string>} Texte transcrit complet
 */
async function processAudio(file, updateStatus, checkCancel = () => {}) {
    const endpoint = CONFIG && CONFIG.audioWebhookUrl;
    if (!endpoint) throw new Error('AUDIO_NO_ENDPOINT');

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('AUDIO_DECODE_FAILED');

    // 1. Décodage complet du fichier (decodeAudioData ne fait pas de streaming :
    //    le buffer natif est le pic mémoire ; on rééchantillonne aussitôt en 16 kHz).
    updateStatus(translations.audio_decoding || 'Décodage de l\'audio…');
    const arrayBuffer = await file.arrayBuffer();
    checkCancel();

    const decodeCtx = new AudioCtx();
    let decoded;
    try {
        decoded = await decodeCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
        decodeCtx.close().catch(() => {});
        throw new Error('AUDIO_DECODE_FAILED');
    }

    const duration = decoded.duration;
    if (duration > MAX_AUDIO_SECONDS) {
        decodeCtx.close().catch(() => {});
        throw new Error('AUDIO_TOO_LONG');
    }
    checkCancel();

    // 2. Rééchantillonnage mono 16 kHz via OfflineAudioContext (downmix + downsample).
    updateStatus(translations.audio_preparing || 'Préparation de l\'audio…');
    const frameCount = Math.ceil(duration * AUDIO_TARGET_RATE);
    const offline = new OfflineAudioContext(1, frameCount, AUDIO_TARGET_RATE);
    const srcNode = offline.createBufferSource();
    srcNode.buffer = decoded;
    srcNode.connect(offline.destination);
    srcNode.start(0);
    const rendered = await offline.startRendering();
    decodeCtx.close().catch(() => {});
    const pcm = rendered.getChannelData(0);
    checkCancel();

    // 3. Découpage en lots de 5 min, envoyés un par un (pourcentage réel).
    const chunkFrames = AUDIO_CHUNK_SECONDS * AUDIO_TARGET_RATE;
    const totalChunks = Math.max(1, Math.ceil(pcm.length / chunkFrames));
    const lang = String(currentLang || 'fr').toLowerCase();
    const transcribingLabel = translations.audio_transcribing || 'Transcription de l\'audio';

    let fullText = '';
    for (let i = 0; i < totalChunks; i++) {
        checkCancel();
        const pct = Math.round((i / totalChunks) * 100);
        updateStatus(`${transcribingLabel} ${i + 1}/${totalChunks} (${pct}%)…`);

        const slice = pcm.subarray(i * chunkFrames, Math.min((i + 1) * chunkFrames, pcm.length));
        const wavBlob = encodeWavMono16(slice, AUDIO_TARGET_RATE);

        const fd = new FormData();
        fd.append('file', wavBlob, `audio_part_${i + 1}.wav`);
        fd.append('language', lang);

        const res = await fetch(endpoint, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        const text = String((data && (data.text || data.transcript)) || '').trim();
        if (text) fullText += (fullText ? '\n' : '') + text;
    }
    updateStatus(`${transcribingLabel} ${totalChunks}/${totalChunks} (100%)…`);

    return fullText;
}

// Exposé pour les tests unitaires (détection de type sans navigateur).
export { detectFileType, isVideoFile, SUPPORTED_TYPES, EXTENSION_MAP, SUPPORTED_FORMATS_LABEL };

/**
 * Initialise les écouteurs d'événements et la logique pour l'extraction de texte.
 */
export function initOcr() {
    const pdfUpload = document.getElementById('pdfUpload');
    const ocrOutput = document.getElementById('ocr-output');
    const ocrStatus = document.getElementById('ocr-status');
    const ocrFullscreenBtn = document.getElementById('ocr-fullscreen-btn');
    const ocrLockBtn = document.getElementById('ocr-lock-btn');
    const ocrCopyBtn = document.getElementById('ocr-copy-btn');
    const dragDropArea = document.querySelector('.drag-drop-area');
    const charCounter = document.getElementById('char-counter');
    const pdfTagsContainer = document.getElementById('pdf-tags-container');

    let uploadedFiles = [];
    const MAX_CHARS = 120000;
    const FILE_COLORS = [
        '#E6E6FA', '#F0F8FF', '#F5FFFA', '#FFF5EE', '#FAFAD2',
        '#FFE4E1', '#FFF0F5', '#F0FFF0', '#F8F8FF', '#FFFAF0'
    ];

    // Formate un nombre avec des espaces insécables (format européen)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    }

    function updateCharCounter() {
        const currentLength = ocrOutput.innerText.length;
        charCounter.textContent = `${formatNumber(currentLength)} / ${formatNumber(MAX_CHARS)}`;
        charCounter.classList.remove('warning', 'error');
        if (currentLength > MAX_CHARS) {
            charCounter.classList.add('error');
        } else if (currentLength > MAX_CHARS * 0.9) {
            charCounter.classList.add('warning');
        }
        toggleSectionsVisibility();
    }

    // --- Annulation du traitement en cours ---
    let _cancelRequested = false;
    let _cancelBtn = null;

    /** Vérifie si l'annulation a été demandée et lance une erreur le cas échéant */
    function checkCancel() {
        if (_cancelRequested) throw new DOMException('Traitement annulé', 'AbortError');
    }

    function showCancelButton() {
        _cancelRequested = false;
        if (!_cancelBtn) {
            _cancelBtn = document.createElement('button');
            _cancelBtn.className = 'ocr-cancel-btn';
            _cancelBtn.type = 'button';
            _cancelBtn.innerHTML = `<i class="fas fa-times"></i> <span>${translations.ocr_cancel || 'Arrêter'}</span>`;
            // Annule le fichier en cours ET le reste de la file : « Arrêter »
            // doit vouloir dire arrêter, pas « passer au fichier suivant ».
            _cancelBtn.addEventListener('click', () => {
                _cancelRequested = true;
                fileAnnulee = true;
            });
        }
        _cancelBtn.querySelector('span').textContent = translations.ocr_cancel || 'Arrêter';
        ocrStatus.after(_cancelBtn);
        _cancelBtn.style.display = 'inline-flex';
    }

    function hideCancelButton() {
        if (_cancelBtn) _cancelBtn.style.display = 'none';
        _cancelRequested = false;
    }

    function updateStatus(message) {
        ocrStatus.textContent = prefixeFile ? `${prefixeFile} ${message}` : message;
        ocrStatus.style.display = 'block';
        // Active l'overlay centré (anti-FOUC : le statut ne pousse pas le flux).
        ocrStatus.parentElement.classList.add('is-busy');
    }

    function hideStatus() {
        ocrStatus.style.display = 'none';
        ocrStatus.parentElement.classList.remove('is-busy');
        hideCancelButton();
    }

    function updateRagArea() {
        pdfTagsContainer.innerHTML = '';
        let combinedHtml = '';

        uploadedFiles.forEach((file, index) => {
            const tag = document.createElement('div');
            tag.className = 'pdf-tag';
            tag.style.backgroundColor = file.color;
            // Échapper le nom du fichier (fourni par l'utilisateur) avant injection HTML
            const sanitizedName = escapeHtmlTags(file.name);
            tag.innerHTML = `
                <input type="color" class="color-picker" value="${file.color}" data-index="${index}">
                <span class="filename" title="${sanitizedName}">${sanitizedName}</span>
                <button class="remove-tag-btn" data-index="${index}" title="Supprimer">&times;</button>
            `;
            pdfTagsContainer.appendChild(tag);

            const sanitizedContent = escapeHtmlTags(file.content);
            combinedHtml += `<mark style="background-color:${file.color};">${sanitizedContent.replace(/\n/g, '<br>')}</mark><br><br>`;
        });

        ocrOutput.innerHTML = combinedHtml;
        updateCharCounter();

        pdfTagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.currentTarget.dataset.index, 10);
                uploadedFiles.splice(indexToRemove, 1);
                updateRagArea();
            });
        });

        pdfTagsContainer.querySelectorAll('.color-picker').forEach(picker => {
            picker.addEventListener('input', (e) => {
                const indexToUpdate = parseInt(e.currentTarget.dataset.index, 10);
                const newColor = e.currentTarget.value;
                uploadedFiles[indexToUpdate].color = newColor;
                updateRagArea();
            });
        });

        toggleSectionsVisibility();
    }

    // ── File d'attente des fichiers ──────────────────────────────────────────
    // Glisser-déposer ET « Parcourir » acceptent PLUSIEURS fichiers d'un coup.
    // Ils sont traités UN PAR UN : l'extraction est lourde (OCR page à page,
    // transcription audio par lots) et deux traitements simultanés se disputent
    // le processeur, la mémoire et le webhook. Un nouvel apport pendant un
    // traitement s'ajoute à la file au lieu de le doubler.
    let fileAttente = [];
    let fileEnCours = false;
    let fileTraites = 0;      // nombre de fichiers déjà sortis de la file
    let prefixeFile = '';     // « Fichier 2/3 — », préfixé aux messages d'état
    let fileAnnulee = false;  // « Arrêter » a été cliqué : vider la file

    /**
     * Ajoute des fichiers à la file et lance le traitement s'il ne tourne pas.
     * @param {File[]} fichiers
     * @returns {Promise<void>} résolue quand la file est vide
     */
    async function enfilerFichiers(fichiers) {
        fileAttente.push(...fichiers);
        if (fileEnCours) return;

        fileEnCours = true;
        fileAnnulee = false;
        try {
            while (fileAttente.length > 0) {
                if (fileAnnulee) { fileAttente = []; break; }
                const fichier = fileAttente.shift();
                fileTraites++;
                // Total RECALCULÉ à chaque tour : la file peut s'allonger en cours
                // de route (nouveau dépôt pendant un traitement).
                const total = fileTraites + fileAttente.length;
                prefixeFile = total > 1
                    ? (translations.ocr_queue_progress || 'Fichier {current}/{total} —')
                        .replace('{current}', String(fileTraites))
                        .replace('{total}', String(total))
                    : '';
                await handleFile(fichier);
            }
        } finally {
            fileEnCours = false;
            fileTraites = 0;
            prefixeFile = '';
        }
    }

    const handleFile = async (file) => {
        const fileType = await detectFileTypeAsync(file);

        if (!fileType) {
            showNotification(
                (translations.error_unsupported_format || 'Format non supporté. Formats acceptés : ') + SUPPORTED_FORMATS_LABEL,
                'error'
            );
            return;
        }

        // Formats reconnus mais délibérément NON lus (cf. SUPPORTED_TYPES) : un
        // message qui dit QUOI FAIRE vaut mieux qu'un « format non supporté ».
        // La signature OLE2 étant COMMUNE au .doc, au .xls et au .ppt, ce message
        // doit rester générique : elle ne dit pas lequel des trois on tient.
        if (fileType === 'office-ancien') {
            showNotification(
                translations.office_legacy_unsupported
                    || 'Ce format Office d\'avant 2007 (.doc, .xls, .ppt) n\'est pas lu ici. Réenregistrez le fichier en .docx, .xlsx ou .ods.',
                'error'
            );
            return;
        }
        if (fileType === 'iwork') {
            showNotification(
                translations.iwork_unsupported
                    || 'Les fichiers Pages, Numbers et Keynote ne sont pas lus ici. Exportez-les en PDF, Word ou Excel.',
                'error'
            );
            return;
        }

        // Vérifier les doublons
        if (uploadedFiles.some(f => f.name === file.name)) {
            showNotification(translations.error_duplicate_file || 'Ce fichier a déjà été ajouté.', 'warning');
            return;
        }

        // Vidéo : prévenir qu'on n'extrait que la piste audio (pas l'image).
        if (isVideoFile(file)) {
            showNotification(
                translations.video_audio_only || 'Vidéo détectée : seule la piste audio sera transcrite.',
                'info'
            );
        }

        updateStatus(translations.file_loading || 'Chargement du fichier...');
        showCancelButton();

        try {
            // Charger les bibliothèques OCR nécessaires. Le texte brut n'en a
            // AUCUNE : inutile de télécharger PDF.js et Tesseract (~5 Mo) pour
            // lire un .txt.
            if (fileType !== 'text') {
                await loadOcrLibs();
            }
            checkCancel();

            // Une archive ne produit pas de texte : elle produit des FICHIERS,
            // qui repartent dans la file d'attente (compteur d'avancement et
            // bouton « Arrêter » compris). Elle n'apparaît pas dans le corpus.
            if (fileType === 'zip') {
                const { fichiers, tronquee } = await extraireArchive(file, updateStatus, checkCancel);
                checkCancel();
                hideStatus();
                if (fichiers.length === 0) {
                    showNotification(
                        translations.zip_empty || 'Aucun document exploitable dans cette archive.',
                        'warning'
                    );
                    return;
                }
                if (tronquee) {
                    showNotification(
                        (translations.zip_truncated || 'Archive volumineuse : seuls les {n} premiers documents ont été ajoutés.')
                            .replace('{n}', String(fichiers.length)),
                        'warning'
                    );
                }
                enfilerFichiers(fichiers);
                return;
            }

            let extractedText = '';

            switch (fileType) {
                case 'pdf':
                    extractedText = await processPdf(file, updateStatus, checkCancel);
                    break;
                case 'text':
                    extractedText = await processText(file, updateStatus);
                    break;
                case 'html':
                    extractedText = await processHtml(file, updateStatus);
                    break;
                case 'subtitles':
                    extractedText = await processSubtitles(file, updateStatus);
                    break;
                case 'rtf':
                    extractedText = await processRtf(file, updateStatus);
                    break;
                case 'epub':
                    extractedText = await processEpub(file, updateStatus);
                    break;
                case 'docx':
                    extractedText = await processDocx(file, updateStatus);
                    break;
                case 'pptx':
                    extractedText = await processPptx(file, updateStatus);
                    break;
                case 'odt':
                    extractedText = await processOdt(file, updateStatus);
                    break;
                case 'odp':
                    extractedText = await processOdp(file, updateStatus);
                    break;
                case 'xlsx':
                    extractedText = await processXlsx(file, updateStatus);
                    break;
                case 'ods':
                    extractedText = await processOds(file, updateStatus);
                    break;
                case 'image':
                    extractedText = await processImage(file, updateStatus, checkCancel);
                    break;
                case 'audio':
                    extractedText = await processAudio(file, updateStatus, checkCancel);
                    break;
            }
            checkCancel();

            const initialColor = FILE_COLORS[uploadedFiles.length % FILE_COLORS.length];
            uploadedFiles.push({ name: file.name, content: extractedText, color: initialColor });
            updateRagArea();

            hideStatus();
            showNotification(translations.extraction_success || 'Le document a été traité avec succès.', 'success');

        } catch (error) {
            hideCancelButton();
            if (error.name === 'AbortError') {
                hideStatus();
                showNotification(translations.extraction_cancelled || 'Traitement arrêté.', 'info');
                return;
            }
            // Erreurs audio actionnables par l'utilisateur → message dédié
            if (error.message === 'AUDIO_TOO_LONG') {
                hideStatus();
                showNotification(translations.audio_too_long || 'Le fichier audio dépasse la durée maximale (90 min).', 'error');
                return;
            }
            if (error.message === 'IMAGE_CONVERSION_FAILED') {
                hideStatus();
                showNotification(
                    translations.image_convert_failed || 'Impossible de convertir cette image. Réenregistrez-la en JPEG ou PNG.',
                    'error'
                );
                return;
            }
            if (error.message === 'AUDIO_DECODE_FAILED' || error.message === 'AUDIO_NO_ENDPOINT') {
                hideStatus();
                showNotification(translations.audio_decode_failed || 'Impossible de lire ce fichier audio. Le format est peut-être non reconnu.', 'error');
                return;
            }
            console.error('Erreur lors du traitement du fichier:', error);
            updateStatus(translations.extraction_error || 'Une erreur est survenue lors du traitement.');
            showNotification(translations.extraction_error || 'Une erreur est survenue lors du traitement.', 'error');
        }
    };

    if (pdfUpload) {
        pdfUpload.addEventListener('change', (event) => {
            const fichiers = Array.from(event.target.files || []);
            // Réinitialiser la valeur permet de re-choisir le MÊME fichier ensuite
            // (sans quoi le navigateur n'émet pas de second « change »).
            event.target.value = '';
            if (fichiers.length > 0) {
                enfilerFichiers(fichiers);
            }
        });
    }

    // API publique pour que d'autres modules (ex: Caramelia) puissent
    // déposer un fichier dans la zone OCR sans dépendre de la sidebar.
    // detectFileType est exporté pour la validation côté caller.
    window.CaramelOCR = {
        processFile: handleFile,
        // Asynchrone depuis 6.3.2 : la détection lit au besoin la signature
        // binaire du fichier. Les appelants doivent `await` le résultat.
        isSupported: async (file) => (await detectFileTypeAsync(file)) !== null,
        supportedFormats: SUPPORTED_FORMATS_LABEL,
        // Lecture seule du texte transcrit (copie) : permet à Caramelia de
        // déduire le sujet d'un document déposé. On ne renvoie jamais la
        // référence interne pour éviter toute mutation externe.
        getFiles: () => uploadedFiles.map(f => ({ name: f.name, content: f.content })),
    };

    if (dragDropArea) {
        // La spec HTML demande d'annuler dragenter ET dragover pour devenir une
        // cible de dépôt. Chrome se contente de dragover, Safari et Firefox non :
        // sans preventDefault sur dragenter, le dépôt y était refusé (le
        // navigateur ouvrait le fichier à la place). Ne jamais retirer dragenter.
        let survols = 0; // profondeur de survol : évite le clignotement sur les enfants

        dragDropArea.addEventListener('dragenter', (event) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
            survols++;
            dragDropArea.classList.add('drag-over');
        });

        dragDropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
            dragDropArea.classList.add('drag-over');
        });

        dragDropArea.addEventListener('dragleave', () => {
            survols = Math.max(0, survols - 1);
            if (survols === 0) dragDropArea.classList.remove('drag-over');
        });

        dragDropArea.addEventListener('drop', async (event) => {
            event.preventDefault();
            survols = 0;
            dragDropArea.classList.remove('drag-over');

            // Lecture SYNCHRONE : dataTransfer.items n'est plus exploitable après.
            const { fichiers, dossiers } = readDroppedFiles(event.dataTransfer);

            if (dossiers > 0) {
                showNotification(
                    translations.drop_folder_unsupported || 'Un dossier ne peut pas être déposé : glissez les fichiers un par un.',
                    'warning'
                );
            }
            if (fichiers.length === 0) {
                if (dossiers === 0) {
                    showNotification(
                        translations.drop_no_file || 'Aucun fichier trouvé dans ce dépôt. Glissez un fichier depuis votre ordinateur, ou utilisez le champ « lien web » ci-dessous.',
                        'error'
                    );
                }
                return;
            }

            enfilerFichiers(fichiers);
        });
    }

    // ── Import d'une page web ────────────────────────────────────────────────
    // Le texte est récupéré CÔTÉ SERVEUR (webhook n8n caramel-fetch-page :
    // contourne CORS + extrait le texte du HTML), puis ajouté à uploadedFiles[]
    // exactement comme un fichier déposé (tag coloré + texte dans #ocr-output).
    const urlInput = document.getElementById('urlImport');
    const urlBtn = document.getElementById('urlImportBtn');

    /** Libellé court d'une URL (hostname + début de chemin) pour le tag. */
    function shortenUrl(u) {
        try {
            const url = new URL(u);
            const path = url.pathname.replace(/\/$/, '');
            return (url.hostname + path).slice(0, 70) || url.hostname;
        } catch (e) {
            return u.slice(0, 70);
        }
    }

    async function handleUrl(rawUrl) {
        const url = (rawUrl || '').trim();
        if (!/^https?:\/\//i.test(url)) {
            showNotification(translations.url_import_invalid || 'Lien invalide : il doit commencer par http:// ou https://.', 'error');
            return;
        }
        if (uploadedFiles.some(f => f.sourceUrl === url)) {
            showNotification(translations.url_import_duplicate || 'Ce lien a déjà été ajouté.', 'warning');
            return;
        }
        const endpoint = CONFIG && CONFIG.fetchPageUrl;
        if (!endpoint) {
            showNotification(translations.extraction_error || 'Une erreur est survenue lors du traitement.', 'error');
            return;
        }

        // État de chargement : on ne remplace PAS le contenu du bouton (cela
        // changerait sa largeur → décalage visuel / FOUC). On swappe uniquement
        // l'icône en spinner (largeur figée par CSS) et on verrouille champ +
        // bouton. La largeur du bouton reste strictement identique.
        const btnIcon = urlBtn ? urlBtn.querySelector('i') : null;
        const iconDefault = btnIcon ? btnIcon.className : '';
        if (urlBtn) urlBtn.disabled = true;
        if (btnIcon) btnIcon.className = 'fas fa-spinner fa-spin';
        if (urlInput) urlInput.disabled = true;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                signal: controller.signal
            });
            // Proxy saturé (rate limit / indispo passagère) : message dédié pour
            // que l'utilisateur réessaie au lieu de croire le lien fautif.
            if (res.status === 429 || res.status === 503) {
                showNotification(translations.url_import_busy || 'Service momentanément occupé. Réessayez dans un instant.', 'warning');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json().catch(() => ({}));
            if (data.error || !data.text || !data.text.trim()) {
                throw new Error('PAGE_EMPTY');
            }

            let text = cleanImportedText(data.text);
            if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
            if (!text) throw new Error('PAGE_EMPTY');

            const name = (data.title && data.title.trim())
                ? data.title.trim().slice(0, 80)
                : shortenUrl(url);

            const initialColor = FILE_COLORS[uploadedFiles.length % FILE_COLORS.length];
            uploadedFiles.push({ name, content: text, color: initialColor, sourceUrl: url });
            updateRagArea();

            if (urlInput) urlInput.value = '';
            showNotification(translations.url_import_success || 'Page web ajoutée aux sources.', 'success');

        } catch (error) {
            console.error('Erreur import URL:', error);
            showNotification(translations.url_import_error || 'Impossible de récupérer cette page (inaccessible ou vide).', 'error');
        } finally {
            clearTimeout(timeoutId);
            if (urlBtn) urlBtn.disabled = false;
            if (btnIcon) btnIcon.className = iconDefault;
            if (urlInput) urlInput.disabled = false;
        }
    }

    if (urlBtn) {
        urlBtn.addEventListener('click', () => handleUrl(urlInput ? urlInput.value : ''));
    }
    if (urlInput) {
        urlInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleUrl(urlInput.value);
            }
        });
    }

    if (ocrFullscreenBtn) {
        ocrFullscreenBtn.addEventListener('click', () => {
            const unifiedRagArea = document.getElementById('unified-rag-area');
            const ragTopRow = document.querySelector('.rag-top-row');
            const existingOverlay = document.querySelector('.fullscreen-overlay');
            const icon = ocrFullscreenBtn.querySelector('i');

            if (existingOverlay) {
                const modalContent = existingOverlay.querySelector('.fullscreen-modal-container');
                ragTopRow.insertBefore(modalContent.firstChild, ragTopRow.firstChild);
                unifiedRagArea.classList.remove('fullscreen');
                existingOverlay.remove();
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            } else {
                const overlay = document.createElement('div');
                overlay.className = 'fullscreen-overlay';

                const modalContainer = document.createElement('div');
                modalContainer.className = 'fullscreen-modal-container';

                unifiedRagArea.classList.add('fullscreen');
                modalContainer.appendChild(unifiedRagArea);
                overlay.appendChild(modalContainer);
                document.body.appendChild(overlay);

                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        ocrFullscreenBtn.click();
                    }
                });
            }
        });
    }

    if (ocrCopyBtn) {
        ocrCopyBtn.addEventListener('click', () => {
            copyToClipboard('ocr-output', ocrCopyBtn);
        });
    }

    if (ocrLockBtn && ocrOutput) {
        let isLocked = false;

        const applyLockState = (locked) => {
            isLocked = locked;
            ocrOutput.setAttribute('contenteditable', locked ? 'false' : 'true');
            ocrOutput.classList.toggle('locked', locked);

            const icon = ocrLockBtn.querySelector('i');
            const textSpan = ocrLockBtn.querySelector('.toolbar-btn-text');

            if (icon) {
                icon.classList.toggle('fa-lock', locked);
                icon.classList.toggle('fa-lock-open', !locked);
            }

            if (locked) {
                ocrLockBtn.setAttribute('aria-label', translations.unlock_text || 'Déverrouiller');
                ocrLockBtn.setAttribute('data-tooltip-key', 'unlock_prompt');
                if (textSpan) {
                    textSpan.setAttribute('data-key', 'unlock_prompt');
                    textSpan.textContent = translations.unlock_prompt || textSpan.textContent;
                }
            } else {
                ocrLockBtn.setAttribute('aria-label', translations.lock_text || 'Verrouiller');
                ocrLockBtn.setAttribute('data-tooltip-key', 'lock_prompt');
                if (textSpan) {
                    textSpan.setAttribute('data-key', 'lock_prompt');
                    textSpan.textContent = translations.lock_prompt || textSpan.textContent;
                }
            }
        };

        applyLockState(false);

        ocrLockBtn.addEventListener('click', () => {
            applyLockState(!isLocked);
        });
    }

    if (ocrOutput) {
        ocrOutput.addEventListener('input', updateCharCounter);
    }

    updateCharCounter();

    function toggleSectionsVisibility() {
        const ragTagsTuto = document.querySelector('.rag-tags-tuto');
        const pdfTagsContainer = document.getElementById('pdf-tags-container');
        const hasFiles = uploadedFiles.length > 0;

        ragTagsTuto.style.display = hasFiles ? 'block' : 'none';
        pdfTagsContainer.style.display = hasFiles ? 'flex' : 'none';
    }
}
