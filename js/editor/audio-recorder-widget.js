/**
 * Dictaphone intégré — enregistrement micro + rognage début/fin sur forme d'onde
 * (Caramel — partagé éditeur, cf. CLAUDE.md item 7 : fichier HOST-AGNOSTIQUE, aucune
 * dépendance réseau ni hôte ; utilisé par le panneau Dictée, réutilisable ailleurs).
 *
 * Flux : [● Enregistrer] → MediaRecorder (micro) → [■ Stop] → décodage Web Audio →
 * forme d'onde (canvas) + 2 poignées de rognage (curseurs début/fin) → pré-écoute de la
 * zone conservée → [Utiliser] → ré-encodage **WAV PCM 16 bits mono** (universel : lu par
 * tous les navigateurs, contrairement au webm/opus produit par MediaRecorder).
 *
 * Import de fichier : mp3 / m4a / wav passent TELS QUELS (déjà universels, pas de
 * ré-encodage destructeur) ; les autres formats (ogg, webm, flac, aac…) sont décodés puis
 * convertis en WAV via le même flux forme d'onde + rognage. Si le navigateur ne sait pas
 * décoder le fichier, message d'erreur explicite (conseil : mp3/wav).
 *
 * @module editor/audio-recorder-widget
 */
import { t } from '../core/translation.js';

/** MIME audio universellement lus par <audio> (H5P.Audio filtre par canPlayType). */
const UNIVERSAL_MIMES = new Set(['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/wave']);

function escapeText(s) {
    // Échappe AUSSI `"` et `'` : ces valeurs finissent en attribut (title=…, value=…)
    // dans les gabarits de ce panneau, où `& < >` seuls ne suffisent pas.
    // Table alignée sur `js/core/escape.js` ; recopiée ici volontairement car ce
    // fichier est byte-identique côté Sucrerie (pas de dépendance inter-dépôts).
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function fmtSec(s) {
    s = Math.max(0, Number(s) || 0);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')},${String(Math.floor((s % 1) * 10))}`;
}

/** Mixdown MONO (moyenne des canaux) d'un AudioBuffer sur une fenêtre [startSec, endSec]. */
function windowedMono(buffer, startSec = 0, endSec = buffer.duration) {
    const rate = buffer.sampleRate;
    const s0 = Math.max(0, Math.floor(startSec * rate));
    const s1 = Math.min(buffer.length, Math.ceil(endSec * rate));
    const n = Math.max(0, s1 - s0);
    const channels = buffer.numberOfChannels;
    const mono = new Float32Array(n);
    for (let c = 0; c < channels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < n; i++) mono[i] += data[s0 + i] / channels;
    }
    return mono;
}

