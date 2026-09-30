/**
 * @file Parcours — les chemins et la fin du parcours, posés dans le cours assemblé.
 *
 * Même principe que l'ouverture progressive (`progression.js`, D33) : le
 * constructeur de cours est PARTAGÉ avec La Sucrerie, il assemble et ne décide
 * pas de pédagogie. Les restrictions se posent donc APRÈS l'assemblage, sur la
 * carte de fichiers qu'il rend, section par section. Et ce passage s'exécute AVANT
 * l'ouverture progressive : celle-ci ne remplace que les sections encore libres
 * (`$@NULL@$`), elle ne peut donc ni écraser un chemin ni conditionner le bilan
 * sur le seul dernier chemin.
 *
 * Ce qui est posé :
 *   - chaque CHEMIN : la note au test dans sa plage, section masquée entièrement
 *     aux autres élèves ;
 *   - l'étape COMMUNE qui suit : toutes les activités d'un des chemins achevées,
 *     masquée jusque-là ;
 *   - la FIN DU PARCOURS : toutes les activités communes, et un chemin complet par
 *     aiguillage ;
 *   - le TEST : noté sur la première tentative (`grademethod` 4 pour un H5P ;
 *     pour un Test, une seule tentative est posée à la fabrication du fichier).
 *
 * Les identifiants viennent des FICHIERS ÉCRITS — l'élément de note dans le
 * `grades.xml` de l'activité, le module dans son dossier — jamais d'un calcul
 * refait à côté : c'est ce que Moodle traduira à la restauration.
 *
 * Toute condition passe le contrôle de forme de `verifierCondition` avant d'être
 * écrite : un défaut arrête l'assemblage au lieu de livrer un cours dont une
 * section ne s'ouvrirait jamais.
 *
 * @module parcours/aiguillage-cours
 */

import { escapeXml } from '../moodle/moodle-formats.js';
import { sectionIdFor } from '../moodle/mbz-course-builder.js';
import { MODULES_SANS_ACHEVEMENT } from './modules-parcours.js';
import {
    aiguillagesDuPlan, estChemin, nombreQuestions, bornesEnReponses, seuilMoodle,
    conditionChemin, conditionApresChemins, conditionFin, verifierCondition,
} from './aiguillage.js';

/** Modules posés qui ne s'achèvent jamais : hors de toute condition (D71). */
function sAcheve(moduleName) {
    return !MODULES_SANS_ACHEVEMENT.has(moduleName) && moduleName !== 'mapmodules';
}

/**
 * L'identifiant de l'élément de note d'une activité, lu dans son `grades.xml`.
 * @returns {number|null}
 */
export function lireElementDeNote(files, { moduleName, moduleId }) {
    const xml = files[`activities/${moduleName}_${moduleId}/grades.xml`];
    const m = typeof xml === 'string' && xml.match(/<grade_item id="(\d+)">/);
    return m ? Number(m[1]) : null;
}

/**
 * Écrit une condition dans une section encore libre.
 * @throws {Error} si la condition est mal formée ou si la section l'est déjà.
 */
function ecrireCondition(files, sectionId, condition) {
    const defauts = verifierCondition(condition);
    if (defauts.length) throw new Error(`parcours_aiguillage_condition:${defauts.join(' ; ')}`);
    const chemin = `sections/section_${sectionId}/section.xml`;
    const xml = files[chemin];
    if (typeof xml !== 'string') throw new Error(`parcours_aiguillage_section_absente:${sectionId}`);
    const remplace = xml.replace(
        /<availabilityjson>\$@NULL@\$<\/availabilityjson>/,
        `<availabilityjson>${escapeXml(JSON.stringify(condition))}</availabilityjson>`);
    if (remplace === xml) throw new Error(`parcours_aiguillage_section_occupee:${sectionId}`);
    files[chemin] = remplace;
}

/**
 * Pose chemins, étapes communes et fin du parcours.
 *
 * @param {Object<string,string|Uint8Array>} files - Carte de fichiers du constructeur.
 * @param {Object} p
 * @param {Object} p.plan
 * @param {Array<{moduleId:number, sectionId:number, moduleName:string}>} p.activites -
 *        Les activités posées, dans l'ordre des entrées.
 * @param {Array<{carteId?:string}>} p.entrees - Les entrées passées au constructeur.
 * @param {Array<{index:number, etapeId?:string, fin?:boolean}>} p.sectionsPlan -
 *        D'où vient chaque section (`planVersActivites`).
 * @returns {{files:Object, chemins:number, fin:boolean, tests:Array<{moduleName:string, moduleId:number, noteId:number, n:number, bornes:number[]}>}}
 */
