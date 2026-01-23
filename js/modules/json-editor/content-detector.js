/**
 * Content Detector - Detection automatique du type de contenu
 *
 * Analyse la structure JSON pour identifier le type de module
 * et retourne le schema de champs correspondant.
 */

import { t } from '../translation.js';

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
        Array.isArray(data.keywords),

    'DragTheWords': (data) =>
        data.hasOwnProperty('taskDescription') &&
        data.hasOwnProperty('textField') &&
        typeof data.textField === 'string',

    'QuizSet': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('library'),

    'Glossary': (data) =>
        Array.isArray(data.accordion) &&
        data.accordion.length > 0 &&
        data.accordion[0].hasOwnProperty('title') &&
        data.accordion[0].hasOwnProperty('content'),

    'MarkTheWords': (data) =>
        data.hasOwnProperty('taskDescription') &&
        data.hasOwnProperty('textField') &&
        data.textField?.includes('*'),

    'SortParagraphs': (data) =>
        Array.isArray(data.paragraphs) &&
        data.paragraphs.length > 0,

    'FindTheWords': (data) =>
        Array.isArray(data.wordList) &&
        data.wordList.length > 0,

    'Summary': (data) =>
        Array.isArray(data.summaries) &&
        data.summaries.length > 0,

    'SingleChoiceSet': (data) =>
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        data.choices[0].hasOwnProperty('question'),

    // === Moodle/Elea Types ===
    'moodle_qcm': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('answers') &&
        data.questions[0].answers[0]?.hasOwnProperty('iscorrect'),

    'moodle_test': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('type') &&
        data.questions[0].hasOwnProperty('content'),

    'moodle_appariement': (data) =>
        Array.isArray(data.pairs) &&
        data.pairs.length > 0 &&
        data.pairs[0].hasOwnProperty('question') &&
        data.pairs[0].hasOwnProperty('answer'),

    'moodle_glossaire': (data) =>
        Array.isArray(data.entries) &&
        data.entries.length > 0 &&
        data.entries[0].hasOwnProperty('concept') &&
        data.entries[0].hasOwnProperty('definition'),

    'moodle_page': (data) =>
        Array.isArray(data.blocks) &&
        data.blocks.length > 0 &&
        data.blocks[0].hasOwnProperty('type'),

    'moodle_millionnaire': (data) =>
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        data.questions[0].hasOwnProperty('question') &&
        data.questions[0].hasOwnProperty('goodanswer') &&
        Array.isArray(data.questions[0].badanswer)
};

