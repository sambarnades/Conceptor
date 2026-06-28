/**
 * Field Renderers - Composants de rendu pour chaque type de champ
 *
 * Fournit les fonctions de rendu pour tous les types de champs
 * supportes par l'editeur JSON.
 */

import { t, currentLang } from '../core/translation.js';
import { validateField } from './validators.js';
import { h5pDateToLocale, localeDateToH5p, getTimelineDateFormat } from '../core/utils.js';
import { showConfirm } from './array-manager.js';
import { renderRichtextField } from './richtext-editor.js';
import { renderClozeField } from './cloze-editor.js';

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
    'color': renderColorField,
    'checkbox': renderCheckboxField,
    'select': renderSelectField,
    'multiCheckbox': renderMultiCheckboxField,
    'image': renderImageField,
    'array': renderArrayField,
    'object': renderObjectField,
    'feedbackRanges': renderFeedbackRangesField,
    'stringArray': renderStringArrayField,
    'stringArray': renderStringArrayField,
    'pageBlockData': renderPageBlockDataField,
    'dynamicObject': renderDynamicObjectField,
    'timelineDate': renderTimelineDateField,
    'rubricGrid': renderRubricGridField,
    'toggle': renderToggleField,
    'tagList': renderTagListField,
    'richtext': renderRichtextField,
    'cloze': renderClozeField,
    'timestamp': renderTimestampField
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
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
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
 * Rend un champ d'horodatage : saisie HH:MM:SS (ou MM:SS), stockage en SECONDES (number).
 * Utilisé par la Vidéo interactive. Pur (aucune dépendance Caramel) — partagé avec Sucrerie.
 */
export function renderTimestampField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--timestamp';

    const label = translateLabel(config.label);
    const hint = config.hint ? translateLabel(config.hint) : '';

    const toSeconds = (str) => {
        const v = String(str || '').trim();
        let m = v.match(/^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/);
        if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
        m = v.match(/^(\d{1,2}):([0-5]?\d)$/);
        if (m) return (+m[1]) * 60 + (+m[2]);
        return null;
    };
    // Tolérant : accepte un nombre de secondes OU une chaîne déjà au format "HH:MM:SS"/"MM:SS"
    // (une collecte DOM peut re-fournir la chaîne affichée). Sans ce parse, `Number("00:01:12")`
    // vaut NaN → l'horodatage retombait à "00:00:00" et la durée était perdue.
    const toHms = (s) => {
        if (typeof s === 'string' && s.includes(':')) { const p = toSeconds(s); s = (p == null ? 0 : p); }
        s = Math.max(0, Math.floor(Number(s) || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        const p = (n) => String(n).padStart(2, '0');
        return `${p(h)}:${p(m)}:${p(sec)}`;
    };

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <input
            type="text"
            id="${id}"
            class="json-editor__input json-editor__input--timestamp"
            value="${escapeHtml(toHms(value))}"
            placeholder="HH:MM:SS"
            inputmode="numeric"
            data-path="${path}"
            data-type="timestamp"
        >
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const input = wrapper.querySelector('input');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    input.addEventListener('input', (e) => {
        const raw = e.target.value;
        const secs = toSeconds(raw);
        if (secs === null && raw.trim() !== '') {
            input.classList.add('json-editor__input--error');
            errorSpan.textContent = t('editor_iv_timestamp_invalid') || 'Format attendu : HH:MM:SS';
            return; // ne pas propager une valeur invalide
        }
        input.classList.remove('json-editor__input--error');
        errorSpan.textContent = '';
        if (onChange) onChange(path, secs === null ? 0 : secs);
    });

    return wrapper;
}

/**
 * Rend un champ de date Timeline avec affichage au format locale
 * Stocke en interne le format H5P ("YYYY,M,D") mais affiche en format convivial (ex: "14/07/1789" en fr)
 */
function renderTimelineDateField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--text';

    const lang = currentLang || 'fr';
    const fmt = getTimelineDateFormat(lang);
    const isYearOnly = config.placeholder === 'YYYY';

    const label = translateLabel(config.label);
    const placeholder = isYearOnly ? fmt.yearPlaceholder : fmt.placeholder;
    const displayValue = isYearOnly ? (value || '') : h5pDateToLocale(value, lang);

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <input
            type="text"
            id="${id}"
            class="json-editor__input"
            value="${escapeHtml(displayValue)}"
            placeholder="${escapeHtml(placeholder)}"
            ${config.required ? 'required' : ''}
            data-path="${path}"
            data-timeline-date="true"
        >
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const input = wrapper.querySelector('input');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    // Sur chaque frappe : convertir en format H5P pour le modèle de données
    input.addEventListener('input', () => {
        const typed = input.value.trim();
        let h5pValue;

        if (isYearOnly) {
            h5pValue = typed;
        } else {
            h5pValue = localeDateToH5p(typed, lang);
        }

        if (onChange) {
            onChange(path, h5pValue);
        }
    });

    // Sur blur : reformater l'affichage proprement
    input.addEventListener('blur', () => {
        const typed = input.value.trim();
        if (!typed || isYearOnly) return;

        const h5pValue = localeDateToH5p(typed, lang);
        const reformatted = h5pDateToLocale(h5pValue, lang);

        if (reformatted && reformatted !== typed) {
            input.value = reformatted;
        }
    });

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
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const textarea = wrapper.querySelector('textarea');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    // Auto-resize — hauteur minimale réduite dans les sous-sections et feedback ranges
    const isInSubsection = textarea.closest('.json-editor__array-item-subsection-content') !== null;
    const isInFeedbackRange = textarea.closest('.json-editor__feedback-range-text') !== null;
    const minH = (isInSubsection || isInFeedbackRange) ? 28 : 60;
    const autoResize = () => {
        textarea.style.height = 'auto';
        const newHeight = Math.max(textarea.scrollHeight, minH);
        textarea.style.height = Math.min(newHeight, 300) + 'px';
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

    // Resize initial - utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    requestAnimationFrame(() => {
        autoResize();
    });

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
    const hint = config.hint ? translateLabel(config.hint) : '';

    // Si la valeur est absente mais qu'un default est défini, l'utiliser et persister
    let displayValue = value;
    if ((value === undefined || value === null) && config.default !== undefined) {
        displayValue = config.default;
        // Persister la valeur par défaut dans les données
        if (onChange) {
            onChange(path, config.default);
        }
    }

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <input
            type="number"
            id="${id}"
            class="json-editor__input"
            value="${displayValue !== undefined && displayValue !== null ? displayValue : ''}"
            ${config.min !== undefined ? `min="${config.min}"` : ''}
            ${config.max !== undefined ? `max="${config.max}"` : ''}
            ${config.step !== undefined ? `step="${config.step}"` : ''}
            ${config.required ? 'required' : ''}
            data-path="${path}"
        >
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
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
 * Rend un champ de selection de couleur
 */