/** Encode des échantillons mono float en WAV PCM 16 bits (en-tête RIFF à la main). */
function pcm16WavBlob(mono, rate) {
    const n = mono.length;
    const bytes = 44 + n * 2;
    const ab = new ArrayBuffer(bytes);
    const v = new DataView(ab);
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF'); v.setUint32(4, bytes - 8, true); writeStr(8, 'WAVE');
    writeStr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); // PCM
    v.setUint16(22, 1, true); // mono
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    writeStr(36, 'data'); v.setUint32(40, n * 2, true);
    let off = 44;
    for (let i = 0; i < n; i++) {
        const s = Math.max(-1, Math.min(1, mono[i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
    }
    return new Blob([ab], { type: 'audio/wav' });
}

/**
 * Time-stretch WSOLA (dépendance zéro) : rallonge la parole SANS changer la hauteur
 * (un simple ré-échantillonnage donnerait une voix « caverneuse »). Fenêtres de ~50 ms
 * recouvertes à 50 %, hop d'analyse réduit, alignement local par corrélation croisée
 * avec la continuation naturelle du frame précédent (±12 ms). Qualité adaptée à la
 * lecture lente d'une dictée.
 * @param {Float32Array} input - Échantillons mono.
 * @param {number} rate - Fréquence d'échantillonnage.
 * @param {number} stretch - Facteur d'allongement (> 1 : plus lent). Ex. 1.43 ≈ ×0,7.
 * @returns {Float32Array}
 */
export function timeStretchMono(input, rate, stretch) {
    if (!(stretch > 1.01) || input.length === 0) return input.slice();
    const frame = Math.min(4096, Math.max(1024, 1 << Math.round(Math.log2(rate * 0.05))));
    const hs = frame >> 1;                                   // hop de synthèse
    const ha = Math.max(1, Math.round(hs / stretch));        // hop d'analyse
    const tol = Math.min(hs - 1, Math.round(rate * 0.012));  // fenêtre de recherche ±12 ms
    const win = new Float32Array(frame);
    for (let i = 0; i < frame; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame - 1));

    const targetLen = Math.round(input.length * stretch);
    const outLen = targetLen + frame;
    const out = new Float32Array(outLen);
    const norm = new Float32Array(outLen);

    let prev = 0;
    let first = true;
    for (let k = 0; ; k++) {
        const outPos = k * hs;
        const ideal = k * ha;
        if (outPos + frame > outLen || ideal + frame + tol >= input.length) break;
        let start = ideal;
        if (!first) {
            const natural = prev + hs; // continuité « naturelle » du frame précédent
            if (natural + 256 < input.length) {
                let bestScore = -Infinity;
                for (let d = -tol; d <= tol; d += 16) {
                    const cand = ideal + d;
                    if (cand < 0 || cand + 256 >= input.length) continue;
                    let s = 0;
                    for (let i = 0; i < 256; i += 2) s += input[cand + i] * input[natural + i];
                    if (s > bestScore) { bestScore = s; start = cand; }
                }
            }
        }
        for (let i = 0; i < frame; i++) {
            out[outPos + i] += input[start + i] * win[i];
            norm[outPos + i] += win[i];
        }
        prev = start;
        first = false;
    }
    for (let i = 0; i < outLen; i++) if (norm[i] > 1e-4) out[i] /= norm[i];
    return out.slice(0, targetLen);
}

/**
 * Encode un AudioBuffer (rogné) en WAV PCM 16 bits MONO (mixdown des canaux).
 * Dépendance zéro : en-tête RIFF écrit à la main.
 * @param {AudioBuffer} buffer
 * @param {number} startSec - Début de la zone conservée.
 * @param {number} endSec - Fin de la zone conservée.
 * @returns {Blob} audio/wav
 */
export function audioBufferToWavBlob(buffer, startSec = 0, endSec = buffer.duration) {
    return pcm16WavBlob(windowedMono(buffer, startSec, endSec), buffer.sampleRate);
}

/**
 * Variante RALENTIE d'un AudioBuffer en WAV PCM 16 bits mono (time-stretch WSOLA,
 * hauteur préservée). Utilisée pour générer la piste « lecture lente » d'une voix
 * enregistrée (« Ma voix » de la dictée).
 * @param {AudioBuffer} buffer
 * @param {number} [stretch=1.43] - Facteur d'allongement (1.43 ≈ vitesse ×0,7).
 * @param {number} [startSec=0]
 * @param {number} [endSec=buffer.duration]
 * @returns {Blob} audio/wav
 */
export function audioBufferToSlowWavBlob(buffer, stretch = 1.43, startSec = 0, endSec = buffer.duration) {
    const mono = windowedMono(buffer, startSec, endSec);
    return pcm16WavBlob(timeStretchMono(mono, buffer.sampleRate, stretch), buffer.sampleRate);
}

/**
 * Monte le dictaphone dans une zone de l'éditeur.
 * @param {HTMLElement} zone - Conteneur (vidé au montage).
 * @param {Object} opts
 * @param {Function} opts.onConfirm - (file: File) → void. WAV rogné (ou fichier importé universel).
 * @param {Function} [opts.onCancel] - Fermeture sans résultat.
 * @returns {{destroy: Function}}
 */
export function mountAudioRecorder(zone, { onConfirm, onCancel } = {}) {
    let mediaStream = null;
    let recorder = null;
    let chunks = [];
    let audioCtx = null;
    let decoded = null;        // AudioBuffer décodé (enregistrement OU import à convertir)
    let trim = { start: 0, end: 0 };
    let previewSource = null;  // BufferSource de pré-écoute en cours
    let recTimer = null;
    let destroyed = false;

    zone.innerHTML = `
        <div class="dt-rec">
            <div class="dt-rec-controls">
                <button type="button" class="dt-rec-start">
                    <i class="fas fa-microphone" aria-hidden="true"></i>
                    ${escapeText(t('editor_dictation_rec_start') || 'Enregistrer ma voix')}
                </button>
                <button type="button" class="dt-rec-stop" hidden>
                    <i class="fas fa-stop" aria-hidden="true"></i>
                    ${escapeText(t('editor_dictation_rec_stop') || 'Arrêter')}
                    <span class="dt-rec-timer">0:00</span>
                </button>
                <label class="dt-rec-import">
                    <i class="fas fa-file-audio" aria-hidden="true"></i>
                    ${escapeText(t('editor_dictation_rec_import') || 'Importer un fichier audio')}
                    <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac" hidden />
                </label>
                <button type="button" class="dt-rec-close" title="${escapeText(t('editor_cancel') || 'Annuler')}">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
            <p class="dt-rec-status" role="status" aria-live="polite"></p>
            <div class="dt-rec-editor" hidden>
                <canvas class="dt-rec-wave" width="640" height="90" aria-hidden="true"></canvas>
                <div class="dt-rec-trims">
                    <label class="dt-rec-trim">
                        <span>${escapeText(t('editor_dictation_rec_trim_start') || 'Début')}</span>
                        <input type="range" class="dt-rec-trim-start" min="0" max="1000" value="0" step="1" />
                        <span class="dt-rec-trim-start-val">0:00,0</span>
                    </label>
                    <label class="dt-rec-trim">
                        <span>${escapeText(t('editor_dictation_rec_trim_end') || 'Fin')}</span>
                        <input type="range" class="dt-rec-trim-end" min="0" max="1000" value="1000" step="1" />
                        <span class="dt-rec-trim-end-val">0:00,0</span>
                    </label>
                </div>
                <div class="dt-rec-actions">
                    <button type="button" class="dt-rec-play">
                        <i class="fas fa-play" aria-hidden="true"></i>
                        ${escapeText(t('editor_dictation_rec_play') || 'Pré-écouter')}
                    </button>
                    <button type="button" class="dt-rec-use">
                        <i class="fas fa-check" aria-hidden="true"></i>
                        ${escapeText(t('editor_dictation_rec_use') || 'Utiliser cet audio')}
                    </button>
                    <button type="button" class="dt-rec-redo">
                        <i class="fas fa-redo" aria-hidden="true"></i>
                        ${escapeText(t('editor_dictation_rec_redo') || 'Recommencer')}
                    </button>
                </div>
            </div>
        </div>
    `;

    const el = (sel) => zone.querySelector(sel);
    const startBtn = el('.dt-rec-start');
    const stopBtn = el('.dt-rec-stop');
    const timerSpan = el('.dt-rec-timer');
    const statusEl = el('.dt-rec-status');
    const editorEl = el('.dt-rec-editor');
    const canvas = el('.dt-rec-wave');
    const trimStart = el('.dt-rec-trim-start');
    const trimEnd = el('.dt-rec-trim-end');

    const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg || ''; };

    function stopPreview() {
        if (previewSource) { try { previewSource.stop(); } catch { /* déjà arrêté */ } previewSource = null; }
    }

    function releaseMic() {
        if (mediaStream) { mediaStream.getTracks().forEach(tr => tr.stop()); mediaStream = null; }
    }

    /** Dessine la forme d'onde + grise les zones rognées. */
    function drawWave() {
        if (!decoded || !canvas) return;
        const ctx2d = canvas.getContext('2d');
        const { width: W, height: H } = canvas;
        ctx2d.clearRect(0, 0, W, H);
        const data = decoded.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / W));
        ctx2d.fillStyle = '#c46f31';
        for (let x = 0; x < W; x++) {
            let min = 1, max = -1;
            const base = x * step;
            for (let i = 0; i < step && base + i < data.length; i += Math.max(1, Math.floor(step / 20))) {
                const s = data[base + i];
                if (s < min) min = s;
                if (s > max) max = s;
            }
            const y0 = ((1 - max) / 2) * H;
            const y1 = ((1 - min) / 2) * H;
            ctx2d.fillRect(x, y0, 1, Math.max(1, y1 - y0));
        }
        // Zones rognées grisées + poignées.
        const xStart = (trim.start / decoded.duration) * W;
        const xEnd = (trim.end / decoded.duration) * W;
        ctx2d.fillStyle = 'rgba(120,120,120,0.55)';
        ctx2d.fillRect(0, 0, xStart, H);
        ctx2d.fillRect(xEnd, 0, W - xEnd, H);
        ctx2d.fillStyle = '#2e7d32';
        ctx2d.fillRect(Math.max(0, xStart - 1), 0, 2, H);
        ctx2d.fillStyle = '#c62828';
        ctx2d.fillRect(Math.min(W - 2, xEnd - 1), 0, 2, H);
    }

    function syncTrimLabels() {
        el('.dt-rec-trim-start-val').textContent = fmtSec(trim.start);
        el('.dt-rec-trim-end-val').textContent = fmtSec(trim.end);
    }

    /** Passe en mode « édition » (forme d'onde + rognage) sur un AudioBuffer décodé. */
    function enterTrimMode(buffer) {
        decoded = buffer;
        trim = { start: 0, end: buffer.duration };
        trimStart.value = '0';
        trimEnd.value = '1000';
        editorEl.hidden = false;
        startBtn.hidden = true;
        stopBtn.hidden = true;
        setStatus((t('editor_dictation_rec_trim_hint') || 'Ajustez le début et la fin pour retirer les silences, pré-écoutez, puis validez.'));
        syncTrimLabels();
        drawWave();
    }

    async function decodeBlob(blob) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = await blob.arrayBuffer();
        return audioCtx.decodeAudioData(buf);
    }

    // ── Enregistrement micro ────────────────────────────────────────────────
    startBtn.addEventListener('click', async () => {
        stopPreview();
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            setStatus(t('editor_dictation_rec_mic_error') || 'Micro inaccessible : autorisez le microphone dans le navigateur.');
            return;
        }
        chunks = [];
        try {
            recorder = new MediaRecorder(mediaStream);
        } catch (e) {
            releaseMic();
            setStatus(t('editor_dictation_rec_unsupported') || 'Enregistrement non supporté par ce navigateur.');
            return;
        }
        recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
        recorder.onstop = async () => {
            releaseMic();
            clearInterval(recTimer);
            if (destroyed) return;
            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
            try {
                const buffer = await decodeBlob(blob);
                enterTrimMode(buffer);
            } catch (e) {
                setStatus(t('editor_dictation_rec_decode_error') || 'Impossible de décoder cet audio. Réessayez, ou importez un fichier MP3/WAV.');
                startBtn.hidden = false;
                stopBtn.hidden = true;
            }
        };
        recorder.start();
        startBtn.hidden = true;
        stopBtn.hidden = false;
        editorEl.hidden = true;
        setStatus(t('editor_dictation_rec_recording') || 'Enregistrement en cours… parlez, puis arrêtez.');
        const t0 = Date.now();
        recTimer = setInterval(() => {
            timerSpan.textContent = fmtSec((Date.now() - t0) / 1000).replace(/,\d$/, '');
        }, 500);
    });

    stopBtn.addEventListener('click', () => {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
        stopBtn.hidden = true;
    });

    // ── Import de fichier ───────────────────────────────────────────────────
    el('.dt-rec-import input').addEventListener('change', async (ev) => {
        const file = ev.target.files && ev.target.files[0];
        ev.target.value = '';
        if (!file) return;
        stopPreview();
        const mime = (file.type || '').toLowerCase();
        if (UNIVERSAL_MIMES.has(mime)) {
            // Format déjà universel (mp3/m4a/wav) : utilisé tel quel, sans ré-encodage.
            onConfirm && onConfirm(file);
            return;
        }
        // Format non universel (ogg/webm/flac/aac…) : conversion WAV via décodage + rognage.
        setStatus(t('editor_dictation_rec_converting') || 'Conversion du fichier…');
        try {
            const buffer = await decodeBlob(file);
            enterTrimMode(buffer);
            setStatus((t('editor_dictation_rec_converted') || 'Fichier converti en WAV (lisible partout).') + ' ' +
                (t('editor_dictation_rec_trim_hint') || 'Ajustez le début et la fin puis validez.'));
        } catch (e) {
            setStatus(t('editor_dictation_rec_decode_error') || 'Impossible de décoder cet audio. Réessayez, ou importez un fichier MP3/WAV.');
        }
    });

    // ── Rognage ─────────────────────────────────────────────────────────────
    function onTrimInput() {
        if (!decoded) return;
        let a = (Number(trimStart.value) / 1000) * decoded.duration;
        let b = (Number(trimEnd.value) / 1000) * decoded.duration;
        if (b - a < 0.1) { // fenêtre minimale de 100 ms
            if (this === trimStart) a = Math.max(0, b - 0.1);
            else b = Math.min(decoded.duration, a + 0.1);
            trimStart.value = String(Math.round((a / decoded.duration) * 1000));
            trimEnd.value = String(Math.round((b / decoded.duration) * 1000));
        }
        trim = { start: a, end: b };
        stopPreview();
        syncTrimLabels();
        drawWave();
    }
    trimStart.addEventListener('input', onTrimInput);
    trimEnd.addEventListener('input', onTrimInput);

    // ── Pré-écoute de la zone conservée ─────────────────────────────────────
    el('.dt-rec-play').addEventListener('click', () => {
        if (!decoded || !audioCtx) return;
        stopPreview();
        const src = audioCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(audioCtx.destination);
        src.start(0, trim.start, Math.max(0.05, trim.end - trim.start));
        previewSource = src;
        src.onended = () => { if (previewSource === src) previewSource = null; };
    });

    // ── Validation / recommencer / fermer ───────────────────────────────────
    el('.dt-rec-use').addEventListener('click', () => {
        if (!decoded) return;
        stopPreview();
        const wav = audioBufferToWavBlob(decoded, trim.start, trim.end);
        const file = new File([wav], `voix-${Date.now().toString(36)}.wav`, { type: 'audio/wav' });
        onConfirm && onConfirm(file);
    });
    el('.dt-rec-redo').addEventListener('click', () => {
        stopPreview();
        decoded = null;
        editorEl.hidden = true;
        startBtn.hidden = false;
        setStatus('');
    });
    el('.dt-rec-close').addEventListener('click', () => {
        destroyImpl();
        onCancel && onCancel();
    });

    function destroyImpl() {
        destroyed = true;
        stopPreview();
        clearInterval(recTimer);
        if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch { /* déjà arrêté */ } }
        releaseMic();
        if (audioCtx) { try { audioCtx.close(); } catch { /* déjà fermé */ } audioCtx = null; }
        zone.innerHTML = '';
    }

    return { destroy: destroyImpl };
}
