/**
 * @file Gestion de l'interface utilisateur principale.
 * Ce module est responsable de la génération des tuiles d'activités, de la gestion des onglets,
 * de l'affichage du contenu dans la barre latérale, et du défilement par glissement.
 */

import { allModules, customOrder, h5pModules, moodleModules } from '../core/definitions.js';
import { translations, translatePage, currentLang } from '../core/translation.js';
import { generatePrompts } from '../services/prompt-generator.js';
import { cleanJsonInput, showNotification, copyToClipboard, downloadFile, setupToolbarListeners, getCaramelVersionFromFooter, syncPanelHeights, DEBUG, debugLog, setupModalAccessibility } from '../core/utils.js';
import { populateModelSelector, AVAILABLE_MODELS, DEFAULT_MODEL, ACTIVITY_MODEL_OVERRIDES, generateH5PWithLLM } from '../services/llm.js';
import { addNotification, getNotificationById, getLastDebugNotification, showToastForNotification, revealNotification } from './notifications.js';

// ============= IMPORTS DYNAMIQUES (chargés à la demande) =============
// Les modules de création/export sont chargés via import() dynamique au moment
// où l'utilisateur déclenche une génération ou un export :
//   h5p-creator.js, moodle-creator.js, moodle-formats.js, document-exporter.js

// Préfixe pour les clés sessionStorage (persistance session uniquement)
const STORAGE_PREFIX = 'caramel_';

// Map inversée : titleKey (ex: "h5p_timeline_name") → { key: "Timeline", mod: {...} }
// Construite une seule fois pour accélérer les lookups O(1) dans showGenerationResult()
const modulesByTitleKey = new Map();
for (const [key, mod] of Object.entries(allModules)) {
    if (mod.name) modulesByTitleKey.set(mod.name, { key, mod });
}

/**
 * Génère et affiche les tuiles des modules d'activité dans la grille unique.
 * Chaque tuile reçoit des attributs data-activity-types et data-platforms pour le filtrage.
 */
export function generateTiles() {
    const grid = document.querySelector('.activity-grid .grid');
    if (!grid) return;
    grid.innerHTML = '';

    const activityTypeCategories = ['quiz', 'text', 'memory'];

    const renderTile = (key) => {
        const module = allModules[key];
        if (!module || module.hidden) return;

        const tile = document.createElement('div');
        tile.className = 'h5p-tile';
        tile.setAttribute('role', 'listitem');
        tile.dataset.module = key;

        // Attributs pour le filtrage par type d'activité
        const actTypes = module.categories.filter(c => activityTypeCategories.includes(c));
        tile.dataset.activityTypes = actTypes.join(',');

        // Attributs pour le filtrage par plateforme
        const platformTags = [];
        if (module.categories.includes('h5p')) platformTags.push('h5p');
        if (module.categories.includes('elea')) platformTags.push('elea');
        if (module.platforms?.includes('Magistère')) platformTags.push('magistere');
        if (module.platforms?.includes('Moodle')) platformTags.push('moodle');
        tile.dataset.platforms = platformTags.join(',');

        tile.innerHTML = `
                <img src="${module.image}" alt="${translations[module.name]} icon" loading="lazy">
                <div class="tile-text">
                    <span class="tile-name-fr" data-key="${module.name}">${translations[module.name]}</span>
                    ${module.englishName ? `<span class="tile-name-en">(${module.englishName})</span>` : ''}
                    ${module.subtitleKey ? `<span class="tile-name-en" data-key="${module.subtitleKey}">${translations[module.subtitleKey] || ''}</span>` : ''}
                </div>
            `;

        if (module.categories.includes('h5p')) {
            const label = document.createElement('div');
            label.className = 'module-label h5p-label';
            label.innerHTML = '<span>H5P</span>';
            tile.appendChild(label);
        } else if (module.categories.includes('elea')) {
            const label = document.createElement('div');
            label.className = 'module-label elea-label';
            label.innerHTML = '<span>Éléa</span>';
            tile.appendChild(label);
        }
        tile.setAttribute('tabindex', '0');
        tile.addEventListener('click', () => toggleActivityContent(key, tile));
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleActivityContent(key, tile);
            }
        });
        grid.appendChild(tile);
    };

    // Render dans l'ordre customOrder, puis les modules restants
    const renderedKeys = new Set();
    customOrder.forEach(key => {
        if (allModules[key]) {
            renderTile(key);
            renderedKeys.add(key);
        }
    });
    for (const key in allModules) {
        if (!renderedKeys.has(key)) {
            renderTile(key);
        }
    }
}

// =======================================================================
// 4.2. Configuration des onglets
// =======================================================================
/**
 * Initialise la barre de filtres (chips activité + plateforme).
 * Gère également l'état visuel des tuiles en fonction de la saisie dans les champs "qui" et "quoi".
 */
export function setupFilters() {
    const container = document.querySelector('.container');
    const quiInput = document.querySelector('#qui');
    const quoiInput = document.querySelector('#quoi');

    /**
     * Met à jour l'état des tuiles en fonction de la saisie dans les champs.
     * Les tuiles apparaissent en grisé si les deux champs sont vides.
     */
    function updateTilesState() {
        const quiValue = quiInput?.value || '';
        const quoiValue = quoiInput?.value || '';

        if (quiValue.trim() === '' && quoiValue.trim() === '') {
            container?.classList.add('tiles-disabled');
        } else {
            container?.classList.remove('tiles-disabled');
        }
    }

    // Ajouter les écouteurs sur les champs "qui" et "quoi"
    if (quiInput && quoiInput) {
        quiInput.addEventListener('input', updateTilesState);
        quoiInput.addEventListener('input', updateTilesState);
    }

    // --- Détection des changements de contexte pour réinitialiser les données ---

    /**
     * Génère un hash du contexte actuel pour détecter les changements.
     * Inclut les 4 champs de formulaire + le contenu RAG (documents joints).
     * @returns {string} Hash concaténé des valeurs de contexte.
     */
    function getContextHash() {
        const qui = document.getElementById('qui')?.value || '';
        const quoi = document.getElementById('quoi')?.value || '';
        const niveau = document.getElementById('niveau')?.value || '';
        const nombreQuestions = document.getElementById('nombreQuestions')?.value || '';
        const ocrContent = document.getElementById('ocr-output')?.innerText || '';
        return `${qui}|${quoi}|${niveau}|${nombreQuestions}|${ocrContent}`;
    }

    /**
     * Efface les données sauvegardées (prompts et JSON) dans sessionStorage.
     * Appelé lors d'un changement de contexte pour invalider les anciennes données.
     */
    function clearSessionData() {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(`${STORAGE_PREFIX}json_`) || key?.startsWith(`${STORAGE_PREFIX}prompt_`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }

    /**
     * Détecte les changements de contexte et régénère les prompts si nécessaire.
     */
    function handleContextChange() {
        const currentHash = getContextHash();
        const savedHash = sessionStorage.getItem(`${STORAGE_PREFIX}context_hash`);

        if (savedHash && savedHash !== currentHash) {
            // Le contexte a changé : effacer les données sauvegardées (prompts et JSON)
            clearSessionData();

            // Régénérer les prompts seulement si au moins un champ requis est rempli
            // (évite les erreurs quand l'utilisateur efface tous les champs)
            const qui = document.getElementById('qui')?.value.trim() || '';
            const quoi = document.getElementById('quoi')?.value.trim() || '';
            if (qui || quoi) {
                generatePrompts();
            }

            // En mode guidé, vider le textarea JSON (le prompt a changé, l'ancien JSON n'est plus pertinent)
            if (activeTile && sidebar.classList.contains('advanced-view')) {
                const mk = activeTile.dataset.module;
                const mod = h5pModules[mk] || moodleModules[mk];
                if (mod) {
                    const jid = (mk === 'test_elea') ? 'xmlEleaMoodleInput'
                              : (mk === 'glossaireXml') ? 'glossaireXmlJsonInput'
                              : mod.jsonInputId;
                    const jta = document.getElementById(jid);
                    if (jta) jta.value = '';
                    const bg = document.getElementById(`generation-button-group-${mk}`);
                    if (bg?._ctxUpdate) bg._ctxUpdate();
                }
            }
        }
        sessionStorage.setItem(`${STORAGE_PREFIX}context_hash`, currentHash);
    }

    // Debounce pour éviter trop d'appels lors de la saisie rapide
    let contextChangeTimeout;
    function debouncedContextChange() {
        clearTimeout(contextChangeTimeout);
        contextChangeTimeout = setTimeout(handleContextChange, 500);
    }

    // Ajouter les listeners sur les 4 champs de contexte
    const contextFields = ['qui', 'quoi', 'niveau', 'nombreQuestions'];
    contextFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', debouncedContextChange);
        }
    });

    // Ajouter le listener sur le contenu RAG (documents joints)
    const ocrOutput = document.getElementById('ocr-output');
    if (ocrOutput) {
        ocrOutput.addEventListener('input', debouncedContextChange);
    }

    // Initialiser le hash du contexte au chargement
    sessionStorage.setItem(`${STORAGE_PREFIX}context_hash`, getContextHash());

    // --- Fin de la détection des changements de contexte ---

    // --- Gestion des filtres par chips ---

    /**
     * Applique les filtres actifs (type d'activité + plateforme) sur les tuiles.
     */
    function applyFilters() {
        const activeType = document.querySelector('.filter-chip--activity.active')?.dataset.filterType || 'all';
        const activePlatforms = [...document.querySelectorAll('.filter-chip[data-filter-platform].active')]
            .map(el => el.dataset.filterPlatform);

        document.querySelectorAll('.h5p-tile').forEach(tile => {
            const types = (tile.dataset.activityTypes || '').split(',');
            const platforms = (tile.dataset.platforms || '').split(',');

            const matchesType = activeType === 'all' || types.includes(activeType);
            const matchesPlatform = activePlatforms.length === 0 ||
                activePlatforms.some(p => {
                    // Éléa gère aussi les H5P : sélectionner Éléa inclut les activités H5P
                    if (p === 'elea') return platforms.includes('elea') || platforms.includes('h5p');
                    return platforms.includes(p);
                });

            tile.style.display = (matchesType && matchesPlatform) ? '' : 'none';
        });
    }

    // Chips activité : sélection exclusive
    const activityChips = document.querySelectorAll('.filter-chip--activity');
    activityChips.forEach(chip => {
        chip.addEventListener('click', () => {
            activityChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            applyFilters();
        });
    });

    // Chips plateforme : sélection exclusive avec toggle (clic sur l'actif le désactive)
    const platformChips = document.querySelectorAll('.filter-chip[data-filter-platform]');
    platformChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const isActive = chip.classList.contains('active');
            platformChips.forEach(c => c.classList.remove('active'));
            if (!isActive) chip.classList.add('active');
            applyFilters();
        });
    });

    // Magistère : visible uniquement en français
    const magistereChip = document.querySelector('.filter-chip[data-filter-platform="magistere"]');
    function updateMagistereChipVisibility() {
        if (!magistereChip) return;
        magistereChip.style.display = currentLang === 'fr' ? '' : 'none';
        if (currentLang !== 'fr') magistereChip.classList.remove('active');
    }
    updateMagistereChipVisibility();
    window.addEventListener('caramel:language-changed', updateMagistereChipVisibility);


    // Vérification initiale de l'état des tuiles
    updateTilesState();
}

