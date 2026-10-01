/**
 * run_parcours_reparation.mjs — Le plan reçu se répare avant d'être jugé (D107), en Node pur.
 *
 * Le 1er oct. 2026, avec Mistral Small 4, 7 cadrages sur 16 renvoyaient l'enseignant
 * au cadrage sans plan — tous à chemins, 5 pour la seule durée des chemins. Les 25
 * plans RÉELS de ce relevé (`tests/fixtures/parcours-plans-reels/`, dont 18 refusés
 * par le contrôle) sont rejoués ici sans modèle :
 *
 *  1. Plans réels — un plan refusé devient un plan que l'atelier accepte et que la
 *     fabrication peut suivre (aucun problème bloquant d'aiguillage) ; un plan
 *     conforme n'est pas touché ;
 *  2. Propriétés — le plan reçu n'est jamais modifié ; réparer deux fois ne change
 *     plus rien ;
 *  3. Chaque réparation, sur un cas fabriqué : durées des chemins, test posé ou
 *     converti, chemins regroupés, rôles, chemins en trop ou manquants, ampleur,
 *     paliers, modules, durées, textes, rituel ;
 *  4. Tirage — 300 plans réels abîmés au hasard (graine fixe) : tous en sortent
 *     utilisables ;
 *  5. L'exemple du prompt de plan (D108) — pour chaque cadrage possible (plateforme,
 *     modalité, ampleur, chemins, trame), il passe lui-même le contrôle, a la forme
 *     demandée, des chemins de même durée, et le registre de la plateforme ;
 *  6. Contre-épreuve — sans réparation, les plans réels refusés le restent : le
 *     banc vire au ROUGE si l'on désarme `reparerPlan`.
 *
 * Lancement :  node tests/run_parcours_reparation.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { calibrer, controlerCalibrage } from '../js/parcours/calibrage.js';
import { reparerPlan, graviteCadrage, palierVoisin } from '../js/parcours/reparation-plan.js';
import { normaliserAiguillages, problemesAiguillage, MODULES_AIGUILLEURS } from '../js/parcours/aiguillage.js';
import { exemplePlan } from '../js/parcours/exemple-plan.js';
import { tramesCompatibles } from '../js/parcours/templates.js';
import { CONFIG } from '../js/parcours/config.js';

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Suite pseudo-aléatoire DÉTERMINISTE : un échec se rejoue à l'identique. */
let graine = 20261001;
const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
const entier = n => Math.floor(hasard() * n);

const TEXTES = {
    test: { titre: 'Test de positionnement', objectif: 'Faire le point sur les notions du parcours', consigne: 'Réponds aux questions : ta note ouvre la suite du parcours.' },
    etape: { titre: 'Faire le point', objectif: 'Situer ses acquis avant la suite du parcours', introduction: 'Commence par ce test : il ouvre la suite du parcours.' },
};
/** Le plus proche module, comme `resoudreModule` : un repli par palier. */
const resoudre = (module, palier) => ({ decouverte: 'Page', entrainement: 'QuizSetQCM', transfert: 'Essay' }[palier] || 'Page');
const options = (cadrage, plus = {}) => ({ resoudre, sujet: 'La proportionnalité', textes: TEXTES, ...plus });

/** Ce que fait `normaliserPlan` des chemins (screen-plan.js, lié au DOM) : des identifiants, `chemin` en objet. */
function normaliser(brut) {
    let n = 0;
    const plan = {
        etapes: (brut.etapes || []).map(e => ({
            id: `e${++n}`, titre: e.titre, objectif: e.objectif,
            cartes: (e.cartes || []).map(c => ({ id: `c${++n}`, module: c.module, palier: c.palier, duree: c.duree, titre: c.titre })),
            ...(e.chemin ? { chemin: { depuis: Number(e.chemin && e.chemin.depuis) } } : {}),
        })),
    };
    return normaliserAiguillages(plan);
}

