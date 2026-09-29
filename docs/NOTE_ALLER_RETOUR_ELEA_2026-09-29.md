# Aller-retour sur Éléa des nouveautés du 29 septembre 2026

Note de passation pour les agents (ChatGPT, Codex) qui importent sur Éléa et vérifient.
Écrite par Claude le 29 sept. 2026, à la demande d'Emmanuel GAUNARD.

## Règles du jeu

- **Tout se fait sur la branche `emmanuel`** du dépôt `caramel.forge.apps.education.fr`.
  Rien sur `main` : une poussée sur `main` redéploie le site de production.
- Lire d'abord `CLAUDE.md` (conventions : code, commentaires et commits en français,
  libellés par `data-key` dans les 12 locales, fichiers partagés avec la Sucrerie).
- **Aucune de ces nouveautés n'est annoncée aux collègues avant son aller-retour réussi**
  (règle D24 de `docs/PRD_PARCOURS.md`).
- Un défaut trouvé sur Éléa se corrige sur `emmanuel`, AVEC un test qui le reproduit, et
  une contre-épreuve (désarmer le correctif doit faire virer le test au rouge).

## Ce qu'il faut vérifier

| # | Nouveauté | Décision | Fichiers à importer |
|---|---|---|---|
| A | Réglages de l'activité Test (`quiz_settings`) | D86 | 3 `.mbz` |
| B | Image envoyée depuis l'ordinateur dans une Page ou un Livre | D88 | 3 `.mbz` |
| C | Langue du contenu d'une séquence de langue vivante | D87 | à générer dans Caramel |
| D | Activités H5P de démonstration de la page `/decouvrir/` | — | 6 `.h5p` |

### Fabriquer les fichiers

```
node scripts/generer-test-regle-sonde.mjs      # A → tests/.sondes-elea/test-defauts-*.mbz, test-regle-*.mbz, parcours-test-regle-*.mbz
node scripts/generer-sonde-page-images.mjs     # B → tests/.sondes-elea/sonde-page-images.mbz, sonde-livre-images.mbz, sonde-parcours-page-images.mbz (+ fiche .md)
ls assets/presentation/activites/*.h5p         # D → quiz-caramel, vocabulaire, en-une-phrase, mots-meles, video-caramel, preparer-une-activite
```

`tests/.sondes-elea/` est ignoré par git (le point le masque aussi dans le Finder). Une
copie des six `.mbz` et de la liste de contrôle est sur le Bureau d'Emmanuel, dans
« Caramel - à tester sur Éléa ».

Restaurer chaque `.mbz` dans un cours de test d'Éléa (le parcours : comme nouveau cours).

### A — Réglages du Test (D86)

1. **Test par défaut** (`test-defauts-*.mbz`), dans « Paramètres » :
   - Comportement des questions : Feedback différé. Tentatives : Illimité.
   - Mise en page : toutes les questions sur une page. Navigation : Libre. Mélanger : Oui.
   - Options de relecture : toutes les cases cochées dans les quatre colonnes, sauf
     « Feedback global » dans « Pendant la tentative ».
   - Achèvement : « Recevoir une note ». Carnet de notes : note maximale 10.
2. **Test réglé** (`test-regle-*.mbz`), dans « Paramètres » :
   - Comportement : Interactif avec essais multiples. Tentatives : 2. Méthode
     d'évaluation : Dernière tentative. Temps : 15 minutes.
   - Mise en page : une question par page (10 pages). Navigation : Séquentielle.
   - Relecture « Pendant la tentative » : La tentative, Si correct, Points, Feedback
     spécifique, Feedback général — PAS « Réponse juste ». Les trois colonnes « après » :
     Points et Feedback global seulement.
   - Feedback global : deux plages, limite 50 %.
   - En prévisualisation : « Vérifier » sur chaque question ; un essai de plus après une
     erreur quand la question a un indice (Q01, Q03, Q04) ; pas de retour arrière ;
     chronomètre de 15 min ; à la fin, la note et le feedback global, sans relecture des
     réponses.
3. **Parcours** (`parcours-test-regle-*.mbz`) : le Test de la section « Évaluation » a
   les mêmes paramètres que le Test réglé.
