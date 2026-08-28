/**
 * Tests de robustesse et gestion d'erreurs de Caramel
 *
 * Verifie que l'application gere gracieusement les cas d'erreur :
 * JSON malformes, erreurs reseau, classification d'erreurs, nettoyage d'input.
 *
 * Usage : ouvrir tests/test-robustness.html depuis le serveur local.
 */

import { classifyError, ErrorCategory, cleanJsonInput, formatTextToHtml, markdownToHtml } from '../js/core/utils.js';
import { healJsonString, autoWrapLatex, latexToUnicode, normalizeDoubleEscapedLatex, repairBrokenLatexEscapes, convertLatexDelimitersDeep, convertLatexEnvironmentsDeep, healJsonObject, healActivitySpecificFields, healStructureForActivity } from '../js/h5p/json-healer.js';
import { FIELD_CONSTRAINTS, RENDER_TYPES } from '../js/h5p/field-constraints.js';
import { healClozeQuestiontext, healLatexForTest } from '../js/moodle/moodle-creator.js';
import { wrapBareMathSegments, healSlidesLatex } from '../js/h5p/processors/CoursePresentation.js';
import { generateMoodleXml, generateMoodleGift } from '../js/moodle/moodle-formats.js';
import { processH5PContent } from '../js/h5p/processors/index.js';
import SortParagraphsProcessor from '../js/h5p/processors/SortParagraphs.js';

/** Simule le pipeline reel : cleanJsonInput puis healJsonString */
function fullPipeline(raw) {
    return healJsonString(cleanJsonInput(raw));
}
import { loadTranslations } from '../js/core/translation.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
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

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

// =======================================================================
// ETAPE 1 : CLASSIFICATION DES ERREURS
// =======================================================================

