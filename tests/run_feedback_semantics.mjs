/**
 * run_feedback_semantics.mjs — Garde-fou : aucun retour pédagogique ne doit être
 * perdu entre la fixture et le `content.json`.
 *
 * POURQUOI. Le semantics de H5P.MultiChoice ne déclare que trois champs sur
 * `answers[]` : `text`, `correct` et le groupe `tipsAndFeedback`. Or, à l'import,
 * `H5PContentValidator::validateGroup()` SUPPRIME toute clé absente du semantics
 * (« no validator exists for @key » → `unset()`). Un `chosenFeedback` posé à la
 * RACINE de la réponse ne provoque donc ni erreur ni avertissement : il disparaît,
 * et l'enseignant constate seulement que son retour ne s'affiche jamais.
 * Constaté sur `quiz_qcm_5.json` (13 retours morts) — corrigé par
 * `replierRetoursRacine()` dans `processors/MultipleChoice.js`.
 *
 * TROIS CONTRÔLES, sur le pipeline de PRODUCTION (heal ×3 → processeur) :
 *   A. STRUCTURE — aucune réponse ne sort avec un champ de retour à sa racine.
 *   B. CONSERVATION — chaque retour NON VIDE présent dans la fixture se retrouve
 *      dans le `content.json` produit. C'est le contrôle qui a du mordant : il
 *      attrape la perte silencieuse, pas seulement la forme.
 *   C. RÉCUPÉRATION — cas SYNTHÉTIQUE, forme plate injectée à la main dans les deux
 *      voies du processeur. Indispensable depuis que `quiz_qcm_5.json` a été remis à
 *      la forme canonique (2026-09) : plus aucune fixture du dépôt ne porte la forme
 *      fautive, donc sans ce cas A et B resteraient VERTS correctif retiré — soit un
 *      garde-fou qui ne garde plus rien. Il tient lieu de contre-épreuve embarquée.
 *
 * Lancement :  node tests/run_feedback_semantics.mjs [--verbeux]
 * Sortie : 0 si conforme, 1 sinon.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VERBEUX = process.argv.includes('--verbeux');

// Le bootstrap DOIT précéder tout import Caramel (il installe window/document/localStorage).
await import('./roundtrip/bootstrap.mjs');

const { listFixtures } = await import('./roundtrip/fixtures-map.mjs');
const healer = await import('../js/h5p/json-healer.js');
const { processH5PContent } = await import('../js/h5p/processors/index.js');

/** Les trois champs du groupe `tipsAndFeedback` — les seuls emplacements légaux. */
const CHAMPS_RETOUR = ['tip', 'chosenFeedback', 'notChosenFeedback'];

/** Une RÉPONSE de QCM : objet portant `text` (string) et `correct` (booléen). */
const estReponse = (n) => n && typeof n === 'object' && !Array.isArray(n)
    && typeof n.text === 'string' && typeof n.correct === 'boolean';

function parcourir(noeud, visiteur) {
    if (Array.isArray(noeud)) return noeud.forEach(n => parcourir(n, visiteur));
    if (noeud && typeof noeud === 'object') {
        visiteur(noeud);
        Object.values(noeud).forEach(n => parcourir(n, visiteur));
    }
}

/** Retours NON VIDES portés par les réponses, quelle que soit leur position. */
function retoursDesReponses(racine) {
    const trouves = [];
    parcourir(racine, (n) => {
        if (!estReponse(n)) return;
        for (const cle of CHAMPS_RETOUR) {
            for (const valeur of [n[cle], n.tipsAndFeedback?.[cle]]) {
                if (typeof valeur === 'string' && valeur.trim()) trouves.push(valeur.trim());
            }
        }
    });
    return trouves;
}

/** Réponses sortant avec un champ de retour à leur racine (hors semantics). */
function retoursHorsSemantics(racine) {
    const fautifs = [];
    parcourir(racine, (n) => {
        if (!estReponse(n)) return;
        for (const cle of CHAMPS_RETOUR) {
            if (typeof n[cle] === 'string' && n[cle].trim()) {
                fautifs.push({ cle, texte: n[cle].trim().slice(0, 70) });
            }
        }
    });
    return fautifs;
}

/**
 * EMPREINTE d'un retour, destinée à répondre à UNE question : ce retour existe-t-il
 * encore en sortie ? Pas : est-il identique au caractère près.
 *
 * Le pipeline a le droit de retoucher la forme, et le fait légitimement :
 *   - `markdownToHtml` convertit `**gras**` en `<strong>` ;
 *   - l'assainissement remplace l'apostrophe par `&#39;` ;
 *   - le healing LaTeX retire les commandes de MISE EN FORME — constaté sur
 *     `multiple_choice_3.json`, où `\(\displaystyle\frac{a}{b}\)` ressort
 *     `\(\frac{a}{b}\)`. Comparer la math au caractère près ferait donc virer
 *     ce garde-fou au rouge sur une normalisation VOULUE.
 * On neutralise en conséquence chaque bloc \( … \) / \[ … \] par un marqueur unique :
 * la math cesse d'être comparée, le texte qui la porte reste comparé.
 */
