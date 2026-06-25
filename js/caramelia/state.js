/**
 * Caramelia — État partagé
 * @module caramelia/state
 */

import { CONFIG } from './config.js';
import { sanitizeUserInput } from './security.js';

export const state = {
    isOpen: false,
    isExpanded: false,
    history: [],
    currentFlow: null,   // 'help' | 'generate' | null
    genState: {},        // {qui, quoi, niveau, step}
    elements: {},        // {fab, panel, messages, input, sendBtn, closeBtn, expandBtn}
    _prefillAsked: false, // "repartir des champs Caramel ou de zéro ?" déjà posée ?
    _proactiveShown: false, // suggestion proactive post-génération déjà affichée ?
};

export function resetGenState() {
    state.history = [];
    state.currentFlow = null;
    state.genState = {};
    // Question "repartir des champs Caramel ou de zéro ?" : posée une seule fois
    // par conversation (cf. flow.js#handleCreationIntent).
    state._prefillAsked = false;
    // Suggestion proactive post-génération : une seule fois par conversation.
    state._proactiveShown = false;
    if (state.elements.messages) state.elements.messages.innerHTML = '';
}

/**
 * Renvoie l'historique formaté pour un payload LLM, borné à `maxTurnsForLLM` derniers
 * tours et tronqué à `maxCharsPerTurn` par message. Évite que des conversations longues
 * ne saturent les tokens — l'UI affiche toujours l'historique complet, seul le réseau
 * voit la fenêtre glissante.
 */
export function getHistoryForLLM() {
    const { maxTurnsForLLM, maxCharsPerTurn } = CONFIG.history;
    return state.history
        .slice(-maxTurnsForLLM)
        .map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: sanitizeUserInput(String(m.text).slice(0, maxCharsPerTurn)),
        }));
}
