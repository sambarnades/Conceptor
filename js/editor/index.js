import {prepareNativePresentationSchema, serializeNativePresentation, prepareNativeBookSchema, serializeNativeBook, prepareNativeVideoSchema, serializeNativeVideo} from './native-presentation-schema.js';
/**
 * JSON Editor - Module principal (Orchestrateur)
 *
 * Point d'entree de l'editeur JSON intelligent.
 * Gere le cycle de vie de l'editeur et l'integration avec la modale.
 */

import { detectContentType, getModuleName, getSchemaForType, normalizeDataForEditor, denormalizeDataForSave } from './content-detector.js';
import { reparerConsignesTest } from '../moodle/moodle-formats.js';
import { renderEditor, updateEditorState, getEditorData } from './editor-core.js';
import { validateSchema, getValidationErrors } from './validators.js';
import { t } from '../core/translation.js';
import { getNestedValue, setNestedValue } from './json-utils.js';
import { healStructureForActivity } from '../h5p/json-healer.js';
import { debugLog } from '../core/utils.js';
import { showConfirm } from './array-manager.js';
import { importMbz, importStandaloneXml, getEditorModuleKey } from '../moodle/moodle-importer.js';
import { getPageBlockSchema, getPageBlockTypes } from './field-renderers.js';
export { setNestedValue };

// =======================================================================
// IMAGES ENVOYÉES DANS LES BLOCS DE PAGE ET DE LIVRE (Caramel seul)
// =======================================================================

/**
 * Champ greffé juste après chaque « URL de l'image » (`img_src`) des blocs de
 * Page et de Livre : l'envoi d'une image depuis l'ordinateur (retour de
 * professeur, 29 sept. 2026 — la Page n'acceptait qu'une adresse à coller).
 *
 * C'est le widget image de l'éditeur (`renderImageField`), réglé comme pour le
 * fond d'« Image interactive » : PNG et JPEG gardés tels quels (transparence
 * comprise), plus grande dimension bornée à 1920 px, photos d'iPhone (HEIC),
 * TIFF, AVIF, BMP, SVG convertis, 12 Mo au plus. La valeur rangée dans le JSON
 * est `{path, mime, width, height, dataURL}` ; `moodle/page-images.js` en fait
 * un fichier du backup, cité par `@@PLUGINFILE@@`.
 */
const CHAMP_IMAGE_BLOC_PAGE = {
    type: 'image',
    label: 'editor_image',
    hint: 'editor_page_image_upload_hint',
    imageProcessor: 'background'
};

/**
 * Greffe `img_file` sur les schémas VIVANTS des blocs de Page (communs à la
 * Page et au Livre), juste après `img_src`. Pourquoi ici et pas dans
 * `field-renderers.js` : ce fichier est byte-identique avec La Sucrerie
 * (CLAUDE.md, piège 7), dont l'export ne sait pas encore joindre les images au
 * backup — la Sucrerie afficherait un champ dont l'image se perdrait. L'ordre
 * des clés d'un schéma est l'ordre d'affichage : on reconstruit donc l'objet.
 * Idempotent.
 */
