/**
 * run_heal_rules_tests.mjs — Registre des règles de healing (`js/h5p/json-healer.js`).
 *
 * `healStructureForActivity` dispatchait auparavant via une chaîne de 28
 * `if (moduleKey === '…')` séquentiels dans une fonction de 868 lignes. Les 28
 * conditions étaient évaluées à chaque appel, et RIEN ne garantissait qu'une
 * activité déclarée dans `definitions.js` ait bien une règle — l'oubli ne se
 * voyait qu'à l'usage, sur une sortie LLM mal réparée.
 *
 * Le registre `HEAL_RULES` rend ces invariants vérifiables. Ce fichier teste :
 *   1. EXHAUSTIVITÉ — toute clé enregistrée existe dans `definitions.js`, et toute
 *      activité SANS règle est listée explicitement ci-dessous (liste blanche).
 *   2. CONTRAT — les règles mutent en place, ne renvoient rien, et le healer ne
 *      modifie jamais l'objet d'entrée (clone défensif).
 *   3. ROBUSTESSE — entrées dégradées (null, tableau, clé inconnue) sans exception.
 *
 * Lancement :  node tests/run_heal_rules_tests.mjs
 */
import './roundtrip/bootstrap.mjs';
const { healStructureForActivity, HEALED_MODULE_KEYS, healActivitySpecificFields } = await import('../js/h5p/json-healer.js');
const { h5pModules, moodleModules, allModules } = await import('../js/core/definitions.js');

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}

// =======================================================================
// 1. EXHAUSTIVITÉ
// =======================================================================

/**
 * Activités déclarées dans `definitions.js` qui n'ont VOLONTAIREMENT pas de règle
 * de healing dédiée : leur structure sort déjà correcte du LLM, ou elles sont
 * entièrement prises en charge par le préambule commun / leur processeur.
 *
 * ⚠️ Si ce test échoue après l'ajout d'une activité, c'est le signal utile :
 * décider explicitement « pas de healing » (ajouter ici) ou écrire la règle.
 */
const SANS_REGLE_DEDIEE = new Set([
    // H5P — pris en charge par le bloc « H5P commun » (overallFeedback/behaviour)
    // puis par leur processeur ; aucune réparation structurelle spécifique requise.
    'Glossary', 'DragTheWords', 'FillInTheBlanks', 'MarkTheWords', 'ComplexFillTheBlanks',
    'FindTheHotspot', 'FindMultipleHotspots', 'ImageHotspots',
    // Moodle/Éléa — structure produite par leur processeur
    'test_elea', 'glossaireXml',
    // `gift` n'est pas une activité générée : c'est un FORMAT d'export du Test Éléa
    // (`hidden: true`, `formats: ['GIFT']`). Rien à réparer côté structure JSON.
    'gift'
]);

{
    eq('HEALED_MODULE_KEYS est exporté et non vide', HEALED_MODULE_KEYS.length > 0, true);

    // 1a. Aucune clé en double dans le registre
    const dupes = HEALED_MODULE_KEYS.filter((k, i) => HEALED_MODULE_KEYS.indexOf(k) !== i);
    eq('registre : aucune clé en double', dupes, []);

    // 1b. Toute clé enregistrée correspond à une activité RÉELLE
    const known = new Set(Object.keys(allModules));
    const orphelines = HEALED_MODULE_KEYS.filter(k => !known.has(k));
    eq('registre : aucune règle orpheline (clé inconnue de definitions.js)', orphelines, []);

    // 1c. Toute activité a soit une règle, soit une place dans la liste blanche
    const withRule = new Set(HEALED_MODULE_KEYS);
    const manquantes = Object.keys(allModules)
        .filter(k => !withRule.has(k) && !SANS_REGLE_DEDIEE.has(k));
    eq('toute activité a une règle OU figure dans SANS_REGLE_DEDIEE', manquantes, []);

    // 1d. La liste blanche ne contient pas de clé fantôme
    const blancheFantome = [...SANS_REGLE_DEDIEE].filter(k => !known.has(k));
    eq('SANS_REGLE_DEDIEE : aucune clé fantôme', blancheFantome, []);

    // 1e. …ni de clé qui a en fait une règle (liste blanche périmée)
    const blancheEnTrop = [...SANS_REGLE_DEDIEE].filter(k => withRule.has(k));
    eq('SANS_REGLE_DEDIEE : aucune clé ayant en réalité une règle', blancheEnTrop, []);

    console.log(`   ${HEALED_MODULE_KEYS.length} clés avec règle | ${SANS_REGLE_DEDIEE.size} sans règle assumée | ${Object.keys(allModules).length} activités au total`);
}

