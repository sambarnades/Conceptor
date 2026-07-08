/**
 * tutorial-modal.js — Centre d'aide / tutoriel de Caramel
 *
 * Modale « Tutoriel » ouvrable depuis le bouton « Tutoriel » du header (ou de
 * points d'entrée contextuels). Sommaire à gauche + contenu à droite, avec
 * recherche, navigation Précédent/Suivant et réaction au changement de langue.
 *
 * Le CONTENU vit dans des fichiers dédiés chargés à la demande :
 *   assets/data/tutorial/<lang>.json   (source de vérité FR ; repli FR si locale absente)
 * — pour ne pas alourdir les js/locales/*.json principaux ni la page d'accueil.
 * Les petits libellés d'UI (titre, Précédent/Suivant, recherche) restent dans
 * le système data-key classique (clés `tutorial_*` des js/locales/*.json).
 *
 * Le contenu JSON est rendu via un modèle de BLOCS typés (p, h, tip, warn,
 * plain, list, steps, table, shot, cta). Le texte n'est jamais injecté tel
 * quel : il est d'abord échappé (escapeHtml) puis on n'autorise QUE `**gras**`
 * (formatInline). Zéro HTML arbitraire → pas de vecteur XSS, même si une
 * traduction contient des chevrons.
 *
 * Usage :
 *   import { initTutorialModal, openTutorialModal } from './ui/tutorial-modal.js';
 *   initTutorialModal();                       // câble le bouton « Tutoriel »
 *   openTutorialModal();                       // 1er chapitre (ou dernier vu)
 *   openTutorialModal({ chapter: 'download' }); // ouverture ciblée (aide contextuelle)
 *
 * Mécanique reprise du centre d'aide de La Sucrerie (dépôt jumeau), adaptée à
 * la charte et aux modules de Caramel.
 */

import { t, translatePage, currentLang } from '../core/translation.js';
import { debugLog, setupModalAccessibility } from '../core/utils.js';

const MODAL_ID = 'tutorial-modal';
const LAST_CHAPTER_KEY = 'caramel.tutorial.last';

// Cache des contenus déjà chargés, par langue résolue (évite un re-fetch à
// chaque ouverture / changement de chapitre).
const contentCache = new Map(); // lang -> { chapters: [...] }

// État courant de la modale (une seule instance vivante).
const state = {
  chapters: [],
  index: 0,
  bound: false,
  pendingChapter: null,
  a11yCleanup: null
};

// ============================================================================
// Helpers PURS (aucun accès au DOM)
// ============================================================================

/**
 * Échappe les caractères HTML sensibles. Première barrière avant toute
 * insertion via innerHTML.
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Met en forme un texte de contenu : échappe le HTML, puis convertit la SEULE
 * syntaxe autorisée `**gras**` en <strong>. Rien d'autre n'est interprété.
 * @param {string} text
 * @returns {string} HTML sûr
 */
export function formatInline(text) {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Concatène le texte indexable d'un chapitre (titre + tous les textes de blocs)
 * en minuscules, pour la recherche dans le sommaire.
 * @param {object} chapter
 * @returns {string}
 */
export function buildSearchHaystack(chapter) {
  if (!chapter) return '';
  const parts = [chapter.title || ''];
  for (const block of chapter.blocks || []) {
    if (block.text) parts.push(block.text);
    if (Array.isArray(block.items)) parts.push(block.items.join(' '));
    if (Array.isArray(block.head)) parts.push(block.head.join(' '));
    if (Array.isArray(block.rows)) parts.push(block.rows.map(r => r.join(' ')).join(' '));
    if (block.alt) parts.push(block.alt);
  }
  return parts.join(' ').toLowerCase();
}

/**
 * Renvoie les IDs des chapitres correspondant à une requête de recherche.
 * Requête vide → tous les chapitres.
 * @param {Array} chapters
 * @param {string} query
 * @returns {string[]} liste d'IDs
 */
export function filterChapters(chapters, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return (chapters || []).map(c => c.id);
  return (chapters || [])
    .filter(c => buildSearchHaystack(c).includes(q))
    .map(c => c.id);
}

// ============================================================================
// Chargement du contenu (lazy, avec repli FR)
// ============================================================================

async function fetchTutorialJson(lang) {
  const candidates = [`assets/data/tutorial/${lang}.json`, `../assets/data/tutorial/${lang}.json`];
  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'default' });
      if (!res.ok) continue;
      return await res.json();
    } catch (_) { /* on tente le chemin suivant */ }
  }
  return null;
}

