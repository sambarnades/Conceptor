/**
 * JSON Healer - Module de réparation défensive pour le JSON généré par l'IA (Gemini).
 *
 * L'objectif est de corriger les erreurs communes de syntaxe et de structure
 * sans altérer les fichiers déjà valides.
 */

import { generateUUID, debugLog, DEBUG } from '../core/utils.js';
import { registerConverters, getConstraints, getConverter, applyToPath, stripHtmlKeepLatex } from './field-constraints.js';

// =======================================================================
// CONSTANTES PARTAGÉES
// =======================================================================

/** Plafonds anti-DoS pour les activités à grille (Crossword, FindTheWords) — S12 */
const GRID_MAX_WORDS = 50;
const GRID_MAX_ANSWER_LENGTH = 30;

/** Map des versions de bibliothèques H5P (utilisée par healJsonObject et healStructureForActivity) */
const H5P_LIB_VERSIONS = {
    'H5P.MultiChoice': '1.16',
    'H5P.TrueFalse': '1.8',
    'H5P.Blanks': '1.14',
    'H5P.DragText': '1.10',
    'H5P.MarkTheWords': '1.11',
    'H5P.Essay': '1.5',
    'H5P.SingleChoiceSet': '1.11',
    'H5P.Summary': '1.10',
    'H5P.DragQuestion': '1.15',
    'H5P.Dialogcards': '1.9',
    'H5P.CoursePresentation': '1.27',
    'H5P.InteractiveBook': '1.15',
    'H5P.InteractiveVideo': '1.28'
};

/** Palette de couleurs par défaut pour Chart */
const CHART_DEFAULT_COLORS = ['#1f4fff', '#5b2e90', '#ff7a18', '#22c55e', '#ef4444'];

/** Ensemble des moduleKeys H5P (pour distinguer des types Moodle) */
const H5P_MODULE_KEYS = new Set([
    'Timeline', 'Flashcards', 'QuizSet', 'QuizSetQCM', 'QuizSetVF',
    'Glossary', 'Crossword', 'Essay', 'Summary', 'DragTheWords',
    'DragAndDrop', 'FillInTheBlanks', 'MarkTheWords', 'TrueFalse',
    'MultipleChoice', 'FindTheWords', 'SortParagraphs', 'SingleChoiceSet',
    'DialogCards', 'Dictation', 'ComplexFillTheBlanks', 'Chart', 'CoursePresentation',
    'InteractiveBook', 'InteractiveVideo'
]);

export function healJsonString(jsonStr) {
    let healed = jsonStr.trim();

    /**
     * Échappement des caractères de contrôle bruts à l'intérieur des chaînes JSON.
     * La spec JSON interdit les caractères U+0000 à U+001F non-échappés dans les strings.
     * Les LLMs (Gemini, etc.) insèrent parfois des sauts de ligne littéraux au lieu de \n.
     * On parcourt caractère par caractère en traquant si on est dans une string.
     */
    let escaped = '';
    let inStr = false;
    let prevBackslash = false;
    for (let i = 0; i < healed.length; i++) {
        const ch = healed[i];
        const code = ch.charCodeAt(0);

        if (prevBackslash) {
            escaped += ch;
            prevBackslash = false;
            continue;
        }

        if (ch === '\\' && inStr) {
            escaped += ch;
            prevBackslash = true;
            continue;
        }

        if (ch === '"') {
            inStr = !inStr;
            escaped += ch;
            continue;
        }

        // Caractère de contrôle brut détecté à l'intérieur d'une string → échapper
        if (inStr && code < 0x20) {
            switch (ch) {
                case '\n': escaped += '\\n'; break;
                case '\r': escaped += '\\r'; break;
                case '\t': escaped += '\\t'; break;
                default: escaped += '\\u' + code.toString(16).padStart(4, '0'); break;
            }
            continue;
        }

        escaped += ch;
    }
    healed = escaped;

    /**
     * Correction des backslashes mal échappés (notamment pour LaTeX).
     * On double les backslashes qui ne sont PAS suivis d'un caractère d'échappement JSON valide.
     * MAIS : certains caractères valides (t, n, r, b, f) sont aussi des débuts de commandes LaTeX.
     * Heuristique : On double quand même si c'est suivi d'une autre lettre (ex: \times, \theta, \newline).
     * On ne double PAS si c'est \" , \\ , \/ ou \u (unicode).
     */
    // NB : pas de lookbehind (?<!\\) ici — SyntaxError à la compilation sur Safari < 16.4.
    // On teste le caractère précédent dans le callback (même technique que le second passage ci-dessous).
    healed = healed.replace(/\\(?![\\\/\"u])/g, (match, offset, s) => {
        // Équivalent de (?<!\\) : ne rien faire si le backslash est précédé d'un autre backslash
        if (offset > 0 && s[offset - 1] === '\\') return match;

        const char = s[offset + 1];
        const next = s[offset + 2];

        // Exception pour \n et \r : on ne double QUE s'ils sont suivis d'une lettre minuscule (LaTeX)
        // Les commandes LaTeX sont toujours en minuscules (\neq, \nabla, \nu…)
        // Une majuscule après \n indique un début de phrase → c'est un saut de ligne
        if ((char === 'n' || char === 'r') && (!next || !/[a-z]/.test(next))) {
            return match;
        }

        // Pour \t, \b, \f et tout le reste (\( , \pi , \times ...) -> On double systématiquement
        return '\\\\';
    });

    /**
     * Second passage : corriger les séquences impaires de backslashes > 1.
     * Le lookbehind (?<!\\) échoue sur \\\( car le 3e \ est précédé de \.
     * On utilise \\{3,} pour capturer TOUTES les backslashes consécutives d'un coup
     * (sans backtracking), puis on vérifie si le nombre est impair.
     * Ex: \\\( → \\\\( (le 3e \ est doublé → JSON valide).
     *     \\\\( reste inchangé (4 = pair → déjà valide).
     */
    healed = healed.replace(/\\{3,}/g, (match, offset, s) => {
        if (match.length % 2 === 0) return match; // pair = toutes les paires sont fermées
        const after = s[offset + match.length];
        if (after && /[\\\/\"ubfnrt]/.test(after)) return match; // le \ solitaire forme un escape valide
        return match + '\\'; // impair + non-escape → ajouter un \ pour fermer la paire
    });

    return healed;
}

/**
 * Vérifie si une structure JSON a besoin de réparation (structure Gemini aplatie).
 * @param {Object} obj - L'objet JSON parsé.
 * @param {string} moduleKey - Le type de module attendu.
 * @returns {boolean} True si une réparation structurelle est nécessaire.
 */
export function isHealNeeded(obj, moduleKey) {
    if (!obj) return false;

    // Cas QuizSet : Gemini oublie souvent d'envelopper les questions dans 'params'
    if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') && Array.isArray(obj.questions)) {
        const firstQuestion = obj.questions[0];
        if (firstQuestion && !firstQuestion.params && (firstQuestion.question || firstQuestion.taskDescription)) {
            return true;
        }
    }

    // Autres cas à ajouter ici si besoin
    return false;
}

/**
 * Parcourt récursivement l'objet pour entourer le LaTeX "nu" par des délimiteurs \( ... \).
 * @param {any} item - L'élément à traiter (string, object, array).
 * @returns {any} L'élément traité.
 */
export function autoWrapLatex(item) {
    if (typeof item === 'string') {
        // 0. Compatibilité : dfrac -> frac,operatorname -> text,Arg -> text{Arg} (KaTeX H5P limité)
        let processed = item.replace(/\\dfrac/g, '\\frac')
            .replace(/\\operatorname/g, '\\text')
            .replace(/\\Arg/g, '\\text{Arg}');

        // Liste des commandes LaTeX communes déclenchant l'auto-wrapping \( \)
        const latexCommands = [
            // Structures et opérations de base
            'sqrt', 'frac', 'mathbb', 'text', 'operatorname', 'overline', 'bar',
            'vec', 'hat', 'tilde',
            // Opérateurs arithmétiques et logiques
            'times', 'div', 'cdot', 'pm', 'mp', 'circ',
            // Relations
            'geq', 'leq', 'ge', 'le', 'neq', 'approx', 'equiv', 'sim', 'simeq',
            'propto', 'll', 'gg', 'perp', 'parallel',
            'leqslant', 'geqslant', 'nleq', 'ngeq',
            'prec', 'succ', 'preceq', 'succeq', 'cong',
            'mid', 'nmid',
            // Fonctions trigonométriques
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'arcsin', 'arccos', 'arctan',
            'sinh', 'cosh', 'tanh',
            // Fonctions analytiques
            'ln', 'log', 'exp', 'lim', 'sup', 'inf', 'max', 'min',
            // Lettres grecques (minuscules courantes)
            'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon',
            'theta', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho',
            'sigma', 'tau', 'phi', 'varphi', 'chi', 'psi', 'omega',
            'eta', 'zeta', 'kappa', 'iota', 'upsilon',
            // Lettres grecques (majuscules)
            'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi',
            'Sigma', 'Phi', 'Psi', 'Omega',
            // Ensembles et logique
            'in', 'notin', 'subset', 'subseteq', 'supset', 'supseteq',
            'nsubseteq', 'complement',
            'cup', 'cap', 'setminus', 'emptyset', 'varnothing',
            'forall', 'exists', 'nexists', 'neg', 'lnot', 'land', 'lor', 'wedge', 'vee',
            // Analyse et calcul
            'infin', 'infty', 'nabla', 'partial', 'sum', 'prod',
            'int', 'iint', 'iiint', 'oint',
            // Combinatoire
            'binom',
            // Flèches
            'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow',
            'leftrightarrow', 'Leftrightarrow', 'mapsto', 'to',
            'implies', 'iff', 'gets',
            'longmapsto', 'Longrightarrow', 'Longleftrightarrow',
            'hookrightarrow', 'uparrow', 'downarrow', 'nearrow', 'searrow',
            // Délimiteurs
            'lfloor', 'rfloor', 'lceil', 'rceil', 'langle', 'rangle',
            'lVert', 'rVert', 'Vert',
            // Points de suspension
            'ldots', 'cdots', 'vdots', 'ddots', 'dots',
            // Divers
            'Arg', 'arg', 'oplus', 'otimes', 'odot',
            'star', 'bullet', 'ast', 'dagger', 'ddagger',
            'angle', 'triangle', 'square', 'aleph', 'hbar', 'ell',
            'Re', 'Im', 'wp', 'prime', 'checkmark', 'complement',
            'ni', 'digamma',
            // Fonctions supplémentaires
            'card', 'sgn', 'Pr', 'lcm', 'hom'
        ];

        const commandRegex = new RegExp(`\\\\(${latexCommands.join('|')})(?![a-zA-Z])`, 'g');

        commandRegex.lastIndex = 0;
        if (commandRegex.test(processed)) {
            if (!processed.includes('\\(') && !processed.includes('\\)') &&
                !processed.includes('\\[') && !processed.includes('\\]')) {
                // Cas simple : AUCUN délimiteur math existant (ni inline \(\) ni display
                // \[\]) → envelopper toute la chaîne en inline. On teste aussi \[ \] pour
                // NE PAS ré-emballer une formule display en inline (\[…\] → \(\[…\]\), math
                // imbriquée invalide) : ce cas passe par la branche mixte qui préserve les
                // blocs \[…\] et convertit seulement le LaTeX nu HORS blocs.
                const wrapped = `\\(${processed.trim()}\\)`;
                debugLog('json-healer', `[JSON Healer] Auto-wrap LaTeX: "${processed}" -> "${wrapped}"`);
                return wrapped;
            } else {
                // Cas mixte : la chaîne contient déjà des blocs \(...\) ou \[...\]
                // → convertir le LaTeX nu en Unicode dans les parties hors blocs math
                // split() avec groupe capturant garde les blocs math aux indices impairs
                // Reconnaît aussi les délimiteurs mixtes \(...$ et \[...$$  (réparés plus tard par fixMixedDelimiters)
                const parts = processed.split(/(\\\([\s\S]*?(?:\\\)|\$)|\\\[[\s\S]*?(?:\\\]|\$\$))/g);
                let changed = false;
                for (let i = 0; i < parts.length; i++) {
                    if (i % 2 === 0 && parts[i]) {
                        // Segment hors math : convertir les commandes LaTeX nues en Unicode
                        commandRegex.lastIndex = 0;
                        if (commandRegex.test(parts[i])) {
                            parts[i] = latexToUnicode(parts[i]);
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    debugLog('json-healer', `[JSON Healer] LaTeX nu → Unicode dans chaîne mixte`);
                    return parts.join('');
                }
                return processed;
            }
        }
        return processed;
    } else if (Array.isArray(item)) {
        return item.map(autoWrapLatex);
    } else if (item !== null && typeof item === 'object') {
        const newItem = {};
        for (const [key, value] of Object.entries(item)) {
            newItem[key] = autoWrapLatex(value);
        }
        return newItem;
    }
    return item;
}

/**
 * Convertit les délimiteurs LaTeX $...$ et $$...$$ en \(...\) et \[...\]
 * que MathJax (H5P et Moodle/Éléa) attend pour le rendu.
 * @param {string} text
 * @returns {string}
 */
function convertLatexDelimiters(text) {
    if (!text || typeof text !== 'string') return text;
    // 1. $$...$$ → \[...\] (display math, avant inline pour éviter les conflits)
    let result = text.replace(/\$\$([\s\S]+?)\$\$/g, '\\[$1\\]');
    // 2. $...$ → \(...\) (inline math)
    // Garde anti over-healing : « l'article coûte 5$ et le second 10$ » ne doit PAS être converti.
    // Marqueurs monétaires : un chiffre immédiatement AVANT le $ ouvrant (« 5$ … » : ce $
    // ferme un montant, il n'ouvre pas une formule), ou un espace collé au $ ouvrant/fermant
    // (convention TeX : pas de blanc aux bords). Un contenu visiblement LaTeX (\ ^ _ { })
    // est toujours converti. « $2+3$ » et « $5$ » restent donc convertis.
    result = result.replace(/\$(.+?)\$/g, (match, inner, offset, str) => {
        const looksLikeLatex = /[\\^_{}]/.test(inner);
        const monetaryOpening = offset > 0 && /[0-9]/.test(str[offset - 1]);
        const strictTex = !/^\s/.test(inner) && !/\s$/.test(inner);
        if (looksLikeLatex || (!monetaryOpening && strictTex)) {
            return '\\(' + inner + '\\)';
        }
        debugLog('json-healer', `[JSON Healer] $...$ conservé tel quel (texte monétaire probable) : "${match}"`);
        return match;
    });
    return result;
}

/**
 * Applique convertLatexDelimiters récursivement sur toutes les chaînes d'un objet.
 * Commun H5P et Moodle : convertit $...$ → \(...\) et $$...$$ → \[...\].
 * @param {any} item
 * @returns {any}
 */
export function convertLatexDelimitersDeep(item) {
    if (typeof item === 'string') return convertLatexDelimiters(item);
    if (Array.isArray(item)) return item.map(convertLatexDelimitersDeep);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = convertLatexDelimitersDeep(value);
        }
        return result;
    }
    return item;
}

/**
 * Convertit les environnements LaTeX (\begin{equation}, \begin{align}, etc.)
 * en délimiteurs MathJax \[...\] supportés par H5P et Moodle.
 * ChatGPT/GPT-4 génère souvent ces environnements au lieu de \(...\) ou \[...\].
 * @param {string} text
 * @returns {string}
 */
function convertLatexEnvironments(text) {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    // Environnements display math → \[...\]
    const displayEnvs = ['equation', 'equation\\*', 'align', 'align\\*', 'gather', 'gather\\*', 'multline', 'multline\\*', 'displaymath'];
    for (const env of displayEnvs) {
        const regex = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`, 'g');
        const before = result;
        result = result.replace(regex, '\\[$1\\]');
        if (result !== before) {
            debugLog('json-healer', `[JSON Healer] Environnement LaTeX \\begin{${env}} converti en \\[...\\]`);
        }
    }
    // Environnements inline math → \(...\)  (rare mais possible)
    const inlineEnvs = ['math'];
    for (const env of inlineEnvs) {
        const regex = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`, 'g');
        const before = result;
        result = result.replace(regex, '\\($1\\)');
        if (result !== before) {
            debugLog('json-healer', `[JSON Healer] Environnement LaTeX \\begin{${env}} converti en \\(...\\)`);
        }
    }
    return result;
}

/**
 * Applique convertLatexEnvironments récursivement sur toutes les chaînes.
 * @param {any} item
 * @returns {any}
 */
export function convertLatexEnvironmentsDeep(item) {
    if (typeof item === 'string') return convertLatexEnvironments(item);
    if (Array.isArray(item)) return item.map(convertLatexEnvironmentsDeep);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = convertLatexEnvironmentsDeep(value);
        }
        return result;
    }
    return item;
}

