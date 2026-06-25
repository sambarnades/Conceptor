#!/usr/bin/env node
/**
 * Ajoute toutes les clés i18n du Livre interactif (InteractiveBook) dans les 11 locales.
 *
 * Sources de traduction :
 * - Clés player (h5p_ib_*)  : traductions OFFICIELLES de la lib vendor
 *   (js/vendor/h5p-libs/H5P.InteractiveBook-1.11/language/<lang>.json),
 *   défauts semantics.json pour `en`, traductions rédigées pour `fr` (ton Caramel) et `jp` (absent de la lib).
 * - Prompts IA : en-têtes spécifiques IB rédigés par langue + section « exercices »
 *   EXTRAITE du prompt CoursePresentation déjà traduit de chaque locale (réutilisation).
 * - Autres clés (éditeur, validation, doc_fmt, eh_ib, tuto) : rédigées par langue.
 *
 * Usage : node scripts/add-interactive-book-locales.mjs
 * Idempotent : si la clé existe déjà, elle est écrasée par la valeur du script.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'js', 'locales');
const LIB_DIR = join(__dirname, '..', 'js', 'vendor', 'h5p-libs', 'H5P.InteractiveBook-1.11');

const LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

// =====================================================================
// 1. CLÉS PLAYER h5p_ib_* — depuis la lib vendor (officiel)
// =====================================================================

// semantics name → clé locale Caramel
const PLAYER_KEY_MAP = {
    read: 'h5p_ib_read',
    displayTOC: 'h5p_ib_display_toc',
    hideTOC: 'h5p_ib_hide_toc',
    nextPage: 'h5p_ib_next_page',
    previousPage: 'h5p_ib_previous_page',
    chapterCompleted: 'h5p_ib_chapter_completed',
    partCompleted: 'h5p_ib_part_completed',
    incompleteChapter: 'h5p_ib_incomplete_chapter',
    navigateToTop: 'h5p_ib_navigate_top',
    markAsFinished: 'h5p_ib_mark_finished',
    fullscreen: 'h5p_ib_fullscreen',
    exitFullscreen: 'h5p_ib_exit_fullscreen',
    bookProgressSubtext: 'h5p_ib_book_progress_subtext',
    interactionsProgressSubtext: 'h5p_ib_interactions_progress_subtext',
    submitReport: 'h5p_ib_submit_report',
    restartLabel: 'h5p_ib_restart',
    summaryHeader: 'h5p_ib_summary_header',
    allInteractions: 'h5p_ib_all_interactions',
    unansweredInteractions: 'h5p_ib_unanswered',
    scoreText: 'h5p_ib_score_text',
    leftOutOfTotalCompleted: 'h5p_ib_left_of_total',
    noInteractions: 'h5p_ib_no_interactions',
    score: 'h5p_ib_score',
    summaryAndSubmit: 'h5p_ib_summary_and_submit',
    noChapterInteractionBoldText: 'h5p_ib_no_chapter_bold',
    noChapterInteractionText: 'h5p_ib_no_chapter_text',
    yourAnswersAreSubmittedForReview: 'h5p_ib_answers_submitted',
    bookProgress: 'h5p_ib_book_progress',
    interactionsProgress: 'h5p_ib_interactions_progress',
    totalScoreLabel: 'h5p_ib_total_score',
};

// Correspondance locale Caramel → fichier language de la lib
const LIB_LANG_FILE = {
    es: 'es', de: 'de', it: 'it', nl: 'nl', pt: 'pt', ar: 'ar', zh: 'zh-cn', el: 'el',
};

// fr : wording Caramel (cohérent avec le ton du site, cf. PRD §7.3)
const FR_PLAYER = {
    h5p_ib_read: 'Lire',
    h5p_ib_display_toc: 'Afficher la table des matières',
    h5p_ib_hide_toc: 'Masquer la table des matières',
    h5p_ib_next_page: 'Page suivante',
    h5p_ib_previous_page: 'Page précédente',
    h5p_ib_chapter_completed: 'Page terminée !',
    h5p_ib_part_completed: '@pages sur @total terminées',
    h5p_ib_incomplete_chapter: 'Page incomplète',
    h5p_ib_navigate_top: 'Aller en haut',
    h5p_ib_mark_finished: "J'ai terminé cette page",
    h5p_ib_fullscreen: 'Plein écran',
    h5p_ib_exit_fullscreen: 'Quitter le plein écran',
    h5p_ib_book_progress_subtext: '@count sur @total pages',
    h5p_ib_interactions_progress_subtext: '@count sur @total interactions',
    h5p_ib_submit_report: 'Soumettre le rapport',
    h5p_ib_restart: 'Recommencer',
    h5p_ib_summary_header: 'Résumé',
    h5p_ib_all_interactions: 'Toutes les interactions',
    h5p_ib_unanswered: 'Interactions sans réponse',
    h5p_ib_score_text: '@score / @maxscore',
    h5p_ib_left_of_total: '@left sur @max interactions terminées',
    h5p_ib_no_interactions: 'Aucune interaction',
    h5p_ib_score: 'Score',
    h5p_ib_summary_and_submit: 'Résumé & envoi',
    h5p_ib_no_chapter_bold: "Vous n'avez interagi avec aucune page.",
    h5p_ib_no_chapter_text: 'Vous devez interagir avec au moins une page avant de voir le résumé.',
    h5p_ib_answers_submitted: 'Vos réponses ont été soumises pour évaluation !',
    h5p_ib_book_progress: 'Progression du livre',
    h5p_ib_interactions_progress: 'Progression des interactions',
    h5p_ib_total_score: 'Score total',
    h5p_ib_a11y_progress: 'Page @page sur @total.',
    h5p_ib_a11y_menu: 'Afficher/masquer le menu de navigation',
};

// jp : absent de la lib → rédigé
const JP_PLAYER = {
    h5p_ib_read: '読む',
    h5p_ib_display_toc: '目次を表示',
    h5p_ib_hide_toc: '目次を非表示',
    h5p_ib_next_page: '次のページ',
    h5p_ib_previous_page: '前のページ',
    h5p_ib_chapter_completed: 'ページ完了！',
    h5p_ib_part_completed: '@total ページ中 @pages ページ完了',
    h5p_ib_incomplete_chapter: '未完了のページ',
    h5p_ib_navigate_top: '先頭へ移動',
    h5p_ib_mark_finished: 'このページを読み終えました',
    h5p_ib_fullscreen: '全画面表示',
    h5p_ib_exit_fullscreen: '全画面表示を終了',
    h5p_ib_book_progress_subtext: '@total ページ中 @count ページ',
    h5p_ib_interactions_progress_subtext: '@total 件中 @count 件',
    h5p_ib_submit_report: 'レポートを送信',
    h5p_ib_restart: 'やり直す',
    h5p_ib_summary_header: 'まとめ',
    h5p_ib_all_interactions: 'すべての練習',
    h5p_ib_unanswered: '未回答の練習',
    h5p_ib_score_text: '@score / @maxscore',
    h5p_ib_left_of_total: '@max 件中 @left 件完了',
    h5p_ib_no_interactions: '練習はありません',
    h5p_ib_score: 'スコア',
    h5p_ib_summary_and_submit: 'まとめと送信',
    h5p_ib_no_chapter_bold: 'まだどのページにも取り組んでいません。',
    h5p_ib_no_chapter_text: 'まとめを見るには、少なくとも1つのページに取り組んでください。',
    h5p_ib_answers_submitted: '回答が評価のために送信されました！',
    h5p_ib_book_progress: '読書の進捗',
    h5p_ib_interactions_progress: '練習の進捗',
    h5p_ib_total_score: '合計スコア',
    h5p_ib_a11y_progress: '@total ページ中 @page ページ目。',
    h5p_ib_a11y_menu: 'ナビゲーションメニューの表示/非表示',
};

/** Construit les clés player pour une langue à partir de la lib vendor. */
function buildPlayerKeys(lang, semantics, semanticsByName) {
    if (lang === 'fr') return { ...FR_PLAYER };
    if (lang === 'jp') return { ...JP_PLAYER };

    // en : défauts du semantics.json (anglais)
    let source = semantics;
    if (lang !== 'en') {
        const file = LIB_LANG_FILE[lang];
        const langData = JSON.parse(readFileSync(join(LIB_DIR, 'language', `${file}.json`), 'utf8'));
        source = langData.semantics;
        if (source.length !== semantics.length) {
            throw new Error(`language/${file}.json désaligné avec semantics.json (${source.length} vs ${semantics.length})`);
        }
    }

    const keys = {};
    for (const [semName, localeKey] of Object.entries(PLAYER_KEY_MAP)) {
        const idx = semanticsByName[semName];
        const value = source[idx]?.default ?? semantics[idx]?.default;
        if (typeof value !== 'string') throw new Error(`${lang}: défaut manquant pour ${semName}`);
        keys[localeKey] = value;
    }
    // a11y (groupe imbriqué : progress, menu)
    const a11yIdx = semanticsByName['a11y'];
    const a11ySrc = source[a11yIdx]?.fields || [];
    const a11yEn = semantics[a11yIdx]?.fields || [];
    keys['h5p_ib_a11y_progress'] = a11ySrc[0]?.default ?? a11yEn[0]?.default;
    keys['h5p_ib_a11y_menu'] = a11ySrc[1]?.default ?? a11yEn[1]?.default;
    return keys;
}

// =====================================================================
// 2. CLÉS COURTES PAR LANGUE (identité, éditeur, validation, doc_fmt, eh_ib, tuto)
// =====================================================================

