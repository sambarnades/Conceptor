/**
 * Content Detector - Detection automatique du type de contenu
 *
 * Analyse la structure JSON pour identifier le type de module
 * et retourne le schema de champs correspondant.
 */

import { t } from '../core/translation.js';
// `core/utils.js` n'est PAS partagé avec Sucrerie (chaque dépôt a le sien) : n'importer
// ici que des helpers présents des DEUX côtés. `debugLog` et `markdownToHtml` le sont
// (corps fonctionnellement identiques, vérifié).
import { debugLog, markdownToHtml } from '../core/utils.js';
import { getNestedValue, setNestedValue } from './json-utils.js';
import { normalizeFractions } from '../moodle/moodle-formats.js';

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

    // Dictation : sentences[] d'objets {text} (ou chaînes). Signature unique — ne pas
    // confondre avec FillInTheBlanks (questions[] de chaînes) ni Summary (summaries[]).
    'Dictation': (data) =>
        Array.isArray(data.sentences) &&
        data.sentences.length > 0 &&
        (typeof data.sentences[0] === 'string' ||
            (data.sentences[0] && data.sentences[0].hasOwnProperty('text'))),

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

    'elea_livre': (data) =>
        Array.isArray(data.chapters) &&
        data.chapters.length > 0 &&
        data.chapters[0].hasOwnProperty('blocks') &&
        Array.isArray(data.chapters[0].blocks),

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
        Array.isArray(data.criteria[0].levels),

    'CoursePresentation': (data) =>
        Array.isArray(data.slides) &&
        data.slides.length > 0 &&
        data.slides[0].hasOwnProperty('type') &&
        typeof data.slides[0].type === 'string',

    // InteractiveBook : chapters[] avec content[] (le Livre Elea utilise chapters[].blocks → exclu)
    'InteractiveBook': (data) =>
        Array.isArray(data.chapters) &&
        data.chapters.length > 0 &&
        !data.chapters[0].hasOwnProperty('blocks') &&
        (Array.isArray(data.chapters[0].content) || data.chapters[0].hasOwnProperty('title')),

    // InteractiveVideo : interactions[] horodatées (+ videoSource éventuel)
    'InteractiveVideo': (data) =>
        Array.isArray(data.interactions) &&
        ((data.videoSource && typeof data.videoSource === 'object') ||
            (data.interactions.length > 0 && data.interactions[0] && data.interactions[0].hasOwnProperty('timestamp'))),

    // Find Multiple Hotspots : content.json complet OU format plat « zones à trouver » (hotspots[]
    // avec `correct`) + un champ propre à ce type (hotspotName / numberHotspots /
    // alreadySelectedFeedback). Déclaré AVANT FindTheHotspot et ImageHotspots : signatures
    // voisines, du plus spécifique au moins spécifique.
    'FindMultipleHotspots': (data) =>
        !!(data.imageMultipleHotspotQuestion && typeof data.imageMultipleHotspotQuestion === 'object') ||
        (Array.isArray(data.hotspots) && data.hotspots.length > 0 &&
            data.hotspots[0] && typeof data.hotspots[0] === 'object' && data.hotspots[0].hasOwnProperty('correct') &&
            (data.hasOwnProperty('hotspotName') || data.hasOwnProperty('numberHotspots') || data.hasOwnProperty('alreadySelectedFeedback'))),

    // Find the Hotspot : content.json complet OU format plat avec zones correct/incorrect
    // (repli après FindMultipleHotspots, qui capte d'abord ses champs propres).
    'FindTheHotspot': (data) =>
        !!(data.imageHotspotQuestion && typeof data.imageHotspotQuestion === 'object') ||
        (Array.isArray(data.hotspots) && data.hotspots.length > 0 &&
            data.hotspots[0] && typeof data.hotspots[0] === 'object' && data.hotspots[0].hasOwnProperty('correct')),

    // ImageHotspots (« Image interactive ») : hotspots[] avec position x/y (format plat OU content.json
    // v1.11). Exclut les zones `correct` (signatures des deux « questions hotspot » ci-dessus).
    'ImageHotspots': (data) =>
        Array.isArray(data.hotspots) &&
        !(data.hotspots.length > 0 && data.hotspots[0] && typeof data.hotspots[0] === 'object' &&
            data.hotspots[0].hasOwnProperty('correct')) &&
        (data.hasOwnProperty('globalIconType') || data.hasOwnProperty('globalColor') || data.hasOwnProperty('image') ||
            (data.hotspots.length > 0 && data.hotspots[0] && typeof data.hotspots[0] === 'object' &&
                (data.hotspots[0].hasOwnProperty('x') || data.hotspots[0].hasOwnProperty('position'))))
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
    'h5p_dictation_name': 'Dictation',
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
    'h5p_dictation': 'Dictation',
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
    'elea_livre_name': 'elea_livre',
    'elea_qcm': 'elea_qcm',
    'elea_test': 'elea_test',
    'elea_appariement': 'elea_appariement',
    'elea_glossaire': 'elea_glossaire',
    'elea_page': 'elea_page',
    'elea_livre': 'elea_livre',
    'elea_millionnaire': 'elea_millionnaire',
    'elea_devoir_name': 'elea_devoir',
    'elea_devoir': 'elea_devoir',
    'h5p_course_presentation_name': 'CoursePresentation',
    'h5p_coursepresentation': 'CoursePresentation',
    'h5p_interactive_book_name': 'InteractiveBook',
    'h5p_interactivebook': 'InteractiveBook',
    'h5p_interactive_video_name': 'InteractiveVideo',
    'h5p_interactivevideo': 'InteractiveVideo',
    'h5p_image_hotspots_name': 'ImageHotspots',
    'h5p_image_hotspots': 'ImageHotspots',
    'h5p_imagehotspots': 'ImageHotspots',
    'h5p_find_the_hotspot_name': 'FindTheHotspot',
    'h5p_find_the_hotspot': 'FindTheHotspot',
    'h5p_findthehotspot': 'FindTheHotspot',
    'h5p_imagehotspotquestion': 'FindTheHotspot',
    'h5p_find_multiple_hotspots_name': 'FindMultipleHotspots',
    'h5p_find_multiple_hotspots': 'FindMultipleHotspots',
    'h5p_findmultiplehotspots': 'FindMultipleHotspots',
    'h5p_imagemultiplehotspotquestion': 'FindMultipleHotspots'
};

// =======================================================================
// SCHEMAS DE CHAMPS
// =======================================================================

/**
 * Sous-schemas exercice partages entre CoursePresentation et ses dynamicObject.
 * Identiques aux schemas des activites standalone — aucune restructuration.
 */
