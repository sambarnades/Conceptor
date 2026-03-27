/**
 * Processeur H5P — Présentation de cours (CoursePresentation)
 *
 * Transforme le JSON simplifié de l'IA (slides sémantiques) en JSON H5P complet
 * avec coordonnées, UUIDs, library strings, l10n et dépendances dynamiques.
 * Délègue le traitement des sous-exercices aux processeurs existants via helpers.processChild().
 *
 * Pattern similaire à QuizSet : processeur async retournant { content, dependencies }.
 *
 * @module processors/CoursePresentation
 * @exports {Object} default.process - Transformation principale (async, reçoit helpers)
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID } from '../../core/utils.js';
import { debugLog } from '../../core/utils.js';

// === Constantes configurables (exposables dans l'éditeur) ===
const DEFAULTS = {
    keywordListEnabled: false,
    keywordListAlwaysShow: false,
    keywordListAutoHide: false,
    keywordListOpacity: 90,
    globalBackgroundColor: '#ffffff',
    enableRetry: false,
    enableSolutionsButton: false,
    hideSummarySlide: false,
    activeSurface: false,
    backgroundOpacityText: 80,
    backgroundOpacityExercise: 0,
    backgroundOpacityTable: 0,
    displayAsButton: false,
};

// === Mapping type simplifié IA → library H5P complète ===
const LIBRARY_MAP = {
    'multichoice':      'H5P.MultiChoice 1.16',
    'truefalse':        'H5P.TrueFalse 1.8',
    'blanks':           'H5P.Blanks 1.14',
    'dragtext':         'H5P.DragText 1.10',
    'singlechoiceset':  'H5P.SingleChoiceSet 1.11',
    'markthewords':     'H5P.MarkTheWords 1.11',
    'summary':          'H5P.Summary 1.10',
    'dragquestion':     'H5P.DragQuestion 1.14',
    'dialogcards':      'H5P.Dialogcards 1.9',
    'advancedtext':     'H5P.AdvancedText 1.1',
    'table':            'H5P.Table 1.2',
    'exportabletextarea': 'H5P.ExportableTextArea 1.3',
};

// === Templates de layout par type de slide (positions en %) ===
// Suffixes : :image-left (défaut), :image-right, :image-top, :image-bottom
const SLIDE_LAYOUTS = {
    // --- TITLE ---
    title: [
        { role: 'title', x: 5, y: 15, width: 90, height: 70 }
    ],
    'title:image-left': [
        { role: 'image', x: 2, y: 5, width: 40, height: 90 },
        { role: 'title', x: 45, y: 15, width: 52, height: 70 }
    ],
    'title:image-right': [
        { role: 'title', x: 2, y: 15, width: 52, height: 70 },
        { role: 'image', x: 57, y: 5, width: 40, height: 90 }
    ],
    'title:image-top': [
        { role: 'image', x: 15, y: 2, width: 70, height: 45 },
        { role: 'title', x: 5, y: 50, width: 90, height: 48 }
    ],
    'title:image-bottom': [
        { role: 'title', x: 5, y: 2, width: 90, height: 48 },
        { role: 'image', x: 15, y: 52, width: 70, height: 45 }
    ],

    // --- CONTENT ---
    content: [
        { role: 'text', x: 2, y: 2, width: 96, height: 96 }
    ],
    'content:image-left': [
        { role: 'image', x: 2, y: 2, width: 35, height: 96 },
        { role: 'text', x: 39, y: 2, width: 59, height: 96 }
    ],
    'content:image-right': [
        { role: 'text', x: 2, y: 2, width: 59, height: 96 },
        { role: 'image', x: 63, y: 2, width: 35, height: 96 }
    ],
    'content:image-top': [
        { role: 'image', x: 10, y: 2, width: 80, height: 40 },
        { role: 'text', x: 2, y: 44, width: 96, height: 54 }
    ],
    'content:image-bottom': [
        { role: 'text', x: 2, y: 2, width: 96, height: 54 },
        { role: 'image', x: 10, y: 58, width: 80, height: 40 }
    ],

    // --- CONTENT-WITH-TABLE ---
    'content-with-table': [
        { role: 'text',  x: 2, y: 2,  width: 96, height: 35 },
        { role: 'table', x: 2, y: 39, width: 96, height: 59 }
    ],
    'content-with-table:image-left': [
        { role: 'image', x: 2, y: 2, width: 30, height: 96 },
        { role: 'text',  x: 34, y: 2,  width: 64, height: 35 },
        { role: 'table', x: 34, y: 39, width: 64, height: 59 }
    ],
    'content-with-table:image-right': [
        { role: 'text',  x: 2, y: 2,  width: 64, height: 35 },
        { role: 'table', x: 2, y: 39, width: 64, height: 59 },
        { role: 'image', x: 68, y: 2, width: 30, height: 96 }
    ],
    'content-with-table:image-top': [
        { role: 'image', x: 10, y: 2, width: 80, height: 30 },
        { role: 'text',  x: 2, y: 34,  width: 96, height: 25 },
        { role: 'table', x: 2, y: 61, width: 96, height: 37 }
    ],
    'content-with-table:image-bottom': [
        { role: 'text',  x: 2, y: 2,  width: 96, height: 25 },
        { role: 'table', x: 2, y: 29, width: 96, height: 37 },
        { role: 'image', x: 10, y: 68, width: 80, height: 30 }
    ],
    'content-with-table:horizontal': [
        { role: 'text',  x: 2,  y: 2, width: 47, height: 96 },
        { role: 'table', x: 51, y: 2, width: 47, height: 96 }
    ],

    // --- QUIZ ---
    quiz: [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 96 }
    ],
    'quiz:image-left': [
        { role: 'image', x: 2, y: 2, width: 30, height: 96 },
        { role: 'exercise', x: 34, y: 2, width: 64, height: 96 }
    ],
    'quiz:image-right': [
        { role: 'exercise', x: 2, y: 2, width: 64, height: 96 },
        { role: 'image', x: 68, y: 2, width: 30, height: 96 }
    ],
    'quiz:image-top': [
        { role: 'image', x: 10, y: 2, width: 80, height: 35 },
        { role: 'exercise', x: 2, y: 39, width: 96, height: 59 }
    ],
    'quiz:image-bottom': [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 59 },
        { role: 'image', x: 10, y: 63, width: 80, height: 35 }
    ],

    // --- CONTENT-QUIZ ---
    'content-quiz': [
        { role: 'text',     x: 2, y: 2,  width: 96, height: 35 },
        { role: 'exercise', x: 2, y: 39, width: 96, height: 59 }
    ],
    'content-quiz:image-left': [
        { role: 'image',    x: 2,  y: 2,  width: 30, height: 96 },
        { role: 'text',     x: 34, y: 2,  width: 64, height: 35 },
        { role: 'exercise', x: 34, y: 39, width: 64, height: 59 }
    ],
    'content-quiz:image-right': [
        { role: 'text',     x: 2, y: 2,  width: 64, height: 35 },
        { role: 'exercise', x: 2, y: 39, width: 64, height: 59 },
        { role: 'image',    x: 68, y: 2, width: 30, height: 96 }
    ],
    'content-quiz:image-top': [
        { role: 'image',    x: 10, y: 2,  width: 80, height: 25 },
        { role: 'text',     x: 2,  y: 29, width: 96, height: 25 },
        { role: 'exercise', x: 2,  y: 56, width: 96, height: 42 }
    ],
    'content-quiz:image-bottom': [
        { role: 'text',     x: 2, y: 2,  width: 96, height: 25 },
        { role: 'exercise', x: 2, y: 29, width: 96, height: 42 },
        { role: 'image',    x: 10, y: 73, width: 80, height: 25 }
    ],
    'content-quiz:horizontal': [
        { role: 'text',     x: 2,  y: 2, width: 47, height: 96 },
        { role: 'exercise', x: 51, y: 2, width: 47, height: 96 }
    ],

    // --- SUMMARY ---
    summary: [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 96 }
    ],
    'summary:image-left': [
        { role: 'image', x: 2, y: 2, width: 30, height: 96 },
        { role: 'exercise', x: 34, y: 2, width: 64, height: 96 }
    ],
    'summary:image-right': [
        { role: 'exercise', x: 2, y: 2, width: 64, height: 96 },
        { role: 'image', x: 68, y: 2, width: 30, height: 96 }
    ],
    'summary:image-top': [
        { role: 'image', x: 10, y: 2, width: 80, height: 35 },
        { role: 'exercise', x: 2, y: 39, width: 96, height: 59 }
    ],
    'summary:image-bottom': [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 59 },
        { role: 'image', x: 10, y: 63, width: 80, height: 35 }
    ]
};

// === Types d'exercices qui passent par un processeur enfant ===
const EXERCISE_TYPES = new Set([
    'multichoice', 'truefalse', 'blanks', 'dragtext',
    'singlechoiceset', 'markthewords', 'summary',
    'dragquestion', 'dialogcards'
]);

// === Types de contenu simple (pas de processeur enfant) ===
const CONTENT_TYPES = new Set(['advancedtext', 'table', 'exportabletextarea']);


/**
 * Construit les params d'un exercice dans le format attendu par le processeur enfant.
 * @param {Object} exercise - L'exercice simplifié de l'IA
 * @param {string} type - Le type simplifié (ex: 'multichoice')
 * @returns {Object} Les params formatés
 */
