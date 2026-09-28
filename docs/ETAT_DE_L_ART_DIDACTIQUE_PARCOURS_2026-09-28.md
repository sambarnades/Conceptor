# État de l'art — la didactique des parcours

> **28 septembre 2026.** Demande d'Emmanuel : « regarder si les pratiques didactiques mises en
> place sont cohérentes : méthode ABC Learning Design ? didactique bien faite ? sciences
> cognitives derrière ? […] ajuster légèrement la liste pour être bien ».
> Décision correspondante : **D81** de [PRD_PARCOURS.md](PRD_PARCOURS.md).
> Références contrôlées en ligne le jour même (Crossref, résumés, PDF d'auteur) ; ce qui n'a
> pas pu l'être est dit.

## 1. Ce qui a été relu, et comment

- Les **19 trames** de `js/parcours/templates.js` (20 depuis D82) : modules par étape, variantes, paliers, intention.
- Le **prompt du plan** (`scenario-prompt.js`) et le **cadre commun** envoyé à chaque activité.
- La **relecture didactique** (six garde-fous, `garde-fous.js`) et le **miroir** des six familles
  (`types-apprentissage.js`).

Chaque trame a été confrontée à trois cadres : ABC Learning Design, les didactiques des
disciplines et les résultats les plus solides des sciences cognitives. Chaque ajustement a
ensuite été éprouvé sur **cinq parcours réels**, générés par le vrai pipeline et relus
carte à carte (`scripts/generer-parcours-reel.mjs`, banc `tests/run_parcours_reels.mjs`).
Deux scénarios ont été ajoutés pour l'occasion : « Réviser » en 5ᵉ et « Démarche de
projet » en 4ᵉ.

## 2. Verdict

**Le socle est sain.** Ce que l'atelier imposait déjà correspond aux effets les mieux établis :

| Ce que fait l'atelier | Ce qui le fonde |
|---|---|
| Au moins une activité qui vérifie les acquis (garde-fou 2) | Pratique du test : g ≈ 0,50 en classe (Yang et al., 2021) ; 0,61 toutes conditions (Adesope et al., 2017) |
| À l'entraînement, l'élève est corrigé (garde-fou 4) | Retour d'information : d = 0,48, et 0,99 quand il porte sur la tâche et la démarche (Wisniewski et al., 2020) |
| Paliers découverte → entraînement → transfert | Petites étapes, pratique guidée puis autonome (Rosenshine, 2012, principes 2, 5 et 9) |
| Activités de 30 min au plus, 12 au plus (garde-fou 6, D5) | Segmentation : d = 0,32 en rétention, 0,36 en transfert (Rey et al., 2019) |
| Même vocabulaire d'une activité à l'autre, « réinvestir sans réintroduire » | Cohérence et signalisation (Mayer & Fiorella, 2014) ; révision régulière (Rosenshine, principe 10) |
| Plan relu par l'enseignant avant toute génération (D6) | Conception à rebours : l'objectif et la vérification sont posés avant le contenu |

**ABC y est déjà.** La première règle du prompt de plan (« lire, enquêter, discuter,
s'entraîner, coopérer ou produire selon le besoin, aucun quota ») énonce les six types
d'apprentissage d'ABC. Les trames sont des « storyboards » déjà faits. Le miroir ne signale
que les absences, sans proportion idéale, comme ABC (§ 3).

**Ce qui n'allait pas**, corrigé (§ 6 et § 7). Les défauts les plus nets :

- **un diagnostic sur UNE affirmation** : en Caramel, un Vrai/Faux ne porte qu'une affirmation,
  donc une chance sur deux et rien de repéré ;
- **une critique entre pairs sans reprise** : la production n'était jamais améliorée ;
- **un test noté sur les habitudes du stagiaire**, qui n'ont pas de bonne réponse ;
- **deux espaces collaboratifs ouverts pour un même travail**.

## 3. ABC Learning Design

**Ce que c'est.** Une méthode d'atelier de conception rapide née à l'University College
London (Young & Perović, 2016) : en 90 minutes, une équipe pose sur un « storyboard » des
cartes représentant six types d'apprentissage, puis précise les activités, la part en
ligne et les évaluations. Les six types sont repris de Diana Laurillard (2012), qui les
dérive de son *Conversational Framework* (2002) ; elle dit *inquiry* là où ABC dit
*investigation*. Les définitions ci-dessous résument celles des cartes officielles (kit 2020) :

| Type ABC | Ce que fait l'apprenant | Famille du miroir Caramel | Modules Caramel les plus proches *(rangement propre à ce document)* |
|---|---|---|---|
| Acquisition | lit, regarde, écoute | découvrir | Page, Livre, Présentation, Paquetage IMS, Lien web |
| Investigation | explore, compare, critique des sources | *(aucune)* — partagée entre découvrir et organiser | Lien web, Surligner, Base de données, Graphique |
| Pratique | applique, reçoit un retour, ajuste | mémoriser + s'exercer | Quiz, Test, Texte à trous, Cartes, Leçon |
| Discussion | formule ses idées, répond aux autres | échanger | Forum, Sondage, Nuage de mots |
| Collaboration | construit un résultat commun | échanger | Wiki, Document collaboratif, Tableau, Glossaire à construire |
| Production | produit un artefact, consolide | produire | Rédaction, Devoir, Atelier |

**Ce qu'ABC ne dit pas.** Il n'impose aucune répartition idéale. Son kit le dit en toutes
lettres : *« The aim of this process is not to advocate any 'ideal' mix, but to stimulate a
structured conversation among the team. »* L'équipe trace la « forme » du module sur un
graphique en toile d'araignée des six types au début de l'atelier, puis la retrace à la
fin. C'est la posture du miroir (D4) : il montre, il ne note pas, et ne signale que ce qui
est absent.

**Aucune carte Moodle ne fait autorité.** Le projet Erasmus+ « ABC to VLE » (septembre 2018 –
août 2020) n'a pas produit de cartes par plateforme, mais des « roues » qui rangent les outils
par type d'apprentissage, déclinées localement. Trois rangements Moodle existent : UCL, Dublin
City University et Sorbonne Université. Ils ne concordent pas. Le forum y figure sous deux à
cinq types selon la source, le glossaire et la base de données sous presque tous, et le
Feedback de Moodle n'apparaît dans aucun. ABC range donc l'**activité conçue**, pas l'outil.
C'est la raison même pour laquelle le miroir ne prétend pas mesurer le travail mental
(en-tête de `types-apprentissage.js`) : un outil ne détermine pas à lui seul un type
d'apprentissage.

**Ce qu'on sait de son effet.** Les évaluations publiées sont déclaratives. À UCL, 90 % des
participants jugent l'atelier positif et 71 % disent avoir amélioré leur cursus ; dans le
projet Erasmus+ (84 ateliers, 11 pays), seule une courte majorité déclare un effet sur la
refonte du cours. Aucune étude ne mesure un effet sur les apprentissages des élèves ou des
étudiants. ABC structure la conversation de conception ; ce qui fait apprendre se trouve au § 4.

**Deux écarts, assumés.** Le miroir n'a pas de famille *investigation* et range discussion et
collaboration sous *échanger*. Il décrit le geste que le module demande (cliquer, écrire,
ordonner), pas l'intention pédagogique. Or « investiguer » dépend du contenu, pas du
module. Refondre le miroir sur les six types d'ABC imposerait leur vocabulaire savant en
douze langues (D4, D59). **Seule piste qui vaudrait** : séparer *échanger* en *discuter* et
*coopérer*. Aujourd'hui un parcours qui n'a qu'un forum ne voit pas qu'il ne fait jamais
construire à plusieurs. **Fait le soir même (D82)** : le miroir compte sept familles.

## 4. Sciences cognitives : ce qui est solide, et où l'atelier s'en sert

| Principe | Ce que dit la recherche | Dans l'atelier |
|---|---|---|
| **Pratique du test** | L'effet le plus robuste : g = 0,50 en classe (Yang et al., 2021). Le format compte peu : le QCM (g = 0,70) n'est pas moins efficace que la réponse courte (0,48) (Adesope et al., 2017) ; sans retour, le QCM l'emporte, et avec retour la réponse courte gagne (Kang et al., 2007 ; Smith & Karpicke, 2014). | Garde-fou 2. Le Rituel garde son Choix unique : rien ne justifiait de le remplacer. |
| **Pratique distribuée** | Rappel de 36,7 % en révision massée contre 47,3 % en révision espacée (Cepeda et al., 2006). Utilité « haute » (Dunlosky et al., 2013). | **Ajouté** : le test de fin porte sur tout le parcours ; le Rituel mêle notions récentes et anciennes. |
| **Entrelacement** | g = 0,42, mais **seulement** pour distinguer des catégories proches (maths g = 0,34, peinture 0,67). Pour les mots de vocabulaire, le blocage l'emporte (g = −0,39) (Brunmair & Richter, 2019). | Le test final mêle les notions ; son bénéfice vient surtout du rappel espacé. **Ne pas** en faire une règle pour les listes de vocabulaire. |
| **Prétest** | Questionner avant d'enseigner aide, **si** la réponse est ensuite étudiée (Pan & Carpenter, 2023). Le gain porte sur le contenu questionné (g = 0,66), pas sur le reste (0,01) (King-Shepard et al., 2025). | Réviser, Différenciation et Formation commencent par se tester. **Ajouté** : la page de rappel part des erreurs fréquentes. |
| **Retour d'information** | d = 0,48 ; d = 0,99 quand il dit quoi faire et comment, 0,24 pour un simple « bravo » ou « faux » (Wisniewski et al., 2020). | Retours par réponse dans chaque exercice. **Ajouté** : les retours d'autoformation expliquent l'erreur ; le corrigé d'une évaluation dit pourquoi et comment corriger. |
| **Guidage des novices** | Découverte non assistée contre enseignement explicite : d = −0,38. Découverte « enrichie » (questions, retours, exemples) : d = +0,30 (Alfieri et al., 2011). Guidage de l'investigation : d = 0,50 (Lazonder & Harmsen, 2016). | **Ajouté** : exploration guidée par des questions (Découvrir une notion, Investigation). |
| **Échec productif** | Chercher avant la leçon : g = 0,36 (Sinha & Kapur, 2021), mais **s'inverse** au primaire (CE1-CM2) et pour les compétences générales. | Pas de trame « problème d'abord » imposée ; la découverte reste guidée. |
| **Exemples résolus** | g = 0,48 en maths. Les exemples corrects seuls battent les exemples erronés (Barbieri et al., 2023). Les exemples erronés ne servent qu'aux élèves déjà avancés (Große & Renkl, 2007). Ce qui aide le novice gêne l'expert (Kalyuga et al., 2003). | **Ajouté** : un exemple résolu avant chaque nouveau type d'exercice (autoformation) ; en remédiation, l'explication juste s'accompagne d'un exemple résolu, pas d'un exemple erroné à chercher. |
| **Texte de réfutation** | Énoncer la conception erronée, la réfuter, puis expliquer : g = 0,41 (Schroeder & Kucera, 2022). | **Ajouté** : c'est la forme de la page de remédiation. |
| **Auto-explication, apprentissage génératif** | g = 0,55 (Bisra et al., 2018) ; résumer, cartographier, s'auto-tester, expliquer (Fiorella & Mayer, 2016) ; engagement interactif > constructif > actif > passif (Chi & Wylie, 2014). | Les paliers d'entraînement et de transfert font produire ; justifier une interprétation, une position ou un jugement de fiabilité. |
| **Charge cognitive** | Segmentation, signalisation, cohérence (Mayer, 2020 ; Rey et al., 2019). | Garde-fous 5 et 6 ; notions stables ; « chaque énigme mobilise une notion, jamais une devinette décorative » (Jeu d'évasion). |

Pour un lecteur français, ces résultats recoupent les **quatre piliers** de Dehaene (2018) :
l'attention, l'engagement actif, le retour sur erreur et la consolidation. Les trois
premiers correspondent au guidage, à la pratique du test et au retour d'information.
La consolidation correspond au rappel espacé.

**Un garde-fou à ne pas surinterpréter.** Le garde-fou 5 (« les types alternent ») évite la
monotonie. Ce n'est pas l'entrelacement, qui porte sur le **contenu** et non sur le format :
le Rituel garde délibérément la même forme d'une fois à l'autre.

## 5. Didactiques : démarche par démarche

| Démarche | Ce que dit la recherche | Ajustement |
|---|---|---|
| Découvrir une notion | Situations d'action, de formulation et de validation, où l'élève cherche sans que la réponse lui soit dictée, puis **institutionnalisation** par le professeur, qui dit ce qu'il faut retenir (Brousseau, 1998) ; découverte guidée (Alfieri et al., 2011). | La synthèse est formulée explicitement ; l'exploration est guidée par des questions. |
| Remédier | L'erreur comme outil (Astolfi, 1997) ; texte de réfutation (Schroeder & Kucera, 2022). | La page énonce l'erreur telle qu'on la commet, la réfute, puis explique avec un exemple résolu. |
| Investigation | Guider chaque étape (Lazonder & Harmsen, 2016) ; conclure par une structuration du savoir. | Questions précises à chaque étape ; « fixer par écrit ce qu'il faut retenir ». |
| Analyser une source (EMI) | Les vérificateurs professionnels **sortent** de la page pour voir qui la publie (Wineburg & McGrew, 2019). Les grilles de critères appliquées à la page seule égarent (Breakstone et al., 2018). La lecture latérale s'enseigne (Breakstone et al., 2021 ; Wineburg et al., 2022). | Juger la source en cherchant qui la publie et ce qu'en disent d'autres sources, plutôt que sur son apparence. |
| Débat argumenté | L'argumentation dialogique améliore l'écrit argumentatif (Kuhn & Crowell, 2011). Vote → discussion → nouveau vote, comme l'instruction par les pairs (Crouch & Mazur, 2001 ; Smith et al., 2009). Un script de collaboration : d = 0,95 sur les compétences d'échange, 0,20 sur les connaissances (Vogel et al., 2017). Enseigner les questions vives (Legardez & Simonneaux, 2006). | Le forum donne sa marche à suivre (argument sourcé, puis deux réponses qui objectent, nuancent ou demandent une preuve) ; la position finale répond à un argument contraire ; le second sondage reprend les mêmes réponses (D80). |
| Étudier une œuvre | Le sujet lecteur et sa réception personnelle (Rouxel & Langlade, 2004) ; le débat interprétatif (Tauveron, 2002). | L'interprétation confronte la première impression de lecture aux indices relevés ; en version longue, un forum. |
| Langue vivante | Le CECRL définit la tâche comme une visée actionnelle qui doit parvenir à un résultat (Conseil de l'Europe, 2001). Annoncer une tâche finale en début de séquence est un usage de la didactique française des langues, pas une prescription du CECRL. Enseignement par tâches : d = 0,93 (Bryfonski & McKay, 2019), ramené à g = 0,61 par une réanalyse (Xuan et al., 2025). | La tâche finale (destinataire, situation) est annoncée d'emblée ; le lexique s'installe pour elle. |
| Travail d'équipe | Objectifs de groupe **et** responsabilité individuelle : +0,32, contre +0,07 sans (Slavin, 1996) ; cinq conditions de Johnson & Johnson (2009). | Rôle et part identifiable de chacun, UN document commun, amélioration dans ce même document, bilan individuel. |
| Démarche de projet | d = 0,71 (Chen & Yang, 2019). La critique n'apprend que si elle mène à une nouvelle version (Berger et al., 2014, « Austin's Butterfly », illustration et non preuve). | **Structure** : l'atelier relit une première version, le devoir recueille la version améliorée, le forum dit ce que les retours ont changé. |
| Évaluation par les pairs | g = 0,31 (Double et al., 2020) ; g = 0,29, et la **formation des évaluateurs** est le facteur décisif (Li et al., 2020). | La consigne des évaluateurs de l'Atelier donne un exemple de commentaire utile : ce qui réussit, ce qui manque, une piste précise. |
| Différenciation | Petit effet en classe (d = 0,15), et les groupes de niveau nuisent aux élèves faibles (d = −0,20) (Deunk et al., 2018). Contrôle **partagé** : l'enseignant présélectionne, l'élève choisit parmi (Kirschner & van Merriënboer, 2013). | Orientation par seuils de score du test de positionnement, pas au ressenti ; tous visent le même objectif. |
| Classe inversée | g = 0,50 (Strelan et al., 2020) ; g = 0,36, et des quiz y ajoutent +0,19 (van Alten et al., 2019). | Les questions corrigées à distance préparent la séance en présence. |
| Jeu d'évasion | Jeux sérieux : apprentissage d = 0,29, motivation non significative (Wouters et al., 2013) ; le débriefing qui relie aux connaissances est décisif (Veldkamp et al., 2020). | Chaque énigme mobilise une notion ; le débriefing dit ce qu'on a appris. |
| Formation d'enseignants (Pix+Édu) | Quatorze mécanismes en quatre groupes : construire les connaissances, motiver, **développer les techniques** (expliquer, modéliser, observer et faire un retour, répéter), **ancrer la pratique** (rappels, plan d'action, auto-observation, répétition en contexte) (guide EEF : Collin & Smith, 2021 ; revue : Sims et al., 2021). Effet moyen modeste sur les élèves (0,05 écart-type), environ 0,17 quand presque tous les mécanismes sont réunis. Un plan précis (quand, où, comment) aide à atteindre son but : d = 0,65 (Gollwitzer & Sheeran, 2006). Sept caractéristiques, dont les modèles de pratique, le retour et la réflexion, la durée (Darling-Hammond et al., 2017). Pix+Édu s'appuie sur le CRCN-Édu (arrêté du 15 juillet 2026). | Exemple de pratique commenté, essai sur un cas, plan d'action daté, mise en œuvre en classe, compte rendu, échange entre collègues, test final ; positionnement sur des connaissances, jamais sur des habitudes. |

## 6. Trame par trame : ce qui a changé

| Trame | Changement | Raison |
|---|---|---|
| Réviser avant l'évaluation | Diagnostic en **série** de Vrai/Faux (`QuizSetVF`) au lieu d'un seul ; rappel qui part des erreurs fréquentes ; test final qui mêle tout le parcours | Un Vrai/Faux ne porte qu'une affirmation ; prétest et rappel espacé |
| Préparer et passer une évaluation | Le corrigé dit, pour chaque erreur fréquente, pourquoi et comment corriger | Retour sur la tâche et la démarche |
| Remédier après l'évaluation | Page en forme de réfutation, avec un exemple résolu | Texte de réfutation, exemples résolus |
| Rituel court | Réveil en série de Vrai/Faux ; notions récentes et anciennes mêlées | Rappel espacé |
| Découvrir une notion | Exploration guidée par des questions ; synthèse explicite | Découverte guidée, institutionnalisation |
| Classe inversée | Les résultats des questions à distance préparent la séance | Quiz dans la classe inversée |
| Étudier une œuvre | Interprétation confrontée à la première impression de lecture | Sujet lecteur |
| Mener une investigation | Questions précises à chaque étape ; trace écrite finale | Guidage de l'investigation, structuration |
| Analyser une source | Sortir de la page pour juger la source ; série de Vrai/Faux | Lecture latérale |
| Débat argumenté | Marche à suivre du forum ; position qui répond à un contre-argument ; série de Vrai/Faux ; **intention par ampleur** | Argumentation dialogique, scripts, instruction par les pairs |
| Différenciation à trois vitesses | Orientation par seuils de score ; même objectif pour tous | Contrôle partagé ; méfiance envers les groupes de niveau |
| Séquence de langue vivante | Tâche finale annoncée d'emblée | Perspective actionnelle |
| Préparer une prise de parole | Mêmes critères pour préparer et s'autoévaluer | Critères de réussite explicites |
| Se former en autonomie | Exemple résolu avant chaque nouveau type d'exercice ; retours qui expliquent ; test sur tout le parcours ; série de Vrai/Faux | Exemples résolus, retour d'information, rappel espacé |
| Formation hybride en trois temps | Positionnement sur des connaissances ; exemple commenté, essai, plan d'action daté ; **structure** : devoir, forum, test final (la rédaction faisait écrire deux fois le compte rendu) | Mécanismes du guide EEF ; plan d'action précis |
| Démarche de projet | **Structure** : rédaction + atelier (première version relue), puis devoir (version améliorée) + forum (ce que les retours ont changé) ; description mise à jour en douze langues | Critique suivie d'une reprise |
| Travail d'équipe | Rôle et part de chacun ; UN document commun, amélioré sur place ; bilan individuel ; **intention par ampleur** | Responsabilité individuelle |
| Jeu d'évasion | Énigmes qui mobilisent une notion ; débriefing | Charge cognitive ; débriefing |
| Apprendre à apprendre *(nouvelle, D82)* | Vrai/faux sur les idées reçues, page de ce qui aide vraiment, cartes et quiz mélangé sur le sujet du cours, plan de révision, bilan des méthodes | Pratique du test, espacement, auto-explication (Dunlosky et al., 2013) ; réfutation des idées reçues |

**Trois règles et un contrôle pour tous les parcours** :

- **Deux règles de plan** :
  - le test de fin porte sur tout le parcours, notions mélangées ;
  - un test ou un quiz porte sur des connaissances qui ont une bonne réponse ; pratiques, habitudes et opinions vont à un questionnaire, une enquête ou un sondage.
- **Un mot interdit de plus** : « version longue » ne doit jamais apparaître dans un texte lu par les participants.
- **Un contrôle** : plusieurs espaces d'écriture commune, ou deux fois le même espace de dépôt, déclenchent la recomposition unique du plan. Ce n'est jamais un échec (`remarquesComposition()`).

**Ne jamais nommer le principe dans l'intention.** Les intentions décrivent des gestes (« la
page énonce l'erreur, montre pourquoi elle ne tient pas… »), jamais « texte de réfutation »
ou « lecture latérale ». Le modèle recopie le vocabulaire de ses instructions dans les textes
lus par les élèves : « notions pivots » (D80), puis « Carte des arguments (version longue) ».

## 7. Ce que les parcours réels ont montré

| Parcours | Avant | Après |
|---|---|---|
| Formation Pix+Édu « Protéger les données » | Test d'ouverture « sur vos pratiques » (« lesquels de ces outils utilisez-vous ? »), noté juste ou faux ; compte rendu écrit deux fois | Test sur des connaissances ; exemple commenté, cas, plan d'action ; test final « questions mélangées de toutes les étapes » |
| Pix+Édu « Concevoir une activité collaborative » | Second Document collaboratif « Améliorer votre document » (deux fois de suite, malgré la règle) ; livre « Synthétiser les idées de l'équipe » | UN document, une section par membre ; forum de coordination ; bilan individuel par questionnaire |
| Débat argumenté (3ᵉ) | Wiki « Carte des arguments (version longue) », « si tu choisis cette option » ; forum intitulé « Règles du débat » | Forum qui porte le débat, avec sa marche à suivre ; wiki construit à partir du forum ; position qui répond à un contre-argument |
| Réviser (5ᵉ, fractions) | *(nouveau)* | Série de Vrai/Faux, page des erreurs fréquentes, entraînement, test final sur toutes les notions |
| Démarche de projet (4ᵉ, podcast) | *(nouveau)* — premier jet : un quiz pour « établir un calendrier » | Script, relecture en atelier, version améliorée, forum sur ce que les retours ont changé ; le quiz vérifie les connaissances, le wiki organise |

**Ce qui reste du ressort de la relecture.** Des erreurs de fond échappent à tout contrôle
automatique : le test final de la formation donnait pour bonne réponse « changer
régulièrement vos mots de passe », une pratique que l'ANSSI et la CNIL ne recommandent plus.
La relecture du formateur, sur l'écran de fabrication, reste indispensable (D80).

## 8. Ce qui n'a pas changé, et pourquoi

- **L'entrée par l'intention** (D4) : pas de taxonomie ABC au cadrage, pas de réglage de plus.
- **Le miroir** : pas refondu sur les six types d'ABC (§ 3). La séparation de *discuter* et
  *coopérer* reste à décider.
- **Aucun branchement automatique par note** en différenciation : les consignes orientent.
  Les restrictions d'accès de Moodle permettraient d'aller plus loin, avec un aller-retour
  réel à faire.
- **Une seule trame nouvelle**, ajoutée le soir même (D82) : « Apprendre à apprendre ». Elle
  fait essayer, sur le sujet du cours, les méthodes aux preuves les plus solides (se tester,
  se re-tester quelques jours plus tard, expliquer), après une série de vrai/faux qui réfute
  les idées reçues (relire, surligner, tout réviser la veille), puis fait planifier les
  révisions.
- **Le format des questions** : aucune préférence imposée entre QCM et réponse courte, la
  recherche ne la justifie pas.

## 9. Références

Métadonnées contrôlées sur Crossref le 28 sept. 2026. Pour chaque référence, la mention
entre crochets dit ce qui a été lu.

**ABC Learning Design**
- Laurillard, D. (2002). *Rethinking university teaching* (2ᵉ éd.). RoutledgeFalmer. [le *Conversational Framework*]
- Laurillard, D. (2012). *Teaching as a design science: Building pedagogical patterns for learning and technology*. Routledge. [les six types]
- Young, C., & Perović, N. (2016). Rapid and creative course design: As easy as ABC? *Procedia – Social and Behavioral Sciences, 228*, 390–395. doi:10.1016/j.sbspro.2016.07.058
- Young, C., & Perović, N. (2020). *ABC LD Toolkit*, parties 1 à 5 (introduction, « ABC to VLE », « Does ABC LD work? »). UCL / Erasmus+. https://abc-ld.org/ [citation « ideal mix », roues d'outils, évaluations]
- Roues Moodle comparées : UCL (blog abc-ld, 10 mars 2020, et roue 2020) ; Glynn, M., & Gormley, C., *DCU Localised ABC to VLE App Wheel* ; Michou, V., & Hasenknopf, B., *Activity Based Curriculum Design*, Sorbonne Université (2018, PDF de mai 2020).

**Sciences cognitives**
- Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research, 87*(3), 659–701. doi:10.3102/0034654316689306 [chiffres par format via des sources secondaires concordantes]
- Alfieri, L., Brooks, P. J., Aldrich, N. J., & Tenenbaum, H. R. (2011). Does discovery-based instruction enhance learning? *Journal of Educational Psychology, 103*(1), 1–18. doi:10.1037/a0021017
- Barbieri, C. A., Miller-Cotto, D., Clerjuste, S. N., & Chawla, K. (2023). A meta-analysis of the worked examples effect on mathematics performance. *Educational Psychology Review, 35*, 11. doi:10.1007/s10648-023-09745-1
- Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. *Educational Psychology Review, 30*(3), 703–725. doi:10.1007/s10648-018-9434-x
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. doi:10.1037/bul0000209
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin, 132*(3), 354–380. doi:10.1037/0033-2909.132.3.354
- Chi, M. T. H., & Wylie, R. (2014). The ICAP framework. *Educational Psychologist, 49*(4), 219–243. doi:10.1080/00461520.2014.965823
- Dehaene, S. (2018). *Apprendre ! Les talents du cerveau, le défi des machines*. Odile Jacob.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest, 14*(1), 4–58. doi:10.1177/1529100612453266
- Fiorella, L., & Mayer, R. E. (2016). Eight ways to promote generative learning. *Educational Psychology Review, 28*(4), 717–741. doi:10.1007/s10648-015-9348-9
- Große, C. S., & Renkl, A. (2007). Finding and fixing errors in worked examples. *Learning and Instruction, 17*(6), 612–634. doi:10.1016/j.learninstruc.2007.09.008
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist, 38*(1), 23–31. doi:10.1207/S15326985EP3801_4
- Kang, S. H. K., McDermott, K. B., & Roediger, H. L. (2007). Test format and corrective feedback modify the effect of testing on long-term retention. *European Journal of Cognitive Psychology, 19*(4–5), 528–558. doi:10.1080/09541440601056620
- King-Shepard, Walker, Nokes-Malach, Carpenter & Fraundorf (2025). Méta-analyse des effets de préquestion, *Educational Psychology Review, 37*(4), 115. doi:10.1007/s10648-025-10075-7 [titre et initiales non relevés ; chiffres lus dans un extrait du résumé]
- Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why minimal guidance during instruction does not work. *Educational Psychologist, 41*(2), 75–86. doi:10.1207/s15326985ep4102_1
- Kirschner, P. A., & van Merriënboer, J. J. G. (2013). Do learners really know best? Urban legends in education. *Educational Psychologist, 48*(3), 169–183. doi:10.1080/00461520.2013.804395
- Lazonder, A. W., & Harmsen, R. (2016). Meta-analysis of inquiry-based learning: Effects of guidance. *Review of Educational Research, 86*(3), 681–718. doi:10.3102/0034654315627366
- Mayer, R. E. (2020). *Multimedia learning* (3ᵉ éd.). Cambridge University Press. — Mayer, R. E., & Fiorella, L. (2014), chapitre du *Cambridge Handbook of Multimedia Learning* (2ᵉ éd.) pour les chiffres.
- Pan, S. C., & Carpenter, S. K. (2023). Prequestioning and pretesting effects. *Educational Psychology Review, 35*, 97. doi:10.1007/s10648-023-09814-5
- Rey, G. D., et al. (2019). A meta-analysis of the segmenting effect. *Educational Psychology Review, 31*(2), 389–419. doi:10.1007/s10648-018-9456-4
- Rosenshine, B. (2012). Principles of instruction. *American Educator, 36*(1), 12–19, 39.
- Schroeder, N. L., & Kucera, A. C. (2022). Refutation text facilitates learning: A meta-analysis of between-subjects experiments. *Educational Psychology Review, 34*(2), 957–987. doi:10.1007/s10648-021-09656-z
- Sinha, T., & Kapur, M. (2021). When problem solving followed by instruction works: Evidence for productive failure. *Review of Educational Research, 91*(5), 761–798. doi:10.3102/00346543211019105
- Smith, M. A., & Karpicke, J. D. (2014). Retrieval practice with short-answer, multiple-choice, and hybrid tests. *Memory, 22*(7), 784–802. doi:10.1080/09658211.2013.831454
- Wisniewski, B., Zierer, K., & Hattie, J. (2020). The power of feedback revisited. *Frontiers in Psychology, 10*, 3087. doi:10.3389/fpsyg.2019.03087
- Yang, C., Luo, L., Vadillo, M. A., Yu, R., & Shanks, D. R. (2021). Testing (quizzing) boosts classroom learning. *Psychological Bulletin, 147*(4), 399–435. doi:10.1037/bul0000309

**Démarches et didactiques**
- Astolfi, J.-P. (1997). *L'erreur, un outil pour enseigner*. ESF.
- Berger, R., Rugen, L., & Woodfin, L. (2014). *Leaders of their own learning*. Jossey-Bass. — et la vidéo « Austin's Butterfly », EL Education.
- Breakstone, J., McGrew, S., Smith, M., Ortega, T., & Wineburg, S. (2018). Why we need a new approach to teaching digital literacy. *Phi Delta Kappan, 99*(6), 27–32. doi:10.1177/0031721718762419
- Breakstone, J., Smith, M., Connors, P., Ortega, T., Kerr, D., & Wineburg, S. (2021). Lateral reading: College students learn to critically evaluate internet sources in an online course. *HKS Misinformation Review, 2*(1). doi:10.37016/mr-2020-56
- Brousseau, G. (1998). *Théorie des situations didactiques*. La Pensée sauvage.
- Chen, C.-H., & Yang, Y.-C. (2019). Revisiting the effects of project-based learning on students' academic achievement. *Educational Research Review, 26*, 71–81. doi:10.1016/j.edurev.2018.11.001
- Bryfonski, L., & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. *Language Teaching Research, 23*(5), 603–632. doi:10.1177/1362168817744389
- Collin, J., & Smith, E. (2021). *Effective professional development. Guidance report*. Education Endowment Foundation.
- Conseil de l'Europe (2001). *Cadre européen commun de référence pour les langues : apprendre, enseigner, évaluer*. Didier. — Volume complémentaire, version française 2021.
- Crouch, C. H., & Mazur, E. (2001). Peer Instruction: Ten years of experience and results. *American Journal of Physics, 69*(9), 970–977. doi:10.1119/1.1374249
- Darling-Hammond, L., Hyler, M. E., & Gardner, M. (2017). *Effective teacher professional development*. Learning Policy Institute.
- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38*, 69–119. doi:10.1016/S0065-2601(06)38002-1
- Deunk, M. I., Smale-Jacobse, A. E., de Boer, H., Doolaard, S., & Bosker, R. J. (2018). Effective differentiation practices. *Educational Research Review, 24*, 31–54. doi:10.1016/j.edurev.2018.02.002
- Double, K. S., McGrane, J. A., & Hopfenbeck, T. N. (2020). The impact of peer assessment on academic performance. *Educational Psychology Review, 32*(2), 481–509. doi:10.1007/s10648-019-09510-3
- Johnson, D. W., & Johnson, R. T. (2009). An educational psychology success story: Social interdependence theory and cooperative learning. *Educational Researcher, 38*(5), 365–379. doi:10.3102/0013189X09339057
- Kuhn, D., & Crowell, A. (2011). Dialogic argumentation as a vehicle for developing young adolescents' thinking. *Psychological Science, 22*(4), 545–552. doi:10.1177/0956797611402512
- Legardez, A., & Simonneaux, L. (dir.) (2006). *L'école à l'épreuve de l'actualité. Enseigner les questions vives*. ESF.
- Li, H., Xiong, Y., Hunter, C. V., Guo, X., & Tywoniw, R. (2020). Does peer assessment promote student learning? A meta-analysis. *Assessment & Evaluation in Higher Education, 45*(2), 193–211. doi:10.1080/02602938.2019.1620679
- Rouxel, A., & Langlade, G. (dir.) (2004). *Le sujet lecteur. Lecture subjective et enseignement de la littérature*. PUR.
- Sims, S., Fletcher-Wood, H., O'Mara-Eves, A., Cottingham, S., Stansfield, C., Van Herwegen, J., & Anders, J. (2021). *What are the characteristics of effective teacher professional development? A systematic review and meta-analysis*. Education Endowment Foundation. — Publié en revue : *Review of Educational Research, 95*(2), 213–254 (2025). doi:10.3102/00346543231217480
- Slavin, R. E. (1996). Research on cooperative learning and achievement. *Contemporary Educational Psychology, 21*(1), 43–69. doi:10.1006/ceps.1996.0004
- Smith, M. K., Wood, W. B., Adams, W. K., Wieman, C., Knight, J. K., Guild, N., & Su, T. T. (2009). Why peer discussion improves student performance on in-class concept questions. *Science, 323*(5910), 122–124. doi:10.1126/science.1165919
- Strelan, P., Osborn, A., & Palmer, E. (2020). The flipped classroom: A meta-analysis. *Educational Research Review, 30*, 100314. doi:10.1016/j.edurev.2020.100314
- Tauveron, C. (dir.) (2002). *Lire la littérature à l'école*. Hatier.
- van Alten, D. C. D., Phielix, C., Janssen, J., & Kester, L. (2019). Effects of flipping the classroom on learning outcomes and satisfaction. *Educational Research Review, 28*, 100281. doi:10.1016/j.edurev.2019.05.003
- Veldkamp, A., van de Grint, L., Knippels, M.-C. P. J., & van Joolingen, W. R. (2020). Escape education: A systematic review on escape rooms in education. *Educational Research Review, 31*, 100364. doi:10.1016/j.edurev.2020.100364
- Vogel, F., Wecker, C., Kollar, I., & Fischer, F. (2017). Socio-cognitive scaffolding with computer-supported collaboration scripts. *Educational Psychology Review, 29*(3), 477–511. doi:10.1007/s10648-016-9361-7
- Wineburg, S., & McGrew, S. (2019). Lateral reading and the nature of expertise. *Teachers College Record, 121*(11), 1–40. doi:10.1177/016146811912101102
- Wineburg, S., Breakstone, J., McGrew, S., Smith, M. D., & Ortega, T. (2022). Lateral reading on the open Internet: A district-wide field study in high school government classes. *Journal of Educational Psychology, 114*(5), 893–909. doi:10.1037/edu0000740
- Xuan, Cheung & Liu (2025). Réanalyse de Bryfonski & McKay (2019). *Language Teaching Research, 29*(7), 2949–2962. doi:10.1177/13621688221131127 [titre non relevé]
- Wouters, P., van Nimwegen, C., van Oostendorp, H., & van der Spek, E. D. (2013). A meta-analysis of the cognitive and motivational effects of serious games. *Journal of Educational Psychology, 105*(2), 249–265. doi:10.1037/a0031311
