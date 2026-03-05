/**
 * @file Tracker de performance du pipeline H5P.
 *
 * Enregistre chaque étape du flux (génération IA → healing → processeur → packaging → rendu)
 * avec chronométrage précis. Affiche un rapport complet dans la console en mode ?debug.
 *
 * Chaque « session » correspond à un cycle complet de génération d'une activité.
 * Les sessions sont identifiées par un ID unique et conservées pour comparaison.
 *
 * Usage automatique : instrumenté dans ui.js, llm.js, h5p-creator.js, h5p-prefetch.js,
 * h5p-manager.js et notifications.js. Aucune action manuelle requise.
 *
 * @module core/perf-tracker
 */

import { DEBUG } from './utils.js';

/**
 * @typedef {Object} PerfEntry
 * @property {string} phase - Phase du pipeline (ex: 'llm', 'healer', 'processor', 'packaging', 'render')
 * @property {string} label - Description de l'opération
 * @property {number} startTime - performance.now() au début
 * @property {number} endTime - performance.now() à la fin (0 si en cours)
 * @property {number} duration - Durée en ms
 * @property {Object} [meta] - Métadonnées supplémentaires (taille fichier, nombre d'assets, etc.)
 */

/**
 * @typedef {Object} PerfSession
 * @property {string} id - Identifiant unique de la session
 * @property {string} moduleKey - Clé du module H5P (ex: 'Flashcards')
 * @property {number} startTime - performance.now() au début du cycle
 * @property {PerfEntry[]} entries - Entrées chronologiques
 * @property {Map<string, number>} openMarkers - Marqueurs ouverts (label → startTime)
 */

/** @type {PerfSession|null} */
let currentSession = null;

/** @type {PerfSession[]} */
const allSessions = [];

/** Compteur pour IDs uniques */
let sessionCounter = 0;

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Démarre une nouvelle session de profiling.
 * @param {string} moduleKey - Clé du module H5P
 * @param {string} [trigger='llm'] - Déclencheur ('llm' ou 'manual')
 * @returns {string} ID de la session
 */
export function startSession(moduleKey, trigger = 'llm') {
    const id = `perf-${++sessionCounter}-${moduleKey}-${Date.now()}`;
    currentSession = {
        id,
        moduleKey,
        trigger,
        startTime: performance.now(),
        entries: [],
        openMarkers: new Map()
    };
    allSessions.push(currentSession);

    // Garder seulement les 10 dernières sessions
    if (allSessions.length > 10) allSessions.shift();

    log(`━━━ SESSION DÉMARRÉE : ${moduleKey} (${trigger}) ━━━`);
    return id;
}

/**
 * Marque le début d'une opération (pour chronométrer des opérations async).
 * @param {string} phase - Phase du pipeline
 * @param {string} label - Description
 * @param {Object} [meta] - Métadonnées
 */
export function markStart(phase, label, meta) {
    if (!currentSession) return;

    const key = `${phase}:${label}`;
    currentSession.openMarkers.set(key, performance.now());

    const elapsed = (performance.now() - currentSession.startTime).toFixed(0);
    log(`  [+${elapsed}ms] ▶ ${phase} — ${label}`, meta);
}

/**
 * Marque la fin d'une opération.
 * @param {string} phase - Phase du pipeline (doit correspondre au markStart)
 * @param {string} label - Description (doit correspondre au markStart)
 * @param {Object} [meta] - Métadonnées supplémentaires
 */
export function markEnd(phase, label, meta) {
    if (!currentSession) return;

    const key = `${phase}:${label}`;
    const startTime = currentSession.openMarkers.get(key);
    const endTime = performance.now();

    if (startTime === undefined) {
        // Pas de markStart correspondant — enregistrer quand même
        currentSession.entries.push({
            phase, label, startTime: endTime, endTime, duration: 0, meta
        });
        return;
    }

    currentSession.openMarkers.delete(key);
    const duration = endTime - startTime;

    currentSession.entries.push({
        phase, label, startTime, endTime, duration, meta
    });

    const elapsed = (endTime - currentSession.startTime).toFixed(0);
    const durationStr = duration.toFixed(1);

    // Colorer selon la durée
    const icon = duration > 2000 ? '🐌' : duration > 500 ? '⚠️' : '✓';
    log(`  [+${elapsed}ms] ${icon} ${phase} — ${label} : ${durationStr}ms`, meta);
}

