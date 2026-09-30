/** Contrat de composition uniquement : les retouches humaines restent libres. */
import { CONFIG } from './config.js';
import { trameParId, nbActivites, nbActivitesParEleve, rythme } from './templates.js';
import { CHEMINS_DEFAUT, ROLES_PAR_NOMBRE, MODULES_AIGUILLEURS } from './aiguillage.js';

/** Variantes typographiques seulement, jamais un palier inventé. */
export function normaliserPalier(valeur) {
    const s = typeof valeur === 'string' ? valeur.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    return ['decouverte', 'entrainement', 'transfert'].includes(s) ? s : null;
}

/** Activités à fabriquer, tous chemins compris, au plus (D5). */
const PLAFOND = 12;

/**
 * La répartition d'exemple d'un parcours LIBRE à chemins : une étape qui finit
 * par le test, les k chemins, une étape commune. Ce que fait UN élève — les
 * étapes communes et UN chemin — tient dans l'ampleur ; ce qui se fabrique, tous
 * chemins compris, reste sous le plafond. D'où des chemins plus courts quand ils
 * sont nombreux ou que l'ampleur est grande : sur une séquence à quatre chemins,
 * un seul temps différencié, d'une activité.
 *
 * @param {{activites:number[]}} ampleur
 * @param {number} k - Nombre de chemins.
 * @returns {number[]} Activités par étape.
 */
function exempleLibreAChemins(ampleur, k) {
    const [lo, hi] = ampleur.activites;
    for (let longueur = 3; longueur >= 1; longueur--) {
        const communes = Math.max(2, lo - longueur);
        if (communes + longueur <= hi && communes + k * longueur <= PLAFOND) {
            const avant = Math.ceil(communes / 2);
            return [avant, ...Array(k).fill(longueur), communes - avant];
        }
    }
    return [1, ...Array(k).fill(1), 1];
}

export function calibrer(draft) {
    const ampleur = CONFIG.ampleurs.find(a => a.id === draft.ampleur) || CONFIG.ampleurs[1];
    const nbChemins = draft.structure === 'chemins' ? (draft.chemins || CHEMINS_DEFAUT) : 0;
    const candidate = trameParId(draft.trame, ampleur.id, nbChemins || CHEMINS_DEFAUT);
    // Une trame à chemins ne vaut qu'en mode chemins, et inversement (D91).
    const compatible = Boolean(candidate)
        && candidate.ampleurs.includes(ampleur.id) && candidate.formats.includes(draft.format)
        && (candidate.id === 'libre' || (candidate.structure === 'chemins') === Boolean(nbChemins));
    const trame = compatible ? candidate : null;
    const r = trame && rythme(trame);
    const bornes = ampleur.id === 'courte' ? [2, 4] : ampleur.id === 'longue' ? [3, 6] : [2, 5];
    const n = r && nbActivites(trame);
    // Des chemins SANS trame (structure libre composée par l'IA) : une étape de
    // test, les chemins, une étape commune au moins. L'ampleur mesure alors ce
    // que fait UN élève (`parEleve`) ; `min`/`max` bornent ce qui se fabrique.
    const aiguillage = trame?.aiguillage
        || (nbChemins ? { debut: null, nombre: nbChemins, roles: [...ROLES_PAR_NOMBRE[nbChemins]], seuils: [] } : null);
    const libreAChemins = Boolean(aiguillage) && !r;
    const parEleve = !aiguillage ? null : r ? [nbActivitesParEleve(trame), nbActivitesParEleve(trame)] : [...ampleur.activites];
    return {
        min: n || (libreAChemins ? ampleur.activites[0] + nbChemins - 1 : ampleur.activites[0]),
        max: n || (libreAChemins ? PLAFOND : ampleur.activites[1]),
        parEleve,
        rythme: r || null, trame: r ? trame : null,
        etapesMin: r ? r.length : (aiguillage ? nbChemins + 2 : bornes[0]),
        etapesMax: r ? r.length : (aiguillage ? nbChemins + 4 : bornes[1]),
        notions: ampleur.id === 'courte' ? [3, 6] : ampleur.id === 'longue' ? [8, 12] : [6, 10],
        exemple: r || (libreAChemins ? exempleLibreAChemins(ampleur, nbChemins)
            : ampleur.id === 'courte' ? [1, 1, 1, 1] : ampleur.id === 'longue' ? [2, 3, 3, 2] : [1, 2, 2, 1]),
        aiguillage,
    };
}

