/**
 * @file Gestion du centre de notifications.
 * Ce module gère l'affichage du dropdown de notifications et l'interaction avec le bouton cloche.
 */

import { translations } from './translation.js';
import { loadJSZip } from './lib-loader.js';
import { H5PManager } from './h5p-manager.js';
import { renderMillionnaire, renderMatching, renderGlossary, renderQcmElea, renderEleaTest, renderPage } from '../simulators.js';
import { allModules } from './definitions.js';
import { downloadFile } from './utils.js';
import { generateMoodleXml, generateMoodleGift } from './moodle-formats.js';
import { initJsonEditor, destroyEditor, saveChanges, hasUnsavedChanges, isEditorActive, extractJsonFromNotification } from './json-editor/index.js';
import { processH5PContent } from './h5p-processors/index.js';
import { exportToDOCX, exportToPDF, exportToODT } from './document-exporter.js';

// ============= CONSTANTES =============
const MAX_NOTIFICATIONS = 20;

/**
 * Kill switch pour le bouton "Éditer" dans la modale de visualisation.
 * Permet de masquer la fonctionnalité en production tout en poursuivant le développement.
 * @constant {boolean}
 */
const ENABLE_EDIT_BUTTON = false;

// ============= SÉLECTEURS DOM =============
const notificationCenter = document.querySelector('.notification-center');
const notificationBtn = document.querySelector('.notification-btn');
const notificationDropdown = document.querySelector('.notification-dropdown');
const notificationBadge = document.querySelector('.notification-badge');
const languageSwitcher = document.querySelector('.language-switcher');

// ============= STOCKAGE EN MÉMOIRE (Session-only, pas de localStorage) =============
/**
 * @type {Array<Notification>}
 * @private
 * Liste des notifications en mémoire (perdue à la fermeture de l'onglet)
 */
let notifications = [];

/**
 * @typedef {Object} Notification
 * @property {string} id - ID unique (ex: 'notif_1704556320000_abc123')
 * @property {string} type - Type de fichier généré ('h5p', 'mbz', etc.)
 * @property {string} title - Titre affiché dans la notification
 * @property {string|null} titleKey - Clé de traduction pour le titre (optionnel, pour la traduction dynamique)
 * @property {number} timestamp - Horodatage Date.now()
 * @property {Blob} blob - Fichier généré (pour re-téléchargement)
 * @property {string} blobUrl - URL blob créée via URL.createObjectURL()
 * @property {'success'|'error'} status - Statut de la notification
 * @property {Object|null} jsonData - Données JSON brutes pour les simulateurs (optionnel)
 * @property {string|null} errorMessage - Message d'erreur si status === 'error'
 */

// ============= FONCTIONS UTILITAIRES =============

/**
 * Génère un ID unique pour une notification.
 * @returns {string} ID au format 'notif_timestamp_random'
 * @private
 */
function generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une notification avec un ID unique et une blobUrl.
 * @param {Object} data - Données de la notification
 * @param {string} data.type - Type de fichier
 * @param {string} data.title - Titre
 * @param {string} [data.titleKey] - Clé de traduction pour le titre (optionnel)
 * @param {Blob} data.blob - Fichier blob
 * @param {'success'|'error'} data.status - Statut
 * @param {string} [data.errorMessage] - Message d'erreur optionnel
 * @returns {Notification} Notification complète
 * @throws {Error} Si les données sont invalides ou incomplètes
 * @private
 */
function createNotification(data) {
    // ✅ Input validation to prevent invalid notifications
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid notification data: data must be an object');
    }
    if (!data.type || typeof data.type !== 'string') {
        throw new Error('Invalid notification data: type is required and must be a string');
    }
    if (!data.title || typeof data.title !== 'string') {
        throw new Error('Invalid notification data: title is required and must be a string');
    }
    if (data.type !== 'alert' && (!data.blob || !(data.blob instanceof Blob))) {
        throw new Error('Invalid notification data: blob is required and must be a Blob instance (unless type is "alert")');
    }

    const blobUrl = data.blob ? URL.createObjectURL(data.blob) : null;
    return {
        id: generateId(),
        type: data.type,
        title: data.title,
        titleKey: data.titleKey || null,
        fileName: data.fileName || null,
        timestamp: Date.now(),
        blob: data.blob || null,
        blobUrl: blobUrl,
        status: data.status || 'success',
        jsonData: data.jsonData || null,
        previewHtml: data.previewHtml || null,
        errorMessage: data.errorMessage || null
    };
}

// ============= FONCTIONS PRIVÉES DE MISE À JOUR UI =============

/**
 * Résout le titre traduit d'une notification.
 * Si titleKey est défini, utilise la traduction, sinon utilise le titre statique.
 * @param {Notification} notification - La notification
 * @returns {string} Le titre traduit ou le titre statique
 * @private
 */
function getNotificationTitle(notification) {
    if (notification.titleKey && translations && translations[notification.titleKey]) {
        return translations[notification.titleKey];
    }
    return notification.title;
}

/**
 * Met à jour le badge compteur de notifications.
 * @private
 */
function updateBadge() {
    if (!notificationBadge) return;

    const count = notifications.length;
    notificationBadge.textContent = count.toString();
    notificationBadge.setAttribute('data-count', count.toString());
}

/**
 * Met à jour l'indicateur d'erreur (point rouge).
 * Affiche le point rouge s'il y a au moins une notification en erreur.
 * @private
 */
function updateErrorIndicator() {
    if (!notificationBtn) return;

    const hasError = notifications.some(notif => notif.status === 'error');

    if (hasError) {
        notificationBtn.classList.add('has-error');
    } else {
        notificationBtn.classList.remove('has-error');
    }
}

// ============= FONCTIONS PUBLIQUES CRUD =============

/**
 * Ajoute une notification à la liste.
 * Gère automatiquement la limite FIFO de 20 notifications.
 * @param {Object} data - Données de la notification
 * @returns {string} ID de la notification créée
 */
export function addNotification(data) {
    const notification = createNotification(data);

    // Ajouter en début de liste (plus récente en premier)
    notifications.unshift(notification);

    // Gestion FIFO : si plus de 20 notifications, supprimer la plus ancienne
    if (notifications.length > MAX_NOTIFICATIONS) {
        const removed = notifications.pop(); // Retirer la dernière (plus ancienne)
        if (removed && removed.blobUrl) {
            URL.revokeObjectURL(removed.blobUrl);
        }
    }

    // Mise à jour UI
    updateBadge();
    updateErrorIndicator();

    // Émettre événement
    document.dispatchEvent(new CustomEvent('notification:added', {
        detail: notification
    }));

    return notification.id;
}

/**
 * Supprime une notification spécifique par son ID.
 * @param {string} id - ID de la notification à supprimer
 * @returns {boolean} true si supprimée, false sinon
 */
export function removeNotification(id) {
    const index = notifications.findIndex(notif => notif.id === id);

    if (index === -1) return false;

    const notification = notifications[index];

    // Révoquer la blob URL pour éviter les fuites mémoire
    if (notification.blobUrl) {
        URL.revokeObjectURL(notification.blobUrl);
    }

    // Supprimer de la liste
    notifications.splice(index, 1);

    // Mise à jour UI
    updateBadge();
    updateErrorIndicator();

    // Émettre événement
    document.dispatchEvent(new CustomEvent('notification:removed', {
        detail: { id }
    }));

    return true;
}

/**
 * Supprime toutes les notifications.
 */