// =======================================================================
// 2. CONTRAT DU HEALER
// =======================================================================
{
    // 2a. L'entrée n'est JAMAIS mutée (clone défensif via structuredClone)
    const input = { questions: [{ library: 'H5P.MultipleChoice' }], title: 'T' };
    const snapshot = JSON.stringify(input);
    healStructureForActivity(input, 'QuizSet');
    eq('healStructureForActivity ne mute pas son entrée', JSON.stringify(input), snapshot);

    // 2b. La sortie est un objet distinct
    const out = healStructureForActivity(input, 'QuizSet');
    ok('la sortie est un objet distinct de l\'entrée', out !== input);

    // 2c. Le préambule H5P commun est appliqué à tous les types H5P
    for (const key of ['QuizSet', 'MultipleChoice', 'TrueFalse', 'Crossword', 'Summary']) {
        const r = healStructureForActivity({}, key);
        ok(`${key} : overallFeedback posé par le préambule`, Array.isArray(r.overallFeedback));
        ok(`${key} : behaviour posé par le préambule`, !!r.behaviour);
    }

    // 2d. Un type NON-H5P ne reçoit pas le préambule H5P
    const page = healStructureForActivity({ blocks: [] }, 'Page');
    ok('Page (Moodle) : pas d\'overallFeedback ajouté', page.overallFeedback === undefined);

    // 2e. Les deux coercitions de forme du préambule (tableau nu des IA externes)
    const iv = healStructureForActivity([{ timestamp: 1 }], 'InteractiveVideo');
    ok('InteractiveVideo : tableau nu enveloppé en { interactions }', Array.isArray(iv.interactions));
    eq('InteractiveVideo : contenu du tableau préservé', iv.interactions.length, 1);

    const dict = healStructureForActivity([{ text: 'a' }], 'Dictation');
    ok('Dictation : tableau nu enveloppé en { sentences }', Array.isArray(dict.sentences));
    eq('Dictation : contenu du tableau préservé', dict.sentences.length, 1);
    // …et le préambule H5P s'applique APRÈS l'enveloppement (sinon perdu)
    ok('Dictation : overallFeedback posé sur l\'objet, pas sur le tableau',
        Array.isArray(dict.overallFeedback));
}

// =======================================================================
// 3. ROBUSTESSE — aucune règle ne doit lever sur une entrée dégradée
// =======================================================================
{
    const DEGRADEES = [
        {}, { questions: [] }, { questions: null }, { content: [] },
        { chapters: [] }, { slides: [] }, { cards: [] }, { words: [] },
        { sentences: [] }, { blocks: [] }, { interactions: [] },
        { questions: [{}] }, { answers: [] }, { statements: [] },
        { criteria: [] }, { elements: [] }, { rows: [] }
    ];

    let threw = 0;
    const details = [];
    for (const key of HEALED_MODULE_KEYS) {
        for (const input of DEGRADEES) {
            try {
                healStructureForActivity(structuredClone(input), key);
            } catch (e) {
                threw++;
                if (details.length < 8) details.push(`${key} + ${JSON.stringify(input)} → ${e.message}`);
            }
        }
    }
    eq(`aucune règle ne lève sur ${DEGRADEES.length} entrées dégradées × ${HEALED_MODULE_KEYS.length} clés`, threw, 0);
    if (details.length) failures.push('   ' + details.join('\n   '));

    // Entrées non-objet : renvoyées telles quelles (garde de tête)
    eq('null renvoyé tel quel', healStructureForActivity(null, 'QuizSet'), null);
    eq('undefined renvoyé tel quel', healStructureForActivity(undefined, 'QuizSet'), undefined);
    eq('chaîne renvoyée telle quelle', healStructureForActivity('x', 'QuizSet'), 'x');
    eq('nombre renvoyé tel quel', healStructureForActivity(42, 'QuizSet'), 42);

    // Clé de module inconnue : pas de règle → sortie = clone du préambule
    let unknownThrew = false;
    let unknown;
    try { unknown = healStructureForActivity({ a: 1 }, 'ModuleQuiNExistePas'); }
    catch { unknownThrew = true; }
    ok('clé inconnue : aucune exception', !unknownThrew);
    eq('clé inconnue : données préservées', unknown?.a, 1);
    ok('clé inconnue : pas de préambule H5P', unknown?.overallFeedback === undefined);

    // Clé vide / non-chaîne
    for (const k of ['', null, undefined, 0]) {
        let t = false;
        try { healStructureForActivity({ a: 1 }, k); } catch { t = true; }
        ok(`clé ${JSON.stringify(k)} : aucune exception`, !t);
    }
}

