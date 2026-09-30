/**
 * @file Parcours — la fiche de séquence, en DOCX, ODT ou PDF.
 *
 * Le document que l'enseignant colle dans son cahier de textes, glisse dans son
 * classeur, ou transmet à un collègue qui reprendra la classe. Ce n'est **pas**
 * le contenu des activités — celui-là part sur la plateforme dans le `.mbz`, et
 * s'exporte à part (« le détail des activités »). C'est le PLAN : où va la
 * séquence, en combien d'étapes, avec quoi, et pour combien de temps.
 *
 * **Ce fichier ne fabrique pas de document, il fabrique une DESCRIPTION.** Le
 * rendu appartient à `export/document-exporter.js`, partagé avec La Sucrerie et
 * byte-identique des deux côtés. On lui passe un objet autodescriptif — titres,
 * puces et tableaux déjà rédigés dans la langue de l'interface — que son
 * formateur `parcours_document` rend mécaniquement. Le partage y gagne : les
 * traductions ne voyagent pas avec un `.js`, et un formateur qui connaîtrait le
 * vocabulaire du parcours obligerait à traduire des dizaines de libellés dans un
 * dépôt qui ne produit pas de parcours.
 *
 * **Une étape, un bloc, un petit tableau** — plutôt qu'un grand tableau unique
 * couvrant tout le parcours. Un enseignant lit sa séquence étape par étape, et
 * l'objectif d'une étape a besoin d'être écrit en toutes lettres au-dessus de
 * ses activités, pas serré dans une cellule. C'est aussi ce qui reste lisible
 * une fois le PDF ouvert sur un téléphone.
 *
 * @module parcours/fiche-sequence
 */

import { t } from '../core/translation.js';
import { CONFIG } from './config.js';
import { nomModule } from './activity-router.js';
import { carteDisponible } from './carte-progression.js';
import { formaterDuree } from './duree.js';
import { MODULES_PARCOURS } from './modules-parcours.js';
import { contenuPourEdition } from './sources.js';
import { imagesEnvoyeesPourDocument } from '../moodle/page-images.js';
import {
    aiguillagesDuPlan, nombreQuestions, bornesEnReponses, plagesEnReponses, dureeParEleve, activitesParEleve,
} from './aiguillage.js';

