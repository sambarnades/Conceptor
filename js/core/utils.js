import { translations, translatePage } from './translation.js';
import { addNotification } from '../ui/notifications.js';
import { sanitizeSync, preloadSanitizer } from '../export/sanitizer.js';

// Préchargement de DOMPurify pendant le temps d'inactivité
if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadSanitizer(), { timeout: 3000 });
    } else {
        setTimeout(preloadSanitizer, 1000);
    }
}

// =======================================================================
// Mode debug (activé par ?debug dans l'URL)
// =======================================================================
export const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

export function debugLog(module, ...args) {
    if (DEBUG) console.log(`[DEBUG][${module}]`, ...args);
}

// =======================================================================
// Classification des erreurs
// =======================================================================

/**
 * Catégories d'erreur possibles
 */
export const ErrorCategory = {
    PARSE_ERROR: 'parse_error',           // JSON invalide du LLM
    VALIDATION_ERROR: 'validation_error', // JSON valide mais structure incorrecte
    NETWORK_ERROR: 'network_error',       // Timeout, serveur indisponible
    PACKAGING_ERROR: 'packaging_error'    // Erreur lors du packaging H5P/MBZ
};

/**
 * Classifie une erreur selon sa nature
 * @param {Error} error - L'erreur à classifier
 * @returns {{category: string, userMessage: string, technicalMessage: string}}
 */
export function classifyError(error) {
    const errorMsg = error.message || String(error);
    const errorName = error.name || '';

    let category = ErrorCategory.PACKAGING_ERROR; // Défaut
    let userMessageKey = 'error_packaging';

    // Parse error : JSON invalide
    if (errorName === 'SyntaxError' || errorMsg.includes('JSON') || errorMsg.includes('parse') || errorMsg.includes('Unexpected token')) {
        category = ErrorCategory.PARSE_ERROR;
        userMessageKey = 'error_parse';
    }
    // Network error : timeout, fetch failed, network issues
    else if (errorMsg.includes('timeout') || errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
        category = ErrorCategory.NETWORK_ERROR;
        userMessageKey = 'error_network';
    }
    // Validation error : structure incorrecte
    else if (errorMsg.includes('validation') || errorMsg.includes('required') || errorMsg.includes('missing') || errorMsg.includes('invalid structure')) {
        category = ErrorCategory.VALIDATION_ERROR;
        userMessageKey = 'error_validation';
    }

    return {
        category,
        userMessageKey,
        technicalMessage: errorMsg
    };
}

// =======================================================================
// Fonctions utilitaires
// =======================================================================
export function cleanJsonInput(rawInput) {
    let cleanedInput = rawInput.trim();
    // Supprimer le ```json ou ``` au début
    if (cleanedInput.startsWith('```json')) {
        cleanedInput = cleanedInput.substring(7);
    } else if (cleanedInput.startsWith('```')) {
        cleanedInput = cleanedInput.substring(3);
    }
    // Supprimer le ``` à la fin
    if (cleanedInput.endsWith('```')) {
        cleanedInput = cleanedInput.slice(0, -3);
    }
    return cleanedInput.trim();
}