const T = {
    fr: {
        name: 'Livre interactif',
        description: 'Créez un livre numérique multi-chapitres : chaque page mêle textes, tableaux, images et exercices (QCM, vrai/faux, texte à trous…), avec table des matières et page de résumé.',
        editor: {
            editor_ib_cover: 'Page de couverture',
            editor_ib_cover_desc: 'Texte de la couverture',
            editor_ib_cover_hint: "Texte d'accueil affiché avant le premier chapitre (optionnel).",
            editor_ib_section_chapters: 'Chapitres',
            editor_ib_chapter: 'Chapitre',
            editor_ib_add_chapter: 'Ajouter un chapitre',
            editor_ib_chapter_title: 'Titre du chapitre',
            editor_ib_chapter_title_hint: 'Affiché dans la table des matières.',
            editor_ib_blocks: 'Blocs du chapitre',
            editor_ib_block: 'Bloc',
            editor_ib_add_block: 'Ajouter un bloc',
            editor_ib_block_type: 'Type de bloc',
            editor_ib_block_text: 'Texte',
            editor_ib_block_table: 'Tableau',
            editor_ib_block_image: 'Image',
            editor_ib_block_exercise: 'Exercice',
            editor_ib_text: 'Contenu textuel',
            editor_ib_section_options: 'Options du livre',
            editor_ib_base_color: 'Couleur principale',
            editor_ib_toc: 'Afficher la table des matières',
            editor_ib_summary: 'Afficher la page de résumé',
        },
        validation: {
            validation_ib_min_chapters: 'Le livre doit contenir au moins 2 chapitres',
            validation_ib_no_chapter_title: 'Le titre du chapitre est requis',
            validation_ib_empty_chapter: 'Le chapitre doit contenir au moins un bloc',
            validation_ib_no_exercise_lib: "Le type d'exercice est requis pour ce bloc",
        },
        docFmt: {
            doc_fmt_ib_title: 'Livre interactif',
            doc_fmt_ib_instructions: '📝 Parcourez les chapitres et répondez aux exercices intégrés.',
            doc_fmt_ib_chapter: 'Chapitre',
            doc_fmt_ib_exercise: 'Exercice',
        },
        eh: {
            eh_ib_desc: 'Livre numérique multi-chapitres avec table des matières. Chaque chapitre est une page qui empile librement textes, tableaux, images et exercices interactifs. Une page de résumé agrège les scores. Idéal pour une séquence pédagogique complète.',
            eh_ib_section_chapters: 'Chapitres et blocs',
            eh_ib_chapters_intro: 'Chaque chapitre est une page du livre composée de blocs empilés verticalement :',
            eh_ib_block_text: "Paragraphe de cours : explications, définitions et notions clés. Accepte le gras, l'italique et les formules LaTeX.",
            eh_ib_block_table: 'Tableau de données avec en-têtes et lignes, six styles visuels au choix.',
            eh_ib_block_image: "Image ajoutée depuis votre ordinateur, avec texte alternatif pour l'accessibilité.",
            eh_ib_block_exercise: 'Exercice interactif parmi les 9 types ci-dessous, intégré dans la page.',
            eh_ib_section_exercises: "Types d'exercices disponibles",
            eh_ib_exercises_intro: 'Chaque bloc exercice contient un exercice interactif parmi les suivants :',
            eh_ib_rule_structure: 'Organisez les chapitres dans un ordre pédagogique : introduction → développement → vérification → <strong>synthèse finale</strong>.',
            eh_ib_rule_variety: "Alternez blocs de contenu et exercices <strong>au sein d'un même chapitre</strong> — c'est la force du livre interactif.",
            eh_ib_rule_titles: 'Les titres de chapitres forment la <strong>table des matières</strong> : gardez-les courts et explicites.',
            eh_ib_section_options: 'Options du livre',
            eh_ib_opt_cover: "Page d'accueil affichée avant le premier chapitre, avec un texte de présentation.",
            eh_ib_opt_toc: 'Affiche le panneau latéral de navigation avec la liste des chapitres.',
            eh_ib_opt_summary: 'Ajoute une page finale qui récapitule les scores de tous les exercices du livre.',
            eh_ib_opt_base_color: "Couleur principale de l'interface du livre (barre de progression, menu).",
            eh_ib_good_example: "Un livre de 4 chapitres : couverture → introduction (texte + tableau + QCM) → notions (texte + 2 exercices) → synthèse (résumé). L'élève alterne lecture et vérification à chaque page.<br>",
            eh_ib_bad_example: "Un seul chapitre interminable avec 10 blocs, ou des chapitres sans aucun exercice — l'élève perd le fil et la page de résumé reste vide.<br>",
        },
        tutoLi: '<li><strong>Livre interactif :</strong> Créez un livre multi-chapitres où chaque page mêle textes, tableaux, images et exercices, avec table des matières et résumé.</li>',
    },

    en: {
        name: 'Interactive Book',
        description: 'Create a multi-chapter digital book: each page combines texts, tables, images and exercises (MCQ, true/false, fill in the blanks…), with a table of contents and a summary page.',
        editor: {
            editor_ib_cover: 'Cover page',
            editor_ib_cover_desc: 'Cover text',
            editor_ib_cover_hint: 'Welcome text shown before the first chapter (optional).',
            editor_ib_section_chapters: 'Chapters',
            editor_ib_chapter: 'Chapter',
            editor_ib_add_chapter: 'Add a chapter',
            editor_ib_chapter_title: 'Chapter title',
            editor_ib_chapter_title_hint: 'Shown in the table of contents.',
            editor_ib_blocks: 'Chapter blocks',
            editor_ib_block: 'Block',
            editor_ib_add_block: 'Add a block',
            editor_ib_block_type: 'Block type',
            editor_ib_block_text: 'Text',
            editor_ib_block_table: 'Table',
            editor_ib_block_image: 'Image',
            editor_ib_block_exercise: 'Exercise',
            editor_ib_text: 'Text content',
            editor_ib_section_options: 'Book options',
            editor_ib_base_color: 'Main color',
            editor_ib_toc: 'Show the table of contents',
            editor_ib_summary: 'Show the summary page',
        },
        validation: {
            validation_ib_min_chapters: 'The book must contain at least 2 chapters',
            validation_ib_no_chapter_title: 'The chapter title is required',
            validation_ib_empty_chapter: 'The chapter must contain at least one block',
            validation_ib_no_exercise_lib: 'The exercise type is required for this block',
        },
        docFmt: {
            doc_fmt_ib_title: 'Interactive book',
            doc_fmt_ib_instructions: '📝 Read through the chapters and answer the embedded exercises.',
            doc_fmt_ib_chapter: 'Chapter',
            doc_fmt_ib_exercise: 'Exercise',
        },
        eh: {
            eh_ib_desc: 'Multi-chapter digital book with a table of contents. Each chapter is a page that freely stacks texts, tables, images and interactive exercises. A summary page aggregates the scores. Ideal for a complete teaching sequence.',
            eh_ib_section_chapters: 'Chapters and blocks',
            eh_ib_chapters_intro: 'Each chapter is a book page made of vertically stacked blocks:',
            eh_ib_block_text: 'Course paragraph: explanations, definitions and key concepts. Supports bold, italics and LaTeX formulas.',
            eh_ib_block_table: 'Data table with headers and rows, six visual styles to choose from.',
            eh_ib_block_image: 'Image added from your computer, with alt text for accessibility.',
            eh_ib_block_exercise: 'Interactive exercise among the 9 types below, embedded in the page.',
            eh_ib_section_exercises: 'Available exercise types',
            eh_ib_exercises_intro: 'Each exercise block contains one interactive exercise among the following:',
            eh_ib_rule_structure: 'Organise the chapters in a pedagogical order: introduction → development → assessment → <strong>final summary</strong>.',
            eh_ib_rule_variety: 'Alternate content blocks and exercises <strong>within the same chapter</strong> — that is the strength of the interactive book.',
            eh_ib_rule_titles: 'Chapter titles form the <strong>table of contents</strong>: keep them short and explicit.',
            eh_ib_section_options: 'Book options',
            eh_ib_opt_cover: 'Welcome page shown before the first chapter, with an introduction text.',
            eh_ib_opt_toc: 'Shows the side navigation panel with the list of chapters.',
            eh_ib_opt_summary: 'Adds a final page that sums up the scores of all the exercises in the book.',
            eh_ib_opt_base_color: 'Main color of the book interface (progress bar, menu).',
            eh_ib_good_example: 'A 4-chapter book: cover → introduction (text + table + MCQ) → concepts (text + 2 exercises) → summary (recap). The learner alternates reading and self-assessment on every page.<br>',
            eh_ib_bad_example: 'A single endless chapter with 10 blocks, or chapters without any exercise — the learner loses track and the summary page stays empty.<br>',
        },
        tutoLi: '<li><strong>Interactive Book:</strong> Create a multi-chapter book where each page combines texts, tables, images and exercises, with a table of contents and a summary.</li>',
    },

    es: {
        name: 'Libro interactivo',
        description: 'Cree un libro digital de varios capítulos: cada página combina textos, tablas, imágenes y ejercicios (opción múltiple, verdadero/falso, completar huecos…), con índice y página de resumen.',
        editor: {
            editor_ib_cover: 'Portada',
            editor_ib_cover_desc: 'Texto de la portada',
            editor_ib_cover_hint: 'Texto de bienvenida mostrado antes del primer capítulo (opcional).',
            editor_ib_section_chapters: 'Capítulos',
            editor_ib_chapter: 'Capítulo',
            editor_ib_add_chapter: 'Añadir un capítulo',
            editor_ib_chapter_title: 'Título del capítulo',
            editor_ib_chapter_title_hint: 'Se muestra en el índice.',
            editor_ib_blocks: 'Bloques del capítulo',
            editor_ib_block: 'Bloque',
            editor_ib_add_block: 'Añadir un bloque',
            editor_ib_block_type: 'Tipo de bloque',
            editor_ib_block_text: 'Texto',
            editor_ib_block_table: 'Tabla',
            editor_ib_block_image: 'Imagen',
            editor_ib_block_exercise: 'Ejercicio',
            editor_ib_text: 'Contenido de texto',
            editor_ib_section_options: 'Opciones del libro',
            editor_ib_base_color: 'Color principal',
            editor_ib_toc: 'Mostrar el índice',
            editor_ib_summary: 'Mostrar la página de resumen',
        },
        validation: {
            validation_ib_min_chapters: 'El libro debe contener al menos 2 capítulos',
            validation_ib_no_chapter_title: 'El título del capítulo es obligatorio',
            validation_ib_empty_chapter: 'El capítulo debe contener al menos un bloque',
            validation_ib_no_exercise_lib: 'El tipo de ejercicio es obligatorio para este bloque',
        },
        docFmt: {
            doc_fmt_ib_title: 'Libro interactivo',
            doc_fmt_ib_instructions: '📝 Recorra los capítulos y responda a los ejercicios integrados.',
            doc_fmt_ib_chapter: 'Capítulo',
            doc_fmt_ib_exercise: 'Ejercicio',
        },
        eh: {
            eh_ib_desc: 'Libro digital de varios capítulos con índice. Cada capítulo es una página que apila libremente textos, tablas, imágenes y ejercicios interactivos. Una página de resumen suma las puntuaciones. Ideal para una secuencia pedagógica completa.',
            eh_ib_section_chapters: 'Capítulos y bloques',
            eh_ib_chapters_intro: 'Cada capítulo es una página del libro compuesta por bloques apilados verticalmente:',
            eh_ib_block_text: 'Párrafo de curso: explicaciones, definiciones y conceptos clave. Admite negrita, cursiva y fórmulas LaTeX.',
            eh_ib_block_table: 'Tabla de datos con encabezados y filas, seis estilos visuales a elegir.',
            eh_ib_block_image: 'Imagen añadida desde su ordenador, con texto alternativo para la accesibilidad.',
            eh_ib_block_exercise: 'Ejercicio interactivo entre los 9 tipos siguientes, integrado en la página.',
            eh_ib_section_exercises: 'Tipos de ejercicios disponibles',
            eh_ib_exercises_intro: 'Cada bloque de ejercicio contiene un ejercicio interactivo entre los siguientes:',
            eh_ib_rule_structure: 'Organice los capítulos en un orden pedagógico: introducción → desarrollo → verificación → <strong>síntesis final</strong>.',
            eh_ib_rule_variety: 'Alterne bloques de contenido y ejercicios <strong>dentro del mismo capítulo</strong>: esa es la fuerza del libro interactivo.',
            eh_ib_rule_titles: 'Los títulos de los capítulos forman el <strong>índice</strong>: manténgalos cortos y explícitos.',
            eh_ib_section_options: 'Opciones del libro',
            eh_ib_opt_cover: 'Página de bienvenida mostrada antes del primer capítulo, con un texto de presentación.',
            eh_ib_opt_toc: 'Muestra el panel lateral de navegación con la lista de capítulos.',
            eh_ib_opt_summary: 'Añade una página final que recapitula las puntuaciones de todos los ejercicios del libro.',
            eh_ib_opt_base_color: 'Color principal de la interfaz del libro (barra de progreso, menú).',
            eh_ib_good_example: 'Un libro de 4 capítulos: portada → introducción (texto + tabla + opción múltiple) → conceptos (texto + 2 ejercicios) → síntesis (resumen). El alumno alterna lectura y verificación en cada página.<br>',
            eh_ib_bad_example: 'Un único capítulo interminable con 10 bloques, o capítulos sin ningún ejercicio: el alumno pierde el hilo y la página de resumen queda vacía.<br>',
        },
        tutoLi: '<li><strong>Libro interactivo:</strong> Cree un libro de varios capítulos donde cada página combina textos, tablas, imágenes y ejercicios, con índice y resumen.</li>',
    },

    de: {
        name: 'Interaktives Buch',
        description: 'Erstellen Sie ein digitales Buch mit mehreren Kapiteln: Jede Seite kombiniert Texte, Tabellen, Bilder und Übungen (Multiple-Choice, Wahr/Falsch, Lückentext…), mit Inhaltsverzeichnis und Zusammenfassungsseite.',
        editor: {
            editor_ib_cover: 'Titelseite',
            editor_ib_cover_desc: 'Text der Titelseite',
            editor_ib_cover_hint: 'Begrüßungstext vor dem ersten Kapitel (optional).',
            editor_ib_section_chapters: 'Kapitel',
            editor_ib_chapter: 'Kapitel',
            editor_ib_add_chapter: 'Kapitel hinzufügen',
            editor_ib_chapter_title: 'Kapiteltitel',
            editor_ib_chapter_title_hint: 'Wird im Inhaltsverzeichnis angezeigt.',
            editor_ib_blocks: 'Blöcke des Kapitels',
            editor_ib_block: 'Block',
            editor_ib_add_block: 'Block hinzufügen',
            editor_ib_block_type: 'Blocktyp',
            editor_ib_block_text: 'Text',
            editor_ib_block_table: 'Tabelle',
            editor_ib_block_image: 'Bild',
            editor_ib_block_exercise: 'Übung',
            editor_ib_text: 'Textinhalt',
            editor_ib_section_options: 'Buchoptionen',
            editor_ib_base_color: 'Hauptfarbe',
            editor_ib_toc: 'Inhaltsverzeichnis anzeigen',
            editor_ib_summary: 'Zusammenfassungsseite anzeigen',
        },
        validation: {
            validation_ib_min_chapters: 'Das Buch muss mindestens 2 Kapitel enthalten',
            validation_ib_no_chapter_title: 'Der Kapiteltitel ist erforderlich',
            validation_ib_empty_chapter: 'Das Kapitel muss mindestens einen Block enthalten',
            validation_ib_no_exercise_lib: 'Der Übungstyp ist für diesen Block erforderlich',
        },
        docFmt: {
            doc_fmt_ib_title: 'Interaktives Buch',
            doc_fmt_ib_instructions: '📝 Lesen Sie die Kapitel und beantworten Sie die integrierten Übungen.',
            doc_fmt_ib_chapter: 'Kapitel',
            doc_fmt_ib_exercise: 'Übung',
        },
        eh: {
            eh_ib_desc: 'Digitales Buch mit mehreren Kapiteln und Inhaltsverzeichnis. Jedes Kapitel ist eine Seite, die Texte, Tabellen, Bilder und interaktive Übungen frei stapelt. Eine Zusammenfassungsseite bündelt die Punktzahlen. Ideal für eine vollständige Unterrichtssequenz.',
            eh_ib_section_chapters: 'Kapitel und Blöcke',
            eh_ib_chapters_intro: 'Jedes Kapitel ist eine Buchseite aus vertikal gestapelten Blöcken:',
            eh_ib_block_text: 'Kursabsatz: Erklärungen, Definitionen und Schlüsselbegriffe. Unterstützt Fett, Kursiv und LaTeX-Formeln.',
            eh_ib_block_table: 'Datentabelle mit Kopfzeilen und Zeilen, sechs visuelle Stile zur Auswahl.',
            eh_ib_block_image: 'Bild von Ihrem Computer, mit Alternativtext für die Barrierefreiheit.',
            eh_ib_block_exercise: 'Interaktive Übung aus den 9 unten stehenden Typen, in die Seite eingebettet.',
            eh_ib_section_exercises: 'Verfügbare Übungstypen',
            eh_ib_exercises_intro: 'Jeder Übungsblock enthält eine interaktive Übung aus den folgenden:',
            eh_ib_rule_structure: 'Ordnen Sie die Kapitel pädagogisch: Einführung → Vertiefung → Überprüfung → <strong>Abschlusszusammenfassung</strong>.',
            eh_ib_rule_variety: 'Wechseln Sie Inhaltsblöcke und Übungen <strong>innerhalb desselben Kapitels</strong> ab — das ist die Stärke des interaktiven Buchs.',
            eh_ib_rule_titles: 'Die Kapiteltitel bilden das <strong>Inhaltsverzeichnis</strong>: Halten Sie sie kurz und aussagekräftig.',
            eh_ib_section_options: 'Buchoptionen',
            eh_ib_opt_cover: 'Begrüßungsseite vor dem ersten Kapitel, mit einem Einführungstext.',
            eh_ib_opt_toc: 'Zeigt das seitliche Navigationspanel mit der Kapitelliste an.',
            eh_ib_opt_summary: 'Fügt eine Abschlussseite hinzu, die die Punktzahlen aller Übungen des Buchs zusammenfasst.',
            eh_ib_opt_base_color: 'Hauptfarbe der Buchoberfläche (Fortschrittsleiste, Menü).',
            eh_ib_good_example: 'Ein Buch mit 4 Kapiteln: Titelseite → Einführung (Text + Tabelle + Multiple-Choice) → Begriffe (Text + 2 Übungen) → Zusammenfassung (Resümee). Die Lernenden wechseln auf jeder Seite zwischen Lesen und Überprüfen.<br>',
            eh_ib_bad_example: 'Ein einziges endloses Kapitel mit 10 Blöcken oder Kapitel ohne Übungen — die Lernenden verlieren den Faden und die Zusammenfassungsseite bleibt leer.<br>',
        },
        tutoLi: '<li><strong>Interaktives Buch:</strong> Erstellen Sie ein Buch mit mehreren Kapiteln, in dem jede Seite Texte, Tabellen, Bilder und Übungen kombiniert, mit Inhaltsverzeichnis und Zusammenfassung.</li>',
    },

    it: {
        name: 'Libro interattivo',
        description: 'Crea un libro digitale a più capitoli: ogni pagina combina testi, tabelle, immagini ed esercizi (scelta multipla, vero/falso, testo con spazi…), con indice e pagina di riepilogo.',
        editor: {
            editor_ib_cover: 'Copertina',
            editor_ib_cover_desc: 'Testo della copertina',
            editor_ib_cover_hint: 'Testo di benvenuto mostrato prima del primo capitolo (facoltativo).',
            editor_ib_section_chapters: 'Capitoli',
            editor_ib_chapter: 'Capitolo',
            editor_ib_add_chapter: 'Aggiungi un capitolo',
            editor_ib_chapter_title: 'Titolo del capitolo',
            editor_ib_chapter_title_hint: "Mostrato nell'indice.",
            editor_ib_blocks: 'Blocchi del capitolo',
            editor_ib_block: 'Blocco',
            editor_ib_add_block: 'Aggiungi un blocco',
            editor_ib_block_type: 'Tipo di blocco',
            editor_ib_block_text: 'Testo',
            editor_ib_block_table: 'Tabella',
            editor_ib_block_image: 'Immagine',
            editor_ib_block_exercise: 'Esercizio',
            editor_ib_text: 'Contenuto testuale',
            editor_ib_section_options: 'Opzioni del libro',
            editor_ib_base_color: 'Colore principale',
            editor_ib_toc: "Mostra l'indice",
            editor_ib_summary: 'Mostra la pagina di riepilogo',
        },
        validation: {
            validation_ib_min_chapters: 'Il libro deve contenere almeno 2 capitoli',
            validation_ib_no_chapter_title: 'Il titolo del capitolo è obbligatorio',
            validation_ib_empty_chapter: 'Il capitolo deve contenere almeno un blocco',
            validation_ib_no_exercise_lib: 'Il tipo di esercizio è obbligatorio per questo blocco',
        },
        docFmt: {
            doc_fmt_ib_title: 'Libro interattivo',
            doc_fmt_ib_instructions: '📝 Sfoglia i capitoli e rispondi agli esercizi integrati.',
            doc_fmt_ib_chapter: 'Capitolo',
            doc_fmt_ib_exercise: 'Esercizio',
        },
        eh: {
            eh_ib_desc: 'Libro digitale a più capitoli con indice. Ogni capitolo è una pagina che impila liberamente testi, tabelle, immagini ed esercizi interattivi. Una pagina di riepilogo somma i punteggi. Ideale per una sequenza didattica completa.',
            eh_ib_section_chapters: 'Capitoli e blocchi',
            eh_ib_chapters_intro: 'Ogni capitolo è una pagina del libro composta da blocchi impilati verticalmente:',
            eh_ib_block_text: 'Paragrafo di corso: spiegazioni, definizioni e concetti chiave. Supporta grassetto, corsivo e formule LaTeX.',
            eh_ib_block_table: 'Tabella di dati con intestazioni e righe, sei stili visivi tra cui scegliere.',
            eh_ib_block_image: "Immagine aggiunta dal tuo computer, con testo alternativo per l'accessibilità.",
            eh_ib_block_exercise: 'Esercizio interattivo tra i 9 tipi qui sotto, integrato nella pagina.',
            eh_ib_section_exercises: 'Tipi di esercizi disponibili',
            eh_ib_exercises_intro: 'Ogni blocco esercizio contiene un esercizio interattivo tra i seguenti:',
            eh_ib_rule_structure: 'Organizza i capitoli in ordine didattico: introduzione → sviluppo → verifica → <strong>sintesi finale</strong>.',
            eh_ib_rule_variety: 'Alterna blocchi di contenuto ed esercizi <strong>allo stesso capitolo</strong>: è la forza del libro interattivo.',
            eh_ib_rule_titles: "I titoli dei capitoli formano l'<strong>indice</strong>: mantienili brevi ed espliciti.",
            eh_ib_section_options: 'Opzioni del libro',
            eh_ib_opt_cover: 'Pagina di benvenuto mostrata prima del primo capitolo, con un testo di presentazione.',
            eh_ib_opt_toc: 'Mostra il pannello laterale di navigazione con la lista dei capitoli.',
            eh_ib_opt_summary: 'Aggiunge una pagina finale che riepiloga i punteggi di tutti gli esercizi del libro.',
            eh_ib_opt_base_color: "Colore principale dell'interfaccia del libro (barra di avanzamento, menu).",
            eh_ib_good_example: "Un libro di 4 capitoli: copertina → introduzione (testo + tabella + scelta multipla) → concetti (testo + 2 esercizi) → sintesi (riepilogo). Lo studente alterna lettura e verifica a ogni pagina.<br>",
            eh_ib_bad_example: 'Un unico capitolo interminabile con 10 blocchi, o capitoli senza alcun esercizio: lo studente perde il filo e la pagina di riepilogo resta vuota.<br>',
        },
        tutoLi: '<li><strong>Libro interattivo:</strong> Crea un libro a più capitoli dove ogni pagina combina testi, tabelle, immagini ed esercizi, con indice e riepilogo.</li>',
    },

    nl: {
        name: 'Interactief boek',
        description: 'Maak een digitaal boek met meerdere hoofdstukken: elke pagina combineert teksten, tabellen, afbeeldingen en oefeningen (meerkeuze, waar/onwaar, invuloefening…), met inhoudsopgave en samenvattingspagina.',
        editor: {
            editor_ib_cover: 'Omslagpagina',
            editor_ib_cover_desc: 'Omslagtekst',
            editor_ib_cover_hint: 'Welkomsttekst die vóór het eerste hoofdstuk wordt getoond (optioneel).',
            editor_ib_section_chapters: 'Hoofdstukken',
            editor_ib_chapter: 'Hoofdstuk',
            editor_ib_add_chapter: 'Hoofdstuk toevoegen',
            editor_ib_chapter_title: 'Hoofdstuktitel',
            editor_ib_chapter_title_hint: 'Wordt getoond in de inhoudsopgave.',
            editor_ib_blocks: 'Blokken van het hoofdstuk',
            editor_ib_block: 'Blok',
            editor_ib_add_block: 'Blok toevoegen',
            editor_ib_block_type: 'Bloktype',
            editor_ib_block_text: 'Tekst',
            editor_ib_block_table: 'Tabel',
            editor_ib_block_image: 'Afbeelding',
            editor_ib_block_exercise: 'Oefening',
            editor_ib_text: 'Tekstinhoud',
            editor_ib_section_options: 'Boekopties',
            editor_ib_base_color: 'Hoofdkleur',
            editor_ib_toc: 'Inhoudsopgave tonen',
            editor_ib_summary: 'Samenvattingspagina tonen',
        },
        validation: {
            validation_ib_min_chapters: 'Het boek moet minstens 2 hoofdstukken bevatten',
            validation_ib_no_chapter_title: 'De hoofdstuktitel is verplicht',
            validation_ib_empty_chapter: 'Het hoofdstuk moet minstens één blok bevatten',
            validation_ib_no_exercise_lib: 'Het oefeningstype is verplicht voor dit blok',
        },
        docFmt: {
            doc_fmt_ib_title: 'Interactief boek',
            doc_fmt_ib_instructions: '📝 Doorloop de hoofdstukken en beantwoord de ingebouwde oefeningen.',
            doc_fmt_ib_chapter: 'Hoofdstuk',
            doc_fmt_ib_exercise: 'Oefening',
        },
        eh: {
            eh_ib_desc: 'Digitaal boek met meerdere hoofdstukken en een inhoudsopgave. Elk hoofdstuk is een pagina die vrij teksten, tabellen, afbeeldingen en interactieve oefeningen stapelt. Een samenvattingspagina telt de scores op. Ideaal voor een volledige lessenreeks.',
            eh_ib_section_chapters: 'Hoofdstukken en blokken',
            eh_ib_chapters_intro: 'Elk hoofdstuk is een boekpagina opgebouwd uit verticaal gestapelde blokken:',
            eh_ib_block_text: 'Lesparagraaf: uitleg, definities en kernbegrippen. Ondersteunt vet, cursief en LaTeX-formules.',
            eh_ib_block_table: 'Gegevenstabel met kopteksten en rijen, zes visuele stijlen naar keuze.',
            eh_ib_block_image: 'Afbeelding toegevoegd vanaf uw computer, met alternatieve tekst voor toegankelijkheid.',
            eh_ib_block_exercise: 'Interactieve oefening uit de 9 onderstaande types, ingebed in de pagina.',
            eh_ib_section_exercises: 'Beschikbare oefeningstypes',
            eh_ib_exercises_intro: 'Elk oefenblok bevat één interactieve oefening uit de volgende:',
            eh_ib_rule_structure: 'Orden de hoofdstukken pedagogisch: inleiding → uitwerking → controle → <strong>eindsamenvatting</strong>.',
            eh_ib_rule_variety: 'Wissel inhoudsblokken en oefeningen af <strong>binnen hetzelfde hoofdstuk</strong> — dat is de kracht van het interactieve boek.',
            eh_ib_rule_titles: 'De hoofdstuktitels vormen de <strong>inhoudsopgave</strong>: houd ze kort en duidelijk.',
            eh_ib_section_options: 'Boekopties',
            eh_ib_opt_cover: 'Welkomstpagina die vóór het eerste hoofdstuk wordt getoond, met een introductietekst.',
            eh_ib_opt_toc: 'Toont het zijpaneel voor navigatie met de lijst van hoofdstukken.',
            eh_ib_opt_summary: 'Voegt een eindpagina toe die de scores van alle oefeningen in het boek samenvat.',
            eh_ib_opt_base_color: 'Hoofdkleur van de boekinterface (voortgangsbalk, menu).',
            eh_ib_good_example: 'Een boek met 4 hoofdstukken: omslag → inleiding (tekst + tabel + meerkeuze) → begrippen (tekst + 2 oefeningen) → samenvatting (recap). De leerling wisselt op elke pagina lezen en controleren af.<br>',
            eh_ib_bad_example: 'Eén eindeloos hoofdstuk met 10 blokken, of hoofdstukken zonder oefeningen — de leerling raakt de draad kwijt en de samenvattingspagina blijft leeg.<br>',
        },
        tutoLi: '<li><strong>Interactief boek:</strong> Maak een boek met meerdere hoofdstukken waarin elke pagina teksten, tabellen, afbeeldingen en oefeningen combineert, met inhoudsopgave en samenvatting.</li>',
    },

    pt: {
        name: 'Livro interativo',
        description: 'Crie um livro digital com vários capítulos: cada página combina textos, tabelas, imagens e exercícios (escolha múltipla, verdadeiro/falso, preencher lacunas…), com índice e página de resumo.',
        editor: {
            editor_ib_cover: 'Capa',
            editor_ib_cover_desc: 'Texto da capa',
            editor_ib_cover_hint: 'Texto de boas-vindas mostrado antes do primeiro capítulo (opcional).',
            editor_ib_section_chapters: 'Capítulos',
            editor_ib_chapter: 'Capítulo',
            editor_ib_add_chapter: 'Adicionar um capítulo',
            editor_ib_chapter_title: 'Título do capítulo',
            editor_ib_chapter_title_hint: 'Mostrado no índice.',
            editor_ib_blocks: 'Blocos do capítulo',
            editor_ib_block: 'Bloco',
            editor_ib_add_block: 'Adicionar um bloco',
            editor_ib_block_type: 'Tipo de bloco',
            editor_ib_block_text: 'Texto',
            editor_ib_block_table: 'Tabela',
            editor_ib_block_image: 'Imagem',
            editor_ib_block_exercise: 'Exercício',
            editor_ib_text: 'Conteúdo de texto',
            editor_ib_section_options: 'Opções do livro',
            editor_ib_base_color: 'Cor principal',
            editor_ib_toc: 'Mostrar o índice',
            editor_ib_summary: 'Mostrar a página de resumo',
        },
        validation: {
            validation_ib_min_chapters: 'O livro deve conter pelo menos 2 capítulos',
            validation_ib_no_chapter_title: 'O título do capítulo é obrigatório',
            validation_ib_empty_chapter: 'O capítulo deve conter pelo menos um bloco',
            validation_ib_no_exercise_lib: 'O tipo de exercício é obrigatório para este bloco',
        },
        docFmt: {
            doc_fmt_ib_title: 'Livro interativo',
            doc_fmt_ib_instructions: '📝 Percorra os capítulos e responda aos exercícios integrados.',
            doc_fmt_ib_chapter: 'Capítulo',
            doc_fmt_ib_exercise: 'Exercício',
        },
        eh: {
            eh_ib_desc: 'Livro digital com vários capítulos e índice. Cada capítulo é uma página que empilha livremente textos, tabelas, imagens e exercícios interativos. Uma página de resumo agrega as pontuações. Ideal para uma sequência pedagógica completa.',
            eh_ib_section_chapters: 'Capítulos e blocos',
            eh_ib_chapters_intro: 'Cada capítulo é uma página do livro composta por blocos empilhados verticalmente:',
            eh_ib_block_text: 'Parágrafo de curso: explicações, definições e conceitos-chave. Suporta negrito, itálico e fórmulas LaTeX.',
            eh_ib_block_table: 'Tabela de dados com cabeçalhos e linhas, seis estilos visuais à escolha.',
            eh_ib_block_image: 'Imagem adicionada do seu computador, com texto alternativo para acessibilidade.',
            eh_ib_block_exercise: 'Exercício interativo entre os 9 tipos abaixo, integrado na página.',
            eh_ib_section_exercises: 'Tipos de exercícios disponíveis',
            eh_ib_exercises_intro: 'Cada bloco de exercício contém um exercício interativo entre os seguintes:',
            eh_ib_rule_structure: 'Organize os capítulos numa ordem pedagógica: introdução → desenvolvimento → verificação → <strong>síntese final</strong>.',
            eh_ib_rule_variety: 'Alterne blocos de conteúdo e exercícios <strong>dentro do mesmo capítulo</strong> — é a força do livro interativo.',
            eh_ib_rule_titles: 'Os títulos dos capítulos formam o <strong>índice</strong>: mantenha-os curtos e explícitos.',
            eh_ib_section_options: 'Opções do livro',
            eh_ib_opt_cover: 'Página de boas-vindas mostrada antes do primeiro capítulo, com um texto de apresentação.',
            eh_ib_opt_toc: 'Mostra o painel lateral de navegação com a lista de capítulos.',
            eh_ib_opt_summary: 'Adiciona uma página final que recapitula as pontuações de todos os exercícios do livro.',
            eh_ib_opt_base_color: 'Cor principal da interface do livro (barra de progresso, menu).',
            eh_ib_good_example: 'Um livro de 4 capítulos: capa → introdução (texto + tabela + escolha múltipla) → conceitos (texto + 2 exercícios) → síntese (resumo). O aluno alterna leitura e verificação em cada página.<br>',
            eh_ib_bad_example: 'Um único capítulo interminável com 10 blocos, ou capítulos sem nenhum exercício — o aluno perde o fio e a página de resumo fica vazia.<br>',
        },
        tutoLi: '<li><strong>Livro interativo:</strong> Crie um livro com vários capítulos onde cada página combina textos, tabelas, imagens e exercícios, com índice e resumo.</li>',
    },

    ar: {
        name: 'كتاب تفاعلي',
        description: 'أنشئ كتابًا رقميًا متعدد الفصول: تجمع كل صفحة نصوصًا وجداول وصورًا وتمارين (اختيار من متعدد، صح/خطأ، ملء الفراغات…)، مع جدول محتويات وصفحة ملخص.',
        editor: {
            editor_ib_cover: 'صفحة الغلاف',
            editor_ib_cover_desc: 'نص الغلاف',
            editor_ib_cover_hint: 'نص ترحيبي يظهر قبل الفصل الأول (اختياري).',
            editor_ib_section_chapters: 'الفصول',
            editor_ib_chapter: 'فصل',
            editor_ib_add_chapter: 'إضافة فصل',
            editor_ib_chapter_title: 'عنوان الفصل',
            editor_ib_chapter_title_hint: 'يظهر في جدول المحتويات.',
            editor_ib_blocks: 'كتل الفصل',
            editor_ib_block: 'كتلة',
            editor_ib_add_block: 'إضافة كتلة',
            editor_ib_block_type: 'نوع الكتلة',
            editor_ib_block_text: 'نص',
            editor_ib_block_table: 'جدول',
            editor_ib_block_image: 'صورة',
            editor_ib_block_exercise: 'تمرين',
            editor_ib_text: 'محتوى نصي',
            editor_ib_section_options: 'خيارات الكتاب',
            editor_ib_base_color: 'اللون الرئيسي',
            editor_ib_toc: 'عرض جدول المحتويات',
            editor_ib_summary: 'عرض صفحة الملخص',
        },
        validation: {
            validation_ib_min_chapters: 'يجب أن يحتوي الكتاب على فصلين على الأقل',
            validation_ib_no_chapter_title: 'عنوان الفصل مطلوب',
            validation_ib_empty_chapter: 'يجب أن يحتوي الفصل على كتلة واحدة على الأقل',
            validation_ib_no_exercise_lib: 'نوع التمرين مطلوب لهذه الكتلة',
        },
        docFmt: {
            doc_fmt_ib_title: 'كتاب تفاعلي',
            doc_fmt_ib_instructions: '📝 تصفّح الفصول وأجب عن التمارين المدمجة.',
            doc_fmt_ib_chapter: 'الفصل',
            doc_fmt_ib_exercise: 'تمرين',
        },
        eh: {
            eh_ib_desc: 'كتاب رقمي متعدد الفصول مع جدول محتويات. كل فصل هو صفحة تجمع بحرية نصوصًا وجداول وصورًا وتمارين تفاعلية. تجمع صفحة الملخص النقاط. مثالي لتسلسل تعليمي كامل.',
            eh_ib_section_chapters: 'الفصول والكتل',
            eh_ib_chapters_intro: 'كل فصل هو صفحة من الكتاب مكوّنة من كتل مكدّسة عموديًا:',
            eh_ib_block_text: 'فقرة درس: شروحات وتعريفات ومفاهيم أساسية. تدعم الخط الغامق والمائل وصيغ LaTeX.',
            eh_ib_block_table: 'جدول بيانات برؤوس وصفوف، مع ستة أنماط بصرية للاختيار.',
            eh_ib_block_image: 'صورة مضافة من جهازك، مع نص بديل لسهولة الوصول.',
            eh_ib_block_exercise: 'تمرين تفاعلي من بين الأنواع التسعة أدناه، مدمج في الصفحة.',
            eh_ib_section_exercises: 'أنواع التمارين المتاحة',
            eh_ib_exercises_intro: 'تحتوي كل كتلة تمرين على تمرين تفاعلي واحد من بين ما يلي:',
            eh_ib_rule_structure: 'نظّم الفصول بترتيب تربوي: مقدمة → تطوير → تحقق → <strong>ملخص نهائي</strong>.',
            eh_ib_rule_variety: 'ناوب بين كتل المحتوى والتمارين <strong>داخل الفصل نفسه</strong> — هذه هي قوة الكتاب التفاعلي.',
            eh_ib_rule_titles: 'تشكّل عناوين الفصول <strong>جدول المحتويات</strong>: اجعلها قصيرة وواضحة.',
            eh_ib_section_options: 'خيارات الكتاب',
            eh_ib_opt_cover: 'صفحة ترحيب تظهر قبل الفصل الأول، مع نص تقديمي.',
            eh_ib_opt_toc: 'يعرض لوحة التنقل الجانبية مع قائمة الفصول.',
            eh_ib_opt_summary: 'يضيف صفحة نهائية تلخّص نقاط جميع تمارين الكتاب.',
            eh_ib_opt_base_color: 'اللون الرئيسي لواجهة الكتاب (شريط التقدم، القائمة).',
            eh_ib_good_example: 'كتاب من 4 فصول: غلاف → مقدمة (نص + جدول + اختيار من متعدد) → مفاهيم (نص + تمرينان) → ملخص (مراجعة). يتناوب المتعلم بين القراءة والتحقق في كل صفحة.<br>',
            eh_ib_bad_example: 'فصل واحد لا ينتهي يضم 10 كتل، أو فصول دون أي تمرين — يفقد المتعلم الخيط وتبقى صفحة الملخص فارغة.<br>',
        },
        tutoLi: '<li><strong>كتاب تفاعلي:</strong> أنشئ كتابًا متعدد الفصول تجمع كل صفحة فيه نصوصًا وجداول وصورًا وتمارين، مع جدول محتويات وملخص.</li>',
    },

    zh: {
        name: '互动书',
        description: '创建多章节数字图书：每一页都可组合文本、表格、图片和练习（选择题、判断题、填空题等），并带有目录和总结页。',
        editor: {
            editor_ib_cover: '封面页',
            editor_ib_cover_desc: '封面文字',
            editor_ib_cover_hint: '在第一章之前显示的欢迎文字（可选）。',
            editor_ib_section_chapters: '章节',
            editor_ib_chapter: '章节',
            editor_ib_add_chapter: '添加章节',
            editor_ib_chapter_title: '章节标题',
            editor_ib_chapter_title_hint: '显示在目录中。',
            editor_ib_blocks: '章节内容块',
            editor_ib_block: '内容块',
            editor_ib_add_block: '添加内容块',
            editor_ib_block_type: '内容块类型',
            editor_ib_block_text: '文本',
            editor_ib_block_table: '表格',
            editor_ib_block_image: '图片',
            editor_ib_block_exercise: '练习',
            editor_ib_text: '文本内容',
            editor_ib_section_options: '图书选项',
            editor_ib_base_color: '主色调',
            editor_ib_toc: '显示目录',
            editor_ib_summary: '显示总结页',
        },
        validation: {
            validation_ib_min_chapters: '图书必须至少包含 2 个章节',
            validation_ib_no_chapter_title: '章节标题为必填项',
            validation_ib_empty_chapter: '章节必须至少包含一个内容块',
            validation_ib_no_exercise_lib: '此内容块必须选择练习类型',
        },
        docFmt: {
            doc_fmt_ib_title: '互动书',
            doc_fmt_ib_instructions: '📝 阅读各章节并完成其中的练习。',
            doc_fmt_ib_chapter: '章节',
            doc_fmt_ib_exercise: '练习',
        },
        eh: {
            eh_ib_desc: '带目录的多章节数字图书。每个章节是一个页面，可自由叠放文本、表格、图片和互动练习。总结页会汇总所有得分。非常适合完整的教学序列。',
            eh_ib_section_chapters: '章节与内容块',
            eh_ib_chapters_intro: '每个章节是由垂直叠放的内容块组成的一页：',
            eh_ib_block_text: '课程段落：解释、定义和关键概念。支持加粗、斜体和 LaTeX 公式。',
            eh_ib_block_table: '带表头和行的数据表格，可选六种视觉样式。',
            eh_ib_block_image: '从您的电脑添加的图片，带无障碍替代文本。',
            eh_ib_block_exercise: '从下方 9 种类型中选择的互动练习，嵌入页面中。',
            eh_ib_section_exercises: '可用的练习类型',
            eh_ib_exercises_intro: '每个练习块包含以下互动练习之一：',
            eh_ib_rule_structure: '按教学顺序组织章节：引入 → 展开 → 检验 → <strong>最终总结</strong>。',
            eh_ib_rule_variety: '在<strong>同一章节内</strong>交替安排内容块和练习——这正是互动书的优势。',
            eh_ib_rule_titles: '章节标题构成<strong>目录</strong>：请保持简短明确。',
            eh_ib_section_options: '图书选项',
            eh_ib_opt_cover: '在第一章之前显示的欢迎页，带介绍文字。',
            eh_ib_opt_toc: '显示带章节列表的侧边导航栏。',
            eh_ib_opt_summary: '添加汇总全书所有练习得分的结尾页。',
            eh_ib_opt_base_color: '图书界面的主色调（进度条、菜单）。',
            eh_ib_good_example: '一本 4 章的书：封面 → 引言（文本 + 表格 + 选择题）→ 概念（文本 + 2 个练习）→ 总结（回顾）。学生每页都在阅读与自测之间交替。<br>',
            eh_ib_bad_example: '一个包含 10 个内容块的冗长章节，或没有任何练习的章节——学生失去头绪，总结页也是空的。<br>',
        },
        tutoLi: '<li><strong>互动书：</strong>创建多章节图书，每一页组合文本、表格、图片和练习，并带有目录和总结。</li>',
    },

    jp: {
        name: 'インタラクティブブック',
        description: '複数の章からなるデジタルブックを作成します。各ページにテキスト、表、画像、練習問題（選択式、○×、穴埋めなど）を組み合わせ、目次とまとめページが付きます。',
        editor: {
            editor_ib_cover: '表紙ページ',
            editor_ib_cover_desc: '表紙のテキスト',
            editor_ib_cover_hint: '最初の章の前に表示される案内文（任意）。',
            editor_ib_section_chapters: '章',
            editor_ib_chapter: '章',
            editor_ib_add_chapter: '章を追加',
            editor_ib_chapter_title: '章のタイトル',
            editor_ib_chapter_title_hint: '目次に表示されます。',
            editor_ib_blocks: '章のブロック',
            editor_ib_block: 'ブロック',
            editor_ib_add_block: 'ブロックを追加',
            editor_ib_block_type: 'ブロックの種類',
            editor_ib_block_text: 'テキスト',
            editor_ib_block_table: '表',
            editor_ib_block_image: '画像',
            editor_ib_block_exercise: '練習問題',
            editor_ib_text: 'テキスト内容',
            editor_ib_section_options: 'ブックの設定',
            editor_ib_base_color: 'メインカラー',
            editor_ib_toc: '目次を表示',
            editor_ib_summary: 'まとめページを表示',
        },
        validation: {
            validation_ib_min_chapters: 'ブックには少なくとも2つの章が必要です',
            validation_ib_no_chapter_title: '章のタイトルは必須です',
            validation_ib_empty_chapter: '章には少なくとも1つのブロックが必要です',
            validation_ib_no_exercise_lib: 'このブロックには練習問題の種類の選択が必要です',
        },
        docFmt: {
            doc_fmt_ib_title: 'インタラクティブブック',
            doc_fmt_ib_instructions: '📝 各章を読み、組み込まれた練習問題に答えましょう。',
            doc_fmt_ib_chapter: '章',
            doc_fmt_ib_exercise: '練習問題',
        },
        eh: {
            eh_ib_desc: '目次付きの複数章デジタルブックです。各章はテキスト、表、画像、インタラクティブな練習問題を自由に積み重ねられるページです。まとめページがスコアを集計します。完結した学習シーケンスに最適です。',
            eh_ib_section_chapters: '章とブロック',
            eh_ib_chapters_intro: '各章は、縦に積み重ねられたブロックで構成されるページです：',
            eh_ib_block_text: '本文の段落：説明、定義、重要な概念。太字、斜体、LaTeX数式に対応。',
            eh_ib_block_table: 'ヘッダーと行を持つデータ表。6種類の表示スタイルから選択可能。',
            eh_ib_block_image: 'パソコンから追加する画像。アクセシビリティのための代替テキスト付き。',
            eh_ib_block_exercise: '以下の9種類から選ぶインタラクティブな練習問題。ページに埋め込まれます。',
            eh_ib_section_exercises: '利用可能な練習問題の種類',
            eh_ib_exercises_intro: '各練習ブロックには、以下のいずれかの練習問題が含まれます：',
            eh_ib_rule_structure: '章を教育的な順序で構成しましょう：導入 → 展開 → 確認 → <strong>最終まとめ</strong>。',
            eh_ib_rule_variety: '<strong>同じ章の中で</strong>内容ブロックと練習問題を交互に配置しましょう。それがインタラクティブブックの強みです。',
            eh_ib_rule_titles: '章のタイトルは<strong>目次</strong>になります。短く明確に保ちましょう。',
            eh_ib_section_options: 'ブックの設定',
            eh_ib_opt_cover: '最初の章の前に表示される案内ページ。紹介文付き。',
            eh_ib_opt_toc: '章の一覧を含むサイドナビゲーションパネルを表示します。',
            eh_ib_opt_summary: 'ブック内のすべての練習問題のスコアをまとめる最終ページを追加します。',
            eh_ib_opt_base_color: 'ブックのインターフェースのメインカラー（進捗バー、メニュー）。',
            eh_ib_good_example: '4章構成のブック：表紙 → 導入（テキスト＋表＋選択問題）→ 概念（テキスト＋練習2問）→ まとめ（振り返り）。学習者は各ページで読解と確認を交互に行います。<br>',
            eh_ib_bad_example: '10個のブロックを詰め込んだ終わらない1章だけのブック、または練習問題のない章 — 学習者は道筋を見失い、まとめページは空のままです。<br>',
        },
        tutoLi: '<li><strong>インタラクティブブック：</strong>各ページにテキスト、表、画像、練習問題を組み合わせた複数章のブックを作成します。目次とまとめ付き。</li>',
    },

    el: {
        name: 'Διαδραστικό βιβλίο',
        description: 'Δημιουργήστε ένα ψηφιακό βιβλίο πολλών κεφαλαίων: κάθε σελίδα συνδυάζει κείμενα, πίνακες, εικόνες και ασκήσεις (πολλαπλής επιλογής, σωστό/λάθος, συμπλήρωση κενών…), με πίνακα περιεχομένων και σελίδα σύνοψης.',
        editor: {
            editor_ib_cover: 'Εξώφυλλο',
            editor_ib_cover_desc: 'Κείμενο εξωφύλλου',
            editor_ib_cover_hint: 'Κείμενο υποδοχής που εμφανίζεται πριν από το πρώτο κεφάλαιο (προαιρετικό).',
            editor_ib_section_chapters: 'Κεφάλαια',
            editor_ib_chapter: 'Κεφάλαιο',
            editor_ib_add_chapter: 'Προσθήκη κεφαλαίου',
            editor_ib_chapter_title: 'Τίτλος κεφαλαίου',
            editor_ib_chapter_title_hint: 'Εμφανίζεται στον πίνακα περιεχομένων.',
            editor_ib_blocks: 'Μπλοκ του κεφαλαίου',
            editor_ib_block: 'Μπλοκ',
            editor_ib_add_block: 'Προσθήκη μπλοκ',
            editor_ib_block_type: 'Τύπος μπλοκ',
            editor_ib_block_text: 'Κείμενο',
            editor_ib_block_table: 'Πίνακας',
            editor_ib_block_image: 'Εικόνα',
            editor_ib_block_exercise: 'Άσκηση',
            editor_ib_text: 'Περιεχόμενο κειμένου',
            editor_ib_section_options: 'Επιλογές βιβλίου',
            editor_ib_base_color: 'Κύριο χρώμα',
            editor_ib_toc: 'Εμφάνιση πίνακα περιεχομένων',
            editor_ib_summary: 'Εμφάνιση σελίδας σύνοψης',
        },
        validation: {
            validation_ib_min_chapters: 'Το βιβλίο πρέπει να περιέχει τουλάχιστον 2 κεφάλαια',
            validation_ib_no_chapter_title: 'Ο τίτλος του κεφαλαίου είναι υποχρεωτικός',
            validation_ib_empty_chapter: 'Το κεφάλαιο πρέπει να περιέχει τουλάχιστον ένα μπλοκ',
            validation_ib_no_exercise_lib: 'Ο τύπος άσκησης είναι υποχρεωτικός για αυτό το μπλοκ',
        },
        docFmt: {
            doc_fmt_ib_title: 'Διαδραστικό βιβλίο',
            doc_fmt_ib_instructions: '📝 Διαβάστε τα κεφάλαια και απαντήστε στις ενσωματωμένες ασκήσεις.',
            doc_fmt_ib_chapter: 'Κεφάλαιο',
            doc_fmt_ib_exercise: 'Άσκηση',
        },
        eh: {
            eh_ib_desc: 'Ψηφιακό βιβλίο πολλών κεφαλαίων με πίνακα περιεχομένων. Κάθε κεφάλαιο είναι μια σελίδα που στοιβάζει ελεύθερα κείμενα, πίνακες, εικόνες και διαδραστικές ασκήσεις. Μια σελίδα σύνοψης συγκεντρώνει τις βαθμολογίες. Ιδανικό για μια πλήρη διδακτική ενότητα.',
            eh_ib_section_chapters: 'Κεφάλαια και μπλοκ',
            eh_ib_chapters_intro: 'Κάθε κεφάλαιο είναι μια σελίδα του βιβλίου από κάθετα στοιβαγμένα μπλοκ:',
            eh_ib_block_text: 'Παράγραφος μαθήματος: εξηγήσεις, ορισμοί και βασικές έννοιες. Υποστηρίζει έντονα, πλάγια και τύπους LaTeX.',
            eh_ib_block_table: 'Πίνακας δεδομένων με κεφαλίδες και γραμμές, έξι οπτικά στυλ για επιλογή.',
            eh_ib_block_image: 'Εικόνα από τον υπολογιστή σας, με εναλλακτικό κείμενο για προσβασιμότητα.',
            eh_ib_block_exercise: 'Διαδραστική άσκηση από τους 9 παρακάτω τύπους, ενσωματωμένη στη σελίδα.',
            eh_ib_section_exercises: 'Διαθέσιμοι τύποι ασκήσεων',
            eh_ib_exercises_intro: 'Κάθε μπλοκ άσκησης περιέχει μία διαδραστική άσκηση από τις ακόλουθες:',
            eh_ib_rule_structure: 'Οργανώστε τα κεφάλαια με παιδαγωγική σειρά: εισαγωγή → ανάπτυξη → έλεγχος → <strong>τελική σύνοψη</strong>.',
            eh_ib_rule_variety: 'Εναλλάσσετε μπλοκ περιεχομένου και ασκήσεις <strong>μέσα στο ίδιο κεφάλαιο</strong> — αυτή είναι η δύναμη του διαδραστικού βιβλίου.',
            eh_ib_rule_titles: 'Οι τίτλοι των κεφαλαίων σχηματίζουν τον <strong>πίνακα περιεχομένων</strong>: κρατήστε τους σύντομους και σαφείς.',
            eh_ib_section_options: 'Επιλογές βιβλίου',
            eh_ib_opt_cover: 'Σελίδα υποδοχής που εμφανίζεται πριν από το πρώτο κεφάλαιο, με κείμενο παρουσίασης.',
            eh_ib_opt_toc: 'Εμφανίζει το πλευρικό πλαίσιο πλοήγησης με τη λίστα των κεφαλαίων.',
            eh_ib_opt_summary: 'Προσθέτει μια τελική σελίδα που συνοψίζει τις βαθμολογίες όλων των ασκήσεων του βιβλίου.',
            eh_ib_opt_base_color: 'Κύριο χρώμα της διεπαφής του βιβλίου (γραμμή προόδου, μενού).',
            eh_ib_good_example: 'Ένα βιβλίο 4 κεφαλαίων: εξώφυλλο → εισαγωγή (κείμενο + πίνακας + πολλαπλή επιλογή) → έννοιες (κείμενο + 2 ασκήσεις) → σύνοψη (ανακεφαλαίωση). Ο μαθητής εναλλάσσει ανάγνωση και έλεγχο σε κάθε σελίδα.<br>',
            eh_ib_bad_example: 'Ένα μοναδικό ατελείωτο κεφάλαιο με 10 μπλοκ, ή κεφάλαια χωρίς καμία άσκηση — ο μαθητής χάνει τον ειρμό και η σελίδα σύνοψης μένει κενή.<br>',
        },
        tutoLi: '<li><strong>Διαδραστικό βιβλίο:</strong> Δημιουργήστε ένα βιβλίο πολλών κεφαλαίων όπου κάθε σελίδα συνδυάζει κείμενα, πίνακες, εικόνες και ασκήσεις, με πίνακα περιεχομένων και σύνοψη.</li>',
    },
};