// =======================================================================
// 4.3. Affichage du contenu d'une activité dans la barre latérale
// =======================================================================

/**
 * @property {HTMLElement|null} activeTile - Garde une référence vers la tuile actuellement active.
 */
export let activeTile = null;
let closeSidebarTimer = null;
let _sidebarA11yCleanup = null;
const sidebar = document.getElementById('module-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

/**
 * Sauvegarde le prompt et le JSON de la modale dans sessionStorage.
 * Permet de restaurer le travail de l'utilisateur s'il ferme/rouvre la modale
 * sans changer le contexte. En cas de changement de contexte, les données
 * sont automatiquement effacées par handleContextChange().
 * @param {string} moduleKey - La clé identifiant le module actuel.
 */
function saveModalDataToSession(moduleKey) {
    if (!moduleKey) return;

    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    if (!module) return;

    // Déterminer les IDs des textareas
    const promptId = (moduleKey === 'test_elea') ? 'test_eleaResultat'
                   : (moduleKey === 'glossaireXml') ? 'glossaireXmlResultat'
                   : module.promptId;

    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput'
                      : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput'
                      : module.jsonInputId;

    // Sauvegarder le prompt (peut avoir été modifié manuellement par l'utilisateur)
    const promptTextarea = document.getElementById(promptId);
    if (promptTextarea?.value.trim()) {
        sessionStorage.setItem(`${STORAGE_PREFIX}prompt_${moduleKey}`, promptTextarea.value);
    }

    // Sauvegarder le JSON (contenu généré par LLM)
    const jsonTextarea = document.getElementById(jsonInputId);
    if (jsonTextarea?.value.trim()) {
        sessionStorage.setItem(`${STORAGE_PREFIX}json_${moduleKey}`, jsonTextarea.value);
    }
}

function closeSidebar() {
    // Sauvegarder les données avant fermeture
    if (activeTile) {
        const moduleKey = activeTile.dataset.module;
        saveModalDataToSession(moduleKey);
    }

    // Accessibilité : nettoyer le focus trap et restaurer le focus
    if (_sidebarA11yCleanup) {
        _sidebarA11yCleanup();
        _sidebarA11yCleanup = null;
    }

    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
    if (activeTile) {
        activeTile.classList.remove('active');
        activeTile = null;
    }
    // Supprimer le handler de resize
    if (sidebar._resizeHandler) {
        window.removeEventListener('resize', sidebar._resizeHandler);
        sidebar._resizeHandler = null;
    }
    // Vider le contenu pour éviter les conflits d'ID
    closeSidebarTimer = setTimeout(() => {
        sidebar.innerHTML = '';
    }, 400); // Durée de la transition
}

// Rendre accessible au handler inline de la croix en mode responsive
// (l'appel onclick="closeSidebar()" nécessite une fonction globale)
window.closeSidebar = closeSidebar;

if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

/**
 * Affiche ou masque le contenu d'une activité dans la barre latérale.
 * Gère la création dynamique du contenu de la barre latérale en fonction du module sélectionné.
 * @param {string} moduleKey - La clé identifiant le module à afficher.
 * @param {HTMLElement} tileElement - L'élément de la tuile qui a été cliqué.
 */
export function toggleActivityContent(moduleKey, tileElement) {
    generatePrompts();
    const isH5P = !!h5pModules[moduleKey];
    const module = isH5P ? h5pModules[moduleKey] : moodleModules[moduleKey];
    if (!module) return;

    sidebar.classList.remove('advanced-view');

    // Annuler le nettoyage différé d'une fermeture précédente
    if (closeSidebarTimer) {
        clearTimeout(closeSidebarTimer);
        closeSidebarTimer = null;
    }

    if (activeTile === tileElement) {
        closeSidebar();
        return;
    }

    if (activeTile) {
        activeTile.classList.remove('active');
    }
    activeTile = tileElement;
    activeTile.classList.add('active');

    // --- Variables spécifiques au type de module ---
    const moduleTypeLabel = isH5P ? 'H5P' : 'Éléa';
    const moduleLabelClass = isH5P ? 'h5p-label-modal' : 'elea-label-modal';

    let promptPanelHtml = '';
    let creationPanelHtml = '';

    if (isH5P) {
        promptPanelHtml = `
                <div class="modal-panel-header">
                    <h3 data-key="get_prompt_step">1/2 Obtenir le prompt</h3>
                </div>
                <div class="floating-toolbar">
                    <button class="toolbar-btn copy-prompt-btn" data-tooltip-key="copy_prompt"><i class="fas fa-copy"></i><span class="toolbar-btn-text" data-key="copy_prompt"></span></button>
                    <button class="toolbar-btn fullscreen-btn" data-tooltip-key="fullscreen_prompt"><i class="fas fa-expand"></i><span class="toolbar-btn-text" data-key="fullscreen_prompt"></span></button>
                    <button class="toolbar-btn lock-btn" data-tooltip-key="unlock_prompt"><i class="fas fa-lock"></i><span class="toolbar-btn-text" data-key="unlock_prompt"></span></button>
                </div>
                <div class="prompt-area">
                    <div class="textarea-container">
                        <textarea id="${module.promptId}" placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}" readonly></textarea>
                    </div>
                </div>
                <div class="modal-panel-footer">
                    <div class="action-buttons-group">
                        <p class="ia-guidance-text" data-key="info_prompt_copy">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                            {/* La clé de traduction sera insérée ici par le code */}
                        </p>
                    </div>
                </div>`;

        creationPanelHtml = `
                <div class="modal-panel-header">
                    <h3 data-key="create_file_step">2/2 Créer le fichier</h3>
                </div>
                <div class="floating-toolbar">
                    <button class="toolbar-btn fullscreen-btn" data-tooltip-key="fullscreen_prompt"><i class="fas fa-expand"></i><span class="toolbar-btn-text" data-key="fullscreen_prompt"></span></button>
                    <button class="toolbar-btn lock-btn" data-tooltip-key="lock_prompt"><i class="fas fa-lock-open"></i><span class="toolbar-btn-text" data-key="lock_prompt"></span></button>
                    ${DEBUG ? '<button class="toolbar-btn debug-json-btn" data-tooltip="JSON brut/corrigé"><i class="fas fa-bug"></i><span class="toolbar-btn-text">Mode debug</span></button>' : ''}
                </div>
                <div class="prompt-area">
                    <div class="textarea-container">
                        <textarea id="${module.jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                    </div>
                </div>
                <div class="modal-panel-footer">
                    <div class="action-buttons-group generation-button-group" id="generation-button-group-${moduleKey}">
                        <button id="${module.createBtnId}" class="action-btn primary-btn">${translations.generate_h5p}</button>
                    </div>
                </div>`;
    } else { // Moodle/Éléa
        let promptId = '', jsonInputId = '', createBtnId = '', createBtnText = '';
        if (moduleKey === 'test_elea') {
            promptId = 'test_eleaResultat';
            jsonInputId = 'xmlEleaMoodleInput';
            createBtnId = 'createXmlEleaMoodle';
            createBtnText = translations.generate_xml_file;
        } else if (moduleKey === 'glossaireXml') {
            promptId = 'glossaireXmlResultat';
            jsonInputId = 'glossaireXmlJsonInput';
            createBtnId = 'createGlossaireXmlBtn';
            createBtnText = translations.generate_xml_file;
        } else if (module.promptId) {
            promptId = module.promptId;
            jsonInputId = module.jsonInputId;
            createBtnId = module.createBtnId;
            createBtnText = translations[`generate_mbz_${moduleKey.toLowerCase()}`] || "Générer Fichier MBZ";
        }

        if (promptId) {
            promptPanelHtml = `
                    <div class="modal-panel-header">
                        <h3 data-key="get_prompt_step">1/2 Obtenir le prompt</h3>
                    </div>
                    <div class="floating-toolbar">
                        <button class="toolbar-btn copy-prompt-btn" data-tooltip-key="copy_prompt"><i class="fas fa-copy"></i><span class="toolbar-btn-text" data-key="copy_prompt"></span></button>
                        <button class="toolbar-btn fullscreen-btn" data-tooltip-key="fullscreen_prompt"><i class="fas fa-expand"></i><span class="toolbar-btn-text" data-key="fullscreen_prompt"></span></button>
                        <button class="toolbar-btn lock-btn" data-tooltip-key="unlock_prompt"><i class="fas fa-lock"></i><span class="toolbar-btn-text" data-key="unlock_prompt"></span></button>
                    </div>
                    <div class="prompt-area">
                        <div class="textarea-container">
                            <textarea id="${promptId}" placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}" readonly></textarea>
                        </div>
                    </div>
                    <div class="modal-panel-footer">
                        <div class="action-buttons-group">
                            <p class="ia-guidance-text" data-key="info_prompt_copy">
                                <i class="fas fa-info-circle" aria-hidden="true"></i>
                                {/* La clé de traduction sera insérée ici par le code */}
                            </p>
                        </div>
                    </div>`;
        } else if (moduleKey === 'gift') {
            promptPanelHtml = `<textarea id="giftResultat" placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                    <div class="modal-panel-footer">
                        <div class="action-buttons-group">
                            <p class="ia-guidance-text" data-key="info_prompt_copy">
                                Ne pas coller ce prompt dans la partie droite. Copier-le avec une IA externe
                                (<a href="#" class="go-mistral">Mistral</a>, <a href="#" class="go-duck">Duck.ai</a>...)
                                pour générer un JSON à coller dans le panneau de droite.
                            </p>
                        </div>
                    </div>`;
        }

        if (jsonInputId) {
            creationPanelHtml = `
                    <div class="modal-panel-header">
                        <h3 data-key="create_file_step">2/2 Créer le fichier</h3>
                    </div>
                    <div class="floating-toolbar">
                        <button class="toolbar-btn fullscreen-btn" data-tooltip-key="fullscreen_prompt"><i class="fas fa-expand"></i><span class="toolbar-btn-text" data-key="fullscreen_prompt"></span></button>
                        <button class="toolbar-btn lock-btn" data-tooltip-key="lock_prompt"><i class="fas fa-lock-open"></i><span class="toolbar-btn-text" data-key="lock_prompt"></span></button>
                        ${DEBUG ? '<button class="toolbar-btn debug-json-btn" data-tooltip="JSON brut/corrigé"><i class="fas fa-bug"></i><span class="toolbar-btn-text">Mode debug</span></button>' : ''}
                    </div>
                    <div class="prompt-area">
                        <div class="textarea-container">
                            <textarea id="${jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                        </div>
                    </div>
                    <div class="modal-panel-footer">
                         <div class="action-buttons-group generation-button-group" id="generation-button-group-${moduleKey}">
                            <button id="${createBtnId}" class="action-btn primary-btn">${createBtnText}</button>
                        </div>
                    </div>`;
        }
    }

    sidebar.innerHTML = `
            <div class="modal-header-group">
                <div class="modal-header">
                    <div class="modal-title-container">
                        <img src="${module.image}" alt="${translations[module.name]}" class="modal-title-icon">
                        <h2 class="modal-title">${translations[module.name]}</h2>
                    </div>
                    <div class="top-controls-container">
                        <div class="action-buttons-group generation-button-group llm-selector-group">
                            <div class="llm-buttons-row">
                                <div class="main-action-button">
                                    <button id="generate-llm-${moduleKey}" class="action-btn primary-btn">${translations.generate_one_click || "Générer en un clic"}</button>
                                </div>
                                <div class="more-actions-button">
                                    <button id="model-selector-btn-${moduleKey}" class="action-btn primary-btn dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Sélectionner le modèle">
                                        <i class="fas fa-chevron-down"></i>
                                    </button>
                                </div>
                            </div>
                            <ul id="model-selector-dropdown-${moduleKey}" class="model-selector-dropdown" role="menu"></ul>
                        </div>
                    </div>
                    <div class="modal-header-actions">
                        <button class="close-btn" onclick="closeSidebar()">×</button>
                    </div>
                </div>
                <div class="tuto-controls-wrapper">
                    <div class="modal-tuto-content">
                        <p><span class="modal-description-label ${moduleLabelClass}">${moduleTypeLabel}</span> ${translations[module.description]}</p>
                    </div>
                    <div class="mode-switch-container">
                        <span class="switch-label" data-key="simple_mode">Simple</span>
                        <label class="switch"><input type="checkbox" class="mode-toggle-checkbox"><span class="slider round"></span></label>
                        <span class="switch-label" data-key="advanced_mode">Avancé</span>
                    </div>
                </div>
            </div>
            <div class="modal-main-content">
                <div class="modal-panel">${promptPanelHtml}</div>
                <div class="modal-panel">${creationPanelHtml}</div>
            </div>`;


    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
    translatePage(sidebar);

    // Accessibilité : focus trap + Escape + restauration du focus
    _sidebarA11yCleanup = setupModalAccessibility(sidebar, {
        onClose: closeSidebar,
        focusSelector: '.close-btn'
    });

    // Synchroniser les hauteurs des sections après le rendu
    requestAnimationFrame(() => syncPanelHeights(sidebar));

    // Re-synchroniser lors du resize avec debounce
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => syncPanelHeights(sidebar), 100);
    };
    window.addEventListener('resize', handleResize);
    // Stocker le handler pour le supprimer à la fermeture
    sidebar._resizeHandler = handleResize;

    setupToolbarListeners(sidebar);

    // Debug toggle button: cycle entre JSON corrigé → Diff healer → JSON brut
    if (DEBUG) {
        const debugBtn = sidebar.querySelector('.debug-json-btn');
        if (debugBtn) {
            // État initial : 'raw' si pas de données debug pour CE module, 'healed' sinon
            const hasDebugData = !!getLastDebugNotification(moduleKey)?._debugRawJson;
            let debugState = hasDebugData ? 'healed' : 'raw';

            // --- Diff récursif entre deux objets JSON ---
            const computeJsonDiff = (raw, healed, path = '') => {
                const changes = [];
                if (raw === healed) return changes;
                if (raw === null || raw === undefined || healed === null || healed === undefined
                    || typeof raw !== typeof healed || typeof raw !== 'object') {
                    if (raw !== healed) changes.push({ type: 'modified', path: path || '(racine)', oldVal: raw, newVal: healed });
                    return changes;
                }
                // Tableaux
                if (Array.isArray(raw) || Array.isArray(healed)) {
                    if (!Array.isArray(raw) || !Array.isArray(healed)) {
                        changes.push({ type: 'modified', path: path || '(racine)', oldVal: raw, newVal: healed });
                        return changes;
                    }
                    const maxLen = Math.max(raw.length, healed.length);
                    for (let i = 0; i < maxLen; i++) {
                        const childPath = path ? `${path}[${i}]` : `[${i}]`;
                        if (i >= raw.length) {
                            changes.push({ type: 'added', path: childPath, newVal: healed[i] });
                        } else if (i >= healed.length) {
                            changes.push({ type: 'removed', path: childPath, oldVal: raw[i] });
                        } else {
                            changes.push(...computeJsonDiff(raw[i], healed[i], childPath));
                        }
                    }
                    return changes;
                }
                // Objets
                const allKeys = new Set([...Object.keys(raw), ...Object.keys(healed)]);
                for (const key of allKeys) {
                    const childPath = path ? `${path}.${key}` : key;
                    if (!(key in raw)) {
                        changes.push({ type: 'added', path: childPath, newVal: healed[key] });
                    } else if (!(key in healed)) {
                        changes.push({ type: 'removed', path: childPath, oldVal: raw[key] });
                    } else if (JSON.stringify(raw[key]) !== JSON.stringify(healed[key])) {
                        if (typeof raw[key] === 'object' && typeof healed[key] === 'object'
                            && raw[key] !== null && healed[key] !== null) {
                            changes.push(...computeJsonDiff(raw[key], healed[key], childPath));
                        } else {
                            changes.push({ type: 'modified', path: childPath, oldVal: raw[key], newVal: healed[key] });
                        }
                    }
                }
                return changes;
            };

            // --- Formater une valeur pour l'affichage (entière) ---
            const formatVal = (val) => {
                if (val === null || val === undefined) return String(val);
                if (typeof val === 'string') return `"${val}"`;
                return JSON.stringify(val, null, 2);
            };

            // --- Générer le HTML du diff ---
            const renderDiffHtml = (changes) => {
                if (changes.length === 0) {
                    return '<div class="diff-empty">Aucune différence — le healer n\'a rien modifié.</div>';
                }
                const header = `<div class="diff-header">${changes.length} modification${changes.length > 1 ? 's' : ''} par le healer</div>`;
                const lines = changes.map(c => {
                    const escapePath = p => p.replace(/</g, '&lt;');
                    const escapeVal = v => formatVal(v).replace(/</g, '&lt;');
                    switch (c.type) {
                        case 'added':
                            return `<div class="diff-line diff-added"><span class="diff-symbol">+</span><span class="diff-path">${escapePath(c.path)}</span> <span class="diff-arrow">→</span> <span class="diff-val">${escapeVal(c.newVal)}</span></div>`;
                        case 'removed':
                            return `<div class="diff-line diff-removed"><span class="diff-symbol">−</span><span class="diff-path">${escapePath(c.path)}</span> <span class="diff-val">${escapeVal(c.oldVal)}</span></div>`;
                        case 'modified':
                            return `<div class="diff-block diff-modified"><div class="diff-line diff-mod-old"><span class="diff-symbol">−</span><span class="diff-path">${escapePath(c.path)}</span> <span class="diff-val diff-old">${escapeVal(c.oldVal)}</span></div><div class="diff-line diff-mod-new"><span class="diff-symbol">+</span><span class="diff-path">${escapePath(c.path)}</span> <span class="diff-val diff-new">${escapeVal(c.newVal)}</span></div></div>`;
                        default:
                            return '';
                    }
                }).join('');
                return header + lines;
            };

            // --- Mise à jour de l'apparence du bouton ---
            const updateDebugBtnAppearance = () => {
                const lastNotif = getLastDebugNotification(moduleKey);
                const span = debugBtn.querySelector('.toolbar-btn-text');
                debugBtn.classList.remove('debug-active-raw', 'debug-active-healed', 'debug-active-diff');
                if (!lastNotif || !lastNotif._debugRawJson) {
                    // Pas encore de génération : le contenu de la textarea est brut
                    if (span) span.textContent = 'JSON brut';
                    debugBtn.classList.add('debug-active-raw');
                    return;
                }
                switch (debugState) {
                    case 'healed':
                        if (span) span.textContent = 'JSON corrigé';
                        debugBtn.classList.add('debug-active-healed');
                        break;
                    case 'diff':
                        if (span) span.textContent = 'Diff healer';
                        debugBtn.classList.add('debug-active-diff');
                        break;
                    case 'raw':
                        if (span) span.textContent = 'JSON brut';
                        debugBtn.classList.add('debug-active-raw');
                        break;
                }
            };

            // État initial : toujours "JSON brut" (c'est ce qui est dans la textarea)
            updateDebugBtnAppearance();

            // Handler pour le clic : cycle healed → diff → raw → healed
            debugBtn.addEventListener('click', () => {
                const panel = debugBtn.closest('.modal-panel');
                const textarea = panel?.querySelector('textarea');
                if (!textarea) return;
                const lastNotif = getLastDebugNotification(moduleKey);
                if (!lastNotif || !lastNotif._debugRawJson) {
                    debugLog('UI', 'Debug: aucune donnée (générez d\'abord une activité)');
                    return;
                }

                // Cycle d'états
                const states = ['healed', 'diff', 'raw'];
                debugState = states[(states.indexOf(debugState) + 1) % states.length];
                updateDebugBtnAppearance();

                // Récupérer ou créer le panel diff (frère de la textarea)
                const container = textarea.parentElement;
                let diffPanel = container?.querySelector('.debug-diff-panel');
                if (!diffPanel && container) {
                    diffPanel = document.createElement('div');
                    diffPanel.className = 'debug-diff-panel';
                    container.appendChild(diffPanel);
                }

                switch (debugState) {
                    case 'healed':
                        textarea.value = JSON.stringify(lastNotif._debugHealedJson, null, 2);
                        textarea.style.display = '';
                        if (diffPanel) diffPanel.style.display = 'none';
                        break;
                    case 'diff': {
                        const changes = computeJsonDiff(lastNotif._debugRawJson, lastNotif._debugHealedJson);
                        if (diffPanel) {
                            diffPanel.innerHTML = renderDiffHtml(changes);
                            diffPanel.style.display = 'block';
                        }
                        textarea.style.display = 'none';
                        break;
                    }
                    case 'raw':
                        textarea.value = JSON.stringify(lastNotif._debugRawJson, null, 2);
                        textarea.style.display = '';
                        if (diffPanel) diffPanel.style.display = 'none';
                        break;
                }
                debugLog('UI', 'Debug state:', debugState);
            });
        }
    }

    const modeToggle = sidebar.querySelector('.mode-toggle-checkbox');
    if (modeToggle) {
        modeToggle.addEventListener('change', () => {
            const isAdvanced = sidebar.classList.toggle('advanced-view');
            // Masquer uniquement le bouton LLM du HAUT (dans .top-controls-container)
            const topLlmGroup = sidebar.querySelector('.top-controls-container .generation-button-group');
            if (topLlmGroup) {
                topLlmGroup.style.display = isAdvanced ? 'none' : 'flex';
            }
        });
    }

    if (sidebar.classList.contains('advanced-view')) {
        const topLlmGroup = sidebar.querySelector('.top-controls-container .generation-button-group');
        if (topLlmGroup) {
            topLlmGroup.style.display = 'none';
        }
    }

    updateGenerationButton(moduleKey, module);

    if (isH5P) {
        attachActivityEventListeners(moduleKey, sidebar, tileElement);
    } else {
        // Logique d'attachement des événements pour Moodle
        if (moduleKey === 'test_elea') {
            // L'événement click pour le bouton principal est maintenant géré dans updateGenerationButton
        } else if (moduleKey === 'glossaireXml') {
            document.getElementById('createGlossaireXmlBtn').addEventListener('click', async () => {
                const rawJsonInput = document.getElementById('glossaireXmlJsonInput').value;
                const jsonInput = cleanJsonInput(rawJsonInput);
                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }
                const { handleGlossaireXmlCreation } = await import('../moodle/moodle-creator.js');
                handleGlossaireXmlCreation(jsonInput);
            });
        } else if (['Millionnaire', 'Appariement', 'QCM', 'Devoir'].includes(moduleKey)) {
            const currentModule = moodleModules[moduleKey];
            document.getElementById(currentModule.createBtnId).addEventListener('click', async () => {
                const rawJsonInput = document.getElementById(currentModule.jsonInputId).value;
                const jsonInput = cleanJsonInput(rawJsonInput);
                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }
                const moodleCreator = await import('../moodle/moodle-creator.js');
                if (moduleKey === 'Millionnaire') moodleCreator.handleMillionnaireCreation(jsonInput);
                else if (moduleKey === 'Appariement') moodleCreator.handleAppariementCreation(jsonInput);
                else if (moduleKey === 'QCM') moodleCreator.handleQCMCreation(jsonInput);
                else if (moduleKey === 'Devoir') moodleCreator.handleDevoirCreation(jsonInput);
                else if (moduleKey === 'Page') moodleCreator.handlePageCreation(jsonInput, 'mbz');
            });
        }

        if (['test_elea', 'glossaireXml', 'Millionnaire', 'Appariement', 'QCM', 'Devoir', 'Page'].includes(moduleKey)) {
            attachLLMLogic(moduleKey, sidebar);
        }

        const promptIdForCopy = module.promptId || (moduleKey === 'gift' ? 'giftResultat' : (moduleKey === 'test_elea' ? 'test_eleaResultat' : (moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : (moduleKey === 'Page' ? 'pageResultat' : null))));
        if (promptIdForCopy) {
            sidebar.querySelectorAll('.go-duck').forEach(btn => btn.addEventListener('click', function () {
                copyToClipboard(promptIdForCopy, this);
                window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer');
            }));
            sidebar.querySelectorAll('.go-mistral').forEach(btn => btn.addEventListener('click', function () {
                copyToClipboard(promptIdForCopy, this);
                window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer');
            }));
        }
    }

    const promptId = module.promptId || (moduleKey === 'test_elea' ? 'test_eleaResultat' : (moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : (moduleKey === 'Page' ? 'pageResultat' : null)));
    if (promptId) {
        const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
        if (generatedPrompt) {
            const targetTextarea = document.getElementById(promptId);
            if (targetTextarea) {
                targetTextarea.value = generatedPrompt;
            }
        }
    }

    // Restaurer les données sauvegardées de la session (si présentes et contexte inchangé)
    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput'
                      : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput'
                      : module.jsonInputId;
    restoreModalDataFromSession(moduleKey, promptId, jsonInputId);
}

