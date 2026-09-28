/**
 * @file Parcours — la Carte de progression (`mod_mapmodules`, Éléa seul).
 *
 * **Le seul module qui donne à voir un parcours comme un parcours.** Il dessine
 * un chemin sur une image, y pose une icône par activité, et fait changer
 * l'icône selon que l'élève a terminé ou non. Tous les autres modules d'un
 * cours montrent une liste ; celui-ci montre un trajet.
 *
 * ## Ce n'est PAS une carte du plan
 *
 * Elle ne vit pas dans `modules-parcours.js`, et c'est délibéré. Ce registre
 * décrit les modules dont le MODÈLE écrit le contenu, et que le plan peut donc
 * proposer comme étape. La Carte n'a rien à faire écrire — son seul texte est
 * l'objectif général, déjà rédigé — et elle ne doit surtout pas entrer dans la
 * palette : le modèle en poserait une par étape, alors qu'une seule montre déjà
 * tout le parcours, et il lui donnerait un titre de son cru — ce qui, on va le
 * voir, ferait échouer l'import du cours entier.
 *
 * Elle est donc la COUVERTURE du parcours : une, en section 0, décidée par
 * l'enseignant sur l'écran du plan. Elle ne compte pas dans le plafond de douze
 * activités, puisqu'elle n'en consomme aucune génération.
 *
 * ## Trois contrats du greffon, tous lus dans son code
 *
 * Relevés dans `moodle-code/elea/mod_mapmodules` (la forge), et non devinés :
 *
 * 1. **Le NOM de l'activité est le sélecteur d'image.** `get_map_src()` fait
 *    `explode(' : ', $name)` et n'accepte que `Carte standard : <thème>` ou
 *    `Carte personnalisée : <fichier>` ; tout le reste lève une `Exception`
 *    PHP. Or cette fonction est appelée PENDANT la restauration : l'exception
 *    n'y dégrade pas la carte, elle interrompt l'import du COURS ENTIER, comme
 *    le `char(20)` du mur de post-it. Le nom n'est donc pas un titre : c'est un
 *    identifiant, et il n'est jamais rédigé. Le titre que l'enseignant veut
 *    donner à sa carte va dans `descriptionheader`, qui s'affiche au-dessus.
 *
 * 2. **L'`intro` est régénérée AU RESTORE, pas au premier enregistrement.**
 *    C'était la dernière inconnue du module.
 *    `restore_mapmodules_stepslib.php:process_mapmodules()` insère
 *    l'enregistrement, puis appelle `get_game_source_code()` avec le contextid
 *    tout neuf et met à jour la ligne — dans la même transaction. Ce que nous
 *    écrivons dans `<intro>` est donc jeté. On pose une intro VIDE : y recopier
 *    le HTML d'un export, avec ses cinq URLs absolues vers un site que Caramel
 *    ne connaît pas, serait écrire une contrevérité qui ne tiendrait que par
 *    chance.
 *
 * 3. **`targetsection` est un RANG de section, pas un identifiant.** Le relevé
 *    initial supposait un `id` de base de données, ce qui était l'inquiétude
 *    principale du module. `mapmodules_get_modules_from_section()` interroge en
 *    réalité `WHERE section = '<rang>'`, et le formulaire construit sa liste
 *    avec `mapmodules_extract_sections_fix()`, indexée par `->section`. La
 *    valeur `666` est la constante `ALL_SECTIONS_NUM` du greffon — « Toutes les
 *    sections ». Elle ne désigne donc rien à remapper, ce qui explique qu'elle
 *    traverse la restauration intacte, et elle donne exactement ce qu'un
 *    parcours veut : un seul chemin, toutes étapes confondues.
 *
 * ## Ce que la carte affiche — et ce qu'elle n'affiche pas
 *
 * `mapmodules_get_json_modules()` retient une activité à deux conditions :
 * elle n'est ni un `label` ni une autre carte (`$excludedModules`), et le SUIVI
 * D'ACHÈVEMENT est actif sur elle (`if ($completion->is_enabled($cm))`). Le
 * cours que Caramel produit déclare `enablecompletion = 1` et toutes ses
 * activités portent `completion: 2`, donc elles apparaissent toutes. En
 * revanche seules celles dont l'achèvement a une CONDITION réelle peuvent
 * passer au vert : aujourd'hui les H5P et le Test (achèvement sur note). Les
 * autres resteront au point d'interrogation tant que l'achèvement d'activité
 * n'aura pas été traité pour lui-même — c'est le prochain chantier du lot 2, et
 * la Carte est ce qui le rend visible.
 *
 * @module parcours/carte-progression
 */

