/**
 * JSON Editor - Module principal (Orchestrateur)
 *
 * Point d'entree de l'editeur JSON intelligent.
 * Gere le cycle de vie de l'editeur et l'integration avec la modale.
 */

import { detectContentType, getSchemaForType, normalizeDataForEditor, denormalizeDataForSave } from './content-detector.js';
import { renderEditor, updateEditorState, getEditorData } from './editor-core.js';
import { validateSchema, getValidationErrors } from './validators.js';
import { t } from '../core/translation.js';
import { getNestedValue, setNestedValue } from './json-utils.js';
import { healStructureForActivity } from '../h5p/json-healer.js';
import { debugLog } from '../core/utils.js';
import { showConfirm } from './array-manager.js';
import { importMbz, importStandaloneXml, getEditorModuleKey } from '../moodle/moodle-importer.js';
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
        debugLog('Editor', 'initJsonEditor - notification.titleKey:', notification.titleKey);
        debugLog('Editor', 'initJsonEditor - jsonData:', JSON.stringify(jsonData, null, 2));

        // Le court-circuit moduleKey est RÉSERVÉ aux notifications Moodle
        // (import .mbz / .xml ou génération Éléa, type 'mbz'/'xml'). Les
        // notifications H5P (type 'h5p') portent elles aussi un moduleKey
        // (clé du processeur, ex: 'QuizSetQCM') mais celle-ci n'est PAS une
        // clé de fieldSchema : 'QuizSetQCM'/'QuizSetVF' doivent être détectées
        // via titleKey → 'QuizSet'. On les laisse donc passer par
        // detectContentType. Sans cette garde, l'éditeur de Quiz QCM/VF
        // échoue avec « No schema found for: QuizSetQCM » (régression beta7d).
        let detectionResult = null;
        if (notification.moduleKey && notification.type !== 'h5p') {
            // Traduit la clé Caramel canonique exposée par l'importer
            // ('QCM', 'Glossaire', …) vers la clé interne attendue par
            // content-detector.js / les fieldSchemas ('elea_qcm', 'elea_glossaire', …).
            // Si la clé n'est pas connue de la table, on retombe sur la valeur
            // brute (cas legacy / notifications déjà annotées en elea_*).
            const editorKey = getEditorModuleKey(notification.moduleKey) || notification.moduleKey;
            // Filet de sécurité : on ne court-circuite que si un schéma existe
            // réellement pour la clé résolue, sinon on retombe sur la détection.
            if (getSchemaForType(editorKey)) {
                debugLog('Editor', 'initJsonEditor - moduleKey pre-connu via import:', notification.moduleKey, '→', editorKey);
                detectionResult = {
                    moduleKey:  editorKey,
                    moduleName: editorKey,
                    source:     'moodle'
                };
            }
        }
        if (!detectionResult) {
            detectionResult = detectContentType(jsonData, notification.titleKey);
        }
        debugLog('Editor', 'initJsonEditor - detectionResult:', detectionResult);

        if (!detectionResult) {
            console.error('[JSON Editor] Could not detect content type');
            showEditorError(container, t('editor_unknown_type') || 'Type de contenu non reconnu');
            return false;
        }

        // Normaliser les données pour l'éditeur (ex: Glossary tableau -> {items: [...]})
        const normalizedData = normalizeDataForEditor(
            JSON.parse(JSON.stringify(jsonData)),
            detectionResult.moduleKey
        );

        // Initialiser l'etat
        editorState = {
            isActive: true,
            originalData: JSON.parse(JSON.stringify(jsonData)), // Deep clone des données ORIGINALES
            currentData: normalizedData,  // Données normalisées pour l'éditeur
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

        // Vidéo interactive : lecteur intégré + « insérer une question à ce moment » (Caramel-only,
        // monté en frère du conteneur pour survivre aux re-rendus).
        if (detectionResult.moduleKey === 'InteractiveVideo') {
            import('./interactive-video-panel.js').then(m => {
                m.mountInteractiveVideoPanel(container, {
                    getData: () => { const d = getEditorData(); if (d) editorState.currentData = d; return editorState.currentData; },
                    setData: (d) => { editorState.currentData = d; editorState.hasChanges = true; },
                    rerender: () => {
                        renderEditor(container, editorState.currentData, getSchemaForType('InteractiveVideo'), {
                            moduleKey: 'InteractiveVideo',
                            moduleName: detectionResult.moduleName,
                            onChange: handleDataChange,
                            onSave: handleSave,
                            onCancel: handleCancel
                        });
                    }
                });
            }).catch(e => debugLog('Editor', 'IV panel échec:', e));
        }

        debugLog('Editor', 'Initialized for:', detectionResult.moduleKey);
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
        // Le panneau « Vidéo interactive » est monté en FRÈRE du conteneur (pour survivre aux
        // re-rendus) : container.innerHTML='' ne le retire donc pas. On l'enlève explicitement,
        // sinon la barre « Lecteur vidéo » fuit dans la modale de visualisation après édition.
        const parent = editorState.container.parentElement;
        if (parent) {
            const ivPanel = parent.querySelector('.iv-editor-panel');
            if (ivPanel) ivPanel.remove();
            // Le mode Live pose la classe `iv-mode-live` sur le parent (masque la nav) : la retirer
            // pour qu'elle ne fuie pas si l'on ferme l'éditeur en mode Live.
            parent.classList.remove('iv-mode-live');
            // Tuer le lecteur encore vivant (le mode Live YouTube laisse un timer de sondage) — le
            // module est déjà chargé (mount), l'import est donc instantané et résolu par cache.
            if (ivPanel) import('./interactive-video-panel.js')
                .then(m => m.destroyInteractiveVideoPanel && m.destroyInteractiveVideoPanel())
                .catch(() => { /* module non chargé : rien à détruire */ });
        }
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

    debugLog('Editor', 'Destroyed');
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
    debugLog('Editor', 'saveChanges - currentData from getEditorData():', JSON.stringify(currentData, null, 2));
    debugLog('Editor', 'saveChanges - moduleKey:', editorState.moduleKey);
    if (currentData) {
        editorState.currentData = currentData;
    }

    // Healing structurel avant validation (complete les champs techniques manquants)
    editorState.currentData = healStructureForActivity(editorState.currentData, editorState.moduleKey);

    // Valider les donnees (apres healing, ne rejette que les vrais manques de contenu)
    const schema = getSchemaForType(editorState.moduleKey);
    const errors = getValidationErrors(editorState.currentData, schema);

    if (errors.length > 0) {
        editorState.validationErrors = errors;
        showValidationErrors(errors);
        return null;
    }

    // Dénormaliser les données pour la sauvegarde (ex: Glossary {items: [...]} -> tableau)
    const denormalizedData = denormalizeDataForSave(
        editorState.currentData,
        editorState.moduleKey
    );
    debugLog('Editor', 'saveChanges - denormalizedData:', JSON.stringify(denormalizedData, null, 2));

    // Retourner les donnees validees
    return {
        data: denormalizedData,
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

    // Renormaliser les données originales pour l'éditeur
    editorState.currentData = normalizeDataForEditor(
        JSON.parse(JSON.stringify(editorState.originalData)),
        editorState.moduleKey
    );
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
async function handleCancel() {
    if (editorState.hasChanges) {
        const message = t('editor_confirm_discard') || 'Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.';
        const title = t('editor_confirm_discard_title') || 'Modifications non enregistrées';
        const confirmText = t('editor_discard_btn') || 'Abandonner';
        const cancelText = t('editor_cancel') || 'Annuler';

        const confirmed = await showConfirm(message, title, confirmText, cancelText, true);
        if (!confirmed) return;
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

    // Grouper les erreurs par message pour éviter la répétition
    const uniqueMessages = [...new Set(errors.map(e => e.message))];
    const message = uniqueMessages.length === 1 ? uniqueMessages[0] : (t('editor_validation_multiple_errors') || 'Veuillez corriger les erreurs ci-dessous.');

    summary.innerHTML = `
        <div class="json-editor__validation-summary-title">
            <i class="fas fa-exclamation-circle"></i>
            ${t('editor_validation_errors') || 'Erreurs de validation'}
        </div>
        <p>${message}</p>
        ${uniqueMessages.length > 1 ? `<ul class="json-editor__validation-summary-list">${uniqueMessages.map(msg => `<li>${msg}</li>`).join('')}</ul>` : ''}
    `;

    // Inserer au debut
    const editorContent = container.querySelector('.json-editor');
    if (editorContent) {
        editorContent.insertBefore(summary, editorContent.firstChild);
        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Mettre en évidence les champs en erreur
    // D'abord nettoyer les erreurs précédentes
    const previousErrors = container.querySelectorAll('.json-editor__field--error, .json-editor__input--error');
    previousErrors.forEach(el => {
        el.classList.remove('json-editor__field--error');
        el.classList.remove('json-editor__input--error');
        el.classList.remove('json-editor__textarea--error');
        el.classList.remove('json-editor__select--error');
    });

    // Appliquer les nouvelles erreurs
    errors.forEach(err => {
        // Chercher l'input exact
        const input = container.querySelector(`[data-path="${err.path}"]`);
        if (input) {
            input.classList.add('json-editor__input--error');
            // Trouver le wrapper parent le plus proche (le champ)
            const field = input.closest('.json-editor__field');
            if (field) {
                field.classList.add('json-editor__field--error');

                // Afficher le message sous le champ si pas déjà fait
                let errorMsg = field.querySelector('.json-editor__error');
                if (!errorMsg) {
                    errorMsg = document.createElement('span');
                    errorMsg.className = 'json-editor__error';
                    field.appendChild(errorMsg);
                }
                errorMsg.textContent = err.message;
            }
        } else {
            // Si pas d'input (ex: erreur de section ou tableau global), essayer de trouver un container
            // data-path est parfois sur le wrapper array
            const wrapper = container.querySelector(`.json-editor__field[data-path="${err.path}"]`);
            if (wrapper) {
                wrapper.classList.add('json-editor__field--error');
                let errorMsg = wrapper.querySelector('.json-editor__error');
                if (!errorMsg) {
                    // Chercher où le mettre
                    const header = wrapper.querySelector('.json-editor__label') || wrapper.firstChild;
                    errorMsg = document.createElement('span');
                    errorMsg.className = 'json-editor__error';
                    if (header) header.after(errorMsg);
                    else wrapper.prepend(errorMsg);
                }
                errorMsg.textContent = err.message;
            }
        }
    });
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
 * Stratégie Markdown-First : priorise originalJsonData (Markdown) sur jsonData (HTML)
 * @param {Object} notification - La notification
 * @returns {Promise<Object|null>} Les donnees JSON ou null
 */
export async function extractJsonFromNotification(notification) {
    if (!notification) return null;

    try {
        // PRIORITÉ 1: Markdown original (source de vérité pour l'édition)
        if (notification.originalJsonData) {
            debugLog('Editor', 'Using originalJsonData (Markdown source)');
            return JSON.parse(JSON.stringify(notification.originalJsonData));
        }

        // PRIORITÉ 2: Binaire MBZ — réouverture d'un .mbz généré par Caramel
        // (ou par un autre Moodle). Dispatch via moodle-importer vers le
        // processor.parseFiles() approprié.
        if (notification.type === 'mbz' && notification.blob) {
            debugLog('Editor', 'Importing MBZ binary');
            const buffer = await notification.blob.arrayBuffer();
            const result = await importMbz(buffer);
            // Annoter la notification avec le contexte d'import pour que la
            // sauvegarde ultérieure puisse re-packager via serializeFiles.
            notification.moduleKey  = result.moduleKey;
            notification._mbzFiles  = result.files;
            notification._mbzDir    = result.activityDir;
            notification._mbzModule = result.moduleName;
            return result.data;
        }

        // PRIORITÉ 3: XML standalone — Glossaire (<GLOSSARY>) ou banque de
        // questions (<quiz>) exportée hors MBZ. Détection automatique du format.
        if (notification.type === 'xml-standalone' && notification.xml) {
            debugLog('Editor', 'Importing XML standalone');
            const result = importStandaloneXml(notification.xml);
            notification.moduleKey = result.moduleKey;
            notification._xmlType  = result.xmlType;
            return result.data;
        }

        // PRIORITÉ 4: Extraction depuis ZIP H5P (fallback pour anciennes notifications)
        if (notification.type === 'h5p') {
            debugLog('Editor', 'Fallback: Extracting from H5P ZIP');
            return await extractH5PContent(notification.blob);
        }

        // PRIORITÉ 5: jsonData direct (Moodle/Eléa - pas de transformation)
        if (notification.jsonData) {
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