export function renderColorField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--color';

    const label = translateLabel(config.label);
    const hint = config.hint ? translateLabel(config.hint) : '';

    // Valeur par défaut : utiliser config.default si défini, sinon #ffffff
    const hasValue = value && value !== '';
    const colorValue = hasValue ? value : (config.default || '#ffffff');

    // Initialiser la valeur dans les données si elle n'existe pas et qu'un default est défini
    if (!hasValue && config.default && onChange) {
        onChange(path, config.default);
    }

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <div class="json-editor__color-wrapper">
            <input
                type="color"
                id="${id}"
                class="json-editor__color-input"
                value="${escapeHtml(colorValue)}"
                ${config.required ? 'required' : ''}
                data-path="${path}"
            >
            <input
                type="text"
                class="json-editor__color-text"
                value="${escapeHtml(colorValue)}"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
            >
        </div>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const colorInput = wrapper.querySelector('input[type="color"]');
    const textInput = wrapper.querySelector('.json-editor__color-text');

    // Synchroniser les deux inputs
    colorInput.addEventListener('input', (e) => {
        const newValue = e.target.value;
        textInput.value = newValue;
        if (onChange) {
            onChange(path, newValue);
        }
    });

    textInput.addEventListener('input', (e) => {
        const newValue = e.target.value;
        // Valider le format hex
        if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
            colorInput.value = newValue;
            if (onChange) {
                onChange(path, newValue);
            }
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

    // Appliquer la valeur par defaut si la valeur est absente
    let effectiveValue = value;
    if ((effectiveValue === undefined || effectiveValue === null) && config.default !== undefined) {
        effectiveValue = config.default;
        // Persister la valeur par defaut dans les donnees
        if (onChange) onChange(path, config.valueType === 'number' ? (config.default ? 1 : 0) : config.default);
    }

    // Determiner si c'est coche
    let isChecked = false;
    if (config.valueType === 'number') {
        isChecked = effectiveValue === 1 || effectiveValue === true;
    } else {
        isChecked = effectiveValue === true || effectiveValue === 'true';
    }

    wrapper.innerHTML = `
        <div class="json-editor__checkbox-wrapper">
            <input
                type="checkbox"
                id="${id}"
                class="json-editor__checkbox"
                ${isChecked ? 'checked' : ''}
                data-path="${path}"
                ${config.valueType === 'number' ? 'data-value-type="number"' : ''}
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
 * Convertit la valeur brute d'un <select> (toujours une string) vers le type
 * attendu par le modèle, selon config.valueType ('boolean' | 'number').
 * Indispensable pour les selects dont les options sont des booléens/nombres
 * (ex: Vrai/Faux), sinon le modèle stocke "true"/"false" et les comparaisons
 * strictes (=== true) côté simulateur/processeur échouent.
 */
function coerceSelectValue(raw, valueType) {
    if (valueType === 'boolean') return raw === true || raw === 'true';
    if (valueType === 'number') {
        const n = Number(raw);
        return Number.isNaN(n) ? raw : n;
    }
    return raw;
}

/**
 * Rend une liste deroulante
 */
export function renderSelectField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--select';

    const label = translateLabel(config.label);

    // Appliquer la valeur par defaut si la valeur est absente
    let effectiveValue = value;
    if ((effectiveValue === undefined || effectiveValue === null) && config.default !== undefined) {
        effectiveValue = config.default;
        if (onChange) onChange(path, config.default);
    }

    let optionsHtml = '';
    if (config.options) {
        for (const opt of config.options) {
            const optLabel = translateLabel(opt.label);
            const selected = String(effectiveValue) === String(opt.value) ? 'selected' : '';
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
            ${config.valueType ? `data-value-type="${config.valueType}"` : ''}
            ${config.optionsFrom ? `data-options-from="${config.optionsFrom}"` : ''}
            ${config.optionsLabelField ? `data-options-label-field="${config.optionsLabelField}"` : ''}
        >
            ${optionsHtml}
        </select>
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const select = wrapper.querySelector('select');

    select.addEventListener('change', (e) => {
        const newValue = coerceSelectValue(e.target.value, config.valueType);
        if (onChange) {
            onChange(path, newValue);

            // Support presets : applique les valeurs prédéfinies aux champs frères
            if (config.presets && config.presets[newValue]) {
                const preset = config.presets[newValue];
                // Les clés du preset sont des chemins absolus (ex: "theme.backgroundColor")
                for (const [targetPath, fieldValue] of Object.entries(preset)) {
                    onChange(targetPath, fieldValue);
                    // Mettre à jour les inputs visuels correspondants
                    // Remonter au conteneur le plus large pour trouver les champs frères
                    const container = wrapper.closest('.json-editor__detail') || wrapper.closest('.json-editor__section-content') || document;
                    const input = container.querySelector(`[data-path="${targetPath}"]`);
                    if (input) {
                        input.value = fieldValue;
                        // Pour les color inputs, synchroniser aussi le champ texte adjacent
                        if (input.type === 'color') {
                            const textSibling = input.parentElement?.querySelector('.json-editor__color-text');
                            if (textSibling) textSibling.value = fieldValue;
                        }
                    }
                }
            }
        }
    });

    return wrapper;
}

/**
 * Rend un contrôle segmenté (toggle) avec des boutons visuels.
 * Utilisé pour choisir entre deux modes (ex: URL / Image).
 * Émet un événement 'change' compatible avec showWhen de array-manager.
 */
export function renderToggleField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--toggle';

    const label = translateLabel(config.label);

    // Input caché pour stocker la valeur et servir de cible data-path pour showWhen
    const currentValue = value || config.default || (config.options && config.options[0] ? config.options[0].value : '');

    let labelHtml = '';
    if (label) {
        labelHtml = `<label class="json-editor__label">${escapeHtml(label)}</label>`;
    }

    wrapper.innerHTML = `
        ${labelHtml}
        <input type="hidden" data-path="${path}" value="${escapeHtml(currentValue)}" />
        <div class="json-editor__toggle"></div>
    `;

    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const toggleContainer = wrapper.querySelector('.json-editor__toggle');

    // Icônes par défaut pour les options courantes
    const iconMap = { 'url': 'fa-link', 'image': 'fa-image' };

    for (const opt of (config.options || [])) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'json-editor__toggle-option';
        if (opt.value === currentValue) {
            btn.classList.add('json-editor__toggle-option--active');
        }

        const icon = opt.icon || iconMap[opt.value] || '';
        const optLabel = translateLabel(opt.label);
        btn.innerHTML = (icon ? `<i class="fas ${icon}"></i> ` : '') + escapeHtml(optLabel);
        btn.dataset.value = opt.value;

        btn.addEventListener('click', () => {
            // Désactiver tous les boutons
            toggleContainer.querySelectorAll('.json-editor__toggle-option').forEach(b =>
                b.classList.remove('json-editor__toggle-option--active')
            );
            btn.classList.add('json-editor__toggle-option--active');

            // Mettre à jour l'input caché et déclencher change pour showWhen
            hiddenInput.value = opt.value;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

            if (onChange) {
                onChange(path, opt.value);
            }
        });

        toggleContainer.appendChild(btn);
    }

    return wrapper;
}

/**
 * Rend un groupe de checkboxes pour sélection multiple (ex: zones cibles d'une étiquette)
 * La valeur est un tableau d'indices sélectionnés.
 */
export function renderMultiCheckboxField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--multi-checkbox';

    const label = translateLabel(config.label);
    const hint = config.hint ? translateLabel(config.hint) : '';
    const selectedIndices = Array.isArray(value) ? value.map(v => Number(v)) : [];

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}">
            ${escapeHtml(label)}
        </label>
        <div class="json-editor__multi-checkbox-group"
             data-path="${path}"
             ${config.optionsFrom ? `data-options-from="${config.optionsFrom}"` : ''}
             ${config.optionsLabelField ? `data-options-label-field="${config.optionsLabelField}"` : ''}
        ></div>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const group = wrapper.querySelector('.json-editor__multi-checkbox-group');

    // Construire les checkboxes à partir des options
    if (config.options && config.options.length > 0) {
        buildMultiCheckboxOptions(group, config.options, selectedIndices, onChange, path);
    }

    return wrapper;
}

/**
 * Construit les checkboxes dans un groupe multiCheckbox
 */
function buildMultiCheckboxOptions(group, options, selectedIndices, onChange, path) {
    group.innerHTML = '';
    options.forEach(opt => {
        const id = generateId();
        const idx = Number(opt.value);
        const isChecked = selectedIndices.includes(idx);

        const item = document.createElement('label');
        item.className = 'json-editor__multi-checkbox-item';
        item.setAttribute('for', id);
        item.innerHTML = `
            <input type="checkbox" id="${id}" value="${escapeHtml(opt.value)}"
                   ${isChecked ? 'checked' : ''} class="json-editor__multi-checkbox-input">
            <span class="json-editor__multi-checkbox-label">${escapeHtml(translateLabel(opt.label))}</span>
        `;
        group.appendChild(item);
    });

    // Listener sur tout le groupe (délégation)
    group.addEventListener('change', () => {
        const checked = Array.from(group.querySelectorAll('input:checked'))
            .map(cb => Number(cb.value));
        if (onChange) {
            onChange(path, checked);
        }
    });
}

/**
 * Rend un champ image avec zone de drop, prévisualisation et bouton supprimer.
 * @param {Object} config - Configuration du champ (label, hint)
 * @param {Object|null} value - Valeur actuelle { path, mime, width, height, dataURL } ou null
 * @param {Function} onChange - Callback (path, newValue)
 * @param {string} path - Chemin dans le JSON (ex: "cards.0.image")
 */
export function renderImageField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--image';
    wrapper.dataset.path = path;

    const label = translateLabel(config.label) || 'Image';
    const hint = config.hint ? translateLabel(config.hint) : '';
    const altPlaceholder = translateLabel('editor_image_alt_placeholder') || 'Décrivez l\'image pour l\'accessibilité';

    // Déterminer si une image est déjà présente
    const hasImage = value && (value.dataURL || value.path);

    // Mode collapsible : envelopper le contenu dans un accordéon plié par défaut
    if (config.collapsible) {
        const collapsibleLabel = translateLabel(config.collapsibleLabel || config.label);
        const isExpanded = hasImage; // Déplier automatiquement si une image est déjà présente
        wrapper.innerHTML = `
            <div class="json-editor__array-item-subsection ${isExpanded ? 'json-editor__array-item-subsection--expanded' : ''}">
                <div class="json-editor__array-item-subsection-header">
                    <i class="fas fa-chevron-right"></i>
                    <span>${escapeHtml(collapsibleLabel)}</span>
                </div>
                <div class="json-editor__array-item-subsection-content">
                    <div class="json-editor__image-collapsible-inner"></div>
                </div>
            </div>
        `;
        const header = wrapper.querySelector('.json-editor__array-item-subsection-header');
        const subsection = wrapper.querySelector('.json-editor__array-item-subsection');
        header.addEventListener('click', () => {
            subsection.classList.toggle('json-editor__array-item-subsection--expanded');
        });

        // Créer le contenu image dans le conteneur interne
        const inner = wrapper.querySelector('.json-editor__image-collapsible-inner');
        const imageContent = renderImageFieldContent(config, value, onChange, path, label, hint, altPlaceholder, hasImage);
        inner.appendChild(imageContent);
        return wrapper;
    }

    const imageContent = renderImageFieldContent(config, value, onChange, path, label, hint, altPlaceholder, hasImage);
    wrapper.appendChild(imageContent);
    return wrapper;
}

/**
 * Rendu interne du contenu d'un champ image (dropzone, preview, événements).
 * Factorisé pour être utilisé en mode normal et en mode collapsible.
 */
function renderImageFieldContent(config, value, onChange, path, label, hint, altPlaceholder, hasImage) {
    const container = document.createElement('div');
    container.innerHTML = `
        <label class="json-editor__label">
            <i class="fas fa-image"></i> ${escapeHtml(label)}
        </label>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}

        <div class="json-editor__image-dropzone" style="${hasImage ? 'display:none' : ''}">
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                   class="json-editor__image-input" />
            <div class="json-editor__image-dropzone-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>${translateLabel('editor_image_drop_text') || 'Glissez une image ici ou cliquez pour parcourir'}</p>
                <span class="json-editor__image-hint">${translateLabel('editor_image_hint') || 'JPEG, PNG, WebP — max 5 Mo'}</span>
            </div>
        </div>

        <div class="json-editor__image-preview" style="${hasImage ? '' : 'display:none'}">
            <div class="json-editor__image-preview-container">
                <img class="json-editor__image-preview-img"
                     src="${hasImage && value.dataURL ? value.dataURL : ''}"
                     alt="${escapeHtml(value?.alt || '')}" />
                <button type="button" class="json-editor__image-remove-btn"
                        title="${translateLabel('editor_image_remove') || 'Supprimer l\'image'}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="json-editor__image-info">
                <span class="json-editor__image-dimensions">${hasImage && value.width ? `${value.width} × ${value.height} px` : ''}</span>
                <span class="json-editor__image-size"></span>
            </div>
        </div>
    `;

    const dropzone = container.querySelector('.json-editor__image-dropzone');
    const fileInput = container.querySelector('.json-editor__image-input');
    const preview = container.querySelector('.json-editor__image-preview');
    const previewImg = container.querySelector('.json-editor__image-preview-img');
    const removeBtn = container.querySelector('.json-editor__image-remove-btn');
    const dimensionsSpan = container.querySelector('.json-editor__image-dimensions');
    const sizeSpan = container.querySelector('.json-editor__image-size');

    /**
     * Traite un fichier image sélectionné ou déposé.
     */
    async function handleFile(file) {
        if (!file) return;

        try {
            // Import dynamique de image-manager (évite le chargement au démarrage)
            const { processImage, registerImage } = await import('../h5p/image-manager.js');

            const entry = await processImage(file);
            registerImage(path, entry);

            // Afficher la prévisualisation
            previewImg.src = entry.dataURL;
            dimensionsSpan.textContent = `${entry.width} × ${entry.height} px`;
            sizeSpan.textContent = `${Math.round(entry.compressedSize / 1024)} Ko`;

            dropzone.style.display = 'none';
            preview.style.display = '';

            // Notifier le changement
            onChange(path, {
                path: entry.h5pPath,
                mime: entry.mime,
                width: entry.width,
                height: entry.height,
                dataURL: entry.dataURL
            });

        } catch (err) {
            console.error('[ImageField] Erreur:', err);
            let msg;
            if (err.message === 'FORMAT_INVALID') {
                msg = translateLabel('editor_image_error_format') || 'Format non supporté. Utilisez JPEG, PNG ou WebP.';
            } else if (err.message === 'SIZE_EXCEEDED') {
                msg = translateLabel('editor_image_error_size') || 'Image trop volumineuse (max 5 Mo).';
            } else {
                msg = translateLabel('editor_image_error_processing') || 'Erreur lors du traitement de l\'image.';
            }
            // Afficher l'erreur sous la zone de drop
            showImageError(container, msg);
        }
    }

    // Événement : clic sur input file
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
        fileInput.value = ''; // Reset pour permettre de re-sélectionner le même fichier
    });

    // Événements : drag & drop
    dropzone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropzone.classList.add('json-editor__image-dropzone--dragover');
    });
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('json-editor__image-dropzone--dragover');
    });
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('json-editor__image-dropzone--dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('json-editor__image-dropzone--dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    // Événement : clic sur la zone de drop → ouvrir l'explorateur de fichiers
    dropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // Champ texte alternatif intégré (si altTextField est défini dans la config)
    let altInput = null;
    let altPath = null;
    if (config.altTextField) {
        // Calculer le path du champ alt : même parent que l'image, nom différent
        const pathParts = path.split('.');
        pathParts[pathParts.length - 1] = config.altTextField;
        altPath = pathParts.join('.');

        const altWrapper = document.createElement('div');
        altWrapper.className = 'json-editor__field json-editor__field--text json-editor__image-alt-field';
        const altLabel = translateLabel('editor_image_alt') || 'Texte alternatif';
        const altPlaceholderText = translateLabel('editor_image_alt_placeholder') || 'Décrivez l\'image pour l\'accessibilité';

        altWrapper.innerHTML = `
            <label class="json-editor__label">${escapeHtml(altLabel)}</label>
            <input type="text" class="json-editor__input"
                   placeholder="${escapeHtml(altPlaceholderText)}"
                   value="" />
        `;
        altInput = altWrapper.querySelector('input');
        altInput.addEventListener('input', () => {
            onChange(altPath, altInput.value);
        });
        container.appendChild(altWrapper);
    }

    // Champ select intégré (si selectField est défini dans la config)
    let selectInput = null;
    let selectPath = null;
    if (config.selectField) {
        const sf = config.selectField;
        const pathParts = path.split('.');
        pathParts[pathParts.length - 1] = sf.name;
        selectPath = pathParts.join('.');

        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'json-editor__field json-editor__field--select json-editor__image-select-field';
        const selectLabel = translateLabel(sf.label) || sf.name;

        const optionsHtml = sf.options.map(opt => {
            const optLabel = translateLabel(opt.label) || opt.value;
            const selected = opt.value === (sf.default || '') ? ' selected' : '';
            return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(optLabel)}</option>`;
        }).join('');

        selectWrapper.innerHTML = `
            <label class="json-editor__label">${escapeHtml(selectLabel)}</label>
            <select class="json-editor__select">${optionsHtml}</select>
        `;
        selectInput = selectWrapper.querySelector('select');
        selectInput.addEventListener('change', () => {
            onChange(selectPath, selectInput.value);
        });
        container.appendChild(selectWrapper);
    }

    // Événement : supprimer l'image
    removeBtn.addEventListener('click', async () => {
        const { unregisterImage } = await import('../h5p/image-manager.js');
        unregisterImage(path);

        previewImg.src = '';
        dimensionsSpan.textContent = '';
        sizeSpan.textContent = '';

        preview.style.display = 'none';
        dropzone.style.display = '';

        onChange(path, null);

        // Vider aussi le champ alt text si présent
        if (altInput) {
            altInput.value = '';
            onChange(altPath, '');
        }

        // Réinitialiser le select si présent
        if (selectInput && config.selectField) {
            selectInput.value = config.selectField.default || '';
            onChange(selectPath, selectInput.value);
        }
    });

    return container;
}

