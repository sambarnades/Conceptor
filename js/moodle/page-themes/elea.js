/**
 * @file Thème « Éléa » pour l'activité Page Moodle/Éléa.
 *
 * Ce module autonome contient les 18 renderers de blocs correspondant
 * à la palette violet / bleu / orange originale d'Éléa (thème par défaut).
 * Chaque renderer crée ses éléments DOM depuis zéro (aucune dépendance
 * à un fichier modèle HTML externe).
 *
 * Signature des renderers : (data, ctx) => Element
 *   - data : données du bloc (block.data)
 *   - ctx  : { formatTextToHtml, escapeHtmlTags, jsonData }
 *
 * @version 1.0.0
 * @module page-themes/elea
 */

// Validation de schéma des URLs interpolées en href (anti `javascript:`) —
// en complément de l'échappement HTML (ctx.escapeHtmlTags), pas à sa place.
import { sanitizeUrl } from '../../core/utils.js';

// =========================================================================
// Palette Éléa — valeurs hexadécimales en dur
// =========================================================================
const TEXT_BODY         = '#111827';
const TEXT_SECONDARY    = '#374151';
const TEXT_MUTED        = '#6b7280';
const TEXT_CAPTION      = '#4b5563';
const TEXT_DARK         = '#1f2937';

const HEADING_PRIMARY   = '#40228b';
const HEADING_SECONDARY = '#2233aa';

const BG_PAGE           = '#ffffff';
const BG_LIGHT          = '#f6f7ff';
const BG_LIGHT_ORANGE   = '#fff6ef';
const BG_GRAY           = '#f3f4f6';
const BG_NEAR_WHITE     = '#f9fafb';

const BORDER_LIGHT      = '#e5e7eb';
const BORDER_SUBTLE     = '#eef2f7';
const BORDER_BLUE       = '#dfe3ff';
const BORDER_ORANGE     = '#ffd1b0';

const GRADIENT_A        = '#5b2e90';
const GRADIENT_B        = '#1f4fff';
const GRADIENT_C        = '#ff7a18';

const NAV_PILL_BG       = 'linear-gradient(90deg,#5b2e90,#1f4fff)';
const NAV_PILL_TEXT     = '#fff';

const LINK_COLOR        = '#1f4fff';
const STAT_VALUE_COLOR  = '#1f4fff';

const CHIP_BG           = '#eef2ff';
const CHIP_BORDER       = '#dfe3ff';
const CHIP_TEXT         = '#2233aa';

const QUOTE_BORDER      = '#9ca3af';

const CALLOUT = {
    objectif: { borderColor: '#1f4fff', bg: '#f6f7ff', borderOuter: '#dfe3ff' },
    savoir:   { borderColor: '#ff7a18', bg: '#fff6ef', borderOuter: '#ffd1b0' },
    alerte:   { borderColor: '#b91c1c', bg: '#fff5f5', borderOuter: '#f7c4c4' }
};

// Libellés accessibles des callouts (RGAA 3.1 : ne pas coder le type par la
// seule couleur). L'icône est décorative (aria-hidden) ; le texte porte le sens.
const CALLOUT_META = {
    objectif: { icon: '🎯', key: 'page_callout_objectif', fallback: 'Objectif' },
    savoir:   { icon: '💡', key: 'page_callout_savoir',   fallback: 'À savoir' },
    alerte:   { icon: '⚠️', key: 'page_callout_alerte',   fallback: 'Attention' }
};

const CARD_VARIANTS = [
    { bg: '#f6f7ff', border: '#dfe3ff', heading: '#2233aa' },
    { bg: '#fff6ef', border: '#ffd1b0', heading: '#b04a12' },
    { bg: '#eefcf6', border: '#cdeee0', heading: '#126e4b' }
];

const MYTHS     = { bg: '#fff6ef', border: '#ffd1b0', heading: '#b04a12' };
const REALITIES = { bg: '#f6f7ff', border: '#dfe3ff', heading: '#2233aa' };

// =========================================================================
// Utilitaire interne : détection sûre de balises <p> dans le HTML produit
// par formatTextToHtml(). Si le HTML contient déjà des <p>, on utilise un
// <div> conteneur pour éviter l'imbrication invalide <p><p>…</p></p>.
// =========================================================================
function _safeTag(html) {
    return /<p[\s>]/i.test(html) ? 'div' : 'p';
}

// =========================================================================
// Renderers (18 blocs)
// =========================================================================

