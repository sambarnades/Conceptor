/**
 * sucrerie-binary-to-model.mjs — COPIE VERBATIM des fonctions « binaire → modèle »
 * de Sucrerie, pour le banc de PARITÉ d'export documentaire (Phase 3, C2).
 *
 * POURQUOI une copie et PAS un 2ᵉ serveur Sucrerie :
 *   Le moteur d'export (`js/export/document-exporter.js` + `document-formatter.js`
 *   + helpers latex/sanitizer/math-catalog) est BYTE-IDENTIQUE entre Caramel et
 *   Sucrerie (vérifié : `diff -q` → identique sur les 7 fichiers). La SEULE
 *   variable réelle est donc l'INPUT donné au formatter :
 *     - Caramel : `originalJsonData` = JSON source pré-processor (la fixture).
 *     - Sucrerie : `content.json` post-processor (H5P) ou XML reparsé (Moodle),
 *       passé par `normalizeH5pModel` / `parseActivity` / `parseStandaloneXml`.
 *   Faire tourner la VRAIE page Sucrerie sur un 2ᵉ port introduirait un CONFOND :
 *   `document-exporter.js` importe `core/translation.js`, et les chaînes de chrome
 *   du document DIFFÈRENT (`doc_fmt_header_title` = "Caramel - …" vs "Sucrerie - …",
 *   footer URL caramel vs sucrerie). Tout DOCX/ODT « différerait » alors pour une
 *   raison sans rapport avec la fidélité du contenu pédagogique. En copiant le sens
 *   « binaire → modèle » de Sucrerie et en le branchant sur le formatter Caramel
 *   (mêmes locales `js/locales/fr.json` des DEUX côtés A et B), on ISOLE exactement
 *   la variable demandée : la différence de MODÈLE d'entrée. La seule chose tenue
 *   constante qui divergerait en vrai = la marque dans le titre/pied de page du doc
 *   (sans rapport avec la fidélité du contenu).
 *
 * PROVENANCE (à resynchroniser si Sucrerie évolue — helper de diagnostic possible) :
 *   - `normalizeH5pModel`, `remapMediaImage`, `parseHtmlTable`, `adaptDragAndDrop`,
 *     `adaptCoursePresentation`, `adaptInteractiveBook`, `adaptInteractiveVideo`,
 *     `injectGridImages`, `H5P_LIBRARY_TO_MODULE_KEY`, `h5pExportModuleKey`
 *     → sucrerie `assets/js/h5p-export-bridge.js` (lignes 44-495), VERBATIM.
 *   - `detectQuestionSetVariant`
 *     → sucrerie `assets/js/h5p/h5p-reader.js` (lignes 403-…), VERBATIM.
 *   - `MODULE_TO_ELEA`, `readTar`, `parseXml`, `tagText`, `stripParagraphWrap`,
 *     `parseQuestionContent`, `PARSERS`, `parseActivity`, `parseStandaloneXml`,
 *     `extractMbzModule`
 *     → sucrerie `assets/js/moodle/mbz-parser.js`, VERBATIM (hors libs lazy : on
 *       suppose fflate déjà chargé via lib-loader, et on retire `assertDecompressedSizeSafe`
 *       / `assertEntryPathsSafe` car ce sont des GARDES de sécurité — pas une
 *       transformation de modèle ; leur absence ne change PAS le modèle produit).
 *   - `parseHtmlIntoBlocks` (Page/Livre)
 *     → sucrerie `assets/js/moodle/page-html-parser.js`, importé séparément
 *       (`./sucrerie-page-html-parser.mjs`, copie verbatim) car volumineux.
 *
 * Les seules adaptations : `debugLog` → noop local ; `import` Sucrerie internes
 * supprimés/remplacés. AUCUNE logique de transformation de modèle n'est modifiée.
 *
 * Grilles Crossword/FindTheWords : les générateurs Sucrerie
 * (`crossword-grid-generator.js`, `find-the-words-grid-generator.js`) sont
 * BYTE-IDENTIQUES à ceux de Caramel → on appelle directement les générateurs
 * Caramel (`/js/renderers/...`) pour l'enrichissement `_gridImage`. Idem pour
 * les DEUX côtés (A source + B Sucrerie) afin que la grille soit identique et
 * que seule la différence de MODÈLE reste mesurée.
 */

import { parseHtmlIntoBlocks } from './sucrerie-page-html-parser.mjs';

