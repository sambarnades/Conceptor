/**
 * @file Parcours — assemblage du `.mbz` de cours.
 *
 * Le pont entre le plan de l'atelier et `moodle/mbz-course-builder.js`. Trois
 * choses, et rien d'autre :
 *
 *  1. **Court-circuiter `extractMbz`.** Le constructeur de cours attend, par
 *     activité, la forme `{files, moduleName, activityDir}` — la sortie de
 *     l'extracteur de La Sucrerie, qui décompresse un `.mbz` déposé. Caramel n'a
 *     rien à décompresser : ses processeurs produisent DÉJÀ cette carte de
 *     fichiers en mémoire. Il suffit de la mettre en forme.
 *  2. **Fournir l'identité de Caramel.** Le fichier de construction est partagé
 *     avec La Sucrerie ; un backup fabriqué ici ne doit pas se déclarer venu
 *     d'ailleurs (cf. `IDENTITE_DEFAUT` du constructeur).
 *  3. **Traduire le plan en sections.** Une étape = une section de cours,
 *     ouverte par son texte d'introduction s'il y en a un (D64). La section 0
 *     reçoit le texte d'accueil du parcours et, si l'enseignant l'a demandée,
 *     la **Carte de progression**, qui montre le parcours entier
 *     (`carte-progression.js`).
 *
 * Trois voies d'activité, selon ce que le constructeur sait faire :
 *   • H5P → les octets du `.h5p` vont dans le pool de fichiers du cours, avec
 *     leur empreinte `sha1` ; le constructeur synthétise un `mod_h5pactivity` ;
 *   • Test (`quiz`) → on passe le MODÈLE de la banque de questions, que le
 *     constructeur régénère à la racine du backup (`questions.xml`) ;
 *   • autres modules Moodle → la carte de fichiers du dossier d'activité, que
 *     le constructeur renumérote en place.
 *
 * @module parcours/parcours-builder
 */

import { h5pModules } from '../core/definitions.js';
import { debugLog, horodatageFichier } from '../core/utils.js';
import { mediaFilesPour, contenuPourEdition } from './sources.js';
import { currentLang, translations } from '../core/translation.js';
import {
    assembleCourseFiles,
    hasEmbeddedFiles,
    sectionIdFor,
} from '../moodle/mbz-course-builder.js';
import { typeMoodle } from '../moodle/mono-activity-files.js';
import { nomModule, modulesDisponibles } from './activity-router.js';
import { estModuleParcours, construireActiviteParcours, MODULES_PARCOURS } from './modules-parcours.js';
import { ligneAFaire, recalerModulesDeCours } from './modules-natifs.js';
import { carteAPoser, construireCarteProgression } from './carte-progression.js';
import { joindreFondCarte } from './carte-image.js';
import { joindreFichiersInitiaux } from '../moodle/fichiers-modules.js';
import { progressionAPoser, poserProgression } from './progression.js';

/**
 * Ce que le backup déclare de son origine. Les valeurs par défaut du
 * constructeur sont celles de La Sucrerie : Caramel DOIT fournir les siennes,
 * sans quoi le fichier mentirait sur sa provenance.
 *
 * `siteHash` est un identifiant de site arbitraire mais STABLE : Moodle s'en
 * sert pour distinguer une restauration « même site » d'une restauration
 * « autre site ». Le faire varier d'un parcours à l'autre ferait mentir cette
 * distinction — il est donc constant, et volontairement différent de celui de
 * La Sucrerie.
 */
export const IDENTITE_CARAMEL = Object.freeze({
    wwwroot: 'https://caramel.forge.apps.education.fr/',
    siteHash: 'c1a2e4b60d5f47a8b39c2f8e6d1470b5',
    categorie: 'caramel',
    quizHostname: 'caramel.forge.apps.education.fr',
    journal: 'Parcours généré par Caramel\n',
});

/** Motifs d'exclusion d'une carte — jamais d'omission silencieuse. */
export const MOTIFS = {
    /** La carte n'a pas de contenu généré (fabrication interrompue). */
    sans_contenu: 'sans_contenu',
    /** Le module n'est assemblable par aucune des trois voies. */
    module_non_gere: 'module_non_gere',
    /** Le backup mono-activité embarque des médias (renumérotation non couverte). */
    medias: 'medias',
    /** La fabrication du fichier a échoué. */
    echec: 'echec',
};

/* ------------------------------------------------------------------ *
 *  Empreinte des octets
 * ------------------------------------------------------------------ */

