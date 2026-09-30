/**
 * @file Parcours — prompt de plan.
 *
 * Un appel, avec une reprise ciblée au plus si le contrat est dépassé, produit le scénario complet AVANT toute génération de
 * contenu. C'est la moitié « plan » du motif que `services/llm-batch.js`
 * applique déjà à une liste de questions ; ici on l'applique à un cours.
 *
 * Deux exigences le distinguent d'un prompt d'activité ordinaire :
 *
 *  1. **Les notions pivots.** Le plan doit renvoyer des notions adaptées à l’ampleur avec LA
 *     formulation retenue. Elles seront réinjectées dans chaque remplissage
 *     ultérieur, sans quoi on obtient N activités sans rapport : le vocabulaire
 *     dérive d'un exercice à l'autre et la troisième réexplique ce que la
 *     première avait posé.
 *
 *  2. **Une liste CLOSE de modules.** Le modèle choisit parmi ce qui existe
 *     réellement pour la plateforme visée (cf. `activity-router.js`), jamais
 *     librement — un identifiant inventé casserait la fabrication.
 *
 * @module parcours/scenario-prompt
 */

import { t, currentLang } from '../core/translation.js';
import { langueEnseignee } from '../core/content-language.js';
import { CONFIG } from './config.js';
import { calibrer } from './calibrage.js';
import { modulesDisponibles, nomModule, moduleDeTrame } from './activity-router.js';
import { MODULES_PARCOURS, estModuleParcours } from './modules-parcours.js';
import { retoursImpersonnels } from './retours-impersonnels.js';

/** Longueur de corpus au-delà de laquelle on tronque avant envoi. */
const CORPUS_MAX = 12000;

/**
 * La langue de rédaction : celle de l'interface, sauf pour une séquence de langue vivante,
 * où ce que lit l'élève passe dans la langue enseignée — la même règle que
 * `prompt_regles_pedagogiques_communes`, que suivent les cartes. Sans elle, un parcours
 * d'anglais sortait en français (retour de professeurs d'anglais, 29 sept. 2026).
 */
const regleLangue = (langue, contexte = {}) => {
    const enseignee = langueEnseignee(contexte);
    if (enseignee) {
        return `- LANGUE OBLIGATOIRE : rédige en ${enseignee} TOUS les textes lus par l’élève — titres, introductions, contenus, questions, réponses, retours et notions pivots. Cette règle prime la langue de l’interface et les exemples. Garde les clés JSON, identifiants et valeurs d’énumération inchangés. Les objectifs pédagogiques destinés à l’enseignant peuvent rester en ${langue}.`;
    }
    return `- Rédige TOUS les textes en ${langue}.`;
};

/** Noms de langue pour la consigne de rédaction (le modèle lit mieux l'anglais ici). */
const LANGUES = {
    fr: 'French', en: 'English', es: 'Spanish', de: 'German', it: 'Italian',
    nl: 'Dutch', pt: 'Portuguese', ar: 'Arabic', zh: 'Chinese', jp: 'Japanese',
    el: 'Greek', br: 'Breton',
};

/**
 * Règles de rédaction communes au plan et à chaque activité.
 *
 * Nées d'un parcours réel de formation d'enseignants (28 sept. 2026) : le
 * modèle avait recopié le jargon de ses propres instructions dans les textes
 * lus par les stagiaires (« les notions pivots du parcours, à employer MOT POUR
 * MOT »), et une activité tutoyait quand toutes les autres vouvoyaient — chaque
 * carte est rédigée par un appel distinct, qui choisissait seul son registre.
 * Le registre se déduit donc du public, par la même règle pour toutes.
 *
 * @param {Object} ctx - Le contexte du brouillon.
 * @returns {string[]}
 */
export function reglesDeRedaction(ctx = {}) {
    return [
        `- Dans ces instructions, « l'élève » désigne la personne qui suit le parcours${ctx.niveau ? ` (public visé : ${ctx.niveau})` : ''}. ` +
        'Si ce sont des adultes en formation, ne les appelle jamais « élèves » : écris « vous », « les participants » ou « les collègues » ' +
        '(les élèves dont ils parlent restent des élèves).',
        '- Registre : tutoiement pour des élèves, vouvoiement pour des adultes (formation d’enseignants, formation continue, études supérieures). ' +
        'Le MÊME registre dans tous les textes du parcours, retours et commentaires par tranche de score compris : ' +
        'les exemples de ces instructions tutoient, adapte-les au registre choisi.',
        '- Aucun texte lu par les participants ne reprend le vocabulaire de ces instructions : jamais « notions pivots », « mot pour mot », ' +
        '« palier », « carte », « trame », « socle » ni « version longue ».',
    ];
}

/**
 * Une carte qui porte sur autre chose que le sujet du parcours — la façon
 * d'apprendre, un bilan — garde son objet : sur un parcours réel (28 sept. 2026,
 * D82), un vrai/faux « sur les méthodes de révision » puis un questionnaire
 * « quelles méthodes garderas-tu ? » interrogeaient la Révolution française.
 */