const debugLog = () => {}; // Sucrerie utilise core/utils.debugLog (no-op hors ?debug)

// =========================================================================
// === VERBATIM h5p-export-bridge.js : mapping + résolution moduleKey ===
// =========================================================================

export const H5P_LIBRARY_TO_MODULE_KEY = Object.freeze({
    'H5P.Timeline':          'Timeline',
    'H5P.Flashcards':        'Flashcards',
    'H5P.Blanks':            'FillInTheBlanks',
    'H5P.AdvancedText':      'Glossary',
    'H5P.Accordion':         'Glossary',
    'H5P.Crossword':         'Crossword',
    'H5P.Essay':             'Essay',
    'H5P.Summary':           'Summary',
    'H5P.DragText':          'DragTheWords',
    'H5P.DragQuestion':      'DragAndDrop',
    'H5P.TrueFalse':         'TrueFalse',
    'H5P.MultiChoice':       'MultipleChoice',
    'H5P.FindTheWords':      'FindTheWords',
    'H5P.SortParagraphs':    'SortParagraphs',
    'H5P.SingleChoiceSet':   'SingleChoiceSet',
    'H5P.Dialogcards':       'DialogCards',
    'H5P.AdvancedBlanks':    'ComplexFillTheBlanks',
    'H5P.Chart':             'Chart',
    'H5P.MarkTheWords':      'MarkTheWords',
    'H5P.QuestionSet':       'QuizSet',
    'H5P.CoursePresentation':'CoursePresentation',
    'H5P.InteractiveBook':   'InteractiveBook',
    'H5P.InteractiveVideo':  'InteractiveVideo',
    'H5P.ImageHotspots':     'ImageHotspots',
    'H5P.ImageHotspotQuestion': 'FindTheHotspot',
    'H5P.ImageMultipleHotspotQuestion': 'FindMultipleHotspots'
});

export function h5pExportModuleKey(mainLibrary, contentJson) {
    const lib = String(mainLibrary || '').split(' ')[0];
    if (!lib) return null;

    if (lib === 'H5P.QuestionSet') {
        const variant = detectQuestionSetVariant(contentJson || {});
        if (variant === 'H5P.QuestionSet.QCM') return 'QuizSetQCM';
        if (variant === 'H5P.QuestionSet.VF') return 'QuizSetVF';
        return 'QuizSet';
    }

    return H5P_LIBRARY_TO_MODULE_KEY[lib] || null;
}

// --- VERBATIM h5p-reader.js : detectQuestionSetVariant ---
export function detectQuestionSetVariant(content) {
    const questions = Array.isArray(content?.questions) ? content.questions : [];
    if (questions.length === 0) return 'H5P.QuestionSet';

    let sawQcm = false, sawVf = false, sawOther = false;
    for (const q of questions) {
        const lib = String(q?.library || '').split(' ')[0];
        if (!lib) continue;
        if (lib === 'H5P.MultiChoice') sawQcm = true;
        else if (lib === 'H5P.TrueFalse') sawVf = true;
        else { sawOther = true; break; }
    }
    if (sawOther) return 'H5P.QuestionSet';
    if (sawQcm && !sawVf) return 'H5P.QuestionSet.QCM';
    if (sawVf && !sawQcm) return 'H5P.QuestionSet.VF';
    return 'H5P.QuestionSet';
}

// =========================================================================
// === VERBATIM h5p-export-bridge.js : normalisation content.json → modèle ===
// =========================================================================

export function remapMediaImage(obj) {
    if (!obj || typeof obj !== 'object' || obj.mediaImage) return;
    const params = obj.media && obj.media.type && obj.media.type.params;
    const file = params && params.file;
    if (file && file.path) {
        obj.mediaImage = {
            path:   file.path,
            mime:   file.mime,
            width:  file.width,
            height: file.height
        };
        if (params.alt && !obj.mediaImageAlt) obj.mediaImageAlt = params.alt;
    }
}

export function parseHtmlTable(html) {
    if (!html || typeof html !== 'string') return null;
    const stripCell = (s) => s
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();

    const rows = [];
    const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trMatches) {
        const cells = [];
        const cellRe = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi;
        let m;
        while ((m = cellRe.exec(tr)) !== null) cells.push(stripCell(m[2]));
        if (cells.length) rows.push(cells);
    }
    if (!rows.length) return null;
    const headers = rows.shift();
    return { headers, rows };
}

