import { t } from '../core/translation.js';
import { fieldRenderers, escapeHtml, generateId } from './field-renderers.js';
import { getNestedValue, setNestedValue } from './json-utils.js';

/**
 * Traduit un label
 */
function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

/**
 * Affiche une alerte personnalisée (remplace window.alert)
 * @param {string} message - Message à afficher
 * @param {string} title - Titre de l'alerte
 * @returns {Promise<void>}
 */
export function showAlert(message, title = null) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'json-editor__modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        const modalContent = document.createElement('div');
        modalContent.className = 'json-editor__modal-content confirm-modal';

        if (title) {
            const titleEl = document.createElement('h2');
            titleEl.style.margin = '0 0 12px 0';
            titleEl.style.fontSize = '18px';
            titleEl.style.fontWeight = '600';
            titleEl.style.color = '#333';
            titleEl.textContent = title;
            modalContent.appendChild(titleEl);
        }

        const messageEl = document.createElement('p');
        messageEl.style.margin = '0 0 24px 0';
        messageEl.style.fontSize = '14px';
        messageEl.style.lineHeight = '1.5';
        messageEl.style.color = '#666';
        messageEl.textContent = message;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '12px';
        buttonsContainer.style.justifyContent = 'flex-end';

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'json-editor__modal-btn json-editor__modal-btn--primary';
        okBtn.style.padding = '8px 16px';
        okBtn.style.borderRadius = '4px';
        okBtn.style.border = 'none';
        okBtn.style.backgroundColor = '#3498db';
        okBtn.style.color = 'white';
        okBtn.style.cursor = 'pointer';
        okBtn.style.fontSize = '14px';
        okBtn.style.fontWeight = '500';
        okBtn.textContent = t('editor_ok') || 'OK';

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        const closeModal = () => {
            document.removeEventListener('keydown', handleEscape);
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
            resolve();
        };

        okBtn.addEventListener('click', closeModal);
        document.addEventListener('keydown', handleEscape);

        buttonsContainer.appendChild(okBtn);
        modalContent.appendChild(messageEl);
        modalContent.appendChild(buttonsContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        okBtn.focus();

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
}

/**
 * Affiche une confirmation personnalisée (remplace window.confirm)
 * @param {string} message - Message de confirmation
 * @param {string} title - Titre de la confirmation
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {boolean} isDanger - Si true, bouton rouge (danger)
 * @returns {Promise<boolean>} true si confirmé, false sinon
 */
export function showConfirm(message, title = null, confirmText = null, cancelText = null, isDanger = false) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'json-editor__modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        const modalContent = document.createElement('div');
        modalContent.className = 'json-editor__modal-content confirm-modal';

        if (title) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'confirm-modal__header';
            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            headerDiv.appendChild(titleEl);
            modalContent.appendChild(headerDiv);
        }

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'confirm-modal__body';
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        bodyDiv.appendChild(messageEl);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'confirm-modal__footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'json-editor__modal-btn json-editor__modal-btn--secondary';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.border = '1px solid #ddd';
        cancelBtn.style.backgroundColor = '#f5f5f5';
        cancelBtn.style.color = '#333';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '14px';
        cancelBtn.style.fontWeight = '500';
        cancelBtn.textContent = cancelText || t('editor_cancel') || 'Annuler';

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = isDanger ? 'json-editor__modal-btn json-editor__modal-btn--danger' : 'json-editor__modal-btn json-editor__modal-btn--primary';
        confirmBtn.style.padding = '8px 16px';
        confirmBtn.style.borderRadius = '4px';
        confirmBtn.style.border = 'none';
        confirmBtn.style.backgroundColor = isDanger ? '#e74c3c' : '#3498db';
        confirmBtn.style.color = 'white';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.style.fontSize = '14px';
        confirmBtn.style.fontWeight = '500';
        confirmBtn.textContent = confirmText || t('editor_confirm') || 'Confirmer';

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal(false);
            }
        };

        const closeModal = (confirmed) => {
            document.removeEventListener('keydown', handleEscape);
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
            resolve(confirmed);
        };

        cancelBtn.addEventListener('click', () => closeModal(false));
        confirmBtn.addEventListener('click', () => closeModal(true));
        document.addEventListener('keydown', handleEscape);

        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        modalContent.appendChild(bodyDiv);
        modalContent.appendChild(buttonsContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        cancelBtn.focus();

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(false);
            }
        });
    });
}

/**
 * Affiche un modal de confirmation pour le changement de type de bloc
 * @returns {Promise<boolean>} true si confirmé, false sinon
 */