// =====================================================================
// 3. PROMPTS IA — en-têtes IB par langue (+ section exercices extraite du prompt CP)
// =====================================================================

// Règles spécifiques : en-tête IB (la liste des types d'exercices est extraite du CP traduit)
const REGLES_HEAD = {
    fr: `- Nombre de chapitres : Au minimum 3 chapitres || [NOMBRE_ELEMENTS] chapitres.
- Structure : Chaque chapitre est une page de livre qui empile verticalement plusieurs blocs (textes, tableaux, exercices). Alterne contenu et exercices AU SEIN d'un même chapitre.
- Richesse des chapitres : Vise 2 à 4 blocs par chapitre (ex : 1-2 paragraphes + 1 exercice). Évite les chapitres à bloc unique, sauf pour la synthèse finale.
- Progression pédagogique : Organise les chapitres dans un ordre logique : introduction → développement → vérification → synthèse. Termine par un chapitre de synthèse avec un exercice récapitulatif.
- Couverture : Fournis un objet \`cover\` avec une \`description\` accrocheuse d'une ou deux phrases présentant le livre.
- Titres de chapitres : Courts et explicites — ils forment la table des matières du livre.
- Types de blocs disponibles :
  - Bloc texte (text) — explications, définitions, notions clés (Markdown autorisé)
  - Bloc tableau (table) — tableau de données avec en-têtes et lignes
  - Bloc exercice (exercise) — un exercice interactif parmi les types ci-dessous`,
    en: `- Number of chapters: At least 3 chapters || [NOMBRE_ELEMENTS] chapters.
- Structure: Each chapter is a book page that vertically stacks several blocks (texts, tables, exercises). Alternate content and exercises WITHIN the same chapter.
- Rich chapters: Aim for 2 to 4 blocks per chapter (e.g. 1-2 paragraphs + 1 exercise). Avoid single-block chapters, except for the final summary.
- Pedagogical progression: Organise the chapters in a logical order: introduction → development → assessment → summary. End with a summary chapter containing a recap exercise.
- Cover: Provide a \`cover\` object with a catchy one or two sentence \`description\` introducing the book.
- Chapter titles: Short and explicit — they form the book's table of contents.
- Available block types:
  - Text block (text) — explanations, definitions, key concepts (Markdown allowed)
  - Table block (table) — data table with headers and rows
  - Exercise block (exercise) — an interactive exercise among the types below`,
    es: `- Número de capítulos: Al menos 3 capítulos || [NOMBRE_ELEMENTS] capítulos.
- Estructura: Cada capítulo es una página de libro que apila verticalmente varios bloques (textos, tablas, ejercicios). Alterna contenido y ejercicios DENTRO del mismo capítulo.
- Riqueza de los capítulos: Apunta a 2-4 bloques por capítulo (p. ej. 1-2 párrafos + 1 ejercicio). Evita los capítulos de un solo bloque, salvo para la síntesis final.
- Progresión pedagógica: Organiza los capítulos en un orden lógico: introducción → desarrollo → verificación → síntesis. Termina con un capítulo de síntesis con un ejercicio recapitulativo.
- Portada: Proporciona un objeto \`cover\` con una \`description\` atractiva de una o dos frases que presente el libro.
- Títulos de capítulos: Cortos y explícitos — forman el índice del libro.
- Tipos de bloques disponibles:
  - Bloque de texto (text) — explicaciones, definiciones, conceptos clave (Markdown permitido)
  - Bloque de tabla (table) — tabla de datos con encabezados y filas
  - Bloque de ejercicio (exercise) — un ejercicio interactivo entre los tipos siguientes`,
    de: `- Anzahl der Kapitel: Mindestens 3 Kapitel || [NOMBRE_ELEMENTS] Kapitel.
- Struktur: Jedes Kapitel ist eine Buchseite, die mehrere Blöcke vertikal stapelt (Texte, Tabellen, Übungen). Wechsle Inhalt und Übungen INNERHALB desselben Kapitels ab.
- Reichhaltige Kapitel: Ziele auf 2 bis 4 Blöcke pro Kapitel (z. B. 1-2 Absätze + 1 Übung). Vermeide Kapitel mit nur einem Block, außer für die Abschlusszusammenfassung.
- Pädagogische Progression: Ordne die Kapitel logisch: Einführung → Vertiefung → Überprüfung → Zusammenfassung. Schließe mit einem Zusammenfassungskapitel mit einer Wiederholungsübung ab.
- Titelseite: Liefere ein \`cover\`-Objekt mit einer ansprechenden \`description\` von ein bis zwei Sätzen, die das Buch vorstellt.
- Kapiteltitel: Kurz und aussagekräftig — sie bilden das Inhaltsverzeichnis des Buchs.
- Verfügbare Blocktypen:
  - Textblock (text) — Erklärungen, Definitionen, Schlüsselbegriffe (Markdown erlaubt)
  - Tabellenblock (table) — Datentabelle mit Kopfzeilen und Zeilen
  - Übungsblock (exercise) — eine interaktive Übung aus den unten stehenden Typen`,
    it: `- Numero di capitoli: Almeno 3 capitoli || [NOMBRE_ELEMENTS] capitoli.
- Struttura: Ogni capitolo è una pagina di libro che impila verticalmente più blocchi (testi, tabelle, esercizi). Alterna contenuto ed esercizi ALL'INTERNO dello stesso capitolo.
- Capitoli ricchi: Punta a 2-4 blocchi per capitolo (es. 1-2 paragrafi + 1 esercizio). Evita i capitoli a blocco unico, tranne per la sintesi finale.
- Progressione didattica: Organizza i capitoli in ordine logico: introduzione → sviluppo → verifica → sintesi. Termina con un capitolo di sintesi con un esercizio riepilogativo.
- Copertina: Fornisci un oggetto \`cover\` con una \`description\` accattivante di una o due frasi che presenti il libro.
- Titoli dei capitoli: Brevi ed espliciti — formano l'indice del libro.
- Tipi di blocchi disponibili:
  - Blocco di testo (text) — spiegazioni, definizioni, concetti chiave (Markdown consentito)
  - Blocco tabella (table) — tabella di dati con intestazioni e righe
  - Blocco esercizio (exercise) — un esercizio interattivo tra i tipi seguenti`,
    nl: `- Aantal hoofdstukken: Minstens 3 hoofdstukken || [NOMBRE_ELEMENTS] hoofdstukken.
- Structuur: Elk hoofdstuk is een boekpagina die meerdere blokken verticaal stapelt (teksten, tabellen, oefeningen). Wissel inhoud en oefeningen af BINNEN hetzelfde hoofdstuk.
- Rijke hoofdstukken: Streef naar 2 tot 4 blokken per hoofdstuk (bv. 1-2 alinea's + 1 oefening). Vermijd hoofdstukken met één blok, behalve voor de eindsamenvatting.
- Pedagogische opbouw: Orden de hoofdstukken logisch: inleiding → uitwerking → controle → samenvatting. Eindig met een samenvattend hoofdstuk met een herhalingsoefening.
- Omslag: Lever een \`cover\`-object met een pakkende \`description\` van één of twee zinnen die het boek voorstelt.
- Hoofdstuktitels: Kort en duidelijk — ze vormen de inhoudsopgave van het boek.
- Beschikbare bloktypes:
  - Tekstblok (text) — uitleg, definities, kernbegrippen (Markdown toegestaan)
  - Tabelblok (table) — gegevenstabel met kopteksten en rijen
  - Oefenblok (exercise) — een interactieve oefening uit de onderstaande types`,
    pt: `- Número de capítulos: Pelo menos 3 capítulos || [NOMBRE_ELEMENTS] capítulos.
- Estrutura: Cada capítulo é uma página de livro que empilha verticalmente vários blocos (textos, tabelas, exercícios). Alterne conteúdo e exercícios DENTRO do mesmo capítulo.
- Capítulos ricos: Procure ter 2 a 4 blocos por capítulo (ex.: 1-2 parágrafos + 1 exercício). Evite capítulos com um único bloco, exceto para a síntese final.
- Progressão pedagógica: Organize os capítulos numa ordem lógica: introdução → desenvolvimento → verificação → síntese. Termine com um capítulo de síntese com um exercício recapitulativo.
- Capa: Forneça um objeto \`cover\` com uma \`description\` cativante de uma ou duas frases a apresentar o livro.
- Títulos dos capítulos: Curtos e explícitos — formam o índice do livro.
- Tipos de blocos disponíveis:
  - Bloco de texto (text) — explicações, definições, conceitos-chave (Markdown permitido)
  - Bloco de tabela (table) — tabela de dados com cabeçalhos e linhas
  - Bloco de exercício (exercise) — um exercício interativo entre os tipos abaixo`,
    ar: `- عدد الفصول: 3 فصول على الأقل || [NOMBRE_ELEMENTS] فصول.
- البنية: كل فصل هو صفحة كتاب تكدّس عموديًا عدة كتل (نصوص، جداول، تمارين). ناوب بين المحتوى والتمارين داخل الفصل نفسه.
- ثراء الفصول: استهدف من 2 إلى 4 كتل لكل فصل (مثلاً: فقرة أو فقرتان + تمرين). تجنّب الفصول ذات الكتلة الواحدة، باستثناء الملخص النهائي.
- التدرج التربوي: نظّم الفصول بترتيب منطقي: مقدمة → تطوير → تحقق → ملخص. اختم بفصل ملخص يتضمن تمرين مراجعة.
- الغلاف: قدّم كائن \`cover\` مع \`description\` جذابة من جملة أو جملتين تقدّم الكتاب.
- عناوين الفصول: قصيرة وواضحة — فهي تشكّل جدول محتويات الكتاب.
- أنواع الكتل المتاحة:
  - كتلة نص (text) — شروحات وتعريفات ومفاهيم أساسية (يُسمح بـ Markdown)
  - كتلة جدول (table) — جدول بيانات برؤوس وصفوف
  - كتلة تمرين (exercise) — تمرين تفاعلي من الأنواع أدناه`,
    zh: `- 章节数量：至少 3 个章节 || [NOMBRE_ELEMENTS] 个章节。
- 结构：每个章节是一页书页，垂直叠放多个内容块（文本、表格、练习）。在同一章节内交替安排内容和练习。
- 丰富的章节：每章 2 到 4 个内容块（例如 1-2 个段落 + 1 个练习）。除最终总结外，避免只有一个内容块的章节。
- 教学进度：按逻辑顺序组织章节：引入 → 展开 → 检验 → 总结。以包含回顾练习的总结章节结尾。
- 封面：提供一个 \`cover\` 对象，其 \`description\` 用一两句吸引人的话介绍本书。
- 章节标题：简短明确——它们构成图书的目录。
- 可用的内容块类型：
  - 文本块 (text) — 解释、定义、关键概念（允许 Markdown）
  - 表格块 (table) — 带表头和行的数据表格
  - 练习块 (exercise) — 从以下类型中选择的互动练习`,
    jp: `- 章の数：最低3章 || [NOMBRE_ELEMENTS] 章。
- 構成：各章は、複数のブロック（テキスト、表、練習問題）を縦に積み重ねるブックページです。同じ章の中で内容と練習問題を交互に配置してください。
- 章の充実度：1章あたり2〜4ブロックを目指してください（例：段落1〜2個＋練習問題1個）。最終まとめを除き、ブロックが1つだけの章は避けてください。
- 教育的な流れ：章を論理的な順序で構成してください：導入 → 展開 → 確認 → まとめ。振り返り問題を含むまとめの章で締めくくってください。
- 表紙：本を紹介する1〜2文の魅力的な \`description\` を持つ \`cover\` オブジェクトを提供してください。
- 章のタイトル：短く明確に — それらがブックの目次になります。
- 利用可能なブロックの種類：
  - テキストブロック (text) — 説明、定義、重要概念（Markdown可）
  - 表ブロック (table) — ヘッダーと行を持つデータ表
  - 練習ブロック (exercise) — 以下の種類から選ぶインタラクティブな練習問題`,
    el: `- Αριθμός κεφαλαίων: Τουλάχιστον 3 κεφάλαια || [NOMBRE_ELEMENTS] κεφάλαια.
- Δομή: Κάθε κεφάλαιο είναι μια σελίδα βιβλίου που στοιβάζει κάθετα πολλά μπλοκ (κείμενα, πίνακες, ασκήσεις). Εναλλάσσετε περιεχόμενο και ασκήσεις ΜΕΣΑ στο ίδιο κεφάλαιο.
- Πλούσια κεφάλαια: Στοχεύστε σε 2 έως 4 μπλοκ ανά κεφάλαιο (π.χ. 1-2 παράγραφοι + 1 άσκηση). Αποφύγετε κεφάλαια με ένα μόνο μπλοκ, εκτός από την τελική σύνοψη.
- Παιδαγωγική πρόοδος: Οργανώστε τα κεφάλαια με λογική σειρά: εισαγωγή → ανάπτυξη → έλεγχος → σύνοψη. Ολοκληρώστε με ένα κεφάλαιο σύνοψης με μια ανακεφαλαιωτική άσκηση.
- Εξώφυλλο: Δώστε ένα αντικείμενο \`cover\` με μια ελκυστική \`description\` μίας ή δύο προτάσεων που παρουσιάζει το βιβλίο.
- Τίτλοι κεφαλαίων: Σύντομοι και σαφείς — σχηματίζουν τον πίνακα περιεχομένων του βιβλίου.
- Διαθέσιμοι τύποι μπλοκ:
  - Μπλοκ κειμένου (text) — εξηγήσεις, ορισμοί, βασικές έννοιες (επιτρέπεται Markdown)
  - Μπλοκ πίνακα (table) — πίνακας δεδομένων με κεφαλίδες και γραμμές
  - Μπλοκ άσκησης (exercise) — μια διαδραστική άσκηση από τους παρακάτω τύπους`,
};

