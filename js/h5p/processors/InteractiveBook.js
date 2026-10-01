/**
 * Processeur H5P — Livre interactif (InteractiveBook)
 *
 * Transforme le JSON simplifié de l'IA (chapitres riches) en JSON H5P complet.
 * Chaque chapitre devient un H5P.Column : une pile verticale de blocs
 * (texte, tableau, image, exercice) — sans aucune coordonnée x/y.
 * Délègue le traitement des exercices aux processeurs existants via helpers.processChild().
 *
 * Structure cible (vérifiée dans H5P.InteractiveBook-1.11/dist) :
 * chaque élément de chapters[] EST directement l'objet Column
 * ({ library, params, metadata, subContentId }) — pas de wrapping `chapter`.
 * Le player lit chapters[i].metadata.title (TOC) et chapters[i].params.content.
 * Les libellés l10n sont des champs PLATS de premier niveau (pas d'objet l10n imbriqué).
 *
 * Pattern identique à CoursePresentation : processeur async retournant { content, dependencies }.
 *
 * @module processors/InteractiveBook
 * @exports {Object} default.process - Transformation principale (async, reçoit helpers)
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID, debugLog } from '../../core/utils.js';
import { buildTableParams, healSlidesLatex, titreExercice } from './CoursePresentation.js';

// === Constantes configurables ===
const DEFAULTS = {
    baseColor: '#1768c4',
    defaultTableOfContents: true,
    progressIndicators: true,
    progressAuto: true,
    displaySummary: true,
    enableRetry: true,
};

// === Mapping type simplifié IA → library H5P complète (identique à CoursePresentation) ===
const LIBRARY_MAP = {
    'multichoice':      'H5P.MultiChoice 1.16',
    'truefalse':        'H5P.TrueFalse 1.8',
    'blanks':           'H5P.Blanks 1.14',
    'dragtext':         'H5P.DragText 1.10',
    'singlechoiceset':  'H5P.SingleChoiceSet 1.11',
    'markthewords':     'H5P.MarkTheWords 1.11',
    'summary':          'H5P.Summary 1.10',
    'dragquestion':     'H5P.DragQuestion 1.15',
    'dialogcards':      'H5P.Dialogcards 1.9',
    'advancedtext':     'H5P.AdvancedText 1.1',
    'table':            'H5P.Table 1.2',
    'image':            'H5P.Image 1.1',
};

// === Types d'exercices qui passent par un processeur enfant ===
const EXERCISE_TYPES = new Set([
    'multichoice', 'truefalse', 'blanks', 'dragtext',
    'singlechoiceset', 'markthewords', 'summary',
    'dragquestion', 'dialogcards'
]);

/**
 * Résout une library d'exercice vers sa clé simplifiée du LIBRARY_MAP.
 * Accepte : clé simplifiée ('multichoice'), library complète ('H5P.MultiChoice 1.16')
 * ou library sans version ('H5P.MultiChoice').
 * @param {string} rawLib - La library brute de l'IA
 * @returns {string} La clé simplifiée (ou la valeur brute en minuscules si inconnue)
 */
function resolveLibraryKey(rawLib) {
    const lib = (rawLib || '').trim();
    if (!lib.includes('.')) return lib.toLowerCase();
    // Library complète : matcher sur le nom de base (avec ou sans version)
    const baseName = lib.split(' ')[0].toLowerCase();
    return Object.keys(LIBRARY_MAP).find(
        k => LIBRARY_MAP[k].split(' ')[0].toLowerCase() === baseName
    ) || lib.toLowerCase();
}

/**
 * Enveloppe un sous-contenu H5P en item de Column.
 * Le player filtre les items sans clé `.content` — ne jamais omettre.
 * @param {Object} action - Le sous-contenu { library, subContentId, metadata, params }
 * @returns {Object} L'item Column { content, useSeparator }
 */
function buildColumnItem(action) {
    return { content: action, useSeparator: 'auto' };
}

/**
 * Construit un bloc texte (H5P.AdvancedText).
 * @param {string} text - Texte Markdown de l'IA
 * @returns {Object} Le sous-contenu H5P
 */
function buildTextBlock(text) {
    return {
        library: 'H5P.AdvancedText 1.1',
        subContentId: generateUUID(),
        metadata: { contentType: 'Text', license: 'U', title: 'Texte' },
        params: { text: formatTextToHtml(text) }
    };
}

