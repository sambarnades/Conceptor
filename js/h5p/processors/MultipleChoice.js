/**
 * Processeur H5P — Choix multiples
 *
 * Formate question et réponses en HTML, ajoute traductions UI et comportement
 * (mélange des réponses, feedback, etc.).
 *
 * @module processors/MultipleChoice
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation pour intégration QuizSet
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml, markdownToHtml } from '../../core/utils.js';
import { buildMediaStructure } from '../image-manager.js';

/**
 * Convertit le Markdown des indices et retours par réponse.
 *
 * Le semantics de H5P.MultiChoice 1.16 autorise explicitement le HTML sur ces trois
 * champs — `widget: html`, avec `strong` dans leurs `tags` :
 *     answers[].answer.tipsAndFeedback.tip               tags = p, br, strong, em, a, code
 *     answers[].answer.tipsAndFeedback.chosenFeedback    tags = strong, em, sub, sup, a, code
 *     answers[].answer.tipsAndFeedback.notChosenFeedback tags = strong, em, sub, sup, a, code
 * (vérifiable par `node tests/run_semantics_audit.mjs --module=MultipleChoice`)
 *
 * `field-constraints.js` les déclarait bien `html+latex`, mais AUCUN processeur ne les
 * convertissait : un `**gras**` écrit par l'enseignant s'affichait en astérisques dans
 * l'activité publiée — constaté en aperçu réel (audit 2026-07). Les autres champs du
 * module (`question`, `answers[].text`) passaient déjà par `formatTextToHtml`.
 *
 * `markdownToHtml` et NON `formatTextToHtml` : ce dernier commence par assainir, ce qui
 * échappe le `<` en `&lt;` — et détruit donc les comparaisons LaTeX du type
 * `\(\sqrt{12} < 4\)`, fréquentes dans les retours de QCM de mathématiques (régression
 * attrapée par `test-edit-export-flow` sur `multiple_choice_3.json`). `markdownToHtml`
 * met les blocs `\(…\)` et `\[…\]` de côté par placeholder avant de convertir, et ne
 * touche pas au reste. Ces champs ne recevaient AUCUN traitement auparavant : on ajoute
 * la conversion sans retirer d'assainissement qui aurait existé.
 *
 * @param {Object} tips - { tip, chosenFeedback, notChosenFeedback }
 * @returns {Object} Les mêmes champs, Markdown converti (chaînes vides laissées vides).
 */
function convertirTips(tips) {
    if (!tips || typeof tips !== 'object') return tips;
    const converti = { ...tips };
    for (const cle of ['tip', 'chosenFeedback', 'notChosenFeedback']) {
        if (typeof converti[cle] === 'string' && converti[cle].trim()) {
            converti[cle] = markdownToHtml(converti[cle]);
        }
    }
    return converti;
}

/**
 * Replie dans `tipsAndFeedback` les retours écrits À LA RACINE de la réponse.
 *
 * Le semantics de H5P.MultiChoice ne connaît que trois champs sur `answers[]` :
 * `text`, `correct` et le groupe `tipsAndFeedback` (vérifiable par
 * `node tests/run_semantics_audit.mjs --module=MultipleChoice`). Or
 * `H5PContentValidator::validateGroup()` SUPPRIME toute clé absente du semantics
 * (« no validator exists for @key » → `unset()`). Un `chosenFeedback` posé à la
 * racine de la réponse disparaît donc à l'import Moodle/Éléa **silencieusement** :
 * ni erreur, ni trace, juste un retour pédagogique qui ne s'affiche jamais.
 * Constaté sur `assets/data/examples/quiz_qcm_5.json` (13 retours morts).
 *
 * Le repli est déjà l'idiome du dépôt : `InteractiveVideo.js` reconstruit un
 * `tipsAndFeedback` propre à partir des clés de racine AVANT de déléguer à
 * `transformForQuizSet` — d'où l'absence de `feedback` dans la table d'alias
 * ci-dessous, ce cas étant déjà traité en amont par la Vidéo interactive.
 *
 * Prudence délibérée : on n'agit que s'il existe au moins une valeur de racine NON
 * VIDE, et une valeur déjà présente dans `tipsAndFeedback` gagne toujours. Le repli
 * comble, il n'écrase pas — et une réponse déjà canonique ressort inchangée.
 *
 * @param {Object} reponse - une entrée de `answers[]`
 * @returns {Object} la réponse, retours repliés et clés parasites retirées
 */
const ALIAS_RETOURS = ['tip', 'chosenFeedback', 'notChosenFeedback'];

