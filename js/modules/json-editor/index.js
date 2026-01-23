/**
 * JSON Editor - Module principal (Orchestrateur)
 *
 * Point d'entree de l'editeur JSON intelligent.
 * Gere le cycle de vie de l'editeur et l'integration avec la modale.
 */

import { detectContentType, getSchemaForType } from './content-detector.js';
import { renderEditor, updateEditorState, getEditorData } from './editor-core.js';
import { validateSchema, getValidationErrors } from './validators.js';
import { t } from '../translation.js';
import { getNestedValue, setNestedValue } from './json-utils.js';
export { setNestedValue };

// =======================================================================
// ETAT GLOBAL
// =======================================================================

let editorState = {
    isActive: false,
    originalData: null,      // Donnees originales (pour annulation)
    currentData: null,       // Donnees en cours d'edition
    contentType: null,       // Type detecte ('h5p' ou 'moodle')
    moduleKey: null,         // Cle du module (Flashcards, QCM, etc.)
    notification: null,      // Reference a la notification source
    hasChanges: false,       // Flag de modifications
    validationErrors: [],    // Erreurs de validation actuelles
    container: null,         // Container DOM de l'editeur
    onSave: null,            // Callback de sauvegarde
    onCancel: null           // Callback d'annulation
};

// =======================================================================
// API PUBLIQUE
// =======================================================================

/**
 * Initialise l'editeur JSON avec les donnees d'une notification
 * @param {Object} notification - La notification contenant les donnees
 * @param {HTMLElement} container - Le conteneur DOM pour l'editeur
 * @param {Object} jsonData - Les donnees JSON a editer
 * @param {Object} options - Options supplementaires
 * @returns {Promise<boolean>} - Succes de l'initialisation
 */
export async function initJsonEditor(notification, container, jsonData, options = {}) {
    if (!notification || !container || !jsonData) {
        console.error('[JSON Editor] Missing required parameters');
        return false;
    }

    try {
        // Detecter le type de contenu
        const detectionResult = detectContentType(jsonData, notification.titleKey);

        if (!detectionResult) {
            console.error('[JSON Editor] Could not detect content type');
            showEditorError(container, t('editor_unknown_type') || 'Type de contenu non reconnu');
            return false;
        }

        // Initialiser l'etat
        editorState = {
            isActive: true,
            originalData: JSON.parse(JSON.stringify(jsonData)), // Deep clone
            currentData: JSON.parse(JSON.stringify(jsonData)),  // Deep clone
            contentType: detectionResult.source,
            moduleKey: detectionResult.moduleKey,
            notification: notification,
            hasChanges: false,
            validationErrors: [],
            container: container,
            onSave: options.onSave || null,
            onCancel: options.onCancel || null
        };

        // Obtenir le schema pour ce type
        const schema = getSchemaForType(detectionResult.moduleKey);

        if (!schema) {
            console.error('[JSON Editor] No schema found for:', detectionResult.moduleKey);
            showEditorError(container, t('editor_no_schema') || 'Schema non disponible pour ce type');
            return false;
        }

        // Rendre l'editeur
        renderEditor(container, editorState.currentData, schema, {
            moduleKey: detectionResult.moduleKey,
            moduleName: detectionResult.moduleName,
            onChange: handleDataChange,
            onSave: handleSave,
            onCancel: handleCancel
        });

        console.log('[JSON Editor] Initialized for:', detectionResult.moduleKey);
        return true;

    } catch (error) {
        console.error('[JSON Editor] Initialization error:', error);
        showEditorError(container, t('editor_init_error') || 'Erreur lors de l\'initialisation');
        return false;
    }
}

/**
 * Detruit l'editeur et nettoie les ressources
 */
export function destroyEditor() {
    if (editorState.container) {
        editorState.container.innerHTML = '';
    }

    editorState = {
        isActive: false,
        originalData: null,
        currentData: null,
        contentType: null,
        moduleKey: null,
        notification: null,
        hasChanges: false,
        validationErrors: [],
        container: null,
        onSave: null,
        onCancel: null
    };

    console.log('[JSON Editor] Destroyed');
}

/**
 * Sauvegarde les modifications
 * @returns {Promise<Object|null>} - Les donnees modifiees ou null si erreur
 */
export async function saveChanges() {
    if (!editorState.isActive) {
        console.warn('[JSON Editor] No active editor');
        return null;
    }

    // Recuperer les donnees actuelles depuis l'editeur
    const currentData = getEditorData();
    if (currentData) {
        editorState.currentData = currentData;
    }

    // Valider les donnees
    const schema = getSchemaForType(editorState.moduleKey);
    const errors = getValidationErrors(editorState.currentData, schema);

    if (errors.length > 0) {
        editorState.validationErrors = errors;
        showValidationErrors(errors);
        return null;
    }

    // Retourner les donnees validees
    return {
        data: editorState.currentData,
        moduleKey: editorState.moduleKey,
        contentType: editorState.contentType,
        notification: editorState.notification
    };
}

/**
 * Annule les modifications et restaure les donnees originales
 */