function grefferEnvoiImagePage() {
    const greffer = (schema) => {
        if (!schema || typeof schema !== 'object') return;
        if ('img_src' in schema && !('img_file' in schema)) {
            const champs = Object.entries(schema);
            for (const [cle] of champs) delete schema[cle];
            for (const [cle, config] of champs) {
                schema[cle] = config;
                if (cle === 'img_src') schema.img_file = { ...CHAMP_IMAGE_BLOC_PAGE };
            }
        }
        // Cartes (#08, tableau) et figures gauche/droite (#09, objets).
        for (const config of Object.values(schema)) {
            if (config && typeof config === 'object') {
                greffer(config.itemSchema);
                greffer(config.schema);
            }
        }
    };
    for (const type of getPageBlockTypes()) greffer(getPageBlockSchema(type));
}
grefferEnvoiImagePage();

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
    onCancel: null,          // Callback après confirmation d’annulation
    onRequestCancel: null    // Le conteneur peut prendre en charge la confirmation
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
 * @param {Function} [options.onRequestCancel] - Délègue au conteneur la confirmation et l’annulation
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
                    moduleName: getModuleName(editorKey),
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

        // Tous les H5P peuvent contenir des médias (cartes et sous-activités comprises).
        // Le JSON natif ne porte que leur chemin dans l'archive. Sucrerie possède
        // son raccordement équivalent dans hydrateExistingImages.
        if (detectionResult.source === 'h5p' && notification.blob) {
            try { await rehydrateIHImagesFromBlob(notification.blob, jsonData); }
            catch (e) { debugLog('Editor', 'rehydrate IH images échoué:', e && e.message); }
        }

        if (detectionResult.moduleKey === 'elea_test') jsonData = reparerConsignesTest(jsonData);
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
            onCancel: options.onCancel || null,
            onRequestCancel: options.onRequestCancel || null
        };

        if (detectionResult.moduleKey==='InteractiveVideo' && jsonData.interactiveVideo) await prepareNativeVideoSchema(new URL('../vendor/h5p-libs/',import.meta.url).href);
        if (detectionResult.moduleKey==='InteractiveBook' && jsonData.chapters?.[0]?.params) await prepareNativeBookSchema(new URL('../vendor/h5p-libs/',import.meta.url).href);
        if (detectionResult.moduleKey==='CoursePresentation' && jsonData.presentation?.slides) await prepareNativePresentationSchema(new URL('../vendor/h5p-libs/',import.meta.url).href);
        // Obtenir le schema pour ce type
        const schema = getSchemaForType(detectionResult.moduleKey, editorState.currentData);

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

        // Le livre généré garde sa fiche simple ; les réglages complets ouvrent
        // le même formulaire natif que les réexports Éléa, sans appel réseau IA.
        if((detectionResult.moduleKey==='InteractiveBook' && !jsonData.chapters?.[0]?.params)||(detectionResult.moduleKey==='InteractiveVideo'&&!jsonData.interactiveVideo)){
            const advanced=document.createElement('button');advanced.type='button';advanced.className='json-editor__btn json-editor__btn--secondary';advanced.dataset.action=detectionResult.moduleKey==='InteractiveBook'?'book-native':'video-native';advanced.textContent=t('editor_options_advanced');
            advanced.addEventListener('click',async()=>{
                advanced.disabled=true;
                try {
                    const saved=await saveChanges();if(!saved)return;
                    const {processH5PContent}=await import('../h5p/processors/index.js');
                    const result=await processH5PContent(detectionResult.moduleKey,healStructureForActivity(saved.data,detectionResult.moduleKey));
                    await initJsonEditor(notification,container,result.content,options);
                } catch(error){debugLog('Editor','Réglages complets du livre :',error);showEditorError(container,t('editor_media_error_processing'));}
                finally{advanced.disabled=false;}
            });
            container.querySelector('.json-editor__actions-left')?.append(advanced);
        }

        // Vidéo interactive : lecteur intégré + « insérer une question à ce moment » (Caramel-only,
        // monté en frère du conteneur pour survivre aux re-rendus).
        if (detectionResult.moduleKey === 'InteractiveVideo' && !jsonData.interactiveVideo) {
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

        // Activités à image de fond : image affichée en grand + points déplaçables à la souris
        // (Caramel-only, monté en frère du conteneur pour survivre aux re-rendus — même principe que
        // le panneau Vidéo interactive ci-dessus). Les « questions hotspot » (Find the Hotspot /
        // Find Multiple Hotspots) passent leur variante : items {label, correct, x, y, …}, zones
        // dessinées à TAILLE RÉELLE (ellipse/rectangle selon `figure`, redimensionnables par poignée)
        // et colorées vert (zone correcte) / rouge (leurre).
        if (['ImageHotspots', 'FindTheHotspot', 'FindMultipleHotspots'].includes(detectionResult.moduleKey)) {
            const panelModuleKey = detectionResult.moduleKey;
            const hqOpts = (panelModuleKey === 'ImageHotspots') ? {} : {
                titleField: 'label',
                newItem: (x, y) => ({ label: '', correct: false, x, y, width: 20, height: 20, figure: 'circle', feedbackText: '' }),
                markerColor: (h) => (h && h.correct === true ? '#2e7d32' : '#c62828'),
                sizedZones: true
            };
            import('./interactive-image-panel.js').then(m => {
                m.mountInteractiveImagePanel(container, {
                    getData: () => { const d = getEditorData(); if (d) editorState.currentData = d; return editorState.currentData; },
                    setData: (d) => { editorState.currentData = d; editorState.hasChanges = true; },
                    rerender: () => {
                        renderEditor(container, editorState.currentData, getSchemaForType(panelModuleKey), {
                            moduleKey: panelModuleKey,
                            moduleName: detectionResult.moduleName,
                            onChange: handleDataChange,
                            onSave: handleSave,
                            onCancel: handleCancel
                        });
                    }
                }, hqOpts);
            }).catch(e => debugLog('Editor', 'IH panel échec:', e));
        }

        // Glisser-déposer : panneau « Disposition des zones » (vues Plan / Sur le canevas,
        // dispositions auto / personnalisée, zones ET étiquettes déplaçables/redimensionnables,
        // coordonnées saisissables). Panneau et calcul de layout sont PARTAGÉS avec Sucrerie
        // (dragdrop-layout-panel.js importe dragdrop-layout-model.js — la même math que le
        // processeur, cf. CLAUDE.md item 7).
        if (detectionResult.moduleKey === 'DragAndDrop') {
            import('./dragdrop-layout-panel.js')
                .then((panel) => {
                    panel.mountDragDropLayoutPanel(container, {
                        getData: () => { const d = getEditorData(); if (d) editorState.currentData = d; return editorState.currentData; },
                        setData: (d) => { editorState.currentData = d; editorState.hasChanges = true; }
                    });
                }).catch(e => debugLog('Editor', 'panneau disposition D&D échec:', e));
        }

        // Dictée : panneau réglages TTS (langue / voix / lecture lente / régénérer) au-dessus
        // de l'éditeur. Le panneau est PARTAGÉ (host-agnostique) mais son câblage réseau est
        // Caramel-only : on lui injecte services/tts.js ici (cf. CLAUDE.md item 7). Avant le
        // montage, on ré-hydrate le cache TTS depuis les audios du .h5p : les phrases
        // inchangées se réécoutent et se re-packagent SANS nouvel appel serveur.
        if (detectionResult.moduleKey === 'Dictation') {
            Promise.all([import('./dictation-tts-panel.js'), import('../services/tts.js'), import('../core/translation.js'), import('../h5p/image-manager.js')])
                .then(async ([panel, tts, tr, im]) => {
                    if (notification.blob) {
                        try { await primeDictationTtsCache(notification.blob, tts); }
                        catch (e) { debugLog('Editor', 'ré-hydratation cache TTS échouée:', e && e.message); }
                        try { await hydrateDictationMediaImage(notification.blob); }
                        catch (e) { debugLog('Editor', 'ré-hydratation image média échouée:', e && e.message); }
                    }
                    panel.mountDictationTtsPanel(container, {
                        getData: () => { const d = getEditorData(); if (d) editorState.currentData = d; return editorState.currentData; },
                        setData: (d) => { editorState.currentData = d; editorState.hasChanges = true; }
                    }, {
                        synthesize: tts.synthesizeSentences,
                        fetchVoices: tts.fetchTtsVoices,
                        getCachedAudio: tts.getCachedAudio,
                        audioPath: tts.ttsAudioPath,
                        getManualAudio: tts.getManualAudio,
                        processAudioFile: im.processAudioFile,
                        registerMedia: im.registerMedia,
                        langs: tts.TTS_LANGS,
                        defaultLang: tr.currentLang
                    });
                }).catch(e => debugLog('Editor', 'panneau TTS dictée échec:', e));
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
    // URLs blob: des lecteurs audio/vidéo de l'Image interactive (cf. rehydrateIHImagesFromBlob).
    revokeIHMediaObjectUrls();
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

            // Image interactive : même nettoyage (panneau frère + classe de mode + listener délégué
            // posé sur le conteneur, qui survivrait au simple innerHTML='').
            const ihPanel = parent.querySelector('.ih-editor-panel');
            if (ihPanel) ihPanel.remove();
            parent.classList.remove('ih-mode-live');
            if (ihPanel) import('./interactive-image-panel.js')
                .then(m => m.destroyInteractiveImagePanel && m.destroyInteractiveImagePanel())
                .catch(() => { /* module non chargé : rien à détruire */ });

            // Glisser-déposer : panneau « Disposition des zones » (frère + classe de vue +
            // listeners délégués change/click posés sur le conteneur, qui survivraient au
            // simple innerHTML='').
            const dzPanel = parent.querySelector('.dz-editor-panel');
            if (dzPanel) dzPanel.remove();
            parent.classList.remove('dz-mode-live');
            if (dzPanel) import('./dragdrop-layout-panel.js')
                .then(m => m.destroyDragDropLayoutPanel && m.destroyDragDropLayoutPanel())
                .catch(() => { /* module non chargé : rien à détruire */ });

            // Dictée : panneau réglages TTS (dans la section « Informations générales » du
            // mode maître/détail — il peut être DÉTACHÉ du DOM quand une autre vue est
            // affichée : la destruction doit donc être INCONDITIONNELLE pour la Dictée,
            // sinon son MutationObserver survit et re-greffe la barre sur la preview).
            const dtPanel = parent.querySelector('.dt-editor-panel');
            if (dtPanel || editorState.moduleKey === 'Dictation') import('./dictation-tts-panel.js')
                .then(m => m.destroyDictationTtsPanel && m.destroyDictationTtsPanel())
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
        onCancel: null,
        onRequestCancel: null
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
    const schema = getSchemaForType(editorState.moduleKey, editorState.currentData);
    const errors = getValidationErrors(editorState.currentData, schema);

    if (errors.length > 0) {
        editorState.validationErrors = errors;
        showValidationErrors(errors);
        return null;
    }

    // Dénormaliser les données pour la sauvegarde (ex: Glossary {items: [...]} -> tableau)
    let denormalizedData = denormalizeDataForSave(
        editorState.currentData,
        editorState.moduleKey
    );
    if(editorState.moduleKey==='InteractiveVideo' && denormalizedData.interactiveVideo)denormalizedData=serializeNativeVideo(denormalizedData,editorState.originalData);
    if(editorState.moduleKey==='InteractiveBook' && denormalizedData.chapters?.[0]?.params)denormalizedData=serializeNativeBook(denormalizedData,editorState.originalData);
    if(editorState.moduleKey==='CoursePresentation' && denormalizedData.presentation?.slides)denormalizedData=serializeNativePresentation(denormalizedData,editorState.originalData);
    if (editorState.moduleKey === 'elea_test') denormalizedData = reparerConsignesTest(denormalizedData);
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
    const schema = getSchemaForType(editorState.moduleKey, editorState.currentData);
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
    // Le parcours protège aussi ses commandes Précédente/Suivante/Fermer :
    // il centralise leur confirmation, sans empiler deux dialogues.
    if (editorState.onRequestCancel) return editorState.onRequestCancel();
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

    // On liste « OÙ — quoi », pas seulement « quoi ». Le résumé ne gardait que les messages
    // dédupliqués : trois blocs incomplets dans trois chapitres différents se réduisaient à
    // un unique « Ce champ est obligatoire », sans dire lequel ni où. L'éditeur étant en
    // maître-détail, le champ fautif n'est le plus souvent NI visible NI même rendu — le
    // surlignage plus bas ne pouvait donc rien montrer. `field` porte désormais le chemin
    // lisible complet (« Chapitre 2 › Bloc 4 › Type de bloc », cf. validators.js).
    const seen = new Set();
    const entries = [];
    for (const err of errors) {
        const key = `${err.field} ${err.message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push(err);
    }

    const title = document.createElement('div');
    title.className = 'json-editor__validation-summary-title';
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    title.appendChild(icon);
    title.appendChild(document.createTextNode(' ' + (t('editor_validation_errors') || 'Erreurs de validation')));
    summary.appendChild(title);

    const intro = document.createElement('p');
    intro.textContent = t('editor_validation_multiple_errors') || 'Veuillez corriger les erreurs ci-dessous.';
    summary.appendChild(intro);

    const list = document.createElement('ul');
    list.className = 'json-editor__validation-summary-list';
    for (const err of entries) {
        const li = document.createElement('li');
        if (err.field) {
            const strong = document.createElement('strong');
            strong.textContent = err.field;
            li.appendChild(strong);
            li.appendChild(document.createTextNode(' — '));
        }
        li.appendChild(document.createTextNode(err.message || ''));
        list.appendChild(li);
    }
    summary.appendChild(list);

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
        const schema = getSchemaForType(editorState.moduleKey, editorState.currentData);
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
/** MIME image depuis l'extension d'un chemin. */
function ihGuessImageMime(p) {
    const ext = String(p).toLowerCase().split('.').pop();
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'svg') return 'image/svg+xml';
    return 'image/jpeg';
}

/** URLs blob: créées pour les lecteurs audio/vidéo de l'éditeur — révoquées par destroyEditor(). */
let ihMediaObjectUrls = [];

function revokeIHMediaObjectUrls() {
    for (const url of ihMediaObjectUrls) {
        try { URL.revokeObjectURL(url); } catch { /* déjà révoquée */ }
    }
    ihMediaObjectUrls = [];
}

/**
 * Ré-hydrate les médias d'un content.json depuis le ZIP du .h5p, pour que l'éditeur visuel de
 * l'« Image interactive » AFFICHE l'image de fond / les images de blocs ET puisse LIRE les
 * audios/vidéos embarqués (audit N13 : sans ça le lecteur est monté avec src vide et
 * l'enseignant croit le fichier perdu). Images → dataURL base64 ; audio/vidéo → URL blob:
 * (suivie dans ihMediaObjectUrls, révoquée à destroyEditor). Mute `contentJson` en place.
 * Best-effort : un média absent du ZIP est ignoré.
 * @param {Blob} blob - L'archive .h5p.
 * @param {Object} contentJson - content.json (plat ou v1.11), muté en place.
 */
async function rehydrateIHImagesFromBlob(blob, contentJson) {
    if (!blob || !contentJson || typeof contentJson !== 'object') return;
    // JSZip pas encore prêt (ouverture rapide de l'éditeur) : le charger au lieu d'un no-op
    // silencieux qui laissait toutes les previews vides.
    if (!window.JSZip) {
        try { const { loadJSZip } = await import('../core/lib-loader.js'); await loadJSZip(); }
        catch { return; }
        if (!window.JSZip) return;
    }
    revokeIHMediaObjectUrls(); // URLs d'une session d'édition précédente
    const zip = await JSZip.loadAsync(blob);
    const imageRe = /^images\/.+\.(jpe?g|png|gif|webp|svg)$/i;
    const avRe = /^(audios|videos)\/.+/i;
    const imageTargets = [];
    const avTargets = [];
    (function walk(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        if (typeof node.path === 'string' && (!node.dataURL || node.dataURL.startsWith('blob:'))) {
            if (imageRe.test(node.path)) imageTargets.push(node);
            else if (avRe.test(node.path)) avTargets.push(node);
        }
        for (const k of Object.keys(node)) walk(node[k]);
    })(contentJson);
    for (const ref of imageTargets) {
        try {
            const f = zip.file('content/' + ref.path);
            if (!f) continue;
            const b64 = await f.async('base64');
            ref.dataURL = `data:${ref.mime || ihGuessImageMime(ref.path)};base64,${b64}`;
        } catch { /* image manquante : ignorée */ }
    }
    for (const ref of avTargets) {
        try {
            const f = zip.file('content/' + ref.path);
            if (!f) continue;
            const buf = await f.async('arraybuffer');
            const url = URL.createObjectURL(new Blob([buf], ref.mime ? { type: ref.mime } : undefined));
            ihMediaObjectUrls.push(url);
            ref.dataURL = url; // consommé par le lecteur de field-renderers (playableSrc)
        } catch { /* média manquant : ignoré */ }
    }
}

/**
 * Ré-hydrate le cache du service TTS depuis les audios synthétisés d'un .h5p rouvert
 * (`content/audios/dictation-<hash>.mp3`). Le hash du nom de fichier EST la clé de cache
 * (chemins déterministes, cf. services/tts.js) : les phrases inchangées sont ensuite
 * réécoutables dans le panneau et re-packagées sans aucun appel serveur.
 * @param {Blob} blob - L'archive .h5p de la notification.
 * @param {Object} tts - Le module services/tts.js (déjà importé).
 */
async function primeDictationTtsCache(blob, tts) {
    if (!blob || !tts || !tts.primeTtsCacheFromPath) return;
    if (!window.JSZip) {
        try { const { loadJSZip } = await import('../core/lib-loader.js'); await loadJSZip(); }
        catch { return; }
        if (!window.JSZip) return;
    }
    const zip = await JSZip.loadAsync(blob);
    const reTts = /^content\/(audios\/dictation-[0-9a-f]{8}\.mp3)$/;
    const reAudio = /^content\/(audios\/[A-Za-z0-9._-]+)$/;
    for (const name of Object.keys(zip.files)) {
        if (zip.files[name].dir) continue;
        const mTts = reTts.exec(name);
        const mAudio = mTts ? null : reAudio.exec(name);
        if (!mTts && !mAudio) continue;
        try {
            const buf = await zip.files[name].async('arraybuffer');
            if (mTts) {
                tts.primeTtsCacheFromPath(mTts[1], new Blob([buf], { type: 'audio/mpeg' }));
            } else if (tts.primeManualAudio) {
                // Audio « Ma voix » / import : relisible dans le panneau sans re-téléversement.
                tts.primeManualAudio(mAudio[1], new Blob([buf]));
            }
        } catch { /* audio illisible : ignoré */ }
    }
}

/**
 * Ré-hydrate l'aperçu de l'image « Média » de la Dictée depuis le .h5p rouvert : le
 * content.json rechargé ne porte que le chemin `images/…` (le dataURL est volontairement
 * exclu du fichier) — sans cette étape, le widget image de l'éditeur s'ouvre vide.
 * Même logique que hydrateExistingImages côté Sucrerie.
 * @param {Blob} blob - L'archive .h5p de la notification.
 */
async function hydrateDictationMediaImage(blob) {
    const img = editorState.currentData && editorState.currentData.mediaImage;
    if (!blob || !img || !img.path || img.dataURL) return;
    if (!window.JSZip) {
        try { const { loadJSZip } = await import('../core/lib-loader.js'); await loadJSZip(); }
        catch { return; }
        if (!window.JSZip) return;
    }
    const zip = await JSZip.loadAsync(blob);
    const entry = zip.file('content/' + img.path);
    if (!entry) return;
    const b64 = await entry.async('base64');
    img.dataURL = `data:${img.mime || 'image/jpeg'};base64,${b64}`;
    // La vue courante (« Informations générales ») est déjà rendue : mettre l'aperçu à jour
    // en place (les navigations suivantes re-rendront depuis la donnée hydratée).
    const previewImg = document.querySelector('.json-editor__image-preview-img');
    if (previewImg && !previewImg.getAttribute('src')) previewImg.setAttribute('src', img.dataURL);
}

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