const degraisser = (s) => s
    .replace(/\\\((?:[\s\S]*?)\\\)/g, ' ⟨math⟩ ')
    .replace(/\\\[(?:[\s\S]*?)\\\]/g, ' ⟨math⟩ ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const MultipleChoice = (await import('../js/h5p/processors/MultipleChoice.js')).default;

/** Une réponse à la forme FAUTIVE : retours posés à la racine, hors semantics. */
const reponsePlate = () => ({
    text: '56', correct: true,
    tip: 'Pense à la table de 7.',
    chosenFeedback: 'Exact : 7 × 8 = 56.'
});

/** Forme fautive ET forme canonique sur la même réponse : la canonique doit gagner. */
const reponseMixte = () => ({
    text: '54', correct: false,
    chosenFeedback: 'VALEUR DE RACINE — ne doit pas gagner',
    tipsAndFeedback: { chosenFeedback: 'valeur canonique conservée' }
});

const CAS_SYNTHETIQUES = [
    {
        nom: 'process() — activité autonome',
        lancer: () => MultipleChoice.process({ question: 'Combien font 7 × 8 ?', answers: [reponsePlate(), reponseMixte()] }),
        reponses: (r) => r.answers
    },
    {
        nom: 'transformForQuizSet() — question dans un Quiz / une Vidéo interactive',
        lancer: () => MultipleChoice.transformForQuizSet({
            params: { question: 'Combien font 7 × 8 ?', answers: [reponsePlate(), reponseMixte()] }
        }),
        reponses: (r) => r.params.answers
    }
];

const echecsRecuperation = [];
for (const cas of CAS_SYNTHETIQUES) {
    let reponses;
    try { reponses = cas.reponses(cas.lancer()); }
    catch (e) {
        echecsRecuperation.push({ module: 'MultipleChoice', fixture: '(synthétique)', motif: `${cas.nom} : ${e.message}` });
        continue;
    }
    const [pliee, mixte] = reponses;
    const verifs = [
        [pliee?.tipsAndFeedback?.chosenFeedback?.includes('7 × 8 = 56'), 'chosenFeedback de racine non replié dans tipsAndFeedback'],
        [pliee?.tipsAndFeedback?.tip?.includes('table de 7'),            'tip de racine non replié dans tipsAndFeedback'],
        [pliee?.chosenFeedback === undefined,                            'chosenFeedback laissé à la racine (H5P le supprimera)'],
        [pliee?.tip === undefined,                                       'tip laissé à la racine (H5P le supprimera)'],
        [mixte?.tipsAndFeedback?.chosenFeedback?.includes('canonique'),  'la valeur de racine a ÉCRASÉ la valeur canonique']
    ];
    for (const [ok, motif] of verifs) {
        if (!ok) echecsRecuperation.push({ module: 'MultipleChoice', fixture: '(synthétique)', motif: `${cas.nom} : ${motif}` });
    }
}

const fixtures = await listFixtures('h5p');
const echecsStructure = [];
const echecsConservation = [];
let examinees = 0, avecRetours = 0, retoursVerifies = 0;

for (const f of fixtures) {
    let brut;
    try { brut = JSON.parse(await readFile(f.path, 'utf8')); }
    catch { brut = JSON.parse(healer.healJsonString(await readFile(f.path, 'utf8'))); }

    const attendus = retoursDesReponses(brut);

    let contenu;
    try {
        let o = healer.healJsonObject(structuredClone(brut), f.moduleKey);
        o = healer.healActivitySpecificFields(o, f.moduleKey);
        o = healer.healStructureForActivity(o, f.moduleKey);
        const t = await processH5PContent(f.moduleKey, o);
        contenu = (t && t.content && t.dependencies) ? t.content : t;
    } catch (e) {
        echecsStructure.push({ fixture: f.file, module: f.moduleKey, motif: `pipeline en échec : ${e.message}` });
        continue;
    }
    examinees++;
    if (attendus.length) avecRetours++;

    // ── A. STRUCTURE
    for (const faute of retoursHorsSemantics(contenu)) {
        echecsStructure.push({
            fixture: f.file, module: f.moduleKey,
            motif: `answers[].${faute.cle} à la racine (hors semantics, supprimé par H5P) : « ${faute.texte} »`
        });
    }

    // ── B. CONSERVATION
    const restants = new Map();
    for (const p of retoursDesReponses(contenu).map(degraisser)) {
        restants.set(p, (restants.get(p) || 0) + 1);
    }
    for (const attendu of attendus) {
        retoursVerifies++;
        const empreinte = degraisser(attendu);
        const reste = restants.get(empreinte) || 0;
        if (reste <= 0) {
            echecsConservation.push({
                fixture: f.file, module: f.moduleKey,
                motif: `retour perdu par le pipeline : « ${attendu.slice(0, 70)} »`
            });
        } else {
            restants.set(empreinte, reste - 1);
        }
    }
}

// ------------------------------------------------------------------ rapport
console.log(`\n${examinees} fixtures H5P traversées — ${avecRetours} portent des retours par réponse`);
console.log(`A. structure     : ${echecsStructure.length} anomalie(s)`);
console.log(`B. conservation  : ${echecsConservation.length} perte(s) sur ${retoursVerifies} retours vérifiés`);
console.log(`C. récupération  : ${echecsRecuperation.length} anomalie(s) sur ${CAS_SYNTHETIQUES.length} cas synthétiques\n`);

for (const e of [...echecsStructure, ...echecsConservation, ...echecsRecuperation]) {
    console.log(`  ❌ ${e.module.padEnd(18)} ${e.fixture.padEnd(28)} ${e.motif}`);
}
if (VERBEUX && !echecsStructure.length && !echecsConservation.length && !echecsRecuperation.length) {
    console.log('  (aucune anomalie — relancer avec le correctif désarmé doit virer au ROUGE)');
}

const total = echecsStructure.length + echecsConservation.length + echecsRecuperation.length;
console.log('='.repeat(60));
console.log(total ? `❌ ${total} anomalie(s)` : '✅ Aucun retour pédagogique perdu, aucune clé hors semantics.');
console.log('='.repeat(60));
process.exit(total ? 1 : 0);
