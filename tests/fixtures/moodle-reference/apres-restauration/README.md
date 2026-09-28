# Ce que la plateforme renvoie — après un aller-retour réel

Les mêmes modules que le dossier parent, mais **ré-exportés depuis Magistère après y
avoir été importés par Caramel**. Autrement dit : ce que la plateforme a réellement
gardé de ce que nous avons écrit.

Source : sonde `sonde-parcours-magistere.mbz` du 4 septembre 2026, importée dans un
cours Magistère puis ré-exportée. Aucune trace nominative ni d'identifiant de site.

## Pourquoi les garder à côté des formes d'origine

Le dossier parent dit **ce qu'on doit écrire**. Celui-ci dit **ce qui survit**, et les
deux ne coïncident pas toujours :

- Le titre de colonne « Ce que je crois savoir » (22 caractères) est parti tel quel de
  Caramel, mais la version tronquée à 20 est ce qui doit arriver — parce qu'au-delà,
  `mod_stickynotes` fait échouer la restauration du cours entier (§ 7 du PRD). Ces
  fichiers en portent la preuve : « Ce que je crois », coupé au mot.
- `completion: 2` **avec** `completionview: 0` traverse intact. C'était le réglage dont
  je n'étais pas sûr : ces deux modules portent leur propre critère d'achèvement, et
  poser « terminé quand consulté » aurait vidé ce critère de son sens.
- `collabwordcloud` revient toujours **sans** balise `<course>`, `stickynotes` **avec**.

Ce sont les seules réponses que ni un banc ni un export vierge ne pouvaient donner.

## Ajouts du 4 septembre 2026

### `stickynotes.elea.xml` — le mur, tel qu'Éléa le renvoie

Identique à ce que renvoie Magistère, à l'identifiant de cours près. Les trois titres de
colonne y sont, dont « Ce que je crois » — le titre de 22 caractères arrivé tronqué. Les
deux plateformes se comportent donc pareil sur ce module aussi.

### `mapmodules.elea-reimporte.xml` — la Carte de progression après un réimport

Une carte créée à la main dans un cours Éléa, exportée, **réimportée dans un autre cours**,
puis ré-exportée. Trois observations, et elles ne vont pas toutes dans le même sens :

1. **L'`intro` EST régénérée.** Le `mapid` suit la nouvelle activité (1433 → 1434) et le
   `gameid` change (`game429` → `game983`). Le plugin réécrit donc son HTML au lieu de
   traîner celui du cours d'origine : c'est la bonne nouvelle, et elle lève l'inquiétude
   principale.
2. **`targetsection` ne bouge pas — il vaut 666 avant comme après.** Or les sections du
   cours d'accueil portent les identifiants 25220 à 25225 : **666 ne désigne aucune
   d'elles**. Ce n'est donc pas un pointeur de section vivant, mais une valeur inerte
   (sentinelle, valeur par défaut, ou vestige). Elle traverse sans nuire — la carte
   fonctionne — mais **il ne faut pas essayer d'y calculer un identifiant de section** :
   ce serait poser un pointeur là où le plugin n'en attend visiblement pas.
3. **La carte est posée en section 0**, la zone « Généralités », en tête de cours. C'est sa
   place naturelle, et c'est commode : dans un parcours Caramel, la section 0 est justement
   laissée vide.

Ce que ces fichiers ne disent toujours pas : ce que la carte affiche exactement quand elle
est en section 0 — les activités de tout le cours, ou celles de la première section. La
réponse est à l'écran, pas dans le XML.

## Ajout du 6 septembre 2026

### `mapmodules.elea-apres-caramel.xml` — la carte que Caramel a posée, revenue d'Éléa

Celui-là, contrairement à son voisin `mapmodules.elea-reimporte.xml`, compare bien la
MÊME activité avant et après : la sonde Éléa du 04/09 18:03, importée dans un cours Éléa
puis ré-exportée. C'est la preuve que le voisin ne pouvait pas donner.

**Caramel a envoyé `<intro></intro>`.** Ce fichier montre ce qu'Éléa a mis à la place :

- les cinq URL portent l'hôte du site D'ACCUEIL, que Caramel n'a jamais connu (remplacé
  ici par `SITE-CIBLE.example`) ;
- `mapid` vaut l'identifiant de la nouvelle activité, `gameid` est tiré au hasard ;
- l'image est `maplandscape.jpg`, **résolue depuis le nom** « Carte standard : paysage » —
  si le greffon ne l'avait pas trouvée il aurait levé une exception, et la restauration
  du cours entier se serait arrêtée là ;
- le `<svg>` porte **notre `path`**, au caractère près, et le premier `<div>` **notre
  `descriptionheader`**.

Tout le reste traverse sans une modification : `targetsection` à 666, `iconset` 10,
`buttonwidth` 50, `displaymodulenames` 0, `timecreated` et `timemodified` préservés. Côté
`module.xml`, `showdescription: 1` et `completion: 0` reviennent tels quels.

**Conclusion pour qui reprendrait le sujet** : ne jamais écrire l'`<intro>` d'une carte.
Le greffon la refabrique au restore, et lui seul connaît le site d'arrivée.
