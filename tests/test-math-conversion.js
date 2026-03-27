/**
 * Tests de conversion des formules mathematiques
 *
 * Verifie le parser LaTeX, le catalogue de symboles, le convertisseur MathML,
 * les utilitaires (containsLatex, splitTextAndMath) et les formules imbriquees.
 *
 * Usage : ouvrir tests/test-math-conversion.html ou integre dans test-all.html
 */

import { parseLatex, containsLatex, splitTextAndMath } from '../js/export/latex-parser.js';
import { latexToMathML } from '../js/export/latex-to-mathml.js';
import { GREEK, OPERATORS, NARY_OPS, ACCENTS, BLACKBOARD, isSymbol, isNary, isFunction, getSymbolChar, getSymbolMlType, getStarMath } from '../js/export/math-catalog.js';
import { healJsonObject, latexToUnicode } from '../js/h5p/json-healer.js';
import { _latexToStarMath } from '../js/export/document-exporter.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];

let _ctx = { step: 0, stepName: '', group: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        group: _ctx.group
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

// =======================================================================
// ETAPE 1 : PARSER — TYPES BASIQUES
// =======================================================================

function runStep1_ParserBasics() {
    console.group('Etape 1 : Parser — types basiques');
    _ctx = { step: 1, stepName: 'Parser basique', group: 'Parser' };

    // Texte et nombres
    assert(parseLatex('x')[0]?.type === 'text', 'Caractere simple → text');
    assert(parseLatex('123')[0]?.type === 'number', 'Nombre → number');
    assert(parseLatex('+')[0]?.type === 'operator', 'Operateur + → operator');

    // Fractions
    assert(parseLatex('\\frac{a}{b}')[0]?.type === 'frac', '\\frac{a}{b} → frac');
    assert(parseLatex('\\dfrac{a}{b}')[0]?.type === 'frac', '\\dfrac{a}{b} → frac');
    assert(parseLatex('\\tfrac{a}{b}')[0]?.type === 'frac', '\\tfrac{a}{b} → frac');
    assert(parseLatex('\\frac{\\frac{a}{b}}{c}')[0]?.num?.[0]?.type === 'frac', 'Fraction imbriquee dans numerateur');

    // Racines
    assert(parseLatex('\\sqrt{x}')[0]?.type === 'sqrt', '\\sqrt{x} → sqrt');
    assert(parseLatex('\\sqrt[3]{x}')[0]?.index?.length > 0, '\\sqrt[3]{x} → index present');
    assert(parseLatex('\\sqrt{\\frac{a}{b}}')[0]?.body?.[0]?.type === 'frac', '\\sqrt avec frac imbriquee');

    // Exposants et indices
    assert(parseLatex('x^{2}')[0]?.type === 'sup', 'x^{2} → sup');
    assert(parseLatex('x^2')[0]?.type === 'sup', 'x^2 (sans accolades) → sup');
    assert(parseLatex('x_{n}')[0]?.type === 'sub', 'x_{n} → sub');
    assert(parseLatex('x_{n}^{m}')[0]?.type === 'subsup', 'x_{n}^{m} → subsup');
    assert(parseLatex('x^{m}_{n}')[0]?.type === 'subsup', 'x^{m}_{n} (ordre inverse) → subsup');

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : PARSER — SYMBOLES ET COMMANDES
// =======================================================================

function runStep2_ParserSymbols() {
    console.group('Etape 2 : Parser — symboles et commandes');
    _ctx = { step: 2, stepName: 'Symboles et commandes', group: 'Parser' };

    // Lettres grecques
    assert(parseLatex('\\alpha')[0]?.type === 'symbol', '\\alpha → symbol');
    assert(parseLatex('\\pi')[0]?.type === 'symbol', '\\pi → symbol');
    assert(parseLatex('\\Delta')[0]?.type === 'symbol', '\\Delta → symbol');
    assert(parseLatex('\\Omega')[0]?.type === 'symbol', '\\Omega → symbol');

    // Operateurs
    assert(parseLatex('\\times')[0]?.type === 'symbol', '\\times → symbol');
    assert(parseLatex('\\leq')[0]?.type === 'symbol', '\\leq → symbol');
    assert(parseLatex('\\infty')[0]?.type === 'symbol', '\\infty → symbol');
    assert(parseLatex('\\rightarrow')[0]?.type === 'symbol', '\\rightarrow → symbol');
    assert(parseLatex('\\in')[0]?.type === 'symbol', '\\in → symbol');
    assert(parseLatex('\\forall')[0]?.type === 'symbol', '\\forall → symbol');

    // Operateurs n-aires
    assert(parseLatex('\\sum')[0]?.type === 'nary', '\\sum → nary');
    assert(parseLatex('\\int')[0]?.type === 'nary', '\\int → nary');
    assert(parseLatex('\\prod')[0]?.type === 'nary', '\\prod → nary');

    // N-aire avec limites
    const sumAst = parseLatex('\\sum_{i=1}^{n}');
    const sumNode = sumAst[0];
    assert(sumNode?.type === 'nary' && sumNode?.sub?.length > 0 && sumNode?.sup?.length > 0,
        '\\sum_{i=1}^{n} → nary avec sub + sup');

    // Fonctions
    assert(parseLatex('\\sin')[0]?.type === 'func', '\\sin → func');
    assert(parseLatex('\\log')[0]?.type === 'func', '\\log → func');
    const limAst = parseLatex('\\lim_{x \\to 0}');
    assert(limAst[0]?.type === 'func' && limAst[0]?.sub?.length > 0, '\\lim_{x \\to 0} → func avec sub');

    // Accents
    assert(parseLatex('\\vec{u}')[0]?.type === 'accent', '\\vec{u} → accent');
    assert(parseLatex('\\hat{x}')[0]?.type === 'accent', '\\hat{x} → accent');
    assert(parseLatex('\\overline{AB}')[0]?.type === 'accent', '\\overline{AB} → accent');

    // Polices et texte
    assert(parseLatex('\\mathbb{R}')[0]?.type === 'font', '\\mathbb{R} → font');
    assert(parseLatex('\\text{si}')[0]?.type === 'textContent', '\\text{si} → textContent');
    assert(parseLatex('\\mathrm{kg}')[0]?.type === 'textContent', '\\mathrm{kg} → textContent');

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : PARSER — STRUCTURES
// =======================================================================

function runStep3_ParserStructures() {
    console.group('Etape 3 : Parser — structures');
    _ctx = { step: 3, stepName: 'Structures', group: 'Parser' };

    // Delimiteurs
    const delimAst = parseLatex('\\left( a+b \\right)');
    assert(delimAst[0]?.type === 'delimited' && delimAst[0]?.open === '(' && delimAst[0]?.close === ')',
        '\\left( \\right) → delimited ( )');

    const bracketAst = parseLatex('\\left[ x \\right]');
    assert(bracketAst[0]?.type === 'delimited' && bracketAst[0]?.open === '[',
        '\\left[ \\right] → delimited [ ]');

    // Binome
    assert(parseLatex('\\binom{n}{k}')[0]?.type === 'binom', '\\binom{n}{k} → binom');

    // Matrice
    const matAst = parseLatex('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
    assert(matAst[0]?.type === 'matrix', '\\begin{pmatrix} → matrix');
    assert(matAst[0]?.rows?.length === 2, 'Matrice : 2 lignes');
    assert(matAst[0]?.rows?.[0]?.length === 2, 'Matrice : 2 colonnes');

    // Cases
    const casesAst = parseLatex('\\begin{cases} x & \\text{si} \\\\ -x & \\text{sinon} \\end{cases}');
    assert(casesAst[0]?.type === 'cases', '\\begin{cases} → cases');
    assert(casesAst[0]?.rows?.length === 2, 'Cases : 2 lignes');

    // Espace
    assert(parseLatex('a \\quad b').some(n => n.type === 'space'), '\\quad → space');

    // Delimiteurs MathJax retires
    assert(parseLatex('\\(x^2\\)')[0]?.type === 'sup', 'Strip \\( \\) delimiters');
    assert(parseLatex('\\[x^2\\]')[0]?.type === 'sup', 'Strip \\[ \\] delimiters');

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : PARSER — FORMULES COMPLEXES IMBRIQUEES
// =======================================================================

function runStep4_ParserComplex() {
    console.group('Etape 4 : Parser — formules complexes');
    _ctx = { step: 4, stepName: 'Formules complexes', group: 'Parser' };

    // Fraction avec racine et exposant
    const fracSqrt = parseLatex('\\frac{\\sqrt{x^{2}+1}}{y^{3}}');
    assert(fracSqrt[0]?.type === 'frac' && fracSqrt[0]?.num?.[0]?.type === 'sqrt',
        'frac(sqrt(sup), sup) — imbrication correcte');

    // Euler
    const euler = parseLatex('e^{i\\pi} + 1 = 0');
    assert(euler.length >= 4 && euler[0]?.type === 'sup', 'Euler : e^{iπ} + 1 = 0');

    // Serie de Taylor
    const taylor = parseLatex('\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}');
    assert(taylor.some(n => n.type === 'nary') && taylor.some(n => n.type === 'frac'),
        'Taylor : nary + frac');

    // Integrale
    const integral = parseLatex('\\int_{0}^{1} x^2 dx');
    assert(integral[0]?.type === 'nary' && integral[0]?.op === 'int',
        'Integrale definie avec bornes');

    // Limite
    const lim = parseLatex('\\lim_{x \\to 0} \\frac{\\sin x}{x}');
    assert(lim.some(n => n.type === 'func') && lim.some(n => n.type === 'frac'),
        'Limite : func + frac');

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : CATALOGUE DE SYMBOLES
// =======================================================================

function runStep5_Catalog() {
    console.group('Etape 5 : Catalogue de symboles');
    _ctx = { step: 5, stepName: 'Catalogue', group: 'Catalogue' };

    // Compteurs
    assert(Object.keys(GREEK).length >= 30, `GREEK: ${Object.keys(GREEK).length} entrees (>= 30)`);
    assert(Object.keys(OPERATORS).length >= 70, `OPERATORS: ${Object.keys(OPERATORS).length} entrees (>= 70)`);
    assert(Object.keys(NARY_OPS).length >= 10, `NARY_OPS: ${Object.keys(NARY_OPS).length} entrees (>= 10)`);
    assert(Object.keys(ACCENTS).length >= 10, `ACCENTS: ${Object.keys(ACCENTS).length} entrees (>= 10)`);
    assert(Object.keys(BLACKBOARD).length >= 20, `BLACKBOARD: ${Object.keys(BLACKBOARD).length} entrees (>= 20)`);

    // Valeurs specifiques
    assert(getSymbolChar('alpha') === '\u03B1', 'alpha → α');
    assert(getSymbolChar('pi') === '\u03C0', 'pi → π');
    assert(getSymbolChar('times') === '\u00D7', 'times → ×');
    assert(getSymbolChar('infty') === '\u221E', 'infty → ∞');
    assert(getSymbolChar('sum') === '\u2211', 'sum → ∑');

    // Types MathML
    assert(getSymbolMlType('alpha') === 'mi', 'alpha → mi (identifiant)');
    assert(getSymbolMlType('times') === 'mo', 'times → mo (operateur)');

    // Fonctions de test
    assert(isSymbol('alpha') === true, 'isSymbol(alpha) = true');
    assert(isSymbol('unknown') === false, 'isSymbol(unknown) = false');
    assert(isNary('sum') === true, 'isNary(sum) = true');
    assert(isNary('alpha') === false, 'isNary(alpha) = false');
    assert(isFunction('sin') === true, 'isFunction(sin) = true');
    assert(isFunction('alpha') === false, 'isFunction(alpha) = false');

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : MATHML
// =======================================================================

function runStep6_MathML() {
    console.group('Etape 6 : MathML');
    _ctx = { step: 6, stepName: 'MathML', group: 'MathML' };

    // Elements de base
    assert(latexToMathML('\\frac{a}{b}').includes('<mfrac>'), 'frac → <mfrac>');
    assert(latexToMathML('\\sqrt{x}').includes('<msqrt>'), 'sqrt → <msqrt>');
    assert(latexToMathML('\\sqrt[3]{x}').includes('<mroot>'), 'sqrt[n] → <mroot>');
    assert(latexToMathML('x^{2}').includes('<msup>'), 'sup → <msup>');
    assert(latexToMathML('x_{n}').includes('<msub>'), 'sub → <msub>');
    assert(latexToMathML('x_{n}^{m}').includes('<msubsup>'), 'subsup → <msubsup>');

    // N-aires et fonctions
    assert(latexToMathML('\\sum_{i}^{n}').includes('<munderover>'), 'sum → <munderover>');
    assert(latexToMathML('\\int_{a}^{b}').includes('<msubsup>'), 'int → <msubsup> (limites en indice/exposant)');
    assert(!latexToMathML('\\int_{a}^{b}').includes('<munderover>'), 'int ≠ <munderover>');
    assert(latexToMathML('\\sin').includes('mathvariant="normal"'), 'sin → mathvariant normal');

    // Accents et polices
    assert(latexToMathML('\\vec{u}').includes('<mover'), 'vec → <mover>');
    assert(latexToMathML('\\text{si}').includes('<mtext>si</mtext>'), 'text → <mtext>');

    // Symboles Unicode
    assert(latexToMathML('\\alpha').includes('\u03B1'), 'alpha → U+03B1');
    assert(latexToMathML('\\times').includes('\u00D7'), 'times → U+00D7');
    assert(latexToMathML('\\mathbb{R}').includes('\u211D'), 'mathbb{R} → U+211D');

    // Structures
    assert(latexToMathML('\\binom{n}{k}').includes('linethickness'), 'binom → linethickness="0"');
    assert(latexToMathML('\\left( x \\right)').includes('stretchy'), 'delimiteurs → stretchy');
    assert(latexToMathML('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}').includes('<mtable>'), 'matrix → <mtable>');

    // Namespace
    assert(latexToMathML('x').includes('xmlns="http://www.w3.org/1998/Math/MathML"'), 'Namespace MathML present');

    // Imbrications
    const nested = latexToMathML('\\frac{\\sqrt{x}}{y^{2}}');
    assert(nested.includes('<mfrac>') && nested.includes('<msqrt>') && nested.includes('<msup>'),
        'Imbrication frac+sqrt+sup');

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : UTILITAIRES
// =======================================================================

function runStep7_Utils() {
    console.group('Etape 7 : Utilitaires');
    _ctx = { step: 7, stepName: 'Utilitaires', group: 'Utils' };

    // containsLatex
    assert(containsLatex('La valeur \\(x^2\\) est') === true, 'containsLatex detecte \\( \\)');
    assert(containsLatex('\\[\\frac{1}{2}\\]') === true, 'containsLatex detecte \\[ \\]');
    assert(containsLatex('Pas de formule') === false, 'containsLatex false sur texte normal');
    assert(containsLatex('') === false, 'containsLatex false sur chaine vide');
    assert(containsLatex(null) === false, 'containsLatex false sur null');

    // splitTextAndMath
    const seg1 = splitTextAndMath('Avant \\(x^2\\) apres');
    assert(seg1.length === 3, 'splitTextAndMath : 3 segments (texte + math + texte)');
    assert(seg1[0]?.type === 'text' && seg1[0]?.value === 'Avant ', 'Segment 1 : texte avant');
    assert(seg1[1]?.type === 'math' && seg1[1]?.value === 'x^2', 'Segment 2 : formule');
    assert(seg1[2]?.type === 'text' && seg1[2]?.value === ' apres', 'Segment 3 : texte apres');

    // Deux formules
    const seg2 = splitTextAndMath('\\(x\\) et \\(y\\)');
    assert(seg2.length === 3, 'splitTextAndMath : 2 formules → 3 segments');

    // Texte seul
    const seg3 = splitTextAndMath('Pas de formule');
    assert(seg3.length === 1 && seg3[0]?.type === 'text', 'splitTextAndMath : texte seul → 1 segment');

    console.groupEnd();
}

// =======================================================================
// ETAPE 8 : PIPELINE EXPORT — PRESERVATION LATEX PAR TYPE D'ACTIVITE
// =======================================================================

async function runStep8_ExportPipeline() {
    console.group('Etape 8 : Pipeline export (preservation LaTeX)');
    _ctx = { step: 8, stepName: 'Pipeline export', group: 'Export' };

    // Importer dynamiquement formatContentForDocument (dépend du DOM)
    let formatContentForDocument;
    try {
        const mod = await import('../js/export/document-formatter.js');
        formatContentForDocument = mod.formatContentForDocument;
    } catch (e) {
        assert(false, `Import document-formatter echoue: ${e.message}`);
        console.groupEnd();
        return;
    }

    // Fixtures avec LaTeX pour chaque type d'activité
    const fixtures = {
        'QuizSet': {
            title: 'Quiz maths',
            questions: [{
                library: 'H5P.MultiChoice 1.16',
                metadata: { title: 'QCM' },
                params: {
                    question: 'Calculer \\(\\frac{1}{2} + \\frac{1}{3}\\)',
                    answers: [
                        { text: '\\(\\frac{5}{6}\\)', correct: true },
                        { text: '\\(\\frac{2}{5}\\)', correct: false }
                    ]
                }
            }, {
                library: 'H5P.TrueFalse 1.8',
                metadata: { title: 'VF' },
                params: { question: '\\(\\sqrt{4} = 2\\)', correct: 'true' }
            }]
        },
        'Flashcards': {
            title: 'Derivees',
            cards: [
                { text: '\\(f(x) = x^2\\)', answer: '\\(f\'(x) = 2x\\)' },
                { text: '\\(f(x) = \\sin(x)\\)', answer: '\\(f\'(x) = \\cos(x)\\)' }
            ]
        },
        'MultipleChoice': {
            question: 'Si \\(f(x) = 2x + 3\\), quelle est \\(f(4)\\) ?',
            answers: [
                { text: '\\(11\\)', correct: true },
                { text: '\\(8\\)', correct: false }
            ]
        },
        'TrueFalse': {
            question: 'Pour tout reel \\(x\\), \\(\\sqrt{x^2} = x\\).',
            correct: 'false'
        },
        'FillInTheBlanks': {
            taskDescription: 'Completez avec \\(\\pi\\).',
            questions: ['La valeur de \\(\\pi\\) est environ *3,14*.']
        },
        'Essay': {
            taskDescription: 'Expliquez pourquoi \\(e^{i\\pi} + 1 = 0\\).',
            keywords: [{ keyword: 'Euler' }]
        },
        'DialogCards': {
            title: 'Formules',
            dialogs: [
                { text: '\\(\\sum_{k=1}^{n} k\\)', answer: '\\(\\frac{n(n+1)}{2}\\)' }
            ]
        },
        'Timeline': {
            headline: 'Histoire des maths',
            date: [{ startDate: '1687', headline: 'Newton', text: 'Decouvre \\(F = ma\\)' }]
        },
        'Glossary': {
            panels: [{ title: 'Derivee', content: 'La derivee de \\(f\\) est \\(f\'\\).' }]
        },
        'CoursePresentation': {
            title: 'Cours',
            slides: [
                { type: 'content', title: 'Intro', text: 'On note \\(f : x \\mapsto f(x)\\).' }
            ]
        },
        'DragTheWords': {
            taskDescription: 'Completez.',
            textField: 'La racine de 9 est *3*.'
        },
        'MarkTheWords': {
            taskDescription: 'Selectionnez.',
            textField: 'Le nombre \\(\\pi\\) est *irrationnel*.'
        },
        'Summary': {
            intro: 'Resume sur \\(\\mathbb{R}\\).',
            summaries: [{ summary: ['\\(\\mathbb{R}\\) est un corps', 'Faux'] }]
        },
        'Chart': {
            title: 'Graphique \\(f(x)\\)',
            chartType: 'bar',
            listOfTypes: [{ text: '\\(x\\)', value: 1 }]
        },
        // Moodle
        'QCM': {
            title: 'QCM Moodle',
            questions: [{ text: '\\(2 + 2\\) = ?', answers: [{ text: '4', fraction: 100 }] }]
        },
        'Page': {
            title: 'Page maths',
            blocks: [{ type: 'text', data: { text: 'Theoreme : \\(a^2 + b^2 = c^2\\)' } }]
        }
    };

    /**
     * Extrait tout le texte d'un résultat formaté, y compris les structures
     * imbriquées (flashcardTable, table rows/headers, etc.)
     */
    function extractAllText(formatted) {
        const texts = [];
        for (const s of (formatted.sections || [])) {
            if (s.text) texts.push(s.text);
            // flashcardTable : rows[].left.text / rows[].right.text
            if (s.type === 'flashcardTable' && s.rows) {
                for (const row of s.rows) {
                    if (row.left?.text) texts.push(row.left.text);
                    if (row.right?.text) texts.push(row.right.text);
                    if (row.left?.hint) texts.push(row.left.hint);
                    if (row.right?.hint) texts.push(row.right.hint);
                }
            }
            // table : headers[] et rows[][]
            if (s.type === 'table') {
                if (s.headers) texts.push(...s.headers.filter(h => typeof h === 'string'));
                if (s.rows) {
                    for (const row of s.rows) {
                        if (Array.isArray(row)) texts.push(...row.filter(c => typeof c === 'string'));
                    }
                }
            }
        }
        if (formatted.title) texts.push(formatted.title);
        return texts.join(' ');
    }

    // Pour chaque type, vérifier que keepLatex=true préserve le LaTeX
    for (const [moduleKey, data] of Object.entries(fixtures)) {
        try {
            // Avec keepLatex: true (pour DOCX/ODT) → doit garder \(...\)
            const withLatex = await formatContentForDocument(moduleKey, data, { keepLatex: true });
            const sectionsText = extractAllText(withLatex);

            // Vérifier que le LaTeX est préservé (pas converti en Unicode)
            const hasLatexInput = JSON.stringify(data).includes('\\(');

            if (hasLatexInput) {
                const latexPreserved = sectionsText.includes('\\(') || sectionsText.includes('\\frac') ||
                    sectionsText.includes('\\sqrt') || sectionsText.includes('\\pi') ||
                    sectionsText.includes('\\sum') || sectionsText.includes('\\mapsto') ||
                    sectionsText.includes('\\mathbb') || sectionsText.includes('\\sin') ||
                    sectionsText.includes('\\cos');
                assert(latexPreserved,
                    `[${moduleKey}] keepLatex=true preserve le LaTeX dans les sections`,
                    `Texte extrait: ${sectionsText.substring(0, 150)}`
                );
            }

            // Sans keepLatex (pour PDF) → doit convertir en Unicode
            const withUnicode = await formatContentForDocument(moduleKey, data, {});
            const unicodeText = extractAllText(withUnicode);

            if (hasLatexInput) {
                const noLatex = !unicodeText.includes('\\(');
                assert(noLatex,
                    `[${moduleKey}] keepLatex=false convertit en Unicode`,
                    `Texte extrait: ${unicodeText.substring(0, 150)}`
                );
            }

            assert(true, `[${moduleKey}] formatContentForDocument OK`);
        } catch (e) {
            assert(false, `[${moduleKey}] Erreur: ${e.message}`);
        }
    }

    // Vérifier que containsLatex détecte les formules dans les sections formatées
    const flashResult = await formatContentForDocument('Flashcards', fixtures.Flashcards, { keepLatex: true });
    const flashAllText = extractAllText(flashResult);
    assert(containsLatex(flashAllText) || flashAllText.includes('\\('),
        'Flashcards: LaTeX detecte dans les sections flashcardTable',
        `Texte extrait: ${flashAllText.substring(0, 150)}`);

    console.groupEnd();
}

// =======================================================================
// ETAPE 9 : STARMATH — CATALOGUE CENTRALISE
// =======================================================================

function runStep9_StarMath() {
    console.group('Etape 9 : StarMath (catalogue centralise)');
    _ctx = { step: 9, stepName: 'StarMath', group: 'StarMath' };

    // Grecques
    assert(getStarMath('alpha') === '%alpha', 'alpha → %alpha');
    assert(getStarMath('Delta') === '%DELTA', 'Delta → %DELTA');
    assert(getStarMath('omega') === '%omega', 'omega → %omega');

    // Opérateurs
    assert(getStarMath('times') === 'times', 'times → times');
    assert(getStarMath('leq') === '<=', 'leq → <=');
    assert(getStarMath('neq') === '<>', 'neq → <>');
    assert(getStarMath('approx') === 'approx', 'approx → approx');
    assert(getStarMath('infty') === 'infinity', 'infty → infinity');

    // Ensembles/logique
    assert(getStarMath('in') === 'in', 'in → in');
    assert(getStarMath('forall') === 'forall', 'forall → forall');
    assert(getStarMath('cup') === 'union', 'cup → union');
    assert(getStarMath('emptyset') === 'emptyset', 'emptyset → emptyset');

    // Flèches
    assert(getStarMath('rightarrow') === 'rightarrow', 'rightarrow → rightarrow');
    assert(getStarMath('Rightarrow') === 'drarrow', 'Rightarrow → drarrow');
    assert(getStarMath('mapsto') === 'rightarrow', 'mapsto → rightarrow (fallback)');

    // N-aires
    assert(getStarMath('sum') === 'sum', 'sum → sum');
    assert(getStarMath('int') === 'int', 'int → int');
    assert(getStarMath('prod') === 'prod', 'prod → prod');
    assert(getStarMath('oint') === 'lint', 'oint → lint');

    // Fonctions
    assert(getStarMath('sin') === 'sin', 'sin → sin');
    assert(getStarMath('log') === 'log', 'log → log');
    assert(getStarMath('lim') === 'lim', 'lim → lim');

    // Accents
    assert(getStarMath('vec') === 'vec', 'vec → vec');
    assert(getStarMath('hat') === 'hat', 'hat → hat');
    assert(getStarMath('overline') === 'overline', 'overline → overline');

    // Divers
    assert(getStarMath('partial') === 'partial', 'partial → partial');
    assert(getStarMath('nabla') === 'nabla', 'nabla → nabla');
    assert(getStarMath('perp') === 'ortho', 'perp → ortho');
    assert(getStarMath('aleph') === 'aleph', 'aleph → aleph');
    assert(getStarMath('ldots') === 'dotslow', 'ldots → dotslow');

    // Inconnue
    assert(getStarMath('XYZNOTACOMMAND') === null, 'Commande inconnue → null');

    // Couverture complète : toutes les entrées du catalogue ont un sm
    let totalEntries = 0, withSm = 0;
    for (const info of Object.values({...GREEK, ...OPERATORS, ...NARY_OPS})) {
        totalEntries++;
        if (info.sm) withSm++;
    }
    assert(withSm === totalEntries,
        `Catalogue complet : ${withSm}/${totalEntries} symboles ont un StarMath`);

    for (const [name, info] of Object.entries(ACCENTS)) {
        assert(!!info.sm, `Accent ${name} a un StarMath : ${info.sm}`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 10 : NORMALISATION \binom → {n \choose k}
// =======================================================================

function runStep10_BinomNormalization() {
    console.group('Etape 10 : Normalisation \\binom → {n \\choose k}');
    _ctx = { step: 10, stepName: 'Binom normalisation', group: 'Healer' };

    // --- healJsonObject : \binom converti dans toutes les chaînes ---

    const quizWithBinom = {
        title: 'Quiz binôme',
        questions: [{
            library: 'H5P.MultiChoice 1.16',
            metadata: { title: 'Q1' },
            params: {
                question: 'Calculer \\(\\binom{n}{k}\\)',
                answers: [
                    { text: '\\(\\binom{n}{k} = \\frac{n!}{k!(n-k)!}\\)', correct: true },
                    { text: '\\(\\binom{n}{k} = n \\times k\\)', correct: false }
                ],
                overallFeedback: [
                    { from: 0, to: 100, feedback: 'Rappel : \\(\\binom{n}{k}\\) est le coefficient binomial.' }
                ]
            }
        }]
    };

    const healed = healJsonObject(quizWithBinom, 'QuizSetQCM');

    // Vérifier que \binom est converti dans la question
    const healedQ = JSON.stringify(healed);
    assert(!healedQ.includes('\\binom'), 'healJsonObject : \\binom absent après normalisation');
    assert(healedQ.includes('\\choose'), 'healJsonObject : \\choose présent après normalisation');

    // Vérifier la forme exacte dans la question
    const question = healed.questions[0].params.question;
    assert(question.includes('{n \\choose k}'), 'Question : \\binom{n}{k} → {n \\choose k}');
    assert(!question.includes('\\binom'), 'Question : \\binom absent');

    // Vérifier dans les réponses
    const ans0 = healed.questions[0].params.answers[0].text;
    assert(ans0.includes('\\choose'), 'Réponse 0 : \\binom converti');

    // Vérifier dans le feedback
    const fb = healed.questions[0].params.overallFeedback[0].feedback;
    assert(fb.includes('\\choose'), 'Feedback : \\binom converti');

    // --- Contenu imbriqué : \binom{\frac{n}{2}}{k} ---
    const nested = healJsonObject({ q: '\\(\\binom{\\frac{n}{2}}{k}\\)' }, 'QuizSetQCM');
    assert(nested.q.includes('{\\frac{n}{2} \\choose k}'), 'Imbriqué : \\binom{\\frac{n}{2}}{k} → {\\frac{n}{2} \\choose k}');
    assert(!nested.q.includes('\\binom'), 'Imbriqué : \\binom absent');

    // --- Occurrences multiples ---
    const multi = healJsonObject({ q: '\\(\\binom{a}{b} + \\binom{c}{d}\\)' }, 'QuizSetQCM');
    const chooseCount = (multi.q.match(/\\choose/g) || []).length;
    assert(chooseCount === 2, `Occurrences multiples : ${chooseCount}/2 \\choose trouvés`);

    // --- Pas de régression : formules sans binom inchangées ---
    const noChange = healJsonObject({
        q1: '\\(\\frac{a}{b}\\)',
        q2: '\\(\\sqrt{x}\\)',
        q3: '\\(\\int_{a}^{b} f(x)\\,dx\\)',
        q4: '\\(\\sum_{i=1}^{n} i\\)',
        q5: '\\(\\mathbb{R}\\)'
    }, 'QuizSetQCM');
    assert(noChange.q1 === '\\(\\frac{a}{b}\\)', 'Régression : \\frac inchangé');
    assert(noChange.q2 === '\\(\\sqrt{x}\\)', 'Régression : \\sqrt inchangé');
    assert(noChange.q3 === '\\(\\int_{a}^{b} f(x)\\,dx\\)', 'Régression : \\int inchangé');
    assert(noChange.q4 === '\\(\\sum_{i=1}^{n} i\\)', 'Régression : \\sum inchangé');
    assert(noChange.q5 === '\\(\\mathbb{R}\\)', 'Régression : \\mathbb inchangé');

    // --- latexToUnicode : {n \choose k} → C(n,k) ---
    assert(latexToUnicode('{n \\choose k}') === 'C(n,k)', 'latexToUnicode : {n \\choose k} → C(n,k)');
    assert(latexToUnicode('{3 \\choose 2}') === 'C(3,2)', 'latexToUnicode : {3 \\choose 2} → C(3,2)');

    // --- latexToUnicode : {contenu imbriqué \choose k} ---
    const unicodeNested = latexToUnicode('{\\frac{n}{2} \\choose k}');
    assert(unicodeNested.startsWith('C(') && unicodeNested.endsWith(')'),
        `latexToUnicode : {\\frac{n}{2} \\choose k} → ${unicodeNested}`);

    // --- latexToUnicode : \binom direct (sans passage par le healer) toujours converti ---
    assert(latexToUnicode('\\binom{n}{k}') === 'C(n,k)', 'latexToUnicode : \\binom{n}{k} toujours → C(n,k)');
    assert(latexToUnicode('\\binom{5}{2}') === 'C(5,2)', 'latexToUnicode : \\binom{5}{2} → C(5,2)');

    // --- latexToUnicode : \binom imbriqué direct ---
    const unicodeBinomNested = latexToUnicode('\\binom{\\frac{n}{2}}{k}');
    assert(unicodeBinomNested.startsWith('C('), `latexToUnicode : \\binom imbriqué → ${unicodeBinomNested}`);

    // --- {n \choose k} dans du texte mixte ---
    const mixed = latexToUnicode('Il y a {n \\choose k} façons');
    assert(mixed.includes('C(n,k)'), `latexToUnicode : texte mixte avec \\choose → ${mixed}`);
    assert(!mixed.includes('\\choose'), 'latexToUnicode : \\choose absent du résultat');

    console.groupEnd();
}

// =======================================================================
// ETAPE 11 : STARMATH — CONVERSION AST (export ODT)
// =======================================================================

function runStep11_StarMathConversion() {
    console.group('Etape 11 : StarMath — conversion AST (export ODT)');
    _ctx = { step: 11, stepName: 'StarMath AST', group: 'StarMath AST' };

    // Helper : teste que la conversion contient le fragment attendu
    function smContains(latex, expected, desc) {
        try {
            const result = _latexToStarMath(latex);
            assert(result.includes(expected),
                `${desc} : "${latex}" → contient "${expected}"`,
                `Résultat: "${result}"`);
        } catch (e) {
            assert(false, `${desc} : erreur — ${e.message}`);
        }
    }

    function smEquals(latex, expected, desc) {
        try {
            const result = _latexToStarMath(latex);
            assert(result === expected,
                `${desc} : "${latex}" → "${expected}"`,
                `Résultat: "${result}"`);
        } catch (e) {
            assert(false, `${desc} : erreur — ${e.message}`);
        }
    }

    function smNotContains(latex, forbidden, desc) {
        try {
            const result = _latexToStarMath(latex);
            assert(!result.includes(forbidden),
                `${desc} : "${latex}" ne contient PAS "${forbidden}"`,
                `Résultat: "${result}"`);
        } catch (e) {
            assert(false, `${desc} : erreur — ${e.message}`);
        }
    }

    // --- Fractions ---
    smContains('\\frac{a}{b}', 'over', 'Fraction simple');
    smContains('\\frac{\\frac{a}{b}}{c}', 'over', 'Fraction imbriquée');

    // --- Racines ---
    smContains('\\sqrt{x}', 'sqrt', 'Racine carrée');
    smContains('\\sqrt[3]{x}', 'nroot', 'Racine n-ième');

    // --- Exposants et indices ---
    smContains('x^{2}', '^ {2}', 'Exposant');
    smContains('x_{n}', '_ {n}', 'Indice');
    smContains('x_{n}^{m}', '_ {n}', 'SubSup — indice');
    smContains('x_{n}^{m}', '^ {m}', 'SubSup — exposant');

    // --- Opérateurs n-aires ---
    smContains('\\sum_{i=1}^{n}', 'sum', 'Somme');
    smContains('\\sum_{i=1}^{n}', 'from', 'Somme — borne inf');
    smContains('\\sum_{i=1}^{n}', 'to', 'Somme — borne sup');
    smContains('\\int_{a}^{b}', 'int', 'Intégrale');
    smContains('\\int_{a}^{b}', '_ {a}', 'Intégrale — borne inf (indice, pas from)');
    smContains('\\prod_{i=1}^{n}', 'prod', 'Produit');

    // --- Fonctions ---
    smContains('\\lim_{x \\to 0}', 'lim', 'Limite');
    smContains('\\lim_{x \\to 0}', 'from', 'Limite — indice (from)');
    smContains('\\sin', 'sin', 'Sinus');

    // --- Fonctions avec indice : log → _ (pas from) ---
    smContains('\\log_{2}(8)', 'log', 'Log base');
    smContains('\\log_{2}(8)', '_ {2}', 'Log base → _ (vrai indice)');
    smNotContains('\\log_{2}(8)', 'from', 'Log base ≠ from (pas sous le nom)');

    // --- Lettres grecques ---
    smContains('\\alpha', '%alpha', 'Alpha');
    smContains('\\pi', '%pi', 'Pi');
    smContains('\\Delta', '%DELTA', 'Delta majuscule');
    smContains('\\omega', '%omega', 'Omega');

    // --- Opérateurs (BUG CORRIGÉ : plus de ¿) ---
    smContains('\\times', 'times', 'Multiplication');
    smContains('\\leq', '&lt;=', 'Inférieur ou égal (XML-escaped)');
    smContains('\\geq', '&gt;=', 'Supérieur ou égal (XML-escaped)');
    smContains('\\neq', '&lt;&gt;', 'Différent (XML-escaped)');
    smContains('\\approx', 'approx', 'Approximation');
    smContains('\\infty', 'infinity', 'Infini');
    smContains('\\pm', '+-', 'Plus ou moins');

    // --- Flèches (BUG CORRIGÉ : \rightarrow ne devient plus "right arrow") ---
    smContains('\\rightarrow', 'rightarrow', 'Flèche droite');
    smContains('\\leftarrow', 'leftarrow', 'Flèche gauche');
    smContains('\\Rightarrow', 'drarrow', 'Double flèche droite');
    smContains('\\Leftrightarrow', 'dlrarrow', 'Double flèche bidirectionnelle');
    smNotContains('\\rightarrow', 'right arrow', 'Flèche droite ≠ délimiteur right + arrow');
    smNotContains('\\leftarrow', 'left arrow', 'Flèche gauche ≠ délimiteur left + arrow');

    // --- Ensembles et logique ---
    smContains('\\in', 'in', 'Appartenance');
    smContains('\\forall', 'forall', 'Pour tout');
    smContains('\\exists', 'exists', 'Il existe');
    smContains('\\emptyset', 'emptyset', 'Ensemble vide');
    smContains('\\cup', 'union', 'Union');
    smContains('\\cap', 'intersection', 'Intersection');

    // --- Accents ---
    smContains('\\vec{u}', 'vec', 'Vecteur');
    smContains('\\hat{x}', 'hat', 'Chapeau');
    smContains('\\overline{AB}', 'overline', 'Barre');

    // --- Polices (BUG CORRIGÉ : plus de "doublestroke") ---
    smContains('\\mathbb{R}', '\u211D', 'mathbb R → ℝ Unicode');
    smContains('\\mathbb{N}', '\u2115', 'mathbb N → ℕ Unicode');
    smContains('\\mathbb{Z}', '\u2124', 'mathbb Z → ℤ Unicode');
    smContains('\\mathbb{Q}', '\u211A', 'mathbb Q → ℚ Unicode');
    smContains('\\mathbb{C}', '\u2102', 'mathbb C → ℂ Unicode');
    smNotContains('\\mathbb{R}', 'doublestroke', 'mathbb R ≠ "doublestroke"');

    // --- Texte ---
    smContains('\\text{si}', '&quot;si&quot;', 'Texte (XML-escaped)');

    // --- Binôme (avec parenthèses) ---
    smContains('\\binom{n}{k}', 'binom', 'Binôme \\binom');
    smContains('\\binom{n}{k}', 'left (', 'Binôme — parenthèse ouvrante');
    smContains('\\binom{n}{k}', 'right )', 'Binôme — parenthèse fermante');
    smContains('{n \\choose k}', 'binom', 'Binôme {n \\choose k}');
    smContains('{n \\choose k}', 'left (', 'Binôme choose — parenthèse ouvrante');

    // --- Délimiteurs ---
    smContains('\\left( x \\right)', 'left (', 'Parenthèses');
    smContains('\\left[ x \\right]', 'left [', 'Crochets');
    smContains('\\left\\{ x \\right\\}', 'lbrace', 'Accolades');
    smContains('\\left\\| x \\right\\|', 'ldline', 'Double barre');

    // --- Matrice (BUG CORRIGÉ : plus de texte brut "begin pmatrix") ---
    smContains('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'matrix', 'Matrice — mot-clé');
    smContains('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '#', 'Matrice — séparateur colonnes');
    smContains('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '##', 'Matrice — séparateur lignes');
    smContains('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'left (', 'Matrice — parenthèses');
    smNotContains('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'begin', 'Matrice ≠ "begin pmatrix"');

    // --- Cases (BUG CORRIGÉ : plus de texte brut "begin cases") ---
    smContains('\\begin{cases} a & \\text{si} \\\\ b & \\text{sinon} \\end{cases}', 'lbrace', 'Cases — accolade gauche');
    smContains('\\begin{cases} a & \\text{si} \\\\ b & \\text{sinon} \\end{cases}', 'matrix', 'Cases — structure');
    smContains('\\begin{cases} a & \\text{si} \\\\ b & \\text{sinon} \\end{cases}', 'right none', 'Cases — pas de droite');
    smNotContains('\\begin{cases} a & \\text{si} \\\\ b & \\text{sinon} \\end{cases}', 'begin', 'Cases ≠ "begin cases"');

    // --- Espaces (BUG CORRIGÉ : plus de ¿ pour \,) ---
    smContains('x \\, y', '`', 'Espace fin \\, → backtick');

    // --- Formule complexe : intégrale de test ---
    smContains('\\int_{0}^{1} x^2 \\, dx', 'int', 'Intégrale complète — opérateur');
    smContains('\\int_{0}^{1} x^2 \\, dx', '_ {0}', 'Intégrale complète — borne inf (indice)');
    smContains('\\int_{0}^{1} x^2 \\, dx', '^ {1}', 'Intégrale complète — borne sup (exposant)');
    smNotContains('\\int_{0}^{1} x^2 \\, dx', '¿', 'Intégrale complète — pas de ¿');

    console.groupEnd();
}

// =======================================================================
// ETAPE 12 : CORRECTIFS ODT — intégrales, opérateurs isolés, délimiteurs
// =======================================================================

function runStep12_OdtFixes() {
    console.group('Etape 12 : Correctifs ODT — intégrales, délimiteurs, opérateurs');
    _ctx = { step: 12, stepName: 'Correctifs ODT', group: 'ODT fixes' };

    // Helper réutilisable
    function smContains(latex, expected, desc) {
        try {
            const result = _latexToStarMath(latex);
            assert(result.includes(expected), `${desc} : contient "${expected}"`, `Résultat: "${result}"`);
        } catch (e) { assert(false, `${desc} : erreur — ${e.message}`); }
    }
    function smNotContains(latex, forbidden, desc) {
        try {
            const result = _latexToStarMath(latex);
            assert(!result.includes(forbidden), `${desc} : ne contient PAS "${forbidden}"`, `Résultat: "${result}"`);
        } catch (e) { assert(false, `${desc} : erreur — ${e.message}`); }
    }

    // ---------------------------------------------------------------
    // 12a. Intégrales : limites en indice/exposant (_/^), pas from/to
    // ---------------------------------------------------------------
    smContains('\\int_{a}^{b}', '_ {a}', 'Intégrale — borne inf en indice');
    smContains('\\int_{a}^{b}', '^ {b}', 'Intégrale — borne sup en exposant');
    smNotContains('\\int_{a}^{b}', 'from', 'Intégrale ≠ from');
    smNotContains('\\int_{a}^{b}', ' to ', 'Intégrale ≠ to');

    smContains('\\iint_{D}', '_ {D}', 'Intégrale double — indice');
    smContains('\\iiint_{V}', '_ {V}', 'Intégrale triple — indice');
    smContains('\\oint_{C}', '_ {C}', 'Intégrale curviligne — indice');

    // Sommes et produits gardent from/to
    smContains('\\sum_{i=1}^{n}', 'from', 'Somme garde from');
    smContains('\\sum_{i=1}^{n}', 'to', 'Somme garde to');
    smContains('\\prod_{i=1}^{n}', 'from', 'Produit garde from');

    // Intégrales : MathML utilise <msubsup> pas <munderover>
    assert(latexToMathML('\\int_{0}^{1}').includes('<msubsup>'),
        'MathML int → <msubsup>');
    assert(!latexToMathML('\\int_{0}^{1}').includes('<munderover>'),
        'MathML int ≠ <munderover>');
    // Sommes : MathML garde <munderover>
    assert(latexToMathML('\\sum_{i}^{n}').includes('<munderover>'),
        'MathML sum → <munderover>');

    // ---------------------------------------------------------------
    // 12b. Corps vide {} après les limites n-aires et fonctions
    // ---------------------------------------------------------------
    smContains('\\int_{0}^{1}', '{}', 'Intégrale — corps vide {}');
    smContains('\\sum_{i=1}^{n}', '{}', 'Somme — corps vide {}');
    smContains('\\prod_{i=1}^{n}', '{}', 'Produit — corps vide {}');
    smContains('\\lim_{x \\to 0}', '{}', 'Limite — corps vide {}');

    // ---------------------------------------------------------------
    // 12c. Opérateurs binaires isolés : phantom operands
    // ---------------------------------------------------------------
    const smTimes = _latexToStarMath('\\times');
    assert(smTimes.startsWith('{} ') && smTimes.endsWith(' {}'),
        'Opérateur isolé \\times → {} times {}',
        `Résultat: "${smTimes}"`);

    const smLeq = _latexToStarMath('\\leq');
    assert(smLeq.startsWith('{} ') && smLeq.endsWith(' {}'),
        'Opérateur isolé \\leq → {} <= {}',
        `Résultat: "${smLeq}"`);

    // Opérateurs non-isolés restent inchangés (pas de {} parasite)
    const smFull = _latexToStarMath('2 \\times 3');
    assert(!smFull.startsWith('{}'), '2 \\times 3 — pas de {} au début', `Résultat: "${smFull}"`);

    // Symboles non-opérateurs restent sans {}
    const smInfty = _latexToStarMath('\\infty');
    assert(!smInfty.startsWith('{}'), '\\infty — pas de {} (mlType=mi)', `Résultat: "${smInfty}"`);

    // ---------------------------------------------------------------
    // 12d. Parser : \left/\right avec espace avant \right
    // ---------------------------------------------------------------
    const parens = parseLatex('\\left( \\right)');
    assert(parens[0]?.type === 'delimited', '\\left( \\right) → delimited');
    assert(parens[0]?.open === '(', '\\left( → open = (');
    assert(parens[0]?.close === ')', '\\right) → close = )');
    assert(parens[0]?.body?.length === 0, '\\left( \\right) → body vide');

    const brackets = parseLatex('\\left[ \\right]');
    assert(brackets[0]?.type === 'delimited' && brackets[0]?.close === ']',
        '\\left[ \\right] → close = ]');

    const braces = parseLatex('\\left\\{ \\right\\}');
    assert(braces[0]?.type === 'delimited' && braces[0]?.close === '}',
        '\\left\\{ \\right\\} → close = }');

    // Délimiteurs avec contenu (non-régression)
    const norm = parseLatex('\\left\\| \\vec{u} \\right\\|');
    assert(norm[0]?.type === 'delimited' && norm[0]?.body?.length > 0,
        '\\left\\| \\vec{u} \\right\\| → délimiteur avec contenu');

    // ---------------------------------------------------------------
    // 12e. MathML : délimiteurs vides → <mtext>
    // ---------------------------------------------------------------
    const mlParens = latexToMathML('\\left( \\right)');
    assert(mlParens.includes('<mtext>()</mtext>'),
        'MathML \\left( \\right) vide → <mtext>()</mtext>',
        `Résultat: "${mlParens}"`);

    const mlBrackets = latexToMathML('\\left[ \\right]');
    assert(mlBrackets.includes('<mtext>[]</mtext>'),
        'MathML \\left[ \\right] vide → <mtext>[]</mtext>',
        `Résultat: "${mlBrackets}"`);

    // Délimiteurs avec contenu gardent <mo stretchy>
    const mlNorm = latexToMathML('\\left\\| x \\right\\|');
    assert(mlNorm.includes('stretchy="true"'),
        'MathML \\left\\| x \\right\\| → garde stretchy',
        `Résultat: "${mlNorm}"`);

    // ---------------------------------------------------------------
    // 12f. Formules complètes du fichier test (non-régression)
    // ---------------------------------------------------------------
    // Intégrale complète
    smContains('\\int_{0}^{1} x^2 \\, dx', 'int', 'Formule intégrale — opérateur');
    smContains('\\int_{0}^{1} x^2 \\, dx', '_ {0}', 'Formule intégrale — borne inf');
    smContains('\\int_{0}^{1} x^2 \\, dx', '^ {1}', 'Formule intégrale — borne sup');
    smContains('\\int_{0}^{1} x^2 \\, dx', '^ {2}', 'Formule intégrale — x^2');
    smNotContains('\\int_{0}^{1} x^2 \\, dx', '¿', 'Formule intégrale — pas de ¿');

    // Norme avec délimiteurs
    smContains('\\left\\| \\vec{u} \\right\\|', 'ldline', 'Norme — délimiteur gauche');
    smContains('\\left\\| \\vec{u} \\right\\|', 'vec', 'Norme — vecteur');

    // Limite avec fraction
    smContains('\\lim_{x \\to 0} \\frac{\\sin(x)}{x}', 'lim', 'Limite + fraction — lim');
    smContains('\\lim_{x \\to 0} \\frac{\\sin(x)}{x}', 'from', 'Limite + fraction — from');
    smContains('\\lim_{x \\to 0} \\frac{\\sin(x)}{x}', 'over', 'Limite + fraction — over');

    // ---------------------------------------------------------------
    // 12g. \mathcal, \mathscr, \mathfrak — pipelines H5P vs exports
    // ---------------------------------------------------------------

    // --- Healer : \mathcal{X} → Unicode (pipeline unique pour tous les formats) ---
    const healed = healJsonObject({ question: '\\( \\mathcal{P}(E) \\)' }, 'MultipleChoice');
    assert(healed.question.includes('𝒫'),
        'Healer : \\mathcal{P} → 𝒫 (U+1D4AB)',
        `Résultat: "${healed.question}"`);
    assert(!healed.question.includes('\\mathcal'),
        'Healer : \\mathcal supprimé après conversion');

    const healedL = healJsonObject({ q: '\\( \\mathcal{L} \\)' }, 'MultipleChoice');
    assert(healedL.q.includes('ℒ'),
        'Healer : \\mathcal{L} → ℒ (U+2112, BMP)');

    const healedR = healJsonObject({ q: '\\( \\mathcal{R} \\)' }, 'MultipleChoice');
    assert(healedR.q.includes('ℛ'),
        'Healer : \\mathcal{R} → ℛ (U+211B, BMP)');

    // Plusieurs lettres
    const healedMulti = healJsonObject({ q: '\\( \\mathcal{PLMR} \\)' }, 'MultipleChoice');
    assert(healedMulti.q.includes('𝒫') && healedMulti.q.includes('ℒ'),
        'Healer : \\mathcal{PLMR} → multi-lettres Unicode');

    // Toutes les lettres A-Z
    const healedAll = healJsonObject({ q: '\\( \\mathcal{ABCDEFGHIJKLMNOPQRSTUVWXYZ} \\)' }, 'MultipleChoice');
    assert(!healedAll.q.includes('\\mathcal'),
        'Healer : toutes les lettres A-Z converties');
    assert(healedAll.q.includes('ℬ') && healedAll.q.includes('ℰ') && healedAll.q.includes('ℱ'),
        'Healer : lettres BMP (B→ℬ, E→ℰ, F→ℱ) correctes');

    // \mathscr → même mapping que \mathcal
    const healedScr = healJsonObject({ q: '\\( \\mathscr{F} \\)' }, 'MultipleChoice');
    assert(healedScr.q.includes('ℱ'),
        'Healer : \\mathscr{F} → ℱ');

    // \mathfrak → mapping fraktur
    const healedFrak = healJsonObject({ q: '\\( \\mathfrak{R} \\)' }, 'MultipleChoice');
    assert(healedFrak.q.includes('ℜ'),
        'Healer : \\mathfrak{R} → ℜ');

    // --- Parser : supporte les surrogate pairs (𝒫 = U+1D4AB) ---
    const calAst = parseLatex('𝒫(E)');
    assert(calAst[0]?.type === 'text' && calAst[0]?.value === '𝒫',
        'Parser : 𝒫 (SMP) → text node intact, pas coupé en surrogates',
        `Résultat: ${JSON.stringify(calAst[0])}`);

    // --- MathML/StarMath : caractère Unicode passé tel quel ---
    const mlCal = latexToMathML('𝒫');
    assert(mlCal.includes('𝒫'),
        'MathML : 𝒫 passé tel quel',
        `Résultat: "${mlCal}"`);

    console.groupEnd();
}

// =======================================================================
// DESCRIPTIONS POUR LE PROMPT IA
// =======================================================================

const STEP_DESCRIPTIONS = [
    'Verifie le parsing des types basiques : texte, nombres, operateurs, fractions (\\frac, \\dfrac, \\tfrac), racines (\\sqrt, \\sqrt[n]), exposants (^{}), indices (_{}), sub+superscripts combines.',
    'Verifie le parsing des symboles LaTeX : lettres grecques (alpha, pi, Delta, Omega), operateurs (times, leq, infty, rightarrow, in, forall), n-aires (sum, int, prod avec limites), fonctions (sin, log, lim avec indice), accents (vec, hat, overline), polices (mathbb, text, mathrm).',
    'Verifie le parsing des structures : delimiteurs \\left/\\right, binomes, matrices (pmatrix avec lignes/colonnes), environnement cases, espaces (\\quad), et le retrait automatique des delimiteurs MathJax \\( \\) et \\[ \\].',
    'Verifie le parsing de formules complexes imbriquees : fraction avec racine et exposant, identite d\'Euler, serie de Taylor (nary + frac), integrale definie, limite avec fraction.',
    'Verifie le catalogue de symboles (math-catalog.js) : compteurs minimaux pour GREEK (>=30), OPERATORS (>=70), NARY_OPS (>=10), ACCENTS (>=10), BLACKBOARD (>=20). Teste les valeurs Unicode specifiques et les fonctions de lookup (isSymbol, isNary, isFunction, getSymbolChar, getSymbolMlType).',
    'Verifie la generation MathML (latex-to-mathml.js) : elements de base (mfrac, msqrt, mroot, msup, msub, msubsup), n-aires (munderover), fonctions (mathvariant), accents (mover), texte (mtext), symboles Unicode, structures (binom, delimiteurs stretchy, mtable), namespace MathML, et imbrications complexes.',
    'Verifie les utilitaires (containsLatex, splitTextAndMath) : detection de LaTeX dans du texte, decoupe en segments texte/math, gestion des cas limites (vide, null, texte seul, formules multiples).',
    'Verifie le pipeline export complet pour 17 types d\'activites (H5P + Moodle). Pour chaque type : (1) keepLatex=true preserve les delimiteurs \\(...\\) dans les sections formatees ; (2) keepLatex=false convertit en Unicode. Teste aussi la detection LaTeX dans les flashcardTable.',
    'Verifie le catalogue StarMath centralise (math-catalog.js → getStarMath). Teste les correspondances pour les grecques, operateurs, fleches, n-aires, fonctions, accents, divers. Verifie la couverture complete : chaque entree du catalogue a un champ sm.',
    'Verifie la normalisation \\binom{n}{k} → {n \\choose k} dans healJsonObject (compatibilite MathJax 2.x sans AMSmath). Teste : conversion dans question/reponses/feedback, contenu imbrique, occurrences multiples, pas de regression sur frac/sqrt/int/sum/mathbb. Teste aussi latexToUnicode pour {n \\choose k} → C(n,k) et le maintien de \\binom direct.',
    'Verifie la conversion LaTeX → StarMath 5.0 (export ODT) via le parser AST. Teste toutes les structures : fractions (over), racines (sqrt, nroot), exposants/indices, n-aires (sum/int/prod from/to), fonctions (lim from), lettres grecques (%alpha), operateurs (times, <=, >=), fleches (rightarrow sans confusion avec \\right), ensembles/logique, accents (vec/hat/overline), polices (\\mathbb → Unicode ℝ sans doublestroke), texte, binome, delimiteurs (ldline), matrices (matrix # ##), cases (lbrace matrix right none), espaces (\\, → backtick). Verifie aussi la non-regression sur les formules complexes (integrale complete).',
    'Correctifs exports maths : (a) intégrales _/^ en StarMath et <msubsup> en MathML ; (b) corps vide {} après limites n-aires/fonctions ; (c) opérateurs isolés avec {} phantômes ; (d) parser \\left/\\right avec espaces + surrogate pairs Unicode ; (e) délimiteurs vides en <mtext> ; (f) non-régression formules complètes ; (g) \\mathcal/\\mathscr/\\mathfrak → Unicode via healer (pipeline unique), parser supporte 𝒫 (SMP), toutes lettres A-Z testées.'
];

// =======================================================================
// EXPORT
// =======================================================================

export async function runAllTests() {
    console.log('=== Tests conversion formules mathematiques (12 etapes) ===');
    passCount = 0;
    failCount = 0;
    results.length = 0;

    runStep1_ParserBasics();
    runStep2_ParserSymbols();
    runStep3_ParserStructures();
    runStep4_ParserComplex();
    runStep5_Catalog();
    runStep6_MathML();
    runStep7_Utils();
    await runStep8_ExportPipeline();
    runStep9_StarMath();
    runStep10_BinomNormalization();
    runStep11_StarMathConversion();
    runStep12_OdtFixes();

    console.log(`\n=== RESULTATS : ${passCount} PASS, ${failCount} FAIL ===`);

    return {
        passCount,
        failCount,
        results,
        stepDescriptions: STEP_DESCRIPTIONS,
        timings: []
    };
}