export function adaptDragAndDrop(content) {
    const task = (content && content.question && content.question.task) || {};
    const nativeElements = Array.isArray(task.elements) ? task.elements : [];
    const elements = nativeElements.map((el) => {
        const type = (el && el.type) || {};
        const lib = String(type.library || '').split(' ')[0];
        const params = type.params || {};
        const out = {};
        if (lib === 'H5P.Image' && params.file && params.file.path) {
            out.image = {
                path:   params.file.path,
                mime:   params.file.mime,
                width:  params.file.width,
                height: params.file.height
            };
            out.text = params.alt || '';
        } else {
            out.text = params.text || params.alt || '';
        }
        return out;
    });

    const nativeZones = Array.isArray(task.dropZones) ? task.dropZones : [];
    const dropZones = nativeZones.map((dz) => ({
        label: (dz && dz.label) || '',
        correctElements: Array.isArray(dz && dz.correctElements)
            ? dz.correctElements.map((n) => Number(n))
            : []
    }));

    return { elements, dropZones };
}

const CP_EXERCISE_LIBS = new Set([
    'H5P.MultiChoice', 'H5P.TrueFalse', 'H5P.Blanks', 'H5P.DragText',
    'H5P.MarkTheWords', 'H5P.SingleChoiceSet', 'H5P.DragQuestion',
    'H5P.Summary', 'H5P.Dialogcards'
]);

export function adaptCoursePresentation(content) {
    const nativeSlides = content && content.presentation && content.presentation.slides;
    if (!Array.isArray(nativeSlides)) return { slides: [] };

    const slides = nativeSlides.map((slide) => {
        const out = { type: 'content', text: '' };
        const kw = Array.isArray(slide.keywords) && slide.keywords[0] && slide.keywords[0].main;
        if (kw) out.title = kw;

        const texts = [];
        const elements = Array.isArray(slide.elements) ? slide.elements : [];
        for (const elt of elements) {
            const action = (elt && elt.action) || {};
            const lib = String(action.library || '').split(' ')[0];
            const params = action.params || {};

            if (lib === 'H5P.AdvancedText') {
                // Slide de titre : le processeur émet un AdvancedText `<h2>titre</h2>[<p>sous-titre</p>]`
                // (buildTitleElement de CoursePresentation.js — seul cas où l'AdvancedText débute par <h2>).
                // On reconstruit alors la STRUCTURE du modèle source ({type:'title', subtitle}) au lieu de
                // recoller le titre dans le corps : sinon `<h2>X</h2><p>Y</p>` → cleanHtml → "XY" (titre collé).
                const titleMatch = /^\s*<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*)$/i.exec(params.text || '');
                if (titleMatch) {
                    out.type = 'title';
                    const subtitle = titleMatch[2].trim();
                    if (subtitle) out.subtitle = subtitle;
                } else if (params.text) {
                    texts.push(params.text);
                }
            } else if (lib === 'H5P.Image' && params.file && params.file.path) {
                out.slideImage = {
                    path:   params.file.path,
                    mime:   params.file.mime,
                    width:  params.file.width,
                    height: params.file.height
                };
                out.slideImageAlt = params.alt || '';
            } else if (lib === 'H5P.Table') {
                const tbl = parseHtmlTable(params.text || '');
                if (tbl && tbl.headers.length) out.table = tbl;
            } else if (CP_EXERCISE_LIBS.has(lib)) {
                const exParams = { ...params };
                remapMediaImage(exParams);
                out.exercise = { library: action.library, ...exParams };
            }
        }
        if (texts.length) out.text = texts.join('\n');
        return out;
    });

    return { slides };
}

