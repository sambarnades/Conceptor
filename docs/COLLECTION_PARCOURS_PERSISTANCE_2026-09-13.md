# Persistance privée des brouillons — préparation du 13 septembre 2026

> **Décision de reprise : repartir des exports actuels `Sucrerie/n8n-workflows`. Les anciens candidats autonomes ci-dessous sont abandonnés : ne pas les importer. La préparation courante est une branche additive de G.** [Source, preuves et état actuel](PARCOURS_WORKFLOWS_EXISTANTS_2026-09-13.md).


## État réel

**Contrat testé en JavaScript et sur PostgreSQL de test ; éditeur raccordé à un transport injectable. Workflow non installé, non activé ; table et données de recette annulées par ROLLBACK.**
Ce lot ne rend pas encore les brouillons disponibles sur plusieurs appareils.
La démonstration et la bibliothèque localhost continuent leur sauvegarde locale.

## Réalisé

- [x] Contrat de lecture/enregistrement d’un brouillon privé, limité à une collection et à son propriétaire authentifié.
- [x] Enregistrement avec révision attendue : création uniquement en version zéro ; mise à jour uniquement si la version correspond. Un conflit ne déclenche aucune relance automatique.
- [x] Adaptateur de stockage distant avec transport injecté : aucune requête à sa construction, lecture obligatoire avant écriture, réponses et contenu contrôlés.
- [x] Générateur d’un **nouveau** workflow n8n inactif, sans identifiant de workflow existant. L’export source est seulement lu, jamais modifié.
- [x] Nouvelle route dédiée et nouvelle table de brouillons ; aucune modification des routes de partage, de publication, des manifestes publics ou des activités.
- [x] Migration additive préparée, pas exécutée. Aucune migration lancée automatiquement par le workflow.
- [x] Les exports générés contenant des références de connexion restent hors du dépôt public. Aucun jeton, adresse personnelle ou donnée réelle dans les tests.

## Vérifications

- `node tests/collection-draft-server/run-contract.mjs` : **10 contrôles réussis**, dont exécution du code JavaScript réellement incorporé dans le nœud n8n, erreurs et comparaison de version. Il génère du SQL mais ne l’exécute pas.
- `node tests/collection-plan/run-ui.mjs` : **73 contrôles ciblés réussis**, dont quatre de persistance simulée : création, sauvegarde/réouverture et conflit entre deux éditeurs.
- Empreinte SHA-256 du workflow source local inchangée après génération.
- Preuves : `tests/collection-draft-server/preuves/contrat.json` et `tests/collection-plan/preuves/resultats.json`.

## À faire avant toute réimportation

- [x] Exécuter la migration et les requêtes dans `sucrerie_bas` avec fixtures transactionnelles : création, mise à jour, refus d’une version périmée, collection absente, session expirée et compte différent. Onze assertions strictes réussies ; ROLLBACK et absence finale de la table et des fixtures confirmés.
- [ ] Exercer deux transactions PostgreSQL réellement simultanées après installation isolée du endpoint de test ; les scénarios SQL actuels vérifient séquentiellement les révisions attendues.
- [ ] Vérifier les permissions du rôle PostgreSQL et la compatibilité avec un export récent du workflow de dossiers ; le candidat repose sur une sauvegarde locale, pas sur une inspection du workflow actif.
- [x] Brancher explicitement un repository injectable dans l’éditeur : lecture à l’ouverture, sauvegarde attendue, messages distincts, conservation de la saisie après conflit, chargement en échec empêchant l’écriture. Recette du vrai éditeur avec transport simulé ; aucune lecture ni transmission automatique du brouillon local.
- [x] Raccorder un transport HTTP authentifié dédié à BAS, sans importer la session de production : route fixe, localhost, session explicite, aucun cookie/redirection/repli, protocole et schéma de test exigés dans la réponse. Trajet éditeur → repository → fetch validé avec interception réseau.
- [ ] Installer le nouveau workflow BAS puis qualifier le trajet réel navigateur → n8n → PostgreSQL avec une session et une collection de test. Aucun appel au workflow actif effectué pour cette recette.
- [ ] Valider le lot concret avant installation de la table et activation de la nouvelle route. L’ancienne application doit rester inchangée pendant cette phase.
- [ ] Développer ensuite le manifeste enrichi destiné au partage, les exports et le pont Caramel. Un brouillon serveur ne devient jamais une publication automatiquement.