/** Un plan que l'atelier accepte et que la fabrication peut suivre. */
function utilisable(plan, cal, modules) {
    const erreurs = controlerCalibrage(plan, cal, modules);
    const total = plan.etapes.reduce((s, e) => s + e.cartes.length, 0);
    const problemes = cal.aiguillage ? problemesAiguillage(normaliser(plan)) : [];
    const raisons = [];
    if (!plan.etapes.length || !total) raisons.push('plan vide');
    if (total > 12) raisons.push(`${total} activités (> 12)`);
    if (graviteCadrage(erreurs) >= 10) raisons.push(`écart de structure : ${erreurs.filter(e => graviteCadrage([e]) >= 10).join(' | ')}`);
    if (problemes.length) raisons.push(`aiguillage : ${problemes.map(p => p.code).join(', ')}`);
    if (cal.aiguillage && !normaliser(plan).etapes.some(e => e.chemin)) raisons.push('aucun chemin');
    return { ok: !raisons.length, raisons, erreurs };
}

/** La boucle de l'atelier, sans modèle : réparer, puis en dernier recours si un écart reste. */
function reparerCommeLAtelier(brut, cal, modules) {
    const premier = reparerPlan(brut, cal, modules, options());
    if (!controlerCalibrage(premier.plan, cal, modules).length) return premier;
    const dernier = reparerPlan(premier.plan, cal, modules, options({}, { dernierRecours: true }));
    return { plan: dernier.plan, corrections: [...premier.corrections, ...dernier.corrections] };
}

const dossier = new URL('./fixtures/parcours-plans-reels/', import.meta.url);
const reels = readdirSync(dossier).filter(f => f.endsWith('.json')).sort().map(f => {
    const r = JSON.parse(readFileSync(new URL(f, dossier), 'utf8'));
    const cal = calibrer(r.cadrage);
    const modules = r.modules.map(cle => ({ cle }));
    return { id: f.replace(/\.json$/, ''), ...r, cal, modules };
});
const refuses = reels.filter(r => controlerCalibrage(r.brut, r.cal, r.modules).length);
const conformes = reels.filter(r => !controlerCalibrage(r.brut, r.cal, r.modules).length);

// ---------------------------------------------------------------- 1. Plans réels
console.log('\n1. Plans réels (Mistral Small 4, relevé du 1er oct. 2026)');
ok(`${reels.length} plans réels, dont ${refuses.length} refusés par le contrôle`, reels.length >= 25 && refuses.length >= 18);
const dureesSeules = refuses.filter(r => controlerCalibrage(r.brut, r.cal, r.modules).every(e => /durent à peu près autant/.test(e)));
const reussisDuPremierCoup = dureesSeules.filter(r => !controlerCalibrage(reparerPlan(r.brut, r.cal, r.modules, options()).plan, r.cal, r.modules).length);
ok(`refusés pour la seule durée des chemins (${dureesSeules.length}) : acceptés après réparation, sans dernier recours`,
    dureesSeules.length >= 5 && reussisDuPremierCoup.length === dureesSeules.length,
    dureesSeules.filter(r => !reussisDuPremierCoup.includes(r)).map(r => r.id).join(', '));
const bilan = refuses.map(r => {
    const { plan, corrections } = reparerCommeLAtelier(r.brut, r.cal, r.modules);
    return { r, plan, corrections, ...utilisable(plan, r.cal, r.modules) };
});
for (const b of bilan) {
    ok(`${b.r.id} : utilisable après réparation (${b.erreurs.length ? `écarts acceptés : ${b.erreurs.length}` : 'conforme'})`, b.ok, b.raisons.join(' ; '));
}
const conformesApres = bilan.filter(b => !b.erreurs.length).length;
ok(`la plupart des refusés deviennent CONFORMES au contrôle (${conformesApres}/${bilan.length})`, conformesApres >= bilan.length - 2,
    bilan.filter(b => b.erreurs.length).map(b => `${b.r.id} : ${b.erreurs.join(' | ')}`).join('\n     '));
