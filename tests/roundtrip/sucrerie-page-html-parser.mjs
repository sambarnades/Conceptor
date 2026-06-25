/**
 * sucrerie-page-html-parser.mjs — COPIE VERBATIM de Sucrerie
 * assets/js/moodle/page-html-parser.js (parser inverse HTML→blocks pour Page/Livre).
 * Seule adaptation : import { debugLog } → noop local (Sucrerie l'importe de core/utils).
 * AUCUNE logique modifiée. Resynchroniser si Sucrerie évolue.
 */
const debugLog = () => {};

// =========================================================================
// HELPERS
// =========================================================================

function innerOf(el)  { return el ? el.innerHTML : ''; }
function textOf(el)   { return el ? el.textContent.trim() : ''; }
function attr(el, n)  { return el ? (el.getAttribute(n) || '') : ''; }

/** Premier enfant direct (pas via descendants) avec tag donné. */
function directChild(parent, tag) {
    if (!parent) return null;
    const t = tag.toLowerCase();
    for (const ch of parent.children) {
        if (ch.tagName.toLowerCase() === t) return ch;
    }
    return null;
}

/** Tous les enfants directs avec tag donné. */
function directChildren(parent, tag) {
    if (!parent) return [];
    const t = tag.toLowerCase();
    return Array.from(parent.children).filter((ch) => ch.tagName.toLowerCase() === t);
}

/**
 * Titres <h1>..<h6> enfants directs (niveau-agnostique). L'accessibilité fait
 * varier le niveau des titres selon le contexte : Page = h2, chapitre de Livre
 * = h4. Les extracteurs retrouvent donc le titre quel que soit son niveau —
 * le 1er titre direct = titre du bloc, les suivants = sous-titres (FAQ, sections).
 */
function directHeadings(parent) {
    if (!parent) return [];
    return Array.from(parent.children).filter((ch) => /^H[1-6]$/.test(ch.tagName));
}

/** Premier titre <h1>..<h6> enfant direct (titre principal d'un bloc). */
function directHeading(parent) {
    return directHeadings(parent)[0] || null;
}

/**
 * Premier enfant qui n'est ni `aria-hidden="true"` ni `role="heading"`
 * (utilisé pour récupérer le sous-titre du hero header en sautant la barre
 * dégradée et le titre).
 */
function firstNonDecorativeChild(parent) {
    if (!parent) return null;
    for (const ch of parent.children) {
        if (ch.getAttribute('aria-hidden') === 'true') continue;
        if (ch.getAttribute('role') === 'heading') continue;
        // Héros : sauter le titre (div.caramel-hero-title décoratif OU balise <hN>)
        // pour ne pas le confondre avec le sous-titre.
        if (ch.classList && ch.classList.contains('caramel-hero-title')) continue;
        if (/^H[1-6]$/.test(ch.tagName)) continue;
        return ch;
    }
    return null;
}

/**
 * Récupère le texte riche d'un encadré rendu par Caramel sous la forme
 * `<p style="margin:0;">${formatTextToHtml(text)}</p>` (callouts, cartes…).
 *
 * Piège : quand `text` est multi-paragraphes, formatTextToHtml produit
 * plusieurs `<p>` ; le navigateur **auto-ferme** alors le `<p style="margin:0;">`
 * wrapper et le contenu devient une *fratrie* de `<p>` dont le premier (le
 * wrapper vidé) est vide. Un `querySelector('p')` ne renvoyait que ce `<p>`
 * vide → encadré affiché VIDE (perte du texte ET du LaTeX). Cf. .mbz Page
 * « À retenir absolument » : seules les cartes mono-paragraphe survivaient.
 *
 * Ici on agrège TOUT le contenu du conteneur, en retirant les nœuds
 * décoratifs (ancres aria-hidden, barres dégradées) et les titres (`<hN>` :
 * extraits séparément comme `title`/`subtitle`), puis les `<p>` vides de
 * bord ; le cas mono-paragraphe est déballé pour rester iso-Caramel (texte
 * inline, pas de `<p>` superflu). Le LaTeX `\(…\)`/`\[…\]` est préservé
 * verbatim — il sera typeset par MathJax au rendu (renderMath dans page.js).
 *
 * Le conteneur peut donc être directement la carte/encadré (callout #04,
 * carte repère #03, contenu monument #08) : le titre éventuel est ignoré.
 *
 * @param {HTMLElement} container - élément dont le contenu est le texte riche
 * @returns {string} HTML interne reconstruit (jamais une chaîne vide si du
 *                   texte existe)
 */
