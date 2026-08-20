/**
 * Panneau éditeur « Dictée » — synthèse vocale intégrée AUX PHRASES (Caramel — partagé
 * éditeur, cf. CLAUDE.md item 7 : fichier HOST-AGNOSTIQUE, tout accès réseau/média est
 * INJECTÉ par l'index.js divergent de chaque dépôt via `deps`).
 *
 * Architecture (retour de test 2026-07-10 : « tout doit s'intégrer naturellement avec les
 * phrases », « générer un seul son à la fois », « scroller doit rester possible ») :
 *
 *   • Une BARRE COMPACTE (frère du conteneur, hauteur fixe, ne casse pas le scroll) :
 *     langue (11), voix F/M (genres indisponibles grisés d'après le catalogue serveur),
 *     lecture lente, bouton de génération, statut. Changer langue/voix/lente NE LANCE
 *     RIEN : le réglage s'applique (les phrases déjà synthétisées pour ce réglage se
 *     réécoutent aussitôt depuis le cache, aller-retour entre voix compris) et ce qui
 *     reste à produire est annoncé par le bandeau `.dt-pending` — seul son bouton
 *     déclenche la synthèse, qui peut durer jusqu'à une minute (retour d'usage 2026-08-20).
 *
 *   • Des CONTRÔLES PAR PHRASE, injectés DANS chaque item du tableau « Phrases » de
 *     l'éditeur (décoration idempotente du DOM, re-posée après chaque re-rendu via
 *     MutationObserver) : lecteurs (voix normale + lente), bouton « Générer » CETTE
 *     phrase seule, dictaphone « Ma voix » (enregistrement + rognage sur forme d'onde,
 *     cf. editor/audio-recorder-widget.js) et retour à la voix de synthèse.
 *
 * Un audio « Ma voix » (chemin non `audios/dictation-*`) n'est JAMAIS écrasé par la
 * synthèse. Après toute synthèse, les chemins déterministes sont REPORTÉS dans
 * `sentences[].sample`/`sampleAlternative` — indispensable pour les hôtes SANS processeur
 * (Sucrerie), où la sortie de l'éditeur est écrite telle quelle.
 *
 * Réglages persistés dans `data.tts = { lang, voice, slow }` (lus à la (re)génération).
 *
 * @module editor/dictation-tts-panel
 */
import { t } from '../core/translation.js';

const PANEL_CLASS = 'dt-editor-panel';
const TTS_PATH_RE = /audios\/dictation-[0-9a-f]{8}\.mp3$/;

// Libellé de chaque langue DANS la langue elle-même (convention des sélecteurs de langue).
const LANG_LABELS = {
    fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', it: 'Italiano',
    nl: 'Nederlands', pt: 'Português', ar: 'العربية', zh: '中文', jp: '日本語', el: 'Ελληνικά'
};

let state = null;

