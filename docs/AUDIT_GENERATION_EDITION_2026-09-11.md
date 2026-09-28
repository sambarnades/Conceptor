# Audit génération → édition → export — 11 septembre 2026

> **Pour savoir ce qui reste à faire** : [checklist centrale](SUIVI_H5P_PARCOURS.md). Ce rapport porte principalement sur les exemples et les champs déjà exposés ; il ne clôture pas la couverture de toutes les capacités natives. Voir aussi [la matrice des capacités](AUDIT_CAPACITES_H5P.md).

## Périmètre et état

Demande d’Emmanuel : réparer le WebP refusé par Éléa et la syntaxe Cloze affichée
comme du texte, consolider le Test et vérifier chaque H5P avec son package, son
éditeur et la conservation des retouches.

- Point de sauvegarde **avant les corrections : `9ac25fbb`**, branche `bas/emmanuel`.
- Corrections et contrôles locaux décrits dans ce lot effectués ; compléments des capacités natives à poursuivre. Version conservée : **7.0.0**.
- **Restauration réelle et essai effectués** dans le cours Éléa de test **794**.
- Fichiers communs propagés dans **Sucrerie/emmanuel en local**. Aucun déploiement
  Sucrerie, aucune intervention sur `main`, aucune ingestion RAG.
- À terminer en plateforme : récupérer la sauvegarde native créée dans Éléa,
  puis rééditer et restaurer ce fichier natif. Le téléchargement n’a pas fourni
  de fichier local à l’outil ; une demande de son emplacement est en attente.

Ce rapport décrit la couverture constatée. Un import réussi ne prouve pas tous
les réglages, tous les navigateurs ni tous les plugins Moodle.

## Corrections livrées

### Images

`processBackgroundImage` convertit réellement le WebP en PNG, avec transparence,
dimensions, extension et MIME cohérents. Les outils d’image déjà présents sont
réutilisés, sans nouvelle bibliothèque. JPEG et PNG restent les sorties compatibles.

Un garde-fou au dernier empaquetage traite aussi les anciens scénarios : les
références des images WebP/AVIF/SVG/HEIC/HEIF sont réécrites récursivement sur une
copie. Les noms avec espaces/accents et les collisions de noms sont couverts.
Les médias non référencés ne sont pas injectés dans le H5P.

### Test Moodle

- Le code `{1:NUMERICAL:=5.5:0.5}` dans une question de type `numerical` est
  remplacé par un emplacement de réponse dans l’énoncé ; valeur et tolérance
  rejoignent leurs champs. Une réponse explicitement saisie, même zéro, est
  prioritaire. Plusieurs trous restent une véritable question Cloze.
- Un BACKUP Moodle est lu comme un BACKUP, avec les slots, versions et enfants
  Cloze. Il n’est plus confondu avec un XML d’import de banque de questions.
- Réédition : banque et slots sont régénérés ensemble ; ordre, ajouts, points,
  pénalités et réglages QCM suivent les retouches. Les anciennes banques sont
  conservées pour éviter de casser un autre Test qui les utilise.
- Un seul constructeur de questions BACKUP sert aux Tests autonomes et parcours.
- Les réponses numériques alternatives, leurs tolérances, crédits et retours
  sont conservés. La saisie accepte zéro, décimales, virgule et notation scientifique.
- Cloze : retours séparés des tolérances, casse SAC, variantes, crédit partiel,
  multiréponse, disposition, mélange et caractères échappés. Les formes avancées
  restent modifiables en source dans la fenêtre du trou, sans perte au passage
  par le formulaire simple.
- Les QCM à réponse unique déjà valides gardent leurs crédits partiels et pénalités.
- L’aperçu prend en compte les fractions et les poids des questions ; le score
  transmis au parcours garde le crédit partiel. Le retour Vrai/Faux correspond
  bien à la réponse choisie, y compris lorsque la bonne réponse est Faux.
- GIFT refuse une banque contenant du Cloze plutôt que télécharger silencieusement
  une banque incomplète. Le message propose XML ou MBZ.
- Les types non pris en charge et les questions natives avec fichiers joints
  produisent une erreur explicite. Pas de conversion destructive ni de suppression
  silencieuse de question.

### Éditeur et H5P

