/**
 * Détermine si la demande porte explicitement sur l'apprentissage d'une langue.
 *
 * La langue de l'interface ne suffit pas : « professeur d'anglais » dans une
 * interface française doit produire du contenu élève en anglais. À l'inverse,
 * « professeur d'histoire — la Révolution anglaise » reste en français.
 * Ce module ne traduit aucun contenu ; il ajoute seulement une consigne explicite
 * au modèle quand le rôle ou l'objectif désigne sans ambiguïté une langue enseignée.
 */

const LANGUES_ENSEIGNEES = [
    ['English', /\b(?:anglais(?:e)?|english)\b/],
    ['Spanish', /\b(?:espagnol(?:e)?|spanish|espanol)\b/],
    ['German', /\b(?:allemand(?:e)?|german|deutsch)\b/],
    ['Italian', /\b(?:italien(?:ne)?|italian|italiano)\b/],
    ['Portuguese', /\b(?:portugais(?:e)?|portuguese|portugues)\b/],
    ['Dutch', /\b(?:neerlandais(?:e)?|dutch|nederlands)\b/],
    ['Arabic', /\b(?:arabe|arabic)\b/],
    ['Chinese', /\b(?:chinois(?:e)?|chinese)\b/],
    ['Japanese', /\b(?:japonais(?:e)?|japanese)\b/],
    ['Greek', /\b(?:grec(?:que)?|greek)\b/],
    ['Breton', /\b(?:breton(?:ne)?|brezhoneg)\b/],
    ['French', /\b(?:francais(?:e)?|french)\b/],
];

const normaliser = valeur => String(valeur || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ').toLowerCase();

const CADRE_ENSEIGNEMENT = /\b(?:prof(?:esseur|esseure)?|enseign(?:e|er|ant|ante)|teacher|teach(?:ing)?|dnl|section europeenne|cours de langue)\b/;
const OBJECTIF_LANGUE = /\b(?:apprendr(?:e|e)|apprentissage|pratiquer|maitriser|langue vivante|learn(?:ing)?|language learning|practice)\b/;

/**
 * @param {{qui?:string, quoi?:string}} contexte
 * @returns {string|null} nom anglais de la langue, compris sans ambiguïté par le modèle
 */
export function langueEnseignee(contexte = {}) {
    const qui = normaliser(contexte.qui);
    const quoi = normaliser(contexte.quoi);
    const langueDuRole = LANGUES_ENSEIGNEES.find(([, motif]) => motif.test(qui));
    if (langueDuRole && CADRE_ENSEIGNEMENT.test(qui)) return langueDuRole[0];

    const ensemble = `${qui} ${quoi}`;
    if (!OBJECTIF_LANGUE.test(ensemble) && !/\b(?:dnl|section europeenne)\b/.test(ensemble)) return null;
    return LANGUES_ENSEIGNEES.find(([, motif]) => motif.test(ensemble))?.[0] || null;
}

/** Consigne prioritaire ajoutée près du contexte, avant les exemples en français. */
export function consigneLangueEnseignee(contexte = {}) {
    const langue = langueEnseignee(contexte);
    if (!langue) return '';
    return [
        '# MANDATORY OUTPUT LANGUAGE',
        `Write EVERY student-visible text in ${langue}: titles, headings, labels, examples, questions, answers and feedback.`,
        'This requirement overrides the interface language and every example below. Keep JSON keys, identifiers and enum values unchanged.',
    ].join('\n');
}
