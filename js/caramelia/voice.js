/**
 * Caramelia — Saisie vocale (microphone)
 *
 * Enregistre l'audio via MediaRecorder, dessine une forme d'onde animée façon
 * ChatGPT à l'intérieur de la barre de saisie (le timer s'affiche juste à
 * droite du trombone, les ondes occupent la place visuelle de l'input — sans
 * faire bouger les autres boutons), puis envoie le blob à un webhook n8n de
 * transcription (Whisper via Albert) et insère le texte obtenu dans un input
 * cible.
 *
 * Conçu pour être réutilisable :
 *   attachMic({ button, recording, targetInput, webhookUrl, onError? })
 * — l'élément `recording` est une zone qui contient `.caramelia-recording__time`
 * et `.caramelia-recording__waves` (canvas). On peut donc brancher le module
 * sur d'autres champs (ex: #qui / #quoi de Caramel) en construisant la même
 * structure DOM.
 *
 * Stratégie :
 *   - getUserMedia({audio}) → stream
 *   - MediaRecorder enregistre en webm/opus (fallback mp4 sur Safari)
 *   - AudioContext + AnalyserNode pour calculer le RMS (alimente les barres)
 *   - Buffer roulant de N RMS dessinés en canvas (les nouveaux entrent à droite,
 *     les anciens sortent à gauche)
 *   - Au-delà de softLimitMs, les barres virent vers le rouge pour inciter à
 *     s'arrêter — sans bloquer.
 *
 * @module caramelia/voice
 */

import { CONFIG } from './config.js';
import { t, getLang } from './i18n.js';
import { addBotMessage } from './dom.js';

/** Couleurs par défaut (ctx.fillStyle ne lit pas les CSS variables — on hardcode).
 *  Surchargeables via les options `waveColor` / `waveWarnColor` de attachMic(),
 *  utiles pour intégrer le micro dans d'autres contextes UI (ex: prompt-generator
 *  Caramel qui utilise une palette gris-bleu). */
const COLOR_NORMAL = '#D4A03C'; // var(--caramelia-primary)
const COLOR_WARN = '#E74C3C';

/** Largeur d'une barre + gap, en CSS pixels. */
const BAR_WIDTH = 3;
const BAR_GAP = 2;

/** Singleton de session d'enregistrement (un seul micro actif à la fois). */
let session = null;

/**
 * Attache le comportement micro à un bouton et une zone d'enregistrement.
 * Renvoie une fonction de toggle (start si idle, stop si en cours).
 *
 * @param {object} opts
 * @param {HTMLButtonElement} opts.button       Bouton qui démarre/arrête
 * @param {HTMLElement}       opts.recording    Conteneur (.caramelia-recording avec __time et __waves)
 * @param {HTMLInputElement|HTMLTextAreaElement} opts.targetInput Input qui reçoit le texte
 * @param {string}            opts.webhookUrl   URL POST multipart pour transcription
 * @param {(messageKey:string)=>void} [opts.onError] Callback erreur (defaut: addBotMessage)
 * @param {string}            [opts.waveColor]     Couleur CSS des barres en état normal (defaut: doré Caramelia)
 * @param {string}            [opts.waveWarnColor] Couleur CSS des barres en état warn / approche limite (defaut: rouge)
 * @returns {()=>void} toggle()
 */
export function attachMic(opts) {
    const toggle = () => {
        if (session) stopMic();
        else startMic(opts);
    };
    opts.button.addEventListener('click', toggle);

    // Pattern « façon ChatGPT » optionnel : pendant l'enregistrement, l'UI hôte
    // affiche deux boutons distincts à la place du micro — ✕ (annuler) et ✓
    // (valider et transcrire). On les câble ici si fournis. Caramelia continue
    // d'utiliser uniquement le bouton principal en mode toggle (rien ne change).
    if (opts.confirmButton) {
        opts.confirmButton.addEventListener('click', () => { if (session) stopMic(); });
    }
    if (opts.cancelButton) {
        opts.cancelButton.addEventListener('click', () => {
            if (session) { session.cancelled = true; stopMic(); }
        });
    }
    return toggle;
}

/**
 * Annule l'enregistrement en cours sans transcription ni insertion. Utile pour
 * des contextes où l'utilisateur dispose d'un bouton dédié (cf. attachMic
 * `cancelButton`) ou pour permettre une annulation programmatique (ex: échap).
 * Sans enregistrement actif, c'est un no-op.
 */
export function cancelMic() {
    if (!session) return;
    session.cancelled = true;
    stopMic();
}

/**
 * Indique si l'API micro est utilisable dans le navigateur courant.
 * (getUserMedia + MediaRecorder + un type audio supporté)
 */
export function isMicSupported() {
    return !!(
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function' &&
        typeof window.MediaRecorder !== 'undefined' &&
        pickMimeType() !== null
    );
}

