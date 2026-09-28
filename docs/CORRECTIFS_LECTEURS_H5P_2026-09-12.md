# Corrections des lecteurs Mots mêlés et Tri — 12 septembre 2026

Les deux anomalies sont corrigées dans les bibliothèques locales de **bas et Sucrerie**. Les versions de bibliothèque restent inchangées : correctifs locaux identifiés ci-dessous, pas une nouvelle version officielle H5P.

| Bibliothèque | Défaut | Correction | Preuve réelle |
|---|---|---|---|
| FindTheWords 1.4.4 | Le glissement plafonne l’origine verticale à ¾ de case ; la consigne sur deux lignes fait échouer le centre | Même origine canvas au début, au mouvement et à la fin du glissement | Deux grilles : 0/4, solution, reprise, quatre mots sélectionnés au **centre** → 4/4 |
| SortParagraphs 0.11 | Sélecteur négatif erroné et retrait d’un descendant par `content.removeChild` | Sélecteur `minus-one`, retrait par `element.remove()` depuis son vrai parent | Deux barèmes : erreur, solution, reprise **sans rechargement**, déplacement clavier, 4/4 et 3/3 ; aucune erreur native |

Les sondes utilisent les paquets réédités dans Sucrerie conservés dans les recettes précédentes ; leur contenu n’a pas été changé pour masquer les défauts. Scripts de jeu renforcés : suppression du pointage au quart supérieur et du rechargement de secours. Garde anti-écrasement ajouté à la suite `vendor-patches`.

## Portée Éléa

**Ces correctifs ne sont pas installés dans Éléa.** Les H5P exportés par Caramel/Sucrerie contiennent les données et médias, pas les bibliothèques. Réimporter/réenregistrer une activité ne remplace donc pas la bibliothèque du serveur. Le cours 794 et la session Chrome ont été relus le 12 septembre sans toucher à l’authentification.

Il reste une intervention de maintenance sur les bibliothèques Éléa, puis une contre-épreuve dans le cours 794. L’autorisation de travailler dans ce cours n’autorise pas une modification globale des bibliothèques de la plateforme. Aucun réglage d’administration ni version corrective artificielle n’a été utilisé pour forcer leur remplacement.

Le patch exact (diff sans contexte, à contrôler avec `git apply --check --unidiff-zero` sur les versions sources), les quatre sondes, captures et résultats sont conservés dans bas :
`tests/sonde-parcours/audit-activites-2026-09-11/corrections-natives/`.

À réappliquer ou réévaluer lors d’une mise à jour vendor. Fichiers :
- `H5P.FindTheWords-1.4/scripts/h5p-find-the-words-word-grid.js`
- `H5P.SortParagraphs-0.11/dist/h5p-sort-paragraphs.js`

```sh
node tests/run_native_mots_meles_play.mjs
node tests/run_native_tri_paragraphes_play.mjs
node tests/run_browser_suite.mjs --suite=vendor-patches
```

**27/27 activités traitées côté code et recette locale ; 25/27 sans réserve de lecteur, 2 réserves Éléa conservées.** Ce bilan ne vaut ni déploiement ni nouvelle validation intégrale de tous les réglages en plateforme. Production préservée ; RAG coupé.
