/**
 * run_parcours_chemins.mjs — Les chemins selon les résultats, en Node pur (D90-D101).
 *
 * `aiguillage.js`, `templates.js` et `calibrage.js` n'importent rien qui touche au
 * DOM : ce banc tourne en une fraction de seconde, en CI (job `validate`), et
 * BALAIE ce que le banc navigateur (`run_parcours_aiguillage.mjs`, qui assemble de
 * vrais cours) ne peut qu'échantillonner : tous les nombres de questions, tous les
 * seuils réglables, tous les scores.
 *
 *  1. Seuils — pour 1 à 30 questions, 2 à 4 chemins et des seuils quelconques,
 *     chaque score ouvre UN chemin, le sien, avec la note que Moodle arrondit
 *     (H5P sur 100, Test sur 10) ; un seuil réglé « à partir de b bonnes
 *     réponses » se relit b, pour tout b (c'était faux pour 161 réglages sur 465 :
 *     66,67 % de 3 questions se relisait 3 au lieu de 2) ;
 *  2. Conditions — la forme que Moodle exige, et le contrôle qui refuse le reste ;
 *  3. Le cours vu par un élève (`coursDuPlan`) — un chemin, l'étape commune, la fin ;
 *  4. Édition du plan — ouvrir, ajouter, retirer, refermer, normaliser ;
 *  5. Problèmes bloquants, historique d'une carte, réglages du test et des rôles ;
 *  6. Trames et calibrage — ce que fait UN élève tient dans l'ampleur, ce qui se
 *     fabrique sous le plafond de douze ;
 *  7. La vitrine et « Évaluer » (D102) ;
 *  8. Le vocabulaire de la plateforme (D105) — élèves, stagiaires, étudiants.
 *
 * Lancement :  node tests/run_parcours_chemins.mjs
 */
import * as A from '../js/parcours/aiguillage.js';
import { CONFIG } from '../js/parcours/config.js';
import { tramesCompatibles, nbActivites, nbActivitesParEleve, trameEnVitrine, VITRINE, reglagesDeTrame } from '../js/parcours/templates.js';
import { calibrer } from '../js/parcours/calibrage.js';
import { readFileSync, readdirSync } from 'fs';

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Suite pseudo-aléatoire DÉTERMINISTE : un échec se rejoue à l'identique. */
let graine = 20260930;
const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };

/** Des seuils croissants quelconques, en pourcentage, deux décimales. */
function seuilsAuHasard(k) {
    const s = Array.from({ length: k - 1 }, () => Math.round((1 + hasard() * 98) * 100) / 100).sort((a, b) => a - b);
    return s;
}

/** Le chemin que Moodle ouvre pour `s` bonnes réponses sur `n`, ou la liste s'il y en a plusieurs. */
function cheminsOuverts(bornes, n, s, noteMax) {
    const note = A.noteMoodle(s, n, noteMax);
    const k = bornes.length + 1;
    const ouverts = [];
    for (let j = 0; j < k; j++) {
        const c = A.conditionChemin(1, j === 0 ? null : A.seuilMoodle(bornes[j - 1], n),
            j === k - 1 ? null : A.seuilMoodle(bornes[j], n));
        if (A.conditionRemplie(c, { notes: { 1: note }, acheves: new Set() })) ouverts.push(j);
    }
    return ouverts;
}