function richTextOf(container) {
    if (!container) return '';
    const clone = container.cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"], h1, h2, h3, h4, h5, h6').forEach((n) => n.remove());

    const isEmptyP = (n) =>
        n && n.nodeType === Node.ELEMENT_NODE && n.tagName === 'P' &&
        !n.textContent.trim() && !n.querySelector('img, br, svg');
    while (clone.firstElementChild && isEmptyP(clone.firstElementChild)) {
        clone.firstElementChild.remove();
    }
    while (clone.lastElementChild && isEmptyP(clone.lastElementChild)) {
        clone.lastElementChild.remove();
    }

    // Mono-paragraphe : déballer l'unique <p> wrapper (rendu iso-Caramel).
    if (clone.children.length === 1 && clone.firstElementChild.tagName === 'P') {
        return clone.firstElementChild.innerHTML.trim();
    }
    return clone.innerHTML.trim();
}

// =========================================================================
// DÉTECTION DU THÈME
// =========================================================================

/**
 * Le thème est inscrit en clair par Caramel via un commentaire HTML
 * `<!-- caramel-page-theme:<id> -->` placé en tête du content (le wrapper
 * <div role="document"> qui portait la signature CSS du thème n'est jamais
 * sérialisé : Caramel renvoie son innerHTML).
 *
 * Fallback heuristique sur les `inheritedStyles` dupliqués sur le premier
 * enfant direct (signature CSS de chaque thème) si le commentaire est absent.
 *
 * - accessible : font-size:1.1rem + line-height:1.8
 * - dynamique  : font-size:1.05rem + line-height:1.7
 * - elea/dsfr  : line-height:1.65 (palettes distinctes mais signatures
 *                de wrapper identiques) → on retombe sur 'elea' par défaut.
 */
function detectTheme(wrapper) {
    // 1. Source de vérité : commentaire injecté par Caramel
    for (const node of wrapper.childNodes) {
        if (node.nodeType !== Node.COMMENT_NODE) continue;
        const m = (node.nodeValue || '').match(/caramel-page-theme:(\S+)/);
        if (m) return m[1];
    }

    // 2. Fallback heuristique : signature CSS du premier enfant direct
    const firstChild = Array.from(wrapper.children).find((c) => c.nodeType === Node.ELEMENT_NODE);
    const style = (firstChild ? attr(firstChild, 'style') : '') || '';
    const has = (s) => style.includes(s);
    if (has('font-size:1.1rem') && has('line-height:1.8'))  return 'accessible';
    if (has('font-size:1.05rem') && has('line-height:1.7')) return 'dynamique';
    if (has('line-height:1.65')) return 'elea';
    return 'elea';
}

// =========================================================================
// EXTRACTEURS (18 types)
// =========================================================================

/** #01 — En-tête héro : <section> avec <div role="heading" aria-level="1"> + barre + sous-titre.
 * Le renderer Caramel écrit `jsonData.title` (titre Page Moodle) dans le heading,
 * et préserve `data.title` original via `data-block-title` si différent. */
function extractHeroHeader(el) {
    // Le titre du héros porte la classe-hook .caramel-hero-title (un <div>
    // décoratif en export Éléa, ou un <h1> en preview standalone) ; on garde le
    // fallback legacy [role=heading]/h1 pour les anciens .mbz.
    const heading = el.querySelector('.caramel-hero-title, [role="heading"][aria-level="1"], h1');
    const overrideTitle = attr(el, 'data-block-title');
    const subtitleEl = firstNonDecorativeChild(el);
    return {
        title:    overrideTitle || textOf(heading),
        subtitle: subtitleEl ? innerOf(subtitleEl) : ''
    };
}