/**
 * #01 — En-tête héro avec titre principal, barre dégradée et sous-titre optionnel.
 * Titre du héros : balise native de niveau ctx.heroLevel en contexte standalone
 * (preview modale, .html autonome), ou bandeau décoratif en export Éléa/Moodle
 * (ctx.heroLevel = null) car la plateforme pose déjà le <h1> de l'activité.
 * Titre injecté en textContent (pas innerHTML) pour résister au nettoyage Éléa.
 */
function renderHeroHeader(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; text-align:center; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:18px;`);

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
    heading.setAttribute('style', `margin:0 0 10px 0; font-size:2rem; color:${HEADING_PRIMARY};`);
    heading.textContent = headerTitle || '';
    section.appendChild(heading);

    // Barre dégradée décorative
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('style', `height:6px; width:240px; margin:8px auto 0 auto; border-radius:6px; background:linear-gradient(90deg,${GRADIENT_A} 0%, ${GRADIENT_B} 60%, ${GRADIENT_C} 100%);`);
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
            nodeToAppend.style.margin = '12px 0 0 0';
            nodeToAppend.style.color = TEXT_SECONDARY;
        } else {
            nodeToAppend = document.createElement('p');
            nodeToAppend.setAttribute('style', `margin:12px 0 0 0; color:${TEXT_SECONDARY};`);
            nodeToAppend.innerHTML = html;
        }
        section.appendChild(nodeToAppend);
    }

    return section;
}

/**
 * #02 — Sommaire de navigation avec pilules dégradées.
 */
function renderNavSummary(data, ctx) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', ctx.t('simulator_page_summary', 'Sommaire'));
    nav.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:12px;`);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="display:inline-block; padding:8px 12px; border-radius:999px; color:${NAV_PILL_TEXT}; text-decoration:none; font-weight:600; background:${NAV_PILL_BG};">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
}

/**
 * #03 — Repères historiques en grille de cartes colorées (rotation des variantes).
 */
