/**
 * @file Parcours — la page « Bilan du parcours », dans la fin du parcours (D112).
 *
 * Retour de Gauthier (1er oct. 2026) : « pour chaque parcours, une page de fin pour
 * conclure le parcours, un peu un bilan ». Elle s'ajoute à l'étiquette « Bravo » de
 * la dernière section (D96), qui reste en place : l'étiquette félicite et ouvre la
 * suite, la page fait le point.
 *
 * Elle se COMPOSE à partir du plan, sans appel au modèle : l'objectif du parcours,
 * ce que chaque étape commune a travaillé et où le retrouver, les notions pivots.
 * Rien à générer, donc rien qui puisse échouer ni inventer ; l'enseignant la
 * retouche sur la plateforme comme n'importe quelle page.
 *
 * Ses textes sont IMPERSONNELS — ni « tu » ni « vous », ni élève ni stagiaire : une
 * même phrase sert les trois plateformes (D105) sans variante à rédiger.
 *
 * Deux sortes d'étapes n'entrent pas dans « Faire le point » :
 *   - celles d'un CHEMIN : chacun n'en a suivi qu'un, les autres lui restent
 *     fermés, et « où le revoir » renverrait à une section qu'il ne voit pas ;
 *   - celle qui ne contient que le test d'aiguillage : il ne se repasse pas (une
 *     seule tentative, D93).
 *
 * Module pur : le dictionnaire est passé par l'appelant, pour le banc Node.
 *
 * @module parcours/bilan
 */

import { aiguillagesDuPlan, aDesChemins, estChemin } from './aiguillage.js';

/** Les modules dont le contenu peut porter un thème de Page. */
const MODULES_A_THEME = new Set(['Page', 'Livre']);

/**
 * Le contenu de la page de bilan, au format d'une Page de Caramel
 * (`{ title, intro, blocks }`).
 *
 * @param {Object} plan
 * @param {Object} o
 * @param {(cle:string) => (string|undefined)} o.texte - Le dictionnaire de la langue.
 * @param {(carte:Object) => boolean} [o.retenue] - La carte est entrée dans le cours
 *        (une étape dont aucune carte n'a abouti n'a pas de section où revenir).
 * @returns {{title:string, intro:string, blocks:Array<{type:string, data:Object}>, theme?:string}|null}
 *          `null` quand le plan n'a rien à faire relire (ni objectif, ni étape, ni notion).
 */
export function contenuDuBilan(plan, { texte, retenue = () => true }) {
    const tx = (cle, defaut) => String((texte && texte(cle)) || defaut);
    const etapes = Array.isArray(plan && plan.etapes) ? plan.etapes : [];
    const tests = new Set(aiguillagesDuPlan(plan).map(g => g.test).filter(Boolean));

    const objectif = String(plan && plan.objectifGeneral || '').trim();
    const notions = (Array.isArray(plan && plan.notionsPivots) ? plan.notionsPivots : [])
        .map(n => String(n || '').trim()).filter(Boolean);

    // « Faire le point » : une ligne par étape commune, le nom de sa section en
    // regard — celui que l'assemblage lui donne (`planVersActivites`).
    const lignes = [];
    etapes.forEach((etape, i) => {
        if (estChemin(etape)) return;
        const cartes = (Array.isArray(etape.cartes) ? etape.cartes : []).filter(retenue);
        if (!cartes.length || cartes.every(c => tests.has(c))) return;
        // Un plan parti du modèle n'a d'objectif que si l'enseignant l'écrit : la
        // ligne reprend alors ceux de ses activités, ou leurs titres.
        const deSesCartes = champ => cartes.filter(c => !tests.has(c)).map(champ)
            .map(x => String(x || '').trim()).filter(Boolean).join(' · ');
        const travaille = String(etape.objectif || '').trim()
            || deSesCartes(c => c.objectif) || deSesCartes(c => c.titre || (c.contenu && c.contenu.title));
        if (!travaille) return;
        const section = String(etape.titre || '').trim() || tx('parcours_fiche_etape', 'Étape @n').split('@n').join(String(i + 1));
        lignes.push([travaille, section]);
    });

    if (!objectif && !lignes.length && !notions.length) return null;

    const titre = tx('parcours_bilan_titre', 'Bilan du parcours');
    const blocks = [{
        type: '#01_hero_header',
        data: { title: titre, subtitle: String(plan && plan.titre || '').trim() },
    }];

    const encadres = [];
    if (objectif) encadres.push({ type: 'objectif', text: objectif });
    if (aDesChemins(plan)) {
        encadres.push({ type: 'savoir', text: tx('parcours_bilan_chemins',
            'Après le test, le parcours s’est poursuivi sur le chemin adapté au résultat obtenu.') });
    }
    if (encadres.length) {
        blocks.push({ type: '#04_callout_set', data: { title: tx('parcours_bilan_objectif', 'L’objectif du parcours'), callouts: encadres } });
    }

    if (lignes.length) {
        blocks.push({
            type: '#10_table_comparison',
            data: {
                title: tx('parcours_bilan_point', 'Faire le point'),
                headers: [tx('parcours_bilan_col_travaille', 'Ce qui a été travaillé'), tx('parcours_bilan_col_revoir', 'Où le revoir')],
                rows: lignes,
            },
        });
    }

    if (notions.length) {
        blocks.push({ type: '#07_glossary_chips', data: { title: tx('parcours_bilan_notions', 'Les mots à retenir'), chips: notions } });
    }

    if (lignes.length) {
        blocks.push({
            type: '#12_context_paragraphs',
            data: {
                title: tx('parcours_bilan_suite_titre', 'Pour consolider'),
                paragraphs: [tx('parcours_bilan_suite',
                    'Un point reste fragile ? Les activités de l’étape indiquée restent accessibles : il suffit d’y revenir.')],
            },
        });
    }

    // Le thème des Pages du parcours, s'il en a un : le bilan leur ressemble.
    const theme = etapes.flatMap(e => e.cartes || [])
        .map(c => MODULES_A_THEME.has(c.module) && c.contenu && c.contenu.theme)
        .find(th => typeof th === 'string' && th);

    return { title: titre, intro: '', blocks, ...(theme ? { theme } : {}) };
}
