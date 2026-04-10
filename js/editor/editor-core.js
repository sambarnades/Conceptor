/**
 * Editor Core - Moteur principal de rendu de l'editeur
 *
 * Layout maitre-detail : panneau de navigation (gauche) + panneau de detail (droite).
 * Le panneau nav liste les sections du schema et, pour les sections contenant un
 * tableau, affiche la liste des items avec resume et statut.
 * Le panneau detail affiche les champs de la section ou de l'item selectionne.
 */

import { t } from '../core/translation.js';
import {
    fieldRenderers,
    renderActionBar,
    renderEditorHeader,
    escapeHtml,
    generateId
} from './field-renderers.js';
import { createArrayManager, showConfirm, showAlert } from './array-manager.js';
import { createFeedbackEditor } from './feedback-editor.js';
import { getNestedValue, setNestedValue } from './json-utils.js';
import { resolveRenderTypeForField } from './richtext-editor.js';

// Exposer createArrayManager globalement pour les renderers dynamiques (pageBlockData)
window._jsonEditorArrayManager = { createArrayManager };

// =======================================================================
// ETAT INTERNE
// =======================================================================

let editorData = null;
let editorSchema = null;
let editorOptions = null;
let arrayManagers = new Map();
let feedbackEditors = new Map();

// Exposer createFeedbackEditor et feedbackEditors pour les renderers dynamiques
window._jsonEditorFeedback = { createFeedbackEditor, feedbackEditors };

// Etat de navigation
let navState = {
    sectionId: null,
    itemIndex: null    // null = vue section, number = vue item
};

// References DOM
let navElement = null;
let detailElement = null;
let editorContainer = null;

// Drag state pour le nav
let dragState = { fromIndex: null };

// =======================================================================
// UTILITAIRES
// =======================================================================

function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

/**
 * Résout le renderer approprié pour un champ.
 * Si le champ est un textarea et que field-constraints.js indique un renderType
 * compatible WYSIWYG (html+latex, html, unicode+markers), utilise le renderer richtext.
 * Sinon, utilise le renderer par défaut.
 *
 * @param {object} fieldConfig — Configuration du champ (type, label, etc.)
 * @param {string} fieldPath — Chemin du champ dans les données
 * @returns {{ renderer: function, config: object }}
 */
function getRendererForField(fieldConfig, fieldPath) {
    if (!editorOptions?.moduleKey) {
        return { renderer: fieldRenderers[fieldConfig.type] || fieldRenderers['text'], config: fieldConfig };
    }

    const renderType = resolveRenderTypeForField(editorOptions.moduleKey, fieldPath);
    if (!renderType || !['html+latex', 'html', 'unicode+markers'].includes(renderType)) {
        return { renderer: fieldRenderers[fieldConfig.type] || fieldRenderers['text'], config: fieldConfig };
    }

    if (fieldConfig.type === 'textarea') {
        // Textarea → éditeur richtext complet (toolbar, formule, etc.)
        return {
            renderer: fieldRenderers['richtext'] || fieldRenderers['textarea'],
            config: { ...fieldConfig, renderType }
        };
    }

    if (fieldConfig.type === 'text') {
        // Input une ligne → éditeur richtext compact (toolbar minimale au focus)
        return {
            renderer: fieldRenderers['richtext'] || fieldRenderers['text'],
            config: { ...fieldConfig, renderType, compact: true }
        };
    }

    return { renderer: fieldRenderers[fieldConfig.type] || fieldRenderers['text'], config: fieldConfig };
}

// Exposer getRendererForField pour les renderers dynamiques (dynamicObject, fieldGroup dans field-renderers.js)
window._jsonEditorRichtext = { getRendererForField };

/**
 * Trouve le champ tableau principal d'une section (s'il existe)
 */
function findPrimaryArrayField(section) {
    if (!section.fields) return null;
    for (const [key, config] of Object.entries(section.fields)) {
        if (config.type === 'array' && !config.nested) {
            return { path: key, config };
        }
    }
    return null;
}

/**
 * Cree un element vide base sur le schema d'un item
 */
function createEmptyItem(itemSchema) {
    if (!itemSchema) return {};

    const valueField = Object.entries(itemSchema).find(([, v]) => v.isArrayValue);
    if (valueField) return '';

    const item = {};
    for (const [key, fieldConfig] of Object.entries(itemSchema)) {
        let defaultValue;
        if (fieldConfig.type === 'array') {
            defaultValue = [];
        } else if (fieldConfig.type === 'dynamicObject') {
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
            defaultValue = fieldConfig.default;
        } else {
            defaultValue = fieldConfig.default || '';
        }

        if (key.includes('.')) {
            setNestedValue(item, key, defaultValue);
        } else {
            item[key] = defaultValue;
        }
    }
    return item;
}

/**
 * Genere un resume d'un item pour le panneau nav
 */
function getItemSummary(item, config) {
    if (!item) return '';

    // Support pour dynamicTitleField
    if (config.dynamicTitleField && item[config.dynamicTitleField]) {
        const fieldValue = item[config.dynamicTitleField];
        if (config.itemSchema && config.itemSchema[config.dynamicTitleField]) {
            const fieldSchema = config.itemSchema[config.dynamicTitleField];
            if (fieldSchema.options) {
                const opt = fieldSchema.options.find(o => o.value === fieldValue);
                if (opt) return translateLabel(opt.label) || opt.label;
            }
        }
        return String(fieldValue);
    }

    // Champs standard
    if (item.metadata?.title) return item.metadata.title;
    if (item.params?.question) {
        const tmp = document.createElement('div');
        tmp.innerHTML = item.params.question;
        return tmp.textContent || '';
    }
    if (typeof item === 'string') return item;
    if (item.title) return item.title;
    if (item.name) return item.name;
    if (item.question) return item.question;
    if (item.text) return item.text;
    if (item.word) return item.word;
    if (item.keyword) return item.keyword;
    if (item.concept) return item.concept;
    if (item.answer) return item.answer;
    if (item.clue) return item.clue;

    // Premier champ non vide du schema
    if (config.itemSchema) {
        for (const [key] of Object.entries(config.itemSchema)) {
            if (key.startsWith('_')) continue;
            const val = item[key];
            if (val && typeof val === 'string' && val.trim()) return val;
        }
    }

    return '';
}

/**
 * Tronque un texte sans couper les formules LaTeX \(...\).
 * Si la coupure tombe dans une formule, on inclut la formule entiere.
 * Normalise les delimiteurs display-math en inline pour la sidebar.
 */
function _smartTruncate(text, maxLen) {
    if (!text) return text;

    // Normaliser les delimiteurs display-math en inline pour la sidebar nav
    // Le healer convertit \begin{equation} → \[...\], on ramene en inline \(...\)
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, '\\($1\\)');
    // Filet de securite : environnements LaTeX non convertis par le healer
    text = text.replace(/\\begin\{(?:equation|math)\}([\s\S]*?)\\end\{(?:equation|math)\}/g, '\\($1\\)');

    if (text.length <= maxLen) return text;

    // Chercher si la coupure tombe dans un \(...\)
    let cutPos = maxLen;
    const openIdx = text.lastIndexOf('\\(', cutPos);
    if (openIdx !== -1) {
        const closeIdx = text.indexOf('\\)', openIdx);
        if (closeIdx !== -1 && closeIdx > cutPos) {
            // La formule depasse la limite — l'inclure entierement
            cutPos = closeIdx + 2;
        }
    }

    if (cutPos >= text.length) return text;
    return text.substring(0, cutPos) + '...';
}

/**
 * Declenche le rendu MathJax sur le panneau de navigation.
 * Appele apres la construction de la nav pour rendre les formules LaTeX.
 */
function _renderMathInNav() {
    if (!navElement) return;
    import('../core/lib-loader.js').then(({ loadMathJax }) => {
        loadMathJax().then(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                const items = navElement.querySelectorAll('.json-editor__nav-subitem-text');
                if (items.length > 0) {
                    window.MathJax.typesetPromise(Array.from(items)).catch(() => {});
                }
            }
        }).catch(() => {});
    }).catch(() => {});
}

/**
 * Verifie si un item est complet selon son schema.
 * Retourne 'complete' | 'error' | 'empty'.
 * Parcourt les champs required, y compris dans les sous-objets et fieldGroups.
 */