/* ------------------------------------------------------------------ */
console.log('\n── 1. Seuils : chaque score ouvre un chemin, le sien ───────');
{
    const anomalies = [];
    let cas = 0;
    for (let n = 1; n <= 30; n++) {
        for (let k = A.CHEMINS_MIN; k <= A.CHEMINS_MAX; k++) {
            if (n + 1 < k) continue; // refusé par `problemesAiguillage` (questions_insuffisantes)
            const essais = [A.seuilsParDefaut(k), ...Array.from({ length: 12 }, () => seuilsAuHasard(k)),
                Array(k - 1).fill(50), Array(k - 1).fill(99.99), Array(k - 1).fill(0.01)];
            for (const depuis of essais) {
                cas++;
                const bornes = A.bornesEnReponses(depuis, n);
                const plages = A.plagesEnReponses(bornes, n);
                const croissantes = bornes.every((b, j) => b >= 1 && b <= n && (j === 0 || b > bornes[j - 1]));
                const partition = plages.length === k && plages[0][0] === 0 && plages.at(-1)[1] === n
                    && plages.every(([de, a], j) => de <= a && (j === 0 || de === plages[j - 1][1] + 1));
                if (!croissantes || !partition) { anomalies.push(`n=${n} k=${k} ${JSON.stringify(depuis)} → ${JSON.stringify(plages)}`); continue; }
                for (const noteMax of [100, 10]) {
                    for (let s = 0; s <= n; s++) {
                        const ouverts = cheminsOuverts(bornes, n, s, noteMax);
                        const [de, a] = plages[ouverts[0]] || [];
                        if (ouverts.length !== 1 || s < de || s > a) {
                            anomalies.push(`n=${n} k=${k} sur ${noteMax} ${JSON.stringify(depuis)} : score ${s} → ${JSON.stringify(ouverts)}`);
                        }
                    }
                }
            }
        }
    }
    ok(`${cas} réglages : bornes croissantes, plages qui couvrent 0 à n sans trou ni chevauchement, un chemin et un seul par score, sur 100 comme sur 10`,
        anomalies.length === 0, anomalies.slice(0, 5).join(' | '));

    const allerRetour = [];
    for (let n = 1; n <= 40; n++) {
        for (let b = 1; b <= n; b++) {
            const lu = A.bornesEnReponses([A.pourcentageDeBorne(b, n)], n)[0];
            if (lu !== b) allerRetour.push(`${b}/${n} → ${A.pourcentageDeBorne(b, n)} % → ${lu}`);
        }
    }
    ok('un seuil réglé « à partir de b bonnes réponses sur n » se relit b, pour tout b et tout n ≤ 40',
        allerRetour.length === 0, allerRetour.slice(0, 5).join(' | '));

    const defauts = JSON.stringify([2, 3, 4].map(k => A.bornesEnReponses(A.seuilsParDefaut(k), A.QUESTIONS_CONSEILLEES[k])));
    ok('seuils par défaut, aux questions conseillées : 5/8, 4 et 8/10, 3, 6 et 9/12', defauts === '[[5],[4,8],[3,6,9]]', defauts);

    const mi = [];
    for (let n = 1; n <= 30; n++) {
        for (let b = 1; b <= n; b++) {
            const seuil = A.seuilMoodle(b, n);
            // Aucune note atteignable ne tombe à moins d'un tiers de point du seuil.
            const ecart = Math.min(...Array.from({ length: n + 1 }, (_, s) => Math.abs(A.noteMoodle(s, n) - seuil)));
            if (ecart < (100 / n) / 3) mi.push(`${b}/${n} : écart ${ecart}`);
        }
    }
    ok('les seuils écrits tombent à mi-point : aucune note possible ne les frôle', mi.length === 0, mi.slice(0, 5).join(' | '));
}