function replierRetoursRacine(reponse) {
    if (!reponse || typeof reponse !== 'object') return reponse;
    const parasites = ALIAS_RETOURS.filter(cle => typeof reponse[cle] === 'string');
    if (!parasites.some(cle => reponse[cle].trim())) return reponse;

    const tips = { ...(reponse.tipsAndFeedback || {}) };
    for (const cle of parasites) {
        if (!reponse[cle].trim()) continue;
        if (typeof tips[cle] === 'string' && tips[cle].trim()) continue;
        tips[cle] = reponse[cle];
    }
    const nette = { ...reponse, tipsAndFeedback: tips };
    for (const cle of parasites) delete nette[cle];
    return nette;
}

/**
 * Libellés d'interface de H5P.MultiChoice (bloc `UI`).
 *
 * Factorisés parce que `process()` (activité autonome) et `transformForQuizSet()`
 * (question DANS un Quiz ou une Vidéo interactive) doivent produire les MÊMES :
 * les deux listes avaient divergé, et c'était ici l'activité AUTONOME la plus
 * pauvre — ses trois chaînes `a11y*` restaient au défaut anglais de la lib.
 * @returns {Object}
 */
function libellesUI() {
    return {
        checkAnswerButton: translations.h5p_check_answer || "Vérifier",
        showSolutionButton: translations.h5p_show_solution || "Afficher la solution",
        tryAgainButton: translations.h5p_try_again || "Recommencer",
        scoreBarLabel: translations.h5p_score_bar_label || "Vous avez obtenu :num sur :total points",
        submitAnswerButton: translations.h5p_submit_answer || "Valider",
        tipsLabel: translations.h5p_tip_label || "Indice",
        tipAvailable: translations.h5p_blanks_input_has_tip_label || "Indice disponible",
        feedbackAvailable: translations.h5p_quiz_feedback_available || "Feedback disponible",
        readFeedback: translations.h5p_quiz_read_feedback || "Lire le commentaire",
        wrongAnswer: translations.h5p_quiz_wrong_answer || "Mauvaise réponse",
        correctAnswer: translations.h5p_quiz_correct_answer || "Bonne réponse",
        shouldCheck: translations.h5p_quiz_should_check || "Il fallait cocher ici",
        shouldNotCheck: translations.h5p_quiz_should_not_check || "Il ne fallait pas cocher ici !",
        noInput: translations.h5p_quiz_no_input || "Répondez s'il vous plait avant de visionner la solution.",
        a11yCheck: translations.h5p_a11y_check || "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
        a11yShowSolution: translations.h5p_a11y_show_solution || "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
        a11yRetry: translations.h5p_a11y_retry || "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer."
    };
}

export default {
    process: (jsonObj) => {
        return {
            ...jsonObj, // Conserve la question, les réponses et le overallFeedback
            question: formatTextToHtml(jsonObj.question),
            media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt),
            answers: (Array.isArray(jsonObj.answers) ? jsonObj.answers : []).map(replierRetoursRacine).map(answer => ({
                ...answer,
                text: formatTextToHtml(answer.text),
                ...(answer.tipsAndFeedback ? { tipsAndFeedback: convertirTips(answer.tipsAndFeedback) } : {})
            })),
            UI: libellesUI(),
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
                showScorePoints: true,
                ...(jsonObj.behaviour || {})
            },
            confirmCheck: {
                header: translations.h5p_finish_header || "Terminer ?",
                body: translations.h5p_finish_body || "Êtes-vous sûr de vouloir terminer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_finish_label || "Terminer"
            },
            confirmRetry: {
                header: translations.h5p_retry_header || "Recommencer ?",
                body: translations.h5p_retry_body || "Êtes-vous sûr de vouloir recommencer ?",
                cancelLabel: translations.h5p_cancel_label || "Annuler",
                confirmLabel: translations.h5p_retry_confirm_label || "Confirmer"
            },
            overallFeedback: jsonObj.overallFeedback || [
                { from: 0, to: 100, feedback: "" }
            ]
        };
    },

    transformForQuizSet: (question) => {
        question.params.UI = {
            ...libellesUI(),
            ...question.params.UI
        };

        // Added: Ensure text formatting is applied
        question.params.question = formatTextToHtml(question.params.question);
        if (question.params.answers) {
            question.params.answers = question.params.answers.map(a => {
                const reponse = replierRetoursRacine(a);
                return { ...reponse, text: formatTextToHtml(reponse.text) };
            });
        }

        question.params.behaviour = {
            type: "auto",
            singleAnswer: true,
            enableRetry: true,
            enableSolutionsButton: true,
            randomAnswers: true,
            ...question.params.behaviour
        };
        if (question.params.answers) {
            question.params.answers.forEach(a => {
                a.tipsAndFeedback = convertirTips({
                    tip: "", chosenFeedback: "", notChosenFeedback: "", ...a.tipsAndFeedback
                });
            });
        }
        return question;
    }
};
