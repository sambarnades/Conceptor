/**
 * @file Gestion de la création des activités H5P.
 * Ce module prend en charge la transformation du JSON généré par l'IA en une structure H5P valide,
 * l'enrichissement avec les traductions et les paramètres par défaut, et le packaging
 * de l'ensemble dans un fichier .h5p téléchargeable.
 */

import { h5pModules } from './definitions.js';
import { translations, currentLang } from './translation.js';
import { showNotification, generateUUID, formatTextToHtml } from './utils.js';

let downloadZip;

/**
 * Point d'entrée pour la création d'un fichier H5P.
 * Adapte le JSON en fonction du type de module, puis appelle la fonction de packaging.
 * @param {string} moduleKey - La clé identifiant le module H5P (ex: 'Timeline').
 * @param {string} jsonInput - La chaîne JSON brute générée par l'IA.
 * @param {boolean} [includeLibs=false] - Si vrai, inclut les bibliothèques H5P dans le package.
 */
export function handleH5PCreation(moduleKey, jsonInput, includeLibs = false) {
    const module = h5pModules[moduleKey];
    if (!module) {
        showNotification(translations.error_h5p_module_not_found.replace('{moduleKey}', moduleKey) || `Module '${moduleKey}' non trouvé.`, 'error');
        return;
    }

   if (moduleKey === 'QuizSet') {
       try {
           const contentData = JSON.parse(jsonInput);
           const title = document.getElementById('theme').value.trim() || translations[module.name];

           // Remplacer les placeholders UUID et collecter les bibliothèques
           const libraries = new Set();
           contentData.questions.forEach(q => {
               q.subContentId = generateUUID();
               // Extrait le nom de la bibliothèque (ex: "H5P.MultiChoice")
               const libName = q.library.split(' ')[0];
               libraries.add(libName);
           });

           // Créer le H5P avec les dépendances dynamiques
           createH5PWithDynamicDependencies(title, contentData, Array.from(libraries));

       } catch (error) {
           showNotification(translations.error_invalid_quiz_json.replace('{errorMessage}', error.message) || `Le JSON pour le Quiz est invalide : ${error.message}`, 'error');
           console.error("Erreur JSON pour QuizSet:", error);
       }
       return;
   }


   // Utilise le machineName s'il est défini, sinon construit le nom (fallback)
   const machineName = module.machineName || `H5P.${moduleKey}`;

   try {
       const jsonObj = JSON.parse(jsonInput);
       let content = jsonObj;
       let options = { title: jsonObj.title || translations[module.name] };

        // Adaptations spécifiques par module
        if (moduleKey === 'Timeline') {
           // Si la structure "timeline" n'existe pas, on l'enveloppe
           const timelineData = jsonObj.timeline ? jsonObj : { timeline: jsonObj };

               // Ajout des champs manquants avec des valeurs par défaut
               timelineData.timeline.defaultZoomLevel = timelineData.timeline.defaultZoomLevel || "0";
               const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
               timelineData.timeline.language = timelineData.timeline.language || h5pLang;
               timelineData.timeline.height = timelineData.timeline.height || 600;

               // Formater le texte principal
               if (timelineData.timeline.text) {
                   timelineData.timeline.text = formatTextToHtml(timelineData.timeline.text);
               }

               // Formater le texte dans chaque "date"
               if (timelineData.timeline && timelineData.timeline.date && Array.isArray(timelineData.timeline.date)) {
                   timelineData.timeline.date.forEach(d => {
                       if (d.text) {
                           d.text = formatTextToHtml(d.text);
                       }
                       if (!d.asset) {
                           d.asset = {};
                       }
                   });
               }

               // Formater le texte dans chaque "era"
               if (timelineData.timeline && timelineData.timeline.era && Array.isArray(timelineData.timeline.era)) {
                   timelineData.timeline.era.forEach(e => {
                       if (e.text && !e.text.trim().startsWith('<div>')) {
                           e.text = `<div>${e.text.trim()}</div>`;
                       }
                   });
               }

               content = timelineData;
            } else if (moduleKey === 'Flashcards') {
                const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
                const defaultFlashcardsContent = {
                    title: jsonObj.title || translations.h5p_flashcards_name,
                    description: jsonObj.description || translations.h5p_flashcards_description,
                    cards: jsonObj.cards ? jsonObj.cards.map(card => ({ text: card.text, answer: card.answer, tip: formatTextToHtml(card.tip || "") })) : [],
                    progressText: translations.flashcards_progress_text || "Card @card of @total",
                    next: translations.flashcards_next || "Next",
                    previous: translations.flashcards_previous || "Previous",
                    checkAnswerText: translations.flashcards_check_answer || "Check",
                    showSolutionsRequiresInput: true,
                    defaultAnswerText: translations.flashcards_your_answer || "Your answer",
                    correctAnswerText: translations.flashcards_correct_answer || "Correct",
                    incorrectAnswerText: translations.flashcards_incorrect_answer || "Incorrect",
                    showSolutionText: translations.flashcards_show_solution || "Correct answer",
                    results: translations.flashcards_results || "Results",
                    ofCorrect: translations.flashcards_of_correct || "@score of @total correct",
                    showResults: translations.flashcards_show_results || "Show results",
                    answerShortText: translations.flashcards_answer_short || "A:",
                    retry: translations.flashcards_retry || "Retry",
                    caseSensitive: false,
                    cardAnnouncement: translations.flashcards_card_announcement || "Incorrect answer. Correct answer was @answer",
                    correctAnswerAnnouncement: translations.flashcards_correct_announcement || "@answer is correct.",
                    pageAnnouncement: translations.flashcards_page_announcement || "Page @current of @total",
                    randomCards: false,
                    language: h5pLang
                };
                content = defaultFlashcardsContent;
                options.description = content.description;
            } else if (moduleKey === 'FillInTheBlanks' && jsonObj.textBlocks) {
                // Rétrocompatibilité pour l'ancien format de prompt
                content = { questions: jsonObj.textBlocks };
                if (jsonObj.taskDescription) {
                    options.title = jsonObj.taskDescription;
                }
            } else if (moduleKey === 'MarkTheWords') {
                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        enableCheckButton: true,
                        showScorePoints: true
                    },
                    overallFeedback: []
                };
            } else if (moduleKey === 'Glossary') {
                // Détecter si c'est le nouveau format simplifié (un tableau) ou l'ancien (un objet avec "panels")
                const panelsData = Array.isArray(jsonObj) ? jsonObj : jsonObj.panels;

                const transformedPanels = panelsData.map(item => {
                    // Si l'item a déjà la structure complète, on ne fait que générer l'UUID
                    if (item.content && item.content.params) {
                        item.content.subContentId = generateUUID();
                        return item;
                    }
                    // Sinon, on transforme la structure simple en structure complète
                    return {
                        title: item.title,
                        content: {
                            params: {
                                text: formatTextToHtml(item.text)
                            },
                            library: "H5P.AdvancedText 1.1",
                            subContentId: generateUUID(),
                            metadata: {
                                contentType: "Text",
                                license: "U",
                                title: item.title // On utilise le titre du panneau comme titre de métadonnée
                            }
                        }
                    };
                });

                content = {
                    panels: transformedPanels,
                    hTag: "h2"
                };
            } else if (moduleKey === 'Crossword') {
                content = {
                    ...jsonObj, // Conserve title, words, taskDescription, and overallFeedback
                    taskDescription: formatTextToHtml(jsonObj.taskDescription),
                    behaviour: {
                        enableInstantFeedback: false,
                        scoreWords: true,
                        applyPenalties: false,
                        enableRetry: true,
                        enableSolutionsButton: true
                    },
                    l10n: {
                        across: translations.crossword_across || "Across",
                        down: translations.crossword_down || "Down",
                        checkAnswer: translations.crossword_check_answer || "Check",
                        tryAgain: translations.crossword_try_again || "Retry",
                        showSolution: translations.crossword_show_solution || "Show solution",
                        extraClue: translations.crossword_extra_clue || "Extra clue",
                        closeWindow: translations.crossword_close_window || "Close window",
                        submitAnswer: translations.crossword_submit_answer || "Submit"
                    },
                    // Traiter les extraClues pour ajouter les métadonnées nécessaires
                    words: jsonObj.words.map(word => {
                        if (word.extraClue && word.extraClue.params && word.extraClue.params.text) {
                            // Appliquer le formatage sur le texte de l'indice
                            word.extraClue.params.text = formatTextToHtml(word.extraClue.params.text);
                            
                            return {
                                ...word,
                                extraClue: {
                                    ...word.extraClue,
                                    library: "H5P.AdvancedText 1.1",
                                    subContentId: generateUUID(),
                                    metadata: {
                                        contentType: "Text",
                                        license: "U",
                                        title: "Extra clue"
                                    }
                                }
                            };
                        }
                        return word;
                    })
                };
            } else if (moduleKey === 'Essay') {
               content = {
                   ...jsonObj, // Conserve taskDescription et keywords
                   taskDescription: formatTextToHtml(jsonObj.taskDescription),
                   behaviour: {
                        inputFieldSize: "10",
                        enableRetry: true,
                        ignoreScoring: false,
                        minimumLength: 100,
                        maximumLength: 0, // 0 = illimité
                        percentagePassing: 50,
                        percentageMastering: 80,
                        pointsHost: 1
                    },
                    overallFeedback: [
                        { from: 0, to: 10, feedback: translations.essay_overall_feedback_0_10 },
                        { from: 11, to: 30, feedback: translations.essay_overall_feedback_11_30 },
                        { from: 31, to: 50, feedback: translations.essay_overall_feedback_31_50 },
                        { from: 51, to: 70, feedback: translations.essay_overall_feedback_51_70 },
                        { from: 71, to: 90, feedback: translations.essay_overall_feedback_71_90 },
                        { from: 91, to: 100, feedback: translations.essay_overall_feedback_91_100 }
                    ],
                    checkAnswer: translations.essay_checkAnswer || "Check",
                    tryAgain: translations.essay_tryAgain || "Retry",
                    showSolution: translations.essay_showSolution || "Show solution",
                    feedbackHeader: translations.essay_feedbackHeader || "Feedback",
                    solutionTitle: translations.essay_solutionTitle || "Sample solution",
                    remainingChars: translations.remainingChars || "Remaining characters: @chars",
                    notEnoughChars: translations.notEnoughChars || "You must enter at least @chars characters!",
                    messageSave: translations.messageSave || "saved",
                    placeholderText: translations.placeholderText || "In a hole in the ground there lived a hobbit ...",
                    solution: {
                        introduction: "",
                        sample: ""
                    },
                    media: {},
                    ariaYourResult: translations.ariaYourResult || "You got @score out of @total points",
                    ariaNavigatedToSolution: translations.ariaNavigatedToSolution || "Navigated to newly included sample solution after textarea."
                };
            } else if (moduleKey === 'Summary') {
                content = {
                    intro: jsonObj.intro || translations.summary_intro,
                    summaries: jsonObj.summaries.map(s => ({
                        ...s,
                        subContentId: generateUUID(),
                        tip: s.tip || ""
                    })),
                    solvedLabel: translations.summary_solved_label,
                    scoreLabel: translations.summary_score_label,
                    resultLabel: translations.summary_result_label,
                    overallFeedback: jsonObj.overallFeedback || [{
                        from: 0,
                        to: 100,
                        feedback: translations.summary_feedback
                    }],
                    labelCorrect: translations.summary_label_correct,
                    labelIncorrect: translations.summary_label_incorrect,
                    labelCorrectAnswers: translations.summary_label_correct_answers,
                    tipButtonLabel: translations.summary_tip_button_label,
                    scoreBarLabel: translations.summary_score_bar_label,
                    progressText: translations.summary_progress_text,
                    alternativeIncorrectLabel: translations.summary_alternative_incorrect_label
                };
            } else if (moduleKey === 'DragTheWords') {
                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    checkAnswer: translations.drag_words_check_answer || "Check",
                    tryAgain: translations.drag_words_try_again || "Retry",
                    showSolution: translations.drag_words_show_solution || "Show Solution",
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        instantFeedback: false,
                        enableCheckButton: true
                    },
                    overallFeedback: jsonObj.overallFeedback || [{
                        from: 0,
                        to: 100,
                        feedback: translations.drag_words_score_feedback || "Score: @score of @total."
                    }],
                    dropZoneIndex: "Drop Zone @index.",
                    empty: "Drop Zone @index is empty.",
                    contains: "Drop Zone @index contains draggable @draggable.",
                    tipLabel: translations.drag_words_tip_label || "Show tip",
                    correctText: translations.drag_words_correct_text || "Correct!",
                    incorrectText: translations.drag_words_incorrect_text || "Incorrect!",
                    resetDropTitle: "Reset drop",
                    resetDropDescription: "Are you sure you want to reset this drop zone?",
                    grabbed: "Draggable is grabbed.",
                    cancelledDragging: "Cancelled dragging.",
                    correctAnswer: "Correct answer:",
                    feedbackHeader: "Feedback",
                    scoreBarLabel: translations.drag_words_score_bar_label || "You got :num out of :total points",
                    media: {
                        disableImageZooming: false
                    },
                    submitAnswer: translations.drag_words_submit_answer || "Submit",
                    ariaDraggableIndex: "@index of @count draggables.",
                    a11yCheck: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: "Retry the task. Reset all responses and start the task over again."
                };
            } else if (moduleKey === 'FillInTheBlanks') {
                content = {
                    ...jsonObj, // Conserve les questions et le overallFeedback
                    showSolutions: translations.blanks_show_solutions || "Show solutions",
                    tryAgain: translations.blanks_try_again || "Try again",
                    checkAnswer: translations.blanks_check_answer || "Check",
                    notFilledOut: translations.blanks_not_filled_out || "Please fill in all blanks",
                    answerIsCorrect: translations.blanks_answer_is_correct || "'':ans' is correct",
                    answerIsWrong: translations.blanks_answer_is_wrong || "'':ans' is wrong",
                    answeredCorrectly: translations.blanks_answered_correctly || "Answered correctly",
                    answeredIncorrectly: translations.blanks_answered_incorrectly || "Answered incorrectly",
                    solutionLabel: translations.blanks_solution_label || "Correct answer:",
                    inputLabel: translations.blanks_input_label || "Blank input @num of @total",
                    inputHasTipLabel: translations.blanks_input_has_tip_label || "Tip available",
                    tipLabel: translations.blanks_tip_label || "Tip",
                    scoreBarLabel: translations.blanks_score_bar_label || "You got :num out of :total points",
                    submitAnswer: translations.blanks_submit_answer || "Submit",
                    behaviour: {
                        enableSolutionsButton: true,
                        autoCheck: true,
                        caseSensitive: false,
                        showSolutionsRequiresInput: true,
                        separateLines: false,
                        enableRetry: true,
                        confirmCheckDialog: false,
                        confirmRetryDialog: false,
                        acceptSpellingErrors: false,
                        enableCheckButton: true
                    },
                    confirmCheck: {
                        header: translations.blanks_finish_header || "Finish ?",
                        body: translations.blanks_finish_body || "Are you sure you wish to finish ?",
                        cancelLabel: translations.blanks_cancel_label || "Cancel",
                        confirmLabel: translations.blanks_finish_label || "Finish"
                    },
                    confirmRetry: {
                        header: translations.blanks_retry_header || "Retry ?",
                        body: translations.blanks_retry_body || "Are you sure you wish to retry ?",
                        cancelLabel: translations.blanks_cancel_label || "Cancel",
                        confirmLabel: translations.blanks_retry_confirm_label || "Confirm"
                    },
                    overallFeedback: jsonObj.overallFeedback || [{
                        from: 0,
                        to: 100,
                        feedback: translations.blanks_feedback || "You got @score of @total blanks correct."
                    }],
                    a11yCheck: translations.blanks_a11y_check || "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: translations.blanks_a11y_show_solution || "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: translations.blanks_a11y_retry || "Retry the task. Reset all responses and start the task over again.",
                    a11yCheckingModeHeader: translations.blanks_checking_mode_header || "Checking mode"
                };
           } else if (moduleKey === 'TrueFalse') {
               content = {
                   ...jsonObj,
                   question: (jsonObj.question && !jsonObj.question.startsWith('<p>')) ? `<p>${jsonObj.question}</p>` : jsonObj.question,
                   correct: String(jsonObj.correct), // Ensure it's a string
                   l10n: {
                       trueText: translations.true_false_true_text || "True",
                       falseText: translations.true_false_false_text || "False",
                       score: translations.true_false_score || "You got @score of @total points",
                       checkAnswer: translations.true_false_check_answer || "Check",
                       showSolutionButton: translations.true_false_show_solution_button || "Show solution",
                       tryAgain: translations.true_false_try_again || "Retry",
                       wrongAnswerMessage: translations.true_false_wrong_answer_message || "Wrong answer",
                       correctAnswerMessage: translations.true_false_correct_answer_message || "Correct answer",
                       scoreBarLabel: translations.true_false_score_bar_label || "You got :num out of :total points",
                       submitAnswer: translations.true_false_submit_answer || "Submit",
                       a11yCheck: translations.true_false_a11y_check || "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                       a11yShowSolution: translations.true_false_a11y_show_solution || "Show the solution. The task will be marked with its correct solution.",
                       a11yRetry: translations.true_false_a11y_retry || "Retry the task. Reset all responses and start the task over again."
                   },
                   behaviour: {
                       enableRetry: true,
                       enableSolutionsButton: true,
                       confirmCheckDialog: false,
                       confirmRetryDialog: false,
                       autoCheck: false,
                       enableCheckButton: true,
                      feedbackOnCorrect: jsonObj.feedbackOnCorrect,
                      feedbackOnWrong: jsonObj.feedbackOnWrong
                   },
                   confirmCheck: {
                       header: translations.true_false_finish_header || "Finish ?",
                       body: translations.true_false_finish_body || "Are you sure you wish to finish ?",
                       cancelLabel: translations.true_false_cancel_label || "Cancel",
                       confirmLabel: translations.true_false_finish_label || "Finish"
                   },
                   confirmRetry: {
                       header: translations.true_false_retry_header || "Retry ?",
                       body: translations.true_false_retry_body || "Are you sure you wish to retry ?",
                       cancelLabel: translations.true_false_cancel_label || "Cancel",
                       confirmLabel: translations.true_false_retry_confirm_label || "Confirm"
                   },
                   media: {
                       disableImageZooming: false
                   }
               };
            } else if (moduleKey === 'MultipleChoice') {
               content = {
                   ...jsonObj, // Conserve la question, les réponses et le overallFeedback
                   question: (jsonObj.question && !jsonObj.question.startsWith('<p>')) ? `<p>${jsonObj.question}</p>` : jsonObj.question,
                   answers: jsonObj.answers.map(answer => ({
                       ...answer,
                       text: (answer.text && !answer.text.startsWith('<div>')) ? `<div>${answer.text}</div>` : answer.text
                   })),
                   UI: {
                       checkAnswerButton: translations.checkAnswerButton,
                       showSolutionButton: translations.showSolutionButton,
                       tryAgainButton: translations.tryAgainButton,
                       submitAnswerButton: translations.submitAnswerButton,
                       scoreBarLabel: translations.scoreBarLabel
                   },
                   behaviour: {
                       enableRetry: true,
                       enableSolutionsButton: true,
                       type: 'auto',
                       singlePoint: false,
                       randomAnswers: true,
                       showSolutionsRequiresInput: true,
                       confirmCheckDialog: false,
                       confirmRetryDialog: false,
                       autoCheck: false,
                       passPercentage: 50,
                       showScorePoints: true
                   },
                   confirmCheck: {
                       header: translations.confirmCheckHeader,
                       body: translations.confirmCheckBody,
                       cancelLabel: translations.confirmCheckCancelLabel,
                       confirmLabel: translations.confirmCheckConfirmLabel
                   },
                   confirmRetry: {
                       header: translations.confirmRetryHeader,
                       body: translations.confirmRetryBody,
                       cancelLabel: translations.confirmRetryCancelLabel,
                       confirmLabel: translations.confirmRetryConfirmLabel
                   },
                   overallFeedback: jsonObj.overallFeedback || [
                       { from: 0, to: 100, feedback: "" }
                   ]
               };
           } else if (moduleKey === 'FindTheWords') {
               content = {
                   taskDescription: jsonObj.taskDescription,
                   wordList: jsonObj.wordList,
                   behaviour: {
                       orientations: {
                           horizontal: true,
                           horizontalBack: true,
                           vertical: true,
                           verticalUp: true,
                           diagonal: true,
                           diagonalBack: true,
                           diagonalUp: true,
                           diagonalUpBack: true
                       },
                       fillPool: translations.fillPool || "abcdefghijklmnopqrstuvwxyz",
                       preferOverlap: true,
                       showVocabulary: true,
                       enableShowSolution: true,
                       enableRetry: true
                   },
                   l10n: {
                       check: translations.check,
                       tryAgain: translations.tryAgain,
                       showSolution: translations.showSolution,
                       found: translations.found,
                       timeSpent: translations.timeSpent,
                       score: translations.score,
                       wordListHeader: translations.wordListHeader
                   }
               };
           } else if (moduleKey === 'SortParagraphs') {
               content = {
                   taskDescription: formatTextToHtml(jsonObj.taskDescription),
                   paragraphs: jsonObj.paragraphs.map(p => formatTextToHtml(p)),
                   overallFeedback: jsonObj.overallFeedback || [{"from":0,"to":100}],
                   behaviour: {
                       scoringMode: "transitions",
                       applyPenalties: true,
                       duplicatesInterchangeable: true,
                       enableRetry: true,
                       enableSolutionsButton: true,
                       addButtonsForMovement: true
                   },
                   l10n: {
                       checkAnswer: translations.checkAnswer,
                       submitAnswer: translations.submitAnswer,
                       tryAgain: translations.tryAgain,
                       showSolution: translations.showSolution,
                       up: translations.up,
                       down: translations.down,
                       disabled: translations.disabled
                   },
                   a11y: {
                       check: translations.a11y_check,
                       showSolution: translations.a11y_showSolution,
                       retry: translations.a11y_retry,
                       yourResult: translations.a11y_yourResult,
                       paragraph: translations.a11y_paragraph,
                       correct: translations.a11y_correct,
                       wrong: translations.a11y_wrong,
                       point: translations.a11y_point,
                       sevenOfNine: translations.a11y_sevenOfNine,
                       currentPosition: translations.a11y_currentPosition,
                       instructionsSelected: translations.a11y_instructionsSelected,
                       instructionsGrabbed: translations.a11y_instructionsGrabbed,
                       grabbed: translations.a11y_grabbed,
                       moved: translations.a11y_moved,
                       dropped: translations.a11y_dropped,
                       reorderCancelled: translations.a11y_reorderCancelled,
                       finalPosition: translations.a11y_finalPosition,
                       nextParagraph: translations.a11y_nextParagraph,
                       correctParagraph: translations.a11y_correctParagraph,
                       listDescription: translations.a11y_listDescription,
                       listDescriptionCheckAnswer: translations.a11y_listDescriptionCheckAnswer,
                       listDescriptionShowSolution: translations.a11y_listDescriptionShowSolution
                   }
               };
           } else if (moduleKey === 'SingleChoiceSet') {
               content = {
                   choices: jsonObj.choices.map(choice => ({
                       ...choice,
                       subContentId: generateUUID()
                   })),
                   overallFeedback: jsonObj.overallFeedback || [{"from":0,"to":100,"feedback":"You got :numcorrect of :maxscore correct"}],
                   behaviour: {
                       timeoutCorrect: 1000,
                       timeoutWrong: 1000,
                       soundEffectsEnabled: true,
                       enableRetry: true,
                       enableSolutionsButton: true,
                       passPercentage: 100,
                       autoContinue: true
                   },
                   l10n: {
                       showSolutionButtonLabel: translations.showSolutionButtonLabel,
                       retryButtonLabel: translations.retryButtonLabel,
                       solutionViewTitle: translations.solutionViewTitle,
                       correctText: translations.correctText,
                       incorrectText: translations.incorrectText,
                       muteButtonLabel: translations.muteButtonLabel,
                       closeButtonLabel: translations.closeButtonLabel,
                       slideOfTotal: translations.slideOfTotal,
                       nextButtonLabel: translations.nextButtonLabel,
                       scoreBarLabel: translations.scoreBarLabel,
                       solutionListQuestionNumber: translations.solutionListQuestionNumber,
                       a11yShowSolution: translations.a11yShowSolution,
                       a11yRetry: translations.a11yRetry,
                       shouldSelect: translations.shouldSelect,
                       shouldNotSelect: translations.shouldNotSelect
                   }
               };
           } else if (moduleKey === 'DialogCards') {
                const formatDialogText = (text) => {
                   if (!text) return '';
                   // Applique d'abord le formatage Markdown
                   let formatted = text.replace(/\*\*(.*?)\*\*/g, '<em>$1</em>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                   // Supprime les <p> existants pour éviter les doublons, puis enveloppe le tout
                   formatted = formatted.replace(/<\/?p>/g, '');
                   return `<p style=\"text-align: center;\">${formatted}</p>`;
                };

                const transformedDialogs = jsonObj.dialogs.map(dialog => {
                   const { text, answer, tips } = dialog;
                   return {
                       text: formatDialogText(text),
                       answer: formatDialogText(answer),
                       tips: tips || {} // Les tips restent en texte brut
                   };
               });

               content = {
                   title: (jsonObj.title && !jsonObj.title.startsWith('<p>')) ? `<p>${jsonObj.title}</p>` : jsonObj.title,
                   description: jsonObj.description,
                   dialogs: transformedDialogs,
                   behaviour: {
                       enableRetry: true,
                       disableBackwardsNavigation: false,
                       scaleTextNotCard: true,
                       randomCards: false
                   },
                   answer: translations.answer,
                   next: translations.next,
                   prev: translations.prev,
                   retry: translations.retry,
                   progressText: translations.progressText,
                   cardFrontLabel: translations.cardFrontLabel,
                   cardBackLabel: translations.cardBackLabel,
                   tipButtonLabel: translations.tipButtonLabel,
                   audioNotSupported: translations.audioNotSupported,
                   mode: "normal",
                   correctAnswer: translations.correctAnswer,
                   incorrectAnswer: translations.incorrectAnswer,
                   round: translations.round,
                   cardsLeft: translations.cardsLeft,
                   nextRound: translations.nextRound,
                   startOver: translations.startOver,
                   showSummary: translations.showSummary,
                   summary: translations.summary,
                   summaryCardsRight: translations.summaryCardsRight,
                   summaryCardsWrong: translations.summaryCardsWrong,
                   summaryCardsNotShown: translations.summaryCardsNotShown,
                   summaryOverallScore: translations.summaryOverallScore,
                   summaryCardsCompleted: translations.summaryCardsCompleted,
                   summaryCompletedRounds: translations.summaryCompletedRounds,
                   summaryAllDone: translations.summaryAllDone,
                   confirmStartingOver: {
                       header: translations.confirmStartingOverHeader,
                       body: translations.confirmStartingOverBody,
                       cancelLabel: translations.confirmStartingOverCancelLabel,
                       confirmLabel: translations.confirmStartingOverConfirmLabel
                   }
               };
           } else if (moduleKey === 'ComplexFillTheBlanks') {
              content = { ...jsonObj }; // Le JSON est déjà au bon format
           } else if (moduleKey === 'Chart') {
               content = { ...jsonObj };
           }

            // Ajout d'une adaptation pour MarkTheWords pour inclure les paramètres par défaut
            if (moduleKey === 'MarkTheWords') {
                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        enableCheckButton: true,
                        showScorePoints: true
                    },
                    overallFeedback: jsonObj.overallFeedback || [{"from": 0,"to": 100,"feedback": "You got @score of @total points."}],
                    checkAnswerButton: translations.mark_words_check_answer || "Check",
                    tryAgainButton: translations.mark_words_try_again || "Retry",
                    showSolutionButton: translations.mark_words_show_solution || "Show solution",
                    correctAnswer: translations.mark_words_correct_answer || "Correct!",
                    incorrectAnswer: translations.mark_words_incorrect_answer || "Incorrect!",
                    missedAnswer: translations.mark_words_missed_answer || "Missed!",
                    displaySolutionDescription: translations.mark_words_display_solution_description || "Task is updated to contain the solution.",
                    scoreBarLabel: translations.mark_words_score_bar_label || "You got :num out of :total points",
                    submitAnswerButton: translations.mark_words_submit_answer || "Submit",
                    a11yFullTextLabel: translations.mark_words_a11y_full_text_label || "Full readable text",
                    a11yClickableTextLabel: translations.mark_words_a11y_clickable_text_label || "Full text where words can be marked",
                    media: {
                        "disableImageZooming": false
                    },
                    a11ySolutionModeHeader: translations.mark_words_a11y_solution_mode_header || "Solution mode",
                    a11yCheckingHeader: translations.mark_words_a11y_checking_header || "Checking mode",
                    a11yCheck: translations.mark_words_a11y_check || "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: translations.mark_words_a11y_show_solution || "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: translations.mark_words_a11y_retry || "Retry the task. Reset all responses and start the task over again."
                };
            }

            const dynamicDependencies = (moduleKey === 'QuizSet' && jsonObj.quiz?.questions)
                ? [...new Set(jsonObj.quiz.questions.map(q => q.library.split(' ')[0]))]
                : [];

            createH5PFile(machineName, JSON.stringify(content), options, dynamicDependencies, includeLibs, moduleKey);

        } catch (error) {
            if (error instanceof SyntaxError) {
                showNotification(translations.error_invalid_json.replace('{errorMessage}', error.message) || `Le JSON fourni est invalide. Erreur: ${error.message}`, 'error');
            } else {
                showNotification(translations.error_h5p_creation.replace('{errorMessage}', error.message) || `Erreur de création H5P: ${error.message}`, 'error');
            }
            console.error(`Erreur pour ${moduleKey}:`, error);
        }
    }

