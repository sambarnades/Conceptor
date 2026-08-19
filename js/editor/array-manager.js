import { t } from '../core/translation.js';
import { fieldRenderers, escapeHtml, generateId, renderTextField } from './field-renderers.js';
import { getNestedValue, setNestedValue, matchesShowWhen, remapIndexReferences } from './json-utils.js';

/**
 * Résout le renderer via getRendererForField (exposé par editor-core.js).
 * Permet aux champs textarea/text d'être routés vers le richtext editor.
 */
function _resolveRenderer(fieldConfig, fieldPath) {
    const richtext = window._jsonEditorRichtext;
    if (richtext && richtext.getRendererForField) {
        return richtext.getRendererForField(fieldConfig, fieldPath);
    }
    return {
        renderer: fieldRenderers[fieldConfig.type] || fieldRenderers['text'],
        config: fieldConfig
    };
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
            const group = [el];
            let j = i + 1;
            while (j < children.length && children[j].dataset.rowGroup === rowGroup) {
                group.push(children[j]);
                j++;
            }
            if (group.length > 1) {
                const wrapper = document.createElement('div');
                wrapper.className = 'json-editor__field-row';
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
 * Traduit un label
 */
function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

/**
 * Valeur initiale d'un champ dans un item de tableau fraîchement créé.
 *
 * INVARIANT : la valeur produite doit être celle que le widget AFFICHERA. Un `<select>`
 * sans option vide montre toujours sa première option quand la valeur ne correspond à
 * aucune : renvoyer '' faisait diverger l'affichage (« Texte ») et le modèle ('') — un
 * champ `required` bloquait alors l'enregistrement sur un menu qui paraissait rempli, sans
 * qu'aucun indice ne désigne le fautif. Cf. le même réalignement dans `renderSelectField`.
 *
 * Récursif : les sous-champs d'un `object` recevaient tous '', y compris les tableaux
 * (`table: { headers: '', rows: '' }` alors que le gestionnaire de tableau attend `[]`).
 */
function emptyValueForField(fieldConfig, fillMinItems = false) {
    if (!fieldConfig || typeof fieldConfig !== 'object') return '';

    if (fieldConfig.type === 'array') {
        // Respecter minItems : un tableau imbriqué créé vide violerait son propre schéma
        // (« Minimum 1 elements » bloquant à la sauvegarde) — ex. « Ajouter un point »
        // en mode Plan de l'Image interactive, qui doit naître avec un bloc de contenu
        // par défaut comme en mode « Sur l'image » (audit N14).
        //
        // UNIQUEMENT pour un tableau porté DIRECTEMENT par l'item (`fillMinItems`). Sous un
        // `object`, pré-remplir fabriquerait une entrée obligatoire vide dans une branche
        // que l'item n'utilise même pas : le `table.headers` d'un bloc de texte (masqué par
        // `showWhen`, mais la validation ne connaît pas la visibilité) redeviendrait un
        // « En-tête 1 obligatoire » introuvable à l'écran — le bug qu'on corrige, refait
        // par l'autre bout.
        const min = fillMinItems && Number.isFinite(fieldConfig.minItems) ? fieldConfig.minItems : 0;
        const arr = [];
        if (min > 0 && fieldConfig.itemSchema) {
            for (let i = 0; i < min; i++) arr.push(createEmptyArrayItem(fieldConfig, i));
        }
        return arr;
    }
    // dynamicObject doit être un objet, jamais une chaîne
    if (fieldConfig.type === 'dynamicObject') return {};
    if (fieldConfig.type === 'object' && fieldConfig.schema) {
        const sub = {};
        for (const [subKey, subConfig] of Object.entries(fieldConfig.schema)) {
            sub[subKey] = emptyValueForField(subConfig);
        }
        return sub;
    }
    if (fieldConfig.type === 'checkbox') return fieldConfig.valueType === 'number' ? 0 : false;
    if (fieldConfig.type === 'number') return fieldConfig.default !== undefined ? fieldConfig.default : 0;
    if (fieldConfig.type === 'select') {
        // `!== undefined` et non un test de vérité : un défaut `false` ou `0` (menus
        // Vrai/Faux, valueType boolean/number) doit être conservé tel quel.
        if (fieldConfig.default !== undefined) return fieldConfig.default;
        const opts = Array.isArray(fieldConfig.options) ? fieldConfig.options : [];
        // Options dynamiques (`optionsFrom`) : rien à choisir au moment de la création.
        return opts.length ? opts[0].value : '';
    }
    return fieldConfig.default ?? '';
}

/**
 * Construit un item vide pour un tableau, d'après la config du CHAMP tableau.
 *
 * SOURCE UNIQUE : `editor-core.js` en portait une seconde copie, divergente — le
 * correctif des menus obligatoires n'y avait donc pas cours, et le bouton « Ajouter »
 * du sommaire (maître-détail) restait bloquant là où celui d'un tableau imbriqué ne
 * l'était plus. Les deux chemins passent désormais ici.
 *
 * `autoTitleField` : titre générique des CONTENEURS (chapitre, diapositive), dont le
 * titre obligatoire est une étiquette de navigation et non du contenu pédagogique. Le
 * laisser vide bloquait l'enregistrement pour un intitulé que l'éditeur sait fabriquer et
 * que l'enseignant renomme ensuite. On reprend `itemLabel`, déjà traduit et déjà affiché
 * dans l'accordéon (« Diapositive 6 ») : pas de nouvelle clé i18n, pas de français figé.
 * Réservé aux tableaux qui le déclarent — remplir d'office le recto d'une carte ou
 * l'énoncé d'une question fabriquerait du faux contenu.
 *
 * @param {Object} arrayConfig - Config du champ tableau (itemSchema, itemLabel, autoTitleField…)
 * @param {number} index - Position de l'item créé, pour numéroter le titre générique
 */
export function createEmptyArrayItem(arrayConfig, index = 0) {
    const itemSchema = arrayConfig && arrayConfig.itemSchema;
    if (!itemSchema) return {};

    // Valeur simple (isArrayValue) : l'item n'est pas un objet
    if (Object.values(itemSchema).some(v => v && v.isArrayValue)) return '';

    const item = {};
    for (const [key, fieldConfig] of Object.entries(itemSchema)) {
        const value = emptyValueForField(fieldConfig, true);
        // Clés pointées (ex: 'metadata.title') → créer la structure imbriquée
        if (key.includes('.')) setNestedValue(item, key, value);
        else item[key] = value;
    }

    // Clé pointée acceptée (`metadata.title` du sous-quiz d'un Quiz), d'où get/setNestedValue.
    const titleField = arrayConfig.autoTitleField;
    if (titleField && !String(getNestedValue(item, titleField) ?? '').trim()) {
        const base = translateLabel(arrayConfig.itemLabel) || translateLabel('editor_element') || 'Element';
        setNestedValue(item, titleField, `${base} ${index + 1}`);
    }

    return item;
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

        // Validation initiale de la somme
        this.validateSum();

        // === Cas spécial Livre : gestion du checkbox "subchapter" via event delegation ===
        // Cette logique s'applique à tout array dont l'itemSchema contient un champ 'subchapter'
        // de type checkbox (actuellement uniquement Livre, mais réutilisable).
        if (this.config.itemSchema && this.config.itemSchema.subchapter
            && this.config.itemSchema.subchapter.type === 'checkbox') {
            this.setupSubchapterBehavior();
        }
    }

    /**
     * Configure le comportement spécial du checkbox "subchapter" (Livre) :
     *  1. Le 1er chapitre ne peut JAMAIS être un sous-chapitre → checkbox désactivé visuellement
     *  2. Toggle dynamique de la classe CSS --subchapter sur l'item parent au clic
     *
     * Utilise event delegation sur this.container pour fonctionner même si le DOM
     * est régénéré, et un MutationObserver pour rappliquer la désactivation du 1er chapitre
     * après tout re-render partiel.
     */
    setupSubchapterBehavior() {
        // Éviter d'attacher plusieurs listeners en cas de re-render
        if (this._subchapterDelegationAttached) {
            this.refreshFirstChapterLock();
            return;
        }
        this._subchapterDelegationAttached = true;

        // Event delegation : capture tout change sur les checkbox subchapter du container
        this.container.addEventListener('change', (e) => {
            const target = e.target;
            if (target.tagName !== 'INPUT' || target.type !== 'checkbox') return;
            const dataPath = target.dataset.path || '';
            if (!dataPath.endsWith('.subchapter')) return;

            // Trouver l'item array parent direct (pas un bloc imbriqué)
            const item = target.closest('.json-editor__array-item');
            if (!item) return;
            // Vérifier que l'item est bien un enfant direct de this.container (pas un bloc nested)
            if (item.parentElement !== this.container) return;

            // Si c'est le premier item, refuser le toggle
            if (item.dataset.index === '0') {
                e.preventDefault();
                target.checked = false;
                return;
            }

            // Toggle la classe CSS pour l'indentation et le préfixe lettré
            item.classList.toggle('json-editor__array-item--subchapter', target.checked);
        });

        // Verrouiller le checkbox du premier chapitre
        this.refreshFirstChapterLock();
    }

    /**
     * Désactive visuellement le checkbox subchapter du premier chapitre.
     * Appelée à chaque render pour maintenir le verrouillage.
     */
    refreshFirstChapterLock() {
        const firstItem = this.container.querySelector(':scope > .json-editor__array-item[data-index="0"]');
        if (!firstItem) return;
        const checkbox = firstItem.querySelector('input[type="checkbox"][data-path$=".subchapter"]');
        if (!checkbox) return;

        // S'assurer que la valeur reste false
        checkbox.checked = false;
        checkbox.disabled = true;
        if (this.items[0]) {
            this.items[0].subchapter = false;
        }

        // Style visuel pour indiquer que c'est verrouillé
        const wrapper = checkbox.closest('.json-editor__field--checkbox');
        if (wrapper) {
            wrapper.style.opacity = '0.45';
            wrapper.style.pointerEvents = 'none';
            wrapper.title = translateLabel('editor_livre_subchapter_locked')
                || 'Le premier chapitre ne peut pas être un sous-chapitre';
        }

        // S'assurer que la classe --subchapter n'est pas appliquée au 1er item
        firstItem.classList.remove('json-editor__array-item--subchapter');
    }

    /**
     * Rend un element du tableau
     */
    renderItem(item, index) {
        const element = document.createElement('div');
        element.className = 'json-editor__array-item';
        element.dataset.index = index;
        element.draggable = false;

        // Mode compact : pas de header, champs inline avec actions minimales
        if (this.config.compact) {
            return this.renderCompactItem(element, item, index);
        }

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
            <button type="button" class="json-editor__array-btn json-editor__array-btn--drag" title="${translateLabel('editor_drag') || 'Deplacer'}" aria-label="${translateLabel('editor_drag') || 'Deplacer'}" aria-keyshortcuts="ArrowUp ArrowDown">
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
                        dynamicTitle = option ? (translateLabel(option.label) || option.label) : fieldValue;
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
            // Cas spécial : sous-chapitre (Livre) — indentation et préfixe lettré via CSS
            if (item.subchapter === true || item.subchapter === 1) {
                element.classList.add('json-editor__array-item--subchapter');
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
                const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, `${this.path}.${index}`);
                const fieldElement = renderer(
                    resolvedConfig,
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

                    // Visibilité conditionnelle (showWhen) — on rend le champ mais on le masque si
                    // condition non remplie. Portée frère (`field`) ou racine (`rootField`, réglage
                    // global d'une autre section) — cf. matchesShowWhen dans json-utils.js.
                    let showWhenHidden = false;
                    if (fieldConfig.showWhen && item) {
                        showWhenHidden = !matchesShowWhen(
                            fieldConfig.showWhen, item, this.config.itemSchema, window._jsonEditorData
                        );
                    }

                    const fieldValue = item ? getNestedValue(item, fieldKey) : undefined;
                    const fieldPath = `${this.path}.${index}.${fieldKey}`;

                    // Groupe de champs pliable (wrapper visuel, pas de namespace)
                    if (fieldConfig.type === 'fieldGroup') {
                        const groupWrapper = document.createElement('div');
                        groupWrapper.className = 'json-editor__field json-editor__field--fieldgroup';

                        const groupLabel = translateLabel(fieldConfig.collapsibleLabel || fieldConfig.label || '');
                        groupWrapper.innerHTML = `
                            <div class="json-editor__array-item-subsection">
                                <div class="json-editor__array-item-subsection-header">
                                    <i class="fas fa-chevron-right"></i>
                                    <span>${escapeHtml(groupLabel)}</span>
                                </div>
                                <div class="json-editor__array-item-subsection-content" style="display: none;"></div>
                            </div>
                        `;

                        const groupHeader = groupWrapper.querySelector('.json-editor__array-item-subsection-header');
                        const groupContent = groupWrapper.querySelector('.json-editor__array-item-subsection-content');
                        const subsection = groupWrapper.querySelector('.json-editor__array-item-subsection');

                        groupHeader.addEventListener('click', () => {
                            const expanded = subsection.classList.toggle('json-editor__array-item-subsection--expanded');
                            groupContent.style.display = expanded ? '' : 'none';
                            groupHeader.querySelector('i').className = expanded
                                ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
                        });

                        // Rendre les sous-champs (chemins au niveau item, pas namespaces)
                        if (fieldConfig.fields) {
                            for (const [subKey, subConfig] of Object.entries(fieldConfig.fields)) {
                                if (subConfig.hidden) continue;

                                const subValue = item ? getNestedValue(item, subKey) : undefined;
                                const subPath = `${this.path}.${index}.${subKey}`;

                                const { renderer: subRenderer, config: subResolved } = _resolveRenderer(subConfig, subPath);
                                const subField = subRenderer(subResolved, subValue, (p, v) => this.handleFieldChange(p, v), subPath);
                                groupContent.appendChild(subField);

                                // showWhen sur les sous-champs du groupe (frère ou racine)
                                if (subConfig.showWhen) {
                                    const sw = subConfig.showWhen;
                                    if (!matchesShowWhen(sw, item, fieldConfig.fields, window._jsonEditorData)) {
                                        subField.style.display = 'none';
                                    }
                                    // Portée racine : pas de champ frère à écouter (cf. json-utils).
                                    if (!sw.rootField) {
                                        subField.dataset.showWhenField = sw.field;
                                        subField.dataset.showWhenValue = sw.value || '';
                                        if (sw.values) subField.dataset.showWhenValues = JSON.stringify(sw.values);
                                    }
                                }
                            }

                            // Listeners showWhen dans le groupe
                            const showWhenFields = new Set();
                            for (const [, subConfig] of Object.entries(fieldConfig.fields)) {
                                if (subConfig.showWhen && !subConfig.showWhen.rootField) showWhenFields.add(subConfig.showWhen.field);
                            }
                            for (const selectorField of showWhenFields) {
                                const selectorPath = `${this.path}.${index}.${selectorField}`;
                                const selectorInput = groupContent.querySelector(`[data-path="${selectorPath}"]`);
                                if (!selectorInput) continue;

                                selectorInput.addEventListener('change', () => {
                                    const newValue = selectorInput.value;
                                    if (this.items[index]) this.items[index][selectorField] = newValue;

                                    const conditionalFields = groupContent.querySelectorAll(`[data-show-when-field="${selectorField}"]`);
                                    for (const el of conditionalFields) {
                                        const matchValue = el.dataset.showWhenValue;
                                        const matchValues = el.dataset.showWhenValues ? JSON.parse(el.dataset.showWhenValues) : null;
                                        const matches = matchValues ? matchValues.includes(newValue) : newValue === matchValue;
                                        el.style.display = matches ? '' : 'none';
                                    }

                                    this.notifyChange();
                                });
                            }
                        }

                        content.appendChild(groupWrapper);
                    } else if (fieldConfig.type === 'array' && fieldConfig.nested) {
                    // Gerer les tableaux imbriques (nested: true)
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
                        // Champ normal — résoudre via richtext si applicable
                        const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, fieldPath);
                        const fieldElement = renderer(
                            resolvedConfig,
                            fieldValue,
                            (path, value) => this.handleFieldChange(path, value),
                            fieldPath
                        );
                        content.appendChild(fieldElement);
                    }

                    // Masquer les champs conditionnels (showWhen) sans les détruire.
                    // Portée racine : masquage seul, sans `data-show-when-*` (cf. json-utils.js).
                    if (fieldConfig.showWhen?.rootField && content.lastElementChild) {
                        if (showWhenHidden) content.lastElementChild.style.display = 'none';
                    } else if (showWhenHidden && content.lastElementChild) {
                        const el = content.lastElementChild;
                        el.style.display = 'none';
                        el.dataset.showWhenField = fieldConfig.showWhen.field;
                        el.dataset.showWhenValue = fieldConfig.showWhen.value || '';
                        if (fieldConfig.showWhen.values) {
                            el.dataset.showWhenValues = JSON.stringify(fieldConfig.showWhen.values);
                        }
                    } else if (fieldConfig.showWhen && content.lastElementChild) {
                        // Champ visible mais conditionnel — marquer pour le toggle
                        const el = content.lastElementChild;
                        el.dataset.showWhenField = fieldConfig.showWhen.field;
                        el.dataset.showWhenValue = fieldConfig.showWhen.value || '';
                        if (fieldConfig.showWhen.values) {
                            el.dataset.showWhenValues = JSON.stringify(fieldConfig.showWhen.values);
                        }
                    }

                    // Marquer le groupe row pour regroupement cote a cote
                    if (fieldConfig.row && content.lastElementChild) {
                        content.lastElementChild.dataset.rowGroup = fieldConfig.row;
                    }
                }
            }
        }

        // Grouper les champs avec le meme row en lignes cote a cote
        groupRowFields(content);

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

        // Listeners showWhen : reconstruire l'item quand le champ référencé change
        if (this.config.itemSchema) {
            this.setupShowWhenListeners(element, index, content);
        }

        // === Cas spécial Livre : initialisation de la classe --subchapter à l'état actuel ===
        // (le toggle dynamique est géré par event delegation dans render())
        if (this.config.itemSchema && this.config.itemSchema.subchapter
            && this.config.itemSchema.subchapter.type === 'checkbox'
            && item && (item.subchapter === true || item.subchapter === 1)
            && index !== 0) {
            element.classList.add('json-editor__array-item--subchapter');
        }

        return element;
    }

    /**
     * Rend un item en mode compact : une seule bande avec numero + champs + supprimer.
     * Pas de header, pas de toggle, pas de titre dynamique.
     */
    renderCompactItem(element, item, index) {
        element.classList.add('json-editor__array-item--compact');
        const isFixedLength = this.config.fixedLength === true;

        // Conteneur inline : numero + champs + actions
        const row = document.createElement('div');
        row.className = 'json-editor__compact-row';

        // Numero
        const num = document.createElement('span');
        num.className = 'json-editor__array-item-number';
        num.textContent = index + 1;
        row.appendChild(num);

        // Champs
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'json-editor__compact-fields';

        if (this.config.itemSchema) {
            const valueField = Object.entries(this.config.itemSchema).find(([, v]) => v.isArrayValue);
            if (valueField) {
                const [, fieldConfig] = valueField;
                const itemPath = `${this.path}.${index}`;
                const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, itemPath);
                fieldsContainer.appendChild(renderer(
                    resolvedConfig, item,
                    (path, value) => this.handleItemChange(index, null, value),
                    itemPath
                ));
            } else {
                for (const [fieldKey, fieldConfig] of Object.entries(this.config.itemSchema)) {
                    if (fieldConfig.hidden) continue;
                    const fieldValue = item ? getNestedValue(item, fieldKey) : undefined;
                    const fieldPath = `${this.path}.${index}.${fieldKey}`;

                    let fieldElement;
                    if (fieldConfig.optionsFrom && (fieldConfig.type === 'select' || fieldConfig.type === 'multiCheckbox')) {
                        const dynamicOptions = this.getDynamicSelectOptions(fieldConfig.optionsFrom, fieldConfig.optionsLabelField || 'label');
                        const augmentedConfig = { ...fieldConfig, options: dynamicOptions };
                        fieldElement = fieldRenderers[fieldConfig.type](augmentedConfig, fieldValue !== undefined ? fieldValue : '0', (p, v) => this.handleFieldChange(p, v), fieldPath);
                    } else {
                        const { renderer, config: resolvedConfig } = _resolveRenderer(fieldConfig, fieldPath);
                        fieldElement = renderer(resolvedConfig, fieldValue, (p, v) => this.handleFieldChange(p, v), fieldPath);
                    }

                    if (fieldConfig.row && fieldElement) {
                        fieldElement.dataset.rowGroup = fieldConfig.row;
                    }
                    fieldsContainer.appendChild(fieldElement);
                }
                groupRowFields(fieldsContainer);
            }
        }

        row.appendChild(fieldsContainer);

        // Bouton supprimer (sauf fixedLength)
        if (!isFixedLength) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'json-editor__compact-delete';
            delBtn.title = translateLabel('editor_delete') || 'Supprimer';
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.addEventListener('click', () => this.removeItem(index));
            row.appendChild(delBtn);
        }

        element.appendChild(row);
        return element;
    }

    /**
     * Configure les listeners pour afficher/masquer les champs conditionnels (showWhen)
     * quand le champ sélecteur change de valeur. Pas de reconstruction DOM.
     */
    setupShowWhenListeners(element, index, content) {
        // Trouver tous les champs showWhen.field uniques
        const showWhenFields = new Set();
        for (const [, fieldConfig] of Object.entries(this.config.itemSchema)) {
            // `rootField` exclu : son selecteur vit dans une autre section, pas dans cet item.
            if (fieldConfig.showWhen && !fieldConfig.showWhen.rootField) {
                showWhenFields.add(fieldConfig.showWhen.field);
            }
        }
        if (showWhenFields.size === 0) return;

        const itemPath = `${this.path}.${index}`;
        for (const selectorField of showWhenFields) {
            const selectorPath = `${itemPath}.${selectorField}`;
            const selectorInput = content.querySelector(`[data-path="${selectorPath}"]`);
            if (!selectorInput) continue;

            selectorInput.addEventListener('change', () => {
                // Mettre à jour la valeur dans le modèle
                const newValue = selectorInput.value;
                if (this.items[index]) {
                    this.items[index][selectorField] = newValue;
                }

                // Afficher/masquer les champs conditionnels sans reconstruire le DOM
                const conditionalFields = content.querySelectorAll(`[data-show-when-field="${selectorField}"]`);
                for (const el of conditionalFields) {
                    const matchValue = el.dataset.showWhenValue;
                    const matchValues = el.dataset.showWhenValues ? JSON.parse(el.dataset.showWhenValues) : null;
                    const matches = matchValues
                        ? matchValues.includes(newValue)
                        : newValue === matchValue;
                    el.style.display = matches ? '' : 'none';
                }

                this.notifyChange();
            });
        }
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
            // A11Y-01 : réordonnancement au clavier (le drag souris seul était
            // inaccessible). ↑/↓ déplacent l'élément ; le focus suit la poignée.
            dragBtn.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                e.preventDefault();
                const newIndex = index + (e.key === 'ArrowUp' ? -1 : 1);
                if (newIndex < 0 || newIndex >= this.items.length) return;
                this.moveItem(index, newIndex);
                this.focusDragHandle(newIndex);
            });
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
     * Réécrit les renvois PAR INDICE vers ce tableau après une mutation de structure,
     * puis re-rend la liste qui les porte si elle est à l'écran.
     *
     * Le schéma déclare ces renvois sur le tableau RÉFÉRENCÉ (`indexReferencedBy`) ; ils
     * pointent vers un tableau FRÈRE, résolu à partir du parent de `this.path` — la même
     * résolution que `getDynamicSelectOptions` pour `optionsFrom`, afin que la
     * numérotation affichée et la numérotation stockée ne puissent pas diverger.
     *
     * @param {{type: string, index?: number, from?: number, to?: number}} operation
     */
    remapperRenvoisDIndice(operation) {
        const renvois = this.config && this.config.indexReferencedBy;
        if (!Array.isArray(renvois) || renvois.length === 0) return;

        const racine = window._jsonEditorData;
        if (!racine) return;

        const cheminParent = this.path && this.path.includes('.')
            ? this.path.substring(0, this.path.lastIndexOf('.'))
            : '';
        const parent = cheminParent ? getNestedValue(racine, cheminParent) : racine;
        if (!parent) return;

        if (!remapIndexReferences(parent, renvois, operation)) return;

        for (const { array } of renvois) {
            refreshArrayManagerAt(cheminParent ? `${cheminParent}.${array}` : array);
        }
    }

    /**
     * Ajoute un nouvel element
     */
    addItem(atIndex = -1) {
        const insertAt = (atIndex >= 0 && atIndex < this.items.length) ? atIndex + 1 : this.items.length;
        // Creer un nouvel element vide base sur le schema (titre générique compris)
        const newItem = createEmptyArrayItem(this.config, insertAt);
        this.items.splice(insertAt, 0, newItem);
        this.remapperRenvoisDIndice({ type: 'insert', index: insertAt });

        this.render();
        this.notifyChange();

        // Trouver le nouvel element
        const newElement = this.container.querySelector(`[data-index="${insertAt}"]`);
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
        this.remapperRenvoisDIndice({ type: 'remove', index });
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
        this.remapperRenvoisDIndice({ type: 'duplicate', index });
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
        this.remapperRenvoisDIndice({ type: 'move', from: fromIndex, to: toIndex });

        this.render();
        this.notifyChange();
    }

    /**
     * A11Y-01 : redonne le focus à la poignée de tri de l'élément à `index`
     * après un re-render (le réordonnancement clavier ne doit pas perdre le focus).
     */
    focusDragHandle(index) {
        const handle = this.container.querySelector(
            `:scope > [data-index="${index}"] .json-editor__array-btn--drag`);
        if (handle) handle.focus();
    }

    /**
     * Cree un element vide base sur le schema
     */
    createEmptyItem() {
        return createEmptyArrayItem(this.config, this.items.length);
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

        // Re-valider la somme a chaque changement de champ
        this.validateSum();
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
     * Construit les options dynamiques pour un select optionsFrom.
     * Résout d'abord relativement au parent de l'array courante,
     * puis au global (fallback pour les activités standalone).
     */
    getDynamicSelectOptions(optionsFrom, labelField) {
        const editorData = window._jsonEditorData;
        if (!editorData) return [];

        let sourceArray;

        // 1. Résolution relative : remonter au parent de l'array et chercher le champ frère
        // Ex: path = "slides.9.exercise.elements" → parent = "slides.9.exercise" → chercher "dropZones"
        if (this.path && this.path.includes('.')) {
            const parentPath = this.path.substring(0, this.path.lastIndexOf('.'));
            const { getNestedValue } = window._jsonEditorUtils || {};
            if (getNestedValue) {
                const parentObj = getNestedValue(editorData, parentPath);
                if (parentObj && Array.isArray(parentObj[optionsFrom])) {
                    sourceArray = parentObj[optionsFrom];
                }
            }
        }

        // 2. Fallback : résolution globale (activité standalone)
        if (!sourceArray) {
            sourceArray = editorData[optionsFrom];
        }

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
        // Validation de la somme si configuree
        this.validateSum();
    }

    /**
     * Verifie la somme d'un champ numerique sur tous les items (ex: fraction = 100%).
     * Colore les selects en rouge si la somme est incorrecte.
     */
    validateSum() {
        const vs = this.config.validateSum;
        if (!vs || !vs.field) return;

        const sum = this.items.reduce((acc, item) => {
            const val = getNestedValue(item, vs.field);
            return acc + (parseFloat(val) || 0);
        }, 0);

        // Arrondir pour eviter les erreurs de virgule flottante
        const rounded = Math.round(sum * 100) / 100;
        const isValid = rounded === vs.target;

        // Trouver tous les selects du champ dans le container
        const selects = this.container.querySelectorAll(`select[data-path$=".${vs.field}"]`);
        selects.forEach(select => {
            select.classList.toggle('json-editor__select--error', !isValid);
        });

        // Afficher/masquer le message d'erreur
        let errorEl = this.container.querySelector('.json-editor__sum-error');
        if (!isValid) {
            const msg = (translateLabel(vs.label) || 'Sum must equal {target}%')
                .replace('{0}', rounded)
                .replace('{target}', vs.target);
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'json-editor__sum-error';
                this.container.appendChild(errorEl);
            }
            errorEl.textContent = msg;
        } else if (errorEl) {
            errorEl.remove();
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
 * Registre des gestionnaires par chemin — la fabrique ci-dessous est leur unique point
 * d'entrée (editor-core comme field-renderers y passent), le registre est donc complet.
 *
 * Il sert au rafraîchissement CROISÉ : quand une liste change, la liste FRÈRE qui la
 * référence par indice est déjà à l'écran, avec ses cases à cocher construites sur
 * l'ancienne numérotation (`optionsFrom`). Réécrire le modèle ne suffit pas : sans
 * re-rendu, l'utilisateur voit encore une zone supprimée, et cocher une case réécrirait
 * les anciens indices dans le modèle.
 */
const GESTIONNAIRES = new Map();

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
    const gestionnaire = new ArrayManager(container, items, config, path, onChange);
    GESTIONNAIRES.set(path, gestionnaire);
    return gestionnaire;
}

/**
 * Re-rend le gestionnaire de tableau situé à `path`, s'il est encore affiché.
 * Les entrées dont le conteneur a quitté le DOM (vue changée) sont purgées au passage :
 * le registre ne survit pas aux re-rendus, il ne doit pas non plus les retenir en mémoire.
 * @param {string} path - chemin du tableau dans le modèle
 * @returns {boolean} true si un gestionnaire vivant a été re-rendu
 */
export function refreshArrayManagerAt(path) {
    for (const [cle, g] of GESTIONNAIRES) {
        if (!g || !g.container || !g.container.isConnected) GESTIONNAIRES.delete(cle);
    }
    const gestionnaire = GESTIONNAIRES.get(path);
    if (!gestionnaire) return false;
    gestionnaire.render();
    return true;
}