export function adaptInteractiveBook(content) {
    const nativeChapters = content && Array.isArray(content.chapters) ? content.chapters : [];

    const chapters = nativeChapters.map((column) => {
        const out = { title: (column.metadata && column.metadata.title) || '', content: [] };
        const items = (column.params && Array.isArray(column.params.content)) ? column.params.content : [];

        for (const item of items) {
            const action = (item && item.content) || {};
            const lib = String(action.library || '').split(' ')[0];
            const params = action.params || {};

            if (lib === 'H5P.AdvancedText') {
                if (params.text) out.content.push({ type: 'text', text: params.text });
            } else if (lib === 'H5P.Table') {
                const tbl = parseHtmlTable(params.text || '');
                if (tbl && tbl.headers.length) out.content.push({ type: 'table', table: tbl });
            } else if (lib === 'H5P.Image' && params.file && params.file.path) {
                out.content.push({
                    type: 'image',
                    image: {
                        path:   params.file.path,
                        mime:   params.file.mime,
                        width:  params.file.width,
                        height: params.file.height
                    },
                    alt: params.alt || ''
                });
            } else if (CP_EXERCISE_LIBS.has(lib)) {
                const exParams = { ...params };
                remapMediaImage(exParams);
                out.content.push({ type: 'exercise', library: action.library, ...exParams });
            }
        }
        return out;
    });

    const out = { chapters };
    // Page de couverture : le processeur stocke la description (HTML enveloppé) dans
    // `content.bookCover.coverDescription` et active `showCoverPage`. Le formatter lit
    // `data.cover.description` (puis cleanHtml → l'enveloppe <p style> est neutralisée).
    const coverDescription = content && content.bookCover && content.bookCover.coverDescription;
    if (content && content.showCoverPage && coverDescription) {
        out.cover = { description: coverDescription };
    }
    return out;
}

export function adaptInteractiveVideo(content) {
    const iv = content && content.interactiveVideo;
    const native = (iv && iv.assets && Array.isArray(iv.assets.interactions)) ? iv.assets.interactions : [];
    const TYPE_BY_LIB = { 'H5P.MultiChoice': 'multichoice', 'H5P.TrueFalse': 'truefalse', 'H5P.Blanks': 'blanks' };

    const interactions = [];
    for (const item of native) {
        const action = (item && item.action) || {};
        const type = TYPE_BY_LIB[String(action.library || '').split(' ')[0]];
        if (!type) continue;
        const p = action.params || {};
        const timestamp = Math.max(0, Number(item.duration && item.duration.from) || 0);

        if (type === 'multichoice') {
            interactions.push({
                timestamp, type,
                question: p.question || '',
                answers: (Array.isArray(p.answers) ? p.answers : []).map(a => ({
                    text: (a && a.text) || '',
                    correct: !!(a && a.correct),
                    feedback: (a && a.tipsAndFeedback && a.tipsAndFeedback.chosenFeedback) || ''
                }))
            });
        } else if (type === 'truefalse') {
            const beh = p.behaviour || {};
            interactions.push({
                timestamp, type,
                question: p.question || '',
                correct: (p.correct === true || p.correct === 'true'),
                feedbackOnCorrect: beh.feedbackOnCorrect || p.feedbackOnCorrect || '',
                feedbackOnWrong: beh.feedbackOnWrong || p.feedbackOnWrong || ''
            });
        } else {
            interactions.push({
                timestamp, type,
                text: (Array.isArray(p.questions) ? p.questions : []).map(q => (typeof q === 'string' ? q : '')).join('\n')
            });
        }
    }
    interactions.sort((a, b) => a.timestamp - b.timestamp);

    const out = { interactions };
    const task = iv && iv.summary && iv.summary.task;
    const sp = task && task.params;
    if (sp && Array.isArray(sp.summaries) && sp.summaries.length) {
        out.summary = {
            intro: sp.intro || '',
            statements: sp.summaries.map(s => (Array.isArray(s && s.summary) ? s.summary.slice() : []))
        };
    }
    return out;
}

export function normalizeH5pModel(moduleKey, content, title = '') {
    const model = { ...(content || {}) };
    if (title && !model.title) model.title = title;

    switch (moduleKey) {
        case 'FillInTheBlanks':
            // H5P.Blanks nomme la consigne `text` ; le formatter n'affiche l'intro que via
            // `taskDescription` (en présence de `questions`, le champ `text` est ignoré —
            // cf. formatBlanksStatement). On remappe pour que Sucrerie rende l'intro comme
            // Caramel le fait depuis sa source (où le champ s'appelle déjà `taskDescription`).
            if (model.text && !model.taskDescription) model.taskDescription = model.text;
            remapMediaImage(model);
            break;

        case 'MultipleChoice':
        case 'TrueFalse':
        case 'MarkTheWords':
        case 'DragTheWords':
        case 'Essay':
            remapMediaImage(model);
            break;

        case 'QuizSet':
        case 'QuizSetQCM':
        case 'QuizSetVF':
            if (Array.isArray(model.questions)) {
                model.questions = model.questions.map((q) => {
                    const nq = { ...q };
                    if (nq.params) {
                        nq.params = { ...nq.params };
                        remapMediaImage(nq.params);
                    }
                    return nq;
                });
            }
            break;

        case 'DragAndDrop':
            Object.assign(model, adaptDragAndDrop(content));
            break;

        case 'CoursePresentation':
            Object.assign(model, adaptCoursePresentation(content));
            break;

        case 'InteractiveBook':
            Object.assign(model, adaptInteractiveBook(content));
            break;

        case 'InteractiveVideo':
            Object.assign(model, adaptInteractiveVideo(content));
            break;

        default:
            break;
    }

    return model;
}

