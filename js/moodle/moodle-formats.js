/**
 * @file Générateurs de formats d'export Moodle (XML, GIFT).
 */

import { parseClozeGaps, parseGapAnswers } from './mbz-course-builder.js';
import { valeurNumerique } from './test-evaluation.js';

export function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/[^\x20-\x7E]/gu, function (ch) {
            const cp = ch.codePointAt(0);
            // Caractères de contrôle C0 (hors \t \n \r) : interdits en XML 1.0,
            // même sous forme de référence numérique → on les supprime
            if (cp < 0x20 && cp !== 0x09 && cp !== 0x0A && cp !== 0x0D) return '';
            // Filtrer les code points invalides en XML (surrogates, non-caractères)
            if ((cp >= 0xD800 && cp <= 0xDFFF) || cp === 0xFFFE || cp === 0xFFFF) return '';
            return '&#' + cp + ';';
        });
}

/**
 * Vrai si `cp` est un caractère AUTORISÉ en XML 1.0 (mêmes règles que le filtre
 * de escapeXml : tab/LF/CR tolérés, C0 interdits, surrogates et FFFE/FFFF exclus,
 * hors-plage exclu). Sert à valider une référence numérique déjà présente.
 * @param {number} cp
 * @returns {boolean}
 */
function isXmlChar(cp) {
    if (cp === 0x09 || cp === 0x0A || cp === 0x0D) return true;
    if (cp < 0x20) return false;                    // autres contrôles C0
    if (cp > 0x10FFFF) return false;                // hors plage Unicode
    if (cp >= 0xD800 && cp <= 0xDFFF) return false; // surrogates
    if (cp === 0xFFFE || cp === 0xFFFF) return false; // non-caractères
    return true;
}

/**
 * Échappe pour insertion dans un élément XML un contenu qui est DÉJÀ du HTML
 * (issu de markdownToHtml / formatTextToHtml). Objectif : produire du XML
 * TOUJOURS bien formé tout en évitant le double-échappement des entités XML
 * (`&gt;` NE doit PAS devenir `&amp;gt;`) qui corrompait l'intro Appariement/Devoir.
 *
 * Ne sont PRÉSERVÉES telles quelles QUE les références d'entités RÉELLEMENT
 * valides dans un XML sans DTD :
 *   - les 5 entités nommées prédéfinies : `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` ;
 *   - les références numériques (`&#233;`, `&#x1F4A1;`) dont le code point est un
 *     caractère XML 1.0 légal.
 * TOUTE autre séquence — entité HTML non prédéfinie (`&nbsp;`, `&eacute;`, `&copy;`),
 * variante de casse (`&AMP;`), référence numérique interdite (`&#0;`, `&#xD800;`,
 * `&#999999999;`) ou faux ami (`Curie & Einstein`) — voit son `&` échappé en `&amp;`
 * par escapeXml : le XML reste bien formé, et le double décodage de Moodle (restore
 * XML → rendu HTML) restitue correctement `&amp;nbsp;` → `&nbsp;` → espace insécable.
 *
 * @param {string} html - HTML propre à insérer dans un élément XML
 * @returns {string} HTML échappé une seule fois, XML garanti bien formé
 */
export function escapeXmlPreservingEntities(html) {
    const s = String(html);
    // Candidats-entités : référence décimale, hexadécimale, ou l'une des 5 entités
    // nommées prédéfinies en XML. Les captures 1/2 = valeur numérique (déc/hex).
    const ENTITY = /&(?:#(\d+)|#x([0-9a-fA-F]+)|amp|lt|gt|quot|apos);/g;
    let out = '', last = 0, m;
    while ((m = ENTITY.exec(s)) !== null) {
        out += escapeXml(s.slice(last, m.index)); // texte hors-entité → échappé
        let keep;
        if (m[1] !== undefined || m[2] !== undefined) {
            // Référence numérique : préservée seulement si le code point est XML-légal.
            const cp = m[1] !== undefined ? parseInt(m[1], 10) : parseInt(m[2], 16);
            keep = isXmlChar(cp);
        } else {
            keep = true; // entité nommée prédéfinie (amp/lt/gt/quot/apos)
        }
        out += keep ? m[0] : escapeXml(m[0]); // entité invalide → & échappé en &amp;
        last = m.index + m[0].length;
    }
    out += escapeXml(s.slice(last));
    return out;
}

/**
 * Protège une chaîne pour insertion dans une section CDATA.
 * Remplace la séquence ]]> qui terminerait prématurément la section CDATA
 * et supprime les caractères de contrôle C0 (hors \t \n \r), interdits
 * en XML 1.0 même dans une section CDATA.
 */
function escapeCdata(str) {
    return String(str)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/\]\]>/g, ']]]]><![CDATA[>');
}

/**
 * Génère le XML des indices (hints) pour une question.
 * @param {Array<string>} hints - Tableau de chaînes d'indices.
 * @returns {string} Le XML des hints.
 */
