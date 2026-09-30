/**
 * @file Parcours — l'aiguillage : des chemins selon le résultat d'un test (D90).
 *
 * Un parcours à chemins n'est pas une liste : après un test, chaque élève suit
 * UN chemin parmi deux à quatre, choisi par sa note, puis tous se retrouvent.
 * C'est le mécanisme du gabarit de Gauthier (sept. 2026), écrit sans ses failles :
 * restrictions d'accès de section sur la note du test, chemins masqués aux autres
 * élèves, étape commune qui s'ouvre au bout de n'importe quel chemin.
 *
 * ## Le modèle du plan : une étape PEUT être un chemin
 *
 * Une étape porte `chemin: { depuis }` quand elle est l'un des chemins d'un
 * aiguillage : `depuis` est le pourcentage de réussite au test à partir duquel
 * elle s'ouvre (0 pour le premier chemin). Tout le reste SE DÉDUIT, pour
 * qu'aucune seconde source ne puisse contredire la première :
 *
 *   - un aiguillage = une suite d'étapes-chemins CONSÉCUTIVES ;
 *   - le TEST qui aiguille = la dernière activité notée de l'étape qui précède ;
 *   - le RÔLE d'un chemin (renforcer, consolider…) = sa position et leur nombre ;
 *   - l'étape COMMUNE qui suit (bilan) = la première étape qui n'est pas un chemin.
 *
 * ## Les conditions écrites dans le cours
 *
 * Elles suivent le code de Moodle 5.1, relu le 30 sept. 2026 :
 *   - `availability/classes/tree.php` : à la racine, `&` exige `showc` (un
 *     booléen par condition), `|` exige `show` (un booléen) ; un sous-groupe ne
 *     porte ni l'un ni l'autre ;
 *   - `availability/condition/grade/classes/condition.php` : `id` est un ENTIER
 *     au sens strict (`is_int`), `min` inclus, `max` exclu, en POURCENTAGE de la
 *     note ; sans note, la condition est fausse ; la note est lue avec cinq
 *     décimales (1 sur 3 = 33,33333 %) ;
 *   - un sous-groupe VIDE vaut « vrai » (`tree::check_available`) : un chemin
 *     sans activité à achèvement ouvrirait le bilan à tout le monde.
 *
 * D'où les seuils à MI-POINT : entre 3 et 4 bonnes réponses sur 10, le seuil est
 * 35 %. Aucune note possible ne tombe pile dessus, et l'arrondi à cinq décimales
 * ne peut faire basculer personne.
 *
 * Module PUR, sans aucun import : il tourne tel quel dans un banc Node, et l'écran
 * « Voir comme un élève » évalue avec lui les MÊMES conditions que celles écrites
 * dans le cours.
 *
 * @module parcours/aiguillage
 */

/** Les rôles des chemins, du plus étayé au moins étayé, selon leur nombre. */
export const ROLES_PAR_NOMBRE = Object.freeze({
    2: Object.freeze(['renforcer', 'approfondir']),
    3: Object.freeze(['renforcer', 'consolider', 'approfondir']),
    4: Object.freeze(['reprendre', 'renforcer', 'consolider', 'approfondir']),
});

/** Nombre de chemins d'un aiguillage. */
export const CHEMINS_MIN = 2;
export const CHEMINS_MAX = 4;
/** Le nombre proposé par défaut au cadrage. */
export const CHEMINS_DEFAUT = 3;

/**
 * Seuils par défaut, en pourcentage de réussite au test : le premier chemin part
 * de 0, les suivants de ces valeurs.
 */
export const SEUILS_PAR_DEFAUT = Object.freeze({
    2: Object.freeze([60]),
    3: Object.freeze([40, 75]),
    4: Object.freeze([25, 50, 75]),
});

/**
 * Nombre de questions conseillé au test, selon le nombre de chemins : trier en
 * trois sur cinq questions, c'est laisser une seule réponse décider.
 */
export const QUESTIONS_CONSEILLEES = Object.freeze({ 2: 8, 3: 10, 4: 12 });

/**
 * Les activités qui peuvent aiguiller : notées automatiquement, une note par
 * tentative, et un élément de carnet de notes dès la restauration. En sont exclus
 * la Leçon (pas de note avant la première tentative, § 10 du PRD), le Devoir
 * (noté à la main, des jours plus tard), les greffons d'Éléa (jamais éprouvés
 * comme condition) et le Choix unique en série : le résultat que Moodle en
 * conserve ne porte pas « terminé », il ne reçoit donc JAMAIS de note (D100).
 *
 * Et le Quiz mixte : ses questions ne pèsent pas le même poids — un texte à
 * trous compte un point par trou, un mot à glisser un point par mot. Les seuils
 * se lisent en « bonnes réponses sur n » ; il faut donc UN point par question,
 * ce que le Quiz QCM (un point imposé par question, `reglagesDuTest`), le Quiz
 * Vrai/Faux et le Test (une note par question) garantissent (D93).
 */
export const MODULES_AIGUILLEURS = Object.freeze(new Set([
    'QuizSetQCM', 'QuizSetVF', 'test_elea',
]));

/** Le test posé par défaut, quand on ouvre des chemins sans modèle. */
export const MODULE_AIGUILLEUR_DEFAUT = 'QuizSetQCM';

/* ------------------------------------------------------------------ *
 *  Lire les aiguillages d'un plan
 * ------------------------------------------------------------------ */

