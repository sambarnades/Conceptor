/**
 * Tests de validité d'import Moodle/Éléa pour la banque de questions (Test).
 * Garantit que le XML/GIFT généré respecte les contraintes de l'importateur Moodle,
 * pour ne plus reproduire le bug « L'une des réponses doit donner un score de 100 % »
 * (fractionsnomax) rencontré sur les questions « Réponse courte ».
 *
 * Exécuter avec : node tests/run_moodle_import_tests.mjs
 *
 * Invariants vérifiés (règles réelles de validation à l'import Moodle) :
 *  - shortanswer : au moins une réponse à fraction 100 (sinon fractionsnomax → import rejeté).
 *  - multichoice single=true  : exactement une réponse à 100 (fractionsnomax sinon).
 *  - multichoice single=false : les fractions positives somment à 100 (fractionsaddwrong sinon).
 *  - truefalse : la valeur "false"/"faux" (chaîne) ne doit PAS inverser la bonne réponse.
 *  - numerical : number/tolerance normalisés (virgule→point, unités retirées) pour XML et GIFT.
 */
import {
    generateMoodleXml,
    generateMoodleGift,
    normalizeShortanswerFractions,
    VALID_MOODLE_FRACTIONS
} from '../js/moodle/moodle-formats.js';

let pass = 0, fail = 0;
function test(name, condition, diag) {
    if (condition) { pass++; } else { fail++; console.log('  FAIL:', name, diag !== undefined ? ':: ' + JSON.stringify(diag) : ''); }
}

const isValidFraction = f => Math.abs(f) === 0 || VALID_MOODLE_FRACTIONS.some(v => Math.abs(v - Math.abs(f)) < 0.001);
const blocksOf = (xml, type) => [...xml.matchAll(new RegExp(`<question type="${type}">([\\s\\S]*?)<\\/question>`, 'g'))].map(m => m[1]);
const fractionsOf = block => [...block.matchAll(/<answer fraction="([-\d.]+)"/g)].map(x => parseFloat(x[1]));
const singleOf = block => (block.match(/<single>(true|false)<\/single>/) || [])[1];
const has100 = fr => fr.some(f => Math.abs(f - 100) < 0.001);

// ====================================================================
console.log('=== SHORTANSWER : normalizeShortanswerFractions ===');
// ====================================================================
test('50/50 → 100/100 (le bug réel)', JSON.stringify(normalizeShortanswerFractions([{ fraction: 50 }, { fraction: 50 }]).map(a => a.fraction)) === '[100,100]');
test('1 réponse à 50 → 100', normalizeShortanswerFractions([{ fraction: 50 }])[0].fraction === 100);
test('1 réponse à 100 → 100', normalizeShortanswerFractions([{ fraction: 100 }])[0].fraction === 100);
test('100/50 → inchangé', JSON.stringify(normalizeShortanswerFractions([{ fraction: 100 }, { fraction: 50 }]).map(a => a.fraction)) === '[100,50]');
test('fraction "1" (=100%) → 100', normalizeShortanswerFractions([{ fraction: 1 }])[0].fraction === 100);
test('fractions absentes → première à 100', has100(normalizeShortanswerFractions([{ text: 'a' }, { text: 'b' }]).map(a => a.fraction)));
test('toutes à 0 → première à 100', has100(normalizeShortanswerFractions([{ fraction: 0 }, { fraction: 0 }]).map(a => a.fraction)));
{
    const r = normalizeShortanswerFractions([{ fraction: 50 }, { fraction: -50 }]);
    test('pénalité négative préservée', r[0].fraction === 100 && r[1].fraction < 0, r.map(a => a.fraction));
}
test('tableau vide → vide', Array.isArray(normalizeShortanswerFractions([])) && normalizeShortanswerFractions([]).length === 0);
for (const input of [[50, 50], [33.33333, 33.33333], [70, 30], [90, 10], [66.66667, 33.33333]]) {
    const r = normalizeShortanswerFractions(input.map(f => ({ fraction: f })));
    test(`[${input}] → fractions valides + un 100`, r.every(a => isValidFraction(a.fraction)) && has100(r.map(a => a.fraction)), r.map(a => a.fraction));
}
// Pipeline XML + GIFT
{
    const bank = { questions: [
        { type: 'shortanswer', content: { name: 'Q05', answers: [{ text: 'Albert Camus', fraction: 50 }, { text: 'Frantz Fanon', fraction: 50 }] } },
        { type: 'shortanswer', content: { name: 'Q10', answers: [{ text: 'Poing levé', fraction: 50 }, { text: 'Drapeau noir', fraction: 50 }] } },
    ]};
    const xml = generateMoodleXml(bank);
    test('XML : chaque shortanswer a un 100 %', blocksOf(xml, 'shortanswer').every(b => has100(fractionsOf(b))));
    test('GIFT : contient une réponse à 100 %', /=%100%/.test(generateMoodleGift(bank)));
}