function renderHistoReperes(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:12px;');

    data.cards.forEach((card, cardIdx) => {
        const cv = CARD_VARIANTS[cardIdx % CARD_VARIANTS.length];
        const cardDiv = document.createElement('div');
        cardDiv.setAttribute('style', `background:${cv.bg}; border:1px solid ${cv.border}; border-radius:14px; padding:12px;`);
        cardDiv.innerHTML = `<${ctx.headingTag(1)} style="margin:0 0 6px 0; font-size:1.05rem; color:${cv.heading};">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}><p style="margin:0;">${ctx.formatTextToHtml(card.text)}</p>`;
        grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #04 — Ensemble de callouts (objectif / savoir / alerte) en grille.
 */
function renderCalloutSet(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

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
        div.setAttribute('style', `border:1px solid ${cs.borderOuter}; border-left:6px solid ${cs.borderColor}; background:${cs.bg}; border-radius:14px; padding:12px;`);
        // Marqueur sémantique pour la rétro-ingénierie : la couleur seule ne
        // suffit pas (en thème dsfr, objectif et savoir partagent la palette).
        if (callout.type) div.setAttribute('data-callout-type', callout.type);
        // Accessibilité RGAA 3.1 : libellé textuel visible (+ icône décorative)
        // pour véhiculer le type autrement que par la seule couleur.
        div.innerHTML =
            `<p style="margin:0 0 6px 0; font-weight:700;"><span aria-hidden="true">${meta.icon} </span>${ctx.escapeHtmlTags(ctx.t(meta.key, meta.fallback))}</p>` +
            `<p style="margin:0;">${ctx.formatTextToHtml(callout.text)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #05 — Cartes de statistiques avec barre dégradée et gros chiffre.
 */
function renderStatsCards(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px;');

    data.stats.forEach(stat => {
        const div = document.createElement('div');
        div.setAttribute('style', `border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:14px; text-align:center;`);
        div.innerHTML = `<div aria-hidden="true" style="height:4px; margin:-14px -14px 10px -14px; border-radius:14px 14px 0 0; background:linear-gradient(90deg,${GRADIENT_A},${GRADIENT_B});"></div><p style="margin:2px 0 0 0; font-size:2rem; font-weight:800; color:${STAT_VALUE_COLOR};">${ctx.formatTextToHtml(stat.value)}</p><p style="margin:2px 0 0 0; color:${TEXT_MUTED};">${ctx.formatTextToHtml(stat.label)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #06 / #10 — Tableau (lexique ou comparaison) avec caption, thead, tbody.
 * Le caption a des styles forcés pour résister au CSS par défaut d'Éléa.
 */
function renderTable(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

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

    // En-tête
    const thead = document.createElement('thead');
    thead.setAttribute('style', `background:${BG_GRAY};`);
    const headRow = document.createElement('tr');
    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.setAttribute('style', `text-align:left; padding:10px; border-bottom:2px solid ${BORDER_LIGHT};`);
        th.innerHTML = ctx.formatTextToHtml(header);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Corps
    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
        const tr = document.createElement('tr');
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
 * #07 — Glossaire en chips (pilules arrondies).
 */
function renderGlossaryChips(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px;');

    data.chips.forEach(chip => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:${CHIP_BG}; border:1px solid ${CHIP_BORDER}; color:${CHIP_TEXT};">${ctx.formatTextToHtml(chip)}</span>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

/**
 * #08 — Grille de monuments / fiches illustrées avec barre dégradée et image.
 */
function renderMonumentsGrid(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:18px;');

    data.cards.forEach(card => {
        const article = document.createElement('article');
        article.setAttribute('style', `background:${BG_PAGE}; border:1px solid ${BORDER_LIGHT}; border-radius:14px; overflow:hidden;`);
        article.innerHTML = `
            <div aria-hidden="true" style="height:4px; background:linear-gradient(90deg,${GRADIENT_A},${GRADIENT_B});"></div>
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
 * #09 — Comparaison de deux figures côte à côte avec images et texte optionnel.
 */
function renderFiguresComparison(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    // Titre optionnel
    {
        // Titre du bloc — défaut « Comparaison » si l'IA n'en fournit pas.
        const h2 = document.createElement(ctx.headingTag(0));
        h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
        h2.innerHTML = ctx.formatTextToHtml(data.title || ctx.t('page_figures_title', 'Comparaison'));
        section.appendChild(h2);
    }

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px;');

    // Figure de gauche
    if (data.left) {
        const leftFigure = document.createElement('figure');
        leftFigure.setAttribute('style', `margin:0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; overflow:hidden;`);
        leftFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.left.img_src)}" alt="${ctx.escapeHtmlTags(data.left.img_alt || data.left.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.left.caption || '')}</figcaption>`;
        grid.appendChild(leftFigure);
    }

    // Figure de droite
    if (data.right) {
        const rightFigure = document.createElement('figure');
        rightFigure.setAttribute('style', `margin:0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; overflow:hidden;`);
        rightFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.right.img_src)}" alt="${ctx.escapeHtmlTags(data.right.img_alt || data.right.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.right.caption || '')}</figcaption>`;
        grid.appendChild(rightFigure);
    }

    section.appendChild(grid);

    // Texte descriptif sous les figures (optionnel)
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
 * #11 — Encadré de définition avec fond clair.
 */
function renderDefinitionBox(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px; background:${BG_NEAR_WHITE};`);

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
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

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
 * #13 — Fiche monument longue avec barre dégradée, contenu simple ou sections.
 */
function renderMonumentSheetLong(data, ctx) {
    const article = document.createElement('article');
    article.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; overflow:hidden;`);

    // Barre dégradée en haut
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('style', `height:4px; background:linear-gradient(90deg,${GRADIENT_A},${GRADIENT_B});`);
    article.appendChild(bar);

    // Conteneur intérieur avec padding
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
        // Image optionnelle
        if (data.img_src) {
            const img = document.createElement('img');
            img.src = ctx.escapeHtmlTags(data.img_src);
            img.alt = ctx.escapeHtmlTags(data.img_alt || '');
            img.setAttribute('style', 'width:100%; max-width:400px; height:auto; margin:0 0 10px 0; border-radius:14px;');
            img.loading = 'lazy';
            img.decoding = 'async';
            wrapper.appendChild(img);
        }
        // Chaque section
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
 * #14 — Bloc FAQ avec paires question / réponse.
 */
function renderFaqBlock(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px; background:${BG_NEAR_WHITE};`);

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
 */
function renderMythsRealities(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:12px;`);

    // Titre principal du bloc (optionnel, couvre les 2 colonnes)
    if (data.title && String(data.title).trim()) {
        const titleH2 = document.createElement(ctx.headingTag(0));
        titleH2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem; grid-column:1 / -1;`);
        titleH2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(titleH2);
    }

    // Colonne Mythes
    const mythsDiv = document.createElement('div');
    mythsDiv.setAttribute('style', `background:${MYTHS.bg}; border:1px solid ${MYTHS.border}; border-radius:14px; padding:14px;`);
    const mythsH2 = document.createElement(ctx.headingTag(1));
    mythsH2.setAttribute('style', `margin:0 0 8px 0; color:${MYTHS.heading}; font-size:1.15rem;`);
    mythsH2.innerHTML = ctx.formatTextToHtml(data.mythsTitle || ctx.t('simulator_page_myths', 'Mythes'));
    mythsDiv.appendChild(mythsH2);
    const mythsUl = document.createElement('ul');
    mythsUl.setAttribute('style', 'margin:0; padding-left:18px;');
    mythsDiv.appendChild(mythsUl);

    // Colonne Réalités
    const realitiesDiv = document.createElement('div');
    realitiesDiv.setAttribute('style', `background:${REALITIES.bg}; border:1px solid ${REALITIES.border}; border-radius:14px; padding:14px;`);
    const realitiesH2 = document.createElement(ctx.headingTag(1));
    realitiesH2.setAttribute('style', `margin:0 0 8px 0; color:${REALITIES.heading}; font-size:1.15rem;`);
    realitiesH2.innerHTML = ctx.formatTextToHtml(data.realitiesTitle || ctx.t('simulator_page_realities', 'Réalités'));
    realitiesDiv.appendChild(realitiesH2);
    const realitiesUl = document.createElement('ul');
    realitiesUl.setAttribute('style', 'margin:0; padding-left:18px;');
    realitiesDiv.appendChild(realitiesUl);

    // Remplir les listes
    if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item, idx) => {
            if (item.myth) {
                const li = document.createElement('li');
                // Index d'appariement pour la rétro-ingénierie : permet de
                // reconstruire l'ordre exact items[i] = {myth, reality} même
                // si certaines lignes sont vides d'un côté.
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
 * #16 — Méthode illustrée avec liste ordonnée et image optionnelle.
 */
function renderMethodImageDesc(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px; background:${BG_NEAR_WHITE};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.3rem;`);
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

    // Image illustrative optionnelle
    if (data.img_src && String(data.img_src).trim()) {
        const figure = document.createElement('figure');
        figure.setAttribute('style', 'margin:12px 0 0 0; text-align:center;');
        figure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.img_src)}" alt="${ctx.escapeHtmlTags(data.img_alt || '')}" loading="lazy" decoding="async" style="width:100%; max-width:500px; height:auto; border-radius:14px;">${data.caption ? `<figcaption style="margin-top:6px; font-size:0.9rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.caption)}</figcaption>` : ''}`;
        section.appendChild(figure);
    }

    return section;
}

/**
 * #17 — Citation bilingue avec deux blockquotes et auteur optionnel.
 * Ce bloc n'a PAS de titre h2.
 */
function renderQuoteBilingual(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

    const figure = document.createElement('figure');
    figure.setAttribute('style', 'margin:0;');

    // Citation en langue initiale
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

    // Citation en langue d'arrivée
    const bq2 = document.createElement('blockquote');
    bq2.setAttribute('style', `margin:0; padding:8px 0 8px 16px; border-left:4px solid ${QUOTE_BORDER}; font-size:1.05rem; color:${TEXT_SECONDARY};`);
    bq2.innerHTML = ctx.formatTextToHtml(data.quote_langue_arrivee);
    if (data.lang_arrivee) bq2.setAttribute('lang', data.lang_arrivee);
    figure.appendChild(bq2);

    // Auteur optionnel
    if (data.author) {
        const figcap = document.createElement('figcaption');
        figcap.setAttribute('style', `margin-top:8px; color:${TEXT_MUTED};`);
        figcap.innerHTML = '— ' + ctx.formatTextToHtml(data.author);
        figure.appendChild(figcap);
    }

    section.appendChild(figure);
    return section;
}

/**
 * #18 — Sitographie (liste de liens).
 */
function renderSitoGraphy(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; border:1px solid ${BORDER_LIGHT}; border-radius:14px; padding:16px;`);

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
    id: 'elea',

    config: {
        /** Style inline pour le conteneur <div role="document"> englobant */
        wrapperStyle: `font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:${TEXT_BODY}; background:${BG_PAGE}; padding:28px; border-radius:14px; max-width:1000px; margin:0 auto; line-height:1.65;`,

        /**
         * Styles hérités injectés sur chaque enfant direct pour résister
         * au nettoyage Éléa (qui supprime le wrapper englobant).
         */
        inheritedStyles: `font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.65; color:${TEXT_BODY};`
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
