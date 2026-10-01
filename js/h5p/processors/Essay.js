/**
 * Processeur H5P — Rédaction
 *
 * Traite les essais avec mots-clés normalisés, formatage HTML de la consigne
 * et comportement (limites de caractères, pourcentages). Accepte les formats
 * 'word' (IA/QuizSet) et 'keyword' (H5P natif).
 *
 * @module processors/Essay
 * @exports {Object} default.process - Transformation principale
 * @exports {Function} default.transformForQuizSet - Adaptation avec normalisation des mots-clés
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';
import { prepareQuestionMedia } from '../question-media.js';

function normaliserMotCle(kw) {
    const item = kw && typeof kw === 'object' ? kw : { keyword: String(kw ?? '') };
    const result = { ...item, keyword: item.keyword || item.word || '', options: {
        points: 1, caseSensitive: true, occurrences: 1, forgiveMistakes: false,
        feedbackIncludedWord: 'keyword', feedbackMissedWord: 'none', ...(item.options || {})
    } };
    if (item.points !== undefined) result.options.points = item.points;
    if (item.caseSensitive !== undefined) result.options.caseSensitive = item.caseSensitive;
    if (item.explanation !== undefined) result.options.feedbackMissed = item.explanation;
    for (const key of ['word', 'points', 'caseSensitive', 'explanation']) delete result[key];
    return result;
}

/**
 * Rattache les ALTERNATIVES orphelines à leur mot-clé.
 *
 * Le modèle écrit parfois les variantes d'un mot-clé comme une entrée à part,
 * `{ "alternatives": [...] }` sans `keyword`, juste après le mot-clé qu'elles
 * complètent. Vide, cette entrée faisait rejeter TOUTE la rédaction (« au moins
 * un mot-clé non vide ») — et, dans un parcours, écarter la carte à l'assemblage
 * sous « erreur de mise en forme » (constaté le 28 sept. 2026). On la replie dans
 * les `alternatives` du mot-clé précédent ; s'il n'y en a pas, sa première
 * alternative devient le mot-clé. Une entrée vide de tout est simplement retirée.
 * Appliqué au traitement même (et pas seulement à la génération) : un contenu
 * déjà enregistré passe sans être régénéré.
 */
export function replierAlternativesOrphelines(keywords) {
    if (!Array.isArray(keywords)) return keywords;
    const sortie = [];
    for (const kw of keywords) {
        const objet = kw && typeof kw === 'object';
        const mot = objet ? String(kw.keyword || kw.word || '').trim() : String(kw ?? '').trim();
        const alternatives = objet && Array.isArray(kw.alternatives)
            ? kw.alternatives.map(a => String(a ?? '').trim()).filter(Boolean) : [];
        if (mot) { sortie.push(kw); continue; }
        if (!alternatives.length) continue;
        const precedent = sortie[sortie.length - 1];
        if (precedent && typeof precedent === 'object') {
            const deja = Array.isArray(precedent.alternatives) ? precedent.alternatives : [];
            sortie[sortie.length - 1] = { ...precedent, alternatives: [...new Set([...deja, ...alternatives])] };
        } else {
            const [premier, ...reste] = alternatives;
            sortie.push({ ...kw, keyword: premier, alternatives: reste });
        }
    }
    return sortie;
}

/** Un nombre de réglage : le nombre lu, ou `null` s'il n'en est pas un. */
const nombre = v => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

/**
 * Ramène dans leurs bornes les réglages d'une rédaction au lieu de la REJETER.
 *
 * Le modèle écrit parfois un réglage hors bornes : un mot-clé « compté 0 fois »
 * (`occurrences: 0`, parcours réel du 1er oct. 2026, mot-clé « mesure d'un
 * angle »), des points négatifs, un pourcentage au-delà de 100. Lever une erreur
 * écartait toute l'activité à la livraison d'un parcours, sous « erreur de mise
 * en forme » : un réglage se corrige, l'activité reste. Seule une rédaction sans
 * aucun mot-clé est refusée — il n'y a rien à corriger. Appliqué au traitement
 * même : un contenu déjà enregistré passe sans être régénéré.
 */
