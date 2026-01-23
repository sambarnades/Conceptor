/**
 * Field Renderers - Composants de rendu pour chaque type de champ
 *
 * Fournit les fonctions de rendu pour tous les types de champs
 * supportes par l'editeur JSON.
 */

import { t } from '../translation.js';
import { validateField } from './validators.js';

// =======================================================================
// UTILITAIRES
// =======================================================================

/**
 * Echappe le HTML pour eviter les injections
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Genere un ID unique
 */
export function generateId() {
    return 'field_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Traduit un label si c'est une cle de traduction
 */
function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

// =======================================================================
// RENDERERS DE CHAMPS
// =======================================================================

/**
 * Mapping des types vers les fonctions de rendu
 */
export const fieldRenderers = {
    'text': renderTextField,
    'textarea': renderTextareaField,
    'number': renderNumberField,
    'checkbox': renderCheckboxField,
    'select': renderSelectField,
    'array': renderArrayField,
    'object': renderObjectField,
    'feedbackRanges': renderFeedbackRangesField
};

/**
 * Rend un champ texte simple
 */
export function renderTextField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--text';

    const label = translateLabel(config.label);
    const placeholder = config.placeholder ? translateLabel(config.placeholder) : '';
    const hint = config.hint ? translateLabel(config.hint) : '';

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <input
            type="text"
            id="${id}"
            class="json-editor__input"
            value="${escapeHtml(value || '')}"
            placeholder="${escapeHtml(placeholder)}"
            ${config.required ? 'required' : ''}
            ${config.disabled ? 'disabled' : ''}
            data-path="${path}"
        >
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error"></span>
    `;

    const input = wrapper.querySelector('input');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    // Gestion du changement
    input.addEventListener('input', (e) => {
        const newValue = e.target.value;

        // Validation
        const validation = validateField(newValue, config);
        if (!validation.valid) {
            input.classList.add('json-editor__input--error');
            errorSpan.textContent = validation.errors[0] || '';
        } else {
            input.classList.remove('json-editor__input--error');
            errorSpan.textContent = '';
        }

        if (onChange) {
            onChange(path, newValue);
        }
    });

    // Validation initiale si valeur presente
    if (value && config.required) {
        const validation = validateField(value, config);
        if (!validation.valid) {
            input.classList.add('json-editor__input--error');
            errorSpan.textContent = validation.errors[0] || '';
        }
    }

    return wrapper;
}

/**
 * Rend une zone de texte multi-lignes
 */
export function renderTextareaField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--textarea';

    const label = translateLabel(config.label);
    const placeholder = config.placeholder ? translateLabel(config.placeholder) : '';
    const hint = config.hint ? translateLabel(config.hint) : '';
    const largeClass = config.large ? 'json-editor__textarea--large' : '';

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <textarea
            id="${id}"
            class="json-editor__textarea ${largeClass}"
            placeholder="${escapeHtml(placeholder)}"
            ${config.required ? 'required' : ''}
            ${config.disabled ? 'disabled' : ''}
            data-path="${path}"
        >${escapeHtml(value || '')}</textarea>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error"></span>
    `;

    const textarea = wrapper.querySelector('textarea');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    // Auto-resize
    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    };

    textarea.addEventListener('input', (e) => {
        const newValue = e.target.value;
        autoResize();

        // Validation
        const validation = validateField(newValue, config);
        if (!validation.valid) {
            textarea.classList.add('json-editor__textarea--error');
            errorSpan.textContent = validation.errors[0] || '';
        } else {
            textarea.classList.remove('json-editor__textarea--error');
            errorSpan.textContent = '';
        }

        if (onChange) {
            onChange(path, newValue);
        }
    });

    // Resize initial
    setTimeout(autoResize, 0);

    return wrapper;
}

/**
 * Rend un champ numerique
 */
