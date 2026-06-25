/**
 * @file Thème « Accessible » pour l'activité Page Moodle/Éléa.
 *
 * Ce module autonome contient les 18 renderers de blocs optimisés pour
 * l'accessibilité WCAG AAA (contraste 7:1 minimum). Conçu pour les
 * publics DYS, malvoyants, ou comme standard inclusif universel.
 *
 * Caractéristiques :
 *   - Contraste maximal (texte noir sur fond blanc, ratio 21:1)
 *   - Bordures épaisses et visibles (3px noires)
 *   - Coins carrés (pas de border-radius)
 *   - Tailles de police augmentées (+10%)
 *   - Interligne généreuse (1.8)
 *   - Zéro dégradé, zéro ombre portée
 *
 * Signature des renderers : (data, ctx) => Element
 *   - data : données du bloc (block.data)
 *   - ctx  : { formatTextToHtml, escapeHtmlTags, jsonData }
 *
 * @version 1.0.0
 * @module page-themes/accessible
 */

// Validation de schéma des URLs interpolées en href (anti `javascript:`) —
// en complément de l'échappement HTML (ctx.escapeHtmlTags), pas à sa place.
import { sanitizeUrl } from '../../core/utils.js';

// =========================================================================
// Palette Accessible — contraste WCAG AAA (ratio 7:1+)
// =========================================================================
const TEXT_BODY         = '#000000';    // ratio 21:1 sur blanc
const TEXT_SECONDARY    = '#1a1a1a';    // ratio ~18:1
const TEXT_MUTED        = '#333333';    // ratio ~12:1
const TEXT_CAPTION      = '#1a1a1a';
const TEXT_DARK         = '#000000';

const HEADING_PRIMARY   = '#00004d';    // bleu très foncé, ratio ~16:1

const BG_PAGE           = '#ffffff';
const BG_LIGHT          = '#f0f0f0';    // gris neutre sans teinte colorée

const BORDER_MAIN       = '#000000';

const LINK_COLOR        = '#00004d';
const STAT_VALUE_COLOR  = '#00004d';

const CHIP_BG           = '#ffffff';
const CHIP_BORDER       = '#000000';
const CHIP_TEXT         = '#000000';

const QUOTE_BORDER      = '#000000';

const CALLOUT = {
    objectif: { borderColor: '#00004d', bg: '#e8e8ff' },
    savoir:   { borderColor: '#4a3600', bg: '#fff3e0' },
    alerte:   { borderColor: '#8b0000', bg: '#ffe0e0' }
};

const CARD_VARIANTS = [
    { bg: '#e8e8ff', border: '#00004d', heading: '#00004d' },
    { bg: '#fff3e0', border: '#4a3600', heading: '#4a3600' },
    { bg: '#e0f0e0', border: '#004d00', heading: '#004d00' }
];

const MYTHS     = { bg: '#ffe0e0', border: '#8b0000', heading: '#8b0000' };
const REALITIES = { bg: '#e8e8ff', border: '#00004d', heading: '#00004d' };

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
 * #01 — En-tête héro avec fond bleu très foncé et filet blanc épais.
 * Titre du héros : balise native de niveau ctx.heroLevel en contexte standalone
 * (preview modale, .html autonome), ou bandeau décoratif en export Éléa/Moodle
 * (ctx.heroLevel = null) car la plateforme pose déjà le <h1> de l'activité.
 * Titre injecté en textContent (pas innerHTML) pour résister au nettoyage Éléa.
 */
function renderHeroHeader(data, ctx) {
    const header = document.createElement('header');
    header.setAttribute('style', 'margin:0 0 20px 0; background:#00004d !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; padding:28px; border:3px solid #000000;');

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
    heading.setAttribute('style', 'margin:0 0 10px 0; font-size:2.2rem; font-weight:700; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    heading.textContent = headerTitle || '';
    header.appendChild(heading);

    // Filet blanc épais
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
            nodeToAppend.setAttribute('style', pStyle + '; margin:12px 0 0 0; font-size:1.2rem; color:rgba(255,255,255,0.95) !important; -webkit-text-fill-color:rgba(255,255,255,0.95) !important;');
        } else {
            nodeToAppend = document.createElement('p');
            nodeToAppend.setAttribute('style', 'margin:12px 0 0 0; font-size:1.2rem; color:rgba(255,255,255,0.95) !important; -webkit-text-fill-color:rgba(255,255,255,0.95) !important;');
            nodeToAppend.innerHTML = html;
        }
        header.appendChild(nodeToAppend);
    }

    return header;
}

