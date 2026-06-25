/**
 * @file Point d'entrée principal de l'application Caramel.
 * Ce fichier orchestre l'initialisation des différents modules après le chargement du DOM.
 * Il importe les fonctions nécessaires depuis les modules spécialisés et les exécute dans l'ordre approprié.
 */

import { loadTranslations, initLanguageSwitcher } from './core/translation.js';
import { setupFilters, generateTiles, initGenerationResultModal } from './ui/ui.js';
import { initOcr } from './services/ocr.js';
import { showHelpModal, setupEventListeners } from './core/utils.js';
import { initCaramelAnimationEffects } from './ui/animations.js';
import { initVersionChecker } from './ui/version-checker.js';
import { initEmergencyNotifications } from './ui/emergency-notification.js';
import { initSmartPreloading } from './core/lib-loader.js';
import { initNotificationCenter, initNotificationDropdown, initToastNotifications, initPreviewModal } from './ui/notifications.js';
import { initDebugLogger } from './ui/debug-logger.js';
import { initPromptMic } from './ui/prompt-mic.js';

document.addEventListener('DOMContentLoaded', function() {
    // Panneau de logs debug (ne fait rien si ?debug absent)
    initDebugLogger();

    // Initialisation de l'interface de base
    setupFilters();

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
    initGenerationResultModal();

    // Initialisation de la logique OCR
    initOcr();

    // Branche la saisie vocale (micro Caramelia) sur les champs Qui/Quoi/Niveau
    initPromptMic();

    // Initialisation des effets de l'animation caramel
    initCaramelAnimationEffects();

    // Initialisation du préchargement intelligent des bibliothèques
    initSmartPreloading();

    // Pont d'intégration embarquée (iframe) : chargé UNIQUEMENT en mode ?embed.
    // Import dynamique gardé → en mode normal, ni embed-bridge.js ni sa dépendance
    // (caramelia/config.js) ne sont téléchargés/parsés. Coût normal = 0 (juste ce test d'URL).
    if (new URLSearchParams(window.location.search).has('embed')) {
        import('./embed/embed-bridge.js')
            .then(m => m.initEmbedBridge())
            .catch(e => console.error('[embed] chargement du pont échoué:', e));
    }

    // Chargement des traductions complètes (met à jour les textes si nécessaire)
    loadTranslations('fr').then(() => {
        initVersionChecker();
    });
});