import { activiteXml, moduleXml, nom, html, ID } from './modules-parcours.js';
import { THEME_DEFAUT, themeSur } from './cartes-standard.js';
import { relireImageCarte, traceCartePersonnelle, NOM_FOND_CARTE } from './carte-image.js';

/**
 * Sentinelle « Toutes les sections » du greffon (`ALL_SECTIONS_NUM`, lib.php).
 *
 * Ce n'est ni un identifiant ni un vestige : c'est la valeur que prend le menu
 * déroulant « Section visée » du formulaire quand on choisit « Toutes les
 * sections ». Posée sur une carte de section 0, elle fait figurer TOUT le
 * parcours sur un seul chemin.
 */
export const TOUTES_LES_SECTIONS = 666;

/** Grammaire imposée par `get_map_src()` — voir le point 1 de l'en-tête. */
const PREFIXE_NOM = 'Carte standard : ';

/**
 * Le nom d'activité d'une carte standard.
 *
 * Passe par `nom()` comme tout nom d'activité — la colonne `mapmodules.name`
 * est un `char(255)`, et aucun nom de thème n'en approche, mais le plafond se
 * pose là où il se pose pour les autres modules plutôt que d'être supposé
 * inatteignable.
 *
 * @param {string} theme - Nom de thème du catalogue.
 * @returns {string} Déjà échappé pour le XML.
 */
export function nomCarte(theme) {
    return nom(`${PREFIXE_NOM}${themeSur(theme).nom}`);
}

/**
 * La plateforme visée propose-t-elle la Carte de progression ?
 *
 * **Constaté, pas déduit** (D26) : `mapmodules` figure dans la palette « Ajouter
 * une activité » d'Éléa (35 tuiles, relevé du 4 sept. 2026) et pas dans celle de
 * Magistère (29 tuiles). Proposer la carte ailleurs produirait un `.mbz` dont
 * l'import échoue, après la génération, sans que l'enseignant puisse comprendre
 * pourquoi.
 *
 * @param {string} platformId - `elea` | `magistere` | `moodle`
 * @returns {boolean}
 */
export function carteDisponible(platformId) {
    return platformId === 'elea';
}

/**
 * L'état par défaut de la carte dans un plan neuf.
 *
 * **Décochée**, tant que l'aller-retour réel n'a pas eu lieu (D24). Le mode
 * d'échec du module n'est pas une carte laide, c'est un import de cours perdu :
 * l'imposer par défaut ferait porter ce risque à tout le monde pour un gain
 * d'agrément. À rouvrir une fois le module éprouvé sur la plateforme.
 *
 * @returns {{actif:boolean, theme:string}}
 */
export function carteParDefaut() {
    return { actif: false, theme: THEME_DEFAUT };
}

/**
 * Normalise le réglage de carte d'un plan, d'où qu'il vienne.
 *
 * Un scénario rouvert des mois plus tard peut porter un thème disparu du
 * catalogue amont : `themeSur()` le ramène au thème par défaut plutôt que de le
 * laisser passer vers un import qui échouerait.
 *
 * @param {*} brut
 * @returns {{actif:boolean, theme:string}}
 */
export function normaliserCarte(brut) {
    if (!brut || typeof brut !== 'object') return carteParDefaut();
    return {
        actif: Boolean(brut.actif),
        theme: themeSur(brut.theme).nom,
        ...(brut.personnalisee ? { personnalisee: true } : {}),
        ...(brut.image ? { image: relireImageCarte(brut.image) } : {}),
    };
}

/**
 * La carte doit-elle être posée pour ce plan et cette plateforme ?
 *
 * Trois conditions, et la troisième mérite d'être dite : **une carte sans
 * chemin n'est pas une carte.** Si aucune activité n'a abouti, la carte
 * dessinerait un tracé vide au-dessus d'un cours vide — mieux vaut ne rien
 * poser du tout.
 *
 * @param {Object} plan
 * @param {string} platformId
 * @param {number} nbActivites - Activités réellement retenues pour le `.mbz`.
 * @returns {boolean}
 */