export async function showHelpModal() {
    // Supprimer une modale existante si elle existe
    const existingModal = document.getElementById('help-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Créer les éléments de la modale
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'help-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'help-modal-title');

    const modalContent = document.createElement('div');
    modalContent.className = 'help-modal-content';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'help-modal-header';
    modalHeader.innerHTML = `
            <h2 id="help-modal-title">${translations.help_modal_title || 'Guide'}</h2>
            <span class="help-close-modal-btn" id="close-help-modal">&times;</span>
        `;

    const modalBody = document.createElement('div');
    modalBody.className = 'help-modal-body';

    // Chargement du template HTML externe
    try {
        const response = await fetch('assets/templates/tutorial_content.html');
        if (!response.ok) throw new Error('Erreur de chargement du tutoriel');
        const html = await response.text();
        modalBody.innerHTML = html;

        // Traduire le contenu de la modale après son injection
        translatePage(modalBody);
    } catch (error) {
        console.error('Erreur chargement aide:', error);
        modalBody.innerHTML = '<p>Contenu d\'aide non disponible.</p>';
        translatePage(modalBody);
    }

    // Assembler la modale
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Afficher la modale
    modal.style.display = 'block';

    // Gérer la fermeture
    let a11yCleanup = null;
    // Listener window nommé pour pouvoir le retirer à la fermeture
    // (sinon il s'accumule à chaque ouverture de l'aide)
    const handleWindowClick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
    const closeModal = () => {
        if (a11yCleanup) { a11yCleanup(); a11yCleanup = null; }
        window.removeEventListener('click', handleWindowClick);
        modal.style.display = 'none';
        modal.remove();
    };

    // Accessibilité : focus trap + Escape + restauration du focus
    a11yCleanup = setupModalAccessibility(modal, {
        onClose: closeModal,
        focusSelector: '#close-help-modal'
    });

    document.getElementById('close-help-modal').addEventListener('click', closeModal);
    window.addEventListener('click', handleWindowClick);

    // Logique de défilement automatique
    const navLinks = modal.querySelectorAll('.help-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
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
    // Libérer l'object URL une fois le téléchargement déclenché (évite la fuite mémoire).
    // Délai d'1s pour laisser au navigateur le temps d'initier le téléchargement (Safari).
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function showNotification(message, type = 'success') {
    addNotification({
        type: 'alert',
        title: message,
        status: type === 'error' ? 'error' : 'success'
    });
}


// =======================================================================
// 6.3. Formatage de texte
// =======================================================================
/**
 * Formate le texte en HTML avec support Markdown basique ET protection XSS.
 *
 * Gère :
 * - **gras** -> <strong>gras</strong>
 * - *italique* -> <em>italique</em>
 * - Sauts de ligne -> paragraphes <p>
 * - HTML existant (sanitizé)
 * - Délimiteurs MathJax préservés : \( \) \[ \]
 *
 * ORDRE DES OPÉRATIONS :
 * 1. Sanitize le texte brut d'abord (supprimer les vecteurs XSS AVANT conversion)
 * 2. Convertir le Markdown en HTML (après sanitization)
 *
 * @param {string} text - Texte brut ou HTML depuis le LLM
 * @returns {string} - Chaîne HTML sécurisée
 */
export const formatTextToHtml = (text) => {
    if (!text) return '';

    const trimmed = text.trim();

    // ÉTAPE 1 : Sanitize le texte brut d'abord pour supprimer les scripts malveillants
    // AVANT la conversion Markdown. Cela évite que du HTML malveillant soit injecté.
    const sanitized = sanitizeSync(trimmed, 'EDUCATIONAL');

    // Convertir les \n littéraux (deux caractères \ + n) en vrais sauts de ligne
    // SAUF quand \n est suivi d'une lettre minuscule : c'est alors une commande LaTeX (\neq, \nabla, \nu, etc.)
    // Les majuscules après \n indiquent un début de phrase → c'est un saut de ligne (ex: \nRéflexion)
    const withNewlines = sanitized.replace(/\\n(?![a-z])/g, '\n');

    // ÉTAPE 1bis : Convertir les tableaux Markdown (GFM) en <table> HTML, puis les mettre
    // de côté via des placeholders pour que l'enveloppe en <p> ci-dessous ne les casse pas.
    const tablePlaceholders = [];
    const withoutTables = markdownTablesToHtml(withNewlines).replace(/<table[\s\S]*?<\/table>/g, (m) => {
        tablePlaceholders.push(m);
        return `\x00TABLE${tablePlaceholders.length - 1}\x00`;
    });

    // Vérifie si le texte contient déjà des balises HTML de structure (<p>, <div>, etc.)
    const hasStructuralHtml = /<(p|div|br|ul|ol|li)[\s>]/i.test(withoutTables);

    // ÉTAPE 2 : Convertir le Markdown en HTML en protégeant le LaTeX
    let html = markdownToHtml(withoutTables);

    // Envelopper en paragraphes SEULEMENT si :
    // - Le texte contient des retours à la ligne
    // - ET le texte n'a pas déjà de structure HTML (comme <p>)
    if (html.includes('\n') && !hasStructuralHtml) {
        html = html
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `<p>${line}</p>`)
            .join('');
    }

    // Réinsérer les tableaux (en retirant l'éventuelle enveloppe <p> autour du placeholder)
    html = html
        .replace(/<p>\s*\x00TABLE(\d+)\x00\s*<\/p>/g, (_, i) => tablePlaceholders[parseInt(i, 10)])
        .replace(/\x00TABLE(\d+)\x00/g, (_, i) => tablePlaceholders[parseInt(i, 10)]);

    return html;
};

/**
 * Convertit les marqueurs Markdown (**gras**, *italique*) en HTML
 * en protégeant les blocs LaTeX \(...\) et \[...\].
 * Évite que les * dans les formules (ex: \mathbb{R}^*) soient
 * interprétés comme du gras/italique markdown.
 *
 * @param {string} text - Texte avec éventuellement du markdown et du LaTeX
 * @param {Object} [options] - Options de formatage
 * @param {boolean} [options.newlineToBr=false] - Convertir \n en <br> (protégé du LaTeX)
 * @returns {string} - Texte avec markdown converti en HTML, LaTeX intact
 */
export function markdownToHtml(text, { newlineToBr = false } = {}) {
    if (!text) return '';
    const latexPlaceholders = [];
    let result = text.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, (m) => {
        latexPlaceholders.push(m);
        return `\x00LATEX${latexPlaceholders.length - 1}\x00`;
    });
    result = result
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    if (newlineToBr) result = result.replace(/\n/g, '<br>');
    return result.replace(/\x00LATEX(\d+)\x00/g, (_, i) => latexPlaceholders[parseInt(i)]);
}

/**
 * Convertit les tableaux Markdown (GFM) en HTML, sur une seule ligne par tableau.
 *
 * Détecte un bloc tableau : une ligne d'en-tête contenant `|`, IMMÉDIATEMENT suivie
 * d'une ligne de séparation faite uniquement de `|`, `:`, `-` et d'espaces (ex.
 * `| :--- | :--- |`), puis de 0 ou plusieurs lignes de données contenant `|`.
 * Le contenu de chaque cellule passe par markdownToHtml (gras/italique/LaTeX préservés).
 * Les lignes hors tableau sont laissées intactes ; sans le moindre `|`, le texte est
 * retourné tel quel. Sert de filet de sécurité quand l'IA produit un tableau Markdown
 * dans un bloc texte au lieu d'un vrai bloc tableau (sinon les `|` s'affichent en brut).
 *
 * @param {string} text
 * @returns {string}
 */
export function markdownTablesToHtml(text) {
    if (!text || text.indexOf('|') === -1) return text;

    // Ligne de séparation : que des `|`, `:`, `-`, espaces, avec au moins un `|` et un `-`
    const isSeparator = (line) => {
        const t = line.trim();
        return t.includes('|') && t.includes('-') && /^[\s|:-]+$/.test(t);
    };
    const splitCells = (line) => {
        let s = line.trim();
        if (s.startsWith('|')) s = s.slice(1);
        if (s.endsWith('|')) s = s.slice(0, -1);
        return s.split('|').map(c => c.trim());
    };

    const lines = text.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const header = lines[i];
        const sep = lines[i + 1];
        if (header.includes('|') && sep !== undefined && isSeparator(sep)) {
            const headers = splitCells(header);
            const rows = [];
            let j = i + 2;
            while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
                rows.push(splitCells(lines[j]));
                j++;
            }
            const thCells = headers
                .map(h => `<th style="border:1px solid #c5cdd6;padding:6px 10px;background:#eef2f7;text-align:left">${markdownToHtml(h)}</th>`)
                .join('');
            const bodyRows = rows
                .map(r => '<tr>' + headers
                    .map((_, k) => `<td style="border:1px solid #c5cdd6;padding:6px 10px">${markdownToHtml(r[k] || '')}</td>`)
                    .join('') + '</tr>')
                .join('');
            out.push(`<table style="border-collapse:collapse;margin:0.6em 0;font-size:0.95em"><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>`);
            i = j - 1; // sauter le bloc tableau consommé
        } else {
            out.push(header);
        }
    }
    return out.join('\n');
}


