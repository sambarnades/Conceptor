/** Lecture et réédition Test communes à Caramel et Sucrerie. */
import { parseXml, tagText, escapeXml, rewriteTag, stripParagraphWrap } from './xml-utils.js';
import { generateMoodleXml, canonicalizeTestModel } from './moodle-formats.js';
import { parseBackupQuestions } from './test-backup-parser.js';
import { buildQuizBackup } from './test-backup-builder.js';

/**
 * Parse une `<question>` Moodle vers la structure éditeur attendue.
 * Supporte 6 types : multichoice, matching, truefalse, numerical, shortanswer, cloze.
 */
function parseQuestionContent(q, type) {
    const txt  = (sel) => q.querySelector(sel)?.textContent ?? '';
    const name = q.querySelector(':scope > name > text')?.textContent ?? '';
    const questiontext = stripParagraphWrap(q.querySelector(':scope > questiontext > text')?.textContent ?? '');
    const feedback     = stripParagraphWrap(q.querySelector(':scope > generalfeedback > text')?.textContent ?? '');
    const hints        = Array.from(q.querySelectorAll(':scope > hint > text')).map(h => stripParagraphWrap(h.textContent ?? ''));

    switch (type) {
        case 'multichoice': {
            const single = (q.querySelector(':scope > single')?.textContent ?? 'true').trim();
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     stripParagraphWrap(a.querySelector('text')?.textContent ?? ''),
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, single, answers, feedback, hints,
                answernumbering: txt(':scope > answernumbering') || 'none',
                showstandardinstruction: Number(txt(':scope > showstandardinstruction') || '0'),
                shuffleanswers: txt(':scope > shuffleanswers') !== 'false' && txt(':scope > shuffleanswers') !== '0',
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'matching': {
            const subquestions = Array.from(q.querySelectorAll(':scope > subquestion')).map(sq => ({
                text:   stripParagraphWrap(sq.querySelector('text')?.textContent ?? ''),
                answer: stripParagraphWrap(sq.querySelector('answer > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, subquestions, feedback, hints,
                correctfeedback:          stripParagraphWrap(q.querySelector(':scope > correctfeedback > text')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(q.querySelector(':scope > partiallycorrectfeedback > text')?.textContent ?? ''),
                incorrectfeedback:        stripParagraphWrap(q.querySelector(':scope > incorrectfeedback > text')?.textContent ?? '')
            };
        }
        case 'truefalse': {
            const answers = Array.from(q.querySelectorAll(':scope > answer'));
            const trueAns  = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'true');
            const falseAns = answers.find(a => (a.querySelector('text')?.textContent ?? '').trim() === 'false');
            return {
                name, questiontext,
                answer: {
                    value:          parseFloat(trueAns?.getAttribute('fraction') || '0') > 0,
                    feedback_true:  stripParagraphWrap(trueAns?.querySelector('feedback > text')?.textContent ?? ''),
                    feedback_false: stripParagraphWrap(falseAns?.querySelector('feedback > text')?.textContent ?? '')
                },
                feedback, hints
            };
        }
        case 'numerical': {
            if (q.querySelector('units > unit')) throw new Error('test_unsupported_question_type:numerical_units');
            const answers = [...q.querySelectorAll(':scope > answer')].map(a => ({
                number: a.querySelector('text')?.textContent === '*' ? '*' : Number(a.querySelector('text')?.textContent ?? 0),
                tolerance: Number(a.querySelector('tolerance')?.textContent ?? 0),
                fraction: Number(a.getAttribute('fraction') ?? 100),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext,
                answer: answers[0], ...(answers.length > 1 ? {alternatives: answers.slice(1)} : {}),
                feedback, hints
            };
        }
        case 'shortanswer': {
            const answers = Array.from(q.querySelectorAll(':scope > answer')).map(a => ({
                text:     stripParagraphWrap(a.querySelector('text')?.textContent ?? ''),
                fraction: parseFloat(a.getAttribute('fraction') || '0'),
                feedback: stripParagraphWrap(a.querySelector('feedback > text')?.textContent ?? '')
            }));
            return {
                name, questiontext, answers, feedback, hints,
                usecase: parseInt(txt(':scope > usecase') || '0', 10)
            };
        }
        case 'cloze': {
            // questiontext garde les marqueurs Moodle {1:MULTICHOICE:=foo~bar} bruts
            return { name, questiontext, feedback, hints };
        }
        default:
            throw new Error(`test_unsupported_question_type:${type}`);
    }
}

/**
 * Lit l'archive d'un Test (quiz) déjà extraite par `mbz-utils.extractMbz`.
 *
 * Les questions vivent dans `questions.xml` à la racine du backup (pas dans
 * le dossier d'activité). `quiz.xml` ne contient que la configuration et les
 * références (`<question_instances>`).
 *
 * @param {Object<string, Uint8Array>} files
 * @param {string} activityDir
 * @returns {{
 *   title: string,
 *   bank_name: string,
 *   bank_description: string,
 *   options: Object,
 *   questions: Array<{ type: string, content: Object }>,
 *   _context: { moduleId, activityId, activityContextId }
 * }}
 */
export function parseFiles(files, activityDir) {
    const xmlPath  = `${activityDir}/quiz.xml`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`test_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = parseXml(xml);

    const activityNode = doc.querySelector('activity');
    if (!doc.querySelector('activity > quiz')) {
        throw new Error('test_invalid_xml_no_root');
    }

    const title = tagText(doc, 'quiz > name');

    const qBytes = files['questions.xml'];
    if (!qBytes) throw new Error('test_missing_questions');
    const questionXml = new TextDecoder().decode(qBytes);
    const qDoc = parseXml(questionXml);
    const model = qDoc.documentElement.tagName === 'question_categories'
        ? parseBackupQuestions(qDoc, doc) : parseStandaloneXml(questionXml);
    return {
        ...model,
        title,
        bank_name: model.bank_name || title,
        _context: {
            moduleId:          activityNode?.getAttribute('moduleid')  ?? '',
            activityId:        activityNode?.getAttribute('id')        ?? '',
            activityContextId: activityNode?.getAttribute('contextid') ?? ''
        }
    };
}

/** Recrée la banque et ses slots ensemble, en gardant les réglages du Test. */
export function serializeFiles(data, files, activityDir) {
    const decode = path => new TextDecoder().decode(files[path] || new Uint8Array());
    const quizPath = `${activityDir}/quiz.xml`;
    const oldQuiz = parseXml(decode(quizPath));
    const oldQuestions = parseXml(decode('questions.xml'));
    if (oldQuestions.documentElement.tagName !== 'question_categories') {
        files[quizPath] = new TextEncoder().encode(rewriteTag(decode(quizPath), 'name', escapeXml(data.title || data.bank_name || '')));
        files['questions.xml'] = new TextEncoder().encode(generateMoodleXml(data));
        return;
    }
    const activity = oldQuiz.querySelector('activity');
    const course = parseXml(decode('course/course.xml')).querySelector('course');
    // Les fichiers joints natifs portent des références de questions. Préserver
    // l’archive source plutôt que réattribuer des IDs sans remapper ses fichiers.
    if (/<component>q(?:uestion|type_[^<]+)<\/component>/.test(decode('files.xml'))) {
        throw new Error('test_import_question_files_unsupported');
    }
    let maxId = 2000000;
    for (const [path, bytes] of Object.entries(files)) {
        if (!path.endsWith('.xml')) continue;
        const xml = new TextDecoder().decode(bytes);
        for (const m of xml.matchAll(/\bid="(\d+)"/g)) maxId = Math.max(maxId, Number(m[1]));
    }
    const generated = buildQuizBackup(canonicalizeTestModel(data), {
        courseId: course?.getAttribute('id'), courseContextId: course?.getAttribute('contextid'),
        courseShortname: course?.querySelector('shortname')?.textContent || '',
        moduleId: activity.getAttribute('moduleid'), activityId: activity.getAttribute('id'),
        activityContextId: activity.getAttribute('contextid'),
        gradeItemId: parseXml(decode(`${activityDir}/inforef.xml`)).querySelector('grade_item > id')?.textContent || 0,
        title: data.title || data.bank_name || '', idBase: maxId + 100
    }, Math.floor(Date.now() / 1000));
    const newQuiz = parseXml(generated.quizXml);
    for (const tag of ['name', 'sumgrades', 'question_instances']) {
        oldQuiz.querySelector(`quiz > ${tag}`).replaceWith(oldQuiz.importNode(newQuiz.querySelector(`quiz > ${tag}`), true));
    }
    // Une section dont le premier slot a été supprimé ne doit pas référencer le vide.
    const count = newQuiz.querySelectorAll('question_instance').length;
    for (const section of oldQuiz.querySelectorAll('sections > section')) {
        if (Number(section.querySelector('firstslot')?.textContent) > Math.max(1, count)) section.remove();
    }
    // Les anciennes catégories peuvent être partagées par d’autres tests du
    // cours. Elles sont conservées ; seuls les nouveaux slots sont raccordés.
    for (const category of parseXml(generated.questionsXml).querySelectorAll('question_category')) {
        oldQuestions.documentElement.appendChild(oldQuestions.importNode(category, true));
    }
    const serializer = new XMLSerializer();
    files[quizPath] = new TextEncoder().encode(serializer.serializeToString(oldQuiz));
    files['questions.xml'] = new TextEncoder().encode(serializer.serializeToString(oldQuestions));
    const inforef = parseXml(decode(`${activityDir}/inforef.xml`));
    const cats = parseXml(generated.inforefXml).querySelector('question_categoryref');
    inforef.querySelector('question_categoryref')?.remove();
    inforef.documentElement.appendChild(inforef.importNode(cats, true));
    files[`${activityDir}/inforef.xml`] = new TextEncoder().encode(serializer.serializeToString(inforef));
}

// =========================================================================
// FORMAT STANDALONE — Moodle Question XML (root <quiz>, banque de questions)
// =========================================================================
//
// Le format standalone exporté par Caramel pour une banque de questions est
// quasi-identique au `questions.xml` interne d'un MBZ : même racine `<quiz>`,
// mêmes éléments `<question type="...">`, même structure interne par type.
// On peut donc réutiliser `parseQuestionContent` tel quel.

/**
 * Parse un XML "Banque de questions" standalone (<quiz>...) vers le JSON éditeur.
 * Shape de sortie alignée avec `parseFiles` pour l'éditeur unifié.
 *
 * @param {string} xml
 * @returns {{ title, bank_name, bank_description, options, questions }}
 */
export function parseStandaloneXml(xml) {
    const doc = parseXml(xml);
    const root = doc.documentElement;
    if (!root || root.tagName !== 'quiz') {
        throw new Error('test_standalone_invalid_root');
    }

    let bank_name = '', bank_description = '';
    const questions = [];

    for (const q of root.querySelectorAll(':scope > question')) {
        const type = q.getAttribute('type');
        if (type === 'category') {
            const cat = q.querySelector('category > text')?.textContent ?? '';
            // category ressemble à "$course$/top/Nom/Sous-catégorie" — on garde la dernière feuille
            bank_name = cat.split('/').pop() || '';
            bank_description = q.querySelector('info > text')?.textContent ?? '';
            continue;
        }
        const content = parseQuestionContent(q, type);
        content.defaultgrade = Number(q.querySelector(':scope > defaultgrade')?.textContent ?? 1);
        content.penalty = Number(q.querySelector(':scope > penalty')?.textContent ?? 0.3333333);
        questions.push({ type, content });
    }

    return {
        title: bank_name,
        bank_name,
        bank_description,
        options: {},
        questions
    };
}

/**
 * Reconstruit l'XML standalone à partir du JSON éditeur.
 * Réutilise `buildQuestionsXml` qui produit exactement le format attendu.
 *
 * @param {{ bank_name, bank_description, questions }} data
 * @returns {string}
 */
export function serializeStandaloneXml(data) {
    return generateMoodleXml(data);
}