export function discardChanges() {
    if (!editorState.isActive) return;

    editorState.currentData = JSON.parse(JSON.stringify(editorState.originalData));
    editorState.hasChanges = false;
    editorState.validationErrors = [];

    // Re-rendre l'editeur avec les donnees originales
    const schema = getSchemaForType(editorState.moduleKey);
    if (schema && editorState.container) {
        renderEditor(editorState.container, editorState.currentData, schema, {
            moduleKey: editorState.moduleKey,
            onChange: handleDataChange,
            onSave: handleSave,
            onCancel: handleCancel
        });
    }
}

/**
 * Verifie si l'editeur a des modifications non sauvegardees
 * @returns {boolean}
 */
export function hasUnsavedChanges() {
    return editorState.isActive && editorState.hasChanges;
}

/**
 * Retourne l'etat actuel de l'editeur
 * @returns {Object}
 */
export function getEditorState() {
    return { ...editorState };
}

/**
 * Verifie si l'editeur est actif
 * @returns {boolean}
 */
export function isEditorActive() {
    return editorState.isActive;
}

// =======================================================================
// HANDLERS INTERNES
// =======================================================================

/**
 * Gere les changements de donnees dans l'editeur
 * @param {string} path - Chemin de la propriete modifiee
 * @param {*} value - Nouvelle valeur
 */
function handleDataChange(path, value) {
    if (!editorState.isActive) return;

    // Mettre a jour la donnee
    setNestedValue(editorState.currentData, path, value);

    // Marquer comme modifie
    if (!editorState.hasChanges) {
        editorState.hasChanges = true;
        updateUnsavedIndicator(true);
    }

    // Valider en temps reel (debounced)
    debounceValidation();
}

/**
 * Gere le clic sur Sauvegarder
 */
async function handleSave() {
    const result = await saveChanges();

    if (result && editorState.onSave) {
        editorState.onSave(result);
    }
}

/**
 * Gere le clic sur Annuler
 */
function handleCancel() {
    if (editorState.hasChanges) {
        const confirmCancel = confirm(t('editor_confirm_discard') || 'Voulez-vous vraiment annuler ? Les modifications non sauvegardees seront perdues.');
        if (!confirmCancel) return;
    }

    if (editorState.onCancel) {
        editorState.onCancel();
    }
}

// =======================================================================
// UTILITAIRES
// =======================================================================

/**
 * Affiche une erreur dans le container de l'editeur
 */
function showEditorError(container, message) {
    container.innerHTML = `
        <div class="json-editor__empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Affiche les erreurs de validation
 */
function showValidationErrors(errors) {
    const container = editorState.container;
    if (!container) return;

    // Supprimer l'ancien resume
    const existingSummary = container.querySelector('.json-editor__validation-summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    // Creer le nouveau resume
    const summary = document.createElement('div');
    summary.className = 'json-editor__validation-summary';
    summary.innerHTML = `
        <div class="json-editor__validation-summary-title">
            <i class="fas fa-exclamation-circle"></i>
            ${t('editor_validation_errors') || 'Erreurs de validation'}
        </div>
        <ul class="json-editor__validation-summary-list">
            ${errors.map(err => `<li>${err.message}</li>`).join('')}
        </ul>
    `;

    // Inserer au debut
    const editorContent = container.querySelector('.json-editor');
    if (editorContent) {
        editorContent.insertBefore(summary, editorContent.firstChild);
        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Met a jour l'indicateur de modifications non sauvegardees
 */
function updateUnsavedIndicator(hasChanges) {
    const indicator = editorState.container?.querySelector('.json-editor__unsaved-indicator');
    if (indicator) {
        indicator.style.display = hasChanges ? 'flex' : 'none';
    }
}

// function setNestedValue moved to json-utils.js

// function getNestedValue moved to json-utils.js

// Validation debounce
let validationTimeout = null;
function debounceValidation() {
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }
    validationTimeout = setTimeout(() => {
        const schema = getSchemaForType(editorState.moduleKey);
        if (schema) {
            const errors = getValidationErrors(editorState.currentData, schema);
            editorState.validationErrors = errors;
            // Optionnel: afficher les erreurs en temps reel
        }
    }, 500);
}

// =======================================================================
// EXTRACTION DES DONNEES JSON
// =======================================================================

/**
 * Extrait les donnees JSON d'une notification
 * @param {Object} notification - La notification
 * @returns {Promise<Object|null>} Les donnees JSON ou null
 */
export async function extractJsonFromNotification(notification) {
    if (!notification) return null;

    try {
        if (notification.type === 'h5p') {
            // Extraire depuis le ZIP H5P
            return await extractH5PContent(notification.blob);
        } else if (notification.jsonData) {
            // Donnees deja disponibles (Moodle/Elea)
            return JSON.parse(JSON.stringify(notification.jsonData));
        }
    } catch (error) {
        console.error('[JSON Editor] Error extracting JSON:', error);
    }

    return null;
}

/**
 * Extrait le content.json d'un fichier H5P
 * @param {Blob} blob - Le fichier H5P
 * @returns {Promise<Object|null>}
 */
async function extractH5PContent(blob) {
    if (!blob) return null;

    try {
        // Charger JSZip si necessaire
        if (!window.JSZip) {
            console.error('[JSON Editor] JSZip not available');
            return null;
        }

        const zip = await JSZip.loadAsync(blob);
        const contentFile = zip.file('content/content.json');

        if (contentFile) {
            const content = await contentFile.async('string');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('[JSON Editor] Error extracting H5P content:', error);
    }

    return null;
}

// Export pour usage externe
export { editorState };
