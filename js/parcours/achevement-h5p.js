/**
 * @file Parcours — l'achèvement des H5P qui ne rendent jamais de note (D100).
 *
 * Le constructeur de cours pose sur TOUT H5P l'achèvement « recevoir une note »
 * (`completiongradeitemnumber` 0). Or `mod_h5pactivity` ne note une tentative que
 * si l'activité lui envoie un résultat « terminé » ; recensement du 30 sept. 2026
 * dans le code des bibliothèques et de Moodle 5.1 :
 *
 *   - JAMAIS : Frise (Timeline), Glossaire (Accordion), Cartes de dialogue,
 *     Graphique, Image interactive (aucun résultat envoyé) ; Synthèse et Choix
 *     unique en série (le résultat conservé par Moodle ne porte pas « terminé ») ;
 *     Vidéo interactive telle que Caramel la génère (sans écran de fin) ;
 *   - SOUS CONDITION : Présentation de cours et Livre interactif, seulement s'ils
 *     contiennent des exercices ET que l'élève va jusqu'au bilan puis l'envoie.
 *
 * Achevés « à la note », ils ne s'achèvent donc jamais : une étape suivante, un
 * bilan ou une fin de parcours qui les attendent ne s'ouvriraient pour personne.
 * Ils passent ici à l'achèvement À LA CONSULTATION (`completionview`), que
 * `mod_h5pactivity` accepte (`FEATURE_COMPLETION_TRACKS_VIEWS`). La note, quand
 * il y en a une, continue d'arriver au carnet ; elle ne conditionne plus rien.
 *
 * Posé après l'assemblage, comme le reste du parcours : le constructeur est
 * partagé avec La Sucrerie et ne sait rien des cartes.
 *
 * @module parcours/achevement-h5p
 */

/** Les types H5P de Caramel achevés à la consultation, et non à la note. */
export const H5P_ACHEVES_A_LA_CONSULTATION = Object.freeze(new Set([
    'Timeline', 'Glossary', 'DialogCards', 'Chart', 'ImageHotspots',
    'Summary', 'SingleChoiceSet', 'InteractiveVideo',
    'CoursePresentation', 'InteractiveBook',
]));

/**
 * Passe à l'achèvement par consultation les H5P qui ne rendent pas de note.
 *
 * @param {Object<string,string|Uint8Array>} files
 * @param {Object} p
 * @param {Array<{moduleId:number, moduleName:string}>} p.activites - Posées, dans l'ordre des entrées.
 * @param {Array<{module?:string}>} p.entrees - Les entrées du constructeur (clé de module de la carte).
 * @returns {{files:Object, n:number}}
 */
export function poserAchevementsH5P(files, { activites, entrees }) {
    const sortie = { ...files };
    let n = 0;
    entrees.forEach((entree, i) => {
        const a = activites[i];
        if (!a || a.moduleName !== 'h5pactivity' || !H5P_ACHEVES_A_LA_CONSULTATION.has(entree && entree.module)) return;
        const chemin = `activities/h5pactivity_${a.moduleId}/module.xml`;
        const xml = sortie[chemin];
        if (typeof xml !== 'string') return;
        const remplace = xml
            .replace(/<completiongradeitemnumber>0<\/completiongradeitemnumber>/, '<completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>')
            .replace(/<completionview>0<\/completionview>/, '<completionview>1</completionview>');
        if (remplace === xml) return;
        sortie[chemin] = remplace;
        n++;
    });
    return { files: sortie, n };
}
