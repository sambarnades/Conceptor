/**
 * Cloze Editor — Editeur visuel pour les questions texte a trous (Moodle)
 *
 * Affiche le texte avec des chips visuels cliquables pour chaque trou.
 * Trois types de trous : MULTICHOICE (QCM), SHORTANSWER (reponse courte), NUMERICAL (numerique).
 * Modale de configuration pour chaque trou (pattern formula-assistant).
 * Bascule source/visuel pour l'edition manuelle du code Cloze.
 *
 * Format Cloze Moodle : {poids:TYPE:=bonne~mauvaise1~mauvaise2}
 */

import { t } from '../core/translation.js';
import { escapeHtml, generateId } from './field-renderers.js';
import { validateField } from './validators.js';

// =======================================================================
// PARSEUR CLOZE
// =======================================================================

/** Regex pour detecter les trous Cloze */
const CLOZE_RE = /\{(\d+):(MULTICHOICE|SHORTANSWER|NUMERICAL):([^}]+)\}/g;

/**
 * Parse le contenu d'un trou selon son type.
 * @param {string} weight — Poids du trou (ex: "1")
 * @param {string} type — Type : MULTICHOICE, SHORTANSWER, NUMERICAL
 * @param {string} content — Contenu apres le type (ex: "=Paris~paris" ou "=3.14:0.01")
 * @returns {object} Donnees structurees du trou
 */
export function parseGapContent(weight, type, content) {
    if (type === 'NUMERICAL') {
        const clean = content.replace(/^=/, '');
        const parts = clean.split(':');
        return { weight, type, correct: parts[0] || '', tolerance: parts[1] || '0' };
    }
    // MULTICHOICE ou SHORTANSWER
    const answers = content.split('~');
    const correct = [];
    const wrong = [];
    for (const a of answers) {
        if (a.startsWith('=')) {
            correct.push(a.substring(1));
        } else if (type === 'SHORTANSWER') {
            // SHORTANSWER : toutes les réponses sont des alternatives correctes
            correct.push(a);
        } else {
            wrong.push(a);
        }
    }
    return { weight, type, correct, wrong };
}

/**
 * Parse un texte Cloze en parties : texte et trous.
 * @param {string} text — Texte Cloze brut
 * @returns {Array<{type: 'text'|'gap', content?: string, gapData?: object}>}
 */
export function parseClozeText(text) {
    if (!text) return [{ type: 'text', content: '' }];

    const parts = [];
    let lastIndex = 0;
    let match;
    // Reset regex state
    CLOZE_RE.lastIndex = 0;

    while ((match = CLOZE_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
        }
        parts.push({
            type: 'gap',
            gapData: parseGapContent(match[1], match[2], match[3])
        });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    if (parts.length === 0) {
        parts.push({ type: 'text', content: text });
    }
    return parts;
}

/**
 * Serialise des donnees de trou en syntaxe Cloze.
 * @param {object} gapData — Donnees du trou
 * @returns {string} Syntaxe Cloze : {poids:TYPE:=bonne~mauvaise}
 */
export function serializeGap(gapData) {
    const w = gapData.weight || '1';
    if (gapData.type === 'NUMERICAL') {
        const tol = gapData.tolerance && gapData.tolerance !== '0' ? ':' + gapData.tolerance : ':0';
        return `{${w}:NUMERICAL:=${gapData.correct}${tol}}`;
    }
    const parts = [];
    const correct = Array.isArray(gapData.correct) ? gapData.correct : [gapData.correct];
    correct.forEach(c => parts.push('=' + c));
    const wrong = Array.isArray(gapData.wrong) ? gapData.wrong : [];
    wrong.forEach(w2 => parts.push(w2));
    return `{${w}:${gapData.type}:${parts.join('~')}}`;
}

/**
 * Serialise le contenu du contenteditable en texte Cloze.
 * @param {HTMLElement} container — Le contenteditable
 * @returns {string} Texte Cloze
 */
export function serializeClozeFromContainer(container) {
    let result = '';
    for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.classList?.contains('cloze-chip')) {
            try {
                const gapData = JSON.parse(node.getAttribute('data-gap'));
                result += serializeGap(gapData);
            } catch (e) {
                result += node.textContent;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // BR → saut de ligne
            if (node.tagName === 'BR') {
                result += '\n';
            } else {
                result += node.textContent;
            }
        }
    }
    return result;
}

// =======================================================================
// RENDU DES CHIPS
// =======================================================================

/**
 * Cree un chip visuel pour un trou.
 * @param {object} gapData — Donnees du trou
 * @returns {HTMLElement} Le span chip
 */