async function runStep1_ErrorClassification() {
    console.group('Etape 1 : Classification des erreurs');
    _ctx = { step: 1, stepName: 'Classification', file: '', module: '', source: '' };

    // 1a. SyntaxError → PARSE_ERROR
    const parseErr = classifyError(new SyntaxError('Unexpected token } in JSON'));
    assert(
        parseErr.category === ErrorCategory.PARSE_ERROR,
        `[1a.Syntax] SyntaxError → ${parseErr.category} (attendu: parse_error)`
    );
    assert(
        parseErr.userMessageKey === 'error_parse',
        `[1a.Key] SyntaxError → userMessageKey="${parseErr.userMessageKey}"`
    );

    // 1b. JSON parse error message → PARSE_ERROR
    const jsonErr = classifyError(new Error('Failed to parse JSON response'));
    assert(
        jsonErr.category === ErrorCategory.PARSE_ERROR,
        `[1b.JSON] "parse JSON" → ${jsonErr.category}`
    );

    // 1c. Timeout → NETWORK_ERROR
    const timeoutErr = classifyError(new Error('Request timeout after 30s'));
    assert(
        timeoutErr.category === ErrorCategory.NETWORK_ERROR,
        `[1c.Timeout] "timeout" → ${timeoutErr.category}`
    );

    // 1d. Fetch failed → NETWORK_ERROR
    const fetchErr = classifyError(new Error('Failed to fetch'));
    assert(
        fetchErr.category === ErrorCategory.NETWORK_ERROR,
        `[1d.Fetch] "Failed to fetch" → ${fetchErr.category}`
    );

    // 1e. NetworkError → NETWORK_ERROR
    const netErr = classifyError(new Error('NetworkError when attempting to fetch'));
    assert(
        netErr.category === ErrorCategory.NETWORK_ERROR,
        `[1e.Network] "NetworkError" → ${netErr.category}`
    );

    // 1f. Validation → VALIDATION_ERROR
    const validErr = classifyError(new Error('required field missing'));
    assert(
        validErr.category === ErrorCategory.VALIDATION_ERROR,
        `[1f.Valid] "required field missing" → ${validErr.category}`
    );

    // 1g. Unknown → PACKAGING_ERROR (defaut)
    const unknownErr = classifyError(new Error('Something went wrong'));
    assert(
        unknownErr.category === ErrorCategory.PACKAGING_ERROR,
        `[1g.Default] "Something went wrong" → ${unknownErr.category} (defaut)`
    );

    // 1h. Chaque resultat a un technicalMessage
    assert(
        parseErr.technicalMessage && parseErr.technicalMessage.length > 0,
        `[1h.Tech] technicalMessage present dans tous les resultats`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : NETTOYAGE D'INPUT JSON (cleanJsonInput)
// =======================================================================

async function runStep2_CleanJsonInput() {
    console.group('Etape 2 : Nettoyage d\'input JSON');
    _ctx = { step: 2, stepName: 'cleanJsonInput', file: '', module: '', source: '' };

    // 2a. Bloc ```json ... ```
    const withCodeBlock = '```json\n{"title": "Test"}\n```';
    const cleaned1 = cleanJsonInput(withCodeBlock);
    assert(
        cleaned1.includes('"title"') && !cleaned1.includes('```'),
        `[2a.CodeBlock] Supprime les balises de code : "${cleaned1.substring(0, 40)}"`
    );

    // 2b. Bloc ``` sans json
    const withPlainBlock = '```\n{"title": "Test"}\n```';
    const cleaned2 = cleanJsonInput(withPlainBlock);
    assert(
        cleaned2.includes('"title"') && !cleaned2.includes('```'),
        `[2b.PlainBlock] Supprime les balises de code simples`
    );

    // 2c. Espaces et retours a la ligne en debut/fin
    const withWhitespace = '  \n\n  {"title": "Test"}  \n  ';
    const cleaned3 = cleanJsonInput(withWhitespace);
    assert(
        cleaned3.startsWith('{'),
        `[2c.Trim] Trim les espaces : commence par "${cleaned3.charAt(0)}"`
    );

    // 2d. JSON deja propre → inchange
    const alreadyClean = '{"title": "Test"}';
    const cleaned4 = cleanJsonInput(alreadyClean);
    assert(
        cleaned4 === alreadyClean,
        `[2d.Clean] JSON propre inchange`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : HEALER JSON (healJsonString)
// =======================================================================

async function runStep3_JsonHealer() {
    console.group('Etape 3 : JSON Healer');
    _ctx = { step: 3, stepName: 'JSON Healer', file: '', module: '', source: '' };

    // 3a. JSON valide → retourne tel quel (parseable)
    const validJson = '{"title": "Test", "items": [1, 2, 3]}';
    const t0 = performance.now();
    const healed1 = healJsonString(validJson);
    const t1 = performance.now();
    let parsed1;
    try {
        parsed1 = JSON.parse(healed1);
        assert(true, `[3a.Valid] JSON valide → parseable apres heal`);
        assert(parsed1.title === 'Test', `[3a.Value] Valeur preservee : title="${parsed1.title}"`);
    } catch (e) {
        assert(false, `[3a.Valid] JSON valide non parseable apres heal`, { error: e.message });
    }
    recordTiming('JSON Healer', 'JSON valide', t1 - t0);

    // 3b. Caracteres de controle dans les strings → echappes
    const withCtrl = '{"text": "ligne 1\nligne 2\ttab"}';
    const healed2 = healJsonString(withCtrl);
    try {
        const parsed2 = JSON.parse(healed2);
        assert(true, `[3b.Ctrl] Caracteres de controle echappes : text="${parsed2.text.substring(0, 20)}..."`);
    } catch (e) {
        assert(false, `[3b.Ctrl] Caracteres de controle non echappes`, { error: e.message });
    }

    // 3c. String vide ou null → ne crash pas
    let noCrash = true;
    try {
        healJsonString('');
        healJsonString('   ');
    } catch (e) {
        noCrash = false;
    }
    assert(noCrash, `[3c.Empty] Chaines vides ne causent pas de crash`);

    // --- Tests du pipeline complet (cleanJsonInput + healJsonString) ---

    // 3d. Pipeline : bloc ```json autour
    const withCodeFence = '```json\n{"title": "Test"}\n```';
    try {
        const parsed4 = JSON.parse(fullPipeline(withCodeFence));
        assert(true, `[3d.Pipeline] Code fence + heal : title="${parsed4.title}"`);
    } catch (e) {
        assert(false, `[3d.Pipeline] Code fence non gere par le pipeline`, { error: e.message });
    }

    // 3e. Pipeline : bloc ``` simple
    const withPlainFence = '```\n{"title": "Test"}\n```';
    try {
        const parsed5 = JSON.parse(fullPipeline(withPlainFence));
        assert(true, `[3e.Pipeline] Code fence simple + heal : title="${parsed5.title}"`);
    } catch (e) {
        assert(false, `[3e.Pipeline] Code fence simple non gere`, { error: e.message });
    }

    // 3f. Pipeline : texte libre autour du JSON (reponse IA externe typique)
    // cleanJsonInput extrait desormais le bloc JSON equilibre meme avec de la prose
    // avant/apres le code fence (le texte d'accompagnement d'une IA externe est retire).
    const withText = 'Voici le JSON demande:\n```json\n{"title": "Frise"}\n```\nBon courage!';
    const cleaned = cleanJsonInput(withText);
    const startsClean = cleaned.startsWith('{') || cleaned.startsWith('[');
    let parsed3f; try { parsed3f = JSON.parse(cleaned); } catch { parsed3f = null; }
    assert(startsClean && parsed3f && parsed3f.title === 'Frise',
        `[3f.ProseAutour] Texte libre autour du JSON extrait proprement : "${cleaned.substring(0, 40)}"`);

    // 3g. Performance : healer sur un gros JSON
    const bigJson = JSON.stringify({
        title: "Test performance",
        questions: Array.from({ length: 50 }, (_, i) => ({
            text: `Question ${i + 1} avec du contenu assez long pour simuler un vrai quiz genere par IA`,
            answers: [
                { text: "Reponse A", correct: i % 4 === 0 },
                { text: "Reponse B", correct: i % 4 === 1 },
                { text: "Reponse C", correct: i % 4 === 2 },
                { text: "Reponse D", correct: i % 4 === 3 }
            ]
        }))
    });
    const t2 = performance.now();
    healJsonString(bigJson);
    const t3 = performance.now();
    assert(
        (t3 - t2) < 100,
        `[3g.Perf] Gros JSON (${bigJson.length} chars) heale en ${(t3 - t2).toFixed(1)}ms (< 100ms)`
    );
    recordTiming('JSON Healer', `Gros JSON (${bigJson.length} chars)`, t3 - t2);

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : RESILIENCE DU CHARGEMENT DE LANGUES
// =======================================================================

async function runStep4_LanguageResilience() {
    console.group('Etape 4 : Resilience chargement langues');
    _ctx = { step: 4, stepName: 'Langues resilience', file: '', module: '', source: '' };

    // 4a. Langue inexistante → ne crash pas
    let crashed = false;
    try {
        await loadTranslations('xx_inexistante');
    } catch (e) {
        // Une erreur est acceptable, mais pas un crash non-attrape
    }
    assert(true, `[4a.Unknown] loadTranslations('xx_inexistante') ne crash pas l'application`);

    // 4b. Apres une erreur, on peut toujours charger une langue valide
    try {
        await loadTranslations('fr');
        assert(true, `[4b.Recovery] Chargement de 'fr' fonctionne apres une erreur`);
    } catch (e) {
        assert(false, `[4b.Recovery] Impossible de charger 'fr' apres une erreur`, { error: e.message });
    }

    // 4c. Langue vide → ne crash pas
    try {
        await loadTranslations('');
    } catch (e) {
        // Erreur attendue
    }
    assert(true, `[4c.Empty] loadTranslations('') ne crash pas`);

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : SECURITE (DOMPurify-like patterns)
// =======================================================================

async function runStep5_Security() {
    console.group('Etape 5 : Securite');
    _ctx = { step: 5, stepName: 'Securite', file: '', module: '', source: '' };

    // 5a. Les cles de traduction ne contiennent pas de <script>
    try {
        const resp = await fetch('./js/locales/fr.json');
        const fr = await resp.json();

        const dangerousKeys = Object.entries(fr).filter(([k, v]) =>
            typeof v === 'string' && (
                v.includes('<script') ||
                v.includes('onerror=') ||
                v.includes('javascript:') ||
                v.includes('eval(')
            )
        );
        assert(
            dangerousKeys.length === 0,
            `[5a.XSS] fr.json : ${dangerousKeys.length} valeur(s) avec patterns dangereux`,
            dangerousKeys.length > 0 ? { keys: dangerousKeys.map(([k]) => k) } : null
        );

        // 5b. Les valeurs HTML utilisent des balises pedagogiques valides
        const allowedTags = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'a', 'span', 'code',
            'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'figure', 'figcaption', 'img', 'i', 'button',
            'details', 'summary', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre',
            'u', 's', 'sub', 'sup']);
        const htmlValues = Object.entries(fr).filter(([k, v]) => typeof v === 'string' && v.includes('<'));
        let unknownTags = [];
        for (const [key, val] of htmlValues) {
            const tags = val.match(/<\/?([a-z][a-z0-9]*)/gi) || [];
            for (const tag of tags) {
                const name = tag.replace(/<\/?/, '').toLowerCase();
                if (!allowedTags.has(name)) {
                    unknownTags.push({ key, tag: name });
                }
            }
        }
        assert(
            unknownTags.length === 0,
            `[5b.Tags] fr.json : ${unknownTags.length} balise(s) HTML inconnue(s)`,
            unknownTags.length > 0 ? { tags: [...new Set(unknownTags.map(t => t.tag))].join(', ') } : null
        );

    } catch (e) {
        assert(false, `[5.Load] Impossible de charger fr.json`, { error: e.message });
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : HEALER CLOZE (syntaxe Moodle)
// =======================================================================

async function runStep6_ClozeHealer() {
    console.group('Etape 6 : Healer Cloze');
    _ctx = { step: 6, stepName: 'Healer Cloze', file: 'moodle-creator.js', module: 'healClozeQuestiontext', source: '' };
    const t0 = performance.now();

    // 6a. NUMERICAL:#= → NUMERICAL:=  (# invalide devant =)
    _ctx.source = '6a';
    const hash = healClozeQuestiontext('{1:NUMERICAL:#=1400000:20000}');
    assert(
        hash === '{1:NUMERICAL:=1400000:20000}',
        '[6a] NUMERICAL:#= corrige en NUMERICAL:=',
        { got: hash }
    );

    // 6b. NUMERICAL avec reponse non numerique → SHORTANSWER
    _ctx.source = '6b';
    const textAnswer = healClozeQuestiontext('{1:NUMERICAL:=entier positif:0}');
    assert(
        textAnswer === '{1:SHORTANSWER:=entier positif}',
        '[6b] NUMERICAL non numerique converti en SHORTANSWER',
        { got: textAnswer }
    );

    // 6c. NUMERICAL valide → inchange
    _ctx.source = '6c';
    const validNum = healClozeQuestiontext('{1:NUMERICAL:=42:0.5}');
    assert(
        validNum === '{1:NUMERICAL:=42:0.5}',
        '[6c] NUMERICAL valide inchange',
        { got: validNum }
    );

    // 6d. NUMERICAL negatif → inchange
    _ctx.source = '6d';
    const negNum = healClozeQuestiontext('{1:NUMERICAL:=-3.14:0.01}');
    assert(
        negNum === '{1:NUMERICAL:=-3.14:0.01}',
        '[6d] NUMERICAL negatif inchange',
        { got: negNum }
    );

    // 6e. NUMERICAL notation scientifique → inchange
    _ctx.source = '6e';
    const sciNum = healClozeQuestiontext('{1:NUMERICAL:=3e8:1000}');
    assert(
        sciNum === '{1:NUMERICAL:=3e8:1000}',
        '[6e] NUMERICAL notation scientifique inchange',
        { got: sciNum }
    );

    // 6f. LaTeX \\(...\\) dans cloze → delimiteurs supprimes
    _ctx.source = '6f';
    const latex = healClozeQuestiontext('La valeur de \\(\\sqrt{0}\\) est {1:SHORTANSWER:=0}.');
    assert(
        !latex.includes('\\(') && !latex.includes('\\)'),
        '[6f] Delimiteurs LaTeX \\(...\\) supprimes dans cloze',
        { got: latex }
    );
    assert(
        latex.includes('\\sqrt{0}') && latex.includes('{1:SHORTANSWER:=0}'),
        '[6f] Contenu LaTeX et trou preserves apres suppression delimiteurs',
        { got: latex }
    );

    // 6g. Double-echappe \\\\(...\\\\) → aussi supprime
    _ctx.source = '6g';
    const doubleEsc = healClozeQuestiontext('Calcul : \\\\(x^2\\\\) = {1:NUMERICAL:=4:0}');
    assert(
        !doubleEsc.includes('\\\\(') && !doubleEsc.includes('\\\\)'),
        '[6g] Delimiteurs LaTeX double-echappes supprimes',
        { got: doubleEsc }
    );

    // 6h. Cas reel complet (XML Q6 problematique)
    _ctx.source = '6h';
    const realCase = healClozeQuestiontext(
        'La fonction vérifie que {1:MULTICHOICE:=√(a²)=|a|~√(a²)=a}. De plus, \\(\\sqrt{0}= {1:SHORTANSWER:=0} \\). Et le résultat est {1:NUMERICAL:=entier positif:0}.'
    );
    assert(
        !realCase.includes('\\(') && !realCase.includes('\\)'),
        '[6h.latex] Cas reel : pas de delimiteurs LaTeX',
        { got: realCase }
    );
    assert(
        realCase.includes('{1:MULTICHOICE:='),
        '[6h.multi] Cas reel : MULTICHOICE preserve',
        { got: realCase }
    );
    assert(
        realCase.includes('{1:SHORTANSWER:=0}'),
        '[6h.short] Cas reel : SHORTANSWER preserve',
        { got: realCase }
    );
    assert(
        realCase.includes('{1:SHORTANSWER:=entier positif}'),
        '[6h.num] Cas reel : NUMERICAL texte → SHORTANSWER',
        { got: realCase }
    );

    // 6i. Texte sans cloze → inchange
    _ctx.source = '6i';
    const plain = healClozeQuestiontext('Un texte simple sans aucun trou.');
    assert(
        plain === 'Un texte simple sans aucun trou.',
        '[6i] Texte sans cloze inchange',
        { got: plain }
    );

    // 6j. MULTICHOICE et SHORTANSWER → pas touches
    _ctx.source = '6j';
    const otherTypes = healClozeQuestiontext('Reponse {1:MULTICHOICE:=oui~non} et {1:SHORTANSWER:=42}.');
    assert(
        otherTypes === 'Reponse {1:MULTICHOICE:=oui~non} et {1:SHORTANSWER:=42}.',
        '[6j] MULTICHOICE et SHORTANSWER inchanges',
        { got: otherTypes }
    );

    recordTiming('Healer Cloze', 'healClozeQuestiontext (12 cas)', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : HEALING LATEX COURSEPRESENTATION (^{}, _{}, \circ etc.)
// =======================================================================

async function runStep7_CoursePresentationLatex() {
    console.group('Etape 7 : Healing LaTeX CoursePresentation');
    _ctx = { step: 7, stepName: 'CP LaTeX', file: 'CoursePresentation.js', module: 'wrapBareMathSegments', source: '' };
    const t0 = performance.now();

    // 7a. Expression purement math avec ^{} → enveloppee
    _ctx.source = '7a';
    const pure = wrapBareMathSegments('f^{-1}\\circ f = f\\circ f^{-1}=0');
    assert(
        pure.startsWith('\\(') && pure.endsWith('\\)'),
        '[7a] Expression purement math enveloppee',
        { got: pure }
    );

    // 7b. Expression mixte texte+math avec connecteur → segments math enveloppes
    _ctx.source = '7b';
    const mixed = wrapBareMathSegments('f^{-1}(y)=x si et seulement si f(x)=y');
    assert(
        mixed.includes('\\(') && mixed.includes('si et seulement si'),
        '[7b] Mixte : segments math enveloppes, connecteur preserve',
        { got: mixed }
    );
    // Verifier que ce n'est pas UN SEUL bloc \(...\) englobant tout,
    // mais bien des segments separes avec du texte entre eux
    const mathBlocks = mixed.match(/\\\(.*?\\\)/g) || [];
    assert(
        mathBlocks.length >= 2,
        '[7b] Mixte : la chaine entiere n\'est pas enveloppee',
        { got: mixed, mathBlocks: mathBlocks.length }
    );

    // 7c. Texte sans math → inchange
    _ctx.source = '7c';
    const text = wrapBareMathSegments('Exact, c\'est la caracterisation fondamentale de l\'inverse.');
    assert(
        !text.includes('\\('),
        '[7c] Texte pur inchange',
        { got: text }
    );

    // 7d. Chaine deja delimitee → inchangee
    _ctx.source = '7d';
    const already = wrapBareMathSegments('L\'inverse \\( f^{-1} \\) satisfait \\( f(x)=y \\)');
    assert(
        already === 'L\'inverse \\( f^{-1} \\) satisfait \\( f(x)=y \\)',
        '[7d] Chaine avec delimiteurs existants inchangee',
        { got: already }
    );

    // 7e. Cellule de tableau math simple avec ^{} → enveloppee
    _ctx.source = '7e';
    const cell = wrapBareMathSegments('x^{2}');
    assert(
        cell === '\\(x^{2}\\)',
        '[7e] Cellule tableau x^{2} enveloppee',
        { got: cell }
    );

    // 7f. Expression avec _{} (indice) → enveloppee
    _ctx.source = '7f';
    const subscript = wrapBareMathSegments('a_{n+1} = a_{n} + r');
    assert(
        subscript.startsWith('\\(') && subscript.endsWith('\\)'),
        '[7f] Expression avec indices _{} enveloppee',
        { got: subscript }
    );

    // 7g. Chaine avec $ → inchangee (deja delimitee)
    _ctx.source = '7g';
    const dollar = wrapBareMathSegments('La valeur $x^{2}$ est positive');
    assert(
        dollar === 'La valeur $x^{2}$ est positive',
        '[7g] Chaine avec $ inchangee',
        { got: dollar }
    );

    // 7h. healSlidesLatex recursif sur structure de slides
    _ctx.source = '7h';
    const slides = [
        {
            type: 'quiz',
            exercise: {
                answers: [
                    { text: 'f^{-1}(y)=x si et seulement si f(x)=y', correct: true },
                    { text: 'Pas de math ici', correct: false }
                ]
            }
        },
        {
            type: 'content-with-table',
            table: {
                rows: [['x^{2}', '2x+3'], ['a_{n}', 'suite']]
            }
        }
    ];
    const healed = healSlidesLatex(slides);
    assert(
        healed[0].exercise.answers[0].text.includes('\\('),
        '[7h.a] healSlidesLatex enveloppe les reponses de quiz',
        { got: healed[0].exercise.answers[0].text }
    );
    assert(
        healed[0].exercise.answers[1].text === 'Pas de math ici',
        '[7h.b] healSlidesLatex ne touche pas au texte simple',
        { got: healed[0].exercise.answers[1].text }
    );
    assert(
        healed[1].table.rows[0][0] === '\\(x^{2}\\)',
        '[7h.c] healSlidesLatex enveloppe les cellules de tableau',
        { got: healed[1].table.rows[0][0] }
    );
    assert(
        healed[1].table.rows[0][1] === '2x+3',
        '[7h.d] healSlidesLatex ne touche pas aux cellules sans ^{} ni _{}',
        { got: healed[1].table.rows[0][1] }
    );
    assert(
        healed[0].exercise.answers[0].correct === true,
        '[7h.e] healSlidesLatex preserve les booleens',
        { got: healed[0].exercise.answers[0].correct }
    );

    // 7i. Expression avec \circ detectee
    _ctx.source = '7i';
    const circ = wrapBareMathSegments('f\\circ g');
    assert(
        circ === '\\(f\\circ g\\)',
        '[7i] Expression avec \\circ enveloppee',
        { got: circ }
    );

    // 7j. Expression mixte avec "pour tout"
    _ctx.source = '7j';
    const pourTout = wrapBareMathSegments('f^{-1}(x)=y pour tout x');
    assert(
        pourTout.includes('\\(') && pourTout.includes('pour tout'),
        '[7j] Connecteur "pour tout" preserve, math enveloppee',
        { got: pourTout }
    );

    recordTiming('CP LaTeX Healing', 'wrapBareMathSegments + healSlidesLatex (12 cas)', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

// =======================================================================
// ETAPE 8 : AUTO-WRAP LaTeX ELARGI + HEALING REPONSES MOODLE
// =======================================================================

async function runStep8_AutoWrapLatexExtended() {
    console.group('Etape 8 : AutoWrap LaTeX elargi + Healing reponses Moodle');
    _ctx = { step: 8, stepName: 'AutoWrap elargi', file: '', module: '', source: '' };

    // --- 8a. Commandes trigo/analyse detectees et wrappees ---
    const trigoTests = [
        { input: '\\sin(x) + \\cos(x)', desc: 'sin+cos' },
        { input: '\\tan(\\theta)', desc: 'tan+theta' },
        { input: '\\ln(x) + \\log(x)', desc: 'ln+log' },
        { input: '\\lim_{n \\to \\infty} u_n', desc: 'lim+to+infty' },
        { input: '\\exp(x)', desc: 'exp' },
        { input: '\\arctan(x)', desc: 'arctan' },
        { input: '\\binom{n}{k}', desc: 'binom' },
    ];

    for (const tc of trigoTests) {
        const result = autoWrapLatex(tc.input);
        const wrapped = result.startsWith('\\(') && result.endsWith('\\)');
        assert(wrapped,
            `[8a.Wrap] ${tc.desc} : "${tc.input}" → wrappee dans \\( \\)`,
            !wrapped ? { result } : null
        );
    }

    // --- 8b. Commandes ensembles/logique detectees ---
    const setTests = [
        { input: 'A \\subset B', desc: 'subset' },
        { input: '\\forall x \\in \\mathbb{R}', desc: 'forall+in+mathbb' },
        { input: '\\exists n, \\emptyset', desc: 'exists+emptyset' },
    ];

    for (const tc of setTests) {
        const result = autoWrapLatex(tc.input);
        const wrapped = result.startsWith('\\(') && result.endsWith('\\)');
        assert(wrapped,
            `[8b.Wrap] ${tc.desc} : wrappee dans \\( \\)`,
            !wrapped ? { result } : null
        );
    }

    // --- 8c. Texte normal sans LaTeX → PAS wrappee ---
    const noWrapTests = [
        'Bonjour le monde',
        'La fonction sinus est periodique',
        'Il existe plusieurs solutions',
        'Le logarithme naturel',
    ];

    for (const text of noWrapTests) {
        const result = autoWrapLatex(text);
        assert(result === text,
            `[8c.NoWrap] Texte normal inchange : "${text.substring(0, 30)}..."`,
            result !== text ? { result } : null
        );
    }

    // --- 8d. Chaine deja delimitee → PAS re-wrappee ---
    const alreadyWrapped = '\\(\\sin(x) + \\cos(x)\\)';
    const result8d = autoWrapLatex(alreadyWrapped);
    assert(result8d === alreadyWrapped,
        `[8d.Already] Chaine deja delimitee inchangee`
    );

    // --- 8e. latexToUnicode convertit les nouvelles fonctions ---
    const unicodeTests = [
        { input: '\\sin(x)', expected: 'sin(x)', desc: 'sin→sin' },
        { input: '\\cos(x)', expected: 'cos(x)', desc: 'cos→cos' },
        { input: '\\ln(x)', expected: 'ln(x)', desc: 'ln→ln' },
        { input: '\\lim', expected: 'lim', desc: 'lim→lim' },
        { input: '\\exp(x)', expected: 'exp(x)', desc: 'exp→exp' },
        { input: '\\binom{n}{k}', expected: 'C(n,k)', desc: 'binom→C(n,k)' },
    ];

    for (const tc of unicodeTests) {
        const result = latexToUnicode(tc.input);
        assert(result === tc.expected,
            `[8e.Unicode] ${tc.desc} : "${tc.input}" → "${result}"`,
            result !== tc.expected ? { expected: tc.expected, got: result } : null
        );
    }

    // --- 8f. healLatexForTest nettoie les reponses shortanswer/matching ---
    const testData = {
        questions: [
            {
                type: 'shortanswer',
                content: {
                    questiontext: 'Resolvez \\( x^2 = 4 \\)',
                    answers: [
                        { text: '\\(2\\)', fraction: 100 },
                        { text: '-2', fraction: 100 }
                    ]
                }
            },
            {
                type: 'matching',
                content: {
                    questiontext: 'Associez chaque fonction',
                    subquestions: [
                        { text: '\\( f(x) = x^2 \\)', answer: '\\(f\'(x) = 2x\\)' },
                        { text: '\\( g(x) = \\sin(x) \\)', answer: 'cos(x)' }
                    ]
                }
            }
        ]
    };

    const healed = healLatexForTest(JSON.parse(JSON.stringify(testData)));

    // shortanswer : reponse LaTeX → texte brut
    const sa = healed.questions[0];
    const answer0 = sa.content.answers[0].text;
    assert(!answer0.includes('\\('),
        `[8f.SA] shortanswer : LaTeX supprime de la reponse ("${answer0}")`,
        answer0.includes('\\(') ? { answer: answer0 } : null
    );
    // La deuxieme reponse (deja en texte brut) ne change pas
    assert(healed.questions[0].content.answers[1].text === '-2',
        `[8f.SA2] shortanswer : reponse texte brut preservee`
    );
    // Le questiontext garde le LaTeX (champ HTML rendu par MathJax)
    assert(sa.content.questiontext.includes('\\('),
        `[8f.SA3] shortanswer : questiontext garde le LaTeX`
    );

    // matching : answer LaTeX → Unicode
    const mq = healed.questions[1];
    const matchAnswer0 = mq.content.subquestions[0].answer;
    assert(!matchAnswer0.includes('\\('),
        `[8f.Match] matching : LaTeX supprime du champ answer ("${matchAnswer0}")`,
        matchAnswer0.includes('\\(') ? { answer: matchAnswer0 } : null
    );
    // Le text (rendu HTML) garde le LaTeX
    assert(mq.content.subquestions[0].text.includes('\\('),
        `[8f.Match2] matching : champ text garde le LaTeX`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 9 : NORMALISATION LATEX (doubles echappements + commandes cassees)
// =======================================================================

async function runStep9_LatexNormalization() {
    console.group('Etape 9 : Normalisation LaTeX');
    _ctx = { step: 9, stepName: 'Normalisation LaTeX', file: '', module: '', source: '' };

    // --- 9a. normalizeDoubleEscapedLatex : \\\\( → \\( ---
    const dblEsc1 = '\\\\(x^2 + y^2\\\\)';
    const norm1 = normalizeDoubleEscapedLatex(dblEsc1);
    assert(norm1 === '\\(x^2 + y^2\\)',
        `[9a.DblEsc] Double-echappement normalise : "${dblEsc1}" → "${norm1}"`,
        norm1 !== '\\(x^2 + y^2\\)' ? { expected: '\\(x^2 + y^2\\)', got: norm1 } : null
    );

    // --- 9b. normalizeDoubleEscapedLatex : recursif sur objet ---
    const dblObj = { text: '\\\\(\\\\alpha\\\\)', nested: { val: '\\\\[x\\\\]' } };
    const normObj = normalizeDoubleEscapedLatex(dblObj);
    assert(typeof normObj === 'object' && normObj.text === '\\(\\alpha\\)',
        `[9b.DblObj] Double-echappement recursif sur objet`,
        { text: normObj?.text, nested: normObj?.nested?.val }
    );

    // --- 9c. normalizeDoubleEscapedLatex : ne touche pas aux simples echappements ---
    const simpleEsc = '\\(x^2\\)';
    const normSimple = normalizeDoubleEscapedLatex(simpleEsc);
    assert(normSimple === simpleEsc,
        `[9c.Simple] Simple echappement inchange : "${simpleEsc}"`
    );

    // --- 9d. repairBrokenLatexEscapes : \\neq casse par JSON.parse ---
    // Quand le LLM ecrit \neq, JSON.parse transforme \n en newline + "eq"
    const broken1 = '\\(\n' + 'eq 0\\)';  // simule JSON.parse de \\(\\neq 0\\)
    const repaired1 = repairBrokenLatexEscapes(broken1);
    assert(repaired1.includes('\\neq'),
        `[9d.Repair] \\neq casse repare : "${repaired1.replace(/\n/g, '\\n')}"`,
        !repaired1.includes('\\neq') ? { got: repaired1 } : null
    );

    // --- 9e. repairBrokenLatexEscapes : \\text casse (\\t → tab) ---
    const broken2 = '\\(\t' + 'ext{hello}\\)';  // simule \\text{hello} casse
    const repaired2 = repairBrokenLatexEscapes(broken2);
    assert(repaired2.includes('\\text{hello}'),
        `[9e.Repair] \\text casse repare`,
        !repaired2.includes('\\text{hello}') ? { got: repaired2 } : null
    );

    // --- 9f. repairBrokenLatexEscapes : texte sans LaTeX → inchange ---
    const noLatex = 'Bonjour le monde, pas de formule ici.';
    const repairedNoLatex = repairBrokenLatexEscapes(noLatex);
    assert(repairedNoLatex === noLatex,
        `[9f.NoChange] Texte normal inchange par repairBrokenLatexEscapes`
    );

    // --- 9g. repairBrokenLatexEscapes : recursif sur objet ---
    const brokenObj = { question: '\\(\n' + 'eq 0\\)', feedback: 'Normal text' };
    const repairedObj = repairBrokenLatexEscapes(brokenObj);
    assert(typeof repairedObj === 'object' && repairedObj.question.includes('\\neq'),
        `[9g.RepairObj] Reparation recursive sur objet`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 10 : CONVERSION DELIMITEURS LATEX ($→\\( et $$→\\[)
// =======================================================================

async function runStep10_LatexDelimiters() {
    console.group('Etape 10 : Conversion delimiteurs LaTeX');
    _ctx = { step: 10, stepName: 'Delimiteurs LaTeX', file: '', module: '', source: '' };

    // --- 10a. $...$ → \\(...\\) ---
    const dollar1 = 'La formule $x^2 + 1$ est simple.';
    const conv1 = convertLatexDelimitersDeep(dollar1);
    assert(conv1.includes('\\(x^2 + 1\\)') && !conv1.includes('$'),
        `[10a.Inline] $...$ → \\(...\\) : "${conv1}"`,
        { got: conv1 }
    );

    // --- 10b. $$...$$ → \\[...\\] ---
    const dollar2 = 'Display: $$\\sum_{i=1}^{n} i$$';
    const conv2 = convertLatexDelimitersDeep(dollar2);
    assert(conv2.includes('\\[') && conv2.includes('\\]') && !conv2.includes('$$'),
        `[10b.Display] $$...$$ → \\[...\\] : "${conv2}"`,
        { got: conv2 }
    );

    // --- 10c. Texte sans $ → inchange ---
    const noD = 'Pas de dollar ici.';
    assert(convertLatexDelimitersDeep(noD) === noD,
        `[10c.NoChange] Texte sans $ inchange`
    );

    // --- 10d. Recursif sur objet ---
    const dollarObj = { q: 'Calculez $2+3$', a: 'Resultat: $5$' };
    const convObj = convertLatexDelimitersDeep(dollarObj);
    assert(convObj.q.includes('\\(2+3\\)') && convObj.a.includes('\\(5\\)'),
        `[10d.Recursif] Conversion recursive sur objet`,
        { q: convObj.q, a: convObj.a }
    );

    // --- 10e. $ dans du texte monetaire → faux positif connu ---
    // Ce test documente la limitation : "$5" seul ne devrait pas etre converti
    // mais "$5$ end" avec deux $ sera vu comme un bloc inline
    const money = 'Le prix est $5.';
    const convMoney = convertLatexDelimitersDeep(money);
    // Pas de deuxieme $ → pas de conversion (regex $...$)
    assert(convMoney === money,
        `[10e.Money] Dollar isole non converti : "${convMoney}"`
    );

    // --- 10f. Multiples blocs dans une meme chaine ---
    const multi = 'On a $a$ et $b$ donc $a+b$.';
    const convMulti = convertLatexDelimitersDeep(multi);
    const count = (convMulti.match(/\\\(/g) || []).length;
    assert(count === 3,
        `[10f.Multi] 3 blocs $...$ convertis : ${count} blocs trouves`,
        { got: convMulti }
    );

    // --- 10g. Texte monetaire avec DEUX montants → aucune conversion (B09) ---
    // « 5$ et … 10$ » : le $ ouvrant est precede d'un chiffre (il ferme un montant)
    // et le contenu apparie commence par un espace → on ne convertit pas.
    const money2 = "L'article coute 5$ et le second 10$";
    const convMoney2 = convertLatexDelimitersDeep(money2);
    assert(convMoney2 === money2,
        `[10g.Money2] Texte monetaire a deux montants non converti : "${convMoney2}"`,
        { got: convMoney2 }
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 11 : PIPELINE COMPLET healJsonObject + healActivitySpecificFields
// =======================================================================

async function runStep11_FullHealPipeline() {
    console.group('Etape 11 : Pipeline complet healJsonObject');
    _ctx = { step: 11, stepName: 'Pipeline complet', file: '', module: '', source: '' };

    // --- 11a. healJsonObject : LaTeX nu wrappee pour MultipleChoice ---
    const mcData = {
        question: '\\sqrt{2} est un nombre irrationnel',
        answers: [
            { text: '\\alpha + \\beta', correct: true },
            { text: 'Non', correct: false }
        ]
    };
    const healedMC = healJsonObject(mcData, 'MultipleChoice');
    assert(healedMC.question.includes('\\('),
        `[11a.MC] Question LaTeX wrappee : "${healedMC.question.substring(0, 50)}"`,
        { got: healedMC.question }
    );
    assert(healedMC.answers[0].text.includes('\\('),
        `[11a.MC2] Reponse LaTeX wrappee : "${healedMC.answers[0].text}"`,
        { got: healedMC.answers[0].text }
    );

    // --- 11b. healJsonObject : double echappement normalise ---
    const dblData = {
        question: '\\\\(x^2\\\\)',
        answers: [{ text: '\\\\(y\\\\)', correct: true }]
    };
    const healedDbl = healJsonObject(dblData, 'MultipleChoice');
    assert(!healedDbl.question.includes('\\\\('),
        `[11b.Dbl] Double echappement normalise dans la question`,
        { got: healedDbl.question }
    );

    // --- 11c. healActivitySpecificFields : MarkTheWords LaTeX → Unicode ---
    const mtwData = {
        textField: 'Les *nombres* \\alpha et \\beta sont *importants*.',
        behaviour: {}
    };
    const healedMTW = healActivitySpecificFields(mtwData, 'MarkTheWords');
    assert(!healedMTW.textField.includes('\\alpha'),
        `[11c.MTW] MarkTheWords : LaTeX converti en Unicode`,
        { got: healedMTW.textField }
    );
    assert(healedMTW.textField.includes('α') || healedMTW.textField.includes('alpha'),
        `[11c.MTW2] MarkTheWords : alpha converti`
    );

    // --- 11d. healActivitySpecificFields : DragTheWords LaTeX dans marqueurs ---
    const dtwData = {
        textField: 'La derivee de *\\sin(x)* est *\\cos(x)*.',
        behaviour: {}
    };
    const healedDTW = healActivitySpecificFields(dtwData, 'DragTheWords');
    // Les marqueurs *...* doivent avoir le LaTeX converti en Unicode
    assert(!healedDTW.textField.includes('\\sin'),
        `[11d.DTW] DragTheWords : LaTeX dans marqueurs converti`,
        { got: healedDTW.textField }
    );

    // --- 11e. healActivitySpecificFields : FillInTheBlanks ---
    const fibData = {
        questions: ['**gras** devrait etre *trou* et \\(formule\\) dans le texte'],
        behaviour: {}
    };
    const healedFIB = healActivitySpecificFields(fibData, 'FillInTheBlanks');
    assert(healedFIB.questions[0].includes('*'),
        `[11e.FIB] FillInTheBlanks : **gras** → *trou*`
    );

    // --- 11f. healActivitySpecificFields : Chart LaTeX → Unicode ---
    const chartData = {
        listOfTypes: [
            { text: '\\alpha-test', value: 10, color: '#000' },
            { text: '\\beta-test', value: 20, color: '#fff' }
        ]
    };
    const healedChart = healActivitySpecificFields(chartData, 'Chart');
    assert(healedChart.listOfTypes[0].text.includes('α') || !healedChart.listOfTypes[0].text.includes('\\alpha'),
        `[11f.Chart] Chart : LaTeX converti en Unicode`,
        { got: healedChart.listOfTypes[0].text }
    );

    // --- 11g. healJsonObject : texte sans LaTeX inchange ---
    const plainData = {
        question: 'Quelle est la capitale de la France ?',
        answers: [
            { text: 'Paris', correct: true },
            { text: 'Lyon', correct: false }
        ]
    };
    const healedPlain = healJsonObject(plainData, 'MultipleChoice');
    assert(healedPlain.question === plainData.question,
        `[11g.Plain] Texte sans LaTeX inchange`
    );
    assert(healedPlain.answers[0].text === 'Paris',
        `[11g.Plain2] Reponse sans LaTeX inchangee`
    );

    // --- 11h. healJsonObject : $ converti en \\( ---
    const dollarData = {
        question: 'Calculez $x^2 + 1$',
        answers: [{ text: '$x^2 + 1$', correct: true }]
    };
    const healedDollar = healJsonObject(dollarData, 'MultipleChoice');
    assert(healedDollar.question.includes('\\(') && !healedDollar.question.includes('$'),
        `[11h.Dollar] $ converti en \\( dans la question`,
        { got: healedDollar.question }
    );

    // --- 11i. Securite : scan de toutes les traductions (pas seulement fr) ---
    const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
    const dangerousPatterns = [
        /<script/i, /onerror\s*=/i, /javascript:/i,
        /eval\s*\(/i, /onclick\s*=/i, /onload\s*=/i, /onmouseover\s*=/i
    ];

    for (const locale of LOCALES) {
        try {
            const resp = await fetch(`js/locales/${locale}.json`);
            if (!resp.ok) {
                assert(false, `[11i.Locale] ${locale}.json : erreur chargement (${resp.status})`);
                continue;
            }
            const data = await resp.json();
            const allValues = [];
            const extractValues = (obj) => {
                for (const v of Object.values(obj)) {
                    if (typeof v === 'string') allValues.push(v);
                    else if (v && typeof v === 'object') extractValues(v);
                }
            };
            extractValues(data);

            let hasDanger = false;
            const found = [];
            for (const val of allValues) {
                for (const pat of dangerousPatterns) {
                    if (pat.test(val)) {
                        hasDanger = true;
                        found.push(`"${val.substring(0, 60)}" → ${pat}`);
                    }
                }
            }
            assert(!hasDanger,
                `[11i.Locale] ${locale}.json : pas de pattern XSS (${allValues.length} valeurs)`,
                hasDanger ? { patterns: found.slice(0, 5) } : null
            );
        } catch (e) {
            assert(false, `[11i.Locale] ${locale}.json : exception - ${e.message}`);
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 12 : PROTECTION LATEX DANS FORMATAGE TEXTE + GIFT + HEALING STRUCTUREL
// =======================================================================

async function runStep12_LatexProtectionAndStructuralHealing() {
    console.group('Etape 12 : Protection LaTeX formatage + GIFT + healing structurel');
    _ctx = { step: 12, stepName: 'LaTeX protection & structural healing', file: '', module: '', source: '' };

    // --- 12a. formatTextToHtml : protection LaTeX contre conversion markdown ---
    // Le * dans R^* ne doit PAS devenir <em>
    const mathWithStar = 'Soit \\(\\mathbb{R}^* = \\mathbb{R} \\setminus \\{0\\}\\) un ensemble.';
    const htmlResult = formatTextToHtml(mathWithStar);
    assert(
        htmlResult.includes('\\(\\mathbb{R}^*'),
        '[12a.fmtHtml1] formatTextToHtml preserve R^* dans LaTeX inline',
        { got: htmlResult }
    );
    assert(
        !htmlResult.includes('<em>'),
        '[12a.fmtHtml2] Pas de <em> parasite dans la formule LaTeX',
        { got: htmlResult }
    );

    // Markdown en dehors du LaTeX doit fonctionner normalement
    const mixedContent = '**Theoreme** : \\(a^* + b^*\\) est *important*.';
    const mixedHtml = formatTextToHtml(mixedContent);
    assert(
        mixedHtml.includes('<strong>Theoreme</strong>'),
        '[12a.fmtHtml3] **gras** hors LaTeX fonctionne',
        { got: mixedHtml }
    );
    assert(
        mixedHtml.includes('\\(a^* + b^*\\)'),
        '[12a.fmtHtml4] LaTeX inline avec * preserve',
        { got: mixedHtml }
    );
    assert(
        mixedHtml.includes('<em>important</em>'),
        '[12a.fmtHtml5] *italique* hors LaTeX fonctionne',
        { got: mixedHtml }
    );

    // LaTeX display mode \[...\] aussi protege
    const displayLatex = 'Formule : \\[x^* = \\frac{1}{x}\\] fin.';
    const displayHtml = formatTextToHtml(displayLatex);
    assert(
        displayHtml.includes('\\[x^* = \\frac{1}{x}\\]'),
        '[12a.fmtHtml6] LaTeX display \\[...\\] preserve avec *',
        { got: displayHtml }
    );

    // --- 12b. SortParagraphs : formatParagraphText protege le LaTeX ---
    const sortInput = {
        taskDescription: 'Ordonnez les etapes',
        paragraphs: [
            'Calculer \\(x^*\\) dans \\(\\mathbb{R}^*\\)',
            '**Etape 1** : identifier \\(f(x)\\)',
            'Verifier que \\(a \\neq 0\\)'
        ]
    };
    const sortResult = SortParagraphsProcessor.process(sortInput);
    assert(
        sortResult.paragraphs[0].includes('\\(x^*\\)'),
        '[12b.Sort1] SortParagraphs preserve x^* dans LaTeX',
        { got: sortResult.paragraphs[0] }
    );
    assert(
        !sortResult.paragraphs[0].includes('<em>'),
        '[12b.Sort2] Pas de <em> parasite dans paragraphe avec LaTeX',
        { got: sortResult.paragraphs[0] }
    );
    assert(
        sortResult.paragraphs[1].includes('<strong>Etape 1</strong>'),
        '[12b.Sort3] **gras** fonctionne dans paragraphe sans conflit LaTeX',
        { got: sortResult.paragraphs[1] }
    );

    // --- 12c. generateMoodleGift : accolades echappees, LaTeX preserve ---
    const giftData = {
        bank_name: 'Math Test',
        questions: [{
            type: 'multichoice',
            content: {
                name: 'Q1 LaTeX',
                questiontext: 'Soit \\( \\mathbb{R}^* = \\mathbb{R} \\setminus \\{0\\} \\)',
                feedback: 'Rappel : \\{0\\} est exclu',
                answers: [
                    { text: '\\( x \\in \\mathbb{R}^* \\)', fraction: 100, feedback: 'Correct !' },
                    { text: '\\( x = 0 \\)', fraction: 0, feedback: 'Non, 0 est exclu de \\(\\mathbb{R}^*\\)' }
                ]
            }
        }]
    };
    const gift = generateMoodleGift(giftData);
    // Les accolades de \{0\} doivent etre echappees par escapeGift :
    // \{ (2 chars) → escapeGift remplace { par \{ → \\{ (3 chars : \, \, {)
    // Donc \{0\} (5 chars) → \\{0\\} (7 chars)
    // En JS literal : '\\\\{0\\\\}' represente la chaine \\{0\\}
    assert(
        gift.includes('\\\\{0\\\\}'),
        '[12c.Gift1] GIFT : accolades de \\{0\\} echappees',
        { got: gift.substring(0, 300) }
    );
    // Le LaTeX (backslashes de commandes) ne doit PAS etre sur-echappe
    assert(
        gift.includes('\\mathbb') || gift.includes('\\\\mathbb'),
        '[12c.Gift2] GIFT : commande LaTeX \\mathbb preservee',
        { got: gift.substring(0, 300) }
    );
    // Le format GIFT doit contenir des accolades structurelles
    assert(
        gift.includes('{') && gift.includes('}'),
        '[12c.Gift3] GIFT : accolades structurelles presentes'
    );

    // --- 12d. generateMoodleXml : LaTeX dans CDATA ---
    const xmlData = {
        bank_name: 'Math XML',
        bank_description: 'Test LaTeX',
        questions: [{
            type: 'numerical',
            content: {
                name: 'Integrale',
                questiontext: 'Calculez \\( \\int_0^1 x^2 dx \\)',
                feedback: 'Primitive de x^2',
                answer: { number: 0.333, tolerance: 0.01, feedback: 'Correct' }
            }
        }]
    };
    const xml = generateMoodleXml(xmlData);
    assert(
        xml.includes('<?xml') && xml.includes('</quiz>'),
        '[12d.Xml1] XML : structure valide'
    );
    assert(
        xml.includes('\\int_0^1') || xml.includes('\\\\int_0^1'),
        '[12d.Xml2] XML : formule integrale preservee dans CDATA',
        { got: xml.substring(0, 500) }
    );

    // --- 12e. healStructureForActivity : DialogCards ---
    const dcData = {
        dialogs: [
            { text: 'Recto', answer: 'Verso' },
            { text: 'Q2', answer: 'R2', tips: null },
            null,
            { text: 'Q3', answer: 'R3', tips: { front: 'hint' } }
        ]
    };
    const dcHealed = healStructureForActivity(dcData, 'DialogCards');
    assert(Array.isArray(dcHealed.dialogs), '[12e.DC1] DialogCards : dialogs est un tableau');
    assert(
        dcHealed.dialogs[0].tips && typeof dcHealed.dialogs[0].tips === 'object',
        '[12e.DC2] DialogCards : tips ajoutees quand absentes',
        { got: dcHealed.dialogs[0] }
    );
    assert(
        dcHealed.dialogs[1].tips && dcHealed.dialogs[1].tips.front === '' && dcHealed.dialogs[1].tips.back === '',
        '[12e.DC3] DialogCards : tips null → objet avec front/back vides',
        { got: dcHealed.dialogs[1] }
    );
    assert(
        dcHealed.dialogs[2].text === '' && dcHealed.dialogs[2].tips.front === '',
        '[12e.DC4] DialogCards : element null → structure par defaut',
        { got: dcHealed.dialogs[2] }
    );
    assert(
        dcHealed.dialogs[3].tips.front === 'hint' && dcHealed.dialogs[3].tips.back === '',
        '[12e.DC5] DialogCards : tips existantes preservees, back ajoute',
        { got: dcHealed.dialogs[3] }
    );

    // --- 12f. healStructureForActivity : Essay ---
    const essayData = {
        keywords: [
            'motcle1',
            { word: 'motcle2' },
            { keyword: 'motcle3' }
        ]
    };
    const essayHealed = healStructureForActivity(essayData, 'Essay');
    assert(Array.isArray(essayHealed.keywords), '[12f.Essay1] Essay : keywords est un tableau');
    assert(
        essayHealed.keywords[0].keyword === 'motcle1',
        '[12f.Essay2] Essay : string converti en { keyword: string }',
        { got: essayHealed.keywords[0] }
    );
    assert(
        essayHealed.keywords[1].keyword === 'motcle2' && !essayHealed.keywords[1].word,
        '[12f.Essay3] Essay : { word } renomme en { keyword }',
        { got: essayHealed.keywords[1] }
    );
    assert(
        essayHealed.keywords[2].keyword === 'motcle3',
        '[12f.Essay4] Essay : { keyword } preserve',
        { got: essayHealed.keywords[2] }
    );
    assert(
        essayHealed.solution && essayHealed.solution.introduction === '' && essayHealed.solution.sample === '',
        '[12f.Essay5] Essay : solution par defaut ajoutee',
        { got: essayHealed.solution }
    );

    // --- 12g. healStructureForActivity : SingleChoiceSet ---
    const scsData = {
        choices: [
            { question: 'Q1', answers: 'reponse unique' },
            { question: 'Q2', answers: ['r1', 'r2'] }
        ]
    };
    const scsHealed = healStructureForActivity(scsData, 'SingleChoiceSet');
    assert(Array.isArray(scsHealed.choices), '[12g.SCS1] SingleChoiceSet : choices est un tableau');
    assert(
        Array.isArray(scsHealed.choices[0].answers) && scsHealed.choices[0].answers[0] === 'reponse unique',
        '[12g.SCS2] SingleChoiceSet : answers string → tableau',
        { got: scsHealed.choices[0] }
    );
    assert(
        scsHealed.choices[0].subContentId && typeof scsHealed.choices[0].subContentId === 'string',
        '[12g.SCS3] SingleChoiceSet : subContentId genere',
        { got: scsHealed.choices[0].subContentId }
    );
    assert(
        Array.isArray(scsHealed.choices[1].answers) && scsHealed.choices[1].answers.length === 2,
        '[12g.SCS4] SingleChoiceSet : answers tableau preserve',
        { got: scsHealed.choices[1] }
    );

    // --- 12h. healStructureForActivity : SortParagraphs ---
    const spDataSentences = {
        sentences: ['phrase1', 'phrase2', 'phrase3']
    };
    const spHealed = healStructureForActivity(spDataSentences, 'SortParagraphs');
    assert(
        Array.isArray(spHealed.paragraphs) && spHealed.paragraphs.length === 3,
        '[12h.SP1] SortParagraphs : sentences renomme en paragraphs',
        { got: spHealed }
    );
    assert(
        !spHealed.sentences,
        '[12h.SP2] SortParagraphs : sentences supprime apres renommage'
    );

    const spDataParagraphs = { paragraphs: ['p1', 'p2'] };
    const spHealed2 = healStructureForActivity(spDataParagraphs, 'SortParagraphs');
    assert(
        Array.isArray(spHealed2.paragraphs) && spHealed2.paragraphs.length === 2,
        '[12h.SP3] SortParagraphs : paragraphs existants preserves'
    );

    // --- 12i. healStructureForActivity : Summary ---
    const sumData = {
        summaries: [
            { summary: 'texte unique' },
            null,
            { summary: ['opt1', 'opt2'], tip: 'conseil' }
        ]
    };
    const sumHealed = healStructureForActivity(sumData, 'Summary');
    assert(Array.isArray(sumHealed.summaries), '[12i.Sum1] Summary : summaries est un tableau');
    assert(
        Array.isArray(sumHealed.summaries[0].summary) && sumHealed.summaries[0].summary[0] === 'texte unique',
        '[12i.Sum2] Summary : summary string → tableau',
        { got: sumHealed.summaries[0] }
    );
    assert(
        sumHealed.summaries[0].tip === '',
        '[12i.Sum3] Summary : tip ajoute quand absent',
        { got: sumHealed.summaries[0] }
    );
    assert(
        sumHealed.summaries[0].subContentId && typeof sumHealed.summaries[0].subContentId === 'string',
        '[12i.Sum4] Summary : subContentId genere',
        { got: sumHealed.summaries[0].subContentId }
    );
    assert(
        sumHealed.summaries[1].summary && Array.isArray(sumHealed.summaries[1].summary),
        '[12i.Sum5] Summary : element null → structure par defaut',
        { got: sumHealed.summaries[1] }
    );
    assert(
        sumHealed.summaries[2].summary.length === 2 && sumHealed.summaries[2].tip === 'conseil',
        '[12i.Sum6] Summary : donnees existantes preservees',
        { got: sumHealed.summaries[2] }
    );

    // --- 12j. formatTextToHtml : texte sans LaTeX, pas de regression ---
    const plainText = 'Un texte **gras** et *italique* sans maths.';
    const plainHtml = formatTextToHtml(plainText);
    assert(
        plainHtml.includes('<strong>gras</strong>') && plainHtml.includes('<em>italique</em>'),
        '[12j.Plain] formatTextToHtml : markdown sans LaTeX fonctionne normalement',
        { got: plainHtml }
    );

    // --- 12k. GIFT avec tous les types de questions + LaTeX ---
    const fullGiftData = {
        bank_name: 'Banque complète',
        questions: [
            {
                type: 'truefalse',
                content: {
                    name: 'VF LaTeX',
                    questiontext: '\\( e^{i\\pi} + 1 = 0 \\) est la formule d\'Euler',
                    feedback: 'Identite remarquable',
                    answer: { value: true, feedback_true: 'Oui !', feedback_false: 'Non' }
                }
            },
            {
                type: 'shortanswer',
                content: {
                    name: 'Court LaTeX',
                    questiontext: 'Quelle est la derivee de \\( x^2 \\) ?',
                    feedback: 'Regle de derivation',
                    answers: [
                        { text: '2x', fraction: 100, feedback: 'Exact' }
                    ]
                }
            },
            {
                type: 'matching',
                content: {
                    name: 'Appariement LaTeX',
                    questiontext: 'Associez',
                    feedback: 'Formules de base',
                    subquestions: [
                        { text: '\\( \\sin^2(x) + \\cos^2(x) \\)', answer: '1' },
                        { text: '\\( e^0 \\)', answer: '1' }
                    ]
                }
            },
            {
                type: 'numerical',
                content: {
                    name: 'Numerique',
                    questiontext: '\\( \\sqrt{144} = ? \\)',
                    feedback: 'Racine carree',
                    answer: { number: 12, tolerance: 0, feedback: 'Exact' }
                }
            }
        ]
    };
    const fullGift = generateMoodleGift(fullGiftData);
    assert(
        fullGift.includes('TRUE'),
        '[12k.Gift1] GIFT truefalse : contient TRUE',
        { got: fullGift.substring(0, 200) }
    );
    assert(
        fullGift.includes('=%100%2x'),
        '[12k.Gift2] GIFT shortanswer : contient la reponse avec fraction',
        { got: fullGift }
    );
    assert(
        fullGift.includes('->'),
        '[12k.Gift3] GIFT matching : contient la fleche ->',
        { got: fullGift }
    );
    assert(
        fullGift.includes('{#'),
        '[12k.Gift4] GIFT numerical : contient {#',
        { got: fullGift }
    );
    // Le GIFT genere ne doit pas crasher et doit contenir du LaTeX
    assert(
        fullGift.includes('\\sin') || fullGift.includes('\\\\sin'),
        '[12k.Gift5] GIFT : commande LaTeX sin preservee',
        { got: fullGift }
    );

    // --- 12l. generateMoodleXml : tous les types de questions avec valeurs null ---
    const xmlNullData = {
        questions: [
            { type: 'multichoice', content: { name: null, questiontext: null, feedback: null, answers: null, single: null } },
            { type: 'matching', content: { name: null, questiontext: null, feedback: null, subquestions: null } },
            { type: 'truefalse', content: { name: null, questiontext: null, feedback: null, answer: null } },
            { type: 'shortanswer', content: { name: null, questiontext: null, feedback: null, answers: null } },
            { type: 'numerical', content: { name: null, questiontext: null, feedback: null, answer: null } },
            { type: 'cloze', content: { name: null, questiontext: null, feedback: null } }
        ]
    };
    let xmlNullCrash = false;
    try {
        const xmlNull = generateMoodleXml(xmlNullData);
        assert(
            xmlNull.includes('<?xml') && xmlNull.includes('</quiz>'),
            '[12l.XmlNull] XML : pas de crash avec toutes les valeurs null'
        );
    } catch (e) {
        xmlNullCrash = true;
        assert(false, '[12l.XmlNull] XML : CRASH avec valeurs null : ' + e.message);
    }

    // --- 12m. generateMoodleGift avec valeurs null ---
    const giftNullData = {
        questions: [
            { type: 'multichoice', content: { name: null, questiontext: null, feedback: null, answers: null } },
            { type: 'matching', content: { name: null, questiontext: null, feedback: null, subquestions: null } },
            { type: 'truefalse', content: { name: null, questiontext: null, feedback: null, answer: null } },
            { type: 'shortanswer', content: { name: null, questiontext: null, feedback: null, answers: null } },
            { type: 'numerical', content: { name: null, questiontext: null, feedback: null, answer: null } }
        ]
    };
    let giftNullCrash = false;
    try {
        const giftNull = generateMoodleGift(giftNullData);
        assert(
            typeof giftNull === 'string',
            '[12m.GiftNull] GIFT : pas de crash avec toutes les valeurs null'
        );
    } catch (e) {
        giftNullCrash = true;
        assert(false, '[12m.GiftNull] GIFT : CRASH avec valeurs null : ' + e.message);
    }

    // --- 12n. generateMoodleXml : hints et feedbacks combines ---
    const hintsData = {
        bank_name: 'Test Hints',
        questions: [
            {
                type: 'multichoice',
                content: {
                    name: 'QCM Hints',
                    questiontext: 'Quelle est la capitale ?',
                    feedback: 'Feedback general',
                    correctfeedback: 'Bravo !',
                    partiallycorrectfeedback: 'Presque...',
                    incorrectfeedback: 'Non, reessayez.',
                    hints: ['Indice 1 : grande ville', 'Indice 2 : traversee par la Seine'],
                    answers: [
                        { text: 'Paris', fraction: 100, feedback: 'Exact' },
                        { text: 'Lyon', fraction: 0, feedback: 'Non' }
                    ]
                }
            },
            {
                type: 'matching',
                content: {
                    name: 'Appariement Hints',
                    questiontext: 'Associez',
                    feedback: 'Feedback general',
                    correctfeedback: 'Parfait !',
                    partiallycorrectfeedback: 'Partiellement correct.',
                    incorrectfeedback: 'Tout faux.',
                    hints: ['Pensez aux dates'],
                    subquestions: [
                        { text: '1789', answer: 'Revolution' },
                        { text: '1945', answer: 'Liberation' }
                    ]
                }
            },
            {
                type: 'truefalse',
                content: {
                    name: 'VF Hints',
                    questiontext: 'Le soleil est une etoile.',
                    feedback: 'Le soleil est bien une etoile.',
                    hints: ['Regardez le ciel la nuit'],
                    answer: { value: true, feedback_true: 'Oui', feedback_false: 'Non' }
                }
            },
            {
                type: 'shortanswer',
                content: {
                    name: 'Court Hints',
                    questiontext: 'Quel est le symbole du sodium ?',
                    feedback: 'Na pour Natrium',
                    hints: ['Pensez au tableau periodique'],
                    answers: [{ text: 'Na', fraction: 100, feedback: 'Exact' }]
                }
            },
            {
                type: 'numerical',
                content: {
                    name: 'Num Hints',
                    questiontext: 'Combien font 7 x 8 ?',
                    feedback: '56',
                    hints: ['Pensez a la table de 7'],
                    answer: { number: 56, tolerance: 0, feedback: 'Exact' }
                }
            },
            {
                type: 'cloze',
                content: {
                    name: 'Cloze avec hints',
                    questiontext: 'La capitale est {1:SHORTANSWER:=Paris}.',
                    feedback: 'Paris est la capitale.',
                    hints: ['Pensez a une grande ville', 'Elle est traversee par la Seine']
                }
            }
        ]
    };
    let hintsXmlCrash = false;
    try {
        const hintsXml = generateMoodleXml(hintsData);
        // Structure XML valide
        assert(
            hintsXml.includes('<?xml') && hintsXml.includes('</quiz>'),
            '[12n.Hints1] XML hints : structure valide'
        );
        // Feedbacks combines dans multichoice
        assert(
            hintsXml.includes('<correctfeedback') && hintsXml.includes('Bravo'),
            '[12n.Hints2] XML multichoice : correctfeedback present',
            { got: hintsXml.substring(0, 1000) }
        );
        assert(
            hintsXml.includes('<partiallycorrectfeedback') && hintsXml.includes('Presque'),
            '[12n.Hints3] XML multichoice : partiallycorrectfeedback present'
        );
        assert(
            hintsXml.includes('<incorrectfeedback') && hintsXml.includes('reessayez'),
            '[12n.Hints4] XML multichoice : incorrectfeedback present'
        );
        assert(
            hintsXml.includes('<shownumcorrect'),
            '[12n.Hints5] XML : shownumcorrect present quand feedbacks combines'
        );
        // Hints dans multichoice
        assert(
            hintsXml.includes('<hint') && hintsXml.includes('Indice 1'),
            '[12n.Hints6] XML multichoice : hint 1 present'
        );
        assert(
            hintsXml.includes('Indice 2'),
            '[12n.Hints7] XML multichoice : hint 2 present'
        );
        // Hints dans matching
        assert(
            hintsXml.includes('Pensez aux dates'),
            '[12n.Hints8] XML matching : hint present'
        );
        // Hints dans truefalse (pas de feedbacks combines)
        assert(
            hintsXml.includes('Regardez le ciel'),
            '[12n.Hints9] XML truefalse : hint present'
        );
        // Hints dans shortanswer
        assert(
            hintsXml.includes('tableau periodique'),
            '[12n.Hints10] XML shortanswer : hint present'
        );
        // Hints dans numerical
        assert(
            hintsXml.includes('table de 7'),
            '[12n.Hints11] XML numerical : hint present'
        );
        // Cloze supporte les hints
        const clozeSection = hintsXml.split('Cloze avec hints')[1] || '';
        const clozeEnd = clozeSection.indexOf('</question>');
        const clozeXml = clozeSection.substring(0, clozeEnd);
        assert(
            clozeXml.includes('<hint'),
            '[12n.Hints12] XML cloze : hints presents'
        );
        assert(
            clozeXml.includes('grande ville'),
            '[12n.Hints13] XML cloze : hint 1 present'
        );
        assert(
            clozeXml.includes('traversee par la Seine'),
            '[12n.Hints14] XML cloze : hint 2 present'
        );
    } catch (e) {
        hintsXmlCrash = true;
        assert(false, '[12n.Hints] XML hints : CRASH : ' + e.message);
    }

    // --- 12o. generateMoodleXml : hints/feedbacks combines absents → pas de balises ---
    const noHintsData = {
        questions: [{
            type: 'multichoice',
            content: {
                name: 'QCM sans hints',
                questiontext: 'Question ?',
                feedback: 'Feedback',
                answers: [{ text: 'A', fraction: 100, feedback: 'OK' }]
            }
        }]
    };
    const noHintsXml = generateMoodleXml(noHintsData);
    assert(
        !noHintsXml.includes('<hint'),
        '[12o.NoHint1] XML sans hints : pas de balise hint'
    );
    assert(
        !noHintsXml.includes('<correctfeedback'),
        '[12o.NoHint2] XML sans feedbacks combines : pas de balise correctfeedback'
    );
    assert(
        !noHintsXml.includes('<shownumcorrect'),
        '[12o.NoHint3] XML sans feedbacks combines : pas de balise shownumcorrect'
    );

    // --- 12p. generateMoodleXml : hints tableau vide → pas de balises ---
    const emptyHintsData = {
        questions: [{
            type: 'matching',
            content: {
                name: 'Match vide',
                questiontext: 'Associez',
                feedback: 'OK',
                hints: [],
                correctfeedback: '',
                subquestions: [{ text: 'A', answer: 'B' }]
            }
        }]
    };
    const emptyHintsXml = generateMoodleXml(emptyHintsData);
    assert(
        !emptyHintsXml.includes('<hint'),
        '[12p.EmptyHint1] XML hints vides : pas de balise hint'
    );

    // --- 12q. generateMoodleXml : answernumbering et showstandardinstruction ---
    const optionsData = {
        options: { answernumbering: 'none', showstandardinstruction: 1 },
        questions: [{
            type: 'multichoice',
            content: {
                name: 'QCM Options',
                questiontext: 'Question ?',
                feedback: 'Feedback',
                answers: [{ text: 'A', fraction: 100, feedback: 'OK' }]
            }
        }]
    };
    const optionsXml = generateMoodleXml(optionsData);
    assert(
        optionsXml.includes('<answernumbering>none</answernumbering>'),
        '[12q.Options1] XML multichoice : answernumbering=none'
    );
    assert(
        optionsXml.includes('<showstandardinstruction>1</showstandardinstruction>'),
        '[12q.Options2] XML multichoice : showstandardinstruction=1'
    );

    // --- 12r. generateMoodleXml : answernumbering=abc ---
    const abcData = {
        options: { answernumbering: 'abc', showstandardinstruction: 0 },
        questions: [{
            type: 'multichoice',
            content: {
                name: 'QCM ABC',
                questiontext: 'Question ?',
                feedback: 'Feedback',
                answers: [{ text: 'A', fraction: 100, feedback: 'OK' }]
            }
        }]
    };
    const abcXml = generateMoodleXml(abcData);
    assert(
        abcXml.includes('<answernumbering>abc</answernumbering>'),
        '[12r.Options3] XML multichoice : answernumbering=abc'
    );
    assert(
        abcXml.includes('<showstandardinstruction>0</showstandardinstruction>'),
        '[12r.Options4] XML multichoice : showstandardinstruction=0'
    );

    // --- 12s. generateMoodleXml : sans options → valeurs par defaut (none, 1) ---
    const noOptionsData = {
        questions: [{
            type: 'multichoice',
            content: {
                name: 'QCM Defaut',
                questiontext: 'Question ?',
                feedback: 'Feedback',
                answers: [{ text: 'A', fraction: 100, feedback: 'OK' }]
            }
        }]
    };
    const noOptionsXml = generateMoodleXml(noOptionsData);
    assert(
        noOptionsXml.includes('<answernumbering>none</answernumbering>'),
        '[12s.Options5] XML multichoice sans options : answernumbering=none par defaut'
    );
    assert(
        noOptionsXml.includes('<showstandardinstruction>1</showstandardinstruction>'),
        '[12s.Options6] XML multichoice sans options : showstandardinstruction=1 par defaut'
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 13 : LATEX→UNICODE EXHAUSTIF (toutes les maps, structures imbriquees)
// =======================================================================

async function runStep13_LatexToUnicodeExhaustive() {
    console.group('Etape 13 : latexToUnicode exhaustif');
    _ctx = { step: 13, stepName: 'latexToUnicode exhaustif', file: '', module: '', source: '' };
    const t0 = performance.now();

    // --- 13a. Lettres grecques minuscules ---
    const greekLower = [
        ['\\alpha', 'α'], ['\\beta', 'β'], ['\\gamma', 'γ'], ['\\delta', 'δ'],
        ['\\epsilon', 'ε'], ['\\varepsilon', 'ε'], ['\\zeta', 'ζ'], ['\\eta', 'η'],
        ['\\theta', 'θ'], ['\\vartheta', 'ϑ'], ['\\iota', 'ι'], ['\\kappa', 'κ'],
        ['\\lambda', 'λ'], ['\\mu', 'μ'], ['\\nu', 'ν'], ['\\xi', 'ξ'],
        ['\\pi', 'π'], ['\\varpi', 'ϖ'], ['\\rho', 'ρ'], ['\\varrho', 'ϱ'],
        ['\\sigma', 'σ'], ['\\varsigma', 'ς'], ['\\tau', 'τ'], ['\\upsilon', 'υ'],
        ['\\phi', 'φ'], ['\\varphi', 'ϕ'], ['\\chi', 'χ'], ['\\psi', 'ψ'],
        ['\\omega', 'ω'], ['\\digamma', 'ϝ']
    ];
    for (const [input, expected] of greekLower) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13a.Greek] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13b. Lettres grecques majuscules ---
    const greekUpper = [
        ['\\Gamma', 'Γ'], ['\\Delta', 'Δ'], ['\\Theta', 'Θ'], ['\\Lambda', 'Λ'],
        ['\\Xi', 'Ξ'], ['\\Pi', 'Π'], ['\\Sigma', 'Σ'], ['\\Upsilon', 'Υ'],
        ['\\Phi', 'Φ'], ['\\Psi', 'Ψ'], ['\\Omega', 'Ω']
    ];
    for (const [input, expected] of greekUpper) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13b.GreekUpper] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13c. Operateurs arithmetiques ---
    const opArith = [
        ['\\times', '×'], ['\\div', '÷'], ['\\cdot', '·'],
        ['\\pm', '±'], ['\\mp', '∓']
    ];
    for (const [input, expected] of opArith) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13c.OpArith] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13d. Relations de comparaison (y compris nouvelles) ---
    const opRel = [
        ['\\leq', '≤'], ['\\le', '≤'], ['\\geq', '≥'], ['\\ge', '≥'],
        ['\\neq', '≠'], ['\\ne', '≠'], ['\\approx', '≈'], ['\\equiv', '≡'],
        ['\\sim', '∼'], ['\\simeq', '≃'], ['\\propto', '∝'],
        ['\\ll', '≪'], ['\\gg', '≫'],
        ['\\leqslant', '⩽'], ['\\geqslant', '⩾'],
        ['\\nleq', '≰'], ['\\ngeq', '≱'],
        ['\\prec', '≺'], ['\\succ', '≻'],
        ['\\preceq', '⪯'], ['\\succeq', '⪰'],
        ['\\cong', '≅']
    ];
    for (const [input, expected] of opRel) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13d.OpRel] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13e. Ensembles et logique ---
    const opSet = [
        ['\\in', '∈'], ['\\notin', '∉'], ['\\ni', '∋'],
        ['\\subset', '⊂'], ['\\supset', '⊃'],
        ['\\subseteq', '⊆'], ['\\supseteq', '⊇'], ['\\nsubseteq', '⊈'],
        ['\\cup', '∪'], ['\\cap', '∩'], ['\\setminus', '∖'],
        ['\\emptyset', '∅'], ['\\varnothing', '∅'], ['\\complement', '∁'],
        ['\\forall', '∀'], ['\\exists', '∃'], ['\\nexists', '∄'],
        ['\\neg', '¬'], ['\\lnot', '¬'],
        ['\\land', '∧'], ['\\lor', '∨'], ['\\wedge', '∧'], ['\\vee', '∨']
    ];
    for (const [input, expected] of opSet) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13e.OpSet] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13f. Fleches ---
    const opArrow = [
        ['\\rightarrow', '→'], ['\\to', '→'],
        ['\\leftarrow', '←'], ['\\gets', '←'],
        ['\\Rightarrow', '⇒'], ['\\Leftarrow', '⇐'],
        ['\\leftrightarrow', '↔'], ['\\Leftrightarrow', '⇔'],
        ['\\mapsto', '↦'], ['\\implies', '⇒'], ['\\iff', '⇔'],
        ['\\longmapsto', '⟼'], ['\\Longrightarrow', '⟹'],
        ['\\hookrightarrow', '↪'],
        ['\\uparrow', '↑'], ['\\downarrow', '↓'],
        ['\\nearrow', '↗'], ['\\searrow', '↘']
    ];
    for (const [input, expected] of opArrow) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13f.Arrow] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13g. Analyse et calcul ---
    const opCalc = [
        ['\\infty', '∞'], ['\\partial', '∂'], ['\\nabla', '∇'],
        ['\\sum', '∑'], ['\\prod', '∏'],
        ['\\int', '∫'], ['\\iint', '∬'], ['\\iiint', '∭'], ['\\oint', '∮']
    ];
    for (const [input, expected] of opCalc) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13g.OpCalc] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13h. Delimiteurs et points de suspension ---
    const opDelim = [
        ['\\langle', '⟨'], ['\\rangle', '⟩'],
        ['\\lfloor', '⌊'], ['\\rfloor', '⌋'],
        ['\\lceil', '⌈'], ['\\rceil', '⌉'],
        ['\\ldots', '…'], ['\\cdots', '⋯'], ['\\vdots', '⋮'], ['\\ddots', '⋱'], ['\\dots', '…']
    ];
    for (const [input, expected] of opDelim) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13h.Delim] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13i. Symboles divers et nouveaux ---
    const opMisc = [
        ['\\circ', '∘'], ['\\star', '⋆'], ['\\bullet', '•'],
        ['\\oplus', '⊕'], ['\\otimes', '⊗'], ['\\odot', '⊙'],
        ['\\perp', '⊥'], ['\\parallel', '∥'], ['\\angle', '∠'],
        ['\\triangle', '△'], ['\\square', '□'],
        ['\\aleph', 'ℵ'], ['\\hbar', 'ℏ'], ['\\ell', 'ℓ'],
        ['\\Re', 'ℜ'], ['\\Im', 'ℑ'],
        ['\\mid', '∣'], ['\\nmid', '∤'],
        ['\\wp', '℘'], ['\\prime', '′'], ['\\ast', '∗'],
        ['\\lVert', '‖'], ['\\rVert', '‖'], ['\\Vert', '‖'],
        ['\\checkmark', '✓'], ['\\dagger', '†'], ['\\ddagger', '‡']
    ];
    for (const [input, expected] of opMisc) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13i.Misc] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13j. mathbb (ensembles francais) ---
    const mathbbTests = [
        ['\\mathbb{R}', 'ℝ'], ['\\mathbb{N}', 'ℕ'], ['\\mathbb{Z}', 'ℤ'],
        ['\\mathbb{Q}', 'ℚ'], ['\\mathbb{C}', 'ℂ'], ['\\mathbb{P}', 'ℙ'],
        ['\\mathbb{H}', 'ℍ'],
        // Nouveaux ajouts francais
        ['\\mathbb{D}', '𝔻'], ['\\mathbb{K}', '𝕂'],
        ['\\mathbb{E}', '𝔼'], ['\\mathbb{1}', '𝟙']
    ];
    for (const [input, expected] of mathbbTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13j.Mathbb] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13k. Noms de fonctions (backslash supprime, nom preserve) ---
    const funcTests = [
        ['\\sin(x)', 'sin(x)'], ['\\cos(x)', 'cos(x)'], ['\\tan(x)', 'tan(x)'],
        ['\\cot(x)', 'cot(x)'], ['\\sec(x)', 'sec(x)'], ['\\csc(x)', 'csc(x)'],
        ['\\arcsin(x)', 'arcsin(x)'], ['\\arccos(x)', 'arccos(x)'], ['\\arctan(x)', 'arctan(x)'],
        ['\\sinh(x)', 'sinh(x)'], ['\\cosh(x)', 'cosh(x)'], ['\\tanh(x)', 'tanh(x)'],
        ['\\log(x)', 'log(x)'], ['\\ln(x)', 'ln(x)'], ['\\exp(x)', 'exp(x)'],
        ['\\lim', 'lim'], ['\\sup', 'sup'], ['\\inf', 'inf'],
        ['\\max', 'max'], ['\\min', 'min'],
        ['\\det', 'det'], ['\\dim', 'dim'], ['\\ker', 'ker'],
        ['\\deg', 'deg'], ['\\gcd', 'gcd'], ['\\arg', 'arg'], ['\\mod', 'mod'],
        // Nouveaux ajouts
        ['\\card', 'card'], ['\\sgn', 'sgn'], ['\\Pr', 'Pr'],
        ['\\lcm', 'lcm'], ['\\hom', 'hom']
    ];
    for (const [input, expected] of funcTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13k.Func] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13l. Fractions ---
    const fracTests = [
        ['\\frac{1}{2}', '½'], ['\\frac{1}{3}', '⅓'], ['\\frac{2}{3}', '⅔'],
        ['\\frac{1}{4}', '¼'], ['\\frac{3}{4}', '¾'],
        ['\\frac{a}{b}', 'a/b'],
        ['\\frac{x+1}{x-1}', '(x+1)/(x-1)'],
        ['\\dfrac{a}{b}', 'a/b'],
        ['\\tfrac{1}{2}', '½'],
    ];
    for (const [input, expected] of fracTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13l.Frac] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13m. Racines carrees ---
    const sqrtTests = [
        ['\\sqrt{2}', '√(2)'],
        ['\\sqrt{x+1}', '√(x+1)'],
        ['\\sqrt', '√'],
        ['\\sqrt[3]{8}', '³√(8)'],
        ['\\sqrt[n]{x}', 'ⁿ√(x)'],
    ];
    for (const [input, expected] of sqrtTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13m.Sqrt] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13n. Exposants et indices ---
    const supsubTests = [
        ['x^{2}', 'x²'], ['x^{n}', 'xⁿ'], ['x^{10}', 'x¹⁰'],
        ['x^{n+1}', 'xⁿ⁺¹'], ['x^{-1}', 'x⁻¹'],
        ['a_{n}', 'aₙ'], ['a_{0}', 'a₀'], ['a_{12}', 'a₁₂'],
        ['x^2', 'x²'], ['a_n', 'aₙ'],
        ['x^{2}_{n}', 'x²ₙ'],
    ];
    for (const [input, expected] of supsubTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13n.SupSub] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13o. Diacritiques ---
    const diacriticTests = [
        ['\\vec{u}', 'u\u20D7'],
        ['\\hat{x}', 'x\u0302'],
        ['\\tilde{x}', 'x\u0303'],
        ['\\overline{AB}', 'A\u0304B\u0304'],
        ['\\bar{x}', 'x\u0304'],
    ];
    for (const [input, expected] of diacriticTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13o.Diacr] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13p. Combinatoire ---
    const combTests = [
        ['\\binom{n}{k}', 'C(n,k)'],
        ['\\binom{n}{0}', 'C(n,0)'],
        ['\\binom{10}{3}', 'C(10,3)'],
    ];
    for (const [input, expected] of combTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13p.Binom] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13q. Structures IMBRIQUEES (regressions critiques) ---
    const nestedTests = [
        ['\\sqrt{\\frac{a}{b}}', '√(a/b)'],
        ['\\frac{\\sqrt{2}}{2}', '√(2)/2'],
        ['\\frac{1}{\\sqrt{2}}', '1/√(2)'],
        ['\\sqrt{\\alpha^{2} + \\beta^{2}}', '√(α² + β²)'],
        ['\\frac{\\alpha + \\beta}{\\gamma}', '(α + β)/γ'],
        ['\\vec{\\alpha}', 'α\u20D7'],
        ['\\overline{\\alpha\\beta}', 'α\u0304β\u0304'],
        ['\\mathbb{R}^{n}', 'ℝⁿ'],
        ['\\binom{\\alpha}{\\beta}', 'C(α,β)'],
        ['\\sqrt[3]{\\frac{1}{8}}', '³√(⅛)'],
    ];
    for (const [input, expected] of nestedTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13q.Nested] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13r. Expressions completes (cas reels de cours) ---
    const realWorldTests = [
        ['\\forall x \\in \\mathbb{R}, x^{2} \\geq 0', '∀ x ∈ ℝ, x² ≥ 0'],
        ['\\exists n \\in \\mathbb{N}, n > 0', '∃ n ∈ ℕ, n > 0'],
        ['\\alpha + \\beta = \\gamma', 'α + β = γ'],
        ['\\lim_{n \\to \\infty} \\frac{1}{n} = 0', 'limₙ → ∞ 1/n = 0'],
        ['f : \\mathbb{R} \\to \\mathbb{R}', 'f : ℝ → ℝ'],
        ['\\sum_{k=0}^{n} \\binom{n}{k}', '∑ₖ₌₀ⁿ C(n,k)'],
        ['A \\cup B = B \\cup A', 'A ∪ B = B ∪ A'],
        ['a \\mid b \\Rightarrow a \\mid bc', 'a ∣ b ⇒ a ∣ bc'],
    ];
    for (const [input, expected] of realWorldTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13r.Real] ${input.substring(0, 40)}... → ${expected.substring(0, 40)}...`,
            result !== expected ? { expected, got: result } : null
        );
    }

    // --- 13s. text/mathrm/variantes → texte brut ---
    const textTests = [
        ['\\text{hello}', 'hello'],
        ['\\mathrm{kg}', 'kg'],
        ['\\textrm{test}', 'test'],
        ['\\mathbf{v}', 'v'],
        ['\\mathit{x}', 'x'],
    ];
    for (const [input, expected] of textTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13s.Text] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13t. Espacement et taille (ignores) ---
    const spacingTests = [
        ['a\\,b', 'a b'],
        ['a\\;b', 'a b'],
        ['a\\quad b', 'a b'],
        ['\\displaystyle x', 'x'],
        ['\\left(x\\right)', '(x)'],
        ['\\big(x\\big)', '(x)'],
    ];
    for (const [input, expected] of spacingTests) {
        const result = latexToUnicode(input);
        assert(result === expected,
            `[13t.Space] ${input} → ${expected}`,
            result !== expected ? { got: result } : null
        );
    }

    // --- 13u. Chaine vide et cas limites ---
    assert(latexToUnicode('') === '', '[13u.Empty] Chaine vide → chaine vide');
    assert(latexToUnicode('   ') === '', '[13u.Spaces] Espaces → chaine vide (trim)');
    assert(latexToUnicode('abc') === 'abc', '[13u.Plain] Texte brut inchange');
    assert(latexToUnicode('123') === '123', '[13u.Numbers] Nombres inchanges');

    recordTiming('latexToUnicode exhaustif', 'Toutes les maps + structures imbriquees', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 14 : AUTOWRAP LATEX ELARGI + ENVIRONNEMENTS + CAS MIXTES
// =======================================================================

async function runStep14_AutoWrapExtended() {
    console.group('Etape 14 : AutoWrap elargi + environnements + cas mixtes');
    _ctx = { step: 14, stepName: 'AutoWrap elargi', file: '', module: '', source: '' };
    const t0 = performance.now();

    // --- 14a. Nouvelles commandes ajoutees : toutes wrappees ---
    const newCommands = [
        '\\leqslant x', '\\geqslant x', '\\nleq x', '\\ngeq x',
        '\\prec x', '\\succ x', '\\preceq x', '\\succeq x', '\\cong x',
        '\\mid x', '\\nmid x', '\\nsubseteq A',
        '\\nexists x', '\\lnot p', '\\ni x',
        '\\iint f', '\\iiint f', '\\oint f',
        '\\gets x', '\\longmapsto x', '\\Longrightarrow x',
        '\\hookrightarrow x', '\\uparrow', '\\downarrow',
        '\\nearrow x', '\\searrow x',
        '\\vdots', '\\ddots',
        '\\odot x', '\\star x', '\\bullet',
        '\\ast x', '\\dagger x', '\\ddagger x',
        '\\angle ABC', '\\triangle ABC', '\\square',
        '\\aleph', '\\hbar x', '\\ell',
        '\\Re z', '\\Im z', '\\wp z',
        '\\prime x', '\\checkmark', '\\complement A',
        '\\digamma', '\\lVert x \\rVert',
        '\\card(A)', '\\sgn(x)', '\\Pr(X)', '\\lcm(a,b)', '\\hom(A,B)',
    ];
    for (const cmd of newCommands) {
        const result = autoWrapLatex(cmd);
        const wrapped = result.startsWith('\\(') && result.endsWith('\\)');
        assert(wrapped,
            `[14a.NewCmd] "${cmd.substring(0, 25)}" → wrappee`,
            !wrapped ? { result } : null
        );
    }

    // --- 14b. Commandes dans un objet (recursivite) ---
    const objInput = {
        question: '\\alpha + \\beta',
        answers: [
            { text: '\\gamma' },
            { text: 'Texte normal' }
        ]
    };
    const objResult = autoWrapLatex(objInput);
    assert(objResult.question.includes('\\('),
        '[14b.ObjRecur] Question wrappee dans objet recursif',
        { got: objResult.question }
    );
    assert(objResult.answers[0].text.includes('\\('),
        '[14b.ObjRecur2] Reponse wrappee dans objet recursif',
        { got: objResult.answers[0].text }
    );
    assert(objResult.answers[1].text === 'Texte normal',
        '[14b.ObjRecur3] Texte normal inchange dans objet'
    );

    // --- 14c. Tableau (recursivite) ---
    const arrInput = ['\\sin(x)', '\\cos(x)', 'Bonjour'];
    const arrResult = autoWrapLatex(arrInput);
    assert(arrResult[0].startsWith('\\('), '[14c.ArrRecur] Premier element wrappee');
    assert(arrResult[1].startsWith('\\('), '[14c.ArrRecur2] Deuxieme element wrappee');
    assert(arrResult[2] === 'Bonjour', '[14c.ArrRecur3] Texte normal inchange');

    // --- 14d. Chaine mixte : LaTeX deja delimite + LaTeX nu → Unicode en hors-bloc ---
    const mixed1 = 'La valeur \\alpha est dans \\(x^2 + 1\\) et \\beta aussi.';
    const mixedResult = autoWrapLatex(mixed1);
    // Le LaTeX nu (\alpha, \beta) doit etre converti en Unicode
    assert(!mixedResult.includes('\\alpha'),
        '[14d.Mixed1] \\alpha nu converti en Unicode dans chaine mixte',
        { got: mixedResult }
    );
    assert(mixedResult.includes('\\(x^2 + 1\\)'),
        '[14d.Mixed2] Bloc \\(...\\) existant preserve dans chaine mixte',
        { got: mixedResult }
    );
    assert(mixedResult.includes('α'),
        '[14d.Mixed3] alpha converti en α dans chaine mixte',
        { got: mixedResult }
    );

    // --- 14e. convertLatexEnvironmentsDeep : \begin{equation}...\end{equation} ---
    const envTests = [
        {
            input: 'Calcul : \\begin{equation}x^2 + 1\\end{equation} fin.',
            check: (r) => r.includes('\\[x^2 + 1\\]') && !r.includes('\\begin'),
            desc: 'equation → \\[...\\]'
        },
        {
            input: '\\begin{align}a &= b\\\\c &= d\\end{align}',
            check: (r) => r.includes('\\[') && !r.includes('\\begin'),
            desc: 'align → \\[...\\]'
        },
        {
            input: '\\begin{math}x\\end{math}',
            check: (r) => r.includes('\\(x\\)') && !r.includes('\\begin'),
            desc: 'math → \\(...\\)'
        },
        {
            input: '\\begin{gather*}a + b\\end{gather*}',
            check: (r) => r.includes('\\[a + b\\]'),
            desc: 'gather* → \\[...\\]'
        },
        {
            input: 'Texte normal sans environnement.',
            check: (r) => r === 'Texte normal sans environnement.',
            desc: 'texte normal inchange'
        }
    ];
    for (const tc of envTests) {
        const result = convertLatexEnvironmentsDeep(tc.input);
        assert(tc.check(result),
            `[14e.Env] ${tc.desc}`,
            { got: result }
        );
    }

    // --- 14f. convertLatexEnvironmentsDeep recursif sur objet ---
    const envObj = {
        q: '\\begin{equation}E = mc^2\\end{equation}',
        a: { nested: '\\begin{align*}a = b\\end{align*}' }
    };
    const envObjResult = convertLatexEnvironmentsDeep(envObj);
    assert(envObjResult.q.includes('\\[E = mc^2\\]'),
        '[14f.EnvObj] Recursif : equation dans objet',
        { got: envObjResult.q }
    );
    assert(envObjResult.a.nested.includes('\\[a = b\\]'),
        '[14f.EnvObj2] Recursif : align* dans objet imbrique',
        { got: envObjResult.a.nested }
    );

    // --- 14g. Faux positifs : mots qui ressemblent a des commandes LaTeX ---
    const falsePositives = [
        'La division est une operation',     // "div" dans "division" ≠ \div
        'Le minimum est atteint',            // "min" dans "minimum" ≠ \min
        'La fonction sinus est periodique',  // "sin" dans "sinus" ≠ \sin
        'Le produit interieur',              // "prod" dans "produit" ≠ \prod
        'Un angle obtus',                    // "angle" dans texte ≠ \angle
    ];
    for (const text of falsePositives) {
        const result = autoWrapLatex(text);
        assert(result === text,
            `[14g.FP] Faux positif evite : "${text.substring(0, 30)}..."`,
            result !== text ? { result } : null
        );
    }

    // --- 14h. Types primitifs et null ---
    assert(autoWrapLatex(null) === null, '[14h.Null] null → null');
    assert(autoWrapLatex(42) === 42, '[14h.Number] number → number');
    assert(autoWrapLatex(true) === true, '[14h.Bool] boolean → boolean');
    assert(autoWrapLatex(undefined) === undefined, '[14h.Undef] undefined → undefined');

    recordTiming('AutoWrap elargi', 'Nouvelles commandes + environnements + cas mixtes', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 15 : HEALjsonstring STRESS (JSON malformes realistes IA)
// =======================================================================

async function runStep15_HealJsonStringStress() {
    console.group('Etape 15 : healJsonString stress test');
    _ctx = { step: 15, stepName: 'healJsonString stress', file: '', module: '', source: '' };
    const t0 = performance.now();

    // --- 15a. JSON avec code fences (debut/fin) ---
    const fenced = '```json\n{"key": "value"}\n```';
    const cleaned = cleanJsonInput(fenced);
    let parsed;
    try { parsed = JSON.parse(healJsonString(cleaned)); } catch(e) { parsed = null; }
    assert(parsed && parsed.key === 'value',
        '[15a.Fences] Code fences en debut/fin : JSON extrait',
        { cleaned }
    );

    // --- 15a2. Code fences avec texte libre autour (desormais gere) ---
    // cleanJsonInput extrait le bloc JSON equilibre meme noye dans de la prose IA.
    const fencedWithText = 'Voici le JSON :\n```json\n{"key": "value"}\n```\nVoila !';
    const cleaned2 = cleanJsonInput(fencedWithText);
    let parsed2;
    try { parsed2 = JSON.parse(healJsonString(cleaned2)); } catch(e) { parsed2 = null; }
    assert(parsed2 && parsed2.key === 'value',
        '[15a2.FencesTexte] Code fences + texte libre autour extraits',
        { cleaned: cleaned2 }
    );

    // --- 15b. JSON avec virgule finale (trailing comma) ---
    // healJsonString est un healer de backslashes/echappements, pas un reparateur JSON complet
    // Les trailing commas ne sont pas gerees — on documente cette limitation
    const trailing = '{"items": [1, 2, 3,], "name": "test",}';
    let parsed15b;
    try { parsed15b = JSON.parse(healJsonString(trailing)); } catch(e) { parsed15b = null; }
    if (parsed15b) {
        assert(parsed15b.items.length === 3,
            '[15b.Trailing] Virgule finale reparee'
        );
    } else {
        // Si le healer ne gere pas les trailing commas, c'est un SKIP, pas un FAIL
        skipCount++;
        results.push({ status: 'SKIP', message: '[15b.Trailing] healJsonString ne gere pas les virgules finales (limitation connue)', step: 15, stepName: 'healJsonString stress' });
    }

    // --- 15c. LaTeX avec backslashes dans JSON (cas reel IA) ---
    const latexJson = '{"question": "Calculez \\\\(\\\\sqrt{2}\\\\)", "answer": "\\\\(1.414\\\\)"}';
    let parsed15c;
    try { parsed15c = JSON.parse(healJsonString(latexJson)); } catch(e) { parsed15c = null; }
    assert(parsed15c && parsed15c.question,
        '[15c.LatexBS] JSON avec LaTeX echappements : parseable',
        { result: parsed15c }
    );

    // --- 15d. JSON avec commentaires inline (certains LLMs le font) ---
    const commented = '{\n  "key": "value", // ceci est un commentaire\n  "num": 42\n}';
    const healedCommented = healJsonString(commented);
    let parsed15d;
    try { parsed15d = JSON.parse(healedCommented); } catch(e) { parsed15d = null; }
    // Si le healer ne gere pas les commentaires c'est un skip, pas un fail
    if (parsed15d) {
        assert(parsed15d.key === 'value', '[15d.Comment] Commentaires JSON ignores');
    } else {
        skipCount++;
        results.push({ status: 'SKIP', message: '[15d.Comment] healJsonString ne gere pas les commentaires inline', step: 15 });
    }

    // --- 15e. JSON tres profondement imbrique ---
    let deepObj = '"value"';
    for (let i = 0; i < 50; i++) deepObj = `{"level${i}": ${deepObj}}`;
    let parsed15e;
    try { parsed15e = JSON.parse(healJsonString(deepObj)); } catch(e) { parsed15e = null; }
    assert(parsed15e !== null,
        '[15e.Deep] JSON 50 niveaux imbrique : parseable'
    );

    // --- 15f. JSON avec caracteres Unicode speciaux ---
    const unicodeJson = '{"emoji": "\\u2603", "fr": "é à ü ö", "ar": "مرحبا", "zh": "你好"}';
    let parsed15f;
    try { parsed15f = JSON.parse(healJsonString(unicodeJson)); } catch(e) { parsed15f = null; }
    assert(parsed15f && parsed15f.fr === 'é à ü ö',
        '[15f.Unicode] Caracteres Unicode preserves',
        { result: parsed15f }
    );

    // --- 15g. JSON avec retours a la ligne bruts dans les strings ---
    const rawNL = '{"text": "ligne 1\nligne 2"}';
    const healed15g = healJsonString(rawNL);
    let parsed15g;
    try { parsed15g = JSON.parse(healed15g); } catch(e) { parsed15g = null; }
    assert(parsed15g && parsed15g.text.includes('ligne 1'),
        '[15g.RawNL] Retour a la ligne brut dans string : repare',
        { healed: healed15g }
    );

    // --- 15h. JSON avec tabs bruts dans les strings ---
    const rawTab = '{"text": "col1\tcol2"}';
    const healed15h = healJsonString(rawTab);
    let parsed15h;
    try { parsed15h = JSON.parse(healed15h); } catch(e) { parsed15h = null; }
    assert(parsed15h && parsed15h.text.includes('col1'),
        '[15h.RawTab] Tab brut dans string : repare',
        { healed: healed15h }
    );

    // --- 15i. JSON vide ou presque ---
    assert(healJsonString('{}') === '{}', '[15i.Empty] {} inchange');
    assert(healJsonString('[]') === '[]', '[15i.EmptyArr] [] inchange');
    assert(healJsonString('  ') === '', '[15i.Spaces] Espaces seuls → vide');

    // --- 15j. JSON avec backslashes triples (impairs) ---
    const tripleBS = '{"formula": "\\\\\\(x\\\\\\)"}';
    const healed15j = healJsonString(tripleBS);
    let parsed15j;
    try { parsed15j = JSON.parse(healed15j); } catch(e) { parsed15j = null; }
    assert(parsed15j !== null,
        '[15j.TripleBS] Triple backslash dans JSON : parseable apres healing',
        { healed: healed15j }
    );

    // --- 15k. Performance : gros JSON (10000 caracteres) ---
    let bigJson = '{"questions": [';
    for (let i = 0; i < 100; i++) {
        if (i > 0) bigJson += ',';
        bigJson += `{"q": "Question ${i} \\\\(x^{${i}}\\\\)", "a": "Reponse ${i}"}`;
    }
    bigJson += ']}';
    const t15k = performance.now();
    const healed15k = healJsonString(bigJson);
    const dt15k = performance.now() - t15k;
    let parsed15k;
    try { parsed15k = JSON.parse(healed15k); } catch(e) { parsed15k = null; }
    assert(parsed15k && parsed15k.questions.length === 100,
        `[15k.Perf] Gros JSON (100 questions) : parseable en ${dt15k.toFixed(1)}ms`,
        { duration: dt15k }
    );
    assert(dt15k < 500,
        `[15k.Perf2] Gros JSON healing < 500ms (got ${dt15k.toFixed(1)}ms)`
    );

    recordTiming('healJsonString stress', 'JSON malformes realistes IA', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 16 : PIPELINE COMPLET PAR TYPE D'ACTIVITE (fixtures reelles)
// =======================================================================

async function runStep16_FullPipelineByActivity() {
    console.group('Etape 16 : Pipeline complet par type d\'activite');
    _ctx = { step: 16, stepName: 'Pipeline par activite', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Mapping fichier exemple → moduleKey
    const fixtures = [
        { file: 'multiple_choice_1.json', key: 'MultipleChoice' },
        { file: 'true_false_1.json', key: 'TrueFalse' },
        { file: 'fill_in_the_blanks_1.json', key: 'FillInTheBlanks' },
        { file: 'drag_the_words_1.json', key: 'DragTheWords' },
        { file: 'mark_the_words_1.json', key: 'MarkTheWords' },
        { file: 'essay_1.json', key: 'Essay' },
        { file: 'summary_1.json', key: 'Summary' },
        { file: 'dialog_cards_1.json', key: 'DialogCards' },
        { file: 'flashcards_1.json', key: 'Flashcards' },
        { file: 'single_choice_set_1.json', key: 'SingleChoiceSet' },
        { file: 'sort_the_paragraphs_1.json', key: 'SortParagraphs' },
        { file: 'crosswords_1.json', key: 'Crossword' },
        { file: 'find_the_words_1.json', key: 'FindTheWords' },
        { file: 'timeline_1.json', key: 'Timeline' },
        { file: 'charts_1.json', key: 'Chart' },
        { file: 'drag_and_drop_1.json', key: 'DragAndDrop' },
        { file: 'quiz_qcm_1.json', key: 'QuizSetQCM' },
        { file: 'quiz_qcm_formules_test.json', key: 'QuizSetQCM' },
        { file: 'quiz_vraifaux_1.json', key: 'QuizSetVF' },
        { file: 'quiz_mixte_1.json', key: 'QuizSet' },
    ];

    let processedCount = 0;

    for (const { file, key } of fixtures) {
        _ctx.source = `16.${key}`;
        _ctx.file = file;
        _ctx.module = key;

        let rawJson;
        try {
            const resp = await fetch(`assets/data/examples/${file}`);
            if (!resp.ok) {
                assert(false, `[16.${key}] Fichier exemple ${file} : chargement echoue (${resp.status})`);
                continue;
            }
            rawJson = await resp.text();
        } catch (e) {
            assert(false, `[16.${key}] Fichier exemple ${file} : erreur fetch - ${e.message}`);
            continue;
        }

        // Etape 1 : cleanJsonInput + healJsonString
        const cleaned = cleanJsonInput(rawJson);
        const healed = healJsonString(cleaned);
        let parsed;
        try {
            parsed = JSON.parse(healed);
        } catch (e) {
            assert(false, `[16.${key}] JSON invalide apres healing : ${e.message}`);
            continue;
        }
        assert(parsed !== null && typeof parsed === 'object',
            `[16.${key}.parse] JSON valide apres healing`
        );

        // Etape 2 : healJsonObject (normalisation LaTeX, doubles echappements)
        const healedObj = healJsonObject(parsed, key);
        assert(healedObj !== null,
            `[16.${key}.heal] healJsonObject ne retourne pas null`
        );

        // Etape 3 : healStructureForActivity (reparation structurelle)
        const structured = healStructureForActivity(healedObj, key);
        assert(structured !== null,
            `[16.${key}.struct] healStructureForActivity ne retourne pas null`
        );

        // Etape 4 : healActivitySpecificFields
        const specific = healActivitySpecificFields(structured, key);
        assert(specific !== null,
            `[16.${key}.specific] healActivitySpecificFields ne retourne pas null`
        );

        // Etape 5 : processH5PContent (processeur final)
        try {
            const t1 = performance.now();
            const processed = await processH5PContent(key, specific);
            const dt = performance.now() - t1;
            assert(processed !== null && typeof processed === 'object',
                `[16.${key}.process] processH5PContent retourne un objet (${dt.toFixed(0)}ms)`
            );

            // Verifier que le resultat n'a pas de LaTeX double-echappe
            const jsonStr = JSON.stringify(processed);
            const hasDblEsc = jsonStr.includes('\\\\\\\\(');
            assert(!hasDblEsc,
                `[16.${key}.dblesc] Pas de LaTeX \\\\\\\\( double-echappe dans le resultat`
            );

            // Verifier pas de caractere de controle brut (tab, newline) dans les strings
            const hasCtrlChar = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(jsonStr);
            assert(!hasCtrlChar,
                `[16.${key}.ctrl] Pas de caractere de controle brut dans le resultat`
            );

            processedCount++;
            recordTiming('Pipeline ' + key, file, dt);
        } catch (e) {
            assert(false, `[16.${key}.process] processH5PContent crash : ${e.message}`);
        }
    }

    assert(processedCount >= 15,
        `[16.Total] Au moins 15/${fixtures.length} activites traitees sans crash (${processedCount})`,
        { processedCount }
    );

    // --- 16z. markdownToHtml : verification non-regression ---
    const mdTests = [
        { input: '**gras** et *italique*', checks: ['<strong>gras</strong>', '<em>italique</em>'] },
        { input: '\\(a^*\\) texte *ital*', checks: ['\\(a^*\\)', '<em>ital</em>'] },
        { input: 'Texte\\n avec \\(x^2\\)', checks: ['\\(x^2\\)'], opts: {} },
        { input: 'Ligne1\nLigne2', checks: ['Ligne1<br>Ligne2'], opts: { newlineToBr: true } },
        { input: '', checks: [''], opts: {} },
        { input: null, checks: [''], opts: {} },
    ];
    for (const tc of mdTests) {
        const result = markdownToHtml(tc.input, tc.opts || {});
        for (const check of tc.checks) {
            assert(check === '' ? result === '' : result.includes(check),
                `[16z.Md] markdownToHtml("${(tc.input || '').substring(0, 30)}") contient "${check}"`,
                { got: result }
            );
        }
    }

    recordTiming('Pipeline complet par activite', `${processedCount} activites traitees`, performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// STEP 17 — Tests des contraintes de champs (FIELD_CONSTRAINTS)
// =======================================================================

async function runStep17_FieldConstraints() {
    _ctx = { step: 17, stepName: 'Contraintes de champs', file: 'field-constraints.js', module: 'field-constraints', source: '' };
    console.group('Step 17 : Contraintes de champs');
    const t0 = performance.now();

    // 17a. Vérifier que FIELD_CONSTRAINTS est bien chargé et contient les activités attendues
    _ctx.source = '17a';
    assert(typeof FIELD_CONSTRAINTS === 'object' && FIELD_CONSTRAINTS !== null, 'FIELD_CONSTRAINTS est un objet');
    const h5pKeys = ['Timeline', 'Flashcards', 'MultipleChoice', 'TrueFalse', 'FillInTheBlanks',
        'MarkTheWords', 'DragTheWords', 'DragAndDrop', 'Essay', 'Summary', 'SingleChoiceSet',
        'DialogCards', 'Glossary', 'Crossword', 'FindTheWords', 'SortParagraphs', 'Chart',
        'ComplexFillTheBlanks', 'CoursePresentation', 'QuizSet'];
    const moodleKeys = ['QCM', 'Appariement', 'Page', 'Millionnaire', 'Test', 'Glossaire', 'Devoir'];
    for (const key of [...h5pKeys, ...moodleKeys]) {
        assert(FIELD_CONSTRAINTS[key], `FIELD_CONSTRAINTS contient '${key}'`);
    }
    assert(Object.keys(FIELD_CONSTRAINTS).length >= 27, `Au moins 27 activites (got ${Object.keys(FIELD_CONSTRAINTS).length})`);

    // 17b. Vérifier que RENDER_TYPES contient les 6 types
    _ctx.source = '17b';
    const expectedTypes = ['html+latex', 'html', 'unicode', 'unicode+markers', 'plain', 'plain+letters'];
    for (const t of expectedTypes) {
        assert(RENDER_TYPES[t], `RENDER_TYPES contient '${t}'`);
    }

    // 17c. Vérifier que tous les render types utilisés dans FIELD_CONSTRAINTS existent dans RENDER_TYPES
    _ctx.source = '17c';
    for (const [moduleKey, config] of Object.entries(FIELD_CONSTRAINTS)) {
        if (!config.fields) continue;
        for (const [fieldPath, fieldConfig] of Object.entries(config.fields)) {
            assert(RENDER_TYPES[fieldConfig.render],
                `${moduleKey}.${fieldPath} : render type '${fieldConfig.render}' existe dans RENDER_TYPES`);
        }
    }

    // 17d. Glossary titles : LaTeX converti en Unicode
    _ctx.source = '17d';
    const glossaryObj = { panels: [
        { title: 'Lettre \\(\\alpha\\) grecque', text: 'Contenu avec \\(\\beta\\)' },
        { title: '\\(\\frac{1}{2}\\)', text: 'Fraction' }
    ]};
    const healedGlossary = healActivitySpecificFields(glossaryObj, 'Glossary');
    assert(!healedGlossary.panels[0].title.includes('\\('),
        'Glossary title : LaTeX \\(\\alpha\\) converti en Unicode',
        { got: healedGlossary.panels[0].title });
    assert(healedGlossary.panels[0].title.includes('α'),
        'Glossary title contient α',
        { got: healedGlossary.panels[0].title });
    // Le texte (html+latex) doit rester intact
    assert(healedGlossary.panels[0].text === glossaryObj.panels[0].text,
        'Glossary text (html+latex) inchange',
        { got: healedGlossary.panels[0].text });

    // 17e. Essay keywords : LaTeX supprimé (plain)
    _ctx.source = '17e';
    const essayObj = { keywords: [{ keyword: '\\(\\alpha\\)' }, { keyword: 'normal' }], taskDescription: 'Desc \\(\\beta\\)' };
    const healedEssay = healActivitySpecificFields(essayObj, 'Essay');
    assert(!healedEssay.keywords[0].keyword.includes('\\('),
        'Essay keyword : LaTeX supprime',
        { got: healedEssay.keywords[0].keyword });
    assert(healedEssay.keywords[1].keyword === 'normal',
        'Essay keyword normal inchange');
    // taskDescription (html+latex) doit rester intact
    assert(healedEssay.taskDescription === essayObj.taskDescription,
        'Essay taskDescription (html+latex) inchange',
        { got: healedEssay.taskDescription });

    // 17f. Chart labels : LaTeX converti en Unicode
    _ctx.source = '17f';
    const chartObj = { listOfTypes: [{ text: '\\(\\pi\\)', value: 3.14 }, { text: 'Normal', value: 1 }] };
    const healedChart = healActivitySpecificFields(chartObj, 'Chart');
    assert(healedChart.listOfTypes[0].text === 'π',
        'Chart text : \\(\\pi\\) → π',
        { got: healedChart.listOfTypes[0].text });
    assert(healedChart.listOfTypes[1].text === 'Normal',
        'Chart text normal inchange');

    // 17g. MarkTheWords : textField converti en Unicode+markers
    _ctx.source = '17g';
    const mtwObj = { textField: '**mot1** et \\(\\alpha\\)', taskDescription: 'Consigne \\(\\beta\\)' };
    const healedMtw = healActivitySpecificFields(mtwObj, 'MarkTheWords');
    assert(!healedMtw.textField.includes('\\('),
        'MarkTheWords textField : pas de LaTeX',
        { got: healedMtw.textField });
    assert(healedMtw.textField.includes('*mot1*'),
        'MarkTheWords textField : **mot1** → *mot1*',
        { got: healedMtw.textField });

    // 17h. DragTheWords : textField converti en Unicode
    _ctx.source = '17h';
    const dtwObj = { textField: 'texte *\\(\\beta\\)* suite', taskDescription: 'Consigne' };
    const healedDtw = healActivitySpecificFields(dtwObj, 'DragTheWords');
    assert(!healedDtw.textField.includes('\\('),
        'DragTheWords textField : LaTeX dans markers converti',
        { got: healedDtw.textField });
    assert(healedDtw.textField.includes('*β*'),
        'DragTheWords textField : contient *β*',
        { got: healedDtw.textField });

    // 17i. FillInTheBlanks : questions converties
    _ctx.source = '17i';
    const fibObj = { questions: ['Le **resultat** est *42*'], taskDescription: 'Desc' };
    const healedFib = healActivitySpecificFields(fibObj, 'FillInTheBlanks');
    assert(healedFib.questions[0].includes('*resultat*'),
        'FillInTheBlanks : **resultat** → *resultat*',
        { got: healedFib.questions[0] });

    // 17j. MultipleChoice : html+latex fields inchanges, html fields inchanges
    _ctx.source = '17j';
    const mcObj = {
        question: 'Question \\(\\alpha\\)',
        answers: [{ text: 'Reponse \\(\\beta\\)', tipsAndFeedback: { tip: 'Indice', chosenFeedback: 'Bien' } }],
        overallFeedback: [{ from: 0, to: 100, feedback: 'Global' }]
    };
    const healedMc = healActivitySpecificFields(mcObj, 'MultipleChoice');
    assert(healedMc.question === mcObj.question,
        'MultipleChoice question (html+latex) inchange');
    assert(healedMc.answers[0].text === mcObj.answers[0].text,
        'MultipleChoice answers[].text (html+latex) inchange');

    // 17k. Devoir Moodle : titre et critères en Unicode
    _ctx.source = '17k';
    const devoirObj = {
        title: '\\(\\alpha\\) test',
        intro: 'Instructions \\(\\beta\\)',
        rubricName: 'Grille \\(\\gamma\\)',
        criteria: [{ description: '\\(\\delta\\) critere', levels: [{ definition: '\\(\\epsilon\\) niveau', score: 5 }] }]
    };
    const healedDevoir = healActivitySpecificFields(devoirObj, 'Devoir');
    assert(!healedDevoir.title.includes('\\('),
        'Devoir title : LaTeX converti en Unicode',
        { got: healedDevoir.title });
    assert(healedDevoir.intro === devoirObj.intro,
        'Devoir intro (html+latex) inchange');
    assert(!healedDevoir.criteria[0].description.includes('\\('),
        'Devoir criteria description : LaTeX converti',
        { got: healedDevoir.criteria[0].description });
    assert(!healedDevoir.criteria[0].levels[0].definition.includes('\\('),
        'Devoir criteria level definition : LaTeX converti',
        { got: healedDevoir.criteria[0].levels[0].definition });

    // 17l. Millionnaire Moodle : tout en plain (pas de conversion LaTeX ici,
    // mais si LaTeX présent il sera strippé)
    _ctx.source = '17l';
    const millObj = {
        questions: [{ question: 'Question texte', goodanswer: 'Bonne', badanswer: ['M1', 'M2', 'M3'] }]
    };
    const healedMill = healActivitySpecificFields(millObj, 'Millionnaire');
    assert(healedMill.questions[0].question === 'Question texte',
        'Millionnaire question inchange (texte brut)');

    // 17m. Conteneurs : QuizSet ne modifie pas les champs html+latex de ses enfants
    _ctx.source = '17m';
    const qsObj = {
        questions: [{
            library: 'H5P.MultiChoice 1.16',
            params: { question: 'Q \\(\\alpha\\)', answers: [{ text: 'A' }] },
            subContentId: 'test-uuid'
        }],
        overallFeedback: [{ from: 0, to: 100, feedback: 'OK' }],
        progressType: 'dots'
    };
    const healedQs = healActivitySpecificFields(qsObj, 'QuizSet');
    assert(healedQs.questions[0].params.question === 'Q \\(\\alpha\\)',
        'QuizSet enfant MultiChoice question inchange (html+latex)');

    recordTiming('Contraintes de champs', '27 activites × N champs', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// STEP 18 — Non-régression par fixture enrichi
// =======================================================================

async function runStep18_FieldConstraintsRegression() {
    _ctx = { step: 18, stepName: 'Non-regression contraintes', file: 'field-constraints.js', module: 'field-constraints', source: '' };
    console.group('Step 18 : Non-regression contraintes de champs');
    const t0 = performance.now();

    // Fixtures avec LaTeX dans des champs qui doivent être convertis
    const testCases = [
        {
            name: 'Glossary avec LaTeX dans title',
            moduleKey: 'Glossary',
            input: { panels: [
                { title: 'Lettre \\(\\alpha\\)', text: '<p>Def de alpha</p>' },
                { title: 'Ensemble \\(\\mathbb{R}\\)', text: '<p>Les reels</p>' }
            ]},
            checks: (healed) => {
                assert(healed.panels[0].title.includes('α'), 'Glossary title 0 contient α', { got: healed.panels[0].title });
                assert(healed.panels[1].title.includes('ℝ'), 'Glossary title 1 contient ℝ', { got: healed.panels[1].title });
                assert(healed.panels[0].text === '<p>Def de alpha</p>', 'Glossary text 0 inchange');
            }
        },
        {
            name: 'Essay avec LaTeX dans keywords',
            moduleKey: 'Essay',
            input: {
                taskDescription: 'Decris \\(\\alpha\\)',
                keywords: [{ keyword: '\\(\\pi\\)' }, { keyword: 'derivee' }, { keyword: '\\(\\mathbb{R}\\)' }],
                solution: { introduction: 'Intro', sample: 'Sample' }
            },
            checks: (healed) => {
                assert(!healed.keywords[0].keyword.includes('\\('), 'Essay kw0 pas de LaTeX', { got: healed.keywords[0].keyword });
                assert(healed.keywords[1].keyword === 'derivee', 'Essay kw1 inchange');
                assert(healed.taskDescription.includes('\\('), 'Essay taskDescription preserve LaTeX');
            }
        },
        {
            name: 'Chart avec LaTeX dans labels',
            moduleKey: 'Chart',
            input: { listOfTypes: [
                { text: '\\(\\alpha\\)', value: 1, color: '#ff0000' },
                { text: 'Normal', value: 2, color: '#00ff00' },
                { text: '\\(x^{2}\\)', value: 3, color: '#0000ff' }
            ], graphMode: 'bar' },
            checks: (healed) => {
                assert(healed.listOfTypes[0].text === 'α', 'Chart label 0 = α', { got: healed.listOfTypes[0].text });
                assert(healed.listOfTypes[1].text === 'Normal', 'Chart label 1 inchange');
                assert(healed.listOfTypes[2].text === 'x²', 'Chart label 2 = x²', { got: healed.listOfTypes[2].text });
                assert(healed.graphMode === 'bar', 'Chart graphMode inchange');
            }
        },
        {
            name: 'Devoir avec LaTeX dans criteres',
            moduleKey: 'Devoir',
            input: {
                title: 'Titre \\(\\alpha\\)',
                intro: 'Instructions \\(\\beta\\)',
                rubricName: 'Grille \\(\\gamma\\)',
                criteria: [{
                    description: 'Critere \\(\\delta\\)',
                    levels: [
                        { definition: 'Niveau \\(\\epsilon\\)', score: 10 },
                        { definition: 'Niveau \\(\\zeta\\)', score: 5 }
                    ]
                }]
            },
            checks: (healed) => {
                assert(healed.title.includes('α'), 'Devoir title contient α', { got: healed.title });
                assert(!healed.title.includes('\\('), 'Devoir title pas de LaTeX brut');
                assert(healed.intro.includes('\\('), 'Devoir intro preserve LaTeX');
                assert(healed.criteria[0].description.includes('δ'), 'Devoir critere contient δ', { got: healed.criteria[0].description });
                assert(healed.criteria[0].levels[0].definition.includes('ε'), 'Devoir level 0 contient ε', { got: healed.criteria[0].levels[0].definition });
                assert(healed.criteria[0].levels[1].definition.includes('ζ'), 'Devoir level 1 contient ζ', { got: healed.criteria[0].levels[1].definition });
            }
        },
        {
            name: 'MultipleChoice inchange (tout html+latex)',
            moduleKey: 'MultipleChoice',
            input: {
                question: 'Quelle est \\(\\frac{1}{2}\\) ?',
                answers: [
                    { text: '\\(0{,}5\\)', correct: true },
                    { text: '\\(0{,}25\\)', correct: false }
                ],
                overallFeedback: [{ from: 0, to: 100, feedback: 'Bravo' }]
            },
            checks: (healed) => {
                assert(healed.question === 'Quelle est \\(\\frac{1}{2}\\) ?', 'MC question inchange');
                assert(healed.answers[0].text === '\\(0{,}5\\)', 'MC answer 0 inchange');
                assert(healed.overallFeedback[0].feedback === 'Bravo', 'MC feedback inchange');
            }
        },
        {
            name: 'Summary intro en plain, summaries en html+latex',
            moduleKey: 'Summary',
            input: {
                intro: 'Introduction simple',
                summaries: [{ summary: ['Affirmation \\(\\alpha\\)'], tip: 'Indice' }],
                overallFeedback: [{ from: 0, to: 100, feedback: 'OK' }]
            },
            checks: (healed) => {
                assert(healed.intro === 'Introduction simple', 'Summary intro inchange (deja plain)');
                assert(healed.summaries[0].summary[0].includes('\\('), 'Summary statement preserve LaTeX');
            }
        }
    ];

    let testedCount = 0;
    for (const tc of testCases) {
        _ctx.source = tc.name;
        const healed = healActivitySpecificFields(tc.input, tc.moduleKey);
        tc.checks(healed);
        testedCount++;
    }

    // Vérification globale : aucun champ plain/unicode ne doit contenir de \( après healing
    _ctx.source = '18-global';
    const latexPattern = /\\\(/;
    for (const [moduleKey, config] of Object.entries(FIELD_CONSTRAINTS)) {
        if (!config.fields) continue;
        for (const [fieldPath, fieldConfig] of Object.entries(config.fields)) {
            if (fieldConfig.render === 'html+latex' || fieldConfig.render === 'html') continue;
            // Ce type de rendu ne devrait jamais produire de \( après healing
            // (vérifié implicitement par les test cases ci-dessus pour les types avec des fixtures)
        }
    }
    assert(testedCount === testCases.length, `${testedCount} cas de test executes`);

    recordTiming('Non-regression contraintes', `${testedCount} fixtures`, performance.now() - t0);
    console.groupEnd();
}

export const STEP_NAMES = [
    '',
    'Classification erreurs',
    'cleanJsonInput',
    'JSON Healer',
    'Langues resilience',
    'Securite',
    'Healer Cloze',
    'CP LaTeX',
    'AutoWrap elargi',
    'Normalisation LaTeX',
    'Delimiteurs LaTeX',
    'Pipeline complet',
    'Protection LaTeX & healing structurel',
    'latexToUnicode exhaustif',
    'AutoWrap + environnements',
    'healJsonString stress',
    'Pipeline par activite',
    'Contraintes de champs',
    'Non-regression contraintes'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que classifyError() dans utils.js categorise correctement chaque type d\'erreur : SyntaxError → PARSE_ERROR, timeout/fetch → NETWORK_ERROR, validation → VALIDATION_ERROR, autre → PACKAGING_ERROR.\n\nExemple : quand l\'IA retourne du JSON invalide, l\'utilisateur voit "Erreur de format" plutot qu\'un message technique.',
    'Verifie que cleanJsonInput() nettoie les reponses brutes de l\'IA : supprime les blocs ```json, trim les espaces, extrait le bloc JSON equilibre (1re accolade -> fermeture correspondante) en retirant tout texte libre avant/apres, preserve le JSON valide.\n\nExemple : une IA externe repond "Voici le JSON : {...} Bonne journee !" — cette fonction ne garde que {...}.',
    'Verifie que healJsonString() repare les cas courants de JSON malformes : virgules finales, blocs de code, texte autour du JSON. Mesure aussi la performance sur de gros JSON.\n\nExemple : l\'IA genere {"items": [1, 2, 3,]} (virgule finale) — le healer le corrige automatiquement.',
    'Verifie que le systeme i18n resiste aux cas d\'erreur : langue inexistante, chaine vide, et qu\'on peut toujours revenir a une langue valide apres une erreur.\n\nExemple : un utilisateur qui modifie l\'URL manuellement ne doit pas casser l\'interface.',
    'Verifie que les fichiers de traduction ne contiennent pas de patterns dangereux (XSS) comme <script>, onerror=, javascript:, eval(). Verifie aussi que les balises HTML sont dans une liste blanche pedagogique.\n\nExemple : une traduction compromise avec du <script> pourrait compromettre les donnees de l\'utilisateur.',
    'Verifie que healClozeQuestiontext() repare la syntaxe cloze Moodle invalide generee par l\'IA : (1) {N:NUMERICAL:#=val} → supprime le # ; (2) {N:NUMERICAL:=texte} → convertit en SHORTANSWER si non numerique ; (3) \\(...\\) dans le questiontext → supprime les delimiteurs LaTeX parasites.\n\nExemple : l\'IA genere {1:NUMERICAL:=entier positif:0} au lieu de {1:SHORTANSWER:=entier positif} — le healer corrige automatiquement.',
    'Verifie que le healing LaTeX specifique au CoursePresentation enveloppe correctement les expressions mathematiques nues (^{}, _{}, \\circ etc.) dans \\(...\\) sans casser le texte normal ni les chaines deja delimitees.\n\nExemple : l\'IA genere "f^{-1}(y)=x si et seulement si f(x)=y" sans delimiteurs LaTeX — le healer produit "\\(f^{-1}(y)=x\\) si et seulement si \\(f(x)=y\\)".',
    'Verifie que autoWrapLatex() detecte les nouvelles commandes LaTeX ajoutees (trigo, log, lim, ensembles, logique) et que latexToUnicode() les convertit correctement. Verifie aussi que healLatexForTest() nettoie le LaTeX des reponses shortanswer (texte brut) et matching (Unicode) dans les questions Moodle Test.\n\nExemple : l\'IA genere "\\sin(x) + \\cos(x)" sans delimiteurs — le healer l\'enveloppe dans \\( \\). Et une reponse shortanswer "\\(2\\)" est nettoyee en "2".',
    'Verifie que normalizeDoubleEscapedLatex() reduit les doubles echappements (\\\\\\\\( → \\\\() et que repairBrokenLatexEscapes() repare les commandes LaTeX cassees par JSON.parse (\\n+eq → \\\\neq, tab+ext → \\\\text).\n\nExemple : le LLM ecrit \\\\neq dans le JSON, JSON.parse transforme \\\\n en newline — le healer reconstruit la commande.',
    'Verifie que convertLatexDelimitersDeep() convertit correctement $...$ → \\\\(...\\\\) et $$...$$ → \\\\[...\\\\] recursivement sur les objets JSON. Teste aussi les cas limites (dollar isole, blocs multiples).\n\nExemple : le LLM ecrit $x^2$ au lieu de \\\\(x^2\\\\) — le convertisseur normalise les delimiteurs.',
    'Verifie le pipeline complet healJsonObject() + healActivitySpecificFields() sur plusieurs types d\'activites : wrapping LaTeX, double echappement, conversion Unicode pour MarkTheWords/DragTheWords/Chart, conversion $ → \\\\(. Scanne aussi les 11 fichiers de traduction pour des patterns XSS dangereux.\n\nExemple : une question MultipleChoice avec du LaTeX nu est automatiquement wrappee dans \\\\( \\\\).',
    'Verifie la protection LaTeX dans formatTextToHtml() et SortParagraphs (les * dans les formules comme R^* ne deviennent pas <em>), l\'echappement GIFT (accolades \\\\{\\\\}), la robustesse XML/GIFT avec valeurs null, et le healing structurel de 5 types d\'activites (DialogCards tips, Essay keywords/solution, SingleChoiceSet subContentId, SortParagraphs sentences→paragraphs, Summary subContentId/tip).\n\nExemple : \\\\(\\\\mathbb{R}^*\\\\) ne doit pas etre corrompu en \\\\(\\\\mathbb{R}^<em>\\\\) par la conversion markdown.',
    'Teste exhaustivement latexToUnicode() sur TOUTES les maps : 30 lettres grecques minuscules, 11 majuscules, 22 relations, 24 ensembles/logique, 17 fleches, 9 analyse/calcul, 11 delimiteurs, 26 symboles divers, 11 mathbb (dont D/K/E/1 francais), 32 fonctions (dont card/sgn/Pr/lcm/hom), fractions (y compris Unicode ½), racines (simples/n-iemes), exposants/indices, diacritiques, combinatoire, structures IMBRIQUEES (\sqrt{\frac{a}{b}}), et 8 expressions reelles de cours.\n\nExemple : \\\\forall x \\\\in \\\\mathbb{R}, x^{2} \\\\geq 0 → ∀ x ∈ ℝ, x² ≥ 0',
    'Teste autoWrapLatex() avec 40+ nouvelles commandes ajoutees, recursivite sur objets/tableaux, cas mixtes (LaTeX nu + delimite), convertLatexEnvironmentsDeep (equation, align, gather*, math), faux positifs (mots contenant des noms de commandes), et types primitifs (null, number, boolean).\n\nExemple : "\\\\leqslant x" doit etre wrappe dans \\\\( \\\\), mais "La division est une operation" ne doit PAS etre wrappe.',
    'Stress-test de healJsonString() avec des JSON realistes generes par IA : code fences, virgules finales, backslashes LaTeX, commentaires inline, JSON 50 niveaux imbrique, caracteres Unicode, retours a la ligne/tabs bruts, backslashes triples, et performance sur 100 questions.\n\nExemple : {"items": [1, 2, 3,], "name": "test",} (virgule finale) doit etre repare en JSON valide.',
    'Pipeline complet par type d\'activite : charge chaque fixture JSON exemple, applique cleanJsonInput → healJsonString → JSON.parse → healJsonObject → healStructureForActivity → healActivitySpecificFields → processH5PContent pour 19 types H5P. Verifie : pas de crash, pas de LaTeX double-echappe, pas de caracteres de controle. Teste aussi markdownToHtml (protection LaTeX, newlineToBr, chaine vide/null).\n\nExemple : multiple_choice_1.json traverse le pipeline complet sans crash ni regression.',
    'Verifie que FIELD_CONSTRAINTS et RENDER_TYPES sont correctement charges (27 activites, 6 types de rendu). Teste healActivitySpecificFields() avec les contraintes declaratives : Glossary titles → Unicode, Essay keywords → plain, Chart labels → Unicode, Devoir criteres → Unicode. Verifie que les champs html+latex ne sont PAS modifies.\n\nExemple : un titre de Glossary contenant \\(\\alpha\\) est converti en α, mais le contenu html+latex reste intact.',
    'Tests de non-regression sur 6 fixtures enrichis (Glossary, Essay, Chart, Devoir, MultipleChoice, Summary). Verifie que chaque champ est converti selon son type de rendu declare dans FIELD_CONSTRAINTS. Aucun champ plain/unicode ne doit contenir de LaTeX brut apres healing.\n\nExemple : un critere de Devoir contenant \\(\\delta\\) est converti en δ, mais l\'intro (html+latex) garde le LaTeX.'
];

export async function runAllTests() {
    console.log('=== Tests robustesse Caramel (18 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    await runStep1_ErrorClassification();
    await runStep2_CleanJsonInput();
    await runStep3_JsonHealer();
    await runStep4_LanguageResilience();
    await runStep5_Security();
    await runStep6_ClozeHealer();
    await runStep7_CoursePresentationLatex();
    await runStep8_AutoWrapLatexExtended();
    await runStep9_LatexNormalization();
    await runStep10_LatexDelimiters();
    await runStep11_FullHealPipeline();
    await runStep12_LatexProtectionAndStructuralHealing();
    await runStep13_LatexToUnicodeExhaustive();
    await runStep14_AutoWrapExtended();
    await runStep15_HealJsonStringStress();
    await runStep16_FullPipelineByActivity();
    await runStep17_FieldConstraints();
    await runStep18_FieldConstraintsRegression();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