const CONTENU_SUIT_LA_COMMANDE = 'Le contenu suit la commande de cette activité (objectif, consigne, titre) : si elle porte sur une méthode de travail, ' +
    'la façon d’apprendre ou un bilan, TOUTES ses questions portent sur cela : aucune ne porte sur le sujet du parcours, qui ne sert qu’à donner des exemples.';

// Consignes internes au modèle, jamais affichées. Les noms visibles viennent
// de nomModule()/t(). Les textes pédagogiques suivent la langue demandée.
const USAGES_PLAN = {
    InteractiveVideo: 'Vidéo choisie par l’enseignant via son URL ; source à fournir avant génération, transcription puis questions horodatées. Proposer seulement si la demande porte explicitement sur une vidéo.',
    ImageHotspots: 'Image choisie par l’enseignant, enrichie de points et explications ; image à joindre avant génération. Proposer seulement si une image ou un document visuel est demandé.',
    FindTheHotspot: 'Cliquer une zone correcte sur une image à fournir par l’enseignant ; demander la source avant génération.',
    FindMultipleHotspots: 'Cliquer plusieurs zones correctes sur une image à fournir par l’enseignant ; demander la source avant génération.',
    Page: 'Page de lecture, sans champ de réponse. Pour faire écrire ou remettre en ordre à l’écran, choisir le module adapté ; un travail sur papier doit être explicitement annoncé.',
    Livre: 'Chapitres à lire, sans champ de réponse ; les exercices à réaliser à l’écran doivent utiliser une activité distincte.',
    TrueFalse: 'UNE affirmation, avec choix vrai/faux et correction automatique. Pour plusieurs affirmations, choisir QuizSetVF.',
    FillInTheBlanks: 'Saisir les mots ou nombres manquants AU CLAVIER dans un texte ; aucun menu déroulant ni liste de choix interactive.',
    Timeline: 'Frise à CONSULTER : événements déjà placés. Pour remettre des événements en ordre, choisir SortParagraphs.',
    Chart: 'Graphique à LIRE, construit depuis les données fournies ; aucune saisie de données par l’apprenant.',
    DialogCards: 'Cartes recto-verso à retourner pour comparer et réviser ; aucun appariement par glisser-déposer.',
    Summary: 'Choisir l’affirmation correcte parmi plusieurs propositions pour construire une synthèse ; pas de texte à trous.',
    Glossary: 'Lexique de définitions à consulter ; les apprenants ne complètent pas les entrées.',
    CoursePresentation: 'Diaporama de textes et questions intégrées ; pas de vidéo à regarder ni de média fourni automatiquement.',
    InteractiveBook: 'Livre de textes et exercices intégrés ; pas de vidéo ou de média fourni automatiquement.',
    DragAndDrop: 'Déplacer des étiquettes textuelles dans des zones ; ne pas exiger un schéma ou des images absents.',
    Crossword: 'Retrouver des MOTS à partir de définitions ; pas de résultats chiffrés dans la grille.',
    parcours_etiquette: 'Texte ou consigne affichés dans le cours ; aucun champ de réponse. Ne pas l’employer pour accueillir ou introduire une étape : les champs `introduction` s’en chargent sans consommer d’activité.',
    parcours_forum: 'Consigne d’un échange asynchrone ; les participants écriront ensuite, pas de discussion préremplie.',
    parcours_sondage: 'Une question et quelques réponses au choix ; la classe voit le résultat après le vote. Idéal pour recueillir les avis ou les représentations en un clic.',
    parcours_nuage_mots: 'Chacun tape un à cinq mots en réponse à une question ; le nuage montre ce que la classe a en tête. En ouverture ou en clôture.',
    parcours_mur_notes: 'Des colonnes préparées où chacun dépose des notes : trier ses idées, faire le point à plusieurs.',
    parcours_lien: 'Lien vers une ressource web choisie par l’enseignant (article, site, document en ligne) ; son adresse est demandée sur la carte avant génération. Proposer seulement si une ressource en ligne est mentionnée ou utile.',
    parcours_questionnaire: 'Questions d’opinion ou de diagnostic (choix, oui/non, réponse libre), sans note ; pour faire le point sur ce que les élèves savent ou pensent.',
    parcours_enquete: 'Enquête anonyme de fin de séquence : ressenti, difficultés, suggestions. Sans note.',
    parcours_lecon: 'Leçon guidée page par page : des pages à lire, certaines terminées par une question qui ne laisse passer qu’avec la bonne réponse.',
    parcours_atelier: 'Production individuelle PUIS évaluation par les pairs avec une grille de critères ; l’enseignant fait avancer les phases. Pour un travail qui gagne à être relu par d’autres.',
    parcours_tableau: 'Tableau à colonnes où les élèves déposent des notes : recueillir, classer, comparer à plusieurs.',
    parcours_wiki: 'Texte écrit à plusieurs mains, que chacun complète et améliore ; arrive vide.',
    parcours_glossaire: 'Glossaire que la classe construit : chacun y ajoute une définition ; arrive vide.',
    parcours_document: 'Document partagé rédigé en groupe dans un traitement de texte en ligne, à partir d’un plan de départ.',
    parcours_etherpad: 'Bloc-notes partagé pour une prise de notes collective, en direct ou non.',
    parcours_depot: 'Espace où chaque élève dépose des fichiers (photos, productions) consultables ensuite par la classe.',
    parcours_classe_virtuelle: 'Séance en visioconférence avec l’enseignant, à planifier ; à ne proposer que si un temps synchrone à distance est prévu.',
    parcours_base: 'Collection de fiches que chaque élève remplit selon des rubriques communes (observations, lectures, recherches).',
    parcours_choix_groupe: 'Chaque élève choisit son groupe ; l’enseignant crée les groupes sur la plateforme. Avant un travail en équipe.',
    Devoir: 'Consigne et critères d’un travail à remettre ou réaliser ; pas de correction automatique immédiate.',
};

