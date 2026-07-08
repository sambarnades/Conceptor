/**
 * Panneau éditeur « Image interactive » (Caramel — partagé éditeur, cf. CLAUDE.md item 7).
 *
 * S'ajoute AU-DESSUS de l'éditeur JSON standard quand l'activité est une « Image interactive »
 * (H5P.ImageHotspots). Deux modes, basculés par un segmented control — calqués sur le panneau
 * Vidéo interactive (js/editor/interactive-video-panel.js) :
 *
 *   • PLAN (défaut) — l'éditeur master-detail classique : liste des points + formulaire complet.
 *
 *   • SUR L'IMAGE (live) — CÔTE-À-CÔTE : l'image de fond affichée EN GRAND à GAUCHE avec les points
 *     superposés (pastilles numérotées colorées par `globalColor`) ; le formulaire du point sélectionné
 *     à DROITE (nav masquée par la classe `ih-mode-live` sur le parent). On peut :
 *       - GLISSER un point → ses coordonnées x/y (en %) se recalculent en direct depuis la position
 *         du curseur sur l'image (centre du point = position) ;
 *       - cliquer « Ajouter un point » puis cliquer sur l'image → crée un point à cet endroit exact ;
 *       - sélectionner un point (clic) → son formulaire s'affiche à droite ;
 *       - supprimer le point sélectionné via la croix de son marqueur.
 *
 * Construction (volontairement non invasive, identique au panneau vidéo) :
 *   - Panneau inséré comme FRÈRE du conteneur → survit aux re-rendus qui réécrivent `container.innerHTML`.
 *   - Le mode live ne réimplémente AUCUN champ : il pilote la sélection de l'éditeur existant en
 *     « cliquant » les sous-items de nav (`data-index`) → chemin réel `navigateTo` (qui sauvegarde les
 *     saisies avant de basculer). Le déplacement écrit dans les inputs `data-path="hotspots.N.x|y"`
 *     (dispatch d'un évènement `input`) → la donnée canonique de l'éditeur reste la source de vérité,
 *     SANS re-render lourd pendant le glissement.
 *   - Tout le CSS vit dans css/base/style.css (chargé) → aucun FOUC.
 *
 * @module editor/interactive-image-panel
 */
import { t } from '../core/translation.js';
import { getImage } from '../h5p/image-manager.js';
import { showConfirm } from './array-manager.js';

const PANEL_CLASS = 'ih-editor-panel';
const LIVE_CLASS = 'ih-mode-live';
const HOTSPOTS_SECTION = 'hotspots';

// État persistant minimal (pour le nettoyage à la fermeture de l'éditeur).
let activeContainer = null;
let activeParent = null;
let activeOnInput = null;

