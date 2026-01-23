/**
 * Editor Core - Moteur principal de rendu de l'editeur
 *
 * Orchestre le rendu de l'interface utilisateur basee sur le schema
 * et gere les interactions avec les donnees.
 */

import { t } from '../translation.js';
import {
    fieldRenderers,
    renderCollapsibleSection,
    renderActionBar,
    renderEditorHeader,
    updateSectionCount,
    escapeHtml
} from './field-renderers.js';
import { createArrayManager } from './array-manager.js';
import { createFeedbackEditor } from './feedback-editor.js';
import { getNestedValue } from './json-utils.js';

// =======================================================================
// ETAT INTERNE
// =======================================================================

let editorData = null;
let editorSchema = null;
let editorOptions = null;
let arrayManagers = new Map();
let feedbackEditors = new Map();

// =======================================================================
// RENDU PRINCIPAL
// =======================================================================

/**
 * Rend l'editeur complet
 * @param {HTMLElement} container - Container DOM
 * @param {Object} data - Donnees a editer
 * @param {Object} schema - Schema de l'editeur
 * @param {Object} options - Options (moduleKey, moduleName, onChange, onSave, onCancel)
 */
export function renderEditor(container, data, schema, options = {}) {
    // Sauvegarder l'etat
    editorData = data;
    editorSchema = schema;
    editorOptions = options;
    arrayManagers.clear();
    feedbackEditors.clear();

    // Nettoyer le container
    container.innerHTML = '';

    // Creer le wrapper principal
    const editor = document.createElement('div');
    editor.className = 'json-editor';

    // Header
    const header = renderEditorHeader(
        options.moduleName || options.moduleKey || 'Unknown',
        options.moduleKey || ''
    );
    editor.appendChild(header);

    // Sections
    if (schema.sections) {
        for (let i = 0; i < schema.sections.length; i++) {
            const section = schema.sections[i];
            const isFirstSection = i === 0;
            const sectionElement = renderSection(section, data, options.onChange, isFirstSection);
            editor.appendChild(sectionElement);
        }
    }

    // Barre d'actions
    const actionBar = renderActionBar(
        false,
        options.onSave,
        options.onCancel
    );
    editor.appendChild(actionBar);

    container.appendChild(editor);

    // Initialiser les composants speciaux (arrays, feedbacks)
    initializeSpecialFields(editor, data, options.onChange);
}

/**
 * Rend une section de l'editeur
 */
function renderSection(sectionConfig, data, onChange, isExpanded = false) {
    const content = document.createElement('div');
    content.className = 'json-editor__section-fields';

    // Rendre les champs de la section
    if (sectionConfig.fields) {
        for (const [fieldKey, fieldConfig] of Object.entries(sectionConfig.fields)) {
            const value = getNestedValue(data, fieldKey);
            const fieldElement = renderField(fieldKey, fieldConfig, value, onChange);
            content.appendChild(fieldElement);
        }
    }

    // Calculer le compteur si defini
    let count = null;
    if (sectionConfig.countField) {
        const countValue = getNestedValue(data, sectionConfig.countField);
        if (Array.isArray(countValue)) {
            count = countValue.length;
        }
    }

    // Creer la section pliable
    const section = renderCollapsibleSection(sectionConfig, content, isExpanded, count);

    return section;
}

/**
 * Rend un champ individuel
 */
function renderField(fieldKey, fieldConfig, value, onChange) {
    const renderer = fieldRenderers[fieldConfig.type];

    if (!renderer) {
        console.warn(`[Editor Core] Unknown field type: ${fieldConfig.type}`);
        return renderTextField(fieldConfig, value, onChange, fieldKey);
    }

    return renderer(fieldConfig, value, onChange, fieldKey);
}

/**
 * Rend un champ texte par defaut
 */
function renderTextField(config, value, onChange, path) {
    return fieldRenderers['text'](config, value, onChange, path);
}

// =======================================================================
// INITIALISATION DES CHAMPS SPECIAUX
// =======================================================================

/**
 * Initialise les champs speciaux (arrays, feedbacks) apres le rendu initial
 */
function initializeSpecialFields(container, data, onChange) {
    // Initialiser les ArrayManagers
    const arrayFields = container.querySelectorAll('.json-editor__field--array[data-path]');
    arrayFields.forEach(field => {
        const path = field.dataset.path;
        const configStr = field.dataset.config;

        if (path && configStr) {
            try {
                const config = JSON.parse(configStr);
                const value = getNestedValue(data, path);
                const manager = createArrayManager(field, value || [], config, path, (p, v) => {
                    handleFieldChange(p, v, onChange);
                    // Mettre a jour le compteur de section
                    updateArrayCount(container, path, v);
                });
                arrayManagers.set(path, manager);
            } catch (e) {
                console.error('[Editor Core] Error initializing array:', e);
            }
        }
    });

    // Initialiser les FeedbackEditors
    const feedbackFields = container.querySelectorAll('.json-editor__field--feedback-ranges[data-path]');
    feedbackFields.forEach(field => {
        const path = field.dataset.path;

        if (path) {
            const value = getNestedValue(data, path);
            const editor = createFeedbackEditor(field, value, path, (p, v) => {
                handleFieldChange(p, v, onChange);
            });
            feedbackEditors.set(path, editor);
        }
    });
}

