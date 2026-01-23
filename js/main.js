/**
 * @file Point d'entrée principal de l'application Caramel.
 * Ce fichier orchestre l'initialisation des différents modules après le chargement du DOM.
 * Il importe les fonctions nécessaires depuis les modules spécialisés et les exécute dans l'ordre approprié.
 */

import { loadTranslations, initLanguageSwitcher } from './modules/translation.js';
import { setupTabs, generateTiles, initDragToScroll } from './modules/ui.js';
import { initOcr } from './modules/ocr.js';
import { showHelpModal, setupEventListeners } from './modules/utils.js';
import { initCaramelAnimationEffects } from './modules/animations.js';
import { initVersionChecker } from './modules/version-checker.js';
import { initEmergencyNotifications } from './modules/emergency-notification.js';
import { initSmartPreloading } from './modules/lib-loader.js';
import { initNotificationCenter, initNotificationDropdown, initToastNotifications, initPreviewModal } from './modules/notifications.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de l'interface de base
    setupTabs();
    initDragToScroll();

    // Génération immédiate des tuiles avec les traductions françaises par défaut
    // (les traductions par défaut sont déjà chargées dans translation.js)
    generateTiles();

    // Initialisation des écouteurs d'événements globaux
    setupEventListeners();

    // Initialisation du sélecteur de langue et du centre de notifications
    initLanguageSwitcher();
    initNotificationCenter();
    initNotificationDropdown();
    initToastNotifications();
    initPreviewModal();
    initEmergencyNotifications();

    // Initialisation de la logique OCR
    initOcr();

    // Initialisation des effets de l'animation caramel
    initCaramelAnimationEffects();

    // Initialisation du préchargement intelligent des bibliothèques
    initSmartPreloading();

    // Chargement des traductions complètes (met à jour les textes si nécessaire)
    loadTranslations('fr').then(() => {
        initVersionChecker();
    });
});
