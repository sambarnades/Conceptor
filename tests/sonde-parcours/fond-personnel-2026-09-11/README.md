# Essai du fond personnel — 11 septembre 2026

Parcours local avec deux activités (Flashcards et Forum) et une carte Éléa en
section 0. Image de démonstration : *La Nuit étoilée*, Vincent van Gogh, déjà
présente dans `tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg`.
Aucun appel à l’IA pour ces essais, aucune ingestion RAG, aucun import en production.

- `scenario-fond-personnel.json` : reprise dans Caramel, image conservée.
- `parcours-fond-personnel.mbz` : archive à **restaurer réellement sur Éléa**.
- `fond-fr-1440.png`, `fond-fr-390.png` : galerie et aperçu du placement.
- `consigne-fr-1440.png`, `notions-br-390.png` : champs dépliés extensibles.
- `validation-fonds.txt` : 58 contrôles réussis, exécutables avec
  `node tests/run_parcours_fonds.mjs`.

Les octets, SHA-1, déclarations `files.xml`, `inforef.xml`, contexte renuméroté et
coexistence avec le H5P ont été vérifiés dans le MBZ. Les conversions réelles
JPEG, PNG, WebP, GIF, BMP, AVIF, SVG, HEIC et TIFF ont été testées ; les formats
HEIF empruntent le même décodeur HEIC/HEIF déjà présent dans Caramel.

Reste à relire le parcours, restaurer ce MBZ sur une instance Éléa cible et
vérifier le fond, les icônes et les liens avec un compte apprenant. L’aperçu de
Caramel représente le placement ; il ne reproduit pas le moteur du greffon.