/** #02 — Sommaire : <nav role="navigation"> > <ul> > <li> > <a href> */
function extractNavSummary(el) {
    return {
        links: Array.from(el.querySelectorAll('li')).map((li) => {
            const a = li.querySelector('a');
            return {
                href: attr(a, 'href'),
                text: a ? innerOf(a) : innerOf(li)
            };
        })
    };
}

/** #03 — Repères : <section> > <h2> + grid de cartes (<div> > <h3> + <p>) */
function extractHistoReperes(el) {
    const h2 = directHeading(el);
    const grid = el.querySelector('div'); // 1ère div = grid (titre vient avant)
    const cards = Array.from(grid?.children || []).map((card) => ({
        title: innerOf(card.querySelector('h2, h3, h4, h5, h6')),
        // richTextOf : tout le corps de la carte (multi-paragraphes + LaTeX),
        // h3 titre ignoré. L'ancien querySelector('p') vidait la carte sur un
        // texte multi-ligne (wrapper <p> auto-fermé) — même bug que #04.
        text:  richTextOf(card)
    }));
    return { title: innerOf(h2), cards };
}

/** #04 — Encadrés objectif/savoir/alerte : grid de <div> avec border-left coloré.
 * Source de vérité : attribut `data-callout-type` posé par Caramel.
 * Fallback : couleur CSS (fragile en thème dsfr où objectif et savoir
 * partagent la palette) puis `role="alert"` pour distinguer alerte. */
function extractCalloutSet(el) {
    const h2 = directHeading(el);
    const callouts = [];
    const grid = Array.from(el.children).find((c) => c.tagName === 'DIV');
    for (const c of grid?.children || []) {
        let type = attr(c, 'data-callout-type');
        if (!type) {
            if (c.getAttribute('role') === 'alert') {
                type = 'alerte';
            } else {
                const style = attr(c, 'style');
                if (style.includes('#b91c1c') || style.includes('#e1000f')) type = 'alerte';
                else if (style.includes('#ff7a18') || style.includes('#b04a12')) type = 'savoir';
                else type = 'objectif';
            }
        }
        // richTextOf agrège TOUT le contenu de la carte (multi-paragraphes +
        // LaTeX inclus). L'ancien querySelector('p') ne prenait que le 1er <p>
        // — vide quand Caramel auto-ferme son wrapper sur un texte multi-ligne,
        // d'où des cartes « À retenir » vides côté Sucrerie alors que Caramel
        // (qui part des blocks, sans round-trip HTML) les affichait.
        callouts.push({ type, text: richTextOf(c) });
    }
    return { title: innerOf(h2), callouts };
}

/** #05 — Cartes statistiques : grid de <div> > barre + <p value> + <p label> */
function extractStatsCards(el) {
    const h2 = directHeading(el);
    const grid = Array.from(el.children).find((c) => c.tagName === 'DIV' && !c.matches('h2'));
    const stats = [];
    for (const card of grid?.children || []) {
        const ps = directChildren(card, 'p');
        if (ps.length >= 2) stats.push({ value: innerOf(ps[0]), label: innerOf(ps[1]) });
        else if (ps.length === 1) stats.push({ value: innerOf(ps[0]), label: '' });
    }
    return { title: innerOf(h2), stats };
}

/** #06 / #10 — Tableau : <table> > caption / thead > tr > th / tbody > tr > td */
function extractTable(el) {
    const h2 = directHeading(el);
    const table = el.querySelector('table');
    const caption = innerOf(table?.querySelector('caption'));
    const headers = Array.from(table?.querySelectorAll('thead th') || []).map(innerOf);
    const rows = Array.from(table?.querySelectorAll('tbody tr') || []).map((tr) =>
        Array.from(tr.children).map(innerOf)
    );
    return { title: innerOf(h2), caption, headers, rows };
}

/** #07 — Glossary chips : <ul> > <li> > <span> */
function extractGlossaryChips(el) {
    const h2 = directHeading(el);
    const chips = Array.from(el.querySelectorAll('li')).map((li) => {
        const span = li.querySelector('span');
        return innerOf(span || li);
    });
    return { title: innerOf(h2), chips };
}