// =======================================================================
// 6.4. Fonctions d'échappement et UUID
// =======================================================================
export function escapeHtmlTags(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sanitize une URL destinée à un attribut href/src.
 *
 * N'autorise que :
 * - les schémas `http:` / `https:` et `mailto:`
 * - les ancres (`#...`)
 * - les chemins relatifs (sans schéma)
 *
 * Toute autre valeur (javascript:, data:, vbscript:, ftp:, schéma inconnu,
 * ou entrée non-string) retourne `'#'` (lien neutre).
 *
 * L'entrée est trimée et les caractères de contrôle / espaces sont neutralisés
 * AVANT le test de schéma : un `java\tscript:alert(1)` est donc bien rejeté
 * (les navigateurs ignorent ces caractères dans les schémas).
 *
 * @param {string} url - URL potentiellement dangereuse
 * @returns {string} URL sûre, ou '#' si rejetée
 */
export function sanitizeUrl(url) {
    if (typeof url !== 'string') return '#';

    const trimmed = url.trim();
    if (trimmed === '') return '#';

    // Neutraliser les caractères de contrôle et les espaces pour le test de schéma
    // (les navigateurs les ignorent : `java\tscript:` est interprété comme `javascript:`)
    const probe = trimmed.replace(/[\u0000-\u0020\u007F-\u009F\s]/g, '').toLowerCase();

    // Ancres : toujours autorisées
    if (probe.startsWith('#')) return trimmed;

    // Détection d'un schéma explicite (ex: "https:", "javascript:", "data:")
    const schemeMatch = probe.match(/^([a-z][a-z0-9+.\-]*):/);
    if (!schemeMatch) {
        // Pas de schéma → chemin relatif, autorisé
        return trimmed;
    }

    const scheme = schemeMatch[1];
    if (scheme === 'http' || scheme === 'https' || scheme === 'mailto') {
        return trimmed;
    }

    // Schéma interdit ou inconnu → lien neutre
    return '#';
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function setupEventListeners() {
    const modeTabs = document.querySelectorAll('.mode-tab');
    const advancedFields = document.getElementById('advanced-fields');

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Mise à jour des onglets actifs
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Affiche/masque les champs avancés selon le mode
            if (tab.dataset.mode === 'advanced') {
                advancedFields.classList.add('active');
            } else {
                advancedFields.classList.remove('active');
            }
        });
    });

    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', showHelpModal);
    }

    const legalMentionsLink = document.getElementById('legal-mentions-link');
    const legalMentionsModal = document.getElementById('legal-mentions-modal');
    const legalMentionsContent = document.getElementById('legal-mentions-content');
    const closeLegalBtn = document.getElementById('close-legal-modal');
    let legalA11yCleanup = null;

    const closeLegalModal = () => {
        if (legalA11yCleanup) { legalA11yCleanup(); legalA11yCleanup = null; }
        legalMentionsModal.style.display = 'none';
    };

    if (legalMentionsLink) {
        legalMentionsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('assets/templates/mentions-legales.html');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const html = await response.text();
                legalMentionsContent.innerHTML = html;
                translatePage(legalMentionsModal);

                // Liste dynamique des versions de librairies H5P exportées dans les
                // activités (source de vérité : les métadonnées des processeurs).
                try {
                    const { getAllExportedH5PLibraries } = await import('../h5p/processors/index.js');
                    const listEl = legalMentionsModal.querySelector('#legal-h5p-libraries-list');
                    if (listEl) {
                        const libs = getAllExportedH5PLibraries();
                        listEl.innerHTML = libs
                            .map(l => `<li><span class="legal-h5p-name">${l.machineName}</span> <span class="legal-h5p-version">${l.major}.${l.minor}</span></li>`)
                            .join('');
                        const countEl = legalMentionsModal.querySelector('#legal-h5p-libraries-count');
                        if (countEl) countEl.textContent = `(${libs.length})`;
                    }
                } catch (err) {
                    console.error('Impossible de lister les versions de librairies H5P :', err);
                }

                legalMentionsModal.style.display = 'block';

                // Accessibilité : focus trap + Escape + restauration du focus
                legalA11yCleanup = setupModalAccessibility(legalMentionsModal, {
                    onClose: closeLegalModal,
                    focusSelector: '#close-legal-modal'
                });
            } catch (error) {
                console.error('Failed to fetch legal mentions:', error);
                showNotification(translations.error_loading_legal || 'Impossible de charger les mentions légales.', 'error');
            }
        });
    }

    if (closeLegalBtn && legalMentionsModal) {
        closeLegalBtn.addEventListener('click', closeLegalModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === legalMentionsModal) {
            closeLegalModal();
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
                        // Propager l'événement input vers l'original pour que les listeners (ex: vidage JSON en mode guidé) se déclenchent
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
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

                    // Bouton debug cloné → délègue au bouton original + synchronise fullscreen
                    const debugBtn = toolbar.querySelector('.debug-json-btn');
                    const clonedDebugBtn = overlay.querySelector('.debug-json-btn');
                    if (clonedDebugBtn && debugBtn) {
                        // Créer le diff panel pour le fullscreen
                        let fsDiffPanel = null;

                        clonedDebugBtn.addEventListener('click', () => {
                            // Déclencher le toggle sur le bouton original (gère l'état et le diff dans la modale)
                            debugBtn.click();

                            // Synchroniser l'apparence du bouton cloné
                            clonedDebugBtn.className = debugBtn.className;
                            const clonedSpan = clonedDebugBtn.querySelector('.toolbar-btn-text');
                            const origSpan = debugBtn.querySelector('.toolbar-btn-text');
                            if (clonedSpan && origSpan) clonedSpan.textContent = origSpan.textContent;

                            // Déterminer l'état actuel en regardant les classes du bouton original
                            const isDiff = debugBtn.classList.contains('debug-active-diff');

                            if (isDiff) {
                                // Mode diff : masquer la textarea fullscreen, afficher le diff panel
                                clonedTextarea.style.display = 'none';
                                // Récupérer le contenu du diff panel original
                                const origDiffPanel = textarea.parentElement?.querySelector('.debug-diff-panel');
                                if (origDiffPanel) {
                                    if (!fsDiffPanel) {
                                        fsDiffPanel = document.createElement('div');
                                        fsDiffPanel.className = 'debug-diff-panel';
                                        fullscreenModalContainer.appendChild(fsDiffPanel);
                                    }
                                    fsDiffPanel.innerHTML = origDiffPanel.innerHTML;
                                    fsDiffPanel.style.display = 'block';
                                }
                            } else {
                                // Mode healed ou raw : afficher la textarea, masquer le diff
                                clonedTextarea.style.display = '';
                                clonedTextarea.value = textarea.value;
                                if (fsDiffPanel) fsDiffPanel.style.display = 'none';
                            }
                        });

                        // Synchroniser l'état initial (apparence + contenu) si le debug est déjà actif
                        clonedDebugBtn.className = debugBtn.className;
                        const initSpan = clonedDebugBtn.querySelector('.toolbar-btn-text');
                        const initOrigSpan = debugBtn.querySelector('.toolbar-btn-text');
                        if (initSpan && initOrigSpan) initSpan.textContent = initOrigSpan.textContent;

                        // Si on ouvre le fullscreen en mode diff, afficher le diff panel immédiatement
                        if (debugBtn.classList.contains('debug-active-diff')) {
                            clonedTextarea.style.display = 'none';
                            const origDiffPanel = textarea.parentElement?.querySelector('.debug-diff-panel');
                            if (origDiffPanel) {
                                fsDiffPanel = document.createElement('div');
                                fsDiffPanel.className = 'debug-diff-panel';
                                fsDiffPanel.innerHTML = origDiffPanel.innerHTML;
                                fsDiffPanel.style.display = 'block';
                                fullscreenModalContainer.appendChild(fsDiffPanel);
                            }
                        }
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
                                icon.classList.remove('fa-lock-open');
                                icon.classList.add('fa-lock');
                                btn.setAttribute('data-tooltip-key', 'unlock_prompt');
                                if (span) span.setAttribute('data-key', 'unlock_prompt');
                            } else {
                                icon.classList.remove('fa-lock');
                                icon.classList.add('fa-lock-open');
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

export function getCaramelVersionFromFooter() {
    const footer = document.querySelector('footer.footer');
    if (!footer) {
        return null;
    }

    const footerLink = footer.querySelector('a[href*="CHANGELOG"]');
    const versionText = footerLink?.textContent?.trim() || footer.textContent?.trim();
    if (!versionText) {
        return null;
    }

    const versionMatch = versionText.match(/v?(\d+(?:\.\d+)*)/i);
    return versionMatch ? versionMatch[1] : null;
}

/**
 * Synchronise les hauteurs des sections correspondantes entre les deux modal-panels.
 * @param {HTMLElement} container - Le conteneur parent (.modal-main-content ou sidebar)
 */
export function syncPanelHeights(container) {
    const panels = container.querySelectorAll('.modal-panel');
    if (panels.length !== 2) return;

    const [leftPanel, rightPanel] = panels;

    // Sélecteurs des sections à synchroniser
    const sections = [
        '.modal-panel-header',
        '.floating-toolbar',
        '.modal-panel-footer'
    ];

    sections.forEach(selector => {
        const leftSection = leftPanel.querySelector(selector);
        const rightSection = rightPanel.querySelector(selector);

        if (leftSection && rightSection) {
            // Reset les hauteurs pour mesurer la hauteur naturelle
            leftSection.style.minHeight = '';
            rightSection.style.minHeight = '';

            // Mesurer les hauteurs naturelles
            const leftHeight = leftSection.offsetHeight;
            const rightHeight = rightSection.offsetHeight;

            // Appliquer la hauteur max aux deux
            const maxHeight = Math.max(leftHeight, rightHeight);
            leftSection.style.minHeight = `${maxHeight}px`;
            rightSection.style.minHeight = `${maxHeight}px`;
        }
    });
}

/**
 * Détecte la présence de formules mathématiques dans un objet JSON.
 * Recherche le pattern \\( qui marque le début d'une formule MathJax inline.
 *
 * @param {Object|string} content - L'objet JSON ou la chaîne à analyser
 * @returns {boolean} true si des formules mathématiques sont détectées
 */
// =======================================================================
// FORMATAGE DE DATES TIMELINE (H5P <-> locale)
// =======================================================================

/**
 * Formats de date par langue pour l'affichage convivial des dates H5P Timeline
 * H5P Timeline utilise le format interne "YYYY,M,D" (ex: "1789,7,14")
 */
const TIMELINE_DATE_FORMATS = {
    fr: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'JJ/MM/AAAA', yearPlaceholder: 'AAAA' },
    en: { order: ['MM', 'DD', 'YYYY'], sep: '/', placeholder: 'MM/DD/YYYY', yearPlaceholder: 'YYYY' },
    es: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'DD/MM/AAAA', yearPlaceholder: 'AAAA' },
    de: { order: ['DD', 'MM', 'YYYY'], sep: '.', placeholder: 'TT.MM.JJJJ', yearPlaceholder: 'JJJJ' },
    it: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'GG/MM/AAAA', yearPlaceholder: 'AAAA' },
    nl: { order: ['DD', 'MM', 'YYYY'], sep: '-', placeholder: 'DD-MM-JJJJ', yearPlaceholder: 'JJJJ' },
    pt: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'DD/MM/AAAA', yearPlaceholder: 'AAAA' },
    ar: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'DD/MM/YYYY', yearPlaceholder: 'YYYY' },
    zh: { order: ['YYYY', 'MM', 'DD'], sep: '/', placeholder: 'YYYY/MM/DD', yearPlaceholder: 'YYYY' },
    jp: { order: ['YYYY', 'MM', 'DD'], sep: '/', placeholder: 'YYYY/MM/DD', yearPlaceholder: 'YYYY' },
    el: { order: ['DD', 'MM', 'YYYY'], sep: '/', placeholder: 'HH/MM/EEEE', yearPlaceholder: 'EEEE' }
};