// ====================================================================
console.log('=== MULTICHOICE : normalisation sensible au mode single ===');
// ====================================================================
{
    // single="true" + 50/50 (bug latent) → une seule à 100, single conservé
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'multichoice', content: { single: 'true', answers: [{ text: 'A', fraction: 50 }, { text: 'B', fraction: 50 }] } }] }), 'multichoice')[0];
    test('single=true + 50/50 → single conservé', singleOf(b) === 'true');
    test('single=true → exactement une réponse à 100', fractionsOf(b).filter(f => f === 100).length === 1, fractionsOf(b));
}
{
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'multichoice', content: { single: 'false', answers: [{ fraction: 33.33333 }, { fraction: 33.33333 }, { fraction: 33.33333 }, { fraction: 0 }] } }] }), 'multichoice')[0];
    const sum = fractionsOf(b).filter(f => f > 0).reduce((a, b) => a + b, 0);
    test('single=false : positives somment à 100', Math.abs(sum - 100) < 0.01, sum);
}
{
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'multichoice', content: { answers: [{ fraction: 100 }, { fraction: 0 }, { fraction: 0 }] } }] }), 'multichoice')[0];
    test('auto-détect 1 positive → single=true', singleOf(b) === 'true');
}
{
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'multichoice', content: { answers: [{ fraction: 50 }, { fraction: 50 }, { fraction: 0 }] } }] }), 'multichoice')[0];
    test('auto-détect 2 positives → single=false', singleOf(b) === 'false');
}
{
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'multichoice', content: { single: 'false', answers: [{ fraction: 0 }, { fraction: 0 }] } }] }), 'multichoice')[0];
    test('multiple sans positive → repli une réponse à 100', has100(fractionsOf(b)), fractionsOf(b));
}
test('aucune réponse → single=true, pas de crash', generateMoodleXml({ questions: [{ type: 'multichoice', content: { answers: [] } }] }).includes('<single>true</single>'));

