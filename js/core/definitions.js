/**
 * @file Ce fichier centralise les définitions des modules d'activités H5P et Moodle/Éléa.
 * Il exporte les objets de configuration pour chaque type d'activité,
 * un objet combiné, et un tableau définissant l'ordre d'affichage personnalisé.
 */

/**
 * @constant {Object} formatHelpKeys
 * Mapping des formats de fichiers vers leurs clés de traduction de tutoriel.
 * Utilisé pour afficher l'aide contextuelle à côté des boutons de téléchargement.
 */
export const formatHelpKeys = {
    'H5P': 'tuto_step4_integrate_h5p_content',
    'MBZ': 'tuto_step4_integrate_mbz_content',
    'HTML': 'tuto_step4_integrate_html_content',
    'GIFT': 'tuto_step4_integrate_xml_gift_content'
    // XML est spécial : dépend du type d'activité (glossaire vs banque de questions)
};

/**
 * @constant {Object} xmlHelpByActivity
 * Mapping spécifique pour les activités XML qui ont des tutoriels différents.
 */
export const xmlHelpByActivity = {
    'elea_glossaire_xml_name': 'tuto_step4_integrate_xml_glossary_content',
    'elea_test_xml_name': 'tuto_step4_integrate_xml_gift_content'
};

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
        image: "assets/images/activities/timeline_icon-color.webp",
        promptId: "timelineResultat",
        jsonInputId: "timelineJsonInput",
        createBtnId: "createTimelineH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Flashcards: {
        name: "h5p_flashcards_name",
        englishName: "Flashcards",
        machineName: "H5P.Flashcards",
        description: "h5p_flashcards_description",
        image: "assets/images/activities/flashcards-png-icon.webp",
        promptId: "flashcardsResultat",
        jsonInputId: "flashcardsJsonInput",
        createBtnId: "createFlashcardsH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSet: {
        name: "h5p_quiz_set_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_description",
        image: "assets/images/activities/question-set-icon.webp",
        promptId: "quizSetResultat",
        jsonInputId: "quizSetJsonInput",
        createBtnId: "createQuizSetH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSetQCM: {
        name: "h5p_quiz_set_qcm_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_qcm_description",
        image: "assets/images/activities/question-set-icon.webp",
        promptId: "quizSetQcmResultat",
        jsonInputId: "quizSetQcmJsonInput",
        createBtnId: "createQuizSetQcmH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    QuizSetVF: {
        name: "h5p_quiz_set_vf_name",
        englishName: "Quiz (Question Set)",
        machineName: "H5P.QuestionSet",
        description: "h5p_quiz_set_vf_description",
        image: "assets/images/activities/question-set-icon.webp",
        promptId: "quizSetVfResultat",
        jsonInputId: "quizSetVfJsonInput",
        createBtnId: "createQuizSetVfH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Glossary: {
        name: "h5p_glossary_name",
        englishName: "Accordion",
        machineName: "H5P.Accordion",
        description: "h5p_glossary_description",
        image: "assets/images/activities/accordion-icon.webp",
        promptId: "glossaryResultat",
        jsonInputId: "glossaryJsonInput",
        createBtnId: "createGlossaryH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Crossword: {
        name: "h5p_crossword_name",
        englishName: "Crosswords",
        machineName: "H5P.Crossword",
        description: "h5p_crossword_description",
        image: "assets/images/activities/crosswords.webp",
        promptId: "crosswordResultat",
        jsonInputId: "crosswordJsonInput",
        createBtnId: "createCrosswordH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Essay: {
        name: "h5p_essay_name",
        englishName: "Essay",
        machineName: "H5P.Essay",
        description: "h5p_essay_description",
        image: "assets/images/activities/essay.webp",
        promptId: "essayResultat",
        jsonInputId: "essayJsonInput",
        createBtnId: "createEssayH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    Summary: {
        name: "h5p_summary_name",
        englishName: "Summary",
        machineName: "H5P.Summary",
        description: "h5p_summary_description",
        image: "assets/images/activities/summary_icon.webp",
        promptId: "summaryResultat",
        jsonInputId: "summaryJsonInput",
        createBtnId: "createSummaryH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    DragTheWords: {
        name: "h5p_drag_the_words_name",
        englishName: "Drag the Words",
        machineName: "H5P.DragText",
        description: "h5p_drag_the_words_description",
        image: "assets/images/activities/drag-the-words-icon.webp",
        promptId: "dragWordResultat",
        jsonInputId: "dragWordJsonInput",
        createBtnId: "createDragWordH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    DragAndDrop: {
        name: "h5p_drag_and_drop_name",
        englishName: "Drag and Drop",
        machineName: "H5P.DragQuestion",
        description: "h5p_drag_and_drop_description",
        image: "assets/images/activities/drag-and-drop-icon.webp",
        promptId: "dragAndDropResultat",
        jsonInputId: "dragAndDropJsonInput",
        createBtnId: "createDragAndDropH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    FillInTheBlanks: {
        name: "h5p_fill_in_the_blanks_name",
        englishName: "Fill in the Blanks",
        machineName: "H5P.Blanks",
        description: "h5p_fill_in_the_blanks_description",
        image: "assets/images/activities/fill-in-the-blanks-icon_0.webp",
        promptId: "blanksResultat",
        jsonInputId: "blanksJsonInput",
        createBtnId: "createBlanksH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    MarkTheWords: {
        name: "h5p_mark_the_words_name",
        englishName: "Mark the Words",
        machineName: "H5P.MarkTheWords",
        description: "h5p_mark_the_words_description",
        image: "assets/images/activities/mark-the-words-icon_0.webp",
        promptId: "markWordsResultat",
        jsonInputId: "markWordsJsonInput",
        createBtnId: "createMarkWordsH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    TrueFalse: {
        name: "h5p_true_false_name",
        englishName: "True/False Question",
        machineName: "H5P.TrueFalse",
        description: "h5p_true_false_description",
        image: "assets/images/activities/true-false.webp",
        promptId: "trueFalseResultat",
        jsonInputId: "trueFalseJsonInput",
        createBtnId: "createTrueFalseH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    MultipleChoice: {
        name: "h5p_multiple_choice_name",
        englishName: "Multiple Choice",
        machineName: "H5P.MultiChoice",
        description: "h5p_multiple_choice_description",
        image: "assets/images/activities/multichoice-icon_0.webp",
        promptId: "multipleChoiceResultat",
        jsonInputId: "multipleChoiceJsonInput",
        createBtnId: "createMultipleChoiceH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    FindTheWords: {
        name: "h5p_find_the_words_name",
        englishName: "Find the Words",
        machineName: "H5P.FindTheWords",
        description: "h5p_find_the_words_description",
        image: "assets/images/activities/word-search-h5porg.webp",
        promptId: "findTheWordsResultat",
        jsonInputId: "findTheWordsJsonInput",
        createBtnId: "createFindTheWordsH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    SortParagraphs: {
        name: "h5p_sort_the_paragraphs_name",
        englishName: "Sort the Paragraphs",
        machineName: "H5P.SortParagraphs",
        description: "h5p_sort_the_paragraphs_description",
        image: "assets/images/activities/sort-paragraphs.webp",
        promptId: "sortParagraphsResultat",
        jsonInputId: "sortParagraphsJsonInput",
        createBtnId: "createSortParagraphsH5P",
        categories: ["text", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    SingleChoiceSet: {
        name: "h5p_single_choice_set_name",
        englishName: "Single Choice Set",
        machineName: "H5P.SingleChoiceSet",
        description: "h5p_single_choice_set_description",
        image: "assets/images/activities/single-choice-set-icon_0.webp",
        promptId: "singleChoiceSetResultat",
        jsonInputId: "singleChoiceSetJsonInput",
        createBtnId: "createSingleChoiceSetH5P",
        categories: ["quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    DialogCards: {
        name: "h5p_dialog_cards_name",
        englishName: "Dialog Cards",
        machineName: "H5P.Dialogcards",
        description: "h5p_dialog_cards_description",
        image: "assets/images/activities/dialog_cards_icon-color.webp",
        promptId: "dialogCardsResultat",
        jsonInputId: "dialogCardsJsonInput",
        createBtnId: "createDialogCardsH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    ComplexFillTheBlanks: {
        name: "h5p_complex_fill_the_blanks_name",
        englishName: "Complex fill the blanks",
        machineName: "H5P.AdvancedBlanks",
        description: "h5p_complex_fill_the_blanks_description",
        image: "assets/images/activities/advanced-fill-in-the-blanks.webp",
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
        image: "assets/images/activities/chart-icon-color.webp",
        promptId: "chartResultat",
        jsonInputId: "chartJsonInput",
        createBtnId: "createChartH5P",
        categories: ["memory", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    },
    CoursePresentation: {
        name: "h5p_course_presentation_name",
        englishName: "CoursePresentation",
        machineName: "H5P.CoursePresentation",
        description: "h5p_course_presentation_description",
        image: "assets/images/activities/course_presentation_icon-colors_0.webp",
        promptId: "coursePresentationResultat",
        jsonInputId: "coursePresentationJsonInput",
        createBtnId: "createCoursePresentationH5P",
        categories: ["text", "quiz", "h5p"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["H5P", "DOCX", "ODT", "PDF"]
    }
};

/**
 * @constant {Object} moodleModules
 * Définit la configuration de chaque module d'activité Moodle/Éléa disponible.
 */
export const moodleModules = {
    test_elea: {
        name: "elea_test_xml_name",
        subtitleKey: "elea_test_xml_subtitle",
        description: "elea_test_xml_description",
        image: "assets/images/activities/test.webp",
        categories: ["quiz", "elea"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["XML", "GIFT", "DOCX", "ODT", "PDF"]
    },
    glossaireXml: {
        name: "elea_glossaire_xml_name",
        subtitleKey: "elea_glossaire_xml_subtitle",
        description: "elea_glossaire_xml_description",
        image: "assets/images/activities/glossaire.webp",
        categories: ["memory", "elea"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["XML", "DOCX", "ODT", "PDF"]
    },
    Millionnaire: {
        name: "elea_millionnaire_name",
        subtitleKey: "elea_millionnaire_subtitle",
        description: "elea_millionnaire_description",
        image: "assets/images/activities/millionnaire.webp",
        promptId: "millionnaireResultat",
        jsonInputId: "millionnaireJsonInput",
        createBtnId: "createMillionnaireMBZ",
        categories: ["quiz", "elea"],
        hidden: false,
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    Appariement: {
        name: "elea_appariement_name",
        subtitleKey: "elea_appariement_subtitle",
        description: "elea_appariement_description",
        image: "assets/images/activities/appariement.webp",
        promptId: "appariementResultat",
        jsonInputId: "appariementJsonInput",
        createBtnId: "createAppariementMBZ",
        categories: ["quiz", "elea"],
        hidden: false,
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    QCM: {
        name: "elea_qcm_name",
        subtitleKey: "elea_qcm_subtitle",
        description: "elea_qcm_description",
        image: "assets/images/activities/qcm.webp",
        promptId: "qcmResultat",
        jsonInputId: "qcmJsonInput",
        createBtnId: "createQCM_MBZ",
        categories: ["quiz", "elea"],
        hidden: false,
        platforms: ["Éléa"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    gift: {
        name: "elea_test_gift_name",
        description: "elea_test_gift_description",
        image: "https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg",
        categories: ["quiz", "elea"],
        platforms: ["Éléa"],
        hidden: true,
        formats: ["GIFT"]
    },
    Page: {
        name: "elea_page_name",
        subtitleKey: "elea_page_subtitle",
        description: "elea_page_description",
        image: "assets/images/activities/page.webp",
        promptId: "pageResultat",
        jsonInputId: "pageJsonInput",
        createBtnId: "createPageMBZ",
        categories: ["elea"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["MBZ", "HTML", "DOCX", "ODT", "PDF"]
    },
    Livre: {
        name: "elea_livre_name",
        subtitleKey: "elea_livre_subtitle",
        description: "elea_livre_description",
        image: "assets/images/activities/livre.webp",
        promptId: "livreResultat",
        jsonInputId: "livreJsonInput",
        createBtnId: "createLivreMBZ",
        categories: ["elea"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
    },
    Devoir: {
        name: "elea_devoir_name",
        subtitleKey: "elea_devoir_subtitle",
        description: "elea_devoir_description",
        image: "assets/images/activities/devoirs.webp",
        promptId: "devoirResultat",
        jsonInputId: "devoirJsonInput",
        createBtnId: "createDevoirMBZ",
        categories: ["quiz", "elea"],
        hidden: false,
        platforms: ["Éléa", "Magistère", "Moodle"],
        formats: ["MBZ", "DOCX", "ODT", "PDF"]
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
    'CoursePresentation',
    'Flashcards',
    'Crossword',
    'Timeline',
    'DragTheWords',
    'DragAndDrop',
    'FillInTheBlanks',
    'MarkTheWords',
    'Essay',
    'Glossary',
    'SortParagraphs',
    'FindTheWords',
    'Summary',
    'SingleChoiceSet',
    'Chart',
    'DialogCards',
    'MultipleChoice',
    'TrueFalse',
    'Page',
    'Livre',
    'Devoir',
    'test_elea',
    'QCM',
    'Appariement',
    'Millionnaire',
    'glossaireXml'
];