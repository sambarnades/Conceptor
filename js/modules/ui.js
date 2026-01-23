/**
 * @file Gestion de l'interface utilisateur principale.
 * Ce module est responsable de la génération des tuiles d'activités, de la gestion des onglets,
 * de l'affichage du contenu dans la barre latérale, et du défilement par glissement.
 */

import { allModules, customOrder, h5pModules, moodleModules } from './definitions.js';
import { translations, translatePage, currentLang } from './translation.js';
import { generatePrompts } from './prompt-generator.js';
import { handleH5PCreation } from './h5p-creator.js';
import { handleGlossaireXmlCreation, handleMillionnaireCreation, handleAppariementCreation, handleQCMCreation, handlePageCreation } from './moodle-creator.js';
import { generateMoodleXml, generateMoodleGift } from './moodle-formats.js';
import { cleanJsonInput, showNotification, copyToClipboard, downloadFile, setupToolbarListeners, getCaramelVersionFromFooter, syncPanelHeights } from './utils.js';
import { populateModelSelector, AVAILABLE_MODELS, generateH5PWithLLM } from './llm.js';
import { addNotification } from './notifications.js';
import { exportToDOCX, exportToPDF, exportToODT } from './document-exporter.js';

/**
 * Génère et affiche les tuiles des modules d'activité dans les onglets correspondants.
 */
