/**
 * @file Module de rendu mathématique pour les formules LaTeX dans les simulateurs.
 * Utilise MathJax pour le rendu des expressions mathématiques.
 */

import { loadMathJax } from '../core/lib-loader.js';

/**
 * Classe singleton pour gérer le rendu mathématique avec MathJax.
 */
class MathRenderer {
    constructor() {
        this.isReady = false;
        this.mathjaxReady = false;
        this.pendingElements = [];
        this.initPromise = null;
    }

    /**
     * Initialise MathJax si nécessaire.
     * @returns {Promise<void>}
     */
    async init() {
        // Si déjà initialisé, retourner immédiatement
        if (this.isReady) {
            return Promise.resolve();
        }

        // Si une initialisation est en cours, retourner la promesse existante
        if (this.initPromise) {
            return this.initPromise;
        }

        // Créer une nouvelle promesse d'initialisation
        this.initPromise = (async () => {
            try {
                // Charger MathJax via le lib-loader
                await loadMathJax();

                // Vérifier que MathJax est bien chargé
                if (window.MathJax && window.MathJax.typesetPromise) {
                    this.isReady = true;
                    this.mathjaxReady = true;
                } else {
                    throw new Error('MathJax not loaded properly');
                }
            } catch (error) {
                console.error('Erreur lors du chargement de MathJax:', error);
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Traite et rend les formules mathématiques dans un élément HTML.
     * @param {HTMLElement} element - L'élément à traiter.
     * @returns {Promise<void>}
     */
    async renderMath(element) {
        if (!element) return;

        try {
            await this.init();

            if (this.mathjaxReady && window.MathJax && window.MathJax.typesetPromise) {
                await window.MathJax.typesetPromise([element]);
            }
        } catch (error) {
            console.error('Erreur lors du rendu mathématique:', error);
        }
    }

    /**
     * Traite le texte pour s'assurer que les formules LaTeX sont bien formatées.
     * Convertit les patterns courants en format reconnu par MathJax.
     * @param {string} text - Le texte à traiter.
     * @returns {string} Le texte formaté.
     */
    preprocessText(text) {
        if (!text) return '';

        // Ne rien modifier si le texte contient déjà des délimiteurs LaTeX corrects
        // On laisse MathJax gérer \(...\), \[...\], $$...$$
        return text;
    }

    /**
     * Applique le formatage markdown ET le rendu mathématique.
     * @param {string} text - Le texte à formater.
     * @param {HTMLElement} targetElement - L'élément cible où le texte sera inséré.
     * @returns {Promise<string>} Le texte formaté (sans le rendu math, qui sera fait après insertion).
     */
    async formatTextWithMath(text, targetElement = null) {
        if (!text) return '';

        // Formatage Markdown basique
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Prétraiter le texte pour LaTeX si nécessaire
        formatted = this.preprocessText(formatted);

        return formatted;
    }

    /**
     * Efface le cache MathJax (utile pour le rafraîchissement).
     */
    clearCache() {
        if (window.MathJax && window.MathJax.typesetClear) {
            window.MathJax.typesetClear();
        }
    }
}

// Instance singleton
const mathRenderer = new MathRenderer();

// Export pour utilisation dans d'autres modules
export { mathRenderer };