/**
 * Les contrôles propres à un plan à CHEMINS (D90), sur le JSON reçu : un seul
 * aiguillage, le bon nombre de chemins, dans l'ordre des rôles, précédé d'une
 * étape dont la dernière activité notée est un test qui peut aiguiller, et des
 * chemins parallèles (même nombre d'activités, durée comparable).
 */
function controlerChemins(plan, c) {
    const erreurs = [];
    const etapes = Array.isArray(plan?.etapes) ? plan.etapes : [];
    const marques = etapes.map(e => (typeof e?.chemin === 'string' ? e.chemin : (e?.chemin && e.chemin.role) || null));
    const indices = marques.map((m, i) => (m ? i : -1)).filter(i => i >= 0);
    const attendus = c.aiguillage.roles;
    const contigus = indices.length && indices.every((x, j) => j === 0 || x === indices[j - 1] + 1);
    if (indices.length !== attendus.length || !contigus) {
        erreurs.push(`Prévoir EXACTEMENT ${attendus.length} étapes-chemins CONSÉCUTIVES, marquées "chemin" : ${attendus.map(r => `"${r}"`).join(', ')}, dans cet ordre.`);
        return erreurs;
    }
    if (marques.filter(Boolean).join() !== attendus.join()) {
        erreurs.push(`Les étapes-chemins portent, dans l'ordre, "chemin" : ${attendus.map(r => `"${r}"`).join(', ')}.`);
    }
    if (c.aiguillage.debut !== null && indices[0] !== c.aiguillage.debut) {
        erreurs.push(`Les chemins commencent à l'étape ${c.aiguillage.debut + 1}.`);
    }
    const avant = etapes[indices[0] - 1];
    const derniere = avant && Array.isArray(avant.cartes) ? [...avant.cartes].reverse().find(x => MODULES_AIGUILLEURS.has(x?.module)) : null;
    if (!derniere) {
        erreurs.push(`L'étape qui précède les chemins se termine par le test qui oriente les élèves : un module parmi ${[...MODULES_AIGUILLEURS].join(', ')}.`);
    }
    const tailles = indices.map(i => (Array.isArray(etapes[i].cartes) ? etapes[i].cartes.length : 0));
    if (Math.max(...tailles) - Math.min(...tailles) > 1) {
        erreurs.push(`Les chemins ont le même nombre d'activités (reçu : ${tailles.join(', ')}).`);
    }
    const durees = indices.map(i => (etapes[i].cartes || []).reduce((s, x) => s + (Number(x?.duree) || 0), 0));
    if (Math.min(...durees) < 0.75 * Math.max(...durees)) {
        erreurs.push(`Les chemins durent à peu près autant (reçu : ${durees.join(', ')} minutes).`);
    }
    // Ce que fait UN élève : les étapes communes et son chemin.
    if (c.parEleve) {
        const communes = etapes.reduce((s, e, i) => s + (indices.includes(i) || !Array.isArray(e?.cartes) ? 0 : e.cartes.length), 0);
        const [lo, hi] = c.parEleve;
        if (communes + Math.min(...tailles) < lo || communes + Math.max(...tailles) > hi) {
            erreurs.push(`Chaque élève fait les étapes communes et UN chemin : ${lo === hi ? lo : `${lo} à ${hi}`} activités par élève attendues (reçu : ${communes} communes + ${Math.min(...tailles) === Math.max(...tailles) ? Math.max(...tailles) : `${Math.min(...tailles)} à ${Math.max(...tailles)}`} dans un chemin).`);
        }
    }
    return erreurs;
}