export function injectGridImages(model, gridResult) {
    if (!model || !gridResult) return model;
    if (gridResult.emptyGrid) model._gridImage = gridResult.emptyGrid;
    if (gridResult.solutionGrid) model._solutionGridImage = gridResult.solutionGrid;
    if (Array.isArray(gridResult.placements) && gridResult.placements.length > 0) {
        model._cluePlacements = gridResult.placements;
    }
    if (Array.isArray(gridResult.unplacedWords) && gridResult.unplacedWords.length > 0) {
        model._unplacedWords = gridResult.unplacedWords;
    }
    return model;
}

/**
 * Enrichit le modèle Crossword/FindTheWords avec les images de grille.
 * Sucrerie importe `./renderers/{crossword,find-the-words}-grid-generator.js`,
 * BYTE-IDENTIQUES à ceux de Caramel → on importe ceux de Caramel (mêmes octets).
 * Identique des deux côtés A/B → la grille n'est PAS une variable. Tout échec
 * est avalé (dégradé gracieux, comme Sucrerie `enrichModelWithGrid`).
 */
export async function enrichModelWithGrid(moduleKey, model) {
    try {
        if (moduleKey === 'Crossword' && Array.isArray(model.words) && model.words.length > 0) {
            const { generateCrosswordGridImages } = await import('/js/renderers/crossword-grid-generator.js');
            return injectGridImages(model, await generateCrosswordGridImages(model.words, model.theme));
        }
        if (moduleKey === 'FindTheWords' && model.wordList) {
            const { generateFindTheWordsGridImages } = await import('/js/renderers/find-the-words-grid-generator.js');
            return injectGridImages(model, await generateFindTheWordsGridImages(model.wordList));
        }
    } catch (err) {
        console.warn('[parity] Génération de grille échouée, export sans image :', err);
    }
    return model;
}

// =========================================================================
// === VERBATIM mbz-parser.js : extraction MBZ + parse XML → modèle ===
// =========================================================================

export const MODULE_TO_ELEA = {
    millionnairev2: { eleaType: 'elea_millionnaire', xmlFile: 'millionnairev2.xml', editable: true  },
    simplequiz:     { eleaType: 'elea_qcm',          xmlFile: 'simplequiz.xml',     editable: true  },
    epikmatch:      { eleaType: 'elea_appariement',  xmlFile: 'epikmatch.xml',      editable: true  },
    glossary:       { eleaType: 'elea_glossaire',    xmlFile: 'glossary.xml',       editable: true  },
    assign:         { eleaType: 'elea_devoir',       xmlFile: 'assign.xml',         editable: true  },
    page:           { eleaType: 'elea_page',         xmlFile: 'page.xml',           editable: true  },
    book:           { eleaType: 'elea_livre',        xmlFile: 'book.xml',           editable: true  },
    quiz:           { eleaType: 'elea_test',         xmlFile: 'quiz.xml',           editable: true  }
};

/** Résout le moduleKey du formatter (clé `elea_*` ou 'Livre') depuis un nom de module MBZ. */
export function mbzExportModuleKey(moduleName) {
    const info = MODULE_TO_ELEA[moduleName];
    if (info && info.eleaType) return info.eleaType;
    if (moduleName === 'book') return 'Livre';
    return null;
}