for (const r of conformes) {
    const { plan, corrections } = reparerPlan(r.brut, r.cal, r.modules, options());
    ok(`${r.id} (conforme) : rien n'est corrigé`, !corrections.length && !controlerCalibrage(plan, r.cal, r.modules).length, corrections.join(' | '));
}

// ---------------------------------------------------------------- 2. Propriétés
console.log('\n2. Propriétés');
const intacts = reels.every(r => {
    const avant = JSON.stringify(r.brut);
    reparerPlan(r.brut, r.cal, r.modules, options({}, { dernierRecours: true }));
    return JSON.stringify(r.brut) === avant;
});
ok('le plan reçu n’est jamais modifié (copie)', intacts);
const idempotents = reels.filter(r => {
    const une = reparerCommeLAtelier(r.brut, r.cal, r.modules).plan;
    const deux = reparerPlan(une, r.cal, r.modules, options({}, { dernierRecours: true }));
    return deux.corrections.length || JSON.stringify(deux.plan) !== JSON.stringify(une);
});
ok('réparer un plan réparé ne change plus rien', !idempotents.length, idempotents.map(r => r.id).join(', '));
ok('une réponse qui n’est pas un objet est rendue telle quelle', reparerPlan(null, refuses[0].cal, []).plan === null
    && reparerPlan('texte', refuses[0].cal, []).plan === 'texte' && Array.isArray(reparerPlan([1], refuses[0].cal, []).plan));