/** L'étape est-elle l'un des chemins d'un aiguillage ? */
export function estChemin(etape) {
    return Boolean(etape && etape.chemin && typeof etape.chemin === 'object');
}

/** La carte peut-elle aiguiller ? */
export function peutAiguiller(carte) {
    return Boolean(carte && MODULES_AIGUILLEURS.has(carte.module));
}

/**
 * Les aiguillages du plan, dans l'ordre.
 *
 * @param {Object} plan
 * @returns {Array<{
 *   debut:number, fin:number,
 *   chemins:Array<{etape:Object, index:number, role:string|null, depuis:number}>,
 *   etapeTest:Object|null, indexTest:number, test:Object|null,
 *   commune:{etape:Object, index:number}|null
 * }>}
 */
export function aiguillagesDuPlan(plan) {
    const etapes = (plan && Array.isArray(plan.etapes)) ? plan.etapes : [];
    const groupes = [];
    let courant = null;
    etapes.forEach((etape, index) => {
        if (!estChemin(etape)) { courant = null; return; }
        if (!courant) {
            courant = { debut: index, fin: index, chemins: [] };
            groupes.push(courant);
        }
        courant.fin = index;
        courant.chemins.push({ etape, index, depuis: Number(etape.chemin.depuis) || 0 });
    });
    for (const g of groupes) {
        const roles = ROLES_PAR_NOMBRE[g.chemins.length] || null;
        g.chemins.forEach((c, j) => { c.role = roles ? roles[j] : null; });
        g.indexTest = g.debut - 1;
        g.etapeTest = etapes[g.indexTest] && !estChemin(etapes[g.indexTest]) ? etapes[g.indexTest] : null;
        // Le test : la DERNIÈRE activité qui peut aiguiller dans l'étape d'avant.
        const cartes = g.etapeTest && Array.isArray(g.etapeTest.cartes) ? g.etapeTest.cartes : [];
        g.test = [...cartes].reverse().find(peutAiguiller) || null;
        const apres = etapes[g.fin + 1];
        g.commune = apres && !estChemin(apres) ? { etape: apres, index: g.fin + 1 } : null;
    }
    return groupes;
}

/** Le plan a-t-il au moins un aiguillage ? */
export function aDesChemins(plan) {
    return Boolean(plan && Array.isArray(plan.etapes) && plan.etapes.some(estChemin));
}

/**
 * Le rôle d'une étape-chemin (`renforcer`…), ou `null`.
 * @param {Object} plan
 * @param {Object} etape
 */
export function roleDuChemin(plan, etape) {
    for (const g of aiguillagesDuPlan(plan)) {
        const c = g.chemins.find(x => x.etape === etape);
        if (c) return c.role;
    }
    return null;
}

/**
 * L'aiguillage dont cette carte est le test, s'il y en a un.
 * @param {Object} plan
 * @param {Object} carte
 */
export function aiguillageDuTest(plan, carte) {
    return aiguillagesDuPlan(plan).find(g => g.test && (g.test === carte || g.test.id === carte?.id)) || null;
}

/* ------------------------------------------------------------------ *
 *  Nombre de questions et seuils
 * ------------------------------------------------------------------ */

/**
 * Nombre de questions du test : lu dans le contenu généré quand il existe, sinon
 * estimé comme le fera la fabrication (une question par tranche de 1,2 minute,
 * pas moins que le conseil pour le nombre de chemins).
 *
 * @param {Object} carte
 * @param {number} [nbChemins]
 * @returns {number}
 */
export function nombreQuestions(carte, nbChemins = CHEMINS_DEFAUT) {
    const c = carte && carte.contenu;
    const liste = c && (Array.isArray(c.questions) ? c.questions : Array.isArray(c.choices) ? c.choices : null);
    if (liste && liste.length) return liste.length;
    return questionsVisees(carte, nbChemins);
}

/**
 * Nombre de questions que la fabrication demandera au test.
 * @param {Object} carte
 * @param {number} nbChemins
 */
export function questionsVisees(carte, nbChemins = CHEMINS_DEFAUT) {
    const conseil = QUESTIONS_CONSEILLEES[nbChemins] || QUESTIONS_CONSEILLEES[CHEMINS_DEFAUT];
    const selonDuree = Math.round((Number(carte && carte.duree) || 12) / 1.2);
    return Math.max(conseil, Math.min(20, selonDuree));
}

/** Arrondi à deux décimales, pour des seuils lisibles dans Moodle. */
function deuxDecimales(x) {
    return Math.round(x * 100) / 100;
}

/**
 * Le nombre minimal de bonnes réponses qui ouvre un chemin, pour un test de `n`
 * questions : les seuils sont GARDÉS en pourcentage (un test régénéré avec deux
 * questions de moins garde la même exigence), et LUS en bonnes réponses.
 *
 * Rend une liste croissante, au plus un par chemin après le premier, qui laisse
 * au moins un score à chaque chemin : si deux seuils se rejoignent (un test
 * raccourci), le second est repoussé d'une réponse.
 *
 * @param {number[]} depuis - Les `depuis` des chemins 2 à K, en pourcentage.
 * @param {number} n - Nombre de questions.
 * @returns {number[]}
 */