/**
 * Restaure le prompt et le JSON de la modale depuis sessionStorage.
 * Appelé à l'ouverture de la modale pour restaurer le travail de l'utilisateur.
 * Note: Si le contexte a changé, les données ont déjà été effacées par handleContextChange(),
 * donc rien ne sera restauré et le prompt régénéré restera tel quel.
 * @param {string} moduleKey - La clé identifiant le module.
 * @param {string} promptId - L'ID du textarea du prompt.
 * @param {string} jsonInputId - L'ID du textarea JSON.
 */
function restoreModalDataFromSession(moduleKey, promptId, jsonInputId) {
    if (!moduleKey) return;

    // Restaurer le prompt sauvegardé (peut avoir été modifié manuellement)
    const savedPrompt = sessionStorage.getItem(`${STORAGE_PREFIX}prompt_${moduleKey}`);
    if (savedPrompt && promptId) {
        const promptTextarea = document.getElementById(promptId);
        if (promptTextarea) {
            promptTextarea.value = savedPrompt;
        }
    }

    // Restaurer le JSON sauvegardé (contenu généré par LLM)
    const savedJson = sessionStorage.getItem(`${STORAGE_PREFIX}json_${moduleKey}`);
    if (savedJson && jsonInputId) {
        const jsonTextarea = document.getElementById(jsonInputId);
        if (jsonTextarea) {
            jsonTextarea.value = savedJson;
        }
    }
}