// Structure JSON : corps IB par langue (la 1re ligne « Génère UNIQUEMENT… » et la
// section « Structure des objets exercice par type » sont extraites du prompt CP traduit)
const STRUCTURE_BODY = {
    fr: `- L'objet racine doit contenir :
  - \`title\` : Le titre du livre.
  - \`cover\` : Objet optionnel \`{ "description": "..." }\` — texte de la page de couverture.
  - \`chapters\` : Un tableau d'objets. Chaque objet représente un chapitre (une page du livre).

**Structure d'un chapitre :**

Chaque chapitre contient :
- \`title\` (string) : Le titre du chapitre (affiché dans la table des matières).
- \`content\` (array) : La liste ordonnée des blocs du chapitre (au moins 1 bloc).

**Structure des blocs par type :**

1. **Texte** : \`{ "type": "text", "text": "…texte avec Markdown (**gras**, *italique*)…" }\`
2. **Tableau** : \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\` : tableau de strings, \`rows\` : tableau de tableaux de strings. \`tableStyle\` optionnel : \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Exercice** : \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …champs de l'exercice… }\``,
    en: `- The root object must contain:
  - \`title\`: The book title.
  - \`cover\`: Optional object \`{ "description": "..." }\` — cover page text.
  - \`chapters\`: An array of objects. Each object represents a chapter (a page of the book).

**Chapter structure:**

Each chapter contains:
- \`title\` (string): The chapter title (shown in the table of contents).
- \`content\` (array): The ordered list of the chapter's blocks (at least 1 block).

**Block structure by type:**

1. **Text**: \`{ "type": "text", "text": "…text with Markdown (**bold**, *italic*)…" }\`
2. **Table**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: array of strings, \`rows\`: array of arrays of strings. Optional \`tableStyle\`: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Exercise**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …exercise fields… }\``,
    es: `- El objeto raíz debe contener:
  - \`title\`: El título del libro.
  - \`cover\`: Objeto opcional \`{ "description": "..." }\` — texto de la portada.
  - \`chapters\`: Un array de objetos. Cada objeto representa un capítulo (una página del libro).

**Estructura de un capítulo:**

Cada capítulo contiene:
- \`title\` (string): El título del capítulo (mostrado en el índice).
- \`content\` (array): La lista ordenada de los bloques del capítulo (al menos 1 bloque).

**Estructura de los bloques por tipo:**

1. **Texto**: \`{ "type": "text", "text": "…texto con Markdown (**negrita**, *cursiva*)…" }\`
2. **Tabla**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: array de strings, \`rows\`: array de arrays de strings. \`tableStyle\` opcional: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Ejercicio**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …campos del ejercicio… }\``,
    de: `- Das Wurzelobjekt muss enthalten:
  - \`title\`: Der Buchtitel.
  - \`cover\`: Optionales Objekt \`{ "description": "..." }\` — Text der Titelseite.
  - \`chapters\`: Ein Array von Objekten. Jedes Objekt stellt ein Kapitel dar (eine Buchseite).

**Struktur eines Kapitels:**

Jedes Kapitel enthält:
- \`title\` (string): Der Kapiteltitel (im Inhaltsverzeichnis angezeigt).
- \`content\` (array): Die geordnete Liste der Blöcke des Kapitels (mindestens 1 Block).

**Blockstruktur nach Typ:**

1. **Text**: \`{ "type": "text", "text": "…Text mit Markdown (**fett**, *kursiv*)…" }\`
2. **Tabelle**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: Array von Strings, \`rows\`: Array von String-Arrays. Optionales \`tableStyle\`: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Übung**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …Übungsfelder… }\``,
    it: `- L'oggetto radice deve contenere:
  - \`title\`: Il titolo del libro.
  - \`cover\`: Oggetto opzionale \`{ "description": "..." }\` — testo della copertina.
  - \`chapters\`: Un array di oggetti. Ogni oggetto rappresenta un capitolo (una pagina del libro).

**Struttura di un capitolo:**

Ogni capitolo contiene:
- \`title\` (string): Il titolo del capitolo (mostrato nell'indice).
- \`content\` (array): La lista ordinata dei blocchi del capitolo (almeno 1 blocco).

**Struttura dei blocchi per tipo:**

1. **Testo**: \`{ "type": "text", "text": "…testo con Markdown (**grassetto**, *corsivo*)…" }\`
2. **Tabella**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: array di stringhe, \`rows\`: array di array di stringhe. \`tableStyle\` opzionale: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Esercizio**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …campi dell'esercizio… }\``,
    nl: `- Het hoofdobject moet bevatten:
  - \`title\`: De boektitel.
  - \`cover\`: Optioneel object \`{ "description": "..." }\` — tekst van de omslagpagina.
  - \`chapters\`: Een array van objecten. Elk object stelt een hoofdstuk voor (een boekpagina).

**Structuur van een hoofdstuk:**

Elk hoofdstuk bevat:
- \`title\` (string): De hoofdstuktitel (getoond in de inhoudsopgave).
- \`content\` (array): De geordende lijst van blokken van het hoofdstuk (minstens 1 blok).

**Blokstructuur per type:**

1. **Tekst**: \`{ "type": "text", "text": "…tekst met Markdown (**vet**, *cursief*)…" }\`
2. **Tabel**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: array van strings, \`rows\`: array van arrays van strings. Optionele \`tableStyle\`: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Oefening**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …oefeningsvelden… }\``,
    pt: `- O objeto raiz deve conter:
  - \`title\`: O título do livro.
  - \`cover\`: Objeto opcional \`{ "description": "..." }\` — texto da capa.
  - \`chapters\`: Um array de objetos. Cada objeto representa um capítulo (uma página do livro).

**Estrutura de um capítulo:**

Cada capítulo contém:
- \`title\` (string): O título do capítulo (mostrado no índice).
- \`content\` (array): A lista ordenada dos blocos do capítulo (pelo menos 1 bloco).

**Estrutura dos blocos por tipo:**

1. **Texto**: \`{ "type": "text", "text": "…texto com Markdown (**negrito**, *itálico*)…" }\`
2. **Tabela**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: array de strings, \`rows\`: array de arrays de strings. \`tableStyle\` opcional: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Exercício**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …campos do exercício… }\``,
    ar: `- يجب أن يحتوي الكائن الجذر على:
  - \`title\`: عنوان الكتاب.
  - \`cover\`: كائن اختياري \`{ "description": "..." }\` — نص صفحة الغلاف.
  - \`chapters\`: مصفوفة من الكائنات. يمثل كل كائن فصلًا (صفحة من الكتاب).

**بنية الفصل:**

يحتوي كل فصل على:
- \`title\` (string): عنوان الفصل (يظهر في جدول المحتويات).
- \`content\` (array): القائمة المرتبة لكتل الفصل (كتلة واحدة على الأقل).

**بنية الكتل حسب النوع:**

1. **نص**: \`{ "type": "text", "text": "…نص مع Markdown (**غامق**، *مائل*)…" }\`
2. **جدول**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: مصفوفة سلاسل، \`rows\`: مصفوفة من مصفوفات السلاسل. \`tableStyle\` اختياري: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **تمرين**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …حقول التمرين… }\``,
    zh: `- 根对象必须包含：
  - \`title\`：图书标题。
  - \`cover\`：可选对象 \`{ "description": "..." }\` — 封面页文字。
  - \`chapters\`：对象数组。每个对象代表一个章节（书的一页）。

**章节结构：**

每个章节包含：
- \`title\` (string)：章节标题（显示在目录中）。
- \`content\` (array)：章节内容块的有序列表（至少 1 个内容块）。

**各类型内容块的结构：**

1. **文本**：\`{ "type": "text", "text": "…带 Markdown 的文本（**加粗**、*斜体*）…" }\`
2. **表格**：\`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`：字符串数组，\`rows\`：字符串数组的数组。可选 \`tableStyle\`：\`default\`、\`striped\`、\`bordered\`、\`dark-header\`、\`minimal\`、\`dsfr\`。
3. **练习**：\`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …练习字段… }\``,
    jp: `- ルートオブジェクトには以下が必要です：
  - \`title\`：ブックのタイトル。
  - \`cover\`：任意のオブジェクト \`{ "description": "..." }\` — 表紙ページのテキスト。
  - \`chapters\`：オブジェクトの配列。各オブジェクトは1つの章（ブックの1ページ）を表します。

**章の構造：**

各章には以下が含まれます：
- \`title\` (string)：章のタイトル（目次に表示）。
- \`content\` (array)：章のブロックの順序付きリスト（最低1ブロック）。

**種類別のブロック構造：**

1. **テキスト**：\`{ "type": "text", "text": "…Markdown付きテキスト（**太字**、*斜体*）…" }\`
2. **表**：\`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`：文字列の配列、\`rows\`：文字列配列の配列。\`tableStyle\` は任意：\`default\`、\`striped\`、\`bordered\`、\`dark-header\`、\`minimal\`、\`dsfr\`。
3. **練習問題**：\`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …練習問題のフィールド… }\``,
    el: `- Το ριζικό αντικείμενο πρέπει να περιέχει:
  - \`title\`: Ο τίτλος του βιβλίου.
  - \`cover\`: Προαιρετικό αντικείμενο \`{ "description": "..." }\` — κείμενο του εξωφύλλου.
  - \`chapters\`: Ένας πίνακας αντικειμένων. Κάθε αντικείμενο αντιπροσωπεύει ένα κεφάλαιο (μια σελίδα του βιβλίου).

**Δομή ενός κεφαλαίου:**

Κάθε κεφάλαιο περιέχει:
- \`title\` (string): Ο τίτλος του κεφαλαίου (εμφανίζεται στον πίνακα περιεχομένων).
- \`content\` (array): Η διατεταγμένη λίστα των μπλοκ του κεφαλαίου (τουλάχιστον 1 μπλοκ).

**Δομή των μπλοκ ανά τύπο:**

1. **Κείμενο**: \`{ "type": "text", "text": "…κείμενο με Markdown (**έντονα**, *πλάγια*)…" }\`
2. **Πίνακας**: \`{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }\` — \`headers\`: πίνακας συμβολοσειρών, \`rows\`: πίνακας πινάκων συμβολοσειρών. Προαιρετικό \`tableStyle\`: \`default\`, \`striped\`, \`bordered\`, \`dark-header\`, \`minimal\`, \`dsfr\`.
3. **Άσκηση**: \`{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …πεδία της άσκησης… }\``,
};

