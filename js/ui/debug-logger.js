/**
 * @file Panneau de logs debug pour Caramel.
 * Capture les appels console (log, warn, error, info) et les erreurs
 * non capturées (onerror, unhandledrejection). Affiche le tout dans
 * une modale accessible via un bouton discret dans le footer.
 * N'est actif qu'en mode debug (?debug dans l'URL).
 *
 * IMPORTANT : la capture console démarre dès l'import du module
 * (top-level) pour ne rater aucun message. La construction du DOM
 * attend DOMContentLoaded via initDebugLogger().
 *
 * Sécurité : l'interception console est protégée par try/catch
 * pour ne jamais casser le comportement natif de la console.
 */

import { DEBUG } from '../core/utils.js';

// ============================================================================
// ÉTAT INTERNE
// ============================================================================

/** @type {Array<{level: string, timestamp: number, args: string}>} */
const logBuffer = [];

/** Limite de logs stockés pour éviter les fuites mémoire */
const MAX_LOGS = 2000;

/** Références vers les méthodes console originales */
const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console)
};

/** @type {string|null} Filtre de niveau actif (null = tous) */
let activeFilter = null;

/** @type {HTMLElement|null} */
let logListEl = null;

/** @type {HTMLElement|null} */
let badgeEl = null;

/** Compteur d'erreurs/warnings pour le badge */
let issueCount = 0;

// ============================================================================
// CAPTURE CONSOLE
// ============================================================================

/**
 * Sérialise les arguments console en chaîne lisible.
 * Gère les objets, erreurs, et valeurs primitives.
 */
function serializeArgs(args) {
    return args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');
}

/**
 * Pousse une entrée dans le buffer et met à jour l'UI si visible.
 */
function pushEntry(entry) {
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) {
        logBuffer.splice(0, logBuffer.length - MAX_LOGS);
    }

    if (entry.level === 'error' || entry.level === 'warn') {
        issueCount++;
        updateBadge();
    }

    // Mise à jour en temps réel si la modale est ouverte
    if (logListEl && logListEl.offsetParent !== null) {
        appendLogEntry(entry);
        autoScroll();
    }
}

/**
 * Intercepte une méthode console pour capturer les logs.
 * L'appel original est TOUJOURS préservé.
 */
function interceptConsole(level) {
    const original = originalConsole[level];
    console[level] = function (...args) {
        // Toujours appeler l'original en premier
        original(...args);

        try {
            pushEntry({
                level,
                timestamp: Date.now(),
                args: serializeArgs(args)
            });
        } catch {
            // Ne jamais casser la console
        }
    };
}

/**
 * Démarre la capture de tous les niveaux console + erreurs globales.
 */
function startCapture() {
    // Interception des méthodes console
    interceptConsole('log');
    interceptConsole('warn');
    interceptConsole('error');
    interceptConsole('info');

    // Capture des erreurs non capturées (Uncaught TypeError, etc.)
    window.addEventListener('error', (event) => {
        try {
            const location = event.filename
                ? `${event.filename}:${event.lineno}:${event.colno}`
                : 'unknown';
            pushEntry({
                level: 'error',
                timestamp: Date.now(),
                args: `[Uncaught] ${event.message}\n    at ${location}`
            });
        } catch {
            // Ne jamais casser le site
        }
    });

    // Capture des rejets de promesse non gérés
    window.addEventListener('unhandledrejection', (event) => {
        try {
            const reason = event.reason instanceof Error
                ? `${event.reason.message}\n${event.reason.stack || ''}`
                : String(event.reason || 'Unknown rejection');
            pushEntry({
                level: 'error',
                timestamp: Date.now(),
                args: `[Unhandled Promise] ${reason}`
            });
        } catch {
            // Ne jamais casser le site
        }
    });
}

// ============================================================================
// INTERFACE UTILISATEUR
// ============================================================================

/**
 * Formate un timestamp en HH:MM:SS.mmm
 */
function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour12: false }) + '.' +
        String(d.getMilliseconds()).padStart(3, '0');
}

/**
 * Crée un élément DOM pour une entrée de log.
 */
function createLogEntryEl(entry) {
    const el = document.createElement('div');
    el.className = `debug-log-entry debug-log-${entry.level}`;
    el.dataset.level = entry.level;

    const time = document.createElement('span');
    time.className = 'debug-log-time';
    time.textContent = formatTime(entry.timestamp);

    const level = document.createElement('span');
    level.className = 'debug-log-level';
    level.textContent = entry.level.toUpperCase();

    const msg = document.createElement('span');
    msg.className = 'debug-log-msg';
    msg.textContent = entry.args;

    el.append(time, level, msg);
    return el;
}

/**
 * Ajoute une entrée au panneau de logs (si visible et filtre OK).
 */
function appendLogEntry(entry) {
    if (!logListEl) return;
    if (activeFilter && entry.level !== activeFilter) return;
    logListEl.appendChild(createLogEntryEl(entry));
}

/**
 * Auto-scroll vers le bas du panneau de logs.
 */
function autoScroll() {
    if (!logListEl) return;
    logListEl.scrollTop = logListEl.scrollHeight;
}

/**
 * Met à jour le badge du bouton footer.
 */
function updateBadge() {
    if (!badgeEl) return;
    if (issueCount > 0) {
        badgeEl.textContent = issueCount > 99 ? '99+' : String(issueCount);
        badgeEl.style.display = '';
    } else {
        badgeEl.style.display = 'none';
    }
}

/**
 * Rafraîchit la liste complète des logs (après changement de filtre).
 */
function refreshLogList() {
    if (!logListEl) return;
    logListEl.innerHTML = '';
    for (const entry of logBuffer) {
        if (!activeFilter || entry.level === activeFilter) {
            logListEl.appendChild(createLogEntryEl(entry));
        }
    }
    autoScroll();
}

