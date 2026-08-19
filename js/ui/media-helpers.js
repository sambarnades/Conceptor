/**
 * @file Helpers média partagés par les sections « Vidéo interactive » et
 * « Image interactive » de la barre latérale.
 *
 * Ces fonctions sont PURES vis-à-vis de `ui.js` : elles ne lisent aucun état ni
 * aucune référence DOM de ce module. Elles vivaient auparavant au milieu de ses
 * 4247 lignes, entre deux sections de 400+ lignes, ce qui les rendait invisibles
 * et donnait l'illusion d'un couplage qui n'existait pas.
 */

import { translations } from '../core/translation.js';
import { debugLog } from '../core/utils.js';
import { escapeHtml } from '../core/escape.js';
import { generatePrompts, getTranscriptAnchors } from '../services/prompt-generator.js';
import { snapInteractions } from '../h5p/processors/interactive-video-snap.js';

/**
 * Signature du contexte pédagogique pertinent pour la VISION (Rapide : qui/quoi ; Avancé :
 * +niveau/nombre). Sert à détecter un changement de contexte qui rendrait caduques les zones
 * détectées (la vision est contextuelle). N'inclut PAS l'OCR/RAG, sans effet sur l'Image interactive.
 * @returns {string}
 */
export function visionContextSig() {
    const g = (id) => (document.getElementById(id)?.value || '').trim();
    return `${g('qui')}|${g('quoi')}|${g('niveau')}|${g('nombreQuestions')}`;
}

/**
 * Échappe le HTML du contenu statique des popovers média.
 * Anciennement une copie locale qui n'échappait PAS l'apostrophe ; délègue
 * désormais au canonique de `core/escape.js`.
 * @param {*} s
 * @returns {string}
 */
export const escVid = escapeHtml;

/**
 * Ouvre un popover compact (fond assombri, carte blanche arrondie), au-dessus de la modale
 * d'activité. Réutilisé par l'aide « ? » et par « Voir / coller la transcription ».
 * Escape + piège de focus gérés en phase de CAPTURE pour ne PAS fermer la modale parente.
 * @param {string} titleText - Titre affiché dans l'en-tête.
 * @param {string} iconClass - Classe Font Awesome de l'icône de titre.
 * @param {HTMLElement} bodyEl - Contenu du corps.
 * @param {{wide?:boolean}} [opts] - wide : popover large (double panneau transcription).
 * @returns {{close:Function, el:HTMLElement}}
 */
export function openVideoPopover(titleText, iconClass, bodyEl, opts = {}) {
    document.querySelectorAll('.video-popover, .video-popover__backdrop').forEach(n => n.remove());
    const prevFocus = document.activeElement;

    const backdrop = document.createElement('div');
    backdrop.className = 'video-popover__backdrop';

    const pop = document.createElement('div');
    pop.className = 'video-popover' + (opts && opts.wide ? ' video-popover--wide' : '');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'video-popover__header';
    const title = document.createElement('span');
    title.className = 'video-popover__title';
    title.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
    title.append(document.createTextNode(' ' + titleText));
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'video-popover__close';
    closeBtn.setAttribute('aria-label', translations.help_download_close || 'Fermer');
    closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'video-popover__body';
    body.appendChild(bodyEl);

    pop.append(header, body);
    document.body.append(backdrop, pop);

    const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
        if (e.key === 'Tab') {
            const f = [...pop.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (!pop.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
            else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            e.stopPropagation();
        }
    };
    let closed = false;
    function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey, true);
        if (typeof opts.onClose === 'function') { try { opts.onClose(); } catch { /* nettoyage best-effort */ } }
        pop.remove();
        backdrop.remove();
        if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    }
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => { (pop.querySelector(FOCUSABLE) || closeBtn).focus(); }, 50);
    return { close, el: pop };
}

/**
 * Aligne le bord DROIT du bouton « ? » (barre lien vidéo) sur le bord GAUCHE du bouton
 * « Générer en un clic » (en-tête). Les deux sont sur des rangées différentes et la largeur du
 * bouton Générer varie selon la langue → alignement calculé à l'exécution (rejoué au resize).
 * Sur petit écran (en-tête empilé), on neutralise l'alignement.
 * @param {HTMLElement} root
 */