/**
 * Empreinte `sha1` d'un contenu binaire, en hexadécimal minuscule.
 *
 * C'est le `contenthash` de Moodle : le nom du fichier dans le pool
 * (`files/<2 premiers caractères>/<empreinte>`) ET la valeur déclarée dans
 * `files.xml`. Les deux DOIVENT coïncider, sans quoi le restore ne retrouve pas
 * le `.h5p`.
 *
 * @param {Uint8Array} octets
 * @returns {Promise<string>}
 */
export async function empreinteSha1(octets) {
    const sub = globalThis.crypto && globalThis.crypto.subtle;
    if (!sub) {
        // `crypto.subtle` n'existe qu'en contexte sécurisé (https, ou localhost).
        throw new Error('parcours_sha1_indisponible');
    }
    const buf = await sub.digest('SHA-1', octets);
    return Array.from(new Uint8Array(buf)).map(o => o.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ *
 *  Une carte du plan → une activité du constructeur
 * ------------------------------------------------------------------ */

/**
 * Titre d'affichage d'une carte : celui que l'enseignant a écrit dans le plan,
 * à défaut celui que l'IA a posé dans le contenu, à défaut le nom du module.
 */
function titreCarte(carte) {
    const duPlan = String(carte && carte.titre || '').trim();
    if (duPlan) return duPlan;
    const duContenu = carte && carte.contenu && String(carte.contenu.title || '').trim();
    if (duContenu) return duContenu;
    return nomModule(carte && carte.module);
}

/**
 * Met une carte du plan sous la forme attendue par le constructeur de cours.
 *
 * @param {Object} carte - Carte du plan, `carte.contenu` déjà généré et réparé.
 * @returns {Promise<Object>} La forme `extracted` du constructeur.
 * @throws {Error} `parcours_module_non_gere:<module>` si aucune voie ne convient.
 */
export async function activiteDepuisCarte(carte) {
    const moduleKey = carte.module;
    const titre = titreCarte(carte);

    // --- Voie H5P : les octets du .h5p entrent dans le pool de fichiers.
    if (h5pModules[moduleKey]) {
        const { packageActivity } = await import('../core/package-activity.js');
        const paquet = await packageActivity({
            moduleKey,
            content: carte.contenu,
            mediaFiles: mediaFilesPour(carte),
            title: titre,
            lang: currentLang,
        });
        return {
            kind: 'h5p',
            moduleName: 'h5pactivity',
            h5pBytes: paquet.bytes,
            contenthash: await empreinteSha1(paquet.bytes),
            filename: paquet.filename,
            title: titre,
        };
    }

    // --- Voie Test : le constructeur régénère la banque de questions.
    if (moduleKey === 'test_elea') {
        const [{ canonicalizeTestModel }, { healLatexForTest }] = await Promise.all([
            import('../moodle/moodle-formats.js'),
            import('../moodle/moodle-creator.js'),
        ]);
        const modele = canonicalizeTestModel(healLatexForTest(carte.contenu));
        if (!Array.isArray(modele.questions) || !modele.questions.length) {
            throw new Error('parcours_test_sans_question');
        }
        return { kind: 'quiz', moduleName: 'quiz', model: modele, title: titre };
    }

    // --- Voie « module de parcours » : forum, sondage, étiquette. Ces modules
    // n'existent pas comme activités Caramel autonomes ; leur dossier
    // d'activité est fabriqué de bout en bout par `modules-parcours.js`.
    if (estModuleParcours(moduleKey)) {
        // L'adresse d'un lien web vient de la carte, pas du contenu généré :
        // corrigée après la génération, elle doit arriver telle quelle.
        const lien = carte.source?.type === 'lien' && carte.source.url ? { externalurl: carte.source.url } : {};
        const r = construireActiviteParcours(moduleKey, { ...carte.contenu, ...lien, title: titre });
        return { ...r, title: titre };
    }

    // --- Voie Moodle auto-porteuse : la carte de fichiers du dossier d'activité.
    const type = typeMoodle(moduleKey);
    if (!type) throw new Error(`parcours_module_non_gere:${moduleKey}`);

    const { construireFichiersActivite } = await import('../moodle/mono-activity-files.js');
    // Les octets des images envoyées d'une Page ou d'un Livre sont rangés à part,
    // dans `carte.medias` (`recueillirMedias`), le contenu n'en gardant que le
    // chemin : on les y remet avant la mise en forme.
    const contenu = carte.medias ? contenuPourEdition(carte) : carte.contenu;
    const { files, moduleName, activityDir, paquet } = await construireFichiersActivite(
        type,
        { ...contenu, title: titre },
        { titreParDefaut: titre },
    );
    // Les images envoyées d'une Page ou d'un Livre voyagent à part (`paquet`) :
    // `assemblerParcours` les joint après l'assemblage, comme les fichiers du
    // Paquetage IMS — le constructeur partagé refuserait une activité à fichiers.
    return { files, moduleName, activityDir, title: titre, ...(paquet ? { paquet } : {}) };
}

/* ------------------------------------------------------------------ *
 *  Textes de scénarisation
 * ------------------------------------------------------------------ */

/**
 * Le texte d'accueil ou d'introduction d'une étape, posé comme ÉTIQUETTE
 * (`mod_label`) : il s'affiche dans la page du cours, au-dessus des activités,
 * sans lien à suivre ni achèvement à cocher (D64).
 *
 * Ce sont des textes de l'enseignant, qui ne comptent pas parmi les douze
 * activités et ne passent pas par la fabrication : ils arrivent avec le plan.
 * Le module est celui du « Texte de liaison », dont l'aller-retour sur Éléa et
 * Magistère est fait (§ 10 du PRD).
 *
 * @param {string} texte
 * @param {string} titre - Nom de l'étiquette (non affiché par Moodle).
 * @param {number} sectionIndex
 * @returns {Object|null} L'entrée d'activité, ou null si le texte est vide.
 */
function etiquetteDeScenario(texte, titre, sectionIndex) {
    const intro = String(texte || '').trim();
    if (!intro) return null;
    const title = String(titre || '').trim() || (translations.parcours_titre || 'Parcours');
    const extracted = construireActiviteParcours('parcours_etiquette', { title, intro });
    return { extracted: { ...extracted, title }, title, sectionIndex, scenario: true };
}

/* ------------------------------------------------------------------ *
 *  Plan → activités + sections
 * ------------------------------------------------------------------ */

/**
 * Traduit le plan en la paire `{activities, sections}` du constructeur.
 *
 * Une étape = une section de cours, numérotée à partir de **1** : la section 0
 * d'un cours au format `topics` est la zone « Généralités », en tête de page et
 * sans titre. Y verser la première étape la ferait disparaître comme étape.
 * Elle reste donc vide — le constructeur la crée de toute façon, Moodle
 * l'exige.
 *
 * Les cartes sans contenu, au module non géré ou dont la mise en forme échoue
 * sont ÉCARTÉES avec leur motif, jamais omises en silence : le parcours livré
 * doit dire ce qu'il ne contient pas.
 *
 * La section 0 n'accueille qu'une chose, et seulement si l'enseignant l'a
 * demandée : la **Carte de progression**. Elle n'est pas une carte du plan (elle
 * n'a pas de contenu à générer, et le modèle ne doit pas la choisir), donc elle
 * ne passe pas par la boucle des étapes ; elle se pose en tête, une fois qu'on
 * sait qu'il y a bien un chemin à montrer.
 *
 * @param {Object} plan
 * @param {Object} [options]
 * @param {string} [options.platformId] - `elea` | `magistere` | `moodle`. La
 *        Carte de progression n'existe que sur Éléa (D26) : sans plateforme
 *        connue, on ne la pose pas.
 * @param {number} [options.timestamp]
 * @returns {Promise<{activities:Array, sections:Array, exclues:Array<{titre:string, module:string, motif:string, detail?:string}>}>}
 */
export async function planVersActivites(plan, { platformId, timestamp } = {}) {
    const activities = [];
    const sections = [{ index: 0, name: '' }];
    const exclues = [];
    // Ce que l'enseignant devra faire sur la plateforme avant d'ouvrir le cours
    // (planifier la classe virtuelle, créer les groupes…) : D72.
    const aFaire = [];
    const disponibles = platformId ? new Set(modulesDisponibles(platformId).map(m => m.cle)) : null;

    const etapes = (plan && Array.isArray(plan.etapes)) ? plan.etapes : [];

    for (let i = 0; i < etapes.length; i++) {
        const etape = etapes[i];
        const cartes = Array.isArray(etape.cartes) ? etape.cartes : [];
        // Une étape dont aucune carte n'aboutit ne doit créer AUCUNE section :
        // le constructeur exige des numéros de section contigus.
        const retenues = [];

        for (const carte of cartes) {
            if (!carte.contenu) {
                exclues.push({ titre: titreCarte(carte), module: carte.module, motif: MOTIFS.sans_contenu });
                continue;
            }
            if (disponibles && !disponibles.has(carte.module)) {
                exclues.push({ titre: titreCarte(carte), module: carte.module, motif: MOTIFS.module_non_gere });
                continue;
            }
            try {
                const extracted = await activiteDepuisCarte(carte);
                // Un backup à médias ferait un cours aux références cassées : le
                // constructeur échoue bruyamment, autant l'écarter avec un motif.
                if (extracted.files && hasEmbeddedFiles(extracted.files)) {
                    exclues.push({ titre: titreCarte(carte), module: carte.module, motif: MOTIFS.medias });
                    continue;
                }
                retenues.push({ extracted, title: titreCarte(carte) });
                const ligne = ligneAFaire(MODULES_PARCOURS[carte.module], titreCarte(carte));
                if (ligne) aFaire.push(ligne);
            } catch (e) {
                const motif = String(e && e.message || '').startsWith('parcours_module_non_gere')
                    ? MOTIFS.module_non_gere
                    : MOTIFS.echec;
                exclues.push({
                    titre: titreCarte(carte), module: carte.module, motif,
                    detail: String(e && e.message || e),
                });
                // L'écran ne montre que le motif ; la cause technique reste lisible
                // dans la console sans `?debug` (« erreur de mise en forme » seule
                // ne permettait pas de retrouver le module fautif).
                console.warn(`[parcours] carte « ${titreCarte(carte)} » (${carte.module}) écartée (${motif}) :`, e);
            }
        }

        if (!retenues.length) continue;
        const index = sections.length;
        const nomSection = String(etape.titre || '').trim() || `${translations.parcours_step_plan || 'Étape'} ${i + 1}`;
        sections.push({ index, name: nomSection });
        // L'introduction de l'étape ouvre sa section, avant la première activité.
        const intro = etiquetteDeScenario(etape.introduction, nomSection, index);
        if (intro) activities.push(intro);
        for (const r of retenues) activities.push({ ...r, sectionIndex: index });
    }

    // La Carte de progression ferme la marche du calcul et ouvre celle du cours :
    // elle se pose en section 0, EN TÊTE des activités, une fois qu'on sait
    // qu'au moins une activité a abouti. Une carte sans chemin n'est pas une
    // carte — elle dessinerait un tracé au-dessus d'un cours vide.
    const nbActivites = activities.filter(a => !a.scenario).length;
    if (carteAPoser(plan, platformId, nbActivites)) {
        const carte = construireCarteProgression(plan, { timestamp });
        activities.unshift({ extracted: carte, title: carte.title, sectionIndex: 0 });
        debugLog('parcours', `carte de progression posée en section 0 (${carte.title})`);
    }
    // L'accueil du parcours ouvre le cours, avant la Carte : on lit d'abord où
    // l'on va, puis on voit le chemin. Pas d'accueil sur un cours sans activité.
    const accueil = nbActivites ? etiquetteDeScenario(plan && plan.introduction, plan && plan.titre, 0) : null;
    if (accueil) activities.unshift(accueil);
    // La liste « À faire » passe devant tout, CACHÉE aux élèves : l'enseignant
    // la voit en tête de son cours, marquée « Caché pour les étudiants », et la
    // supprime une fois le travail fait. Une étiquette ne s'achève pas : elle
    // n'entre dans aucune condition d'ouverture.
    const memo = nbActivites ? etiquetteAFaire(aFaire) : null;
    if (memo) activities.unshift(memo);

    return { activities, sections, exclues, aFaire };
}

/**
 * L'étiquette « À faire avant d'ouvrir le cours », cachée aux élèves (D72).
 * @param {string[]} lignes
 * @returns {Object|null}
 */
function etiquetteAFaire(lignes) {
    if (!lignes.length) return null;
    const echapper = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = translations.parcours_afaire_titre || 'À faire avant d’ouvrir le cours';
    const intro = `<p><strong>${echapper(title)}</strong></p>`
        + `<p>${echapper(translations.parcours_afaire_note || '')}</p>`
        + `<ul>${lignes.map(l => `<li>${echapper(l)}</li>`).join('')}</ul>`;
    const extracted = construireActiviteParcours('parcours_etiquette', { title, intro }, { visible: 0 });
    return { extracted: { ...extracted, title }, title, sectionIndex: 0, scenario: true };
}

/* ------------------------------------------------------------------ *
 *  Le fichier
 * ------------------------------------------------------------------ */

/** Nom de fichier du parcours, sur la convention des autres exports. */
function nomFichier(titre) {
    const base = String(titre || 'parcours')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'parcours';
    const lang = currentLang === 'zh' ? 'zh-cn' : (currentLang || 'fr');
    return `parcours-${base}-caramel-${horodatageFichier()}-${lang}.mbz`;
}

/**
 * Assemble le `.mbz` de cours à partir d'un plan dont les cartes portent leur
 * contenu généré.
 *
 * @param {Object} plan
 * @param {Object} [options]
 * @param {number} [options.timestamp] - Epoch en secondes (injecté par les tests).
 * @param {string} [options.platformId] - Plateforme visée, pour les modules qui
 *        n'existent pas partout (la Carte de progression est propre à Éléa).
 * @returns {Promise<{blob:Blob, bytes:Uint8Array, filename:string, activites:Array, sections:Array, exclues:Array}>}
 */
export async function assemblerParcours(plan, { timestamp, platformId } = {}) {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const { activities, sections, exclues, aFaire } = await planVersActivites(plan, { platformId, timestamp: ts });
    if (!activities.some(a => !a.scenario)) throw new Error('parcours_aucune_activite');
    const textes = activities.filter(a => a.scenario).length;

    const titre = String(plan && plan.titre || '').trim() || (translations.parcours_titre || 'Parcours');

    const { files: bruts, activities: posees, sectionsUsed } = assembleCourseFiles({
        courseTitle: titre,
        timestamp: ts,
        activities,
        sections,
        identite: IDENTITE_CARAMEL,
    });
    // Le Test étudiant cite son propre module de cours (`<coursemodule>`), dont
    // l'identifiant n'existe qu'une fois l'activité posée (D89).
    const assembles = recalerModulesDeCours(bruts);

    // L'ouverture progressive se pose APRÈS l'assemblage, sur la carte de
    // fichiers rendue. Le constructeur est partagé avec La Sucrerie : il
    // assemble, il ne décide pas de pédagogie. Et poser ici traite d'un coup les
    // trois voies (H5P, Test, module Moodle) sans rien savoir d'aucune.
    const etapes = sectionsUsed.filter(s => s.number >= 1).length;
    let files = assembles;
    let etapesContraintes = 0;
    if (progressionAPoser(plan, etapes)) {
        const r = poserProgression(assembles, { activites: posees, sections: sectionsUsed });
        files = r.files;
        etapesContraintes = r.etapesContraintes;
        debugLog('parcours', `ouverture progressive : ${etapesContraintes} étape(s) contrainte(s)`);
    }

    const { createMbz } = await import('../moodle/moodle-creator.js');
    files = await joindreFondCarte(files, plan.carte, { timestamp: ts });
    // Le Document collaboratif exige son fichier de départ à la restauration
    // (D75) ; le Paquetage IMS n'existe que par ses fichiers ; une Page ou un
    // Livre y joint ses images envoyées depuis l'ordinateur. Le constructeur
    // rend une activité posée par activité reçue, dans le même ordre : c'est ce
    // qui retrouve le dossier renuméroté de chacune.
    const joints = activities
        .map((a, i) => (a.extracted?.paquet ? { dir: `activities/${posees[i].moduleName}_${posees[i].moduleId}`, paquet: a.extracted.paquet } : null))
        .filter(Boolean);
    files = await joindreFichiersInitiaux(files, { timestamp: ts, joints });
    // Identifie aussi les parcours ne contenant qu'une seule activité.
    files['caramel-parcours.json'] = JSON.stringify({ version: 1, source: 'caramel' });
    const bytes = await createMbz(files);

    debugLog('parcours', `.mbz de cours assemblé : ${posees.length} activité(s), ` +
        `${sectionsUsed.length} section(s), ${exclues.length} écartée(s)`);

    return {
        blob: new Blob([bytes], { type: 'application/octet-stream' }),
        bytes,
        filename: nomFichier(titre),
        activites: posees,
        sections: sectionsUsed,
        exclues,
        /** Gestes à faire sur la plateforme, aussi posés en étiquette cachée (D72). */
        aFaire,
        etapesContraintes,
        /** Étiquettes d'accueil et d'introduction, comprises dans `activites`. */
        textes,
    };
}

/** Réexport utilitaire : les tests situent les sections sans réimporter le constructeur. */
export { sectionIdFor };