/* ------------------------------------------------------------------ */
console.log('\n── 2. Conditions : la forme que Moodle exige ───────────────');
{
    const chemin = A.conditionChemin(42, 40, 75);
    ok('un chemin : racine « & », showc [false], note en entier', JSON.stringify(chemin)
        === '{"op":"&","c":[{"type":"grade","id":42,"min":40,"max":75}],"showc":[false]}' && !A.verifierCondition(chemin).length);
    ok('le premier chemin n’a pas de minimum, le dernier pas de maximum',
        !('min' in A.conditionChemin(1, null, 40).c[0]) && !('max' in A.conditionChemin(1, 75, null).c[0]));
    const apres = A.conditionApresChemins([[3], [4, 5], [6]]);
    ok('l’étape commune : racine « | » masquée, un sous-groupe par chemin, sans drapeau', apres.op === '|' && apres.show === false
        && apres.c.length === 3 && apres.c[1].op === '&' && !('showc' in apres.c[1]) && !A.verifierCondition(apres).length);
    const fin = A.conditionFin([1, 2], [[[3], [4, 5]]]);
    ok('la fin : tout le tronc commun ET un chemin de chaque aiguillage, masquée', fin.op === '&'
        && fin.showc.length === fin.c.length && fin.showc.every(v => v === false) && fin.c.at(-1).op === '|' && !A.verifierCondition(fin).length);
    ok('un chemin sans activité qui s’achève est refusé à la construction', (() => {
        try { A.conditionApresChemins([[3], []]); return false; } catch { return true; }
    })());
    const refuse = x => { try { A.conditionChemin(x, 0, 50); return false; } catch { return true; } };
    ok('l’identifiant de note est écrit en ENTIER (Moodle refuse « "42" ») ; un identifiant non entier est refusé',
        A.conditionChemin('42', 0, 50).c[0].id === 42 && ['x', 4.5, null, true, 0, -3, ''].every(refuse));
    const defauts = [
        { op: '&', c: [{ type: 'grade', id: 1 }] },
        { op: '|', c: [{ type: 'grade', id: 1 }] },
        { op: '&', c: [{ type: 'grade', id: '1' }], showc: [false] },
        { op: '&', c: [], showc: [] },
        { op: '&', c: [{ type: 'grade', id: 1, min: 50, max: 50 }], showc: [false] },
        { op: '&', c: [{ type: 'completion', cm: 3, e: 1 }], showc: [false, true] },
    ].map(x => A.verifierCondition(x).length > 0);
    ok('le contrôle refuse : showc absent, show absent, id en texte, groupe vide, min ≥ max, showc de mauvaise longueur',
        defauts.every(Boolean), JSON.stringify(defauts));
    ok('Moodle : note absente = faux, min inclus, max exclu', [
        !A.conditionRemplie(chemin, { notes: {}, acheves: new Set() }),
        A.conditionRemplie(chemin, { notes: { 42: 40 }, acheves: new Set() }),
        !A.conditionRemplie(chemin, { notes: { 42: 75 }, acheves: new Set() }),
    ].every(Boolean));
    ok('un groupe vide est tenu pour vrai, comme dans Moodle', A.conditionRemplie({ op: '&', c: [] }, { notes: {}, acheves: new Set() }));
}

/* ------------------------------------------------------------------ */
const carte = (id, module = 'QuizSetQCM', extra = {}) => ({ id, titre: `Carte ${id}`, module, duree: 10, palier: 'entrainement', ...extra });
const planTroisChemins = (extra = {}) => ({
    titre: 'Plan', progression: { actif: true },
    etapes: [
        { id: 'e1', titre: 'Tester', cartes: [carte('p', 'Page'), carte('t', 'QuizSetQCM', { contenu: { questions: Array(10).fill({}) } })] },
        { id: 'e2', titre: 'Reprendre', chemin: { depuis: 0 }, cartes: [carte('a1', 'DragTheWords'), carte('a2', 'Page', { duree: 12 })] },
        { id: 'e3', titre: 'Consolider', chemin: { depuis: 40 }, cartes: [carte('b1', 'FillInTheBlanks'), carte('b2', 'QuizSetVF')] },
        { id: 'e4', titre: 'Approfondir', chemin: { depuis: 75 }, cartes: [carte('c1', 'Essay', { duree: 15 }), carte('c2', 'FillInTheBlanks')] },
        { id: 'e5', titre: 'Ensemble', cartes: [carte('z', 'Essay')] },
    ],
    ...extra,
});

