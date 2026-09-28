# Recette Mots croisés — 11 septembre 2026

Référence : retour Éléa Crossword, contenu et semantics conservés. Les nouveaux compléments ont été éprouvés dans le lecteur natif local ; pas de nouveau dépôt Éléa.

- Éditeur partagé : mot-solution, positions fixes (ligne/colonne 1–64, orientation), tirage et indices texte/image/audio/vidéo. Sauvegarde/réouverture Caramel et Sucrerie ; annulation Sucrerie via callback local.
- Processeur : identifiants des indices conservés, médias et crédits empaquetés, libellés personnalisés préservés. Suppression des indices et du fond représentée lors de la fusion Sucrerie.
- Lettres grecques préservées dans le paquet ; prompts corrigés en 12 langues et 24 assemblages vérifiés (sans nouvelle génération IA).
- Papier : positions fixes et tirage conservés, mot-solution muni de repères d’extraction, indice image et attribution présents. Douze DOCX/ODT/PDF relus. La variante image occupe trois pages, correction distincte. Le banc utilisait les mots dépouillés de leurs données image après empaquetage : il utilise désormais les mots résolus et vérifie leur image dans les placements.
- Jeu natif : texte et image ouverts ; audio 1,96 s et vidéo 1,36 s réellement lus. Barème par mots 2/2 ; par lettres 8/8. Réponse correcte conservée lors de la reprise avant solution ; après solution, nouvelle saisie complète réussie. Mot-solution ROME affiché.
- Contrôles : 1354 assertions navigateur (documents, éditeurs, robustesse, grilles), 22 contrôles de conservation et 64 adaptateurs Sucrerie ; miroirs 51 fichiers et 1114 clés partagées en 12 langues conformes.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/mots-croises/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --crossword-only
node tests/run_native_mots_croises_play.mjs
# Sucrerie
node tests/editor/run-mots-croises-ui.mjs
```

Aucun push ni déploiement ; ingestion RAG coupée.
