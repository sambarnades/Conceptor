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
            image: "images/timeline_icon-color.png",
            promptId: "timelineResultat",
            jsonInputId: "timelineJsonInput",
            createBtnId: "createTimelineH5P",
            categories: ["memory", "h5p"]
        },
        Flashcards: {
            name: "h5p_flashcards_name",
            englishName: "Flashcards",
            machineName: "H5P.Flashcards",
            description: "h5p_flashcards_description",
            image: "images/flashcards-png-icon.png",
            promptId: "flashcardsResultat",
            jsonInputId: "flashcardsJsonInput",
            createBtnId: "createFlashcardsH5P",
            categories: ["memory", "h5p"]
        },
        QuizSet: {
            name: "h5p_quiz_set_name",
            englishName: "Quiz (Question Set)",
            machineName: "H5P.QuestionSet",
            description: "h5p_quiz_set_description",
            image: "images/question-set-icon.png",
            promptId: "quizSetResultat",
            jsonInputId: "quizSetJsonInput",
            createBtnId: "createQuizSetH5P",
            categories: ["quiz", "h5p"]
        },
        Glossary: {
            name: "h5p_glossary_name",
            englishName: "Accordion",
            machineName: "H5P.Accordion",
            description: "h5p_glossary_description",
            image: "images/accordion-icon.png",
            promptId: "glossaryResultat",
            jsonInputId: "glossaryJsonInput",
            createBtnId: "createGlossaryH5P",
            categories: ["memory", "h5p"]
        },
        Crossword: {
            name: "h5p_crossword_name",
            englishName: "Crosswords",
            machineName: "H5P.Crossword",
            description: "h5p_crossword_description",
            image: "images/crosswords.png",
            promptId: "crosswordResultat",
            jsonInputId: "crosswordJsonInput",
            createBtnId: "createCrosswordH5P",
            categories: ["memory", "h5p"]
        },
        Essay: {
            name: "h5p_essay_name",
            englishName: "Essay",
            machineName: "H5P.Essay",
            description: "h5p_essay_description",
            image: "images/essay.png",
            promptId: "essayResultat",
            jsonInputId: "essayJsonInput",
            createBtnId: "createEssayH5P",
            categories: ["text", "h5p"]
        },
        Summary: {
            name: "h5p_summary_name",
            englishName: "Summary",
            machineName: "H5P.Summary",
            description: "h5p_summary_description",
            image: "images/summary_icon.png",
            promptId: "summaryResultat",
            jsonInputId: "summaryJsonInput",
            createBtnId: "createSummaryH5P",
            categories: ["text", "h5p"]
        },
        DragTheWords: {
            name: "h5p_drag_the_words_name",
            englishName: "Drag the Words",
            machineName: "H5P.DragText",
            description: "h5p_drag_the_words_description",
            image: "images/drag-the-words-icon.png",
            promptId: "dragWordResultat",
            jsonInputId: "dragWordJsonInput",
            createBtnId: "createDragWordH5P",
            categories: ["text", "h5p"]
        },
        FillInTheBlanks: {
            name: "h5p_fill_in_the_blanks_name",
            englishName: "Fill in the Blanks",
            machineName: "H5P.Blanks",
            description: "h5p_fill_in_the_blanks_description",
            image: "images/fill-in-the-blanks-icon_0.png",
            promptId: "blanksResultat",
            jsonInputId: "blanksJsonInput",
            createBtnId: "createBlanksH5P",
            categories: ["text", "h5p"]
        },
        MarkTheWords: {
            name: "h5p_mark_the_words_name",
            englishName: "Mark the Words",
            machineName: "H5P.MarkTheWords",
            description: "h5p_mark_the_words_description",
            image: "images/mark-the-words-icon_0.png",
            promptId: "markWordsResultat",
            jsonInputId: "markWordsJsonInput",
            createBtnId: "createMarkWordsH5P",
            categories: ["text", "h5p"]
        },
       TrueFalse: {
           name: "h5p_true_false_name",
           englishName: "True/False Question",
           machineName: "H5P.TrueFalse",
           description: "h5p_true_false_description",
           image: "images/true-false.png",
           promptId: "trueFalseResultat",
           jsonInputId: "trueFalseJsonInput",
           createBtnId: "createTrueFalseH5P",
           categories: ["quiz", "h5p"]
       },
       MultipleChoice: {
           name: "h5p_multiple_choice_name",
           englishName: "Multiple Choice",
           machineName: "H5P.MultiChoice",
           description: "h5p_multiple_choice_description",
           image: "images/multichoice-icon_0.png",
           promptId: "multipleChoiceResultat",
           jsonInputId: "multipleChoiceJsonInput",
           createBtnId: "createMultipleChoiceH5P",
           categories: ["quiz", "h5p"]
       },
       FindTheWords: {
           name: "h5p_find_the_words_name",
           englishName: "Find the Words",
           machineName: "H5P.FindTheWords",
           description: "h5p_find_the_words_description",
           image: "images/word-search-h5porg.png",
           promptId: "findTheWordsResultat",
           jsonInputId: "findTheWordsJsonInput",
           createBtnId: "createFindTheWordsH5P",
           categories: ["memory", "h5p"]
       },
       SortParagraphs: {
           name: "h5p_sort_the_paragraphs_name",
           englishName: "Sort the Paragraphs",
           machineName: "H5P.SortParagraphs",
           description: "h5p_sort_the_paragraphs_description",
           image: "images/sort-paragraphs.png",
           promptId: "sortParagraphsResultat",
           jsonInputId: "sortParagraphsJsonInput",
           createBtnId: "createSortParagraphsH5P",
           categories: ["text", "h5p"]
       },
       SingleChoiceSet: {
           name: "h5p_single_choice_set_name",
           englishName: "Single Choice Set",
           machineName: "H5P.SingleChoiceSet",
           description: "h5p_single_choice_set_description",
           image: "images/single-choice-set-icon_0.png",
           promptId: "singleChoiceSetResultat",
           jsonInputId: "singleChoiceSetJsonInput",
           createBtnId: "createSingleChoiceSetH5P",
           categories: ["quiz", "h5p"]
       },
       DialogCards: {
           name: "h5p_dialog_cards_name",
           englishName: "Dialog Cards",
           machineName: "H5P.Dialogcards",
           description: "h5p_dialog_cards_description",
           image: "images/dialog_cards_icon-color.png",
           promptId: "dialogCardsResultat",
           jsonInputId: "dialogCardsJsonInput",
           createBtnId: "createDialogCardsH5P",
           categories: ["memory", "h5p"]
       },
       ComplexFillTheBlanks: {
           name: "h5p_complex_fill_the_blanks_name",
           englishName: "Complex fill the blanks",
           machineName: "H5P.AdvancedBlanks",
           description: "h5p_complex_fill_the_blanks_description",
           image: "images/advanced-fill-in-the-blanks.png",
           promptId: "complexBlanksResultat",
           jsonInputId: "complexBlanksJsonInput",
           createBtnId: "createComplexBlanksH5P",
           hidden: true,
           categories: []
       },
       Chart: {
           name: "h5p_chart_name",
           englishName: "Chart",
           machineName: "H5P.Chart",
           description: "h5p_chart_description",
           image: "images/chart-icon-color.png",
           promptId: "chartResultat",
           jsonInputId: "chartJsonInput",
           createBtnId: "createChartH5P",
           categories: ["memory", "h5p"]
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
           image: "images/test.png",
           categories: ["quiz", "elea"]
       },
       glossaireXml: {
           name: "moodle_glossaire_xml_name",
           description: "moodle_glossaire_xml_description",
           image: "images/glossaire.png",
           categories: ["memory", "elea"]
       },
       Millionnaire: {
           name: "moodle_millionnaire_name",
           description: "moodle_millionnaire_description",
           image: "images/millionnaire.png",
           promptId: "millionnaireResultat",
           jsonInputId: "millionnaireJsonInput",
           createBtnId: "createMillionnaireMBZ",
           categories: ["quiz", "elea"]
       },
       Appariement: {
           name: "moodle_appariement_name",
           description: "moodle_appariement_description",
           image: "images/appariement.png",
           promptId: "appariementResultat",
           jsonInputId: "appariementJsonInput",
           createBtnId: "createAppariementMBZ",
           categories: ["quiz", "elea"]
       },
       QCM: {
           name: "moodle_qcm_name",
           description: "moodle_qcm_description",
           image: "images/qcm.png",
           promptId: "qcmResultat",
           jsonInputId: "qcmJsonInput",
           createBtnId: "createQCM_MBZ",
           categories: ["quiz", "elea"]
       },
       gift: {
           name: "moodle_gift_name",
           description: "moodle_gift_description",
           image: "https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg",
           categories: ["quiz", "elea"],
           hidden: true
       },
       Page: {
           name: "elea_page_name",
           description: "elea_page_description",
           image: "images/page.png",
           promptId: "pageResultat",
           jsonInputId: "pageJsonInput",
           createBtnId: "createPageMBZ",
           categories: ["elea"]
       }
   };
 
/**
 * @constant {Object} allModules
 * Fusionne les modules H5P et Moodle en un seul objet pour un accès unifié.
 */
export const allModules = {...h5pModules, ...moodleModules };
 
/**
 * @constant {Array<string>} customOrder
 * Définit l'ordre d'affichage personnalisé des tuiles d'activités dans l'onglet "Tout".
 */
export const customOrder = [
        'QuizSet',
        'Flashcards',
        'Crossword',
        'Timeline',
        'Page',
        'DragTheWords',
        'FillInTheBlanks',
        'MarkTheWords',
        'Essay',
        'Glossary',
        'moodleXml',
        'gift',
        'QCM',
        'Appariement',
        'Millionnaire',
        'glossaireXml',
        'Chart',
        'Summary',
        'MultipleChoice',
        'SingleChoiceSet',
        'TrueFalse',
        'DialogCards',
        'SortParagraphs',
        'FindTheWords',
    ];