/**
 * Supprime \displaystyle dans les blocs LaTeX inline \(...\).
 * Les IA ajoutent parfois \displaystyle dans des formules inline, ce qui est
 * inutile et peut causer des problèmes de rendu dans H5P.
 * @param {string} text
 * @returns {string}
 */
function stripDisplaystyle(text) {
    if (!text || typeof text !== 'string') return text;
    // Dans les blocs \(...\) : retirer \displaystyle (avec espace optionnel après)
    let result = text.replace(/\\\([\s\S]*?\\\)/g, (block) => {
        const cleaned = block.replace(/\\displaystyle\s*/g, '');
        if (cleaned !== block) {
            debugLog('json-healer', '[JSON Healer] \\displaystyle supprimé dans formule inline');
        }
        return cleaned;
    });
    // Dans les blocs \[...\] aussi
    result = result.replace(/\\\[[\s\S]*?\\\]/g, (block) => {
        return block.replace(/\\displaystyle\s*/g, '');
    });
    return result;
}

/**
 * Applique stripDisplaystyle récursivement.
 * @param {any} item
 * @returns {any}
 */
function stripDisplaystyleDeep(item) {
    if (typeof item === 'string') return stripDisplaystyle(item);
    if (Array.isArray(item)) return item.map(stripDisplaystyleDeep);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = stripDisplaystyleDeep(value);
        }
        return result;
    }
    return item;
}

/**
 * Corrige les entités HTML dans les blocs LaTeX.
 * Les IA génèrent parfois &lt; au lieu de <, &gt; au lieu de >, &amp; au lieu de &
 * à l'intérieur des formules mathématiques.
 * @param {string} text
 * @returns {string}
 */
function fixHtmlEntitiesInLatex(text) {
    if (!text || typeof text !== 'string') return text;
    const fixEntities = (block) => {
        return block
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&le;/g, '\\leq')
            .replace(/&ge;/g, '\\geq');
    };
    // Dans les blocs \(...\)
    let result = text.replace(/\\\([\s\S]*?\\\)/g, (block) => {
        const fixed = fixEntities(block);
        if (fixed !== block) {
            debugLog('json-healer', '[JSON Healer] Entités HTML corrigées dans formule LaTeX');
        }
        return fixed;
    });
    // Dans les blocs \[...\]
    result = result.replace(/\\\[[\s\S]*?\\\]/g, fixEntities);
    return result;
}

/**
 * Applique fixHtmlEntitiesInLatex récursivement.
 * @param {any} item
 * @returns {any}
 */
function fixHtmlEntitiesInLatexDeep(item) {
    if (typeof item === 'string') return fixHtmlEntitiesInLatex(item);
    if (Array.isArray(item)) return item.map(fixHtmlEntitiesInLatexDeep);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = fixHtmlEntitiesInLatexDeep(value);
        }
        return result;
    }
    return item;
}

/**
 * Répare les délimiteurs LaTeX mixtes ou mal assortis.
 * Ex: \( ... $ → \( ... \)   ou   $ ... \) → \( ... \)
 * Aussi : blocs LaTeX vides \(\) ou \[\] → supprimés.
 * @param {string} text
 * @returns {string}
 */
function fixMixedDelimiters(text) {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    // \( ... $ → \( ... \)  (ouvert en \( fermé en $)
    // Utilise [\s\S]*? pour capturer tout y compris ) dans \), mais vérifie qu'il n'y a pas déjà un \) fermant
    result = result.replace(/\\\(([\s\S]*?)\$/g, (match, content) => {
        // Vérifier qu'il n'y a pas de \) entre \( et $ (sinon c'est un bloc valide suivi d'un $ indépendant)
        if (!content.includes('\\)')) {
            debugLog('json-healer', '[JSON Healer] Délimiteur mixte \\(...$ réparé en \\(...\\)');
            return `\\(${content}\\)`;
        }
        return match;
    });
    // $ ... \) → \( ... \)  (ouvert en $ fermé en \))
    result = result.replace(/\$([\s\S]*?)\\\)/g, (match, content) => {
        if (!content.includes('\\(') && !content.includes('$')) {
            debugLog('json-healer', '[JSON Healer] Délimiteur mixte $...\\) réparé en \\(...\\)');
            return `\\(${content}\\)`;
        }
        return match;
    });
    // Blocs vides \(\) ou \[\] → supprimés
    const before = result;
    result = result.replace(/\\\(\s*\\\)/g, '').replace(/\\\[\s*\\\]/g, '');
    if (result !== before) {
        debugLog('json-healer', '[JSON Healer] Bloc LaTeX vide supprimé');
    }
    return result;
}

/**
 * Applique fixMixedDelimiters récursivement.
 * @param {any} item
 * @returns {any}
 */
function fixMixedDelimitersDeep(item) {
    if (typeof item === 'string') return fixMixedDelimiters(item);
    if (Array.isArray(item)) return item.map(fixMixedDelimitersDeep);
    if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = fixMixedDelimitersDeep(value);
        }
        return result;
    }
    return item;
}

/**
 * Normalise les formules LaTeX double-échappées produites par l'IA.
 * Après JSON.parse, l'IA produit souvent \\( \\sqrt{x} \\) (double backslash)
 * au lieu de \( \sqrt{x} \) (simple backslash) attendu par MathJax/Moodle.
 * Détecte la présence de \\( ou \\[ et réduit tous les \\\\ en \\ d'un niveau.
 * @param {any} item - L'élément à normaliser (string, object, array).
 * @returns {any} L'élément normalisé.
 */
export function normalizeDoubleEscapedLatex(item) {
    if (typeof item === 'string') {
        let result = item;

        // Cas 1 : Délimiteurs double-échappés \\( → \(
        // En JS : '\\\\(' est la chaîne littérale \\( (2 backslashes + paren)
        if (result.includes('\\\\(') || result.includes('\\\\[')) {
            result = result.replaceAll('\\\\', '\\');
            if (result !== item) {
                debugLog('json-healer', '[JSON Healer] Normalisation LaTeX double-échappé (délimiteurs) détectée et corrigée');
            }
        }

        // Cas 2 : Commandes double-échappées à l'intérieur de blocs \(...\) correctement délimités
        // Ex: \(\\sqrt{x}\) → \(\sqrt{x}\)  (les délimiteurs sont OK mais les commandes ont \\)
        result = result.replace(/\\\([\s\S]*?\\\)/g, (block) => {
            // Dans ce bloc, remplacer \\ suivi d'une lettre (commande LaTeX) par \ + lettre
            const fixed = block.replace(/\\\\([a-zA-Z])/g, '\\$1');
            if (fixed !== block) {
                debugLog('json-healer', '[JSON Healer] Normalisation LaTeX double-échappé (commandes dans \\(...\\)) détectée et corrigée');
            }
            return fixed;
        });

        // Même chose pour les blocs \[...\]
        result = result.replace(/\\\[[\s\S]*?\\\]/g, (block) => {
            const fixed = block.replace(/\\\\([a-zA-Z])/g, '\\$1');
            return fixed;
        });

        return result;
    } else if (Array.isArray(item)) {
        return item.map(normalizeDoubleEscapedLatex);
    } else if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = normalizeDoubleEscapedLatex(value);
        }
        return result;
    }
    return item;
}

/**
 * Répare les commandes LaTeX cassées par l'interprétation des échappements JSON.
 * Lorsque l'IA génère `\\(a\neq0\\)`, le `\n` dans `\neq` est un échappement JSON valide (newline),
 * donc JSON.parse réussit mais produit une chaîne avec un retour à la ligne au lieu de `\neq`.
 * Cette fonction détecte et répare ces cas en restaurant les backslashes dans les blocs LaTeX.
 * @param {any} item - L'élément à réparer (string, object, array).
 * @returns {any} L'élément réparé.
 */
export function repairBrokenLatexEscapes(item) {
    if (typeof item === 'string') {
        // Réparer les caractères de contrôle à l'intérieur des blocs \(...\)
        return item.replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => {
            let repaired = inner;
            // \n (newline 0x0A) → probablement \neq, \nabla, \nu, etc.
            repaired = repaired.replace(/\n/g, '\\n');
            // \t (tab 0x09) → probablement \theta, \times, \tau, \text, etc.
            repaired = repaired.replace(/\t/g, '\\t');
            // \r (carriage return 0x0D) → probablement \rightarrow, \rho, etc.
            repaired = repaired.replace(/\r/g, '\\r');
            // \f (form feed 0x0C) → probablement \frac, \forall, etc.
            repaired = repaired.replace(/\f/g, '\\f');
            // \b (backspace 0x08) → probablement \beta, \bar, etc.
            // Note : utiliser [\b] car \b seul est une limite de mot en regex
            repaired = repaired.replace(/[\b]/g, '\\b');

            if (repaired !== inner) {
                debugLog('json-healer', `[JSON Healer] Réparation LaTeX : caractères de contrôle restaurés dans \\(...\\)`);
            }
            return `\\(${repaired}\\)`;
        });
    } else if (Array.isArray(item)) {
        return item.map(repairBrokenLatexEscapes);
    } else if (item !== null && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            result[key] = repairBrokenLatexEscapes(value);
        }
        return result;
    }
    return item;
}

/**
 * DIAGNOSTIC (mode ?debug uniquement) — détecte les formules LaTeX déséquilibrées d'un objet :
 * délimiteur `\(`/`\)` ou `\[`/`\]` orphelin, ou accolades `{ }` déséquilibrées dans une formule.
 * NE MODIFIE RIEN. Sert d'alerte QA : le healer ne répare le LaTeX QUE dans des blocs `\(...\)`
 * équilibrés, donc un délimiteur ouvrant oublié par l'IA passe entre les mailles et livre une
 * math cassée (constaté sur ~2 % des activités math, campagne de tests réels 2026-07). Cette
 * détection ne cherche pas à corriger (ambigu) mais à signaler en développement.
 * @param {*} item - Objet/tableau/chaîne à inspecter.
 * @returns {string[]} Descriptions courtes des déséquilibres trouvés (vide si tout est équilibré).
 */
export function checkLatexBalance(item) {
    const issues = [];
    const visit = (s) => {
        if (s.indexOf('\\(') === -1 && s.indexOf('\\)') === -1 && s.indexOf('\\[') === -1 && s.indexOf('\\]') === -1) return;
        const oi = (s.match(/\\\(/g) || []).length, ci = (s.match(/\\\)/g) || []).length;
        const od = (s.match(/\\\[/g) || []).length, cd = (s.match(/\\\]/g) || []).length;
        if (oi !== ci) issues.push(`\\( (${oi}) ≠ \\) (${ci}) : « ${s.slice(0, 60)}… »`);
        if (od !== cd) issues.push(`\\[ (${od}) ≠ \\] (${cd}) : « ${s.slice(0, 60)}… »`);
        for (const f of s.match(/\\\(([\s\S]*?)\\\)/g) || []) {
            const ob = (f.match(/\{/g) || []).length, cb = (f.match(/\}/g) || []).length;
            if (ob !== cb) { issues.push(`accolades { } déséquilibrées : « ${f.slice(0, 50)}… »`); break; }
        }
    };
    const walk = (x) => {
        if (typeof x === 'string') visit(x);
        else if (Array.isArray(x)) x.forEach(walk);
        else if (x && typeof x === 'object') Object.values(x).forEach(walk);
    };
    walk(item);
    return issues;
}

/**
 * Répare un objet JSON selon les patterns connus de l'IA.
 * @param {Object} obj - L'objet JSON à réparer.
 * @param {string} moduleKey - Le type de module.
 * @returns {Object} L'objet réparé.
 */
/** Clés que H5P reconnaît dans le `metadata` d'un contenu (h5p.json / sous-contenus). */
const CLES_METADATA_H5P = new Set([
    'title', 'a11yTitle', 'license', 'licenseVersion', 'licenseExtras', 'authors', 'changes',
    'extraTitle', 'contentType', 'source', 'yearFrom', 'yearTo', 'authorComments', 'defaultLanguage'
]);

/**
 * Sous-contenu H5P (`{library, metadata, params}`) dont l'IA a rangé le CONTENU dans
 * `metadata` et laissé `params` absent ou vide. Deux variantes constatées en réel sur
 * un Quiz mixte (25-09-2026, mistral-small-4-119b) :
 *   { library: "H5P.Blanks 1.14", metadata: { title, taskDescription, questions, … } }
 *   { library: "H5P.Essay 1.5",   metadata: { title, params: { taskDescription, keywords, … } } }
 * L'enveloppe `params` posée ensuite restait VIDE et le processeur refusait la question
 * (« Blanks : un paragraphe à compléter est requis ») : génération perdue pour
 * l'enseignant. Toute clé de `metadata` que H5P ne connaît pas y est ramenée vers
 * `params`. Parcours profond : quiz, diapositives, chapitres, interactions vidéo.
 * Un `params` déjà renseigné n'est jamais touché.
 * @param {*} item
 * @returns {*}
 */
export function rangerContenuHorsMetadata(item) {
    if (Array.isArray(item)) return item.map(rangerContenuHorsMetadata);
    if (!item || typeof item !== 'object') return item;
    const noeud = {};
    for (const [k, v] of Object.entries(item)) noeud[k] = rangerContenuHorsMetadata(v);
    const meta = noeud.metadata;
    const paramsVide = noeud.params == null
        || (typeof noeud.params === 'object' && !Array.isArray(noeud.params) && Object.keys(noeud.params).length === 0);
    if (typeof noeud.library === 'string' && /^H5P\./i.test(noeud.library) && paramsVide
        && meta && typeof meta === 'object' && !Array.isArray(meta)) {
        const egares = Object.keys(meta).filter(k => !CLES_METADATA_H5P.has(k));
        if (egares.length) {
            const deplaces = Object.fromEntries(egares.map(k => [k, meta[k]]));
            // Seconde variante constatée (même jour, Rédaction d'un Quiz mixte) : l'objet
            // `params` ENTIER rangé dans metadata → `metadata.params`, à désimbriquer.
            const { params: imbrique, ...autres } = deplaces;
            noeud.params = imbrique && typeof imbrique === 'object' && !Array.isArray(imbrique)
                ? { ...autres, ...imbrique }
                : deplaces;
            noeud.metadata = Object.fromEntries(Object.entries(meta).filter(([k]) => CLES_METADATA_H5P.has(k)));
            debugLog('json-healer', `[JSON Healer] ${noeud.library} : ${egares.length} champ(s) ramené(s) de metadata vers params`);
        }
    }
    return noeud;
}