console.log('\n── 3. Le cours vu par un élève, pour chaque score ─────────');
{
    const plan = planTroisChemins();
    const cours = A.coursDuPlan(plan);
    const [g] = cours.groupes;
    const noteId = cours.noteDe(g);
    const test = plan.etapes[0].cartes[1];
    const bornes = A.bornesEnReponses([40, 75], 10);
    const anomalies = [];
    for (let s = 0; s <= 10; s++) {
        const eleve = { notes: {}, acheves: new Set() };
        const vis = () => cours.sections.map(x => A.visibilitePourEleve(x.condition, eleve));
        const chemins = cours.sections.filter(x => x.type === 'chemin');
        const iCommune = cours.sections.findIndex(x => x.index === 4);
        const iFin = cours.sections.findIndex(x => x.type === 'fin');
        // Avant le test : ni chemin, ni étape commune, ni fin.
        let v = vis();
        if (chemins.some(c => v[cours.sections.indexOf(c)] !== 'masquee') || v[iCommune] !== 'masquee' || v[iFin] !== 'masquee') anomalies.push(`${s} : visible avant le test`);
        for (const c of plan.etapes[0].cartes) eleve.acheves.add(cours.cm.get(c));
        eleve.notes[noteId] = A.noteMoodle(s, 10);
        v = vis();
        const ouverts = chemins.filter(c => v[cours.sections.indexOf(c)] === 'ouverte');
        const attendu = bornes.filter(b => s >= b).length;
        if (ouverts.length !== 1 || ouverts[0].index !== 1 + attendu) { anomalies.push(`${s} : ${ouverts.length} chemin(s)`); continue; }
        if (chemins.some(c => c !== ouverts[0] && v[cours.sections.indexOf(c)] !== 'masquee')) anomalies.push(`${s} : un autre chemin se voit`);
        if (v[iCommune] !== 'masquee') anomalies.push(`${s} : étape commune avant la fin du chemin`);
        for (const c of ouverts[0].etape.cartes) eleve.acheves.add(cours.cm.get(c));
        v = vis();
        if (v[iCommune] !== 'ouverte' || v[iFin] !== 'masquee') anomalies.push(`${s} : après le chemin, commune ${v[iCommune]}, fin ${v[iFin]}`);
        for (const c of plan.etapes[4].cartes) eleve.acheves.add(cours.cm.get(c));
        if (vis()[iFin] !== 'ouverte') anomalies.push(`${s} : la fin ne s’ouvre pas`);
    }
    ok('0 à 10 bonnes réponses : rien avant le test, puis un seul chemin, le bon ; l’étape commune au bout ; la fin en dernier',
        anomalies.length === 0, anomalies.join(' | '));
    ok('le test est bien la dernière activité notée de l’étape d’avant', g.test === test && g.commune?.index === 4);
    const sansTest = A.coursDuPlan(planTroisChemins({ etapes: planTroisChemins().etapes.map((e, i) => (i === 0 ? { ...e, cartes: [carte('p', 'Page')] } : e)) }));
    ok('sans test, aucun chemin ne reçoit de condition (le plan est bloqué en amont)', sansTest.sections.filter(x => x.type === 'chemin').every(x => x.condition === null));
    const d = A.dureeParEleve(plan);
    const n = A.activitesParEleve(plan);
    // 20 min avant le test, un chemin de 20 à 25 min, 10 min ensemble.
    ok('durée et activités d’un élève : le tronc commun et UN chemin', d.min === 50 && d.max === 55 && n.min === 5 && n.max === 5, JSON.stringify({ d, n }));
}