// =====================================================================
// 4. EXEMPLE DE RENDU — chaînes pédagogiques par langue (le système solaire)
// =====================================================================

const EXAMPLE_STRINGS = {
    fr: {
        title: 'Le système solaire',
        cover: 'Un voyage interactif à travers les huit planètes de notre système solaire.',
        ch1: 'Introduction',
        ch1Text: "Le **système solaire** s'est formé il y a environ *4,6 milliards d'années*. Il comprend le Soleil et huit planètes.",
        tableHeaders: ['Planète', 'Type', 'Lunes'],
        tableRows: [['Mercure', 'Tellurique', '0'], ['Terre', 'Tellurique', '1'], ['Jupiter', 'Gazeuse', '95']],
        q1: 'Combien de planètes compte le système solaire ?',
        q1a1: 'Huit', q1fb1: 'Exact !',
        q1a2: 'Neuf', q1fb2: 'Pluton est une planète naine depuis 2006.',
        q1a3: 'Sept',
        ch2: 'Les planètes telluriques',
        ch2Text: 'Les planètes **telluriques** (Mercure, Vénus, Terre, Mars) sont rocheuses et proches du Soleil.',
        blanksTask: 'Complétez la phrase.',
        blanksQ: 'La planète la plus proche du Soleil est *Mercure*.',
        tfQ: 'Mars est surnommée la planète rouge.',
        tfOk: 'Bravo !', tfKo: "Si, à cause de l'oxyde de fer à sa surface.",
        ch3: 'Synthèse',
        sumIntro: 'Choisissez les affirmations correctes.',
        sumGroup: ['La Terre possède une lune', 'La Terre possède deux lunes', 'La Terre ne possède aucune lune'],
        fb: ['Revoyez les points clés du livre.', "C'est un début, continuez !", 'Bon travail !', 'Excellent !'],
    },
    en: {
        title: 'The Solar System',
        cover: 'An interactive journey through the eight planets of our solar system.',
        ch1: 'Introduction',
        ch1Text: 'The **solar system** formed about *4.6 billion years ago*. It includes the Sun and eight planets.',
        tableHeaders: ['Planet', 'Type', 'Moons'],
        tableRows: [['Mercury', 'Terrestrial', '0'], ['Earth', 'Terrestrial', '1'], ['Jupiter', 'Gas giant', '95']],
        q1: 'How many planets are there in the solar system?',
        q1a1: 'Eight', q1fb1: 'Correct!',
        q1a2: 'Nine', q1fb2: 'Pluto has been a dwarf planet since 2006.',
        q1a3: 'Seven',
        ch2: 'The terrestrial planets',
        ch2Text: 'The **terrestrial** planets (Mercury, Venus, Earth, Mars) are rocky and close to the Sun.',
        blanksTask: 'Complete the sentence.',
        blanksQ: 'The planet closest to the Sun is *Mercury*.',
        tfQ: 'Mars is nicknamed the red planet.',
        tfOk: 'Well done!', tfKo: 'It is, because of the iron oxide on its surface.',
        ch3: 'Summary',
        sumIntro: 'Choose the correct statements.',
        sumGroup: ['The Earth has one moon', 'The Earth has two moons', 'The Earth has no moon'],
        fb: ['Review the key points of the book.', 'A good start, keep going!', 'Good work!', 'Excellent!'],
    },
    es: {
        title: 'El sistema solar',
        cover: 'Un viaje interactivo a través de los ocho planetas de nuestro sistema solar.',
        ch1: 'Introducción',
        ch1Text: 'El **sistema solar** se formó hace unos *4600 millones de años*. Incluye el Sol y ocho planetas.',
        tableHeaders: ['Planeta', 'Tipo', 'Lunas'],
        tableRows: [['Mercurio', 'Rocoso', '0'], ['Tierra', 'Rocoso', '1'], ['Júpiter', 'Gaseoso', '95']],
        q1: '¿Cuántos planetas tiene el sistema solar?',
        q1a1: 'Ocho', q1fb1: '¡Exacto!',
        q1a2: 'Nueve', q1fb2: 'Plutón es un planeta enano desde 2006.',
        q1a3: 'Siete',
        ch2: 'Los planetas rocosos',
        ch2Text: 'Los planetas **rocosos** (Mercurio, Venus, Tierra, Marte) son sólidos y están cerca del Sol.',
        blanksTask: 'Complete la frase.',
        blanksQ: 'El planeta más cercano al Sol es *Mercurio*.',
        tfQ: 'Marte es apodado el planeta rojo.',
        tfOk: '¡Bravo!', tfKo: 'Sí lo es, por el óxido de hierro de su superficie.',
        ch3: 'Síntesis',
        sumIntro: 'Elija las afirmaciones correctas.',
        sumGroup: ['La Tierra tiene una luna', 'La Tierra tiene dos lunas', 'La Tierra no tiene ninguna luna'],
        fb: ['Repase los puntos clave del libro.', '¡Buen comienzo, continúe!', '¡Buen trabajo!', '¡Excelente!'],
    },
    de: {
        title: 'Das Sonnensystem',
        cover: 'Eine interaktive Reise durch die acht Planeten unseres Sonnensystems.',
        ch1: 'Einführung',
        ch1Text: 'Das **Sonnensystem** entstand vor etwa *4,6 Milliarden Jahren*. Es umfasst die Sonne und acht Planeten.',
        tableHeaders: ['Planet', 'Typ', 'Monde'],
        tableRows: [['Merkur', 'Gesteinsplanet', '0'], ['Erde', 'Gesteinsplanet', '1'], ['Jupiter', 'Gasplanet', '95']],
        q1: 'Wie viele Planeten hat das Sonnensystem?',
        q1a1: 'Acht', q1fb1: 'Richtig!',
        q1a2: 'Neun', q1fb2: 'Pluto ist seit 2006 ein Zwergplanet.',
        q1a3: 'Sieben',
        ch2: 'Die Gesteinsplaneten',
        ch2Text: 'Die **Gesteinsplaneten** (Merkur, Venus, Erde, Mars) sind felsig und sonnennah.',
        blanksTask: 'Vervollständigen Sie den Satz.',
        blanksQ: 'Der sonnennächste Planet ist *Merkur*.',
        tfQ: 'Mars wird der rote Planet genannt.',
        tfOk: 'Bravo!', tfKo: 'Doch, wegen des Eisenoxids auf seiner Oberfläche.',
        ch3: 'Zusammenfassung',
        sumIntro: 'Wählen Sie die richtigen Aussagen.',
        sumGroup: ['Die Erde hat einen Mond', 'Die Erde hat zwei Monde', 'Die Erde hat keinen Mond'],
        fb: ['Wiederholen Sie die Kernpunkte des Buchs.', 'Ein guter Anfang, weiter so!', 'Gute Arbeit!', 'Ausgezeichnet!'],
    },
    it: {
        title: 'Il sistema solare',
        cover: 'Un viaggio interattivo attraverso gli otto pianeti del nostro sistema solare.',
        ch1: 'Introduzione',
        ch1Text: 'Il **sistema solare** si è formato circa *4,6 miliardi di anni fa*. Comprende il Sole e otto pianeti.',
        tableHeaders: ['Pianeta', 'Tipo', 'Lune'],
        tableRows: [['Mercurio', 'Roccioso', '0'], ['Terra', 'Roccioso', '1'], ['Giove', 'Gassoso', '95']],
        q1: 'Quanti pianeti conta il sistema solare?',
        q1a1: 'Otto', q1fb1: 'Esatto!',
        q1a2: 'Nove', q1fb2: 'Plutone è un pianeta nano dal 2006.',
        q1a3: 'Sette',
        ch2: 'I pianeti rocciosi',
        ch2Text: 'I pianeti **rocciosi** (Mercurio, Venere, Terra, Marte) sono solidi e vicini al Sole.',
        blanksTask: 'Completa la frase.',
        blanksQ: 'Il pianeta più vicino al Sole è *Mercurio*.',
        tfQ: 'Marte è soprannominato il pianeta rosso.',
        tfOk: 'Bravo!', tfKo: "Sì, a causa dell'ossido di ferro sulla sua superficie.",
        ch3: 'Sintesi',
        sumIntro: 'Scegli le affermazioni corrette.',
        sumGroup: ['La Terra ha una luna', 'La Terra ha due lune', 'La Terra non ha nessuna luna'],
        fb: ['Rivedi i punti chiave del libro.', 'Un buon inizio, continua!', 'Buon lavoro!', 'Eccellente!'],
    },
    nl: {
        title: 'Het zonnestelsel',
        cover: 'Een interactieve reis langs de acht planeten van ons zonnestelsel.',
        ch1: 'Inleiding',
        ch1Text: 'Het **zonnestelsel** ontstond ongeveer *4,6 miljard jaar geleden*. Het omvat de zon en acht planeten.',
        tableHeaders: ['Planeet', 'Type', 'Manen'],
        tableRows: [['Mercurius', 'Rotsplaneet', '0'], ['Aarde', 'Rotsplaneet', '1'], ['Jupiter', 'Gasreus', '95']],
        q1: 'Hoeveel planeten telt het zonnestelsel?',
        q1a1: 'Acht', q1fb1: 'Juist!',
        q1a2: 'Negen', q1fb2: 'Pluto is sinds 2006 een dwergplaneet.',
        q1a3: 'Zeven',
        ch2: 'De rotsplaneten',
        ch2Text: 'De **rotsplaneten** (Mercurius, Venus, Aarde, Mars) zijn rotsachtig en staan dicht bij de zon.',
        blanksTask: 'Vul de zin aan.',
        blanksQ: 'De planeet die het dichtst bij de zon staat is *Mercurius*.',
        tfQ: 'Mars wordt de rode planeet genoemd.',
        tfOk: 'Goed zo!', tfKo: 'Toch wel, door het ijzeroxide op het oppervlak.',
        ch3: 'Samenvatting',
        sumIntro: 'Kies de juiste beweringen.',
        sumGroup: ['De aarde heeft één maan', 'De aarde heeft twee manen', 'De aarde heeft geen maan'],
        fb: ['Bekijk de kernpunten van het boek opnieuw.', 'Een goed begin, ga door!', 'Goed werk!', 'Uitstekend!'],
    },
    pt: {
        title: 'O sistema solar',
        cover: 'Uma viagem interativa pelos oito planetas do nosso sistema solar.',
        ch1: 'Introdução',
        ch1Text: 'O **sistema solar** formou-se há cerca de *4,6 mil milhões de anos*. Inclui o Sol e oito planetas.',
        tableHeaders: ['Planeta', 'Tipo', 'Luas'],
        tableRows: [['Mercúrio', 'Rochoso', '0'], ['Terra', 'Rochoso', '1'], ['Júpiter', 'Gasoso', '95']],
        q1: 'Quantos planetas tem o sistema solar?',
        q1a1: 'Oito', q1fb1: 'Exato!',
        q1a2: 'Nove', q1fb2: 'Plutão é um planeta anão desde 2006.',
        q1a3: 'Sete',
        ch2: 'Os planetas rochosos',
        ch2Text: 'Os planetas **rochosos** (Mercúrio, Vénus, Terra, Marte) são sólidos e próximos do Sol.',
        blanksTask: 'Complete a frase.',
        blanksQ: 'O planeta mais próximo do Sol é *Mercúrio*.',
        tfQ: 'Marte é apelidado de planeta vermelho.',
        tfOk: 'Bravo!', tfKo: 'É sim, por causa do óxido de ferro na sua superfície.',
        ch3: 'Síntese',
        sumIntro: 'Escolha as afirmações corretas.',
        sumGroup: ['A Terra tem uma lua', 'A Terra tem duas luas', 'A Terra não tem nenhuma lua'],
        fb: ['Reveja os pontos-chave do livro.', 'Um bom começo, continue!', 'Bom trabalho!', 'Excelente!'],
    },
    ar: {
        title: 'النظام الشمسي',
        cover: 'رحلة تفاعلية عبر الكواكب الثمانية في نظامنا الشمسي.',
        ch1: 'مقدمة',
        ch1Text: 'تشكّل **النظام الشمسي** قبل نحو *4.6 مليار سنة*. وهو يضم الشمس وثمانية كواكب.',
        tableHeaders: ['الكوكب', 'النوع', 'الأقمار'],
        tableRows: [['عطارد', 'صخري', '0'], ['الأرض', 'صخري', '1'], ['المشتري', 'غازي', '95']],
        q1: 'كم عدد كواكب النظام الشمسي؟',
        q1a1: 'ثمانية', q1fb1: 'صحيح!',
        q1a2: 'تسعة', q1fb2: 'بلوتو كوكب قزم منذ 2006.',
        q1a3: 'سبعة',
        ch2: 'الكواكب الصخرية',
        ch2Text: 'الكواكب **الصخرية** (عطارد، الزهرة، الأرض، المريخ) صلبة وقريبة من الشمس.',
        blanksTask: 'أكمل الجملة.',
        blanksQ: 'أقرب كوكب إلى الشمس هو *عطارد*.',
        tfQ: 'يُلقّب المريخ بالكوكب الأحمر.',
        tfOk: 'أحسنت!', tfKo: 'بلى، بسبب أكسيد الحديد على سطحه.',
        ch3: 'ملخص',
        sumIntro: 'اختر العبارات الصحيحة.',
        sumGroup: ['للأرض قمر واحد', 'للأرض قمران', 'ليس للأرض أي قمر'],
        fb: ['راجع النقاط الأساسية في الكتاب.', 'بداية جيدة، واصل!', 'عمل جيد!', 'ممتاز!'],
    },
    zh: {
        title: '太阳系',
        cover: '一段穿越太阳系八大行星的互动之旅。',
        ch1: '引言',
        ch1Text: '**太阳系**形成于大约 *46 亿年前*，包括太阳和八大行星。',
        tableHeaders: ['行星', '类型', '卫星数'],
        tableRows: [['水星', '类地行星', '0'], ['地球', '类地行星', '1'], ['木星', '气态行星', '95']],
        q1: '太阳系有多少颗行星？',
        q1a1: '八颗', q1fb1: '正确！',
        q1a2: '九颗', q1fb2: '冥王星自 2006 年起被列为矮行星。',
        q1a3: '七颗',
        ch2: '类地行星',
        ch2Text: '**类地行星**（水星、金星、地球、火星）是岩石构成的，靠近太阳。',
        blanksTask: '补全句子。',
        blanksQ: '离太阳最近的行星是*水星*。',
        tfQ: '火星被称为红色星球。',
        tfOk: '答对了！', tfKo: '是的，因为其表面覆盖着氧化铁。',
        ch3: '总结',
        sumIntro: '选择正确的说法。',
        sumGroup: ['地球有一颗卫星', '地球有两颗卫星', '地球没有卫星'],
        fb: ['请复习本书的要点。', '不错的开始，继续！', '做得好！', '太棒了！'],
    },
    jp: {
        title: '太陽系',
        cover: '太陽系の8つの惑星をめぐるインタラクティブな旅。',
        ch1: 'はじめに',
        ch1Text: '**太陽系**は約*46億年前*に形成されました。太陽と8つの惑星で構成されています。',
        tableHeaders: ['惑星', '種類', '衛星数'],
        tableRows: [['水星', '岩石惑星', '0'], ['地球', '岩石惑星', '1'], ['木星', 'ガス惑星', '95']],
        q1: '太陽系には惑星がいくつありますか？',
        q1a1: '8つ', q1fb1: '正解！',
        q1a2: '9つ', q1fb2: '冥王星は2006年から準惑星です。',
        q1a3: '7つ',
        ch2: '岩石惑星',
        ch2Text: '**岩石惑星**（水星、金星、地球、火星）は岩石でできており、太陽に近い惑星です。',
        blanksTask: '文を完成させましょう。',
        blanksQ: '太陽に最も近い惑星は*水星*です。',
        tfQ: '火星は赤い惑星と呼ばれています。',
        tfOk: 'よくできました！', tfKo: 'いいえ、表面の酸化鉄のためにそう呼ばれています。',
        ch3: 'まとめ',
        sumIntro: '正しい文を選んでください。',
        sumGroup: ['地球には衛星が1つある', '地球には衛星が2つある', '地球には衛星がない'],
        fb: ['本の要点を復習しましょう。', '良いスタートです。続けましょう！', 'よくできました！', '素晴らしい！'],
    },
    el: {
        title: 'Το ηλιακό σύστημα',
        cover: 'Ένα διαδραστικό ταξίδι στους οκτώ πλανήτες του ηλιακού μας συστήματος.',
        ch1: 'Εισαγωγή',
        ch1Text: 'Το **ηλιακό σύστημα** σχηματίστηκε πριν από περίπου *4,6 δισεκατομμύρια χρόνια*. Περιλαμβάνει τον Ήλιο και οκτώ πλανήτες.',
        tableHeaders: ['Πλανήτης', 'Τύπος', 'Δορυφόροι'],
        tableRows: [['Ερμής', 'Βραχώδης', '0'], ['Γη', 'Βραχώδης', '1'], ['Δίας', 'Αέριος', '95']],
        q1: 'Πόσους πλανήτες έχει το ηλιακό σύστημα;',
        q1a1: 'Οκτώ', q1fb1: 'Σωστά!',
        q1a2: 'Εννέα', q1fb2: 'Ο Πλούτωνας είναι νάνος πλανήτης από το 2006.',
        q1a3: 'Επτά',
        ch2: 'Οι βραχώδεις πλανήτες',
        ch2Text: 'Οι **βραχώδεις** πλανήτες (Ερμής, Αφροδίτη, Γη, Άρης) είναι πετρώδεις και κοντά στον Ήλιο.',
        blanksTask: 'Συμπληρώστε την πρόταση.',
        blanksQ: 'Ο πλανήτης που βρίσκεται πιο κοντά στον Ήλιο είναι ο *Ερμής*.',
        tfQ: 'Ο Άρης αποκαλείται ο κόκκινος πλανήτης.',
        tfOk: 'Μπράβο!', tfKo: 'Κι όμως, λόγω του οξειδίου του σιδήρου στην επιφάνειά του.',
        ch3: 'Σύνοψη',
        sumIntro: 'Επιλέξτε τις σωστές προτάσεις.',
        sumGroup: ['Η Γη έχει έναν δορυφόρο', 'Η Γη έχει δύο δορυφόρους', 'Η Γη δεν έχει κανέναν δορυφόρο'],
        fb: ['Ξαναδείτε τα βασικά σημεία του βιβλίου.', 'Καλή αρχή, συνεχίστε!', 'Καλή δουλειά!', 'Εξαιρετικά!'],
    },
};