/**
 * Construit les items HTML du menu déroulant pour les formats d'export document.
 * Filtre les formats du module en excluant ceux déjà gérés (format principal, formats spéciaux).
 * @param {Array<string>} formats - Formats disponibles (ex: ["MBZ", "DOCX", "ODT", "PDF"])
 * @param {Array<string>} excludeFormats - Formats à exclure du dropdown (format principal + spéciaux)
 * @returns {string} HTML des items <li>
 */
function buildDocExportDropdownItems(formats, excludeFormats = []) {
    return (formats || [])
        .filter(f => !excludeFormats.includes(f))
        .map(fmt => {
            const type = fmt.toLowerCase();
            const key = `export_${type}`;
            return `<li><a href="#" data-export-type="${type}" data-key="${key}">${translations[key] || 'Format ' + fmt}</a></li>`;
        }).join('\n                            ');
}

/**
 * Attache les événements du menu déroulant et les gestionnaires d'export document (DOCX/ODT/PDF).
 * Gère le toggle du menu, la fermeture au clic extérieur, et les exports via document-exporter.
 * @param {HTMLElement} buttonGroup - Conteneur du groupe de boutons
 * @param {string} moduleKey - Clé du module (ex: 'Devoir', 'QCM')
 * @param {string} jsonInputId - ID du textarea contenant le JSON
 */
function setupDropdownWithDocExport(buttonGroup, moduleKey, jsonInputId) {
    const toggleBtn = document.getElementById(`more-actions-toggle-${moduleKey}`);
    const menu = document.getElementById(`more-actions-menu-${moduleKey}`);
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!buttonGroup.contains(e.target)) {
            menu.classList.remove('show');
        }
    });

    menu.querySelectorAll('a[data-export-type]').forEach(link => {
        const exportType = link.dataset.exportType;
        if (['docx', 'odt', 'pdf'].includes(exportType)) {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const rawJson = document.getElementById(jsonInputId).value;
                if (!rawJson) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    menu.classList.remove('show');
                    return;
                }
                try {
                    const cleanedJson = cleanJsonInput(rawJson);
                    const data = JSON.parse(cleanedJson);
                    const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                    if (exportType === 'docx') await exportToDOCX(moduleKey, data);
                    else if (exportType === 'odt') await exportToODT(moduleKey, data);
                    else if (exportType === 'pdf') await exportToPDF(moduleKey, data);
                } catch (error) {
                    console.error(`Erreur lors de l'export ${exportType.toUpperCase()}:`, error);
                    showNotification(translations.export_error || "Erreur lors de l'export", 'error');
                }
                menu.classList.remove('show');
            });
        }
    });
}

/**
 * Met à jour le bouton de génération dans le pied de page de la modale guidée.
 * Ajoute un menu déroulant avec les formats d'export disponibles si le module en supporte plusieurs.
 * @param {string} moduleKey - Clé du module
 * @param {Object} module - Objet de configuration du module
 */