/**
 * Charge le contenu du tuto pour une langue, avec repli FR si la locale n'a pas
 * (encore) de fichier dédié. Mis en cache par langue demandée.
 * @param {string} lang
 * @returns {Promise<{chapters: Array}>}
 */
async function loadTutorial(lang) {
  if (contentCache.has(lang)) return contentCache.get(lang);

  let data = await fetchTutorialJson(lang);
  if (!data && lang !== 'fr') {
    debugLog('tutorial', `locale ${lang} absente → repli FR`);
    data = contentCache.get('fr') || await fetchTutorialJson('fr');
  }
  const safe = data && Array.isArray(data.chapters) ? data : { chapters: [] };
  contentCache.set(lang, safe);
  return safe;
}

// ============================================================================
// Icônes SVG (zéro emoji) — style stroke 24×24 aligné sur le reste du site.
// `icon` d'un chapitre = un NOM de cette table (pas un caractère), pour garder
// le JSON de contenu propre et traduisible.
// ============================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  home:    '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  search:  '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  eye:     '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  toolbox: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  grid:    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  heart:   '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  upload:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  pencil:  '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  rocket:  '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  bulb:    '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
  key:     '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  book:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  link:    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  flag:    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  globe:   '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  chat:    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  share:   '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  help:    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  // Icônes des encadrés
  warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  _fallback: '<circle cx="12" cy="12" r="9"/>'
};

/**
 * Construit un élément <svg> à partir d'un nom de la table ICONS.
 * @param {string} name
 * @param {number} [size=20]
 * @returns {SVGElement}
 */
export function svgIcon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[name] || ICONS._fallback;
  return svg;
}

/**
 * Icône d'un chapitre. Si `icon` est un chemin d'image (…svg/png/webp), on rend
 * un <img> (utile pour un logo de marque en couleurs) ; sinon on retombe sur
 * l'icône SVG monochrome nommée de la table ICONS.
 * @param {string} icon
 * @param {number} [size=20]
 * @returns {HTMLElement|SVGElement}
 */
export function makeChapterIcon(icon, size = 20) {
  if (typeof icon === 'string' && /\.(svg|png|webp)$/i.test(icon)) {
    const img = document.createElement('img');
    img.className = 'tutorial-icon-img';
    img.src = icon;
    img.alt = '';
    img.width = size;
    img.height = size;
    img.setAttribute('aria-hidden', 'true');
    return img;
  }
  return svgIcon(icon, size);
}

// ============================================================================
// Rendu des blocs → DOM
// ============================================================================

/** Crée un paragraphe enrichi. */
function makeRichP(text, className) {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.innerHTML = formatInline(text);
  return p;
}

/** Encadré typé avec icône SVG (Astuce / Attention / En clair). */
function makeCallout(kind, text) {
  const conf = {
    tip:   { cls: 'tutorial-callout--tip',   icon: 'bulb',    labelKey: 'tutorial_callout_tip' },
    warn:  { cls: 'tutorial-callout--warn',  icon: 'warning', labelKey: 'tutorial_callout_warn' },
    plain: { cls: 'tutorial-callout--plain', icon: 'info',    labelKey: 'tutorial_callout_plain' }
  }[kind];
  const box = document.createElement('div');
  box.className = `tutorial-callout ${conf.cls}`;
  const icon = document.createElement('span');
  icon.className = 'tutorial-callout__icon';
  icon.appendChild(svgIcon(conf.icon, 18));
  const body = document.createElement('div');
  body.className = 'tutorial-callout__body';
  const label = document.createElement('span');
  label.className = 'tutorial-callout__label';
  label.textContent = t(conf.labelKey);
  const p = document.createElement('p');
  p.className = 'tutorial-callout__text';
  p.innerHTML = formatInline(text);
  body.append(label, p);
  box.append(icon, body);
  return box;
}

