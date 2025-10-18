/**
 * @file Gestion de la génération des prompts pour l'IA.
 * Ce module lit les informations saisies par l'utilisateur dans les formulaires (simple ou guidé)
 * et construit des prompts structurés et détaillés pour chaque type d'activité.
 */

import { showNotification } from './utils.js';
import { translations } from './translation.js';
import { h5pModules, moodleModules } from './definitions.js';
import { activeTile } from './ui.js';

/**
 * Fonction principale qui lit les champs du formulaire actif (simple ou guidé)
 * et déclenche la génération des prompts via `getPrompts`.
 * Les prompts générés sont stockés dans des `textarea` cachés dans le DOM.
 */
export function generatePrompts() {
        const simpleModeTab = document.querySelector('.mode-tab[data-mode="simple"]');
        let prompts;

        if (simpleModeTab.classList.contains('active')) { // Mode Simple
            const qui = document.getElementById('qui').value.trim();
            const quoi = document.getElementById('quoi').value.trim();

            if (!qui && !quoi) {
                showNotification(translations.error_please_fill_fields || 'Veuillez remplir au moins un champ du mode Rapide.', 'error');
                return;
            }
            prompts = getPrompts(qui, quoi, null, null, null, false);
        } else { // Mode Guidé (Avancé)
            const matiere = document.getElementById('matiere').value.trim();
            const niveau = document.getElementById('niveau').value.trim();
            const theme = document.getElementById('theme').value.trim();
            const nombreQuestionsValue = document.getElementById('nombreQuestions').value.trim();
            const infosComplementaires = "";

            if (!matiere && !niveau && !theme && !nombreQuestionsValue) {
                showNotification(translations.error_please_fill_guided_fields || 'Veuillez remplir au moins un champ du mode Avancé.', 'error');
                return;
            }
            const nombreQuestions = nombreQuestionsValue || '5';
            prompts = getPrompts(matiere, niveau, theme, nombreQuestions, infosComplementaires, true);
        }
        
        // Nettoyer les anciens prompts cachés
        document.querySelectorAll('textarea[id^="hidden-"]').forEach(el => el.remove());

        for (const key in prompts) {
            const hiddenTextarea = document.createElement('textarea');
            hiddenTextarea.id = `hidden-${key}`;
            hiddenTextarea.classList.add('hidden');
            hiddenTextarea.value = prompts[key];
            document.body.appendChild(hiddenTextarea);
        }
        
        // Si un contenu est ouvert, rafraîchir son prompt
        if (activeTile) {
            const moduleKey = activeTile.dataset.module;
            const module = h5pModules[moduleKey] || moodleModules[moduleKey];

            if (module) {
                let promptId;
                // Les modules H5P et le nouveau module Millionnaire ont un promptId
                if (module.promptId) {
                    promptId = module.promptId;
                } 
                // Cas des anciens modules Moodle
                else if (moduleKey === 'moodleXml') {
                    promptId = 'moodleXmlResultat';
                } else if (moduleKey === 'gift') {
                    promptId = 'giftResultat';
                }

                if (promptId) {
                    const promptTextarea = document.getElementById(promptId);
                    const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
                    if (promptTextarea && generatedPrompt) {
                        promptTextarea.value = generatedPrompt;
                    }
                }
            }
        }

        // showNotification(translations.prompts_generated_successfully);
    }

