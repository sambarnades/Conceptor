/**
 * @file Parcours — réparer le plan reçu avant de le juger (D107).
 *
 * Le contrôle de cadrage (`calibrage.js`, D58) refusait des plans pour des écarts
 * que Caramel sait corriger seul : deux chemins de 40 et 60 minutes, un palier
 * « consolidation », un module inventé, le test oublié avant les chemins. Après
 * deux refus, l'enseignant revenait au cadrage sans plan — 7 cadrages sur 16 avec
 * Mistral Small 4 le 1er oct. 2026, tous à chemins, dont 5 pour la seule durée des
 * chemins. Comme `json-healer.js` pour une activité, ce module répare d'abord ; le
 * modèle n'est sollicité de nouveau que pour ce qui ne se répare pas.
 *
 * Deux temps :
 *  - à chaque réponse, les réparations sans perte : cartes sans aucun texte
 *    retirées, textes manquants repris d'un voisin, palier et module ramenés à ce
 *    qui existe, durées entières, chemins regroupés et rôles remis dans l'ordre,
 *    test posé avant les chemins, durées des chemins égalisées ;
 *  - en DERNIER RECOURS seulement — la reprise n'a pas suffi —, le plan est ramené
 *    à la forme demandée : chemins en trop retirés ou chemins ouverts s'il en
 *    manque, chemins raccourcis ensemble, cartes en trop retirées pour tenir dans
 *    l'ampleur choisie. Jamais le test, jamais la dernière carte d'une étape.
 *
 * Pur : ni DOM ni traduction. Ce qui en dépend — résoudre un module inventé, les
 * textes d'un test ou d'une étape ajoutés — est passé par l'appelant.
 *
 * @module parcours/reparation-plan
 */
import { normaliserPalier } from './calibrage.js';
import { MODULES_AIGUILLEURS, MODULE_AIGUILLEUR_DEFAUT, CHEMINS_MIN, CHEMINS_MAX, ROLES_PAR_NOMBRE } from './aiguillage.js';

/** Ce que le modèle écrit à la place d'un palier, ramené à l'un des trois. */
const PALIERS_VOISINS = [
    ['decouverte', ['decouv', 'introduc', 'initiation', 'diagnost', 'positionnement', 'sensibilisation', 'exploration', 'amorce', 'accueil']],
    ['transfert', ['transf', 'evaluat', 'bilan', 'synthes', 'reinvest', 'production', 'approfond', 'mobilis', 'certif']],
    ['entrainement', ['entrain', 'applicat', 'consolid', 'remediat', 'renforc', 'exerc', 'pratique', 'reprise', 'revision', 'appropriation']],
];

/** Les quiz qu'on peut changer en test qui aiguille sans trahir la consigne. */
const QUIZ_CONVERTIBLES = new Set(['QuizSet', 'MultipleChoice', 'SingleChoiceSet', 'QCM', 'gift', 'TrueFalse']);

/** Durée par défaut d'une carte, quand le modèle n'en donne pas d'utilisable. */
const DUREE_DEFAUT = 10;
/** Le plus court chemin dure au moins cette part du plus long (`calibrage.js`). */
const PART_MINIMALE = 0.75;

const texte = v => (typeof v === 'string' ? v.trim() : '');
const sansAccent = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Le palier reconnu, éventuellement sous un autre nom ; `null` sinon. */
export function palierVoisin(valeur) {
    const exact = normaliserPalier(valeur);
    if (exact) return exact;
    const s = sansAccent(valeur);
    if (!s) return null;
    for (const [palier, racines] of PALIERS_VOISINS) if (racines.some(r => s.includes(r))) return palier;
    return null;
}

/** Le rôle porté par une étape (`"chemin": "renforcer"`), ou `null`. */
function marque(etape) {
    if (!etape) return null;
    if (typeof etape.chemin === 'string') return etape.chemin.trim() || null;
    if (etape.chemin && typeof etape.chemin === 'object') return etape.chemin.role || 'chemin';
    return null;
}

const indicesChemins = etapes => etapes.map((e, i) => (marque(e) ? i : -1)).filter(i => i >= 0);
const dureeDe = cartes => cartes.reduce((s, c) => s + (Number(c.duree) || 0), 0);

