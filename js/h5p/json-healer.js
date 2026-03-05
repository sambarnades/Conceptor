/**
 * JSON Healer - Module de réparation défensive pour le JSON généré par l'IA (Gemini).
 *
 * L'objectif est de corriger les erreurs communes de syntaxe et de structure
 * sans altérer les fichiers déjà valides.
 */

import { generateUUID, debugLog } from '../core/utils.js';

// =======================================================================
// CONSTANTES PARTAGÉES
// =======================================================================

/** Map des versions de bibliothèques H5P (utilisée par healJsonObject et healStructureForActivity) */
const H5P_LIB_VERSIONS = {
    'H5P.MultiChoice': '1.16',
    'H5P.TrueFalse': '1.8',
    'H5P.Blanks': '1.14',
    'H5P.DragText': '1.10',
    'H5P.MarkTheWords': '1.11',
    'H5P.Essay': '1.5'
};

/** Palette de couleurs par défaut pour Chart */
const CHART_DEFAULT_COLORS = ['#1f4fff', '#5b2e90', '#ff7a18', '#22c55e', '#ef4444'];

/** Ensemble des moduleKeys H5P (pour distinguer des types Moodle) */
const H5P_MODULE_KEYS = new Set([
    'Timeline', 'Flashcards', 'QuizSet', 'QuizSetQCM', 'QuizSetVF',
    'Glossary', 'Crossword', 'Essay', 'Summary', 'DragTheWords',
    'DragAndDrop', 'FillInTheBlanks', 'MarkTheWords', 'TrueFalse',
    'MultipleChoice', 'FindTheWords', 'SortParagraphs', 'SingleChoiceSet',
    'DialogCards', 'ComplexFillTheBlanks', 'Chart'
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
    healed = healed.replace(/(?<!\\)\\(?![\\\/\"u])/g, (match, offset, s) => {
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

        // Liste non exhaustive de commandes LaTeX communes
        const latexCommands = [
            'sqrt', 'geq', 'leq', 'ge', 'le', 'pi', 'times', 'alpha', 'beta', 'mathbb',
            'in', 'infin', 'infty', 'frac', 'sum', 'int', 'vec', 'hat', 'cdot', 'rightarrow',
            'theta', 'lambda', 'sigma', 'omega', 'delta', 'Delta', 'nabla', 'partial',
            'text', 'operatorname', 'setminus', 'overline', 'bar', 'cup', 'cap', 'Arg', 'arg'
        ];

        const commandRegex = new RegExp(`\\\\(${latexCommands.join('|')})(?![a-zA-Z])`, 'g');

        commandRegex.lastIndex = 0;
        if (commandRegex.test(processed)) {
            if (!processed.includes('\\(') && !processed.includes('\\)')) {
                // Cas simple : pas de blocs math existants → envelopper toute la chaîne
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
    result = result.replace(/\$(.+?)\$/g, '\\($1\\)');
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
 * Répare un objet JSON selon les patterns connus de l'IA.
 * @param {Object} obj - L'objet JSON à réparer.
 * @param {string} moduleKey - Le type de module.
 * @returns {Object} L'objet réparé.
 */
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

    // 2. Réparation QuizSet (Structure aplatie -> Params)
    if ((moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') && Array.isArray(healed.questions)) {
        healed.questions = healed.questions.map(q => {
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
            if (q.library && !q.library.includes(' ')) {
                const baseLib = q.library.trim();
                if (H5P_LIB_VERSIONS[baseLib]) {
                    q.library = `${baseLib} ${H5P_LIB_VERSIONS[baseLib]}`;
                }
            }
        });
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
export function healStructureForActivity(data, moduleKey) {
    if (!data || typeof data !== 'object') return data;

    let healed = structuredClone(data);

    // --- H5P commun (tous les types H5P) ---
    if (H5P_MODULE_KEYS.has(moduleKey)) {
        if (!healed.overallFeedback) {
            healed.overallFeedback = [{ from: 0, to: 100, feedback: "" }];
        }
        if (!healed.behaviour) {
            healed.behaviour = { enableRetry: true, enableSolutionsButton: true };
        }
    }

    // --- QuizSet / QuizSetQCM / QuizSetVF ---
    if (moduleKey === 'QuizSet' || moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') {
        if (!healed.progressType) healed.progressType = "dots";
        if (healed.passPercentage === undefined) healed.passPercentage = 50;

        if (Array.isArray(healed.questions)) {
            healed.questions = healed.questions.map(q => {
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
    if (moduleKey === 'MultipleChoice') {
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
    if (moduleKey === 'TrueFalse') {
        if (typeof healed.correct === 'string') {
            healed.correct = healed.correct.toLowerCase() === 'true';
        }
        if (!healed.l10n) healed.l10n = {};
    }

    // --- Flashcards ---
    if (moduleKey === 'Flashcards') {
        if (Array.isArray(healed.cards)) {
            healed.cards = healed.cards.map(card => {
                if (!card.image) card.image = { path: "", alt: "" };
                return card;
            });
        }
    }

    // --- Crossword ---
    if (moduleKey === 'Crossword') {
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
            // Un answer valide = au moins 2 caractères alphabétiques, pas de \commande ni de délimiteurs \(...\)
            const beforeCount = healed.words.length;
            healed.words = healed.words.filter(word => {
                const ans = word.answer || '';
                // Détecter LaTeX restant (commandes ou délimiteurs)
                const hasLatex = /\\[a-zA-Z]/.test(ans) || ans.includes('\\(') || ans.includes('\\)');
                // Détecter symboles Unicode math (pas les lettres grecques déjà converties)
                const hasUnicodeMath = /[\u221A\u2200-\u22FF\u2190-\u21FF]/.test(ans);
                // Vérifier que c'est un mot valide (au moins 2 lettres alphabétiques)
                const isValidWord = /[a-zA-ZÀ-ÿ]{2,}/.test(ans);

                if (hasLatex || hasUnicodeMath || !isValidWord) {
                    debugLog('json-healer', `[JSON Healer] Crossword : suppression de l'entrée "${ans}" (formule math non convertible en mot)`);
                    return false;
                }
                return true;
            });
            if (healed.words.length < beforeCount) {
                debugLog('json-healer', `[JSON Healer] Crossword : ${beforeCount - healed.words.length} entrée(s) supprimée(s) (formules math)`);
            }
        }
    }

    // --- Chart ---
    if (moduleKey === 'Chart') {
        if (Array.isArray(healed.listOfTypes)) {
            healed.listOfTypes = healed.listOfTypes.map((item, i) => {
                if (!item.color) {
                    item.color = CHART_DEFAULT_COLORS[i % CHART_DEFAULT_COLORS.length];
                }
                return item;
            });
        }
        if (!healed.graphMode) healed.graphMode = "bar";
    }

    // --- Timeline ---
    if (moduleKey === 'Timeline') {
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

    // --- DragAndDrop ---
    if (moduleKey === 'DragAndDrop') {
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

    // --- FindTheWords ---
    if (moduleKey === 'FindTheWords') {
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
                // Détecter symboles Unicode math (√, π, α-ω, Σ, ∞, etc.)
                const hasUnicodeMath = /[\u221A\u03B1-\u03C9\u03A0-\u03A9\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u2070-\u209F]/.test(word);

                if (hasLatex || hasUnicodeMath) {
                    debugLog('json-healer', `[JSON Healer] FindTheWords wordList : suppression de "${word}" (formule math dans grille de lettres)`);
                    return false;
                }
                return true;
            });
            if (cleanWords.length < beforeCount) {
                debugLog('json-healer', `[JSON Healer] FindTheWords : ${beforeCount - cleanWords.length} mot(s) supprimé(s) de la wordList (formules math)`);
            }
            healed.wordList = cleanWords.join(',');
        }
    }

    // --- Millionnaire (Moodle) ---
    if (moduleKey === 'Millionnaire') {
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
    if (moduleKey === 'Appariement') {
        if (Array.isArray(healed.pairs)) {
            healed.pairs = healed.pairs.map(pair => {
                if (pair.question === null || pair.question === undefined) pair.question = "";
                if (pair.answer === null || pair.answer === undefined) pair.answer = "";
                return pair;
            });
        }
    }

    // --- QCM (Moodle) ---
    if (moduleKey === 'QCM') {
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
    if (moduleKey === 'Page') {
        if (Array.isArray(healed.blocks)) {
            healed.blocks = healed.blocks.map(block => {
                if (!block.data) block.data = {};
                return block;
            });
        }
    }

    // --- Devoir (Moodle) ---
    if (moduleKey === 'Devoir') {
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

/**
 * Conversion LaTeX → Unicode pour les activités H5P qui ne supportent pas MathJax
 * (DragTheWords, MarkTheWords). Également utilisé par les processeurs H5P.
 * @param {string} text
 * @returns {string}
 */
export function latexToUnicode(text) {
    return text
        // --- Structures ---
        .replace(/\\sqrt\{([^}]+)\}/g, (_, p1) => `√(${p1})`)
        .replace(/\\sqrt(?!\{)/g, '√')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        .replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{N\}/g, 'ℕ')
        .replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\mathbb\{Q\}/g, 'ℚ')
        .replace(/\\mathbb\{C\}/g, 'ℂ')
        .replace(/\\overline\{([^}]+)\}/g, '$1\u0305')
        .replace(/\\vec\{([^}]+)\}/g, '$1\u20D7')
        .replace(/\\hat\{([^}]+)\}/g, '$1\u0302')
        .replace(/\\bar\{([^}]+)\}/g, '$1\u0305')
        .replace(/\\tilde\{([^}]+)\}/g, '$1\u0303')
        // --- Exposants ---
        .replace(/\^\{-1\}/g, '⁻¹').replace(/\^{-1}(?!\d)/g, '⁻¹')
        .replace(/\^\{0\}/g, '⁰').replace(/\^0(?!\d)/g, '⁰')
        .replace(/\^\{1\}/g, '¹').replace(/\^1(?!\d)/g, '¹')
        .replace(/\^\{2\}/g, '²').replace(/\^2(?!\d)/g, '²')
        .replace(/\^\{3\}/g, '³').replace(/\^3(?!\d)/g, '³')
        .replace(/\^\{n\}/g, 'ⁿ').replace(/\^n(?![a-zA-Z])/g, 'ⁿ')
        // --- Indices ---
        .replace(/\_\{0\}/g, '₀').replace(/\_\{1\}/g, '₁').replace(/\_\{2\}/g, '₂')
        .replace(/\_\{3\}/g, '₃').replace(/\_\{n\}/g, 'ₙ').replace(/\_\{i\}/g, 'ᵢ')
        // --- Opérateurs de base ---
        .replace(/\\times(?![a-zA-Z])/g, '×')
        .replace(/\\div(?![a-zA-Z])/g, '÷')
        .replace(/\\cdot(?![a-zA-Z])/g, '·')
        .replace(/\\circ(?![a-zA-Z])/g, '∘')
        .replace(/\\pm(?![a-zA-Z])/g, '±')
        .replace(/\\mp(?![a-zA-Z])/g, '∓')
        // --- Relations ---
        .replace(/\\neq(?![a-zA-Z])/g, '≠')
        .replace(/\\leq(?![a-zA-Z])/g, '≤')
        .replace(/\\le(?![a-zA-Z])/g, '≤')
        .replace(/\\geq(?![a-zA-Z])/g, '≥')
        .replace(/\\ge(?![a-zA-Z])/g, '≥')
        .replace(/\\approx(?![a-zA-Z])/g, '≈')
        .replace(/\\equiv(?![a-zA-Z])/g, '≡')
        .replace(/\\sim(?![a-zA-Z])/g, '∼')
        .replace(/\\simeq(?![a-zA-Z])/g, '≃')
        .replace(/\\propto(?![a-zA-Z])/g, '∝')
        .replace(/\\ll(?![a-zA-Z])/g, '≪')
        .replace(/\\gg(?![a-zA-Z])/g, '≫')
        .replace(/\\perp(?![a-zA-Z])/g, '⊥')
        .replace(/\\parallel(?![a-zA-Z])/g, '∥')
        // --- Flèches (longues AVANT courtes pour éviter les conflits) ---
        .replace(/\\longmapsto(?![a-zA-Z])/g, '⟼')
        .replace(/\\Longrightarrow(?![a-zA-Z])/g, '⟹')
        .replace(/\\Longleftrightarrow(?![a-zA-Z])/g, '⟺')
        .replace(/\\hookrightarrow(?![a-zA-Z])/g, '↪')
        .replace(/\\mapsto(?![a-zA-Z])/g, '↦')
        .replace(/\\leftrightarrow(?![a-zA-Z])/g, '↔')
        .replace(/\\Leftrightarrow(?![a-zA-Z])/g, '⇔')
        .replace(/\\leftarrow(?![a-zA-Z])/g, '←')
        .replace(/\\Leftarrow(?![a-zA-Z])/g, '⇐')
        .replace(/\\rightarrow(?![a-zA-Z])/g, '→')
        .replace(/\\Rightarrow(?![a-zA-Z])/g, '⇒')
        .replace(/\\uparrow(?![a-zA-Z])/g, '↑')
        .replace(/\\downarrow(?![a-zA-Z])/g, '↓')
        .replace(/\\nearrow(?![a-zA-Z])/g, '↗')
        .replace(/\\searrow(?![a-zA-Z])/g, '↘')
        .replace(/\\implies(?![a-zA-Z])/g, '⇒')
        .replace(/\\iff(?![a-zA-Z])/g, '⇔')
        .replace(/\\to(?![a-zA-Z])/g, '→')
        .replace(/\\gets(?![a-zA-Z])/g, '←')
        // --- Ensembles et logique ---
        .replace(/\\in(?![a-zA-Z])/g, '∈')
        .replace(/\\notin(?![a-zA-Z])/g, '∉')
        .replace(/\\subset(?![a-zA-Z])/g, '⊂')
        .replace(/\\subseteq(?![a-zA-Z])/g, '⊆')
        .replace(/\\supset(?![a-zA-Z])/g, '⊃')
        .replace(/\\supseteq(?![a-zA-Z])/g, '⊇')
        .replace(/\\cup(?![a-zA-Z])/g, '∪')
        .replace(/\\cap(?![a-zA-Z])/g, '∩')
        .replace(/\\setminus(?![a-zA-Z])/g, '∖')
        .replace(/\\emptyset(?![a-zA-Z])/g, '∅')
        .replace(/\\varnothing(?![a-zA-Z])/g, '∅')
        .replace(/\\forall(?![a-zA-Z])/g, '∀')
        .replace(/\\exists(?![a-zA-Z])/g, '∃')
        .replace(/\\neg(?![a-zA-Z])/g, '¬')
        .replace(/\\lnot(?![a-zA-Z])/g, '¬')
        .replace(/\\land(?![a-zA-Z])/g, '∧')
        .replace(/\\wedge(?![a-zA-Z])/g, '∧')
        .replace(/\\lor(?![a-zA-Z])/g, '∨')
        .replace(/\\vee(?![a-zA-Z])/g, '∨')
        // --- Analyse et calcul ---
        .replace(/\\infty(?![a-zA-Z])/g, '∞')
        .replace(/\\nabla(?![a-zA-Z])/g, '∇')
        .replace(/\\partial(?![a-zA-Z])/g, '∂')
        .replace(/\\sum(?![a-zA-Z])/g, '∑')
        .replace(/\\prod(?![a-zA-Z])/g, '∏')
        .replace(/\\int(?![a-zA-Z])/g, '∫')
        .replace(/\\oplus(?![a-zA-Z])/g, '⊕')
        .replace(/\\otimes(?![a-zA-Z])/g, '⊗')
        // --- Points de suspension ---
        .replace(/\\ldots(?![a-zA-Z])/g, '…')
        .replace(/\\cdots(?![a-zA-Z])/g, '⋯')
        .replace(/\\dots(?![a-zA-Z])/g, '…')
        // --- Délimiteurs ---
        .replace(/\\lfloor(?![a-zA-Z])/g, '⌊')
        .replace(/\\rfloor(?![a-zA-Z])/g, '⌋')
        .replace(/\\lceil(?![a-zA-Z])/g, '⌈')
        .replace(/\\rceil(?![a-zA-Z])/g, '⌉')
        .replace(/\\langle(?![a-zA-Z])/g, '⟨')
        .replace(/\\rangle(?![a-zA-Z])/g, '⟩')
        // --- Lettres grecques minuscules ---
        .replace(/\\alpha(?![a-zA-Z])/g, 'α')
        .replace(/\\beta(?![a-zA-Z])/g, 'β')
        .replace(/\\gamma(?![a-zA-Z])/g, 'γ')
        .replace(/\\delta(?![a-zA-Z])/g, 'δ')
        .replace(/\\varepsilon(?![a-zA-Z])/g, 'ε')
        .replace(/\\epsilon(?![a-zA-Z])/g, 'ε')
        .replace(/\\zeta(?![a-zA-Z])/g, 'ζ')
        .replace(/\\eta(?![a-zA-Z])/g, 'η')
        .replace(/\\theta(?![a-zA-Z])/g, 'θ')
        .replace(/\\iota(?![a-zA-Z])/g, 'ι')
        .replace(/\\kappa(?![a-zA-Z])/g, 'κ')
        .replace(/\\lambda(?![a-zA-Z])/g, 'λ')
        .replace(/\\mu(?![a-zA-Z])/g, 'μ')
        .replace(/\\nu(?![a-zA-Z])/g, 'ν')
        .replace(/\\xi(?![a-zA-Z])/g, 'ξ')
        .replace(/\\pi(?![a-zA-Z])/g, 'π')
        .replace(/\\rho(?![a-zA-Z])/g, 'ρ')
        .replace(/\\sigma(?![a-zA-Z])/g, 'σ')
        .replace(/\\tau(?![a-zA-Z])/g, 'τ')
        .replace(/\\upsilon(?![a-zA-Z])/g, 'υ')
        .replace(/\\varphi(?![a-zA-Z])/g, 'φ')
        .replace(/\\phi(?![a-zA-Z])/g, 'φ')
        .replace(/\\chi(?![a-zA-Z])/g, 'χ')
        .replace(/\\psi(?![a-zA-Z])/g, 'ψ')
        .replace(/\\omega(?![a-zA-Z])/g, 'ω')
        // --- Lettres grecques majuscules ---
        .replace(/\\Gamma(?![a-zA-Z])/g, 'Γ')
        .replace(/\\Delta(?![a-zA-Z])/g, 'Δ')
        .replace(/\\Theta(?![a-zA-Z])/g, 'Θ')
        .replace(/\\Lambda(?![a-zA-Z])/g, 'Λ')
        .replace(/\\Xi(?![a-zA-Z])/g, 'Ξ')
        .replace(/\\Pi(?![a-zA-Z])/g, 'Π')
        .replace(/\\Sigma(?![a-zA-Z])/g, 'Σ')
        .replace(/\\Phi(?![a-zA-Z])/g, 'Φ')
        .replace(/\\Psi(?![a-zA-Z])/g, 'Ψ')
        .replace(/\\Omega(?![a-zA-Z])/g, 'Ω')
        // --- Nettoyage structural (en dernier) ---
        .replace(/\\left/g, '').replace(/\\right/g, '')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\mathrm\{([^}]+)\}/g, '$1')
        .replace(/\\\(|\\\)/g, '');
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
    let cleaned = text;

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

    // Standalone MarkTheWords
    if (moduleKey === 'MarkTheWords') {
        if (healed.textField) {
            healed.textField = cleanMarkTheWordsText(healed.textField);
        }
        return healed;
    }

    // Standalone DragTheWords
    if (moduleKey === 'DragTheWords') {
        if (healed.textField) {
            healed.textField = cleanDragTextText(healed.textField);
        }
        return healed;
    }

    // Standalone FillInTheBlanks
    if (moduleKey === 'FillInTheBlanks') {
        if (Array.isArray(healed.questions)) {
            healed.questions = healed.questions.map(q => typeof q === 'string' ? cleanBlanksText(q) : q);
        }
        return healed;
    }

    // Chart : pas de MathDisplay, convertir le LaTeX en Unicode dans les champs text
    if (moduleKey === 'Chart') {
        if (Array.isArray(healed.listOfTypes)) {
            healed.listOfTypes = healed.listOfTypes.map(item => {
                if (item.text && typeof item.text === 'string') {
                    // Convertir les blocs \(...\) en Unicode
                    let cleaned = item.text.replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => {
                        return latexToUnicode(inner).trim();
                    });
                    // Convertir les commandes LaTeX restantes (sans délimiteurs)
                    if (/\\[a-zA-Z]/.test(cleaned)) {
                        cleaned = latexToUnicode(cleaned);
                    }
                    if (cleaned !== item.text) {
                        debugLog('json-healer', `[JSON Healer] Chart text : "${item.text}" → "${cleaned}" (LaTeX → Unicode)`);
                    }
                    item.text = cleaned;
                }
                return item;
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
