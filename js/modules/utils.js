import { translations, translatePage } from './translation.js';

// =======================================================================
// Fonctions utilitaires
// =======================================================================
export function cleanJsonInput(rawInput) {
        let cleanedInput = rawInput.trim();
        // Supprimer le ```json au début
        if (cleanedInput.startsWith('```json')) {
            cleanedInput = cleanedInput.substring(7);
        }
        // Supprimer le ``` à la fin
        if (cleanedInput.endsWith('```')) {
            cleanedInput = cleanedInput.slice(0, -3);
        }
        return cleanedInput.trim();
    }

export function showHelpModal() {
        // Supprimer une modale existante si elle existe
        const existingModal = document.getElementById('help-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Créer les éléments de la modale
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'help-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'help-modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'help-modal-header';
        modalHeader.innerHTML = `
            <h2>${translations.help_modal_title || 'Guide'}</h2>
            <span class="help-close-modal-btn" id="close-help-modal">&times;</span>
        `;

        const modalBody = document.createElement('div');
        modalBody.className = 'help-modal-body';
        modalBody.innerHTML = translations.help_modal_content || '<p>Contenu d\'aide non disponible.</p>';
        
        // Traduire le contenu de la modale après son insertion
        translatePage(modalBody);

        // Assembler la modale
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Afficher la modale
        modal.style.display = 'block';


        // Les animations de section ont été supprimées pour améliorer les performances.

        // Gérer la fermeture
        const closeModal = () => {
            modal.style.display = 'none';
            modal.remove(); // Nettoyer le DOM
        };

        document.getElementById('close-help-modal').addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Logique de défilement automatique
        const navLinks = modal.querySelectorAll('.help-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = modal.querySelector(targetId);
                if (targetElement) {
                    modalBody.scrollTo({
                        top: targetElement.offsetTop - 70, // 70px pour compenser la barre de nav
                        behavior: 'smooth'
                    });
                }
            });
        });
    }


export function copyToClipboard(textareaId, button) {
        const textarea = document.getElementById(textareaId);
        if (!textarea || !textarea.value.trim()) {
            showNotification(translations.error_field_empty || 'Le champ est vide. Veuillez d\'abord générer un prompt.', 'error');
            return;
        }
        navigator.clipboard.writeText(textarea.value).then(() => {
            const originalHtml = button.innerHTML;
            const textSpan = button.querySelector('span');
            let originalText = '';

            if (textSpan) {
                originalText = textSpan.textContent;
                textSpan.textContent = translations.success_copy || '✓ Copié !';
            }
            
            button.classList.add('copied');
            
            setTimeout(() => {
                if (textSpan) {
                    textSpan.textContent = originalText;
                }
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Erreur de copie:', err);
            showNotification(translations.error_copy_failed || 'La copie a échoué.', 'error');
        });
    }

export function downloadFile(content, fileName, contentType) {
       const a = document.createElement('a');
       const file = new Blob([content], { type: contentType });
       a.href = URL.createObjectURL(file);
       a.download = fileName;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
   }

export function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.classList.add('error');
        }

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }


// =======================================================================
// 6.3. Formatage de texte
// =======================================================================
export const formatTextToHtml = (text) => {
    if (!text) return '';
    // Gère les cas où le texte est déjà en HTML pour ne pas ajouter de balises en double
    if (text.trim().startsWith('<p>')) return text;
    return text
        .replace(/\*\*(.*?)\*\*/g, '<em>$1</em>') // Italique
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Gras
        .split('\n').map(p => `<p>${p.trim()}</p>`).join('');
};


// =======================================================================
// 6.4. Fonctions d'échappement et UUID
// =======================================================================
export function escapeHtmlTags(str) {
        return String(str)
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

export function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

export function setupEventListeners() {
    const modeTabs = document.querySelectorAll('.mode-tab');
    const simpleMode = document.getElementById('simple-mode');
    const advancedMode = document.getElementById('advanced-mode');

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.mode === 'simple') {
                simpleMode.classList.add('active');
                advancedMode.classList.remove('active');
            } else {
                simpleMode.classList.remove('active');
                advancedMode.classList.add('active');
            }
        });
    });

    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', showHelpModal);
    }

    const legalMentionsLink = document.getElementById('legal-mentions-link');
    const legalMentionsModal = document.getElementById('legal-mentions-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const legalMentionsContent = document.getElementById('legal-mentions-content');

    if (legalMentionsLink) {
        legalMentionsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('legal/mentions-legales.html');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const html = await response.text();
                legalMentionsContent.innerHTML = html;
                translatePage(legalMentionsModal);
                legalMentionsModal.style.display = 'block';
            } catch (error) {
                console.error('Failed to fetch legal mentions:', error);
                showNotification(translations.error_loading_legal || 'Impossible de charger les mentions légales.', 'error');
            }
        });
    }

    /* if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            legalMentionsModal.style.display = 'none';
        });
    } */

    window.addEventListener('click', (e) => {
        if (e.target === legalMentionsModal) {
            legalMentionsModal.style.display = 'none';
        }
    });
}

