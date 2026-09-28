/**
 * run_parcours_types.mjs — Le miroir : ce que le parcours fait travailler.
 *
 * Banc **Node pur**, sans navigateur ni serveur, comme celui des garde-fous :
 * `js/parcours/types-apprentissage.js` n'importe rien et ne touche pas au DOM.
 *
 * Ce que ce banc protège :
 *
 *  1. **La couverture ne se troue pas en silence.** Tout module que Caramel sait
 *     produire — les 37 de `definitions.js` et les 5 du registre de parcours —
 *     appartient à une famille. Un type H5P ajouté demain sans être classé
 *     s'afficherait « hors familles » sans que personne l'ait décidé ; ce banc
 *     le voit avant l'utilisateur. C'est le même genre de garde-fou que la
 *     séquence de balises du `.mbz` : il empêche une dérive, pas un bug.
 *  2. **Le miroir ne juge pas.** Il ne signale une dominante qu'au-delà de la
 *     MOITIÉ des activités, et jamais sous quatre activités — sans quoi il
 *     reprocherait un déséquilibre à un parcours de trois cartes, où il n'y a
 *     rien à équilibrer.
 *  3. **Il ne lève jamais.** Un plan vide, `null`, un objet tordu : il rend un
 *     bilan, parce qu'il est affiché sur un écran qu'on ne doit pas casser.
 *
 * Lancement :  node tests/run_parcours_types.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    analyserPlan, familleDe, FAMILLES, FAMILLE_PAR_MODULE,
} from '../js/parcours/types-apprentissage.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Un plan minimal : une étape, les modules donnés. */
const plan = (...modules) => ({
    etapes: [{ id: 'e1', cartes: modules.map((m, i) => ({ id: `c${i}`, module: m })) }],
});

/* ------------------------------------------------------------------ *
 *  1. La couverture — aucun module ne doit tomber hors familles
 * ------------------------------------------------------------------ */
console.log('\n── La couverture des modules ───────────────────────────────');

// On lit les registres en TEXTE plutôt qu'en les important : `definitions.js`
// et `modules-parcours.js` tirent le DOM et les traductions derrière eux, et ce
// banc doit rester du Node pur — c'est ce qui le rend instantané.
const clesDe = (fichier, motif) =>
    [...readFileSync(join(ROOT, fichier), 'utf8').matchAll(motif)].map(m => m[1]);