export function clearAllNotifications() {
    // Révoquer toutes les blob URLs
    notifications.forEach(notif => {
        if (notif.blobUrl) {
            URL.revokeObjectURL(notif.blobUrl);
        }
    });

    // Vider la liste
    notifications = [];

    // Mise à jour UI
    updateBadge();
    updateErrorIndicator();

    // Émettre événement
    document.dispatchEvent(new CustomEvent('notification:cleared'));
}

/**
 * Retourne la liste des notifications triée par timestamp décroissant.
 * @returns {Notification[]} Liste des notifications (plus récente en premier)
 */
export function getNotifications() {
    // Déjà triées (unshift met les nouvelles en premier)
    return [...notifications];
}

/**
 * Retourne une notification par son ID.
 * @param {string} id - ID de la notification
 * @returns {Notification|null} La notification ou null si non trouvée
 */
export function getNotificationById(id) {
    return notifications.find(notif => notif.id === id) || null;
}

/**
 * Retourne le nombre de notifications.
 * @returns {number} Nombre de notifications
 */
export function getNotificationCount() {
    return notifications.length;
}

/**
 * Vérifie s'il y a au moins une notification en erreur.
 * @returns {boolean} true si au moins une erreur
 */
export function hasErrors() {
    return notifications.some(notif => notif.status === 'error');
}

// ============= INITIALISATION UI =============

/**
 * Initialise le centre de notifications avec les écouteurs d'événements.
 */