export function bornesEnReponses(depuis, n) {
    const total = Math.max(1, Math.round(Number(n) || 0));
    // Un seuil réglé « à partir de 2 sur 3 » est gardé à 66,67 % : relu tel quel,
    // 66,67 × 3 / 100 = 2,0001 donnerait 3. La tolérance absorbe l'arrondi à deux
    // décimales de `pourcentageDeBorne` (au plus 0,005 × n / 100 réponse).
    const bornes = depuis.map(p => Math.ceil(((Number(p) || 0) * total) / 100 - 0.01));
    for (let j = 0; j < bornes.length; j++) {
        const plancher = j === 0 ? 1 : bornes[j - 1] + 1;
        const plafond = total - (bornes.length - 1 - j);
        bornes[j] = Math.min(plafond, Math.max(plancher, bornes[j]));
    }
    return bornes;
}

/**
 * Les plages de bonnes réponses de chaque chemin : `[[0, 3], [4, 7], [8, 10]]`.
 * @param {number[]} bornes - Sortie de `bornesEnReponses`.
 * @param {number} n
 */
export function plagesEnReponses(bornes, n) {
    const plages = [];
    let de = 0;
    for (const b of bornes) { plages.push([de, b - 1]); de = b; }
    plages.push([de, Math.max(de, Math.round(n))]);
    return plages;
}

/**
 * Le pourcentage à garder quand l'enseignant fixe « à partir de k bonnes
 * réponses sur n ».
 */
export function pourcentageDeBorne(k, n) {
    return deuxDecimales((k / Math.max(1, n)) * 100);
}

/**
 * Le seuil écrit dans le cours : à MI-POINT entre k − 1 et k bonnes réponses.
 * Aucune note possible ne tombe dessus (cf. l'en-tête du module).
 */
export function seuilMoodle(k, n) {
    return deuxDecimales(((k - 0.5) / Math.max(1, n)) * 100);
}

/** Seuils par défaut, en pourcentage, pour `k` chemins. */
export function seuilsParDefaut(k) {
    return [...(SEUILS_PAR_DEFAUT[k] || SEUILS_PAR_DEFAUT[CHEMINS_DEFAUT])];
}

/* ------------------------------------------------------------------ *
 *  Normaliser : après l'IA, un import ou une retouche
 * ------------------------------------------------------------------ */

/**
 * Remet chaque aiguillage du plan dans un état cohérent, sans jamais supprimer
 * d'activité : un aiguillage irréparable redevient une suite d'étapes ordinaires.
 *
 *   - de 2 à 4 chemins ; au-delà, les étapes en trop redeviennent ordinaires ;
 *   - un seul chemin isolé n'aiguille rien : il redevient une étape ordinaire ;
 *   - le premier chemin part de 0 ; les suivants, de seuils strictement
 *     croissants entre 0 et 100, sinon les seuils par défaut.
 *
 * @param {Object} plan - Modifié en place.
 * @returns {Object} Le même plan.
 */
export function normaliserAiguillages(plan) {
    if (!plan || !Array.isArray(plan.etapes)) return plan;
    for (const etape of plan.etapes) {
        if (etape && etape.chemin !== undefined && (!etape.chemin || typeof etape.chemin !== 'object')) delete etape.chemin;
    }
    for (const g of aiguillagesDuPlan(plan)) {
        if (g.chemins.length < CHEMINS_MIN) {
            g.chemins.forEach(c => { delete c.etape.chemin; });
            continue;
        }
        if (g.chemins.length > CHEMINS_MAX) {
            g.chemins.slice(CHEMINS_MAX).forEach(c => { delete c.etape.chemin; });
            g.chemins = g.chemins.slice(0, CHEMINS_MAX);
        }
        const suivants = g.chemins.slice(1).map(c => Number(c.etape.chemin.depuis));
        const valides = suivants.every((p, j) => Number.isFinite(p) && p > 0 && p < 100 && (j === 0 || p > suivants[j - 1]));
        const seuils = valides ? suivants : seuilsParDefaut(g.chemins.length);
        g.chemins.forEach((c, j) => { c.etape.chemin = { depuis: j === 0 ? 0 : seuils[j - 1] }; });
    }
    return plan;
}

/**
 * Transforme l'étape d'index `index` en aiguillage de `k` chemins : l'étape devient
 * le premier chemin, et `k − 1` étapes reprennent SA structure (mêmes types
 * d'activité, textes vides) juste après elle. Les chemins sont parallèles par
 * construction ; l'enseignant ou l'IA les graduent ensuite.
 *
 * @param {Object} plan - Modifié en place.
 * @param {number} index
 * @param {number} k
 * @param {Function} nouvelId - `(prefixe) => string`
 */
export function ouvrirChemins(plan, index, k, nouvelId) {
    const modele = plan.etapes[index];
    if (!modele || estChemin(modele)) return;
    const n = Math.min(CHEMINS_MAX, Math.max(CHEMINS_MIN, Math.round(k) || CHEMINS_DEFAUT));
    const seuils = seuilsParDefaut(n);
    modele.chemin = { depuis: 0 };
    const copies = [];
    for (let j = 1; j < n; j++) copies.push(copieDeChemin(modele, seuils[j - 1], nouvelId));
    plan.etapes.splice(index + 1, 0, ...copies);
}

