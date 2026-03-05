/**
 * @file Gestion centralisée du bandeau d'alerte.
 * Ce module récupère périodiquement un fichier YAML distant afin de
 * déterminer si un message d'urgence doit être affiché sur l'interface.
 */

import { currentLang } from '../core/translation.js';

/* =========================================================================
   Paramètres principaux — ajustables rapidement par l'équipe produit.
   ========================================================================= */
const ENABLE_EMERGENCY_NOTIFICATIONS = true;     // Basculer sur false pour désactiver toute la mécanique.
const POLLING_INTERVAL_MS = 60000;               // Fréquence de rafraîchissement (ex: 60 s).
const REMOTE_NOTICE_URL = 'https://codimd.apps.education.fr/s/R4BvqeSBw/download';
const REQUEST_TIMEOUT_MS = 8000;               // Evite les requêtes pendantes.

/* Couleurs nommées utilisables dans le CodiMD (clé → code hex) */
const NAMED_COLORS = {
    'rouge-critique':   '#ee5a52',
    'orange-degrade':   '#e67e22',
    'bleu-info':        '#3498db',
};

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
 * Récupère le YAML distant et met à jour le DOM en conséquence.
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
 * Télécharge et convertit le fichier YAML brut en objet exploitable.
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
        const parsed = parseYamlPayload(rawText);
        return parsed;
    } finally {
        window.clearTimeout(timeout);
    }
}

/**
 * Parse le fichier YAML structuré avec templates nommés.
 * Format attendu :
 *   notification: oui | non | <version>   (ex: "5.1.0" → actif si site < 5.1.0)
 *   template_actif: <id>
 *   templates:
 *     <id>:
 *       couleur: <hex>       (optionnel, couleur du bandeau)
 *       textes:
 *         <lang>: <message>
 * @param {string} yaml
 * @returns {{enabled: boolean, texts: Record<string,string>, color: string|null}|null}
 */
function parseYamlPayload(yaml) {
    if (typeof yaml !== 'string' || !yaml.trim()) {
        return null;
    }

    let notification = 'non';
    let templateActif = '';
    const templates = {};

    let currentTemplateId = null;
    let inTextes = false;

    for (const rawLine of yaml.split(/\r?\n/)) {
        // Ignore les commentaires et lignes vides
        if (/^\s*#/.test(rawLine) || !rawLine.trim()) {
            continue;
        }

        const indent = rawLine.search(/\S/);
        const line = rawLine.trim();

        // Niveau 0 — clés racine
        if (indent === 0) {
            inTextes = false;
            currentTemplateId = null;
            const [key, ...rest] = line.split(':');
            const value = rest.join(':').trim();
            if (key === 'notification') notification = value;
            else if (key === 'template_actif') templateActif = value;
            // « templates: » n'a pas de valeur, on continue
            continue;
        }

        // Niveau 2 — identifiant de template (ex: « ilaas_hs: »)
        if (indent === 2 && line.endsWith(':') && !line.includes(': ')) {
            currentTemplateId = line.slice(0, -1).trim();
            templates[currentTemplateId] = { textes: {}, couleur: null };
            inTextes = false;
            continue;
        }

        // Niveau 4 — propriétés du template (label, couleur, textes)
        if (indent === 4 && currentTemplateId) {
            if (line === 'textes:') {
                inTextes = true;
            } else {
                inTextes = false;
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    const key = line.slice(0, colonIdx).trim();
                    const value = line.slice(colonIdx + 1).trim();
                    if (key === 'couleur' && value) {
                        templates[currentTemplateId].couleur = NAMED_COLORS[value] || value;
                    }
                }
            }
            continue;
        }

        // Niveau 6 — langues dans textes (ex: « fr: Mon message »)
        if (indent === 6 && inTextes && currentTemplateId) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const lang = line.slice(0, colonIdx).trim();
                const text = line.slice(colonIdx + 1).trim();
                templates[currentTemplateId].textes[lang] = text;
            }
            continue;
        }
    }

    const enabled = resolveEnabled(notification);
    const activeTemplate = templates[templateActif];
    const texts = activeTemplate ? activeTemplate.textes : {};
    const color = activeTemplate?.couleur || null;

    return { enabled, texts, color };
}

/**
 * Détermine si la notification est active.
 * - "oui" → toujours actif
 * - "non" → toujours inactif
 * - "5.1.0" (version) → actif uniquement si la version du site est strictement inférieure
 * @param {string} value
 * @returns {boolean}
 */
function resolveEnabled(value) {
    const lower = value.toLowerCase().trim();
    if (lower === 'oui') return true;
    if (lower === 'non') return false;

    // Si c'est un numéro de version, comparer avec la version du site
    if (/^\d+(\.\d+)*$/.test(lower)) {
        const appVersion = getAppVersion();
        if (!appVersion) return true; // Impossible de lire la version → afficher par prudence
        return compareVersions(appVersion, lower) < 0;
    }

    return false;
}

/**
 * Récupère le numéro de version depuis le footer (ex: "5.0.0").
 * @returns {string|null}
 */
function getAppVersion() {
    const footerLink = document.querySelector('footer.footer a[href*="CHANGELOG"]');
    const text = footerLink?.textContent?.trim();
    if (!text) return null;
    const match = text.match(/v?(\d+(?:\.\d+)*)/i);
    return match ? match[1] : null;
}

/**
 * Compare deux chaînes de version sémantique.
 * @returns {number} négatif si a < b, 0 si a === b, positif si a > b
 */
function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
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
 * @param {{enabled: boolean, texts: Record<string,string>, color: string|null}} payload
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

    // Applique la couleur personnalisée du template (ou retire la surcharge)
    if (payload.color) {
        banner.style.setProperty('--banner-color', payload.color);
    } else {
        banner.style.removeProperty('--banner-color');
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
