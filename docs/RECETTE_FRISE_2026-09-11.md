# Recette Frise chronologique — 11 septembre 2026

Référence : réexport utilisateur Éléa 21-Timeline, trois étapes fictives et image de fond. Recette complémentaire locale avec Timeline 1.1 et TimelineJS, sans nouveau dépôt Éléa.

- Défaut corrigé : la hauteur de l’éditeur écrivait une clé racine ignorée quand `timeline.height` existait déjà. Le champ édite désormais la valeur native ; reprise des anciennes données racine à l’ouverture.
- Zoom, langue, image de fond et vignette d’événement ajoutés ; périodes, dates de fin, mots-clés, crédits et légendes conservés.
- Processeur sans mutation de l’entrée ; zoom numérique sérialisé au format natif.
- Prompts : périodes facultatives, médias limités aux URL fournies, réglages natifs explicités ; 24 assemblages en 12 langues vérifiés, sans nouvel appel IA.
- Documents : dates de fin et crédits rétablis ; les liens qui ne désignent pas une image restent du texte au lieu d’être traités comme une image cassée. Douze DOCX/ODT/PDF relus, une page chacun, avec événements et période.
- Sauvegarde/réouverture des deux variantes dans les deux éditeurs et annulation Sucrerie via callback local. Le lecteur natif affiche les hauteurs retouchées Sucrerie 550 et 800 px ; image de fond de 800 px réellement décodée, navigation avant/arrière et dernier événement dans la zone visible vérifiés. Français/anglais et zoom -1/2 conservés.
- 202 contrôles éditeurs/documents, 22 conservations et 64 adaptateurs Sucrerie conformes ; miroirs conformes, 1155 clés partagées dans 12 langues.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/frise/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --timeline-only
node tests/run_native_frise_play.mjs
# Sucrerie
node tests/editor/run-frise-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