- Le nettoyage conserve les réglages natifs absents du formulaire ; seuls les
  champs connus d’un ancien type dynamique sont retirés. Les groupes de champs
  sont traversés correctement ; les expressions de validation restent des RegExp.
- Glossaire : le niveau de titre survit à la sérialisation JSON et les définitions
  natives `panels` suivent les retouches.
- QCM H5P : le mode de réponse utilise `behaviour.type` (automatique/unique/multiple).
- Rédaction H5P : variantes des mots-clés, points, occurrences, casse et retours
  sont éditables/conservés dans les activités autonomes et imbriquées. La solution
  peut être une véritable réponse modèle, au lieu d’une liste artificielle de mots.
  La casse peut suivre le réglage de chaque mot-clé ; le réglage global reste prioritaire.
  Les longueurs sont exprimées en caractères, comme le moteur H5P, et non en mots.
- Vrai/Faux : les retours natifs sont visibles et une retouche prime sur l’ancien
  retour de l’IA, après sauvegarde et réouverture.
- QuizSet : le mélange des questions rejoint son champ natif à la racine.
- Présentation : l’impression rejoint le groupe natif `override`.
- Retrait des options affichées mais absentes des semantics : recommencer sur
  Flashcards, réglages fictifs de Summary, solution sur DragAndDrop et certains
  réglages de MarkTheWords.

## Types de question Test : couverture réelle

« Oui » signifie génération, formulaire d’édition, XML, MBZ et aperçu couverts.
L’essai Éléa a porté sur les six familles effectivement proposées par Caramel.

| Type visible dans Éléa | Caramel | Validation / limite |
|---|---|---|
| Choix multiple, réponse unique et multiple | Oui | Fractions, retours, numérotation, mélange, points ; restauré et répondu |
| Vrai/Faux | Oui | Bonne réponse et retours distincts ; restauré et répondu |
| Appariement | Oui | Paires, mélange, retours et crédit partiel ; restauré et répondu |
| Réponse courte | Oui | Variantes, casse et joker ; restauré et répondu |
| Numérique | Oui | Virgule, tolérance, réponses alternatives, crédits ; tolérance testée sur Éléa |
| Cloze / réponses intégrées | Oui | Menus, court, numérique ; variantes avancées préservées ; plusieurs trous testés sur Éléa |
| Composition | Non | Pas de formulaire ni génération Test ; le H5P Rédaction est une autre activité |
| Description | Non | Pas encore proposée comme élément de banque Test |
| Appariement aléatoire à réponse courte | Non | Nécessite la sélection d’une banque existante ; import rejeté explicitement |
| Calculée, calculée simple, calculée à choix multiple | Non | Jeux de données et variables non implémentés |
| Classement | Non | Contrat de question distinct à intégrer |
| Enregistrement audio/vidéo | Non | Contrat et fichiers propres à la question à intégrer |
| Formules | Non | Plugin et contrat spécifiques |
| GeoGebra | Non | Hors priorité selon la demande d’Emmanuel |
| Glisser-déposer sur texte | Non | Contrat Moodle distinct du H5P Glisser-déposer |
| Glisser-déposer sur image | Non | Contrat et références des images à intégrer |
| Marqueurs à glisser-déposer | Non | Zones, marqueurs et images à intégrer |
| Sélectionner les mots manquants | Non | Contrat de groupes/choix à intégrer |
| STACK | Non | Plugin et moteur de calcul spécifiques |

Les **six types pris en charge** sont les seuls demandés dans le prompt structurant.
Ses sept exemples couvrent notamment les deux modes QCM. L’exemple Cloze « Éthiopie »
accepte maintenant `Éthiopie` **ou** `Abyssinie` via deux réponses, au lieu d’une
réponse littérale contenant une barre oblique.

Limites d’import conservatrices : unités numériques natives non gérées ; pièces
jointes des questions à remapper avant de pouvoir les rééditer ; questions
aléatoires non développées. L’ajout des types ci-dessus reste dans le chantier
demandé, à accompagner de références natives et d’une restauration sur plateforme.

## Audit des 27 H5P

Méthode : **83 exemples**, génération des vrais ZIP, lecture de `h5p.json` et
`content/content.json`, résolution des bibliothèques et parcours de leurs
`semantics.json`. Puis normalisation → dénormalisation → nouvel export sur les
83 exemples. Pour chacun des **27 types**, une retouche réelle dans le formulaire
est sauvegardée, retrouvée dans le package et retrouvée à la réouverture.

