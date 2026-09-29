# Ajouter le « Test étudiant » (mod_studentquiz) aux modules de la plateforme

Note de passation pour l'agent (ChatGPT) qui fera le travail, du code à l'aller-retour
sur Éléa. Écrite par Claude le 29 sept. 2026, à la demande d'Emmanuel GAUNARD.

## La demande

Des collègues qui ont testé Caramel le 29 sept. 2026 : « Rajouter test étudiant et les
paramètres des tests (dispo dans Éléa) ». Les paramètres des tests sont faits (D86).
Reste le **Test étudiant** : Emmanuel veut qu'il fasse partie des **modules de la
plateforme** proposés dans les choix de l'atelier de parcours (la mosaïque « Choisir le
type d'activité », section « Modules de la plateforme »).

Le Test étudiant (`mod_studentquiz`) est une activité où **les élèves créent eux-mêmes
des questions**, répondent à celles des autres, les notent et les commentent. Il est
proposé par **Éléa seulement** (`tests/fixtures/moodle-reference/sept-2026/palettes.json`,
entrée `studentquiz`, confirmé par D77).

## Règles du jeu

- **Tout se fait sur la branche `emmanuel`** du dépôt `caramel.forge.apps.education.fr`.
  Rien sur `main`.
- Lire d'abord `CLAUDE.md`, puis **`docs/PRD_PARCOURS.md`** : c'est la mémoire de
  l'atelier de parcours (décisions D1 à D88, avec leurs raisons). Ne rien y rouvrir sans
  l'avoir lu, et y écrire toute décision nouvelle.