function buildExerciseParams(exercise) {
    // On retire juste la clé `library` (gérée en amont).
    // Toute normalisation est déléguée au processeur enfant standalone,
    // qui gère déjà tous les formats et cas limites de l'IA.
    const { library, ...params } = exercise;
    return params;
}

/**
 * Construit un élément H5P de contenu simple (AdvancedText, Table, ExportableTextArea).
 * @param {string} type - Le type de contenu
 * @param {Object} slide - Les données du slide
 * @param {Object} layout - Les coordonnées du layout
 * @returns {Object} L'élément H5P positionné
 */
function buildContentElement(type, content, layout) {
    const element = {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        backgroundOpacity: DEFAULTS.backgroundOpacityText,
        displayAsButton: DEFAULTS.displayAsButton,
        action: {
            library: LIBRARY_MAP[type],
            subContentId: generateUUID(),
            metadata: {
                title: '',
                contentType: 'Text'
            },
            params: {}
        }
    };

    switch (type) {
        case 'advancedtext':
            element.action.params = {
                text: formatTextToHtml(content.text || content)
            };
            break;

        case 'table':
            element.action.params = buildTableParams(content);
            element.backgroundOpacity = DEFAULTS.backgroundOpacityTable;
            break;

        case 'exportabletextarea':
            element.action.params = {
                text: formatTextToHtml(content.text || content),
                placeholder: content.placeholder || ''
            };
            break;
    }

    return element;
}

