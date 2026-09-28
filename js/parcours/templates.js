/**
 * @file Parcours — bibliothèque de trames didactiques.
 *
 * Données pures, SANS import. Ajouter une trame ne demande AUCUN code : une
 * entrée ici, deux clés dans les locales, et elle apparaît dans l'atelier.
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
 * `famille` regroupe les trames (séance / séquence / projet / spécialisé). Le
 * champ n'est pas encore affiché : il attend que la bibliothèque justifie un
 * regroupement à l'écran.
 *
 * @module parcours/templates
 */

export const TRAMES = [
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
        id: 'evaluation',
        intention: "Se familiariser avec le format par un entraînement corrigé ; passer une évaluation alignée sur les objectifs ; comprendre la correction : pour chaque erreur fréquente, pourquoi elle est fausse et comment la corriger.",
        nameKey: 'parcours_t_evaluation_name',
        descKey: 'parcours_t_evaluation_desc',
        famille: 'seance',
        formats: ['presentiel', 'distanciel', 'hybride'],
        ampleurs: ['courte'],
        paliers: ['entrainement', 'transfert', 'decouverte'],
        modules: [['QuizSet'], ['test_elea'], ['Page']],
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
        id: 'differenciation',
        variantes: { longue: [['test_elea'], ['Page', 'Flashcards', 'FillInTheBlanks'], ['QuizSet', 'Crossword'], ['Devoir', 'Essay', 'Page']] },
        // L'élève choisit mal seul ce dont il a besoin : l'orientation s'appuie
        // sur le score du positionnement, pas sur le ressenti (D81).
        intention: "Se positionner ; proposer un appui de consolidation ; poursuivre l’entraînement ; approfondir. Indiquer à qui sert chaque activité d’après le résultat du test de positionnement (des seuils de score explicites, pas le ressenti) ; tous visent le même objectif. Les choix sont guidés par les consignes : aucune branche ni restriction automatique par note.",
        nameKey: 'parcours_t_differenciation_name',
        descKey: 'parcours_t_differenciation_desc',
        famille: 'sequence',
        formats: ['distanciel', 'hybride'],
        ampleurs: ['moyenne', 'longue'],
        paliers: ['entrainement', 'decouverte', 'entrainement', 'transfert'],
        modules: [
            ['test_elea'],
            ['Flashcards', 'FillInTheBlanks'],
            ['QuizSet', 'Crossword'],
            ['Devoir', 'Essay'],
        ],
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

/**
 * Trames compatibles avec la modalité et l'ampleur choisies.
 * @param {string} format  - `presentiel` | `distanciel` | `hybride`
 * @param {string} ampleur - `courte` | `moyenne` | `longue`
 * @returns {Array<Object>} Les trames retenues, dans l'ordre de la bibliothèque.
 */
export function tramesCompatibles(format, ampleur) {
    return TRAMES.filter(tr => tr.formats.includes(format) && tr.ampleurs.includes(ampleur))
        .map(tr => adapterTrame(tr, ampleur));
}

/** Une trame par son identifiant. */
export function trameParId(id, ampleur) {
    const trame = TRAMES.find(tr => tr.id === id);
    return trame ? adapterTrame(trame, ampleur) : null;
}

/** La même variante alimente la carte, le départ sans IA et le prompt. */
function adapterTrame(trame, ampleur) {
    const modules = trame.variantes?.[ampleur] || trame.modules;
    const intention = trame.intentions?.[ampleur] || trame.intention;
    return { ...trame, modules, intention };
}