- Code, commentaires et commits en français. Libellés par clés i18n dans les **12
  locales**, à la même position partout (la suite i18n l'exige).
- **Aucun module n'est annoncé avant son aller-retour réel sur la plateforme** (D24).

## Ce que dit déjà le PRD

- **D70** a ouvert la palette aux modules de la plateforme, relevés sur deux exports
  réels, et a **écarté le Test étudiant**, avec cette raison : « sa banque de questions
  appartient aux élèves ». Elle est juste — mais elle vaut aussi pour le Wiki, le Forum
  ou le Glossaire à construire, qui arrivent VIDES avec leur consigne. C'est le même
  modèle qu'il faut suivre ici : **rien à générer, l'IA rédige la consigne**.
- **Il faut donc une décision nouvelle, D89**, qui revient sur D70 pour ce module : la
  demande des collègues, le modèle « module vide + consigne », le choix d'achèvement
  (ci-dessous), le résultat de l'aller-retour.
- **D71** : un module sans achèvement sort de l'ouverture progressive. Un achèvement qui
  dépend d'AUTRES élèves peut bloquer la suite du parcours pour toujours : c'est le pire
  échec possible d'un parcours.

## La référence Éléa

`tests/fixtures/moodle-reference/sept-2026/elea/studentquiz.xml` et
`studentquiz.module.xml` (export réel de Moodle 5.1.7, 27 sept. 2026). À relever tels
quels, notamment :

- `grade` 100, `anonymrank` 1, `questionquantifier` 10, `approvedquantifier` 5,
  `ratequantifier` 3, `correctanswerquantifier` 2, `incorrectanswerquantifier` -1,
  `aggregated` 1, `publishnewquestion` 1, `commentdeletionperiod` 10 ;
- `allowedqtypes` : `multichoice,truefalse,match,shortanswer,numerical,calculated,calculatedmulti,calculatedsimple,multianswer,ddwtos,ddimageortext,ddmarker,gapselect` ;
- les conteneurs `<attempts>`, `<questions>`, `<progresses>`, `<rates>`, `<comments>`,
  `<notifications>`, `<statehistories>` **vides** (données des élèves) ;
- achèvement : `completion` 2 avec `completionpoint` 1, `completionquestionpublished` 0,
  `completionquestionapproved` 0 ; `groupmode` 1 sur Éléa (le parcours écrit `0`
  partout, cf. README du relevé).

**Point à vérifier en premier** : le Test étudiant range les questions dans une banque
liée au contexte du module. Regarder si l'export complet d'origine contenait une catégorie
de questions pour ce contexte (`questions.xml`) et si la restauration l'exige. Le README
du relevé rappelle la règle : un `fileref` ou une dépendance dans l'`inforef.xml` veut dire
qu'il faut la recopier, sinon ne pas ouvrir le module (cf. D75, où un fichier oublié
faisait échouer l'import du cours entier).

## Où travailler

1. **Le registre** : `js/parcours/modules-natifs.js`, objet `MODULES_NATIFS`. Prendre
   modèle sur `parcours_wiki` (module vide + consigne) :
   - clé `parcours_test_etudiant`, `moduleName: 'studentquiz'`, `rienAGenerer: true` ;
   - `platforms: ['Éléa']`, écrit en ligne comme `['Magistère']` pour la classe virtuelle
     (ne PAS le proposer sur Magistère ni Moodle, D26) ;
   - `note: true` (le module est noté : le prompt ne doit rien promettre d'autre) ;
   - `champs` : `title`, `intro` (la consigne : quel type de questions créer, combien,
     sur quelles notions du parcours, comment noter et commenter celles des autres) ;
   - `construire: construireTestEtudiant` — une fonction qui écrit le XML au plus près de
     la référence (voir `construireWiki` pour la forme).
2. **L'achèvement** — recommandation à confirmer par l'aller-retour : `completion` 2 avec
   **`completionquestionpublished` 1** et `completionpoint` 0. Publier une question dépend
   du seul élève ; gagner des points dépend des questions et des votes des AUTRES (risque
   de blocage, D71). Si la restauration ne garde pas ce réglage, passer le module
   `sansAchevement: true` (hors de l'ouverture progressive), comme le Wiki.
3. **L'icône** : `assets/images/activities/plateforme-studentquiz.webp`, dans le style
   des 20 autres `plateforme-*.webp` (pictogramme blanc sur carré de couleur).
4. **Les libellés** : `parcours_mod_test_etudiant_name` (« Test étudiant ») et
   `parcours_mod_test_etudiant_desc` dans les 12 locales, à côté des autres
   `parcours_mod_*`.
5. **Le plan** : une ligne dans `USAGES_PLAN` de `js/parcours/scenario-prompt.js`
   (quand le proposer : faire formuler des questions par les élèves, réviser à plusieurs).
6. **L'aide** : `node scripts/aide-parcours.mjs` met à jour ce que Caramelia et le RAG
   savent des modules (D83) ; `--verifier` en garde-fou.

## Les tests

- `node tests/run_parcours_natifs.mjs` : le banc compare le registre aux relevés et aux
  palettes. Il doit accepter le nouveau module sur Éléa seulement, et comparer son XML à
  `sept-2026/elea/studentquiz.xml`.
- Un test de l'achèvement retenu (et une contre-épreuve : l'achèvement « points »
  doit être refusé si c'est le choix fait).
- `node tests/run_parcours.mjs` (deux bancs, `calibrage` et `sources`, échouaient déjà
  avant le 29 sept.), `node tests/run_parcours_types.mjs`, la suite navigateur
  `node tests/run_browser_suite.mjs`, `node scripts/check-shared-i18n.mjs`.

## L'aller-retour sur Éléa (obligatoire avant d'annoncer)

- `node scripts/generer-parcours-sonde.mjs --plateforme=elea` : y ajouter une carte Test
  étudiant, restaurer le `.mbz` sur un cours de test d'Éléa.
- Vérifier : la restauration va au bout ; le Test étudiant a son titre et sa consigne ;
  un compte élève peut créer une question, y répondre, la noter ; l'achèvement se coche
  comme prévu ; l'ouverture progressive ne bloque pas la suite.
- Ré-exporter le cours et comparer `studentquiz.xml` à ce que Caramel a écrit.
- Écrire le résultat dans D89 et au § 11 Journal du PRD.

## Côté Sucrerie

`js/parcours/modules-natifs.js` n'est pas dans la liste des fichiers partagés
(`scripts/lib/shared-files.mjs` côté Sucrerie) : rien à recopier. Vérifier seulement que
l'export « Parcours .mbz » d'une collection Sucrerie n'a pas à connaître ce module.
