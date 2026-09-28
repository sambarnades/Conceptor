/**
 * @file Parcours — les modules que le parcours sait poser, et que Caramel ne
 * génère pas comme activités autonomes.
 *
 * **Pourquoi un second registre.** `core/definitions.js` répertorie ce que
 * Caramel sait produire en fichier téléchargeable : une tuile, un prompt, un
 * éditeur, un export. Un forum n'entre dans aucune de ces cases — personne ne
 * télécharge un forum tout seul. Il n'existe que DANS un cours, comme un espace
 * d'échange entre deux activités. Lui fabriquer une tuile sur la page d'accueil
 * serait ajouter du bruit pour un usage qui n'existe pas.
 *
 * Ce fichier est donc l'extension de palette PROPRE AU PARCOURS. Il ne double
 * pas `definitions.js` : il décrit un autre ensemble, pour un autre usage. Le
 * jour où l'un de ces modules deviendrait une activité autonome, il déménagerait
 * — et disparaîtrait d'ici.
 *
 * **La règle qui a présidé au choix des trois premiers**, et qui doit présider
 * aux suivants : le contenu d'un module ne survit à la restauration d'un cours
 * QUE s'il est de la **configuration d'activité**. Tout ce qui vit dans une
 * table de données utilisateur est ignoré par le restore quand `userinfo = 0` —
 * et `userinfo = 0` est la valeur juste pour un backup d'enseignant. Le
 * Glossaire l'a appris à nos dépens le 4 sept. 2026 : sept entrées envoyées,
 * zéro revenues, sur Éléa comme sur Magistère.
 *
 *   Config d'activité, RESTAURÉE   → `label.intro`, `forum.intro`,
 *                                    `choice.intro` + ses `options`
 *   Données utilisateur, PERDUE    → les discussions d'un forum, les entrées
 *                                    d'un glossaire, les fiches d'une base, les
 *                                    pages d'un wiki
 *
 * C'est pour cela qu'un forum est livré avec sa CONSIGNE et non avec un premier
 * message : le message serait une discussion, et il ne survivrait pas. Mieux
 * vaut une consigne qui arrive qu'une amorce qui disparaît.
 *
 * **D'où vient chaque forme XML — et ce qui la valide.** Deux origines, et il
 * faut savoir laquelle on a sous les yeux :
 *
 *   - `label`, `forum`, `choice` ont été ÉCRITS d'après le format de sauvegarde
 *     Moodle, sans modèle sous les yeux. Validés par aller-retour réel le
 *     4 sept. 2026 sur Éléa ET Magistère : tout revient intact (§ 10 du PRD).
 *   - `collabwordcloud`, `stickynotes` sont RELEVÉS sur un export authentique de
 *     Magistère (Moodle 5.1.5), champ par champ. C'est la bonne méthode : on ne
 *     devine plus, on recopie.
 *   - les quatorze modules natifs de `modules-natifs.js` (questionnaire, leçon,
 *     atelier, tableau, wiki…) sont relevés de la même façon, sur deux exports du
 *     27 sept. 2026 — Éléa ET Magistère, remplis de tous les types de leur palette
 *     (D70). `run_parcours_natifs.mjs` compare leur forme au relevé.
 *
 * Dans les deux cas la règle est la même, et elle ne se contourne pas : **un
 * module n'est annoncé qu'une fois passé l'aller-retour réel**, et la sonde
 * (`scripts/generer-parcours-sonde.mjs`) est l'endroit où on l'inscrit pour cela.
 *
 * Enseignement de l'aller-retour, qui dispense de viser l'exhaustivité : Moodle
 * COMBLE de lui-même les champs qu'un backup ne déclare pas (il a ajouté six
 * conteneurs au forum, deux au sondage). Un XML minimal et juste suffit.
 *
 * @module parcours/modules-parcours
 */

import { t } from '../core/translation.js';
import { escapeXml } from '../moodle/moodle-formats.js';
import { ID, tronquer, nom, html, moduleXml, activiteXml } from './modules-socle.js';
import { MODULES_NATIFS } from './modules-natifs.js';

// Le socle XML est réexporté : la Carte de progression le prend ici depuis
// toujours, et un module qui pose une activité n'a pas à savoir qu'il a déménagé.
export { ID, nom, html, moduleXml, activiteXml };


