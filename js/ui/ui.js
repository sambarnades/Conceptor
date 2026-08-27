/**
 * @file Gestion de l'interface utilisateur principale.
 * Ce module est responsable de la génération des tuiles d'activités, de la gestion des onglets,
 * de l'affichage du contenu dans la barre latérale, et du défilement par glissement.
 */

import { allModules, customOrder, h5pModules, moodleModules } from '../core/definitions.js';
import { translations, translatePage, currentLang } from '../core/translation.js';
import { generatePrompts, buildVideoInteractivePrompt, buildImageHotspotsPrompt, setImageHotspotZones, prefixForModule, resultKeyForModule } from '../services/prompt-generator.js';
import { snapInteractions } from '../h5p/processors/interactive-video-snap.js';
import { cleanJsonInput, showNotification, copyToClipboard, downloadFile, setupToolbarListeners, getCaramelVersionFromFooter, syncPanelHeights, DEBUG, debugLog, setupModalAccessibility, safeSession, horodatageFichier, classifyError } from '../core/utils.js';
import { populateModelSelector, AVAILABLE_MODELS, DEFAULT_MODEL, ACTIVITY_MODEL_OVERRIDES, generateH5PWithLLM, beginGeneration, requestCancelGeneration, isCancellation } from '../services/llm.js';
import { generateInBatches, shouldChunk, BATCH_CONFIG } from '../services/llm-batch.js';
import { addNotification, getNotificationById, getLastDebugNotification, showToastForNotification, revealNotification, hydrateImagesForExport } from './notifications.js';
import { visionContextSig, alignVideoHelpButton, snapVideoTimestamps } from './media-helpers.js';
import { initBackgroundImageSection } from './background-image-section.js';
import { initVideoUrlSection } from './video-url-section.js';

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
            // Badge plateforme dynamique : Éléa par défaut, suit le filtre actif (cf. applyFilters)
            const label = document.createElement('div');
            label.className = 'module-label elea-label';
            label.dataset.platformBadge = '';
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
        safeSession.keys()
            .filter(key => key.startsWith(`${STORAGE_PREFIX}json_`) || key.startsWith(`${STORAGE_PREFIX}prompt_`))
            .forEach(key => safeSession.remove(key));
    }

    /**
     * Détecte les changements de contexte et régénère les prompts si nécessaire.
     */
    function handleContextChange() {
        const currentHash = getContextHash();
        const savedHash = safeSession.get(`${STORAGE_PREFIX}context_hash`);

        if (savedHash && savedHash !== currentHash) {
            // Le contexte a changé : effacer les données sauvegardées (prompts et JSON)
            clearSessionData();

            // Vidéo interactive : on NE réinitialise PAS le lien/transcription — la transcription
            // ne dépend que de la vidéo, pas du contexte pédagogique (Qui/Quoi). On la conserve ;
            // generatePrompts() ci-dessous reconstruit le prompt avec le nouveau contexte + la même
            // transcription (cf. currentVideoSources dans prompt-generator).

            // Régénérer les prompts dès qu'un champ de contexte porteur de sens est rempli
            // (évite les erreurs/notifications quand l'utilisateur efface TOUS les champs).
            // On inclut `niveau` et `nombreQuestions` : pour la Vidéo interactive, la source du
            // prompt est la TRANSCRIPTION (pas Qui/Quoi, souvent laissés vides) — sans cela, saisir
            // le nombre de questions en mode Avancé ne réinjectait jamais ce nombre dans le prompt.
            const qui = document.getElementById('qui')?.value.trim() || '';
            const quoi = document.getElementById('quoi')?.value.trim() || '';
            const niveau = document.getElementById('niveau')?.value.trim() || '';
            const nombre = document.getElementById('nombreQuestions')?.value.trim() || '';

            // Image interactive : à l'INVERSE de la vidéo, les zones détectées DÉPENDENT du contexte
            // pédagogique (la vision est guidée par qui/quoi/niveau/nombre). Un changement RÉEL de ce
            // contexte les périme → on purge l'image capturée + les zones (avant generatePrompts pour
            // que le prompt se reconstruise sans elles). Insensible à l'OCR/RAG. Tant que le contexte
            // vision ne change pas, l'image reste (cohérent avec la conservation du lien vidéo).
            const visionCtx = visionContextSig();
            const savedVisionCtx = safeSession.get(`${STORAGE_PREFIX}ih_vision_ctx`);
            if (savedVisionCtx !== null && savedVisionCtx !== visionCtx) {
                invalidateImageHotspotsContext();
            }
            safeSession.set(`${STORAGE_PREFIX}ih_vision_ctx`, visionCtx);

            if (qui || quoi || niveau || nombre) {
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
        safeSession.set(`${STORAGE_PREFIX}context_hash`, currentHash);
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
    safeSession.set(`${STORAGE_PREFIX}context_hash`, getContextHash());
    // …et la signature du contexte vision (Image interactive) — évite de purger une 1ʳᵉ analyse
    // faite contexte vide quand l'utilisateur saisit ensuite qui/quoi.
    safeSession.set(`${STORAGE_PREFIX}ih_vision_ctx`, visionContextSig());

    // --- Fin de la détection des changements de contexte ---

    // --- Gestion des filtres par chips ---

    /**
     * Applique les filtres actifs (type d'activité + plateforme) sur les tuiles.
     */
    // Apparence du badge des tuiles non-H5P selon la plateforme filtrée (Éléa = défaut)
    const PLATFORM_BADGES = {
        elea: { className: 'elea-label', text: 'Éléa' },
        magistere: { className: 'magistere-label', text: 'Magistère' },
        moodle: { className: 'moodle-label', text: 'Moodle' }
    };

    function applyFilters() {
        const activeType = document.querySelector('.filter-chip--activity.active')?.dataset.filterType || 'all';
        const activePlatforms = [...document.querySelectorAll('.filter-chip[data-filter-platform].active')]
            .map(el => el.dataset.filterPlatform);
        const selectedBadgePlatform = activePlatforms.find(p => p === 'magistere' || p === 'moodle');

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

            // Le badge non-H5P affiche la plateforme sélectionnée (si la tuile la supporte)
            const badge = tile.querySelector('.module-label[data-platform-badge]');
            if (badge) {
                const target = (selectedBadgePlatform && platforms.includes(selectedBadgePlatform))
                    ? PLATFORM_BADGES[selectedBadgePlatform]
                    : PLATFORM_BADGES.elea;
                badge.className = `module-label ${target.className}`;
                const span = badge.querySelector('span');
                if (span) span.textContent = target.text;
            }
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
    // Le changement de langue régénère les tuiles APRÈS cet événement (cf. translation.js) :
    // on ré-applique les filtres (et le badge plateforme dynamique) au tick suivant.
    window.addEventListener('caramel:language-changed', () => setTimeout(applyFilters, 0));



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
    // On stocke aussi la langue courante pour ne pas restaurer un prompt obsolète
    // après changement de langue (sinon écrase la nouvelle traduction).
    const promptTextarea = document.getElementById(promptId);
    if (promptTextarea?.value.trim()) {
        safeSession.set(`${STORAGE_PREFIX}prompt_${moduleKey}`, promptTextarea.value);
        safeSession.set(`${STORAGE_PREFIX}prompt_lang_${moduleKey}`, currentLang);
    }

    // Sauvegarder le JSON (contenu généré par LLM)
    const jsonTextarea = document.getElementById(jsonInputId);
    if (jsonTextarea?.value.trim()) {
        safeSession.set(`${STORAGE_PREFIX}json_${moduleKey}`, jsonTextarea.value);
    }
}

/**
 * Efface le JSON généré (textarea visible + sauvegarde sessionStorage) pour un module
 * et rafraîchit l'état du bouton contextuel. Utilisé quand le contexte change et que
 * l'ancien JSON n'est plus pertinent (changement Qui/Quoi, changement de prompt, ou
 * changement de lien vidéo pour la Vidéo interactive).
 * @param {string} moduleKey - La clé identifiant le module.
 * @param {object} [module] - Le module (pour résoudre jsonInputId) ; résolu si omis.
 */
export function clearGeneratedJson(moduleKey, module) {
    if (!moduleKey) return;
    const mod = module || h5pModules[moduleKey] || moodleModules[moduleKey];
    if (!mod) return;
    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput'
                      : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput'
                      : mod.jsonInputId;
    const jsonTextarea = jsonInputId && document.getElementById(jsonInputId);
    if (jsonTextarea) jsonTextarea.value = '';
    safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);
    const buttonGroup = document.getElementById(`generation-button-group-${moduleKey}`);
    if (buttonGroup?._ctxUpdate) buttonGroup._ctxUpdate();
}

/**
 * Enregistre un listener de clic global (document) lié au contenu courant de la sidebar.
 * Le handler est mémorisé sur la sidebar (même principe que sidebar._resizeHandler)
 * pour être retiré à la fermeture / au re-render, évitant l'accumulation de listeners
 * à chaque ouverture de sidebar.
 * @param {Function} handler - Le handler à attacher sur document.
 */
function addSidebarDocumentClickListener(handler) {
    document.addEventListener('click', handler);
    if (!sidebar._docClickHandlers) sidebar._docClickHandlers = [];
    sidebar._docClickHandlers.push(handler);
}

/**
 * Retire les listeners globaux et observers liés au contenu courant de la sidebar.
 * Appelé à la fermeture et avant chaque re-render (changement de tuile, refresh i18n).
 */
function cleanupSidebarListeners() {
    // Listeners de clic globaux (fermeture des dropdowns au clic extérieur)
    if (sidebar._docClickHandlers) {
        sidebar._docClickHandlers.forEach(h => document.removeEventListener('click', h));
        sidebar._docClickHandlers = null;
    }
    // Observer des changements de classe (placeholder mode guidé)
    if (sidebar._placeholderObserver) {
        sidebar._placeholderObserver.disconnect();
        sidebar._placeholderObserver = null;
    }
    // Handler de resize (synchronisation des hauteurs de panneaux)
    if (sidebar._resizeHandler) {
        window.removeEventListener('resize', sidebar._resizeHandler);
        sidebar._resizeHandler = null;
    }
    // Timer de debounce de l'URL vidéo (activité Vidéo interactive)
    if (sidebar._videoDebounceTimer) {
        clearTimeout(sidebar._videoDebounceTimer);
        sidebar._videoDebounceTimer = null;
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
    // Supprimer les listeners globaux (resize, clics document, observer)
    cleanupSidebarListeners();
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
// ============= VIDÉO INTERACTIVE : détection URL + verrouillage génération =============
// État de détection par module (videoSource + transcript), persistant le temps de la session UI.
const videoStates = new Map();

// ============= IMAGE INTERACTIVE : upload image de fond + vision + verrouillage =============
// État par module : { entry, image, dataURL, width, height, zones, imageDescription, altText, fileName }.
// Capturé EN AMONT (dès l'upload + analyse vision) pour rester dispo en mode rapide ET guidé.
// Survit à la fermeture de la modale → restauré au ré-rendu de la sidebar (cf. initBackgroundImageSection).
const imageHotspotStates = new Map();


/**
 * Invalide l'image de fond capturée + les zones détectées de l'« Image interactive » quand le
 * contexte vision change (cf. handleContextChange). À l'INVERSE de la vidéo — dont la transcription
 * ne dépend pas du contexte — les zones DÉPENDENT de qui/quoi/niveau : un changement les périme.
 * Purge l'état (Map), le registre image (id 'image') et les zones du prompt ; réinitialise l'UI de
 * la section si la modale est ouverte (sinon la purge des données suffit, l'UI repartira vide au
 * ré-rendu). L'utilisateur re-joindra son image pour relancer l'analyse avec le nouveau contexte.
 */
function invalidateImageHotspotsContext() {
    if (imageHotspotStates.size === 0) return;
    imageHotspotStates.clear();
    setImageHotspotZones(null);
    import('../h5p/image-manager.js').then(m => m.unregisterImage('image')).catch(() => { /* registre déjà vide */ });
    const sec = sidebar.querySelector('[id^="img-bg-section-"]');
    if (sec && typeof sec._resetImage === 'function') sec._resetImage();
}


/**
 * Indique si le lien vidéo a changé entre deux détections (donc transcription/contexte différents).
 * Vrai uniquement si les deux liens sont renseignés et distincts — un premier lien (ancien vide)
 * ne « change » rien, et re-coller le même lien ne doit pas invalider le travail.
 * @param {string} prevUrl - Lien de la détection précédente (peut être vide).
 * @param {string} newUrl - Nouveau lien détecté.
 * @returns {boolean}
 */
export function videoLinkChanged(prevUrl, newUrl) {
    return !!prevUrl && !!newUrl && prevUrl !== newUrl;
}




/**
 * Indique si une vidéo lisible a été détectée pour ce module (verrou de génération).
 * @param {string} moduleKey
 * @returns {boolean}
 */
function isVideoReady(moduleKey) {
    const st = videoStates.get(moduleKey);
    return !!(st && st.detect && st.detect.playable);
}

/**
 * Filet de sécurité (appelé quand la transcription automatique échoue à la génération) :
 * passe le champ en état « manuel » (ambre + ⚠), affiche le lien « Coller la transcription »
 * et ouvre directement le popover de collage. La fonction d'ouverture est exposée par
 * initVideoUrlSection sur le nœud de section (`_openTranscript`).
 * @param {string} moduleKey
 */
function revealVideoManual(moduleKey) {
    const section = sidebar.querySelector(`#video-url-section-${moduleKey}`);
    if (!section) return;
    section.dataset.state = 'manual';
    const statusEl = section.querySelector('.video-url-field__status');
    if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle-exclamation" aria-hidden="true"></i>';
    const msg = section.querySelector('.video-url-msg');
    if (msg) {
        msg.hidden = false;
        msg.innerHTML = '';
        msg.appendChild(document.createTextNode(translations.video_manual_short || 'Transcription automatique indisponible.'));
        if (typeof section._openTranscript === 'function') {
            msg.appendChild(document.createTextNode(' · '));
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'video-url-msg__action';
            b.textContent = translations.video_paste_cta || 'Coller la transcription';
            b.addEventListener('click', () => section._openTranscript('paste'));
            msg.appendChild(b);
        }
    }
    const seeBtn = section.querySelector('.video-url-field__action');
    if (seeBtn) seeBtn.hidden = true;
    if (typeof section._openTranscript === 'function') section._openTranscript('paste');
}


/**
 * Nombre de questions demandé explicitement par l'utilisateur (champ « nombre » du mode Avancé),
 * ou null en mode Simple / si vide. Sert à respecter le choix de l'enseignant face au plafond auto.
 * @returns {number|null}
 */
function getRequestedQuestionCount() {
    const simpleTab = document.querySelector('.mode-tab[data-mode="simple"]');
    const isAdvanced = !(simpleTab && simpleTab.classList.contains('active'));
    if (!isAdvanced) return null;
    const n = parseInt(document.getElementById('nombreQuestions')?.value || '', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Génère le JSON d'une activité « en un clic ». Décide de façon transparente entre :
 *   - 1 seul appel LLM (comportement historique) si le nombre demandé ≤ seuil OU activité
 *     non « list-shaped » (pas de `chunking` dans definitions.js) ;
 *   - génération PAR LOTS (plan + remplissage + fusion, cf. services/llm-batch.js) au-delà,
 *     pour contourner le mur des 59 s du proxy n8n sans répétition entre lots.
 * Renvoie TOUJOURS un seul JSON (string) → le reste du flux (createBtn → healer → processor)
 * est inchangé. La progression « lot k/N » est poussée dans l'overlay d'animation.
 * @returns {Promise<string>}
 */
async function generateActivityContent(moduleKey, module, prompt, selectedModel, activityMeta) {
    let requestedCount = getRequestedQuestionCount();
    if (shouldChunk(module, requestedCount)) {
        if (requestedCount > BATCH_CONFIG.maxItems) {
            const tmpl = translations.batch_capped
                || 'Génération limitée à {max} questions en un clic. Pour davantage, copiez le prompt vers une IA externe.';
            showNotification(tmpl.replace('{max}', BATCH_CONFIG.maxItems), 'info');
            requestedCount = BATCH_CONFIG.maxItems;
        }
        try {
            return await generateInBatches({
                moduleKey,
                model: selectedModel,
                activityMeta,
                requestedCount,
                onProgress: (p) => setBatchProgress(p)
            });
        } catch (e) {
            // Détail technique réservé à la console (dev) ; l'utilisateur reçoit un message
            // TRADUIT (aucun texte interne en français en dur affiché).
            console.error('Échec de la génération par lots :', e);
            throw new Error(translations.batch_failed
                || 'le découpage en plusieurs lots n\'a pas abouti — réessaie dans un instant.');
        }
    }
    return generateH5PWithLLM(prompt, selectedModel, activityMeta);
}







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

    // Retirer les listeners globaux du contenu précédent avant le re-render
    // (changement de tuile sans fermeture, ou refresh après changement de langue)
    cleanupSidebarListeners();

    // Nettoyer le focus trap précédent (sinon les listeners keydown s'accumulent
    // à chaque changement de tuile / refresh) — un nouveau est installé plus bas
    if (_sidebarA11yCleanup) {
        _sidebarA11yCleanup();
        _sidebarA11yCleanup = null;
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
        // Les deux activités Éléa ci-dessous ne déclarent ni `jsonInputId` ni `createBtnId`
        // dans definitions.js : leurs identifiants de panneau vivent ici. L'identifiant du
        // textarea de prompt, lui, vient de `resultKeyForModule` — source unique (cf. le
        // défaut « Glossaire » documenté dans prompt-generator.js).
        const PANNEAUX_ELEA = {
            test_elea:    { jsonInputId: 'xmlEleaMoodleInput',    createBtnId: 'createXmlEleaMoodle' },
            glossaireXml: { jsonInputId: 'glossaireXmlJsonInput', createBtnId: 'createGlossaireXmlBtn' }
        };
        let promptId = '', jsonInputId = '', createBtnId = '', createBtnText = '';
        const panneauElea = PANNEAUX_ELEA[moduleKey];
        if (panneauElea) {
            promptId = resultKeyForModule(moduleKey);
            jsonInputId = panneauElea.jsonInputId;
            createBtnId = panneauElea.createBtnId;
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

    // Activité « Vidéo interactive » : champ URL + bouton transcription + aide, sous la description.
    // La génération reste verrouillée tant qu'aucune vidéo lisible n'est détectée (cf. initVideoUrlSection).
    const videoUrlHtml = module.requiresVideoUrl ? `
                    <div class="video-url-section" id="video-url-section-${moduleKey}" data-state="empty">
                        <div class="video-url-row">
                            <div class="video-url-field">
                                <span class="video-url-field__progress" aria-hidden="true"></span>
                                <i class="fas fa-link video-url-field__icon" aria-hidden="true"></i>
                                <input type="url" id="video-url-input-${moduleKey}" class="video-url-input" placeholder="${translations.video_url_placeholder || 'https://tube-...apps.education.fr/w/...'}" autocomplete="off" spellcheck="false" aria-label="${translations.video_url_label || 'Lien de la vidéo'}" />
                                <span class="video-url-field__status" id="video-status-${moduleKey}" aria-hidden="true"></span>
                                <button type="button" id="video-go-btn-${moduleKey}" class="video-url-field__go" hidden aria-label="${translations.video_validate_url || 'Valider le lien'}" title="${translations.video_validate_url || 'Valider le lien'}"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                                <button type="button" id="video-see-btn-${moduleKey}" class="video-url-field__action" hidden><i class="fas fa-eye" aria-hidden="true"></i> <span data-key="video_see_transcript">Voir</span></button>
                                <div class="video-url-field__overlay" id="video-overlay-${moduleKey}" hidden>
                                    <span class="video-url-field__overlay-label"></span>
                                    <button type="button" id="video-stop-btn-${moduleKey}" class="video-url-field__stop" aria-label="${translations.video_stop_transcription || 'Arrêter la transcription'}" title="${translations.video_stop_transcription || 'Arrêter la transcription'}"><i class="fas fa-stop" aria-hidden="true"></i></button>
                                </div>
                            </div>
                            <button type="button" id="video-help-btn-${moduleKey}" class="video-help-btn" aria-label="${translations.video_help_btn || 'Aide'}" title="${translations.video_help_btn || 'Aide'}"><i class="fas fa-question" aria-hidden="true"></i></button>
                        </div>
                        <p class="video-url-msg" id="video-msg-${moduleKey}" role="status" aria-live="polite" hidden></p>
                    </div>` : '';

    // Activité « Image interactive » : champ d'upload d'une image de fond (à la place du lien vidéo).
    // Joindre un fichier lance l'analyse vision (zones clés) ; la génération reste verrouillée tant
    // qu'aucune image analysée (cf. initBackgroundImageSection). Réutilise le style .video-url-field*.
    const imageUploadHtml = module.requiresBackgroundImage ? `
                    <div class="video-url-section img-bg-section" id="img-bg-section-${moduleKey}" data-state="empty">
                        <div class="video-url-row">
                            <div class="video-url-field img-bg-field">
                                <span class="video-url-field__progress" aria-hidden="true"></span>
                                <i class="fas fa-image video-url-field__icon" aria-hidden="true"></i>
                                <input type="file" id="img-bg-input-${moduleKey}" class="img-bg-file" accept="image/*,.heic,.heif,.tif,.tiff,.avif,.bmp,.svg" hidden />
                                <button type="button" id="img-bg-pick-${moduleKey}" class="img-bg-pick">
                                    <img class="img-bg-thumb" alt="" hidden />
                                    <span class="img-bg-pick__label" data-key="ih_image_choose">${translations.ih_image_choose || 'Joindre une image de fond…'}</span>
                                </button>
                                <span class="video-url-field__status" id="img-bg-status-${moduleKey}" aria-hidden="true"></span>
                                <button type="button" id="img-bg-retry-${moduleKey}" class="video-url-field__go img-bg-retry" hidden aria-label="${translations.ih_retry_detection || 'Relancer la détection'}" title="${translations.ih_retry_detection || 'Relancer la détection'}"><i class="fas fa-rotate-right" aria-hidden="true"></i></button>
                                <button type="button" id="img-bg-clear-${moduleKey}" class="video-url-field__go img-bg-clear" hidden aria-label="${translations.ih_remove_image || 'Retirer l’image'}" title="${translations.ih_remove_image || 'Retirer l’image'}"><i class="fas fa-xmark" aria-hidden="true"></i></button>
                                <div class="video-url-field__overlay" id="img-bg-overlay-${moduleKey}" hidden>
                                    <span class="video-url-field__overlay-label"></span>
                                    <button type="button" id="img-bg-stop-${moduleKey}" class="video-url-field__stop" aria-label="${translations.video_stop_transcription || 'Arrêter'}" title="${translations.video_stop_transcription || 'Arrêter'}"><i class="fas fa-stop" aria-hidden="true"></i></button>
                                </div>
                            </div>
                            <button type="button" id="img-bg-help-btn-${moduleKey}" class="video-help-btn" aria-label="${translations.video_help_btn || 'Aide'}" title="${translations.video_help_btn || 'Aide'}"><i class="fas fa-question" aria-hidden="true"></i></button>
                        </div>
                        <p class="video-url-msg" id="img-bg-msg-${moduleKey}" role="status" aria-live="polite" hidden></p>
                    </div>` : '';

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
                        ${videoUrlHtml}
                        ${imageUploadHtml}
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
    requestAnimationFrame(() => { syncPanelHeights(sidebar); alignVideoHelpButton(sidebar); });

    // Re-synchroniser lors du resize avec debounce
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => { syncPanelHeights(sidebar); alignVideoHelpButton(sidebar); }, 100);
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
            // Le footer droit change de structure entre Simple et Guidé :
            // resynchroniser pour garder les séparateurs gauche/droite alignés
            requestAnimationFrame(() => syncPanelHeights(sidebar));
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

        if (['test_elea', 'glossaireXml', 'Millionnaire', 'Appariement', 'QCM', 'Devoir', 'Page', 'Livre'].includes(moduleKey)) {
            attachLLMLogic(moduleKey, sidebar);
        }

        // `Page`/`Livre` déclarent leur `promptId` dans definitions.js : les replis en dur
        // qui les nommaient ici étaient morts (jamais atteints).
        const promptIdForCopy = resultKeyForModule(moduleKey);
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

    const promptId = resultKeyForModule(moduleKey);
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

    // Activité « Vidéo interactive » : champ URL + détection + verrou de génération.
    initVideoUrlSection(moduleKey, module, {
        sidebar, videoStates, clearGeneratedJson,
        isVideoReady, revealVideoManual, videoLinkChanged
    });
    initBackgroundImageSection(moduleKey, module, {
        sidebar, imageHotspotStates, invalidateImageHotspotsContext
    });
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

    // Restaurer le prompt sauvegardé UNIQUEMENT si la langue n'a pas changé depuis la sauvegarde.
    // Sinon on conserve le prompt fraîchement régénéré dans la nouvelle langue par generatePrompts().
    const savedPrompt = safeSession.get(`${STORAGE_PREFIX}prompt_${moduleKey}`);
    const savedLang = safeSession.get(`${STORAGE_PREFIX}prompt_lang_${moduleKey}`);
    if (savedPrompt && promptId && savedLang === currentLang) {
        const promptTextarea = document.getElementById(promptId);
        if (promptTextarea) {
            promptTextarea.value = savedPrompt;
        }
    } else if (savedPrompt && savedLang && savedLang !== currentLang) {
        // La langue a changé : nettoyer la sauvegarde obsolète pour éviter de re-écraser plus tard
        safeSession.remove(`${STORAGE_PREFIX}prompt_${moduleKey}`);
        safeSession.remove(`${STORAGE_PREFIX}prompt_lang_${moduleKey}`);
    }

    // Restaurer le JSON sauvegardé (contenu généré par LLM, indépendant de la langue d'UI)
    const savedJson = safeSession.get(`${STORAGE_PREFIX}json_${moduleKey}`);
    if (savedJson && jsonInputId) {
        const jsonTextarea = document.getElementById(jsonInputId);
        if (jsonTextarea) {
            jsonTextarea.value = savedJson;
        }
    }
}

/**
 * Re-render la sidebar active EN PLACE (sans la fermer).
 * Appelé après un changement de langue pour rafraîchir tout le contenu traduit
 * de la sidebar (titres, boutons, placeholders, prompt régénéré).
 * Préserve le JSON saisi (indépendant de la langue) et le mode Simple/Avancé.
 * No-op si aucune sidebar n'est ouverte.
 */
export function refreshSidebar() {
    if (!activeTile || !sidebar.classList.contains('open')) return;

    const moduleKey = activeTile.dataset?.module;
    if (!moduleKey) return;

    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    if (!module) return;

    // Re-résoudre la tuile dans le DOM courant : generateTiles() (appelé au changement
    // de langue avant ce refresh) recrée toutes les tuiles, l'ancienne référence
    // activeTile pointe alors vers un nœud détaché.
    const tile = document.querySelector(`.h5p-tile[data-module="${moduleKey}"]`) || activeTile;

    // Mémoriser le mode courant (Simple/Avancé) avant le re-render
    const wasAdvanced = sidebar.classList.contains('advanced-view');

    // Sauvegarder UNIQUEMENT le JSON (indépendant de la langue d'UI) pour qu'il soit
    // restauré par restoreModalDataFromSession(). Le prompt n'est volontairement PAS
    // sauvegardé ici : la langue vient de changer, il sera régénéré par generatePrompts()
    // dans la nouvelle langue (même convention que prompt_lang_ dans saveModalDataToSession).
    const jsonInputId = (moduleKey === 'test_elea') ? 'xmlEleaMoodleInput'
                      : (moduleKey === 'glossaireXml') ? 'glossaireXmlJsonInput'
                      : module.jsonInputId;
    const jsonTextarea = jsonInputId ? document.getElementById(jsonInputId) : null;
    if (jsonTextarea?.value.trim()) {
        safeSession.set(`${STORAGE_PREFIX}json_${moduleKey}`, jsonTextarea.value);
    }

    // Re-render en place : neutraliser le toggle « même tuile = fermeture »
    // de toggleActivityContent (qui appellerait closeSidebar sinon).
    activeTile = null;
    toggleActivityContent(moduleKey, tile);

    // Restaurer le mode Avancé en rejouant la logique du switch (classe + masquage bouton LLM)
    if (wasAdvanced) {
        const modeToggle = sidebar.querySelector('.mode-toggle-checkbox');
        if (modeToggle && !modeToggle.checked) {
            modeToggle.checked = true;
            modeToggle.dispatchEvent(new Event('change'));
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

    addSidebarDocumentClickListener((e) => {
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

        addSidebarDocumentClickListener((e) => {
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
                    const dateString = horodatageFichier('-');
                    const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;

                    const moodleFormats = await import('../moodle/moodle-formats.js');
                    if (exportType === 'gift') {
                        const giftContent = moodleFormats.generateMoodleGift(data);
                        const fileName = `banque-de-questions_caramel_${dateString}_${lang}.gift.txt`;
                        const giftBlob = new Blob([giftContent], { type: 'text/plain' });
                        downloadFile(giftContent, fileName, 'text/plain');

                        // Le format GIFT ne prend pas en charge le type « texte à trous » (cloze) :
                        // ces questions sont omises de l'export → prévenir l'utilisateur.
                        const clozeOmises = (data.questions || []).filter(q => q && q.type === 'cloze').length;
                        if (clozeOmises > 0) {
                            const tmpl = translations.elea_test_gift_cloze_warning || "{count} question(s) « texte à trous » (cloze) ne sont pas prises en charge par le format GIFT et ont été omises. Utilisez l'export XML pour les conserver.";
                            showNotification(tmpl.replace('{count}', clozeOmises), 'error');
                        }

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

        addSidebarDocumentClickListener((e) => {
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
    } else if (moduleKey === 'Livre') {
        const createBtnId = 'createLivreMBZ';
        const createBtnText = translations.generate_mbz_livre || "Générer l'activité Livre (mbz)";

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

        mainBtn.addEventListener('click', () => handleLivreExport('mbz'));

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        addSidebarDocumentClickListener((e) => {
            if (!buttonGroup.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const exportType = link.dataset.exportType;
                handleLivreExport(exportType);
                menu.classList.remove('show');
            });
        });

        async function handleLivreExport(exportType) {
            const jsonInput = document.getElementById('livreJsonInput').value;
            if (!jsonInput) {
                showNotification(translations.error_paste_json_content || 'Veuillez coller le contenu JSON généré.', 'error');
                return;
            }
            if (['docx', 'odt', 'pdf'].includes(exportType)) {
                try {
                    const cleanedJson = cleanJsonInput(jsonInput);
                    const data = JSON.parse(cleanedJson);
                    const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                    if (exportType === 'docx') await exportToDOCX('Livre', data);
                    else if (exportType === 'odt') await exportToODT('Livre', data);
                    else if (exportType === 'pdf') await exportToPDF('Livre', data);
                } catch (error) {
                    console.error(`Erreur lors de l'export ${exportType.toUpperCase()}:`, error);
                    showNotification(translations.export_error || "Erreur lors de l'export", 'error');
                }
            } else {
                const { handleLivreCreation } = await import('../moodle/moodle-creator.js');
                handleLivreCreation(jsonInput, exportType);
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

                addSidebarDocumentClickListener((e) => {
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

        addSidebarDocumentClickListener((e) => {
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
            safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);

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

                const content = await generateActivityContent(moduleKey, module, prompt, selectedModel, activityMeta);
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
                signalerFinGeneration(error, jsonInputTarget, 'Génération contextuelle');
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
        // Observer les changements de classe sur la sidebar pour basculer placeholder + texte bouton.
        // Stocké sur la sidebar pour être disconnect() à la fermeture (cleanupSidebarListeners).
        const placeholderObserver = new MutationObserver(() => {
            updatePlaceholder();
            updateCtxState();
        });
        placeholderObserver.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        sidebar._placeholderObserver = placeholderObserver;

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
                    safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);
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
            let jsonInput = cleanJsonInput(rawJsonInput);
            if (!jsonInput) {
                showNotification(translations.error_paste_ia_content || 'Veuillez coller le contenu généré par l\'IA.', 'error');
                return;
            }
            // Image interactive (mode Guidé / collage manuel) : l'image de fond n'est jamais demandée
            // à l'IA. Si le JSON collé n'en contient pas, on injecte celle capturée en amont (upload).
            if (module.requiresBackgroundImage) {
                let parsed = null;
                try { parsed = JSON.parse(jsonInput); }
                catch {
                    // JSON réparable uniquement par le healer (saut de ligne littéral, backslash
                    // LaTeX…) : sans ce rattrapage, l'injection de l'image de fond serait sautée
                    // et le .h5p sortirait sans champ `image` (audit N1, scénario 3).
                    try {
                        const { healJsonString } = await import('../h5p/json-healer.js');
                        parsed = JSON.parse(healJsonString(jsonInput));
                    } catch { /* irréparable : le creator lèvera une erreur propre en aval */ }
                }
                const st = imageHotspotStates.get(moduleKey);
                // Ré-enregistrer le fond dans le registre AVANT le packaging : clearAllImages() vide le
                // registre après chaque génération réussie, donc une 2ᵉ création (sans ré-ouvrir la
                // modale) perdrait sinon le blob de l'image (content.json référencerait un fichier
                // absent). Le state survit (Map module-level) et conserve l'entry → on la ré-injecte.
                if (st && st.entry) {
                    try {
                        const { registerImage } = await import('../h5p/image-manager.js');
                        registerImage('image', st.entry);
                    } catch { /* ré-enregistrement best-effort */ }
                }
                if (parsed && typeof parsed === 'object' && !parsed.image && st && st.image) {
                    parsed.image = st.image;
                    // Champs propres au format plat d'Image interactive (les « Find the Hotspot »
                    // n'ont ni alt-text ni icônes dans leur semantics).
                    if (moduleKey === 'ImageHotspots') {
                        if (!parsed.backgroundImageAltText) parsed.backgroundImageAltText = st.altText || '';
                        if (!parsed.globalIconType) parsed.globalIconType = 'numbers';
                    }
                    jsonInput = JSON.stringify(parsed);
                }
            }

            // Vidéo interactive (mode Guidé / collage manuel) : la source de lecture et la piste
            // de sous-titres ne sont JAMAIS demandées à l'IA. Deux sources possibles, dans l'ordre :
            //   1. le JSON collé contient DÉJÀ une videoSource → elle PRIME (on génère tel quel) ;
            //   2. sinon, une URL saisie/détectée → Caramel injecte sa videoSource.
            // On ne bloque que si AUCUNE des deux n'est disponible (sinon le .h5p n'aurait pas de vidéo).
            if (module.requiresVideoUrl) {
                let parsed = null;
                try { parsed = JSON.parse(jsonInput); } catch {
                    // JSON imparfait (backslashes LaTeX, sauts de ligne bruts…) : retenter après
                    // string-healing. Sinon l'injection de la videoSource ci-dessous serait sautée
                    // alors que le healer aval, lui, finirait par réparer le JSON → .h5p sans vidéo.
                    try {
                        const { healJsonString } = await import('../h5p/json-healer.js');
                        parsed = JSON.parse(healJsonString(jsonInput));
                    } catch { /* irréparable ici : le healer aval notifiera l'erreur */ }
                }
                // Tableau nu (l'IA externe renvoie souvent directement la liste des questions) :
                // envelopper AVANT l'injection. Poser videoSource sur un Array serait perdu
                // silencieusement (JSON.stringify ne sérialise pas les propriétés nommées d'un
                // tableau) et snapVideoTimestamps ne verrait pas les interactions.
                if (Array.isArray(parsed)) parsed = { interactions: parsed };
                if (parsed && typeof parsed === 'object') jsonInput = JSON.stringify(parsed);
                const jsonVideoUrl = (parsed && typeof parsed === 'object' && parsed.videoSource)
                    ? (typeof parsed.videoSource === 'string' ? parsed.videoSource.trim() : ((parsed.videoSource.url || '').trim()))
                    : '';
                const st = videoStates.get(moduleKey);
                const detectReady = isVideoReady(moduleKey) && st && st.detect;

                if (!detectReady && !jsonVideoUrl) {
                    showNotification(translations.video_need_url || 'Saisissez d\'abord une URL vidéo et récupérez la transcription, ou collez un JSON contenant une videoSource.', 'error');
                    return;
                }

                // La videoSource du JSON collé PRIME : si le JSON embarque déjà sa propre vidéo
                // (collage d'un JSON tout prêt), c'est elle qui est lue — pas l'URL restée dans le
                // champ du haut. Sinon (cas normal : JSON issu de l'IA, sans vidéo), on injecte la
                // source détectée depuis l'URL saisie + la piste de sous-titres récupérée.
                if (!jsonVideoUrl && detectReady && parsed && typeof parsed === 'object') {
                    // Caler les timestamps sur les horodatages RÉELS si une transcription est dispo
                    // (cas « copier le prompt → coller la sortie d'un LLM externe »). Aucun plafond :
                    // toutes les questions curées par l'enseignant sont conservées.
                    snapVideoTimestamps(parsed, st.transcript, st.detect);
                    parsed.videoSource = st.detect.videoSource;
                    // Durée → borne haute des timestamps côté processeur (l'IA hallucine parfois au-delà).
                    if (typeof st.detect.duration === 'number' && st.detect.duration > 0) parsed.duration = st.detect.duration;
                    if (st.transcript && st.transcript.captionUrl) {
                        parsed.transcript = { source: st.transcript.source, language: st.transcript.language || 'fr', captionUrl: st.transcript.captionUrl };
                    }
                    if (!parsed.title) parsed.title = st.detect.title || translations.h5p_interactive_video_name || 'Vidéo interactive';
                    jsonInput = JSON.stringify(parsed);
                }
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
        addSidebarDocumentClickListener((e) => {
            if (!modelSelectorBtn.contains(e.target) && !modelDropdown.contains(e.target)) {
                if (modelDropdown.classList.contains('show')) {
                    closeDropdown();
                }
            }
        });
    }

    llmBtn.addEventListener('click', async () => {
        // Verrou + génération « Image interactive » : zones (vision) → IA → JSON intermédiaire.
        // L'image de fond et l'alt sont injectés par Caramel (jamais demandés au LLM).
        if (module && module.requiresBackgroundImage) {
            const st = imageHotspotStates.get(moduleKey);
            if (!st || !st.zones || !st.zones.length) {
                showNotification(translations.ih_need_image || 'Joignez d’abord une image de fond (la détection des zones se lance automatiquement).', 'error');
                return;
            }
            const jsonInputTarget = container.querySelector(`#${jsonInputId}`);
            startCaramelAnimation();
            try {
                const prompt = buildImageHotspotsPrompt(st.zones, { width: st.width, height: st.height }, st.imageDescription, prefixForModule(moduleKey));
                if (jsonInputTarget) jsonInputTarget.value = '';
                safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);
                preloadForPostGeneration(moduleKey);

                const activityMeta = {
                    moduleKey, category: 'h5p',
                    nameKey: module.name, englishName: module.englishName, machineName: module.machineName,
                    displayName: (translations && translations[module.name]) || module.englishName || moduleKey
                };
                const cv = getCaramelVersionFromFooter();
                if (cv) activityMeta.caramelVersion = cv;

                const content = await generateH5PWithLLM(prompt, selectedModel, activityMeta);
                if (content) {
                    let parsed = null;
                    try { parsed = JSON.parse(content); } catch { parsed = null; }
                    if (!parsed) {
                        // Rattrapage healer : sans lui, un JSON à réparer partirait au creator
                        // SANS injection de l'image de fond (audit N1, scénario 3).
                        try {
                            const { healJsonString } = await import('../h5p/json-healer.js');
                            parsed = JSON.parse(healJsonString(content));
                        } catch { parsed = null; }
                    }
                    if (parsed && typeof parsed === 'object') {
                        parsed.image = st.image;
                        // Champs propres au format plat d'Image interactive (cf. collage manuel).
                        if (moduleKey === 'ImageHotspots') {
                            if (!parsed.backgroundImageAltText) parsed.backgroundImageAltText = st.altText || '';
                            if (!parsed.globalIconType) parsed.globalIconType = 'numbers';
                        }
                        jsonInputTarget.value = JSON.stringify(parsed, null, 2);
                    } else {
                        jsonInputTarget.value = content;
                    }
                    const ihCreateBtn = document.getElementById(module.createBtnId);
                    if (ihCreateBtn) ihCreateBtn.click();
                    closeSidebar();
                } else {
                    jsonInputTarget.value = translations.generation_failed_empty;
                    showNotification(translations.generation_failed_empty, 'error');
                    stopCaramelAnimation();
                }
            } catch (error) {
                signalerFinGeneration(error, jsonInputTarget, 'Génération image interactive');
            }
            return;
        }

        // Verrou + génération « Vidéo interactive » : transcription → IA → JSON intermédiaire.
        if (module && module.requiresVideoUrl) {
            const st = videoStates.get(moduleKey);
            if (!st || !st.detect || !st.detect.playable) {
                showNotification(translations.video_need_url || 'Saisissez d\'abord une URL vidéo et récupérez la transcription.', 'error');
                return;
            }
            const jsonInputTarget = container.querySelector(`#${jsonInputId}`);
            const usable = (t) => t && !t.error
                && ((Array.isArray(t.segments) && t.segments.length > 0) || (t.untimed && t.text));

            startCaramelAnimation();
            try {
                let transcript = st.transcript;
                // Pas de transcription en cache → voie automatique (captions déjà tentées au detect ;
                // ici surtout Albert pour PeerTube sans sous-titres).
                if (!usable(transcript)) {
                    const { fetchTranscript } = await import('../services/video-transcript.js');
                    transcript = await fetchTranscript(st.url, st.detect);
                    if (usable(transcript)) { st.transcript = transcript; videoStates.set(moduleKey, st); }
                }
                // Toujours rien → révéler le collage manuel (filet de sécurité) et s'arrêter.
                if (!usable(transcript)) {
                    stopCaramelAnimation();
                    revealVideoManual(moduleKey);
                    showNotification(translations.video_albert_failed || 'Transcription automatique indisponible. Collez la transcription ci-dessous, puis « Utiliser cette transcription ».', 'error');
                    return;
                }

                // Segments pour le prompt (transcription non timée → 1 bloc couvrant la durée).
                const segs = (transcript.segments && transcript.segments.length)
                    ? transcript.segments
                    : (transcript.text ? [{ start: 0, end: st.detect.duration || 0, text: transcript.text }] : []);
                const prompt = buildVideoInteractivePrompt(segs, st.detect.duration);

                if (jsonInputTarget) jsonInputTarget.value = '';
                safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);
                preloadForPostGeneration(moduleKey);

                const activityMeta = {
                    moduleKey, category: 'h5p',
                    nameKey: module.name, englishName: module.englishName, machineName: module.machineName,
                    displayName: (translations && translations[module.name]) || module.englishName || moduleKey
                };
                const cv = getCaramelVersionFromFooter();
                if (cv) activityMeta.caramelVersion = cv;

                const content = await generateH5PWithLLM(prompt, selectedModel, activityMeta);
                if (content) {
                    // Injecter la source de lecture + la piste de sous-titres (non demandées au LLM).
                    let parsed = null;
                    try { parsed = JSON.parse(content); } catch { parsed = null; }
                    if (parsed && typeof parsed === 'object') {
                        // Caler les timestamps sur les horodatages RÉELS (déterministe, tous modèles).
                        snapVideoTimestamps(parsed, transcript, st.detect);
                        parsed.videoSource = st.detect.videoSource;
                        // Durée → borne haute des timestamps côté processeur (l'IA hallucine parfois au-delà).
                        if (typeof st.detect.duration === 'number' && st.detect.duration > 0) parsed.duration = st.detect.duration;
                        if (transcript.captionUrl) {
                            parsed.transcript = { source: transcript.source, language: transcript.language || 'fr', captionUrl: transcript.captionUrl };
                        }
                        if (!parsed.title) parsed.title = st.detect.title || translations.h5p_interactive_video_name || 'Vidéo interactive';
                        jsonInputTarget.value = JSON.stringify(parsed, null, 2);
                    } else {
                        jsonInputTarget.value = content;
                    }
                    const ivCreateBtn = document.getElementById(module.createBtnId);
                    if (ivCreateBtn) ivCreateBtn.click();
                    closeSidebar();
                } else {
                    jsonInputTarget.value = translations.generation_failed_empty;
                    showNotification(translations.generation_failed_empty, 'error');
                    stopCaramelAnimation();
                }
            } catch (error) {
                signalerFinGeneration(error, jsonInputTarget, 'Génération vidéo interactive');
            }
            return;
        }

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
        safeSession.remove(`${STORAGE_PREFIX}json_${moduleKey}`);

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
            const content = await generateActivityContent(moduleKey, module, prompt, selectedModel, activityMeta);
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

                // Fermeture de la sidebar (la modale de résultat prend le relais).
                // Dictée : le processor est ASYNC (la synthèse des voix démarre APRÈS le
                // clic) — fermer ici faisait disparaître la sidebar en plein milieu de la
                // génération (retour de test 2026-07). Elle reste donc affichée en fond
                // jusqu'à generation:complete ; en cas d'erreur de synthèse elle reste
                // ouverte (relance facile).
                if (moduleKey === 'Dictation') {
                    const onGenDone = () => { cleanupGenListeners(); closeSidebar(); };
                    const onGenError = () => cleanupGenListeners();
                    const cleanupGenListeners = () => {
                        document.removeEventListener('generation:complete', onGenDone);
                        document.removeEventListener('generation:error', onGenError);
                    };
                    document.addEventListener('generation:complete', onGenDone, { once: true });
                    document.addEventListener('generation:error', onGenError, { once: true });
                } else {
                    closeSidebar();
                }
            } else {
                jsonInputTarget.value = translations.generation_failed_empty;
                showNotification(translations.generation_failed_empty, 'error');
                stopCaramelAnimation();
            }
        } catch (error) {
            signalerFinGeneration(error, jsonInputTarget, 'Génération standard');
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
        import('../simulators/index.js').catch(() => {});
    }
}

// =======================================================================
// 10. ANIMATION DE GÉNÉRATION "CARAMEL"
// =======================================================================
let recipeInterval;
let currentRecipeStepKey = '';

/**
 * Affiche l'étape/anecdote courante (texte qui défile, indépendant de la jauge).
 * Style uniforme (normal) pour la recette, la phrase de transition et les anecdotes.
 */
function renderRecipeStep() {
    const recipeSteps = document.getElementById('recipe-steps');
    if (!recipeSteps) return;
    recipeSteps.textContent = translations[currentRecipeStepKey] || currentRecipeStepKey || '';
}

function startCaramelAnimation() {
    const overlay = document.getElementById('caramel-animation-overlay');
    const marmiteContent = document.querySelector('.marmite-content');
    clearInterval(recipeInterval);   // évite deux défilés concurrents si déjà lancé
    clearTimeout(overlayFadeTimeout);
    overlay.classList.remove('closing');
    overlay.style.display = 'flex';
    resetBatchGauge(); // masque + ré-amorce la jauge de lots (sans effet sur une génération mono-appel)
    // Réarmement du drapeau d'annulation ici et NON dans `generateRawWithLLM` :
    // une génération par lots appelle cette dernière N fois et effacerait un
    // arrêt demandé entre deux lots.
    beginGeneration();
    armCancelButton();

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

    // Anecdotes « le saviez-vous » — affichées SEULEMENT après la recette (voir plus bas).
    // Découverte dynamique des clés traduites (caramel_animation_fact_1..N) : en ajouter une
    // dans les locales suffit, aucun tableau à maintenir ici.
    const factKeys = [];
    for (let i = 1; typeof translations[`caramel_animation_fact_${i}`] === 'string'; i++) {
        factKeys.push(`caramel_animation_fact_${i}`);
    }
    let factBag = [];
    const drawFact = () => {
        if (!factBag.length) factBag = factKeys.slice().sort(() => Math.random() - 0.5);
        return factBag.pop();
    };

    const STEP_MS = 3600;   // durée d'affichage d'une étape de recette (ralenti : lecture confortable)
    const FACT_MS = 6500;   // phrase de transition + anecdotes : plus longues à lire

    // Ordonnancement : on enchaîne les 11 étapes de recette DANS L'ORDRE (aucune
    // anecdote pendant la recette) ; UNE FOIS la recette au bout, une phrase de
    // transition (« En attendant que ça refroidisse… ») PUIS les anecdotes en boucle
    // (sac mélangé). Tout est affiché en style NORMAL (plus d'italique).
    let currentStep = 0;
    let recipeDone = false;
    let factsIntroShown = false;
    currentRecipeStepKey = steps[currentStep];
    renderRecipeStep();
    // Chaîne de setTimeout (durées variables) ; l'id reste compatible avec les
    // clearInterval() existants (timeouts et intervals partagent le même registre).
    const tick = () => {
        if (!recipeDone) {
            currentStep++;
            if (currentStep < steps.length) {          // étape suivante de la recette
                currentRecipeStepKey = steps[currentStep];
                renderRecipeStep();
                recipeInterval = setTimeout(tick, STEP_MS);
                return;
            }
            recipeDone = true;                          // recette terminée
        }
        if (factKeys.length > 0) {
            // Transition (une seule fois) avant de passer aux anecdotes.
            if (!factsIntroShown) {
                factsIntroShown = true;
                currentRecipeStepKey = 'caramel_animation_facts_intro';
                renderRecipeStep();                     // style NORMAL (pas d'italique)
                recipeInterval = setTimeout(tick, FACT_MS);
                return;
            }
            currentRecipeStepKey = drawFact();
            renderRecipeStep();                         // anecdotes en style NORMAL (pas d'italique)
            recipeInterval = setTimeout(tick, FACT_MS);
        } else {
            // Aucune anecdote disponible : on fige sur la dernière étape de recette.
            recipeInterval = setTimeout(tick, STEP_MS);
        }
    };
    recipeInterval = setTimeout(tick, STEP_MS);

    // Reset animation
    marmiteContent.style.animation = 'none';
    marmiteContent.offsetHeight; /* trigger reflow */
    marmiteContent.style.animation = null;
    marmiteContent.style.animation = 'fillMarmite 22s linear forwards';
}

// ── Bouton « Arrêter » de l'overlay de génération ────────────────────────────
// Un seul bouton pour les quatre chemins de génération (contextuelle, image
// interactive, vidéo interactive, standard) : ils partagent tous cet overlay,
// et tous passent par `generateRawWithLLM`, seul endroit où l'attente se coupe.

/** Rend le bouton d'arrêt visible et cliquable au début d'une génération. */
function armCancelButton() {
    const btn = document.getElementById('caramel-cancel-generation');
    if (!btn) return;
    btn.hidden = false;
    btn.disabled = false;
    const label = btn.querySelector('span');
    if (label) label.textContent = translations.generation_cancel_btn || 'Arrêter';
}

/**
 * Retire le bouton d'arrêt. Appelé en fin de génération, mais AUSSI quand on
 * bascule sur un traitement post-IA (`generation:processing` : synthèse vocale
 * de la Dictée, empaquetage…). À ce stade l'attente n'est plus interruptible :
 * laisser le bouton affiché promettrait un arrêt qui n'arriverait jamais.
 */
function disarmCancelButton() {
    const btn = document.getElementById('caramel-cancel-generation');
    if (btn) btn.hidden = true;
}

/**
 * Clic sur « Arrêter ». On coupe l'attente côté navigateur — la tâche déjà
 * soumise, elle, finit sa vie côté serveur : on ne le cache pas dans le message.
 * Le bouton reste AFFICHÉ mais désactivé le temps que la génération en cours
 * remonte son annulation, sinon un second clic relancerait l'interruption sur
 * une génération déjà arrêtée.
 */
function onCancelGenerationClick() {
    const btn = document.getElementById('caramel-cancel-generation');
    if (btn) {
        btn.disabled = true;
        const label = btn.querySelector('span');
        if (label) label.textContent = translations.generation_cancelling || 'Arrêt en cours…';
    }
    requestCancelGeneration();
}

/**
 * Compose le message affiché à l'enseignant quand une génération IA échoue.
 *
 * Les quatre chemins de génération (contextuelle, image interactive, vidéo
 * interactive, standard) affichaient jusqu'ici `error.message` BRUT : « Erreur du
 * proxy n8n (poll) : 502 Bad Gateway » ou « Unexpected token < in JSON », c'est-à-dire
 * un texte technique, non traduit, et sans indication de quoi faire ensuite.
 *
 * `classifyError` range l'erreur dans l'une des quatre familles (PARSE / NETWORK /
 * VALIDATION / PACKAGING) et fournit la clé i18n du conseil correspondant
 * (`error_network`, `error_parse`, …), traduite dans les 11 langues.
 *
 * La cause technique est CONSERVÉE (elle sert au signalement de bug) : on ajoute le
 * conseil, on ne remplace rien — le message existant reste un préfixe exact.
 *
 * @param {*} error - L'erreur levée (classifyError tolère toute valeur).
 * @returns {string} Message prêt à afficher.
 */
function messageEchecGeneration(error) {
    const { userMessageKey, technicalMessage, category } = classifyError(error);
    const tmpl = translations.generation_failed_llm || 'La génération a échoué. Cause : {errorMessage}';
    const base = tmpl.replace('{errorMessage}', technicalMessage);
    const conseil = translations[userMessageKey];
    debugLog('ui', `Échec de génération classé ${category} → ${userMessageKey}`, technicalMessage);
    return conseil ? `${base}\n${conseil}` : base;
}

/**
 * Fin anormale d'une génération, quel qu'en soit le chemin. Sépare deux choses
 * que les quatre blocs `catch` confondaient : l'ÉCHEC (le service a lâché, on
 * explique et on conseille) et l'ARRÊT DEMANDÉ (l'enseignant a cliqué, il sait
 * déjà pourquoi ça s'arrête — lui servir « La génération a échoué. Cause : … »
 * serait absurde, et écrire ce texte dans le champ JSON lui laisserait un
 * message d'erreur à effacer à la main avant de pouvoir réessayer).
 *
 * @param {*} error - l'erreur remontée.
 * @param {HTMLElement|null} jsonInputTarget - champ JSON de la sidebar, si présent.
 * @param {string} contexte - libellé pour la console (chemin de génération).
 */
function signalerFinGeneration(error, jsonInputTarget, contexte) {
    if (isCancellation(error)) {
        debugLog('ui', `${contexte} : génération interrompue par l'utilisateur.`);
        if (jsonInputTarget) jsonInputTarget.value = '';
        // `showNotification` ne connaît que deux statuts, 'error' et tout le
        // reste (cf. core/utils.js → addNotification). Un arrêt volontaire n'est
        // pas une erreur : on prend donc la branche neutre, explicitement, plutôt
        // qu'un 'info' que l'API ne reconnaît pas et retomberait ici sans le dire.
        showNotification(translations.generation_cancelled || 'Génération arrêtée.', 'success');
        stopCaramelAnimation();
        return;
    }
    console.error(`${contexte} :`, error);
    const errorMessage = messageEchecGeneration(error);
    showNotification(errorMessage, 'error');
    if (jsonInputTarget) jsonInputTarget.value = errorMessage;
    stopCaramelAnimation();
}

let overlayFadeTimeout = null;

/**
 * Arrête l'animation "marmite".
 * @param {boolean} fadeOut - Si true, l'overlay s'efface en fondu (300 ms) au lieu de
 *   disparaître d'un coup — utilisé quand la modale de résultat apparaît par-dessus,
 *   pour un enchaînement sans flash. Les chemins d'erreur gardent le masquage immédiat.
 */
function stopCaramelAnimation(fadeOut = false) {
    const overlay = document.getElementById('caramel-animation-overlay');
    clearInterval(recipeInterval);
    resetBatchGauge();
    disarmCancelButton();
    if (!overlay) return;
    clearTimeout(overlayFadeTimeout);
    if (fadeOut && overlay.style.display !== 'none') {
        overlay.classList.add('closing');
        overlayFadeTimeout = setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('closing');
        }, 300);
    } else {
        overlay.classList.remove('closing');
        overlay.style.display = 'none';
    }
}

// Amorce de la jauge : on démarre à 10 % pour montrer d'emblée que « ça avance ».
const BATCH_GAUGE_PRIMER = 0.10;

/** Masque la jauge de lots et la remet à son amorce (génération mono-appel ou fin de génération). */
function resetBatchGauge() {
    const gauge = document.getElementById('caramel-batch-gauge');
    if (!gauge) return;
    gauge.hidden = true;
    const fill = gauge.querySelector('.caramel-gauge__fill');
    if (fill) fill.style.width = Math.round(BATCH_GAUGE_PRIMER * 100) + '%';
    const label = gauge.querySelector('.caramel-gauge__label');
    if (label) label.textContent = '';
}

/**
 * Progression d'une génération PAR LOTS, affichée par une JAUGE stable sous le texte de
 * recette (le défilé décoratif reste intact, la jauge ne rebondit pas). La barre se remplit
 * selon la proportion de questions générées (amorcée à 10 % pour rassurer) ; label « Cuisson n/N ».
 * Appelé par generateInBatches via onProgress.
 * @param {{phase:'plan'|'fill', current:number, total:number, itemsDone?:number, itemsTotal?:number}} p
 */
function setBatchProgress(p) {
    const gauge = document.getElementById('caramel-batch-gauge');
    if (!gauge) return;
    gauge.hidden = false;
    const fill = gauge.querySelector('.caramel-gauge__fill');
    const label = gauge.querySelector('.caramel-gauge__label');

    let ratio, text;
    if (p.phase === 'plan') {
        ratio = BATCH_GAUGE_PRIMER;
        text = translations.batch_progress_plan || 'Préchauffage…';
    } else {
        const done = (p.itemsTotal > 0)
            ? (p.itemsDone / p.itemsTotal)
            : (p.total > 0 ? p.current / p.total : 0);
        ratio = BATCH_GAUGE_PRIMER + (1 - BATCH_GAUGE_PRIMER) * Math.max(0, Math.min(1, done));
        const tmpl = translations.batch_progress_fill || 'Cuisson {n}/{t}';
        text = tmpl.replace('{n}', p.current).replace('{t}', p.total);
    }
    const pct = Math.round(ratio * 100);
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = text;
    gauge.setAttribute('aria-valuenow', String(pct));
    if (text) gauge.setAttribute('aria-label', text);
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
    // fadeOut=true : l'overlay s'efface en fondu pendant que la carte de la modale
    // apparaît (fadeScaleIn 300 ms), sinon flash d'écran vide le temps du fade-in.
    stopCaramelAnimation(true);

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
        // Formats natifs à exclure du dropdown (déjà gérés par le bouton principal).
        // XML exclu aussi : ce dropdown ne gère QUE les documents (DOCX/ODT/PDF) — le
        // XML « banque de questions » se télécharge depuis la modale de visualisation
        // (sinon, le Test ayant MBZ pour format natif, XML y apparaîtrait en bouton mort).
        const nativeExt = fileName ? fileName.split('.').pop().toUpperCase() : '';
        const excludeFormats = [nativeExt, 'GIFT', 'HTML', 'XML'];
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
        import('../simulators/index.js').catch(() => {});
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
    // Écouter l'événement generation:error : arrêter l'animation "marmite" pour que
    // l'utilisateur voie la notification d'erreur (sinon l'overlay tourne pour toujours
    // en mode "Générer en un clic", le packaging étant fire & forget après le finally LLM).
    // L'UI revient à son état normal sans afficher de modale de résultat.
    document.addEventListener('generation:error', () => {
        stopCaramelAnimation();
    });

    // Traitement LONG côté processeur (ex. Dictée : synthèse vocale serveur, 5-30 s).
    // Couvre les DEUX flux : génération LLM interne (l'overlay est déjà affiché → on ne
    // touche pas) ET collage d'un JSON d'IA externe + « Générer » (aucune animation en
    // cours → on l'affiche pour faire patienter). L'étape de recette est figée sur le
    // libellé fourni (ex. « Enregistrement des voix… ») jusqu'au generation:complete/error.
    document.addEventListener('generation:processing', (e) => {
        const overlay = document.getElementById('caramel-animation-overlay');
        if (overlay && overlay.style.display !== 'flex') {
            startCaramelAnimation();
        }
        const stepKey = e.detail && e.detail.stepKey;
        if (stepKey) {
            clearInterval(recipeInterval); // fige le défilé décoratif sur l'étape réelle
            currentRecipeStepKey = stepKey;
            renderRecipeStep();
        }
        // L'IA a fini ; ce qui suit (synthèse vocale, empaquetage) n'est plus
        // interruptible. `startCaramelAnimation()` vient peut-être de réarmer le
        // bouton : on le retire pour ne pas promettre un arrêt impossible.
        disarmCancelButton();
    });

    // Bouton « Arrêter » de l'overlay : branché ici, une fois pour toutes. Le
    // bouton vit dans index.html et n'est jamais recréé, donc pas de risque de
    // double écoute — contrairement aux boutons de la sidebar, reconstruits à
    // chaque ouverture.
    const cancelBtn = document.getElementById('caramel-cancel-generation');
    if (cancelBtn) cancelBtn.addEventListener('click', onCancelGenerationClick);

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
                    // Après une édition, les images n'y sont plus que des chemins images/… :
                    // hydrate leurs dataURL depuis le .h5p (copie), sinon DOCX/ODT/PDF les perdent.
                    dataToExport = await hydrateImagesForExport(notification.blob, dataToExport);
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
                                if (grids.placements && grids.placements.length > 0) {
                                    dataToExport = { ...dataToExport, _cluePlacements: grids.placements };
                                }
                                if (grids.unplacedWords && grids.unplacedWords.length > 0) {
                                    dataToExport = { ...dataToExport, _unplacedWords: grids.unplacedWords };
                                }
                            }
                        } catch (err) {
                            console.warn('Capture grille échouée, export sans image:', err);
                        }
                    }
                    // Activités à image de fond (Image interactive, Find the Hotspot, Find Multiple
                    // Hotspots) : injecter le fond (ré-extrait du .h5p, registre vidé après
                    // packaging) → le formatter compose fond + pastilles numérotées.
                    else if ((resolvedKey === 'ImageHotspots' || resolvedKey === 'FindTheHotspot' || resolvedKey === 'FindMultipleHotspots') && notification.blob) {
                        try {
                            const { extractBackgroundFromH5p } = await import('../renderers/hotspot-overlay-renderer.js');
                            const bg = await extractBackgroundFromH5p(notification.blob, jsonDataToExport);
                            if (bg) dataToExport = { ...dataToExport, _backgroundImage: bg };
                        } catch (err) {
                            console.warn('Capture fond Image interactive échouée, export sans pastilles:', err);
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


