/**
 * Tests d'export de parcours de Caramel (agrégation multi-activités)
 *
 * Valide le module js/export/course-formatter.js :
 * 1. Agrégation mixte : page de garde, sommaire, chapitres numérotés,
 *    sauts de page, types de sections valides pour les 3 builders
 * 2. Conversion flashcardTable → tableau standard (cartes, indices, images)
 * 3. Propagation de l'option keepLatex (formules DOCX/ODT vs Unicode PDF)
 * 4. Robustesse : parcours vide, type inconnu, titres de repli
 *
 * Pas d'iframe — imports ES6 directs.
 *
 * Usage : ouvrir tests/test-course-export.html depuis le serveur local.
 */

import { formatCourseForDocument, convertFlashcardTables } from '../js/export/course-formatter.js';
import { t, loadTranslations } from '../js/core/translation.js';

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

async function loadFixture(name) {
    const resp = await fetch(`../assets/data/examples/${name}`);
    if (!resp.ok) throw new Error(`Fixture introuvable : ${name} (${resp.status})`);
    return resp.json();
}

// =======================================================================
// CONSTANTES
// =======================================================================

/** Types de section acceptés par les 3 builders génériques (DOCX/PDF/ODT).
 *  flashcardTable en est volontairement EXCLU : sa présence détourne les
 *  builders vers le document « cartes imprimables » qui ignore le reste. */
const MERGED_SECTION_TYPES = [
    'header', 'paragraph', 'bulletPoint', 'checkbox',
    'separator', 'image', 'table', 'pageBreak'
];

/** Parcours mixte de référence (4 types, H5P + Moodle) */
const MIXED_COURSE_FIXTURES = [
    { moduleKey: 'QuizSetQCM', fixture: 'quiz_qcm_1.json' },
    { moduleKey: 'Flashcards', fixture: 'flashcards_1.json' },
    { moduleKey: 'Crossword',  fixture: 'crosswords_1.json' },
    { moduleKey: 'Page',       fixture: 'page_1.json' }
];

// =======================================================================
// ETAPE 1 : AGREGATION MIXTE
// =======================================================================

