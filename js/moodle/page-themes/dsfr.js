/**
 * @file Thème « DSFR » pour l'activité Page Moodle/Éléa.
 *
 * Ce module autonome contient les 18 renderers de blocs correspondant
 * au Design Système de l'État français (DSFR). Esthétique institutionnelle :
 * pas de coins arrondis, pas de dégradés, aplats de couleur Bleu France
 * (#000091) et Rouge Marianne (#e1000f), ombres légères.
 *
 * Signature des renderers : (data, ctx) => Element
 *   - data : données du bloc (block.data)
 *   - ctx  : { formatTextToHtml, escapeHtmlTags, jsonData }
 *
 * @version 1.0.0
 * @module page-themes/dsfr
 */

// Validation de schéma des URLs interpolées en href (anti `javascript:`) —
// en complément de l'échappement HTML (ctx.escapeHtmlTags), pas à sa place.
import { sanitizeUrl } from '../../core/utils.js';

// =========================================================================
// Palette DSFR — valeurs hexadécimales en dur
// =========================================================================
const TEXT_BODY         = '#161616';
const TEXT_SECONDARY    = '#3a3a3a';
const TEXT_MUTED        = '#666666';
const TEXT_CAPTION      = '#666666';
const TEXT_DARK         = '#161616';

const HEADING_PRIMARY   = '#000091';
const HEADING_SECONDARY = '#000091';

const BG_PAGE           = '#ffffff';
const BG_LIGHT          = '#f5f5fe';
const BG_WARM           = '#fef4f0';
const BG_GRAY           = '#f6f6f6';

const BORDER_LIGHT      = '#dddddd';
const BORDER_SUBTLE     = '#eeeeee';
const BORDER_BLUE       = '#e3e3fd';
const BORDER_RED        = '#fcbfb7';

const LINK_COLOR        = '#000091';
const STAT_VALUE_COLOR  = '#000091';

const CHIP_BG           = '#f5f5fe';
const CHIP_BORDER       = '#e3e3fd';
const CHIP_TEXT         = '#000091';

const QUOTE_BORDER      = '#000091';

const CALLOUT = {
    objectif: { borderColor: '#000091', bg: '#f5f5fe', borderOuter: '#e3e3fd' },
    savoir:   { borderColor: '#000091', bg: '#f5f5fe', borderOuter: '#e3e3fd' },
    alerte:   { borderColor: '#e1000f', bg: '#fef4f0', borderOuter: '#fcbfb7' }
};

const CARD_VARIANTS = [
    { bg: '#f5f5fe', border: '#e3e3fd', heading: '#000091' },
    { bg: '#f6f6f6', border: '#dddddd', heading: '#161616' },
    { bg: '#f5f5fe', border: '#e3e3fd', heading: '#000091' }
];

const MYTHS     = { bg: '#fef4f0', border: '#fcbfb7', heading: '#ce0500' };
const REALITIES = { bg: '#f5f5fe', border: '#e3e3fd', heading: '#000091' };

// Ombre légère commune (remplace les bordures colorées du thème Caramel)
const BOX_SHADOW = '0 2px 6px rgba(0,0,0,.08)';

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
 * #01 — En-tête héro avec fond Bleu France uni et filet blanc.
 * Titre du héros : balise native de niveau ctx.heroLevel en contexte standalone
 * (preview modale, .html autonome), ou bandeau décoratif en export Éléa/Moodle
 * (ctx.heroLevel = null) car la plateforme pose déjà le <h1> de l'activité.
 * Titre injecté en textContent (pas innerHTML) pour résister au nettoyage Éléa.
 */
