# Alignement de la structure de test — 13 septembre 2026

## Vérification effectuée

Comparaison réelle des catalogues PostgreSQL de `sucrerie` et `sucrerie_bas`, dans la même base. Connexions forcées avec `default_transaction_read_only=on`, transactions en lecture seule et délais bornés. Aucune ligne métier lue, copiée ou modifiée ; aucune migration exécutée. Aucun accès de connexion enregistré dans les fichiers du chantier.

Les deux schémas ont les mêmes 26 tables, 3 vues et 13 séquences. Différences utiles dans le schéma de test :

- deux colonnes absentes : `folder.published_public_id` et `access_request.approved_email_sent_at` ;
- la clé étrangère de la première colonne et un index de notification absents ;
- cinq fonctions et cinq déclencheurs absents ;
- défaut de licence ancien (`CC-BY-NC-SA-4.0` au lieu de `CC-BY-SA-4.0`). Changer le défaut ne réécrit pas les licences existantes.

Les cinq différences de syntaxe des contraintes CHECK portent sur les conversions de tableaux, avec les mêmes valeurs acceptées. Les vues sont équivalentes après normalisation des schémas et des alias sans effet. Elles ne contiennent pas de référence à la production. Les clés étrangères et les 13 dépendances de séquences contrôlées restent dans les schémas de test.

La référence `publication.content_id` vers `partage_bas.content` est volontaire : ne pas la remplacer par `partage.content`.

## Répétition puis application permanente autorisées et terminées

Dans Sucrerie : `scripts/collection-draft/schema-test/align-sucrerie-bas.rehearsal.sql`.

- [x] Ajouts strictement qualifiés dans `sucrerie_bas` ; aucun DROP, aucune copie des données.
- [x] Fonctions de dossiers redirigées vers `sucrerie_bas.folder`.
- [x] Le déclencheur de datation dépend en production de `partage.set_updated_at`. Son équivalent manque dans `partage_bas` : préparer une copie locale `sucrerie_bas.set_updated_at`, sans modifier `partage` ou `partage_bas`. Cela fait six créations de fonctions, dont cinq pour combler le schéma et une pour son autonomie.
- [x] Échec prévu si un objet à ajouter existe entre-temps ; aucun remplacement silencieux de fonction existante.
- [x] Transaction avec attente de verrou limitée à 2 secondes et requêtes limitées à 30 secondes.
- [x] Le script termine par **ROLLBACK** : il est destiné d’abord à une répétition transactionnelle, pas à une application permanente.
- [x] Sauvegarde de structure de `sucrerie_bas` réalisée avant l’essai autorisé (sans données, propriétaire ni permissions).
- [x] Autorisation utilisateur reçue et répétition transactionnelle sur `sucrerie_bas` exécutée sans erreur ; objets et dépendances contrôlés dans la transaction, puis ROLLBACK confirmé.
- [x] Nouvelle sauvegarde après ROLLBACK : structure identique à celle d’avant après exclusion des marqueurs aléatoires restrict/unrestrict de pg_dump. Aucune autre différence.
- [x] Accord séparé reçu ; application permanente du même lot sur `sucrerie_bas`, COMMIT confirmé et nouvelle lecture des catalogues réussie.

La nouvelle table des brouillons de parcours ne fait PAS partie de cet alignement. Sa recette vient ensuite, une fois le schéma de test remis à niveau. Aucun workflow n8n réimporté, aucune action sur la production ou le RAG.

## Preuve de l’essai du 13 septembre

`Sucrerie/scripts/collection-draft/schema-test/preuves/repetition-2026-09-13.json` consigne les résultats et l’empreinte normalisée. Le script de répétition inclut désormais les assertions exécutées (colonnes, fonctions, déclencheurs, index, calcul de racine et clés étrangères restant dans les schémas de test).

Sauvegardes avant/après et journal conservés localement dans `Sucrerie/n8n-workflows/backups/schema-test-2026-09-13/`, répertoire ignoré par Git. Aucun identifiant de connexion dans ces fichiers. À la fin de la répétition, le schéma avait retrouvé sa structure initiale. L’application permanente distincte est consignée ci-dessous.

## Application permanente autorisée — terminée

L’utilisateur a ensuite autorisé explicitement le même rattrapage permanent, limité à `sucrerie_bas`, sans données ni table de brouillons.

- Sauvegarde préalable supplémentaire : structure identique à celle de la répétition.
- Même script et mêmes assertions ; seul le ROLLBACK final (et son message) remplacé par COMMIT. Transaction validée sans erreur.
- Nouvelle connexion en lecture seule : exactement 15 objets ajoutés (2 colonnes, 1 contrainte, 1 index, 6 fonctions, 5 déclencheurs), aucun objet supprimé et seul le défaut de licence modifié parmi les objets existants.
- Métadonnées du schéma de production `sucrerie` identiques à la comparaison préalable.
- Aucune table `collection_draft` créée, aucune donnée métier copiée, aucun workflow n8n réimporté.

Preuve : `scripts/collection-draft/schema-test/preuves/application-2026-09-13.json` dans Sucrerie. SQL exact, journal COMMIT et sauvegarde pré-application conservés hors Git avec les sauvegardes précédentes. Le futur chantier de persistance des brouillons reste distinct.
