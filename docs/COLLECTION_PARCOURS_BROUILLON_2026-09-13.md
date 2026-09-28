# Collection parcours : brouillon local — 13 septembre 2026

## Réalisé et vérifié

- [x] Dans une collection, bouton « Organiser en parcours » réservé à localhost pendant la recette.
- [x] Édition du titre, de l’introduction, de la conclusion, des étapes et de leurs consignes.
- [x] Ajout d’activités déjà présentes dans la bibliothèque, ajout de consignes intercalées, suppression et réorganisation dans chaque liste.
- [x] Aperçu utilisant le modèle et le rendu communs du premier lot.
- [x] Sauvegarde sur cet appareil, séparée par compte et collection ; réouverture après navigation avec ordre et textes conservés.
- [x] Fermeture avec changements non enregistrés protégée ; stockage inaccessible/corrompu non écrasé ; erreur de quota visible.
- [x] Aucun contenu d’activité ni justificatif de session dans le brouillon. Les références sont résolues de nouveau avec la bibliothèque à chaque ouverture.
- [x] Actions de sauvegarde/fermeture accessibles au bas de l’éditeur sur ordinateur et téléphone. Douze traductions.

## Preuves

Dans Sucrerie :

- `node tests/collection-draft/run-ui.mjs` : édition de deux étapes, consigne intercalée, ajout de référence, changement d’ordre, sauvegarde, nouvelle navigation et réouverture, annulation d’une modification ; 1280 et 390 px sans débordement. **Zéro requête distante, zéro écriture HTTP**, session navigateur isolée et données fictives.
- `tests/collection-draft/preuves/` : captures et `resultats.json`.
- `node tests/collection-plan/run-ui.mjs` : **69 tests ciblés réussis**, dont six nouveaux contrôles du brouillon.
- `tests/collection-plan/preuves/suite-complete.json` : **3 114 tests réussis, 147 suites, aucun échec**.
- Démonstration autonome et anonyme : `http://127.0.0.1:8200/tests/collection-draft/demo.html`.

## Limites et prochain lot

Ce brouillon n’est pas un manifeste publié. L’interface indique explicitement que ses modifications ne sont pas incluses dans les partages ou téléchargements actuels de la collection. Il est réservé à la recette localhost et ne modifie ni la collection serveur, ni les activités référencées. La session connectée par l’utilisateur n’a pas servi à effectuer des écritures.

- [ ] Contrat de manifeste enrichi et validation serveur rétrocompatible v1/v2 ; persistance distante de l’ordre et des textes.
- [ ] Raccordement du brouillon au lecteur partagé, aux exports et au dépôt Caramel, sans publication enfant automatique.
- [ ] Conservation du thème et contrôle des changements concurrents à ce raccordement.
- [ ] Aide IA, propositions relues avant application.
- [ ] Recette distante privée après installation contrôlée du support serveur ; aucun test public.

Aucun push, déploiement ou migration de base. Ingestion RAG laissée coupée. Les changements d’interface Caramel en cours restent séparés de ce lot.

Commit de réalisation Sucrerie : `97dd609` (local, branche `emmanuel`).