export function reparerRedaction(data) {
    data.keywords = replierAlternativesOrphelines(data.keywords);
    if (Array.isArray(data.keywords)) {
        data.keywords = data.keywords.filter(k => String(normaliserMotCle(k).keyword).trim());
    }
    if (!Array.isArray(data.keywords) || !data.keywords.length) throw Error('Essay: au moins un mot-clé non vide est requis.');
    const behaviour = data.behaviour && typeof data.behaviour === 'object' ? data.behaviour : null;
    if (behaviour) {
        for (const [key, max] of [['minimumLength', Infinity], ['maximumLength', Infinity], ['percentagePassing', 100], ['percentageMastering', 100], ['pointsHost', Infinity]]) {
            if (behaviour[key] == null || behaviour[key] === '') continue;
            const n = nombre(behaviour[key]);
            if (n === null || n < 0) delete behaviour[key];
            else if (n > max) behaviour[key] = max;
        }
    }
    data.keywords = data.keywords.map(kw => {
        if (!kw || typeof kw !== 'object') return kw;
        const mot = { ...kw };
        // Des points illisibles ou négatifs valent un point, à plat comme dans `options`.
        if (mot.points !== undefined && (nombre(mot.points) === null || nombre(mot.points) < 0)) mot.points = 1;
        if (mot.options && typeof mot.options === 'object') {
            const options = { ...mot.options };
            if (options.points != null && (nombre(options.points) === null || nombre(options.points) < 0)) options.points = 1;
            if (options.occurrences != null) {
                const n = nombre(options.occurrences);
                // Compté au moins une fois : 0, une fraction ou du texte valent 1.
                options.occurrences = n === null ? 1 : Math.max(1, Math.round(n));
            }
            mot.options = options;
        }
        return mot;
    });
}

