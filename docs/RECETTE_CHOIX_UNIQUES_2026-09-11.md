# Recette Série de choix uniques — 11 septembre 2026

Référence Éléa : retour utilisateur **09-SingleChoiceSet.h5p**, bibliothèque **1.11.88**, question RELU réenregistrée puis réexportée. Compléments testés en lecteur natif local, sans nouvelle génération distante.

- Identifiants subContentId conservés au traitement, à la sauvegarde/réouverture et au réexport ; libellés personnalisés conservés. Anciens jetons @slide/@total/@question réparés vers :num/:total.
- Bornes natives de deux à quatre réponses appliquées dans le processeur et le validateur des listes de textes, en autonome et dans les exercices embarqués. Délais par défaut alignés sur Éléa : 2000/3000 ms. Sept options de comportement conservées.
- Documents : bonne réponse déplacée de façon déterministe, lettres du corrigé identiques à celles de l’énoncé. Corrige la divulgation systématique de la bonne réponse en A, aussi dans les présentations et livres.
- 24 assemblages rapide/avancé dans les 12 langues ; aucun appel IA.
- Sauvegarde/réouverture Caramel ; modification visible de la question et du délai, sauvegarde via callback local, réouverture et annulation Sucrerie. Aucune persistance serveur annoncée.
- Jeu natif au clavier : passage manuel, erreur puis réussite **1/2**, résultat et reprise ; passage automatique avec les deux bonnes réponses **2/2**, reprise désactivée absente. Le banc attend la fin des transitions et cible chaque diapositive explicitement.
- **12 documents DOCX/ODT/PDF relus visuellement** ; **202 assertions navigateur sans échec**, 22 contrôles de conservation et 64 adaptateurs Sucrerie. Miroir de 51 fichiers et 1101 clés dans 12 langues conforme.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/choix-uniques/`.

```sh
node tests/run_h5p_capabilities_documents.mjs --single-choice-only
# Sucrerie :
node tests/editor/run-choix-uniques-ui.mjs
# Caramel :
node tests/run_native_single_choice_play.mjs
```

Branches emmanuel, commits locaux consignés dans les suivis. Aucun push, aucun déploiement ; ingestion RAG coupée.