function libelle(liste, id) {
    const e = liste.find(x => x.id === id);
    return e ? t(e.nameKey) : id;
}

/**
 * Construit le prompt de plan.
 *
 * @param {Object} draft - Le brouillon de `state.js` (contexte déjà lu).
 * @returns {{prompt:string, calibrage:Object, modules:Array}}
 */
export function construirePromptPlan(draft) {
    const ctx = draft.contexte || {};
    const calibrage = calibrer(draft);
    // Un module réservé à certaines modalités (la classe virtuelle n'a pas de
    // sens en présentiel) n'est pas même proposé au modèle hors de celles-ci.
    // Un module « sur demande » (le Paquetage IMS) ne se choisit que dans la mosaïque.
    const modules = modulesDisponibles(draft.platform)
        .filter(m => !MODULES_PARCOURS[m.cle]?.surDemande)
        .filter(m => !MODULES_PARCOURS[m.cle]?.formats || MODULES_PARCOURS[m.cle].formats.includes(draft.format));
    const langue = LANGUES[currentLang] || 'French';

    const catalogue = modules
        .map(m => `- ${m.cle} : ${m.nom} (${m.englishName})${USAGES_PLAN[m.cle] ? ' — ' + USAGES_PLAN[m.cle] : ''}`)
        .join('\n');

    const lignes = [];

    lignes.push(
        "Tu es un concepteur pédagogique expérimenté. Tu prépares le PLAN d'un parcours " +
        "en ligne destiné à une plateforme Moodle (Éléa / Magistère). " +
        "Tu ne rédiges AUCUN contenu d'activité à ce stade : uniquement le déroulé."
    );

    lignes.push('\n## CONTEXTE');
    lignes.push(`Sujet : ${ctx.quoi || '(non précisé)'}`);
    if (ctx.qui) lignes.push(`L'enseignant : ${ctx.qui}`);
    if (ctx.niveau) lignes.push(`Public visé : ${ctx.niveau}`);
    lignes.push(`Plateforme : ${libelle(CONFIG.platforms, draft.platform)}`);
    lignes.push(`Modalité : ${draft.format}`);
    const modalites = {
        presentiel: 'Le groupe travaille en présence de l’enseignant. Inclure les échanges ou manipulations utiles dans les consignes et leur durée.',
        distanciel: 'Travail autonome à distance : consignes explicites, ressources suffisantes, retour permettant de comprendre ses erreurs. Aucun échange simultané ni correction immédiate par un enseignant requis.',
        hybride: 'Articuler explicitement des moments à distance et en présence : préciser où et quand se déroule chaque activité, et comment elle prépare la suivante.',
    };
    lignes.push(modalites[draft.format] || modalites.distanciel);
    lignes.push(`Ampleur : ${libelle(CONFIG.ampleurs, draft.ampleur)}`);

    if (calibrage.trame) {
        lignes.push(
            `\nTrame imposée : « ${t(calibrage.trame.nameKey)} » — ${t(calibrage.trame.descKey)}`
        );
        lignes.push(
            `Elle compte EXACTEMENT ${calibrage.etapesMin} étapes, contenant respectivement ` +
            `${calibrage.rythme.join(', ')} activité(s). Respecte ce découpage à la lettre.`
        );
        lignes.push(`Intention pédagogique : ${calibrage.trame.intention}`);
        if (Array.isArray(calibrage.trame.paliers)) {
            lignes.push(
                `Palier de difficulté imposé par étape : ${calibrage.trame.paliers.join(', ')}.`
            );
        }
        // Les types suggérés par la trame sont une PROPOSITION, pas un carcan :
        // le sujet peut appeler autre chose, et le modèle doit pouvoir le dire.
        lignes.push(
            'Types d\'activité suggérés par la trame, étape par étape : ' +
            calibrage.trame.modules.map((e, i) => `étape ${i + 1} → ${e.map(m => moduleDeTrame(m, draft.platform)).join(', ')}`).join(' ; ') +
            '. Suis-les sauf si le sujet appelle clairement autre chose.'
        );
    } else {
        lignes.push(
            `\nAucune trame imposée : choisis le déroulé le mieux adapté, entre ` +
            `${calibrage.min} et ${calibrage.max} activités AU TOTAL (pas par étape), réparties en ${calibrage.etapesMin} à ${calibrage.etapesMax} étapes non vides.`
        );
    }

    lignes.push(`\nBUDGET : ${calibrage.exemple.reduce((a, b) => a + b, 0)} activités prévues, dans la limite de ${calibrage.min} à ${calibrage.max} pour TOUT le parcours. Chaque carte consomme une place, y compris accueil, synthèse et évaluation. Une étape peut contenir UNE SEULE activité. Ne transforme pas les sous-tâches d’une activité en cartes supplémentaires.`);
    if (draft.ampleur === 'courte') lignes.push('Sauf durée explicite dans la demande ou la trame, viser une séance de 30 à 55 minutes de travail. Alléger les tâches plutôt que multiplier les exercices.');
    lignes.push('\n## MODULES AUTORISÉS');
    lignes.push(
        "Le champ `module` de chaque activité doit être l'un des identifiants ci-dessous, " +
        "recopié EXACTEMENT. N'invente aucun identifiant, n'en utilise aucun autre : " +
        "ceux qui ne figurent pas dans cette liste n'existent pas sur la plateforme visée."
    );
    lignes.push(catalogue);

    // Le corpus de l'enseignant PRIME sur toute connaissance générale : c'est sa
    // référence, et c'est aussi la règle qu'applique déjà `rag-orchestrator.js`.
    const corpus = (ctx.corpus || '').trim();
    if (corpus) {
        const extrait = corpus.length > CORPUS_MAX ? corpus.slice(0, CORPUS_MAX) + '\n[…]' : corpus;
        lignes.push('\n## DOCUMENTS FOURNIS PAR L\'ENSEIGNANT');
        lignes.push(
            "Ces documents FONT RÉFÉRENCE. Ancre le parcours sur eux : les notions pivots, " +
            "les exemples et la progression doivent en sortir, pas de tes connaissances générales."
        );
        lignes.push(extrait);
    }

    lignes.push('\n## CE QUE TU DOIS PRODUIRE');
    lignes.push([
        '1. `titre` : un titre de parcours court, sans guillemets.',
        '2. `objectifGeneral` : une phrase, formulée avec un verbe d\'action.',
        '2 bis. `introduction` : le texte d\'accueil affiché en tête du cours, adressé à l\'élève',
        '   (2 à 4 phrases) : ce qu\'il va apprendre, comment le parcours est organisé et comment s\'y prendre.',
        `3. \`notionsPivots\` : ${calibrage.notions[0]} à ${calibrage.notions[1]} termes clés utiles au sujet, sous forme de GROUPES`,
        '   NOMINAUX — le vocabulaire que l\'élève doit s\'approprier, pas ce qu\'il doit',
        '   savoir faire. Écris « le commerce triangulaire », « le Code noir »,',
        '   « les ports négriers » ; JAMAIS « Définir le commerce triangulaire » ni',
        '   « Expliquer le Code noir » : ces formulations-là sont des objectifs, elles',
        '   vont dans `objectif`. Toutes les activités du parcours réutiliseront ces',
        '   termes MOT POUR MOT — c\'est cet ancrage lexical qui fait la cohérence de',
        '   l\'ensemble, et un infinitif n\'ancre rien.',
        '4. `etapes` : chaque étape porte un `titre`, un `objectif` (verbe d\'action),',
        '   une `introduction` et ses `cartes`. L\'`introduction` est le texte que l\'élève lit en',
        '   arrivant sur l\'étape, avant ses activités (2 ou 3 phrases, deuxième personne) : ce qu\'il',
        '   va faire, pourquoi, et un conseil pour réussir. Elle fait le lien avec l\'étape précédente.',
        '   Texte simple, sans titre, sans liste ni mise en forme Markdown. Ce texte ne compte pas comme une activité.',
        '5. Chaque carte porte : `titre`, `objectif` (verbe d\'action, une ligne),',
        '   `module` (un identifiant de la liste), `palier` (decouverte | entrainement |',
        '   transfert), `duree` (minutes, entier), et `consigne` (une à deux phrases',
        '   disant ce que l\'élève aura à faire).',
    ].join('\n'));

    lignes.push('\n## RÈGLES');
    lignes.push([
        '- Choisis les activités en fonction de l’objectif : lire, enquêter, discuter, s’entraîner, coopérer ou produire selon le besoin. Aucun quota ni obligation de tout représenter.',
        '- Les modules de la plateforme (identifiants commençant par `parcours_` : forum, sondage, questionnaire, tableau, wiki, leçon, atelier…) sont des activités à part entière. Quand l’objectif appelle un échange, un recueil d’avis ou un travail collectif, emploie-les plutôt qu’une Page qui décrirait l’échange.',
        '- Le parcours comporte au moins une activité qui renvoie un résultat à l\'élève.',
        // Rappeler plus tard ce qu'on a vu au début, questions mélangées : les
        // deux effets les mieux établis sur la mémoire (état de l'art, D81).
        '- Une activité qui vérifie les acquis en fin de parcours porte sur l’ensemble du parcours, notions mélangées, et pas seulement sur la dernière étape : rappeler plus tard ce qu’on a vu au début aide à le retenir.',
        '- Respecte la logique pédagogique de la trame : un diagnostic peut précéder une explication, et une correction peut suivre une évaluation. Sans trame, construis une progression adaptée à l’objectif, sans imposer trois paliers à un simple rituel.',
        '- Les durées sont celles d\'un élève moyen, sans les gonfler pour remplir les séances. Repères : texte court à lire 5 à 10 min ; exercice auto-corrigé (vrai/faux, texte à trous, association) 3 à 8 min ; quiz de plusieurs questions ou test 10 à 20 min ; production écrite, projet ou échange 15 à 30 min.',
        ...reglesDeRedaction(ctx),
        regleLangue(langue, ctx),
        '- Les clés JSON, identifiants de modules et valeurs de `palier` restent EXACTEMENT tels que définis, sans traduction ni accent ajouté. Seuls les textes pédagogiques sont traduits.',
        '- La consigne doit correspondre au geste réellement permis par le module décrit dans le catalogue. Pour faire ORDONNER des événements, utiliser SortParagraphs ; Timeline sert à les CONSULTER.',
        '- Les activités exigeant une vidéo ou une image ne sont proposées que si la demande les justifie explicitement. La personne joindra la source sur la carte ; ne jamais inventer un lien ou prétendre avoir déjà analysé ce média.',
        '- Aucun média externe n’est ajouté automatiquement : ne demande pas de regarder une vidéo, une photo ou un schéma absent. Prévoir des ressources textuelles autonomes. Si une manipulation en présence nécessite du matériel, l’annoncer explicitement comme matériel à préparer.',
        '- Les objectifs décrivent une action observable dans la langue demandée, jamais un simple titre de leçon.',
        '- Un forum amorce un échange : il ne contient pas de réponses d’apprenants inventées. Une activité de groupe précise la tâche commune, sans prétendre configurer automatiquement les groupes de la plateforme.',
        // Constaté sur un parcours réel (28 sept. 2026) : trois Documents
        // collaboratifs pour UN texte (plan, version finale, version améliorée) —
        // chaque carte crée un espace NEUF, les équipes auraient recommencé à zéro.
        '- Un espace de travail commun (document collaboratif, wiki, tableau, base de données, forum) se POURSUIT : pour continuer, améliorer ou finaliser le même travail, n’en crée pas un second ; la consigne de l’activité suivante renvoie à cet espace, ou emploie un autre module (forum, atelier, devoir). Les règles d’un échange vont dans la consigne de son forum, pas dans un forum à part.',
        // Même parcours réel : une Page « Explication de ton choix » — qui ne
        // recueille rien. Le geste doit être celui que le module permet.
        '- Une Page, un Livre ou un Paquetage se LISENT : ils ne recueillent aucune réponse. Pour faire expliquer, justifier, répondre ou produire, choisis un module qui recueille (forum, questionnaire, rédaction, devoir, document collaboratif…). Un sondage recueille un vote, sans justification écrite : pour un vote justifié, un questionnaire.',
        // Même journée, formation Pix+Édu : un Test NOTÉ « sur vos pratiques »
        // (« lesquels de ces outils utilisez-vous ? ») — une habitude n'a pas de
        // bonne réponse, le stagiaire était noté faux sur sa propre pratique.
        '- Un test, un quiz ou tout exercice corrigé porte sur des connaissances qui ont une bonne réponse. Pour faire le point sur des pratiques, des habitudes, des besoins ou des opinions, choisis un questionnaire, une enquête ou un sondage, qui ne notent pas.',
        `- CONTRÔLE FINAL : ${calibrage.min} à ${calibrage.max} activités pour TOUT le parcours${calibrage.rythme ? ', répartition ' + calibrage.rythme.join(' + ') : ''}. N’ajoute pas une activité d’accueil ou de bilan hors de ce total.`,
    ].join('\n'));

    lignes.push('\n## FORMAT DE SORTIE');
    lignes.push(
        'Réponds UNIQUEMENT par un objet JSON valide, sans texte avant ni après, ' +
        'sans bloc de code markdown. Exemple de structure à adapter au sujet ; remplace tous les points de suspension :'
    );
    lignes.push(JSON.stringify({
        titre: '…',
        objectifGeneral: '…',
        introduction: '…',
        notionsPivots: Array.from({ length: calibrage.notions[0] }, () => '…'),
        etapes: calibrage.exemple.map((n, i) => ({
            titre: '…',
            objectif: '…',
            introduction: '…',
            cartes: Array.from({ length: n }, () => ({
                titre: '…',
                objectif: '…',
                module: modules[0] ? modules[0].cle : 'Page',
                palier: calibrage.trame?.paliers?.[i] || 'entrainement',
                duree: calibrage.trame?.id === 'rituel' ? [2, 4, 4][i] : 10,
                consigne: '…',
            })),
        })),
    }, null, 2));

    return { prompt: lignes.join('\n'), calibrage, modules };
}

