/**
 * Panneau éditeur « Disposition des zones » — Glisser-déposer (partagé éditeur, cf. CLAUDE.md item 7).
 *
 * S'ajoute AU-DESSUS de l'éditeur JSON standard quand l'activité est un « Glisser-déposer »
 * (H5P.DragQuestion). Deux VUES, basculées par un segmented control — calquées sur les panneaux
 * Vidéo interactive / Image interactive :
 *
 *   • PLAN — l'éditeur master-detail classique, seul (le canevas est masqué : la modale reste
 *     entièrement lisible et défilable).
 *
 *   • SUR LE CANEVAS (défaut) — CÔTE-À-CÔTE : le canevas EN GRAND à GAUCHE (colonne défilante),
 *     le formulaire de l'item sélectionné (zone OU étiquette) à DROITE (nav masquée par la
 *     classe `dz-mode-live` sur le parent, comme `ih-mode-live`). Au BAS de la colonne de
 *     droite (fin du conteneur, sticky), une barre « + Ajouter une zone / + Ajouter une
 *     étiquette » relaie le flux d'ajout réel de l'éditeur (clic du « + » de la nav) puis
 *     sélectionne le nouvel item — pas besoin de repasser par le Plan.
 *
 * Dans la vue canevas, un second segmented control pilote la DONNÉE `layoutMode` :
 *
 *   • AUTOMATIQUE (défaut) — la grille adaptative historique : canvas non déplaçable mais
 *     CLIQUABLE (cliquer une zone ou une étiquette ouvre son formulaire à droite).
 *
 *   • PERSONNALISÉE — les zones ET les étiquettes deviennent DÉPLAÇABLES (glisser) et
 *     REDIMENSIONNABLES (poignée bas-droite) sur le canvas ; la barre d'outils expose les
 *     coordonnées x/y/largeur/hauteur (en % du canvas) de l'item sélectionné ET la hauteur du
 *     canvas (px). Un bouton permet de repartir de la disposition automatique. Un item ajouté
 *     ensuite sans coordonnées reçoit son emplacement auto (règle appliquée par le processeur) ;
 *     une étiquette jamais touchée garde son placement auto (le flux reste vivant).
 *
 * Modèle de données (pré-processeur) : `layoutMode: 'auto'|'custom'`, `canvasHeight` (px),
 * `dropZones[i].x/y/width/height` et `elements[i].x/y/width/height` (% du canvas, coin
 * haut-gauche). C'est ce format qui permet aussi d'importer côté Sucrerie un .h5p NON généré
 * par Caramel : ses coordonnées existantes sont mappées telles quelles en mode personnalisé
 * au lieu d'être écrasées par la grille.
 *
 * Construction (non invasive, mêmes principes que le panneau Image interactive) :
 *   - Panneau inséré comme FRÈRE du conteneur → survit aux re-rendus qui réécrivent
 *     `container.innerHTML`.
 *   - La sélection d'un item pilote la nav réelle de l'éditeur (clic du sous-item `dropZones`
 *     ou `elements`) → son formulaire s'édite dans la colonne de droite.
 *   - La géométrie N'A PAS de champs dans le formulaire : le panneau écrit directement dans la
 *     donnée via `api.getData()`/`api.setData()` — sûr car l'éditeur et l'array manager
 *     conservent les MÊMES références d'objets (pas de clonage), et le healer/normalizer
 *     préservent les champs inconnus des items.
 *   - Le calcul de layout vient du MODULE PARTAGÉ ./dragdrop-layout-model.js (math pure,
 *     byte-identique dans les deux dépôts — la même que celle du save). `opts.computeLayout`
 *     permet à un hôte d'injecter une variante si nécessaire (prioritaire sur le défaut).
 *   - Tout le CSS (`.dz-*`) vit dans css/base/style.css (Caramel) /
 *     assets/css/components/editor-view.css (Sucrerie).
 *
 * @module editor/dragdrop-layout-panel
 */
import { t } from '../core/translation.js';
import { computeCanvasLayout } from './dragdrop-layout-model.js';

const PANEL_CLASS = 'dz-editor-panel';
const LIVE_CLASS = 'dz-mode-live';
// Les deux familles d'items du canvas : section de nav, tableau de donnée, classe CSS.
const KINDS = {
    zone: { section: 'dropZones', arrayKey: 'dropZones', css: 'dz-zn', positions: 'zonePositions' },
    element: { section: 'elements', arrayKey: 'elements', css: 'dz-el', positions: 'elemPositions' }
};
const GEOM_KEYS = ['x', 'y', 'width', 'height'];