/** Substitution de jetons, à l'identique des écrans de l'atelier. */
function tr(cle, jetons) {
    let s = t(cle);
    if (jetons) for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/**
 * « 1 h 25 » plutôt que « 85 min » dès qu'on dépasse l'heure — l'écriture
 * commune de `duree.js`, qui ne dépend d'aucun écran : la fiche s'exporte
 * sans eux. (Un doublon local vivait ici tant que ce module n'existait pas.)
 */
const duree = formaterDuree;

/** Nom lisible de la plateforme visée. */
function nomPlateforme(platformId) {
    const p = (CONFIG.platforms || []).find(x => x.id === platformId);
    return p ? (t(p.nameKey) || p.moduleFilter || p.id) : String(platformId || '');
}

/**
 * Construit la description documentaire de la fiche.
 *
 * PURE : aucun accès au DOM, aucun chargement de bibliothèque. C'est ce qui
 * permet de la vérifier dans un banc sans navigateur, et de voir ce que le
 * document dira sans avoir à l'ouvrir.
 *
 * @param {Object} plan - Le plan normalisé.
 * @param {Object} [options]
 * @param {string} [options.platformId] - Pour nommer la plateforme visée.
 * @returns {Object} L'objet attendu par le formateur `parcours_document`.
 */
export function construireFiche(plan, { platformId } = {}) {
    const p = plan && typeof plan === 'object' ? plan : {};
    const etapes = Array.isArray(p.etapes) ? p.etapes : [];
    const cartes = etapes.flatMap(e => (Array.isArray(e.cartes) ? e.cartes : []));
    const total = cartes.reduce((s, c) => s + (Number(c.duree) || 0), 0);

    // Les deux réglages de parcours entrent dans l'en-tête, parce qu'ils changent
    // ce que la classe VIVRA : un enseignant qui relit sa fiche sur papier doit
    // savoir que l'étape 2 ne s'ouvrira pas avant que l'étape 1 soit faite. Sans
    // eux, le papier et le cours diraient deux choses différentes.
    const carteActive = Boolean(p.carte && p.carte.actif) && carteDisponible(platformId);
    const progressionActive = Boolean(p.progression && p.progression.actif) && etapes.length >= 2;

    // Avec des chemins, l'en-tête dit ce que vit UN élève — ses activités, sa
    // durée — et selon quel test (D90) : additionner les chemins annoncerait une
    // séquence que personne ne suit. Pas de Carte de progression avec des chemins (D95).
    const groupes = aiguillagesDuPlan(p);
    const fourchette = ({ min, max }, f = String) => (min === max ? f(max) : `${f(min)}–${f(max)}`);
    const titreTest = g => (g.test ? String(g.test.titre || '').trim() || nomModule(g.test.module) : '');
    const meta = (groupes.length ? [
        platformId ? nomPlateforme(platformId) : '',
        ...groupes.map(g => tr('parcours_fiche_meta_chemins', { k: String(g.chemins.length), t: titreTest(g) })),
        tr('parcours_fiche_meta_par_eleve', { e: fourchette(activitesParEleve(p)), f: String(cartes.length) }),
        tr('parcours_fiche_meta_duree_eleve', { d: fourchette(dureeParEleve(p), duree) }),
        progressionActive ? t('parcours_fiche_meta_progression') : '',
    ] : [
        platformId ? nomPlateforme(platformId) : '',
        tr('parcours_fiche_meta_etapes', { n: String(etapes.length) }),
        tr('parcours_fiche_meta_activites', { n: String(cartes.length) }),
        duree(total),
        carteActive ? t('parcours_fiche_meta_carte') : '',
        progressionActive ? t('parcours_fiche_meta_progression') : '',
    ]).filter(Boolean);

    const sections = [];

    // Les notions pivots : ce que la séquence travaille vraiment, et ce qui a
    // été injecté dans chaque génération. C'est le premier repère qu'on relit.
    const notions = Array.isArray(p.notionsPivots) ? p.notionsPivots.filter(Boolean) : [];
    if (notions.length) {
        sections.push({ titre: t('parcours_fiche_notions'), puces: notions });
    }

    const enTetes = [
        t('parcours_fiche_col_activite'),
        t('parcours_fiche_col_type'),
        t('parcours_fiche_col_palier'),
        t('parcours_fiche_col_duree'),
    ];

    // Les étapes communes sont numérotées comme à l'écran du plan ; un chemin
    // porte le nom de son rôle et dit à quels élèves il s'ouvre, en bonnes
    // réponses au test — jamais en pourcentage.
    let numero = 0;
    etapes.forEach((etape) => {
        const titreEtape = String(etape.titre || '').trim();
        const g = groupes.find(x => x.chemins.some(c => c.etape === etape));
        const chemin = g && g.chemins.find(c => c.etape === etape);
        let titreBloc;
        if (chemin) {
            const role = t(`parcours_role_${chemin.role}`);
            titreBloc = titreEtape ? tr('parcours_fiche_chemin', { r: role, t: titreEtape }) : tr('parcours_fiche_chemin_seul', { r: role });
        } else {
            numero += 1;
            titreBloc = titreEtape
                ? tr('parcours_fiche_etape_titree', { n: String(numero), t: titreEtape })
                : tr('parcours_fiche_etape', { n: String(numero) });
        }
        const bloc = { titre: titreBloc, lignes: [] };
        if (chemin && g.test) {
            const n = nombreQuestions(g.test, g.chemins.length);
            const [de, a] = plagesEnReponses(bornesEnReponses(g.chemins.slice(1).map(c => c.depuis), n), n)[g.chemins.indexOf(chemin)];
            const plage = de === a ? tr('parcours_plage_une', { de, n }) : tr('parcours_plage', { de, a, n });
            bloc.lignes.push(tr('parcours_fiche_chemin_pour', { p: plage, t: titreTest(g) }));
        }
        const objectif = String(etape.objectif || '').trim();
        if (objectif) bloc.lignes.push(tr('parcours_fiche_objectif', { t: objectif }));

        const lignes = (Array.isArray(etape.cartes) ? etape.cartes : []).map(c => ([
            String(c.titre || '').trim() || nomModule(c.module),
            nomModule(c.module),
            t(`parcours_palier_${c.palier}`) || String(c.palier || ''),
            duree(c.duree),
        ]));
        if (lignes.length) bloc.table = { headers: enTetes, rows: lignes };
        // Une étape sans activité se dit : c'est un trou dans la séquence, et
        // l'enseignant doit le voir sur le papier comme il le voit à l'écran.
        else bloc.lignes.push(t('parcours_fiche_etape_vide'));

        sections.push(bloc);
    });

    // Le mot de la fin, lu par l'élève dans la dernière section du cours (D96).
    const conclusion = String(p.conclusion || '').trim();
    if (conclusion) sections.push({ titre: t('parcours_fin_titre'), lignes: [conclusion] });

    // Les consignes, à la fin : elles ne se lisent pas dans un tableau, mais
    // elles sont ce que l'élève aura sous les yeux. Un enseignant qui prépare
    // veut les relire d'un bloc.
    const consignes = cartes
        .map(c => ({ titre: String(c.titre || '').trim(), texte: String(c.consigne || '').trim() }))
        .filter(x => x.texte);
    if (consignes.length) {
        sections.push({
            titre: t('parcours_fiche_consignes'),
            puces: consignes.map(x => (x.titre ? `${x.titre} — ${x.texte}` : x.texte)),
        });
    }

    return {
        title: String(p.titre || '').trim() || t('parcours_fiche_sans_titre'),
        intro: String(p.objectifGeneral || '').trim(),
        meta,
        sections,
    };
}

/**
 * Le cours documentaire : une « activité » par carte remplie.
 *
 * C'est l'autre document, celui qui porte le CONTENU — énoncés, distracteurs,
 * corrigés. Il se fabrique avec le pipeline existant (`exportCourseTo*`), sans
 * une ligne de rendu nouvelle : chaque carte a déjà un `module` et un `contenu`,
 * qui sont exactement le `moduleKey` et le `jsonData` qu'il attend.
 *
 * Les cartes sans contenu généré sont écartées : un chapitre vide dans un
 * document imprimé est pire qu'un chapitre absent.
 *
 * @param {Object} plan
 * @returns {{title:string, description:string, activities:Array}}
 */
/**
 * Un module de la PLATEFORME (forum, questionnaire, leçon, atelier…) mis en
 * forme de Page pour le document.
 *
 * Le formateur documentaire, partagé avec la Sucrerie, ne connaît pas ces
 * modules : il les rendait par son repli générique, c'est-à-dire en JSON brut
 * (constaté le 28 sept. 2026). On lui donne donc ce qu'il sait rendre — une Page
 * (`formatPage`) : le type du module et sa consigne en tête, puis un bloc par
 * champ, titré de son libellé de retouche. Questions et pages passent en lignes
 * lisibles (○ une réponse, ☐ plusieurs, ✓ la bonne), les listes une par ligne.
 *
 * @param {Object} carte
 * @returns {{title:string, intro:string, blocks:Array}}
 */
export function pageDocumentaire(carte) {
    const def = MODULES_PARCOURS[carte.module];
    const contenu = carte.contenu || {};
    const titre = String(carte.titre || contenu.title || '').trim() || nomModule(carte.module);
    const blocs = [];
    const bloc = (titreBloc, paragraphes) => {
        const lignes = paragraphes.map(x => String(x ?? '').trim()).filter(Boolean);
        if (lignes.length) blocs.push({ type: '#12_context_paragraphs', data: { title: titreBloc, paragraphs: lignes } });
    };
    bloc(t(def.nameKey), [t(def.descKey)]);
    if (carte.source?.type === 'lien' && carte.source.url) bloc(t('parcours_source_lien_label'), [carte.source.url]);
    for (const champ of Object.keys(def.champs)) {
        if (champ === 'title' || champ === 'intro') continue;
        const valeur = contenu[champ];
        if (valeur == null || valeur === '') continue;
        const format = def.structures?.[champ];
        const lignes = format ? format.versLignes(valeur)
            : Array.isArray(valeur) ? valeur : String(valeur).split(/\n+/);
        // Le libellé de retouche porte parfois un mode d'emploi (« un par ligne,
        // 50 caractères max ») : utile dans le formulaire, du bruit sur papier.
        bloc(t(`parcours_mod_champ_${champ}`).split(/[,(（，]/)[0].trim(), lignes);
    }
    return { title: titre, intro: String(contenu.intro || ''), blocks: blocs };
}

export function construireCoursDocumentaire(plan) {
    const p = plan && typeof plan === 'object' ? plan : {};
    const activities = (Array.isArray(p.etapes) ? p.etapes : [])
        .flatMap(e => (Array.isArray(e.cartes) ? e.cartes : []))
        .filter(c => c && c.contenu)
        .map(c => (MODULES_PARCOURS[c.module] ? {
            // Module de la plateforme : rendu comme une Page (cf. pageDocumentaire).
            moduleKey: 'Page',
            jsonData: pageDocumentaire(c),
            title: String(c.titre || '').trim() || nomModule(c.module),
        } : {
            moduleKey: c.module,
            jsonData: c.medias?.[c.contenu.image?.path]
                ? { ...c.contenu, _backgroundImage: c.medias[c.contenu.image.path] }
                // Page, Livre : les images envoyées prennent la place de l'adresse du bloc.
                : (c.medias && (c.module === 'Page' || c.module === 'Livre'))
                    ? imagesEnvoyeesPourDocument(contenuPourEdition(c)) : c.contenu,
            title: String(c.titre || '').trim() || nomModule(c.module),
        }));
    return {
        title: String(p.titre || '').trim() || t('parcours_fiche_sans_titre'),
        description: String(p.objectifGeneral || '').trim(),
        activities,
    };
}

/**
 * Exporte la fiche de séquence.
 *
 * @param {Object} plan
 * @param {'docx'|'odt'|'pdf'} format
 * @param {Object} [options] - `{ platformId }`
 * @returns {Promise<void>}
 * @throws {Error} `parcours_fiche_format_inconnu:<format>`
 */
export async function exporterFiche(plan, format, options = {}) {
    const fiche = construireFiche(plan, options);
    const { exportToDOCX, exportToODT, exportToPDF } = await import('../export/document-exporter.js');
    const sorties = { docx: exportToDOCX, odt: exportToODT, pdf: exportToPDF };
    const sortie = sorties[format];
    if (!sortie) throw new Error(`parcours_fiche_format_inconnu:${format}`);
    // Le moduleKey vaut ici « quel formateur employer », pas « quelle activité » :
    // c'est le rendu autodescriptif de `document-formatter.js`.
    await sortie('parcours_document', fiche);
}

/**
 * Exporte le détail des activités générées.
 *
 * @param {Object} plan
 * @param {'docx'|'odt'|'pdf'} format
 * @returns {Promise<void>}
 * @throws {Error} `parcours_fiche_format_inconnu:<format>` ou `parcours_fiche_rien_a_exporter`
 */
export async function exporterDetail(plan, format) {
    const cours = construireCoursDocumentaire(plan);
    if (!cours.activities.length) throw new Error('parcours_fiche_rien_a_exporter');
    const { exportCourseToDOCX, exportCourseToODT, exportCourseToPDF } =
        await import('../export/document-exporter.js');
    const sorties = { docx: exportCourseToDOCX, odt: exportCourseToODT, pdf: exportCourseToPDF };
    const sortie = sorties[format];
    if (!sortie) throw new Error(`parcours_fiche_format_inconnu:${format}`);
    await sortie(cours);
}

/** Les formats proposés, dans l'ordre où ils s'affichent. */
export const FORMATS = Object.freeze([
    { id: 'docx', labelKey: 'parcours_fiche_docx', icone: 'fa-file-word' },
    { id: 'odt', labelKey: 'parcours_fiche_odt', icone: 'fa-file-lines' },
    { id: 'pdf', labelKey: 'parcours_fiche_pdf', icone: 'fa-file-pdf' },
]);
