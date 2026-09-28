# Formes XML propres à Éléa

Modules présents dans la palette d'Éléa et **absents de celle de Magistère**. Relevés
le 4 septembre 2026 sur un export d'Éléa (Moodle 5.1.5, même build que Magistère).

Les URLs du site d'origine sont remplacées par `SITE-SOURCE.example` : seule la forme
nous intéresse, et un identifiant de site n'a rien à faire dans un dépôt.

## `mapmodules` — Carte de progression

Le module le plus tentant pour un atelier de parcours : il dessine un chemin sur une
image, y pose une icône par activité de la section, et l'icône change selon que
l'élève a terminé l'activité ou non. C'est **exactement** ce qu'un parcours voudrait
offrir en tête de cours.

**Il a été ouvert le 4 septembre 2026**, après lecture du code du greffon
(`moodle-code/elea/mod_mapmodules` sur la forge). Ce qui suit garde la trace de ce
que ce XML laissait supposer, et de ce que le code a réellement répondu — les deux
ne coïncident pas toujours, et c'est le plus instructif.

## Les trois inconnues, et ce qui les a levées

1. **`<targetsection>666</targetsection>` — on a cru à un identifiant de base.** Il
   n'en est rien : c'est un **RANG de section**, et `666` est la constante
   `ALL_SECTIONS_NUM` du greffon (`lib.php`, l. 36), c'est-à-dire la sentinelle du
   choix « Toutes les sections ».
   Ce qui a induit en erreur : `lib.php` porte DEUX fonctions de liste de sections,
   `mapmodules_extract_sections()` indexée par `id` et
   `mapmodules_extract_sections_fix()` indexée par `->section`. Seule la seconde est
   branchée sur le formulaire ; la première est du code mort. Et
   `mapmodules_get_modules_from_section()` interroge bien
   `WHERE section = '<rang>'`.
   **Conséquence** : rien à remapper, donc rien à craindre du restore — et une carte
   posée en section 0 avec `666` montre tout le parcours d'un seul chemin.

2. **L'`<intro>` est régénérée AU RESTORE**, pas au prochain enregistrement du
   formulaire. C'était la dernière question ouverte, et le fichier ré-exporté ne
   pouvait pas y répondre (cf. l'avertissement ci-dessous). Le code, lui, est sans
   ambiguïté : `restore_mapmodules_stepslib.php:process_mapmodules()` insère
   l'enregistrement, récupère le `contextid` tout neuf, rappelle
   `get_game_source_code()` et fait un `update_record` — dans la même étape de
   restauration.
   **Conséquence** : ce qu'un backup écrit dans `<intro>` est jeté. On pose donc une
   intro VIDE, plutôt que de recopier un HTML portant cinq URL absolues vers un site
   que Caramel ne connaît pas.

3. **Le `<path>` ne se calcule pas, il se recopie.** Les tracés, les images, les
   jeux d'icônes et la taille des icônes sont un CATALOGUE, `res/standard_maps.json`
   — 32 thèmes. Caramel en garde un relevé dans `js/parcours/cartes-standard.js`.

## Le piège que ce XML ne montrait pas : le NOM est le sélecteur d'image

`get_map_src()` fait `explode(' : ', $mapmodule->name)` et n'accepte que deux
préfixes, `Carte standard` et `Carte personnalisée` ; sur tout autre libellé il
lève une `Exception` PHP. Or cette fonction est appelée **pendant la
restauration** : l'exception n'y dégrade pas la carte, elle **fait échouer
l'import du cours entier**.

Le nom d'une carte n'est donc pas un titre — c'est un identifiant, et il ne se
rédige pas. C'est la même leçon que le `char(20)` de `mod_stickynotes`, d'un cran
plus sournoise : là le schéma disait la limite, ici c'est une grammaire de chaîne
qui n'apparaît nulle part dans le XML. Le titre que l'enseignant veut donner à sa
carte va dans `descriptionheader`, qui s'affiche au-dessus du chemin.

## Ce que la carte affiche, et ce qu'elle n'affiche pas

`mapmodules_get_json_modules()` retient une activité à deux conditions : elle
n'est ni un `label` ni une autre carte (`$excludedModules`), **et le suivi
d'achèvement est actif sur elle** (`if ($completion->is_enabled($cm))`). Une
carte posée dans un cours sans achèvement est donc une image sans icône.

## Les autres réglages, lus sur le formulaire

| Champ XML | Dans le formulaire | Remarque |
|---|---|---|
| `targetsection` | menu de la section visée | **666 = « Toutes les sections »**, un rang, pas un id |
| `buttonwidth` | « Taille des icônes » | `50` = Moyenne |
| `iconset` | jeu d'icônes | index dans `res/iconsets.json` (0 à 18) |
| `path` | — | tracé SVG, repris du catalogue des cartes standard |
| `name` | **champ caché**, rempli par l'éditeur de carte | `Carte standard : <thème>` — c'est lui qui désigne l'image |
| `descriptionheader` / `descriptionfooter` | « Ajouter un titre ou une description en haut / en bas de la carte » | **les deux seuls champs où une IA aurait à écrire** |

## Avertissement sur `mapmodules.elea-reimporte.xml`

Ce fichier voisin (dossier `apres-restauration/`) décrit une carte
« Carte standard : planisphère », alors que celui-ci décrit
« Carte standard : louise » : **ce ne sont pas la même activité avant et après**.
Il ne pouvait donc pas prouver, à lui seul, que l'intro est régénérée — deux
cartes distinctes portent chacune une intro cohérente avec elle-même, qu'il y ait
eu régénération ou non. La preuve est dans le code, pas dans ce diff.

Les valeurs relevées ci-dessus restent la référence de FORME — c'est ce qu'Éléa
écrit quand on crée une carte à la main, et c'est à cette séquence de balises que
`tests/run_parcours_course.mjs` compare ce que Caramel produit.
