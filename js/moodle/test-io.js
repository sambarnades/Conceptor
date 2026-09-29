/** Lecture et réédition Test communes à Caramel et Sucrerie. */
import { parseXml, tagText, escapeXml, rewriteTag, stripParagraphWrap } from './xml-utils.js';
import { generateMoodleXml, canonicalizeTestModel } from './moodle-formats.js';
import { parseBackupQuestions } from './test-backup-parser.js';
import { buildQuizBackup } from './test-backup-builder.js';
import { CHAMPS_REVUE, QUIZ_GRADE, presetDeRevue } from './mbz-course-builder.js';

/**
 * Balises de `<quiz>` que l'éditeur règle (`quiz_settings`). À la réécriture d'un
 * Test importé, SEULES celles-ci sont remplacées : le reste (dates, mot de passe,
 * délai de grâce, accès SEB…) garde les valeurs de la plateforme d'origine.
 */
const BALISES_REGLAGES = ['timelimit', 'preferredbehaviour', 'attempts_number', 'grademethod',
    ...CHAMPS_REVUE.map(c => `review${c}`), 'questionsperpage', 'navmethod', 'shuffleanswers'];

/**
 * Relit les réglages d'un `quiz.xml` (format BACKUP) dans la forme de l'éditeur,
 * `quiz_settings` — l'inverse de `quizSettingsXml` (mbz-course-builder.js). Les
 * masques de relecture qui ne correspondent à aucun préréglage sont gardés tels
 * quels (`review: 'custom'` + `review_masks`) : un Test réglé à la main sur Éléa
 * ressort avec SES réglages. Le feedback global n'est relu que s'il porte du texte.
 *
 * @param {Document} quizDoc
 * @returns {Object|undefined} `undefined` si le document n'a pas de `<quiz>`.
 */
export function lireReglagesTest(quizDoc) {
    const quiz = quizDoc?.querySelector('activity > quiz');
    if (!quiz) return undefined;
    const val = (tag) => quiz.querySelector(`:scope > ${tag}`)?.textContent?.trim() ?? '';
    const nombre = (tag, defaut) => {
        const n = Number(val(tag));
        return val(tag) !== '' && Number.isFinite(n) ? n : defaut;
    };
    const preferredbehaviour = val('preferredbehaviour') || 'deferredfeedback';
    const masques = Object.fromEntries(CHAMPS_REVUE.map(c => [c, nombre(`review${c}`, NaN)]));
    const review = presetDeRevue(preferredbehaviour, masques);
    const reglages = {
        preferredbehaviour,
        attempts: nombre('attempts_number', 0),
        grademethod: nombre('grademethod', 1),
        timelimit_minutes: nombre('timelimit', 0) / 60,
        questionsperpage: nombre('questionsperpage', 0),
        navmethod: val('navmethod') || 'free',
        shuffleanswers: nombre('shuffleanswers', 1) ? 1 : 0,
        review,
    };
    if (review === 'custom' && CHAMPS_REVUE.every(c => Number.isInteger(masques[c]))) reglages.review_masks = masques;
    // Plages de note (échelle de `<grade>`) → tranches en % de l'éditeur. Une note
    // maximale autre que 10 est gardée : les plages réécrites se calculent sur elle.
    const note = nombre('grade', QUIZ_GRADE) || QUIZ_GRADE;
    if (note !== QUIZ_GRADE) reglages.grade = note;
    const plages = [...quiz.querySelectorAll(':scope > feedbacks > feedback')]
        .map(f => ({
            min: Number(f.querySelector(':scope > mingrade')?.textContent ?? 0) || 0,
            texte: stripParagraphWrap(f.querySelector(':scope > feedbacktext')?.textContent ?? ''),
        }))
        .sort((a, b) => a.min - b.min);
    if (plages.some(p => p.texte.trim())) {
        const pct = (g) => Math.max(0, Math.min(100, Math.round(g / note * 100)));
        reglages.overallfeedback = plages.map((p, i) => ({
            from: i === 0 ? 0 : pct(p.min),
            to: i === plages.length - 1 ? 100 : Math.max(0, pct(plages[i + 1].min) - 1),
            feedback: p.texte,
        }));
    }
    return reglages;
}

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
 *   quiz_settings: Object,
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
    const quiz_settings = lireReglagesTest(doc);
    return {
        ...model,
        title,
        bank_name: model.bank_name || title,
        ...(quiz_settings ? { quiz_settings } : {}),
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
    // Les réglages de l'éditeur (`quiz_settings`) remplacent leurs balises, et elles
    // seules ; sans `quiz_settings` (contenu d'avant les réglages), ceux du Test
    // importé restent intacts — et ses slots se paginent comme le fichier l'indique.
    const reglages = data.quiz_settings && typeof data.quiz_settings === 'object' ? data.quiz_settings : null;
    const modele = reglages ? data : { ...data, quiz_settings: lireReglagesTest(oldQuiz) };
    const generated = buildQuizBackup(canonicalizeTestModel(modele), {
        courseId: course?.getAttribute('id'), courseContextId: course?.getAttribute('contextid'),
        courseShortname: course?.querySelector('shortname')?.textContent || '',
        moduleId: activity.getAttribute('moduleid'), activityId: activity.getAttribute('id'),
        activityContextId: activity.getAttribute('contextid'),
        gradeItemId: parseXml(decode(`${activityDir}/inforef.xml`)).querySelector('grade_item > id')?.textContent || 0,
        title: data.title || data.bank_name || '', idBase: maxId + 100
    }, Math.floor(Date.now() / 1000));
    const newQuiz = parseXml(generated.quizXml);
    // Le feedback global n'est réécrit que s'il a été fourni.
    const balises = ['name', 'sumgrades', 'question_instances',
        ...(reglages ? BALISES_REGLAGES : []),
        ...(reglages && Array.isArray(reglages.overallfeedback) ? ['feedbacks'] : [])];
    for (const tag of balises) {
        const ancien = oldQuiz.querySelector(`quiz > ${tag}`);
        const neuf = newQuiz.querySelector(`quiz > ${tag}`);
        if (ancien && neuf) ancien.replaceWith(oldQuiz.importNode(neuf, true));
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