/**
 * Répare le plan reçu.
 *
 * @param {Object} brut - Le JSON du modèle (jamais modifié).
 * @param {Object} calibrage - `calibrer(draft)`.
 * @param {Array<{cle:string}|string>} modules - Le catalogue autorisé.
 * @param {Object} [o]
 * @param {Function} [o.resoudre] - `(module, palier) => cle` : le module le plus proche (activity-router).
 * @param {string} [o.sujet] - Le sujet du cadrage, titre de dernier recours.
 * @param {Object} [o.textes] - `{ test: {titre, objectif, consigne}, etape: {titre, objectif, introduction} }`,
 *        traduits par l'appelant : le test, ou l'étape, que la réparation ajoute.
 * @param {boolean} [o.dernierRecours] - Ramener le plan à la forme demandée, quitte à retirer des cartes.
 * @returns {{plan:Object, corrections:string[]}}
 */
export function reparerPlan(brut, calibrage, modules, { resoudre = null, sujet = '', textes = {}, dernierRecours = false } = {}) {
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return { plan: brut, corrections: [] };
    const plan = structuredClone(brut);
    const corrections = [];
    const autorises = new Set((modules || []).map(m => (typeof m === 'string' ? m : m && m.cle)).filter(Boolean));
    const a = calibrage && calibrage.aiguillage;

    // --- Les étapes et leurs cartes : des objets, et des cartes qui disent quelque chose.
    let etapes = (Array.isArray(plan.etapes) ? plan.etapes : []).filter(e => e && typeof e === 'object' && !Array.isArray(e));
    for (const e of etapes) {
        const avant = Array.isArray(e.cartes) ? e.cartes.length : 0;
        e.cartes = (Array.isArray(e.cartes) ? e.cartes : [])
            .filter(c => c && typeof c === 'object' && !Array.isArray(c))
            .filter(c => texte(c.titre) || texte(c.objectif) || texte(c.consigne));
        if (e.cartes.length < avant) corrections.push(`cartes sans texte retirées (${avant - e.cartes.length})`);
    }
    // Une étape ordinaire vide n'existe pas pour l'élève ; un chemin vide se garde : il se signale.
    const pleines = etapes.filter(e => e.cartes.length || marque(e));
    if (pleines.length < etapes.length) corrections.push(`étapes vides retirées (${etapes.length - pleines.length})`);
    etapes = pleines;
    plan.etapes = etapes;

    // --- Les textes : repris d'un voisin plutôt que laissés vides.
    for (const e of etapes) {
        for (const c of e.cartes) {
            const t0 = texte(c.titre), o0 = texte(c.objectif), k0 = texte(c.consigne);
            const titre = t0 || o0 || k0.split(/(?<=[.!?])\s/)[0].slice(0, 90);
            if (!t0 || !o0 || !k0) corrections.push(`textes d'une carte complétés (« ${titre.slice(0, 40)} »)`);
            c.titre = titre;
            c.objectif = o0 || t0 || k0;
            c.consigne = k0 || o0 || t0;
        }
        const premiere = e.cartes[0] || {};
        if (!texte(e.titre) || !texte(e.objectif)) corrections.push('titre ou objectif d\'une étape complété');
        e.titre = texte(e.titre) || texte(e.objectif) || texte(premiere.titre);
        e.objectif = texte(e.objectif) || texte(premiere.objectif) || texte(e.titre);
    }
    if (!texte(plan.titre) || !texte(plan.objectifGeneral)) corrections.push('titre ou objectif du parcours complété');
    plan.titre = texte(plan.titre) || texte(sujet).slice(0, 90) || texte(etapes[0] && etapes[0].titre);
    plan.objectifGeneral = texte(plan.objectifGeneral) || texte(etapes[0] && etapes[0].objectif) || plan.titre;

    // --- Chemins : regroupés, en nombre, rôles dans l'ordre ; puis le test qui les ouvre.
    if (a) {
        reparerChemins(plan, a, corrections, dernierRecours);
        poserTest(plan, autorises, textes, corrections);
    }
    // Dernier recours : le parcours tient dans l'ampleur choisie.
    if (dernierRecours && calibrage) tenirDansLAmpleur(plan, calibrage, corrections);

    // --- Paliers, modules, durées : APRÈS l'ajout éventuel du test, qui reçoit les siens.
    const imposes = calibrage && calibrage.trame && Array.isArray(calibrage.trame.paliers)
        && calibrage.trame.paliers.length === plan.etapes.length ? calibrage.trame.paliers : null;
    plan.etapes.forEach((e, i) => {
        const dernier = i === plan.etapes.length - 1;
        for (const c of e.cartes) {
            const lu = palierVoisin(c.palier);
            const voulu = imposes ? imposes[i] : lu || (marque(e) ? 'entrainement' : i === 0 ? 'decouverte' : dernier ? 'transfert' : 'entrainement');
            if (c.palier !== voulu) {
                if (normaliserPalier(c.palier) !== voulu) corrections.push(`palier « ${c.palier ?? '—'} » → ${voulu}`);
                c.palier = voulu;
            }
            if (!autorises.has(c.module)) {
                const propose = resoudre ? resoudre(c.module, c.palier) : null;
                const cle = autorises.has(propose) ? propose : ['Page', ...autorises].find(m => autorises.has(m));
                if (cle) {
                    corrections.push(`module « ${c.module ?? '—'} » → ${cle}`);
                    c.module = cle;
                    // L'écran du plan montre une carte dont le type a été remplacé (`moduleReplie`).
                    c.moduleReplie = true;
                }
            }
            const d = Number.parseInt(c.duree, 10);
            const duree = Number.isFinite(d) && d >= 1 ? Math.min(d, 180) : DUREE_DEFAUT;
            if (duree !== c.duree) {
                corrections.push(`durée « ${c.duree ?? '—'} » → ${duree} min`);
                c.duree = duree;
            }
        }
    });

    // --- Les durées en dernier : rien ne les dérange plus après.
    if (a) egaliserChemins(plan, corrections);
    if (calibrage && calibrage.trame && calibrage.trame.id === 'rituel') {
        const cartes = plan.etapes.flatMap(e => e.cartes);
        if (dureeDe(cartes) > 10) {
            ramenerA(cartes, 10, 1);
            corrections.push('rituel ramené à 10 minutes');
        }
    }
    return { plan, corrections };
}

