/**
 * Array Manager - Gestion avancee des tableaux
 *
 * Gere les operations CRUD sur les tableaux (cards, answers, pairs, etc.)
 * avec support du drag & drop pour le reordonnancement.
 */

import { t } from '../translation.js';
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
        this.container.innerHTML = '';
        this.container.className = 'json-editor__array';

        // Rendre chaque element
        this.items.forEach((item, index) => {
            const itemElement = this.renderItem(item, index);
            this.container.appendChild(itemElement);
        });

        // Bouton d'ajout
        if (!this.config.maxItems || this.items.length < this.config.maxItems) {
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
        element.draggable = true;

        // Header avec numero et actions
        const header = document.createElement('div');
        header.className = 'json-editor__array-item-header';

        const itemLabel = translateLabel(this.config.itemLabel) || 'Element';
        header.innerHTML = `
            <div class="json-editor__array-item-title">
                <span class="json-editor__array-item-number">${index + 1}</span>
                <span>${escapeHtml(itemLabel)} ${index + 1}</span>
            </div>
            <div class="json-editor__array-item-actions">
                <button type="button" class="json-editor__array-btn json-editor__array-btn--drag" title="${translateLabel('editor_drag') || 'Deplacer'}">
                    <i class="fas fa-grip-vertical"></i>
                </button>
                <button type="button" class="json-editor__array-btn" data-action="duplicate" title="${translateLabel('editor_duplicate') || 'Dupliquer'}">
                    <i class="fas fa-copy"></i>
                </button>
                <button type="button" class="json-editor__array-btn json-editor__array-btn--danger" data-action="delete" title="${translateLabel('editor_delete') || 'Supprimer'}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        element.appendChild(header);

        // Contenu (champs de l'element)
        const content = document.createElement('div');
        content.className = 'json-editor__array-item-content';

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

        // Drag & Drop
        element.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        element.addEventListener('dragover', (e) => this.handleDragOver(e, index));
        element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        element.addEventListener('drop', (e) => this.handleDrop(e, index));
    }

    // =======================================================================
    // OPERATIONS CRUD
    // =======================================================================

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

        // Scroll vers le nouvel element
        const newElement = this.container.querySelector(`[data-index="${this.items.length - 1}"]`);
        if (newElement) {
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
    removeItem(index) {
        // Verifier le minimum
        if (this.config.minItems && this.items.length <= this.config.minItems) {
            alert(translateLabel('editor_min_items_reached') || `Minimum ${this.config.minItems} element(s) requis`);
            return;
        }

        // Confirmation
        const confirmMsg = translateLabel('editor_confirm_delete') || 'Voulez-vous vraiment supprimer cet element ?';
        if (!confirm(confirmMsg)) return;

        this.items.splice(index, 1);
        this.render();
        this.notifyChange();
    }

    /**
     * Duplique un element
     */
    duplicateItem(index) {
        // Verifier le maximum
        if (this.config.maxItems && this.items.length >= this.config.maxItems) {
            alert(translateLabel('editor_max_items_reached') || `Maximum ${this.config.maxItems} element(s) atteint`);
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
            if (fieldConfig.type === 'array') {
                item[key] = [];
            } else if (fieldConfig.type === 'object' && fieldConfig.schema) {
                item[key] = {};
                for (const subKey of Object.keys(fieldConfig.schema)) {
                    item[key][subKey] = '';
                }
            } else if (fieldConfig.type === 'checkbox') {
                item[key] = fieldConfig.valueType === 'number' ? 0 : false;
            } else if (fieldConfig.type === 'number') {
                item[key] = 0;
            } else {
                item[key] = '';
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
     * Notifie le parent du changement
     */
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.path, this.items);
        }
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