function _createChip(gapData) {
    const chip = document.createElement('span');
    chip.className = `cloze-chip cloze-chip--${gapData.type.toLowerCase()}`;
    chip.setAttribute('contenteditable', 'false');
    chip.setAttribute('data-gap', JSON.stringify(gapData));

    // Texte affiche dans le chip
    if (gapData.type === 'NUMERICAL') {
        const tol = gapData.tolerance && gapData.tolerance !== '0' ? ` \u00B1 ${gapData.tolerance}` : '';
        chip.textContent = `${gapData.correct}${tol}`;
    } else if (gapData.type === 'MULTICHOICE') {
        const correct = Array.isArray(gapData.correct) ? gapData.correct[0] : gapData.correct;
        chip.textContent = correct || '...';
    } else {
        const correct = Array.isArray(gapData.correct) ? gapData.correct[0] : gapData.correct;
        chip.textContent = correct || '...';
    }

    return chip;
}

/**
 * Remplit le contenteditable avec le texte et les chips visuels.
 * @param {HTMLElement} container — Le contenteditable
 * @param {string} clozeText — Texte Cloze brut
 */
function _renderChips(container, clozeText) {
    container.innerHTML = '';
    const parts = parseClozeText(clozeText);
    for (const part of parts) {
        if (part.type === 'text') {
            // Gerer les sauts de ligne
            const lines = part.content.split('\n');
            lines.forEach((line, i) => {
                if (i > 0) container.appendChild(document.createElement('br'));
                if (line) container.appendChild(document.createTextNode(line));
            });
        } else if (part.type === 'gap') {
            container.appendChild(_createChip(part.gapData));
        }
    }
}

// =======================================================================
// TOOLBAR CLOZE
// =======================================================================

/**
 * Cree la toolbar specifique Cloze.
 * @returns {HTMLElement}
 */
function _createClozeToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'json-editor__richtext-toolbar cloze-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.addEventListener('mousedown', (e) => e.preventDefault());

    const buttons = [
        { id: 'insert_mcq', icon: 'fa-list', label: 'editor_cloze_insert_mcq', type: 'MULTICHOICE' },
        { id: 'insert_short', icon: 'fa-keyboard', label: 'editor_cloze_insert_short', type: 'SHORTANSWER' },
        { id: 'insert_num', icon: 'fa-calculator', label: 'editor_cloze_insert_num', type: 'NUMERICAL' }
    ];

    buttons.forEach(btn => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'json-editor__richtext-toolbar-btn';
        el.title = t(btn.label) || btn.label;
        el.innerHTML = `<i class="fas ${btn.icon}"></i>`;
        el.dataset.gapType = btn.type;
        toolbar.appendChild(el);
    });

    // Separateur
    const sep = document.createElement('span');
    sep.className = 'json-editor__richtext-toolbar-separator';
    toolbar.appendChild(sep);

    // Bouton source
    const sourceBtn = document.createElement('button');
    sourceBtn.type = 'button';
    sourceBtn.className = 'json-editor__richtext-toolbar-btn';
    sourceBtn.title = t('editor_cloze_toggle_source') || 'Code source';
    sourceBtn.innerHTML = '<i class="fas fa-code"></i>';
    sourceBtn.dataset.action = 'toggle_source';
    toolbar.appendChild(sourceBtn);

    return toolbar;
}

// =======================================================================
// MODALE DE CONFIGURATION
// =======================================================================

/**
 * Ouvre la modale de configuration d'un trou.
 * @param {object} gapData — Donnees actuelles du trou
 * @param {function} onSave — Callback(gapData) quand l'utilisateur valide
 * @param {function} onDelete — Callback() quand l'utilisateur supprime le trou (null pour nouveau)
 */
