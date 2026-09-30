/**
 * @file Parcours — bibliothèque de trames didactiques.
 *
 * Données pures ; un seul import, lui-même pur (`aiguillage.js`). Ajouter une
 * trame ne demande AUCUN code : une entrée ici, deux clés dans les locales, et
 * elle apparaît dans l'atelier.
 *
 * L'ordre est signifiant : il va du besoin le plus fréquent au plus spécialisé.
 * « Structure libre » ferme la marche — c'est un outil d'expert, pas une porte
 * d'entrée.
 *
 * ---- Le champ `modules` porte toute la structure ----
 *
 * `modules` est un tableau d'ÉTAPES, chacune listant les types d'activité
 * suggérés. Il sert trois usages d'un coup, ce qui garantit qu'ils ne peuvent
 * pas diverger :
 *
 *   1. l'APERÇU affiché sur la carte, pour qu'on voie ce qu'un modèle contient
 *      avant de le choisir — une description de deux lignes ne suffit pas ;
 *   2. le DÉPART SANS IA : on fabrique le squelette du plan localement, sans
 *      aucun appel au modèle, et l'enseignant remplit ;
 *   3. la CONSIGNE donnée au modèle quand on compose avec l'IA.
 *
 * `variantes` précise les structures courtes/longues quand le modèle de base
 * ne rentre pas dans l’ampleur. `intention` guide le prompt, sans ajouter de
 * texte à l’interface ; `intentions` la remplace pour une ampleur dont les
 * emplacements diffèrent (jamais « en version longue » dans le texte : le
 * modèle le recopiait dans les titres, D81). `durees` fournit les estimations
 * spécifiques éventuelles.
 *
 * Le nombre d'activités par étape s'en déduit (`rythme()`), il n'est donc pas
 * stocké : deux sources pour la même information finissent toujours par se
 * contredire.
 *
 * Les identifiants sont ceux de `core/definitions.js` et du registre des
 * modules de la plateforme (`parcours_*`). Une entrée peut offrir des
 * ALTERNATIVES par ordre de préférence, séparées par `|` :
 * `parcours_questionnaire|parcours_enquete|parcours_sondage` prend le premier
 * module que la plateforme visée propose (`activity-router.moduleDeTrame`). C'est
 * ainsi qu'une trame emploie un greffon d'Éléa ou de Magistère sans casser sur un
 * Moodle nu — et le banc de calibrage exige qu'aucune carte ne se replie.
 *
 * `famille` regroupe les trames (séance / séquence / projet / spécialisé) sous
 * « Voir les autres modèles » (D92). S'affichent d'emblée celles de la VITRINE
 * (D102 : apprendre en autonomie, réviser, s'entraîner, évaluer), complétées au
 * besoin par les suivantes de la bibliothèque.
 *
 * ---- Les trames à CHEMINS (D90) ----
 *
 * `structure: 'chemins'` : après un test, chaque élève suit un chemin parmi deux à
 * quatre, selon sa note. Dans `modules`, l'entrée `CHEMINS` marque la place des
 * chemins ; `chemins.modules` donne les types d'activité de chaque rôle, du plus
 * étayé au moins étayé, et `chemins.longueur` combien en prendre selon l'ampleur
 * et le nombre de chemins. `trameParId(id, ampleur, k)` DÉPLIE la trame : les
 * chemins deviennent k étapes ordinaires, et `aiguillage` dit lesquelles. Le reste
 * de l'atelier lit donc une trame à chemins comme les autres.
 *
 * Le long des chemins, c'est l'AIDE qui change, pas l'objectif : on glisse des
 * mots proposés avant d'écrire sans propositions, on écrit avant de produire
 * (la gradation de la séance de Gauthier, sept. 2026).
 *
 * @module parcours/templates
 */

// Le seul import : un module lui aussi pur, sans aucun import (les rôles des
// chemins n'ont qu'une source).
import { ROLES_PAR_NOMBRE, CHEMINS_DEFAUT, seuilsParDefaut } from './aiguillage.js';

/** La place des chemins dans le `modules` d'une trame à chemins. */
export const CHEMINS = '@chemins';

