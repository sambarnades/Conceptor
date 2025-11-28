/**
 * @file Gestion centralisée du bandeau d'alerte.
 * Ce module récupère périodiquement un fichier Markdown distant afin de
 * déterminer si un message d'urgence doit être affiché sur l'interface.
 */

import { currentLang } from './translation.js';

/* =========================================================================
   Paramètres principaux — ajustables rapidement par l'équipe produit.
   ========================================================================= */
const ENABLE_EMERGENCY_NOTIFICATIONS = true;     // Basculer sur false pour désactiver toute la mécanique.
const POLLING_INTERVAL_MS = 60000;               // Fréquence de rafraîchissement (ex: 60 s).
const REMOTE_NOTICE_URL = 'https://codimd.apps.education.fr/s/cEaAzWxKC/download';
const REQUEST_TIMEOUT_MS = 8000;                 // Evite les requêtes pendantes.

/* ========================================================================= */
let pollTimerId = null;
let lastNoticePayload = null;
let containerElement = null;

/**
 * Initialise la surveillance des notifications d'urgence.
 */
export function initEmergencyNotifications() {
    if (!ENABLE_EMERGENCY_NOTIFICATIONS) {
        return;
    }

    containerElement = document.getElementById('emergency-notification-container');
    if (!containerElement) {
        console.warn('[EmergencyNotification] Conteneur introuvable.');
        return;
    }

    // Premier rafraîchissement, puis planification en tâche de fond.
    refreshNotification();
    if (Number.isFinite(POLLING_INTERVAL_MS) && POLLING_INTERVAL_MS > 0) {
        pollTimerId = window.setInterval(refreshNotification, POLLING_INTERVAL_MS);
    }

    // Synchronise le contenu lorsque la langue change.
    window.addEventListener('caramel:language-changed', () => {
        if (lastNoticePayload?.enabled) {
            renderBanner(lastNoticePayload);
        }
    });
}

/**
 * Récupère le Markdown distant et met à jour le DOM en conséquence.
 */
async function refreshNotification() {
    try {
        const payload = await fetchRemotePayload();
        if (!payload) {
            hideBanner();
            return;
        }

        lastNoticePayload = payload;
        if (payload.enabled) {
            renderBanner(payload);
        } else {
            hideBanner();
        }
    } catch (error) {
        console.warn('[EmergencyNotification] Impossible de récupérer la notification :', error);
    }
}

/**
 * Télécharge et convertit le fichier Markdown brut en objet exploitable.
 * @returns {Promise<{enabled: boolean, texts: Record<string,string>}|null>}
 */
async function fetchRemotePayload() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(REMOTE_NOTICE_URL, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Statut HTTP ${response.status}`);
        }

        const rawText = await response.text();
        const parsed = parseMarkdownPayload(rawText);
        return parsed;
    } finally {
        window.clearTimeout(timeout);
    }
}

/**
 * Convertit le fichier Markdown "clé = valeur" en dictionnaire.
 * @param {string} markdown
 */
function parseMarkdownPayload(markdown) {
    if (typeof markdown !== 'string' || !markdown.trim()) {
        return null;
    }

    const config = {};
    markdown.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s*([a-z0-9_]+)\s*=\s*(.+?)\s*$/i);
        if (!match) return;
        const [, key, value] = match;
        config[key.trim().toLowerCase()] = value.trim();
    });

    const enabled = (config.notification || 'non').toLowerCase() === 'oui';
    const texts = Object.entries(config).reduce((acc, [key, value]) => {
        if (key.startsWith('texte_')) {
            const langCode = key.replace('texte_', '');
            acc[langCode] = value;
        }
        return acc;
    }, {});

    return { enabled, texts };
}

/**
 * Convertit un texte markdown simple en HTML.
 * Gère le gras (**texte**), l'italique (*texte*) et échappe les caractères HTML.
 * @param {string} text
 * @returns {string}
 */
function convertMarkdownToHtml(text) {
    if (!text) return '';

    // Décode les entités HTML qui pourraient être présentes dans le markdown source
    let html = text
        .replace(/&#34;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

    // Convertit le gras : **texte** → <strong>texte</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convertit l'italique : *texte* → <em>texte</em>
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Échappe uniquement les caractères HTML dangereux qui ne font pas partie des balises créées
    html = html.replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
               .replace(/<(?!\/?(?:strong|em)>)/g, '&lt;')
               .replace(/(?<!<\/?(?:strong|em))>/g, '&gt;');

    return html;
}

/**
 * Affiche le bandeau avec le texte adapté à la langue active.
 * @param {{enabled: boolean, texts: Record<string,string>}} payload
 */
function renderBanner(payload) {
    if (!containerElement) return;

    const message = resolveMessage(payload.texts);
    if (!message) {
        hideBanner();
        return;
    }

    let banner = containerElement.querySelector('.emergency-banner');
    let messageNode = containerElement.querySelector('.emergency-banner__message');

    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'emergency-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');

        const icon = document.createElement('span');
        icon.className = 'emergency-banner__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '!';

        messageNode = document.createElement('p');
        messageNode.className = 'emergency-banner__message';

        banner.appendChild(icon);
        banner.appendChild(messageNode);
        containerElement.replaceChildren(banner);
    } else if (!messageNode) {
        messageNode = document.createElement('p');
        messageNode.className = 'emergency-banner__message';
        banner.appendChild(messageNode);
    }

    messageNode.innerHTML = convertMarkdownToHtml(message);
    banner.classList.add('is-visible');
}

/**
 * Retourne la chaîne localisée à afficher pour le bandeau.
 * @param {Record<string,string>} texts
 */
function resolveMessage(texts) {
    if (!texts || typeof texts !== 'object') {
        return '';
    }

    const lang = (currentLang || 'fr').toLowerCase();
    return texts[lang] || texts.fr || Object.values(texts)[0] || '';
}

/**
 * Supprime le bandeau du DOM et annule l'état visible.
 */
function hideBanner() {
    if (!containerElement) return;
    containerElement.replaceChildren();
}

// Nettoyage si nécessaire (future-proofing)
window.addEventListener('beforeunload', () => {
    if (pollTimerId) {
        clearInterval(pollTimerId);
    }
});