/**
 * Construit un bloc tableau (H5P.Table) — réutilise les 6 styles de CoursePresentation.
 * @param {Object} table - { headers: [], rows: [[]] }
 * @param {string} style - Style du tableau (default, striped, bordered, dark-header, minimal, dsfr)
 * @returns {Object} Le sous-contenu H5P
 */
function buildTableBlock(table, style) {
    return {
        library: 'H5P.Table 1.2',
        subContentId: generateUUID(),
        metadata: { contentType: 'Table', license: 'U', title: 'Tableau' },
        params: buildTableParams({ ...table, _style: style })
    };
}

/**
 * Construit un bloc image (H5P.Image) — sans coordonnées (le Column gère le flux).
 * @param {Object} image - { path, mime, width, height }
 * @param {string} alt - Texte alternatif
 * @returns {Object} Le sous-contenu H5P
 */
function buildImageBlock(image, alt) {
    return {
        library: 'H5P.Image 1.1',
        subContentId: generateUUID(),
        metadata: { contentType: 'Image', license: 'U', title: 'Image' },
        params: {
            file: {
                path: image.path,
                mime: image.mime || 'image/jpeg',
                width: image.width || 0,
                height: image.height || 0,
                ...(image.copyright ? { copyright: image.copyright } : {})
            },
            alt: alt || '',
            decorative: !alt
        }
    };
}

/**
 * Construit un bloc exercice, en déléguant au processeur enfant.
 * @param {Object} exercise - Le bloc exercice simplifié ({ library, ...params })
 * @param {Object} helpers - Les helpers du routeur (processChild, etc.)
 * @returns {Promise<{action: Object, libName: string}>} Le sous-contenu H5P + nom de la lib
 */
async function buildExerciseBlock(exercise, helpers) {
    const libraryKey = resolveLibraryKey(exercise.library);
    const fullLibrary = LIBRARY_MAP[libraryKey];

    if (!fullLibrary) {
        debugLog('InteractiveBook', `Type d'exercice inconnu : ${libraryKey}, fallback AdvancedText`);
        return {
            action: buildTextBlock(`*Exercice non reconnu (${libraryKey})*`),
            libName: 'H5P.AdvancedText'
        };
    }

    const libName = fullLibrary.split(' ')[0];
    // On retire les clés techniques du bloc ; toute normalisation pédagogique
    // est déléguée au processeur enfant standalone (mêmes formats que CP/QuizSet).
    const { library, type, ...params } = exercise;

    const subContent = {
        subContentId: generateUUID(),
        library: fullLibrary,
        metadata: {
            title: titreExercice(exercise.title || exercise.question, 'Exercice'),
            contentType: 'Exercise',
            license: 'U'
        },
        params: params
    };

    if (helpers && helpers.processChild && EXERCISE_TYPES.has(libraryKey)) {
        try {
            const processed = await helpers.processChild(subContent);
            return { action: processed, libName };
        } catch (e) {
            debugLog('InteractiveBook', `Erreur processChild pour ${libraryKey}:`, e);
            // On garde le subContent non transformé
        }
    }
    return { action: subContent, libName };
}

/**
 * Traite un chapitre simplifié et produit l'objet H5P.Column correspondant.
 * @param {Object} chapter - Le chapitre simplifié { title, content: [blocs] }
 * @param {Object} helpers - Les helpers du routeur
 * @param {Set} allLibs - Accumulateur des librairies utilisées
 * @returns {Promise<Object>} L'objet Column complet
 */