export const TRAMES = [
    {
        // D102 : la vitrine de Gauthier (30 sept. 2026) — apprendre, réviser,
        // s'entraîner, évaluer. Apprendre SEUL une notion nouvelle : personne pour
        // expliquer, chaque consigne se suffit à elle-même.
        id: 'autonomie',
        variantes: {
            courte: [['CoursePresentation'], ['DragTheWords'], ['QuizSetQCM']],
            longue: [['Page', 'CoursePresentation'], ['DragTheWords', 'FillInTheBlanks', 'MarkTheWords'], ['Flashcards', 'SortParagraphs'], ['QuizSet', 'QuizSetQCM']],
        },
        intention: "Apprendre seul une notion nouvelle, sans personne pour expliquer : la découvrir pas à pas, par une présentation qui pose des questions et y répond avec des exemples ; s’exercer avec une correction immédiate qui explique l’erreur ; retenir l’essentiel ; vérifier ce qu’on sait faire, sur des exemples nouveaux. Chaque consigne se suffit à elle-même.",
        nameKey: 'parcours_t_autonomie_name',
        descKey: 'parcours_t_autonomie_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne', 'longue'],
        paliers: ['decouverte', 'entrainement', 'entrainement', 'transfert'],
        modules: [
            ['CoursePresentation'],
            ['DragTheWords', 'FillInTheBlanks'],
            ['Flashcards'],
            ['QuizSetQCM'],
        ],
    },
    {
        id: 'revision',
        // Le diagnostic est une SÉRIE d'affirmations : un Vrai/Faux n'en porte
        // qu'une, et une réponse sur deux y est juste au hasard — il ne
        // repérait rien (état de l'art du 28 sept. 2026, D81).
        variantes: { courte: [['QuizSetVF'], ['Page'], ['FillInTheBlanks'], ['test_elea']] },
        intention: "Se tester d’abord, sans enjeu, pour repérer les acquis et les erreurs ; rappeler l’essentiel en partant des erreurs les plus fréquentes ; s’entraîner sur les difficultés ; vérifier les acquis par un test qui mélange les notions de tout le parcours.",
        nameKey: 'parcours_t_revision_name',
        descKey: 'parcours_t_revision_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['entrainement', 'decouverte', 'entrainement', 'transfert'],
        modules: [
            ['QuizSetVF'],
            ['Page', 'Flashcards'],
            ['FillInTheBlanks', 'Crossword'],
            ['test_elea'],
        ],
    },
    {
        // D102 : pratiquer, de la reconnaissance à la production ; le cours n'est
        // pas refait, la difficulté monte d'une étape à l'autre.
        id: 'entrainement',
        variantes: {
            courte: [['Flashcards'], ['DragTheWords'], ['FillInTheBlanks'], ['QuizSetQCM']],
            longue: [['Flashcards', 'DialogCards'], ['DragTheWords', 'MarkTheWords', 'SortParagraphs'], ['FillInTheBlanks', 'Crossword', 'QuizSet'], ['QuizSetQCM']],
        },
        intention: "Consolider par la pratique, de la reconnaissance à la production : un rappel sans support pour réactiver ce qui est su ; des exercices avec propositions, corrigés tout de suite ; les mêmes notions sans propositions ; une vérification finale qui mêle tout. La difficulté monte d’une étape à l’autre ; aucune étape ne réexplique le cours.",
        nameKey: 'parcours_t_entrainement_name',
        descKey: 'parcours_t_entrainement_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne', 'longue'],
        paliers: ['entrainement', 'entrainement', 'entrainement', 'transfert'],
        modules: [
            ['Flashcards'],
            ['DragTheWords', 'MarkTheWords'],
            ['FillInTheBlanks', 'QuizSet'],
            ['QuizSetQCM'],
        ],
    },
    {
        // D102 : « Évaluer » impose au Test ses réglages d'épreuve — une seule
        // tentative, chronométrée sur la durée de la carte, sans correction :
        // la note seule à la fin (Gauthier, 30 sept. 2026). La page de corrigé
        // qui suivait le Test est retirée : sans ouverture progressive, l'élève
        // pouvait la lire AVANT l'épreuve.
        id: 'evaluation',
        intention: "Préparer puis passer une évaluation : une page dit ce qui est évalué, sous quelle forme, en combien de temps et comment c’est noté ; un entraînement au format de l’épreuve, corrigé ; puis l’évaluation elle-même, alignée sur les objectifs et sur tout le parcours — une seule tentative, chronométrée, sans correction affichée : l’élève voit sa note à la fin.",
        nameKey: 'parcours_t_evaluation_name',
        descKey: 'parcours_t_evaluation_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte'],
        paliers: ['decouverte', 'entrainement', 'transfert'],
        modules: [['Page'], ['QuizSet'], ['test_elea']],
        // Posés sur le Test à la génération (`reglagesDeTrame`) ; l'enseignant
        // les retouche ensuite dans l'éditeur s'il le veut.
        reglagesTest: { attempts: 1, preferredbehaviour: 'deferredfeedback', review: 'marks' },
        chronometre: true,
    },
    {
        id: 'remediation',
        variantes: { moyenne: [['Page', 'DialogCards'], ['FillInTheBlanks', 'DragTheWords'], ['QuizSet']] },
        // La page de départ énonce l'erreur, la réfute, puis explique : c'est la
        // forme qui fait changer une conception erronée (D81).
        intention: "Nommer une erreur précise et réexpliquer : la page énonce l’erreur telle qu’on la commet, montre pourquoi elle ne tient pas, puis donne l’explication juste avec un exemple résolu pas à pas ; refaire avec un appui ; vérifier le progrès sur des exemples nouveaux.",
        nameKey: 'parcours_t_remediation_name',
        descKey: 'parcours_t_remediation_desc',
        famille: 'seance',
        formats: ['distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'entrainement'],
        modules: [
            ['Page'],
            ['DialogCards', 'FillInTheBlanks'],
            ['QuizSet'],
        ],
    },
    {
        id: 'rituel',
        durees: [[2], [4], [4]],
        // La FORME reste la même d'un rituel à l'autre ; le CONTENU mêle le
        // récent et l'ancien — c'est le rappel espacé qui installe (D81).
        intention: "Réactiver ; s’exercer brièvement ; retrouver les mots clés. Dix minutes au total, 2 + 4 + 4 minutes. Les questions mêlent des notions récentes et d’autres, plus anciennes, du même sujet.",
        nameKey: 'parcours_t_rituel_name',
        descKey: 'parcours_t_rituel_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte'],
        paliers: ['entrainement', 'entrainement', 'entrainement'],
        modules: [['QuizSetVF'], ['FillInTheBlanks'], ['SingleChoiceSet']],
    },
    {
        id: 'decouverte',
        // Version longue : la question de départ se pose à la classe — un nuage
        // de mots (Magistère) ou un sondage rend visibles les représentations.
        variantes: { longue: [['parcours_nuage_mots|parcours_sondage', 'CoursePresentation'], ['Livre', 'MarkTheWords'], ['Page', 'Glossary', 'FillInTheBlanks'], ['QuizSet', 'Devoir']] },
        // Une découverte GUIDÉE : explorer seul, sans questions ni retour, fait
        // moins apprendre qu'une explication directe (D81).
        intention: "Poser une question qui intrigue ; explorer les ressources en suivant des questions qui orientent la lecture, avec un retour immédiat ; formuler explicitement la synthèse de ce qu’il faut retenir ; réutiliser dans une situation nouvelle.",
        nameKey: 'parcours_t_decouverte_name',
        descKey: 'parcours_t_decouverte_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'decouverte', 'entrainement', 'transfert'],
        modules: [
            ['CoursePresentation'],
            ['Livre', 'MarkTheWords'],
            ['Page', 'Glossary', 'FillInTheBlanks'],
            ['QuizSet', 'DragAndDrop'],
        ],
    },
    {
        id: 'inversee',
        variantes: { courte: [['CoursePresentation', 'SingleChoiceSet'], ['Devoir'], ['test_elea']] },
        intention: "À distance : découvrir par une présentation courte, puis vérifier la compréhension par quelques questions corrigées dont les résultats préparent la séance ; en présence : résoudre ensemble une tâche d’application ; après : faire le bilan. Indiquer ces moments dans les consignes.",
        nameKey: 'parcours_t_inversee_name',
        descKey: 'parcours_t_inversee_desc',
        famille: 'sequence',
        // Une classe inversée suppose du travail à la maison ET du travail en
        // classe : elle n'a de sens qu'en hybride.
        formats: ['hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'transfert', 'entrainement'],
        // « Après : faire le bilan » — un questionnaire (ou l'enquête, ou un
        // sondage selon la plateforme) recueille ce que la séance a laissé.
        modules: [
            ['CoursePresentation', 'SingleChoiceSet'],
            ['Devoir', 'DragAndDrop'],
            ['test_elea', 'parcours_questionnaire|parcours_enquete|parcours_sondage'],
        ],
    },
    {
        id: 'oeuvre',
        variantes: { longue: [['Livre', 'Page'], ['MarkTheWords', 'DragAndDrop'], ['Timeline', 'Glossary', 'FillInTheBlanks'], ['Essay', 'parcours_forum']] },
        intention: "Entrer dans l’œuvre par une première lecture ; relever des indices ; relier les indices au contexte ; proposer et justifier une interprétation personnelle, en confrontant sa première impression de lecture aux indices relevés.",
        nameKey: 'parcours_t_oeuvre_name',
        descKey: 'parcours_t_oeuvre_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'decouverte', 'entrainement', 'transfert'],
        modules: [
            ['Livre'],
            ['MarkTheWords', 'DragAndDrop'],
            ['Timeline', 'Glossary', 'FillInTheBlanks'],
            ['Essay'],
        ],
    },
    {
        id: 'investigation',
        variantes: { longue: [['parcours_sondage', 'Livre'], ['Page', 'SortParagraphs'], ['Chart', 'Essay', 'parcours_forum'], ['Page', 'QuizSet']] },
        intention: "Poser une question et des hypothèses ; définir un protocole et recueillir des données ; analyser les résultats ; conclure, discuter les limites, puis fixer par écrit ce qu’il faut retenir. Guider chaque étape par des questions précises. Ne pas inventer de résultats expérimentaux présentés comme réels.",
        nameKey: 'parcours_t_investigation_name',
        descKey: 'parcours_t_investigation_desc',
        famille: 'sequence',
        formats: ['presentiel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'decouverte', 'entrainement', 'transfert'],
        // Les hypothèses se recueillent d'abord : un sondage les rend visibles
        // à toute la classe avant qu'on cherche à les vérifier (D74).
        modules: [
            ['parcours_sondage'],
            ['Page', 'SortParagraphs'],
            ['Chart', 'Essay'],
            ['Page', 'QuizSet'],
        ],
    },
    {
        id: 'emi',
        variantes: { courte: [['CoursePresentation'], ['QuizSetVF'], ['MarkTheWords'], ['Essay']] },
        // Juger une source, c'est d'abord QUITTER la page pour voir qui la
        // publie : les vérificateurs professionnels font ainsi, et les grilles
        // de critères appliquées à la page seule égarent (D81).
        intention: "Identifier la source et son auteur en sortant de la page : chercher qui la publie et ce qu’en disent d’autres sources fiables, plutôt que juger sur son apparence ; vérifier les affirmations ; croiser les indices ; justifier un jugement sur la fiabilité. Distinguer les documents fournis des exemples fictifs.",
        nameKey: 'parcours_t_emi_name',
        descKey: 'parcours_t_emi_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'entrainement', 'transfert'],
        // « Identifier la source et son auteur » : sur une VRAIE source en
        // ligne, dont l'enseignant donne l'adresse (Lien web) — D76.
        modules: [
            ['parcours_lien'],
            ['MarkTheWords', 'QuizSetVF'],
            ['Page', 'Glossary', 'DragTheWords'],
            ['Essay'],
        ],
    },
    {
        id: 'debat',
        variantes: { longue: [['parcours_sondage', 'Page'], ['Livre', 'MarkTheWords', 'QuizSetVF'], ['parcours_forum', 'parcours_wiki'], ['Essay', 'parcours_sondage']] },
        // Chaque emplacement dit son rôle : sans cela, sur un parcours réel du
        // 28 sept. 2026, la Page devenait « Ton argument à chaud » (une page ne
        // recueille rien) et le wiki un second forum « Règles du débat ».
        intention: "Étape 1 : un sondage recueille les positions de départ, puis une page à lire pose la question du débat et ses enjeux. Étape 2 : s’informer sur les arguments et leurs sources, et les repérer dans un texte. Étape 3 : UN forum, intitulé comme la question débattue, porte le débat écrit ; sa consigne en donne les règles : publier sa position avec un argument et sa source, puis répondre à au moins deux messages pour objecter, nuancer ou demander une preuve. Étape 4 : rédiger une position argumentée qui répond à au moins un argument contraire. Ne pas inventer de messages d’élèves.",
        intentions: {
            longue: "Étape 1 : un sondage recueille les positions de départ, puis une page à lire pose la question du débat et ses enjeux. Étape 2 : s’informer sur les arguments et leurs sources, les repérer dans un texte, puis vérifier par une série de vrai/faux ce qu’on en a compris. Étape 3 : UN forum, intitulé comme la question débattue, porte le débat écrit ; sa consigne en donne les règles : publier sa position avec un argument et sa source, puis répondre à au moins deux messages pour objecter, nuancer ou demander une preuve ; un wiki construit à plusieurs la carte des arguments échangés (pour, contre, sources). Étape 4 : rédiger une position argumentée qui répond à au moins un argument contraire ; un second sondage, avec les mêmes réponses que le premier, montre si les avis ont bougé. Ne pas inventer de messages d’élèves.",
        },
        nameKey: 'parcours_t_debat_name',
        descKey: 'parcours_t_debat_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'entrainement', 'transfert', 'transfert'],
        // Trame pensée AUTOUR des modules de la plateforme (D76) : le sondage
        // ouvre et (en version longue) referme le débat, le forum le porte.
        modules: [
            ['parcours_sondage', 'Page'],
            ['Livre', 'MarkTheWords'],
            ['parcours_forum'],
            ['Essay'],
        ],
    },
    {
        // D90 : la différenciation devient RÉELLE. Le test de positionnement
        // ouvre, selon la note, un chemin parmi deux à quatre ; les autres restent
        // invisibles pour l'élève, et tous se retrouvent pour le bilan. C'est le
        // gabarit de Gauthier (sept. 2026), sans ses failles.
        id: 'differenciation',
        structure: 'chemins',
        // En une séance, le test SEUL ouvre le parcours ; au-delà, une page
        // présente d'abord le texte ou le document à lire (la page « Commencer le
        // parcours » du modèle de Gauthier).
        variantes: { courte: [['QuizSetQCM'], CHEMINS, ['Essay']] },
        intention: "Première étape : une page présente le texte ou le document de travail, puis un test de positionnement porte sur toutes les notions du parcours, une notion par question, des questions simples aux plus exigeantes. Étapes suivantes : un chemin par groupe de résultats au test. Tous visent le même objectif sur les mêmes notions, avec le même nombre d’activités et une durée comparable ; seule l’aide change. Le premier chemin part d’un exemple résolu et fait choisir ou glisser des mots proposés, avec une correction immédiate qui explique ; le dernier fait écrire sans propositions, appliquer à un cas nouveau et produire, avec une correction donnée à la fin. Dernière étape, commune : un écrit court où chacun réinvestit les notions.",
        intentions: {
            courte: "Première étape : un test de positionnement porte sur toutes les notions du parcours, une notion par question, des questions simples aux plus exigeantes. Étape suivante : un chemin par groupe de résultats au test. Tous visent le même objectif sur les mêmes notions, avec le même nombre d’activités et une durée comparable ; seule l’aide change. Le premier chemin part d’un exemple résolu et fait choisir ou glisser des mots proposés, avec une correction immédiate qui explique ; le dernier fait écrire sans propositions et appliquer à un cas nouveau, avec une correction donnée à la fin. Dernière étape, commune : un écrit court où chacun réinvestit les notions.",
        },
        nameKey: 'parcours_t_differenciation_name',
        descKey: 'parcours_t_differenciation_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'transfert'],
        modules: [['Page', 'QuizSetQCM'], CHEMINS, ['Essay']],
        chemins: {
            // Du plus étayé au moins étayé : reconnaître, puis retrouver, puis produire.
            modules: {
                reprendre: ['DialogCards', 'DragTheWords', 'QuizSetVF', 'MarkTheWords'],
                renforcer: ['Page', 'DragTheWords', 'MarkTheWords', 'QuizSetVF'],
                consolider: ['FillInTheBlanks', 'QuizSetQCM', 'DragAndDrop', 'Crossword'],
                approfondir: ['FillInTheBlanks', 'Essay', 'QuizSetQCM', 'SortParagraphs'],
            },
            // Activités par chemin : douze au plus pour TOUT le parcours (D5).
            longueur: { courte: { 2: 2, 3: 2, 4: 2 }, moyenne: { 2: 4, 3: 3, 4: 2 } },
        },
    },
    {
        // D90 : la remédiation « en cours de route » — la pédagogie de maîtrise :
        // un point de contrôle après une première découverte, puis revoir ou aller
        // plus loin selon le score, avant de réinvestir ensemble.
        id: 'point_controle',
        structure: 'chemins',
        variantes: { courte: [['Page'], ['QuizSetQCM'], CHEMINS] },
        intention: "Première étape : découvrir la notion par une présentation guidée par des questions, puis s’exercer brièvement. Deuxième étape : un point de contrôle, un quiz sur ce qui vient d’être vu, dont le score oriente la suite. Étapes suivantes : un chemin par groupe de résultats. Le premier fait revoir : une page énonce l’erreur fréquente telle qu’on la commet, montre pourquoi elle ne tient pas, puis explique avec un exemple résolu, avant un exercice guidé et une seconde vérification sur des exemples nouveaux. Le dernier fait aller plus loin : un cas nouveau, un défi, une production. Dernière étape, commune : un test qui mélange les notions de tout le parcours.",
        intentions: {
            courte: "Première étape : découvrir la notion par une page qui pose une question et y répond pas à pas. Deuxième étape : un point de contrôle, un quiz sur ce qui vient d’être vu, dont le score oriente la suite. Dernière étape : un chemin par groupe de résultats. Le premier fait revoir : une page énonce l’erreur fréquente, montre pourquoi elle ne tient pas et explique avec un exemple résolu, puis un exercice guidé. Le dernier fait aller plus loin : un cas nouveau ou un défi.",
        },
        nameKey: 'parcours_t_point_controle_name',
        descKey: 'parcours_t_point_controle_desc',
        famille: 'sequence',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'entrainement', 'transfert'],
        modules: [['CoursePresentation', 'FillInTheBlanks'], ['QuizSetQCM'], CHEMINS, ['test_elea']],
        chemins: {
            modules: {
                reprendre: ['DialogCards', 'DragTheWords', 'QuizSetVF', 'MarkTheWords'],
                renforcer: ['Page', 'DragTheWords', 'QuizSetVF', 'MarkTheWords'],
                consolider: ['FillInTheBlanks', 'QuizSetQCM', 'DragAndDrop', 'SortParagraphs'],
                approfondir: ['Essay', 'FillInTheBlanks', 'SortParagraphs', 'QuizSetQCM'],
            },
            longueur: { courte: { 2: 2, 3: 2, 4: 2 }, moyenne: { 2: 4, 3: 2, 4: 2 } },
        },
    },
    {
        id: 'langue',
        // Perspective actionnelle : la tâche finale est annoncée d'emblée, le
        // lexique s'apprend pour elle (D81).
        intention: "Annoncer dès le début la tâche finale (à qui l’on s’adresse, dans quelle situation) ; installer le lexique utile à cette tâche ; comprendre en contexte ; réemployer à l’entraînement ; produire pour ce destinataire et cette situation.",
        nameKey: 'parcours_t_langue_name',
        descKey: 'parcours_t_langue_desc',
        famille: 'specialise',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['moyenne'],
        paliers: ['decouverte', 'entrainement', 'entrainement', 'transfert'],
        modules: [
            ['Flashcards', 'Crossword'],
            ['SingleChoiceSet', 'MarkTheWords'],
            ['DialogCards', 'Dictation'],
            ['Essay'],
        ],
    },
    {
        id: 'oral',
        variantes: { courte: [['Page'], ['SortParagraphs', 'Flashcards'], ['Devoir']] },
        intention: "Préparer le propos et les critères de réussite ; organiser puis répéter à voix haute ; présenter ou déposer une prestation et s’autoévaluer avec les mêmes critères. La durée inclut le travail oral demandé.",
        nameKey: 'parcours_t_oral_name',
        descKey: 'parcours_t_oral_desc',
        famille: 'specialise',
        formats: ['presentiel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'transfert'],
        modules: [
            ['Page', 'Livre'],
            ['SortParagraphs', 'Flashcards'],
            ['Devoir'],
        ],
    },
    {
        // Ouverte le 28 sept. 2026 (D82) : les méthodes de travail aux preuves
        // les plus solides — se tester, espacer, expliquer — apprises en les
        // ESSAYANT sur le sujet du cours, pas en en entendant parler. La première
        // étape réfute les idées reçues (relire, surligner, tout réviser la
        // veille), dont les élèves surestiment l'efficacité.
        id: 'apprendre',
        variantes: { courte: [['QuizSetVF', 'Page'], ['Flashcards'], ['Essay']] },
        intention: "Étape 1 : une série de vrai/faux fait le point sur les idées reçues à propos de la façon d’apprendre (relire plusieurs fois, surligner, tout réviser la veille), puis une page explique ce qui aide vraiment à retenir — se tester sans regarder ses notes, puis se tester de nouveau quelques jours plus tard plutôt que tout réviser d’un coup (espacer, ce n’est pas relire plus souvent), expliquer avec ses mots, s’entraîner sur des exercices variés — et pourquoi relire donne l’impression de savoir sans faire retenir. Étape 2 : essayer ces méthodes sur le sujet du cours : des cartes pour se tester sans regarder, puis un quiz aux questions mélangées, à refaire quelques jours plus tard. Étape 3 : rédiger son plan de révision pour la prochaine évaluation (quand, combien de temps, avec quelles méthodes), puis dire dans un questionnaire quelles méthodes on gardera. Les méthodes s’exercent sur le sujet indiqué, jamais dans le vide ; les questions de la première étape portent sur la façon d’apprendre, celles de la deuxième sur le sujet.",
        intentions: {
            courte: "Étape 1 : une série de vrai/faux fait le point sur les idées reçues à propos de la façon d’apprendre (relire plusieurs fois, surligner, tout réviser la veille), puis une page explique ce qui aide vraiment à retenir — se tester sans regarder ses notes, puis se tester de nouveau quelques jours plus tard plutôt que tout réviser d’un coup (espacer, ce n’est pas relire plus souvent), expliquer avec ses mots, s’entraîner sur des exercices variés — et pourquoi relire donne l’impression de savoir sans faire retenir. Étape 2 : essayer ces méthodes sur le sujet du cours avec des cartes pour se tester sans regarder, à reprendre quelques jours plus tard. Étape 3 : rédiger son plan de révision pour la prochaine évaluation (quand, combien de temps, avec quelles méthodes). Les méthodes s’exercent sur le sujet indiqué, jamais dans le vide ; les questions de la première étape portent sur la façon d’apprendre, celles de la deuxième sur le sujet.",
        },
        nameKey: 'parcours_t_apprendre_name',
        descKey: 'parcours_t_apprendre_desc',
        famille: 'specialise',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'entrainement', 'transfert'],
        modules: [
            ['QuizSetVF', 'Page'],
            ['Flashcards', 'QuizSet'],
            ['Essay', 'parcours_questionnaire|parcours_enquete|parcours_sondage'],
        ],
    },
    {
        id: 'autoformation',
        variantes: { longue: [['Page', 'QuizSetVF'], ['InteractiveBook', 'Glossary'], ['QuizSet', 'FillInTheBlanks', 'DialogCards'], ['test_elea', 'Page']] },
        intention: "Donner les repères et les prérequis ; expliquer avec des ressources autonomes, un exemple résolu avant chaque nouveau type d’exercice ; s’entraîner avec des retours qui expliquent l’erreur ; vérifier les acquis sur tout le parcours et indiquer la suite. Ne pas dépendre d’un retour immédiat du formateur.",
        nameKey: 'parcours_t_autoformation_name',
        descKey: 'parcours_t_autoformation_desc',
        famille: 'specialise',
        formats: ['distanciel'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'decouverte', 'entrainement', 'transfert'],
        // La Leçon guide pas à pas et ne laisse passer qu'une fois compris :
        // l'outil même de l'autoformation sans formateur (D74).
        modules: [
            ['Page'],
            ['parcours_lecon', 'Glossary'],
            ['QuizSet', 'FillInTheBlanks'],
            ['test_elea'],
        ],
    },
    {
        id: 'formation',
        // Ce qui rend une formation d'enseignants efficace : voir une pratique
        // commentée, s'y essayer, arrêter un plan précis, le mettre en œuvre en
        // classe et en revenir (D81).
        intention: "Avant, à distance : se positionner sans enjeu par des questions de connaissances corrigées, et se préparer par des apports courts ; en présence : découvrir un exemple de pratique commenté, s’y essayer sur un cas concret, confronter les pratiques, puis arrêter un plan d’action précis (quelle séance, avec quelle classe, quand) ; après : mettre ce plan en œuvre en classe et en rendre compte (ce qui a marché, ce qu’on ajuste), en discuter avec les collègues, puis vérifier les acquis sur l’ensemble de la formation.",
        nameKey: 'parcours_t_formation_name',
        descKey: 'parcours_t_formation_desc',
        famille: 'specialise',
        formats: ['hybride'],
        ampleurs: ['longue'],
        paliers: ['decouverte', 'entrainement', 'transfert'],
        // « Partager un retour d'expérience » : un forum, pas une page (D74).
        // Le compte rendu tient dans le devoir : une rédaction en plus le
        // faisait écrire DEUX fois (parcours réel du 28 sept. 2026). Le test
        // final, des semaines après le premier, montre le chemin parcouru (D81).
        modules: [
            ['test_elea', 'Livre', 'Page'],
            ['Page', 'CoursePresentation', 'Devoir'],
            ['Devoir', 'parcours_forum', 'test_elea'],
        ],
    },
    {
        id: 'projet',
        // Une critique qui n'est suivie d'aucune reprise ne sert à rien : l'atelier
        // relit une PREMIÈRE version, le devoir recueille la version améliorée (D81).
        intention: "Étape 1 : poser la commande et les critères. Étape 2 : se documenter. Étape 3 : le wiki organise le travail commun (rôles, calendrier) ; le quiz vérifie les connaissances dont le projet a besoin. Étape 4 : une rédaction prépare la présentation du projet, puis l’atelier recueille une première version et organise sa relecture entre pairs, grille de critères en main. Étape 5 : le devoir recueille la version améliorée à partir des retours ; le forum sert à dire ce que ces retours ont changé. Préciser les rôles et la production commune dans les consignes, sans promettre de groupes Moodle créés automatiquement.",
        nameKey: 'parcours_t_projet_name',
        descKey: 'parcours_t_projet_desc',
        famille: 'projet',
        formats: ['presentiel', 'hybride'],
        ampleurs: ['longue'],
        paliers: ['decouverte', 'decouverte', 'entrainement', 'transfert', 'transfert'],
        // Le travail commun s'écrit à plusieurs (wiki), la critique
        // constructive se fait entre pairs, grille en main (atelier) — D74.
        modules: [
            ['Page'],
            ['Livre', 'Glossary'],
            ['parcours_wiki', 'QuizSet'],
            ['Essay', 'parcours_atelier'],
            ['Devoir', 'parcours_forum'],
        ],
    },
    {
        id: 'cooperation',
        variantes: { longue: [['Page', 'parcours_choix_groupe|parcours_forum'], ['Livre', 'QuizSet', 'parcours_tableau|parcours_base'], ['parcours_document|parcours_wiki', 'parcours_forum'], ['parcours_atelier', 'parcours_enquete|parcours_questionnaire|parcours_sondage']] },
        // Coopérer apprend quand chacun a un rôle et une part identifiable, et
        // quand la critique des pairs revient dans l'espace commun (D81).
        // Chaque emplacement dit son rôle : sur un parcours réel du 28 sept. 2026,
        // « améliorer » devenait un SECOND document collaboratif (tout à refaire
        // pour les équipes), et le livre un lieu où « synthétiser les idées ».
        intention: "Étape 1 : une page présente la tâche commune et le rôle de chacun ; les équipes se forment. Étape 2 : un livre apporte les ressources à lire, un quiz vérifie ce qu’il faut savoir, un espace de dépôt commun recueille les idées de chacun. Étape 3 : l’équipe produit dans UN espace d’écriture commun, où chacun garde une part identifiable. Étape 4 : l’atelier organise la relecture entre pairs, grille de critères en main, et sa consigne demande d’améliorer ensuite le texte dans ce même espace — aucune activité nouvelle pour cela. Les groupes de la plateforme ne sont pas créés automatiquement : la consigne dit comment s’organiser.",
        intentions: {
            longue: "Étape 1 : une page présente la tâche commune et le rôle de chacun ; les équipes se forment. Étape 2 : un livre apporte les ressources à lire, un quiz vérifie ce qu’il faut savoir, un espace de dépôt commun recueille les idées de chacun. Étape 3 : l’équipe produit dans UN espace d’écriture commun, où chacun garde une part identifiable ; un forum sert à se coordonner. Étape 4 : l’atelier organise la relecture entre pairs, grille de critères en main, et sa consigne demande d’améliorer ensuite le texte dans ce même espace — aucune activité nouvelle pour cela ; un questionnaire recueille enfin le bilan de chacun : ce qu’il a apporté, ce qu’il retient. Les groupes de la plateforme ne sont pas créés automatiquement : la consigne dit comment s’organiser.",
        },
        nameKey: 'parcours_t_cooperation_name',
        descKey: 'parcours_t_cooperation_desc',
        famille: 'projet',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['decouverte', 'entrainement', 'transfert', 'transfert'],
        // Trame pensée AUTOUR des modules de la plateforme (D76), chacun avec son
        // repli : choix de groupe sinon forum, tableau sinon base de données,
        // document collaboratif sinon wiki — tous présents sur un Moodle nu.
        modules: [
            ['Page', 'parcours_choix_groupe|parcours_forum'],
            ['Livre', 'QuizSet', 'parcours_tableau|parcours_base'],
            ['parcours_document|parcours_wiki'],
            ['parcours_atelier'],
        ],
    },
    {
        id: 'evasion',
        variantes: { courte: [['Page', 'Crossword'], ['QuizSet', 'Page']] },
        intention: "Introduire une mission et ses indices ; résoudre les énigmes, conclure et expliquer les raisonnements. Chaque énigme fait mobiliser une notion du sujet, jamais une devinette décorative ; le débriefing dit ce qu’on a appris. Ne pas promettre de cadenas ou de codes qui ouvrent automatiquement des étapes : la trame fournit le fil narratif et les exercices.",
        nameKey: 'parcours_t_evasion_name',
        descKey: 'parcours_t_evasion_desc',
        famille: 'projet',
        formats: ['presentiel', 'hybride'],
        ampleurs: ['courte', 'moyenne'],
        paliers: ['decouverte', 'transfert'],
        modules: [
            ['Page', 'FindTheWords', 'Crossword', 'DragAndDrop'],
            ['FillInTheBlanks', 'QuizSet', 'Page'],
        ],
    },
    {
        id: 'libre',
        nameKey: 'parcours_t_libre_name',
        descKey: 'parcours_t_libre_desc',
        famille: 'specialise',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte', 'moyenne', 'longue'],
        // Structure libre : ni modules suggérés, ni paliers imposés. Le rythme
        // sera déduit de l'ampleur choisie.
        modules: null,
        paliers: null,
    },
];

