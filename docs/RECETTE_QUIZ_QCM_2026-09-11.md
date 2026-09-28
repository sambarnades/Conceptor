# Recette Quiz QCM — 11 septembre 2026

Référence : réexport utilisateur Éléa 18-QuizSetQCM, trois questions sur la fonction racine carrée. Semantics identiques au quiz mixte QuestionSet 1.21. Recette complémentaire locale, sans nouveau dépôt Éléa.

- Réglages communs du quiz mixte réutilisés ; 24 assemblages du prompt QCM vérifiés en 12 langues.
- Retouche du titre d’une question et de sa rétroaction ; sauvegardes/réouvertures dans les deux hôtes et annulation Sucrerie via callback local. Identifiants et trois sous-types MultiChoice conservés.
- Jeu : erreur 2/3 puis reprise 3/3 ; variante sans reprise : 2/3, solution disponible et reprise absente. Le banc attend maintenant la file MathJax et les polices avant de capturer les formules : le chevauchement initial était transitoire.
- Défaut réel corrigé dans les deux exports : les crochets d’intervalles français [a,b[ / ]a,b] / ]a,b[ sont émis comme caractères littéraux dans StarMath. Auparavant LibreOffice affichait des signes d’erreur rouges et perdait certains intervalles.
- Pagination Word/LibreOffice : les éléments textuels des questions courtes restent liés à leurs réponses. Le titre et le sous-titre de la troisième question ne sont plus isolés sur la page précédente.
- Douze DOCX/ODT/PDF relus après correction ; racines, inégalités et intervalles lisibles. Les ODT contiennent 14 objets MathML/StarMath ; leur contrôle lit aussi ces objets, pas seulement content.xml. DOCX : mathématiques OMML éditables ; PDF : notation Unicode.
- 552 assertions (mathématiques, documents, éditeurs), dont quatre nouveaux intervalles StarMath ; 22 conservations et 64 adaptateurs Sucrerie conformes. Miroirs conformes.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/quiz-qcm/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --qcm-quiz-only
node tests/run_native_quiz_qcm_play.mjs
# Sucrerie
node tests/editor/run-quiz-qcm-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
