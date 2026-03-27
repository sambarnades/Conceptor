/**
 * Tests unitaires des modules de conversion mathématique.
 * Exécuter avec : node tests/run_math_tests.mjs
 */
import { parseLatex, containsLatex, splitTextAndMath } from '../js/export/latex-parser.js';
import { latexToMathML } from '../js/export/latex-to-mathml.js';
import { GREEK, OPERATORS, NARY_OPS, ACCENTS, BLACKBOARD, isSymbol, isNary, isFunction, getSymbolChar, getSymbolMlType, getStarMath } from '../js/export/math-catalog.js';

let pass = 0, fail = 0;
function test(name, condition) {
    if (condition) { pass++; } else { fail++; console.log('  FAIL:', name); }
}

// ====================================================================
console.log('=== PARSER ===');
// ====================================================================

test('frac', parseLatex('\\frac{a}{b}')[0]?.type === 'frac');
test('dfrac', parseLatex('\\dfrac{a}{b}')[0]?.type === 'frac');
test('frac nested', parseLatex('\\frac{\\frac{a}{b}}{c}')[0]?.num?.[0]?.type === 'frac');
test('sqrt', parseLatex('\\sqrt{x}')[0]?.type === 'sqrt');
test('sqrt[n]', parseLatex('\\sqrt[3]{x}')[0]?.index?.length > 0);
test('sqrt nested', parseLatex('\\sqrt{\\frac{a}{b}}')[0]?.body?.[0]?.type === 'frac');
test('sup', parseLatex('x^{2}')[0]?.type === 'sup');
test('sup single char', parseLatex('x^2')[0]?.type === 'sup');
test('sub', parseLatex('x_{n}')[0]?.type === 'sub');
test('subsup', parseLatex('x_{n}^{m}')[0]?.type === 'subsup');
test('subsup reverse', parseLatex('x^{m}_{n}')[0]?.type === 'subsup');
test('number', parseLatex('123')[0]?.type === 'number');
test('operator +', parseLatex('+')[0]?.type === 'operator');

// Symboles
test('alpha', parseLatex('\\alpha')[0]?.type === 'symbol');
test('pi', parseLatex('\\pi')[0]?.type === 'symbol');
test('Delta', parseLatex('\\Delta')[0]?.type === 'symbol');
test('times', parseLatex('\\times')[0]?.type === 'symbol');
test('leq', parseLatex('\\leq')[0]?.type === 'symbol');
test('infty', parseLatex('\\infty')[0]?.type === 'symbol');
test('rightarrow', parseLatex('\\rightarrow')[0]?.type === 'symbol');
test('in', parseLatex('\\in')[0]?.type === 'symbol');
test('forall', parseLatex('\\forall')[0]?.type === 'symbol');

// N-aire
test('sum', parseLatex('\\sum')[0]?.type === 'nary');
test('sum limits', (() => {
    const ast = parseLatex('\\sum_{i=1}^{n}');
    return ast[0]?.type === 'nary' && ast[0]?.sub?.length > 0 && ast[0]?.sup?.length > 0;
})());
test('int', parseLatex('\\int_{a}^{b}')[0]?.type === 'nary');
test('prod', parseLatex('\\prod_{i=1}^{n}')[0]?.type === 'nary');

// Fonctions
test('sin', parseLatex('\\sin')[0]?.type === 'func');
test('log', parseLatex('\\log')[0]?.type === 'func');
test('lim sub', (() => {
    const ast = parseLatex('\\lim_{x \\to 0}');
    return ast[0]?.type === 'func' && ast[0]?.sub?.length > 0;
})());

// Accents
test('vec', parseLatex('\\vec{u}')[0]?.type === 'accent');
test('hat', parseLatex('\\hat{x}')[0]?.type === 'accent');
test('overline', parseLatex('\\overline{AB}')[0]?.type === 'accent');

// Polices
test('mathbb', parseLatex('\\mathbb{R}')[0]?.type === 'font');
test('text', parseLatex('\\text{si}')[0]?.type === 'textContent');
test('mathrm', parseLatex('\\mathrm{kg}')[0]?.type === 'textContent');