// ====================================================================
console.log('=== TRUEFALSE : robustesse booléen/chaîne ===');
// ====================================================================
for (const [val, expect] of [[true, 'true'], [false, 'false'], ['true', 'true'], ['false', 'false'], ['vrai', 'true'], ['faux', 'false'], ['Faux', 'false'], ['VRAI', 'true']]) {
    const b = blocksOf(generateMoodleXml({ questions: [{ type: 'truefalse', content: { answer: { value: val } } }] }), 'truefalse')[0];
    const trueFrac = parseInt((b.match(/<answer fraction="(\d+)"[^>]*>\s*<text>true<\/text>/) || [])[1]);
    test(`truefalse value=${JSON.stringify(val)} → bonne réponse "${expect}"`, (trueFrac === 100 ? 'true' : 'false') === expect, { trueFrac });
}
test('GIFT value="false" (chaîne) → {FALSE', /\{FALSE/.test(generateMoodleGift({ questions: [{ type: 'truefalse', content: { answer: { value: 'false' } } }] })));

// ====================================================================
console.log('=== NUMERICAL : normalisation number/tolerance ===');
// ====================================================================
{
    const blocks = blocksOf(generateMoodleXml({ questions: [
        { type: 'numerical', content: { answer: { number: '0,83', tolerance: '0,01' } } },
        { type: 'numerical', content: { answer: { number: '9.81 m/s²', tolerance: '±0.5' } } },
        { type: 'numerical', content: { answer: { number: '10<x<20', tolerance: 0 } } },
    ]}), 'numerical');
    const num = b => (b.match(/<answer fraction="100"[^>]*>\s*<text>([^<]*)<\/text>/) || [])[1];
    const tol = b => (b.match(/<tolerance>([^<]*)<\/tolerance>/) || [])[1];
    test('virgule → point (0,83→0.83 / 0,01→0.01)', num(blocks[0]) === '0.83' && tol(blocks[0]) === '0.01', { n: num(blocks[0]), t: tol(blocks[0]) });
    test('unités/± retirés (9.81 / 0.5)', num(blocks[1]) === '9.81' && tol(blocks[1]) === '0.5', { n: num(blocks[1]), t: tol(blocks[1]) });
    test('XML sûr, pas de <>& (10<x<20 → 10)', !/[<>]/.test(num(blocks[2])) && num(blocks[2]) === '10', num(blocks[2]));
    test('GIFT numérique virgule→point', /=%100%0\.83:0\.01/.test(generateMoodleGift({ questions: [{ type: 'numerical', content: { answer: { number: '0,83', tolerance: '0,01' } } }] })));
}

// ====================================================================
console.log('=== MATCHING GIFT : collision du délimiteur -> ===');
// ====================================================================
{
    const gift = generateMoodleGift({ questions: [{ type: 'matching', content: {
        name: 'Applications',
        subquestions: [
            { text: 'f : ℝ -> ℝ', answer: 'réels' },
            { text: 'g : ℕ -> ℤ', answer: 'entiers' },
            { text: 'h', answer: 'a -> b' },
        ],
    } }] });
    // Chaque ligne de paire ne doit contenir qu'UN seul ' -> ' (le délimiteur du générateur)
    const pairLines = gift.split('\n').filter(l => l.trim().startsWith('=<p>'));
    let allSingleDelim = true;
    for (const l of pairLines) {
        const delimCount = (l.match(/ -> /g) || []).length;
        if (delimCount !== 1) allSingleDelim = false;
    }
    test('matching GIFT : une seule flèche délimiteur par paire', allSingleDelim, pairLines);
    test('matching GIFT : flèche ASCII du contenu convertie en →', gift.includes('ℝ → ℝ') && gift.includes('a → b'));
}

// ====================================================================
console.log('=== BANQUE COMPLÈTE : invariants globaux d\'import ===');
// ====================================================================
{
    const bank = {
        bank_name: 'Révolte et engagement social', bank_description: 'desc',
        questions: [
            { type: 'multichoice', content: { name: 'Q01', single: 'false', answers: [{ fraction: 33.33333 }, { fraction: 33.33333 }, { fraction: 33.33333 }, { fraction: 0 }, { fraction: 0 }] } },
            { type: 'matching', content: { name: 'Q03', subquestions: [{ text: 'a', answer: '1' }, { text: 'b', answer: '2' }, { text: 'c', answer: '3' }] } },
            { type: 'truefalse', content: { name: 'Q04', answer: { value: false } } },
            { type: 'shortanswer', content: { name: 'Q05', answers: [{ text: 'Albert Camus', fraction: 50 }, { text: 'Frantz Fanon', fraction: 50 }] } },
            { type: 'numerical', content: { name: 'Q08', answer: { number: 1789, tolerance: 0 } } },
            { type: 'shortanswer', content: { name: 'Q10', answers: [{ text: 'Poing levé', fraction: 50 }, { text: 'Drapeau noir', fraction: 50 }] } },
        ],
    };
    const xml = generateMoodleXml(bank);
    test('banque : chaque shortanswer a un 100 %', blocksOf(xml, 'shortanswer').every(b => has100(fractionsOf(b))));
    for (const b of blocksOf(xml, 'multichoice')) {
        const fr = fractionsOf(b), pos = fr.filter(f => f > 0);
        test('banque : mc fractions valides', fr.every(isValidFraction), fr);
        if (singleOf(b) === 'true') test('banque : mc single a un 100', has100(fr), fr);
        else test('banque : mc multiple somme 100', Math.abs(pos.reduce((a, b) => a + b, 0) - 100) < 0.01, pos);
    }
    for (const b of blocksOf(xml, 'truefalse')) { const fr = fractionsOf(b); test('banque : truefalse 100/0', fr.includes(100) && fr.includes(0), fr); }
    test('banque : aucun "undefined" dans le XML', !/undefined/.test(xml));
}

// ====================================================================
console.log('\n========================================');
if (fail === 0) console.log(`${pass}/${pass} tests passés - TOUT OK`);
else console.log(`${pass} OK, ${fail} ÉCHECS`);
console.log('========================================');
process.exit(fail === 0 ? 0 : 1);