function generateHintsXml(hints) {
    if (!Array.isArray(hints) || hints.length === 0) return '';
    return hints.map(h => `
    <hint format="html">
      <text><![CDATA[<p>${escapeCdata(h)}</p>]]></text>
    </hint>`).join('');
}

/**
 * Génère le XML des feedbacks combinés (correct, partiellement correct, incorrect).
 * @param {Object} content - Le contenu de la question.
 * @returns {string} Le XML des feedbacks combinés.
 */
function generateCombinedFeedbackXml(content) {
    const parts = [];
    if (content.correctfeedback) {
        parts.push(`
    <correctfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.correctfeedback)}</p>]]></text>
    </correctfeedback>`);
    }
    if (content.partiallycorrectfeedback) {
        parts.push(`
    <partiallycorrectfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.partiallycorrectfeedback)}</p>]]></text>
    </partiallycorrectfeedback>`);
    }
    if (content.incorrectfeedback) {
        parts.push(`
    <incorrectfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.incorrectfeedback)}</p>]]></text>
    </incorrectfeedback>`);
    }
    if (parts.length > 0) parts.push(`
    <shownumcorrect/>`);
    return parts.join('');
}

/**
 * Échappe les caractères spéciaux GIFT dans le contenu utilisateur.
 * Le parseur GIFT de Moodle tokenise sur ~ = # { } partout dans un bloc
 * {...} (pas seulement en début de ligne) : une réponse « 2 + 2 = 4 »
 * serait coupée sans échappement. Le parseur dé-échappe \= \~ \# \{ \}
 * à l'import, y compris dans le texte de question.
 * On ne touche pas aux backslashes (LaTeX) ni aux : (HTML, LaTeX) —
 * voir escapeGiftTitle pour les : des titres ::…::.
 * @param {string} str - La chaîne à échapper
 * @returns {string} La chaîne échappée
 */
function escapeGift(str) {
    return String(str)
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/=/g, '\\=')
        .replace(/~/g, '\\~')
        .replace(/#/g, '\\#');
}

/**
 * Échappe une chaîne destinée à un titre GIFT (::titre::).
 * Le : y est significatif (délimiteur de titre) et doit donc être échappé,
 * en plus des caractères gérés par escapeGift.
 * @param {string} str - Le titre à échapper
 * @returns {string} Le titre échappé
 */
function escapeGiftTitle(str) {
    return escapeGift(str).replace(/:/g, '\\:');
}

/**
 * Génère le contenu d'un fichier XML de banque de questions Moodle à partir d'un objet de données.
 * @param {Object} data - L'objet contenant la structure de la banque de questions.
 * @returns {string} Le contenu du fichier XML.
 */
export function generateMoodleXml(data) {
    data = reparerConsignesTest(data);
    verifierTrousCloze(data);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;

    if (data.bank_name) {
        xml += `
  <!-- question: 0  -->
  <question type="category">
    <category>
      <text>$course$/top/${escapeXml(data.bank_name)}</text>
    </category>
    <info format="moodle_auto_format">
      <text>${escapeXml(data.bank_description)}</text>
    </info>
    <idnumber></idnumber>
  </question>
`;
    }

    // Options globales QCM (answernumbering, showstandardinstruction)
    const globalOptions = data.options || {};

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(question => {
            let questionXml;
            switch (question.type) {
                case 'matching':
                    questionXml = generateMatchingQuestionXml(question.content);
                    break;
                case 'multichoice':
                    questionXml = generateMultichoiceQuestionXml(question.content, { ...question.content, ...globalOptions });
                    break;
                case 'truefalse':
                    questionXml = generateTrueFalseQuestionXml(question.content);
                    break;
                case 'shortanswer':
                    questionXml = generateShortanswerQuestionXml(question.content);
                    break;
                case 'numerical':
                    questionXml = generateNumericalQuestionXml(question.content);
                    break;
                case 'cloze':
                    questionXml = generateClozeQuestionXml(question.content);
                    break;
                default:
                    throw new Error(`test_unsupported_question_type:${question.type}`);
            }
            const c = question.content || {};
            const fields = `${c.defaultgrade !== undefined ? `\n    <defaultgrade>${escapeXml(c.defaultgrade)}</defaultgrade>` : ''}${c.penalty !== undefined ? `\n    <penalty>${escapeXml(c.penalty)}</penalty>` : ''}`;
            // Ancrer sur la fermeture finale : un énoncé peut contenir littéralement
            // « </question> » dans son CDATA sans être une balise du document.
            xml += questionXml.replace(/<\/question>\s*$/, `${fields}\n  </question>`);
        });
    }
    xml += '</quiz>';
    return xml;
}

