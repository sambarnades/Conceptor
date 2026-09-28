/**
 * run_parcours_gardefous.mjs — La relecture didactique du plan.
 *
 * Banc **Node pur**, sans navigateur ni serveur : `js/parcours/garde-fous.js`
 * n'importe rien et ne touche pas au DOM, c'est même la raison d'être de sa
 * forme. Il tourne donc en quelques millisecondes, ce qui change la façon dont
 * on s'en sert — on peut le lancer à chaque retouche d'un seuil.
 *
 * Ce que ce banc protège :
 *
 *  1. **Chaque garde-fou mord sur le cas qu'il vise**, et sur lui seul. Un
 *     contrôle qui s'allume tout le temps serait aussi inutile qu'un contrôle
 *     éteint : l'enseignant cesserait de le lire.
 *  2. **La relecture ne bloque JAMAIS** (§ 5 du PRD). Elle rend six constats,
 *     quoi qu'on lui donne — un plan vide, un plan bancal, `null`, un objet
 *     tordu. Aucune exception ne doit remonter jusqu'à l'écran du plan.
 *  3. **Les seuils sont ceux qu'on croit** : 3 activités identiques d'affilée,
 *     30 minutes pour une activité, 2 h pour un parcours. Les frontières sont
 *     testées des deux côtés — c'est là que les erreurs se logent.
 *  4. **La classification des modules** ne dérive pas vers la catégorie `quiz`
 *     de `definitions.js`, qui ne dit pas la même chose (`Devoir` s'y trouve,
 *     `DragTheWords` non).
 *
 * Lancement :  node tests/run_parcours_gardefous.mjs
 */
import { relirePlan, nbAttentions, ciblesSignalees } from '../js/parcours/garde-fous.js';

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Un constat par clé, pour lire les résultats sans compter les index. */
const parCle = plan => Object.fromEntries(relirePlan(plan).map(c => [c.cle, c]));

/**
 * Lit une liste d'ids d'un constat SANS jamais lever.
 *
 * Un constat qui passe ne porte ni `cartes` ni `etapes` : y accéder à l'aveugle
 * ferait tomber le banc entier au lieu de rapporter un échec, et l'on perdrait
 * les quarante autres résultats. Constaté en désarmant le seuil de série.
 */
const ids = (constat, champ) => ((constat && constat[champ]) || []).join(',');

/** Idem pour un jeton de message. */
const jeton = (constat, nom) => String((constat && constat.jetons && constat.jetons[nom]) ?? '');

/** Une carte minimale : tout ce qui n'est pas dit prend une valeur saine. */
const carte = (module, extra = {}) => ({
    id: extra.id || `c${Math.random().toString(36).slice(2, 7)}`,
    titre: 'Une activité', objectif: '', consigne: '',
    module, palier: 'entrainement', duree: 10, verrouillee: false, ...extra,
});

/** Une étape minimale. */
const etape = (cartes, extra = {}) => ({
    id: extra.id || `e${Math.random().toString(36).slice(2, 7)}`,
    titre: 'Une étape', objectif: 'Comprendre quelque chose', cartes, ...extra,
});

/** Le plan de référence : celui qui passe les six contrôles. */
const planSain = () => ({
    titre: 'Les états de la matière',
    objectifGeneral: 'Comprendre pourquoi un corps change d’état',
    notionsPivots: ['fusion', 'vaporisation'],
    etapes: [
        etape([carte('Page', { palier: 'decouverte' }), carte('QuizSet')],
              { id: 'e1', objectif: 'Repérer les trois états' }),
        etape([carte('FillInTheBlanks'), carte('Devoir', { palier: 'transfert' })],
              { id: 'e2', objectif: 'Expliquer un changement d’état' }),
    ],
});

console.log('\n── Le plan de référence passe tout ─────────────────────────');
{
    const c = relirePlan(planSain());
    ok('la relecture rend exactement six constats', c.length === 6, `${c.length}`);
    ok('aucun point d’attention sur un plan sain', nbAttentions(c) === 0,
        c.filter(x => !x.ok).map(x => x.cle).join(', '));
    ok('chaque constat porte une clé i18n', c.every(x => /^parcours_gf_/.test(x.messageKey)));
    ok('les six clés sont distinctes', new Set(c.map(x => x.cle)).size === 6);
}

