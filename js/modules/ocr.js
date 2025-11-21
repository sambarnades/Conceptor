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
    const ragSectionContainer = document.getElementById('rag-section-container');
    const dragDropArea = document.querySelector('.drag-drop-area');
    const charCounter = document.getElementById('char-counter');
    const pdfTagsContainer = document.getElementById('pdf-tags-container');

    let uploadedFiles = [];
    const MAX_CHARS = 120000;
    const PDF_COLORS = [
        '#E6E6FA', '#F0F8FF', '#F5FFFA', '#FFF5EE', '#FAFAD2',
        '#FFE4E1', '#FFF0F5', '#F0FFF0', '#F8F8FF', '#FFFAF0'
    ];

    function updateCharCounter() {
        const currentLength = ocrOutput.innerText.length;
        charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
        charCounter.classList.remove('warning', 'error');
        if (currentLength > MAX_CHARS) {
            charCounter.classList.add('error');
        } else if (currentLength > MAX_CHARS * 0.9) {
            charCounter.classList.add('warning');
        }
        toggleSectionsVisibility();
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
            
            const sanitizedContent = file.content.replace(/&/g, '&').replace(/</g, "<").replace(/>/g, ">");
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
        if (!file || file.type !== 'application/pdf') {
            showNotification(translations.error_invalid_pdf || 'Veuillez sélectionner un fichier PDF valide.', 'error');
            return;
        }
        
        if (uploadedFiles.some(f => f.name === file.name)) {
            showNotification(translations.error_duplicate_pdf || 'Ce fichier a déjà été ajouté.', 'warning');
            return;
        }

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

            const initialColor = PDF_COLORS[uploadedFiles.length % PDF_COLORS.length];
            uploadedFiles.push({ name: file.name, content: fullText, color: initialColor });
            updateRagArea();

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
            const unifiedRagArea = document.getElementById('unified-rag-area');
            const ragTopRow = document.querySelector('.rag-top-row'); // Le parent original
            const existingOverlay = document.querySelector('.fullscreen-overlay');
            const icon = ocrFullscreenBtn.querySelector('i');

            if (existingOverlay) {
                const modalContent = existingOverlay.querySelector('.fullscreen-modal-container');
                ragTopRow.insertBefore(modalContent.firstChild, ragTopRow.firstChild); // Re-déplacer unified-rag-area
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
                modalContainer.appendChild(unifiedRagArea); // Déplacer uniquement la zone unifiée
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
    
    // Initial call
    updateCharCounter();
    
    function toggleSectionsVisibility() {
        const ragTagsTuto = document.querySelector('.rag-tags-tuto');
        const pdfTagsContainer = document.getElementById('pdf-tags-container');
        const hasFiles = uploadedFiles.length > 0;

        ragTagsTuto.style.display = hasFiles ? 'block' : 'none';
        pdfTagsContainer.style.display = hasFiles ? 'flex' : 'none';
    }
}