function renderHeroHeader(data, ctx) {
    const header = document.createElement('header');
    header.setAttribute('style', 'margin:0 0 20px 0; background:#000091 !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; padding:24px;');

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
    heading.setAttribute('style', 'margin:0 0 10px 0; font-size:1.8rem; font-weight:700; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    heading.textContent = headerTitle || '';
    header.appendChild(heading);

    // Filet blanc horizontal (remplace la barre dégradée de Caramel)
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('style', 'height:0; width:240px; margin:8px 0 0 0; border-bottom:4px solid #ffffff;');
    header.appendChild(bar);

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
            nodeToAppend.setAttribute('style', pStyle + '; margin:12px 0 0 0; color:rgba(255,255,255,0.85) !important; -webkit-text-fill-color:rgba(255,255,255,0.85) !important;');
        } else {
            nodeToAppend = document.createElement('p');
            nodeToAppend.setAttribute('style', 'margin:12px 0 0 0; color:rgba(255,255,255,0.85) !important; -webkit-text-fill-color:rgba(255,255,255,0.85) !important;');
            nodeToAppend.innerHTML = html;
        }
        header.appendChild(nodeToAppend);
    }

    return header;
}

/**
 * #02 — Sommaire de navigation : liens soulignés séparés par un filet Bleu France.
 * Pas de pilules — simple liste de liens texte conformes au DSFR.
 */
function renderNavSummary(data, ctx) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', ctx.t('simulator_page_summary', 'Sommaire'));
    nav.setAttribute('style', 'margin:0 0 20px 0; border-bottom:3px solid #000091; padding:12px 0;');

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="display:inline-block; padding:6px 12px; color:#000091; text-decoration:underline; font-weight:600;">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
}

/**
 * #03 — Repères historiques en grille de cartes avec barre gauche colorée.
 */