export function initNotificationCenter() {
    if (!notificationBtn || !notificationCenter) return;

    // Toggle du dropdown au clic sur le bouton
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Fermer le language switcher s'il est ouvert
        if (languageSwitcher && languageSwitcher.classList.contains('open')) {
            languageSwitcher.classList.remove('open');
        }

        // Toggle du notification center
        notificationCenter.classList.toggle('open');

        // Mettre à jour aria-expanded
        const isOpen = notificationCenter.classList.contains('open');
        notificationBtn.setAttribute('aria-expanded', isOpen.toString());
    });

    // Support clavier (Enter/Space)
    notificationBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            notificationBtn.click();
        }
    });

    // Fermer si clic en dehors
    document.addEventListener('click', (e) => {
        if (notificationCenter &&
            !notificationCenter.contains(e.target) &&
            !(notificationBtn && notificationBtn.contains(e.target))) {
            notificationCenter.classList.remove('open');
            notificationBtn?.setAttribute('aria-expanded', 'false');
        }
    });

    // Écouter l'ouverture du language switcher pour fermer les notifications
    if (languageSwitcher) {
        const langBtn = languageSwitcher.querySelector('.language-btn');
        if (langBtn) {
            langBtn.addEventListener('click', () => {
                if (notificationCenter.classList.contains('open')) {
                    notificationCenter.classList.remove('open');
                    notificationBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }
}

// ============= FONCTIONS DE RENDU =============

/**
 * Formate la date/heure d'une notification.
 * @param {number} timestamp - Timestamp de la notification
 * @returns {string} Chaîne formatée (ex: "14:32 - Aujourd'hui" ou "14:32 - 06/01/2026")
 * @private
 */
function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Récupérer la traduction pour "today"
    const todayText = translations.today || 'Aujourd\'hui';

    if (date.toDateString() === now.toDateString()) {
        return `${hours}:${minutes}`;
    }
    return `${hours}:${minutes} - ${date.toLocaleDateString()}`;
}

/**
 * Échappe les caractères HTML pour prévenir les attaques XSS.
 * @param {string} unsafe - Chaîne potentiellement dangereuse
 * @returns {string} Chaîne sécurisée avec caractères HTML échappés
 * @private
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Génère le HTML d'une notification item.
 * @param {Notification} notification - La notification à rendre
 * @returns {string} HTML de la notification
 * @private
 */
function renderNotificationItem(notification) {
    const isError = notification.status === 'error';
    const errorClass = isError ? ' error' : '';
    const timeStr = formatNotificationTime(notification.timestamp);

    // Récupérer les traductions
    const viewText = translations.view || 'Visualiser';

    // ✅ Sanitize user-controlled data to prevent XSS
    const safeTitle = escapeHtml(getNotificationTitle(notification));
    const safeErrorMsg = escapeHtml(notification.errorMessage);

    // Trouver le module pour l'icône
    let moduleDef = null;
    if (notification.titleKey) {
        moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
    }
    const iconHtml = moduleDef && moduleDef.image ? `<img src="${moduleDef.image}" class="notification-item__icon" alt="">` : '';

    if (isError) {
        // Template erreur
        return `
            <div class="notification-item${errorClass} type-${notification.type}" data-id="${notification.id}">
                <div class="notification-item__header">
                    <span class="notification-item__title">
                        ${iconHtml || '<i class="fas fa-exclamation-triangle"></i>'}
                        ${safeTitle}
                    </span>
                    <span class="notification-item__time">${timeStr}</span>
                    <button class="notification-item__close" aria-label="Supprimer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-item__body">
                    <p class="notification-item__error">${safeErrorMsg}</p>
                </div>
            </div>
        `;
    } else {
        // Template succès
        const fileName = notification.fileName ? `<span class="notification-item__filename" title="${escapeHtml(notification.fileName)}">${escapeHtml(notification.fileName)}</span>` : '';
        return `
            <div class="notification-item${errorClass} type-${notification.type}" data-id="${notification.id}">
                <div class="notification-item__header">
                    <span class="notification-item__title">
                        ${iconHtml}
                        ${safeTitle}
                    </span>
                    <span class="notification-item__time">${timeStr}</span>
                    <button class="notification-item__close" aria-label="Supprimer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-item__body">
                    ${fileName}
                    ${notification.blob ? `<button class="notification-item__btn" data-key="view">${viewText}</button>` : ''}
                </div>
            </div>
        `;
    }
}

/**
 * Rend la liste complète des notifications dans le DOM.
 * @private
 */
function renderNotificationList() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;

    // Récupérer les notifications (déjà triées par timestamp décroissant)
    const notifs = getNotifications();

    // ✅ Build complete HTML string once (optimized performance)
    const htmlString = notifs
        .map(notification => renderNotificationItem(notification))
        .join('');

    // ✅ Single DOM update
    notificationList.innerHTML = htmlString;
}

/**
 * Gère les clics sur les éléments de notification (suppression et visualisation).
 * Utilise event delegation pour une seule écoute sur le parent.
 * @param {Event} e - L'événement de clic
 * @private
 */
function handleNotificationClick(e) {
    const closeBtn = e.target.closest('.notification-item__close');
    if (closeBtn) {
        e.stopPropagation(); // Empêcher la fermeture du menu
        const item = closeBtn.closest('.notification-item');
        const id = item?.dataset.id;
        if (id) {
            removeNotification(id);
        }
        return;
    }

    const viewBtn = e.target.closest('.notification-item__btn');
    if (viewBtn) {
        const item = viewBtn.closest('.notification-item');
        const id = item?.dataset.id;
        if (id) {
            // Émettre l'événement notification:preview
            document.dispatchEvent(new CustomEvent('notification:preview', {
                detail: { id }
            }));
        }
    }
}

/**
 * Initialise le rendu et les événements du dropdown.
 * À appeler après initNotificationCenter().
 */
export function initNotificationDropdown() {
    // ✅ Attach event listener ONCE to parent (fixes memory leak)
    const notificationList = document.querySelector('.notification-list');
    if (notificationList) {
        notificationList.addEventListener('click', handleNotificationClick);
    }

    // Render initial
    renderNotificationList();

    // Écouter les événements de modification des notifications
    document.addEventListener('notification:added', () => {
        renderNotificationList();
    });

    document.addEventListener('notification:removed', () => {
        renderNotificationList();
    });

    document.addEventListener('notification:cleared', () => {
        renderNotificationList();
    });

    // Écouter le changement de langue pour rafraîchir les traductions
    window.addEventListener('caramel:language-changed', () => {
        renderNotificationList();
        // Si une modale de prévisualisation est ouverte, la rafraîchir aussi
        if (currentPreviewModal) {
            const notification = getNotificationById(currentPreviewModal);
            if (notification) {
                // Rafraîchir le texte du titre et l'icône
                const titleElement = document.querySelector('.preview-modal__title');
                const iconElement = document.querySelector('.preview-modal__icon');
                if (titleElement) {
                    titleElement.innerHTML = escapeHtml(getNotificationTitle(notification));
                }

                if (iconElement) {
                    let moduleDef = null;
                    if (notification.titleKey) {
                        moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
                    }
                    if (moduleDef && moduleDef.image) {
                        iconElement.src = moduleDef.image;
                        iconElement.alt = translations[moduleDef.name] || '';
                        iconElement.style.display = 'block';
                    } else {
                        iconElement.style.display = 'none';
                    }
                }

                // Rafraîchir le warning (Disclaimer)
                const warningDiv = document.querySelector('.preview-modal__warning');
                const contentDiv = document.querySelector('.preview-modal__content');
                if (warningDiv && contentDiv) {
                    if (notification.type === 'h5p') {
                        warningDiv.style.display = 'none';
                        contentDiv.classList.remove('has-warning');
                    } else {
                        const warningText = translations.simulator_warning || "Prévisualisation via le simulateur d'activités : le rendu final sur Éléa peut être légèrement différent.";
                        warningDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${escapeHtml(warningText)}`;
                        warningDiv.style.display = 'flex';
                        contentDiv.classList.add('has-warning');
                    }
                }
            }
        }
    });

    // Event listener sur le bouton "Tout effacer"
    const clearAllBtn = document.querySelector('.notification-dropdown__clear');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            clearAllNotifications();
        });
    }

    // Re-render quand on ouvre le panneau (pour s'assurer que c'est à jour)
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            if (notificationCenter.classList.contains('open')) {
                renderNotificationList();
            }
        });
    }
}

// ============= TOAST POPUP FUNCTIONALITY =============

let currentToast = null;
let currentToastTimer = null;
let currentEscapeHandler = null;

/**
 * Affiche un toast popup pour une notification.
 * @param {Notification} notification - La notification à afficher
 * @private
 */
function showToast(notification) {
    const container = document.getElementById('notification-toast-container');
    if (!container) return;

    // Si un toast existe déjà, le remplacer
    if (currentToast) {
        clearTimeout(currentToastTimer);
        // Retirer l'ancien handler Escape pour éviter la fuite mémoire
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }
        currentToast.remove();
        currentToast = null;
    }

    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `notification-toast${notification.status === 'error' ? ' error' : ''} type-${notification.type}`;
    toast.setAttribute('data-id', notification.id);
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const timeStr = formatNotificationTime(notification.timestamp);
    const viewText = translations.view || 'Visualiser';
    const safeTitle = escapeHtml(getNotificationTitle(notification));
    const safeErrorMsg = escapeHtml(notification.errorMessage);

    // Trouver le module pour l'icône
    let moduleDef = null;
    if (notification.titleKey) {
        moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
    }
    const iconHtml = moduleDef && moduleDef.image ? `<img src="${moduleDef.image}" class="notification-toast__icon" alt="">` : '';

    // Construire le contenu du toast
    toast.innerHTML = `
        <div class="notification-toast__header">
            <span class="notification-toast__title">
                ${iconHtml || (notification.status === 'error' ? '<i class="fas fa-exclamation-triangle" style="color: #FF3B30; margin-right: 6px;"></i>' : '')}
                ${safeTitle}
            </span>
            <span class="notification-toast__time">${timeStr}</span>
            <button class="notification-toast__close" aria-label="Fermer la notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
        ${notification.status === 'error' ? `<p class="notification-toast__error">${safeErrorMsg}</p>` : ''}
        ${notification.status === 'success' && notification.blob ? `<button class="notification-toast__btn" data-key="view">${viewText}</button>` : ''}
    `;

    // Ajouter au container
    container.appendChild(toast);
    currentToast = toast;

    // Ajouter l'animation d'entrée
    toast.classList.add('entering');

    // Retirer la classe entering après l'animation (300ms)
    setTimeout(() => {
        toast.classList.remove('entering');
    }, 300);

    // Timer de 6 secondes pour fermer automatiquement
    currentToastTimer = setTimeout(() => {
        dismissToast(toast);
    }, 6000);

    // Event listeners pour les boutons
    setupToastInteractions(toast);
}

/**
 * Configure les interactions du toast (boutons close et visualiser).
 * @param {HTMLElement} toast - L'élément toast
 * @private
 */
function setupToastInteractions(toast) {
    // Bouton fermer
    const closeBtn = toast.querySelector('.notification-toast__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(currentToastTimer);
            dismissToast(toast);
        });
    }

    // Bouton visualiser
    const viewBtn = toast.querySelector('.notification-toast__btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            clearTimeout(currentToastTimer);
            const notificationId = toast.getAttribute('data-id');

            // Retirer le toast sans animation vers la cloche
            toast.remove();
            currentToast = null;

            // Nettoyer le handler Escape
            if (currentEscapeHandler) {
                document.removeEventListener('keydown', currentEscapeHandler);
                currentEscapeHandler = null;
            }

            // Émettre l'événement notification:preview
            if (notificationId) {
                document.dispatchEvent(new CustomEvent('notification:preview', {
                    detail: { id: notificationId }
                }));
            }
        });
    }

    // Support clavier (Escape pour fermer)
    const handleEscape = (e) => {
        if (e.key === 'Escape' && currentToast === toast) {
            clearTimeout(currentToastTimer);
            dismissToast(toast);
            // Cleanup sera fait dans dismissToast
        }
    };
    currentEscapeHandler = handleEscape;
    document.addEventListener('keydown', currentEscapeHandler);
}

/**
 * Calcule l'offset vers la cloche pour l'animation flyToBell.
 * @param {HTMLElement} toastElement - L'élément toast
 * @private
 */
function calculateBellOffset(toastElement) {
    const toast = toastElement.getBoundingClientRect();
    const bell = document.querySelector('.notification-btn');
    if (!bell) return;

    const bellRect = bell.getBoundingClientRect();

    const offsetX = bellRect.left + bellRect.width / 2 - (toast.left + toast.width / 2);
    const offsetY = bellRect.top + bellRect.height / 2 - (toast.top + toast.height / 2);

    toastElement.style.setProperty('--bell-offset-x', `${offsetX}px`);
    toastElement.style.setProperty('--bell-offset-y', `${offsetY}px`);
}

/**
 * Fait disparaître le toast avec l'animation vers la cloche.
 * @param {HTMLElement} toastElement - L'élément toast
 * @private
 */
async function dismissToast(toastElement) {
    // 1. Calculer l'offset vers la cloche
    calculateBellOffset(toastElement);

    // 2. Lancer l'animation flyToBell
    toastElement.classList.add('exiting');

    // 3. Attendre la fin de l'animation (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    // 4. Retirer le toast du DOM
    toastElement.remove();
    if (currentToast === toastElement) {
        currentToast = null;
    }

    // 5. Nettoyer le handler Escape
    if (currentEscapeHandler) {
        document.removeEventListener('keydown', currentEscapeHandler);
        currentEscapeHandler = null;
    }

    // 6. Pulse sur le badge
    if (notificationBadge) {
        notificationBadge.classList.add('incrementing');
        setTimeout(() => {
            notificationBadge.classList.remove('incrementing');
        }, 200);
    }
}

/**
 * Initialise le système de toast popup.
 * À appeler après initNotificationCenter().
 */
export function initToastNotifications() {
    // Écouter l'événement notification:added pour afficher le toast
    document.addEventListener('notification:added', (e) => {
        showToast(e.detail);
    });
}

// ============= PREVIEW MODAL FUNCTIONALITY =============

let currentPreviewModal = null;
let previousFocusElement = null;
let focusTrapCleanup = null;
const h5pManager = new H5PManager();

/** @type {boolean} - Indique si le mode édition est actif */
let isEditModeActive = false;

/** @type {HTMLElement|null} - Sauvegarde du contenu preview pour restauration */
let savedPreviewContent = null;

/** @type {string|null} - Sauvegarde du contenu du footer pour restauration */
let savedFooterContent = null;

/**
 * Mapping des types de fichier vers les plateformes compatibles.
 * @private
 */
const platformsByType = {
    'h5p': ['Élea', 'Moodle', 'Magistère', 'Digiquiz'],
    'mbz': ['Moodle', 'Élea'],
    'scorm': ['Moodle', 'Élea', 'Magistère']
};

/**
 * Ouvre la modale de prévisualisation pour une notification.
 * @param {string} notificationId - ID de la notification à prévisualiser
 * @private
 */
function openPreviewModal(notificationId) {
    const overlay = document.querySelector('.preview-modal-overlay');
    const modal = document.querySelector('.preview-modal');

    if (!overlay || !modal) return;

    // Réinitialiser l'état du mode édition (au cas où il serait resté actif)
    if (isEditModeActive || savedFooterContent) {
        resetEditModeState(modal);
    }

    // Retirer les classes CSS du mode édition si elles sont présentes
    const previewContainer = modal.querySelector('.preview-modal__preview');
    if (previewContainer) {
        previewContainer.classList.remove('preview-modal__preview--editor');
    }
    const content = modal.querySelector('.preview-modal__content');
    if (content) {
        content.classList.remove('preview-modal__content--editor');
    }

    // Récupérer la notification
    const notification = getNotificationById(notificationId);

    // Gestion erreur : notification introuvable, blob invalide, ou status error
    if (!notification) {
        console.error('Notification not found:', notificationId);
        return;
    }

    // ✅ Ne pas ouvrir la modale pour les notifications en erreur
    if (notification.status === 'error') {
        console.warn('Cannot preview notification with error status:', notificationId);
        return;
    }

    if (!notification.blob || !(notification.blob instanceof Blob)) {
        console.error('Invalid blob for notification:', notificationId);
        return;
    }

    // Stocker l'élément actuellement focusé pour restauration
    previousFocusElement = document.activeElement;

    // Mettre à jour le titre et l'icône (avec échappement XSS)
    const titleElement = modal.querySelector('.preview-modal__title');
    const iconElement = modal.querySelector('.preview-modal__icon');
    if (titleElement) {
        titleElement.innerHTML = escapeHtml(getNotificationTitle(notification));
    }

    if (iconElement) {
        // Trouver le module pour récupérer son image
        let moduleDef = null;
        if (notification.titleKey) {
            moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
        }

        if (moduleDef && moduleDef.image) {
            iconElement.src = moduleDef.image;
            iconElement.alt = translations[moduleDef.name] || '';
            iconElement.style.display = 'block';
        } else {
            iconElement.style.display = 'none';
        }
    }

    // Mettre à jour le warning (Disclaimer pour simulateurs)
    const warningDiv = modal.querySelector('.preview-modal__warning');
    const contentDiv = modal.querySelector('.preview-modal__content');

    if (warningDiv && contentDiv) {
        if (notification.type === 'h5p') {
            warningDiv.style.display = 'none';
            contentDiv.classList.remove('has-warning');
        } else {
            const warningText = translations.simulator_warning || "Prévisualisation via le simulateur d'activités : le rendu final sur Éléa peut être légèrement différent.";
            warningDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${escapeHtml(warningText)}`;
            warningDiv.style.display = 'flex';
            contentDiv.classList.add('has-warning');
        }
    }

    // --- Footer Updates (Round 4) ---
    // 1. Boutons de Téléchargement (Support Multi-formats)
    const downloadGroup = modal.querySelector('.preview-modal__download-group');
    if (downloadGroup) {
        // Nettoyer les anciens boutons mais garder le label
        const label = downloadGroup.querySelector('.preview-modal__download-label');
        downloadGroup.innerHTML = '';
        if (label) downloadGroup.appendChild(label);

        // Trouver le module pour connaître ses formats
        let moduleDef = null;
        if (notification.titleKey) {
            moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
        }

        // Utiliser les formats définis, sinon fallback sur le type de la notification
        const supportedFormats = (moduleDef && moduleDef.formats) ? moduleDef.formats : [notification.type?.toUpperCase() || 'FILE'];

        supportedFormats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'preview-modal__download-btn action-btn primary-btn';
            btn.dataset.format = format;
            btn.innerHTML = `<i class="fas fa-download"></i> <span class="file-ext">${format}</span>`;
            downloadGroup.appendChild(btn);
        });
    }

    // 2. Compatibilité
    const platformsList = modal.querySelector('.preview-modal__platforms-list');
    if (platformsList) {
        let platforms = [];
        // Trouver le module pour les plateformes
        let moduleDef = null;
        if (notification.titleKey) {
            moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
        }

        // Récupérer les platforms depuis definitions.js dans l'ordre exact
        if (moduleDef && moduleDef.platforms && moduleDef.platforms.length > 0) {
            platforms = [...moduleDef.platforms];
        } else {
            // Si aucune donnée n'est trouvée, afficher Éléa par défaut
            platforms = ['Éléa'];
        }

        platformsList.innerHTML = platforms.map(p => `<span class="platform-badge">${p}</span>`).join('');
    }

    // Gestion de l'affichage et de l'animation (éviter le scintillement lors de la navigation)
    const isAlreadyOpen = overlay.style.display === 'flex' && !overlay.classList.contains('closing');

    // Afficher l'overlay
    overlay.style.display = 'flex';

    if (!isAlreadyOpen) {
        // Ajouter la classe d'animation seulement si ce n'était pas déjà ouvert
        overlay.classList.add('opening');
        setTimeout(() => {
            overlay.classList.remove('opening');
        }, 300);
    }

    // Stocker la référence
    currentPreviewModal = notificationId;

    // Mettre à jour la navigation
    updateNavigation();

    // Rendre le contenu (H5P ou placeholder)
    renderPreview(notification, modal);

    // Implémenter le focus trap
    focusTrapCleanup = trapFocus(modal);

    // Focuser le premier élément interactif (bouton close)
    const closeBtn = modal.querySelector('.preview-modal__close');
    if (closeBtn) {
        closeBtn.focus();
    }
}

/**
 * Rendu du contenu de la modale en fonction du type de notification.
 * @param {Object} notification - La notification à prévisualiser
 * @param {HTMLElement} modal - L'élément modal
 * @private
 */
function renderPreview(notification, modal) {
    const previewContainer = modal.querySelector('.preview-modal__preview');
    if (!previewContainer) return;

    // Reset du contenu
    cleanupPreview();

    // HTML de base
    const loadingText = translations.loading || 'Chargement...';
    const errorText = translations.preview_error || 'Impossible de prévisualiser ce fichier';
    const placeholderText = translations.preview_placeholder || 'Preview disponible prochainement';

    // Si c'est un fichier H5P
    if (notification.type === 'h5p') {
        modal.classList.add('preview-modal--wide');
        previewContainer.classList.add('preview-modal__preview--h5p');
        previewContainer.innerHTML = `
            <div class="preview-modal__loader">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${escapeHtml(loadingText)}</span>
            </div>
            <div id="h5p-preview-container" class="preview-modal__h5p-container" style="display: none;"></div>
            <div class="preview-modal__error" style="display: none;">
                <i class="fas fa-exclamation-circle"></i>
                <span>${escapeHtml(errorText)}</span>
            </div>
        `;

        const loader = previewContainer.querySelector('.preview-modal__loader');
        const h5pContainer = previewContainer.querySelector('.preview-modal__h5p-container');
        const errorMsg = previewContainer.querySelector('.preview-modal__error');

        // Utilisation de H5PManager
        loadJSZip().then(() => {
            // Charge JSZip si nécessaire avant que le manager ne l'utilise
            return h5pManager.load(notification.blob, h5pContainer);
        }).then(() => {
            if (loader) loader.style.display = 'none';
            if (h5pContainer) h5pContainer.style.display = 'block';
        }).catch(err => {
            console.error('H5P Render Error via H5PManager:', err);
            if (loader) loader.style.display = 'none';
            if (errorMsg) {
                errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${escapeHtml(errorText)}: ${escapeHtml(err.message)}</span>`;
                errorMsg.style.display = 'flex';
            }
        });


    } else if ((notification.type === 'mbz' || notification.type === 'xml') && notification.jsonData) {
        console.log("renderPreview: MBZ/XML with jsonData detected", {
            type: notification.type,
            titleKey: notification.titleKey,
            hasJsonData: !!notification.jsonData
        });
        modal.classList.add('preview-modal--wide');
        previewContainer.classList.remove('preview-modal__preview--h5p');
        previewContainer.classList.add('preview-modal__preview--simulator');

        if (notification.titleKey === 'moodle_millionnaire_name') {
            // Rendu du simulateur Millionnaire
            console.log("renderPreview: Rendering Millionnaire");
            renderMillionnaire(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'moodle_appariement_name') {
            // Rendu du simulateur Appariement
            console.log("renderPreview: Rendering Appariement");
            renderMatching(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'moodle_glossaire_xml_name') {
            // Rendu du simulateur Glossaire
            console.log("renderPreview: Rendering Glossaire");
            renderGlossary(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'moodle_qcm_name') {
            // Rendu du simulateur QCM
            console.log("renderPreview: Rendering QCM");
            renderQcmElea(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'moodle_xml_name') {
            // Rendu du simulateur Test Moodle/Éléa (anciennement Banque de questions)
            console.log("renderPreview: Rendering Elea Test");
            renderEleaTest(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_page_name') {
            // Rendu du simulateur Page Éléa
            console.log("renderPreview: Rendering Elea Page");
            renderPage(previewContainer, notification.jsonData, notification.previewHtml);
        } else {
            // Fallback pour les autres types MBZ non gérés spécifiquement
            console.log("renderPreview: No matching titleKey, using placeholder. titleKey was:", notification.titleKey);
            modal.classList.remove('preview-modal--wide');
            previewContainer.classList.remove('preview-modal__preview--h5p');
            previewContainer.classList.remove('preview-modal__preview--simulator');
            previewContainer.innerHTML = `
                <p class="preview-modal__placeholder">
                    ${escapeHtml(placeholderText)}
                </p>
            `;
        }
    } else {
        console.log("renderPreview: Fallback - no jsonData or wrong type", {
            type: notification.type,
            hasJsonData: !!notification.jsonData
        });
        modal.classList.remove('preview-modal--wide');
        previewContainer.classList.remove('preview-modal__preview--h5p');
        // Placeholder pour les autres types
        previewContainer.innerHTML = `
            <p class="preview-modal__placeholder">
                ${escapeHtml(placeholderText)}
            </p>
        `;
    }
}

let currentPreviewBlobUrl = null;

/**
 * Nettoie les ressources de prévisualisation (URL blob, instances H5P).
 * @private
 */
function cleanupPreview() {
    // Si une URL blob a été créée pour la preview H5P, la révoquer
    if (currentPreviewBlobUrl) {
        URL.revokeObjectURL(currentPreviewBlobUrl);
        currentPreviewBlobUrl = null;
    }

    // Nettoyer via le manager
    h5pManager.destroy();

    // Nettoyer le contenu du conteneur pour détruire les instances/iframes
    const modal = document.querySelector('.preview-modal');
    if (modal) {
        modal.classList.remove('preview-modal--wide');
        const previewContainer = modal.querySelector('.preview-modal__preview');
        if (previewContainer) {
            previewContainer.classList.remove('preview-modal__preview--h5p');
            previewContainer.classList.remove('preview-modal__preview--simulator');
            previewContainer.innerHTML = '';
        }
    }
}

/**
 * Implémente le focus trap dans la modale.
 * @param {HTMLElement} element - L'élément modal dans lequel piéger le focus
 * @private
 */
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    element.addEventListener('keydown', handleTabKey);

    // Retourner une fonction de cleanup pour retirer le listener
    return () => {
        element.removeEventListener('keydown', handleTabKey);
    };
}

/**
 * Met à jour les contrôles de navigation (prev/next) et l'indicateur.
 * @private
 */
function updateNavigation() {
    const modal = document.querySelector('.preview-modal');
    if (!modal || !currentPreviewModal) return;

    // Récupérer uniquement les activités générées (exclure les alertes/toasts)
    const successNotifications = getNotifications().filter(n => n.status === 'success' && n.type !== 'alert');
    const currentIndex = successNotifications.findIndex(n => n.id === currentPreviewModal);

    if (currentIndex === -1) return;

    const totalCount = successNotifications.length;
    const prevBtn = modal.querySelector('.preview-modal__nav-btn.prev');
    const nextBtn = modal.querySelector('.preview-modal__nav-btn.next');
    const indicator = modal.querySelector('.preview-modal__nav-indicator');

    // Mettre à jour l'indicateur "X / Y"
    if (indicator) {
        indicator.textContent = `${currentIndex + 1} / ${totalCount}`;
    }

    // --- POPULATION DU DROPDOWN ---
    const dropdown = modal.querySelector('.preview-modal__nav-dropdown');
    if (dropdown) {
        dropdown.innerHTML = ''; // Reset

        successNotifications.forEach((notif, index) => {
            const isCurrent = index === currentIndex;
            const item = document.createElement('div');
            item.className = `preview-modal__history-item${isCurrent ? ' active' : ''}`;
            item.dataset.id = notif.id;

            // Icône
            let iconHtml = '';
            let moduleDef = null;
            if (notif.titleKey) {
                moduleDef = Object.values(allModules).find(m => m.name === notif.titleKey);
            }
            if (moduleDef && moduleDef.image) {
                iconHtml = `<img src="${moduleDef.image}" class="preview-modal__history-icon" alt="">`;
            } else {
                iconHtml = `<i class="fas fa-file-alt preview-modal__history-icon" style="display: flex; align-items: center; justify-content: center; color: #8e8e93;"></i>`;
            }

            // Titre et Heure
            const title = escapeHtml(getNotificationTitle(notif));
            const timeStr = formatNotificationTime(notif.timestamp);

            item.innerHTML = `
                ${iconHtml}
                <div class="preview-modal__history-info">
                    <span class="preview-modal__history-title" title="${title}">${title}</span>
                    <span class="preview-modal__history-time">${timeStr}</span>
                </div>
            `;

            // Click listener pour naviguer
            item.addEventListener('click', () => {
                const navWrapper = modal.querySelector('.preview-modal__nav-wrapper');
                if (navWrapper) navWrapper.classList.remove('open');
                openPreviewModal(notif.id);
            });

            dropdown.appendChild(item);
        });
    }

    // Gérer les boutons prev/next
    if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentIndex === totalCount - 1;
    }
}

/**
 * Ferme la modale de prévisualisation avec animation.
 * @private
 */
function closePreviewModal() {
    const overlay = document.querySelector('.preview-modal-overlay');
    const modal = document.querySelector('.preview-modal');

    if (!overlay || !modal) return;

    // --- Logic for Edit Mode ---
    if (isEditModeActive) {
        if (hasUnsavedChanges()) {
            showThreeButtonConfirm({
                title: translations.editor_confirm_close_title || "Modifications non enregistrées",
                message: translations.editor_confirm_close_message || "Voulez-vous enregistrer vos modifications avant de quitter ?",
                buttons: [
                    {
                        text: translations.editor_confirm_close_cancel || "Rester dans l'éditeur",
                        class: 'secondary',
                        action: () => { /* Ne rien faire, reste ouvert */ }
                    },
                    {
                        text: translations.editor_confirm_close_save || "Enregistrer et quitter",
                        class: 'primary',
                        action: async () => {
                            const saveBtn = modal.querySelector('.preview-modal__save-btn');
                            if (saveBtn) saveBtn.click();
                        }
                    },
                    {
                        text: translations.editor_confirm_close_discard || "Quitter sans enregistrer",
                        class: 'danger',
                        action: () => {
                            resetEditModeState(modal);
                            closePreviewModal(); // On rappelle pour fermer l'overlay maintenant que le mode édition est off
                        }
                    }
                ]
            });
            return;
        } else {
            // Mode édition actif mais pas de changements : on reset proprement
            resetEditModeState(modal);
        }
    }

    // Ajouter la classe d'animation de fermeture
    overlay.classList.add('closing');

    // Attendre la fin de l'animation avant de masquer
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('closing');
        currentPreviewModal = null;

        // Nettoyer le focus trap
        if (focusTrapCleanup) {
            focusTrapCleanup();
            focusTrapCleanup = null;
        }

        // Restaurer le focus sur l'élément précédent
        if (previousFocusElement && typeof previousFocusElement.focus === 'function') {
            previousFocusElement.focus();
        }
        previousFocusElement = null;

        // Nettoyage complet des ressources
        cleanupPreview();
    }, 300);
}

/**
 * Affiche une modale de confirmation avec 3 boutons
 * @param {Object} options - Configuration {title, message, buttons: [{text, class, action}]}
 */
function showThreeButtonConfirm(options) {
    // Supprimer une éventuelle modale existante
    const existing = document.getElementById('three-btn-confirm');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'three-btn-confirm';
    overlay.className = 'confirm-modal-overlay';
    overlay.style.zIndex = '4000'; // Au dessus de la preview modal (qui est à 2050/2100)

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';

    modal.innerHTML = `
        <div class="confirm-modal__header">
            <h3>${options.title}</h3>
        </div>
        <div class="confirm-modal__body">
            <p>${options.message}</p>
        </div>
        <div class="confirm-modal__footer">
            ${options.buttons.map((btn, index) => `
                <button class="confirm-modal__btn confirm-modal__btn--${btn.class}" data-index="${index}">
                    ${btn.text}
                </button>
            `).join('')}
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    modal.querySelectorAll('.confirm-modal__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index;
            const action = options.buttons[index].action;
            overlay.remove();
            if (action) action();
        });
    });

    // Fermer si clic sur l'overlay (équivalent à Cancel)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Initialise la modale de prévisualisation avec tous les écouteurs d'événements.
 * À appeler après l'initialisation du DOM.
 */
export function initPreviewModal() {
    const overlay = document.querySelector('.preview-modal-overlay');
    const modal = document.querySelector('.preview-modal');

    if (!overlay || !modal) return;

    // Gestion du bouton Éditer via kill switch
    const editBtnInModal = modal.querySelector('.preview-modal__edit');
    if (editBtnInModal) {
        editBtnInModal.style.display = ENABLE_EDIT_BUTTON ? '' : 'none';
    }

    // Écouter l'événement notification:preview pour ouvrir
    document.addEventListener('notification:preview', (e) => {
        const notificationId = e.detail?.id;
        if (notificationId) {
            openPreviewModal(notificationId);
        }
    });

    // Bouton X pour fermer
    const closeBtn = modal.querySelector('.preview-modal__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closePreviewModal();
        });
    }

    // Bouton retour pour fermer (même comportement que X)
    const backBtn = modal.querySelector('.preview-modal__back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            closePreviewModal();
        });
    }

    // Clic sur l'overlay pour fermer (mais pas sur la modale elle-même)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePreviewModal();
        }
    });

    // Touche Escape pour fermer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPreviewModal !== null) {
            closePreviewModal();
        }
    });

    // Bouton télécharger (Délégation d'événement sur la modale pour supporter le remplacement du footer)
    if (!modal._downloadListenerAttached) {
        modal.addEventListener('click', (e) => {
            const btn = e.target.closest('.preview-modal__download-btn');
            if (!btn) return;

            if (!currentPreviewModal) return;

            const notification = getNotificationById(currentPreviewModal);
            if (!notification) {
                console.error('Cannot download: notification not found');
                return;
            }

            const format = btn.dataset.format;
            let fileName = notification.fileName || (notification.title || 'download');

            // --- Logique de téléchargement par format ---
            if (format === 'GIFT' && notification.jsonData) {
                const giftContent = generateMoodleGift(notification.jsonData);
                const baseName = fileName.replace(/\.[^/.]+$/, ""); // Retire l'ancienne extension
                fileName = `${baseName}.gift.txt`;
                downloadFile(giftContent, fileName, 'text/plain');
            }
            else if (format === 'XML' && notification.jsonData) {
                const xmlContent = generateMoodleXml(notification.jsonData);
                const baseName = fileName.replace(/\.[^/.]+$/, "");
                fileName = `${baseName}.xml`;
                downloadFile(xmlContent, fileName, 'text/xml');
            }
            else if (format === 'HTML' && notification.previewHtml) {
                const baseName = fileName.replace(/\.[^/.]+$/, "");
                fileName = `${baseName}.html`;
                downloadFile(notification.previewHtml, fileName, 'text/html');
            }
            else if (format === 'DOCX' && notification.jsonData) {
                // Export au format DOCX
                // Utiliser directement le moduleKey stocké dans la notification
                // Si pas de moduleKey (anciennes notifications), chercher dans allModules
                let moduleKey = notification.moduleKey;
                if (!moduleKey && notification.titleKey) {
                    // Retrouver le moduleKey depuis le titleKey (clé de traduction)
                    const entry = Object.entries(allModules).find(([k, m]) => m.name === notification.titleKey);
                    moduleKey = entry ? entry[0] : notification.titleKey;
                }
                exportToDOCX(moduleKey, notification.jsonData);
            }
            else if (format === 'PDF' && notification.jsonData) {
                // Export au format PDF
                // Utiliser directement le moduleKey stocké dans la notification
                // Si pas de moduleKey (anciennes notifications), chercher dans allModules
                let moduleKey = notification.moduleKey;
                if (!moduleKey && notification.titleKey) {
                    // Retrouver le moduleKey depuis le titleKey (clé de traduction)
                    const entry = Object.entries(allModules).find(([k, m]) => m.name === notification.titleKey);
                    moduleKey = entry ? entry[0] : notification.titleKey;
                }
                exportToPDF(moduleKey, notification.jsonData);
            }
            else if (format === 'ODT' && notification.jsonData) {
                // Export au format ODT
                // Utiliser directement le moduleKey stocké dans la notification
                // Si pas de moduleKey (anciennes notifications), chercher dans allModules
                let moduleKey = notification.moduleKey;
                if (!moduleKey && notification.titleKey) {
                    // Retrouver le moduleKey depuis le titleKey (clé de traduction)
                    const entry = Object.entries(allModules).find(([k, m]) => m.name === notification.titleKey);
                    moduleKey = entry ? entry[0] : notification.titleKey;
                }
                exportToODT(moduleKey, notification.jsonData);
            }
            // Cas par défaut (MBZ, H5P, ou si jsonData/previewHtml manquant)
            else {
                if (!notification.blob) {
                    console.error('Cannot download: blob not found');
                    return;
                }

                // Utiliser le nom de fichier original s'il existe
                if (!notification.fileName) {
                    const extensionMap = {
                        'h5p': '.h5p',
                        'mbz': '.mbz',
                        'scorm': '.zip',
                        'html': '.html',
                        'xml': '.xml'
                    };
                    const extension = extensionMap[notification.type] || '';
                    fileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
                }

                const link = document.createElement('a');
                link.href = notification.blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
        modal._downloadListenerAttached = true;
    }

    // Bouton navigation précédent
    const prevBtn = modal.querySelector('.preview-modal__nav-btn.prev');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!currentPreviewModal) return;

            const successNotifications = getNotifications().filter(n => n.status === 'success');
            const currentIndex = successNotifications.findIndex(n => n.id === currentPreviewModal);

            if (currentIndex > 0) {
                const prevNotification = successNotifications[currentIndex - 1];
                openPreviewModal(prevNotification.id);
            }
        });
    }

    // Bouton navigation suivant
    const nextBtn = modal.querySelector('.preview-modal__nav-btn.next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!currentPreviewModal) return;

            const successNotifications = getNotifications().filter(n => n.status === 'success');
            const currentIndex = successNotifications.findIndex(n => n.id === currentPreviewModal);

            if (currentIndex < successNotifications.length - 1) {
                const nextNotification = successNotifications[currentIndex + 1];
                openPreviewModal(nextNotification.id);
            }
        });
    }

    // --- LOGIQUE INDICATEUR NAV & DROPDOWN ---
    const navWrapper = modal.querySelector('.preview-modal__nav-wrapper');
    const navIndicator = modal.querySelector('.preview-modal__nav-indicator');

    if (navWrapper && navIndicator) {
        // Toggle dropdown au clic
        navIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            navWrapper.classList.toggle('open');
        });

        // Fermer si clic en dehors
        document.addEventListener('click', (e) => {
            if (navWrapper.classList.contains('open') && !navWrapper.contains(e.target)) {
                navWrapper.classList.remove('open');
            }
        });
    }

    // Bouton Éditer - Bascule entre mode visualisation et édition
    // Utilisation de la délégation d'événements pour gérer le cas où le bouton est recréé
    modal.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.preview-modal__edit');
        if (!editBtn || !ENABLE_EDIT_BUTTON) return;

        if (!currentPreviewModal) return;

        const notification = getNotificationById(currentPreviewModal);
        if (!notification) return;

        await toggleEditMode(notification, modal);
    });

    // Bouton Plein écran - Bascule entre mode normal et plein écran pour le contenu uniquement
    modal.addEventListener('click', (e) => {
        const fullscreenBtn = e.target.closest('.preview-modal__fullscreen-btn');
        if (!fullscreenBtn) return;

        const previewContainer = modal.querySelector('.preview-modal__preview');
        if (!previewContainer) return;

        if (document.fullscreenElement) {
            // Sortir du mode plein écran
            document.exitFullscreen().catch(err => {
                console.error('Erreur lors de la sortie du mode plein écran:', err);
            });
        } else {
            // Entrer en mode plein écran
            previewContainer.requestFullscreen().catch(err => {
                console.error('Erreur lors de l\'entrée en mode plein écran:', err);
            });
        }
    });

    // Mettre à jour l'icône du bouton plein écran selon l'état
    document.addEventListener('fullscreenchange', () => {
        const fullscreenBtns = modal.querySelectorAll('.preview-modal__fullscreen-btn');
        fullscreenBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;

            if (document.fullscreenElement) {
                // En mode plein écran - afficher l'icône "compress"
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-compress');
                btn.title = translations.exit_fullscreen || 'Quitter le plein écran';
                btn.setAttribute('aria-label', translations.exit_fullscreen || 'Quitter le plein écran');
            } else {
                // Mode normal - afficher l'icône "expand"
                icon.classList.remove('fa-compress');
                icon.classList.add('fa-expand');
                btn.title = translations.fullscreen || 'Plein écran';
                btn.setAttribute('aria-label', translations.fullscreen || 'Plein écran');
            }
        });
    });
}

