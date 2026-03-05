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
        .replace(/[^\x20-\x7E]/g, function (ch) {
            return '&#' + ch.charCodeAt(0) + ';';
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

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(question => {
            switch (question.type) {
                case 'matching':
                    xml += generateMatchingQuestionXml(question.content);
                    break;
                case 'multichoice':
                    xml += generateMultichoiceQuestionXml(question.content);
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
    let subquestionsXml = content.subquestions.map(sq => `
    <subquestion format="html">
      <text><![CDATA[<p>${escapeCdata(sq.text)}</p>]]></text>
      <answer>
        <text>${escapeXml(sq.answer)}</text>
      </answer>
    </subquestion>`).join('');

    return `
  <question type="matching">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext)}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <shuffleanswers>true</shuffleanswers>
    ${subquestionsXml}
  </question>`;
}

function generateMultichoiceQuestionXml(content) {
    let answersXml = content.answers.map(ans => `
    <answer fraction="${ans.fraction}" format="html">
      <text><![CDATA[<p>${escapeCdata(ans.text)}</p>]]></text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(ans.feedback || '')}</p>]]></text>
      </feedback>
    </answer>`).join('');

    return `
  <question type="multichoice">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext)}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <single>${content.single || 'true'}</single>
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>abc</answernumbering>
    ${answersXml}
  </question>`;
}

function generateTrueFalseQuestionXml(content) {
    const fractionTrue = content.answer.value ? 100 : 0;
    const fractionFalse = content.answer.value ? 0 : 100;

    return `
  <question type="truefalse">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext)}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <answer fraction="${fractionTrue}" format="moodle_auto_format">
      <text>true</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(content.answer.feedback_true || '')}</p>]]></text>
      </feedback>
    </answer>
    <answer fraction="${fractionFalse}" format="moodle_auto_format">
      <text>false</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(content.answer.feedback_false || '')}</p>]]></text>
      </feedback>
    </answer>
  </question>`;
}

function generateShortanswerQuestionXml(content) {
    let answersXml = content.answers.map(ans => `
    <answer fraction="${ans.fraction}" format="moodle_auto_format">
      <text>${escapeXml(ans.text)}</text>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(ans.feedback || '')}</p>]]></text>
      </feedback>
    </answer>`).join('');

    return `
  <question type="shortanswer">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext)}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <usecase>${content.usecase || 0}</usecase>
    ${answersXml}
  </question>`;
}

function generateNumericalQuestionXml(content) {
    return `
  <question type="numerical">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${escapeCdata(content.questiontext)}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
    </generalfeedback>
    <answer fraction="100" format="moodle_auto_format">
      <text>${content.answer.number}</text>
      <tolerance>${content.answer.tolerance || 0}</tolerance>
      <feedback format="html">
        <text><![CDATA[<p>${escapeCdata(content.answer.feedback || '')}</p>]]></text>
      </feedback>
    </answer>
  </question>`;
}

function generateClozeQuestionXml(content) {
    return `
    <question type="cloze">
        <name>
            <text>${escapeXml(content.name)}</text>
        </name>
        <questiontext format="html">
            <text><![CDATA[${escapeCdata(content.questiontext)}]]></text>
        </questiontext>
        <generalfeedback format="html">
            <text><![CDATA[<p>${escapeCdata(content.feedback || '')}</p>]]></text>
        </generalfeedback>
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
    let answers_gift = content.answers.map(ans => {
        const prefix = ans.fraction == 100 ? '=' : '~';
        const feedback = ans.feedback ? `#<p>${ans.feedback}</p>` : '';
        return `${prefix}<p>${ans.text}</p>${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${answers_gift}
	${general_feedback}
}\n\n`;
}

function generateMatchingGift(content) {
    let subquestions_gift = content.subquestions.map(sq =>
        `=<p>${sq.text}</p> -> ${sq.answer}`
    ).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${subquestions_gift}
	${general_feedback}
}\n\n`;
}

function generateTrueFalseGift(content) {
    const answer = content.answer.value ? 'TRUE' : 'FALSE';
    const feedback_true = content.answer.feedback_true ? `#<p>${content.answer.feedback_true}</p>` : '';
    const feedback_false = content.answer.feedback_false ? `#<p>${content.answer.feedback_false}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{${answer}${feedback_true}${feedback_false}${general_feedback}}\n\n`;
}

function generateShortanswerGift(content) {
    let answers_gift = content.answers.map(ans => {
        const feedback = ans.feedback ? `#<p>${ans.feedback}</p>` : '';
        return `=%${ans.fraction}%${ans.text}${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${answers_gift}
	${general_feedback}
}\n\n`;
}

function generateNumericalGift(content) {
    const feedback = content.answer.feedback ? `#<p>${content.answer.feedback}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{#
	=%100%${content.answer.number}:${content.answer.tolerance || 0}${feedback}
	${general_feedback}
}\n\n`;
}