/** #08 — Monuments grid : <article> > figure > img + figcaption + <div> > h3 + p */
function extractMonumentsGrid(el) {
    const h2 = directHeading(el);
    const articles = Array.from(el.querySelectorAll('article'));
    const cards = articles.map((art) => {
        const img = art.querySelector('img');
        const figcap = art.querySelector('figcaption');
        const h3 = art.querySelector('h2, h3, h4, h5, h6');
        // Conteneur texte = la div de contenu (h3 + <p>), pas la barre
        // décorative aria-hidden ni la <figure>. richTextOf agrège tout le
        // corps (multi-paragraphes + LaTeX), titre h3 ignoré — corrige le
        // même vidage que #04 sur un texte multi-ligne.
        const contentDiv = Array.from(art.children).find(
            (c) => c.tagName === 'DIV' && c.getAttribute('aria-hidden') !== 'true' && c.querySelector('h2, h3, h4, h5, h6, p')
        );
        return {
            img_src: attr(img, 'src'),
            img_alt: attr(img, 'alt'),
            caption: innerOf(figcap),
            title:   innerOf(h3),
            text:    richTextOf(contentDiv)
        };
    });
    return { title: innerOf(h2), cards };
}

/** #09 — Comparaison 2 figures : optional h2 + grid avec 2 figures + texte optional */
function extractFiguresComparison(el) {
    const h2 = directHeading(el);
    const figures = Array.from(el.querySelectorAll('figure'));
    const figToObj = (fig) => {
        if (!fig) return null;
        const img = fig.querySelector('img');
        const figcap = fig.querySelector('figcaption');
        return {
            img_src: attr(img, 'src'),
            img_alt: attr(img, 'alt'),
            caption: innerOf(figcap)
        };
    };
    // Texte descriptif optionnel : <p> ou <div> direct enfant après la grid
    const textEls = Array.from(el.children).filter(
        (c) => (c.tagName === 'P' || c.tagName === 'DIV') && !c.querySelector('figure')
    );
    const lastText = textEls[textEls.length - 1];
    const out = {
        title: innerOf(h2),
        left:  figToObj(figures[0]),
        right: figToObj(figures[1])
    };
    if (lastText && !lastText.matches('h2')) out.text = innerOf(lastText);
    return out;
}

/** #11 — Encadré définition : <h2> + <p>/<div> texte */
function extractDefinitionBox(el) {
    const h2 = directHeading(el);
    const txt = el.querySelector('p, div:not([aria-hidden="true"])');
    return { title: innerOf(h2), text: innerOf(txt) };
}

/** #12 — Paragraphes contextuels : <h2> + multiple <p>/<div> */
function extractContextParagraphs(el) {
    const h2 = directHeading(el);
    const paragraphs = Array.from(el.children)
        .filter((c) => (c.tagName === 'P' || c.tagName === 'DIV') && c.getAttribute('aria-hidden') !== 'true')
        .map(innerOf);
    return { title: innerOf(h2), paragraphs };
}

/** #13 — Fiche document long : <article> > barre + <div> > h2 + (content | sections + image) */
function extractMonumentSheetLong(el) {
    // el est l'<article>. Le contenu est dans le 2ème div (le 1er est la barre)
    const inner = directChildren(el, 'div').find((d) => d.getAttribute('aria-hidden') !== 'true');
    if (!inner) return { title: '', content: '' };
    const innerHeadings = directHeadings(inner);
    const h2 = innerHeadings[0] || null;     // titre principal (1er titre direct)
    const img = inner.querySelector('img');
    const h3s = innerHeadings.slice(1);       // sous-titres de sections (titres suivants)

    const out = { title: innerOf(h2) };
    if (img) {
        out.img_src = attr(img, 'src');
        out.img_alt = attr(img, 'alt');
    }

    if (h3s.length === 0) {
        // Format simple : un seul <p>/<div> texte
        const txt = directChildren(inner, 'p').concat(directChildren(inner, 'div'))
            .find((c) => c.getAttribute('aria-hidden') !== 'true' && !c.querySelector('img'));
        out.content = innerOf(txt);
    } else {
        // Format sections : pour chaque h3, prendre le <p>/<div> qui suit
        out.sections = h3s.map((h3) => {
            let next = h3.nextElementSibling;
            // Sauter d'éventuelles images entre h3 et p
            while (next && next.tagName === 'IMG') next = next.nextElementSibling;
            return {
                subtitle: innerOf(h3),
                text: next && (next.tagName === 'P' || next.tagName === 'DIV') ? innerOf(next) : ''
            };
        });
    }
    return out;
}

