/**
 * @file Gestion de l'extraction de texte depuis différents formats de fichiers.
 * Supporte : PDF (texte natif + OCR), DOCX, PPTX, ODT, ODP, PNG, JPEG
 * Utilise PDF.js, Tesseract.js, mammoth.js et JSZip.
 */

import { showNotification } from '../core/utils.js';
import { translations } from '../core/translation.js';
import { loadOcrLibs } from '../core/lib-loader.js';

// Types MIME supportés
const SUPPORTED_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/jpg': 'image'
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
    'jpeg': 'image'
};

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

    const { data: { text } } = await Tesseract.recognize(imageData, 'fra', {
        logger: m => {
            if (m.status === 'recognizing text') {
                updateStatus(`${translations.ocr_recognizing_page || 'Reconnaissance (OCR) de la page'} ${pageNum}/${totalPages} (${(m.progress * 100).toFixed(0)}%)...`);
            }
        }
    });

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

    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
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

    const { data: { text } } = await Tesseract.recognize(imageUrl, 'fra', {
        logger: m => {
            if (m.status === 'recognizing text') {
                updateStatus(`${translations.ocr_image_processing || 'Reconnaissance (OCR) de l\'image'} (${(m.progress * 100).toFixed(0)}%)...`);
            } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
                updateStatus(translations.ocr_initializing || 'Initialisation de l\'OCR...');
            } else if (m.status === 'loading language traineddata') {
                updateStatus(translations.ocr_loading_language || 'Chargement du modèle de langue...');
            } else if (m.status === 'initializing api') {
                updateStatus(translations.ocr_preparing || 'Préparation de l\'analyse...');
            }
        }
    });

    URL.revokeObjectURL(imageUrl);
    return text;
}

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
    }

    function hideStatus() {
        ocrStatus.style.display = 'none';
        hideCancelButton();
    }

    function updateRagArea() {
        pdfTagsContainer.innerHTML = '';
        let combinedHtml = '';

        uploadedFiles.forEach((file, index) => {
            const tag = document.createElement('div');
            tag.className = 'pdf-tag';
            tag.style.backgroundColor = file.color;
            tag.innerHTML = `
                <input type="color" class="color-picker" value="${file.color}" data-index="${index}">
                <span class="filename" title="${file.name}">${file.name}</span>
                <button class="remove-tag-btn" data-index="${index}" title="Supprimer">&times;</button>
            `;
            pdfTagsContainer.appendChild(tag);

            const sanitizedContent = file.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
            const supportedFormats = 'PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG';
            showNotification(
                (translations.error_unsupported_format || 'Format non supporté. Formats acceptés : ') + supportedFormats,
                'error'
            );
            return;
        }

        // Vérifier les doublons
        if (uploadedFiles.some(f => f.name === file.name)) {
            showNotification(translations.error_duplicate_file || 'Ce fichier a déjà été ajouté.', 'warning');
            return;
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