Un second passage modifie les champs scalaires des formulaires sur tous les
exemples et tous les éléments de tableau : **3 706 transmissions constatées**
(**1 807 chemins distincts** par type), avec deux valeurs d’essai par champ.
Ce comptage n’inclut pas les widgets spécialisés comme s’il s’agissait de champs
texte : images, vidéo, audio, grilles et listes à syntaxe propre sont suivis séparément.

| Module | Exemples empaquetés et réédités | Contenu et réglages examinés |
|---|---:|---|
| Timeline | 3 | Dates, événements, titres, descriptions, médias, légendes et crédits |
| Flashcards | 3 | Questions/réponses, images, progression ; retrait de l’option inopérante |
| QuizSet | 5 | Sous-questions, paramètres, seuil, progression et mélange ; QCM/Essay/VF corrigés |
| QuizSetQCM | 6 | Questions, réponses, fractions H5P, retours et réglages du quiz |
| QuizSetVF | 2 | Affirmations, bonne réponse, retours et réglages du quiz |
| Glossary | 2 | Termes, définitions et niveau de titre ; format natif et listes |
| Crossword | 3 | Mots, indices, indices enrichis, thème et disposition |
| Essay | 3 | Consigne, mots-clés, variantes, points, occurrences, casse, retours et solution |
| Summary | 2 | Groupes d’affirmations, bonne proposition, indices et retours |
| DragTheWords | 3 | Texte à marqueurs, consigne, indices, retours et comportement |
| DragAndDrop | 2 | Étiquettes, zones, bonnes associations, disposition et médias |
| FillInTheBlanks | 3 | Consigne, trous, variantes, indices et retours |
| MarkTheWords | 4 | Texte marqué, consigne, retours ; retrait des réglages inexistants |
| TrueFalse | 3 | Affirmation, correction et retours natifs |
| MultipleChoice | 2 | Réponses, correction, retours et mode de réponse natif |
| FindTheWords | 3 | Mots, orientations, visibilité du vocabulaire et réglages de grille |
| SortParagraphs | 2 | Paragraphes, ordre et retours |
| SingleChoiceSet | 2 | Questions, réponses, retours et progression |
| DialogCards | 3 | Recto/verso, titres, descriptions, médias et comportement |
| Dictation | 1 | Phrases, fichiers audio, notation et retours ; vrai WAV injecté, sans appel TTS |
| Chart | 3 | Séries, valeurs, libellés, mode et couleurs |
| CoursePresentation | 5 | Diapositives et exercices imbriqués ; impression native corrigée |
| InteractiveBook | 13 | Chapitres, blocs, tables, médias, exercices et réglages du livre |
| InteractiveVideo | 2 | Source, temps, interactions, retours et navigation |
| ImageHotspots | 1 | Fond, positions, contenus des points, retours ; PNG vérifié dans Éléa |
| FindTheHotspot | 1 | Fond, zones et bonnes réponses ; PNG vérifié dans Éléa |
| FindMultipleHotspots | 1 | Fond, zones et réponses attendues ; PNG vérifié dans Éléa |

Rapports reproductibles :

- `tests/sonde-parcours/audit-activites-2026-09-11/paquets-semantics.json`
- `tests/sonde-parcours/audit-activites-2026-09-11/champs-editeur.json`
- `node scripts/auditer-paquets-h5p.mjs`
- `node scripts/auditer-champs-h5p.mjs`

### Interprétation des écarts du scanner

Les listes `anomalies` ne sont pas un bilan d’échec automatique. Elles conservent
les détails bruts pour relecture : métadonnées (`title`, identifiants), alias de
modèle, paramètres conditionnels sans vidéo/zone fixée, ou libellés utilisés par
le lecteur mais non déclarés dans ses semantics. Les packages gardent aussi des
champs historiques ignorés par le moteur, sans les promouvoir dans le formulaire.

Les champs `sansEffet` ont été qualifiés : titres dans `h5p.json`/métadonnées,
repères internes des zones, préréglage de thème traité par son callback, MIME
YouTube imposé par la source, sous-titres absents. Dans `crossword_3.json`, l’entrée
mathématique non admissible dans la grille est retirée par le healer ; son indice
ne peut donc pas modifier le package. Il ne s’agit pas d’une perte au save.