/**
 * Construit les params pour un élément Table H5P.
 * @param {Object} tableData - { headers: [], rows: [[]] }
 * @returns {Object} Les params Table H5P
 */
function buildTableParams(tableData) {
    if (!tableData || !tableData.headers) return { text: '<table></table>' };

    const style = tableData._style || 'default';

    // Styles de tableau disponibles — chaque td a un background explicite
    // pour garantir la lisibilité quel que soit le fond du slide
    const TABLE_STYLES = {
        default: {
            table: 'border-collapse:collapse;width:100%',
            th: 'border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left',
            td: 'border:1px solid #ddd;padding:8px;background:#fff',
            tdAlt: 'border:1px solid #ddd;padding:8px;background:#f9f9f9'
        },
        striped: {
            table: 'border-collapse:collapse;width:100%',
            th: 'border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left',
            td: 'border:1px solid #ddd;padding:8px;background:#fff',
            tdAlt: 'border:1px solid #ddd;padding:8px;background:#f0f0f0'
        },
        bordered: {
            table: 'border-collapse:collapse;width:100%;border:2px solid #333',
            th: 'border:2px solid #333;padding:8px;background:#f5f5f5;text-align:left',
            td: 'border:2px solid #333;padding:8px;background:#fff',
            tdAlt: 'border:2px solid #333;padding:8px;background:#f5f5f5'
        },
        'dark-header': {
            table: 'border-collapse:collapse;width:100%',
            th: 'border:1px solid #333;padding:8px;background:#333;color:#fff;text-align:left',
            td: 'border:1px solid #ddd;padding:8px;background:#fff',
            tdAlt: 'border:1px solid #ddd;padding:8px;background:#f2f2f2'
        },
        minimal: {
            table: 'border-collapse:collapse;width:100%',
            th: 'border-bottom:2px solid #ddd;padding:8px;text-align:left;background:#fff',
            td: 'border-bottom:1px solid #eee;padding:8px;background:#fff',
            tdAlt: 'border-bottom:1px solid #eee;padding:8px;background:#fafafa'
        },
        dsfr: {
            table: 'border-collapse:collapse;width:100%',
            th: 'border:1px solid #e3e3fd;padding:10px 12px;background:#000091;color:#fff;text-align:left;font-weight:600',
            td: 'border:1px solid #e3e3fd;padding:10px 12px;background:#fff',
            tdAlt: 'border:1px solid #e3e3fd;padding:10px 12px;background:#f5f5fe'
        }
    };

    const s = TABLE_STYLES[style] || TABLE_STYLES.default;

    // Construire le HTML du tableau avec styles inline
    let html = `<table style="${s.table}">`;

    // En-têtes — formatTextToHtml pour convertir le markdown (*gras*, *italique*)
    html += '<thead><tr>';
    (tableData.headers || []).forEach(h => {
        html += `<th style="${s.th}">${formatTextToHtml(h || '')}</th>`;
    });
    html += '</tr></thead>';

    // Lignes de données — alternance pair/impair pour lisibilité
    html += '<tbody>';
    (tableData.rows || []).forEach((row, i) => {
        const cellStyle = (i % 2 === 1 && s.tdAlt) ? s.tdAlt : s.td;
        html += '<tr>';
        (Array.isArray(row) ? row : []).forEach(cell => {
            html += `<td style="${cellStyle}">${formatTextToHtml(cell || '')}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    return { text: html };
}

/**
 * Construit un élément titre pour le slide de titre.
 * @param {Object} slide - Le slide de titre
 * @param {Object} layout - Les coordonnées du layout
 * @returns {Object} L'élément H5P
 */
function buildTitleElement(slide, layout) {
    let html = `<h2>${formatTextToHtml(slide.title || '')}</h2>`;
    if (slide.subtitle) {
        html += `<p>${formatTextToHtml(slide.subtitle)}</p>`;
    }

    return {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        backgroundOpacity: DEFAULTS.backgroundOpacityText,
        displayAsButton: DEFAULTS.displayAsButton,
        action: {
            library: 'H5P.AdvancedText 1.1',
            subContentId: generateUUID(),
            metadata: { title: slide.title || '', contentType: 'Text' },
            params: { text: html }
        }
    };
}

/**
 * Construit un élément image H5P pour un slide.
 * @param {Object} imageData - Les données image { path, mime, width, height }
 * @param {string} altText - Texte alternatif
 * @param {Object} layout - Les coordonnées du layout
 * @returns {Object} L'élément H5P positionné
 */
function buildImageElement(imageData, altText, layout) {
    return {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        backgroundOpacity: 0,
        displayAsButton: false,
        action: {
            library: 'H5P.Image 1.1',
            subContentId: generateUUID(),
            metadata: {
                contentType: 'Image',
                license: 'U',
                title: 'Untitled Image'
            },
            params: {
                file: {
                    path: imageData.path,
                    mime: imageData.mime || 'image/jpeg',
                    width: imageData.width || 0,
                    height: imageData.height || 0
                },
                alt: altText || '',
                decorative: !altText
            }
        }
    };
}

/**
 * Construit un élément exercice H5P, en déléguant au processeur enfant.
 * @param {Object} exercise - L'exercice simplifié
 * @param {Object} layout - Les coordonnées du layout
 * @param {Object} helpers - Les helpers du routeur (processChild, etc.)
 * @returns {Promise<{element: Object, libName: string}>} L'élément H5P + le nom de la lib
 */
async function buildExerciseElement(exercise, layout, helpers) {
    // Accepter la clé simplifiée ("multichoice") ou la library complète ("H5P.MultiChoice 1.16")
    const rawLib = (exercise.library || '').trim();
    const libraryKey = rawLib.includes('.')
        ? Object.keys(LIBRARY_MAP).find(k => LIBRARY_MAP[k].toLowerCase() === rawLib.toLowerCase()) || rawLib.toLowerCase()
        : rawLib.toLowerCase();
    const fullLibrary = LIBRARY_MAP[libraryKey];

    if (!fullLibrary) {
        debugLog('CoursePresentation', `Type d'exercice inconnu : ${libraryKey}, fallback AdvancedText`);
        // Fallback : afficher en texte
        return {
            element: buildContentElement('advancedtext', {
                text: `<p><em>Exercice non reconnu (${libraryKey})</em></p>`
            }, layout),
            libName: 'H5P.AdvancedText'
        };
    }

    const libName = fullLibrary.split(' ')[0];
    const params = buildExerciseParams(exercise);

    // Construire l'objet subContent pour le processeur enfant
    const subContent = {
        subContentId: generateUUID(),
        library: fullLibrary,
        metadata: {
            title: exercise.title || exercise.question || 'Exercice',
            contentType: EXERCISE_TYPES.has(libraryKey) ? 'Exercise' : 'Text'
        },
        params: params
    };

    // Déléguer au processeur enfant si disponible
    let processedContent = subContent;
    if (helpers && helpers.processChild && EXERCISE_TYPES.has(libraryKey)) {
        try {
            processedContent = await helpers.processChild(subContent);
        } catch (e) {
            debugLog('CoursePresentation', `Erreur processChild pour ${libraryKey}:`, e);
            // On garde le subContent non transformé
        }
    }

    const element = {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        backgroundOpacity: DEFAULTS.backgroundOpacityExercise,
        displayAsButton: DEFAULTS.displayAsButton,
        action: processedContent
    };

    return { element, libName };
}

/**
 * Traite un slide et produit les éléments H5P positionnés.
 * @param {Object} slide - Le slide simplifié de l'IA
 * @param {Object} helpers - Les helpers du routeur
 * @returns {Promise<{elements: Array, keywords: Array, libs: Set, bgSelector: Object}>}
 */
async function processSlide(slide, helpers) {
    const slideType = slide.type || 'content';
    const hasImage = slide.slideImage && slide.slideImage.path;

    // Sélection du layout : image (avec position) > horizontal > standard
    let layoutKey;
    if (hasImage) {
        const pos = slide.slideImagePosition || 'left';
        const imageKey = `${slideType}:image-${pos}`;
        layoutKey = SLIDE_LAYOUTS[imageKey] ? imageKey : `${slideType}:image-left`;
    } else if (slide.layout === 'horizontal') {
        layoutKey = `${slideType}:horizontal`;
    } else {
        layoutKey = slideType;
    }
    const layoutTemplate = SLIDE_LAYOUTS[layoutKey] || SLIDE_LAYOUTS[slideType] || SLIDE_LAYOUTS['content'];
    const elements = [];
    const libs = new Set();
    const keywords = [];

    // Ajouter le mot-clé de navigation depuis le titre du slide
    if (slide.title) {
        keywords.push({ main: slide.title });
    }

    for (const layoutItem of layoutTemplate) {
        switch (layoutItem.role) {
            case 'title':
                // Slide de titre
                elements.push(buildTitleElement(slide, layoutItem));
                libs.add('H5P.AdvancedText');
                break;

            case 'image':
                // Image du slide
                if (hasImage) {
                    elements.push(buildImageElement(slide.slideImage, slide.slideImageAlt || '', layoutItem));
                    libs.add('H5P.Image');
                }
                break;

            case 'text':
                // Contenu texte riche
                if (slide.text) {
                    elements.push(buildContentElement('advancedtext', { text: slide.text }, layoutItem));
                    libs.add('H5P.AdvancedText');
                }
                break;

            case 'table':
                // Tableau avec style optionnel
                if (slide.table) {
                    elements.push(buildContentElement('table', { ...slide.table, _style: slide.tableStyle }, layoutItem));
                    libs.add('H5P.Table');
                }
                break;

            case 'exercise':
                // Exercice interactif
                if (slide.exercise) {
                    const { element, libName } = await buildExerciseElement(
                        slide.exercise, layoutItem, helpers
                    );
                    elements.push(element);
                    libs.add(libName);
                }
                break;
        }
    }

    // Fallback : si l'image existe mais qu'aucun rôle 'image' n'était dans le layout,
    // l'ajouter comme élément supplémentaire en bas à droite
    if (hasImage && !layoutTemplate.some(item => item.role === 'image')) {
        elements.push(buildImageElement(slide.slideImage, slide.slideImageAlt || '',
            { x: 65, y: 55, width: 33, height: 43 }));
        libs.add('H5P.Image');
    }

    // Construire le slideBackgroundSelector (champ H5P : fillSlideBackground)
    const bgSelector = {};
    if (slide.backgroundColor) {
        bgSelector.fillSlideBackground = slide.backgroundColor;
    }

    return { elements, keywords, libs, bgSelector };
}

/**
 * Construit la section l10n complète du CoursePresentation.
 * @returns {Object} L'objet l10n
 */
function buildL10n() {
    return {
        slide: translations.h5p_cp_slide || "Diapositive",
        currentSlide: translations.h5p_cp_current_slide || "Diapositive actuelle",
        nextSlide: translations.h5p_cp_next_slide || "Diapositive suivante",
        prevSlide: translations.h5p_cp_prev_slide || "Diapositive précédente",
        lastSlide: translations.h5p_cp_last_slide || "Dernière diapositive",
        score: translations.h5p_cp_score || "Score",
        yourScore: translations.h5p_cp_your_score || "Votre score",
        maxScore: translations.h5p_cp_max_score || "Score maximum",
        total: translations.h5p_cp_total || "Total",
        totalScore: translations.h5p_cp_total_score || "Score total",
        scoreMessage: translations.h5p_cp_score_message || "Vous avez obtenu :",
        showSolutions: translations.h5p_show_solution || "Afficher les solutions",
        solutionsButtonTitle: translations.h5p_cp_show_comments || "Afficher les commentaires",
        retry: translations.h5p_try_again || "Réessayer",
        exportAnswers: translations.h5p_cp_export_answers || "Exporter les réponses",
        summary: translations.h5p_cp_summary || "Résumé",
        summaryMultipleTaskText: translations.h5p_cp_summary_multiple || "Plusieurs exercices",
        hideKeywords: translations.h5p_cp_hide_keywords || "Masquer le menu de navigation",
        showKeywords: translations.h5p_cp_show_keywords || "Afficher le menu de navigation",
        fullscreen: translations.h5p_cp_fullscreen || "Plein écran",
        exitFullscreen: translations.h5p_cp_exit_fullscreen || "Quitter le plein écran",
        noTitle: translations.h5p_cp_no_title || "Sans titre",
        printTitle: translations.h5p_cp_print || "Imprimer",
        printIngress: translations.h5p_cp_print_ingress || "Comment souhaitez-vous imprimer cette présentation ?",
        printAllSlides: translations.h5p_cp_print_all || "Imprimer toutes les diapositives",
        printCurrentSlide: translations.h5p_cp_print_current || "Imprimer la diapositive actuelle",
        solutionModeTitle: translations.h5p_cp_exit_solution || "Quitter le mode solution",
        solutionModeText: translations.h5p_cp_solution_mode || "Mode solution",
        // Accessibilité
        accessibilitySlideNavigationExplanation: translations.h5p_cp_a11y_nav || "Utilisez les flèches gauche et droite pour naviguer entre les diapositives.",
        accessibilityCanvasLabel: translations.h5p_cp_a11y_canvas || "Présentation. Utilisez les flèches pour naviguer.",
        accessibilityProgressBarLabel: translations.h5p_cp_a11y_progress || "Choisir la diapositive à afficher",
        accessibilityTotalScore: translations.h5p_cp_a11y_score || "Vous avez obtenu @score sur @maxScore points au total",
        accessibilityEnteredFullscreen: translations.h5p_cp_a11y_enter_fs || "Mode plein écran activé",
        accessibilityExitedFullscreen: translations.h5p_cp_a11y_exit_fs || "Mode plein écran désactivé",
        containsNotCompleted: translations.h5p_cp_a11y_not_completed || "@slideName contient une interaction non terminée",
        containsCompleted: translations.h5p_cp_a11y_completed || "@slideName contient une interaction terminée",
        containsOnlyCorrect: translations.h5p_cp_a11y_only_correct || "@slideName n'a que des réponses correctes",
        containsIncorrectAnswers: translations.h5p_cp_a11y_incorrect || "@slideName a des réponses incorrectes",
        slideCount: translations.h5p_cp_a11y_slide_count || "Diapositive @index sur @total",
        confirmDialogHeader: translations.h5p_cp_confirm_header || "Soumettre vos réponses",
        confirmDialogText: translations.h5p_cp_confirm_text || "Cela soumettra vos résultats. Voulez-vous continuer ?",
        confirmDialogConfirmText: translations.h5p_cp_confirm_ok || "Soumettre et voir les résultats",
        confirmDialogConfirmLabel: translations.h5p_cp_confirm_label || "Confirmer",
        confirmDialogCancelLabel: translations.h5p_cp_cancel_label || "Annuler",
    };
}


// === Healing LaTeX spécifique au CoursePresentation ===
// Complémente le healer global qui ne détecte que les \commandes connues.
// Cible les expressions avec ^{}, _{}, \circ etc. typiques des maths
// sans commande reconnue par autoWrapLatex (frac, sqrt, etc.).

/** Connecteurs français courants séparant les expressions math dans le texte */
const MATH_TEXT_BRIDGES = [
    'si et seulement si', 'pour tout', 'pour toute', 'tel que', 'telle que',
    "c'est-à-dire", 'il existe', 'on a', 'alors que', 'lorsque'
];
const BRIDGE_RE = new RegExp(
    `(\\b(?:${MATH_TEXT_BRIDGES.join('|')})\\b)`, 'gi'
);

/** Indicateurs de LaTeX nu non captés par le healer global */
const BARE_MATH_INDICATORS = /\^{|_{|\\circ|\\neq|\\approx|\\equiv|\\pm|\\mp|\\gg|\\ll/;

/**
 * Enveloppe les segments mathématiques nus dans une chaîne de caractères.
 * Ne touche pas aux chaînes déjà délimitées (\( \), \[ \], $).
 */
export function wrapBareMathSegments(str) {
    if (typeof str !== 'string') return str;
    // Ne pas toucher aux chaînes déjà délimitées
    if (/\\[(\[]|\\[)\]]|\$/.test(str)) return str;
    // Vérifier la présence d'indicateurs LaTeX nus
    if (!BARE_MATH_INDICATORS.test(str)) return str;

    // Retirer les noms de commandes LaTeX (\circ, \frac…) avant de chercher des mots texte
    const strNoCmd = str.replace(/\\[a-zA-Z]+/g, '');
    // Chaîne purement mathématique (aucun mot français de 4+ lettres) → envelopper tout
    const frenchWords = strNoCmd.match(/\b[a-zàâéèêëïîôùûüçæœ]{4,}\b/gi) || [];
    if (frenchWords.length === 0) {
        debugLog('CoursePresentation', `LaTeX nu (pur) enveloppé: "${str}"`);
        return `\\(${str.trim()}\\)`;
    }

    // Chaîne mixte texte+maths : séparer sur les connecteurs français
    const parts = str.split(BRIDGE_RE);
    let changed = false;

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) continue; // connecteur textuel → on le laisse
        const part = parts[i].trim();
        if (!part) continue;
        // Un segment est math s'il contient de la syntaxe math ET pas de mots longs
        const hasMathSyntax = /[\^_{}\\=]/.test(part);
        const partNoCmd = part.replace(/\\[a-zA-Z]+/g, '');
        const hasLongWord = /\b[a-zàâéèêëïîôùûüçæœ]{4,}\b/i.test(partNoCmd);
        if (hasMathSyntax && !hasLongWord) {
            parts[i] = parts[i].replace(part, `\\(${part}\\)`);
            changed = true;
        }
    }

    if (changed) {
        debugLog('CoursePresentation', `LaTeX nu (mixte) enveloppé: "${str}" → "${parts.join('')}"`);
        return parts.join('');
    }
    return str;
}

/**
 * Applique wrapBareMathSegments récursivement sur toutes les chaînes d'un objet.
 * Utilisé uniquement dans le processeur CoursePresentation.
 */
export function healSlidesLatex(item) {
    if (typeof item === 'string') return wrapBareMathSegments(item);
    if (Array.isArray(item)) return item.map(healSlidesLatex);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = healSlidesLatex(value);
        }
        return result;
    }
    return item;
}


export default {
    /**
     * Traite le JSON simplifié pour le CoursePresentation.
     * @param {Object} jsonObj - Le JSON d'entrée simplifié (cf. Annexe A du PRD).
     * @param {Object} helpers - Fonctions injectées par le routeur.
     * @param {Function} helpers.processChild - Traitement des sous-exercices.
     * @param {Function} helpers.getLibraryMetadata - Métadonnées des libs enfants.
     * @param {Function} helpers.getKeyFromLibrary - Résolution machineName → moduleKey.
     * @returns {Promise<{content: Object, dependencies: Array}>}
     */
    async process(jsonObj, helpers) {
        debugLog('CoursePresentation', 'Début du traitement', { slidesCount: jsonObj.slides?.length });

        // Healing LaTeX spécifique : envelopper ^{}, _{}, \circ etc. avant traitement
        const slides = healSlidesLatex(jsonObj.slides || []);
        const allLibs = new Set();
        const processedSlides = [];

        // Traiter chaque slide séquentiellement (l'ordre est pédagogiquement significatif)
        for (const slide of slides) {
            const { elements, keywords, libs, bgSelector } = await processSlide(slide, helpers);

            // Collecter les librairies utilisées
            for (const lib of libs) {
                allLibs.add(lib);
            }

            processedSlides.push({
                elements,
                keywords,
                slideBackgroundSelector: bgSelector
            });
        }

        // Construire la couleur de fond globale (champ H5P : fillGlobalBackground)
        const globalBgSelector = {};
        if (jsonObj.globalBackgroundColor || DEFAULTS.globalBackgroundColor) {
            globalBgSelector.fillGlobalBackground = jsonObj.globalBackgroundColor || DEFAULTS.globalBackgroundColor;
        }

        // Assembler le content.json final — prioriser les valeurs utilisateur sur les defaults
        const content = {
            // Conserver le titre pour les métadonnées H5P (h5p-creator.js l'utilise pour h5p.json)
            title: jsonObj.title || '',
            presentation: {
                slides: processedSlides,
                keywordListEnabled: jsonObj.keywordListEnabled ?? DEFAULTS.keywordListEnabled,
                keywordListAlwaysShow: DEFAULTS.keywordListAlwaysShow,
                keywordListAutoHide: DEFAULTS.keywordListAutoHide,
                keywordListOpacity: DEFAULTS.keywordListOpacity,
                globalBackgroundSelector: globalBgSelector
            },
            override: {
                activeSurface: DEFAULTS.activeSurface,
                hideSummarySlide: jsonObj.hideSummarySlide ?? DEFAULTS.hideSummarySlide,
                showSolutionButton: jsonObj.enableSolutionsButton === false ? "off" : "on",
                retryButton: jsonObj.enableRetry === false ? "off" : "on",
                summarySlideSolutionButton: true,
                summarySlideRetryButton: true
            },
            enablePrintButton: jsonObj.enablePrintButton ?? false,
            l10n: buildL10n()
        };

        // Collecter les dépendances dynamiques des librairies réellement utilisées
        const dependencies = [];
        const addedDeps = new Set();

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
                    debugLog('CoursePresentation', `Pas de moduleKey pour la librairie : ${libName}`);
                }
            }
        }

        // Détection conditionnelle de LaTeX pour MathDisplay
        const allText = JSON.stringify(processedSlides);
        const hasLatex = /\\\(|\\\)|\\\[|\\\]|\$[^$]+\$/.test(allText);
        if (hasLatex) {
            const mathDisplayKey = 'H5P.MathDisplay-1.0';
            if (!addedDeps.has(mathDisplayKey)) {
                addedDeps.add(mathDisplayKey);
                dependencies.push({ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 });
            }
        }

        debugLog('CoursePresentation', 'Traitement terminé', {
            slidesCount: processedSlides.length,
            dependenciesCount: dependencies.length,
            libs: [...allLibs]
        });

        return { content, dependencies };
    }
};