/**
 * Canonicalise un modèle de Test (banque de questions) : applique EXACTEMENT les
 * mêmes normalisations que `generateMoodleXml` (fractions Moodle valides, mode
 * `single` déterminé, `truefalse.value` → booléen réel, numériques nettoyés), mais
 * SANS DOM — sur le modèle directement, pas via un aller-retour XML. Garantit que
 * l'export `.mbz` (format BACKUP) note EXACTEMENT comme l'export `.xml`, et rend
 * `buildTestMbz` exécutable hors navigateur (harness Node : pas de DOMParser).
 *
 * Les fractions restent sur l'échelle 0-100 (le builder BACKUP divise par 100).
 * matching et cloze sont inchangés (pas de normalisation numérique/fraction).
 *
 * @param {{ bank_name?, bank_description?, options?, questions?:Array<{type,content}> }} model
 * @returns {{ bank_name, bank_description, options, questions:Array<{type,content}> }}
 */
export function canonicalizeTestModel(model) {
    const src = reparerConsignesTest(model || {});
    verifierTrousCloze(src);
    const questions = Array.isArray(src.questions) ? src.questions : [];
    const outQuestions = questions.map(q => {
        const type = q.type;
        const c = { ...(q.content || {}) };
        if (type === 'multichoice') {
            const answers = Array.isArray(c.answers) ? c.answers : [];
            const isSingle = determineSingleMode(c.single, answers);
            c.single = isSingle;
            c.answers = normalizeMultichoiceFractions(answers, isSingle);
        } else if (type === 'shortanswer') {
            c.answers = normalizeShortanswerFractions(Array.isArray(c.answers) ? c.answers : []);
        } else if (type === 'truefalse') {
            const a = { ...(c.answer || {}) };
            a.value = parseTrueFalseValue(a.value);
            c.answer = a;
        } else if (type === 'numerical') {
            const [answer, ...alternatives] = numericalAnswers(c);
            c.answer = answer;
            if (alternatives.length || c.alternatives) c.alternatives = alternatives;
        }
        // matching, cloze : inchangés
        return { ...q, type, content: c };
    });
    return {
        ...src,
        bank_name: src.bank_name || '',
        bank_description: src.bank_description || '',
        options: src.options || {},
        questions: outQuestions,
    };
}

/**
 * L’IA peut insérer une réponse Cloze dans une question numérique classique.
 * Moodle affiche alors le code en clair ET son champ Réponse séparé. Un trou
 * numérique unique devient une ellipse ; la réponse explicite reste prioritaire.
 * Plusieurs trous constituent une vraie question Cloze. Aucun contenu n’est perdu.
 */