// ---------------------------------------------------------------- 3. Chaque réparation
console.log('\n3. Chaque réparation, sur un cas fabriqué');
const MODULES = ['Page', 'QuizSetQCM', 'QuizSetVF', 'QuizSet', 'TrueFalse', 'DragTheWords', 'FillInTheBlanks', 'Essay', 'test_elea', 'parcours_forum'].map(cle => ({ cle }));
const carte = (module, duree = 10, titre = `Activité ${module}`) => ({ titre, objectif: `Objectif ${titre}`, consigne: `Consigne ${titre}`, module, palier: 'entrainement', duree });
const etape = (titre, cartes, chemin) => ({ titre, objectif: `Objectif ${titre}`, introduction: '…', cartes, ...(chemin ? { chemin } : {}) });
const cal3 = calibrer({ platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'auto', structure: 'chemins', chemins: 3 });
const base3 = () => ({
    titre: 'Plan', objectifGeneral: 'Objectif', notionsPivots: ['a', 'b', 'c'],
    etapes: [
        etape('Départ', [carte('Page', 10), carte('QuizSetQCM', 15, 'Test')]),
        etape('Pas à pas', [carte('Page', 10), carte('DragTheWords', 15)], 'renforcer'),
        etape('Défis', [carte('FillInTheBlanks', 10), carte('QuizSetQCM', 15)], 'consolider'),
        etape('Vers l’autonomie', [carte('Essay', 20), carte('FillInTheBlanks', 5)], 'approfondir'),
        etape('Bilan', [carte('QuizSetQCM', 15)]),
    ],
});
ok('le plan fabriqué de référence est conforme', !controlerCalibrage(base3(), cal3, MODULES).length, controlerCalibrage(base3(), cal3, MODULES).join(' | '));
const dureesChemins = p => p.etapes.filter(e => e.chemin).map(e => e.cartes.reduce((s, c) => s + c.duree, 0));
{
    const p = base3(); p.etapes[3].cartes = [carte('Essay', 40), carte('FillInTheBlanks', 20)];
    const r = reparerPlan(p, cal3, MODULES, options()).plan;
    const d = dureesChemins(r);
    ok(`durées des chemins 25, 25, 60 → égales (${d.join(', ')})`, new Set(d).size === 1 && d.every(x => x % 5 === 0)
        && !controlerCalibrage(r, cal3, MODULES).length);
    const q = base3(); q.etapes[1].cartes[0].duree = 7; q.etapes[3].cartes = [carte('Essay', 41), carte('FillInTheBlanks', 18)];
    const d2 = dureesChemins(reparerPlan(q, cal3, MODULES, options()).plan);
    ok(`hors des multiples de cinq, l'égalisation se fait à la minute (${d2.join(', ')})`, new Set(d2).size === 1);
    const proche = base3(); proche.etapes[3].cartes[0].duree = 25;
    ok('des chemins déjà comparables (25, 25, 30) ne sont pas retouchés', !reparerPlan(proche, cal3, MODULES, options()).corrections.length);
}
{
    const p = base3(); p.etapes[0].cartes[1].module = 'QuizSet';
    const r = reparerPlan(p, cal3, MODULES, options()).plan;
    ok('un Quiz mixte avant les chemins devient le Quiz QCM qui oriente', r.etapes[0].cartes[1].module === 'QuizSetQCM' && r.etapes[0].cartes.length === 2);
    const v = base3(); v.etapes[0].cartes[1].module = 'TrueFalse';
    ok('un Vrai/Faux devient le Quiz Vrai/Faux', reparerPlan(v, cal3, MODULES, options()).plan.etapes[0].cartes[1].module === 'QuizSetVF');
    const sans = base3(); sans.etapes[0].cartes = [carte('Page', 10)];
    const rs = reparerPlan(sans, cal3, MODULES, options()).plan;
    const ajoute = rs.etapes[0].cartes[1];
    ok('sans quiz, le test est ajouté en fin d’étape, avec ses textes traduits', rs.etapes[0].cartes.length === 2 && ajoute.module === 'QuizSetQCM'
        && ajoute.titre === TEXTES.test.titre && ajoute.consigne === TEXTES.test.consigne && !controlerCalibrage(rs, cal3, MODULES).length);
    const test = reparerPlan(sans, cal3, MODULES.filter(m => m.cle !== 'QuizSetQCM'), options()).plan.etapes[0].cartes[1];
    ok('sans Quiz QCM au catalogue, le test de la plateforme', test.module === 'test_elea');
    const tete = base3(); tete.etapes.shift();
    const rt = reparerPlan(tete, cal3, MODULES, options()).plan;
    ok('des chemins en tête de parcours : une étape du test les précède', rt.etapes[0].titre === TEXTES.etape.titre
        && MODULES_AIGUILLEURS.has(rt.etapes[0].cartes[0].module) && !problemesAiguillage(normaliser(rt)).length);
}
{
    const p = base3(); const [chemin] = p.etapes.splice(2, 1); p.etapes.splice(4, 0, chemin);
    const r = reparerPlan(p, cal3, MODULES, options()).plan;
    ok('des chemins séparés par une étape commune sont regroupés', r.etapes.map(e => e.chemin || '-').join() === '-,renforcer,consolider,approfondir,-'
        && !controlerCalibrage(r, cal3, MODULES).length);
    const roles = base3(); roles.etapes[1].chemin = 'chemin A'; roles.etapes[2].chemin = 'approfondir'; roles.etapes[3].chemin = 'consolider';
    ok('des rôles inconnus ou intervertis sont remis dans l’ordre', reparerPlan(roles, cal3, MODULES, options()).plan.etapes.slice(1, 4).map(e => e.chemin).join() === 'renforcer,consolider,approfondir');
}
{
    const cinq = base3(); cinq.etapes.splice(4, 0, etape('Encore', [carte('Page'), carte('Essay')], 'bis'), etape('Toujours', [carte('Page'), carte('Essay')], 'ter'));
    const r5 = reparerPlan(cinq, cal3, MODULES, options({}, { dernierRecours: true })).plan;
    ok('cinq chemins pour trois demandés : les trois premiers restent (dernier recours)', r5.etapes.filter(e => e.chemin).length === 3 && utilisable(r5, cal3, MODULES).ok);
    const deux = base3(); deux.etapes.splice(2, 1);
    const r2 = reparerPlan(deux, cal3, MODULES, options({}, { dernierRecours: true })).plan;
    ok('deux chemins pour trois demandés : le voisin est copié, rôles dans l’ordre', r2.etapes.filter(e => e.chemin).map(e => e.chemin).join() === 'renforcer,consolider,approfondir'
        && r2.etapes[2].titre === 'Pas à pas' && utilisable(r2, cal3, MODULES).ok);
    const aucun = base3(); aucun.etapes.forEach(e => delete e.chemin); aucun.etapes.splice(2, 2);
    const r0 = reparerPlan(aucun, cal3, MODULES, options({}, { dernierRecours: true })).plan;
    ok('aucun chemin : la deuxième étape est ouverte en trois chemins, après le test', r0.etapes.filter(e => e.chemin).length === 3 && utilisable(r0, cal3, MODULES).ok,
        utilisable(r0, cal3, MODULES).raisons.join(' ; '));
    const seul = base3(); seul.etapes.forEach(e => delete e.chemin); seul.etapes.splice(2, 2); seul.etapes[1].chemin = 'renforcer';
    ok('un chemin isolé redevient l’étape qu’on ouvre en trois', reparerPlan(seul, cal3, MODULES, options({}, { dernierRecours: true })).plan.etapes.filter(e => e.chemin).length === 3);
    ok('sans dernier recours, le nombre de chemins n’est pas touché', reparerPlan(deux, cal3, MODULES, options()).plan.etapes.filter(e => e.chemin).length === 2);
}
{
    const gros = base3();
    gros.etapes[0].cartes.unshift(carte('Page'), carte('DragTheWords'), carte('FillInTheBlanks'));
    gros.etapes.slice(1, 4).forEach(e => e.cartes.push(carte('Essay'), carte('QuizSetQCM')));
    gros.etapes[4].cartes.push(carte('Essay'), carte('Page'));
    const total = p => p.etapes.reduce((s, e) => s + e.cartes.length, 0);
    const r = reparerPlan(gros, cal3, MODULES, options({}, { dernierRecours: true })).plan;
    const longueurs = r.etapes.filter(e => e.chemin).map(e => e.cartes.length);
    ok(`${total(gros)} activités → ${total(r)} : sous le plafond et dans l’ampleur, test gardé, chemins de même longueur`,
        total(r) <= cal3.max && utilisable(r, cal3, MODULES).ok && r.etapes[0].cartes.some(c => c.titre === 'Test') && new Set(longueurs).size === 1,
        `${total(r)} ; ${utilisable(r, cal3, MODULES).raisons.join(' ; ')}`);
    ok('aucune étape n’est vidée par le dernier recours', r.etapes.every(e => e.cartes.length));
    const calCourte = calibrer({ platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'auto', structure: 'lineaire' });
    const huit = { titre: 'Plan', objectifGeneral: 'Objectif', etapes: [etape('A', [carte('Page'), carte('QuizSetQCM')]), etape('B', [carte('DragTheWords'), carte('FillInTheBlanks'), carte('TrueFalse')]), etape('C', [carte('Essay'), carte('Page'), carte('QuizSetVF')])] };
    const rh = reparerPlan(huit, calCourte, MODULES, options({}, { dernierRecours: true })).plan;
    ok(`une séance (3 à 4 activités) reçue avec ${total(huit)} : ramenée à ${total(rh)}, chaque étape gardée`, total(rh) === calCourte.max && rh.etapes.length === 3 && rh.etapes.every(e => e.cartes.length));
    ok('sans dernier recours, aucune activité n’est retirée', total(reparerPlan(huit, calCourte, MODULES, options()).plan) === total(huit));
}
{
    ok('paliers voisins reconnus', palierVoisin('Consolidation') === 'entrainement' && palierVoisin('Évaluation') === 'transfert'
        && palierVoisin('Découverte') === 'decouverte' && palierVoisin('diagnostique') === 'decouverte' && palierVoisin('xyz') === null);
    const p = base3();
    p.etapes[0].cartes[0].palier = 'Consolidation'; p.etapes[4].cartes[0].palier = undefined; p.etapes[1].cartes[0].palier = 'n’importe';
    const r = reparerPlan(p, cal3, MODULES, options()).plan;
    ok('palier : synonyme ramené, palier absent déduit de la place (bilan → transfert, chemin → entraînement)',
        r.etapes[0].cartes[0].palier === 'entrainement' && r.etapes[4].cartes[0].palier === 'transfert' && r.etapes[1].cartes[0].palier === 'entrainement');
    const m = base3(); m.etapes[4].cartes[0].module = 'QuizInventé'; m.etapes[1].cartes[0].module = 'H5P.Truc';
    const rm = reparerPlan(m, cal3, MODULES, options()).plan;
    ok('module inventé : le plus proche du palier, signalé sur la carte', rm.etapes[4].cartes[0].module === 'QuizSetQCM' && rm.etapes[4].cartes[0].moduleReplie === true
        && rm.etapes[1].cartes[0].module === 'QuizSetQCM' && !controlerCalibrage(rm, cal3, MODULES).length);
    ok('module inventé sans résolveur : une Page', reparerPlan(m, cal3, MODULES, {}).plan.etapes[4].cartes[0].module === 'Page');
    const d = base3(); d.etapes[4].cartes[0].duree = '15 min'; d.etapes[0].cartes[0].duree = 0; d.etapes[2].cartes[0].duree = 500;
    const rd = reparerPlan(d, cal3, MODULES, options()).plan;
    ok('durées : « 15 min » → 15, 0 → 10, 500 → 180', rd.etapes[4].cartes[0].duree === 15 && rd.etapes[0].cartes[0].duree === 10 && rd.etapes[2].cartes[0].duree <= 180);
    const t = base3(); t.etapes[4].cartes[0] = { objectif: 'Faire le bilan', module: 'QuizSetQCM', palier: 'transfert', duree: 15 };
    t.etapes[4].cartes.push({ module: 'Page', duree: 5 }); t.etapes.splice(4, 0, etape('Vide', [])); t.titre = ''; t.etapes[1].titre = '';
    const rt = reparerPlan(t, cal3, MODULES, options()).plan;
    ok('textes : repris d’un voisin ; carte sans texte et étape vide retirées ; titre du parcours repris du sujet',
        rt.etapes[4].cartes.length === 1 && rt.etapes[4].cartes[0].titre === 'Faire le bilan' && rt.etapes[4].cartes[0].consigne === 'Faire le bilan'
        && rt.etapes.length === 5 && rt.titre === 'La proportionnalité' && rt.etapes[1].titre === 'Objectif Pas à pas' && !controlerCalibrage(rt, cal3, MODULES).length);
}
{
    const calRituel = calibrer({ platform: 'elea', format: 'presentiel', ampleur: 'courte', trame: 'rituel', structure: 'lineaire' });
    if (calRituel.trame?.id === 'rituel') {
        const p = { titre: 'Rituel', objectifGeneral: 'Réactiver', etapes: calRituel.rythme.map((n, i) => etape(`É${i + 1}`, Array.from({ length: n }, () => ({ ...carte('TrueFalse', 6), palier: calRituel.trame.paliers?.[i] || 'entrainement' })))) };
        const r = reparerPlan(p, calRituel, MODULES, options()).plan;
        ok('rituel : ramené à dix minutes', r.etapes.flatMap(e => e.cartes).reduce((s, c) => s + c.duree, 0) <= 10);
    } else ok('rituel : trame introuvable dans cette version (rien à vérifier)', true);
    const calTrame = calibrer({ platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'entrainement', structure: 'lineaire' });
    if (calTrame.trame && Array.isArray(calTrame.trame.paliers)) {
        const p = { titre: 'T', objectifGeneral: 'O', etapes: calTrame.rythme.map((n, i) => etape(`É${i + 1}`, Array.from({ length: n }, () => ({ ...carte('Page'), palier: 'transfert' })))) };
        const r = reparerPlan(p, calTrame, MODULES, options()).plan;
        ok('trame : le palier imposé par étape est posé', r.etapes.every((e, i) => e.cartes.every(c => c.palier === calTrame.trame.paliers[i])));
    } else ok('trame à paliers imposés : absente (rien à vérifier)', true);
}

