# Recette Glisser-déposer — 11 septembre 2026

Référence : réexport utilisateur Éléa 20-DragAndDrop (DragQuestion), huit verbes et trois zones. Ce retour sans marqueur RELU a bien été accepté ; aucune nouvelle manipulation demandée. Recettes complémentaires locales avec lecteur natif, sans nouveau dépôt Éléa.

- Éditeurs : options de vérification, score unique, pénalités, explication, surbrillance, espacement, plein écran, titre et poignée ; visibilité/opacité/alignement/capacité des zones, indices et rétroactions ; répétition/opacité des étiquettes et zones autorisant le dépôt distinctes du corrigé.
- Conservation : huit identifiants, métadonnées, libellés natifs et extras des éléments/zones conservés, y compris quand l’adaptateur reconnaît une disposition automatique. Caramel peut reprendre la structure native en disposition personnalisée.
- Validation : une zone suffit ; une étiquette sans réponse correcte est un distracteur valide. Les indices de zones invalides restent refusés. Le modèle de disposition conserve sa limite de dix zones ; Sucrerie garde son édition native en place au-delà.
- Prompts : suppression de l’affirmation erronée « seul le feedback global est possible », ajout des options et des rétroactions de zone ; 24 assemblages en 12 langues vérifiés.
- Documents : indices sur la fiche élève, rétroactions dans la correction ; douze DOCX/ODT/PDF relus, tous sur deux pages. Variante avec véritable étiquette image : image présente dans la fiche et le corrigé des trois formats des deux hôtes.
- Sauvegarde/réouverture Caramel et Sucrerie, annulation Sucrerie via callback local. Jeu clavier : erreur 6/8 puis reprise 8/8 ; variante avec image sans reprise 6/8 ; une zone et distracteur 0/1 puis 1/1. Aucun appel externe.
- 202 contrôles éditeurs/documents, 22 conservations et 64 adaptateurs conformes ; miroirs conformes, 1151 clés partagées présentes dans 12 langues.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/glisser-deposer/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --dnd-only
node tests/run_native_glisser_deposer_play.mjs
# Sucrerie
node tests/editor/run-glisser-deposer-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