function _showGapConfigModal(gapData, onSave, onDelete) {
    const isNew = !onDelete;
    const data = gapData || { weight: '1', type: 'SHORTANSWER', correct: [''], wrong: [] };

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'json-editor__formula-overlay';

    const panel = document.createElement('div');
    panel.className = 'json-editor__formula-panel cloze-modal';
    panel.addEventListener('mousedown', (e) => e.stopPropagation());

    // Titre
    const titles = {
        'MULTICHOICE': t('editor_cloze_gap_title_mcq') || 'Trou : Choix multiple',
        'SHORTANSWER': t('editor_cloze_gap_title_short') || 'Trou : Reponse courte',
        'NUMERICAL': t('editor_cloze_gap_title_num') || 'Trou : Valeur numerique'
    };

    // Header
    const header = document.createElement('div');
    header.className = 'json-editor__formula-header';
    header.innerHTML = `
        <span>${escapeHtml(titles[data.type] || 'Trou')}</span>
        <button type="button" class="json-editor__formula-close"><i class="fas fa-times"></i></button>
    `;
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'cloze-modal__body';

    // Selecteur de type
    const typeRow = document.createElement('div');
    typeRow.className = 'cloze-modal__type-row';
    const types = [
        { value: 'MULTICHOICE', label: t('editor_cloze_insert_mcq') || 'Choix multiple', icon: 'fa-list' },
        { value: 'SHORTANSWER', label: t('editor_cloze_insert_short') || 'Reponse courte', icon: 'fa-keyboard' },
        { value: 'NUMERICAL', label: t('editor_cloze_insert_num') || 'Valeur numerique', icon: 'fa-calculator' }
    ];
    types.forEach(tp => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cloze-modal__type-btn${data.type === tp.value ? ' cloze-modal__type-btn--active' : ''}`;
        btn.innerHTML = `<i class="fas ${tp.icon}"></i> ${escapeHtml(tp.label)}`;
        btn.addEventListener('click', () => {
            data.type = tp.value;
            header.querySelector('span').textContent = titles[tp.value];
            typeRow.querySelectorAll('.cloze-modal__type-btn').forEach(b => b.classList.remove('cloze-modal__type-btn--active'));
            btn.classList.add('cloze-modal__type-btn--active');
            _rebuildModalFields(fieldsContainer, data);
        });
        typeRow.appendChild(btn);
    });
    body.appendChild(typeRow);

    // Container des champs (reconstruit selon le type)
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'cloze-modal__fields';
    body.appendChild(fieldsContainer);
    panel.appendChild(body);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'json-editor__formula-actions';

    if (!isNew) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'json-editor__formula-btn json-editor__formula-btn--remove';
        deleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${escapeHtml(t('editor_cloze_delete_gap') || 'Supprimer')}`;
        deleteBtn.addEventListener('click', () => { if (onDelete) onDelete(); overlay.remove(); });
        actions.appendChild(deleteBtn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'json-editor__formula-btn json-editor__formula-btn--cancel';
    cancelBtn.textContent = t('editor_formula_cancel') || 'Annuler';
    cancelBtn.addEventListener('click', () => overlay.remove());
    actions.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'json-editor__formula-btn json-editor__formula-btn--insert';
    saveBtn.textContent = isNew ? (t('editor_formula_insert') || 'Inserer') : (t('editor_richtext_link_update') || 'Modifier');
    saveBtn.addEventListener('click', () => {
        _collectModalData(fieldsContainer, data);
        if (onSave) onSave(data);
        overlay.remove();
    });
    actions.appendChild(saveBtn);
    panel.appendChild(actions);

    // Assembler
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Fermer au clic overlay / Escape
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) overlay.remove(); });
    const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
    header.querySelector('.json-editor__formula-close').addEventListener('click', () => overlay.remove());

    // Construire les champs selon le type
    _rebuildModalFields(fieldsContainer, data);
}

/**
 * Reconstruit les champs de la modale selon le type de trou.
 */