/**
 * Les étapes-chemins : consécutives, dans l'ordre des rôles attendus. En dernier
 * recours, autant de chemins que demandé : les chemins en trop sont retirés ; s'il
 * en manque (moins de deux), une étape est ouverte en chemins — ses copies gardent
 * ses textes et ses types d'activité, comme « Ajouter un chemin » sur l'écran du
 * plan ; chaque élève n'en voit qu'un.
 */
function reparerChemins(plan, a, corrections, dernierRecours) {
    let indices = indicesChemins(plan.etapes);
    const contigus = indices.every((x, j) => j === 0 || x === indices[j - 1] + 1);
    if (indices.length > 1 && !contigus) {
        const chemins = indices.map(i => plan.etapes[i]);
        const autres = plan.etapes.filter((e, i) => !indices.includes(i));
        const position = autres.indexOf(plan.etapes[indices[0] - 1]) + 1;
        autres.splice(position, 0, ...chemins);
        plan.etapes = autres;
        indices = indicesChemins(plan.etapes);
        corrections.push('étapes-chemins regroupées');
    }
    if (dernierRecours) {
        if (indices.length > a.nombre) {
            const garder = new Set(indices.slice(0, a.nombre));
            plan.etapes = plan.etapes.filter((e, i) => !indices.includes(i) || garder.has(i));
            corrections.push(`chemins en trop retirés (${a.nombre} demandés)`);
        } else if (indices.length < CHEMINS_MIN) {
            ouvrirLesChemins(plan, a, indices, corrections);
        } else if (indices.length < a.nombre) {
            completerChemins(plan, a, corrections);
        }
        indices = indicesChemins(plan.etapes);
    }
    if (indices.length === a.nombre) {
        indices.forEach((i, j) => {
            if (marque(plan.etapes[i]) !== a.roles[j]) corrections.push(`rôle de chemin « ${marque(plan.etapes[i])} » → ${a.roles[j]}`);
            plan.etapes[i].chemin = a.roles[j];
        });
    }
}

/**
 * Il manque des chemins : le voisin le plus étayé de la place vide est copié, à
 * la place de son rôle — ce que fait « Ajouter un chemin » sur l'écran du plan.
 */