// État persistant minimal (pour le nettoyage à la fermeture de l'éditeur).
let activeContainer = null;
let activeParent = null;
let activeOnChange = null;
let activeAddBar = null;

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
/** Arrondit à 0,1 (pas des champs de coordonnées en %). */
function round1(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}
/** Un item porte-t-il une géométrie personnalisée complète ? */
function hasGeometry(item) {
    return item && GEOM_KEYS.every(k => Number.isFinite(Number(item[k])));
}

/**
 * Monte (ou remonte) le panneau de disposition au-dessus de l'éditeur.
 * @param {HTMLElement} container - Conteneur de l'éditeur JSON.
 * @param {{getData:Function, setData:Function, rerender:Function}} api
 * @param {Object} [opts]
 *   - {Function} [computeLayout] : (data) → {canvasW, canvasH, zonePositions[], elemPositions[]}
 *     — override optionnel ; défaut : computeCanvasLayout du modèle partagé.
 */
export function mountDragDropLayoutPanel(container, api, opts = {}) {
    if (!container || !api) return;
    const computeLayout = (typeof opts.computeLayout === 'function') ? opts.computeLayout : computeCanvasLayout;
    const parent = container.parentElement || container;

    // Nettoyer un éventuel montage précédent (listener + classe + panneau).
    destroyDragDropLayoutPanel();
    parent.classList.remove(LIVE_CLASS);
    const existing = parent.querySelector(`.${PANEL_CLASS}`);
    if (existing) existing.remove();

    const L = {
        plan: t('editor_dz_view_plan'), live: t('editor_dz_view_live'),
        planHint: t('editor_dz_view_plan_hint'),
        auto: t('editor_dz_mode_auto'), custom: t('editor_dz_mode_custom'),
        autoHint: t('editor_dz_mode_auto_hint'), customHint: t('editor_dz_mode_custom_hint'),
        reset: t('editor_dz_reset_auto'),
        x: t('editor_dz_x'), y: t('editor_dz_y'),
        w: t('editor_dz_zone_width'), h: t('editor_dz_zone_height'),
        canvasH: t('editor_dz_canvas_height'),
        zone: t('editor_zone'), element: t('editor_element'), dragTitle: t('editor_dz_zone_title'),
        // Mêmes clés que les addLabel du schéma (déjà présentes dans les 11 locales).
        addZone: t('editor_add_zone'), addElement: t('editor_add_element')
    };
    const kindLabel = (kind) => (kind === 'zone' ? L.zone : L.element);

    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
        <div class="dz-modebar">
            <div class="dz-seg" role="tablist" aria-label="${escapeText(L.live)} / ${escapeText(L.plan)}">
                <button type="button" class="dz-viewbtn is-active" data-view="live" role="tab" aria-selected="true">
                    <i class="fas fa-object-group" aria-hidden="true"></i><span>${escapeText(L.live)}</span>
                </button>
                <button type="button" class="dz-viewbtn" data-view="plan" role="tab" aria-selected="false">
                    <i class="fas fa-list-ul" aria-hidden="true"></i><span>${escapeText(L.plan)}</span>
                </button>
            </div>
            <span class="dz-modehint"></span>
        </div>
        <div class="dz-live" hidden>
            <div class="dz-live-toolbar">
                <div class="dz-seg dz-seg--layout" role="tablist" aria-label="${escapeText(L.auto)} / ${escapeText(L.custom)}">
                    <button type="button" class="dz-modebtn" data-mode="auto" role="tab" aria-selected="false">
                        <i class="fas fa-table-cells-large" aria-hidden="true"></i><span>${escapeText(L.auto)}</span>
                    </button>
                    <button type="button" class="dz-modebtn" data-mode="custom" role="tab" aria-selected="false">
                        <i class="fas fa-arrows-up-down-left-right" aria-hidden="true"></i><span>${escapeText(L.custom)}</span>
                    </button>
                </div>
                <span class="dz-live-hint"></span>
            </div>
            <div class="dz-tools" hidden>
                <span class="dz-tools-zone"></span>
                <label class="dz-num">${escapeText(L.x)} <input type="number" data-dz="x" min="0" max="100" step="0.1"></label>
                <label class="dz-num">${escapeText(L.y)} <input type="number" data-dz="y" min="0" max="100" step="0.1"></label>
                <label class="dz-num">${escapeText(L.w)} <input type="number" data-dz="width" min="2" max="100" step="0.1"></label>
                <label class="dz-num">${escapeText(L.h)} <input type="number" data-dz="height" min="2" max="100" step="0.1"></label>
                <label class="dz-num dz-num--canvas">${escapeText(L.canvasH)} <input type="number" data-dz="canvasHeight" min="300" max="2000" step="10"></label>
                <button type="button" class="action-btn dz-reset" title="${escapeText(L.reset)}">
                    <i class="fas fa-rotate-left" aria-hidden="true"></i> <span>${escapeText(L.reset)}</span>
                </button>
            </div>
            <div class="dz-stage">
                <div class="dz-stage-wrap">
                    <img class="dz-stage-bg" alt="" draggable="false" hidden>
                    <div class="dz-layer dz-zones"></div>
                    <div class="dz-layer dz-els"></div>
                </div>
            </div>
        </div>
    `;
    parent.insertBefore(panel, container);

    // Barre « + Ajouter » : au BAS de la COLONNE DE DROITE (fin du conteneur de l'éditeur),
    // toujours visible sans faire défiler le canevas (collée en bas via CSS sticky). Affichée
    // en vue canevas uniquement (règle .dz-mode-live) — en Plan, la nav a déjà ses « + ».
    // Un re-rendu complet de l'éditeur (innerHTML) peut la détacher : renderStage la réinsère.
    const addBar = document.createElement('div');
    addBar.className = 'dz-addbar';
    addBar.innerHTML = `
        <button type="button" class="dz-add" data-kind="zone">
            <i class="fas fa-plus" aria-hidden="true"></i><span>${escapeText(L.addZone)}</span>
        </button>
        <button type="button" class="dz-add" data-kind="element">
            <i class="fas fa-plus" aria-hidden="true"></i><span>${escapeText(L.addElement)}</span>
        </button>
    `;
    container.appendChild(addBar);

    const planBtn = panel.querySelector('.dz-viewbtn[data-view="plan"]');
    const liveBtn = panel.querySelector('.dz-viewbtn[data-view="live"]');
    const liveWrap = panel.querySelector('.dz-live');
    const liveHint = panel.querySelector('.dz-live-hint');
    const autoBtn = panel.querySelector('.dz-modebtn[data-mode="auto"]');
    const customBtn = panel.querySelector('.dz-modebtn[data-mode="custom"]');
    const modeHint = panel.querySelector('.dz-modehint');
    const tools = panel.querySelector('.dz-tools');
    const toolsZone = panel.querySelector('.dz-tools-zone');
    const resetBtn = panel.querySelector('.dz-reset');
    const wrap = panel.querySelector('.dz-stage-wrap');
    const bgImg = panel.querySelector('.dz-stage-bg');
    const layers = {
        zone: panel.querySelector('.dz-zones'),
        element: panel.querySelector('.dz-els')
    };
    const numInputs = Array.from(panel.querySelectorAll('input[data-dz]'));
    const addBtns = Array.from(addBar.querySelectorAll('.dz-add'));

    let activeKind = 'zone';
    let activeIndex = 0;
    let drag = null;    // { kind, idx, pid, el, moved, offX, offY }
    let resize = null;  // { kind, idx, pid, el, it }
    let refreshQueued = false;

    const getData = () => (api.getData && api.getData()) || {};
    const getItems = (kind, d = getData()) => {
        const arr = d[KINDS[kind].arrayKey];
        return Array.isArray(arr) ? arr : [];
    };
    const isCustom = () => getData().layoutMode === 'custom';

    /** Layout courant (mêmes règles que le processeur, via la fonction injectée). */
    const layoutOf = (data) => {
        try { return computeLayout(data); }
        catch { return { canvasW: 800, canvasH: 500, zonePositions: [], elemPositions: [] }; }
    };
    const positionsOf = (layout, kind) => layout[KINDS[kind].positions] || [];

    // ---- écriture dans la donnée (mêmes références d'objets, cf. en-tête) ----

    /** Mute la donnée puis notifie l'éditeur (hasChanges). */
    const writeData = (mutator) => {
        const d = getData();
        mutator(d);
        if (api.setData) api.setData(d);
    };

    /** Écrit la géométrie bornée d'un item (item entier dans le canvas). */
    const writeGeometry = (kind, index, geom) => {
        writeData((d) => {
            const item = getItems(kind, d)[index];
            if (!item) return;
            const width = Math.max(2, Math.min(100, round1(geom.width != null ? geom.width : item.width)));
            const height = Math.max(2, Math.min(100, round1(geom.height != null ? geom.height : item.height)));
            const x = Math.max(0, Math.min(100 - width, round1(geom.x != null ? geom.x : item.x)));
            const y = Math.max(0, Math.min(100 - height, round1(geom.y != null ? geom.y : item.y)));
            item.x = x; item.y = y; item.width = width; item.height = height;
        });
    };

    // ---- ajout depuis la vue canevas (barre au bas de la colonne de droite) ----
    // Réutilise le flux RÉEL de l'éditeur : clic du bouton « + » de la nav (handleArrayAdd —
    // création selon le schéma, refresh de la nav, formulaire du nouvel item affiché à
    // droite), puis sélection du nouvel item sur le canevas. Le bouton de nav est absent
    // quand maxItems est atteint → nos boutons se grisent en miroir (cf. renderStage).
    const navAddBtn = (kind) => container.querySelector(
        `.json-editor__nav-items[data-section-id="${KINDS[kind].section}"] .json-editor__nav-add-btn`
    );
    addBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const kind = btn.dataset.kind;
            const nav = navAddBtn(kind);
            if (!nav) return;
            nav.click(); // synchrone : la donnée contient le nouvel item au retour
            const items = getItems(kind);
            if (!items.length) return;
            activeKind = kind;
            activeIndex = items.length - 1;
            refresh();
        });
    });

    // ---- sélection (pilote la nav réelle de l'éditeur → formulaire à droite) ----
    const clickNav = (kind, index) => {
        const el = container.querySelector(
            `.json-editor__nav-items[data-section-id="${KINDS[kind].section}"] .json-editor__nav-subitem[data-index="${index}"]`
        );
        if (el) el.click();
    };
    const selectItem = (kind, index, navigate = true) => {
        const items = getItems(kind);
        if (index == null || index < 0 || index >= items.length) return;
        activeKind = kind;
        activeIndex = index;
        if (navigate) clickNav(kind, index);
        updateActiveItem();
        fillToolInputs();
    };
    /** Met à jour l'état actif SANS recréer les items (préserve la capture pointeur). */
    function updateActiveItem() {
        for (const kind of Object.keys(layers)) {
            layers[kind].querySelectorAll(`.${KINDS[kind].css}`).forEach((it) => {
                it.classList.toggle('is-active', kind === activeKind && Number(it.dataset.index) === activeIndex);
            });
        }
    }

    // ---- barre d'outils : coordonnées de l'item actif + hauteur du canvas ----
    function fillToolInputs() {
        const d = getData();
        const item = getItems(activeKind, d)[activeIndex];
        const layout = layoutOf(d);
        const pos = hasGeometry(item)
            ? item
            : (positionsOf(layout, activeKind)[activeIndex] || { x: 0, y: 0, width: 30, height: 20 });
        toolsZone.textContent = `${kindLabel(activeKind)} ${activeIndex + 1}`;
        for (const input of numInputs) {
            const key = input.dataset.dz;
            if (key === 'canvasHeight') input.value = String(Math.round(layout.canvasH));
            else input.value = String(round1(pos[key]));
        }
    }

    numInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (!isCustom()) return;
            const key = input.dataset.dz;
            const val = parseFloat(input.value);
            if (!Number.isFinite(val)) { fillToolInputs(); return; }
            if (key === 'canvasHeight') {
                writeData((d) => { d.canvasHeight = Math.max(300, Math.min(2000, Math.round(val))); });
            } else {
                seedGeometryIfMissing(activeKind, activeIndex);
                writeGeometry(activeKind, activeIndex, { [key]: val });
            }
            refresh();
        });
    });

    /** Un item encore « auto » que l'on modifie reçoit d'abord son emplacement courant. */
    function seedGeometryIfMissing(kind, index) {
        const item = getItems(kind)[index];
        if (!item || hasGeometry(item)) return;
        const pos = positionsOf(layoutOf(getData()), kind)[index];
        if (pos) writeGeometry(kind, index, pos);
    }

    // ---- rendu du canvas (zones + étiquettes, tous cliquables ; déplaçables en personnalisé) ----
    function renderStage() {
        const d = getData();
        const layout = layoutOf(d);
        const custom = d.layoutMode === 'custom';

        wrap.style.aspectRatio = `${layout.canvasW} / ${layout.canvasH}`;
        panel.classList.toggle('dz-custom', custom);

        // Image de fond éventuelle (dataURL réhydraté par l'hôte, comme les autres widgets image).
        const bg = d.backgroundImage && d.backgroundImage.dataURL;
        bgImg.hidden = !bg;
        if (bg && bgImg.getAttribute('src') !== bg) bgImg.src = bg;

        for (const kind of Object.keys(layers)) {
            layers[kind].innerHTML = '';
            const items = getItems(kind, d);
            positionsOf(layout, kind).forEach((pos, i) => {
                layers[kind].appendChild(makeItemEl(kind, i, items[i], pos, custom));
            });
        }

        const activeItems = getItems(activeKind, d);
        if (activeIndex >= activeItems.length) activeIndex = Math.max(0, activeItems.length - 1);
        selectItem(activeKind, activeIndex, false);

        // Barre d'ajout : vit dans le conteneur (colonne de droite) → un re-rendu complet de
        // l'éditeur a pu la détacher, la réinsérer. Boutons grisés quand le maximum d'items
        // est atteint (le bouton « + » correspondant a alors disparu de la nav).
        if (!addBar.isConnected) container.appendChild(addBar);
        addBtns.forEach((btn) => { btn.disabled = !navAddBtn(btn.dataset.kind); });
    }

    /** Libellé affiché d'un item (zone : label ; étiquette : texte, ou 🖼 si image). */
    function itemText(kind, item, index) {
        if (kind === 'zone') return stripHtml(item && item.label) || `${L.zone} ${index + 1}`;
        return stripHtml(item && item.text) || (item && item.image && item.image.path ? '🖼' : `${L.element} ${index + 1}`);
    }

    function makeItemEl(kind, index, item, pos, custom) {
        const css = KINDS[kind].css;
        const it = document.createElement('div');
        it.className = css;
        it.dataset.index = String(index);
        it.style.left = `${pos.x}%`;
        it.style.top = `${pos.y}%`;
        it.style.width = `${pos.width}%`;
        it.style.height = `${pos.height}%`;
        it.setAttribute('role', 'button');
        it.setAttribute('tabindex', '0');
        it.title = custom ? L.dragTitle : '';
        it.setAttribute('aria-label', `${kindLabel(kind)} ${index + 1}. ${itemText(kind, item, index)}`.trim());
        it.innerHTML = kind === 'zone'
            ? `<span class="dz-zn-label">${escapeText(itemText(kind, item, index))}</span>`
            : `<span class="dz-el-label">${escapeText(itemText(kind, item, index))}</span>`;

        // Glisser-déposer (mode personnalisé uniquement — Pointer Events, capture sur l'item).
        it.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.dz-rsz')) return;
            selectItem(kind, Number(it.dataset.index));
            if (!isCustom()) return;
            e.preventDefault();
            const r = wrap.getBoundingClientRect();
            drag = {
                kind, idx: Number(it.dataset.index), pid: e.pointerId, el: it, moved: false,
                offX: (e.clientX - r.left) / r.width * 100 - parseFloat(it.style.left),
                offY: (e.clientY - r.top) / r.height * 100 - parseFloat(it.style.top)
            };
            try { it.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
            it.classList.add('is-dragging');
        });
        it.addEventListener('pointermove', (e) => {
            if (!drag || drag.el !== it || drag.pid !== e.pointerId) return;
            const r = wrap.getBoundingClientRect();
            if (!r.width || !r.height) return;
            drag.moved = true;
            const w = parseFloat(it.style.width);
            const h = parseFloat(it.style.height);
            const x = Math.max(0, Math.min(100 - w, (e.clientX - r.left) / r.width * 100 - drag.offX));
            const y = Math.max(0, Math.min(100 - h, (e.clientY - r.top) / r.height * 100 - drag.offY));
            it.style.left = `${x}%`;
            it.style.top = `${y}%`;
        });
        const endDrag = (e) => {
            if (!drag || drag.el !== it) return;
            try { it.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
            it.classList.remove('is-dragging');
            if (drag.moved) {
                writeGeometry(drag.kind, drag.idx, {
                    x: parseFloat(it.style.left), y: parseFloat(it.style.top),
                    width: parseFloat(it.style.width), height: parseFloat(it.style.height)
                });
                fillToolInputs();
            }
            drag = null;
        };
        it.addEventListener('pointerup', endDrag);
        it.addEventListener('pointercancel', endDrag);

        // Clavier : flèches = déplacer (Maj = pas de 5 %), Entrée = sélectionner.
        it.addEventListener('keydown', (e) => {
            const idx = Number(it.dataset.index);
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(kind, idx); return; }
            if (!isCustom()) return;
            const step = e.shiftKey ? 5 : 1;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft') dx = -step;
            else if (e.key === 'ArrowRight') dx = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'ArrowDown') dy = step;
            else return;
            e.preventDefault();
            selectItem(kind, idx, false);
            seedGeometryIfMissing(kind, idx);
            writeGeometry(kind, idx, {
                x: parseFloat(it.style.left) + dx, y: parseFloat(it.style.top) + dy,
                width: parseFloat(it.style.width), height: parseFloat(it.style.height)
            });
            refresh();
        });

        // Poignée de redimensionnement (bas-droite), mode personnalisé.
        if (custom) {
            const rz = document.createElement('span');
            rz.className = 'dz-rsz';
            rz.setAttribute('aria-hidden', 'true');
            rz.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectItem(kind, Number(it.dataset.index));
                resize = { kind, idx: Number(it.dataset.index), pid: e.pointerId, el: rz, it };
                try { rz.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
                it.classList.add('is-resizing');
            });
            rz.addEventListener('pointermove', (e) => {
                if (!resize || resize.el !== rz || resize.pid !== e.pointerId) return;
                const r = wrap.getBoundingClientRect();
                if (!r.width || !r.height) return;
                const x = parseFloat(it.style.left);
                const y = parseFloat(it.style.top);
                const w = Math.max(2, Math.min(100 - x, (e.clientX - r.left) / r.width * 100 - x));
                const h = Math.max(2, Math.min(100 - y, (e.clientY - r.top) / r.height * 100 - y));
                it.style.width = `${w}%`;
                it.style.height = `${h}%`;
            });
            const endResize = (e) => {
                if (!resize || resize.el !== rz) return;
                try { rz.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
                it.classList.remove('is-resizing');
                writeGeometry(resize.kind, resize.idx, {
                    x: parseFloat(it.style.left), y: parseFloat(it.style.top),
                    width: parseFloat(it.style.width), height: parseFloat(it.style.height)
                });
                fillToolInputs();
                resize = null;
            };
            rz.addEventListener('pointerup', endResize);
            rz.addEventListener('pointercancel', endResize);
            it.appendChild(rz);
        }

        return it;
    }

    // ---- bascule de mode (écrit layoutMode dans la donnée) ----
    function setMode(m, write = true) {
        const custom = m === 'custom';
        if (write) {
            writeData((d) => {
                d.layoutMode = custom ? 'custom' : 'auto';
                if (custom) {
                    // Seed : figer la disposition auto courante des ZONES comme point de départ
                    // éditable. Les étiquettes ne sont volontairement PAS seedées : tant qu'on
                    // n'y touche pas, elles gardent leur flux auto (ajouts/retraits fluides).
                    const layout = layoutOf({ ...d, layoutMode: 'auto', canvasHeight: undefined });
                    if (!Number.isFinite(Number(d.canvasHeight))) d.canvasHeight = layout.canvasH;
                    (d.dropZones || []).forEach((zone, i) => {
                        if (!hasGeometry(zone)) {
                            const pos = layout.zonePositions[i];
                            if (pos) { zone.x = pos.x; zone.y = pos.y; zone.width = pos.width; zone.height = pos.height; }
                        }
                    });
                }
            });
        }
        autoBtn.classList.toggle('is-active', !custom);
        autoBtn.setAttribute('aria-selected', String(!custom));
        customBtn.classList.toggle('is-active', custom);
        customBtn.setAttribute('aria-selected', String(custom));
        tools.hidden = !custom;
        liveHint.textContent = custom ? L.customHint : L.autoHint;
        renderStage();
    }
    autoBtn.addEventListener('click', () => setMode('auto'));
    customBtn.addEventListener('click', () => setMode('custom'));

    // ---- bascule de VUE (Plan / Sur le canevas — n'écrit RIEN dans la donnée) ----
    function setView(v) {
        const live = v === 'live';
        planBtn.classList.toggle('is-active', !live);
        planBtn.setAttribute('aria-selected', String(!live));
        liveBtn.classList.toggle('is-active', live);
        liveBtn.setAttribute('aria-selected', String(live));
        liveWrap.hidden = !live;
        parent.classList.toggle(LIVE_CLASS, live);
        // En vue canevas, l'instruction vit dans la barre d'outils (.dz-live-hint) → le hint
        // de la barre de mode ne sert qu'au Plan.
        modeHint.textContent = live ? '' : L.planHint;
        if (live) {
            renderStage();
            const items = getItems(activeKind);
            if (items.length) selectItem(activeKind, Math.min(Math.max(activeIndex, 0), items.length - 1), false);
        }
    }
    planBtn.addEventListener('click', () => setView('plan'));
    liveBtn.addEventListener('click', () => setView('live'));

    // ---- repartir de la disposition automatique (efface TOUTE géométrie personnalisée) ----
    resetBtn.addEventListener('click', () => {
        writeData((d) => {
            delete d.canvasHeight;
            for (const kind of Object.keys(KINDS)) {
                getItems(kind, d).forEach((item) => {
                    GEOM_KEYS.forEach((k) => { delete item[k]; });
                });
            }
            // Re-seed immédiat des zones depuis la grille auto (le mode reste personnalisé ;
            // les étiquettes repartent en flux auto, cf. setMode).
            const layout = layoutOf({ ...d, layoutMode: 'auto' });
            d.canvasHeight = layout.canvasH;
            (d.dropZones || []).forEach((zone, i) => {
                const pos = layout.zonePositions[i];
                if (pos) { zone.x = pos.x; zone.y = pos.y; zone.width = pos.width; zone.height = pos.height; }
            });
        });
        refresh();
    });

    // ---- rafraîchissement sur édition du formulaire (labels, ajout/suppression d'items,
    // largeur du canvas, position des étiquettes…) ----
    const refresh = () => {
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(() => {
            refreshQueued = false;
            // Ne JAMAIS reconstruire le canvas pendant un glissement/redimensionnement :
            // cela détruirait l'élément capturé par le pointeur (la sélection d'un item
            // clique la nav, ce qui déclenche onContainerChange en plein pointerdown).
            if (drag || resize) return;
            renderStage();
            fillToolInputs();
        });
    };
    const onContainerChange = (e) => {
        if (panel.contains(e.target)) return;
        refresh();
    };
    container.addEventListener('change', onContainerChange);
    // Ajout/suppression/réordonnancement d'items passent par des CLICS (array manager), pas des
    // 'change' : on rafraîchit aussi sur clic (rAF → coût négligeable, ≤ 10 zones).
    container.addEventListener('click', onContainerChange);
    // Mutations structurelles notifiées par editor-core (refreshNavItemList). Couvre la
    // SUPPRESSION : sa confirmation vit dans une modale hors du conteneur, donc ni 'click'
    // ni 'change' n'atteignent le conteneur au moment où l'item est réellement retiré.
    container.addEventListener('json-editor:items-changed', onContainerChange);
    activeContainer = container;
    activeParent = parent;
    activeOnChange = onContainerChange;
    activeAddBar = addBar;

    // Mode disposition initial : reflète la donnée (custom si layoutMode déjà personnalisé —
    // ex. .h5p importé). Vue par défaut : « Sur le canevas » (comme les panneaux vidéo/image).
    setMode(isCustom() ? 'custom' : 'auto', false);
    setView('live');
}

/**
 * Détache les listeners délégués posés sur le conteneur et retire la classe de vue du parent
 * (qui survivraient aux re-rendus / à la fermeture en vue canevas). À appeler quand l'éditeur
 * se ferme — le panneau lui-même est retiré par l'hôte (index.js).
 */
export function destroyDragDropLayoutPanel() {
    if (activeContainer && activeOnChange) {
        activeContainer.removeEventListener('change', activeOnChange);
        activeContainer.removeEventListener('click', activeOnChange);
        activeContainer.removeEventListener('json-editor:items-changed', activeOnChange);
    }
    if (activeParent) activeParent.classList.remove(LIVE_CLASS);
    if (activeAddBar) activeAddBar.remove();
    activeContainer = null;
    activeParent = null;
    activeOnChange = null;
    activeAddBar = null;
}
