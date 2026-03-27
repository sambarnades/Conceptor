/**
 * Tests d'integration du pipeline de generation H5P de Caramel
 *
 * Simule un parcours utilisateur complet sur les 19 activites H5P visibles :
 * charger toutes les fixtures JSON → pour chaque activite : ouvrir la sidebar,
 * injecter le JSON, lancer la generation, fermer la modale de resultat →
 * verifier les notifications → valider les blobs H5P → tester les processeurs.
 *
 * Utilise les fichiers d'exemple existants comme fixtures (pas d'appel LLM).
 *
 * Usage : ouvrir tests/test-integration.html depuis le serveur local.
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

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attend un CustomEvent sur un document cible, avec timeout.
 * @param {Document} doc - Le document sur lequel ecouter
 * @param {string} eventName - Nom de l'evenement
 * @param {number} timeoutMs - Timeout en ms
 * @returns {Promise<CustomEvent|null>} L'evenement recu ou null si timeout
 */
function waitForEvent(doc, eventName, timeoutMs = 15000) {
    return new Promise(resolve => {
        let resolved = false;
        const handler = (e) => {
            if (!resolved) {
                resolved = true;
                doc.removeEventListener(eventName, handler);
                resolve(e);
            }
        };
        doc.addEventListener(eventName, handler);
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                doc.removeEventListener(eventName, handler);
                resolve(null);
            }
        }, timeoutMs);
    });
}

// Reference partagee pour stocker les resultats entre etapes
const shared = {
    fixtures: {},   // moduleKey → JSON fixture charge
    blobs: {},      // moduleKey → Blob H5P genere
    generated: 0    // nombre de generations reussies
};

/**
 * Table de correspondance moduleKey → fixture + IDs DOM.
 * Couvre les 19 modules H5P visibles (ComplexFillTheBlanks est hidden et sans fixture).
 */
