# Recette Glisser les mots — 11 septembre 2026

Référence de plateforme : retour utilisateur **03-DragTheWords.h5p**, H5P.DragText **1.10.50**, consigne retouchée avec RELU. Le réexport natif est conservé dans `lot-utilisateur-26/retours-elea/DragTheWords`. Les compléments ci-dessous ont été vérifiés dans le lecteur natif local ; aucun nouveau dépôt Éléa ni appel IA n’est revendiqué.

## Capacités réalisées

- Texte à trous lisible dans l’éditeur, avec fiches par mot pour l’indice et les retours correct/incorrect. Les codes natifs restent dans la sauvegarde, pas dans le texte affiché. Une modification du paragraphe conserve les fiches associées aux mots.
- Distracteurs, consigne, feedback global, correction immédiate, vérification, solution et nouvelle tentative conservés. Les libellés natifs personnalisés ne sont plus écrasés.
- Média de consigne image, audio ou vidéo : ajout, remplacement, sauvegarde et réouverture. Changer le type retire les paramètres de l’ancien média ; choisir aucun média le retire aussi après fusion avec le paquet Sucrerie original. Les fichiers sont présents dans les ZIP.
- Prompts des 12 langues : grammaire native des indices/retours et média seulement si fourni. **24 assemblages rapide/avancé**, aucun appel de génération. Correction du remplacement des paramètres après un deux-points chinois/japonais.
- Sauvegarde/réouverture Caramel ; modification par contrôles visibles, sauvegarde via callback local, réouverture et annulation Sucrerie. Pas de persistance serveur annoncée.
- Jeu natif local : indice affiché, distracteur erroné, nouvelle tentative puis **2/2** ; correction immédiate sans bouton Vérifier ; commandes de reprise/solution absentes lorsqu’elles sont désactivées. Audio et vidéo effectivement lus (durées 1,965 s et 1,363 s).
- **18 documents DOCX/ODT/PDF relus visuellement**, avec indices sur l’énoncé et retours sur le corrigé. Les médias audio/vidéo locaux sont signalés comme consultables dans l’activité numérique, sans nom technique de fichier. Le formatage des indices/retours est aussi vérifié dans QuizSet, présentation et livre.

## Vérifications et preuves

- Suite documentaire et éditeur : **202 assertions, 0 échec**.
- Conservation native Sucrerie : **22 contrôles réussis**.
- Miroir : **51 fichiers identiques**, **1091 clés présentes dans 12 langues**.
- Preuves Caramel : `tests/sonde-parcours/audit-activites-2026-09-11/glisser-mots/` (paquets, 18 documents, captures éditeurs/jeu/relecture, résultats JSON et SHA-256).

```sh
node tests/run_h5p_capabilities_documents.mjs --drag-words-only
# Depuis Sucrerie :
node tests/editor/run-glisser-mots-ui.mjs
# Depuis Caramel :
node tests/run_native_drag_words_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
```

Branches `emmanuel`, commits locaux consignés dans les suivis. Aucun push, déploiement ou changement de production ; ingestion RAG coupée.