export function reparerConsignesTest(model) {
    if (!model || !Array.isArray(model.questions)) return model;
    return { ...model, questions: model.questions.map(q => {
        if (q?.type !== 'numerical' || !q.content) return q;
        const c = q.content;
        const motif = /\{\d+(?:\.\d+)?:\s*(?:NUMERICAL|NM):\s*(?:=|%100%)([-+]?\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?)(?::([-+]?\d+(?:[.,]\d+)?(?:[eE][-+]?\d+)?))?(?:#[^{}]*)?\}/gi;
        const texte = String(c.questiontext || '');
        const trous = [...texte.matchAll(motif)];
        if (!trous.length) return q;
        if (trous.length > 1) return { ...q, type: 'cloze', content: { ...c } };
        const a = c.answer || {};
        return { ...q, content: { ...c, questiontext: texte.replace(motif, '…'), answer: {
            ...a,
            number: a.number ?? Number(trous[0][1].replace(',', '.')),
            tolerance: a.tolerance ?? Math.abs(Number((trous[0][2] || '0').replace(',', '.'))),
        } } };
    }) };
}

/**
 * Un trou de question à trous qui ne peut JAMAIS être réussi : aucune réponse
 * créditée, ou une réponse NUMERICAL qui n'est pas un nombre.
 *
 * Constaté sur un parcours réel (28 sept. 2026) : le modèle a écrit
 * `{1:NUMERICAL:=Réponse attendue:0}` et mis le nombre ailleurs. Moodle restaure
 * la question telle quelle, et l'élève ne peut que se tromper. Son propre
 * éditeur refuse d'ailleurs d'enregistrer un tel trou (« une des réponses doit
 * valoir 100 % »).
 */
function trouInjouable(gap) {
    const { kind, answers } = parseGapAnswers(gap);
    return !answers.some(a => a.fraction > 0 && (kind === 'numerical'
        ? a.number === '*' || (Number.isFinite(valeurNumerique(a.number))
            && (a.tolerance === '' || Number.isFinite(valeurNumerique(a.tolerance))))
        : String(a.text).trim() !== ''));
}

/**
 * Refuse un Test dont une question à trous est injouable (trou sans bonne
 * réponse, ou sans aucun trou). On REFUSE plutôt que de retirer la question :
 * rien ne disparaît sans le dire (cf. `run_test_edition_audit`). L'enseignant
 * la corrige dans l'éditeur, ou génère l'activité à nouveau.
 *
 * @throws {Error} `test_cloze_injouable:<n° de question>`
 */
export function verifierTrousCloze(model) {
    (Array.isArray(model?.questions) ? model.questions : []).forEach((q, i) => {
        if (q?.type !== 'cloze') return;
        const { gaps } = parseClozeGaps(q.content?.questiontext);
        if (!gaps.length || gaps.some(trouInjouable)) throw new Error(`test_cloze_injouable:${i + 1}`);
    });
}

function generateMatchingQuestionXml(content) {
    const subquestions = Array.isArray(content.subquestions) ? content.subquestions : [];
    let subquestionsXml = subquestions.map(sq => `
    <subquestion format="html">
      <text><![CDATA[<p>${escapeCdata(sq.text || '')}</p>]]></text>
      <answer>
        <text>${escapeXml(sq.answer || '')}</text>
      </answer>
    </subquestion>`).join('');

    const combinedFeedbackXml = generateCombinedFeedbackXml(content);
    const hintsXml = generateHintsXml(content.hints);

    return `
  <question type="matching">
    <name>
      <text>${escapeXml(content.name || '')}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext || '')}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <shuffleanswers>${content.shuffleanswers === false || content.shuffleanswers === 0 ? 'false' : 'true'}</shuffleanswers>${combinedFeedbackXml}
    ${subquestionsXml}${hintsXml}
  </question>`;
}

/**
 * Fractions positives acceptées par Moodle pour les questions multichoice.
 * Valeurs imposées par le code Moodle (question/type/multichoice), triées par ordre décroissant.
 * @see https://github.com/moodle/moodle/blob/main/question/type/multichoice/questiontype.php
 */
export const VALID_MOODLE_FRACTIONS = [
    100, 90, 83.33333, 80, 75, 70, 66.66667, 60, 50, 40,
    33.33333, 30, 25, 20, 16.66667, 14.28571, 12.5, 11.11111, 10, 5
];

/**
 * Retourne la fraction Moodle valide la plus proche de x, signe préservé.
 * Un pourcentage hors de la liste officielle (ex: -33.333333333333336)
 * fait rejeter la question à l'import GIFT. 0 est aussi une fraction valide.
 * @param {number} x - Pourcentage quelconque (positif ou négatif)
 * @returns {number} Fraction Moodle valide la plus proche (même signe)
 */
function fractionMoodleValide(x) {
    const n = Number(x) || 0;
    const abs = Math.abs(n);
    let best = 0;
    let minDiff = abs; // distance à la fraction 0
    for (const f of VALID_MOODLE_FRACTIONS) {
        const diff = Math.abs(abs - f);
        if (diff < minDiff) {
            minDiff = diff;
            best = f;
        }
    }
    return n < 0 ? -best : best;
}

/**
 * Normalise les fractions d'un tableau de réponses multichoice pour respecter les contraintes Moodle :
 * 1. Chaque fraction positive → arrondie à la valeur Moodle valide la plus proche
 * 2. La somme des fractions positives doit être exactement 100
 * 3. Les fractions nulles/négatives restent à 0
 *
 * @param {Array} answers - Tableau de réponses { fraction, text, feedback, ... }
 * @returns {Array} Nouveau tableau avec les fractions corrigées (objets clonés superficiellement)
 */
export function normalizeFractions(answers) {
    if (!Array.isArray(answers) || answers.length === 0) return answers;

    const positiveIndices = [];
    const result = answers.map((ans, i) => {
        const f = Number(ans.fraction) || 0;
        if (f > 0) positiveIndices.push(i);
        return { ...ans, fraction: f };
    });

    // Aucune fraction positive → rien à normaliser
    if (positiveIndices.length === 0) return result;

    // Réponse unique (une seule fraction > 0) → mettre à 100
    if (positiveIndices.length === 1) {
        result[positiveIndices[0]].fraction = 100;
        return result;
    }

    // Réponses multiples : trouver la meilleure combinaison de fractions Moodle valides
    // qui somme à exactement 100
    const n = positiveIndices.length;
    const targetSum = 100;

    // Stratégie : répartition équitable puis ajustement
    // 1. Trouver la fraction Moodle la plus proche de (100 / n) pour chaque réponse positive
    const equalShare = targetSum / n;
    const baseFraction = findClosestValidFraction(equalShare);

    // 2. Vérifier si n * baseFraction = 100
    if (Math.abs(n * baseFraction - 100) < 0.001) {
        // Distribution parfaite (ex: 2×50, 3×33.33333, 4×25, 5×20)
        for (const idx of positiveIndices) {
            result[idx].fraction = baseFraction;
        }
        return result;
    }

    // 3. Sinon, utiliser une combinaison mixte :
    //    Chercher (k × fractionA + (n-k) × fractionB) == 100
    //    avec fractionA et fractionB valides Moodle
    const combo = findValidCombination(n);
    if (combo) {
        // Répartir proportionnellement aux fractions originales
        // Les réponses avec les plus fortes fractions d'origine reçoivent la fraction la plus haute
        const sorted = positiveIndices
            .map(idx => ({ idx, origFraction: Number(answers[idx].fraction) || 0 }))
            .sort((a, b) => b.origFraction - a.origFraction);

        for (let i = 0; i < sorted.length; i++) {
            result[sorted[i].idx].fraction = i < combo.countHigh ? combo.high : combo.low;
        }
        return result;
    }

    // 4. Fallback : distribuer en arrondissant au plus proche, ajuster le dernier
    for (const idx of positiveIndices) {
        result[idx].fraction = findClosestValidFraction(Number(answers[idx].fraction) || equalShare);
    }
    // Ajuster pour que la somme soit 100
    const currentSum = positiveIndices.reduce((sum, idx) => sum + result[idx].fraction, 0);
    if (Math.abs(currentSum - 100) > 0.001) {
        const diff = 100 - currentSum;
        // Ajuster la dernière réponse positive
        const lastIdx = positiveIndices[positiveIndices.length - 1];
        const adjusted = result[lastIdx].fraction + diff;
        result[lastIdx].fraction = findClosestValidFraction(adjusted);
    }
    return result;
}

/**
 * Normalise les fractions d'un tableau de réponses SHORTANSWER pour respecter
 * la contrainte Moodle : au moins une réponse doit valoir exactement 100 %,
 * sinon l'import Moodle/Éléa rejette TOUTE la banque
 * (erreur « fractionsnomax » : "L'une des réponses doit donner un score de 100 %…").
 *
 * Contrairement au multichoice, les fractions d'un shortanswer ne se partagent PAS :
 * chaque réponse est une alternative acceptée indépendante, notée sur 100.
 * Deux alternatives également correctes doivent donc valoir 100 chacune (et non 50/50).
 *
 * Stratégie : mise à l'échelle pour que la meilleure réponse vaille 100, puis
 * arrondi de chaque fraction à la valeur Moodle valide la plus proche. Les
 * pénalités (fractions ≤ 0) sont préservées. Si aucune réponse n'est correcte
 * (toutes ≤ 0), on force la première à 100 pour que l'import n'échoue pas.
 *
 * @param {Array} answers - Tableau de réponses { fraction, text, feedback, ... }
 * @returns {Array} Nouveau tableau avec les fractions corrigées (objets clonés superficiellement)
 */
export function normalizeShortanswerFractions(answers) {
    if (!Array.isArray(answers) || answers.length === 0) return answers;

    const nums = answers.map(a => Number(a.fraction) || 0);
    const maxFraction = Math.max(...nums);

    // Aucune réponse correcte (toutes les fractions ≤ 0) : shortanswer malformé.
    // On force la première réponse à 100 pour éviter le rejet de tout l'import.
    if (maxFraction <= 0) {
        return answers.map((ans, i) => ({
            ...ans,
            fraction: i === 0 ? 100 : fractionMoodleValide(nums[i])
        }));
    }

    // Mise à l'échelle : la meilleure réponse devient 100, les autres suivent
    // proportionnellement, puis chaque fraction est arrondie à une valeur Moodle valide.
    const factor = 100 / maxFraction;
    return answers.map((ans, i) => {
        const f = nums[i];
        // Ne pas mettre à l'échelle les pénalités (≤ 0) : on les arrondit telles quelles.
        const scaled = f > 0 ? f * factor : f;
        return { ...ans, fraction: fractionMoodleValide(scaled) };
    });
}

/**
 * Trouve la fraction Moodle valide la plus proche d'une valeur cible.
 */
function findClosestValidFraction(target) {
    let closest = VALID_MOODLE_FRACTIONS[0];
    let minDiff = Math.abs(target - closest);
    for (const f of VALID_MOODLE_FRACTIONS) {
        const diff = Math.abs(target - f);
        if (diff < minDiff) {
            minDiff = diff;
            closest = f;
        }
    }
    return closest;
}

/**
 * Cherche une combinaison de 2 fractions Moodle valides dont la somme pondérée = 100.
 * Retourne { high, low, countHigh } ou null.
 * @param {number} n - Nombre de réponses positives
 */
function findValidCombination(n) {
    for (const high of VALID_MOODLE_FRACTIONS) {
        for (const low of VALID_MOODLE_FRACTIONS) {
            if (low > high) continue;
            // k réponses à 'high', (n-k) à 'low'
            // k * high + (n-k) * low = 100
            // k = (100 - n*low) / (high - low)
            if (high === low) continue;
            const k = (100 - n * low) / (high - low);
            if (k >= 1 && k <= n - 1 && Math.abs(k - Math.round(k)) < 0.001) {
                return { high, low, countHigh: Math.round(k) };
            }
        }
    }
    // Toutes les mêmes
    for (const f of VALID_MOODLE_FRACTIONS) {
        if (Math.abs(n * f - 100) < 0.001) {
            return { high: f, low: f, countHigh: n };
        }
    }
    return null;
}

/**
 * Normalise les fractions d'un QCM à réponse UNIQUE : la meilleure réponse vaut
 * 100 si elle manque. Une banque déjà valide conserve ses crédits partiels et
 * pénalités : Moodle exige une réponse à 100, pas des distracteurs tous à zéro.
 * Indispensable quand le LLM déclare single="true" mais répartit le crédit sur
 * plusieurs réponses (ex: 50/50) : sans ça, normalizeFractions produit un QCM
 * single sans aucune réponse à 100 → tout l'import est rejeté.
 * @param {Array} answers - Tableau de réponses { fraction, ... }
 * @returns {Array} Nouveau tableau (objets clonés) avec une seule réponse à 100
 */
function normalizeSingleChoiceFractions(answers) {
    if (!Array.isArray(answers) || answers.length === 0) return answers;
    const nums = answers.map(a => Number(a.fraction) || 0);
    if (nums.some(n => n === 100)) return answers.map((ans, i) => ({ ...ans, fraction: Math.max(-100, Math.min(100, nums[i])) }));
    let maxIdx = 0;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[maxIdx]) maxIdx = i;
    }
    // Si toutes les fractions sont ≤ 0, maxIdx reste 0 → la première devient la bonne réponse.
    return answers.map((ans, i) => ({ ...ans, fraction: i === maxIdx ? 100 : 0 }));
}

