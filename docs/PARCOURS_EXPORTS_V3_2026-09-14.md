# Parcours enrichis : exports et préparation n8n — 14 septembre 2026

Lot en développement sur `emmanuel`. Aucune mise en production dans ce lot.

## Réalisé et vérifié

- [x] Manifeste de collection v3 : introduction, étapes, consignes intercalées, références ordonnées et conclusion. Lecture des anciennes collections v1/v2 conservée.
- [x] Cohérence entre la liste historique des activités et le parcours enrichi contrôlée ; ordre des propriétés JSON indifférent.
- [x] Aperçu conservant les textes même quand une activité référencée est indisponible.
- [x] Export du brouillon depuis l’éditeur : Moodle `.mbz`, Word, ODT, PDF et ZIP. Textes pédagogiques conservés dans la sonde ; ZIP comprenant le manifeste `parcours.json` et le LISEZMOI.
- [x] Refus d’un export documentaire ou Moodle incomplet quand une référence ne peut pas être résolue.
- [x] Contexte BAS partagé entre les versions de cache de la bibliothèque, avec limitation au propriétaire et dossier désignés. Aucun repli silencieux vers le stockage local après une erreur distante.
- [x] 97 contrôles ciblés réussis : manifeste (9), cours brouillon (4), transport (11), serveur (4), brouillon (6), plan (10), aperçu (13), publication historique (19), téléchargement (9), archive cours (12).
- [x] Préparation depuis les exports actuels **C. Sucrerie Depot (PROD)** et **F. Sucrerie Auteur (PROD)** : un seul nœud modifié par workflow, connexions inchangées, validation v1/v2/v3 testée localement. Copies préparées inactives ; aucune réimportation effectuée.

## Reste à valider ou développer

- [x] Sonde textuelle importée réellement dans Éléa, cours 796 « Nouveau bac », par fusion sans écraser la configuration. Quatre textes affichés dans le bon ordre, sauvegarde native réussie, fichier téléchargé et XML comparé : textes et ordre strictement conservés. Preuve : `tests/collection-draft-course/preuves/elea-textes-2026-09-14.json` dans Sucrerie.
- [x] Recette mixte réellement restaurée dans Éléa 796 : deux occurrences DialogCards, un Test Moodle à choix multiple et six textes (9 éléments, aucune exclusion). Première carte retournée France → Paris ; seconde occurrence naviguée vers Italie ; Test prévisualisé et corrigé à 1/1 avec le retour « Exact. ».
- [x] Modification de la consigne du second H5P dans l’éditeur natif, enregistrement puis lecture : « RELU Éléa… » affiché. Première sauvegarde mixte réexportée : les bibliothèques sont ajoutées au H5P passé par l’éditeur. Le seul changement du champ de titre de métadonnées ne constituait pas une preuve suffisante de modification, d’où cet essai sur la consigne visible.
- [ ] Dernier réexport après modification de consigne : sauvegarde native créée, téléchargement local et comparaison finale encore en cours. Vérification reproductible : `python3 tests/collection-draft-course/verify-elea-mixed.py /chemin/vers/le-reexport.mbz`.
- [ ] Vérification visuelle du nouveau choix de format sur téléphone.
- [ ] Raccordement de la publication et du partage au brouillon enrichi : les lecteurs v3 sont prêts, le bouton de publication historique n’est pas encore raccordé au brouillon.
- [ ] Persistance du compte habituel et installation de production : actuellement, recette BAS explicite ou brouillon local. La table de brouillons de production n’a pas été créée.
- [ ] Réimport coordonné des workflows nécessaires après recette complète. Les copies C/F préparées ne constituent pas encore une consigne de réimport.
- [ ] Assistance IA dans l’organisation de collection : validation de bout en bout encore à faire.

## Preuves et commandes (dans Sucrerie)

- `node tests/collection-plan/run-ui.mjs` — réseau distant bloqué ; résultat `tests/collection-plan/preuves/resultats.json`.
- `node tests/collection-manifest-v3/run-workflows.mjs` — aucun appel n8n ; résultat `tests/collection-manifest-v3/preuves/workflows.json`.
- `node tests/collection-draft-course/run-ui.mjs` — cinq téléchargements ; artefacts et résultat dans `tests/collection-draft-course/preuves/`.
- Vérification complémentaire effectuée : textes de la sonde retrouvés dans XML Word/ODT, LISEZMOI du ZIP et texte extrait du PDF. La sonde textuelle a ensuite passé le cycle import/affichage/réexport Éléa ; la recette mixte reste ouverte.

Les fichiers préparés n8n sont dans le dossier local ignoré `n8n-workflows/preparation-collections-v3-2026-09-14/`. Les exports sources sont inchangés. Le contenu reste au format SQL existant `collection` : v3 est une version du manifeste JSON, pas un nouveau format de colonne. La persistance privée nécessite séparément la table `collection_draft`, déjà installée seulement dans BAS.

Production préservée ; aucune publication d’activité, aucune migration SQL, aucun workflow importé dans ce lot. Ingestion RAG laissée coupée. Commits du lot : Sucrerie `bd31b1f` ; report bas `97b4a064`. Commits locaux, non poussés dans ce lot.

### Comportement constaté en fusion Éléa

La restauration additive fusionne les sections par numéro : la section 1 existante garde son nom « Étape exportée », et reçoit les éléments de « Découvrir ». La section 2 nouvellement créée porte bien « Vérifier ». C’est la conséquence du choix de conserver le cours existant ; les neuf éléments du parcours restent ordonnés. Une recette de restauration dans un cours vide reste utile pour valider tous les titres de sections sans cette fusion. La plateforme convertit également les catégories de questions en modules de banque de questions ; avertissement accepté, question ensuite essayée avec succès.

Preuve des interactions réalisées : `tests/collection-draft-course/preuves/elea-mixte-interactions-2026-09-14.json` (Sucrerie). Aucun résultat de comparaison du dernier fichier n’est déclaré tant que celui-ci n’a pas été récupéré.

## Mise a jour : lot suivant termine localement

Le dernier reexport Elea a ete recupere et compare avec succes. Le bouton de publication charge maintenant le brouillon sauvegarde ; parcours conserve dans le resume IA et le payload v3. 102 tests cibles et recette du vrai bouton avec services interceptes reussis. Voir `PUBLICATION_PARCOURS_V3_2026-09-14.md` pour la procedure n8n et les limites encore ouvertes. Les mentions de comparaison et de raccordement en cours plus haut sont historiques.