export function generateTiles() {
    const tabs = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        const grid = tab.querySelector('.grid');
        if (!grid) return;
        grid.innerHTML = '';
        const tabId = tab.id;

        const renderTile = (key) => {
            const module = allModules[key];
            if (!module || module.hidden) return;

            const tile = document.createElement('div');
            tile.className = 'h5p-tile';
            tile.dataset.module = key;
            tile.innerHTML = `
                    <img src="${module.image}" alt="${translations[module.name]} icon">
                    <div class="tile-text">
                        <span class="tile-name-fr">${translations[module.name]}</span>
                        ${module.englishName ? `<span class="tile-name-en">(${module.englishName})</span>` : ''}
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
            tile.addEventListener('click', () => toggleActivityContent(key, tile));
            grid.appendChild(tile);
        };

        if (tabId === 'all') {
            const renderedKeys = new Set();
            // Render custom ordered modules
            customOrder.forEach(key => {
                if (allModules[key]) {
                    renderTile(key);
                    renderedKeys.add(key);
                }
            });
            // Render remaining modules
            for (const key in allModules) {
                if (!renderedKeys.has(key)) {
                    renderTile(key);
                }
            }
        } else {
            // For other tabs, we can iterate through all modules and check category
            for (const key in allModules) {
                const module = allModules[key];
                if (module.hidden) continue;

                if (module.categories.includes(tabId)) {
                    renderTile(key);
                }
            }
        }
    });
}

// =======================================================================
// 4.2. Configuration des onglets
// =======================================================================
/**
 * Initialise les écouteurs d'événements pour la navigation par onglets.
 * Gère également l'état visuel des tuiles H5P en fonction de la saisie dans les champs "qui" et "quoi".
 */
export function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const container = document.querySelector('.container');
    const quiInput = document.querySelector('#qui');
    const quoiInput = document.querySelector('#quoi');

    /**
     * Met à jour l'état des tuiles H5P en fonction de la saisie dans les champs.
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

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

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
const sidebar = document.getElementById('module-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function closeSidebar() {
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
    setTimeout(() => {
        sidebar.innerHTML = '';
    }, 400); // Durée de la transition
}

// Rendre accessible au handler inline de la croix en mode responsive
// (l'appel onclick="closeSidebar()" nécessite une fonction globale)
window.closeSidebar = closeSidebar;

sidebarOverlay.addEventListener('click', closeSidebar);

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
        if (moduleKey === 'moodleXml') {
            promptId = 'moodleXmlResultat';
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
    const modeToggle = sidebar.querySelector('.mode-toggle-checkbox');
    if (modeToggle) {
        modeToggle.addEventListener('change', () => {
            const isAdvanced = sidebar.classList.toggle('advanced-view');
            const generationBtnGroup = sidebar.querySelector('.action-buttons-group.generation-button-group');
            if (generationBtnGroup) {
                generationBtnGroup.style.display = isAdvanced ? 'none' : 'flex';
            }
        });
    }

    if (sidebar.classList.contains('advanced-view')) {
        const generationBtnGroup = sidebar.querySelector('.action-buttons-group.generation-button-group');
        if (generationBtnGroup) {
            generationBtnGroup.style.display = 'none';
        }
    }

    updateGenerationButton(moduleKey, module);

    if (isH5P) {
        attachActivityEventListeners(moduleKey, sidebar, tileElement);
    } else {
        // Logique d'attachement des événements pour Moodle
        if (moduleKey === 'moodleXml') {
            // L'événement click pour le bouton principal est maintenant géré dans updateGenerationButton
        } else if (moduleKey === 'glossaireXml') {
            document.getElementById('createGlossaireXmlBtn').addEventListener('click', () => {
                const rawJsonInput = document.getElementById('glossaireXmlJsonInput').value;
                const jsonInput = cleanJsonInput(rawJsonInput);
                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }
                handleGlossaireXmlCreation(jsonInput);
            });
        } else if (['Millionnaire', 'Appariement', 'QCM'].includes(moduleKey)) {
            const currentModule = moodleModules[moduleKey];
            document.getElementById(currentModule.createBtnId).addEventListener('click', () => {
                const rawJsonInput = document.getElementById(currentModule.jsonInputId).value;
                const jsonInput = cleanJsonInput(rawJsonInput);
                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }
                if (moduleKey === 'Millionnaire') handleMillionnaireCreation(jsonInput);
                else if (moduleKey === 'Appariement') handleAppariementCreation(jsonInput);
                else if (moduleKey === 'QCM') handleQCMCreation(jsonInput);
                else if (moduleKey === 'Page') handlePageCreation(jsonInput, 'mbz');
            });
        }

        if (['moodleXml', 'glossaireXml', 'Millionnaire', 'Appariement', 'QCM', 'Page'].includes(moduleKey)) {
            attachLLMLogic(moduleKey, sidebar);
        }

        const promptIdForCopy = module.promptId || (moduleKey === 'gift' ? 'giftResultat' : (moduleKey === 'moodleXml' ? 'moodleXmlResultat' : (moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : (moduleKey === 'Page' ? 'pageResultat' : null))));
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

    const promptId = module.promptId || (moduleKey === 'moodleXml' ? 'moodleXmlResultat' : (moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : (moduleKey === 'Page' ? 'pageResultat' : null)));
    if (promptId) {
        const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
        if (generatedPrompt) {
            const targetTextarea = document.getElementById(promptId);
            if (targetTextarea) {
                targetTextarea.value = generatedPrompt;
            }
        }
    }
}

/**
 * Ajuste la hauteur des pieds de page des panneaux modaux pour qu'ils soient identiques.
 * @param {HTMLElement} container - L'élément conteneur de la barre latérale.
 */
function updateGenerationButton(moduleKey, module) {
    const buttonGroup = document.getElementById(`generation-button-group-${moduleKey}`);
    if (!buttonGroup) return;

    // Cas spécifique pour "Test (Banque de questions)"
    if (moduleKey === 'moodleXml') {
        const createBtnId = 'createXmlEleaMoodle'; // Le bouton principal génère maintenant le XML
        const createBtnText = translations.generate_xml_file || "Générer le XML";

        buttonGroup.innerHTML = `
                <div class="main-action-button">
                    <button id="${createBtnId}" class="action-btn primary-btn">${createBtnText}</button>
                </div>
                <div class="more-actions-button">
                    <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                        <li><a href="#" data-export-type="gift" data-key="export_gift">${translations.export_gift || 'Format GIFT'}</a></li>
                    </ul>
                </div>
            `;

        // Attacher les écouteurs d'événements
        const mainBtn = document.getElementById(createBtnId);
        const toggleBtn = document.getElementById(`more-actions-toggle-${moduleKey}`);
        const menu = document.getElementById(`more-actions-menu-${moduleKey}`);

        // Action principale : Générer XML
        mainBtn.addEventListener('click', () => {
            const jsonInput = document.getElementById('xmlEleaMoodleInput').value;
            if (!jsonInput) {
                showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                return;
            }
            try {
                const cleanedJson = cleanJsonInput(jsonInput);
                const data = JSON.parse(cleanedJson);
                const xmlContent = generateMoodleXml(data);
                const now = new Date();
                const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
                const fileName = `banque-de-questions_caramel_${dateString}_${lang}.xml`;
                const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
                downloadFile(xmlContent, fileName, 'text/xml');

                // Ajouter à la liste des notifications avec toast popup
                addNotification({
                    type: 'xml',
                    title: translations.moodle_xml_name || 'Banque de questions (XML)',
                    titleKey: 'moodle_xml_name',
                    fileName: fileName,
                    blob: xmlBlob,
                    status: 'success',
                    jsonData: data
                });
            } catch (error) {
                console.error("Erreur lors de la génération du XML Moodle:", error);
                const xmlBlob = new Blob([''], { type: 'text/plain' });
                addNotification({
                    type: 'xml',
                    title: translations.moodle_xml_name || 'Banque de questions (XML)',
                    blob: xmlBlob,
                    status: 'error',
                    errorMessage: error.message
                });
            }
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
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const exportType = link.dataset.exportType;
                const jsonInput = document.getElementById('xmlEleaMoodleInput').value;

                if (!jsonInput) {
                    showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                    return;
                }

                try {
                    const cleanedJson = cleanJsonInput(jsonInput);
                    const data = JSON.parse(cleanedJson);
                    const now = new Date();
                    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                    const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;

                    if (exportType === 'gift') {
                        const giftContent = generateMoodleGift(data);
                        const fileName = `banque-de-questions_caramel_${dateString}_${lang}.gift.txt`;
                        const giftBlob = new Blob([giftContent], { type: 'text/plain' });
                        downloadFile(giftContent, fileName, 'text/plain');

                        // Ajouter à la liste des notifications avec toast popup
                        addNotification({
                            type: 'gift',
                            title: translations.moodle_gift_name || 'Banque de questions (GIFT)',
                            titleKey: 'moodle_gift_name',
                            fileName: fileName,
                            blob: giftBlob,
                            status: 'success'
                        });
                    } else if (exportType === 'xml') {
                        const xmlContent = generateMoodleXml(data);
                        const fileName = `banque-de-questions_caramel_${dateString}_${lang}.xml`;
                        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
                        downloadFile(xmlContent, fileName, 'text/xml');

                        // Ajouter à la liste des notifications avec toast popup
                        addNotification({
                            type: 'xml',
                            title: translations.moodle_xml_name || 'Banque de questions (XML)',
                            titleKey: 'moodle_xml_name',
                            fileName: fileName,
                            blob: xmlBlob,
                            status: 'success',
                            jsonData: data
                        });
                    }
                } catch (error) {
                    console.error(`Erreur lors de la génération du ${exportType.toUpperCase()} Moodle:`, error);
                    const errorBlob = new Blob([''], { type: 'text/plain' });
                    const titleKey = exportType === 'gift' ? 'moodle_gift_name' : 'moodle_xml_name';
                    const title = exportType === 'gift' ? (translations.moodle_gift_name || 'Banque de questions (GIFT)') : (translations.moodle_xml_name || 'Banque de questions (XML)');

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
                <div class="main-action-button">
                    <button id="${createBtnId}" class="action-btn primary-btn">${createBtnText}</button>
                </div>
                <div class="more-actions-button">
                    <button class="action-btn primary-btn dropdown-toggle" id="more-actions-toggle-${moduleKey}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu" id="more-actions-menu-${moduleKey}">
                        <li><a href="#" data-export-type="html" data-key="export_html">${translations.export_html || 'Format HTML'}</a></li>
                    </ul>
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

        function handlePageExport(exportType) {
            const jsonInput = document.getElementById('pageJsonInput').value;
            if (!jsonInput) {
                showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                return;
            }
            handlePageCreation(jsonInput, exportType);
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

                            // Appeler la fonction d'export appropriée
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
                buttonGroup.innerHTML = `<button id="${btnId}" class="action-btn primary-btn">${btnText}</button>`;
            } else if (moodleModules[moduleKey]) {
                btnText = translations[`generate_mbz_${moduleKey.toLowerCase()}`] || "Générer Fichier MBZ";
                buttonGroup.innerHTML = `<button id="${btnId}" class="action-btn primary-btn">${btnText}</button>`;
            } else {
                buttonGroup.innerHTML = `<button id="${btnId}" class="action-btn primary-btn">${btnText}</button>`;
            }
        }
    }
    translatePage(buttonGroup);
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
        createBtn.addEventListener('click', () => {
            const rawJsonInput = container.querySelector(`#${module.jsonInputId}`).value;
            const jsonInput = cleanJsonInput(rawJsonInput);
            if (!jsonInput) {
                showNotification(translations.error_paste_ia_content || 'Veuillez coller le contenu généré par l\'IA.', 'error');
                return;
            }
            handleH5PCreation(moduleKey, jsonInput);
        });
    }

    // Logique LLM (H5P seulement pour l'instant)
    attachLLMLogic(moduleKey, container);
}

