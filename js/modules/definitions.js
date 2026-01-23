/**
 * @file Ce fichier centralise les définitions des modules d'activités H5P et Moodle/Éléa.
 * Il exporte les objets de configuration pour chaque type d'activité,
 * un objet combiné, et un tableau définissant l'ordre d'affichage personnalisé.
 */

/**
 * @constant {Object} h5pModules
 * Définit la configuration de chaque module d'activité H5P disponible.
 * Chaque clé représente un type d'activité (ex: 'Timeline') et contient ses métadonnées.
 */
export const h5pModules = {
    Timeline: {
        name: "h5p_timeline_name",
        englishName: "Timeline",
        machineName: "H5P.Timeline",
        description: "h5p_timeline_description",
        image: "images/timeline_icon-color.webp",
        promptId: "timelineResultat",
        jsonInputId: "timelineJsonInput",
        createBtnId: "createTimelineH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Flashcards: {
        name: "h5p_flashcards_name",
        englishName: "Flashcards",
        machineName: "H5P.Flashcards",
        description: "h5p_flashcards_description",
        image: "images/flashcards-png-icon.webp",
        promptId: "flashcardsResultat",
        jsonInputId: "flashcardsJsonInput",
        createBtnId: "createFlashcardsH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSet: {
        name: "h5p_quiz_set_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_description",
        image: "images/question-set-icon.webp",
        promptId: "quizSetResultat",
        jsonInputId: "quizSetJsonInput",
        createBtnId: "createQuizSetH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSetQCM: {
        name: "h5p_quiz_set_qcm_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_qcm_description",
        image: "images/question-set-icon.webp",
        promptId: "quizSetQcmResultat",
        jsonInputId: "quizSetQcmJsonInput",
        createBtnId: "createQuizSetQcmH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSetVF: {
        name: "h5p_quiz_set_vf_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_vf_description",
        image: "images/question-set-icon.webp",
        promptId: "quizSetVfResultat",
        jsonInputId: "quizSetVfJsonInput",
        createBtnId: "createQuizSetVfH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Glossary: {
        name: "h5p_glossary_name",
        englishName: "Accordion",
        machineName: "H5P.Accordion",
        description: "h5p_glossary_description",
        image: "images/accordion-icon.webp",
        promptId: "glossaryResultat",
        jsonInputId: "glossaryJsonInput",
        createBtnId: "createGlossaryH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Crossword: {
        name: "h5p_crossword_name",
        englishName: "Crosswords",
        machineName: "H5P.Crossword",
        description: "h5p_crossword_description",
        image: "images/crosswords.webp",
        promptId: "crosswordResultat",
        jsonInputId: "crosswordJsonInput",
        createBtnId: "createCrosswordH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Essay: {
        name: "h5p_essay_name",
        englishName: "Essay",
        machineName: "H5P.Essay",
        description: "h5p_essay_description",
        image: "images/essay.webp",
        promptId: "essayResultat",
        jsonInputId: "essayJsonInput",
        createBtnId: "createEssayH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Summary: {
        name: "h5p_summary_name",
        englishName: "Summary",
        machineName: "H5P.Summary",
        description: "h5p_summary_description",
        image: "images/summary_icon.webp",
        promptId: "summaryResultat",
        jsonInputId: "summaryJsonInput",
        createBtnId: "createSummaryH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    DragTheWords: {
        name: "h5p_drag_the_words_name",
        englishName: "Drag the Words",
        machineName: "H5P.DragText",
        description: "h5p_drag_the_words_description",
        image: "images/drag-the-words-icon.webp",
        promptId: "dragWordResultat",
        jsonInputId: "dragWordJsonInput",
        createBtnId: "createDragWordH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    FillInTheBlanks: {
        name: "h5p_fill_in_the_blanks_name",
        englishName: "Fill in the Blanks",
        machineName: "H5P.Blanks",
        description: "h5p_fill_in_the_blanks_description",
        image: "images/fill-in-the-blanks-icon_0.webp",
        promptId: "blanksResultat",
        jsonInputId: "blanksJsonInput",
        createBtnId: "createBlanksH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    MarkTheWords: {
        name: "h5p_mark_the_words_name",
        englishName: "Mark the Words",
        machineName: "H5P.MarkTheWords",
        description: "h5p_mark_the_words_description",
        image: "images/mark-the-words-icon_0.webp",
        promptId: "markWordsResultat",
        jsonInputId: "markWordsJsonInput",
        createBtnId: "createMarkWordsH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    TrueFalse: {
        name: "h5p_true_false_name",
        englishName: "True/False Question",
        machineName: "H5P.TrueFalse",
        description: "h5p_true_false_description",
        image: "images/true-false.webp",
        promptId: "trueFalseResultat",
        jsonInputId: "trueFalseJsonInput",
        createBtnId: "createTrueFalseH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    MultipleChoice: {
        name: "h5p_multiple_choice_name",
        englishName: "Multiple Choice",
        machineName: "H5P.MultiChoice",
        description: "h5p_multiple_choice_description",
        image: "images/multichoice-icon_0.webp",
        promptId: "multipleChoiceResultat",
        jsonInputId: "multipleChoiceJsonInput",
        createBtnId: "createMultipleChoiceH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    FindTheWords: {
        name: "h5p_find_the_words_name",
        englishName: "Find the Words",
        machineName: "H5P.FindTheWords",
        description: "h5p_find_the_words_description",
        image: "images/word-search-h5porg.webp",
        promptId: "findTheWordsResultat",
        jsonInputId: "findTheWordsJsonInput",
        createBtnId: "createFindTheWordsH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    SortParagraphs: {
        name: "h5p_sort_the_paragraphs_name",
        englishName: "Sort the Paragraphs",
        machineName: "H5P.SortParagraphs",
        description: "h5p_sort_the_paragraphs_description",
        image: "images/sort-paragraphs.webp",
        promptId: "sortParagraphsResultat",
        jsonInputId: "sortParagraphsJsonInput",
        createBtnId: "createSortParagraphsH5P",
        categories: ["text", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    SingleChoiceSet: {
        name: "h5p_single_choice_set_name",
        englishName: "Single Choice Set",
        machineName: "H5P.SingleChoiceSet",
        description: "h5p_single_choice_set_description",
        image: "images/single-choice-set-icon_0.webp",
        promptId: "singleChoiceSetResultat",
        jsonInputId: "singleChoiceSetJsonInput",
        createBtnId: "createSingleChoiceSetH5P",
        categories: ["quiz", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    DialogCards: {
        name: "h5p_dialog_cards_name",
        englishName: "Dialog Cards",
        machineName: "H5P.Dialogcards",
        description: "h5p_dialog_cards_description",
        image: "images/dialog_cards_icon-color.webp",
        promptId: "dialogCardsResultat",
        jsonInputId: "dialogCardsJsonInput",
        createBtnId: "createDialogCardsH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    ComplexFillTheBlanks: {
        name: "h5p_complex_fill_the_blanks_name",
        englishName: "Complex fill the blanks",
        machineName: "H5P.AdvancedBlanks",
        description: "h5p_complex_fill_the_blanks_description",
        image: "images/advanced-fill-in-the-blanks.webp",
        promptId: "complexBlanksResultat",
        jsonInputId: "complexBlanksJsonInput",
        createBtnId: "createComplexBlanksH5P",
        hidden: true,
        categories: [],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Chart: {
        name: "h5p_chart_name",
        englishName: "Chart",
        machineName: "H5P.Chart",
        description: "h5p_chart_description",
        image: "images/chart-icon-color.webp",
        promptId: "chartResultat",
        jsonInputId: "chartJsonInput",
        createBtnId: "createChartH5P",
        categories: ["memory", "h5p"],
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    }
};

/**
 * @constant {Object} moodleModules
 * Définit la configuration de chaque module d'activité Moodle/Éléa disponible.
 */
export const moodleModules = {
    moodleXml: {
        name: "moodle_xml_name",
        description: "moodle_xml_description",
        image: "images/test.webp",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        formats: ["XML", "GIFT", "DOCX", "ODT", "PDF"]
    },
    glossaireXml: {
        name: "moodle_glossaire_xml_name",
        description: "moodle_glossaire_xml_description",
        image: "images/glossaire.webp",
        categories: ["memory", "elea"],
        platforms: ["Éléa"],
        formats: ["XML", "DOCX", "ODT", "PDF"]
    },
    Millionnaire: {
        name: "moodle_millionnaire_name",
        description: "moodle_millionnaire_description",
        image: "images/millionnaire.webp",
        promptId: "millionnaireResultat",
        jsonInputId: "millionnaireJsonInput",
        createBtnId: "createMillionnaireMBZ",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    Appariement: {
        name: "moodle_appariement_name",
        description: "moodle_appariement_description",
        image: "images/appariement.webp",
        promptId: "appariementResultat",
        jsonInputId: "appariementJsonInput",
        createBtnId: "createAppariementMBZ",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    QCM: {
        name: "moodle_qcm_name",
        description: "moodle_qcm_description",
        image: "images/qcm.webp",
        promptId: "qcmResultat",
        jsonInputId: "qcmJsonInput",
        createBtnId: "createQCM_MBZ",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    gift: {
        name: "moodle_gift_name",
        description: "moodle_gift_description",
        image: "https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        hidden: true,
        formats: ["GIFT"]
    },
    Page: {
        name: "elea_page_name",
        description: "elea_page_description",
        image: "images/page.webp",
        promptId: "pageResultat",
        jsonInputId: "pageJsonInput",
        createBtnId: "createPageMBZ",
        categories: ["elea"],
        platforms: ["Éléa", "Magistère"],
        formats: ["MBZ", "HTML", "DOCX", "ODT", "PDF"]
    }
};

/**
 * @constant {Object} allModules
 * Fusionne les modules H5P et Moodle en un seul objet pour un accès unifié.
 */
export const allModules = { ...h5pModules, ...moodleModules };

/**
 * @constant {Array<string>} customOrder
 * Définit l'ordre d'affichage personnalisé des tuiles d'activités dans l'onglet "Tout".
 */
export const customOrder = [
    'QuizSetQCM',
    'QuizSetVF',
    'QuizSet',
    'Flashcards',
    'Crossword',
    'Timeline',
    'DragTheWords',
    'FillInTheBlanks',
    'MarkTheWords',
    'Essay',
    'Glossary',
    'SortParagraphs',
    'FindTheWords',
    'Summary',
    'SingleChoiceSet',
    'Page',
    'moodleXml',
    'gift',
    'QCM',
    'Appariement',
    'Millionnaire',
    'glossaireXml',
    'Chart',
    'MultipleChoice',
    'TrueFalse',
    'DialogCards'
];