/** Choisit le premier mimeType audio supporté par MediaRecorder. */
function pickMimeType() {
    const list = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
    ];
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null;
    for (const m of list) if (MediaRecorder.isTypeSupported(m)) return m;
    return null;
}

/** Démarre l'enregistrement et la boucle d'animation des ondes. */
async function startMic({ button, recording, targetInput, webhookUrl, onError, waveColor, waveWarnColor }) {
    if (session) return;

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        const key = err && err.name === 'NotAllowedError' ? 'mic_error_permission' : 'mic_error_unavailable';
        (onError || defaultOnError)(key);
        console.warn('[Caramelia] mic getUserMedia failed', err);
        return;
    }

    const mimeType = pickMimeType();
    let mediaRecorder;
    try {
        mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    } catch (err) {
        stream.getTracks().forEach(t => t.stop());
        (onError || defaultOnError)('mic_error_unavailable');
        console.warn('[Caramelia] MediaRecorder init failed', err);
        return;
    }

    const chunks = [];
    mediaRecorder.addEventListener('dataavailable', (e) => { if (e.data && e.data.size) chunks.push(e.data); });

    // Analyser pour la forme d'onde (RMS sur le domaine temporel)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.fftSize);

    const timeEl = recording.querySelector('.caramelia-recording__time');
    const canvas = recording.querySelector('.caramelia-recording__waves');
    const ctx = canvas.getContext('2d');

    // Bascule en mode enregistrement : on cache l'input et on révèle l'overlay.
    // Le slot a une taille fixe → les autres boutons ne bougent pas.
    const slot = recording.parentElement;
    slot.classList.add('caramelia-input-slot--recording');
    recording.hidden = false;
    recording.classList.remove('caramelia-recording--warn');
    timeEl.textContent = '00:00';

    button.classList.add('caramelia-mic-btn--recording');
    button.setAttribute('aria-label', t('ui_aria_mic_stop'));
    button.setAttribute('title', t('ui_aria_mic_stop'));
    button.setAttribute('aria-pressed', 'true');

    // Buffer roulant de RMS. La taille dépend de la largeur du canvas.
    const samples = [];

    const startTs = performance.now();
    session = {
        stream, mediaRecorder, audioCtx, analyser, dataArray, chunks, mimeType,
        button, recording, slot, timeEl, canvas, ctx, samples,
        targetInput, webhookUrl, onError,
        waveColor: waveColor || COLOR_NORMAL,
        waveWarnColor: waveWarnColor || COLOR_WARN,
        startTs, rafId: null, hardLimitId: null, stopped: false, warn: false, cancelled: false,
    };

    // Sync de la taille du canvas à sa boîte CSS (HiDPI). À refaire si la taille
    // change (resize window) — un ResizeObserver gère ça.
    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // Premier sizing au prochain frame (le DOM vient d'être rendu visible)
    requestAnimationFrame(resizeCanvas);
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);
    session.resizeObserver = ro;

    const loop = () => {
        if (!session) return;

        // 1) Nouveau sample RMS
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        // 0..1 normalisé (parole ~0.05–0.2 → on amplifie pour rendre la barre vivante)
        const lvl = Math.min(1, rms * 4);

        // 2) Capacité = nb de barres qui tiennent dans le canvas
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        const capacity = Math.max(1, Math.floor(cssW / (BAR_WIDTH + BAR_GAP)));
        samples.push(lvl);
        while (samples.length > capacity) samples.shift();

        // 3) Compteur mm:ss
        const elapsed = performance.now() - startTs;
        const m = Math.floor(elapsed / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        session.timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (!session.warn && elapsed > CONFIG.voice.softLimitMs) {
            session.warn = true;
            recording.classList.add('caramelia-recording--warn');
        }

        // 4) Dessin : barres alignées à droite (la plus récente à droite,
        //    les plus anciennes scrollent vers la gauche).
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.fillStyle = session.warn ? session.waveWarnColor : session.waveColor;
        const minBar = 2;
        for (let i = 0; i < samples.length; i++) {
            const v = samples[i];
            const barH = Math.max(minBar, v * cssH);
            const y = (cssH - barH) / 2;
            // Position : la dernière barre touche le bord droit
            const x = cssW - (samples.length - i) * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
            roundRect(ctx, x, y, BAR_WIDTH, barH, BAR_WIDTH / 2);
        }

        session.rafId = requestAnimationFrame(loop);
    };

    // Garde-fou : coupure forcée après hardLimitMs
    session.hardLimitId = setTimeout(() => stopMic(), CONFIG.voice.hardLimitMs);

    try {
        mediaRecorder.start();
    } catch (err) {
        cleanupSession();
        (onError || defaultOnError)('mic_error_unavailable');
        console.warn('[Caramelia] MediaRecorder.start failed', err);
        return;
    }
    loop();
}