/* ------------------------------------------------------------------ */
console.log('\n── 4. Édition du plan ──────────────────────────────────────');
{
    let compteur = 0;
    const id = p => `${p}${++compteur}`;
    const roles = plan => A.aiguillagesDuPlan(plan)[0]?.chemins.map(c => c.role).join(',') || '';
    const plan = { etapes: [{ id: 'e1', cartes: [carte('t')] }, { id: 'e2', cartes: [carte('x', 'DragTheWords')] }, { id: 'e3', cartes: [] }] };
    A.ouvrirChemins(plan, 1, 3, id);
    ok('ouvrir trois chemins : l’étape devient le premier, deux copies de SA structure la suivent',
        roles(plan) === 'renforcer,consolider,approfondir' && plan.etapes.length === 5
        && plan.etapes.slice(1, 4).every(e => e.cartes.length === 1 && e.cartes[0].module === 'DragTheWords'),
        roles(plan));
    ok('seuils par défaut posés, le premier chemin part de 0',
        JSON.stringify(plan.etapes.slice(1, 4).map(e => e.chemin.depuis)) === '[0,40,75]');
    const idConsolider = plan.etapes[2].id;
    A.changerNombreDeChemins(plan, 1, 1, id);
    ok('un chemin de plus : « Reprendre les bases » arrive EN TÊTE, chacun garde le sien',
        roles(plan) === 'reprendre,renforcer,consolider,approfondir' && plan.etapes[3].id === idConsolider, roles(plan));
    A.changerNombreDeChemins(plan, 1, -1, id);
    ok('un de moins : c’est « Reprendre les bases » qui part', roles(plan) === 'renforcer,consolider,approfondir' && plan.etapes[2].id === idConsolider, roles(plan));
    A.changerNombreDeChemins(plan, 1, -1, id);
    ok('deux chemins : « Consolider » disparaît, les extrêmes restent', roles(plan) === 'renforcer,approfondir', roles(plan));
    ok('ni moins de deux, ni plus de quatre', !A.changerNombreDeChemins(plan, 1, -1, id)
        && A.changerNombreDeChemins(plan, 1, 1, id) && A.changerNombreDeChemins(plan, 1, 1, id) && !A.changerNombreDeChemins(plan, 1, 1, id));
    const avant = plan.etapes.length;
    const idConsoliderFinal = A.aiguillagesDuPlan(plan)[0].chemins.find(c => c.role === 'consolider').etape.id;
    A.fermerChemins(plan, 2);
    ok('refermer : une étape ordinaire reste, celle de « Consolider »', !A.aDesChemins(plan) && plan.etapes.length === avant - 3
        && plan.etapes[1].id === idConsoliderFinal && !('chemin' in plan.etapes[1]));
    const brut = { etapes: [
        { id: 'a', cartes: [carte('t')] },
        { id: 'b', chemin: { depuis: 0 }, cartes: [carte('1')] },
        { id: 'c', chemin: { depuis: 80 }, cartes: [carte('2')] },
        { id: 'd', chemin: { depuis: 20 }, cartes: [carte('3')] },
        { id: 'e', cartes: [carte('4')] },
        { id: 'f', chemin: 'renforcer', cartes: [carte('5')] },
        { id: 'g', chemin: { depuis: 0 }, cartes: [carte('6')] },
    ] };
    A.normaliserAiguillages(brut);
    ok('normaliser : seuils non croissants → par défaut ; « chemin » en texte → retiré ; chemin isolé → étape ordinaire',
        JSON.stringify(brut.etapes.map(e => e.chemin?.depuis ?? null)) === '[null,0,40,75,null,null,null]', JSON.stringify(brut.etapes.map(e => e.chemin)));
    const cinq = { etapes: [{ id: 't', cartes: [carte('t')] }, ...[0, 20, 40, 60, 80].map((d, i) => ({ id: `c${i}`, chemin: { depuis: d }, cartes: [carte(`x${i}`)] }))] };
    A.normaliserAiguillages(cinq);
    ok('cinq chemins : le cinquième redevient une étape ordinaire', A.aiguillagesDuPlan(cinq)[0].chemins.length === 4 && !('chemin' in cinq.etapes[5]));
}

