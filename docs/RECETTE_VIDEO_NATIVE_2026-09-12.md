# Recette Vidéo interactive native — 12 septembre 2026

Référence : retour utilisateur `27-InteractiveVideo.h5p`, Éléa H5P.InteractiveVideo **1.28.35**. Cette recette complète le code local ; aucun nouveau dépôt Éléa ni appel IA distant pendant ce lot.

- Formulaire fondé sur les semantics : 18 bibliothèques d’interaction, durée, pause, affichage affiche/bouton, coordonnées et dimensions, métadonnées, adaptativité, signets, écrans de soumission, résumé et options de lecture. Les identifiants et champs natifs non retouchés sont conservés.
- Les vidéos générées peuvent ouvrir « Options avancées » pour accéder au formulaire natif. Les options demandées dans les prompts des 12 langues passent aussi par le modèle simple : pause, reprise, écran initial, signets, écran final, résumé. 24 assemblages de prompts contrôlés ; aucune nouvelle génération distante.
- Plusieurs sources téléversées et libellés de qualité éditables ; ajout réel de deux WebM et d’une piste WebVTT. Sauvegarde/réouverture Caramel, sauvegarde/réouverture/annulation Sucrerie. Les deux sources, la piste et les retouches restent présentes.
- Deux défauts trouvés en jouant : un saut facultatif vide devenait `null`, interprété par H5P comme retour à zéro ; une option héritée devenait « activé ». Les valeurs facultatives absentes restent absentes, la reprise fonctionne.
- Jeu natif final sur les paquets Sucrerie : réponse fausse puis reprise et réponse juste, résumé → **2/2** ; reprise désactivée et résumé → **1/2**. Bascule Source B (`q2`), signet à 2 s, sous-titre « Capitales RELU » visible et soumission finale confirmés dans les deux variantes. Aucun service LMS sollicité par la soumission locale.
- Documents : contenu des interactions et résumé, énoncé séparé du corrigé, affiche et attribution. Les actions texte, lien, branchement, questionnaire, réponse ouverte et choix multimédia ont une conversion documentaire dédiée. Les 18 types ne sont pas tous joués dans ce scénario ; les contrôles de schéma/document complètent les deux variantes jouées.
- **12 DOCX/ODT/PDF produits et relus**. Correction du vocabulaire de livre dans les fiches vidéo et de la coupure du résumé PDF entre son intitulé et ses réponses. DOCX/ODT : 2 pages ; PDF : 3 pages, résumé entier en page 2.
- **226 assertions navigateur / 0 échec**, 22 contrôles de conservation et 65 adaptateurs Sucrerie ; 52 fichiers communs conformes, 1165 clés présentes dans 12 langues. Persistance Sucrerie simulée localement, pas validation de la base distante.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/video-native/` dans bas (4 paquets, 12 documents, captures, résultats et SHA-256).

```sh
node tests/run_h5p_capabilities_documents.mjs --native-video-only
# puis, dans Sucrerie :
node tests/editor/run-video-native-ui.mjs
# puis, dans bas :
node tests/run_native_video_native_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
```

Branches emmanuel ; aucun push ni déploiement, ingestion RAG coupée.
