/**
 * Éditeur de transcription synchronisé (Caramel) : transcription éditable à GAUCHE (une ligne par
 * passage, ligne courante surlignée, auto-défilement calé sur la lecture) | lecteur à DROITE.
 * Édition en direct (contenteditable) ; l'auto-défilement se met en pause dès qu'on édite/scrolle.
 *
 * Découpé en deux exports pour la testabilité :
 *   - `createRowSync(editEl)` : cœur PUR du surlignage (aucun lecteur) — pilotable par `tick(seconds)`.
 *   - `buildSyncedTranscriptEditor(...)` : widget complet (DOM + lecteur via sync-video-player).
 *
 * @module ui/transcript-sync-editor
 */
import { createVideoPlayer } from './sync-video-player.js';

/** Repère temporel `[h:]mm:ss` relu par parsePastedTranscript (h:mm:ss au-delà d'une heure). */
export function fmtTimecode(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Cœur de synchronisation : surligne la ligne `.vt-row` correspondant au temps courant et la
 * recentre (si « suivi » actif). Pur (pas de lecteur) → testable en appelant `tick(seconds)`.
 * @param {HTMLElement} editEl - Conteneur scrollable des lignes `.vt-row[data-start]`.
 * @param {{ onFollowChange?:(on:boolean)=>void }} [opts]
 */
export function createRowSync(editEl, opts = {}) {
    const onFollowChange = typeof opts.onFollowChange === 'function' ? opts.onFollowChange : () => {};
    let rows = [...editEl.querySelectorAll('.vt-row')];
    let starts = rows.map(r => Number(r.dataset.start) || 0);
    let activeIdx = -1;
    let following = true;
    // Mémorise la dernière position imposée par NOTRE défilement automatique : un scroll qui s'en
    // écarte = scroll utilisateur (robuste, sans fenêtre de temps fragile).
    let lastProgTop = -1;

    // Dernière ligne dont le début ≤ temps courant (recherche dichotomique).
    const findIdx = (cur) => {
        let lo = 0, hi = starts.length - 1, ans = -1;
        while (lo <= hi) { const mid = (lo + hi) >> 1; if (starts[mid] <= cur) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
        return ans;
    };

    function scrollToActive() {
        if (activeIdx < 0 || !rows[activeIdx]) return;
        const row = rows[activeIdx];
        editEl.scrollTop = row.offsetTop - editEl.clientHeight / 2 + row.offsetHeight / 2;
        lastProgTop = editEl.scrollTop; // valeur réellement appliquée (clampée)
    }

    function tick(cur) {
        const idx = findIdx(Number(cur) || 0);
        if (idx === activeIdx) return;
        if (activeIdx >= 0 && rows[activeIdx]) rows[activeIdx].classList.remove('is-active');
        activeIdx = idx;
        if (idx >= 0 && rows[idx]) { rows[idx].classList.add('is-active'); if (following) scrollToActive(); }
    }

    function setFollow(on) {
        following = !!on;
        onFollowChange(following);
        if (following) scrollToActive();
    }

    // Scroll manuel (molette/tactile) → la position s'écarte de notre dernier défilement → on cesse de suivre.
    editEl.addEventListener('scroll', () => {
        if (following && Math.abs(editEl.scrollTop - lastProgTop) > 2) { following = false; onFollowChange(false); }
    });

    // Re-lit les lignes après ajout/suppression (l'éditeur est dynamique).
    function refresh() {
        rows = [...editEl.querySelectorAll('.vt-row')];
        starts = rows.map(r => Number(r.dataset.start) || 0);
        activeIdx = rows.findIndex(r => r.classList.contains('is-active'));
    }

    return {
        tick, setFollow, scrollToActive, refresh,
        getActiveIndex: () => activeIdx,
        isFollowing: () => following,
        rowCount: () => rows.length
    };
}

/**
 * Widget complet : DOM 2 panneaux + lecteur synchronisé.
 * @param {Array<{start:number,text:string}>} segments
 * @param {{url:string, mime?:string}} videoSource
 * @param {{ onUse?:(text:string, edited:boolean)=>void, labels?:{use?:string, follow?:string} }} [opts]
 * @returns {{ element:HTMLElement, activate:Function, destroy:Function, editEl:HTMLElement, sync:Object }}
 */
export function buildSyncedTranscriptEditor(segments, videoSource, opts = {}) {
    const onUse = typeof opts.onUse === 'function' ? opts.onUse : () => {};
    const labels = opts.labels || {};
    const segs = Array.isArray(segments) ? segments : [];

    const pane = document.createElement('div');
    pane.className = 'video-transcript-2pane';

    // GAUCHE : transcription éditable (une ligne par passage).
    const left = document.createElement('div');
    left.className = 'vt-left';
    const edit = document.createElement('div');
    edit.className = 'vt-edit';
    edit.contentEditable = 'true';
    edit.spellcheck = false;
    edit.setAttribute('role', 'textbox');
    edit.setAttribute('aria-multiline', 'true');
    if (labels.placeholder) edit.dataset.placeholder = labels.placeholder; // affiché si vide (CSS)
    edit.innerHTML = segs.map(s => `<div class="vt-row" data-start="${Math.floor(Number(s.start) || 0)}">[${fmtTimecode(s.start)}] ${esc(s.text)}</div>`).join('');
    left.append(edit);

    // DROITE : lecteur + une rangée [« Ajouter une ligne » | « Recaler sur la vidéo » (contextuel)] + « Valider ».
    const right = document.createElement('div');
    right.className = 'vt-right';
    const playerBox = document.createElement('div');
    playerBox.className = 'vt-player';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'action-btn secondary-btn vt-add-line';
    addBtn.innerHTML = `<i class="fas fa-plus" aria-hidden="true"></i> ${esc(labels.addLine || 'Ajouter une ligne à cet instant')}`;
    // Auto-suivi par défaut ; ce bouton n'apparaît QUE lorsqu'on a fait défiler / édité (suivi figé).
    const resumeBtn = document.createElement('button');
    resumeBtn.type = 'button';
    resumeBtn.className = 'action-btn secondary-btn vt-resume';
    resumeBtn.hidden = true;
    resumeBtn.innerHTML = `<i class="fas fa-arrows-down-to-line" aria-hidden="true"></i> ${esc(labels.resume || 'Recaler sur la vidéo')}`;
    if (labels.resumeTip) resumeBtn.title = labels.resumeTip; // tooltip explicatif (le libellé reste court)
    // Les deux boutons sur une même ligne, largeurs égales (« Recaler » se masque quand le suivi est actif).
    const actions = document.createElement('div');
    actions.className = 'vt-actions';
    actions.append(addBtn, resumeBtn);
    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'action-btn primary-btn video-paste-btn vt-validate';
    useBtn.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> ${esc(labels.use || 'Valider la transcription')}`;
    right.append(playerBox, actions, useBtn);

    pane.append(left, right);

    // Le suivi est AUTOMATIQUE et se fige dès qu'on défile/édite : on n'expose donc pas de case à
    // cocher (toujours « suivi » prêtait à confusion) mais un bouton « reprendre » qui n'apparaît
    // que quand le suivi est en pause.
    const sync = createRowSync(edit, { onFollowChange: (on) => { resumeBtn.hidden = on; } });

    let edited = false;
    let player = null;

    // Remonte au `.vt-row` contenant un nœud (ou null). Mutualisé : auto-crochets / Entrée / Retour arrière.
    const closestRow = (node) => {
        let row = node && node.nodeType === 3 ? node.parentElement : node;
        while (row && row !== edit && !(row.classList && row.classList.contains('vt-row'))) row = row.parentElement;
        return (row && row !== edit && row.classList && row.classList.contains('vt-row')) ? row : null;
    };
    // Offset (en caractères) du curseur depuis le début de la ligne — robuste aux nœuds texte multiples.
    const caretOffset = (row, range) => {
        const pre = document.createRange();
        pre.selectNodeContents(row);
        try { pre.setEnd(range.endContainer, range.endOffset); } catch { return row.textContent.length; }
        return pre.toString().length;
    };

    // « 0:10 Toto » → « [0:10] Toto » : dès qu'un horodatage nu est suivi d'un espace en début de ligne.
    const tcToSec = (tc) => { const p = tc.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
    const autoBracket = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const row = closestRow(sel.focusNode);
        if (!row) return;
        const text = row.textContent;
        if (text[0] === '[') return;
        const m = text.match(/^(\d{1,2}:\d{2}(?::\d{2})?)(\s)/); // horodatage nu + espace
        if (!m) return;
        const tc = m[1];
        const caret = sel.focusOffset;
        row.textContent = '[' + tc + ']' + text.slice(tc.length); // text.slice commence par l'espace
        row.dataset.start = String(tcToSec(tc));
        const newCaret = caret + (caret > 0 ? 1 : 0) + (caret > tc.length ? 1 : 0); // +1 '[', +1 ']' si après
        const tn = row.firstChild;
        if (tn) { const r = document.createRange(); r.setStart(tn, Math.min(newCaret, tn.length)); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
        sync.refresh();
    };

    edit.addEventListener('input', () => { edited = true; sync.setFollow(false); autoBracket(); }); // édition → fige le suivi
    edit.addEventListener('paste', (e) => {                                          // coller en TEXTE BRUT
        e.preventDefault();
        const txt = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, txt);
    });
    resumeBtn.addEventListener('click', () => { sync.setFollow(true); edit.blur(); });
    useBtn.addEventListener('click', () => onUse(edit.innerText, edited));

    // Insère une ligne pré-horodatée à l'instant de lecture, à sa place chronologique, prête à saisir.
    addBtn.addEventListener('click', () => {
        const sec = Math.max(0, Math.floor(player ? player.getCurrentTime() : 0));
        let before = null;
        for (const r of edit.querySelectorAll('.vt-row')) { if ((Number(r.dataset.start) || 0) > sec) { before = r; break; } }
        const row = document.createElement('div');
        row.className = 'vt-row';
        row.dataset.start = String(sec);
        row.textContent = `[${fmtTimecode(sec)}] `;
        if (before) edit.insertBefore(row, before); else edit.appendChild(row);
        edited = true;
        sync.refresh();
        sync.setFollow(false);
        // Place le curseur en fin de la nouvelle ligne pour saisir tout de suite.
        edit.focus();
        const range = document.createRange();
        range.selectNodeContents(row);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        row.scrollIntoView({ block: 'center' });
    });

    // Édition « naturelle » des découpes horodatées au clavier (Entrée pour couper, Retour arrière pour annuler).
    edit.addEventListener('keydown', (e) => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        // ENTRÉE = scinder la ligne au curseur : la suite passe sur une NOUVELLE ligne horodatée à
        // l'instant de lecture courant (le prof met la vidéo sur le bon moment puis appuie sur Entrée).
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            const row = closestRow(sel.focusNode);
            if (!row) return;
            e.preventDefault(); // pas de <div>/<br> natif : on construit nous-mêmes la nouvelle ligne
            const caret = caretOffset(row, sel.getRangeAt(0));
            const full = row.textContent;
            const after = full.slice(caret).replace(/^\s+/, '');    // pas d'espace en tête de la nouvelle ligne
            row.textContent = full.slice(0, caret);                 // la ligne garde le texte AVANT le curseur
            const sec = Math.max(0, Math.floor(player ? player.getCurrentTime() : 0));
            const prefix = `[${fmtTimecode(sec)}] `;
            const nrow = document.createElement('div');
            nrow.className = 'vt-row';
            nrow.dataset.start = String(sec);
            nrow.textContent = prefix + after;                      // le texte APRÈS le curseur descend, horodaté
            row.after(nrow);
            edited = true;
            sync.refresh();
            sync.setFollow(false);
            const tn = nrow.firstChild;                             // curseur juste après l'horodatage, prêt à saisir
            if (tn) { const r = document.createRange(); r.setStart(tn, Math.min(prefix.length, tn.length)); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
            nrow.scrollIntoView({ block: 'center' });
            return;
        }

        // RETOUR ARRIÈRE en tête de ligne = annuler la découpe : l'horodatage de la ligne disparaît et son
        // texte se recolle à la ligne (au timestamp) précédente — geste « supprimer/fusionner » naturel.
        // (Pas de croix de suppression : trop facile d'effacer une ligne par erreur, sans retour possible.)
        if (e.key === 'Backspace' && !e.isComposing && sel.isCollapsed) {
            const row = closestRow(sel.focusNode);
            if (!row) return;
            const prefixLen = (row.textContent.match(/^\[[^\]]*\]\s?/) || [''])[0].length;
            if (caretOffset(row, sel.getRangeAt(0)) > prefixLen) return; // au milieu du texte → effacement normal
            const prev = row.previousElementSibling;
            if (!prev || !prev.classList || !prev.classList.contains('vt-row')) return; // 1re ligne → rien
            e.preventDefault();
            const text = row.textContent.slice(prefixLen);          // texte de la ligne, sans son horodatage
            const prevText = prev.textContent;
            const joinAt = prevText.length;
            const needsSpace = text && prevText && !/\s$/.test(prevText) && !/^\s/.test(text);
            prev.textContent = prevText + (needsSpace ? ' ' : '') + text;
            row.remove();
            edited = true;
            sync.refresh();
            sync.setFollow(false);
            const tn = prev.firstChild;                             // curseur au point de jonction
            if (tn) { const r = document.createRange(); r.setStart(tn, Math.min(joinAt, tn.length)); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
        }
    });

    return {
        element: pane,
        editEl: edit,
        sync,
        getPlayer: () => player,
        // À appeler APRÈS insertion dans le DOM (l'API YouTube exige un conteneur connecté).
        activate() { if (!player) player = createVideoPlayer(playerBox, videoSource, { onTime: sync.tick }); },
        destroy() { if (player) { player.destroy(); player = null; } }
    };
}
