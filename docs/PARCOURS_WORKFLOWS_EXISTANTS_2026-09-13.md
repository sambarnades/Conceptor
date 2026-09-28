# Reprise depuis les workflows actuels — 13 septembre 2026

## Source de référence corrigée

L’utilisateur désigne `Sucrerie/n8n-workflows/` (ignoré par Git) comme contenant les exports actuellement en production. Ce dossier devient la seule source de préparation. Aucun workflow actif n’a été consulté ou modifié à distance pendant ce lot.

Comparaison locale avec les anciennes sauvegardes de production : paramètres et connexions identiques pour **G. Sucrerie Dossiers** ; paramètres différents dans **D. Compte**, **F. Auteur**, **B. Lecture** et **C. Dépôt**. Il ne faut donc pas extrapoler la validité de toutes les sauvegardes à partir du seul workflow G. Le précédent candidat BAS reposait sur une autre sauvegarde ; il est abandonné.

## Préparation reconstruite

Le raccordement est désormais préparé comme **une branche supplémentaire dans G**, et non comme une obligation d’ajouter un workflow autonome. La branche de test conserve le contrat déjà essayé sur `sucrerie_bas` : lire et enregistrer des brouillons privés avec comparaison de révision ; aucune publication.

- [x] Lecture du fichier actuel `n8n-workflows/G. Sucrerie Dossiers (PROD).json`.
- [x] 69 nœuds d’origine strictement identiques dans la copie préparée ; toutes les connexions d’origine identiques.
- [x] Quatre nouveaux nœuds, une route BAS distincte, aucun raccordement ajouté aux chemins existants.
- [x] Refus d’une collision de nom, d’identifiant de nœud ou de route ; contrôle d’empreinte de la source avant/après génération.
- [x] Sortie de travail inactive, sans identifiant de workflow à remplacer ; delta des quatre nœuds fourni séparément.
- [x] Ancienne génération CLI de workflow autonome désactivée, documentation de reprise corrigée.
- [ ] Revue de la branche et recette n8n réelle avant toute intégration dans un workflow actif. Les autorisations de modification de la base de test ne valent pas activation ou remplacement de G en production.

Préparation privée : `n8n-workflows/preparation-brouillons-existants-v2/` dans Sucrerie. Les fichiers y sont expressément marqués comme non prêts à importer. Ne pas importer les anciens candidats du dossier voisin.

## Preuves

`node tests/collection-draft-server/run-existing.mjs` réussit sur le vrai fichier G actuel : conservation des 69 nœuds, des connexions, de la référence PostgreSQL, refus d’un doublon et source inchangée. Résultat versionné dans `tests/collection-draft-server/preuves/source-existante.json`.

`node tests/collection-draft-server/run-contract.mjs` : 12 contrôles réussis. Aucune modification du contrat SQL ni nouvelle requête en base pour ce lot ; la recette PostgreSQL précédente reste une preuve du contrat, pas une preuve d’exécution de ce nouveau branchement dans n8n.

Aucun fichier source des workflows actuels modifié, aucune réimportation, activation, migration ou publication. Production et RAG inchangés.