const CP_EXERCISE_SCHEMAS = {
    'H5P.MultiChoice 1.16': {
        question: { type: 'textarea', label: 'editor_question_text', large: true, required: true },
        answers: {
            type: 'array', itemLabel: 'editor_answer', addLabel: 'editor_add_answer',
            minItems: 2, nested: true, itemsExpanded: true,
            itemSchema: {
                text: { type: 'text', label: 'editor_answer_text', required: true },
                correct: { type: 'checkbox', label: 'editor_correct_answer_label', inline: true },
                tipsAndFeedback: {
                    type: 'object', collapsible: true, collapsibleLabel: 'editor_tips_feedback',
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
            schema: { singleAnswer: { type: 'checkbox', label: 'editor_single_answer', hint: 'editor_single_answer_hint' } }
        },
        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
    },
    'H5P.TrueFalse 1.8': {
        question: { type: 'textarea', label: 'editor_question_text', large: true, required: true },
        correct: {
            type: 'select', label: 'editor_correct_answer_select',
            options: [{ value: 'true', label: 'editor_true' }, { value: 'false', label: 'editor_false' }]
        },
        feedbackOnCorrect: { type: 'textarea', label: 'editor_feedback_correct' },
        feedbackOnWrong: { type: 'textarea', label: 'editor_feedback_wrong' }
    },
    'H5P.Blanks 1.14': {
        taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
        questions: {
            type: 'array', itemLabel: 'editor_cloze_sentence', addLabel: 'editor_add_sentence',
            nested: true, itemsExpanded: true,
            itemSchema: { _value: { type: 'textarea', label: 'editor_sentence_text', required: true, hint: 'editor_blanks_hint', isArrayValue: true } }
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
    'H5P.DragQuestion 1.15': {
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
            type: 'array', itemLabel: 'editor_zone', addLabel: 'editor_add_zone',
            // Les étiquettes visent leurs zones par INDICE (`elements[].zoneIndices`, déclaré
            // `optionsValueType: 'index'`) : supprimer, insérer, dupliquer ou déplacer une zone
            // renumérote les suivantes, et ces renvois doivent suivre — sinon les étiquettes
            // changent de zone en silence. Cf. remapIndexReferences() dans json-utils.js.
            indexReferencedBy: [{ array: 'elements', field: 'zoneIndices' }],
            minItems: 2, maxItems: 10, itemsExpanded: true,
            itemSchema: { label: { type: 'text', label: 'editor_zone_label', required: true } }
        },
        elements: {
            type: 'array', itemLabel: 'editor_element', addLabel: 'editor_add_element',
            minItems: 2, itemsExpanded: true,
            itemSchema: {
                text: { type: 'text', label: 'editor_element_text', required: true },
                image: {
                    type: 'image', label: 'editor_image', hint: 'editor_image_element_hint',
                    collapsible: true, collapsibleLabel: 'editor_image', altTextField: 'imageAltText'
                },
                zoneIndices: {
                    type: 'multiCheckbox', label: 'editor_target_zones', required: true,
                    optionsFrom: 'dropZones', optionsLabelField: 'label', optionsValueType: 'index',
                    hint: 'editor_target_zones_hint'
                }
            }
        },
        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
    },
    'H5P.SingleChoiceSet 1.11': {
        choices: {
            type: 'array', itemLabel: 'editor_question', addLabel: 'editor_add_question',
            minItems: 1, itemsExpanded: false,
            itemSchema: {
                question: { type: 'textarea', label: 'editor_question_text', required: true },
                answers: { type: 'stringArray', label: 'editor_answers', hint: 'editor_answers_first_correct_hint' }
            }
        },
        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
    },
    'H5P.Summary 1.10': {
        intro: { type: 'textarea', label: 'editor_intro' },
        summaries: {
            type: 'array', itemLabel: 'editor_summary_item', addLabel: 'editor_add_summary_item',
            minItems: 1,
            itemSchema: {
                summary: {
                    type: 'array', itemLabel: 'editor_statement', addLabel: 'editor_add_statement',
                    nested: true, itemsExpanded: true,
                    itemSchema: { _value: { type: 'text', label: 'editor_statement_text', required: true, isArrayValue: true } }
                },
                tip: { type: 'textarea', label: 'editor_tip', collapsible: true, collapsibleLabel: 'editor_tip_optional' }
            }
        },
        overallFeedback: { type: 'feedbackRanges', label: 'editor_overall_feedback' }
    },
    'H5P.Dialogcards 1.9': {
        title: { type: 'text', label: 'editor_title' },
        description: { type: 'textarea', label: 'editor_description' },
        dialogs: {
            type: 'array', itemLabel: 'editor_card', addLabel: 'editor_add_card',
            minItems: 1, itemsExpanded: false,
            itemSchema: {
                text: { type: 'textarea', label: 'editor_card_front', required: true },
                answer: { type: 'textarea', label: 'editor_card_back', required: true },
                tips: {
                    type: 'object', collapsible: true, collapsibleLabel: 'editor_tips_optional',
                    schema: { front: { type: 'text', label: 'editor_tip_front' }, back: { type: 'text', label: 'editor_tip_back' } }
                }
            }
        }
    }
};

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
                            image: {
                                type: 'image',
                                label: 'editor_image',
                                hint: 'editor_image_card_hint',
                                collapsible: true,
                                collapsibleLabel: 'editor_image',
                                altTextField: 'imageAltText'
                            },
                            tip: {
                                type: 'textarea',
                                label: 'editor_card_tip',
                                collapsible: true,
                                collapsibleLabel: 'editor_tip_optional'
                            }
                        }
                    }
                }
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            randomCards: { type: 'checkbox', label: 'editor_random_cards', default: false, hint: 'editor_random_cards_hint' },
                            caseSensitive: { type: 'checkbox', label: 'editor_case_sensitive', default: false }
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
                    question: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
                        itemsExpanded: true,
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            randomAnswers: { type: 'checkbox', label: 'editor_random_answers', default: true, hint: 'editor_random_answers_hint' },
                            singlePoint: { type: 'checkbox', label: 'editor_single_point', default: false, hint: 'editor_single_point_hint' },
                            showScorePoints: { type: 'checkbox', label: 'editor_show_score_points', default: true },
                            autoCheck: { type: 'checkbox', label: 'editor_auto_check', default: false, hint: 'editor_auto_check_hint' },
                            passPercentage: { type: 'number', label: 'editor_pass_percentage', default: 50, min: 0, max: 100, hint: 'editor_pass_percentage_hint' },
                            confirmCheckDialog: { type: 'checkbox', label: 'editor_confirm_check_dialog', default: false, hint: 'editor_confirm_check_dialog_hint' },
                            confirmRetryDialog: { type: 'checkbox', label: 'editor_confirm_retry_dialog', default: false, hint: 'editor_confirm_retry_dialog_hint' }
                        }
                    }
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
                    question: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            autoCheck: { type: 'checkbox', label: 'editor_auto_check', default: false, hint: 'editor_auto_check_hint' },
                            confirmCheckDialog: { type: 'checkbox', label: 'editor_confirm_check_dialog', default: false, hint: 'editor_confirm_check_dialog_hint' },
                            confirmRetryDialog: { type: 'checkbox', label: 'editor_confirm_retry_dialog', default: false, hint: 'editor_confirm_retry_dialog_hint' }
                        }
                    }
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
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            caseSensitive: { type: 'checkbox', label: 'editor_case_sensitive', default: false },
                            acceptSpellingErrors: { type: 'checkbox', label: 'editor_accept_spelling_errors', default: false, hint: 'editor_accept_spelling_errors_hint' },
                            autoCheck: { type: 'checkbox', label: 'editor_auto_check', default: true, hint: 'editor_auto_check_hint' },
                            separateLines: { type: 'checkbox', label: 'editor_separate_lines', default: false, hint: 'editor_separate_lines_hint' },
                            confirmCheckDialog: { type: 'checkbox', label: 'editor_confirm_check_dialog', default: false, hint: 'editor_confirm_check_dialog_hint' },
                            confirmRetryDialog: { type: 'checkbox', label: 'editor_confirm_retry_dialog', default: false, hint: 'editor_confirm_retry_dialog_hint' }
                        }
                    }
                }
            }
        ]
    },

    // === DICTATION (dictée) ===
    // L'audio des phrases est SYNTHÉTISÉ par l'hôte (panneau réglages TTS monté par
    // l'index.js divergent de chaque dépôt, cf. editor/dictation-tts-panel.js). Les champs
    // audio ci-dessous permettent en plus un téléversement MANUEL (jamais écrasé par la
    // synthèse) : valeur éditeur { path, mime, kind, dataURL } ↔ tableau H5P via
    // normalizeDataForEditor / denormalizeDataForSave.
    'Dictation': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title' },
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                    // Bloc « Média » H5P (illustration au-dessus de la consigne) — patron
                    // media context, mêmes clés i18n que Choix multiples.
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
                }
            },
            {
                id: 'sentences',
                label: 'editor_section_sentences',
                icon: 'fa-headphones',
                countField: 'sentences',
                fields: {
                    sentences: {
                        type: 'array',
                        itemLabel: 'editor_sentence',
                        addLabel: 'editor_add_sentence',
                        minItems: 1,
                        itemsExpanded: false,
                        itemSchema: {
                            text: { type: 'textarea', label: 'editor_dictation_text', required: true, hint: 'editor_dictation_text_hint' },
                            description: { type: 'text', label: 'editor_dictation_description', hint: 'editor_dictation_description_hint' },
                            sample: { type: 'audio', label: 'editor_dictation_sample', hint: 'editor_dictation_sample_hint' },
                            sampleAlternative: { type: 'audio', label: 'editor_dictation_sample_slow', hint: 'editor_dictation_sample_slow_hint' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            ignorePunctuation: { type: 'checkbox', label: 'editor_dictation_ignore_punctuation', default: true, hint: 'editor_dictation_ignore_punctuation_hint' },
                            typoFactor: {
                                type: 'select',
                                label: 'editor_dictation_typo_factor',
                                default: '50',
                                hint: 'editor_dictation_typo_factor_hint',
                                options: [
                                    { value: '100', label: 'editor_dictation_typo_100' },
                                    { value: '50', label: 'editor_dictation_typo_50' },
                                    { value: '0', label: 'editor_dictation_typo_0' }
                                ]
                            },
                            zeroMistakeMode: { type: 'checkbox', label: 'editor_dictation_zero_mistake', default: false, hint: 'editor_dictation_zero_mistake_hint' },
                            customTypoDisplay: { type: 'checkbox', label: 'editor_dictation_show_typos', default: false, hint: 'editor_dictation_show_typos_hint' },
                            tries: { type: 'number', label: 'editor_dictation_tries', hint: 'editor_dictation_tries_hint', min: 1 },
                            triesAlternative: { type: 'number', label: 'editor_dictation_tries_slow', hint: 'editor_dictation_tries_slow_hint', min: 1 },
                            playButtonDelay: { type: 'number', label: 'editor_dictation_play_delay', hint: 'editor_dictation_play_delay_hint', min: 0, max: 3 },
                            disablePause: { type: 'checkbox', label: 'editor_dictation_disable_pause', default: false, hint: 'editor_dictation_disable_pause_hint' },
                            shuffleSentences: {
                                type: 'select',
                                label: 'editor_dictation_shuffle',
                                default: 'never',
                                options: [
                                    { value: 'never', label: 'editor_dictation_shuffle_never' },
                                    { value: 'once', label: 'editor_dictation_shuffle_once' },
                                    { value: 'onRetry', label: 'editor_dictation_shuffle_on_retry' }
                                ]
                            },
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            enableSolutionOnCheck: { type: 'checkbox', label: 'editor_dictation_solution_on_check', default: false, hint: 'editor_dictation_solution_on_check_hint' }
                        }
                    }
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
                            image: {
                                type: 'image',
                                label: 'editor_image',
                                hint: 'editor_image_card_hint',
                                collapsible: true,
                                collapsibleLabel: 'editor_image',
                                altTextField: 'imageAltText'
                            },
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    mode: {
                        type: 'select',
                        label: 'editor_dialog_mode',
                        default: 'normal',
                        hint: 'editor_dialog_mode_hint',
                        options: [
                            { value: 'normal', label: 'editor_dialog_mode_normal' },
                            { value: 'repetition', label: 'editor_dialog_mode_repetition' }
                        ]
                    },
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            randomCards: { type: 'checkbox', label: 'editor_random_cards', default: false, hint: 'editor_random_cards_hint' }
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
                    _timelineMedia: {
                        type: 'fieldGroup', collapsible: true, collapsibleLabel: 'editor_media_optional',
                        fields: {
                            // H5P Timeline n'accepte que des URLs externes (YouTube, Vimeo, Flickr, Wikipedia, etc.)
                            // Pas d'upload de fichier image supporté nativement par la lib H5P.Timeline
                            'timeline.asset.media': { type: 'text', label: 'editor_media_url' },
                            'timeline.asset.caption': { type: 'text', label: 'editor_caption' },
                            'timeline.asset.credit': { type: 'text', label: 'editor_credit' }
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
                            _media: {
                                type: 'fieldGroup', collapsibleLabel: 'editor_media_optional',
                                fields: {
                                    // H5P Timeline n'accepte que des URLs externes (YouTube, Vimeo, Flickr, Wikipedia, etc.)
                                    'asset.media': { type: 'text', label: 'editor_media_url' },
                                    'asset.caption': { type: 'text', label: 'editor_caption' },
                                    'asset.credit': { type: 'text', label: 'editor_credit' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    height: { type: 'number', label: 'editor_timeline_height', default: 600, min: 300, max: 1200, hint: 'editor_timeline_height_hint' }
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
                id: 'background',
                label: 'editor_image_background',
                icon: 'fa-image',
                startCollapsed: true,
                fields: {
                    backgroundImage: { type: 'image', label: 'editor_image_background', hint: 'editor_image_crossword_bg_hint', altTextField: 'backgroundImageAlt' }
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
                            'extraClue.params.text': { type: 'text', label: 'editor_extra_clue', collapsible: true, collapsibleLabel: 'editor_extra_clue_optional' }
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
            },
            {
                id: 'theme',
                label: 'editor_section_theme',
                icon: 'fa-palette',
                startCollapsed: true,
                fields: {
                    'theme._preset': {
                        type: 'select',
                        label: 'editor_crossword_theme_preset',
                        default: 'default',
                        options: [
                            { value: 'default', label: 'editor_crossword_theme_default' },
                            { value: 'elea', label: 'editor_page_theme_elea' },
                            { value: 'dsfr', label: 'editor_page_theme_dsfr' },
                            { value: 'accessible', label: 'editor_page_theme_accessible' },
                            { value: 'dynamique', label: 'editor_page_theme_dynamique' },
                            { value: 'nature', label: 'editor_crossword_theme_nature' }
                        ],
                        presets: {
                            'default': {
                                'theme.backgroundColor': '#173354',
                                'theme.gridColor': '#000000',
                                'theme.cellBackgroundColor': '#ffffff',
                                'theme.cellColor': '#000000',
                                'theme.clueIdColor': '#606060',
                                'theme.cellBackgroundColorHighlight': '#3e8de8',
                                'theme.cellColorHighlight': '#ffffff',
                                'theme.clueIdColorHighlight': '#e0e0e0'
                            },
                            'elea': {
                                'theme.backgroundColor': '#4a148c',
                                'theme.gridColor': '#7b1fa2',
                                'theme.cellBackgroundColor': '#f3e5f5',
                                'theme.cellColor': '#4a148c',
                                'theme.clueIdColor': '#9c27b0',
                                'theme.cellBackgroundColorHighlight': '#ff6f00',
                                'theme.cellColorHighlight': '#ffffff',
                                'theme.clueIdColorHighlight': '#ffe0b2'
                            },
                            'dsfr': {
                                'theme.backgroundColor': '#000091',
                                'theme.gridColor': '#000091',
                                'theme.cellBackgroundColor': '#f5f5fe',
                                'theme.cellColor': '#161616',
                                'theme.clueIdColor': '#666666',
                                'theme.cellBackgroundColorHighlight': '#000091',
                                'theme.cellColorHighlight': '#ffffff',
                                'theme.clueIdColorHighlight': '#cacafb'
                            },
                            'accessible': {
                                'theme.backgroundColor': '#1a1a1a',
                                'theme.gridColor': '#333333',
                                'theme.cellBackgroundColor': '#ffffff',
                                'theme.cellColor': '#1a1a1a',
                                'theme.clueIdColor': '#555555',
                                'theme.cellBackgroundColorHighlight': '#ffd700',
                                'theme.cellColorHighlight': '#1a1a1a',
                                'theme.clueIdColorHighlight': '#1a1a1a'
                            },
                            'dynamique': {
                                'theme.backgroundColor': '#0d47a1',
                                'theme.gridColor': '#1565c0',
                                'theme.cellBackgroundColor': '#e3f2fd',
                                'theme.cellColor': '#0d47a1',
                                'theme.clueIdColor': '#42a5f5',
                                'theme.cellBackgroundColorHighlight': '#00c853',
                                'theme.cellColorHighlight': '#ffffff',
                                'theme.clueIdColorHighlight': '#b9f6ca'
                            },
                            'nature': {
                                'theme.backgroundColor': '#1b5e20',
                                'theme.gridColor': '#2e7d32',
                                'theme.cellBackgroundColor': '#f1f8e9',
                                'theme.cellColor': '#1b5e20',
                                'theme.clueIdColor': '#66bb6a',
                                'theme.cellBackgroundColorHighlight': '#ff8f00',
                                'theme.cellColorHighlight': '#ffffff',
                                'theme.clueIdColorHighlight': '#fff8e1'
                            }
                        }
                    },
                    'theme.backgroundColor': { type: 'color', label: 'editor_crossword_bg_color', default: '#173354' },
                    'theme.gridColor': { type: 'color', label: 'editor_crossword_grid_color', default: '#000000' },
                    'theme.cellBackgroundColor': { type: 'color', label: 'editor_crossword_cell_bg', default: '#ffffff' },
                    'theme.cellColor': { type: 'color', label: 'editor_crossword_cell_color', default: '#000000' },
                    'theme.clueIdColor': { type: 'color', label: 'editor_crossword_clue_id_color', default: '#606060' },
                    'theme.cellBackgroundColorHighlight': { type: 'color', label: 'editor_crossword_highlight_bg', default: '#3e8de8' },
                    'theme.cellColorHighlight': { type: 'color', label: 'editor_crossword_highlight_color', default: '#ffffff' },
                    'theme.clueIdColorHighlight': { type: 'color', label: 'editor_crossword_highlight_clue_color', default: '#e0e0e0' }
                }
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            enableInstantFeedback: { type: 'checkbox', label: 'editor_instant_feedback', default: false, hint: 'editor_instant_feedback_hint' },
                            scoreWords: { type: 'checkbox', label: 'editor_score_words', default: true, hint: 'editor_score_words_hint' },
                            applyPenalties: { type: 'checkbox', label: 'editor_apply_penalties', default: false, hint: 'editor_apply_penalties_hint' },
                            keepCorrectAnswers: { type: 'checkbox', label: 'editor_keep_correct_answers', default: false, hint: 'editor_keep_correct_answers_hint' },
                            poolSize: { type: 'number', label: 'editor_pool_size', min: 0, hint: 'editor_pool_size_hint' }
                        }
                    }
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
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true, large: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
                        nested: true,
                        compact: true,
                        itemLabel: 'editor_keyword',
                        addLabel: 'editor_add_keyword',
                        minItems: 1,
                        itemsExpanded: true,
                        itemSchema: {
                            keyword: { type: 'text', label: 'editor_keyword', required: true, row: 'main' },
                            'options.points': { type: 'number', label: 'editor_weight', row: 'main' },
                            'options.caseSensitive': { type: 'checkbox', label: 'editor_case_sensitive', row: 'main' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            minimumLength: { type: 'number', label: 'editor_minimum_words', default: 10, min: 0, hint: 'editor_minimum_words_hint' },
                            maximumLength: { type: 'number', label: 'editor_maximum_words', default: 10000, min: 0, hint: 'editor_maximum_words_hint' },
                            overrideCaseSensitive: {
                                type: 'select', label: 'editor_case_sensitive_scoring', default: 'off',
                                hint: 'editor_case_sensitive_scoring_hint',
                                options: [
                                    { value: 'off', label: 'editor_false' },
                                    { value: 'on', label: 'editor_true' }
                                ]
                            },
                            overrideForgiveMistakes: {
                                type: 'select', label: 'editor_forgive_mistakes', default: 'on',
                                hint: 'editor_forgive_mistakes_hint',
                                options: [
                                    { value: 'on', label: 'editor_true' },
                                    { value: 'off', label: 'editor_false' }
                                ]
                            }
                        }
                    }
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
                            text: { type: 'text', label: 'editor_chart_label', required: true, row: 'main' },
                            value: { type: 'number', label: 'editor_chart_value', required: true, row: 'main' },
                            color: { type: 'color', label: 'editor_chart_color', row: 'colors' },
                            fontColor: { type: 'color', label: 'editor_chart_font_color', row: 'colors' }
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
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            instantFeedback: { type: 'checkbox', label: 'editor_instant_feedback', default: false, hint: 'editor_instant_feedback_hint' }
                        }
                    }
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
                id: 'background',
                label: 'editor_image_background',
                icon: 'fa-image',
                startCollapsed: true,
                fields: {
                    backgroundImage: { type: 'image', label: 'editor_image_background', hint: 'editor_image_background_hint' }
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
                        // Les étiquettes visent leurs zones par INDICE (`elements[].zoneIndices`, déclaré
                        // `optionsValueType: 'index'`) : supprimer, insérer, dupliquer ou déplacer une zone
                        // renumérote les suivantes, et ces renvois doivent suivre — sinon les étiquettes
                        // changent de zone en silence. Cf. remapIndexReferences() dans json-utils.js.
                        indexReferencedBy: [{ array: 'elements', field: 'zoneIndices' }],
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
                            image: {
                                type: 'image',
                                label: 'editor_image',
                                hint: 'editor_image_element_hint',
                                collapsible: true,
                                collapsibleLabel: 'editor_image',
                                altTextField: 'imageAltText'
                            },
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            applyPenalties: { type: 'checkbox', label: 'editor_apply_penalties', default: true, hint: 'editor_apply_penalties_hint' },
                            showScorePoints: { type: 'checkbox', label: 'editor_show_score_points', default: true }
                        }
                    }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    hTag: {
                        type: 'select',
                        label: 'editor_glossary_htag',
                        default: 'h2',
                        options: [
                            { value: 'h2', label: 'editor_glossary_htag_h2' },
                            { value: 'h3', label: 'editor_glossary_htag_h3' },
                            { value: 'h4', label: 'editor_glossary_htag_h4' }
                        ]
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
                    progressType: {
                        type: 'select', label: 'editor_progress_type', default: 'dots',
                        hint: 'editor_progress_type_hint',
                        options: [
                            { value: 'dots', label: 'editor_progress_type_dots' },
                            { value: 'textual', label: 'editor_progress_type_textual' }
                        ]
                    },
                    passPercentage: { type: 'number', label: 'editor_pass_percentage', default: 50, min: 0, max: 100, hint: 'editor_pass_percentage_hint' },
                    randomQuestions: { type: 'checkbox', label: 'editor_randomize_questions', default: false, hint: 'editor_randomize_questions_hint' }
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
                        // `metadata.title` est l'intitulé H5P de la sous-question (étiquette de
                        // navigation), distinct de `params.question` qui porte l'énoncé vu par
                        // l'élève : titre générique à la création. cf. addItem() / createEmptyArrayItem().
                        autoTitleField: 'metadata.title',
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
                                    { value: 'H5P.DragQuestion 1.15', label: 'h5p_drag_and_drop_name' }
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
                                            itemsExpanded: true,
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
                                            itemsExpanded: true,
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
                                            itemsExpanded: true,
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
                                    'H5P.DragQuestion 1.15': {
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
                                            // Les étiquettes visent leurs zones par INDICE (`elements[].zoneIndices`, déclaré
                                            // `optionsValueType: 'index'`) : supprimer, insérer, dupliquer ou déplacer une zone
                                            // renumérote les suivantes, et ces renvois doivent suivre — sinon les étiquettes
                                            // changent de zone en silence. Cf. remapIndexReferences() dans json-utils.js.
                                            indexReferencedBy: [{ array: 'elements', field: 'zoneIndices' }],
                                            itemLabel: 'editor_zone',
                                            addLabel: 'editor_add_zone',
                                            minItems: 2,
                                            maxItems: 10,
                                            itemsExpanded: true,
                                            itemSchema: {
                                                label: { type: 'text', label: 'editor_zone_label', required: true }
                                            }
                                        },
                                        elements: {
                                            type: 'array',
                                            itemLabel: 'editor_element',
                                            addLabel: 'editor_add_element',
                                            minItems: 2,
                                            itemsExpanded: true,
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
                    taskDescription: { type: 'textarea', label: 'editor_task_description', required: true },
                    mediaImage: { type: 'image', label: 'editor_image_context', hint: 'editor_image_context_hint', collapsible: true, collapsibleLabel: 'editor_image_context', altTextField: 'mediaImageAlt' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            autoCheck: { type: 'checkbox', label: 'editor_auto_check', default: false, hint: 'editor_auto_check_hint' },
                            showScorePoints: { type: 'checkbox', label: 'editor_show_score_points', default: true },
                            confirmCheckDialog: { type: 'checkbox', label: 'editor_confirm_check_dialog', default: false, hint: 'editor_confirm_check_dialog_hint' },
                            confirmRetryDialog: { type: 'checkbox', label: 'editor_confirm_retry_dialog', default: false, hint: 'editor_confirm_retry_dialog_hint' }
                        }
                    }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            scoringMode: {
                                type: 'select', label: 'editor_scoring_mode', default: 'transitions',
                                hint: 'editor_scoring_mode_hint',
                                options: [
                                    { value: 'transitions', label: 'editor_scoring_mode_transitions' },
                                    { value: 'positions', label: 'editor_scoring_mode_positions' }
                                ]
                            },
                            applyPenalties: { type: 'checkbox', label: 'editor_apply_penalties', default: true, hint: 'editor_apply_penalties_hint' }
                        }
                    }
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
                    wordList: { type: 'tagList', label: 'editor_word_list', required: true, hint: 'editor_word_list_hint' }
                }
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableShowSolution: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            showVocabulary: { type: 'checkbox', label: 'editor_show_vocabulary', default: true, hint: 'editor_show_vocabulary_hint' },
                            orientations: {
                                type: 'object',
                                label: 'editor_section_orientations',
                                collapsible: true,
                                schema: {
                                    horizontal: { type: 'checkbox', label: 'editor_orientation_horizontal', default: true },
                                    horizontalBack: { type: 'checkbox', label: 'editor_orientation_horizontal_back', default: true },
                                    vertical: { type: 'checkbox', label: 'editor_orientation_vertical', default: true },
                                    verticalUp: { type: 'checkbox', label: 'editor_orientation_vertical_up', default: true },
                                    diagonal: { type: 'checkbox', label: 'editor_orientation_diagonal', default: true },
                                    diagonalBack: { type: 'checkbox', label: 'editor_orientation_diagonal_back', default: true },
                                    diagonalUp: { type: 'checkbox', label: 'editor_orientation_diagonal_up', default: true },
                                    diagonalUpBack: { type: 'checkbox', label: 'editor_orientation_diagonal_up_back', default: true }
                                }
                            }
                        }
                    }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            passPercentage: { type: 'number', label: 'editor_pass_percentage', default: 50, min: 0, max: 100, hint: 'editor_pass_percentage_hint' }
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
            },
            {
                id: 'settings',
                label: 'editor_section_settings',
                icon: 'fa-cog',
                startCollapsed: true,
                fields: {
                    behaviour: {
                        type: 'object',
                        schema: {
                            enableRetry: { type: 'checkbox', label: 'editor_enable_retry', default: true },
                            enableSolutionsButton: { type: 'checkbox', label: 'editor_enable_solutions', default: true },
                            soundEffectsEnabled: { type: 'checkbox', label: 'editor_sound_effects', default: true, hint: 'editor_sound_effects_hint' },
                            autoContinue: { type: 'checkbox', label: 'editor_auto_continue', default: true, hint: 'editor_auto_continue_hint' },
                            passPercentage: { type: 'number', label: 'editor_pass_percentage', default: 100, min: 0, max: 100, hint: 'editor_pass_percentage_hint' }
                        }
                    }
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
                    bank_description: { type: 'textarea', label: 'editor_bank_description' },
                    options: {
                        type: 'object', collapsible: true, collapsibleLabel: 'editor_test_options',
                        schema: {
                            answernumbering: {
                                type: 'select', label: 'editor_test_answernumbering',
                                default: 'none',
                                options: [
                                    { value: 'none', label: 'editor_test_numbering_none' },
                                    { value: 'abc', label: 'editor_test_numbering_abc' },
                                    { value: '123', label: 'editor_test_numbering_123' },
                                    { value: 'ABCD', label: 'editor_test_numbering_ABCD' },
                                    { value: 'iii', label: 'editor_test_numbering_iii' }
                                ]
                            },
                            showstandardinstruction: {
                                type: 'checkbox', label: 'editor_test_showstandardinstruction',
                                default: true, valueType: 'number'
                            }
                        }
                    }
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
                        dynamicTitleField: 'type',
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
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        single: {
                                            type: 'select', label: 'editor_test_selection_mode',
                                            options: [
                                                { value: 'true', label: 'editor_test_single_answer' },
                                                { value: 'false', label: 'editor_test_multiple_answers' }
                                            ]
                                        },
                                        answers: {
                                            type: 'array', itemLabel: 'editor_answer', addLabel: 'editor_add_answer', nested: true, compact: true, itemsExpanded: true,
                                            hint: 'editor_moodle_fraction_hint',
                                            validateSum: { field: 'fraction', target: 100, label: 'editor_fraction_sum_error' },
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_answer_text', required: true, row: 'main' },
                                                fraction: { row: 'main',
                                                    type: 'select', label: 'editor_answer_fraction',
                                                    options: [
                                                        { value: 0, label: '0%' },
                                                        { value: 5, label: '5%' },
                                                        { value: 10, label: '10%' },
                                                        { value: 11.11111, label: '11.11%' },
                                                        { value: 12.5, label: '12.5%' },
                                                        { value: 14.28571, label: '14.29%' },
                                                        { value: 16.66667, label: '16.67%' },
                                                        { value: 20, label: '20%' },
                                                        { value: 25, label: '25%' },
                                                        { value: 33.33333, label: '33.33%' },
                                                        { value: 50, label: '50%' },
                                                        { value: 60, label: '60%' },
                                                        { value: 66.66667, label: '66.67%' },
                                                        { value: 75, label: '75%' },
                                                        { value: 80, label: '80%' },
                                                        { value: 83.33333, label: '83.33%' },
                                                        { value: 90, label: '90%' },
                                                        { value: 100, label: '100%' }
                                                    ]
                                                },
                                                feedback: { type: 'textarea', label: 'editor_feedback_if_chosen', collapsible: true, collapsibleLabel: 'editor_feedback' }
                                            }
                                        },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        correctfeedback: { type: 'textarea', label: 'editor_test_correctfeedback', collapsible: true, collapsibleLabel: 'editor_test_correctfeedback' },
                                        partiallycorrectfeedback: { type: 'textarea', label: 'editor_test_partiallycorrectfeedback', collapsible: true, collapsibleLabel: 'editor_test_partiallycorrectfeedback' },
                                        incorrectfeedback: { type: 'textarea', label: 'editor_test_incorrectfeedback', collapsible: true, collapsibleLabel: 'editor_test_incorrectfeedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
                                        }
                                    },
                                    matching: {
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        subquestions: {
                                            type: 'array', itemLabel: 'editor_pair', addLabel: 'editor_add_pair', nested: true, compact: true, itemsExpanded: true,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_left_element', required: true, row: 'main' },
                                                answer: { type: 'text', label: 'editor_right_element', required: true, row: 'main' }
                                            }
                                        },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        correctfeedback: { type: 'textarea', label: 'editor_test_correctfeedback', collapsible: true, collapsibleLabel: 'editor_test_correctfeedback' },
                                        partiallycorrectfeedback: { type: 'textarea', label: 'editor_test_partiallycorrectfeedback', collapsible: true, collapsibleLabel: 'editor_test_partiallycorrectfeedback' },
                                        incorrectfeedback: { type: 'textarea', label: 'editor_test_incorrectfeedback', collapsible: true, collapsibleLabel: 'editor_test_incorrectfeedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
                                        }
                                    },
                                    truefalse: {
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        answer: {
                                            type: 'object', noHeader: true,
                                            schema: {
                                                value: {
                                                    type: 'select', label: 'editor_correct_answer_select',
                                                    valueType: 'boolean', default: true,
                                                    options: [{ value: true, label: 'editor_true' }, { value: false, label: 'editor_false' }]
                                                },
                                                feedback_true: { type: 'textarea', label: 'editor_feedback_if_true', collapsible: true, collapsibleLabel: 'editor_feedback_if_true' },
                                                feedback_false: { type: 'textarea', label: 'editor_feedback_if_false', collapsible: true, collapsibleLabel: 'editor_feedback_if_false' }
                                            }
                                        },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
                                        }
                                    },
                                    numerical: {
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        answer: {
                                            type: 'object', collapsible: false, noHeader: true,
                                            schema: {
                                                number: { type: 'number', label: 'editor_numerical_value', required: true, row: 'answer' },
                                                tolerance: { type: 'number', label: 'editor_numerical_tolerance', row: 'answer' },
                                                feedback: { type: 'textarea', label: 'editor_feedback' }
                                            }
                                        },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
                                        }
                                    },
                                    shortanswer: {
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'textarea', label: 'editor_question_text', required: true, large: true },
                                        answers: {
                                            type: 'array', itemLabel: 'editor_test_accepted_answer', addLabel: 'editor_add_answer', nested: true, compact: true, itemsExpanded: true,
                                            itemSchema: {
                                                text: { type: 'text', label: 'editor_correct_answer', required: true, row: 'main' },
                                                fraction: { type: 'number', label: 'editor_answer_fraction', hint: 'editor_score_hint_100', row: 'main' },
                                                feedback: { type: 'textarea', label: 'editor_feedback', collapsible: true, collapsibleLabel: 'editor_feedback' }
                                            }
                                        },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
                                        }
                                    },
                                    cloze: {
                                        name: { type: 'text', label: 'editor_question_name', collapsible: true, collapsibleLabel: 'editor_question_name' },
                                        questiontext: { type: 'cloze', label: 'editor_test_type_cloze', required: true, hint: 'editor_cloze_format_hint' },
                                        feedback: { type: 'textarea', label: 'editor_question_feedback', collapsible: true, collapsibleLabel: 'editor_question_feedback' },
                                        hints: {
                                            type: 'array', itemLabel: 'editor_test_hint', addLabel: 'editor_test_add_hint', nested: true, itemsExpanded: false, maxItems: 3,
                                            itemSchema: { _value: { type: 'textarea', label: 'editor_test_hint_text', isArrayValue: true } }
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

    // === MOODLE LIVRE (Activité Page multi-chapitres - module book) ===
    // Réutilise les 18 blocs Page via le pageBlockData field type.
    // Structure imbriquée : chapters[].blocks[].data
    'elea_livre': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    intro: {
                        type: 'textarea',
                        label: 'editor_livre_intro',
                        hint: 'editor_livre_intro_hint'
                    },
                    theme: {
                        type: 'select',
                        label: 'editor_page_theme',
                        options: [
                            { value: 'elea', labelKey: 'editor_page_theme_elea' },
                            { value: 'dsfr', labelKey: 'editor_page_theme_dsfr' },
                            { value: 'accessible', labelKey: 'editor_page_theme_accessible' },
                            { value: 'dynamique', labelKey: 'editor_page_theme_dynamique' }
                        ]
                    },
                    numbering: {
                        type: 'select',
                        label: 'editor_livre_numbering',
                        hint: 'editor_livre_numbering_hint',
                        options: [
                            { value: 0, labelKey: 'editor_livre_numbering_none' },
                            { value: 1, labelKey: 'editor_livre_numbering_decimal' },
                            { value: 2, labelKey: 'editor_livre_numbering_bullets' },
                            { value: 3, labelKey: 'editor_livre_numbering_dashes' }
                        ]
                    }
                }
            },
            {
                id: 'chapters',
                label: 'editor_livre_chapters',
                icon: 'fa-book-open',
                countField: 'chapters',
                fields: {
                    chapters: {
                        type: 'array',
                        itemLabel: 'editor_livre_chapter',
                        addLabel: 'editor_livre_add_chapter',
                        dynamicTitleField: 'title',
                        // Titre générique à la création (« Chapitre 5 ») : cf. addItem() dans array-manager.js
                        autoTitleField: 'title',
                        minItems: 1,
                        itemSchema: {
                            title: {
                                type: 'text',
                                label: 'editor_livre_chapter_title',
                                required: true
                            },
                            subchapter: {
                                type: 'checkbox',
                                label: 'editor_livre_subchapter',
                                hint: 'editor_livre_subchapter_hint'
                            },
                            blocks: {
                                type: 'array',
                                itemLabel: 'editor_block',
                                addLabel: 'editor_add_block',
                                dynamicTitleField: 'type',
                                minItems: 0,
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
    },

    // ===================================================================
    // COURSE PRESENTATION — schema plat avec showWhen conditionnel
    // Pas de dynamicObject imbrique : exercise utilise _exerciseLibrary
    // comme selecteur frere (extrait par normalizeDataForEditor)
    // ===================================================================
    'CoursePresentation': {
        sections: [
            // --- Diapositives (en premier, c'est le contenu principal) ---
            {
                id: 'slides',
                label: 'editor_cp_section_slides',
                icon: 'fa-layer-group',
                countField: 'slides',
                fields: {
                    slides: {
                        type: 'array',
                        itemLabel: 'editor_cp_slide',
                        addLabel: 'editor_cp_add_slide',
                        dynamicTitleField: 'type',
                        // Titre générique à la création (« Diapositive 6 ») : cf. addItem() dans array-manager.js
                        autoTitleField: 'title',
                        minItems: 2,
                        itemSchema: {
                            // === Champs communs ===
                            type: {
                                type: 'select',
                                label: 'editor_cp_slide_type',
                                required: true,
                                options: [
                                    { value: 'title', label: 'editor_cp_type_title' },
                                    { value: 'content', label: 'editor_cp_type_content' },
                                    { value: 'content-with-table', label: 'editor_cp_type_content_table' },
                                    { value: 'quiz', label: 'editor_cp_type_quiz' },
                                    { value: 'content-quiz', label: 'editor_cp_type_content_quiz' },
                                    { value: 'summary', label: 'editor_cp_type_summary' }
                                ]
                            },
                            // === Disposition (visible uniquement pour les types à 2 zones) ===
                            layout: {
                                type: 'select',
                                label: 'editor_cp_layout',
                                showWhen: { field: 'type', values: ['content-with-table', 'content-quiz'] },
                                options: [
                                    { value: 'vertical', label: 'editor_cp_layout_vertical' },
                                    { value: 'horizontal', label: 'editor_cp_layout_horizontal' }
                                ],
                                default: 'vertical'
                            },

                            title: { type: 'text', label: 'editor_title', required: true },

                            // === Champ titre uniquement ===
                            subtitle: {
                                type: 'text', label: 'editor_cp_subtitle',
                                showWhen: { field: 'type', value: 'title' }
                            },

                            // === Champ texte (content, content-with-table, content-quiz) ===
                            text: {
                                type: 'textarea', label: 'editor_cp_content', large: true,
                                showWhen: { field: 'type', values: ['content', 'content-with-table', 'content-quiz'] }
                            },

                            // === Tableau (content-with-table uniquement) ===
                            tableStyle: {
                                type: 'select', label: 'editor_cp_table_style',
                                showWhen: { field: 'type', value: 'content-with-table' },
                                options: [
                                    { value: 'default', label: 'editor_cp_table_default' },
                                    { value: 'striped', label: 'editor_cp_table_striped' },
                                    { value: 'bordered', label: 'editor_cp_table_bordered' },
                                    { value: 'dark-header', label: 'editor_cp_table_dark_header' },
                                    { value: 'minimal', label: 'editor_cp_table_minimal' },
                                    { value: 'dsfr', label: 'editor_cp_table_dsfr' }
                                ]
                            },
                            table: {
                                type: 'object', label: 'editor_cp_table', noHeader: true,
                                showWhen: { field: 'type', value: 'content-with-table' },
                                schema: {
                                    headers: {
                                        type: 'array', itemLabel: 'editor_cp_table_header', addLabel: 'editor_cp_add_header',
                                        minItems: 1, itemsExpanded: false,
                                        itemSchema: { _value: { type: 'text', label: 'editor_cp_table_header', required: true, isArrayValue: true } }
                                    },
                                    rows: {
                                        type: 'array', itemLabel: 'editor_cp_table_row', addLabel: 'editor_cp_add_row',
                                        minItems: 1, itemsExpanded: false,
                                        itemSchema: { _value: { type: 'stringArray', label: 'editor_cp_table_cells', isArrayValue: true } }
                                    }
                                }
                            },

                            // === Exercice (quiz, content-quiz, summary) ===
                            _exerciseLibrary: {
                                type: 'select', label: 'editor_cp_exercise_type',
                                showWhen: { field: 'type', values: ['quiz', 'content-quiz', 'summary'] },
                                options: [
                                    { value: 'H5P.MultiChoice 1.16', label: 'editor_cp_ex_multichoice' },
                                    { value: 'H5P.TrueFalse 1.8', label: 'editor_cp_ex_truefalse' },
                                    { value: 'H5P.Blanks 1.14', label: 'editor_cp_ex_blanks' },
                                    { value: 'H5P.DragText 1.10', label: 'editor_cp_ex_dragtext' },
                                    { value: 'H5P.MarkTheWords 1.11', label: 'editor_cp_ex_markwords' },
                                    { value: 'H5P.SingleChoiceSet 1.11', label: 'editor_cp_ex_singlechoice' },
                                    { value: 'H5P.Summary 1.10', label: 'editor_cp_ex_summary' },
                                    { value: 'H5P.DragQuestion 1.15', label: 'editor_cp_ex_dragquestion' },
                                    { value: 'H5P.Dialogcards 1.9', label: 'editor_cp_ex_dialogcards' }
                                ]
                            },
                            exercise: {
                                type: 'dynamicObject', label: 'editor_cp_exercise',
                                showWhen: { field: 'type', values: ['quiz', 'content-quiz', 'summary'] },
                                selector: '_exerciseLibrary',
                                schemas: CP_EXERCISE_SCHEMAS
                            },

                            // === Couleur de fond ===
                            backgroundColor: { type: 'color', label: 'editor_cp_slide_color' },

                            // === Image du slide (collapsible : image + position + alt) ===
                            slideImage: {
                                type: 'image',
                                label: 'editor_image_slide',
                                hint: 'editor_image_slide_hint',
                                collapsible: true,
                                collapsibleLabel: 'editor_image_slide',
                                altTextField: 'slideImageAlt',
                                selectField: {
                                    name: 'slideImagePosition',
                                    label: 'editor_image_position',
                                    default: 'left',
                                    options: [
                                        { value: 'left', label: 'editor_image_position_left' },
                                        { value: 'right', label: 'editor_image_position_right' },
                                        { value: 'top', label: 'editor_image_position_top' },
                                        { value: 'bottom', label: 'editor_image_position_bottom' }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            // --- Options globales (en bas, paramètres avancés) ---
            {
                id: 'options',
                label: 'editor_cp_options',
                icon: 'fa-cog',
                startCollapsed: true,
                compact: true,
                fields: {
                    globalBackgroundColor: { type: 'color', label: 'editor_cp_global_bg' },
                    keywordListEnabled: { type: 'checkbox', label: 'editor_cp_keywords', default: true, inline: true },
                    hideSummarySlide: { type: 'checkbox', label: 'editor_cp_hide_summary', inline: true },
                    enablePrintButton: { type: 'checkbox', label: 'editor_cp_print', inline: true },
                    enableRetry: { type: 'checkbox', label: 'editor_cp_retry', default: true, inline: true },
                    enableSolutionsButton: { type: 'checkbox', label: 'editor_cp_solutions', default: true, inline: true }
                }
            }
        ]
    },

    // ===================================================================
    // INTERACTIVE BOOK — chapitres riches : 2 niveaux d'array imbriques
    // chapters[] → content[] (blocs polymorphes via _blockType + showWhen).
    // Le bloc exercice reutilise CP_EXERCISE_SCHEMAS avec _exerciseLibrary
    // comme selecteur frere (extrait par normalizeDataForEditor).
    // ===================================================================
    'InteractiveBook': {
        sections: [
            // --- General : titre + couverture ---
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title', required: true },
                    cover: {
                        type: 'object', label: 'editor_ib_cover',
                        collapsible: true, collapsibleLabel: 'editor_ib_cover',
                        schema: {
                            description: { type: 'textarea', label: 'editor_ib_cover_desc', hint: 'editor_ib_cover_hint' }
                        }
                    }
                }
            },
            // --- Chapitres (contenu principal) ---
            {
                id: 'chapters',
                label: 'editor_ib_section_chapters',
                icon: 'fa-book-open',
                countField: 'chapters',
                fields: {
                    chapters: {
                        type: 'array',
                        itemLabel: 'editor_ib_chapter',
                        addLabel: 'editor_ib_add_chapter',
                        dynamicTitleField: 'title',
                        // Titre générique à la création. `healInteractiveBook` posait déjà un repli
                        // « Chapitre N » — mais en français figé, et seulement à l'enregistrement :
                        // le sommaire de l'éditeur restait sans intitulé. cf. addItem().
                        autoTitleField: 'title',
                        minItems: 2,
                        itemSchema: {
                            title: { type: 'text', label: 'editor_ib_chapter_title', required: true, hint: 'editor_ib_chapter_title_hint' },
                            content: {
                                type: 'array', nested: true,
                                label: 'editor_ib_blocks',
                                itemLabel: 'editor_ib_block',
                                addLabel: 'editor_ib_add_block',
                                dynamicTitleField: '_blockType',
                                minItems: 1,
                                itemSchema: {
                                    // === Type de bloc (pilote l'affichage conditionnel) ===
                                    _blockType: {
                                        type: 'select', label: 'editor_ib_block_type', required: true,
                                        options: [
                                            { value: 'text', label: 'editor_ib_block_text' },
                                            { value: 'table', label: 'editor_ib_block_table' },
                                            { value: 'image', label: 'editor_ib_block_image' },
                                            { value: 'exercise', label: 'editor_ib_block_exercise' }
                                        ]
                                    },

                                    // === Bloc texte ===
                                    text: {
                                        type: 'textarea', label: 'editor_ib_text', large: true,
                                        showWhen: { field: '_blockType', value: 'text' }
                                    },

                                    // === Bloc tableau (mêmes 6 styles que CoursePresentation) ===
                                    tableStyle: {
                                        type: 'select', label: 'editor_cp_table_style',
                                        showWhen: { field: '_blockType', value: 'table' },
                                        options: [
                                            { value: 'default', label: 'editor_cp_table_default' },
                                            { value: 'striped', label: 'editor_cp_table_striped' },
                                            { value: 'bordered', label: 'editor_cp_table_bordered' },
                                            { value: 'dark-header', label: 'editor_cp_table_dark_header' },
                                            { value: 'minimal', label: 'editor_cp_table_minimal' },
                                            { value: 'dsfr', label: 'editor_cp_table_dsfr' }
                                        ]
                                    },
                                    table: {
                                        type: 'object', label: 'editor_cp_table', noHeader: true,
                                        showWhen: { field: '_blockType', value: 'table' },
                                        schema: {
                                            headers: {
                                                type: 'array', itemLabel: 'editor_cp_table_header', addLabel: 'editor_cp_add_header',
                                                minItems: 1, itemsExpanded: false,
                                                itemSchema: { _value: { type: 'text', label: 'editor_cp_table_header', required: true, isArrayValue: true } }
                                            },
                                            rows: {
                                                type: 'array', itemLabel: 'editor_cp_table_row', addLabel: 'editor_cp_add_row',
                                                minItems: 1, itemsExpanded: false,
                                                itemSchema: { _value: { type: 'stringArray', label: 'editor_cp_table_cells', isArrayValue: true } }
                                            }
                                        }
                                    },

                                    // === Bloc image ===
                                    image: {
                                        type: 'image', label: 'editor_image',
                                        altTextField: 'alt',
                                        showWhen: { field: '_blockType', value: 'image' }
                                    },

                                    // === Bloc exercice (9 types, schemas partages avec CP) ===
                                    _exerciseLibrary: {
                                        type: 'select', label: 'editor_cp_exercise_type',
                                        showWhen: { field: '_blockType', value: 'exercise' },
                                        options: [
                                            { value: 'H5P.MultiChoice 1.16', label: 'editor_cp_ex_multichoice' },
                                            { value: 'H5P.TrueFalse 1.8', label: 'editor_cp_ex_truefalse' },
                                            { value: 'H5P.Blanks 1.14', label: 'editor_cp_ex_blanks' },
                                            { value: 'H5P.DragText 1.10', label: 'editor_cp_ex_dragtext' },
                                            { value: 'H5P.MarkTheWords 1.11', label: 'editor_cp_ex_markwords' },
                                            { value: 'H5P.SingleChoiceSet 1.11', label: 'editor_cp_ex_singlechoice' },
                                            { value: 'H5P.Summary 1.10', label: 'editor_cp_ex_summary' },
                                            { value: 'H5P.DragQuestion 1.15', label: 'editor_cp_ex_dragquestion' },
                                            { value: 'H5P.Dialogcards 1.9', label: 'editor_cp_ex_dialogcards' }
                                        ]
                                    },
                                    exercise: {
                                        type: 'dynamicObject', label: 'editor_cp_exercise',
                                        showWhen: { field: '_blockType', value: 'exercise' },
                                        selector: '_exerciseLibrary',
                                        schemas: CP_EXERCISE_SCHEMAS
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // --- Options globales du livre ---
            {
                id: 'options',
                label: 'editor_ib_section_options',
                icon: 'fa-cog',
                startCollapsed: true,
                compact: true,
                fields: {
                    baseColor: { type: 'color', label: 'editor_ib_base_color' },
                    showTableOfContents: { type: 'checkbox', label: 'editor_ib_toc', default: true, inline: true },
                    displaySummary: { type: 'checkbox', label: 'editor_ib_summary', default: true, inline: true }
                }
            }
        ]
    },

    // ===================================================================
    // INTERACTIVE VIDEO — vidéo + interactions horodatées (timeline) + résumé
    // Format intermédiaire « plat » (cf. processors/InteractiveVideo.js). Le panneau
    // à player intégré (js/editor/interactive-video-panel.js) s'ajoute par-dessus.
    // ===================================================================
    'InteractiveVideo': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    title: { type: 'text', label: 'editor_title' },
                    // Réglage GLOBAL du mode d'affichage des questions (2026-08, demande auteur).
                    // « Personnalisé » (défaut) = chaque question décide, via son propre menu ; les
                    // deux autres modes s'imposent à toutes les questions et masquent ce menu
                    // (cf. `display` plus bas, showWhen à portée racine). Le défaut est
                    // « personnalisé » et NON « direct » pour rester sans perte : un contenu
                    // importé où l'enseignant a réglé ses questions une à une garde ses choix.
                    // Une question qui ne dit rien s'affiche de toute façon directement.
                    displayMode: {
                        type: 'select', label: 'editor_iv_display_mode', hint: 'editor_iv_display_mode_hint',
                        default: 'custom',
                        options: [
                            { value: 'custom', label: 'editor_iv_display_mode_custom' },
                            { value: 'poster', label: 'editor_iv_display_mode_poster' },
                            { value: 'button', label: 'editor_iv_display_mode_button' }
                        ]
                    },
                    videoSource: {
                        type: 'object', label: 'editor_iv_video', collapsible: true, collapsibleLabel: 'editor_iv_video',
                        schema: {
                            url: { type: 'text', label: 'editor_iv_video_url' },
                            mime: { type: 'text', label: 'editor_iv_video_mime', default: 'video/mp4' },
                            // Décoché par défaut : pas de piste de sous-titres (transcription) dans le
                            // .h5p → pas d'affichage automatique au démarrage (choix pédagogique / RGAA).
                            // Cocher pour intégrer la transcription et l'afficher.
                            showCaptions: { type: 'checkbox', label: 'video_include_subtitles', default: false, inline: true }
                        }
                    }
                }
            },
            {
                id: 'interactions',
                label: 'editor_iv_section_interactions',
                icon: 'fa-circle-question',
                countField: 'interactions',
                fields: {
                    interactions: {
                        type: 'array',
                        itemLabel: 'editor_iv_interaction',
                        addLabel: 'editor_iv_add_interaction',
                        dynamicTitleField: 'question',
                        minItems: 0,
                        itemSchema: {
                            timestamp: { type: 'timestamp', label: 'editor_iv_timestamp', required: true },
                            type: {
                                type: 'select', label: 'editor_iv_type', required: true,
                                options: [
                                    { value: 'multichoice', label: 'editor_iv_type_multichoice' },
                                    { value: 'truefalse', label: 'editor_iv_type_truefalse' },
                                    { value: 'blanks', label: 'editor_iv_type_blanks' }
                                ]
                            },
                            pause: { type: 'checkbox', label: 'editor_iv_pause', default: true, inline: true },
                            question: {
                                type: 'textarea', label: 'editor_iv_question',
                                showWhen: { field: 'type', values: ['multichoice', 'truefalse'] }
                            },
                            answers: {
                                type: 'array', label: 'editor_iv_answers', itemLabel: 'editor_iv_answer', addLabel: 'editor_iv_add_answer',
                                showWhen: { field: 'type', value: 'multichoice' }, minItems: 2,
                                itemSchema: {
                                    text: { type: 'textarea', label: 'editor_iv_answer_text' },
                                    correct: { type: 'checkbox', label: 'editor_iv_answer_correct', inline: true },
                                    feedback: { type: 'text', label: 'editor_iv_answer_feedback' }
                                }
                            },
                            correct: {
                                // valueType:'boolean' → la collecte stocke un vrai booléen (un <select>
                                // renvoie sinon la chaîne "false", piège *truthy* côté processeur).
                                type: 'select', label: 'editor_iv_truefalse_correct', valueType: 'boolean', default: false,
                                showWhen: { field: 'type', value: 'truefalse' },
                                options: [
                                    { value: true, label: 'editor_iv_true' },
                                    { value: false, label: 'editor_iv_false' }
                                ]
                            },
                            feedbackOnCorrect: { type: 'text', label: 'editor_iv_feedback_correct', showWhen: { field: 'type', value: 'truefalse' } },
                            feedbackOnWrong: { type: 'text', label: 'editor_iv_feedback_wrong', showWhen: { field: 'type', value: 'truefalse' } },
                            text: {
                                type: 'textarea', label: 'editor_iv_blanks_text', hint: 'editor_iv_blanks_hint',
                                showWhen: { field: 'type', value: 'blanks' }
                            },
                            // Apparence & placement de l'interaction sur la vidéo. Défauts sains
                            // appliqués si non touché ; presets ou mode coordonnées au choix.
                            // Les champs vivent à plat sur l'interaction (cf. processors/InteractiveVideo.js).
                            appearance: {
                                type: 'fieldGroup', label: 'editor_iv_group_appearance', collapsible: true,
                                fields: {
                                    // Défaut `poster` depuis 2026-08 (demande auteur) : la question
                                    // s'affiche d'elle-même sur la vidéo. L'option bouton reste
                                    // offerte question par question — d'où l'ordre, défaut en tête.
                                    // Visible UNIQUEMENT en mode global « personnalisé » : dans les
                                    // deux autres modes le réglage global tranche pour toutes les
                                    // questions, ce menu n'aurait aucun effet.
                                    display: {
                                        type: 'select', label: 'editor_iv_display', default: 'poster',
                                        showWhen: { rootField: 'displayMode', value: 'custom', defaultValue: 'custom' },
                                        options: [
                                            { value: 'poster', label: 'editor_iv_display_poster' },
                                            { value: 'button', label: 'editor_iv_display_button' }
                                        ]
                                    },
                                    // Masqué en mode poster : le lecteur affiche TOUJOURS un poster
                                    // en plein cadre, quelles que soient les coordonnées stockées
                                    // (mesuré sur H5P.InteractiveVideo 1.27, cf. le processeur).
                                    // Offrir le réglage y ferait croire à un pouvoir qu'il n'a pas.
                                    placement: {
                                        type: 'select', label: 'editor_iv_placement', default: 'center',
                                        showWhen: { field: 'display', value: 'button' },
                                        options: [
                                            { value: 'center', label: 'editor_iv_placement_center' },
                                            { value: 'top-left', label: 'editor_iv_placement_top_left' },
                                            { value: 'top-right', label: 'editor_iv_placement_top_right' },
                                            { value: 'bottom-left', label: 'editor_iv_placement_bottom_left' },
                                            { value: 'bottom-right', label: 'editor_iv_placement_bottom_right' },
                                            { value: 'bottom', label: 'editor_iv_placement_bottom' },
                                            { value: 'full', label: 'editor_iv_placement_full' },
                                            { value: 'custom', label: 'editor_iv_placement_custom' }
                                        ]
                                    },
                                    x: { type: 'number', label: 'editor_iv_x', min: 0, max: 100, step: 1, inline: true, showWhen: { field: 'placement', value: 'custom' } },
                                    y: { type: 'number', label: 'editor_iv_y', min: 0, max: 100, step: 1, inline: true, showWhen: { field: 'placement', value: 'custom' } },
                                    width: { type: 'number', label: 'editor_iv_width', min: 0, max: 100, step: 1, inline: true, showWhen: { field: 'placement', value: 'custom' } },
                                    height: { type: 'number', label: 'editor_iv_height', min: 0, max: 100, step: 1, inline: true, showWhen: { field: 'placement', value: 'custom' } },
                                    label: { type: 'text', label: 'editor_iv_label', showWhen: { field: 'display', value: 'button' } },
                                    visibleDuration: { type: 'number', label: 'editor_iv_visible_duration', min: 1, step: 1, default: 2, showWhen: { field: 'display', value: 'button' } },
                                    buttonOnMobile: { type: 'checkbox', label: 'editor_iv_button_on_mobile', inline: true, showWhen: { field: 'display', value: 'button' } }
                                }
                            },
                            // Adaptativité : réponse obligatoire + sauts vidéo conditionnels selon
                            // bonne/mauvaise réponse (mappés vers adaptivity.{correct,wrong} par le processeur).
                            adaptivity: {
                                type: 'fieldGroup', label: 'editor_iv_group_adaptivity', collapsible: true,
                                fields: {
                                    requireCompletion: { type: 'checkbox', label: 'editor_iv_require_completion', inline: true },
                                    correctMessage: { type: 'text', label: 'editor_iv_adapt_correct_message' },
                                    correctSeekTo: { type: 'timestamp', label: 'editor_iv_adapt_correct_seek' },
                                    correctAllowOptOut: { type: 'checkbox', label: 'editor_iv_adapt_correct_optout', inline: true },
                                    wrongMessage: { type: 'text', label: 'editor_iv_adapt_wrong_message' },
                                    wrongSeekTo: { type: 'timestamp', label: 'editor_iv_adapt_wrong_seek' },
                                    wrongAllowOptOut: { type: 'checkbox', label: 'editor_iv_adapt_wrong_optout', inline: true }
                                }
                            }
                        }
                    }
                }
            },
            {
                id: 'summary',
                label: 'editor_iv_section_summary',
                icon: 'fa-list-check',
                fields: {
                    summary: {
                        type: 'object', label: 'editor_iv_summary', noHeader: true,
                        schema: {
                            intro: { type: 'text', label: 'editor_iv_summary_intro' },
                            statements: {
                                type: 'array', itemLabel: 'editor_iv_summary_group', addLabel: 'editor_iv_add_summary_group',
                                itemSchema: { _value: { type: 'stringArray', label: 'editor_iv_summary_statements', hint: 'editor_iv_summary_statements_hint', isArrayValue: true } }
                            }
                        }
                    }
                }
            }
        ]
    },

    // === Image interactive (H5P.ImageHotspots) ===
    // Édite le format intermédiaire plat (hotspots[].x/y) ; le contenu d'un point est polymorphe
    // (Texte/Image/Audio/Vidéo via _contentType + showWhen), à l'image du Livre interactif.
    'ImageHotspots': {
        sections: [
            // --- Général : titre + image de fond + texte alternatif ---
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    // Titre de l'activité : c'est une MÉTADONNÉE (h5p.json), pas un champ du content.json
                    // du player. On l'édite tout de même ici et on le réapplique au h5p.json à
                    // l'enregistrement (regenerateH5PFile), pour permettre de renommer l'activité sans
                    // repasser par la génération. `data.title` traverse normalize/denormalize sans être
                    // injecté comme clé jouée par le player. Idem côté Sucrerie (fichier partagé).
                    title: { type: 'text', label: 'editor_title', hint: 'editor_hq_title_hint' },
                    image: {
                        type: 'image',
                        label: 'editor_ih_background',
                        hint: 'editor_ih_background_hint',
                        imageProcessor: 'background',          // préserve format + grande dimension (pas de 800×600/JPEG forcé)
                        collapsible: true,
                        collapsibleLabel: 'editor_ih_background'
                    },
                    // Légende d'accessibilité : champ dédié (s'initialise depuis la donnée, contrairement au
                    // sous-champ altTextField du widget image). Rempli automatiquement par la description vision
                    // à la génération (3-5 phrases) → textarea, éditable. Rendu plain (field-constraints) donc
                    // pas de richtext. Réutilise les clés i18n du texte alternatif image.
                    backgroundImageAltText: { type: 'textarea', label: 'editor_image_alt', hint: 'editor_image_alt_placeholder' }
                }
            },
            // --- Apparence : couleur globale + type d'icône ---
            {
                id: 'appearance',
                label: 'editor_ih_section_appearance',
                icon: 'fa-palette',
                startCollapsed: true,
                compact: true,
                fields: {
                    globalColor: { type: 'color', label: 'editor_ih_global_color', default: '#981d99' },
                    globalIconType: {
                        type: 'select', label: 'editor_ih_icon_type', default: 'numbers',
                        options: [
                            { value: 'numbers', label: 'editor_ih_icon_numbers' },
                            { value: 'icon', label: 'editor_ih_icon_predefined' },
                            { value: 'image', label: 'editor_ih_icon_image' }
                        ]
                    },
                    // Icône-image globale : champ d'upload, sans lequel l'option « Image » du
                    // select ne pouvait jamais fonctionner (audit N5, semantics.json:86-102).
                    globalIconImage: {
                        type: 'image', label: 'editor_ih_icon_image',
                        showWhen: { field: 'globalIconType', value: 'image' }
                    },
                    globalIcon: {
                        type: 'select', label: 'editor_ih_icon', default: 'plus',
                        showWhen: { field: 'globalIconType', value: 'icon' },
                        options: [
                            { value: 'plus', label: 'editor_ih_icon_plus' },
                            { value: 'minus', label: 'editor_ih_icon_minus' },
                            { value: 'times', label: 'editor_ih_icon_times' },
                            { value: 'check', label: 'editor_ih_icon_check' },
                            { value: 'question', label: 'editor_ih_icon_question' },
                            { value: 'info', label: 'editor_ih_icon_info' },
                            { value: 'exclamation', label: 'editor_ih_icon_exclamation' }
                        ]
                    }
                }
            },
            // --- Points : positions, couleur par point, contenu polymorphe ---
            {
                id: 'hotspots',
                label: 'editor_ih_section_hotspots',
                icon: 'fa-location-dot',
                countField: 'hotspots',
                fields: {
                    hotspots: {
                        type: 'array',
                        itemLabel: 'editor_ih_hotspot',
                        addLabel: 'editor_ih_add_hotspot',
                        dynamicTitleField: 'header',
                        minItems: 1,
                        itemSchema: {
                            header: { type: 'text', label: 'editor_ih_header', hint: 'editor_ih_header_hint' },
                            // default 50 : un point ajouté en mode Plan naît au CENTRE de l'image,
                            // pas au coin haut-gauche (0,0) — audit N14.
                            x: { type: 'number', label: 'editor_ih_x', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            y: { type: 'number', label: 'editor_ih_y', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            // Pas de couleur par point : en mode « numéros » (défaut), H5P n'utilise que la
                            // couleur GLOBALE (section Apparence). La couleur par point n'agirait que sur une
                            // icône personnalisée, non générée → champ retiré pour éviter la confusion.
                            content: {
                                type: 'array', nested: true,
                                label: 'editor_ih_content',
                                itemLabel: 'editor_ih_block',
                                addLabel: 'editor_ih_add_block',
                                dynamicTitleField: '_contentType',
                                minItems: 1,
                                itemSchema: {
                                    _contentType: {
                                        type: 'select', label: 'editor_ih_block_type', required: true, default: 'text',
                                        options: [
                                            { value: 'text', label: 'editor_ih_block_text' },
                                            { value: 'image', label: 'editor_ih_block_image' },
                                            { value: 'audio', label: 'editor_ih_block_audio' },
                                            { value: 'video', label: 'editor_ih_block_video' }
                                        ]
                                    },
                                    text: {
                                        type: 'textarea', label: 'editor_ih_text', large: true,
                                        showWhen: { field: '_contentType', value: 'text' }
                                    },
                                    image: {
                                        type: 'image', label: 'editor_image',
                                        altTextField: 'imageAlt',
                                        showWhen: { field: '_contentType', value: 'image' }
                                    },
                                    audioFile: {
                                        type: 'audio', label: 'editor_ih_audio_file',
                                        showWhen: { field: '_contentType', value: 'audio' }
                                    },
                                    audioUrl: {
                                        type: 'text', label: 'editor_ih_audio_url', hint: 'editor_ih_media_url_hint',
                                        showWhen: { field: '_contentType', value: 'audio' }
                                    },
                                    videoFile: {
                                        type: 'video', label: 'editor_ih_video_file',
                                        showWhen: { field: '_contentType', value: 'video' }
                                    },
                                    videoUrl: {
                                        type: 'text', label: 'editor_ih_video_url', hint: 'editor_ih_video_url_hint',
                                        showWhen: { field: '_contentType', value: 'video' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]
    },

    // --- Find the Hotspot (H5P.ImageHotspotQuestion) : question à zone(s) cliquable(s) ---
    // Format plat éditable : x/y = CENTRE de la zone en % (le coin haut-gauche attendu par le
    // player est recalculé à la dénormalisation), width/height en % (défaut 20).
    'FindTheHotspot': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    // Titre de l'activité (métadonnée h5p.json) : éditable ici et réappliqué au
                    // h5p.json à l'enregistrement (regenerateH5PFile) — cf. porté aussi côté Sucrerie.
                    title: { type: 'text', label: 'editor_title', hint: 'editor_hq_title_hint' },
                    image: {
                        type: 'image',
                        label: 'editor_ih_background',
                        hint: 'editor_ih_background_hint',
                        imageProcessor: 'background',
                        collapsible: true,
                        collapsibleLabel: 'editor_ih_background'
                    },
                    taskDescription: { type: 'textarea', label: 'editor_hq_task', hint: 'editor_hq_task_hint' },
                    noneSelectedFeedback: { type: 'text', label: 'editor_hq_none_selected' },
                    showFeedbackAsPopup: { type: 'checkbox', label: 'editor_hq_popup', default: true }
                }
            },
            {
                id: 'hotspots',
                label: 'editor_hq_section_zones',
                icon: 'fa-bullseye',
                countField: 'hotspots',
                fields: {
                    hotspots: {
                        type: 'array',
                        itemLabel: 'editor_hq_zone',
                        addLabel: 'editor_hq_add_zone',
                        dynamicTitleField: 'label',
                        minItems: 1,
                        itemSchema: {
                            label: { type: 'text', label: 'editor_hq_label', hint: 'editor_hq_label_hint' },
                            correct: { type: 'checkbox', label: 'editor_hq_correct' },
                            x: { type: 'number', label: 'editor_ih_x', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            y: { type: 'number', label: 'editor_ih_y', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            width: { type: 'number', label: 'editor_hq_width', min: 1, max: 100, step: 0.1, inline: true, default: 20 },
                            height: { type: 'number', label: 'editor_hq_height', min: 1, max: 100, step: 0.1, inline: true, default: 20 },
                            figure: {
                                type: 'select', label: 'editor_hq_figure', default: 'circle',
                                options: [
                                    { value: 'circle', label: 'editor_hq_figure_circle' },
                                    { value: 'rectangle', label: 'editor_hq_figure_rectangle' }
                                ]
                            },
                            feedbackText: { type: 'textarea', label: 'editor_hq_feedback', hint: 'editor_hq_feedback_hint' }
                        }
                    }
                }
            }
        ]
    },

    // --- Find Multiple Hotspots (H5P.ImageMultipleHotspotQuestion) : chasse aux zones ---
    'FindMultipleHotspots': {
        sections: [
            {
                id: 'general',
                label: 'editor_section_general',
                icon: 'fa-info-circle',
                fields: {
                    // Titre de l'activité (métadonnée h5p.json) : éditable ici et réappliqué au
                    // h5p.json à l'enregistrement (regenerateH5PFile) — cf. porté aussi côté Sucrerie.
                    title: { type: 'text', label: 'editor_title', hint: 'editor_hq_title_hint' },
                    image: {
                        type: 'image',
                        label: 'editor_ih_background',
                        hint: 'editor_ih_background_hint',
                        imageProcessor: 'background',
                        collapsible: true,
                        collapsibleLabel: 'editor_ih_background'
                    },
                    taskDescription: { type: 'textarea', label: 'editor_hq_task', hint: 'editor_hq_task_hint' },
                    hotspotName: { type: 'text', label: 'editor_hq_hotspot_name', hint: 'editor_hq_hotspot_name_hint' },
                    numberHotspots: { type: 'number', label: 'editor_hq_number_hotspots', hint: 'editor_hq_number_hotspots_hint', min: 1, step: 1 },
                    noneSelectedFeedback: { type: 'text', label: 'editor_hq_none_selected' },
                    alreadySelectedFeedback: { type: 'text', label: 'editor_hq_already_selected' }
                }
            },
            {
                id: 'hotspots',
                label: 'editor_hq_section_zones',
                icon: 'fa-bullseye',
                countField: 'hotspots',
                fields: {
                    hotspots: {
                        type: 'array',
                        itemLabel: 'editor_hq_zone',
                        addLabel: 'editor_hq_add_zone',
                        dynamicTitleField: 'label',
                        minItems: 1,
                        itemSchema: {
                            label: { type: 'text', label: 'editor_hq_label', hint: 'editor_hq_label_hint' },
                            correct: { type: 'checkbox', label: 'editor_hq_correct' },
                            x: { type: 'number', label: 'editor_ih_x', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            y: { type: 'number', label: 'editor_ih_y', min: 0, max: 100, step: 0.1, inline: true, default: 50 },
                            width: { type: 'number', label: 'editor_hq_width', min: 1, max: 100, step: 0.1, inline: true, default: 20 },
                            height: { type: 'number', label: 'editor_hq_height', min: 1, max: 100, step: 0.1, inline: true, default: 20 },
                            figure: {
                                type: 'select', label: 'editor_hq_figure', default: 'circle',
                                options: [
                                    { value: 'circle', label: 'editor_hq_figure_circle' },
                                    { value: 'rectangle', label: 'editor_hq_figure_rectangle' }
                                ]
                            },
                            // Zone correcte : amorce composée par le player (« … X of Y {hotspotName}. »).
                            feedbackText: { type: 'textarea', label: 'editor_hq_feedback', hint: 'editor_hq_feedback_multi_hint' }
                        }
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
    'Dictation': 'h5p_dictation_name',
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
    'elea_livre': 'elea_livre_name',
    'elea_millionnaire': 'elea_millionnaire_name',
    'elea_devoir': 'elea_devoir_name',
    'CoursePresentation': 'h5p_course_presentation_name',
    'InteractiveBook': 'h5p_interactive_book_name',
    'InteractiveVideo': 'h5p_interactive_video_name',
    'ImageHotspots': 'h5p_image_hotspots_name',
    'FindTheHotspot': 'h5p_find_the_hotspot_name',
    'FindMultipleHotspots': 'h5p_find_multiple_hotspots_name'
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
 * Résout un sous-schéma à partir d'une chaîne de librairie en tolérant la version.
 * Essaie d'abord la correspondance exacte (ex: 'H5P.DragQuestion 1.15'), puis par
 * nom de librairie sans la version (ex: 'H5P.DragQuestion') — pour rester compatible
 * quand la version d'une activité est bumpée sans dupliquer les schémas, et pour
 * traiter aussi bien les anciens contenus (1.14) que les nouveaux (1.15).
 */
function resolveVersionedSchema(schemas, selectorValue) {
    if (!schemas || !selectorValue) return null;
    if (schemas[selectorValue]) return schemas[selectorValue];
    const name = String(selectorValue).split(' ')[0];
    for (const key in schemas) {
        if (key.split(' ')[0] === name) return schemas[key];
    }
    return null;
}

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
 * Normalise un sous-contenu d'« Image interactive » (un nœud H5P du content[] d'un point) vers
 * le format plat de l'éditeur : { _contentType, ...champs spécifiques }. Sépare fichier embarqué
 * (audioFile/videoFile : chemin local) et lien (audioUrl/videoUrl : http).
 * @param {Object} node - { library, params } (content.json) ou déjà au format éditeur.
 * @returns {Object|null}
 */
function normalizeIHContentNode(node) {
    if (!node || typeof node !== 'object') return null;
    const lib = (node.library || node._contentType || '').toString();
    const params = node.params || {};

    // Champs « passthrough » (cachés, hors schéma) : metadata (licence/attribution),
    // subContentId (suivi xAPI/état Moodle) et params d'origine (réglages autoplay/loop/fit,
    // copyright, decorative…). Sans eux, la dénormalisation reconstruisait des nœuds à
    // défauts figés → perte non réversible à chaque sauvegarde (audit N6).
    const carry = (out) => {
        if (node.metadata) out._metadata = node.metadata;
        if (node.subContentId) out._subContentId = node.subContentId;
        if (node.params) out._origParams = node.params;
        return out;
    };

    if (/^H5P\.Text/i.test(lib) || node._contentType === 'text') {
        const text = params.text !== undefined ? params.text : (node.text || '');
        return carry({ _contentType: 'text', text });
    }
    if (/^H5P\.Image/i.test(lib) || node._contentType === 'image') {
        const file = params.file || {};
        // dataURL (transitoire, ré-hydraté depuis le ZIP au chargement) conservé pour la preview
        // éditeur ; il est strippé à la sauvegarde (denormalize n'émet que path/mime/dimensions).
        const image = file.path
            ? { path: file.path, mime: file.mime, width: file.width, height: file.height, dataURL: file.dataURL }
            : (node.image || null);
        return carry({ _contentType: 'image', image, imageAlt: params.alt || node.imageAlt || '' });
    }
    if (/^H5P\.Audio/i.test(lib) || node._contentType === 'audio') {
        const src = (Array.isArray(params.files) && params.files[0]) || {};
        const path = src.path || node.audioUrl || (node.audioFile && node.audioFile.path) || '';
        const out = { _contentType: 'audio' };
        if (/^https?:/i.test(path)) out.audioUrl = path;
        // dataURL (transitoire, ré-hydraté depuis le ZIP) : conservé pour que le LECTEUR de
        // l'éditeur puisse lire le média embarqué (audit N13) ; jamais persisté à la sauvegarde.
        else if (path) out.audioFile = { path, mime: src.mime || (node.audioFile && node.audioFile.mime), kind: 'audio', dataURL: src.dataURL || (node.audioFile && node.audioFile.dataURL) };
        return carry(out);
    }
    if (/^H5P\.Video/i.test(lib) || node._contentType === 'video') {
        const src = (Array.isArray(params.sources) && params.sources[0]) || {};
        const path = src.path || node.videoUrl || (node.videoFile && node.videoFile.path) || '';
        const out = { _contentType: 'video' };
        // YouTube et liens directs → champ URL ; fichier embarqué (chemin local) → champ fichier.
        if (/^https?:/i.test(path) || (src.mime === 'video/YouTube')) out.videoUrl = path;
        else if (path) out.videoFile = { path, mime: src.mime || (node.videoFile && node.videoFile.mime), kind: 'video', dataURL: src.dataURL || (node.videoFile && node.videoFile.dataURL) };
        return carry(out);
    }
    return null;
}

/** UUID v4 — `crypto.randomUUID` (navigateur sécurisé + Node ≥ 19) avec repli. Pas d'import
 * Caramel-only (ce fichier est miroir byte-identique Sucrerie). */
function ihUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * Dénormalise un bloc de contenu de l'éditeur d'« Image interactive » vers un nœud H5P **complet et
 * JOUABLE** { library, params, metadata, subContentId }. On ajoute metadata + subContentId ICI (et
 * non dans un processeur en aval) car Sucrerie n'a PAS de processeur : la sortie de l'éditeur est
 * écrite telle quelle dans le content.json. Côté Caramel, le processeur re-traite de façon
 * idempotente (il conserve metadata/subContentId déjà présents).
 * @param {Object} b - Bloc éditeur { _contentType, ... }.
 * @returns {Object|null}
 */
function denormalizeIHContentNode(b) {
    if (!b || typeof b !== 'object') return null;
    const type = b._contentType
        || (b.text !== undefined ? 'text' : (b.image ? 'image' : (b.audioFile || b.audioUrl ? 'audio' : (b.videoFile || b.videoUrl ? 'video' : null))));

    // Params d'origine (champ passthrough posé par normalizeIHContentNode) : les défauts
    // ne s'appliquent QUE si le nœud n'en avait pas — un paquet importé garde ses réglages
    // (autoplay, loop, fit, copyright, decorative… — audit N6).
    const orig = (b._origParams && typeof b._origParams === 'object') ? b._origParams : {};

    let node = null;
    if (type === 'text') {
        if (!b.text || !String(b.text).trim()) return null;
        node = { library: 'H5P.Text 1.1', params: { ...orig, text: b.text } };
    } else if (type === 'image') {
        const img = b.image;
        if (!img || !img.path) return null;
        const origFile = (orig.file && typeof orig.file === 'object') ? orig.file : {};
        const file = {
            ...origFile,
            path: img.path,
            mime: img.mime || origFile.mime || 'image/jpeg',
            width: img.width || origFile.width || 0,
            height: img.height || origFile.height || 0
        };
        delete file.dataURL; // transitoire preview : jamais persisté
        node = {
            library: 'H5P.Image 1.1',
            params: { ...orig, file, alt: b.imageAlt || '', decorative: orig.decorative === true }
        };
    } else if (type === 'audio') {
        const path = (b.audioFile && b.audioFile.path) || (b.audioUrl && String(b.audioUrl).trim());
        if (!path) return null;
        const mime = (b.audioFile && b.audioFile.mime) || 'audio/mpeg';
        node = {
            library: 'H5P.Audio 1.5',
            params: { playerMode: 'minimalistic', fitToWrapper: false, controls: true, autoplay: false, ...orig, files: [{ path, mime }] }
        };
    } else if (type === 'video') {
        const path = (b.videoFile && b.videoFile.path) || (b.videoUrl && String(b.videoUrl).trim());
        if (!path) return null;
        const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(path);
        const mime = (b.videoFile && b.videoFile.mime) || (isYouTube ? 'video/YouTube' : 'video/mp4');
        node = {
            library: 'H5P.Video 1.6',
            params: { visuals: { fit: true, controls: true }, playback: { autoplay: false, loop: false }, ...orig, sources: [{ path, mime }] }
        };
    }
    if (!node) return null;
    // Compléter metadata + subContentId → nœud H5P jouable sans processeur. Les champs
    // passthrough (_metadata/_subContentId) priment : licence, attribution et identifiant
    // xAPI d'un paquet importé survivent à la sauvegarde (audit N6).
    const m = /^H5P\.(\w+)/.exec(node.library);
    const contentType = m ? m[1] : 'Text';
    node.metadata = b._metadata || b.metadata || { contentType, license: 'U', title: `Sans titre ${contentType}` };
    node.subContentId = b._subContentId || b.subContentId || ihUUID();
    return node;
}

// --- Helpers « questions hotspot » (Find the Hotspot / Find Multiple Hotspots) ---

/** Nombre fini borné [0,100], sinon défaut. */
function hqNum(v, def) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : def;
}
/** Arrondi à 2 décimales. */
function hqRound2(v) {
    return Math.round(v * 100) / 100;
}

/**
 * « Zones à trouver » (`numberHotspots`, Find Multiple Hotspots) : aligne la valeur sur le
 * nombre de zones correctes et pose une BASELINE cachée `_numberHotspotsAuto` quand la valeur
 * EST cette valeur automatique. La baseline permet à `denormalizeHotspotQuestionData()` de
 * distinguer deux intentions que le seul nombre ne suffit pas à séparer :
 *  - champ jamais retouché (valeur = nb de zones correctes) → il SUIT l'ajout ou la
 *    suppression d'une zone correcte à l'enregistrement ;
 *  - plafond volontairement plus bas (« trouver 3 zones sur 5 ») → respecté tel quel.
 * Sans elle, ajouter une zone correcte dans l'éditeur laissait `numberHotspots` figé sur
 * l'ancien total : le player plafonnait `maxScore` à cette valeur et la nouvelle bonne
 * réponse n'était pas comptabilisée (« … 1 of 3 » au lieu de « … 1 of 4 »).
 * @param {Object} target - Modèle PLAT (muté sur place).
 * @param {number} correctCount - Nombre de zones `correct: true` dans ce modèle.
 */
function hqSyncNumberHotspots(target, correctCount) {
    const auto = correctCount || 1;
    const n = parseInt(target.numberHotspots, 10);
    const value = (Number.isFinite(n) && n >= 1) ? Math.min(n, auto) : auto;
    target.numberHotspots = value;
    if (value === auto) target._numberHotspotsAuto = auto;
    else delete target._numberHotspotsAuto;
}

/**
 * Normalise les deux « questions hotspot » vers le format plat éditable :
 * hotspots[]{label, correct, x, y (CENTRES en %), width, height, figure, feedbackText}.
 * Accepte le format plat (LLM) ET le content.json complet ({[rootKey]: …}, où computedSettings
 * porte le COIN haut-gauche). Les libellés hors schéma du content.json (l10n, scoreBarLabel…)
 * sont conservés en champs cachés `_…` pour être restitués tels quels à la dénormalisation.
 * @param {Object} data
 * @param {string} rootKey - 'imageHotspotQuestion' | 'imageMultipleHotspotQuestion'.
 * @returns {Object} format plat éditable.
 */
function normalizeHotspotQuestionData(data, rootKey) {
    const isMultiple = rootKey === 'imageMultipleHotspotQuestion';
    const root = data && data[rootKey];

    if (root && typeof root === 'object') {
        const bis = root.backgroundImageSettings || {};
        // Find the Hotspot stocke l'image APLATIE (bis = objet image) ; Find Multiple Hotspots
        // l'imbrique (bis.backgroundImage) — cf. paquets Éléa de référence.
        const image = (bis.backgroundImage && bis.backgroundImage.path) ? bis.backgroundImage
            : (bis.path ? bis : null);
        const hs = root.hotspotSettings || {};
        const flat = {
            title: data.title || (data.metadata && data.metadata.title) || bis.questionTitle || '',
            image: image || undefined,
            taskDescription: hs.taskDescription || '',
            hotspots: (Array.isArray(hs.hotspot) ? hs.hotspot : []).map(h => {
                const cs = (h && h.computedSettings) || {};
                const us = (h && h.userSettings) || {};
                const width = hqNum(cs.width, 20) || 20;
                const height = hqNum(cs.height, 20) || 20;
                return {
                    label: (h && h.label) || '',
                    correct: us.correct === true,
                    // Coin haut-gauche → CENTRE (défaut : centre de l'image si coordonnée absente).
                    x: hqRound2(hqNum(cs.x, 50 - width / 2) + width / 2),
                    y: hqRound2(hqNum(cs.y, 50 - height / 2) + height / 2),
                    width,
                    height,
                    figure: cs.figure === 'rectangle' ? 'rectangle' : 'circle',
                    feedbackText: us.feedbackText || ''
                };
            }),
            noneSelectedFeedback: hs.noneSelectedFeedback || ''
        };
        if (isMultiple) {
            flat.hotspotName = hs.hotspotName || '';
            // Reprendre la valeur du content.json AVANT de la synchroniser : sans elle, un
            // plafond volontaire (« trouver 3 zones sur 5 ») serait remonté à 5 à l'ouverture.
            flat.numberHotspots = hs.numberHotspots;
            hqSyncNumberHotspots(flat, flat.hotspots.filter(h => h.correct === true).length);
            flat.alreadySelectedFeedback = hs.alreadySelectedFeedback || '';
        } else {
            flat.showFeedbackAsPopup = hs.showFeedbackAsPopup !== false;
            if (hs.l10n) flat._l10n = hs.l10n;
            if (data.scoreBarLabel) flat._scoreBarLabel = data.scoreBarLabel;
            if (data.a11yRetry) flat._a11yRetry = data.a11yRetry;
        }
        return flat;
    }

    // Format plat (LLM) : compléter les défauts pour un aller-retour d'édition stable.
    if (Array.isArray(data.hotspots)) {
        data.hotspots = data.hotspots.map(h => {
            if (!h || typeof h !== 'object') return h;
            h.correct = h.correct === true;
            h.x = hqRound2(hqNum(h.x, 50));
            h.y = hqRound2(hqNum(h.y, 50));
            h.width = hqNum(h.width, 20) || 20;
            h.height = hqNum(h.height, 20) || 20;
            // Compat ascendante : l'ancien passthrough caché `_figure` migre vers le champ `figure`.
            h.figure = (h.figure === 'rectangle' || h._figure === 'rectangle') ? 'rectangle' : 'circle';
            delete h._figure;
            if (!h.label) h.label = '';
            if (!h.feedbackText) h.feedbackText = '';
            return h;
        });
    }
    if (isMultiple) {
        // Recalculé à CHAQUE normalisation : une baseline devenue obsolète (modèle plat
        // rouvert après édition) est ainsi réalignée avant affichage.
        hqSyncNumberHotspots(data, (Array.isArray(data.hotspots) ? data.hotspots : [])
            .filter(h => h && h.correct === true).length);
    }
    if (!isMultiple && data.showFeedbackAsPopup === undefined) data.showFeedbackAsPopup = true;
    return data;
}

/**
 * Dénormalise une « question hotspot » vers un content.json JOUABLE DIRECTEMENT
 * (H5P.ImageHotspotQuestion 1.8 / H5P.ImageMultipleHotspotQuestion 1.0). INDISPENSABLE côté
 * Sucrerie qui écrit cette sortie telle quelle SANS processeur ; côté Caramel le processeur
 * re-traite de façon idempotente. Conversion CENTRES (format plat) → COINS haut-gauche
 * (computedSettings), bornés pour que la zone reste entière dans l'image.
 * ⚠️ Formes d'image différentes : APLATIE pour Find the Hotspot (le player 1.8 lit
 * `backgroundImageSettings.path`), IMBRIQUÉE pour Find Multiple Hotspots.
 * @param {Object} data - Format plat éditable.
 * @param {string} rootKey - 'imageHotspotQuestion' | 'imageMultipleHotspotQuestion'.
 * @returns {Object} content.json complet.
 */
function denormalizeHotspotQuestionData(data, rootKey) {
    const isMultiple = rootKey === 'imageMultipleHotspotQuestion';
    // Repli robuste si la clé manque dans la locale (t() renverrait la clé brute).
    const hqLabel = (key, fallback) => { const v = t(key); return (v && v !== key) ? v : fallback; };

    // Image de fond : retirer le dataURL transitoire (base64, alourdirait le content.json).
    let image;
    if (data.image && typeof data.image === 'object' && data.image.path) {
        image = {
            path: data.image.path,
            mime: data.image.mime || 'image/png',
            copyright: data.image.copyright || { license: 'U' },
            width: data.image.width || 0,
            height: data.image.height || 0
        };
    }

    const hotspot = (Array.isArray(data.hotspots) ? data.hotspots : []).map(h => {
        if (!h || typeof h !== 'object') return null;
        const width = hqNum(h.width, 20) || 20;
        const height = hqNum(h.height, 20) || 20;
        const cx = hqNum(h.x, 50);
        const cy = hqNum(h.y, 50);
        const node = {
            userSettings: {
                correct: h.correct === true,
                feedbackText: h.feedbackText || ''
            },
            computedSettings: {
                x: hqRound2(Math.max(0, Math.min(100 - width, cx - width / 2))),
                y: hqRound2(Math.max(0, Math.min(100 - height, cy - height / 2))),
                width,
                height,
                figure: (h.figure === 'rectangle' || h._figure === 'rectangle') ? 'rectangle' : 'circle'
            }
        };
        // Champ éditorial hors semantics (ignoré par le player, réutilisé par l'éditeur/l'export).
        if (h.label) node.label = h.label;
        return node;
    }).filter(Boolean);

    const hotspotSettings = {
        taskDescription: data.taskDescription || '',
        hotspot,
        noneSelectedFeedback: data.noneSelectedFeedback || ''
    };

    const out = {};
    if (isMultiple) {
        hotspotSettings.hotspotName = data.hotspotName || '';
        const correctCount = hotspot.filter(h => h.userSettings.correct).length;
        const auto = correctCount || 1;
        const n = parseInt(data.numberHotspots, 10);
        // Valeur restée sur sa baseline automatique (cf. hqSyncNumberHotspots) → elle suit le
        // nombre de zones correctes du moment, sinon l'ajout d'une zone correcte laissait le
        // total du player figé. Un plafond saisi à la main reste respecté (borné à `auto`).
        const base = parseInt(data._numberHotspotsAuto, 10);
        const surBaseline = Number.isFinite(base) && n === base;
        hotspotSettings.numberHotspots = (!surBaseline && Number.isFinite(n) && n >= 1)
            ? Math.min(n, auto)
            : auto;
        hotspotSettings.alreadySelectedFeedback = data.alreadySelectedFeedback || '';
        out[rootKey] = {
            backgroundImageSettings: {
                questionTitle: data.questionTitle || data.title || '',
                ...(image ? { backgroundImage: image } : {})
            },
            hotspotSettings
        };
    } else {
        hotspotSettings.showFeedbackAsPopup = data.showFeedbackAsPopup !== false;
        hotspotSettings.l10n = {
            retryText: (data._l10n && data._l10n.retryText) || hqLabel('h5p_try_again', 'Recommencer'),
            closeText: (data._l10n && data._l10n.closeText) || hqLabel('h5p_close', 'Fermer')
        };
        out[rootKey] = {
            backgroundImageSettings: image || {},
            hotspotSettings
        };
        out.scoreBarLabel = data._scoreBarLabel
            || hqLabel('h5p_score_bar_label', 'Vous avez obtenu :num sur :total points');
        out.a11yRetry = data._a11yRetry
            || hqLabel('h5p_a11y_retry', 'Recommencer l\'exercice. Réinitialiser toutes les réponses et recommencer.');
    }
    // Titre conservé à la racine (métadonnée : détection, exports documentaires).
    if (data.title) out.title = data.title;
    return out;
}

/**
 * Glisser-déposer : met les associations étiquette ↔ zone dans la forme de l'ÉDITEUR
 * (`elements[].zoneIndices`), quelle que soit la forme d'entrée.
 *
 * `correctElements` (zone → étiquettes) est la forme du `.h5p`, des prompts et des
 * processeurs : elle fait autorité DÈS QU'ELLE PORTE QUELQUE CHOSE. Sinon les renvois déjà
 * écrits dans la forme éditeur sont CONSERVÉS — les écraser sans rien avoir à mettre à la
 * place effaçait en silence toutes les bonnes réponses d'un contenu rédigé dans cette forme
 * (constaté sur `course_presentation_4.json`). L'autre bout de la chaîne est réparé par
 * `healDragQuestionAssociations` (json-healer.js), qui fait le trajet inverse avant export.
 *
 * Les quatre conteneurs d'un Glisser-déposer — autonome, sous-question de Quiz, exercice de
 * diapositive, bloc de Livre interactif — passent tous par ici : une seule règle, un seul
 * endroit à corriger.
 *
 * @param {Array} dropZones - zones de dépôt (mutées : `correctElements` retiré)
 * @param {Array} elements - étiquettes (mutées : `zoneIndices` posé)
 */
function normalizeDragQuestionForEditor(dropZones, elements) {
    const zonesRenseignees = dropZones.some(
        z => z && Array.isArray(z.correctElements) && z.correctElements.length > 0
    );

    if (zonesRenseignees) {
        elements.forEach(el => { if (el && typeof el === 'object') el.zoneIndices = []; });
        dropZones.forEach((zone, zoneIdx) => {
            if (!zone || !Array.isArray(zone.correctElements)) return;
            zone.correctElements.forEach(elemIdx => {
                const idx = typeof elemIdx === 'string' ? parseInt(elemIdx, 10) : elemIdx;
                if (!Number.isInteger(idx) || idx < 0 || idx >= elements.length) return;
                const el = elements[idx];
                if (!el || typeof el !== 'object') return;
                if (!el.zoneIndices.includes(zoneIdx)) el.zoneIndices.push(zoneIdx);
            });
        });
    } else {
        elements.forEach(el => {
            if (el && typeof el === 'object' && !Array.isArray(el.zoneIndices)) el.zoneIndices = [];
        });
    }

    // `correctElements` est reconstruit à l'enregistrement (denormalizeDataForSave) : le
    // garder pendant l'édition ferait une seconde source de vérité, qui divergerait.
    dropZones.forEach(zone => { if (zone && typeof zone === 'object') delete zone.correctElements; });
}

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

        case 'FindTheWords':
            // wordList est une chaine "MOT1,MOT2" → convertir en tableau pour stringArray
            if (typeof data.wordList === 'string') {
                data.wordList = data.wordList.split(',').map(w => w.trim()).filter(w => w.length > 0);
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
                        normalizeDragQuestionForEditor(dropZones, elements);
                    }
                });
            }
            return data;

        case 'DragAndDrop': {
            const dropZones = data.dropZones || [];
            const elements = data.elements || [];
            normalizeDragQuestionForEditor(dropZones, elements);
            return data;
        }

        case 'CoursePresentation': {
            if (data.slides && Array.isArray(data.slides)) {
                data.slides.forEach(slide => {
                    // Initialiser layout pour les types à 2 zones (sinon le select est vide)
                    const t = slide.type;
                    if ((t === 'content-with-table' || t === 'content-quiz') && !slide.layout) {
                        slide.layout = 'vertical';
                    }

                    // Extraire exercise.library → _exerciseLibrary pour le selecteur de l'editeur
                    if (slide.exercise && slide.exercise.library) {
                        slide._exerciseLibrary = slide.exercise.library;
                        delete slide.exercise.library;
                    }

                    // DragQuestion : correctElements → zoneIndices
                    if (slide.exercise && slide._exerciseLibrary &&
                        slide._exerciseLibrary.startsWith('H5P.DragQuestion')) {
                        const dropZones = slide.exercise.dropZones || [];
                        const elements = slide.exercise.elements || [];
                        normalizeDragQuestionForEditor(dropZones, elements);
                    }
                });
            }
            return data;
        }

        case 'InteractiveBook': {
            if (data.chapters && Array.isArray(data.chapters)) {
                data.chapters.forEach(ch => {
                    if (!Array.isArray(ch.content)) return;
                    ch.content = ch.content.map(b => {
                        if (!b || typeof b !== 'object') return b;

                        // Bloc exercice : extraire library → _exerciseLibrary et
                        // envelopper les params dans `exercise` (pour le dynamicObject)
                        if (b.type === 'exercise' || b.library) {
                            const { type, library, ...params } = b;
                            // DragQuestion : correctElements → zoneIndices
                            if (library && library.startsWith('H5P.DragQuestion')) {
                                const dropZones = params.dropZones || [];
                                const elements = params.elements || [];
                                normalizeDragQuestionForEditor(dropZones, elements);
                            }
                            return { _blockType: 'exercise', _exerciseLibrary: library || '', exercise: params };
                        }

                        // Blocs de contenu : inférer _blockType depuis type ou les données
                        if (b.type === 'table' || b.table) {
                            b._blockType = 'table';
                            if (!b.tableStyle) b.tableStyle = 'default';
                        } else if (b.type === 'image' || b.image) {
                            b._blockType = 'image';
                        } else {
                            b._blockType = 'text';
                        }
                        delete b.type;
                        return b;
                    });
                });
            }
            return data;
        }

        case 'ImageHotspots': {
            // Aplatir position{x,y} → x,y et construire un content[] enrichi (Texte/Image/Audio/Vidéo)
            // que l'éditeur sait afficher via _contentType + showWhen. Accepte le format plat (LLM,
            // hotspots[].text) ET le content.json v1.11 (hotspots[].content[]{library,params}).
            if (Array.isArray(data.hotspots)) {
                data.hotspots = data.hotspots.map(h => {
                    if (!h || typeof h !== 'object') return h;
                    if (h.position && typeof h.position === 'object') {
                        if (h.x === undefined || h.x === null) h.x = h.position.x;
                        if (h.y === undefined || h.y === null) h.y = h.position.y;
                    }
                    let content = [];
                    if (Array.isArray(h.content) && h.content.length) {
                        content = h.content.map(normalizeIHContentNode).filter(Boolean);
                    } else if (h.text) {
                        // Le champ plat `text` vient du LLM et porte du MARKDOWN. On le
                        // convertit ICI, car ce passage est à sens unique : `delete h.text`
                        // ci-dessous supprime le champ plat, et le processeur ne verra plus
                        // que le bloc structuré — dont le chemin se contente d'assainir,
                        // sans convertir. Sans cette conversion, ouvrir puis enregistrer une
                        // « Image interactive » transformait `**gras**` en astérisques
                        // visibles dans l'activité publiée (constaté 2026-07 sur Sucrerie).
                        //
                        // Le semantics l'autorise explicitement : le contenu d'un point est
                        // un sous-contenu `H5P.Text 1.1`, dont le champ `text` est
                        // `widget: html` avec `strong` dans ses `tags`
                        // (cf. node tests/run_semantics_audit.mjs --module=ImageHotspots).
                        //
                        // `markdownToHtml` et non `formatTextToHtml` : ce fichier est
                        // byte-identique côté Sucrerie et ne peut importer que des helpers
                        // présents dans les DEUX `core/utils.js` (celui-ci n'est pas partagé).
                        // La conversion est idempotente — un texte déjà converti ne contient
                        // plus de `**`, une seconde passe le laisse intact.
                        content = [{ _contentType: 'text', text: markdownToHtml(h.text) }];
                    }
                    // Conserver le flag legacyPositioning (positionnement pré-1.8) en champ caché,
                    // sinon il est perdu à l'aplatissement et le rendu des points se décale au ré-export
                    // d'un .h5p legacy importé (PRD « Préserver position.legacyPositioning »).
                    if (h.position && h.position.legacyPositioning === true) h._legacyPositioning = true;
                    h.content = content;
                    delete h.text;
                    delete h.position;
                    return h;
                });
            }
            return data;
        }

        case 'FindTheHotspot':
            return normalizeHotspotQuestionData(data, 'imageHotspotQuestion');

        case 'FindMultipleHotspots':
            return normalizeHotspotQuestionData(data, 'imageMultipleHotspotQuestion');

        case 'Dictation': {
            // Tableau nu / phrases en chaînes (IA externes) → objets {text}
            if (Array.isArray(data)) data = { sentences: data };
            if (Array.isArray(data.sentences)) {
                data.sentences = data.sentences.map(s => {
                    const st = (typeof s === 'string') ? { text: s } : { ...(s || {}) };
                    // Champ audio H5P (tableau [{path,mime,…}]) → valeur éditeur {path,mime,kind,dataURL?}
                    const toEditorAudio = (v) => {
                        const f = Array.isArray(v) ? v[0] : v;
                        if (!f || typeof f.path !== 'string' || !f.path) return null;
                        return { path: f.path, mime: f.mime || 'audio/mpeg', kind: 'audio', ...(f.dataURL ? { dataURL: f.dataURL } : {}) };
                    };
                    const sample = toEditorAudio(st.sample);
                    const alt = toEditorAudio(st.sampleAlternative);
                    if (sample) st.sample = sample; else delete st.sample;
                    if (alt) st.sampleAlternative = alt; else delete st.sampleAlternative;
                    return st;
                });
            }
            // behaviour imbriqué du content.json (scoring/textual/feedbackPresentation)
            // → forme PLATE attendue par le schéma éditeur
            if (data.behaviour && typeof data.behaviour === 'object') {
                const b = { ...data.behaviour };
                for (const grp of ['scoring', 'textual', 'feedbackPresentation']) {
                    if (b[grp] && typeof b[grp] === 'object') {
                        Object.assign(b, b[grp]);
                        delete b[grp];
                    }
                }
                data.behaviour = b;
            }
            // Bloc « Média » du content.json (media.type = H5P.Image) → champ éditeur
            // mediaImage {path,mime,…} + mediaImageAlt (round-trip d'un .h5p rechargé,
            // y compris ré-enregistré par Éléa/Lumi).
            {
                const file = data.media?.type?.params?.file;
                if (!data.mediaImage && file && typeof file.path === 'string' && file.path) {
                    data.mediaImage = {
                        path: file.path,
                        mime: file.mime || 'image/jpeg',
                        ...(file.width ? { width: file.width } : {}),
                        ...(file.height ? { height: file.height } : {}),
                        // dataURL posé par la ré-hydratation du ZIP (preview de l'image
                        // dans le widget éditeur à la réouverture).
                        ...(file.dataURL ? { dataURL: file.dataURL } : {})
                    };
                    data.mediaImageAlt = data.media.type.params.alt || '';
                }
            }
            return data;
        }

        case 'elea_test':
            // Injecter le champ "single" manquant et normaliser les fractions multichoice
            // pour que l'éditeur affiche les bonnes valeurs dans les selects
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach(q => {
                    if (q.type === 'multichoice' && q.content) {
                        // Normaliser les fractions aux valeurs Moodle valides
                        if (Array.isArray(q.content.answers)) {
                            q.content.answers = normalizeFractions(q.content.answers);
                        }
                        // Injecter single si manquant (auto-détection à partir des fractions)
                        if (q.content.single === undefined) {
                            const answers = Array.isArray(q.content.answers) ? q.content.answers : [];
                            const correctCount = answers.filter(a => Number(a.fraction) > 0).length;
                            q.content.single = correctCount > 1 ? 'false' : 'true';
                        }
                    }
                });
            }
            return data;

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
                // Conserver hTag s'il est défini (pour le processeur)
                const glossaryResult = data.items;
                if (data.hTag) {
                    glossaryResult.hTag = data.hTag;
                }
                return glossaryResult;
            }
            return data;

        case 'FindTheWords':
            // wordList tableau → chaine separee par des virgules
            if (Array.isArray(data.wordList)) {
                data.wordList = data.wordList.join(',');
            }
            return data;

        case 'Dictation': {
            // Valeur éditeur {path,mime,kind,dataURL} → champ audio H5P [{path,mime,copyright}]
            // (forme DIRECTEMENT jouable : indispensable côté hôtes sans processeur).
            if (Array.isArray(data.sentences)) {
                data.sentences = data.sentences.map(s => {
                    const st = { ...(s || {}) };
                    const toH5PAudio = (v) => {
                        const f = Array.isArray(v) ? v[0] : v;
                        if (!f || typeof f.path !== 'string' || !f.path) return null;
                        return [{ path: f.path, mime: f.mime || 'audio/mpeg', copyright: { license: 'U' } }];
                    };
                    const sample = toH5PAudio(st.sample);
                    const alt = toH5PAudio(st.sampleAlternative);
                    if (sample) st.sample = sample; else delete st.sample;
                    if (alt) st.sampleAlternative = alt; else delete st.sampleAlternative;
                    return st;
                });
            }
            // behaviour plat de l'éditeur → groupes imbriqués attendus par H5P.Dictation
            // (behaviour.scoring.*, .textual.*, .feedbackPresentation.*)
            if (data.behaviour && typeof data.behaviour === 'object') {
                const b = { ...data.behaviour };
                const lift = (keys) => {
                    const grp = {};
                    keys.forEach(k => {
                        if (b[k] !== undefined) { grp[k] = b[k]; delete b[k]; }
                    });
                    return grp;
                };
                const scoring = lift(['ignorePunctuation', 'zeroMistakeMode', 'typoFactor']);
                const textual = lift(['wordSeparator', 'overrideRTL', 'autosplit']);
                const feedbackPresentation = lift(['customTypoDisplay', 'alternateSolution']);
                b.scoring = {
                    ignorePunctuation: scoring.ignorePunctuation !== false,
                    zeroMistakeMode: scoring.zeroMistakeMode === true,
                    typoFactor: ['100', '50', '0'].includes(String(scoring.typoFactor)) ? String(scoring.typoFactor) : '50'
                };
                b.textual = {
                    wordSeparator: textual.wordSeparator || ' ',
                    overrideRTL: ['auto', 'on', 'off'].includes(textual.overrideRTL) ? textual.overrideRTL : 'auto',
                    autosplit: textual.autosplit !== false
                };
                b.feedbackPresentation = {
                    customTypoDisplay: feedbackPresentation.customTypoDisplay === true,
                    alternateSolution: (feedbackPresentation.alternateSolution === 'all') ? 'all' : 'first'
                };
                data.behaviour = b;
            }
            // Champ éditeur mediaImage → bloc « Média » H5P JOUABLE (indispensable côté
            // hôtes sans processeur). Image retirée dans l'éditeur → retour au bloc vide.
            // Un media NON-image (vidéo/audio posé par Éléa) est conservé tel quel : le
            // champ éditeur ne gère que l'image et ne doit pas l'écraser.
            {
                const img = data.mediaImage;
                const isNonImageMedia = data.media?.type && !data.media.type.params?.file;
                if (img && typeof img.path === 'string' && img.path) {
                    data.media = {
                        type: {
                            library: 'H5P.Image 1.1',
                            params: {
                                file: {
                                    path: img.path,
                                    mime: img.mime || 'image/jpeg',
                                    width: img.width || 0,
                                    height: img.height || 0
                                },
                                alt: data.mediaImageAlt || '',
                                decorative: false
                            },
                            subContentId: ihUUID(),
                            metadata: { contentType: 'Image', license: 'U', title: 'Untitled Image' }
                        },
                        disableImageZooming: false
                    };
                } else if (!isNonImageMedia) {
                    data.media = { disableImageZooming: false };
                }
                delete data.mediaImage;
                delete data.mediaImageAlt;
            }
            return data;
        }

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

        case 'SingleChoiceSet':
        case 'Summary':
            // Ces types ont des champs techniques (behaviour, l10n, a11y, etc.)
            // qui ne sont pas dans le schéma éditeur — retourner tel quel
            // pour éviter que cleanDataBasedOnSchema ne les supprime.
            return data;

        case 'CoursePresentation': {
            if (data.slides && Array.isArray(data.slides)) {
                data.slides.forEach(slide => {
                    // Reinjecter _exerciseLibrary → exercise.library
                    if (slide._exerciseLibrary) {
                        if (!slide.exercise) slide.exercise = {};
                        slide.exercise.library = slide._exerciseLibrary;
                        delete slide._exerciseLibrary;
                    }

                    // DragQuestion : zoneIndices → correctElements
                    if (slide.exercise && slide.exercise.library &&
                        slide.exercise.library.startsWith('H5P.DragQuestion')) {
                        const dropZones = slide.exercise.dropZones || [];
                        const elements = slide.exercise.elements || [];
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

                    // Nettoyer les champs vides selon le type de slide
                    const t = slide.type;
                    if (t !== 'content' && t !== 'content-with-table' && t !== 'content-quiz') {
                        delete slide.text;
                    }
                    if (t !== 'content-with-table') {
                        delete slide.table;
                        delete slide.tableStyle;
                    }
                    if (t !== 'title') {
                        delete slide.subtitle;
                    }
                    if (t !== 'quiz' && t !== 'content-quiz' && t !== 'summary') {
                        delete slide.exercise;
                    }
                    // Nettoyer le layout pour les types à zone unique
                    if (t !== 'content-with-table' && t !== 'content-quiz') {
                        delete slide.layout;
                    }
                });
            }
            return data;
        }

        case 'InteractiveBook': {
            if (data.chapters && Array.isArray(data.chapters)) {
                data.chapters.forEach(ch => {
                    if (!Array.isArray(ch.content)) return;
                    ch.content = ch.content.map(b => {
                        if (!b || typeof b !== 'object') return b;
                        const blockType = b._blockType || (b.library || b.exercise ? 'exercise' : (b.table ? 'table' : (b.image ? 'image' : 'text')));

                        // Bloc exercice : réinjecter _exerciseLibrary → library et aplatir exercise
                        if (blockType === 'exercise') {
                            const params = { ...(b.exercise || {}) };
                            const library = b._exerciseLibrary || params.library || b.library || '';
                            delete params.library;
                            // DragQuestion : zoneIndices → correctElements
                            if (library.startsWith('H5P.DragQuestion')) {
                                const dropZones = params.dropZones || [];
                                const elements = params.elements || [];
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
                            return { type: 'exercise', library, ...params };
                        }

                        // Blocs de contenu : ne conserver que les champs du type
                        if (blockType === 'table') {
                            return {
                                type: 'table',
                                tableStyle: b.tableStyle || 'default',
                                table: b.table || { headers: [], rows: [] }
                            };
                        }
                        if (blockType === 'image') {
                            const imageBlock = { type: 'image', alt: b.alt || '' };
                            if (b.image) imageBlock.image = b.image;
                            return imageBlock;
                        }
                        return { type: 'text', text: b.text || '' };
                    });
                });
            }
            // Couverture vide → la retirer (sinon le processeur afficherait une page blanche)
            if (data.cover && !(data.cover.description || '').trim()) {
                delete data.cover;
            }
            return data;
        }

        case 'ImageHotspots': {
            // Produire un content.json H5P.ImageHotspots 1.11 JOUABLE DIRECTEMENT (position{x,y,
            // legacyPositioning}, content[] de nœuds complets {library,params,metadata,subContentId},
            // defaults globaux + libellés). INDISPENSABLE côté Sucrerie qui écrit cette sortie telle
            // quelle SANS processeur ; côté Caramel le processeur re-traite de façon idempotente.
            // (Avant : on produisait le format plat intermédiaire {x,y} → le player ne trouvait pas
            // position → aucun point affiché côté Sucrerie.)
            {
                const DEF_COLOR = '#981d99', DEF_ICON = 'plus';
                const clampPct = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; };
                const gColor = data.globalColor || DEF_COLOR;
                const gIcon = data.globalIcon || DEF_ICON;
                if (Array.isArray(data.hotspots)) {
                    data.hotspots = data.hotspots.map(h => {
                        if (!h || typeof h !== 'object') return h;
                        const node = {
                            position: { x: clampPct(h.x), y: clampPct(h.y), legacyPositioning: h._legacyPositioning === true },
                            alwaysFullscreen: !!h.alwaysFullscreen,
                            hotspotIconType: h.hotspotIconType || 'default',
                            hotspotIcon: h.hotspotIcon || gIcon,
                            hotspotColor: h.hotspotColor || gColor,
                            content: (Array.isArray(h.content) ? h.content : []).map(denormalizeIHContentNode).filter(Boolean)
                        };
                        if (h.header) node.header = h.header;
                        // Icône-image personnalisée d'un paquet importé : à préserver (audit N5).
                        if (h.hotspotIconImage) node.hotspotIconImage = h.hotspotIconImage;
                        return node;
                    });
                }
                // Libellés d'accessibilité : localisés dans la langue de l'interface (audit N8).
                // Repli robuste si la clé manque dans la locale (t() renverrait la clé brute).
                const ihLabel = (key, fallback) => { const v = t(key); return (v && v !== key) ? v : fallback; };
                // Champs globaux + libellés d'accessibilité (defaults) → content.json complet.
                data.globalIconType = data.globalIconType || 'numbers';
                data.globalIcon = gIcon;
                data.globalColor = gColor;
                data.backgroundImageAltText = data.backgroundImageAltText || '';
                data.untitledHotspotLabel = data.untitledHotspotLabel || ihLabel('h5p_untitled_hotspot', 'Point sans titre');
                data.closeButtonLabel = data.closeButtonLabel || ihLabel('h5p_close', 'Fermer');
                data.containsAudioVideoLabel = data.containsAudioVideoLabel || ihLabel('h5p_contains_audio_video', 'Contient de l\'audio ou de la vidéo');
                // Image de fond : retirer le dataURL (base64, alourdirait le content.json) + copyright.
                if (data.image && typeof data.image === 'object' && data.image.path) {
                    data.image = {
                        path: data.image.path,
                        mime: data.image.mime || 'image/png',
                        copyright: data.image.copyright || { license: 'U' },
                        width: data.image.width || 0,
                        height: data.image.height || 0
                    };
                }
                // Icône-image globale (audit N5) : même strip du dataURL transitoire que le fond.
                if (data.globalIconImage && typeof data.globalIconImage === 'object' && data.globalIconImage.path) {
                    data.globalIconImage = {
                        path: data.globalIconImage.path,
                        mime: data.globalIconImage.mime || 'image/png',
                        copyright: data.globalIconImage.copyright || { license: 'U' },
                        width: data.globalIconImage.width || 0,
                        height: data.globalIconImage.height || 0
                    };
                }
            }
            return data;
        }

        case 'FindTheHotspot':
            return denormalizeHotspotQuestionData(data, 'imageHotspotQuestion');

        case 'FindMultipleHotspots':
            return denormalizeHotspotQuestionData(data, 'imageMultipleHotspotQuestion');

        case 'InteractiveVideo': {
            // Nettoyage par schéma, MAIS on préserve les champs « passthrough » non éditables
            // que le processeur consomme (transcript = piste de sous-titres, duration). Sans cela,
            // éditer la vidéo supprimerait les sous-titres (transcript est hors schéma) : c'est la
            // case « Intégrer les sous-titres » (videoSource.showCaptions, dans le schéma) qui doit
            // décider de leur maintien — pas le nettoyage par schéma.
            const ivSchema = getSchemaForType('InteractiveVideo');
            const cleanedIV = ivSchema ? cleanDataBasedOnSchema(data, ivSchema) : data;
            for (const k of ['transcript', 'duration', 'poster']) {
                if (data[k] !== undefined) cleanedIV[k] = data[k];
            }
            return cleanedIV;
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
        // Garde anti prototype pollution : ne jamais fusionner ces cles
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
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
                const subSchema = resolveVersionedSchema(config.schemas, selectorValue);

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
                if (subKey.includes('.')) {
                    // Clé en notation pointée (ex: asset.media) → accès imbriqué
                    const subValue = getNestedValue(data, subKey);
                    if (subValue !== undefined) {
                        setNestedValue(cleaned, subKey, subValue);
                    }
                } else if (data.hasOwnProperty(subKey)) {
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
