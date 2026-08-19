/**
 * run_validators_rules_tests.mjs — Registre des validations par type
 * (`js/editor/validators.js`).
 *
 * `getTypeSpecificErrors` dispatchait auparavant via une chaîne de 27
 * `if (moduleKey === '…')` séquentiels dans une fonction de 676 lignes. Les 27
 * conditions étaient évaluées à chaque frappe de l'éditeur, et RIEN ne garantissait
 * qu'une activité déclarée dans `definitions.js` ait une validation — l'oubli ne se
 * voyait qu'à l'usage, sur un contenu vide sauvegardé sans avertissement.
 *
 * Le registre `TYPE_RULES` rend ces invariants vérifiables. Ce fichier teste :
 *   1. EXHAUSTIVITÉ — toute clé enregistrée existe dans `definitions.js` (aux alias
 *      Éléa près), et toute activité SANS validation est listée explicitement.
 *   2. CONTRAT — les règles poussent dans `errors`, ne retournent rien, ne mutent
 *      pas `data`, et produisent des erreurs bien formées `{path, field, message}`.
 *   3. ROBUSTESSE — schéma absent, `_moduleKey` inconnu, données dégradées, et clés
 *      héritées d'`Object.prototype` (`constructor`, `toString`…) sans exception.
 *
 * Complément indispensable : `node tests/run_validators_oracle.mjs`, qui gèle le
 * COMPORTEMENT (quelles erreurs, dans quel ordre) sur 6280 évaluations.
 *
 * Lancement :  node tests/run_validators_rules_tests.mjs
 */
import { installIdentitySanitizer } from './roundtrip/bootstrap.mjs';
await installIdentitySanitizer();

const { getValidationErrors, validateSchema, VALIDATED_MODULE_KEYS } =
    await import('../js/editor/validators.js');
const { allModules } = await import('../js/core/definitions.js');

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}
/** Schéma minimal : `sections: []` neutralise la validation par champ, isolant TYPE_RULES. */
const sch = (moduleKey) => ({ _moduleKey: moduleKey, sections: [] });

console.log('\n=== 1. EXHAUSTIVITÉ ===');

/**
 * Clés enregistrées qui n'existent PAS dans `definitions.js` : uniquement les alias
 * Éléa (`elea_*`), qui désignent la même activité côté éditeur.
 */
const ALIAS_ELEA = new Set(['elea_livre']);

/**
 * Activités déclarées dans `definitions.js` sans validation pédagogique dédiée.
 *
 * ⚠️ Si ce test échoue après l'ajout d'une activité, c'est le signal utile : décider
 * explicitement « pas de validation » (ajouter ici) ou écrire la règle.
 */
const SANS_VALIDATION_DEDIEE = new Set([
    // Contenus dont un état « vide » reste un contenu valide (pas de minimum
    // pédagogique opposable) : le healing et le processeur suffisent.
    'Glossary', 'Dictation', 'InteractiveVideo', 'Devoir',
    // Test Éléa : la validation vit dans son propre simulateur/processeur.
    'test_elea',
    // `gift` n'est pas une activité générée : c'est un FORMAT d'export du Test Éléa
    // (`hidden: true`). Aucun contenu propre à valider.
    'gift'
]);

