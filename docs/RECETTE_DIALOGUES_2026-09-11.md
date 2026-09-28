# Recette Cartes de dialogue — 11 septembre 2026

Référence Éléa : **11-DialogCards.h5p**, H5P.Dialogcards **1.9.40**, indice recto RELU réenregistré et réexporté. Même version dans le lecteur local. Compléments éprouvés sans nouvel appel IA ni dépôt distant.

- Confirmation de remise à zéro éditable (titre, texte, annulation, confirmation), autonome et embarquée dans les présentations/livres. Libellés personnalisés et métadonnées conservés par le processeur et à la sauvegarde.
- Audio, image et crédits issus du retour natif conservés ; images vides supprimées. Les capacités audio/upload/réouverture du lot cartes antérieur restent couvertes par `tests/roundtrip/cartes-capacites.js`.
- 24 assemblages de prompts dans 12 langues, avec confirmation explicitée ; pas de génération IA revendiquée.
- Sauvegarde/réouverture Caramel ; description et confirmation modifiées dans les contrôles visibles Sucrerie, sauvegarde via callback local, réouverture et annulation. Pas de persistance serveur annoncée.
- Jeu normal : audio réellement lu (durée et progression de lecture enregistrées), retournement recto/verso et passage à la carte suivante ; retour arrière désactivé absent.
- Répétition : première manche avec une réussite et une erreur, résumé 1/2 pour chacune ; passage à la manche 2, deux réponses correctes, nouveau résumé. Remise à zéro annulée puis confirmée avec les libellés modifiés ; retour aux cartes.
- **12 documents DOCX/ODT/PDF relus** : recto/verso en miroir, indices des deux faces et crédits en annexe.
- **202 assertions navigateur sans échec**, 22 contrôles de conservation et 64 adaptateurs Sucrerie. Miroir 51 fichiers et 1101 clés dans 12 langues conforme.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/dialogues/`.

```sh
node tests/run_h5p_capabilities_documents.mjs --dialogs-only
# Sucrerie :
node tests/editor/run-dialogues-ui.mjs
# Caramel :
node tests/run_native_dialogues_play.mjs
```

Branches emmanuel, commits locaux dans les suivis. Aucun push ni déploiement ; ingestion RAG coupée.