export function healJsonObject(obj, moduleKey) {
    if (!obj) return obj;

    debugLog('json-healer', `[JSON Healer] Début de la normalisation pour ${moduleKey}`);

    // On travaille sur un clone pour ne pas polluer l'original
    let healed = structuredClone(obj);

    // 0. Normalisation du LaTeX double-échappé (\\( → \( ) — commun H5P et Moodle
    healed = normalizeDoubleEscapedLatex(healed);

    // 0b. Réparation des commandes LaTeX cassées par les échappements JSON (\neq → newline+eq)
    healed = repairBrokenLatexEscapes(healed);

    // 1. Conversion des environnements LaTeX \begin{equation}→\[...\], \begin{align}→\[...\]
    healed = convertLatexEnvironmentsDeep(healed);

    // 1b. Conversion des délimiteurs $...$ → \(...\) et $$...$$ → \[...\]
    // AVANT autoWrapLatex : les \( posés ici empêchent le re-wrapping de toute la chaîne
    healed = convertLatexDelimitersDeep(healed);

    // 1c. Auto-enveloppement du LaTeX nu (sans délimiteurs $ ni \()
    healed = autoWrapLatex(healed);

    // 1d. Second passage de normalisation : autoWrapLatex peut avoir créé des blocs \(...\)
    // autour de contenus déjà double-échappés (ex: \\sqrt → \(\\sqrt{x}\) )
    healed = normalizeDoubleEscapedLatex(healed);

    // 1e. Suppression de \displaystyle dans les formules inline
    healed = stripDisplaystyleDeep(healed);

    // 1f. Correction des entités HTML dans les blocs LaTeX (&lt; → <, etc.)
    healed = fixHtmlEntitiesInLatexDeep(healed);

    // 1g. Réparation des délimiteurs mixtes (\( ... $ → \( ... \))
    healed = fixMixedDelimitersDeep(healed);

    // 1h. Normalisation \binom{n}{k} → {n \choose k}
    // \binom nécessite AMSmath, non chargé par H5P.MathDisplay (MathJax 2.x).
    // {n \choose k} est un primitif TeX natif : rendu identique, aucune dépendance.
    healed = normalizeBinomDeep(healed);

    // 1i. Normalisation \mathcal{P} → 𝒫, \mathscr → idem, \mathfrak{R} → ℜ
    // Ces commandes nécessitent des polices spéciales non chargées par MathJax 2.x (H5P).
    // On les remplace par les caractères Unicode calligraphiques/fraktur équivalents.
    // Le parser LaTeX supporte les surrogate pairs (codePointAt), donc les exports
    // DOCX/ODT/PDF reçoivent le caractère Unicode et le rendent correctement.
    healed = normalizeFontCommandsDeep(healed);

    // 1j. Contenu d'un sous-contenu H5P rangé dans `metadata` au lieu de `params`
    healed = rangerContenuHorsMetadata(healed);

    // 2. Réparation QuizSet (Structure aplatie -> Params)
    if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') && Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
            // Une entrée vide ou une phrase (Texte à trous) : rien à restructurer.
            if (!q || typeof q !== 'object') return q;
            // Si library est une lib de question H5P mais qu'il n'y a pas de .params
            if (q.library && !q.params) {
                const libLower = q.library.toLowerCase();
                if (libLower.includes('h5p.')) {
                    // On déplace tout ce qui n'est pas library/metadata dans params
                    const { library, metadata, ...params } = q;

                    // Nettoyage spécifique par type
                    if (libLower.includes('multichoice')) {
                        // Gemini met parfois 'answer' au lieu de 'text' dans les réponses
                        if (Array.isArray(params.answers)) {
                            params.answers = params.answers.map(ans => {
                                if (ans.answer && !ans.text) {
                                    return { text: ans.answer, ...ans, answer: undefined };
                                }
                                return ans;
                            });
                        }
                    }

                    return { library, metadata: metadata || { title: "Question" }, params };
                }
            }
            return q;
        });
    }

    // 3. Normalisation des versions de librairies (souvent absentes ou erronées chez Gemini)
    if (Array.isArray(healed.questions)) {
        healed.questions.forEach(q => {
            // Les questions d'un Texte à trous sont des phrases, et une entrée peut être nulle.
            if (typeof q?.library === 'string' && !q.library.includes(' ')) {
                const baseLib = q.library.trim();
                if (H5P_LIB_VERSIONS[baseLib]) {
                    q.library = `${baseLib} ${H5P_LIB_VERSIONS[baseLib]}`;
                }
            }
        });
    }

    // Diagnostic ?debug : alerter (sans rien changer) si l'IA a livré une formule déséquilibrée.
    if (DEBUG) {
        const imbalances = checkLatexBalance(healed);
        if (imbalances.length) {
            debugLog('json-healer', `⚠️ ${imbalances.length} formule(s) LaTeX déséquilibrée(s) — « ${moduleKey} » :`, imbalances.slice(0, 5));
        }
    }

    return healed;
}

// =======================================================================
// HEALING STRUCTUREL PAR TYPE D'ACTIVITÉ
// =======================================================================

/**
 * Healing structurel : complète les champs structurels/métadonnées manquants
 * SANS toucher au contenu pédagogique (texte de questions, réponses, définitions).
 *
 * @param {Object} data - Les données JSON brutes
 * @param {string} moduleKey - Le type de module (ex: 'QuizSet', 'Millionnaire')
 * @returns {Object} Les données avec les champs structurels complétés
 */
// =======================================================================
// Règles de healing par activité
// =======================================================================

/**
 * Chaque règle reçoit l'objet `healed` (clone profond de l'entrée, déjà passé par
 * le préambule commun) et le MUTE EN PLACE. Aucune ne renvoie de valeur ni ne
 * lit le `data` d'origine — c'est le contrat vérifié par les tests.
 *
 * Ces 24 règles formaient auparavant une chaîne de 28 `if (moduleKey === …)`
 * séquentiels dans `healStructureForActivity` (868 lignes) : les 28 conditions
 * étaient évaluées à chaque appel, rien ne garantissait ni exhaustivité ni
 * unicité, et ajouter une activité imposait d'opérer au milieu du bloc.
 */

function healQuizSet(healed) {
    if (!healed.progressType) healed.progressType = "dots";
    if (healed.passPercentage === undefined) healed.passPercentage = 50;

    if (Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
            if (!q || typeof q !== 'object') return q;
            // subContentId manquant → générer UUID
            if (!q.subContentId) q.subContentId = generateUUID();

            // library sans version → ajouter depuis la map
            if (q.library && !q.library.includes(' ')) {
                const baseLib = q.library.trim();
                if (H5P_LIB_VERSIONS[baseLib]) {
                    q.library = `${baseLib} ${H5P_LIB_VERSIONS[baseLib]}`;
                }
            }

            // library présent et params absent mais d'autres champs → envelopper dans params
            if (q.library && !q.params) {
                const { library, metadata, subContentId, ...rest } = q;
                if (Object.keys(rest).length > 0) {
                    return {
                        library,
                        metadata: metadata || { title: "Question" },
                        subContentId: subContentId || generateUUID(),
                        params: rest
                    };
                }
            }

            // metadata manquant
            if (!q.metadata) q.metadata = { title: "Question" };

            // DragQuestion : valider la structure dropZones/elements (même logique que DragAndDrop autonome)
            if (q.library && q.library.startsWith('H5P.DragQuestion') && q.params) {
                if (!Array.isArray(q.params.dropZones)) q.params.dropZones = [];
                if (!Array.isArray(q.params.elements)) q.params.elements = [];
                const maxIdx = q.params.elements.length - 1;
                q.params.dropZones = q.params.dropZones.map(zone => {
                    if (Array.isArray(zone.correctElements)) {
                        zone.correctElements = zone.correctElements.filter(idx => {
                            const n = typeof idx === 'string' ? parseInt(idx, 10) : idx;
                            return Number.isInteger(n) && n >= 0 && n <= maxIdx;
                        });
                    } else {
                        zone.correctElements = [];
                    }
                    if (!zone.label) zone.label = "";
                    return zone;
                });
                q.params.elements = q.params.elements.map(el => {
                    if (typeof el === 'string') return { text: el };
                    if (!el.text) el.text = "";
                    return el;
                });
                if (!q.params.title) q.params.title = "";
            }

            return q;
        });
    }
}

// --- MultipleChoice ---
function healMultipleChoice(healed) {
    if (Array.isArray(healed.answers)) {
        healed.answers = healed.answers.map(ans => {
            // iscorrect → correct (1/0 → true/false)
            if (ans.correct === undefined && ans.iscorrect !== undefined) {
                ans.correct = ans.iscorrect === 1 || ans.iscorrect === true;
                delete ans.iscorrect;
            }
            // answer → text
            if (!ans.text && ans.answer) {
                ans.text = ans.answer;
                delete ans.answer;
            }
            return ans;
        });
    }
}

// --- TrueFalse ---
function healTrueFalse(healed) {
    if (typeof healed.correct === 'string') {
        healed.correct = healed.correct.toLowerCase() === 'true';
    }
    if (!healed.l10n) healed.l10n = {};
}

// --- Flashcards ---
function healFlashcards(healed) {
    if (Array.isArray(healed.cards)) {
        healed.cards = healed.cards.map(card => {
            if (!card.image) card.image = { path: "", alt: "" };
            return card;
        });
    }
}

// --- Crossword ---
function healCrossword(healed) {
    if (Array.isArray(healed.words)) {
        // Map des commandes LaTeX grecques → nom en lettres (min 2 caractères alphabétiques)
        const GREEK_LETTER_NAMES = {
            'alpha': 'ALPHA', 'beta': 'BETA', 'gamma': 'GAMMA', 'delta': 'DELTA',
            'epsilon': 'EPSILON', 'varepsilon': 'EPSILON', 'zeta': 'ZETA', 'eta': 'ETA',
            'theta': 'THETA', 'iota': 'IOTA', 'kappa': 'KAPPA', 'lambda': 'LAMBDA',
            'mu': 'MU', 'nu': 'NU', 'xi': 'XI', 'pi': 'PI', 'rho': 'RHO',
            'sigma': 'SIGMA', 'tau': 'TAU', 'upsilon': 'UPSILON', 'phi': 'PHI',
            'varphi': 'PHI', 'chi': 'CHI', 'psi': 'PSI', 'omega': 'OMEGA',
            'Gamma': 'GAMMA', 'Delta': 'DELTA', 'Theta': 'THETA', 'Lambda': 'LAMBDA',
            'Xi': 'XI', 'Pi': 'PI', 'Sigma': 'SIGMA', 'Phi': 'PHI', 'Psi': 'PSI', 'Omega': 'OMEGA'
        };
        // Symboles Unicode grecs → nom en lettres
        const UNICODE_GREEK_NAMES = {
            'α': 'ALPHA', 'β': 'BETA', 'γ': 'GAMMA', 'δ': 'DELTA', 'ε': 'EPSILON',
            'ζ': 'ZETA', 'η': 'ETA', 'θ': 'THETA', 'ι': 'IOTA', 'κ': 'KAPPA',
            'λ': 'LAMBDA', 'μ': 'MU', 'ν': 'NU', 'ξ': 'XI', 'π': 'PI', 'ρ': 'RHO',
            'σ': 'SIGMA', 'τ': 'TAU', 'υ': 'UPSILON', 'φ': 'PHI', 'χ': 'CHI',
            'ψ': 'PSI', 'ω': 'OMEGA', 'Γ': 'GAMMA', 'Δ': 'DELTA', 'Θ': 'THETA',
            'Λ': 'LAMBDA', 'Ξ': 'XI', 'Π': 'PI', 'Σ': 'SIGMA', 'Φ': 'PHI', 'Ψ': 'PSI', 'Ω': 'OMEGA'
        };

        healed.words = healed.words.map(word => {
            // hint → clue
            if (!word.clue && word.hint) {
                word.clue = word.hint;
                delete word.hint;
            }
            if (word.fixWord === undefined) word.fixWord = false;

            if (word.answer) {
                let ans = word.answer.trim();

                // 1. Si l'answer est une formule LaTeX contenant uniquement une lettre grecque → convertir en mot
                // Formes possibles après healing : \(\pi\), \\(\pi\\), \pi, juste "pi" entouré de LaTeX
                // On extrait le contenu en enlevant les délimiteurs \( \) ou \[ \] et le \ devant la commande
                const stripped = ans
                    .replace(/^\\[\(\[]/, '')   // enlever \( ou \[ au début
                    .replace(/\\[\)\]]$/, '')   // enlever \) ou \] à la fin
                    .replace(/^\\\[/, '').replace(/\\\]$/, '')
                    .replace(/^\\/, '')          // enlever le \ devant la commande
                    .trim();
                if (GREEK_LETTER_NAMES[stripped]) {
                    const oldAns = ans;
                    ans = GREEK_LETTER_NAMES[stripped];
                    debugLog('json-healer', `[JSON Healer] Crossword answer : "${oldAns}" → "${ans}" (lettre grecque en mot)`);
                }

                // 2. Si l'answer est un seul symbole Unicode grec → convertir en mot
                if (ans.trim().length === 1 && UNICODE_GREEK_NAMES[ans.trim()]) {
                    const oldAns = ans;
                    ans = UNICODE_GREEK_NAMES[ans.trim()];
                    debugLog('json-healer', `[JSON Healer] Crossword answer : "${oldAns}" → "${ans}" (symbole Unicode → mot)`);
                }

                // 3. Retirer les espaces
                if (ans.includes(' ')) {
                    const oldAns = ans;
                    ans = ans.replace(/\s+/g, '');
                    debugLog('json-healer', `[JSON Healer] Crossword answer : "${oldAns}" → "${ans}" (espaces supprimés)`);
                }

                word.answer = ans;
            }
            return word;
        });

        // 4. Filtrer les mots dont l'answer contient encore du LaTeX ou des symboles math non-alphabétiques
        // Un answer valide = au moins 2 caractères alphanumériques dont AU MOINS une lettre
        // (H5P.Crossword accepte les chiffres : « H2O », « A4 » sont valides ; « 42 » est écarté)
        const beforeCount = healed.words.length;
        healed.words = healed.words.filter(word => {
            const ans = word.answer || '';
            // Détecter LaTeX restant (commandes ou délimiteurs)
            const hasLatex = /\\[a-zA-Z]/.test(ans) || ans.includes('\\(') || ans.includes('\\)');
            // Détecter symboles Unicode math (pas les lettres grecques déjà converties)
            const hasUnicodeMath = /[\u221A\u2200-\u22FF\u2190-\u21FF]/.test(ans);
            // Mot valide = ≥ 2 caractères alphanumériques (accents inclus) et au moins une lettre
            const alnumCount = (ans.match(/[\p{L}\p{M}\p{N}]/gu) || []).length;
            const hasLetter = /\p{L}/u.test(ans);
            const isValidWord = alnumCount >= 2 && hasLetter;

            if (hasLatex || hasUnicodeMath || !isValidWord) {
                debugLog('json-healer', `[JSON Healer] Crossword : suppression de l'entrée "${ans}" (formule math ou réponse invalide)`);
                return false;
            }
            // Plafond anti-DoS (S12) : réponse trop longue → entrée écartée (pas tronquée)
            if (ans.length > GRID_MAX_ANSWER_LENGTH) {
                debugLog('json-healer', `[JSON Healer] Crossword : suppression de l'entrée "${ans}" (réponse > ${GRID_MAX_ANSWER_LENGTH} caractères)`);
                return false;
            }
            return true;
        });
        if (healed.words.length < beforeCount) {
            debugLog('json-healer', `[JSON Healer] Crossword : ${beforeCount - healed.words.length} entrée(s) supprimée(s) (formules math, réponses invalides ou trop longues)`);
        }
        // Plafond anti-DoS (S12) : nombre de mots limité, excédent écarté
        if (healed.words.length > GRID_MAX_WORDS) {
            const discarded = healed.words.slice(GRID_MAX_WORDS);
            healed.words = healed.words.slice(0, GRID_MAX_WORDS);
            debugLog('json-healer', `[JSON Healer] Crossword : ${discarded.length} mot(s) excédentaire(s) écarté(s) (plafond ${GRID_MAX_WORDS}) : ${discarded.map(w => `"${w.answer}"`).join(', ')}`);
        }
    }
}

