/**
 * @file Parcours — aiguillage d'une carte de plan vers un module Caramel.
 *
 * Le modèle ne choisit PAS librement : on lui donne la liste close des modules
 * réellement disponibles pour la plateforme visée, et on vérifie ce qu'il
 * renvoie. Un identifiant inventé ou indisponible est ramené à un repli sûr
 * plutôt que de casser la fabrication huit cartes plus loin.
 *
 * Le filtrage par plateforme n'est pas cosmétique : `simplequiz`, `epikmatch` et
 * `millionnairev2` sont des greffons ÉLÉA, `etherpadlite` et `collabwordcloud`
 * des greffons de MAGISTÈRE (palettes relevées le 27 sept. 2026). Proposer l'un
 * d'eux sur une plateforme qui ne l'a pas produit un `.mbz` dont l'import
 * échoue — et l'enseignant n'a aucun moyen de comprendre pourquoi.
 * L'information est portée, module par module, par le champ `platforms` de
 * `core/definitions.js` et du registre des modules de parcours.
 *
 * @module parcours/activity-router
 */

import { allModules } from '../core/definitions.js';
import { t } from '../core/translation.js';
import { CONFIG } from './config.js';
import { MODULES_PARCOURS, modulesParcoursPour, estModuleParcours } from './modules-parcours.js';

/**
 * Replis par palier, dans l'ordre de préférence. Utilisés quand le modèle
 * renvoie un identifiant inconnu : mieux vaut une activité plausible qu'un
 * trou dans le parcours. Tous existent sur les trois plateformes.
 */
const REPLIS = {
    decouverte:   ['Page', 'Livre', 'Flashcards', 'QuizSet'],
    entrainement: ['QuizSet', 'FillInTheBlanks', 'MultipleChoice', 'Page'],
    transfert:    ['QuizSet', 'Essay', 'Devoir', 'Page'],
};

/** Nom de plateforme tel qu'il figure dans `definitions.js`, depuis notre id. */
function nomPlateforme(platformId) {
    const p = CONFIG.platforms.find(x => x.id === platformId);
    return p ? p.moduleFilter : 'Éléa';
}

// Les modules à vidéo/image sont maintenant proposés : la source est demandée
// sur leur carte avant génération (sources.js). Une source absente ne provoque
// jamais la génération d’un contenu fictif.

/**
 * Modules dont le CONTENU ne survit pas à la restauration d'un cours.
 *
 * `glossaireXml` en est : ses entrées sont des **données utilisateur** pour
 * Moodle (`userinfo`), et une restauration d'enseignant n'en restaure jamais.
 * Vérifié par aller-retour réel le 4 sept. 2026 sur Éléa ET Magistère : les sept
 * entrées envoyées reviennent à ZÉRO, `<entries>` vide, sur les deux
 * plateformes — le module se crée, mais vide. Or c'est exactement ce que le
 * parcours ne doit pas faire : livrer une coquille sans le dire, que
 * l'enseignant découvrirait devant sa classe.
 *
 * Ce n'est pas un défaut de Caramel : son export de glossaire est un fichier XML
 * d'IMPORT (`formats: ["XML", …]`, aucun MBZ), et c'est la bonne voie pour un
 * glossaire. La Sucrerie avait d'ailleurs déjà écarté le glossaire de son propre
 * export « parcours » pour cette raison exacte.
 *
 * Réouvrir avec le niveau « réservé » du lot 2 : poser le module VIDE et dire
 * dans le parcours qu'il faut y importer le `.xml` — mais alors en le disant.
 */
const CONTENU_NON_RESTAURABLE = new Set(['glossaireXml']);

/**
 * Modules proposables pour une plateforme donnée.
 * @param {string} platformId - `elea` | `magistere` | `moodle`
 * @returns {Array<{cle:string, englishName:string, nom:string, categories:string[]}>}
 */
export function modulesDisponibles(platformId) {
    const plateforme = nomPlateforme(platformId);
    const activites = Object.entries(allModules)
        .filter(([cle, m]) => !m.hidden && !CONTENU_NON_RESTAURABLE.has(cle)
            && Array.isArray(m.platforms) && m.platforms.includes(plateforme))
        .map(([cle, m]) => ({
            cle,
            englishName: m.englishName || cle,
            nom: t(m.name),
            categories: Array.isArray(m.categories) ? m.categories : [],
        }));

    // Les modules propres au parcours ferment la marche : ce ne sont pas des
    // activités que Caramel sait produire seules (personne ne télécharge un
    // forum), mais des pièces de cours — un espace d'échange, un sondage, un
    // texte de liaison. Ils n'ont donc pas de tuile, et vivent dans leur propre
    // registre (`modules-parcours.js`).
    return activites.concat(modulesParcoursPour(plateforme));
}

