/**
 * @file Gère les animations dynamiques de l'interface.
 * Ce module est responsable de la création d'effets visuels, comme l'animation de la casserole.
 */

/**
 * Initialise les effets visuels pour l'animation de la casserole de caramel.
 * Crée des bulles et des étincelles de manière dynamique pour rendre l'animation plus vivante.
 */
export function initCaramelAnimationEffects() {
    const sparklesContainer = document.getElementById('sparkles-container');
    const bubblesContainer = document.getElementById('bubbles-container');

    if (!sparklesContainer || !bubblesContainer) return;

    // Créer des étincelles
    setInterval(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
        sparkle.style.animationDelay = `${Math.random() * 0.2}s`;
        sparklesContainer.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 1000);
    }, 200);

    // Créer des bulles
    setInterval(() => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${Math.random() * 90}%`; // 90% pour rester dans la casserole
        bubble.style.width = `${5 + Math.random() * 10}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.animationDuration = `${1.5 + Math.random()}s`;
        bubblesContainer.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, 2500);
    }, 300);
}