/* ------------------------------------------------------------------ */
console.log('\n── 5. Blocages, historique, réglages ───────────────────────');
{
    const codes = plan => A.problemesAiguillage(plan, { sansAchevement: m => m === 'parcours_etiquette' }).map(p => p.code).sort().join(',');
    ok('un plan correct ne bloque rien', codes(planTroisChemins()) === '');
    const p1 = planTroisChemins(); p1.etapes[0].cartes = [carte('p', 'Page')];
    const p2 = planTroisChemins(); p2.etapes[0].cartes[1] = carte('t', 'QuizSetQCM', { contenu: { questions: [{}] } });
    const p3 = planTroisChemins(); p3.etapes[2].cartes = [];
    const p4 = planTroisChemins(); p4.etapes[2].cartes = [carte('l', 'parcours_etiquette')];
    const p5 = planTroisChemins(); p5.etapes[0].cartes[1] = carte('t', 'QuizSet');
    const p6 = { etapes: planTroisChemins().etapes.slice(1) };
    ok('bloquent : pas de test, une seule question pour trois chemins, un chemin vide, un chemin qui ne s’achève jamais, un Quiz mixte, des chemins en tête',
        codes(p1) === 'sans_test' && codes(p2) === 'questions_insuffisantes' && codes(p3) === 'chemin_vide'
        && codes(p4) === 'chemin_sans_achevement' && codes(p5) === 'sans_test' && codes(p6) === 'sans_etape_test',
        [p1, p2, p3, p4, p5, p6].map(codes).join(' / '));
    ok('à défaut de contenu, le nombre de questions est celui que la fabrication demandera',
        A.nombreQuestions(carte('t', 'QuizSetQCM', { duree: 12 }), 3) === 10 && A.nombreQuestions(carte('t', 'QuizSetQCM', { duree: 20 }), 2) === 17);

    const plan = planTroisChemins();
    const titres = h => h.map(x => (x.carte ? x.carte.id : `[${x.chemins.length} chemins]`)).join(',');
    ok('dans un chemin, l’historique ignore les autres chemins', titres(A.historiqueDeLaCarte(plan, plan.etapes[3].cartes[1])) === 'p,t,c1');
    ok('après l’aiguillage, « un chemin parmi d’autres », sans en citer les activités', titres(A.historiqueDeLaCarte(plan, plan.etapes[4].cartes[0])) === 'p,t,[3 chemins]');

    const qcm = { endGame: { showRetryButton: true }, poolSize: 4, questions: [
        { library: 'H5P.MultiChoice 1.16', params: { behaviour: { singlePoint: false } } },
        { library: 'H5P.MultiChoice 1.16', params: {} },
    ] };
    const regle = A.reglagesDeCarte(plan, plan.etapes[0].cartes[1], qcm);
    ok('le test : sans « Recommencer », un point par question, toutes posées', regle.endGame.showRetryButton === false
        && !('poolSize' in regle) && regle.questions.every(q => q.params.behaviour.singlePoint === true));
    ok('le contenu d’origine n’est pas modifié', qcm.poolSize === 4 && qcm.questions[0].params.behaviour.singlePoint === false);
    const vf = { questions: [{ library: 'H5P.TrueFalse 1.8', params: { behaviour: {} } }] };
    const renforcer = A.reglagesDeCarte(planTroisChemins(), planTroisChemins().etapes[1].cartes[0], { behaviour: {} });
    const pl = planTroisChemins();
    const approfondir = A.reglagesDeCarte(pl, pl.etapes[3].cartes[1], { behaviour: { enableSolutionsButton: true } });
    const quizApprofondir = A.reglagesDeCarte(pl, { ...pl.etapes[3].cartes[1], module: 'QuizSetVF', id: 'c2' }, vf);
    ok('« Reprendre » et « Renforcer » : correction immédiate ; « Approfondir » : solution retirée',
        renforcer.behaviour.instantFeedback === true
        && approfondir.behaviour.enableSolutionsButton === false
        && quizApprofondir.endGame?.showSolutionButton === false && quizApprofondir.questions[0].params.behaviour.enableSolutionsButton === false,
        JSON.stringify({ renforcer, approfondir, quizApprofondir }));
    ok('hors chemin et hors test, rien ne change', A.reglagesDeCarte(pl, pl.etapes[4].cartes[0], { behaviour: {} }).behaviour.enableRetry === undefined);
}