function escapeText(s) {
    // Échappe AUSSI `"` et `'` : ces valeurs finissent en attribut (title=…, value=…)
    // dans les gabarits de ce panneau, où `& < >` seuls ne suffisent pas.
    // Table alignée sur `js/core/escape.js` ; recopiée ici volontairement car ce
    // fichier est byte-identique côté Sucrerie (pas de dépendance inter-dépôts).
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function sentenceText(s) {
    return String((s && s.text) || '').trim();
}

/** Persiste les réglages TTS dans les données de l'éditeur (consommés à la sauvegarde). */
function persistSettings() {
    const data = state.api.getData() || {};
    data.tts = { lang: state.lang, voice: state.voice, slow: state.slow, slowRate: state.slowRate };
    state.api.setData(data);
}

/** true si le champ sample est un audio MANUEL (« Ma voix » / import), à ne jamais écraser. */
function isManualSample(v) {
    const f = Array.isArray(v) ? v[0] : v;
    return !!(f && typeof f.path === 'string' && f.path && !TTS_PATH_RE.test(f.path));
}

/** Reporte les chemins TTS déterministes d'une phrase dans les données de l'éditeur. */
function writeTtsPaths(sentence, text) {
    const opts = { lang: state.lang, voice: state.voice };
    if (!isManualSample(sentence.sample)) {
        sentence.sample = { path: state.deps.audioPath(text, { ...opts, slow: false }), mime: 'audio/mpeg', kind: 'audio' };
    }
    if (!isManualSample(sentence.sampleAlternative)) {
        if (state.slow) {
            sentence.sampleAlternative = { path: state.deps.audioPath(text, { ...opts, slow: true }), mime: 'audio/mpeg', kind: 'audio' };
        } else {
            delete sentence.sampleAlternative;
        }
    }
}

/**
 * Monte (ou remonte) la barre TTS + la décoration par phrase.
 * @param {HTMLElement} container - Conteneur de l'éditeur JSON.
 * @param {{getData:Function, setData:Function}} api
 * @param {Object} deps - Injecté par l'hôte :
 * @param {Function} deps.synthesize - (texts, {lang,voice,slow,signal}) → {audios|error, genderFallback}
 * @param {Function} deps.fetchVoices - () → { langs: { fr:{female,male}, … } } | null
 * @param {Function} deps.getCachedAudio - (text, {lang,voice,slow}) → {blob}|undefined
 * @param {Function} deps.audioPath - (text, {lang,voice,slow}) → « audios/dictation-<hash>.mp3 »
 * @param {Function} [deps.getManualAudio] - (path) → Blob|undefined (audios non-TTS du .h5p rouvert)
 * @param {Function} [deps.processAudioFile] - (file) → Promise<MediaEntry> (image-manager de l'hôte)
 * @param {Function} [deps.registerMedia] - (id, entry) → void (embarquement au save)
 * @param {string[]} deps.langs - Codes langue proposés.
 * @param {string} [deps.defaultLang] - Langue par défaut (langue UI de l'hôte).
 */
export function mountDictationTtsPanel(container, api, deps) {
    if (!container || !api || !deps) return;
    destroyDictationTtsPanel();

    const data = api.getData() || {};
    const saved = data.tts || {};
    const langs = deps.langs || Object.keys(LANG_LABELS);

    // Lecture lente : réglage sauvegardé, sinon INFÉRÉ du contenu (des phrases déjà
    // sonorisées sans piste lente = l'auteur l'avait désactivée), sinon activée.
    const sentences0 = Array.isArray(data.sentences) ? data.sentences : [];
    const hasSample0 = sentences0.some(s => s && s.sample && (Array.isArray(s.sample) ? s.sample[0] && s.sample[0].path : s.sample.path));
    const hasAlt0 = sentences0.some(s => s && s.sampleAlternative && (Array.isArray(s.sampleAlternative) ? s.sampleAlternative[0] && s.sampleAlternative[0].path : s.sampleAlternative.path));

    state = {
        api, deps, container,
        lang: langs.includes(saved.lang) ? saved.lang : (langs.includes(deps.defaultLang) ? deps.defaultLang : 'fr'),
        voice: saved.voice === 'male' ? 'male' : 'female',
        slow: (saved.slow !== undefined) ? (saved.slow !== false) : (hasSample0 ? hasAlt0 : true),
        // Vitesse de la piste lente GÉNÉRÉE PAR LA MACHINE pour « Ma voix » (time-stretch
        // sans changement de hauteur, cf. audio-recorder-widget). La lente TTS reste
        // synthétisée côté serveur (prosodie Piper). 0.5 ≤ ×vitesse ≤ 0.9.
        slowRate: (typeof saved.slowRate === 'number' && saved.slowRate >= 0.5 && saved.slowRate <= 0.9) ? saved.slowRate : 0.7,
        busy: false,
        abort: null,
        elapsedTimer: null,   // compteur de secondes affiché pendant la synthèse
        startedAt: 0,
        catalog: null,
        objectUrls: new Map(),   // clé phrase (ou '_') → URLs blob: à révoquer
        panel: null,
        observer: null,
        resyncTimer: null,
        recorders: new Map()   // index → {destroy}
    };

    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
        <div class="dt-header">
            <i class="fas fa-volume-up" aria-hidden="true"></i>
            <span class="dt-title">${escapeText(t('editor_dictation_tts_title') || 'Synthèse vocale')}</span>
            <span class="dt-status" role="status" aria-live="polite"></span>
        </div>
        <div class="dt-controls">
            <label class="dt-field">
                <span>${escapeText(t('editor_dictation_tts_lang') || 'Langue de la dictée')}</span>
                <select class="dt-lang">
                    ${langs.map(l => `<option value="${l}" ${l === state.lang ? 'selected' : ''}>${escapeText(LANG_LABELS[l] || l)}</option>`).join('')}
                </select>
            </label>
            <div class="dt-field" role="radiogroup" aria-label="${escapeText(t('editor_dictation_tts_voice') || 'Voix')}">
                <span>${escapeText(t('editor_dictation_tts_voice') || 'Voix')}</span>
                <div class="dt-voice-toggle">
                    <button type="button" class="dt-voice" data-voice="female" aria-pressed="${state.voice === 'female'}">
                        ${escapeText(t('editor_dictation_voice_female') || 'Féminine')}
                    </button>
                    <button type="button" class="dt-voice" data-voice="male" aria-pressed="${state.voice === 'male'}">
                        ${escapeText(t('editor_dictation_voice_male') || 'Masculine')}
                    </button>
                </div>
            </div>
            <label class="dt-field dt-field--slow">
                <input type="checkbox" class="dt-slow" ${state.slow ? 'checked' : ''} />
                <span>${escapeText(t('editor_dictation_tts_slow') || 'Générer aussi une lecture lente')}</span>
            </label>
            <button type="button" class="dt-regenerate">
                <i class="fas fa-sync-alt" aria-hidden="true"></i>
                <span class="dt-regenerate-label">${escapeText(t('editor_dictation_tts_regenerate_all') || 'Tout régénérer')}</span>
            </button>
            <button type="button" class="dt-cancel" hidden>
                <i class="fas fa-times" aria-hidden="true"></i>
                ${escapeText(t('editor_dictation_tts_cancel') || 'Annuler')}
            </button>
        </div>
        <div class="dt-pending" hidden>
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            <span class="dt-pending-msg"></span>
        </div>
        <div class="dt-fallback" hidden>
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            <span>${escapeText(t('editor_dictation_tts_fallback') || 'La voix demandée n\'existe pas dans cette langue : l\'autre voix sera utilisée.')}</span>
        </div>
    `;
    state.panel = panel;
    // La barre vit DANS la section « Informations générales » de l'éditeur (mode
    // maître/détail) — une carte séparée au-dessus mangeait la hauteur des petits
    // écrans (retour de test 2026-07). Repli : au-dessus du conteneur (mode à plat).
    placePanel();

    // Changer LANGUE / VOIX / LECTURE LENTE ne DÉCLENCHE PLUS la synthèse : la synthèse est
    // longue (jusqu'à ~1 min) et partait sans que l'utilisateur sache qu'il venait de la
    // lancer (retour d'usage 2026-08-20 : « si je clique sur masculine, l'utilisateur ne
    // sait même pas qu'il valide »). Le réglage est appliqué immédiatement — les phrases
    // DÉJÀ synthétisées pour ce réglage se réécoutent aussitôt depuis le cache (aller-retour
    // Féminine → Masculine → Féminine = zéro appel réseau) — et ce qui reste à produire est
    // annoncé par le bandeau `.dt-pending`, dont le bouton « Générer » est le seul déclencheur.
    panel.querySelector('.dt-lang').addEventListener('change', (e) => {
        state.lang = e.target.value;
        persistSettings();
        applyCatalog();
        onSettingsChanged();
    });
    panel.querySelectorAll('.dt-voice').forEach(btn => btn.addEventListener('click', () => {
        if (btn.disabled || state.busy || state.voice === btn.dataset.voice) return;
        state.voice = btn.dataset.voice;
        panel.querySelectorAll('.dt-voice').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === state.voice)));
        persistSettings();
        onSettingsChanged();
    }));
    panel.querySelector('.dt-slow').addEventListener('change', (e) => {
        state.slow = !!e.target.checked;
        persistSettings();
        onSettingsChanged();
    });
    panel.querySelector('.dt-regenerate').addEventListener('click', () => regenerateAll());
    panel.querySelector('.dt-cancel').addEventListener('click', () => {
        if (state && state.abort) { try { state.abort.abort(); } catch { /* déjà annulé */ } }
    });

    persistSettings();

    // Catalogue des voix (grise les genres indisponibles) — best-effort.
    Promise.resolve(deps.fetchVoices && deps.fetchVoices()).then(cat => {
        if (!state || state.panel !== panel) return;
        state.catalog = cat || null;
        applyCatalog();
    }).catch(() => { /* catalogue indisponible : les 2 genres restent actifs */ });

    // Décoration par phrase : posée maintenant, re-posée après chaque re-rendu de l'éditeur
    // (MutationObserver) et resynchronisée quand on ÉDITE un texte (statuts à jour).
    decorateSentences();
    state.observer = new MutationObserver((mutations) => {
        // Ignorer les mutations issues de NOS propres blocs (sinon boucle décoration→observer).
        const external = mutations.some(m => {
            const n = m.target;
            return !(n && n.closest && (n.closest('.dt-sentence-audio') || n.closest('.' + PANEL_CLASS)));
        });
        if (external) scheduleResync();
    });
    state.observer.observe(container, { childList: true, subtree: true });
    container.addEventListener('input', onEditorInput);
    state._onEditorInput = onEditorInput;

    function onEditorInput(ev) {
        const target = ev.target;
        if (target && typeof target.dataset?.path === 'string' && /^sentences\.\d+\.text$/.test(target.dataset.path)) {
            scheduleResync();
        }
    }
}

/** Re-décoration différée (idempotente) — évite de travailler à chaque frappe/mutation. */
function scheduleResync() {
    if (!state) return;
    clearTimeout(state.resyncTimer);
    state.resyncTimer = setTimeout(() => { if (state) decorateSentences(); }, 350);
}

/** Grise les genres indisponibles pour la langue courante d'après le catalogue. */
function applyCatalog() {
    if (!state || !state.panel) return;
    const entry = state.catalog && state.catalog.langs && state.catalog.langs[state.lang];
    let switched = false;
    state.panel.querySelectorAll('.dt-voice').forEach(btn => {
        const available = !entry || !!entry[btn.dataset.voice];
        btn.disabled = !available;
        btn.title = available ? '' : (t('editor_dictation_voice_unavailable') || 'Voix indisponible dans cette langue');
        if (!available && state.voice === btn.dataset.voice) {
            state.voice = btn.dataset.voice === 'female' ? 'male' : 'female';
            switched = true;
        }
    });
    if (switched) {
        state.panel.querySelectorAll('.dt-voice').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === state.voice)));
        persistSettings();
    }
}

/** Écrit `v` dans un nœud SEULEMENT s'il change (évite un repaint pour rien). */
function setText(el, v) { if (el && el.textContent !== v) el.textContent = v; }
/** Idem pour l'attribut `hidden`. */
function setHidden(el, v) { if (el && el.hidden !== v) el.hidden = v; }

/**
 * Statut de la barre. Idempotent : réécrire un statut identique repeint la zone pour rien
 * et, en passant par innerHTML, refait clignoter l'icône FontAwesome. Hors mode « spinner »
 * on écrit du texte, pas du HTML — c'est du texte, et ça évite une analyse HTML par frappe.
 */
function setStatus(msg, spinning = false) {
    const el = state && state.panel && state.panel.querySelector('.dt-status');
    if (!el) return;
    const text = String(msg || '');
    if (el.dataset.msg === text && el.dataset.spin === String(spinning)) return;
    el.dataset.msg = text;
    el.dataset.spin = String(spinning);
    if (spinning) el.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${escapeText(text)}`;
    else el.textContent = text;
}

// =======================================================================
// TRAVAIL RESTANT (« qu'est-ce qui partirait en réseau si je générais ? »)
// =======================================================================

/** true si l'audio de ce texte est DÉJÀ disponible (cache session ou .h5p ré-hydraté). */
function isCached(text, slow) {
    const entry = state.deps.getCachedAudio(text, { lang: state.lang, voice: state.voice, slow });
    return !!(entry && entry.blob);
}

/**
 * Phrases qu'une génération devrait réellement SYNTHÉTISER pour les réglages courants.
 * Exclut les phrases vides, celles en « Ma voix » et celles déjà en cache — c'est
 * exactement le sous-ensemble que `synthesizeSentences` enverrait au serveur, donc le
 * seul chiffre honnête à annoncer avant de lancer.
 */
function pendingSentences(data) {
    const d = data || state.api.getData() || {};
    const sentences = Array.isArray(d.sentences) ? d.sentences : [];
    return sentences.filter(s => {
        const text = sentenceText(s);
        if (!text || isManualSample(s.sample)) return false;
        if (!isCached(text, false)) return true;
        return state.slow && !isCached(text, true);
    });
}

/** Nombre de phrases synthétisables (vides et « Ma voix » exclues). */
function synthesizableCount(data) {
    const d = data || state.api.getData() || {};
    const sentences = Array.isArray(d.sentences) ? d.sentences : [];
    return sentences.filter(s => sentenceText(s) && !isManualSample(s.sample)).length;
}

/** Applique `{n}` (convention d'interpolation du projet, cf. validators.js). */
function withCount(key, fallback, n) {
    return String(t(key) || fallback).replace('{n}', String(n));
}

/**
 * Met à jour le bandeau « reste à générer » et le libellé du bouton.
 * Rien en attente → bandeau masqué et bouton neutralisé : l'utilisateur voit d'un coup
 * d'œil que le réglage courant est déjà couvert (cas de l'aller-retour entre voix).
 */
function refreshPending(data) {
    if (!state || !state.panel) return;
    const bar = state.panel.querySelector('.dt-pending');
    const msg = state.panel.querySelector('.dt-pending-msg');
    const btn = state.panel.querySelector('.dt-regenerate');
    const label = state.panel.querySelector('.dt-regenerate-label');
    if (!bar || !msg || !btn || !label) return;

    if (state.busy) { setHidden(bar, true); return; }

    const d = data || state.api.getData() || {};
    const pending = pendingSentences(d).length;
    const total = synthesizableCount(d);

    if (total === 0) {
        setHidden(bar, true);
        btn.disabled = true;
        setText(label, t('editor_dictation_tts_regenerate_all') || 'Tout régénérer');
        return;
    }
    btn.disabled = false;
    if (pending === 0) {
        setHidden(bar, true);
        setText(label, t('editor_dictation_tts_regenerate_all') || 'Tout régénérer');
        return;
    }
    setHidden(bar, false);
    setText(msg, withCount(
        'editor_dictation_tts_pending',
        '{n} phrase(s) restent à générer pour ce réglage. La synthèse peut prendre jusqu\'à une minute.',
        pending
    ));
    setText(label, withCount('editor_dictation_tts_generate_pending', 'Générer ({n})', pending));
}

/**
 * Réglage changé : on applique SANS générer. Les lecteurs se rafraîchissent depuis le
 * cache (audio déjà produit pour ce réglage → réécoute immédiate), le reste est annoncé.
 */
function onSettingsChanged() {
    if (!state) return;

    // Les phrases dont l'audio du NOUVEAU réglage est déjà en cache voient leurs chemins
    // reportés tout de suite : sans cela, `sentences[].sample` continuerait de désigner
    // l'audio de l'ancienne voix alors que `data.tts` annonce la nouvelle. Caramel s'en
    // remettrait au processeur (qui resynthétise d'après `data.tts`), mais Sucrerie écrit
    // la sortie de l'éditeur TELLE QUELLE — les deux doivent rester cohérents (item 7).
    const data = state.api.getData() || {};
    const sentences = Array.isArray(data.sentences) ? data.sentences : [];
    let touched = false;
    sentences.forEach(s => {
        const text = sentenceText(s);
        if (!text || isManualSample(s.sample) || !isCached(text, false)) return;
        writeTtsPaths(s, text);
        touched = true;
    });
    if (touched) state.api.setData(data);

    decorateSentences();          // appelle refreshPending() en fin de parcours
    setStatus(pendingSentences(data).length === 0
        ? (t('editor_dictation_tts_cached') || 'Déjà généré pour ce réglage : rien à attendre.')
        : '');
}

/** Verrouille les réglages pendant la synthèse et affiche « Annuler ». */
function setBusy(busy) {
    if (!state || !state.panel) return;
    state.busy = busy;
    const p = state.panel;
    p.querySelector('.dt-lang').disabled = busy;
    p.querySelector('.dt-slow').disabled = busy;
    p.querySelector('.dt-regenerate').disabled = busy;
    p.querySelector('.dt-cancel').hidden = !busy;
    if (busy) {
        p.querySelectorAll('.dt-voice').forEach(b => { b.disabled = true; });
        p.querySelector('.dt-pending').hidden = true;
    } else {
        // Restaure le grisage RÉEL des voix (disponibilité par langue), pas un dégrisage aveugle.
        applyCatalog();
        refreshPending();
    }
}

/** Compteur de secondes écoulées — une attente d'une minute sans repère paraît figée. */
function startElapsed(count) {
    if (!state) return;
    state.startedAt = Date.now();
    const tick = () => {
        if (!state || !state.busy) return;
        const s = Math.round((Date.now() - state.startedAt) / 1000);
        setStatus(`${withCount('editor_dictation_tts_generating_n', 'Synthèse de {n} phrase(s)…', count)} ${s}s`, true);
    };
    tick();
    state.elapsedTimer = setInterval(tick, 1000);
}

function stopElapsed() {
    if (!state) return;
    clearInterval(state.elapsedTimer);
    state.elapsedTimer = null;
}

function showFallback(fallback) {
    const fb = state && state.panel && state.panel.querySelector('.dt-fallback');
    setHidden(fb, !fallback);
}

// Phrase en cours de rendu : sert à ranger les URLs blob: créées sous la bonne clé.
let renderingKey = '_';

/**
 * Mémorise une URL blob: SOUS LA CLÉ de la phrase en cours de rendu.
 * Le suivi était global et `decorateSentences` révoquait tout à chaque passage : un bloc
 * qu'on décide de NE PAS reconstruire aurait alors gardé des `<audio>` pointant sur des
 * URLs mortes. On ne révoque donc plus que ce qu'on s'apprête effectivement à remplacer.
 */
function trackUrl(url) {
    const list = state.objectUrls.get(renderingKey) || [];
    list.push(url);
    state.objectUrls.set(renderingKey, list);
    return url;
}

/** Révoque les URLs d'UNE phrase (appelé juste avant de reconstruire son bloc). */
function revokeUrlsFor(key) {
    if (!state) return;
    const list = state.objectUrls.get(key);
    if (!list) return;
    list.forEach(u => { try { URL.revokeObjectURL(u); } catch { /* déjà révoquée */ } });
    state.objectUrls.delete(key);
}

/** Révoque TOUTES les URLs (démontage du panneau). */
function revokeUrls() {
    if (!state) return;
    [...state.objectUrls.keys()].forEach(revokeUrlsFor);
}

/** Source jouable d'un audio TTS (cache) pour le texte courant, ou null. */
function ttsSrc(text, slow) {
    const entry = state.deps.getCachedAudio(text, { lang: state.lang, voice: state.voice, slow });
    return (entry && entry.blob) ? trackUrl(URL.createObjectURL(entry.blob)) : null;
}

/**
 * Nom de fichier lisible pour un téléchargement : « dictee-01-les-trente-glorieuses.mp3 »
 * plutôt que le `dictation-<hash>.mp3` interne, illisible une fois dans le dossier
 * Téléchargements. Accents retirés (NFD) : certains systèmes de fichiers les rendent mal.
 */
function downloadName(idx, text, slow) {
    const slug = String(text || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
    const n = String(idx + 1).padStart(2, '0');
    return `dictee-${n}${slug ? '-' + slug : ''}${slow ? '-lent' : ''}.mp3`;
}

/**
 * Bouton de téléchargement d'une piste. Le `href` est l'URL blob: déjà créée pour le
 * lecteur — aucun octet supplémentaire, et l'attribut `download` impose le nom lisible.
 */
function downloadBtn(src, idx, text, slow) {
    if (!src) return '';
    const title = slow
        ? (t('editor_dictation_download_slow') || 'Télécharger la lecture lente')
        : (t('editor_dictation_download') || 'Télécharger l\'audio');
    return `<a class="dt-sa-dl" href="${src}" download="${escapeText(downloadName(idx, text, slow))}"
               title="${escapeText(title)}" aria-label="${escapeText(title)}"><i class="fas fa-download" aria-hidden="true"></i></a>`;
}

/** Source jouable d'un audio MANUEL (dataURL de l'entrée éditeur, ou blob du .h5p rouvert). */
function manualSrc(sample) {
    const f = Array.isArray(sample) ? sample[0] : sample;
    if (!f || !f.path) return null;
    if (f.dataURL) return f.dataURL;
    const blob = state.deps.getManualAudio && state.deps.getManualAudio(f.path);
    return blob ? trackUrl(URL.createObjectURL(blob)) : null;
}

// =======================================================================
// DÉCORATION PAR PHRASE (intégrée aux items du tableau « Phrases »)
// =======================================================================

/**
 * (Re)place la barre « Synthèse vocale » au bon endroit selon la vue :
 *  - mode maître/détail : EN TÊTE de la section « Informations générales »
 *    (repérée par ses champs `title`/`taskDescription`) — elle est retirée des
 *    autres vues (Phrases, Feedback, Réglages), où les contrôles par phrase
 *    prennent le relais ;
 *  - mode « liste à plat » (harnais, anciens rendus) : au-dessus du conteneur.
 * Le NŒUD est conservé (state.panel) : les écouteurs et l'état survivent aux
 * re-rendus du détail (innerHTML='' ne fait que le détacher).
 */
function placePanel() {
    if (!state || !state.panel) return;
    const detail = state.container.querySelector('.json-editor__detail-content');
    if (detail) {
        const isGeneral = !!detail.querySelector('[data-path="title"], [data-path="taskDescription"]');
        if (isGeneral) {
            if (state.panel.parentElement !== detail) detail.insertBefore(state.panel, detail.firstChild);
        } else if (state.panel.isConnected) {
            state.panel.remove();
        }
        return;
    }
    // Repli « liste à plat » : UNIQUEMENT si le conteneur héberge encore un éditeur rendu
    // (sans cette garde, un panneau survivant à un démontage raté se re-grefferait
    // au-dessus de la preview après la fermeture de l'éditeur).
    if (!state.container.isConnected || !state.container.querySelector('.json-editor')) {
        if (state.panel.isConnected) state.panel.remove();
        return;
    }
    const parent = state.container.parentElement || state.container;
    if (state.panel.parentElement !== parent) parent.insertBefore(state.panel, state.container);
}

/**
 * Hôtes de décoration : `{host, idx, anchor}` par phrase VISIBLE, selon le mode de
 * rendu de l'éditeur.
 *  - Mode « liste à plat » : chaque item du tableau sentences est dans le DOM
 *    (`.json-editor__field--array[data-path="sentences"] > .json-editor__array-item`).
 *  - Mode « maître/détail » (nav à gauche, une phrase à la fois) : AUCUN array-item
 *    n'existe ; le panneau détail rend les champs `data-path="sentences.<i>.…"` de la
 *    phrase courante — l'index se lit sur ce data-path, le bloc s'ancre sous le champ
 *    « Phrase à écrire ».
 */
function sentenceHosts() {
    if (!state) return [];
    const field = state.container.querySelector('.json-editor__field--array[data-path="sentences"]');
    if (field) {
        return [...field.querySelectorAll('.json-editor__array-item')].map(item => {
            const idx = Number(item.dataset.index);
            if (!Number.isFinite(idx)) return null;
            return { host: item.querySelector('.json-editor__array-item-content') || item, idx, anchor: null };
        }).filter(Boolean);
    }
    const detail = state.container.querySelector('.json-editor__detail-content');
    const probe = detail && detail.querySelector('[data-path^="sentences."]');
    const m = probe && /^sentences\.(\d+)\./.exec(probe.dataset.path || '');
    if (!m) return [];
    const idx = Number(m[1]);
    const textField = detail.querySelector(`[data-path="sentences.${idx}.text"]`);
    return [{ host: detail, idx, anchor: textField ? textField.closest('.json-editor__field') : null }];
}

/**
 * (Re)pose le bloc audio dans CHAQUE phrase visible. Idempotent : le bloc existant est
 * mis à jour en place (les lecteurs ne clignotent pas), un bloc manquant est créé.
 */
function decorateSentences() {
    if (!state) return;
    placePanel(); // la barre suit la vue (section générale ↔ autres vues)
    const data = state.api.getData() || {};
    const sentences = Array.isArray(data.sentences) ? data.sentences : [];
    sentenceHosts().forEach(({ host, idx, anchor }) => {
        let block = host.querySelector('.dt-sentence-audio');
        if (!block) {
            block = document.createElement('div');
            block.className = 'dt-sentence-audio';
            if (anchor && anchor.parentElement === host) anchor.insertAdjacentElement('afterend', block);
            else host.appendChild(block);
        }
        renderSentenceBlock(block, idx, sentences[idx]);
    });
    // Le travail restant se recalcule à CHAQUE re-décoration : ajouter une phrase ou en
    // modifier le texte fait donc apparaître tout seul « 1 phrase reste à générer ».
    refreshPending(data);
}

/**
 * Empreinte de tout ce dont dépend le rendu d'un bloc. Deux rendus de même empreinte
 * produisent exactement le même DOM : inutile de le réécrire.
 *
 * `lang`/`voice` en font PARTIE même si les booléens de cache suffisaient à l'affichage :
 * si les deux voix sont en cache, les booléens sont identiques d'une voix à l'autre — sans
 * ces deux champs, basculer Féminine ↔ Masculine ne reconstruirait pas le bloc et le
 * lecteur continuerait de jouer l'ANCIENNE voix.
 */
function blockSignature(idx, sentence) {
    const text = sentenceText(sentence);
    const manual = !!(sentence && isManualSample(sentence.sample));
    const parts = [idx, state.lang, state.voice, state.slow ? 1 : 0, manual ? 'M' : 'T', text];
    if (manual) {
        const f = Array.isArray(sentence.sample) ? sentence.sample[0] : sentence.sample;
        const a = Array.isArray(sentence.sampleAlternative) ? sentence.sampleAlternative[0] : sentence.sampleAlternative;
        parts.push((f && f.path) || '', (f && f.dataURL) ? 'd' : '');
        parts.push(isManualSample(sentence.sampleAlternative) ? ((a && a.path) || '') : '');
    } else if (text) {
        parts.push(isCached(text, false) ? '1' : '0', state.slow ? (isCached(text, true) ? '1' : '0') : '-');
    }
    return parts.join('\u0001');
}

/** Rendu du bloc audio d'UNE phrase (lecteurs / générer / ma voix / retour synthèse). */
function renderSentenceBlock(block, idx, sentence) {
    // Rendu IDEMPOTENT : sans cette sortie, chaque clic sur un réglage détruisait et
    // recréait TOUS les `<audio>` de la dictée, d'où le clignotement (retour d'usage
    // 2026-08-20 : « il y a un FOUC quand je clique sur Masculin et Féminin »).
    const sig = blockSignature(idx, sentence);
    if (block.dataset.index === String(idx) && block.dataset.sig === sig) return;

    const text = sentenceText(sentence);
    const manual = sentence && isManualSample(sentence.sample);

    // Ce bloc-ci va être remplacé : ses anciennes URLs blob: peuvent partir.
    revokeUrlsFor(idx);
    renderingKey = idx;

    // Un dictaphone OUVERT (enregistrement/rognage en cours) survit à la re-décoration :
    // on détache sa zone avant de réécrire le bloc, puis on la remet à la place de la
    // zone fraîche (sinon tout re-rendu de l'éditeur coupe le micro de l'utilisateur).
    const openRecorder = (state.recorders.has(idx) && block.dataset.index === String(idx))
        ? block.querySelector('.dt-sa-recorder')
        : null;
    if (openRecorder) openRecorder.remove();
    block.dataset.index = String(idx);

    if (!text) {
        block.innerHTML = `<span class="dt-missing">${escapeText(t('editor_dictation_write_first') || 'Écrivez d\'abord la phrase pour générer son audio.')}</span>`;
        renderingKey = '_';
        block.dataset.sig = sig;
        return;
    }

    let playersHtml = '';
    if (manual) {
        const src = manualSrc(sentence.sample);
        const altManual = isManualSample(sentence.sampleAlternative) ? manualSrc(sentence.sampleAlternative) : null;
        playersHtml = `
            <span class="dt-manual-badge"><i class="fas fa-user" aria-hidden="true"></i> ${escapeText(t('editor_dictation_manual_badge') || 'Ma voix')}</span>
            ${src ? `<audio controls preload="none" src="${src}"></audio>${downloadBtn(src, idx, text, false)}` : `<span class="dt-missing">${escapeText(t('editor_dictation_manual_unreadable') || 'Audio dans le fichier')}</span>`}
            ${altManual ? `<span class="dt-slow-tag" title="${escapeText(t('editor_dictation_sample_slow') || 'Lecture lente')}"><i class="fas fa-hourglass-half" aria-hidden="true"></i><audio controls preload="none" src="${altManual}"></audio>${downloadBtn(altManual, idx, text, true)}</span>` : ''}
        `;
    } else {
        const srcN = ttsSrc(text, false);
        const srcS = state.slow ? ttsSrc(text, true) : null;
        playersHtml = srcN
            ? `<audio controls preload="none" src="${srcN}" title="${escapeText(t('editor_dictation_sample') || 'Voix normale')}"></audio>
               ${downloadBtn(srcN, idx, text, false)}
               ${state.slow ? (srcS
                    ? `<span class="dt-slow-tag" title="${escapeText(t('editor_dictation_sample_slow') || 'Lecture lente')}"><i class="fas fa-hourglass-half" aria-hidden="true"></i><audio controls preload="none" src="${srcS}"></audio>${downloadBtn(srcS, idx, text, true)}</span>`
                    : `<span class="dt-missing">${escapeText(t('editor_dictation_tts_missing') || 'À générer')}</span>`) : ''}`
            : `<span class="dt-missing">${escapeText(t('editor_dictation_tts_missing') || 'À générer')}</span>`;
    }

    block.innerHTML = `
        <div class="dt-sa-row">
            <span class="dt-sa-players">${playersHtml}</span>
            <span class="dt-sa-actions">
                ${manual
                    ? `<button type="button" class="dt-sa-reset" title="${escapeText(t('editor_dictation_manual_remove_hint') || 'Supprimer « Ma voix » et revenir à la voix de synthèse')}">
                         <i class="fas fa-volume-up" aria-hidden="true"></i> ${escapeText(t('editor_dictation_manual_remove') || 'Voix de synthèse')}
                       </button>`
                    : `<button type="button" class="dt-sa-generate" title="${escapeText(t('editor_dictation_generate_one_hint') || 'Générer l\'audio de cette phrase seulement')}">
                         <i class="fas fa-magic" aria-hidden="true"></i> ${escapeText(t('editor_dictation_generate_one') || 'Générer')}
                       </button>`}
                <button type="button" class="dt-sa-record" title="${escapeText(t('editor_dictation_record_hint') || 'Enregistrer ma propre voix (ou importer un fichier audio)')}">
                    <i class="fas fa-microphone" aria-hidden="true"></i> ${escapeText(t('editor_dictation_record') || 'Ma voix')}
                </button>
            </span>
        </div>
        <div class="dt-sa-recorder" hidden></div>
    `;
    if (openRecorder) block.querySelector('.dt-sa-recorder').replaceWith(openRecorder);

    const genBtn = block.querySelector('.dt-sa-generate');
    if (genBtn) genBtn.addEventListener('click', () => generateOne(idx, block));
    const resetBtn = block.querySelector('.dt-sa-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => resetToTts(idx));
    block.querySelector('.dt-sa-record').addEventListener('click', () => toggleRecorder(idx, block));

    renderingKey = '_';
    block.dataset.sig = sig;
}

// =======================================================================
// ACTIONS
// =======================================================================

/** Synthèse d'UNE SEULE phrase (« générer un seul son à la fois »). */
async function generateOne(idx, block) {
    if (!state || state.busy) return;
    const data = state.api.getData() || {};
    const sentence = Array.isArray(data.sentences) ? data.sentences[idx] : null;
    const text = sentenceText(sentence);
    if (!text) return;
    setBusy(true);
    const btn = block.querySelector('.dt-sa-generate');
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>`; }
    startElapsed(1);
    try {
        const base = { lang: state.lang, voice: state.voice };
        const normal = await state.deps.synthesize([text], { ...base, slow: false });
        if (normal.error) {
            setStatus((t('editor_dictation_tts_error') || 'Échec de la synthèse') + ` (${normal.error})`);
            return;
        }
        let fallback = !!normal.genderFallback;
        if (state.slow) {
            const slowRes = await state.deps.synthesize([text], { ...base, slow: true });
            fallback = fallback || !!(slowRes && slowRes.genderFallback);
        }
        writeTtsPaths(sentence, text);
        state.api.setData(data);
        showFallback(fallback);
        setStatus(t('editor_dictation_tts_done') || 'Audio à jour.');
        decorateSentences();
    } catch (e) {
        setStatus((t('editor_dictation_tts_error') || 'Échec de la synthèse') + (e && e.message ? ` (${e.message})` : ''));
    } finally {
        stopElapsed();
        setBusy(false);
        decorateSentences();
    }
}

/** Synthèse de TOUTES les phrases (le cache écarte celles déjà à jour). */
async function regenerateAll() {
    if (!state || state.busy) return;
    const data = state.api.getData() || {};
    const sentences = Array.isArray(data.sentences) ? data.sentences : [];
    // Les phrases en « Ma voix » sont exclues de la synthèse.
    const targets = sentences.filter(s => sentenceText(s) && !isManualSample(s.sample));
    const texts = targets.map(s => sentenceText(s));
    if (texts.length === 0) {
        setStatus(t('editor_dictation_tts_no_sentence') || 'Aucune phrase à synthétiser.');
        decorateSentences();
        return;
    }
    const pendingCount = pendingSentences().length;
    if (pendingCount === 0) {
        // Tout est déjà en cache : aucun appel réseau ne partira. On le DIT plutôt que de
        // laisser croire à une régénération (c'est le cas de l'aller-retour entre voix).
        targets.forEach(s => writeTtsPaths(s, sentenceText(s)));
        if (!state.slow) {
            sentences.forEach(s => { if (s && !isManualSample(s.sampleAlternative)) delete s.sampleAlternative; });
        }
        state.api.setData(data);
        setStatus(t('editor_dictation_tts_cached') || 'Déjà généré pour ce réglage (aucune attente).');
        decorateSentences();
        return;
    }
    setBusy(true);
    if (state.abort) state.abort.abort();
    state.abort = new AbortController();
    startElapsed(pendingCount);
    try {
        const base = { lang: state.lang, voice: state.voice, signal: state.abort.signal };
        const normal = await state.deps.synthesize(texts, { ...base, slow: false });
        if (normal.error) {
            setStatus(normal.error === 'aborted'
                ? (t('editor_dictation_tts_cancelled') || 'Génération annulée.')
                : (t('editor_dictation_tts_error') || 'Échec de la synthèse') + ` (${normal.error})`);
            decorateSentences();
            return;
        }
        let fallback = !!normal.genderFallback;
        if (state.slow) {
            const slowRes = await state.deps.synthesize(texts, { ...base, slow: true });
            if (slowRes && slowRes.error === 'aborted') {
                setStatus(t('editor_dictation_tts_cancelled') || 'Génération annulée.');
                decorateSentences();
                return;
            }
            fallback = fallback || !!(slowRes && slowRes.genderFallback);
        }
        targets.forEach(s => writeTtsPaths(s, sentenceText(s)));
        // Lecture lente décochée : retirer les pistes lentes TTS restantes.
        if (!state.slow) {
            sentences.forEach(s => { if (s && !isManualSample(s.sampleAlternative)) delete s.sampleAlternative; });
        }
        state.api.setData(data);
        showFallback(fallback);
        setStatus(t('editor_dictation_tts_done') || 'Audio à jour.');
        decorateSentences();
    } catch (e) {
        setStatus((t('editor_dictation_tts_error') || 'Échec de la synthèse') + (e && e.message ? ` (${e.message})` : ''));
    } finally {
        stopElapsed();
        setBusy(false);
    }
}

/** Supprime l'audio « Ma voix » d'une phrase → retour à la voix de synthèse. */
function resetToTts(idx) {
    if (!state) return;
    const data = state.api.getData() || {};
    const sentence = Array.isArray(data.sentences) ? data.sentences[idx] : null;
    if (!sentence) return;
    delete sentence.sample;
    delete sentence.sampleAlternative;
    const text = sentenceText(sentence);
    // Si l'audio TTS est déjà en cache pour ce texte, re-référencer immédiatement ses chemins.
    if (text && state.deps.getCachedAudio(text, { lang: state.lang, voice: state.voice, slow: false })) {
        writeTtsPaths(sentence, text);
    }
    state.api.setData(data);
    decorateSentences();
}

/** Ouvre/ferme le dictaphone sous la phrase (un seul ouvert à la fois). */
function toggleRecorder(idx, block) {
    if (!state) return;
    const zone = block.querySelector('.dt-sa-recorder');
    const existing = state.recorders.get(idx);
    if (existing) {
        existing.destroy();
        state.recorders.delete(idx);
        zone.hidden = true;
        return;
    }
    // Fermer les autres dictaphones ouverts.
    for (const [i, rec] of state.recorders) { rec.destroy(); state.recorders.delete(i); }
    zone.hidden = false;
    // Curseur de vitesse de la piste lente MACHINE (time-stretch de « Ma voix », hauteur
    // préservée) — affiché seulement si « lecture lente » est cochée dans la barre.
    zone.innerHTML = (state.slow ? `
        <div class="dt-rec-slowrate">
            <i class="fas fa-hourglass-half" aria-hidden="true"></i>
            <span>${escapeText(t('editor_dictation_manual_slow_rate') || 'Vitesse de la lecture lente générée')}</span>
            <input type="range" class="dt-rec-slowrate-input" min="0.5" max="0.9" step="0.05" value="${state.slowRate}" />
            <span class="dt-rec-slowrate-val">×${String(state.slowRate).replace('.', ',')}</span>
        </div>` : '') + '<div class="dt-rec-host"></div>';
    const rateInput = zone.querySelector('.dt-rec-slowrate-input');
    if (rateInput) rateInput.addEventListener('input', () => {
        const v = Number(rateInput.value);
        state.slowRate = (v >= 0.5 && v <= 0.9) ? v : 0.7;
        const val = zone.querySelector('.dt-rec-slowrate-val');
        if (val) val.textContent = '×' + String(state.slowRate).replace('.', ',');
        persistSettings();
    });
    const recHost = zone.querySelector('.dt-rec-host');
    import('./audio-recorder-widget.js').then(m => {
        if (!state) return;
        const rec = m.mountAudioRecorder(recHost, {
            onConfirm: async (file) => {
                try {
                    await useManualAudio(idx, file);
                } finally {
                    const r = state && state.recorders.get(idx);
                    if (r) { r.destroy(); state.recorders.delete(idx); }
                    if (zone) zone.hidden = true;
                }
            },
            onCancel: () => {
                state && state.recorders.delete(idx);
                zone.hidden = true;
            }
        });
        state.recorders.set(idx, rec);
    }).catch(() => { zone.hidden = true; });
}

/** Variante RALENTIE d'un fichier « Ma voix » (WAV time-stretché à ×state.slowRate). */
async function makeSlowVariant(file) {
    const m = await import('./audio-recorder-widget.js');
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    try {
        const buf = await ctx.decodeAudioData(await file.arrayBuffer());
        const stretch = 1 / (state.slowRate || 0.7);
        const blob = m.audioBufferToSlowWavBlob(buf, stretch);
        return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '-lent.wav', { type: 'audio/wav' });
    } finally {
        try { ctx.close(); } catch { /* déjà fermé */ }
    }
}

/** Enregistre un fichier « Ma voix » (WAV rogné ou import universel) sur une phrase. */
async function useManualAudio(idx, file) {
    if (!state || !state.deps.processAudioFile || !state.deps.registerMedia) return;
    const data = state.api.getData() || {};
    const sentence = Array.isArray(data.sentences) ? data.sentences[idx] : null;
    if (!sentence) return;
    try {
        const entry = await state.deps.processAudioFile(file);
        state.deps.registerMedia(`sentences.${idx}.sample`, entry);
        sentence.sample = { path: entry.h5pPath, mime: entry.mime, kind: 'audio', dataURL: entry.dataURL };
        // Piste LENTE de « Ma voix » : générée PAR LA MACHINE (time-stretch WSOLA, hauteur
        // préservée — cf. audio-recorder-widget) à la vitesse du curseur. Jamais de mélange
        // avec la voix de synthèse : lecture lente décochée (ou décodage impossible) → pas
        // de piste lente du tout.
        delete sentence.sampleAlternative;
        if (state.slow) {
            try {
                const slowFile = await makeSlowVariant(file);
                const slowEntry = await state.deps.processAudioFile(slowFile);
                state.deps.registerMedia(`sentences.${idx}.sampleAlternative`, slowEntry);
                sentence.sampleAlternative = { path: slowEntry.h5pPath, mime: slowEntry.mime, kind: 'audio', dataURL: slowEntry.dataURL };
            } catch { /* format non décodable : voix normale seule */ }
        }
        state.api.setData(data);
        setStatus(t('editor_dictation_manual_saved') || 'Votre voix a été enregistrée pour cette phrase.');
        decorateSentences();
    } catch (e) {
        setStatus((t('editor_dictation_tts_error') || 'Échec') + (e && e.message ? ` (${e.message})` : ''));
    }
}

/** Démonte barre + décorations + dictaphones (appelé par destroyEditor de l'hôte). */
export function destroyDictationTtsPanel() {
    if (!state) return;
    if (state.abort) { try { state.abort.abort(); } catch { /* déjà annulé */ } }
    for (const rec of state.recorders.values()) { try { rec.destroy(); } catch { /* déjà détruit */ } }
    state.recorders.clear();
    clearInterval(state.elapsedTimer);
    if (state.observer) state.observer.disconnect();
    if (state.container && state._onEditorInput) state.container.removeEventListener('input', state._onEditorInput);
    clearTimeout(state.resyncTimer);
    revokeUrls();
    if (state.panel && state.panel.parentElement) state.panel.remove();
    state.container?.querySelectorAll('.dt-sentence-audio').forEach(el => el.remove());
    state = null;
}