/**
 * Convertit une date H5P Timeline ("YYYY,M,D") en format locale convivial
 * @param {string} h5pDate - Date au format H5P (ex: "1789,7,14" ou "1789")
 * @param {string} lang - Code langue (fr, en, de, etc.)
 * @returns {string} Date formatée (ex: "14/07/1789" en fr)
 */
export function h5pDateToLocale(h5pDate, lang) {
    if (!h5pDate) return '';
    const parts = String(h5pDate).split(',').map(p => p.trim());
    const fmt = TIMELINE_DATE_FORMATS[lang] || TIMELINE_DATE_FORMATS['fr'];

    // Année seule
    if (parts.length === 1) return parts[0];

    const year = parts[0];
    const month = parts[1].padStart(2, '0');

    // Année + mois (rare mais possible)
    if (parts.length === 2) {
        const result = [];
        for (const part of fmt.order) {
            if (part === 'YYYY') result.push(year);
            else if (part === 'MM') result.push(month);
        }
        return result.join(fmt.sep);
    }

    // Date complète
    const day = parts[2].padStart(2, '0');
    const result = [];
    for (const part of fmt.order) {
        if (part === 'YYYY') result.push(year);
        else if (part === 'MM') result.push(month);
        else if (part === 'DD') result.push(day);
    }
    return result.join(fmt.sep);
}