/**
 * Applique la normalisation adaptée au mode d'un QCM :
 * - single  → une seule réponse à 100 (normalizeSingleChoiceFractions)
 * - multiple → répartition des positives à somme 100 (normalizeFractions),
 *   avec repli sur le mode single si aucune réponse positive n'existe
 *   (un QCM multiple sans positive est rejeté : « fractionsaddwrong »).
 * @param {Array} answers - réponses brutes
 * @param {string} isSingle - 'true' ou 'false'
 * @returns {Array} réponses avec fractions normalisées
 */
function normalizeMultichoiceFractions(answers, isSingle) {
    if (isSingle === 'true') return normalizeSingleChoiceFractions(answers);
    const normalized = normalizeFractions(answers);
    if (Array.isArray(normalized) && normalized.length &&
        !normalized.some(a => Number(a.fraction) > 0)) {
        return normalizeSingleChoiceFractions(answers);
    }
    return normalized;
}

/**
 * Détermine si une question multichoice est à réponse unique ou multiple.
 * Gère les 3 cas : champ explicite (string/booléen), absent (auto-détection via fractions).
 * @param {*} singleValue - La valeur du champ "single" (string, booléen, undefined)
 * @param {Array} answers - Le tableau des réponses avec leur fraction
 * @returns {string} 'true' ou 'false' pour le XML Moodle
 */