/** Nombre d'activités par étape, déduit des modules suggérés. */
export function rythme(trame) {
    return Array.isArray(trame.modules) ? trame.modules.map(e => e.length) : null;
}

/** Nombre total d'activités (0 si structure libre). */
export function nbActivites(trame) {
    const r = rythme(trame);
    return r ? r.reduce((a, b) => a + b, 0) : 0;
}

/** Nombre d'étapes (0 si structure libre). */
export function nbEtapes(trame) {
    return Array.isArray(trame.modules) ? trame.modules.length : 0;
}

/** Palier d'une étape, avec repli sur `entrainement`. */
export function palierEtape(trame, index) {
    return (Array.isArray(trame.paliers) && trame.paliers[index]) || 'entrainement';
}

/** Nombre d'activités que fait UN élève : les étapes communes et un seul chemin. */
export function nbActivitesParEleve(trame) {
    const r = rythme(trame);
    if (!r) return 0;
    const a = trame.aiguillage;
    if (!a) return r.reduce((x, y) => x + y, 0);
    return r.reduce((x, y, i) => x + (i >= a.debut && i < a.debut + a.nombre ? 0 : y), 0) + r[a.debut];
}

/**
 * La VITRINE : les trames montrées d'abord, dans cet ordre, quand la modalité et
 * l'ampleur le permettent — quatre intentions nettement distinctes, proposées par
 * Gauthier (30 sept. 2026) : « trop de choix, et peu de différence entre réviser et
 * remédier ». Les autres restent sous « Voir les autres modèles » (D102).
 */