/** Liste (à puces) ou étapes (numérotées). */
function makeList(items, ordered) {
  const list = document.createElement(ordered ? 'ol' : 'ul');
  list.className = ordered ? 'tutorial-steps' : 'tutorial-list';
  for (const item of items || []) {
    const li = document.createElement('li');
    li.innerHTML = formatInline(item);
    list.appendChild(li);
  }
  return list;
}

/** Tableau responsive (head + rows). */
function makeTable(head, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'tutorial-table-wrap';
  const table = document.createElement('table');
  table.className = 'tutorial-table';
  if (Array.isArray(head) && head.length) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const cell of head) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.innerHTML = formatInline(cell);
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tbody = document.createElement('tbody');
  for (const row of rows || []) {
    const tr = document.createElement('tr');
    (row || []).forEach((cell, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      td.innerHTML = formatInline(cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/**
 * Capture d'écran. Dégradation gracieuse : tant que l'image n'existe pas (ou
 * échoue à charger), on bascule sur un cadre pointillé portant la légende.
 */
function makeShot(src, alt) {
  const fig = document.createElement('figure');
  fig.className = 'tutorial-shot';
  const img = document.createElement('img');
  img.className = 'tutorial-shot__img';
  img.loading = 'lazy';
  img.alt = alt || '';
  img.src = src;
  img.addEventListener('error', () => { fig.classList.add('tutorial-shot--missing'); });
  const cap = document.createElement('figcaption');
  cap.className = 'tutorial-shot__caption';
  cap.textContent = alt || '';
  fig.append(img, cap);
  return fig;
}

/**
 * Valide une URL de contenu : on n'autorise QUE http(s) (anti-`javascript:`,
 * `data:`…). Renvoie l'URL si sûre, sinon null.
 * @param {string} href
 * @returns {string|null}
 */
export function safeHref(href) {
  if (typeof href !== 'string') return null;
  return /^https?:\/\//i.test(href.trim()) ? href.trim() : null;
}

/**
 * Bouton d'action (call-to-action) : un lien externe mis en avant, avec un
 * logo optionnel (chemin d'image). Le href est validé (http/https uniquement) ;
 * un href non sûr → aucun rendu (null).
 */
function makeCta(href, label, icon) {
  const url = safeHref(href);
  if (!url) return null;
  const a = document.createElement('a');
  a.className = 'tutorial-cta';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (icon) {
    const img = document.createElement('img');
    img.className = 'tutorial-cta__logo';
    img.src = icon;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    a.appendChild(img);
  }
  const span = document.createElement('span');
  span.className = 'tutorial-cta__label';
  span.textContent = label || url;
  a.appendChild(span);
  return a;
}

/**
 * Rend un bloc de contenu en élément DOM (ou null si type inconnu).
 * @param {object} block
 * @returns {HTMLElement|null}
 */
export function renderBlock(block) {
  if (!block || !block.type) return null;
  switch (block.type) {
    case 'p':     return makeRichP(block.text, 'tutorial-p');
    case 'h': {
      const h = document.createElement('h3');
      h.className = 'tutorial-subhead';
      h.innerHTML = formatInline(block.text);
      return h;
    }
    case 'tip':   return makeCallout('tip', block.text);
    case 'warn':  return makeCallout('warn', block.text);
    case 'plain': return makeCallout('plain', block.text);
    case 'list':  return makeList(block.items, false);
    case 'steps': return makeList(block.items, true);
    case 'table': return makeTable(block.head, block.rows);
    case 'shot':  return makeShot(block.src, block.alt);
    case 'cta':   return makeCta(block.href, block.label, block.icon);
    default:      return null;
  }
}

/**
 * Construit le panneau d'un chapitre (titre + blocs).
 * @param {object} chapter
 * @returns {HTMLElement}
 */
export function renderChapter(chapter) {
  const article = document.createElement('article');
  article.className = 'tutorial-chapter';

  const head = document.createElement('h2');
  head.className = 'tutorial-chapter__title';
  if (chapter.icon) {
    const ic = document.createElement('span');
    ic.className = 'tutorial-chapter__icon';
    ic.appendChild(makeChapterIcon(chapter.icon, 26));
    head.appendChild(ic);
  }
  head.appendChild(document.createTextNode(chapter.title || ''));
  article.appendChild(head);

  for (const block of chapter.blocks || []) {
    const el = renderBlock(block);
    if (el) article.appendChild(el);
  }
  return article;
}

// ============================================================================
// Orchestration de la modale
// ============================================================================

function els() {
  const modal = document.getElementById(MODAL_ID);
  return {
    modal,
    toc:        modal?.querySelector('#tutorial-toc'),
    panel:      modal?.querySelector('#tutorial-panel'),
    search:     modal?.querySelector('#tutorial-search'),
    noResults:  modal?.querySelector('#tutorial-no-results'),
    prev:       modal?.querySelector('#tutorial-prev'),
    next:       modal?.querySelector('#tutorial-next'),
    progress:   modal?.querySelector('#tutorial-progress'),
    close:      modal?.querySelector('#tutorial-close')
  };
}

function rememberChapter(id) {
  try { localStorage.setItem(LAST_CHAPTER_KEY, id); } catch (_) { /* ignore */ }
}
function recallChapterIndex() {
  try {
    const id = localStorage.getItem(LAST_CHAPTER_KEY);
    const i = state.chapters.findIndex(c => c.id === id);
    return i >= 0 ? i : 0;
  } catch (_) { return 0; }
}

/** (Re)construit le sommaire à partir de state.chapters. */
function buildToc() {
  const { toc } = els();
  if (!toc) return;
  toc.textContent = '';
  state.chapters.forEach((chapter, i) => {
    const li = document.createElement('li');
    li.className = 'tutorial__toc-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tutorial__toc-btn';
    btn.dataset.chapterId = chapter.id;
    btn.dataset.index = String(i);
    const icon = document.createElement('span');
    icon.className = 'tutorial__toc-icon';
    icon.appendChild(makeChapterIcon(chapter.icon, 18));
    const label = document.createElement('span');
    label.className = 'tutorial__toc-label';
    label.textContent = chapter.title || '';
    btn.append(icon, label);
    li.appendChild(btn);
    toc.appendChild(li);
  });
}

/** Affiche le chapitre `index` (rendu, état actif, nav, animation). */
function showChapter(index, { focusPanel = false } = {}) {
  const { panel, toc, prev, next, progress } = els();
  if (!panel || !state.chapters.length) return;
  state.index = Math.max(0, Math.min(index, state.chapters.length - 1));
  const chapter = state.chapters[state.index];

  // Contenu (avec petite animation d'entrée, neutralisée par reduced-motion CSS)
  panel.textContent = '';
  const article = renderChapter(chapter);
  article.classList.add('tutorial-chapter--enter');
  panel.appendChild(article);
  // Force un reflow puis retire la classe → transition jouée par le CSS.
  requestAnimationFrame(() => article.classList.remove('tutorial-chapter--enter'));
  panel.scrollTop = 0;

  // Surlignage du sommaire
  toc?.querySelectorAll('.tutorial__toc-btn').forEach(b => {
    const on = b.dataset.chapterId === chapter.id;
    b.classList.toggle('tutorial__toc-btn--active', on);
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });

  // Navigation bas
  if (prev) prev.disabled = state.index === 0;
  if (next) next.disabled = state.index === state.chapters.length - 1;
  if (progress) progress.textContent = `${state.index + 1} / ${state.chapters.length}`;

  rememberChapter(chapter.id);
  if (focusPanel) panel.focus();
}

/** Applique la recherche : masque les entrées du sommaire non concernées. */
function applySearch(query) {
  const { toc, noResults } = els();
  if (!toc) return;
  const matchIds = new Set(filterChapters(state.chapters, query));
  let visible = 0;
  toc.querySelectorAll('.tutorial__toc-item').forEach(li => {
    const id = li.querySelector('.tutorial__toc-btn')?.dataset.chapterId;
    const show = matchIds.has(id);
    li.hidden = !show;
    if (show) visible++;
  });
  if (noResults) noResults.hidden = visible !== 0;
}

/** Charge la langue courante et rend le sommaire + le chapitre de départ. */
async function loadAndRender() {
  const { panel, search } = els();
  if (panel) {
    panel.innerHTML = '<div class="tutorial__loading" role="status" aria-live="polite"><span class="tutorial__spinner" aria-hidden="true"></span></div>';
  }
  const lang = currentLang || 'fr';
  const data = await loadTutorial(lang);
  state.chapters = data.chapters || [];

  buildToc();
  if (search) search.value = '';
  applySearch('');

  let startIndex = 0;
  if (state.pendingChapter) {
    const i = state.chapters.findIndex(c => c.id === state.pendingChapter);
    startIndex = i >= 0 ? i : 0;
    state.pendingChapter = null;
  } else {
    startIndex = recallChapterIndex();
  }
  showChapter(startIndex);
}

function closeModal() {
  const { modal } = els();
  if (!modal) return;
  if (state.a11yCleanup) { state.a11yCleanup(); state.a11yCleanup = null; }
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

/** Attache les écouteurs une seule fois (délégation sur la modale). */
function ensureBound() {
  if (state.bound) return;
  const { modal, toc, search, prev, next, close } = els();
  if (!modal) return;

  // Sélection d'un chapitre dans le sommaire
  toc?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tutorial__toc-btn');
    if (!btn) return;
    showChapter(Number(btn.dataset.index) || 0, { focusPanel: true });
  });

  // Recherche
  search?.addEventListener('input', () => applySearch(search.value));

  // Navigation Précédent / Suivant
  prev?.addEventListener('click', () => showChapter(state.index - 1, { focusPanel: true }));
  next?.addEventListener('click', () => showChapter(state.index + 1, { focusPanel: true }));

  // Fermeture (croix + clic sur le fond)
  close?.addEventListener('click', closeModal);
  modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

  // Flèches gauche/droite pour naviguer (hors champ de recherche)
  modal.addEventListener('keydown', (e) => {
    if (e.target === search) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); showChapter(state.index - 1, { focusPanel: true }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showChapter(state.index + 1, { focusPanel: true }); }
  });

  // Changement de langue pendant que la modale est ouverte → recharge le contenu
  window.addEventListener('caramel:language-changed', () => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      translatePage(modal);
      // Garde le chapitre courant si possible
      const currentId = state.chapters[state.index]?.id;
      state.pendingChapter = currentId || null;
      loadAndRender();
    }
  });

  state.bound = true;
}