// --- Chart ---
function healChart(healed) {
    if (Array.isArray(healed.listOfTypes)) {
        healed.listOfTypes = healed.listOfTypes.map((item, i) => {
            if (!item.color) {
                item.color = CHART_DEFAULT_COLORS[i % CHART_DEFAULT_COLORS.length];
            }
            return item;
        });
    }
    // "barChart" et non "bar" : H5P.Chart 1.2 ne connaît QUE `pieChart` et `barChart`
    // (semantics.json), et le menu « Type de graphique » de l'éditeur n'offre que ces deux
    // valeurs. Un `graphMode` inconnu passait la validation (champ non vide) tout en affichant
    // la première option du menu : le modèle et l'écran divergeaient, et le .h5p partait avec
    // une valeur que la librairie ne sait pas lire.
    if (!healed.graphMode) healed.graphMode = "barChart";
}

// --- Timeline ---
function healTimeline(healed) {
    if (healed.timeline) {
        if (!healed.timeline.type) healed.timeline.type = "default";
        if (Array.isArray(healed.timeline.date)) {
            healed.timeline.date = healed.timeline.date.map(event => {
                // "YYYY-MM-DD" → "YYYY,M,D"
                if (event.startDate && typeof event.startDate === 'string' && event.startDate.includes('-')) {
                    const parts = event.startDate.split('-');
                    if (parts.length === 3) {
                        event.startDate = `${parts[0]},${parseInt(parts[1])},${parseInt(parts[2])}`;
                    }
                }
                return event;
            });
        }
    }
}

/**
 * Glisser-déposer : rétablit `dropZones[].correctElements` quand l'association
 * étiquette → zone n'est donnée que sous la forme ÉDITEUR (`elements[].zoneIndices`).
 *
 * Deux formes coexistent pour la MÊME information. Le `.h5p`, les prompts et les
 * processeurs utilisent `correctElements` (zone → étiquettes) ; l'éditeur travaille sur
 * `zoneIndices` (étiquette → zones) et reconvertit à l'enregistrement. Un JSON déjà écrit
 * dans la forme éditeur — sortie de LLM qui suit l'exemple d'une fixture, contenu repris
 * d'un autre outil — traversait tout le pipeline sans être compris : le `.h5p` partait avec
 * `correctElements: []`, c'est-à-dire SANS AUCUNE bonne réponse, et sans que rien ne le
 * signale (constaté sur `course_presentation_4.json`).
 *
 * Deux garde-fous :
 *   · `correctElements` NON VIDE reste prioritaire — c'est la forme que joue H5P ;
 *   · `zoneIndices` n'est PAS supprimé. Cette fonction tourne aussi à l'enregistrement
 *     depuis l'éditeur (`saveChanges` → `healStructureForActivity`), où `zoneIndices` est
 *     la source de vérité que `denormalizeDataForSave` relit juste après : la retirer
 *     effacerait les associations au premier enregistrement.
 *
 * @param {Object} params - params d'un DragQuestion (porte `dropZones` ET `elements`)
 */
function healDragQuestionAssociations(params) {
    const dropZones = params.dropZones;
    const elements = params.elements;
    if (dropZones.some(z => z && Array.isArray(z.correctElements) && z.correctElements.length > 0)) return;
    if (!elements.some(el => el && Array.isArray(el.zoneIndices) && el.zoneIndices.length > 0)) return;

    dropZones.forEach(zone => { if (zone && typeof zone === 'object') zone.correctElements = []; });
    elements.forEach((el, elemIdx) => {
        if (!el || typeof el !== 'object' || !Array.isArray(el.zoneIndices)) return;
        el.zoneIndices.forEach(brut => {
            const zIdx = typeof brut === 'string' ? parseInt(brut, 10) : brut;
            if (!Number.isInteger(zIdx) || zIdx < 0 || zIdx >= dropZones.length) return;
            const zone = dropZones[zIdx];
            if (!zone || typeof zone !== 'object') return;
            if (!zone.correctElements.includes(elemIdx)) zone.correctElements.push(elemIdx);
        });
    });
}

/**
 * Applique `healDragQuestionAssociations` à TOUT objet du document portant à la fois
 * `dropZones` et `elements` — la signature d'un DragQuestion, et d'aucun autre contenu.
 *
 * Un parcours en profondeur plutôt que quatre branchements : le Glisser-déposer existe
 * en autonome, en sous-question de Quiz, en exercice de diapositive et en bloc de Livre
 * interactif, chacun avec sa forme propre (`params`, `exercise`, bloc aplati, forme
 * éditeur avec `_exerciseLibrary`). Le prochain conteneur sera couvert sans rien ajouter.
 *
 * @param {*} noeud - document (ou sous-arbre) à réparer, muté sur place
 */
function healDragQuestionsDeep(noeud) {
    if (!noeud || typeof noeud !== 'object') return;
    if (Array.isArray(noeud)) {
        noeud.forEach(healDragQuestionsDeep);
        return;
    }
    if (Array.isArray(noeud.dropZones) && Array.isArray(noeud.elements)) {
        healDragQuestionAssociations(noeud);
    }
    Object.values(noeud).forEach(healDragQuestionsDeep);
}

// --- DragAndDrop ---
function healDragAndDrop(healed) {
    // Assurer que les tableaux existent
    if (!Array.isArray(healed.dropZones)) healed.dropZones = [];
    if (!Array.isArray(healed.elements)) healed.elements = [];

    // Valider les indices correctElements (supprimer ceux hors limites)
    const maxElementIndex = healed.elements.length - 1;
    healed.dropZones = healed.dropZones.map(zone => {
        if (Array.isArray(zone.correctElements)) {
            zone.correctElements = zone.correctElements.filter(idx => {
                const n = typeof idx === 'string' ? parseInt(idx, 10) : idx;
                return Number.isInteger(n) && n >= 0 && n <= maxElementIndex;
            });
        } else {
            zone.correctElements = [];
        }
        if (!zone.label) zone.label = "";
        return zone;
    });

    // Assurer que chaque élément a un texte
    healed.elements = healed.elements.map(el => {
        if (typeof el === 'string') return { text: el };
        if (!el.text) el.text = "";
        return el;
    });

    // Titre par défaut
    if (!healed.title) healed.title = "";

    // Note : le mélange des étiquettes est fait dans h5p-creator.js (après healing,
    // avant stockage) pour ne s'exécuter qu'à la création initiale IA.
}

// --- CoursePresentation ---
function healCoursePresentation(healed) {
    if(Array.isArray(healed.presentation?.slides))return healed;
    // Assurer que slides est un tableau
    if (!Array.isArray(healed.slides)) {
        if (healed.slide || healed.content) {
            healed.slides = Array.isArray(healed.slide || healed.content)
                ? (healed.slide || healed.content)
                : [healed.slide || healed.content];
            delete healed.slide;
            delete healed.content;
        } else {
            healed.slides = [];
        }
    }

    // Valider chaque slide
    healed.slides = healed.slides.map((slide, i) => {
        // Assurer un type de slide valide
        if (!slide.type) {
            if (i === 0) slide.type = 'title';
            else if (slide.exercise) slide.type = 'quiz';
            else slide.type = 'content';
        }

        // Préserver la library d'exercice telle quelle (le processeur accepte les deux formats)
        // Ne PAS simplifier ici : l'éditeur et l'export document ont besoin du format complet

        return slide;
    });

    // Assurer un titre global
    if (!healed.title) {
        const firstSlide = healed.slides[0];
        healed.title = firstSlide?.title || 'Présentation';
    }
}

// --- InteractiveBook ---
function healInteractiveBook(healed) {
    if(healed.chapters?.[0]?.params)return healed;
    // Assurer que chapters est un tableau (accepter chapter/pages/sections comme alias)
    if (!Array.isArray(healed.chapters)) {
        const src = healed.chapter || healed.pages || healed.sections;
        if (src) {
            healed.chapters = Array.isArray(src) ? src : [src];
            delete healed.chapter;
            delete healed.pages;
            delete healed.sections;
        } else {
            healed.chapters = [];
        }
    }

    // Normaliser la couverture : accepter une chaîne directe
    if (typeof healed.cover === 'string') {
        healed.cover = { description: healed.cover };
    }

    healed.chapters = healed.chapters.map((ch, i) => {
        if (!ch || typeof ch !== 'object') ch = {};

        // Titre obligatoire (affiché dans la table des matières)
        if (!ch.title) ch.title = `Chapitre ${i + 1}`;

        // Normaliser content[] : accepter blocks comme alias, ou des champs à plat
        if (!Array.isArray(ch.content)) {
            if (Array.isArray(ch.blocks)) {
                ch.content = ch.blocks;
                delete ch.blocks;
            } else {
                const blocks = [];
                if (ch.text) blocks.push({ type: 'text', text: ch.text });
                if (ch.table) blocks.push({ type: 'table', table: ch.table, tableStyle: ch.tableStyle });
                if (ch.exercise) blocks.push({ type: 'exercise', ...ch.exercise });
                ch.content = blocks;
                delete ch.text;
                delete ch.table;
                delete ch.tableStyle;
                delete ch.exercise;
            }
        }

        // Normaliser chaque bloc : inférer le type si absent, dénouer exercise imbriqué
        const normaliserBloc = b => {
            if (b.type === 'row' || b._blockType === 'row') {
                b.columns = (Array.isArray(b.columns) ? b.columns : []).map(column => ({
                    ...column, content: (Array.isArray(column.content) ? column.content : []).filter(v => v && typeof v === 'object').map(normaliserBloc)
                }));
                return b;
            }
            // Format éditeur (déjà normalisé par normalizeDataForEditor : marqueurs
            // _blockType / _exerciseLibrary + wrapper `exercise`). On ne touche PAS :
            // la dénormalisation post-validation reconstruit le format à plat, et
            // aplatir ici détruirait _exerciseLibrary/_blockType (→ « type d'exercice
            // requis » au save). Même philosophie que CoursePresentation ci-dessus.
            if ('_blockType' in b || '_exerciseLibrary' in b) {
                return b;
            }
            // --- Format brut (sortie LLM) ---
            // Bloc {type:'exercise', exercise:{...}} → aplatir l'exercice au niveau du bloc
            if (b.exercise && typeof b.exercise === 'object' && !b.library
                && !b.text && !b.table && !b.image) {
                b = { type: 'exercise', ...b.exercise };
            }
            if (!b.type) {
                if (b.library) b.type = 'exercise';
                else if (b.table) b.type = 'table';
                else if (b.image) b.type = 'image';
                else b.type = 'text';
            }
            // Exercice : compléter la version de library manquante (l'éditeur exige le format complet)
            if (b.type === 'exercise' && typeof b.library === 'string' && b.library.includes('.') && !b.library.includes(' ')) {
                const baseLib = b.library.trim();
                const known = Object.keys(H5P_LIB_VERSIONS).find(k => k.toLowerCase() === baseLib.toLowerCase());
                if (known) b.library = `${known} ${H5P_LIB_VERSIONS[known]}`;
            }
            return b;
        };
        ch.content = (ch.content || []).filter(b => b && typeof b === 'object').map(normaliserBloc);

        return ch;
    });

    // Assurer un titre global
    if (!healed.title) {
        healed.title = healed.chapters[0]?.title || 'Livre interactif';
    }
}