// =======================================================================
// 7.3. Logique de packaging des fichiers H5P
// =======================================================================

    (async () => {
      try {
        const mod = await import('../libs/client-zip/index.js');
        downloadZip = mod.downloadZip;
      } catch(e) {
        console.error("Failed to load client-zip", e);
        showNotification(translations.error_loading_zip_module || 'Erreur de chargement du module de compression. La génération de fichiers risque d\'échouer.', 'error');
      }
    })();

    async function createH5PFile(mainLibraryIdentifier, jsonContent, options = {}, dynamicDependencies = [], includeLibs = false, moduleKey = '') {
        try {
            const files = [];
            const moduleName = mainLibraryIdentifier.split('.')[1];
            let allDependencies = new Map();

            if (includeLibs) {
                async function addLibraryFiles(machineName, processedLibs) {
                    if (processedLibs.has(machineName)) return;
                    const libPath = await findLatestLibraryPath(machineName);
                    if (!libPath) {
                        console.warn(`Bibliothèque locale '${machineName}' non trouvée.`);
                        return;
                    }
                    const response = await fetch(`${libPath}/library.json`);
                    if (!response.ok) {
                        console.warn(`Fichier '${libPath}/library.json' introuvable.`);
                        return;
                    }
                    const libraryInfo = await response.json();
                    const libFolderName = libPath.split('/').pop();
                    
                    files.push({
                      name: `${libFolderName}/library.json`,
                      input: new TextEncoder().encode(JSON.stringify(libraryInfo, null, 2)),
                      unixPermissions: 0o100644
                    });

                    const filesToAdd = (libraryInfo.preloadedJs || []).concat(libraryInfo.preloadedCss || []);
                    for (const file of filesToAdd) {
                      const sourcePath = `${libPath}/${file.path}`;
                      const destinationPath = `${libFolderName}/${file.path}`;
                      const fileResponse = await fetch(sourcePath);
                      if (fileResponse.ok) {
                        const blob = await fileResponse.blob();
                        files.push({
                          name: destinationPath,
                          input: new Uint8Array(await blob.arrayBuffer()),
                          unixPermissions: 0o100644
                        });
                      }
                    }

                    const optionalFiles = ['semantics.json', 'icon.svg'];
                    for (const opt of optionalFiles) {
                      const optResp = await fetch(`${libPath}/${opt}`);
                      if (optResp.ok) { // Vérifier si la ressource existe avant de l'ajouter
                        const blob = await optResp.blob();
                        files.push({
                          name: `${libFolderName}/${opt}`,
                          input: new Uint8Array(await blob.arrayBuffer()),
                          unixPermissions: 0o100644
                        });
                      }
                    }

                    const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
                    const langResponse = await fetch(`${libPath}/language/${h5pLang}.json`);
                    if (langResponse.ok) { // Vérifier si la ressource existe avant de l'ajouter
                      const blob = await langResponse.blob();
                      files.push({
                        name: `${libFolderName}/language/${h5pLang}.json`,
                        input: new Uint8Array(await blob.arrayBuffer()),
                        unixPermissions: 0o100644
                      });
                    }

                    const fontFilesToCopy = {
                      'FontAwesome': ['fontawesome-webfont.eot', 'fontawesome-webfont.svg', 'fontawesome-webfont.ttf', 'fontawesome-webfont.woff', 'fontawesome-webfont.woff2', 'FontAwesome.otf'],
                      'H5P.FontIcons': ['fonts/h5p.eot', 'fonts/h5p.svg', 'fonts/h5p.ttf', 'fonts/h5p.woff'],
                      'H5P.JoubelUI': ['fonts/joubel.eot', 'fonts/joubel.svg', 'fonts/joubel.ttf', 'fonts/joubel.woff']
                    };
                    if (fontFilesToCopy[machineName]) {
                      for (const fontFile of fontFilesToCopy[machineName]) {
                        const sourcePath = `${libPath}/${fontFile}`;
                        const fileResponse = await fetch(sourcePath);
                        if (fileResponse.ok) { // Vérifier si la ressource existe avant de l'ajouter
                          const destinationPath = `${libFolderName}/${fontFile}`;
                          const blob = await fileResponse.blob();
                          files.push({ name: destinationPath, input: new Uint8Array(await blob.arrayBuffer()), unixPermissions: 0o100644 });
                        }
                      }
                    }

                    const allDeps = (libraryInfo.preloadedDependencies || []).concat(libraryInfo.editorDependencies || []);
                    for (const dep of allDeps) {
                      await addLibraryFiles(dep.machineName, processedLibs);
                    }
                    processedLibs.set(machineName, { machineName: libraryInfo.machineName, majorVersion: String(libraryInfo.majorVersion), minorVersion: String(libraryInfo.minorVersion) });
                }

                await addLibraryFiles(mainLibraryIdentifier, allDependencies);
                for (const dep of dynamicDependencies) {
                  await addLibraryFiles(dep, allDependencies);
                }
            }

            // Ajout du content.json
            let finalJsonContent = JSON.parse(jsonContent);
            if (options.description) {
                finalJsonContent.description = options.description;
            }
            files.push({
              name: "content/content.json",
              input: new TextEncoder().encode(JSON.stringify(finalJsonContent, null, 2)),
              unixPermissions: 0o100644
            });

            // Génération du manifeste h5p.json
            const title = options.title || finalJsonContent.title || `${moduleName} Activity`;
            let dependenciesForJson = Array.from(allDependencies.values());

            // Si aucune bibliothèque n'est incluse, il faut quand même déclarer la dépendance principale.
            if (dependenciesForJson.length === 0 && mainLibraryIdentifier) {
               const moduleInfo = h5pModules[moduleKey];
               if (moduleInfo && moduleInfo.machineName) {
                   // Pour "Complex fill the blanks", on force la version car on ne la stocke pas en local pour l'instant
                   if (moduleInfo.machineName === "H5P.AdvancedBlanks") {
                       dependenciesForJson.push({
                           machineName: "H5P.AdvancedBlanks",
                           majorVersion: "1",
                           minorVersion: "2"
                       });
                   } else {
                        const libPath = await findLatestLibraryPath(moduleInfo.machineName);
                        if (libPath) {
                            try {
                                const response = await fetch(`${libPath}/library.json`);
                                if (response.ok) {
                                    const libraryInfo = await response.json();
                                    dependenciesForJson.push({
                                        machineName: libraryInfo.machineName,
                                        majorVersion: String(libraryInfo.majorVersion),
                                        minorVersion: String(libraryInfo.minorVersion)
                                    });
                                }
                            } catch (e) {
                                console.error("Impossible de charger les informations de la bibliothèque principale :", e);
                            }
                        } else if (moduleInfo.machineName === "H5P.TrueFalse") {
                            dependenciesForJson.push({ machineName: "H5P.TrueFalse", majorVersion: "1", minorVersion: "8" });
                        } else if (moduleInfo.machineName === "H5P.MultiChoice") {
                           dependenciesForJson.push({ machineName: "H5P.MultiChoice", majorVersion: "1", minorVersion: "16" });
                       } else if (moduleInfo.machineName === "H5P.FindTheWords") {
                            dependenciesForJson.push({ machineName: "H5P.FindTheWords", majorVersion: "1", minorVersion: "4" });
                        } else if (moduleInfo.machineName === "H5P.SortParagraphs") {
                            dependenciesForJson.push({ machineName: "H5P.SortParagraphs", majorVersion: "0", minorVersion: "11" });
                        } else if (moduleInfo.machineName === "H5P.SingleChoiceSet") {
                            dependenciesForJson.push({ machineName: "H5P.SingleChoiceSet", majorVersion: "1", minorVersion: "11" });
                        } else if (moduleInfo.machineName === "H5P.Dialogcards") {
                            dependenciesForJson.push({ machineName: "H5P.Dialogcards", majorVersion: "1", minorVersion: "9" });
                        } else if (moduleInfo.machineName === "H5P.Chart") {
                           dependenciesForJson.push({ machineName: "H5P.Chart", majorVersion: "1", minorVersion: "2" });
                        } else if (moduleInfo.machineName === "H5P.Crossword") {
                            dependenciesForJson.push({ machineName: "H5P.Crossword", majorVersion: "0", minorVersion: "5" });
                        } else if (moduleInfo.machineName === "H5P.Essay") {
                            dependenciesForJson.push({ machineName: "H5P.Essay", majorVersion: "1", minorVersion: "5" });
                        } else if (moduleInfo.machineName === "H5P.Summary") {
                            dependenciesForJson.push({ machineName: "H5P.Summary", majorVersion: "1", minorVersion: "10" });
                        }
                   }
               }
            }

            // Ajout de la dépendance TimelineJS si nécessaire
            if (moduleKey === 'Timeline' && !dependenciesForJson.some(d => d.machineName === 'TimelineJS')) {
                dependenciesForJson.push({ machineName: "TimelineJS", majorVersion: "1", minorVersion: "1" });
            }

            const h5pJson = {
                title: title,
                language: "und",
                mainLibrary: mainLibraryIdentifier,
                embedTypes: ["iframe"],
                license: "U",
                defaultLanguage: currentLang === 'zh' ? 'zh-cn' : currentLang,
                preloadedDependencies: dependenciesForJson
            };
            files.push({
              name: "h5p.json",
              input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)),
              unixPermissions: 0o100644
            });

            // Téléchargement du ZIP H5P
            if (!downloadZip) {
                showNotification(translations.error_compression_module_not_ready || 'Le module de compression n\'est pas prêt. Réessayez dans un instant.', 'error');
                return;
            }
            const zipBlob = await downloadZip(files).blob();
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            const now = new Date();
            const dateString = now.getFullYear() +
                             String(now.getMonth() + 1).padStart(2, '0') + 
                             String(now.getDate()).padStart(2, '0') +
                             String(now.getHours()).padStart(2, '0') +
                             String(now.getMinutes()).padStart(2, '0');

            const h5pType = (moduleKey && h5pModules[moduleKey])
                            ? h5pModules[moduleKey].englishName.toLowerCase().replace(/[^a-z0-9()]+/g, '-').replace(/^-+|-+$/g, '')
                            : mainLibraryIdentifier.split('.')[1].toLowerCase();

            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `h5p${h5pType}-caramel-${dateString}-${lang}.h5p`;
            a.download = fileName;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
 
            console.log(`Fichier ${a.download} généré avec succès.`);
            showNotification(translations.h5p_file_generated_successfully.replace('{fileName}', a.download) || `Fichier ${a.download} généré avec succès !`);
            return { success: true, message: `Fichier ${a.download} créé.` };
        } catch (error) {
            console.error("Erreur lors de la création du H5P:", error);
            showNotification(translations.h5p_creation_failed.replace('{errorMessage}', error.message) || `Échec de la création du fichier H5P : ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async function findLatestLibraryPath(machineName) {
        const knownLibraries = {
            'H5P.QuestionSet': './h5p-libs/H5P.QuestionSet-1.20',
            'H5P.MultiChoice': './h5p-libs/H5P.MultiChoice-1.16',
            'H5P.DragText': './h5p-libs/H5P.DragText-1.10',
            'H5P.Blanks': './h5p-libs/H5P.Blanks-1.14',
            'H5P.JoubelUI': './h5p-libs/H5P.JoubelUI-1.3',
            'H5P.FontIcons': './h5p-libs/H5P.FontIcons-1.0',
            'H5P.Transition': './h5p-libs/H5P.Transition-1.0',
            'H5P.Question': './h5p-libs/H5P.Question-1.5',
            'H5P.TextUtilities': './h5p-libs/H5P.TextUtilities-1.3',
            'jQuery.ui': './h5p-libs/jQuery.ui-1.10',
            'FontAwesome': './h5p-libs/FontAwesome-4.5',
            'H5P.Timeline': './h5p-libs/H5P.Timeline-1.1',
            'TimelineJS': './h5p-libs/TimelineJS-1.1',
            'H5P.Flashcards': './h5p-libs/H5P.Flashcards-1.6',
            'H5P.Accordion': './h5p-libs/H5P.Accordion-1.0',
            'H5P.AdvancedText': './h5p-libs/H5P.AdvancedText-1.1',
            'H5P.Crossword': './h5p-libs/H5P.Crossword-0.5',
            'H5P.Essay': './h5p-libs/H5P.Essay-1.5',
            'H5P.Video': './h5p-libs/H5P.Video-1.6',
            'H5P.Image': './h5p-libs/H5P.Image-1.1',
            'H5P.MaterialDesignIcons': './h5p-libs/H5P.MaterialDesignIcons-1.0',
            'H5P.Summary': './h5p-libs/H5P.Summary-1.10',
            'H5P.MarkTheWords': './h5p-libs/H5P.MarkTheWords-1.11',
            'H5P.DragQuestion': './h5p-libs/H5P.DragQuestion-1.14',
            'H5PEditor.VerticalTabs': './h5p-libs/H5PEditor.VerticalTabs-1.3',
            'H5PEditor.ColorSelector': './h5p-libs/H5PEditor.ColorSelector-1.2',
            'H5PEditor.Wizard': './h5p-libs/H5PEditor.Wizard-1.2',
            'H5PEditor.RangeList': './h5p-libs/H5PEditor.RangeList-1.0'
        };
        
        const path = knownLibraries[machineName];
        if (path) {
            const response = await fetch(`${path}/library.json`);
            if (response.ok) {
                return path;
            }
        }
        return null;
    }

// =======================================================================
// 13. CRÉATION D’UN QUIZSET SIMPLE
// =======================================================================

    async function createH5PWithDynamicDependencies(title, contentJson, libraries) {
        try {
            if (!downloadZip) {
                showNotification(translations.error_compression_module_not_ready || 'Le module de compression n\'est pas prêt. Réessayez dans un instant.', 'error');
                return;
            }

           // Enrichir chaque question avec les traductions et la structure complète
           contentJson.questions.forEach(q => {
               const libName = q.library.split(' ')[0];
               
               if (libName === 'H5P.TrueFalse') {
                   // Déplacer les feedbacks au bon endroit
                   if (q.params.feedbackOnCorrect || q.params.feedbackOnWrong) {
                       q.params.behaviour = q.params.behaviour || {};
                       q.params.behaviour.feedbackOnCorrect = q.params.feedbackOnCorrect;
                       q.params.behaviour.feedbackOnWrong = q.params.feedbackOnWrong;
                       delete q.params.feedbackOnCorrect;
                       delete q.params.feedbackOnWrong;
                   }
                   // Ajouter les traductions de l'interface
                   q.params.l10n = {
                       trueText: translations.true_false_true_text,
                       falseText: translations.true_false_false_text,
                       score: translations.true_false_score,
                       checkAnswer: translations.true_false_check_answer,
                       showSolutionButton: translations.true_false_show_solution_button,
                       tryAgain: translations.true_false_try_again,
                       scoreBarLabel: translations.true_false_score_bar_label
                   };
               } else if (libName === 'H5P.MultiChoice') {
                   q.params.UI = {
                       checkAnswerButton: translations.checkAnswerButton,
                       showSolutionButton: translations.showSolutionButton,
                       tryAgainButton: translations.tryAgainButton,
                       scoreBarLabel: translations.scoreBarLabel,
                       submitAnswerButton: translations.submitAnswerButton,
                       tipsLabel: translations.quiz_tips_label,
                       tipAvailable: translations.quiz_tip_available,
                       feedbackAvailable: translations.quiz_feedback_available,
                       readFeedback: translations.quiz_read_feedback,
                       wrongAnswer: translations.quiz_wrong_answer,
                       correctAnswer: translations.quiz_correct_answer,
                       shouldCheck: translations.quiz_should_check,
                       shouldNotCheck: translations.quiz_should_not_check,
                       noInput: translations.quiz_no_input,
                       a11yCheck: translations.quiz_a11y_check,
                       a11yShowSolution: translations.quiz_a11y_show_solution,
                       a11yRetry: translations.quiz_a11y_retry
                   };
                    q.params.answers.forEach(a => {
                       a.tipsAndFeedback = { tip: "", chosenFeedback: "", notChosenFeedback: "" };
                   });
               } else if (libName === 'H5P.Blanks') {
                   q.params.checkAnswer = translations.blanks_check_answer;
                   q.params.tryAgain = translations.blanks_try_again;
                   q.params.showSolutions = translations.blanks_show_solutions;
                   q.params.scoreBarLabel = translations.blanks_score_bar_label;
               } else if (libName === 'H5P.DragText') {
                   q.params.checkAnswer = translations.drag_words_check_answer;
                   q.params.tryAgain = translations.drag_words_try_again;
                   q.params.showSolution = translations.drag_words_show_solution;
                   q.params.scoreBarLabel = translations.drag_words_score_bar_label;
               } else if (libName === 'H5P.MarkTheWords') {
                   q.params.checkAnswerButton = translations.mark_words_check_answer;
                   q.params.tryAgainButton = translations.mark_words_try_again;
                   q.params.showSolutionButton = translations.mark_words_show_solution;
                   q.params.scoreBarLabel = translations.mark_words_score_bar_label;
               } else if (libName === 'H5P.Essay') {
                   q.params.checkAnswer = translations.essay_checkAnswer;
                   q.params.tryAgain = translations.essay_tryAgain;
                   q.params.showSolution = translations.essay_showSolution;
               }
           });
           
            // Ajouter les traductions globales du Quiz (Question Set)
            contentJson.texts = {
                prevButton: translations.quiz_prev_button,
                nextButton: translations.quiz_next_button,
                finishButton: translations.quiz_finish_button,
                submitButton: translations.quiz_submit_button,
                textualProgress: translations.quiz_textual_progress,
            };
            contentJson.endGame = {
                showResultPage: true,
                showSolutionButton: true,
                showRetryButton: true,
                noResultMessage: translations.quiz_no_result_message,
                message: translations.quiz_result_message,
                scoreBarLabel: translations.quiz_score_bar_label,
                solutionButtonText: translations.quiz_solution_button_text,
                retryButtonText: translations.quiz_retry_button_text,
                finishButtonText: translations.quiz_finish_button_text,
                submitButtonText: translations.quiz_submit_button_text
            };

            // Liste de base des dépendances pour QuestionSet
            const dependencies = new Map();
            dependencies.set("H5P.QuestionSet", { machineName: "H5P.QuestionSet", majorVersion: "1", minorVersion: "20" });

            // Ajout des dépendances de chaque sous-activité
            const libraryVersions = {
                "H5P.TrueFalse": { majorVersion: "1", minorVersion: "8" },
                "H5P.MultiChoice": { majorVersion: "1", minorVersion: "16" },
                "H5P.Blanks": { majorVersion: "1", minorVersion: "14" },
                "H5P.DragText": { majorVersion: "1", minorVersion: "10" },
                "H5P.MarkTheWords": { majorVersion: "1", minorVersion: "11" },
                "H5P.Essay": { majorVersion: "1", minorVersion: "5" }
            };

            for (const lib of libraries) {
                if (libraryVersions[lib] && !dependencies.has(lib)) {
                    dependencies.set(lib, { machineName: lib, ...libraryVersions[lib] });
                }
            }

            const h5pJson = {
                title: title,
                language: currentLang === 'zh' ? 'zh-cn' : currentLang,
                mainLibrary: "H5P.QuestionSet",
                embedTypes: ["iframe"],
                license: "U",
                preloadedDependencies: Array.from(dependencies.values())
            };

            const files = [
                { name: "h5p.json", input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)) },
                { name: "content/content.json", input: new TextEncoder().encode(JSON.stringify(contentJson, null, 2)) }
            ];

            const zipBlob = await downloadZip(files).blob();
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            const now = new Date();
            const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
            const h5pType = (h5pModules['QuizSet']?.englishName || 'quiz-set').toLowerCase().replace(/[^a-z0-9()]+/g, '-').replace(/^-+|-+$/g, '');
            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `h5p-${h5pType}_caramel_${dateString}_${lang}.h5p`;
            a.download = fileName;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
 
            showNotification(translations.h5p_file_generated_successfully.replace('{fileName}', a.download) || `Fichier ${a.download} généré avec succès !`);
 
        } catch (error) {
            console.error("Erreur lors de la création du H5P avec dépendances dynamiques:", error);
            showNotification(translations.h5p_creation_failed.replace('{errorMessage}', error.message) || `Échec de la création du fichier H5P : ${error.message}`, 'error');
        }
    }