export function renderNumberField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--number';

    const label = translateLabel(config.label);

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <input
            type="number"
            id="${id}"
            class="json-editor__input"
            value="${value !== undefined && value !== null ? value : ''}"
            ${config.min !== undefined ? `min="${config.min}"` : ''}
            ${config.max !== undefined ? `max="${config.max}"` : ''}
            ${config.step !== undefined ? `step="${config.step}"` : ''}
            ${config.required ? 'required' : ''}
            data-path="${path}"
        >
        <span class="json-editor__error"></span>
    `;

    const input = wrapper.querySelector('input');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    input.addEventListener('input', (e) => {
        const newValue = e.target.value !== '' ? Number(e.target.value) : null;

        const validation = validateField(newValue, config);
        if (!validation.valid) {
            input.classList.add('json-editor__input--error');
            errorSpan.textContent = validation.errors[0] || '';
        } else {
            input.classList.remove('json-editor__input--error');
            errorSpan.textContent = '';
        }

        if (onChange) {
            onChange(path, newValue);
        }
    });

    return wrapper;
}

/**
 * Rend une case a cocher
 */
export function renderCheckboxField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--checkbox';

    const label = translateLabel(config.label);

    // Determiner si c'est coche
    let isChecked = false;
    if (config.valueType === 'number') {
        isChecked = value === 1;
    } else {
        isChecked = value === true || value === 'true';
    }

    wrapper.innerHTML = `
        <div class="json-editor__checkbox-wrapper">
            <input
                type="checkbox"
                id="${id}"
                class="json-editor__checkbox"
                ${isChecked ? 'checked' : ''}
                data-path="${path}"
            >
            <label class="json-editor__checkbox-label" for="${id}">
                ${escapeHtml(label)}
            </label>
        </div>
    `;

    const checkbox = wrapper.querySelector('input');

    checkbox.addEventListener('change', (e) => {
        let newValue;
        if (config.valueType === 'number') {
            newValue = e.target.checked ? 1 : 0;
        } else {
            newValue = e.target.checked;
        }

        if (onChange) {
            onChange(path, newValue);
        }
    });

    return wrapper;
}

/**
 * Rend une liste deroulante
 */
export function renderSelectField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--select';

    const label = translateLabel(config.label);

    let optionsHtml = '';
    if (config.options) {
        for (const opt of config.options) {
            const optLabel = translateLabel(opt.label);
            const selected = String(value) === String(opt.value) ? 'selected' : '';
            optionsHtml += `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(optLabel)}</option>`;
        }
    }

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <select
            id="${id}"
            class="json-editor__select"
            ${config.required ? 'required' : ''}
            data-path="${path}"
        >
            ${optionsHtml}
        </select>
        <span class="json-editor__error"></span>
    `;

    const select = wrapper.querySelector('select');

    select.addEventListener('change', (e) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(path, newValue);
        }
    });

    return wrapper;
}

/**
 * Rend un champ de type tableau (cards, answers, etc.)
 * Delegue au ArrayManager pour la gestion complete
 */
export function renderArrayField(config, value, onChange, path) {
    // Import dynamique pour eviter les dependances circulaires
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--array';
    wrapper.dataset.path = path;
    wrapper.dataset.config = JSON.stringify(config);

    // Le contenu sera rempli par editor-core.js via ArrayManager
    return wrapper;
}

/**
 * Rend un objet imbrique (tipsAndFeedback, etc.)
 */
export function renderObjectField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--object';

    const objValue = value || {};

    if (config.collapsible) {
        // Version pliable
        const collapsibleLabel = translateLabel(config.collapsibleLabel || config.label);
        wrapper.innerHTML = `
            <div class="json-editor__array-item-subsection">
                <div class="json-editor__array-item-subsection-header">
                    <i class="fas fa-chevron-right"></i>
                    <span>${escapeHtml(collapsibleLabel)}</span>
                </div>
                <div class="json-editor__array-item-subsection-content"></div>
            </div>
        `;

        const header = wrapper.querySelector('.json-editor__array-item-subsection-header');
        const content = wrapper.querySelector('.json-editor__array-item-subsection-content');
        const subsection = wrapper.querySelector('.json-editor__array-item-subsection');

        header.addEventListener('click', () => {
            subsection.classList.toggle('json-editor__array-item-subsection--expanded');
        });

        // Rendre les sous-champs
        if (config.schema) {
            for (const [subKey, subConfig] of Object.entries(config.schema)) {
                const subPath = `${path}.${subKey}`;
                const subValue = objValue[subKey];
                const renderer = fieldRenderers[subConfig.type] || renderTextField;
                const subField = renderer(subConfig, subValue, onChange, subPath);
                content.appendChild(subField);
            }
        }
    } else {
        // Version non-pliable
        wrapper.innerHTML = `
            <div class="json-editor__nested">
                <div class="json-editor__nested-title">
                    <i class="fas fa-cog"></i>
                    ${escapeHtml(translateLabel(config.label))}
                </div>
                <div class="json-editor__nested-content"></div>
            </div>
        `;

        const content = wrapper.querySelector('.json-editor__nested-content');

        if (config.schema) {
            for (const [subKey, subConfig] of Object.entries(config.schema)) {
                const subPath = `${path}.${subKey}`;
                const subValue = objValue[subKey];
                const renderer = fieldRenderers[subConfig.type] || renderTextField;
                const subField = renderer(subConfig, subValue, onChange, subPath);
                content.appendChild(subField);
            }
        }
    }

    return wrapper;
}