function getItemStatus(item, config) {
    if (!item || !config.itemSchema) return 'empty';

    // Valeur simple
    const valueField = Object.entries(config.itemSchema).find(([, v]) => v.isArrayValue);
    if (valueField) {
        if (!item || (typeof item === 'string' && !item.trim())) return 'empty';
        return 'complete';
    }

    let hasContent = false;
    let hasError = false;

    function checkFields(schema, data) {
        if (!schema || !data) return;
        for (const [key, fieldConfig] of Object.entries(schema)) {
            if (fieldConfig.hidden) continue;

            // fieldGroup : parcourir les sous-champs (pas de namespace)
            if (fieldConfig.type === 'fieldGroup' && fieldConfig.fields) {
                checkFields(fieldConfig.fields, data);
                continue;
            }

            // object collapsible : parcourir les sous-champs
            if (fieldConfig.type === 'object' && fieldConfig.schema) {
                const subData = getNestedValue(data, key);
                if (subData) checkFields(fieldConfig.schema, subData);
                continue;
            }

            const value = getNestedValue(data, key);

            // Champ required vide → erreur
            if (fieldConfig.required) {
                if (value === null || value === undefined ||
                    (typeof value === 'string' && !value.trim()) ||
                    (Array.isArray(value) && value.length === 0)) {
                    hasError = true;
                }
            }

            // Verifier s'il y a du contenu (texte, nombre, tableau non-vide, boolean true)
            if (value !== null && value !== undefined && value !== '' && value !== false) {
                if (Array.isArray(value)) {
                    if (value.length > 0) hasContent = true;
                } else {
                    hasContent = true;
                }
            }
        }
    }

    checkFields(config.itemSchema, item);

    if (hasError) return 'error';
    if (hasContent) return 'complete';
    return 'empty';
}

/**
 * Retourne l'icone FontAwesome pour un statut d'item
 */
function getStatusIcon(status) {
    switch (status) {
        case 'complete': return 'fa-check';
        case 'error': return 'fa-exclamation-triangle';
        default: return 'fa-circle';
    }
}

/**
 * Retourne la classe CSS pour un statut d'item
 */
function getStatusClass(status) {
    switch (status) {
        case 'complete': return 'json-editor__nav-subitem-status--complete';
        case 'error': return 'json-editor__nav-subitem-status--error';
        default: return 'json-editor__nav-subitem-status--empty';
    }
}

/**
 * Options dynamiques pour select/multiCheckbox lies a un autre tableau
 */
function getDynamicSelectOptions(optionsFrom, labelField, basePath) {
    if (!editorData) return [];

    let sourceArray;

    // Resolution relative : remonter au parent
    if (basePath && basePath.includes('.')) {
        const parentPath = basePath.substring(0, basePath.lastIndexOf('.'));
        const parentObj = getNestedValue(editorData, parentPath);
        if (parentObj && Array.isArray(parentObj[optionsFrom])) {
            sourceArray = parentObj[optionsFrom];
        }
    }

    // Fallback global
    if (!sourceArray) {
        sourceArray = editorData[optionsFrom];
    }

    if (!Array.isArray(sourceArray)) return [];
    return sourceArray.map((item, index) => ({
        value: String(index),
        label: item[labelField] || `Zone ${index + 1}`
    }));
}

// =======================================================================
// RENDU PRINCIPAL
// =======================================================================

/**
 * Rend l'editeur complet en layout maitre-detail
 */
export function renderEditor(container, data, schema, options = {}) {
    // Sauvegarder l'etat
    editorData = data;
    editorSchema = schema;
    editorOptions = options;
    arrayManagers.clear();
    feedbackEditors.clear();
    editorContainer = container;

    // Exposer pour les selects dynamiques
    window._jsonEditorData = data;
    window._jsonEditorUtils = { getNestedValue };

    // Nettoyer
    container.innerHTML = '';

    const editor = document.createElement('div');
    editor.className = 'json-editor json-editor--master-detail';

    // Header
    const header = renderEditorHeader(
        options.moduleName || options.moduleKey || 'Unknown',
        options.moduleKey || ''
    );
    editor.appendChild(header);

    // Body : grille nav + detail
    const body = document.createElement('div');
    body.className = 'json-editor__body';

    // Nav
    const nav = document.createElement('nav');
    nav.className = 'json-editor__nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', translateLabel('editor_nav_sections') || 'Sections');
    nav.setAttribute('aria-orientation', 'vertical');
    navElement = nav;
    body.appendChild(nav);

    // Detail
    const detail = document.createElement('div');
    detail.className = 'json-editor__detail';
    detail.setAttribute('role', 'tabpanel');
    detailElement = detail;
    body.appendChild(detail);

    editor.appendChild(body);

    // Barre d'actions (footer)
    const actionBar = renderActionBar(false, options.onSave, options.onCancel);
    editor.appendChild(actionBar);

    container.appendChild(editor);

    // Rendre le nav
    renderNavPanel();

    // Selectionner la premiere section
    if (schema.sections && schema.sections.length > 0) {
        const firstSection = schema.sections[0];
        const arrayField = findPrimaryArrayField(firstSection);
        if (arrayField) {
            const items = getNestedValue(data, arrayField.path) || [];
            navigateTo(firstSection.id, items.length > 0 ? 0 : null);
        } else {
            navigateTo(firstSection.id);
        }
    }

    // Fermer les dropdowns mobile au clic en dehors
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.json-editor__nav-section')) {
            navElement?.querySelectorAll('.json-editor__nav-items--mobile-open')
                .forEach(el => el.classList.remove('json-editor__nav-items--mobile-open'));
        }
    });
}

// =======================================================================
// PANNEAU DE NAVIGATION
// =======================================================================

/**
 * Rend le panneau de navigation complet
 */
function renderNavPanel() {
    if (!navElement || !editorSchema) return;
    navElement.innerHTML = '';

    for (const section of editorSchema.sections) {
        const navSection = document.createElement('div');
        navSection.className = 'json-editor__nav-section';
        navSection.dataset.sectionId = section.id;

        // Bouton section
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'json-editor__nav-item';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');

        const icon = section.icon || 'fa-folder';
        const label = translateLabel(section.label);

        let countHtml = '';
        if (section.countField) {
            const arr = getNestedValue(editorData, section.countField);
            if (Array.isArray(arr)) {
                countHtml = `<span class="json-editor__nav-count">${arr.length}</span>`;
            }
        }

        btn.innerHTML = `
            <i class="fas ${icon} json-editor__nav-item-icon"></i>
            <span class="json-editor__nav-item-label">${escapeHtml(label)}</span>
            ${countHtml}
        `;

        btn.addEventListener('click', () => {
            const af = findPrimaryArrayField(section);
            if (af && isMobileLayout()) {
                // Sur mobile, toggle le dropdown d'items
                const itemList = navSection.querySelector('.json-editor__nav-items');
                if (itemList) {
                    // Fermer les autres dropdowns
                    navElement.querySelectorAll('.json-editor__nav-items--mobile-open')
                        .forEach(el => { if (el !== itemList) el.classList.remove('json-editor__nav-items--mobile-open'); });
                    itemList.classList.toggle('json-editor__nav-items--mobile-open');
                }
                // Selectionner la section mais ne pas forcer un item
                if (navState.sectionId !== section.id) {
                    const items = getNestedValue(editorData, af.path) || [];
                    navigateTo(section.id, items.length > 0 ? 0 : null);
                }
            } else if (af) {
                const items = getNestedValue(editorData, af.path) || [];
                const idx = items.length > 0 ? 0 : null;
                navigateTo(section.id, idx);
            } else {
                navigateTo(section.id);
            }
        });

        navSection.appendChild(btn);

        // Liste d'items pour les sections tableau
        const arrayField = findPrimaryArrayField(section);
        if (arrayField) {
            const itemList = document.createElement('div');
            itemList.className = 'json-editor__nav-items';
            itemList.dataset.sectionId = section.id;
            itemList.dataset.arrayPath = arrayField.path;
            renderNavItemList(itemList, section.id, arrayField);
            navSection.appendChild(itemList);
        }

        navElement.appendChild(navSection);
    }
}

/**
 * Rend la liste d'items dans le nav pour une section tableau
 */