// --- InteractiveVideo ---
function healInteractiveVideo(healed) {
    if(healed.interactiveVideo)return healed;
    // Coercition d'un timestamp (nombre, "HH:MM:SS", "MM:SS") en secondes.
    const ivToSeconds = (t) => {
        if (typeof t === 'number') return Math.max(0, t);
        if (typeof t === 'string') {
            const parts = t.trim().replace(',', '.').split(':').map(Number);
            if (parts.some(n => Number.isNaN(n))) return 0;
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return parts[0] || 0;
        }
        return 0;
    };

    // displayMode (racine) : mode d'affichage imposé à toutes les questions. Seules trois valeurs
    // ont un sens ; toute autre (LLM fantaisiste, import) retombe sur 'custom' = chaque question
    // décide, ce qui est aussi le comportement des contenus antérieurs au réglage. On ne CRÉE pas
    // le champ quand il est absent : son absence vaut déjà 'custom' côté processeur, et l'ajouter
    // ferait diverger inutilement les JSON existants (bruit dans les diffs / snapshots).
    if (healed.displayMode != null) {
        healed.displayMode = ['poster', 'button', 'custom'].includes(healed.displayMode)
            ? healed.displayMode : 'custom';
    }

    // interactions[] : accepter les alias interaction/questions/items
    if (!Array.isArray(healed.interactions)) {
        const src = healed.interaction || healed.items;
        healed.interactions = Array.isArray(src) ? src : (src ? [src] : []);
        delete healed.interaction;
        delete healed.items;
    }

    const IV_TYPES = ['multichoice', 'truefalse', 'blanks'];
    healed.interactions = healed.interactions
        .filter(it => it && typeof it === 'object')
        .map(it => {
            // timestamp : accepter time/start/at comme alias, coercer en secondes
            if (it.timestamp == null) it.timestamp = it.time ?? it.start ?? it.at ?? 0;
            it.timestamp = ivToSeconds(it.timestamp);
            delete it.time; delete it.start; delete it.at;
            // pause par défaut (point d'arrêt pédagogique)
            if (it.pause == null) it.pause = true;
            // Schéma étranger (IA externe) : `options` est un alias d'`answers`.
            if (!Array.isArray(it.answers) && Array.isArray(it.options)) {
                it.answers = it.options;
                delete it.options;
            }
            // type : valider ou inférer
            const t = String(it.type || '').toLowerCase();
            if (IV_TYPES.includes(t)) {
                it.type = t;
            } else if (Array.isArray(it.answers)) {
                it.type = 'multichoice';
            } else if (typeof it.correct === 'boolean' || it.correct === 'true' || it.correct === 'false') {
                it.type = 'truefalse';
            } else if (it.text || Array.isArray(it.questions)) {
                it.type = 'blanks';
            } else {
                it.type = 'multichoice';
            }
            if (it.type === 'multichoice' && !Array.isArray(it.answers)) it.answers = [];
            // truefalse exprimé en réponses Vrai/Faux (schéma étranger) : dériver `correct`
            // du libellé de la réponse marquée correcte, puis retirer les réponses.
            if (it.type === 'truefalse' && it.correct == null && Array.isArray(it.answers)) {
                const good = it.answers.find(a => a && typeof a === 'object' && a.correct === true);
                if (good) it.correct = /^\s*(vrai|true|oui|yes|waar|wahr|verdadero|vero|1)\b/i.test(String(good.text || ''));
                delete it.answers;
            }
            // Normaliser `correct` en booléen (l'éditeur stocke "true"/"false" en string).
            if (it.type === 'truefalse') {
                it.correct = (it.correct === true || it.correct === 'true' || it.correct === 1
                    || it.correct === '1' || it.correct === 'vrai');
            }
            // `feedback: {correct, incorrect}` (schéma étranger) → rétroactions natives :
            // truefalse → feedbackOnCorrect/feedbackOnWrong ; multichoice → feedback par
            // réponse (bonne réponse ← correct, distracteurs ← incorrect).
            if (it.feedback && typeof it.feedback === 'object' && !Array.isArray(it.feedback)) {
                const fbOk = typeof it.feedback.correct === 'string' ? it.feedback.correct : '';
                const fbKo = typeof it.feedback.incorrect === 'string' ? it.feedback.incorrect : '';
                if (it.type === 'truefalse') {
                    if (fbOk && !it.feedbackOnCorrect) it.feedbackOnCorrect = fbOk;
                    if (fbKo && !it.feedbackOnWrong) it.feedbackOnWrong = fbKo;
                } else if (it.type === 'multichoice' && Array.isArray(it.answers)) {
                    for (const a of it.answers) {
                        if (a && typeof a === 'object' && !a.feedback && !a.chosenFeedback) {
                            const fb = a.correct ? fbOk : fbKo;
                            if (fb) a.feedback = fb;
                        }
                    }
                }
                delete it.feedback;
            }
            // blanks : `question` (schéma étranger) → consigne de l'exercice.
            if (it.type === 'blanks' && !it.taskDescription && typeof it.question === 'string' && it.question.trim()) {
                it.taskDescription = it.question;
            }
            // Apparence/placement (champs optionnels) : on borne uniquement les valeurs FOURNIES
            // pour éviter un rendu cassé ; on n'impose pas de défaut (le processeur applique les
            // défauts sains quand le champ est absent).
            // `button` doit être demandé explicitement ; toute autre valeur fournie retombe sur le
            // défaut `poster` (aligné sur le processeur — les deux doivent trancher pareil).
            if (it.display != null) it.display = (it.display === 'button' ? 'button' : 'poster');
            if (it.placement != null
                && !['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom', 'full', 'custom'].includes(it.placement)) {
                it.placement = 'center';
            }
            for (const k of ['x', 'y', 'width', 'height']) {
                if (it[k] != null && it[k] !== '') {
                    const n = Number(it[k]);
                    if (Number.isFinite(n)) it[k] = Math.min(100, Math.max(0, n));
                    else delete it[k];
                }
            }
            if (it.visibleDuration != null && it.visibleDuration !== '') {
                const n = Number(it.visibleDuration);
                if (Number.isFinite(n) && n > 0) it.visibleDuration = n; else delete it.visibleDuration;
            }
            return it;
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    // summary : normaliser statements en tableau de tableaux non vides
    if (healed.summary && typeof healed.summary === 'object') {
        if (!Array.isArray(healed.summary.statements)) healed.summary.statements = [];
        healed.summary.statements = healed.summary.statements
            .map(g => Array.isArray(g) ? g : (typeof g === 'string' ? [g] : []))
            .filter(g => g.length > 0);
    }

    // videoSource : accepter une URL en chaîne directe, et choisir le bon mime.
    // YouTube → mime `video/YouTube` (handler natif H5P.VideoYouTube, lecture par embed, aucun
    // téléchargement). Sans ce mime, le handler YouTube ne prend pas la main → vidéo non jouable.
    const isYouTubeUrl = (s) => {
        s = String(s || '');
        return /youtu\.be\/[\w-]{11}/i.test(s)
            || /youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/[\w-]{11}/i.test(s)
            || (/youtube(?:-nocookie)?\.com\/watch/i.test(s) && /[?&]v=[\w-]{11}/i.test(s));
    };
    if (typeof healed.videoSource === 'string') {
        const u = healed.videoSource;
        healed.videoSource = { type: 'html5', url: u, mime: isYouTubeUrl(u) ? 'video/YouTube' : 'video/mp4' };
    } else if (healed.videoSource && typeof healed.videoSource === 'object' && healed.videoSource.url
        && isYouTubeUrl(healed.videoSource.url) && healed.videoSource.mime !== 'video/YouTube') {
        // Objet fourni avec une URL YouTube mais un mime mp4/absent → corriger.
        healed.videoSource.mime = 'video/YouTube';
    }

    if (!healed.title) healed.title = 'Vidéo interactive';
}

// --- DialogCards ---
function healDialogCards(healed) {
    if (!Array.isArray(healed.dialogs)) healed.dialogs = [];
    healed.dialogs = healed.dialogs.map(d => {
        if (!d || typeof d !== 'object') return { text: '', answer: '', tips: { front: '', back: '' } };
        if (!d.tips || typeof d.tips !== 'object') d.tips = { front: '', back: '' };
        if (!d.tips.front) d.tips.front = '';
        if (!d.tips.back) d.tips.back = '';
        return d;
    });
}

// --- Dictation ---
// NE JAMAIS toucher au contenu de sentences[].text : accents, casse et ponctuation
// comptent pour la correction de la dictée (render 'unicode' dans field-constraints).
// (Le tableau nu a déjà été enveloppé en tête de fonction, avant le bloc H5P commun.)
function healDictation(healed) {
    if (!Array.isArray(healed.sentences)) healed.sentences = [];
    healed.sentences = healed.sentences
        .map(s => (typeof s === 'string' ? { text: s } : s))
        .filter(s => s && typeof s === 'object');
}

// --- Essay ---
function healEssay(healed) {
    if (!Array.isArray(healed.keywords)) healed.keywords = [];
    healed.keywords = healed.keywords.map(kw => {
        // Accepter les chaînes simples ou les objets avec word/keyword
        if (typeof kw === 'string') return { keyword: kw };
        if (kw && !kw.keyword && kw.word) {
            kw.keyword = kw.word;
            delete kw.word;
        }
        return kw;
    });
    if (!healed.solution) healed.solution = { introduction: '', sample: '' };
}

// --- SingleChoiceSet ---
function healSingleChoiceSet(healed) {
    if (!Array.isArray(healed.choices)) healed.choices = [];
    healed.choices = healed.choices.map(c => {
        if (!c.subContentId) c.subContentId = generateUUID();
        if (!Array.isArray(c.answers) && typeof c.answers === 'string') {
            c.answers = [c.answers];
        }
        return c;
    });
}

// --- SortParagraphs ---
function healSortParagraphs(healed) {
    if (!Array.isArray(healed.paragraphs)) {
        // Accepter aussi sentences (nom alternatif courant)
        if (Array.isArray(healed.sentences)) {
            healed.paragraphs = healed.sentences;
            delete healed.sentences;
        } else {
            healed.paragraphs = [];
        }
    }
}

// --- Summary ---
function healSummary(healed) {
    if (!Array.isArray(healed.summaries)) healed.summaries = [];
    healed.summaries = healed.summaries.map(s => {
        if (!s || typeof s !== 'object') return { summary: [], tip: '' };
        if (!s.tip) s.tip = '';
        if (!s.subContentId) s.subContentId = generateUUID();
        // summary doit être un tableau de chaînes
        if (!Array.isArray(s.summary) && typeof s.summary === 'string') {
            s.summary = [s.summary];
        }
        return s;
    });
}

// --- FindTheWords ---
function healFindTheWords(healed) {
    if (Array.isArray(healed.wordList)) {
        healed.wordList = healed.wordList.join(',');
    }

    // Nettoyage de la wordList : la grille ne supporte que des mots en lettres
    // Supprimer les entrées contenant du LaTeX, des délimiteurs \(...\), ou des symboles Unicode math
    if (typeof healed.wordList === 'string') {
        const words = healed.wordList.split(',').map(w => w.trim()).filter(w => w.length > 0);
        const beforeCount = words.length;
        const cleanWords = words.filter(word => {
            // Détecter LaTeX (commandes \cmd ou délimiteurs \( \))
            const hasLatex = /\\[a-zA-Z()\[\]]/.test(word);
            // Symboles mathématiques ; les lettres grecques restent des lettres valides.
            const hasUnicodeMath = /[\u221A\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u2070-\u209F]/.test(word);

            if (hasLatex || hasUnicodeMath) {
                debugLog('json-healer', `[JSON Healer] FindTheWords wordList : suppression de "${word}" (formule math dans grille de lettres)`);
                return false;
            }
            return true;
        });
        if (cleanWords.length < beforeCount) {
            debugLog('json-healer', `[JSON Healer] FindTheWords : ${beforeCount - cleanWords.length} mot(s) supprimé(s) de la wordList (formules math)`);
        }
        // Nettoyer chaque mot : ne garder que les lettres (la grille ne supporte que ca)
        let finalWords = cleanWords
            .map(w => w.normalize('NFC').replace(/[^\p{L}\p{M}]/gu, ''))
            .filter(w => w.length > 0);
        // Plafond anti-DoS (S12) : mot trop long → écarté (pas tronqué)
        finalWords = finalWords.filter(w => {
            if (w.length > GRID_MAX_ANSWER_LENGTH) {
                debugLog('json-healer', `[JSON Healer] FindTheWords : suppression de "${w}" (mot > ${GRID_MAX_ANSWER_LENGTH} caractères)`);
                return false;
            }
            return true;
        });
        // Plafond anti-DoS (S12) : nombre de mots limité, excédent écarté
        if (finalWords.length > GRID_MAX_WORDS) {
            const discarded = finalWords.slice(GRID_MAX_WORDS);
            finalWords = finalWords.slice(0, GRID_MAX_WORDS);
            debugLog('json-healer', `[JSON Healer] FindTheWords : ${discarded.length} mot(s) excédentaire(s) écarté(s) (plafond ${GRID_MAX_WORDS}) : ${discarded.map(w => `"${w}"`).join(', ')}`);
        }
        healed.wordList = finalWords.join(',');
    }
}

// --- Millionnaire (Moodle) ---
function healMillionnaire(healed) {
    if (Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
            // badanswer string → tableau
            if (typeof q.badanswer === 'string') {
                q.badanswer = [q.badanswer];
            }
            // badanswer avec moins de 3 éléments → compléter avec ""
            if (Array.isArray(q.badanswer) && q.badanswer.length < 3) {
                while (q.badanswer.length < 3) {
                    q.badanswer.push("");
                }
            }
            return q;
        });
    }
}

// --- Appariement (Moodle) ---
function healAppariement(healed) {
    if (Array.isArray(healed.pairs)) {
        healed.pairs = healed.pairs.map(pair => {
            if (pair.question === null || pair.question === undefined) pair.question = "";
            if (pair.answer === null || pair.answer === undefined) pair.answer = "";
            return pair;
        });
    }
}

// --- QCM (Moodle) ---
function healQCM(healed) {
    if (Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
            if (Array.isArray(q.answers)) {
                q.answers = q.answers.map(ans => {
                    // 1. Si iscorrect manque (ex: génération IA), on le recrée à partir de correct
                    if (ans.iscorrect === undefined && ans.correct !== undefined) {
                        ans.iscorrect = (ans.correct === true || ans.correct === 1) ? 1 : 0;
                    }
                    // 2. On s'assure que correct existe pour les simulateurs sans supprimer iscorrect
                    if (ans.correct === undefined && ans.iscorrect !== undefined) {
                        ans.correct = (ans.iscorrect === 1 || ans.iscorrect === true);
                    }
                    return ans;
                });
            }
            return q;
        });
    }
}

// --- Page (Moodle) ---
function healPage(healed) {
    if (Array.isArray(healed.blocks)) {
        healed.blocks = healed.blocks.map(block => {
            if (!block.data) block.data = {};
            return block;
        });
    }
}

// --- Livre (Moodle, module book) ---
function healLivre(healed) {
    // 1. Defaults pour les réglages d'affichage (jamais générés par l'IA)
    // NB : les <select> de l'éditeur renvoient toujours des strings — on coerce
    // d'abord en Number avant de valider, sinon l'éditeur perd le choix utilisateur.
    const coerceInt = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
        return NaN;
    };
    const numberingNum = coerceInt(healed.numbering);
    if (![0, 1, 2, 3].includes(numberingNum)) {
        healed.numbering = 1;     // Numérotation décimale par défaut
    } else {
        healed.numbering = numberingNum;
    }
    // navstyle : option non exposée à l'utilisateur (Éléa ne supporte que la TOC).
    // Toujours forcée à 0 ; on nettoie la clé si elle a été renvoyée par l'IA ou un ancien JSON.
    if ('navstyle' in healed) delete healed.navstyle;
    // customtitles : option Moodle interne, non exposée à l'utilisateur.
    // Toujours forcée à 0 côté processeur ; on nettoie la clé si l'IA l'a renvoyée.
    if ('customtitles' in healed) delete healed.customtitles;

    // 2. Default theme (parmi les 4 thèmes Page disponibles)
    if (typeof healed.theme !== 'string' || !['elea', 'dsfr', 'accessible', 'dynamique'].includes(healed.theme)) {
        healed.theme = 'elea';
    }

    // 3. Default intro (chaîne vide acceptée, mais jamais undefined)
    if (typeof healed.intro !== 'string') {
        healed.intro = '';
    }

    // 4. Validation et correction de la séquence des chapitres
    if (Array.isArray(healed.chapters) && healed.chapters.length > 0) {
        // Le premier chapitre ne peut JAMAIS être un sous-chapitre
        healed.chapters[0].subchapter = false;

        // Chaque sous-chapitre doit être précédé d'au moins un chapitre normal
        let lastWasNormal = true;
        healed.chapters.forEach((ch, idx) => {
            if (idx === 0) {
                lastWasNormal = true;
                return;
            }
            if (ch.subchapter && !lastWasNormal) {
                // Sous-chapitre orphelin → forcer en chapitre normal
                ch.subchapter = false;
            }
            lastWasNormal = !ch.subchapter;
        });

        // 5. Chaque chapitre doit avoir un tableau blocks (au moins vide)
        //    et chaque bloc doit avoir un objet data (mêmes règles que Page)
        healed.chapters.forEach(ch => {
            if (!Array.isArray(ch.blocks)) ch.blocks = [];
            ch.blocks = ch.blocks.map(b => {
                if (!b.data) b.data = {};
                return b;
            });
            // Title fallback
            if (typeof ch.title !== 'string' || !ch.title.trim()) {
                ch.title = 'Chapitre sans titre';
            }
            // Subchapter doit être un booléen
            ch.subchapter = !!ch.subchapter;
        });
    } else {
        // Cas dégénéré : aucun chapitre → créer un chapitre vide pour éviter le crash
        healed.chapters = [{
            title: healed.title || 'Chapitre 1',
            subchapter: false,
            blocks: []
        }];
    }
}