function updateGenerationButton(moduleKey, module) {
    const buttonGroup = document.getElementById(`generation-button-group-${moduleKey}`);
    if (!buttonGroup) return;

    // Cas spécifique pour "Test (Banque de questions)"
    if (moduleKey === 'test_elea') {
        const createBtnId = 'createXmlEleaMoodle'; // Le bouton principal génère maintenant le XML
        const createBtnText = translations.generate_xml_file || "Générer le XML";

        buttonGroup.innerHTML = `
                <div class="ctx-state-package">
                    <div class="main-action-button">
                        <button id="${createBtnId}" class="action-btn primary-btn">${createBtnText}</button>
                    </div>
                    <div class="more-actions-button">
                        <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                            <li><a href="#" data-export-type="gift" data-key="export_gift">${translations.export_gift || 'Format GIFT'}</a></li>
                            <li><a href="#" data-export-type="docx" data-key="export_docx">${translations.export_docx || 'Format DOCX'}</a></li>
                            <li><a href="#" data-export-type="odt" data-key="export_odt">${translations.export_odt || 'Format ODT'}</a></li>
                            <li><a href="#" data-export-type="pdf" data-key="export_pdf">${translations.export_pdf || 'Format PDF'}</a></li>
                        </ul>
                    </div>
                </div>
            `;

        // Attacher les écouteurs d'événements
        const mainBtn = document.getElementById(createBtnId);
        const toggleBtn = document.getElementById(`more-actions-toggle-${moduleKey}`);
        const menu = document.getElementById(`more-actions-menu-${moduleKey}`);

        // Action principale : Générer XML (délégué à moodle-creator pour bénéficier du healing LaTeX)
        mainBtn.addEventListener('click', async () => {
            const jsonInput = document.getElementById('xmlEleaMoodleInput').value;
            if (!jsonInput) {
                showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                return;
            }
            const { handleTestXmlCreation } = await import('../moodle/moodle-creator.js');
            handleTestXmlCreation(jsonInput);
        });

        // Menu déroulant
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!buttonGroup.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        // Actions du menu
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const exportType = link.dataset.exportType;
                const jsonInput = document.getElementById('xmlEleaMoodleInput').value;

                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }

                try {
                    const cleanedJson = cleanJsonInput(jsonInput);
                    let data = JSON.parse(cleanedJson);
                    // Pipeline LaTeX : même healing que pour la génération XML principale
                    const { healLatexForTest } = await import('../moodle/moodle-creator.js');
                    data = healLatexForTest(data);
                    const now = new Date();
                    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                    const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;

                    const moodleFormats = await import('../moodle/moodle-formats.js');
                    if (exportType === 'gift') {
                        const giftContent = moodleFormats.generateMoodleGift(data);
                        const fileName = `banque-de-questions_caramel_${dateString}_${lang}.gift.txt`;
                        const giftBlob = new Blob([giftContent], { type: 'text/plain' });
                        downloadFile(giftContent, fileName, 'text/plain');

                        // Ajouter à la liste des notifications avec toast popup
                        addNotification({
                            type: 'gift',
                            title: translations.elea_test_gift_name || 'Banque de questions (GIFT)',
                            titleKey: 'elea_test_gift_name',
                            fileName: fileName,
                            blob: giftBlob,
                            status: 'success'
                        });
                    } else if (exportType === 'xml') {
                        const xmlContent = moodleFormats.generateMoodleXml(data);
                        const fileName = `banque-de-questions_caramel_${dateString}_${lang}.xml`;
                        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
                        downloadFile(xmlContent, fileName, 'text/xml');

                        // Ajouter à la liste des notifications avec toast popup
                        addNotification({
                            type: 'xml',
                            title: translations.elea_test_xml_name || 'Banque de questions (XML)',
                            titleKey: 'elea_test_xml_name',
                            fileName: fileName,
                            blob: xmlBlob,
                            status: 'success',
                            jsonData: data
                        });
                    } else if (['docx', 'odt', 'pdf'].includes(exportType)) {
                        const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                        if (exportType === 'docx') await exportToDOCX('test_elea', data);
                        else if (exportType === 'odt') await exportToODT('test_elea', data);
                        else if (exportType === 'pdf') await exportToPDF('test_elea', data);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la génération du ${exportType.toUpperCase()} Moodle:`, error);
                    const errorBlob = new Blob([''], { type: 'text/plain' });
                    const titleKey = exportType === 'gift' ? 'elea_test_gift_name' : 'elea_test_xml_name';
                    const title = exportType === 'gift' ? (translations.elea_test_gift_name || 'Banque de questions (GIFT)') : (translations.elea_test_xml_name || 'Banque de questions (XML)');

                    addNotification({
                        type: exportType,
                        title: title,
                        blob: errorBlob,
                        status: 'error',
                        errorMessage: error.message
                    });
                }
                menu.classList.remove('show');
            });
        });

    } else if (moduleKey === 'Page') {
        const createBtnId = 'createPageMBZ';
        const createBtnText = translations.generate_mbz_page || "Générer l'activité Page (mbz)";

        buttonGroup.innerHTML = `
                <div class="ctx-state-package">
                    <div class="main-action-button">
                        <button id="${createBtnId}" class="action-btn primary-btn">${createBtnText}</button>
                    </div>
                    <div class="more-actions-button">
                        <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                            <li><a href="#" data-export-type="html" data-key="export_html">${translations.export_html || 'Format HTML'}</a></li>
                            <li><a href="#" data-export-type="docx" data-key="export_docx">${translations.export_docx || 'Format DOCX'}</a></li>
                            <li><a href="#" data-export-type="odt" data-key="export_odt">${translations.export_odt || 'Format ODT'}</a></li>
                            <li><a href="#" data-export-type="pdf" data-key="export_pdf">${translations.export_pdf || 'Format PDF'}</a></li>
                        </ul>
                    </div>
                </div>
            `;

        const mainBtn = document.getElementById(createBtnId);
        const toggleBtn = document.getElementById(`more-actions-toggle-${moduleKey}`);
        const menu = document.getElementById(`more-actions-menu-${moduleKey}`);

        mainBtn.addEventListener('click', () => handlePageExport('mbz'));

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!buttonGroup.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const exportType = link.dataset.exportType;
                handlePageExport(exportType);
                menu.classList.remove('show');
            });
        });

        async function handlePageExport(exportType) {
            const jsonInput = document.getElementById('pageJsonInput').value;
            if (!jsonInput) {
                showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                return;
            }
            if (['docx', 'odt', 'pdf'].includes(exportType)) {
                try {
                    const cleanedJson = cleanJsonInput(jsonInput);
                    const data = JSON.parse(cleanedJson);
                    const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                    if (exportType === 'docx') await exportToDOCX('Page', data);
                    else if (exportType === 'odt') await exportToODT('Page', data);
                    else if (exportType === 'pdf') await exportToPDF('Page', data);
                } catch (error) {
                    console.error(`Erreur lors de l'export ${exportType.toUpperCase()}:`, error);
                    showNotification(translations.export_error || "Erreur lors de l'export", 'error');
                }
            } else {
                const { handlePageCreation } = await import('../moodle/moodle-creator.js');
                handlePageCreation(jsonInput, exportType);
            }
        }
    } else {
        // Comportement par défaut pour les autres modules
        const isH5P = !!h5pModules[moduleKey];
        const btnId = module.createBtnId || (moduleKey === 'glossaireXml' ? 'createGlossaireXmlBtn' : null);
        if (btnId) {
            let btnText = translations.generate_file;
            if (isH5P) {
                btnText = translations.generate_h5p;

                // Pour les modules H5P, ajouter un menu déroulant avec les exports DOCX/ODT/PDF
                buttonGroup.innerHTML = `
                    <div class="ctx-state-package">
                        <div class="main-action-button">
                            <button id="${btnId}" class="action-btn primary-btn">${btnText}</button>
                        </div>
                        <div class="more-actions-button">
                            <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                                <li><a href="#" data-export-type="docx" data-key="export_docx">${translations.export_docx || 'Format DOCX'}</a></li>
                                <li><a href="#" data-export-type="odt" data-key="export_odt">${translations.export_odt || 'Format ODT'}</a></li>
                                <li><a href="#" data-export-type="pdf" data-key="export_pdf">${translations.export_pdf || 'Format PDF'}</a></li>
                            </ul>
                        </div>
                    </div>
                `;

                // Attacher les écouteurs d'événements pour le menu déroulant H5P
                const toggleBtn = document.getElementById(`more-actions-toggle-${moduleKey}`);
                const menu = document.getElementById(`more-actions-menu-${moduleKey}`);

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', (e) => {
                    if (!buttonGroup.contains(e.target)) {
                        menu.classList.remove('show');
                    }
                });

                // Actions du menu - exports alternatifs
                menu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const exportType = link.dataset.exportType;
                        const jsonInputId = module.jsonInputId;
                        const jsonInput = document.getElementById(jsonInputId).value;

                        if (!jsonInput) {
                            showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                            return;
                        }

                        try {
                            const cleanedJson = cleanJsonInput(jsonInput);
                            const data = JSON.parse(cleanedJson);

                            // Appeler la fonction d'export appropriée (chargement dynamique)
                            const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                            if (exportType === 'docx') {
                                await exportToDOCX(moduleKey, data);
                            } else if (exportType === 'odt') {
                                await exportToODT(moduleKey, data);
                            } else if (exportType === 'pdf') {
                                await exportToPDF(moduleKey, data);
                            }
                        } catch (error) {
                            console.error(`Erreur lors de l'export ${exportType.toUpperCase()}:`, error);
                            showNotification(translations.export_error || 'Erreur lors de l\'export', 'error');
                        }

                        menu.classList.remove('show');
                    });
                });

            } else if (moduleKey === 'glossaireXml') {
                btnText = translations.generate_xml_file;
                const glossaireDocItems = buildDocExportDropdownItems(module.formats || [], ['XML']);
                if (glossaireDocItems) {
                    buttonGroup.innerHTML = `
                        <div class="ctx-state-package">
                            <div class="main-action-button">
                                <button id="${btnId}" class="action-btn primary-btn">${btnText}</button>
                            </div>
                            <div class="more-actions-button">
                                <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                                    ${glossaireDocItems}
                                </ul>
                            </div>
                        </div>
                    `;
                    setupDropdownWithDocExport(buttonGroup, moduleKey, 'glossaireXmlJsonInput');
                } else {
                    buttonGroup.innerHTML = `<div class="ctx-state-package"><button id="${btnId}" class="action-btn primary-btn">${btnText}</button></div>`;
                }
            } else if (moodleModules[moduleKey]) {
                btnText = translations[`generate_mbz_${moduleKey.toLowerCase()}`] || "Générer Fichier MBZ";
                const moodleDocItems = buildDocExportDropdownItems(module.formats || [], ['MBZ']);
                if (moodleDocItems) {
                    buttonGroup.innerHTML = `
                        <div class="ctx-state-package">
                            <div class="main-action-button">
                                <button id="${btnId}" class="action-btn primary-btn">${btnText}</button>
                            </div>
                            <div class="more-actions-button">
                                <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                                    ${moodleDocItems}
                                </ul>
                            </div>
                        </div>
                    `;
                    setupDropdownWithDocExport(buttonGroup, moduleKey, module.jsonInputId);
                } else {
                    buttonGroup.innerHTML = `<div class="ctx-state-package"><button id="${btnId}" class="action-btn primary-btn">${btnText}</button></div>`;
                }
            } else {
                buttonGroup.innerHTML = `<div class="ctx-state-package"><button id="${btnId}" class="action-btn primary-btn">${btnText}</button></div>`;
            }
        }
    }
    translatePage(buttonGroup);

    // Bouton contextuel en mode guidé (split LLM / packaging)
    attachContextualBottomButton(moduleKey, module, buttonGroup);
}

// =======================================================================
// 8b. BOUTON CONTEXTUEL MODE GUIDÉ
// =======================================================================

/**
 * Ajoute un bouton LLM contextuel dans le footer du panel droit en mode guidé.
 * En mode guidé :
 * - Si le textarea JSON est vide ou ne contient pas de JSON valide → split button "Générer en un clic" + sélecteur modèle
 * - Si le textarea JSON contient du JSON valide → bouton simple "Générer l'activité" (packaging direct)
 * @param {string} moduleKey - Clé du module
 * @param {Object} module - Objet de configuration du module
 * @param {HTMLElement} buttonGroup - Conteneur du groupe de boutons
 */
