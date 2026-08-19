/**
 * @file Section « Lien de la vidéo » de la barre latérale — détection de la source,
 * récupération de la transcription, éditeur de transcription synchronisé, et
 * verrouillage de la génération tant qu'aucune vidéo exploitable n'est fournie.
 * Utilisée par les activités déclarant `requiresVideoUrl` (Vidéo interactive).
 *
 * Extraite de `ui.js`, où elle occupait 474 lignes au milieu de 4000 autres.
 *
 * ── Contrat d'injection ──────────────────────────────────────────────────────
 * Les huit dépendances vers `ui.js` arrivent par le paramètre `ctx` plutôt que par
 * `import`. Ce n'est pas de la cérémonie : `ui.js` importe ce module, donc un import
 * en sens inverse créerait un CYCLE. `sidebar` en particulier est un `const`
 * initialisé au chargement du module (`document.getElementById(...)`) — dans un
 * cycle, sa valeur serait `undefined` ici selon l'ordre d'évaluation. L'injection
 * rend la dépendance explicite et l'ordre d'évaluation sans effet.
 *
 * `videoStates` et `promptVideoUrl` sont des `Map` PARTAGÉES avec `ui.js` (lues
 * aussi par `isVideoReady`, `attachLLMLogic`, `snapVideoTimestamps`) : on injecte
 * la référence, jamais une copie.
 *
 * Couverture : `node tests/run_sidebar_media_sections.mjs`
 */

import { translations } from '../core/translation.js';
import { cleanJsonInput, debugLog, showNotification } from '../core/utils.js';
import { setVideoTranscriptSources, buildVideoInteractivePrompt } from '../services/prompt-generator.js';
import { buildSyncedTranscriptEditor } from './transcript-sync-editor.js';
import { escVid, openVideoPopover, transcriptToSegments } from './media-helpers.js';

// Dernier lien vidéo détecté avec succès par module — référence du contexte sur lequel le prompt
// (et donc le JSON éventuellement généré) a été construit. Contrairement à `videoStates`, cette
// map N'EST PAS purgée quand on efface le champ URL (lockGate), afin de pouvoir comparer l'ancien
// lien au nouveau même après un effacement intermédiaire. Persistant le temps de la session UI.
const promptVideoUrl = new Map();

/**
 * Injecte la transcription dans le PROMPT de gauche (« Obtenir le prompt à copier ») :
 * la transcription horodatée devient les SOURCES du prompt « Vidéo interactive », ce qui
 * permet à l'IA de placer les questions juste avant la phrase qui lance une idée neuve.
 * Écrit le textarea visible ET le textarea caché (réutilisés par « copier le prompt » et
 * par generatePrompts si le contexte change ensuite).
 * @param {Object} module
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @param {number|null} duration
 */
function injectVideoTranscriptIntoPrompt(module, segments, duration) {
    // Mémorise la transcription côté générateur : si l'utilisateur modifie qui/quoi ensuite,
    // generatePrompts() la réinjectera automatiquement (pas de perte).
    setVideoTranscriptSources(segments, duration);
    const promptId = module.promptId;
    if (!promptId) return;
    const promptText = buildVideoInteractivePrompt(segments, duration);
    const visible = document.getElementById(promptId);
    if (visible) visible.value = promptText;
    let hidden = document.getElementById(`hidden-${promptId}`);
    if (!hidden) {
        hidden = document.createElement('textarea');
        hidden.id = `hidden-${promptId}`;
        hidden.classList.add('hidden');
        document.body.appendChild(hidden);
    }
    hidden.value = promptText;
}

/**
 * Initialise la section « URL vidéo » (activités requiresVideoUrl uniquement).
 * Logique : coller le lien lance AUTOMATIQUEMENT la détection + la récupération de la
 * transcription (sous-titres si dispo, sinon transcription audio Albert), avec un indicateur
 * qui tourne. Dès que la transcription est prête, elle est injectée dans le prompt de gauche
 * et le groupe de boutons de génération passe au bleu (déverrouillé). Tant qu'elle ne l'est
 * pas, tout le groupe reste grisé.
 * @param {string} moduleKey
 * @param {Object} module
 */
