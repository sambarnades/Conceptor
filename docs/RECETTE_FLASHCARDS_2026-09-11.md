# Recette Cartes mémoire — 11 septembre 2026

Référence Éléa : **10-Flashcards.h5p**, H5P.Flashcards **1.7.10**, indice RELU ; image native décodée 120×80 et crédits conservés. Jeu complémentaire local avec la bibliothèque vendor **1.7.23**. Aucune nouvelle génération distante ni nouveau dépôt.

- Libellés personnalisés, langue et métadonnées conservés. Indice simple ou groupe natif accepté dans l’éditeur, le processeur et les documents.
- Titre et texte/réponse facultatifs conformément aux semantics ; une carte au minimum. Réglages de saisie obligatoire, casse et mélange conservés.
- Correction éprouvée : un objet image vide sur la carte sans image bloquait le lecteur sur Loading. Les images vides sont supprimées à la dénormalisation et au traitement ; Sucrerie ne les réintroduit pas.
- 24 assemblages de prompts rapide/avancé dans 12 langues, sans appel IA ; réglages de casse et de mélange explicités.
- Sauvegarde/réouverture Caramel ; description modifiée dans les contrôles visibles Sucrerie, sauvegarde via callback local, réouverture et annulation. Pas de persistance serveur revendiquée.
- Jeu : indice RELU ouvert ; saisie vide refusée en mode strict, minuscules rejetées avec casse sensible (**0/2**). Mode libre : solution disponible sans saisie, deuxième capitale en minuscules acceptée (**1/2**), ordre aléatoire géré par le scénario.
- **12 documents DOCX/ODT/PDF relus** : recto/verso en miroir, image et indices lisibles, crédits en annexe selon la convention d’impression existante.
- **202 assertions navigateur sans échec**, 22 contrôles de conservation et 64 adaptateurs Sucrerie. Miroir 51 fichiers, 1101 clés dans 12 langues conforme.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/flashcards/`.

```sh
node tests/run_h5p_capabilities_documents.mjs --flash-only
# Sucrerie :
node tests/editor/run-flashcards-ui.mjs
# Caramel :
node tests/run_native_flashcards_play.mjs
```

Branches emmanuel, commits locaux dans les suivis. Aucun push ni déploiement ; ingestion RAG coupée.