export default {
    process: (jsonObj) => {
        reparerRedaction(jsonObj);
        return {
            ...jsonObj,
            taskDescription: formatTextToHtml(jsonObj.taskDescription),
            keywords: (jsonObj.keywords || []).map(normaliserMotCle),
            behaviour: {
                inputFieldSize: "10",
                enableRetry: true,
                ignoreScoring: false,
                minimumLength: undefined,
                maximumLength: undefined,
                percentagePassing: undefined,
                percentageMastering: undefined,
                pointsHost: 1,
                linebreakReplacement: " ",
                overrideForgiveMistakes: undefined,
                overrideCaseSensitive: undefined,
                ...(jsonObj.behaviour || {})
            },
            overallFeedback: jsonObj.overallFeedback || [{ from: 0, to: 100, feedback: "" }],
            checkAnswer: jsonObj.checkAnswer ?? (translations.h5p_check_answer || "Vérifier"),
            tryAgain: jsonObj.tryAgain ?? (translations.h5p_try_again || "Recommencer"),
            showSolution: jsonObj.showSolution ?? (translations.h5p_show_solution || "Afficher la solution"),
            feedbackHeader: jsonObj.feedbackHeader ?? (translations.h5p_essay_feedback_header || "Commentaire"),
            solutionTitle: jsonObj.solutionTitle ?? (translations.h5p_essay_solution_title || "Exemple de solution"),
            remainingChars: jsonObj.remainingChars ?? (translations.h5p_essay_remaining_chars || "Caractères restants : @chars"),
            notEnoughChars: jsonObj.notEnoughChars ?? (translations.h5p_essay_not_enough_chars || "Vous devez saisir au moins @chars caractères !"),
            messageSave: jsonObj.messageSave ?? (translations.h5p_essay_message_save || "enregistré"),
            placeholderText: jsonObj.placeholderText ?? (translations.h5p_essay_placeholder_text ?? "Commencez à rédiger ici..."),
            solution: {
                introduction: formatTextToHtml(jsonObj.solution?.introduction || ""),
                sample: formatTextToHtml(jsonObj.solution?.sample ?? "")
            },
            media: prepareQuestionMedia(jsonObj),
            ariaYourResult: jsonObj.ariaYourResult ?? (translations.h5p_essay_aria_your_result || "Vous avez obtenu @score sur @total points"),
            ariaNavigatedToSolution: jsonObj.ariaNavigatedToSolution ?? (translations.h5p_essay_aria_navigated_to_solution || "Navigation vers la solution."),
            submitAnswer: jsonObj.submitAnswer ?? (translations.h5p_submit_answer || "Submit"),
            ariaCheck: jsonObj.ariaCheck ?? (translations.h5p_a11y_check || "Check the answers."),
            ariaShowSolution: jsonObj.ariaShowSolution ?? (translations.h5p_a11y_show_solution || "Show the solution. You will be provided with a sample solution."),
            ariaRetry: jsonObj.ariaRetry ?? (translations.h5p_a11y_retry || "Retry the task. You can improve your previous answer if the author allowed that.")
        };
    },

    transformForQuizSet: (question) => {
        reparerRedaction(question.params);
        // 1. Convertir le Markdown de la consigne en HTML (cohérence avec process())
        if (question.params.taskDescription) {
            question.params.taskDescription = formatTextToHtml(question.params.taskDescription);
        }

        // 2. Normaliser les mots-clés : accepter word/keyword, points plats ou imbriqués
        if (question.params.keywords && Array.isArray(question.params.keywords)) {
            question.params.keywords = question.params.keywords.map(normaliserMotCle);
        }

        // 3. Traductions complètes (alignées sur process())
        question.params.checkAnswer ??= translations.h5p_check_answer || "Vérifier";
        question.params.tryAgain ??= translations.h5p_try_again || "Recommencer";
        question.params.showSolution ??= translations.h5p_show_solution || "Afficher la solution";
        question.params.feedbackHeader ??= translations.h5p_essay_feedback_header || "Commentaire";
        question.params.solutionTitle ??= translations.h5p_essay_solution_title || "Exemple de solution";
        question.params.remainingChars ??= translations.h5p_essay_remaining_chars || "Caractères restants : @chars";
        question.params.notEnoughChars ??= translations.h5p_essay_not_enough_chars || "Vous devez saisir au moins @chars caractères !";
        question.params.messageSave ??= translations.h5p_essay_message_save || "enregistré";
        question.params.placeholderText ??= translations.h5p_essay_placeholder_text || "Commencez à rédiger ici...";
        question.params.submitAnswer ??= translations.h5p_submit_answer || "Submit";
        question.params.ariaYourResult ??= translations.h5p_essay_aria_your_result || "Vous avez obtenu @score sur @total points";
        question.params.ariaNavigatedToSolution ??= translations.h5p_essay_aria_navigated_to_solution || "Navigation vers la solution.";
        question.params.ariaCheck ??= translations.h5p_a11y_check || "Check the answers.";
        question.params.ariaShowSolution ??= translations.h5p_a11y_show_solution || "Show the solution. You will be provided with a sample solution.";
        question.params.ariaRetry ??= translations.h5p_a11y_retry || "Retry the task. You can improve your previous answer if the author allowed that.";

        // 4. Comportement complet (aligné sur process())
        question.params.behaviour = {
            inputFieldSize: "10",
            enableRetry: true,
            ignoreScoring: false,
            minimumLength: undefined,
            maximumLength: undefined,
            percentagePassing: undefined,
            percentageMastering: undefined,
            pointsHost: 1,
            linebreakReplacement: " ",
            overrideForgiveMistakes: undefined,
            overrideCaseSensitive: undefined,
            ...question.params.behaviour
        };

        // 5. Feedback global par défaut
        question.params.overallFeedback = question.params.overallFeedback || [{ from: 0, to: 100, feedback: "" }];

        // 6. La solution est une réponse modèle fournie par l’auteur ou l’IA.
        question.params.solution = {
            ...(question.params.solution || {}),
            introduction: formatTextToHtml(question.params.solution?.introduction || ''),
            sample: formatTextToHtml(question.params.solution?.sample || '')
        };

        question.params.media = prepareQuestionMedia(question.params);

        return question;
    }
};