export const VITRINE = Object.freeze(['autonomie', 'revision', 'entrainement', 'evaluation']);

/** Au moins autant de modèles en vitrine : complétée dans l'ordre de la bibliothèque. */
export const VITRINE_MIN = 3;

/**
 * Les trames de la vitrine parmi celles qui sont compatibles, complétées jusqu'à
 * `VITRINE_MIN` par les suivantes de la bibliothèque (la structure libre exceptée).
 * @param {Array<Object>} compatibles - Sortie de `tramesCompatibles`.
 * @returns {Array<Object>}
 */
export function trameEnVitrine(compatibles) {
    const enVitrine = VITRINE.map(id => compatibles.find(tr => tr.id === id)).filter(Boolean);
    for (const tr of compatibles) {
        if (enVitrine.length >= VITRINE_MIN) break;
        if (tr.id !== 'libre' && !enVitrine.includes(tr)) enVitrine.push(tr);
    }
    return enVitrine;
}

/**
 * Les réglages qu'une trame impose au Test d'un parcours (« Évaluer », D102), posés
 * UNE fois, à la génération : l'enseignant les retouche ensuite dans l'éditeur, et
 * rien ne les réimpose à l'assemblage. Le temps limite est la durée de la carte.
 *
 * @param {string} trameId - La trame du cadrage (`draft.trame`).
 * @param {Object} carte
 * @param {Object} contenu
 * @returns {Object} Le contenu, réglé (une copie s'il a changé).
 */