// --- VERBATIM mbz-parser.js : readTar (ustar/POSIX) ---
function readTar(uint8) {
    const files = {};
    const decoder = new TextDecoder('utf-8');
    let offset = 0;
    while (offset + 512 <= uint8.length) {
        const header = uint8.subarray(offset, offset + 512);
        if (header.every(b => b === 0)) { offset += 512; continue; }
        const name = decoder.decode(header.subarray(0, 100)).replace(/\0.*$/, '');
        const sizeStr = decoder.decode(header.subarray(124, 136)).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;
        const typeflag = String.fromCharCode(header[156]);
        const magic = decoder.decode(header.subarray(257, 263));
        let fullName = name;
        if (magic.startsWith('ustar')) {
            const prefix = decoder.decode(header.subarray(345, 500)).replace(/\0.*$/, '');
            if (prefix) fullName = prefix + '/' + name;
        }
        offset += 512;
        if (typeflag === '0' || typeflag === '' || typeflag === '\0') {
            if (fullName) files[fullName] = size > 0 ? uint8.subarray(offset, offset + size) : new Uint8Array(0);
        }
        offset += Math.ceil(size / 512) * 512;
    }
    return files;
}

/**
 * VERBATIM mbz-parser.js `extractMbz` — hors gardes de sécurité
 * (assertDecompressedSizeSafe/assertEntryPathsSafe : GARDES anti-DoS, pas une
 * transformation de modèle — leur retrait ne change PAS le modèle produit).
 * Suppose `window.fflate` déjà chargé (préchargé par le harnais via lib-loader).
 */
export async function extractMbzModule(buffer) {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const tarData = (uint8[0] === 0x1f && uint8[1] === 0x8b)
        ? window.fflate.gunzipSync(uint8)
        : uint8;
    const files = readTar(tarData);
    const paths = Object.keys(files);

    let moduleName = null, moduleId = null, activityDir = null;
    for (const p of paths) {
        const m = p.match(/^activities\/([a-z0-9]+)_(\d+)\//);
        if (m) { moduleName = m[1]; moduleId = m[2]; activityDir = `activities/${m[1]}_${m[2]}`; break; }
    }
    if (!moduleName) throw new Error('mbz_no_activity_folder');

    const info = MODULE_TO_ELEA[moduleName];
    if (!info) throw new Error(`mbz_unknown_module:${moduleName}`);

    const xmlPath = `${activityDir}/${info.xmlFile}`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`mbz_missing_xml:${xmlPath}`);
    const xml = new TextDecoder('utf-8').decode(xmlBytes);

    return { files, moduleName, moduleId, activityDir, xmlPath, xml, info };
}

