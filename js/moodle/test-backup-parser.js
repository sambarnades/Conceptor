/** Lecture du format BACKUP Moodle. Les slots déterminent l’ordre et la version. */
import { stripParagraphWrap } from './xml-utils.js';

const QTYPE_BACKUP_TO_MODEL = {
    multichoice: 'multichoice', match: 'matching', truefalse: 'truefalse',
    numerical: 'numerical', shortanswer: 'shortanswer', multianswer: 'cloze',
};

/** Contenu d'UNE `<question>` backup → `content` du modèle, selon son `<qtype>`. */
function parseBackupQuestionContent(q, byId, backupType) {
    const child = (el, sel) => el?.querySelector(`:scope > ${sel}`) ?? null;
    const strip = (el, sel) => stripParagraphWrap(child(el, sel)?.textContent ?? '');
    const name = child(q, 'name')?.textContent ?? '';
    const questiontext = strip(q, 'questiontext');
    const feedback = strip(q, 'generalfeedback');
    const hints = Array.from(q.querySelectorAll(':scope > question_hints > question_hint > hint'))
        .map(h => stripParagraphWrap(h.textContent ?? ''));
    // fraction backup (0-1) → échelle 0-100 du modèle.
    const frac = (a) => parseFloat(child(a, 'fraction')?.textContent ?? '0') * 100;

    switch (backupType) {
        case 'multichoice': {
            const plugin = child(q, 'plugin_qtype_multichoice_question');
            const answers = Array.from(plugin?.querySelectorAll(':scope > answers > answer') ?? []).map(a => ({
                text: stripParagraphWrap(child(a, 'answertext')?.textContent ?? ''),
                fraction: frac(a),
                feedback: stripParagraphWrap(child(a, 'feedback')?.textContent ?? ''),
            }));
            const mc = child(plugin, 'multichoice');
            const single = (child(mc, 'single')?.textContent ?? '1').trim() === '0' ? 'false' : 'true';
            return {
                name, questiontext, single, answers, feedback, hints,
                answernumbering: strip(mc, 'answernumbering') || 'none',
                showstandardinstruction: Number(strip(mc, 'showstandardinstruction') || '0'),
                shuffleanswers: Number(strip(mc, 'shuffleanswers') || '0'),
                correctfeedback: stripParagraphWrap(child(mc, 'correctfeedback')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(child(mc, 'partiallycorrectfeedback')?.textContent ?? ''),
                incorrectfeedback: stripParagraphWrap(child(mc, 'incorrectfeedback')?.textContent ?? ''),
            };
        }
        case 'match': {
            const plugin = child(q, 'plugin_qtype_match_question');
            const subquestions = Array.from(plugin?.querySelectorAll(':scope > matches > match') ?? []).map(m => ({
                text: stripParagraphWrap(child(m, 'questiontext')?.textContent ?? ''),
                answer: stripParagraphWrap(child(m, 'answertext')?.textContent ?? ''),
            }));
            const mo = child(plugin, 'matchoptions');
            return {
                name, questiontext, subquestions, feedback, hints,
                shuffleanswers: Number(strip(mo, 'shuffleanswers') || '0'),
                correctfeedback: stripParagraphWrap(child(mo, 'correctfeedback')?.textContent ?? ''),
                partiallycorrectfeedback: stripParagraphWrap(child(mo, 'partiallycorrectfeedback')?.textContent ?? ''),
                incorrectfeedback: stripParagraphWrap(child(mo, 'incorrectfeedback')?.textContent ?? ''),
            };
        }
        case 'truefalse': {
            const plugin = child(q, 'plugin_qtype_truefalse_question');
            const answers = Array.from(plugin?.querySelectorAll(':scope > answers > answer') ?? []);
            const tf = child(plugin, 'truefalse');
            const trueId = child(tf, 'trueanswer')?.textContent?.trim();
            const trueA = answers.find(a => a.getAttribute('id') === trueId);
            const falseA = answers.find(a => a !== trueA);
            return {
                name, questiontext,
                answer: {
                    value: parseFloat(child(trueA, 'fraction')?.textContent ?? '0') > 0,
                    feedback_true: stripParagraphWrap(child(trueA, 'feedback')?.textContent ?? ''),
                    feedback_false: stripParagraphWrap(child(falseA, 'feedback')?.textContent ?? ''),
                },
                feedback, hints,
            };
        }
        case 'numerical': {
            const plugin = child(q, 'plugin_qtype_numerical_question');
            if (plugin?.querySelector('numerical_units > numerical_unit')) throw new Error('test_unsupported_question_type:numerical_units');
            const answers = [...plugin.querySelectorAll(':scope > answers > answer')].map(a => {
                const rec = [...plugin.querySelectorAll(':scope > numerical_records > numerical_record')]
                    .find(r => child(r, 'answer')?.textContent === a.getAttribute('id'));
                const text = child(a, 'answertext')?.textContent ?? '0';
                return {
                    number: text === '*' ? '*' : Number(text),
                    tolerance: Number(child(rec, 'tolerance')?.textContent ?? '0'),
                    fraction: frac(a),
                    feedback: stripParagraphWrap(child(a, 'feedback')?.textContent ?? ''),
                };
            });
            return {
                name, questiontext,
                answer: answers[0], ...(answers.length > 1 ? {alternatives: answers.slice(1)} : {}),
                feedback, hints,
            };
        }
        case 'shortanswer': {
            const plugin = child(q, 'plugin_qtype_shortanswer_question');
            const answers = Array.from(plugin?.querySelectorAll(':scope > answers > answer') ?? []).map(a => ({
                text: stripParagraphWrap(child(a, 'answertext')?.textContent ?? ''),
                fraction: frac(a),
                feedback: stripParagraphWrap(child(a, 'feedback')?.textContent ?? ''),
            }));
            return { name, questiontext, answers, feedback, hints, usecase: parseInt(strip(child(q, 'plugin_qtype_shortanswer_question'), 'shortanswer > usecase') || '0', 10) };
        }
        case 'multianswer': {
            // Reconstruit le questiontext cloze GIFT inline : {#N} → fragment de
            // l'enfant N (l'ordre vient de <sequence>). Inverse de parseClozeGaps.
            const seq = (q.querySelector(':scope > plugin_qtype_multianswer_question > multianswer > sequence')?.textContent ?? '')
                .split(',').map(s => s.trim()).filter(Boolean);
            let qt = child(q, 'questiontext')?.textContent ?? '';
            seq.forEach((cid, i) => {
                const frag = child(byId.get(cid), 'questiontext')?.textContent;
                if (frag === undefined) throw new Error('test_missing_cloze_child');
                qt = qt.replace(`{#${i + 1}}`, frag);
            });
            return { name, questiontext: qt, feedback, hints };
        }
        default:
            throw new Error(`test_unsupported_question_type:${backupType}`);
    }
}


export function parseBackupQuestions(qDoc, quizDoc) {
    const all = [...qDoc.querySelectorAll('question[id]')];
    const byId = new Map(all.map(q => [q.id || q.getAttribute('id'), q]));
    const entries = new Map([...qDoc.querySelectorAll('question_bank_entry')].map(e => [e.getAttribute('id'), e]));
    const slots = [...(quizDoc?.querySelectorAll('question_instances > question_instance') || [])]
        .sort((a, b) => Number(a.querySelector('slot')?.textContent) - Number(b.querySelector('slot')?.textContent));
    const latestQuestion = (entry, version) => {
        const versions = [...(entry?.querySelectorAll('question_version > question_versions') || [])]
            .sort((a, b) => Number(b.querySelector(':scope > version')?.textContent) - Number(a.querySelector(':scope > version')?.textContent));
        const selected = version && version !== '$@NULL@$' && version !== '0'
            ? versions.find(v => v.querySelector(':scope > version')?.textContent?.trim() === version) : versions[0];
        return selected?.querySelector('questions > question');
    };
    const selectedQuestions = slots.map(slot => {
        if (slot.querySelector('question_set_reference')) throw new Error('test_unsupported_question_type:random');
        const entry = entries.get(slot.querySelector('questionbankentryid')?.textContent?.trim());
        const version = slot.querySelector('question_reference > version')?.textContent?.trim();
        return { slot, q: latestQuestion(entry, version) || byId.get(slot.querySelector(':scope > questionid')?.textContent?.trim()) };
    });
    // Une banque autonome n'a pas de slots : garder la dernière version des
    // questions parentes. Un Test explicitement vide reste vide.
    if (!quizDoc?.querySelector('question_instances')) {
        const candidates = entries.size ? [...entries.values()].map(e => latestQuestion(e)) : all;
        for (const q of candidates) {
            if (q && Number(q.querySelector(':scope > parent')?.textContent || 0) === 0) selectedQuestions.push({ q });
        }
    }
    let category;
    const questions = selectedQuestions.map(({ slot, q }) => {
        if (!q) throw new Error('test_missing_question_reference');
        category ||= q.closest('question_category');
        const backupType = q.querySelector(':scope > qtype')?.textContent?.trim();
        const type = QTYPE_BACKUP_TO_MODEL[backupType];
        if (!type) throw new Error(`test_unsupported_question_type:${backupType}`);
        const content = parseBackupQuestionContent(q, byId, backupType);
        content.defaultgrade = Number(slot?.querySelector(':scope > maxmark')?.textContent ?? q.querySelector(':scope > defaultmark')?.textContent ?? 1);
        content.penalty = Number(q.querySelector(':scope > penalty')?.textContent ?? 0.3333333);
        return { type, content };
    });
    return {
        bank_name: category?.querySelector(':scope > name')?.textContent || '',
        bank_description: category?.querySelector(':scope > info')?.textContent || '',
        options: {}, questions
    };
}
