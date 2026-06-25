/**
 * @file Gestion de l'extraction de texte depuis différents formats de fichiers.
 * Supporte : PDF (texte natif + OCR), DOCX, PPTX, ODT, ODP, PNG, JPEG, AUDIO
 * Utilise PDF.js, Tesseract.js, mammoth.js et JSZip ; l'audio est transcrit
 * par le webhook Whisper/Albert (le même que le micro Caramelia), via un
 * découpage en lots préparé côté navigateur (Web Audio API).
 */

import { showNotification, escapeHtmlTags } from '../core/utils.js';
import { translations, currentLang } from '../core/translation.js';
import { loadOcrLibs, LIB_PATHS } from '../core/lib-loader.js';
import { CONFIG } from '../caramelia/config.js';

// Types MIME supportés
const SUPPORTED_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/jpg': 'image',
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
    'docx': 'docx',
    'pptx': 'pptx',
    'odt': 'odt',
    'odp': 'odp',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
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

// Libellé des formats acceptés (réutilisé pour le message d'erreur et l'API publique)
const SUPPORTED_FORMATS_LABEL = 'PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG, MP3, M4A, WAV, OGG, FLAC, MP4, MOV, WEBM (audio extrait)';

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
 * Détecte le type de fichier par MIME ou extension
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
 * Traite une image (PNG/JPEG) via Tesseract.js
 */
async function processImage(file, updateStatus) {
    updateStatus(translations.ocr_image_processing || 'Reconnaissance (OCR) de l\'image...');

    const imageUrl = URL.createObjectURL(file);

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

    URL.revokeObjectURL(imageUrl);
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
            _cancelBtn.addEventListener('click', () => { _cancelRequested = true; });
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
        ocrStatus.textContent = message;
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

    const handleFile = async (file) => {
        const fileType = detectFileType(file);

        if (!fileType) {
            showNotification(
                (translations.error_unsupported_format || 'Format non supporté. Formats acceptés : ') + SUPPORTED_FORMATS_LABEL,
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
            // Charger les bibliothèques OCR nécessaires
            await loadOcrLibs();
            checkCancel();

            let extractedText = '';

            switch (fileType) {
                case 'pdf':
                    extractedText = await processPdf(file, updateStatus, checkCancel);
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
                case 'image':
                    extractedText = await processImage(file, updateStatus);
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
            const file = event.target.files[0];
            if (file) {
                handleFile(file);
            }
        });
    }

    // API publique pour que d'autres modules (ex: Caramelia) puissent
    // déposer un fichier dans la zone OCR sans dépendre de la sidebar.
    // detectFileType est exporté pour la validation côté caller.
    window.CaramelOCR = {
        processFile: handleFile,
        isSupported: (file) => detectFileType(file) !== null,
        supportedFormats: SUPPORTED_FORMATS_LABEL,
        // Lecture seule du texte transcrit (copie) : permet à Caramelia de
        // déduire le sujet d'un document déposé. On ne renvoie jamais la
        // référence interne pour éviter toute mutation externe.
        getFiles: () => uploadedFiles.map(f => ({ name: f.name, content: f.content })),
    };

    if (dragDropArea) {
        dragDropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            dragDropArea.classList.add('drag-over');
        });

        dragDropArea.addEventListener('dragleave', () => {
            dragDropArea.classList.remove('drag-over');
        });

        dragDropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            dragDropArea.classList.remove('drag-over');
            const file = event.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
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

    /**
     * Nettoyage défensif : ne garder que du texte. Le webhook renvoie déjà du
     * texte ; ceci neutralise tout résidu de balises/entités et normalise les
     * espaces, pour ne pas polluer le prompt LLM.
     */
    function cleanImportedText(raw) {
        let s = String(raw || '');
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