/** Construit l'objet exemple complet d'une langue. */
function buildExample(L) {
    const FB = L.fb.map((feedback, i) => ({
        from: [0, 26, 51, 76][i],
        to: [25, 50, 75, 100][i],
        feedback,
    }));
    return {
        title: L.title,
        cover: { description: L.cover },
        chapters: [
            {
                title: L.ch1,
                content: [
                    { type: 'text', text: L.ch1Text },
                    { type: 'table', tableStyle: 'default', table: { headers: L.tableHeaders, rows: L.tableRows } },
                    {
                        type: 'exercise', library: 'H5P.MultiChoice 1.16',
                        question: L.q1,
                        answers: [
                            { text: L.q1a1, correct: true, tipsAndFeedback: { chosenFeedback: L.q1fb1 } },
                            { text: L.q1a2, correct: false, tipsAndFeedback: { chosenFeedback: L.q1fb2 } },
                            { text: L.q1a3, correct: false },
                        ],
                        behaviour: { singleAnswer: true },
                        overallFeedback: FB,
                    },
                ],
            },
            {
                title: L.ch2,
                content: [
                    { type: 'text', text: L.ch2Text },
                    {
                        type: 'exercise', library: 'H5P.Blanks 1.14',
                        taskDescription: L.blanksTask,
                        questions: [L.blanksQ],
                        overallFeedback: FB,
                    },
                    {
                        type: 'exercise', library: 'H5P.TrueFalse 1.8',
                        question: L.tfQ,
                        correct: 'true',
                        feedbackOnCorrect: L.tfOk,
                        feedbackOnWrong: L.tfKo,
                    },
                ],
            },
            {
                title: L.ch3,
                content: [
                    {
                        type: 'exercise', library: 'H5P.Summary 1.10',
                        intro: L.sumIntro,
                        summaries: [{ summary: L.sumGroup }],
                        overallFeedback: FB,
                    },
                ],
            },
        ],
    };
}

