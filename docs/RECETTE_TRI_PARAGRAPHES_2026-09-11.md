# Recette Classer les paragraphes — 11 septembre 2026

Référence : retour Éléa **14-SortParagraphs.h5p**, consigne RELU et image native. Les compléments sont testés dans le lecteur local, pas redéposés en plateforme.

- Média de question ajouté à l’éditeur partagé et au processeur ; image, texte alternatif et crédits conservés à la sauvegarde/réouverture et imprimés. Audio/vidéo utilisent le composant natif commun.
- Défaut partagé découvert et corrigé : le widget média affichait deux champs pour le même texte alternatif ; la valeur intacte du second écrasait la retouche du premier. Il reste un seul champ, avec vérification de sa sauvegarde et réouverture.
- Borne minimale alignée sur les semantics : trois paragraphes dans l’éditeur et le processeur. Libellés personnalisés et accessibilité conservés. Prompts complétés et 24 assemblages vérifiés en 12 langues.
- Caramel/Sucrerie : sauvegarde et réouverture ; annulation Sucrerie via callback local sans persistance. 12 DOCX/ODT/PDF relus, image, attribution, énoncé mélangé et corrigé ordonné présents.
- Jeu clavier : barème par positions 4/4 après erreur, solution et reprise ; doublons interchangeables. Barème par transitions 3/3 sur une ouverture neuve, sans boutons de déplacement.
- **Réserve native non résolue** : dans la configuration transitions, l’affichage de solution puis la reprise déclenchent `Failed to execute 'removeChild' on 'Node'`. Le code natif retire un élément de score d’un parent qui n’est pas son parent direct (`hideScoreExplanation`). Les paragraphes restent désactivés. La recette archive cette erreur et remonte une ouverture neuve pour vérifier séparément le score 3/3 ; elle ne déclare pas la reprise réussie.
- 202 assertions navigateur, 22 contrôles de conservation et 64 adaptateurs Sucrerie sans échec ; miroirs et 1109 clés dans 12 langues conformes.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/tri-paragraphes/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --sort-only
node tests/run_native_tri_paragraphes_play.mjs
# Sucrerie :
node tests/editor/run-tri-paragraphes-ui.mjs
```

Lot éditeur/prompts/exports terminé ; validation complète suspendue à la réserve du lecteur natif. Aucun push/déploiement ; ingestion RAG coupée.

## Mise à jour du 12 septembre

Défaut corrigé et joué dans les deux lecteurs locaux. La réserve Éléa reste ouverte : [correctifs, limites et preuves](CORRECTIFS_LECTEURS_H5P_2026-09-12.md).