// Les variables isEditModeActive, savedPreviewContent, et savedFooterContent ont été déplacées plus haut

/**
 * Bascule entre le mode visualisation et le mode édition
 * @param {Notification} notification - La notification active
 * @param {HTMLElement} modal - L'élément modal
 */
async function toggleEditMode(notification, modal) {
    const previewContainer = modal.querySelector('.preview-modal__preview');
    const editBtn = modal.querySelector('.preview-modal__edit');

    if (!previewContainer || !editBtn) return;

    if (isEditModeActive) {
        // Mode Édition -> Visualisation
        await exitEditMode(notification, previewContainer, editBtn);
    } else {
        // Mode Visualisation -> Édition
        await enterEditMode(notification, previewContainer, editBtn);
    }
}

/**
 * Entre dans le mode édition
 */
async function enterEditMode(notification, previewContainer, editBtn) {
    const modal = document.querySelector('.preview-modal');
    const footer = modal?.querySelector('.preview-modal__footer');

    // Sauvegarder le contenu actuel
    savedPreviewContent = previewContainer.innerHTML;

    // Sauvegarder et remplacer le footer
    if (footer) {
        savedFooterContent = footer.innerHTML;
        footer.innerHTML = `
            <div class="preview-modal__footer-left">
                <button class="preview-modal__cancel-btn" type="button">
                    <i class="fas fa-times"></i>
                    <span>${translations.editor_cancel || 'Annuler'}</span>
                </button>
            </div>
            <div class="preview-modal__footer-right">
                <button class="preview-modal__save-btn" type="button">
                    <i class="fas fa-save"></i>
                    <span>${translations.editor_save || 'Enregistrer'}</span>
                </button>
            </div>
        `;

        // Ajouter les event listeners aux nouveaux boutons
        const cancelBtn = footer.querySelector('.preview-modal__cancel-btn');
        const saveBtn = footer.querySelector('.preview-modal__save-btn');

        cancelBtn?.addEventListener('click', () => {
            exitEditMode(notification, previewContainer, editBtn);
        });

        saveBtn?.addEventListener('click', async () => {
            await handleEditorSave(await saveChanges(), notification, previewContainer, editBtn);
        });
    }

    // Afficher le chargement
    previewContainer.innerHTML = `
        <div class="json-editor__loading">
            <div class="json-editor__loading-spinner"></div>
            <span>${translations.editor_loading || 'Chargement de l\'éditeur...'}</span>
        </div>
    `;

    try {
        // Extraire les données JSON
        const jsonData = await extractJsonFromNotification(notification);

        if (!jsonData) {
            throw new Error('Impossible d\'extraire les données JSON');
        }

        // Initialiser l'éditeur
        const success = await initJsonEditor(notification, previewContainer, jsonData, {
            onSave: async (result) => {
                await handleEditorSave(result, notification, previewContainer, editBtn);
            },
            onCancel: () => {
                exitEditMode(notification, previewContainer, editBtn);
            }
        });

        if (success) {
            isEditModeActive = true;

            // Ajouter les classes pour activer le scroll de l'éditeur
            previewContainer.classList.add('preview-modal__preview--editor');
            const content = modal?.querySelector('.preview-modal__content');
            if (content) {
                content.classList.add('preview-modal__content--editor');
            }

            // Mettre à jour le bouton (caché en mode édition, mais on garde la logique)
            editBtn.style.display = 'none';
        } else {
            // Restaurer en cas d'échec
            previewContainer.innerHTML = savedPreviewContent;
            restoreFooter(footer, editBtn);
        }

    } catch (error) {
        console.error('[Edit Mode] Error entering edit mode:', error);
        previewContainer.innerHTML = savedPreviewContent;
        restoreFooter(footer, editBtn);
        alert(translations.editor_init_error || 'Erreur lors de l\'initialisation de l\'éditeur');
    }
}