function determineSingleMode(singleValue, answers) {
    // Cas 1 : champ explicite fourni (éditeur = string, LLM = possiblement booléen)
    if (singleValue !== undefined && singleValue !== null) {
        return String(singleValue);
    }
    // Cas 2 : auto-détection à partir des fractions
    const correctCount = answers.filter(a => Number(a.fraction) > 0).length;
    return correctCount > 1 ? 'false' : 'true';
}

function generateMultichoiceQuestionXml(content, globalOptions = {}) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    // Le mode (unique/multiple) se détermine sur les fractions BRUTES : sinon la
    // normalisation « multiple » (répartition somme=100) peut convertir une question
    // à réponse unique en 50/50 et casser l'import (aucune réponse à 100 %).
    const isSingle = determineSingleMode(content.single, answers);
    const normalizedAnswers = normalizeMultichoiceFractions(answers, isSingle);
    let answersXml = normalizedAnswers.map(ans => `
    <answer fraction="${ans.fraction}" format="html">
      <text><![CDATA[<p>${escapeCdata(ans.text || '')}</p>]]></text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(ans.feedback || '')}</p>]]></text>
      </feedback>
    </answer>`).join('');

    const combinedFeedbackXml = generateCombinedFeedbackXml(content);
    const hintsXml = generateHintsXml(content.hints);
    const numbering = globalOptions.answernumbering || 'none';
    const showInstruction = globalOptions.showstandardinstruction !== undefined ? globalOptions.showstandardinstruction : 1;

    return `
  <question type="multichoice">
    <name>
      <text>${escapeXml(content.name || '')}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext || '')}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <single>${isSingle}</single>
    <shuffleanswers>${content.shuffleanswers === false || content.shuffleanswers === 0 ? 'false' : 'true'}</shuffleanswers>
    <answernumbering>${numbering}</answernumbering>
    <showstandardinstruction>${showInstruction}</showstandardinstruction>${combinedFeedbackXml}
    ${answersXml}${hintsXml}
  </question>`;
}

/**
 * Interprète la valeur de vérité d'une question truefalse de façon robuste.
 * En JS la chaîne "false" est truthy : un LLM qui émet `"value": "false"` (au lieu
 * du booléen `false`) inverserait silencieusement la bonne réponse. On normalise
 * donc explicitement les formes textuelles négatives.
 * @param {*} v - booléen ou chaîne ("true"/"false"/"vrai"/"faux"/"0"/"1"/"non"/"oui"…)
 * @returns {boolean} true si la bonne réponse est « Vrai »
 */