function attachContextualBottomButton(moduleKey, module, buttonGroup) {
    // Déterminer les IDs critiques
    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput'
                      : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput'
                      : module.jsonInputId;
    const originalBtnId = (moduleKey === 'test_elea') ? 'createXmlEleaMoodle'
                        : (moduleKey === 'glossaireXml') ? 'createGlossaireXmlBtn'
                        : module.createBtnId;
    const promptId = (moduleKey === 'test_elea') ? 'test_eleaResultat'
                   : (moduleKey === 'glossaireXml') ? 'glossaireXmlResultat'
                   : module.promptId;

    // Modèle LLM sélectionné (closure)
    let selectedModel = ACTIVITY_MODEL_OVERRIDES[moduleKey] || DEFAULT_MODEL;

    // --- Créer le wrapper LLM (État 1 : pas de JSON valide) ---
    const llmWrapper = document.createElement('div');
    llmWrapper.className = 'ctx-state-llm';
    llmWrapper.innerHTML = `
        <div class="llm-buttons-row">
            <div class="main-action-button">
                <button id="ctx-llm-btn-${moduleKey}" class="action-btn primary-btn">
                    ${translations.generate_one_click || "Générer en un clic"}
                </button>
            </div>
            <div class="more-actions-button">
                <button id="ctx-model-selector-btn-${moduleKey}"
                    class="action-btn primary-btn dropdown-toggle"
                    aria-haspopup="true" aria-expanded="false"
                    aria-label="${translations.llm_model_select || 'Sélectionner le modèle'}">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
        </div>
        <ul id="model-selector-dropdown-ctx-${moduleKey}"
            class="model-selector-dropdown ctx-model-dropdown"
            role="menu"></ul>
    `;
    buttonGroup.appendChild(llmWrapper);

    // --- Peupler le dropdown modèle ---
    // populateModelSelector cherche getElementById('model-selector-dropdown-' + key)
    // On passe 'ctx-' + moduleKey → cherche 'model-selector-dropdown-ctx-{moduleKey}' ✓
    populateModelSelector('ctx-' + moduleKey, AVAILABLE_MODELS, (modelId) => {
        selectedModel = modelId;
        closeCtxDropdown();
    }, selectedModel, translations);

    // --- Logique du dropdown modèle ---
    const modelSelectorBtn = document.getElementById(`ctx-model-selector-btn-${moduleKey}`);
    const modelDropdown = document.getElementById(`model-selector-dropdown-ctx-${moduleKey}`);

    function closeCtxDropdown() {
        if (modelDropdown) {
            modelDropdown.classList.remove('show');
            modelSelectorBtn?.setAttribute('aria-expanded', 'false');
            sidebar.classList.remove('menu-open');
        }
    }

    if (modelSelectorBtn && modelDropdown) {
        modelSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = modelDropdown.classList.toggle('show');
            modelSelectorBtn.setAttribute('aria-expanded', isShown);
            sidebar.classList.toggle('menu-open', isShown);
            if (isShown) {
                const target = modelDropdown.querySelector('li.selected') || modelDropdown.querySelector('li');
                if (target) target.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!modelSelectorBtn.contains(e.target) && !modelDropdown.contains(e.target)) {
                if (modelDropdown.classList.contains('show')) {
                    closeCtxDropdown();
                }
            }
        });
    }

    // --- Logique du bouton LLM (génération IA) ---
    const ctxLlmBtn = document.getElementById(`ctx-llm-btn-${moduleKey}`);
    if (ctxLlmBtn) {
        ctxLlmBtn.addEventListener('click', async () => {
            const promptTextarea = document.getElementById(promptId);
            const prompt = promptTextarea?.value;

            if (!prompt) {
                showNotification(translations.error_field_empty || 'Veuillez d\'abord générer un prompt.', 'error');
                return;
            }

            const jsonInputTarget = document.getElementById(jsonInputId);

            // Nettoyage du champ JSON avant génération
            if (jsonInputTarget) jsonInputTarget.value = '';
            sessionStorage.removeItem(`${STORAGE_PREFIX}json_${moduleKey}`);

            // Tracking de performance (mode debug uniquement)
            if (DEBUG) import('../core/perf-tracker.js').then(perf => {
                perf.startSession(moduleKey, 'llm');
                perf.markStart('preload', 'Préchargement anticipé (fire & forget)');
            }).catch(() => {});

            startCaramelAnimation();
            preloadForPostGeneration(moduleKey);

            try {
                const activityMeta = {
                    moduleKey,
                    category: (module && Array.isArray(module.categories))
                        ? (module.categories.includes('h5p') ? 'h5p' : (module.categories.includes('elea') ? 'elea' : null))
                        : null,
                    nameKey: (module && module.name) ? module.name : null,
                    englishName: (module && module.englishName) ? module.englishName : null,
                    machineName: (module && module.machineName) ? module.machineName : null,
                    displayName: (module && module.name && translations && translations[module.name])
                        ? translations[module.name]
                        : (module && module.englishName)
                            ? module.englishName
                            : (module && module.machineName)
                                ? module.machineName
                                : moduleKey
                };
                const caramelVersion = getCaramelVersionFromFooter();
                if (caramelVersion) activityMeta.caramelVersion = caramelVersion;

                const content = await generateH5PWithLLM(prompt, selectedModel, activityMeta);
                if (content) {
                    if (jsonInputTarget) {
                        jsonInputTarget.value = content;
                        // Déclencher input pour mettre à jour l'état du bouton contextuel
                        jsonInputTarget.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    // Déclencher le packaging via le bouton original
                    // La sidebar reste ouverte en arrière-plan (modale résultat par-dessus)
                    const createBtn = document.getElementById(originalBtnId);
                    if (createBtn) createBtn.click();
                } else {
                    if (jsonInputTarget) jsonInputTarget.value = translations.generation_failed_empty || '';
                    showNotification(translations.generation_failed_empty || 'La génération a échoué.', 'error');
                    stopCaramelAnimation();
                }
            } catch (error) {
                console.error("Erreur lors de la génération contextuelle avec le LLM:", error);
                const tmpl = translations.generation_failed_llm || 'La génération a échoué. Cause : {errorMessage}';
                const errorMessage = tmpl.replace('{errorMessage}', error.message);
                showNotification(errorMessage, 'error');
                if (jsonInputTarget) jsonInputTarget.value = errorMessage;
                stopCaramelAnimation();
            }
        });
    }

    // --- Détection JSON valide ---
    function isValidJson(text) {
        const trimmed = cleanJsonInput(text);
        if (!trimmed) return false;
        const first = trimmed[0], last = trimmed[trimmed.length - 1];
        if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) return false;
        try { JSON.parse(trimmed); return true; } catch { return false; }
    }

    // --- Mise à jour de l'état contextuel ---
    // Les classes sont toujours évaluées (pas de vérification du mode).
    // Le CSS gère : affichage (grid stacking), arrondi, masquage flèche export.
    // Le JS gère uniquement : classes d'état + texte du bouton.
    const packageWrapper = buttonGroup.querySelector('.ctx-state-package');
    const packageMainBtn = packageWrapper?.querySelector('.main-action-button .action-btn, .action-btn:first-child');
    const packageOriginalText = packageMainBtn?.textContent || '';
    const generateActivityText = translations.generate_activity || "Générer l'activité";

    function updateCtxState() {
        const value = document.getElementById(jsonInputId)?.value || '';
        const isGuided = sidebar.classList.contains('advanced-view');

        if (isValidJson(value)) {
            buttonGroup.classList.remove('ctx-state--empty');
            buttonGroup.classList.add('ctx-state--json');
        } else {
            buttonGroup.classList.remove('ctx-state--json');
            buttonGroup.classList.add('ctx-state--empty');
        }

        // En mode guidé : texte "Générer l'activité" (le CSS masque la flèche et gère l'arrondi)
        if (packageMainBtn) {
            packageMainBtn.textContent = isGuided ? generateActivityText : packageOriginalText;
        }
    }

    // --- Listener debounced sur le textarea JSON ---
    let ctxDebounceTimer;
    const jsonTextarea = document.getElementById(jsonInputId);
    if (jsonTextarea) {
        // Placeholder d'aide en mode guidé
        const guidedPlaceholder = translations.guided_mode_json_placeholder
            || "Cliquez sur « Générer en un clic » ci-dessous pour créer le contenu automatiquement, ou collez ici le JSON obtenu sur une autre IA.";
        jsonTextarea.setAttribute('data-default-placeholder', jsonTextarea.placeholder);
        jsonTextarea.setAttribute('data-guided-placeholder', guidedPlaceholder);
        // Mettre à jour le placeholder selon le mode
        function updatePlaceholder() {
            jsonTextarea.placeholder = sidebar.classList.contains('advanced-view')
                ? guidedPlaceholder
                : (jsonTextarea.getAttribute('data-default-placeholder') || '');
        }
        updatePlaceholder();
        // Observer les changements de classe sur la sidebar pour basculer placeholder + texte bouton
        const placeholderObserver = new MutationObserver(() => {
            updatePlaceholder();
            updateCtxState();
        });
        placeholderObserver.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

        jsonTextarea.addEventListener('input', () => {
            clearTimeout(ctxDebounceTimer);
            ctxDebounceTimer = setTimeout(updateCtxState, 300);
        });
    }

    // --- Listener sur le prompt (panneau gauche) : vider le JSON si modifié ---
    const promptTextareaEl = document.getElementById(promptId);
    if (promptTextareaEl) {
        let promptDebounceTimer;
        promptTextareaEl.addEventListener('input', () => {
            clearTimeout(promptDebounceTimer);
            promptDebounceTimer = setTimeout(() => {
                // En mode guidé, le prompt a changé → l'ancien JSON n'est plus pertinent
                if (sidebar.classList.contains('advanced-view') && jsonTextarea) {
                    jsonTextarea.value = '';
                    sessionStorage.removeItem(`${STORAGE_PREFIX}json_${moduleKey}`);
                    updateCtxState();
                }
            }, 300);
        });
    }

    // --- Évaluation initiale (après restoreModalDataFromSession) ---
    requestAnimationFrame(() => updateCtxState());

    // --- Exposer updateCtxState pour réutilisation externe ---
    buttonGroup._ctxUpdate = updateCtxState;
}

function attachActivityEventListeners(moduleKey, container, tile) {
    const module = h5pModules[moduleKey]; // H5P-specific logic here

    // Boutons IA
    container.querySelectorAll('.go-duck').forEach(link => link.addEventListener('click', function (e) {
        e.preventDefault();
        copyToClipboard(module.promptId, this);
        window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer');
    }));
    container.querySelectorAll('.go-mistral').forEach(link => link.addEventListener('click', function (e) {
        e.preventDefault();
        copyToClipboard(module.promptId, this);
        window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer');
    }));

    // Bouton de création H5P
    const createBtn = container.querySelector(`#${module.createBtnId}`);
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            // Démarrer le tracking de performance (mode debug uniquement, zéro overhead sinon)
            if (DEBUG) import('../core/perf-tracker.js').then(perf => {
                perf.startSession(moduleKey, 'manual');
            }).catch(() => {});

            // Précharger les assets h5p-libs dès le clic (fire & forget)
            // L'utilisateur verra ensuite la modale de résultat avec Visualiser/Télécharger,
            // ce qui laisse quelques secondes pour que le cache se remplisse
            import('../h5p/h5p-prefetch.js')
                .then(m => m.prefetchH5PLibraries(moduleKey))
                .catch(() => {});

            const rawJsonInput = container.querySelector(`#${module.jsonInputId}`).value;
            const jsonInput = cleanJsonInput(rawJsonInput);
            if (!jsonInput) {
                showNotification(translations.error_paste_ia_content || 'Veuillez coller le contenu généré par l\'IA.', 'error');
                return;
            }
            const { handleH5PCreation } = await import('../h5p/h5p-creator.js');
            handleH5PCreation(moduleKey, jsonInput);
        });
    }

    // Logique LLM (H5P seulement pour l'instant)
    attachLLMLogic(moduleKey, container);
}

