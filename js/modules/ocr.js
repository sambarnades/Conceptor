/**
 * @file Gestion de la fonctionnalité d'OCR (Reconnaissance Optique de Caractères).
 * Ce module gère le téléversement de fichiers PDF, leur traitement côté client avec PDF.js et Tesseract.js
 * pour en extraire le texte, et l'affichage du résultat dans l'interface.
 */

import { showNotification } from './utils.js';
import { translations } from './translation.js';

/**
 * Initialise les écouteurs d'événements et la logique pour la fonctionnalité OCR.
 * Gère le toggle RAG, le changement de fichier PDF et les contrôles de la zone de texte (plein écran, verrouillage).
 */
export function initOcr() {
    const pdfUpload = document.getElementById('pdfUpload');
    const ocrOutput = document.getElementById('ocr-output');
    const ocrStatus = document.getElementById('ocr-status');
    const ocrFullscreenBtn = document.getElementById('ocr-fullscreen-btn');
    const ocrLockBtn = document.getElementById('ocr-lock-btn');
    const ocrCopyBtn = document.getElementById('ocr-copy-btn');
    const ragToggle = document.getElementById('ragToggle');
    const ragSectionContainer = document.getElementById('rag-section-container');
    const unifiedRagArea = document.getElementById('unified-rag-area');
    const dragDropArea = document.querySelector('.drag-drop-area');


    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            showNotification(translations.error_invalid_pdf || 'Veuillez sélectionner un fichier PDF valide.', 'error');
            return;
        }

        ocrOutput.value = '';
        ocrStatus.textContent = translations.pdf_loading || 'Chargement du PDF...';
        ocrStatus.style.display = 'block';

        try {
            const { pdfjsLib } = window;
            if (!pdfjsLib) {
                throw new Error("PDF.js n'est pas chargé.");
            }
            const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                ocrStatus.textContent = `${translations.pdf_processing_page || 'Traitement de la page'} ${i}/${pdf.numPages}...`;
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const imageData = canvas.toDataURL('image/png');

                ocrStatus.textContent = `${translations.ocr_recognizing_page || 'Reconnaissance (OCR) de la page'} ${i}/${pdf.numPages}...`;
                const { data: { text } } = await Tesseract.recognize(imageData, 'fra', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            ocrStatus.textContent = `${translations.ocr_recognizing_page || 'Reconnaissance (OCR) de la page'} ${i}/${pdf.numPages} (${(m.progress * 100).toFixed(0)}%)...`;
                        }
                    }
                });
                fullText += text + '\n\n';
            }

            ocrOutput.value = fullText;
            ocrStatus.style.display = 'none';
            showNotification(translations.ocr_success || 'Le document a été traité avec succès.', 'success');

        } catch (error) {
            console.error('Erreur lors du traitement du PDF:', error);
            ocrStatus.textContent = translations.ocr_error || 'Une erreur est survenue lors du traitement.';
            showNotification(translations.ocr_error || 'Une erreur est survenue lors du traitement.', 'error');
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
            const ragSectionContainer = document.getElementById('rag-section-container');
            const ragContentArea = document.querySelector('.rag-content-area');
            const existingOverlay = document.querySelector('.fullscreen-overlay');
            const icon = ocrFullscreenBtn.querySelector('i');

            if (existingOverlay) {
                const modalContent = existingOverlay.querySelector('.fullscreen-modal-container');
                ragSectionContainer.appendChild(modalContent.firstChild); // Re-déplacer ragContentArea
                ragContentArea.classList.remove('fullscreen');
                existingOverlay.remove();
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
            } else {
                const overlay = document.createElement('div');
                overlay.className = 'fullscreen-overlay';

                const modalContainer = document.createElement('div');
                modalContainer.className = 'fullscreen-modal-container';
                
                ragContentArea.classList.add('fullscreen');
                modalContainer.appendChild(ragContentArea);
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

    if (ocrLockBtn) {
        ocrOutput.readOnly = false;

        ocrLockBtn.addEventListener('click', () => {
            ocrOutput.readOnly = !ocrOutput.readOnly;
            const icon = ocrLockBtn.querySelector('i');
            if (ocrOutput.readOnly) {
                icon.classList.remove('fa-lock-open');
                icon.classList.add('fa-lock');
                ocrLockBtn.setAttribute('aria-label', translations.unlock_text || 'Dévérrouiller');
            } else {
                icon.classList.remove('fa-lock');
                icon.classList.add('fa-lock-open');
                ocrLockBtn.setAttribute('aria-label', translations.lock_text || 'Vérrouiller');
            }
        });
    }
}