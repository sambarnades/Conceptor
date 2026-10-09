/**
 * @file Parcours — configuration centrale.
 *
 * Donnée pure, SANS import : importer ce fichier ne tire aucune dépendance.
 * C'est aussi le SEUL point de couplage avec l'application principale — si
 * Caramel renomme un identifiant de champ, c'est ici (et nulle part ailleurs)
 * qu'il faut le refléter.
 *
 * @module parcours/config
 */

export const CONFIG = {
    version: '0.1.0',

    /**
     * Partage d'un parcours vers La Sucrerie (D67). Coupé : le bouton « Vers la
     * Sucrerie » reste construit et câblé, mais masqué, dans la livraison de
     * l'atelier comme dans la modale de sa notification. Côté Sucrerie, les
     * collections en parcours se développent sans être montrées au public ;
     * passer à `true` le jour où les deux côtés sont prêts.
     */
    partageSucrerie: false,

    /** Clé de brouillon dans sessionStorage (préfixe `caramel_` imposé par le projet). */
    storageKey: 'caramel_parcours_draft',

    /** Les quatre étapes de l'atelier, dans l'ordre. */
    steps: [
        { id: 'cadrage',     labelKey: 'parcours_step_cadrage' },
        { id: 'plan',        labelKey: 'parcours_step_plan' },
        { id: 'fabrication', labelKey: 'parcours_step_fabrication' },
        { id: 'livraison',   labelKey: 'parcours_step_livraison' },
    ],

    /**
     * Plateformes cibles. `moduleFilter` est la valeur telle qu'elle apparaît
     * dans le tableau `platforms` de `core/definitions.js` : c'est elle qui
     * contraindra la palette d'activités proposées à l'étape suivante.
     */
    platforms: [
        /* { id: 'elea',      moduleFilter: 'Éléa',      nameKey: 'parcours_platform_elea',      descKey: 'parcours_platform_elea_desc' },
        { id: 'magistere', moduleFilter: 'Magistère', nameKey: 'parcours_platform_magistere', descKey: 'parcours_platform_magistere_desc' }, */
        { id: 'moodle',    moduleFilter: 'Moodle',    nameKey: 'parcours_platform_moodle',    descKey: 'parcours_platform_moodle_desc' },
    ],

    /**
     * Modalité de déroulement — nourrit le prompt de plan et le choix des activités.
     * `platformLabels` adapte seulement le vocabulaire de l'interface : le public
     * du parcours reste celui que la personne renseigne dans le formulaire.
     */
    formats: [
        { id: 'presentiel', nameKey: 'parcours_format_presentiel', descKey: 'parcours_format_presentiel_desc',
          platformLabels: {
              magistere: { nameKey: 'parcours_format_presentiel_sur_place', descKey: 'parcours_format_presentiel_desc_magistere' },
              moodle: { nameKey: 'parcours_format_presentiel_sur_place', descKey: 'parcours_format_presentiel_desc_moodle' },
          } },
        { id: 'distanciel', nameKey: 'parcours_format_distanciel', descKey: 'parcours_format_distanciel_desc' },
        { id: 'hybride',    nameKey: 'parcours_format_hybride',    descKey: 'parcours_format_hybride_desc',
          platformLabels: {
              magistere: { descKey: 'parcours_format_hybride_desc_distance' },
              moodle: { descKey: 'parcours_format_hybride_desc_distance' },
          } },
    ],

    /**
     * Ampleur du parcours. On raisonne en SÉANCES, pas en minutes : c'est
     * l'unité dans laquelle un enseignant pense réellement. `activites` borne
     * le nombre d'activités que le plan pourra proposer — le plafond de 12 est
     * une limite dure (au-delà, le temps de fabrication et la cohérence du
     * contexte partagé se dégradent tous les deux).
     */
    ampleurs: [
        { id: 'courte',  nameKey: 'parcours_ampleur_courte',  descKey: 'parcours_ampleur_courte_desc',  activites: [3, 4] },
        { id: 'moyenne', nameKey: 'parcours_ampleur_moyenne', descKey: 'parcours_ampleur_moyenne_desc', activites: [5, 8] },
        { id: 'longue',  nameKey: 'parcours_ampleur_longue',  descKey: 'parcours_ampleur_longue_desc',  activites: [9, 12] },
    ],

    /**
     * Tous les élèves suivent-ils le même chemin ? (D91) « Des chemins selon les
     * résultats » ouvre, après un test, un chemin par groupe de résultats ; le
     * nombre de chemins se choisit juste en dessous.
     */
    structures: [
        { id: 'lineaire', nameKey: 'parcours_structure_lineaire', descKey: 'parcours_structure_lineaire_desc' },
        { id: 'chemins',  nameKey: 'parcours_structure_chemins',  descKey: 'parcours_structure_chemins_desc' },
    ],

    /** Nombre de chemins proposé au cadrage. */
    nombresDeChemins: [2, 3, 4],

    /** Valeurs par défaut d'un nouveau brouillon. */
    defaults: {
        platform: 'elea',
        format: 'distanciel',
        ampleur: 'moyenne',
        trame: 'auto',
        structure: 'lineaire',
        chemins: 3,
    },

    /**
     * Sélecteurs DOM de l'application principale. Le contexte est REPRIS de ces
     * champs : l'utilisateur ne ressaisit jamais ce qu'il a déjà tapé.
     */
    caramelSelectors: {
        qui: '#qui',
        quoi: '#quoi',
        niveau: '#niveau',
        // Corpus unifié du mode avancé : tout ce que l'enseignant dépose
        // (PDF, image océrisée, page web, transcription vidéo) y converge en
        // texte. C'est la source que lit déjà `services/rag-orchestrator.js`.
        corpus: '#ocr-output',
        // Étiquettes des pièces jointes (nom + couleur), posées par ocr.js —
        // et la zone qui les reçoit, guettée pendant le cadrage pour que la
        // note des documents joints suive un dépôt fait après coup.
        sourceTags: '#pdf-tags-container .pdf-tag',
        sourceNom: '.filename',
        zoneSources: '#pdf-tags-container',
        // L'atelier vit DANS la page (D39) : il est inséré dans `hote` à la
        // place des blocs `remplaces` — la barre de filtres et la grille des
        // tuiles —, qui s'effacent le temps qu'il est ouvert. Le formulaire
        // au-dessus (qui, quoi, Rapide/Avancé, pièces jointes) reste en place
        // et continue de vivre : c'est LUI le formulaire de l'atelier.
        hote: '#main-content',
        remplaces: ['.filter-bar', '.activity-grid'],
        // Choix du résultat après le formulaire complet, documents compris (D63).
        entreeApres: '.prompt-generator',
        barre: '.app-bar',
    },
};