/**
 * Longueur maximale du titre d'une colonne de mur de post-it.
 *
 * **Ce n'est pas une préférence de mise en page, c'est le SCHÉMA de la table.**
 * `mod_stickynotes` déclare `stickynotes_column.title` en `char(20)`, et son
 * étape de restauration fait un `$DB->insert_record()` brut : un titre de 21
 * caractères ne tronque pas, il lève une `dmlwriteexception` — et Moodle
 * interrompt la restauration du COURS ENTIER, à 79 %, sur un message qui ne
 * nomme ni le module ni le champ. Constaté le 4 sept. 2026 avec « Ce que je
 * crois savoir » (22) et « Ce que je veux vérifier » (23), deux intitulés de
 * colonne parfaitement ordinaires.
 *
 * C'est la leçon des greffons tiers : leurs colonnes sont ÉTROITES là où le
 * noyau Moodle est large (`name` y est presque toujours `char(255)`). Avant
 * d'ouvrir un module, lire son `db/install.xml` et poser les plafonds ici.
 */
const MAX_TITRE_COLONNE = 20;



/**
 * **Étiquette** (`mod_label`) — un texte posé DANS la page du cours, entre deux
 * activités. Le module le plus simple de Moodle : son contenu EST son `intro`.
 *
 * C'est aussi le seul qui donne au parcours de quoi respirer — une transition
 * écrite entre deux exercices, un rappel de ce qu'on vient de faire. Sans lui,
 * une section n'est qu'une liste de liens.
 */
function construireEtiquette(d, ts) {
    return {
        moduleName: 'label',
        completionview: 0,   // rien à « consulter » : le texte est déjà à l'écran
        xml: activiteXml('label', `  <label id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <timemodified>${ts}</timemodified>
  </label>`),
    };
}

/**
 * **Forum** (`mod_forum`) — l'espace d'échange.
 *
 * Livré avec sa CONSIGNE, jamais avec un premier message : un message serait une
 * discussion, donc une donnée utilisateur, et il ne survivrait pas au restore
 * (cf. l'en-tête). La consigne, elle, est l'`intro` de l'activité — de la
 * configuration, qui arrive à bon port.
 *
 * `type: general` = forum standard, chacun peut lancer un fil. `assessed: 0` :
 * un forum de parcours sert à échanger, pas à noter — le noter demanderait une
 * échelle et un barème que personne n'a demandés.
 */
function construireForum(d, ts) {
    return {
        moduleName: 'forum',
        xml: activiteXml('forum', `  <forum id="${ID}">
    <type>general</type>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <duedate>0</duedate>
    <cutoffdate>0</cutoffdate>
    <assessed>0</assessed>
    <assesstimestart>0</assesstimestart>
    <assesstimefinish>0</assesstimefinish>
    <scale>0</scale>
    <maxbytes>0</maxbytes>
    <maxattachments>1</maxattachments>
    <forcesubscribe>0</forcesubscribe>
    <trackingtype>1</trackingtype>
    <rsstype>0</rsstype>
    <rssarticles>0</rssarticles>
    <timemodified>${ts}</timemodified>
    <warnafter>0</warnafter>
    <blockafter>0</blockafter>
    <blockperiod>0</blockperiod>
    <completiondiscussions>0</completiondiscussions>
    <completionreplies>0</completionreplies>
    <completionposts>0</completionposts>
    <displaywordcount>0</displaywordcount>
    <lockdiscussionafter>0</lockdiscussionafter>
    <grade_forum>0</grade_forum>
    <discussions>
    </discussions>
  </forum>`),
    };
}

/**
 * **Sondage** (`mod_choice`) — une question, des options, un vote.
 *
 * Le seul des trois dont le contenu ne tient pas dans l'`intro` : ses options
 * vivent dans la table `choice_options`, qui fait partie de la STRUCTURE de
 * l'activité et non des réponses. Ce sont les `choice_answers` — les votes des
 * élèves — qui sont des données utilisateur. Les options arrivent donc, les
 * votes non : exactement ce qu'on veut.
 *
 * `showresults: 1` = les résultats s'affichent après le vote, ce qui est le
 * seul réglage qui rende un sondage de classe intéressant.
 */