export function setupToolbarListeners(container) {
    const toolbars = container.querySelectorAll('.floating-toolbar');
    toolbars.forEach(toolbar => {
        const textarea = toolbar.parentElement.querySelector('textarea');
        const copyBtn = toolbar.querySelector('.copy-prompt-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyToClipboard(textarea.id, copyBtn);
            });
        }
        const fullscreenBtn = toolbar.querySelector('.fullscreen-btn');
        const lockBtn = toolbar.querySelector('.lock-btn');

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const originalContainer = textarea.closest('.prompt-area');
                const existingOverlay = document.querySelector('.fullscreen-overlay');
                const icon = fullscreenBtn.querySelector('i');
                const span = fullscreenBtn.querySelector('span');

                if (existingOverlay) {
                    existingOverlay.remove();
                    icon.classList.remove('fa-compress');
                    icon.classList.add('fa-expand');
                    fullscreenBtn.setAttribute('data-tooltip-key', 'fullscreen_prompt');
                    if (span) span.setAttribute('data-key', 'fullscreen_prompt');
                } else {
                    const overlay = document.createElement('div');
                    overlay.className = 'fullscreen-overlay';
                    
                    const clonedToolbar = toolbar.cloneNode(true);
                    const clonedTextarea = textarea.cloneNode(true);

                    const fullscreenModalContainer = document.createElement('div');
                    fullscreenModalContainer.className = 'fullscreen-modal-container';

                    clonedTextarea.value = textarea.value;
                    clonedTextarea.addEventListener('input', () => {
                        textarea.value = clonedTextarea.value;
                    });
                    clonedTextarea.classList.add('textarea-fullscreen');

                    fullscreenModalContainer.appendChild(clonedToolbar);
                    fullscreenModalContainer.appendChild(clonedTextarea);
                    
                    overlay.appendChild(fullscreenModalContainer);
                    document.body.appendChild(overlay);

                    const clonedFullscreenBtn = overlay.querySelector('.fullscreen-btn');
                    if (clonedFullscreenBtn) {
                        clonedFullscreenBtn.addEventListener('click', () => {
                            fullscreenBtn.click();
                        });
                    }
                    
                    [fullscreenBtn, clonedFullscreenBtn].forEach(btn => {
                        if (btn) {
                            const btnIcon = btn.querySelector('i');
                            const btnSpan = btn.querySelector('span');
                            if (existingOverlay) {
                                btnIcon.classList.remove('fa-compress');
                                btnIcon.classList.add('fa-expand');
                                btn.setAttribute('data-tooltip-key', 'fullscreen_prompt');
                                if (btnSpan) btnSpan.setAttribute('data-key', 'fullscreen_prompt');
                            } else {
                                btnIcon.classList.remove('fa-expand');
                                btnIcon.classList.add('fa-compress');
                                btn.setAttribute('data-tooltip-key', 'exit_fullscreen_prompt');
                                if (btnSpan) btnSpan.setAttribute('data-key', 'exit_fullscreen_prompt');
                            }
                            translatePage(btn.parentElement);
                        }
                    });
                    
                    const clonedLockBtn = overlay.querySelector('.lock-btn');
                    if (clonedLockBtn) {
                        clonedLockBtn.addEventListener('click', () => {
                            lockBtn.click();
                        });
                    }

                    const clonedCopyBtn = overlay.querySelector('.copy-prompt-btn');
                    if (clonedCopyBtn) {
                        clonedCopyBtn.addEventListener('click', () => {
                            copyToClipboard(clonedTextarea.id, clonedCopyBtn);
                        });
                    }

                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) {
                            fullscreenBtn.click();
                        }
                    });
                }
                translatePage(toolbar);
            });
        }

        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                const isLocked = !textarea.readOnly;
                textarea.readOnly = isLocked;

                const fullscreenTextarea = document.querySelector('.fullscreen-overlay .textarea-fullscreen');
                if (fullscreenTextarea) {
                    fullscreenTextarea.readOnly = isLocked;
                }

                const allToolbars = document.querySelectorAll('.floating-toolbar, .fullscreen-modal-container .floating-toolbar');
                allToolbars.forEach(tb => {
                    const currentTextarea = tb.parentElement.querySelector('textarea');
                    if (currentTextarea && currentTextarea.id === textarea.id) {
                        const btn = tb.querySelector('.lock-btn');
                        if (btn) {
                            const icon = btn.querySelector('i');
                            const span = btn.querySelector('span');
                            if (isLocked) {
                                icon.classList.remove('fa-unlock');
                                icon.classList.add('fa-lock');
                                btn.setAttribute('data-tooltip-key', 'unlock_prompt');
                                if (span) span.setAttribute('data-key', 'unlock_prompt');
                            } else {
                                icon.classList.remove('fa-lock');
                                icon.classList.add('fa-unlock');
                                btn.setAttribute('data-tooltip-key', 'lock_prompt');
                                if (span) span.setAttribute('data-key', 'lock_prompt');
                            }
                            translatePage(btn.parentElement);
                        }
                    }
                });
            });
        }
    });
}