import { translations } from '../translation.js';


export const machineName = 'H5P.DragText';
export const version = { major: 1, minor: 10 };
export const extraDependencies = [{ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }];

export default {
    process: (jsonObj) => {
        return {
            taskDescription: jsonObj.taskDescription,
            textField: jsonObj.textField,
            checkAnswer: translations.h5p_check_answer || "Vérifier",
            tryAgain: translations.h5p_try_again || "Recommencer",
            showSolution: translations.h5p_show_solution || "Afficher la solution",
            behaviour: {
                enableRetry: true,
                enableSolutionsButton: true,
                instantFeedback: false,
                enableCheckButton: true
            },
            overallFeedback: jsonObj.overallFeedback || [{
                from: 0,
                to: 100,
                feedback: translations.h5p_drag_words_score_feedback || "Score : @score sur @total."
            }],
            dropZoneIndex: "Drop Zone @index.",
            empty: "Drop Zone @index is empty.",
            contains: "Drop Zone @index contains draggable @draggable.",
            tipLabel: translations.h5p_tip_label || "Indice",
            correctText: translations.h5p_drag_words_correct_text || "Correct !",
            incorrectText: translations.h5p_drag_words_incorrect_text || "Incorrect !",
            resetDropTitle: "Reset drop",
            resetDropDescription: "Are you sure you want to reset this drop zone?",
            grabbed: "Draggable is grabbed.",
            cancelledDragging: "Cancelled dragging.",
            correctAnswer: "Correct answer:",
            feedbackHeader: "Feedback",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            media: {
                disableImageZooming: false
            },
            submitAnswer: translations.h5p_submit_answer || "Valider",
            ariaDraggableIndex: "@index sur @count éléments.",
            a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
            a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
            a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
        };
    },

    transformForQuizSet: (question) => {
        question.params.checkAnswer = translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain = translations.h5p_try_again || "Recommencer";
        question.params.showSolution = translations.h5p_show_solution || "Afficher la solution";
        question.params.scoreBarLabel = translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points";
        question.params.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            instantFeedback: false,
            randomAccounts: true, // Note from original: often 'randomAccounts' or 'randomizableAnswers' depending on version
            ...question.params.behaviour
        };
        return question;
    }
};
