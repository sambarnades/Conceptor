# Recette Vrai/Faux — 11 septembre 2026

Référence Éléa : retour utilisateur **07-TrueFalse.h5p**, H5P.TrueFalse **1.8.21**, retour correct retouché avec RELU. Compléments joués en lecteur natif local, sans nouveau dépôt ni génération distante.

- Média natif image/audio/vidéo éditable et préservé en autonome et dans les conteneurs. Image native présente dans les paquets/documents et suppression après sauvegarde vérifiée.
- Dialogues de vérification/reprise entièrement éditables. Libellés l10n et dialogues personnalisés conservés ; processeur autonome/QuizSet commun ; retours stockés dans behaviour conformément au natif, sans doublons à la racine.
- Bonne réponse vraie ou fausse, vérification manuelle/automatique, boutons de solution/reprise et confirmation conservés. Réponse invalide refusée par le processeur.
- Les explications correct/incorrect figurent désormais au corrigé documentaire, également en QuizSet, présentation et livre ; elles ne sont pas divulguées côté élève.
- **24 prompts rapide/avancé dans les 12 langues** vérifiés, sans appel IA. Options natives, dialogues et médias fournis explicités.
- Caramel : retour/dialogue modifiés, sauvegardés, rouverts et empaquetés. Sucrerie : question/dialogue modifiés dans les contrôles visibles ; sauvegarde via callback local, réouverture, annulation et suppression du média. Pas de persistance serveur annoncée.
- Jeu manuel : confirmation annulée, réponse erronée et retour spécifique, solution, confirmation de reprise puis **1/1** avec Vrai. Jeu automatique : **1/1** avec Faux ; explication attendue, boutons Vérifier/solution/reprise absents.
- **12 documents DOCX/ODT/PDF relus visuellement**, réponses et explications cohérentes dans les deux variantes.
- **202 assertions navigateur, 0 échec** ; **22 contrôles de conservation Sucrerie**, **64 contrôles d’adaptateurs**. Miroir 51 fichiers, 1101 clés dans 12 langues.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/vrai-faux/`, paquets, documents, captures, JSON et SHA-256.

```sh
node tests/run_h5p_capabilities_documents.mjs --true-false-only
# Sucrerie :
node tests/editor/run-vrai-faux-ui.mjs
# Caramel :
node tests/run_native_true_false_play.mjs
```

Branches `emmanuel`, commits locaux dans les suivis. Aucun push ni déploiement ; RAG coupé.
