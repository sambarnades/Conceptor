# Recette Texte à trous — 11 septembre 2026

Référence Éléa : retour utilisateur **05-FillInTheBlanks.h5p**, H5P.Blanks **1.14.37**, consigne native `text` retouchée avec RELU. Compléments testés dans le lecteur natif local, sans nouveau dépôt Éléa ni génération distante.

## Corrections et capacités vérifiées

- Consigne native `text` chargée dans l’éditeur et correctement reconstruite depuis `taskDescription`. Correction du convertisseur Sucrerie qui perdait la retouche après la dénormalisation partagée.
- Questions, variantes et indices conservés. Les indices sont maintenant présents sur la feuille élève ; toutes les variantes acceptées figurent au corrigé, sans indice ajouté à la réponse.
- Média natif image/audio/vidéo exposé via le composant commun déjà éprouvé ; image native sauvegardée et supprimée dans cette recette. Dialogues de vérification et reprise entièrement éditables (titre, texte, libellés des deux boutons).
- Tous les comportements natifs exposés en autonome et dans les conteneurs : vérification automatique, casse, tolérance orthographique, lignes séparées, contrôle de saisie avant solution, nouvelle tentative après réussite, boutons et confirmations. Valeurs par défaut alignées sur les semantics.
- Le processeur préserve les libellés natifs personnalisés ; l’ancien format `textBlocks` reçoit désormais le traitement complet. La voie QuizSet réutilise le même traitement.
- Prompts des 12 langues, **24 assemblages rapide/avancé** vérifiés. Règle explicite : `/` est réservé aux variantes dans un trou, utiliser un caractère de fraction Unicode pour éviter que `2/5` signifie deux réponses acceptées.
- Caramel : dialogue modifié, sauvegarde/réouverture et empaquetage. Sucrerie : consigne et dialogue modifiés par contrôles visibles, sauvegarde via callback local, réouverture, annulation et suppression du média. Pas de persistance serveur annoncée.
- Jeu natif manuel : indice, annulation de la confirmation, une erreur et `Roma` acceptée (**1/2**), solution, confirmation de reprise puis **2/2**, reprise autorisée après réussite.
- Jeu natif automatique : bouton Vérifier absent ; `pariss` et `roma` acceptés avec tolérance/casse configurées, **2/2**.
- **12 documents DOCX/ODT/PDF relus visuellement**, indices/variantes et image présents. Même contrôle du formatage dans QuizSet, présentation et livre.

## Vérifications

**202 assertions navigateur, 0 échec** ; **22 contrôles de conservation Sucrerie** et **64 contrôles d’adaptateurs natifs**. Miroir : 51 fichiers, 1101 clés dans 12 langues. Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/texte-trous/`, SHA-256 inclus.

```sh
node tests/run_h5p_capabilities_documents.mjs --blanks-only
# Depuis Sucrerie :
node tests/editor/run-texte-trous-ui.mjs
# Depuis Caramel :
node tests/run_native_blanks_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
```

Branches `emmanuel`, commits locaux dans les suivis. Aucun push ni déploiement ; RAG coupé.