/**
 * Affiche un message d'erreur temporaire sous la zone de drop.
 */
function showImageError(wrapper, message) {
    // Supprimer l'erreur précédente si existante
    const existing = wrapper.querySelector('.json-editor__image-error');
    if (existing) existing.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'json-editor__image-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${escapeHtml(message)}`;
    wrapper.appendChild(errorDiv);

    // Supprimer après 5 secondes
    setTimeout(() => errorDiv.remove(), 5000);
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
                const { renderer, config: resolved } = _resolveRenderer(subConfig, subPath);
                const subField = renderer(resolved, subValue, onChange, subPath);
                content.appendChild(subField);
            }
        }
    } else if (config.noHeader) {
        // Version sans en-tête : sous-champs rendus directement, pas de div intermédiaire
        if (config.schema) {
            for (const [subKey, subConfig] of Object.entries(config.schema)) {
                const subPath = `${path}.${subKey}`;
                const subValue = objValue[subKey];
                const { renderer, config: resolved } = _resolveRenderer(subConfig, subPath);
                const subField = renderer(resolved, subValue, onChange, subPath);
                wrapper.appendChild(subField);
            }
        }
    } else {
        // Version non-pliable avec titre
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
                const { renderer, config: resolved } = _resolveRenderer(subConfig, subPath);
                const subField = renderer(resolved, subValue, onChange, subPath);
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

/**
 * Rend un champ pour un tableau de chaines (une par ligne)
 * Utilise pour badanswer dans Millionnaire, answers dans SingleChoiceSet
 */
export function renderStringArrayField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--string-array';

    const label = translateLabel(config.label);
    const hint = config.hint ? translateLabel(config.hint) : '';

    // Convertir le tableau en texte (une ligne par element)
    let textValue = '';
    if (Array.isArray(value)) {
        textValue = value.join('\n');
    } else if (typeof value === 'string') {
        textValue = value;
    }

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}" for="${id}">
            ${escapeHtml(label)}
        </label>
        <textarea
            id="${id}"
            class="json-editor__textarea"
            placeholder="${escapeHtml(hint)}"
            ${config.required ? 'required' : ''}
            ${config.disabled ? 'disabled' : ''}
            data-path="${path}"
            data-type="stringArray"
            rows="4"
        >${escapeHtml(textValue)}</textarea>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const textarea = wrapper.querySelector('textarea');
    const errorSpan = wrapper.querySelector('.json-editor__error');

    textarea.addEventListener('input', (e) => {
        const text = e.target.value;
        // Convertir le texte en tableau (une ligne = un element)
        const arrayValue = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Validation du nombre d'elements
        let hasError = false;
        if (config.minItems && arrayValue.length < config.minItems) {
            textarea.classList.add('json-editor__textarea--error');
            errorSpan.textContent = `Minimum ${config.minItems} element(s) requis`;
            hasError = true;
        } else if (config.maxItems && arrayValue.length > config.maxItems) {
            textarea.classList.add('json-editor__textarea--error');
            errorSpan.textContent = `Maximum ${config.maxItems} element(s) autorise(s)`;
            hasError = true;
        }

        if (!hasError) {
            textarea.classList.remove('json-editor__textarea--error');
            errorSpan.textContent = '';
        }

        if (onChange) {
            onChange(path, arrayValue);
        }
    });

    return wrapper;
}

