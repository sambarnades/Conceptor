/**
 * @file Contrôle d'une sortie IA dont la FORME est valide mais le CONTENU inutilisable.
 *
 * Le healer répare une syntaxe ; il ne peut rien pour un contenu que le modèle a vidé
 * de son sens, faute de savoir ce qu'il aurait dû écrire. Cas d'origine (prod,
 * 25-09-2026, reproduit en local sur `mistral-small-4-119b`) : un « Glisser les mots »
 * dont les trous ne portent plus la réponse attendue mais un substitut —
 *   `le registre *emph(choisis un registre parmi `poésie`, `lyrique`…)*` (×4),
 *   `le registre *registre*` (×4), `le *___*`…
 * L'activité s'emballe sans erreur et arrive à l'élève inutilisable. Ce module le
 * détecte pour que la génération « en un clic » retente UNE fois (cf. ui.js,
 * generateActivityContent), comme la file des parcours (parcours-runner.js).
 * Couvre Glisser les mots, le Texte à trous (réponse en nom de variable, 1er oct. 2026)
 * et ces deux exercices dans un quiz.
 *
 * Volontairement étroit : chaque règle vise une panne constatée, jamais un choix
 * pédagogique discutable. Un faux positif coûte un appel IA, pas un blocage.
 */
import { parseDragTextWord } from './drag-text-grammar.js';

/** Au-delà, ce n'est plus un mot à glisser mais une phrase (ou une consigne recopiée). */
const MAX_MOTS_REPONSE = 6;
/** Une même réponse dans 3 trous : le prompt exige l'unicité, 3 n'est plus un accident. */
const MAX_REPETITIONS = 2;
/**
 * Un NOM DE VARIABLE à la place de la réponse — `*prix_réduit* €`, `*nombre_élèves* élèves`,
 * `*prix_10cahiers*` : Texte à trous d'un parcours réel (1er oct. 2026), où l'élève
 * aurait dû taper 36, 21, 12. Des mots liés par des tirets bas, sans espace : c'est un
 * identifiant, jamais la réponse qu'on attend d'un élève.
 */
const NOM_DE_VARIABLE = /^[\p{L}\p{N}]+(?:_[\p{L}\p{N}]+)+$/u;
/**
 * Des VARIANTES qui se contredisent : dans un trou, `/` sépare des réponses toutes justes.
 * `*situation de proportionnalité/ce n'est pas une situation de proportionnalité*`
 * (Texte à trous réel, 1er oct. 2026) : l'élève a raison quoi qu'il écrive.
 */
