# Sélecteur d’accueil — proposition de Gauthier, 13 septembre 2026

Rendu local réel de Caramel servi en HTTP, vérifié dans Chromium.

- Capsule centrée de 480 px maximum, après le formulaire complet.
- Sélection bleu grisé `#51779c`, identique au filtre « Tout », texte blanc (contraste 4,70:1), deux segments égaux. Icône caramel du parcours au repos, blanche quand sélectionné.
- 16 configurations mesurées : largeurs 1280, 1127, 390 et 320 px × Rapide/Avancé × Activité/Parcours.
- Aucun débordement horizontal ; espaces de 12 px avant/après ; cibles tactiles de 44 px sur téléphone.
- Flèche droite et Home vérifiés : sélection et focus suivent ; saisies Qui/Quoi conservées.
- Aucun événement `pageerror`. Les requêtes externes étaient bloquées pour la recette visuelle.
- 8 captures à 1280 et 390 px ; relevés dans `mesures.json`.
- Banc existant `node tests/run_parcours_atelier.mjs` : 172 PASS / 0 FAIL, journal dans `atelier.log`.

Décision D63 dans `docs/PRD_PARCOURS.md`. Modification locale, non publiée.