function attachLLMLogic(moduleKey, container) {
    const llmBtn = container.querySelector(`#generate-llm-${moduleKey}`);
    if (!llmBtn) return;

    let selectedModel = (
        AVAILABLE_MODELS.find(m => m.featured && m.order === 1)?.id ||
        AVAILABLE_MODELS.find(m => m.featured)?.id ||
        AVAILABLE_MODELS.find(m => m.type === 'text-generation')?.id ||
        AVAILABLE_MODELS[0]?.id
    );
    const modelSelectorBtn = container.querySelector(`#model-selector-btn-${moduleKey}`);
    const modelDropdown = container.querySelector(`#model-selector-dropdown-${moduleKey}`);
    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    const jsonInputId = (moduleKey === 'moodleXml') ? 'xmlEleaMoodleInput' : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput' : module.jsonInputId;

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
        const promptId = (moduleKey === 'moodleXml') ? 'moodleXmlResultat' : (moduleKey === 'glossaireXml') ? 'glossaireXmlResultat' : module.promptId;
        const promptTextarea = document.getElementById(promptId);
        const prompt = promptTextarea.value;

        if (!prompt) {
            showNotification(translations.error_field_empty || 'Veuillez d\'abord générer un prompt.', 'error');
            return;
        }

        const jsonInputTarget = container.querySelector(`#${jsonInputId}`);
        const processorDiv = jsonInputTarget.closest('.h5p-processor');

        startCaramelAnimation();

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
                if (moduleKey === 'moodleXml') {
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
            } else {
                jsonInputTarget.value = translations.generation_failed_empty;
                showNotification(translations.generation_failed_empty, 'error');
            }
        } catch (error) {
            console.error("Erreur lors de la génération avec le LLM:", error);
            const tmpl = translations.generation_failed_llm || 'La génération a échoué. Cause : {errorMessage}';
            const errorMessage = tmpl.replace('{errorMessage}', error.message);
            showNotification(errorMessage, 'error');
            jsonInputTarget.value = errorMessage;
        } finally {
            stopCaramelAnimation();
        }
    });
}