/**
 * Restaure le footer original
 */
function restoreFooter(footer, editBtn) {
    if (footer && savedFooterContent) {
        footer.innerHTML = savedFooterContent;
        savedFooterContent = null;
    }
    if (editBtn) {
        editBtn.style.display = ENABLE_EDIT_BUTTON ? '' : 'none';
    }
}

/**
 * Sort du mode édition
 */
async function exitEditMode(notification, previewContainer, editBtn) {
    // Vérifier les modifications non sauvegardées
    if (hasUnsavedChanges()) {
        const confirmExit = window.confirm(translations.editor_confirm_discard || 'Voulez-vous vraiment quitter ? Les modifications non sauvegardées seront perdues.');
        if (!confirmExit) return;
    }

    // Détruire l'éditeur
    destroyEditor();
    isEditModeActive = false;

    // Retirer les classes de scroll de l'éditeur
    const modal = document.querySelector('.preview-modal');
    previewContainer.classList.remove('preview-modal__preview--editor');
    const content = modal?.querySelector('.preview-modal__content');
    if (content) {
        content.classList.remove('preview-modal__content--editor');
    }

    // Restaurer le footer
    const footer = modal?.querySelector('.preview-modal__footer');
    restoreFooter(footer, editBtn);

    // Restaurer la preview
    // Pour H5P et les MBZ (simulators), on préfère re-render proprement pour réinitialiser le player/simulator
    if (savedPreviewContent && notification.type !== 'h5p' && notification.type !== 'mbz') {
        previewContainer.innerHTML = savedPreviewContent;
        savedPreviewContent = null;
    } else {
        // Re-render la preview si pas de sauvegarde ou si H5P/MBZ
        savedPreviewContent = null; // Nettoyer pour être sûr
        await renderPreview(notification, modal);
    }
}



