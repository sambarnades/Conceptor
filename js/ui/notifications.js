/**
 * @file Gestion du centre de notifications.
 * Ce module gère l'affichage du dropdown de notifications et l'interaction avec le bouton cloche.
 */

import { translations } from '../core/translation.js';
import { loadJSZip, loadClientZip } from '../core/lib-loader.js';
import { allModules, formatHelpKeys, xmlHelpByActivity } from '../core/definitions.js';
import { downloadFile, debugLog } from '../core/utils.js';

// ============= IMPORTS DYNAMIQUES (chargés à la demande) =============
// Les modules lourds ci-dessous sont chargés via import() dynamique au moment
// où l'utilisateur en a réellement besoin, pour accélérer le démarrage initial :
//   h5p-manager.js, simulators.js, editor/*, h5p/processors/index.js,
//   export/document-exporter.js, renderers/*-grid-capture.js, moodle/moodle-formats.js

/** Instance H5PManager créée à la demande (lazy) */
let h5pManager = null;

/**
 * Retourne l'instance H5PManager, en la créant au premier appel.
 * @returns {Promise<H5PManager>}
 */
async function getH5PManager() {
    if (!h5pManager) {
        const { H5PManager } = await import('../h5p/h5p-manager.js');
        h5pManager = new H5PManager();
    }
    return h5pManager;
}

// ============= CONSTANTES =============
const MAX_NOTIFICATIONS = 20;

/**
 * Kill switch pour le bouton "Éditer" dans la modale de visualisation.
 * Permet de masquer la fonctionnalité en production tout en poursuivant le développement.
 * @constant {boolean}
 */
const ENABLE_EDIT_BUTTON = true;

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
 * @type {Map<string, Notification>}
 * Dernière notification debug par moduleKey
 * Utilisée par le bouton toggle debug en mode DEBUG
 */
const lastDebugNotifications = new Map();

/**
 * Getter pour accéder à la dernière notification debug d'un module
 * @param {string} [moduleKey] - Si fourni, retourne la notification de ce module. Sinon, la plus récente.
 * @returns {Notification|null}
 */
export function getLastDebugNotification(moduleKey) {
    if (moduleKey) return lastDebugNotifications.get(moduleKey) || null;
    // Fallback : retourner la plus récente (compatibilité)
    let latest = null;
    for (const notif of lastDebugNotifications.values()) {
        if (!latest || notif.timestamp > latest.timestamp) latest = notif;
    }
    return latest;
}

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
 * @property {Object|null} jsonData - Données JSON transformées (HTML) pour le rendu H5P
 * @property {Object|null} originalJsonData - Données JSON originales (Markdown) pour l'édition
 * @property {string|null} moduleKey - Clé du module pour l'export de documents
 * @property {string|null} errorMessage - Message d'erreur si status === 'error' (DEPRECATED - utiliser userMessage + technicalMessage)
 * @property {string|null} errorCategory - Catégorie d'erreur (parse_error, validation_error, network_error, packaging_error)
 * @property {string|null} userMessage - Message d'erreur convivial pour l'utilisateur
 * @property {string|null} technicalMessage - Message d'erreur technique détaillé
 * @property {Object|null} _debugRawJson - JSON brut avant healing (mode debug uniquement)
 * @property {Object|null} _debugHealedJson - JSON après healing (mode debug uniquement)
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
        originalJsonData: data.originalJsonData || null, // Markdown original pour édition
        moduleKey: data.moduleKey || null, // Clé du module pour export
        previewHtml: data.previewHtml || null,
        errorMessage: data.errorMessage || null, // DEPRECATED
        errorCategory: data.errorCategory || null,
        userMessage: data.userMessage || null,
        technicalMessage: data.technicalMessage || null,
        _debugRawJson: data._debugRawJson || null,
        _debugHealedJson: data._debugHealedJson || null
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

    // Stocker la notification debug par moduleKey
    if (notification._debugRawJson && notification._debugHealedJson && notification.moduleKey) {
        lastDebugNotifications.set(notification.moduleKey, notification);
    }

    // Mise à jour UI (si silent, on diffère le badge jusqu'à l'action utilisateur)
    if (!data.silent) {
        updateBadge();
    }
    updateErrorIndicator();

    // Émettre événement (avec flag silent pour supprimer le toast lors de la génération auto)
    document.dispatchEvent(new CustomEvent('notification:added', {
        detail: { ...notification, silent: data.silent || false }
    }));

    return notification.id;
}

/**
 * Révèle une notification silencieuse en mettant à jour le badge.
 * À appeler quand l'utilisateur interagit avec la modale de résultat.
 */