function escapeText(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function stripHtml(s) {
    return String(s == null ? '' : s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
/** Borne une valeur en pourcentage [0,100] (défaut 0 si non finie). */
function clampPct(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}
/** Arrondit à 0,1 % (pas du champ number x/y). */
function round1(v) {
    return Math.round(clampPct(v) * 10) / 10;
}
/** Borne une taille de zone en pourcentage [1,100] (défaut 20 si non finie — défaut du schéma). */
function clampSize(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return 20;
    return Math.max(1, Math.min(100, n));
}
/** Arrondit une taille de zone à 0,1 % (pas du champ number width/height). */
function roundSize(v) {
    return Math.round(clampSize(v) * 10) / 10;
}

/**
 * Monte (ou remonte) le panneau image au-dessus de l'éditeur.
 * @param {HTMLElement} container - Conteneur de l'éditeur JSON.
 * @param {{getData:Function, setData:Function, rerender:Function}} api
 * @param {Object} [opts] - Variante d'activité (défauts = « Image interactive ») :
 *   - {string} [titleField='header'] : champ de l'item servant de titre (aria-label des marqueurs) ;
 *   - {Function} [newItem] : (x,y) → item ajouté par le placement sur l'image ;
 *   - {Function} [markerColor] : (hotspot, data) → couleur du marqueur (défaut : globalColor) ;
 *   - {boolean} [sizedZones=false] : dessine chaque point comme une ZONE À TAILLE RÉELLE (ellipse ou
 *     rectangle selon `figure`, width/height en % de l'image, positionnée par son CENTRE) avec une
 *     poignée de redimensionnement en bas-droite (synchro live des inputs width/height, comme x/y).
 *     Glisser, flèches, placement et redimensionnement sont BORNÉS pour que la zone reste entière
 *     dans l'image (même règle que le clamp des coins à l'export — WYSIWYG, pas de débordement).
 *   Utilisé par les « questions hotspot » (Find the Hotspot / Find Multiple Hotspots), dont les
 *   items sont {label, correct, x, y, width, height, figure, feedbackText} avec x/y = CENTRES en %.
 *   L'« Image interactive » (points ponctuels) garde les pastilles classiques.
 */
export function mountInteractiveImagePanel(container, api, opts = {}) {
    if (!container || !api) return;
    const parent = container.parentElement || container;
    const cfg = {
        titleField: opts.titleField || 'header',
        newItem: opts.newItem || ((x, y) => ({ header: '', x, y, content: [{ _contentType: 'text', text: '' }] })),
        markerColor: (typeof opts.markerColor === 'function') ? opts.markerColor : null,
        sizedZones: opts.sizedZones === true
    };

    // Nettoyer un éventuel montage précédent (listener + classe + panneau).
    destroyInteractiveImagePanel();
    parent.classList.remove(LIVE_CLASS);
    const existing = parent.querySelector(`.${PANEL_CLASS}`);
    if (existing) existing.remove();

    const L = {
        plan: t('editor_ih_mode_plan'), live: t('editor_ih_mode_live'),
        planHint: t('editor_ih_mode_plan_hint'), liveHint: t('editor_ih_mode_live_hint'),
        add: t('editor_ih_add_hotspot'), cancel: t('editor_ih_place_cancel'),
        placeHint: t('editor_ih_place_hint'), noImage: t('editor_ih_no_image'),
        markerTitle: t('editor_ih_marker_title'), del: t('editor_delete')
    };

    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
        <div class="ih-modebar">
            <div class="ih-seg" role="tablist" aria-label="${escapeText(L.live)} / ${escapeText(L.plan)}">
                <button type="button" class="ih-modebtn is-active" data-mode="live" role="tab" aria-selected="true">
                    <i class="fas fa-location-dot" aria-hidden="true"></i><span>${escapeText(L.live)}</span>
                </button>
                <button type="button" class="ih-modebtn" data-mode="plan" role="tab" aria-selected="false">
                    <i class="fas fa-list-ul" aria-hidden="true"></i><span>${escapeText(L.plan)}</span>
                </button>
            </div>
            <span class="ih-modehint"></span>
        </div>
        <div class="ih-live" hidden>
            <div class="ih-live-toolbar">
                <button type="button" class="action-btn primary-btn ih-add-point" aria-pressed="false">
                    <i class="fas fa-plus" aria-hidden="true"></i> <span class="ih-add-label">${escapeText(L.add)}</span>
                </button>
                <span class="ih-live-hint">${escapeText(L.liveHint)}</span>
            </div>
            <div class="ih-stage">
                <div class="ih-stage-wrap">
                    <img class="ih-stage-img" alt="" draggable="false">
                    <div class="ih-markers"></div>
                </div>
            </div>
            <p class="ih-editor-noimage" hidden>${escapeText(L.noImage)}</p>
        </div>
    `;
    parent.insertBefore(panel, container);

    const planBtn = panel.querySelector('.ih-modebtn[data-mode="plan"]');
    const liveBtn = panel.querySelector('.ih-modebtn[data-mode="live"]');
    const modeHint = panel.querySelector('.ih-modehint');
    const liveWrap = panel.querySelector('.ih-live');
    const toolbar = panel.querySelector('.ih-live-toolbar');
    const addBtn = panel.querySelector('.ih-add-point');
    const addLabel = panel.querySelector('.ih-add-label');
    const liveHint = panel.querySelector('.ih-live-hint');
    const stage = panel.querySelector('.ih-stage');
    const wrap = panel.querySelector('.ih-stage-wrap');
    const img = panel.querySelector('.ih-stage-img');
    const markersEl = panel.querySelector('.ih-markers');
    const noImageEl = panel.querySelector('.ih-editor-noimage');

    let mode = 'live';
    let activeIndex = -1;
    let placing = false;
    let drag = null;          // { idx, moved, pid, el }
    let resize = null;        // { idx, pid, el, mk } — redimensionnement par la poignée (zones)
    let suppressSync = false; // évite la boucle drag → input → marqueur

    const getData = () => (api.getData && api.getData()) || {};
    const getHotspots = () => { const d = getData(); return Array.isArray(d.hotspots) ? d.hotspots : []; };
    const globalColor = () => { const c = getData().globalColor; return (typeof c === 'string' && c) ? c : '#981d99'; };
    /** Couleur d'un marqueur : variante d'activité (ex. vert/rouge selon `correct`) ou couleur globale. */
    const markerColor = (h) => (cfg.markerColor ? (cfg.markerColor(h, getData()) || globalColor()) : globalColor());

    /** URL affichable de l'image de fond : d'abord la donnée (réhydratée), sinon le registre image. */
    const getBgUrl = () => {
        const d = getData();
        if (d.image && typeof d.image === 'object' && d.image.dataURL) return d.image.dataURL;
        const e = getImage('image');
        return (e && e.dataURL) || '';
    };

    /** Position du curseur → pourcentage [0,100] relatif à la boîte de l'image (= conteneur des marqueurs). */
    const pointToPct = (clientX, clientY) => {
        const r = wrap.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        return {
            x: clampPct((clientX - r.left) / r.width * 100),
            y: clampPct((clientY - r.top) / r.height * 100)
        };
    };

    const positionMarker = (mk, x, y) => { mk.style.left = `${clampPct(x)}%`; mk.style.top = `${clampPct(y)}%`; };

    // ---- sélection (pilote la nav réelle de l'éditeur) ----
    const clickNav = (index) => {
        const el = container.querySelector(
            `.json-editor__nav-items[data-section-id="${HOTSPOTS_SECTION}"] .json-editor__nav-subitem[data-index="${index}"]`
        );
        if (el) el.click();
    };
    const selectHotspot = (index) => {
        const hs = getHotspots();
        if (index == null || index < 0 || index >= hs.length) return;
        activeIndex = index;
        clickNav(index);
        updateActiveMarker();
    };

    // ---- inputs du détail (source de vérité des coordonnées) ----
    const detailInput = (index, axis) =>
        container.querySelector(`.json-editor__detail input[data-path="hotspots.${index}.${axis}"]`);

    /** Écrit une valeur dans l'input détail `hotspots.N.<field>` et notifie l'éditeur (input + change si commit). */
    const syncField = (index, field, value) => {
        const el = detailInput(index, field);
        if (!el) return;
        el.value = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const commitField = (index, field) => {
        const el = detailInput(index, field);
        if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    /** Écrit x/y dans les inputs du point sélectionné et notifie l'éditeur (input + change si commit). */
    const syncInputs = (index, x, y, commit) => {
        suppressSync = true;
        syncField(index, 'x', round1(x));
        syncField(index, 'y', round1(y));
        if (commit) { commitField(index, 'x'); commitField(index, 'y'); }
        suppressSync = false;
    };
    /** Idem pour width/height (redimensionnement des zones à taille réelle). */
    const syncSizeInputs = (index, w, h, commit) => {
        suppressSync = true;
        syncField(index, 'width', roundSize(w));
        syncField(index, 'height', roundSize(h));
        if (commit) { commitField(index, 'width'); commitField(index, 'height'); }
        suppressSync = false;
    };

    /**
     * Centre borné pour qu'une zone à taille réelle reste ENTIÈRE dans l'image (pas de
     * débordement : même règle que le clamp des coins à l'export, WYSIWYG). Pastilles
     * ponctuelles (Image interactive) : bornage classique [0,100] inchangé.
     */
    const clampCenterToZone = (v, size) => {
        if (!cfg.sizedZones) return clampPct(v);
        const s = clampSize(size);
        if (s >= 100) return 50;
        return Math.max(s / 2, Math.min(100 - s / 2, clampPct(v)));
    };

    /** Applique la géométrie « zone à taille réelle » au marqueur (taille en % de l'image + forme). */
    const applyZoneStyle = (mk, h) => {
        if (!cfg.sizedZones) return;
        mk.style.width = `${roundSize(h && h.width)}%`;
        mk.style.height = `${roundSize(h && h.height)}%`;
        mk.classList.toggle('ih-mk--rect', !!h && h.figure === 'rectangle');
    };

    // ---- marqueurs ----
    function makeDelBtn(index) {
        const del = document.createElement('span');
        del.className = 'ih-mk-del';
        del.setAttribute('role', 'button');
        del.setAttribute('tabindex', '0');
        del.setAttribute('aria-label', L.del);
        del.title = L.del;
        del.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        del.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
        del.addEventListener('click', (e) => { e.stopPropagation(); deletePoint(index); });
        del.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); deletePoint(index); }
        });
        return del;
    }

    function makeMarker(index, h, number) {
        const mk = document.createElement('div');
        mk.className = 'ih-mk';
        mk.dataset.index = String(index);
        mk.setAttribute('role', 'button');
        mk.setAttribute('tabindex', '0');
        mk.title = L.markerTitle;
        mk.setAttribute('aria-label', `${number}. ${stripHtml(h[cfg.titleField] || '')}`.trim());
        mk.style.setProperty('--ih-color', markerColor(h));
        positionMarker(mk, h.x, h.y);
        mk.innerHTML = `<span class="ih-mk-num">${number}</span>`;

        // Glisser-déposer (Pointer Events, capture sur le marqueur).
        mk.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.ih-mk-del')) return;
            if (placing) return;
            e.preventDefault();
            const idx = Number(mk.dataset.index);
            selectHotspot(idx);
            drag = { idx, moved: false, pid: e.pointerId, el: mk };
            try { mk.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
            mk.classList.add('is-dragging');
        });
        mk.addEventListener('pointermove', (e) => {
            if (!drag || drag.el !== mk || drag.pid !== e.pointerId) return;
            const p = pointToPct(e.clientX, e.clientY);
            if (!p) return;
            drag.moved = true;
            const zx = clampCenterToZone(p.x, parseFloat(mk.style.width));
            const zy = clampCenterToZone(p.y, parseFloat(mk.style.height));
            positionMarker(mk, zx, zy);
            syncInputs(drag.idx, zx, zy, false);
        });
        const endDrag = (e) => {
            if (!drag || drag.el !== mk) return;
            try { mk.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
            mk.classList.remove('is-dragging');
            if (drag.moved) syncInputs(drag.idx, parseFloat(mk.style.left), parseFloat(mk.style.top), true);
            drag = null;
        };
        mk.addEventListener('pointerup', endDrag);
        mk.addEventListener('pointercancel', endDrag);

        // Variante « zone à taille réelle » : géométrie réelle + poignée de redimensionnement.
        if (cfg.sizedZones) {
            mk.classList.add('ih-mk--zone');
            applyZoneStyle(mk, h);
            mk.appendChild(makeResizeHandle(mk));
        }

        // Clavier : Entrée = sélectionner, Suppr = supprimer, flèches = ajuster (Maj = pas de 5 %).
        mk.addEventListener('keydown', (e) => {
            const idx = Number(mk.dataset.index);
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectHotspot(idx); return; }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deletePoint(idx); return; }
            const step = e.shiftKey ? 5 : 1;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft') dx = -step;
            else if (e.key === 'ArrowRight') dx = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'ArrowDown') dy = step;
            else return;
            e.preventDefault();
            selectHotspot(idx);
            const nx = clampCenterToZone(parseFloat(mk.style.left) + dx, parseFloat(mk.style.width));
            const ny = clampCenterToZone(parseFloat(mk.style.top) + dy, parseFloat(mk.style.height));
            positionMarker(mk, nx, ny);
            syncInputs(idx, nx, ny, true);
        });

        return mk;
    }

    /**
     * Poignée de redimensionnement (bas-droite) d'un marqueur-zone. Le point étant positionné par
     * son CENTRE, la demi-taille suit le curseur symétriquement ; les inputs width/height du détail
     * sont synchronisés en direct (input) puis committés au relâchement (change), comme x/y.
     */
    function makeResizeHandle(mk) {
        const rz = document.createElement('span');
        rz.className = 'ih-mk-rsz';
        rz.setAttribute('aria-hidden', 'true');
        rz.addEventListener('pointerdown', (e) => {
            if (placing) return;
            e.preventDefault();
            e.stopPropagation(); // ne pas déclencher le glisser-déplacer du marqueur parent
            const idx = Number(mk.dataset.index);
            selectHotspot(idx);
            resize = { idx, pid: e.pointerId, el: rz, mk };
            try { rz.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
            mk.classList.add('is-resizing');
        });
        rz.addEventListener('pointermove', (e) => {
            if (!resize || resize.el !== rz || resize.pid !== e.pointerId) return;
            const r = wrap.getBoundingClientRect();
            if (!r.width || !r.height) return;
            const cxPct = parseFloat(mk.style.left);
            const cyPct = parseFloat(mk.style.top);
            const cx = r.left + (cxPct / 100) * r.width;
            const cy = r.top + (cyPct / 100) * r.height;
            // Taille plafonnée par le bord le plus proche : la zone (centrée) reste dans l'image.
            const w = Math.min(roundSize((e.clientX - cx) * 2 / r.width * 100), roundSize(2 * Math.min(cxPct, 100 - cxPct)));
            const h = Math.min(roundSize((e.clientY - cy) * 2 / r.height * 100), roundSize(2 * Math.min(cyPct, 100 - cyPct)));
            mk.style.width = `${w}%`;
            mk.style.height = `${h}%`;
            syncSizeInputs(resize.idx, w, h, false);
        });
        const endResize = (e) => {
            if (!resize || resize.el !== rz) return;
            try { rz.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
            mk.classList.remove('is-resizing');
            syncSizeInputs(resize.idx, parseFloat(mk.style.width), parseFloat(mk.style.height), true);
            resize = null;
        };
        rz.addEventListener('pointerup', endResize);
        rz.addEventListener('pointercancel', endResize);
        return rz;
    }

    function renderMarkers() {
        markersEl.innerHTML = '';
        const hs = getHotspots();
        hs.forEach((h, i) => {
            const mk = makeMarker(i, h, i + 1);
            mk.style.setProperty('--ih-color', markerColor(h));
            markersEl.appendChild(mk);
        });
        updateActiveMarker();
    }

    /** Met à jour l'état actif SANS recréer les marqueurs (préserve la capture pointeur d'un glissement). */
    function updateActiveMarker() {
        const canDelete = getHotspots().length > 1;
        markersEl.querySelectorAll('.ih-mk').forEach((mk) => {
            const on = Number(mk.dataset.index) === activeIndex;
            mk.classList.toggle('is-active', on);
            const existingDel = mk.querySelector('.ih-mk-del');
            if (on && canDelete) {
                if (!existingDel) mk.appendChild(makeDelBtn(activeIndex));
            } else if (existingDel) {
                existingDel.remove();
            }
        });
    }

    // ---- ajout / suppression ----
    function addPointAt(x, y) {
        const d = getData();
        if (!Array.isArray(d.hotspots)) d.hotspots = [];
        // Zones à taille réelle : centre borné dès le placement (taille par défaut du schéma).
        const item = cfg.newItem(round1(clampCenterToZone(x, undefined)), round1(clampCenterToZone(y, undefined)));
        d.hotspots.push(item);
        if (api.setData) api.setData(d);
        if (api.rerender) api.rerender();
        const idx = d.hotspots.length - 1;
        activeIndex = idx;
        renderMarkers();
        selectHotspot(idx);
        requestAnimationFrame(() => {
            const f = container.querySelector('.json-editor__detail input[type="text"], .json-editor__detail textarea');
            if (f) f.focus();
        });
    }

    async function deletePoint(index) {
        const d = getData();
        const hs = Array.isArray(d.hotspots) ? d.hotspots : [];
        if (hs.length <= 1) return; // minItems: 1 — on garde toujours au moins un point
        // Confirmation simple (mêmes libellés/modale que la suppression du mode Plan) pour éviter
        // une suppression par inadvertance d'un clic sur la croix.
        const confirmed = await showConfirm(
            t('editor_confirm_delete'),
            t('editor_confirm_delete_title'),
            t('editor_delete_btn'),
            t('editor_cancel'),
            true
        );
        if (!confirmed) return;
        d.hotspots.splice(index, 1);
        if (api.setData) api.setData(d);
        if (api.rerender) api.rerender();
        activeIndex = Math.min(index, d.hotspots.length - 1);
        renderMarkers();
        selectHotspot(activeIndex);
    }

    // ---- placement d'un nouveau point (bouton + clic sur l'image) ----
    function setPlacing(on) {
        placing = !!on;
        stage.classList.toggle('is-placing', placing);
        addBtn.classList.toggle('is-active', placing);
        addBtn.setAttribute('aria-pressed', String(placing));
        addLabel.textContent = placing ? L.cancel : L.add;
        liveHint.textContent = placing ? L.placeHint : L.liveHint;
        liveHint.classList.toggle('is-armed', placing);
    }

    addBtn.addEventListener('click', () => setPlacing(!placing));
    wrap.addEventListener('click', (e) => {
        if (!placing) return;
        if (e.target.closest('.ih-mk')) return; // un clic sur un marqueur ne place pas
        const p = pointToPct(e.clientX, e.clientY);
        if (!p) return;
        setPlacing(false);
        addPointAt(p.x, p.y);
    });

    // ---- synchro inverse : édition manuelle des champs x/y (et width/height/figure pour les
    // zones à taille réelle) → mise à jour du marqueur ----
    const onContainerInput = (e) => {
        if (suppressSync) return;
        const tgt = e.target;
        const path = tgt && tgt.dataset ? tgt.dataset.path : '';
        const m = /^hotspots\.(\d+)\.(x|y|width|height|figure)$/.exec(path || '');
        if (!m) return;
        const idx = Number(m[1]);
        const mk = markersEl.querySelector(`.ih-mk[data-index="${idx}"]`);
        if (!mk) return;
        const xi = detailInput(idx, 'x');
        const yi = detailInput(idx, 'y');
        positionMarker(mk, xi ? xi.value : parseFloat(mk.style.left), yi ? yi.value : parseFloat(mk.style.top));
        if (cfg.sizedZones) {
            const wi = detailInput(idx, 'width');
            const hi = detailInput(idx, 'height');
            if (wi) mk.style.width = `${roundSize(wi.value)}%`;
            if (hi) mk.style.height = `${roundSize(hi.value)}%`;
            const fs = container.querySelector(`.json-editor__detail select[data-path="hotspots.${idx}.figure"]`);
            if (fs) mk.classList.toggle('ih-mk--rect', fs.value === 'rectangle');
        }
    };
    container.addEventListener('input', onContainerInput);
    activeContainer = container;
    activeParent = parent;
    activeOnInput = onContainerInput;

    // ---- image de fond ----
    function ensureImage() {
        const url = getBgUrl();
        if (!url) {
            stage.hidden = true;
            toolbar.hidden = true;
            noImageEl.hidden = false;
            return false;
        }
        stage.hidden = false;
        toolbar.hidden = false;
        noImageEl.hidden = true;
        if (img.getAttribute('src') !== url) img.src = url;
        return true;
    }

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
        // En mode live, l'instruction vit déjà dans la barre d'outils (.ih-live-hint) → on vide le hint
        // de la barre de mode pour ne pas l'afficher en double.
        modeHint.textContent = live ? '' : L.planHint;
        setPlacing(false);
        if (live) {
            const ok = ensureImage();
            if (ok) {
                if (img.complete && img.naturalWidth) renderMarkers();
                else img.addEventListener('load', renderMarkers, { once: true });
                const hs = getHotspots();
                if (hs.length) selectHotspot(activeIndex >= 0 && activeIndex < hs.length ? activeIndex : 0);
            }
        }
    }
    planBtn.addEventListener('click', () => setMode('plan'));
    liveBtn.addEventListener('click', () => setMode('live'));

    // Mode par défaut : « Sur l'image » (édition directe des points sur le fond) — le mode « Plan »
    // (liste master-detail) reste accessible via le second onglet. Demandé pour les 3 activités à
    // image de fond (Image interactive, Trouver la zone, Trouver les zones).
    setMode('live');
}

/**
 * Détache le listener délégué et retire la classe de mode. À appeler quand l'éditeur se ferme
 * (le panneau lui-même est retiré par index.js), sinon le listener `input` posé sur le conteneur
 * (qui survit aux re-rendus) fuiterait d'une session d'édition à l'autre.
 */
export function destroyInteractiveImagePanel() {
    if (activeContainer && activeOnInput) {
        activeContainer.removeEventListener('input', activeOnInput);
    }
    if (activeParent) activeParent.classList.remove('ih-mode-live');
    activeContainer = null;
    activeParent = null;
    activeOnInput = null;
}