// Mapping titleKey -> moduleKey pour fallback
const titleKeyToModuleKey = {
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
    'elea_qcm': 'moodle_qcm',
    'elea_test': 'moodle_test',
    'elea_appariement': 'moodle_appariement',
    'elea_glossaire': 'moodle_glossaire',
    'elea_page': 'moodle_page',
    'elea_millionnaire': 'moodle_millionnaire'
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
                        itemSchema: {
                            text: { type: 'text', label: 'editor_answer_text', required: true },
                            correct: { type: 'checkbox', label: 'editor_is_correct' },
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
                    'timeline.text': { type: 'textarea', label: 'editor_description' }
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
                        itemSchema: {
                            startDate: { type: 'text', label: 'editor_start_date', required: true, placeholder: 'YYYY,M,D' },
                            endDate: { type: 'text', label: 'editor_end_date', placeholder: 'YYYY,M,D' },
                            headline: { type: 'text', label: 'editor_event_title', required: true },
                            text: { type: 'textarea', label: 'editor_event_description' },
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
                        itemSchema: {
                            text: { type: 'text', label: 'editor_keyword_text', required: true },
                            weight: { type: 'number', label: 'editor_keyword_weight', hint: 'Poids du mot-clé (généralement 1)' }
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

    // === GLOSSARY (Accordion) ===
    'Glossary': {
        sections: [
            {
                id: 'entries',
                label: 'editor_section_entries',
                icon: 'fa-book',
                countField: 'accordion',
                fields: {
                    accordion: {
                        type: 'array',
                        itemLabel: 'editor_entry',
                        addLabel: 'editor_add_entry',
                        minItems: 1,
                        itemSchema: {
                            title: { type: 'text', label: 'editor_term', required: true },
                            text: { type: 'textarea', label: 'editor_definition', required: true }
                        }
                    }
                }
            }
        ]
    },

    // === QUIZSET ===
    'QuizSet': {
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
                            library: { type: 'text', label: 'editor_library_type', required: true, hint: 'Ex: H5P.TrueFalse 1.8' },
                            'metadata.title': { type: 'text', label: 'editor_question_title', required: true },
                            params: {
                                type: 'object',
                                label: 'editor_question_params',
                                collapsible: true,
                                collapsibleLabel: 'editor_parameters',
                                schema: {
                                    question: { type: 'textarea', label: 'editor_question_text', required: true },
                                    correct: { type: 'text', label: 'editor_correct_answer', hint: 'Pour Vrai/Faux: "true" ou "false"' }
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
                label: 'editor_section_paragraphs',
                icon: 'fa-sort',
                countField: 'paragraphs',
                fields: {
                    paragraphs: {
                        type: 'array',
                        itemLabel: 'editor_paragraph',
                        addLabel: 'editor_add_paragraph',
                        minItems: 2,
                        itemSchema: {
                            _value: {
                                type: 'textarea',
                                label: 'editor_paragraph_text',
                                required: true,
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

    // === FIND THE WORDS ===
    'FindTheWords': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    taskDescription: { type: 'textarea', label: 'editor_task_description' },
                    wordList: { type: 'text', label: 'editor_word_list', required: true, hint: 'Mots séparés par des virgules (ex: MOT1,MOT2,MOT3)' }
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
                                itemSchema: {
                                    _value: {
                                        type: 'text',
                                        label: 'editor_statement_text',
                                        required: true,
                                        isArrayValue: true
                                    }
                                }
                            }
                        }
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
                        itemSchema: {
                            question: { type: 'textarea', label: 'editor_question_text', required: true },
                            answers: {
                                type: 'stringArray',
                                label: 'editor_answers',
                                hint: 'Entrez une réponse par ligne (la première est la bonne réponse)'
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
    'moodle_qcm': {
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
                                itemSchema: {
                                    text: { type: 'text', label: 'editor_answer_text', required: true },
                                    iscorrect: { type: 'checkbox', label: 'editor_is_correct', valueType: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE APPARIEMENT ===
    'moodle_appariement': {
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
    'moodle_glossaire': {
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
                        itemSchema: {
                            concept: { type: 'text', label: 'editor_term', required: true },
                            definition: { type: 'textarea', label: 'editor_definition', required: true }
                        }
                    }
                }
            }
        ]
    },

    // === MOODLE MILLIONNAIRE ===
    'moodle_millionnaire': {
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
                        minItems: 1,
                        itemSchema: {
                            question: { type: 'textarea', label: 'editor_question_text', required: true },
                            goodanswer: { type: 'text', label: 'editor_good_answer', required: true },
                            badanswer: {
                                type: 'stringArray',
                                label: 'editor_bad_answers',
                                hint: 'Entrez une mauvaise réponse par ligne (exactement 3)',
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
    'moodle_test': {
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
                                    { value: 'multichoice', label: 'Choix multiple' },
                                    { value: 'matching', label: 'Appariement' },
                                    { value: 'numerical', label: 'Numérique' },
                                    { value: 'truefalse', label: 'Vrai/Faux' },
                                    { value: 'shortanswer', label: 'Réponse courte' },
                                    { value: 'cloze', label: 'Texte à trous (Cloze)' }
                                ]
                            },
                            content: {
                                type: 'object',
                                label: 'editor_section_content',
                                collapsible: false,
                                schema: {
                                    name: { type: 'text', label: 'editor_question_name', required: true },
                                    questiontext: { type: 'textarea', label: 'editor_question_text', required: true },
                                    feedback: { type: 'textarea', label: 'editor_question_feedback' },
                                    // Pour multichoice et shortanswer
                                    answers: {
                                        type: 'array',
                                        itemLabel: 'editor_answer',
                                        addLabel: 'editor_add_answer',
                                        nested: true,
                                        itemSchema: {
                                            text: { type: 'text', label: 'editor_answer_text', required: true },
                                            fraction: { type: 'number', label: 'editor_answer_fraction', hint: '100 pour correct, 0 pour incorrect' },
                                            feedback: { type: 'textarea', label: 'editor_answer_feedback' }
                                        }
                                    },
                                    // Pour matching
                                    subquestions: {
                                        type: 'array',
                                        itemLabel: 'editor_subquestion',
                                        addLabel: 'editor_add_subquestion',
                                        nested: true,
                                        itemSchema: {
                                            text: { type: 'text', label: 'editor_question_text', required: true },
                                            answer: { type: 'text', label: 'editor_answer_text', required: true }
                                        }
                                    },
                                    // Pour numerical et truefalse - champ answer qui peut être objet
                                    answer: {
                                        type: 'object',
                                        label: 'editor_answer',
                                        collapsible: true,
                                        collapsibleLabel: 'editor_answer',
                                        schema: {
                                            // Pour numerical
                                            number: { type: 'number', label: 'editor_numerical_value' },
                                            tolerance: { type: 'number', label: 'editor_numerical_tolerance' },
                                            // Pour truefalse
                                            value: {
                                                type: 'select',
                                                label: 'editor_correct_answer',
                                                options: [
                                                    { value: true, label: 'editor_true' },
                                                    { value: false, label: 'editor_false' }
                                                ]
                                            },
                                            feedback_true: { type: 'textarea', label: 'editor_feedback_if_true' },
                                            feedback_false: { type: 'textarea', label: 'editor_feedback_if_false' },
                                            // Feedback commun
                                            feedback: { type: 'textarea', label: 'editor_answer_feedback' }
                                        }
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
    'moodle_page': {
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
                id: 'blocks',
                label: 'editor_section_blocks',
                icon: 'fa-th-large',
                countField: 'blocks',
                fields: {
                    blocks: {
                        type: 'array',
                        itemLabel: 'editor_block',
                        addLabel: 'editor_add_block',
                        minItems: 1,
                        itemSchema: {
                            type: {
                                type: 'select',
                                label: 'editor_block_type',
                                required: true,
                                options: [
                                    { value: 'text', label: 'Texte' },
                                    { value: 'heading', label: 'Titre' },
                                    { value: 'image', label: 'Image' }
                                ]
                            },
                            content: { type: 'textarea', label: 'editor_block_content', required: true }
                        }
                    }
                }
            }
        ]
    }
};

// Noms affichables des modules
const moduleNames = {
    'Flashcards': 'Flashcards',
    'MultipleChoice': 'Choix multiples',
    'TrueFalse': 'Vrai/Faux',
    'FillInTheBlanks': 'Texte a trous',
    'DialogCards': 'Dialog Cards',
    'Timeline': 'Frise chronologique',
    'Crossword': 'Mots croises',
    'Essay': 'Essai',
    'DragTheWords': 'Glisser les mots',
    'QuizSet': 'Quiz',
    'Glossary': 'Glossaire',
    'MarkTheWords': 'Marquer les mots',
    'SortParagraphs': 'Trier les paragraphes',
    'FindTheWords': 'Trouver les mots',
    'Summary': 'Resume',
    'SingleChoiceSet': 'Choix unique',
    'moodle_qcm': 'QCM Elea',
    'moodle_test': 'Test Elea',
    'moodle_appariement': 'Appariement',
    'moodle_glossaire': 'Glossaire Elea',
    'moodle_page': 'Page Elea',
    'moodle_millionnaire': 'Millionnaire'
};

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

    // Essayer d'abord par signature
    for (const [moduleKey, detector] of Object.entries(contentSignatures)) {
        try {
            if (detector(jsonData)) {
                return {
                    moduleKey,
                    moduleName: moduleNames[moduleKey] || moduleKey,
                    source: moduleKey.startsWith('moodle_') ? 'moodle' : 'h5p'
                };
            }
        } catch (e) {
            // Continuer avec le prochain
        }
    }

    // Fallback par titleKey
    if (titleKey && titleKeyToModuleKey[titleKey]) {
        const moduleKey = titleKeyToModuleKey[titleKey];
        return {
            moduleKey,
            moduleName: moduleNames[moduleKey] || moduleKey,
            source: moduleKey.startsWith('moodle_') ? 'moodle' : 'h5p'
        };
    }

    return null;
}

/**
 * Retourne le schema de champs pour un type de module
 * @param {string} moduleKey - La cle du module
 * @returns {Object|null} Le schema ou null
 */
export function getSchemaForType(moduleKey) {
    return fieldSchemas[moduleKey] || null;
}

/**
 * Retourne le nom affichable d'un module
 * @param {string} moduleKey - La cle du module
 * @returns {string} Le nom affichable
 */
export function getModuleName(moduleKey) {
    return moduleNames[moduleKey] || moduleKey;
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