function attachLLMLogic(moduleKey, container) {
    const llmBtn = container.querySelector(`#generate-llm-${moduleKey}`);
    if (!llmBtn) return;

    let selectedModel = ACTIVITY_MODEL_OVERRIDES[moduleKey] || DEFAULT_MODEL;
    const modelSelectorBtn = container.querySelector(`#model-selector-btn-${moduleKey}`);
    const modelDropdown = container.querySelector(`#model-selector-dropdown-${moduleKey}`);
    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput' : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput' : module.jsonInputId;

    if (modelSelectorBtn && modelDropdown) {
        let dropdownHandlersAttached = false;

        const resetDropdownSizing = () => {
            modelDropdown.style.maxHeight = '';
            modelDropdown.classList.remove('force-wide');
        };

        const adjustDropdownToViewport = () => {
            if (!modelDropdown.classList.contains('show')) return;

            resetDropdownSizing();
            requestAnimationFrame(() => {
                if (!modelDropdown.classList.contains('show')) return;
                const rect = modelDropdown.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

                if (rect.bottom > viewportHeight - 8) {
                    const availableSpace = Math.max(viewportHeight - rect.top - 12, 140);
                    modelDropdown.style.maxHeight = `${availableSpace}px`;
                    modelDropdown.classList.add('force-wide');
                }
            });
        };

        const dropdownVisibilityHandler = () => adjustDropdownToViewport();

        const addDropdownHandlers = () => {
            if (dropdownHandlersAttached) return;
            window.addEventListener('resize', dropdownVisibilityHandler);
            dropdownHandlersAttached = true;
        };

        const removeDropdownHandlers = () => {
            if (!dropdownHandlersAttached) return;
            window.removeEventListener('resize', dropdownVisibilityHandler);
            dropdownHandlersAttached = false;
        };

        const closeDropdown = () => {
            modelDropdown.classList.remove('show');
            modelSelectorBtn.setAttribute('aria-expanded', 'false');
            sidebar.classList.remove('menu-open');
            removeDropdownHandlers();
            resetDropdownSizing();
        };

        populateModelSelector(moduleKey, AVAILABLE_MODELS, (modelId) => {
            selectedModel = modelId;
            closeDropdown();
        }, selectedModel, translations);

        modelSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyShown = modelDropdown.classList.toggle('show');
            modelSelectorBtn.setAttribute('aria-expanded', isCurrentlyShown);
            sidebar.classList.toggle('menu-open', isCurrentlyShown);

            if (isCurrentlyShown) {
                adjustDropdownToViewport();
                addDropdownHandlers();
                // Focus sur l'item sélectionné ou le premier item
                const target = modelDropdown.querySelector('li.selected') || modelDropdown.querySelector('li');
                if (target) target.focus();
            } else {
                removeDropdownHandlers();
                resetDropdownSizing();
            }
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!modelSelectorBtn.contains(e.target) && !modelDropdown.contains(e.target)) {
                if (modelDropdown.classList.contains('show')) {
                    closeDropdown();
                }
            }
        });
    }

    llmBtn.addEventListener('click', async () => {
        const promptId = (moduleKey === 'test_elea') ? 'test_eleaResultat' : (moduleKey === 'glossaireXml') ? 'glossaireXmlResultat' : module.promptId;
        const promptTextarea = document.getElementById(promptId);
        const prompt = promptTextarea.value;

        if (!prompt) {
            showNotification(translations.error_field_empty || 'Veuillez d\'abord générer un prompt.', 'error');
            return;
        }

        const jsonInputTarget = container.querySelector(`#${jsonInputId}`);

        // Nettoyage du champ JSON avant génération (évite pollution par anciennes données)
        if (jsonInputTarget) {
            jsonInputTarget.value = '';
        }
        sessionStorage.removeItem(`${STORAGE_PREFIX}json_${moduleKey}`);

        const processorDiv = jsonInputTarget.closest('.h5p-processor');

        // Démarrer le tracking de performance (mode debug uniquement, zéro overhead sinon)
        if (DEBUG) import('../core/perf-tracker.js').then(perf => {
            perf.startSession(moduleKey, 'llm');
            perf.markStart('preload', 'Préchargement anticipé (fire & forget)');
        }).catch(() => {});

        startCaramelAnimation();

        // Préchargement anticipé pendant l'attente de l'IA (fire & forget)
        preloadForPostGeneration(moduleKey);

        try {
            const activityMeta = {
                moduleKey,
                category: (module && Array.isArray(module.categories))
                    ? (module.categories.includes('h5p') ? 'h5p' : (module.categories.includes('elea') ? 'elea' : null))
                    : null,
                nameKey: (module && module.name) ? module.name : null,
                englishName: (module && module.englishName) ? module.englishName : null,
                machineName: (module && module.machineName) ? module.machineName : null,
                displayName: (module && module.name && translations && translations[module.name])
                    ? translations[module.name]
                    : (module && module.englishName)
                        ? module.englishName
                        : (module && module.machineName)
                            ? module.machineName
                            : moduleKey
            };
            // Ajoute la version indiquée dans le footer pour l'export vers n8n.
            const caramelVersion = getCaramelVersionFromFooter();
            if (caramelVersion) {
                activityMeta.caramelVersion = caramelVersion;
            }
            const content = await generateH5PWithLLM(prompt, selectedModel, activityMeta);
            if (content) {
                jsonInputTarget.value = content;

                // Déclencher le téléchargement automatiquement
                if (moduleKey === 'test_elea') {
                    const createBtn = document.getElementById('createXmlEleaMoodle');
                    if (createBtn) {
                        createBtn.click();
                    }
                } else {
                    let createBtnId;
                    if (moduleKey === 'glossaireXml') {
                        createBtnId = 'createGlossaireXmlBtn';
                    } else if (module.createBtnId) {
                        createBtnId = module.createBtnId;
                    }

                    if (createBtnId) {
                        const createBtn = document.getElementById(createBtnId);
                        if (createBtn) {
                            createBtn.click();
                        }
                    }
                }

                // Fermeture de la sidebar (la modale de résultat prend le relais)
                closeSidebar();
            } else {
                jsonInputTarget.value = translations.generation_failed_empty;
                showNotification(translations.generation_failed_empty, 'error');
                stopCaramelAnimation();
            }
        } catch (error) {
            console.error("Erreur lors de la génération avec le LLM:", error);
            const tmpl = translations.generation_failed_llm || 'La génération a échoué. Cause : {errorMessage}';
            const errorMessage = tmpl.replace('{errorMessage}', error.message);
            showNotification(errorMessage, 'error');
            jsonInputTarget.value = errorMessage;
            stopCaramelAnimation();
        }
    });
}


// =======================================================================
// 9. PRÉCHARGEMENT ANTICIPÉ POST-GÉNÉRATION
// =======================================================================

/**
 * Précharge les modules et bibliothèques nécessaires après la génération IA.
 * Appelé dès le début de la génération pour exploiter le temps d'attente (10-60s).
 * Tous les chargements sont fire & forget (les erreurs sont silencieuses).
 * @param {string} moduleKey - La clé du module en cours de génération
 */
function preloadForPostGeneration(moduleKey) {
    const isH5P = !!h5pModules[moduleKey];
    const isMoodle = !!moodleModules[moduleKey];

    // Précharger le créateur approprié (déclenche aussi le chargement de ses dépendances internes)
    if (isH5P) {
        // h5p-creator.js charge client-zip via son IIFE au moment de l'import
        import('../h5p/h5p-creator.js').catch(() => {});
    }
    if (isMoodle || moduleKey === 'test_elea' || moduleKey === 'glossaireXml') {
        import('../moodle/moodle-creator.js').catch(() => {});
        import('../core/lib-loader.js').then(m => m.loadMoodleLibs()).catch(() => {});
    }

    // Précharger l'exportateur de documents (très probable que l'utilisateur exporte après)
    import('../export/document-exporter.js').catch(() => {});

    // Précharger DOMPurify (utilisé pour la sanitization dans les exports)
    import('../core/lib-loader.js').then(m => m.loadDOMPurify()).catch(() => {});

    // Précharger les modules de l'éditeur JSON visuel et de la prévisualisation
    // (l'utilisateur ouvre souvent la modale de visualisation/édition après la génération)
    import('../editor/index.js').catch(() => {});
    import('../editor/content-detector.js').catch(() => {});
    import('../editor/editor-core.js').catch(() => {});
    import('../editor/field-renderers.js').catch(() => {});
    import('../editor/array-manager.js').catch(() => {});
    import('../editor/validators.js').catch(() => {});

    // Précharger le gestionnaire H5P ou les simulateurs Moodle selon le type
    if (isH5P) {
        import('../h5p/h5p-manager.js').catch(() => {});
        import('../core/lib-loader.js').then(m => m.loadJSZip()).catch(() => {});

        // Précharger H5PStandalone (player) pour que ensureH5PLibLoaded() soit instantané
        // lors du premier renderPreview() — loadH5pLibs est idempotente (singleton via loadPromises)
        import('../core/lib-loader.js').then(m => m.loadH5pLibs()).catch(() => {});

        // Précharger le processeur spécifique à cette activité pour accélérer
        // le premier save éditeur (le cache module du navigateur sera réutilisé
        // quand loadProcessor() appellera import() dans processors/index.js)
        const processorKey = (moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') ? 'QuizSet' : moduleKey;
        import(`../h5p/processors/${processorKey}.js`).catch(() => {});

        // Précharger les assets statiques h5p-libs (JS, CSS, library.json) pour que
        // H5PStandalone les trouve déjà en cache HTTP lors du rendu de la prévisualisation
        import('../h5p/h5p-prefetch.js')
            .then(m => m.prefetchH5PLibraries(moduleKey))
            .catch(() => {});
    }
    if (isMoodle || moduleKey === 'test_elea' || moduleKey === 'glossaireXml') {
        import('../simulators.js').catch(() => {});
    }
}

// =======================================================================
// 10. ANIMATION DE GÉNÉRATION "CARAMEL"
// =======================================================================
let recipeInterval;

function startCaramelAnimation() {
    const overlay = document.getElementById('caramel-animation-overlay');
    const recipeSteps = document.getElementById('recipe-steps');
    const marmiteContent = document.querySelector('.marmite-content');
    overlay.style.display = 'flex';

    const steps = [
        "caramel_animation_step_1",
        "caramel_animation_step_2",
        "caramel_animation_step_3",
        "caramel_animation_step_4",
        "caramel_animation_step_5",
        "caramel_animation_step_6",
        "caramel_animation_step_7",
        "caramel_animation_step_8",
        "caramel_animation_step_9",
        "caramel_animation_step_10",
        "caramel_animation_step_11"
    ];

    let currentStep = 0;
    recipeSteps.textContent = translations[steps[currentStep]] || steps[currentStep];
    recipeInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;
        recipeSteps.textContent = translations[steps[currentStep]] || steps[currentStep];
    }, 2000);

    // Reset animation
    marmiteContent.style.animation = 'none';
    marmiteContent.offsetHeight; /* trigger reflow */
    marmiteContent.style.animation = null;
    marmiteContent.style.animation = 'fillMarmite 22s linear forwards';
}

function stopCaramelAnimation() {
    const overlay = document.getElementById('caramel-animation-overlay');
    clearInterval(recipeInterval);
    if (overlay) overlay.style.display = 'none';
}

// =======================================================================
// 10. MODALE DE RÉSULTAT POST-GÉNÉRATION
// =======================================================================

let generationResultData = null;
/** Promesse de capture de grille (Crossword/FindTheWords), résolue quand les images sont prêtes */
let _gridCapturePromise = null;
/** Cleanup de l'accessibilité modale (focus trap + restauration) */
let _generationModalA11yCleanup = null;

