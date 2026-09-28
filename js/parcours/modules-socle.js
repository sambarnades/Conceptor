/**
 * @file Parcours — le socle XML commun aux modules que le parcours pose.
 *
 * Ce qui est ici ne dépend d'aucun module : l'identifiant neutre, le nom
 * d'activité ramené sous son plafond, le texte de l'enseignant rendu en HTML
 * sûr, la fiche `module.xml` et l'enveloppe `<activity>`. Deux registres s'en
 * servent — `modules-parcours.js` (les premiers modules, et le registre
 * lui-même) et `modules-natifs.js` (les modules ouverts le 27 sept. 2026) —, et
 * la Carte de progression aussi. Le séparer évite que ces fichiers s'importent
 * l'un l'autre.
 *
 * @module parcours/modules-socle
 */

import { escapeXml } from '../moodle/moodle-formats.js';
import { formatTextToHtml } from '../core/utils.js';

/**
 * Identifiant d'activité posé dans le XML fabriqué ici.
 *
 * Sa valeur n'a aucune importance : `renumberActivity` réécrit tous les
 * identifiants de niveau cours dans l'espace haut déterministe du constructeur.
 * On en pose donc un, lisible, et on n'y pense plus.
 */
export const ID = 1;

/**
 * Longueur maximale du nom d'une activité.
 *
 * `char(255)` sur les cinq modules que le parcours pose — c'est la largeur que
 * le noyau Moodle donne partout, et que les deux greffons reprennent. Bien plus
 * confortable que les 20 caractères d'un titre de colonne, donc jamais atteinte
 * en pratique ; le plafond est là parce que le mode d'échec est le même et qu'il
 * est brutal : pas une troncature, un import de cours perdu à mi-chemin.
 */
const MAX_NOM_ACTIVITE = 255;

/**
 * Ramène un titre à `max` caractères sans couper un mot en deux quand c'est
 * évitable — on recule au dernier espace, sauf s'il ne reste presque rien.
 *
 * La troncature est un FILET, pas le correctif : le prompt annonce la limite au
 * modèle, et le formulaire de retouche la porte aussi. Elle n'existe que pour
 * qu'un titre trop long raccourcisse au lieu de faire échouer tout un import.
 */
export function tronquer(texte, max) {
    const t = String(texte || '').trim();
    if (t.length <= max) return t;
    const coupe = t.slice(0, max);
    const espace = coupe.lastIndexOf(' ');
    return (espace >= max * 0.6 ? coupe.slice(0, espace) : coupe).trim();
}

/** Le nom d'activité, ramené sous le plafond de la colonne `name`. */
export function nom(titre) {
    return escapeXml(tronquer(titre, MAX_NOM_ACTIVITE));
}

/**
 * Le gras d'un terme, à sa PREMIÈRE apparition seulement.
 *
 * Le modèle met en gras chaque occurrence des notions du parcours — jusqu'à
 * cinq « **RGPD** » dans une même page d'un parcours réel (28 sept. 2026) :
 * le gras ne signale plus rien. La règle typographique d'un manuel : on marque
 * le terme la première fois qu'on le rencontre, pas les suivantes.
 */
export function grasUneFois(texte) {
    const vus = new Set();
    return String(texte || '').replace(/\*\*([^*\n]+?)\*\*/g, (tout, terme) => {
        const cle = terme.trim().toLowerCase();
        if (vus.has(cle)) return terme;
        vus.add(cle);
        return tout;
    });
}

/** Le texte de l'enseignant, en HTML sûr pour Moodle. */
export function html(texte) {
    return escapeXml(formatTextToHtml(grasUneFois(texte)));
}

/* ------------------------------------------------------------------ *
 *  Les fabriques de dossier d'activité
 * ------------------------------------------------------------------ */