function construireSondage(d, ts) {
    const options = (Array.isArray(d.options) ? d.options : [])
        .map(o => String(typeof o === 'string' ? o : (o && o.text) || '').trim())
        .filter(Boolean)
        .slice(0, 10);

    const optionsXml = options.map((texte, i) => `      <option id="${ID + i}">
        <text>${escapeXml(texte)}</text>
        <maxanswers>0</maxanswers>
        <timemodified>${ts}</timemodified>
      </option>`).join('\n');

    return {
        moduleName: 'choice',
        xml: activiteXml('choice', `  <choice id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <publish>1</publish>
    <showresults>1</showresults>
    <display>0</display>
    <allowupdate>1</allowupdate>
    <allowmultiple>0</allowmultiple>
    <showunanswered>0</showunanswered>
    <includeinactive>1</includeinactive>
    <limitanswers>0</limitanswers>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <showpreview>0</showpreview>
    <timemodified>${ts}</timemodified>
    <completionsubmit>0</completionsubmit>
    <options>
${optionsXml}
    </options>
  </choice>`),
    };
}

/**
 * **Nuage de mots** (`mod_collabwordcloud`) — chacun propose ses mots, le nuage
 * se construit sous les yeux de la classe.
 *
 * L'outil du RECUEIL DE REPRÉSENTATIONS : ce que les élèves ont déjà en tête
 * avant qu'on enseigne quoi que ce soit, rendu visible en trente secondes. Sa
 * place naturelle est la toute première carte d'un parcours ; on peut le reposer
 * à la fin, sur la même question, pour montrer le chemin parcouru.
 *
 * Deux textes, et ils ne disent PAS la même chose — c'est ce que la forme du
 * module impose : `intro` explique à quoi sert le nuage dans le cours,
 * `instructions` pose la question à laquelle l'élève répond en tapant ses mots.
 * Confondre les deux donne une activité où l'on ne sait pas quoi écrire.
 *
 * `wordsallowed: 5` / `wordsrequired: 1` : au moins un mot, cinq au plus. Un
 * plafond bas est ce qui force à choisir — donc à réfléchir ; sans lui, les plus
 * rapides remplissent le nuage à eux seuls.
 *
 * Forme relevée sur un export authentique de Magistère (Moodle 5.1.5). Deux
 * particularités à ne pas « corriger » : ce module n'a PAS de balise `<course>`
 * (contrairement à `stickynotes` ou aux greffons Éléa), et son `<timecreated>`
 * y vaut 0.
 */
function construireNuageMots(d, ts) {
    return {
        moduleName: 'collabwordcloud',
        completionview: 0,
        completionPropre: true,   // <completionwords> ci-dessous
        xml: activiteXml('collabwordcloud', `  <collabwordcloud id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <instructions>${html(d.instructions)}</instructions>
    <wordsallowed>5</wordsallowed>
    <wordsrequired>1</wordsrequired>
    <timestart>0</timestart>
    <timeend>0</timeend>
    <completionwords>1</completionwords>
    <timecreated>0</timecreated>
    <timemodified>${ts}</timemodified>
  </collabwordcloud>`),
    };
}

/**
 * **Mur de post-its** (`mod_stickynotes`) — des colonnes, et des notes que les
 * élèves y déposent.
 *
 * Là où le nuage de mots recueille, le mur ORGANISE : ses colonnes sont une
 * grille de lecture posée d'avance, et c'est elle que le parcours génère. « Ce
 * que je sais / ce que je crois savoir / ce que je veux vérifier » ne produit
 * pas la même pensée que « causes / conséquences ». Les colonnes sont donc le
 * vrai contenu de cette activité, bien plus que sa consigne.
 *
 * Ce qui arrive et ce qui n'arrive pas : les COLONNES sont de la structure
 * d'activité (`stickynotes_column`), elles traversent la restauration ; les
 * NOTES sont des données utilisateur, elles ne traversent pas. Le module est
 * donc livré avec ses colonnes et vide de notes — ce qui est exactement l'état
 * dans lequel on veut le présenter à une classe.
 *
 * Les six couleurs sont laissées telles que l'export les donne, toutes actives
 * et sans signification attachée (`colorN_meaning` vide). On POURRAIT leur en
 * donner une — « vert : j'en suis sûr, orange : j'hésite » — mais la sémantique
 * exacte du champ `colors` n'est pas établie par le seul export, et un réglage
 * mal compris casse l'affichage. À rouvrir avec un export qui les utilise.
 *
 * Forme relevée sur un export authentique de Magistère (Moodle 5.1.5).
 */
