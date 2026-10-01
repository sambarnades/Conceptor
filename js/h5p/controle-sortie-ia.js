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
/**
 * Les trous de Mistral Small 4 sur une activité de proportionnalité (1er oct. 2026) :
 * 5 tirages sur 7 sans la réponse dans leurs trous — `*x*` partout, une unité seule
 * (`*km*`, `*g de farine*`), le calcul entier (`*250 × 3 = 750*`), la réponse et
 * l'indice inversés (`*farine:325 g/500 g/625 g*`), deux valeurs dont une fausse
 * (`*500/300*`). Ce qui se DÉDUIT (le résultat d'un calcul, une valeur et son unité
 * mises à l'envers) est réparé par `json-healer.js`, avec ces mêmes motifs ; le reste
 * est signalé ici, pour la seconde demande.
 */
export const UNITE = String.raw`(?:km\/h|m\/s|[kcmd]?m[²³]?|[km]?g|[mcd]?[lL]|h|min|s|€|%|°C?|euros?|heures?|minutes?|secondes?|(?:centi|milli|kilo)?mètres?|(?:kilo|milli)?grammes?|(?:centi|milli)?litres?|degrés?)`;
const VALEUR = String.raw`-?\d+(?:[.,]\d+)?`;
/** Un calcul dont le résultat est une valeur : l'élève tape ce résultat. */
export const CALCUL_DEDUCTIBLE = new RegExp(String.raw`^[^=]*[\d)][^=]*=\s*(${VALEUR})\s*(${UNITE})?\s*$`, 'u');
/** Un indice qui est UNE valeur et son unité, sous une réponse sans chiffre : la réponse, à l'envers. */
export const VALEUR_ET_UNITE = new RegExp(String.raw`^\s*(${VALEUR})\s*(${UNITE})\s*$`, 'u');
/**
 * Une unité seule, sans la valeur : un symbole d'au moins deux caractères (`km`, `kg`,
 * `mL`, `km/h`…) ou une unité suivie de « de … » (`g de farine`). Un symbole d'une
 * lettre (`*s*` du pluriel) ou un mot (`*minutes*`) peut être la vraie réponse.
 */
const UNITE_SANS_VALEUR = /^(?:(?:km\/h|m\/s|[kcmd]m[²³]?|m[²³]|[km]g|[mcd][lL])|(?:[kcmd]?m|[km]?g|[mcd]?[lL]|h|min)\s+d(?:e|u|es|’|')\s*[\p{L}’' -]+)$/u;
const NOMBRE_PUR = /^-?\d+(?:[.,]\d+)?$/;
/** Deux entiers séparés par la barre oblique : une fraction, ou deux variantes ? */
export const FRACTION_ECRITE = /^\s*(\d+)\s*\/\s*(\d+)\s*$/;
/**
 * La phrase parle de fractions : un caractère de fraction, le vocabulaire, ou une
 * fraction écrite hors des trous. Alors `*4/6*` est une fraction (que le lecteur H5P
 * lirait « 4 » ou « 6 ») : le réparateur en fait deux trous, « *4* » puis « *6* ».
 * @param {string} ligne - La ligne du trou.
 */
export function contexteDeFractions(ligne) {
    const horsTrous = String(ligne).replace(/\*[^*\n]*\*/g, ' ');
    return /[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]|fraction|numérateur|dénominateur/iu.test(ligne) || /\d\s*\/\s*\d/.test(horsTrous);
}
const INCONNUES = new Set(['x', 'y', 'z']);

