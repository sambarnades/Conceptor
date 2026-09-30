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
import { estModuleParcours, construireActiviteParcours, MODULES_PARCOURS, moduleSAcheve } from './modules-parcours.js';
import { ligneAFaire, recalerModulesDeCours } from './modules-natifs.js';
import { carteAPoser, construireCarteProgression } from './carte-progression.js';
import { joindreFondCarte } from './carte-image.js';
import { joindreFichiersInitiaux } from '../moodle/fichiers-modules.js';
import { progressionAPoser, poserProgression } from './progression.js';
import {
    aiguillagesDuPlan, aDesChemins, nombreQuestions, bornesEnReponses, plagesEnReponses, dureeParEleve,
    reglagesDuTest,
} from './aiguillage.js';
import { poserAiguillages, cheminsIncomplets } from './aiguillage-cours.js';
import { poserDurees } from './durees-cours.js';
import { poserAchevementsH5P } from './achevement-h5p.js';
import { formaterDuree } from './duree.js';

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
 * @param {Object} [o]
 * @param {boolean} [o.aiguille] - La carte est le test qui aiguille vers des
 *        chemins : un Test n'accepte alors qu'UNE tentative (D93), sans quoi une
 *        seconde tentative pourrait faire changer l'élève de chemin.
 * @returns {Promise<Object>} La forme `extracted` du constructeur.
 * @throws {Error} `parcours_module_non_gere:<module>` si aucune voie ne convient.
 */