/** #14 — FAQ : <h2> + paires <h3 question> + <p réponse> */
function extractFaqBlock(el) {
    const faqHeadings = directHeadings(el);
    const h2 = faqHeadings[0] || null;        // titre du bloc (1er titre direct)
    const h3s = faqHeadings.slice(1);          // questions (titres suivants)
    const questions = h3s.map((h3) => {
        let next = h3.nextElementSibling;
        return {
            q: innerOf(h3),
            a: next && (next.tagName === 'P' || next.tagName === 'DIV') ? innerOf(next) : ''
        };
    });
    return { title: innerOf(h2), questions };
}

/** #15 — Mythes vs Réalités : grid 2 colonnes, chaque colonne <div> > h2 + <ul>.
 * Reconstruction par index : chaque <li> porte `data-pair-index="N"` → on
 * remplit items[N].myth ou items[N].reality au bon emplacement. Si l'attribut
 * est absent (HTML antérieur au marquage), fallback sur l'ordre brut.
 * Note : les titres "Mythes"/"Réalités" sont des libellés du thème (i18n) et
 * ne sont pas réintroduits dans le JSON — ils n'existent pas dans le source. */
function extractMythsRealities(el) {
    const titleEl = Array.from(el.querySelectorAll(':scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')).find(
        (h) => attr(h, 'style').includes('1 / -1') || attr(h, 'style').includes('grid-column')
    );
    const cols = Array.from(el.children).filter((c) => c.tagName === 'DIV');
    const lis = (col) => col ? Array.from(col.querySelectorAll('li')) : [];
    const lefts  = lis(cols[0]);
    const rights = lis(cols[1]);

    const hasPairIdx = lefts.concat(rights).some((li) => li.hasAttribute('data-pair-index'));
    const items = [];
    if (hasPairIdx) {
        const place = (li, key) => {
            const idx = parseInt(attr(li, 'data-pair-index'), 10);
            if (!Number.isFinite(idx) || idx < 0) return;
            while (items.length <= idx) items.push({ myth: '', reality: '' });
            items[idx][key] = innerOf(li);
        };
        lefts.forEach((li) => place(li, 'myth'));
        rights.forEach((li) => place(li, 'reality'));
    } else {
        const max = Math.max(lefts.length, rights.length);
        for (let i = 0; i < max; i++) {
            items.push({
                myth:    lefts[i]  ? innerOf(lefts[i])  : '',
                reality: rights[i] ? innerOf(rights[i]) : ''
            });
        }
    }
    return { title: innerOf(titleEl), items };
}

/** #16 — Méthode + image + steps : <h2> + <ol> > <li> + figure optionnelle */
function extractMethodImageDesc(el) {
    const h2 = directHeading(el);
    const ol = el.querySelector('ol');
    const fig = el.querySelector('figure');
    const img = fig?.querySelector('img');
    const figcap = fig?.querySelector('figcaption');
    const out = {
        title: innerOf(h2),
        steps: Array.from(ol?.querySelectorAll('li') || []).map(innerOf)
    };
    if (img) {
        out.img_src = attr(img, 'src');
        out.img_alt = attr(img, 'alt');
        out.caption = innerOf(figcap);
    }
    return out;
}

/** #17 — Citation bilingue : <figure> > 2 <blockquote> + <figcaption> auteur */
function extractQuoteBilingual(el) {
    const fig = el.querySelector('figure');
    const quotes = Array.from(fig?.querySelectorAll('blockquote') || []);
    const author = fig?.querySelector('figcaption');
    const authorText = author ? innerOf(author).replace(/^[—–-]\s*/, '') : '';
    return {
        quote_langue_initiale: innerOf(quotes[0]),
        quote_langue_arrivee:  innerOf(quotes[1]),
        author: authorText
    };
}

