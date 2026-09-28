/**
 * Tests d'export de documents de Caramel (Suite 9)
 *
 * Valide le pipeline de formatage documentaire (DOCX/ODT/PDF) :
 * 1. formatContentForDocument sur les 27 types d'activites (20 H5P + 7 Moodle)
 * 2. Integrite du contenu (caracteres speciaux, LaTeX → Unicode)
 * 3. Sanitizer DOMPurify (securite XSS + preservation HTML pedagogique)
 * 4. Utilitaires image et graphiques (dimensions, validation URL, chart renderer)
 * 5. Nettoyage MarkTheWords (conversion **gras** → *marqueur*, espacement, multi-mots)
 *
 * Pas d'iframe — imports ES6 directs.
 *
 * Usage : ouvrir tests/test-document-export.html depuis le serveur local.
 */

import { formatContentForDocument } from '../js/export/document-formatter.js';
import { sanitize, sanitizeSync, preloadSanitizer, isSanitizerLoaded, PROFILES } from '../js/export/sanitizer.js';
import { calculateDimensions, validateImageUrl } from '../js/renderers/image-utils.js';
import { generateChartImage } from '../js/renderers/chart-renderer.js';
import { healActivitySpecificFields } from '../js/h5p/json-healer.js';

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
// CONSTANTES
// =======================================================================

/** Types de section valides retournes par formatContentForDocument */
const VALID_SECTION_TYPES = [
    'header', 'paragraph', 'bulletPoint', 'checkbox',
    'separator', 'image', 'table', 'pageBreak', 'flashcardTable'
];

/** Table de correspondance moduleKey → fixture pour toutes les activites */
const ALL_FIXTURES = [
    // H5P (19 visibles)
    { moduleKey: 'Timeline',        fixture: 'timeline_1.json' },
    { moduleKey: 'Flashcards',      fixture: 'flashcards_1.json' },
    { moduleKey: 'QuizSet',         fixture: 'quiz_mixte_1.json' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_1.json' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_5.json' },
    { moduleKey: 'QuizSetQCM',      fixture: 'quiz_qcm_formules_test.json' },
    { moduleKey: 'QuizSetVF',       fixture: 'quiz_vraifaux_1.json' },
    { moduleKey: 'Glossary',        fixture: 'accordion_1.json' },
    { moduleKey: 'Crossword',       fixture: 'crosswords_1.json' },
    { moduleKey: 'Essay',           fixture: 'essay_1.json' },
    { moduleKey: 'Summary',         fixture: 'summary_1.json' },
    { moduleKey: 'DragTheWords',    fixture: 'drag_the_words_1.json' },
    { moduleKey: 'DragAndDrop',     fixture: 'drag_and_drop_1.json' },
    { moduleKey: 'FillInTheBlanks', fixture: 'fill_in_the_blanks_1.json' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_1.json' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_3.json' },
    { moduleKey: 'MarkTheWords',    fixture: 'mark_the_words_4.json' },
    { moduleKey: 'TrueFalse',       fixture: 'true_false_1.json' },
    { moduleKey: 'MultipleChoice',  fixture: 'multiple_choice_1.json' },
    { moduleKey: 'FindTheWords',    fixture: 'find_the_words_1.json' },
    { moduleKey: 'SortParagraphs',  fixture: 'sort_the_paragraphs_1.json' },
    { moduleKey: 'SingleChoiceSet', fixture: 'single_choice_set_1.json' },
    { moduleKey: 'DialogCards',     fixture: 'dialog_cards_1.json' },
    { moduleKey: 'Chart',           fixture: 'charts_1.json' },
    { moduleKey: 'CoursePresentation', fixture: 'course_presentation_1.json' },
    { moduleKey: 'CoursePresentation', fixture: 'course_presentation_4.json' },
    // Moodle (6 visibles, gift exclu car hidden)
    { moduleKey: 'test_elea',       fixture: 'test_1.json' },
    { moduleKey: 'test_elea',       fixture: 'test_4.json' },
    { moduleKey: 'glossaireXml',    fixture: 'glossaire_xml_1.json' },
    { moduleKey: 'Millionnaire',    fixture: 'millionnaire_1.json' },
    { moduleKey: 'Appariement',     fixture: 'appariement_1.json' },
    { moduleKey: 'QCM',             fixture: 'qcm_1.json' },
    { moduleKey: 'Page',            fixture: 'page_1.json' },
    { moduleKey: 'Livre',           fixture: 'livre_1.json' },
    { moduleKey: 'Livre',           fixture: 'livre_2.json' },
    { moduleKey: 'Devoir',          fixture: 'devoir_1.json' }
];

// Stockage des fixtures chargees
const fixtures = {};

// =======================================================================
// ETAPE 1 : FORMATAGE COMPLET (25 TYPES)
// =======================================================================