/**
 * Convertit une date locale conviviale en format H5P Timeline ("YYYY,M,D")
 * @param {string} localeDate - Date au format locale (ex: "14/07/1789" en fr)
 * @param {string} lang - Code langue
 * @returns {string} Date au format H5P (ex: "1789,7,14")
 */
export function localeDateToH5p(localeDate, lang) {
    if (!localeDate) return '';
    const fmt = TIMELINE_DATE_FORMATS[lang] || TIMELINE_DATE_FORMATS['fr'];

    // Année seule (pas de séparateur)
    if (!localeDate.includes(fmt.sep)) {
        return localeDate.trim();
    }

    const parts = localeDate.split(fmt.sep).map(p => p.trim());
    let year, month, day;

    for (let i = 0; i < fmt.order.length && i < parts.length; i++) {
        const val = parts[i];
        if (!val) continue;
        if (fmt.order[i] === 'YYYY') year = val;
        else if (fmt.order[i] === 'MM') month = val;
        else if (fmt.order[i] === 'DD') day = val;
    }

    if (!year) return localeDate; // Impossible de parser

    if (!day && month) {
        return `${year},${parseInt(month)}`;
    }

    if (day && month) {
        return `${year},${parseInt(month)},${parseInt(day)}`;
    }

    return year;
}