export function reglagesDeTrame(trameId, carte, contenu) {
    const trame = TRAMES.find(tr => tr.id === trameId);
    if (!trame?.reglagesTest || carte?.module !== 'test_elea' || !contenu || typeof contenu !== 'object') return contenu;
    return {
        ...contenu,
        quiz_settings: {
            ...(contenu.quiz_settings || {}),
            ...trame.reglagesTest,
            ...(trame.chronometre ? { timelimit_minutes: Number(carte.duree) || 20 } : {}),
        },
    };
}

/** La trame ouvre-t-elle des chemins ? */
export function aDesCheminsTrame(trame) {
    return Boolean(trame && trame.structure === 'chemins');
}

/**
 * Trames compatibles avec la modalité, l'ampleur et la structure choisies.
 *
 * Une trame à chemins ne se propose QUE si l'enseignant a choisi « des chemins
 * selon les résultats », et inversement : les deux listes ne se mêlent pas
 * (D91). La structure libre vaut pour les deux.
 *
 * @param {string} format  - `presentiel` | `distanciel` | `hybride`
 * @param {string} ampleur - `courte` | `moyenne` | `longue`
 * @param {Object} [o]
 * @param {'lineaire'|'chemins'} [o.structure]
 * @param {number} [o.chemins] - Nombre de chemins (2 à 4).
 * @returns {Array<Object>} Les trames retenues, dans l'ordre de la bibliothèque.
 */