// =====================================================================
// 5. EXTRACTION DES SECTIONS EXERCICES DU PROMPT CP (déjà traduites)
// =====================================================================

/** Extrait la liste des types d'exercices (dernière puce de niveau 1) du regles CP. */
function extractReglesTail(cpRegles, lang) {
    const idx = cpRegles.lastIndexOf('\n- ');
    if (idx === -1) throw new Error(`[${lang}] liste d'exercices introuvable dans prompt_course_presentation_regles_specifiques`);
    const tail = cpRegles.substring(idx + 1);
    const subBullets = (tail.match(/\n  - /g) || []).length;
    if (subBullets < 5) throw new Error(`[${lang}] regles tail suspect (${subBullets} sous-puces)`);
    return tail;
}

/**
 * Corrige une duplication héritée du script de traduction CP : le corps de
 * prompt_course_presentation_structure_json apparaît deux fois (copie 1 sans la
 * règle « Feedback », copie 2 avec). Reconstruit : copie 1 + lignes finales de
 * la copie 2 absentes de la copie 1. Idempotent (retourne tel quel si pas de doublon).
 */
function dedupeCpStructure(cpStruct, lang) {
    const lines = cpStruct.split('\n');
    if (lines.length < 3) return cpStruct;
    const rootLine = lines[1];
    const secondRootIdx = lines.indexOf(rootLine, 2);
    if (secondRootIdx === -1) return cpStruct; // pas de duplication

    const copy1 = lines.slice(0, secondRootIdx);

    // Réparer la dernière ligne de la copie 1 (règle LaTeX) : le vieux script y a
    // concaténé la 1re ligne du prompt (zh/jp/el) → couper à cet endroit.
    let latexLine = copy1[copy1.length - 1];
    const junkIdx = latexLine.indexOf(lines[0]);
    if (junkIdx > 0) latexLine = latexLine.slice(0, junkIdx);

    // Dans la copie 2, la ligne « Chaque exercice scoré… » est concaténée avec la FIN
    // de la règle LaTeX (les exemples \frac, \sqrt…) → récupérer ce fragment s'il manque.
    const scoreLine = copy1.findLast(l => l.startsWith('**') && l.endsWith('**'));
    if (!scoreLine) throw new Error(`[${lang}] ligne de clôture exercices introuvable`);
    const lastScoreIdx = lines.findLastIndex(l => l.startsWith(scoreLine));
    if (lastScoreIdx < secondRootIdx) throw new Error(`[${lang}] structure CP inattendue`);
    const fragment = lines[lastScoreIdx].slice(scoreLine.length);
    if (fragment.trim() && !latexLine.includes(fragment.trim())) {
        // La corruption d'origine a coupé sur le « $ » (« `$` » ou « $ » nu) :
        // le restaurer selon le contexte de jonction.
        if (latexLine.endsWith('`')) {
            latexLine += '$`';
        } else if (latexLine.endsWith(' ') && fragment.startsWith(' ')) {
            latexLine += '$';
        }
        latexLine += fragment;
    }
    copy1[copy1.length - 1] = latexLine;

    // Lignes de règles finales de la copie 2 manquantes dans la copie 1 (ex: Feedback)
    const missingTail = lines.slice(lastScoreIdx + 1).filter(l => l.trim() && !copy1.includes(l));

    const deduped = [...copy1, ...missingTail].join('\n');
    // Sanity : une seule occurrence des sections + exemples LaTeX présents
    const mcCount = (deduped.match(/H5P\.MultiChoice 1\.16/g) || []).length;
    if (mcCount !== 1) throw new Error(`[${lang}] déduplication CP échouée (${mcCount} occurrences MultiChoice)`);
    if (!deduped.includes('frac')) throw new Error(`[${lang}] exemples LaTeX perdus lors de la déduplication`);
    console.log(`  [${lang}] prompt CP structure_json dédupliqué et réparé (${cpStruct.length} → ${deduped.length} car.)`);
    return deduped;
}

