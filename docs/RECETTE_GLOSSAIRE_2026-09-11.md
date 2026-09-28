# Recette Glossaire / Accordéon — 11 septembre 2026

Référence : réexport utilisateur Éléa 16-Glossary, six panneaux sur la Révolution française et titre RELU. Recette complémentaire dans le lecteur natif local, sans nouveau dépôt en plateforme.

- Conservation des identifiants et métadonnées des panneaux ; le processeur Caramel ne mute plus la source.
- Défaut Sucrerie corrigé : l’adaptateur attendait un tableau alors que l’éditeur sauvegardait un objet portant hTag, et produisait des panneaux vides. Le modèle conserve maintenant panels/hTag et l’adaptateur accepte également les anciens tableaux et objets items.
- Niveau sémantique H2/H3/H4 correctement présenté (aucun changement de taille visuelle promis). Borne native de 100 entrées appliquée. Prompts objet panels/hTag cohérents et exemples corrigés ; 24 assemblages en 12 langues vérifiés, sans génération IA.
- Deux variantes H2/H4 : modification de définition, sauvegarde/réouverture Caramel, sauvegarde/réouverture/annulation Sucrerie via callback local. Six panneaux et identifiants conservés. Ancien format tableau toujours empaqueté.
- Lecteur natif : six panneaux ouverts, définitions retrouvées ; ouverture par Entrée, fermeture par Espace ; niveaux H2 et H4 vérifiés dans le DOM.
- Douze DOCX/ODT/PDF relus, chacun tient désormais sur une page après suppression des espacements intercalaires superflus. Gras natif et définitions conservés.
- 202 assertions navigateur, 22 contrôles de conservation et 64 adaptateurs conformes. Miroirs et 1114 clés dans 12 langues conformes.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/glossaire/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --glossary-only
node tests/run_native_glossaire_play.mjs
# Sucrerie
node tests/editor/run-glossaire-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée.