/**
 * Un chemin de plus, ou de moins, dans l'aiguillage qui contient l'étape d'index
 * `index`. Les seuils repartent de leurs valeurs par défaut : en garder une partie
 * produirait des plages que personne n'a choisies.
 *
 * @param {Object} plan - Modifié en place.
 * @param {number} index - Une étape-chemin de l'aiguillage visé.
 * @param {number} delta - +1 ou −1.
 * @param {Function} nouvelId
 * @returns {boolean} Le nombre de chemins a-t-il changé ?
 */
export function changerNombreDeChemins(plan, index, delta, nouvelId) {
    const g = aiguillagesDuPlan(plan).find(x => index >= x.debut && index <= x.fin);
    if (!g) return false;
    const avant = ROLES_PAR_NOMBRE[g.chemins.length];
    const apres = ROLES_PAR_NOMBRE[g.chemins.length + delta];
    if (!avant || !apres || Math.abs(delta) !== 1) return false;
    if (delta > 0) {
        // Le chemin ajouté prend la place de SON rôle : « Reprendre les bases »
        // avant tous les autres, « Consolider » entre les deux extrêmes. Chacun
        // garde ainsi le sien. Il reprend la structure de son voisin le plus
        // étayé : même nombre d'activités, mêmes types, textes à écrire.
        const position = apres.findIndex(r => !avant.includes(r));
        const voisin = g.chemins[Math.max(0, position - 1)] || g.chemins[0];
        plan.etapes.splice(g.debut + position, 0, copieDeChemin(voisin.etape, 0, nouvelId));
    } else {
        // Symétrique : on retire le chemin dont le rôle disparaît.
        const position = avant.findIndex(r => !apres.includes(r));
        plan.etapes.splice(g.chemins[position].index, 1);
    }
    const g2 = aiguillagesDuPlan(plan).find(x => x.debut === g.debut);
    const seuils = seuilsParDefaut(g2.chemins.length);
    g2.chemins.forEach((c, j) => { c.etape.chemin = { depuis: j === 0 ? 0 : seuils[j - 1] }; });
    return true;
}

/**
 * Referme un aiguillage : un seul chemin reste, redevenu étape ordinaire — celui
 * de « Consolider » s'il existe, le premier sinon —, les autres disparaissent
 * (l'écran propose d'annuler).
 * @param {Object} plan - Modifié en place.
 * @param {number} index - Une étape-chemin de l'aiguillage visé.
 */
export function fermerChemins(plan, index) {
    const g = aiguillagesDuPlan(plan).find(x => index >= x.debut && index <= x.fin);
    if (!g) return;
    const garde = (g.chemins.find(c => c.role === 'consolider') || g.chemins[0]).etape;
    delete garde.chemin;
    plan.etapes.splice(g.debut, g.chemins.length, garde);
}

function copieDeChemin(modele, depuis, nouvelId) {
    return {
        id: nouvelId('e'),
        titre: '',
        objectif: modele.objectif || '',
        introduction: '',
        chemin: { depuis },
        cartes: (modele.cartes || []).map(c => ({
            id: nouvelId('c'),
            titre: '',
            objectif: '',
            consigne: '',
            module: c.module,
            moduleReplie: false,
            palier: c.palier || 'entrainement',
            duree: c.duree || 10,
            verrouillee: false,
        })),
    };
}

/**
 * Les problèmes qui BLOQUENT la fabrication d'un aiguillage : ce ne sont pas des
 * conseils, ce sont des cours qui laisseraient des élèves sans suite.
 *
 * @param {Object} plan
 * @param {Object} [o]
 * @param {Function} [o.sansAchevement] - `(moduleKey) => boolean` : le module ne
 *        s'achève jamais (étiquette, wiki… D71). Sans elle, tout s'achève.
 * @returns {Array<{code:string, etapes?:string[], cartes?:string[]}>}
 */
export function problemesAiguillage(plan, { sansAchevement = () => false } = {}) {
    const problemes = [];
    for (const g of aiguillagesDuPlan(plan)) {
        const ids = g.chemins.map(c => c.etape.id);
        if (g.chemins.length < CHEMINS_MIN || g.chemins.length > CHEMINS_MAX) {
            problemes.push({ code: 'nombre_chemins', etapes: ids });
        }
        if (!g.etapeTest) {
            problemes.push({ code: 'sans_etape_test', etapes: ids });
        } else if (!g.test) {
            problemes.push({ code: 'sans_test', etapes: [g.etapeTest.id] });
        } else if (nombreQuestions(g.test, g.chemins.length) + 1 < g.chemins.length) {
            // n questions donnent n + 1 scores possibles : il en faut au moins un
            // par chemin, sinon un chemin ne s'ouvre pour personne.
            problemes.push({ code: 'questions_insuffisantes', cartes: [g.test.id] });
        }
        for (const c of g.chemins) {
            const cartes = c.etape.cartes || [];
            if (!cartes.length) problemes.push({ code: 'chemin_vide', etapes: [c.etape.id] });
            else if (!cartes.some(x => !sansAchevement(x.module))) {
                problemes.push({ code: 'chemin_sans_achevement', etapes: [c.etape.id] });
            }
            // Un test qui aiguille DANS un chemin ouvrirait des chemins imbriqués :
            // pas dans cette version.
            if (cartes.some(x => x === g.test)) problemes.push({ code: 'imbrique', etapes: [c.etape.id] });
        }
    }
    return problemes;
}

/* ------------------------------------------------------------------ *
 *  L'historique d'une carte : ce que l'élève qui la fait a déjà vu
 * ------------------------------------------------------------------ */

