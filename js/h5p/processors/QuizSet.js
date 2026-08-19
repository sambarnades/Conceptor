/**
 * Processeur H5P — Quiz mixte (QuestionSet)
 *
 * Traite les questions du QuizSet via helpers (processChild), génère UUID,
 * collecte les dépendances dynamiques des sous-questions, configure
 * traductions (navigation/résultats) et comportement global.
 *
 * @module processors/QuizSet
 * @exports {Object} default.process - Transformation principale (reçoit helpers du routeur)
 */
import { translations } from '../../core/translation.js';
import { generateUUID } from '../../core/utils.js';

export default {
    /**
     * Traite le JSON pour le QuizSet.
     * @param {Object} jsonObj - Le JSON d'entrée.
     * @param {Object} helpers - Fonctions injectées pour éviter les dépendances circulaires.
     * @param {Function} helpers.processChild - Fonction pour traiter un item (question) individuel.
     * @param {Function} helpers.getLibraryMetadata - Fonction pour récupérer les infos de version d'une lib.
     * @param {Function} helpers.getKeyFromLibrary - Fonction pour trouver le moduleKey depuis le nom H5P.
     * @returns {Object} { content: Object, dependencies: Array }
     */
    process: async (jsonObj, helpers) => {
        const content = { ...jsonObj };

        // Valeurs par défaut
        content.progressType = content.progressType || "dots";
        content.passPercentage = content.passPercentage ?? 50;
        // randomQuestions : champ éditeur au niveau racine → injecter dans behaviour
        const randomQuestions = content.randomQuestions ?? false;
        delete content.randomQuestions;
        content.behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            randomQuestions,
            ...content.behaviour
        };

        const librariesSet = new Set();
        const dependencies = [];

        // Traitement des questions (parallélisé car processChild est async)
        if (content.questions && Array.isArray(content.questions)) {
            content.questions = await Promise.all(content.questions.map(async q => {
                // Génération UUID si absent
                if (!q.subContentId) {
                    q.subContentId = generateUUID();
                }

                // Identification de la bibliothèque
                const libName = (q.library || '').split(' ')[0];
                librariesSet.add(libName);

                // Transformation via le processeur enfant (si disponible)
                if (helpers && helpers.processChild) {
                    return await helpers.processChild(q);
                }
                return q;
            }));
        }

        // Traductions et Textes d'interface
        // NB : H5P.QuestionSet ≤1.20 lit prevButton/nextButton ; la 1.21+ (barre de
        // navigation H5P.Components) lit les nouveaux champs previous/next (libellés
        // visibles) + previousbutton/nextbutton (aria) + jumpToQuestion/answeredText/
        // unansweredText (a11y des pastilles). On renseigne les DEUX jeux pour rester
        // compatible avec les deux versions et éviter un bouton « Suivant » vide.
        const previousLabel = translations.h5p_previous || "Précédent";
        const nextLabel = translations.h5p_next || "Suivant";
        content.texts = {
            // Ancien schéma (≤ 1.20)
            prevButton: previousLabel,
            nextButton: nextLabel,
            // Nouveau schéma (1.21+)
            previous: previousLabel,
            next: nextLabel,
            previousbutton: previousLabel,
            nextbutton: nextLabel,
            // Communs
            finishButton: translations.h5p_finish_label || "Terminer",
            submitButton: translations.h5p_submit_answer || "Valider",
            textualProgress: translations.h5p_quiz_textual_progress || "Question @current sur @total",
            jumpToQuestion: translations.h5p_quiz_jump_to_question || "Question %d sur %total",
            answeredText: translations.h5p_quiz_answered || "Réponse donnée",
            unansweredText: translations.h5p_quiz_unanswered || "Pas de réponse donnée",
            // Barre de navigation entre questions (libellé, annonces lecteur d'écran).
            questionLabel: translations.h5p_quiz_question_label || "Question",
            readSpeakerProgress: translations.h5p_quiz_read_speaker_progress || "Question @current sur @total",
            currentQuestionText: translations.h5p_quiz_current_question || "Question en cours",
            navigationLabel: translations.h5p_quiz_navigation_label || "Questions",
            questionSetInstruction: translations.h5p_quiz_instruction || "Choisir la question à afficher",
            ...content.texts
        };

        content.endGame = {
            showResultPage: true,
            showSolutionButton: true,
            showRetryButton: true,
            noResultMessage: translations.h5p_quiz_no_result_message || "Terminé",
            message: translations.h5p_quiz_result_message || "Vos résultats :",
            scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
            solutionButtonText: translations.h5p_show_solution || "Afficher la solution",
            retryButtonText: translations.h5p_try_again || "Recommencer",
            finishButtonText: translations.h5p_finish_label || "Terminer",
            submitButtonText: translations.h5p_submit_answer || "Valider",
            overallFeedback: content.overallFeedback,
            ...content.endGame
        };

        // Supprimer le feedback global du niveau racine
        delete content.overallFeedback;

        // Calcul des dépendances dynamiques
        if (helpers && helpers.getKeyFromLibrary && helpers.getLibraryMetadata) {
            for (const libName of librariesSet) {
                const childModuleKey = helpers.getKeyFromLibrary(libName);
                if (childModuleKey) {
                    const metadata = helpers.getLibraryMetadata(childModuleKey);
                    if (metadata) {
                        dependencies.push({
                            machineName: metadata.machineName,
                            majorVersion: metadata.version.major,
                            minorVersion: metadata.version.minor
                        });
                        if (metadata.extraDependencies) {
                            dependencies.push(...metadata.extraDependencies);
                        }
                    }
                } else {
                    console.warn(`[QuizSet] Version inconnue pour la librairie enfant : ${libName}`);
                }
            }
        }

        return {
            content,
            dependencies
        };
    }
};
