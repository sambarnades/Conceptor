# Recette Quiz Vrai/Faux — 11 septembre 2026

Référence : réexport utilisateur Éléa 19-QuizSetVF, trois questions mathématiques. Recette complémentaire locale avec les bibliothèques natives, sans nouveau dépôt Éléa.

- Correction pédagogique de l’exemple : pour x ≥ 0, √(x²) = x est vrai. Réponse et rétroactions corrigées ; archive Éléa originale conservée.
- Retouche dans les deux éditeurs, sauvegarde/réouverture et annulation Sucrerie via callback local. Trois sous-questions TrueFalse et leurs identifiants conservés.
- Réglages communs QuestionSet du lot mixte réutilisés ; 24 assemblages du prompt Vrai/Faux en 12 langues vérifiés.
- Deux variantes jouées : erreur 2/3 puis reprise 3/3 ; corrigé disponible ou désactivé selon le réglage.
- Douze DOCX/ODT/PDF relus : racines, inégalités, intervalle et correction de la deuxième assertion lisibles. ODT vérifié aussi dans ses objets mathématiques ; attente MathJax 2 ou 3 dans le banc avant capture.
- 60 contrôles éditeurs, 22 conservations et 64 adaptateurs Sucrerie conformes. Le socle partagé mathématiques/documents avait passé 552 contrôles au lot QCM précédent.

Preuves, captures, paquets, documents et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/quiz-vf/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --vf-quiz-only
node tests/run_native_quiz_vf_play.mjs
# Sucrerie
node tests/editor/run-quiz-vf-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