/**
 * Ce que l'élève a travaillé AVANT cette carte, sur son propre chemin.
 *
 * Pour une carte d'un chemin, les autres chemins du même aiguillage n'existent pas
 * pour lui : les citer dans « déjà travaillé » ferait réinvestir des activités
 * qu'il n'a jamais vues. Pour une carte après l'aiguillage, on sait qu'il a suivi
 * UN des chemins, sans savoir lequel : on le dit tel quel.
 *
 * @param {Object} plan
 * @param {Object} carte
 * @returns {Array<{etape:string, carte?:Object, chemins?:string[]}>}
 */
export function historiqueDeLaCarte(plan, carte) {
    const etapes = (plan && plan.etapes) || [];
    const groupes = aiguillagesDuPlan(plan);
    const indexCarte = etapes.findIndex(e => (e.cartes || []).some(c => c === carte || c.id === carte?.id));
    const groupeDeLaCarte = groupes.find(g => indexCarte >= g.debut && indexCarte <= g.fin) || null;
    const lignes = [];
    for (let i = 0; i < etapes.length; i++) {
        const etape = etapes[i];
        const groupe = groupes.find(g => i >= g.debut && i <= g.fin);
        if (groupe && groupe !== groupeDeLaCarte) {
            // Un aiguillage entièrement derrière la carte : un chemin parmi d'autres.
            if (i === groupe.debut && (indexCarte > groupe.fin || indexCarte === -1)) {
                lignes.push({ etape: '', chemins: groupe.chemins.map(c => c.etape.titre || '') });
            }
            continue;
        }
        if (groupe && groupe === groupeDeLaCarte && i !== indexCarte) continue;
        for (const c of (etape.cartes || [])) {
            if (c === carte || c.id === carte?.id) return lignes;
            lignes.push({ etape: etape.titre || '', carte: c });
        }
    }
    return lignes;
}

/**
 * Les suites d'activités possibles, une par combinaison de chemins : ce qu'un élève
 * fait réellement, du début à la fin. Sert à la durée par élève et à la relecture.
 *
 * @param {Object} plan
 * @returns {Array<Object[]>} Des listes de cartes.
 */
export function suitesPossibles(plan) {
    const etapes = (plan && plan.etapes) || [];
    const groupes = aiguillagesDuPlan(plan);
    let suites = [[]];
    for (let i = 0; i < etapes.length; i++) {
        const groupe = groupes.find(g => i >= g.debut && i <= g.fin);
        if (!groupe) {
            const cartes = etapes[i].cartes || [];
            suites = suites.map(s => [...s, ...cartes]);
            continue;
        }
        if (i !== groupe.debut) continue;
        const variantes = [];
        for (const s of suites) for (const c of groupe.chemins) variantes.push([...s, ...(c.etape.cartes || [])]);
        suites = variantes;
        // Au-delà de quelques aiguillages le nombre de suites exploserait : on s'arrête là.
        if (suites.length > 256) break;
    }
    return suites;
}

/**
 * La durée d'un élève, en minutes : la plus courte et la plus longue des suites.
 * Pour un parcours sans chemin, les deux valent la durée totale.
 * @param {Object} plan
 * @returns {{min:number, max:number}}
 */
export function dureeParEleve(plan) {
    const durees = suitesPossibles(plan).map(s => s.reduce((t, c) => t + (Number(c.duree) || 0), 0));
    return { min: Math.min(...durees), max: Math.max(...durees) };
}

/** Nombre d'activités d'un élève : la plus courte et la plus longue des suites. */
export function activitesParEleve(plan) {
    const n = suitesPossibles(plan).map(s => s.length);
    return { min: Math.min(...n), max: Math.max(...n) };
}

/* ------------------------------------------------------------------ *
 *  Les réglages H5P d'un chemin, et ceux du test
 * ------------------------------------------------------------------ */

/**
 * Les réglages de comportement que chaque type H5P comprend (relevés dans ses
 * processeurs). Un réglage absent d'un type n'y est jamais posé.
 */
const REGLAGES_H5P = {
    MultipleChoice: ['enableSolutionsButton', 'enableRetry', 'autoCheck'],
    TrueFalse: ['enableSolutionsButton', 'enableRetry', 'autoCheck'],
    FillInTheBlanks: ['enableSolutionsButton', 'enableRetry', 'autoCheck'],
    DragTheWords: ['enableSolutionsButton', 'enableRetry', 'instantFeedback'],
    MarkTheWords: ['enableSolutionsButton', 'enableRetry'],
    SingleChoiceSet: ['enableSolutionsButton', 'enableRetry'],
    SortParagraphs: ['enableSolutionsButton', 'enableRetry'],
    Crossword: ['enableSolutionsButton', 'enableRetry'],
    DragAndDrop: ['enableRetry'],
    Essay: ['enableRetry'],
};
/** Les mêmes, pour une question DANS un quiz (par sa bibliothèque). */
const REGLAGES_PAR_BIBLIOTHEQUE = {
    'H5P.MultiChoice': REGLAGES_H5P.MultipleChoice,
    'H5P.TrueFalse': REGLAGES_H5P.TrueFalse,
    'H5P.Blanks': REGLAGES_H5P.FillInTheBlanks,
    'H5P.DragText': REGLAGES_H5P.DragTheWords,
    'H5P.MarkTheWords': REGLAGES_H5P.MarkTheWords,
};
const QUIZ_H5P = new Set(['QuizSet', 'QuizSetQCM', 'QuizSetVF']);