async function processChapter(chapter, helpers, allLibs, inRow = false) {
    const items = [];

    for (const block of (chapter.content || [])) {
        if (!block || typeof block !== 'object') continue;
        // Un type rendu en liste par le modèle (« ["text"] ») garde sa première valeur.
        const type = String((Array.isArray(block.type) ? block.type[0] : block.type) || 'text').toLowerCase();

        if (type === 'text' && block.text) {
            items.push(buildColumnItem(buildTextBlock(block.text)));
            allLibs.add('H5P.AdvancedText');
        } else if (type === 'table' && block.table) {
            items.push(buildColumnItem(buildTableBlock(block.table, block.tableStyle)));
            allLibs.add('H5P.Table');
        } else if (type === 'image' && block.image && block.image.path) {
            items.push(buildColumnItem(buildImageBlock(block.image, block.alt)));
            allLibs.add('H5P.Image');
        } else if (type === 'row') {
            if (inRow) throw new Error('InteractiveBook : les colonnes ne peuvent pas contenir une autre rangée.');
            if (!Array.isArray(block.columns) || !block.columns.length || block.columns.length > 4) {
                throw new Error('InteractiveBook : une rangée exige entre une et quatre colonnes.');
            }
            const columns = [];
            for (const column of block.columns) {
                const action = await processChapter(column, helpers, allLibs, true);
                action.library = 'H5P.RowColumn 1.3';
                // Le groupe homonyme content est transparent dans RowColumn.
                action.params.content = action.params.content.map(({ content }) => content);
                const width = column.width === '' || column.width == null ? undefined : Number(column.width);
                columns.push({ ...(width === undefined ? {} : { width }), content: action });
            }
            items.push(buildColumnItem({
                library: 'H5P.Row 1.3', subContentId: generateUUID(),
                metadata: { title: '', contentType: 'Row', license: 'U' },
                params: { columns }
            }));
            allLibs.add('H5P.Row');
            allLibs.add('H5P.RowColumn');
        } else if (type === 'exercise' && block.library) {
            const { action, libName } = await buildExerciseBlock(block, helpers);
            items.push(buildColumnItem(action));
            allLibs.add(libName);
        } else {
            debugLog('InteractiveBook', `Bloc ignoré (type "${type}" sans données exploitables)`, block);
        }
    }

    // Garde-fou : un chapitre vide serait filtré par le player → injecter un bloc texte
    if (items.length === 0) {
        items.push(buildColumnItem(buildTextBlock(chapter.title || ' ')));
        allLibs.add('H5P.AdvancedText');
    }

    return {
        library: 'H5P.Column 1.22',
        subContentId: generateUUID(),
        metadata: {
            contentType: 'Column',
            license: 'U',
            // Titre affiché dans la table des matières — obligatoire
            title: chapter.title || 'Chapitre'
        },
        params: { content: items }
    };
}

/**
 * Construit les libellés l10n du player — champs PLATS de premier niveau
 * (contrairement à CoursePresentation qui les imbrique dans un objet l10n).
 * @returns {Object} Les champs l10n à fusionner dans content
 */
function buildL10n() {
    return {
        read: translations.h5p_ib_read || "Lire",
        displayTOC: translations.h5p_ib_display_toc || "Afficher la table des matières",
        hideTOC: translations.h5p_ib_hide_toc || "Masquer la table des matières",
        nextPage: translations.h5p_ib_next_page || "Page suivante",
        previousPage: translations.h5p_ib_previous_page || "Page précédente",
        // H5P.InteractiveBook 1.15+ : la barre de navigation H5P.Components affiche
        // désormais les libellés courts `next`/`previous` (les anciens nextPage/previousPage
        // deviennent les aria-labels) + `page` (indicateur de progression). Sans ces champs,
        // les boutons s'affichent en anglais (« Next ») voire vides.
        next: translations.h5p_next || "Suivant",
        previous: translations.h5p_previous || "Précédent",
        page: translations.h5p_ib_page || "Page",
        chapterCompleted: translations.h5p_ib_chapter_completed || "Page terminée !",
        partCompleted: translations.h5p_ib_part_completed || "@pages sur @total terminées",
        incompleteChapter: translations.h5p_ib_incomplete_chapter || "Page incomplète",
        navigateToTop: translations.h5p_ib_navigate_top || "Aller en haut",
        markAsFinished: translations.h5p_ib_mark_finished || "J'ai terminé cette page",
        fullscreen: translations.h5p_ib_fullscreen || "Plein écran",
        exitFullscreen: translations.h5p_ib_exit_fullscreen || "Quitter le plein écran",
        bookProgressSubtext: translations.h5p_ib_book_progress_subtext || "@count sur @total pages",
        interactionsProgressSubtext: translations.h5p_ib_interactions_progress_subtext || "@count sur @total interactions",
        submitReport: translations.h5p_ib_submit_report || "Soumettre le rapport",
        restartLabel: translations.h5p_ib_restart || "Recommencer",
        summaryHeader: translations.h5p_ib_summary_header || "Résumé",
        allInteractions: translations.h5p_ib_all_interactions || "Toutes les interactions",
        unansweredInteractions: translations.h5p_ib_unanswered || "Interactions sans réponse",
        scoreText: translations.h5p_ib_score_text || "@score / @maxscore",
        leftOutOfTotalCompleted: translations.h5p_ib_left_of_total || "@left sur @max interactions terminées",
        noInteractions: translations.h5p_ib_no_interactions || "Aucune interaction",
        score: translations.h5p_ib_score || "Score",
        summaryAndSubmit: translations.h5p_ib_summary_and_submit || "Résumé & envoi",
        noChapterInteractionBoldText: translations.h5p_ib_no_chapter_bold || "Vous n'avez interagi avec aucune page.",
        noChapterInteractionText: translations.h5p_ib_no_chapter_text || "Vous devez interagir avec au moins une page avant de voir le résumé.",
        yourAnswersAreSubmittedForReview: translations.h5p_ib_answers_submitted || "Vos réponses ont été soumises pour évaluation !",
        bookProgress: translations.h5p_ib_book_progress || "Progression du livre",
        interactionsProgress: translations.h5p_ib_interactions_progress || "Progression des interactions",
        totalScoreLabel: translations.h5p_ib_total_score || "Score total",
        a11y: {
            progress: translations.h5p_ib_a11y_progress || "Page @page sur @total.",
            menu: translations.h5p_ib_a11y_menu || "Afficher/masquer le menu de navigation"
        }
    };
}