function renderNavItemList(container, sectionId, arrayField) {
    container.innerHTML = '';
    const items = getNestedValue(editorData, arrayField.path) || [];
    const itemLabel = translateLabel(arrayField.config.itemLabel) || translateLabel('editor_element') || 'Element';
    const isFixedLength = arrayField.config.fixedLength === true;

    // Détection du mode "chapitre/sous-chapitre" (Livre) : itemSchema avec un champ subchapter checkbox.
    // Le 1er item ne peut jamais être un sous-chapitre (forçage automatique).
    const hasSubchapterMode = !!(arrayField.config.itemSchema
        && arrayField.config.itemSchema.subchapter
        && arrayField.config.itemSchema.subchapter.type === 'checkbox');
    if (hasSubchapterMode && items.length > 0 && items[0] && (items[0].subchapter === true || items[0].subchapter === 1)) {
        items[0].subchapter = false;
    }

    // Compteurs pour la numérotation hiérarchique des chapitres / sous-chapitres
    let chapterCounter = 0;
    let subchapterCounter = 0;
    let lastParentNumber = 0;

    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'json-editor__nav-subitem';
        btn.dataset.index = index;
        btn.draggable = false;

        const summary = getItemSummary(item, arrayField.config);
        const displayText = summary ? _smartTruncate(summary, 50) : `${itemLabel} ${index + 1}`;
        const status = getItemStatus(item, arrayField.config);

        // Calcul du label affiché dans la pastille de gauche
        // - Mode subchapter : 1, 2, 3 pour les chapitres ; A, B, C... pour les sous-chapitres (reset à chaque parent)
        // - Mode normal : index + 1
        let numberLabel = String(index + 1);
        if (hasSubchapterMode) {
            const isSub = item && (item.subchapter === true || item.subchapter === 1);
            if (isSub) {
                subchapterCounter++;
                // A, B, ..., Z, AA, AB, ...
                let n = subchapterCounter;
                let letters = '';
                while (n > 0) {
                    const rem = (n - 1) % 26;
                    letters = String.fromCharCode(65 + rem) + letters;
                    n = Math.floor((n - 1) / 26);
                }
                // Format hiérarchique : "1.A", "1.B", "2.A"... pour bien montrer le rattachement
                numberLabel = lastParentNumber > 0 ? `${lastParentNumber}.${letters}` : letters;
                btn.classList.add('json-editor__nav-subitem--subchapter');
            } else {
                chapterCounter++;
                subchapterCounter = 0;
                lastParentNumber = chapterCounter;
                numberLabel = String(chapterCounter);
            }
        }

        btn.innerHTML = `
            <span class="json-editor__nav-subitem-drag" title="${translateLabel('editor_drag') || 'Deplacer'}">
                <i class="fas fa-grip-vertical"></i>
            </span>
            <span class="json-editor__nav-subitem-number">${escapeHtml(numberLabel)}</span>
            <span class="json-editor__nav-subitem-text">${escapeHtml(displayText)}</span>
            <i class="fas ${getStatusIcon(status)} json-editor__nav-subitem-status ${getStatusClass(status)}"></i>
        `;

        btn.addEventListener('click', (e) => {
            if (e.target.closest('.json-editor__nav-subitem-drag')) return;
            // Fermer le dropdown mobile apres selection
            const parentList = btn.closest('.json-editor__nav-items');
            if (parentList) parentList.classList.remove('json-editor__nav-items--mobile-open');
            navigateTo(sectionId, index);
        });

        // Drag & drop via la poignee
        const dragHandle = btn.querySelector('.json-editor__nav-subitem-drag');
        dragHandle.addEventListener('mousedown', () => { btn.draggable = true; });
        dragHandle.addEventListener('mouseup', () => { btn.draggable = false; });
        btn.addEventListener('dragstart', (e) => {
            dragState.fromIndex = index;
            btn.classList.add('json-editor__nav-subitem--dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
        });
        btn.addEventListener('dragend', () => {
            btn.classList.remove('json-editor__nav-subitem--dragging');
            btn.draggable = false;
            dragState.fromIndex = null;
            container.querySelectorAll('.json-editor__nav-subitem--drag-over')
                .forEach(el => el.classList.remove('json-editor__nav-subitem--drag-over'));
        });
        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragState.fromIndex !== null && dragState.fromIndex !== index) {
                btn.classList.add('json-editor__nav-subitem--drag-over');
            }
        });
        btn.addEventListener('dragleave', () => {
            btn.classList.remove('json-editor__nav-subitem--drag-over');
        });
        btn.addEventListener('drop', (e) => {
            e.preventDefault();
            btn.classList.remove('json-editor__nav-subitem--drag-over');
            if (dragState.fromIndex !== null && dragState.fromIndex !== index) {
                handleArrayMove(sectionId, arrayField.path, dragState.fromIndex, index);
            }
        });

        container.appendChild(btn);
    });

    // Bouton ajouter
    if (!isFixedLength && (!arrayField.config.maxItems || items.length < arrayField.config.maxItems)) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'json-editor__nav-add-btn';
        const addLabel = translateLabel(arrayField.config.addLabel) || translateLabel('editor_add_item') || 'Ajouter';
        addBtn.innerHTML = `<i class="fas fa-plus"></i> ${escapeHtml(addLabel)}`;
        addBtn.addEventListener('click', () => handleArrayAdd(sectionId, arrayField));
        container.appendChild(addBtn);
    }

    // Rendre les formules LaTeX dans les résumés de la nav
    requestAnimationFrame(() => _renderMathInNav());
}

/**
 * Rafraichit la liste d'items du nav pour une section
 */
function refreshNavItemList(sectionId) {
    if (!navElement) return;
    const section = editorSchema.sections.find(s => s.id === sectionId);
    if (!section) return;
    const arrayField = findPrimaryArrayField(section);
    if (!arrayField) return;

    const container = navElement.querySelector(`.json-editor__nav-items[data-section-id="${sectionId}"]`);
    if (!container) return;

    renderNavItemList(container, sectionId, arrayField);

    // Mettre a jour le badge compteur
    const sectionBtn = navElement.querySelector(`.json-editor__nav-section[data-section-id="${sectionId}"] .json-editor__nav-count`);
    const items = getNestedValue(editorData, arrayField.path) || [];
    if (sectionBtn) {
        sectionBtn.textContent = items.length;
    }

    updateNavActiveState();
}

/**
 * Met a jour le resume d'un item specifique dans le nav
 */
function updateNavItemSummary(sectionId, index) {
    if (!navElement) return;
    const container = navElement.querySelector(`.json-editor__nav-items[data-section-id="${sectionId}"]`);
    if (!container) return;

    const btn = container.querySelector(`.json-editor__nav-subitem[data-index="${index}"]`);
    if (!btn) return;

    const section = editorSchema.sections.find(s => s.id === sectionId);
    if (!section) return;
    const arrayField = findPrimaryArrayField(section);
    if (!arrayField) return;

    const items = getNestedValue(editorData, arrayField.path) || [];
    const item = items[index];
    if (!item) return;

    const itemLabel = translateLabel(arrayField.config.itemLabel) || translateLabel('editor_element') || 'Element';
    const summary = getItemSummary(item, arrayField.config);
    const displayText = summary ? _smartTruncate(summary, 50) : `${itemLabel} ${index + 1}`;

    const textSpan = btn.querySelector('.json-editor__nav-subitem-text');
    if (textSpan) textSpan.textContent = displayText;

    const status = getItemStatus(item, arrayField.config);
    const statusIcon = btn.querySelector('.json-editor__nav-subitem-status');
    if (statusIcon) {
        statusIcon.className = `fas ${getStatusIcon(status)} json-editor__nav-subitem-status ${getStatusClass(status)}`;
    }
}

/**
 * Met a jour les etats actifs du nav
 */