/**
 * Ce que change chaque rôle dans le COMPORTEMENT d'une activité, en plus de son
 * contenu (table de gradation, D90) : la correction se donne tout de suite à qui
 * renforce, la solution se retire pour qui approfondit — le QCM « sans retour
 * immédiat » de la séance de Gauthier.
 */
const REGLAGES_PAR_ROLE = {
    reprendre: { autoCheck: true, instantFeedback: true },
    renforcer: { autoCheck: true, instantFeedback: true },
    consolider: {},
    approfondir: { enableSolutionsButton: false },
};

function filtrer(reglages, permis) {
    return Object.fromEntries(Object.entries(reglages).filter(([cle]) => permis.includes(cle)));
}

/**
 * Pose, sur le contenu généré d'une carte, les réglages de son chemin — ou ceux
 * du test qui aiguille (pas de « Recommencer » : c'est la première tentative qui
 * décide, D93). Appelé UNE fois, à la génération : l'aperçu montre ainsi ce qui
 * sera exporté, et une retouche ultérieure dans l'éditeur n'est plus écrasée.
 *
 * @param {Object} plan
 * @param {Object} carte
 * @param {Object} contenu
 * @returns {Object} Le contenu, réglé (une copie s'il a changé).
 */
export function reglagesDeCarte(plan, carte, contenu) {
    if (!contenu || typeof contenu !== 'object' || Array.isArray(contenu)) return contenu;
    const module = carte && carte.module;
    if (aiguillageDuTest(plan, carte)) return reglagesDuTest(module, contenu);
    const etape = ((plan && plan.etapes) || []).find(e => (e.cartes || []).some(c => c === carte || c.id === carte?.id));
    const role = etape ? roleDuChemin(plan, etape) : null;
    const reglages = role ? REGLAGES_PAR_ROLE[role] : null;
    if (!reglages || !Object.keys(reglages).length) return contenu;
    if (QUIZ_H5P.has(module)) {
        return {
            ...contenu,
            ...(reglages.enableSolutionsButton === false ? { endGame: { ...(contenu.endGame || {}), showSolutionButton: false } } : {}),
            questions: Array.isArray(contenu.questions) ? contenu.questions.map((q) => {
                const permis = REGLAGES_PAR_BIBLIOTHEQUE[String(q?.library || '').split(' ')[0]];
                if (!permis || !q.params) return q;
                return { ...q, params: { ...q.params, behaviour: { ...(q.params.behaviour || {}), ...filtrer(reglages, permis) } } };
            }) : contenu.questions,
        };
    }
    const permis = REGLAGES_H5P[module];
    if (!permis) return contenu;
    const choisis = filtrer(reglages, permis);
    return Object.keys(choisis).length ? { ...contenu, behaviour: { ...(contenu.behaviour || {}), ...choisis } } : contenu;
}

/**
 * Les réglages du test qui aiguille (D93), posés à la génération ET de nouveau à
 * l'assemblage — une retouche dans l'éditeur ne doit pas pouvoir les défaire :
 *
 *   - pas de « Recommencer » : c'est la première tentative qui décide ;
 *   - UN point par question : sans quoi une question à deux bonnes réponses
 *     pèserait double, et « k bonnes réponses sur n » ne dirait plus la note
 *     que Moodle compare aux seuils ;
 *   - toutes les questions posées : un tirage partiel (`poolSize`) changerait
 *     le nombre de questions sur lequel les seuils sont calculés.
 *
 * @param {string} module
 * @param {Object} contenu
 * @returns {Object} Le contenu réglé (une copie).
 */
export function reglagesDuTest(module, contenu) {
    if (!contenu || typeof contenu !== 'object' || Array.isArray(contenu) || !QUIZ_H5P.has(module)) return contenu;
    const { poolSize, ...reste } = contenu;
    return {
        ...reste,
        endGame: { ...(contenu.endGame || {}), showRetryButton: false },
        questions: Array.isArray(contenu.questions) ? contenu.questions.map(unPointParQuestion) : contenu.questions,
    };
}

function unPointParQuestion(q) {
    if (!q || !q.params || String(q.library || '').split(' ')[0] !== 'H5P.MultiChoice') return q;
    return { ...q, params: { ...q.params, behaviour: { ...(q.params.behaviour || {}), singlePoint: true } } };
}

/* ------------------------------------------------------------------ *
 *  Les conditions de Moodle
 * ------------------------------------------------------------------ */

/**
 * Un identifiant Moodle : un entier strictement positif, écrit en nombre dans le
 * JSON (`"id":"42"` est refusé par Moodle). `null`, `true` ou `0` ne passent pas :
 * `Number()` en ferait 0 ou 1, un élément de note qui n'existe pas.
 */
function entier(x, quoi) {
    const n = typeof x === 'number' ? x : (typeof x === 'string' && /^\d+$/.test(x.trim()) ? Number(x) : NaN);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`parcours_aiguillage_identifiant:${quoi}`);
    return n;
}

/** « L'activité `cm` est achevée ». */
export function achevee(cm) {
    return { type: 'completion', cm: entier(cm, 'cm'), e: 1 };
}