/* ------------------------------------------------------------------ *
 *  Remplissage : le prompt d'UNE carte du plan
 * ------------------------------------------------------------------ */

/** Extrait de corpus joint envoyé avec chaque carte (plus court que pour le plan). */
const CORPUS_MAX_CARTE = 6000;

/** Consigne de densité selon le palier — un transfert n'est pas un échauffement. */
const DENSITE = {
    decouverte: { min: 3, max: 6 },
    entrainement: { min: 4, max: 8 },
    transfert: { min: 3, max: 6 },
};

/**
 * Nombre d'éléments demandé à une carte, déduit de sa durée.
 *
 * Le plan ne porte PAS de compte d'items : en poser un dans le tableau de bord
 * aurait été un réglage de plus à comprendre, pour une information que la durée
 * donne déjà. Une minute vaut à peu près un item, borné par le palier — un
 * exercice de transfert de vingt minutes n'a pas vingt questions, il en a peu
 * et de longues.
 *
 * @param {Object} carte
 * @returns {number}
 */
export function nbElementsCarte(carte) {
    const bornes = DENSITE[carte && carte.palier] || DENSITE.entrainement;
    const brut = Math.round((Number(carte && carte.duree) || 10) / 2);
    return Math.max(bornes.min, Math.min(bornes.max, brut));
}

