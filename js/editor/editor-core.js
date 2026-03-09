/**
 * Editor Core - Moteur principal de rendu de l'editeur
 *
 * Orchestre le rendu de l'interface utilisateur basee sur le schema
 * et gere les interactions avec les donnees.
 */

import { t } from '../core/translation.js';
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

// Exposer createArrayManager globalement pour les renderers dynamiques (pageBlockData)
window._jsonEditorArrayManager = { createArrayManager };
// Note: createFeedbackEditor et feedbackEditors sont exposés globalement plus bas (après la déclaration de feedbackEditors)

// =======================================================================
// ETAT INTERNE
// =======================================================================

let editorData = null;
let editorSchema = null;
let editorOptions = null;
let arrayManagers = new Map();
let feedbackEditors = new Map();

// Exposer createFeedbackEditor et feedbackEditors pour les renderers dynamiques (QuizSet overallFeedback)
window._jsonEditorFeedback = { createFeedbackEditor, feedbackEditors };

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
    // Exposer editorData pour les selects dynamiques (optionsFrom)
    window._jsonEditorData = data;

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
        for (const section of schema.sections) {
            const sectionElement = renderSection(section, data, options.onChange, true);
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
            // Champs cachés : préservés dans les données mais non affichés
            if (fieldConfig.hidden) continue;

            if (fieldConfig.type === 'fieldGroup') {
                const groupEl = renderFieldGroup(fieldConfig, data, onChange);
                content.appendChild(groupEl);
            } else {
                const value = getNestedValue(data, fieldKey);
                const fieldElement = renderField(fieldKey, fieldConfig, value, onChange);
                content.appendChild(fieldElement);
            }
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

/**
 * Rend un groupe de champs (fieldGroup) — purement visuel, les champs restent au top level
 * Supporte le mode collapsible (fermé par défaut) et inline (côte à côte)
 */
function renderFieldGroup(groupConfig, data, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field-group';

    if (groupConfig.collapsible) {
        const label = t(groupConfig.collapsibleLabel) || groupConfig.collapsibleLabel || '';
        wrapper.innerHTML = `
            <div class="json-editor__field-group-header">
                <i class="fas fa-chevron-right"></i>
                <span>${escapeHtml(label)}</span>
            </div>
            <div class="json-editor__field-group-content"></div>
        `;

        const header = wrapper.querySelector('.json-editor__field-group-header');
        const content = wrapper.querySelector('.json-editor__field-group-content');

        header.addEventListener('click', () => {
            const expanded = wrapper.classList.toggle('json-editor__field-group--expanded');
            header.querySelector('i').className = expanded
                ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
            content.style.display = expanded ? '' : 'none';
        });

        // Fermé par défaut
        content.style.display = 'none';

        const fieldsContainer = document.createElement('div');
        if (groupConfig.inline) fieldsContainer.className = 'json-editor__field-row';

        for (const [subKey, subConfig] of Object.entries(groupConfig.fields)) {
            const value = getNestedValue(data, subKey);
            const fieldElement = renderField(subKey, subConfig, value, onChange);
            fieldsContainer.appendChild(fieldElement);
        }

        content.appendChild(fieldsContainer);
    } else {
        // Non-collapsible
        const fieldsContainer = document.createElement('div');
        if (groupConfig.inline) fieldsContainer.className = 'json-editor__field-row';

        for (const [subKey, subConfig] of Object.entries(groupConfig.fields)) {
            const value = getNestedValue(data, subKey);
            const fieldElement = renderField(subKey, subConfig, value, onChange);
            fieldsContainer.appendChild(fieldElement);
        }

        wrapper.appendChild(fieldsContainer);
    }

    return wrapper;
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

    // Synchronisation cross-array : si un champ source de select dynamiques change,
    // rafraîchir les options de tous les selects qui en dépendent
    if (path.startsWith('dropZones')) {
        refreshDynamicSelects('dropZones');
    }

    // Notifier le parent
    if (onChange) {
        onChange(path, value);
    }
}

/**
 * Rafraîchit les options de tous les champs dynamiques liés à un champ source.
 * Gère les <select> et les groupes multiCheckbox.
 */
function refreshDynamicSelects(sourcePath) {
    const container = document.querySelector('.json-editor');
    if (!container || !editorData) return;

    const sourceArray = getNestedValue(editorData, sourcePath) || [];

    // --- Rafraîchir les <select> dynamiques ---
    const dynamicSelects = container.querySelectorAll(
        `select[data-options-from="${sourcePath}"]`
    );
    dynamicSelects.forEach(select => {
        const labelField = select.dataset.optionsLabelField || 'label';
        const currentValue = select.value;

        select.innerHTML = '';
        sourceArray.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = item[labelField] || `Zone ${index + 1}`;
            if (String(index) === currentValue) option.selected = true;
            select.appendChild(option);
        });

        const maxIndex = sourceArray.length - 1;
        if (parseInt(currentValue, 10) > maxIndex && maxIndex >= 0) {
            select.value = String(maxIndex);
            select.dispatchEvent(new Event('change'));
        }
    });

    // --- Rafraîchir les groupes multiCheckbox dynamiques ---
    const dynamicGroups = container.querySelectorAll(
        `.json-editor__multi-checkbox-group[data-options-from="${sourcePath}"]`
    );
    dynamicGroups.forEach(group => {
        const labelField = group.dataset.optionsLabelField || 'label';
        const path = group.dataset.path;

        // Récupérer les indices cochés actuellement
        const checkedValues = Array.from(group.querySelectorAll('input:checked'))
            .map(cb => Number(cb.value));
        // Filtrer les indices hors limites
        const maxIdx = sourceArray.length - 1;
        const validChecked = checkedValues.filter(v => v >= 0 && v <= maxIdx);

        // Reconstruire les checkboxes
        group.innerHTML = '';
        sourceArray.forEach((item, index) => {
            const id = 'field_' + Math.random().toString(36).substr(2, 9);
            const isChecked = validChecked.includes(index);
            const itemLabel = item[labelField] || `Zone ${index + 1}`;
            const label = document.createElement('label');
            label.className = 'json-editor__multi-checkbox-item';
            label.setAttribute('for', id);
            label.innerHTML = `
                <input type="checkbox" id="${id}" value="${index}"
                       ${isChecked ? 'checked' : ''} class="json-editor__multi-checkbox-input">
                <span class="json-editor__multi-checkbox-label">${itemLabel}</span>
            `;
            group.appendChild(label);
        });

        // Ré-attacher le listener de changement
        group.addEventListener('change', () => {
            const checked = Array.from(group.querySelectorAll('input:checked'))
                .map(cb => Number(cb.value));
            if (path) {
                handleFieldChange(path, checked);
            }
        });

        // Si des indices ont été supprimés, notifier le changement
        if (validChecked.length !== checkedValues.length && path) {
            handleFieldChange(path, validChecked);
        }
    });
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
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
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
 * Note: Ignore les inputs gérés par les ArrayManagers pour éviter les doublons
 */
function collectInputValues() {
    const container = document.querySelector('.json-editor');
    if (!container) return;

    // Créer une liste des paths gérés par les ArrayManagers
    const arrayManagerPaths = Array.from(arrayManagers.keys());

    // Inputs text/number
    const inputs = container.querySelectorAll('input[data-path], textarea[data-path], select[data-path]');
    inputs.forEach(input => {
        const path = input.dataset.path;
        if (!path) return;

        // Ignorer les inputs dont le path est géré par un ArrayManager
        // (ex: si arrayManagers a 'blocks', ignorer 'blocks.0.data.title')
        const isInArrayManager = arrayManagerPaths.some(amPath =>
            path === amPath || path.startsWith(amPath + '.')
        );
        if (isInArrayManager) return;

        let value;
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'number') {
            value = input.value !== '' ? Number(input.value) : null;
        } else if (input.dataset.type === 'stringArray') {
            // Convertir le texte multi-lignes en tableau
            value = input.value.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
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
    window._jsonEditorData = null;
}