/**
 * Réinitialise complètement l'état du mode édition
 * @param {HTMLElement} modal - L'élément modal
 */
function resetEditModeState(modal) {
    if (!modal) return;

    console.log('[Edit Mode] Resetting state...');

    // Détruire l'éditeur
    destroyEditor();
    isEditModeActive = false;

    // Restaurer le footer
    const footer = modal.querySelector('.preview-modal__footer');
    const editBtn = modal.querySelector('.preview-modal__edit');
    restoreFooter(footer, editBtn);

    savedFooterContent = null;
    savedPreviewContent = null;

    // Retirer les classes de scroll de l'éditeur
    const previewContainer = modal.querySelector('.preview-modal__preview');
    const content = modal.querySelector('.preview-modal__content');

    if (previewContainer) {
        previewContainer.classList.remove('preview-modal__preview--editor');
    }
    if (content) {
        content.classList.remove('preview-modal__content--editor');
    }
}

/**
 * Gère la sauvegarde depuis l'éditeur
 */
async function handleEditorSave(result, notification, previewContainer, editBtn) {
    if (!result || !result.data) {
        console.error('[Edit Mode] No data to save');
        return;
    }

    try {
        // Afficher un indicateur de régénération
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'json-editor__loading';
        loadingOverlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); z-index: 100;';
        loadingOverlay.innerHTML = `
            <div class="json-editor__loading-spinner"></div>
            <span>${translations.editor_regenerating || 'Régénération du fichier...'}</span>
        `;
        previewContainer.style.position = 'relative';
        previewContainer.appendChild(loadingOverlay);

        // Régénérer le fichier (H5P ou Moodle)
        const newBlob = await regenerateFile(notification, result.data, result.moduleKey);

        if (newBlob) {
            // Mettre à jour la notification
            if (notification.blobUrl) {
                URL.revokeObjectURL(notification.blobUrl);
            }
            notification.blob = newBlob;
            notification.blobUrl = URL.createObjectURL(newBlob);

            // Mettre à jour jsonData pour les simulateurs Moodle
            if (notification.type !== 'h5p') {
                notification.jsonData = result.data;
            }

            // Sortir du mode édition et re-render
            const modal = document.querySelector('.preview-modal');
            resetEditModeState(modal);

            // Re-render la preview
            await renderPreview(notification, modal);

            // Notification de succès
            console.log('[Edit Mode] File regenerated successfully');
        } else {
            throw new Error('Failed to regenerate file');
        }

    } catch (error) {
        console.error('[Edit Mode] Error saving:', error);
        alert(translations.editor_save_error || 'Erreur lors de l\'enregistrement');

        // Supprimer l'overlay de chargement
        const overlay = previewContainer.querySelector('.json-editor__loading');
        if (overlay) overlay.remove();
    }
}

