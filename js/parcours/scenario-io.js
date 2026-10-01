/**
 * @file Parcours — le scénario, en fichier.
 *
 * Un parcours vit dans `sessionStorage` : fermer l'onglet le perd. Le scénario
 * est sa forme portable — un JSON qu'on garde, qu'on range avec ses documents,
 * qu'on transmet à un collègue, et qu'on rouvre trois semaines plus tard pour
 * régénérer une activité ou changer une durée.
 *
 * Il contient **le plan ET les contenus déjà fabriqués** : un scénario sans ses
 * contenus obligerait à tout refabriquer à la réouverture — c'est-à-dire à
 * repayer les huit appels au modèle pour retrouver ce qu'on avait déjà.
 *
 * Il ne contient PAS le contexte de la page d'accueil (qui, quoi, niveau,
 * corpus). Celui-ci est relu en direct à chaque ouverture (D2) et n'a donc
 * aucune raison d'être figé dans un fichier — a fortiori le corpus, qui peut
 * peser des dizaines de milliers de caractères et appartient au poste de
 * l'enseignant.
 *
 * @module parcours/scenario-io
 */

import { relireSources } from './sources.js';
import { CONFIG } from './config.js';
import { normaliserCarte } from './carte-progression.js';
import { normaliserProgression } from './progression.js';
import { currentLang } from '../core/translation.js';
import { horodatageFichier } from '../core/utils.js';
import { modulesDisponibles, resoudreModule } from './activity-router.js';
import { aDesChemins, normaliserAiguillages } from './aiguillage.js';

/** Version du FORMAT de scénario, indépendante de celle du brouillon. */
export const FORMAT_SCENARIO = 1;
/**
 * Le format d'un scénario à CHEMINS (D90). Une version antérieure de Caramel
 * le refuse (« version inconnue ») au lieu d'en faire un parcours à la suite,
 * chemins mis bout à bout : un refus clair vaut mieux qu'un cours faux. Un
 * scénario sans chemin reste au format 1, lisible partout.
 */
export const FORMAT_SCENARIO_CHEMINS = 2;

/**
 * Sérialise le brouillon en scénario.
 * @param {Object} draft
 * @returns {Object}
 */
export function versScenario(draft) {
    return {
        format: aDesChemins(draft.plan) ? FORMAT_SCENARIO_CHEMINS : FORMAT_SCENARIO,
        produit: 'caramel-parcours',
        version: CONFIG.version,
        langue: currentLang,
        exporteLe: new Date().toISOString(),
        cadrage: {
            platform: draft.platform,
            format: draft.format,
            ampleur: draft.ampleur,
            trame: draft.trame,
            structure: draft.structure || CONFIG.defaults.structure,
            chemins: draft.chemins || CONFIG.defaults.chemins,
        },
        plan: draft.plan || null,
    };
}

/**
 * Nom du fichier de scénario, sur la convention des autres exports.
 * @param {Object} draft
 * @returns {string}
 */
export function nomFichierScenario(draft) {
    const base = String((draft.plan && draft.plan.titre) || 'parcours')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'parcours';
    const lang = currentLang === 'zh' ? 'zh-cn' : (currentLang || 'fr');
    return `parcours-${base}-caramel-${horodatageFichier()}-${lang}.json`;
}

/**
 * Relit un scénario et rend le fragment de brouillon à appliquer.
 *
 * Volontairement TOLÉRANT sur ce qui manque, STRICT sur ce qui compte : un
 * fichier sans plan exploitable n'est pas un scénario, et le dire tout de suite
 * vaut mieux que d'ouvrir un atelier vide. En revanche un cadrage incomplet se
 * rattrape avec les valeurs par défaut — ce sont des préférences, pas du
 * contenu.
 *
 * @param {string} texte - Le contenu du fichier.
 * @returns {{platform:string, format:string, ampleur:string, trame:string, plan:Object}}
 * @throws {Error} `parcours_scenario_illisible` | `parcours_scenario_sans_plan`
 */
