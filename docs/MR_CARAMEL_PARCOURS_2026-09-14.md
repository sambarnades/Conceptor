# MR emmanuel vers main — Caramel bas

Titre proposé : **Compléter les activités H5P et intégrer l’atelier de parcours**

## Description à copier

Cette branche complète les éditeurs et prompts des 27 activités H5P et ajoute le circuit de création de parcours : plan, génération des activités, édition, sauvegarde/reprise du scénario et exports. Une IA externe peut fournir le plan ou le contenu d’une activité, avec vérification avant application. Les livres générés comportent au moins trois chapitres.

Le choix « Une activité / Un parcours » se trouve sous le formulaire Rapide/Avancé, avant les filtres ou l’atelier. Le sélecteur et les filtres utilisent le même bleu ; les saisies et la navigation clavier sont conservées.

Les changements couvrent également la conservation des champs et médias natifs, les exports documentaires et les corrections de lecteurs H5P. Les détails par activité et preuves sont dans `docs/SUIVI_H5P_PARCOURS.md`. L’intégration Sucrerie est suivie séparément : cette MR Caramel ne déploie pas son frontend ou ses workflows.

### Validation

- Atelier de parcours : 172 contrôles réussis, rejoués le 14 septembre.
- Circuit IA externe : résultat de la dernière exécution consigné dans `tests/sonde-parcours/mr-2026-09-14/resultats.json`.
- Audit H5P : 27/27 activités traitées côté code/recette locale ; deux correctifs natifs restent à qualifier dans les bibliothèques Éléa (Mots mêlés et Classer les paragraphes).
- Recettes Éléa documentées, dont parcours mixte restauré, joué, modifié et réexporté ; elles ne constituent pas une certification de tous les types sur toutes les plateformes.

### Recette proposée au collègue

- [ ] Démarrer la branche localement : `python3 -m http.server 8000 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:8000`.
- [ ] Passer Rapide/Avancé et Activité/Parcours, vérifier la conservation des champs et le rendu sur téléphone.
- [ ] Partir d’un modèle de parcours, modifier étapes/consignes, enregistrer le scénario puis le rouvrir.
- [ ] Essayer le circuit IA externe : copier le prompt, vérifier une réponse, l’appliquer puis annuler une autre proposition.
- [ ] Rééditer une activité, sauvegarder/rouvrir et contrôler ses exports.
- [ ] Essayer l’export Moodle dans un cours de test, puis modifier/enregistrer/réexporter le contenu H5P si nécessaire.

La version locale conserve les endpoints configurés dans le dépôt : localhost n’isole pas les services distants. Éviter les dépôts publics de test ; le circuit IA externe et les modèles permettent une première recette sans génération distante.

### Livraison

MR prévue de `emmanuel` vers `main`, à ouvrir par le mainteneur. L’ouverture de la MR ne déploie pas la branche ; sa fusion dans la branche par défaut déclenche le job Pages. Tester `emmanuel` avant fusion. Aucun workflow ni SQL n’est déployé par cette MR ; ingestion RAG laissée inchangée et coupée côté service.

Pour poursuivre le chantier Sucrerie : `docs/REPRISE_CLAUDE_PARCOURS_2026-09-14.md`.