function completerChemins(plan, a, corrections) {
    let indices = indicesChemins(plan.etapes);
    while (indices.length < a.nombre && indices.length < CHEMINS_MAX) {
        const avant = ROLES_PAR_NOMBRE[indices.length];
        const apres = ROLES_PAR_NOMBRE[indices.length + 1];
        const position = apres.findIndex(r => !avant.includes(r));
        const voisin = plan.etapes[indices[Math.max(0, position - 1)]];
        plan.etapes.splice(indices[0] + position, 0, structuredClone(voisin));
        indices = indicesChemins(plan.etapes);
        corrections.push(`chemin ajouté, copie de « ${texte(voisin.titre).slice(0, 40)} »`);
    }
}

/**
 * Ouvre les chemins qui manquent : l'étape qui suit la première (ou la seule
 * étape) devient le premier chemin, et ses copies les suivants.
 */
function ouvrirLesChemins(plan, a, indices, corrections) {
    // Un chemin isolé n'aiguille rien : il redevient l'étape qu'on ouvre.
    for (const i of indices) delete plan.etapes[i].chemin;
    if (!plan.etapes.length) return;
    const position = plan.etapes.length > 1 ? 1 : 0;
    const modele = plan.etapes[position];
    const copies = a.roles.slice(1).map(role => ({ ...structuredClone(modele), chemin: role }));
    modele.chemin = a.roles[0];
    plan.etapes.splice(position + 1, 0, ...copies);
    corrections.push(`chemins ouverts sur l'étape « ${texte(modele.titre).slice(0, 40)} »`);
}

/**
 * L'étape qui précède les chemins se termine par le test qui oriente les élèves.
 * Un quiz déjà prévu y devient ce test ; sinon le test est ajouté à la fin de
 * l'étape — ou dans une étape à lui, si les chemins ouvraient le parcours.
 */
function poserTest(plan, autorises, textes, corrections) {
    const indices = indicesChemins(plan.etapes);
    if (indices.length < CHEMINS_MIN) return;
    const aiguilleurs = [MODULE_AIGUILLEUR_DEFAUT, 'test_elea', 'QuizSetVF'].filter(m => MODULES_AIGUILLEURS.has(m) && autorises.has(m));
    if (!aiguilleurs.length) return;
    const t = textes.test || {};
    const nouveauTest = () => ({
        titre: t.titre || 'Test', objectif: t.objectif || t.titre || 'Test', consigne: t.consigne || t.objectif || 'Test',
        module: aiguilleurs[0], palier: 'decouverte', duree: 15,
    });
    if (indices[0] === 0) {
        const e = textes.etape || {};
        plan.etapes.unshift({
            titre: e.titre || t.titre || 'Test', objectif: e.objectif || t.objectif || 'Test',
            introduction: e.introduction || '', cartes: [nouveauTest()],
        });
        corrections.push('étape du test ajoutée avant les chemins');
        return;
    }
    const avant = plan.etapes[indices[0] - 1];
    if (avant.cartes.some(c => MODULES_AIGUILLEURS.has(c.module))) return;
    const quiz = [...avant.cartes].reverse().find(c => QUIZ_CONVERTIBLES.has(c.module));
    if (quiz) {
        const cible = quiz.module === 'TrueFalse' && aiguilleurs.includes('QuizSetVF') ? 'QuizSetVF' : aiguilleurs[0];
        corrections.push(`« ${texte(quiz.titre).slice(0, 40)} » devient le test qui oriente (${quiz.module} → ${cible})`);
        quiz.module = cible;
        return;
    }
    avant.cartes.push(nouveauTest());
    corrections.push('test ajouté avant les chemins');
}

/**
 * Les chemins durent autant : chaque élève a le même temps de travail, quel que
 * soit son chemin. Seulement s'ils s'écartent au-delà de ce que le contrôle tolère.
 */
