/**
 * Caramelia — Utilitaires (escape, markdown léger, scroll)
 * @module caramelia/utils
 */

import { state } from './state.js';

// `esc` était une 7e copie de la même fonction. Sémantique identique au canonique
// (`String(s ?? '')` ≡ `escapeHtml` : null/undefined → chaîne vide).
//
// IMPORTER puis exporter, et NON `export { … } from` : une ré-exportation ne crée
// AUCUNE liaison locale dans le module, si bien que le `esc(text)` de `md()` ci-dessous
// levait `ReferenceError` — toute réponse du chatbot restait alors vide.
import { escapeHtml as esc } from '../core/escape.js';
export { esc };

export function md(text) {
    if (!text) return '';
    let h = esc(text);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italique : on évite le lookbehind (Safari < 16.4) en utilisant un parseur séquentiel
    h = h.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    // Italique avec underscores : les bornes excluent lettre/chiffre/_ pour ne pas casser snake_case ni les URLs
    h = h.replace(/(^|[^_A-Za-z0-9])_([^_\n]+?)_(?![_A-Za-z0-9])/g, '$1<em>$2</em>');
    h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    const lines = h.split('\n');
    const blocks = [];
    let currentList = null;

    for (const line of lines) {
        const t = line.trim();
        if (!t) {
            if (currentList) { blocks.push(currentList.join('') + '</ul>'); currentList = null; }
            continue;
        }
        if (/^[-•]\s+/.test(t)) {
            if (!currentList) currentList = ['<ul>'];
            currentList.push('<li>' + t.replace(/^[-•]\s+/, '') + '</li>');
        } else {
            if (currentList) { blocks.push(currentList.join('') + '</ul>'); currentList = null; }
            blocks.push('<p>' + t + '</p>');
        }
    }
    if (currentList) blocks.push(currentList.join('') + '</ul>');
    return blocks.join('');
}

export function scrollBottom() {
    const m = state.elements.messages;
    if (!m) return;
    requestAnimationFrame(() => { m.scrollTop = m.scrollHeight; });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * fetch avec retry exponentiel et timeout par tentative.
 *
 * Couvre les hiccups n8n classiques (503 transitoire, latence pic, coupure brève)
 * sans masquer les vraies erreurs : on retry uniquement sur réseau/timeout/5xx,
 * jamais sur 4xx (le serveur a répondu volontairement).
 *
 * Échec final → throw avec `err.kind` ∈ {timeout, network, server}, exploité
 * par les appelants pour afficher un message contextuel à l'utilisateur.
 *
 * @param {string} url
 * @param {RequestInit} opts
 * @param {{retries?: number, backoffMs?: number, timeoutMs?: number}} cfg
 */
export async function fetchWithRetry(url, opts = {}, { retries = 1, backoffMs = 800, timeoutMs = 15000 } = {}) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (opts.signal?.aborted) throw new DOMException('Requête annulée', 'AbortError');
        const ctrl = new AbortController();
        const abort = () => ctrl.abort();
        opts.signal?.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...opts, signal: ctrl.signal });
            clearTimeout(timer);
            // 4xx : erreur côté client / volontaire serveur → on rend telle quelle, pas de retry
            if (res.status < 500) return res;
            // 5xx : transitoire potentiel → retry tant qu'on a du budget
            if (attempt < retries) {
                lastError = Object.assign(new Error(`HTTP ${res.status}`), { kind: 'server', status: res.status });
                await sleep(backoffMs * Math.pow(2, attempt));
                continue;
            }
            return res; // dernier essai : on laisse l'appelant décider
        } catch (err) {
            clearTimeout(timer);
            // Une annulation utilisateur n'est ni une panne réseau ni un motif de retry.
            if (opts.signal?.aborted) throw err;
            // AbortError = notre timeout. TypeError (et autres) = réseau côté client.
            err.kind = err.name === 'AbortError' ? 'timeout' : 'network';
            lastError = err;
            if (attempt < retries) {
                await sleep(backoffMs * Math.pow(2, attempt));
                continue;
            }
            throw err;
        } finally {
            clearTimeout(timer);
            opts.signal?.removeEventListener('abort', abort);
        }
    }
    if (lastError) throw lastError;
}
