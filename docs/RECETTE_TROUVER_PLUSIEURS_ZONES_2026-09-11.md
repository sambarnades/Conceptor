# Recette Trouver plusieurs zones — 11 septembre 2026

Référence : n° 24 FindMultipleHotspots réenregistré et réexporté par l’utilisateur. Image native imbriquée et feedback RELU conservés. Recette complémentaire locale, sans nouveau dépôt Éléa.

- Perte corrigée du titre interne `questionTitle`, désormais éditable séparément du titre d’activité dans les deux hôtes.
- Formes, positions, dimensions, bonnes zones, nom de famille, seuil et feedbacks édités puis sauvegardés/réouverts. Annulation Sucrerie via callback local vérifiée.
- Prompts complétés dans 12 langues : titre interne, rectangle/cercle et plafond volontaire ; 24 assemblages contrôlés.
- Deux variantes jouées avec l’image chargée (800 pixels) : hors zone et leurre sans point ; deux zones correctes → 2/2 ; double clic sur la première zone → toujours 1/2, message « déjà trouvée » ; plafond volontaire → 1/1 et aucun point supplémentaire.
- Le lecteur natif ne rend pas son bouton Retry visible dans ces variantes ; aucun réglage de reprise n’existe dans les semantics. La recette ne prétend pas avoir exercé une reprise par bouton. Les mots natifs « of » et « Retry » sont codés dans la bibliothèque.
- Douze DOCX/ODT/PDF relus : deux pages chacun, consigne et nombre de zones sur la fiche, image numérotée et toutes les réponses acceptables sur le corrigé. Aucun défaut documentaire détecté.
- 60 contrôles éditeurs, 22 conservations et 64 adaptateurs Sucrerie conformes ; miroirs conformes, 1159 clés partagées dans 12 langues.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/trouver-plusieurs-zones/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --find-multiple-only
node tests/run_native_trouver_plusieurs_zones_play.mjs
# Sucrerie
node tests/editor/run-trouver-plusieurs-zones-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
