/**
 * Panneau éditeur « Vidéo interactive » (Caramel — partagé éditeur, cf. CLAUDE.md item 7).
 *
 * S'ajoute AU-DESSUS de l'éditeur JSON standard quand l'activité est une vidéo interactive.
 * Deux modes, basculés par un segmented control :
 *
 *   • PLAN (défaut) — l'éditeur master-detail classique, SANS vidéo : liste chronologique des
 *     questions + formulaire complet. Léger, tient dans toute hauteur. Aucune vidéo chargée.
 *
 *   • LIVE — CÔTE-À-CÔTE : lecteur (YouTube embed OU <video> PeerTube/PodEduc) + timeline à repères
 *     en colonne GAUCHE ; l'éditeur (détail) à DROITE (nav masquée par la classe `iv-mode-live` sur
 *     le parent). Pendant la lecture, la question de l'instant remonte automatiquement dans le détail
 *     (bouton « Suivre la lecture »). La timeline porte un repère par question PLUS un repère « Résumé
 *     final » en bout (le résumé H5P s'affiche à la fin de la vidéo) → clic = édition du résumé.
 *
 * Construction (volontairement non invasive) :
 *   - Panneau inséré comme FRÈRE du conteneur → survit aux re-rendus qui réécrivent `container.innerHTML`.
 *   - Le mode LIVE ne réimplémente AUCUN champ : il pilote la sélection de l'éditeur existant en
 *     « cliquant » les boutons de nav (sous-items `data-index` pour les questions ; bouton de la section
 *     `data-section-id="summary"` pour le résumé) → chemin réel `navigateTo`, qui sauvegarde les saisies
 *     avant de basculer.
 *   - Tout le CSS vit dans css/base/style.css (chargé) → aucun FOUC.
 *
 * @module editor/interactive-video-panel
 */
import { t } from '../core/translation.js';
import { createVideoPlayer } from '../ui/sync-video-player.js';

const PANEL_CLASS = 'iv-editor-panel';
const LIVE_CLASS = 'iv-mode-live';
const INTERACTIONS_SECTION = 'interactions';
const SUMMARY_SECTION = 'summary';
const SUMMARY_ACTIVE = -2; // sentinelle « le repère résumé est sélectionné »

// Un seul lecteur vivant à la fois : détruit au montage suivant et à la sortie du mode Live.
let activePlayer = null;

