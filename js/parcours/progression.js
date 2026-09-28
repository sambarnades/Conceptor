/**
 * @file Parcours — l'ouverture progressive des étapes (restrictions d'accès).
 *
 * Un parcours dont toutes les étapes sont ouvertes d'emblée est une liste ; un
 * parcours dont l'étape suivante s'ouvre quand la précédente est faite est un
 * chemin. C'est la même différence que celle que la Carte de progression donne à
 * VOIR — sauf qu'ici on ne la montre pas, on la fait.
 *
 * ## Ce qu'on pose, et où
 *
 * Moodle porte les restrictions d'accès à DEUX endroits : sur l'activité
 * (`course_modules.availability`) et sur la section
 * (`course_sections.availabilityjson`). On pose sur la **section**, pour trois
 * raisons :
 *
 *   1. C'est littéralement ce que le réglage annonce — « ouvrir les étapes l'une
 *      après l'autre ». Une étape = une section (D15) ; la condition se lit donc
 *      là où l'enseignant la pense.
 *   2. Une condition par étape au lieu d'une par activité : sur un parcours de
 *      douze activités en quatre étapes, trois écritures au lieu de neuf, et un
 *      message d'indisponibilité affiché une fois plutôt que répété.
 *   3. Moodle fait respecter la restriction de section aux activités qu'elle
 *      contient (`\\core_availability\\info_section`), l'accès direct par URL
 *      compris : on ne perd rien en granularité.
 *
 * ## La forme exacte de la condition
 *
 * ```json
 * {"op":"&","c":[{"type":"completion","cm":900100,"e":1}],"showc":[true]}
 * ```
 *
 * `op: "&"` — TOUTES les activités de l'étape précédente. `e: 1` vaut
 * `COMPLETION_COMPLETE`. `showc` est le tableau (parallèle à `c`) des drapeaux
 * d'affichage, forme qu'exige `&` — `|` prendrait un `show` booléen. On le met à
 * `true` **partout** : l'étape reste VISIBLE, grisée, avec la raison écrite en
 * clair (« Non disponible tant que : … est marqué comme terminé »). Cacher
 * l'étape produirait un cours qui semble tronqué et un élève qui ne sait pas ce
 * qui l'attend ; l'objet d'un parcours est justement de montrer le chemin.
 *
 * ## Pourquoi une passe, et non un réglage du constructeur
 *
 * Le constructeur de cours (`moodle/mbz-course-builder.js`) est PARTAGÉ avec La
 * Sucrerie : il assemble, il ne décide pas de pédagogie. Poser une progression
 * est une décision d'atelier, propre au parcours. On l'applique donc APRÈS coup,
 * sur la carte de fichiers qu'il vient de rendre — ce qui a l'avantage de traiter
 * de la même façon les trois voies d'assemblage (H5P, Test, module Moodle) sans
 * rien savoir d'aucune. Même raisonnement que D28, appliqué à un fichier
 * partagé qu'on ne veut pas apprendre à parler « parcours ».
 *
 * @module parcours/progression
 */

import { escapeXml } from '../moodle/moodle-formats.js';
import { MODULES_SANS_ACHEVEMENT } from './modules-parcours.js';

/**
 * L'état par défaut de l'ouverture progressive dans un plan neuf.
 *
 * **Décochée**, comme la Carte, et pour la même raison (D24) : les restrictions
 * d'accès n'ont jamais franchi l'aller-retour. Leur mode d'échec n'est pas
 * bénin — une condition qui pointerait dans le vide rendrait l'étape
 * indisponible pour toujours, et l'enseignant ne le découvrirait qu'une fois la
 * classe devant.
 *
 * @returns {{actif:boolean}}
 */
export function progressionParDefaut() {
    return { actif: false };
}

/**
 * Normalise le réglage de progression d'un plan, d'où qu'il vienne.
 * @param {*} brut
 * @returns {{actif:boolean}}
 */
export function normaliserProgression(brut) {
    if (!brut || typeof brut !== 'object') return progressionParDefaut();
    return { actif: Boolean(brut.actif) };
}