/* ------------------------------------------------------------------ */
console.log('\n── 6. Trames et calibrage ──────────────────────────────────');
{
    const ecarts = [];
    let vues = 0;
    for (const a of CONFIG.ampleurs) for (const f of CONFIG.formats) for (const k of CONFIG.nombresDeChemins) {
        for (const tr of tramesCompatibles(f.id, a.id, { structure: 'chemins', chemins: k })) {
            if (!tr.modules) continue;
            vues++;
            const lieu = `${tr.id}/${a.id}/${f.id}/${k}`;
            if (tr.aiguillage?.nombre !== k || tr.aiguillage.roles.join() !== A.ROLES_PAR_NOMBRE[k].join()) ecarts.push(`${lieu} : rôles`);
            const eleve = nbActivitesParEleve(tr);
            if (eleve < a.activites[0] || eleve > a.activites[1]) ecarts.push(`${lieu} : ${eleve} par élève`);
            if (nbActivites(tr) > 12) ecarts.push(`${lieu} : ${nbActivites(tr)} à fabriquer`);
            const avant = tr.modules[tr.aiguillage.debut - 1] || [];
            if (!A.MODULES_AIGUILLEURS.has(avant.at(-1))) ecarts.push(`${lieu} : l’étape d’avant ne finit pas par un test`);
        }
        const libre = calibrer({ ampleur: a.id, format: f.id, trame: 'libre', structure: 'chemins', chemins: k });
        const ex = libre.exemple;
        const communes = ex[0] + ex.slice(1 + k).reduce((x, y) => x + y, 0);
        const parEleve = communes + Math.max(...ex.slice(1, 1 + k));
        const total = ex.reduce((x, y) => x + y, 0);
        if (parEleve < a.activites[0] || parEleve > a.activites[1] || total > 12 || total < libre.min || ex.length !== k + 2)
            ecarts.push(`libre/${a.id}/${k} : exemple ${JSON.stringify(ex)} (${parEleve} par élève, ${total} à fabriquer, min ${libre.min})`);
    }
    ok(`${vues} trames à chemins dépliées, et la structure libre : un élève fait ce que promet l’ampleur, douze activités au plus à fabriquer`,
        vues > 0 && ecarts.length === 0, ecarts.slice(0, 5).join(' | '));
    ok('aucune trame linéaire ne se glisse parmi les trames à chemins, et inversement', CONFIG.ampleurs.every(a => CONFIG.formats.every(f =>
        tramesCompatibles(f.id, a.id, { structure: 'chemins' }).every(tr => tr.id === 'libre' || tr.structure === 'chemins')
        && tramesCompatibles(f.id, a.id).every(tr => tr.structure !== 'chemins'))));
}

/* ------------------------------------------------------------------ */
console.log('\n── 7. La vitrine et « Évaluer » (D102) ─────────────────────');
{
    const ecarts = [];
    for (const a of CONFIG.ampleurs) for (const f of CONFIG.formats) {
        const compatibles = tramesCompatibles(f.id, a.id);
        const vitrine = trameEnVitrine(compatibles).map(tr => tr.id);
        const attendues = VITRINE.filter(id => compatibles.some(tr => tr.id === id));
        if (JSON.stringify(vitrine.slice(0, attendues.length)) !== JSON.stringify(attendues)) ecarts.push(`${a.id}/${f.id} : ${vitrine.join(',')}`);
        if (vitrine.length < Math.min(3, compatibles.filter(tr => tr.id !== 'libre').length) || vitrine.includes('libre')) ecarts.push(`${a.id}/${f.id} : ${vitrine.length} en vitrine`);
    }
    ok('la vitrine montre d’abord apprendre, réviser, s’entraîner, évaluer (quand ils sont compatibles), trois au moins, jamais la structure libre',
        ecarts.length === 0, ecarts.join(' | '));
    const seance = trameEnVitrine(tramesCompatibles('distanciel', 'courte')).map(tr => tr.id).join(',');
    ok('en séance, les quatre intentions de Gauthier, dans son ordre', seance === 'autonomie,revision,entrainement,evaluation', seance);
    const test = { module: 'test_elea', duree: 25 };
    const regle = reglagesDeTrame('evaluation', test, { questions: [], quiz_settings: { overallfeedback: [{ from: 0, to: 100, feedback: 'x' }] } });
    ok('« Évaluer » règle le Test en épreuve : une tentative, feedback différé, note seule, chronométré sur la durée de la carte',
        JSON.stringify(regle.quiz_settings) === JSON.stringify({ overallfeedback: [{ from: 0, to: 100, feedback: 'x' }], attempts: 1, preferredbehaviour: 'deferredfeedback', review: 'marks', timelimit_minutes: 25 }),
        JSON.stringify(regle.quiz_settings));
    const intact = { questions: [] };
    ok('les autres trames, et les autres activités d’« Évaluer », ne sont pas touchées',
        reglagesDeTrame('revision', test, intact) === intact && reglagesDeTrame('evaluation', { module: 'QuizSet', duree: 10 }, intact) === intact);
}

