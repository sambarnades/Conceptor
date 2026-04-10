/**
 * Tests d'interface utilisateur (UI) de Caramel
 *
 * Charge index.html dans une iframe et verifie le comportement des tuiles,
 * filtres, selecteur de langue et ouverture de la sidebar.
 *
 * Usage : ouvrir tests/test-ui.html depuis le serveur local.
 */

import { allModules } from '../js/core/definitions.js';

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

/** Petit delai pour laisser le DOM se mettre a jour apres un clic */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =======================================================================
// ETAPE 1 : TUILES GENEREES
// =======================================================================

function runStep1_TilesGenerated(doc) {
    console.group('Etape 1 : Tuiles generees');
    _ctx = { step: 1, stepName: 'Tuiles', file: '', module: '', source: '' };

    const grid = doc.querySelector('.activity-grid .grid');
    assert(!!grid, `[1a.Grid] Conteneur .activity-grid .grid present`);

    const tiles = doc.querySelectorAll('.h5p-tile[data-module]');
    // Compter dynamiquement les modules visibles (sans hidden: true)
    const visibleModules = Object.values(allModules).filter(m => !m.hidden);
    const hiddenModules = Object.values(allModules).filter(m => m.hidden).map(m => m.englishName || m.name);
    assert(
        tiles.length === visibleModules.length,
        `[1b.Count] ${tiles.length} tuile(s) generee(s) (attendu : ${visibleModules.length} sur ${Object.keys(allModules).length} modules)`,
        tiles.length !== visibleModules.length ? { hidden: hiddenModules.join(', '), total: Object.keys(allModules).length } : null
    );

    // Chaque tuile a un data-module non vide
    let emptyModules = 0;
    for (const tile of tiles) {
        if (!tile.dataset.module || !tile.dataset.module.trim()) emptyModules++;
    }
    assert(
        emptyModules === 0,
        `[1c.DataModule] ${emptyModules} tuile(s) sans data-module (sur ${tiles.length})`
    );

    // Pas de doublons dans les data-module
    const moduleKeys = [...tiles].map(t => t.dataset.module);
    const uniqueKeys = new Set(moduleKeys);
    assert(
        uniqueKeys.size === moduleKeys.length,
        `[1d.Unique] ${moduleKeys.length - uniqueKeys.size} doublon(s) dans les data-module`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : CONTENU DES TUILES
// =======================================================================

function runStep2_TileContent(doc) {
    console.group('Etape 2 : Contenu des tuiles');
    _ctx = { step: 2, stepName: 'Contenu tuiles', file: '', module: '', source: '' };

    const tiles = doc.querySelectorAll('.h5p-tile[data-module]');

    // Chaque tuile a un titre non vide
    let emptyTitles = 0;
    const emptyTitleModules = [];
    for (const tile of tiles) {
        const titleEl = tile.querySelector('.tile-name-fr, [data-key], h3');
        if (!titleEl || !titleEl.textContent.trim()) {
            emptyTitles++;
            emptyTitleModules.push(tile.dataset.module);
        }
    }
    assert(
        emptyTitles === 0,
        `[2a.Titles] ${emptyTitles} tuile(s) sans titre (sur ${tiles.length})`,
        emptyTitles > 0 ? { modules: emptyTitleModules.join(', ') } : null
    );

    // Chaque tuile a une image
    let tilesWithoutImage = 0;
    for (const tile of tiles) {
        const img = tile.querySelector('img');
        if (!img) tilesWithoutImage++;
    }
    assert(
        tilesWithoutImage === 0,
        `[2b.Images] ${tilesWithoutImage} tuile(s) sans balise img (sur ${tiles.length})`
    );

    // Verifier que les images se chargent (naturalWidth > 0 pour celles qui sont complete)
    let brokenImages = 0;
    const brokenSrcs = [];
    for (const tile of tiles) {
        const img = tile.querySelector('img');
        if (img && img.complete && img.naturalWidth === 0) {
            brokenImages++;
            brokenSrcs.push(img.getAttribute('src') || '(vide)');
        }
    }
    assert(
        brokenImages === 0,
        `[2c.ImgLoad] ${brokenImages} image(s) cassee(s) sur ${tiles.length}`,
        brokenImages > 0 ? { fichiers: brokenSrcs.join(', ') } : null
    );

    // Chaque tuile a un label de type (H5P ou Elea)
    let tilesWithLabel = 0;
    for (const tile of tiles) {
        const label = tile.querySelector('.module-label');
        if (label) tilesWithLabel++;
    }
    assert(
        tilesWithLabel === tiles.length,
        `[2d.Labels] ${tilesWithLabel}/${tiles.length} tuile(s) avec label de type (H5P/Elea)`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : FILTRES PAR TYPE D'ACTIVITE
// =======================================================================

function runStep3_ActivityFilters(doc) {
    console.group('Etape 3 : Filtres par type');
    _ctx = { step: 3, stepName: 'Filtres type', file: '', module: '', source: '' };

    const chips = doc.querySelectorAll('.filter-chip--activity');
    assert(
        chips.length >= 4,
        `[3a.Chips] ${chips.length} filtres de type d'activite (attendu >= 4 : tout, quiz, text, memory)`
    );

    // Le filtre "Tout" est actif par defaut
    const activeChip = doc.querySelector('.filter-chip--activity.active');
    assert(
        activeChip && activeChip.dataset.filterType === 'all',
        `[3b.Default] Filtre actif par defaut : "${activeChip?.dataset?.filterType || 'aucun'}" (attendu: all)`
    );

    const allTiles = doc.querySelectorAll('.h5p-tile[data-module]');
    const totalTiles = allTiles.length;

    // Cliquer sur "quiz" => seules les tuiles quiz sont visibles
    const quizChip = doc.querySelector('.filter-chip--activity[data-filter-type="quiz"]');
    if (quizChip) {
        quizChip.click();

        const visibleAfterQuiz = [...allTiles].filter(t => t.style.display !== 'none').length;
        const expectedQuiz = [...allTiles].filter(t => (t.dataset.activityTypes || '').includes('quiz')).length;
        assert(
            visibleAfterQuiz === expectedQuiz && visibleAfterQuiz > 0,
            `[3c.Quiz] Filtre quiz : ${visibleAfterQuiz} visible(s) (attendu: ${expectedQuiz})`,
            visibleAfterQuiz !== expectedQuiz ? { visible: visibleAfterQuiz, attendu: expectedQuiz } : null
        );

        // Verifier que le chip quiz est maintenant actif
        assert(
            quizChip.classList.contains('active'),
            `[3d.Active] Chip quiz a la classe .active apres clic`
        );
    } else {
        assert(false, `[3c.Quiz] Chip quiz introuvable`);
        assert(false, `[3d.Active] Chip quiz introuvable`);
    }

    // Revenir au filtre "Tout"
    const allChip = doc.querySelector('.filter-chip--activity[data-filter-type="all"]');
    if (allChip) {
        allChip.click();
        const visibleAfterAll = [...allTiles].filter(t => t.style.display !== 'none').length;
        assert(
            visibleAfterAll === totalTiles,
            `[3e.Reset] Retour a "Tout" : ${visibleAfterAll} visible(s) (attendu: ${totalTiles})`
        );
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : FILTRES PAR PLATEFORME
// =======================================================================

function runStep4_PlatformFilters(doc) {
    console.group('Etape 4 : Filtres plateforme');
    _ctx = { step: 4, stepName: 'Filtres plateforme', file: '', module: '', source: '' };

    const platformChips = doc.querySelectorAll('.filter-chip[data-filter-platform]');
    assert(
        platformChips.length >= 3,
        `[4a.Chips] ${platformChips.length} filtres de plateforme (attendu >= 3 : h5p, elea, moodle)`
    );

    const allTiles = doc.querySelectorAll('.h5p-tile[data-module]');
    const totalTiles = allTiles.length;

    // Cliquer sur "h5p" => seules les tuiles h5p sont visibles
    const h5pChip = doc.querySelector('.filter-chip[data-filter-platform="h5p"]');
    if (h5pChip) {
        h5pChip.click();

        const visibleAfterH5P = [...allTiles].filter(t => t.style.display !== 'none').length;
        assert(
            visibleAfterH5P > 0 && visibleAfterH5P < totalTiles,
            `[4b.H5P] Filtre H5P : ${visibleAfterH5P} visible(s) (attendu: entre 1 et ${totalTiles - 1})`
        );

        // Desactiver le filtre en recliquant
        h5pChip.click();
        const visibleAfterToggle = [...allTiles].filter(t => t.style.display !== 'none').length;
        assert(
            visibleAfterToggle === totalTiles,
            `[4c.Toggle] Desactivation filtre H5P : ${visibleAfterToggle} visible(s) (attendu: ${totalTiles})`
        );
    } else {
        assert(false, `[4b.H5P] Chip H5P introuvable`);
        assert(false, `[4c.Toggle] Chip H5P introuvable`);
    }

    // Filtres combines : type + plateforme
    const quizChip = doc.querySelector('.filter-chip--activity[data-filter-type="quiz"]');
    const eleaChip = doc.querySelector('.filter-chip[data-filter-platform="elea"]');
    if (quizChip && eleaChip) {
        quizChip.click();
        eleaChip.click();

        const visibleCombined = [...allTiles].filter(t => t.style.display !== 'none').length;
        assert(
            visibleCombined >= 0 && visibleCombined < totalTiles,
            `[4d.Combined] Filtre quiz + elea : ${visibleCombined} visible(s) (filtre croise actif)`
        );

        // Reset
        const allChip = doc.querySelector('.filter-chip--activity[data-filter-type="all"]');
        if (allChip) allChip.click();
        eleaChip.click(); // desactiver
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : SELECTEUR DE LANGUE
// =======================================================================

async function runStep5_LanguageSwitcher(doc) {
    console.group('Etape 5 : Selecteur de langue');
    _ctx = { step: 5, stepName: 'Langue', file: '', module: '', source: '' };

    // Langue initiale
    const initialLang = doc.documentElement.getAttribute('lang');
    assert(
        initialLang === 'fr',
        `[5a.InitLang] Langue initiale : "${initialLang}" (attendu: fr)`
    );

    // Cliquer sur le bouton de langue pour ouvrir le dropdown
    const langBtn = doc.querySelector('.language-btn');
    const switcher = doc.querySelector('.language-switcher');
    if (langBtn && switcher) {
        langBtn.click();
        assert(
            switcher.classList.contains('open'),
            `[5b.Open] Dropdown ouvert apres clic sur le bouton langue`
        );

        // Selectionner l'anglais
        // Note : le markup utilise des <button data-lang="..."> (et non des <a>),
        // d'où le sélecteur générique [data-lang] qui couvre les deux cas.
        const enLink = doc.querySelector('.language-dropdown [data-lang="en"]');
        if (enLink) {
            enLink.click();
            // Attendre le chargement asynchrone des traductions
            await wait(2000);

            const newLang = doc.documentElement.getAttribute('lang');
            assert(
                newLang === 'en',
                `[5c.Change] Langue apres changement : "${newLang}" (attendu: en)`
            );

            // Verifier que le dropdown s'est ferme
            assert(
                !switcher.classList.contains('open'),
                `[5d.Close] Dropdown ferme apres selection`
            );

            // Revenir au francais
            langBtn.click();
            const frLink = doc.querySelector('.language-dropdown [data-lang="fr"]');
            if (frLink) {
                frLink.click();
                await wait(2000);
            }
        } else {
            assert(false, `[5c.Change] Lien anglais introuvable dans le dropdown`);
            assert(false, `[5d.Close] Lien anglais introuvable`);
        }
    } else {
        assert(false, `[5b.Open] Bouton langue introuvable`);
        assert(false, `[5c.Change] Bouton langue introuvable`);
        assert(false, `[5d.Close] Bouton langue introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : OUVERTURE DE LA SIDEBAR
// =======================================================================

async function runStep6_SidebarOpen(doc) {
    console.group('Etape 6 : Sidebar');
    _ctx = { step: 6, stepName: 'Sidebar', file: '', module: '', source: '' };

    const sidebar = doc.querySelector('#module-sidebar');
    const overlay = doc.querySelector('#sidebar-overlay');
    assert(!!sidebar, `[6a.Sidebar] Element #module-sidebar present`);
    assert(!!overlay, `[6b.Overlay] Element #sidebar-overlay present`);

    // La sidebar est fermee par defaut
    if (sidebar) {
        assert(
            !sidebar.classList.contains('open'),
            `[6c.Closed] Sidebar fermee par defaut`
        );
    }

    // Cliquer sur la premiere tuile
    const firstTile = doc.querySelector('.h5p-tile[data-module]');
    if (firstTile && sidebar) {
        const moduleKey = firstTile.dataset.module;
        firstTile.click();
        await wait(500);

        assert(
            sidebar.classList.contains('open'),
            `[6d.Open] Sidebar ouverte apres clic sur tuile "${moduleKey}"`
        );

        if (overlay) {
            assert(
                overlay.classList.contains('open'),
                `[6e.OverlayOpen] Overlay visible apres clic sur tuile`
            );
        }

        // Verifier que la tuile a la classe active
        assert(
            firstTile.classList.contains('active'),
            `[6f.TileActive] Tuile "${moduleKey}" a la classe .active`
        );

        // Verifier le titre dans la sidebar
        const modalTitle = sidebar.querySelector('.modal-title');
        assert(
            modalTitle && modalTitle.textContent.trim().length > 0,
            `[6g.Title] Titre dans la sidebar : "${modalTitle?.textContent?.trim() || '(vide)'}"`
        );

        // Fermer la sidebar via le bouton close
        const closeBtn = sidebar.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.click();
            await wait(300);
            assert(
                !sidebar.classList.contains('open'),
                `[6h.Close] Sidebar fermee apres clic sur le bouton fermer`
            );
        }
    } else {
        assert(false, `[6d.Open] Tuile ou sidebar introuvable`);
        assert(false, `[6e.OverlayOpen] Tuile ou sidebar introuvable`);
        assert(false, `[6f.TileActive] Tuile introuvable`);
        assert(false, `[6g.Title] Tuile introuvable`);
        assert(false, `[6h.Close] Tuile introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : ONGLETS MODE (SIMPLE / AVANCE)
// =======================================================================

function runStep7_ModeTabs(doc) {
    console.group('Etape 7 : Onglets mode');
    _ctx = { step: 7, stepName: 'Mode tabs', file: '', module: '', source: '' };

    const modeTabs = doc.querySelectorAll('.mode-tab');
    assert(
        modeTabs.length >= 2,
        `[7a.Tabs] ${modeTabs.length} onglet(s) de mode (attendu >= 2 : simple, avance)`
    );

    // Le mode simple est actif par defaut
    const activeTab = doc.querySelector('.mode-tab.active');
    assert(
        activeTab && activeTab.dataset.mode === 'simple',
        `[7b.Default] Mode actif par defaut : "${activeTab?.dataset?.mode || 'aucun'}" (attendu: simple)`
    );

    // Champs avances caches par defaut
    const advancedFields = doc.querySelector('#advanced-fields');
    assert(!!advancedFields, `[7c.AdvFields] Element #advanced-fields present`);

    if (advancedFields) {
        const isHidden = !advancedFields.classList.contains('active');
        assert(
            isHidden,
            `[7d.Hidden] Champs avances caches par defaut (classList: ${advancedFields.className})`
        );
    }

    // Cliquer sur "Avance" => champs avances visibles
    const advancedTab = doc.querySelector('.mode-tab[data-mode="advanced"]');
    if (advancedTab && advancedFields) {
        advancedTab.click();
        assert(
            advancedFields.classList.contains('active'),
            `[7e.Show] Champs avances visibles apres clic sur "Avance"`
        );
        assert(
            advancedTab.classList.contains('active'),
            `[7f.TabActive] Onglet "Avance" a la classe .active`
        );

        // Verifier que les champs avances contiennent les inputs attendus
        const niveau = advancedFields.querySelector('#niveau');
        const nbQuestions = advancedFields.querySelector('#nombreQuestions');
        assert(!!niveau, `[7g.Niveau] Input #niveau present dans les champs avances`);
        assert(!!nbQuestions, `[7h.NbQ] Input #nombreQuestions present dans les champs avances`);

        // Revenir au mode simple
        const simpleTab = doc.querySelector('.mode-tab[data-mode="simple"]');
        if (simpleTab) {
            simpleTab.click();
            assert(
                !advancedFields.classList.contains('active'),
                `[7i.Hide] Champs avances caches apres retour au mode simple`
            );
        }
    } else {
        assert(false, `[7e.Show] Onglet avance ou #advanced-fields introuvable`);
        assert(false, `[7f.TabActive] Onglet avance introuvable`);
        assert(false, `[7g.Niveau] Onglet avance introuvable`);
        assert(false, `[7h.NbQ] Onglet avance introuvable`);
        assert(false, `[7i.Hide] Onglet avance introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 8 : CHAMPS DE SAISIE ET ETAT TILES-DISABLED
// =======================================================================

async function runStep8_InputsAndTilesState(doc) {
    console.group('Etape 8 : Champs de saisie et tiles-disabled');
    _ctx = { step: 8, stepName: 'Inputs', file: '', module: '', source: '' };

    const quiInput = doc.querySelector('#qui');
    const quoiInput = doc.querySelector('#quoi');
    assert(!!quiInput, `[8a.Qui] Input #qui present`);
    assert(!!quoiInput, `[8b.Quoi] Input #quoi present`);

    // Verifier les placeholders (data-key pour i18n)
    if (quiInput) {
        assert(
            quiInput.hasAttribute('data-key'),
            `[8c.QuiKey] Input #qui a un attribut data-key ("${quiInput.getAttribute('data-key')}")`
        );
    }
    if (quoiInput) {
        assert(
            quoiInput.hasAttribute('data-key'),
            `[8d.QuoiKey] Input #quoi a un attribut data-key ("${quoiInput.getAttribute('data-key')}")`
        );
    }

    // Etat tiles-disabled : les deux champs vides => container.tiles-disabled
    const container = doc.querySelector('.container');
    if (container && quiInput && quoiInput) {
        // S'assurer que les champs sont vides
        quiInput.value = '';
        quoiInput.value = '';
        quiInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(200);

        assert(
            container.classList.contains('tiles-disabled'),
            `[8e.Disabled] Classe .tiles-disabled presente quand les champs sont vides`
        );

        // Remplir les deux champs => tiles-disabled disparait
        quiInput.value = 'Enseignant';
        quoiInput.value = 'La revolution francaise';
        quiInput.dispatchEvent(new Event('input', { bubbles: true }));
        quoiInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(200);

        assert(
            !container.classList.contains('tiles-disabled'),
            `[8f.Enabled] Classe .tiles-disabled absente quand les champs sont remplis`
        );

        // Nettoyer : remettre les champs vides
        quiInput.value = '';
        quoiInput.value = '';
        quiInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(100);
    } else {
        if (!container) assert(false, `[8e.Disabled] .container introuvable`);
        if (!quiInput) assert(false, `[8e.Disabled] #qui introuvable`);
        if (!quoiInput) assert(false, `[8e.Disabled] #quoi introuvable`);
        assert(false, `[8f.Enabled] Elements manquants`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 9 : CENTRE DE NOTIFICATIONS
// =======================================================================

async function runStep9_NotificationCenter(doc) {
    console.group('Etape 9 : Notifications');
    _ctx = { step: 9, stepName: 'Notifications', file: '', module: '', source: '' };

    const notifCenter = doc.querySelector('.notification-center');
    assert(!!notifCenter, `[9a.Center] .notification-center present`);

    const bellBtn = doc.querySelector('.notification-btn');
    assert(!!bellBtn, `[9b.Bell] Bouton .notification-btn (cloche) present`);

    const badge = doc.querySelector('.notification-badge');
    assert(!!badge, `[9c.Badge] Badge .notification-badge present`);

    const dropdown = doc.querySelector('.notification-dropdown');
    assert(!!dropdown, `[9d.Dropdown] .notification-dropdown present`);

    // Le dropdown est ferme par defaut
    if (notifCenter) {
        assert(
            !notifCenter.classList.contains('open'),
            `[9e.Closed] Dropdown ferme par defaut`
        );
    }

    // Cliquer sur la cloche ouvre le dropdown
    if (bellBtn && notifCenter) {
        bellBtn.click();
        await wait(300);

        assert(
            notifCenter.classList.contains('open'),
            `[9f.Open] Dropdown ouvert apres clic sur la cloche`
        );

        // Message "Aucune notification" visible quand la liste est vide
        const emptyMsg = doc.querySelector('.notification-empty');
        const notifList = doc.querySelector('.notification-list');
        const hasItems = notifList && notifList.children.length > 0;
        if (emptyMsg && !hasItems) {
            const emptyVisible = emptyMsg.style.display !== 'none';
            assert(
                emptyVisible,
                `[9g.Empty] Message "Aucune notification" visible`
            );
        } else {
            // Il y a des items, on skip ce test
            assert(true, `[9g.Empty] Liste de notifications non vide (skip verification message vide)`);
        }

        // Refermer en recliquant
        bellBtn.click();
        await wait(300);
        assert(
            !notifCenter.classList.contains('open'),
            `[9h.Close] Dropdown ferme apres second clic`
        );
    } else {
        assert(false, `[9f.Open] Bouton cloche ou centre introuvable`);
        assert(false, `[9g.Empty] Bouton cloche introuvable`);
        assert(false, `[9h.Close] Bouton cloche introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 10 : FOOTER ET MENTIONS LEGALES
// =======================================================================

async function runStep10_Footer(doc) {
    console.group('Etape 10 : Footer');
    _ctx = { step: 10, stepName: 'Footer', file: '', module: '', source: '' };

    const footer = doc.querySelector('footer, .footer');
    assert(!!footer, `[10a.Footer] Element footer present`);

    if (footer) {
        const links = footer.querySelectorAll('a');
        assert(
            links.length >= 5,
            `[10b.Links] ${links.length} lien(s) dans le footer (attendu >= 5)`
        );

        // Version dans le footer
        const footerText = footer.textContent;
        const hasVersion = /v\d+\.\d+\.\d+/.test(footerText);
        assert(
            hasVersion,
            `[10c.Version] Version trouvee dans le footer (pattern vX.Y.Z)`
        );

        // Lien mentions legales
        const legalLink = doc.querySelector('#legal-mentions-link');
        assert(!!legalLink, `[10d.Legal] Lien #legal-mentions-link present`);
    }

    // Modale mentions legales
    const legalModal = doc.querySelector('#legal-mentions-modal');
    assert(!!legalModal, `[10e.Modal] Modale #legal-mentions-modal presente`);

    if (legalModal) {
        // La modale est cachee par defaut
        const modalStyle = legalModal.ownerDocument.defaultView.getComputedStyle(legalModal);
        const isHidden = modalStyle.display === 'none' || legalModal.classList.contains('hidden') || modalStyle.opacity === '0';
        assert(
            isHidden,
            `[10f.ModalHidden] Modale mentions legales cachee par defaut`
        );

        // Cliquer sur le lien ouvre la modale
        const legalLink = doc.querySelector('#legal-mentions-link');
        if (legalLink) {
            legalLink.click();
            await wait(500);

            const afterStyle = legalModal.ownerDocument.defaultView.getComputedStyle(legalModal);
            const isVisible = afterStyle.display !== 'none' && afterStyle.opacity !== '0';
            assert(
                isVisible,
                `[10g.ModalOpen] Modale ouverte apres clic (display: ${afterStyle.display})`
            );

            // Fermer la modale
            const closeBtn = legalModal.querySelector('#close-legal-modal, .legal-close-modal-btn');
            if (closeBtn) {
                closeBtn.click();
                await wait(300);
                const closedStyle = legalModal.ownerDocument.defaultView.getComputedStyle(legalModal);
                const isClosed = closedStyle.display === 'none' || legalModal.classList.contains('hidden');
                assert(
                    isClosed,
                    `[10h.ModalClose] Modale fermee apres clic sur X`
                );
            } else {
                assert(false, `[10h.ModalClose] Bouton fermer introuvable dans la modale`);
            }
        } else {
            assert(false, `[10g.ModalOpen] Lien mentions legales introuvable`);
            assert(false, `[10h.ModalClose] Lien mentions legales introuvable`);
        }
    } else {
        assert(false, `[10f.ModalHidden] Modale introuvable`);
        assert(false, `[10g.ModalOpen] Modale introuvable`);
        assert(false, `[10h.ModalClose] Modale introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 11 : ZONE OCR / RAG
// =======================================================================

function runStep11_OcrRagZone(doc) {
    console.group('Etape 11 : Zone OCR/RAG');
    _ctx = { step: 11, stepName: 'OCR/RAG', file: '', module: '', source: '' };

    // Zone de texte editable
    const ocrOutput = doc.querySelector('#ocr-output');
    assert(!!ocrOutput, `[11a.Output] Zone #ocr-output presente`);

    if (ocrOutput) {
        assert(
            ocrOutput.getAttribute('contenteditable') === 'true',
            `[11b.Editable] #ocr-output est contenteditable`
        );
    }

    // Compteur de caracteres
    const charCounter = doc.querySelector('#char-counter');
    assert(!!charCounter, `[11c.Counter] Compteur #char-counter present`);

    // Boutons de la toolbar flottante
    const toolbar = doc.querySelector('.floating-toolbar');
    assert(!!toolbar, `[11d.Toolbar] .floating-toolbar presente`);

    const copyBtn = doc.querySelector('#ocr-copy-btn');
    const fullscreenBtn = doc.querySelector('#ocr-fullscreen-btn');
    const lockBtn = doc.querySelector('#ocr-lock-btn');
    assert(!!copyBtn, `[11e.Copy] Bouton copier (#ocr-copy-btn) present`);
    assert(!!fullscreenBtn, `[11f.Fullscreen] Bouton plein ecran (#ocr-fullscreen-btn) present`);
    assert(!!lockBtn, `[11g.Lock] Bouton verrouiller (#ocr-lock-btn) present`);

    // Zone de depot de fichier
    const dragDrop = doc.querySelector('.drag-drop-area');
    assert(!!dragDrop, `[11h.DragDrop] Zone de depot .drag-drop-area presente`);

    const fileInput = doc.querySelector('#pdfUpload');
    assert(!!fileInput, `[11i.FileInput] Input fichier #pdfUpload present`);

    if (fileInput) {
        const accept = fileInput.getAttribute('accept') || '';
        assert(
            accept.includes('pdf') || accept.includes('application/pdf'),
            `[11j.Accept] Input fichier accepte les PDF (accept: "${accept.substring(0, 60)}...")`
        );
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 12 : MODALES ET OVERLAY
// =======================================================================

function runStep12_ModalsOverlay(doc) {
    console.group('Etape 12 : Modales et overlay');
    _ctx = { step: 12, stepName: 'Modales', file: '', module: '', source: '' };

    // Modale de resultat de generation
    const resultModal = doc.querySelector('#generation-result-modal');
    assert(!!resultModal, `[12a.ResultModal] Modale #generation-result-modal presente`);

    if (resultModal) {
        // Cachee par defaut
        const isHidden = resultModal.classList.contains('hidden');
        assert(
            isHidden,
            `[12b.ResultHidden] Modale de resultat cachee par defaut`
        );

        // Boutons d'action dans la modale
        const downloadBtn = resultModal.querySelector('[data-action="download"]');
        const previewBtn = resultModal.querySelector('[data-action="preview"]');
        const continueBtn = resultModal.querySelector('[data-action="continue"]');
        assert(!!downloadBtn, `[12c.Download] Bouton "Telecharger" present`);
        assert(!!previewBtn, `[12d.Preview] Bouton "Visualiser et editer" present`);
        assert(!!continueBtn, `[12e.Continue] Lien "Continuer" present`);
    } else {
        assert(false, `[12b.ResultHidden] Modale introuvable`);
        assert(false, `[12c.Download] Modale introuvable`);
        assert(false, `[12d.Preview] Modale introuvable`);
        assert(false, `[12e.Continue] Modale introuvable`);
    }

    // Overlay d'animation Caramel
    const animOverlay = doc.querySelector('#caramel-animation-overlay');
    assert(!!animOverlay, `[12f.AnimOverlay] Overlay #caramel-animation-overlay present`);

    if (animOverlay) {
        // Cache par defaut
        const overlayStyle = animOverlay.ownerDocument.defaultView.getComputedStyle(animOverlay);
        const isHidden = overlayStyle.display === 'none';
        assert(
            isHidden,
            `[12g.AnimHidden] Overlay d'animation cache par defaut (display: ${overlayStyle.display})`
        );

        // Elements internes de la marmite
        const marmite = animOverlay.querySelector('.marmite');
        assert(!!marmite, `[12h.Marmite] Element .marmite present dans l'overlay`);
    } else {
        assert(false, `[12g.AnimHidden] Overlay introuvable`);
        assert(false, `[12h.Marmite] Overlay introuvable`);
    }

    // Accessibilite : role="dialog" et aria-modal sur les modales
    const dialogs = doc.querySelectorAll('[role="dialog"]');
    assert(
        dialogs.length >= 2,
        `[12i.Aria] ${dialogs.length} element(s) avec role="dialog" (attendu >= 2 : mentions legales, resultat)`
    );

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Tuiles',
    'Contenu tuiles',
    'Filtres type',
    'Filtres plateforme',
    'Langue',
    'Sidebar',
    'Mode tabs',
    'Inputs',
    'Notifications',
    'Footer',
    'OCR/RAG',
    'Modales'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que generateTiles() produit le bon nombre de tuiles (modules visibles), sans doublons et avec data-module renseigne.',
    'Verifie que chaque tuile a un titre non vide, une image qui se charge, et un label de type (H5P/Elea).',
    'Verifie les filtres par type d\'activite : tout/quiz/text/memory. Teste le clic, l\'activation et la reinitialisation.',
    'Verifie les filtres par plateforme (H5P, Elea, Moodle), le toggle on/off, et les filtres combines type + plateforme.',
    'Verifie que le selecteur de langue ouvre le dropdown, change document.documentElement.lang, et ferme le dropdown apres selection.',
    'Verifie que le clic sur une tuile ouvre la sidebar (#module-sidebar), affiche l\'overlay, active la tuile, et que le bouton fermer fonctionne.',
    'Verifie les onglets Mode Rapide / Mode Avance, la visibilite des champs avances (#advanced-fields), et la presence des inputs #niveau et #nombreQuestions.',
    'Verifie les champs de saisie #qui et #quoi, et le mecanisme tiles-disabled : tuiles grisees quand les champs sont vides, reactives quand ils sont remplis.',
    'Verifie le centre de notifications : bouton cloche, badge, dropdown. Teste l\'ouverture/fermeture du dropdown et le message "Aucune notification".',
    'Verifie le footer : liens (>= 5), version (vX.Y.Z), lien mentions legales, ouverture/fermeture de la modale mentions legales.',
    'Verifie la zone OCR/RAG : #ocr-output (contenteditable), compteur de caracteres, toolbar (copier, plein ecran, verrouiller), zone de depot fichier.',
    'Verifie la presence et l\'etat initial des modales (resultat de generation, overlay d\'animation Caramel) et l\'accessibilite (role="dialog").'
];

/**
 * Lance tous les tests UI sur le document de l'iframe.
 * @param {Document} iframeDoc - Le document de l'iframe contenant index.html
 */
export async function runAllTests(iframeDoc) {
    console.log('=== Tests UI Caramel (12 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    runStep1_TilesGenerated(iframeDoc);
    runStep2_TileContent(iframeDoc);
    runStep3_ActivityFilters(iframeDoc);
    runStep4_PlatformFilters(iframeDoc);
    await runStep5_LanguageSwitcher(iframeDoc);
    await runStep6_SidebarOpen(iframeDoc);
    runStep7_ModeTabs(iframeDoc);
    await runStep8_InputsAndTilesState(iframeDoc);
    await runStep9_NotificationCenter(iframeDoc);
    await runStep10_Footer(iframeDoc);
    runStep11_OcrRagZone(iframeDoc);
    runStep12_ModalsOverlay(iframeDoc);

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests UI', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
