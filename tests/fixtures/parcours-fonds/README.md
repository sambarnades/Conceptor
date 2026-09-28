# Images de test des fonds de parcours

Dégradé synthétique 160 × 100 px, sans ressource tierce ni donnée personnelle.
Pixels RGB : `(30 + x, 60 + y, 160)`.

Le PNG est écrit avec `struct` et `zlib` de Python ; les autres fichiers sont
convertis par l’outil macOS `sips -s format FORMAT degrade.png --out degrade.EXT`.
Aucune nouvelle bibliothèque n’est livrée avec Caramel. Les vraies conversions
HEIC/HEIF et TIFF du navigateur passent par heic2any et UTIF/pako déjà déclarés.

`node tests/run_parcours_fonds.mjs` lit les dimensions et les couleurs après
conversion réelle, y compris avec un MIME vide. Il génère aussi JPEG, WebP et SVG
à la volée, puis vérifie les octets du fond dans l’archive `.mbz` et le scénario.