/**
 * La progression doit-elle être posée ?
 *
 * Il faut au moins DEUX étapes : sur une étape unique il n'y a rien à ouvrir
 * après quoi que ce soit, et poser une restriction sur la seule étape du
 * parcours la rendrait inaccessible.
 *
 * @param {Object} plan
 * @param {number} nbEtapes - Sections d'étape réellement produites (hors la 0).
 * @returns {boolean}
 */
export function progressionAPoser(plan, nbEtapes) {
    const p = plan && plan.progression;
    return Boolean(p && p.actif) && nbEtapes >= 2;
}

/**
 * La condition d'accès d'une étape : toutes les activités de la précédente.
 *
 * @param {number[]} moduleIds - Identifiants de module de l'étape précédente.
 * @returns {string} JSON de `availabilityjson`, non échappé.
 */
export function conditionEtape(moduleIds) {
    return JSON.stringify({
        op: '&',
        c: moduleIds.map(cm => ({ type: 'completion', cm, e: 1 })),
        showc: moduleIds.map(() => true),
    });
}

/**
 * Pose l'ouverture progressive sur un cours assemblé.
 *
 * Rend une NOUVELLE carte de fichiers : la fonction ne modifie pas celle qu'on
 * lui passe, pour qu'un appel raté laisse le cours intact plutôt qu'à moitié
 * contraint.
 *
 * La zone « Généralités » (section 0) n'est jamais contrainte, et l'étape 1 non
 * plus : sa seule devancière serait la section 0, qui ne contient au mieux que
 * la Carte de progression — laquelle ne s'achève pas (`completion: 0`).
 * Conditionner l'étape 1 à son achèvement fermerait le parcours entier, dès la
 * première page.
 *
 * @param {Object<string,string>} files - Carte de fichiers du constructeur.
 * @param {Object} p
 * @param {Array<{moduleId:number, sectionId:number, moduleName:string}>} p.activites
 * @param {Array<{sectionId:number, number:number}>} p.sections
 * @returns {{files:Object<string,string>, etapesContraintes:number}}
 */
export function poserProgression(files, { activites, sections }) {
    const sortie = { ...files };

    // sectionId → numéro d'étape, et numéro → identifiants de module.
    const numeroDe = new Map(sections.map(s => [s.sectionId, s.number]));
    const parNumero = new Map();
    for (const a of activites) {
        // Une étiquette ne s'achève jamais (`completion: 0`) : l'inclure dans la
        // condition fermerait l'étape suivante pour toujours. C'est le cas des
        // textes d'introduction (D64) comme d'un « Texte de liaison » posé à la main
        // — et de tout module natif livré sans achèvement (wiki, document
        // collaboratif, classe virtuelle, atelier… D71).
        if (MODULES_SANS_ACHEVEMENT.has(a.moduleName)) continue;
        const n = numeroDe.get(a.sectionId);
        if (n === undefined) continue;
        if (!parNumero.has(n)) parNumero.set(n, []);
        parNumero.get(n).push(a.moduleId);
    }

    let etapesContraintes = 0;
    for (const s of sections) {
        // On part de l'étape 2 : la 0 est la zone « Généralités », la 1 ouvre le
        // parcours et ne dépend de rien.
        if (s.number < 2) continue;
        const precedente = parNumero.get(s.number - 1);
        // Une étape précédente sans activité ne peut rien conditionner : mieux
        // vaut une étape ouverte qu'une étape verrouillée sur du vide.
        if (!precedente || !precedente.length) continue;

        const chemin = `sections/section_${s.sectionId}/section.xml`;
        const xml = sortie[chemin];
        if (typeof xml !== 'string') continue;

        const json = escapeXml(conditionEtape(precedente));
        const remplace = xml.replace(
            /<availabilityjson>\$@NULL@\$<\/availabilityjson>/,
            `<availabilityjson>${json}</availabilityjson>`);
        // Si le marqueur n'y était pas, on ne touche à rien : écrire une
        // restriction à côté du champ attendu serait pire que ne pas en écrire.
        if (remplace === xml) continue;

        sortie[chemin] = remplace;
        etapesContraintes++;
    }

    return { files: sortie, etapesContraintes };
}
