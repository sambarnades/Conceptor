# Recette Image à points interactifs — 11 septembre 2026

Référence : réexport utilisateur Éléa 22-ImageHotspots, trois points sur une image. Recette complémentaire locale avec ImageHotspots 1.11, sans nouveau dépôt Éléa.

- Options par point : ouverture systématique en plein écran, icône prédéfinie/image/héritage et couleur ajoutées. Le positionnement ancien et les identifiants existants restent conservés.
- Blocs multimédias : présentation du lecteur audio, commandes, lecture automatique, adaptation à la largeur ; commandes, adaptation, boucle, lecture automatique et affiche vidéo. Conservation des sources alternatives et métadonnées des fichiers dans les nœuds édités.
- Prompts : formes structurées Texte/Image/Audio/Vidéo et réglages de points explicités ; 24 assemblages en 12 langues contrôlés.
- Défaut documentaire corrigé : seul le premier texte d’un point était exporté. Tous les textes et images sont désormais inclus, avec crédits et mention des médias embarqués. Pagination adaptée pour garder la légende illustrée ensemble.
- Sauvegarde/réouverture et annulation Sucrerie via callback local. Deux variantes icône/image ; trois ouvertures/fermetures chacune, plein écran vérifié, image chargée et lectures audio/vidéo réellement avancées. Le banc attend la fin de l’ouverture native avant de lancer la lecture.
- Douze DOCX/ODT/PDF relus, deux pages chacun. Deuxième paragraphe et image du point 2 présents. 202 contrôles éditeurs/documents conformes, puis 142 documentaires après pagination ; 22 conservations et 64 adaptateurs Sucrerie conformes. Miroirs conformes, 1157 clés partagées dans 12 langues.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/image-points/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --image-points-only
node tests/run_native_image_points_play.mjs
# Sucrerie
node tests/editor/run-image-points-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