function renderHistoReperes(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:12px;');

    data.cards.forEach((card, cardIdx) => {
        const cv = CARD_VARIANTS[cardIdx % CARD_VARIANTS.length];
        const cardDiv = document.createElement('div');
        cardDiv.setAttribute('style', `background:${cv.bg}; border-left:4px solid ${cv.heading}; padding:12px;`);
        cardDiv.innerHTML = `<${ctx.headingTag(1)} style="margin:0 0 6px 0; font-size:1.05rem; color:${cv.heading};">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}><p style="margin:0;">${ctx.formatTextToHtml(card.text)}</p>`;
        grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #04 — Ensemble de callouts (objectif / savoir / alerte) en grille.
 * Barres gauches colorées, pas de bordure arrondie.
 */
function renderCalloutSet(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap:12px;');

    data.callouts.forEach(callout => {
        const cs = CALLOUT[callout.type] || CALLOUT.objectif;
        const div = document.createElement('div');
        div.setAttribute('style', `border-left:4px solid ${cs.borderColor}; background:${cs.bg}; padding:12px 16px;`);
        if (callout.type === 'alerte') div.setAttribute('role', 'alert');
        // Marqueur sémantique pour la rétro-ingénierie : en thème dsfr,
        // objectif et savoir partagent la palette (bleu France) — la couleur
        // seule ne suffit pas à les distinguer.
        if (callout.type) div.setAttribute('data-callout-type', callout.type);
        div.innerHTML = `<p style="margin:0;">${ctx.formatTextToHtml(callout.text)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #05 — Cartes de statistiques avec barre gauche Bleu France et gros chiffre.
 */
function renderStatsCards(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px;');

    data.stats.forEach(stat => {
        const div = document.createElement('div');
        div.setAttribute('style', `border-left:4px solid ${HEADING_PRIMARY}; background:${BG_LIGHT}; padding:14px; text-align:center;`);
        div.innerHTML = `<p style="margin:2px 0 0 0; font-size:2rem; font-weight:800; color:${STAT_VALUE_COLOR};">${ctx.formatTextToHtml(stat.value)}</p><p style="margin:2px 0 0 0; color:${TEXT_MUTED};">${ctx.formatTextToHtml(stat.label)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #06 / #10 — Tableau (lexique ou comparaison) avec caption, thead, tbody.
 * En-tête blanc sur fond Bleu France, alternance de lignes (zebra striping).
 */
function renderTable(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const table = document.createElement('table');
    table.setAttribute('style', 'width:100%; border-collapse:collapse; font-size:0.98rem;');

    // Caption avec styles forcés pour Éléa
    const caption = document.createElement('caption');
    caption.setAttribute('style', `text-align:left; padding:6px 0; color:${TEXT_MUTED}; font-weight:normal; font-size:0.9rem;`);
    caption.innerHTML = ctx.formatTextToHtml(data.caption);
    table.appendChild(caption);

    // En-tête — fond Bleu France, texte blanc
    const thead = document.createElement('thead');
    thead.setAttribute('style', 'background:#000091 !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    const headRow = document.createElement('tr');
    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.setAttribute('style', `text-align:left; padding:10px; border-bottom:2px solid ${BORDER_LIGHT}; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;`);
        th.innerHTML = ctx.formatTextToHtml(header);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Corps — alternance de fond pour les lignes paires
    const tbody = document.createElement('tbody');
    data.rows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        if (rowIdx % 2 === 1) tr.setAttribute('style', `background:${BG_LIGHT};`);
        row.forEach(cell => {
            const td = document.createElement('td');
            td.setAttribute('style', `padding:10px; border-bottom:1px solid ${BORDER_SUBTLE};`);
            td.innerHTML = ctx.formatTextToHtml(cell);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    return section;
}

/**
 * #07 — Glossaire en chips rectangulaires (pas de border-radius).
 */
function renderGlossaryChips(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px;');

    data.chips.forEach(chip => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="display:inline-block; padding:4px 12px; background:${CHIP_BG}; border:1px solid ${CHIP_BORDER}; color:${CHIP_TEXT};">${ctx.formatTextToHtml(chip)}</span>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

/**
 * #08 — Grille de monuments / fiches illustrées avec bordure haute Bleu France.
 */
function renderMonumentsGrid(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:18px;');

    data.cards.forEach(card => {
        const article = document.createElement('article');
        article.setAttribute('style', `background:${BG_PAGE}; box-shadow:${BOX_SHADOW}; overflow:hidden; border-top:4px solid ${HEADING_PRIMARY};`);
        article.innerHTML = `
            <figure style="margin:0;">
                <img src="${ctx.escapeHtmlTags(card.img_src)}" alt="${ctx.escapeHtmlTags(card.img_alt)}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;">
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
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    // Titre optionnel
    if (data.title) {
        const h2 = document.createElement(ctx.headingTag(0));
        h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
        h2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(h2);
    }

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px;');

    // Figure de gauche
    if (data.left) {
        const leftFigure = document.createElement('figure');
        leftFigure.setAttribute('style', `margin:0; border:1px solid ${BORDER_LIGHT}; overflow:hidden;`);
        leftFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.left.img_src)}" alt="${ctx.escapeHtmlTags(data.left.img_alt || data.left.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.left.caption || '')}</figcaption>`;
        grid.appendChild(leftFigure);
    }

    // Figure de droite
    if (data.right) {
        const rightFigure = document.createElement('figure');
        rightFigure.setAttribute('style', `margin:0; border:1px solid ${BORDER_LIGHT}; overflow:hidden;`);
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
 * #11 — Encadré de définition avec barre gauche Bleu France.
 */
function renderDefinitionBox(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_LIGHT}; border-left:4px solid ${HEADING_PRIMARY}; padding:14px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem;`);
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
    section.setAttribute('style', `margin:0 0 20px 0; padding:14px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:6px;`);
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
 * #13 — Fiche monument longue avec bordure haute Bleu France et ombre.
 */
function renderMonumentSheetLong(data, ctx) {
    const article = document.createElement('article');
    article.setAttribute('style', `margin:0 0 20px 0; border-top:4px solid ${HEADING_PRIMARY}; box-shadow:${BOX_SHADOW}; overflow:hidden;`);

    // Conteneur intérieur avec padding
    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'padding:14px;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem;`);
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
            img.setAttribute('style', 'width:100%; max-width:400px; height:auto; margin:0 0 10px 0;');
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
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_GRAY}; padding:14px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    data.questions.forEach(q => {
        const h3 = document.createElement(ctx.headingTag(1));
        h3.setAttribute('style', `margin:0 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.05rem;`);
        h3.innerHTML = ctx.formatTextToHtml(q.q);
        section.appendChild(h3);

        const aHtml = ctx.formatTextToHtml(q.a);
        const aTag = _safeTag(aHtml);
        const aEl = document.createElement(aTag);
        aEl.setAttribute('style', 'margin:0 0 8px 0;');
        aEl.innerHTML = aHtml;
        section.appendChild(aEl);
    });

    return section;
}

/**
 * #15 — Mythes vs Réalités en grille 50/50.
 * Barres gauches colorées : rouge pour les mythes, bleu pour les réalités.
 */
function renderMythsRealities(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; display:grid; grid-template-columns:1fr 1fr; gap:12px;');

    // Titre principal du bloc (optionnel, couvre les 2 colonnes)
    if (data.title && String(data.title).trim()) {
        const titleH2 = document.createElement(ctx.headingTag(0));
        titleH2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; grid-column:1 / -1;`);
        titleH2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(titleH2);
    }

    // Colonne Mythes
    const mythsDiv = document.createElement('div');
    mythsDiv.setAttribute('style', `background:${MYTHS.bg}; border-left:4px solid ${MYTHS.heading}; padding:12px;`);
    const mythsH2 = document.createElement(ctx.headingTag(1));
    mythsH2.setAttribute('style', `margin:0 0 8px 0; color:${MYTHS.heading}; font-size:1.15rem;`);
    mythsH2.innerHTML = ctx.formatTextToHtml(data.mythsTitle || ctx.t('simulator_page_myths', 'Mythes'));
    mythsDiv.appendChild(mythsH2);
    const mythsUl = document.createElement('ul');
    mythsUl.setAttribute('style', 'margin:0; padding-left:18px;');
    mythsDiv.appendChild(mythsUl);

    // Colonne Réalités
    const realitiesDiv = document.createElement('div');
    realitiesDiv.setAttribute('style', `background:${REALITIES.bg}; border-left:4px solid ${REALITIES.heading}; padding:12px;`);
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
 * #16 — Méthode illustrée avec liste ordonnée et image optionnelle.
 */
function renderMethodImageDesc(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_GRAY}; padding:14px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem;`);
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
        figure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.img_src)}" alt="${ctx.escapeHtmlTags(data.img_alt || '')}" loading="lazy" decoding="async" style="width:100%; max-width:500px; height:auto;">${data.caption ? `<figcaption style="margin-top:6px; font-size:0.9rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.caption)}</figcaption>` : ''}`;
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
    section.setAttribute('style', `margin:0 0 20px 0; padding:16px; box-shadow:${BOX_SHADOW};`);

    const figure = document.createElement('figure');
    figure.setAttribute('style', 'margin:0;');

    // Citation en langue initiale
    const bq1 = document.createElement('blockquote');
    bq1.setAttribute('style', `margin:0 0 6px 0; padding:8px 0 8px 16px; border-left:4px solid ${QUOTE_BORDER}; font-size:1.15rem; font-weight:600; color:${TEXT_DARK};`);
    bq1.innerHTML = ctx.formatTextToHtml(data.quote_langue_initiale);
    figure.appendChild(bq1);

    // Citation en langue d'arrivée
    const bq2 = document.createElement('blockquote');
    bq2.setAttribute('style', `margin:0; padding:8px 0 8px 16px; border-left:4px solid ${QUOTE_BORDER}; font-size:1.05rem; color:${TEXT_SECONDARY};`);
    bq2.innerHTML = ctx.formatTextToHtml(data.quote_langue_arrivee);
    figure.appendChild(bq2);

    // Auteur optionnel
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
 * #18 — Sitographie (liste de liens).
 */
function renderSitoGraphy(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; padding:14px; box-shadow:${BOX_SHADOW};`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.35rem; border-bottom:2px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
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
    id: 'dsfr',

    config: {
        /** Style inline pour le conteneur <div role="document"> englobant */
        wrapperStyle: `font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:${TEXT_BODY}; background:${BG_PAGE}; padding:28px; max-width:1000px; margin:0 auto; line-height:1.65;`,

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
