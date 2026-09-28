# Capacités H5P : audit depuis les contrats natifs

> **Suivi à cocher et ordre de reprise** : [SUIVI_H5P_PARCOURS.md](SUIVI_H5P_PARCOURS.md). Le présent document conserve les détails techniques de l’inventaire et des vérifications.

11 septembre 2026 — continuation de [l’audit génération/édition](AUDIT_GENERATION_EDITION_2026-09-11.md).
Périmètre précisé par l’utilisateur : bibliothèques **Éléa récupérées fin août**,
27 activités visibles, leurs sous-activités et les trois sorties Word, ODT et PDF.

## Ce que les résultats précédents prouvaient

Les 83 exemples, les essais de formulaires et les 3 706 variations de champs
vérifiaient surtout les chemins déjà exposés. Ils ne prouvaient pas que tous les
champs pédagogiquement utiles des bibliothèques étaient proposés, ni que chaque
champ éditable était repris à bon escient sur papier. La préservation d’un champ
inconnu au nettoyage de l’éditeur ne garantit pas sa préservation par le processeur.

Les six familles Test déjà prises en charge sont **l’état actuel**, pas une exclusion
des autres familles demandées. La formulation précédente qui en faisait un chantier
séparé était une restriction introduite par l’assistant.

## Complément vérifié après cet inventaire

Le [lot cartes du 11 septembre](RECETTE_H5P_CARTES_2026-09-11.md), commits bas
`945fe51a` / Sucrerie `81fc5d4`, corrige l’audio DialogCards, les options Flashcards,
les délais SingleChoiceSet et les indices Summary. Les 27 références ont été
retouchées, enregistrées et réexportées dans Éléa ; Row/RowColumn sont collectés.
Les formulations « actuel » de la matrice ci-dessous décrivent le **constat initial** ;
les corrections et les limites à jour sont dans le suivi central. Le Test natif
est également conservé dans le dépôt. Les clôtures complètes restent ouvertes.

## Inventaire reproductible

`node scripts/inventorier-capacites-h5p.mjs [rapport.json]` part du registre des
activités, retrouve les versions de `library.json`, parcourt **tous** les champs de
`semantics.json` (y compris optionnels) et les choix de bibliothèques des conteneurs.
Il collecte aussi les branches des schémas d’éditeur et les champs alternatifs des
images. Une empreinte SHA-256 des semantics rend détectable une future mise à jour.

Inventaire initial : **27 activités et 59 bibliothèques référencées**. Les chemins
sans correspondance littérale sont des points de contrôle : alias, widgets graphiques,
libellés traduits et champs réellement absents doivent être distingués. Aucune
« couverture à 100 % » n’est déduite d’une égalité de noms ou d’un total d’assertions.
Le rapport brut est écrit dans `/tmp/caramel-capacites-h5p.json` par défaut ; aucune
nouvelle suite lourde n’est ajoutée à la CI. Une référence native n’est pas résolue
localement : `H5P.Row 1.3`, proposée par `H5P.Column 1.22`. Elle est signalée dans le
rapport, sans annoncer ce bloc comme disponible ni changer les bibliothèques Éléa.

## Matrice de travail par activité

La colonne « à compléter/qualifier » recense des capacités natives à examiner,
**pas des corrections toutes réalisées**. Les options de boutons, de lecture et de
navigation n’ont pas à être imprimées telles quelles. Consignes, réponses, variantes,
indices, retours, médias et barèmes doivent en revanche recevoir une décision explicite.

