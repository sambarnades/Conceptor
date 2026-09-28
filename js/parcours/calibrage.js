/** Contrat de composition uniquement : les retouches humaines restent libres. */
import { CONFIG } from './config.js';
import { trameParId, nbActivites, rythme } from './templates.js';

/** Variantes typographiques seulement, jamais un palier inventé. */
export function normaliserPalier(valeur) {
    const s = typeof valeur === 'string' ? valeur.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    return ['decouverte', 'entrainement', 'transfert'].includes(s) ? s : null;
}

export function calibrer(draft) {
    const ampleur = CONFIG.ampleurs.find(a => a.id === draft.ampleur) || CONFIG.ampleurs[1];
    const candidate = trameParId(draft.trame, ampleur.id);
    const trame = candidate?.ampleurs.includes(ampleur.id) && candidate.formats.includes(draft.format)
        ? candidate : null;
    const r = trame && rythme(trame);
    const bornes = ampleur.id === 'courte' ? [2, 4] : ampleur.id === 'longue' ? [3, 6] : [2, 5];
    const n = r && nbActivites(trame);
    return {
        min: n || ampleur.activites[0], max: n || ampleur.activites[1],
        rythme: r || null, trame: r ? trame : null,
        etapesMin: r ? r.length : bornes[0], etapesMax: r ? r.length : bornes[1],
        notions: ampleur.id === 'courte' ? [3, 6] : ampleur.id === 'longue' ? [8, 12] : [6, 10],
        exemple: r || (ampleur.id === 'courte' ? [1, 1, 1, 1] : ampleur.id === 'longue' ? [2, 3, 3, 2] : [1, 2, 2, 1]),
    };
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