/**
 * Le SOCLE COMMUN : ce que toute activité du parcours doit savoir des autres.
 *
 * C'est la pièce qui fait la différence entre « huit activités sur le même
 * thème » et « un parcours ». Sans elle, le vocabulaire dérive d'un exercice à
 * l'autre et la troisième réexplique ce que la première avait posé.
 *
 * Trois choses, et dans cet ordre : où l'on va, avec quels MOTS, et ce qui a
 * déjà été vu — assorti de la seule consigne qui compte : **réinvestis, ne
 * réintroduis pas**.
 *
 * @param {Object} plan
 * @param {Object} carte - La carte à remplir (exclue de l'historique).
 * @returns {string}
 */
export function construireSocleCommun(plan, carte, ctx = {}) {
    const lignes = [];

    lignes.push(`Cette activité fait partie d'un parcours intitulé « ${plan.titre || '(sans titre)'} ».`);
    if (plan.objectifGeneral) lignes.push(`Objectif du parcours : ${plan.objectifGeneral}`);

    if (Array.isArray(plan.notionsPivots) && plan.notionsPivots.length) {
        lignes.push('');
        // « Là où elles ont leur place » : sans cette réserve, le modèle plaquait
        // chaque notion partout, en gras, jusqu'à des phrases fausses (« les bonnes
        // pratiques de mots de passe ne sont pas appliquées » pour un podcast).
        lignes.push('VOCABULAIRE DU PARCOURS — quand tu parles de ces notions, emploie exactement ' +
            'ces formulations, sans les reformuler ni les traduire ; n\'en place aucune là où elle n\'a pas sa place :');
        lignes.push(plan.notionsPivots.map(n => `- ${n}`).join('\n'));
    }

    // L'historique s'arrête à la carte courante : une activité ne peut pas
    // « réinvestir » ce qui viendra après elle.
    const avant = [];
    let atteinte = false;
    for (const etape of (plan.etapes || [])) {
        for (const c of (etape.cartes || [])) {
            if (c === carte || c.id === carte.id) { atteinte = true; break; }
            avant.push({ etape: etape.titre || '', c });
        }
        if (atteinte) break;
    }

    if (avant.length) {
        lignes.push('');
        lignes.push('DÉJÀ TRAVAILLÉ par l\'élève dans les activités précédentes :');
        lignes.push(avant.map(({ etape, c }) =>
            `- ${etape ? `[${etape}] ` : ''}${c.titre || (c.contenu && c.contenu.title) || nomModule(c.module)}` +
            `${c.objectif ? ` — ${c.objectif}` : ''}`).join('\n'));
        lignes.push('');
        lignes.push('RÉINVESTIS ces acquis, ne les RÉINTRODUIS pas : ne redonne pas les mêmes ' +
            'définitions, ne repose pas les mêmes questions, ne reprends pas les mêmes exemples. ' +
            'Appuie-toi dessus pour aller plus loin.');
    } else {
        lignes.push('');
        lignes.push('C\'est la PREMIÈRE activité du parcours : elle pose les bases, ' +
            'sans supposer aucun acquis préalable sur le sujet.');
    }

    lignes.push('');
    lignes.push('RÉDACTION :');
    lignes.push(...reglesDeRedaction(ctx));

    return lignes.join('\n');
}