console.log('\n── 1. Le parcours annonce où il va ─────────────────────────');
{
    const sans = planSain(); sans.objectifGeneral = '';
    ok('un objectif général absent est signalé',
        parCle(sans).objectif_general.messageKey === 'parcours_gf_objectif_absent');

    const recopie = planSain(); recopie.objectifGeneral = 'Les états de la matière';
    ok('un objectif qui recopie le titre est signalé (le défaut réel du modèle)',
        parCle(recopie).objectif_general.messageKey === 'parcours_gf_objectif_recopie');

    const ponctue = planSain(); ponctue.objectifGeneral = 'les  ÉTATS de la matière !';
    ok('la recopie est vue malgré la casse, les espaces et la ponctuation',
        !parCle(ponctue).objectif_general.ok);

    const proche = planSain(); proche.objectifGeneral = 'Les états de la matière et leurs changements';
    ok('un objectif qui PROLONGE le titre n’est pas une recopie',
        parCle(proche).objectif_general.ok);
}

console.log('\n── 2. Au moins une activité qui vérifie ────────────────────');
{
    const muet = { ...planSain(), etapes: [etape([carte('Page'), carte('Livre'), carte('parcours_forum')])] };
    ok('un parcours sans aucune activité auto-corrective est signalé',
        !parCle(muet).une_verification.ok);

    const compte = parCle(planSain()).une_verification;
    ok('le constat dit COMBIEN d’activités vérifient', jeton(compte, 'n') === '2', JSON.stringify(compte.jetons));

    // La distinction que la catégorie `quiz` de definitions.js ne fait PAS.
    const dtw = { ...planSain(), etapes: [etape([carte('DragTheWords')])] };
    ok('DragTheWords compte comme une vérification (il corrige à la seconde)',
        parCle(dtw).une_verification.ok);
    const devoir = { ...planSain(), etapes: [etape([carte('Devoir')])] };
    ok('Devoir n’en est PAS une (l’enseignant corrige, des jours plus tard)',
        !parCle(devoir).une_verification.ok);
}

console.log('\n── 3. Pas trois fois le même type d’affilée ────────────────');
{
    const deux = { ...planSain(), etapes: [etape([carte('QuizSet'), carte('QuizSet'), carte('Page')])] };
    ok('DEUX activités identiques d’affilée passent', parCle(deux).pas_trois_identiques.ok);

    const trois = { ...planSain(), etapes: [etape([
        carte('QuizSet', { id: 'x1' }), carte('QuizSet', { id: 'x2' }), carte('QuizSet', { id: 'x3' })])] };
    const t = parCle(trois).pas_trois_identiques;
    ok('TROIS identiques d’affilée sont signalées', !t.ok);
    ok('le constat nomme les trois activités en cause',
        ids(t, 'cartes') === 'x1,x2,x3', String(t.cartes));

    // Un élève qui enchaîne ne voit pas les frontières qu'on a tracées.
    const across = { ...planSain(), etapes: [
        etape([carte('QuizSet', { id: 'a1' }), carte('QuizSet', { id: 'a2' })]),
        etape([carte('QuizSet', { id: 'a3' })]),
    ] };
    ok('la série est vue MÊME à cheval sur deux étapes',
        !parCle(across).pas_trois_identiques.ok);

    const coupe = { ...planSain(), etapes: [etape([
        carte('QuizSet'), carte('QuizSet'), carte('Page'), carte('QuizSet'), carte('QuizSet')])] };
    ok('une activité différente au milieu casse la série', parCle(coupe).pas_trois_identiques.ok);
}

console.log('\n── 4. Un objectif par étape, distinct de son titre ──────────');
{
    const nue = { ...planSain(), etapes: [etape([carte('QuizSet')], { id: 'e9', objectif: '' })] };
    const n = parCle(nue).objectif_par_etape;
    ok('une étape sans objectif est signalée', !n.ok);
    ok('le constat nomme l’étape en cause', ids(n, 'etapes') === 'e9', String(n.etapes));
    ok('le constat dit combien d’étapes sur combien',
        jeton(n, 'n') === '1' && jeton(n, 'total') === '1', JSON.stringify(n.jetons));

    const copie = { ...planSain(), etapes: [etape([carte('QuizSet')],
        { titre: 'Découvrir', objectif: 'découvrir' })] };
    ok('un objectif qui recopie le titre de l’étape est signalé',
        !parCle(copie).objectif_par_etape.ok);
}

