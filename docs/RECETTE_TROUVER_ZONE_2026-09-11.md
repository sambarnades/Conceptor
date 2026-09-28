# Recette Trouver la zone — 11 septembre 2026

Référence : n° 23 FindTheHotspot corrigé et réexporté par l’utilisateur (titre RELU). Image native aplatie confirmée : `imageHotspotQuestion.backgroundImageSettings.path`. La forme imbriquée initialement fautive n’est pas réintroduite. Recette complémentaire locale, sans nouveau dépôt Éléa.

- Libellés natifs de reprise, fermeture, barre de score et accessibilité éditables ; formes, dimensions, coordonnées, réponse, feedback par zone et feedback hors zone déjà présents et éprouvés.
- Prompts : mode de feedback et géométrie explicités ; 24 assemblages en 12 langues vérifiés.
- Deux variantes : rectangle/popup et cercle/feedback intégré. Retouches du feedback, du nom de zone et des libellés ; sauvegarde/réouverture des deux hôtes, annulation Sucrerie via callback local.
- Jeu sur l’image réellement chargée : clic hors zone 0/1, zone incorrecte 0/1, reprise, zone correcte 1/1 dans les deux variantes. Mode popup/intégré vérifié. Le lecteur thémé affiche la reprise sous forme d’icône : le banc utilise son nom accessible.
- Douze DOCX/ODT/PDF relus, deux pages chacun : image sans réponse sur la fiche, image numérotée et légende corrigée sur la correction. Aucun nouveau défaut documentaire détecté.
- 60 contrôles éditeurs, 22 conservations et 64 adaptateurs Sucrerie conformes ; miroirs conformes, 1159 clés partagées dans 12 langues.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/trouver-zone/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --find-zone-only
node tests/run_native_trouver_zone_play.mjs
# Sucrerie
node tests/editor/run-trouver-zone-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