function showBlockTypeChangeConfirm() {
    return new Promise((resolve) => {
        // Créer le modal
        const modal = document.createElement('div');
        modal.className = 'json-editor__modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        // Créer le contenu du modal
        const modalContent = document.createElement('div');
        modalContent.className = 'json-editor__modal-content confirm-modal';

        const title = document.createElement('h2');
        title.style.margin = '0 0 12px 0';
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';
        title.style.color = '#333';
        title.textContent = t('editor_page_block_type_change_title') || 'Attention';

        const message = document.createElement('p');
        message.style.margin = '0 0 24px 0';
        message.style.fontSize = '14px';
        message.style.lineHeight = '1.5';
        message.style.color = '#666';
        message.textContent = t('editor_page_block_type_change_message') || 'Le contenu sera perdu.';

        // Créer les boutons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '12px';
        buttonsContainer.style.justifyContent = 'flex-end';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'json-editor__modal-btn json-editor__modal-btn--secondary';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.border = '1px solid #ddd';
        cancelBtn.style.backgroundColor = '#f5f5f5';
        cancelBtn.style.color = '#333';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '14px';
        cancelBtn.style.fontWeight = '500';
        cancelBtn.textContent = t('editor_page_block_type_change_cancel') || 'Annuler';

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
                resolve(false);
            }
        };

        const closeModal = (confirmed) => {
            document.removeEventListener('keydown', handleEscape);
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
            resolve(confirmed);
        };

        cancelBtn.addEventListener('click', () => {
            closeModal(false);
        });

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'json-editor__modal-btn json-editor__modal-btn--danger';
        confirmBtn.style.padding = '8px 16px';
        confirmBtn.style.borderRadius = '4px';
        confirmBtn.style.border = 'none';
        confirmBtn.style.backgroundColor = '#e74c3c';
        confirmBtn.style.color = 'white';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.style.fontSize = '14px';
        confirmBtn.style.fontWeight = '500';
        confirmBtn.textContent = t('editor_page_block_type_change_confirm') || 'Continuer';

        confirmBtn.addEventListener('click', () => {
            closeModal(true);
        });

        // Ajouter les boutons
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);

        // Assembler le modal
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(buttonsContainer);
        modal.appendChild(modalContent);

        // Ajouter au DOM
        document.body.appendChild(modal);

        // Focus sur le bouton Cancel par défaut
        cancelBtn.focus();

        // Fermer en cliquant en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(false);
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Vérifie si un objet de bloc a du contenu
 * @param {Object} blockData - Les données du bloc
 * @returns {boolean} true si le bloc contient du contenu
 */
function hasBlockContent(blockData) {
    if (!blockData || typeof blockData !== 'object') return false;

    // Vérifier si l'objet contient des propriétés non vides
    for (const [key, value] of Object.entries(blockData)) {
        if (value === null || value === undefined) continue;

        if (typeof value === 'string' && value.trim() !== '') return true;
        if (typeof value === 'number' && value !== 0) return true;
        if (Array.isArray(value) && value.length > 0) return true;
        if (typeof value === 'object' && Object.keys(value).length > 0) return true;
    }

    return false;
}

// =======================================================================
// CLASSE ARRAY MANAGER
// =======================================================================

/**
 * Gestionnaire de tableau pour l'editeur JSON
 */
export class ArrayManager {
    /**
     * @param {HTMLElement} container - Container DOM
     * @param {Array} items - Elements du tableau
     * @param {Object} config - Configuration du champ array
     * @param {string} path - Chemin dans les donnees
     * @param {Function} onChange - Callback de changement
     */
    constructor(container, items, config, path, onChange) {
        this.container = container;
        this.items = items || [];
        this.config = config;
        this.path = path;
        this.onChange = onChange;
        this.draggedIndex = null;
        this.draggedElement = null;

        this.render();
    }

    /**
     * Rend le tableau complet
     */
    render() {
        // Nettoyer les feedbackEditors orphelins dont le path commence par ce tableau
        // (ils sont recréés par renderDynamicObjectField lors du re-render)
        const { feedbackEditors } = window._jsonEditorFeedback || {};
        if (feedbackEditors) {
            const prefix = this.path + '.';
            for (const key of feedbackEditors.keys()) {
                if (key.startsWith(prefix)) {
                    feedbackEditors.delete(key);
                }
            }
        }

        this.container.innerHTML = '';
        this.container.className = 'json-editor__array';

        // Rendre chaque element
        this.items.forEach((item, index) => {
            const itemElement = this.renderItem(item, index);
            this.container.appendChild(itemElement);
        });

        // Bouton d'ajout (masqué si fixedLength ou maxItems atteint)
        if (!this.config.fixedLength && (!this.config.maxItems || this.items.length < this.config.maxItems)) {
            const addBtn = this.renderAddButton();
            this.container.appendChild(addBtn);
        }
    }