export async function activiteDepuisCarte(carte, { aiguille = false } = {}) {
    const moduleKey = carte.module;
    const titre = titreCarte(carte);

    // --- Voie H5P : les octets du .h5p entrent dans le pool de fichiers.
    if (h5pModules[moduleKey]) {
        const { packageActivity } = await import('../core/package-activity.js');
        const paquet = await packageActivity({
            moduleKey,
            // Le test qui aiguille garde ses réglages quoi qu'en ait fait
            // l'éditeur : première tentative, un point par question (D93).
            content: aiguille ? reglagesDuTest(moduleKey, carte.contenu) : carte.contenu,
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
        if (aiguille) modele.quiz_settings = { ...(modele.quiz_settings || {}), attempts: 1 };
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
    // D'où vient chaque section : l'étape du plan, ou la fin du parcours. C'est
    // ce qui permet de poser les chemins APRÈS l'assemblage (`aiguillage-cours.js`).
    const sectionsPlan = [{ index: 0 }];
    const exclues = [];
    // Ce que l'enseignant devra faire sur la plateforme avant d'ouvrir le cours
    // (planifier la classe virtuelle, créer les groupes…) : D72.
    const aFaire = [];
    const disponibles = platformId ? new Set(modulesDisponibles(platformId).map(m => m.cle)) : null;

    const etapes = (plan && Array.isArray(plan.etapes)) ? plan.etapes : [];
    const aiguillages = aiguillagesDuPlan(plan);
    const tests = new Set(aiguillages.map(g => g.test).filter(Boolean));

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
                const extracted = await activiteDepuisCarte(carte, { aiguille: tests.has(carte) });
                // Un backup à médias ferait un cours aux références cassées : le
                // constructeur échoue bruyamment, autant l'écarter avec un motif.
                if (extracted.files && hasEmbeddedFiles(extracted.files)) {
                    exclues.push({ titre: titreCarte(carte), module: carte.module, motif: MOTIFS.medias });
                    continue;
                }
                // `carteId` et `duree` ne servent pas au constructeur : ils
                // permettent aux passes d'après l'assemblage de retrouver la carte
                // de chaque activité posée (le test d'un aiguillage, sa durée).
                retenues.push({ extracted, title: titreCarte(carte), carteId: carte.id, module: carte.module, duree: carte.duree, test: tests.has(carte) });
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
        sectionsPlan.push({ index, etapeId: etape.id });
        // Un chemin s'ouvre par une étiquette que SEUL l'enseignant voit : Moodle
        // ne lui montre pas les seuils d'une restriction par note (« une note dans
        // un certain intervalle »), il faut donc les lui écrire (D94).
        const groupe = aiguillages.find(g => g.chemins.some(c => c.etape === etape));
        if (groupe) {
            const note = etiquetteDuChemin(groupe, etape, index);
            if (note) activities.push(note);
        }
        // L'introduction de l'étape ouvre sa section, avant la première activité.
        const intro = etiquetteDeScenario(etape.introduction, nomSection, index);
        if (intro) activities.push(intro);
        for (const r of retenues) {
            activities.push({ ...r, sectionIndex: index });
            // Sous le test qui aiguille, l'élève lit que la suite va s'afficher :
            // avant le test, aucun chemin n'est visible, et sans ce mot le cours
            // semblerait s'arrêter là.
            if (r.test) activities.push(etiquetteTexte(translations.parcours_chemins_suite
                || 'Les activités suivantes s’afficheront ci-dessous dès la fin du test (bouton « Terminer »).',
                translations.parcours_titre || 'Parcours', index));
        }
    }

    const nbActivites = activities.filter(a => !a.scenario).length;

    // La FIN DU PARCOURS, dans tous les parcours (D96) : une dernière section,
    // masquée tant que l'élève n'a pas terminé ce qu'il avait à faire, qui lui dit
    // qu'il a fini. Elle n'a de sens que si une activité au moins s'achève.
    const achevables = activities.filter(a => a.carteId && moduleSAcheve(carteDe(etapes, a.carteId)?.module));
    if (achevables.length) {
        const index = sections.length;
        const nomFin = translations.parcours_fin_titre || 'Fin du parcours';
        sections.push({ index, name: nomFin });
        sectionsPlan.push({ index, fin: true });
        const bravo = translations.parcours_fin_bravo || 'Bravo ! Le parcours est terminé.';
        const conclusion = String(plan && plan.conclusion || '').trim();
        activities.push(etiquetteTexte(`**${bravo}**${conclusion ? `\n\n${conclusion}` : ''}`, nomFin, index));
    }

    // La Carte de progression ferme la marche du calcul et ouvre celle du cours :
    // elle se pose en section 0, EN TÊTE des activités, une fois qu'on sait
    // qu'au moins une activité a abouti. Une carte sans chemin n'est pas une
    // carte — elle dessinerait un tracé au-dessus d'un cours vide. Et pas de
    // Carte dans un parcours à chemins (D95) : le greffon montrerait à chaque
    // élève les activités des AUTRES chemins, verrouillées pour toujours.
    if (!aiguillages.length && carteAPoser(plan, platformId, nbActivites)) {
        const carte = construireCarteProgression(plan, { timestamp });
        activities.unshift({ extracted: carte, title: carte.title, sectionIndex: 0 });
        debugLog('parcours', `carte de progression posée en section 0 (${carte.title})`);
    }
    // L'accueil du parcours ouvre le cours, avant la Carte : on lit d'abord où
    // l'on va, puis on voit le chemin. Il dit aussi la DURÉE du parcours, pour
    // l'élève (D97). Pas d'accueil sur un cours sans activité.
    const texteAccueil = [String(plan && plan.introduction || '').trim(), phraseDureeParcours(plan, activities)]
        .filter(Boolean).join('\n\n');
    const accueil = nbActivites ? etiquetteDeScenario(texteAccueil, plan && plan.titre, 0) : null;
    if (accueil) activities.unshift(accueil);
    // La liste « À faire » passe devant tout, CACHÉE aux élèves : l'enseignant
    // la voit en tête de son cours, marquée « Caché pour les étudiants », et la
    // supprime une fois le travail fait. Une étiquette ne s'achève pas : elle
    // n'entre dans aucune condition d'ouverture.
    const memo = nbActivites ? etiquetteAFaire(aFaire) : null;
    if (memo) activities.unshift(memo);

    return { activities, sections, sectionsPlan, exclues, aFaire };
}

/** La carte du plan qui porte cet identifiant. */
function carteDe(etapes, id) {
    for (const e of etapes) for (const c of (e.cartes || [])) if (c.id === id) return c;
    return null;
}

/** Une étiquette de texte posée par l'atelier (pas par le plan). */
function etiquetteTexte(texte, titre, sectionIndex, { visible = 1 } = {}) {
    const title = String(titre || '').trim() || (translations.parcours_titre || 'Parcours');
    const extracted = construireActiviteParcours('parcours_etiquette', { title, intro: texte }, { visible });
    return { extracted: { ...extracted, title }, title, sectionIndex, scenario: true };
}

/** Substitue les jetons `@x` d'un libellé traduit. */
function jetons(cle, defaut, valeurs) {
    let s = translations[cle] || defaut;
    for (const [k, v] of Object.entries(valeurs)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/**
 * La plage d'un chemin, écrite pour l'enseignant : « de 4 à 7 sur 10 ».
 * @param {number[]} plage - `[de, a]`
 * @param {number} n
 */
export function texteDePlage([de, a], n) {
    return de === a
        ? jetons('parcours_plage_une', '@de sur @n', { de, n })
        : jetons('parcours_plage', 'de @de à @a sur @n', { de, a, n });
}

/**
 * L'étiquette de l'enseignant en tête d'un chemin, CACHÉE aux élèves : à qui ce
 * chemin s'ouvre, et comment réorienter un élève.
 */
function etiquetteDuChemin(groupe, etape, sectionIndex) {
    const j = groupe.chemins.findIndex(c => c.etape === etape);
    if (j < 0 || !groupe.test) return null;
    const k = groupe.chemins.length;
    const n = nombreQuestions(groupe.test, k);
    const plages = plagesEnReponses(bornesEnReponses(groupe.chemins.slice(1).map(c => c.depuis), n), n);
    const role = translations[`parcours_role_${groupe.chemins[j].role}`] || groupe.chemins[j].role;
    const echapper = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const texte = jetons('parcours_chemin_prof',
        'Visible par vous seul. Chemin « @r » : il s’ouvre aux élèves qui obtiennent @p au test « @t », à leur première tentative. Pour réorienter un élève, modifiez sa note à ce test dans le carnet de notes.',
        { r: role, p: texteDePlage(plages[j], n), t: titreCarte(groupe.test) });
    return etiquetteTexte(`<p>${echapper(texte)}</p>`, `${role} · ${translations.parcours_titre || 'Parcours'}`, sectionIndex, { visible: 0 });
}

/**
 * La durée du parcours pour l'élève, dans la phrase de l'accueil : la somme de
 * ses activités, ou, avec des chemins, la plus courte et la plus longue suite.
 * Seules les activités qui entrent dans le cours comptent.
 */
function phraseDureeParcours(plan, activities) {
    const retenues = new Set(activities.filter(a => a.carteId).map(a => a.carteId));
    if (!retenues.size) return '';
    const planRetenu = { ...plan, etapes: (plan.etapes || []).map(e => ({ ...e, cartes: (e.cartes || []).filter(c => retenues.has(c.id)) })) };
    const { min, max } = dureeParEleve(planRetenu);
    if (!max) return '';
    return min === max
        ? jetons('parcours_duree_parcours', 'Durée estimée du parcours : @d', { d: formaterDuree(max) })
        : jetons('parcours_duree_parcours_chemins', 'Durée estimée du parcours : @min à @max selon le chemin',
            { min: formaterDuree(min), max: formaterDuree(max) });
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
    const { activities, sections, sectionsPlan, exclues, aFaire } = await planVersActivites(plan, { platformId, timestamp: ts });
    if (!activities.some(a => !a.scenario)) throw new Error('parcours_aucune_activite');
    const textes = activities.filter(a => a.scenario).length;

    // Un parcours à chemins ne se livre pas à moitié : un chemin sans activité
    // prête, ou un test absent, laisserait des élèves sans suite. La livraison
    // partielle (D49) reste possible pour tout le reste.
    if (aDesChemins(plan)) {
        const retenues = new Set(activities.filter(a => a.carteId).map(a => a.carteId));
        const manques = cheminsIncomplets(plan, c => retenues.has(c.id), c => moduleSAcheve(c.module));
        if (manques.length) {
            const erreur = new Error('parcours_chemins_incomplets');
            erreur.manques = manques;
            throw erreur;
        }
    }

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

    // Les CHEMINS et la FIN DU PARCOURS d'abord (D90, D96) : leurs sections
    // reçoivent leur restriction avant l'ouverture progressive, qui ne remplit
    // que les sections encore libres — elle ne peut donc ni écraser un chemin
    // ni conditionner le bilan sur le seul dernier chemin.
    // Les H5P qui ne rendent jamais de note s'achèvent à la consultation (D100) :
    // sans quoi tout ce qui les attend resterait fermé.
    const acheves = poserAchevementsH5P(assembles, { activites: posees, entrees: activities });
    const chemins = poserAiguillages(acheves.files, { plan, activites: posees, entrees: activities, sectionsPlan });
    let files = chemins.files;
    if (chemins.chemins) debugLog('parcours', `aiguillage : ${chemins.chemins} chemin(s)`, chemins.tests);

    // L'ouverture progressive se pose APRÈS l'assemblage, sur la carte de
    // fichiers rendue. Le constructeur est partagé avec La Sucrerie : il
    // assemble, il ne décide pas de pédagogie. Et poser ici traite d'un coup les
    // trois voies (H5P, Test, module Moodle) sans rien savoir d'aucune.
    const etapes = sectionsUsed.filter(s => s.number >= 1).length;
    let etapesContraintes = 0;
    if (progressionAPoser(plan, etapes)) {
        const r = poserProgression(files, { activites: posees, sections: sectionsUsed });
        files = r.files;
        etapesContraintes = r.etapesContraintes;
        debugLog('parcours', `ouverture progressive : ${etapesContraintes} étape(s) contrainte(s)`);
    }

    // La durée de chaque activité, en tête de sa description (D97).
    const durees = poserDurees(files, { activites: posees, entrees: activities });
    files = durees.files;

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
        /** Chemins posés, tests qui aiguillent, fin du parcours (D90, D96). */
        chemins: chemins.chemins,
        tests: chemins.tests,
        fin: chemins.fin,
        /** Activités dont la description porte la durée (D97). */
        durees: durees.n,
        /** Étiquettes d'accueil et d'introduction, comprises dans `activites`. */
        textes,
    };
}

/** Réexport utilitaire : les tests situent les sections sans réimporter le constructeur. */
export { sectionIdFor };
