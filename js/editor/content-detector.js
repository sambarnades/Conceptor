/**
 * Content Detector - Detection automatique du type de contenu
 *
 * Analyse la structure JSON pour identifier le type de module
 * et retourne le schema de champs correspondant.
 */

import { t } from '../core/translation.js';
import { debugLog } from '../core/utils.js';
import { getNestedValue, setNestedValue } from './json-utils.js';

// =======================================================================
// SIGNATURES DE DETECTION
// =======================================================================

/**
 * Signatures de detection pour chaque type de module
 * Chaque fonction retourne true si le JSON correspond au type
 */
const contentSignatures = {
    // === H5P Types ===
    'Flashcards': (data) =>
        Array.isArray(data.cards) &&
        data.cards.length > 0 &&
        data.cards[0].hasOwnProperty('text') &&
        data.cards[0].hasOwnProperty('answer'),

    'MultipleChoice': (data) =>
        data.hasOwnProperty('question') &&
        Array.isArray(data.answers) &&
        data.answers.length > 0 &&
        data.answers[0].hasOwnProperty('correct'),

    'TrueFalse': (data) =>
        data.hasOwnProperty('question') &&
        (data.hasOwnProperty('correct') && (data.correct === true || data.correct === false || data.correct === 'true' || data.correct === 'false')),

    'FillInTheBlanks': (data) =>
        data.hasOwnProperty('taskDescription') &&
        Array.isArray(data.questions) &&
        typeof data.questions[0] === 'string',

    'DialogCards': (data) =>
        Array.isArray(data.dialogs) &&
        data.dialogs.length > 0 &&
        data.dialogs[0].hasOwnProperty('text') &&
        data.dialogs[0].hasOwnProperty('answer'),

    'Timeline': (data) =>
        data.hasOwnProperty('timeline') &&
        data.timeline.hasOwnProperty('date') &&
        Array.isArray(data.timeline.date),

    'Crossword': (data) =>
        Array.isArray(data.words) &&
        data.words.length > 0 &&
        data.words[0].hasOwnProperty('clue') &&
        data.words[0].hasOwnProperty('answer'),

    'Essay': (data) =>
        data.hasOwnProperty('taskDescription') &&
        Array.isArray(data.keywords) &&
        data.keywords.length > 0 &&
        data.keywords[0].hasOwnProperty('keyword'),

    'Chart': (data) =>
        data.hasOwnProperty('graphMode') &&
        Array.isArray(data.listOfTypes) &&
        data.listOfTypes.length > 0,

    // Note: MarkTheWords et DragTheWords partagent la meme signature JSON
    // (taskDescription + textField avec *mot*). La distinction se fait par titleKey
    // dans detectContentType() qui utilise le titleKey EN PRIORITE.
    'DragAndDrop': (data) =>
        Array.isArray(data.dropZones) &&
        data.dropZones.length > 0 &&
        Array.isArray(data.elements) &&
        data.elements.length > 0,

    'DragTheWords': (data) =>
        data.hasOwnProperty('taskDescription') &&
        data.hasOwnProperty('textField') &&
        typeof data.textField === 'string',

    // MarkTheWords a la meme structure que DragTheWords, mais avec *mots* marques.
    // La detection par signature seule ne peut pas distinguer les deux types.
    // Le titleKey est utilise en priorite dans detectContentType().
    'MarkTheWords': (data) =>
        data.hasOwnProperty('taskDescription') &&
        data.hasOwnProperty('textField') &&
        data.textField?.includes('*'),

    'QuizSet': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('library'),

    // Glossary peut être un tableau direct [{title, text}] ou un objet {accordion: [...]}
    'Glossary': (data) =>
        (Array.isArray(data) &&
            data.length > 0 &&
            data[0].hasOwnProperty('title') &&
            data[0].hasOwnProperty('text')) ||
        (Array.isArray(data.accordion) &&
            data.accordion.length > 0 &&
            data.accordion[0].hasOwnProperty('title')),

    'SortParagraphs': (data) =>
        Array.isArray(data.paragraphs) &&
        data.paragraphs.length > 0,

    // FindTheWords: wordList est une chaîne séparée par des virgules (ex: "MOT1,MOT2,MOT3")
    'FindTheWords': (data) =>
        data.hasOwnProperty('taskDescription') &&
        typeof data.wordList === 'string' &&
        data.wordList.length > 0,

    'Summary': (data) =>
        Array.isArray(data.summaries) &&
        data.summaries.length > 0,

    'SingleChoiceSet': (data) =>
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        data.choices[0].hasOwnProperty('question'),

    // === Moodle/Elea Types ===
    'elea_qcm': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('answers') &&
        data.questions[0].answers[0]?.hasOwnProperty('iscorrect'),

    'elea_test': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('type') &&
        data.questions[0].hasOwnProperty('content'),

    'elea_appariement': (data) =>
        Array.isArray(data.pairs) &&
        data.pairs.length > 0 &&
        data.pairs[0].hasOwnProperty('question') &&
        data.pairs[0].hasOwnProperty('answer'),

    'elea_glossaire': (data) =>
        Array.isArray(data.entries) &&
        data.entries.length > 0 &&
        data.entries[0].hasOwnProperty('concept') &&
        data.entries[0].hasOwnProperty('definition'),

    'elea_page': (data) =>
        Array.isArray(data.blocks) &&
        data.blocks.length > 0 &&
        data.blocks[0].hasOwnProperty('type'),

    'elea_millionnaire': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('question') &&
        data.questions[0].hasOwnProperty('goodanswer') &&
        data.questions[0].hasOwnProperty('badanswer'), // badanswer peut être un tableau ou string après édition

    'elea_devoir': (data) =>
        Array.isArray(data.criteria) &&
        data.criteria.length > 0 &&
        data.criteria[0].hasOwnProperty('description') &&
        Array.isArray(data.criteria[0].levels)
};

// Mapping titleKey -> moduleKey
// Utilise EN PRIORITE par detectContentType() pour les types ambigus (ex: MarkTheWords vs DragTheWords)
// Les cles correspondent aux valeurs de `name` dans definitions.js (ex: "h5p_flashcards_name")
const titleKeyToModuleKey = {
    // === H5P (format complet _name utilise dans les notifications) ===
    'h5p_flashcards_name': 'Flashcards',
    'h5p_multiple_choice_name': 'MultipleChoice',
    'h5p_true_false_name': 'TrueFalse',
    'h5p_fill_in_the_blanks_name': 'FillInTheBlanks',
    'h5p_dialog_cards_name': 'DialogCards',
    'h5p_timeline_name': 'Timeline',
    'h5p_crossword_name': 'Crossword',
    'h5p_essay_name': 'Essay',
    'h5p_chart_name': 'Chart',
    'h5p_drag_and_drop_name': 'DragAndDrop',
    'h5p_drag_the_words_name': 'DragTheWords',
    'h5p_quiz_set_name': 'QuizSet',
    'h5p_quiz_set_qcm_name': 'QuizSet',
    'h5p_quiz_set_vf_name': 'QuizSet',
    'h5p_glossary_name': 'Glossary',
    'h5p_mark_the_words_name': 'MarkTheWords',
    'h5p_sort_the_paragraphs_name': 'SortParagraphs',
    'h5p_find_the_words_name': 'FindTheWords',
    'h5p_summary_name': 'Summary',
    'h5p_single_choice_set_name': 'SingleChoiceSet',
    // === H5P (anciens formats courts pour retrocompatibilite) ===
    'h5p_flashcards': 'Flashcards',
    'h5p_multiplechoice': 'MultipleChoice',
    'h5p_truefalse': 'TrueFalse',
    'h5p_fillintheblanks': 'FillInTheBlanks',
    'h5p_dialogcards': 'DialogCards',
    'h5p_timeline': 'Timeline',
    'h5p_crossword': 'Crossword',
    'h5p_essay': 'Essay',
    'h5p_dragthewords': 'DragTheWords',
    'h5p_questionset': 'QuizSet',
    'h5p_accordion': 'Glossary',
    'h5p_markthewords': 'MarkTheWords',
    'h5p_sortparagraphs': 'SortParagraphs',
    'h5p_findthewords': 'FindTheWords',
    'h5p_summary': 'Summary',
    'h5p_singlechoiceset': 'SingleChoiceSet',
    // === Moodle/Elea ===
    'elea_qcm_name': 'elea_qcm',
    'elea_test_xml_name': 'elea_test',
    'elea_appariement_name': 'elea_appariement',
    'elea_glossaire_xml_name': 'elea_glossaire',
    'elea_millionnaire_name': 'elea_millionnaire',
    'elea_page_name': 'elea_page',
    'elea_qcm': 'elea_qcm',
    'elea_test': 'elea_test',
    'elea_appariement': 'elea_appariement',
    'elea_glossaire': 'elea_glossaire',
    'elea_page': 'elea_page',
    'elea_millionnaire': 'elea_millionnaire',
    'elea_devoir_name': 'elea_devoir',
    'elea_devoir': 'elea_devoir'
};