/**
 * Gere le changement d'un champ
 */
function handleFieldChange(path, value, onChange) {
    // Mettre a jour les donnees locales
    setNestedValue(editorData, path, value);

    // Notifier le parent
    if (onChange) {
        onChange(path, value);
    }
}

/**
 * Met a jour le compteur d'un tableau dans sa section
 */
function updateArrayCount(container, path, value) {
    // Trouver la section contenant ce champ
    const sections = container.querySelectorAll('.json-editor__section');
    sections.forEach(section => {
        const arrayField = section.querySelector(`[data-path="${path}"]`);
        if (arrayField && Array.isArray(value)) {
            updateSectionCount(section, value.length);
        }
    });
}

// =======================================================================
// GESTION DES DONNEES
// =======================================================================

/**
 * Definit une valeur imbriquee dans un objet
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
        if (current[key] === undefined) {
            current[key] = isNaN(keys[i + 1]) ? {} : [];
        }
        current = current[key];
    }

    const lastKey = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : parseInt(keys[keys.length - 1]);
    current[lastKey] = value;
}

/**
 * Met a jour l'etat de l'editeur
 * @param {Object} newData - Nouvelles donnees partielles
 */
export function updateEditorState(newData) {
    if (!editorData) return;

    for (const [key, value] of Object.entries(newData)) {
        setNestedValue(editorData, key, value);
    }
}

/**
 * Retourne les donnees actuelles de l'editeur
 * @returns {Object}
 */
export function getEditorData() {
    // Collecter les donnees de tous les managers
    arrayManagers.forEach((manager, path) => {
        setNestedValue(editorData, path, manager.getData());
    });

    feedbackEditors.forEach((editor, path) => {
        setNestedValue(editorData, path, editor.getData());
    });

    // Collecter aussi depuis les inputs standards
    collectInputValues();

    return editorData;
}

/**
 * Collecte les valeurs des inputs standards
 */
function collectInputValues() {
    const container = document.querySelector('.json-editor');
    if (!container) return;

    // Inputs text/number
    const inputs = container.querySelectorAll('input[data-path], textarea[data-path], select[data-path]');
    inputs.forEach(input => {
        const path = input.dataset.path;
        if (!path) return;

        let value;
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            value = input.value !== '' ? Number(input.value) : null;
        } else {
            value = input.value;
        }

        setNestedValue(editorData, path, value);
    });
}

/**
 * Met a jour l'indicateur de modifications
 */
export function setHasChanges(hasChanges) {
    const indicator = document.querySelector('.json-editor__unsaved-indicator');
    if (indicator) {
        indicator.style.display = hasChanges ? 'flex' : 'none';
    }
}

// =======================================================================
// API POUR LES ARRAY MANAGERS
// =======================================================================

/**
 * Retourne un ArrayManager par son chemin
 * @param {string} path - Chemin du champ
 * @returns {ArrayManager|undefined}
 */
export function getArrayManager(path) {
    return arrayManagers.get(path);
}

/**
 * Retourne un FeedbackEditor par son chemin
 * @param {string} path - Chemin du champ
 * @returns {FeedbackEditor|undefined}
 */
export function getFeedbackEditor(path) {
    return feedbackEditors.get(path);
}

/**
 * Rafraichit un champ specifique
 * @param {string} path - Chemin du champ
 * @param {*} newValue - Nouvelle valeur
 */
export function refreshField(path, newValue) {
    // Si c'est un ArrayManager
    const arrayManager = arrayManagers.get(path);
    if (arrayManager) {
        arrayManager.setData(newValue);
        return;
    }

    // Si c'est un FeedbackEditor
    const feedbackEditor = feedbackEditors.get(path);
    if (feedbackEditor) {
        feedbackEditor.setData(newValue);
        return;
    }

    // Sinon, trouver l'input correspondant
    const container = document.querySelector('.json-editor');
    if (!container) return;

    const input = container.querySelector(`[data-path="${path}"]`);
    if (input) {
        if (input.type === 'checkbox') {
            input.checked = !!newValue;
        } else {
            input.value = newValue !== null && newValue !== undefined ? newValue : '';
        }
    }
}

// =======================================================================
// UTILITAIRES
// =======================================================================

/**
 * Affiche un message de chargement
 */
export function showLoading(container) {
    container.innerHTML = `
        <div class="json-editor__loading">
            <div class="json-editor__loading-spinner"></div>
            <span>${t('editor_loading') || 'Chargement...'}</span>
        </div>
    `;
}

/**
 * Affiche un message d'erreur
 */
export function showError(container, message) {
    container.innerHTML = `
        <div class="json-editor__empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Nettoie l'editeur
 */
export function destroyEditorCore() {
    editorData = null;
    editorSchema = null;
    editorOptions = null;
    arrayManagers.clear();
    feedbackEditors.clear();
}
