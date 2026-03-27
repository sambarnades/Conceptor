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
        content.texts = {
            prevButton: translations.h5p_previous || "Précédent",
            nextButton: translations.h5p_next || "Suivant",
            finishButton: translations.h5p_finish_label || "Terminer",
            submitButton: translations.h5p_submit_answer || "Valider",
            textualProgress: translations.h5p_quiz_textual_progress || "Question @current sur @total",
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