/** Extrait la section « Structure des objets exercice par type » (jusqu'à la fin) du structure_json CP. */
function extractStructureTail(cpStruct, lang) {
    const mcIdx = cpStruct.indexOf('H5P.MultiChoice 1.16');
    if (mcIdx === -1) throw new Error(`[${lang}] H5P.MultiChoice introuvable dans prompt_course_presentation_structure_json`);
    const headerIdx = cpStruct.lastIndexOf('\n**', mcIdx);
    if (headerIdx === -1) throw new Error(`[${lang}] en-tête de section exercices introuvable`);
    const tail = cpStruct.substring(headerIdx + 1);
    if (!tail.includes('H5P.Dialogcards 1.9')) throw new Error(`[${lang}] structure tail incomplet (Dialogcards absent)`);
    return tail;
}

// =====================================================================
// 6. INSERTION DANS LES LOCALES
// =====================================================================

/** Reconstruit l'objet locale en insérant `newEntries` juste après `anchorKey`. */
function insertAfter(obj, anchorKey, newEntries) {
    if (!(anchorKey in obj)) throw new Error(`Ancre introuvable : ${anchorKey}`);
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        result[k] = v;
        if (k === anchorKey) {
            for (const [nk, nv] of Object.entries(newEntries)) {
                result[nk] = nv;
            }
        }
    }
    // Les clés déjà présentes ailleurs sont écrasées à leur position d'origine
    for (const [nk, nv] of Object.entries(newEntries)) {
        result[nk] = nv;
    }
    return result;
}

function main() {
    const semantics = JSON.parse(readFileSync(join(LIB_DIR, 'semantics.json'), 'utf8'));
    const semanticsByName = {};
    semantics.forEach((entry, i) => { semanticsByName[entry.name] = i; });

    for (const lang of LANGS) {
        const file = join(LOCALES_DIR, `${lang}.json`);
        let locale = JSON.parse(readFileSync(file, 'utf8'));
        const tr = T[lang];
        if (!tr) throw new Error(`Traductions manquantes pour ${lang}`);

        // --- Étape 0 : corriger la duplication héritée du prompt CP (bug préexistant) ---
        locale.prompt_course_presentation_structure_json =
            dedupeCpStructure(locale.prompt_course_presentation_structure_json, lang);

        // --- Prompts (en-tête IB + sections exercices extraites du CP traduit) ---
        const cpRegles = locale.prompt_course_presentation_regles_specifiques;
        const cpStruct = locale.prompt_course_presentation_structure_json;
        if (!cpRegles || !cpStruct) throw new Error(`[${lang}] clés prompt CP manquantes`);
        if (!REGLES_HEAD[lang].includes('[NOMBRE_ELEMENTS]') || !REGLES_HEAD[lang].includes('||')) {
            throw new Error(`[${lang}] REGLES_HEAD sans [NOMBRE_ELEMENTS]/||`);
        }

        const reglesIB = REGLES_HEAD[lang] + '\n' + extractReglesTail(cpRegles, lang);
        const structIB = cpStruct.split('\n')[0] + '\n' + STRUCTURE_BODY[lang] + '\n\n' + extractStructureTail(cpStruct, lang);
        const exempleIB = '```json\n' + JSON.stringify(buildExample(EXAMPLE_STRINGS[lang]), null, 2) + '\n```';

        // --- Insertion groupe par groupe, à côté des clés CP correspondantes ---
        locale = insertAfter(locale, 'h5p_course_presentation_description', {
            h5p_interactive_book_name: tr.name,
            h5p_interactive_book_description: tr.description,
        });
        locale = insertAfter(locale, 'prompt_course_presentation_exemple_rendu', {
            prompt_interactive_book_regles_specifiques: reglesIB,
            prompt_interactive_book_structure_json: structIB,
            prompt_interactive_book_exemple_rendu: exempleIB,
        });
        locale = insertAfter(locale, 'h5p_cp_cancel_label', buildPlayerKeys(lang, semantics, semanticsByName));
        locale = insertAfter(locale, 'editor_cp_ex_dialogcards', tr.editor);
        locale = insertAfter(locale, 'validation_cp_no_exercise', tr.validation);
        locale = insertAfter(locale, 'doc_fmt_cp_dialogcards_no_correction', tr.docFmt);
        locale = insertAfter(locale, 'eh_cp_bad_example', tr.eh);

        // --- Tutoriel onboarding : ajouter la <li> Livre interactif avant </ul> ---
        const tuto = locale.tuto_step2_h5p_content;
        if (typeof tuto === 'string' && tuto.includes('</ul>')) {
            if (!tuto.includes(tr.tutoLi)) {
                locale.tuto_step2_h5p_content = tuto.replace('</ul>', ` ${tr.tutoLi} </ul>`);
            }
        } else {
            console.warn(`[${lang}] tuto_step2_h5p_content sans </ul> — <li> non insérée`);
        }

        const output = JSON.stringify(locale, null, 2) + '\n';
        JSON.parse(output); // sanity check
        writeFileSync(file, output, 'utf8');
        console.log(`✓ ${lang}.json — ${Object.keys(locale).length} clés`);
    }
    console.log('\nTerminé. Lancer : node scripts/verify-all-locales.mjs');
}

main();