function parseTrueFalseValue(v) {
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return !['false', 'faux', 'no', 'non', '0', 'n', 'f', ''].includes(s);
    }
    return Boolean(v);
}

function generateTrueFalseQuestionXml(content) {
    const answer = content.answer || {};
    const isTrue = parseTrueFalseValue(answer.value);
    const fractionTrue = isTrue ? 100 : 0;
    const fractionFalse = isTrue ? 0 : 100;

    const hintsXml = generateHintsXml(content.hints);

    return `
  <question type="truefalse">
    <name>
      <text>${escapeXml(content.name || '')}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext || '')}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <answer fraction="${fractionTrue}" format="moodle_auto_format">
      <text>true</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(answer.feedback_true || '')}</p>]]></text>
      </feedback>
    </answer>
    <answer fraction="${fractionFalse}" format="moodle_auto_format">
      <text>false</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(answer.feedback_false || '')}</p>]]></text>
      </feedback>
    </answer>${hintsXml}
  </question>`;
}

function generateShortanswerQuestionXml(content) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    // Garantit qu'au moins une réponse vaut 100 % (sinon rejet à l'import Moodle/Éléa).
    const normalizedAnswers = normalizeShortanswerFractions(answers);
    let answersXml = normalizedAnswers.map(ans => `
    <answer fraction="${ans.fraction || 0}" format="moodle_auto_format">
      <text>${escapeXml(ans.text || '')}</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(ans.feedback || '')}</p>]]></text>
      </feedback>
    </answer>`).join('');

    const hintsXml = generateHintsXml(content.hints);

    return `
  <question type="shortanswer">
    <name>
      <text>${escapeXml(content.name || '')}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext || '')}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <usecase>${[true, 1, '1', 'true'].includes(content.usecase) ? 1 : 0}</usecase>
    ${answersXml}${hintsXml}
  </question>`;
}

/**
 * Normalise une valeur numérique issue du LLM pour Moodle :
 * virgule décimale → point, puis extraction du premier nombre (retire les unités
 * « 9.81 m/s² », les symboles « ±0.5 », « 5 % », la virgule « 0,83 »). Indispensable
 * car PHP `is_numeric` refuse la virgule décimale → l'import GIFT rejette « 0,83 »,
 * et une unité collée casse la réponse numérique. Garantit aussi une chaîne sûre en XML.
 * @param {*} v - valeur brute (nombre ou chaîne)
 * @param {number} fallback - valeur si aucun nombre n'est trouvé
 * @returns {string} chaîne numérique (ex: "9.81", "-3", "0")
 */
function normalizeNumericValue(v, fallback = 0) {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    const s = String(v == null ? '' : v).replace(',', '.');
    const m = s.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/);
    return m ? m[0] : String(fallback);
}

/** Réponse principale et variantes numériques : tolérance, crédit et retour propres. */
export function numericalAnswers(content) {
    return [content.answer || {}, ...(Array.isArray(content.alternatives) ? content.alternatives : [])].map(a => ({
        ...a,
        number: a.number === '*' ? '*' : normalizeNumericValue(a.number, 0),
        tolerance: String(Math.abs(Number(normalizeNumericValue(a.tolerance, 0)))),
        fraction: Math.max(0, Math.min(100, Number(a.fraction ?? 100))),
    }));
}

function generateNumericalQuestionXml(content) {
    const hintsXml = generateHintsXml(content.hints);
    const answersXml = numericalAnswers(content).map(answer => `
    <answer fraction="${answer.fraction}" format="moodle_auto_format">
      <text>${answer.number}</text>
      <tolerance>${answer.tolerance}</tolerance>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(answer.feedback || '')}</p>]]></text>
      </feedback>
    </answer>`).join('');

    return `
  <question type="numerical">
    <name>
      <text>${escapeXml(content.name || '')}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext || '')}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    ${answersXml}${hintsXml}
  </question>`;
}

function generateClozeQuestionXml(content) {
    const hintsXml = generateHintsXml(content.hints);

    return `
    <question type="cloze">
        <name>
            <text>${escapeXml(content.name || '')}</text>
        </name>
        <questiontext format="html">
            <text><![CDATA[${escapeCdata(content.questiontext || '')}]]></text>
        </questiontext>
        <generalfeedback format="html">
            <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
        </generalfeedback>${hintsXml}
    </question>`;
}

/**
 * Génère le contenu d'un fichier au format GIFT de Moodle à partir d'un objet de données.
 * @param {Object} data - L'objet contenant la structure de la banque de questions.
 * @returns {string} Le contenu du fichier au format GIFT.
 */
