/**
 * @file Parcours — la durée de chaque activité, écrite dans le cours (D97).
 *
 * Demande de Gauthier (sept. 2026) : l'élève doit savoir, avant d'ouvrir une
 * activité, combien de temps elle lui prendra. La durée posée sur chaque carte du
 * plan est donc écrite EN TÊTE DE LA DESCRIPTION de l'activité, et la description
 * est affichée sous l'activité dans la page du cours (`showdescription`).
 *
 * Posée après l'assemblage, comme l'ouverture progressive et les chemins : le
 * constructeur de cours, partagé avec La Sucrerie, n'a pas à connaître la durée
 * d'une carte. On retrouve chaque activité par l'ordre des entrées, que le
 * constructeur conserve (une activité posée par entrée reçue).
 *
 * Les textes (accueil, introductions, fin) ne portent pas de durée : ce ne sont
 * pas des activités.
 *
 * @module parcours/durees-cours
 */

import { escapeXml } from '../moodle/moodle-formats.js';
import { translations } from '../core/translation.js';
import { formaterDuree } from './duree.js';

/** Échappe pour du HTML (la description est du HTML, puis échappée en XML). */
function html(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * La phrase de durée d'une activité : « Durée estimée : 10 min ».
 * @param {number} minutes
 */
export function phraseDuree(minutes) {
    // `translations` et non `t()` : `t()` rend la CLÉ quand la traduction manque.
    return (translations.parcours_duree_activite || 'Durée estimée : @d').split('@d').join(formaterDuree(minutes));
}

/**
 * Écrit la durée dans la description de chaque activité issue d'une carte.
 *
 * @param {Object<string,string|Uint8Array>} files
 * @param {Object} p
 * @param {Array<{moduleId:number, moduleName:string}>} p.activites - Posées, dans l'ordre des entrées.
 * @param {Array<{duree?:number}>} p.entrees - Les entrées passées au constructeur.
 * @returns {{files:Object, n:number}} `n` : activités qui ont reçu leur durée.
 */
export function poserDurees(files, { activites, entrees }) {
    const sortie = { ...files };
    let n = 0;
    entrees.forEach((entree, i) => {
        const minutes = Number(entree && entree.duree);
        const a = activites[i];
        if (!a || !Number.isFinite(minutes) || minutes <= 0) return;
        const dossier = `activities/${a.moduleName}_${a.moduleId}`;
        const cheminActivite = `${dossier}/${a.moduleName}.xml`;
        const xml = sortie[cheminActivite];
        if (typeof xml !== 'string') return;
        const ligne = escapeXml(`<p>${html(phraseDuree(minutes))}</p>`);
        // La PREMIÈRE <intro> du fichier est celle de l'activité elle-même.
        const remplace = xml.replace(/<intro>([\s\S]*?)<\/intro>|<intro\/>/, (tout, existant) => {
            const reste = existant && existant !== '$@NULL@$' ? existant : '';
            return `<intro>${ligne}${reste}</intro>`;
        });
        if (remplace === xml) return;
        sortie[cheminActivite] = remplace;
        const module = sortie[`${dossier}/module.xml`];
        if (typeof module === 'string') {
            sortie[`${dossier}/module.xml`] = module.replace(/<showdescription>0<\/showdescription>/, '<showdescription>1</showdescription>');
        }
        n++;
    });
    return { files: sortie, n };
}