function construireMurNotes(d, ts) {
    const colonnes = (Array.isArray(d.colonnes) ? d.colonnes : [])
        .map(c => tronquer(typeof c === 'string' ? c : (c && c.title) || '', MAX_TITRE_COLONNE))
        .filter(Boolean)
        .slice(0, 6);

    // Un mur sans colonne ne s'affiche pas : Moodle n'en crée aucune d'office.
    // Plutôt qu'une activité muette, on pose une colonne unique au titre du mur.
    const retenues = colonnes.length ? colonnes : [tronquer(d.title, MAX_TITRE_COLONNE) || '1'];

    const colonnesXml = retenues.map((titre, i) => `      <stickynotescolumn id="${ID + i}">
        <title>${escapeXml(titre)}</title>
        <column_order>${i + 1}</column_order>
        <stickynotesnotes>
        </stickynotesnotes>
      </stickynotescolumn>`).join('\n');

    return {
        moduleName: 'stickynotes',
        completionview: 0,
        completionPropre: true,   // <completionstickynotes> ci-dessous
        xml: activiteXml('stickynotes', `  <stickynotes id="${ID}">
    <course>${ID}</course>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <colors>1</colors>
    <votes>0</votes>
    <limitvotes>0</limitvotes>
    <maxlimitvotes>$@NULL@$</maxlimitvotes>
    <limitstickynotes>0</limitstickynotes>
    <maxstickynotes>$@NULL@$</maxstickynotes>
    <orderstickynotes>desc</orderstickynotes>
    <viewauthor>0</viewauthor>
    <rotate>1</rotate>
    <color1>1</color1>
    <color1_meaning></color1_meaning>
    <color2>1</color2>
    <color2_meaning></color2_meaning>
    <color3>1</color3>
    <color3_meaning></color3_meaning>
    <color4>1</color4>
    <color4_meaning></color4_meaning>
    <color5>1</color5>
    <color5_meaning></color5_meaning>
    <color6>1</color6>
    <color6_meaning></color6_meaning>
    <timecreated>${ts}</timecreated>
    <timemodified>0</timemodified>
    <displaystickycaption>0</displaystickycaption>
    <moveallnotes>0</moveallnotes>
    <seeallnotes>1</seeallnotes>
    <completionstickynotes>1</completionstickynotes>
    <stickynotescolumns>
${colonnesXml}
    </stickynotescolumns>
  </stickynotes>`),
    };
}

/* ------------------------------------------------------------------ *
 *  Le registre
 * ------------------------------------------------------------------ */

/**
 * Les modules que le parcours ajoute à la palette.
 *
 * `champs` décrit ce que le modèle doit produire — c'est la source du schéma
 * JSON envoyé dans le prompt, et du contrôle à la réception. `longs` marque les
 * champs à saisir sur plusieurs lignes, `listes` ceux qui sont des tableaux de
 * chaînes : le formulaire de retouche et l'exemple de sortie du prompt s'en
 * déduisent, sans que ni l'un ni l'autre ait à connaître les modules.
 *
 * **`platforms` n'est PAS déclaratif — il est constaté.** `label`, `forum` et
 * `choice` sont des modules du noyau Moodle : partout. `collabwordcloud` et
 * `stickynotes` sont des greffons TIERS, installés ou non selon la plateforme ;
 * ils ne sont déclarés que là où on les a vus de ses yeux — la palette de
 * Magistère, relevée le 4 sept. 2026. **Ajouter une plateforme ici demande de
 * l'avoir vérifiée sur sa palette**, pas de l'avoir supposée : un module absent
 * fait échouer l'import de tout le parcours, et l'enseignant n'a aucun moyen de
 * comprendre pourquoi.
 */