export function carteAPoser(plan, platformId, nbActivites) {
    const carte = plan && plan.carte;
    return Boolean(carte && carte.actif) && carteDisponible(platformId) && nbActivites > 0;
}

/**
 * Fabrique le dossier d'activité de la Carte de progression.
 *
 * Ne produit que `mapmodules.xml` et `module.xml` : le constructeur de cours
 * complète lui-même le jeu standard (`roles`, `calendar`, `filters`, `grades`,
 * `inforef`…) avec des fichiers vides mais valides, ce qui convient à un module
 * qu'on ne note pas.
 *
 * Le seul texte que l'enseignant retrouve est `descriptionheader`, alimenté par
 * l'**objectif général du parcours** — déjà rédigé, déjà relu par les six
 * garde-fous, et déjà dans sa langue. Le faire écrire par le modèle coûterait un
 * appel de plus pour réécrire ce qui existe. `descriptionfooter` reste vide :
 * rien n'a été relevé qui doive s'afficher SOUS un chemin.
 *
 * @param {Object} plan - Le plan du parcours (pour son objectif général).
 * @param {Object} [options]
 * @param {number} [options.timestamp] - Epoch en secondes (injecté par les tests).
 * @returns {{files:Object<string,string>, moduleName:string, activityDir:string, title:string}}
 */
export function construireCarteProgression(plan, { timestamp } = {}) {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const theme = themeSur(plan && plan.carte && plan.carte.theme);
    const personnelle = Boolean(plan?.carte?.personnalisee);
    const image = personnelle ? relireImageCarte(plan.carte.image) : null;
    if (personnelle && !image?.dataURL) throw new Error('parcours_carte_perso_manquante');
    const titre = personnelle ? `Carte personnalisée : ${NOM_FOND_CARTE}` : `${PREFIXE_NOM}${theme.nom}`;
    const moduleName = 'mapmodules';
    const activityDir = `activities/${moduleName}_${ID}`;
    const entete = String((plan && plan.objectifGeneral) || '').trim();

    // `displaymodulenames` est écrit en dur à 0 : le seul thème du catalogue
    // amont qui le passe à 1 est `khan`, écarté de `cartes-standard.js` parce
    // qu'il bascule le greffon sur un second moteur de rendu non éprouvé.
    const xml = activiteXml(moduleName, `  <mapmodules id="${ID}">
    <course>${ID}</course>
    <name>${nom(titre)}</name>
    <intro></intro>
    <introformat>1</introformat>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <targetsection>${TOUTES_LES_SECTIONS}</targetsection>
    <path>${personnelle ? traceCartePersonnelle(image) : theme.trace}</path>
    <iconset>${personnelle ? 10 : theme.iconset}</iconset>
    <displaymodulenames>0</displaymodulenames>
    <buttonwidth>${personnelle ? 50 : theme.largeur}</buttonwidth>
    <descriptionheader>${entete ? html(entete) : ''}</descriptionheader>
    <descriptionheaderformat>1</descriptionheaderformat>
    <descriptionfooter></descriptionfooter>
    <descriptionfooterformat>1</descriptionfooterformat>
  </mapmodules>`);

    return {
        files: {
            [`${activityDir}/${moduleName}.xml`]: xml,
            // `showdescription: 1` — la carte EST la description de l'activité :
            // sans cela elle ne s'afficherait qu'en ouvrant un lien, ce qui lui
            // retirerait sa raison d'être. C'est aussi ce que pose le formulaire
            // du greffon, qui écrit ce champ en champ caché à 1.
            // `completionview: 0` (donc `completion: 0`) — on ne « termine » pas
            // une carte : elle montre l'avancement des autres, elle n'en a pas.
            // C'est ce que déclare l'export authentique d'Éléa, et c'est aussi ce
            // qui la tient hors de sa propre liste.
            [`${activityDir}/module.xml`]: moduleXml(moduleName, ts, {
                completionview: 0,
                showdescription: 1,
            }),
        },
        moduleName,
        activityDir,
        title: titre,
    };
}
