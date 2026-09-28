# Collection parcours — premier lot : plan et lecteurs communs

13 septembre 2026, branche `emmanuel`, travail local non publié.

Commits du lot : Sucrerie `96dcde9` ; report Caramel `c4cf5dce`.

## Réalisé

- `core/collection-plan.js` fournit deux adaptateurs de lecture : manifestes de collection v1/v2 + publications résolues, et résultat du lecteur d'archive MBZ.
- Le plan sérialisable porte titre, introduction, étapes, consignes, conclusion et références stables. Une référence de publication reste distincte d'une activité interne d'archive. Identité/révision sont reprises quand l'hôte les fournit ; une révision absente reste `null`, jamais inventée.
- Les textes inexistants des collections v1/v2 restent vides. Aucun manifeste v3 n'est produit et aucune migration n'est appliquée dans ce lot.
- `ui/collection-plan-view.js` rend les étapes et textes des deux lecteurs. Les cartes familières des collections et les commandes de lecture/édition du cours sont conservées.
- Une étiquette Moodle `label` apparaît comme une consigne à sa place entre les activités. Elle reste éditable dans l'éditeur du cours et conserve sa référence native.
- Les publications non résolues ne sont pas récupérées ni devinées. Une indication générique signale les références manquantes ; aucun titre ni identifiant retiré n'est affiché. Les droits restent ceux des données résolues par l'hôte.
- Le MBZ et ses restrictions ne sont pas reconstruits à partir du plan. Fichiers, banques, sections et conditions restent dans l'archive complète. Le plan indique explicitement que la progression relève de l'archive.

## Vérifications

- `node tests/collection-plan/run-ui.mjs` : 63 contrôles réussis dans cinq suites (plan commun, aperçu collection, publication, téléchargement, archive). Captures ordinateur/téléphone et résultats dans `tests/collection-plan/preuves/`.
- La sonde MBZ réelle à quatre activités est lue, réexportée puis réouverte. Les empreintes SHA-256 de chaque fichier sont conservées (hors index d'archive technique régénérable), ainsi que le plan et l'ordre.
- `node tests/course-archive/run-ui.mjs` : annulation, modification de consignes, sauvegarde simulée, réouverture avec quatre activités ; Test modifié avec douze questions et titre conservés. Aucune erreur JavaScript. Cette recette utilise une API simulée, pas le service distant.
- Suite complète : 3 108 tests, 146 suites, aucun échec. Le dernier raccordement des identités/révisions a ensuite été vérifié par les 63 contrôles ciblés.
- Pas d'appel IA, pas de demande de validation par courriel, pas de dépôt distant, pas d'ingestion RAG.

## Suite encore ouverte

1. Persister les consignes/introduction/conclusion et étapes des collections ordinaires : brouillon privé, manifeste v3 et validation serveur, avec compatibilité v1/v2.
2. Ajouter les commandes contextuelles d'édition du plan et garantir les retours de focus/défilement au bon endroit dans chaque hôte.
3. Raccorder les exports des collections enrichies, puis l'assistance IA avec relecture et annulation.
4. Recette réelle Caramel → Sucrerie → réédition → téléchargement → restauration Éléa, puis qualification des autres plateformes.

Le nom de branche du frontal ne garantit pas l'isolation du service : la configuration locale Sucrerie pointe actuellement vers le service n8n commun. L'URL et le périmètre de la recette de développement doivent être confirmés avant toute écriture distante.