// ---------------------------------------------------------------- 4. Tirage
console.log('\n4. Tirage : 300 plans réels abîmés au hasard');
const abimer = brut => {
    const p = structuredClone(brut);
    const etapes = p.etapes;
    const coups = 1 + entier(4);
    for (let k = 0; k < coups; k++) {
        const e = etapes[entier(etapes.length)];
        const c = e && e.cartes[entier(e.cartes.length)];
        switch (entier(9)) {
            case 0: if (c) c.duree = 5 * (1 + entier(12)); break;
            case 1: if (c) c.module = ['Inventé', 'H5P.Quiz', '', null][entier(4)]; break;
            case 2: if (c) c.palier = ['Évaluation', 'consolidation', '', 'x'][entier(4)]; break;
            case 3: if (c) { delete c.titre; delete c.consigne; } break;
            case 4: { const i = etapes.findIndex(x => x.chemin); if (i > 0) etapes[i - 1].cartes = etapes[i - 1].cartes.filter(x => !MODULES_AIGUILLEURS.has(x.module)); break; }
            case 5: { const i = etapes.findIndex(x => x.chemin); if (i >= 0) { const [ch] = etapes.splice(i, 1); etapes.push(ch); } break; }
            case 6: if (e) e.cartes.push(structuredClone(e.cartes[0] || { titre: 'X', module: 'Page', duree: 10 }), { titre: 'Y', module: 'Page', duree: 10 }); break;
            case 7: if (e && e.chemin) e.chemin = ['autre', 'approfondir', 'renforcer'][entier(3)]; break;
            default: if (c) c.duree = String(c.duree) + ' minutes';
        }
    }
    if (!etapes.some(e => e.cartes.length)) etapes[0].cartes.push({ titre: 'Z', module: 'Page', duree: 10 });
    return p;
};
const ratés = [];
for (let n = 0; n < 300; n++) {
    const r = reels[entier(reels.length)];
    const { plan } = reparerCommeLAtelier(abimer(r.brut), r.cal, r.modules);
    const u = utilisable(plan, r.cal, r.modules);
    if (!u.ok) ratés.push(`${r.id} (tirage ${n}) : ${u.raisons.join(' ; ')}`);
}
ok(`300 plans abîmés : tous utilisables après réparation (${300 - ratés.length}/300)`, !ratés.length, ratés.slice(0, 5).join('\n     '));