**Ne pas réimporter le candidat à ce stade.** Aucun workflow actif ni donnée de production n’a été modifié. Aucun push. RAG laissé coupé.

Commit de réalisation Sucrerie : `85a2111` (branche `emmanuel`, non poussé).

## Recette PostgreSQL et éditeur — 13 septembre

Le générateur `tests/collection-draft-server/generate-pg-rehearsal.mjs` utilise les vraies requêtes du contrat et ne cible que `sucrerie_bas`. Les dossiers utilisent un identifiant explicite réservé à la fixture : les séquences ne sont pas avancées. Aucune donnée réelle n’est lue pour préparer le brouillon. Table, dossier et sessions fictives sont créés dans une transaction puis annulés.

Preuve PostgreSQL : `tests/collection-draft-server/preuves/postgresql-2026-09-13.json` — 11 contrôles et nettoyage confirmés. SQL exact et journal conservés hors Git avec les sauvegardes de test.

Recette `node tests/collection-draft/run-ui.mjs` étendue : sauvegarde locale et réouverture toujours opérationnelles ; sauvegarde distante simulée puis réouverture, conflit conservant les champs saisis, lecture distante en échec bloquant Enregistrer, stockage local non consulté dans ce mode. Champs gelés pendant l’enregistrement et instantané exact conservé. Capture `tests/collection-draft/preuves/conflit-distant-390.png`.

Régressions : 73 tests ciblés et 10 contrôles du contrat n8n réussis. Aucun appel HTTP distant dans les recettes navigateur. Aucun nouveau workflow activé ni table de brouillons laissée en base. La démo utilisateur reste en sauvegarde locale.

## Transport HTTP BAS et candidat d’import — 13 septembre

L’entrée `ui/collection-draft-test.js` assemble l’éditeur, le repository versionné et le transport `services/collection-draft-test.js`. Elle n’est pas activée dans la bibliothèque habituelle. Elle exige une session BAS fournie explicitement ; ni le compte connecté à l’aperçu ni ses brouillons locaux ne sont récupérés automatiquement. Le transport est libéré à la fermeture.

La nouvelle route est exclusivement `sucrerie-bas-collection-draft-v1`. Une réponse réussie doit porter `protocol: 1` et `schema: sucrerie_bas`, faute de quoi le chargement échoue et aucune sauvegarde n’est lancée. Le workflow généré émet ces informations depuis sa configuration figée, pas depuis le corps client.

Validation : **80 contrôles ciblés**, **12 contrôles du générateur/contrat**, recette de sauvegarde et réouverture dans le vrai éditeur avec POST interceptés et simulés. Les mêmes tests vérifient le refus d’un environnement autre que BAS, d’une route indisponible et d’actions non autorisées. Aucune requête réseau n’a atteint n8n pendant ces tests.

Candidat local : `n8n-workflows-backup/candidat-brouillons-bas-2026-09-13/collection-draft.inactive.json` depuis le dossier Caramel. Il s’agit d’un **nouveau workflow**, sans identifiant de workflow existant, inactif, et utilisant la connexion PostgreSQL de l’export BAS fourni. L’export de départ n’a pas été modifié. Le fichier reste hors des dépôts publics.

Pour la suite : importer le JSON comme nouveau workflow sans l’activer, vérifier sa connexion et sa route, puis préparer explicitement l’installation de la table uniquement dans `sucrerie_bas` et la recette réelle. Le fichier SQL voisin n’a pas été appliqué. Les workflows existants et la configuration générale du site sont inchangés. Le partage de manifestes enrichis, les exports et l’aide IA restent des lots ultérieurs.
