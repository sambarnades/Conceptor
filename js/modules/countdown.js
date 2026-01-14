/**
 * Module Compte à Rebours Événementiel - Caramel
 * Date cible: 23 janvier 2026, 16h00 (heure de Paris)
 * Journée internationale de l'écriture manuscrite
 *
 * Ce module gère l'affichage et la mise à jour du compte à rebours
 * dans le header du site Caramel.
 */

(function() {
    'use strict';

    // Configuration de l'événement
    const EVENT_CONFIG = {
        // Date cible: Vendredi 23 janvier 2026 à 16h00 (4:00 PM) heure de Paris (UTC+1)
        targetDate: new Date('2026-01-23T16:00:00+01:00'),

        // Afficher le compte à rebours même après l'événement (pour debug)
        showAfterEvent: false,

        // Message après l'événement
        completedMessage: 'Événement en cours !',

        // Auto-masquer après l'événement (en millisecondes, 0 = jamais)
        autoHideDelay: 0
    };

    // Références aux éléments DOM
    let elements = {
        container: null,
        label: null,
        days: null,
        hours: null,
        minutes: null,
        seconds: null,
        tiles: {
            days: null,
            hours: null,
            minutes: null,
            seconds: null
        }
    };

    // Valeurs précédentes pour détecter les changements
    let previousValues = {
        days: null,
        hours: null,
        minutes: null,
        seconds: null
    };

    // Identifiant de l'intervalle de mise à jour
    let updateInterval = null;

    /**
     * Initialise le module de compte à rebours
     */
    function init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCountdown);
        } else {
            initCountdown();
        }
    }

    /**
     * Initialise les éléments et démarre le compte à rebours
     */
    function initCountdown() {
        // Récupérer les éléments DOM
        elements.container = document.querySelector('.countdown-container');
        elements.label = document.querySelector('.countdown-label');
        elements.days = document.getElementById('countdown-days');
        elements.hours = document.getElementById('countdown-hours');
        elements.minutes = document.getElementById('countdown-minutes');
        elements.seconds = document.getElementById('countdown-seconds');

        // Récupérer les tuiles pour l'animation
        elements.tiles.days = document.getElementById('tile-days');
        elements.tiles.hours = document.getElementById('tile-hours');
        elements.tiles.minutes = document.getElementById('tile-minutes');
        elements.tiles.seconds = document.getElementById('tile-seconds');

        // Vérifier que tous les éléments sont présents
        if (!elements.container || !elements.days || !elements.hours ||
            !elements.minutes || !elements.seconds) {
            console.warn('Compte à rebours: Éléments DOM non trouvés');
            return;
        }

        // Première mise à jour immédiate
        updateCountdown();

        // Mettre à jour toutes les secondes
        updateInterval = setInterval(updateCountdown, 1000);

        // Ajouter un écouteur pour nettoyer lors du déchargement de la page
        window.addEventListener('beforeunload', cleanup);
    }

    /**
     * Calcule le temps restant jusqu'à l'événement
     * @returns {Object} Objet contenant jours, heures, minutes, secondes
     */
    function calculateTimeRemaining() {
        const now = new Date();
        const diff = EVENT_CONFIG.targetDate - now;

        // Si l'événement est passé
        if (diff <= 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isCompleted: true
            };
        }

        // Calculer les unités de temps
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            isCompleted: false
        };
    }

    /**
     * Met à jour l'affichage du compte à rebours
     */
    function updateCountdown() {
        const time = calculateTimeRemaining();

        // Si l'événement est terminé
        if (time.isCompleted) {
            handleEventCompleted();
            return;
        }

        // Formater les valeurs avec padding (00, 01, 02, etc.)
        const formattedValues = {
            days: padZero(time.days),
            hours: padZero(time.hours),
            minutes: padZero(time.minutes),
            seconds: padZero(time.seconds)
        };

        // Mettre à jour chaque unité avec animation si la valeur a changé
        updateFlipTile('days', formattedValues.days);
        updateFlipTile('hours', formattedValues.hours);
        updateFlipTile('minutes', formattedValues.minutes);
        updateFlipTile('seconds', formattedValues.seconds);
    }

    /**
     * Met à jour une tuile flip avec animation si la valeur a changé
     * @param {string} unit - Unité de temps (days, hours, minutes, seconds)
     * @param {string} newValue - Nouvelle valeur formatée
     */
    function updateFlipTile(unit, newValue) {
        // Si c'est la première mise à jour, juste définir la valeur
        if (previousValues[unit] === null) {
            elements[unit].textContent = newValue;
            previousValues[unit] = newValue;
            return;
        }

        // Si la valeur a changé, animer le flip
        if (previousValues[unit] !== newValue) {
            animateFlip(unit, newValue);
            previousValues[unit] = newValue;
        }
    }

    /**
     * Anime le changement d'une tuile avec un effet subtil
     * @param {string} unit - Unité de temps
     * @param {string} newValue - Nouvelle valeur
     */
    function animateFlip(unit, newValue) {
        const tile = elements.tiles[unit];
        if (!tile) return;

        // Ajouter la classe d'animation subtile
        tile.classList.add('changing');

        // Mettre à jour la valeur immédiatement
        elements[unit].textContent = newValue;

        // Retirer la classe après l'animation (0.4s)
        setTimeout(() => {
            tile.classList.remove('changing');
        }, 400);
    }

    /**
     * Gère l'affichage lorsque l'événement est terminé
     */
    function handleEventCompleted() {
        // Arrêter les mises à jour
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }

        if (EVENT_CONFIG.showAfterEvent) {
            // Afficher 00:00:00:00
            elements.days.textContent = '00';
            elements.hours.textContent = '00';
            elements.minutes.textContent = '00';
            elements.seconds.textContent = '00';

            // Changer le label
            if (elements.label) {
                elements.label.textContent = EVENT_CONFIG.completedMessage;
            }

            // Ajouter une classe pour le style "complété"
            elements.container.classList.add('event-completed');
        } else {
            // Masquer le compte à rebours
            hideCountdown();
        }

        // Auto-masquer après un délai si configuré
        if (EVENT_CONFIG.autoHideDelay > 0) {
            setTimeout(hideCountdown, EVENT_CONFIG.autoHideDelay);
        }
    }

    /**
     * Masque le compte à rebours avec une animation
     */
    function hideCountdown() {
        if (elements.container) {
            elements.container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            elements.container.style.opacity = '0';
            elements.container.style.transform = 'scale(0.9)';

            setTimeout(() => {
                elements.container.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Ajoute un zéro devant les nombres < 10
     * @param {number} num - Nombre à formatter
     * @returns {string} Nombre formatté avec zéro
     */
    function padZero(num) {
        return String(num).padStart(2, '0');
    }

    /**
     * Nettoie les ressources (intervalles, écouteurs)
     */
    function cleanup() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    /**
     * Fonction publique pour obtenir le temps restant
     * Utile pour d'autres scripts qui voudraient accéder au compte à rebours
     * @returns {Object} Temps restant
     */
    function getTimeRemaining() {
        return calculateTimeRemaining();
    }

    /**
     * Fonction publique pour formater le temps en texte lisible
     * @returns {string} Temps formatté
     */
    function getFormattedTime() {
        const time = calculateTimeRemaining();

        if (time.isCompleted) {
            return EVENT_CONFIG.completedMessage;
        }

        let parts = [];
        if (time.days > 0) parts.push(`${time.days} jour${time.days > 1 ? 's' : ''}`);
        if (time.hours > 0) parts.push(`${time.hours} heure${time.hours > 1 ? 's' : ''}`);
        if (time.minutes > 0) parts.push(`${time.minutes} minute${time.minutes > 1 ? 's' : ''}`);
        if (time.seconds > 0) parts.push(`${time.seconds} seconde${time.seconds > 1 ? 's' : ''}`);

        return parts.join(', ') || 'Maintenant !';
    }

    // Exporter les fonctions publiques pour usage externe
    window.CaramelCountdown = {
        init,
        getTimeRemaining,
        getFormattedTime,
        cleanup
    };

    // Auto-initialiser
    init();

})();