/**
 * Retourne le format de date pour une langue donnée
 * @param {string} lang - Code langue
 * @returns {Object} { order, sep, placeholder, yearPlaceholder }
 */
export function getTimelineDateFormat(lang) {
    return TIMELINE_DATE_FORMATS[lang] || TIMELINE_DATE_FORMATS['fr'];
}

export function detectMathInContent(content) {
    try {
        // Si content est déjà une chaîne, on l'utilise directement
        // Sinon, on sérialise l'objet en JSON
        const jsonString = typeof content === 'string'
            ? content
            : JSON.stringify(content);

        // Détection simple et performante via includes()
        // Pattern recherché : \\( (double backslash + parenthèse)
        // Dans le JSON, cela apparaît comme "\\\\(" (échappement JSON)
        return jsonString.includes('\\\\(');
    } catch (error) {
        console.warn('[MathDisplay] Erreur lors de la détection de formules mathématiques:', error);
        // En cas d'erreur, on garde MathDisplay par sécurité (comportement actuel)
        return true;
    }
}

// =======================================================================
// Accessibilité modale — focus trap, Escape, restauration du focus
// =======================================================================

/**
 * Active l'accessibilité clavier sur un élément modal :
 * - Piège le focus (Tab/Shift+Tab) à l'intérieur
 * - Ferme via Escape
 * - Restaure le focus sur l'élément déclencheur à la fermeture
 *
 * @param {HTMLElement} modal - L'élément modal (doit être visible dans le DOM)
 * @param {Object} options
 * @param {Function} options.onClose - Fonction appelée pour fermer la modale
 * @param {string} [options.focusSelector] - Sélecteur du premier élément à focuser (défaut : premier élément focusable)
 * @returns {Function} cleanup — à appeler lors de la fermeture pour retirer les listeners et restaurer le focus
 */