export function tramesCompatibles(format, ampleur, { structure = 'lineaire', chemins = CHEMINS_DEFAUT } = {}) {
    return TRAMES.filter(tr => tr.formats.includes(format) && tr.ampleurs.includes(ampleur)
            && (tr.id === 'libre' || aDesCheminsTrame(tr) === (structure === 'chemins')))
        .map(tr => adapterTrame(tr, ampleur, chemins));
}

/**
 * Une trame par son identifiant, dépliée pour l'ampleur et le nombre de chemins.
 * @param {string} id
 * @param {string} [ampleur]
 * @param {number} [chemins]
 */
export function trameParId(id, ampleur, chemins = CHEMINS_DEFAUT) {
    const trame = TRAMES.find(tr => tr.id === id);
    return trame ? adapterTrame(trame, ampleur, chemins) : null;
}

/**
 * La même variante alimente la carte, le départ sans IA et le prompt.
 *
 * Une trame à chemins est DÉPLIÉE : l'entrée `CHEMINS` devient k étapes, une par
 * rôle, chacune avec ses types d'activité ; `aiguillage` dit où elles commencent,
 * combien il y en a, leurs rôles et leurs seuils par défaut.
 */
function adapterTrame(trame, ampleur, k = CHEMINS_DEFAUT) {
    const base = trame.variantes?.[ampleur] || trame.modules;
    const intention = trame.intentions?.[ampleur] || trame.intention;
    if (!aDesCheminsTrame(trame) || !Array.isArray(base)) return { ...trame, modules: base, intention };
    const n = ROLES_PAR_NOMBRE[k] ? k : CHEMINS_DEFAUT;
    const roles = ROLES_PAR_NOMBRE[n];
    const longueur = trame.chemins.longueur?.[ampleur]?.[n] || 2;
    const modules = [];
    const paliers = [];
    let debut = -1;
    base.forEach((entree, i) => {
        const palier = trame.paliers?.[i] || 'entrainement';
        if (entree === CHEMINS) {
            debut = modules.length;
            for (const role of roles) {
                modules.push(trame.chemins.modules[role].slice(0, longueur));
                paliers.push(palier);
            }
        } else {
            modules.push(entree);
            paliers.push(palier);
        }
    });
    return {
        ...trame, modules, paliers, intention,
        aiguillage: { debut, nombre: n, roles: [...roles], seuils: seuilsParDefaut(n) },
    };
}