4. **Ré-exporter** les trois depuis Éléa et comparer leur `quiz.xml` à ce que Caramel a
   écrit (et à `tests/fixtures/moodle-reference/sept-2026/elea/quiz.xml` pour les
   défauts) : les champs `review*`, `preferredbehaviour`, `attempts_number`,
   `grademethod`, `timelimit`, `questionsperpage`, `navmethod`, `<page>` des slots,
   `<feedbacks>`.

Code concerné : `resoudreReglagesTest` / `quizSettingsXml` / `quizFeedbacksXml` dans
`js/moodle/mbz-course-builder.js` (partagé avec la Sucrerie), `js/moodle/test-io.js`,
`js/simulators/elea-test.js`. Bancs : `tests/roundtrip/mbz-quiz-backup.mjs`,
`tests/run_parcours_course.mjs`, `tests/run_test_edition_audit.mjs`.

### B — Images dans les Pages et Livres (D88)

- La restauration va au bout, sans avertissement.
- Page : les blocs illustrés montrent leur image ; le PNG garde sa transparence.
- L'adresse d'une image est en `pluginfile.php/…/mod_page/content/…/image-….png`
  (`mod_book/chapter/<id>/…` pour le Livre).
- En modifiant la Page, le gestionnaire de fichiers liste exactement 2 fichiers ; après
  un enregistrement, les images sont toujours là.
- Livre : chapitre 1 sans image, chapitre 2 avec ses deux images.
- Vue élève : les images s'affichent.
- Parcours restauré comme nouveau cours : mêmes contrôles.
- Puis, **dans Caramel** (serveur local `python3 tests/serveur-statique.py 8000`) : générer
  une Page, « Éditer », envoyer une image dans un bloc « Grille monuments/images », exporter
  le `.mbz`, le restaurer : même résultat attendu que la sonde.

Code concerné : `js/moodle/page-images.js`, `js/moodle/fichiers-modules.js`, la greffe du
champ `img_file` dans `js/editor/index.js`. Banc : `tests/run_page_images.mjs` (Playwright).

### C — Langue d'une séquence de langue vivante (D87)

Dans Caramel (même serveur local), mode Avancé, **sur les webhooks de développement** :

1. « Qui » = « Professeur d'anglais en lycée », « Quoi » = « Identités et échanges : le
   voyage et l'immigration aux États-Unis », niveau « Seconde ». Générer une **Page**,
   puis un **Test**. Attendu : titres, textes, questions, réponses et retours en anglais.
2. Même chose avec « Professeure d'espagnol », « La fête des morts au Mexique », 3e.
   Attendu : en espagnol.
3. Témoin : « Professeur d'histoire-géographie », « La Révolution anglaise », 4e.
   Attendu : en français.
4. Un **parcours** de langue vivante (atelier « Un parcours ») : le plan et les cartes
   doivent être dans la langue enseignée ; les objectifs, destinés à l'enseignant,
   peuvent rester en français. Ce point n'a pas encore été mesuré (cf. D87, « À surveiller ») :
   `scripts/generer-parcours-reel.mjs` peut en fabriquer un avec le vrai modèle.
5. Restaurer la Page et le Test sur Éléa et vérifier l'affichage.

Avant d'accuser le prompt si un résultat déçoit : sonder le modèle seul (piège 5 de
`CLAUDE.md`, les pannes ILaaS sont silencieuses). Banc : `tests/run_langue_contenu.mjs`.

### D — Activités de démonstration de `/decouvrir/`

La page les propose aux formateurs « à ajouter à votre cours » : elles doivent donc
s'importer sur Éléa comme n'importe quel H5P.

- Importer chacun des 6 `.h5p` (activité H5P, ou dépôt dans la banque de contenus).
- Vérifier qu'ils s'affichent en français et fonctionnent : le quiz annonce son score
  (et la barre de progression, au lecteur d'écran : « Diapositive 1 sur 7 », plus
  « @slide »), les cartes se retournent, le texte se complète, la grille des mots mêlés
  se résout.
- Deux démonstrations ajoutées après les premiers imports du 29 septembre :
  `video-caramel.h5p` (présentation Caramel 7 de PodEduc, quatre pauses-question
  à 0:34, 2:01, 3:11 et 4:27) et `preparer-une-activite.h5p` (six étapes à
  ordonner). **Leur import Éléa reste à faire.** Pour la vidéo : accès Internet
  nécessaire au MP4 public de PodEduc ; vérifier lecture, pauses, réponses et
  reprise. Pour le classement : déplacer les cartes, vérifier le score et la
  correction, puis recommencer.