/**
 * `module.xml` — la fiche de pose de l'activité dans sa section.
 *
 * Les identifiants et le numéro de section sont réécrits par
 * `renumberActivity` ; on pose des valeurs neutres. `completion: 2` +
 * `completionview: 1` = « terminé quand l'élève a consulté », ce qui est le
 * comportement attendu d'un module qu'on ne note pas.
 *
 * `showdescription` reste à 0 pour tous les modules du registre : leur
 * description est une consigne, et une consigne se lit dans l'activité. Un
 * seul consommateur le passe à 1 — la Carte de progression, dont la
 * description N'EST PAS un texte mais la carte elle-même : elle doit se voir
 * DANS la page du cours, sans qu'on clique (cf. `carte-progression.js`).
 *
 * Exporté avec `activiteXml`, `nom`, `html` et `ID` parce que la Carte de
 * progression pose une activité au même format sans être un module du
 * registre : elle n'a pas de contenu à faire écrire au modèle et ne doit
 * jamais entrer dans la palette du plan.
 */
export function moduleXml(moduleName, timestamp, {
    completionview = 1,
    completionPropre = false,
    showdescription = 0,
    visible = 1,
} = {}) {
    // `completionPropre` : l'activité porte SON critère d'achèvement dans son
    // propre XML (`completionwords`, `completionstickynotes`…). Moodle attend
    // alors `completion: 2` AVEC `completionview: 0` — relevé tel quel sur
    // l'export authentique. Marquer « consulté » à la place viderait le critère
    // de son sens : l'activité serait terminée sans que l'élève ait rien écrit.
    const completion = completionPropre || completionview ? 2 : 0;
    return `<?xml version="1.0" encoding="UTF-8"?>
<module id="${ID}">
  <modulename>${moduleName}</modulename>
  <sectionid>${ID}</sectionid>
  <sectionnumber>0</sectionnumber>
  <idnumber></idnumber>
  <added>${timestamp}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>${visible}</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>${visible}</visibleold>
  <groupmode>0</groupmode>
  <groupingid>0</groupingid>
  <completion>${completion}</completion>
  <completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>${completionview}</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>${showdescription}</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`;
}

/** Enveloppe `<activity>` commune. */
export function activiteXml(moduleName, corps) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<activity id="${ID}" moduleid="${ID}" modulename="${moduleName}" contextid="${ID}">
${corps}
</activity>`;
}

/**
 * Une graine stable tirée du contenu d'une activité.
 *
 * Les identifiants IMBRIQUÉS (questions, choix, pages, critères, colonnes…) ne
 * sont pas réécrits par `renumberActivity`, qui ne connaît que l'identifiant
 * d'activité. Or deux questionnaires du même cours qui numéroteraient tous deux
 * leurs questions 1, 2, 3 se marcheraient dessus dans la table de
 * correspondance de la restauration (`backup_ids_temp`). On décale donc chaque
 * activité dans son propre bloc, calculé sur son contenu : deux contenus
 * différents ne partagent (presque) jamais de bloc, et le même contenu donne
 * toujours le même fichier — le banc de déterminisme y tient.
 *
 * @param {*} donnees
 * @returns {number} Un multiple de 1000, entre 100 000 et 999 000 000.
 */
export function graine(donnees) {
    return 100000 + (empreinte(JSON.stringify(donnees ?? null)) % 999000) * 1000;
}

/** FNV-1a 32 bits : assez pour disperser, sans prétention cryptographique. */
function empreinte(texte, sel = 0x811c9dc5) {
    let h = sel >>> 0;
    for (let i = 0; i < texte.length; i++) {
        h ^= texte.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

/**
 * Une chaîne hexadécimale de `n` caractères, stable pour un même contenu.
 * Sert aux identifiants que Moodle attend opaques (salle de classe virtuelle).
 */
export function hexa(donnees, n = 40) {
    const base = JSON.stringify(donnees ?? null);
    let sortie = '';
    for (let sel = 1; sortie.length < n; sel++) {
        sortie += empreinte(base, 0x811c9dc5 ^ Math.imul(sel, 0x9e3779b1)).toString(16).padStart(8, '0');
    }
    return sortie.slice(0, n);
}

/** Même idée, en lettres et chiffres (mots de passe de salle, jamais saisis). */
export function jeton(donnees, n = 12) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const hex = hexa(donnees, n * 2);
    let sortie = '';
    for (let i = 0; i < n; i++) sortie += alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
    return sortie;
}