/**
 * La condition d'un chemin : la note au test dans `[min, max[`, section
 * MASQUÉE ENTIÈREMENT aux autres élèves (`showc: [false]`).
 * @param {number} noteId - Identifiant de l'élément de note du test.
 * @param {number|null} min - Pourcentage inclus, ou `null` pour le premier chemin.
 * @param {number|null} max - Pourcentage exclu, ou `null` pour le dernier.
 */
export function conditionChemin(noteId, min, max) {
    const c = { type: 'grade', id: entier(noteId, 'note') };
    if (min !== null && min !== undefined) c.min = min;
    if (max !== null && max !== undefined) c.max = max;
    return { op: '&', c: [c], showc: [false] };
}

/** Un sous-groupe « toutes ces activités achevées », sans drapeau d'affichage. */
function toutesAchevees(cms) {
    return cms.length === 1 ? achevee(cms[0]) : { op: '&', c: cms.map(achevee) };
}

/**
 * La condition de l'étape commune qui suit un aiguillage : toutes les activités
 * d'UN des chemins achevées. Masquée jusque-là : sa raison listerait les
 * activités des autres chemins.
 * @param {number[][]} chemins - Les activités à achèvement de chaque chemin.
 */
export function conditionApresChemins(chemins) {
    if (!chemins.length || chemins.some(c => !c.length)) throw new Error('parcours_aiguillage_chemin_sans_achevement');
    return { op: '|', c: chemins.map(toutesAchevees), show: false };
}

/**
 * La condition de la fin du parcours : toutes les activités communes achevées, et
 * pour chaque aiguillage, toutes celles d'un de ses chemins. Masquée jusque-là.
 * @param {number[]} communes
 * @param {number[][][]} aiguillages
 */
export function conditionFin(communes, aiguillages = []) {
    const c = [
        ...communes.map(achevee),
        ...aiguillages.map(chemins => ({ op: '|', c: chemins.map(toutesAchevees) })),
    ];
    if (!c.length) throw new Error('parcours_fin_sans_achevement');
    return { op: '&', c, showc: c.map(() => false) };
}

/**
 * Contrôle de FORME d'une condition, sur le modèle de `tree.php` : ce que Moodle
 * refuse par une exception, ou ce qui ne s'ouvrirait jamais.
 * @param {Object} arbre
 * @returns {string[]} Les défauts ; vide si la condition est valide.
 */
export function verifierCondition(arbre, racine = true) {
    const defauts = [];
    if (!arbre || typeof arbre !== 'object' || Array.isArray(arbre)) return ['pas un objet'];
    if (!['&', '|', '!&', '!|'].includes(arbre.op)) defauts.push(`op inconnu : ${arbre.op}`);
    if (!Array.isArray(arbre.c)) return [...defauts, 'c absent'];
    if (racine) {
        if (arbre.op === '&' || arbre.op === '!|') {
            if (!Array.isArray(arbre.showc)) defauts.push('showc absent');
            else if (arbre.showc.length !== arbre.c.length) defauts.push('showc et c de longueurs différentes');
            else if (arbre.showc.some(v => typeof v !== 'boolean')) defauts.push('showc non booléen');
        } else if (typeof arbre.show !== 'boolean') defauts.push('show absent ou non booléen');
    }
    if (!arbre.c.length) defauts.push('groupe vide : Moodle le tient pour vrai');
    for (const enfant of arbre.c) {
        if (enfant && typeof enfant === 'object' && 'type' in enfant) {
            if (enfant.type === 'grade') {
                if (!Number.isInteger(enfant.id) || enfant.id <= 0) defauts.push(`note : id non entier (${JSON.stringify(enfant.id)})`);
                for (const b of ['min', 'max']) {
                    if (b in enfant && (typeof enfant[b] !== 'number' || !Number.isFinite(enfant[b]))) defauts.push(`note : ${b} non numérique`);
                }
                if ('min' in enfant && 'max' in enfant && !(enfant.min < enfant.max)) defauts.push('note : min ≥ max');
            } else if (enfant.type === 'completion') {
                if (!Number.isInteger(enfant.cm) || enfant.cm <= 0) defauts.push(`achèvement : cm non entier (${JSON.stringify(enfant.cm)})`);
                if (![0, 1, 2, 3].includes(enfant.e)) defauts.push('achèvement : e inconnu');
            } else defauts.push(`condition inconnue : ${enfant.type}`);
        } else defauts.push(...verifierCondition(enfant, false));
    }
    return defauts;
}

/* ------------------------------------------------------------------ *
 *  Évaluer comme Moodle
 * ------------------------------------------------------------------ */

/**
 * Une condition est-elle remplie pour cet élève ? Même logique que Moodle :
 * `&` toutes, `|` au moins une, `!&` pas toutes, `!|` aucune ; note sans
 * valeur = faux ; `min` inclus, `max` exclu.
 *
 * @param {Object} arbre
 * @param {{notes:Object<number,number>, acheves:Set<number>}} eleve -
 *        `notes` : pourcentage par identifiant d'élément de note.
 * @returns {boolean}
 */
export function conditionRemplie(arbre, eleve) {
    const enfants = (arbre.c || []).map(e => (e && 'type' in e) ? conditionSimple(e, eleve) : conditionRemplie(e, eleve));
    // Un groupe vide est disponible pour Moodle (`tree::check_available`).
    if (!enfants.length) return true;
    if (arbre.op === '&') return enfants.every(Boolean);
    if (arbre.op === '|') return enfants.some(Boolean);
    if (arbre.op === '!&') return !enfants.every(Boolean);
    if (arbre.op === '!|') return !enfants.some(Boolean);
    return false;
}