// --- VERBATIM mbz-parser.js : helpers XML ---
function parseXml(str) {
    const doc = new DOMParser().parseFromString(str, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('mbz_xml_invalid:' + err.textContent.slice(0, 120));
    return doc;
}
const tagText = (doc, sel) => doc.querySelector(sel)?.textContent ?? '';

function stripParagraphWrap(html) {
    if (!html) return '';
    const m = html.match(/^\s*<p[^>]*>([\s\S]*?)<\/p>\s*$/i);
    if (m && !/<\/p>|<p[\s>]/i.test(m[1])) return m[1];
    return html;
}

// --- VERBATIM mbz-parser.js : parseQuestionContent ---
function parseQuestionContent(q, type) {
    const txt = (sel) => q.querySelector(sel)?.textContent ?? '';
    const name = q.querySelector(':scope > name > text')?.textContent ?? '';
    const questiontext = stripParagraphWrap(q.querySelector(':scope > questiontext > text')?.textContent ?? '');
    const feedback = stripParagraphWrap(q.querySelector(':scope > generalfeedback > text')?.textContent ?? '');
    const hints = Array.from(q.querySelectorAll(':scope > hint > text')).map(h => stripParagraphWrap(h.textContent ?? ''));

    switch (type) {
        case 'multichoice': {
            const single = (q.querySelector(':scope > single')?.textContent ?? 'true').trim();
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     stripParagraphWrap(a.querySelector('text')?.textContent ?? ''),
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, single, answers, feedback, hints,
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'matching': {
            const subquestions = Array.from(q.querySelectorAll(':scope > subquestion')).map(sq => ({
                text:   stripParagraphWrap(sq.querySelector('text')?.textContent ?? ''),
                answer: stripParagraphWrap(sq.querySelector('answer > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, subquestions, feedback, hints,
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'truefalse': {
            const answers = Array.from(q.querySelectorAll(':scope > answer'));
            const trueAns  = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'true');
            const falseAns = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'false');
            return {
                name, questiontext,
                answer: {
                    value:          parseFloat(trueAns?.getAttribute('fraction') || '0') > 0,
                    feedback_true:  stripParagraphWrap(trueAns?.querySelector('feedback > text')?.textContent ?? ''),
                    feedback_false: stripParagraphWrap(falseAns?.querySelector('feedback > text')?.textContent ?? '')
                },
                feedback, hints
            };
        }
        case 'numerical': {
            const a = q.querySelector(':scope > answer');
            return {
                name, questiontext,
                answer: {
                    number:    parseFloat(a?.querySelector('text')?.textContent ?? '0'),
                    tolerance: parseFloat(a?.querySelector('tolerance')?.textContent ?? '0'),
                    feedback:  stripParagraphWrap(a?.querySelector('feedback > text')?.textContent ?? '')
                },
                feedback, hints
            };
        }
        case 'shortanswer': {
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     stripParagraphWrap(a.querySelector('text')?.textContent ?? ''),
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return { name, questiontext, answers, feedback, hints, usecase: parseInt(txt(':scope > usecase') || '0', 10) };
        }
        case 'cloze': {
            return { name, questiontext, feedback, hints };
        }
        default:
            return null;
    }
}

// --- VERBATIM mbz-parser.js : PARSERS (XML → JSON éditeur) ---
const PARSERS = {
    millionnairev2(xml) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'millionnairev2 > name');
        const questions = JSON.parse(tagText(doc, 'millionnairev2 > questions') || '[]').map(q => ({
            ...q,
            question: stripParagraphWrap(q.question || ''),
            goodanswer: stripParagraphWrap(q.goodanswer || ''),
            badanswer: Array.isArray(q.badanswer) ? q.badanswer.map(b => stripParagraphWrap(b || '')) : q.badanswer
        }));
        return { title, questions };
    },
    simplequiz(xml) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'simplequiz > name');
        const questions = JSON.parse(tagText(doc, 'simplequiz > questions') || '[]').map(q => ({
            ...q,
            text: stripParagraphWrap(q.text || ''),
            answers: Array.isArray(q.answers)
                ? q.answers.map(a => ({ ...a, text: stripParagraphWrap(a.text || '') }))
                : q.answers
        }));
        return { title, questions };
    },
    epikmatch(xml) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'epikmatch > name');
        const intro = stripParagraphWrap(tagText(doc, 'epikmatch > intro'));
        const raw = JSON.parse(tagText(doc, 'epikmatch > associations') || '{}');
        let pairs = [];
        if (Array.isArray(raw)) {
            pairs = raw.map(p => ({
                question: stripParagraphWrap((p && p.question) || ''),
                answer: stripParagraphWrap((p && p.answer != null) ? p.answer : '')
            }));
        } else if (raw && typeof raw === 'object' && raw.questions) {
            const q = raw.questions || {}, r = raw.responses || {};
            pairs = Object.keys(q)
                .sort((a, b) => Number(a) - Number(b))
                .map(k => ({ question: stripParagraphWrap(q[k] || ''), answer: stripParagraphWrap(r[k] != null ? r[k] : '') }));
        }
        return { title, intro, pairs };
    },
    glossary(xml) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'glossary > name');
        const entries = Array.from(doc.querySelectorAll('glossary > entries > entry')).map(e => ({
            concept:    stripParagraphWrap(e.querySelector('concept')?.textContent ?? ''),
            definition: stripParagraphWrap(e.querySelector('definition')?.textContent ?? '')
        }));
        return { title, entries };
    },
    assign(xml, allFiles, activityDir) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'assign > name');
        const description = stripParagraphWrap(tagText(doc, 'assign > intro'));

        const gradingPath = `${activityDir}/grading.xml`;
        const gradingBytes = allFiles?.[gradingPath];
        const criteria = [];
        if (gradingBytes) {
            const gradingXml = new TextDecoder('utf-8').decode(gradingBytes);
            const gdoc = parseXml(gradingXml);
            for (const cr of gdoc.querySelectorAll('criterion')) {
                const description = stripParagraphWrap(cr.querySelector('description')?.textContent ?? '');
                const levels = Array.from(cr.querySelectorAll('level')).map(lv => ({
                    score:      parseFloat(lv.querySelector('score')?.textContent ?? '0'),
                    definition: stripParagraphWrap(lv.querySelector('definition')?.textContent ?? '')
                }));
                criteria.push({ description, levels });
            }
        }
        return { title, description, criteria };
    },
    page(xml) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'page > name');
        const intro = stripParagraphWrap(tagText(doc, 'page > intro'));
        const html  = tagText(doc, 'page > content');
        const parsed = parseHtmlIntoBlocks(html);
        if (parsed) {
            const out = { title, theme: parsed.theme, blocks: parsed.blocks };
            if (intro) out.intro = intro;
            return out;
        }
        const fallback = { title, blocks: [{ type: 'html', html }] };
        if (intro) fallback.intro = intro;
        return fallback;
    },
    book(xml) {
        const doc = parseXml(xml);
        let detectedTheme = null;
        const chapters = Array.from(doc.querySelectorAll('book > chapters > chapter')).map((c) => {
            const chTitle    = c.querySelector('title')?.textContent ?? '';
            const subchapter = c.querySelector('subchapter')?.textContent === '1';
            const html       = c.querySelector('content')?.textContent ?? '';
            const parsed = parseHtmlIntoBlocks(html);
            if (parsed) {
                if (!detectedTheme) detectedTheme = parsed.theme;
                return { title: chTitle, subchapter, blocks: parsed.blocks };
            }
            return { title: chTitle, subchapter, blocks: [{ type: 'html', html }] };
        });
        const out = { title: tagText(doc, 'book > name'), chapters };
        const intro = stripParagraphWrap(tagText(doc, 'book > intro'));
        if (intro) out.intro = intro;
        const numbering = parseInt(tagText(doc, 'book > numbering'), 10);
        if (Number.isFinite(numbering)) out.numbering = numbering;
        if (detectedTheme) out.theme = detectedTheme;
        return out;
    },
    quiz(xml, allFiles) {
        const doc = parseXml(xml);
        const title = tagText(doc, 'quiz > name');

        const qBytes = allFiles?.['questions.xml'];
        if (!qBytes) return { bank_name: title, bank_description: '', options: {}, questions: [] };

        const qDoc = parseXml(new TextDecoder('utf-8').decode(qBytes));
        const questions = [];
        let bank_name = title, bank_description = '';

        for (const q of qDoc.querySelectorAll('question')) {
            const type = q.getAttribute('type');
            if (type === 'category') {
                const cat = q.querySelector('category > text')?.textContent ?? '';
                bank_name = cat.split('/').pop() || title;
                bank_description = q.querySelector('info > text')?.textContent ?? '';
                continue;
            }
            const content = parseQuestionContent(q, type);
            if (content) questions.push({ type, content });
        }
        return { bank_name, bank_description, options: {}, questions };
    }
};