/**
 * Normalise une couleur hex fournie par l'IA ('1768c4' → '#1768c4').
 * Retourne null si la valeur n'est pas une couleur hex exploitable.
 * @param {string} color
 * @returns {string|null}
 */
function normalizeHexColor(color) {
    if (typeof color !== 'string') return null;
    const c = color.trim();
    if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
    if (/^[0-9a-f]{6}$/i.test(c)) return `#${c}`;
    return null;
}


export default {
    /**
     * Traite le JSON simplifié pour le Livre interactif.
     * @param {Object} jsonObj - Le JSON d'entrée simplifié (cf. Annexe A du PRD).
     * @param {Object} helpers - Fonctions injectées par le routeur.
     * @param {Function} helpers.processChild - Traitement des sous-exercices.
     * @param {Function} helpers.getLibraryMetadata - Métadonnées des libs enfants.
     * @param {Function} helpers.getKeyFromLibrary - Résolution machineName → moduleKey.
     * @returns {Promise<{content: Object, dependencies: Array}>}
     */
    async process(jsonObj, helpers) {
        if(jsonObj.chapters?.[0]?.params){
            const content=JSON.parse(JSON.stringify(jsonObj));
            const dependencies=[];const seen=new Set();
            const walk=value=>{if(!value||typeof value!=='object')return;
                if(typeof value.library==='string'){const m=/^(H5P\.[A-Za-z0-9]+) (\d+)\.(\d+)$/.exec(value.library);if(m&&!seen.has(value.library)){seen.add(value.library);dependencies.push({machineName:m[1],majorVersion:+m[2],minorVersion:+m[3]});}}
                Object.values(value).forEach(walk);};walk(content);
            return {content,dependencies};
        }

        debugLog('InteractiveBook', 'Début du traitement', { chaptersCount: jsonObj.chapters?.length });

        // Healing LaTeX local : envelopper ^{}, _{}, \circ etc. (réutilisé de CoursePresentation)
        const chapters = healSlidesLatex(jsonObj.chapters || []);
        const allLibs = new Set();
        const processedChapters = [];

        // Traiter chaque chapitre séquentiellement (l'ordre est pédagogiquement significatif)
        for (const chapter of chapters) {
            if (!chapter || typeof chapter !== 'object') continue;
            processedChapters.push(await processChapter(chapter, helpers, allLibs));
        }

        // Page de couverture : uniquement si l'IA/l'utilisateur a fourni un objet cover
        const hasCover = jsonObj.cover?.enabled ?? !!(jsonObj.cover && (jsonObj.cover.description || jsonObj.cover.media));

        // Assembler le content.json final
        const content = {
            // Conservé pour les métadonnées H5P (h5p-creator.js l'utilise pour h5p.json)
            title: jsonObj.title || '',
            showCoverPage: hasCover,
            ...(jsonObj.cover ? {
                bookCover: {
                    coverDescription: formatTextToHtml(jsonObj.cover.description || ''),
                    ...(jsonObj.cover.media ? { coverMedium: jsonObj.cover.media } : {})
                }
            } : {}),
            chapters: processedChapters,
            behaviour: {
                baseColor: normalizeHexColor(jsonObj.baseColor) || DEFAULTS.baseColor,
                defaultTableOfContents: jsonObj.showTableOfContents ?? DEFAULTS.defaultTableOfContents,
                progressIndicators: jsonObj.progressIndicators ?? DEFAULTS.progressIndicators,
                progressAuto: jsonObj.progressAuto ?? DEFAULTS.progressAuto,
                displaySummary: jsonObj.displaySummary ?? DEFAULTS.displaySummary,
                enableRetry: jsonObj.enableRetry ?? DEFAULTS.enableRetry
            },
            // l10n PLATE fusionnée au premier niveau (spécificité InteractiveBook)
            ...buildL10n()
        };

        // Collecter les dépendances dynamiques des librairies réellement utilisées
        const dependencies = [];
        const addedDeps = new Set();
        const coverLibrary = jsonObj.cover?.media?.library?.match(/^(H5P\.(?:Image|Video)) (\d+)\.(\d+)$/);
        if (coverLibrary) {
            dependencies.push({ machineName: coverLibrary[1], majorVersion: Number(coverLibrary[2]), minorVersion: Number(coverLibrary[3]) });
            addedDeps.add(`${coverLibrary[1]}-${coverLibrary[2]}.${coverLibrary[3]}`);
        }

        // H5P.Column est TOUJOURS requis (chaque chapitre en est un)
        addedDeps.add('H5P.Column-1.22');
        dependencies.push({ machineName: 'H5P.Column', majorVersion: 1, minorVersion: 22 });

        for (const machineName of ['H5P.Row', 'H5P.RowColumn']) {
            if (allLibs.has(machineName)) {
                addedDeps.add(`${machineName}-1.3`);
                dependencies.push({ machineName, majorVersion: 1, minorVersion: 3 });
            }
        }

        if (helpers && helpers.getKeyFromLibrary && helpers.getLibraryMetadata) {
            for (const libName of allLibs) {
                const childModuleKey = helpers.getKeyFromLibrary(libName);
                if (childModuleKey) {
                    const metadata = helpers.getLibraryMetadata(childModuleKey);
                    if (metadata) {
                        const depKey = `${metadata.machineName}-${metadata.version.major}.${metadata.version.minor}`;
                        if (!addedDeps.has(depKey)) {
                            addedDeps.add(depKey);
                            dependencies.push({
                                machineName: metadata.machineName,
                                majorVersion: metadata.version.major,
                                minorVersion: metadata.version.minor
                            });
                        }
                        // Ajouter les sous-dépendances
                        if (metadata.extraDependencies) {
                            for (const extraDep of metadata.extraDependencies) {
                                const extraKey = `${extraDep.machineName}-${extraDep.majorVersion}.${extraDep.minorVersion}`;
                                if (!addedDeps.has(extraKey)) {
                                    addedDeps.add(extraKey);
                                    dependencies.push(extraDep);
                                }
                            }
                        }
                    }
                } else {
                    debugLog('InteractiveBook', `Pas de moduleKey pour la librairie : ${libName}`);
                }
            }
        }

        // Détection conditionnelle de LaTeX pour MathDisplay (chapitres + couverture)
        const allText = JSON.stringify(processedChapters) + (content.bookCover?.coverDescription || '');
        const hasLatex = /\\\(|\\\)|\\\[|\\\]|\$[^$]+\$/.test(allText);
        if (hasLatex) {
            const mathDisplayKey = 'H5P.MathDisplay-1.0';
            if (!addedDeps.has(mathDisplayKey)) {
                addedDeps.add(mathDisplayKey);
                dependencies.push({ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 });
            }
        }

        debugLog('InteractiveBook', 'Traitement terminé', {
            chaptersCount: processedChapters.length,
            dependenciesCount: dependencies.length,
            cover: hasCover,
            libs: [...allLibs]
        });

        return { content, dependencies };
    }
};