// Délimiteurs
test('left/right ()', (() => {
    const ast = parseLatex('\\left( x \\right)');
    return ast[0]?.type === 'delimited' && ast[0]?.open === '(' && ast[0]?.close === ')';
})());
test('left/right []', (() => {
    const ast = parseLatex('\\left[ x \\right]');
    return ast[0]?.type === 'delimited' && ast[0]?.open === '[';
})());

// Structures
test('binom', parseLatex('\\binom{n}{k}')[0]?.type === 'binom');
test('matrix', (() => {
    const ast = parseLatex('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
    return ast[0]?.type === 'matrix' && ast[0]?.rows?.length === 2 && ast[0]?.rows[0]?.length === 2;
})());
test('cases', (() => {
    const ast = parseLatex('\\begin{cases} x & \\text{si} \\\\ -x & \\text{sinon} \\end{cases}');
    return ast[0]?.type === 'cases' && ast[0]?.rows?.length === 2;
})());

// Formules complexes
test('euler', parseLatex('e^{i\\pi} + 1 = 0').length > 3);
test('frac+sqrt+sup', (() => {
    const ast = parseLatex('\\frac{\\sqrt{x^{2}+1}}{y^{3}}');
    return ast[0]?.type === 'frac' && ast[0]?.num?.[0]?.type === 'sqrt';
})());
test('taylor', (() => {
    const ast = parseLatex('\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}');
    return ast.some(n => n.type === 'nary') && ast.some(n => n.type === 'frac');
})());

// Délimiteurs MathJax retirés
test('strip \\(\\)', parseLatex('\\(x^2\\)')[0]?.type === 'sup');
test('strip \\[\\]', parseLatex('\\[x^2\\]')[0]?.type === 'sup');

// ====================================================================
console.log('=== CATALOGUE ===');
// ====================================================================

test('GREEK count >= 30', Object.keys(GREEK).length >= 30);
test('OPERATORS count >= 70', Object.keys(OPERATORS).length >= 70);
test('NARY count >= 10', Object.keys(NARY_OPS).length >= 10);
test('ACCENTS defined', Object.keys(ACCENTS).length >= 10);
test('BLACKBOARD defined', Object.keys(BLACKBOARD).length >= 20);
test('getSymbolChar alpha', getSymbolChar('alpha') === '\u03B1');
test('getSymbolChar pi', getSymbolChar('pi') === '\u03C0');
test('getSymbolChar times', getSymbolChar('times') === '\u00D7');
test('getSymbolMlType alpha = mi', getSymbolMlType('alpha') === 'mi');
test('getSymbolMlType times = mo', getSymbolMlType('times') === 'mo');
test('isSymbol alpha', isSymbol('alpha'));
test('isSymbol unknown', !isSymbol('unknown'));
test('isNary sum', isNary('sum'));
test('isNary alpha', !isNary('alpha'));
test('isFunction sin', isFunction('sin'));
test('isFunction alpha', !isFunction('alpha'));

// StarMath (catalogue centralisé)
test('getStarMath alpha', getStarMath('alpha') === '%alpha');
test('getStarMath times', getStarMath('times') === 'times');
test('getStarMath sum', getStarMath('sum') === 'sum');
test('getStarMath sin', getStarMath('sin') === 'sin');
test('getStarMath vec', getStarMath('vec') === 'vec');
test('getStarMath mapsto', getStarMath('mapsto') === 'rightarrow');
test('getStarMath unknown', getStarMath('unknown') === null);

// ====================================================================
console.log('=== MATHML ===');
// ====================================================================

test('mfrac', latexToMathML('\\frac{a}{b}').includes('<mfrac>'));
test('msqrt', latexToMathML('\\sqrt{x}').includes('<msqrt>'));
test('mroot', latexToMathML('\\sqrt[3]{x}').includes('<mroot>'));
test('msup', latexToMathML('x^{2}').includes('<msup>'));
test('msub', latexToMathML('x_{n}').includes('<msub>'));
test('msubsup', latexToMathML('x_{n}^{m}').includes('<msubsup>'));
test('munderover', latexToMathML('\\sum_{i}^{n}').includes('<munderover>'));
test('mover accent', latexToMathML('\\vec{u}').includes('<mover'));
test('mtext', latexToMathML('\\text{si}').includes('<mtext>si</mtext>'));
test('mi alpha', latexToMathML('\\alpha').includes('<mi>\u03B1</mi>'));
test('mo times', latexToMathML('\\times').includes('\u00D7') && latexToMathML('\\times').includes('<mo'));
test('mi mathbb R', latexToMathML('\\mathbb{R}').includes('\u211D'));
test('binom linethickness', latexToMathML('\\binom{n}{k}').includes('linethickness'));
test('stretchy delim', latexToMathML('\\left( x \\right)').includes('stretchy'));
test('mtable matrix', latexToMathML('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}').includes('<mtable>'));
test('xmlns', latexToMathML('x').includes('xmlns="http://www.w3.org/1998/Math/MathML"'));
test('nested frac+sqrt', (() => {
    const ml = latexToMathML('\\frac{\\sqrt{x}}{y^{2}}');
    return ml.includes('<mfrac>') && ml.includes('<msqrt>') && ml.includes('<msup>');
})());

// ====================================================================
console.log('=== UTILS ===');
// ====================================================================

test('containsLatex \\(\\)', containsLatex('La valeur \\(x^2\\) est'));
test('containsLatex \\[\\]', containsLatex('\\[\\frac{1}{2}\\]'));
test('containsLatex no', !containsLatex('Pas de formule'));
test('containsLatex empty', !containsLatex(''));
test('splitTextAndMath 3 parts', splitTextAndMath('Avant \\(x^2\\) après').length === 3);
test('splitTextAndMath math type', splitTextAndMath('Avant \\(x^2\\) après')[1]?.type === 'math');
test('splitTextAndMath math value', splitTextAndMath('Avant \\(x^2\\) après')[1]?.value === 'x^2');
test('splitTextAndMath text only', splitTextAndMath('Pas de formule').length === 1);
test('splitTextAndMath 2 formulas', splitTextAndMath('\\(x\\) et \\(y\\)').length === 3);

// ====================================================================
console.log('=== STARMATH ===');
// ====================================================================

test('getStarMath alpha', getStarMath('alpha') === '%alpha');
test('getStarMath Delta', getStarMath('Delta') === '%DELTA');
test('getStarMath omega', getStarMath('omega') === '%omega');
test('getStarMath times', getStarMath('times') === 'times');
test('getStarMath leq', getStarMath('leq') === '<=');
test('getStarMath neq', getStarMath('neq') === '<>');
test('getStarMath infty', getStarMath('infty') === 'infinity');
test('getStarMath in', getStarMath('in') === 'in');
test('getStarMath forall', getStarMath('forall') === 'forall');
test('getStarMath cup', getStarMath('cup') === 'union');
test('getStarMath rightarrow', getStarMath('rightarrow') === 'rightarrow');
test('getStarMath Rightarrow', getStarMath('Rightarrow') === 'drarrow');
test('getStarMath mapsto', getStarMath('mapsto') === 'rightarrow');
test('getStarMath sum', getStarMath('sum') === 'sum');
test('getStarMath int', getStarMath('int') === 'int');
test('getStarMath oint', getStarMath('oint') === 'lint');
test('getStarMath sin', getStarMath('sin') === 'sin');
test('getStarMath lim', getStarMath('lim') === 'lim');
test('getStarMath vec', getStarMath('vec') === 'vec');
test('getStarMath overline', getStarMath('overline') === 'overline');
test('getStarMath partial', getStarMath('partial') === 'partial');
test('getStarMath perp', getStarMath('perp') === 'ortho');
test('getStarMath aleph', getStarMath('aleph') === 'aleph');
test('getStarMath unknown', getStarMath('XYZNOTACOMMAND') === null);

// Couverture : toutes les entrées ont un sm
let smTotal = 0, smOk = 0;
for (const info of Object.values({...GREEK, ...OPERATORS, ...NARY_OPS})) {
    smTotal++;
    if (info.sm) smOk++;
}
test(`Catalogue complet : ${smOk}/${smTotal} symboles avec StarMath`, smOk === smTotal);

// ====================================================================
console.log(`\n${'='.repeat(40)}`);
console.log(`${pass}/${pass + fail} tests passés` + (fail > 0 ? ` (${fail} échecs)` : ' - TOUT OK'));
console.log('='.repeat(40));