/**
 * #02 — Sommaire de navigation : liens soulignés noirs, pas de pilules.
 * Soulignement épais (3px) pour une lisibilité maximale.
 */
function renderNavSummary(data, ctx) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', ctx.t('simulator_page_summary', 'Sommaire'));
    nav.setAttribute('style', 'margin:0 0 20px 0; border:3px solid #000000; padding:12px;');

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:10px;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="display:inline-block; padding:6px 12px; color:#000000; text-decoration:underline 3px; font-weight:700; font-size:1.1rem;">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
}

/**
 * #03 — Repères historiques en grille de cartes avec bordures épaisses.
 */
function renderHistoReperes(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:12px;');

    data.cards.forEach((card, cardIdx) => {
        const cv = CARD_VARIANTS[cardIdx % CARD_VARIANTS.length];
        const cardDiv = document.createElement('div');
        cardDiv.setAttribute('style', `background:${cv.bg}; border:3px solid ${cv.border}; padding:12px;`);
        cardDiv.innerHTML = `<${ctx.headingTag(1)} style="margin:0 0 6px 0; font-size:1.15rem; color:${cv.heading};">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}><p style="margin:0; font-size:1.1rem;">${ctx.formatTextToHtml(card.text)}</p>`;
        grid.appendChild(cardDiv);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #04 — Ensemble de callouts (objectif / savoir / alerte) en grille.
 * Bordures épaisses à gauche, pas de border-radius.
 */
function renderCalloutSet(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap:12px;');

    data.callouts.forEach(callout => {
        const cs = CALLOUT[callout.type] || CALLOUT.objectif;
        const div = document.createElement('div');
        div.setAttribute('style', `border:3px solid ${cs.borderColor}; border-left-width:6px; background:${cs.bg}; padding:12px 16px;`);
        if (callout.type === 'alerte') div.setAttribute('role', 'alert');
        // Marqueur sémantique pour la rétro-ingénierie.
        if (callout.type) div.setAttribute('data-callout-type', callout.type);
        div.innerHTML = `<p style="margin:0; font-size:1.1rem;">${ctx.formatTextToHtml(callout.text)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #05 — Cartes de statistiques avec bordure épaisse et gros chiffre.
 */
function renderStatsCards(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap:12px;');

    data.stats.forEach(stat => {
        const div = document.createElement('div');
        div.setAttribute('style', `border:3px solid ${HEADING_PRIMARY}; background:${BG_LIGHT}; padding:14px; text-align:center; overflow:auto;`);
        div.innerHTML = `<p style="margin:2px 0 0 0; font-size:2.2rem; font-weight:800; color:${STAT_VALUE_COLOR};">${ctx.formatTextToHtml(stat.value)}</p><p style="margin:2px 0 0 0; font-size:1.1rem; color:${TEXT_MUTED};">${ctx.formatTextToHtml(stat.label)}</p>`;
        grid.appendChild(div);
    });

    section.appendChild(grid);
    return section;
}

/**
 * #06 / #10 — Tableau avec bordures 2px visibles sur toutes les cellules.
 * En-tête : fond noir, texte blanc forcé via -webkit-text-fill-color.
 */
function renderTable(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const table = document.createElement('table');
    table.setAttribute('style', 'width:100%; border-collapse:collapse; font-size:1.1rem; border:2px solid #000000;');

    const caption = document.createElement('caption');
    caption.setAttribute('style', `text-align:left; padding:6px 0; color:${TEXT_MUTED}; font-weight:normal; font-size:1rem;`);
    caption.innerHTML = ctx.formatTextToHtml(data.caption);
    table.appendChild(caption);

    // Thead : fond noir, texte blanc forcé
    const thead = document.createElement('thead');
    thead.setAttribute('style', 'background:#000000 !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    const headRow = document.createElement('tr');
    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.setAttribute('style', 'text-align:left; padding:12px; border:2px solid #000000; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; font-size:1.1rem;');
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
            td.setAttribute('style', 'padding:12px; border:2px solid #000000; font-size:1.1rem;');
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
 * #07 — Glossaire en chips rectangulaires à bordure noire épaisse.
 */
function renderGlossaryChips(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px;');

    data.chips.forEach(chip => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="display:inline-block; padding:6px 12px; background:${CHIP_BG}; border:2px solid ${CHIP_BORDER}; color:${CHIP_TEXT}; font-size:1.1rem;">${ctx.formatTextToHtml(chip)}</span>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

/**
 * #08 — Grille de fiches illustrées avec bordure épaisse.
 */
function renderMonumentsGrid(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:18px;');

    data.cards.forEach(card => {
        const article = document.createElement('article');
        article.setAttribute('style', `background:${BG_PAGE}; border:3px solid ${BORDER_MAIN}; overflow:hidden;`);
        article.innerHTML = `
            <figure style="margin:0;">
                <img src="${ctx.escapeHtmlTags(card.img_src)}" alt="${ctx.escapeHtmlTags(card.img_alt)}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;">
                <figcaption style="padding:8px; font-size:1rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(card.caption)}</figcaption>
            </figure>
            <div style="padding:12px;">
                <${ctx.headingTag(1)} style="margin:0 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.15rem;">${ctx.formatTextToHtml(card.title)}</${ctx.headingTag(1)}>
                <p style="margin:0; font-size:1.1rem;">${ctx.formatTextToHtml(card.text)}</p>
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
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    if (data.title) {
        const h2 = document.createElement(ctx.headingTag(0));
        h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
        h2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(h2);
    }

    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px;');

    if (data.left) {
        const leftFigure = document.createElement('figure');
        leftFigure.setAttribute('style', `margin:0; border:2px solid ${BORDER_MAIN}; overflow:hidden;`);
        leftFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.left.img_src)}" alt="${ctx.escapeHtmlTags(data.left.img_alt || data.left.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION}; font-size:1rem;">${ctx.formatTextToHtml(data.left.caption || '')}</figcaption>`;
        grid.appendChild(leftFigure);
    }

    if (data.right) {
        const rightFigure = document.createElement('figure');
        rightFigure.setAttribute('style', `margin:0; border:2px solid ${BORDER_MAIN}; overflow:hidden;`);
        rightFigure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.right.img_src)}" alt="${ctx.escapeHtmlTags(data.right.img_alt || data.right.caption || '')}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:${TEXT_CAPTION}; font-size:1rem;">${ctx.formatTextToHtml(data.right.caption || '')}</figcaption>`;
        grid.appendChild(rightFigure);
    }

    section.appendChild(grid);

    if (data.text && String(data.text).trim()) {
        const figTextHtml = ctx.formatTextToHtml(data.text);
        const figTextTag = _safeTag(figTextHtml);
        const figTextEl = document.createElement(figTextTag);
        figTextEl.setAttribute('style', `margin:10px 0 0 0; color:${TEXT_SECONDARY}; font-size:1.1rem;`);
        figTextEl.innerHTML = figTextHtml;
        section.appendChild(figTextEl);
    }

    return section;
}

/**
 * #11 — Encadré de définition avec bordure gauche épaisse.
 */
function renderDefinitionBox(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_LIGHT}; border:3px solid ${HEADING_PRIMARY}; border-left-width:6px; padding:14px;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const defHtml = ctx.formatTextToHtml(data.text);
    const defTag = _safeTag(defHtml);
    const defEl = document.createElement(defTag);
    defEl.setAttribute('style', 'margin:6px 0 0 0; font-size:1.1rem;');
    defEl.innerHTML = defHtml;
    section.appendChild(defEl);

    return section;
}

/**
 * #12 — Paragraphes de contexte avec titre.
 */
function renderContextParagraphs(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:14px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:6px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    data.paragraphs.forEach(pText => {
        const html = ctx.formatTextToHtml(pText);
        const tag = _safeTag(html);
        const el = document.createElement(tag);
        el.setAttribute('style', 'margin:0 0 8px 0; font-size:1.1rem;');
        el.innerHTML = html;
        section.appendChild(el);
    });

    return section;
}

/**
 * #13 — Fiche longue avec bordure haute épaisse.
 */
function renderMonumentSheetLong(data, ctx) {
    const article = document.createElement('article');
    article.setAttribute('style', `margin:0 0 20px 0; border:3px solid ${HEADING_PRIMARY}; border-top-width:6px; overflow:hidden;`);

    const wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'padding:14px;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    wrapper.appendChild(h2);

    // Structure simple : content est un texte long
    if (data.content && typeof data.content === 'string') {
        const contentHtml = ctx.formatTextToHtml(data.content);
        const contentTag = _safeTag(contentHtml);
        const contentEl = document.createElement(contentTag);
        contentEl.setAttribute('style', 'margin:0 0 8px 0; font-size:1.1rem;');
        contentEl.innerHTML = contentHtml;
        wrapper.appendChild(contentEl);
    }
    // Structure complexe : sections avec sous-titres
    else if (data.sections && Array.isArray(data.sections)) {
        if (data.img_src) {
            const img = document.createElement('img');
            img.src = ctx.escapeHtmlTags(data.img_src);
            img.alt = ctx.escapeHtmlTags(data.img_alt || '');
            img.setAttribute('style', 'width:100%; max-width:400px; height:auto; margin:0 0 10px 0; border:2px solid #000000;');
            img.loading = 'lazy';
            img.decoding = 'async';
            wrapper.appendChild(img);
        }
        data.sections.forEach((section, idx) => {
            if (section.subtitle) {
                const h3 = document.createElement(ctx.headingTag(1));
                h3.setAttribute('style', `margin:${idx > 0 ? '12px' : '0'} 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.2rem;`);
                h3.innerHTML = ctx.formatTextToHtml(section.subtitle);
                wrapper.appendChild(h3);
            }
            if (section.text) {
                const secHtml = ctx.formatTextToHtml(section.text);
                const secTag = _safeTag(secHtml);
                const secEl = document.createElement(secTag);
                secEl.setAttribute('style', 'margin:0 0 8px 0; font-size:1.1rem;');
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
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_LIGHT}; padding:14px; border:3px solid #000000;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    data.questions.forEach(q => {
        const h3 = document.createElement(ctx.headingTag(1));
        h3.setAttribute('style', `margin:0 0 6px 0; color:${HEADING_PRIMARY}; font-size:1.2rem;`);
        h3.innerHTML = ctx.formatTextToHtml(q.q);
        section.appendChild(h3);

        const aHtml = ctx.formatTextToHtml(q.a);
        const aTag = _safeTag(aHtml);
        const aEl = document.createElement(aTag);
        aEl.setAttribute('style', 'margin:0 0 8px 0; font-size:1.1rem;');
        aEl.innerHTML = aHtml;
        section.appendChild(aEl);
    });

    return section;
}

/**
 * #15 — Mythes vs Réalités en grille 50/50.
 * Bordures 4px, rouge foncé vs bleu foncé.
 */
function renderMythsRealities(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; display:grid; grid-template-columns:1fr 1fr; gap:12px;');

    if (data.title && String(data.title).trim()) {
        const titleH2 = document.createElement(ctx.headingTag(0));
        titleH2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; grid-column:1 / -1;`);
        titleH2.innerHTML = ctx.formatTextToHtml(data.title);
        section.appendChild(titleH2);
    }

    // Colonne Mythes
    const mythsDiv = document.createElement('div');
    mythsDiv.setAttribute('style', `background:${MYTHS.bg}; border:4px solid ${MYTHS.border}; padding:14px;`);
    const mythsH2 = document.createElement(ctx.headingTag(1));
    mythsH2.setAttribute('style', `margin:0 0 8px 0; color:${MYTHS.heading}; font-size:1.3rem;`);
    mythsH2.innerHTML = ctx.formatTextToHtml(data.mythsTitle || ctx.t('simulator_page_myths', 'Mythes'));
    mythsDiv.appendChild(mythsH2);
    const mythsUl = document.createElement('ul');
    mythsUl.setAttribute('style', 'margin:0; padding-left:18px; font-size:1.1rem;');
    mythsDiv.appendChild(mythsUl);

    // Colonne Réalités
    const realitiesDiv = document.createElement('div');
    realitiesDiv.setAttribute('style', `background:${REALITIES.bg}; border:4px solid ${REALITIES.border}; padding:14px;`);
    const realitiesH2 = document.createElement(ctx.headingTag(1));
    realitiesH2.setAttribute('style', `margin:0 0 8px 0; color:${REALITIES.heading}; font-size:1.3rem;`);
    realitiesH2.innerHTML = ctx.formatTextToHtml(data.realitiesTitle || ctx.t('simulator_page_realities', 'Réalités'));
    realitiesDiv.appendChild(realitiesH2);
    const realitiesUl = document.createElement('ul');
    realitiesUl.setAttribute('style', 'margin:0; padding-left:18px; font-size:1.1rem;');
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
 * #16 — Méthode illustrée avec liste ordonnée et image optionnelle.
 */
function renderMethodImageDesc(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', `margin:0 0 20px 0; background:${BG_LIGHT}; padding:14px; border:3px solid #000000;`);

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ol = document.createElement('ol');
    ol.setAttribute('style', 'margin:0; padding-left:18px; font-size:1.1rem;');
    data.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = ctx.formatTextToHtml(step);
        ol.appendChild(li);
    });
    section.appendChild(ol);

    if (data.img_src && String(data.img_src).trim()) {
        const figure = document.createElement('figure');
        figure.setAttribute('style', 'margin:12px 0 0 0; text-align:center;');
        figure.innerHTML = `<img src="${ctx.escapeHtmlTags(data.img_src)}" alt="${ctx.escapeHtmlTags(data.img_alt || '')}" loading="lazy" decoding="async" style="width:100%; max-width:500px; height:auto; border:2px solid #000000;">${data.caption ? `<figcaption style="margin-top:6px; font-size:1rem; color:${TEXT_CAPTION};">${ctx.formatTextToHtml(data.caption)}</figcaption>` : ''}`;
        section.appendChild(figure);
    }

    return section;
}

/**
 * #17 — Citation bilingue avec bordure gauche épaisse.
 * Ce bloc n'a PAS de titre h2.
 */
function renderQuoteBilingual(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border:3px solid #000000;');

    const figure = document.createElement('figure');
    figure.setAttribute('style', 'margin:0;');

    const bq1 = document.createElement('blockquote');
    bq1.setAttribute('style', `margin:0 0 6px 0; padding:8px 0 8px 16px; border-left:6px solid ${QUOTE_BORDER}; font-size:1.3rem; font-weight:600; color:${TEXT_DARK};`);
    bq1.innerHTML = ctx.formatTextToHtml(data.quote_langue_initiale);
    figure.appendChild(bq1);

    const bq2 = document.createElement('blockquote');
    bq2.setAttribute('style', `margin:0; padding:8px 0 8px 16px; border-left:6px solid ${QUOTE_BORDER}; font-size:1.15rem; color:${TEXT_SECONDARY};`);
    bq2.innerHTML = ctx.formatTextToHtml(data.quote_langue_arrivee);
    figure.appendChild(bq2);

    if (data.author) {
        const figcap = document.createElement('figcaption');
        figcap.setAttribute('style', `margin-top:8px; color:${TEXT_MUTED}; font-size:1.1rem;`);
        figcap.innerHTML = '\u2014 ' + ctx.formatTextToHtml(data.author);
        figure.appendChild(figcap);
    }

    section.appendChild(figure);
    return section;
}

/**
 * #18 — Sitographie (liste de liens soulignés).
 */
function renderSitoGraphy(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:14px; border:3px solid #000000;');

    const h2 = document.createElement(ctx.headingTag(0));
    h2.setAttribute('style', `margin:0 0 10px 0; color:${HEADING_PRIMARY}; font-size:1.5rem; border-bottom:3px solid ${HEADING_PRIMARY}; padding-bottom:8px;`);
    h2.innerHTML = ctx.formatTextToHtml(data.title);
    section.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'margin:0; padding-left:18px; font-size:1.1rem;');

    data.links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ctx.escapeHtmlTags(sanitizeUrl(link.href))}" style="color:${LINK_COLOR}; text-decoration:underline 3px; font-weight:600;">${ctx.formatTextToHtml(link.text)}</a>`;
        ul.appendChild(li);
    });

    section.appendChild(ul);
    return section;
}

// =========================================================================
// Export par défaut — objet thème conforme à l'interface attendue
// =========================================================================
export default {
    id: 'accessible',

    config: {
        /** Style inline pour le conteneur <div role="document"> englobant */
        wrapperStyle: `font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:${TEXT_BODY}; background:${BG_PAGE}; padding:28px; max-width:1000px; margin:0 auto; line-height:1.8; font-size:1.1rem;`,

        /**
         * Styles hérités injectés sur chaque enfant direct pour résister
         * au nettoyage Éléa (qui supprime le wrapper englobant).
         */
        inheritedStyles: `font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.8; color:${TEXT_BODY}; font-size:1.1rem;`
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