export function poserAiguillages(files, { plan, activites, entrees, sectionsPlan }) {
    const sortie = { ...files };
    const sectionDeEtape = new Map(sectionsPlan.filter(s => s.etapeId).map(s => [s.etapeId, sectionIdFor(s.index)]));
    const poseeDeCarte = new Map();
    entrees.forEach((e, i) => { if (e.carteId) poseeDeCarte.set(e.carteId, activites[i]); });
    const aAchevement = new Map();
    for (const a of activites) {
        if (!sAcheve(a.moduleName)) continue;
        if (!aAchevement.has(a.sectionId)) aAchevement.set(a.sectionId, []);
        aAchevement.get(a.sectionId).push(a.moduleId);
    }
    const achevablesDe = etape => aAchevement.get(sectionDeEtape.get(etape.id)) || [];

    const groupes = aiguillagesDuPlan(plan);
    const tests = [];
    let chemins = 0;
    const cheminsDeLaFin = [];
    for (const g of groupes) {
        const test = g.test && poseeDeCarte.get(g.test.id);
        if (!test) throw new Error('parcours_aiguillage_test_absent');
        const noteId = lireElementDeNote(sortie, test);
        if (!noteId) throw new Error('parcours_aiguillage_test_sans_note');
        const k = g.chemins.length;
        const n = nombreQuestions(g.test, k);
        const bornes = bornesEnReponses(g.chemins.slice(1).map(c => c.depuis), n);
        g.chemins.forEach((c, j) => {
            const sectionId = sectionDeEtape.get(c.etape.id);
            // Un chemin sans section laisserait une plage de scores sans suite.
            if (!sectionId) throw new Error(`parcours_aiguillage_chemin_absent:${c.role}`);
            ecrireCondition(sortie, sectionId, conditionChemin(noteId,
                j === 0 ? null : seuilMoodle(bornes[j - 1], n),
                j === k - 1 ? null : seuilMoodle(bornes[j], n)));
            chemins++;
        });
        const achevables = g.chemins.map(c => achevablesDe(c.etape));
        const vide = g.chemins.find((c, j) => !achevables[j].length);
        if (vide) throw new Error(`parcours_aiguillage_chemin_sans_achevement:${vide.role}`);
        cheminsDeLaFin.push(achevables);
        if (g.commune && sectionDeEtape.get(g.commune.etape.id)) {
            ecrireCondition(sortie, sectionDeEtape.get(g.commune.etape.id), conditionApresChemins(achevables));
        }
        // Le chemin se décide sur la PREMIÈRE tentative : refaire le test ne
        // fait plus changer de chemin, et le travail commencé ne disparaît pas.
        if (test.moduleName === 'h5pactivity') {
            const chemin = `activities/h5pactivity_${test.moduleId}/h5pactivity.xml`;
            if (typeof sortie[chemin] === 'string') {
                sortie[chemin] = sortie[chemin].replace(/<grademethod>\d+<\/grademethod>/, '<grademethod>4</grademethod>');
            }
        }
        tests.push({ moduleName: test.moduleName, moduleId: test.moduleId, noteId, n, bornes });
    }

    // La fin du parcours : tout ce que l'élève avait à faire sur SON chemin.
    let fin = false;
    const sectionFin = sectionsPlan.find(s => s.fin);
    if (sectionFin) {
        const communes = (plan.etapes || []).filter(e => !estChemin(e)).flatMap(achevablesDe);
        ecrireCondition(sortie, sectionIdFor(sectionFin.index), conditionFin(communes, cheminsDeLaFin));
        fin = true;
    }
    return { files: sortie, chemins, fin, tests };
}

/**
 * Les chemins sont-ils complets, avant tout assemblage ? Un chemin dont aucune
 * activité n'est prête laisserait une plage de scores sans suite.
 *
 * @param {Object} plan
 * @param {Function} retenue - `(carte) => boolean` : la carte entrera dans le cours.
 * @param {Function} achevable - `(carte) => boolean` : la carte s'achève.
 * @returns {Array<{role:string, etapeId:string, motif:'test'|'chemin'}>}
 */
export function cheminsIncomplets(plan, retenue, achevable) {
    const manques = [];
    for (const g of aiguillagesDuPlan(plan)) {
        if (!g.test || !retenue(g.test)) manques.push({ role: 'test', etapeId: g.etapeTest?.id || '', motif: 'test' });
        for (const c of g.chemins) {
            if (!(c.etape.cartes || []).some(x => retenue(x) && achevable(x))) {
                manques.push({ role: c.role, etapeId: c.etape.id, motif: 'chemin' });
            }
        }
    }
    return manques;
}