export function generateMoodleGift(data) {
    data = reparerConsignesTest(data);
    verifierTrousCloze(data);
    let gift_string = "";

    if (data.bank_name) {
        gift_string += `// question: 0 name: Switch category to $course$/top/${data.bank_name}\n`;
        gift_string += `$CATEGORY: $course$/top/${data.bank_name}\n\n`;
    }

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(question => {
            switch (question.type) {
                case 'multichoice':
                    gift_string += generateMultichoiceGift(question.content);
                    break;
                case 'matching':
                    gift_string += generateMatchingGift(question.content);
                    break;
                case 'truefalse':
                    gift_string += generateTrueFalseGift(question.content);
                    break;
                case 'shortanswer':
                    gift_string += generateShortanswerGift(question.content);
                    break;
                case 'numerical':
                    gift_string += generateNumericalGift(question.content);
                    break;
                default:
                    throw new Error(`test_gift_unsupported_question_type:${question.type}`);
            }
        });
    }

    return gift_string;
}

function generateMultichoiceGift(content) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    // Mode déterminé sur les fractions brutes (cf. generateMultichoiceQuestionXml).
    const isSingleMode = determineSingleMode(content.single, answers);
    const normalizedAnswers = normalizeMultichoiceFractions(answers, isSingleMode);
    const isSingle = isSingleMode === 'true';

    let answers_gift = normalizedAnswers.map(ans => {
        const fraction = Number(ans.fraction) || 0;
        // Réponse unique : = pour bonne, ~ pour mauvaise
        // Réponses multiples : %fraction% pour chaque réponse (GIFT multi-answer format)
        let prefix;
        if (isSingle) {
            prefix = fraction === 100 ? '=' : '~';
        } else {
            // Les pourcentages GIFT doivent appartenir à la liste officielle Moodle
            // (pas de -33.333333333333336 issu d'une division)
            const nbMauvaises = Math.max(normalizedAnswers.filter(a => Number(a.fraction) <= 0).length, 1);
            prefix = fraction > 0
                ? `~%${fractionMoodleValide(fraction)}%`
                : `~%${fractionMoodleValide(-(100 / nbMauvaises))}%`;
        }
        const feedback = ans.feedback ? `#<p>${escapeGift(ans.feedback)}</p>` : '';
        return `${prefix}<p>${escapeGift(ans.text || '')}</p>${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGiftTitle(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${answers_gift}
\t${general_feedback}
}\n\n`;
}

function generateMatchingGift(content) {
    const subquestions = Array.isArray(content.subquestions) ? content.subquestions : [];
    // GIFT sépare chaque paire sur le délimiteur ' -> '. Si le contenu (texte ou réponse)
    // contient une flèche ASCII '->' (ex: « f : ℝ -> ℝ »), Moodle coupe la paire au mauvais
    // endroit → mauvaise réponse importée silencieusement. On remplace donc toute flèche ASCII
    // du contenu par la flèche Unicode '→', ne laissant que le ' -> ' inséré par le générateur.
    const noArrow = s => String(s || '').replace(/->/g, '→');
    let subquestions_gift = subquestions.map(sq =>
        `=<p>${escapeGift(noArrow(sq.text))}</p> -> ${escapeGift(noArrow(sq.answer))}`
    ).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGiftTitle(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${subquestions_gift}
\t${general_feedback}
}\n\n`;
}

function generateTrueFalseGift(content) {
    const answer = content.answer || {};
    const isTrue = parseTrueFalseValue(answer.value);
    const answerStr = isTrue ? 'TRUE' : 'FALSE';

    // Syntaxe GIFT : {TRUE #feedback-si-mauvaise-réponse #feedback-si-bonne-réponse}
    // feedback_true = feedback affiché si l'élève répond VRAI (resp. feedback_false / FAUX).
    // L'ordre d'émission dépend donc de la bonne réponse.
    const fbMauvaise = isTrue ? answer.feedback_false : answer.feedback_true;
    const fbBonne = isTrue ? answer.feedback_true : answer.feedback_false;
    let feedbacks = '';
    if (fbMauvaise || fbBonne) {
        feedbacks = `#${fbMauvaise ? `<p>${escapeGift(fbMauvaise)}</p>` : ''}`;
        if (fbBonne) feedbacks += `#<p>${escapeGift(fbBonne)}</p>`;
    }

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGiftTitle(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{${answerStr}${feedbacks}${general_feedback}}\n\n`;
}

function generateShortanswerGift(content) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    // Même normalisation que le XML : au moins une réponse à 100 %, sinon rejet à l'import.
    const normalizedAnswers = normalizeShortanswerFractions(answers);
    let answers_gift = normalizedAnswers.map(ans => {
        const feedback = ans.feedback ? `#<p>${escapeGift(ans.feedback)}</p>` : '';
        const fraction = Number(ans.fraction) || 0;
        return `=%${fraction}%${escapeGift(ans.text || '')}${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGiftTitle(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${answers_gift}
\t${general_feedback}
}\n\n`;
}

function generateNumericalGift(content) {
    const answers = numericalAnswers(content).map(answer => {
        const feedback = answer.feedback ? `#<p>${escapeGift(answer.feedback)}</p>` : '';
        return `=%${answer.fraction}%${answer.number}:${answer.tolerance}${feedback}`;
    }).join('\n\t');
    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGiftTitle(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{#
\t${answers}
\t${general_feedback}
}\n\n`;
}