| Activité | Version locale | À compléter / qualifier après comparaison |
|---|---|---|
| Timeline | 1.1.27 | Fond, miniature d’événement, zoom initial ; alias `timeline.height`/`height` à vérifier au paquet |
| Flashcards | 1.7.23 | Choix d’exiger une saisie avant solution ; conservation du réglage natif racine ; indices et crédits d’images au papier |
| QuizSet | 1.21.13 | Page d’introduction, navigation arrière, tirage d’un sous-ensemble, boutons de fin ; cohérence des réglages des sous-questions |
| QuizSetQCM | 1.21.13 | Même contrat conteneur que QuizSet, toutes les options de QCM accessibles au même endroit |
| QuizSetVF | 1.21.13 | Même contrat conteneur, retours Vrai/Faux et options de reprise |
| Glossary | 1.0.47 | Texte du panneau couvert ; qualifier les autres bibliothèques natives proposées dans `panels[].content` |
| Crossword | 0.5.13 | Mot solution, placement imposé et indice média ; ne pas confondre avec la génération automatique de grille |
| Essay | 1.5.20 | Réponse modèle, variantes, retours et poids sur papier **corrigés dans ce lot** ; tolérance par mot, seuils et taille du champ encore à qualifier |
| Summary | 1.10.32 | Indices par groupe sur papier ; forme transparente du groupe `tip` |
| DragTheWords | 1.10.50 | Distracteurs **ajoutés dans ce lot** ; le contrat natif autorise aussi indices/retours par mot, contrairement à l’ancien prompt |
| DragAndDrop | 1.15.37 | Retours et indices par zone, zone à dépôt unique, répétition d’étiquette, affichage des labels ; positions déjà gérées par le panneau graphique |
| FillInTheBlanks | 1.14.37 | Exiger une réponse avant solution, reprise après réussite ; variantes/indices/retours imbriqués jusqu’au corrigé papier |
| MarkTheWords | 1.11.24 | Commande de vérification et média autre qu’image ; options numériques à ne pas recopier inutilement sur papier |
| TrueFalse | 1.8.21 | Vérification désactivable et média ; retours canoniques déjà réparés |
| MultipleChoice | 1.16.27 | Solution après saisie, vérification ; `behaviour.type` présent via groupe de champs, ne pas le compter absent |
| FindTheWords | 1.4.4 | Alphabet de remplissage et préférence de chevauchement ; effet réel sur la grille imprimée |
| SortParagraphs | 0.11.9 | Paragraphes identiques interchangeables, boutons de déplacement accessibles, média de consigne |
| SingleChoiceSet | 1.11.88 | Délais après réponse juste/fausse lorsque l’enchaînement automatique est actif |
| DialogCards | 1.9.40 | Audio par carte, navigation arrière, répétition/progression ; le processeur actuel reconstruit les cartes sans recopier leur audio |
| Dictation | 1.3.3 | Segmentation linguistique, sens du texte et variantes de solution ; audio normal/lent déjà éditable |
| Chart | 1.2.33 | Champs natifs principaux exposés ; contrôler lisibilité/valeurs de l’image et du tableau dans les trois documents |
| CoursePresentation | 1.27.15 | Modèle simplifié versus éléments natifs libres, médias et commentaires ; réglages des exercices et sauvegarde des placements natifs |
| InteractiveBook | 1.15.0 | Couverture média, indicateurs de progression, reprise ; liste des blocs natifs versus blocs réellement éditables |
| InteractiveVideo | 1.28.36 | Poster, chapitrage/signets, écran final et options de lecture ; types d’interactions natifs au-delà du modèle simplifié |
| ImageHotspots | 1.11.6 | Icône/couleur propre à un point et plein écran ; médias par point déjà présents dans le panneau |
| FindTheHotspot | 1.8.34 | Géométrie, réponse et retours exposés par le modèle aplati ; contrôle du fond et du corrigé dessiné |
| FindMultipleHotspots | 1.0.1 | Nombre de zones, géométrie, réponses et retours exposés ; contrôle du fond et du corrigé dessiné |

## Correctifs de ce lot

### Glisser les mots

- Champ facultatif « Mots supplémentaires », au même endroit que le texte, dans
  l’activité seule, QuizSet, CoursePresentation et InteractiveBook.
- Processeur autonome et adaptation conteneur conservent le champ `distractors`.
- Papier : les mots supplémentaires sont mélangés aux choix ; le corrigé ne les
  présente pas comme des réponses. Les indices/retours inclus dans les marqueurs
  ne contaminent plus la réponse attendue ; une barre `/` littérale est conservée.
- Prompts traduits dans les douze langues : distracteurs facultatifs justifiés par
  l’objectif ; correction de l’affirmation « seul le feedback global est possible ».
  Un exemple source contient de vrais distracteurs plausibles.

### Question ouverte (Essay)

Le formateur partagé reprend désormais la réponse modèle rédigée, sa présentation,
les variantes, la pondération (y compris zéro), les occurrences et les retours par
mot-clé. Ils figurent dans la partie corrigé, après la fiche élève, en activité seule
et en question de QuizSet. Un helper unique évite la divergence des deux voies.

## Test Moodle : extension à conduire sans exclusion arbitraire

| Famille | Contrat à exercer avant de la déclarer prise en charge |
|---|---|
| Six familles existantes | Garder les sondes réelles ; unités et fichiers restent à couvrir pour les numériques |
| Description, composition | Élément informatif sans réponse ; réponse ouverte, format/longueur, correction manuelle et pièces jointes |
| Mots manquants, glisser sur texte | Groupes de choix, indices de trous, doublons, mélange et restitution des réponses |
| Classement | Ordre exact/partiel, sous-ensemble éventuel, notation et comportement du plugin présent sur la cible |
| Calculée, calculée simple, QCM calculé | Variables, formules, jeux de valeurs, unités, tolérances et arrondis ; mêmes données en édition, aperçu et MBZ |
| Appariement aléatoire | Dépendances à la banque/catégorie et aux questions utilisées |
| Déposer sur image, marqueurs | Fond, zones, géométrie, fichiers, réponses et correction graphique |
| Enregistrement, Formules, STACK | Contrat et version du plugin effectivement installé, médias/moteur de calcul ; ne pas inventer une compatibilité depuis le nom |
| GeoGebra | Faible priorité explicitement indiquée par l’utilisateur ; conservation/import à qualifier |

