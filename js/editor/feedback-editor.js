/**
 * Feedback Editor - Editeur specialise pour les tranches de feedback
 *
 * Gere l'edition des tableaux overallFeedback avec des tranches de score (0-100).
 * Structure: [{ from: 0, to: 50, feedback: "..." }, { from: 51, to: 100, feedback: "..." }]
 */

import { t } from '../core/translation.js';
import { escapeHtml, generateId } from './field-renderers.js';
import { validators } from './validators.js';

/**
 * Traduit un label
 */
function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

// =======================================================================
// CLASSE FEEDBACK EDITOR
// =======================================================================

/**
 * Editeur de tranches de feedback
 */
export class FeedbackEditor {
    /**
     * @param {HTMLElement} container - Container DOM
     * @param {Array} ranges - Tranches de feedback
     * @param {string} path - Chemin dans les donnees
     * @param {Function} onChange - Callback de changement
     */
    constructor(container, ranges, path, onChange) {
        this.container = container;
        this.ranges = this.normalizeRanges(ranges);
        this.path = path;
        this.onChange = onChange;

        this.render();
    }

    /**
     * Normalise les tranches (s'assure qu'elles couvrent 0-100)
     */
    normalizeRanges(ranges) {
        if (!Array.isArray(ranges) || ranges.length === 0) {
            // Tranches par defaut : 2 tranches (echec / reussite)
            // L'enseignant peut scinder une tranche pour en ajouter si besoin
            return [
                { from: 0, to: 50, feedback: '' },
                { from: 51, to: 100, feedback: '' }
            ];
        }

        // Trier par 'from'
        return [...ranges].sort((a, b) => a.from - b.from);
    }

    /**
     * Rend l'editeur complet
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'json-editor__feedback-ranges';

        // Barre visuelle
        const bar = this.renderVisualBar();
        this.container.appendChild(bar);

        // Label
        const label = document.createElement('div');
        label.className = 'json-editor__label';
        label.textContent = translateLabel('editor_feedback_ranges_label') || 'Feedback selon le score';
        this.container.appendChild(label);

        // Tranches
        this.ranges.forEach((range, index) => {
            const rangeElement = this.renderRange(range, index);
            this.container.appendChild(rangeElement);
        });

        // Bouton d'ajout
        if (this.ranges.length < 10) {
            const addBtn = this.renderAddButton();
            this.container.appendChild(addBtn);
        }

        // Validation
        this.updateValidation();
    }

    /**
     * Rend la barre visuelle des tranches
     */
    renderVisualBar() {
        const bar = document.createElement('div');
        bar.className = 'json-editor__feedback-bar';

        this.ranges.forEach((range, index) => {
            const width = range.to - range.from + 1;
            const segment = document.createElement('div');
            segment.className = 'json-editor__feedback-bar-segment';
            segment.style.width = `${width}%`;
            segment.title = `${range.from}% - ${range.to}%`;
            bar.appendChild(segment);
        });

        return bar;
    }