function fmtClock(s) {
    s = Math.max(0, Math.floor(Number(s) || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function destroyActivePlayer() {
    if (activePlayer) { try { activePlayer.destroy(); } catch { /* déjà détruit */ } activePlayer = null; }
}
function escapeText(s) {
    // Échappe AUSSI `"` et `'` : ces valeurs finissent en attribut (title=…, value=…)
    // dans les gabarits de ce panneau, où `& < >` seuls ne suffisent pas.
    // Table alignée sur `js/core/escape.js` ; recopiée ici volontairement car ce
    // fichier est byte-identique côté Sucrerie (pas de dépendance inter-dépôts).
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
function stripHtml(s) {
    return String(s == null ? '' : s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Monte (ou remonte) le panneau vidéo au-dessus de l'éditeur.
 * @param {HTMLElement} container - Conteneur de l'éditeur JSON.
 * @param {{getData:Function, setData:Function, rerender:Function}} api
 */
export function mountInteractiveVideoPanel(container, api) {
    if (!container || !api) return;
    const parent = container.parentElement || container;

    destroyActivePlayer();
    parent.classList.remove(LIVE_CLASS);
    const existing = parent.querySelector(`.${PANEL_CLASS}`);
    if (existing) existing.remove();

    const data = (api.getData && api.getData()) || {};
    const videoSource = data.videoSource || {};
    const url = videoSource.url;

    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;

    if (!url) {
        panel.innerHTML = `<p class="iv-editor-novideo">${escapeText(t('editor_iv_no_video'))}</p>`;
        parent.insertBefore(panel, container);
        return;
    }

    const L = {
        plan: t('editor_iv_mode_plan'), live: t('editor_iv_mode_live'),
        planHint: t('editor_iv_mode_plan_hint'), liveHint: t('editor_iv_mode_live_hint'),
        capture: t('editor_iv_capture'), follow: t('editor_iv_follow'),
        timeline: t('editor_iv_timeline'), summary: t('editor_iv_section_summary')
    };

    panel.innerHTML = `
        <div class="iv-modebar">
            <div class="iv-seg" role="tablist" aria-label="${escapeText(L.plan)} / ${escapeText(L.live)}">
                <button type="button" class="iv-modebtn is-active" data-mode="plan" role="tab" aria-selected="true">
                    <i class="fas fa-list-ul" aria-hidden="true"></i><span>${escapeText(L.plan)}</span>
                </button>
                <button type="button" class="iv-modebtn" data-mode="live" role="tab" aria-selected="false">
                    <i class="fas fa-film" aria-hidden="true"></i><span>${escapeText(L.live)}</span>
                </button>
            </div>
            <span class="iv-modehint">${escapeText(L.planHint)}</span>
        </div>
        <div class="iv-live" hidden>
            <div class="iv-editor-media"></div>
            <div class="iv-live-bar">
                <span class="iv-live-clock" aria-live="off">0:00</span>
                <div class="iv-live-timeline" role="slider" aria-label="${escapeText(L.timeline)}" tabindex="0">
                    <span class="iv-live-playhead"></span>
                </div>
            </div>
            <div class="iv-live-actions">
                <button type="button" class="action-btn primary-btn iv-live-capture">
                    <i class="fas fa-plus" aria-hidden="true"></i> ${escapeText(L.capture)}
                </button>
                <button type="button" class="iv-follow-btn is-on" aria-pressed="true" title="${escapeText(L.follow)}">
                    <i class="fas fa-magnet" aria-hidden="true"></i> <span>${escapeText(L.follow)}</span>
                </button>
            </div>
        </div>
    `;
    parent.insertBefore(panel, container);

    const planBtn = panel.querySelector('.iv-modebtn[data-mode="plan"]');
    const liveBtn = panel.querySelector('.iv-modebtn[data-mode="live"]');
    const modeHint = panel.querySelector('.iv-modehint');
    const liveWrap = panel.querySelector('.iv-live');
    const media = panel.querySelector('.iv-editor-media');
    const clockEl = panel.querySelector('.iv-live-clock');
    const timeline = panel.querySelector('.iv-live-timeline');
    const playhead = panel.querySelector('.iv-live-playhead');
    const captureBtn = panel.querySelector('.iv-live-capture');
    const followBtn = panel.querySelector('.iv-follow-btn');

    let mode = 'plan';
    let duration = 0;
    let lastTime = 0;
    let liveActive = -1;
    let follow = true;

    const getData = () => (api.getData && api.getData()) || {};
    const getInteractions = () => { const d = getData(); return Array.isArray(d.interactions) ? d.interactions : []; };
    const hasSummary = () => { const s = getData().summary; return !!(s && Array.isArray(s.statements) && s.statements.length); };
    const tsOf = (it) => Math.max(0, Number(it && it.timestamp) || 0);

    // ---- lecteur ----
    const ensurePlayer = () => {
        if (activePlayer) return;
        // Ceinture : le conteneur doit être vide avant de monter un lecteur (le destroy()
        // du lecteur retire déjà son élément, mais aucun média mort ne doit pouvoir s'empiler).
        media.replaceChildren();
        activePlayer = createVideoPlayer(media, videoSource, {
            onReady: () => {
                duration = (activePlayer && activePlayer.getDuration && activePlayer.getDuration()) || 0;
                renderTimeline();
            },
            onTime: (s) => onTime(s)
        });
    };
    const seek = (s) => { if (activePlayer && activePlayer.seekTo) activePlayer.seekTo(s); };
    const getTime = () => (activePlayer && activePlayer.getCurrentTime ? activePlayer.getCurrentTime() : 0);

    // ---- sélection (clic des boutons de nav réels) ----
    const clickNav = (selector) => { const el = parent.querySelector(selector); if (el) el.click(); };
    const selectInteraction = (index) => {
        liveActive = index; markActiveMarker();
        clickNav(`.json-editor__nav-items[data-section-id="${INTERACTIONS_SECTION}"] .json-editor__nav-subitem[data-index="${index}"]`);
    };
    const selectSummary = () => {
        liveActive = SUMMARY_ACTIVE; markActiveMarker();
        clickNav(`.json-editor__nav-section[data-section-id="${SUMMARY_SECTION}"] .json-editor__nav-item`);
    };
    const activeIndexAt = (time) => {
        let idx = -1, best = -1;
        getInteractions().forEach((it, i) => { const v = tsOf(it); if (v <= time + 0.4 && v >= best) { best = v; idx = i; } });
        return idx;
    };

    // ---- timeline ----
    function renderTimeline() {
        timeline.querySelectorAll('.iv-live-mk').forEach(m => m.remove());
        if (duration > 0) {
            getInteractions().forEach((it, i) => {
                const mk = document.createElement('button');
                mk.type = 'button';
                mk.className = 'iv-live-mk';
                mk.dataset.index = String(i);
                mk.style.left = `${100 * tsOf(it) / duration}%`;
                mk.title = `${fmtClock(tsOf(it))} — ${stripHtml(it.question || it.text || '')}`;
                mk.addEventListener('click', (e) => { e.stopPropagation(); seek(tsOf(it)); selectInteraction(i); });
                timeline.appendChild(mk);
            });
        }
        // Repère « Résumé final » en bout de timeline (indépendant de la durée : il s'affiche à la fin).
        if (hasSummary()) {
            const mk = document.createElement('button');
            mk.type = 'button';
            mk.className = 'iv-live-mk iv-live-mk--summary';
            mk.dataset.summary = '1';
            mk.title = L.summary;
            mk.innerHTML = '<i class="fas fa-flag-checkered" aria-hidden="true"></i>';
            mk.addEventListener('click', (e) => { e.stopPropagation(); selectSummary(); });
            timeline.appendChild(mk);
        }
        markActiveMarker();
    }
    function markActiveMarker() {
        timeline.querySelectorAll('.iv-live-mk').forEach(m => {
            const on = m.dataset.summary ? (liveActive === SUMMARY_ACTIVE) : (Number(m.dataset.index) === liveActive);
            m.classList.toggle('is-active', on);
        });
    }
    timeline.addEventListener('click', (e) => {
        if (duration <= 0) return;
        const r = timeline.getBoundingClientRect();
        seek(Math.max(0, (e.clientX - r.left) / r.width) * duration);
    });

    // ---- suivi de lecture (bouton-bascule) ----
    followBtn.addEventListener('click', () => {
        follow = !follow;
        followBtn.classList.toggle('is-on', follow);
        followBtn.setAttribute('aria-pressed', String(follow));
    });

    const isEditingDetail = () => {
        const a = document.activeElement;
        return !!(a && container.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    };

    function onTime(s) {
        s = Number(s) || 0;
        clockEl.textContent = fmtClock(s);
        if (duration > 0) playhead.style.left = `${100 * s / duration}%`;
        const playing = s > lastTime + 0.05;
        lastTime = s;
        if (mode === 'live' && playing && follow && !isEditingDetail()) {
            const idx = activeIndexAt(s);
            if (idx >= 0 && idx !== liveActive) selectInteraction(idx);
        }
    }

    // ---- capture ----
    captureBtn.addEventListener('click', () => {
        const d = getData();
        if (!Array.isArray(d.interactions)) d.interactions = [];
        const item = {
            timestamp: Math.round(getTime()),
            pause: true,
            type: 'multichoice',
            question: '',
            answers: [
                { text: '', correct: true, feedback: '' },
                { text: '', correct: false, feedback: '' }
            ],
            display: 'button',
            placement: 'center'
        };
        d.interactions.push(item);
        d.interactions.sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
        if (api.setData) api.setData(d);
        if (api.rerender) api.rerender();
        renderTimeline();
        const newIndex = d.interactions.indexOf(item);
        if (newIndex >= 0) {
            selectInteraction(newIndex);
            requestAnimationFrame(() => {
                const f = container.querySelector('.json-editor__detail textarea, .json-editor__detail input[type="text"]');
                if (f) f.focus();
            });
        }
    });

    // ---- bascule de mode ----
    function setMode(m) {
        mode = m;
        const live = m === 'live';
        planBtn.classList.toggle('is-active', !live);
        planBtn.setAttribute('aria-selected', String(!live));
        liveBtn.classList.toggle('is-active', live);
        liveBtn.setAttribute('aria-selected', String(live));
        liveWrap.hidden = !live;
        parent.classList.toggle(LIVE_CLASS, live);
        modeHint.textContent = live ? L.liveHint : L.planHint;
        if (live) {
            ensurePlayer();
            renderTimeline();
            const its = getInteractions();
            if (its.length) { const a = activeIndexAt(getTime()); selectInteraction(a >= 0 ? a : 0); }
        } else {
            destroyActivePlayer();
            duration = 0; lastTime = 0; liveActive = -1;
        }
    }
    planBtn.addEventListener('click', () => setMode('plan'));
    liveBtn.addEventListener('click', () => setMode('live'));
}

/**
 * Détruit le lecteur encore vivant (seul état persistant du panneau). À appeler quand l'éditeur se
 * ferme SANS remontage ultérieur — sinon le timer de sondage YouTube et l'élément média fuiteraient.
 */
export function destroyInteractiveVideoPanel() {
    destroyActivePlayer();
}