export function depuisScenario(texte) {
    let brut;
    try { brut = JSON.parse(String(texte || '')); }
    catch { throw new Error('parcours_scenario_illisible'); }

    if (!brut || typeof brut !== 'object' || brut.produit !== 'caramel-parcours') {
        throw new Error('parcours_scenario_illisible');
    }
    if (brut.format !== FORMAT_SCENARIO && brut.format !== FORMAT_SCENARIO_CHEMINS) throw new Error('parcours_scenario_version');

    const plan = brut.plan;
    const etapes = plan && Array.isArray(plan.etapes) ? plan.etapes : null;
    if (!etapes?.length || etapes.some(e => !e || typeof e !== 'object' || !Array.isArray(e.cartes))) {
        throw new Error('parcours_scenario_sans_plan');
    }
    if (etapes.length > 24 || etapes.reduce((n, e) => n + e.cartes.length, 0) > 12) {
        throw new Error('parcours_scenario_trop_long');
    }
    if (etapes.some(e => e.cartes.some(c => !c || typeof c !== 'object' || Array.isArray(c)))) {
        throw new Error('parcours_scenario_illisible');
    }
    // Le Glossaire H5P accepte une liste de panneaux à la racine (format émis
    // par son prompt), aussi bien qu'un objet.panels. Refuser toute liste rendait
    // un parcours fabriqué et exporté par Caramel impossible à reprendre.
    if (etapes.some(e => e.cartes.some(c => {
        if (c.contenu == null) return false;
        return typeof c.contenu !== 'object' || (Array.isArray(c.contenu) && c.module !== 'Glossary');
    }))) {
        throw new Error('parcours_scenario_illisible');
    }

    const cadrage = brut.cadrage || {};
    const choisir = (liste, valeur, defaut) =>
        liste.some(x => x.id === valeur) ? valeur : defaut;

    const platform = choisir(CONFIG.platforms, cadrage.platform, CONFIG.defaults.platform);
    const disponibles = new Set(modulesDisponibles(platform).map(m => m.cle));
    // Un contenu existant n’est jamais réinterprété dans un autre type.
    if (etapes.some(e => e.cartes.some(c => c.contenu && !disponibles.has(c.module)))) {
        throw new Error('parcours_scenario_module_incompatible');
    }
    const ids = new Set();
    function identifiant(valeur, prefixe) {
        const candidat = String(valeur || '');
        const id = /^[a-zA-Z0-9_-]+$/.test(candidat) && !ids.has(candidat)
            ? candidat : `${prefixe}_${crypto.randomUUID()}`;
        ids.add(id);
        return id;
    }

    const planRelu = {
        titre: String(plan.titre || ''),
        objectifGeneral: String(plan.objectifGeneral || ''),
        introduction: String(plan.introduction || ''),
        conclusion: String(plan.conclusion || ''),
        notionsPivots: Array.isArray(plan.notionsPivots) ? plan.notionsPivots.map(String) : [],
        origine: plan.origine || 'ia',
        personnalise: Boolean(plan.personnalise),
        // `normaliserCarte` ramène au thème par défaut un nom de thème que
        // le catalogue amont ne connaîtrait plus : un scénario rouvert des
        // mois plus tard ne doit pas produire un `.mbz` dont l'import
        // échoue chez le greffon (cf. `carte-progression.js`).
        carte: normaliserCarte(plan.carte),
        progression: normaliserProgression(plan.progression),
        etapes: etapes.map((e, i) => ({
            id: identifiant(e.id, 'e'),
            titre: String(e.titre || ''),
            objectif: String(e.objectif || ''),
            introduction: String(e.introduction || ''),
            // Une étape-chemin garde son seuil ; `normaliserAiguillages`
            // remet d'aplomb un aiguillage que le fichier aurait abîmé.
            ...(e.chemin && typeof e.chemin === 'object' ? { chemin: { depuis: Number(e.chemin.depuis) } } : {}),
            cartes: (Array.isArray(e.cartes) ? e.cartes : []).map((c, j) => ({
                ...relireSources(c),
                id: identifiant(c.id, 'c'),
                titre: String(c.titre || ''),
                objectif: String(c.objectif || ''),
                consigne: String(c.consigne || ''),
                module: resoudreModule(c.module, platform, c.palier).cle,
                moduleReplie: Boolean(c.moduleReplie) || !disponibles.has(c.module),
                palier: ['decouverte', 'entrainement', 'transfert'].includes(c.palier)
                    ? c.palier : 'entrainement',
                duree: Number.isFinite(Number(c.duree)) && Number(c.duree) > 0
                    ? Math.min(180, Math.round(Number(c.duree))) : 10,
                verrouillee: Boolean(c.verrouillee),
                // Le contenu revient tel qu'il a été fabriqué ; il repassera
                // par `json-healer.js` à l'assemblage, comme tout le reste.
                contenu: (c.contenu && typeof c.contenu === 'object') ? c.contenu : null,
            })),
        })),
    };
    normaliserAiguillages(planRelu);
    const structure = aDesChemins(planRelu) ? 'chemins'
        : choisir(CONFIG.structures, cadrage.structure, CONFIG.defaults.structure);
    return {
        platform,
        format: choisir(CONFIG.formats, cadrage.format, CONFIG.defaults.format),
        ampleur: choisir(CONFIG.ampleurs, cadrage.ampleur, CONFIG.defaults.ampleur),
        trame: cadrage.trame || CONFIG.defaults.trame,
        structure,
        chemins: CONFIG.nombresDeChemins.includes(cadrage.chemins) ? cadrage.chemins : CONFIG.defaults.chemins,
        plan: planRelu,
    };
}
