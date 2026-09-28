# Recette n8n des brouillons de parcours — 14 septembre 2026

## État actuel

- [x] Fichier de recette extrait de la branche BAS préparée depuis l'export actuel `n8n-workflows/G. Sucrerie Dossiers (PROD).json`.
- [x] Quatre nœuds seulement, une route BAS, aucune route de G reprise, aucune connexion PostgreSQL présélectionnée. Workflow inactif et enregistrement des exécutions désactivé.
- [x] Expression de la requête PostgreSQL explicitement marquée comme expression dans le fichier importable.
- [x] Import signalé par l’utilisateur. Premier appel sans session : HTTP 404 (route non enregistrée), cohérent avec un workflow inactif.
- [x] Table `sucrerie_bas.collection_draft` créée avec accord séparé le 14 septembre ; COMMIT et contrôle indépendant en lecture seule réussis (quatre colonnes, quatre contraintes, zéro ligne).
- [ ] Préparation d’une session et d’un dossier de test.
- [ ] Connexion PostgreSQL de test sélectionnée, permissions vérifiées, activation de cette seule route de recette.
- [x] Sauvegarde réelle depuis l’éditeur, navigation/réouverture et conflit de révision entre deux onglets via n8n (14 septembre).

La préparation initiale ne modifiait ni G ni la base. Mise à jour : la seule table BAS autorisée a maintenant été créée ; ne pas rejouer son script de création. Le SQL livré est une préparation, pas une instruction d'exécution immédiate. Les 11 contrôles PostgreSQL du 13 septembre ont été annulés par ROLLBACK : ils n'ont pas installé la table durablement.

## Fichiers du lot

Répertoire local ignoré par Git : `n8n-workflows/recette-brouillons-2026-09-14/`.

- `RECETTE-BAS-brouillon.json` : nouveau workflow de recette, importable **inactif**.
- `PREPARATION-table-bas-ne-pas-executer.sql` : création additive de la seule table `sucrerie_bas.collection_draft`, à revoir avant application distincte.
- `provenance.json` : empreinte de l'export G utilisé et limites de la vérification.
- `LIRE-AVANT.md` : copie du présent mode d'emploi.

Les anciennes copies complètes de G et les candidats issus des anciennes sauvegardes restent abandonnés pour l'import. Ce nouveau fichier sert exclusivement à la recette : il extrait la branche travaillée sur G, il ne remplace pas G et ne décide pas de son intégration finale.

## Action utilisateur possible maintenant

1. Créer un nouveau workflow vide dans n8n, puis y importer **uniquement** `RECETTE-BAS-brouillon.json`.
2. Vérifier son nom « RECETTE BAS — Brouillon parcours — issu de G », ses quatre nœuds et son état inactif. Ne pas importer dans G existant.
3. Le laisser inactif, sans lancer d'exécution, et signaler que l'import est fait. Le nœud PostgreSQL sans connexion est volontaire.

Aucun token n'est à inscrire dans les nœuds ou à épingler dans les données. Le choix d'une connexion vers le même serveur ne garantit pas à lui seul une restriction au schéma de test : cette restriction doit être contrôlée avant activation. Les requêtes générées qualifient explicitement `sucrerie_bas`.

## Recette restant à effectuer ensemble

Après préparation autorisée de la table, du dossier et d'une session BAS, renseigner la connexion appropriée, puis activer uniquement ce workflow de recette. La page localhost utilisera une session BAS explicitement fournie, sans reprendre la connexion de production de l'aperçu.

Vérifier successivement : lecture vide (révision 0), enregistrement (révision 1), fermeture/réouverture avec texte conservé, modification (révision 2), refus d'une ancienne révision sans perte de saisie. Vérifier aussi le refus d'une session expirée ou d'un autre propriétaire. Ne publier aucune activité. Les échanges CORS réels, le module crypto et l'expression PostgreSQL seront vérifiés dans n8n ; les tests locaux ne prouvent pas leur fonctionnement sur l'instance.

À la fin, désactiver le workflow de recette. Le nettoyage des fixtures BAS sera ciblé sur leurs identifiants ; aucune suppression globale ni suppression automatique d'une table préexistante.

## Vérifications reproductibles

```sh
node tests/collection-draft-server/run-isolated.mjs
node tests/collection-draft-server/run-existing.mjs
node tests/collection-draft-server/run-contract.mjs
node scripts/collection-draft/prepare-isolated-test.mjs
```

Le générateur exige un répertoire de sortie neuf. Il ne contacte aucun serveur. Les tests isolés exécutent le JavaScript incorporé, avec des entrées fictives, et vérifient le confinement des requêtes au schéma BAS. Preuves : `tests/collection-draft-server/preuves/recette-isolee.json`, `source-existante.json`, `contrat.json`. Aucun appel distant ni SQL exécuté dans ce lot.

## Résultat réel du 14 septembre

Workflow activé par l’utilisateur. Huit contrôles HTTP réels réussis : lecture initiale, création révision 1, nouvelle lecture avec égalité intégrale du contenu, modification révision 2, refus de révision périmée, refus d’un autre propriétaire, contenu final intact et refus d’une session expirée. La première requête sans session est également refusée.

Les fixtures ont vécu uniquement dans `sucrerie_bas` : dossier à identifiant explicite sans consommation de séquence, deux sessions aléatoires de courte durée et brouillon fictif. Suppression ciblée du dossier (cascade du brouillon) et des deux sessions ; absence vérifiée après COMMIT. Aucun secret dans la preuve versionnée. Workflow laissé dans l’état activé par l’utilisateur.

**Limite :** appels HTTP directs, pas de navigation dans l’éditeur lors de cet essai. Le clic de sauvegarde/fermeture/réouverture dans le navigateur contre ce serveur reste à valider. Les anciens tests navigateur utilisaient un transport simulé.

## Recette navigateur réelle réussie

Le 14 septembre, Chromium piloté par Playwright, contexte vierge sans session utilisateur, a ouvert l’éditeur avec une session BAS fictive de courte durée. Le transport réel `openBasCollectionDraft` a appelé n8n sans réponse simulée. Cinq vérifications réussies : lecture initiale, clic Enregistrer, navigation/réouverture avec introduction et étape ajoutée conservées, absence de débordement mobile (390 px), conflit entre deux onglets avec conservation de la saisie. Aucun événement pageerror. Captures ordinateur/mobile et conflit dans `tests/collection-draft-server/preuves/navigateur-*.png`.

Les huit vérifications HTTP ont également été rejouées ; dossier, brouillon et sessions temporaires supprimés, absence vérifiée. Preuves : `navigateur-reel-2026-09-14.json` et `http-avec-navigateur-2026-09-14.json`. La limite navigateur du précédent essai est donc levée. Le raccordement dans l’interface habituelle, le partage et les exports du brouillon enrichi restent des travaux distincts.
