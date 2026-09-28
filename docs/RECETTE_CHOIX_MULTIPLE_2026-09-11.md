# Recette Choix multiple — 11 septembre 2026

Référence Éléa : retour utilisateur **08-MultipleChoice.h5p**, H5P.MultiChoice **1.16.27**, indice RELU réenregistré et réexporté. Les compléments suivants sont joués en lecteur natif local, sans nouveau dépôt ni génération distante.

- Média natif image/audio/vidéo, dialogues de vérification/reprise, libellés UI et identifiants préservés. Image ajoutée puis supprimée après sauvegarde dans Sucrerie.
- Réponses uniques/multiples, vérification automatique/manuelle, confirmations, boutons, seuil et point unique conservés. Borne native : une proposition minimum ; booléen texte « false » normalisé correctement. Processeur commun autonome/QuizSet.
- Indices après chaque proposition dans les documents ; retours sélectionné/non sélectionné dans le corrigé uniquement, également dans les questionnaires, présentations et livres.
- 24 assemblages de prompts dans 12 langues, sans appel IA.
- Sauvegarde/réouverture Caramel ; modification visible, sauvegarde par callback local, réouverture et annulation Sucrerie. Aucune persistance serveur revendiquée.
- Jeu multiple : confirmation annulée, réponse partielle **1/2**, solution/reprise puis **2/2**. Jeu unique automatique : **1/1**, boutons désactivés absents. Variante locale dérivée avec point unique et seuil 100 % : **0/1** partiel puis **1/1** complet.
- **12 documents DOCX/ODT/PDF relus visuellement** dans les deux hôtes.
- **202 assertions navigateur sans échec**, 22 contrôles de conservation Sucrerie, 64 d’adaptateurs ; miroir 51 fichiers et 1101 clés dans 12 langues.
- Garde-fou ciblé des retours : 13 fixtures, 48 retours conservés et deux contre-épreuves réussies. Le passage global préalable a rencontré un échec de synthèse vocale Dictation sans réseau ; il n’est pas annoncé conforme. Le banc accepte désormais une sélection explicite des modules pour les recettes locales.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/choix-multiple/` (paquets, documents, captures, résultats et SHA-256).

```sh
node tests/run_h5p_capabilities_documents.mjs --multi-choice-only
# Sucrerie :
node tests/editor/run-choix-multiple-ui.mjs
# Caramel :
node tests/run_native_multi_choice_play.mjs
node tests/run_feedback_semantics.mjs --modules=MultipleChoice,QuizSet,QuizSetQCM
```

Branches emmanuel, commits locaux dans les suivis. Aucun push ni déploiement ; ingestion RAG coupée.