const ALL_H5P_FIXTURES = [
    { moduleKey: 'Timeline',        fixture: 'timeline_1.json',           machineName: 'H5P.Timeline',        jsonInputId: 'timelineJsonInput',        createBtnId: 'createTimelineH5P' },
    { moduleKey: 'Flashcards',      fixture: 'flashcards_1.json',         machineName: 'H5P.Flashcards',      jsonInputId: 'flashcardsJsonInput',      createBtnId: 'createFlashcardsH5P' },
    { moduleKey: 'QuizSet',         fixture: 'quiz_mixte_1.json',         machineName: 'H5P.QuestionSet',     jsonInputId: 'quizSetJsonInput',         createBtnId: 'createQuizSetH5P' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_1.json',          machineName: 'H5P.QuestionSet',     jsonInputId: 'quizSetQcmJsonInput',      createBtnId: 'createQuizSetQcmH5P' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_5.json',          machineName: 'H5P.QuestionSet',     jsonInputId: 'quizSetQcmJsonInput',      createBtnId: 'createQuizSetQcmH5P' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_formules_test.json', machineName: 'H5P.QuestionSet',  jsonInputId: 'quizSetQcmJsonInput',      createBtnId: 'createQuizSetQcmH5P' },
    { moduleKey: 'QuizSetVF',       fixture: 'quiz_vraifaux_1.json',      machineName: 'H5P.QuestionSet',     jsonInputId: 'quizSetVfJsonInput',       createBtnId: 'createQuizSetVfH5P' },
    { moduleKey: 'Glossary',        fixture: 'accordion_1.json',          machineName: 'H5P.Accordion',       jsonInputId: 'glossaryJsonInput',        createBtnId: 'createGlossaryH5P' },
    { moduleKey: 'Crossword',       fixture: 'crosswords_1.json',         machineName: 'H5P.Crossword',       jsonInputId: 'crosswordJsonInput',       createBtnId: 'createCrosswordH5P' },
    { moduleKey: 'Essay',           fixture: 'essay_1.json',              machineName: 'H5P.Essay',           jsonInputId: 'essayJsonInput',           createBtnId: 'createEssayH5P' },
    { moduleKey: 'Summary',         fixture: 'summary_1.json',            machineName: 'H5P.Summary',         jsonInputId: 'summaryJsonInput',         createBtnId: 'createSummaryH5P' },
    { moduleKey: 'DragTheWords',    fixture: 'drag_the_words_1.json',     machineName: 'H5P.DragText',        jsonInputId: 'dragWordJsonInput',        createBtnId: 'createDragWordH5P' },
    { moduleKey: 'DragAndDrop',     fixture: 'drag_and_drop_1.json',      machineName: 'H5P.DragQuestion',    jsonInputId: 'dragAndDropJsonInput',     createBtnId: 'createDragAndDropH5P' },
    { moduleKey: 'FillInTheBlanks', fixture: 'fill_in_the_blanks_1.json', machineName: 'H5P.Blanks',          jsonInputId: 'blanksJsonInput',          createBtnId: 'createBlanksH5P' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_1.json',     machineName: 'H5P.MarkTheWords',    jsonInputId: 'markWordsJsonInput',       createBtnId: 'createMarkWordsH5P' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_3.json',     machineName: 'H5P.MarkTheWords',    jsonInputId: 'markWordsJsonInput',       createBtnId: 'createMarkWordsH5P' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_4.json',     machineName: 'H5P.MarkTheWords',    jsonInputId: 'markWordsJsonInput',       createBtnId: 'createMarkWordsH5P' },
    { moduleKey: 'TrueFalse',       fixture: 'true_false_1.json',         machineName: 'H5P.TrueFalse',       jsonInputId: 'trueFalseJsonInput',       createBtnId: 'createTrueFalseH5P' },
    { moduleKey: 'MultipleChoice',  fixture: 'multiple_choice_1.json',    machineName: 'H5P.MultiChoice',     jsonInputId: 'multipleChoiceJsonInput',  createBtnId: 'createMultipleChoiceH5P' },
    { moduleKey: 'FindTheWords',    fixture: 'find_the_words_1.json',     machineName: 'H5P.FindTheWords',    jsonInputId: 'findTheWordsJsonInput',    createBtnId: 'createFindTheWordsH5P' },
    { moduleKey: 'SortParagraphs',  fixture: 'sort_the_paragraphs_1.json', machineName: 'H5P.SortParagraphs', jsonInputId: 'sortParagraphsJsonInput',  createBtnId: 'createSortParagraphsH5P' },
    { moduleKey: 'SingleChoiceSet', fixture: 'single_choice_set_1.json',  machineName: 'H5P.SingleChoiceSet', jsonInputId: 'singleChoiceSetJsonInput', createBtnId: 'createSingleChoiceSetH5P' },
    { moduleKey: 'DialogCards',     fixture: 'dialog_cards_1.json',       machineName: 'H5P.Dialogcards',     jsonInputId: 'dialogCardsJsonInput',     createBtnId: 'createDialogCardsH5P' },
    { moduleKey: 'Chart',           fixture: 'charts_1.json',             machineName: 'H5P.Chart',           jsonInputId: 'chartJsonInput',           createBtnId: 'createChartH5P' },
    { moduleKey: 'CoursePresentation', fixture: 'course_presentation_1.json', machineName: 'H5P.CoursePresentation', jsonInputId: 'coursePresentationJsonInput', createBtnId: 'createCoursePresentationH5P' }
];

// =======================================================================
// ETAPE 1 : CHARGEMENT DES FIXTURES (TOUTES LES ACTIVITES)
// =======================================================================

async function runStep1_LoadFixtures() {
    console.group('Etape 1 : Chargement des fixtures');
    _ctx = { step: 1, stepName: 'Fixtures', file: '', module: '', source: '' };
    const t0 = performance.now();

    let loaded = 0;
    let failed = 0;
    for (const entry of ALL_H5P_FIXTURES) {
        const path = `assets/data/examples/${entry.fixture}`;
        try {
            const resp = await fetch('../' + path);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            shared.fixtures[entry.moduleKey] = json;
            loaded++;
        } catch (e) {
            failed++;
            assert(false, `[1.${entry.moduleKey}] Erreur chargement ${entry.fixture}`, { erreur: e.message });
        }
    }

    assert(
        loaded === ALL_H5P_FIXTURES.length,
        `[1a.Load] ${loaded}/${ALL_H5P_FIXTURES.length} fixtures chargees`,
        failed > 0 ? { echecs: failed } : null
    );

    // Verification rapide : chaque fixture est un objet non vide
    let emptyFixtures = 0;
    for (const entry of ALL_H5P_FIXTURES) {
        const json = shared.fixtures[entry.moduleKey];
        if (!json || typeof json !== 'object' || Object.keys(json).length === 0) {
            emptyFixtures++;
        }
    }
    assert(
        emptyFixtures === 0,
        `[1b.Valid] ${ALL_H5P_FIXTURES.length - emptyFixtures}/${ALL_H5P_FIXTURES.length} fixtures valides (objets non vides)`,
        emptyFixtures > 0 ? { vides: emptyFixtures } : null
    );

    recordTiming('Fixtures', `Chargement de ${ALL_H5P_FIXTURES.length} fichiers JSON`, performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : PIPELINE UI — TOUTES LES ACTIVITES (VISUEL)
// =======================================================================

/**
 * Pour chaque activite : clic sur la tuile → injection du JSON fixture →
 * clic sur le bouton de generation → attente de generation:complete →
 * recuperation du blob → fermeture de la modale.
 * L'utilisateur voit chaque activite defiler dans l'iframe.
 */
async function runStep2_UIPipelineAll(doc) {
    console.group('Etape 2 : Pipeline UI — toutes les activites');
    _ctx = { step: 2, stepName: 'Pipeline UI', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Remplir les champs #qui et #quoi une seule fois pour desactiver tiles-disabled
    const quiInput = doc.querySelector('#qui');
    const quoiInput = doc.querySelector('#quoi');
    if (quiInput && quoiInput) {
        quiInput.value = 'Enseignant';
        quoiInput.value = 'Test integration automatise';
        quiInput.dispatchEvent(new Event('input', { bubbles: true }));
        quoiInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(300);
    }
    assert(!!quiInput && !!quoiInput, `[2.init] Champs #qui et #quoi remplis`);

    let generated = 0;
    const failedModules = [];

    for (let i = 0; i < ALL_H5P_FIXTURES.length; i++) {
        const entry = ALL_H5P_FIXTURES[i];
        const { moduleKey, jsonInputId, createBtnId } = entry;
        const fixture = shared.fixtures[moduleKey];

        if (!fixture) {
            assert(false, `[2.${moduleKey}] Fixture non chargee — skip`);
            failedModules.push(moduleKey);
            continue;
        }

        const tMod = performance.now();
        console.log(`  [${i + 1}/${ALL_H5P_FIXTURES.length}] ${moduleKey}...`);

        try {
            // 1. Cliquer sur la tuile (si deja active, cliquer ailleurs d'abord pour eviter le toggle)
            const tile = doc.querySelector(`.h5p-tile[data-module="${moduleKey}"]`);
            if (!tile) {
                assert(false, `[2.${moduleKey}] Tuile introuvable dans le DOM`);
                failedModules.push(moduleKey);
                continue;
            }
            if (tile.classList.contains('active')) {
                // La tuile est deja active : un clic la fermerait (toggle).
                // On clique sur une autre tuile pour la desactiver, puis on re-clique.
                const otherTile = doc.querySelector(`.h5p-tile:not([data-module="${moduleKey}"])`);
                if (otherTile) {
                    otherTile.click();
                    await wait(300);
                }
            }
            tile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            tile.click();
            await wait(500); // Attendre l'ouverture/mise a jour de la sidebar

            // 2. Trouver et remplir le textarea
            const textarea = doc.querySelector(`#${jsonInputId}`);
            if (!textarea) {
                assert(false, `[2.${moduleKey}] Textarea #${jsonInputId} introuvable dans la sidebar`);
                failedModules.push(moduleKey);
                continue;
            }
            textarea.value = JSON.stringify(fixture, null, 2);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            // 3. Preparer l'ecoute de generation:complete AVANT le clic
            const timeoutMs = moduleKey === 'CoursePresentation' ? 40000 : 20000;
            const eventPromise = waitForEvent(doc, 'generation:complete', timeoutMs);

            // 4. Cliquer sur le bouton de creation
            const createBtn = doc.querySelector(`#${createBtnId}`);
            if (!createBtn) {
                assert(false, `[2.${moduleKey}] Bouton #${createBtnId} introuvable`);
                failedModules.push(moduleKey);
                continue;
            }
            createBtn.click();

            // 5. Attendre l'evenement
            const event = await eventPromise;

            if (!event) {
                assert(false, `[2.${moduleKey}] Timeout generation:complete (${timeoutMs / 1000}s)`);
                failedModules.push(moduleKey);
                // Tenter de fermer une eventuelle modale bloquante
                await _tryCloseModal(doc);
                continue;
            }

            // 6. Verifier et stocker le blob
            const blob = event.detail?.blob;
            const isBlob = blob && typeof blob.size === 'number' && blob.size > 0;
            if (isBlob) {
                shared.blobs[moduleKey] = blob;
                generated++;
            } else {
                failedModules.push(moduleKey);
            }

            const duration = Math.round(performance.now() - tMod);
            assert(isBlob, `[2.${moduleKey}] Genere — blob ${blob?.size || 0} octets (${duration}ms)`);
            recordTiming(moduleKey, 'Generation UI', duration);

            // 7. Fermer la modale de resultat avant de passer au module suivant
            await _tryCloseModal(doc);

        } catch (e) {
            assert(false, `[2.${moduleKey}] Exception : ${e.message}`, { stack: e.stack?.substring(0, 300) });
            failedModules.push(moduleKey);
            await _tryCloseModal(doc);
        }
    }

    shared.generated = generated;

    // Bilan global
    assert(
        generated === ALL_H5P_FIXTURES.length,
        `[2.Bilan] ${generated}/${ALL_H5P_FIXTURES.length} activites generees via UI`,
        failedModules.length > 0 ? { echecs: failedModules.join(', ') } : null
    );

    recordTiming('Pipeline UI', `Toutes les activites (${ALL_H5P_FIXTURES.length})`, performance.now() - t0);
    console.groupEnd();
}

/**
 * Tente de fermer la modale de resultat si elle est visible.
 */
async function _tryCloseModal(doc) {
    const modal = doc.querySelector('#generation-result-modal');
    if (modal && !modal.classList.contains('hidden')) {
        const closeBtn = modal.querySelector('[data-action="continue"], .generation-result-modal__close');
        if (closeBtn) {
            closeBtn.click();
            await wait(400);
        }
    }
}

// =======================================================================
// ETAPE 3 : VERIFICATION DES NOTIFICATIONS
// =======================================================================

async function runStep3_Notifications(doc) {
    console.group('Etape 3 : Notifications');
    _ctx = { step: 3, stepName: 'Notifications', file: '', module: '', source: '' };

    await wait(500);

    // Les notifications sont par module unique (pas par fixture) :
    // QuizSetQCM x2 et MarkTheWords x3 ne generent qu'une notification chacun.
    // Le systeme de notifications a un plafond FIFO de 20 (MAX_NOTIFICATIONS).
    const uniqueModules = new Set(ALL_H5P_FIXTURES.map(e => e.moduleKey));
    const MAX_NOTIFICATIONS = 20;
    const expected = Math.min(shared.generated, uniqueModules.size, MAX_NOTIFICATIONS);
    const notifList = doc.querySelector('.notification-list');
    assert(!!notifList, `[3a.List] .notification-list presente`);

    if (notifList) {
        const items = notifList.querySelectorAll('.notification-item');
        assert(
            items.length >= expected,
            `[3b.Count] ${items.length} notification(s) (attendu >= ${expected})`,
            items.length < expected ? { manquantes: expected - items.length } : null
        );

        // Verifier que chaque notification a un titre non vide
        let emptyTitles = 0;
        for (const item of items) {
            const title = item.querySelector('.notification-title, .notification-item__title');
            if (!title || title.textContent.trim().length === 0) emptyTitles++;
        }
        assert(
            emptyTitles === 0,
            `[3c.Titles] ${items.length - emptyTitles}/${items.length} notifications ont un titre`,
            emptyTitles > 0 ? { vides: emptyTitles } : null
        );

        // Verifier le badge
        const badge = doc.querySelector('.notification-badge');
        if (badge) {
            const count = parseInt(badge.getAttribute('data-count') || badge.textContent, 10);
            assert(
                count >= expected,
                `[3d.Badge] Badge de notification : ${count} (attendu >= ${expected})`
            );
        } else {
            assert(false, `[3d.Badge] Badge .notification-badge introuvable`);
        }
    } else {
        assert(false, `[3b.Count] .notification-list introuvable`);
        assert(false, `[3c.Titles] .notification-list introuvable`);
        assert(false, `[3d.Badge] .notification-list introuvable`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : VALIDATION DES BLOBS H5P AVEC JSZIP
// =======================================================================

async function runStep4_ValidateBlobs(iframeWindow) {
    console.group('Etape 4 : Validation des blobs H5P');
    _ctx = { step: 4, stepName: 'Blobs H5P', file: '', module: '', source: '' };
    const t0 = performance.now();

    const blobEntries = Object.entries(shared.blobs);
    if (blobEntries.length === 0) {
        assert(false, `[4.Init] Aucun blob disponible (aucune generation reussie ?)`);
        console.groupEnd();
        return;
    }

    // Attendre que JSZip soit disponible (charge via initSmartPreloading)
    let JSZip = iframeWindow.JSZip;
    if (!JSZip) {
        await wait(2000);
        JSZip = iframeWindow.JSZip;
    }
    if (!JSZip) {
        assert(false, `[4.JSZip] JSZip non disponible dans l'iframe`);
        console.groupEnd();
        return;
    }

    let validBlobs = 0;
    const failedBlobs = [];

    for (const [moduleKey, blob] of blobEntries) {
        try {
            const zip = await JSZip.loadAsync(blob);
            const contentFile = zip.file('content/content.json');
            const h5pFile = zip.file('h5p.json');

            if (!contentFile || !h5pFile) {
                assert(false, `[4.${moduleKey}] Fichiers manquants (content.json: ${!!contentFile}, h5p.json: ${!!h5pFile})`);
                failedBlobs.push(moduleKey);
                continue;
            }

            // Verifier content.json
            const contentStr = await contentFile.async('string');
            const contentData = JSON.parse(contentStr);
            const contentOk = contentData && typeof contentData === 'object' && Object.keys(contentData).length > 0;

            // Verifier h5p.json
            const h5pStr = await h5pFile.async('string');
            const h5pData = JSON.parse(h5pStr);
            const h5pOk = h5pData && h5pData.mainLibrary && Array.isArray(h5pData.preloadedDependencies);

            if (contentOk && h5pOk) {
                assert(true, `[4.${moduleKey}] ZIP valide — ${Object.keys(zip.files).length} fichiers, mainLibrary: ${h5pData.mainLibrary}`);
                validBlobs++;
            } else {
                assert(false, `[4.${moduleKey}] Contenu invalide (content: ${contentOk}, h5p: ${h5pOk})`);
                failedBlobs.push(moduleKey);
            }
        } catch (e) {
            assert(false, `[4.${moduleKey}] Erreur lecture ZIP : ${e.message}`);
            failedBlobs.push(moduleKey);
        }
    }

    // Bilan global
    assert(
        validBlobs === blobEntries.length,
        `[4.Bilan] ${validBlobs}/${blobEntries.length} blobs H5P valides`,
        failedBlobs.length > 0 ? { echecs: failedBlobs.join(', ') } : null
    );

    recordTiming('Validation', `JSZip sur ${blobEntries.length} blobs`, performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : PIPELINE PROCESSEUR DIRECT — TOUTES LES ACTIVITES
// =======================================================================

/**
 * Teste les processeurs directement (sans UI) via import ES6 :
 * processH5PContent + createH5PBlob pour chaque activite.
 * Sert de verification independante du pipeline de transformation.
 */
async function runStep5_AllProcessors() {
    console.group('Etape 5 : Pipeline direct — toutes les activites');
    _ctx = { step: 5, stepName: 'Processeurs', file: '', module: '', source: '' };
    const t0 = performance.now();

    let processH5PContent, getModuleMetadata, createH5PBlob;
    try {
        const procModule = await import('../js/h5p/processors/index.js');
        processH5PContent = procModule.processH5PContent;
        getModuleMetadata = procModule.getModuleMetadata;
        const creatorModule = await import('../js/h5p/h5p-creator.js');
        createH5PBlob = creatorModule.createH5PBlob;
    } catch (e) {
        assert(false, `[5.Import] Erreur import modules`, { erreur: e.message });
        console.groupEnd();
        return;
    }

    let passedProcessors = 0;
    const failedProcessors = [];

    for (const entry of ALL_H5P_FIXTURES) {
        const { moduleKey } = entry;
        const fixture = shared.fixtures[moduleKey];
        if (!fixture) {
            assert(false, `[5.${moduleKey}] Fixture non chargee — skip`);
            failedProcessors.push(moduleKey);
            continue;
        }

        const tProc = performance.now();
        try {
            // 1. Processeur
            const input = structuredClone(fixture);
            const processed = await processH5PContent(moduleKey, input);
            const content = processed?.content ?? processed;

            if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
                assert(false, `[5.${moduleKey}] Processeur retourne un contenu vide`, { type: typeof content });
                failedProcessors.push(moduleKey);
                continue;
            }

            // 2. Metadonnees
            const meta = getModuleMetadata(moduleKey);
            if (!meta) {
                assert(false, `[5.${moduleKey}] getModuleMetadata retourne null`);
                failedProcessors.push(moduleKey);
                continue;
            }

            // 3. Packaging
            const blob = await createH5PBlob(content, meta.machineName, meta.extraDependencies, {
                title: `Test ${moduleKey}`, lang: 'fr'
            });
            const isBlob = blob && typeof blob.size === 'number' && blob.size > 0;

            if (!isBlob) {
                assert(false, `[5.${moduleKey}] Blob vide ou invalide (size: ${blob?.size})`);
                failedProcessors.push(moduleKey);
                continue;
            }

            // Succes complet pour ce processeur
            const duration = Math.round(performance.now() - tProc);
            assert(true, `[5.${moduleKey}] OK — processeur + blob ${blob.size} octets (${duration}ms)`);
            passedProcessors++;
            recordTiming(moduleKey, `process + createH5PBlob (direct)`, duration);
        } catch (e) {
            assert(false, `[5.${moduleKey}] Exception : ${e.message}`, { stack: e.stack?.substring(0, 300) });
            failedProcessors.push(moduleKey);
        }
    }

    // Bilan global
    assert(
        passedProcessors === ALL_H5P_FIXTURES.length,
        `[5.Bilan] ${passedProcessors}/${ALL_H5P_FIXTURES.length} processeurs OK`,
        failedProcessors.length > 0 ? { echecs: failedProcessors.join(', ') } : null
    );

    recordTiming('Pipeline', `Tous les processeurs (${ALL_H5P_FIXTURES.length})`, performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Fixtures',
    'Pipeline UI',
    'Notifications',
    'Blobs H5P',
    'Processeurs'
];

export const STEP_DESCRIPTIONS = [
    '',
    `Charge les ${ALL_H5P_FIXTURES.length} fichiers JSON d'exemple et verifie qu'ils sont valides.`,
    `Pour chaque activite (${ALL_H5P_FIXTURES.length}) : ouvre la sidebar, injecte le JSON, lance la generation, verifie le blob, ferme la modale.`,
    `Verifie que les notifications ont ete creees avec titres non vides et badge incremente.`,
    `Lit chaque blob H5P avec JSZip : verifie content/content.json, h5p.json et mainLibrary.`,
    `Teste les ${ALL_H5P_FIXTURES.length} processeurs directement : processH5PContent + createH5PBlob sans UI.`
];

/**
 * Lance tous les tests d'integration sur le document et la window de l'iframe.
 * @param {Document} iframeDoc - Le document de l'iframe
 * @param {Window} iframeWindow - La window de l'iframe (pour acceder a JSZip)
 */
export async function runAllTests(iframeDoc, iframeWindow) {
    console.log(`=== Tests Integration Caramel (5 etapes, ${ALL_H5P_FIXTURES.length} activites) ===`);
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_LoadFixtures();
    await runStep2_UIPipelineAll(iframeDoc);
    await runStep3_Notifications(iframeDoc);
    await runStep4_ValidateBlobs(iframeWindow);
    await runStep5_AllProcessors();

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests integration', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