export function setupModalAccessibility(modal, { onClose, focusSelector } = {}) {
    const previousFocus = document.activeElement;

    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Vérifie qu'un élément est réellement visible (pas dans un conteneur overflow:hidden avec taille nulle)
    const isVisible = (el) => {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
        let node = el;
        while (node && node !== modal) {
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if ((style.overflow === 'hidden' || style.overflow === 'clip') &&
                node.offsetHeight === 0) return false;
            node = node.parentElement;
        }
        return true;
    };

    // Focus initial — délai pour laisser les transitions CSS (display:none → flex) s'appliquer
    setTimeout(() => {
        const target = focusSelector ? modal.querySelector(focusSelector) : modal.querySelector(FOCUSABLE);
        if (target) target.focus();
    }, 50);

    // Listener sur document pour intercepter Tab même si le focus est hors de la modale
    const handleKeydown = (e) => {
        // Fermeture via Escape
        if (e.key === 'Escape' && onClose) {
            e.stopPropagation();
            onClose();
            return;
        }

        // Focus trap via Tab
        if (e.key === 'Tab') {
            const focusable = [...modal.querySelectorAll(FOCUSABLE)].filter(isVisible);
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            // Si le focus est hors de la modale, le ramener dedans
            if (!modal.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
                return;
            }

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    document.addEventListener('keydown', handleKeydown);

    // Retourne la fonction de cleanup
    return () => {
        document.removeEventListener('keydown', handleKeydown);
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
    };
}