/**
 * Index tolérant : clé exacte, nom anglais, minuscules, sans espaces.
 *
 * Les CLÉS passent d'abord et ne sont jamais écrasées : le Glossaire à
 * construire a pour nom Moodle `glossary`, que la normalisation confond avec la
 * clé H5P `Glossary`. Sans cette priorité, le dernier inscrit gagnait — et un
 * plan qui demandait le lexique H5P recevait un glossaire vide de plateforme.
 */
function indexer(modules) {
    const idx = new Map();
    const normaliser = k => String(k).toLowerCase().replace(/[\s_-]/g, '');
    const poser = (k, v) => {
        if (!k) return;
        const n = normaliser(k);
        if (!idx.has(n)) idx.set(n, v);
    };
    for (const m of modules) poser(m.cle, m.cle);
    for (const m of modules) {
        poser(m.englishName, m.cle);
        poser(m.nom, m.cle);
    }
    return idx;
}

/**
 * Le module d'une trame pour une plateforme.
 *
 * Une entrée de trame peut offrir des ALTERNATIVES, séparées par `|` et rangées
 * par préférence : `parcours_questionnaire|parcours_enquete|parcours_sondage`
 * veut dire « le questionnaire là où il existe, sinon l'enquête, sinon le
 * sondage ». C'est ce qui permet à une trame d'employer un greffon d'Éléa ou de
 * Magistère sans casser sur un Moodle nu : on retient la PREMIÈRE alternative
 * présente dans la palette, et la première tout court si aucune ne l'est (le
 * routeur la rattrapera alors, et la carte le dira).
 *
 * @param {string} entree
 * @param {string} platformId
 * @returns {string}
 */
export function moduleDeTrame(entree, platformId) {
    const alternatives = String(entree || '').split('|').map(x => x.trim()).filter(Boolean);
    if (alternatives.length < 2) return alternatives[0] || '';
    const dispo = new Set(modulesDisponibles(platformId).map(m => m.cle));
    return alternatives.find(c => dispo.has(c)) || alternatives[0];
}

/**
 * Ramène l'identifiant proposé par le modèle à un module réellement disponible.
 *
 * @param {string} propose   - Ce que le modèle a écrit.
 * @param {string} platformId
 * @param {string} [palier]  - `decouverte` | `entrainement` | `transfert`
 * @returns {{cle:string, exact:boolean}} `exact:false` signale un repli — la
 *          carte sera marquée dans le tableau de bord, l'enseignant décidera.
 */
export function resoudreModule(propose, platformId, palier = 'entrainement') {
    const modules = modulesDisponibles(platformId);
    const idx = indexer(modules);

    const cherche = String(propose || '').toLowerCase().replace(/[\s_-]/g, '');
    if (cherche && idx.has(cherche)) return { cle: idx.get(cherche), exact: true };

    const dispo = new Set(modules.map(m => m.cle));
    for (const candidat of (REPLIS[palier] || REPLIS.entrainement)) {
        if (dispo.has(candidat)) return { cle: candidat, exact: false };
    }
    // Dernier recours : le premier module disponible, quel qu'il soit. Ne devrait
    // jamais servir — `Page` existe sur les trois plateformes.
    return { cle: modules[0] ? modules[0].cle : 'Page', exact: false };
}

/**
 * Libellé traduit d'un module, pour l'affichage dans le tableau de bord.
 * @param {string} cle
 * @returns {string}
 */
export function nomModule(cle) {
    if (estModuleParcours(cle)) return t(MODULES_PARCOURS[cle].nameKey);
    const m = allModules[cle];
    return m ? t(m.name) : cle;
}

/**
 * Vignette d'un module, pour l'affichage dans le tableau de bord.
 * @param {string} cle
 * @returns {string|null}
 */
export function imageModule(cle) {
    // Les modules de la plateforme ont la vignette que leur donne le sélecteur
    // d'activités d'Éléa — pictogramme officiel sur la couleur de sa catégorie,
    // relevé le 28 sept. 2026 —, comme les modules Moodle que Caramel génère.
    if (estModuleParcours(cle)) return MODULES_PARCOURS[cle].image || null;
    const m = allModules[cle];
    return m && m.image ? m.image : null;
}

/**
 * Icône d'un module de parcours (Font Awesome), à défaut de vignette.
 * @param {string} cle
 * @returns {string|null}
 */
export function iconeModule(cle) {
    return estModuleParcours(cle) ? MODULES_PARCOURS[cle].icone : null;
}