async function runStep1_FormatAll() {
    console.group('Etape 1 : Formatage complet');
    _ctx = { step: 1, stepName: 'Formatage', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Charger toutes les fixtures
    let loaded = 0;
    for (const entry of ALL_FIXTURES) {
        try {
            const resp = await fetch(`../assets/data/examples/${entry.fixture}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            fixtures[entry.moduleKey] = await resp.json();
            loaded++;
        } catch (e) {
            console.warn(`Fixture ${entry.fixture} non chargee :`, e.message);
        }
    }
    assert(
        loaded === ALL_FIXTURES.length,
        `[1a.Load] ${loaded}/${ALL_FIXTURES.length} fixtures chargees`,
        loaded < ALL_FIXTURES.length ? { manquantes: ALL_FIXTURES.length - loaded } : null
    );

    // Formater chaque type et valider la structure
    let passedTypes = 0;
    const failedTypes = [];

    for (const entry of ALL_FIXTURES) {
        const { moduleKey } = entry;
        const fixture = fixtures[moduleKey];
        if (!fixture) {
            assert(false, `[1.${moduleKey}] Fixture non disponible`);
            failedTypes.push(moduleKey);
            continue;
        }

        const tFmt = performance.now();
        try {
            const result = await formatContentForDocument(moduleKey, structuredClone(fixture));

            // Verifier structure de base
            if (!result || typeof result !== 'object') {
                assert(false, `[1.${moduleKey}] Resultat null ou non-objet`, { type: typeof result });
                failedTypes.push(moduleKey);
                continue;
            }

            const titleOk = typeof result.title === 'string' && result.title.length > 0;
            const sectionsOk = Array.isArray(result.sections) && result.sections.length > 0;

            if (!titleOk || !sectionsOk) {
                assert(false, `[1.${moduleKey}] Structure invalide (title: ${titleOk}, sections: ${sectionsOk})`, {
                    title: result.title,
                    sectionsCount: result.sections?.length
                });
                failedTypes.push(moduleKey);
                continue;
            }

            // Validation approfondie des sections
            let sectionErrors = [];
            for (let i = 0; i < result.sections.length; i++) {
                const s = result.sections[i];
                if (!s || !VALID_SECTION_TYPES.includes(s.type)) {
                    sectionErrors.push(`section[${i}].type = "${s?.type}" (invalide)`);
                    continue;
                }

                // Champs requis par type
                switch (s.type) {
                    case 'header':
                        if (typeof s.text !== 'string' || s.text.length === 0)
                            sectionErrors.push(`section[${i}] header sans text`);
                        if (!Number.isInteger(s.level) || s.level < 1 || s.level > 3)
                            sectionErrors.push(`section[${i}] header.level = ${s.level} (attendu 1-3)`);
                        break;
                    case 'paragraph':
                    case 'bulletPoint':
                    case 'checkbox':
                        if (typeof s.text !== 'string')
                            sectionErrors.push(`section[${i}] ${s.type} sans text`);
                        break;
                    case 'table':
                        if (!Array.isArray(s.headers))
                            sectionErrors.push(`section[${i}] table sans headers`);
                        if (!Array.isArray(s.rows))
                            sectionErrors.push(`section[${i}] table sans rows`);
                        break;
                    case 'flashcardTable':
                        if (!Array.isArray(s.rows))
                            sectionErrors.push(`section[${i}] flashcardTable sans rows`);
                        break;
                    case 'image':
                        if (!s.url && !s.imageData)
                            sectionErrors.push(`section[${i}] image sans url ni imageData`);
                        break;
                    // separator et pageBreak : pas de champ obligatoire
                }
            }

            const duration = Math.round(performance.now() - tFmt);
            if (sectionErrors.length === 0) {
                assert(true, `[1.${moduleKey}] OK — "${result.title.substring(0, 40)}" (${result.sections.length} sections, ${duration}ms)`);
                passedTypes++;
            } else {
                assert(false, `[1.${moduleKey}] ${sectionErrors.length} erreur(s) de section`, {
                    erreurs: sectionErrors.slice(0, 5).join('; ')
                });
                failedTypes.push(moduleKey);
            }
            recordTiming(moduleKey, 'formatContentForDocument', duration);
        } catch (e) {
            assert(false, `[1.${moduleKey}] Exception : ${e.message}`, { stack: e.stack?.substring(0, 300) });
            failedTypes.push(moduleKey);
        }
    }

    // Bilan
    assert(
        passedTypes === ALL_FIXTURES.length,
        `[1.Bilan] ${passedTypes}/${ALL_FIXTURES.length} types formates correctement`,
        failedTypes.length > 0 ? { echecs: failedTypes.join(', ') } : null
    );

    recordTiming('Formatage', `Tous les types (${ALL_FIXTURES.length})`, performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : INTEGRITE DU CONTENU (CARACTERES SPECIAUX, LATEX)
// =======================================================================

async function runStep2_ContentIntegrity() {
    console.group('Etape 2 : Integrite du contenu');
    const trous = { taskDescription: 'CONSIGNE_UNIQUE', questions: ['France : *Paris*.'] };
    for (const [module, data] of [
        ['QuizSet', { questions: [{ library: 'H5P.Blanks 1.14', params: trous }] }],
        ['CoursePresentation', { slides: [{ type: 'quiz', exercise: { library: 'H5P.Blanks 1.14', ...trous } }] }],
        ['InteractiveBook', { chapters: [{ title: 'Une page', content: [{ type: 'exercise', library: 'H5P.Blanks 1.14', ...trous }] }] }]
    ]) {
        const result = await formatContentForDocument(module, data);
        assert(result.sections.filter(s => s.text === 'CONSIGNE_UNIQUE').length === 1, `${module} : une seule consigne pour le texte à trous imbriqué`);
        assert(result.sections.every((s, i, all) => s.type !== 'separator' || (all[i + 1] && all[i + 1].type !== 'pageBreak')), `${module} : aucun espace vide isolé avant le corrigé ou en fin de document`);
    }
    // Régression : contenu pédagogique perdu alors que l'éditeur l'avait enregistré.
    const essay = {
        taskDescription: 'Explique le phénomène.',
        solution: { introduction: 'Une réponse possible', sample: 'REPONSE_MODELE_COMPLETE' },
        keywords: [{ keyword: 'Énergie', alternatives: ['Travail'], options: { points: 0, occurrences: 2, feedbackIncluded: 'RETOUR_PRESENT', feedbackMissed: 'RETOUR_ABSENT' } }]
    };
    const drag = { taskDescription: 'Complète.', textField: 'Un *triangle:INDICE_SECRET\\+RETOUR_JUSTE\\-RETOUR_FAUX* et un *rapport 1/2*.', distractors: '*cercle* *carré*' };
    const quiz = { title: 'Questions', questions: [{ library: 'H5P.DragText 1.10', params: drag }, { library: 'H5P.Essay 1.5', params: essay }] };
    for (const [module, data] of [['Essay', essay], ['DragTheWords', drag], ['QuizSet', quiz]]) {
        const formatted = await formatContentForDocument(module, data, { keepLatex: true });
        const split = formatted.sections.findIndex(s => s.type === 'pageBreak');
        const student = JSON.stringify(formatted.sections.slice(0, split));
        const teacher = JSON.stringify(formatted.sections.slice(split));
        if (module !== 'DragTheWords') {
            assert(!student.includes('REPONSE_MODELE_COMPLETE') && teacher.includes('REPONSE_MODELE_COMPLETE') && teacher.includes('Travail') && teacher.includes('RETOUR_PRESENT') && teacher.includes('RETOUR_ABSENT'), `${module} : corrigé rédigé, variantes et retours dans la partie enseignant`);
            assert(teacher.includes(' : 0;') && teacher.includes(' : 2'), `${module} : pondération nulle et occurrences conservées`);
        }
        if (module !== 'Essay') {
            assert(student.includes('cercle') && student.includes('carré') && student.includes('rapport 1/2'), `${module} : distracteurs et barre oblique littérale dans les choix`);
            assert(student.includes('INDICE_SECRET') && !student.includes('RETOUR_JUSTE') && !student.includes('RETOUR_FAUX') && teacher.includes('[triangle]') && teacher.includes('RETOUR_JUSTE') && teacher.includes('RETOUR_FAUX'), `${module} : les marqueurs de feedback ne contaminent pas les réponses papier`);
        }
    }
    const { normalizeDataForEditor, denormalizeDataForSave } = await import('../js/editor/content-detector.js');
    const { processH5PContent } = await import('../js/h5p/processors/index.js');
    const edited = normalizeDataForEditor(drag, 'DragTheWords');
    edited.distractors = '*ellipse*';
    const saved = denormalizeDataForSave(edited, 'DragTheWords');
    const packaged = await processH5PContent('DragTheWords', saved);
    assert(packaged.distractors === '*ellipse*', 'Le distracteur modifié traverse la sauvegarde et le processeur autonome');

    _ctx = { step: 2, stepName: 'Contenu', file: '', module: '', source: '' };
    const t0 = performance.now();

    for (const module of ['Flashcards', 'DialogCards']) {
        const card = { text: 'RECTO', answer: 'VERSO', tip: 'INDICE', tips: {front:'INDICE',back:'VERSO_INDICE'}, image: {path:'images/carte.png',copyright:{license:'CC BY',author:'CREDIT_CONSERVE'}} };
        const result = await formatContentForDocument(module, {description:'CONSIGNE_CONSERVEE', [module==='Flashcards'?'cards':'dialogs']:[card]});
        const text = JSON.stringify(result);
        assert(text.includes('CONSIGNE_CONSERVEE') && text.includes('CREDIT_CONSERVE'), `[2.Cartes] ${module} : consigne et crédits sur papier`);
        assert(result.sections.filter(s=>s.type==='flashcardTable').map(s=>s.side).join(',')==='recto,verso', `[2.Cartes] ${module} : paire recto/verso contiguë`);
    }
    {
        const result = await formatContentForDocument('Summary', {intro:'Choisir', summaries:[{summary:['BONNE_REPONSE','DISTRACTEUR'],tip:'INDICE_GROUPE'}]});
        const end = result.sections.findIndex(s=>s.type==='pageBreak');
        assert(JSON.stringify(result.sections.slice(0,end)).includes('INDICE_GROUPE'), '[2.Résumé] Indice dans la feuille élève');
        assert(!JSON.stringify(result.sections.slice(end)).includes('INDICE_GROUPE'), '[2.Résumé] Indice non ajouté comme correction');
        assert(result.sections.find(s => s.type === 'checkbox').text === 'A. DISTRACTEUR', '[2.Résumé] La réponse native ne reste pas systématiquement A');
        assert(result.sections.some(s => s.style === 'correctAnswer' && s.text.includes('B. BONNE_REPONSE')), '[2.Résumé] Lettre du corrigé alignée sur la fiche élève');
        const native = await fetch('/tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/Summary/content.json').then(r => r.json());
        const { default: processor } = await import('../js/h5p/processors/Summary.js');
        const before = JSON.stringify(native);
        const packaged = processor.process(native);
        assert(packaged.summaries[0].subContentId === native.summaries[0].subContentId, '[2.Résumé] UUID natif conservé au réexport');
        assert(packaged.summaries[0].tip.includes('RELU'), '[2.Résumé] Retouche utilisateur conservée');
        assert(!('behaviour' in packaged), '[2.Résumé] Pas de comportement absent des semantics natives');
        assert(processor.process({...native, tipButtonLabel:'AIDE PERSONNALISEE'}).tipButtonLabel === 'AIDE PERSONNALISEE', '[2.Résumé] Libellé natif personnalisé conservé');
        assert(JSON.stringify(native) === before, '[2.Résumé] Source native non mutée');

    }

    // Fixture de test avec caracteres speciaux
    const specialChars = 'àéèêçôùîë «guillemets» – tiret — cadratin … œ æ';
    const testFixture = {
        title: `Test ${specialChars}`,
        cards: [
            { text: `Question ${specialChars}`, answer: `Réponse ${specialChars}`, tip: 'Astuce' },
            { text: 'Question simple', answer: 'Réponse simple', tip: 'Astuce' }
        ]
    };

    try {
        const result = await formatContentForDocument('Flashcards', testFixture);

        // Verifier que le titre contient les caracteres speciaux
        const titleHasSpecialChars = result.title && result.title.includes('àéèêçôùîë');
        assert(
            titleHasSpecialChars,
            `[2a.Accents] Accents preserves dans le titre`,
            !titleHasSpecialChars ? { titre: result.title?.substring(0, 80) } : null
        );

        // Chercher les guillemets dans les sections
        const allText = result.sections
            .filter(s => s.text)
            .map(s => s.text)
            .join(' ');
        const allRows = result.sections
            .filter(s => s.type === 'flashcardTable' && s.rows)
            .flatMap(s => s.rows)
            .map(r => {
                const l = r.left ? (typeof r.left === 'string' ? r.left : r.left.text || '') : '';
                const ri = r.right ? (typeof r.right === 'string' ? r.right : r.right.text || '') : '';
                return `${l} ${ri}`;
            })
            .join(' ');
        const fullContent = allText + ' ' + allRows;

        assert(
            fullContent.includes('«') && fullContent.includes('»'),
            `[2b.Guillemets] Guillemets francais « » preserves`
        );

        assert(
            fullContent.includes('œ') || fullContent.includes('æ'),
            `[2c.Ligatures] Ligatures œ/æ preservees`
        );

        assert(
            fullContent.includes('–') || fullContent.includes('—'),
            `[2d.Tirets] Tirets longs preserves`
        );
    } catch (e) {
        assert(false, `[2a.Accents] Exception : ${e.message}`);
        assert(false, `[2b.Guillemets] Exception`);
        assert(false, `[2c.Ligatures] Exception`);
        assert(false, `[2d.Tirets] Exception`);
    }

    // Test LaTeX → Unicode (via postProcessLatex interne)
    const latexFixture = {
        title: 'Test LaTeX \\(x^2 + y^2 = z^2\\)',
        cards: [
            { text: 'Calculer \\(\\frac{1}{2}\\)', answer: '0,5', tip: '\\(a^n\\)' },
            { text: 'Question \\(\\sqrt{4}\\)', answer: '2', tip: 'Racine' }
        ]
    };

    try {
        const result = await formatContentForDocument('Flashcards', latexFixture);

        // postProcessLatex devrait convertir \(x^2\) en x² (Unicode)
        const titleHasUnicode = result.title && result.title.includes('²');
        assert(
            titleHasUnicode,
            `[2e.LaTeX] LaTeX x^2 converti en Unicode ² dans le titre`,
            { titre: result.title?.substring(0, 80) }
        );

        // Verifier conversion \frac dans les sections
        const sectionsText = result.sections
            .filter(s => s.text)
            .map(s => s.text)
            .join(' ');
        const rowsText = result.sections
            .filter(s => s.type === 'flashcardTable' && s.rows)
            .flatMap(s => s.rows)
            .map(r => {
                const l = r.left ? (typeof r.left === 'string' ? r.left : r.left.text || '') : '';
                const ri = r.right ? (typeof r.right === 'string' ? r.right : r.right.text || '') : '';
                return `${l} ${ri}`;
            })
            .join(' ');
        const contentText = sectionsText + ' ' + rowsText;

        // \frac{1}{2} devrait devenir 1/2 ou ½
        const fracConverted = contentText.includes('½') || contentText.includes('1/2')
            || !contentText.includes('\\frac');
        assert(
            fracConverted,
            `[2f.Frac] LaTeX \\frac converti ou supprime`,
            { contenu: contentText.substring(0, 100) }
        );

        // Verifier que les delimiteurs LaTeX bruts \(...\) sont supprimes
        const noRawDelimiters = !contentText.includes('\\(') && !contentText.includes('\\)');
        assert(
            noRawDelimiters,
            `[2g.Delimiteurs] Delimiteurs LaTeX \\( \\) supprimes apres conversion`,
            !noRawDelimiters ? { extrait: contentText.substring(0, 100) } : null
        );
    } catch (e) {
        assert(false, `[2e.LaTeX] Exception : ${e.message}`);
        assert(false, `[2f.Frac] Exception`);
        assert(false, `[2g.Delimiteurs] Exception`);
    }

    // Test avec une vraie fixture contenant potentiellement du LaTeX (MultipleChoice/Essay)
    const mcFixture = fixtures['MultipleChoice'];
    if (mcFixture) {
        try {
            const result = await formatContentForDocument('MultipleChoice', structuredClone(mcFixture));
            assert(
                result && result.title && result.sections.length > 0,
                `[2h.RealFixture] MultipleChoice formate OK (${result.sections.length} sections)`
            );
        } catch (e) {
            assert(false, `[2h.RealFixture] Exception MultipleChoice : ${e.message}`);
        }
    } else {
        assert(false, `[2h.RealFixture] Fixture MultipleChoice non disponible`);
    }

    recordTiming('Contenu', 'Tests caracteres speciaux + LaTeX', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : SANITIZER DOMPURIFY
// =======================================================================

async function runStep3_Sanitizer() {
    console.group('Etape 3 : Sanitizer DOMPurify');
    _ctx = { step: 3, stepName: 'Sanitizer', file: '', module: '', source: '' };
    const t0 = performance.now();

    // Precharger DOMPurify
    try {
        await preloadSanitizer();
    } catch (e) {
        console.warn('preloadSanitizer echoue, tentative via window.DOMPurify');
    }

    const loaded = isSanitizerLoaded() || !!window.DOMPurify;
    assert(loaded, `[3a.Load] DOMPurify charge`);

    if (!loaded) {
        // Fallback : tester sanitizeSync avec le fallback basique
        console.warn('DOMPurify non disponible — tests avec fallback basique');
    }

    // -- SECURITE : XSS bloque --
    const securityTests = [
        { input: '<script>alert(1)</script>texte',            check: s => !s.includes('<script'),        label: 'script' },
        { input: '<img src=x onerror="alert(1)">',            check: s => !s.includes('onerror'),         label: 'onerror' },
        { input: '<a href="javascript:alert(1)">lien</a>',    check: s => !s.includes('javascript:'),     label: 'javascript:' },
        { input: '<div onclick="alert(1)">texte</div>',       check: s => !s.includes('onclick'),          label: 'onclick' },
        { input: '<iframe src="evil.com"></iframe>',           check: s => !s.includes('<iframe'),          label: 'iframe' },
        { input: '<svg onload="alert(1)"><circle/></svg>',     check: s => !s.includes('onload'),           label: 'svg onload' }
    ];

    for (const test of securityTests) {
        try {
            const result = loaded
                ? await sanitize(test.input, 'EDUCATIONAL')
                : sanitizeSync(test.input, 'EDUCATIONAL');
            assert(
                test.check(result),
                `[3b.${test.label}] XSS bloque : ${test.label}`,
                !test.check(result) ? { resultat: result } : null
            );
        } catch (e) {
            assert(false, `[3b.${test.label}] Exception : ${e.message}`);
        }
    }

    // -- PRESERVATION EDUCATIONAL --
    const preserveTests = [
        { input: '<strong>gras</strong>',                              check: s => s.includes('<strong>'),  label: 'strong' },
        { input: '<em>italique</em>',                                  check: s => s.includes('<em>'),      label: 'em' },
        { input: '<ul><li>item</li></ul>',                             check: s => s.includes('<li>'),      label: 'ul/li' },
        { input: '<a href="https://example.com">lien</a>',            check: s => s.includes('href='),     label: 'a[href]' },
        { input: '<table><tr><td>cellule</td></tr></table>',           check: s => s.includes('<td>'),      label: 'table' }
    ];

    for (const test of preserveTests) {
        try {
            const result = loaded
                ? await sanitize(test.input, 'EDUCATIONAL')
                : sanitizeSync(test.input, 'EDUCATIONAL');
            assert(
                test.check(result),
                `[3c.${test.label}] Preserve (EDUCATIONAL) : <${test.label}>`,
                !test.check(result) ? { resultat: result } : null
            );
        } catch (e) {
            assert(false, `[3c.${test.label}] Exception : ${e.message}`);
        }
    }

    // -- PROFIL STRICT --
    try {
        const strictStrong = loaded
            ? await sanitize('<strong>gras</strong>', 'STRICT')
            : sanitizeSync('<strong>gras</strong>', 'STRICT');
        assert(
            strictStrong.includes('<strong>') || strictStrong.includes('gras'),
            `[3d.strict_strong] STRICT preserve <strong>`,
            { resultat: strictStrong }
        );

        const strictTable = loaded
            ? await sanitize('<table><tr><td>cellule</td></tr></table>', 'STRICT')
            : sanitizeSync('<table><tr><td>cellule</td></tr></table>', 'STRICT');
        assert(
            !strictTable.includes('<table'),
            `[3d.strict_table] STRICT supprime <table>`,
            { resultat: strictTable }
        );
    } catch (e) {
        assert(false, `[3d.strict_strong] Exception STRICT : ${e.message}`);
        assert(false, `[3d.strict_table] Exception STRICT`);
    }

    // -- PROFIL RICH_HTML --
    try {
        const richHtml = loaded
            ? await sanitize('<section><article>contenu</article></section>', 'RICH_HTML')
            : sanitizeSync('<section><article>contenu</article></section>', 'RICH_HTML');
        assert(
            richHtml.includes('<section') || richHtml.includes('<article'),
            `[3e.rich] RICH_HTML preserve <section>/<article>`,
            { resultat: richHtml }
        );
    } catch (e) {
        assert(false, `[3e.rich] Exception RICH_HTML : ${e.message}`);
    }

    recordTiming('Sanitizer', 'Tests securite + preservation', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : UTILITAIRES IMAGE ET GRAPHIQUES
// =======================================================================

async function runStep4_ImageAndChart() {
    console.group('Etape 4 : Utilitaires image et graphiques');
    _ctx = { step: 4, stepName: 'Images/Charts', file: '', module: '', source: '' };
    const t0 = performance.now();

    // -- calculateDimensions --
    // Paysage 800x600 avec fixedHeight=150, maxWidth=160
    // ratio = 800/600 = 1.333, width = 150*1.333 = 200 > 160 → cap a 160, height = 160/1.333 = 120
    const d1 = calculateDimensions(800, 600, 150, 160);
    assert(
        d1.width <= 160 && d1.height > 0 && d1.height <= 150,
        `[4a.Landscape] Paysage 800x600 → ${d1.width}x${d1.height}mm (width <= 160)`,
        { width: d1.width, height: d1.height }
    );

    // Portrait 100x400
    // ratio = 0.25, width = 150*0.25 = 37.5 < 160 → ok
    const d2 = calculateDimensions(100, 400, 150, 160);
    assert(
        d2.width < 160 && d2.height === 150,
        `[4b.Portrait] Portrait 100x400 → ${d2.width}x${d2.height}mm (height = 150)`,
        { width: d2.width, height: d2.height }
    );

    // Tres large 1600x100
    // ratio = 16, width = 150*16 = 2400 > 160 → cap a 160, height = 10
    const d3 = calculateDimensions(1600, 100, 150, 160);
    assert(
        d3.width === 160 && d3.height < 150,
        `[4c.Wide] Tres large 1600x100 → ${d3.width}x${d3.height}mm (width cap a 160)`,
        { width: d3.width, height: d3.height }
    );

    // Dimensions invalides → fallback 100x100
    const d4 = calculateDimensions(0, 0, 150, 160);
    assert(
        d4.width === 100 && d4.height === 100,
        `[4d.Invalid] Dimensions 0x0 → fallback ${d4.width}x${d4.height}mm`,
        { width: d4.width, height: d4.height }
    );

    // -- validateImageUrl --
    assert(
        validateImageUrl('https://example.com/img.png') === true,
        `[4e.URL_https] validateImageUrl('https://...') → true`
    );

    assert(
        validateImageUrl('http://example.com/img.jpg') === true,
        `[4f.URL_http] validateImageUrl('http://...') → true`
    );

    assert(
        validateImageUrl('javascript:alert(1)') === false,
        `[4g.URL_js] validateImageUrl('javascript:...') → false`
    );

    assert(
        validateImageUrl('') === false,
        `[4h.URL_empty] validateImageUrl('') → false`
    );

    // -- generateChartImage --
    try {
        const chartData = {
            graphMode: 'barChart',
            listOfTypes: [
                { text: 'Mathématiques', value: 85 },
                { text: 'Français', value: 72 },
                { text: 'Histoire', value: 90 }
            ],
            figureDefinition: 'Notes par matière'
        };

        const chartResult = generateChartImage(chartData);
        assert(
            chartResult && chartResult.dataURL && chartResult.dataURL.startsWith('data:image/png'),
            `[4i.BarChart] generateChartImage barChart → dataURL PNG`,
            chartResult ? { width: chartResult.width, height: chartResult.height } : { resultat: null }
        );

        // Pie chart
        const pieData = { ...chartData, graphMode: 'pieChart' };
        const pieResult = generateChartImage(pieData);
        assert(
            pieResult && pieResult.dataURL && pieResult.dataURL.startsWith('data:image/png'),
            `[4j.PieChart] generateChartImage pieChart → dataURL PNG`,
            pieResult ? { width: pieResult.width, height: pieResult.height } : { resultat: null }
        );
    } catch (e) {
        assert(false, `[4i.BarChart] Exception : ${e.message}`);
        assert(false, `[4j.PieChart] Exception`);
    }

    // Contre-exemples : graduations décimales autrefois toutes nulles,
    // légende et libellés longs autrefois coupés au bord du canvas.
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    const drawn = [];
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
        drawn.push({ text: String(text), x, y, height: this.canvas.height });
        return originalFillText.call(this, text, x, y, ...rest);
    };
    try {
        generateChartImage({ graphMode: 'barChart', listOfTypes: [{ text: 'A', value: 0.0001 }, { text: 'B', value: 0.0012 }] });
        const ticks = drawn.filter(d => d.x === 62).map(d => Number(d.text));
        assert(ticks.length === 6 && ticks.filter(v => v > 0).length === 5 && ticks.at(-1) === 0.0012,
            '[4k.Graduations] Les petites valeurs gardent des graduations distinctes', { ticks });
        for (const graphMode of ['pieChart', 'barChart']) {
            drawn.length = 0;
            const result = generateChartImage({ graphMode, listOfTypes: Array.from({ length: 20 }, (_, i) => ({ text: `Libellé ${i + 1} suffisamment long pour éprouver le retour à la ligne`, value: i + 1 })) });
            assert(result.height > 500 && drawn.every(d => d.y >= 0 && d.y + 10 <= d.height),
                `[4l.Libellés] ${graphMode} réserve la place des vingt libellés longs`, { height: result.height });
        }
    } finally {
        CanvasRenderingContext2D.prototype.fillText = originalFillText;
    }
    recordTiming('Utilitaires', 'Image + Chart', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : NETTOYAGE MARKTHEWORDS (DOUBLES ASTERISQUES + ESPACEMENT)
// =======================================================================

async function runStep5_MarkTheWordsCleaning() {
    console.group('Etape 5 : Nettoyage MarkTheWords');
    _ctx = { step: 5, stepName: 'MarkTheWords', file: '', module: '', source: '' };
    const t0 = performance.now();

    // -- 5a. Conversion **mot** → *mot* (gras markdown du LLM) --
    const inputBold = {
        taskDescription: "Repere les **concepts cles** dans le texte.",
        textField: "La **Revolution** de 1789 marque un tournant decisif ou le **peuple** renverse la **monarchie**."
    };
    try {
        const healed = healActivitySpecificFields(inputBold, 'MarkTheWords');
        const noDoubleStar = !healed.textField.includes('**');
        assert(
            noDoubleStar,
            `[5a.DoubleStar] Les ** sont convertis en * simple`,
            !noDoubleStar ? { textField: healed.textField } : null
        );
    } catch (e) {
        assert(false, `[5a.DoubleStar] Exception : ${e.message}`);
    }

    // -- 5b. Conversion preservee les espaces existants --
    const inputSpacing = {
        taskDescription: "Test espacement",
        textField: "La **Revolution** de 1789 ou le **peuple** renverse la **monarchie**."
    };
    try {
        const healed = healActivitySpecificFields(inputSpacing, 'MarkTheWords');
        // Apres conversion ** → *, les espaces originaux doivent etre preserves
        const expected = "La *Revolution* de 1789 ou le *peuple* renverse la *monarchie*.";
        assert(
            healed.textField === expected,
            `[5b.Espacement] Espaces originaux preserves apres conversion ** → *`,
            healed.textField !== expected ? { attendu: expected, obtenu: healed.textField } : null
        );
    } catch (e) {
        assert(false, `[5b.Espacement] Exception : ${e.message}`);
    }

    // -- 5c. Fixture mark_the_words_3.json (input LLM avec **gras**) --
    try {
        const resp = await fetch('../assets/data/examples/mark_the_words_3.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const fixture3 = await resp.json();

        const healed3 = healActivitySpecificFields(structuredClone(fixture3), 'MarkTheWords');
        const noDouble3 = !healed3.textField.includes('**');
        assert(
            noDouble3,
            `[5c.Fixture3] mark_the_words_3.json : pas de ** apres nettoyage`,
            !noDouble3 ? { textField: healed3.textField.substring(0, 120) } : null
        );

        // Verifier que les mots cles sont bien marques en simple *mot*
        const expectedWords = ['Revolution', 'Révolution', 'peuple', 'monarchie', 'societe', 'société', 'République', 'Republique'];
        const foundMarkers = healed3.textField.match(/\*[^*]+\*/g) || [];
        assert(
            foundMarkers.length >= 3,
            `[5c.Fixture3_markers] ${foundMarkers.length} marqueurs *mot* trouves (attendu >= 3)`,
            { marqueurs: foundMarkers.join(', ') }
        );
    } catch (e) {
        assert(false, `[5c.Fixture3] Exception : ${e.message}`);
    }

    // -- 5d. Fixture mark_the_words_4.json (sortie deja cassee) --
    try {
        const resp = await fetch('../assets/data/examples/mark_the_words_4.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const fixture4 = await resp.json();

        const healed4 = healActivitySpecificFields(structuredClone(fixture4), 'MarkTheWords');
        // Le textField casse ne doit plus contenir de ** colles
        const noDouble4 = !healed4.textField.includes('**');
        assert(
            noDouble4,
            `[5d.Fixture4] mark_the_words_4.json : ** colles corriges`,
            !noDouble4 ? { textField: healed4.textField.substring(0, 120) } : null
        );
    } catch (e) {
        assert(false, `[5d.Fixture4] Exception : ${e.message}`);
    }

    // -- 5e. Multi-mots *mot1 mot2* → *mot1* *mot2* --
    const inputMulti = {
        taskDescription: "Test multi-mots",
        textField: "Le *droit de vote* est un acquis de la *Revolution francaise* de 1789."
    };
    try {
        const healed = healActivitySpecificFields(inputMulti, 'MarkTheWords');
        // Verifier qu'aucun marqueur individuel *...* ne contient d'espace
        const allMarkers = healed.textField.match(/\*[^*]+\*/g) || [];
        const noMultiWord = allMarkers.every(m => !m.slice(1, -1).includes(' '));
        assert(
            noMultiWord,
            `[5e.MultiMots] Multi-mots eclates en marqueurs individuels`,
            !noMultiWord ? { textField: healed.textField, marqueurs: allMarkers.filter(m => m.slice(1, -1).includes(' ')).join(', ') } : null
        );
        // Verifier que les mots individuels sont bien marques
        const markers = healed.textField.match(/\*[^*]+\*/g) || [];
        assert(
            markers.length >= 5,
            `[5e.MultiMots_count] ${markers.length} marqueurs apres eclatement (attendu >= 5)`,
            { marqueurs: markers.join(', ') }
        );
    } catch (e) {
        assert(false, `[5e.MultiMots] Exception : ${e.message}`);
    }

    // -- 5f. Apostrophe + asterisque : l'*oiseau* → l' *oiseau* --
    const inputApostrophe = {
        taskDescription: "Test apostrophe",
        textField: "L'*egalite* et l'*independance* sont des valeurs."
    };
    try {
        const healed = healActivitySpecificFields(inputApostrophe, 'MarkTheWords');
        const apostropheOk = !healed.textField.includes("'*") || healed.textField.includes("' *");
        assert(
            apostropheOk,
            `[5f.Apostrophe] Espace ajoute apres apostrophe avant *mot*`,
            !apostropheOk ? { textField: healed.textField } : null
        );
    } catch (e) {
        assert(false, `[5f.Apostrophe] Exception : ${e.message}`);
    }

    recordTiming('MarkTheWords', 'Nettoyage textField', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : NETTOYAGE HTML (cleanHtml)
// =======================================================================

/**
 * Teste le nettoyage HTML utilise dans tous les exports documents.
 * On passe par formatContentForDocument qui appelle cleanHtml en interne.
 */
async function runStep6_CleanHtml() {
    _ctx = { step: 6, stepName: 'CleanHtml', file: '', module: '', source: '' };
    console.group('Etape 6 : Nettoyage HTML (cleanHtml)');
    const t0 = performance.now();

    // Helper : extrait le texte du premier paragraphe 'description' dans le resultat formate
    function getDescriptionText(formatted) {
        if (!formatted || !formatted.sections) return null;
        const desc = formatted.sections.find(s => s.style === 'description' || s.style === 'question');
        return desc ? desc.text : null;
    }

    // 6a. Literal \n (backslash-n) dans taskDescription → vrais sauts de ligne
    try {
        const data = {
            title: 'Test newlines',
            taskDescription: 'Ligne 1.\\nLigne 2.\\n\\nLigne 3.',
            textField: 'Le *chat* est *grand*',
            overallFeedback: [{ from: 0, to: 100, feedback: '' }]
        };
        const formatted = await formatContentForDocument('MarkTheWords', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6a] taskDescription presente dans le formatage');
        if (text) {
            assert(!text.includes('\\n'), '[6a] Pas de \\n litteral dans le texte formate', { text });
            assert(text.includes('\n'), '[6a] Vrais sauts de ligne presents', { text });
            assert(text.includes('Ligne 1.'), '[6a] Contenu preserve apres nettoyage');
            assert(text.includes('Ligne 3.'), '[6a] Troisieme ligne preserve');
        }
    } catch (e) {
        assert(false, `[6a] Exception literal \\n : ${e.message}`);
    }

    // 6b. HTML <br> et <p> → sauts de ligne
    try {
        const data = {
            title: 'Test HTML',
            taskDescription: '<p>Paragraphe 1.</p><p>Paragraphe 2.</p>',
            textField: 'Le *mot*',
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('DragTheWords', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6b] taskDescription HTML presente');
        if (text) {
            assert(text.includes('Paragraphe 1.'), '[6b] Premier paragraphe preserve');
            assert(text.includes('Paragraphe 2.'), '[6b] Deuxieme paragraphe preserve');
            assert(!text.includes('<p>'), '[6b] Balises <p> supprimees');
        }
    } catch (e) {
        assert(false, `[6b] Exception HTML : ${e.message}`);
    }

    // 6c. <strong>/<em> → markdown **gras**/*italique*
    try {
        const data = {
            question: '<strong>Important</strong> et <em>remarque</em>.',
            answers: [{ text: 'A', correct: true }],
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('MultipleChoice', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6c] Question formatee presente');
        if (text) {
            assert(text.includes('**Important**'), '[6c] <strong> → **gras**', { text });
            assert(text.includes('*remarque*'), '[6c] <em> → *italique*', { text });
        }
    } catch (e) {
        assert(false, `[6c] Exception strong/em : ${e.message}`);
    }

    // 6d. Entites HTML decodees
    try {
        const data = {
            question: 'L&amp;R &lt;test&gt; &quot;guillemets&quot;',
            answers: [{ text: 'A', correct: true }],
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('MultipleChoice', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6d] Question avec entites presente');
        if (text) {
            assert(text.includes('L&R'), '[6d] &amp; decode', { text });
            assert(text.includes('<test>'), '[6d] &lt;&gt; decode', { text });
            assert(text.includes('"guillemets"'), '[6d] &quot; decode', { text });
        }
    } catch (e) {
        assert(false, `[6d] Exception entites : ${e.message}`);
    }

    // 6e. Vrais sauts de ligne (pas literal) preserves
    try {
        const data = {
            question: 'Ligne 1.\nLigne 2.',
            answers: [{ text: 'A', correct: true }],
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('MultipleChoice', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6e] Question avec vrais \\n presente');
        if (text) {
            assert(text.includes('Ligne 1.'), '[6e] Premiere ligne preservee');
            assert(text.includes('Ligne 2.'), '[6e] Deuxieme ligne preservee');
        }
    } catch (e) {
        assert(false, `[6e] Exception vrais newlines : ${e.message}`);
    }

    // 6f. Crossword taskDescription avec \n (cas reel du bug)
    try {
        const data = {
            title: 'Mots croises',
            taskDescription: '**Complete** cette grille.\\n\\nUtilise tes connaissances.\\n\\nPour les mots composes, pas d\'espace.',
            words: [{ answer: 'MOT', clue: 'Indice 1' }, { answer: 'TEST', clue: 'Indice 2' }],
            overallFeedback: [{ from: 0, to: 100, feedback: '' }]
        };
        const formatted = await formatContentForDocument('Crossword', data);
        const text = getDescriptionText(formatted);
        assert(text !== null, '[6f] Crossword taskDescription presente');
        if (text) {
            assert(!text.includes('\\n'), '[6f] Pas de \\n litteral dans le Crossword', { text });
            assert(text.includes('**Complete**'), '[6f] Markdown **gras** preserve');
            assert(text.includes('Utilise tes connaissances'), '[6f] Deuxieme paragraphe present');
            assert(text.includes('pas d\'espace'), '[6f] Troisieme paragraphe present');
        }
    } catch (e) {
        assert(false, `[6f] Exception Crossword : ${e.message}`);
    }

    // 6g. Ne casse pas les marqueurs *mot* dans les textes DragTheWords/MarkTheWords
    try {
        const data = {
            taskDescription: 'Consigne',
            textField: 'Le *chat* mange du *poisson*.\\nSur la *table*.',
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('DragTheWords', data);
        // Verifier que les mots entre * sont bien traites dans le contenu
        const allText = JSON.stringify(formatted);
        assert(allText.includes('chat'), '[6g] Mot "chat" present dans le formatage');
        assert(allText.includes('poisson'), '[6g] Mot "poisson" present dans le formatage');
        assert(allText.includes('table'), '[6g] Mot "table" present apres \\n');
    } catch (e) {
        assert(false, `[6g] Exception marqueurs : ${e.message}`);
    }

    // 6h. Valeur null/undefined/vide ne provoque pas d'erreur
    try {
        const data = {
            question: null,
            answers: [{ text: 'A', correct: true }],
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('MultipleChoice', data);
        assert(formatted !== null, '[6h] Formatage avec question null ne crash pas');
    } catch (e) {
        assert(false, `[6h] Exception null : ${e.message}`);
    }

    // 6i. Symboles Unicode remplaces
    try {
        const data = {
            title: 'Test symboles',
            taskDescription: 'Cochez ✓ ou refusez ✗. Suivez la fleche → et tolerez ±5%.',
            textField: 'Le *mot*',
            overallFeedback: []
        };
        const formatted = await formatContentForDocument('DragTheWords', data);
        const text = getDescriptionText(formatted);
        if (text) {
            assert(text.includes('[V]'), '[6i] ✓ → [V]', { text });
            assert(text.includes('[X]'), '[6i] ✗ → [X]', { text });
            assert(text.includes('->'), '[6i] → → ->', { text });
            assert(text.includes('+/-'), '[6i] ± → +/-', { text });
        }
    } catch (e) {
        assert(false, `[6i] Exception symboles : ${e.message}`);
    }

    recordTiming('CleanHtml', 'Tests cleanHtml', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Formatage',
    'Contenu',
    'Sanitizer',
    'Images/Charts',
    'MarkTheWords',
    'CleanHtml'
];

export const STEP_DESCRIPTIONS = [
    '',
    `Formate les ${ALL_FIXTURES.length} types d'activites via formatContentForDocument et valide la structure (title, sections, champs par type).`,
    'Verifie la preservation des caracteres speciaux (accents, guillemets) et la conversion LaTeX → Unicode.',
    'Teste la securite DOMPurify (XSS bloque) et la preservation du HTML pedagogique (3 profils).',
    'Valide calculateDimensions (ratios, cap), validateImageUrl (protocoles), generateChartImage (bar/pie).',
    'Verifie la conversion **gras** → *marqueur*, l\'espacement, le split multi-mots et l\'apostrophe dans MarkTheWords.',
    'Verifie le nettoyage HTML : \\n litteraux, balises, entites, symboles Unicode, marqueurs *mot*, valeurs nulles.'
];

/**
 * Lance tous les tests d'export de documents.
 */
export async function runAllTests() {
    console.log(`=== Tests Export Documents Caramel (5 etapes, ${ALL_FIXTURES.length} types) ===`);
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_FormatAll();
    await runStep2_ContentIntegrity();
    await runStep3_Sanitizer();
    await runStep4_ImageAndChart();
    await runStep5_MarkTheWordsCleaning();
    await runStep6_CleanHtml();

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests export', t1 - t0);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