Les questions calculées nécessitent des jeux de valeurs en plus du texte et de la
formule : c’est une extension de données, pas seulement un nouveau choix dans le
menu. Voir [le contrat Moodle](https://docs.moodle.org/405/en/Calculated_question_type)
et [l’API des types de questions](https://moodledev.io/docs/4.5/apis/plugintypes/qtype).
La sauvegarde native créée sur le bac à sable Éléa doit encore être récupérée localement.

## Critère de clôture de l’audit complet

Pour chaque capacité retenue : exemple structurant, création ou modification dans le
formulaire réel, sauvegarde/réouverture, paquet décompressé, export papier adapté,
lecture des trois fichiers et sonde plateforme lorsque le comportement en dépend.
Chaque champ natif reçoit un statut : exposé et vérifié, piloté automatiquement,
préservé sans édition, non pertinent pour l’auteur, ou manquant à implémenter.
Les modules et listes de choix imbriqués suivent le même contrôle.

**L’inventaire et les deux corrections ci-dessus ne clôturent pas encore cette matrice.**
Il reste à transformer les points qualifiés en extensions fonctionnelles, en particulier
les médias de DialogCards, les conteneurs et les familles Test supplémentaires.

## Vérifications de ce complément

- Tests ciblés éditeur/formatage : **172 assertions, zéro échec**.
- Sucrerie : **3 095 tests, zéro échec, 145 suites** après synchronisation.
- Banc manuel `node tests/run_h5p_capabilities_documents.mjs --all` : **96 fichiers**
  générés par le vrai exporteur (32 cas × DOCX/ODT/PDF), dont un exemple des 27 activités.
  Archives Word/ODT ouvertes et XML lu ; texte de chaque PDF extrait avec `pdftotext`.
  Les cas ciblés vérifient les retouches dans le package et dans les trois documents.
- La réponse modèle et les distracteurs ont aussi été contrôlés visuellement après
  ouverture réelle dans LibreOffice et conversion en PDF. Les fichiers sont dans
  `/tmp/caramel-capacites-documents` et `/tmp/caramel-capacites-rendu`.
- Oracle documentaire existant : **134 exports / 2 098 entrées d’archive**. Douze
  différences relues et références actualisées : dix liées aux compléments Essay /
  distracteurs et deux à l’ancienne correction de l’exemple Cloze `test_1.json`
  (`Éthiopie/Abyssinie` devenu deux réponses alternatives dans `c38f02d7`).
- Miroir Sucrerie : **50 fichiers conformes**, contraintes de champs et ordre conformes,
  **1 040 clés** partagées présentes dans les douze langues. Les fichiers divergents
  de contraintes ont reçu uniquement l’ajout nécessaire.

Limites des essais : les ressources externes sont bloquées dans le nouveau banc ;
il ne valide pas les images distantes de chaque exemple. Les PDF du banc utilisent
le repli local, pas le service Gotenberg distant. Aucune campagne de nouvelles
réponses IA ni restauration Éléa de ces distracteurs n’a été exécutée dans ce lot.
Les 96 fichiers ne constituent pas 96 validations visuelles détaillées. La matrice
complète ci-dessus reste ouverte, en particulier les nouvelles familles de questions.

### Contrôle global et réparation d’un ancien banc

Le passage des 42 suites a donné 14 237 PASS et 23 FAIL, tous localisés dans
`test-h5p-prefetch.js`. Ce banc construisait ses archives avec les seules dépendances
supplémentaires, sans bibliothèque principale ni dépendances dynamiques du QuizSet.
L’ancien retour prématuré du lecteur masquait l’échec réel ; l’attente corrigée au lot
précédent l’a rendu visible. Le banc fournit maintenant les mêmes dépendances que
le packaging de production et exige aussi la présence du cadre H5P après chargement.
Sa relance donne **25 PASS, zéro échec** pour les 23 aperçus et les deux contrôles
communs. Les 41 autres suites du passage global étaient vertes ; elles n’ont pas été
relancées après cette correction limitée au banc. Aucun contrôle n’a été désactivé.
