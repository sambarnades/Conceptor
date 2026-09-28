# Retour du lot manuel — 26/26 archives reçues

Les archives sont comparées aux fichiers remis, restés figés. Les écarts complets,
les contenus, les semantics principales et les SHA-256 sont conservés par activité.
Un réexport ne clôture pas à lui seul l’audit de l’éditeur et des documents.

L’utilisateur signale que le n° 23 était sans image. Le défaut est confirmé :
le script de préparation avait imbriqué l’image dans un groupe qui doit être aplati.
Le processeur Caramel gérait déjà cet aplatissement ; le défaut venait de la sonde.

| N° | Activité | Réexport | Retouche repérée | Médias sources |
|---|---|---|---|---|
| 2 | Summary | 11 bibliothèques | `summaries[0].tip` | Aucun média source |
| 3 | DragTheWords | 11 bibliothèques | `taskDescription` | Aucun média source |
| 4 | Essay | 14 bibliothèques | `keywords[0].keyword` | 1/1 identiques |
| 5 | FillInTheBlanks | 13 bibliothèques | `text` | 1/1 identiques |
| 6 | MarkTheWords | 12 bibliothèques | `taskDescription` | 1/1 identiques |
| 7 | TrueFalse | 11 bibliothèques | `behaviour.feedbackOnCorrect` | 1/1 identiques |
| 8 | MultipleChoice | 12 bibliothèques | `answers[0].tipsAndFeedback` | 1/1 identiques |
| 9 | SingleChoiceSet | 13 bibliothèques | `choices[0].question` | Aucun média source |
| 10 | Flashcards | 6 bibliothèques | `cards[0].tip` | 1/1 identiques |
| 11 | DialogCards | 10 bibliothèques | `dialogs[0].tips.front` | 2/2 identiques |
| 12 | Dictation | 15 bibliothèques | `sentences[0].description` | 1/1 identiques |
| 13 | FindTheWords | 6 bibliothèques | `taskDescription` | Aucun média source |
| 14 | SortParagraphs | 12 bibliothèques | `taskDescription` | 1/1 identiques |
| 15 | Crossword | 16 bibliothèques | `words[0].extraClue` | Aucun média source |
| 16 | Glossary | 3 bibliothèques | `panels[0].title` | Aucun média source |
| 17 | QuizSet | 19 bibliothèques | `introPage.introduction`, `questions[0].params.question` | Aucun média source |
| 18 | QuizSetQCM | 16 bibliothèques | `introPage.introduction` | Aucun média source |
| 19 | QuizSetVF | 17 bibliothèques | `introPage.introduction` | Aucun média source |
| 20 | DragAndDrop | 18 bibliothèques | Enregistrement natif ; aucun marqueur RELU repéré | Aucun média source |
| 21 | Timeline | 2 bibliothèques | `timeline.date[0].headline` | 1/1 identiques |
| 22 | ImageHotspots | 8 bibliothèques | `hotspots[0].header` | 1/1 identiques |
| 23 | FindTheHotspot | 13 bibliothèques | Titre interne | 1/1 identiques |
| 24 | FindMultipleHotspots | 11 bibliothèques | `imageMultipleHotspotQuestion.hotspotSettings.hotspot[0].userSettings.feedbackText` | 1/1 identiques |
| 25 | CoursePresentation | 64 bibliothèques | `presentation.slides[0].elements[0].action.params.question` | Aucun média source |
| 26 | InteractiveBook | 22 bibliothèques | `chapters[0].metadata.title` | 2/2 identiques |
| 27 | InteractiveVideo | 54 bibliothèques | Titre interne | 2/2 identiques |

Les normalisations HTML (paragraphes, apostrophes échappées) sont distinguées des
modifications de valeur. Les ajouts de défauts et retraits natifs restent à qualifier
contre les semantics, activité par activité ; ils ne sont pas tous des pertes.
Les temps vidéo et certaines positions sont aussi ajustés par l’éditeur natif.

## N° 23 — réexport corrigé reçu

Titre : **RECETTE 23 — Trouver la zone — image corrigée RELU**. L’image est
identique octet pour octet, les zones et réglages sont conservés ; seule une
normalisation HTML sans changement de texte intervient dans le contenu.
La comparaison utilise la sonde corrigée, et non la première archive défectueuse.

**26/26 réexports natifs reçus, 25 retouches repérables et 18 médias sources
conservés à l’identique.** Aucun média référencé ne manque. La partie import,
retouche et réexport confiée à l’utilisateur est terminée pour ce lot. L’audit
complet des éditeurs, prompts et documents reste distinct : Graphique est
toujours la seule clôture exhaustive acquise à ce stade.