function updateNavActiveState() {
    if (!navElement) return;

    // Sections
    navElement.querySelectorAll('.json-editor__nav-item').forEach(btn => {
        const sectionEl = btn.closest('.json-editor__nav-section');
        const isActive = sectionEl?.dataset.sectionId === navState.sectionId;
        btn.classList.toggle('json-editor__nav-item--active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Items
    navElement.querySelectorAll('.json-editor__nav-subitem').forEach(btn => {
        const sectionEl = btn.closest('.json-editor__nav-section');
        const isSameSection = sectionEl?.dataset.sectionId === navState.sectionId;
        const isActive = isSameSection && parseInt(btn.dataset.index) === navState.itemIndex;
        btn.classList.toggle('json-editor__nav-subitem--active', isActive);
    });

    // Items list visibility :
    // Toutes les sections avec tableau restent depliees (vue d'ensemble)
    navElement.querySelectorAll('.json-editor__nav-items').forEach(list => {
        list.classList.add('json-editor__nav-items--visible');
        // Fermer le dropdown mobile quand on selectionne un item
        list.classList.remove('json-editor__nav-items--mobile-open');
    });
}

/**
 * Detecte si on est en mode mobile (nav horizontal)
 */
function isMobileLayout() {
    return window.matchMedia('(max-width: 768px)').matches;
}

// =======================================================================
// NAVIGATION
// =======================================================================

/**
 * Navigue vers une section / un item
 */
function navigateTo(sectionId, itemIndex = null, options = {}) {
    // Collecter les donnees de la vue actuelle avant de basculer
    // (sauf si l'appelant a deja collecte ET mute la structure : dans ce cas
    // les data-path du DOM pointent vers des indices obsoletes et re-collecter
    // ecraserait les items voisins avec les valeurs de l'item supprime/deplace).
    if (!options.skipCollect) {
        collectCurrentViewData();
    } else {
        // On vide quand meme les managers car le DOM va etre re-rendu
        arrayManagers.clear();
        feedbackEditors.clear();
    }

    navState.sectionId = sectionId;
    navState.itemIndex = itemIndex;

    updateNavActiveState();
    renderDetailContent();
}

/**
 * Collecte les donnees de la vue actuelle
 */
function collectCurrentViewData() {
    arrayManagers.forEach((manager, path) => {
        setNestedValue(editorData, path, manager.getData());
    });
    feedbackEditors.forEach((editor, path) => {
        setNestedValue(editorData, path, editor.getData());
    });
    collectInputValues();
    arrayManagers.clear();
    feedbackEditors.clear();
}

// =======================================================================
// PANNEAU DE DETAIL
// =======================================================================

/**
 * Rend le contenu du panneau de detail selon la selection
 */
function renderDetailContent() {
    if (!detailElement || !editorSchema) return;
    detailElement.innerHTML = '';

    const section = editorSchema.sections.find(s => s.id === navState.sectionId);
    if (!section) return;

    const arrayField = findPrimaryArrayField(section);

    if (arrayField && navState.itemIndex !== null) {
        renderItemDetail(section, arrayField);
    } else if (arrayField && navState.itemIndex === null) {
        renderEmptyArrayState(section, arrayField);
    } else {
        renderSectionDetail(section);
    }
}

/**
 * Rend les champs d'une section (non-tableau) dans le detail
 */
function renderSectionDetail(section) {
    const label = translateLabel(section.label);
    const icon = section.icon || 'fa-folder';

    // Header
    const header = document.createElement('div');
    header.className = 'json-editor__detail-header';
    header.innerHTML = `
        <div class="json-editor__detail-title">
            <i class="fas ${icon}"></i>
            <span>${escapeHtml(label)}</span>
        </div>
    `;
    detailElement.appendChild(header);

    // Contenu
    const content = document.createElement('div');
    content.className = 'json-editor__detail-content';

    if (section.fields) {
        for (const [fieldKey, fieldConfig] of Object.entries(section.fields)) {
            if (fieldConfig.hidden) continue;

            if (fieldConfig.type === 'fieldGroup') {
                const groupEl = renderFieldGroupInSection(fieldConfig, editorData, editorOptions.onChange);
                content.appendChild(groupEl);
            } else {
                const value = getNestedValue(editorData, fieldKey);
                const { renderer, config: resolvedConfig } = getRendererForField(fieldConfig, fieldKey);
                const fieldElement = renderer(resolvedConfig, value, (path, val) => {
                    handleFieldChange(path, val);
                }, fieldKey);
                content.appendChild(fieldElement);

                // showWhen
                if (fieldConfig.showWhen) {
                    applyShowWhen(fieldElement, fieldConfig.showWhen, editorData, section.fields);
                }
            }
        }

        setupSectionShowWhenListeners(content, section.fields);
    }

    detailElement.appendChild(content);

    // Initialiser les champs speciaux (feedbackRanges, tableaux non-primaires)
    initializeDetailSpecialFields(content);
}

/**
 * Rend un item specifique dans le detail
 */
function renderItemDetail(section, arrayField) {
    const items = getNestedValue(editorData, arrayField.path) || [];
    const index = navState.itemIndex;
    const item = items[index];
    const itemLabel = translateLabel(arrayField.config.itemLabel) || translateLabel('editor_element') || 'Element';
    const isFixedLength = arrayField.config.fixedLength === true;

    // Header avec titre, navigation et actions
    const header = document.createElement('div');
    header.className = 'json-editor__detail-header';

    const title = document.createElement('div');
    title.className = 'json-editor__detail-title';
    title.innerHTML = `
        <span class="json-editor__detail-item-number">${index + 1}</span>
        <span>${escapeHtml(itemLabel)} ${index + 1} / ${items.length}</span>
    `;
    title.style.fontSize = '0.85rem';

    const actions = document.createElement('div');
    actions.className = 'json-editor__detail-actions';

    // Navigation prev/next
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'json-editor__detail-nav-btn';
    prevBtn.disabled = index <= 0;
    prevBtn.title = translateLabel('editor_prev_item') || 'Precedent';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => navigateTo(section.id, index - 1));

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'json-editor__detail-nav-btn';
    nextBtn.disabled = index >= items.length - 1;
    nextBtn.title = translateLabel('editor_next_item') || 'Suivant';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => navigateTo(section.id, index + 1));

    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);

    // Actions CRUD (sauf si fixedLength)
    if (!isFixedLength) {
        const sep = document.createElement('span');
        sep.className = 'json-editor__detail-actions-sep';
        actions.appendChild(sep);

        const dupBtn = document.createElement('button');
        dupBtn.type = 'button';
        dupBtn.className = 'json-editor__detail-action-btn';
        dupBtn.title = translateLabel('editor_duplicate') || 'Dupliquer';
        dupBtn.innerHTML = '<i class="fas fa-copy"></i>';
        dupBtn.addEventListener('click', () => handleArrayDuplicate(section.id, arrayField, index));
        actions.appendChild(dupBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'json-editor__detail-action-btn json-editor__detail-action-btn--danger';
        delBtn.title = translateLabel('editor_delete') || 'Supprimer';
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        delBtn.addEventListener('click', () => handleArrayRemove(section.id, arrayField, index));
        actions.appendChild(delBtn);
    }

    header.appendChild(title);
    header.appendChild(actions);
    detailElement.appendChild(header);

    // Contenu de l'item
    const content = document.createElement('div');
    content.className = 'json-editor__detail-content';

    if (item !== undefined && arrayField.config.itemSchema) {
        const basePath = `${arrayField.path}.${index}`;
        renderItemFields(content, item, arrayField.config.itemSchema, basePath, (path, val) => {
            handleFieldChange(path, val);
            // Mettre a jour le resume dans le nav
            updateNavItemSummary(section.id, index);
        });
    }

    detailElement.appendChild(content);

    // Initialiser les champs speciaux imbriques
    initializeDetailSpecialFields(content);

    // Cas spécial Livre : gestion du checkbox "subchapter"
    if (arrayField.config.itemSchema
        && arrayField.config.itemSchema.subchapter
        && arrayField.config.itemSchema.subchapter.type === 'checkbox') {
        const subchapterInput = content.querySelector(`input[type="checkbox"][data-path="${arrayField.path}.${index}.subchapter"]`);
        if (subchapterInput) {
            const wrapper = subchapterInput.closest('.json-editor__field--checkbox') || subchapterInput.closest('.json-editor__field');

            // 1) Verrouillage du 1er chapitre (jamais sous-chapitre)
            if (index === 0) {
                subchapterInput.checked = false;
                subchapterInput.disabled = true;
                if (wrapper) {
                    wrapper.style.opacity = '0.45';
                    wrapper.style.pointerEvents = 'none';
                    wrapper.title = translateLabel('editor_livre_subchapter_locked')
                        || 'Le premier chapitre ne peut pas être un sous-chapitre';
                }
                if (items[0] && (items[0].subchapter === true || items[0].subchapter === 1)) {
                    items[0].subchapter = false;
                }
            }

            // 2) Indicateur de rattachement au chapitre parent (mère)
            //    Affiché dès que le sous-chapitre est coché. Calcul du parent = chapitre normal
            //    le plus proche en remontant dans la liste.
            if (index > 0 && wrapper) {
                const parentInfo = document.createElement('div');
                parentInfo.className = 'json-editor__subchapter-parent-info';

                const refreshParentInfo = () => {
                    const isSub = items[index] && (items[index].subchapter === true || items[index].subchapter === 1);
                    if (!isSub) {
                        parentInfo.style.display = 'none';
                        parentInfo.innerHTML = '';
                        return;
                    }
                    // Trouver le parent : chapitre normal le plus proche en amont
                    let parentIdx = -1;
                    for (let i = index - 1; i >= 0; i--) {
                        const it = items[i];
                        if (it && !(it.subchapter === true || it.subchapter === 1)) {
                            parentIdx = i;
                            break;
                        }
                    }
                    if (parentIdx === -1) {
                        // Aucun parent trouvé : situation anormale (devrait être empêchée par le verrouillage du 1er)
                        parentInfo.style.display = '';
                        parentInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${escapeHtml(
                            translateLabel('editor_livre_subchapter_no_parent')
                            || 'Aucun chapitre parent disponible : ce sous-chapitre doit suivre un chapitre normal.'
                        )}`;
                        return;
                    }
                    // Calculer le numéro du parent (en ignorant les sous-chapitres précédents)
                    let parentNumber = 0;
                    for (let i = 0; i <= parentIdx; i++) {
                        const it = items[i];
                        if (it && !(it.subchapter === true || it.subchapter === 1)) {
                            parentNumber++;
                        }
                    }
                    const parentTitle = (items[parentIdx] && items[parentIdx].title) || '';
                    const labelTpl = translateLabel('editor_livre_subchapter_parent')
                        || 'Rattaché au chapitre {n} : {title}';
                    const text = labelTpl
                        .replace('{n}', String(parentNumber))
                        .replace('{title}', parentTitle || (translateLabel('editor_livre_chapter') || 'Chapitre'));
                    parentInfo.style.display = '';
                    parentInfo.innerHTML = `<i class="fas fa-link"></i> ${escapeHtml(text)}`;
                };

                refreshParentInfo();
                wrapper.appendChild(parentInfo);

                // Mettre à jour à chaque toggle de la case
                subchapterInput.addEventListener('change', () => {
                    requestAnimationFrame(refreshParentInfo);
                });
            }
        }
    }

    // Focus sur le premier champ
    requestAnimationFrame(() => {
        const textareas = content.querySelectorAll('textarea');
        textareas.forEach(ta => {
            ta.style.height = 'auto';
            const minH = ta.closest('.json-editor__array-item-subsection-content') ? 30 : 60;
            ta.style.height = Math.min(Math.max(ta.scrollHeight, minH), 300) + 'px';
        });
    });
}

/**
 * Etat vide quand une section tableau n'a pas d'items
 */
function renderEmptyArrayState(section, arrayField) {
    const label = translateLabel(section.label);
    const addLabel = translateLabel(arrayField.config.addLabel) || translateLabel('editor_add_item') || 'Ajouter';

    detailElement.innerHTML = `
        <div class="json-editor__detail-empty">
            <i class="fas fa-inbox"></i>
            <p>${escapeHtml(label)} — ${translateLabel('editor_no_items') || 'Aucun element'}</p>
            <button type="button" class="json-editor__nav-add-btn json-editor__nav-add-btn--large">
                <i class="fas fa-plus"></i> ${escapeHtml(addLabel)}
            </button>
        </div>
    `;

    detailElement.querySelector('.json-editor__nav-add-btn').addEventListener('click', () => {
        handleArrayAdd(section.id, arrayField);
    });
}

// =======================================================================
// RENDU DES CHAMPS D'UN ITEM
// =======================================================================

/**
 * Rend les champs d'un item dans un conteneur.
 * Gere tous les types speciaux : fieldGroup, nested array, pageBlockData,
 * dynamicObject, inline checkbox, optionsFrom, showWhen.
 */
function renderItemFields(container, item, itemSchema, basePath, onChange) {
    // Valeur simple (isArrayValue)
    const valueEntry = Object.entries(itemSchema).find(([, v]) => v.isArrayValue);
    if (valueEntry) {
        const [, fieldConfig] = valueEntry;
        const { renderer, config: resolvedConfig } = getRendererForField(fieldConfig, basePath);
        const el = renderer(resolvedConfig, item, onChange, basePath);
        container.appendChild(el);
        return;
    }

    for (const [fieldKey, fieldConfig] of Object.entries(itemSchema)) {
        if (fieldConfig.hidden) continue;

        const fieldValue = item ? getNestedValue(item, fieldKey) : undefined;
        const fieldPath = `${basePath}.${fieldKey}`;

        // showWhen : determiner si masque
        let showWhenHidden = false;
        if (fieldConfig.showWhen && item) {
            const sw = fieldConfig.showWhen;
            let refValue = item[sw.field];
            if (refValue === undefined && itemSchema[sw.field]?.default !== undefined) {
                refValue = itemSchema[sw.field].default;
            }
            const matches = sw.values ? sw.values.includes(refValue) : refValue === sw.value;
            if (!matches) showWhenHidden = true;
        }

        let fieldElement;

        if (fieldConfig.type === 'fieldGroup') {
            fieldElement = renderFieldGroupInItem(fieldConfig, item, basePath, onChange, itemSchema);
        } else if (fieldConfig.type === 'array' && fieldConfig.nested) {
            // Tableau imbrique → ArrayManager
            fieldElement = document.createElement('div');
            fieldElement.className = 'json-editor__field json-editor__field--array-nested';
            const nestedLabel = translateLabel(fieldConfig.label);
            fieldElement.innerHTML = `
                <label class="json-editor__label">${escapeHtml(nestedLabel)}</label>
                <div class="json-editor__nested-array-content"></div>
            `;
            const nestedContent = fieldElement.querySelector('.json-editor__nested-array-content');
            const manager = createArrayManager(
                nestedContent,
                fieldValue || [],
                fieldConfig,
                fieldPath,
                (p, v) => onChange(p, v)
            );
            arrayManagers.set(fieldPath, manager);
        } else if (fieldConfig.type === 'array') {
            // Tableau non-imbrique → placeholder pour initializeDetailSpecialFields
            fieldElement = document.createElement('div');
            fieldElement.className = 'json-editor__field json-editor__field--array';
            fieldElement.dataset.path = fieldPath;
            fieldElement.dataset.config = JSON.stringify(fieldConfig);
        } else if (fieldConfig.type === 'pageBlockData') {
            const blockType = item ? item.type : '';
            fieldElement = fieldRenderers['pageBlockData'](fieldConfig, fieldValue || {}, onChange, fieldPath, blockType);
        } else if (fieldConfig.type === 'dynamicObject') {
            const selectorKey = fieldConfig.selector || 'type';
            const selectorValue = item ? item[selectorKey] : '';
            fieldElement = fieldRenderers['dynamicObject'](fieldConfig, fieldValue || {}, onChange, fieldPath, selectorValue);
        } else if (fieldConfig.type === 'checkbox' && fieldConfig.inline) {
            const renderer = fieldRenderers['checkbox'];
            const checkboxEl = renderer(fieldConfig, fieldValue, onChange, fieldPath);
            const prevField = container.lastElementChild;
            if (prevField) {
                const row = document.createElement('div');
                row.className = 'json-editor__inline-checkbox-row';
                container.removeChild(prevField);
                row.appendChild(checkboxEl);
                row.appendChild(prevField);
                fieldElement = row;
            } else {
                fieldElement = checkboxEl;
            }
        } else if (fieldConfig.optionsFrom && (fieldConfig.type === 'select' || fieldConfig.type === 'multiCheckbox')) {
            const dynamicOptions = getDynamicSelectOptions(fieldConfig.optionsFrom, fieldConfig.optionsLabelField || 'label', basePath);
            const augmentedConfig = { ...fieldConfig, options: dynamicOptions };
            const renderer = fieldRenderers[fieldConfig.type];
            const defaultValue = fieldConfig.type === 'multiCheckbox' ? [] : '0';
            fieldElement = renderer(augmentedConfig, fieldValue !== undefined ? fieldValue : defaultValue, onChange, fieldPath);
        } else {
            const { renderer, config: resolvedConfig } = getRendererForField(fieldConfig, fieldPath);
            const rendered = renderer(resolvedConfig, fieldValue, onChange, fieldPath);

            // Champ simple avec collapsible : wrapper dans une sous-section pliable
            if (fieldConfig.collapsible && rendered) {
                fieldElement = document.createElement('div');
                fieldElement.className = 'json-editor__field json-editor__field--collapsible-wrapper';
                const cLabel = translateLabel(fieldConfig.collapsibleLabel || fieldConfig.label || '');
                fieldElement.innerHTML = `
                    <div class="json-editor__array-item-subsection">
                        <div class="json-editor__array-item-subsection-header">
                            <i class="fas fa-chevron-right"></i>
                            <span>${escapeHtml(cLabel)}</span>
                        </div>
                        <div class="json-editor__array-item-subsection-content" style="display: none;"></div>
                    </div>
                `;
                const cHeader = fieldElement.querySelector('.json-editor__array-item-subsection-header');
                const cContent = fieldElement.querySelector('.json-editor__array-item-subsection-content');
                const cSection = fieldElement.querySelector('.json-editor__array-item-subsection');
                cHeader.addEventListener('click', () => {
                    const expanded = cSection.classList.toggle('json-editor__array-item-subsection--expanded');
                    cContent.style.display = expanded ? '' : 'none';
                    cHeader.querySelector('i').className = expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
                });
                cContent.appendChild(rendered);
            } else {
                fieldElement = rendered;
            }
        }

        // Marquer showWhen
        if (fieldElement && showWhenHidden) {
            fieldElement.style.display = 'none';
            fieldElement.dataset.showWhenField = fieldConfig.showWhen.field;
            fieldElement.dataset.showWhenValue = fieldConfig.showWhen.value || '';
            if (fieldConfig.showWhen.values) {
                fieldElement.dataset.showWhenValues = JSON.stringify(fieldConfig.showWhen.values);
            }
        } else if (fieldElement && fieldConfig.showWhen) {
            fieldElement.dataset.showWhenField = fieldConfig.showWhen.field;
            fieldElement.dataset.showWhenValue = fieldConfig.showWhen.value || '';
            if (fieldConfig.showWhen.values) {
                fieldElement.dataset.showWhenValues = JSON.stringify(fieldConfig.showWhen.values);
            }
        }

        if (fieldElement) {
            // Marquer le groupe row si defini
            if (fieldConfig.row) {
                fieldElement.dataset.rowGroup = fieldConfig.row;
            }
            container.appendChild(fieldElement);
        }
    }

    // Grouper les champs avec le meme row en lignes cote a cote
    groupRowFields(container);

    // Listeners showWhen
    setupItemShowWhenListeners(container, itemSchema, basePath, item);

    // Listeners dynamicObject / pageBlockData
    setupItemDynamicListeners(container, itemSchema, basePath, item, onChange);
}

/**
 * Regroupe les champs consecutifs ayant le meme data-row-group dans un wrapper flex.
 */
function groupRowFields(container) {
    const children = Array.from(container.children);
    let i = 0;

    while (i < children.length) {
        const el = children[i];
        const rowGroup = el.dataset.rowGroup;

        if (rowGroup) {
            // Collecter tous les freres consecutifs avec le meme groupe
            const group = [el];
            let j = i + 1;
            while (j < children.length && children[j].dataset.rowGroup === rowGroup) {
                group.push(children[j]);
                j++;
            }

            if (group.length > 1) {
                const wrapper = document.createElement('div');
                wrapper.className = 'json-editor__field-row';
                // Inserer le wrapper a la place du premier element
                container.insertBefore(wrapper, group[0]);
                group.forEach(field => wrapper.appendChild(field));
            }
            i = j;
        } else {
            i++;
        }
    }
}

/**
 * Rend un fieldGroup dans un item (wrapper visuel, pas de namespace)
 */
function renderFieldGroupInItem(groupConfig, item, basePath, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field json-editor__field--fieldgroup';

    const groupLabel = translateLabel(groupConfig.collapsibleLabel || groupConfig.label || '');

    if (groupConfig.collapsible) {
        wrapper.innerHTML = `
            <div class="json-editor__array-item-subsection">
                <div class="json-editor__array-item-subsection-header">
                    <i class="fas fa-chevron-right"></i>
                    <span>${escapeHtml(groupLabel)}</span>
                </div>
                <div class="json-editor__array-item-subsection-content" style="display: none;"></div>
            </div>
        `;

        const header = wrapper.querySelector('.json-editor__array-item-subsection-header');
        const content = wrapper.querySelector('.json-editor__array-item-subsection-content');
        const subsection = wrapper.querySelector('.json-editor__array-item-subsection');

        header.addEventListener('click', () => {
            const expanded = subsection.classList.toggle('json-editor__array-item-subsection--expanded');
            content.style.display = expanded ? '' : 'none';
            header.querySelector('i').className = expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        });

        if (groupConfig.fields) {
            const fieldsContainer = document.createElement('div');
            if (groupConfig.inline) fieldsContainer.className = 'json-editor__field-row';

            for (const [subKey, subConfig] of Object.entries(groupConfig.fields)) {
                if (subConfig.hidden) continue;
                const subValue = item ? getNestedValue(item, subKey) : undefined;
                const subPath = `${basePath}.${subKey}`;
                const { renderer: subRenderer, config: subResolvedConfig } = getRendererForField(subConfig, subPath);
                const subField = subRenderer(subResolvedConfig, subValue, onChange, subPath);

                if (subConfig.showWhen) {
                    applyShowWhen(subField, subConfig.showWhen, item, groupConfig.fields);
                }
                fieldsContainer.appendChild(subField);
            }

            content.appendChild(fieldsContainer);
            setupShowWhenListenersGeneric(fieldsContainer, groupConfig.fields, basePath);
        }
    } else {
        const fieldsContainer = document.createElement('div');
        if (groupConfig.inline) fieldsContainer.className = 'json-editor__field-row';

        if (groupConfig.fields) {
            for (const [subKey, subConfig] of Object.entries(groupConfig.fields)) {
                if (subConfig.hidden) continue;
                const subValue = item ? getNestedValue(item, subKey) : undefined;
                const subPath = `${basePath}.${subKey}`;
                const { renderer: subRenderer, config: subResolvedConfig } = getRendererForField(subConfig, subPath);
                const subField = subRenderer(subResolvedConfig, subValue, onChange, subPath);

                if (subConfig.showWhen) {
                    applyShowWhen(subField, subConfig.showWhen, item, groupConfig.fields);
                }
                fieldsContainer.appendChild(subField);
            }

            setupShowWhenListenersGeneric(fieldsContainer, groupConfig.fields, basePath);
        }

        wrapper.appendChild(fieldsContainer);
    }

    return wrapper;
}

/**
 * Rend un fieldGroup dans une section
 */
function renderFieldGroupInSection(groupConfig, data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'json-editor__field-group';

    const fieldsContainer = document.createElement('div');
    if (groupConfig.inline) fieldsContainer.className = 'json-editor__field-row';

    if (groupConfig.fields) {
        for (const [subKey, subConfig] of Object.entries(groupConfig.fields)) {
            const value = getNestedValue(data, subKey);
            const { renderer, config: resolvedConfig } = getRendererForField(subConfig, subKey);
            const fieldElement = renderer(resolvedConfig, value, (path, val) => {
                handleFieldChange(path, val);
            }, subKey);

            if (subConfig.showWhen) {
                applyShowWhen(fieldElement, subConfig.showWhen, data, groupConfig.fields);
            }
            fieldsContainer.appendChild(fieldElement);
        }

        setupShowWhenListenersGeneric(fieldsContainer, groupConfig.fields, '');
    }

    wrapper.appendChild(fieldsContainer);
    return wrapper;
}

// =======================================================================
// SHOW WHEN
// =======================================================================

/**
 * Applique la visibilite conditionnelle initiale
 */
function applyShowWhen(element, showWhen, data, fields) {
    let refValue = getNestedValue(data, showWhen.field);
    if (refValue === undefined && fields[showWhen.field]?.default !== undefined) {
        refValue = fields[showWhen.field].default;
    }
    const matches = showWhen.values
        ? showWhen.values.includes(refValue)
        : refValue === showWhen.value;
    if (!matches) element.style.display = 'none';

    element.dataset.showWhenField = showWhen.field;
    element.dataset.showWhenValue = showWhen.value || '';
    if (showWhen.values) element.dataset.showWhenValues = JSON.stringify(showWhen.values);
}

/**
 * Configure les listeners showWhen dans un item
 */
function setupItemShowWhenListeners(container, itemSchema, basePath, item) {
    const showWhenFields = new Set();
    for (const [, fieldConfig] of Object.entries(itemSchema)) {
        if (fieldConfig.showWhen) showWhenFields.add(fieldConfig.showWhen.field);
    }
    if (showWhenFields.size === 0) return;

    for (const selectorField of showWhenFields) {
        const selectorPath = `${basePath}.${selectorField}`;
        const selectorInput = container.querySelector(`[data-path="${selectorPath}"]`);
        if (!selectorInput) continue;

        selectorInput.addEventListener('change', () => {
            const newValue = selectorInput.value;
            const conditionalFields = container.querySelectorAll(`[data-show-when-field="${selectorField}"]`);
            for (const el of conditionalFields) {
                const matchValue = el.dataset.showWhenValue;
                const matchValues = el.dataset.showWhenValues ? JSON.parse(el.dataset.showWhenValues) : null;
                const matches = matchValues ? matchValues.includes(newValue) : newValue === matchValue;
                el.style.display = matches ? '' : 'none';
            }
        });
    }
}

/**
 * Listeners showWhen generiques (sections et groupes)
 */
function setupShowWhenListenersGeneric(container, fields, basePath) {
    const showWhenFields = new Set();
    for (const [, fieldConfig] of Object.entries(fields)) {
        if (fieldConfig.showWhen) showWhenFields.add(fieldConfig.showWhen.field);
    }
    if (showWhenFields.size === 0) return;

    for (const selectorField of showWhenFields) {
        const selectorPath = basePath ? `${basePath}.${selectorField}` : selectorField;
        const selectorInput = container.querySelector(`[data-path="${selectorPath}"]`);
        if (!selectorInput) continue;

        selectorInput.addEventListener('change', () => {
            const newValue = selectorInput.value;
            const conditionalFields = container.querySelectorAll(`[data-show-when-field="${selectorField}"]`);
            for (const el of conditionalFields) {
                const matchValue = el.dataset.showWhenValue;
                const matchValues = el.dataset.showWhenValues ? JSON.parse(el.dataset.showWhenValues) : null;
                const matches = matchValues ? matchValues.includes(newValue) : newValue === matchValue;
                el.style.display = matches ? '' : 'none';
            }
        });
    }
}

/**
 * Alias pour compatibilite avec l'ancien code
 */
function setupSectionShowWhenListeners(content, fields) {
    setupShowWhenListenersGeneric(content, fields, '');
}

// =======================================================================
// DYNAMIC OBJECT / PAGE BLOCK LISTENERS
// =======================================================================

/**
 * Configure les listeners pour dynamicObject et pageBlockData dans un item
 */
function setupItemDynamicListeners(container, itemSchema, basePath, _item, onChange) {
    for (const [fieldKey, fieldConfig] of Object.entries(itemSchema)) {
        if (fieldConfig.type === 'dynamicObject' || fieldConfig.type === 'pageBlockData') {
            const selectorKey = fieldConfig.type === 'pageBlockData' ? 'type' : (fieldConfig.selector || 'type');
            const selectorPath = `${basePath}.${selectorKey}`;
            const fieldPath = `${basePath}.${fieldKey}`;
            const rendererType = fieldConfig.type;

            let selectorInput = container.querySelector(`[data-path="${selectorPath}"]`);
            if (!selectorInput) {
                const selects = container.querySelectorAll('select[data-path]');
                for (const select of selects) {
                    if (select.getAttribute('data-path')?.endsWith(`.${selectorKey}`)) {
                        selectorInput = select;
                        break;
                    }
                }
            }
            if (!selectorInput) continue;

            selectorInput.dataset.previousValue = selectorInput.value || '';

            selectorInput.addEventListener('change', async (e) => {
                const newValue = e.target.value;
                const oldValue = e.target.dataset.previousValue || '';

                const cssClass = rendererType === 'pageBlockData'
                    ? 'json-editor__field--page-block-data'
                    : 'json-editor__field--dynamic-object';
                const oldField = container.querySelector(`.${cssClass}`);

                // Confirmation pour pageBlockData si contenu existe
                if (rendererType === 'pageBlockData' && oldField) {
                    const pathParts = basePath.split('.');
                    const index = parseInt(pathParts[pathParts.length - 1], 10);
                    const arrayPath = pathParts.slice(0, -1).join('.');
                    const items = getNestedValue(editorData, arrayPath) || [];
                    const currentItem = items[index];
                    const oldData = currentItem ? currentItem[fieldKey] : null;

                    if (oldData && typeof oldData === 'object' && Object.keys(oldData).length > 0) {
                        const confirmed = await showConfirm(
                            translateLabel('editor_page_block_type_change_message') || 'Le contenu sera perdu.',
                            translateLabel('editor_page_block_type_change_title') || 'Attention',
                            translateLabel('editor_page_block_type_change_confirm') || 'Continuer',
                            translateLabel('editor_page_block_type_change_cancel') || 'Annuler',
                            true
                        );
                        if (!confirmed) {
                            e.target.value = oldValue;
                            return;
                        }
                    }
                }

                if (oldField) oldField.remove();

                // Reset les donnees
                const newData = {};
                setNestedValue(editorData, fieldPath, newData);

                // Re-rendre le champ
                const renderer = fieldRenderers[rendererType];
                const newField = renderer(fieldConfig, newData, onChange, fieldPath, newValue);
                container.appendChild(newField);

                // Initialiser les champs speciaux du nouveau champ
                initializeDetailSpecialFields(newField);

                e.target.dataset.previousValue = newValue;
                onChange(fieldPath, newData);
            });
        }
    }
}

// =======================================================================
// OPERATIONS SUR LES TABLEAUX
// =======================================================================

/**
 * Ajoute un item
 */
function handleArrayAdd(sectionId, arrayField) {
    const items = getNestedValue(editorData, arrayField.path) || [];
    if (arrayField.config.maxItems && items.length >= arrayField.config.maxItems) {
        showAlert(
            translateLabel('editor_max_items_reached') || 'Maximum atteint',
            translateLabel('editor_alert_title') || 'Information'
        );
        return;
    }

    const newItem = createEmptyItem(arrayField.config.itemSchema);
    items.push(newItem);
    setNestedValue(editorData, arrayField.path, items);

    refreshNavItemList(sectionId);
    navigateTo(sectionId, items.length - 1);
    notifyParentChange(arrayField.path, items);
}

/**
 * Supprime un item
 */
async function handleArrayRemove(sectionId, arrayField, index) {
    const items = getNestedValue(editorData, arrayField.path) || [];

    if (arrayField.config.minItems && items.length <= arrayField.config.minItems) {
        await showAlert(
            translateLabel('editor_min_items_reached') || `Minimum ${arrayField.config.minItems} element(s)`,
            translateLabel('editor_alert_title') || 'Information'
        );
        return;
    }

    const confirmed = await showConfirm(
        translateLabel('editor_confirm_delete') || 'Voulez-vous vraiment supprimer ?',
        translateLabel('editor_confirm_delete_title') || 'Confirmer la suppression',
        translateLabel('editor_delete_btn') || 'Supprimer',
        translateLabel('editor_cancel') || 'Annuler',
        true
    );
    if (!confirmed) return;

    // Collecter avant suppression
    collectCurrentViewData();

    items.splice(index, 1);
    setNestedValue(editorData, arrayField.path, items);

    refreshNavItemList(sectionId);
    const newIndex = items.length > 0 ? Math.min(index, items.length - 1) : null;
    // skipCollect : on vient de muter la structure, les data-path du DOM
    // sont obsoletes (l'index courant pointe sur un autre item).
    navigateTo(sectionId, newIndex, { skipCollect: true });
    notifyParentChange(arrayField.path, items);
}

/**
 * Duplique un item
 */
async function handleArrayDuplicate(sectionId, arrayField, index) {
    const items = getNestedValue(editorData, arrayField.path) || [];

    if (arrayField.config.maxItems && items.length >= arrayField.config.maxItems) {
        await showAlert(
            translateLabel('editor_max_items_reached') || 'Maximum atteint',
            translateLabel('editor_alert_title') || 'Information'
        );
        return;
    }

    // Collecter avant duplication
    collectCurrentViewData();

    const duplicate = JSON.parse(JSON.stringify(items[index]));
    items.splice(index + 1, 0, duplicate);
    setNestedValue(editorData, arrayField.path, items);

    refreshNavItemList(sectionId);
    navigateTo(sectionId, index + 1, { skipCollect: true });
    notifyParentChange(arrayField.path, items);
}

/**
 * Deplace un item (drag & drop)
 */
function handleArrayMove(sectionId, arrayPath, fromIndex, toIndex) {
    // Collecter avant deplacement
    collectCurrentViewData();

    const items = getNestedValue(editorData, arrayPath) || [];
    if (fromIndex < 0 || fromIndex >= items.length) return;
    if (toIndex < 0 || toIndex >= items.length) return;

    // Capturer l'identite (par reference) de l'item actuellement affiche
    // pour le retrouver apres le splice, meme s'il a glisse d'index par effet de bord.
    const displayedItem = navState.itemIndex !== null ? items[navState.itemIndex] : null;

    const item = items.splice(fromIndex, 1)[0];
    items.splice(toIndex, 0, item);

    // Cas spécial Livre : si le 1er chapitre devient un sous-chapitre suite au déplacement,
    // on le force automatiquement à chapitre normal (un livre commence toujours par un chapitre).
    if (items.length > 0 && items[0] && (items[0].subchapter === true || items[0].subchapter === 1)) {
        items[0].subchapter = false;
    }

    setNestedValue(editorData, arrayPath, items);

    refreshNavItemList(sectionId);

    // Suivre l'element affiche par identite (gere le cas ou il a glisse sans etre lui-meme deplace)
    let newSelectedIndex = navState.itemIndex;
    if (displayedItem !== null) {
        const idx = items.indexOf(displayedItem);
        if (idx >= 0) newSelectedIndex = idx;
    }
    // skipCollect : la structure vient d'etre mutee, les data-path du DOM sont obsoletes.
    navigateTo(sectionId, newSelectedIndex, { skipCollect: true });
    notifyParentChange(arrayPath, items);
}

// =======================================================================
// CHAMPS SPECIAUX
// =======================================================================

/**
 * Initialise les ArrayManagers et FeedbackEditors imbriques dans le detail
 */
function initializeDetailSpecialFields(container) {
    // ArrayManagers (non-nested, ceux qui n'ont pas ete crees dans renderItemFields)
    const arrayFields = container.querySelectorAll('.json-editor__field--array[data-path]');
    arrayFields.forEach(field => {
        const path = field.dataset.path;
        const configStr = field.dataset.config;
        if (path && configStr && !arrayManagers.has(path)) {
            try {
                const config = JSON.parse(configStr);
                const value = getNestedValue(editorData, path);
                const manager = createArrayManager(field, value || [], config, path, (p, v) => {
                    handleFieldChange(p, v);
                });
                arrayManagers.set(path, manager);
            } catch (e) {
                console.error('[Editor Core] Error initializing array:', e);
            }
        }
    });

    // FeedbackEditors
    const feedbackFields = container.querySelectorAll('.json-editor__field--feedback-ranges[data-path]');
    feedbackFields.forEach(field => {
        const path = field.dataset.path;
        if (path && !feedbackEditors.has(path)) {
            const value = getNestedValue(editorData, path);
            const editor = createFeedbackEditor(field, value, path, (p, v) => {
                handleFieldChange(p, v);
            });
            feedbackEditors.set(path, editor);
        }
    });
}

// =======================================================================
// GESTION DES DONNEES
// =======================================================================

/**
 * Gere le changement d'un champ
 */
function handleFieldChange(path, value) {
    setNestedValue(editorData, path, value);

    // Synchronisation cross-array (dropZones)
    const dropZonesMatch = path.match(/(.*\.)?(dropZones)/);
    if (dropZonesMatch) {
        const fullSourcePath = dropZonesMatch[1] ? dropZonesMatch[1] + dropZonesMatch[2] : dropZonesMatch[2];
        refreshDynamicSelects('dropZones', fullSourcePath);
    }

    // Cas spécial Livre : toggle de sous-chapitre → re-render du menu de gauche
    // pour mettre à jour la numérotation chiffres/lettres et l'indentation visuelle.
    const subchapterMatch = path.match(/^([^.]+)\.(\d+)\.subchapter$/);
    if (subchapterMatch) {
        const arrayPath = subchapterMatch[1];
        const itemIdx = parseInt(subchapterMatch[2], 10);
        // Le 1er chapitre ne peut jamais être un sous-chapitre : forçage automatique.
        if (itemIdx === 0 && (value === true || value === 1)) {
            setNestedValue(editorData, path, false);
        }
        // Trouver la section qui contient cette array et rafraîchir sa nav
        if (editorSchema && Array.isArray(editorSchema.sections)) {
            for (const section of editorSchema.sections) {
                const af = findPrimaryArrayField(section);
                if (af && af.path === arrayPath) {
                    refreshNavItemList(section.id);
                    break;
                }
            }
        }
    } else if (Array.isArray(value) && editorSchema && Array.isArray(editorSchema.sections)) {
        // Si une array primaire entière est mise à jour (ex: réordonnancement depuis le détail),
        // rafraîchir la nav correspondante pour resynchroniser numérotation et sous-chapitres.
        for (const section of editorSchema.sections) {
            const af = findPrimaryArrayField(section);
            if (af && af.path === path) {
                // Cas Livre : forcer le 1er item à ne jamais être un sous-chapitre
                if (af.config.itemSchema && af.config.itemSchema.subchapter
                    && af.config.itemSchema.subchapter.type === 'checkbox'
                    && value.length > 0 && value[0] && (value[0].subchapter === true || value[0].subchapter === 1)) {
                    value[0].subchapter = false;
                }
                refreshNavItemList(section.id);
                break;
            }
        }
    }

    // Notifier le parent
    if (editorOptions?.onChange) {
        editorOptions.onChange(path, value);
    }
}

/**
 * Notifie le parent d'un changement sur un path
 */
function notifyParentChange(path, value) {
    if (editorOptions?.onChange) {
        editorOptions.onChange(path, value);
    }
}

/**
 * Rafraichit les selects dynamiques lies a un champ source
 */
function refreshDynamicSelects(optionsFromName, fullPath) {
    if (!detailElement || !editorData) return;

    const sourceArray = getNestedValue(editorData, fullPath || optionsFromName) || [];

    // Selects
    const dynamicSelects = detailElement.querySelectorAll(`select[data-options-from="${optionsFromName}"]`);
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

    // MultiCheckbox groups
    const dynamicGroups = detailElement.querySelectorAll(
        `.json-editor__multi-checkbox-group[data-options-from="${optionsFromName}"]`
    );
    dynamicGroups.forEach(group => {
        const labelField = group.dataset.optionsLabelField || 'label';
        const path = group.dataset.path;
        const checkedValues = Array.from(group.querySelectorAll('input:checked')).map(cb => Number(cb.value));
        const maxIdx = sourceArray.length - 1;
        const validChecked = checkedValues.filter(v => v >= 0 && v <= maxIdx);

        group.innerHTML = '';
        sourceArray.forEach((item, index) => {
            const id = generateId();
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

        group.addEventListener('change', () => {
            const checked = Array.from(group.querySelectorAll('input:checked')).map(cb => Number(cb.value));
            if (path) handleFieldChange(path, checked);
        });

        if (validChecked.length !== checkedValues.length && path) {
            handleFieldChange(path, validChecked);
        }
    });
}

/**
 * Met a jour l'etat de l'editeur
 */
export function updateEditorState(newData) {
    if (!editorData) return;
    for (const [key, value] of Object.entries(newData)) {
        setNestedValue(editorData, key, value);
    }
}

/**
 * Retourne les donnees actuelles de l'editeur
 */
export function getEditorData() {
    // Collecter depuis la vue actuelle
    arrayManagers.forEach((manager, path) => {
        setNestedValue(editorData, path, manager.getData());
    });
    feedbackEditors.forEach((editor, path) => {
        setNestedValue(editorData, path, editor.getData());
    });
    collectInputValues();
    return editorData;
}

/**
 * Collecte les valeurs des inputs standards du panneau detail
 */
function collectInputValues() {
    if (!detailElement) return;

    const arrayManagerPaths = Array.from(arrayManagers.keys());
    const inputs = detailElement.querySelectorAll('input[data-path], textarea[data-path], select[data-path]');
    inputs.forEach(input => {
        const path = input.dataset.path;
        if (!path) return;

        const isInArrayManager = arrayManagerPaths.some(amPath =>
            path === amPath || path.startsWith(amPath + '.')
        );
        if (isInArrayManager) return;

        let value;
        if (input.type === 'checkbox') {
            if (input.dataset.valueType === 'number') {
                value = input.checked ? 1 : 0;
            } else {
                value = input.checked;
            }
        } else if (input.type === 'number') {
            value = input.value !== '' ? Number(input.value) : null;
        } else if (input.dataset.type === 'stringArray') {
            value = input.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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
    const indicator = editorContainer?.querySelector('.json-editor__unsaved-indicator');
    if (indicator) {
        indicator.style.display = hasChanges ? 'flex' : 'none';
    }
}

// =======================================================================
// API POUR LES MANAGERS
// =======================================================================

export function getArrayManager(path) {
    return arrayManagers.get(path);
}

export function getFeedbackEditor(path) {
    return feedbackEditors.get(path);
}

export function refreshField(path, newValue) {
    const arrayManager = arrayManagers.get(path);
    if (arrayManager) { arrayManager.setData(newValue); return; }
    const feedbackEditor = feedbackEditors.get(path);
    if (feedbackEditor) { feedbackEditor.setData(newValue); return; }
    if (!detailElement) return;
    const input = detailElement.querySelector(`[data-path="${path}"]`);
    if (input) {
        if (input.type === 'checkbox') input.checked = !!newValue;
        else input.value = newValue !== null && newValue !== undefined ? newValue : '';
    }
}

// =======================================================================
// UTILITAIRES UI
// =======================================================================

export function showLoading(container) {
    container.innerHTML = `
        <div class="json-editor__loading">
            <div class="json-editor__loading-spinner"></div>
            <span>${t('editor_loading') || 'Chargement...'}</span>
        </div>
    `;
}

export function showError(container, message) {
    container.innerHTML = `
        <div class="json-editor__empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

export function destroyEditorCore() {
    editorData = null;
    editorSchema = null;
    editorOptions = null;
    arrayManagers.clear();
    feedbackEditors.clear();
    navElement = null;
    detailElement = null;
    editorContainer = null;
    navState = { sectionId: null, itemIndex: null };
    window._jsonEditorData = null;
    window._jsonEditorUtils = null;
}

// =======================================================================
// EXPORTS POUR TESTS UNITAIRES
// =======================================================================
// Permet aux tests de declencher les mutations sans passer par les modales
// de confirmation et le drag&drop. Ne pas utiliser en production.
export const __testing = {
    handleArrayAdd,
    handleArrayRemove,
    handleArrayMove,
    handleArrayDuplicate,
    navigateTo,
    getNavState: () => ({ ...navState }),
    findPrimaryArrayField
};