export const MODULES_PARCOURS = {
    parcours_etiquette: {
        moduleName: 'label',
        image: 'assets/images/activities/plateforme-label.webp',
        nameKey: 'parcours_mod_etiquette_name',
        descKey: 'parcours_mod_etiquette_desc',
        platforms: ['Éléa', 'Magistère', 'Moodle'],
        niveau: 'amorce',
        icone: 'fa-align-left',
        champs: { title: 'titre court', intro: 'le texte affiché dans la page du cours' },
        longs: ['intro'],
        construire: construireEtiquette,
    },
    parcours_forum: {
        moduleName: 'forum',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-forum.webp',
        nameKey: 'parcours_mod_forum_name',
        descKey: 'parcours_mod_forum_desc',
        platforms: ['Éléa', 'Magistère', 'Moodle'],
        niveau: 'amorce',
        icone: 'fa-comments',
        champs: { title: 'titre du forum', intro: 'la consigne : sur quoi échanger, et comment' },
        longs: ['intro'],
        construire: construireForum,
    },
    parcours_sondage: {
        moduleName: 'choice',
        image: 'assets/images/activities/plateforme-choice.webp',
        nameKey: 'parcours_mod_sondage_name',
        descKey: 'parcours_mod_sondage_desc',
        platforms: ['Éléa', 'Magistère', 'Moodle'],
        niveau: 'amorce',
        icone: 'fa-square-poll-vertical',
        champs: {
            title: 'titre du sondage',
            intro: 'la question posée ; un sondage ne recueille qu’un vote : ne demande ni justification ni commentaire écrit',
            options: 'de 2 à 6 réponses possibles, en texte simple',
        },
        longs: ['intro'],
        listes: ['options'],
        construire: construireSondage,
    },

    // ─── Greffons tiers — chacun là où on l'a VU, et nulle part ailleurs ───
    //
    // Les deux ont été relevés sur le même export de Magistère, et on aurait pu
    // croire qu'ils allaient de pair. La palette d'Éléa dit le contraire : elle
    // propose Sticky Notes, **pas** le Nuage de mots. C'est très exactement ce
    // que D26 anticipait — la disponibilité d'un greffon tiers se constate
    // plateforme par plateforme, elle ne se déduit ni d'une autre plateforme, ni
    // d'un autre greffon. Ajouter une entrée ici demande d'avoir vu la tuile.
    parcours_nuage_mots: {
        moduleName: 'collabwordcloud',
        image: 'assets/images/activities/plateforme-collabwordcloud.webp',
        nameKey: 'parcours_mod_nuage_name',
        descKey: 'parcours_mod_nuage_desc',
        platforms: ['Magistère'],
        niveau: 'amorce',
        icone: 'fa-cloud',
        champs: {
            title: 'titre court du nuage',
            intro: "à quoi sert ce nuage dans le cours, en une ou deux phrases adressées à l'élève",
            instructions: "la question à laquelle l'élève répond en tapant ses mots — UNE phrase, sans jargon",
        },
        longs: ['intro', 'instructions'],
        construire: construireNuageMots,
    },
    parcours_mur_notes: {
        moduleName: 'stickynotes',
        image: 'assets/images/activities/plateforme-stickynotes.webp',
        nameKey: 'parcours_mod_mur_name',
        descKey: 'parcours_mod_mur_desc',
        // Vu dans la palette d'Éléa ET de Magistère (relevé du 4 sept. 2026).
        platforms: ['Éléa', 'Magistère'],
        niveau: 'amorce',
        icone: 'fa-note-sticky',
        champs: {
            title: 'titre court du mur',
            intro: "la consigne : ce que l'élève écrit sur ses notes, et comment il choisit sa colonne",
            colonnes: 'de 2 à 4 titres de colonnes — ce sont eux qui organisent la pensée, soigne-les. '
                    + `IMPÉRATIF : ${MAX_TITRE_COLONNE} CARACTÈRES MAXIMUM chacun, espaces compris. `
                    + 'Écris « Je sais » et non « Ce que je sais déjà ».',
        },
        longs: ['intro'],
        listes: ['colonnes'],
        construire: construireMurNotes,
    },

    // ─── Modules natifs ouverts le 27 sept. 2026 (`modules-natifs.js`, D70) ───
    //
    // Relevés sur deux exports authentiques du même soir (Éléa et Magistère,
    // Moodle 5.1.7), remplis de tous les types de chaque palette. Ils vivent
    // dans leur propre fichier ; le registre, lui, reste unique.
    ...MODULES_NATIFS,
};