const modulesCaramel = clesDe('js/core/definitions.js', /^ {4}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{/gm);
// Le registre des modules de parcours est fondu depuis deux fichiers : les
// premiers modules, et les modules natifs ouverts le 27 sept. 2026 (D70).
const modulesParcours = [
    ...clesDe('js/parcours/modules-parcours.js', /^ {4}(parcours_[a-z_]+):\s*\{/gm),
    ...clesDe('js/parcours/modules-natifs.js', /^ {4}(parcours_[a-z_]+):\s*\{/gm),
];
const tous = [...modulesCaramel, ...modulesParcours];

ok('les deux registres sont bien lus (sinon le contrôle ci-dessous ne vaut rien)',
    modulesCaramel.length >= 30 && modulesParcours.length >= 19,
    `${modulesCaramel.length} + ${modulesParcours.length}`);

const nonClasses = tous.filter(c => !familleDe(c));
ok('CHAQUE module que Caramel sait produire appartient à une famille',
    nonClasses.length === 0,
    nonClasses.join(' · '));

const orphelins = Object.keys(FAMILLE_PAR_MODULE).filter(c => !tous.includes(c));
ok('et la table ne classe aucun module qui n’existe plus',
    orphelins.length === 0, orphelins.join(' · '));

const famillesInconnues = [...new Set(Object.values(FAMILLE_PAR_MODULE))]
    .filter(f => !FAMILLES.includes(f));
ok('toutes les familles employées sont déclarées',
    famillesInconnues.length === 0, famillesInconnues.join(' · '));

// Une famille vide n'aurait aucune raison d'exister : elle occuperait une tuile
// qui afficherait toujours zéro.
const vides = FAMILLES.filter(f => !Object.values(FAMILLE_PAR_MODULE).includes(f));
ok('aucune famille n’est vide de tout module', vides.length === 0, vides.join(' · '));

/* ------------------------------------------------------------------ *
 *  2. Le comptage
 * ------------------------------------------------------------------ */
console.log('\n── Le comptage ─────────────────────────────────────────────');

const b1 = analyserPlan(plan('Page', 'Flashcards', 'QuizSet', 'Essay', 'Timeline', 'parcours_forum', 'parcours_wiki'));
ok('les sept familles sont comptées une fois chacune',
    b1.comptes.every(c => c.n === 1) && b1.total === 7 && FAMILLES.length === 7,
    JSON.stringify(b1.comptes));
ok('aucune absence n’est signalée quand tout est là',
    b1.absentes.length === 0 && b1.nonClasses === 0);

const b2 = analyserPlan(plan('QuizSet', 'MultipleChoice', 'TrueFalse', 'FillInTheBlanks'));
ok('un parcours tout en exercices marque SIX familles absentes',
    b2.absentes.length === 6 && !b2.absentes.includes('exercer'),
    b2.absentes.join(' · '));
ok('et sa dominante est nommée',
    b2.dominante && b2.dominante.famille === 'exercer' && b2.dominante.n === 4,
    JSON.stringify(b2.dominante));

// D73 : c'est pour que cette absence-là se voie que la famille existe.
const sansEchange = analyserPlan(plan('Page', 'QuizSet', 'Essay'));
ok('un parcours sans forum ni travail collectif signale l’absence de discussion ET de coopération',
    sansEchange.absentes.includes('discuter') && sansEchange.absentes.includes('cooperer'), sansEchange.absentes.join(' · '));
// D82 : un forum seul ne fait rien construire à plusieurs — ABC distingue les deux.
const forumSeul = analyserPlan(plan('Page', 'QuizSet', 'parcours_forum', 'Essay'));
ok('un parcours qui n’a qu’un forum signale qu’on n’y coopère jamais',
    forumSeul.absentes.includes('cooperer') && !forumSeul.absentes.includes('discuter'), forumSeul.absentes.join(' · '));
const discussions = ['parcours_forum', 'parcours_sondage', 'parcours_questionnaire', 'parcours_enquete', 'parcours_classe_virtuelle'].map(familleDe);
ok('forum, sondage, questionnaire, enquête, classe virtuelle : discuter',
    discussions.every(f => f === 'discuter'), discussions.join(' · '));
const cooperations = ['parcours_wiki', 'parcours_document', 'parcours_tableau', 'parcours_base', 'parcours_glossaire', 'parcours_choix_groupe'].map(familleDe);
ok('wiki, document, tableau, base, glossaire à construire, choix de groupe : coopérer',
    cooperations.every(f => f === 'cooperer'), cooperations.join(' · '));

const b3 = analyserPlan(plan('Page', 'PasUnModule', 'QuizSet'));
ok('un module inconnu est compté à part, pas rangé de force',
    b3.nonClasses === 1 && b3.total === 3
    && b3.comptes.reduce((t, c) => t + c.n, 0) === 2,
    JSON.stringify(b3));

/* ------------------------------------------------------------------ *
 *  3. Le miroir ne juge pas
 * ------------------------------------------------------------------ */
console.log('\n── Le miroir ne juge pas ───────────────────────────────────');

// Sous quatre activités il n'y a rien à équilibrer : reprocher une dominante à
// un parcours de trois cartes serait un reproche adressé à sa brièveté.
ok('sous quatre activités, aucune dominante n’est annoncée',
    analyserPlan(plan('QuizSet', 'MultipleChoice', 'TrueFalse')).dominante === null);

// La MOITIÉ pile n'est pas une dominante : le seuil est strictement au-delà.
const moitie = analyserPlan(plan('QuizSet', 'MultipleChoice', 'Page', 'Flashcards'));
ok('la moitié pile n’est pas une dominante (le seuil est strict)',
    moitie.dominante === null, JSON.stringify(moitie.dominante));

const troisSurCinq = analyserPlan(plan('QuizSet', 'MultipleChoice', 'TrueFalse', 'Page', 'Flashcards'));
ok('trois sur cinq en est une',
    troisSurCinq.dominante && troisSurCinq.dominante.famille === 'exercer',
    JSON.stringify(troisSurCinq.dominante));

/* ------------------------------------------------------------------ *
 *  4. Il ne lève jamais
 * ------------------------------------------------------------------ */
console.log('\n── Il ne lève jamais ───────────────────────────────────────');

for (const [nom, valeur] of [
    ['null', null],
    ['un objet vide', {}],
    ['un plan sans étapes', { etapes: null }],
    ['une étape sans cartes', { etapes: [{ id: 'e1' }] }],
    ['une carte sans module', { etapes: [{ cartes: [{ id: 'c1' }] }] }],
]) {
    let bilan = null, leve = false;
    try { bilan = analyserPlan(valeur); } catch { leve = true; }
    ok(`${nom} rend un bilan plutôt qu’une exception`,
        !leve && bilan && bilan.comptes.length === FAMILLES.length,
        leve ? 'exception levée' : JSON.stringify(bilan));
}

const vide = analyserPlan({ etapes: [] });
ok('un plan vide ne prétend pas que les sept familles y sont',
    vide.total === 0 && vide.absentes.length === FAMILLES.length
    && vide.dominante === null,
    JSON.stringify(vide));

console.log('\n========================================');
console.log(`parcours — le miroir des types : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : 0);
