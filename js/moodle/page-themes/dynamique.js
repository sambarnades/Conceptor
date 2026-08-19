/**
 * @file Thème « Couleurs dynamiques » pour l'activité Page Moodle/Éléa.
 *
 * Ce module autonome contient les 18 renderers de blocs avec une palette
 * vive et variée (vert forêt, orange, bleu océan, rose brique).
 * Conçu pour un rendu coloré et engageant, adapté aux jeunes élèves,
 * tout en restant conforme RGAA (ratio de contraste 4.5:1+ minimum).
 *
 * Caractéristiques :
 *   - Palette à 4 couleurs vives (vert/orange/bleu/rose)
 *   - Coins très arrondis (border-radius 16px)
 *   - Pas d'emoji
 *   - Pas d'ombre portée
 *   - Conforme RGAA (ratio 4.5:1+ sur tous les textes)
 *
 * Signature des renderers : (data, ctx) => Element
 *   - data : données du bloc (block.data)
 *   - ctx  : { formatTextToHtml, escapeHtmlTags, jsonData }
 *
 * @version 1.0.0
 * @module page-themes/dynamique
 */

// Validation de schéma des URLs interpolées en href (anti `javascript:`) —
// en complément de l'échappement HTML (ctx.escapeHtmlTags), pas à sa place.
import { safeTag as _safeTag } from './shared.js';
import { sanitizeUrl } from '../../core/utils.js';

// =========================================================================
// Palette Couleurs dynamiques — RGAA conforme (ratio 4.5:1+)
// =========================================================================
const TEXT_BODY         = '#1b1b1b';
const TEXT_SECONDARY    = '#333333';
const TEXT_MUTED        = '#555555';
const TEXT_CAPTION      = '#333333';
const TEXT_DARK         = '#1b1b1b';

const PRIMARY           = '#0b6e4f';    // vert forêt (ratio 6.4:1)
const SECONDARY_BORDER  = '#e85d04';    // orange vif (bordures uniquement)
const SECONDARY_TEXT    = '#b54a00';    // orange foncé pour texte (ratio 5.7:1)
const ACCENT            = '#9b2226';    // rouge brique (ratio 8.3:1)
const INFO              = '#006699';    // bleu océan foncé (AA : ≥5.4:1 sur fond bleu clair)

const HEADING_PRIMARY   = '#0b6e4f';

const BG_PAGE           = '#ffffff';
const BG_GREEN          = '#e8f5e9';
const BG_ORANGE         = '#fff3e0';
const BG_BLUE           = '#e3f2fd';
const BG_PINK           = '#fce4ec';

const BORDER_LIGHT      = '#d0d0d0';
const BORDER_SUBTLE     = '#e0e0e0';

const GRADIENT_BAR      = `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY_BORDER} 50%, ${INFO} 100%)`;

const NAV_PILL_BG       = PRIMARY;
const NAV_PILL_TEXT     = '#ffffff';

const LINK_COLOR        = '#0b6e4f';
const STAT_VALUE_COLOR  = '#9b2226';

const CHIP_VARIANTS = [
    { bg: '#e8f5e9', border: '#0b6e4f', text: '#0b6e4f' },
    { bg: '#fff3e0', border: '#e85d04', text: '#b54a00' },
    { bg: '#e3f2fd', border: '#006699', text: '#006699' },
    { bg: '#fce4ec', border: '#9b2226', text: '#9b2226' }
];

const QUOTE_BORDER      = '#0b6e4f';

const CALLOUT = {
    objectif: { borderColor: '#0b6e4f', bg: '#e8f5e9', borderOuter: '#a5d6a7' },
    savoir:   { borderColor: '#e85d04', bg: '#fff3e0', borderOuter: '#ffcc80' },
    alerte:   { borderColor: '#9b2226', bg: '#fce4ec', borderOuter: '#ef9a9a' }
};

// Libellés accessibles des callouts (RGAA 3.1 : ne pas coder le type par la
// seule couleur). L'icône est décorative (aria-hidden) ; le texte porte le sens.
const CALLOUT_META = {
    objectif: { icon: '🎯', key: 'page_callout_objectif', fallback: 'Objectif' },
    savoir:   { icon: '💡', key: 'page_callout_savoir',   fallback: 'À savoir' },
    alerte:   { icon: '⚠️', key: 'page_callout_alerte',   fallback: 'Attention' }
};