// =======================================================================
// SECTION PLIABLE
// =======================================================================

/**
 * Rend un champ de type liste de tags (chips editables).
 * Valeur : tableau de chaines. Chaque mot est affiche dans une pastille.
 * Clic sur une pastille → edition en place. Bouton x → suppression. Champ + → ajout.
 */
export function renderTagListField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--tag-list';

    const label = translateLabel(config.label);
    const hint = config.hint ? translateLabel(config.hint) : '';
    const items = Array.isArray(value) ? [...value] : (typeof value === 'string' && value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);

    wrapper.innerHTML = `
        <label class="json-editor__label ${config.required ? 'json-editor__label--required' : ''}">
            ${escapeHtml(label)}
        </label>
        <div class="json-editor__tag-container" data-path="${path}"></div>
        ${hint ? `<span class="json-editor__hint">${escapeHtml(hint)}</span>` : ''}
        <span class="json-editor__error" role="alert" aria-live="assertive"></span>
    `;

    const container = wrapper.querySelector('.json-editor__tag-container');

    function notifyChange() {
        const tags = Array.from(container.querySelectorAll('.json-editor__tag'))
            .map(tag => tag.dataset.value)
            .filter(v => v && v.trim());
        if (onChange) onChange(path, tags);
    }

    function createTag(text) {
        const tag = document.createElement('span');
        tag.className = 'json-editor__tag';
        tag.dataset.value = text;
        tag.innerHTML = `
            <span class="json-editor__tag-text">${escapeHtml(text)}</span>
            <button type="button" class="json-editor__tag-remove" title="${translateLabel('editor_delete') || 'Supprimer'}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Clic sur le texte → edition en place
        const textSpan = tag.querySelector('.json-editor__tag-text');
        textSpan.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'json-editor__tag-edit';
            input.value = tag.dataset.value;
            input.size = Math.max(input.value.length, 3);

            tag.replaceChild(input, textSpan);
            input.focus();
            input.select();

            const finish = () => {
                const newVal = input.value.trim();
                if (newVal) {
                    tag.dataset.value = newVal;
                    const newSpan = document.createElement('span');
                    newSpan.className = 'json-editor__tag-text';
                    newSpan.textContent = newVal;
                    tag.replaceChild(newSpan, input);
                    // Re-attacher le listener
                    newSpan.addEventListener('click', () => textSpan.click());
                    notifyChange();
                } else {
                    tag.remove();
                    notifyChange();
                }
            };

            input.addEventListener('blur', finish);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); finish(); }
                if (e.key === 'Escape') { input.value = tag.dataset.value; finish(); }
            });
        });

        // Bouton supprimer
        tag.querySelector('.json-editor__tag-remove').addEventListener('click', () => {
            tag.remove();
            notifyChange();
        });

        return tag;
    }

    // Rendre les tags existants
    items.forEach(text => {
        container.appendChild(createTag(text));
    });

    // Champ d'ajout
    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'json-editor__tag-add';
    addInput.placeholder = translateLabel('editor_tag_add_placeholder') || '+';
    addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = addInput.value.trim().replace(/,/g, '');
            if (val) {
                container.insertBefore(createTag(val), addInput);
                addInput.value = '';
                notifyChange();
            }
        }
    });
    // Ajout aussi au blur si du texte est present
    addInput.addEventListener('blur', () => {
        const val = addInput.value.trim().replace(/,/g, '');
        if (val) {
            container.insertBefore(createTag(val), addInput);
            addInput.value = '';
            notifyChange();
        }
    });
    container.appendChild(addInput);

    return wrapper;
}

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

    // Traduit l'identifiant interne (ex: 'elea_millionnaire') vers son nom
    // affichable (ex: 'Millionnaire') via la clé i18n `<moduleName>_name`.
    // Les clés `elea_*_name` sont déjà présentes dans `js/locales/fr.json`.
    // Fallback sur l'identifiant brut si la clé manque (utile pour repérer
    // un nameKey absent du locale).
    const nameKey = `${moduleName}_name`;
    const translated = translateLabel(nameKey);
    const displayName = (translated && translated !== nameKey) ? translated : moduleName;

    header.innerHTML = `
        <div class="json-editor__title">
            <i class="fas fa-edit json-editor__title-icon"></i>
            ${translateLabel('editor_title_prefix') || 'Edition :'} ${escapeHtml(displayName)}
        </div>
    `;

    return header;
}

// =======================================================================
// POPOVER D'AIDE EDITEUR
// =======================================================================

/** Cache des templates d'aide deja charges */
const helpTemplateCache = {};

/**
 * Charge un template HTML depuis assets/templates/editor-help/ et remplace les {{cle}} par t(cle)
 */
export async function loadAndShowEditorHelp(moduleKey, moduleName) {
    if (!moduleKey) return;

    let html = helpTemplateCache[moduleKey];
    if (!html) {
        try {
            const resp = await fetch(`assets/templates/editor-help/${moduleKey}.html`);
            if (!resp.ok) return;
            html = await resp.text();
            helpTemplateCache[moduleKey] = html;
        } catch (e) {
            return;
        }
    }

    // Remplacer les {{cle}} par les traductions
    const content = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const translated = t(key);
        return (translated && translated !== key) ? translated : match;
    });

    showEditorHelpPopover(content, moduleName);
}

/**
 * Affiche le popover d'aide contextuel de l'editeur
 */
function showEditorHelpPopover(content, title) {
    closeEditorHelpPopover();

    const popover = document.createElement('div');
    popover.className = 'help-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-modal', 'true');

    const popoverTitle = `${escapeHtml(title)} — ${translateLabel('editor_help_popover_title') || "Guide d'édition"}`;
    const zoomLabel = translateLabel('help_download_zoom_in') || 'Agrandir le texte';
    const closeLabel = translateLabel('help_download_close') || 'Fermer';

    popover.innerHTML = `
        <div class="help-popover__header">
            <span class="help-popover__title">
                <i class="fas fa-circle-question" style="color:#007AFF;margin-right:6px;font-size:14px;"></i>
                ${popoverTitle}
            </span>
            <div class="help-popover__actions">
                <button class="help-popover__zoom" aria-label="${escapeHtml(zoomLabel)}" data-zoom="0">
                    <i class="fas fa-magnifying-glass-plus"></i>
                </button>
                <button class="help-popover__close" aria-label="${escapeHtml(closeLabel)}">
                    <i class="fas fa-xmark"></i>
                </button>
            </div>
        </div>
        <div class="help-popover__content">${content}</div>
    `;

    const backdrop = document.createElement('div');
    backdrop.className = 'help-popover__backdrop';
    document.body.appendChild(backdrop);
    document.body.appendChild(popover);

    // Zoom (3 niveaux : 100%, 125%, 150%)
    const zoomLevels = [100, 125, 150];
    const zoomBtn = popover.querySelector('.help-popover__zoom');
    const contentEl = popover.querySelector('.help-popover__content');
    zoomBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        let idx = parseInt(zoomBtn.dataset.zoom);
        idx = (idx + 1) % zoomLevels.length;
        zoomBtn.dataset.zoom = idx;
        contentEl.style.fontSize = idx === 0 ? '' : `${zoomLevels[idx]}%`;
        zoomBtn.querySelector('i').className = idx === zoomLevels.length - 1
            ? 'fas fa-magnifying-glass-minus' : 'fas fa-magnifying-glass-plus';
    });

    // Fermeture
    popover.querySelector('.help-popover__close').addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeEditorHelpPopover();
    });
    backdrop.addEventListener('click', () => closeEditorHelpPopover());

    const handleEsc = (ev) => { if (ev.key === 'Escape') closeEditorHelpPopover(); };
    document.addEventListener('keydown', handleEsc);
    popover._escHandler = handleEsc;
}

/**
 * Ferme le popover d'aide editeur
 */
function closeEditorHelpPopover() {
    const popover = document.querySelector('.help-popover');
    if (popover?._escHandler) document.removeEventListener('keydown', popover._escHandler);
    document.querySelector('.help-popover__backdrop')?.remove();
    popover?.remove();
}

// =======================================================================
// SCHEMAS DES BLOCS PAGE
// =======================================================================

/**
 * Définition des champs pour chaque type de bloc Page
 */
const pageBlockSchemas = {
    '#01_hero_header': {
        title: { type: 'text', label: 'editor_page_hero_title', required: true },
        subtitle: { type: 'text', label: 'editor_page_hero_subtitle' }
    },
    '#02_nav_summary': {
        links: {
            type: 'array', itemLabel: 'editor_link', addLabel: 'editor_add_link', minItems: 1,
            itemSchema: {
                href: { type: 'text', label: 'editor_anchor', required: true },
                text: { type: 'text', label: 'editor_link_text', required: true }
            }
        }
    },
    '#03_histo_reperes': {
        title: { type: 'text', label: 'editor_section_title' },
        cards: {
            type: 'array', itemLabel: 'editor_marker', addLabel: 'editor_add_marker', minItems: 1,
            itemSchema: {
                title: { type: 'text', label: 'editor_date_title', required: true },
                text: { type: 'textarea', label: 'editor_description', required: true }
            }
        }
    },
    '#04_callout_set': {
        title: { type: 'text', label: 'editor_title' },
        callouts: {
            type: 'array', itemLabel: 'editor_callout', addLabel: 'editor_add_callout', minItems: 1,
            itemSchema: {
                type: {
                    type: 'select', label: 'editor_callout_type', required: true,
                    options: [
                        { value: 'objectif', label: 'editor_callout_objective' },
                        { value: 'savoir', label: 'editor_callout_info' },
                        { value: 'alerte', label: 'editor_callout_alert' }
                    ]
                },
                text: { type: 'textarea', label: 'editor_content', required: true }
            }
        }
    },
    '#05_stats_cards': {
        title: { type: 'text', label: 'editor_title' },
        stats: {
            type: 'array', itemLabel: 'editor_statistic', addLabel: 'editor_add_statistic', minItems: 1,
            itemSchema: {
                value: { type: 'text', label: 'editor_value_example', required: true },
                label: { type: 'textarea', label: 'editor_description', required: true }
            }
        }
    },
    '#06_lexique_table': {
        title: { type: 'text', label: 'editor_glossary_title' },
        caption: { type: 'text', label: 'editor_caption' },
        headers: { type: 'stringArray', label: 'editor_headers_lines', hint: 'editor_headers_hint' },
        rows: {
            type: 'array', itemLabel: 'editor_entry', addLabel: 'editor_add_entry', minItems: 1,
            itemSchema: {
                _value: { type: 'stringArray', label: 'editor_cells_lines', isArrayValue: true, hint: 'editor_cells_hint' }
            }
        }
    },
    '#07_glossary_chips': {
        title: { type: 'text', label: 'editor_title' },
        chips: { type: 'stringArray', label: 'editor_keywords_lines', hint: 'editor_keyword_line_hint' }
    },
    '#08_monuments_grid': {
        title: { type: 'text', label: 'editor_grid_title' },
        cards: {
            type: 'array', itemLabel: 'editor_card', addLabel: 'editor_add_card', minItems: 1,
            itemSchema: {
                img_src: { type: 'text', label: 'editor_image_url' },
                img_alt: { type: 'text', label: 'editor_alt_text' },
                caption: { type: 'text', label: 'editor_legend' },
                title: { type: 'text', label: 'editor_title', required: true },
                text: { type: 'textarea', label: 'editor_description', required: true }
            }
        }
    },
    '#09_figures_comparison': {
        title: { type: 'text', label: 'editor_section_title', hint: 'editor_comparison_title_hint' },
        left: {
            type: 'object', label: 'editor_figure_left', collapsible: false,
            schema: {
                img_src: { type: 'text', label: 'editor_image_url' },
                img_alt: { type: 'text', label: 'editor_alt_text' },
                caption: { type: 'text', label: 'editor_legend', required: true }
            }
        },
        right: {
            type: 'object', label: 'editor_figure_right', collapsible: false,
            schema: {
                img_src: { type: 'text', label: 'editor_image_url' },
                img_alt: { type: 'text', label: 'editor_alt_text' },
                caption: { type: 'text', label: 'editor_legend', required: true }
            }
        },
        text: { type: 'textarea', label: 'editor_explanatory_text', hint: 'editor_comparison_explanation_hint' }
    },
    '#10_table_comparison': {
        title: { type: 'text', label: 'editor_table_title' },
        headers: { type: 'stringArray', label: 'editor_headers_lines', hint: 'editor_headers_col_hint' },
        rows: {
            type: 'array', itemLabel: 'editor_row', addLabel: 'editor_add_row', minItems: 1,
            itemSchema: {
                _value: { type: 'stringArray', label: 'editor_cells_lines', isArrayValue: true }
            }
        }
    },
    '#11_definition_box': {
        title: { type: 'text', label: 'editor_term_to_define', required: true },
        text: { type: 'textarea', label: 'editor_definition', required: true, hint: 'editor_definition_hint' }
    },
    '#12_context_paragraphs': {
        title: { type: 'text', label: 'editor_section_title' },
        paragraphs: { type: 'stringArray', label: 'editor_paragraphs', large: true, hint: 'editor_paragraphs_hint' }
    },
    '#13_monument_sheet_long': {
        title: { type: 'text', label: 'editor_doc_title', required: true },
        img_src: { type: 'text', label: 'editor_image_url' },
        img_alt: { type: 'text', label: 'editor_alt_text' },
        sections: {
            type: 'array', itemLabel: 'editor_section', addLabel: 'editor_add_section',
            itemSchema: {
                subtitle: { type: 'text', label: 'editor_section_subtitle', required: true },
                text: { type: 'textarea', label: 'editor_section_content', required: true }
            }
        }
    },
    '#14_faq_block': {
        title: { type: 'text', label: 'editor_faq_title' },
        questions: {
            type: 'array', itemLabel: 'editor_question', addLabel: 'editor_add_question', minItems: 1,
            itemSchema: {
                q: { type: 'textarea', label: 'editor_question', required: true },
                a: { type: 'textarea', label: 'editor_answer', required: true }
            }
        }
    },
    '#15_myths_realities': {
        title: { type: 'text', label: 'editor_title' },
        items: {
            type: 'array', itemLabel: 'editor_myth_reality', addLabel: 'editor_add_item', minItems: 1,
            itemSchema: {
                myth: { type: 'textarea', label: 'editor_myth', required: true },
                reality: { type: 'textarea', label: 'editor_reality', required: true }
            }
        }
    },
    '#16_method_image_desc': {
        title: { type: 'text', label: 'editor_method_title', required: true },
        steps: { type: 'stringArray', label: 'editor_steps_lines', hint: 'editor_steps_hint' },
        img_src: { type: 'text', label: 'editor_image_url' },
        img_alt: { type: 'text', label: 'editor_alt_text' },
        caption: { type: 'textarea', label: 'editor_legend' }
    },
    '#18_sito_graphy': {
        title: { type: 'text', label: 'editor_sitography_title' },
        links: {
            type: 'array', itemLabel: 'editor_link', addLabel: 'editor_add_link', minItems: 1,
            itemSchema: {
                href: { type: 'text', label: 'editor_url', required: true },
                text: { type: 'text', label: 'editor_display_text', required: true }
            }
        }
    },
    '#17_quote_bilingual': {
        quote_langue_initiale: { type: 'textarea', label: 'editor_quote_initial_language', required: true },
        quote_langue_arrivee: { type: 'textarea', label: 'editor_quote_arrival_language' },
        author: { type: 'text', label: 'editor_author_source' }
    }
};

/**
 * Rend les champs dynamiques d'un bloc Page selon son type
 */
export function renderPageBlockDataField(config, value, onChange, path, blockType) {
    // Import dynamique pour éviter les dépendances circulaires
    const { createArrayManager } = window._jsonEditorArrayManager || {};

    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--page-block-data';
    wrapper.dataset.path = path;
    wrapper.dataset.blockType = blockType || '';

    const dataValue = value || {};
    const schema = pageBlockSchemas[blockType];

    // Si le type de bloc n'est pas défini, afficher un message instructif
    if (!blockType || !schema) {
        const messageType = !blockType ? 'empty' : 'unknown';
        const messageHtml = messageType === 'empty'
            ? `<p style="color: #666; font-size: 14px; margin: 8px 0;"><i class="fas fa-arrow-up" style="color: #999;"></i> ${t('editor_select_block_type_first') || 'Veuillez d\'abord choisir un type de bloc ci-dessus'}</p>`
            : `<p style="color: #e74c3c; font-size: 14px; margin: 8px 0;"><i class="fas fa-exclamation-circle"></i> ${t('editor_unknown_block_type') || 'Type de bloc non reconnu'}</p>`;

        wrapper.innerHTML = messageHtml;

        // Pour le mode "unknown" (pas empty), ajouter un éditeur JSON brut
        if (messageType === 'unknown') {
            const jsonField = renderTextareaField(
                { label: 'editor_json_data', hint: 'editor_json_valid_format', large: true },
                JSON.stringify(dataValue, null, 2),
                (p, v) => {
                    try {
                        const parsed = JSON.parse(v);
                        if (onChange) onChange(path, parsed);
                    } catch (e) {
                        // JSON invalide - ne pas mettre à jour
                    }
                },
                path
            );
            wrapper.appendChild(jsonField);
        }
        return wrapper;
    }

    // Rendre les champs selon le schema du type de bloc
    for (const [fieldKey, fieldConfig] of Object.entries(schema)) {
        const fieldPath = `${path}.${fieldKey}`;
        const fieldValue = dataValue[fieldKey];

        if (fieldConfig.type === 'array' && createArrayManager) {
            // Créer un ArrayManager pour les tableaux imbriqués
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'json-editor__field json-editor__field--array-nested';

            const label = translateLabel(fieldConfig.label);
            const labelEl = document.createElement('label');
            labelEl.className = 'json-editor__label';
            labelEl.textContent = label;
            arrayContainer.appendChild(labelEl);

            const arrayContent = document.createElement('div');
            arrayContent.className = 'json-editor__nested-array-content';
            arrayContainer.appendChild(arrayContent);

            // Initialiser l'ArrayManager
            createArrayManager(
                arrayContent,
                fieldValue || [],
                { ...fieldConfig, nested: true },
                fieldPath,
                onChange
            );

            wrapper.appendChild(arrayContainer);
        } else if (fieldConfig.type === 'object') {
            // Rendre un objet imbriqué
            const renderer = fieldRenderers['object'] || renderObjectField;
            const fieldElement = renderer(fieldConfig, fieldValue, onChange, fieldPath);
            wrapper.appendChild(fieldElement);
        } else {
            // Champ simple — résoudre via richtext si applicable
            const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, fieldPath);
            const fieldElement = renderer(resolvedConfig, fieldValue, onChange, fieldPath);
            wrapper.appendChild(fieldElement);
        }
    }

    return wrapper;
}

/**
 * Exporte les schemas de blocs pour usage externe
 */
export function getPageBlockSchema(blockType) {
    return pageBlockSchemas[blockType] || null;
}

/**
 * Retourne tous les types de blocs disponibles
 */
export function getPageBlockTypes() {
    return Object.keys(pageBlockSchemas);
}

/**
 * Résout le renderer pour un champ via getRendererForField (exposé par editor-core.js).
 * Fallback sur le renderer par défaut si non disponible.
 */
function _resolveRenderer(fieldConfig, fieldPath) {
    const richtext = window._jsonEditorRichtext;
    if (richtext && richtext.getRendererForField) {
        return richtext.getRendererForField(fieldConfig, fieldPath);
    }
    return {
        renderer: fieldRenderers[fieldConfig.type] || renderTextField,
        config: fieldConfig
    };
}

/**
 * Rend un objet dynamique basé sur un champ sélecteur
 */
/**
 * Résout un sous-schéma à partir d'une chaîne de librairie en tolérant la version.
 * Essaie d'abord la correspondance exacte (ex: 'H5P.DragQuestion 1.15'), puis par
 * nom de librairie sans la version (ex: 'H5P.DragQuestion') — pour rester compatible
 * quand la version d'une activité est bumpée sans dupliquer les schémas, et pour
 * éditer aussi bien les anciens contenus (1.14) que les nouveaux (1.15).
 */
function resolveVersionedSchema(schemas, selectorValue) {
    if (!schemas || !selectorValue) return null;
    if (schemas[selectorValue]) return schemas[selectorValue];
    const name = String(selectorValue).split(' ')[0];
    for (const key in schemas) {
        if (key.split(' ')[0] === name) return schemas[key];
    }
    return null;
}

export function renderDynamicObjectField(config, value, onChange, path, selectorValue) {
    // Import dynamique pour éviter les dépendances circulaires
    const { createArrayManager } = window._jsonEditorArrayManager || {};

    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--dynamic-object';
    wrapper.dataset.path = path;
    wrapper.dataset.selectorValue = selectorValue || '';

    const dataValue = value || {};

    // Récupérer le schéma correspondant à la valeur du sélecteur
    // config.schemas est un objet { "valeur1": schema1, "valeur2": schema2 }
    const schema = resolveVersionedSchema(config.schemas, selectorValue);

    if (!schema && selectorValue) {
        // Type non reconnu mais sélecteur présent
        wrapper.innerHTML = `
            <div class="json-editor__hint" style="margin-bottom: 8px;">
                <i class="fas fa-info-circle"></i> ${t('editor_unknown_type') || 'Type non reconnu :'} ${escapeHtml(selectorValue)}
            </div>
        `;
        // Afficher éditeur brut pour ne pas perdre les données
        const jsonField = renderTextareaField(
            { label: 'Données brutes', large: true },
            JSON.stringify(dataValue, null, 2),
            (p, v) => {
                try {
                    const parsed = JSON.parse(v);
                    if (onChange) onChange(path, parsed);
                } catch (e) { }
            },
            path
        );
        wrapper.appendChild(jsonField);
        return wrapper;
    } else if (!schema) {
        // Pas de sélecteur ou pas de schéma (état initial vide ou invalid)
        return wrapper;
    }

    // Rendre les champs selon le schema sélectionné
    for (const [fieldKey, fieldConfig] of Object.entries(schema)) {
        const fieldPath = `${path}.${fieldKey}`;
        const fieldValue = dataValue[fieldKey];

        if (fieldConfig.type === 'array' && createArrayManager) {
            // Créer un ArrayManager pour les tableaux imbriqués
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'json-editor__field json-editor__field--array-nested';

            const label = translateLabel(fieldConfig.label);
            const labelEl = document.createElement('label');
            labelEl.className = 'json-editor__label';
            labelEl.textContent = label;
            arrayContainer.appendChild(labelEl);

            const arrayContent = document.createElement('div');
            arrayContent.className = 'json-editor__nested-array-content';
            arrayContainer.appendChild(arrayContent);

            createArrayManager(
                arrayContent,
                fieldValue || [],
                { ...fieldConfig, nested: true },
                fieldPath,
                onChange
            );

            wrapper.appendChild(arrayContainer);
        } else if (fieldConfig.type === 'object') {
            const renderer = fieldRenderers['object'] || renderObjectField;
            const fieldElement = renderer(fieldConfig, fieldValue, onChange, fieldPath);
            wrapper.appendChild(fieldElement);
        } else if (fieldConfig.type === 'dynamicObject') {
            // Support pour dynamicObject imbriqué si nécessaire (attention recursion)
            wrapper.innerHTML += `<div class="json-editor__error">Dynamic object nested not fully supported yet</div>`;
        } else if (fieldConfig.type === 'feedbackRanges') {
            // FeedbackRanges dans un dynamicObject : initialiser le FeedbackEditor directement
            // car le scan DOM de editor-core.js est déjà passé à ce stade
            const { createFeedbackEditor, feedbackEditors } = window._jsonEditorFeedback || {};
            if (createFeedbackEditor && feedbackEditors) {
                const feedbackWrapper = renderFeedbackRangesField(fieldConfig, fieldValue, onChange, fieldPath);
                wrapper.appendChild(feedbackWrapper);
                // Initialiser le FeedbackEditor immédiatement et l'enregistrer
                const editor = createFeedbackEditor(feedbackWrapper, fieldValue, fieldPath, (p, v) => {
                    if (onChange) onChange(p, v);
                });
                feedbackEditors.set(fieldPath, editor);
            } else {
                // Fallback si le global n'est pas disponible
                const renderer = fieldRenderers[fieldConfig.type] || renderTextField;
                const fieldElement = renderer(fieldConfig, fieldValue, onChange, fieldPath);
                wrapper.appendChild(fieldElement);
            }
        } else if (fieldConfig.type === 'fieldGroup') {
            // Groupe de champs purement visuel — les sous-champs restent au top level
            // Le chemin utilise ${path}.${subKey} (pas ${path}.layoutSettings.${subKey})
            // pour que les données soient écrites au même niveau que les autres champs
            const groupContainer = document.createElement('div');
            groupContainer.className = 'json-editor__field-group';
            if (fieldConfig.inline) {
                groupContainer.classList.add('json-editor__field-row');
            }
            for (const [subKey, subConfig] of Object.entries(fieldConfig.fields || {})) {
                const subPath = `${path}.${subKey}`;
                const subValue = dataValue[subKey];
                const { renderer: subRenderer, config: subResolved } = _resolveRenderer(subConfig, subPath);
                const subElement = subRenderer(subResolved, subValue, onChange, subPath);
                groupContainer.appendChild(subElement);
            }
            wrapper.appendChild(groupContainer);
        } else {
            // Champ simple — résoudre via getRendererForField si disponible
            const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, fieldPath);
            const rendered = renderer(resolvedConfig, fieldValue, onChange, fieldPath);

            // Support collapsible pour les champs simples (text, textarea)
            if (fieldConfig.collapsible && rendered) {
                const cWrapper = document.createElement('div');
                cWrapper.className = 'json-editor__field json-editor__field--collapsible-wrapper';
                const cLabel = translateLabel(fieldConfig.collapsibleLabel || fieldConfig.label || '');
                cWrapper.innerHTML = `
                    <div class="json-editor__array-item-subsection">
                        <div class="json-editor__array-item-subsection-header">
                            <i class="fas fa-chevron-right"></i>
                            <span>${escapeHtml(cLabel)}</span>
                        </div>
                        <div class="json-editor__array-item-subsection-content" style="display: none;"></div>
                    </div>
                `;
                const cHeader = cWrapper.querySelector('.json-editor__array-item-subsection-header');
                const cContent = cWrapper.querySelector('.json-editor__array-item-subsection-content');
                const cSection = cWrapper.querySelector('.json-editor__array-item-subsection');
                cHeader.addEventListener('click', () => {
                    const expanded = cSection.classList.toggle('json-editor__array-item-subsection--expanded');
                    cContent.style.display = expanded ? '' : 'none';
                    cHeader.querySelector('i').className = expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
                });
                cContent.appendChild(rendered);
                wrapper.appendChild(cWrapper);
            } else {
                wrapper.appendChild(rendered);
            }
        }
    }

    return wrapper;
}

/**
 * Rend une grille d'évaluation critériée sous forme de tableau éditable.
 * Chaque ligne = un critère, chaque colonne = un niveau.
 * Chaque cellule contient son propre score (nombre) + descripteur (textarea).
 * Ajouter/supprimer une colonne s'applique à TOUS les critères d'un coup.
 * @param {Object} config - Configuration du champ (label, etc.)
 * @param {Array} value - Tableau de critères [{description, levels: [{score, definition}]}]
 * @param {Function} onChange - Callback (path, newValue)
 * @param {string} path - Chemin dans le JSON (ex: "criteria")
 * @returns {HTMLElement} Le conteneur DOM du tableau éditable
 */
function renderRubricGridField(config, value, onChange, path) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__rubric-grid';

    // Copie de travail des critères
    let criteria = JSON.parse(JSON.stringify(value || []));

    /**
     * Auto-resize d'un textarea selon son contenu.
     */
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    /**
     * Notifie le changement et re-rend la grille.
     */
    function emitChange() {
        if (onChange) onChange(path, criteria);
        renderGrid();
    }

    /**
     * Construit et affiche le tableau dans le wrapper.
     */
    function renderGrid() {
        wrapper.innerHTML = '';

        const maxLevels = Math.max(...criteria.map(c => (c.levels || []).length), 0);

        // --- En-tête de la grille ---
        const header = document.createElement('div');
        header.className = 'json-editor__rubric-grid-header';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'json-editor__rubric-grid-title';
        titleSpan.textContent = translateLabel(config.label || 'editor_section_rubric');
        header.appendChild(titleSpan);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'json-editor__rubric-grid-btn-group';

        const addColBtn = document.createElement('button');
        addColBtn.type = 'button';
        addColBtn.className = 'json-editor__rubric-grid-btn json-editor__rubric-grid-btn--add-col';
        addColBtn.innerHTML = '<i class="fas fa-plus"></i> ' + translateLabel('editor_devoir_add_level');
        addColBtn.addEventListener('click', () => {
            criteria.forEach(c => {
                const levels = c.levels || [];
                const nextScore = levels.length > 0 ? Math.max(...levels.map(l => l.score || 0)) + 1 : 0;
                levels.push({ score: nextScore, definition: '' });
                c.levels = levels;
            });
            emitChange();
        });
        btnGroup.appendChild(addColBtn);

        const addRowBtn = document.createElement('button');
        addRowBtn.type = 'button';
        addRowBtn.className = 'json-editor__rubric-grid-btn json-editor__rubric-grid-btn--add-row';
        addRowBtn.innerHTML = '<i class="fas fa-plus"></i> ' + translateLabel('editor_devoir_add_criterion');
        addRowBtn.addEventListener('click', () => {
            const newLevels = [];
            for (let j = 0; j < maxLevels; j++) {
                newLevels.push({ score: j, definition: '' });
            }
            criteria.push({ description: '', levels: newLevels });
            emitChange();
        });
        btnGroup.appendChild(addRowBtn);

        header.appendChild(btnGroup);
        wrapper.appendChild(header);

        if (criteria.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'json-editor__rubric-grid-empty';
            empty.textContent = translateLabel('editor_devoir_add_criterion');
            wrapper.appendChild(empty);
            return;
        }

        // --- Tableau ---
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'json-editor__rubric-grid-table-wrapper';

        const table = document.createElement('table');
        table.className = 'json-editor__rubric-grid-table';

        // En-tête : "Critère" + colonnes niveaux numérotées + colonne actions
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');

        const thCriterion = document.createElement('th');
        thCriterion.className = 'json-editor__rubric-grid-th-criterion';
        thCriterion.textContent = translateLabel('editor_devoir_criterion');
        headRow.appendChild(thCriterion);

        for (let j = 0; j < maxLevels; j++) {
            const th = document.createElement('th');
            th.className = 'json-editor__rubric-grid-th-level';

            const levelLabel = document.createElement('span');
            levelLabel.textContent = `${translateLabel('editor_devoir_level')} ${j + 1}`;
            th.appendChild(levelLabel);

            // Bouton supprimer la colonne (seulement si > 2 niveaux)
            if (maxLevels > 2) {
                const delColBtn = document.createElement('button');
                delColBtn.type = 'button';
                delColBtn.className = 'json-editor__rubric-grid-btn--del-col';
                delColBtn.title = translateLabel('editor_devoir_remove_level');
                delColBtn.innerHTML = '<i class="fas fa-times"></i>';
                const colIndex = j;
                delColBtn.addEventListener('click', async () => {
                    const confirmed = await showConfirm(
                        translateLabel('editor_devoir_confirm_remove_level'),
                        translateLabel('editor_devoir_remove_level'),
                        translateLabel('editor_delete') || 'Supprimer',
                        translateLabel('editor_cancel') || 'Annuler',
                        true
                    );
                    if (!confirmed) return;
                    criteria.forEach(c => {
                        if (c.levels && c.levels.length > colIndex) {
                            c.levels.splice(colIndex, 1);
                        }
                    });
                    emitChange();
                });
                th.appendChild(delColBtn);
            }

            headRow.appendChild(th);
        }

        const thActions = document.createElement('th');
        thActions.className = 'json-editor__rubric-grid-th-actions';
        headRow.appendChild(thActions);

        thead.appendChild(headRow);
        table.appendChild(thead);

        // Corps du tableau
        const tbody = document.createElement('tbody');

        criteria.forEach((criterion, i) => {
            const tr = document.createElement('tr');

            // Événements drop sur la ligne entière
            tr.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                tr.classList.add('json-editor__rubric-grid-row--drag-over');
            });
            tr.addEventListener('dragleave', () => {
                tr.classList.remove('json-editor__rubric-grid-row--drag-over');
            });
            tr.addEventListener('drop', (e) => {
                e.preventDefault();
                tr.classList.remove('json-editor__rubric-grid-row--drag-over');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const toIdx = i;
                if (fromIdx !== toIdx && !isNaN(fromIdx)) {
                    const [moved] = criteria.splice(fromIdx, 1);
                    criteria.splice(toIdx, 0, moved);
                    emitChange();
                }
            });

            // Cellule nom du critère
            const tdName = document.createElement('td');
            tdName.className = 'json-editor__rubric-grid-td-criterion';

            const nameTextarea = document.createElement('textarea');
            nameTextarea.className = 'json-editor__rubric-grid-input-name';
            nameTextarea.value = criterion.description || '';
            nameTextarea.placeholder = translateLabel('editor_devoir_criterion_name');
            nameTextarea.rows = 1;
            nameTextarea.addEventListener('input', (e) => {
                criteria[i].description = e.target.value;
                if (onChange) onChange(path, criteria);
                autoResize(e.target);
            });
            tdName.appendChild(nameTextarea);
            tr.appendChild(tdName);

            // Cellules niveaux — chaque cellule a son propre score + descripteur
            const levels = criterion.levels || [];
            for (let j = 0; j < maxLevels; j++) {
                const td = document.createElement('td');
                td.className = 'json-editor__rubric-grid-td-level';

                if (j < levels.length) {
                    const level = levels[j];

                    const scoreRow = document.createElement('div');
                    scoreRow.className = 'json-editor__rubric-grid-score-row';

                    const scoreLabel = document.createElement('span');
                    scoreLabel.className = 'json-editor__rubric-grid-score-label';
                    scoreLabel.textContent = translateLabel('editor_devoir_score');
                    scoreRow.appendChild(scoreLabel);

                    const scoreInput = document.createElement('input');
                    scoreInput.type = 'number';
                    scoreInput.className = 'json-editor__rubric-grid-input-score';
                    scoreInput.value = level.score ?? 0;
                    scoreInput.min = '0';
                    scoreInput.addEventListener('input', (e) => {
                        criteria[i].levels[j].score = parseFloat(e.target.value) || 0;
                        if (onChange) onChange(path, criteria);
                    });
                    scoreRow.appendChild(scoreInput);
                    td.appendChild(scoreRow);

                    const defTextarea = document.createElement('textarea');
                    defTextarea.className = 'json-editor__rubric-grid-textarea-def';
                    defTextarea.value = level.definition || '';
                    defTextarea.placeholder = translateLabel('editor_devoir_level_definition');
                    defTextarea.rows = 1;
                    defTextarea.addEventListener('input', (e) => {
                        criteria[i].levels[j].definition = e.target.value;
                        if (onChange) onChange(path, criteria);
                        autoResize(e.target);
                    });
                    td.appendChild(defTextarea);
                }

                tr.appendChild(td);
            }

            // Cellule actions (drag handle au-dessus + corbeille en-dessous)
            const tdActions = document.createElement('td');
            tdActions.className = 'json-editor__rubric-grid-td-actions';

            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'json-editor__rubric-grid-actions-stack';

            // Handle de glisser-déposer
            const dragHandle = document.createElement('span');
            dragHandle.className = 'json-editor__rubric-grid-drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            dragHandle.title = translateLabel('editor_devoir_reorder_criterion');
            dragHandle.draggable = true;
            // A11Y-02 : poignée de tri accessible au clavier (drag souris seul avant).
            dragHandle.setAttribute('role', 'button');
            dragHandle.setAttribute('tabindex', '0');
            dragHandle.setAttribute('aria-label', translateLabel('editor_devoir_reorder_criterion'));
            dragHandle.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown');
            dragHandle.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i));
                tr.classList.add('json-editor__rubric-grid-row--dragging');
            });
            dragHandle.addEventListener('dragend', () => {
                tr.classList.remove('json-editor__rubric-grid-row--dragging');
                tbody.querySelectorAll('.json-editor__rubric-grid-row--drag-over').forEach(el =>
                    el.classList.remove('json-editor__rubric-grid-row--drag-over')
                );
            });
            // A11Y-02 : ↑/↓ déplacent le critère ; le focus suit la poignée déplacée.
            dragHandle.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                e.preventDefault();
                const toIdx = i + (e.key === 'ArrowUp' ? -1 : 1);
                if (toIdx < 0 || toIdx >= criteria.length) return;
                const [moved] = criteria.splice(i, 1);
                criteria.splice(toIdx, 0, moved);
                emitChange();
                const handles = wrapper.querySelectorAll('.json-editor__rubric-grid-drag-handle');
                if (handles[toIdx]) handles[toIdx].focus();
            });
            actionsWrapper.appendChild(dragHandle);

            if (criteria.length > 1) {
                const delRowBtn = document.createElement('button');
                delRowBtn.type = 'button';
                delRowBtn.className = 'json-editor__rubric-grid-btn--del-row';
                delRowBtn.title = translateLabel('editor_devoir_remove_criterion');
                delRowBtn.innerHTML = '<i class="fas fa-trash"></i>';
                delRowBtn.addEventListener('click', async () => {
                    const confirmed = await showConfirm(
                        translateLabel('editor_devoir_confirm_remove_criterion'),
                        translateLabel('editor_devoir_remove_criterion'),
                        translateLabel('editor_delete') || 'Supprimer',
                        translateLabel('editor_cancel') || 'Annuler',
                        true
                    );
                    if (!confirmed) return;
                    criteria.splice(i, 1);
                    emitChange();
                });
                actionsWrapper.appendChild(delRowBtn);
            }

            tdActions.appendChild(actionsWrapper);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        wrapper.appendChild(tableWrapper);

        // Auto-resize des textareas après insertion dans le DOM
        requestAnimationFrame(() => {
            wrapper.querySelectorAll('.json-editor__rubric-grid-input-name, .json-editor__rubric-grid-textarea-def').forEach(autoResize);
        });
    }

    renderGrid();
    return wrapper;
}