// --- Devoir (Moodle) ---
function healDevoir(healed) {
    if (Array.isArray(healed.criteria)) {
        // 1. Déterminer le nombre maximal de niveaux parmi tous les critères
        const maxLevels = Math.max(...healed.criteria.map(c => (Array.isArray(c.levels) ? c.levels.length : 0)), 0);

        healed.criteria = healed.criteria.map(criterion => {
            // S'assurer que levels est un tableau
            if (!Array.isArray(criterion.levels)) criterion.levels = [];

            // S'assurer que description existe
            if (!criterion.description) criterion.description = '';

            // 2. Compléter les niveaux manquants pour égaliser les colonnes
            while (criterion.levels.length < maxLevels) {
                criterion.levels.push({ score: 0, definition: '' });
            }

            // 3. Convertir le LaTeX en Unicode dans chaque champ texte
            criterion.description = _convertLatexField(criterion.description);
            criterion.levels = criterion.levels.map(level => {
                if (level.definition) {
                    level.definition = _convertLatexField(level.definition);
                }
                return level;
            });

            return criterion;
        });
    }

    // Convertir le LaTeX dans le titre et la description du devoir
    if (healed.title) healed.title = _convertLatexField(healed.title);
    if (healed.description) healed.description = _convertLatexField(healed.description);
    if (healed.rubricName) healed.rubricName = _convertLatexField(healed.rubricName);
}

/**
 * Registre : clé de module → règle. Plusieurs clés peuvent partager une règle
 * (les trois variantes de QuizSet), ce que la table rend explicite.
 */
const HEAL_RULES = {
    QuizSet: healQuizSet,
    QuizSetQCM: healQuizSet,
    QuizSetVF: healQuizSet,
    MultipleChoice: healMultipleChoice,
    TrueFalse: healTrueFalse,
    Flashcards: healFlashcards,
    Crossword: healCrossword,
    Chart: healChart,
    Timeline: healTimeline,
    DragAndDrop: healDragAndDrop,
    CoursePresentation: healCoursePresentation,
    InteractiveBook: healInteractiveBook,
    InteractiveVideo: healInteractiveVideo,
    DialogCards: healDialogCards,
    Dictation: healDictation,
    Essay: healEssay,
    SingleChoiceSet: healSingleChoiceSet,
    SortParagraphs: healSortParagraphs,
    Summary: healSummary,
    FindTheWords: healFindTheWords,
    Millionnaire: healMillionnaire,
    Appariement: healAppariement,
    QCM: healQCM,
    Page: healPage,
    Livre: healLivre,
    Devoir: healDevoir
};

/** Clés de module disposant d'une règle de healing dédiée (pour les tests). */
export const HEALED_MODULE_KEYS = Object.freeze(Object.keys(HEAL_RULES));

export function healStructureForActivity(data, moduleKey) {
    if (!data || typeof data !== 'object') return data;

    let healed = structuredClone(data);
    if(moduleKey==='InteractiveVideo' && healed.interactiveVideo)return healed;
    if(moduleKey==='InteractiveBook' && healed.chapters?.[0]?.params)return healed;

    // Vidéo interactive : les IA externes (copier le prompt → coller le JSON) renvoient parfois
    // directement le TABLEAU des interactions, sans objet englobant. Envelopper AVANT tout
    // healing : sinon `healed.interactions` vaudrait [] et toutes les questions seraient perdues.
    if (moduleKey === 'InteractiveVideo' && Array.isArray(healed)) {
        healed = { interactions: healed };
    }

    // Dictée : même principe — IA externes renvoyant le TABLEAU nu des phrases. Envelopper
    // AVANT le bloc « H5P commun » ci-dessous, sinon overallFeedback/behaviour seraient posés
    // sur le tableau puis PERDUS à l'enveloppement.
    if (moduleKey === 'Dictation' && Array.isArray(healed)) {
        healed = { sentences: healed };
    }

    // --- H5P commun (tous les types H5P) ---
    // Contenu NATIF déjà processé (Présentation, Glossaire) : les processeurs le recopient
    // tel quel ; y poser overallFeedback/behaviour les ferait fuir dans le content.json
    // (croissance au deuxième passage, constatée par le banc d'aller-retour T2).
    const contenuNatif = (moduleKey === 'CoursePresentation' && Array.isArray(healed.presentation?.slides))
        || (moduleKey === 'Glossary' && healed.panels?.[0]?.content?.params);
    if (H5P_MODULE_KEYS.has(moduleKey) && !contenuNatif) {
        if (!healed.overallFeedback) {
            healed.overallFeedback = [{ from: 0, to: 100, feedback: "" }];
        }
        if (!healed.behaviour) {
            healed.behaviour = { enableRetry: true, enableSolutionsButton: true };
        }
    }

    // Glisser-déposer : accepter l'association écrite dans la forme ÉDITEUR
    // (`elements[].zoneIndices`) partout où un DragQuestion peut se trouver — autonome,
    // sous-question de Quiz, exercice de diapositive, bloc de Livre interactif.
    healDragQuestionsDeep(healed);

    // Règle spécifique à l'activité (cf. HEAL_RULES ci-dessus). Un simple accès
    // par clé remplace la chaîne de 28 `if` séquentiels d'origine.
    const rule = HEAL_RULES[moduleKey];
    if (rule) rule(healed);

    return healed;
}

/**
 * Convertit le LaTeX présent dans un champ texte en Unicode.
 * Gère les blocs délimités \(...\) et les commandes LaTeX orphelines.
 * @param {string} text
 * @returns {string}
 */
function _convertLatexField(text) {
    if (!text || typeof text !== 'string') return text;
    // Convertir les blocs \(...\) en Unicode
    let cleaned = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => {
        return latexToUnicode(inner).trim();
    });
    // Convertir les commandes LaTeX restantes (sans délimiteurs)
    if (/\\[a-zA-Z]/.test(cleaned)) {
        cleaned = latexToUnicode(cleaned);
    }
    return cleaned;
}

// =======================================================================
// Nettoyage spécifique par type d'activité (textField, marqueurs, LaTeX)
// =======================================================================

// =======================================================================
// Tables Unicode pour latexToUnicode (source unique, partagée avec document-formatter.js)
// =======================================================================

const SUPERSCRIPT_MAP = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ',
    'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ',
    'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
    'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
};

const SUBSCRIPT_MAP = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ'
};

const GREEK_MAP = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
    'epsilon': 'ε', 'varepsilon': 'ε', 'zeta': 'ζ', 'eta': 'η',
    'theta': 'θ', 'vartheta': 'ϑ', 'iota': 'ι', 'kappa': 'κ',
    'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ',
    'pi': 'π', 'varpi': 'ϖ', 'rho': 'ρ', 'varrho': 'ϱ',
    'sigma': 'σ', 'varsigma': 'ς', 'tau': 'τ', 'upsilon': 'υ',
    'phi': 'φ', 'varphi': 'ϕ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
    'Gamma': 'Γ', 'Delta': 'Δ', 'Theta': 'Θ', 'Lambda': 'Λ',
    'Xi': 'Ξ', 'Pi': 'Π', 'Sigma': 'Σ', 'Upsilon': 'Υ',
    'Phi': 'Φ', 'Psi': 'Ψ', 'Omega': 'Ω',
    'digamma': 'ϝ'
};

const OPERATOR_MAP = {
    'times': '×', 'div': '÷', 'cdot': '·', 'pm': '±', 'mp': '∓',
    'leq': '≤', 'le': '≤', 'geq': '≥', 'ge': '≥',
    'neq': '≠', 'ne': '≠', 'approx': '≈', 'equiv': '≡',
    'sim': '∼', 'simeq': '≃', 'propto': '∝', 'll': '≪', 'gg': '≫',
    'infty': '∞', 'infinity': '∞', 'partial': '∂', 'nabla': '∇',
    'sum': '∑', 'prod': '∏', 'int': '∫', 'iint': '∬', 'iiint': '∭',
    'oint': '∮', 'cup': '∪', 'cap': '∩',
    'subset': '⊂', 'supset': '⊃', 'subseteq': '⊆', 'supseteq': '⊇',
    'in': '∈', 'notin': '∉', 'ni': '∋',
    'emptyset': '∅', 'varnothing': '∅',
    'forall': '∀', 'exists': '∃', 'nexists': '∄',
    'neg': '¬', 'lnot': '¬', 'land': '∧', 'lor': '∨',
    'wedge': '∧', 'vee': '∨',
    'rightarrow': '→', 'to': '→', 'leftarrow': '←', 'gets': '←',
    'Rightarrow': '⇒', 'Leftarrow': '⇐',
    'leftrightarrow': '↔', 'Leftrightarrow': '⇔',
    'mapsto': '↦', 'implies': '⇒', 'iff': '⇔',
    'longmapsto': '⟼', 'Longrightarrow': '⟹', 'Longleftrightarrow': '⟺',
    'hookrightarrow': '↪', 'uparrow': '↑', 'downarrow': '↓',
    'nearrow': '↗', 'searrow': '↘',
    'ldots': '…', 'cdots': '⋯', 'vdots': '⋮', 'ddots': '⋱', 'dots': '…',
    'langle': '⟨', 'rangle': '⟩',
    'lfloor': '⌊', 'rfloor': '⌋', 'lceil': '⌈', 'rceil': '⌉',
    'circ': '∘', 'star': '⋆', 'bullet': '•',
    'oplus': '⊕', 'otimes': '⊗', 'odot': '⊙',
    'perp': '⊥', 'parallel': '∥', 'angle': '∠',
    'triangle': '△', 'square': '□', 'setminus': '∖',
    'aleph': 'ℵ', 'hbar': 'ℏ', 'ell': 'ℓ',
    'Re': 'ℜ', 'Im': 'ℑ',
    // Variantes de comparaison (fréquentes en maths françaises)
    'leqslant': '⩽', 'geqslant': '⩾', 'nleq': '≰', 'ngeq': '≱',
    'prec': '≺', 'succ': '≻', 'preceq': '⪯', 'succeq': '⪰',
    'cong': '≅',
    // Arithmétique et divisibilité
    'mid': '∣', 'nmid': '∤', 'nsubseteq': '⊈',
    'complement': '∁', 'wp': '℘',
    // Symboles divers
    'prime': '′', 'ast': '∗',
    'lVert': '‖', 'rVert': '‖', 'Vert': '‖',
    'checkmark': '✓', 'dagger': '†', 'ddagger': '‡'
};

const MATHBB_MAP = {
    'R': 'ℝ', 'N': 'ℕ', 'Z': 'ℤ', 'Q': 'ℚ', 'C': 'ℂ',
    'P': 'ℙ', 'H': 'ℍ', 'F': 'ⅎ',
    'D': '𝔻', 'K': '𝕂', 'E': '𝔼', '1': '𝟙'
};

/** Noms de fonctions mathématiques : le backslash est supprimé, le nom reste lisible */
const FUNCTION_NAMES = [
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'lim', 'sup', 'inf', 'max', 'min',
    'det', 'dim', 'ker', 'deg', 'gcd', 'arg', 'mod',
    'card', 'sgn', 'Pr', 'lcm', 'hom'
];

function toSuperscript(str) {
    return str.split('').map(c => SUPERSCRIPT_MAP[c] || c).join('');
}

function toSubscript(str) {
    return str.split('').map(c => SUBSCRIPT_MAP[c] || c).join('');
}

/**
 * Extrait le contenu entre accolades équilibrées à partir de la position donnée.
 * Gère correctement les structures imbriquées : \sqrt{\frac{a}{b}}
 * @param {string} s - La chaîne complète
 * @param {number} startIdx - Position de l'accolade ouvrante {
 * @returns {{content: string, end: number}|null} - Contenu et position après }
 */
function extractBraceContent(s, startIdx) {
    if (s[startIdx] !== '{') return null;
    let depth = 1, i = startIdx + 1;
    while (i < s.length && depth > 0) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') depth--;
        i++;
    }
    return depth === 0 ? { content: s.substring(startIdx + 1, i - 1), end: i } : null;
}

/**
 * Remplace toutes les occurrences de \cmd{contenu} avec accolades équilibrées.
 * @param {string} s - La chaîne à transformer
 * @param {string} cmd - Le nom de la commande (sans backslash)
 * @param {function(string): string} fn - Fonction de remplacement (reçoit le contenu)
 * @returns {string}
 */
function replaceBalanced(s, cmd, fn) {
    const prefix = '\\' + cmd + '{';
    let idx;
    while ((idx = s.indexOf(prefix)) !== -1) {
        const match = extractBraceContent(s, idx + prefix.length - 1);
        if (!match) break;
        const replacement = fn(match.content);
        s = s.substring(0, idx) + replacement + s.substring(match.end);
    }
    return s;
}

/**
 * Remplace toutes les occurrences de \cmd{arg1}{arg2} avec accolades équilibrées.
 * @param {string} s - La chaîne à transformer
 * @param {string} cmd - Le nom de la commande (sans backslash)
 * @param {function(string, string): string} fn - Fonction (reçoit les deux arguments)
 * @returns {string}
 */
function replaceBalanced2(s, cmd, fn) {
    const prefix = '\\' + cmd + '{';
    let idx;
    while ((idx = s.indexOf(prefix)) !== -1) {
        const arg1 = extractBraceContent(s, idx + prefix.length - 1);
        if (!arg1) break;
        const arg2 = extractBraceContent(s, arg1.end);
        if (!arg2) break;
        const replacement = fn(arg1.content, arg2.content);
        s = s.substring(0, idx) + replacement + s.substring(arg2.end);
    }
    return s;
}

/**
 * Convertit \binom{n}{k} → {n \choose k} dans toutes les chaînes d'un objet.
 * {n \choose k} est un primitif TeX natif, fonctionnel dans MathJax 2.x sans AMSmath,
 * contrairement à \binom qui nécessite le paquet AMSmath (non chargé par H5P.MathDisplay).
 * @param {*} item - Valeur quelconque (string, array, object)
 * @returns {*} La valeur transformée
 */
function normalizeBinomDeep(item) {
    if (typeof item === 'string') {
        return replaceBalanced2(item, 'binom', (n, k) => '{' + n + ' \\choose ' + k + '}');
    }
    if (Array.isArray(item)) return item.map(normalizeBinomDeep);
    if (item && typeof item === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(item)) out[k] = normalizeBinomDeep(v);
        return out;
    }
    return item;
}

/** Mapping \mathcal → Unicode Mathematical Script (A-Z) */
const MATHCAL_MAP = {
    A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢', H: 'ℋ', I: 'ℐ',
    J: '𝒥', K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩', O: '𝒪', P: '𝒫', Q: '𝒬', R: 'ℛ',
    S: '𝒮', T: '𝒯', U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵'
};
/** Mapping \mathfrak → Unicode Mathematical Fraktur (A-Z) */
const MATHFRAK_MAP = {
    A: '𝔄', B: '𝔅', C: 'ℭ', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊', H: 'ℌ', I: 'ℑ',
    J: '𝔍', K: '𝔎', L: '𝔏', M: '𝔐', N: '𝔑', O: '𝔒', P: '𝔓', Q: '𝔔', R: 'ℜ',
    S: '𝔖', T: '𝔗', U: '𝔘', V: '𝔙', W: '𝔚', X: '𝔛', Y: '𝔜', Z: 'ℨ'
};

/**
 * Normalisation récursive \mathcal{X} → 𝒳, \mathfrak{R} → ℜ dans tout un objet.
 * Unique pipeline pour H5P + DOCX + ODT + PDF (le parser LaTeX supporte les surrogate pairs).
 */