console.log('\n── 8. Le vocabulaire de la plateforme (D105) ───────────────');
{
    // Élèves sur Éléa, stagiaires sur Magistère, étudiants sur Moodle : un texte qui
    // nomme le public a sa variante `<clé>_magistere` / `<clé>_moodle`, que seul le
    // `t()` de `vocabulaire.js` sait choisir. Un module qui importerait celui du cœur
    // reparlerait d'élèves partout, sans que rien d'autre ne le voie.
    const dossier = new URL('../js/parcours/', import.meta.url);
    const directs = readdirSync(dossier).filter(f => f.endsWith('.js') && f !== 'vocabulaire.js')
        .filter(f => /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*'\.\.\/core\/translation\.js'/.test(readFileSync(new URL(f, dossier), 'utf8')));
    ok('aucun module de l’atelier ne prend `t` au cœur : tous passent par vocabulaire.js', !directs.length, directs.join(', '));

    const locales = Object.fromEntries(['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br']
        .map(l => [l, JSON.parse(readFileSync(new URL(`../js/locales/${l}.json`, import.meta.url), 'utf8'))]));
    const fr = locales.fr;
    const variantes = Object.keys(fr).filter(k => /_(magistere|moodle)$/.test(k) && k.startsWith('parcours_')
        && fr[k.replace(/_(magistere|moodle)$/, '')] !== undefined);
    const jetons = x => String(x).match(/@\w+/g)?.sort().join(',') || '';
    ok(`${variantes.length} variantes, chacune à côté de sa clé de base, avec les mêmes jetons dans les 12 langues`,
        variantes.length >= 120 && Object.entries(locales).every(([, d]) => variantes.every(k => jetons(d[k]) === jetons(d[k.replace(/_(magistere|moodle)$/, '')]))),
        Object.entries(locales).flatMap(([l, d]) => variantes.filter(k => jetons(d[k]) !== jetons(d[k.replace(/_(magistere|moodle)$/, '')])).map(k => `${l}:${k}`)).slice(0, 8).join(' '));
    const fautives = variantes.filter(k => /élève/i.test(fr[k]) || (/_moodle$/.test(k) && /stagiaire/.test(fr[k])) || (/_magistere$/.test(k) && /étudiant/.test(fr[k])));
    ok('en français, une variante Magistère ne parle que de stagiaires, une variante Moodle que d’étudiants', !fautives.length, fautives.join(', '));
    const nonTraduites = Object.entries(locales).filter(([l]) => l !== 'fr')
        .flatMap(([l, d]) => variantes.filter(k => d[k] === fr[k]).map(k => `${l}:${k}`));
    ok('les variantes sont traduites dans les 11 autres langues', !nonTraduites.length, `${nonTraduites.length} : ${nonTraduites.slice(0, 6).join(' ')}`);
}

console.log('\n========================================');
console.log(`parcours — chemins (Node pur) : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : 0);