const CARD_VARIANTS = [
    { bg: '#e8f5e9', border: '#0b6e4f', heading: '#0b6e4f' },
    { bg: '#fff3e0', border: '#e85d04', heading: '#b54a00' },
    { bg: '#e3f2fd', border: '#006699', heading: '#006699' },
    { bg: '#fce4ec', border: '#9b2226', heading: '#9b2226' }
];

const STAT_BORDER_COLORS = ['#0b6e4f', '#e85d04', '#006699', '#9b2226'];

const MYTHS     = { bg: '#fff3e0', border: '#e85d04', heading: '#b54a00' };
const REALITIES = { bg: '#e8f5e9', border: '#0b6e4f', heading: '#0b6e4f' };

// =========================================================================
// Utilitaire interne : détection sûre de balises <p> dans le HTML produit
// par formatTextToHtml(). Si le HTML contient déjà des <p>, on utilise un
// <div> conteneur pour éviter l'imbrication invalide <p><p>…</p></p>.
// =========================================================================
// `_safeTag` vit désormais dans ./shared.js (il était byte-identique dans les 4 thèmes).

// =========================================================================
// Renderers (18 blocs)
// =========================================================================

/**
 * #01 — En-tête héro avec fond vert forêt et barre dégradée tricolore.
 * Titre du héros : balise native de niveau ctx.heroLevel en contexte standalone
 * (preview modale, .html autonome), ou bandeau décoratif en export Éléa/Moodle
 * (ctx.heroLevel = null) car la plateforme pose déjà le <h1> de l'activité.
 * Titre injecté en textContent (pas innerHTML) pour résister au nettoyage Éléa.
 */
