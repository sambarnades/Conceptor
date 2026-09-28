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
 * generateActivityContent).
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
    if (moduleKey === 'DragTheWords') return analyserGlisserMots(lireChamp(contenu, 'textField'));
    return { defauts: [], gravite: 0 };
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
    return { defauts, gravite };
}
