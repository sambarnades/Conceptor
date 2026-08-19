/**
 * @file Section « Image de fond » de la barre latérale — upload de l'image, analyse
 * vision, détection des zones, et verrouillage de la génération tant qu'aucune image
 * n'est jointe. Utilisée par les activités déclarant `requiresBackgroundImage`
 * (Image interactive, Trouver la zone, Trouver plusieurs zones).
 *
 * Extraite de `ui.js`, où elle occupait 425 lignes au milieu de 4000 autres.
 *
 * ── Contrat d'injection ──────────────────────────────────────────────────────
 * Les quatre dépendances vers `ui.js` arrivent par le paramètre `ctx` plutôt que
 * par `import`. Ce n'est pas de la cérémonie : `ui.js` importe ce module, donc un
 * import en sens inverse créerait un CYCLE. `sidebar` en particulier est un
 * `const` initialisé au chargement du module (`document.getElementById(...)`) —
 * dans un cycle, sa valeur serait `undefined` ici selon l'ordre d'évaluation.
 * L'injection rend la dépendance explicite et l'ordre d'évaluation sans effet.
 *
 * Couverture : `node tests/run_sidebar_media_sections.mjs`
 */

import { translations, currentLang } from '../core/translation.js';
import { cleanJsonInput } from '../core/utils.js';
import { readContextParams, setImageHotspotZones, buildImageHotspotsPrompt, prefixForModule } from '../services/prompt-generator.js';
import { openVideoPopover } from './media-helpers.js';

/**
 * Injecte les zones détectées (vision) dans le PROMPT de gauche de l'« Image interactive ».
 * Mémorise aussi les zones côté générateur (generatePrompts les réinjectera si le contexte change).
 * @param {Object} module
 * @param {Array<{x:number,y:number,label?:string,description?:string}>} zones
 * @param {{width?:number,height?:number}} imageMeta
 * @param {string} imageDescription
 */