function conditionSimple(c, eleve) {
    if (c.type === 'grade') {
        const note = eleve.notes ? eleve.notes[c.id] : undefined;
        if (note === undefined || note === null) return false;
        return (c.min === undefined || note >= c.min) && (c.max === undefined || note < c.max);
    }
    if (c.type === 'completion') {
        const fait = Boolean(eleve.acheves && eleve.acheves.has(c.cm));
        return c.e === 0 ? !fait : fait;
    }
    return false;
}

/**
 * Ce que l'élève voit d'une section ou d'une activité restreinte :
 * `ouverte`, `grisee` (visible avec sa raison) ou `masquee`.
 *
 * Racine `&` : masquée dès qu'une condition NON remplie porte `showc: false`.
 * Racine `|` : masquée si `show` est faux.
 *
 * @param {Object|null} arbre - `null` : aucune restriction.
 * @param {Object} eleve
 */
export function visibilitePourEleve(arbre, eleve) {
    if (!arbre) return 'ouverte';
    if (conditionRemplie(arbre, eleve)) return 'ouverte';
    if (arbre.op === '&' || arbre.op === '!|') {
        const masquee = (arbre.c || []).some((e, i) => {
            const remplie = (e && 'type' in e) ? conditionSimple(e, eleve) : conditionRemplie(e, eleve);
            const ok = arbre.op === '&' ? remplie : !remplie;
            return !ok && arbre.showc && arbre.showc[i] === false;
        });
        return masquee ? 'masquee' : 'grisee';
    }
    return arbre.show === false ? 'masquee' : 'grisee';
}

/**
 * Le cours tel que Moodle le verra, reconstruit depuis le PLAN, avec les mêmes
 * conditions que celles de l'assemblage (mêmes fonctions, identifiants fictifs) :
 * c'est ce qui permet à « Voir comme un élève » de montrer exactement ce que la
 * plateforme fera, sans fabriquer le fichier.
 *
 * @param {Object} plan
 * @param {Object} [o]
 * @param {Function} [o.sAcheve] - `(moduleKey) => boolean`.
 * @returns {{sections:Array<Object>, cm:Map<Object,number>, noteDe:Function, groupes:Array<Object>}} —
 *          `groupes` : les aiguillages, les MÊMES objets que ceux des sections.
 */
export function coursDuPlan(plan, { sAcheve = () => true } = {}) {
    const etapes = (plan && plan.etapes) || [];
    const groupes = aiguillagesDuPlan(plan);
    const cm = new Map();
    let prochain = 1;
    for (const e of etapes) for (const c of (e.cartes || [])) cm.set(c, prochain++);
    const noteDe = g => 100000 + groupes.indexOf(g);
    const achevables = etape => (etape.cartes || []).filter(c => sAcheve(c.module)).map(c => cm.get(c));
    const sections = [];
    etapes.forEach((etape, i) => {
        const g = groupes.find(x => i >= x.debut && i <= x.fin);
        let condition = null;
        let role = null;
        let plage = null;
        if (g) {
            const j = i - g.debut;
            const k = g.chemins.length;
            const n = g.test ? nombreQuestions(g.test, k) : QUESTIONS_CONSEILLEES[k] || 10;
            const bornes = bornesEnReponses(g.chemins.slice(1).map(c => c.depuis), n);
            role = g.chemins[j].role;
            plage = plagesEnReponses(bornes, n)[j];
            if (g.test) {
                condition = conditionChemin(noteDe(g), j === 0 ? null : seuilMoodle(bornes[j - 1], n),
                    j === k - 1 ? null : seuilMoodle(bornes[j], n));
            }
        } else {
            const avant = groupes.find(x => x.fin === i - 1);
            const groupesVides = avant && avant.chemins.some(c => !achevables(c.etape).length);
            if (avant && !groupesVides) condition = conditionApresChemins(avant.chemins.map(c => achevables(c.etape)));
            else if (plan.progression && plan.progression.actif && i >= 1 && !estChemin(etapes[i - 1])) {
                const precedentes = achevables(etapes[i - 1]);
                if (precedentes.length) condition = { op: '&', c: precedentes.map(achevee), showc: precedentes.map(() => true) };
            }
        }
        sections.push({ type: g ? 'chemin' : 'etape', etape, index: i, groupe: g || null, role, plage, condition });
    });
    const communes = etapes.filter(e => !estChemin(e)).flatMap(achevables);
    const parAiguillage = groupes.map(g => g.chemins.map(c => achevables(c.etape)));
    if (communes.length || parAiguillage.length) {
        const complet = parAiguillage.every(chs => chs.every(ch => ch.length));
        sections.push({ type: 'fin', condition: complet ? conditionFin(communes, parAiguillage) : null });
    }
    return { sections, cm, noteDe, groupes };
}

/**
 * La note que Moodle retiendra pour k bonnes réponses sur n, en pourcentage :
 * l'élément de note garde cinq décimales (`decimal(10,5)`).
 * @param {number} k
 * @param {number} n
 * @param {number} [noteMax] - 100 pour un H5P, 10 pour un Test.
 */
export function noteMoodle(k, n, noteMax = 100) {
    const brute = Math.round(((k / Math.max(1, n)) * noteMax) * 1e5) / 1e5;
    return (brute * 100) / noteMax;
}