/**
 * Copie tous les logs visibles dans le presse-papier.
 */
async function copyLogs() {
    const entries = activeFilter
        ? logBuffer.filter(e => e.level === activeFilter)
        : logBuffer;

    const text = entries.map(e =>
        `[${formatTime(e.timestamp)}][${e.level.toUpperCase()}] ${e.args}`
    ).join('\n');

    try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(true);
    } catch {
        // Fallback pour les navigateurs sans Clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopyFeedback(true);
    }
}

/**
 * Feedback visuel après copie.
 */
function showCopyFeedback(success) {
    const btn = document.getElementById('debug-log-copy');
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = success
        ? '<i class="fas fa-check"></i> Copié !'
        : '<i class="fas fa-times"></i> Erreur';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }, 1500);
}

/**
 * Efface tous les logs capturés.
 */
function clearLogs() {
    logBuffer.length = 0;
    issueCount = 0;
    updateBadge();
    refreshLogList();
}

// ============================================================================
// CONSTRUCTION DU DOM
// ============================================================================

/**
 * Crée le bouton dans le footer.
 */
function createFooterButton() {
    const footer = document.querySelector('footer.footer');
    if (!footer) return;

    const btn = document.createElement('a');
    btn.href = '#';
    btn.id = 'debug-log-btn';
    btn.className = 'debug-log-footer-btn';
    btn.innerHTML = '<i class="fas fa-terminal"></i> Logs';

    badgeEl = document.createElement('span');
    badgeEl.className = 'debug-log-badge';
    badgeEl.style.display = 'none';
    btn.appendChild(badgeEl);

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    // Insérer avant le dernier lien (mentions légales)
    const lastLink = footer.querySelector('#legal-mentions-link');
    if (lastLink) {
        footer.insertBefore(btn, lastLink);
    } else {
        footer.appendChild(btn);
    }
}

/**
 * Crée la modale de logs.
 */
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'debug-log-modal';
    modal.className = 'debug-log-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Console de debug');

    modal.innerHTML = `
        <div class="debug-log-modal-content">
            <div class="debug-log-header">
                <div class="debug-log-title">
                    <i class="fas fa-terminal"></i> Console de debug
                    <span class="debug-log-count" id="debug-log-count"></span>
                </div>
                <div class="debug-log-actions">
                    <div class="debug-log-filters">
                        <button class="debug-log-filter active" data-filter="">Tous</button>
                        <button class="debug-log-filter" data-filter="error">Erreurs</button>
                        <button class="debug-log-filter" data-filter="warn">Warnings</button>
                        <button class="debug-log-filter" data-filter="log">Logs</button>
                        <button class="debug-log-filter" data-filter="info">Info</button>
                    </div>
                    <button class="debug-log-action-btn" id="debug-log-copy" title="Copier les logs">
                        <i class="fas fa-copy"></i> Copier
                    </button>
                    <button class="debug-log-action-btn" id="debug-log-clear" title="Effacer les logs">
                        <i class="fas fa-trash-alt"></i> Effacer
                    </button>
                    <button class="debug-log-close" id="debug-log-close" title="Fermer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="debug-log-list" id="debug-log-list"></div>
        </div>
    `;

    document.body.appendChild(modal);

    // Références
    logListEl = document.getElementById('debug-log-list');

    // Événements
    document.getElementById('debug-log-close').addEventListener('click', closeModal);
    document.getElementById('debug-log-copy').addEventListener('click', copyLogs);
    document.getElementById('debug-log-clear').addEventListener('click', clearLogs);

    // Filtres
    modal.querySelectorAll('.debug-log-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.debug-log-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter || null;
            refreshLogList();
            updateCount();
        });
    });

    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Fermer avec Escape
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

/**
 * Met à jour le compteur de logs affiché.
 */
function updateCount() {
    const countEl = document.getElementById('debug-log-count');
    if (!countEl) return;
    const count = activeFilter
        ? logBuffer.filter(e => e.level === activeFilter).length
        : logBuffer.length;
    countEl.textContent = `(${count})`;
}

/**
 * Ouvre la modale de logs.
 */
function openModal() {
    const modal = document.getElementById('debug-log-modal');
    if (!modal) return;
    refreshLogList();
    updateCount();
    modal.classList.add('open');
    // Focus trap
    document.getElementById('debug-log-close').focus();
}

/**
 * Ferme la modale de logs.
 */
function closeModal() {
    const modal = document.getElementById('debug-log-modal');
    if (!modal) return;
    modal.classList.remove('open');
}

// ============================================================================
// CAPTURE IMMÉDIATE (top-level, dès l'import du module)
// ============================================================================

// Démarre la capture dès que le module est importé, AVANT DOMContentLoaded,
// pour ne rater aucun console.log/warn/error émis pendant l'initialisation.
// Ne fait rien si le mode debug n'est pas activé.
if (DEBUG) {
    startCapture();
}

// ============================================================================
// INITIALISATION DU DOM (appelée sur DOMContentLoaded depuis main.js)
// ============================================================================

/**
 * Initialise l'interface du panneau de debug (bouton footer + modale).
 * La capture console est déjà active depuis l'import du module.
 * Ne fait RIEN si le mode debug n'est pas activé.
 */
export function initDebugLogger() {
    if (!DEBUG) return;

    // Charger le CSS dynamiquement (pas de <link> dans le HTML en mode normal)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/components/debug-logger.css';
    document.head.appendChild(link);

    createFooterButton();
    createModal();

    // Mettre à jour le badge avec les erreurs/warnings déjà capturées avant DOMContentLoaded
    updateBadge();

    console.log('[DEBUG][debug-logger] Panneau de logs activé — bouton dans le footer');
}