Les régénérer : `node scripts/generer-demos-presentation.mjs` (déterministe). Banc :
`tests/run_decouvrir.mjs` (volet navigateur en local).

## Rendre compte

- Dans `docs/PRD_PARCOURS.md` : cocher D86 (`- [ ]` → `- [x]`) et retirer « ALLER-RETOUR
  À FAIRE » du titre de D88 quand c'est vérifié, ou y écrire ce qui a échoué ; ajouter une
  entrée datée au **§ 11 Journal** (plateforme, version de Moodle, fichiers importés,
  constats).
- Compléter la section « Résultats » ci-dessous (date, plateforme, verdict par point).
- Avant tout commit : `node tests/run_langue_contenu.mjs`, `node tests/run_decouvrir.mjs`,
  `node tests/roundtrip/mbz-quiz-backup.mjs`, `node tests/run_page_images.mjs`,
  `node tests/run_parcours.mjs` (deux bancs, `calibrage` et `sources`, échouaient déjà
  avant ces travaux), et la suite navigateur `node tests/run_browser_suite.mjs`.

## Résultats

| Date | Plateforme | A | B | C | D | Par |
|---|---|---|---|---|---|---|
| 29 sept. 2026 | Caramel local `emmanuel` (webhooks dev2) + Éléa `test03` (version Moodle non exposée) | **Conforme.** Les trois Tests restaurés montrent les comportements, tentatives, pagination, navigation, relectures, feedbacks et note maximale attendus. Prévisualisation du Test réglé : chronomètre 15 min, « Vérifier », indice et nouvel essai, navigation séquentielle. Les trois réexports Éléa ont été comparés champ par champ (`review*`, `preferredbehaviour`, `attempts_number`, `grademethod`, `timelimit`, `questionsperpage`, `navmethod`, pages des slots, `feedbacks`) aux MBZ Caramel : aucune différence. Le témoin Moodle de sept. garde `questionsperpage=1`, mais D86 corrige volontairement le défaut Caramel à `0` (toutes les questions sur une page). Le feedback global vide vu dans Caramel venait du contrat de génération : la racine `overallfeedback` est désormais exigée, repliée dans `quiz_settings`, puis vérifiée jusque dans `<feedbacks>` (120/0). | **Conforme après correction.** Sur Éléa, Page seule, Livre seul et parcours sont conformes : deux vrais `pluginfile.php`, PNG transparent et JPG chargés ; exactement deux fichiers intégrés dans la Page ; images conservées après enregistrement et visibles en rôle Étudiant ; Livre sans image au chapitre 1, deux images au chapitre 2. L'écart documentaire local a été corrigé : attendu et observé, les cinq occurrences d'images envoyées (#08, deux côtés de #09, #13 et #16) passent par le formateur commun des DOCX/ODT/PDF. Banc 45/45 et contre-épreuve dédiée au bloc `#13_monument_sheet_long` rouge quand le correctif est retiré. | **Écart corrigé dans le code, revalidation réelle à faire.** Observé avant correction : contenus anglais et espagnols en français ; témoin histoire-géographie correct. Désormais, la langue explicitement enseignée est détectée et imposée dans les prompts de l'activité, du plan et des modules ; « Révolution anglaise » ne déclenche pas l'anglais. Banc déterministe 58/0. Restent à rejouer avec le vrai modèle : Page et Test anglais/espagnols, parcours de langue, puis restauration Éléa. | **Écart corrigé localement, réimport Éléa à faire.** Les quatre H5P importés fonctionnaient, mais le quiz n'annonçait pas sa progression. Le `.h5p` régénéré porte maintenant « Diapositive x sur y » dans le nom accessible de chaque groupe de réponses, indépendamment de la région `aria-live` d'Éléa ; le banc local charge les quatre activités et vérifie cette annonce. La nouvelle archive `quiz-caramel.h5p` doit remplacer l'ancienne sur Éléa pour le contrôle final au lecteur d'écran. | Codex |