{
    ok('VALIDATED_MODULE_KEYS est exporté et non vide', VALIDATED_MODULE_KEYS.length > 0);
    ok('VALIDATED_MODULE_KEYS est gelé', Object.isFrozen(VALIDATED_MODULE_KEYS));

    const known = new Set(Object.keys(allModules));
    const withRule = new Set(VALIDATED_MODULE_KEYS);

    const fantomes = VALIDATED_MODULE_KEYS.filter(k => !known.has(k) && !ALIAS_ELEA.has(k));
    eq('toute clé enregistrée existe dans definitions.js (ou est un alias Éléa)', fantomes, []);

    const manquantes = Object.keys(allModules)
        .filter(k => !withRule.has(k) && !SANS_VALIDATION_DEDIEE.has(k));
    eq('toute activité a une validation OU figure dans SANS_VALIDATION_DEDIEE', manquantes, []);

    const blancheFantome = [...SANS_VALIDATION_DEDIEE].filter(k => !known.has(k));
    eq('SANS_VALIDATION_DEDIEE : aucune clé fantôme', blancheFantome, []);

    const blancheEnTrop = [...SANS_VALIDATION_DEDIEE].filter(k => withRule.has(k));
    eq('SANS_VALIDATION_DEDIEE : aucune clé ayant en réalité une validation', blancheEnTrop, []);

    const aliasFantome = [...ALIAS_ELEA].filter(k => !withRule.has(k));
    eq('ALIAS_ELEA : tous les alias sont bien enregistrés', aliasFantome, []);

    // Doublons : le registre est un objet, un doublon serait silencieusement écrasé.
    eq('VALIDATED_MODULE_KEYS sans doublon',
        VALIDATED_MODULE_KEYS.length, new Set(VALIDATED_MODULE_KEYS).size);

    console.log(`   ${VALIDATED_MODULE_KEYS.length} clés avec validation | `
        + `${SANS_VALIDATION_DEDIEE.size} sans validation assumée | `
        + `${Object.keys(allModules).length} activités au total`);
}

console.log('\n=== 2. CONTRAT ===');

{
    // Les alias partagent la MÊME règle que leur clé canonique : la table doit le
    // rendre vrai, pas seulement le suggérer.
    const paires = [
        ['QuizSet', 'QuizSetQCM'], ['QuizSet', 'QuizSetVF'],
        ['Livre', 'elea_livre'],
        ['FindTheHotspot', 'FindMultipleHotspots'],
        ['FillInTheBlanks', 'ComplexFillTheBlanks']
    ];
    const echantillons = [
        {}, { questions: [] }, { questions: [{}] }, { chapters: [] }, { hotspots: [] }
    ];
    for (const [a, b] of paires) {
        let identique = true;
        for (const d of echantillons) {
            const ea = getValidationErrors(structuredClone(d), sch(a));
            const eb = getValidationErrors(structuredClone(d), sch(b));
            if (JSON.stringify(ea) !== JSON.stringify(eb)) identique = false;
        }
        ok(`${a} et ${b} partagent la même règle`, identique);
    }

    // Aucune règle ne doit MUTER les données validées : l'éditeur appelle
    // getValidationErrors à chaque frappe sur l'objet vivant.
    let mutations = [];
    for (const key of VALIDATED_MODULE_KEYS) {
        for (const d of [
            { questions: [{ library: null, answers: [{ correct: false }] }], answers: [{ correct: false }] },
            { hotspots: [{ content: [{ type: 'text', text: '' }] }] },
            { chapters: [{ content: [{ type: 'image', image: null }] }] },
            { cards: [{}], dialogs: [{}], slides: [{ elements: [] }], textField: 'sans trou' }
        ]) {
            const avant = JSON.stringify(d);
            getValidationErrors(d, sch(key));
            if (JSON.stringify(d) !== avant) mutations.push(key);
        }
    }
    eq('aucune règle ne mute les données validées', [...new Set(mutations)], []);

    // Forme des erreurs produites.
    let malformees = 0, total = 0;
    for (const key of VALIDATED_MODULE_KEYS) {
        for (const errs of [
            getValidationErrors({}, sch(key)),
            getValidationErrors({ questions: [{}], hotspots: [{ content: [{}] }] }, sch(key)),
            getValidationErrors({ chapters: [{ content: [{}] }], cards: [{}] }, sch(key))
        ]) {
            ok(`${key} : getValidationErrors retourne un tableau`, Array.isArray(errs));
            for (const e of errs) {
                total++;
                const bon = e && typeof e === 'object'
                    && typeof e.path === 'string'
                    && typeof e.message === 'string' && e.message.length > 0
                    && e.field !== undefined && e.field !== null;
                if (!bon) { malformees++; failures.push(`   erreur malformée (${key}) : ${JSON.stringify(e)}`); }
            }
        }
    }
    eq('toutes les erreurs produites sont {path, field, message} bien formées', malformees, 0);
    console.log(`   ${total} erreurs inspectées sur ${VALIDATED_MODULE_KEYS.length} clés`);

    // validateSchema est bien le miroir booléen de getValidationErrors.
    let miroir = true;
    for (const key of VALIDATED_MODULE_KEYS) {
        for (const d of [{}, { questions: [{ library: 'X' }] }]) {
            const errs = getValidationErrors(structuredClone(d), sch(key));
            if (validateSchema(structuredClone(d), sch(key)) !== (errs.length === 0)) miroir = false;
        }
    }
    ok('validateSchema(d, s) === (getValidationErrors(d, s).length === 0)', miroir);
}