function injectImageZonesIntoPrompt(moduleKey, module, zones, imageMeta, imageDescription) {
    setImageHotspotZones(zones, imageMeta, imageDescription);
    const promptId = module.promptId;
    if (!promptId) return;
    // Chaque activité à image de fond a son propre prompt (Image interactive, Find the
    // Hotspot, Find Multiple Hotspots) : on résout le préfixe i18n depuis le moduleKey.
    const promptText = buildImageHotspotsPrompt(zones, imageMeta, imageDescription, prefixForModule(moduleKey));
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
 * Initialise la section « Image de fond » (activités requiresBackgroundImage uniquement).
 * Logique calquée sur la Vidéo interactive : joindre un FICHIER image lance AUTOMATIQUEMENT
 * le traitement (resize) + l'analyse VISION (Qwen 3.6) avec un indicateur de chargement. Dès que
 * les zones sont détectées, elles sont injectées dans le prompt de gauche et le groupe de boutons
 * de génération se déverrouille. Tant que ce n'est pas le cas, la génération reste grisée.
 * L'image + les zones sont capturées EN AMONT → disponibles en mode rapide ET guidé.
 * @param {string} moduleKey
 * @param {Object} module
 */
export function initBackgroundImageSection(moduleKey, module, ctx) {
    const { sidebar, imageHotspotStates, invalidateImageHotspotsContext } = ctx;

    if (!module || !module.requiresBackgroundImage) return;
    const section = sidebar.querySelector(`#img-bg-section-${moduleKey}`);
    const fileInput = sidebar.querySelector(`#img-bg-input-${moduleKey}`);
    const pickBtn = sidebar.querySelector(`#img-bg-pick-${moduleKey}`);
    if (!section || !fileInput || !pickBtn) return;

    const statusEl = sidebar.querySelector(`#img-bg-status-${moduleKey}`);
    const msgEl = sidebar.querySelector(`#img-bg-msg-${moduleKey}`);
    const overlayEl = section.querySelector('.video-url-field__overlay');
    const overlayLabel = section.querySelector('.video-url-field__overlay-label');
    const progressFill = section.querySelector('.video-url-field__progress');
    const stopBtn = sidebar.querySelector(`#img-bg-stop-${moduleKey}`);
    const field = section.querySelector('.img-bg-field');
    const thumb = pickBtn.querySelector('.img-bg-thumb');
    const pickLabel = pickBtn.querySelector('.img-bg-pick__label');
    const defaultPickLabel = pickLabel ? pickLabel.textContent : '';
    const retryBtn = sidebar.querySelector(`#img-bg-retry-${moduleKey}`);
    const clearBtn = sidebar.querySelector(`#img-bg-clear-${moduleKey}`);
    const helpBtn = sidebar.querySelector(`#img-bg-help-btn-${moduleKey}`);

    const createBtn = sidebar.querySelector(`#${module.createBtnId}`);
    const llmBtn = sidebar.querySelector(`#generate-llm-${moduleKey}`);
    const modelBtn = sidebar.querySelector(`#model-selector-btn-${moduleKey}`);
    const llmGroup = sidebar.querySelector('.top-controls-container .generation-button-group');
    const createGroup = createBtn ? createBtn.closest('.generation-button-group') : null;
    const jsonInputEl = sidebar.querySelector(`#${module.jsonInputId}`);

    let runToken = 0;
    let ac = null;
    let currentEntry = null;      // dernière image traitée (pour relancer la détection sans re-traiter)
    let lastDisplayName = '';     // nom de fichier affiché (miniature/état)

    // Prompt d'analyse (contexte vision) : dérivé de qui/quoi/niveau tant que l'utilisateur
    // ne l'a pas édité lui-même (via le popover « ? ») ; sinon sa version fait foi lors des
    // relances de la détection. Pas de champ permanent dans la section — tout vit dans l'aide.
    let visionCtxValue = '';
    let visionCtxEdited = false;
    const defaultVisionCtx = () => {
        const ctx = readContextParams();
        return [ctx.qui, ctx.quoi, ctx.niveau]
            .map((s) => (s || '').toString().trim()).filter(Boolean).join(' · ');
    };
    const currentVisionCtx = () => (visionCtxEdited ? visionCtxValue.trim() : defaultVisionCtx());
    const resetVisionCtx = () => { visionCtxValue = ''; visionCtxEdited = false; };

    // Affiche/masque les boutons « relancer la détection » (↻) et « retirer l'image » (✕)
    // selon qu'une image est chargée ou non.
    const updateActions = () => {
        const hasImg = !!currentEntry;
        if (retryBtn) retryBtn.hidden = !hasImg;
        if (clearBtn) clearBtn.hidden = !hasImg;
    };

    // Le JSON collé contient-il déjà une image de fond OU des hotspots exploitables ?
    const pastedJsonReady = () => {
        if (!jsonInputEl) return false;
        const v = cleanJsonInput(jsonInputEl.value || '');
        if (!v) return false;
        try {
            const p = JSON.parse(v);
            return !!(p && typeof p === 'object' && (p.image || (Array.isArray(p.hotspots) && p.hotspots.length)));
        } catch { return false; }
    };

    const refreshCreateGate = () => {
        if (!createBtn) return;
        const ok = imageHotspotStates.has(moduleKey) || pastedJsonReady();
        createBtn.disabled = !ok;
        createBtn.classList.toggle('is-disabled-gate', !ok);
        if (createGroup) createGroup.classList.toggle('gen-gated', !ok);
    };

    const STATUS_ICON = {
        checking: '<span class="video-spinner" aria-hidden="true"></span>',
        ready: '<i class="fas fa-circle-check" aria-hidden="true"></i>',
        error: '<i class="fas fa-circle-exclamation" aria-hidden="true"></i>',
        empty: ''
    };
    const setState = (state) => {
        section.dataset.state = state;
        if (statusEl) statusEl.innerHTML = STATUS_ICON[state] || '';
    };
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
    const setProgressIndet = (label) => {
        if (!overlayEl) return;
        overlayEl.hidden = false;
        if (progressFill) progressFill.classList.add('video-url-field__progress--indet');
        if (overlayLabel) {
            overlayLabel.innerHTML = '<span class="video-spinner" aria-hidden="true"></span>';
            const s = document.createElement('span');
            s.textContent = label || (translations.ih_image_analyzing || 'Analyse de l’image…');
            overlayLabel.appendChild(s);
        }
    };
    const hideProgress = () => {
        if (overlayEl) overlayEl.hidden = true;
        if (progressFill) { progressFill.style.width = ''; progressFill.classList.remove('video-url-field__progress--indet'); }
    };
    const setGenEnabled = (enabled) => {
        if (llmGroup) llmGroup.classList.toggle('gen-gated', !enabled);
        [llmBtn, modelBtn].forEach(btn => {
            if (!btn) return;
            btn.disabled = !enabled;
            btn.classList.toggle('is-disabled-gate', !enabled);
        });
        refreshCreateGate();
    };

    const setPicked = (name, dataURL) => {
        if (thumb && dataURL) { thumb.src = dataURL; thumb.hidden = false; }
        if (pickLabel && name) pickLabel.textContent = name;
    };
    // Remet le sélecteur à l'état « aucune image » (miniature cachée, libellé par défaut, input vidé
    // pour qu'un re-choix du même fichier redéclenche bien l'événement change).
    const resetPicked = () => {
        if (thumb) { thumb.src = ''; thumb.hidden = true; }
        if (pickLabel) pickLabel.textContent = defaultPickLabel;
        if (fileInput) fileInput.value = '';
    };

    const imgErrMsg = (e) => {
        const code = (e && e.message) || '';
        if (code === 'FORMAT_INVALID') return translations.ih_image_format_error || 'Format d’image non pris en charge (PNG, JPEG, WebP).';
        if (code === 'SIZE_EXCEEDED') return translations.ih_image_size_error || 'Image trop lourde (max 12 Mo).';
        return translations.ih_vision_error || 'Le traitement de l’image a échoué.';
    };

    if (jsonInputEl) jsonInputEl.addEventListener('input', refreshCreateGate);

    // Traite une image (si `file` fourni) puis lance la détection des zones (vision). Appelée SANS
    // argument (bouton ↻), elle relance UNIQUEMENT la détection sur l'image déjà traitée
    // (`currentEntry`) — utile quand trop peu de zones ont été détectées, et marche aussi après
    // restauration de la modale (où l'objet File n'existe plus, mais l'entry/dataURL survit).
    async function runVisionAnalysis(file) {
        const myToken = ++runToken;
        if (ac) { try { ac.abort(); } catch { /* noop */ } }
        ac = new AbortController();
        setState('checking');
        setProgressIndet(translations.ih_image_analyzing || 'Analyse de l’image…');
        setGenEnabled(false);
        setMsg(null);
        try {
            const { processBackgroundImage, registerImage, buildBackgroundImageField } = await import('../h5p/image-manager.js');
            const { detectImageZones } = await import('../services/hotspot-vision.js');

            // Nouveau fichier → traitement (resize/conversion) + remplacement PROPRE du précédent.
            if (file) {
                let entry;
                try {
                    entry = await processBackgroundImage(file);
                } catch (e) {
                    if (myToken !== runToken) return;
                    currentEntry = null;
                    hideProgress(); setState('error'); updateActions();
                    setMsg(imgErrMsg(e), translations.video_retry || 'Réessayer', () => runVisionAnalysis(file));
                    return;
                }
                if (myToken !== runToken) return;
                currentEntry = entry;
                lastDisplayName = file.name || '';
                registerImage('image', entry);          // même id 'image' → remplace l'image précédente
                setPicked(lastDisplayName, entry.dataURL);
            }
            if (!currentEntry) { hideProgress(); setState('empty'); updateActions(); return; }
            updateActions();                            // image présente → boutons ↻ / ✕ disponibles

            const ctx = readContextParams();
            const reqN = parseInt(ctx.nombreQuestions, 10);
            // Mode Avancé avec un nombre → on FORCE ce nombre de zones ; sinon (Rapide) → undefined,
            // le serveur en détermine ~4-5 selon l'image (un peu plus/moins si justifié).
            const count = (ctx.isAdvanced && reqN > 0) ? reqN : undefined;

            // Contexte d'analyse : celui édité dans le popover « ? » s'il existe, sinon
            // dérivé de qui/quoi/niveau. Passé au prompt vision via context.hint.
            const visionHint = currentVisionCtx();

            let result;
            try {
                result = await detectImageZones(currentEntry.dataURL, {
                    context: { qui: ctx.qui, quoi: ctx.quoi, niveau: ctx.niveau, hint: visionHint },
                    count, lang: currentLang, signal: ac.signal
                });
            } catch (e) {
                if ((e && e.name === 'AbortError') || myToken !== runToken) return;
                hideProgress(); setState('error'); updateActions();
                setMsg(translations.ih_vision_error || 'Détection automatique indisponible.', translations.video_retry || 'Réessayer', () => runVisionAnalysis());
                return;
            }
            if (myToken !== runToken) return;
            hideProgress();

            if (!result.zones || !result.zones.length) {
                setState('error'); updateActions();
                setMsg(translations.ih_vision_error || 'Aucune zone détectée.', translations.video_retry || 'Réessayer', () => runVisionAnalysis());
                return;
            }

            imageHotspotStates.set(moduleKey, {
                entry: currentEntry,
                image: buildBackgroundImageField(currentEntry),
                dataURL: currentEntry.dataURL,
                width: currentEntry.width,
                height: currentEntry.height,
                zones: result.zones,
                imageDescription: result.imageDescription || '',
                altText: result.imageDescription || lastDisplayName || '',
                fileName: lastDisplayName
            });
            injectImageZonesIntoPrompt(moduleKey, module, result.zones, { width: currentEntry.width, height: currentEntry.height }, result.imageDescription || '');
            setState('ready');
            setGenEnabled(true);
            updateActions();
            setMsg((translations.ih_zones_found || '{n} zones détectées — vous pouvez générer.').replace('{n}', result.zones.length));
        } catch (err) {
            if (myToken !== runToken) return;
            hideProgress(); setState('error'); updateActions();
            setMsg(translations.ih_vision_error || 'Le traitement de l’image a échoué.', translations.video_retry || 'Réessayer', () => runVisionAnalysis());
        }
    }

    // Retire l'image courante et remet la section à zéro (pour en charger une autre proprement).
    function clearImage() {
        runToken++;
        if (ac) { try { ac.abort(); } catch { /* noop */ } }
        currentEntry = null;
        lastDisplayName = '';
        imageHotspotStates.delete(moduleKey);
        setImageHotspotZones(null);
        import('../h5p/image-manager.js').then(m => m.unregisterImage('image')).catch(() => { /* registre déjà vide */ });
        hideProgress();
        resetPicked();
        resetVisionCtx();
        setState('empty');
        setMsg(null);
        setGenEnabled(false);
        updateActions();
    }

    // Popover « ? » : formats d'image acceptés + contexte d'analyse éditable (mini-prompt
    // vision). Tout ce qui est secondaire vit ici pour garder la section légère.
    function openImageHelpPopover() {
        const body = document.createElement('div');
        body.className = 'video-help-body img-help-body';

        const intro = document.createElement('p');
        intro.className = 'video-help-body__intro';
        intro.textContent = translations.ih_help_intro || 'Joignez une image de fond (un fichier, pas un lien). Caramel l’analyse et détecte automatiquement les zones clés selon votre contexte. Vous pouvez relancer la détection (↻) ou retirer l’image (✕).';
        body.appendChild(intro);

        // Formats sous forme de pastilles (noms neutres, non traduits), sans distinction :
        // les HEIC/HEIF/TIFF sont convertis automatiquement, donc « ça marche » pareil.
        const card = document.createElement('div');
        card.className = 'img-help-formats';
        const pills = document.createElement('div');
        pills.className = 'img-help-formats__pills';
        for (const f of ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'AVIF', 'SVG', 'HEIC', 'HEIF', 'TIFF']) {
            const p = document.createElement('span');
            p.className = 'img-help-pill';
            p.textContent = f;
            pills.appendChild(p);
        }
        card.appendChild(pills);

        const note = document.createElement('p');
        note.className = 'img-help-formats__note';
        note.textContent = translations.ih_help_formats || 'HEIC/HEIF : photos iPhone. Taille maximale : 12 Mo.';
        card.appendChild(note);
        body.appendChild(card);

        // Contexte d'analyse : le mini-prompt envoyé au modèle vision, prérempli depuis
        // qui/quoi/niveau, modifiable ici ; « Relancer la détection » applique la version
        // éditée sur l'image déjà chargée (bouton grisé tant qu'aucune image n'est là).
        const ctxWrap = document.createElement('div');
        ctxWrap.className = 'img-help-ctx';
        const ctxLabel = document.createElement('label');
        ctxLabel.className = 'img-help-ctx__label';
        ctxLabel.innerHTML = '<i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>';
        ctxLabel.append(document.createTextNode(' ' + (translations.ih_vision_ctx_label || 'Contexte d’analyse de l’image')));
        const ctxArea = document.createElement('textarea');
        ctxArea.className = 'img-help-ctx__input';
        ctxArea.rows = 2;
        ctxArea.maxLength = 300;
        ctxArea.placeholder = translations.ih_vision_ctx_placeholder || 'Préciser à l’IA ce qu’elle doit repérer dans l’image…';
        ctxArea.value = currentVisionCtx();
        ctxLabel.htmlFor = ctxArea.id = `img-help-ctx-input-${moduleKey}`;
        ctxArea.addEventListener('input', () => {
            visionCtxValue = ctxArea.value;
            visionCtxEdited = true;
        });

        // Dépliant « prompt complet » (lecture seule) : le prompt vision assemblé tel qu'il
        // part au modèle, avec le bloc contexte surligné. Le squelette technique (échelle des
        // coordonnées, schéma JSON) n'est PAS éditable — seul le contexte l'est, au-dessus.
        const promptDetails = document.createElement('details');
        promptDetails.className = 'img-help-prompt';
        const promptSummary = document.createElement('summary');
        promptSummary.textContent = translations.ih_vision_prompt_toggle || 'Voir le prompt complet envoyé à l’IA';
        const promptPre = document.createElement('pre');
        promptPre.className = 'img-help-prompt__pre';
        promptDetails.append(promptSummary, promptPre);
        const refreshPromptPreview = async () => {
            const { getVisionPromptPreview } = await import('../services/hotspot-vision.js');
            const pCtx = readContextParams();
            const pReqN = parseInt(pCtx.nombreQuestions, 10);
            const pCount = (pCtx.isAdvanced && pReqN > 0) ? pReqN : undefined;
            const parts = getVisionPromptPreview(
                { qui: pCtx.qui, quoi: pCtx.quoi, niveau: pCtx.niveau, hint: ctxArea.value.trim() },
                pCount
            );
            if (!parts) { promptDetails.hidden = true; return; }
            promptPre.textContent = '';
            promptPre.append(document.createTextNode(parts.before));
            if (parts.ctxBlock) {
                const m = document.createElement('mark');
                m.className = 'img-help-prompt__ctx';
                m.textContent = parts.ctxBlock;
                promptPre.appendChild(m);
            }
            promptPre.append(document.createTextNode(parts.after));
        };
        promptDetails.addEventListener('toggle', () => { if (promptDetails.open) refreshPromptPreview(); });
        ctxArea.addEventListener('input', () => { if (promptDetails.open) refreshPromptPreview(); });

        const ctxActions = document.createElement('div');
        ctxActions.className = 'img-help-ctx__actions';
        const goBtn = document.createElement('button');
        goBtn.type = 'button';
        goBtn.className = 'img-help-ctx__go';
        goBtn.innerHTML = '<i class="fas fa-rotate-right" aria-hidden="true"></i>';
        goBtn.append(document.createTextNode(' ' + (translations.ih_retry_detection || 'Relancer la détection')));
        goBtn.disabled = !currentEntry;
        ctxActions.appendChild(goBtn);
        ctxWrap.append(ctxLabel, ctxArea, promptDetails, ctxActions);
        body.appendChild(ctxWrap);

        const { close } = openVideoPopover(translations.ih_help_title || 'Quelles images utiliser ?', 'fas fa-circle-question', body);
        goBtn.addEventListener('click', () => { close(); runVisionAnalysis(); });
    }

    // --- Wiring ---
    pickBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';   // réinitialiser pour permettre de re-choisir le même fichier
        if (file) runVisionAnalysis(file);
    });
    if (retryBtn) retryBtn.addEventListener('click', () => runVisionAnalysis());   // relance la détection
    if (clearBtn) clearBtn.addEventListener('click', clearImage);                  // retire l'image
    if (helpBtn) helpBtn.addEventListener('click', openImageHelpPopover);          // ? formats acceptés
    if (stopBtn) stopBtn.addEventListener('click', () => {
        runToken++;
        if (ac) { try { ac.abort(); } catch { /* noop */ } }
        hideProgress(); setState(imageHotspotStates.has(moduleKey) ? 'ready' : 'empty');
        setMsg(null);
        updateActions();
    });
    // Glisser-déposer une image sur le champ.
    if (field) {
        ['dragenter', 'dragover'].forEach(ev => field.addEventListener(ev, (e) => { e.preventDefault(); field.classList.add('img-bg-field--drag'); }));
        ['dragleave', 'drop'].forEach(ev => field.addEventListener(ev, (e) => { e.preventDefault(); field.classList.remove('img-bg-field--drag'); }));
        field.addEventListener('drop', (e) => {
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            // file.type peut être vide pour un HEIC/TIFF déposé → on accepte aussi par extension
            // (processBackgroundImage validera/convertira ou lèvera FORMAT_INVALID le cas échéant).
            const looksImage = !!file && ((file.type && file.type.indexOf('image/') === 0)
                || /\.(png|jpe?g|webp|gif|bmp|avif|svg|heic|heif|tiff?)$/i.test(file.name || ''));
            if (looksImage) runVisionAnalysis(file);
        });
    }

    // Réinitialisation de l'UI déclenchée par un changement de contexte (invalidateImageHotspotsContext) :
    // l'état/le registre/les zones sont déjà purgés en amont ; on ne remet ici QUE la section à neuf.
    section._resetImage = () => {
        runToken++;                                 // invalide une analyse vision en vol
        if (ac) { try { ac.abort(); } catch { /* noop */ } }
        currentEntry = null;
        lastDisplayName = '';
        hideProgress();
        resetPicked();
        resetVisionCtx();
        setState('empty');
        setMsg(null);
        setGenEnabled(false);
        updateActions();
    };

    // Restauration au ré-ouverture de la modale (Chantier 2bis) : l'image + les zones capturées
    // survivent dans imageHotspotStates. On restaure la miniature, l'état « prêt », les zones dans le
    // prompt et le déverrouillage, SANS re-upload ni re-analyse. On ré-enregistre le fond dans le
    // registre car clearAllImages() le vide après chaque packaging (sinon il manquerait à la prochaine
    // génération). Sinon : état vide, génération verrouillée (sauf JSON collé déjà prêt).
    const restored = imageHotspotStates.get(moduleKey);
    if (restored && restored.entry && Array.isArray(restored.zones) && restored.zones.length) {
        currentEntry = restored.entry;              // permet de relancer la détection (↻) après ré-ouverture
        lastDisplayName = restored.fileName || '';
        import('../h5p/image-manager.js').then(m => m.registerImage('image', restored.entry)).catch(() => { /* ré-enregistrement best-effort */ });
        setPicked(restored.fileName, restored.dataURL);
        injectImageZonesIntoPrompt(moduleKey, module, restored.zones, { width: restored.width, height: restored.height }, restored.imageDescription);
        setState('ready');
        setGenEnabled(true);
        updateActions();
        setMsg((translations.ih_zones_found || '{n} zones détectées — vous pouvez générer.').replace('{n}', restored.zones.length));
    } else {
        // État initial : génération verrouillée tant qu'aucune image analysée (sauf JSON collé prêt).
        setState('empty');
        setGenEnabled(false);
        updateActions();
    }
}