    /**
     * Rend un element du tableau
     */
    renderItem(item, index) {
        const element = document.createElement('div');
        element.className = 'json-editor__array-item';
        element.dataset.index = index;
        element.draggable = false;

        // Header avec numero et actions
        const header = document.createElement('div');
        header.className = 'json-editor__array-item-header';

        const itemLabel = translateLabel(this.config.itemLabel) || translateLabel('editor_element') || 'Element';
        const isFixedLength = this.config.fixedLength === true;

        // Actions disponibles selon la configuration
        let actionsHtml = `
            <button type="button" class="json-editor__array-btn" data-action="toggle" title="${translateLabel('editor_toggle') || 'Afficher/Masquer'}">
                <i class="fas fa-chevron-down"></i>
            </button>
            <button type="button" class="json-editor__array-btn json-editor__array-btn--drag" title="${translateLabel('editor_drag') || 'Deplacer'}">
                <i class="fas fa-grip-vertical"></i>
            </button>
        `;

        // Masquer duplication et suppression si fixedLength
        if (!isFixedLength) {
            actionsHtml += `
                <button type="button" class="json-editor__array-btn" data-action="duplicate" title="${translateLabel('editor_duplicate') || 'Dupliquer'}">
                    <i class="fas fa-copy"></i>
                </button>
                <button type="button" class="json-editor__array-btn json-editor__array-btn--danger" data-action="delete" title="${translateLabel('editor_delete') || 'Supprimer'}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }

        // Determiner un titre dynamique
        let dynamicTitle = '';
        if (item) {
            // Support pour dynamicTitleField configurable (ex: type de bloc Page)
            if (this.config.dynamicTitleField && item.hasOwnProperty(this.config.dynamicTitleField)) {
                const fieldValue = item[this.config.dynamicTitleField];
                // Ne pas afficher de titre si la valeur est vide
                if (fieldValue) {
                    const fieldSchema = this.config.itemSchema && this.config.itemSchema[this.config.dynamicTitleField];
                    if (fieldSchema && fieldSchema.options) {
                        const option = fieldSchema.options.find(o => o.value === fieldValue);
                        dynamicTitle = option ? option.label : fieldValue;
                    } else {
                        dynamicTitle = fieldValue;
                    }
                }
            }
            // Support pour metadata.title (H5P)
            else if (item.metadata && item.metadata.title) {
                dynamicTitle = item.metadata.title;
            }
            // Support pour params.question (H5P)
            else if (item.params && item.params.question) {
                // Nettoyer le HTML si present
                const tmp = document.createElement('div');
                tmp.innerHTML = item.params.question;
                dynamicTitle = tmp.textContent || tmp.innerText || '';
            }
            // Support direct pour title ou name
            else if (item.title) dynamicTitle = item.title;
            else if (item.name) dynamicTitle = item.name;
            else if (item.question) dynamicTitle = item.question;  // Moodle text
            else if (item.text) dynamicTitle = item.text;
            else if (item.word) dynamicTitle = item.word;
            else if (item.keyword) dynamicTitle = item.keyword;
        }

        if (dynamicTitle && dynamicTitle.length > 50) {
            dynamicTitle = dynamicTitle.substring(0, 50) + '...';
        }

        const displayLabel = dynamicTitle ? `<strong>${escapeHtml(dynamicTitle)}</strong>` : `${escapeHtml(itemLabel)} ${index + 1}`;

        // Ajouter une classe pour la couleur selon le type/library
        if (item) {
            if (item.library) {
                const lib = item.library.split(' ')[0].replace('H5P.', '').toLowerCase();
                element.classList.add(`json-editor__array-item--lib-${lib}`);
            } else if (item.type) {
                element.classList.add(`json-editor__array-item--type-${item.type}`);
            }
        }

        header.innerHTML = `
            <div class="json-editor__array-item-title">
                <span class="json-editor__array-item-number">${index + 1}</span>
                <span>${displayLabel}</span>
            </div>
            <div class="json-editor__array-item-actions">
                ${actionsHtml}
            </div>
        `;

        // Gestion du clic sur le header pour toggle
        header.addEventListener('click', (e) => {
            // Ne pas toggle si on clique sur un bouton
            if (e.target.closest('button')) return;
            this.toggleItem(element, index);
        });

        element.appendChild(header);

        // Contenu (champs de l'element)
        const content = document.createElement('div');
        content.className = 'json-editor__array-item-content';

        // Détection layout grille spécifique
        if (this.path === 'listOfTypes' || this.config.itemLabel === 'editor_chart_item') {
            content.dataset.type = 'chart-item';
        } else if (this.config.itemContentType) {
            content.dataset.type = this.config.itemContentType;
        }

        if (this.config.itemSchema) {
            // Verifier si c'est une valeur simple (isArrayValue)
            const valueField = Object.entries(this.config.itemSchema).find(([k, v]) => v.isArrayValue);

            if (valueField) {
                // Tableau de valeurs simples (ex: questions[] de strings)
                const [fieldKey, fieldConfig] = valueField;
                const renderer = fieldRenderers[fieldConfig.type] || fieldRenderers['text'];
                const fieldElement = renderer(
                    fieldConfig,
                    item, // La valeur est l'item lui-meme
                    (path, value) => this.handleItemChange(index, null, value),
                    `${this.path}.${index}`
                );
                content.appendChild(fieldElement);
            } else {
                // Tableau d'objets
                for (const [fieldKey, fieldConfig] of Object.entries(this.config.itemSchema)) {
                    // Champs cachés : préservés dans les données mais non affichés
                    if (fieldConfig.hidden) continue;

                    const fieldValue = item ? getNestedValue(item, fieldKey) : undefined;
                    const fieldPath = `${this.path}.${index}.${fieldKey}`;

                    // Gerer les tableaux imbriques (nested: true)
                    if (fieldConfig.type === 'array' && fieldConfig.nested) {
                        const nestedContainer = document.createElement('div');
                        nestedContainer.className = 'json-editor__field json-editor__field--array-nested';

                        const nestedLabel = translateLabel(fieldConfig.label);
                        nestedContainer.innerHTML = `
                            <label class="json-editor__label">${escapeHtml(nestedLabel)}</label>
                            <div class="json-editor__nested-array-content"></div>
                        `;

                        const nestedContent = nestedContainer.querySelector('.json-editor__nested-array-content');

                        // Creer un ArrayManager imbrique
                        const nestedManager = new ArrayManager(
                            nestedContent,
                            fieldValue || [],
                            fieldConfig,
                            fieldPath,
                            (path, value) => this.handleItemChange(index, fieldKey, value)
                        );

                        content.appendChild(nestedContainer);
                    } else if (fieldConfig.type === 'array') {
                        // Placeholder pour tableau - sera gere par editor-core
                        const arrayWrapper = document.createElement('div');
                        arrayWrapper.className = 'json-editor__field json-editor__field--array';
                        arrayWrapper.dataset.path = fieldPath;
                        arrayWrapper.dataset.config = JSON.stringify(fieldConfig);
                        content.appendChild(arrayWrapper);
                    } else if (fieldConfig.type === 'pageBlockData') {
                        // Champ spécial pour les blocs Page - nécessite le type de bloc
                        const blockType = item ? item.type : '';
                        const renderer = fieldRenderers['pageBlockData'];
                        const fieldElement = renderer(
                            fieldConfig,
                            fieldValue || {},
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath,
                            blockType // Passer le type de bloc en 5ème argument
                        );
                        content.appendChild(fieldElement);

                        // Écouter les changements de type pour reconstruire le bloc data
                        this.setupBlockTypeListener(element, index, content, fieldKey, fieldConfig, fieldPath, 'pageBlockData', '.type');
                    } else if (fieldConfig.type === 'dynamicObject') {
                        // Champ dynamique générique (ex: QuizSet params, Moodle Test content)
                        const selectorKey = fieldConfig.selector || 'type';
                        const selectorValue = item ? item[selectorKey] : '';

                        const renderer = fieldRenderers['dynamicObject'];
                        const fieldElement = renderer(
                            fieldConfig,
                            fieldValue || {},
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath,
                            selectorValue
                        );
                        content.appendChild(fieldElement);

                        // Listener sur le champ frère (le sélecteur)
                        // On cherche le select qui a le data-path finissant par selectorKey
                        this.setupDynamicObjectListener(element, index, content, fieldKey, fieldConfig, fieldPath, selectorKey);
                    } else if (fieldConfig.type === 'checkbox' && fieldConfig.inline) {
                        // Checkbox inline : grouper avec le champ precedent
                        const renderer = fieldRenderers['checkbox'];
                        const checkboxElement = renderer(
                            fieldConfig,
                            fieldValue,
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath
                        );
                        const prevField = content.lastElementChild;
                        if (prevField) {
                            const row = document.createElement('div');
                            row.className = 'json-editor__inline-checkbox-row';
                            content.removeChild(prevField);
                            row.appendChild(checkboxElement);
                            row.appendChild(prevField);
                            content.appendChild(row);
                        } else {
                            content.appendChild(checkboxElement);
                        }
                    } else if (fieldConfig.optionsFrom && (fieldConfig.type === 'select' || fieldConfig.type === 'multiCheckbox')) {
                        // Champ avec options dynamiques depuis un autre tableau
                        const dynamicOptions = this.getDynamicSelectOptions(fieldConfig.optionsFrom, fieldConfig.optionsLabelField || 'label');
                        const augmentedConfig = { ...fieldConfig, options: dynamicOptions };
                        const renderer = fieldRenderers[fieldConfig.type];
                        const defaultValue = fieldConfig.type === 'multiCheckbox' ? [] : '0';
                        const fieldElement = renderer(
                            augmentedConfig,
                            fieldValue !== undefined ? fieldValue : defaultValue,
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath
                        );
                        content.appendChild(fieldElement);
                    } else {
                        // Champ normal
                        const renderer = fieldRenderers[fieldConfig.type] || fieldRenderers['text'];
                        const fieldElement = renderer(
                            fieldConfig,
                            fieldValue,
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath
                        );
                        content.appendChild(fieldElement);
                    }
                }
            }
        }

        element.appendChild(content);

        // Replier par défaut (sauf si itemsExpanded est activé)
        if (!this.config.itemsExpanded) {
            content.style.display = 'none';
            const collapseIcon = element.querySelector('[data-action="toggle"] i');
            if (collapseIcon) collapseIcon.className = 'fas fa-chevron-right';
            element.classList.add('json-editor__array-item--collapsed');
        }

        // Event listeners pour les actions
        this.attachItemListeners(element, index);

        return element;
    }

    /**
     * Rend le bouton d'ajout
     */
    renderAddButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'json-editor__add-btn';

        const addLabel = translateLabel(this.config.addLabel) || translateLabel('editor_add_item') || 'Ajouter';
        btn.innerHTML = `<i class="fas fa-plus"></i> ${escapeHtml(addLabel)}`;

        btn.addEventListener('click', () => this.addItem());

        return btn;
    }

    /**
     * Attache les listeners a un element
     */
    attachItemListeners(element, index) {
        // Actions
        const duplicateBtn = element.querySelector('[data-action="duplicate"]');
        const deleteBtn = element.querySelector('[data-action="delete"]');

        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => this.duplicateItem(index));
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.removeItem(index));
        }

        // Toggle
        const toggleBtn = element.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleItem(element, index));
        }

        // Drag & Drop - uniquement depuis le bouton poignée
        const dragBtn = element.querySelector('.json-editor__array-btn--drag');
        if (dragBtn) {
            dragBtn.addEventListener('mousedown', () => { element.draggable = true; });
            dragBtn.addEventListener('mouseup', () => { element.draggable = false; });
        }
        element.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        element.addEventListener('dragover', (e) => this.handleDragOver(e, index));
        element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        element.addEventListener('drop', (e) => this.handleDrop(e, index));
    }

    // =======================================================================
    // EVENTS
    // =======================================================================

    /**
     * Replie/Deplie un element
     */
    toggleItem(element, index) {
        const content = element.querySelector('.json-editor__array-item-content');
        const icon = element.querySelector('[data-action="toggle"] i');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            if (icon) icon.className = 'fas fa-chevron-down';
            element.classList.remove('json-editor__array-item--collapsed');

            // Redimensionner les textareas maintenant qu'ils sont visibles
            requestAnimationFrame(() => {
                const textareas = content.querySelectorAll('textarea');
                textareas.forEach(textarea => {
                    textarea.style.height = 'auto';
                    const isInSubsection = textarea.closest('.json-editor__array-item-subsection-content') !== null;
                    const minH = isInSubsection ? 30 : 60;
                    const newHeight = Math.max(textarea.scrollHeight, minH);
                    textarea.style.height = Math.min(newHeight, 300) + 'px';
                });
            });
        } else {
            content.style.display = 'none';
            if (icon) icon.className = 'fas fa-chevron-right';
            element.classList.add('json-editor__array-item--collapsed');
        }
    }

    /**
     * Ajoute un nouvel element
     */
    addItem(atIndex = -1) {
        // Creer un nouvel element vide base sur le schema
        const newItem = this.createEmptyItem();

        if (atIndex >= 0 && atIndex < this.items.length) {
            this.items.splice(atIndex + 1, 0, newItem);
        } else {
            this.items.push(newItem);
        }

        this.render();
        this.notifyChange();

        // Trouver le nouvel element
        const targetIndex = atIndex >= 0 && atIndex < this.items.length - 1 ? atIndex + 1 : this.items.length - 1;
        const newElement = this.container.querySelector(`[data-index="${targetIndex}"]`);
        if (newElement) {
            // Forcer l'état déplié sur le nouvel item (quel que soit itemsExpanded)
            const content = newElement.querySelector('.json-editor__array-item-content');
            const icon = newElement.querySelector('[data-action="toggle"] i');
            if (content) {
                content.style.display = 'block';
                if (icon) icon.className = 'fas fa-chevron-down';
                newElement.classList.remove('json-editor__array-item--collapsed');
            }
            newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus sur le premier champ
            const firstInput = newElement.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Supprime un element
     */
    async removeItem(index) {
        // Verifier le minimum
        if (this.config.minItems && this.items.length <= this.config.minItems) {
            await showAlert(
                translateLabel('editor_min_items_reached') || `Minimum ${this.config.minItems} element(s) requis`,
                translateLabel('editor_alert_title') || 'Information'
            );
            return;
        }

        // Confirmation
        const confirmMsg = translateLabel('editor_confirm_delete') || 'Voulez-vous vraiment supprimer cet element ?';
        const title = translateLabel('editor_confirm_delete_title') || 'Confirmer la suppression';
        const confirmText = translateLabel('editor_delete_btn') || 'Supprimer';
        const cancelText = translateLabel('editor_cancel') || 'Annuler';

        const confirmed = await showConfirm(confirmMsg, title, confirmText, cancelText, true);
        if (!confirmed) return;

        this.items.splice(index, 1);
        this.render();
        this.notifyChange();
    }

    /**
     * Duplique un element
     */
    async duplicateItem(index) {
        // Verifier le maximum
        if (this.config.maxItems && this.items.length >= this.config.maxItems) {
            await showAlert(
                translateLabel('editor_max_items_reached') || `Maximum ${this.config.maxItems} element(s) atteint`,
                translateLabel('editor_alert_title') || 'Information'
            );
            return;
        }

        const original = this.items[index];
        const duplicate = JSON.parse(JSON.stringify(original));

        this.items.splice(index + 1, 0, duplicate);
        this.render();
        this.notifyChange();
    }

    /**
     * Deplace un element
     */
    moveItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= this.items.length) return;
        if (toIndex < 0 || toIndex >= this.items.length) return;

        const item = this.items.splice(fromIndex, 1)[0];
        this.items.splice(toIndex, 0, item);

        this.render();
        this.notifyChange();
    }

    /**
     * Cree un element vide base sur le schema
     */
    createEmptyItem() {
        if (!this.config.itemSchema) return {};

        // Verifier si c'est une valeur simple
        const valueField = Object.entries(this.config.itemSchema).find(([k, v]) => v.isArrayValue);
        if (valueField) {
            return ''; // Valeur simple vide
        }

        // Objet vide avec les champs du schema
        const item = {};
        for (const [key, fieldConfig] of Object.entries(this.config.itemSchema)) {
            let defaultValue;
            if (fieldConfig.type === 'array') {
                defaultValue = [];
            } else if (fieldConfig.type === 'dynamicObject') {
                // dynamicObject doit être un objet, jamais une chaîne
                defaultValue = {};
            } else if (fieldConfig.type === 'object' && fieldConfig.schema) {
                defaultValue = {};
                for (const subKey of Object.keys(fieldConfig.schema)) {
                    defaultValue[subKey] = '';
                }
            } else if (fieldConfig.type === 'checkbox') {
                defaultValue = fieldConfig.valueType === 'number' ? 0 : false;
            } else if (fieldConfig.type === 'number') {
                defaultValue = fieldConfig.default !== undefined ? fieldConfig.default : 0;
            } else if (fieldConfig.type === 'select' && fieldConfig.default) {
                // Utiliser la valeur par défaut si définie (crucial pour le selector dynamicObject)
                defaultValue = fieldConfig.default;
            } else {
                defaultValue = fieldConfig.default || '';
            }

            // Clés pointées (ex: 'metadata.title') → créer la structure imbriquée
            if (key.includes('.')) {
                setNestedValue(item, key, defaultValue);
            } else {
                item[key] = defaultValue;
            }
        }
        return item;
    }

    // =======================================================================
    // HANDLERS DE CHANGEMENT
    // =======================================================================

    /**
     * Gere le changement d'un champ dans un element
     */
    handleFieldChange(path, value) {
        // Mettre à jour this.items localement pour que getData() retourne les bonnes valeurs
        if (path.startsWith(this.path + '.')) {
            const relativePath = path.substring(this.path.length + 1);
            const parts = relativePath.split('.');
            const index = parseInt(parts[0], 10);
            if (!isNaN(index) && index >= 0 && index < this.items.length) {
                const fieldPath = parts.slice(1).join('.');
                if (fieldPath) {
                    if (!this.items[index]) {
                        this.items[index] = {};
                    }
                    setNestedValue(this.items[index], fieldPath, value);
                } else {
                    this.items[index] = value;
                }
            }
        }

        if (this.onChange) {
            this.onChange(path, value);
        }
    }

    /**
     * Gere le changement d'un element complet
     */
    handleItemChange(index, fieldKey, value) {
        if (fieldKey === null) {
            // Valeur simple
            this.items[index] = value;
        } else {
            // Propriete d'objet
            if (!this.items[index]) {
                this.items[index] = {};
            }
            setNestedValue(this.items[index], fieldKey, value);
        }
        this.notifyChange();
    }

    /**
     * Construit les options dynamiques pour un select optionsFrom
     */
    getDynamicSelectOptions(optionsFrom, labelField) {
        const editorData = window._jsonEditorData;
        if (!editorData) return [];
        const sourceArray = editorData[optionsFrom];
        if (!Array.isArray(sourceArray)) return [];
        return sourceArray.map((item, index) => ({
            value: String(index),
            label: item[labelField] || `Zone ${index + 1}`
        }));
    }

    /**
     * Notifie le parent du changement
     */
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.path, this.items);
        }
    }

    /**
     * Configure un listener pour pageBlockData (spécifique)
     */
    setupBlockTypeListener(element, index, content, dataFieldKey, dataFieldConfig, dataFieldPath) {
        this.setupDynamicObjectListener(element, index, content, dataFieldKey, dataFieldConfig, dataFieldPath, 'type', 'pageBlockData');
    }

    /**
     * Configure un listener générique pour les objets dynamiques
     */
    setupDynamicObjectListener(element, index, content, dataFieldKey, dataFieldConfig, dataFieldPath, selectorKey, rendererType = 'dynamicObject') {
        // Trouver le select du sélecteur
        // Il doit être dans le même item, donc on cherche dans 'element'
        // Le path du selecteur devrait être ...index.selectorKey
        // On cherche un input/select avec ce data-path

        // Note: querySelector avec suffisant est plus robuste que path exact parfois
        const itemPath = `${this.path}.${index}`;
        const selectorPath = `${itemPath}.${selectorKey}`;

        // IMPORTANT : Chercher dans 'content' car c'est là que les champs sont rendus
        // Le select n'est pas encore dans 'element' au moment de cet appel
        let selectorInput = content.querySelector(`[data-path="${selectorPath}"]`);

        // Fallback : chercher le select par classe si le path ne fonctionne pas
        if (!selectorInput) {
            const selects = content.querySelectorAll('select[data-path]');
            for (const select of selects) {
                const selectPath = select.getAttribute('data-path');
                if (selectPath && selectPath.endsWith(`.${selectorKey}`)) {
                    selectorInput = select;
                    break;
                }
            }
        }

        if (!selectorInput) {
            console.warn(`[ArrayManager] Selector input not found for path: ${selectorPath} in content`);
            return;
        }

        // Initialiser data-previous-value avec la valeur actuelle
        selectorInput.dataset.previousValue = selectorInput.value || '';

        selectorInput.addEventListener('change', async (e) => {
            const newValue = e.target.value;
            // Récupérer la valeur précédente depuis l'attribut data-previous-value
            const oldValue = e.target.dataset.previousValue || '';

            // Trouver et supprimer l'ancien champ
            // On utilise la classe CSS pour le cibler
            const cssClass = rendererType === 'pageBlockData' ? 'json-editor__field--page-block-data' : 'json-editor__field--dynamic-object';
            const oldDataField = content.querySelector(`.${cssClass}`);

            // Pour pageBlockData, vérifier s'il y a du contenu
            if (rendererType === 'pageBlockData' && oldDataField) {
                const oldData = this.items[index] ? this.items[index][dataFieldKey] : null;
                if (hasBlockContent(oldData)) {
                    // Afficher la confirmation
                    const confirmed = await showBlockTypeChangeConfirm();
                    if (!confirmed) {
                        // L'utilisateur a annulé - restaurer la valeur précédente
                        e.target.value = oldValue;
                        return;
                    }
                }
            }

            if (oldDataField) {
                oldDataField.remove();
            }

            // Pour pageBlockData, on reset les données. Pour dynamicObject générique, on pourrait vouloir ça aussi pour nettoyer.
            // On reset les données pour éviter les conflits de schema
            const newData = {};
            // Mise à jour du modèle
            if (!this.items[index]) this.items[index] = {};
            setNestedValue(this.items[index], dataFieldKey, newData);

            // Re-rendre le champ avec la nouvelle valeur de sélecteur
            const renderer = fieldRenderers[rendererType];
            const newDataField = renderer(
                dataFieldConfig,
                newData,
                (path, value) => this.handleFieldChange(path, value),
                dataFieldPath,
                newValue // La nouvelle valeur du sélecteur
            );

            // Insérer au bon endroit ?
            // Pour l'instant on append à la fin de content, ce qui est généralement ok car ces champs gros sont souvent à la fin.
            // Si on voulait respecter l'ordre exact, il faudrait des placeholder.
            // Mais content contient tous les champs de l'item.
            // On peut essayer de le remettre là où il était en utilisant oldDataField.nextSibling ? non il est remove.
            // On peut juste appendChild pour l'instant.
            content.appendChild(newDataField);

            // Mettre à jour le titre de l'élément pour afficher le nouveau type
            if (rendererType === 'pageBlockData' && this.config.dynamicTitleField) {
                this.updateItemTitle(element, index);
            }

            // Mettre à jour la valeur précédente pour le prochain changement
            e.target.dataset.previousValue = newValue;

            this.notifyChange();
        });
    }

    // =======================================================================
    // DRAG & DROP
    // =======================================================================

    handleDragStart(e, index) {
        this.draggedIndex = index;
        this.draggedElement = e.currentTarget;
        this.draggedElement.classList.add('json-editor__array-item--dragging');

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    }

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('json-editor__array-item--dragging');
            this.draggedElement.draggable = false;
        }
        this.draggedIndex = null;
        this.draggedElement = null;

        // Retirer les classes drag-over
        const items = this.container.querySelectorAll('.json-editor__array-item');
        items.forEach(item => item.classList.remove('json-editor__array-item--drag-over'));
    }

    handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this.draggedIndex === null || this.draggedIndex === index) return;

        const target = e.currentTarget;
        target.classList.add('json-editor__array-item--drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('json-editor__array-item--drag-over');
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('json-editor__array-item--drag-over');

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

        this.moveItem(this.draggedIndex, targetIndex);
    }

    /**
     * Met à jour le titre d'un élément
     */
    updateItemTitle(element, index) {
        const item = this.items[index];
        if (!item) return;

        const itemLabel = translateLabel(this.config.itemLabel) || translateLabel('editor_element') || 'Element';

        // Calculer le titre dynamique
        let dynamicTitle = '';
        if (this.config.dynamicTitleField && item.hasOwnProperty(this.config.dynamicTitleField)) {
            const fieldValue = item[this.config.dynamicTitleField];
            if (fieldValue) {
                const fieldSchema = this.config.itemSchema && this.config.itemSchema[this.config.dynamicTitleField];
                if (fieldSchema && fieldSchema.options) {
                    const option = fieldSchema.options.find(o => o.value === fieldValue);
                    dynamicTitle = option ? option.label : fieldValue;
                } else {
                    dynamicTitle = fieldValue;
                }
            }
        }
        // Support pour metadata.title (H5P)
        else if (item.metadata && item.metadata.title) {
            dynamicTitle = item.metadata.title;
        }
        // Support pour params.question (H5P)
        else if (item.params && item.params.question) {
            const tmp = document.createElement('div');
            tmp.innerHTML = item.params.question;
            dynamicTitle = tmp.textContent || tmp.innerText || '';
        }
        // Support direct pour title ou name
        else if (item.title) dynamicTitle = item.title;
        else if (item.name) dynamicTitle = item.name;
        else if (item.question) dynamicTitle = item.question;
        else if (item.text) dynamicTitle = item.text;
        else if (item.word) dynamicTitle = item.word;
        else if (item.keyword) dynamicTitle = item.keyword;

        if (dynamicTitle && dynamicTitle.length > 50) {
            dynamicTitle = dynamicTitle.substring(0, 50) + '...';
        }

        const displayLabel = dynamicTitle ? `<strong>${escapeHtml(dynamicTitle)}</strong>` : `${escapeHtml(itemLabel)} ${index + 1}`;

        // Mettre à jour le titre dans le DOM
        const titleSpan = element.querySelector('.json-editor__array-item-title > span:last-child');
        if (titleSpan) {
            titleSpan.innerHTML = displayLabel;
        }
    }

    // =======================================================================
    // API PUBLIQUE
    // =======================================================================

    /**
     * Retourne les donnees actuelles
     */
    getData() {
        return this.items;
    }

    /**
     * Met a jour les donnees
     */
    setData(items) {
        this.items = items || [];
        this.render();
    }

    /**
     * Retourne le nombre d'elements
     */
    getCount() {
        return this.items.length;
    }
}

// =======================================================================
// FACTORY FUNCTION
// =======================================================================

/**
 * Cree et initialise un ArrayManager
 * @param {HTMLElement} container - Container DOM
 * @param {Array} items - Elements initiaux
 * @param {Object} config - Configuration
 * @param {string} path - Chemin dans les donnees
 * @param {Function} onChange - Callback
 * @returns {ArrayManager}
 */
export function createArrayManager(container, items, config, path, onChange) {
    return new ArrayManager(container, items, config, path, onChange);
}