// =======================================================================
// 4. NON-CONTAMINATION entre règles
//    Une règle ne doit agir QUE pour sa propre clé : c'était le risque de la
//    chaîne d'`if` séquentiels, où deux branches pouvaient matcher la même clé.
// =======================================================================
{
    // Marqueurs typiques posés par certaines règles
    const PROBES = [
        ['QuizSet', 'progressType'],
        ['Crossword', 'words'],
        ['Chart', 'listOfTypes']
    ];
    for (const [owner, marker] of PROBES) {
        const own = healStructureForActivity({}, owner);
        const foreign = healStructureForActivity({}, 'TrueFalse');
        if (own[marker] !== undefined) {
            ok(`${marker} posé par ${owner}`, own[marker] !== undefined);
            ok(`${marker} NON posé par TrueFalse`, foreign[marker] === undefined,
                `TrueFalse a reçu ${marker}=${JSON.stringify(foreign[marker])}`);
        } else {
            pass++; // le marqueur n'est pas posé sur entrée vide : sonde non applicable
        }
    }
}

// =======================================================================
// 4. VIRGULE DÉCIMALE LaTeX DANS LES TROUS (parcours réel, 1er oct. 2026)
// =======================================================================
// `*37{,}5*` : l'élève qui tape « 37,5 » était compté faux. Hors formule, la virgule
// LaTeX redevient une virgule ; dans \(…\), c'est du LaTeX juste, on n'y touche pas.
{
    const trous = healActivitySpecificFields({ text: 'Complète.', questions: [
        'Il a parcouru 45 km en *37{,}5* min.',
        'Cinq stylos coûtent *12{,}50* € ; trois coûtent 7{,}50 €.',
        'La formule \\( v = 37{,}5 \\) reste du LaTeX, et *3* est un trou.',
    ] }, 'FillInTheBlanks');
    eq('trous : la virgule LaTeX redevient une virgule, dans le trou et dans la phrase', trous.questions.slice(0, 2),
        ['Il a parcouru 45 km en *37,5* min.', 'Cinq stylos coûtent *12,50* € ; trois coûtent 7,50 €.']);
    ok('trous : dans une formule, la virgule LaTeX reste', trous.questions[2].includes('\\( v = 37{,}5 \\)'), trous.questions[2]);
    const glisser = healActivitySpecificFields({ taskDescription: 'Glisse.', textField: 'Le prix est de *12{,}50* €.' }, 'DragTheWords');
    eq('glisser : la virgule LaTeX d’un mot à glisser redevient une virgule', glisser.textField, 'Le prix est de *12,50* €.');
    const quiz = healActivitySpecificFields({ questions: [{ library: 'H5P.Blanks 1.14', params: { text: 'Complète.', questions: ['x = *2{,}5*'] } }] }, 'QuizSet');
    eq('quiz : la virgule LaTeX d’un Texte à trous du quiz aussi', quiz.questions[0].params.questions, ['x = *2,5*']);
}

// =======================================================================
// Bilan
// =======================================================================
console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`heal-rules : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