/**
 * Ouvre la modale de tutoriel.
 * @param {object} [opts]
 * @param {string} [opts.chapter] - id de chapitre à ouvrir directement (aide contextuelle)
 * @param {HTMLElement} [opts.triggerElement] - élément à re-focus à la fermeture
 */
export function openTutorialModal({ chapter = null, triggerElement = null } = {}) {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) {
    debugLog('tutorial', '#tutorial-modal absent');
    return;
  }
  ensureBound();
  // Les libellés statiques (titre, Précédent/Suivant, placeholder) suivent la
  // langue via data-key ; on rafraîchit au cas où la modale aurait été montée
  // avant la résolution i18n.
  translatePage(modal);
  state.pendingChapter = chapter;

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  // Accessibilité : focus trap + Escape + restauration du focus au déclencheur.
  // setupModalAccessibility mémorise l'élément actif à l'ouverture (le bouton
  // « Tutoriel ») et lui rend le focus via sa fonction de cleanup — d'où le
  // paramètre `triggerElement`, conservé pour l'API d'ouverture contextuelle.
  if (state.a11yCleanup) { state.a11yCleanup(); }
  state.a11yCleanup = setupModalAccessibility(modal, {
    onClose: closeModal,
    focusSelector: '#tutorial-search'
  });

  loadAndRender();
}

/**
 * Câble le bouton « Tutoriel » du header sur l'ouverture de la modale.
 * À appeler une fois au démarrage (depuis main.js).
 */
export function initTutorialModal() {
  const btn = document.getElementById('help-button');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openTutorialModal({ triggerElement: btn });
  });
}