/** #18 — Sitographie : <h2> + <ul> > <li> > <a href> */
function extractSitoGraphy(el) {
    const h2 = directHeading(el);
    return {
        title: innerOf(h2),
        links: Array.from(el.querySelectorAll('li')).map((li) => {
            const a = li.querySelector('a');
            return {
                href: attr(a, 'href'),
                text: a ? innerOf(a) : innerOf(li)
            };
        })
    };
}

// =========================================================================
// REGISTRE DES EXTRACTEURS
// =========================================================================

const EXTRACTORS = {
    '#01_hero_header':         extractHeroHeader,
    '#02_nav_summary':         extractNavSummary,
    '#03_histo_reperes':       extractHistoReperes,
    '#04_callout_set':         extractCalloutSet,
    '#05_stats_cards':         extractStatsCards,
    '#06_lexique_table':       extractTable,
    '#07_glossary_chips':      extractGlossaryChips,
    '#08_monuments_grid':      extractMonumentsGrid,
    '#09_figures_comparison':  extractFiguresComparison,
    '#10_table_comparison':    extractTable,
    '#11_definition_box':      extractDefinitionBox,
    '#12_context_paragraphs':  extractContextParagraphs,
    '#13_monument_sheet_long': extractMonumentSheetLong,
    '#14_faq_block':           extractFaqBlock,
    '#15_myths_realities':     extractMythsRealities,
    '#16_method_image_desc':   extractMethodImageDesc,
    '#17_quote_bilingual':     extractQuoteBilingual,
    '#18_sito_graphy':         extractSitoGraphy
};

// =========================================================================
// API PUBLIQUE
// =========================================================================

/**
 * Parse un HTML produit par generateHtmlFromBlocks et retourne la structure
 * { theme, blocks } prête pour l'éditeur.
 *
 * @param {string} html - HTML extrait de <page><content> ou <chapter><content>
 * @returns {{theme: string, blocks: Array} | null}
 *   null si aucun marqueur caramel-block trouvé (caller fait le fallback).
 */
export function parseHtmlIntoBlocks(html) {
    if (!html || typeof html !== 'string') return null;

    const root = document.createElement('div');
    root.innerHTML = html;

    // Le wrapper Caramel est un <div role="document"> ; sinon on prend la
    // racine elle-même (cas où le wrapper a été nettoyé par Éléa).
    const wrapper = root.querySelector('div[role="document"]') || root;

    // Vérifier rapidement la présence d'au moins un marqueur — sinon on
    // sort tôt pour laisser le caller appliquer son fallback.
    const probe = Array.from(wrapper.childNodes).some(
        (n) => n.nodeType === Node.COMMENT_NODE && /caramel-block:/.test(n.nodeValue || '')
    );
    if (!probe) {
        debugLog('page-html-parser', 'aucun marqueur caramel-block trouvé, fallback');
        return null;
    }

    const theme = detectTheme(wrapper);
    const blocks = [];
    let pendingType = null;

    for (const node of wrapper.childNodes) {
        if (node.nodeType === Node.COMMENT_NODE) {
            const m = (node.nodeValue || '').match(/caramel-block:(\S+)/);
            if (m) pendingType = m[1];
        } else if (node.nodeType === Node.ELEMENT_NODE && pendingType) {
            const extractor = EXTRACTORS[pendingType];
            if (extractor) {
                try {
                    blocks.push({ type: pendingType, data: extractor(node) });
                } catch (err) {
                    debugLog('page-html-parser', `extracteur ${pendingType} a planté:`, err);
                    // Fallback : on garde le bloc en HTML brut pour ne pas perdre le contenu.
                    blocks.push({ type: 'html', html: node.outerHTML });
                }
            } else {
                // Type inconnu → fallback HTML brut
                debugLog('page-html-parser', `type non géré: ${pendingType}, fallback html`);
                blocks.push({ type: 'html', html: node.outerHTML });
            }
            pendingType = null;
        }
    }

    return { theme, blocks };
}