async function runStep1_MixedAggregation() {
    _ctx = { step: 1, stepName: 'Agrégation', file: 'course-formatter.js', module: 'parcours', source: 'formatCourseForDocument' };
    console.group('Étape 1 : agrégation mixte (4 activités)');
    const t0 = performance.now();

    const activities = [];
    for (const entry of MIXED_COURSE_FIXTURES) {
        activities.push({ moduleKey: entry.moduleKey, jsonData: await loadFixture(entry.fixture) });
    }

    const course = {
        title: 'Parcours de révision — Mathématiques & Histoire',
        description: '<p>Un parcours <strong>complet</strong> pour réviser.</p>',
        activities
    };
    const result = await formatCourseForDocument(course, { keepLatex: true });

    // Structure générale
    assert(result && typeof result === 'object', 'Le résultat est un objet');
    assert(result.title === course.title, 'Le titre du parcours est repris tel quel',
        { attendu: course.title, obtenu: result.title });
    assert(Array.isArray(result.sections) && result.sections.length > 0, 'sections est un tableau non vide');

    // Types de sections : tous valides, aucun flashcardTable
    const types = [...new Set(result.sections.map(s => s.type))];
    const invalid = types.filter(ty => !MERGED_SECTION_TYPES.includes(ty));
    assert(invalid.length === 0, 'Tous les types de sections sont consommables par les 3 builders',
        { typesInvalides: invalid, typesPresents: types });
    assert(!types.includes('flashcardTable'), 'Aucune section flashcardTable ne subsiste (sinon builders détournés)');

    // Page de garde
    const first = result.sections[0];
    assert(first && first.type === 'header' && first.level === 1 && first.text === course.title,
        'La première section est le titre du parcours (header niveau 1)',
        { obtenu: first });
    const descSection = result.sections.find(s => s.type === 'paragraph' && s.text && s.text.includes('complet'));
    assert(!!descSection, 'La description figure sur la page de garde');
    assert(descSection && !/<[^>]+>/.test(descSection.text), 'Les balises HTML de la description sont retirées',
        { texte: descSection ? descSection.text : null });
    const expectedCount = t('doc_fmt_course_activities_count').replace('{n}', '4');
    const countSection = result.sections.find(s => s.type === 'paragraph' && s.text === expectedCount);
    assert(!!countSection, 'Le nombre d\'activités (4) figure sur la page de garde',
        { attendu: expectedCount });

    // Sommaire : les bulletPoints avant le premier pageBreak
    const firstBreak = result.sections.findIndex(s => s.type === 'pageBreak');
    assert(firstBreak > 0, 'Un saut de page sépare la page de garde du premier chapitre');
    const cover = result.sections.slice(0, firstBreak);
    const tocEntries = cover.filter(s => s.type === 'bulletPoint');
    assert(tocEntries.length === 4, 'Le sommaire liste les 4 activités',
        { obtenu: tocEntries.map(s => s.text) });
    tocEntries.forEach((entry, i) => {
        assert(entry.text.startsWith(`${i + 1}. `), `L'entrée ${i + 1} du sommaire est numérotée « ${i + 1}. »`,
            { texte: entry.text });
    });
    assert(cover.some(s => s.type === 'header' && s.level === 2 && s.text === t('doc_fmt_course_toc')),
        'Le sommaire a un titre (header niveau 2, libellé i18n)');

    // Chapitres : un header niveau 1 numéroté par activité, aligné sur le sommaire
    const chapterHeaders = result.sections.filter(s => s.type === 'header' && s.level === 1 && /^\d+\. /.test(s.text || ''));
    assert(chapterHeaders.length === 4, 'Chaque activité a un titre de chapitre numéroté',
        { obtenus: chapterHeaders.map(s => s.text) });
    chapterHeaders.forEach((h, i) => {
        assert(h.text === tocEntries[i].text, `Le titre du chapitre ${i + 1} correspond à l'entrée du sommaire`,
            { chapitre: h.text, sommaire: tocEntries[i] ? tocEntries[i].text : null });
    });

    // Sauts de page : au moins un par chapitre, jamais deux consécutifs, pas en fin
    const breakCount = result.sections.filter(s => s.type === 'pageBreak').length;
    assert(breakCount >= 4, 'Au moins un saut de page par chapitre', { obtenu: breakCount });
    let doubles = 0;
    for (let i = 1; i < result.sections.length; i++) {
        if (result.sections[i].type === 'pageBreak' && result.sections[i - 1].type === 'pageBreak') doubles++;
    }
    assert(doubles === 0, 'Aucun double saut de page (pas de pages blanches)', { doubles });
    assert(result.sections[result.sections.length - 1].type !== 'pageBreak', 'Pas de saut de page final orphelin');

    // Le contenu pédagogique des activités est bien présent
    const allText = JSON.stringify(result.sections);
    assert(allText.includes('racine carrée de 16'), 'Le contenu des flashcards est présent (recto carte 1)');

    recordTiming('Agrégation', 'Parcours mixte 4 activités', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : CONVERSION FLASHCARDTABLE
// =======================================================================

async function runStep2_FlashcardConversion() {
    _ctx = { step: 2, stepName: 'Flashcards', file: 'course-formatter.js', module: 'parcours', source: 'convertFlashcardTables' };
    console.group('Étape 2 : conversion flashcardTable → tableau standard');
    const t0 = performance.now();

    // --- Flashcards (tip au recto uniquement) ---
    const flashData = await loadFixture('flashcards_1.json');
    const flashCourse = await formatCourseForDocument({
        title: 'Cartes seules',
        activities: [{ moduleKey: 'Flashcards', jsonData: flashData }]
    });

    const tables = flashCourse.sections.filter(s => s.type === 'table');
    assert(tables.length === 1, 'Les pages recto/verso sont fusionnées en un seul tableau',
        { obtenu: tables.length });
    const table = tables[0];
    assert(table && table.rows.length === flashData.cards.length,
        `Le tableau a une ligne par carte (${flashData.cards.length})`,
        { lignes: table ? table.rows.length : null });
    assert(table && table.headers.length === 4, 'Colonne Indice présente (les cartes ont des tips)',
        { headers: table ? table.headers : null });
    if (table && table.rows.length > 0) {
        const row1 = table.rows[0];
        assert(row1[0] === '1', 'Colonne 1 : numéro de carte');
        assert(String(row1[1]).includes('racine carrée de 16'), 'Colonne 2 : recto (question)',
            { obtenu: row1[1] });
        assert(String(row1[2]) === '4', 'Colonne 3 : verso (réponse)', { obtenu: row1[2] });
        assert(String(row1[3] || '').length > 0, 'Colonne 4 : indice non vide', { obtenu: row1[3] });
    }
    assert(table && table.style === 'recapTable', 'Style de tableau lisible dans les 3 builders (recapTable)');

    // --- Dialog Cards (tips recto ET verso possibles) ---
    const dialogData = await loadFixture('dialog_cards_1.json');
    const dialogCourse = await formatCourseForDocument({
        title: 'Dialogues',
        activities: [{ moduleKey: 'DialogCards', jsonData: dialogData }]
    });
    const dTables = dialogCourse.sections.filter(s => s.type === 'table');
    assert(dTables.length === 1, 'Dialog Cards : fusion en un seul tableau');
    const dialogCards = dialogData.dialogs || dialogData.cards || [];
    assert(dTables[0] && dTables[0].rows.length === dialogCards.length,
        `Dialog Cards : une ligne par carte (${dialogCards.length})`,
        { lignes: dTables[0] ? dTables[0].rows.length : null });
    assert(!dialogCourse.sections.some(s => s.type === 'flashcardTable'),
        'Dialog Cards : aucune flashcardTable résiduelle');

    // --- Image de carte → cellule-objet { text, imageUrl } (résolue par prepareImages) ---
    const withImage = {
        title: 'Cartes illustrées',
        cards: [
            { text: 'Quelle est cette forme ?', answer: 'Un carré', image: { path: 'images/carre.png' } },
            { text: 'Et celle-ci ?', answer: 'Un cercle' }
        ]
    };
    const imgCourse = await formatCourseForDocument({
        title: 'Avec images',
        activities: [{ moduleKey: 'Flashcards', jsonData: withImage }]
    });
    const imgTable = imgCourse.sections.find(s => s.type === 'table');
    const rectoCell = imgTable ? imgTable.rows[0][1] : null;
    assert(rectoCell && typeof rectoCell === 'object' && rectoCell.imageUrl === 'images/carre.png',
        'L\'image du recto est portée par une cellule-objet { text, imageUrl }',
        { cellule: rectoCell });
    const rectoCellSansImage = imgTable ? imgTable.rows[1][1] : null;
    assert(typeof rectoCellSansImage === 'string', 'Une carte sans image reste une cellule texte simple',
        { cellule: rectoCellSansImage });

    // --- Pass-through : des sections sans flashcardTable ressortent intactes ---
    const plain = [
        { type: 'header', level: 1, text: 'Titre' },
        { type: 'paragraph', text: 'Texte' }
    ];
    const converted = convertFlashcardTables(plain);
    assert(converted.length === 2 && converted[0].text === 'Titre' && converted[1].text === 'Texte',
        'Sans flashcardTable, les sections sont inchangées');
    assert(converted !== plain, 'La conversion retourne une copie (pas de mutation du tableau source)');

    recordTiming('Flashcards', 'Conversions (3 jeux de cartes)', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : OPTION keepLatex
// =======================================================================

async function runStep3_KeepLatex() {
    _ctx = { step: 3, stepName: 'LaTeX', file: 'course-formatter.js', module: 'parcours', source: 'formatCourseForDocument' };
    console.group('Étape 3 : propagation de keepLatex');
    const t0 = performance.now();

    const formulas = await loadFixture('quiz_qcm_formules_test.json');
    const course = { title: 'Formules', activities: [{ moduleKey: 'QuizSetQCM', jsonData: formulas }] };

    // keepLatex:true (voie DOCX/ODT) : le LaTeX \(...\) doit survivre
    const kept = await formatCourseForDocument(course, { keepLatex: true });
    const keptText = JSON.stringify(kept.sections);
    assert(keptText.includes('\\\\('), 'keepLatex:true — les formules \\(...\\) sont conservées pour OMML/MathML');

    // défaut (voie PDF jsPDF) : conversion LaTeX → Unicode par postProcessLatex
    const converted = await formatCourseForDocument(course);
    const convertedText = JSON.stringify(converted.sections);
    assert(!convertedText.includes('\\\\('), 'défaut — les formules sont converties en Unicode (aucun \\( résiduel)');

    recordTiming('LaTeX', 'Formules (2 passes)', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : ROBUSTESSE
// =======================================================================

async function runStep4_Robustness() {
    _ctx = { step: 4, stepName: 'Robustesse', file: 'course-formatter.js', module: 'parcours', source: 'formatCourseForDocument' };
    console.group('Étape 4 : robustesse');
    const t0 = performance.now();

    // Parcours vide ou invalide → erreur explicite
    for (const [label, bad] of [['activités vides', { title: 'X', activities: [] }], ['course null', null], ['sans activities', { title: 'X' }]]) {
        let threw = false;
        try {
            await formatCourseForDocument(bad);
        } catch (e) {
            threw = true;
        }
        assert(threw, `Parcours invalide (${label}) → exception`);
    }

    // Type inconnu → repli formatGeneric, l'agrégation ne casse pas
    const generic = await formatCourseForDocument({
        title: 'Type inconnu',
        activities: [{ moduleKey: 'TypeInconnuXYZ', jsonData: { title: 'Mystère', contenu: 'valeur' } }]
    });
    assert(Array.isArray(generic.sections) && generic.sections.length > 0,
        'Un moduleKey inconnu passe par le repli générique sans casser l\'agrégation');
    const genericTypes = [...new Set(generic.sections.map(s => s.type))];
    assert(genericTypes.every(ty => MERGED_SECTION_TYPES.includes(ty)),
        'Repli générique : types de sections valides', { types: genericTypes });

    // Titre d'activité fourni par l'appelant : prime sur le titre du JSON
    const quiz = await loadFixture('quiz_qcm_1.json');
    const custom = await formatCourseForDocument({
        title: 'Priorités de titres',
        activities: [{ moduleKey: 'QuizSetQCM', jsonData: quiz, title: 'Mon titre de collection' }]
    });
    const customHeader = custom.sections.find(s => s.type === 'header' && s.level === 1 && /^1\. /.test(s.text || ''));
    assert(!!customHeader && customHeader.text === '1. Mon titre de collection',
        'Le titre fourni par l\'appelant prime sur celui du JSON',
        { obtenu: customHeader ? customHeader.text : null });

    // Titre de parcours absent → libellé i18n de repli
    const untitled = await formatCourseForDocument({
        activities: [{ moduleKey: 'QuizSetQCM', jsonData: quiz }]
    });
    assert(untitled.title === t('doc_fmt_course_default_title'),
        'Sans titre de parcours, le libellé i18n de repli est utilisé',
        { obtenu: untitled.title });

    recordTiming('Robustesse', 'Cas limites (6 scénarios)', performance.now() - t0);
    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Agrégation',
    'Flashcards',
    'LaTeX',
    'Robustesse'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Agrège un parcours mixte de 4 activités (QCM, Flashcards, Mots croisés, Page) et valide page de garde, sommaire, chapitres numérotés, sauts de page et types de sections.',
    'Vérifie la conversion des sections flashcardTable (layout d\'impression) en tableau standard : une ligne par carte, colonnes Recto/Verso/Indice, images en cellules-objets.',
    'Vérifie que keepLatex:true préserve les formules \\(...\\) (DOCX/ODT) et que le défaut les convertit en Unicode (PDF).',
    'Parcours vide → exception ; type inconnu → repli générique ; priorité des titres ; libellé i18n de repli.'
];

/**
 * Lance tous les tests d'export de parcours.
 */
export async function runAllTests() {
    console.log('=== Tests Export Parcours Caramel (4 étapes) ===');
    // Les libellés de page de garde/sommaire viennent des locales (les
    // defaultTranslations inline ne portent pas les clés doc_fmt_*).
    await loadTranslations('fr');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_MixedAggregation();
    await runStep2_FlashcardConversion();
    await runStep3_KeepLatex();
    await runStep4_Robustness();

    const t1 = performance.now();
    recordTiming('Global', 'Tous les tests parcours', t1 - t0);

    console.log(`\n=== Résultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