// =======================================================================
// SCHEMAS DE CHAMPS
// =======================================================================

/**
 * Schemas de champs pour chaque type de module
 * Definit la structure de l'editeur
 */
const fieldSchemas = {
    // === FLASHCARDS ===
    'Flashcards': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    description: { type: 'textarea', label: 'editor_description', hint: 'editor_description_hint' }
                }
            },
            {
                id: 'cards',
                label: 'editor_section_cards',
                icon: 'fa-layer-group',
                countField: 'cards',
                fields: {
                    cards: {
                        type: 'array',
                        itemLabel: 'editor_card',
                        addLabel: 'editor_add_card',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'text', label: 'editor_card_front', required: true, placeholder: 'editor_card_front_placeholder' },
                            answer: { type: 'text', label: 'editor_card_back', required: true, placeholder: 'editor_card_back_placeholder' },
                            tip: {
                                type: 'textarea',
                                label: 'editor_card_tip',
                                collapsible: true,
                                collapsibleLabel: 'editor_tip_optional'
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MULTIPLE CHOICE ===
    'MultipleChoice': {
        sections: [
            {
                id: 'question',
                label: 'editor_section_question',
                icon: 'fa-question-circle',
                fields: {
                    question: { type: 'textarea', label: 'editor_question_text', required: true, large: true }
                }
            },
            {
                id: 'answers',
                label: 'editor_section_answers',
                icon: 'fa-list-ul',
                countField: 'answers',
                fields: {
                    answers: {
                        type: 'array',
                        itemLabel: 'editor_answer',
                        addLabel: 'editor_add_answer',
                        minItems: 2,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'text', label: 'editor_answer_text', required: true },
                            correct: { type: 'checkbox', label: 'editor_is_correct', inline: true },
                            tipsAndFeedback: {
                                type: 'object',
                                collapsible: true,
                                collapsibleLabel: 'editor_tips_feedback',
                                schema: {
                                    tip: { type: 'textarea', label: 'editor_tip' },
                                    chosenFeedback: { type: 'textarea', label: 'editor_chosen_feedback' },
                                    notChosenFeedback: { type: 'textarea', label: 'editor_not_chosen_feedback' }
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === TRUE/FALSE ===
    'TrueFalse': {
        sections: [
            {
                id: 'question',
                label: 'editor_section_question',
                icon: 'fa-question-circle',
                fields: {
                    question: { type: 'textarea', label: 'editor_question_text', required: true, large: true }
                }
            },
            {
                id: 'answer',
                label: 'editor_section_answer',
                icon: 'fa-check-circle',
                fields: {
                    correct: {
                        type: 'select',
                        label: 'editor_correct_answer',
                        required: true,
                        options: [
                            { value: 'true', label: 'editor_true' },
                            { value: 'false', label: 'editor_false' }
                        ]
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    feedbackOnCorrect: { type: 'textarea', label: 'editor_feedback_correct' },
                    feedbackOnWrong: { type: 'textarea', label: 'editor_feedback_wrong' }
                }
            }
        ]
    },

    // === FILL IN THE BLANKS ===
    'FillInTheBlanks': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true }
                }
            },
            {
                id: 'questions',
                label: 'editor_section_sentences',
                icon: 'fa-paragraph',
                countField: 'questions',
                fields: {
                    questions: {
                        type: 'array',
                        itemLabel: 'editor_sentence',
                        addLabel: 'editor_add_sentence',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            _value: {
                                type: 'textarea',
                                label: 'editor_sentence_text',
                                required: true,
                                hint: 'editor_blanks_hint',
                                isArrayValue: true
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === DIALOG CARDS ===
    'DialogCards': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title' },
                    description: { type: 'textarea', label: 'editor_description' }
                }
            },
            {
                id: 'dialogs',
                label: 'editor_section_cards',
                icon: 'fa-layer-group',
                countField: 'dialogs',
                fields: {
                    dialogs: {
                        type: 'array',
                        itemLabel: 'editor_card',
                        addLabel: 'editor_add_card',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'textarea', label: 'editor_card_front', required: true },
                            answer: { type: 'textarea', label: 'editor_card_back', required: true },
                            tips: {
                                type: 'object',
                                collapsible: true,
                                collapsibleLabel: 'editor_tips_optional',
                                schema: {
                                    front: { type: 'text', label: 'editor_tip_front' },
                                    back: { type: 'text', label: 'editor_tip_back' }
                                }
                            }
                        }
                    }
                }
            }
        ]
    },

    // === TIMELINE ===
    'Timeline': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    'timeline.headline': { type: 'text', label: 'editor_title', required: true },
                    'timeline.text': { type: 'textarea', label: 'editor_description' },
                    'timeline.type': { type: 'text', label: 'editor_timeline_type', hidden: true },
                    'timeline.asset': {
                        type: 'object', collapsible: true, collapsibleLabel: 'editor_media_optional',
                        schema: {
                            media: { type: 'text', label: 'editor_media_url' },
                            caption: { type: 'text', label: 'editor_caption' },
                            credit: { type: 'text', label: 'editor_credit' }
                        }
                    }
                }
            },
            {
                id: 'events',
                label: 'editor_section_events',
                icon: 'fa-calendar-alt',
                countField: 'timeline.date',
                fields: {
                    'timeline.date': {
                        type: 'array',
                        itemLabel: 'editor_event',
                        addLabel: 'editor_add_event',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            startDate: { type: 'timelineDate', label: 'editor_start_date', required: true, placeholder: 'YYYY,M,D' },
                            endDate: { type: 'timelineDate', label: 'editor_end_date', placeholder: 'YYYY,M,D' },
                            headline: { type: 'text', label: 'editor_event_title', required: true },
                            text: { type: 'textarea', label: 'editor_event_description' },
                            tag: { type: 'text', label: 'editor_event_tag' },
                            asset: {
                                type: 'object', collapsible: true, collapsibleLabel: 'editor_media_optional',
                                schema: {
                                    media: { type: 'text', label: 'editor_media_url' },
                                    caption: { type: 'text', label: 'editor_caption' },
                                    credit: { type: 'text', label: 'editor_credit' }
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'eras',
                label: 'editor_era_section',
                icon: 'fa-layer-group',
                countField: 'timeline.era',
                fields: {
                    'timeline.era': {
                        type: 'array',
                        itemLabel: 'editor_era',
                        addLabel: 'editor_add_era',
                        minItems: 0,
                        itemsExpanded: false,
                        itemSchema: {
                            startDate: { type: 'timelineDate', label: 'editor_start_date', required: true, placeholder: 'YYYY' },
                            endDate: { type: 'timelineDate', label: 'editor_end_date', required: true, placeholder: 'YYYY' },
                            headline: { type: 'text', label: 'editor_era_name', required: true },
                            text: { type: 'textarea', label: 'editor_era_description' },
                            tag: { type: 'text', label: 'editor_event_tag' }
                        }
                    }
                }
            }
        ]
    },

    // === CROSSWORD ===
    'Crossword': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    taskDescription: { type: 'textarea', label: 'editor_task_description' }
                }
            },
            {
                id: 'words',
                label: 'editor_section_words',
                icon: 'fa-th',
                countField: 'words',
                fields: {
                    words: {
                        type: 'array',
                        itemLabel: 'editor_word',
                        addLabel: 'editor_add_word',
                        minItems: 2,
                        dynamicTitleField: 'answer',
                        itemSchema: {
                            answer: { type: 'text', label: 'editor_answer', required: true, hint: 'editor_crossword_answer_hint' },
                            clue: { type: 'text', label: 'editor_clue', required: true },
                            'extraClue.params.text': { type: 'textarea', label: 'editor_extra_clue' }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === ESSAY ===
    // Note: Le JSON utilise "keyword" (pas "text") et "options.points" (pas "weight")
    'Essay': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true, large: true }
                }
            },
            {
                id: 'keywords',
                label: 'editor_section_keywords',
                icon: 'fa-key',
                countField: 'keywords',
                fields: {
                    keywords: {
                        type: 'array',
                        itemLabel: 'editor_keyword',
                        addLabel: 'editor_add_keyword',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            keyword: { type: 'text', label: 'editor_keyword', required: true },
                            'options.points': { type: 'number', label: 'editor_weight', hint: 'editor_weight_hint' },
                            'options.caseSensitive': { type: 'checkbox', label: 'editor_case_sensitive' }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === CHART (Diagramme) ===
    'Chart': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    figureDefinition: { type: 'textarea', label: 'editor_chart_description', required: true },
                    graphMode: {
                        type: 'select',
                        label: 'editor_chart_type',
                        required: true,
                        options: [
                            { value: 'barChart', label: 'editor_chart_bar' },
                            { value: 'pieChart', label: 'editor_chart_pie' }
                        ]
                    }
                }
            },
            {
                id: 'data',
                label: 'editor_section_data',
                icon: 'fa-chart-bar',
                countField: 'listOfTypes',
                fields: {
                    listOfTypes: {
                        type: 'array',
                        itemLabel: 'editor_chart_item',
                        addLabel: 'editor_chart_add_item',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'text', label: 'editor_chart_label', required: true },
                            value: { type: 'number', label: 'editor_chart_value', required: true },
                            color: { type: 'color', label: 'editor_chart_color' },
                            fontColor: { type: 'color', label: 'editor_chart_font_color' }
                        }
                    }
                }
            }
        ]
    },

    // === DRAG THE WORDS ===
    'DragTheWords': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true }
                }
            },
            {
                id: 'text',
                label: 'editor_section_text',
                icon: 'fa-paragraph',
                fields: {
                    textField: {
                        type: 'textarea',
                        label: 'editor_text_with_blanks',
                        required: true,
                        large: true,
                        hint: 'editor_drag_words_hint'
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === DRAG AND DROP ===
    'DragAndDrop': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    layoutSettings: {
                        type: 'fieldGroup',
                        inline: true,
                        fields: {
                            canvasWidth: { type: 'number', label: 'editor_canvas_width', min: 400, max: 1200, default: 800, hint: 'editor_canvas_width_hint' },
                            elementPosition: {
                                type: 'select',
                                label: 'editor_element_position',
                                options: [
                                    { value: 'down', label: 'editor_element_position_down' },
                                    { value: 'center', label: 'editor_element_position_center' },
                                    { value: 'up', label: 'editor_element_position_up' }
                                ]
                            }
                        }
                    }
                }
            },
            {
                id: 'dropZones',
                label: 'editor_section_zones',
                icon: 'fa-th-large',
                countField: 'dropZones',
                fields: {
                    dropZones: {
                        type: 'array',
                        itemLabel: 'editor_zone',
                        addLabel: 'editor_add_zone',
                        minItems: 2,
                        maxItems: 10,
                        itemsExpanded: false,
                        itemSchema: {
                            label: { type: 'text', label: 'editor_zone_label', required: true }
                        }
                    }
                }
            },
            {
                id: 'elements',
                label: 'editor_section_elements',
                icon: 'fa-tags',
                countField: 'elements',
                fields: {
                    elements: {
                        type: 'array',
                        itemLabel: 'editor_element',
                        addLabel: 'editor_add_element',
                        minItems: 2,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'text', label: 'editor_element_text', required: true },
                            zoneIndices: {
                                type: 'multiCheckbox',
                                label: 'editor_target_zones',
                                required: true,
                                optionsFrom: 'dropZones',
                                optionsLabelField: 'label',
                                optionsValueType: 'index',
                                hint: 'editor_target_zones_hint'
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === GLOSSARY (Accordion) ===
    // Note: Le JSON peut être un tableau direct [{title, text}] - normalisé en {items: [...]}
    'Glossary': {
        sections: [
            {
                id: 'entries',
                label: 'editor_section_entries',
                icon: 'fa-book',
                countField: 'items',
                fields: {
                    items: {
                        type: 'array',
                        itemLabel: 'editor_entry',
                        addLabel: 'editor_add_entry',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            title: { type: 'text', label: 'editor_term', required: true },
                            text: { type: 'textarea', label: 'editor_definition', required: true }
                        }
                    }
                }
            }
        ],
        // Indique que ce type nécessite une normalisation
        normalizeOnLoad: true,
        denormalizeOnSave: true
    },

    // === QUIZSET ===
    // Gère tous les types H5P: MultiChoice, TrueFalse, Blanks, DragText, MarkTheWords, Essay
    'QuizSet': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    progressType: { type: 'text', label: 'editor_progress_type', hidden: true },
                    passPercentage: { type: 'number', label: 'editor_pass_percentage', hidden: true }
                }
            },
            {
                id: 'questions',
                label: 'editor_section_questions',
                icon: 'fa-list-ol',
                countField: 'questions',
                fields: {
                    questions: {
                        type: 'array',
                        itemLabel: 'editor_question',
                        addLabel: 'editor_add_question',
                        minItems: 1,
                        itemSchema: {
                            subContentId: { type: 'text', label: 'subContentId', hidden: true },
                            library: {
                                type: 'select',
                                label: 'editor_question_type',
                                required: true,
                                readonly: false,
                                options: [
                                    { value: 'H5P.MultiChoice 1.16', label: 'editor_type_multichoice' },
                                    { value: 'H5P.TrueFalse 1.8', label: 'editor_type_truefalse' },
                                    { value: 'H5P.Blanks 1.14', label: 'editor_type_blanks' },
                                    { value: 'H5P.DragText 1.10', label: 'editor_type_dragtext' },
                                    { value: 'H5P.MarkTheWords 1.11', label: 'editor_type_markwords' },
                                    { value: 'H5P.Essay 1.5', label: 'editor_type_essay' },
                                    { value: 'H5P.DragQuestion 1.14', label: 'h5p_drag_and_drop_name' }
                                ],
                                default: 'H5P.MultiChoice 1.16'
                            },
                            'metadata.title': { type: 'text', label: 'editor_question_title', required: true },
                            // Champ params dynamique
                            params: {
                                type: 'dynamicObject',
                                label: 'editor_question_params', // Un label générique, souvent caché visuellement par le wrapper
                                selector: 'library', // Nom du champ frère qui contrôle le type
                                schemas: {
                                    'H5P.MultiChoice 1.16': {
                                        question: { type: 'textarea', label: 'editor_question_text', large: true, required: true },
                                        answers: {
                                            type: 'array',
                                            itemLabel: 'editor_answer',
                                            addLabel: 'editor_add_answer',
                                            minItems: 2,
                                            nested: true,
                                            itemsExpanded: false,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_answer_text', required: true },
                                                correct: { type: 'checkbox', label: 'editor_correct_answer_label', inline: true },
                                                tipsAndFeedback: {
                                                    type: 'object',
                                                    collapsible: true,
                                                    collapsibleLabel: 'editor_tips_feedback',
                                                    schema: {
                                                        tip: { type: 'textarea', label: 'editor_tip' },
                                                        chosenFeedback: { type: 'textarea', label: 'editor_chosen_feedback' },
                                                        notChosenFeedback: { type: 'textarea', label: 'editor_not_chosen_feedback' }
                                                    }
                                                }
                                            }
                                        },
                                        behaviour: {
                                            type: 'object', label: 'editor_options', collapsible: true,
                                            schema: {
                                                singleAnswer: { type: 'checkbox', label: 'editor_single_answer', hint: 'editor_single_answer_hint' }
                                            }
                                        },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                                    },
                                    'H5P.TrueFalse 1.8': {
                                        question: { type: 'textarea', label: 'editor_question_text', large: true, required: true },
                                        correct: {
                                            type: 'select',
                                            label: 'editor_correct_answer_select',
                                            options: [
                                                { value: 'true', label: 'editor_true' },
                                                { value: 'false', label: 'editor_false' }
                                            ]
                                        },
                                        feedbackOnCorrect: { type: 'textarea', label: 'editor_feedback_correct' },
                                        feedbackOnWrong: { type: 'textarea', label: 'editor_feedback_wrong' }
                                    },
                                    'H5P.Blanks 1.14': {
                                        taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                                        questions: {
                                            type: 'array',
                                            itemLabel: 'editor_cloze_sentence',
                                            addLabel: 'editor_add_sentence',
                                            nested: true,
                                            itemsExpanded: false,
                                            itemSchema: {
                                                _value: { type: 'textarea', label: 'editor_sentence_text', required: true, hint: 'editor_blanks_hint', isArrayValue: true }
                                            }
                                        },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                                    },
                                    'H5P.DragText 1.10': {
                                        taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                                        textField: { type: 'textarea', label: 'editor_text_with_blanks', required: true, large: true, hint: 'editor_drag_words_hint' },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                                    },
                                    'H5P.MarkTheWords 1.11': {
                                        taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                                        textField: { type: 'textarea', label: 'editor_text_with_marks', required: true, large: true, hint: 'editor_mark_words_hint' },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                                    },
                                    'H5P.Essay 1.5': {
                                        taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                                        solution: {
                                            type: 'object', collapsible: true, collapsibleLabel: 'editor_essay_solution_keywords', schema: {
                                                introduction: { type: 'textarea', label: 'editor_intro' },
                                                sample: { type: 'textarea', label: 'editor_essay_sample_answer' }
                                            }
                                        },
                                        keywords: {
                                            type: 'array',
                                            itemLabel: 'editor_keyword',
                                            addLabel: 'editor_add_keyword',
                                            nested: true,
                                            itemsExpanded: false,
                                            itemContentType: 'essay-keyword',
                                            itemSchema: {
                                                keyword: { type: 'text', label: 'editor_keyword_expected', required: true },
                                                points: { type: 'number', label: 'editor_points', default: 1, min: 0 },
                                                explanation: { type: 'textarea', label: 'editor_explanation_feedback' },
                                                caseSensitive: { type: 'checkbox', label: 'editor_case_sensitive' }
                                            }
                                        },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' },
                                        behaviour: {
                                            type: 'object', collapsible: true, collapsibleLabel: 'editor_behaviour_settings', schema: {
                                                minimumLength: { type: 'number', label: 'editor_minimum_length' },
                                                maximumLength: { type: 'number', label: 'editor_maximum_length' },
                                                enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                                                ignoreScoring: { type: 'checkbox', label: 'editor_ignore_scoring', default: false }
                                            }
                                        }
                                    },
                                    'H5P.DragQuestion 1.14': {
                                        title: { type: 'textarea', label: 'editor_task_description', required: true },
                                        layoutSettings: {
                                            type: 'fieldGroup',
                                            inline: true,
                                            fields: {
                                                canvasWidth: { type: 'number', label: 'editor_canvas_width', min: 400, max: 1200, default: 800, hint: 'editor_canvas_width_hint' },
                                                elementPosition: {
                                                    type: 'select',
                                                    label: 'editor_element_position',
                                                    options: [
                                                        { value: 'down', label: 'editor_element_position_down' },
                                                        { value: 'center', label: 'editor_element_position_center' },
                                                        { value: 'up', label: 'editor_element_position_up' }
                                                    ]
                                                }
                                            }
                                        },
                                        dropZones: {
                                            type: 'array',
                                            itemLabel: 'editor_zone',
                                            addLabel: 'editor_add_zone',
                                            minItems: 2,
                                            maxItems: 10,
                                            itemsExpanded: false,
                                            itemSchema: {
                                                label: { type: 'text', label: 'editor_zone_label', required: true }
                                            }
                                        },
                                        elements: {
                                            type: 'array',
                                            itemLabel: 'editor_element',
                                            addLabel: 'editor_add_element',
                                            minItems: 2,
                                            itemsExpanded: false,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_element_text', required: true },
                                                zoneIndices: {
                                                    type: 'multiCheckbox',
                                                    label: 'editor_target_zones',
                                                    required: true,
                                                    optionsFrom: 'dropZones',
                                                    optionsLabelField: 'label',
                                                    optionsValueType: 'index',
                                                    hint: 'editor_target_zones_hint'
                                                }
                                            }
                                        },
                                        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === MARK THE WORDS ===
    'MarkTheWords': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true }
                }
            },
            {
                id: 'text',
                label: 'editor_section_text',
                icon: 'fa-paragraph',
                fields: {
                    textField: {
                        type: 'textarea',
                        label: 'editor_text_with_marks',
                        required: true,
                        large: true,
                        hint: 'editor_mark_words_hint'
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === SORT PARAGRAPHS ===
    'SortParagraphs': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description' }
                }
            },
            {
                id: 'paragraphs',
                label: 'editor_sort_paragraphs_section',
                icon: 'fa-sort',
                countField: 'paragraphs',
                fields: {
                    paragraphs: {
                        type: 'array',
                        itemLabel: 'editor_paragraph',
                        addLabel: 'editor_add_paragraph',
                        minItems: 2,
                        itemsExpanded: false,
                        hint: 'editor_sort_order_hint',
                        itemSchema: {
                            _value: {
                                type: 'text',
                                label: 'editor_paragraph_text',
                                required: true,
                                isArrayValue: true,
                                hint: 'editor_format_hint'
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === FIND THE WORDS ===
    'FindTheWords': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description' },
                    wordList: { type: 'text', label: 'editor_word_list', required: true, hint: 'editor_word_list_hint' }
                }
            }
        ]
    },

    // === SUMMARY ===
    'Summary': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    intro: { type: 'textarea', label: 'editor_intro' }
                }
            },
            {
                id: 'summaries',
                label: 'editor_section_summaries',
                icon: 'fa-align-left',
                countField: 'summaries',
                fields: {
                    summaries: {
                        type: 'array',
                        itemLabel: 'editor_summary_item',
                        addLabel: 'editor_add_summary_item',
                        minItems: 1,
                        itemSchema: {
                            summary: {
                                type: 'array',
                                itemLabel: 'editor_statement',
                                addLabel: 'editor_add_statement',
                                nested: true,
                                itemsExpanded: false,
                                itemSchema: {
                                    _value: {
                                        type: 'text',
                                        label: 'editor_statement_text',
                                        required: true,
                                        isArrayValue: true
                                    }
                                }
                            },
                            tip: {
                                type: 'textarea',
                                label: 'editor_tip',
                                collapsible: true,
                                collapsibleLabel: 'editor_tip_optional'
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: {
                        type: 'feedbackRanges',
                        label: 'editor_overall_feedback'
                    }
                }
            }
        ]
    },

    // === SINGLE CHOICE SET ===
    'SingleChoiceSet': {
        sections: [
            {
                id: 'choices',
                label: 'editor_section_questions',
                icon: 'fa-list-ul',
                countField: 'choices',
                fields: {
                    choices: {
                        type: 'array',
                        itemLabel: 'editor_question',
                        addLabel: 'editor_add_question',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            question: { type: 'textarea', label: 'editor_question_text', required: true },
                            answers: {
                                type: 'stringArray',
                                label: 'editor_answers',
                                hint: 'editor_answers_first_correct_hint'
                            }
                        }
                    }
                }
            },
            {
                id: 'feedback',
                label: 'editor_section_feedback',
                icon: 'fa-comment-dots',
                fields: {
                    overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
                }
            }
        ]
    },

    // === MOODLE QCM ===
    'elea_qcm': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true }
                }
            },
            {
                id: 'questions',
                label: 'editor_section_questions',
                icon: 'fa-list-ol',
                countField: 'questions',
                fields: {
                    questions: {
                        type: 'array',
                        itemLabel: 'editor_question',
                        addLabel: 'editor_add_question',
                        minItems: 1,
                        itemSchema: {
                            text: { type: 'textarea', label: 'editor_question_text', required: true },
                            answers: {
                                type: 'array',
                                itemLabel: 'editor_answer',
                                addLabel: 'editor_add_answer',
                                minItems: 2,
                                nested: true,
                                itemsExpanded: false,
                                itemSchema: {
                                    text: { type: 'text', label: 'editor_answer_text', required: true },
                                    iscorrect: { type: 'checkbox', label: 'editor_is_correct', valueType: 'number', inline: true }
                                }
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE APPARIEMENT ===
    'elea_appariement': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    intro: { type: 'textarea', label: 'editor_intro' }
                }
            },
            {
                id: 'pairs',
                label: 'editor_section_pairs',
                icon: 'fa-link',
                countField: 'pairs',
                fields: {
                    pairs: {
                        type: 'array',
                        itemLabel: 'editor_pair',
                        addLabel: 'editor_add_pair',
                        minItems: 2,
                        itemsExpanded: false,
                        itemSchema: {
                            question: { type: 'text', label: 'editor_left_element', required: true },
                            answer: { type: 'text', label: 'editor_right_element', required: true }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE GLOSSAIRE ===
    'elea_glossaire': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    name: { type: 'text', label: 'editor_glossary_name', required: true }
                }
            },
            {
                id: 'entries',
                label: 'editor_section_entries',
                icon: 'fa-book',
                countField: 'entries',
                fields: {
                    entries: {
                        type: 'array',
                        itemLabel: 'editor_entry',
                        addLabel: 'editor_add_entry',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            concept: { type: 'text', label: 'editor_term', required: true },
                            definition: { type: 'textarea', label: 'editor_definition', required: true },
                            aliases: { type: 'stringArray', label: 'editor_aliases' }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE MILLIONNAIRE ===
    'elea_millionnaire': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true }
                }
            },
            {
                id: 'questions',
                label: 'editor_section_questions',
                icon: 'fa-trophy',
                countField: 'questions',
                fields: {
                    questions: {
                        type: 'array',
                        itemLabel: 'editor_question',
                        addLabel: 'editor_add_question',
                        minItems: 6,
                        maxItems: 6,
                        fixedLength: true, // Empêche l'ajout/suppression
                        itemsExpanded: false,
                        itemSchema: {
                            question: { type: 'textarea', label: 'editor_question_text', required: true },
                            goodanswer: { type: 'text', label: 'editor_good_answer', required: true },
                            badanswer: {
                                type: 'stringArray',
                                label: 'editor_bad_answers',
                                hint: 'editor_bad_answers_hint',
                                minItems: 3,
                                maxItems: 3
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE TEST ===
    // Correspond au format JSON de test_1.json avec types: truefalse, cloze, multichoice, matching, numerical, shortanswer
    'elea_test': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    bank_name: { type: 'text', label: 'editor_bank_name', required: true },
                    bank_description: { type: 'textarea', label: 'editor_bank_description' }
                }
            },
            {
                id: 'questions',
                label: 'editor_section_questions',
                icon: 'fa-list-ol',
                countField: 'questions',
                fields: {
                    questions: {
                        type: 'array',
                        itemLabel: 'editor_question',
                        addLabel: 'editor_add_question',
                        minItems: 1,
                        itemSchema: {
                            type: {
                                type: 'select',
                                label: 'editor_question_type',
                                required: true,
                                options: [
                                    { value: 'multichoice', label: 'editor_test_type_multichoice' },
                                    { value: 'matching', label: 'editor_test_type_matching' },
                                    { value: 'numerical', label: 'editor_test_type_numerical' },
                                    { value: 'truefalse', label: 'editor_test_type_truefalse' },
                                    { value: 'shortanswer', label: 'editor_test_type_shortanswer' },
                                    { value: 'cloze', label: 'editor_test_type_cloze' }
                                ]
                            },
                            content: {
                                type: 'dynamicObject',
                                label: 'editor_test_question_content',
                                selector: 'type',
                                schemas: {
                                    multichoice: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                        single: {
                                            type: 'select', label: 'editor_test_selection_mode',
                                            options: [
                                                { value: 'true', label: 'editor_test_single_answer' },
                                                { value: 'false', label: 'editor_test_multiple_answers' }
                                            ]
                                        },
                                        answers: {
                                            type: 'array', itemLabel: 'editor_answer', addLabel: 'editor_add_answer', nested: true, itemsExpanded: false,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_answer_text', required: true },
                                                fraction: { type: 'number', label: 'editor_answer_fraction', hint: 'editor_score_hint' },
                                                feedback: { type: 'textarea', label: 'editor_feedback_if_chosen' }
                                            }
                                        }
                                    },
                                    matching: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                        subquestions: {
                                            type: 'array', itemLabel: 'editor_pair', addLabel: 'editor_add_pair', nested: true, itemsExpanded: false,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_left_element', required: true },
                                                answer: { type: 'text', label: 'editor_right_element', required: true }
                                            }
                                        }
                                    },
                                    truefalse: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                        answer: {
                                            type: 'object', collapsible: true, collapsibleLabel: 'editor_test_answer_settings',
                                            schema: {
                                                value: {
                                                    type: 'select', label: 'editor_correct_answer_select',
                                                    options: [{ value: true, label: 'editor_true' }, { value: false, label: 'editor_false' }]
                                                },
                                                feedback_true: { type: 'textarea', label: 'editor_feedback_if_true' },
                                                feedback_false: { type: 'textarea', label: 'editor_feedback_if_false' }
                                            }
                                        }
                                    },
                                    numerical: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                        answer: {
                                            type: 'object', collapsible: false,
                                            schema: {
                                                number: { type: 'number', label: 'editor_numerical_value', required: true },
                                                tolerance: { type: 'number', label: 'editor_numerical_tolerance' },
                                                feedback: { type: 'textarea', label: 'editor_feedback' }
                                            }
                                        }
                                    },
                                    shortanswer: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                        answers: {
                                            type: 'array', itemLabel: 'editor_test_accepted_answer', addLabel: 'editor_add_answer', nested: true, itemsExpanded: false,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_correct_answer', required: true },
                                                fraction: { type: 'number', label: 'editor_answer_fraction', hint: 'editor_score_hint_100' },
                                                feedback: { type: 'textarea', label: 'editor_feedback' }
                                            }
                                        }
                                    },
                                    cloze: {
                                        name: { type: 'text', label: 'editor_question_name', required: true },
                                        questiontext: { type: 'textarea', label: 'editor_test_type_cloze', required: true, large: true, hint: 'editor_cloze_format_hint' },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE PAGE ===
    // Supporte tous les types de blocs définis dans Page_modele.html
    'elea_page': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    intro: { type: 'textarea', label: 'editor_intro', hint: 'editor_page_intro_hint' },
                    theme: {
                        type: 'select',
                        label: 'editor_page_theme',
                        options: [
                            { value: 'elea', labelKey: 'editor_page_theme_elea' },
                            { value: 'dsfr', labelKey: 'editor_page_theme_dsfr' },
                            { value: 'accessible', labelKey: 'editor_page_theme_accessible' },
                            { value: 'dynamique', labelKey: 'editor_page_theme_dynamique' }
                        ]
                    }
                }
            },
            {
                id: 'blocks',
                label: 'editor_page_content_blocks',
                icon: 'fa-th-large',
                countField: 'blocks',
                fields: {
                    blocks: {
                        type: 'array',
                        itemLabel: 'editor_block',
                        addLabel: 'editor_add_block',
                        dynamicTitleField: 'type',
                        minItems: 1,
                        itemSchema: {
                            type: {
                                type: 'select',
                                label: 'editor_block_type',
                                required: true,
                                options: [
                                    { value: '#01_hero_header', labelKey: 'editor_block_label_01_hero_header' },
                                    { value: '#02_nav_summary', labelKey: 'editor_block_label_02_nav_summary' },
                                    { value: '#03_histo_reperes', labelKey: 'editor_block_label_03_histo_reperes' },
                                    { value: '#04_callout_set', labelKey: 'editor_block_label_04_callout_set' },
                                    { value: '#05_stats_cards', labelKey: 'editor_block_label_05_stats_cards' },
                                    { value: '#06_lexique_table', labelKey: 'editor_block_label_06_lexique_table' },
                                    { value: '#07_glossary_chips', labelKey: 'editor_block_label_07_glossary_chips' },
                                    { value: '#08_monuments_grid', labelKey: 'editor_block_label_08_monuments_grid' },
                                    { value: '#09_figures_comparison', labelKey: 'editor_block_label_09_figures_comparison' },
                                    { value: '#10_table_comparison', labelKey: 'editor_block_label_10_table_comparison' },
                                    { value: '#11_definition_box', labelKey: 'editor_block_label_11_definition_box' },
                                    { value: '#12_context_paragraphs', labelKey: 'editor_block_label_12_context_paragraphs' },
                                    { value: '#13_monument_sheet_long', labelKey: 'editor_block_label_13_monument_sheet_long' },
                                    { value: '#14_faq_block', labelKey: 'editor_block_label_14_faq_block' },
                                    { value: '#15_myths_realities', labelKey: 'editor_block_label_15_myths_realities' },
                                    { value: '#16_method_image_desc', labelKey: 'editor_block_label_16_method_image_desc' },
                                    { value: '#17_quote_bilingual', labelKey: 'editor_block_label_17_quote_bilingual' },
                                    { value: '#18_sito_graphy', labelKey: 'editor_block_label_18_sito_graphy' },
                                ]
                            },
                            data: {
                                type: 'pageBlockData',
                                label: 'editor_block_content',
                                required: true
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE DEVOIR (Grille d'évaluation) ===
    'elea_devoir': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    description: { type: 'textarea', label: 'editor_devoir_description' },
                    rubricName: { type: 'text', label: 'editor_devoir_rubric_name' }
                }
            },
            {
                id: 'rubric',
                label: 'editor_section_rubric',
                icon: 'fa-th',
                countField: 'criteria',
                fields: {
                    criteria: {
                        type: 'rubricGrid',
                        label: 'editor_section_rubric'
                    }
                }
            }
        ]
    }
};

// Mapping moduleKey -> cle de traduction (depuis definitions.js)
const moduleTranslationKeys = {
    'Flashcards': 'h5p_flashcards_name',
    'MultipleChoice': 'h5p_multiple_choice_name',
    'TrueFalse': 'h5p_true_false_name',
    'FillInTheBlanks': 'h5p_fill_in_the_blanks_name',
    'DialogCards': 'h5p_dialog_cards_name',
    'Timeline': 'h5p_timeline_name',
    'Crossword': 'h5p_crossword_name',
    'Essay': 'h5p_essay_name',
    'Chart': 'h5p_chart_name',
    'DragTheWords': 'h5p_drag_the_words_name',
    'DragAndDrop': 'h5p_drag_and_drop_name',
    'QuizSet': 'h5p_quiz_set_name',
    'Glossary': 'h5p_glossary_name',
    'MarkTheWords': 'h5p_mark_the_words_name',
    'SortParagraphs': 'h5p_sort_the_paragraphs_name',
    'FindTheWords': 'h5p_find_the_words_name',
    'Summary': 'h5p_summary_name',
    'SingleChoiceSet': 'h5p_single_choice_set_name',
    'elea_qcm': 'elea_qcm_name',
    'elea_test': 'elea_test_xml_name',
    'elea_appariement': 'elea_appariement_name',
    'elea_glossaire': 'elea_glossaire_xml_name',
    'elea_page': 'elea_page_name',
    'elea_millionnaire': 'elea_millionnaire_name',
    'elea_devoir': 'elea_devoir_name'
};

/**
 * Retourne le nom traduit d'un module via le systeme i18n
 */
function getTranslatedModuleName(moduleKey) {
    const translationKey = moduleTranslationKeys[moduleKey];
    if (translationKey) {
        const translated = t(translationKey);
        if (translated && translated !== translationKey) {
            return translated;
        }
    }
    return moduleKey;
}

// =======================================================================
// API PUBLIQUE
// =======================================================================

/**
 * Detecte le type de contenu a partir des donnees JSON
 * @param {Object} jsonData - Les donnees JSON a analyser
 * @param {string} titleKey - La cle de titre (optionnel, pour fallback)
 * @returns {Object|null} { moduleKey, moduleName, source }
 */
export function detectContentType(jsonData, titleKey) {
    if (!jsonData || typeof jsonData !== 'object') {
        return null;
    }

    // PRIORITE 1: titleKey (fiable car defini a la creation)
    // Indispensable pour distinguer les types a signatures identiques
    // (ex: MarkTheWords vs DragTheWords, QuizSetQCM vs QuizSet)
    if (titleKey && titleKeyToModuleKey[titleKey]) {
        const moduleKey = titleKeyToModuleKey[titleKey];
        // Verifier que le schema existe pour ce moduleKey
        if (fieldSchemas[moduleKey]) {
            return {
                moduleKey,
                moduleName: getTranslatedModuleName(moduleKey),
                source: moduleKey.startsWith('moodle_') ? 'moodle' : 'h5p'
            };
        }
    }

    // PRIORITE 2: Detection par signature JSON
    for (const [moduleKey, detector] of Object.entries(contentSignatures)) {
        try {
            if (detector(jsonData)) {
                return {
                    moduleKey,
                    moduleName: getTranslatedModuleName(moduleKey),
                    source: moduleKey.startsWith('moodle_') ? 'moodle' : 'h5p'
                };
            }
        } catch (e) {
            // Continuer avec le prochain
        }
    }

    return null;
}

/**
 * Traduit récursivement les labelKey en label dans un objet
 * @param {any} obj - L'objet à traduire
 * @returns {any} L'objet traduit
 */
function translateLabels(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => translateLabels(item));
    }

    const result = {};
    for (const key in obj) {
        if (key === 'labelKey' && typeof obj[key] === 'string') {
            // Traduire labelKey en label
            result.label = t(obj[key]);
        } else {
            result[key] = translateLabels(obj[key]);
        }
    }
    return result;
}

/**
 * Retourne le schema de champs pour un type de module
 * @param {string} moduleKey - La cle du module
 * @returns {Object|null} Le schema ou null
 */
export function getSchemaForType(moduleKey) {
    const schema = fieldSchemas[moduleKey] || null;
    if (schema) {
        // Cloner et traduire le schema
        const translatedSchema = translateLabels(schema);
        translatedSchema._moduleKey = moduleKey;
        return translatedSchema;
    }
    return null;
}

/**
 * Retourne le nom affichable d'un module
 * @param {string} moduleKey - La cle du module
 * @returns {string} Le nom affichable
 */
export function getModuleName(moduleKey) {
    return getTranslatedModuleName(moduleKey);
}

/**
 * Retourne tous les types supportes
 * @returns {Array} Liste des moduleKey supportes
 */
export function getSupportedTypes() {
    return Object.keys(fieldSchemas);
}

/**
 * Verifie si un type est supporte
 * @param {string} moduleKey - La cle du module
 * @returns {boolean}
 */
export function isTypeSupported(moduleKey) {
    return fieldSchemas.hasOwnProperty(moduleKey);
}

/**
 * Infere le type de question pour QuizSet
 * @param {string} libraryName - Nom de la librairie (ex: "H5P.MultiChoice 1.16")
 * @returns {string|null} Le moduleKey ou null
 */
export function inferTypeFromLibrary(libraryName) {
    if (!libraryName) return null;

    const libMapping = {
        'H5P.MultiChoice': 'MultipleChoice',
        'H5P.TrueFalse': 'TrueFalse',
        'H5P.Blanks': 'FillInTheBlanks',
        'H5P.DragText': 'DragTheWords',
        'H5P.MarkTheWords': 'MarkTheWords'
    };

    const libName = libraryName.split(' ')[0];
    return libMapping[libName] || null;
}

// =======================================================================
// NORMALISATION DES DONNÉES
// =======================================================================

/**
 * Normalise les données pour l'éditeur
 * Certains types (comme Glossary) utilisent un tableau direct qui doit être encapsulé
 * @param {Object|Array} data - Les données brutes
 * @param {string} moduleKey - La clé du module
 * @returns {Object} Les données normalisées
 */
export function normalizeDataForEditor(data, moduleKey) {
    if (!data || !moduleKey) return data;

    switch (moduleKey) {
        case 'Glossary':
            // Si c'est un tableau direct [{title, text}], l'encapsuler dans {items: [...]}
            if (Array.isArray(data)) {
                debugLog('content-detector', '[Content Detector] Normalizing Glossary array to {items: [...]}');
                return { items: data };
            }
            // Si déjà un objet avec accordion, le renommer en items
            if (data.accordion && Array.isArray(data.accordion)) {
                return { items: data.accordion };
            }
            return data;

        case 'QuizSet':
            // Normaliser les keywords Essay pour l'éditeur :
            // - "word" → "keyword" (harmonisation avec Essay autonome)
            // - "options.points" → "points" (aplatir pour le schéma éditeur)
            // - "options.caseSensitive" → "caseSensitive" (idem)
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach(q => {
                    if (q.library && q.library.startsWith('H5P.Essay') && q.params && Array.isArray(q.params.keywords)) {
                        q.params.keywords = q.params.keywords.map(kw => {
                            if (typeof kw !== 'object' || kw === null) return kw;
                            const result = { ...kw };
                            // Convertir "word" → "keyword"
                            if (result.word && !result.keyword) {
                                result.keyword = result.word;
                                delete result.word;
                            }
                            // Aplatir "options" vers les champs plats attendus par l'éditeur
                            if (result.options && typeof result.options === 'object') {
                                if (result.points === undefined && result.options.points !== undefined) {
                                    result.points = result.options.points;
                                }
                                if (result.caseSensitive === undefined && result.options.caseSensitive !== undefined) {
                                    result.caseSensitive = result.options.caseSensitive;
                                }
                                delete result.options;
                            }
                            return result;
                        });
                    }
                    // Normaliser les DragQuestion pour l'éditeur : correctElements → zoneIndices + layoutSettings
                    if (q.library && q.library.startsWith('H5P.DragQuestion') && q.params) {
                        const dropZones = q.params.dropZones || [];
                        const elements = q.params.elements || [];
                        elements.forEach(el => { el.zoneIndices = []; });
                        dropZones.forEach((zone, zoneIdx) => {
                            if (Array.isArray(zone.correctElements)) {
                                zone.correctElements.forEach(elemIdx => {
                                    const idx = typeof elemIdx === 'string' ? parseInt(elemIdx, 10) : elemIdx;
                                    if (idx >= 0 && idx < elements.length) {
                                        if (!elements[idx].zoneIndices.includes(zoneIdx)) {
                                            elements[idx].zoneIndices.push(zoneIdx);
                                        }
                                    }
                                });
                            }
                        });
                        dropZones.forEach(zone => { delete zone.correctElements; });
                    }
                });
            }
            return data;

        case 'DragAndDrop': {
            const dropZones = data.dropZones || [];
            const elements = data.elements || [];
            // Initialiser tous les éléments avec un tableau vide
            elements.forEach(el => { el.zoneIndices = []; });
            // Mapper correctElements → zoneIndices (un élément peut être dans plusieurs zones)
            dropZones.forEach((zone, zoneIdx) => {
                if (Array.isArray(zone.correctElements)) {
                    zone.correctElements.forEach(elemIdx => {
                        const idx = typeof elemIdx === 'string' ? parseInt(elemIdx, 10) : elemIdx;
                        if (idx >= 0 && idx < elements.length) {
                            if (!elements[idx].zoneIndices.includes(zoneIdx)) {
                                elements[idx].zoneIndices.push(zoneIdx);
                            }
                        }
                    });
                }
            });
            // Supprimer correctElements (inutile pendant l'édition)
            dropZones.forEach(zone => { delete zone.correctElements; });
            return data;
        }

        default:
            return data;
    }
}

/**
 * Dénormalise les données pour la sauvegarde
 * Inverse de normalizeDataForEditor - restaure le format original
 * @param {Object} data - Les données normalisées
 * @param {string} moduleKey - La clé du module
 * @returns {Object|Array} Les données au format original
 */
export function denormalizeDataForSave(data, moduleKey) {
    if (!data || !moduleKey) return data;

    switch (moduleKey) {
        case 'Glossary':
            if (data.items && Array.isArray(data.items)) {
                debugLog('content-detector', '[Content Detector] Denormalizing Glossary to array');
                return data.items;
            }
            return data;

        case 'DragAndDrop': {
            const dropZones = data.dropZones || [];
            const elements = data.elements || [];
            // Initialiser correctElements vides
            dropZones.forEach(zone => { zone.correctElements = []; });
            // Reconstruire correctElements depuis zoneIndices (un élément peut être dans plusieurs zones)
            elements.forEach((el, elemIdx) => {
                const zIndices = Array.isArray(el.zoneIndices) ? el.zoneIndices : [];
                zIndices.forEach(zIdx => {
                    const idx = typeof zIdx === 'string' ? parseInt(zIdx, 10) : zIdx;
                    if (idx >= 0 && idx < dropZones.length && !dropZones[idx].correctElements.includes(elemIdx)) {
                        dropZones[idx].correctElements.push(elemIdx);
                    }
                });
            });
            // Supprimer zoneIndices (pas dans le format original)
            elements.forEach(el => { delete el.zoneIndices; });
            return data;
        }

        case 'QuizSet':
        case 'QuizSetQCM':
        case 'QuizSetVF': {
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach(q => {
                    // DragQuestion : zoneIndices → correctElements + layoutSettings → plat
                    if (q.library && q.library.startsWith('H5P.DragQuestion') && q.params) {
                        const dropZones = q.params.dropZones || [];
                        const elements = q.params.elements || [];
                        dropZones.forEach(zone => { zone.correctElements = []; });
                        elements.forEach((el, elemIdx) => {
                            const zIndices = Array.isArray(el.zoneIndices) ? el.zoneIndices : [];
                            zIndices.forEach(zIdx => {
                                const idx = typeof zIdx === 'string' ? parseInt(zIdx, 10) : zIdx;
                                if (idx >= 0 && idx < dropZones.length && !dropZones[idx].correctElements.includes(elemIdx)) {
                                    dropZones[idx].correctElements.push(elemIdx);
                                }
                            });
                        });
                        elements.forEach(el => { delete el.zoneIndices; });
                    }
                    // Essay : reconvertir les champs aplatis → options imbriquées
                    if (q.library && q.library.startsWith('H5P.Essay') && q.params && Array.isArray(q.params.keywords)) {
                        q.params.keywords = q.params.keywords.map(kw => {
                            if (typeof kw !== 'object' || kw === null) return kw;
                            const result = { keyword: kw.keyword };
                            result.options = {
                                points: kw.points !== undefined ? kw.points : 1,
                                caseSensitive: kw.caseSensitive !== undefined ? kw.caseSensitive : false
                            };
                            return result;
                        });
                    }
                });
            }
            // Retourner directement — le nettoyage récursif du default est incompatible avec
            // les sous-types QuizSet : il supprime correctElements (reconstruit par la dénormalisation),
            // canvasWidth/elementPosition (plats mais dans un fieldGroup dans le schéma), etc.
            return data;
        }

        default:
            // Pour tous les types, on applique un nettoyage récursif pour supprimer les champs orphelins (dus aux dynamicObject)
            const schema = getSchemaForType(moduleKey);
            if (schema) {
                return cleanDataBasedOnSchema(data, schema);
            }
            return data;
    }
}

/**
 * Deep merge de deux objets - fusionne récursivement les sous-objets
 * au lieu d'écraser comme Object.assign (merge superficiel)
 */
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (
            source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
            target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
        ) {
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

/**
 * Nettoie les données en ne gardant que ce qui est défini dans le schéma
 * Utile pour les dynamicObject où des propriétés d'autres types peuvent être restées
 */
function cleanDataBasedOnSchema(data, schemaDef) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data; // On ne traite pas les tableaux racine ici, gérés par leurs items

    const cleaned = {};
    const schemaFields = schemaDef.fields || schemaDef; // Support sections root or flat schema

    // Si on a des sections, on doit aplatir ou itérer sur les sections
    if (schemaDef.sections) {
        for (const section of schemaDef.sections) {
            if (section.fields) {
                const sectionData = cleanDataBasedOnSchema(data, section.fields);
                // Deep merge pour ne pas écraser les objets imbriqués partagés entre sections
                // (ex: Timeline où timeline.headline, timeline.date, timeline.era sont dans 3 sections différentes)
                deepMerge(cleaned, sectionData);
            }
        }
        return cleaned;
    }

    // Itération sur les champs du schéma
    for (const [key, config] of Object.entries(schemaDef)) {
        // Support access via dot notation for nested values
        let value = undefined;
        let valueFound = false;

        if (key.includes('.')) {
            value = getNestedValue(data, key); // Use imported getNestedValue
            // On considère trouvé si != undefined, car data.hasOwnProperty ne marche pas sur dotted
            if (value !== undefined) valueFound = true;
        } else if (data.hasOwnProperty(key)) {
            value = data[key];
            valueFound = true;
        }

        if (valueFound) {
            if (config.type === 'dynamicObject' && config.selector && config.schemas) {
                // Pour un objet dynamique, on regarde le sélecteur
                // Le sélecteur est un champ FRÈRE.
                // data[config.selector] doit exister. Mais ici on est dans 'data', donc on a accès.
                // Wait, si le schema est structuré flat (ex: params), comment on sait ?
                // Dans QuizSet: params est un champ. library est frère de params (donc dans data parent).
                // Ah, problème : cleanDataBasedOnSchema est appelé sur l'objet qui contient params?
                // Non, ici on itère sur les clés de data (NON, on itère sur schemaDef).
                // Donc 'params' est 'key'.
                // 'library' doit être dans 'data'.

                // Mais wait, si data est nested (ex: QuizSet item), data.library existe.
                const selectorValue = getNestedValue(data, config.selector) || data[config.selector];
                const subSchema = config.schemas[selectorValue];

                if (subSchema) {
                    const cleanedValue = cleanDataBasedOnSchema(value, subSchema);
                    if (key.includes('.')) {
                        setNestedValue(cleaned, key, cleanedValue);
                    } else {
                        cleaned[key] = cleanedValue;
                    }
                } else {
                    // Pas de schema actif pour ce type ?
                    if (selectorValue) {
                        // On garde tel quel
                        if (key.includes('.')) {
                            setNestedValue(cleaned, key, value);
                        } else {
                            cleaned[key] = value;
                        }
                    }
                }
            } else if (config.type === 'array' && config.itemSchema) {
                if (Array.isArray(value)) {
                    const cleanedArray = value.map(item => {
                        if (config.itemSchema._value && config.itemSchema._value.isArrayValue) {
                            return item;
                        }
                        return cleanDataBasedOnSchema(item, config.itemSchema);
                    });

                    if (key.includes('.')) {
                        setNestedValue(cleaned, key, cleanedArray);
                    } else {
                        cleaned[key] = cleanedArray;
                    }
                } else {
                    if (key.includes('.')) {
                        setNestedValue(cleaned, key, value);
                    } else {
                        cleaned[key] = value;
                    }
                }
            } else if (config.type === 'object' && config.schema) {
                const cleanedValue = cleanDataBasedOnSchema(value, config.schema);
                if (key.includes('.')) {
                    setNestedValue(cleaned, key, cleanedValue);
                } else {
                    cleaned[key] = cleanedValue;
                }
            } else {
                // Champ simple
                if (key.includes('.')) {
                    setNestedValue(cleaned, key, value);
                } else {
                    cleaned[key] = value;
                }
            }
        } else if (config.type === 'fieldGroup' && config.fields) {
            // fieldGroup est purement visuel — les sous-champs sont au top level des données
            // (pas imbriqués dans un objet portant le nom du fieldGroup)
            for (const [subKey, subConfig] of Object.entries(config.fields)) {
                if (data.hasOwnProperty(subKey)) {
                    cleaned[subKey] = data[subKey];
                }
            }
        }
    }

    // Cas spécial: conserver les propriétés qui ne sont pas dans le schéma mais qui sont essentielles ?
    // Pour l'instant le schema couvre tout.
    // Attention: les champs cachés par dynamicObject ne seront pas copiés, ce qui est le but !

    return cleaned;
}