/**
 * Régénère un fichier à partir des données éditées
 * @param {Notification} notification - La notification originale
 * @param {Object} editedData - Les données éditées
 * @param {string} moduleKey - La clé du module
 * @returns {Promise<Blob|null>} - Le nouveau blob ou null en cas d'erreur
 */
async function regenerateFile(notification, editedData, moduleKey) {
    try {
        if (notification.type === 'h5p') {
            // Régénération H5P
            return await regenerateH5PFile(notification.blob, editedData, moduleKey, notification.titleKey);
        } else {
            // Pour Moodle/Éléa, on met juste à jour jsonData
            return notification.blob;
        }
    } catch (error) {
        console.error('[Regenerate] Error:', error);
        return null;
    }
}

/**
 * Régénère un fichier H5P avec les nouvelles données
 */
async function regenerateH5PFile(originalBlob, editedData, moduleKey, titleKey) {
    try {
        // Charger JSZip si nécessaire
        if (!window.JSZip) {
            await loadJSZip();
        }

        // Charger le ZIP original
        const zip = await JSZip.loadAsync(originalBlob);

        // Appliquer le processeur
        let processedData = editedData;
        if (moduleKey) {
            const result = processH5PContent(moduleKey, editedData);
            if (result) {
                processedData = result;
            }
        }

        // Mettre à jour le content.json
        zip.file('content/content.json', JSON.stringify(processedData, null, 2));

        // Régénérer le blob
        const newBlob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return newBlob;
    } catch (error) {
        console.error('[Regenerate H5P] Error:', error);
        throw error;
    }
}