/**
 * Construit le prompt de remplissage d'UNE carte.
 *
 * Il réutilise le prompt d'activité de la page d'accueil — mêmes règles, même
 * structure JSON, même exemple de rendu, donc mêmes garanties pour le
 * processeur — et lui ajoute le cadre du parcours. Écrire un second jeu de
 * prompts « spécial parcours » aurait fabriqué deux qualités de sortie pour le
 * même type d'activité.
 *
 * @param {Object} draft - Le brouillon (contexte déjà lu).
 * @param {Object} carte - La carte du plan.
 * @returns {Promise<{prompt:string, prefix:string, nbElements:number}>}
 * @throws {Error} `parcours_module_sans_prompt:<module>` si le module n'a pas de prompt.
 */
export async function construirePromptRemplissage(draft, carte, source = null) {
    // Les modules propres au parcours — forum, sondage, étiquette — n'ont pas de
    // gabarit dans `prompt-generator.js` : ce ne sont pas des activités de la
    // page d'accueil. Ils ont le leur, plus court, juste en dessous.
    if (estModuleParcours(carte.module)) return construirePromptModuleParcours(draft, carte);

    const { buildActivityPrompt, prefixForModule } = await import('../services/prompt-generator.js');
    const prefix = prefixForModule(carte.module);
    if (!prefix) throw new Error(`parcours_module_sans_prompt:${carte.module}`);

    const plan = draft.plan || {};
    const ctx = draft.contexte || {};
    const nbElements = nbElementsCarte(carte);

    // `quoi` porte la commande PRÉCISE de cette carte : c'est ce que le gabarit
    // commun insère derrière « Ton objectif pédagogique ».
    const commande = [
        carte.objectif || carte.titre || '',
        carte.consigne ? `L'élève doit : ${carte.consigne}` : '',
        // Un titre vide n'est pas un titre attendu : on laisse le modèle titrer,
        // et l'enseignant corrigera sur l'écran de fabrication.
        carte.titre ? `Titre attendu de l'activité : « ${carte.titre} »` : '',
        `Durée visée : ${carte.duree || 10} minutes.`,
    ].filter(Boolean).join(' — ');

    const corpus = String(ctx.corpus || '').trim();
    const extrait = corpus.length > CORPUS_MAX_CARTE
        ? corpus.slice(0, CORPUS_MAX_CARTE) + '\n[…]'
        : corpus;

    const params = {
        qui: ctx.qui,
        // La COMMANDE de la carte d'abord, le sujet du parcours ensuite, comme
        // cadre : une carte qui porte sur autre chose que le sujet (la façon
        // d'apprendre, un bilan) était sinon réécrite sur le sujet — un vrai/faux
        // « sur les méthodes de révision » interrogeait la Révolution (D82).
        quoi: `${commande}${ctx.quoi ? ` — Sujet du parcours, qui sert de cadre : ${ctx.quoi}` : ''}`,
        niveau: ctx.niveau,
        nombreQuestions: nbElements,
        ocrContent: extrait,
        // Le parcours connaît toujours son niveau et son compte d'éléments :
        // c'est exactement ce que le mode avancé apporte au gabarit commun.
        isAdvanced: true,
    };
    let base;
    if (source?.type === 'video') {
        const [{ buildVideoInteractivePrompt }, { transcriptToSegments }] = await Promise.all([
            import('../services/prompt-generator.js'), import('../ui/media-helpers.js'),
        ]);
        base = buildVideoInteractivePrompt(transcriptToSegments(source.transcript, source.detect), source.detect.duration, params);
    } else if (source?.type === 'image') {
        const { buildImageHotspotsPrompt } = await import('../services/prompt-generator.js');
        base = buildImageHotspotsPrompt(source.zones, source.image, source.imageDescription, prefix, params);
    } else base = buildActivityPrompt(prefix, params);
    // Le gabarit individuel reste intact ; seul le parcours reçoit des retours
    // d'exemple à l'impersonnel (D80, isolés dans l'atelier en D82).
    base = retoursImpersonnels(base, currentLang);

    const cadre = [
        '',
        `# ${t('parcours_prompt_cadre') || 'CADRE DU PARCOURS'}`,
        construireSocleCommun(plan, carte, ctx),
        '',
        `Palier de cette activité : ${t(`parcours_palier_${carte.palier}`)}.`,
        'Respecte ce palier : une activité de découverte ne piège pas, ' +
        'une activité de transfert ne récite pas.',
        CONTENU_SUIT_LA_COMMANDE,
    ].join('\n');

    return { prompt: base + '\n' + cadre, prefix, nbElements };
}