/** Les mots porteurs d'une variante : sans négation, articles ni petits mots. */
const motsPorteurs = v => v.split(/[\s'’]+/)
    .filter(m => m.length > 2 && !/^(?:est|pas|non|une|des|les|aucune?|jamais|cela|ceci)$/iu.test(m));
/** `b` nie `a` : elle en reprend tous les mots porteurs, et ajoute une négation. */
const nie = (a, b) => NEGATION.test(b) && !NEGATION.test(a) && motsPorteurs(a).length > 0
    && motsPorteurs(a).every(m => motsPorteurs(b).includes(m));

/**
 * La correction jointe à la seconde demande : elle nomme les pannes constatées et
 * redit, exemples à l'appui, ce qu'un trou doit porter. Partagée par la génération
 * « en un clic » (`ui.js`), qui redemandait le MÊME prompt, et par la file du parcours.
 * @param {string[]} defauts - `defautsSortieIA`.
 * @returns {string}
 */
export function correctionDesTrous(defauts) {
    return '\n\n# CORRECTION DEMANDÉE\n' +
        `Dans ta réponse précédente, des trous ne portaient pas leur réponse (${defauts.join(', ')}). ` +
        'Rends à nouveau le JSON COMPLET. Entre les astérisques, écris la RÉPONSE elle-même, telle que l’élève doit la ' +
        'taper ou la glisser : un mot, ou la valeur calculée (par exemple *36*), jamais un nom de variable, une consigne ni un blanc. ' +
        'Un trou n’a qu’une bonne réponse : pas de « bonne/mauvaise » séparées par une barre oblique ; si la consigne fait ' +
        'choisir, écris dans chaque trou la seule réponse juste pour cette phrase. En calcul, le trou porte le RÉSULTAT et ' +
        'l’unité reste dehors : « 5 stylos coûtent *12,5* € », jamais *x* €, *€*, *2,5 × 5 = 12,5* ni *prix:12,5 €* ' +
        '(après les deux-points, seulement un indice facultatif qui ne donne pas la réponse). Une fraction s’écrit avec son ' +
        'caractère (⅖) ou en décimal, jamais *3/20* : la barre oblique y séparerait « 3 » et « 20 ». Vérifie chaque calcul.';
}

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
    const ligneDe = index => texte.slice(texte.lastIndexOf('\n', index) + 1, (texte.indexOf('\n', index) + 1 || texte.length + 1) - 1);
    const contradictoires = [...texte.matchAll(/\*([^*\n]+)\*/g)]
        // Une fraction dans une phrase de fractions n'est pas deux variantes : le réparateur en fait deux trous.
        .filter(m => !(FRACTION_ECRITE.test(m[1].split(':')[0]) && contexteDeFractions(ligneDe(m.index))))
        .map(m => m[1].split(':')[0].split('/').map(r => r.trim().toLocaleLowerCase()).filter(Boolean))
        .filter(variantes => variantes.length > 1 && (
            variantes.some(a => variantes.some(b => nie(a, b)))
            || PAIRES_OPPOSEES.some(([a, b]) => variantes.includes(a) && variantes.includes(b))
            // Deux valeurs différentes (`*500/300*`) : l'une est fausse, et toutes deux comptent juste.
            || (variantes.every(v => NOMBRE_PUR.test(v)) && new Set(variantes.map(v => Number(v.replace(',', '.')))).size > 1))).length;
    if (contradictoires) { defauts.push('réponses contradictoires'); gravite += contradictoires; }

    // Chaque trou avec ce qui l'entoure : sa réponse, son indice, le texte qui le précède.
    const trous = [...texte.matchAll(/\*([^*\n]+)\*/g)].map(m => {
        const deux = m[1].indexOf(':');
        const debut = texte.lastIndexOf('\n', m.index) + 1;
        const fin = texte.indexOf('\n', m.index);
        return {
            reponse: (deux >= 0 ? m[1].slice(0, deux) : m[1]).trim(),
            indice: deux >= 0 ? m[1].slice(deux + 1).trim() : '',
            avant: texte.slice(debut, m.index),
            ligne: texte.slice(debut, fin < 0 ? texte.length : fin),
        };
    });
    // Le calcul entier dont le résultat ne se déduit pas (sinon le réparateur garde le résultat).
    const calculs = trous.filter(t => t.reponse.includes('=') && !CALCUL_DEDUCTIBLE.test(t.reponse)).length;
    if (calculs) { defauts.push('calcul à la place de la réponse'); gravite += calculs; }
    // `*x*` dans plusieurs trous : l'inconnue, pas la valeur.
    const inconnues = trous.filter(t => t.reponse.split('/').every(r => INCONNUES.has(r.trim().toLowerCase()))).length;
    if (inconnues >= 2) { defauts.push('inconnue à la place de la réponse'); gravite += inconnues; }
    // L'unité sans la valeur, dans une phrase qui compte.
    const unites = trous.filter(t => UNITE_SANS_VALEUR.test(t.reponse) && !/\d\s*$/.test(t.avant) && /\d/.test(t.ligne)).length;
    if (unites) { defauts.push('unité sans valeur'); gravite += unites; }
    // Le nom de la grandeur en réponse, plusieurs valeurs en indice : laquelle est juste ?
    const inverses = trous.filter(t => t.reponse && !/\d/.test(t.reponse) && /^\d/.test(t.indice) && t.indice.includes('/')).length;
    if (inverses) { defauts.push('réponse et indice inversés'); gravite += inverses; }
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
