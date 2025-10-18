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

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de l'interface de base
    setupTabs();
    initDragToScroll();
    
    // Initialisation des écouteurs d'événements globaux
    setupEventListeners();
    
    // Initialisation du sélecteur de langue
    initLanguageSwitcher();

    // Initialisation de la logique OCR
    initOcr();

    // Initialisation des effets de l'animation caramel
    initCaramelAnimationEffects();

    // Chargement de la traduction initiale et génération des tuiles
    loadTranslations('fr').then(() => {
        generateTiles();
    });
});