export function revealNotification() {
    updateBadge();
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
 * Met à jour la visibilité du bouton "Télécharger tout".
 * Visible si ≥ 2 notifications réussies avec blob.
 * @private
 */
function updateDownloadAllVisibility() {
    const btn = document.querySelector('.notification-dropdown__download-all');
    if (!btn) return;
    const successCount = notifications.filter(n => n.status === 'success' && n.blob).length;
    btn.style.display = successCount >= 2 ? '' : 'none';
}

/**
 * Télécharge toutes les notifications réussies dans un ZIP.
 * @private
 */
async function downloadAllNotifications() {
    const successNotifs = notifications.filter(n => n.status === 'success' && n.blob && n.fileName);
    if (successNotifs.length < 2) return;

    try {
        const downloadZip = await loadClientZip();
        const files = successNotifs.map(n => ({
            name: n.fileName,
            input: n.blob
        }));
        const zipBlob = await downloadZip(files).blob();
        const now = new Date();
        const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `caramel-pack-${successNotifs.length}-${dateStr}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (error) {
        console.error('Erreur lors du téléchargement groupé:', error);
    }
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
 * Affiche le toast pour une notification existante (utilisé par la modale de résultat).
 * @param {string} id - ID de la notification
 */
export function showToastForNotification(id) {
    const notification = getNotificationById(id);
    if (notification) {
        showToast(notification);
    }
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

        // Fermer le toast immédiatement s'il est affiché (sans animation)
        if (currentToast) {
            clearTimeout(currentToastTimer);
            if (currentEscapeHandler) {
                document.removeEventListener('keydown', currentEscapeHandler);
                currentEscapeHandler = null;
            }
            currentToast.remove();
            currentToast = null;
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
    const detailsText = translations.error_details_btn || 'Détails';

    // ✅ Sanitize user-controlled data to prevent XSS
    const safeTitle = escapeHtml(getNotificationTitle(notification));
    // Nouveau système de messages d'erreur (EPIC 5.1)
    const safeUserMsg = escapeHtml(notification.userMessage || notification.errorMessage || 'Une erreur est survenue');
    const safeTechMsg = escapeHtml(notification.technicalMessage || notification.errorMessage || '');

    // Trouver le module pour l'icône
    let moduleDef = null;
    if (notification.titleKey) {
        moduleDef = Object.values(allModules).find(m => m.name === notification.titleKey);
    }
    const iconHtml = moduleDef && moduleDef.image ? `<img src="${moduleDef.image}" class="notification-item__icon" alt="">` : '';

    if (isError) {
        // Template erreur avec message utilisateur + bouton Détails (collapse)
        const detailsId = `error-details-${notification.id}`;
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
                ${notification.type !== 'alert' ? `<div class="notification-item__body">
                    <p class="notification-item__error">${safeUserMsg}</p>
                    ${safeTechMsg ? `
                        <button class="notification-item__details-btn" data-toggle="${detailsId}">
                            <i class="fas fa-chevron-right"></i> ${detailsText}
                        </button>
                        <div class="notification-item__technical-details" id="${detailsId}" style="display:none;">
                            <pre>${safeTechMsg}</pre>
                        </div>
                    ` : ''}
                </div>` : ''}
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

    // Mettre à jour la visibilité du bouton "Télécharger tout"
    updateDownloadAllVisibility();
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

    // Bouton "Détails" pour les erreurs (EPIC 5.1)
    const detailsBtn = e.target.closest('.notification-item__details-btn');
    if (detailsBtn) {
        e.stopPropagation();
        const toggleId = detailsBtn.dataset.toggle;
        const detailsDiv = document.getElementById(toggleId);
        if (detailsDiv) {
            const isHidden = detailsDiv.style.display === 'none';
            detailsDiv.style.display = isHidden ? 'block' : 'none';
            // Changer l'icône du chevron
            const icon = detailsBtn.querySelector('i');
            if (icon) {
                icon.className = isHidden ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
            }
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

    // Event listener sur le bouton "Télécharger tout"
    const downloadAllBtn = document.querySelector('.notification-dropdown__download-all');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadAllNotifications();
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
    // Nouveau système de messages d'erreur (EPIC 5.1)
    const safeUserMsg = escapeHtml(notification.userMessage || notification.errorMessage || 'Une erreur est survenue');

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
        ${notification.status === 'error' && notification.type !== 'alert' ? `<p class="notification-toast__error">${safeUserMsg}</p>` : ''}
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
    // Écouter l'événement notification:added pour afficher le toast (sauf si silent)
    document.addEventListener('notification:added', (e) => {
        if (!e.detail.silent) {
            showToast(e.detail);
        }
    });
}

// ============= PREVIEW MODAL FUNCTIONALITY =============

let currentPreviewModal = null;
let previousFocusElement = null;
let focusTrapCleanup = null;
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
async function openPreviewModal(notificationId) {
    const overlay = document.querySelector('.preview-modal-overlay');
    const modal = document.querySelector('.preview-modal');

    if (!overlay || !modal) return;

    // Réinitialiser l'état du mode édition (au cas où il serait resté actif)
    if (isEditModeActive || savedFooterContent) {
        await resetEditModeState(modal);
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

        // Formats qui n'ont pas besoin d'aide (bureautique standard)
        const formatsWithoutHelp = ['DOCX', 'ODT', 'PDF'];

        supportedFormats.forEach(format => {
            // Créer un wrapper pour le bouton et éventuellement le bouton d'aide
            const btnWrapper = document.createElement('div');
            btnWrapper.className = 'preview-modal__download-wrapper';

            // Bouton de téléchargement principal
            const btn = document.createElement('button');
            btn.className = 'preview-modal__download-btn action-btn primary-btn';
            btn.dataset.format = format;
            btn.innerHTML = `<i class="fas fa-download"></i> <span class="file-ext">${format}</span>`;
            btnWrapper.appendChild(btn);

            // Ajouter le bouton d'aide si ce format en a besoin
            if (!formatsWithoutHelp.includes(format)) {
                // Déterminer la clé d'aide appropriée
                let helpKey = formatHelpKeys[format];

                // Cas spécial pour XML : dépend du type d'activité
                if (format === 'XML' && notification.titleKey) {
                    helpKey = xmlHelpByActivity[notification.titleKey] || formatHelpKeys['GIFT'];
                }

                if (helpKey) {
                    const helpBtn = document.createElement('button');
                    helpBtn.className = 'preview-modal__help-btn';
                    helpBtn.dataset.format = format;
                    helpBtn.dataset.helpKey = helpKey;
                    helpBtn.dataset.titleKey = notification.titleKey || '';
                    helpBtn.setAttribute('aria-label', translations.help_download_aria || 'Aide pour importer ce fichier');
                    helpBtn.innerHTML = '<i class="fas fa-circle-question"></i>';
                    btnWrapper.appendChild(helpBtn);
                }
            }

            downloadGroup.appendChild(btnWrapper);
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

        platformsList.innerHTML = platforms.map(p => {
            const modifier = p === 'Éléa' ? 'elea' : p === 'Magistère' ? 'magistere' : p === 'Moodle' ? 'moodle' : '';
            return `<span class="platform-badge${modifier ? ` platform-badge--${modifier}` : ''}">${p}</span>`;
        }).join('');
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

    // Précharger les modules de l'éditeur en arrière-plan pendant que le preview se charge
    // (l'utilisateur clique souvent sur "Éditer" après avoir vu la prévisualisation)
    import('../editor/index.js').catch(() => {});
    import('../editor/content-detector.js').catch(() => {});
    import('../editor/editor-core.js').catch(() => {});
    import('../editor/field-renderers.js').catch(() => {});
    import('../editor/array-manager.js').catch(() => {});
    import('../editor/validators.js').catch(() => {});

    // Stocker la référence
    currentPreviewModal = notificationId;

    // Mettre à jour la navigation
    updateNavigation();

    // Rendre le contenu (H5P ou placeholder — chargement dynamique des renderers)
    await renderPreview(notification, modal);

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
async function renderPreview(notification, modal) {
    const previewContainer = modal.querySelector('.preview-modal__preview');
    if (!previewContainer) return;

    // Reset du contenu
    cleanupPreview();

    // Incrémenter la génération pour invalider tout rendu précédent en cours
    const currentRenderGen = ++previewRenderGeneration;

    // HTML de base
    const loadingText = translations.loading || 'Chargement...';
    const errorText = translations.preview_error || 'Impossible de prévisualiser ce fichier';
    const placeholderText = translations.preview_placeholder || 'Preview disponible prochainement';

    // Si c'est un fichier H5P
    if (notification.type === 'h5p') {
        modal.classList.add('preview-modal--wide');
        previewContainer.classList.add('preview-modal__preview--h5p');
        previewContainer.innerHTML = `
            <div class="json-editor__loading preview-modal__loader">
                <div class="json-editor__loading-spinner"></div>
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

        // Utilisation de H5PManager (chargé à la demande)
        const _renderT0 = performance.now();
        let _perfMod = null;
        import('../core/perf-tracker.js').then(m => { _perfMod = m; }).catch(() => {});

        loadJSZip().then(() => {
            // Si l'utilisateur a navigué entre-temps, abandonner silencieusement
            if (currentRenderGen !== previewRenderGeneration) return;
            if (_perfMod) _perfMod.markStart('render', 'renderPreview → H5PManager.load()');
            // Charge JSZip si nécessaire avant que le manager ne l'utilise
            return getH5PManager().then(mgr => mgr.load(notification.blob, h5pContainer));
        }).then((result) => {
            // Ignorer si un nouveau rendu a été lancé (navigation rapide)
            if (currentRenderGen !== previewRenderGeneration) return;
            // result === null si le chargement a été annulé côté manager
            if (result === null) return;

            const renderDuration = performance.now() - _renderT0;
            if (_perfMod) _perfMod.markEnd('render', 'renderPreview → H5PManager.load()', {
                totalRenderMs: Math.round(renderDuration)
            });
            debugLog('notifications', `✅ Rendu H5P complet en ${Math.round(renderDuration)}ms`);

            if (loader) loader.style.display = 'none';
            if (h5pContainer) h5pContainer.style.display = 'block';
        }).catch(err => {
            // Ignorer les erreurs des rendus obsolètes
            if (currentRenderGen !== previewRenderGeneration) return;
            console.error('H5P Render Error via H5PManager:', err);
            if (loader) loader.style.display = 'none';
            if (errorMsg) {
                errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${escapeHtml(errorText)}: ${escapeHtml(err.message)}</span>`;
                errorMsg.style.display = 'flex';
            }
        });


    } else if ((notification.type === 'mbz' || notification.type === 'xml') && notification.jsonData) {
        debugLog('notifications', "renderPreview: MBZ/XML with jsonData detected", {
            type: notification.type,
            titleKey: notification.titleKey,
            hasJsonData: !!notification.jsonData
        });
        modal.classList.add('preview-modal--wide');
        previewContainer.classList.remove('preview-modal__preview--h5p');
        previewContainer.classList.add('preview-modal__preview--simulator');

        // Afficher le spinner pendant le chargement du simulateur
        previewContainer.innerHTML = `
            <div class="json-editor__loading preview-modal__loader">
                <div class="json-editor__loading-spinner"></div>
                <span>${escapeHtml(loadingText)}</span>
            </div>
        `;

        // Chargement dynamique des simulateurs Moodle
        const simulators = await import('../simulators.js');

        // Si l'utilisateur a navigué pendant le chargement du module, abandonner
        if (currentRenderGen !== previewRenderGeneration) return;

        // Retirer le spinner avant le rendu du simulateur
        const simLoader = previewContainer.querySelector('.preview-modal__loader');
        if (simLoader) simLoader.remove();

        if (notification.titleKey === 'elea_millionnaire_name') {
            // Rendu du simulateur Millionnaire
            debugLog('notifications', "renderPreview: Rendering Millionnaire");
            simulators.renderMillionnaire(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_appariement_name') {
            // Rendu du simulateur Appariement
            debugLog('notifications', "renderPreview: Rendering Appariement");
            simulators.renderMatching(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_glossaire_xml_name') {
            // Rendu du simulateur Glossaire
            debugLog('notifications', "renderPreview: Rendering Glossaire");
            simulators.renderGlossary(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_qcm_name') {
            // Rendu du simulateur QCM
            debugLog('notifications', "renderPreview: Rendering QCM");
            simulators.renderQcmElea(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_test_xml_name') {
            // Rendu du simulateur Test Moodle/Éléa (anciennement Banque de questions)
            debugLog('notifications', "renderPreview: Rendering Elea Test");
            simulators.renderEleaTest(previewContainer, notification.jsonData);
        } else if (notification.titleKey === 'elea_page_name') {
            // Rendu du simulateur Page Éléa
            debugLog('notifications', "renderPreview: Rendering Elea Page");
            simulators.renderPage(previewContainer, notification.jsonData, notification.previewHtml);
        } else if (notification.titleKey === 'elea_devoir_name') {
            // Rendu du simulateur Devoir (grille d'évaluation)
            debugLog('notifications', "renderPreview: Rendering Devoir");
            simulators.renderDevoir(previewContainer, notification.jsonData);
        } else {
            // Fallback pour les autres types MBZ non gérés spécifiquement
            debugLog('notifications', "renderPreview: No matching titleKey, using placeholder. titleKey was:", notification.titleKey);
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
        debugLog('notifications', "renderPreview: Fallback - no jsonData or wrong type", {
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

/** Compteur de génération pour invalider les rendus obsolètes lors de navigation rapide */
let previewRenderGeneration = 0;

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

    // Nettoyer via le manager (si chargé)
    if (h5pManager) h5pManager.destroy();

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
 * Retourne uniquement les notifications navigables (activités générées avec succès).
 * Exclut les alertes et les notifications sans contenu (blob/json).
 * Centralise la logique de filtrage pour garantir la cohérence partout.
 * @returns {Notification[]} Liste filtrée
 */
function getNavigableNotifications() {
    return getNotifications().filter(n =>
        n.status === 'success' &&
        n.type !== 'alert' &&
        ['h5p', 'mbz', 'xml'].includes(n.type) &&
        (n.blob instanceof Blob || n.jsonData)
    );
}

/**
 * Met à jour les contrôles de navigation (prev/next) et l'indicateur.
 * @private
 */
function updateNavigation() {
    const modal = document.querySelector('.preview-modal');
    if (!modal || !currentPreviewModal) return;

    const successNotifications = getNavigableNotifications();
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
async function closePreviewModal() {
    const overlay = document.querySelector('.preview-modal-overlay');
    const modal = document.querySelector('.preview-modal');

    if (!overlay || !modal) return;

    // --- Logic for Edit Mode ---
    if (isEditModeActive) {
        const { hasUnsavedChanges } = await import('../editor/index.js');
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
                            if (saveBtn) {
                                // Déclencher la sauvegarde, puis fermer la modale une fois terminé
                                const { saveChanges } = await import('../editor/index.js');
                                const notification = getNotificationById(currentPreviewModal);
                                if (notification) {
                                    const previewContainer = modal.querySelector('.preview-modal__preview');
                                    const editBtn = modal.querySelector('.preview-modal__edit-btn');
                                    await handleEditorSave(await saveChanges(), notification, previewContainer, editBtn);
                                }
                            }
                            // Fermer la modale après la sauvegarde
                            closePreviewModal();
                        }
                    },
                    {
                        text: translations.editor_confirm_close_discard || "Quitter sans enregistrer",
                        class: 'danger',
                        action: async () => {
                            await resetEditModeState(modal);
                            closePreviewModal(); // On rappelle pour fermer l'overlay maintenant que le mode édition est off
                        }
                    }
                ]
            });
            return;
        } else {
            // Mode édition actif mais pas de changements : on reset proprement
            await resetEditModeState(modal);
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
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

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
    const editBtnInModal = modal.querySelector('.preview-modal__edit-btn');
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
        modal.addEventListener('click', async (e) => {
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
                const { generateMoodleGift } = await import('../moodle/moodle-formats.js');
                const giftContent = generateMoodleGift(notification.jsonData);
                const baseName = fileName.replace(/\.[^/.]+$/, ""); // Retire l'ancienne extension
                fileName = `${baseName}.gift.txt`;
                downloadFile(giftContent, fileName, 'text/plain');
            }
            else if (format === 'XML' && notification.jsonData && notification.titleKey !== 'elea_glossaire_xml_name') {
                // Pour les banques de questions (pas pour le Glossaire XML qui a son propre format)
                const { generateMoodleXml } = await import('../moodle/moodle-formats.js');
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
            else if (['DOCX', 'PDF', 'ODT'].includes(format) && (notification.originalJsonData || notification.jsonData)) {
                // Export au format document (DOCX, PDF ou ODT)
                // Prioriser originalJsonData (Markdown édité) sur jsonData (HTML transformé)
                let jsonDataToExport = notification.originalJsonData || notification.jsonData;
                let moduleKey = notification.moduleKey;
                if (!moduleKey && notification.titleKey) {
                    const entry = Object.entries(allModules).find(([k, m]) => m.name === notification.titleKey);
                    moduleKey = entry ? entry[0] : notification.titleKey;
                }

                // Capture de la grille pour les mots croisés (vide + corrigée)
                if (moduleKey === 'Crossword') {
                    try {
                        const { captureCrosswordGrid } = await import('../renderers/crossword-grid-capture.js');
                        const grids = await captureCrosswordGrid(modal, jsonDataToExport.words);
                        if (grids) {
                            if (grids.emptyGrid) {
                                jsonDataToExport = { ...jsonDataToExport, _gridImage: grids.emptyGrid };
                            }
                            if (grids.solutionGrid) {
                                jsonDataToExport = { ...jsonDataToExport, _solutionGridImage: grids.solutionGrid };
                            }
                        }
                    } catch (err) {
                        console.warn('Capture grille mots croisés échouée, export sans image:', err);
                    }
                }
                // Capture de la grille pour les mots mêlés (vide + corrigée)
                else if (moduleKey === 'FindTheWords') {
                    try {
                        const { captureFindTheWordsGrid } = await import('../renderers/find-the-words-grid-capture.js');
                        const grids = await captureFindTheWordsGrid(modal);
                        if (grids) {
                            if (grids.emptyGrid) {
                                jsonDataToExport = { ...jsonDataToExport, _gridImage: grids.emptyGrid };
                            }
                            if (grids.solutionGrid) {
                                jsonDataToExport = { ...jsonDataToExport, _solutionGridImage: grids.solutionGrid };
                            }
                        }
                    } catch (err) {
                        console.warn('Capture grille mots mêlés échouée, export sans image:', err);
                    }
                }

                const { exportToDOCX, exportToPDF, exportToODT } = await import('../export/document-exporter.js');
                if (format === 'DOCX') exportToDOCX(moduleKey, jsonDataToExport);
                else if (format === 'PDF') exportToPDF(moduleKey, jsonDataToExport);
                else exportToODT(moduleKey, jsonDataToExport);
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

    // Bouton d'aide contextuel (Délégation d'événement sur la modale)
    if (!modal._helpListenerAttached) {
        modal.addEventListener('click', (e) => {
            // Ignorer les clics à l'intérieur du popover (éviter rechargement)
            if (e.target.closest('.help-popover')) return;

            const helpBtn = e.target.closest('.preview-modal__help-btn');
            if (!helpBtn) return;

            e.stopPropagation();

            const helpKey = helpBtn.dataset.helpKey;
            if (!helpKey) return;

            // Récupérer le contenu d'aide depuis les traductions
            const helpContent = translations[helpKey];
            if (!helpContent) {
                console.warn(`Help content not found for key: ${helpKey}`);
                return;
            }

            // Fermer tout popover existant avant d'en ouvrir un nouveau
            closeHelpPopover();

            // Créer le popover
            const popover = document.createElement('div');
            popover.className = 'help-popover';
            popover.setAttribute('role', 'dialog');
            popover.setAttribute('aria-modal', 'true');
            popover.innerHTML = `
                <div class="help-popover__header">
                    <span class="help-popover__title"><i class="fas fa-circle-question" style="color:#007AFF;margin-right:6px;font-size:14px;"></i>${translations.help_download_title || 'Comment utiliser ce fichier ?'}</span>
                    <div class="help-popover__actions">
                        <button class="help-popover__zoom" aria-label="${translations.help_download_zoom_in || 'Agrandir le texte'}" data-zoom="0">
                            <i class="fas fa-magnifying-glass-plus"></i>
                        </button>
                        <button class="help-popover__close" aria-label="${translations.help_download_close || 'Fermer'}">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                </div>
                <div class="help-popover__content">
                    ${helpContent}
                </div>
            `;

            // Créer le backdrop flou
            const backdrop = document.createElement('div');
            backdrop.className = 'help-popover__backdrop';
            document.body.appendChild(backdrop);
            document.body.appendChild(popover);

            // Zoom du texte
            const zoomLevels = [100, 125, 150];
            const zoomBtn = popover.querySelector('.help-popover__zoom');
            const contentEl = popover.querySelector('.help-popover__content');
            zoomBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                let idx = parseInt(zoomBtn.dataset.zoom);
                idx = (idx + 1) % zoomLevels.length;
                zoomBtn.dataset.zoom = idx;
                const pct = zoomLevels[idx];
                contentEl.style.fontSize = pct === 100 ? '' : `${pct}%`;
                const icon = zoomBtn.querySelector('i');
                icon.className = idx === zoomLevels.length - 1 ? 'fas fa-magnifying-glass-minus' : 'fas fa-magnifying-glass-plus';
            });

            // Fermeture via bouton
            const closeBtn = popover.querySelector('.help-popover__close');
            closeBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                closeHelpPopover();
            });

            // Fermeture via backdrop
            backdrop.addEventListener('click', () => {
                closeHelpPopover();
            });

            // Fermeture via Escape
            document.addEventListener('keydown', handleEscapeKey);

            function handleEscapeKey(ev) {
                if (ev.key === 'Escape') {
                    closeHelpPopover();
                }
            }

            function closeHelpPopover() {
                document.removeEventListener('keydown', handleEscapeKey);
                const existingBackdrop = document.querySelector('.help-popover__backdrop');
                if (existingBackdrop) existingBackdrop.remove();
                const existingPopover = document.querySelector('.help-popover');
                if (existingPopover) existingPopover.remove();
            }
        });
        modal._helpListenerAttached = true;
    }

    // Bouton navigation précédent
    const prevBtn = modal.querySelector('.preview-modal__nav-btn.prev');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!currentPreviewModal) return;

            const successNotifications = getNavigableNotifications();
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

            const successNotifications = getNavigableNotifications();
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
        const editBtn = e.target.closest('.preview-modal__edit-btn');
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
    const editBtn = modal.querySelector('.preview-modal__edit-btn');

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
        const editorModuleKey = notification.moduleKey;
        const helpBtnHtml = editorModuleKey ? `
                <button class="preview-modal__editor-help-btn" type="button">
                    <i class="fas fa-circle-question"></i>
                    <span>${translations.editor_help_tooltip || 'Aide'}</span>
                </button>` : '';
        footer.innerHTML = `
            <div class="preview-modal__footer-col">
                <button class="preview-modal__cancel-btn" type="button">
                    <i class="fas fa-times"></i>
                    <span>${translations.editor_cancel || 'Annuler'}</span>
                </button>
            </div>
            <div class="preview-modal__footer-col preview-modal__footer-col--center">
                ${helpBtnHtml}
            </div>
            <div class="preview-modal__footer-col preview-modal__footer-col--right">
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
            const { saveChanges } = await import('../editor/index.js');
            await handleEditorSave(await saveChanges(), notification, previewContainer, editBtn);
        });

        if (editorModuleKey) {
            const editorModuleName = (notification.titleKey && translations[notification.titleKey]) || notification.titleKey || editorModuleKey;
            const helpBtn = footer.querySelector('.preview-modal__editor-help-btn');
            helpBtn?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const { loadAndShowEditorHelp } = await import('../editor/field-renderers.js');
                // Utiliser la clé éditeur résolue par detectContentType (ex: 'elea_devoir' au lieu de 'Devoir')
                const { editorState } = await import('../editor/index.js');
                const resolvedKey = (editorState.isActive && editorState.moduleKey) ? editorState.moduleKey : editorModuleKey;
                await loadAndShowEditorHelp(resolvedKey, editorModuleName);
            });
        }
    }

    // Afficher le chargement
    previewContainer.innerHTML = `
        <div class="json-editor__loading">
            <div class="json-editor__loading-spinner"></div>
            <span>${translations.editor_loading || 'Chargement de l\'éditeur...'}</span>
        </div>
    `;

    try {
        // Extraire les données JSON (chargement dynamique de l'éditeur)
        const editorModule = await import('../editor/index.js');
        const jsonData = await editorModule.extractJsonFromNotification(notification);

        if (!jsonData) {
            throw new Error('Impossible d\'extraire les données JSON');
        }

        // Initialiser l'éditeur
        const success = await editorModule.initJsonEditor(notification, previewContainer, jsonData, {
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

            // Masquer le warning de prévisualisation en mode édition
            const warningDiv = modal?.querySelector('.preview-modal__warning');
            if (warningDiv) {
                warningDiv.style.display = 'none';
                content?.classList.remove('has-warning');
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
    // Vérifier les modifications non sauvegardées (chargement dynamique)
    const editorModule = await import('../editor/index.js');
    if (editorModule.hasUnsavedChanges()) {
        const message = translations.editor_confirm_discard || 'Voulez-vous vraiment quitter ? Les modifications non sauvegardées seront perdues.';
        const title = translations.editor_confirm_discard_title || 'Modifications non enregistrées';
        const confirmText = translations.editor_discard_btn || 'Abandonner';
        const cancelText = translations.editor_cancel || 'Annuler';

        const { showConfirm } = await import('../editor/array-manager.js');
        const confirmed = await showConfirm(message, title, confirmText, cancelText, true);
        if (!confirmed) return;
    }

    // Détruire l'éditeur
    editorModule.destroyEditor();
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

    // Restaurer le warning de prévisualisation si activité non-H5P
    const warningDiv = modal?.querySelector('.preview-modal__warning');
    if (warningDiv && notification.type !== 'h5p') {
        const warningText = translations.simulator_warning || "Prévisualisation via le simulateur d'activités : le rendu final sur Éléa peut être légèrement différent.";
        warningDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${escapeHtml(warningText)}`;
        warningDiv.style.display = 'flex';
    }

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
async function resetEditModeState(modal) {
    if (!modal) return;

    debugLog('notifications', '[Edit Mode] Resetting state...');

    // Détruire l'éditeur (chargement dynamique)
    const { destroyEditor } = await import('../editor/index.js');
    destroyEditor();
    isEditModeActive = false;

    // Restaurer le footer
    const footer = modal.querySelector('.preview-modal__footer');
    const editBtn = modal.querySelector('.preview-modal__edit-btn');
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
 * Gère la sauvegarde depuis l'éditeur.
 *
 * Comportement unifié pour tous les types :
 *
 * - originalJsonData = source de vérité pour l'éditeur (lu en priorité par extractJsonFromNotification)
 * - jsonData = copie synchronisée (fallback pour exports DOCX/PDF/ODT)
 *
 * Les deux champs sont TOUJOURS mis à jour ensemble lors d'une sauvegarde éditeur.
 * Pour les Pages Éléa, previewHtml est aussi régénéré en parallèle.
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
        const regenerateResult = await regenerateFile(notification, result.data, result.moduleKey);

        // Gérer le résultat (peut être un Blob ou un objet {blob, previewHtml})
        const newBlob = regenerateResult?.blob || regenerateResult;
        const newPreviewHtml = regenerateResult?.previewHtml || null;

        if (newBlob) {
            // Mettre à jour la notification
            if (notification.blobUrl) {
                URL.revokeObjectURL(notification.blobUrl);
            }
            notification.blob = newBlob;
            notification.blobUrl = URL.createObjectURL(newBlob);

            // Mettre à jour les données de la notification
            // originalJsonData = source de vérité pour l'éditeur (lu en priorité par extractJsonFromNotification)
            // jsonData = copie de travail (fallback pour exports DOCX/PDF/ODT)
            notification.originalJsonData = result.data;
            notification.jsonData = result.data;

            // Pour les Pages : mettre à jour le previewHtml régénéré (mode Fidelity)
            if (notification.titleKey === 'elea_page_name' && newPreviewHtml) {
                notification.previewHtml = newPreviewHtml;
            }

            // Sortir du mode édition et re-render
            const modal = document.querySelector('.preview-modal');
            await resetEditModeState(modal);

            // Re-render la preview
            await renderPreview(notification, modal);

            // Notification de succès
            debugLog('notifications', '[Edit Mode] File regenerated successfully');
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
        debugLog('notifications', '[Regenerate] notification.type:', notification.type);
        debugLog('notifications', '[Regenerate] notification.titleKey:', notification.titleKey);
        debugLog('notifications', '[Regenerate] moduleKey:', moduleKey);
        debugLog('notifications', '[Regenerate] editedData keys:', Object.keys(editedData || {}));

        if (notification.type === 'h5p') {
            // Régénération H5P
            return await regenerateH5PFile(notification.blob, editedData, moduleKey, notification.titleKey);
        } else if (notification.type === 'mbz') {
            // Régénération MBZ
            return await regenerateMBZFile(notification, editedData, moduleKey);
        } else if (notification.type === 'xml' && notification.titleKey === 'elea_glossaire_xml_name') {
            // Régénération XML Glossaire
            debugLog('notifications', '[Regenerate] Going to regenerateGlossaireXMLFile');
            return await regenerateGlossaireXMLFile(editedData);
        } else if (notification.type === 'xml' && notification.titleKey === 'elea_test_xml_name') {
            // Régénération XML Test (banque de questions)
            debugLog('notifications', '[Regenerate] Going to regenerateMoodleTestXMLFile');
            return await regenerateMoodleTestXMLFile(editedData);
        } else {
            // Pour les autres types, mettre à jour jsonData suffit
            return notification.blob;
        }
    } catch (error) {
        console.error('[Regenerate] Error:', error);
        return null;
    }
}

/**
 * Régénère un fichier XML Glossaire avec les nouvelles données
 * Utilise la MÊME méthode que handleGlossaireXmlCreation dans moodle-creator.js
 * @param {Object} editedData - Les données éditées (format: {name, entries: [{concept, definition, aliases?}]})
 * @returns {Promise<Blob>}
 */
async function regenerateGlossaireXMLFile(editedData) {
    try {
        debugLog('notifications', '[Regenerate XML] Received editedData:', JSON.stringify(editedData, null, 2));
        debugLog('notifications', '[Regenerate XML] editedData.name:', editedData?.name);
        debugLog('notifications', '[Regenerate XML] editedData.entries:', editedData?.entries);
        debugLog('notifications', '[Regenerate XML] Is entries array?', Array.isArray(editedData?.entries));

        // Import dynamique pour éviter la dépendance circulaire
        const [{ escapeXml }, { formatTextToHtml }] = await Promise.all([
            import('../moodle/moodle-formats.js'),
            import('../core/utils.js')
        ]);

        // Construire le XML (identique à handleGlossaireXmlCreation)
        let entriesXml = '';
        if (Array.isArray(editedData.entries)) {
            for (const entry of editedData.entries) {
                if (!entry.concept || !entry.definition) {
                    console.warn("[Regenerate XML] Entrée ignorée (concept ou définition manquant):", entry);
                    continue;
                }

                let aliasesXml = '';
                if (Array.isArray(entry.aliases) && entry.aliases.length > 0) {
                    aliasesXml = '<ALIASES>' + entry.aliases.map(alias => `<ALIAS><NAME>${escapeXml(alias)}</NAME></ALIAS>`).join('') + '</ALIASES>';
                }

                entriesXml += `
      <ENTRY>
        <CONCEPT>${escapeXml(entry.concept)}</CONCEPT>
        <DEFINITION>${escapeXml(formatTextToHtml(entry.definition))}</DEFINITION>
        <FORMAT>1</FORMAT>
        <DEFINITIONTRUST>0</DEFINITIONTRUST>
        <USEDYNALINK>1</USEDYNALINK>
        <CASESENSITIVE>0</CASESENSITIVE>
        <FULLMATCH>0</FULLMATCH>
        <TEACHERENTRY>1</TEACHERENTRY>
        ${aliasesXml}
      </ENTRY>`;
            }
        }

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<GLOSSARY>
  <INFO>
    <NAME>${escapeXml(editedData.name || 'Glossaire')}</NAME>
    <INTRO><p dir="ltr" style="text-align: left;"></p></INTRO>
    <INTROFORMAT>1</INTROFORMAT>
    <ALLOWDUPLICATEDENTRIES>0</ALLOWDUPLICATEDENTRIES>
    <DISPLAYFORMAT>dictionary</DISPLAYFORMAT>
    <SHOWSPECIAL>1</SHOWSPECIAL>
    <SHOWALPHABET>1</SHOWALPHABET>
    <SHOWALL>1</SHOWALL>
    <ALLOWCOMMENTS>0</ALLOWCOMMENTS>
    <USEDYNALINK>0</USEDYNALINK>
    <DEFAULTAPPROVAL>0</DEFAULTAPPROVAL>
    <GLOBALGLOSSARY>0</GLOBALGLOSSARY>
    <ENTBYPAGE>10</ENTBYPAGE>
    <ENTRIES>${entriesXml}
    </ENTRIES>
  </INFO>
</GLOSSARY>`;

        debugLog('notifications', '[Regenerate XML] entriesXml length:', entriesXml.length);
        debugLog('notifications', '[Regenerate XML] xmlContent length:', xmlContent.length);
        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
        debugLog('notifications', '[Regenerate XML] Successfully regenerated, size:', xmlBlob.size);
        return xmlBlob;
    } catch (error) {
        console.error('[Regenerate XML] Error:', error);
        throw error;
    }
}

/**
 * Régénère un fichier XML Test (banque de questions Moodle) avec les nouvelles données
 * Utilise generateMoodleXml de moodle-formats.js (déjà importé en haut du fichier)
 * @param {Object} editedData - Les données éditées (format: {bank_name, bank_description, questions: [...]})
 * @returns {Promise<Blob>}
 */
async function regenerateMoodleTestXMLFile(editedData) {
    try {
        debugLog('notifications', '[Regenerate MoodleXML] Received editedData:', Object.keys(editedData || {}));
        const { generateMoodleXml } = await import('../moodle/moodle-formats.js');
        const xmlContent = generateMoodleXml(editedData);
        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
        debugLog('notifications', '[Regenerate MoodleXML] Successfully regenerated, size:', xmlBlob.size);
        return xmlBlob;
    } catch (error) {
        console.error('[Regenerate MoodleXML] Error:', error);
        throw error;
    }
}

/**
 * Régénère un fichier MBZ avec les nouvelles données
 * Applique les MÊMES transformations que la création originale (moodle-creator.js)
 * @param {Notification} notification - La notification originale
 * @param {Object} editedData - Les données éditées (format brut: {title, pairs, questions, etc.})
 * @param {string} moduleKey - La clé du module
 * @returns {Promise<Blob|null>}
 */
async function regenerateMBZFile(notification, editedData, moduleKey) {
    try {
        // Import dynamique pour éviter la dépendance circulaire
        const [{ createMbz }, MoodleProcessors, { escapeXml }, { normalizeDoubleEscapedLatex, repairBrokenLatexEscapes, autoWrapLatex, convertLatexDelimitersDeep }] = await Promise.all([
            import('../moodle/moodle-creator.js'),
            import('../moodle/processors/index.js'),
            import('../moodle/moodle-formats.js'),
            import('../h5p/json-healer.js')
        ]);
        // Pipeline LaTeX complet pour Moodle : normalize → repair → convert $→\( → auto-wrap nu
        const healLatex = (data) => autoWrapLatex(convertLatexDelimitersDeep(repairBrokenLatexEscapes(normalizeDoubleEscapedLatex(data))));

        // Mapper le titleKey vers le type de processeur Moodle
        const titleKeyToMoodleType = {
            'elea_page_name': 'Page',
            'elea_millionnaire_name': 'Millionnaire',
            'elea_appariement_name': 'Appariement',
            'elea_qcm_name': 'QCM',
            'elea_test_name': 'Test',
            'elea_glossaire_name': 'Glossaire',
            'elea_devoir_name': 'Devoir'
        };

        const moodleType = titleKeyToMoodleType[notification.titleKey];
        if (!moodleType) {
            console.error('[Regenerate MBZ] Unknown titleKey:', notification.titleKey);
            return notification.blob;
        }

        // Générer les données de base (IDs, timestamps) - même logique que moodle-creator.js
        const baseData = MoodleProcessors.generateBaseData(editedData.title || notification.title || 'Activity');

        // Appliquer les transformations SPÉCIFIQUES à chaque type d'activité
        // (identique à ce qui est fait dans moodle-creator.js)
        let activitySpecificData = {};

        switch (moodleType) {
            case 'Appariement': {
                // Pipeline LaTeX complet pour MathJax Moodle
                editedData = healLatex(editedData);
                // Transformation des pairs en ASSOCIATIONS_JSON (identique à handleAppariementCreation)
                if (Array.isArray(editedData.pairs)) {
                    const questions = {};
                    const responses = {};
                    editedData.pairs.forEach((pair, index) => {
                        let q = String(pair.question ?? '').trim();
                        let a = String(pair.answer ?? '').trim();
                        // Envelopper dans <p> si pas déjà HTML
                        if (!q.match(/^\s*<p[\s>]/i)) {
                            q = `<p dir="ltr" style="text-align: left;">${q}</p>`;
                        }
                        if (!a.match(/^\s*<p[\s>]/i)) {
                            a = `<p dir="ltr" style="text-align: left;">${a}</p>`;
                        }
                        questions[index + 1] = q;
                        responses[index + 1] = a;
                    });
                    activitySpecificData.ASSOCIATIONS_JSON = escapeXml(JSON.stringify({ questions, responses }));
                }
                // Intro HTML
                let introHtml = editedData.intro ? String(editedData.intro).trim() : (translations.appariement_activity_intro || "Trouvez les paires correspondantes.");
                if (!introHtml.match(/^\s*<p[\s>]/i)) {
                    introHtml = `<p dir="ltr" style="text-align: left;">${introHtml}</p>`;
                }
                activitySpecificData.ACTIVITY_INTRO_HTML = escapeXml(introHtml);
                break;
            }

            case 'Millionnaire': {
                // Transformation des questions en QUESTIONS_JSON (identique à handleMillionnaireCreation)
                if (Array.isArray(editedData.questions)) {
                    // S'assurer que badanswer est un tableau pour chaque question
                    const cleanedQuestions = editedData.questions.map(q => {
                        let badanswer = q.badanswer;
                        // Convertir en tableau si c'est une string (après édition avec stringArray)
                        if (!Array.isArray(badanswer)) {
                            badanswer = typeof badanswer === 'string'
                                ? badanswer.split('\n').map(s => s.trim()).filter(s => s.length > 0)
                                : [];
                        }
                        return {
                            question: q.question || '',
                            goodanswer: q.goodanswer || '',
                            badanswer: badanswer
                        };
                    });
                    activitySpecificData.QUESTIONS_JSON = escapeXml(JSON.stringify(cleanedQuestions));
                }
                activitySpecificData.ACTIVITY_INTRO_HTML = `<p>${translations.millionnaire_activity_intro || "Bienvenue dans ce quiz de type Millionnaire !"}</p>`;
                break;
            }

            case 'QCM': {
                // Pipeline LaTeX complet pour MathJax Moodle
                editedData = healLatex(editedData);
                // Transformation des questions avec formatage HTML (identique à handleQCMCreation)
                // Convertit markdown **gras** et *italique* en HTML
                const formatMarkdown = (text) => {
                    if (!text) return '';
                    return text
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(/\*(.*?)\*/g, '<i>$1</i>');
                };

                if (Array.isArray(editedData.questions)) {
                    const formattedQuestions = editedData.questions.map(question => {
                        const formatted = { ...question };
                        if (formatted.text) {
                            let text = formatMarkdown(formatted.text);
                            if (!text.match(/^\s*<p[\s>]/i)) {
                                text = `<p>${text}</p>`;
                            }
                            formatted.text = text;
                        }
                        if (Array.isArray(formatted.answers)) {
                            formatted.answers = formatted.answers.map(answer => {
                                const formattedAnswer = { ...answer };
                                if (formattedAnswer.text) {
                                    let text = formatMarkdown(formattedAnswer.text);
                                    if (!text.match(/^\s*<p[\s>]/i)) {
                                        text = `<p>${text}</p>`;
                                    }
                                    formattedAnswer.text = text;
                                }
                                return formattedAnswer;
                            });
                        }
                        return formatted;
                    });
                    activitySpecificData.QUESTIONS_JSON = escapeXml(JSON.stringify(formattedQuestions));
                }
                activitySpecificData.ACTIVITY_INTRO_HTML = escapeXml(`<p dir="ltr" style="text-align: left;">${translations.qcm_activity_intro || "Répondez aux questions suivantes."}</p>`);
                break;
            }

            case 'Page': {
                // Pipeline LaTeX complet pour MathJax Moodle
                editedData = healLatex(editedData);
                // Pour Page, on a besoin de CONTENT et INTRO
                // Import dynamique de la fonction de génération HTML
                let generatedHtml = null;
                try {
                    const { generateHtmlFromBlocks } = await import('../moodle/moodle-creator.js');
                    if (typeof generateHtmlFromBlocks === 'function' && Array.isArray(editedData.blocks)) {
                        generatedHtml = await generateHtmlFromBlocks(editedData);
                        activitySpecificData.CONTENT = escapeXml(generatedHtml);
                    }
                } catch (e) {
                    // Fallback: si generateHtmlFromBlocks n'est pas exportée, on utilise le contenu brut
                    console.warn('[Regenerate MBZ] generateHtmlFromBlocks not available, using raw content');
                    activitySpecificData.CONTENT = escapeXml(editedData.content || '');
                }
                activitySpecificData.PAGE_NAME = escapeXml(editedData.title || notification.title || 'Page');
                activitySpecificData.INTRO = escapeXml(editedData.intro || '');
                // Stocker le HTML généré pour le retourner plus tard (pour previewHtml)
                activitySpecificData._generatedPreviewHtml = generatedHtml;
                break;
            }

            case 'Devoir': {
                // Transformation identique à handleDevoirCreation (moodle-creator.js)
                // Intro HTML depuis la description
                let introHtml = editedData.description ? String(editedData.description).trim() : (translations.devoir_activity_intro || "Consultez la grille d'évaluation ci-dessous pour connaître les critères de réussite.");
                if (!introHtml.match(/^\s*<p[\s>]/i)) {
                    introHtml = `<p dir="ltr" style="text-align: left;">${introHtml}</p>`;
                }
                activitySpecificData.ACTIVITY_INTRO_HTML = escapeXml(introHtml);
                activitySpecificData.RUBRIC_NAME = editedData.rubricName || editedData.title || 'Grille d\'évaluation';
                activitySpecificData.CRITERIA = editedData.criteria || [];
                break;
            }

            default:
                console.warn('[Regenerate MBZ] No specific transformation for:', moodleType);
        }

        // Fusionner les données de base avec les données spécifiques à l'activité
        const data = {
            ...baseData,
            ACTIVITY_TITLE: escapeXml(editedData.title || notification.title || 'Activity'),
            COURSE_FULLNAME: escapeXml(editedData.title || notification.title || 'Activity'),
            ...activitySpecificData
        };

        debugLog('notifications', '[Regenerate MBZ] Building files for:', moodleType, 'with data keys:', Object.keys(data));

        // Générer les fichiers via le processeur
        let files = MoodleProcessors.getActivityFiles(moodleType, data);
        files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';

        // Créer le nouveau MBZ avec createMbz (identique à moodle-creator.js)
        const gzData = await createMbz(files);
        const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });

        debugLog('notifications', '[Regenerate MBZ] Successfully regenerated:', moodleType, 'Size:', mbzBlob.size);

        // Pour les Pages, retourner aussi le previewHtml pour le mode Fidelity
        if (moodleType === 'Page' && activitySpecificData._generatedPreviewHtml) {
            return { blob: mbzBlob, previewHtml: activitySpecificData._generatedPreviewHtml };
        }
        return mbzBlob;
    } catch (error) {
        console.error('[Regenerate MBZ] Error:', error);
        return notification.blob; // Fallback : retourner le blob original
    }
}

/**
 * Régénère un fichier H5P avec les nouvelles données
 * Utilise JSZip pour LIRE le ZIP original, puis client-zip pour le RECRÉER
 * (même méthode que h5p-creator.js pour compatibilité Éléa/Lumi)
 */
async function regenerateH5PFile(originalBlob, editedData, moduleKey, titleKey) {
    try {
        // Charger JSZip pour LIRE le ZIP original
        if (!window.JSZip) {
            await loadJSZip();
        }

        debugLog('notifications', '[Regenerate H5P] Original blob size:', originalBlob.size);

        // Charger le ZIP original pour extraire h5p.json
        const zip = await window.JSZip.loadAsync(originalBlob);

        // Debug: lister les fichiers dans le ZIP original
        const fileList = Object.keys(zip.files);
        debugLog('notifications', '[Regenerate H5P] Files in original ZIP:', fileList);

        // Extraire h5p.json du ZIP original
        const h5pJsonFile = zip.file('h5p.json');
        if (!h5pJsonFile) {
            throw new Error('h5p.json not found in original H5P file');
        }
        const h5pJsonString = await h5pJsonFile.async('string');
        const h5pJson = JSON.parse(h5pJsonString);
        debugLog('notifications', '[Regenerate H5P] Extracted h5p.json:', h5pJson.title);

        // Appliquer le processeur pour transformer Markdown -> HTML
        // Deep clone pour que le processeur ne mute pas les données d'entrée
        // (sinon originalJsonData est corrompu et le 2e cycle d'édition casse)
        const dataToProcess = JSON.parse(JSON.stringify(editedData));
        let processedData = dataToProcess;
        debugLog('notifications', '[Regenerate H5P] moduleKey:', moduleKey);
        debugLog('notifications', '[Regenerate H5P] editedData keys:', Object.keys(editedData || {}));
        if (moduleKey) {
            const { processH5PContent } = await import('../h5p/processors/index.js');
            const result = await processH5PContent(moduleKey, dataToProcess);
            debugLog('notifications', '[Regenerate H5P] processH5PContent result:', result ? 'SUCCESS' : 'NULL');
            if (result) {
                // Le processeur peut retourner { content, dependencies } ou directement le contenu
                if (result.content && result.dependencies) {
                    processedData = result.content;
                    debugLog('notifications', '[Regenerate H5P] Processor returned content + dependencies');
                } else {
                    processedData = result;
                    debugLog('notifications', '[Regenerate H5P] Processor returned direct content');
                }
                debugLog('notifications', '[Regenerate H5P] processedData.checkAnswerButton:', processedData.checkAnswerButton);
            } else {
                console.warn('[Regenerate H5P] No processor result, using editedData directly');
            }
        }

        // Préparer le content.json
        const contentJsonString = JSON.stringify(processedData, null, 2);
        debugLog('notifications', '[Regenerate H5P] Updated content.json, length:', contentJsonString.length);

        // Charger client-zip via lib-loader (centralisé)
        const downloadZip = await loadClientZip();

        // Créer la liste des fichiers pour client-zip (même format que h5p-creator.js)
        const files = [];

        // 1. content/content.json
        files.push({
            name: "content/content.json",
            input: new TextEncoder().encode(contentJsonString),
            unixPermissions: 0o100644
        });

        // 2. h5p.json (réutiliser celui du ZIP original)
        files.push({
            name: "h5p.json",
            input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)),
            unixPermissions: 0o100644
        });

        // 3. Génération du Zip avec client-zip (identique à h5p-creator.js)
        const zipBlob = await downloadZip(files).blob();

        debugLog('notifications', '[Regenerate H5P] New blob size:', zipBlob.size);

        // Recréer le blob avec le MIME type correct (identique à h5p-creator.js)
        const h5pBlob = new Blob([zipBlob], { type: 'application/octet-stream' });

        return h5pBlob;
    } catch (error) {
        console.error('[Regenerate H5P] Error:', error);
        throw error;
    }
}