export function alignVideoHelpButton(root) {
    if (!root) return;
    const section = root.querySelector('.video-url-section');
    const row = section ? section.querySelector('.video-url-row') : null;
    const helpBtn = section ? section.querySelector('.video-help-btn') : null;
    const field = section ? section.querySelector('.video-url-field') : null;
    const genGroup = root.querySelector('.top-controls-container .generation-button-group');
    const desc = root.querySelector('.modal-tuto-content > p');
    if (row) row.style.marginRight = '0px';   // réinitialiser avant de mesurer la position naturelle
    if (desc) desc.style.marginRight = '0px';
    if (window.innerWidth <= 768) return;      // en-tête empilé : pas d'alignement cross-rangée
    // 1. La barre (+ bouton « ? ») s'arrête avant le bouton « générer en un clic ».
    if (row && helpBtn && genGroup) {
        const delta = helpBtn.getBoundingClientRect().right - genGroup.getBoundingClientRect().left;
        if (delta > 1) row.style.marginRight = Math.round(delta) + 'px';
    }
    // 2. La description s'aligne sur la MÊME largeur que la barre (champ) juste en dessous : on lui
    //    donne la même marge droite pour que son bord droit coïncide avec celui du champ.
    if (desc && field && desc.parentElement) {
        const parentRight = desc.parentElement.getBoundingClientRect().right; // bord droit de modal-tuto-content
        const fieldRight = field.getBoundingClientRect().right;               // bord droit de la barre (après étape 1)
        const d = parentRight - fieldRight;
        if (d > 1) desc.style.marginRight = Math.round(d) + 'px';
    }
}

/**
 * Construit l'objet `segments` pour le prompt à partir d'une transcription normalisée :
 * segments timés tels quels, ou — si la transcription n'est pas timée (texte brut collé) —
 * un unique bloc couvrant toute la durée (l'IA répartira les questions).
 * @param {Object} transcript - Transcription normalisée (cf. video-transcript.js).
 * @param {Object} detect - Résultat de detectVideo() (pour la durée).
 * @returns {Array<{start:number,end:number,text:string}>}
 */
export function transcriptToSegments(transcript, detect) {
    if (transcript && Array.isArray(transcript.segments) && transcript.segments.length) {
        return transcript.segments;
    }
    if (transcript && transcript.text) {
        return [{ start: 0, end: (detect && detect.duration) || 0, text: transcript.text }];
    }
    return [];
}

/**
 * Cale déterministiquement les `timestamp` des interactions générées AVANT la création du .h5p
 * (WYSIWYG : le JSON affiché = celui produit). Chaque `timestamp` est calé sur l'horodatage RÉEL le
 * plus proche (mêmes ancres `[mm:ss]` que celles montrées au modèle) → neutralise les modèles qui
 * CALCULENT un instant intermédiaire (sinon pause en milieu de phrase) ; les timestamps au-delà de
 * la durée sont écartés (hallucinations). C'est la SEULE normalisation : le nombre de questions
 * n'est JAMAIS plafonné — le prompt recommande un nombre, mais le contenu généré est conservé tel
 * quel (l'enseignant supprime à la main ce qu'il ne veut pas). Vaut pour les deux flux (un clic ET
 * collage d'un JSON d'IA externe). Mute `parsed` en place. Sans transcription timée, ne touche à rien.
 * @param {Object} parsed - JSON intermédiaire parsé (champ `interactions`).
 * @param {Object} transcript - Transcription normalisée (segments).
 * @param {Object} detect - Résultat de detectVideo() (pour la durée d'un bloc non timé).
 */
export function snapVideoTimestamps(parsed, transcript, detect) {
    if (!parsed || !Array.isArray(parsed.interactions) || !parsed.interactions.length) return;
    const segs = transcriptToSegments(transcript, detect);
    if (!segs.length) return;
    const anchors = getTranscriptAnchors(segs);
    if (!anchors.length) return;
    const maxDuration = (detect && Number(detect.duration) > 0) ? Number(detect.duration) : null;

    const snap = snapInteractions(parsed.interactions, anchors, { maxDuration });
    parsed.interactions = snap.interactions;
    debugLog('InteractiveVideo', 'Snap timestamps (ui, sans plafond)', snap.report);
}