function renderHeroHeader(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; text-align:center; background:#0b6e4f !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; border-radius:20px; padding:22px;');

    // Titre principal du héros. En contexte standalone (preview modale, fichier
    // .html autonome), on émet une balise de titre native de niveau ctx.heroLevel.
    // En export Éléa/Moodle, ctx.heroLevel est null : la plateforme pose déjà le
    // <h1> de l'activité au-dessus du contenu → bandeau décoratif (pas de doublon
    // de niveau-1, RGAA 9.1). textContent (pas innerHTML) pour résister au
    // nettoyage Éléa, et balise native préférée à role="heading" (ARIA12).
    const headerTitle = (ctx.jsonData && ctx.jsonData.title) ? ctx.jsonData.title : data.title;
    let heading;
    if (ctx.heroLevel) {
        heading = document.createElement('h' + ctx.heroLevel);
    } else {
        heading = document.createElement('div');
    }
    // Hook stable pour la rétro-ingénierie HTML→blocs (parser Sucrerie) : permet
    // de retrouver le titre du héros quelle que soit la balise (h1 ou div décoratif).
    heading.className = 'caramel-hero-title';
    heading.setAttribute('style', 'margin:0 0 10px 0; font-size:2rem; font-weight:700; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    heading.textContent = headerTitle || '';
    section.appendChild(heading);

    // Barre dégradée tricolore (vert → orange → bleu)
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('style', `height:6px; width:240px; margin:8px auto 0 auto; border-radius:6px; background:${GRADIENT_BAR};`);
    section.appendChild(bar);

    // Sous-titre optionnel
    const hasSubtitle = data.subtitle && String(data.subtitle).trim();
    if (hasSubtitle) {
        const html = ctx.formatTextToHtml(data.subtitle);
        const temp = document.createElement('div');
        temp.innerHTML = html;
        let nodeToAppend = null;
        if (temp.childElementCount === 1 && temp.firstElementChild.tagName === 'P') {
            nodeToAppend = temp.firstElementChild;
            const pStyle = nodeToAppend.getAttribute('style') || '';
            nodeToAppend.setAttribute('style', pStyle + '; margin:12px 0 0 0; color:rgba(255,255,255,0.9) !important; -webkit-text-fill-color:rgba(255,255,255,0.9) !important;');
        } else {
            nodeToAppend = document.createElement('p');
            nodeToAppend.setAttribute('style', 'margin:12px 0 0 0; color:rgba(255,255,255,0.9) !important; -webkit-text-fill-color:rgba(255,255,255,0.9) !important;');
            nodeToAppend.innerHTML = html;
        }
        section.appendChild(nodeToAppend);
    }

    return section;
}

/**
 * #02 — Sommaire de navigation avec pilules vertes arrondies.
 */
function renderNavSummary(data, ctx) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', ctx.t('simulator_page_summary', 'Sommaire'));
    nav.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:12px;`);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="display:inline-block; padding:8px 14px; border-radius:999px; color:${NAV_PILL_TEXT}; text-decoration:none; font-weight:600; background:${NAV_PILL_BG}; -webkit-text-fill-color:${NAV_PILL_TEXT};">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
}

/**
 * #03 — Repères historiques en grille de cartes colorées (rotation 4 variantes).
 */
function renderHistoReperes(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:12px;');

    data.cards.forEach((card, cardIdx) => {
        const cv = CARD_VARIANTS[cardIdx % CARD_VARIANTS.length];
        const cardDiv = document.createElement('div');
        cardDiv.setAttribute('style', `background:${cv.bg}; border:2px solid ${cv.border}; border-radius:16px; padding:12px;`);
        cardDiv.innerHTML = `<${ctx.headingTag(1)} style="margin:0 0 6px 0; font-size:1.05rem; color:${cv.heading};">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}><p style="margin:0;">${ctx.formatTextToHtml(card.text)}</p>`;
        grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #04 — Ensemble de callouts (objectif / savoir / alerte) en grille.
 * Trois couleurs distinctes : vert, orange, rouge brique.
 */
function renderCalloutSet(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap:12px;');

    data.callouts.forEach(callout => {
        const type = CALLOUT_META[callout.type] ? callout.type : 'objectif';
        const cs = CALLOUT[type];
        const meta = CALLOUT_META[type];
        const div = document.createElement('div');
        div.setAttribute('style', `border:2px solid ${cs.borderOuter}; border-left:6px solid ${cs.borderColor}; background:${cs.bg}; border-radius:16px; padding:12px;`);
        // Marqueur sémantique pour la rétro-ingénierie.
        if (callout.type) div.setAttribute('data-callout-type', callout.type);
        // Accessibilité RGAA 3.1 : libellé textuel visible (+ icône décorative).
        div.innerHTML =
            `<p style="margin:0 0 6px 0; font-weight:700;"><span aria-hidden="true">${meta.icon} </span>${ctx.escapeHtmlTags(ctx.t(meta.key, meta.fallback))}</p>` +
            `<p style="margin:0;">${ctx.formatTextToHtml(callout.text)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #05 — Cartes de statistiques avec bordure haute colorée (rotation).
 */
function renderStatsCards(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px;');

    data.stats.forEach((stat, statIdx) => {
        const borderColor = STAT_BORDER_COLORS[statIdx % STAT_BORDER_COLORS.length];
        const div = document.createElement('div');
        div.setAttribute('style', `border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:14px; text-align:center; border-top:4px solid ${borderColor};`);
        div.innerHTML = `<p style="margin:2px 0 0 0; font-size:2rem; font-weight:800; color:${STAT_VALUE_COLOR};">${ctx.formatTextToHtml(stat.value)}</p><p style="margin:2px 0 0 0; color:${TEXT_MUTED};">${ctx.formatTextToHtml(stat.label)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #06 / #10 — Tableau avec thead vert foncé et lignes alternées vert léger.
 * Texte blanc forcé dans l'en-tête via -webkit-text-fill-color.
 */
function renderTable(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const table = document.createElement('table');
    table.setAttribute('style', 'width:100%; border-collapse:collapse; font-size:0.98rem;');

    // Caption avec styles forcés pour Éléa
    const caption = document.createElement('caption');
    caption.setAttribute('style', `text-align:left; padding:6px 0; color:${TEXT_MUTED}; font-weight:normal; font-size:0.9rem;`);
    caption.innerHTML = ctx.formatTextToHtml(data.caption);
    table.appendChild(caption);

    // En-tête — fond vert foncé, texte blanc forcé
    const thead = document.createElement('thead');
    thead.setAttribute('style', `background:${PRIMARY} !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;`);
    const headRow = document.createElement('tr');
    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.setAttribute('style', `text-align:left; padding:10px; border-bottom:2px solid ${PRIMARY}; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;`);
        th.innerHTML = ctx.formatTextToHtml(header);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Corps — alternance de fond vert léger
    const tbody = document.createElement('tbody');
    data.rows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        if (rowIdx % 2 === 1) tr.setAttribute('style', `background:${BG_GREEN};`);
        row.forEach((cell, cellIdx) => {
            // RGAA 5.7 : 1re colonne = en-tête de ligne (lexique/comparaison).
            const cellEl = document.createElement(cellIdx === 0 ? 'th' : 'td');
            if (cellIdx === 0) cellEl.scope = 'row';
            cellEl.setAttribute('style', `padding:10px; border-bottom:1px solid ${BORDER_SUBTLE};${cellIdx === 0 ? ' text-align:left; font-weight:600;' : ''}`);
            cellEl.innerHTML = ctx.formatTextToHtml(cell);
            tr.appendChild(cellEl);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    return section;
}

/**
 * #07 — Glossaire en chips rondes colorées (rotation 4 variantes).
 */
function renderGlossaryChips(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px;');

    data.chips.forEach((chip, chipIdx) => {
        const cv = CHIP_VARIANTS[chipIdx % CHIP_VARIANTS.length];
        const li = document.createElement('li');
        li.innerHTML = `<span style="display:inline-block; padding:6px 12px; border-radius:999px; background:${cv.bg}; border:2px solid ${cv.border}; color:${cv.text}; font-weight:600;">${ctx.formatTextToHtml(chip)}</span>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

/**
 * #08 — Grille de fiches illustrées avec bordure haute colorée (rotation).
 */
function renderMonumentsGrid(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:18px;');

    data.cards.forEach((card, cardIdx) => {
        const borderColor = STAT_BORDER_COLORS[cardIdx % STAT_BORDER_COLORS.length];
        const article = document.createElement('article');
        article.setAttribute('style', `background:${BG_PAGE}; border:2px solid ${BORDER_LIGHT}; border-radius:16px; overflow:hidden; border-top:4px solid ${borderColor};`);
        article.innerHTML = `
            <figure style="margin:0;">
                <img src="${ctx.escapeHtmlTags(card.img_src)}" alt="${ctx.escapeHtmlTags(card.img_alt || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;">
                <figcaption style="padding:8px; font-size:0.9rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(card.caption)}</figcaption>
            </figure>
            <div style="padding:12px;">
                <${ctx.headingTag(1)} style="margin:0 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.05rem;">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}>
                <p style="margin:0;">${ctx.formatTextToHtml(card.text)}</p>
            </div>
        `;
        grid.appendChild(article);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #09 — Comparaison de deux figures côte à côte.
 */
function renderFiguresComparison(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    {
        // Titre du bloc — défaut « Comparaison » si l'IA n'en fournit pas.
        const h2 = document.createElement(ctx.headingTag(0));
        h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
        h2.innerHTML = ctx.formatTextToHtml(data.title || ctx.t('page_figures_title', 'Comparaison'));
        section.appendChild(h2);
    }

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px;');

    if (data.left) {
        const leftFigure = document.createElement('figure');
        leftFigure.setAttribute('style', `margin:0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; overflow:hidden;`);
        leftFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.left.img_src)}" alt="${ctx.escapeHtmlTags(data.left.img_alt || data.left.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.left.caption || '')}</figcaption>`;
        grid.appendChild(leftFigure);
    }

    if (data.right) {
        const rightFigure = document.createElement('figure');
        rightFigure.setAttribute('style', `margin:0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; overflow:hidden;`);
        rightFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.right.img_src)}" alt="${ctx.escapeHtmlTags(data.right.img_alt || data.right.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.right.caption || '')}</figcaption>`;
        grid.appendChild(rightFigure);
    }

    section.appendChild(grid);

    if (data.text && String(data.text).trim()) {
        const figTextHtml = ctx.formatTextToHtml(data.text);
        const figTextTag = _safeTag(figTextHtml);
        const figTextEl = document.createElement(figTextTag);
        figTextEl.setAttribute('style', `margin:10px 0 0 0; color:${TEXT_SECONDARY};`);
        figTextEl.innerHTML = figTextHtml;
        section.appendChild(figTextEl);
    }

    return section;
}

/**
 * #11 — Encadré de définition avec fond vert léger et bordure gauche verte.
 */
function renderDefinitionBox(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${PRIMARY}; border-left:6px solid ${PRIMARY}; border-radius:16px; padding:16px; background:${BG_GREEN};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const defHtml = ctx.formatTextToHtml(data.text);
    const defTag = _safeTag(defHtml);
    const defEl = document.createElement(defTag);
    defEl.setAttribute('style', 'margin:6px 0 0 0;');
    defEl.innerHTML = defHtml;
    section.appendChild(defEl);

    return section;
}

/**
 * #12 — Paragraphes de contexte avec titre.
 */
function renderContextParagraphs(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    data.paragraphs.forEach(pText => {
        const html = ctx.formatTextToHtml(pText);
        const tag = _safeTag(html);
        const el = document.createElement(tag);
        el.setAttribute('style', 'margin:0 0 8px 0;');
        el.innerHTML = html;
        section.appendChild(el);
    });

    return section;
}

/**
 * #13 — Fiche longue avec barre dégradée tricolore en haut.
 */
function renderMonumentSheetLong(data, ctx) {
    const article = document.createElement('article');
    article.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; overflow:hidden;`);

    // Barre dégradée tricolore en haut
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('style', `height:4px; background:${GRADIENT_BAR};`);
    article.appendChild(bar);

    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'padding:14px;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    wrapper.appendChild(h2);

    // Structure simple : content est un texte long
    if (data.content && typeof data.content === 'string') {
        const contentHtml = ctx.formatTextToHtml(data.content);
        const contentTag = _safeTag(contentHtml);
        const contentEl = document.createElement(contentTag);
        contentEl.setAttribute('style', 'margin:0 0 8px 0;');
        contentEl.innerHTML = contentHtml;
        wrapper.appendChild(contentEl);
    }
    // Structure complexe : sections avec sous-titres
    else if (data.sections && Array.isArray(data.sections)) {
        if (data.img_src) {
            const img = document.createElement('img');
            img.src = ctx.escapeHtmlTags(data.img_src);
            img.alt = ctx.escapeHtmlTags(data.img_alt || '');
            img.setAttribute('style', 'width:100%; max-width:400px; height:auto; margin:0 0 10px 0; border-radius:16px;');
            img.loading = 'lazy';
            img.decoding = 'async';
            wrapper.appendChild(img);
        }
        data.sections.forEach((section, idx) => {
            if (section.subtitle) {
                const h3 = document.createElement(ctx.headingTag(1));
                h3.setAttribute('style', `margin:${idx > 0 ? '12px' : '0'} 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.05rem;`);
                h3.innerHTML = ctx.formatTextToHtml(section.subtitle);
                wrapper.appendChild(h3);
            }
            if (section.text) {
                const secHtml = ctx.formatTextToHtml(section.text);
                const secTag = _safeTag(secHtml);
                const secEl = document.createElement(secTag);
                secEl.setAttribute('style', 'margin:0 0 8px 0;');
                secEl.innerHTML = secHtml;
                wrapper.appendChild(secEl);
            }
        });
    }

    article.appendChild(wrapper);
    return article;
}

/**
 * #14 — Bloc FAQ avec paires question / réponse sur fond vert léger.
 */
function renderFaqBlock(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px; background:${BG_GREEN};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    // Accessibilité RGAA 9.3 : associer chaque question à sa réponse via une
    // liste de définitions (dt = question, dd = réponse).
    const dl = document.createElement('dl');
    dl.setAttribute('style', 'margin:0;');
    data.questions.forEach(q => {
        const dt = document.createElement('dt');
        dt.setAttribute('style', `margin:0 0 4px 0; color:${HEADING_PRIMARY}; font-weight:700; font-size:1.05rem;`);
        dt.innerHTML = ctx.formatTextToHtml(q.q);
        dl.appendChild(dt);

        const dd = document.createElement('dd');
        dd.setAttribute('style', 'margin:0 0 10px 0;');
        dd.innerHTML = ctx.formatTextToHtml(q.a);
        dl.appendChild(dd);
    });
    section.appendChild(dl);

    return section;
}

/**
 * #15 — Mythes vs Réalités en grille 50/50.
 * Orange vif vs vert forêt.
 */
function renderMythsRealities(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:12px;`);

    if (data.title && String(data.title).trim()) {
        const titleH2 = document.createElement(ctx.headingTag(0));
        titleH2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem; grid-column:1 / -1;`);
        titleH2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(titleH2);
    }

    // Colonne Mythes (orange)
    const mythsDiv = document.createElement('div');
    mythsDiv.setAttribute('style', `background:${MYTHS.bg}; border:2px solid ${MYTHS.border}; border-radius:16px; padding:14px;`);
    const mythsH2 = document.createElement(ctx.headingTag(1));
    mythsH2.setAttribute('style', `margin:0 0 8px 0; color:${MYTHS.heading}; font-size:1.15rem;`);
    mythsH2.innerHTML = ctx.formatTextToHtml(data.mythsTitle || ctx.t('simulator_page_myths', 'Mythes'));
    mythsDiv.appendChild(mythsH2);
    const mythsUl = document.createElement('ul');
    mythsUl.setAttribute('style', 'margin:0; padding-left:18px;');
    mythsDiv.appendChild(mythsUl);

    // Colonne Réalités (vert)
    const realitiesDiv = document.createElement('div');
    realitiesDiv.setAttribute('style', `background:${REALITIES.bg}; border:2px solid ${REALITIES.border}; border-radius:16px; padding:14px;`);
    const realitiesH2 = document.createElement(ctx.headingTag(1));
    realitiesH2.setAttribute('style', `margin:0 0 8px 0; color:${REALITIES.heading}; font-size:1.15rem;`);
    realitiesH2.innerHTML = ctx.formatTextToHtml(data.realitiesTitle || ctx.t('simulator_page_realities', 'Réalités'));
    realitiesDiv.appendChild(realitiesH2);
    const realitiesUl = document.createElement('ul');
    realitiesUl.setAttribute('style', 'margin:0; padding-left:18px;');
    realitiesDiv.appendChild(realitiesUl);

    if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item, idx) => {
            if (item.myth) {
                const li = document.createElement('li');
                // Index d'appariement pour la rétro-ingénierie.
                li.setAttribute('data-pair-index', String(idx));
                li.innerHTML = ctx.formatTextToHtml(item.myth);
                mythsUl.appendChild(li);
            }
            if (item.reality) {
                const li = document.createElement('li');
                li.setAttribute('data-pair-index', String(idx));
                li.innerHTML = ctx.formatTextToHtml(item.reality);
                realitiesUl.appendChild(li);
            }
        });
    }

    section.appendChild(mythsDiv);
    section.appendChild(realitiesDiv);
    return section;
}

/**
 * #16 — Méthode illustrée sur fond orange léger.
 */
function renderMethodImageDesc(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px; background:${BG_ORANGE};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${SECONDARY_TEXT}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ol = document.createElement('ol');
    ol.setAttribute('style', 'margin:0; padding-left:18px;');
    data.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = ctx.formatTextToHtml(step);
        ol.appendChild(li);
    });
    section.appendChild(ol);

    if (data.img_src && String(data.img_src).trim()) {
        const figure = document.createElement('figure');
        figure.setAttribute('style', 'margin:12px 0 0 0; text-align:center;');
        figure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.img_src)}" alt="${ctx.escapeHtmlTags(data.img_alt || '')}" loading="lazy" decoding="async" style="width:100%; max-width:500px; height:auto; border-radius:16px;">${data.caption ? `<figcaption style="margin-top:6px; font-size:0.9rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.caption)}</figcaption>` : ''}`;
        section.appendChild(figure);
    }

    return section;
}

/**
 * #17 — Citation bilingue avec bordure gauche verte.
 * Ce bloc n'a PAS de titre h2.
 */
function renderQuoteBilingual(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const figure = document.createElement('figure');
    figure.setAttribute('style', 'margin:0;');

    const quoteTitleH2 = document.createElement(ctx.headingTag(0));
    quoteTitleH2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    quoteTitleH2.innerHTML = ctx.formatTextToHtml(data.title || ctx.t('page_quote_title', 'Citation'));
    section.appendChild(quoteTitleH2);

    const bq1 = document.createElement('blockquote');
    bq1.setAttribute('style', `margin:0 0 6px 0; padding:8px 0 8px 16px; border-left:4px solid ${QUOTE_BORDER}; font-size:1.15rem; font-weight:600; color:${TEXT_DARK};`);
    bq1.innerHTML = ctx.formatTextToHtml(data.quote_langue_initiale);
    // RGAA 8.7 : signaler le changement de langue si un code BCP-47 est fourni.
    if (data.lang_initiale) bq1.setAttribute('lang', data.lang_initiale);
    figure.appendChild(bq1);

    const bq2 = document.createElement('blockquote');
    bq2.setAttribute('style', `margin:0; padding:8px 0 8px 16px; border-left:4px solid ${QUOTE_BORDER}; font-size:1.05rem; color:${TEXT_SECONDARY};`);
    bq2.innerHTML = ctx.formatTextToHtml(data.quote_langue_arrivee);
    if (data.lang_arrivee) bq2.setAttribute('lang', data.lang_arrivee);
    figure.appendChild(bq2);

    if (data.author) {
        const figcap = document.createElement('figcaption');
        figcap.setAttribute('style', `margin-top:8px; color:${TEXT_MUTED};`);
        figcap.innerHTML = '\u2014 ' + ctx.formatTextToHtml(data.author);
        figure.appendChild(figcap);
    }

    section.appendChild(figure);
    return section;
}

/**
 * #18 — Sitographie (liste de liens verts).
 */
function renderSitoGraphy(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:2px solid ${BORDER_LIGHT}; border-radius:16px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'margin:0; padding-left:18px;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="color:${LINK_COLOR}; text-decoration:underline;">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

// =========================================================================
// Export par défaut — objet thème conforme à l'interface attendue
// =========================================================================
export default {
    id: 'dynamique',

    config: {
        /** Style inline pour le conteneur <div role="document"> englobant */
        wrapperStyle: `font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:${TEXT_BODY}; background:${BG_PAGE}; padding:28px; border-radius:16px; max-width:1000px; margin:0 auto; line-height:1.7; font-size:1.05rem;`,

        /**
         * Styles hérités injectés sur chaque enfant direct pour résister
         * au nettoyage Éléa (qui supprime le wrapper englobant).
         */
        inheritedStyles: `font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.7; color:${TEXT_BODY}; font-size:1.05rem;`
    },

    renderers: {
        '#01_hero_header':        renderHeroHeader,
        '#02_nav_summary':        renderNavSummary,
        '#03_histo_reperes':      renderHistoReperes,
        '#04_callout_set':        renderCalloutSet,
        '#05_stats_cards':        renderStatsCards,
        '#06_lexique_table':      renderTable,
        '#07_glossary_chips':     renderGlossaryChips,
        '#08_monuments_grid':     renderMonumentsGrid,
        '#09_figures_comparison': renderFiguresComparison,
        '#10_table_comparison':   renderTable,
        '#11_definition_box':     renderDefinitionBox,
        '#12_context_paragraphs': renderContextParagraphs,
        '#13_monument_sheet_long': renderMonumentSheetLong,
        '#14_faq_block':          renderFaqBlock,
        '#15_myths_realities':    renderMythsRealities,
        '#16_method_image_desc':  renderMethodImageDesc,
        '#17_quote_bilingual':    renderQuoteBilingual,
        '#18_sito_graphy':        renderSitoGraphy
    }
};
