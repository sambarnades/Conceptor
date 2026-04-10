/**
 * @file Générateurs de formats d'export Moodle (XML, GIFT).
 */

export function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/[^\x20-\x7E]/gu, function (ch) {
            const cp = ch.codePointAt(0);
            // Filtrer les code points invalides en XML (surrogates, non-caractères)
            if ((cp >= 0xD800 && cp <= 0xDFFF) || cp === 0xFFFE || cp === 0xFFFF) return '';
            return '&#' + cp + ';';
        });
}

/**
 * Protège une chaîne pour insertion dans une section CDATA.
 * Remplace la séquence ]]> qui terminerait prématurément la section CDATA.
 */
function escapeCdata(str) {
    return String(str).replace(/\]\]>/g, ']]]]><![CDATA[>');
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
 * Échappe les accolades dans le contenu utilisateur pour le format GIFT.
 * Seuls { et } sont réellement dangereux car ils délimitent les blocs de réponses.
 * Les autres caractères spéciaux (~, =, #) ne sont syntaxiques qu'en position
 * structurelle (début de ligne dans un bloc réponse), gérée par les templates.
 * On ne touche pas aux backslashes (LaTeX) ni aux : (HTML, LaTeX).
 * @param {string} str - La chaîne à échapper
 * @returns {string} La chaîne avec les accolades échappées
 */
function escapeGift(str) {
    return String(str)
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}');
}

/**
 * Génère le contenu d'un fichier XML de banque de questions Moodle à partir d'un objet de données.
 * @param {Object} data - L'objet contenant la structure de la banque de questions.
 * @returns {string} Le contenu du fichier XML.
 */
export function generateMoodleXml(data) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;

    if (data.bank_name && data.bank_description) {
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
            switch (question.type) {
                case 'matching':
                    xml += generateMatchingQuestionXml(question.content);
                    break;
                case 'multichoice':
                    xml += generateMultichoiceQuestionXml(question.content, globalOptions);
                    break;
                case 'truefalse':
                    xml += generateTrueFalseQuestionXml(question.content);
                    break;
                case 'shortanswer':
                    xml += generateShortanswerQuestionXml(question.content);
                    break;
                case 'numerical':
                    xml += generateNumericalQuestionXml(question.content);
                    break;
                case 'cloze':
                    xml += generateClozeQuestionXml(question.content);
                    break;
            }
        });
    }

    xml += '</quiz>';
    return xml;
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
    <shuffleanswers>true</shuffleanswers>${combinedFeedbackXml}
    ${subquestionsXml}${hintsXml}
  </question>`;
}

/**
 * Fractions positives acceptées par Moodle pour les questions multichoice.
 * Valeurs imposées par le code Moodle (question/type/multichoice), triées par ordre décroissant.
 * @see https://github.com/moodle/moodle/blob/main/question/type/multichoice/questiontype.php
 */
export const VALID_MOODLE_FRACTIONS = [
    100, 90, 83.33333, 80, 75, 66.66667, 60, 50,
    33.33333, 25, 20, 16.66667, 14.28571, 12.5, 11.11111, 10, 5
];

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
    const normalizedAnswers = normalizeFractions(answers);
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

    // Déterminer réponse unique ou multiple :
    // - Champ explicite "single" (string ou booléen) → respecter la valeur
    // - Sinon, auto-détection : plusieurs réponses avec fraction > 0 = réponses multiples
    const isSingle = determineSingleMode(content.single, normalizedAnswers);

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
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>${numbering}</answernumbering>
    <showstandardinstruction>${showInstruction}</showstandardinstruction>${combinedFeedbackXml}
    ${answersXml}${hintsXml}
  </question>`;
}

function generateTrueFalseQuestionXml(content) {
    const answer = content.answer || {};
    const fractionTrue = answer.value ? 100 : 0;
    const fractionFalse = answer.value ? 0 : 100;

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
    let answersXml = answers.map(ans => `
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
    <usecase>${content.usecase || 0}</usecase>
    ${answersXml}${hintsXml}
  </question>`;
}

function generateNumericalQuestionXml(content) {
    const answer = content.answer || {};
    const hintsXml = generateHintsXml(content.hints);

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
    <answer fraction="100" format="moodle_auto_format">
      <text>${answer.number || 0}</text>
      <tolerance>${answer.tolerance || 0}</tolerance>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(answer.feedback || '')}</p>]]></text>
      </feedback>
    </answer>${hintsXml}
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
            }
        });
    }

    return gift_string;
}

function generateMultichoiceGift(content) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    const normalizedAnswers = normalizeFractions(answers);
    const isSingle = determineSingleMode(content.single, normalizedAnswers) === 'true';

    let answers_gift = normalizedAnswers.map(ans => {
        const fraction = Number(ans.fraction) || 0;
        // Réponse unique : = pour bonne, ~ pour mauvaise
        // Réponses multiples : %fraction% pour chaque réponse (GIFT multi-answer format)
        let prefix;
        if (isSingle) {
            prefix = fraction === 100 ? '=' : '~';
        } else {
            prefix = fraction > 0 ? `~%${fraction}%` : `~%-${100 / Math.max(normalizedAnswers.filter(a => Number(a.fraction) <= 0).length, 1)}%`;
        }
        const feedback = ans.feedback ? `#<p>${escapeGift(ans.feedback)}</p>` : '';
        return `${prefix}<p>${escapeGift(ans.text || '')}</p>${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGift(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${answers_gift}
\t${general_feedback}
}\n\n`;
}

function generateMatchingGift(content) {
    const subquestions = Array.isArray(content.subquestions) ? content.subquestions : [];
    let subquestions_gift = subquestions.map(sq =>
        `=<p>${escapeGift(sq.text || '')}</p> -> ${escapeGift(sq.answer || '')}`
    ).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGift(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${subquestions_gift}
\t${general_feedback}
}\n\n`;
}

function generateTrueFalseGift(content) {
    const answer = content.answer || {};
    const answerStr = answer.value ? 'TRUE' : 'FALSE';
    const feedback_true = answer.feedback_true ? `#<p>${escapeGift(answer.feedback_true)}</p>` : '';
    const feedback_false = answer.feedback_false ? `#<p>${escapeGift(answer.feedback_false)}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGift(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{${answerStr}${feedback_true}${feedback_false}${general_feedback}}\n\n`;
}

function generateShortanswerGift(content) {
    const answers = Array.isArray(content.answers) ? content.answers : [];
    let answers_gift = answers.map(ans => {
        const feedback = ans.feedback ? `#<p>${escapeGift(ans.feedback)}</p>` : '';
        return `=%${ans.fraction || 0}%${escapeGift(ans.text || '')}${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGift(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{
\t${answers_gift}
\t${general_feedback}
}\n\n`;
}

function generateNumericalGift(content) {
    const answer = content.answer || {};
    const feedback = answer.feedback ? `#<p>${escapeGift(answer.feedback)}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${escapeGift(content.feedback)}</p>` : '';

    return `// question: 0 name: ${escapeGift(content.name || '')}
::${escapeGift(content.name || '')}::[html]<p>${escapeGift(content.questiontext || '')}</p>{#
\t=%100%${answer.number || 0}:${answer.tolerance || 0}${feedback}
\t${general_feedback}
}\n\n`;
}