/**
 * Les modules Moodle qui ne portent AUCUN critère d'achèvement une fois posés.
 *
 * L'ouverture progressive les tient hors de ses conditions (D71) : « avoir
 * terminé » une activité qui ne se termine jamais fermerait l'étape suivante
 * pour toujours. L'étiquette en est depuis le début ; les modules natifs qui y
 * entrent sont ceux que la plateforme livre elle-même sans achèvement (wiki,
 * document collaboratif, Etherpad, partage de fichiers) ou qui attendent un
 * geste de l'enseignant (atelier, classe virtuelle, choix de groupe).
 */
export const MODULES_SANS_ACHEVEMENT = Object.freeze(new Set([
    'label',
    ...Object.values(MODULES_NATIFS).filter(m => m.sansAchevement).map(m => m.moduleName),
]));

/** Les noms de module Moodle apportés par le parcours. */
export const NOMS_MODULE_PARCOURS = Object.freeze(
    Object.values(MODULES_PARCOURS).map(m => m.moduleName));

/**
 * Cette clé est-elle un module propre au parcours ?
 * @param {string} cle
 * @returns {boolean}
 */
export function estModuleParcours(cle) {
    return Object.prototype.hasOwnProperty.call(MODULES_PARCOURS, cle);
}

/**
 * Les modules de parcours proposables sur une plateforme.
 * Même forme que `activity-router.modulesDisponibles()`, pour se fondre dans la
 * palette sans que l'appelant ait à distinguer les deux origines.
 *
 * @param {string} plateforme - Nom tel qu'il figure dans `definitions.js`.
 * @returns {Array<{cle:string, englishName:string, nom:string, categories:string[]}>}
 */
export function modulesParcoursPour(plateforme) {
    return Object.entries(MODULES_PARCOURS)
        .filter(([, m]) => m.platforms.includes(plateforme))
        .map(([cle, m]) => ({
            cle,
            englishName: m.moduleName,
            nom: t(m.nameKey),
            categories: ['parcours'],
        }));
}

/**
 * Fabrique le dossier d'activité d'un module de parcours.
 *
 * Ne produit QUE `<mod>.xml` et `module.xml` : le constructeur de cours complète
 * lui-même le jeu standard (`roles`, `calendar`, `filters`, `grades`,
 * `inforef`…) avec des fichiers vides mais valides — c'est exactement ce qu'il
 * faut pour un module qu'on ne note pas.
 *
 * @param {string} cle - Clé du registre.
 * @param {Object} donnees - Le JSON produit par le modèle.
 * @param {Object} [options]
 * @param {number} [options.timestamp]
 * @param {number} [options.visible=1] - 0 pour une activité cachée aux élèves
 *        (l'étiquette « À faire » de l'enseignant, D72).
 * @returns {{files:Object<string,string>, moduleName:string, activityDir:string}}
 * @throws {Error} `parcours_module_inconnu:<clé>`
 */
export function construireActiviteParcours(cle, donnees, { timestamp, visible = 1 } = {}) {
    const def = MODULES_PARCOURS[cle];
    if (!def) throw new Error(`parcours_module_inconnu:${cle}`);

    const ts = timestamp || Math.floor(Date.now() / 1000);
    const { moduleName, xml, completionview, completionPropre, paquet } = def.construire(donnees || {}, ts);
    const activityDir = `activities/${moduleName}_${ID}`;

    return {
        files: {
            [`${activityDir}/${moduleName}.xml`]: xml,
            [`${activityDir}/module.xml`]: moduleXml(moduleName, ts, { completionview, completionPropre, visible }),
        },
        moduleName,
        activityDir,
        // Les fichiers propres au module (Paquetage IMS) : posés APRÈS
        // l'assemblage, le constructeur partagé refusant une activité à fichiers.
        ...(paquet ? { paquet } : {}),
    };
}