    /**
     * Rend une tranche de feedback
     */
    renderRange(range, index) {
        const element = document.createElement('div');
        element.className = 'json-editor__feedback-range';
        element.dataset.index = index;

        const fromId = generateId();
        const toId = generateId();
        const textId = generateId();

        element.innerHTML = `
            <div class="json-editor__feedback-range-inputs">
                <input
                    type="number"
                    id="${fromId}"
                    class="json-editor__input json-editor__feedback-range-input"
                    value="${range.from}"
                    min="0"
                    max="100"
                    data-field="from"
                >
                <span class="json-editor__feedback-range-percent">%</span>
                <span class="json-editor__feedback-range-separator">-</span>
                <input
                    type="number"
                    id="${toId}"
                    class="json-editor__input json-editor__feedback-range-input"
                    value="${range.to}"
                    min="0"
                    max="100"
                    data-field="to"
                >
                <span class="json-editor__feedback-range-percent">%</span>
            </div>
            <div class="json-editor__feedback-range-text">
                <textarea
                    id="${textId}"
                    class="json-editor__textarea"
                    placeholder="${translateLabel('editor_feedback_placeholder') || 'Message de feedback pour cette tranche...'}"
                    data-field="feedback"
                >${escapeHtml(range.feedback || '')}</textarea>
            </div>
            <div class="json-editor__feedback-range-actions">
                ${this.ranges.length > 1 ? `
                    <button type="button" class="json-editor__array-btn json-editor__array-btn--danger" data-action="delete" title="${translateLabel('editor_delete') || 'Supprimer'}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;

        // Listeners
        const fromInput = element.querySelector('[data-field="from"]');
        const toInput = element.querySelector('[data-field="to"]');
        const textArea = element.querySelector('[data-field="feedback"]');
        const deleteBtn = element.querySelector('[data-action="delete"]');

        fromInput.addEventListener('change', (e) => {
            this.updateRange(index, 'from', parseInt(e.target.value) || 0);
        });

        toInput.addEventListener('change', (e) => {
            this.updateRange(index, 'to', parseInt(e.target.value) || 0);
        });

        textArea.addEventListener('input', (e) => {
            this.updateRange(index, 'feedback', e.target.value);
        });

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.removeRange(index);
            });
        }

        return element;
    }

    /**
     * Rend le bouton d'ajout
     */
    renderAddButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'json-editor__add-btn';
        btn.innerHTML = `
            <i class="fas fa-plus"></i>
            ${translateLabel('editor_add_range') || 'Ajouter une tranche'}
        `;

        btn.addEventListener('click', () => this.addRange());

        return btn;
    }

    // =======================================================================
    // OPERATIONS CRUD
    // =======================================================================

    /**
     * Ajoute une nouvelle tranche
     * Divise la plus grande tranche en deux
     */
    addRange() {
        if (this.ranges.length >= 10) return;

        // Trouver la plus grande tranche
        let maxWidth = 0;
        let maxIndex = 0;
        this.ranges.forEach((range, index) => {
            const width = range.to - range.from;
            if (width > maxWidth) {
                maxWidth = width;
                maxIndex = index;
            }
        });

        // Diviser cette tranche
        const rangeToSplit = this.ranges[maxIndex];
        const midPoint = Math.floor((rangeToSplit.from + rangeToSplit.to) / 2);

        const newRange = {
            from: midPoint + 1,
            to: rangeToSplit.to,
            feedback: ''
        };

        rangeToSplit.to = midPoint;

        // Inserer la nouvelle tranche
        this.ranges.splice(maxIndex + 1, 0, newRange);

        this.render();
        this.notifyChange();
    }

    /**
     * Supprime une tranche et fusionne avec l'adjacente
     */
    removeRange(index) {
        if (this.ranges.length <= 1) return;

        const removedRange = this.ranges[index];

        // Fusionner avec la tranche adjacente
        if (index > 0) {
            // Fusionner avec la precedente
            this.ranges[index - 1].to = removedRange.to;
        } else if (index < this.ranges.length - 1) {
            // Fusionner avec la suivante
            this.ranges[index + 1].from = removedRange.from;
        }

        this.ranges.splice(index, 1);

        this.render();
        this.notifyChange();
    }

    /**
     * Met a jour une tranche
     */
    updateRange(index, field, value) {
        if (!this.ranges[index]) return;

        if (field === 'from' || field === 'to') {
            // Contraindre entre 0 et 100
            value = Math.max(0, Math.min(100, value));

            // Empecher les inversions
            if (field === 'from' && value > this.ranges[index].to) {
                value = this.ranges[index].to;
            }
            if (field === 'to' && value < this.ranges[index].from) {
                value = this.ranges[index].from;
            }

            // Ajuster les tranches adjacentes pour eviter les chevauchements
            if (field === 'to' && index < this.ranges.length - 1) {
                this.ranges[index + 1].from = value + 1;
            }
            if (field === 'from' && index > 0) {
                this.ranges[index - 1].to = value - 1;
            }
        }

        this.ranges[index][field] = value;

        // Re-render seulement si c'est un changement de bornes
        if (field === 'from' || field === 'to') {
            this.render();
        }

        this.notifyChange();
    }

    /**
     * Valide les tranches
     */
    updateValidation() {
        const isValid = validators.feedbackRanges(this.ranges);

        if (!isValid) {
            // Afficher un message d'erreur
            const existingError = this.container.querySelector('.json-editor__feedback-error');
            if (!existingError) {
                const error = document.createElement('div');
                error.className = 'json-editor__error json-editor__feedback-error';
                error.textContent = translateLabel('editor_error_feedback_ranges') || 'Les tranches doivent couvrir 0-100% sans chevauchement';
                this.container.appendChild(error);
            }
        } else {
            const existingError = this.container.querySelector('.json-editor__feedback-error');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    /**
     * Notifie le parent du changement
     */
    notifyChange() {
        this.updateValidation();
        if (this.onChange) {
            this.onChange(this.path, this.ranges);
        }
    }

    // =======================================================================
    // API PUBLIQUE
    // =======================================================================

    /**
     * Retourne les donnees actuelles
     */
    getData() {
        return this.ranges;
    }

    /**
     * Met a jour les donnees
     */
    setData(ranges) {
        this.ranges = this.normalizeRanges(ranges);
        this.render();
    }

    /**
     * Verifie si les tranches sont valides
     */
    isValid() {
        return validators.feedbackRanges(this.ranges);
    }

    /**
     * Reset aux tranches par defaut
     */
    reset() {
        this.ranges = this.normalizeRanges([]);
        this.render();
        this.notifyChange();
    }
}

// =======================================================================
// PRESETS DE TRANCHES
// =======================================================================

/**
 * Presets de tranches communes
 */
export const feedbackPresets = {
    // 6 tranches standard (par defaut H5P)
    'standard6': [
        { from: 0, to: 10, feedback: 'Des efforts sont necessaires.' },
        { from: 11, to: 30, feedback: 'Tu y es presque.' },
        { from: 31, to: 50, feedback: 'C\'est un bon debut.' },
        { from: 51, to: 70, feedback: 'Bon travail !' },
        { from: 71, to: 90, feedback: 'Tres bon score !' },
        { from: 91, to: 100, feedback: 'Excellent !' }
    ],

    // 3 tranches simples
    'simple3': [
        { from: 0, to: 49, feedback: 'A revoir.' },
        { from: 50, to: 79, feedback: 'Bien !' },
        { from: 80, to: 100, feedback: 'Excellent !' }
    ],

    // 4 tranches
    'standard4': [
        { from: 0, to: 24, feedback: 'A ameliorer.' },
        { from: 25, to: 49, feedback: 'Peut mieux faire.' },
        { from: 50, to: 74, feedback: 'Bien !' },
        { from: 75, to: 100, feedback: 'Tres bien !' }
    ],

    // 1 tranche unique
    'single': [
        { from: 0, to: 100, feedback: '' }
    ]
};

/**
 * Applique un preset de tranches
 * @param {FeedbackEditor} editor - Instance de l'editeur
 * @param {string} presetName - Nom du preset
 */
export function applyPreset(editor, presetName) {
    const preset = feedbackPresets[presetName];
    if (preset && editor) {
        editor.setData(JSON.parse(JSON.stringify(preset)));
    }
}

// =======================================================================
// FACTORY FUNCTION
// =======================================================================

/**
 * Cree et initialise un FeedbackEditor
 * @param {HTMLElement} container - Container DOM
 * @param {Array} ranges - Tranches initiales
 * @param {string} path - Chemin dans les donnees
 * @param {Function} onChange - Callback
 * @returns {FeedbackEditor}
 */
export function createFeedbackEditor(container, ranges, path, onChange) {
    return new FeedbackEditor(container, ranges, path, onChange);
}