/** Diagnostic sur le JSON reçu, AVANT les valeurs de repli du normaliseur. */
export function controlerCalibrage(plan, c, modules) {
    const erreurs = [];
    const etapes = Array.isArray(plan?.etapes) ? plan.etapes : [];
    const r = etapes.map(e => Array.isArray(e?.cartes) ? e.cartes.length : 0);
    const total = r.reduce((a, b) => a + b, 0);
    if (total < c.min || total > c.max) erreurs.push(`Total reçu : ${total} activités ; attendu : ${c.min} à ${c.max}, pour TOUT le parcours.`);
    if (r.length < c.etapesMin || r.length > c.etapesMax || r.some(n => !n)) erreurs.push(`Prévoir ${c.etapesMin} à ${c.etapesMax} étapes non vides.`);
    if (c.rythme && JSON.stringify(r) !== JSON.stringify(c.rythme)) erreurs.push(`Répartition reçue : ${r.join(' + ')} ; imposée : ${c.rythme.join(' + ')}.`);
    const texte = v => typeof v === 'string' && v.trim().length > 0;
    if (!texte(plan?.titre) || !texte(plan?.objectifGeneral)) erreurs.push('Donner un titre et un objectif général non vides.');
    const autorises = new Set(modules.map(m => m.cle));
    etapes.forEach((e, i) => {
        if (!texte(e?.titre) || !texte(e?.objectif)) erreurs.push(`Étape ${i + 1} : titre et objectif nécessaires.`);
        (Array.isArray(e?.cartes) ? e.cartes : []).forEach((a, j) => {
            const attendu = c.trame?.paliers?.[i];
            if (!autorises.has(a?.module)) erreurs.push(`Étape ${i + 1}, activité ${j + 1} : choisir un module du catalogue autorisé.`);
            const palier = normaliserPalier(a?.palier);
            if (!palier || attendu && palier !== attendu) erreurs.push(`Étape ${i + 1}, activité ${j + 1} : palier ${attendu || 'decouverte, entrainement ou transfert'} attendu.`);
            if (!Number.isInteger(a?.duree) || a.duree < 1 || a.duree > 180) erreurs.push(`Étape ${i + 1}, activité ${j + 1} : durée entière de 1 à 180 minutes.`);
            if (!['titre', 'objectif', 'consigne'].every(k => texte(a?.[k]))) erreurs.push(`Étape ${i + 1}, activité ${j + 1} : compléter titre, objectif et consigne.`);
        });
    });
    if (c.trame?.id === 'rituel' && etapes.flatMap(e => e.cartes || []).reduce((s, a) => s + (Number(a?.duree) || 0), 0) > 10) erreurs.push('Le rituel doit tenir en 10 minutes au total.');
    if (c.aiguillage) erreurs.push(...controlerChemins(plan, c));
    return erreurs;
}

/**
 * Espaces où l'on écrit à plusieurs : un même travail s'y POURSUIT. En ouvrir un
 * second pour « améliorer » ou « finaliser » oblige les équipes à tout recopier.
 * Constaté sur deux parcours réels du 28 sept. 2026, malgré la règle du prompt :
 * un Document collaboratif, puis un wiki « Finaliser la structure du document » ;
 * puis un second Document collaboratif « Améliorer votre document » (D81).
 */
const ECRITURE_COMMUNE = new Set(['parcours_document', 'parcours_wiki', 'parcours_etherpad']);
/** Espaces de dépôt à plusieurs : deux fois le même module, c'est deux fois le même travail. */
const DEPOT_COMMUN = new Set(['parcours_tableau', 'parcours_base', 'parcours_mur_notes', 'parcours_glossaire']);

/**
 * Remarques de COMPOSITION : elles provoquent la recomposition unique, jamais un
 * échec. Si la seconde proposition les garde, le plan passe : l'enseignant le
 * relit, et un doublon peut avoir sa raison.
 * @returns {string[]}
 */
export function remarquesComposition(plan) {
    const cartes = (Array.isArray(plan?.etapes) ? plan.etapes : []).flatMap((e, i) =>
        (Array.isArray(e?.cartes) ? e.cartes : []).map(c => ({ etape: i + 1, module: c?.module, titre: c?.titre || '' })));
    const remarques = [];
    const ecriture = cartes.filter(c => ECRITURE_COMMUNE.has(c.module));
    if (ecriture.length > 1) {
        remarques.push(`Activités ${ecriture.map(c => `« ${c.titre} » (étape ${c.etape})`).join(', ')} : plusieurs espaces d’écriture commune (${[...new Set(ecriture.map(c => c.module))].join(', ')}). ` +
            'Un même travail se poursuit dans UN espace : garde le premier, fais renvoyer les consignes suivantes à cet espace, et donne aux places libérées un autre module (forum, questionnaire, devoir, atelier…).');
    }
    for (const module of DEPOT_COMMUN) {
        const memes = cartes.filter(c => c.module === module);
        if (memes.length > 1) {
            remarques.push(`Activités ${memes.map(c => `« ${c.titre} » (étape ${c.etape})`).join(', ')} : deux fois ${module}. ` +
                'Pour poursuivre le même recueil, renvoie au premier espace et choisis un autre module pour la place libérée.');
        }
    }
    return remarques;
}