/**
 * Enregistre une opération instantanée (sans start/end).
 * @param {string} phase - Phase du pipeline
 * @param {string} label - Description
 * @param {number} duration - Durée en ms
 * @param {Object} [meta] - Métadonnées
 */
export function record(phase, label, duration, meta) {
    if (!currentSession) return;

    const endTime = performance.now();
    currentSession.entries.push({
        phase, label, startTime: endTime - duration, endTime, duration, meta
    });

    const elapsed = (endTime - currentSession.startTime).toFixed(0);
    const icon = duration > 2000 ? '🐌' : duration > 500 ? '⚠️' : '✓';
    log(`  [+${elapsed}ms] ${icon} ${phase} — ${label} : ${duration.toFixed(1)}ms`, meta);
}

/**
 * Enregistre un événement ponctuel (sans durée).
 * @param {string} phase - Phase
 * @param {string} message - Message
 * @param {Object} [meta] - Métadonnées
 */
export function event(phase, message, meta) {
    if (!currentSession) return;

    const elapsed = (performance.now() - currentSession.startTime).toFixed(0);
    log(`  [+${elapsed}ms] ● ${phase} — ${message}`, meta);
}

/**
 * Termine la session et affiche le rapport complet.
 */
export function endSession() {
    if (!currentSession) return;

    const totalDuration = performance.now() - currentSession.startTime;
    currentSession.totalDuration = totalDuration;

    log(`━━━ SESSION TERMINÉE : ${currentSession.moduleKey} — TOTAL ${totalDuration.toFixed(0)}ms ━━━`);
    printReport();

    // Ne pas nullifier currentSession pour permettre des ajouts tardifs (rendu async)
}

/**
 * Affiche le rapport complet de la session courante.
 */
export function printReport() {
    if (!currentSession) return;

    const session = currentSession;
    const totalDuration = session.totalDuration || (performance.now() - session.startTime);

    // Grouper par phase
    const byPhase = {};
    for (const entry of session.entries) {
        if (!byPhase[entry.phase]) byPhase[entry.phase] = [];
        byPhase[entry.phase].push(entry);
    }

    // Tableau récapitulatif
    const rows = [];
    for (const [phase, entries] of Object.entries(byPhase)) {
        const phaseTotal = entries.reduce((sum, e) => sum + e.duration, 0);
        const pct = totalDuration > 0 ? ((phaseTotal / totalDuration) * 100).toFixed(1) : '0';
        rows.push({
            Phase: phase,
            'Opérations': entries.length,
            'Durée totale': `${phaseTotal.toFixed(0)}ms`,
            '%': `${pct}%`,
            'Plus lente': entries.length > 0
                ? `${entries.sort((a, b) => b.duration - a.duration)[0].label} (${entries[0].duration.toFixed(0)}ms)`
                : '-'
        });
    }

    console.log(`%c📊 PERF — ${session.moduleKey} (${session.trigger}) — ${totalDuration.toFixed(0)}ms`, 'font-weight:bold; font-size:13px; color:#e67e22;');
    console.table(rows);

    // Alertes sur les goulots d'étranglement (> 1s uniquement)
    const slow = session.entries.filter(e => e.duration > 1000).sort((a, b) => b.duration - a.duration);
    if (slow.length > 0) {
        console.log('%c🐌 LENT (> 1s) :', 'font-weight:bold; color:red;');
        for (const entry of slow) {
            console.log(`   ${entry.phase} — ${entry.label} : ${entry.duration.toFixed(0)}ms`);
        }
    }
}

/**
 * Retourne la session courante (pour les tests ou l'inspection).
 * @returns {PerfSession|null}
 */
export function getCurrentSession() {
    return currentSession;
}

/**
 * Retourne toutes les sessions enregistrées.
 * @returns {PerfSession[]}
 */
export function getAllSessions() {
    return allSessions;
}

// ============================================================================
// UTILITAIRES INTERNES
// ============================================================================

function log(message, meta) {
    if (!DEBUG) return;
    if (meta) {
        console.log(`%c[PERF] ${message}`, 'color:#e67e22;', meta);
    } else {
        console.log(`%c[PERF] ${message}`, 'color:#e67e22;');
    }
}