// =======================================================================
// 9. ANIMATION DE GÉNÉRATION "CARAMEL"
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
    const successMessage = document.getElementById('success-message');
    clearInterval(recipeInterval);
    overlay.style.display = 'none';

    successMessage.classList.remove('hidden');
    successMessage.style.opacity = 1;

    setTimeout(() => {
        successMessage.style.opacity = 0;
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 500);
    }, 2000);
}


// =======================================================================
// 10. GESTION DU DÉFILEMENT PAR GLISSEMENT (DRAG-TO-SCROLL)
// =======================================================================
/**
 * Initialise la fonctionnalité de défilement par glissement (drag-to-scroll) pour la barre d'onglets.
 */
export function initDragToScroll() {
    const tabsContainer = document.querySelector('.tabs');

    if (tabsContainer) {
        let isDown = false;
        let startX;
        let scrollLeft;

        tabsContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            tabsContainer.classList.add('grabbing');
            startX = e.pageX - tabsContainer.offsetLeft;
            scrollLeft = tabsContainer.scrollLeft;
        });

        tabsContainer.addEventListener('mouseleave', () => {
            isDown = false;
            tabsContainer.classList.remove('grabbing');
        });

        tabsContainer.addEventListener('mouseup', () => {
            isDown = false;
            tabsContainer.classList.remove('grabbing');
        });

        tabsContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - tabsContainer.offsetLeft;
            const walk = (x - startX) * 2;
            tabsContainer.scrollLeft = scrollLeft - walk;
        });
    }
}