/**
 * Prompt d'un module PROPRE AU PARCOURS (forum, sondage, étiquette, et les
 * modules natifs : questionnaire, leçon, atelier, tableau…).
 *
 * Beaucoup plus court qu'un prompt d'activité : ces modules ne demandent ni
 * distracteurs, ni feedbacks, ni structure imbriquée — un titre, un texte, et
 * pour le sondage une poignée d'options. Tout le soin doit donc porter sur la
 * seule chose qui compte ici : que la consigne soit ADRESSÉE À L'ÉLÈVE et
 * réinvestisse ce qui précède, au lieu de paraphraser le titre.
 *
 * Il est rédigé en français comme `construirePromptPlan`, avec la même consigne
 * de langue de sortie : les deux prompts de l'atelier se lisent ensemble.
 *
 * @param {Object} draft
 * @param {Object} carte
 * @returns {{prompt:string, prefix:null, nbElements:number}}
 */
export function construirePromptModuleParcours(draft, carte) {
    const def = MODULES_PARCOURS[carte.module];
    const ctx = draft.contexte || {};
    const plan = draft.plan || {};
    const langue = LANGUES[currentLang] || 'French';

    const lignes = [];
    lignes.push(
        `Tu es un enseignant qui prépare une pièce de son cours en ligne : ` +
        `« ${t(def.nameKey)} » — ${t(def.descKey)}`
    );

    lignes.push('\n## CONTEXTE');
    if (ctx.qui) lignes.push(`L'enseignant : ${ctx.qui}`);
    lignes.push(`Sujet du parcours : ${ctx.quoi || '(non précisé)'}`);
    if (ctx.niveau) lignes.push(`Public visé : ${ctx.niveau}`);
    if (carte.titre) lignes.push(`Titre attendu : « ${carte.titre} »`);
    if (carte.objectif) lignes.push(`Objectif : ${carte.objectif}`);
    if (carte.consigne) lignes.push(`Ce que l'élève doit faire : ${carte.consigne}`);
    // L'adresse d'un lien web est fournie par l'enseignant ; le modèle ne voit
    // pas la page, il doit seulement savoir qu'elle existe.
    if (def.source === 'lien' && carte.source?.url) lignes.push(`Adresse de la ressource (fournie par l'enseignant) : ${carte.source.url}`);

    lignes.push(`\n## ${t('parcours_prompt_cadre') || 'CADRE DU PARCOURS'}`);
    lignes.push(construireSocleCommun(plan, carte, ctx));

    // Un second sondage mesure le plus souvent ce qui a bougé depuis le
    // premier : il n'y parvient que s'il propose les MÊMES réponses. Constaté
    // sur un parcours réel (28 sept. 2026) : « plutôt oui / peut-être / plutôt
    // non » au départ, quatre phrases longues à l'arrivée — aucune comparaison.
    const precedents = [];
    for (const c of (plan.etapes || []).flatMap(e => e.cartes || [])) {
        if (c === carte || c.id === carte.id) break;
        if (c.module === carte.module && Array.isArray(c.contenu?.options) && c.contenu.options.length) precedents.push(c);
    }
    if (precedents.length) {
        const avant = precedents.at(-1);
        lignes.push(`\nUn ${t(def.nameKey).toLowerCase()} précédent du parcours (« ${avant.titre || avant.contenu.title || ''} ») proposait ces réponses : ` +
            avant.contenu.options.map(o => `« ${o} »`).join(', ') + '. ' +
            'Si celui-ci sert à comparer les avis, reprends EXACTEMENT les mêmes réponses, dans le même ordre.');
    }

    lignes.push('\n## CE QUE TU DOIS PRODUIRE');
    for (const [champ, quoi] of Object.entries(def.champs)) {
        lignes.push(`- \`${champ}\` : ${quoi}`);
    }

    const structures = def.structures || {};
    lignes.push('\n## RÈGLES');
    lignes.push([
        '- Adresse-toi directement à la personne qui suit le parcours, jamais à l’enseignant qui le conçoit.',
        '- La consigne dit quoi faire ET comment s\'y prendre : elle ne répète pas le titre.',
        Object.keys(structures).length
            ? '- La consigne reste brève (deux à quatre phrases) ; le contenu est dans les champs structurés.'
            : '- Reste bref : trois à six phrases suffisent.',
        def.note
            ? "- Ce module est noté par la plateforme : ne promets pas de note précise, ne donne pas de barème."
            : "- N'annonce ni note ni évaluation : ce module n'en porte pas.",
        ...(Object.keys(structures).length
            ? ['- Les champs structurés suivent EXACTEMENT la forme de l\'exemple : mêmes clés, mêmes types.']
            : []),
        '- Ancre tout dans le sujet et les notions du parcours : rien de générique.',
        `- ${CONTENU_SUIT_LA_COMMANDE}`,
        regleLangue(langue, ctx),
    ].join('\n'));

    lignes.push('\n## FORMAT DE SORTIE');
    lignes.push(
        'Réponds UNIQUEMENT par un objet JSON valide, sans texte avant ni après, ' +
        'sans bloc de code markdown. Exemple de structure à adapter au sujet ; remplace tous les points de suspension :'
    );
    // L'exemple se DÉDUIT du registre : un module ajouté là-bas n'a rien à
    // ajouter ici. `listes` dit quels champs sont des tableaux ; tout le reste
    // est une chaîne.
    const listes = new Set(def.listes || []);
    const exemple = {};
    for (const champ of Object.keys(def.champs)) {
        exemple[champ] = structures[champ] ? structures[champ].exemple
            : listes.has(champ) ? ['…', '…', '…'] : '…';
    }
    lignes.push(JSON.stringify(exemple, null, 2));

    return { prompt: lignes.join('\n'), prefix: null, nbElements: listes.size || Object.keys(structures).length ? 4 : 1 };
}