/**
 * Rend l'editeur de tranches de feedback
 * Delegue au FeedbackEditor pour la gestion complete
 */
export function renderFeedbackRangesField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--feedback-ranges';
    wrapper.dataset.path = path;
    wrapper.dataset.config = JSON.stringify(config);

    // Le contenu sera rempli par editor-core.js via FeedbackEditor
    return wrapper;
}

// =======================================================================
// SECTION PLIABLE
// =======================================================================

/**
 * Rend une section pliable
 * @param {Object} sectionConfig - Configuration de la section
 * @param {HTMLElement} content - Contenu de la section
 * @param {boolean} isExpanded - Etat initial
 * @param {number} count - Nombre d'elements (optionnel)
 * @returns {HTMLElement}
 */
export function renderCollapsibleSection(sectionConfig, content, isExpanded = true, count = null) {
    const section = document.createElement('div');
    section.className = `json-editor__section ${isExpanded ? 'json-editor__section--expanded' : ''}`;
    section.dataset.sectionId = sectionConfig.id;

    const label = translateLabel(sectionConfig.label);
    const icon = sectionConfig.icon || 'fa-folder';

    const countBadge = count !== null
        ? `<span class="json-editor__section-count">${count}</span>`
        : '';

    section.innerHTML = `
        <button class="json-editor__section-header" type="button">
            <span class="json-editor__section-title">
                <i class="fas ${icon}"></i>
                ${escapeHtml(label)}
                ${countBadge}
            </span>
            <i class="fas fa-chevron-down json-editor__section-icon"></i>
        </button>
        <div class="json-editor__section-content"></div>
    `;

    const header = section.querySelector('.json-editor__section-header');
    const contentContainer = section.querySelector('.json-editor__section-content');

    // Ajouter le contenu
    contentContainer.appendChild(content);

    // Toggle
    header.addEventListener('click', () => {
        section.classList.toggle('json-editor__section--expanded');
    });

    return section;
}

/**
 * Met a jour le compteur d'une section
 */
export function updateSectionCount(section, count) {
    const badge = section.querySelector('.json-editor__section-count');
    if (badge) {
        badge.textContent = count;
    } else if (count !== null) {
        const title = section.querySelector('.json-editor__section-title');
        if (title) {
            const newBadge = document.createElement('span');
            newBadge.className = 'json-editor__section-count';
            newBadge.textContent = count;
            title.appendChild(newBadge);
        }
    }
}

// =======================================================================
// BOUTONS D'ACTION
// =======================================================================

/**
 * Rend la barre d'actions de l'editeur
 */
export function renderActionBar(hasChanges, onSave, onCancel) {
    const bar = document.createElement('div');
    bar.className = 'json-editor__actions';

    bar.innerHTML = `
        <div class="json-editor__actions-left">
            <div class="json-editor__unsaved-indicator" style="display: ${hasChanges ? 'flex' : 'none'};">
                <i class="fas fa-exclamation-circle"></i>
                <span>${translateLabel('editor_unsaved_changes') || 'Modifications non sauvegardees'}</span>
            </div>
        </div>
        <div class="json-editor__actions-right">
            <button type="button" class="json-editor__btn json-editor__btn--secondary" data-action="cancel">
                <i class="fas fa-times"></i>
                ${translateLabel('editor_cancel') || 'Annuler'}
            </button>
            <button type="button" class="json-editor__btn json-editor__btn--primary" data-action="save">
                <i class="fas fa-save"></i>
                ${translateLabel('editor_save') || 'Enregistrer'}
            </button>
        </div>
    `;

    const cancelBtn = bar.querySelector('[data-action="cancel"]');
    const saveBtn = bar.querySelector('[data-action="save"]');

    cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
    });

    saveBtn.addEventListener('click', () => {
        if (onSave) onSave();
    });

    return bar;
}

/**
 * Rend l'en-tete de l'editeur
 */
export function renderEditorHeader(moduleName, moduleKey) {
    const header = document.createElement('div');
    header.className = 'json-editor__header';

    header.innerHTML = `
        <div class="json-editor__title">
            <i class="fas fa-edit json-editor__title-icon"></i>
            ${translateLabel('editor_title_prefix') || 'Edition :'} ${escapeHtml(moduleName)}
        </div>
        <span class="json-editor__type-badge">${escapeHtml(moduleKey)}</span>
    `;

    return header;
}