L’audit ne prétend pas exposer tous les paramètres techniques ou tous les réglages
possibles des bibliothèques H5P. Les champs natifs non exposés sont désormais
préservés par le nettoyage. Les appels TTS/vidéo distants n’ont pas été rejoués
pour les 83 exemples ; les médias injectés rendent le banc local reproductible.

## Essai réel Éléa

Cours autorisé : https://test03.elea.apps.education.fr/course/view.php?id=794

Archive importée par Emmanuel : `sonde-images-test.mbz`, conservée dans le dossier
de sondes. Trois H5P et un Test, deux sections.

- H5P **13805, 13806, 13807** : images PNG chargées (120 × 80), sans rejet de liste
  blanche. Le point « Retouche conservée » et son contenu sont présents.
- Test **13808** : **12 questions** restaurées, six familles. Tentative de
  prévisualisation **3707**, total **15/17**.
- Numérique simple corrigée : `5,8` accepté pour `5,5 ± 0,5`, sans code Cloze affiché.
- Cloze mixte numérique/court/menu : **3/3**, avec tolérance et casse.
- Les deux points perdus correspondent aux réponses de contrôle : « Mussolini »
  au lieu de « Benito Mussolini », puis « Éthiopie » face à l’ancienne réponse
  littérale « Éthiopie/Abyssinie ». Ce dernier exemple source a été corrigé après
  cet import ; ne pas présenter le binaire historique comme déjà régénéré.

Sauvegarde native créée avec succès dans l’espace privé de sauvegarde Éléa :
**`sonde-test-export-elea-2026-09-11.mbz`**, environ 9,6 Ko, sans utilisateurs ni
historique de tentatives. Son téléchargement n’a pas retourné de fichier local.
La réédition de cette sauvegarde native réelle reste à tester une fois reçue.
Les tests locaux de réimport utilisent de vrais BACKUP construits par Caramel.

## Vérifications finales

| Vérification | Résultat |
|---|---:|
| Suite navigateur complète, 42 suites | 14 249 assertions réussies, 0 échec |
| Suites simulateurs / options / livre après le dernier ajustement du score | 427 réussies, 0 échec |
| Audit Test, export et interactions réelles | 44 réussies, 0 échec |
| Images / PNG / alpha / collisions / anciens scénarios / MBZ | 12 réussies, 0 échec |
| Constructeur BACKUP quiz existant | 51 réussies, 0 échec |
| Relecture réelle du parcours | 37 réussies, 0 échec, aucune erreur JS non gérée |
| Types du parcours | 19 réussies, 0 échec |
| Garde-fous du parcours | 46 réussies, 0 échec |
| Documentation multilingue du parcours | 193 réussies, 0 échec |
| Éditeur Sucrerie local : 7 suites ciblées | 190 tests réussis, 0 échec |
| Fichiers partagés | 27 éditeur + 15 export identiques ; contraintes concordantes |
| Traductions du code partagé | Présentes dans les 12 langues dans les deux dépôts |
| Libellés H5P | 380 clés contrôlées dans les 12 langues |

Les bancs lourds ajoutés pour cet audit restent **hors CI**. Quatre assertions de
conservation d’options ont rejoint une suite navigateur existante ; les tests de
Sucrerie couvrent aussi sa couture propre de sauvegarde Vrai/Faux.

Les nouvelles traductions incluent le breton. La relecture linguistique par des
locuteurs bretons reste souhaitable, comme convenu, sans bloquer les tests techniques.

## Sources des contrats

- [Moodle : contrats des types de questions](https://moodledev.io/docs/4.5/apis/plugintypes/qtype).
- [Format Moodle XML](https://docs.moodle.org/401/en/Moodle_XML_format).
- [Moodle 4.5 : extraction des Cloze, fractions, tolérances et échappement](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/multianswer/questiontype.php).
- [Moodle 4.5 : disposition et notation des QCM](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/multichoice/question.php).
- Contrats H5P : `js/vendor/h5p-libs/*/semantics.json` et contenu réellement empaqueté.

## Périmètre précisé après relecture utilisateur

Voir [l’audit des capacités natives](AUDIT_CAPACITES_H5P.md). Les validations précédentes portent principalement sur les champs existants ; elles ne constituent pas une preuve d’exhaustivité des champs éditables ou des exports. Les types Test supplémentaires ne sont pas exclus de la demande.