function _rebuildModalFields(container, data) {
    container.innerHTML = '';

    if (data.type === 'NUMERICAL') {
        container.innerHTML = `
            <div class="cloze-modal__field-row">
                <div class="cloze-modal__field">
                    <label>${escapeHtml(t('editor_cloze_correct') || 'Valeur')}</label>
                    <input type="text" class="json-editor__formula-input" data-field="correct" value="${escapeHtml(data.correct || '')}">
                </div>
                <div class="cloze-modal__field">
                    <label>${escapeHtml(t('editor_cloze_tolerance') || 'Tolerance')}</label>
                    <input type="text" class="json-editor__formula-input" data-field="tolerance" value="${escapeHtml(data.tolerance || '0')}">
                </div>
            </div>
        `;
    } else {
        // MULTICHOICE ou SHORTANSWER
        const correctLabel = t('editor_cloze_correct') || 'Bonne reponse';
        const correct = Array.isArray(data.correct) ? data.correct : [data.correct || ''];

        let html = `<div class="cloze-modal__field">
            <label>${escapeHtml(correctLabel)}</label>
            <input type="text" class="json-editor__formula-input" data-field="correct-0" value="${escapeHtml(correct[0] || '')}">
        </div>`;

        // Alternatives (SHORTANSWER) ou mauvaises reponses (MULTICHOICE)
        const listLabel = data.type === 'MULTICHOICE'
            ? (t('editor_cloze_wrong') || 'Mauvaises reponses')
            : (t('editor_cloze_alternatives') || 'Alternatives acceptees');

        const items = data.type === 'MULTICHOICE' ? (data.wrong || []) : (correct.slice(1) || []);

        html += `<div class="cloze-modal__field"><label>${escapeHtml(listLabel)}</label>`;
        html += `<div class="cloze-modal__list" data-list="${data.type === 'MULTICHOICE' ? 'wrong' : 'alt'}">`;
        items.forEach((item, i) => {
            html += `<div class="cloze-modal__list-item">
                <input type="text" class="json-editor__formula-input" value="${escapeHtml(item)}">
                <button type="button" class="cloze-modal__remove-btn" title="Supprimer"><i class="fas fa-times"></i></button>
            </div>`;
        });
        html += `</div>`;
        html += `<button type="button" class="cloze-modal__add-btn"><i class="fas fa-plus"></i> ${escapeHtml(t('editor_cloze_add_option') || 'Ajouter')}</button>`;
        html += `</div>`;

        container.innerHTML = html;

        // Events pour supprimer et ajouter
        container.querySelectorAll('.cloze-modal__remove-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.cloze-modal__list-item').remove());
        });
        container.querySelector('.cloze-modal__add-btn')?.addEventListener('click', () => {
            const list = container.querySelector('.cloze-modal__list');
            const div = document.createElement('div');
            div.className = 'cloze-modal__list-item';
            div.innerHTML = `<input type="text" class="json-editor__formula-input" value="">
                <button type="button" class="cloze-modal__remove-btn" title="Supprimer"><i class="fas fa-times"></i></button>`;
            div.querySelector('.cloze-modal__remove-btn').addEventListener('click', () => div.remove());
            list.appendChild(div);
            div.querySelector('input').focus();
        });
    }

    // Focus sur le premier input
    requestAnimationFrame(() => container.querySelector('input')?.focus());
}

/**
 * Collecte les donnees depuis les champs de la modale.
 */
function _collectModalData(container, data) {
    if (data.type === 'NUMERICAL') {
        data.correct = container.querySelector('[data-field="correct"]')?.value || '';
        data.tolerance = container.querySelector('[data-field="tolerance"]')?.value || '0';
    } else {
        const correctInput = container.querySelector('[data-field="correct-0"]');
        const correct = [correctInput?.value || ''];
        const listType = data.type === 'MULTICHOICE' ? 'wrong' : 'alt';
        const listItems = container.querySelectorAll(`.cloze-modal__list[data-list="${listType}"] input`);

        if (listType === 'alt') {
            // SHORTANSWER : alternatives = bonnes reponses supplementaires
            listItems.forEach(input => {
                if (input.value.trim()) correct.push(input.value.trim());
            });
            data.correct = correct;
            data.wrong = [];
        } else {
            // MULTICHOICE : mauvaises reponses
            data.correct = correct;
            data.wrong = [];
            listItems.forEach(input => {
                if (input.value.trim()) data.wrong.push(input.value.trim());
            });
        }
    }
}

// =======================================================================
// RENDERER PRINCIPAL
// =======================================================================

/**
 * Rend un champ editeur Cloze visuel.
 * @param {object} config — Configuration du champ
 * @param {string} value — Texte Cloze brut
 * @param {function} onChange — Callback (path, newValue)
 * @param {string} path — Chemin du champ
 * @returns {HTMLElement}
 */