function egaliserChemins(plan, corrections) {
    const chemins = indicesChemins(plan.etapes).map(i => plan.etapes[i].cartes).filter(c => c.length);
    if (chemins.length < 2) return;
    const durees = chemins.map(dureeDe);
    if (Math.min(...durees) >= PART_MINIMALE * Math.max(...durees)) return;
    const pas = chemins.flat().every(c => c.duree % 5 === 0) ? 5 : 1;
    const moyenne = durees.reduce((s, d) => s + d, 0) / durees.length;
    const cible = Math.max(Math.max(...chemins.map(c => c.length)) * pas, Math.round(moyenne / pas) * pas);
    chemins.forEach(cartes => ramenerA(cartes, cible, pas));
    corrections.push(`durées des chemins égalisées (${durees.join(', ')} → ${cible} min chacun)`);
}

/**
 * Ramène la durée totale de `cartes` à `cible`, proportionnellement, au `pas` près
 * (5 minutes si le modèle comptait par cinq), sans descendre sous un pas par carte.
 */
function ramenerA(cartes, cible, pas) {
    const total = dureeDe(cartes);
    if (!total) return;
    for (const c of cartes) c.duree = Math.max(pas, Math.round((c.duree * cible) / total / pas) * pas);
    let ecart = cible - dureeDe(cartes);
    for (let garde = 0; ecart !== 0 && garde < 200; garde++) {
        if (ecart > 0) {
            const c = cartes.reduce((x, y) => (y.duree < x.duree ? y : x));
            c.duree += pas;
            ecart -= pas;
        } else {
            const c = cartes.reduce((x, y) => (y.duree > x.duree ? y : x));
            if (c.duree - pas < pas) break;
            c.duree -= pas;
            ecart += pas;
        }
    }
}

/**
 * Dernier recours : le parcours tient dans l'ampleur choisie. La forme visée se
 * calcule d'abord — la plus longue des longueurs de chemin qui laisse, sous le
 * plafond et dans les bornes « par élève », le plus d'activités communes —, puis
 * les chemins se raccourcissent ENSEMBLE et les étapes communes les plus chargées
 * perdent leur dernière carte ; une étape d'une seule carte ne part qu'ensuite.
 * Le test qui oriente ne part jamais. Trop d'étapes : deux voisines se fusionnent,
 * sans rien retirer.
 */