console.log('\n── 5. Le volume horaire tient debout ───────────────────────');
{
    ok('30 minutes pour une activité, c’est la borne et elle passe',
        parCle({ ...planSain(), etapes: [etape([carte('QuizSet', { duree: 30 })])] }).duree_tenable.ok);

    const longue = { ...planSain(), etapes: [etape([carte('QuizSet', { id: 'L', duree: 31 })])] };
    const l = parCle(longue).duree_tenable;
    ok('31 minutes, c’est une séance déguisée : signalée', !l.ok);
    ok('le constat nomme l’activité trop longue', ids(l, 'cartes') === 'L', String(l.cartes));
    ok('et le message parle de l’ACTIVITÉ, pas du total',
        l.messageKey === 'parcours_gf_duree_activite_ko', l.messageKey);

    // 2 h pile passent ; au-delà on le dit, sans le reprocher.
    const deuxHeures = { ...planSain(), etapes: [etape(
        Array.from({ length: 8 }, (_, i) => carte(i % 2 ? 'QuizSet' : 'Page', { duree: 15 })))] };
    ok('deux heures pile ne déclenchent rien', parCle(deuxHeures).duree_tenable.ok);

    const troisHeures = { ...planSain(), etapes: [etape(
        Array.from({ length: 8 }, (_, i) => carte(i % 2 ? 'QuizSet' : 'Page', { duree: 25 })))] };
    const th = parCle(troisHeures).duree_tenable;
    ok('au-delà de deux heures, le total est SIGNALÉ',
        !th.ok && th.messageKey === 'parcours_gf_duree_totale_longue', th.messageKey);
    // Le garde-fou n'importe rien : il livre les MINUTES, et l'écran les écrit
    // « 3 h 20 » — jamais « 3,3 h » (retour d'Emmanuel, 6 sept. 2026).
    ok('et le constat livre le total en minutes, que l’écran écrira en heures et minutes',
        th.minutes === 200 && jeton(th, 'd') === '200 min', JSON.stringify({ minutes: th.minutes, jetons: th.jetons }));
    ok('un total trop long ne montre du doigt AUCUNE activité (ce n’est pas leur faute)',
        !th.cartes);
}

console.log('\n── 6. À l’entraînement, l’élève sait s’il a juste ──────────');
{
    const muette = { ...planSain(), etapes: [etape([carte('Page', { id: 'p1', palier: 'entrainement' })])] };
    const m = parCle(muette).entrainement_avec_retour;
    ok('une Page en palier « entraînement » est signalée', !m.ok);
    ok('le constat nomme l’activité muette', ids(m, 'cartes') === 'p1', String(m.cartes));

    const ailleurs = { ...planSain(), etapes: [etape([
        carte('Page', { palier: 'decouverte' }), carte('Devoir', { palier: 'transfert' })])] };
    ok('la MÊME Page en découverte ne l’est pas (c’est sa place)',
        parCle(ailleurs).entrainement_avec_retour.ok);
    ok('un Devoir en transfert non plus (on n’y attend pas de correction immédiate)',
        parCle(ailleurs).entrainement_avec_retour.ok);
}

console.log('\n── La relecture ne bloque jamais ───────────────────────────');
{
    for (const [nom, entree] of [
        ['null', null], ['undefined', undefined], ['une chaîne', 'plan'],
        ['un objet vide', {}], ['un tableau', []],
        ['des étapes non tableau', { etapes: 'oui' }],
        ['une étape sans cartes', { etapes: [{ id: 'e1' }] }],
        ['une carte sans module', { etapes: [{ id: 'e1', cartes: [{ id: 'c1' }] }] }],
        ['une durée en toutes lettres', { etapes: [{ id: 'e1', cartes: [{ id: 'c1', duree: 'dix' }] }] }],
    ]) {
        let c = null, leve = false;
        try { c = relirePlan(entree); } catch { leve = true; }
        ok(`${nom} → six constats, aucune exception`, !leve && Array.isArray(c) && c.length === 6);
    }
}

console.log('\n── Ce que l’écran doit surligner ───────────────────────────');
{
    const bancal = {
        titre: 'T', objectifGeneral: '', etapes: [
            { id: 'e1', titre: 'A', objectif: '', cartes: [
                carte('Page', { id: 'c1', palier: 'entrainement' }),
                carte('Page', { id: 'c2', palier: 'entrainement' }),
                carte('Page', { id: 'c3', palier: 'entrainement' }),
            ] },
        ],
    };
    const constats = relirePlan(bancal);
    const { etapes, cartes } = ciblesSignalees(constats);
    ok('un plan bancal accumule les points d’attention', nbAttentions(constats) >= 4,
        String(nbAttentions(constats)));
    ok('l’étape sans objectif est à surligner', etapes.has('e1'));
    ok('les trois activités le sont aussi', cartes.size === 3, String([...cartes]));
    ok('un plan sain ne surligne rien',
        ciblesSignalees(relirePlan(planSain())).cartes.size === 0);
}

console.log('\n========================================');
console.log(`parcours — relecture didactique : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : 0);