function normalizeFontCommandsDeep(item) {
    if (typeof item === 'string') {
        let s = item;
        s = replaceBalanced(s, 'mathcal', c => c.split('').map(ch => MATHCAL_MAP[ch] || ch).join(''));
        s = replaceBalanced(s, 'mathscr', c => c.split('').map(ch => MATHCAL_MAP[ch] || ch).join(''));
        s = replaceBalanced(s, 'mathfrak', c => c.split('').map(ch => MATHFRAK_MAP[ch] || ch).join(''));
        return s;
    }
    if (Array.isArray(item)) return item.map(normalizeFontCommandsDeep);
    if (item && typeof item === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(item)) out[k] = normalizeFontCommandsDeep(v);
        return out;
    }
    return item;
}

/**
 * Conversion LaTeX → Unicode pour les contextes sans MathJax.
 * Utilisé par : DragTheWords, MarkTheWords, Moodle shortanswer/matching,
 * et l'export document (DOCX/ODT/PDF).
 * Version récursive : gère les structures imbriquées (\frac{\sqrt{x}}{2}).
 * @param {string} text - Expression LaTeX (avec ou sans délimiteurs \( \))
 * @returns {string} - Texte Unicode équivalent
 */
const LATEX_TO_UNICODE_MAX_DEPTH = 50;
let _latexToUnicodeDepth = 0;

export function latexToUnicode(text) {
    // Garde anti-récursion (S17) : au-delà de la profondeur max, retourner l'entrée brute
    if (_latexToUnicodeDepth >= LATEX_TO_UNICODE_MAX_DEPTH) {
        debugLog('json-healer', '[JSON Healer] latexToUnicode : profondeur max atteinte, retour de l\'entrée brute');
        return text;
    }
    _latexToUnicodeDepth++;
    try {
        return _latexToUnicodeImpl(text);
    } finally {
        _latexToUnicodeDepth--;
    }
}

function _latexToUnicodeImpl(text) {
    let s = text.trim();

    // \mathbb{X} → ℝ, ℕ, ℤ, etc.
    s = replaceBalanced(s, 'mathbb', c => MATHBB_MAP[c] || c);

    // \text{...}, \mathrm{...}, variantes → texte brut
    for (const cmd of ['text', 'mathrm', 'textrm', 'textit', 'textbf', 'mathit', 'mathbf']) {
        s = replaceBalanced(s, cmd, c => c);
    }

    // \binom{n}{k} → C(n,k) — saisi directement avant normalisation du healer
    s = replaceBalanced2(s, 'binom', (n, k) => 'C(' + latexToUnicode(n) + ',' + latexToUnicode(k) + ')');

    // {n \choose k} → C(n,k) — forme produite par normalizeBinomDeep, ou saisie directement
    // Nécessite le matching d'accolades équilibrées (ex: {\frac{a}{b} \choose k})
    {
        let i = 0;
        let result = '';
        while (i < s.length) {
            if (s[i] === '{') {
                const brace = extractBraceContent(s, i);
                if (brace && brace.content.includes('\\choose')) {
                    const ci = brace.content.indexOf('\\choose');
                    const n = brace.content.substring(0, ci).trim();
                    const k = brace.content.substring(ci + 7).trim();
                    result += 'C(' + latexToUnicode(n) + ',' + latexToUnicode(k) + ')';
                    i = brace.end;
                    continue;
                }
            }
            result += s[i];
            i++;
        }
        s = result;
    }

    // \sqrt[n]{...} → ⁿ√(...) — traité avant \sqrt{} simple
    {
        let match;
        while ((match = /\\sqrt\[([^\]]+)\]\{/.exec(s)) !== null) {
            const n = match[1];
            const braceStart = match.index + match[0].length - 1; // position du {
            const brace = extractBraceContent(s, braceStart);
            if (!brace) break;
            const replacement = toSuperscript(n) + '√(' + latexToUnicode(brace.content) + ')';
            s = s.substring(0, match.index) + replacement + s.substring(brace.end);
        }
    }
    // \sqrt{...} → √(...) — accolades équilibrées (gère \sqrt{\frac{a}{b}})
    s = replaceBalanced(s, 'sqrt', content => '√(' + latexToUnicode(content) + ')');
    s = s.replace(/\\sqrt(?!\{|\[)/g, '√');

    // \frac, \dfrac, \tfrac → a/b ou (a)/(b) si complexe — accolades équilibrées
    const FRACTION_MAP = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
        '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/8': '⅛',
        '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
    };
    const processFrac = (num, den) => {
        const n = latexToUnicode(num);
        const d = latexToUnicode(den);
        if (n.length <= 2 && d.length <= 2) {
            const key = n + '/' + d;
            if (FRACTION_MAP[key]) return FRACTION_MAP[key];
        }
        // Pas de parens si : 1 seul caractère, alphanum simple, ou déjà entre parenthèses
        const isWrapped = (s) => /^[a-zA-Z0-9]$/.test(s) || (s.startsWith('(') && s.endsWith(')'))
            || (s.startsWith('√(') && s.endsWith(')'));
        const needParensNum = n.length > 1 && !isWrapped(n);
        const needParensDen = d.length > 1 && !isWrapped(d);
        return (needParensNum ? '(' + n + ')' : n) + '/' + (needParensDen ? '(' + d + ')' : d);
    };
    s = replaceBalanced2(s, 'frac', processFrac);
    s = replaceBalanced2(s, 'dfrac', processFrac);
    s = replaceBalanced2(s, 'tfrac', processFrac);

    // \mathcal{X} → texte brut (pas de police calligraphique en Unicode standard)
    s = replaceBalanced(s, 'mathcal', c => c);
    s = replaceBalanced(s, 'mathscr', c => c);
    s = replaceBalanced(s, 'mathfrak', c => c);

    // Matrices : \begin{pmatrix} a & b \\ c & d \end{pmatrix} → (a, b; c, d)
    s = s.replace(/\\begin\{(pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g, (_, variant, body) => {
        const open = { pmatrix: '(', bmatrix: '[', Bmatrix: '{', vmatrix: '|', Vmatrix: '‖', matrix: '' }[variant] || '(';
        const close = { pmatrix: ')', bmatrix: ']', Bmatrix: '}', vmatrix: '|', Vmatrix: '‖', matrix: '' }[variant] || ')';
        const rows = body.split(/\\\\\s*/).map(row =>
            row.split('&').map(cell => latexToUnicode(cell.trim())).join(', ')
        ).filter(r => r.trim());
        return open + rows.join('; ') + close;
    });

    // Systèmes par cas : \begin{cases} a & \text{si} \\ b & \text{sinon} \end{cases} → {a si; b sinon}
    s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, body) => {
        const rows = body.split(/\\\\\s*/).map(row =>
            row.split('&').map(cell => latexToUnicode(cell.trim())).join(' ')
        ).filter(r => r.trim());
        return '{' + rows.join('; ') + '}';
    });

    // Diacritiques — accolades équilibrées
    s = replaceBalanced(s, 'overline', c => latexToUnicode(c).split('').map(ch => ch + '\u0304').join(''));
    s = replaceBalanced(s, 'bar', c => latexToUnicode(c).split('').map(ch => ch + '\u0304').join(''));
    s = replaceBalanced(s, 'vec', c => latexToUnicode(c) + '\u20D7');
    s = replaceBalanced(s, 'hat', c => latexToUnicode(c) + '\u0302');
    s = replaceBalanced(s, 'tilde', c => latexToUnicode(c) + '\u0303');

    // Lettres grecques et opérateurs (via tables)
    s = s.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
        if (GREEK_MAP[cmd]) return GREEK_MAP[cmd];
        if (OPERATOR_MAP[cmd]) return OPERATOR_MAP[cmd];
        return match; // Garde tel quel si non reconnu, sera nettoyé plus bas
    });

    // Exposants : ^{...} ou ^x — accolades équilibrées
    while (s.includes('^{')) {
        const idx = s.indexOf('^{');
        const match = extractBraceContent(s, idx + 1);
        if (!match) break;
        s = s.substring(0, idx) + toSuperscript(latexToUnicode(match.content)) + s.substring(match.end);
    }
    s = s.replace(/\^([a-zA-Z0-9+\-])/g, (_, c) => toSuperscript(c));

    // Indices : _{...} ou _x — accolades équilibrées
    while (s.includes('_{')) {
        const idx = s.indexOf('_{');
        const match = extractBraceContent(s, idx + 1);
        if (!match) break;
        s = s.substring(0, idx) + toSubscript(latexToUnicode(match.content)) + s.substring(match.end);
    }
    s = s.replace(/_([a-zA-Z0-9])/g, (_, c) => toSubscript(c));

    // Noms de fonctions : \sin, \cos, \log, etc.
    for (const fn of FUNCTION_NAMES) {
        s = s.replace(new RegExp('\\\\' + fn + '(?![a-zA-Z])', 'g'), fn);
    }

    // \left, \right, \big → juste les délimiteurs
    s = s.replace(/\\left\s*/g, '');
    s = s.replace(/\\right\s*/g, '');
    s = s.replace(/\\big[glr]?\s*/gi, '');

    // Accolades LaTeX restantes
    s = s.replace(/\{/g, '');
    s = s.replace(/\}/g, '');

    // Commandes d'espacement LaTeX
    s = s.replace(/\\[,;:!]\s*/g, ' ');
    s = s.replace(/\\quad\s*/g, '  ');
    s = s.replace(/\\qquad\s*/g, '    ');
    s = s.replace(/\\ /g, ' ');

    // Commandes de taille → ignorer
    s = s.replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle|tiny|small|normalsize|large|Large|LARGE|huge|Huge)\s*/g, '');

    // Délimiteurs \( \) \[ \] restants → supprimer
    s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, '');

    // Commandes restantes non reconnues → supprimer le backslash
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    // Nettoyage final
    s = s.replace(/\s{2,}/g, ' ').trim();

    return s;
}

/**
 * Nettoyage d'une question FillInTheBlanks (H5P.Blanks).
 * 1. Convertit **mot** (gras markdown) en *mot* (marqueur de trou)
 * 2. Supprime les marqueurs *…* à l'intérieur des formules LaTeX \(…\) et \[…\]
 *    (un trou à l'intérieur d'une formule maths n'est pas saisissable par l'élève)
 * @param {string} text
 * @returns {string}
 */
function cleanBlanksText(text) {
    if (!text) return "";
    let cleaned = text;

    // 1. Convertir **mot** → *mot* (le gras markdown n'a pas de sens dans Blanks)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '*$1*');

    // 2. Supprimer les marqueurs *…* à l'intérieur des blocs LaTeX \(…\) et \[…\]
    cleaned = cleaned.replace(/\\\([\s\S]*?\\\)/g, (match) => {
        return match.replace(/\*([^*]+)\*/g, '$1');
    });
    cleaned = cleaned.replace(/\\\[[\s\S]*?\\\]/g, (match) => {
        return match.replace(/\*([^*]+)\*/g, '$1');
    });

    return cleaned;
}

/**
 * Nettoyage du textField MarkTheWords (version healer).
 * 1. Supprime les wrappers \( et \) parasites sur le texte entier
 * 2. Convertit le LaTeX basique en Unicode
 * 3. Éclate les marqueurs multi-mots : *mot1 mot2* → *mot1* *mot2*
 * @param {string} text
 * @returns {string}
 */
