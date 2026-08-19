/**
 * Scénario (f) — un QCM sans aucune réponse ne doit pas être enregistrable.
 *
 * Défaut trouvé pendant la campagne de validation de la 6.3.0, corrigé depuis.
 *
 * Cause racine : `validateField` sortait par « si vide et pas required, pas d'autres
 * validations » AVANT de mesurer `minItems`. Or les 5 déclarations de `answers` portent
 * `minItems: 2` et **pas** `required` — la contrainte de cardinalité EST l'exigence. La
 * règle ne se déclenchait donc que sur un tableau déjà non vide : `answers` à 1 élément
 * était signalé, `answers` absent ou `[]` passait en silence. Le trou était exactement à
 * zéro. Correctif : exception `exigeDesElements` + suppression de la garde
 * `Array.isArray(value)` sur le bloc « Array validations ».
 *
 * Le trou PRÉEXISTAIT à la 6.3.0 ; il est devenu atteignable parce que l'auto-titrage des
 * conteneurs a retiré le blocage accidentel sur `metadata.title` qui le masquait.
 *
 * Le scénario contrôle aussi le revers : un champ MASQUÉ par `showWhen` ne doit pas se
 * mettre à bloquer (les `answers` d'une interaction non-QCM, le `table` d'une diapositive
 * « titre ») — c'est le faux positif qu'une première version du correctif avait produit.
 */
import { navigateur, bloc, titre } from './lib.mjs';

const { b, p } = await navigateur();
bloc('(f) QCM sans aucune réponse — non-régression');
let rouge = 0;
const verdict = (ok, vrai, faux) => { console.log(`  ${ok ? '✅' : '❌'} ${ok ? vrai : faux}`); if (!ok) rouge++; };

titre('la cardinalité est-elle mesurée sur TOUS les états de « answers » ?');
const cas = await p.evaluate(async () => {
    const { getValidationErrors } = await import('/js/editor/validators.js');
    const { getSchemaForType } = await import('/js/editor/content-detector.js');
    const S = getSchemaForType('QuizSet');
    const Q = (n, sup = {}) => ({
        library: 'H5P.MultiChoice 1.16', metadata: { title: 'Q' + n },
        params: { question: 'Énoncé ' + n, ...sup }
    });
    const REP = { answers: [{ text: 'a', correct: true }, { text: 'b', correct: false }] };
    const jeu = sup => ({ title: 'T', questions: [Q(1, REP), Q(2, REP), Q(3, sup)] });
    const out = {};
    for (const [nom, sup] of Object.entries({
        'answers ABSENT': {}, 'answers = []': { answers: [] },
        'answers = [1 réponse]': { answers: [{ text: 'a', correct: true }] },
        'answers = [2 réponses]': REP,
    })) out[nom] = getValidationErrors(JSON.parse(JSON.stringify(jeu(sup))), S).map(e => `${e.field} — ${e.message}`);
    return out;
});
for (const [nom, err] of Object.entries(cas)) console.log(`  ${nom.padEnd(24)} → ${err.length ? err.join(' | ') : 'aucune erreur'}`);
verdict(cas['answers ABSENT'].length > 0, '« answers » absent est signalé', '« answers » ABSENT passe en silence');
verdict(cas['answers = []'].length > 0, '« answers » vide est signalé', '« answers » VIDE passe en silence');
verdict(cas['answers = [1 réponse]'].length > 0, '« answers » à 1 élément est signalé', 'régression : 1 réponse n’est plus signalée');
verdict(cas['answers = [2 réponses]'].length === 0, '« answers » complet ne déclenche RIEN (pas de faux positif)', 'faux positif sur un QCM valide');

titre('revers : un champ MASQUÉ par showWhen ne doit pas se mettre à bloquer');
const masques = await p.evaluate(async () => {
    const { getValidationErrors } = await import('/js/editor/validators.js');
    const { getSchemaForType, normalizeDataForEditor } = await import('/js/editor/content-detector.js');
    const out = {};
    // diapositive « titre » : le conteneur `table` (showWhen: content-with-table) est masqué
    const cp = normalizeDataForEditor({ title: 'P', slides: [
        { type: 'title', title: 'Accueil', content: 'Bienvenue' },
        { type: 'content', title: 'Suite', content: 'Texte' }] }, 'CoursePresentation');
    out['CoursePresentation, diapo « titre » (table masqué)'] =
        getValidationErrors(cp, getSchemaForType('CoursePresentation')).map(e => `${e.field} — ${e.message}`);
    return out;
});
for (const [nom, err] of Object.entries(masques)) {
    console.log(`  ${nom} → ${err.length ? err.join(' | ') : 'aucune erreur'}`);
    verdict(err.length === 0, 'le conteneur masqué ne bloque pas', 'un conteneur MASQUÉ bloque : faux positif');
}

titre('bout en bout : les 116 fixtures restent enregistrables');
console.log('  (couvert par test-editor-activities.js A2 — « aucune activité ne naît bloquée »)');

// ---------------------------------------------------------------------------
// LIMITE CONNUE, hors périmètre de ce correctif — signalée, pas assertée.
// La génération IA (LLM → healer → processeur → .h5p) ne passe PAS par la validation :
// un QCM sans réponses produit directement par le modèle part encore dans le .h5p.
// Le correctif ci-dessus protège l'ÉDITEUR, pas le pipeline de génération.
// ---------------------------------------------------------------------------
titre('limite connue — le pipeline de GÉNÉRATION ne valide pas');
const build = await p.evaluate(async () => {
    const brut = await (await fetch('assets/data/examples/quiz_mixte_1.json')).json();
    brut.questions.push({ subContentId: '', library: 'H5P.MultiChoice 1.16', metadata: { title: 'Question 8' },
        params: { overallFeedback: [{ from: 0, to: 50, feedback: '' }, { from: 51, to: 100, feedback: '' }],
                  question: 'Capitale de la France ?', behaviour: { singleAnswer: false } } });
    const res = await window.__qa.build(window.__qa.heal(brut, 'QuizSet'), 'QuizSet');
    const c = res && res.content ? res.content : res;
    const q = (c?.questions || []).slice(-1)[0];
    return q ? { nbReponses: (q.params?.answers || []).length } : null;
});
console.log(`  .h5p bâti sans passer par l’éditeur → dernière question : ${JSON.stringify(build)}`);
console.log(`  ${build && build.nbReponses === 0 ? 'ℹ️  toujours possible par la génération IA — hors périmètre de ce correctif' : '✅ le pipeline refuse aussi'}`);

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (f) conforme' : `❌ ${rouge} contrôle(s) en échec`}`);
process.exit(rouge === 0 ? 0 : 1);