const NEGATION = /(?:^|[\s'’])(?:pas|non|aucune?|jamais)(?=$|[\s.,;:!?])/iu;
const PAIRES_OPPOSEES = [['oui', 'non'], ['vrai', 'faux'], ['juste', 'faux']];
/** Les mots porteurs d'une variante : sans négation, articles ni petits mots. */
const motsPorteurs = v => v.split(/[\s'’]+/)
    .filter(m => m.length > 2 && !/^(?:est|pas|non|une|des|les|aucune?|jamais|cela|ceci)$/iu.test(m));
/** `b` nie `a` : elle en reprend tous les mots porteurs, et ajoute une négation. */
const nie = (a, b) => NEGATION.test(b) && !NEGATION.test(a) && motsPorteurs(a).length > 0
    && motsPorteurs(a).every(m => motsPorteurs(b).includes(m));

/**
 * @param {string} moduleKey - clé du module (definitions.js)
 * @param {string} contenu - JSON brut renvoyé par l'IA (avant healer)
 * @returns {string[]} défauts constatés ; tableau vide si rien à redire
 */
export function defautsSortieIA(moduleKey, contenu) {
    return analyser(moduleKey, contenu).defauts;
}

/**
 * Gravité d'une sortie : nombre de trous touchés par un défaut (0 = saine). Sert à
 * départager la sortie d'origine et celle du second essai — compter les CATÉGORIES
 * ne suffit pas : « moud » dans 3 trous et « moulin » dans 4 font chacun UN défaut,
 * et c'était la pire des deux qui l'emportait (constaté en réel, 25-09-2026).
 * @param {string} moduleKey
 * @param {string} contenu
 * @returns {number}
 */
export function graviteSortieIA(moduleKey, contenu) {
    return analyser(moduleKey, contenu).gravite;
}

function analyser(moduleKey, contenu) {
    switch (moduleKey) {
        case 'DragTheWords': return analyserGlisserMots(lireChamp(contenu, 'textField'));
        case 'FillInTheBlanks': return analyserTrous(lireChamp(contenu, 'questions'));
        case 'QuizSet': case 'QuizSetQCM': case 'QuizSetVF': return analyserQuiz(contenu);
        default: return { defauts: [], gravite: 0 };
    }
}

/**
 * Les exercices à trous d'un quiz — Glisser les mots, Texte à trous — ont les mêmes
 * pannes que seuls. Un JSON illisible tel quel n'est pas jugé ici : le healer passera.
 */
function analyserQuiz(contenu) {
    let questions;
    try {
        const obj = JSON.parse(contenu);
        questions = (obj && obj.params && obj.params.questions) || (obj && obj.questions);
    } catch { return { defauts: [], gravite: 0 }; }
    if (!Array.isArray(questions)) return { defauts: [], gravite: 0 };
    const defauts = new Set();
    let gravite = 0;
    for (const q of questions) {
        const lib = String((q && q.library) || '').split(' ')[0];
        const p = (q && q.params) || {};
        const r = lib === 'H5P.DragText' ? analyserGlisserMots(String(p.textField ?? ''))
            : lib === 'H5P.Blanks' ? analyserTrous(Array.isArray(p.questions) ? p.questions.join('\n') : String(p.questions ?? ''))
                : null;
        if (!r) continue;
        r.defauts.forEach(d => defauts.add(d));
        gravite += r.gravite;
    }
    return { defauts: [...defauts], gravite };
}

/**
 * Texte à trous : `*réponse*`, `*réponse/variante*`, `*réponse:indice*`. Mêmes pannes que
 * Glisser les mots pour ce qui ne dépend pas de l'unicité (un même mot peut combler deux
 * trous d'un texte à trous).
 */
function analyserTrous(texte) {
    const defauts = [];
    let gravite = 0;
    const orphelins = texte.split('\n').filter(ligne => (ligne.match(/\*/g) || []).length % 2).length;
    if (orphelins) { defauts.push('astérisque orphelin'); gravite += orphelins; }
    const reponses = [...texte.matchAll(/\*([^*\n]+)\*/g)]
        .flatMap(m => m[1].split(':')[0].split('/').map(r => r.trim()));
    const vides = reponses.filter(r => !/[\p{L}\p{N}]/u.test(r)).length;
    if (vides) { defauts.push('trou sans réponse'); gravite += vides; }
    const variables = reponses.filter(r => NOM_DE_VARIABLE.test(r)).length;
    if (variables) { defauts.push('réponse en nom de variable'); gravite += variables; }
    const contradictoires = [...texte.matchAll(/\*([^*\n]+)\*/g)]
        .map(m => m[1].split(':')[0].split('/').map(r => r.trim().toLocaleLowerCase()).filter(Boolean))
        .filter(variantes => variantes.length > 1 && (
            variantes.some(a => variantes.some(b => nie(a, b)))
            || PAIRES_OPPOSEES.some(([a, b]) => variantes.includes(a) && variantes.includes(b)))).length;
    if (contradictoires) { defauts.push('réponses contradictoires'); gravite += contradictoires; }
    return { defauts, gravite };
}

/**
 * Valeur d'un champ texte du JSON. Si le JSON ne se lit pas tel quel (antislash LaTeX
 * que seul le healer sait réparer), on prend le littéral brut : les défauts cherchés
 * ne dépendent pas des échappements.
 */
function lireChamp(contenu, cle) {
    try {
        const obj = JSON.parse(contenu);
        const v = (obj && obj.params && obj.params[cle] !== undefined) ? obj.params[cle] : obj?.[cle];
        return Array.isArray(v) ? v.join('\n') : String(v ?? '');
    } catch {
        const m = String(contenu ?? '').match(new RegExp(`"${cle}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
        // Saut de ligne JSON (`\n`), mais pas un `\\neq` LaTeX dont l'antislash est doublé.
        return m ? m[1].replace(/(?<!\\)\\n/g, '\n') : '';
    }
}

function analyserGlisserMots(texte) {
    const defauts = [];
    let gravite = 0;
    // « …c'est le registre *. » : le trou n'a plus de réponse, et H5P apparie alors
    // cet astérisque avec celui d'une autre ligne — étiquettes absurdes.
    const orphelins = texte.split('\n').filter(ligne => (ligne.match(/\*/g) || []).length % 2).length;
    if (orphelins) { defauts.push('astérisque orphelin'); gravite += orphelins; }
    const reponses = [...texte.matchAll(/\*([^*\n]+)\*/g)].map(m => parseDragTextWord(m[1]).answer.trim());
    const vides = reponses.filter(r => !/[\p{L}\p{N}]/u.test(r)).length;
    if (vides) { defauts.push('trou sans réponse'); gravite += vides; }
    const occurrences = new Map();
    for (const r of reponses) {
        const k = r.toLocaleLowerCase();
        occurrences.set(k, (occurrences.get(k) || 0) + 1);
    }
    const repetees = [...occurrences.values()].filter(n => n > MAX_REPETITIONS);
    if (repetees.length) { defauts.push('même réponse dans plusieurs trous'); gravite += repetees.reduce((a, n) => a + n, 0); }
    const longues = reponses.filter(r => r.split(/\s+/).length > MAX_MOTS_REPONSE).length;
    if (longues) { defauts.push('réponse trop longue'); gravite += longues; }
    const variables = reponses.filter(r => NOM_DE_VARIABLE.test(r)).length;
    if (variables) { defauts.push('réponse en nom de variable'); gravite += variables; }
    return { defauts, gravite };
}