/** Petit helper : dessine un rectangle aux coins arrondis (cohérent avec le style ChatGPT). */
function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

/** Arrête l'enregistrement, envoie au webhook et insère la transcription. */
async function stopMic() {
    if (!session || session.stopped) return;
    session.stopped = true;
    const s = session;

    if (s.rafId) cancelAnimationFrame(s.rafId);
    if (s.hardLimitId) clearTimeout(s.hardLimitId);
    if (s.resizeObserver) s.resizeObserver.disconnect();

    s.button.classList.remove('caramelia-mic-btn--recording');
    s.button.classList.add('caramelia-mic-btn--loading');
    s.button.setAttribute('aria-label', t('ui_aria_mic_start'));
    s.button.setAttribute('title', t('ui_aria_mic_start'));
    s.button.setAttribute('aria-pressed', 'false');

    // Attendre le dernier chunk
    await new Promise((resolve) => {
        if (s.mediaRecorder.state === 'inactive') return resolve();
        s.mediaRecorder.addEventListener('stop', resolve, { once: true });
        try { s.mediaRecorder.stop(); } catch { resolve(); }
    });

    s.stream.getTracks().forEach(t => t.stop());
    try { await s.audioCtx.close(); } catch { /* ignore */ }

    // Reset visuel : on remet l'input
    s.recording.hidden = true;
    s.recording.classList.remove('caramelia-recording--warn');
    s.slot.classList.remove('caramelia-input-slot--recording');
    s.ctx.clearRect(0, 0, s.canvas.clientWidth, s.canvas.clientHeight);

    const elapsed = performance.now() - s.startTs;
    session = null;

    // Annulation explicite (bouton ✕ ou cancelMic()) : on a déjà fait le cleanup
    // visuel et libéré le stream ; on bypass juste la transcription et l'erreur
    // « trop court » — l'utilisateur sait qu'il a annulé, pas besoin de bruit.
    if (s.cancelled) {
        s.button.classList.remove('caramelia-mic-btn--loading');
        return;
    }

    if (elapsed < CONFIG.voice.minDurationMs || s.chunks.length === 0) {
        s.button.classList.remove('caramelia-mic-btn--loading');
        (s.onError || defaultOnError)('mic_too_short');
        return;
    }

    const blob = new Blob(s.chunks, { type: s.mimeType || 'audio/webm' });
    const ext = blob.type.includes('mp4') ? 'mp4'
        : blob.type.includes('ogg') ? 'ogg'
        : 'webm';
    const fd = new FormData();
    fd.append('file', blob, `voice.${ext}`);
    fd.append('language', getLang() || 'fr');

    try {
        const res = await fetch(s.webhookUrl, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        const text = String((data && (data.text || data.transcript)) || '').trim();
        if (!text) {
            (s.onError || defaultOnError)('mic_empty');
        } else {
            insertIntoInput(s.targetInput, text);
        }
    } catch (err) {
        console.warn('[Caramelia] mic transcription failed', err);
        (s.onError || defaultOnError)('mic_error_network');
    } finally {
        s.button.classList.remove('caramelia-mic-btn--loading');
    }
}

/**
 * Insère le texte transcrit à la position du curseur dans l'input,
 * ou l'append en fin si pas de sélection. Dispatche `input` pour réveiller
 * les listeners (Caramel reconstruit ses prompts cachés sur cet event).
 */
function insertIntoInput(input, text) {
    if (!input) return;
    const cur = input.value || '';
    const sStart = typeof input.selectionStart === 'number' ? input.selectionStart : cur.length;
    const sEnd = typeof input.selectionEnd === 'number' ? input.selectionEnd : cur.length;
    const before = cur.slice(0, sStart);
    const after = cur.slice(sEnd);
    const sep = before && !/\s$/.test(before) ? ' ' : '';
    const tail = after && !/^\s/.test(after) ? ' ' : '';
    const inserted = sep + text + tail;
    input.value = before + inserted + after;
    const newPos = before.length + inserted.length;
    try { input.setSelectionRange(newPos, newPos); } catch { /* certains type ne supportent pas */ }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}

/** Nettoyage d'urgence (utilisé si start() jette après allocation des ressources). */
function cleanupSession() {
    if (!session) return;
    const s = session;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    if (s.hardLimitId) clearTimeout(s.hardLimitId);
    if (s.resizeObserver) s.resizeObserver.disconnect();
    try { s.stream.getTracks().forEach(t => t.stop()); } catch { /* */ }
    try { s.audioCtx.close(); } catch { /* */ }
    s.button.classList.remove('caramelia-mic-btn--recording', 'caramelia-mic-btn--loading');
    s.recording.hidden = true;
    s.slot.classList.remove('caramelia-input-slot--recording');
    session = null;
}

function defaultOnError(messageKey) {
    addBotMessage(t(messageKey));
}