// --- VERBATIM mbz-parser.js : parseActivity + parseStandaloneXml ---
export function parseActivity(moduleName, xml, allFiles, activityDir) {
    const fn = PARSERS[moduleName];
    if (!fn) throw new Error(`mbz_parser_missing:${moduleName}`);
    return fn(xml, allFiles, activityDir);
}

export function parseStandaloneXml(xmlText) {
    const doc = parseXml(xmlText);
    const root = doc && doc.documentElement;
    if (!root) throw new Error('xml_standalone_invalid');
    const tag = root.tagName;

    if (tag === 'quiz') {
        let bank_name = '', bank_description = '';
        const questions = [];
        for (const q of root.querySelectorAll(':scope > question')) {
            const type = q.getAttribute('type');
            if (type === 'category') {
                const cat = q.querySelector('category > text')?.textContent ?? '';
                bank_name = cat.split('/').pop() || '';
                bank_description = q.querySelector('info > text')?.textContent ?? '';
                continue;
            }
            const content = parseQuestionContent(q, type);
            if (content) questions.push({ type, content });
        }
        return { moduleName: 'quiz', data: { bank_name, bank_description, options: {}, questions } };
    }

    if (tag === 'GLOSSARY') {
        const name = root.querySelector('INFO > NAME')?.textContent ?? '';
        const entries = Array.from(root.querySelectorAll('INFO > ENTRIES > ENTRY')).map(e => ({
            concept:    e.querySelector('CONCEPT')?.textContent ?? '',
            definition: e.querySelector('DEFINITION')?.textContent ?? '',
            aliases: Array.from(e.querySelectorAll('ALIASES > ALIAS > NAME'))
                .map(n => n.textContent ?? '').filter(s => s.length > 0)
        }));
        return { moduleName: 'glossary', data: { name, entries } };
    }

    throw new Error('xml_standalone_unknown_root:' + tag);
}