// =======================================================================
// 5.2. Définition des prompts spécifiques à chaque module
// =======================================================================
    function getPrompts(arg1, arg2, arg3, arg4, arg5, isAdvanced) {
        let contextPrompt;
        let matiere, niveau, theme, nombreQuestions, infosComplementaires;
        // Accéder aux traductions des prompts via l'objet translations
        const pt = translations;

        if (isAdvanced) {
            matiere = arg1;
            niveau = arg2;
            theme = arg3;
            nombreQuestions = arg4;
            infosComplementaires = arg5;
            contextPrompt = `
${pt.prompt_expert_intro}${matiere}.

 ${pt.prompt_context_title}
 ${pt.prompt_subject} ${matiere}
 ${pt.prompt_student_level} ${niveau}
 ${pt.prompt_theme} ${theme}
 ${pt.prompt_number_of_elements} ${nombreQuestions}
${infosComplementaires ? `${pt.prompt_additional_info} ${infosComplementaires}` : ''}
            `;
        } else {
            const qui = arg1;
            const quoi = arg2;
            contextPrompt = `
${pt.prompt_simple_intro_part1}${qui}${pt.prompt_simple_intro_part2}${quoi}.`;
            // Pour le mode simple, on peut déduire un nombre par défaut si nécessaire
            nombreQuestions = 10;
        }

        const ocrOutput = document.getElementById('ocr-output');

        if (ocrOutput && ocrOutput.innerText.trim()) {
            const ocrText = ocrOutput.innerText.trim();
            const ragInstruction = pt.rag_instruction || "\n\nTu devras uniquement pour générer le contenu consulter les infos suivantes :";
            contextPrompt = `${ragInstruction}\n"${ocrText}"${contextPrompt}`;
        }

const languageInstruction = `\n\n${pt.prompt_language_instruction}\n\n${pt.prompt_code_block_instruction}`;

const timelinePrompt = `${pt.timeline_prompt_role}
${contextPrompt}

${pt.timeline_prompt_mission}
${pt.timeline_prompt_generate_json}

${pt.timeline_prompt_json_structure_title}
${pt.timeline_prompt_json_structure_main_object}
- ${pt.timeline_prompt_headline}
- ${pt.timeline_prompt_text}
- ${pt.timeline_prompt_asset}
- ${pt.timeline_prompt_date_array.replace('${nombreQuestions}', nombreQuestions)}
- ${pt.timeline_prompt_era_array}

${pt.timeline_prompt_content_rules_title}
${pt.timeline_prompt_rule1}
${pt.timeline_prompt_rule1_startDate}
${pt.timeline_prompt_rule1_headline}
${pt.timeline_prompt_rule1_text}
${pt.timeline_prompt_rule1_asset}
${pt.timeline_prompt_rule1_tag}
${pt.timeline_prompt_rule2}
${pt.timeline_prompt_rule3}

${pt.timeline_prompt_example_json_title}
${pt.timeline_prompt_example}

${pt.timeline_prompt_generate_only_json}${languageInstruction}`;

const crosswordPrompt = `${pt.crossword_prompt_role}
${contextPrompt}

${pt.crossword_prompt_mission}
${pt.crossword_prompt_generate_json}

${pt.crossword_prompt_json_structure_title}
${pt.crossword_prompt_json_structure_main_object}
- ${pt.crossword_prompt_title}
- ${pt.crossword_prompt_words_array.replace('${nombreQuestions}', nombreQuestions)}
- ${pt.crossword_prompt_answer}
- ${pt.crossword_prompt_clue}
- ${pt.crossword_prompt_extra_clue_optional}
- ${pt.crossword_prompt_task_description}
- ${pt.crossword_prompt_overall_feedback}

${pt.crossword_prompt_content_rules_title}
${pt.crossword_prompt_rule1}
${pt.crossword_prompt_rule2}
${pt.crossword_prompt_rule3}

${pt.crossword_prompt_example_json_title}
${pt.crossword_prompt_example}

${pt.crossword_prompt_generate_only_json}${languageInstruction}`;

const essayPrompt = `${pt.essay_prompt_role}
${contextPrompt}

${pt.essay_prompt_mission}
${pt.essay_prompt_generate_json}

${pt.essay_prompt_json_structure_title}
${pt.essay_prompt_json_structure_main_object}
- ${pt.essay_prompt_task_description}
- ${pt.essay_prompt_keywords_array.replace('${nombreQuestions}', nombreQuestions)}
- ${pt.essay_prompt_overall_feedback}

${pt.essay_prompt_content_rules_title}
${pt.essay_prompt_rule1}
${pt.essay_prompt_rule2}
${pt.essay_prompt_rule3}
${pt.essay_prompt_rule4}

${pt.essay_prompt_example_json_title}
${pt.essay_prompt_example}

${pt.essay_prompt_generate_only_json}${languageInstruction}`;

const moodleXmlPrompt = `${pt.moodle_xml_prompt_role}
${contextPrompt}
${pt.moodle_xml_prompt_intro.replace('${nombreQuestions}', nombreQuestions)}
${pt.moodle_xml_prompt_content_title}

${pt.moodle_xml_prompt_content_rule1}
${pt.moodle_xml_prompt_content_rule2}
${pt.moodle_xml_prompt_content_rule3}
${pt.moodle_xml_prompt_content_rule4}

${pt.moodle_xml_prompt_question_types_intro}
${pt.moodle_xml_prompt_question_type_multichoice}
${pt.moodle_xml_prompt_question_type_matching}
${pt.moodle_xml_prompt_question_type_numerical}
${pt.moodle_xml_prompt_question_type_truefalse}
${pt.moodle_xml_prompt_question_type_shortanswer}
${pt.moodle_xml_prompt_question_type_cloze}

${pt.moodle_xml_prompt_form_title}
${pt.moodle_xml_prompt_form_rule1}

${pt.moodle_xml_prompt_generate_only_json}${languageInstruction}`;

const giftPrompt = `${pt.gift_prompt_role}
${contextPrompt}
${pt.gift_prompt_intro.replace('${nombreQuestions}', nombreQuestions)}

${pt.gift_prompt_format_info}

${pt.gift_prompt_question_quality}

${pt.gift_prompt_code_format_intro}

${pt.gift_prompt_example_question_comment}

${pt.gift_prompt_example_question_text}

${pt.gift_prompt_example_answer_correct}

${pt.gift_prompt_example_answer_incorrect1}

${pt.gift_prompt_example_answer_incorrect2}

${pt.gift_prompt_example_answer_incorrect3}

${pt.gift_prompt_example_end_bracket}

${pt.gift_prompt_question_types_intro}
${pt.gift_prompt_question_type_multichoice}
${pt.gift_prompt_question_type_truefalse}
${pt.gift_prompt_question_type_numerical}
${pt.gift_prompt_question_type_matching}

${pt.gift_prompt_generate_only_gift}${languageInstruction}`;
        
const flashcardsPrompt = `${pt.flashcards_prompt_role}
${contextPrompt}

${pt.flashcards_prompt_mission}
${pt.flashcards_prompt_generate_json}

${pt.flashcards_prompt_json_structure_title}
${pt.flashcards_prompt_json_structure_main_object}
- ${pt.flashcards_prompt_title}
- ${pt.flashcards_prompt_description}
- ${pt.flashcards_prompt_association_principle}
- ${pt.flashcards_prompt_cards_array.replace('${nombreQuestions}', nombreQuestions)}
- ${pt.flashcards_prompt_text}
- ${pt.flashcards_prompt_answer}
- ${pt.flashcards_prompt_tip}
- ${pt.flashcards_prompt_tip_formatting}

${pt.flashcards_prompt_example_json_title}
${pt.flashcards_prompt_example}

${pt.flashcards_prompt_generate_only_json}${languageInstruction}`;

const quizSetPrompt = `${pt.quiz_set_prompt_role}
${contextPrompt}

${pt.quiz_set_prompt_mission}
${pt.quiz_set_prompt_generate_json}

${pt.quiz_set_prompt_json_structure_title}
${pt.quiz_set_prompt_json_structure_main_object}
- ${pt.quiz_set_prompt_progress_type}
- ${pt.quiz_set_prompt_pass_percentage}
- ${pt.quiz_set_prompt_questions_array.replace('${nombreQuestions}', nombreQuestions)}

${pt.quiz_set_prompt_content_rules_title}
${pt.quiz_set_prompt_rule1}
${pt.quiz_set_prompt_rule2}
${pt.quiz_set_prompt_rule3}
${pt.quiz_set_prompt_rule4}
${pt.quiz_set_prompt_rule5}
${pt.quiz_set_prompt_rule6}

${pt.quiz_set_prompt_example_json_title}

   **${pt.quiz_set_example_true_false}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_true_false_example), null, 2)}
   \`\`\`
 
   **${pt.quiz_set_example_multiple_choice}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_multiple_choice_example), null, 2)}
   \`\`\`
 
   **${pt.quiz_set_example_fill_in_the_blanks}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_fill_in_the_blanks_example), null, 2)}
   \`\`\`
 
   **${pt.quiz_set_example_drag_the_words}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_drag_the_words_example), null, 2)}
   \`\`\`
 
   **${pt.quiz_set_example_mark_the_words}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_mark_the_words_example), null, 2)}
   \`\`\`
 
   **${pt.quiz_set_example_essay}**
   \`\`\`json
 ${JSON.stringify(JSON.parse(pt.quiz_set_essay_example), null, 2)}
   \`\`\`

   ${pt.quiz_set_prompt_generate_only_json}${languageInstruction}`;

const glossaryPrompt = `${pt.glossary_prompt_role}
${contextPrompt}

${pt.glossary_prompt_mission}
${pt.glossary_prompt_generate_json}

${pt.glossary_prompt_json_structure_title}
${pt.glossary_prompt_json_structure_main_object.replace('${nombreQuestions}', nombreQuestions)}
- ${pt.glossary_prompt_title}
- ${pt.glossary_prompt_content}

${pt.glossary_prompt_content_rules_title}
${pt.glossary_prompt_rule1}

${pt.glossary_prompt_example_json_title}
${pt.glossary_prompt_example}

${pt.glossary_prompt_generate_only_json}${languageInstruction}`;

const summaryPrompt = `${pt.summary_prompt_role}
${contextPrompt}

${pt.summary_prompt_mission}
${pt.summary_prompt_generate_json}

${pt.summary_prompt_json_structure_title}
${pt.summary_prompt_json_structure_main_object}
- ${pt.summary_prompt_intro_field}
- ${pt.summary_prompt_summaries_array.replace('${nombreQuestions}', nombreQuestions)}
${pt.summary_prompt_summary_object}
- ${pt.summary_prompt_summary_array}
- ${pt.summary_prompt_tip_field}
- ${pt.summary_prompt_overall_feedback}

${pt.summary_prompt_content_rules_title}
${pt.summary_prompt_rule1}
${pt.summary_prompt_rule2}
${pt.summary_prompt_rule3}

${pt.summary_prompt_example_json_title}
${pt.summary_prompt_example}

${pt.summary_prompt_generate_only_json}${languageInstruction}`;

const dragWordPrompt = `${pt.drag_word_prompt_role}
${contextPrompt}

${pt.drag_word_prompt_mission}
${pt.drag_word_prompt_generate_json}

${pt.drag_word_prompt_json_structure_title}
${pt.drag_word_prompt_json_structure_main_object}
- ${pt.drag_word_prompt_task_description}
- ${pt.drag_word_prompt_text_field}
- ${pt.drag_word_prompt_overall_feedback}

${pt.drag_word_prompt_content_rules_title}
${pt.drag_word_prompt_rule1}
${pt.drag_word_prompt_rule2.replace('${nombreQuestions}', nombreQuestions)}

${pt.drag_word_prompt_example_json_title}
${pt.drag_word_prompt_example}

${pt.drag_word_prompt_generate_only_json}${languageInstruction}`;

const blanksPrompt = `${pt.blanks_prompt_role}
${contextPrompt}

${pt.blanks_prompt_mission}
${pt.blanks_prompt_generate_json}

${pt.blanks_prompt_json_structure_title}
${pt.blanks_prompt_json_structure_main_object}

${pt.blanks_prompt_content_rules_title}
- ${pt.blanks_prompt_overall_feedback}
${pt.blanks_prompt_rule1}
${pt.blanks_prompt_rule2}
${pt.blanks_prompt_rule3}

${pt.blanks_prompt_example_json_title}
${pt.blanks_prompt_example}

${pt.blanks_prompt_generate_only_json}${languageInstruction}`;

const markWordsPrompt = `${pt.mark_words_prompt_role}
${contextPrompt}

${pt.mark_words_prompt_mission}
${pt.mark_words_prompt_generate_json}

${pt.mark_words_prompt_json_structure_title}
${pt.mark_words_prompt_json_structure_main_object}
- ${pt.mark_words_prompt_task_description}
- ${pt.mark_words_prompt_text_field}
- ${pt.mark_words_prompt_overall_feedback}

${pt.mark_words_prompt_content_rules_title}
${pt.mark_words_prompt_rule1}
${pt.mark_words_prompt_rule2.replace('${nombreQuestions}', nombreQuestions)}
${pt.mark_words_prompt_rule3}
${pt.mark_words_prompt_rule4}

${pt.mark_words_prompt_example_json_title}
${pt.mark_words_prompt_example}

${pt.mark_words_prompt_generate_only_json}${languageInstruction}`;

const millionnairePrompt = `${pt.millionnaire_prompt_role}
${contextPrompt}
${pt.millionnaire_prompt_num_questions}

${pt.millionnaire_prompt_mission}
${pt.millionnaire_prompt_generate_json}

${pt.millionnaire_prompt_important_rules_title}
${pt.millionnaire_prompt_rule1}
${pt.millionnaire_prompt_rule2}
${pt.millionnaire_prompt_rule3}

${pt.millionnaire_prompt_json_structure_title}
${pt.millionnaire_prompt_main_object}
${pt.millionnaire_prompt_title}
${pt.millionnaire_prompt_questions_array}
${pt.millionnaire_prompt_question}
${pt.millionnaire_prompt_good_answer}
${pt.millionnaire_prompt_bad_answer}

${pt.millionnaire_prompt_example_json_title}
${pt.millionnaire_prompt_example}

${pt.millionnaire_prompt_generate_only_json}${languageInstruction}`;

const appariementPrompt = `${pt.appariement_prompt_role}
${contextPrompt}
${pt.appariement_prompt_num_questions}

${pt.appariement_prompt_mission}
${pt.appariement_prompt_generate_json}

${pt.appariement_prompt_important_rules_title}
${pt.appariement_prompt_rule1}
${pt.appariement_prompt_rule2}
${pt.appariement_prompt_rule3}

${pt.appariement_prompt_json_structure_title}
${pt.appariement_prompt_main_object}
${pt.appariement_prompt_title}
${pt.appariement_prompt_pairs_array}
${pt.appariement_prompt_question}
${pt.appariement_prompt_answer}

${pt.appariement_prompt_example_json_title}
${pt.appariement_prompt_example}

${pt.appariement_prompt_generate_only_json}${languageInstruction}`;

const qcmPrompt = `${pt.qcm_prompt_role}
${contextPrompt}
${pt.qcm_prompt_num_questions}

${pt.qcm_prompt_mission}
${pt.qcm_prompt_generate_json}

${pt.qcm_prompt_important_rules_title}
${pt.qcm_prompt_rule1}
${pt.qcm_prompt_rule2}
${pt.qcm_prompt_rule3}

${pt.qcm_prompt_json_structure_title}
${pt.qcm_prompt_main_object}
${pt.qcm_prompt_title}
${pt.qcm_prompt_questions_array}
${pt.qcm_prompt_question_text}
${pt.qcm_prompt_answers_array}
${pt.qcm_prompt_answer_text}
${pt.qcm_prompt_answer_iscorrect}

${pt.qcm_prompt_example_json_title}
${pt.qcm_prompt_example}

${pt.qcm_prompt_generate_only_json}${languageInstruction}`;
 
const trueFalsePrompt = `${pt.true_false_prompt_role}
${contextPrompt}

${pt.true_false_prompt_mission}
${pt.true_false_prompt_generate_json}

${pt.true_false_prompt_json_structure_title}
${pt.true_false_prompt_json_structure_main_object}
- ${pt.true_false_prompt_question}
- ${pt.true_false_prompt_correct}
- ${pt.true_false_prompt_feedback_correct}
- ${pt.true_false_prompt_feedback_wrong}

${pt.true_false_prompt_content_rules_title}
${pt.true_false_prompt_rule1}
${pt.true_false_prompt_rule2}

${pt.true_false_prompt_example_json_title}
${pt.true_false_prompt_example}

${pt.true_false_prompt_generate_only_json}${languageInstruction}`;

const multipleChoicePrompt = `${pt.multiple_choice_prompt_role}
${contextPrompt}

${pt.multiple_choice_prompt_mission}
${pt.multiple_choice_prompt_generate_json}

${pt.multiple_choice_prompt_json_structure_title}
${pt.multiple_choice_prompt_json_structure_main_object}
- ${pt.multiple_choice_prompt_question}
- ${pt.multiple_choice_prompt_answers_array}
- ${pt.multiple_choice_prompt_text}
- ${pt.multiple_choice_prompt_correct}
- ${pt.multiple_choice_prompt_overall_feedback}

${pt.multiple_choice_prompt_content_rules_title}
${pt.multiple_choice_prompt_rule1}
${pt.multiple_choice_prompt_rule2}

${pt.multiple_choice_prompt_example_json_title}
${pt.multiple_choice_prompt_example}

${pt.multiple_choice_prompt_generate_only_json}${languageInstruction}`;

const findTheWordsPrompt = `${pt.find_the_words_prompt_role}
${contextPrompt}

${pt.find_the_words_prompt_mission}
${pt.find_the_words_prompt_generate_json}

${pt.find_the_words_prompt_json_structure_title}
${pt.find_the_words_prompt_json_structure_main_object}
- ${pt.find_the_words_prompt_task_description}
- ${pt.find_the_words_prompt_word_list}

${pt.find_the_words_prompt_content_rules_title}
${pt.find_the_words_prompt_rule1}

${pt.find_the_words_prompt_example_json_title}
${pt.find_the_words_prompt_example}

${pt.find_the_words_prompt_generate_only_json}${languageInstruction}`;

const sortParagraphsPrompt = `${pt.sort_the_paragraphs_prompt_role}
${contextPrompt}

${pt.sort_the_paragraphs_prompt_mission}
${pt.sort_the_paragraphs_prompt_generate_json}

${pt.sort_the_paragraphs_prompt_json_structure_title}
${pt.sort_the_paragraphs_prompt_json_structure_main_object}
- ${pt.sort_the_paragraphs_prompt_task_description}
- ${pt.sort_the_paragraphs_prompt_paragraphs_array}
- ${pt.sort_the_paragraphs_prompt_overall_feedback}

${pt.sort_the_paragraphs_prompt_content_rules_title}
${pt.sort_the_paragraphs_prompt_rule1}
${pt.sort_the_paragraphs_prompt_rule2}

${pt.sort_the_paragraphs_prompt_example_json_title}
${pt.sort_the_paragraphs_prompt_example}

${pt.sort_the_paragraphs_prompt_generate_only_json}${languageInstruction}`;

const singleChoiceSetPrompt = `${pt.single_choice_set_prompt_role}
${contextPrompt}

${pt.single_choice_set_prompt_mission}
${pt.single_choice_set_prompt_generate_json}

${pt.single_choice_set_prompt_json_structure_title}
${pt.single_choice_set_prompt_json_structure_main_object}
- ${pt.single_choice_set_prompt_choices_array}
- ${pt.single_choice_set_prompt_question}
- ${pt.single_choice_set_prompt_answers_array}
- ${pt.single_choice_set_prompt_overall_feedback}

${pt.single_choice_set_prompt_content_rules_title}
${pt.single_choice_set_prompt_rule1}

${pt.single_choice_set_prompt_example_json_title}
${pt.single_choice_set_prompt_example}

${pt.single_choice_set_prompt_generate_only_json}${languageInstruction}`;

const dialogCardsPrompt = `${pt.dialog_cards_prompt_role}
${contextPrompt}

${pt.dialog_cards_prompt_mission}
${pt.dialog_cards_prompt_generate_json}

${pt.dialog_cards_prompt_json_structure_title}
${pt.dialog_cards_prompt_json_structure_main_object}
- ${pt.dialog_cards_prompt_title}
- ${pt.dialog_cards_prompt_description}
- ${pt.dialog_cards_prompt_dialogs_array}
- ${pt.dialog_cards_prompt_text}
- ${pt.dialog_cards_prompt_answer}
- ${pt.dialog_cards_prompt_tips}

${pt.dialog_cards_prompt_content_rules_title}
${pt.dialog_cards_prompt_rule1}

${pt.dialog_cards_prompt_example_json_title}
${pt.dialog_cards_prompt_example}

${pt.dialog_cards_prompt_generate_only_json}${languageInstruction}`;
       
const complexBlanksPrompt = `${pt.complex_blanks_prompt_role}
${contextPrompt}

${pt.complex_blanks_prompt_mission}
${pt.complex_blanks_prompt_generate_json}

${pt.complex_blanks_prompt_json_structure_title}
${pt.complex_blanks_prompt_json_structure_main_object}
- ${pt.complex_blanks_prompt_task}
- ${pt.complex_blanks_prompt_blanks_text}
- ${pt.complex_blanks_prompt_blanks_list}
- ${pt.complex_blanks_prompt_correct_answer}
- ${pt.complex_blanks_prompt_incorrect_answers_list}
- ${pt.complex_blanks_prompt_incorrect_answer_text}
- ${pt.complex_blanks_prompt_incorrect_answer_feedback}
- ${pt.complex_blanks_prompt_overall_feedback}

${pt.complex_blanks_prompt_content_rules_title}
${pt.complex_blanks_prompt_rule1}
${pt.complex_blanks_prompt_rule2}
${pt.complex_blanks_prompt_rule3}

${pt.complex_blanks_prompt_example_json_title}
${pt.complex_blanks_prompt_example}

${pt.complex_blanks_prompt_generate_only_json}${languageInstruction}`;

const chartPrompt = `${pt.chart_prompt_role}
${contextPrompt}

${pt.chart_prompt_mission}
${pt.chart_prompt_generate_json}

${pt.chart_prompt_json_structure_title}
${pt.chart_prompt_json_structure_main_object}
- ${pt.chart_prompt_graph_mode}
- ${pt.chart_prompt_list_of_types}
- ${pt.chart_prompt_value}
- ${pt.chart_prompt_color}
- ${pt.chart_prompt_font_color}
- ${pt.chart_prompt_text}
- ${pt.chart_prompt_figure_definition}

${pt.chart_prompt_content_rules_title}
${pt.chart_prompt_rule1}
${pt.chart_prompt_rule2}

${pt.chart_prompt_example_json_title}
${pt.chart_prompt_example}

${pt.chart_prompt_generate_only_json}${languageInstruction}`;

const glossaireXmlPrompt = `${pt.glossaire_xml_prompt_role}
${contextPrompt}

${pt.glossaire_xml_prompt_mission}
${pt.glossaire_xml_prompt_structure_title}
${pt.glossaire_xml_prompt_structure_rules}

${pt.glossaire_xml_prompt_example_title}
${pt.glossaire_xml_prompt_example}

${pt.glossaire_xml_prompt_generate_only_xml}${languageInstruction}`;

const pagePrompt = `${pt.page_prompt_role}
${contextPrompt}

${pt.page_prompt_mission}
${pt.page_prompt_generate_json}

${pt.page_prompt_json_structure_title}
${pt.page_prompt_json_structure_main_object}

${pt.page_prompt_blocks_list_title}
${pt.page_prompt_block_01}
${pt.page_prompt_block_02}
${pt.page_prompt_block_03}
${pt.page_prompt_block_04}
${pt.page_prompt_block_05}
${pt.page_prompt_block_06}
${pt.page_prompt_block_07}
${pt.page_prompt_block_08}
${pt.page_prompt_block_09}
${pt.page_prompt_block_10}
${pt.page_prompt_block_11}
${pt.page_prompt_block_12}
${pt.page_prompt_block_13}
${pt.page_prompt_block_14}
${pt.page_prompt_block_15}
${pt.page_prompt_block_17}
${pt.page_prompt_block_18}
${pt.page_prompt_block_19}

${pt.page_prompt_content_rules_title}
${pt.page_prompt_rule1}
${pt.page_prompt_rule2}
${pt.page_prompt_rule3}

${pt.page_prompt_example_json_title}
${pt.page_prompt_example_json}

${pt.page_prompt_generate_only_json}${languageInstruction}`;

        return {
            timelineResultat: timelinePrompt,
             crosswordResultat: crosswordPrompt,
            essayResultat: essayPrompt,
            moodleXmlResultat: moodleXmlPrompt,
            glossaireXmlResultat: glossaireXmlPrompt,
            giftResultat: giftPrompt,
            flashcardsResultat: flashcardsPrompt,
            quizSetResultat: quizSetPrompt,
            glossaryResultat: glossaryPrompt,
            summaryResultat: summaryPrompt,
            dragWordResultat: dragWordPrompt,
            blanksResultat: blanksPrompt,
            markWordsResultat: markWordsPrompt,
            millionnaireResultat: millionnairePrompt,
            appariementResultat: appariementPrompt,
            qcmResultat: qcmPrompt,
            trueFalseResultat: trueFalsePrompt,
            multipleChoiceResultat: multipleChoicePrompt,
            findTheWordsResultat: findTheWordsPrompt,
            sortParagraphsResultat: sortParagraphsPrompt,
            singleChoiceSetResultat: singleChoiceSetPrompt,
            dialogCardsResultat: dialogCardsPrompt,
            complexBlanksResultat: complexBlanksPrompt,
            chartResultat: chartPrompt,
            pageResultat: pagePrompt
        };
    }