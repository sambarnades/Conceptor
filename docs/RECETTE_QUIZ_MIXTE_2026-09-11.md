# Recette Quiz mixte — 11 septembre 2026

Référence : réexport utilisateur Éléa 17-QuizSet, introduction RELU et semantics QuestionSet 1.21. Les nouvelles variantes ont été jouées dans le lecteur natif local ; pas de nouveau dépôt Éléa.

- Introduction éditable (affichage, titre, texte, bouton, image et alternative), tirage de questions, navigation arrière, réglages communs, résultats, vidéos et libellés de navigation ajoutés dans les deux hôtes.
- Feedback global déplacé dans endGame ; stabilité du deuxième enregistrement corrigée et vérifiée. Libellés natifs par défaut présents même pour une nouvelle activité ; personnalisations conservées.
- Les suppressions explicites du tirage, du fond et des réglages communs ne sont plus annulées par la fusion Sucrerie.
- Trois variantes sauvegardées/réouvertes dans Caramel et Sucrerie, annulation Sucrerie par callback local. Prompts enrichis dans les trois familles de quiz ; 24 assemblages du quiz mixte vérifiés en 12 langues, sans génération IA.
- Jeu complet : erreur 2/3, reprise 3/3, solution. Tirage de deux questions : erreur 1/2, reprise 2/2, retour arrière interdit ; vidéo d’échec puis vidéo de réussite réellement lues. Image d’introduction chargée.
- Mode sans résultats : boutons de vérification individuels absents, terminaison globale et message Terminé RELU ; reprise/solution finales absentes. Le texte à trous attend un événement change : le banc sort du champ avec Tab avant de terminer.
- Douze DOCX/ODT/PDF relus. Tirage papier déterministe avec le même sous-ensemble dans le corrigé, sans troisième question parasite. Introduction illustrée sur sa propre page, questions et réponses non coupées dans les sondes ; crédits conservés.
- 202 assertions navigateur ; 22 conservations et 64 adaptateurs Sucrerie ; miroirs et 1137 clés partagées en 12 langues conformes.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/quiz-mixte/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --mixed-quiz-only
node tests/run_native_quiz_mixte_play.mjs
# Sucrerie
node tests/editor/run-quiz-mixte-ui.mjs
```

Les quiz QCM et Vrai/Faux partagent ces compléments mais restent à éprouver séparément avant leur clôture. Aucun push/déploiement ; ingestion RAG coupée.