export function renderClozeField(config, value, onChange, path) {
    const id = generateId();
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--cloze';

    // Label
    const label = config.label ? (t(config.label) !== config.label ? t(config.label) : config.label) : '';
    const labelEl = document.createElement('label');
    labelEl.className = `json-editor__label ${config.required ? 'json-editor__label--required' : ''}`;
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    // Container
    const container = document.createElement('div');
    container.className = 'json-editor__richtext-container cloze-container';

    // Toolbar
    const toolbar = _createClozeToolbar();
    container.appendChild(toolbar);

    // Zone editable (visuel)
    const editable = document.createElement('div');
    editable.id = id;
    editable.className = 'json-editor__richtext-editable cloze-editable';
    editable.setAttribute('contenteditable', 'true');
    editable.setAttribute('data-path', path);
    editable.setAttribute('role', 'textbox');
    editable.setAttribute('aria-multiline', 'true');

    // Zone source (code)
    const source = document.createElement('textarea');
    source.className = 'json-editor__richtext-source json-editor__richtext-source--hidden';
    source.setAttribute('data-path', path);
    source.setAttribute('spellcheck', 'false');
    source.value = value || '';

    container.appendChild(editable);
    container.appendChild(source);
    wrapper.appendChild(container);

    // Hint
    const hint = config.hint ? (t(config.hint) !== config.hint ? t(config.hint) : config.hint) : '';
    if (hint) {
        const hintEl = document.createElement('span');
        hintEl.className = 'json-editor__hint';
        hintEl.textContent = hint;
        wrapper.appendChild(hintEl);
    }

    // Erreur
    const errorSpan = document.createElement('span');
    errorSpan.className = 'json-editor__error';
    wrapper.appendChild(errorSpan);

    // --- Etat ---
    let isSourceMode = false;

    // Initialiser le contenu visuel
    _renderChips(editable, value || '');

    // --- Emission des changements ---
    function emitChange() {
        const val = isSourceMode ? source.value : serializeClozeFromContainer(editable);
        if (!isSourceMode) source.value = val;
        onChange(path, val);
    }

    // --- Events toolbar ---
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.action === 'toggle_source') {
            // Bascule source/visuel
            if (isSourceMode) {
                _renderChips(editable, source.value);
                editable.classList.remove('json-editor__richtext-editable--hidden');
                source.classList.add('json-editor__richtext-source--hidden');
                btn.classList.remove('json-editor__richtext-toolbar-btn--active');
            } else {
                source.value = serializeClozeFromContainer(editable);
                source.classList.remove('json-editor__richtext-source--hidden');
                editable.classList.add('json-editor__richtext-editable--hidden');
                btn.classList.add('json-editor__richtext-toolbar-btn--active');
                // Auto-resize
                source.style.height = 'auto';
                source.style.height = Math.max(source.scrollHeight, 80) + 'px';
            }
            isSourceMode = !isSourceMode;
            return;
        }

        if (btn.dataset.gapType) {
            // Sauvegarder la sélection et le texte AVANT d'ouvrir la modale
            const sel = window.getSelection();
            const savedRange = (sel.rangeCount > 0 && editable.contains(sel.anchorNode))
                ? sel.getRangeAt(0).cloneRange() : null;
            const selectedText = savedRange ? savedRange.toString().trim() : '';

            const gapType = btn.dataset.gapType;
            // Pré-remplir la bonne réponse avec le texte sélectionné
            const defaultCorrect = selectedText
                ? (gapType === 'NUMERICAL' ? selectedText : [selectedText])
                : (gapType === 'NUMERICAL' ? '' : ['']);

            _showGapConfigModal(
                { weight: '1', type: gapType, correct: defaultCorrect, wrong: [], tolerance: '0' },
                (gapData) => {
                    const chip = _createChip(gapData);
                    // Insérer à la position sauvegardée du curseur
                    if (savedRange) {
                        try {
                            savedRange.deleteContents();
                            savedRange.insertNode(chip);
                            const after = document.createRange();
                            after.setStartAfter(chip);
                            after.collapse(true);
                            const s = window.getSelection();
                            s.removeAllRanges();
                            s.addRange(after);
                        } catch (e) {
                            editable.appendChild(chip);
                        }
                    } else {
                        editable.appendChild(chip);
                    }
                    editable.focus();
                    emitChange();
                },
                null
            );
        }
    });

    // Double-clic sur un chip → editer
    editable.addEventListener('dblclick', (e) => {
        const chip = e.target.closest('.cloze-chip');
        if (!chip) return;
        e.preventDefault();

        try {
            const gapData = JSON.parse(chip.getAttribute('data-gap'));
            _showGapConfigModal(gapData, (newData) => {
                // Mettre a jour le chip
                const newChip = _createChip(newData);
                chip.replaceWith(newChip);
                emitChange();
            }, () => {
                // Supprimer le trou → remplacer par la bonne reponse en texte
                const correct = Array.isArray(gapData.correct) ? gapData.correct[0] : gapData.correct;
                chip.replaceWith(document.createTextNode(correct || ''));
                emitChange();
            });
        } catch (e2) {
            // data-gap invalide
        }
    });

    // Input dans le contenteditable
    editable.addEventListener('input', () => {
        emitChange();
    });

    // Input dans le source
    source.addEventListener('input', () => {
        source.style.height = 'auto';
        source.style.height = Math.max(source.scrollHeight, 80) + 'px';
        emitChange();
    });

    // Focus/blur pour le style
    editable.addEventListener('focus', () => container.classList.add('json-editor__richtext-container--focused'));
    editable.addEventListener('blur', () => {
        setTimeout(() => container.classList.remove('json-editor__richtext-container--focused'), 200);
    });
    source.addEventListener('focus', () => container.classList.add('json-editor__richtext-container--focused'));
    source.addEventListener('blur', () => {
        setTimeout(() => container.classList.remove('json-editor__richtext-container--focused'), 200);
    });

    return wrapper;
}