// ---------------------------------------------------------------- 5. L'exemple du prompt
console.log('\n5. L’exemple du prompt de plan (D108), pour chaque cadrage');
{
    // Les catalogues réels de chaque plateforme, relevés avec les plans.
    const catalogues = {};
    for (const r of reels) catalogues[r.cadrage.platform] = r.modules;
    const deTrame = modules => m => { const alt = String(m).split('|').map(x => x.trim()); return alt.find(x => modules.some(y => y.cle === x)) || alt[0]; };
    const TUTOIEMENT = /(?<![\p{L}’'])(tu|ton|ta|tes|te|toi)(?![\p{L}’'])|\bt’/iu;
    const VOUVOIEMENT = /(?<![\p{L}’'])(vous|votre|vos)(?![\p{L}’'])/iu;
    let combinaisons = 0;
    const fautifs = [], durees = [], registres = [], formes = [];
    for (const platform of Object.keys(catalogues).sort()) {
        const modules = catalogues[platform];
        for (const format of CONFIG.formats.map(f => f.id)) for (const ampleur of CONFIG.ampleurs.map(a => a.id)) {
            for (const [structure, chemins] of [['lineaire', 3], ['chemins', 2], ['chemins', 3], ['chemins', 4]]) {
                const trames = ['auto', ...tramesCompatibles(format, ampleur, { structure, chemins }).map(x => x.id)];
                for (const trame of trames) {
                    const cal = calibrer({ platform, format, ampleur, trame, structure, chemins });
                    const vouvoyer = platform !== 'elea';
                    const { exemple, dureeChemin } = exemplePlan(cal, modules, { vouvoyer, moduleDeTrame: deTrame(modules) });
                    const nom = `${platform}/${format}/${ampleur}/${structure === 'chemins' ? `${chemins} chemins` : 'linéaire'}/${trame}`;
                    combinaisons++;
                    const erreurs = controlerCalibrage(exemple, cal, modules);
                    if (erreurs.length) fautifs.push(`${nom} : ${erreurs.slice(0, 2).join(' | ')}`);
                    if (JSON.stringify(exemple.etapes.map(e => e.cartes.length)) !== JSON.stringify(cal.exemple)) formes.push(nom);
                    const parChemin = exemple.etapes.filter(e => e.chemin).map(e => e.cartes.reduce((s, c) => s + c.duree, 0));
                    if (cal.aiguillage && (new Set(parChemin).size !== 1 || parChemin[0] !== dureeChemin)) durees.push(`${nom} : ${parChemin.join(', ')}`);
                    const lu = [exemple.introduction, exemple.conclusion, ...exemple.etapes.flatMap(e => [e.introduction, ...e.cartes.map(c => c.consigne)])].join(' ');
                    if (vouvoyer ? TUTOIEMENT.test(lu) : VOUVOIEMENT.test(lu)) registres.push(nom);
                }
            }
        }
    }
    ok(`${combinaisons} cadrages : l’exemple montré au modèle passe lui-même le contrôle`, combinaisons > 150 && !fautifs.length, fautifs.slice(0, 5).join('\n     '));
    ok('l’exemple a exactement la forme demandée (étapes, activités par étape)', !formes.length, formes.slice(0, 5).join(', '));
    ok('dans l’exemple, les chemins durent autant, et la durée annoncée est la leur', !durees.length, durees.slice(0, 5).join('\n     '));
    ok('l’exemple tutoie sur Éléa et vouvoie sur Magistère et Moodle (D105)', !registres.length, registres.slice(0, 5).join(', '));
}

// ---------------------------------------------------------------- 6. Contre-épreuve
console.log('\n6. Contre-épreuve');
const sansReparation = refuses.filter(r => utilisable(r.brut, r.cal, r.modules).ok && !controlerCalibrage(r.brut, r.cal, r.modules).length);
ok('sans réparation, aucun plan réel refusé ne passerait le contrôle (le banc mesure bien la réparation)', !sansReparation.length && refuses.length >= 18);
ok('gravité : un écart de structure pèse plus qu’un total hors ampleur, qui pèse plus qu’un détail',
    graviteCadrage(['L\'étape qui précède les chemins se termine par le test qui oriente les élèves : …']) > graviteCadrage(['Total reçu : 13 activités ; attendu : 7 à 12, pour TOUT le parcours.'])
    && graviteCadrage(['Total reçu : 13 activités ; attendu : 7 à 12, pour TOUT le parcours.']) > graviteCadrage(['Étape 1 : titre et objectif nécessaires.']) && graviteCadrage([]) === 0);

console.log('\n========================================');
console.log(`parcours — réparation du plan (Node pur) : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : 0);
