/**
 * Tests CSS / rendu visuel de Caramel
 *
 * Charge index.html dans une iframe et verifie les proprietes CSS calculees
 * sur les elements cles. Garantit la non-regression visuelle lors d'un
 * decouplage ou refactoring du CSS.
 *
 * Usage : ouvrir tests/test-css.html depuis le serveur local.
 */

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

/** Raccourci pour getComputedStyle dans l'iframe */
function css(el) {
    return el.ownerDocument.defaultView.getComputedStyle(el);
}

// =======================================================================
// ETAPE 1 : VARIABLES CSS
// =======================================================================

function runStep1_CSSVariables(doc) {
    console.group('Etape 1 : Variables CSS');
    _ctx = { step: 1, stepName: 'Variables CSS', file: '', module: '', source: '' };

    const root = doc.documentElement;
    const style = getComputedStyle(root);

    // z-index hierarchy
    const zVars = ['--z-dropdown', '--z-modal', '--z-fullscreen', '--z-toast'];
    for (const v of zVars) {
        const val = style.getPropertyValue(v).trim();
        assert(
            val && val !== '' && !isNaN(parseInt(val)),
            `[1a.Var] ${v} = "${val}" (definie et numerique)`
        );
    }

    // z-index order: dropdown < modal < fullscreen
    const zDropdown = parseInt(style.getPropertyValue('--z-dropdown'));
    const zModal = parseInt(style.getPropertyValue('--z-modal'));
    const zFullscreen = parseInt(style.getPropertyValue('--z-fullscreen'));
    assert(
        zDropdown < zModal && zModal < zFullscreen,
        `[1b.Order] z-index hierarchy: dropdown(${zDropdown}) < modal(${zModal}) < fullscreen(${zFullscreen})`
    );

    // Backdrop colors
    const backdrop = style.getPropertyValue('--backdrop-light').trim();
    assert(
        backdrop && backdrop.includes('rgba'),
        `[1c.Backdrop] --backdrop-light definie : "${backdrop.substring(0, 30)}"`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : LAYOUT PRINCIPAL
// =======================================================================

function runStep2_MainLayout(doc) {
    console.group('Etape 2 : Layout principal');
    _ctx = { step: 2, stepName: 'Layout', file: '', module: '', source: '' };

    // 2a. Container principal existe et a une max-width
    const container = doc.querySelector('.container');
    if (container) {
        const containerStyle = css(container);
        assert(true, `[2a.Container] .container present`);
        assert(
            containerStyle.display !== 'none',
            `[2b.Visible] .container visible (display: ${containerStyle.display})`
        );
    } else {
        assert(false, `[2a.Container] .container absent du DOM`);
    }

    // 2c. Pas de scroll horizontal
    assert(
        doc.body.scrollWidth <= doc.documentElement.clientWidth + 2,
        `[2c.NoHScroll] Pas de scroll horizontal (body: ${doc.body.scrollWidth}px, viewport: ${doc.documentElement.clientWidth}px)`
    );

    // 2d. Header/footer existent
    const header = doc.querySelector('header, .header, nav');
    const footer = doc.querySelector('footer, .footer');
    assert(!!header, `[2d.Header] Header present`);
    assert(!!footer, `[2e.Footer] Footer present`);

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : GRILLE D'ACTIVITES
// =======================================================================

function runStep3_ActivityGrid(doc) {
    console.group('Etape 3 : Grille d\'activites');
    _ctx = { step: 3, stepName: 'Grille activites', file: '', module: '', source: '' };

    const grid = doc.querySelector('.activity-grid');
    if (!grid) {
        assert(false, `[3a.Grid] .activity-grid absent du DOM`);
        console.groupEnd();
        return;
    }

    const gridStyle = css(grid);
    assert(
        gridStyle.display === 'grid' || gridStyle.display === 'flex',
        `[3a.Grid] .activity-grid display: ${gridStyle.display} (grid ou flex)`
    );

    // Tuiles generees
    const tiles = grid.querySelectorAll('[data-module]');
    assert(
        tiles.length > 0,
        `[3b.Tiles] ${tiles.length} tuiles generees`
    );

    // Chaque tuile a un titre non vide
    let emptyTitles = 0;
    for (const tile of tiles) {
        const titleEl = tile.querySelector('h3, .activity-title, [data-key]');
        if (!titleEl || !titleEl.textContent.trim()) emptyTitles++;
    }
    assert(
        emptyTitles === 0,
        `[3c.Titles] ${emptyTitles} tuile(s) sans titre (sur ${tiles.length})`,
        emptyTitles > 0 ? { hint: 'Verifier que les traductions sont chargees' } : null
    );

    // Chaque tuile a une image visible
    let brokenImages = 0;
    const images = grid.querySelectorAll('img');
    for (const img of images) {
        if (img.naturalWidth === 0 && img.complete) brokenImages++;
    }
    assert(
        brokenImages === 0,
        `[3d.Images] ${brokenImages} image(s) cassee(s) sur ${images.length}`
    );

    // Les tuiles sont cliquables (cursor pointer)
    if (tiles.length > 0) {
        const firstTile = tiles[0];
        const tileStyle = css(firstTile);
        assert(
            tileStyle.cursor === 'pointer',
            `[3e.Cursor] Tuiles cliquables (cursor: ${tileStyle.cursor})`
        );
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : FILTRES
// =======================================================================

function runStep4_Filters(doc) {
    console.group('Etape 4 : Filtres');
    _ctx = { step: 4, stepName: 'Filtres', file: '', module: '', source: '' };

    const filterBar = doc.querySelector('.filter-bar');
    assert(!!filterBar, `[4a.Bar] .filter-bar presente`);

    const chips = doc.querySelectorAll('.filter-chip');
    assert(
        chips.length > 0,
        `[4b.Chips] ${chips.length} filtres trouves`
    );

    // Le filtre "Tout" est actif par defaut
    const activeChip = doc.querySelector('.filter-chip.active');
    assert(
        activeChip && activeChip.dataset.filterType === 'all',
        `[4c.Default] Filtre actif par defaut : "${activeChip?.dataset?.filterType || 'aucun'}" (attendu: all)`
    );

    // Chaque filtre a un style distinct pour hover/active
    if (chips.length > 0) {
        const normalChip = [...chips].find(c => !c.classList.contains('active'));
        if (normalChip && activeChip) {
            const normalBg = css(normalChip).backgroundColor;
            const activeBg = css(activeChip).backgroundColor;
            assert(
                normalBg !== activeBg,
                `[4d.ActiveStyle] Filtre actif a un fond distinct (actif: ${activeBg}, inactif: ${normalBg})`
            );
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : SELECTEUR DE LANGUE
// =======================================================================

function runStep5_LanguageSelector(doc) {
    console.group('Etape 5 : Selecteur de langue');
    _ctx = { step: 5, stepName: 'Langue', file: '', module: '', source: '' };

    const switcher = doc.querySelector('.language-switcher');
    assert(!!switcher, `[5a.Switcher] .language-switcher present`);

    const btn = doc.querySelector('.language-btn');
    assert(!!btn, `[5b.Btn] .language-btn present`);

    const dropdown = doc.querySelector('.language-dropdown');
    assert(!!dropdown, `[5c.Dropdown] .language-dropdown present`);

    // Le dropdown est cache par defaut
    if (dropdown) {
        const dropStyle = css(dropdown);
        const isHidden = dropStyle.display === 'none' || dropStyle.visibility === 'hidden' || dropStyle.opacity === '0';
        assert(isHidden, `[5d.Hidden] Dropdown cache par defaut (display: ${dropStyle.display}, opacity: ${dropStyle.opacity})`);
    }

    // Drapeaux dans le dropdown
    const flags = dropdown?.querySelectorAll('[data-lang]') || [];
    assert(
        flags.length >= 11,
        `[5e.Flags] ${flags.length} langues dans le dropdown (attendu >= 11)`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : FICHIERS CSS CHARGES
// =======================================================================

function runStep6_CSSFiles(doc) {
    console.group('Etape 6 : Fichiers CSS');
    _ctx = { step: 6, stepName: 'Fichiers CSS', file: '', module: '', source: '' };

    const stylesheets = [...doc.querySelectorAll('link[rel="stylesheet"][href]')];
    assert(
        stylesheets.length > 0,
        `[6a.Sheets] ${stylesheets.length} feuilles de style chargees`
    );

    // Verifier que les fichiers critiques sont la
    const hrefs = stylesheets.map(s => s.getAttribute('href') || '');
    const criticalFiles = ['style.css', 'custom.css'];
    for (const file of criticalFiles) {
        const found = hrefs.some(h => h.includes(file));
        assert(found, `[6b.File] ${file} charge`);
    }

    // Verifier qu'aucune feuille de style n'a echoue
    let failedSheets = 0;
    const failedHrefs = [];
    for (const sheet of stylesheets) {
        try {
            // Si on peut acceder aux regles, le CSS est charge
            const rules = sheet.sheet?.cssRules;
            if (rules === null || rules === undefined) {
                failedSheets++;
                const info = sheet.outerHTML.substring(0, 120);
                failedHrefs.push(info);
            }
        } catch (e) {
            // CORS peut bloquer l'acces aux regles des CSS externes
        }
    }
    assert(
        failedSheets === 0,
        `[6c.Loaded] ${failedSheets} feuille(s) de style non chargee(s)`,
        failedSheets > 0 ? { fichiers: failedHrefs.join(', ') } : null
    );

    // Nombre total de regles CSS
    let totalRules = 0;
    for (const sheet of doc.styleSheets) {
        try {
            totalRules += sheet.cssRules?.length || 0;
        } catch (e) { /* CORS */ }
    }
    assert(
        totalRules > 100,
        `[6d.Rules] ${totalRules} regles CSS chargees (attendu > 100)`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : TYPOGRAPHIE ET ACCESSIBILITE
// =======================================================================

function runStep7_Typography(doc) {
    console.group('Etape 7 : Typographie et accessibilite');
    _ctx = { step: 7, stepName: 'Typographie', file: '', module: '', source: '' };

    // 7a. Font-family sur body
    const bodyStyle = css(doc.body);
    assert(
        bodyStyle.fontFamily && bodyStyle.fontFamily.length > 5,
        `[7a.Font] body font-family: "${bodyStyle.fontFamily.substring(0, 50)}"`
    );

    // 7b. Taille de base lisible
    const fontSize = parseFloat(bodyStyle.fontSize);
    assert(
        fontSize >= 14 && fontSize <= 20,
        `[7b.Size] body font-size: ${fontSize}px (entre 14 et 20)`
    );

    // 7c. Line-height adequate
    const lineHeight = parseFloat(bodyStyle.lineHeight);
    assert(
        lineHeight >= fontSize * 1.2,
        `[7c.LineHeight] line-height: ${bodyStyle.lineHeight} (>= 1.2x la taille de police)`
    );

    // 7d. lang attribut sur <html>
    const lang = doc.documentElement.getAttribute('lang');
    assert(
        lang && lang.length >= 2,
        `[7d.Lang] <html lang="${lang}"> (attribut defini)`
    );

    // 7e. Viewport meta tag
    const viewport = doc.querySelector('meta[name="viewport"]');
    assert(
        viewport && viewport.content.includes('width=device-width'),
        `[7e.Viewport] Meta viewport presente avec width=device-width`
    );

    // 7f. Charset
    const charset = doc.querySelector('meta[charset]');
    assert(
        charset && charset.getAttribute('charset').toUpperCase() === 'UTF-8',
        `[7f.Charset] Meta charset UTF-8`
    );

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Variables CSS',
    'Layout',
    'Grille activites',
    'Filtres',
    'Langue',
    'Fichiers CSS',
    'Typographie'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que les custom properties CSS (--z-modal, --backdrop-light, etc.) sont definies sur :root et que la hierarchie de z-index est coherente.\n\nExemple : si un dropdown apparait au-dessus d\'une modale, c\'est un bug de z-index.',
    'Verifie le layout principal : .container visible, pas de scroll horizontal, header et footer presents.\n\nExemple : un decouplage CSS qui oublie les styles du container causerait un layout casse.',
    'Verifie que la grille d\'activites est en display grid/flex, que les tuiles sont generees avec des titres et images, et qu\'elles sont cliquables.\n\nExemple : si generateTiles() produit du HTML mais que le CSS grid est manquant, les tuiles s\'empilent.',
    'Verifie la barre de filtres : chips presentes, filtre "Tout" actif par defaut, style visuel distinct entre actif et inactif.\n\nExemple : si on deplace les styles de .filter-chip dans un autre fichier CSS, ce test verifie qu\'ils sont toujours appliques.',
    'Verifie le selecteur de langue : bouton, dropdown, drapeaux, et que le dropdown est cache par defaut.\n\nExemple : 11 langues doivent etre listees dans le dropdown.',
    'Verifie que toutes les feuilles de style sont chargees, que les fichiers critiques (style.css, custom.css) sont presents, et que le nombre total de regles CSS est raisonnable.\n\nExemple : un fichier CSS manquant ou mal reference causerait un rendu degrade.',
    'Verifie la typographie de base (font-family, font-size, line-height), les meta tags (viewport, charset, lang).\n\nExemple : un body sans font-family explicite utiliserait Times New Roman sur certains navigateurs.'
];

/**
 * Lance tous les tests CSS sur le document de l'iframe.
 * @param {Document} iframeDoc - Le document de l'iframe contenant index.html
 */
export function runAllTests(iframeDoc) {
    console.log('=== Tests CSS Caramel (7 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    runStep1_CSSVariables(iframeDoc);
    runStep2_MainLayout(iframeDoc);
    runStep3_ActivityGrid(iframeDoc);
    runStep4_Filters(iframeDoc);
    runStep5_LanguageSelector(iframeDoc);
    runStep6_CSSFiles(iframeDoc);
    runStep7_Typography(iframeDoc);

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests CSS', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