export function initVideoUrlSection(moduleKey, module, ctx) {
    const { sidebar, videoStates, clearGeneratedJson, isVideoReady, revealVideoManual, videoLinkChanged } = ctx;

    if (!module || !module.requiresVideoUrl) return;
    const section = sidebar.querySelector(`#video-url-section-${moduleKey}`);
    const input = sidebar.querySelector(`#video-url-input-${moduleKey}`);
    const statusEl = sidebar.querySelector(`#video-status-${moduleKey}`);
    const msgEl = sidebar.querySelector(`#video-msg-${moduleKey}`);
    const helpBtn = sidebar.querySelector(`#video-help-btn-${moduleKey}`);
    const seeBtn = sidebar.querySelector(`#video-see-btn-${moduleKey}`);
    const goBtn = sidebar.querySelector(`#video-go-btn-${moduleKey}`);
    if (!section || !input) return;

    // Jauge + voile « Transcription en cours » intégrés au champ du lien (cf. setProgress).
    const progressFill = section.querySelector('.video-url-field__progress');
    const overlayEl = section.querySelector('.video-url-field__overlay');
    const overlayLabel = section.querySelector('.video-url-field__overlay-label');
    const stopBtn = section.querySelector(`#video-stop-btn-${moduleKey}`);

    // Estimation d'attente affichée à côté de « Transcription en cours… » (cf. setProgress).
    // Renseignée une fois la vidéo détectée (durée connue) ; vidée à la fin/à l'arrêt.
    let etaLabel = '';
    // Met en forme une estimation (secondes) en libellé court : « ≈ 25 s » ou « ≈ 3 min ».
    const fmtEta = (sec) => {
        if (sec == null || !(sec > 0)) return '';
        if (sec < 60) {
            const n = Math.max(5, Math.round(sec / 5) * 5); // arrondi à 5 s (pas de fausse précision)
            return (translations.video_eta_seconds || '≈ {n} s').replace('{n}', n);
        }
        return (translations.video_eta_minutes || '≈ {n} min').replace('{n}', Math.round(sec / 60));
    };

    const createBtn = sidebar.querySelector(`#${module.createBtnId}`);
    const llmBtn = sidebar.querySelector(`#generate-llm-${moduleKey}`);
    const modelBtn = sidebar.querySelector(`#model-selector-btn-${moduleKey}`);

    // Groupes de boutons de génération. Le groupe LLM (génération IA) est strictement lié à la
    // vidéo détectée ; le bouton de création (depuis un JSON collé) a un verrou plus souple.
    const llmGroup = sidebar.querySelector('.top-controls-container .generation-button-group');
    const createGroup = createBtn ? createBtn.closest('.generation-button-group') : null;
    const jsonInputEl = sidebar.querySelector(`#${module.jsonInputId}`);

    // Le JSON collé contient-il déjà une source vidéo exploitable ?
    const pastedJsonHasVideo = () => {
        if (!jsonInputEl) return false;
        const v = cleanJsonInput(jsonInputEl.value || '');
        if (!v) return false;
        try {
            const p = JSON.parse(v);
            if (!p || typeof p !== 'object') return false;
            const vs = p.videoSource;
            return !!(vs && (typeof vs === 'string' ? vs.trim() : (vs.url && String(vs.url).trim())));
        } catch { return false; }
    };

    // Verrou du bouton de création : actif si une vidéo est détectée OU si le JSON collé embarque
    // déjà sa videoSource (collage manuel d'un JSON tout prêt, sans avoir saisi d'URL).
    const refreshCreateGate = () => {
        if (!createBtn) return;
        const ok = isVideoReady(moduleKey) || pastedJsonHasVideo();
        createBtn.disabled = !ok;
        createBtn.classList.toggle('is-disabled-gate', !ok);
        if (createGroup) createGroup.classList.toggle('gen-gated', !ok);
    };

    // Icône d'état affichée DANS le champ (à droite) selon l'état courant.
    const STATUS_ICON = {
        checking: '<span class="video-spinner" aria-hidden="true"></span>',
        ready: '<i class="fas fa-circle-check" aria-hidden="true"></i>',
        error: '<i class="fas fa-circle-exclamation" aria-hidden="true"></i>',
        manual: '<i class="fas fa-circle-exclamation" aria-hidden="true"></i>',
        empty: ''
    };
    // L'état vit dans le champ : la couleur du bord/fond (CSS via data-state) + l'icône.
    const setState = (state) => {
        section.dataset.state = state;
        if (statusEl) statusEl.innerHTML = STATUS_ICON[state] || '';
        refreshGo();
    };
    // Sous-ligne discrète : visible seulement quand il y a quelque chose à dire (attente, erreur,
    // collage). Sur le chemin heureux (champ vert), elle reste masquée → le cadre ne grandit pas.
    const setMsg = (text, actionLabel, onAction) => {
        if (!msgEl) return;
        msgEl.innerHTML = '';
        if (!text) { msgEl.hidden = true; return; }
        msgEl.hidden = false;
        msgEl.appendChild(document.createTextNode(text));
        if (actionLabel && onAction) {
            msgEl.appendChild(document.createTextNode(' · '));
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'video-url-msg__action';
            b.textContent = actionLabel;
            b.addEventListener('click', onAction);
            msgEl.appendChild(b);
        }
    };
    const showSee = (show) => { if (seeBtn) seeBtn.hidden = !show; };
    // Bouton « valider le lien » (flèche) DANS le champ : affordance visible du collage-auto/Entrée.
    // N'apparaît qu'en état neutre AVEC un lien saisi (idle) — masqué pendant la transcription
    // (le voile + bouton stop prennent sa place), une fois prêt (« Voir »), ou en erreur/manuel
    // (la sous-ligne porte déjà « Réessayer » / « Coller la transcription »).
    const refreshGo = () => {
        if (!goBtn) return;
        const hasText = !!(input.value || '').trim();
        goBtn.hidden = !(hasText && section.dataset.state === 'empty');
    };
    // Jauge de progression DANS le champ du lien : la barre se remplit dans la div et un voile
    // flou (backdrop-filter) recouvre l'URL avec « Transcription en cours… n/t ». Déterminée
    // quand on connaît le nombre de lots (PodEduc : « 3/10 »), indéterminée sinon (bande qui glisse).
    const setProgress = (current, total, label) => {
        if (!overlayEl) return;
        overlayEl.hidden = false;
        const determinate = total > 1;
        if (progressFill) {
            progressFill.classList.toggle('video-url-field__progress--indet', !determinate);
            progressFill.style.width = determinate ? Math.round((current / total) * 100) + '%' : '';
        }
        if (overlayLabel) {
            const txt = determinate
                ? (translations.video_progress_chunk || 'Transcription en cours… {n}/{t}').replace('{n}', current).replace('{t}', total)
                : (label || translations.video_detecting || 'Transcription en cours…');
            const full = etaLabel ? `${txt} · ${etaLabel}` : txt;
            overlayLabel.innerHTML = `<span class="video-spinner" aria-hidden="true"></span><span>${escVid(full)}</span>`;
        }
    };
    // Retire le voile + remet la jauge à zéro (transcription terminée, arrêtée ou en erreur).
    const hideTranscribing = () => {
        etaLabel = '';
        if (overlayEl) overlayEl.hidden = true;
        if (progressFill) {
            progressFill.style.width = '';
            progressFill.classList.remove('video-url-field__progress--indet');
        }
    };
    // Verrou de génération IA (LLM) : strictement lié à la détection d'une vidéo lisible.
    // Le bouton de création (createBtn) est géré à part par refreshCreateGate (verrou plus souple :
    // il accepte aussi un JSON collé contenant déjà une videoSource).
    const setGenEnabled = (enabled) => {
        if (llmGroup) llmGroup.classList.toggle('gen-gated', !enabled);
        [llmBtn, modelBtn].forEach(btn => {
            if (!btn) return;
            btn.disabled = !enabled;
            btn.classList.toggle('is-disabled-gate', !enabled);
        });
        refreshCreateGate();
    };

    // Le collage/l'édition d'un JSON peut déverrouiller le bouton de création (videoSource incluse).
    if (jsonInputEl) jsonInputEl.addEventListener('input', refreshCreateGate);

    // Applique une transcription récupérée : prompt de gauche + champ vert + déverrouillage.
    const applyTranscript = (transcript, detect) => {
        const segs = transcriptToSegments(transcript, detect);
        injectVideoTranscriptIntoPrompt(module, segs, detect && detect.duration);
        hideTranscribing();
        setState('ready');
        setMsg(null);
        showSee(true);
        setGenEnabled(true);
    };

    // Verrouille tout (URL vide ou modifiée) et purge la transcription du prompt.
    const lockGate = () => {
        videoStates.delete(moduleKey);
        setGenEnabled(false);
        hideTranscribing();
        setState('empty');
        setMsg(null);
        showSee(false);
        setVideoTranscriptSources(null);
    };

    // --- Popover « ? » : quelles vidéos utiliser ---
    const openHelpPopover = () => {
        const body = document.createElement('div');
        body.className = 'video-help-body';
        const chip = (txt, cls) => `<span class="vplat-chip ${cls}">${escVid(txt)}</span>`;
        body.innerHTML =
            `<p class="video-help-body__intro">${escVid(translations.video_help_intro || 'Collez le lien d’une vidéo : Caramel détecte la vidéo, récupère la transcription, puis l’IA place les questions aux bons moments. Le champ passe au vert quand tout est prêt.')}</p>` +
            `<ul class="video-help-body__platforms">` +
            `<li><span class="vplat-name">${escVid(translations.video_help_peertube || 'Tubes PeerTube (Apps Education, Réseau Canopé…)')}</span>${chip(translations.video_help_status_ok || 'Pris en charge', 'vplat-chip--ok')}</li>` +
            `<li><span class="vplat-name">${escVid(translations.video_help_podeduc || 'PodEduc (des Apps Education)')}</span>${chip(translations.video_help_status_ok || 'Pris en charge', 'vplat-chip--ok')}</li>` +
            `<li><span class="vplat-name">${escVid(translations.video_help_youtube || 'YouTube (de Google)')}</span>${chip(translations.video_help_status_ok || 'Pris en charge', 'vplat-chip--ok')}</li>` +
            `</ul>` +
            `<p class="video-help-body__steps">${escVid(translations.video_help_steps || 'Pas de transcription automatique ? Ouvrez « Voir / coller » et collez un sous-titrage (WebVTT, SRT) ou le texte de la vidéo.')}</p>`;
        openVideoPopover(translations.video_help_title || 'Quelles vidéos utiliser ?', 'fas fa-circle-question', body);
    };

    // Repère temporel relu par parsePastedTranscript. h:mm:ss au-delà d'une heure (sinon les minutes
    // > 99 d'une vidéo longue ne seraient PAS re-parsées si l'utilisateur édite le texte).
    const fmtTsLong = (sec) => {
        sec = Math.max(0, Math.floor(Number(sec) || 0));
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${m}:${String(s).padStart(2, '0')}`;
    };

    // Applique le texte d'un champ : inchangé → on garde l'objet d'origine (fidélité des `end`) ;
    // sinon on re-parse. `closeAfter` ferme le popover (et donc détruit le lecteur via onClose).
    const commitTranscript = async (rawText, origPrefill, tr, closeAfter) => {
        const rawT = (rawText || '').trim();
        if (!rawT) { showNotification(translations.video_paste_empty || 'Collez d\'abord une transcription.', 'error'); return; }
        const s = videoStates.get(moduleKey) || {};
        if (tr && origPrefill != null && rawT === origPrefill.trim()) {
            applyTranscript(tr, s.detect);
        } else {
            const { parsePastedTranscript } = await import('../services/video-transcript.js');
            const parsed = parsePastedTranscript(rawT);
            if (parsed.error) { showNotification(translations.video_paste_empty || 'Transcription vide ou illisible.', 'error'); return; }
            s.transcript = parsed;
            videoStates.set(moduleKey, s);
            applyTranscript(parsed, s.detect);
            showNotification(translations.video_paste_ok || 'Transcription enregistrée.', 'success');
        }
        if (typeof closeAfter === 'function') closeAfter();
    };

    // --- Popover « Voir / coller » ---
    // Transcription TIMÉE + vidéo lisible → éditeur 2 panneaux : transcription (gauche, surlignage de
    // la ligne courante + auto-défilement + édition live) | lecteur (droite). Sinon → champ unique.
    const openTranscriptPopover = (/* mode */) => {
        const st = videoStates.get(moduleKey) || {};
        const tr = (st.transcript && !st.transcript.error) ? st.transcript : null;
        const segs = (tr && Array.isArray(tr.segments)) ? tr.segments : [];
        const videoSource = (st.detect && st.detect.videoSource && st.detect.videoSource.url) ? st.detect.videoSource : null;
        // 2 panneaux dès qu'une vidéo est LISIBLE — même sans transcription auto : on lit la vidéo et
        // on bâtit les passages à la main (bouton « ajouter une ligne »). Sinon → champ unique de collage.
        const synced = !!videoSource;

        // ===== Mode simple : champ unique éditable (pas de timing OU pas de vidéo lisible) =====
        if (!synced) {
            const prefill = segs.length
                ? segs.map(s => `[${fmtTsLong(s.start)}] ${s.text}`).join('\n')
                : (tr && tr.text ? tr.text : '');
            const body = document.createElement('div');
            body.className = 'video-transcript-body';
            const info = document.createElement('p');
            info.className = 'video-transcript-body__info';
            if (tr) {
                const base = segs.length
                    ? (translations.video_transcript_segments || '{n} passages récupérés.').replace('{n}', segs.length)
                    : (translations.video_transcript_plain || 'Transcription récupérée.');
                info.textContent = base + ' ' + (translations.video_transcript_edit_hint || 'Vous pouvez corriger le texte avant de l’utiliser.');
            } else {
                info.classList.add('video-transcript-body__info--paste');
                info.textContent = translations.video_paste_label || 'Transcription (WebVTT, SRT ou texte)';
            }
            const ta = document.createElement('textarea');
            ta.className = 'video-paste-input video-transcript-edit';
            ta.placeholder = translations.video_paste_placeholder || 'WEBVTT… ou collez le texte de la transcription';
            ta.value = prefill;
            const actions = document.createElement('div');
            actions.className = 'video-transcript-actions';
            const useBtn = document.createElement('button');
            useBtn.type = 'button';
            useBtn.className = 'action-btn primary-btn video-paste-btn';
            useBtn.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> ${escVid(translations.video_paste_btn || 'Valider la transcription')}`;
            actions.appendChild(useBtn);
            body.append(info, ta, actions);
            let ctrl;
            useBtn.addEventListener('click', () => commitTranscript(ta.value, prefill, tr, () => ctrl && ctrl.close()));
            ctrl = openVideoPopover(translations.video_transcript_title || 'Transcription', 'fas fa-closed-captioning', body, { wide: true });
            setTimeout(() => ta.focus(), 60);
            return;
        }

        // ===== Mode synchronisé : 2 panneaux (transcription éditable | lecteur) =====
        const prefill = segs.length ? segs.map(s => `[${fmtTsLong(s.start)}] ${s.text}`).join('\n') : '';

        const body = document.createElement('div');
        body.className = 'video-transcript-body video-transcript-body--sync';
        const info = document.createElement('p');
        info.className = 'video-transcript-body__info';
        if (segs.length) {
            info.textContent = (translations.video_transcript_segments || '{n} passages récupérés.').replace('{n}', segs.length)
                + ' ' + (translations.video_transcript_edit_hint || 'Vous pouvez corriger le texte avant de l’utiliser.');
        } else {
            info.classList.add('video-transcript-body__info--paste');
            info.textContent = translations.video_transcript_build_hint || 'Aucune transcription automatique : lisez la vidéo et ajoutez les passages, ou collez la vôtre.';
        }

        // Astuce pédagogique : une transcription bien découpée dans le temps = des questions mieux placées.
        const pedago = document.createElement('p');
        pedago.className = 'video-transcript-body__pedago';
        pedago.innerHTML = `<i class="fas fa-lightbulb" aria-hidden="true"></i> ${escVid(translations.video_transcript_pedago || 'Astuce : plus la transcription est découpée en passages courts et bien horodatés, plus l’IA place les questions au bon moment.')}`;

        const widget = buildSyncedTranscriptEditor(segs, videoSource, {
            labels: {
                use: translations.video_paste_btn || 'Valider la transcription',
                resume: translations.video_transcript_resume || 'Recaler sur la vidéo',
                resumeTip: translations.video_transcript_resume_tip || 'Reprend le défilement automatique calé sur la lecture',
                addLine: translations.video_transcript_add_line || 'Ajouter une ligne à cet instant',
                placeholder: translations.video_paste_placeholder || 'WEBVTT… ou collez le texte de la transcription'
            },
            onUse: (text, edited) => commitTranscript(text, edited ? null : prefill, tr, () => ctrl && ctrl.close())
        });
        body.append(info, pedago, widget.element);

        const ctrl = openVideoPopover(
            translations.video_transcript_title || 'Transcription',
            'fas fa-closed-captioning',
            body,
            { wide: true, onClose: () => widget.destroy() }
        );
        widget.activate(); // crée le lecteur (le conteneur est maintenant dans le DOM)
    };
    // Exposé pour revealVideoManual (filet de sécurité côté génération).
    section._openTranscript = openTranscriptPopover;

    // État initial : génération verrouillée tant qu'aucune transcription n'est prête.
    const initialState = videoStates.get(moduleKey);
    if (!initialState || !initialState.transcript || initialState.transcript.error) setGenEnabled(false);

    let busy = false;
    let currentAbort = null;   // AbortController du run en cours (annulation réseau)
    let runToken = 0;          // jeton de run : un résultat dont le jeton a changé est ignoré

    // Arrêt manuel de la transcription (bouton stop dans le champ). Invalide le run courant,
    // coupe les requêtes réseau en vol (lots PodEduc restants), et remet le champ au neutre.
    const cancelDetection = () => {
        if (!busy) return;
        runToken++;
        if (currentAbort) { try { currentAbort.abort(); } catch { /* déjà abort */ } currentAbort = null; }
        busy = false;
        hideTranscribing();
        setGenEnabled(false);
        setState('empty');
        setMsg(translations.video_transcription_cancelled || 'Transcription arrêtée.');
        showSee(false);
        videoStates.delete(moduleKey);
        setVideoTranscriptSources(null);
    };

    const runDetection = async () => {
        const url = (input.value || '').trim();
        if (!url) { lockGate(); return; }
        if (busy) return;
        busy = true;
        const myToken = ++runToken;
        const ac = new AbortController();
        currentAbort = ac;
        etaLabel = ''; // pas d'estimation tant que la durée est inconnue (phase de détection)
        setState('checking');
        setProgress(0, 0, translations.video_detecting || 'Transcription en cours…'); // voile + jauge indéterminée
        setMsg(null);
        showSee(false);
        setGenEnabled(false);
        try {
            const { detectVideo, fetchTranscript, estimateTranscriptionSeconds, detectPlatform } = await import('../services/video-transcript.js');
            // YouTube : l'attente EST la détection (yt-dlp côté serveur) → on affiche l'estimation
            // tout de suite (durée pas encore connue, mais l'attente y est quasi insensible : ~10 s).
            if (detectPlatform(url) === 'youtube') {
                etaLabel = fmtEta(estimateTranscriptionSeconds({ platform: 'youtube' }));
                setProgress(0, 0, translations.video_detecting || 'Transcription en cours…');
            }
            const detect = await detectVideo(url);
            if (myToken !== runToken) return; // arrêté pendant la détection → on ignore
            if (!detect || !detect.supported || !detect.playable) {
                hideTranscribing();
                setState('error');
                setMsg(translations.video_status_error || 'Vidéo non lisible ou plateforme non supportée (Tubes).', translations.video_retry || 'Réessayer', runDetection);
                showSee(false);
                videoStates.delete(moduleKey);
                setVideoTranscriptSources(null);
                return;
            }
            videoStates.set(moduleKey, { url, detect, transcript: null });

            // Changement de lien vidéo = changement de contexte : un JSON généré pour la vidéo
            // précédente ne correspond plus (transcription différente). On l'efface (textarea +
            // sessionStorage) pour que la bascule en mode guidé reparte d'une base propre — y
            // compris si l'utilisateur a effacé le champ entre-temps (d'où la référence persistante
            // promptVideoUrl, non purgée par lockGate, plutôt que videoStates). Le prompt de gauche
            // est de toute façon reconstruit par applyTranscript ci-dessous.
            if (videoLinkChanged(promptVideoUrl.get(moduleKey), url)) {
                clearGeneratedJson(moduleKey, module);
            }
            promptVideoUrl.set(moduleKey, url);

            // Durée connue → estimation d'attente affichée dans le voile, selon le schéma suivi
            // (sous-titres ≈ instantané, voie Albert ≈ 3 s + 0,5 s/min, repli YouTube audio plus lent).
            etaLabel = fmtEta(estimateTranscriptionSeconds(detect));
            setProgress(0, 0, translations.video_detecting || 'Transcription en cours…');

            // Récupération de la transcription : sous-titres si dispo, sinon transcription audio
            // (Albert) — le tout côté serveur (CORS résolu par le webhook n8n). La jauge suit la
            // progression (lot par lot pour les vidéos PodEduc longues découpées).
            const onProgress = (p) => {
                if (myToken !== runToken || !p) return;
                if (p.stage === 'plan') setProgress(0, 0, translations.video_progress_analyze || 'Analyse et découpage de la vidéo…');
                else if (p.stage === 'transcribe') setProgress(p.current, p.total);
            };
            let transcript = null;
            try { transcript = await fetchTranscript(url, detect, onProgress, ac.signal); } catch { transcript = { error: 'fetch_failed' }; }
            if (myToken !== runToken) return; // arrêté pendant la transcription → on ignore le résultat

            const usable = transcript && !transcript.error
                && ((Array.isArray(transcript.segments) && transcript.segments.length > 0) || (transcript.untimed && transcript.text));

            if (usable) {
                const st = videoStates.get(moduleKey) || { url, detect };
                st.transcript = transcript;
                videoStates.set(moduleKey, st);
                applyTranscript(transcript, detect);
            } else {
                // Transcription automatique indisponible → filet de sécurité : collage manuel (popover).
                hideTranscribing();
                setState('manual');
                setMsg(translations.video_manual_short || 'Transcription automatique indisponible.', translations.video_paste_cta || 'Coller la transcription', () => openTranscriptPopover('paste'));
                showSee(false);
            }
        } catch (e) {
            if (myToken !== runToken) return; // arrêté : l'erreur du run abandonné est sans intérêt
            debugLog('ui', 'détection vidéo échec', e);
            hideTranscribing();
            setState('error');
            setMsg(translations.video_error_network || 'Erreur réseau pendant la détection. Vérifiez le lien et réessayez.', translations.video_retry || 'Réessayer', runDetection);
            showSee(false);
            videoStates.delete(moduleKey);
            setVideoTranscriptSources(null);
        } finally {
            if (myToken === runToken) { busy = false; currentAbort = null; }
        }
    };

    // Une URL « complète » (suffisante pour lancer la détection automatiquement) :
    // PeerTube — toute instance, Apps Education comme tube.reseau-canope.fr (/w/ ou /videos/watch/),
    // PodEduc (host podeduc + /video/<slug>),
    // ou YouTube (watch?v= / youtu.be / embed / shorts / live → id 11 car.).
    const looksComplete = (u) =>
        /^https?:\/\/[^\s]+\/(w|videos\/watch)\/[\w-]+/.test(u)
        || (/podeduc\.apps\.education\.fr/i.test(u) && /\/video\/[\w-]+/.test(u))
        || /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{11}/i.test(u);

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runDetection(); } });
    // Coller / saisir un lien lance AUTOMATIQUEMENT la récupération (debounce) — pas d'attente.
    input.addEventListener('input', () => {
        refreshGo(); // affordance immédiate (avant le debounce), tant qu'on est en état neutre
        clearTimeout(sidebar._videoDebounceTimer);
        sidebar._videoDebounceTimer = setTimeout(() => {
            const cur = (input.value || '').trim();
            const st = videoStates.get(moduleKey);
            if (!cur) { lockGate(); return; }
            if (st && st.url === cur) return; // déjà traité
            if (looksComplete(cur)) runDetection();
            else lockGate();
        }, 600);
    });

    if (helpBtn) helpBtn.addEventListener('click', openHelpPopover);
    if (seeBtn) seeBtn.addEventListener('click', () => openTranscriptPopover('view'));
    if (stopBtn) stopBtn.addEventListener('click', cancelDetection);
    if (goBtn) goBtn.addEventListener('click', runDetection);

    // Réouverture de la modale : NE PAS relancer la transcription (c'est lent et débile si elle
    // a déjà été faite). Si une transcription est en cache pour cette URL → on RESTAURE l'état
    // (lien + prompt + champ vert) sans rien relancer. Sinon, on remplit juste le lien.
    const cached = videoStates.get(moduleKey);
    const cachedUsable = cached && cached.transcript && !cached.transcript.error
        && ((Array.isArray(cached.transcript.segments) && cached.transcript.segments.length > 0)
            || (cached.transcript.untimed && cached.transcript.text));
    if (cached && cached.url && cachedUsable) {
        if (!input.value) input.value = cached.url;
        promptVideoUrl.set(moduleKey, cached.url); // référence du contexte restauré (cohérence comparaison)
        injectVideoTranscriptIntoPrompt(module, transcriptToSegments(cached.transcript, cached.detect), cached.detect && cached.detect.duration);
        setState('ready');
        setMsg(null);
        showSee(true);
        setGenEnabled(true);
    }
    // NB : on ne restaure PLUS l'URL vidéo après un RECHARGEMENT de page (plus aucune relecture de
    // sessionStorage). Un refresh complet doit repartir d'un champ vide — sinon la vidéo précédente
    // « revenait » même en navigation privée (cf. demande auteur). L'URL ne vit donc qu'en mémoire
    // (videoStates + valeur du champ), le temps de la session ; le champ est en autocomplete="off".
}