function tenirDansLAmpleur(plan, calibrage, corrections) {
    const E = () => plan.etapes;
    const chemins = () => indicesChemins(E());
    const longueurs = () => chemins().map(i => E()[i].cartes.length);
    const etapeDuTest = () => (chemins()[0] > 0 ? E()[chemins()[0] - 1] : null);
    const leTest = () => {
        const e = etapeDuTest();
        return e ? [...e.cartes].reverse().find(c => MODULES_AIGUILLEURS.has(c.module)) || null : null;
    };
    const communes = () => E().reduce((s, e, i) => s + (chemins().includes(i) ? 0 : e.cartes.length), 0);

    // Des chemins de même longueur, à une carte près.
    while (chemins().length > 1 && Math.max(...longueurs()) - Math.min(...longueurs()) > 1) {
        const plusLong = chemins().reduce((x, i) => (E()[i].cartes.length > E()[x].cartes.length ? i : x));
        E()[plusLong].cartes.pop();
        corrections.push('chemin raccourci (même longueur que les autres)');
    }

    // La forme visée : `L` activités par chemin, `C` activités communes.
    const k = chemins().length;
    const C0 = communes();
    // Ce qui ne part pas : le test, et la dernière étape commune (le bilan) tant qu'il reste autre chose.
    const finale = E().length - 1;
    const minimum = (leTest() ? 1 : 0) + (!chemins().includes(finale) && E()[finale] !== etapeDuTest() ? 1 : 0);
    let cibleC = Math.min(C0, calibrage.max);
    let cibleL = k ? Math.max(...longueurs()) : 0;
    if (k) {
        const [lo, hi] = calibrage.parEleve || [0, Infinity];
        const formes = [];
        for (let L = cibleL; L >= 1; L--) {
            // Ce que pèsent les chemins une fois ramenés à `L` : les plus courts gardent leur longueur.
            const fabriques = longueurs().reduce((s, n) => s + Math.min(n, L), 0);
            const c = Math.min(C0, hi - L, calibrage.max - fabriques);
            if (c >= minimum) formes.push({ L, c });
        }
        // D'abord ce qui respecte toutes les bornes, le plus long chemin ; sinon ce qui en garde le plus.
        const forme = formes.find(f => f.c + f.L >= lo) || formes.sort((x, y) => (y.c + y.L) - (x.c + x.L))[0];
        if (forme) { cibleL = forme.L; cibleC = forme.c; }
    }
    if (k && Math.max(...longueurs()) > cibleL) {
        for (const i of chemins()) while (E()[i].cartes.length > cibleL) E()[i].cartes.pop();
        corrections.push(`chemins ramenés à ${cibleL} activité(s) chacun`);
    }
    for (let garde = 0; communes() > cibleC && garde < 60; garde++) {
        const test = leTest();
        const milieu = (E().length - 1) / 2;
        const parMilieu = (x, y) => Math.abs(x.i - milieu) - Math.abs(y.i - milieu);
        const ordinaires = E().map((e, i) => ({ e, i })).filter(x => !chemins().includes(x.i));
        // Une carte de trop dans une étape commune qui en a plusieurs : la plus chargée, au plus près du milieu.
        const chargees = ordinaires.filter(x => x.e.cartes.filter(c => c !== test).length && x.e.cartes.length > 1)
            .sort((x, y) => y.e.cartes.length - x.e.cartes.length || parMilieu(x, y));
        if (chargees.length) {
            const { e } = chargees[0];
            const carte = [...e.cartes].reverse().find(c => c !== test);
            e.cartes.splice(e.cartes.indexOf(carte), 1);
            corrections.push(`activité « ${texte(carte.titre).slice(0, 40)} » retirée (ampleur)`);
            continue;
        }
        // Sinon une étape d'une seule carte, jamais celle du test : au milieu d'abord, puis la première.
        const seules = ordinaires.filter(x => x.e !== etapeDuTest() && x.i !== E().length - 1).sort(parMilieu);
        if (!seules.length) break;
        const { e, i } = seules[0];
        E().splice(i, 1);
        corrections.push(`étape « ${texte(e.titre).slice(0, 40)} » retirée (ampleur)`);
    }

    // Filet : sous le plafond quoi qu'il arrive — les chemins encore raccourcis ensemble,
    // puis, s'il le faut, la dernière étape commune qui n'est pas celle du test.
    const total = () => E().reduce((s, e) => s + e.cartes.length, 0);
    for (let garde = 0; total() > calibrage.max && garde < 20; garde++) {
        if (chemins().length && Math.min(...longueurs()) > 1) {
            for (const i of chemins()) E()[i].cartes.pop();
            corrections.push('chemins raccourcis d\'une activité (plafond)');
            continue;
        }
        const i = E().map((e, j) => j).reverse().find(j => !chemins().includes(j) && E()[j] !== etapeDuTest());
        if (i === undefined) break;
        const [e] = E().splice(i, 1);
        corrections.push(`étape « ${texte(e.titre).slice(0, 40)} » retirée (plafond)`);
    }

    // Trop d'étapes : deux étapes communes voisines n'en font qu'une, sans rien retirer.
    // Le test reste en fin de l'étape qui précède les chemins.
    for (let garde = 0; E().length > calibrage.etapesMax && garde < 20; garde++) {
        const paires = [];
        for (let i = 0; i + 1 < E().length; i++) {
            if (chemins().includes(i) || chemins().includes(i + 1)) continue;
            paires.push({ i, n: E()[i].cartes.length + E()[i + 1].cartes.length });
        }
        if (!paires.length) break;
        const { i } = paires.sort((x, y) => x.n - y.n)[0];
        const [suivante] = E().splice(i + 1, 1);
        E()[i].cartes.push(...suivante.cartes);
        corrections.push(`étapes « ${texte(E()[i].titre).slice(0, 30)} » et « ${texte(suivante.titre).slice(0, 30)} » fusionnées`);
    }
}

/**
 * Le poids des écarts qui RESTENT après réparation : un plan sans chemins ou sans
 * test ne tient pas sa promesse, un total un peu hors de l'ampleur reste un plan.
 * @param {string[]} erreurs - `controlerCalibrage`.
 * @returns {number}
 */
export function graviteCadrage(erreurs) {
    return (erreurs || []).reduce((s, e) => s + (/étapes-chemins|test qui oriente|chemins commencent/.test(e) ? 10
        : /^Total reçu|activités par élève|non vides|Répartition/.test(e) ? 3 : 1), 0);
}