/**
 * Affiche la modale de résultat après la génération d'une activité.
 * @param {CustomEvent} e - Événement generation:complete avec les détails
 */
function showGenerationResult(e) {
    // Arrêter l'animation de génération maintenant que la modale est prête.
    // C'est ici et non dans le finally du handler LLM, car la création H5P/Moodle
    // est asynchrone (fire & forget via click()) et se termine APRÈS le finally.
    // Sans ça, l'utilisateur voit un écran vide entre la fin de l'animation et la modale.
    stopCaramelAnimation();

    const { notificationId, blob, fileName, titleKey, moduleKey } = e.detail;
    generationResultData = { notificationId, blob, fileName, titleKey, moduleKey };

    const modal = document.getElementById('generation-result-modal');
    if (!modal) return;

    // Remplir le nom de l'activité
    const nameEl = modal.querySelector('.generation-result-modal__name');
    if (nameEl) {
        nameEl.textContent = translations[titleKey] || moduleKey || '';
    }

    // Remplir l'icône de l'activité
    const icon = modal.querySelector('.generation-result-modal__icon');
    if (icon) {
        const moduleDef = modulesByTitleKey.get(titleKey)?.mod;
        if (moduleDef && moduleDef.image) {
            icon.src = moduleDef.image;
            icon.alt = translations[titleKey] || '';
            icon.style.display = 'block';
        } else {
            icon.style.display = 'none';
        }
    }

    // Mettre à jour le label du bouton principal avec le format natif
    const downloadLabel = modal.querySelector('.generation-result-modal__download-label');
    if (downloadLabel) {
        const ext = fileName ? fileName.split('.').pop().toUpperCase() : '';
        const formatLabel = (translations.result_download_format || 'Télécharger en {format}').replace('{format}', ext);
        downloadLabel.textContent = formatLabel;
    }

    // Peupler le dropdown avec les formats d'export document (DOCX/ODT/PDF)
    const wrapper = modal.querySelector('.generation-result-modal__download-wrapper');
    const dropdown = modal.querySelector('.generation-result-modal__dropdown');
    if (wrapper && dropdown) {
        // Trouver la définition du module pour connaître les formats supportés
        const resolvedKey = moduleKey || modulesByTitleKey.get(titleKey)?.key || null;
        const moduleDef2 = resolvedKey ? allModules[resolvedKey] : null;
        const formats = moduleDef2 ? moduleDef2.formats : [];
        // Formats natifs à exclure du dropdown (déjà gérés par le bouton principal)
        const nativeExt = fileName ? fileName.split('.').pop().toUpperCase() : '';
        const excludeFormats = [nativeExt, 'GIFT', 'HTML'];
        const docFormats = formats.filter(f => !excludeFormats.includes(f));

        if (docFormats.length > 0) {
            const iconMap = { 'DOCX': 'fa-file-word', 'ODT': 'fa-file-alt', 'PDF': 'fa-file-pdf' };
            dropdown.innerHTML = docFormats.map(fmt => {
                const iconClass = iconMap[fmt] || 'fa-file';
                const label = translations[`export_${fmt.toLowerCase()}`] || `Format ${fmt}`;
                return `<button class="generation-result-modal__dropdown-item" data-export-format="${fmt}">
                    <i class="fas ${iconClass}"></i> ${label}
                </button>`;
            }).join('');
            wrapper.classList.add('has-dropdown');
            dropdown.classList.add('hidden');
        } else {
            dropdown.innerHTML = '';
            wrapper.classList.remove('has-dropdown');
        }
    }

    // Précharger les modules de visualisation/édition pendant que l'utilisateur lit la modale
    // (fire & forget, complète le préchargement lancé pendant la génération)
    import('../editor/index.js').catch(() => {});
    import('../editor/content-detector.js').catch(() => {});
    const isH5PResult = fileName && fileName.endsWith('.h5p');
    if (isH5PResult) {
        import('../h5p/h5p-manager.js').catch(() => {});
        import('../core/lib-loader.js').then(m => m.loadJSZip()).catch(() => {});

        // Lancer la génération de grille en arrière-plan (standalone, sans H5P)
        if (moduleKey === 'Crossword' || moduleKey === 'FindTheWords') {
            const notif = getNotificationById(notificationId);
            const jsonData = notif?.originalJsonData || notif?.jsonData;
            _gridCapturePromise = _captureGridInBackground(moduleKey, jsonData);
        }
    } else {
        import('../simulators.js').catch(() => {});
    }

    // Afficher la modale avec animation
    modal.classList.remove('hidden');
    modal.classList.add('entering');
    setTimeout(() => {
        modal.classList.remove('entering');
    }, 300);

    // Accessibilité : focus trap + Escape + restauration du focus
    _generationModalA11yCleanup = setupModalAccessibility(modal, {
        onClose: () => closeGenerationResultModal(true),
        focusSelector: '[data-action="download"]'
    });
}

/**
 * Génère les images de grille en arrière-plan (standalone, sans H5P).
 * Fonctionne pour Crossword (placement déterministe) et FindTheWords (placement aléatoire).
 */
async function _captureGridInBackground(moduleKey, jsonData) {
    if (moduleKey === 'Crossword' && jsonData?.words?.length > 0) {
        try {
            const { generateCrosswordGridImages } = await import('../renderers/crossword-grid-generator.js');
            return await generateCrosswordGridImages(jsonData.words, jsonData.theme);
        } catch (err) {
            console.warn('[GridCapture] Génération de grille Crossword échouée, export sans image:', err);
        }
    }
    if (moduleKey === 'FindTheWords' && jsonData?.wordList) {
        try {
            const { generateFindTheWordsGridImages } = await import('../renderers/find-the-words-grid-generator.js');
            return await generateFindTheWordsGridImages(jsonData.wordList);
        } catch (err) {
            console.warn('[GridCapture] Génération de grille FindTheWords échouée, export sans image:', err);
        }
    }
    return null;
}

/**
 * Ferme la modale de résultat.
 * @param {boolean} showToast - Si true, affiche le toast de la notification pour guider l'utilisateur
 */
function closeGenerationResultModal(showToast = false) {
    const modal = document.getElementById('generation-result-modal');
    if (!modal) return;

    // Récupérer l'ID avant de le supprimer
    const notifId = generationResultData?.notificationId;

    modal.classList.add('hidden');
    generationResultData = null;
    _gridCapturePromise = null;

    // Accessibilité : nettoyer le focus trap et restaurer le focus
    if (_generationModalA11yCleanup) {
        _generationModalA11yCleanup();
        _generationModalA11yCleanup = null;
    }

    // Révéler la notification dans le badge (incrémente le compteur)
    revealNotification();

    // Afficher le toast pour guider l'utilisateur vers la cloche
    if (showToast && notifId) {
        setTimeout(() => {
            showToastForNotification(notifId);
        }, 200);
    }
}

/**
 * Initialise les événements de la modale de résultat.
 */
export function initGenerationResultModal() {
    const modal = document.getElementById('generation-result-modal');
    if (!modal) return;

    // Écouter l'événement generation:complete
    document.addEventListener('generation:complete', showGenerationResult);

    // Toggle du dropdown de formats alternatifs
    const dropdownToggle = modal.querySelector('.generation-result-modal__dropdown-toggle');
    const dropdown = modal.querySelector('.generation-result-modal__dropdown');
    if (dropdownToggle && dropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
    }

    // Délégation d'événements sur la modale
    modal.addEventListener('click', (e) => {
        // Gestion des exports document depuis le dropdown
        const exportBtn = e.target.closest('[data-export-format]');
        if (exportBtn && generationResultData) {
            const format = exportBtn.dataset.exportFormat;
            const notifId = generationResultData.notificationId;
            const moduleKey = generationResultData.moduleKey;
            const titleKey = generationResultData.titleKey;
            // Fermer le dropdown
            if (dropdown) dropdown.classList.add('hidden');

            // Récupérer les données JSON depuis la notification
            const notification = getNotificationById(notifId);
            if (!notification || (!notification.originalJsonData && !notification.jsonData)) {
                console.error('Données JSON introuvables pour l\'export document');
                return;
            }
            const jsonDataToExport = notification.originalJsonData || notification.jsonData;
            // Résoudre le moduleKey (depuis l'événement ou via titleKey)
            let resolvedKey = moduleKey;
            if (!resolvedKey && titleKey) {
                resolvedKey = modulesByTitleKey.get(titleKey)?.key || titleKey;
            }

            (async () => {
                try {
                    // Enrichir les données avec les images de grille (Crossword/FindTheWords)
                    let dataToExport = jsonDataToExport;
                    if (_gridCapturePromise && (resolvedKey === 'Crossword' || resolvedKey === 'FindTheWords')) {
                        try {
                            const grids = await _gridCapturePromise;
                            if (grids) {
                                if (grids.emptyGrid) {
                                    dataToExport = { ...dataToExport, _gridImage: grids.emptyGrid };
                                }
                                if (grids.solutionGrid) {
                                    dataToExport = { ...dataToExport, _solutionGridImage: grids.solutionGrid };
                                }
                            }
                        } catch (err) {
                            console.warn('Capture grille échouée, export sans image:', err);
                        }
                    }

                    const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                    if (format === 'DOCX') await exportToDOCX(resolvedKey, dataToExport);
                    else if (format === 'PDF') await exportToPDF(resolvedKey, dataToExport);
                    else if (format === 'ODT') await exportToODT(resolvedKey, dataToExport);
                } catch (error) {
                    console.error(`Erreur lors de l'export ${format}:`, error);
                    showNotification(translations.export_error || "Erreur lors de l'export", 'error');
                }
            })();
            return;
        }

        const action = e.target.closest('[data-action]');
        if (!action) return;

        const actionType = action.dataset.action;

        if (actionType === 'download' && generationResultData) {
            // Télécharger le fichier
            const a = document.createElement('a');
            a.href = URL.createObjectURL(generationResultData.blob);
            a.download = generationResultData.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else if (actionType === 'preview' && generationResultData) {
            // Ouvrir la modale de visualisation/édition
            const notifId = generationResultData.notificationId;
            closeGenerationResultModal(false);
            document.dispatchEvent(new CustomEvent('notification:preview', {
                detail: { id: notifId }
            }));
        } else if (actionType === 'continue') {
            closeGenerationResultModal(true);
        }
    });

    // Clic en dehors de la carte = "Continuer" (ouvre les notifications)
    // Fermer aussi le dropdown si ouvert
    modal.addEventListener('click', (e) => {
        // Fermer le dropdown si on clique en dehors
        if (dropdown && !dropdown.classList.contains('hidden') && !e.target.closest('.generation-result-modal__download-wrapper')) {
            dropdown.classList.add('hidden');
        }
        if (e.target === modal) {
            closeGenerationResultModal(true);
        }
    });

    // Escape géré par setupModalAccessibility dans showGenerationResult()
}