function cleanMarkTheWordsText(text) {
    if (!text) return "";
    let cleaned = text;

    // 1. Convertir **mot** (gras markdown généré par le LLM) en *mot* (marqueur MarkTheWords)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '*$1*');

    // 2. Supprimer les wrappers \( et \) parasites (texte entier)
    if (cleaned.trim().startsWith('\\(') && cleaned.trim().endsWith('\\)')) {
        cleaned = cleaned.trim().slice(2, -2).trim();
    }

    // 3. Conversion LaTeX → Unicode
    cleaned = latexToUnicode(cleaned);

    // 4. Apostrophe + astérisque : l'*oiseau* → l' *oiseau*
    cleaned = cleaned.replace(/(['''])\*/g, "$1 *");

    // 5. Multi-word split : *mot1 mot2* → *mot1* *mot2*
    cleaned = cleaned.replace(/\*([^*]+)\*/g, (match, content) => {
        if (!content.includes(' ')) return match;
        return content.split(/\s+/).filter(w => w.length > 0).map(w => `*${w}*`).join(' ');
    });

    return cleaned;
}

/**
 * Nettoyage du textField DragText (version healer).
 * 1. Supprime les wrappers \( et \) parasites sur le texte entier
 * 2. Convertit le LaTeX DANS les marqueurs *...* en Unicode
 * 3. Convertit les formules \(...\) hors marqueurs en Unicode
 * @param {string} text
 * @returns {string}
 */
function cleanDragTextText(text) {
    if (!text) return "";
    // Un texte rendu en liste de phrases par le modèle : `.trim()` y levait.
    let cleaned = Array.isArray(text) ? text.join('\n\n') : String(text);

    // 1. Supprimer les wrappers \( et \) parasites (texte entier)
    if (cleaned.trim().startsWith('\\(') && cleaned.trim().endsWith('\\)')) {
        cleaned = cleaned.trim().slice(2, -2).trim();
    }

    // 2. Convertir LaTeX dans les marqueurs *...* en Unicode
    cleaned = cleaned.replace(/\*([^*]+)\*/g, (match, content) => {
        if (/\\[a-zA-Z]/.test(content) || /\^/.test(content)) {
            return `*${latexToUnicode(content).trim()}*`;
        }
        return match;
    });

    // 3. Convertir les formules \(...\) hors marqueurs en Unicode
    // Note : [\s\S]*? au lieu de [^)]*? pour gérer les ) internes (ex: (-5)^{2})
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => {
        return latexToUnicode(inner).trim();
    });

    return cleaned;
}

/** Clé de comparaison d'un mot glissable : sans l'indice `:…`, sans casse. */
const cleMotGlissable = (mot) => String(mot).split(':')[0].trim().toLowerCase();

/**
 * Normalise les leurres de « Glisser les mots » (`distractors`).
 *
 * H5P.DragText attend UNE chaîne de marqueurs : `*stagnation* *campagnes*`. Le
 * modèle rend parfois une LISTE, dont chaque entrée mélange le bon mot marqué et
 * son leurre (« *croissance* stagnation ») : le processeur appelait `.trim()` sur
 * la liste, et l'activité était écartée à la livraison d'un parcours, avec pour
 * seul motif « erreur de mise en forme » (constaté le 15 sept. 2026).
 *
 * Dans une liste, le texte hors marqueurs est le leurre ; à défaut, le contenu des
 * marqueurs, ou l'entrée entière. Une bonne réponse du texte n'est jamais gardée
 * comme leurre (le prompt l'interdit : l'étiquette apparaîtrait deux fois). Une
 * chaîne est laissée telle quelle.
 *
 * @param {*} distractors
 * @param {string} [textField] - Le texte à trous, pour reconnaître les bonnes réponses.
 * @returns {string|undefined}
 */
export function normaliserLeurresDragText(distractors, textField) {
    if (distractors == null || typeof distractors === 'string') return distractors;
    const entrees = Array.isArray(distractors) ? distractors : [distractors];
    const texte = Array.isArray(textField) ? textField.join('\n') : String(textField || '');
    const reponses = new Set([...texte.matchAll(/\*([^*]+)\*/g)].map(m => cleMotGlissable(m[1])));
    const leurres = [];
    for (const entree of entrees) {
        const brut = String((entree && typeof entree === 'object') ? (entree.text ?? entree.word ?? '') : (entree ?? '')).trim();
        if (!brut) continue;
        const marques = [...brut.matchAll(/\*([^*]+)\*/g)].map(m => m[1].trim());
        const reste = brut.replace(/\*[^*]+\*/g, ' ')
            .replace(/^[\s:;,/|\-–—→]+|[\s:;,/|\-–—→]+$/g, '')
            .replace(/\s+/g, ' ');
        const candidats = reste ? [reste] : (marques.length ? marques : [brut]);
        for (const candidat of candidats) {
            const cle = cleMotGlissable(candidat);
            if (!cle || reponses.has(cle) || leurres.some(l => cleMotGlissable(l) === cle)) continue;
            leurres.push(candidat);
        }
    }
    return leurres.map(l => `*${l}*`).join(' ');
}

/**
 * Retire de la consigne de « Glisser les mots » le texte à compléter qu'elle recopie.
 *
 * Constaté le 15 sept. 2026 : le modèle écrit la consigne PUIS le texte entier,
 * marqueurs compris ; les `*mots*` deviennent de l'italique au-dessus des zones de
 * dépôt, et toutes les réponses sont sous les yeux de l'élève. Seule une recopie
 * mot pour mot d'un texte d'au moins 40 caractères est retirée (espaces et sauts
 * de ligne libres) : une consigne qui cite quelques mots reste intacte.
 *
 * @param {*} consigne
 * @param {*} texte - Le `textField`, AVANT son nettoyage.
 * @returns {*} La consigne, sans le texte recopié.
 */
export function retirerTexteDeLaConsigneDragText(consigne, texte) {
    if (typeof consigne !== 'string' || typeof texte !== 'string' || texte.trim().length < 40) return consigne;
    const mots = texte.trim().split(/\s+/).map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const recopie = new RegExp(mots.join('\\s+'));
    if (!recopie.test(consigne)) return consigne;
    return consigne.replace(recopie, '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Champs dont une liste a un sens propre, normalisés par une fonction dédiée :
 * la jointure générique leur ferait perdre ce sens (les leurres de « Glisser les
 * mots » mêlent le bon mot et le leurre, cf. `normaliserLeurresDragText`).
 */
const LISTES_A_TRAITEMENT_DEDIE = new Set(['DragTheWords:distractors']);

/**
 * Un champ TEXTE rendu en LISTE par le modèle redevient une chaîne.
 *
 * Constaté le 15 sept. 2026 : un seul champ texte rendu en liste (la question d'un
 * Vrai/Faux, le texte d'une carte, la consigne…) faisait planter la mise en forme
 * de 24 modules (`text.trim is not a function`) et l'activité était perdue. Les
 * champs texte de chaque module sont ceux que déclare `FIELD_CONSTRAINTS` ; une
 * liste de chaînes (ou de nombres) y est jointe, en paragraphes pour un texte mis
 * en forme, par une espace pour un libellé. Le stockage de l'éditeur reçoit ainsi
 * une chaîne, comme si le modèle avait obéi.
 *
 * @param {Object} obj - Modifié en place.
 * @param {string} moduleKey
 * @param {Object} champs - `FIELD_CONSTRAINTS[moduleKey].fields`
 */
function aplatirTextesEnListe(obj, moduleKey, champs) {
    for (const [chemin, config] of Object.entries(champs)) {
        if (LISTES_A_TRAITEMENT_DEDIE.has(`${moduleKey}:${chemin}`)) continue;
        const separateur = ['html', 'html+latex', 'unicode+markers'].includes(config.render) ? '\n\n' : ' ';
        const aplatir = (valeur) => (Array.isArray(valeur) && valeur.length
            && valeur.every(x => typeof x === 'string' || typeof x === 'number'))
            ? valeur.map(String).join(separateur) : valeur;
        // 'cards[].text' → ['cards', '[]', 'text'] ; 'rows[][]' → ['rows', '[]', '[]']
        const segments = chemin.split('.').flatMap(part => {
            const m = part.match(/^([^[]*)((?:\[\])*)$/);
            return m ? [...(m[1] ? [m[1]] : []), ...Array(m[2].length / 2).fill('[]')] : [part];
        });
        const descendre = (courant, i) => {
            if (courant == null || typeof courant !== 'object') return;
            const segment = segments[i];
            const dernier = i === segments.length - 1;
            if (segment === '[]') {
                if (!Array.isArray(courant)) return;
                courant.forEach((item, j) => {
                    if (dernier) courant[j] = aplatir(item);
                    else descendre(item, i + 1);
                });
            } else if (!Array.isArray(courant)) {
                if (dernier) { if (segment in courant) courant[segment] = aplatir(courant[segment]); }
                else descendre(courant[segment], i + 1);
            }
        };
        descendre(obj, 0);
    }
}

/** Pose les leurres normalisés sur un objet DragText, ou retire un champ vidé. */
function soignerLeurresDragText(params) {
    if (!params || params.distractors == null || typeof params.distractors === 'string') return;
    const leurres = normaliserLeurresDragText(params.distractors, params.textField);
    if (leurres) params.distractors = leurres;
    else delete params.distractors;
}

/**
 * Applique le nettoyage spécifique par type d'activité sur les champs texte.
 * Doit être appelé APRÈS healJsonObject() et AVANT le stockage de originalJson.
 *
 * Objectif : que l'originalJson stocké pour l'éditeur soit déjà propre,
 * sans nécessiter le passage par les processeurs H5P.
 *
 * @param {Object} obj - L'objet JSON déjà healé par healJsonObject()
 * @param {string} moduleKey - Le type de module
 * @returns {Object} L'objet avec les champs texte nettoyés
 */
export function healActivitySpecificFields(obj, moduleKey) {
    if (!obj) return obj;

    let healed = structuredClone(obj);

    const constraints = getConstraints(moduleKey);

    // --- 0. Champs texte rendus en liste par le modèle ---
    if (constraints && constraints.fields) aplatirTextesEnListe(healed, moduleKey, constraints.fields);

    // --- 1. Conversions automatiques via FIELD_CONSTRAINTS ---
    // Applique les conversions unicode, plain, plain+letters sur les champs déclarés
    if (constraints && constraints.fields) {
        for (const [fieldPath, config] of Object.entries(constraints.fields)) {
            const renderType = config.render;
            // Les types html+latex et html ne nécessitent pas de conversion
            if (renderType === 'html+latex' || renderType === 'html') continue;
            // Les types unicode+markers sont gérés manuellement ci-dessous (fonctions spécialisées)
            if (renderType === 'unicode+markers') continue;

            const converter = getConverter(renderType);
            if (converter) {
                applyToPath(healed, fieldPath, (text) => {
                    const converted = converter(text);
                    if (converted !== text) {
                        debugLog('json-healer', `[JSON Healer] ${moduleKey}.${fieldPath} : "${text}" → "${converted}" (${renderType})`);
                    }
                    return converted;
                });
            }
        }
    }

    // --- 2. Conversions unicode+markers (fonctions spécialisées par type de marqueur) ---

    // MarkTheWords : *mot* marqueurs avec conversion LaTeX→Unicode
    if (moduleKey === 'MarkTheWords') {
        if (healed.textField) {
            healed.textField = cleanMarkTheWordsText(healed.textField);
        }
        return healed;
    }

    // DragTheWords : *mot* marqueurs avec conversion LaTeX→Unicode
    if (moduleKey === 'DragTheWords') {
        if (typeof healed.taskDescription === 'string') {
            healed.taskDescription = retirerTexteDeLaConsigneDragText(healed.taskDescription, healed.textField);
        }
        if (healed.textField) {
            healed.textField = cleanDragTextText(healed.textField);
        }
        soignerLeurresDragText(healed);
        return healed;
    }

    // FillInTheBlanks : *réponse* marqueurs dans les questions
    if (moduleKey === 'FillInTheBlanks') {
        if (Array.isArray(healed.questions)) {
            healed.questions = healed.questions.map(q => typeof q === 'string' ? cleanBlanksText(q) : q);
        }
        return healed;
    }

    // --- 3. Conteneurs : nettoyage récursif des exercices enfants ---

    // CoursePresentation : nettoyer les textes HTML dans chaque slide + exercices enfants
    if (moduleKey === 'CoursePresentation') {
        if (Array.isArray(healed.slides)) {
            healed.slides.forEach(slide => {
                // Nettoyer les textes de contenu (le processeur fera le formatTextToHtml ensuite)
                if (slide.text && typeof slide.text === 'string') {
                    slide.text = slide.text.trim();
                }
                if (slide.title && typeof slide.title === 'string') {
                    slide.title = slide.title.trim();
                }
                // Nettoyer les exercices intégrés
                if (slide.exercise) {
                    if (slide.exercise.question && typeof slide.exercise.question === 'string') {
                        slide.exercise.question = slide.exercise.question.trim();
                    }
                    // Le modèle écrit la bibliothèque en forme courte (« blanks ») OU
                    // complète (« H5P.Blanks 1.14 ») ; le processeur accepte les deux.
                    // Comparée à la seule forme courte, la complète échappait au
                    // nettoyage : « **notion** » restait tel quel dans un texte à trous
                    // (parcours réel du 28 sept. 2026), où « * » délimite un trou.
                    const lib = String(slide.exercise.library || '').toLowerCase().replace(/^h5p\./, '').replace(/\s.*$/, '');
                    if (lib !== slide.exercise.library && ['blanks', 'dragtext', 'markthewords'].includes(lib)) {
                        slide.exercise.library = lib;
                    }
                    // Blanks : nettoyer les questions
                    if (slide.exercise.library === 'blanks' && Array.isArray(slide.exercise.questions)) {
                        slide.exercise.questions = slide.exercise.questions.map(
                            q => typeof q === 'string' ? cleanBlanksText(q) : q
                        );
                    }
                    // DragText : nettoyer le textField
                    if (slide.exercise.library === 'dragtext' && slide.exercise.textField) {
                        slide.exercise.textField = cleanDragTextText(slide.exercise.textField);
                    }
                    if (slide.exercise.library === 'dragtext') soignerLeurresDragText(slide.exercise);
                    // MarkTheWords : nettoyer le textField
                    if (slide.exercise.library === 'markthewords' && slide.exercise.textField) {
                        slide.exercise.textField = cleanMarkTheWordsText(slide.exercise.textField);
                    }
                }
            });
        }
        return healed;
    }

    // InteractiveBook : nettoyer les textes des blocs de chaque chapitre + exercices intégrés
    if (moduleKey === 'InteractiveBook') {
        if (healed.cover && typeof healed.cover.description === 'string') {
            healed.cover.description = healed.cover.description.trim();
        }
        if (Array.isArray(healed.chapters)) {
            healed.chapters.forEach(ch => {
                if (ch.title && typeof ch.title === 'string') {
                    ch.title = ch.title.trim();
                }
                (Array.isArray(ch.content) ? ch.content : []).forEach(b => {
                    if (!b || typeof b !== 'object') return;
                    // Blocs de contenu : trim simple (le processeur fera le formatTextToHtml ensuite)
                    if (b.text && typeof b.text === 'string') {
                        b.text = b.text.trim();
                    }
                    // Blocs exercice : nettoyage par type de library (format complet ou simplifié)
                    if (b.type === 'exercise' || b.library) {
                        const lib = (b.library || '').toLowerCase();
                        if (b.question && typeof b.question === 'string') {
                            b.question = b.question.trim();
                        }
                        if (lib.includes('blanks') && Array.isArray(b.questions)) {
                            b.questions = b.questions.map(
                                q => typeof q === 'string' ? cleanBlanksText(q) : q
                            );
                        }
                        if (lib.includes('dragtext') && b.textField) {
                            b.textField = cleanDragTextText(b.textField);
                        }
                        if (lib.includes('dragtext')) soignerLeurresDragText(b);
                        if (lib.includes('markthewords') && b.textField) {
                            b.textField = cleanMarkTheWordsText(b.textField);
                        }
                        // TrueFalse : convertir le champ legacy "feedback"
                        if (lib.includes('truefalse') && b.feedback && !b.feedbackOnCorrect && !b.feedbackOnWrong) {
                            b.feedbackOnWrong = b.feedback;
                            delete b.feedback;
                        }
                    }
                });
            });
        }
        return healed;
    }

    // QuizSet variants : itérer les questions et nettoyer par type de library
    if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF')
        && Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
            if (!q.library || !q.params) return q;
            const libName = q.library.split(' ')[0];

            if (libName === 'H5P.MarkTheWords' && q.params.textField) {
                q.params.textField = cleanMarkTheWordsText(q.params.textField);
            }
            if (libName === 'H5P.DragText' && q.params.textField) {
                q.params.textField = cleanDragTextText(q.params.textField);
            }
            if (libName === 'H5P.DragText') soignerLeurresDragText(q.params);
            if (libName === 'H5P.Blanks' && Array.isArray(q.params.questions)) {
                q.params.questions = q.params.questions.map(s => typeof s === 'string' ? cleanBlanksText(s) : s);
            }
            // TrueFalse : convertir le champ legacy "feedback" en feedbackOnCorrect/feedbackOnWrong
            if (libName === 'H5P.TrueFalse' && q.params.feedback && !q.params.feedbackOnCorrect && !q.params.feedbackOnWrong) {
                q.params.feedbackOnWrong = q.params.feedback;
                delete q.params.feedback;
            }
            // DragQuestion : pas de nettoyage spécifique nécessaire
            // (les éléments et labels sont nettoyés par le nettoyage LaTeX récursif global)
            return q;
        });
    }

    return healed;
}


// =======================================================================
// CONVERTERS — Fonctions de conversion enregistrées dans field-constraints.js
// =======================================================================

/**
 * Convertisseur 'stripAll' : supprime tout formatage (Markdown, HTML, LaTeX).
 * Utilisé pour les champs plain (ex: Essay keywords, FindTheWords taskDescription).
 */
function stripAll(text) {
    if (!text || typeof text !== 'string') return text;
    let cleaned = text;
    // Convertir les blocs \(...\) en Unicode avant de supprimer
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToUnicode(inner).trim());
    // Supprimer les commandes LaTeX restantes
    if (/\\[a-zA-Z]/.test(cleaned)) {
        cleaned = latexToUnicode(cleaned);
    }
    // Supprimer le Markdown gras/italique
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    // Supprimer les balises HTML
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    // Décoder les entités HTML courantes
    cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return cleaned.trim();
}

/**
 * Convertisseur 'toLettersOnly' : ne garde que les caractères alphanumériques.
 * Utilisé pour les champs de grille (render 'plain+letters' : Crossword answers uniquement).
 * H5P.Crossword accepte les chiffres dans les réponses (« H2O », « A4 ») — B12.
 * Note : les cas principaux sont déjà gérés par healStructureForActivity()
 * (conversion lettres grecques → noms, filtrage). Ce convertisseur est un filet de sécurité.
 */
function toLettersOnly(text) {
    if (!text || typeof text !== 'string') return text;
    let cleaned = text;
    // Convertir les blocs \(...\) en Unicode d'abord
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToUnicode(inner).trim());
    // Supprimer les commandes LaTeX restantes
    if (/\\[a-zA-Z]/.test(cleaned)) {
        cleaned = latexToUnicode(cleaned);
    }
    // Ne garder que les lettres (y compris accentuées) et les chiffres
    cleaned = cleaned.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]/gu, '');
    return cleaned;
}

// Enregistrer les convertisseurs dans field-constraints.js
registerConverters({
    latexToUnicode: _convertLatexField,
    cleanMarkerText: null, // Dispatché par markerType dans healActivitySpecificFields
    stripAll,
    stripHtmlOnly: stripHtmlKeepLatex,
    toLettersOnly
});