console.log('\n=== 3. ROBUSTESSE ===');

{
    // Le garde `if (!schema || !schema.sections) return errors;` doit tenir.
    eq('schéma null → []', getValidationErrors({}, null), []);
    eq('schéma undefined → []', getValidationErrors({}, undefined), []);
    eq('schéma sans sections → []', getValidationErrors({}, { _moduleKey: 'QuizSet' }), []);

    // Clé inconnue : aucune règle, seules les validations transversales s'appliquent.
    eq('clé inconnue → aucune erreur de type', getValidationErrors({}, sch('__inexistant__')), []);
    eq('_moduleKey absent → aucune erreur de type', getValidationErrors({}, { sections: [] }), []);

    // Prototype nul : `constructor`, `toString`, `__proto__` ne doivent pas résoudre
    // vers une méthode héritée d'Object (qui serait appelée comme une règle).
    for (const empoisonnee of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']) {
        let leve = null, res;
        try { res = getValidationErrors({ questions: [{}] }, sch(empoisonnee)); }
        catch (e) { leve = e; }
        ok(`_moduleKey='${empoisonnee}' ne lève pas`, leve === null, leve?.message);
        ok(`_moduleKey='${empoisonnee}' ne produit aucune erreur de type`,
            Array.isArray(res) && res.length === 0, JSON.stringify(res));
    }

    // Données dégradées sur TOUTES les clés : aucune exception ne doit remonter,
    // sinon l'éditeur casse au lieu d'afficher un message.
    const DEGRADEES = [
        {}, { questions: null }, { questions: 'texte' }, { questions: [null] },
        { answers: 0 }, { hotspots: {} }, { hotspots: [null] },
        { chapters: 'x' }, { chapters: [{ content: null }] }, { chapters: [null] },
        { cards: [null] }, { dialogs: [null] }, { slides: [null] },
        { slides: [{ elements: null }] }, { textField: null }, { textField: 12 },
        { elements: null, dropZones: null }, { words: 'a' },
        Object.create(null)
    ];
    let exceptions = [];
    for (const key of [...VALIDATED_MODULE_KEYS, '', '__inconnu__']) {
        for (const d of DEGRADEES) {
            try { getValidationErrors(structuredClone(d), sch(key)); }
            catch (e) { exceptions.push(`${key} ← ${JSON.stringify(d)} : ${e.message}`); }
        }
    }
    eq('aucune exception sur données dégradées', exceptions.slice(0, 5), []);
    console.log(`   ${(VALIDATED_MODULE_KEYS.length + 2) * DEGRADEES.length} combinaisons dégradées traversées`);

    // `data` non-objet : l'éditeur ne devrait jamais l'envoyer, mais le garde manque.
    for (const d of [null, undefined]) {
        let leve = null;
        try { getValidationErrors(d, sch('QuizSet')); } catch (e) { leve = e; }
        ok(`data=${d} lève (comportement historique documenté, non modifié)`, leve !== null);
    }
}

console.log('\n========================================');
console.log(`validators — registre : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail) { console.log(failures.join('\n')); process.exit(1); }
console.log('✅ Tous les tests passent.');
