# PRD — Atelier de parcours

> **État** : lot 1 clos, lot 2 en cours · branche `emmanuel` du dépôt `bas` (bac à sable).
> **Dernière mise à jour** : 10 septembre 2026.
> Ce document est la mémoire du développement. Le fil de conversation ne l'est pas :
> toute décision prise doit atterrir ici, avec sa raison, pour ne pas être rejouée.

---

## 1. Le problème

Caramel génère une activité à la fois. Un enseignant qui veut une séquence de huit
active huit fois le formulaire, télécharge huit fichiers, les importe huit fois dans
Éléa, puis range les sections à la main. Le coût de l'assemblage annule le gain de la
génération.

**Ce qu'on veut livrer** : un `.mbz` de cours unique — sections, activités remplies,
ordre, durées — qu'on importe une fois et c'est fini.

**Ce qui existe déjà et qu'on ne réécrit pas** :

| Brique | Où | Ce qu'elle fait |
|---|---|---|
| Génération d'activité | `js/h5p/`, `js/moodle/` | 27 types H5P + 8 modules Moodle réellement remplis |
| Motif « plan + remplissage » | `services/llm-batch.js` | `buildOutlinePrompt()` / `buildFillPrompt()` — exactement le motif dont le parcours a besoin, à l'échelle d'un cours |
| Assemblage `.mbz` | `moodle-creator.js:createMbz()` | prend une carte `{chemin: contenu}`, sort le `tar.gz` |
| Sauvegarde de cours multi-activités | `mbz-course-builder.js` (Sucrerie) | sections, carnet de notes, inscriptions, `h5pactivity` avec le vrai `.h5p`, banque de questions |
| Réparation | `h5p/json-healer.js` | obligatoire entre le modèle et chaque processeur |
| Éditeur visuel | `js/editor/` | ouvre n'importe quelle activité générée, sans modification |
| Corpus de l'enseignant | `services/ocr.js` → `#ocr-output` | PDF, page web, image océrisée, transcription vidéo |

Le travail neuf, c'est **l'orchestration** : intention → plan → N générations cohérentes → un fichier.

---

## 2. Décisions arrêtées

Chacune a été tranchée ; ne pas les rouvrir sans raison nouvelle.

- [x] ~~**D1 — Point d'entrée : pastille flottante en bas à gauche**~~ — **remplacée par
      D38 le 6 sept. 2026.** Gardée pour mémoire : symétrique de Caramelia, même gabarit,
      caramel plus profond. *Pourquoi à l'époque* : ne pas bouger d'un pixel le chemin de
      l'activité unique ; écartés une 36ᵉ tuile (mauvaise altitude), un bouton d'en-tête
      (« déjà cinq »), un bandeau intercalé. *Pourquoi ça n'a pas tenu* : le bouton flottant
      est le motif de l'assistant, et y loger un mode de production le faisait passer pour
      un gadget ; « déjà cinq » n'était pas une raison mais une mesure à faire — elle a été
      faite (§ 12).
- [x] **D2 — Aucune ressaisie.** Le contexte est LU en direct sur la page d'accueil :
      `#qui`, `#quoi`, `#niveau` **et le corpus joint**. ~~L'atelier n'affiche qu'un
      récapitulatif en lecture seule.~~ Depuis D39, l'atelier n'affiche plus AUCUN
      récapitulatif : le formulaire est juste au-dessus de lui, vivant, et ce qu'on y
      tape compte tout de suite. Seule reste une note sur les documents joints — en mode
      Rapide ils sont hors de vue, et c'est eux qui feront référence.
      *Pourquoi* : un premier jet dupliquait les champs — un formulaire de trop, qui
      oubliait au passage les pièces jointes. Or un parcours bâti sur le document de
      l'enseignant vaut bien mieux qu'un parcours bâti sur un thème nu.
- [x] **D3 — Le bleu `#007aff` est l'accent de l'atelier**, comme dans tout Caramel. Le
      caramel ne sert QUE la pastille, comme Caramelia réserve son doré à sa bulle.
      *Pourquoi* : un accent différent fabrique un second produit. Les valeurs de style
      sont relevées sur l'interface existante (cf. en-tête de `css/components/parcours.css`).
- [x] **D4 — On entre par l'intention, pas par une méthode de conception.** Une
      bibliothèque de trames nommées en français ordinaire ; l'analyse par types
      d'apprentissage viendra en RETOUR (lot 2), comme un miroir.
      *Pourquoi* : un professeur qui prépare une révision pour vendredi ne raisonne pas en
      pourcentages de types d'activité.
- [x] **D5 — L'ampleur se raisonne en SÉANCES**, pas en minutes. Plafond dur : 12 activités.
      *Pourquoi* : c'est l'unité dans laquelle un enseignant pense. Au-delà de 12, le temps
      de fabrication devient insupportable et le socle commun envoyé au modèle se dégrade.
- [x] **D6 — Rien n'est généré avant relecture du plan.** L'appel de plan est court et
      isolé ; les activités ne partent qu'après validation humaine.
      *Pourquoi* : huit générations lancées sur un scénario faux, c'est huit minutes perdues
      et une confiance entamée.
- [x] **D7 — Génération en SÉRIE, jamais en parallèle.** Deux requêtes en vol au maximum.
      *Pourquoi* : le backend ILaaS est mutualisé ; trois appels rapprochés fabriquent des
      replis en cascade qu'on prendrait pour un défaut du module (cf. piège 5 du `CLAUDE.md`).
- [x] **D8 — Module 100 % autonome**, sur le modèle de Caramelia : un `<link>`, un appel
      dans `main.js`, tout préfixé `.pc-` et `js/parcours/`. Aucun sélecteur de
      l'application principale n'est ciblé ; le couplage tient dans
      `js/parcours/config.js:caramelSelectors`.
- [x] **D11 — Deux voies pour obtenir un plan : avec l'IA, ou sans.**
      « Composer le plan » interroge le modèle et adapte le modèle au sujet (~40 s).
      « Partir du modèle » fabrique le squelette LOCALEMENT depuis la trame — mesuré à
      **46 ms**, aucun appel réseau — et l'enseignant remplit ; l'IA n'intervient plus
      qu'à la fabrication des contenus.
      *Pourquoi* : quelqu'un qui sait déjà ce qu'il veut n'a aucune raison d'attendre
      quarante secondes qu'une IA lui propose ce qu'il a déjà en tête. Et cela donne au
      module un chemin qui fonctionne même quand le service d'IA est en panne.
- [x] **D12 — Le plan porte son origine, et bascule en « personnalisé » à la première
      retouche.** Bandeau sous le titre : « Modèle "…" », « Proposé par l'IA », puis
      « Parcours personnalisé » dès qu'on touche à quoi que ce soit.
      *Pourquoi* : une étiquette qui continue d'annoncer un modèle qu'on a réécrit ment.
- [x] **D13 — Le texte occupe la largeur qu'on lui donne.** Colonne portée de 880 à
      1120 px, plafonds `max-width: …ch` retirés des paragraphes, grille des trames à
      trois colonnes au-delà de 1060 px.
      *Pourquoi* : des paragraphes à mi-largeur dans une colonne déjà étroite donnaient
      un atelier qui flottait au milieu d'un grand vide. Les deux seuls plafonds restants
      sont une troncature de nom de fichier et un texte de chargement centré.
- [x] **D14 — L'aperçu de structure remplace la barre de rythme.** Chaque carte de trame
      affiche son déroulé réel : étape par étape, le palier et les types d'activité
      suggérés.
      *Pourquoi* : une description de deux lignes ne dit pas ce qu'un modèle contient. Et
      comme les noms de module et de palier sont déjà traduits, l'aperçu n'a coûté
      **aucune clé de traduction supplémentaire**.
- [x] **D9 — Le constructeur de cours est porté DANS Caramel** (décidé le 3 sept. 2026).
      *Le point de départ était mal posé.* Caramel exporte déjà du `.mbz` — mais toujours
      avec **exactement une activité et une section** : un seul `<activity>` dans
      `<activities>`, des marqueurs `{{MODULE_ID}}` / `{{SECTION_ID}}` au singulier, un
      seul dossier `activities/<mod>_<id>/`. Ce qui manque, ce n'est pas « le mbz », c'est
      le **cours multi-activités** : N activités, M sections, carnet de notes et
      inscriptions au niveau du cours.
      *Pourquoi porter plutôt que passer par La Sucrerie* : faire transiter l'enseignant
      par une seconde plateforme pour obtenir SON fichier casse la promesse « sans compte,
      sans installation » sur une fonction centrale, et rend le parcours dépendant d'un
      second service en ligne. La Sucrerie sert à *partager* des activités, pas à être un
      passage obligé.
      *Et le portage est bien moins coûteux qu'annoncé*, vérification faite :
      `mbz-course-builder.js` (1848 lignes, 38 exports) n'a **aucun import** — son en-tête
      dit « fonctions PURES et testables, aucune dépendance `window` ». La contrainte du
      piège 7 (ne pas importer un helper qui n'existe que d'un côté) est donc satisfaite
      **par construction**. Mieux : son entrée, ce sont des `.mbz` mono-activité, c'est
      exactement ce que Caramel produit, et son propre commentaire le présente comme « une
      généralisation du backup `topics` mono-activité **de Caramel** ». Il est né de notre
      code ; il rentre à la maison.
- [x] **D15 — Une étape du plan = une section de cours ; la section 0 reste vide.**
      Les étapes sont numérotées à partir de **1**.
      *Pourquoi* : la section 0 d'un cours au format `topics` est la zone « Généralités »,
      affichée en tête de page et sans titre. Y verser la première étape la ferait
      disparaître en tant qu'étape. Moodle exige cette section 0 de toute façon — le
      constructeur la crée quoi qu'il arrive.
- [x] **D16 — La mise en forme Moodle (JSON → placeholders de processeur) est factorisée
      dans `js/moodle/mono-activity-files.js`.**
      *Pourquoi* : elle existait déjà en DEUX exemplaires — la génération
      (`moodle-creator.js:handleXCreation`) et la ré-génération après édition
      (`notifications.js:regenerateMBZFile`, dont chaque `case` porte le commentaire
      « identique à handleXCreation »). Le parcours en aurait fait un troisième. Le chemin
      d'édition délègue désormais au module partagé, que le parcours consomme lui aussi :
      l'éditeur et le parcours ne peuvent plus produire deux Livres différents à partir du
      même JSON. Le chemin de GÉNÉRATION n'a pas été touché — hors périmètre, et c'est le
      plus emprunté du produit.
- [x] **D17 — L'identité de l'hôte compte CINQ valeurs, pas quatre, et l'écriture de
      l'archive est injectable.**
      Le relevé du lot 1e en annonçait quatre ; `moodle_backup.log` en était une cinquième
      (« Parcours généré par Sucrerie »). Et `buildMbzFromExtracted` importait
      `./mbz-parser.js`, qui n'existe pas côté Caramel : l'écriture tar+gzip est passée en
      paramètre `ecrireArchive` (`createMbz` ici, `buildMbz` là-bas), avec la valeur
      Sucrerie par défaut.
      *Pourquoi* : sans cela le fichier partagé aurait cessé d'être chargeable dans Caramel,
      ou aurait menti sur son origine dans un cinquième endroit.
- [x] **D18 — Une seule requête en vol, pas deux.** D7 plafonne à deux ; la file n'en met
      qu'une.
      *Pourquoi* : le gain de temps d'un second appel simultané est marginal (les activités
      d'un parcours sont courtes) alors que le coût d'une saturation est une cascade de
      replis de modèle INVISIBLE côté client — on la prendrait pour un défaut de Caramel et
      on chercherait des heures dans les prompts. Le banc horodate chaque appel et refuse
      le moindre recouvrement : un futur `Promise.all` bien intentionné le fait virer au
      rouge.
- [x] **D19 — Le nombre d'éléments d'une activité se déduit de sa DURÉE, pas d'un réglage.**
      Environ un élément par tranche de deux minutes, borné par le palier (découverte 3-6,
      entraînement 4-8, transfert 3-6).
      *Pourquoi* : un compte d'items dans le tableau de bord, c'est un réglage de plus à
      comprendre pour une information que la durée porte déjà. Et le palier empêche
      l'absurde : un transfert de vingt minutes n'a pas vingt questions, il en a peu et de
      longues.
- [x] **D20 — Les modules qui réclament un média sont HORS de la palette du parcours (décision historique, remplacée par D60)** :
      Vidéo interactive, Image interactive, et les deux « Trouve la zone ».
      *Pourquoi* : ils attendent une URL de vidéo ou une image de fond que l'atelier n'a
      pas et ne peut pas inventer. Les proposer, c'est promettre une activité qui restera
      vide. Le filtre est dans `activity-router.js`, sur les drapeaux `requiresVideoUrl` /
      `requiresBackgroundImage` de `definitions.js` — donc automatiquement juste pour tout
      module futur qui les porterait.
- [x] **D21 — Le scénario emporte les CONTENUS, pas le contexte.**
      *Pourquoi* : un scénario sans ses contenus obligerait à tout refabriquer à la
      réouverture, c'est-à-dire à repayer chaque appel au modèle pour retrouver ce qu'on
      avait déjà. À l'inverse le contexte (qui, quoi, niveau, corpus) est relu en direct
      sur la page d'accueil (D2) : le figer dans un fichier le ferait mentir, et le corpus
      appartient au poste de l'enseignant.
- [x] **D22 — Les modules qui n'existent que DANS un cours ont leur propre registre**,
      `js/parcours/modules-parcours.js`, à côté de `core/definitions.js`.
      *Pourquoi* : `definitions.js` répertorie ce que Caramel sait produire en fichier
      téléchargeable — une tuile, un prompt, un éditeur, un export. Un forum n'entre dans
      aucune de ces cases : personne ne télécharge un forum tout seul, il n'a de sens qu'entre
      deux activités. Lui fabriquer une tuile serait ajouter du bruit sur la page d'accueil
      pour un usage qui n'existe pas. Ce n'est donc PAS un doublon de `definitions.js` : c'est
      un autre ensemble, pour un autre usage. Le jour où l'un de ces modules deviendrait une
      activité autonome, il déménagerait — et disparaîtrait d'ici.
- [x] **D23 — Le contenu d'un module n'entre dans un parcours que s'il est de la
      CONFIGURATION d'activité.** Tout ce qui vit dans une table de données utilisateur est
      ignoré par le restore (`userinfo = 0`), et `userinfo = 0` est la valeur juste pour un
      backup d'enseignant.
      *Pourquoi* : c'est la leçon du Glossaire, généralisée avant de refaire la même erreur.
      Elle commande le choix des trois premiers modules ET la forme qu'ils prennent — un
      forum est livré avec sa CONSIGNE (`intro`, de la configuration) et jamais avec un
      premier message (une discussion, donc une donnée utilisateur, qui disparaîtrait).
      Mieux vaut une consigne qui arrive qu'une amorce qui s'évapore.
      | Restauré | Perdu |
      |---|---|
      | `label.intro`, `forum.intro`, `choice.intro` + ses `options` | discussions d'un forum, entrées d'un glossaire, fiches d'une base, pages d'un wiki |
- [x] **D24 — Les trois modules de parcours sont validés par l'aller-retour, pas par un
      banc.** `label`, `forum` et `choice` reviennent intacts d'Éléa ET de Magistère (§ 10).
      *Pourquoi* : leur XML est le seul du parcours écrit d'après le format de sauvegarde
      Moodle plutôt que relevé sur un export authentique — un banc n'aurait fait que vérifier
      qu'on écrit bien ce qu'on a décidé d'écrire. **Tout module ajouté à la palette par la
      suite passe par la même épreuve avant d'être annoncé**, et la sonde est l'endroit où on
      l'ajoute. Corollaire appris au passage : Moodle comble de lui-même les champs qu'un
      backup ne déclare pas, donc un XML minimal et juste suffit — inutile de viser
      l'exhaustivité d'un export réel.
- [x] **D25 — Un XML de module se RELÈVE sur un export authentique ; on ne le
      devine que faute de mieux.** `collabwordcloud` (Nuage de mots) et
      `stickynotes` (Mur de post-it) sont recopiés champ par champ sur un export
      réel de Magistère (Moodle 5.1.5, 4 sept. 2026), et le banc compare la
      séquence de balises produite à cette référence — toute dérive casse le test.
      *Pourquoi* : `label`, `forum` et `choice` ont été écrits de mémoire et sont
      passés, mais c'était un pari, et un pari qu'on ne peut pas répéter à chaque
      module. Un export de référence coûte une demi-heure à l'enseignant et
      supprime la classe entière d'erreurs « champ oublié, activité muette ».
      **Conséquence de méthode** : avant d'ouvrir un module, demander l'export ;
      pour changer la référence, fournir un NOUVEL export, jamais une intuition.
- [x] **D26 — `platforms` n'est pas déclaré, il est CONSTATÉ.** Les modules du
      noyau Moodle (`label`, `forum`, `choice`) sont partout. Les greffons tiers
      (`collabwordcloud`, `stickynotes`, et demain `questionnaire`, `board`…) ne
      sont déclarés que sur les plateformes où on a VU la tuile dans la palette.
      *Pourquoi* : un module absent fait échouer l'import du parcours entier, et
      l'enseignant n'a aucun moyen de comprendre pourquoi — c'est le pire échec
      possible, parce qu'il arrive après la génération, une fois le travail fait.
      Le doute se tranche donc dans le sens restrictif : mieux vaut un module
      non proposé qu'un parcours qui ne s'importe pas. Les deux premiers greffons
      sont donc Magistère SEUL, en attendant d'avoir vu la palette d'Éléa.
- [x] **D27 — Le schéma de la table fait partie de la forme d'un module, au même
      titre que son XML.** Relever les champs et leur ordre ne suffit pas : il faut
      relever la LARGEUR des colonnes `char` dans le `db/install.xml` du plugin, et
      poser le plafond dans le code.
      *Pourquoi* : un export authentique montre des valeurs qui tiennent — il ne montre
      pas la limite. `stickynotes_column.title` est un `char(20)` qu'aucun XML ne
      trahit, et le dépassement ne dégrade pas l'activité : il fait échouer la
      restauration du cours entier (§ 7). Le plafond se pose à trois endroits, du plus
      utile au dernier recours : **le prompt** (le modèle écrit court d'emblée), **le
      libellé du formulaire** (l'enseignant voit la limite avant d'écrire), **la
      fabrique** (troncature au mot, pour ne jamais casser un import). D25 disait « ne
      devine pas le XML » ; D27 ajoute « ne devine pas non plus ce qu'il peut contenir ».
- [x] **D28 — Ce qui traverse un fichier partagé ne doit rien savoir du parcours.**
      Le formateur documentaire `parcours_document` ne connaît pas son module : il
      reçoit des titres, des puces et des tableaux DÉJÀ RÉDIGÉS, et se contente de les
      rendre. Tous ses voisins font l'inverse — `formatQuizSet` sait ce qu'est une
      question et puise ses en-têtes dans les clés `doc_fmt_*`.
      *Pourquoi* : `document-formatter.js` est byte-identique avec La Sucrerie, mais
      **les traductions ne voyagent pas avec un `.js`**. Une clé ajoutée ici et absente
      des douze locales de l'autre dépôt s'y afficherait BRUTE. Un formateur qui aurait
      connu le vocabulaire du parcours aurait obligé à traduire des dizaines de libellés
      dans un dépôt qui n'en produit pas. En laissant l'appelant fournir les siens —
      déjà traduits dans SA langue et SON dépôt — on obtient le même document sans une
      seule clé nouvelle là-bas (`check-shared-i18n` le confirme des deux côtés).
      **Généralisable** : chaque fois qu'un fichier partagé doit rendre quelque chose de
      propre à Caramel, lui passer la structure plutôt que lui apprendre le vocabulaire.
- [x] **D29 — La Carte de progression est la COUVERTURE du parcours, pas une carte
      du plan.** Une seule, en section 0, avec `targetsection = 666` (« Toutes les
      sections ») : elle montre toutes les étapes sur un seul chemin.
      *Pourquoi hors de `modules-parcours.js`* : ce registre décrit les modules dont
      le MODÈLE écrit le contenu et que le plan peut donc proposer. La Carte n'a rien
      à faire écrire — son seul texte est l'objectif général, déjà rédigé et déjà relu
      par les six garde-fous — et elle ne doit surtout pas entrer dans la palette : le
      modèle en poserait une par étape, et surtout il lui donnerait un titre de son
      cru, ce qui (D30) ferait échouer l'import du cours entier. Elle vit donc dans
      `js/parcours/carte-progression.js`, se règle sur l'écran du PLAN — parce qu'elle
      fait partie de la forme du parcours, pas de son emballage —, et **ne compte pas
      dans le plafond de douze activités** puisqu'elle ne consomme aucune génération.
      *D'où un écart de comptage assumé* : l'écran du plan compte douze activités, le
      message de livraison en annonce treize. Les deux disent vrai — le premier compte
      ce que l'enseignant a PLANIFIÉ, le second ce que le fichier CONTIENT. Les
      aligner obligerait l'un des deux à mentir.
      *Trois gardes, chacune avec son mode d'échec* : Éléa seul (D26) ; décochée par
      défaut tant que l'aller-retour n'a pas eu lieu (D24) — le mode d'échec de ce
      greffon n'est pas une carte laide, c'est un import perdu, et l'imposer ferait
      porter ce risque à tout le monde pour un gain d'agrément ; et **rien n'est posé
      si aucune activité n'a abouti** — une carte sans chemin n'est pas une carte.
      *Un point du plan de lot 2 est ici REVU* : `mapmodules` n'est **pas** ajouté à
      `SELF_CONTAINED_MODULES`. Ce jeu n'est consulté que par `planCollectionCourse`,
      c'est-à-dire par le chemin des `.mbz` DÉPOSÉS sur La Sucrerie, que Caramel
      n'emprunte jamais. L'y inscrire déclarerait sûr, là-bas, un cas jamais éprouvé —
      et obligerait à une propagation pour un effet nul. **Ce lot ne touche donc aucun
      fichier partagé.**
- [x] **D30 — Le contrat d'un greffon peut vivre dans la GRAMMAIRE d'un champ, pas
      seulement dans sa largeur.** Le `name` d'une carte n'est pas un titre : c'est le
      sélecteur d'image. `get_map_src()` fait `explode(' : ', $name)`, n'accepte que
      `Carte standard : <thème>` ou `Carte personnalisée : <fichier>`, et lève une
      `Exception` PHP sur tout le reste — pendant la RESTAURATION, donc en faisant
      échouer l'import du cours entier. Le nom est fabriqué depuis le catalogue, jamais
      rédigé ; le titre voulu par l'enseignant va dans `descriptionheader`.
      *Pourquoi c'est une décision et pas un détail* : D27 disait « lis le
      `db/install.xml` avant d'ouvrir un module ». Ce module a un schéma parfaitement
      large (`name` en `char(255)`) et casse quand même. **La lecture obligatoire
      s'étend donc à `lib.php` et à `backup/moodle2/restore_*_stepslib.php`** : c'est
      là que se trouvent les exceptions non rattrapées et les réécritures silencieuses,
      et aucun export authentique ne les montre.
- [x] **D31 — Ce que le greffon régénère, on ne l'écrit pas.** L'`<intro>` de la carte
      est posée VIDE.
      *Pourquoi* : `restore_mapmodules_stepslib.php:process_mapmodules()` insère
      l'enregistrement, récupère le `contextid` neuf, rappelle `get_game_source_code()`
      et met la ligne à jour — dans la même étape de restauration. La réponse à la
      dernière inconnue du module est donc « au restore », et non « au prochain
      enregistrement du formulaire ». Recopier l'intro d'un export reviendrait à
      écrire cinq URL absolues vers un site que Caramel ne connaît pas : une
      contrevérité qui ne tiendrait que par chance, pour un contenu jeté aussitôt.
      *Ce que le relevé ne pouvait pas dire* : `mapmodules.elea-reimporte.xml` décrit
      une carte « planisphère » là où `mapmodules.xml` décrit une carte « louise » —
      deux activités différentes. Le diff ne prouvait donc rien ; c'est le code qui a
      tranché. **Un aller-retour ne remplace pas la lecture du code amont, et
      réciproquement.**
- [x] **D32 — Un seul réglage : le thème. Tout le reste en découle, et son nom ne se
      traduit pas.** Le tracé, le jeu d'icônes, la taille des icônes et l'image sont
      lus dans `res/standard_maps.json` du greffon, recopié en relevé dans
      `js/parcours/cartes-standard.js` (30 thèmes sur 32).
      *Pourquoi un choix, alors que D19 se méfie des réglages* : l'image est ce que ce
      module a de plus visible, et le parcours ne porte AUCUNE information d'où la
      déduire — c'est donc un vrai choix d'enseignant, pas un paramètre de plus. Mais
      c'est le seul : demander en plus un jeu d'icônes serait le réglage de trop.
      *Pourquoi les noms de thème restent en français, non traduits* : ils sont la
      valeur que le greffon relit dans SON catalogue, et ils s'affichent tels quels
      dans le titre de l'activité (« Carte standard : paysage »). Les traduire
      mentirait sur ce que la plateforme va écrire — et ferait diverger le libellé du
      menu de la seule chaîne qui compte. Coût : **zéro clé de traduction** pour les
      trente thèmes.
      *Deux thèmes du catalogue amont sont écartés, avec leur raison* : `khan`, le seul
      à `displaymodulenames = true`, qui bascule le greffon sur un second moteur de
      rendu non éprouvé ; et `voyage_vide`, qui partage son `themeid` avec `voyage`.
      Défaut : `paysage` — une route qui serpente dans un paysage, c'est-à-dire la
      figure du parcours lui-même, et aucune discipline en particulier.
- [x] **D33 — L'ouverture progressive se pose sur la SECTION, et après l'assemblage.**
      Une étape ne s'ouvre que lorsque toutes les activités de la précédente sont
      terminées — condition écrite dans `course_sections.availabilityjson`, pas dans
      le `course_modules.availability` de chaque activité.
      *Pourquoi la section* : c'est littéralement ce que le réglage annonce (« ouvrir
      les étapes l'une après l'autre »), et une étape = une section (D15) ; la
      condition se lit donc là où l'enseignant la pense. Elle s'écrit une fois par
      étape au lieu d'une fois par activité, et le message d'indisponibilité s'affiche
      une fois au lieu d'être répété. Moodle fait respecter la restriction de section
      aux activités qu'elle contient (`\core_availability\info_section`), accès direct
      par URL compris : on ne perd aucune granularité.
      *Pourquoi après l'assemblage* : le constructeur de cours est PARTAGÉ avec La
      Sucrerie. Il assemble, il ne décide pas de pédagogie. La progression est une
      décision d'atelier ; on l'applique donc en une passe sur la carte de fichiers
      qu'il vient de rendre (`js/parcours/progression.js`), ce qui traite d'un coup les
      trois voies d'assemblage — H5P, Test, module Moodle — sans rien savoir d'aucune.
      C'est D28 appliqué à un fichier partagé qu'on ne veut pas apprendre à parler
      « parcours ».
      *Trois gardes, chacune contre un parcours qui se fermerait sur lui-même* :
      l'**étape 1 n'est jamais contrainte** (sa seule devancière serait la section 0,
      qui ne contient au mieux que la Carte de progression — laquelle ne s'achève
      JAMAIS, `completion: 0` : la condition ne serait jamais remplie et le parcours
      entier resterait clos dès sa première page) ; **rien n'est posé sous deux
      étapes** ; et une étape précédente vide ne conditionne rien.
      *Et l'étape reste VISIBLE, grisée, avec sa raison en clair* (`showc: [true,…]`,
      la forme que `op: "&"` exige — `op: "|"` prendrait un `show` booléen). Cacher
      l'étape donnerait un cours qui semble tronqué et un élève qui ignore ce qui
      l'attend : l'objet d'un parcours est justement de montrer le chemin.
      *Décochée par défaut* (D24), comme la Carte : le mode d'échec n'est pas bénin —
      une condition mal remappée verrouille une étape pour toujours, et cela ne se
      découvre qu'une fois la classe devant.
- [x] **D34 — La différenciation par le RÉSULTAT reste à concevoir, et ce n'est pas
      la même chose.** *Tranché le 30 sept. 2026 par D90 à D101 : le modèle de plan sait
      désormais dire « ces étapes sont des alternatives ».* La trame « Différenciation à trois vitesses » promet un test de
      positionnement puis trois branches selon le score. L'ouverture progressive (D33)
      ne la rend PAS opérante : elle enchaîne, elle ne bifurque pas.
      *Ce qu'il faudrait* : une condition `{"type":"grade","id":…,"min":…,"max":…}`, ce
      qui est techniquement voisin — mais surtout un MODÈLE DE PLAN qui sache dire
      « ces trois étapes sont des alternatives, pas une suite », alors qu'un plan est
      aujourd'hui une liste ordonnée. C'est un changement de modèle, pas un réglage de
      plus, et il touche l'écran du plan, la relecture didactique (le garde-fou 5
      compterait des types qui ne se suivent pas), la fiche de séquence et le
      scénario. Le faire à l'aveugle, sans avoir vu une seule condition de note
      revenir d'une plateforme, serait exactement le pari que D25 a remplacé.
      **Ordre à tenir** : l'aller-retour de D33 d'abord — il dit si Moodle remappe les
      références d'une condition —, la bifurcation ensuite.
- [x] **D35 — Le miroir classe le GESTE de l'élève, en cinq familles nommées en
      français ordinaire, et il est placé EN BAS.** Découvrir · Mémoriser ·
      S'exercer · Organiser · Produire.
      *Pourquoi ces noms-là* : c'est la règle de D4 appliquée jusqu'au bout —
      l'atelier parle la langue de la salle des profs. Emprunter une taxonomie
      établie aurait obligé à la nommer, à la défendre, et à traduire son
      vocabulaire savant en douze langues, pour un gain nul devant une classe.
      *Pourquoi le geste et non le contenu* : un module ne détermine pas le travail
      mental — un quiz peut faire réfléchir, une production peut être creuse. Ce qui
      est observable, et indépendant de ce que le modèle a écrit, c'est ce que le
      module DEMANDE DE FAIRE : cliquer la bonne réponse, retourner une carte,
      remettre en ordre, écrire un texte. La classification porte donc là-dessus, et
      un module inconnu n'est jamais rangé de force : il est compté à part et le dit.
      *Pourquoi en bas de l'écran du plan* : un miroir se regarde après avoir bâti.
      Le mettre en tête en aurait fait une consigne à satisfaire — exactement ce que
      D4 refuse. Il ferme la page, après les étapes.
      *Pourquoi des tuiles et non un graphique* : cinq nombres tenant entre 0 et 6,
      dont l'information principale est le ZÉRO. Or un zéro n'occupe aucune largeur
      dans une barre : le graphique cacherait précisément ce qu'on veut montrer. Les
      tuiles réemploient `.pc-summary`, déjà en place pour le bandeau du haut — aucun
      vocabulaire visuel nouveau (D3). Une tuile à zéro pâlit, **et** l'absence est
      écrite en toutes lettres dessous : jamais une information portée par la seule
      couleur.
      *Et il ne juge pas.* Aucune répartition idéale n'est énoncée, parce qu'il n'y
      en a pas : une séance de pure mémorisation est légitime, un projet qui ne fait
      que produire aussi. Les deux seules choses qu'il se permet sont des FAITS — ce
      qui est absent, et si une famille dépasse la moitié des activités (jamais sous
      quatre activités : reprocher un déséquilibre à un parcours de trois cartes,
      c'est lui reprocher sa brièveté).
- [x] **D36 — Le glisser-déposer se prend par la VIGNETTE, il ne concerne que les
      activités, et il ne double pas le chemin clavier.**
      *Pourquoi une poignée et non la carte entière* : rendre `.pc-carte` déplaçable
      casse la sélection de texte dans ses champs — le navigateur démarre un
      glissement au lieu de sélectionner —, or l'écran du plan sert d'abord à écrire
      des titres et des objectifs. La vignette du module, elle, n'a aucun autre
      usage : elle est décorative, donc libre. Elle prend `cursor: grab` et l'intitulé
      « Glisser pour déplacer cette activité » ; la carte entière suit le pointeur
      (`setDragImage`), sans quoi on croirait déplacer l'icône.
      *Pourquoi les activités seulement, et pas les étapes* : c'est là que les flèches
      coûtent cher (faire descendre une carte de l'étape 1 à l'étape 3 demande
      plusieurs clics), alors qu'une étape se déplace en un clic et qu'elles sont peu
      nombreuses. Imbriquer deux systèmes de glissement dans une même liste
      multiplierait les modes d'échec pour une commodité.
      *Pourquoi la poignée reste HORS tabulation* : les quatre boutons de la carte ne
      bougent pas d'un pixel — ils sont le chemin accessible (clavier, lecteur
      d'écran, tactile, où le glisser-déposer HTML5 ne fonctionne pas). Exposer aux
      technologies d'assistance un second chemin, moins bon que celui qui existe
      déjà, ne rend service à personne. « En surcouche des flèches, jamais à leur
      place » se lit donc aussi dans l'arbre d'accessibilité.
      *Une garde, contre un faux positif* : reposer une carte à l'endroit où on l'a
      prise ne déclenche RIEN — sans quoi un glissement sans effet ferait basculer le
      plan en « personnalisé » (D12) alors que rien n'a bougé.
- [x] **D37 — Une trame ne nomme QUE des modules que le parcours sait poser, et le
      repli se voit sur les deux chemins.** Deux défauts jumeaux, trouvés le même
      jour par le même contrôle.
      *Le premier est un mensonge de contenu* : sept trames sur dix-sept nommaient un
      module que **D20 exclut** de la palette — Vidéo interactive, Image interactive,
      « Trouve la zone » —, parce qu'ils réclament une vidéo ou une image de fond que
      l'atelier n'a pas. L'aperçu de structure (D14) les affichait pourtant sur la
      carte de la trame : l'enseignant choisissait « Découverte guidée » en lisant
      « Vidéo interactive », et recevait autre chose. Les trames sont NOTRE contenu :
      une trame incompatible avec D20 est un défaut de la trame, pas une fatalité.
      Les sept sont corrigées, à structure et palier constants :

      | Trame | Remplacé | Par | Pourquoi ce module-là |
      |---|---|---|---|
      | `decouverte` | Vidéo interactive | Présentation de cours | même rôle de support à parcourir |
      | `inversee` | Vidéo interactive | Présentation de cours | la capsule du travail à la maison, en diaporama |
      | `oeuvre` | Trouve la zone | Glisser-déposer | cliquer un détail → placer des étiquettes : même observation dirigée |
      | `investigation` | Image interactive | Livre | la scène à explorer devient le dossier documentaire |
      | `emi` | Image interactive | Présentation de cours | le document à décortiquer, écran par écran |
      | `langue` | Vidéo interactive | Choix unique en série | la compréhension devient une série de questions rapides |
      | `evasion` | Image interactive · Trouve la zone | Mots mêlés · Glisser-déposer | des énigmes sans image à fournir |

      **Ce sont des choix pédagogiques, pas techniques** : ils se discutent, et se
      changent en une ligne de `templates.js`.
      *Le second est un mensonge de code* : `planDepuisTrame()` écrivait
      `moduleReplie: false` EN DUR. La voie « partir du modèle » (D11) substituait donc
      en silence là où la voie IA marquait la carte — deux chemins, deux comportements,
      pour la même situation. C'est ce qui a permis au premier défaut de vivre sans se
      voir. Corrigé : le drapeau vient du routeur, comme sur l'autre chemin.
      *Le garde-fou* : le banc de l'atelier passe les 17 trames au routeur pour les
      TROIS plateformes et exige zéro repli. Un module retiré de la palette, ou une
      trame qui nommerait un greffon propre à une plateforme, casse le banc avant
      d'atteindre un enseignant.
- [x] ~~**D38 — Le point d'entrée est dans la barre d'en-tête, en première position**~~ —
      **remplacée par D46 le 7 sept. 2026** (le commutateur, au centre de la barre). Gardée
      pour mémoire, ses mesures restent vraies.
      (décidé par Emmanuel le 6 sept. 2026, remplace D1). Un bouton « Parcours » frère de
      Tchap, Sucrerie et Tutoriel — leur classe `help-btn`, lue dans `config.js`, pour être
      exactement l'un d'eux —, l'icône en caramel (la marque d'entrée, D3), le point de
      reprise en bleu à la place de la pastille de Notifications. Caramelia reste seule en
      bas à droite : le bouton flottant retrouve son sens d'assistant.
      *Pourquoi la barre* : c'est là que Caramel range ses autres portes, et Tutoriel y
      ouvre déjà une surcouche comme l'atelier. Aucune couche verticale de plus.
      *Ce que six entrées ont coûté, mesuré à dix largeurs* : la barre débordait DÉJÀ
      à 500 et 360 px avec cinq ; à six, elle débordait aussi entre 540 et 600 (libellés)
      et sous 390 (icônes). Deux règles dans `css/base/style.css` — les libellés
      s'effacent sous 600 px au lieu de 480, le mot « Caramel » s'efface sous 480 (le logo
      EST la marque ; le titre reste dans l'arbre d'accessibilité) — et tout tient de
      360 px en haut. Seul 320 px déborde encore, de 28 px contre 51 avant.
      *Le point de reprise est un pseudo-élément, pas un `<span>`* : sous 600 px Caramel
      masque tous les `span` des boutons d'en-tête, et un point en `<span>` s'effacerait
      avec les libellés.
      *Sans barre d'en-tête* (une page qui n'en aurait pas), le module ne pose rien et le
      dit dans le journal : un bouton d'en-tête posé ailleurs serait un objet sans place.
- [x] **D39 — L'atelier vit DANS la page, à la place des tuiles** (décidé par Emmanuel le
      6 sept. 2026, quelques heures après D38 : « je déteste l'intégration » — celle de la
      fenêtre plein écran, pas celle du bouton). Le bouton « Parcours » de la barre est une
      **bascule** : cliqué, il efface la barre de filtres et la grille des tuiles et insère
      l'atelier à leur place, dans `#main-content`, à la largeur du formulaire ; cliqué à
      nouveau (ou « Revenir aux activités » dans la tête de l'atelier), il rend la page
      exactement comme avant. **L'en-tête du site ne change pas, le formulaire de
      l'accueil — qui, quoi, Rapide/Avancé, pièces jointes — reste en place et continue
      de vivre.** Plus de coquille plein écran, plus de piège de focus, plus d'`Échap`,
      plus de verrou de défilement : la page défile, comme avec les tuiles.
      *Pourquoi* : l'atelier n'est pas une autre application posée par-dessus Caramel,
      c'est une autre façon de finir la même phrase — « je suis prof de 3ᵉ, je veux
      travailler la traite atlantique » — et le formulaire qui la commence doit rester
      sous les yeux. La fenêtre plein écran remplaçait l'en-tête par le sien, cachait le
      formulaire dont elle dépendait, et obligeait à un bloc « Ce que Caramel va
      utiliser » pour redire ce qu'on ne voyait plus.
      *Trois conséquences, toutes des simplifications* :
      (1) **Le récapitulatif du contexte disparaît** (D2 amendée) : neuf clés et un bloc
      de moins ; taper le sujet au-dessus débloque l'action en bas sans rien rouvrir ;
      une pièce jointe déposée après coup met à jour la note des documents joints
      (`MutationObserver` sur la zone d'étiquettes, `input` sur les champs).
      (2) **La barre d'action rejoint le flux**, au pied de l'écran, là où l'enseignant
      arrive en lisant — ni fixée au bas de la fenêtre ni collante. « Le bas était bizarre
      et je ne cliquais pas sur le bouton » (Emmanuel) : la barre fixée se superposait
      au contenu et à la bulle de Caramelia. Mesuré : en bas de page, l'action primaire
      est à plus de 80 px au-dessus de la bulle, aux trois largeurs (1280, 1100, 390).
      (3) **La fabrication démarre d'elle-même** en arrivant de « Fabriquer le parcours
      (@n activités) » — c'est CE clic, qui nomme le coût, qui autorise la dépense
      (cf. la règle « action coûteuse = validation explicite »). Revenir sur l'écran
      de fabrication par un autre chemin (langue changée, reprise) ne relance rien ;
      « Lancer / Reprendre la fabrication » reste pour ces cas-là. Contre-épreuve : le
      banc désarme le démarrage et vire au rouge.
      *Le panneau d'attente de la composition* n'est plus un voile absolu par-dessus
      l'écran (sur une page de deux mille pixels il aurait centré son anneau hors de la
      fenêtre) : il PREND LA PLACE du cadrage le temps de l'appel, la barre d'action et
      son bouton d'arrêt juste dessous.
      *Piège trouvé en mesurant* : `hidden` ne suffit pas à effacer la grille — la règle
      `.activity-grid { display: grid }` de Caramel l'emporte sur le style de l'attribut,
      et la grille restait affichée SOUS l'atelier (page de 3 800 px au lieu de 2 400).
      Le module pose un `display: none` en ligne et rend à chaque bloc celui qu'il avait.
      Le banc vérifie le `display` CALCULÉ, pas l'attribut.
      *Ce que le module emprunte à la page* : un hôte (`#main-content`) et deux blocs à
      effacer (`.filter-bar`, `.activity-grid`), lus dans `config.js` comme les autres
      points de couplage. Aucune règle CSS de l'atelier ne cible un sélecteur de Caramel.
      *Ce que le bouton d'en-tête dit* : `aria-expanded` + `aria-controls` (une
      région qu'on déplie, pas un dialogue), un nom accessible stable, un fond doux de la
      couleur de sa marque quand l'atelier est ouvert. À l'ouverture, le focus va sur le
      titre de l'atelier (annoncé, hors tabulation) ; à la fermeture, il revient au
      bouton.
- [x] **D40 — Le fil des étapes est la navigation** (6 sept. 2026, sur le retour
      d'Emmanuel : « comment revenir à l'étape précédente, on ne peut pas »). Dans la page,
      un écran est long, et le bouton « Retour » au pied de l'atelier est hors de vue
      pendant qu'on lit le haut. Le fil « 1 Cadrage · 2 Plan · 3 Fabrication · 4 Livraison »
      devient cliquable pour tout écran **déjà atteint** depuis l'ouverture, aux réserves
      près de ce qui y aurait un sens (pas de fabrication sans plan valide, pas de
      livraison sans activité prête) et de l'état (rien ne bouge pendant un appel de plan
      ni une fabrication en marche : la barre porte alors un bouton d'arrêt, c'est lui
      qu'on attend). Les écrans à venir restent inertes — on y arrive par l'action
      primaire, qui seule autorise la dépense (D39). Sous 900 px, les libellés
      s'effacent et les quatre pastilles restent, cliquables : elles remplacent le
      compteur « Étape 2 sur 4 », qui ne menait nulle part. « Retour » reste au pied, pour
      qui finit de lire en bas.
      *Contre-épreuve* : le banc clique « 1 » depuis le plan, revient par « 2 », vérifie
      que « 3 » et « 4 » sont inertes, que le fil se gèle pendant la fabrication et se
      rouvre après.
- [x] **D41 — Trois façons d'agir sur le plan, toutes gardées, et NOMMÉES** (6 sept.
      2026, Emmanuel s'en remettant à la meilleure accessibilité). Les flèches sont le
      chemin du clavier et du lecteur d'écran ; le glisser par la vignette, celui de la
      souris ; « ajouter » ne réordonne pas, il crée. Elles ne sont pas redondantes, et en
      retirer une retirerait un public. Ce que l'accessibilité demande, ce n'est pas moins
      de chemins mais des chemins DITS : un titre et une phrase en tête des étapes les
      nomment, cadenas compris — l'icône d'un cadenas ne dit à personne « je fournirai le
      contenu moi-même ». Le palier (Découverte / Entraînement / Transfert), pastille sans
      légende, reçoit son explication au survol et en nom accessible, sur le plan comme
      dans l'aperçu des trames.
- [x] **D42 — Le thème de la Carte se choisit en VOYANT les cartes** (6 sept. 2026, sur
      demande d'Emmanuel). Case cochée, une galerie horizontale des trente visuels
      remplace le menu déroulant ; case décochée, rien. Les vignettes sont celles du
      greffon lui-même (`pix/maps/`, GPL v2), réduites à 360 px de large — 300 Ko à trente,
      dans `assets/images/parcours/cartes/` — et créditées dans les mentions légales
      (`legal_library_mapmodules_maps`, première entrée de `dossier` dans
      `ASSETS_A_MENTION` : le contrôle Node inventorie désormais un dossier entier).
      Les noms restent ceux du catalogue, une majuscule en tête et rien de plus : c'est
      ce nom, à la lettre, que la plateforme écrira dans le titre de l'activité, et le
      maquiller mentirait. Galerie = groupe radio à un seul arrêt de tabulation, flèches
      pour circuler, coche et bordure bleues du cadrage pour dire le choix.
- [x] **D43 — Une durée s'écrit en heures et minutes, et une estimation dit d'où elle
      vient** (6 sept. 2026 : « 3,4 h » dans la relecture). `duree.js` est la seule
      écriture — « 45 min », « 1 h », « 3 h 25 » — partagée par le bandeau du plan, la
      livraison, la fiche de séquence (qui perd son doublon) et la relecture. Le garde-fou,
      module Node pur qui n'importe rien, livre les MINUTES ; l'écran les écrit. Partout où
      la durée totale s'affiche, une infobulle (« i » focalisable, nom accessible) dit
      l'estimation en une phrase : la somme des durées posées carte par carte, sans les
      consignes ni les transitions.
- [x] **D44 — Les colonnes des cartes sont FIXES** (6 sept. 2026 : « il faut une structure
      carrée, propre, claire »). Le menu de type, la durée et le palier ont chacun leur
      largeur, la même sur toutes les cartes ; une largeur « au contenu » (Glossaire,
      Texte à trous, Quiz QCM) faisait onduler la colonne. Et une phrase commence par une
      majuscule : `normaliserPlan` capitalise titres, objectifs et consignes, sans toucher
      aux écritures sans casse.
- [x] ~~**D45 — Le bouton d'en-tête est un commutateur qui dit où il mène**~~ — **remplacée
      par D46 le jour même** ; ce qu'elle disait de la fermeture (remonter en haut) et de la
      tête de l'atelier (ni cartouche ni lien) reste en vigueur. (7 sept. 2026,
      sur trois retours d'Emmanuel). « Parcours » avec sa route quand la page montre les
      tuiles ; **« Activités » avec une grille**, sur fond doux, quand l'atelier est ouvert —
      le motif Lecture/Pause : le libellé nomme l'action, pas l'état, donc plus
      d'`aria-expanded` par-dessus (il contredirait un libellé qui change) ni d'`aria-label`
      (le libellé visible est le nom accessible). Ouvrir fait descendre la page jusqu'à
      l'atelier ; **fermer la ramène en haut**, aux tuiles — sinon on restait devant le vide
      laissé par l'atelier. La tête de l'atelier perd son cartouche caramel (« ça fait trop
      frontière ») et son lien de sortie : la barre d'application est collante, le bouton
      « Activités » y reste sous les yeux à toute hauteur de page, et deux commandes pour
      un même geste en faisaient une de trop. Il reste le nom et le fil des étapes.
      Clés : `parcours_entree_label_ouvert` et `parcours_entree_title_ouvert` (12 locales) ;
      `parcours_quitter` retirée.
- [x] **D46 — Un commutateur « Une activité | Un parcours » au centre de la barre
      d'application** (7 sept. 2026, décidé par Emmanuel sur maquette cliquable ; remplace
      D38 et D45 ; emplacement et couleurs remplacés par D63). Une pilule à deux boutons-radio, entre la marque et les portes de
      droite, dans le langage des pilules de filtre (rayon 20, fond gris, segment allumé en
      bleu plein `#0055B3`). Elle pose la question que Caramel pose vraiment — qu'est-ce
      que vous créez ? — et montre les deux réponses, l'une allumée.
      *Pourquoi un commutateur* : le bouton qui changeait de libellé (D45) demandait d'avoir
      cliqué une fois pour comprendre ; ici l'autre option est sous les yeux. Et un mode de
      toute la page n'avait rien à faire parmi les portes de droite (Tchap, Sucrerie,
      Tutoriel), qui sont AUTOUR du produit.
      *Pourquoi la barre, et pas la rangée des filtres* : la barre est collante — le retour
      aux tuiles est à un clic depuis n'importe quelle hauteur d'un plan de douze
      activités — et elle n'ajoute aucune couche verticale. La rangée des filtres, elle,
      débordait dès 1280 px (les pilules de plateforme passaient à la ligne) et
      disparaissait dès qu'on descendait. Maquettes des deux dans le journal du jour.
      *Accessibilité* : `role="radiogroup"` nommé (« Que voulez-vous créer ? »), un seul
      arrêt de tabulation (le segment allumé), flèches pour passer à l'autre ET choisir,
      recliquer le segment allumé ne fait rien. Le point de reprise vit sur « Un parcours »,
      caché quand il est allumé. La route en caramel sur le segment éteint est la marque
      d'entrée (D3) ; allumé, tout est bleu.
      *Mesuré à treize largeurs* (1440 → 320) : à 768 px le sous-titre de Caramel est
      encore affiché et le commutateur à libellés débordait de 62 px — les libellés
      s'effacent donc sous 900 px, pas 600. Sous 480, la barre de Caramel resserre ses
      marges (`padding: 5px 12px`, `gap: 8px` à gauche) ; sous 400, ses cinq portes
      passent à 36 px de large (toujours 44 de haut) et le commutateur se resserre
      encore. Tout tient de **360 px** en haut ; 320 px déborde de 39 px, comme avant
      (28 avec le bouton D38, 51 avec la pastille D1).
      *Le module reste autonome* : c'est lui qui pose le commutateur (`config.js` donne la
      barre et le bloc après lequel il se pose) ; sans lui, la barre est celle d'avant.
      Clés : `parcours_commutateur_activite/parcours/aria/activite_title` ;
      `parcours_entree_label`, `_label_ouvert`, `_title_ouvert` retirées.
- [x] **D47 — Relire et retoucher au même endroit, depuis chaque écran.**
      Les cartes déjà remplies proposent « Modifier » et « Aperçu » dans le plan,
      puis dans la fabrication. « Relire le parcours » ouvre la même fenêtre depuis
      le plan ou la livraison ; précédent/suivant suivent l'ordre des activités.
      Les activités uniques gardent leur éditeur et leurs lecteurs habituels ; les
      modules propres au parcours ont un formulaire dont les consignes reprennent
      la barre de mise en forme de Caramel. Enregistrer persiste immédiatement et
      montre le résultat. Fermer protège les retouches non enregistrées et restitue
      le focus. Le lecteur H5P conserve le clavier dans la fenêtre, y compris Échap.
      Depuis un plan dont les contenus sont prêts, un clic rejoint directement la
      livraison, sans traverser un écran de fabrication qui n'a plus rien à faire.
      *Piège corrigé* : le CSS de l'éditeur commun masque son pied parce que la
      notification d'activité fournit ses propres boutons. L'ancien parcours n'en
      fournissait pas : son bouton Enregistrer pouvait être invisible.
- [x] **D48 — Reprendre et sauvegarder un scénario sans terminer un parcours.**
      « Reprendre un scénario » est accessible dès le cadrage ; exporter le scénario
      l'est dès le plan. Les commandes restent au même endroit. Le tutoriel ouvre
      directement le chapitre parcours. Une importation invalide laisse le travail
      intact ; un remplacement valide demande confirmation. Les versions inconnues,
      contenus incompatibles avec la plateforme et fichiers dépassant les limites
      sont refusés ; les identifiants doublons et durées invalides sont normalisés.
      D21 reste inchangée : le scénario contient les activités, jamais le corpus.
      Une note distingue conservation dans l'onglet, stockage limité au plan et
      stockage indisponible : sauvegarder sur disque est un geste explicite.
- [x] **D49 — Une reprise ne détruit pas ce qui a déjà été relu.**
      Une régénération ratée conserve le contenu précédent ; une réponse annulée
      arrivée tardivement ne le remplace pas. Deux files successives ne peuvent pas
      envoyer deux requêtes en parallèle. Le cadenas réserve aussi une carte vide
      au remplissage manuel. La livraison partielle reste accessible quand seules
      certaines activités sont prêtes. Changer de type retire le contenu incompatible,
      avec une annulation qui restaure type et contenu. La dernière suppression de
      carte ou d'étape s'annule également. Durées, objectif général, notions pivots,
      consignes et paliers se retouchent directement dans le plan.
- [x] **D50 — Tutoriel et connaissances préparés dans les douze langues.**
      Chapitre du site, tutoriels embarqués de Caramelia et trois fiches RAG par
      langue suivent le même périmètre. Les fiches vivent dans le dépôt `rag` avec
      une source française et des questions de contrôle. Un banc protège leur
      couverture et les libellés de l'interface. Après activation du workflow et
      demande d'Emmanuel le 10 septembre, les 36 documents ont été ingérés dans
      `caramelia` (collection 55) : 72 chunks relus avec texte et métadonnées conformes,
      dont les trois documents bretons. Une recherche en breton retrouve la fiche
      de relecture bretonne en premier résultat. Rapports dans `rag/caramelia/reports/`.
      Aucun site publié. D33/D34 et les réserves de validation de la Carte restent
      en vigueur.
- [x] **D51 — Caramelia donne accès à l’atelier, sans pipeline parallèle.**
      À la demande d’Emmanuel le 10 septembre, le menu propose « Créer un parcours »
      ou « Reprendre mon parcours ». Un clic conserve champs, sources et brouillon,
      ferme le chat et rejoint le cadrage ou le plan existant. La génération reste
      validée dans l’atelier. Accès aussi proposé après une réponse d’aide ou un
      échec du chatbot. Le guidage activité, les réponses tardives, le double envoi
      et les changements de langue sont couverts par un banc navigateur dédié.
      Code et documentation en 12 langues restent locaux ; Emmanuel a coupé
      l’ingestion. Les 24 fiches RAG modifiées sont à publier avec cette version,
      aucun changement de n8n, de Sucrerie ni de Caramel en production.
- [x] **D52 — Le cadrage prolonge le formulaire, sans saut à l’ouverture.**
      Retour d’Emmanuel sur la capture du 10 septembre : ouvrir « Un parcours »
      avec des champs vides envoyait précisément ces champs hors de vue. Le premier
      cadrage garde désormais la position et le focus sur le commutateur, y compris
      depuis Caramelia. Un plan déjà commencé garde son accès direct ; revenir
      explicitement au cadrage ramène en haut pour retrouver aussi le formulaire.
      Cette décision remplace le défilement systématique à l’ouverture de D45/D46.
      Première version visuelle, remplacée par D53 : le cadrage rejoint la surface
      blanche du formulaire (classe `.pc-formulaire-lie`
      temporaire), sans déplacer ses champs ni ses onglets. Un seul bandeau regroupe
      les étapes, « Reprendre un scénario » et « Tutoriel ». Le titre « Votre parcours »
      et une phrase remplacent le long préambule ; les descriptions des choix portent
      l’explication, sans un second paragraphe par rubrique. Deux textes raccourcis
      dans les 12 langues. Dès le plan ou le retour en mode activité, le formulaire
      retrouve son style habituel ; aucun changement dans les styles partagés.
- [x] **D53 — Garder le cadre naturel du formulaire.**
      Emmanuel préfère conserver la séparation entre saisie et cadrage : la fusion
      de D52 supprimait l’ombre et les arrondis qui font ressortir l’onglet inactif
      Rapide/Avancé. Le formulaire conserve désormais tout son CSS habituel, même
      pendant le cadrage. La classe de fusion et sa gestion JavaScript sont retirées.
      Le cadrage garde son contenu compact, dans un cadre blanc indépendant avec
      ses quatre angles arrondis, après la marge habituelle de 30 px du formulaire.
      L’absence de défilement initial et les textes courts de D52 sont conservés.
- [x] **D54 — Le vocabulaire des modalités suit la plateforme.**
      Dans le cadrage, Éléa conserve « En classe » et « Vos élèves sont devant
      vous ». Magistère affiche « En présence » et « Vos stagiaires sont devant
      vous » ; Moodle, « En présence » et « Vos étudiants sont devant vous ».
      Pour ces deux plateformes, la modalité mixte parle de présence et de
      distance, sans référence à la maison. Les libellés changent dès le clic,
      sans recréer les boutons ni modifier la modalité sélectionnée, les champs
      ou le focus. Ils suivent aussi la langue et la reprise du brouillon.
      Quatre nouvelles clés dans les douze locales, breton compris. Le public
      pédagogique reste celui saisi dans le formulaire : ces variantes sont
      uniquement des libellés d’interface, sans modification des prompts.
      Banc atelier : **172 assertions réussies**, dont 51 nouvelles couvrant
      les plateformes, les langues et la réouverture du cadrage.
- [x] **D55 — Une continuité visuelle sur les quatre étapes.**
      Le cadre indépendant validé en D53 devient celui de tout l’atelier : même
      fond blanc, mêmes arrondis, gouttières, fil des étapes et outils de scénario.
      Le nom redondant « Atelier de parcours » reste accessible sans réapparaître
      visuellement au plan. Les blocs intérieurs ont des contours discrets plutôt
      que des ombres empilées. Les statistiques restent près du titre, au plan
      comme à la livraison ; la fabrication reprend cette même introduction.
      Le titre et l’objectif du plan s’étendent au texte et se réajustent à la
      largeur de l’écran. Le titre est désormais un textarea, éditable sur place.
      Les notions et réglages facultatifs sont regroupés dans deux rubriques
      dépliantes ; un réglage actif reste visible à la reprise. Le pied aligne
      Retour et l’action principale, puis leur aide, également visible sur mobile.
      À la livraison, téléchargement et relecture sont regroupés. Les messages
      ponctuels d’import/export s’effacent au changement d’étape.
      Banc d’harmonie : **117 assertions**, huit combinaisons de largeur/langue,
      quatre écrans ; formulaire habituel conservé et aucun débordement.
- [x] **D56 — Reprendre aussi le Glossaire sous forme de liste.**
      L’essai ILaaS réel a produit un Glossaire au format tableau accepté par son
      processeur H5P. L’archive s’assemblait, mais le scénario complet était refusé
      à la reprise : la validation introduite pendant la consolidation excluait
      tous les tableaux de contenu. Elle accepte désormais les listes pour
      `Glossary`, sans élargir les autres modules ni changer les entrées. Deux
      assertions de régression ajoutées au banc de relecture. Fichiers d’essai et
      observation du calibrage dans `tests/sonde-parcours/essai-ux-2026-09-10/`.
- [x] **D57 — L’ampleur affichée engage les trois voies de composition.**
      Les variantes de trames sont écrites dans `templates.js`, en gardant leurs
      moments pédagogiques : pas de suppression automatique des dernières activités.
      `tramesCompatibles()` et `trameParId(id, ampleur)` fournissent la même variante
      à l’aperçu, au modèle sans IA et au prompt. Toutes les combinaisons proposées
      respectent 3–4, 5–8 ou 9–12 activités. Le rituel démarre à 2 + 4 + 4 minutes.
      Les intentions internes précisent la logique de chaque trame, notamment les
      temps de la classe inversée et de la formation hybride. Elles guident l’IA
      en français ; aucun de ces textes n’est affiché dans l’interface.
- [x] **D58 — Contrôler le plan reçu, reprendre une fois, préserver le brouillon.**
      `calibrage.js` vérifie avant normalisation le nombre de cartes, les étapes
      non vides, le rythme imposé, les paliers, le catalogue de la plateforme,
      les textes nécessaires et les durées. Un écart provoque une recomposition
      ciblée, en série sur le même modèle, avec une répartition explicite. Le
      prompt ne recopie pas la structure erronée, qui incitait à la conserver.
      Après un second écart, message traduit et brouillon conservé — *remplacé par D107 :
      le plan est réparé puis retenu ; seule une réponse sans aucun plan échoue encore*. L’annulation
      reste active entre les appels. Les accents sur un palier connu sont
      normalisés sans changer son sens. Le contrôle porte sur la composition IA,
      jamais sur les retouches ou les scénarios importés par l’enseignant.
      Les nombres de notions et l’exemple JSON suivent l’ampleur. Le catalogue
      précise les gestes réellement possibles et évite de promettre des médias
      non fournis. Les messages nouveaux sont traduits dans les douze langues.
- [x] **D59 — ABC dans l’aide, sans imposer une taxonomie à l’entrée.**
      Références UCL vérifiées le 11 septembre 2026, lien dans le wiki et dans
      les douze tutoriels. Le miroir à cinq familles reste une indication des
      outils présents, pas une analyse selon les six types ABC. Le texte d’aide
      le précise, sans nouveau réglage ni jargon dans le cadrage. La description
      de différenciation ne promet plus de branches automatiques par note.
      Le contenu destiné à Caramelia est complété localement ; ingestion n8n
      toujours désactivée, sans mise à jour du corpus distant.
- [x] **D60 — Réemployer la génération individuelle avec un support par carte.**
      Demande explicite d’Emmanuel (11 septembre 2026), qui remplace D20 : proposer
      Vidéo interactive, Image interactive, Trouver la zone et Trouver les zones
      dans le parcours, avec les champs adaptés directement dans le plan et la
      fabrication. L’image est décodée par `processBackgroundImage`, puis analysée
      par `detectImageZones` dans la file séquentielle ; son nombre de zones suit
      le calibrage de la carte. La vidéo utilise `detectVideo`, `fetchTranscript`
      ou le collage manuel et `snapVideoTimestamps`. Les mêmes constructeurs de
      prompts, le healer, les processeurs, l’éditeur et les lecteurs individuels
      restent en service. Aucun modèle de remplacement ni workflow ajouté.
      Un support absent ne lance pas de génération fictive : cette carte attend,
      les autres avancent ; le bouton compte celles prêtes à démarrer. Le lien
      modifié ne réutilise jamais silencieusement une transcription collée pour
      une autre vidéo : son texte reste disponible, avec validation explicite.
      Les octets appartiennent à `carte.medias`, jamais à un registre global du
      parcours. Ils suivent le scénario, l’édition, les aperçus et le MBZ ; les
      fonds rejoignent aussi l’export documentaire. Un fond remplacé dans
      l’éditeur devient le support de la prochaine génération. Une source
      changée dans le plan conserve le contenu précédent jusqu’à régénération.
      Limites locales : 12 Mio par image entrante (pipeline existant), 20 Mio
      de médias sérialisés pour garder de la marge sous les 30 Mio du scénario.
      Si le stockage de l’onglet sature, le plan reste reprenable et l’interface
      invite à exporter pour conserver les contenus et les médias.
      Onze clés nouvelles, douze langues, tutoriels et aide Caramelia locale
      complétés. Validation : banc `sources` (43 contrôles), six générations
      ILaaS réelles, archives et lecteurs relus ; restaurations sur plateformes
      encore à effectuer par Emmanuel. Ingestion RAG et production inchangées.
- [x] **D61 — Fond personnel de la carte et champs extensibles.**
      Demande d’Emmanuel du 11 septembre 2026 : le cadre « + » concerne bien
      le **fond de la Carte de progression**, distinct des supports par activité.
      La tuile reste à côté des trente thèmes, avec aperçu du placement,
      remplacement, retrait et dépôt par glisser-déposer. Les notions et les
      consignes ajustent leur hauteur à la saisie, au dépliage et à la largeur ;
      les panneaux facultatifs n’empilent plus les contours et séparateurs.
      `processBackgroundImage` réutilise les conversions H5P existantes :
      JPEG, PNG, HEIC/HEIF (heic2any), TIFF (UTIF/pako), WebP, GIF, BMP, AVIF,
      SVG. Aucune bibliothèque ajoutée. JPEG final de 1000 px de large, proportions
      conservées ; marges pour les ratios extrêmes, sans rognage. Le tracé suit
      les dimensions finales. Six clés nouvelles dans les douze langues.
      Le fond voyage dans `plan.carte.image`, puis dans le pool du MBZ avec
      SHA-1, `files.xml` et `inforef.xml`, **après renumérotation du contexte**.
      Le constructeur partagé avec Sucrerie reste inchangé. Contrats relus dans
      le code public du greffon Éléa : nom technique exact
      `Carte personnalisée : fond-parcours.jpg`, composant `mod_mapmodules`,
      zone `maps`, itemid 0. Ces identifiants imposés ne sont pas des libellés
      d’interface à traduire. Le fond est incorporé, aucune URL externe nécessaire.
      Si le stockage sature, le repli garde le choix et le nom mais marque
      l’absence des octets ; l’export exige de joindre à nouveau l’image ou de
      choisir un thème. Un remplacement raté conserve le fond précédent ;
      une conversion terminée après un autre choix ne l’écrase pas.
      Le banc `fonds` relit les vrais formats, les pixels, le scénario et les
      fichiers du MBZ ; il vérifie les contrôles à 1440 et 390 px (FR, AR, BR).
      L’aperçu reste indicatif : **restauration réelle du fond personnel à
      vérifier sur Éléa**, comme le demande D24. La carte reste facultative.
      Tutoriels, aide Caramelia embarquée, wiki et changelog complétés.
      Workflow d’ingestion n8n arrêté ; aucun changement de production.
- [x] **D62 — Relecture harmonisée, abandon unique et exports stables.**
      Retours d’Emmanuel du 11 septembre au matin : le panneau d’aperçu/édition
      reprend les surfaces, arrondis et espacements de l’atelier, avec un cadre
      adapté à l’écran, un seul titre et une bascule Aperçu/Modifier compacte.
      Le type d’activité utilise son nom traduit ; le chemin d’import Moodle
      de l’éditeur individuel réemploie aussi `getModuleName` plutôt que
      d’afficher une clé technique telle que `elea_test`.
      L’option `onRequestCancel` délègue au parcours sa confirmation : Annuler,
      Fermer, changer d’activité ou passer à l’aperçu partagent un seul dialogue,
      sans appel à `window.confirm`. Refuser ou presser Échap conserve la saisie
      et rend le focus ; le panneau reste inerte derrière cette confirmation.
      Les messages d’export disposent d’une place réservée selon les textes
      traduits. Les boutons gardent leurs dimensions, leur libellé et leur
      opacité ; une icône et un statut annoncent le travail. Un verrou commun
      évite les téléchargements concurrents entre les sept commandes.
      Le banc `stabilite` mesure à chaque frame les positions, dimensions,
      polices et opacités pendant de vrais exports MBZ, DOCX, ODT et PDF
      (repli PDF local, réseau externe bloqué), à 1440/390 px et en FR/AR/BR.
      Il couvre aussi les annulations, l’enregistrement, le simulateur Test
      et le nom traduit dans les douze langues. Aucun nouveau texte à traduire
      ni changement dans les fichiers partagés avec Sucrerie.
- [x] **D63 — Une capsule centrée sous le formulaire, au bleu atténué.**
      Le 13 septembre 2026, Emmanuel retient la proposition visuelle de Gauthier :
      une seule capsule « Une activité | Un parcours », entre le formulaire complet
      et les filtres ou l’atelier. Elle remplace les deux boutons intégrés avec
      question visible. En Avancé, les documents restent dans le formulaire, avant
      le sélecteur ; le changement Rapide/Avancé ne déplace plus le groupe radio.
      Largeur maximale 480 px, deux segments égaux, espaces de 12 px avant/après.
      Après ajustement demandé par Emmanuel, sélection bleu grisé `#51779c`
      commune au filtre « Tout » et au sélecteur, texte blanc (contraste 4,70:1).
      Ce bleu remplace le bleu pâle initial du sélecteur et le bleu vif des filtres.
      L’effet `grayscale(40%)` / opacité 0,9 des filtres lorsque le formulaire
      est vide est retiré : ces boutons restent disponibles, et cet effet
      rendait les deux bleus différents malgré une couleur CSS commune.
      Égalité vérifiée dans l’aperçu, formulaire vide puis renseigné : même
      fond `rgb(81, 119, 156)`, filtre `none`, opacité 1. Les trois feuilles CSS
      modifiées sont versionnées dans l’URL pour renouveler le cache navigateur.
      Petite icône caramel du parcours au repos, blanche quand sélectionné.
      Les deux libellés restent visibles
      sur téléphone, avec des cibles de 44 px de haut. La question reste le nom
      accessible du groupe ; flèches, Home/End et arrêt de tabulation unique conservés.
      Seize configurations vérifiées à 1280/1127/390/320 px, en Rapide/Avancé et
      Activité/Parcours, sans débordement ; saisie conservée et clavier vérifié.
      Banc atelier : 172 PASS / 0 FAIL. Captures et mesures :
      `tests/sonde-parcours/selecteur-gauthier-2026-09-13/`. Non publié.
- [x] **D64 — Scénariser par des textes, et retrouver l'esprit de Caramel.**
      Retours d'Emmanuel du 14 septembre 2026, après une génération complète.
      **Scénarisation.** Un parcours qui enchaîne des H5P sans un mot entre eux
      n'est pas scénarisé : le plan porte désormais un `introduction` d'accueil et
      un `introduction` par étape, rédigés par le même appel que le plan, adressés
      à l'élève, relus et modifiables sur l'écran du plan (bloc « Accueil du
      parcours » en tête des étapes, paragraphe sous l'objectif de chaque étape).
      À l'assemblage, chacun devient une **étiquette** (`mod_label`) en tête de sa
      section, l'accueil en section 0 avant la Carte. Ils ne consomment aucune des
      douze places et ne changent pas le calibrage : `controlerCalibrage` ne les
      exige pas, pour ne jamais coûter une reprise de 59 s. Le prompt interdit
      désormais d'employer le « Texte de liaison » pour introduire une étape.
      *Piège corrigé au passage* : `poserProgression` mettait TOUTES les activités
      de l'étape précédente dans la condition, étiquettes comprises. Une étiquette
      ne s'achève jamais : un « Texte de liaison » posé à la main fermait déjà
      l'étape suivante pour toujours. Les `label` sont exclus de la condition.
      **Mode Guidé.** Le bouton « IA externe » ne disait rien à un enseignant ;
      l'atelier reprend l'interrupteur « Simple | Guidé » de la modale d'activité
      (mêmes clés `simple_mode` / `advanced_mode`), en tête de la rangée d'outils.
      En Guidé, « Composer le plan » ouvre la fenêtre prompt / réponse, le plan mène
      aux activités SANS lancer la file, et chaque carte porte « Obtenir le prompt ».
      En Simple, aucune commande guidée n'est affichée. Préférence d'onglet
      (`caramel_parcours_mode`), hors scénario. La fenêtre reprend la composition
      de la modale d'activité : carte d'en-tête, panneaux « 1/2 Obtenir le prompt à
      copier » et « 2/2 Coller la réponse de l'IA », encart bleu `info_prompt_copy`,
      grand bouton bleu ; valeurs recopiées dans `parcours.css`, sans cibler les
      classes de l'application (D8).
      **Compléter, pas écraser.** Une activité déjà prête (générée, collée depuis une
      autre IA, reprise d'un scénario) n'a jamais été refaite par la file ; le
      bouton le dit désormais : « Générer les activités manquantes (n) ».
      **Livraison.** Même vocabulaire que le pied de l'aperçu d'une activité : groupe
      gris « Télécharger » et bouton MBZ, bouton rose de la Sucrerie, « Relire le
      parcours » à droite, tous à 42 px ; documents en DOCX/ODT/PDF sur le même
      modèle ; marche d'import repliée.
      **Allègement.** Descriptions de plateforme ramenées à « Plateforme
      d'apprentissage pour les élèves / adultes », « pour étudiants » ; notions en
      pastilles (majuscule à l'affichage seulement, la notion part au modèle telle
      qu'écrite) ; plus de message quand le brouillon est bien gardé, plus de « Toutes
      les activités sont prêtes », plus de note sous « Terminer » ; tirets longs
      retirés des libellés visibles dans les douze langues. Le prompt de plan donne
      des repères de durée par type d'activité, pour que la durée totale ne soit plus
      gonflée jusqu'à remplir les séances annoncées.
      **Second retour du même jour.** L'interrupteur n'est plus dans la rangée du
      haut, où il faisait passer les outils à la ligne : il vit dans le pied, à
      gauche de l'action primaire, et n'apparaît que s'il reste quelque chose à
      générer (jamais pendant une génération ni à la livraison ; sur téléphone, sur
      sa propre rangée). « Reprendre un scénario » et « Exporter le scénario (.json) »
      sont de l'usage avancé : visibles en Guidé seulement, sauf l'export quand
      l'onglet ne peut plus tout garder. Sous 1 100 px, ces outils se réduisent à
      leur icône avec infobulle ; la navigation reste sur une ligne jusqu'à 390 px
      (seule exception mesurée : allemand, 390 px, écran Livraison, en Guidé).
      Le pied ne porte plus de texte d'accompagnement : seulement la raison qui
      grise le bouton et les échecs (cinq clés retirées des 12 locales). « Scénario
      repris » et « Scénario téléchargé » disparaissent aussi : le plan ouvert et le
      téléchargement le disent. Sur téléphone, « Retour » n'affiche que sa flèche.
      Vérification du mode Guidé de bout en bout, en cliquant, avec des réponses
      rendues comme par une IA grand public (phrase, bloc ```json, conclusion) :
      plan accepté avec ses textes, quatre activités collées (Vrai/Faux, Page,
      Texte à trous, Test), `.mbz` à 4 activités et 5 étiquettes, aucun appel d'IA.
      Elle a trouvé une clé brute, `parcours_reponse_sans_json`, affichée quand la
      réponse ne contient aucun JSON : traduite désormais, avec
      `parcours_module_sans_prompt`. Tutoriel, aide embarquée et fiches RAG locales
      disent que le scénario se reprend en Guidé (fiches non réingérées dans ILaaS).
      **Troisième retour, le soir (remplace l'interrupteur du pied).** Un interrupteur
      « Simple | Guidé » à côté du bouton n'avait pas de sens : l'action primaire
      génère en un clic, et un bouton **« Mode guidé »** à sa gauche est l'autre voie.
      Au cadrage, il ouvre la fenêtre du plan (ouvrable sans sujet, pour reprendre un
      scénario) ; sur le plan, il mène aux activités sans rien générer ; chaque ligne
      de fabrication porte son « Mode guidé ». Plus aucune commande guidée sur les
      cartes du plan, plus de préférence d'onglet.
      La fenêtre EST la modale de génération d'une activité : mêmes classes
      (`modal-header-group`, `modal-panel`, `floating-toolbar`, `toolbar-btn`,
      `ia-guidance-text`, `action-btn primary-btn`), même barre d'outils branchée sur
      `setupToolbarListeners` (Copier le prompt, Plein écran, cadenas), même
      interrupteur interne Simple/Guidé, même bouton contextuel : zone vide,
      « Générer en un clic » (l'IA de Caramel) ; réponse collée, « Composer le plan »
      ou « Générer l'activité », en un seul clic (plus de « Vérifier » puis « Utiliser »).
      Pastille « H5P » ou « Éléa » et vignette du module, comme pour une activité.
      Exception assumée à D8 : cibler ces classes fait profiter l'atelier de toute
      évolution de la modale d'activité. Pas de `<dialog>` : le plein écran de
      Caramel s'ouvre dans `body` et resterait sous la couche supérieure d'un dialogue.
      « Reprendre un scénario » est un outil du panneau 2 de la fenêtre du plan ;
      le `.json` se télécharge à la livraison, à côté du MBZ. En haut de l'atelier ne
      restent que le fil et l'aide (l'export y revient si l'onglet ne garde plus tout).
      Vérifié en cliquant : copie, cadenas, plein écran au-dessus de la fenêtre avec
      report de la saisie, réponse sans JSON, plan collé, « Générer en un clic » d'une
      activité (modèle doublé), trois activités collées, MBZ à 4 activités et 5 textes,
      JSON téléchargé puis repris depuis la fenêtre, téléphone, Échap.
      **Reste à faire (D24)** : l'étiquette est validée sur Éléa et Magistère, mais
      jamais EN TÊTE de section ni avec l'ouverture progressive. La sonde
      (`scripts/generer-parcours-sonde.mjs`) pose désormais accueil et introductions ;
      son import réel reste à faire. Le tutoriel ne décrit pas encore les textes d'étape.
- [x] **D65 — La vue du parcours, et le parcours dans la zone de notifications.**
      Retour d'Emmanuel du 14 septembre 2026, après un test sur le site : relire le
      parcours donnait l'impression d'un enchaînement de H5P, alors que ce qui le
      construit, ce sont aussi ses phrases et ses étapes intermédiaires, son forum.
      Et un parcours téléchargé doit se retrouver au même endroit, avec le même
      mécanisme, qu'un H5P généré.
      **Vue du parcours** (`vue-parcours.js`) : le cours dans son ordre, comme la page
      d'Éléa. Titre, objectif, repères (plateforme, étapes, activités, durée, Carte,
      ouverture progressive) ; « Accueil du parcours » avec son texte ; une carte par
      étape avec son objectif, son introduction, puis ses activités — vignette, titre,
      type écrit en clair (Forum, Sondage, Texte de liaison, Vrai/Faux…), durée,
      « Non générée » le cas échéant. Un texte de liaison se lit en place, sous sa ligne.
      « Relire le parcours » s'ouvre désormais sur cette vue ; « Vue du parcours » y
      ramène depuis une activité, et « Précédente » depuis la première.
      **Zone de notifications** (`notification-parcours.js`) : télécharger le MBZ à la
      livraison pose une notification (toast, liste, icône du parcours), avec un
      instantané du plan ; retélécharger la remplace. « Visualiser » ouvre la modale
      d'aperçu de Caramel : la vue du parcours au centre, puis chaque activité dans
      la même modale (vrai lecteur H5P, simulateur Moodle, texte des modules de
      parcours), barre « Étape · type · titre » et navigation ; « Éditer » ouvre
      l'éditeur de l'activité affichée ; l'enregistrement régénère le MBZ de la
      notification (téléchargement et dépôt Sucrerie suivent). Télécharger : MBZ (avec
      l'aide « Restauration ») et JSON ; « Vers la Sucrerie » reste le dépôt de cours.
      Une retouche non enregistrée demande confirmation avant de fermer ou de changer
      de notification. L'instantané est indépendant du brouillon de l'atelier, comme
      une activité unique l'est de sa génération.
      Le rendu d'une activité (aperçu, édition) est extrait du panneau de relecture
      dans `rendu-activite.js` et partagé par les deux usages.
      **Harmonisation avec la modale d'une activité seule (15 sept.)**, après mesure
      image par image des deux modales (même cadre au pixel près, aucun décalage de mise
      en page, pas de flash non stylé) :
      - *Une seule rangée de flèches en haut.* Celles de l'en-tête passent d'une
        notification à l'autre. L'activité précédente et la suivante se prennent au bas
        de l'activité, nommées, comme la navigation d'activités d'Éléa ; la barre du haut
        ne garde que « Vue du parcours » et l'emplacement (deux lignes au plus sur
        téléphone, trois auparavant).
      - *Enregistrer au même endroit.* En édition, l'éditeur occupe toute la zone avec son
        en-tête « Édition : … » et le pied de la modale devient Annuler · Aide ·
        Enregistrer (`poserPiedEdition`, partagé avec l'activité seule). Un module de
        parcours (forum…) reçoit le même cadre, sans Aide.
      - *Même attente.* Le rond de chargement de Caramel, et le lecteur H5P se monte caché
        jusqu'à être prêt : plus de zone blanche (vaut aussi pour l'atelier).
      **Pièges.** (1) Le CSS commun masque la barre de l'éditeur visuel
      (`.json-editor__actions`) parce que la modale pose ses boutons dans son pied ;
      l'atelier la réaffiche sous `.pc-editeur`, la modale non : un premier correctif
      l'avait réaffichée dans la vue, remplacé par le pied de la modale. (2) « Éditer »
      fait partie du pied : poser ou restaurer le pied d'édition AVANT de lui basculer la
      classe `hidden`, et le relire à chaque fois, sinon la restauration le ramène caché.
      (3) En édition, la zone perd son `min-height: 400px` et la tuile ne défile plus
      (`preview-modal__preview--parcours-edition`, `preview-modal__content--editor`,
      comme l'activité seule) : sur un écran bas, la tuile glissait et rognait l'en-tête.
      Banc `node tests/run_parcours_vue.mjs` (31 contrôles, en cliquant ; contre-épreuves
      rouges sans l'attente, sans le pied, sans la règle de zone). Tutoriel, aide
      embarquée et fiche RAG `parcours-export-limites` complétés dans les 12 langues ;
      réingestion ILaaS en attente (panne du service, script `rag/reingest-parcours-2026-09-14.mjs`
      étendu aux deux fiches modifiées).
      **Limite** : les notifications de Caramel vivent en mémoire, comme celles des
      activités ; recharger la page les efface. Le scénario .json reste la sauvegarde.
- [x] **D66 — « Nouveau parcours ».** Retour d'Emmanuel du 15 septembre 2026 : un parcours
      livré, il fallait repartir de zéro pour en créer un autre. Le brouillon vit dans
      l'onglet (sessionStorage) et « Un parcours » ramenait toujours le même ;
      `reinitialiser()` existait, commenté « bouton Recommencer », mais aucun bouton ne
      l'appelait. Un bouton « Nouveau parcours » rejoint « Tutoriel » dans la tête de
      l'atelier, dès qu'un plan existe (icône seule sur téléphone), désactivé pendant une
      génération. Il demande confirmation (même boîte que la retouche non enregistrée,
      `confirmer()`, « Garder ce parcours » par défaut), efface le brouillon et ramène au
      cadrage. Le formulaire de l'accueil garde son sujet ; le MBZ déjà téléchargé reste
      dans la zone de notifications. Banc `run_parcours_vue.mjs` (garder, puis recommencer).
- [x] **D67 — Le partage d'un parcours vers la Sucrerie est masqué, pas supprimé.**
      Décision d'Emmanuel du 17 septembre 2026 : on ne met pas en avant le partage des
      parcours tant que la Sucrerie ne les montre pas au public (décision jumelle côté
      Sucrerie : `CLAUDE.md` « Parcours : développés, pas montrés » et §8 bis du PRD de
      partage public des collections). Un seul interrupteur, `CONFIG.partageSucrerie = false`
      (`js/parcours/config.js`). Livraison : le bouton est construit et câblé, reçoit `hidden`
      avant son insertion (`.pc-livrer .sucrerie-bridge__btn[hidden]`, sans quoi son
      `inline-flex` l'emporterait). Modale de la notification : la classe
      `preview-modal--parcours-sans-sucrerie` est posée avant l'affichage de l'overlay et
      survit à la reconstruction du pied par l'édition ; le pont n'est pas monté
      (`sansPartageSucrerie()` dans `ui/notifications.js`). `js/sucrerie-bridge/` n'est pas
      touché (miroir byte-identique d'aManDe). Aucun flash. Banc `run_parcours_vue.mjs` :
      le bouton existe et reste invisible aux deux endroits. Pour rouvrir : passer
      l'interrupteur à `true` en même temps que la Sucrerie montre ses parcours.
- [x] **D68 — Les chargements portent le caramel, et l'arrêt est à côté de ce qu'il arrête.**
      Retour d'Emmanuel du 17 septembre 2026 : l'attente de la composition du plan « peut être
      un peu longue », et son bouton « Arrêter » vivait dans la barre du bas, loin du message.
      Sept maquettes vivantes ont été soumises (canevas du 17 sept.) ; retenues :
      **(a) Attente du plan** — un anneau tourne AUTOUR du caramel de la marque, qui se
      remplit ; « Arrêter » est un vrai bouton libellé DANS le panneau (44 px), et la barre du
      bas se tait pendant ce temps (`cta.hidden`) : deux « Arrêter » à l'écran feraient hésiter.
      Trois jalons disent où en est l'appel — « Cadrage envoyé », « Le modèle compose »,
      « Vérification du format » — posés aux VRAIS points de bascule de `composerPlan()`
      (avant `generateRawWithLLM`, au retour de la réponse, et en arrière lors d'un
      recalibrage) : jamais de faux avancement. La durée habituelle est annoncée, et au bout
      de 45 s le texte devient « c'est plus long que d'habitude » plutôt que de laisser croire
      à un blocage. Le bouton se désarme au premier clic.
      **(b) Lignes de fabrication** — le `fa-spinner` de la pastille devient un caramel, et
      la règle est celle d'Emmanuel : **gris pendant le travail, coloré quand c'est prêt**.
      Un SEUL mouvement pendant la génération — un anneau **doré** (jamais bleu : le bleu et
      la vitesse donnaient un air d'erreur système) qui tourne lentement autour d'un caramel
      resté gris et parfaitement immobile. À l'arrivée, le caramel se colore **une fois**,
      en 0,7 s, sans rebond : c'est la récompense. Cette mise en couleur est un ÉVÉNEMENT,
      posée au seul passage « en cours » → « prête » (`statutPrecedent` dans `peindre()`) —
      l'écran se repeint à chaque changement de la file, et sans cette garde la couleur se
      rejouerait sur toutes les lignes déjà faites, 21 fois pour 6 activités. Banc dédié :
      un `MutationObserver` compte les mises en couleur et en exige exactement une par
      activité. Le caramel garde 22 px dans les TROIS statuts : à 20 px la pastille perdait
      2 px de haut en passant « en cours », et la ligne sautillait.
      **Le remplissage qui monte est un cycle CONTINU** (grand caramel du panneau d'attente) :
      la couleur monte du bas jusqu'en haut, puis le gris remonte du bas et la mange, si bien
      qu'au bout du tour il ne reste presque rien de coloré — soit l'état du début. La boucle
      est donc invisible. Trois réglages tirés des retours successifs du 17 sept., à ne pas
      défaire : **(1)** aucune `opacity` dans `pc-remplir` — la première version s'effaçait à
      la fin, ce qui se voyait comme un flash ; **(2)** les bornes du cycle sont à **88 %**,
      pas à 100 % : une part du caramel reste toujours colorée, sinon il traverse un instant
      de décoloration totale ; **(3)** le gris de fond est à **0,42** d'opacité — à 0,16 il
      ne se lisait plus comme un caramel mais comme une tache blanche. L'anneau du panneau
      suit la même règle que celui des lignes : fin (2,5 px), doré, lent (2,4 s).
      **(c) Jauge globale : inchangée.** Un caramel = UNE activité, partout et sans exception ;
      un caramel curseur sur la barre lui aurait fait dire « tout le parcours » au même écran.
      Le chapelet (un caramel par activité au-dessus de la liste) est écarté pour la même
      raison de tenue : il ne passe pas l'échelle au-delà d'une dizaine d'activités.
      Fabrication : `dom.js:bonbon()` superpose DEUX copies du logo SVG (la grise dessous, la
      colorée dessus, découpée par un `clip-path` animé). Aucune image de plus à charger —
      c'est le logo de l'en-tête, en cache — et **rien à redessiner si le logo change**.
      `prefers-reduced-motion` fige le caramel à son niveau. Décoratif (`aria-hidden`) : ce
      qu'il raconte est écrit à côté en toutes lettres.
      **Écart assumé à D3** (la couleur caramel réservée à l'entrée et au cartouche) : la
      marque entre dans les chargements de l'atelier, et là seulement — jamais dans la
      génération d'une activité seule, qui garde son chargement d'origine.
      **Piège rencontré, à ne pas refaire** : `cta.hidden = true` ne masquait RIEN — les
      boutons de la barre sont en `display: inline-flex`, qui l'emporte sur le `display: none`
      de la feuille du navigateur. « Composer le plan » restait donc à l'écran pendant la
      composition **et arrêtait la génération** quand on le recliquait, tout en affichant
      « Composer le plan ». Corrigé par `.pc-actionbar [hidden] { display: none; }`, qui
      répare du même coup « Partir du modèle », caché de la même façon hors du cadrage.
      Le banc l'avait laissé passer parce qu'il interrogeait la PROPRIÉTÉ `hidden` et non la
      visibilité réelle : il mesure désormais `isVisible()` / `display`.
      Bancs : `run_parcours_calibrage.mjs` (modèle qui ne répond jamais : jalons, durée,
      arrêt dans le panneau, barre réellement muette, retour à la main) et
      `run_parcours_atelier.mjs` (caramels des trois statuts, animations réduites).
      Cinq contre-épreuves au ROUGE, dont le retrait de la règle `[hidden]`.
- [x] **D69 — Les parcours se comptent dans Grist, et leurs activités y portent leur nom.**
      Demande d'Emmanuel du 25 septembre 2026. Constat : la fabrication appelait le Worker avec
      `{ moduleKey, category: 'parcours' }` seulement, alors que le Worker recopie
      `activity.nameKey` → `Activite` et `activity.caramelVersion` → `Version_caramel` : dans
      le Grist bas, depuis le 1ᵉʳ septembre, 395 lignes sur 448 étaient vides dans ces deux
      colonnes (plans compris). Irrécupérables : rien ne les rattache à une activité.
      **Ce qui change.** (1) `stats-parcours.js:metaActiviteParcours()` donne à chaque activité
      fabriquée le même `nameKey`/`caramelVersion` que l'accueil, plus `parcoursId`, que le
      Worker écrit dans `DONNEES.Parcours_id`. (2) Chaque plan créé poste UNE ligne dans la
      table `PARCOURS` (`releverParcours()`) : IA intégrée, « Partir du modèle », IA externe,
      scénario repris — colonne `Origine_plan`. Le plan de l'IA intégrée part désormais en
      `stats: 'skip'` : un plan n'est pas une activité de `DONNEES` ; ses jetons, son modèle
      ayant répondu, son niveau de secours et son nombre d'essais vont dans `PARCOURS`. Un plan
      refusé après réponse du modèle est relevé (`hors_cadrage`, `echec`) — les jetons sont
      dépensés ; sans réponse (réseau, arrêt), rien. (3) Les formules Grist de `PARCOURS`
      relient le parcours à ses activités (`DONNEES.lookupRecords(Parcours_id=…)`) : nombre de
      générations, types, modèles de fabrication, jetons et durée, **sans qu'aucune ligne soit
      réécrite après coup** par n8n.
      **Pas de 14ᵉ webhook.** La ligne `PARCOURS` passe par le webhook des stats de lots
      (`ENDPOINTS.llmStats`) avec `kind: 'parcours'` ; le workflow « 5. Stats » aiguille. Une
      URL de plus aurait exigé une 14ᵉ variable dans la CI, dont le build échoue sans elle.
      Les clients qui n'envoient pas `kind` suivent le chemin historique, inchangé.
      **RGPD — ne partent que des valeurs fermées** : modèle de parcours, plateforme, format,
      ampleur, origine, statut (listes), compteurs, horodatages, modèle d'IA, version.
      JAMAIS le sujet, le titre, les notions, le niveau, la discipline, les titres de cartes
      ni les sources (cf. le refus du 10 juillet 2026 de toute télémétrie du contexte RAG).
      `parcoursId` est tiré au hasard à chaque plan : il ne suit ni une personne ni une
      session, et un scénario exporté ne l'emporte pas. Le workflow n8n **refiltre** chaque
      champ (nœud « Parcours · liste blanche ») : un texte libre envoyé par erreur est vidé
      avant Grist.
      **Déploiement, dans cet ordre** : colonnes Grist d'abord (`DONNEES.Parcours_id` + table
      `PARCOURS`), workflows ensuite — sinon l'écriture Grist échoue, sans rien montrer à
      l'enseignant, et la ligne est perdue. Deux scripts idempotents, pour les deux
      environnements, rangés avec les exports n8n (dossier local, hors dépôt comme tous les
      `n8n-*/`) : `n8n-bas/_outillage/grist-d69.py <docId>` (schéma Grist, clé en
      `GRIST_API_KEY`) et `n8n-bas/_outillage/appliquer-d69.py <dossier>` (workflows ; il
      numérote aussi tous les workflows, mêmes numéros en bas et en prod). **État au
      25-09-2026** : bas importé et vérifié en réel ; Grist prod complété (ajouts seuls) ;
      `n8n-prod/` transformé, originaux dans `n8n-prod/_avant-7.0.0/`, import à la sortie 7.0.0.
      **Rétrocompatibilité** : Caramel 6.3.3 est forké dans une intégration Éléa/Magistère qui
      appelle les webhooks prod (URL en dur au tag `6.3.3`) ; sans `parcoursId` ni `kind`, ses
      requêtes suivent exactement le chemin d'avant. Le tableau de bord Grist
      (`widget-grist-caramel`, V8) affiche les parcours dans les deux documents.
      Bancs : `run_parcours_calibrage.mjs` (plan en `stats:'skip'`, une ligne par plan
      répondu, aucune sans réponse, identifiant rangé seulement si le plan est retenu) et
      `run_parcours_atelier.mjs` (relevé de « Partir du modèle », champs fermés ; ce banc
      bloque désormais tout webhook : un banc n'écrit jamais dans le Grist réel).
      `run_parcours_external_ai.mjs` tolère le seul relevé `/llm/stats-*` sur le circuit
      externe, qui reste sans aucun appel d'IA.
- [x] **D70 — La palette s'ouvre aux modules de la plateforme, RELEVÉS sur deux exports du
      même soir.** Le 27 sept. 2026, un cours d'Éléa (test03) et un cours de Magistère
      (Grenoble), tous deux en Moodle 5.1.7, ont été remplis de TOUS les types que leur
      palette propose — 36 et 29 —, avec du contenu dans chaque conteneur répété
      (questions, pages, critères, rubriques, colonnes, chapitres, groupes), puis exportés.
      Quatorze modules en sortent, dans `js/parcours/modules-natifs.js` (fondu dans
      `MODULES_PARCOURS`) : Lien web (`url`), Questionnaire, Enquête (`feedback`), Leçon,
      Atelier (`workshop`), Tableau (`board`), Wiki, Glossaire à construire, Document
      collaboratif (`collabora`), Etherpad, Partage de fichiers (`publication`), Classe
      virtuelle (`bigbluebuttonbn`), Base de données (`data`), Choix de groupe.
      *Pourquoi* : le lot 2 l'annonçait — un parcours réel comporte des espaces d'échange, de
      dépôt, de production commune, et un enseignant qui les ajoute à la main après l'import
      retrouve le coût d'assemblage qu'on prétendait supprimer. La méthode est celle de D25 :
      recopier, pas deviner ; le banc `run_parcours_natifs.mjs` compare la forme produite au
      relevé (`tests/fixtures/moodle-reference/sept-2026/`) et casse à la moindre dérive.
      **Trois niveaux** (`niveau`) : *amorcé* (le modèle écrit tout ce que la restauration
      garde : consigne, questions, pages, critères, colonnes, rubriques, texte de départ),
      *source* (le Lien web attend son adresse sur la carte, comme une vidéo — le modèle ne
      l'invente jamais), *réservé* (atelier, classe virtuelle, choix de groupe : posés
      et expliqués, mais un geste sur la plateforme reste à faire — D72).
      **Questions et pages sont des listes d'OBJETS** (`structures`) : le modèle les écrit en
      JSON, l'enseignant les retouche en texte (`? question`, `- choix`, `?+` plusieurs
      réponses, `?!` oui/non ; `# page`, `? question`, `+ juste`, `- faux`), et les deux
      formes se convertissent sans perte. **Les identifiants imbriqués** (questions,
      pages, critères…) sont décalés par une graine tirée du contenu (`modules-socle.js`) :
      deux questionnaires du même cours ne se marchent pas dessus dans la table de
      correspondance de la restauration, et le même contenu donne le même fichier.
      **Écartés, avec leur raison** : Capytale (outil LTI dont le `typeid` change d'un site à
      l'autre — 9 sur Éléa, 1 sur Magistère — et dont le backup n'emporte pas l'adresse),
      GeoGebra, SCORM, paquetage IMS, H5P et Contenu interactif génériques (ils exigent un
      fichier que Caramel ne produit pas, ou produit déjà par sa propre voie H5P), Test
      étudiant (sa banque de questions appartient aux élèves — revu par D89 : il arrive vide,
      avec sa consigne, comme le wiki), Mots croisés / Mots mêlés
      natifs d'Éléa (ils se nourrissent d'un glossaire alimenté, perdu au restore — mais le
      relevé montre qu'ils peuvent aussi se nourrir d'un TEST : piste ouverte), Module
      (`programcourse`, renvoie à un autre cours), Fichier et Dossier (à ouvrir avec le dépôt
      d'un fichier sur la carte : le constructeur partagé refuse aujourd'hui une activité
      qui porte des fichiers). **Aller-retour réel fait le 27 sept. au soir, sur Éléa ET
      Magistère (D24) : validé**, après le correctif D75 — résultat au § 10.
- [x] **D71 — Un module sans achèvement sort de l'ouverture progressive.** Wiki, document
      collaboratif, Etherpad et partage de fichiers arrivent de la plateforme SANS
      achèvement (relevé) ; l'atelier (phases tenues par l'enseignant) et le choix de groupe
      (sans groupe, personne ne peut choisir) sont posés sans achèvement à dessein.
      `MODULES_SANS_ACHEVEMENT` (registre) les liste avec l'étiquette, et `progression.js`
      les tient hors des conditions. *Pourquoi* : « avoir terminé » une activité qui ne se
      termine jamais fermerait l'étape suivante pour toujours — le pire échec, parce qu'il
      n'apparaît que devant la classe. La Carte de progression, qui n'affiche que les
      activités à achèvement, les ignore d'elle-même.
- [x] **D72 — « À faire avant d'ouvrir le cours » : une étiquette CACHÉE aux élèves.**
      Quand le parcours contient un module *réservé*, une étiquette `visible = 0` ouvre la
      zone « Généralités » et liste les gestes à faire sur la plateforme (faire avancer les
      phases de l'atelier, fixer l'heure de la classe virtuelle, créer les groupes). La
      même liste s'affiche à la livraison. *Pourquoi* : une coquille qu'on découvre vide
      devant sa classe est exactement ce que D23 voulait éviter ; la consigne de l'élève
      ne doit pas porter une note à l'enseignant, et une étiquette cachée est le seul
      endroit de Moodle que l'enseignant voit et l'élève non.
- [x] **D73 — Une sixième famille, « Échanger ».** Le miroir (D35) rangeait forum, sondage,
      nuage et mur dans « produire » : un parcours sans le moindre temps d'échange n'était
      signalé nulle part. Tout ce qui n'a de sens qu'à plusieurs y passe — forum, sondage,
      nuage, mur, questionnaire, enquête, tableau, wiki, document, bloc-notes, glossaire et
      base à construire, classe virtuelle, choix de groupe. L'atelier et le dépôt restent
      dans « produire » (on y remet un travail à soi), le lien et la leçon dans
      « découvrir ». Le banc des types en tient deux contrôles de plus.
- [x] **D74 — Les modules de la plateforme se VOIENT.** Trois causes les rendaient
      invisibles, chacune traitée : (1) les trames n'en proposaient presque jamais (3
      forums sur 179 suggestions) — cinq trames les emploient désormais là où leur
      intention les appelle : sondage des hypothèses (investigation), leçon
      (autoformation), forum de retour d'expérience (formation), wiki du travail commun et
      atelier de critique entre pairs (projet) ; (2) le menu de type les noyait en bas
      d'une liste d'une trentaine d'entrées — il est groupé en « Activités générées par
      Caramel » / « Modules de la plateforme » ; (3) le prompt de plan ne les décrivait
      pas — chacun a sa ligne d'usage, et une règle dit de les préférer à une Page qui
      décrirait l'échange. Au passage, l'index du routeur fait passer les CLÉS avant les
      noms : `glossary` (nom Moodle du glossaire à construire) avalait la clé H5P
      `Glossary`.
- [x] **D75 — Un module qui a un FICHIER dans son export le reçoit dans le `.mbz`.**
      Premier aller-retour des modules natifs, 27 sept. 2026 au soir : l'import des deux sondes
      (Éléa ET Magistère) échoue en entier sur `mod_collabora/initialfilemissing`. Le
      Document collaboratif range son texte de départ dans un vrai fichier `<nom>.txt`
      (composant `mod_collabora`, zone `initial`) — le relevé le montrait (`fileref` dans
      son `inforef`), la fabrique l'avait ignoré. `collabora_fs::get_initial_file()` lève
      l'exception quand la zone est vide, et une exception interrompt tout le cours.
      `js/parcours/fichiers-modules.js` (dans `js/moodle/` depuis D88) pose désormais ce fichier APRÈS l'assemblage,
      exactement comme l'export : contenu dans le pool, deux entrées `files.xml` (le
      fichier et son dossier « . »), identifiants dans l'`inforef` de l'activité ; le
      constructeur partagé n'est pas touché (même voie que le fond de la Carte, D61).
      *Pourquoi* : le banc comparait les BALISES du module au relevé, pas ses FICHIERS ;
      un `fileref` dans l'`inforef` d'un relevé est désormais un signal à traiter avant
      d'ouvrir un module. Code de restauration des autres greffons relu à cette occasion
      (questionnaire, tableau, partage de fichiers, choix de groupe, Etherpad) : aucun
      n'exige de fichier. Banc `run_parcours_natifs.mjs` : 9 contrôles de plus (113).
- [x] **D76 — Les modules de la plateforme se CHOISISSENT d'un coup d'œil et entrent dans
      les trames là où elles les appellent.** Retours d'Emmanuel du 28 sept. 2026, traités
      le même jour :
      - **Mosaïque des types** (`choix-module.js`) : la liste déroulante du type d'une carte,
        devenue illisible (une trentaine d'activités Caramel puis une vingtaine de modules),
        laisse place à un bouton — vignette, nom, chevron — qui ouvre un `<dialog>` modal :
        deux rubriques, vignettes, filtre au clavier (accents ignorés, Entrée prend le
        premier), type actuel marqué et amené à l'écran, focus rendu au bouton de la carte.
      - **Vignettes des modules de la plateforme** : celles du sélecteur d'activités
        d'Éléa, c'est-à-dire les pictogrammes officiels (`theme/image.php/.../monologo`) sur
        la couleur de leur catégorie (contenu bleu, évaluation magenta, collaboration et
        communication violet), relevés sur la plateforme et composés au gabarit des
        vignettes existantes (60 px) : `assets/images/activities/plateforme-<module>.webp`.
        Elles apparaissent partout où une vignette apparaît déjà (plan, fabrication, vue).
      - **Alternatives dans les trames** (`a|b|c`, `activity-router.moduleDeTrame`) : le
        premier module présent sur la plateforme visée. Une trame peut ainsi employer un
        greffon (questionnaire, tableau, document, choix de groupe) sans casser sur un
        Moodle nu ; le banc de calibrage exige toujours zéro repli, sur les trois palettes.
      - **Trames** : découverte (version longue : nuage de mots ou sondage pour poser la
        question), classe inversée (bilan par questionnaire, enquête ou sondage), analyse de
        source (une VRAIE source en ligne, par un Lien web), et **deux trames nouvelles**
        pensées autour des modules de la plateforme — *Débat argumenté* (sondage → sources →
        forum → texte, et sondage final en version longue) et *Travail d'équipe* (choix de
        groupe → ressources en tableau → document collaboratif → atelier entre pairs, chacun
        avec son repli). Dix-neuf trames.
      - **Modalité** : un module peut déclarer ses `formats` ; la classe virtuelle n'est plus
        proposée au modèle en présentiel (un plan réel en présentiel en contenait une).
      - **Export documentaire** : le détail des activités (DOCX, ODT, PDF) rendait les
        modules de la plateforme en JSON brut ; ils passent désormais par le rendu d'une Page
        (`fiche-sequence.pageDocumentaire`) — type et consigne, puis un bloc par champ,
        questions et pages en lignes lisibles. Le formateur partagé avec la Sucrerie n'est pas
        touché.
      Banc `run_parcours_natifs.mjs` : 119 contrôles ; `run_parcours_relecture.mjs` pilote la
      mosaïque au clic (ouverture, filtre, choix, focus).
- [x] **D77 — La classe virtuelle sur Magistère seul ; les palettes revérifiées en direct
      et tenues par le banc ; retouches visuelles.** Retours d'Emmanuel du 28 sept. 2026 :
      - **Palettes** relues en direct sur les deux plateformes (service
        `core_course_get_course_content_items`) et figées dans
        `tests/fixtures/moodle-reference/sept-2026/palettes.json`. Le banc des modules
        natifs vérifie désormais, module par module, que chaque plateforme déclarée figure
        dans la palette relevée, et qu'aucun module présent n'est omis sans écart documenté.
        Éléa seul : Feedback, GeoGebra, Test étudiant, jeux Mots croisés / Mots mêlés, QCM,
        Millionnaire, Appariement, Carte de progression, Contenu interactif. Magistère seul :
        Nuage de mots, Etherpad, Module. Sur les deux : tout le reste, dont BigBlueButton.
      - **Classe virtuelle → Magistère seul.** Le test03 d'Éléa propose BigBlueButton, mais
        avec une accréditation serveur « bientôt échue », et Emmanuel confirme que la visio
        n'est offerte ni sur Éléa ni sur un Moodle ordinaire. Le doute se tranche dans le sens
        restrictif (D26) ; l'écart est le seul documenté du banc.
      - **Cartes de trame** : description sur trois lignes au plus ; la trame choisie —
        « Caramel propose » comme les autres — prend un fond uni clair (#f4f8ff) au lieu du
        dégradé réservé à une seule carte.
      - **Mosaïque** : les vignettes H5P gardent leur proportion (largeur donnée, hauteur
        nécessaire, comme sur les tuiles de l'accueil) ; un petit pictogramme (boîte de
        réception) marque les modules où il n'y a rien à générer — l'IA n'écrit que la
        consigne : forum, wiki, glossaire à construire, Etherpad, partage de fichiers, classe
        virtuelle, choix de groupe, lien web (`rienAGenerer`), avec sa légende.
- [x] **D78 — L'écran de livraison commence par le cours ; le `.json` devient « reprendre plus
      tard ».** Retour d'Emmanuel du 28 sept. 2026 : le `.json` à côté du `.mbz` complexifiait
      l'écran, et l'on risquait d'importer le mauvais fichier. Ordre retenu : le cours
      (`.mbz`, titre « Votre cours pour <plateforme> », étapes d'import visibles d'emblée),
      puis les documents papier, puis une section à part « Reprendre ce parcours plus tard
      dans Caramel », seule à porter le `.json`. Au passage : « Retour » et « Arrêter » ont
      la même taille dans la barre d'action. L'erreur signalée après l'ajout d'un Lien web ne
      venait pas du lien mais de la carte Rédaction voisine : le modèle y avait écrit un
      mot-clé réduit à ses variantes (`{"alternatives": [...]}`), refusé par le processeur.
      `replierAlternativesOrphelines()` (`processors/Essay.js`) rattache ces variantes au
      mot-clé précédent, ou promeut la première en mot-clé ; rien n'est perdu.
- [x] **D79 — Le Paquetage IMS, écrit par Caramel, sur demande seulement.** Emmanuel a
      trouvé vides les modules des cours de RELEVÉ (801, 2560) — normal, ils ne servaient
      qu'à lire le XML — et a demandé que le contenu IMS reste disponible dans les modules
      sans être proposé par les trames. Il ne l'était pas : un paquetage exigeait un fichier
      que Caramel ne produisait pas. Désormais Caramel l'écrit entier (`parcours_ims`,
      `mod_imscp`) : des pages HTML autonomes (un paragraphe par ligne, « ## » intertitre,
      « - » puce, **gras**), le manifeste `imsmanifest.xml`, l'archive `.zip` d'origine en
      zone `backup`, et la table des matières `structure`, **sérialisée à la PHP** (la
      restauration la reprend telle quelle sans relire le manifeste ; longueurs en OCTETS).
      Forme relevée le 27 sept. sur les deux plateformes, identique. Les fichiers se posent
      après l'assemblage (`fichiers-modules.js`, généralisé : une activité décrit son
      `paquet`, l'ordre des activités posées retrouve son dossier renuméroté). `surDemande` :
      présent dans la mosaïque des trois plateformes, **jamais** dans le catalogue du plan —
      sur Moodle un Livre fait la même chose en mieux intégré ; le paquetage sert à qui veut
      un contenu portable. **Aller-retour VALIDÉ le 28 sept. 2026 sur Éléa (cours 804) et
      Magistère (cours 2563)** : restauration complète, table des matières à trois entrées
      dans l'ordre (« & » intact), les trois pages servies depuis la révision 1 (HTTP 200,
      `lang="fr"`, intertitre, puces, gras), et au ré-export 0 écart sur les 7 valeurs du
      module et les 7 fichiers (pages, manifeste, archive, dossiers) revenus au SHA-1 près.
- [x] **D80 — Des parcours RÉELS pour banc, et ce qu'ils ont appris.** Demande d'Emmanuel,
      qui conçoit des formations complètes Pix+Édu : « des activités JSON test pour vérifier
      que tout fonctionne ». `scripts/generer-parcours-reel.mjs` fabrique un parcours de bout
      en bout par le VRAI pipeline (plan de l'IA avec son rattrapage, file de fabrication de
      l'atelier `creerFile`, assemblage) et garde le scénario dans
      `tests/fixtures/parcours-reels/`, le `.mbz` et son relevé dans `tests/sonde-parcours/`.
      Trois scénarios : Pix+Édu « Protéger les données » (Magistère, hybride, trame
      formation, un Paquetage IMS choisi à la place de la première Page), Pix+Édu
      « Concevoir une activité collaborative » (Magistère, trame coopération), débat
      argumenté en 3e (Éléa, distanciel). `tests/run_parcours_reels.mjs` les rejoue SANS
      modèle : reprise du `.json`, réparation de production, assemblage sans exclusion, puis
      lecture du cours comme la plateforme l'affichera (XML, banque de questions,
      `content.json` des `.h5p`, pages IMS) — texte substantiel, aucun « … », aucun jargon
      de prompt, aucun `**` résiduel, pas de tutoiement pour un public adulte.
      Trois défauts trouvés sur le premier parcours réel, corrigés :
      - **Jargon des prompts dans les textes lus** (« les notions pivots du parcours, à
        employer MOT POUR MOT ») : le bloc s'appelle « VOCABULAIRE DU PARCOURS », et
        `reglesDeRedaction()` (plan, activités H5P et Moodle, modules de la plateforme)
        interdit de reprendre le vocabulaire des instructions ; une notion ne se place que
        là où elle a sa place (le modèle les plaquait partout, en gras, jusqu'à des phrases
        fausses).
      - **Un module tutoyait quand les autres vouvoyaient** : chaque carte est un appel
        distinct, qui choisissait seul son registre. La règle vient désormais du public, la
        même pour toutes ; « l'élève » des instructions désigne qui suit le parcours, et un
        adulte en formation n'est jamais appelé « élève ».
      - **Une question à trous injouable** (`{1:NUMERICAL:=Réponse attendue:0}`) : Moodle
        la restaure, l'élève ne peut que se tromper. `verifierTrousCloze()`
        (`moodle-formats.js`) la REFUSE — trou sans réponse créditée, NUMERICAL non
        numérique, question sans trou — dans la réparation de la carte (qui échoue, avec son
        message, et se refait d'un clic) et dans les trois exports XML, GIFT, `.mbz`. Refuser
        plutôt que retirer : rien ne disparaît sans le dire.
      Les passes suivantes (même jour, neuf parcours générés au total) en ont appris autant :
      - **Un espace commun se poursuit** : trois Documents collaboratifs pour un seul texte
        (plan, version finale, version améliorée), un forum à part pour « les règles du
        débat ». Règle de plan : pour continuer le même travail, on renvoie au même espace.
      - **Le geste que le module permet** : une Page « Ton argument à chaud » (une page ne
        recueille rien), un sondage « justifie ton choix » (un sondage ne recueille qu'un
        vote). Règle de plan et consigne du sondage.
      - **La trame dit le rôle de chaque emplacement** : la trame « Débat argumenté » laissait
        la Page et le wiki sans rôle, et le modèle les remplissait à sa façon. Son intention
        décrit désormais chaque étape, emplacement par emplacement.
      - **Deux sondages se comparent** : le second reçoit les réponses du premier, avec
        consigne de les reprendre à l'identique (sinon « plutôt oui / peut-être » au départ
        et quatre phrases à l'arrivée : aucune comparaison possible).
      - **Les exemples des prompts tutoyaient** (« Tu as une partie de la réponse », « il te
        manque… ») : le modèle recopiait ce registre malgré la règle. Les 60 retours d'exemple
        passent à l'impersonnel (retour sur la tâche, pas sur la personne), qui convient
        aux élèves comme aux adultes — **dans le parcours seulement depuis D82** : ils avaient
        d'abord été réécrits dans `fr.json`, ce qui modifiait aussi le prompt d'une activité
        créée seule. **Les onze autres locales gardent leurs exemples** : même travail
        possible, dans `retours-impersonnels.js`.
      - **Le réparateur ignorait la forme complète d'une bibliothèque** : un texte à trous de
        Présentation déclaré `"H5P.Blanks 1.14"` (au lieu de `"blanks"`) échappait au
        nettoyage du gras, et `**notion**` restait dans un texte où `*` délimite un trou.
        `json-healer.js` ramène la forme complète à la courte (blanks, dragtext,
        markthewords) — ce qui sauve aussi une version décalée (`1.12`), que le processeur
        rabattait en texte simple.
      - **Mise en forme** : une cellule de tableau réduite à « … » est une case à remplir,
        rendue vide (`celluleARemplir`, Présentation et Livre interactif) ; un terme n'est
        en gras qu'à sa première apparition dans une page ou une consigne (`grasUneFois`) ;
        une entrée de glossaire écrite en intertitre redevient un paragraphe.
      - **Ce qui reste du ressort du modèle** : des erreurs de fond (« une certification
        comme le RGAA » pour la protection des données — le RGAA est l'accessibilité ; un mot
        remplacé par un autre). Aucun contrôle automatique ne les voit : la relecture de
        l'enseignant, sur l'écran de fabrication, reste nécessaire.
- [x] **D81 — État de l'art didactique : les trames ajustées, pas refondues.** Demande
      d'Emmanuel (28 sept. 2026) : vérifier que les parcours tiennent au regard d'ABC Learning
      Design, de la didactique et des sciences cognitives, et « ajuster légèrement la liste ».
      Le document complet, références vérifiées le jour même :
      [ETAT_DE_L_ART_DIDACTIQUE_PARCOURS_2026-09-28.md](ETAT_DE_L_ART_DIDACTIQUE_PARCOURS_2026-09-28.md).
      **Le socle tient** : découverte → entraînement → transfert, au moins une activité qui
      vérifie, correction immédiate à l'entraînement (les deux effets les mieux établis :
      pratique du test et retour d'information), vocabulaire stable, plan relu avant
      génération. La première règle du prompt de plan énonce déjà les six gestes d'ABC ; le
      miroir ne dit que les absences, comme ABC, qui ne fixe aucune proportion idéale.
      **Ce qui a changé** :
      - *Structure, quatre trames.* Le diagnostic de « Réviser » et le réveil du « Rituel »
        passent du Vrai/Faux (UNE affirmation : une chance sur deux, rien de repéré) à une
        série de Vrai/Faux (`QuizSetVF`), comme « vérifier les affirmations » d'« Analyser
        une source » et du « Débat » long. « Démarche de projet » : l'atelier relit une
        PREMIÈRE version, le devoir recueille la version améliorée, le forum dit ce que les
        retours ont changé — une critique sans reprise n'apprend rien. « Formation hybride » :
        le compte rendu tient dans le devoir (une rédaction en plus le faisait écrire deux
        fois), et un test final reprend toute la formation.
      - *Intentions de toutes les autres*, principe traduit en GESTES sans le nommer (le
        modèle recopie le jargon) : découverte guidée par des questions puis synthèse
        explicite ; page de remédiation qui énonce l'erreur, la réfute, puis explique avec un
        exemple résolu ; source jugée en sortant de la page (qui la publie, ce qu'en disent
        d'autres) ; forum de débat avec sa marche à suivre, position finale qui répond à un
        argument contraire ; tâche finale annoncée d'emblée en langue vivante ; orientation
        par seuils de score en différenciation ; rôle et part identifiable de chacun en
        coopération ; exemple commenté, essai, plan d'action daté, mise en œuvre et retour en
        formation d'enseignants ; rituel qui mêle notions récentes et anciennes.
      - *Deux règles de plan.* Le test de fin porte sur tout le parcours, notions mélangées.
        Un test ou un quiz porte sur des connaissances qui ont une bonne réponse : pratiques,
        habitudes et opinions vont à un questionnaire, une enquête ou un sondage (formation
        réelle : « lesquels de ces outils utilisez-vous régulièrement ? », noté juste ou faux).
      - *Un contrôle.* `remarquesComposition()` (`calibrage.js`) : plusieurs espaces
        d'écriture commune (document, wiki, bloc-notes), ou deux fois le même espace de dépôt
        (tableau, base, mur, glossaire). Elle demande LA recomposition unique de D58, jamais
        un échec : si la seconde proposition garde le doublon, le plan passe et l'enseignant
        le relit. La règle du prompt n'avait pas suffi — deux parcours réels de suite ont
        ouvert un second Document collaboratif « Améliorer votre document ».
      - *Une intention par ampleur* (`intentions`, résolue par `adapterTrame`) : « en version
        longue, un wiki… » finissait en titre (« Carte des arguments (version longue) ») et en
        consigne (« si tu choisis cette option »). L'expression rejoint les mots interdits de
        `reglesDeRedaction()` et le jargon cherché par le banc réel.
      **Validé** sur cinq parcours réels, dont deux scénarios nouveaux (« Réviser » en 5e,
      « Démarche de projet » en 4e), relus carte à carte ; banc réel (question notée sur la
      pratique, contre-épreuve) ; banc de calibrage (doublon remarqué puis accepté, intention
      par ampleur, aucune trame ne déclenche la remarque).
      **Non retenu** : refonder le miroir sur les six types d'ABC (vocabulaire savant, douze
      langues — D4, D59). La seule piste qui vaudrait : séparer « échanger » en *discuter* et
      *coopérer*, qu'ABC distingue et que le miroir confond. Une trame « Apprendre à
      apprendre » reste une idée (§ 4), aux preuves solides. — *Les deux faits le soir même,
      à la demande d'Emmanuel : D82.*
- [x] **D82 — Le parcours ne touche jamais aux prompts individuels ; miroir à sept
      familles ; trame « Apprendre à apprendre ».** Trois décisions du 28 sept. 2026 au soir.
      - **Isolement des prompts** (question d'Emmanuel : « les prompts du parcours ne modifient
        pas les prompts individuels ? »). Ils en avaient modifié UN point : les 60 retours
        d'exemple de D80, réécrits dans les `prompt_*_exemple_rendu` de `fr.json`, communs aux
        deux voies. Les 14 exemples reviennent à leur texte d'avant (et leurs copies `.md`) ;
        `js/parcours/retours-impersonnels.js` substitue les 60 retours dans le prompt d'une
        CARTE seulement, chacun cherché entre guillemets. Banc natifs : exemples communs
        intacts, prompt individuel inchangé, prompt de carte impersonnel, aucune paire morte ;
        contre-épreuve (substitution désarmée → rouge). **Règle** : l'atelier réutilise le
        gabarit d'une activité et lui AJOUTE son cadre ; il ne modifie jamais ce qui sert à la
        page d'accueil.
      - **Miroir à sept familles** : « échanger » (D73) se scinde en *discuter* (forum,
        sondage, nuage, questionnaire, enquête, classe virtuelle) et *coopérer* (wiki,
        document, bloc-notes, tableau, mur, glossaire et base à construire, choix de groupe),
        que distingue ABC. Un parcours qui n'avait qu'un forum ne voyait pas qu'il ne faisait
        jamais rien construire à plusieurs. Deux clés, douze langues ; tutoriel, aide de
        Caramelia et wiki disent « sept familles, dont Discuter et Coopérer ».
      - **Trame « Apprendre à apprendre »** (`apprendre`, spécialisé, toutes modalités,
        courte 3×4, moyenne 3×6) : série de vrai/faux sur les idées reçues (relire, surligner,
        tout réviser la veille), page de ce qui aide vraiment (se tester, se re-tester quelques
        jours plus tard, expliquer, varier), cartes et quiz mélangé SUR LE SUJET du cours, plan
        de révision, bilan des méthodes. Première passe réelle (Révolution française, 4ᵉ) : le
        vrai/faux « sur les méthodes » et le questionnaire de bilan interrogeaient la
        Révolution — le remplissage donnait le sujet du parcours AVANT la commande de la carte.
        Désormais la commande vient d'abord, le sujet ensuite « comme cadre », et une règle
        commune (`CONTENU_SUIT_LA_COMMANDE`) dit qu'une carte sur une méthode ou un bilan en
        garde l'objet. Témoin : « Réviser les fractions » régénéré reste sur les fractions.
        La page présentait « espacer » comme « relire à intervalles » : l'intention précise
        qu'espacer, c'est se re-tester, pas relire plus souvent. Un tirage mêlait encore des
        affirmations sur la Révolution au vrai/faux « sur les méthodes » : la règle dit
        désormais « TOUTES ses questions », et deux tirages de contrôle l'ont tenue.
        Six parcours réels en banc (228/0).
- [x] **D83 — Captures refaites par script ; tutoriel, wiki et Caramelia savent les parcours.**
      Demande d'Emmanuel (28 sept. 2026) : refaire chaque capture qui montre désormais le
      commutateur « Une activité | Un parcours », illustrer la création d'un parcours dans le
      tutoriel, le wiki et ailleurs, et enrichir le RAG de Caramelia.
      - **`scripts/captures-interface.mjs`** refait les captures : taille, densité, langue et
        sujet fixés, réseau coupé, et le parcours montré est un parcours RÉEL du banc
        (`revision-fractions.json`) repris par le vrai bouton d'import ; la fabrication « en
        cours » passe par la doublure du modèle. Cinq captures d'accueil refaites sous leur nom
        (mode rapide, mode avancé, activités, Caramelia, tutoriel) ; sept nouvelles en WebP
        (`parcours-cadrage`, `-trames`, `-plan`, `-mosaique`, `-miroir`, `-fabrication`,
        `-livraison`). Les captures d'Éléa, de l'aperçu et de l'export ne montrent pas
        l'accueil : inchangées.
      - **Tutoriel (12 langues)** : sept captures dans le chapitre du parcours, textes
        alternatifs traduits ; une astuce « **Une activité** affiche ces tuiles ; **Un
        parcours** ouvre l'atelier » au chapitre du choix d'activité (tutoriel et aide de
        Caramelia) ; « dans la barre du haut » → « sous le formulaire » ; « notions pivots »
        → « notions du parcours ». Le paragraphe « Déposer le parcours dans Sucrerie » est
        retiré : la fonction est masquée (`CONFIG.partageSucrerie: false`) — à rétablir le jour
        où elle s'ouvre. Même retrait dans le wiki, qui citait en plus une branche interne, et
        dans le README, qui l'annonçait comme disponible.
      - **Caramelia** : `scripts/aide-parcours.mjs` écrit la liste des vingt trames (nom,
        description, ampleurs, modalités, au caractère près de l'écran) dans son aide
        embarquée — utile sans ingestion — et trois fiches du RAG par langue :
        `parcours-trames`, `parcours-modules` (texte du tutoriel), `parcours-conseils`
        (relecture, miroir, état de l'art). `--verifier` échoue si elles ne suivent plus le
        code ; le banc de documentation l'appelle (326 contrôles, contre-épreuve faite).
        `parcours-creation` corrigée dans les 12 langues ; source FR et 10 questions de
        référence ajoutées. **Ingéré le soir même, à la demande d'Emmanuel** (workflow actif) :
        `rag/ingest-parcours-2026-09-28.mjs --apply` — 12 fiches remplacées, 36 ajoutées,
        chacune relue (empreinte, langue, libellé) ; collection `caramelia` 816 → 852 documents,
        aucun autre touché. Recherche rejouée sur les 22 questions de référence : 15 trouvent
        leur fiche dans les 5 premiers résultats. « Apprendre à réviser » et « formation
        d'enseignants » ne ramenaient pas la fiche des trames : la fiche des conseils nomme
        désormais « Apprendre à apprendre » et « Formation hybride en trois temps » (12 fiches
        remplacées une seconde fois) ; la première remonte ainsi, la seconde reste attirée par la
        présentation des plateformes — l'aide embarquée, envoyée entière, porte de toute façon
        la liste complète. Les cinq autres échecs visent les fiches du 10 septembre
        (relecture-scénario, export-limites), non modifiées ici : à reprendre.
- [x] **D84 — Plus aucune boîte du navigateur dans l'atelier ; des pictogrammes aux chiffres clés.**
      Deux demandes d'Emmanuel (28 sept. 2026, soir).
      - « Remplacer le parcours en cours ? » passait par `window.confirm` à quatre endroits
        (Partir du modèle, Composer le plan, Reprendre un scénario, plan d'une IA externe).
        `confirmerRemplacement()` (`scenario-actions.js`) pose la question dans la modale de
        l'atelier (`confirmer()`, `confirm-abandon.js`), le focus sur « Garder le parcours en
        cours » ; Échap, clic hors de la boîte ou Garder ne perdent rien. Elle conseille
        d'exporter le scénario : elle l'offre donc, par une action ANNEXE qui télécharge le
        `.json` sans fermer la question (`confirmer()` accepte désormais `annexe`, Tab
        circule entre les trois boutons). Quatre clés, douze langues ; l'ancienne
        `parcours_scenario_remplacer` est retirée. Banc de calibrage : modale, trois boutons,
        focus sur Garder, aucune boîte native. **Règle** : pas de `window.confirm`/`alert`
        dans l'atelier.
      - Les trois chiffres clés (étapes, activités, durée) du plan et de la livraison ont un
        pictogramme SVG à gauche, dessiné sur place (`tuileChiffre()`, `screen-plan.js`) :
        liste, grille, horloge, en couleur héritée ; au-dessus du chiffre sur téléphone. Le
        miroir des sept familles garde ses tuiles sans pictogramme.
- [x] **D85 — « Importer un modèle » à côté de « Nouveau parcours », dès le cadrage.**
      Trois demandes d'Emmanuel (28-29 sept. 2026). Elles reviennent sur la place « d'usage
      avancé » donnée à la reprise de scénario (D48, troisième retour du 14 sept.) : le `.json`
      exporté à la livraison sert de gabarit pour le parcours suivant, il faut le retrouver
      sans chercher.
      - ~~**Pied du cadrage** : « Importer un modèle » juste à droite de « Partir du modèle ».~~
        **Retiré le matin même (29 sept.)**, à la demande d'Emmanuel : avec l'import en haut dès
        le cadrage, le cadrage l'offrait deux fois ; côte à côte, « Partir du modèle » (la trame)
        et « Importer un modèle » (un parcours `.json` déjà fait) laissaient croire à deux
        variantes du même objet ; et il passait sous son voisin dans la plupart des langues. Le
        pied est revenu à son état d'avant D85. Le banc vérifie qu'il n'y revient pas.
      - **Haut de l'atelier** : « Importer un modèle » à côté de « Nouveau parcours », les
        deux visibles DÈS le cadrage, pour que le haut ne change pas d'un écran à l'autre.
        Sans plan, « Nouveau parcours » n'a rien à effacer : il reste visible, grisé, et son
        infobulle le dit (`parcours_nouveau_vide`), même règle que « Partir du modèle ». Le
        bouton déclenche le champ `#pc-scenario-fichier` existant (lecture, contrôles,
        `confirmerRemplacement()`, plan), rien n'est dupliqué. Son infobulle dit ce qu'on
        importe (un scénario `.json` exporté depuis Caramel).
      - **« Commencer un nouveau parcours ? »** disait « gardez son scénario (.json) » à côté
        d'un bouton « Garder ce parcours » qui ne téléchargeait rien : on croyait sauvegarder.
        Le texte dit désormais « exportez d'abord son scénario (.json) », et la question porte
        l'action annexe « Exporter le scénario (.json) » de D84, qui télécharge sans refermer
        (`annexeExporterScenario()`, partagée avec « Remplacer le parcours en cours ? »).
        « Garder ce parcours » reste une annulation : lui faire télécharger aurait mêlé
        deux gestes.
      - La note de reprise de la livraison nomme « Importer un modèle » (visible à cet écran)
        au lieu de « Reprendre un scénario », qui reste l'outil du panneau 2 de la fenêtre
        « Personnaliser le plan ». Le tutoriel, l'aide embarquée et les fiches RAG le décrivent
        toujours là, dans les douze langues : ils sont justes mais ne citent pas encore les
        nouveaux boutons (lot à part, avec réingestion ILaaS).
      - **Mise en page mesurée** dans les douze langues de 360 à 1 440 px. Haut : « Nouveau parcours » et « Importer » en icônes sous
        1 100 px ; « Tutoriel » aussi sous 480 px, boutons-icônes de 30 px. Le fil ne passe
        plus à la ligne que dans 8 cas au lieu de 17 avant la modification (tous préexistants,
        360 px surtout).
      - Banc `tests/run_parcours_import.mjs` (19 contrôles, contre-épreuvé : sans l'annexe,
        avec « Nouveau parcours » caché sans plan, ou avec le bouton remis dans le pied, il
        vire au rouge). Trois clés nouvelles et une revue, douze langues.
- [x] **D86 — Les réglages du Test (`quiz_settings`), pour le Test seul ET le Test d'un
      parcours. Aller-retour Éléa réussi le 29 sept. 2026.**
      Retours de professeurs (29 sept. 2026) : « choisir différentes options de
      feedback / restriction, un peu comme dans le panneau de la vidéo interactive » ;
      « les paramètres des tests (dispo dans Éléa) ».
      - **Une clé racine `quiz_settings`**, optionnelle, noms de Moodle :
        `preferredbehaviour` (feedback différé — défaut —, interactif avec plusieurs essais,
        immédiat), `attempts` (0 = illimitées), `grademethod` (1 plus haute, 2 moyenne,
        3 première, 4 dernière), `questionsperpage`, `navmethod` (`free` | `sequential`),
        `shuffleanswers` ; deux exceptions : `timelimit_minutes` (Moodle compte en
        secondes) et `review`, un préréglage à trois valeurs — `all` (tout : réponses,
        correction, retours = Éléa), `marks_feedback` (note et retours, sans la bonne
        réponse), `marks` (la note et le feedback global) — qui calcule les huit masques
        `review*`. Plus `overallfeedback`, les tranches de l'éditeur (`feedbackRanges`, en %)
        converties en plages de note (0-10, la plus haute monte à 11 comme Éléa). **Pas**
        la clé `options`, déjà fusionnée dans chaque question.
      - **Écrite par UNE fonction pure partagée** : `quizSettingsXml()` et
        `quizFeedbacksXml()` (+ `resoudreReglagesTest`, `masquesRevue`, `presetDeRevue`,
        `pageDuSlot`) dans `mbz-course-builder.js`, appelées par `buildQuizBackup`
        (`test-backup-builder.js`, Test seul) ET `buildQuizActivityFiles` (parcours). Avant,
        le bloc de réglages était recopié à l'identique dans les deux : un réglage ajouté
        à l'un ne se serait pas propagé à l'autre. Le banc
        `tests/roundtrip/mbz-quiz-backup.mjs` vérifie la parité, octet pour octet, du bloc.
      - **Masques de relecture** (P pendant 0x10000, I juste après 0x01000, L plus tard
        0x00100, F après fermeture 0x00010) : après la tentative = ce que montre le
        préréglage (I+L+F) ; pendant = la tentative et la note maximale toujours, ce que le
        préréglage montre après (convention d'Éléa), et — en interactif ou immédiat — la
        correction, les points et les retours, **sans quoi « Vérifier » n'afficherait
        rien**. Bonne réponse pendant : seulement avec `all`. Feedback global jamais
        pendant (Moodle ne le permet pas). Défaut = valeurs d'Éléa (69904 ×7, 4368).
      - **Défauts corrigés au passage** (ils valaient pour les deux voies) : relecture
        69888/4352 → 69904/4368 (jamais « après fermeture », jamais « pendant » pour les
        retours) ; `graceperiod` 0 → 86400 ; `<precreateattempts>$@NULL@$` ajouté entre
        `allowofflineattempts` et le bloc SEB (séquence des 49 balises de `<quiz>` =
        référence, contrôlée) ; `questionsperpage` 1 → **0** — tous les slots étaient en
        page 1, c'est donc ce que l'élève voyait : le défaut dit maintenant vrai, et les
        numéros de `<page>` suivent le réglage. **Test seul** : `completiongradeitemnumber`
        `$@NULL@$` → 0 (achèvement « recevoir une note », comme Éléa et comme le parcours
        — l'ancien NULL posait un achèvement automatique SANS condition) et `grademax` du
        carnet 100 → 10 (= `<grade>`). Cliché T5 du harness (`test_1.json`) mis à jour
        pour ces raisons, et pour elles seules.
      - **Éditeur** : section « Réglages du test », repliée, dans le schéma `elea_test` —
        donc aussi dans l'éditeur des cartes du parcours. Méthode d'évaluation masquée pour
        une tentative unique (`showWhen`). **Hors v1, délibérément** : mot de passe (il
        voyagerait en clair dans le JSON déposé sur Sucrerie), dates d'ouverture/fermeture
        (aucun champ date dans l'éditeur), achèvement (un critère mal posé bloquerait
        l'ouverture progressive d'un parcours, D71). Rien de tout cela n'est demandé à
        l'IA : aucun prompt ne change (D82 tenu).
      - **Aller-retour d'un Test importé** (`test-io.js`) : `parseFiles` relit les réglages
        (`lireReglagesTest`) ; `serializeFiles` ne réécrit QUE les balises réglées quand
        `quiz_settings` est présent (dates, mot de passe, délai de grâce, SEB, note
        maximale du Test d'origine gardés). Masques qu'aucun préréglage ne reproduit →
        `review: 'custom'` + `review_masks`, réécrits tels quels ; note maximale autre que
        10 → `grade`, sur laquelle se recalculent les plages. Les masques qu'écrivait
        Caramel avant D86 sont relus « tout » : réécrits, ils prennent les valeurs d'Éléa.
      - **Aperçu** (`simulators/elea-test.js`) : suit le comportement. Différé (défaut) :
        ni « Vérifier » ni correction pendant la tentative, « Précédent » si la navigation
        est libre, « Terminer le test » corrige tout, puis note, feedback global,
        correction par question et « Revoir mes réponses » selon le préréglage. Interactif :
        « Vérifier », un essai de plus par indice. Immédiat : une vérification, sans essai
        supplémentaire. L'aperçu montre toujours UNE question à la fois (il ne simule pas
        la pagination).
      - **Pièges** : (1) le `<select>` de l'éditeur affiche sa première option quand la
        valeur stockée n'est pas au menu (ex. 4 tentatives ou masques `custom` relus d'un
        Test importé) : la valeur est conservée, mais l'affichage ment — limite connue.
        (2) Ouvrir la section écrit ses défauts dans les données (comme toutes les
        sections de réglages) : l'éditeur se dit alors « modifié ». (3) Les réglages
        n'entrent JAMAIS dans l'IA : un `quiz_settings` sorti d'un modèle serait borné par
        `resoudreReglagesTest` (toute valeur hors domaine → défaut) mais n'a rien à y faire.
      - **Feedback global produit par l'IA** : le prompt général en demandait un, mais le
        contrat JSON de `prompt_elea_test` ne le décrivait pas ; les deux tranches visibles
        dans l'éditeur restaient donc vides. Le contrat exige désormais quatre tranches à la
        racine `overallfeedback`, que la canonicalisation replie dans
        `quiz_settings.overallfeedback` avant l'export. Le banc suit leurs quatre messages
        jusque dans `<feedbacks>` du `quiz.xml`.
      - **Fichiers PARTAGÉS avec Sucrerie touchés** (à recopier par `cp`) :
        `js/moodle/mbz-course-builder.js`, `js/moodle/test-backup-builder.js`,
        `js/moodle/test-io.js`, `js/editor/content-detector.js`. Côté Sucrerie, ajouter les
        26 clés `editor_test_*` nouvelles à SES 12 locales (sinon les libellés s'affichent
        bruts). Le simulateur de Sucrerie est sa propre copie : il ne suit pas les réglages
        tant qu'on ne l'y porte pas.
      - **Sondes** : `node scripts/generer-test-regle-sonde.mjs` → `tests/.sondes-elea/`
        (Test seul par défaut, Test seul réglé, parcours d'un Test réglé), avec la liste
        de ce qu'Éléa doit montrer après restauration. Bancs : `mbz-quiz-backup.mjs`
        (120/0), `run_parcours_course.mjs` (114/0), `run_test_edition_audit.mjs` (59/0),
        suite navigateur `behaviour-settings` (défauts de l'éditeur = défauts du `.mbz`).
- [ ] **D87 — Une séquence de langue vivante est rédigée dans la langue enseignée ; correctif
      local validé le 29 sept. 2026, vrai modèle et aller-retour Éléa à rejouer.**
      Retour de professeurs d'anglais (29 sept. 2026) : une Page préparée pour un cours
      d'anglais sortait en français. Mesuré sur le vrai modèle (dev2, mistral-small-4) :
      « Professeur d'anglais, Seconde, Identités et échanges » → Page à 98 % en français,
      et un quiz à 100 % — le défaut n'était pas propre à la Page. Cause : la règle commune
      « rédige dans la langue cible (français sauf indication contraire) » laissait le
      modèle trancher, et un thème culturel l'emportait sur le rôle.
      - **Règle commune** (`prompt_regles_pedagogiques_communes`, 11 locales) : langue de
        l'interface par défaut ; mais si le rôle est d'enseigner une langue vivante (DNL,
        section européenne comprises) ou si l'objectif est d'apprendre une langue, TOUT ce
        que lit l'élève est dans la langue enseignée, « même quand le thème est culturel »
        (sans ce membre de phrase, le cas « Identités et échanges » restait en français),
        au niveau du public (CECRL) ; seules les consignes peuvent rester dans la langue de
        l'interface pour des débutants. Le breton garde sa règle « tout en breton » (§ 14
        du CLAUDE.md), voulue.
      - **Parcours** : le plan et les modules de la plateforme suivent la même exception
        (`regleLangue()` de `scenario-prompt.js`, qui remplace « Rédige TOUS les textes en
        <langue de l'interface> ») ; les objectifs, destinés à l'enseignant, restent dans la
        langue de l'interface. Les cartes, elles, suivent la règle commune : D82 respecté.
      - **Renforcement après l'écart réel** : `content-language.js` reconnaît explicitement
        la langue enseignée dans le rôle ou l'objectif et injecte une consigne obligatoire,
        placée après les règles communes, dans les prompts d'activité, de plan et de module.
        La détection refuse le faux positif « professeur d'histoire — Révolution anglaise ».
        Le banc 58/0 couvre anglais, espagnol et ce témoin ; il ne remplace pas un nouvel
        appel au modèle ni la restauration sur Éléa.
      - **Mesures après** : Page « Identités et échanges » 97 puis 100 % d'anglais, titres de
        blocs compris ; quiz : questions, réponses et retours en anglais (le feedback global
        par tranche reste parfois en français) ; Page d'espagnol en espagnol ; Livre de DNL
        en anglais. Témoins intacts : un professeur d'histoire sur « la Révolution anglaise »
        et un professeur de lettres restent en français.
      - **À surveiller** : aucun parcours réel de langue vivante n'a encore été rejoué
        (`scripts/generer-parcours-reel.mjs`) ; le faire avant d'annoncer la correction pour
        les parcours.
- [x] **D88 — Une image envoyée depuis l'ordinateur dans une Page ou un Livre.**
      Retour de professeur (29 sept. 2026) : « l'édition de la Page ne permet pas de rajouter une
      image ». Un bloc n'acceptait qu'une adresse à coller (`img_src`, cinq champs dans quatre
      blocs : #08 cartes, #09 gauche/droite, #13, #16).
      - **Éditeur** : `editor/index.js` (non partagé) greffe `img_file` juste après chaque
        `img_src`, sur les schémas VIVANTS de `getPageBlockSchema()` (communs à la Page et au
        Livre ; l'ordre des clés est celui de l'affichage, l'objet est reconstruit). C'est le
        widget image de l'éditeur (`renderImageField`) réglé en processeur « fond » : PNG et JPEG
        gardés (transparence comprise), 1 920 px au plus, HEIC/TIFF/AVIF/BMP/SVG convertis,
        12 Mo. `field-renderers.js` (partagé avec La Sucrerie) n'est PAS touché : la Sucrerie ne
        sait pas encore joindre les images au backup, elle aurait montré un champ dont l'image se
        perdait. Une clé nouvelle, douze langues (`editor_page_image_upload_hint`).
      - **Backup** : `moodle/page-images.js` sort les images du JSON AVANT la réparation LaTeX,
        vérifie la signature du format (un scénario importé est un fichier tiers), les nomme
        d'après leur contenu (`image-<sha1:12>.<ext>` : une image citée deux fois n'est posée
        qu'une fois, deux exports donnent le même fichier) et remplace `img_src` par
        `@@PLUGINFILE@@/<nom>` sur la copie rendue. Zones : `mod_page`/`content`/0 ;
        `mod_book`/`chapter`/identifiant du chapitre (`PREMIER_ID_CHAPITRE` = 100, partagé avec
        `buildChaptersXml`). L'image envoyée l'emporte sur l'adresse ; la retirer fait revenir
        l'adresse. L'aperçu reçoit le même HTML, dataURL remise ; aucune dataURL dans le `.mbz`.
      - **Pose des fichiers** : `construireFichiersActivite()` les rend à part (`paquet`) ; la
        Page ou le Livre SEULS les posent par `fichiersMonoActivite()` (éditeur,
        `notifications.js`) ; le parcours les passe en `joints` à `joindreFichiersInitiaux()`
        après l'assemblage, comme le Paquetage IMS — `mbz-course-builder.js` n'est pas touché.
        `fichiers-modules.js` est DÉPLACÉ de `js/parcours/` vers `js/moodle/` : la couche Moodle
        n'a pas à dépendre de l'atelier.
      - **Piège évité** : dans l'atelier, `recueillirMedias()` range les octets de toute image
        `images/…` dans `carte.medias` et ne laisse que le chemin dans le contenu. Sans
        `contenuPourEdition()` avant la mise en forme (assemblage, aperçu de carte, cours
        documentaire), l'image se perdait en silence.
      - **Documents — écart corrigé lors de la contre-vérification du 29 sept.** :
        `hydrateImagesForExport` transmet les cinq images des quatre blocs illustrés dans
        `img_src`. `document-formatter.js` traite désormais aussi
        `#13_monument_sheet_long` : les vrais DOCX, ODT et PDF reçoivent #08, les deux côtés
        de #09, #13 et #16. Ce formateur est partagé avec la Sucrerie : report effectué
        le 29 sept. sur `emmanuel`, copie byte-identique et manifeste SHA-256 vérifiés.
      - Banc `tests/run_page_images.mjs` (45 contrôles, quatre contre-épreuves embarquées :
        extraction, transmission du `paquet`, réhydratation des médias et retrait du cas #13
        dans le formateur documentaire). Sondes :
        `node scripts/generer-sonde-page-images.mjs` → `tests/.sondes-elea/` (Page, Livre,
        cours) avec la liste des contrôles. **D24 : rien d'annoncé avant l'aller-retour.**
- [x] **D89 — Le Test étudiant (`mod_studentquiz`) rejoint les modules de la plateforme, sur
      Éléa seul, choisi dans la mosaïque et jamais proposé par le plan. Aller-retour Éléa réussi
      le 30 sept. 2026.**
      Retour de collègues (29 sept. 2026) : « Rajouter test étudiant et les paramètres des tests
      (dispo dans Éléa) ». Les paramètres, c'est D86 ; le Test étudiant, c'est ici. Il REVIENT
      sur D70, qui l'avait écarté parce que « sa banque de questions appartient aux élèves » :
      c'est vrai, mais c'est aussi le cas du wiki ou du glossaire à construire, qui arrivent
      vides avec leur consigne. Même modèle ici : **rien à générer, l'IA écrit la consigne**.
      - **Registre** : `parcours_test_etudiant` dans `MODULES_NATIFS`, `rienAGenerer`,
        `niveau: 'amorce'`, `platforms: ['Éléa']` (palettes relevées : ni Magistère ni Moodle
        nu, D26), **`surDemande`** comme le Paquetage IMS (demande d'Emmanuel : « dans les
        éléments de génération prévus, mais pas dans la liste prévue par défaut ») — le prompt
        de plan ne le voit pas, la mosaïque le propose. Famille « coopérer » : la classe écrit
        ensemble sa banque de questions. Pas `note` : le greffon ne déclare pas de carnet de
        notes (aucun `grades.xml` au relevé) ; des points et un classement, que la consigne
        n'a pas à promettre.
      - **XML** : relevé `sept-2026/elea/studentquiz.xml` (Moodle 5.1.7, greffon 2026030600,
        version identique à la branche `main` du dépôt amont), balise pour balise ; les
        31 réglages hors nom, consigne, `coursemodule` et achèvement sont ceux d'Éléa (barème
        10/5/3/2/−1, 13 types de questions, publication immédiate). Conteneurs d'élèves
        vides. La catégorie de questions n'est PAS à joindre : le greffon la crée au premier
        affichage (`question_make_default_categories`, `mod_studentquiz_load_studentquiz`).
      - **Piège : `<coursemodule>`**. Le greffon garde l'identifiant de son module de cours
        dans sa propre table, et sa restauration le traduit par
        `get_mappingid('course_module', …)` : il doit valoir l'identifiant que le cours donne
        au module, sinon 0 et un Test étudiant qui ne s'ouvre pas. `renumberActivity` (partagé
        avec la Sucrerie) ne le connaît pas : `recalerModulesDeCours()` le recale APRÈS
        l'assemblage, sur le `moduleid` de l'enveloppe `<activity>` — même logique que les
        fichiers joints. `mbz-course-builder.js` n'est pas touché.
      - **Achèvement** : `completion` 2, `completionquestionpublished` 1, `completionpoint` 0
        (Éléa pose `completionpoint` 1). Une règle à 0 est inactive (`get_available_custom_rules`) ;
        « avoir créé une question » ne dépend que de l'élève, alors que les points baissent
        de 1 par réponse fausse et peuvent tenir le total sous le seuil. Le module entre donc
        dans l'ouverture progressive (D71) : l'étape suivante attend sa question.
        **Si la restauration ne garde pas ce réglage**, passer le module `sansAchevement`.
      - **Vignette** : `plateforme-studentquiz.webp`, rendue depuis le pictogramme d'Éléa
        (`theme/image.php/elea/studentquiz/-1/monologo`) comme les vingt autres, fond violet
        « collaboration ».
      - **Libellés** : `parcours_mod_test_etudiant_name` / `_desc` dans les 12 locales ; une
        phrase dans le tutoriel des parcours (12 langues), reprise par
        `scripts/aide-parcours.mjs` dans la fiche RAG `parcours-modules` (écrite, pas ingérée).
      - **Banc** `run_parcours_natifs.mjs`, volet 8 bis (11 contrôles) ; contre-épreuves faites
        à la main : recalage désarmé, achèvement « 1 point », `surDemande` retiré → rouge.
        Sonde : `node scripts/generer-parcours-sonde.mjs --plateforme=elea` (carte « Sonde —
        Test étudiant », étape 6). **À vérifier sur Éléa** : restauration complète ; titre et
        consigne ; en élève, créer une question, y répondre, la noter, la commenter ;
        achèvement « au moins 1 question » sans condition de points ; l'étape suivante
        s'ouvre après la question ; ré-export : `coursemodule` égal au module restauré.
      - **Résultat (30 sept. 2026, Emmanuel)** : la sonde s'importe sur Éléa ; le Test étudiant
        s'affiche avec sa consigne. Aide de Caramelia : les 12 fiches `parcours-modules` du RAG
        remplacées le même jour (seule la phrase du Test étudiant différait de la version en
        ligne, vérifié par empreinte).
- [x] **D90 — Les chemins selon les résultats : UN mécanisme, l'aiguillage. La note d'un
      test ouvre à chaque élève un chemin parmi deux à quatre, puis tous se retrouvent.
      Livré le 30 sept. 2026 (7.1.0) ; aller-retour Éléa PARTIEL le soir même (compte
      enseignant), la vue d'un vrai compte élève reste à voir (D24).**
      Demande d'Emmanuel et de Gauthier (30 sept. 2026) : « si un élève se trompe, en fonction
      du score plutôt, il est redirigé vers la remédiation ou autre chose » ; les modèles de
      Gauthier (`gabarit-de-parcours-de-differenciation-pedagogique-.mbz`,
      `au-bonheur-des-dames-seance-3-sur-la-langue.mbz`, transmis le 30 sept. 2026 et non
      versionnés) ouvrent des sections cachées de
      niveaux débutant, intermédiaire, avancé selon un test. Tranche D34.
      *Pourquoi un seul mécanisme* : différencier dès le départ (test de positionnement) et
      remédier en cours de route (point de contrôle) ne diffèrent que par la PLACE du test ;
      deux mécanismes auraient fait deux écrans, deux prompts et deux passes pour le même objet.
      - **Modèle** : une étape PEUT être un chemin, `etape.chemin = { depuis: <pourcentage> }`,
        et rien d'autre n'est stocké. Tout le reste se DÉDUIT (`js/parcours/aiguillage.js`, pur) :
        des étapes-chemins consécutives forment UN aiguillage ; le test est la DERNIÈRE activité
        notée qui peut aiguiller dans l'étape d'avant ; les rôles viennent du rang et du nombre
        (`ROLES_PAR_NOMBRE` : 2 → Renforcer, Approfondir ; 3 → + Consolider au milieu ;
        4 → Reprendre les bases, Renforcer, Consolider, Approfondir) ; l'étape commune est la
        première étape ordinaire qui suit. Deux sources pour une même information finissent
        par se contredire (§ 4) : un plan de l'IA, un scénario importé ou une retouche ne
        peuvent pas désaccorder un rôle stocké et une position.
      - **Seuils** : gardés en POURCENTAGE (un test régénéré avec deux questions de moins garde
        la même exigence), lus et réglés en BONNES RÉPONSES (`bornesEnReponses`), écrits dans
        le cours à MI-POINT : seuil = (k − 0,5) / n × 100, à deux décimales. La note est rangée
        à cinq décimales (`decimal(10,5)`) : aucune note atteignable ne tombe sur un seuil,
        quel que soit l'arrondi. Par défaut : 60 (2 chemins), 40/75 (3), 25/50/75 (4) ; questions
        conseillées : 8, 10, 12 — trier en trois sur cinq questions, c'est laisser une réponse
        décider (repère de relecture, pas un blocage).
      - **Conditions** (règles relues dans Moodle 5.1, `public/availability/`) : chemin
        `{op:'&', c:[{type:'grade', id, min?, max?}], showc:[false]}` ; étape commune
        `{op:'|', c:[un « & » d'achèvements par chemin], show:false}` ; fin du parcours (D96)
        `{op:'&', c:[achèvements communs…, {op:'|', …} par aiguillage], showc:[false…]}`.
        Une racine « & » exige `showc` (tableau de même longueur que `c`), une racine « | »
        exige `show` ; les sous-groupes n'en portent pas ; `id` doit être un ENTIER
        (`is_int`, un `"42"` est refusé) ; `min` inclus, `max` exclu ; pas de note = faux ;
        un groupe vide = vrai. `restore_update_availability` traduit à la fin de la
        restauration les éléments de note et les modules cités ; un identifiant non traduit
        devient 0. `verifierCondition()` refuse tout ce que `tree.php` refuserait.
      - **Où** : APRÈS l'assemblage, comme D33 — `mbz-course-builder.js` n'est pas touché.
        Ordre des passes : `poserAchevementsH5P` (D100) → `poserAiguillages`
        (`aiguillage-cours.js` : lit `<grade_item id>` dans le `grades.xml` du test, écrit
        les conditions des chemins, de l'étape commune et de la fin, `grademethod` 4 sur le
        test H5P) → `poserProgression` (ne remplit que les sections encore LIBRES : elle ne
        peut ni écraser un chemin ni conditionner l'étape commune sur le seul dernier chemin)
        → `poserDurees` (D97). Un chemin sans activité prête bloque la livraison
        (`parcours_chemins_incomplets`, qui nomme le rôle) : jamais d'élève sans suite ; la
        livraison partielle (D49) reste possible pour tout le reste.
      - **Plan** : l'aiguillage s'affiche en un bloc — la barre des scores (un carré par score,
        de la couleur du chemin qu'il ouvre), une ligne par chemin avec sa plage et deux
        boutons − / + (« Ouvrir “Approfondir” dès une bonne réponse de moins »), les chemins
        en colonnes, « Ajouter un chemin », « Retirer un chemin », « Un seul chemin pour tous »
        (avec « Annuler »). Une étape qui finit par un test propose « Ouvrir des chemins selon
        ce test » : l'étape suivante se décline, ses copies reprennent SA structure. Le test
        porte le badge « Oriente les élèves ». Les flèches de déplacement ne font jamais
        sortir une carte de son chemin ; seules les étapes communes sont numérotées. Le
        bandeau dit ce que vit UN élève : chemins, activités par élève (et à fabriquer),
        durée par élève — de même à la livraison et dans la fiche de séquence.
      - **Bloquant** (`problemesAiguillage`, relu par `validerPlan`) : moins de deux ou plus
        de quatre chemins, chemins en tête du plan, pas de test, moins de questions que de
        chemins moins un, un chemin vide ou qui ne s'achève jamais, un test dans un chemin.
        **Repères de relecture** (garde-fous, seulement avec des chemins) : un test oriente,
        assez de questions, chemins parallèles (même nombre d'activités à un près, durée à
        75 % au moins) ; la série de trois types identiques se compte par suite d'élève, la
        durée tenable sur le plus long chemin.
      - **Prompts** : celui du plan reçoit, pour chaque rôle, sa consigne de gradation
        (`CONSIGNES_ROLES` : reconnaître avec un exemple résolu → retrouver → produire sans
        modèle), les règles communes (même objectif, mêmes notions, chemins parallèles, aucun
        texte ne dit à l'élève son niveau) et la consigne du test (toutes les notions, une par
        question, difficulté étagée). Il rend aussi `conclusion` (D96). Les prompts des
        ACTIVITÉS ne changent pas (D82) : le parcours leur ajoute un cadre « chemin » ou
        « test qui oriente », et `historiqueDeLaCarte()` ne cite que ce que l'élève a vu sur
        SON chemin — jamais les activités des autres.
      - **Scénario** : format 2 dès qu'il y a des chemins (le format 1 reste écrit sinon) ;
        l'import lit les deux et renormalise (`normaliserAiguillages`).
      - **Contrôles** : `run_parcours_chemins.mjs` (Node pur, en CI, 37 contrôles) balaie 1 à
        30 questions × 2 à 4 chemins × seuils quelconques × tous les scores, notes sur 100 et
        sur 10 ; `run_parcours_aiguillage.mjs` (56) assemble trois vrais cours, les relit comme
        Moodle et fait passer un élève par chaque score, avec trois contre-épreuves, puis
        l'interface par de vrais clics. **À faire sur Éléa** : `node scripts/generer-parcours-sonde-chemins.mjs`
        (deux aiguillages, trois élèves, fiche de relevé) — **rien n'est annoncé avant (D24)**.
- [x] **D91 — Le choix se fait au cadrage : « Tous vos élèves suivent-ils le même chemin ? »**
      Après l'ampleur, avant la trame : « Un même chemin pour tous » / « Des chemins selon les
      résultats », puis « Combien de chemins ? » (2, 3, 4). *Pourquoi là* : la réponse change
      les trames proposées, le prompt du plan et son calibrage ; la poser au plan obligerait
      à tout refaire. Tout se retouche ensuite dans le plan. Les deux listes de trames ne se
      mêlent pas ; « Structure libre » vaut pour les deux (des chemins sans modèle : une étape
      de test, les chemins, une étape commune).
- [x] **D92 — Trois modèles à l'écran, puis « Voir les autres modèles ».** *(Choix des trames
      montrées revu par D102 : une vitrine de quatre intentions.)* Retour de Gauthier :
      « beaucoup de modèles, les gens se perdent ». Les trois premiers compatibles avec la
      modalité et l'ampleur s'affichent en cartes, avec « Caramel propose » ; les autres, sous
      un bouton qui dit leur nombre, en lignes rangées par famille (séance, séquence, projets,
      démarches particulières) — le champ `famille` sert enfin. Une trame choisie parmi les
      autres les garde dépliées. En mode chemins : les deux trames à chemins et la structure
      libre, sans « Caramel propose ». « Différenciation à trois vitesses » devient
      **« Différencier dès le départ »** (test de positionnement, chemins, écrit commun) ; nouvelle
      trame **« Remédier en cours de route »** (découvrir, point de contrôle, chemins, test
      final). Une trame à chemins porte `CHEMINS` à la place d'une étape ; `adapterTrame` la
      déplie en k étapes selon le nombre choisi, avec des longueurs par ampleur et par k qui
      tiennent les douze activités fabriquées (D5) et l'ampleur PAR ÉLÈVE (D101). Pas de
      trame à chemins sur une séquence entière : elle dépasserait douze activités à fabriquer
      (message dédié ; la structure libre reste possible).
- [x] **D93 — La première tentative décide, et une question vaut un point.** Test H5P noté sur
      la PREMIÈRE tentative (`grademethod` 4), sans « Recommencer » ; Test Moodle à une
      tentative. Pour réorienter un élève, l'enseignant modifie sa note au test dans le
      carnet de notes (l'aide du plan et l'étiquette enseignant le disent). Les seuils se
      lisent « k bonnes réponses sur n » : il faut UN point par question. D'où
      `reglagesDuTest()`, posé à la génération ET de nouveau à l'assemblage (une retouche dans
      l'éditeur ne peut pas le défaire) : `singlePoint` sur chaque QCM (sinon une question à
      deux bonnes réponses vaut deux points), plus de tirage partiel (`poolSize`), pas de
      reprise. Peuvent aiguiller : **Quiz QCM, Quiz Vrai/Faux, Test**. Écartés : le Quiz mixte
      (un texte à trous compte un point par trou), la Série de choix uniques (jamais notée,
      D100), la Leçon (pas de note avant la première tentative), le Devoir (noté à la main),
      les greffons d'Éléa (jamais éprouvés comme condition).
- [x] **D94 — Ce qui n'est pas pour l'élève reste invisible.** Les autres chemins sont
      MASQUÉS (`showc: [false]`), pas grisés : un élève ne voit ni leur existence ni leur
      niveau. L'étape commune et la fin apparaissent quand on y arrive (`show: false`). Sous
      le test, une étiquette dit à l'élève que la suite s'affichera à la fin du test (sans
      elle, le cours semble s'arrêter là). En tête de chaque chemin, une étiquette cachée aux
      élèves (`visible` 0) dit à l'enseignant à qui il s'ouvre, en bonnes réponses — Moodle
      ne lui montre qu'« une note dans un certain intervalle ».
- [x] **D95 — Pas de Carte de progression avec des chemins.** `mapmodules` liste les
      activités de toutes les sections et montre celles qu'on ne peut pas ouvrir comme des
      étapes verrouillées : chaque élève verrait les autres chemins, verrouillés pour
      toujours. Le réglage est désactivé sur le plan, avec la raison.
- [x] **D96 — « Fin du parcours » dans TOUS les parcours.** Demande de Gauthier : « Bravo, tu
      as fini ton parcours ». Une dernière section, masquée jusqu'à ce que l'élève ait
      achevé tout ce qui s'achève (avec des chemins : son chemin de chaque aiguillage), qui
      porte « Bravo ! Le parcours est terminé. » et le mot de la fin écrit avec le plan
      (`plan.conclusion`, champ du prompt et de l'écran du plan). Posée seulement si une
      activité au moins s'achève. Linéaire ou non : c'est le même bloc.
- [x] **D97 — La durée est écrite dans le cours.** « Durée estimée : 10 min » en tête de la
      description de chaque activité, et `showdescription` à 1 pour qu'elle se lise sous le
      lien ; l'accueil (section 0, désormais toujours présent) dit la durée du parcours —
      celle d'UN élève, en fourchette si ses chemins diffèrent. `durees-cours.js` lit
      `translations` et non `t()` : `t()` rend la CLÉ quand elle manque, et le repli
      français ne jouerait jamais.
- [x] **D98 — Un parcours à chemins s'importe dans un cours VIDE.** En fusion, Moodle range les
      sections du fichier dans celles du cours, par numéro ; une section existante garde
      son nom et reçoit notre restriction si elle n'en avait pas — les sections de
      l'enseignant hériteraient des conditions des chemins. La livraison le dit (première
      étape « créez un cours VIDE », et pourquoi).
- [x] **D99 — Des rôles pour l'enseignant, des tâches pour l'élève ; jamais de lettre, jamais de
      pourcentage à l'écran.** Retour d'Emmanuel sur la maquette (30 sept. 2026) : « chemin A,
      chemin B, à partir de −4 » ne se comprenait pas. Dans Caramel, un chemin se nomme par
      son rôle (couleur et nom constants : Reprendre les bases, Renforcer, Consolider,
      Approfondir) et sa plage se dit en bonnes réponses (« de 5 à 8 sur 8 ») ; aucun JSON,
      aucun pourcentage. Dans le cours, l'élève lit le TITRE de son chemin, qui dit une
      tâche, jamais un niveau. **« Voir comme un élève »** (`vue-eleve.js`) montre la page du
      cours telle que la plateforme l'affichera, à un moment (avant le test, pendant son
      chemin, chemin terminé, parcours terminé) et pour un score choisi, ou telle que
      l'enseignant la voit ; il reconstruit le cours depuis le plan avec les MÊMES fonctions
      que l'assemblage (`coursDuPlan`). Il s'ouvre depuis l'aiguillage et depuis « Relire le
      parcours ». Les quatre écrans (cadrage, plan, fabrication, livraison) restent.
- [x] **D100 — Un H5P qui ne rend jamais de note s'achève à la CONSULTATION.** Découvert en
      préparant D90, et présent depuis la 7.0 : `mod_h5pactivity` n'enregistre une note que
      pour un énoncé « terminé » portant un score maximal non nul. Frise chronologique,
      Glossaire, Cartes de dialogue, Diagramme, Image interactive, Résumé (il émet
      « answered » sans `completion`), Série de choix uniques, Vidéo interactive, Présentation
      de cours et Livre interactif n'en rendent JAMAIS (ou pas de façon fiable) : achevés « à la note », ils ne s'achevaient jamais, et l'ouverture progressive
      (D33) fermait pour toujours l'étape suivante. `achevement-h5p.js` leur pose
      `completionview` 1 sans élément de note. Corrige le recensement du 6 sept. (§ 6).
- [x] **D101 — Avec des chemins, l'ampleur compte ce que fait UN élève.** Une séance, c'est trois
      ou quatre activités pour l'élève, pas pour Caramel : le calibrage borne les activités
      par élève (tronc commun + un chemin) dans l'ampleur, et le total FABRIQUÉ, tous chemins
      compris, sous le plafond de douze (D5). Le prompt du plan dit les deux nombres ; son
      exemple les respecte (`exempleLibreAChemins` : sur une séquence à quatre chemins, un
      seul temps différencié d'une activité par chemin). Constaté par le banc de calibrage :
      l'exemple d'une structure libre à chemins contredisait sa propre consigne.
- [x] **D102 — La vitrine : quatre intentions, et « Évaluer » règle le Test en épreuve.**
      Retour de Gauthier après un parcours réel (30 sept. 2026, au soir) : « trop de choix,
      et peu de différence entre réviser et remédier à l’évaluation ; il faut plutôt apprendre
      en autonomie, réviser, s’entraîner, évaluer — avec les bons paramètres obligatoires du
      test : une seule tentative, sans feedback, chronométré ». D92 montrait les trois
      PREMIÈRES trames compatibles, dans l’ordre de la bibliothèque : réviser, remédier et
      découvrir se côtoyaient. `VITRINE` (`templates.js`) fixe désormais l’ordre et le choix :
      apprendre en autonomie, réviser, s’entraîner, évaluer, quand la modalité et l’ampleur le
      permettent, complétées jusqu’à trois par les suivantes de la bibliothèque
      (`trameEnVitrine` : une séquence entière montre apprendre, s’entraîner, découvrir).
      - **Deux trames nouvelles**, pour toutes les modalités et les trois ampleurs :
        `autonomie` (découvrir pas à pas par une présentation qui pose des questions, s’exercer
        avec correction immédiate, retenir, vérifier ; chaque consigne se suffit à elle-même)
        et `entrainement` (rappel sans support, exercices avec propositions, les mêmes sans
        propositions, vérification finale ; le cours n’est pas refait).
      - **« Évaluer »** (ex-« Préparer et passer une évaluation ») : une page des attendus
        (ce qui est évalué, la forme, la durée, le barème), un entraînement au format, puis
        le Test. Ses réglages d’épreuve (`reglagesTest` + `chronometre`) sont posés UNE fois, à
        la génération (`reglagesDeTrame`) : une tentative, feedback différé, relecture « note
        seule » (ni réponses, ni correction), temps limite = durée de la carte. L’enseignant
        les retouche dans l’éditeur ; rien ne les réimpose à l’assemblage. La carte du Test
        le dit sur le plan (« Épreuve : une seule tentative, en 20 min, la note seule à la
        fin »). **La page de corrigé qui suivait le Test est retirée** : sans ouverture
        progressive, l’élève pouvait la lire AVANT l’épreuve.
- [x] **D103 — Une consigne d’exercice ne manque jamais en silence.** Même parcours réel : dans
      un Quiz mixte de dix questions, trois exercices (Surligner, Glisser les mots, Texte à
      trous) sont arrivés SANS consigne ; l’élève voyait un texte sans savoir quoi y faire,
      et le retour d’un score faible (« Repérez les mots qui… ») passait pour la consigne.
      Le prompt la demandait ; le pipeline la gardait (vérifié sur l’exemple du dépôt) : le
      modèle l’avait omise. Trois parades :
      - **Le réparateur** remet à sa place (`taskDescription`) une consigne écrite sous un
        autre nom (`consigne`, `instruction(s)`, `question`, `text`…) — activité seule comme
        question de quiz ; il n’en invente jamais (`recupererConsigne`, `json-healer.js`).
      - **La file du parcours** vérifie (`consignesManquantes`) et redemande UNE fois en nommant
        les questions (`rappelConsignes`) ; au second oubli, la carte échoue
        (`parcours_consigne_manquante`) et se refait d’un clic.
      - **Le cadre du prompt** d’un Quiz mixte rappelle la règle (D82 : ajout, pas retouche).
      La fenêtre « IA externe » la refusait déjà : le schéma de l’éditeur tient la consigne
      pour obligatoire (« Question 4 › … › Consigne : ce champ est obligatoire », contrôlé par
      `run_parcours_external_ai.mjs`). La génération d’une activité seule profite du
      réparateur, pas encore de la seconde demande. Bancs : `run_deformations_modele.mjs` (152 consignes déplacées, retrouvées à
      l’identique ; contre-épreuve : 0/152 sans le réparateur), `run_parcours_atelier.mjs`.
- [x] **D104 — La longueur d’une Page ou d’un Livre suit sa durée.** « Pas de différence entre
      une page de 5 minutes et une de 25 » (Gauthier) : la durée fixait le nombre de blocs
      (3 à 6), pas leur longueur. Le prompt de la carte vise désormais environ 80 mots par
      minute de lecture attentive, prise de notes comprise (`motsVises` : 5 min → 400 mots,
      25 min → 2 000). **Mesuré le 1er oct. 2026 sur le vrai modèle** (même sujet, la vraie
      file) : glissée dans la commande en « environ N mots », la consigne se perdait face aux
      « phrases courtes » du gabarit — 457 mots pour 5 min, 742 pour 25 (facteur 1,6). En
      plancher (« au moins N »), la longue montait à 1 841, mais la courte débordait à 1 118.
      Retenu : une FOURCHETTE (`fourchetteMots` : N à N + 30 %), répétée en ligne à part dans
      le cadre de la carte — 480 / 1 146 / 1 390 mots pour 5 / 15 / 25 min (facteur 2,9). Le
      modèle semble plafonner vers 1 400 mots par réponse : une lecture de 25 minutes reste à
      environ 56 mots par minute, ce qui demeure une lecture attentive.
- [x] **D105 — Le vocabulaire suit la plateforme : élèves, stagiaires, étudiants.** « Pour
      Moodle on parle d’étudiant, Magistère c’est pour les stagiaires, et Éléa pour les
      élèves ; dans les choix de bifurcation et tout, c’est important à respecter » (Emmanuel,
      1er oct. 2026, sur une capture du cadrage Moodle qui disait « Tous vos élèves… »).
      Remplacer un mot dans une phrase ne tient pas dans douze langues (articles, élisions,
      accords, cas) : chaque texte de l’atelier qui nomme le public a ses VARIANTES rédigées,
      `<clé>_magistere` et `<clé>_moodle` (125 clés, rangées juste après leur base) ; la clé de
      base parle d’élèves. Le `t()` de `js/parcours/vocabulaire.js` choisit la variante de la
      plateforme du brouillon, ou de celle qu’on lui passe (la fiche, le cours assemblé, la vue
      d’un parcours rouvert depuis sa notification) ; une clé sans variante se traduit comme
      avant. **Aucun module de l’atelier ne prend `t` au cœur** (garde-fou du banc des
      chemins). Portée : le cadrage (repeint sur place quand on change de plateforme,
      `data-key` compris), le plan et ses chemins, « Voir comme un stagiaire / un étudiant »
      (« Le formateur » sur Magistère), la relecture, la fiche de séquence, les descriptions
      des modules de la plateforme (« entre stagiaires », « le groupe » au lieu de « la
      classe », « ses pairs »), et ce que le cours écrit (étiquette de chaque chemin, liste
      « À faire »). Pas de variante là où le texte ne peut pas s’afficher (module absent de la
      plateforme, Carte de progression d’Éléa) ni pour les noms (« Classe inversée », « Classe
      virtuelle »). **Les prompts** gardent « l’élève » comme nom de la personne qui suit le
      parcours (D82) ; hors d’Éléa, la règle de rédaction le définit désormais par la
      plateforme — des STAGIAIRES (« le formateur » pour l’enseignant) ou des ÉTUDIANTS, jamais
      appelés « élèves », « le groupe » et non « la classe », vouvoiement — au lieu de le
      laisser deviner au modèle depuis le seul « public visé ». Banc :
      `run_parcours_aiguillage.mjs` (section G, contre-épreuve : 10 contrôles au rouge si la
      variante n’est plus choisie) et `run_parcours_chemins.mjs` (section 8).
- [x] **D106 — Un trou vidé de son sens est redemandé, dans la file comme en un clic.**
      Vérification de génération réelle du 1er oct. 2026 (parcours Éléa à trois chemins) :
      un Texte à trous du chemin « Approfondir » portait des NOMS DE VARIABLES à la place des
      réponses — `*prix_réduit* €`, `*nombre_élèves* élèves`, `*prix_10cahiers*` —, que
      l’élève n’aurait jamais pu taper. `controle-sortie-ia.js`, qui ne jugeait que Glisser
      les mots, voit désormais cette panne (des mots liés par des tirets bas, sans espace),
      aussi dans le Texte à trous et dans les exercices à trous d’un quiz ; et la file du
      parcours, qui ne l’appelait pas, s’en sert : même seconde demande que pour une
      consigne absente (D103), avec un rappel qui nomme la panne, puis le moins grave des
      deux tirages (une consigne absente reste prioritaire : sans elle, seul un second tirage
      complet sert). « Réponse trop longue » et « même réponse dans plusieurs trous » restent des
      indices : ils déclenchent la seconde demande, mais le banc des parcours réels ne les
      compte pas comme défauts — l'exercice se joue (trois « nombre » à glisser, Moodle,
      1er oct. 2026). En amont, le cadre de la carte d'un Texte à trous, d'un Glisser les
      mots ou d'un Quiz mixte exige la réponse elle-même dans chaque trou : un mot du texte
      ou la valeur calculée, jamais un nom de variable, une lettre-symbole ni le nom de la
      notion — la régénération du même parcours avait rendu `*x* g` et
      `*coefficient* = 200 ÷ 3 = *coefficient*`, que le contrôle ne peut pas distinguer d'un
      exercice d'homophones (« *a* » trois fois) sans fausses alertes. La régénération
      suivante a montré une troisième panne : des variantes qui se contredisent —
      `*situation de proportionnalité/ce n'est pas une situation de proportionnalité*` —,
      alors que `/` sépare des réponses toutes justes : l'élève avait raison quoi qu'il
      écrive. Le contrôle la voit (« réponses contradictoires » : une variante reprend tous
      les mots porteurs d'une autre et y ajoute une négation, ou une paire oui/non,
      vrai/faux), et le cadre rappelle que la barre oblique ne sépare que des variantes
      équivalentes. Banc :
      `run_sources_prompt_tests.mjs` (CI), `run_parcours_atelier.mjs`, et
      `run_parcours_reels.mjs` (constat « trous », avec contre-épreuve).
- [x] **D107 — Le plan reçu se répare avant d’être jugé ; un plan utilisable n’est jamais refusé.**
      Retour d’Emmanuel (1er oct. 2026, matin) : avec « Des chemins selon les résultats »,
      « Composer le plan » tournait, puis revenait à l’étape 1 du cadrage — « il faut absolument
      un healing de génération, […] la génération doit TOUJOURS fonctionner ». Relevé sur 16
      cadrages réels (Mistral Small 4, prompt d’avant D108) : 7 retours au cadrage, tous à
      chemins (7 sur 11), dont 5 pour la SEULE durée des chemins (10, 15 et 15 min : 10 est sous
      les 75 % de 15). D58 renvoyait au cadrage après deux écarts. `reparation-plan.js` (pur,
      comme `json-healer.js` pour une activité) répare désormais chaque réponse AVANT le
      contrôle : cartes sans texte retirées, textes manquants repris d’un voisin, palier ramené
      (synonymes, puis la place de l’étape), module inventé remplacé par le plus proche
      (`resoudreModule`, carte marquée `moduleReplie`), durées entières, étapes-chemins
      regroupées et rôles remis dans l’ordre, test posé avant les chemins (un quiz de l’étape
      converti, sinon un « Test de positionnement » ajouté, textes traduits), durées des chemins
      égalisées. La reprise unique de D58 ne porte plus que sur ce qui reste. Après elle, le
      DERNIER RECOURS ramène le meilleur des deux plans à la forme demandée — chemins en trop
      retirés, chemins manquants copiés du voisin (ce que fait « Ajouter un chemin »), forme
      visée calculée (longueur des chemins, activités communes) pour tenir sous le plafond de
      douze et dans les bornes « par élève », jamais le test retiré ni une étape vidée, étapes
      en trop fusionnées avec leur voisine — et le plan est RETENU, écarts restants compris.
      Seule une réponse sans aucun plan échoue encore : deux réponses illisibles (une réponse
      illisible est désormais redemandée une fois, au lieu d’échouer aussitôt), ou aucune
      activité. La réponse collée d’une IA externe passe par la même réparation. La boucle
      (`composition-plan.js`) est partagée par l’atelier et le relevé sur le vrai modèle.
      Bancs : `run_parcours_reparation.mjs` (Node, CI) — les 25 plans réels du relevé (les 18
      refusés deviennent tous conformes, les 7 conformes ne bougent pas), 300 plans réels abîmés
      au hasard (15 000 essayés sur trois graines), idempotence, contre-épreuve ;
      `run_parcours_calibrage.mjs` (modes « echec » : plan ramené à l’ampleur et retenu,
      « illisible », « relance »).
- [x] **D108 — Le prompt du plan montre un exemple complet, de la forme demandée.**
      « Peut-être que le prompt n’est pas assez cadré, avec un exemple en plus du modèle, comme
      on le fait pour chaque activité » (Emmanuel, même matin). Le format de sortie n’était qu’un
      squelette de « … » dont toutes les cartes duraient 10 minutes : il ne montrait ni la
      longueur des textes, ni des durées plausibles, ni des chemins qui durent autant, et la
      règle ne disait que « durées proches ». `exemple-plan.js` produit un plan COMPLET sur un
      AUTRE sujet (le cycle de l’eau), de la forme exacte demandée : mêmes étapes, mêmes nombres
      d’activités, test et chemins à leur place, modules de la trame, paliers imposés, chemins
      de même durée ; tutoyé sur Éléa, vouvoyé sur Magistère et Moodle (D105). Une phrase chiffre
      la durée de chaque chemin, la règle exige « la MÊME durée totale à 5 minutes près », et
      l’exemple reste la dernière chose du prompt. Le banc vérifie, pour les 600 cadrages
      possibles (plateforme, modalité, ampleur, chemins, trame), que l’exemple passe lui-même
      le contrôle, a la forme demandée et le registre de la plateforme.
- [x] **D109 — Une activité se met en forme dès la fabrication.** Parcours réel d’Emmanuel
      (1er oct. 2026, « Découvrir les natures des angles ») : la Rédaction « Défi : décrire un
      angle dans un objet » écartée à la LIVRAISON, « erreur de mise en forme » — un mot-clé à
      `occurrences: 0`, que `Essay.js` rejetait (« occurrences invalides »). Trop tard pour la
      redemander. Deux corrections : (1) un réglage hors bornes se RÉPARE au lieu d’être rejeté
      — `reparerRedaction` (processeur, pour un contenu déjà enregistré) et `healEssay`
      (réparateur, y compris dans un quiz) ramènent occurrences et points à 1, un pourcentage
      au-delà de 100 à 100, retirent une longueur négative ; seule une rédaction sans aucun
      mot-clé reste refusée ; (2) `fabriquer` ESSAIE la mise en paquet de la livraison
      (`refusDuPaquet` → `activiteDepuisCarte`) : refusée, l’activité est redemandée une fois avec
      la cause (`rappelMiseEnForme`) ; refusée encore, la carte échoue À LA FABRICATION, avec un
      message clair (`parcours_mise_en_forme`) et « Refaire ». Bancs : `run_heal_rules_tests.mjs`
      (section 5), `run_parcours_atelier.mjs`.
- [x] **D110 — Une image inventée ne s’affiche pas cassée.** Même parcours : la Page portait deux
      `https://via.placeholder.com/300x200?text=…`, un service d’images factices arrêté. Les
      blocs `#08` (cartes) et `#09` (deux figures) affichent leur balise image même vide : ils
      deviennent des paragraphes (titre, texte, légendes) ; `#13` et `#16` perdent l’adresse.
      Deux niveaux, pour ne rien casser (Emmanuel : « l’utilisateur pourrait en ajouter un à la
      main ou utiliser le prompt avec l’IA grand public de son choix ») : PARTOUT, le réparateur
      retire les seuls services factices (`retirerImagesInventees`, placeholder, placehold,
      picsum…) ; dans un parcours, la file retire toute adresse que l’IA de CARAMEL écrit — le
      modèle d’ILaaS ne sait pas trouver de vraie image —, mais pas celle d’une réponse collée
      depuis une IA externe. L’image envoyée par l’enseignant (`@@PLUGINFILE@@`, D88) n’est
      jamais touchée. Le cadre d’une Page ou d’un Livre interdit d’INVENTER une adresse, sans
      interdire les images. Bancs : `run_heal_rules_tests.mjs` (section 6), `run_parcours_atelier.mjs`.
- [x] **D111 — Un trou porte sa réponse : déduite, sinon redemandée.** Essai du 1er oct. 2026 sur
      une carte de proportionnalité : Mistral Small 4 rendait 5 tirages sur 7 sans la réponse
      dans les trous — `*x*` partout, une unité seule (`*km*`, `*g de farine*`), le calcul entier
      (`*250 × 3 = 750*`), réponse et indice inversés (`*farine:325 g/500 g/625 g*`), deux
      valeurs dont une fausse (`*500/300*`) ; et un Texte à trous réel de fractions écrivait
      `*4/6*`, que le lecteur H5P lit « 4 » ou « 6 » (`parseSolution`) : l’élève qui tapait 4/6
      était compté faux. (1) Ce qui se DÉDUIT est réparé (`reponsesDeduitesDesTrous`,
      `json-healer.js`) : le résultat d’un calcul, `*750* g` ; une valeur et son unité mises à
      l’envers, `*600* km` ; une fraction dans une phrase de fractions, deux trous `*4*` / `*6*`.
      (2) Le reste est REPÉRÉ (`controle-sortie-ia.js`) : inconnue dans plusieurs trous, unité
      sans valeur dans une phrase qui compte, plusieurs valeurs en indice, deux valeurs
      différentes, calcul sans résultat — sans fausse alerte sur la grammaire (`*s*`, `*a*`/`*à*`),
      une unité à trouver (`1 000 m = 1 *km*`) ou une durée (`20 *minutes*`). (3) La seconde
      demande dit ce qui n’allait pas (`correctionDesTrous`), dans la file du parcours ET en
      génération « en un clic », qui redemandait jusque-là le même prompt. (4) Le cadre de la
      carte donne les contre-exemples. Bancs : `run_sources_prompt_tests.mjs`,
      `run_heal_rules_tests.mjs` (section 7), `run_parcours_reels.mjs`.
- [x] **D112 — Une page « Bilan du parcours » dans la fin de TOUT parcours.** Demande de Gauthier
      (1er oct. 2026) : « pour chaque parcours, une page de fin pour conclure le parcours, un peu
      un bilan ». Sous l'étiquette « Bravo » (D96), qui reste : l'étiquette félicite, la page fait
      le point. Elle se COMPOSE du plan (`bilan.js`, module pur), sans appel au modèle — rien qui
      puisse échouer ni inventer : l'objectif du parcours ; « Faire le point », une ligne par étape
      COMMUNE (ce qui a été travaillé, le nom de sa section pour y revenir) ; les notions pivots
      (« Les mots à retenir ») ; « Pour consolider ». Les étapes d'un chemin n'y sont pas — chacun
      n'en a suivi qu'un, et les autres lui restent fermés —, ni l'étape qui ne contient que le
      test d'aiguillage, qui ne se repasse pas (D93) ; un encadré dit seulement que le parcours a
      suivi le chemin adapté au résultat. Textes IMPERSONNELS : ni « tu » ni « vous », ni élève ni
      stagiaire, une même phrase pour les trois plateformes (D105). C'est une Page de Caramel
      (module dont l'aller-retour est fait), au thème des autres Pages du parcours ; marquée
      `scenario` comme les étiquettes, elle ne compte pas parmi les activités, n'a pas de durée,
      et la condition de la fin ne l'attend pas (elle ne porte que sur les sections du plan) —
      elle s'ouvre avec sa section. Un échec de mise en forme la retire, jamais le parcours.
      Visible dans l'écran du plan (note sous le mot de la fin), « Voir comme un élève » et la
      fiche de séquence. Banc : `run_parcours_reels.mjs` (présente, dans la dernière section,
      objectif et mots à retenir repris, sans condition propre, absente de la condition de la fin),
      `run_parcours_course.mjs`, `run_parcours_aiguillage.mjs` (et « Voir comme un élève »),
      `run_parcours_chemins.mjs` (Node, CI : composition pure). Une étape sans objectif (plan parti
      du modèle) reprend ceux de ses activités, ou leurs titres. En l'écrivant, le banc a trouvé
      qu'une étape sans titre devenait la section « Plan 5 » : l'assemblage empruntait
      `parcours_step_plan`, le « Plan » du fil d'Ariane ; c'est désormais « Étape 5 »
      (`parcours_fiche_etape`).
- [x] **D113 — Refermer des chemins garde un chemin ÉCRIT.** « Un seul chemin pour tous » gardait
      « Consolider », le chemin médian (le plus juste pour tous quand les chemins ont été conçus
      ensemble). Mais juste après « Ouvrir des chemins selon ce test », les chemins ajoutés sont des
      COPIES VIDES (mêmes types, aucun texte) : sur trois chemins, « Consolider » en est une, et
      refermer rendait l'étape d'origine vidée de ses activités. Relevé en préparant le tutoriel
      vidéo et le kit de formation (2 oct. 2026), qui conseillaient ce bouton pour revenir en
      arrière. `fermerChemins` garde désormais « Consolider » s'il est écrit (un titre ou un contenu
      dans ses activités), sinon le premier chemin écrit. Banc `run_parcours_chemins.mjs` (Node, CI),
      avec sa contre-épreuve : les deux cas (copie vide, tous écrits). Même jour, même écran :
      « Annuler la modification » rendait le focus au PREMIER champ du plan, ce qui faisait remonter
      la page tout en haut ; il revient sur l'activité ou l'étape rétablie, sans saut
      (`run_parcours_relecture.mjs`).
- [ ] **D10 — Nom public du module.** L'interface dit « Créer un parcours » (le mot d'Éléa
      et de Magistère). Un nom interne reste à arrêter si on en veut un.

---

## 3. Périmètre par lot

### Lot 1 — Le socle : d'une intention à un `.mbz`

#### 1a. Point d'entrée et coquille — **fait**
- [x] ~~Pastille flottante symétrique~~ → **entrée « Parcours » dans la barre d'en-tête**
      (D38, 6 sept. 2026), i18n, point de reprise, `aria-expanded`, `prefers-reduced-motion`
- [x] ~~Libellé déplié une fois au chargement sur tactile~~ (sans objet : le libellé est
      celui de la barre, effacé sous 600 px comme ceux de Tchap et Sucrerie)
- [x] ~~Gabarit téléphone aligné sur Caramelia~~ (sans objet)
- [x] ~~Atelier plein écran, piège de focus, `Échap`, verrou du défilement de fond~~ →
      **atelier DANS la page, à la place des tuiles** (D39, 6 sept. 2026) : bascule par le
      bouton d'en-tête, formulaire de l'accueil conservé, en-tête intact
- [x] Fil des quatre étapes (≥ 900 px) et compteur textuel en deçà
- [x] Repeint au changement de langue (événement `caramel:language-changed`)
- [x] Brouillon en `sessionStorage` (préfixe `caramel_`), pastille de reprise
- [x] Point de reprise branché et vérifié : la pastille porte son rappel, et rouvrir
      l'atelier ramène sur le PLAN, pas sur le cadrage

#### 1b. Écran 1 « Cadrage » — **fait**
- [x] ~~Récapitulatif du contexte en lecture seule, pièces jointes comprises~~ → retiré
      (D39) : le formulaire est juste au-dessus ; seule reste la note des documents joints
- [x] ~~Retour vers la page d'accueil pour toute modification~~ (sans objet depuis D39)
- [x] Choix de plateforme (dégradés repris de la barre de filtres)
- [x] Choix de modalité et d'ampleur
- [x] Neuf trames filtrées par modalité et ampleur, avec aperçu du rythme
- [x] Carte « Laissez Caramel proposer », toujours présente (jamais d'état vide)
- [x] Action primaire désactivée tant que le sujet manque, avec la raison affichée
- [x] 17 trames avec aperçu de structure, filtrées par modalité et ampleur
- [x] Départ **sans IA** depuis un modèle (46 ms), et marquage « personnalisé »
- [x] 136 clés dans les 12 locales, parité et ordre conformes

#### 1c. Écran 2 « Plan » — **fait**
- [x] `scenario-prompt.js` : prompt de plan + les 10 à 15 **notions pivots**
- [x] Injection du corpus joint et des types suggérés par la trame
- [x] Appel court et isolé, voile de composition, annulation
- [x] `activity-router.js` : liste close de modules, contrainte par la plateforme,
      repli marqué sur la carte quand le modèle invente un identifiant
- [x] Tableau de bord : tout éditable sur place, réordonnancement par flèches,
      suppression, ajout, **verrouillage d'une carte**
- [x] Recalcul en direct du nombre d'étapes, d'activités et de la durée totale
- [x] Relecture didactique affichée sur le plan (les six garde-fous, § 5)
- [x] Glisser-déposer en surcouche des flèches (jamais à leur place) — livré le
      6 sept. 2026 (D36), poignée sur la vignette, activités seulement

#### 1d. Écran 3 « Fabrication » — **fait**
- [x] `parcours-runner.js` : file en série stricte — **une seule requête en vol**, pas deux
      (D7 pose un plafond de deux ; aucun gain de temps ne vaut le risque de replis en
      cascade). Contre-épreuve : le banc horodate chaque appel et refuse le moindre
      recouvrement.
- [x] Socle commun + historique des étapes précédentes injectés dans chaque remplissage
      (« réinvestis, ne réintroduis pas »), palier respecté. L'historique s'arrête à la
      carte courante : une activité ne peut pas réinvestir ce qui vient après elle.
- [x] Jauge globale, statut par ligne, annulation, reprise après échec, régénération
      unitaire. Un échec n'arrête PAS la file : la carte est marquée, la suivante part.
- [x] `json-healer.js` sur CHAQUE activité — vérifié par un contenu de modèle privé
      d'`overallFeedback`, qui doit ressortir avec.
- [x] Bouton « modifier » ouvrant l'éditeur visuel existant, dans un panneau de l'atelier
- [x] 46 clés supplémentaires dans les 12 locales (parité et ordre conformes)

#### 1e. Portage du constructeur de cours — **fait** (D9 tranché)

`mbz-course-builder.js` : 1848 lignes, 38 exports, zéro import. Le porter, c'est
essentiellement un `cp` — mais quatre points demandaient une décision explicite. Il y en
avait cinq, et deux surprises (D17, et les octets bruts de `createMbz`).

> **La propagation côté Sucrerie est FAITE** (4 sept. 2026), sur la branche `emmanuel` de
> `sucrerie.forge.apps.education.fr` — `main` n'est pas touchée. Les deux dépôts portent le
> même fichier, byte pour byte.

- [x] **Copier** `sucrerie/assets/js/moodle/mbz-course-builder.js` →
      `caramel/js/moodle/mbz-course-builder.js`
- [x] **Paramétrer les constantes qui nomment La Sucrerie** — il y en avait CINQ (D17),
      plutôt que de les laisser mentir sur l'origine du fichier produit. Un backup fabriqué par Caramel ne
      doit pas se déclarer venu de sucrerie.forge.apps.education.fr :
      - `ORIGINAL_WWWROOT` (l. 42) et `SITE_HASH` (l. 43) → écrits dans `moodle_backup.xml`
        comme `<original_wwwroot>` / `<original_site_identifier_hash>` ;
      - `<name>sucrerie</name>` (l. 380) → nom de la catégorie de cours ;
      - `QUIZ_HOSTNAME` (l. 1013) → entre dans le `stamp` de chaque question
        (`hostname+timestamp+seq`).
      Fait : `IDENTITE_DEFAUT` + `resoudreIdentite()`, valeurs par défaut inchangées (celles
      de La Sucrerie), descendues par `assembleCourseFiles` jusqu'au `stamp` de chaque
      question. Caramel fournit `IDENTITE_CARAMEL` (`parcours/parcours-builder.js`).
      **Contre-épreuve passée** : appelé SANS identité, le constructeur porté rend les
      **59 fichiers identiques** à la version d'origine ; avec l'identité Caramel, exactement
      quatre changent (`moodle_backup.xml`, `course/course.xml`, `moodle_backup.log`,
      `questions.xml`) et plus aucun ne mentionne l'autre hôte.
- [x] **Inscrit au manifeste** `scripts/lib/shared-files.mjs` côté Sucrerie, dans la
      famille « éditeur » — non par abus de langage, mais parce que c'est
      `diff-editor-vs-caramel.mjs` qui la contrôle, et que les thèmes de Page y sont déjà
      pour cette raison. `node scripts/diff-editor-vs-caramel.mjs` : **27 identiques,
      0 divergent**. Manifeste sha256 régénéré (42 fichiers).
- [x] **Court-circuiter `extractMbz` côté Caramel.** Fait dans
      `parcours/parcours-builder.js:activiteDepuisCarte()`, qui aiguille chaque carte vers
      l'une des TROIS voies du constructeur :
      • **H5P** → `packageActivity()` rend les octets du `.h5p`, dont on calcule l'empreinte
        `sha1` (le `contenthash` de Moodle) → `{kind:'h5p', …}` ;
      • **Test** → `canonicalizeTestModel()` rend le modèle de banque → `{kind:'quiz', model, …}`,
        que le constructeur régénère ;
      • **autres modules Moodle** → `construireFichiersActivite()` (D16) rend
        `{files, moduleName, activityDir}`, renumérotée en place.
      Une carte sans contenu, au module non géré ou dont la mise en forme échoue est ÉCARTÉE
      **avec son motif** (`MOTIFS`), jamais omise en silence.
- [x] **`createMbz` laisse passer les octets bruts.** Il repassait tout par `fflate.strToU8`,
      y compris un `Uint8Array` : le `.h5p` du pool de fichiers en serait sorti corrompu, sans
      erreur. Vérifié par aller-retour réel sur l'archive produite (le `.h5p` ressort octet
      pour octet).
- [x] **Propagé côté Sucrerie**, branche `emmanuel`. Les deux appels fournissent désormais
      `ecrireArchive: buildMbz` (`collection-export-bridge.js` et le spike). Contrôles
      Sucrerie repassés : suite navigateur du constructeur **41 PASS / 0 FAIL**,
      `smoke-mbz-course.mjs` vert, `gen-shared-manifest.mjs --check` et
      `check-shared-i18n.mjs` verts (les deux tournent en CI). Les deux `CLAUDE.md` sont
      mis d'aplomb : 42 fichiers miroir, cinq familles.

#### 1f. Écran 4 « Livraison » — **fait**
- [x] `parcours-builder.js` : appelle le constructeur porté, une entrée par carte du plan
- [x] Les activités écartées sont NOMMÉES sur l'écran, avec leur motif — un parcours qui
      livre sept activités sur huit sans le dire est pire qu'un parcours qui en livre sept
      en le disant : le trou se découvrirait en classe
- [x] La marche à suivre pour importer, en trois lignes, sur place
- [x] Export et import du JSON de scénario (`scenario-io.js`) — il emporte **les contenus
      déjà fabriqués**, sans quoi rouvrir un parcours signifierait repayer ses générations
- [x] Bancs dédiés : `run_parcours_course.mjs` (41 PASS) et `run_parcours_atelier.mjs`
      (40 PASS)
- [x] **Import réel réussi sur Éléa ET Magistère** (4 sept. 2026, sonde du § 10). Les deux
      plateformes affichent le MÊME bandeau rouge à l'étape 6 — un avis de migration, pas
      une erreur (cf. § 7) — puis la restauration va au bout.
- [x] **Ré-export relu, sur les deux plateformes** (4 sept. 2026). Résultat en § 10.
      Toutes les activités reviennent, le Test garde ses 10 slots et ses 15 entrées de
      banque, les `.h5p` reviennent OCTET POUR OCTET. **Un seul défaut, réel : le
      Glossaire** — corrigé en le sortant de la palette (cf. § 7).

### Lot 2 — Ce qui en fait un parcours

> **Le gros morceau du lot 2, c'est l'ouverture de la palette.** Aujourd'hui le plan ne
> peut proposer QUE ce que Caramel sait générer — **31 modules sur Éléa, 28 sur Magistère
> et sur un Moodle nu** (relevé du 4 sept. 2026) : `activity-router.js` construit sa liste
> close à partir de `definitions.js`, donc le modèle ne peut pas même *proposer* un forum.
> C'est cohérent avec la promesse du lot 1 (« d'une intention à un `.mbz` rempli ») mais
> c'est une vraie limite : un parcours réel comporte des espaces d'échange, des ressources
> déposées, un espace de rendu — et un enseignant qui les ajoute à la main après l'import
> retrouve exactement le coût d'assemblage qu'on prétendait supprimer.
>
> **Ce que le portage du constructeur nous apprend sur le chemin à suivre** (relevé le
> 4 sept. 2026, il n'était pas connu quand ce lot a été écrit) — pour chaque module ajouté :
> 1. un **processeur Moodle** dans `js/moodle/processors/activities/` (`buildFiles(data)` +
>    `metadata.moduleName`), puisque Caramel n'en a aucun pour ces modules ;
> 2. sa **mise en forme** dans `js/moodle/mono-activity-files.js` (un `case`), et son entrée
>    dans `TYPE_MOODLE_PAR_MODULE` ;
> 3. son `moduleName` dans **`SELF_CONTAINED_MODULES`** du constructeur de cours — fichier
>    PARTAGÉ, donc à propager côté Sucrerie ;
> 4. son entrée dans `definitions.js` avec le bon `platforms:` — `wordcloud`,
>    `stickynotes`, `board` et `publication` sont des **greffons Éléa** : les proposer sur
>    Magistère ou un Moodle nu produit un import qui échoue.
>
> Les deux niveaux ci-dessous ne demandent PAS de génération de contenu riche : c'est ce
> qui les rend abordables. Un forum, c'est un titre, une consigne et un message d'amorce.

- [x] **Les 17 trames réellement exploitées par le routeur** (6 sept. 2026, D37) :
      vérifié sur les trois plateformes, zéro repli, et le banc le tient désormais.
      Sept trames nommaient un module écarté par D20 ; elles sont corrigées.
- [x] **Trois premiers modules livrés** (4 sept. 2026) : `label` (Texte de liaison), `forum`
      et `choice` (Sondage) — les trois dont le contenu est de la configuration d'activité
      (D23). Palette, prompt dédié, formulaire de retouche, assemblage, banc (50 PASS) et
      sonde. **Leur XML est écrit d'après le format Moodle, pas relevé sur un export
      authentique** : c'est l'aller-retour du § 10 qui les valide, et lui seul.
- [x] **La Carte de progression livrée** (4 sept. 2026) : `mapmodules`, Éléa seul,
      posée en section 0 sur demande, avec ses 30 thèmes relevés (D29 à D32).
      Banc : 16 assertions, 5 contre-épreuves rouges. **L'aller-retour reste à
      faire** — elle est donc décochée par défaut, et la sonde la porte.
- [x] Niveau **amorcé**, le reste (27 sept. 2026, D70) : `questionnaire`, `feedback`,
      `lesson`, `board`, `wiki`, `glossary` à construire, `collabora`, `etherpadlite`,
      `publication`, `data`. `data` et `wiki` reviennent : leurs RUBRIQUES et le titre de leur
      première page sont de la configuration ; ce sont les fiches et les pages, écrites par
      les élèves, qui restent des données utilisateur — et elles sont VIDES à la livraison,
      ce qui est l'état voulu. **Aller-retour fait le 27 sept. : validé** (§ 10).
- [x] Niveau **réservé** (D72) : `workshop`, `bigbluebuttonbn`, `choicegroup` — posés,
      expliqués, et le geste restant écrit dans l'étiquette cachée « À faire ». Le lien
      web (`url`) passe au niveau *source*. **Aller-retour fait le 27 sept. : validé.**
- [ ] `resource` et `folder` : dépôt d'un fichier sur la carte + passage dans le pool du
      `.mbz` (le constructeur partagé refuse aujourd'hui une activité qui porte des fichiers).
- [ ] Lever le filtre de `activity-router.js` au fur et à mesure : un module n'entre dans
      la palette QUE lorsque les quatre points ci-dessus sont faits pour lui — sinon le
      plan promet une activité que la livraison écartera
- [x] Relecture didactique (les six garde-fous, § 5) affichée sur le plan
- [x] **Analyse des types d'apprentissage en retour** (6 sept. 2026, D4 et D35) :
      cinq familles, une rangée de tuiles en bas de l'écran du plan, les absences
      dites en toutes lettres. Banc Node dédié (19 PASS), dont un garde-fou de
      couverture : un module ajouté à `definitions.js` sans famille fait rougir le
      banc avant de s'afficher « hors familles » chez l'utilisateur.
- [x] **Achèvement d'activité : rien à faire, vérifié** (6 sept. 2026). Le recensement
      complet du ré-export montre que chaque activité posée porte déjà un critère
      effectif, adapté à sa nature (§ 6). Le prérequis des restrictions d'accès est donc
      satisfait.
- [x] **Ouverture progressive livrée** (6 sept. 2026, D33) : une étape ne s'ouvre que
      lorsque la précédente est terminée, condition posée sur la section. Réglage sur
      l'écran du plan, décoché par défaut, sonde et banc (13 assertions, 3
      contre-épreuves). **L'aller-retour reste à faire.**
- [x] **Différenciation par le résultat** (D34 → D90 à D101, 30 sept. 2026) — deux à quatre
      chemins ouverts par la note d'un test, étape commune, fin du parcours, « Voir comme un
      élève ». **L'aller-retour Éléa reste à faire** (`generer-parcours-sonde-chemins.mjs`).
- [x] Fiche de séquence en DOCX / ODT / PDF via `export/document-exporter.js`

### Lot 3 — Circulation
- [ ] Dépôt du parcours en collection sur La Sucrerie
- [ ] Aperçu du parcours façon page de cours Éléa (réutiliser `js/simulators/`)
- [x] Caramelia ouvre ou reprend l’atelier de parcours (D51) ; génération après validation dans l’atelier
- [ ] Mode embarqué : livrer le parcours au bloc Éléa via `embed/embed-bridge.js`

---

## 4. Bibliothèque de trames

> **28 sept. 2026 (D76)** : dix-neuf trames. *Débat argumenté* et *Travail d'équipe*
> sont construites autour des modules de la plateforme ; une entrée `a|b|c` prend le premier
> module disponible sur la plateforme visée.
> **28 sept. 2026 (D82)** : vingt trames, avec « Apprendre à apprendre ».
> **28 sept. 2026 (D81)** : trames relues à l'aune de l'état de l'art — quatre structures
> ajustées, toutes les intentions précisées, une intention par ampleur quand les
> emplacements diffèrent (`intentions`).
> **1er oct. 2026 (D102)** : vingt-trois trames. La vitrine — apprendre en autonomie
> (`autonomie`), réviser, s’entraîner (`entrainement`), évaluer (Test réglé en épreuve) —
> remplace les trois premières de la bibliothèque.
> **30 sept. 2026 (D91, D92)** : vingt et une trames. Trois à l'écran, les autres sous « Voir
> les autres modèles », par famille. Deux trames à CHEMINS (`structure: 'chemins'`), qui ne
> se proposent qu'en mode chemins : `differenciation` (« Différencier dès le départ ») et
> `point_controle` (« Remédier en cours de route »).

Données pures dans `js/parcours/templates.js` — ajouter une trame ne demande aucun code,
seulement une entrée et deux clés de traduction. L'ordre va du besoin le plus fréquent au
plus spécialisé ; « structure libre » ferme la marche car c'est un outil d'expert, pas une
porte d'entrée.

**Le champ `modules` porte toute la structure** et sert trois usages d'un coup — l'aperçu
sur la carte, le départ sans IA, et la consigne donnée au modèle. Le nombre d'activités
par étape s'en déduit (`rythme()`) : il n'est pas stocké, car deux sources pour la même
information finissent toujours par se contredire.

| id | Famille | Modalités | Étapes × activités, par ampleur |
|---|---|---|---|
| `autonomie` | séance (vitrine) | toutes | courte 3×3 · moyenne 4×5 · longue 4×9 |
| `revision` | séance (vitrine) | toutes | courte 4×4 · moyenne 4×6 |
| `entrainement` | séance (vitrine) | toutes | courte 4×4 · moyenne 4×6 · longue 4×9 |
| `evaluation` | séance (vitrine) | toutes | courte 3×3 (attendus, entraînement, Test en épreuve) |
| `remediation` | séance | distanciel, hybride | courte 3×4 · moyenne 3×5 |
| `rituel` | séance | toutes | courte 3×3 |
| `decouverte` | séquence | toutes | moyenne 4×8 · longue 4×9 |
| `inversee` | séquence | hybride seule | courte 3×4 · moyenne 3×6 |
| `oeuvre` | séquence | toutes | moyenne 4×7 · longue 4×9 |
| `investigation` | séquence | présentiel, hybride | moyenne 4×7 · longue 4×9 |
| `emi` | séquence | toutes | courte 4×4 · moyenne 4×7 |
| `debat` | séquence | toutes | moyenne 4×6 · longue 4×9 |
| `differenciation` | séquence | toutes — **à chemins** | courte : test, k chemins de 2, écrit · moyenne : page + test, chemins de 4/3/2 (k = 2/3/4), écrit |
| `point_controle` | séquence | toutes — **à chemins** | courte : page, quiz, k chemins de 2 · moyenne : présentation + trous, quiz, chemins de 4/2/2, test final |
| `langue` | spécialisé | toutes | moyenne 4×7 |
| `oral` | spécialisé | présentiel, hybride | courte 3×4 · moyenne 3×5 |
| `autoformation` | spécialisé | distanciel seul | moyenne 4×6 · longue 4×9 |
| `formation` | spécialisé | hybride seule | longue 3×9 |
| `apprendre` | spécialisé | toutes | courte 3×4 · moyenne 3×6 |
| `projet` | projet | présentiel, hybride | longue 5×9 |
| `cooperation` | projet | toutes | moyenne 4×7 · longue 4×9 |
| `evasion` | projet | présentiel, hybride | courte 2×4 · moyenne 2×7 |
| `libre` | spécialisé | toutes | libre |

`inversee`, `formation` et `autoformation` sont restreintes **par définition** : une classe
inversée sans travail à la maison n'en est pas une, et une capsule en autonomie n'a pas de
sens en présentiel.

Le champ `famille` (séance / séquence / projet / spécialisé) range, depuis D92, les modèles
de « Voir les autres modèles » : la bibliothèque a dépassé la vingtaine et Gauthier a
constaté qu'on s'y perdait.

**Une trame à chemins** met `CHEMINS` à la place d'une étape, et donne les types d'activité de
chaque rôle (`chemins.modules`) et leur longueur par ampleur et par nombre de chemins
(`chemins.longueur`). `adapterTrame()` la déplie : l'entrée devient k étapes, et la trame
gagne `aiguillage = { debut, nombre, roles, seuils }`. `nbActivites()` compte ce qui se
fabrique, `nbActivitesParEleve()` ce que fait un élève ; les 36 dépliages possibles sont
vérifiés par `run_parcours_chemins.mjs` (D101).

**Idées de trames non retenues pour l'instant**, à reprendre si le besoin remonte :
séance de rentrée / prise en main, tutoriel de prise en main d'un outil, parcours
d'orientation. (« Apprendre à apprendre » a rejoint la bibliothèque en D82.)

## 5. Les six garde-fous didactiques — LIVRÉ

Relecture du plan AVANT toute génération (`js/parcours/garde-fous.js`, affichée sur
l'écran du plan). Elle **affiche, elle ne bloque jamais** : `validerPlan()` n'en tient
aucun compte, et c'est délibéré — l'enseignant connaît sa classe, sa progression et le
temps qui lui reste, trois choses que le code ignore.

Le moment n'est pas indifférent : relire APRÈS la génération coûterait huit appels au
modèle pour s'entendre dire que la structure était bancale. Ici le plan tient en un écran
et se corrige en deux clics — et le bloc se redessine à chaque retouche, ce qui en fait
une relecture et non un rapport.

| # | Ce qu'on regarde | Ce qui déclenche |
|---|---|---|
| 1 | Le parcours annonce où il va | pas d'objectif général, **ou un objectif qui recopie le titre** |
| 2 | Au moins une activité qui vérifie | aucune activité auto-corrective dans tout le parcours |
| 3 | Chaque étape annonce son objectif | objectif vide, ou recopie du titre de l'étape |
| 4 | À l'entraînement, l'élève est corrigé | une **étape** d'entraînement où rien ne corrige |
| 5 | Les types alternent | trois activités du même type d'affilée, **étapes traversées** |
| 6 | Le volume horaire tient | une activité de plus de 30 min ; un total de plus de 2 h |

**Trois écarts assumés par rapport à la liste d'origine, et leurs raisons.**

- **Le verbe d'action n'est pas détecté** (garde-fou 3). L'interface parle douze langues,
  et un détecteur de verbe français ne dirait rien de juste en grec ou en chinois. On
  vérifie la présence — universelle — et le message conseille le verbe. Un conseil se
  traduit, une heuristique non.
- **La durée par activité n'est pas contrôlée** (garde-fou 6). `normaliserPlan` lui donne
  un repli de 10 minutes : le contrôle serait toujours vert, donc inutile. C'est la tenue
  d'ensemble qu'on regarde à la place, et elle mord.
- **Le garde-fou 4 porte sur l'ÉTAPE, pas sur l'activité.** Première version : chaque
  activité d'entraînement devait corriger. Passée sur les trames du dépôt, elle accusait
  cinq étapes irréprochables (`DialogCards` + `FillInTheBlanks`, `Chart` + `Essay`…) où le
  support précède l'exercice — construction parfaitement saine. Un contrôle qui reproche
  une page de rappel n'apprend à personne à mieux bâtir une séance.

**Ce que la relecture a trouvé le jour de sa naissance.** Passée sur les 17 trames livrées
avec Caramel, elle a signalé **quatre étapes étiquetées « entraînement » qui ne
contenaient que des supports documentaires** (`decouverte`, `emi`, `oeuvre`, `projet`) —
une étape d'entraînement réduite à une page, pour l'une d'elles. Corrigées en leur ajoutant
l'exercice qui manquait, plutôt qu'en les requalifiant : leur intention était juste. Un
contrôle du banc les y tient désormais : **une trame ne doit rien réclamer d'autre que ses
objectifs**, qui sont, eux, le travail de l'enseignant.

---

## 6. Couverture des modules

| Niveau | Modules | Ce que l'IA écrit |
|---|---|---|
| **Plein** | 27 types H5P + `quiz`, `page`, `book`, `assign` — et sur Éléa `simplequiz`, `epikmatch`, `millionnairev2` | tout : énoncés, distracteurs, feedbacks, corrigés, mise en page |
| **Amorcé — LIVRÉ, validé** | `label`, `forum`, `choice` | la consigne, et pour le sondage ses options |
| **Amorcé — LIVRÉ, validé** | `collabwordcloud` (Magistère seul), `stickynotes` (Éléa, Magistère) | la question posée ; les titres de colonnes (20 car. max) |
| **Amorcé — LIVRÉ et VALIDÉ 27 sept. (D70)** | `questionnaire`, `feedback` (Éléa, Moodle), `lesson`, `board`, `wiki`, `glossary` (à construire), `collabora`, `etherpadlite` (Magistère), `publication`, `data` | la consigne, et selon le module : questions, pages et questions de contrôle, colonnes, titre de la première page, texte de départ, rubriques |
| **Source — LIVRÉ et VALIDÉ 27 sept.** | `url` | la consigne de lecture ; l'ADRESSE vient de l'enseignant, sur la carte |
| **Réservé — LIVRÉ et VALIDÉ 27 sept. (D72)** | `workshop`, `bigbluebuttonbn`, `choicegroup` | consignes, critères, message d'accueil ; le geste restant va dans « À faire » |
| **Écarté (D70)** | Capytale (LTI), `geogebra`, `scorm`, `imscp`, `hvp` / `h5pactivity` génériques, `studentquiz`, `game` (mots croisés / mêlés natifs), `programcourse` | rien — raisons au D70 |
| **À ouvrir** | `resource`, `folder` | le dépôt d'un fichier sur la carte, et son passage dans le pool du `.mbz` |
| **Écarté (D23)** | glossaire ALIMENTÉ | ses entrées sont des données utilisateur ; le glossaire *à construire* (vide) est, lui, livré |
| **Livré, aller-retour fait** | `mapmodules` (Carte de progression, Éléa seul) | rien — elle réemploie l'objectif général du parcours |

### Le Glossaire vaut plus cher qu'on ne croyait (4 sept. 2026)

Sur Éléa, les **Jeu – Mots croisés** et **Jeu – Mots mêlés** natifs — à ne pas confondre
avec leurs homonymes H5P, que Caramel produit déjà — ne portent aucun contenu propre :
**ils se construisent automatiquement à partir des entrées du glossaire du cours.** Un
glossaire alimenté produit donc trois activités, pas une.

Ce qui change l'enjeu de D23. Le glossaire avait été écarté parce que ses entrées sont des
données utilisateur pour Moodle et reviennent à zéro (7 envoyées, 0 revenues, § 10). On y
perdait un module ; on y perd en réalité **trois**, et les deux jeux sont exactement le
genre d'activité qu'un parcours veut poser en fin de séquence.

**La piste à tester, et rien qu'à tester** : `userinfo` est réglable **par activité** dans
`moodle_backup.xml` (`glossary_<id>_userinfo`), et notre constructeur l'écrit à `0`
partout, comme `users` à la racine. Passer le seul glossaire à `1` ferait-il arriver ses
entrées ? Deux inconnues : Moodle exige peut-être `users = 1` à la racine (ce qui
embarquerait des comptes, à proscrire), et une entrée de glossaire porte un `userid`
d'auteur qu'il faudrait bien remapper sur quelqu'un.
**Manip qui répond** : exporter depuis Éléa un cours contenant un glossaire alimenté, en
cochant « inclure les données utilisateur », et lire ce que le fichier déclare — c'est la
plateforme qui montrera la combinaison valide. Tant que ce n'est pas fait, le glossaire
reste hors palette : mieux vaut pas de module qu'une coquille vide (D23).

### `mapmodules` — la Carte de progression : LIVRÉE, en attente d'aller-retour

La Carte dessine un chemin sur une image, y pose une icône par activité, et fait
changer l'icône selon que l'élève a terminé ou non. **Aucun autre module ne donne à
voir un parcours comme un parcours.**

Elle est posée en section 0 avec `targetsection = 666`, et n'est PAS une carte du
plan (D29). Trois inconnues la retenaient ; les trois sont tombées, et la dernière
non par un aller-retour mais par la **lecture du code du greffon**
(`moodle-code/elea/mod_mapmodules`, sur la forge) :

| Inconnue | Réponse | Où |
|---|---|---|
| `targetsection` désigne-t-il une section à remapper ? | **Non** — c'est un RANG, et `666` est la constante `ALL_SECTIONS_NUM`. Rien à remapper. | `lib.php:36`, `mapmodules_get_modules_from_section()` |
| *Quand* le greffon réécrit-il son intro ? | **Au restore**, juste après l'insert, avec le `contextid` neuf. On pose donc une intro VIDE (D31). | `restore_mapmodules_stepslib.php:process_mapmodules()` |
| Faut-il fournir une image et un tracé ? | Ils viennent d'un CATALOGUE de 32 thèmes, relevé dans `cartes-standard.js` (D32). | `res/standard_maps.json` |

**Et une quatrième, que personne ne cherchait** : le NOM de l'activité est le
sélecteur d'image, et un nom libre fait échouer l'import du cours entier (D30).
C'est le vrai danger de ce module, et il n'apparaît dans aucun XML.

**Ce que la carte affiche.** `mapmodules_get_json_modules()` retient une activité à
deux conditions : elle n'est ni un `label` ni une autre carte, **et le suivi
d'achèvement est actif sur elle**. Le cours que Caramel produit déclare
`enablecompletion = 1` et toutes ses activités portent `completion: 2` : elles
apparaîtront donc toutes. En revanche, seules celles dont l'achèvement porte une
CONDITION réelle peuvent passer au « fait » :

**Recensement complet sur le ré-export du 6 sept. 2026** — tous les champs
`completion*`, dans le `module.xml` ET dans le XML de l'activité, plus la lecture du
code des greffons. Il a fallu s'y reprendre à trois fois, et c'est le plus instructif
(voir l'encadré de méthode ci-dessous).

| Activité | Ce qui l'achève | Effectif ? |
|---|---|---|
| H5P, Test | `completiongradeitemnumber: 0` — la note | oui |
| Page, Livre, Forum, Sondage | `completionview: 1` — la consultation | oui |
| Devoir | `completionsubmit: 1` — le dépôt de l'élève | oui |
| QCM, Millionnaire, Appariement | `completionminattempts: 1` — une tentative | oui |
| Mur de post-it | `completionstickynotes: 1` — une note déposée | oui |
| Texte de liaison, Carte | `completion: 0` | sans objet : la carte les exclut |

**Il n'y a pas de trou.** Chaque activité que le parcours pose porte un critère
effectif, et le critère est chaque fois celui qui convient à sa nature — on ne
« consulte » pas un devoir, on le rend. Les trois greffons Éléa **implémentent
réellement** leur règle : `classes/completion/custom_completion.php` déclare
`completionminattempts` dans `get_defined_custom_rules()` et le calcule dans
`get_state()` (lu dans `moodle-code/elea/mod_simplequiz`). Une colonne en base ne câble
pas une règle ; celle-là est câblée.

> **Correction du 30 sept. 2026 (D100)** : la première ligne était fausse pour dix types
> H5P. `mod_h5pactivity` n'enregistre de note que pour un énoncé « terminé » à score
> maximal non nul ; Frise chronologique, Glossaire, Cartes de dialogue, Diagramme, Image
> interactive, Résumé, Série de choix uniques, Vidéo interactive, Présentation de cours et
> Livre interactif n'en rendent pas. Achevés « à la note », ils ne s'achevaient jamais, et l'ouverture progressive
> fermait l'étape suivante pour toujours. Ils s'achèvent désormais à la consultation
> (`achevement-h5p.js`). Même leçon que l'encadré ci-dessous : un champ posé n'est pas une
> règle qui se déclenche.

**Conséquence, et elle est verte** : les douze icônes de la Carte peuvent toutes
changer d'état. Le prérequis du chantier suivant — les **restrictions d'accès**, qui
n'ont de sens que si l'achèvement est réel — est donc satisfait, et l'achèvement
d'activité n'est plus un chantier : il est déjà là.

> **Méthode : un recensement s'énumère, il ne s'échantillonne pas.** J'ai conclu DEUX
> fois à un trou, et deux fois à tort. La première en déduisant du gabarit partagé
> `processors/shared/templates.js` (qui pose `completionview: 0`) que Page et Livre
> étaient en cause — faux, leurs processeurs portent leur propre `module.xml`. La
> seconde en classant les activités sur deux champs seulement, `completionview` et
> `completiongradeitemnumber`, ce qui rendait invisibles `completionsubmit`,
> `completionminattempts` et `completionstickynotes` — c'est-à-dire précisément les
> modules que j'accusais. Les deux erreurs ont la même forme : regarder les champs
> qu'on connaît au lieu d'énumérer ceux qui existent. Le correctif tient en une ligne
> de shell — lister *tous* les `<completion*>` de chaque XML — et il aurait dû venir
> avant la conclusion, pas après.

**C'est un enchaînement** : la Carte rend VISIBLE ce que l'achèvement d'activité vaut,
et c'est en cherchant à le décrire qu'on a découvert qu'il valait déjà ce qu'il fallait.

### Les deux palettes, relevées le 4 septembre 2026

**Elles ne se recouvrent pas**, et c'est le fait le plus utile de tout ce lot. Les deux
plateformes tournent pourtant sur le même Moodle 5.1.5 : ce qui diffère, ce sont les
greffons que chaque académie a installés.

| | Éléa (35 tuiles) | Magistère (29 tuiles) |
|---|---|---|
| **Sticky Notes** | ✅ | ✅ |
| **Nuage de mots** | **❌ absent** | ✅ |
| Tableau | ✅ | ✅ |
| Etherpad Lite · Partage de fichiers | ❌ | ✅ |
| Appariement · Millionnaire · QCM | ✅ | ❌ |
| Carte de progression · Feedback · GeoGebra · Mots croisés · Mots mêlés · Test étudiant | ✅ | ❌ |

Le Nuage de mots et Sticky Notes ont été relevés sur **le même** export de Magistère, et
on aurait juré qu'ils allaient de pair. Éléa propose l'un et pas l'autre. C'est la
démonstration de D26 : la disponibilité d'un greffon tiers **se constate plateforme par
plateforme** — elle ne se déduit ni d'une autre plateforme, ni d'un autre greffon relevé
au même endroit.

### La palette de Magistère, en détail

Vingt-neuf types offerts à l'ajout : Atelier · Base de données · BigBlueButton · Capytale ·
Choix de groupe · **Devoir** · Document collaboratif · Dossier · Etherpad Lite · Fichier ·
**Forum** · Glossaire · **H5P** · Leçon · **Livre** · Module · Nuage de mots · **Page** ·
Paquetage IMS Content · Paquetage SCORM · Partage de fichiers · Questionnaire · **Sondage** ·
Sticky Notes · Tableau · **Test** · URL · Wiki · **Zone texte et média**.
*(En gras : ce que le parcours pose déjà.)*

### La palette d'Éléa, en détail

Trente-cinq types : Appariement · Atelier · Base de données · BigBlueButton · Capytale ·
Carte de progression · Choix de Groupe · Contenu interactif · **Devoir** · Document
collaboratif · Dossier · Feedback · Fichier · **Forum** · GeoGebra · Glossaire · **H5P** ·
Jeu – Mots croisés · Jeu – Mots mêlés · Leçon · **Livre** · Millionnaire · **Page** ·
Paquetage IMS Content · Paquetage SCORM · QCM · Questionnaire · **Sondage** ·
**Sticky Notes** · Tableau · **Test** · Test étudiant · URL · Wiki ·
**Zone texte et média**.
*(En gras : ce que le parcours pose déjà.)*

> **Correction du 4 septembre 2026 — le piège de plateforme était trop large.** Ce PRD
> rangeait `board`, `stickynotes`, `wordcloud` et `publication` parmi les greffons Éléa. La
> palette de Magistère les propose (Tableau, Sticky Notes, Nuage de mots, Partage de
> fichiers) : ce sont des greffons Moodle tiers que les DEUX plateformes académiques ont
> installés. Ils ne doivent donc pas être filtrés d'office. Seuls `simplequiz`, `epikmatch`
> et `millionnairev2` sont réellement propres à Éléa — et c'est exactement ce que
> `definitions.js` déclare (`platforms: ["Éléa"]`), vérifié par l'aller-retour, où la variante
> Magistère les a écartés d'elle-même.
>
> Le sélecteur de plateforme doit **contraindre la palette**, pas seulement l'afficher. Mais
> la source de vérité est le champ `platforms` de chaque module — pas une liste écrite dans
> ce PRD, qui vieillit sans qu'on s'en aperçoive. **Pour un module ajouté au lot 2 : vérifier
> sur la palette de CHAQUE plateforme visée avant de le déclarer disponible.**

---

## 7. Pièges à ne pas réapprendre

- **Un seuil gardé en pourcentage arrondi ne se relit pas toujours.** « À partir de 2 bonnes
  réponses sur 3 » se garde à 66,67 % ; relu tel quel, 66,67 × 3 / 100 = 2,0001 donnait 3.
  161 réglages sur 465 (n ≤ 30) étaient touchés — aucun avec 5 ou 10 questions, d'où le
  silence des premiers essais. `bornesEnReponses` tolère l'arrondi (− 0,01 réponse) ;
  `run_parcours_chemins.mjs` vérifie l'aller-retour pour tout b ≤ n ≤ 40.
- **`Number()` fabrique des identifiants.** `Number(null)` vaut 0, `Number(true)` vaut 1 :
  une condition de note sur l'élément 0 ne s'ouvre jamais, pour personne. `entier()`
  n'accepte qu'un entier strictement positif ou son écriture en chiffres.
- **Un groupe de conditions vide est VRAI pour Moodle.** Un chemin sans activité qui s'achève
  donnerait une étape commune ouverte d'emblée : `conditionApresChemins` refuse de le
  construire, et la livraison bloque avant.
- **Un QCM à deux bonnes réponses vaut deux points** (`singlePoint: false` par défaut) : un
  test qui aiguille doit valoir un point par question, sinon « k bonnes réponses sur n » ne
  dit plus la note que Moodle compare aux seuils (D93).
- **Masquer ou griser n'est pas le même drapeau selon la racine** : `showc` (tableau) sous
  « & », `show` (booléen) sous « | » ; se tromper donne une condition que Moodle ignore ou
  refuse. Les sous-groupes n'en portent aucun.

- **Les greffons tiers ont des colonnes ÉTROITES, et ils n'y tronquent pas : ils
  cassent l'import.** `mod_stickynotes` déclare `stickynotes_column.title` en
  **`char(20)`**, et son étape de restauration fait un `$DB->insert_record()` brut. Un
  titre de 21 caractères ne se raccourcit pas : il lève une `dmlwriteexception`, et
  Moodle interrompt la restauration du **cours entier**, à 79 %, sur « Erreur d'écriture
  vers la base de données » — un message qui ne nomme ni le module, ni le champ, ni la
  valeur. Constaté le 4 sept. 2026 avec « Ce que je crois savoir » (22) et « Ce que je
  veux vérifier » (23) : deux intitulés de colonne parfaitement ordinaires, exactement
  ceux qu'un modèle produit.
  Le réflexe est donc : **avant d'ouvrir un module, lire son `db/install.xml`** et
  relever la largeur de tout champ `char`. Le noyau Moodle est large (`name` y est
  presque toujours `char(255)`) ; les greffons ne le sont pas. Le plafond se pose
  ensuite à trois endroits — le prompt l'annonce au modèle, le libellé du formulaire
  l'affiche à l'enseignant, et la fabrique tronque en dernier recours, pour qu'un titre
  trop long raccourcisse au lieu de faire perdre un import entier.
  Contre-épreuvé : désarmer la troncature fait tomber 3 assertions du banc.
- **Un greffon peut casser un import sur la GRAMMAIRE d'un champ, pas seulement
  sur sa largeur.** `mod_mapmodules` déclare `name` en `char(255)` — un schéma
  irréprochable — et fait pourtant échouer la restauration du cours entier si le
  nom de l'activité n'est pas exactement `Carte standard : <thème>` ou
  `Carte personnalisée : <fichier>` : `get_map_src()` découpe ce nom pour trouver
  l'image, et lève une `Exception` PHP sur tout autre libellé. Or c'est pendant la
  restauration qu'elle est appelée. Le nom d'une carte n'est donc pas un titre,
  c'est un identifiant — et un modèle à qui on demanderait un titre le casserait au
  premier essai (D30).
  **Généralisation de méthode** : D27 disait « lis le `db/install.xml` ». C'est
  nécessaire et insuffisant. Avant d'ouvrir un module tiers, lire AUSSI son
  `lib.php` et son `backup/moodle2/restore_*_stepslib.php` — c'est là que vivent
  les exceptions non rattrapées, les réécritures silencieuses et les champs
  interprétés. Aucun export authentique ne les montre : un export montre des
  valeurs qui passent, jamais la règle qui les fait passer.
- **Une carte de progression n'affiche que les activités dont l'ACHÈVEMENT est
  suivi.** `mapmodules_get_json_modules()` filtre sur
  `$completion->is_enabled($cm)`, et exclut par ailleurs les `label` et les autres
  cartes. Un cours sans achèvement donnerait donc une image sans icône. Le nôtre
  déclare `enablecompletion = 1` et pose `completion: 2` partout, donc les icônes
  sont là — mais seules celles dont l'achèvement a une CONDITION (les H5P et le
  Test, sur la note) peuvent passer au « fait ». **À vérifier sur la plateforme
  avant de toucher à l'achèvement** : c'est ce relevé, et non une déduction, qui
  doit commander le chantier suivant.
- **Le fichier à importer ne se cache pas, et il dit son âge.** La sonde a d'abord
  été écrite dans `tests/.sonde-parcours/` — un dossier **caché** (point initial) et
  ignoré par git. Résultat le 4 sept. 2026 : une copie périmée traînant ailleurs a été
  importée à sa place, et l'aller-retour a validé, avec application, le fichier d'avant
  — modules manquants et sections mal numérotées inclus, sans que rien ne le signale.
  Deux corrections, et la seconde est la vraie :
  `tests/sonde-parcours/` est visible ET versionné ; surtout, **le TITRE DU COURS porte
  la date et l'heure de génération** (« Sonde Caramel 04/09 14:49 — magistere »). Un nom
  de fichier se renomme, se copie, se retrouve en double dans les téléchargements ; le
  titre du cours, lui, s'affiche dans la plateforme APRÈS l'import. Il suffit de le lire
  pour savoir ce qu'on a vraiment importé. **Toute sonde ou fixture qu'une personne va
  chercher à la main doit porter son horodatage DANS son contenu, pas dans son nom.**
- **Génération en série** (D7). Deux en vol au maximum.
- **Plafond de 12 activités** (D5). Le socle commun envoyé au modèle se dégrade au-delà.
- **`json-healer.js` n'est pas optionnel.** Un chemin rapide « parcours » qui le
  contournerait produirait des `.h5p` cassés, noyés dans huit activités.
- **Parité ET ordre des clés i18n.** La suite navigateur contrôle les deux : les 12 locales
  doivent porter chaque clé, dans le même ordre que `fr.json`.
- **Un `.mbz` de cours touche plus de choses qu'un `.mbz` mono-activité** : carnet de notes,
  inscriptions, catégories de questions, numérotation des contextes. Aller-retour réel
  obligatoire avant toute annonce.
- **« Notion » ne veut pas dire « objectif ».** Le premier prompt demandait des notions
  pivots et récoltait des infinitifs — « Définir la traite atlantique » —, qui n'ancrent
  rien lexicalement. Le prompt exige désormais des GROUPES NOMINAUX, avec contre-exemples :
  on obtient « le commerce triangulaire », « le Code noir », « les ports négriers ». Ce sont
  eux qui seront réinjectés mot pour mot dans chaque activité.
- **Le seuil de taille des locales se relève, il ne se contourne pas.** `tests/test-performance.js`
  plafonne chaque fichier ; le grec est toujours le plus gros. Le relèvement suit la
  convention du fichier : compléter l'historique, motiver la marge. Passé à 620 Ko pour ce
  module (el = 590 Ko), avec de quoi couvrir les deux écrans restants.
- **Le H5P ET le Test sont gérés par le constructeur de cours — vérifié le 4 sept. 2026.**
  `buildH5pActivityFiles()` pose le vrai `.h5p` dans le pool de fichiers du cours ; c'était
  l'inquiétude n°1, la majorité des activités d'un parcours étant des H5P.
  Quant au Test, l'alerte reposait sur une confusion de vocabulaire : le motif
  `reason: 'quiz'` de `planCollectionCourse` n'écarte QUE le cas de La Sucrerie — un `.mbz`
  DÉPOSÉ contenant un `mod_quiz` verbatim, dont la banque de questions vit à la RACINE du
  backup, donc hors du dossier d'activité que la renumérotation recopie. **Caramel n'est
  jamais dans ce cas** : il détient le MODÈLE de la banque (celui-là même que produit son
  prompt « Test Éléa »), et `buildQuizActivityFiles()` la régénère intégralement. C'est la
  voie `kind: 'quiz'`, exercée de bout en bout par `node tests/run_parcours_course.mjs` :
  trois types de question sérialisés, trois slots pointant une entrée de banque réelle,
  note totale cohérente, banque rattachée au contexte COURS. **Les quatre trames qui
  s'appuient sur le Test sont donc sûres.**
- **Les octets binaires ne survivent pas à `strToU8`.** `createMbz` repassait TOUT par
  `fflate.strToU8`, `Uint8Array` compris : le `.h5p` du pool en serait sorti corrompu, sans
  la moindre erreur. Le contrôle qui le voit est un aller-retour réel — décompresser
  l'archive produite et relire le `.h5p` octet pour octet.
- **`healJsonString` ne retire PAS les virgules orphelines.** Une virgule avant un `}` ou
  un `]` — le défaut de sortie le plus banal des modèles — fait échouer `JSON.parse`, et
  ni `cleanJsonInput` ni `healJsonString` ne la traitent (vérifié le 4 sept. 2026). Sur une
  génération unique cela coûte un clic ; sur un parcours de huit, cela coûte une carte
  entière. `parcours-runner.js:retirerVirgulesOrphelines()` la retire en DERNIER RECOURS,
  après deux échecs de `JSON.parse`, avec un balayage qui tient compte des chaînes pour ne
  pas mutiler une virgule écrite dans un énoncé. Le réparateur commun n'a pas été touché :
  il a sa propre suite et sert partout ailleurs.
- **Un fichier PARTAGÉ ne peut pas avoir de valeur par défaut qui n'existe que d'un côté.**
  `buildMbzFromExtracted` importait `./mbz-parser.js` en repli — inexistant ici.
  `node tests/run_module_hygiene.mjs` l'a vu tout de suite. Le paramètre `ecrireArchive`
  est donc OBLIGATOIRE, avec un message d'erreur qui nomme ce qu'il faut passer :
  `buildMbz` côté Sucrerie, `createMbz` côté Caramel. Les deux appelants de Sucrerie
  (`collection-export-bridge.js` et le spike) le fournissent depuis le 4 sept. 2026.
- **Le quota de `sessionStorage` peut sauter sur douze contenus générés.** `state.js`
  retente alors SANS les contenus : le plan seul tient dans quelques kilo-octets, et c'est
  lui que la pastille de reprise promet de retrouver.
- **Les catégories de questions de CONTEXTE COURS déclenchent un bandeau rouge à la
  restauration — et ce n'est pas une erreur** (constaté le 4 sept. 2026, à l'identique sur
  Éléa et sur Magistère) :

  > « La catégorie de questions « … », située dans le contexte
  > `system|course|course_category` dans le fichier de sauvegarde, sera créée dans un
  > contexte du module banque de question lors de la restauration »

  Trois bandeaux, exactement nos trois catégories à `contextlevel: 50` : la `top` partagée,
  la « Défaut pour \<nom court du cours\> » partagée, et celle du Test (nommée d'après
  `bank_name`). Les deux catégories de contexte MODULE (`contextlevel: 70`) ne disent rien.
  Moodle 4.5 a sorti les banques de questions du contexte cours pour les loger dans un
  module dédié : il annonce donc la migration. **Rouge par convention d'affichage, non
  bloquant — la restauration va au bout dans les deux cas.** Ne pas « corriger » le
  contexte à l'aveugle. **Le ré-export a tranché** : Moodle crée un module `qbank` dans le
  cours et y déplace les trois catégories (elles reviennent toutes en `contextlevel: 70`),
  les 15 entrées restent dans « L'Italie au XXe siècle », et les 10 slots du Test pointent
  toujours une entrée existante — 0 orphelin, `sumgrades` inchangé. **Rien à corriger.**
  Émettre nous-mêmes un module `qbank` ferait taire les bandeaux, mais casserait l'import
  sur tout Moodle antérieur à 4.5 : on échange un avertissement cosmétique contre une
  rupture de compatibilité. Non.
- **Les entrées de GLOSSAIRE ne survivent pas à une restauration de cours** (constaté le
  4 sept. 2026, à l'identique sur Éléa et Magistère : **7 entrées envoyées, 0 revenues**,
  `<entries>` vide, le module créé mais vide). Ce sont des **données utilisateur** dans le
  modèle de sauvegarde Moodle : notre `moodle_backup.xml` déclare `userinfo = 0` et
  `users = 0` — les valeurs correctes pour un backup d'enseignant —, et le restore ignore
  donc le bloc `<entries>` bien qu'il soit présent dans le XML. Passer `userinfo = 1`
  demanderait de fournir une enveloppe de données utilisateur cohérente, et rattacherait
  les entrées à un compte qui n'existe pas sur le site cible.
  **Ce n'est pas un défaut de Caramel** : son export de glossaire est un fichier XML
  d'IMPORT (`formats: ["XML", …]`, aucun MBZ) — la bonne voie pour un glossaire. La Sucrerie
  avait d'ailleurs écarté le glossaire de son propre export « parcours » pour cette raison,
  en toutes lettres dans `collection-export-bridge.js` ; l'information était disponible et
  n'a pas été lue. **`glossaireXml` est donc sorti de la palette du parcours**
  (`activity-router.js:CONTENU_NON_RESTAURABLE`). À rouvrir au niveau « réservé » du lot 2 :
  poser le module VIDE et écrire dans le parcours qu'il faut y importer le `.xml`.
- **Le breton de `br.json` est du vrai breton** (26 clés seulement identiques au français
  sur 2 947). Les 73 clés du module s'appuient sur son vocabulaire établi — *heuliad*
  (parcours), *obererezh* (activité), *pazenn* (étape), *savenn* (plateforme), *steuñv*
  (plan) — mais **méritent une relecture par un locuteur**.

---

### « Structure libre » + « Partir du modèle » ne faisait rien (6 sept. 2026)

`planDepuisTrame()` rendait `null` pour toute trame sans `modules` — et la « Structure
libre » n'en a pas, par définition. `partirDuModele()` se taisait sur `null` : un bouton
actif, un clic, rien. Une trame qui promet « vous composez les étapes vous-même » doit
ouvrir un plan où composer : N étapes VIDES, N venant de l'ampleur (courte 2, moyenne 3,
longue 4), et l'action primaire grisée avec sa raison (« Ajoutez au moins une activité »).
La signature prend désormais l'ampleur en troisième argument. Le banc choisit la trame
par son NOM TRADUIT et clique — une première version cherchait « libre » dans le texte
des cartes et tombait sur « Livre interactif ».

### Le libellé « Parcours » scintillait au chargement (7 sept. 2026)

`initParcours()` tourne au chargement, `loadTranslations()` répond après : `t()` rendait
la clé brute (`parcours_entree_label`) pendant une fraction de seconde, remplacée à
l'arrivée du dictionnaire. Le bouton fait désormais comme « Tutoriel » ou « Tchap » dans
le HTML : un défaut en français dans le nœud, et `data-key` pour que `translatePage()`
le remplace elle-même. Les attributs (`title`, `aria-label`) ne s'écrivent que si la
traduction est arrivée — jamais la clé. Le banc retarde le dictionnaire de 1,5 s et lit
le premier rendu ; contre-épreuve : désarmer le correctif le fait rougir.

### Une image personnelle pour la Carte — relevé du 7 sept., réalisé le 11 sept. 2026 (D61)

Le greffon relit le nom de l'activité : `Carte standard : <thème>` va chercher l'image
dans son catalogue ; **`Carte personnalisée : <nom de fichier>`** va la chercher dans sa
zone de fichiers `maps` (itemid 0), que le backup annote (`annotate_files('mod_mapmodules',
'maps')`) et que la restauration rattache. Une image personnelle dans le `.mbz` est donc
possible : le fichier dans le pool `files.xml` (contenthash sha1, composant
`mod_mapmodules`, zone `maps`), le nom de l'activité en conséquence, et un `path` — le
tracé le long duquel le greffon pose les icônes, que l'enseignant dessine sur la
plateforme avec `map_editor.php`. Sans éditeur de tracé, Caramel pourrait poser un tracé
générique (une sinusoïde, comme « tableau noir » pose une droite).
**Réalisé à la demande d’Emmanuel en D61** : trois traversées adaptées à la hauteur
du fond, avec aperçu du placement, conversion et incorporation des octets au MBZ.
Sources relues : [lib.php](https://forge.apps.education.fr/moodle-code/elea/mod_mapmodules/-/blob/main/lib.php),
[maploader.js](https://forge.apps.education.fr/moodle-code/elea/mod_mapmodules/-/blob/main/js/maploader.js),
[restauration](https://forge.apps.education.fr/moodle-code/elea/mod_mapmodules/-/blob/main/backup/moodle2/restore_mapmodules_stepslib.php).

### L'aperçu restait blanc en passant d'une activité à l'autre (25 sept. 2026)

Relevé par Emmanuel sur « Ordonner les paragraphes », « Surligner les mots » et
« Glossaire » : lent, et parfois une zone vide à la place de l'activité, sans erreur.
Trois causes, toutes dans l'aperçu H5P et pas dans les activités :

- **Une iframe de 0 px.** H5P dimensionne son iframe sur `body.scrollHeight`, qui vaut 0
  dans un conteneur en `display:none` — celui où le lecteur se montait, caché, pendant
  l'attente. Selon qui gagnait la course (l'initialisation dans l'iframe ou l'affichage
  du lecteur), l'activité restait invisible jusqu'au prochain redimensionnement de la
  fenêtre : environ une navigation sur cinquante. `H5PManager.load()` suit désormais la
  largeur du conteneur (`ResizeObserver`) et relance le `resize` d'H5P quand elle
  change, affichage compris ; le lecteur du parcours se monte invisible mais disposé
  (`.pc-lecture__lecteur--chargement`).
- **Une attente levée trop tôt.** h5p-standalone rend la main dès qu'il a ÉCRIT
  l'iframe ; ses dizaines de scripts s'y chargent ensuite. `load()` attend maintenant
  que l'activité y soit montée (une instance dans le `H5P.instances` de l'iframe,
  borné à 10 s).
- **Des bibliothèques jamais préchargées, des écouteurs jamais retirés.** L'accueil
  précharge les bibliothèques dès le choix d'une tuile ; le parcours ne le faisait pas,
  et le lecteur découvrait les dépendances niveau par niveau. Le panneau et la vue
  préchargent celles des activités prêtes. Chaque iframe accrochait aussi un `resize`
  sur la fenêtre de Caramel avec SON jQuery, jamais retiré : `destroy()` le décroche.

Le correctif est dans le gestionnaire partagé : la modale d'une activité seule en
profite. Reste, en amont : h5p-standalone réexécute `frame.bundle.js` dans la page à
chaque aperçu (un écouteur `message` et un `storage` de plus à chaque fois) — minime,
et hors de portée sans patcher le vendor. Banc : `run_parcours_apercu.mjs`, trois
contre-épreuves.

## 8. Carte des fichiers

```
js/parcours/
  config.js           constantes + sélecteurs DOM (SEUL point de couplage)   [fait]
  templates.js        les neuf trames, données pures                         [fait]
  state.js            brouillon, contexte lu en direct, validation           [fait]
  screen-cadrage.js   écran 1                                                [fait]
  index.js            entrée d'en-tête, atelier dans la page, navigation     [fait]
  scenario-prompt.js  prompt de plan + socle commun                          [fait]
  activity-router.js  carte → module, contraint par la plateforme            [fait]
  screen-plan.js      écran 2, tableau de bord + départ sans IA              [fait]
  parcours-runner.js      file de génération en série, une requête en vol     [fait]
  screen-fabrication.js   écran 3 + panneau d'édition visuelle                [fait]
  screen-livraison.js     écran 4                                             [fait]
  scenario-io.js          le parcours en fichier .json (garder / reprendre)   [fait]
  duree.js                la durée : calcul et écriture « 3 h 25 », partout   [fait]
  modules-parcours.js     forum, sondage, étiquette — registre propre au       [fait]
                          parcours, hors `definitions.js` (D22)
  modules-natifs.js       les quatorze modules de la plateforme relevés le     [fait]
                          27 sept. 2026, et les formats texte des questions et
                          des pages — fondu dans le registre (D70)
  modules-socle.js        module.xml, enveloppe <activity>, nom, graine des    [fait]
                          identifiants imbriqués — commun aux deux registres
  parcours-builder.js     plan → activités → .mbz de cours                    [fait]
  progression.js          l'ouverture progressive, posée sur les sections      [fait]
                          APRÈS l'assemblage (D33)
  aiguillage.js           les chemins (D90) : lecture du plan, seuils, rôles,  [fait]
                          édition, conditions de Moodle et leur évaluation,
                          « le cours vu par un élève » — module PUR
  aiguillage-cours.js     pose les conditions des chemins, de l'étape commune  [fait]
                          et de la fin dans le .mbz assemblé (D90, D96)
  bilan.js                la page « Bilan du parcours », composée du plan      [fait]
                          (D112) — module PUR
  achevement-h5p.js       les H5P jamais notés s'achèvent à la consultation    [fait]
                          (D100)
  durees-cours.js         « Durée estimée » en tête de chaque description (D97) [fait]
  vue-eleve.js            « Voir comme un élève » (D99)                        [fait]
  types-apprentissage.js  le miroir : ce que le parcours fait travailler       [fait]
                          (D4, D35) — module PUR, comme les garde-fous
  carte-progression.js    la Carte de progression (mapmodules), posée en       [fait]
                          section 0 sur demande — hors registre (D29)
  carte-image.js          conversion du fond personnel et pool du MBZ       [fait]
  carte-image-input.js    dépôt, remplacement et aperçu du fond personnel  [fait]
  cartes-standard.js      relevé du catalogue de cartes du greffon Éléa        [fait]
                          (30 thèmes : tracé, image, icônes, taille)
  stats-parcours.js       relevé d'usage : ligne Grist PARCOURS par plan,      [fait]
                          nom + version + parcoursId des activités (D69)
  reparation-plan.js      le plan reçu se répare avant d'être jugé ; dernier   [fait]
                          recours dans l'ampleur (D107) — module PUR
  composition-plan.js     la boucle réparer → contrôler → reprendre → garder   [fait]
                          le meilleur, partagée par l'atelier et le relevé (D107)
  exemple-plan.js         l'exemple complet du prompt de plan, de la forme     [fait]
                          demandée (D108) — module PUR
  vocabulaire.js          le `t` de l'atelier : élèves, stagiaires, étudiants   [fait]
                          selon la plateforme (D105)
css/components/parcours.css                                                  [fait]

js/moodle/
  mbz-course-builder.js  PORTÉ de Sucrerie — fichier PARTAGÉ, à recopier tel   [fait]
                         quel côté Sucrerie ; ne rien y écrire qui n'existe
                         pas des deux côtés (cf. piège 7 du CLAUDE.md)
  mono-activity-files.js JSON → carte de fichiers d'un backup mono-activité,   [fait]
                         partagée par l'éditeur et le parcours (D16)
  fichiers-modules.js    les fichiers d'une activité (pool, files.xml,         [fait]
                         inforef) — venu de js/parcours/ le 29 sept. (D88)
  page-images.js         images envoyées d'une Page / d'un Livre → paquet,     [fait]
                         @@PLUGINFILE@@, aperçu en dataURL (D88)

tests/
  run_parcours_course.mjs   le .mbz de cours, dans un vrai navigateur          [fait]
  run_parcours_natifs.mjs   les modules natifs comparés au relevé du 27 sept.  [fait]
  run_parcours_atelier.mjs  la file, le socle commun, le scénario, les écrans  [fait]
  run_parcours_chemins.mjs  les chemins, en Node pur : tous les seuils, tous   [fait]
                            les scores (CI)
  run_parcours_aiguillage.mjs  trois vrais cours relus comme Moodle, un élève  [fait]
                            par score, contre-épreuves, interface
scripts/
  generer-parcours-sonde-chemins.mjs  le .mbz et la fiche de l'aller-retour    [fait]
                            des chemins (trois élèves)
```

Branchement : un `<link>` dans `index.html` et `initParcours()` dans `js/main.js`.
Pour désactiver le module, retirer ces deux lignes — le bouton de la barre d'en-tête
est créé par le module, il disparaît avec lui. Deux règles de `css/base/style.css`
(libellés d'en-tête effacés sous 600 px, mot « Caramel » effacé sous 480) lui sont
liées mais ne lui appartiennent pas : elles rendent la barre à six entrées tenable.

---

## 9. Contrôles

```bash
node scripts/verify-all-locales.mjs      # 12 locales
node scripts/check-shared-i18n.mjs       # parité des fichiers partagés
node tests/run_browser_suite.mjs         # doit rester à 0 échec de plus que la référence
node tests/run_parcours_course.mjs       # le .mbz de cours (H5P, Moodle, Test, Carte)
node tests/run_parcours_atelier.mjs      # la file en série, le socle, le scénario
node tests/run_parcours_import.mjs       # « Importer un modèle », « Nouveau parcours » et sa question (D85)
node tests/run_parcours_gardefous.mjs   # la relecture didactique (Node pur, instantané)
node tests/run_parcours_types.mjs       # le miroir des types d'apprentissage (Node pur)
node tests/run_parcours_fiche.mjs       # la fiche de séquence et le détail des activités
node tests/run_parcours_relecture.mjs   # gestes réels, aperçus, retouches, téléchargement et reprise
node tests/run_parcours_apercu.mjs      # passer d'une activité à l'autre : lecteur visible, préchargé, sans fuite
node tests/run_parcours_documentation.mjs # tutoriel, RAG embarqué et fiches du dépôt rag si présent
node tests/run_parcours_caramelia.mjs   # accès depuis Caramelia, reprise, conversation et langues
node tests/run_parcours_harmonie.mjs    # continuité des quatre écrans, mobile et champs extensibles
node tests/run_parcours_natifs.mjs      # modules natifs : forme relevée, achèvement, « À faire », palettes (D70–D74)
node tests/run_parcours_chemins.mjs     # les chemins : tous les seuils, tous les scores (Node pur, CI)
node tests/run_parcours_reparation.mjs  # le plan reçu réparé (D107) et l'exemple du prompt (D108) (Node pur, CI)
node tests/run_parcours_calibrage.mjs   # composer le plan : réparer, reprendre, retenir ; réponse illisible
node tests/run_parcours_aiguillage.mjs  # trois cours à chemins relus comme Moodle + l'interface
node tests/run_parcours.mjs             # tous les bancs du parcours, en série
node tests/run_module_hygiene.mjs        # imports résolvables (a vu le repli mbz-parser)
node scripts/generer-parcours-sonde.mjs  # le .mbz à importer pour de vrai (cf. § 10)
node scripts/generer-parcours-sonde-chemins.mjs # l'aller-retour des chemins : deux aiguillages, trois élèves
node tests/roundtrip/mbz-quiz-backup.mjs # le Test : banque, câblage, réglages (D86), parité seul/parcours
node tests/run_test_edition_audit.mjs    # Test : édition, réimport, réglages relus/réécrits, aperçu différé
node scripts/generer-test-regle-sonde.mjs # les .mbz de Test réglé à importer pour de vrai (D86)
```

Passage historique (6 sept. 2026) : suite navigateur **14 200 PASS / 0 FAIL**, aucune
erreur JS, aux trois gabarits (1440 px, iPad, iPhone 13 avec émulation tactile), avec deux
pièces jointes réelles. Bancs de l'atelier : `.mbz` de cours **103**, atelier **76**,
relecture **46**, fiche **31**, miroir **19**.

Consolidation du 10 septembre : résultats, limites et parcours de vérification dans
[SUIVI_CONSOLIDATION_PARCOURS.md](SUIVI_CONSOLIDATION_PARCOURS.md). Les tests de
documentation, garde-fous et familles de gestes sont aussi exécutés en CI.

---

## 10. L'aller-retour réel — mode d'emploi

C'est le dernier contrôle du lot 1, et il ne se délègue pas à un banc : un `.mbz` de COURS
touche le carnet de notes, les inscriptions, les catégories de questions et la numérotation
des contextes — quatre choses qu'un backup mono-activité ne touche jamais, et sur lesquelles
seule la plateforme a le dernier mot.

**Ne pas le faire depuis l'atelier.** Ce serait huit appels au modèle, un fichier différent
à chaque essai, et deux questions mélangées : « le contenu est-il bon ? » et « l'assemblage
tient-il ? ». Seule la seconde est en jeu ici.

```bash
node scripts/generer-parcours-sonde.mjs                        # Éléa (défaut)
node scripts/generer-parcours-sonde.mjs --plateforme=magistere # sans les greffons Éléa
node scripts/generer-parcours-sonde.mjs --plateforme=moodle
```

La sonde part des fixtures du dépôt, sans un seul appel réseau, et pose dans
`tests/sonde-parcours/` (dossier VERSIONNÉ, et non caché : cf. le piège ci-dessous) un
`.mbz` **et sa fiche de relevé** — la liste à cocher, activité
par activité. Elle couvre les trois voies d'assemblage et les dix modules que le parcours
sait poser ; la variante Magistère écarte d'elle-même `QCM`, `Millionnaire` et
`Appariement`.

Deux exécutions produisent le MÊME cours — mêmes sections, mêmes activités, mêmes textes —
donc deux imports comparables. Elles ne produisent pas le même fichier à l'octet : chaque
processeur horodate son activité (`generateBaseData` → `Date.now()`), et l'archive porte un
`mtime`. Vérifié : horodatages neutralisés, deux exécutions sont identiques fichier par
fichier. Rendre la sonde byte-stable demanderait de toucher au chemin de production pour le
confort d'un outil de diagnostic — on s'en abstient.

**Le fabriqué doit être tourné en Chromium, pas en Node** (contrairement à
`generer-h5p-sonde-elea.mjs`) : la Page et le Livre composent leur HTML avec un vrai DOM
(`generateHtmlFromBlocks`), et le bootstrap Node du banc roundtrip ne fournit que des
éléments-souches — la suite T5 ne couvrant ni Page ni Livre, il n'a jamais eu à faire mieux.
Les fabriquer en Node donnerait une sonde dégradée sur les deux modules les plus employés
d'un parcours.

**Ce qu'on regarde, dans l'ordre** : les messages de l'assistant de restauration (c'est là
que Moodle signale une référence non résolue) · la structure (4 sections nommées, la zone
« Généralités » VIDE, 10 activités) · chaque activité ouverte une à une · le carnet de notes
(une ligne par activité notée, pas d'orpheline) · la banque de questions du cours (une
catégorie au nom du Test, toutes ses questions) · et si possible le RETOUR : ré-exporter le
cours depuis la plateforme et comparer — ce que Moodle garde, réécrit ou jette dit
exactement ce que notre synthèse doit corriger.

**Le résultat va dans ce fichier**, quel qu'il soit : § 11 (journal) si tout passe, § 7
(pièges) si quelque chose casse. Un aller-retour dont le résultat n'est pas écrit devra être refait.

### Les chemins selon les résultats (D90) — sonde dédiée, À FAIRE

```bash
node scripts/generer-parcours-sonde-chemins.mjs   # → tests/sonde-parcours/sonde-chemins-elea.{mbz,md}
```

Un cours à DEUX aiguillages : un Quiz QCM H5P de 5 questions (dont une à deux bonnes
réponses, qui doit valoir UN point) ouvre trois chemins ; dans l'étape commune qui suit, un
Test Moodle de 10 questions en ouvre deux ; puis une étape commune et la Fin du parcours.
Frise et Cartes de dialogue y vérifient l'achèvement à la consultation (D100).
**Il faut un cours VIDE et trois comptes élèves** : la fiche dit, pour chacun, quel score
viser et ce qu'il doit voir à chaque rechargement. S'y ajoutent la réorientation (note
remplacée dans le carnet), le point par question, et le ré-export, où l'`id` de chaque
condition « grade » doit être celui du `grade_item` du cours d'accueil — jamais 0.
**Ce que seule la plateforme dit** : que `restore_update_availability` traduit bien
l'élément de note cité, et que le lecteur H5P d'Éléa rend une note à la première tentative.

### Résultat du 4 septembre 2026 — Éléa et Magistère

Import réussi sur les deux, avec le même bandeau de migration (§ 7). Ré-export relu :

| Ce qu'on vérifiait | Éléa | Magistère |
|---|---|---|
| Activités restaurées | 10/10 (+ le module `qbank` créé par Moodle) | 7/7 (+ `qbank`) |
| Sections, numérotation dense | 5, conforme | 4, conforme |
| Slots du Test → banque | 10 slots, **0 orphelin** | idem |
| Entrées de banque | **15/15**, mêmes 6 types | idem |
| `sumgrades` du Test | 13 → 13 | idem |
| Carnet de notes | 1 élément par activité notée, 0 orpheline | idem |
| `.h5p` du pool | **octet pour octet identiques**, même empreinte | idem |
| Contenu Moodle | Page 26 575 car., Livre 4 chapitres, QCM / Millionnaire / Appariement / Devoir identiques | idem |
| **Glossaire** | **7 entrées → 0** | **7 → 0** |

Deux enseignements au-delà du verdict :

1. **Les deux plateformes se comportent à l'identique.** Même génération de Moodle, même
   migration de banque, mêmes résultats — un seul comportement à connaître, pas deux.
2. **Le seul écart de contenu ailleurs est un ré-encodage d'entités** : nous écrivons
   `&#233;`, Moodle réécrit `é`. XML sémantiquement identique, rien à faire.

Le `.h5p` qui revient à l'octet près valide d'un coup quatre choses : le calcul de
l'empreinte `sha1`, la convention de chemin du pool, la déclaration dans `files.xml`, et le
correctif « octets bruts » de `createMbz` — sans lui, il serait revenu corrompu.

### Troisième aller-retour du 4 septembre 2026 — les deux greffons tiers

Magistère, après le correctif du `char(20)`. **L'import passe de bout en bout.**

| Ce qu'on vérifiait | Résultat |
|---|---|
| Activités restaurées | 11/11 (+ `qbank`) |
| Sections, ordre, numérotation | 4, dense et correcte — le trou « 1, 2, 4, 5 » a disparu |
| **`collabwordcloud`** | **intact** — `intro` et `instructions` distincts, tous deux à l'arrivée |
| **`stickynotes`** | **intact** — 3 colonnes, dans l'ordre |
| Troncature des titres de colonne | « Je sais » (7) intact · « Ce que je crois savoir » (22) **arrivé raccourci en « Ce que je crois »** · « À vérifier : 20 car. » (20 pile) **intact** |
| Achèvement des deux greffons | `completion: 2` + `completionview: 0` **conservés** |
| Les 3 modules déjà validés, Livre, Page, Devoir | identiques |
| Test : 10 slots, 0 orphelin, 15 entrées, `sumgrades` 13 | exact |
| `.h5p` du pool | octet pour octet |
| Carnet de notes | exact |

**Les cinq modules du parcours sont validés.** Trois écrits d'après le format, deux
relevés sur un export — et les trois cas de troncature vérifiés en conditions réelles,
ce qu'aucun banc ne pouvait faire : seule la plateforme sait ce qu'elle accepte.

Les trois bandeaux rouges sont, comme les fois précédentes, la migration des catégories
de questions (`contextlevel 50` → `70`). Non bloquants, rien à corriger.

**Ce que cet aller-retour a coûté, et ce qu'il a rapporté.** Trois imports ont été
nécessaires : le premier a validé un fichier périmé (dossier caché, § 7), le deuxième a
échoué à 79 % sur le `char(20)` (§ 7), le troisième est passé. Les deux détours ont
chacun produit un piège écrit et un garde-fou testé. C'est le tarif normal d'un module
tiers, et c'est la raison pour laquelle rien n'est annoncé avant l'aller-retour.

---

### Quatrième aller-retour du 4 septembre 2026 — Éléa, après tous les correctifs

Même sonde, variante Éléa. **Import complet, rien à signaler** — et c'est précisément ce
qu'on lui demandait : vérifier que les correctifs des trois tours précédents (numérotation
des sections, horodatage du titre, plafond des titres de colonne) n'avaient rien cassé
ailleurs.

12 activités sur 12 (+ `qbank`), 5 sections dans l'ordre et correctement numérotées, les
trois greffons Éléa intacts (QCM, Millionnaire, Appariement), les trois modules de
parcours du noyau validés une troisième fois, Test à 10 slots sans orphelin, `sumgrades`
13, pool `.h5p` aux mêmes empreintes. Diff champ à champ : **aucun écart**.

**Les deux plateformes tournent sur le même Moodle** — 5.1.5, build 20260608. C'est ce
qui explique qu'elles se comportent à l'identique depuis le début, y compris sur les
bandeaux de migration de banque. Un seul comportement à connaître, pas deux — mais ce
n'est vrai que tant que les deux restent alignées : à vérifier avant d'attribuer une
différence future à autre chose.

**Ce que cet aller-retour ne dit PAS** : le nuage de mots et le mur de post-it n'y
figuraient pas, puisqu'ils ne sont déclarés que sur Magistère (D26). Un backup ne liste
que ce que le cours contient, jamais les greffons installés sur le site — il ne peut donc
pas répondre à leur place. **Seule la palette « Ajouter une activité » d'Éléa le dira.**

---

### Cinquième aller-retour, 6 septembre 2026 — la Carte de progression sur Éléa

Sonde Éléa du 04/09 18:03, importée dans un cours Éléa
(`aura-38-nord.elea.apps.education.fr`) puis ré-exportée. **L'import va au bout**, avec
les trois bandeaux de migration de banque habituels (§ 7), et les 14 activités
reviennent — plus le `qbank` que Moodle crée.

**Le point capital est retiré : la grammaire du nom passe.** C'était le mode d'échec
qui pouvait coûter l'import entier (D30). `get_map_src()` a bien retrouvé
`maplandscape.jpg` à partir de « Carte standard : paysage » — s'il ne l'avait pas
trouvé, il aurait levé son exception et la restauration se serait arrêtée là.

**Et D31 est vérifiée en conditions réelles, pas seulement dans le code.** Nous avons
envoyé `<intro></intro>` ; Éléa renvoie un HTML entier qu'il a fabriqué lui-même, et
qui porte tout ce que Caramel ne pouvait pas savoir :

| Ce que le greffon a écrit | Valeur au retour |
|---|---|
| Hôte des cinq URL | `aura-38-nord.elea.apps.education.fr` — jamais connu de Caramel |
| `mapid` | `1437`, l'identifiant de la NOUVELLE activité |
| `gameid` | `game787`, retiré au hasard |
| Image de fond | `maplandscape.jpg`, résolue depuis notre nom |
| Tracé du `<svg>` | **notre `path`, au caractère près** |
| Premier `<div>` | **notre `descriptionheader`**, accents et apostrophe rendus |

| Ce qu'on vérifiait | Résultat |
|---|---|
| Activités restaurées | **14/14** (+ `qbank`) |
| Sections, numérotation dense | 6 (dont la 0), dans l'ordre, noms exacts |
| **Carte en section 0** | `sequence` de la section 0 = `qbank, mapmodules` — la carte y est seule de notre fait |
| **`targetsection`** | **666, inchangé** |
| **`showdescription` / `completion`** | **1 / 0**, inchangés — elle s'affiche dans la page et ne s'achève pas |
| `iconset`, `buttonwidth`, `displaymodulenames` | 10, 50, 0 — inchangés |
| `timecreated` / `timemodified` | **préservés** (`1756000000`) |
| Achèvement des 14 activités | **aucune valeur modifiée par Moodle** — diff vide |
| Les 5 modules de parcours | intacts, colonnes du mur comprises (« Ce que je crois » toujours tronqué à 20) |
| Test | 10 slots, **0 orphelin**, 15 entrées, 6 types, `sumgrades` 13 |
| `.h5p` du pool | **octet pour octet**, mêmes empreintes |
| Page, Livre, Devoir, QCM, Millionnaire, Appariement | identiques |

**Ce que ce tour a rapporté au-delà du verdict.** Le relevé d'achèvement, activité par
activité, corrige une affirmation écrite la veille : `Page.js` et `Livre.js` portent
leur PROPRE `module.xml` avec `completionview: 1`, ils n'étaient donc pas en cause. Le
trou est de quatre modules, pas de six — le Devoir et les trois greffons Éléa — et il
est logé dans un seul fichier. Une déduction qui paraissait sûre s'est trompée ; le
ré-export l'a corrigée en une commande. C'est exactement pourquoi la fiche de relevé
demandait d'observer plutôt que de conclure.

**Reste une chose que le XML ne dit pas** : ce que la carte AFFICHE à l'écran. Le HTML
généré pointe des fichiers réels sur le site d'accueil, mais seul un regard sur la page
du cours dira que l'image et le chemin se dessinent, et combien d'icônes s'y posent
(attendu : douze — toutes les activités sauf le texte de liaison, la carte elle-même et
le `qbank`). **Tant que ce regard n'a pas eu lieu, la carte reste décochée par défaut**
(D29) : un module qui s'importe mais resterait blanc serait la coquille vide que D23
proscrit.

---

### L'export de référence — comment ouvrir un module sans deviner

Avant `collabwordcloud` et `stickynotes`, la seule méthode était d'écrire le XML
d'après la connaissance du format Moodle. Ça a marché trois fois, mais c'est un pari.
Depuis le 4 septembre 2026 il y a mieux, et c'est devenu la méthode (D25) :

1. **Demander un cours de référence.** L'enseignant crée un cours vide, y ajoute les
   activités candidates — même à peine remplies, mais en RENSEIGNANT les champs qui
   portent la structure (les colonnes d'un mur, les questions d'un questionnaire) — et
   l'exporte. Un `.mbz` de quelques centaines de kilo-octets suffit.
2. **Lire le `<mod>.xml` et son `module.xml`.** Le premier donne les champs et leur
   ordre, le second le réglage d'achèvement (`completion` / `completionview`), qui
   diffère d'un module à l'autre et ne se devine pas.
3. **Recopier**, sans embellir. Les valeurs relevées sont celles que la plateforme
   produit ; les « améliorer » revient à revenir au pari.
4. **Ancrer la référence dans le banc** — une liste de balises attendues, comparée à ce
   que le module produit. C'est ce qui empêche la forme de dériver ensuite.
5. **Inscrire le module dans la sonde**, puis faire l'aller-retour. Rien n'est annoncé
   avant.

Ce que cet export a livré, au-delà des deux modules ouverts : les carcasses de
`workshop`, `lesson`, `questionnaire`, `data`, `wiki`, `bigbluebuttonbn`, `collabora`,
`etherpadlite`, `folder`, `resource`, `url`, `publication`, `board` — c'est-à-dire la
matière de tout le reste du lot 2. **Limite du lot reçu** : les activités ayant été
créées vides, les conteneurs répétés sont vides eux aussi (`<questions>` d'un
questionnaire, `<pages>` d'une leçon, critères d'un atelier). Pour ces trois-là il
faudra un export où ils sont REMPLIS — la carcasse ne suffit pas.

Deux relevés qui ne se devinent pas, et qu'on aurait ratés :

- `collabwordcloud` n'a **pas** de balise `<course>`, là où `stickynotes` en a une.
- Ces deux modules portent LEUR critère d'achèvement (`completionwords`,
  `completionstickynotes`) : leur `module.xml` déclare donc `completion: 2` **avec**
  `completionview: 0`. Poser « terminé quand consulté » viderait le critère de son
  sens — l'activité serait achevée sans que l'élève ait rien écrit.

---

### Second aller-retour du 4 septembre 2026 — les trois modules de parcours

Refait après l'ouverture de la palette, sur la sonde qui porte cette fois `label`, `forum`
et `choice`. Mêmes deux plateformes, mêmes trois bandeaux de migration, même verdict.

| Ce qu'on vérifiait | Éléa | Magistère |
|---|---|---|
| Activités restaurées | 12/12 (+ `qbank`) | 9/9 (+ `qbank`) |
| Sections, ordre, numérotation dense | 5, exact | 4, exact |
| **`label` — texte de liaison** | **intact** | **intact** |
| **`forum` — nom, consigne, 0 discussion** | **intact** | **intact** |
| **`choice` — 3 options, textes** | **intact** | **intact** |
| Livre (4 chapitres), Page, Devoir | identiques | identiques |
| Greffons Éléa : QCM 5 q · Millionnaire 6 q · Appariement 7 paires | identiques | écartés par le filtre |
| Test : 10 slots, 0 orphelin, 15 entrées, 6 types, `sumgrades` 13 | exact | exact |
| `.h5p` du pool | **octet pour octet** | **octet pour octet** |
| Carnet de notes | exact | exact |

**Les trois modules sont validés** (D24). Le seul écart, sur les greffons Éléa, est le champ
`<course>` : nous écrivons `999000`, Moodle inscrit l'identifiant réel du cours d'accueil.
C'est exactement son travail.

Ce que la plateforme AJOUTE est instructif : au `forum` elle adjoint six conteneurs vides
(`subscriptions`, `digests`, `readposts`, `trackedprefs`, `poststags`, `grades`), au `choice`
deux champs (`showavailable`, `answers`). **Aucun n'était requis à l'import** — Moodle comble
lui-même ce qu'un backup ne déclare pas, ce qui confirme qu'un XML minimal mais juste suffit,
et qu'il n'y a pas à courir après l'exhaustivité d'un export authentique.

Un défaut trouvé, dans la sonde et non dans le produit : le numéro de section était écrit en
dur dans le titre. Sur Magistère, où le bloc « greffons Éléa » disparaît, le cours affichait
« 1, 2, 4, 5 » — un trou qu'on aurait pris pour une section perdue. Le numéro est désormais
calculé à la construction.

---

### Aller-retour des modules natifs (27 sept. 2026) — la procédure suivie

Les sondes sont prêtes : `node scripts/generer-parcours-sonde.mjs --plateforme=elea` puis
`--plateforme=magistere` (sections 5 et 6, « Modules natifs »). Pour chacune :

1. Restaurer le `.mbz` dans un cours de test (« Restaurer dans ce cours », fusion ou
   suppression), jusqu'au bout — un module refusé fait échouer le cours entier.
2. Cocher la fiche `tests/sonde-parcours/sonde-parcours-<plateforme>.md` (section e).
3. Ré-exporter le cours restauré et comparer ses `<module>.xml` aux formes produites : les
   questions, pages, critères, colonnes et rubriques doivent revenir intacts, le
   `courseid` du questionnaire pointer vers le nouveau cours, la leçon rester chaînée.
4. Consigner le résultat ici, puis retirer « aller-retour à faire » de la table du § 6.

**Premier essai (27 sept., soir) : échec total sur `mod_collabora/initialfilemissing`**, corrigé
par D75. Refaire l'import avec les sondes régénérées (leur titre porte l'heure de
génération : vérifier qu'on importe bien la nouvelle).

Points à regarder en particulier, parce que le relevé ne peut pas les trancher seul : le
questionnaire rattaché au bon cours ; la leçon créant son élément de notation à la
première tentative (le backup n'en porte pas) ; le document collaboratif et l'Etherpad
créant leur document au premier accès ; la classe virtuelle laissant l'enseignant animer.

### Résultat — aller-retour des modules natifs, 27 sept. 2026 au soir : VALIDÉ

Second essai, avec les sondes régénérées après D75 : **restauration complète sur les deux
plateformes** (Éléa, cours 803 ; Magistère, cours 2563), puis ré-export de chacun et
comparaison, valeur par valeur, à ce que Caramel avait écrit (identifiants et horodatages
exclus) :

| | Éléa | Magistère |
|---|---|---|
| Modules présents après restauration | 19 sur 19 (dont 13 natifs) | 20 sur 20 (dont 14 natifs) |
| Valeurs revenues **à l'identique** | toutes — 0 écart | toutes — 0 écart |
| Achèvement et visibilité (module.xml) | identiques ; « À faire » reste **caché** | identiques |
| Questionnaire rattaché au NOUVEAU cours | oui (`courseid` 803, `sid` = enquête) | oui (2563) |
| Leçon : 3 pages, chaînage, sauts | cohérents (20, 3, 20 ; −1, −1/0, −9) | idem |
| Document collaboratif : fichier de départ | présent, s'ouvre | présent, s'ouvre |
| Ouverture progressive | seuls les modules à achèvement conditionnent | idem |

Vu dans les pages, en enseignant : questions, éléments d'enquête, pages de leçon,
critères d'atelier (phase « mise en place »), rubriques de base, wiki proposant sa page
« Lexique de la classe », glossaire vide, classe virtuelle « Entrer dans la session »,
Etherpad et nuage de mots ouverts, choix de groupe sans option (attendu : pas de groupe
dans le cours). Les plateformes n'ajoutent que des conteneurs vides (forum, sondage).

Deux constats sans conséquence : la Leçon notée n'a pas d'élément dans le carnet de
notes avant la première tentative d'un élève (Moodle le crée alors) ; le Nuage de mots
affiche « Vous devez ajouter au moins une condition d'achèvement » sur la page du cours,
alors que la condition est posée — même message sur un nuage créé à la main : c'est le
greffon, pas le fichier.

## 12. Relecture UX — l'atelier à côté de Caramel (6 septembre 2026)

Faite en regardant, pas en relisant le code : chaque écran capturé sur ordinateur (1440 px)
et sur iPhone 13, à côté de la page d'accueil de Caramel, après un vrai parcours de
bout en bout — cadrage, plan, fabrication, livraison, et le bouton de téléchargement
cliqué pour de vrai.

### Ce qui est en harmonie, et pourquoi on n'y touche pas

- **Le même matériau.** Fond `#F5F5F7`, surfaces blanches à rayon 20 et ombre douce,
  contrôles à rayon 12 : ce sont les valeurs RELEVÉES sur l'interface (en-tête de
  `parcours.css`, D3). Posé côte à côte avec la page d'accueil, l'atelier ne se
  distingue pas comme un module rapporté.
- **Un seul accent.** Le bleu `#007aff` porte toutes les actions primaires, les liens, les
  cases à cocher et le fil d'étapes ; le caramel n'apparaît QUE sur la pastille et sur
  l'icône d'en-tête de l'atelier — sa marque d'entrée, comme le doré de Caramelia. L'ambre
  n'apparaît que sur la relecture. Vérifié écran par écran.
- **Les couleurs de plateforme** (violet Éléa, bleu Magistère, orange Moodle) sont celles
  des pilules de filtre de la page d'accueil : on les reconnaît au premier coup d'œil.
- **Les vignettes de module** sont celles des tuiles. Une carte du plan et une tuile de
  l'accueil parlent du même objet avec la même image.
- **Le fil d'étapes** (1 Cadrage · 2 Plan · 3 Fabrication · 4 Livraison) en haut sur
  ordinateur, « Étape 2 sur 4 » sur téléphone : le même repère, adapté à la place.
- **Le bouton de fermeture** est cerclé de bleu au focus, comme tout focus visible de
  l'application. *(Depuis D39, c'est « Revenir aux activités », dans la tête de
  l'atelier — un bouton secondaire du même gabarit que « Retour ».)*

*Relecture faite sur la fenêtre plein écran ; D39 l'a remplacée le soir même par
l'atelier dans la page. Tout ce qui précède reste vrai des écrans eux-mêmes, qui n'ont pas
changé ; ce qui concernait la coquille (barre supérieure en verre dépoli, barre d'action
fixée en bas) n'a plus d'objet.*

### Seconde relecture, sur l'atelier dans la page (6 sept. 2026, soir)

**Ce qu'Emmanuel a vu, et ce qui a été fait.**

- *« Améliore le visuel des réglages du cours. »* Deux cases à cocher suivies de deux
  paragraphes se lisaient comme un texte. C'est maintenant une **carte blanche à deux
  lignes**, chacune avec l'interrupteur de Caramel (celui du Simple/Avancé du panneau
  d'activité, en plus petit), le libellé en gras, sa note en dessous, le thème de la Carte
  à droite. Les deux notes ont été **raccourcies de moitié** dans les 12 locales : ce qui
  servait la mémoire du projet (« le titre de l'activité est le nom de l'image ») est dans
  ce PRD, pas dans l'écran.
- *« Plus compact et optimal pour les tuiles de chaque activité. »* Une carte faisait
  trois lignes (titre, objectif, puis type · durée · palier) : **125 px**. Les réglages
  passent sur la MÊME rangée que le texte, à droite, et la carte fait **deux lignes de
  texte : 60 px**. Le plan de six activités tient en 2 700 px au lieu de 3 200 ; en
  douze, un écran et demi de moins. Sous 900 px les réglages repassent sous le texte,
  sous 560 les actions aussi. Le survol de la carte révèle ses deux champs (fond grisé) :
  on voit qu'on peut écrire dedans — ce n'était pas évident, les champs n'ont pas de
  bordure. Vignette 36 px, en-têtes d'étape resserrés, « Ajouter » allégé.
- *« Comment revenir à l'étape précédente, on ne peut pas. »* Vrai : « Retour » vit au
  pied d'un écran long. Le fil des étapes devient la navigation (D40).
- *« Le bouton de retour aux activités est disgracieux et mal intégré. »* Un bouton à
  bordure dans une rangée qui n'en avait pas d'autre. C'est maintenant un **lien discret**
  à la couleur des textes secondaires, icône de grille + « Revenir aux activités », qui
  s'efface en icône seule sous 600 px comme les libellés de la barre d'en-tête. Il ne
  fait rien de plus que le bouton d'en-tête déjà allumé ; il rend la sortie trouvable
  d'ici. Sur téléphone, la tête passe en deux rangées : marque et sortie, puis le fil.
- Les titres d'écran et le titre du plan sont ramenés à **l'échelle des titres de
  Caramel** (1,55 rem au plus, contre 2 rem) : dans la page, à côté du formulaire, ils
  criaient.

**Est-ce propre et clair ? Réponse honnête.** Ce qui est clair : l'entrée, la bascule, le
formulaire vivant, le fil, la fabrication qu'on voit avancer, et la sortie. Ce qui reste
discutable, et qu'on n'a pas tranché ce soir :

1. **L'écran de cadrage est long** — trois choix à trois options puis dix-sept trames
   avec leur aperçu, deux mille pixels. C'est le prix de « choisir en voyant » ; une
   version repliée des trames (nom + description, l'aperçu au survol) ferait la moitié.
2. **Le palier** (Découverte / Entraînement / Transfert) est une pastille sans
   explication sur la carte. Il vient de la trame et se lit dans le miroir ; un titre
   au survol suffirait peut-être, un glossaire serait de trop.
3. **Deux « ajouter »** — une activité par étape, une étape en bas — plus les flèches et
   le glisser-déposer : trois façons de composer. C'est délibéré (accessibilité), mais un
   nouvel arrivant peut chercher laquelle est « la bonne ». Aucune ne l'est.
4. **La bulle de Caramelia** flotte au-dessus du contenu de l'atelier comme au-dessus des
   tuiles ; en bas de page l'action primaire lui échappe (mesuré), mais pendant la
   lecture elle couvre parfois le bout d'une carte. C'est le comportement de toute la
   page, pas de l'atelier.

### Ce que la relecture a trouvé, corrigé le jour même

| Défaut | Où | Correctif |
|---|---|---|
| Une **case grise vide** dans la rangée de tuiles quand le compte n'est pas un multiple de trois (2 tuiles à la livraison, 5 au miroir) | livraison, miroir | grille figée à trois colonnes → rangée fluide, la dernière ligne s'étire jusqu'au bord |
| La livraison montrait **deux** repères, dans l'ordre inverse du plan (activités / étapes) | livraison | les MÊMES trois repères que le plan, dans le MÊME ordre : étapes · activités · durée |
| Sur téléphone, la **barre d'actions empilait** bouton, retour et note — près d'un tiers de l'écran | tous les écrans | une seule rangée, retour à gauche, action primaire qui prend le reste ; la note s'efface (chaque écran la redit dans son introduction) |
| Sur téléphone, la tête de la relecture s'écrasait sur trois colonnes | plan | repli en deux lignes |

Un piège de CSS au passage : la règle mobile de la barre, écrite AVANT celle de
`.pc-actionbar__gauche`, était vaincue par elle à spécificité égale — le retour restait
à droite. Elle est placée après, et le commentaire dit pourquoi.

### Les cinq recommandations — faites le jour même, sur demande

| Recommandation | Ce qui a été fait |
|---|---|
| La pastille est muette sur ordinateur | son libellé se déplie une fois au chargement pour TOUT LE MONDE, plus seulement au tactile, et se replie au premier défilement |
| Le titre d'une carte répète le nom du module (voie « partir du modèle ») | le titre reste VIDE avec son invite ; il ne passe plus au modèle comme « titre attendu » vide ; la fabrication montre le titre GÉNÉRÉ quand le plan n'en a pas |
| Les actions de la fabrication, minuscules à gauche sous la vignette | cause trouvée — quatre enfants dans une grille à trois colonnes — et quatrième colonne posée : même place, même taille que sur le plan |
| Trois blocs de réglage avant les étapes | un seul bloc « Réglages du cours », une ligne et une note par réglage ; 4 clés retirées, 2 ajoutées, 2 notes réécrites pour absorber les chapeaux |
| « Partir du modèle » invisible tant qu'aucune trame n'est choisie | le bouton reste VISIBLE, grisé, et son infobulle dit pourquoi (« Choisissez une trame pour partir sans l'IA ») |

### Le point d'entrée — analyse, maquette, et une décision qui n'appartient qu'à Emmanuel

**La question posée** (6 sept. 2026) : la pastille en bas à gauche n'est peut-être pas une
bonne idée ; l'entrée pourrait vivre dans la barre d'en-tête avec Tchap et Tutoriel ; un
bouton unique qui agrège le chatbot et le parcours et se déplie au survol a été envisagé
sans convaincre ; et surtout **aucune couche de plus dans l'interface verticale**.

**Ce que la pastille coûte, et son seul mérite.** Le bouton flottant est le motif de
l'*assistant* — c'est Caramelia. Y loger un *mode de production* fait passer une fonction
de premier rang pour un gadget, et deux pastilles se lisent comme deux assistants. Sur
téléphone, elle occupe l'un des deux coins où vivent les pouces et les gestes du système.
Son seul mérite est celui que D1 lui a reconnu : elle n'ajoute aucune couche verticale.

**Pourquoi le bouton agrégé est à écarter, sans hésiter.** Le survol n'existe pas au
doigt : les deux bulles ne se déplieraient jamais pour un tiers des usages, ou
demanderaient un premier toucher pour rien. Il cache deux choses de nature différente —
un assistant qui *parle*, un mode qui *produit* — derrière une icône qui ne peut
signifier ni l'une ni l'autre. Et c'est un motif d'interaction qui n'existe nulle part
ailleurs dans Caramel : la couche qu'on ne veut pas, posée à l'horizontale.

**Pourquoi la barre d'en-tête est le bon endroit.** C'est là que Caramel range ses
*autres portes* : Sucrerie, qui est un autre produit entier, et Tutoriel, qui ouvre une
surcouche — exactement ce qu'est l'atelier. L'entrée y gagne un LIBELLÉ comme les autres
(« Parcours »), l'icône y garde sa couleur caramel comme Tchap garde son bleu et Sucrerie
son rose, et le point de reprise devient un petit point bleu, le même vocabulaire que la
pastille de Notifications. Caramelia reste seule en bas à droite, et le motif du bouton
flottant retrouve son sens. Aucune couche verticale. Placée EN TÊTE du groupe de droite :
c'est la seule entrée qui *crée* quelque chose, les autres sont autour du produit.

**La maquette a tranché la seule vraie objection.** Injectée dans la vraie page (même
classe que Tchap et Sucrerie, pastille retirée) : sur ordinateur, six entrées tiennent
sans effort. Sur iPhone, **elles débordent** — Notifications sort de l'écran, et la CSS le
disait déjà (« 5 boutons icône doivent tenir »). Le correctif est petit et cohérent : sous
480 px, masquer le mot « Caramel » à côté du logo — le logo EST la marque, et le
sous-titre est déjà masqué sous 768 px. Cela libère la largeur d'un bouton. L'autre
option, masquer Tchap sur téléphone, est possible mais retire un accès plutôt qu'un mot.

**Fait le jour même, sur décision d'Emmanuel** (D38) : le bouton dans `.header-right`,
en première position ; la pastille, son dépliage tactile et son CSS retirés ; le point de
reprise sur l'icône ; les clés `parcours_fab_*` renommées `parcours_entree_*` et un libellé
court « Parcours » ; la barre mesurée à dix largeurs avant et après, et deux règles posées
dans la CSS de Caramel pour qu'elle tienne (détail en D38).

## 11. Journal

- **2 octobre 2026 — Sortie de la 7.1.0 :** la vidéo de présentation est refaite (le parcours
  différencié y figure), et un tutoriel vidéo « Créer un parcours » la complète, tourné dans le vrai
  Caramel avec les vraies réponses du modèle (`scripts/video-demo/`, `--video=parcours` : un
  parcours linéaire de révision en SVT, différencié ensuite par « Ouvrir des chemins selon ce
  test »). Un kit de formation rapide (27 diapositives, `scripts/diaporama/generer-kit-formation.mjs`)
  rejoint la page de présentation. Leur préparation a relevé D113 et le saut de page après
  « Annuler la modification ». Reste ouvert : dans la consigne d'un texte à trous, le modèle écrit
  parfois les deux caractères « \n » ; l'aperçu fait deux paragraphes, mais l'éditeur de
  l'atelier les montre tels quels (relevé sur `revision-fractions.json` et sur la vidéo).
- **1er octobre 2026, soir — La page de bilan (D112), et la vérification des parcours à chemins :**
  Gauthier « adore » et demande une page de fin qui fasse le bilan : posée dans la fin de tout
  parcours, composée du plan. Vérification demandée par Emmanuel avant un déploiement : « que les
  nouveaux parcours différenciés fonctionnent avec tout ce qu'on a fait aujourd'hui, que l'ajout
  de la page fonctionne ». Le contrôle de la condition de la fin lisait d'abord le JSON échappé
  du `section.xml` (`&quot;`) et passait à vide : corrigé avant de compter. Vérifié DANS
  L'INTERFACE, par de vrais clics et avec le vrai modèle (Mistral Small 4, quelques replis
  silencieux du Worker), du cadrage « Des chemins selon les résultats » au `.mbz` téléchargé :
  Éléa à 3 chemins (Pythagore, 4e), Magistère à 2 chemins (évaluer par compétences, stagiaires),
  Moodle à 4 chemins (statistiques, BUT). Plans composés en 12 à 16 s, sans retour au cadrage ni
  problème d'aiguillage ; 34 activités fabriquées sur 34, aucune écartée ; dans chaque cours, les
  chemins aux bons seuils, l'étape commune ouverte au bout de n'importe quel chemin, la fin qui
  attend le tronc commun et un chemin, le bilan dessous, hors de sa condition ; chemins de durées
  égales à 5 min près ; aucune image ; aucun trou défectueux ; élèves / stagiaires / étudiants
  selon la plateforme. Le banc des parcours réels, rejoué sur ces trois cours
  (`run_parcours_reels.mjs --dossier=…`), n'y voit qu'un écart : sur Magistère, les retours par
  score d'un Quiz tutoyaient les stagiaires (« Tu as bien ciblé un critère… »). Limite connue
  (D80, D82), non bloquante ; piste : une seconde demande quand les RETOURS d'une carte tutoient
  un public adulte, comme pour les consignes et les trous. (Le même banc compte aussi, à tort, le
  tutoiement d'une phrase citée entre guillemets dans une Page : « ton travail est insuffisant ».)
- **1er octobre 2026, après-midi — Le parcours de maths d’Emmanuel (D109 à D111) :** « Découvrir
  les natures des angles » (Éléa, chemins) livré avec 11 activités sur 12 : la Rédaction « Défi :
  décrire un angle dans un objet » écartée (« erreur de mise en forme », `occurrences: 0`), deux
  images `via.placeholder.com` dans la Page. Le docx de la fiche semblait perdre les réponses d’un
  quiz : fausse alerte, elles y sont en formules Word (OMML) — c’est l’outil d’extraction
  (`textutil`) qui les omettait. Corrigé : D109, D110, D111, et la modale « Commencer un nouveau
  parcours ? » (deux réponses en bloc insécable à droite, l’export à gauche ; rouge au survol ;
  espace insécable avant « ? »). Le Texte à trous du parcours réel « Réviser les fractions »
  écrivait `*4/6*` : injouable depuis sa génération (le lecteur lit « 4 » ou « 6 »), et faux par
  endroits (« ⅘ - ¾ … 11/20 »). Régénérés avec le vrai modèle (Mistral Small 4) : un parcours
  « Les natures des angles » (6e, 3 chemins, nouveau scénario `elea-angles-chemins`), « Réviser
  les fractions » et « La proportionnalité » — toutes les cartes faites, aucune écartée, aucune
  image ni bloc à image dans les Pages, aucun trou défectueux, fractions écrites ⅔ ; le banc des
  parcours réels passe (412). Reste ce qu’aucun contrôle ne voit : une erreur de calcul (« 3 kg à
  4,50 € → 5 kg à 6,75 € ») ou de notion (« l’angle saillant est plus grand qu’un angle droit »),
  à faire relire.

- **1er octobre 2026, matin — Le plan ne revient plus au cadrage (D107, D108) :** Emmanuel,
  en local : avec « Des chemins selon les résultats », « Composer le plan » tournait puis
  revenait à l’étape 1. Reproduit sur Magistère : deux plans refusés pour la seule durée des
  chemins (28, 32 et 39 min, puis 32, 36 et 44). Relevé sur 16 cadrages réels avec Mistral
  Small 4 (chemins 2 à 4 sur les trois plateformes, trois ampleurs, sans chemins, deux
  trames) : 7 retours au cadrage, tous à chemins, dont 5 pour la seule durée des chemins ; les
  plans refusés sont gardés comme cas d’épreuve (`tests/fixtures/parcours-plans-reels/`).
  Après D107 (réparation, dernier recours) et D108 (exemple complet dans le prompt), mêmes 16
  cadrages : **16 plans retenus avec Mistral Small 4** (9 au premier appel, dont 2 réparés ;
  7 après la reprise ; aucun problème d’aiguillage), **16 avec Qwen 3.8** (12 au premier
  appel sans réparation ; un plan de séquence longue reste trop court, 8 activités au lieu de
  11 ou 12 : retenu, la réparation n’invente pas d’activité). Une panne passagère du serveur
  n8n (délai de 5 minutes, puis « Failed to fetch ») a interrompu le premier passage : relancé
  une fois le serveur revenu. Au passage :
  - les chemins côte à côte du plan partagent leurs rangées (sous-grille CSS : en-tête,
    activités, pied) : une introduction plus longue ne décale plus les activités ni le pied
    d’un chemin ; « Ajouter une activité » descend en bas de sa rangée ; « Consigne et
    palier » tient sur une ligne, l’état de la carte dessous ; les introductions gardent leur
    hauteur après un redessin (ajouter un chemin les repliait à une ligne) ;
  - « Voir comme un élève » : la vignette H5P (4:3) n’est plus écrasée en carré — sa largeur
    seule est imposée, comme dans le choix du type (`vignetteModule`) ;
  - essai de modèles sur la carte de proportionnalité qui s’était trompée (Texte à trous
    « Résoudre des énigmes », 8 trous demandés), 7 à 8 tirages par modèle, chaque trou
    recalculé : Qwen 3.8, 2 trous faux sur 45, jamais inutilisable, mais 3 énoncés au lieu de
    8 ; Gemma 4 (servi 4 fois sur 7, repli silencieux sur Qwen 3.6 sinon), 2 trous faux sur
    26 et un énoncé insoluble ; Mistral Small 4, 5 tirages sur 7 inutilisables (`*x*`, une
    unité seule, `*... €*`, le calcul entier, réponse et indice inversés), dont 3 que
    `controle-sortie-ia.js` ne voit pas ;
  - catalogue ILaaS du jour : `qwen-3.8-27b` est arrivé (servi lui-même, 5 à 10 s),
    `mistral-small-4-119b` répond de nouveau lui-même ;
  - `run_parcours_external_ai.mjs` échouait depuis D85 sur une vérification du pied qui
    cherchait « Importer un modèle » dans toute la page (il est en tête de l’atelier) :
    restreinte au pied. Ce banc ne figure pas dans `run_parcours.mjs`.

- **1er octobre 2026, nuit — Vérification de génération réelle après D105 :** huit activités
  par la vraie interface (Surligner, Glisser les mots, Texte à trous, Rédaction, Quiz mixte,
  QCM, Vrai/Faux, Cartes) et quatre parcours (Moodle « Évaluer », Éléa à trois chemins,
  Magistère « S’entraîner », Moodle « Apprendre en autonomie »), puis relecture par
  `run_parcours_reels.mjs`. Vocabulaire juste partout (vouvoiement et « vous » sur Moodle et
  Magistère, aucun « élève » sur Moodle), Test d’« Évaluer » réglé en épreuve, trois chemins
  posés. Trouvé et corrigé : un Texte à trous en noms de variables (D106) ; le gras Markdown
  d’une question gardé dans le titre de l’exercice d’une Présentation (aussi Livre interactif
  et Vidéo interactive : `titreExercice()`) ; le générateur de parcours réels qui ne rendait
  pas la main. Un Quiz mixte « en un clic » a échoué une fois sur dix (le premier essai), sans cause captée ni reproduction.
  Longueur des Pages remesurée et corrigée (D104 : fourchette en ligne à part, facteur 2,9
  entre 5 et 25 minutes au lieu de 1,6) ; trous en symboles (« *x* g ») prévenus au cadre (D106).
  Le parcours à chemins a été régénéré cinq fois : variantes contradictoires
  (« proportionnelle/non proportionnelle » dans chaque trou, consigne « indique si… » confiée
  par le plan à un Texte à trous), puis virgule LaTeX `37{,}5` dans les réponses, remise en
  `37,5` par le réparateur hors formule. **Limite constatée, à dire aux enseignants** : le
  dernier tirage portait trois erreurs de calcul sur huit énoncés (500 g de farine écrits
  « 1000 », 75 min écrites « 37,5 ») — aucun contrôle ne voit la justesse d’un calcul ; les
  activités de mathématiques générées se relisent avant d’être données.

- **1er octobre 2026, soir — Le vocabulaire suit la plateforme (D105) :** sur une capture du
  cadrage Moodle (« Tous vos élèves… »), Emmanuel demande « étudiants » sur Moodle et
  « stagiaires » sur Magistère, choix des chemins compris. 125 variantes rédigées en français
  puis traduites dans les 11 autres langues ; règle de rédaction des prompts définie par la
  plateforme ; tutoriel et fiche RAG `parcours-creation` (1.5.0) d’une phrase. Fiche
  réingérée dans les 12 langues le 1er oct. à 5 h 35, à la demande d’Emmanuel : 12 remplacées,
  60 inchangées, 864 documents avant et après, aucun autre touché
  (`rag/caramelia/reports/2026-10-01-parcours-chemins-05h35.json`).

- **1er octobre 2026 — Retours de Gauthier sur un parcours réel (D102 à D104) :** un parcours
  de mécanique des fluides généré en production (7.0.1). Trois exercices d’un Quiz mixte sans
  consigne (le modèle l’avait omise ; le retour d’un score faible passait pour la consigne) :
  réparateur, seconde demande dans la file, règle au cadre (D103). La vitrine des trames suit
  sa proposition — apprendre en autonomie, réviser, s’entraîner, évaluer ; « Évaluer » règle le
  Test en épreuve (D102). La longueur d’une Page suit sa durée (D104). La fin du parcours et
  les durées qu’il demandait étaient déjà livrées (D96, D97). RAG : 48 fiches parcours écrites
  le matin (12 ajoutées, 36 remplacées, 864 documents), puis 24 le soir (trames et étape 1 de
  la création, après D102) ; aucun autre document touché (`rag/ingest-parcours-2026-10-01.mjs`,
  un rapport par passage).

- **30 septembre 2026 au soir — Premier essai des chemins sur Éléa (Emmanuel) :** la sonde
  s'importe ; avec son compte enseignant, des réponses toutes justes puis toutes fausses au
  test mènent chacune au bon chemin. Pas de compte élève de test sur la plateforme : ce qu'un
  élève VOIT (autres chemins masqués, étape commune et fin qui apparaissent au bon moment,
  réorientation par le carnet de notes) reste à confirmer avec la fiche
  `sonde-chemins-elea.md`, dès qu'un compte élève sera disponible. Un compte enseignant
  n'est pas soumis aux restrictions d'accès : seul un compte élève les éprouve vraiment.

- **30 septembre 2026 — Les chemins selon les résultats (D90 à D101, 7.1.0) :**
  demande d'Emmanuel et de Gauthier, maquette validée le jour même (« tes choix sont
  judicieux ») avec trois retours : pas de lettres ni de pourcentages, un visuel propre,
  « Voir comme un élève » intégré. Livré : choix au cadrage, trois trames à l'écran, deux
  trames à chemins, aiguillage dans le plan, conditions posées après l'assemblage, fin du
  parcours et durées dans tous les parcours, achèvement à la consultation des H5P jamais
  notés (défaut de la 7.0 découvert en route). Les bancs ont trouvé trois défauts réels
  avant tout essai : seuils mal relus (161 réglages sur 465), exemple de plan contraire à
  sa consigne (structure libre à chemins sur une séquence), notes de livraison qui
  déplaçaient la page. Bancs : chemins **37/0**, aiguillage **56/0**, calibrage **74/0**,
  course **119/0**, atelier **193/0**. Les deux bancs `calibrage` et `sources` simulaient
  les points d'accès `-bas` alors que ce dépôt appelle `-prod` : ils acceptent les deux.
  **Reste** : l'aller-retour Éléa (`generer-parcours-sonde-chemins.mjs`, trois élèves).

- **30 septembre 2026 — Test étudiant (D89) et validation de la 7.0.1 :**
  le Test étudiant rejoint la mosaïque d'Éléa, hors plan par défaut. Relevé
  confronté au code amont de `mod_studentquiz` (sauvegarde, restauration,
  achèvement) : `<coursemodule>` doit porter l'identifiant du module, recalé après
  l'assemblage. Banc natifs **178/0** avec trois contre-épreuves au rouge ; sonde
  Éléa régénérée. Aller-retour Éléa réussi le même jour (import, module et consigne
  visibles). RAG Caramelia : 12 fiches `parcours-modules` remplacées, 852 documents, aucun
  autre touché (`rag/ingest-parcours-2026-09-30.mjs`).

- **29 septembre 2026 — Publication des nouvelles démonstrations et portraits :**
  Emmanuel autorise le commit et le push de toutes les modifications présentes
  sur `emmanuel` : deux nouvelles démonstrations H5P avec leurs sources et
  dossiers jouables, six activités au catalogue, téléchargements compactés,
  portraits des deux co-créateurs et textes équilibrés. Les entrées précédentes
  décrivent les étapes locales avant cette autorisation. Branche distante
  actualisée sans divergence ; banc présentation **321 OK, 0 échec**, contrôle
  des cinq lignes sur cinq largeurs et `git diff --check` propre. Les imports
  Éléa et les décisions de licence pédagogique restent ouverts. `main` demeure
  hors du périmètre de cette publication.

- **29 septembre 2026 — Photo de Gauthier et équilibre des portraits :**
  `gauthier.jpeg`, fourni à la racine, déplacé sans retouche ni modification des
  octets vers `assets/images/presentation/gauthier-remande.jpg` (1 024 × 969 px).
  Le vrai portrait de Gauthier remplace celui d’Emmanuel ; suppression de la
  mention provisoire et ajout du texte alternatif « Portrait de Gauthier Remande ».
  Chaque carte comporte cinq lignes : nom, deux lignes de fonction, académie,
  contact. Pour Gauthier : « Lettres-Histoire » puis « Professeur de lycée
  professionnel », développement du statut PLP déjà présent dans les mentions.
  Grille à une colonne sous 1 000 px ; petits portraits latéraux sur téléphone,
  disposition centrée sous 380 px pour garder tous les textes lisibles.
  Rendu des deux vrais portraits vérifié dans Chrome. Le banc mesure les lignes
  réellement rendues à 320, 390, 760, 1 282 et 1 905 px et confirme cinq lignes
  pour chacun, sans texte tronqué. Présentation : **321 OK, 0 échec** ;
  `git diff --check` propre. Travail local sur `emmanuel`, sans commit ni push.

- **29 septembre 2026 — Portraits des co-créateurs sur la présentation :**
  photo fournie par Emmanuel déplacée depuis la racine vers
  `assets/images/presentation/emmanuel-gaunard.jpg`, avec la vraie extension JPEG,
  sans retouche ni modification des octets (987 × 1 326 px, 243 547 octets).
  Ajout d’un bloc « Les co-créateurs de Caramel » avant l’appel final : Emmanuel
  Gaunard, professeur de mathématiques et chargé de mission DRANE, académie de
  Grenoble ; Gauthier Remande, professeur de Lettres-Histoire (PLP), académie de
  Nantes. Fonctions et contacts repris du README et des mentions légales.
  À la demande d’Emmanuel, sa photo est utilisée provisoirement pour les deux
  cartes ; celle de Gauthier porte la mention « Portrait à venir » et ne reçoit
  pas de texte alternatif l’identifiant comme son vrai portrait.
  Deux cartes côte à côte sur grand écran, une colonne sous 900 px, portraits
  et textes compacts sur téléphone. Rendu vérifié dans Chrome à 1 920 et 390 px :
  images chargées, noms et fonctions lisibles, aucun débordement horizontal.
  Banc présentation complet : **315 OK, 0 échec** ; `git diff --check` propre.
  Ce nouveau contenu éditorial reste en français, comme les autres descriptions
  dont l’extension des traductions reste à décider. Travail local sur `emmanuel`,
  sans nouveau commit ni push.

- **29 septembre 2026 — Deux démonstrations H5P supplémentaires :**
  `/decouvrir/` propose désormais six activités. `video-caramel.h5p` utilise la
  vraie présentation Caramel 7 de PodEduc, sans téléchargement ni réhébergement
  du média : quatre pauses-question (0:34, 2:01, 3:11, 4:27), deux QCM et deux
  vrai/faux, placés après les passages correspondants de la transcription.
  Le média source d’Emmanuel Gaunard est crédité CC BY 4.0 sur la page et dans
  l’écran de démarrage du H5P téléchargé ; la licence des
  questions pédagogiques reste à décider, comme celle des autres démonstrations.
  `preparer-une-activite.h5p` fait ordonner six étapes, du cadrage pédagogique à
  la vérification de l’activité importée en vue élève. Les deux sources JSON
  passent par le pipeline habituel (healing, processeur, `createH5PBlob`) ; le
  dossier joué est extrait de l’archive téléchargeable. Régénération à
  l’identique des six activités ; les quatre démonstrations précédentes restent
  inchangées octet pour octet.
  Chrome : lecture réelle du MP4, quatre pauses et quatre corrections à 1/1 ;
  pause naturelle à 0:34 et réponse correcte dans la fenêtre mobile H5P ;
  classement déplaçable au clavier. Les deux fichiers téléchargés depuis la
  page sont identiques aux archives du dépôt. Grille à trois colonnes sur
  tablette, deux sur téléphone ; liste des six téléchargements compactée,
  cartes de formation équilibrées à 625 px sur grand écran.
  Banc présentation : **314 OK, 0 échec**, dont classement ordonné avec les
  commandes natives jusqu’au score de 5/5, déplacement avec Descendre sur
  mobile et contrôle de toutes les dépendances.
  **Import Éléa des deux nouvelles archives encore à faire.** La vidéo nécessite
  un accès Internet à PodEduc ; aucun verdict de lecteur d’écran ni de licence
  pédagogique n’est déduit du rendu Chrome. Modifications locales sur
  `emmanuel`, sans nouveau commit ni push.

- **29 septembre 2026 — Publication Caramel autorisée sur `emmanuel` :**
  Emmanuel demande le commit et le push de toutes les modifications présentes,
  après les corrections d’exports Éléa, de langue enseignée, d’annonce H5P,
  de présentation et de licence. Branche distante actualisée avant publication,
  sans divergence. Les fichiers partagés `document-formatter.js` et
  `moodle-formats.js` sont identiques octet pour octet à ceux déjà publiés dans
  la Sucrerie. Vérifications finales : présentation **276/0**, langue **58/0**,
  backup du Test **120/0**, édition du Test **59/0**, images **45/45** et
  contre-épreuves concluantes, mentions légales conformes, **1 166 clés partagées
  présentes dans les douze locales**. Suite navigateur complète finale :
  **14 435 PASS, 0 FAIL, 42/42 suites**.
  **Restent ouverts :** D87 avec le vrai modèle puis import Éléa ; réimport du
  quiz H5P et contrôle des annonces au lecteur d’écran ; décision sur la licence
  pédagogique des démonstrations et sur l’extension des traductions éditoriales.
  Les échecs antérieurs des bancs de parcours calibrage et sources ne sont pas
  attribués aux corrections présentes sans preuve.

- **29 septembre 2026 — Footer de présentation regroupé comme Caramel :**
  suppression des trois colonnes et des groupes alignés aux bords. Les huit liens
  forment un ensemble centré avec retour naturel à la ligne, espacements de 25 px
  et marges identiques au footer de l'application. Sur mobile : espacements de
  20 px horizontalement et 8 px entre les lignes ; « Découvrir Caramel » conserve
  son texte sur une ligne centrale, les auteurs restent visibles et centrés.
  Les liens réduits à leur icône gardent un nom accessible, traduit si nécessaire.
  Chrome : grand écran à 1 905 px et téléphone à 390 px inspectés. Banc
  présentation : **276 OK, 0 échec**, comparaison du regroupement et des marges
  avec Caramel, centrage des lignes mobiles. Modifications locales sur `emmanuel`,
  sans commit ni push Caramel.

- **29 septembre 2026 — YouTube en mode de confidentialité renforcée :** les
  quatre intégrations YouTube de `/decouvrir/` étaient déjà en
  `www.youtube-nocookie.com`. Une fonction commune normalise désormais aussi
  les futures URL `/embed/` YouTube classiques pour le lecteur et le code copié,
  en conservant les paramètres, notamment le départ MiniMoot à 5 131 secondes.
  Le banc signale également une URL classique dans le catalogue. Chrome : les
  quatre iframe réelles contrôlées sur le domaine nocookie. **274 OK, 0 échec**,
  dont quatre contre-épreuves avec des URL classiques injectées dans le catalogue
  de test. Ce mode ne garantit pas l'absence de publicité : l'aide YouTube indique
  que des annonces non personnalisées peuvent être diffusées
  (`https://support.google.com/youtube/answer/171780`). Modifications locales sur
  `emmanuel`, sans commit ni push Caramel.

- **29 septembre 2026 — Actions des lecteurs vidéo de `/decouvrir/` :** boutons
  « Ouvrir la vidéo » (lien public en nouvel onglet) et « Partager » sur les dix
  vidéos intégrables, y compris les deux présentations principales. Styles
  communs, libellés traduits dans les douze langues. Partage natif si disponible,
  sinon copie du lien public ; l'annulation ne copie rien. Si la copie est refusée,
  un champ sélectionné affiche le lien sans annoncer un faux succès. Le MiniMoot
  conserve le départ à 1 h 25 min 31 s dans son lien partagé. Chrome : lecteur
  et boutons inspectés à 1 282 et 390 px, repli des actions sans débordement.
  Banc présentation : **269 OK, 0 échec**, liens publics des dix vidéos,
  simulation du partage natif, annulation, indisponibilité et copie refusée.
  Aucun envoi réel à un destinataire pendant les tests. Modifications locales sur
  `emmanuel`, sans commit ni push Caramel.

- **29 septembre 2026 — Choix des vidéos soigné dans le kit de formation :**
  remplacement du sélecteur natif par deux exemples illustrés (Caramel 7 et la
  Sucrerie), suivis d'une liste défilante des huit autres vidéos. Titres, sources
  et durées renseignées sont visibles ; boutons radio natifs et choix surligné,
  fond crème discret, cartes arrondies et bouton de copie commun. La liste reste
  limitée à 148 px pour conserver des cartes compactes et alignées. Chrome :
  trois cartes de 625 px à 1 282 px, contrôle mobile à 390 px sans débordement,
  sélection MiniMoot visible. Banc présentation : **253 OK, 0 échec**, dont les
  dix codes copiés et le choix de la Sucrerie par les flèches du clavier.
  Modifications locales sur `emmanuel`, sans commit ni push Caramel.

- **29 septembre 2026 — Navigation intégrée et étiquette H5P dans `/decouvrir/` :**
  les cinq liens de section rejoignent la marque et les outils sur une seule ligne,
  avec un fond discret pour la section active. À 1 180 px et en dessous, le bouton
  « Explorer », traduit dans les douze langues, ouvre les liens dans le header ;
  fermeture après choix, clic extérieur, sortie du focus ou Échap. Échap rend le
  focus au bon bouton, sans être intercepté par le sélecteur de langue fermé.
  À 360 px et en dessous, le nom Explorer reste accessible et son icône seule
  laisse la place aux quatre outils. L'étiquette H5P utilise désormais le même
  HTML et les mêmes styles que Caramel, extraits dans
  `css/components/module-label.css` ; la tuile active et le focus la rendent visible.
  Chrome : rendu ordinateur et téléphone inspecté, absence de chevauchement
  vérifiée à 320 px. Banc présentation : **251 OK, 0 échec**, dont comparaison
  des styles H5P avec l'application, navigation au clavier et 60 combinaisons
  langue/largeur (320, 390, 760, 1 282 et 1 905 px). Modifications locales sur
  `emmanuel`, sans commit ni push Caramel.

- **29 septembre 2026 — Kit de formation compact dans `/decouvrir/` :** les dix
  lignes de codes vidéo sont remplacées par un sélecteur et un bouton de copie.
  Toutes les intégrations restent disponibles, dont MiniMoot à 1 h 25 min 31 s.
  Consigne raccourcie ; choix et confirmation de copie accessibles au clavier.
  Les trois cartes restent alignées sur ordinateur : hauteur mesurée dans Chrome
  à 1 282 px, 571 px au lieu de 1 131 px. Sur tablette, les tutoriels occupent la
  largeur sous les deux premières cartes ; sur téléphone, les cartes s'empilent
  sans débordement. Vérifications visuelles Chrome à 1 282, 760 et 390 px,
  passage du sélecteur au bouton par Tab confirmé. Versions des ressources
  actualisées pour éviter que Chrome conserve l'ancienne liste. Banc présentation :
  **184 OK, 0 échec**, dont les dix codes réellement copiés dans un presse-papiers
  simulé. Modifications locales sur `emmanuel`, sans commit ni push Caramel.

- **29 septembre 2026 — Licence et accueil de `/decouvrir/` :** libellés AGPL
  harmonisés dans les footers, douze langues, aide locale et quiz de présentation ;
  mentions légales précisées par périmètre. Voir `NOTE_LICENCES_2026-09-29.md` ;
  la licence pédagogique des démonstrations reste à choisir. Barre de présentation
  sur toute la largeur, styles communs avec Caramel dans `css/components/app-header.css`,
  boutons et sélecteur identiques ; navigation de section centrée sur ordinateur,
  défilable au clavier sur mobile. Accueil raccourci, fond crème, capture encadrée,
  suppression de la coulure et des tuiles flottantes ; chiffres déplacés après les
  trois étapes. Chrome : 36 combinaisons langue/largeur, sans chevauchement ni
  débordement de page ; menu de langues et fermeture Échap vérifiés. Tests
  présentation 173/0, styles/interface/mentions légales 721/0 sur cinq suites.
  Aucun commit ni push Caramel.
  Corrections de licence Sucrerie publiées sur `origin/emmanuel`, commit
  `e74fd099c80bc14f6e9c0945666d3338ed581f4d` ; référence distante confirmée et
  worktree propre. Les 52 fichiers partagés et leur manifeste restent intacts.

- **29 septembre 2026 — Footer de `/decouvrir/` :** libellé « Découvrir Caramel »
  identique à celui de l'application dans les douze langues. Le lien occupe le
  centre du pied, entre les auteurs et les liens utiles ; son texte reste visible
  sur mobile. Vérification Chrome à 1 282 px et 320 px : centrage et absence de
  débordement confirmés. Banc `/decouvrir/` : **173 OK, 0 échec**. Modifications
  locales sur `emmanuel`, sans commit ni push Caramel.

- **29 sept. 2026, publication de la synchronisation Sucrerie** — commit et push
  explicitement autorisés par Emmanuel pour la Sucrerie seulement. Commit
  `d98782011f0ec1fad95ba332b1972eb7ec807044` (« Synchroniser les Tests et les exports
  documentaires avec Caramel »), poussé sur `origin/emmanuel` ; la branche distante
  supprimée a été recréée. Référence vérifiée sur la Forge, worktree Sucrerie propre.
  Avant publication : suite complète Chrome 3 195/0 sur 156 suites, miroirs 52/52,
  manifeste SHA-256 et traductions conformes. Aucun commit ni push dans Caramel,
  aucune modification de `main` ; les vérifications Éléa encore ouvertes le restent.
- **29 sept. 2026, vidéos intégrées dans `/decouvrir/`** — sur demande d'Emmanuel,
  la fenêtre superposée est remplacée par l'agrandissement de la carte dans sa grille.
  Le lecteur natif reste dans la page, au format 16/9, avec fermeture et retour du
  focus au titre. Une seule vidéo lit à la fois, présentations principales comprises ;
  un filtre qui masque la carte arrête aussi son lecteur. Les intégrations publiques
  du webinaire Quartier libre (PodEduc), du Blog du Prof TIM (YouTube) et des deux
  vidéos Tube disponibles sont ajoutées ; leurs hôtes précis sont permis dans la CSP.
  Chrome réel : lecteurs YouTube, PeerTube, PodEduc et Ubicast affichés ; MiniMoot
  en lecture à 5 147 s après ouverture au point 5 131 s ; carte mobile à 311 × 175 px,
  sans débordement. Tests de branchement isolés des serveurs tiers : 172/0.
  La référence NotebookLM (`k9wg9JQRhwnkEhakQiAmCy`) renvoie 404 : lien conservé,
  nouvelle adresse demandée à Emmanuel ; aucune intégration inventée pour cette entrée.
  Aucun commit ni push.
- **29 sept. 2026, en-tête de `/decouvrir/`** — après le constat d'Emmanuel à
  1 282 px, marque et actions sur une première ligne, navigation sur une seconde.
  Intitulés et action principale sans coupure ; navigation conservée sur téléphone,
  défilable au toucher et au clavier. Sélecteur de langue positionné aussi en RTL ;
  recul des ancres calculé selon la hauteur réelle de la barre (traductions comprises).
  Chrome : douze langues à 320, 761 et 1 282 px, 36 configurations sans débordement
  de page ni chevauchement entre marque et actions ; menu ouvert/fermé avec Échap,
  dernier lien accessible au clavier sur téléphone et titre des ressources visible
  sous la barre en allemand. `node tests/run_decouvrir.mjs` : 154/0.
  Modifications locales sur `emmanuel`, aucun commit ni push.
- **29 sept. 2026, report vers la Sucrerie** — sept fichiers partagés synchronisés
  depuis ce dépôt `caramel.forge.apps.education.fr` sur `emmanuel` : formateur
  documentaire (#13), schéma et validateurs de l'éditeur, constructeur de cours,
  constructeur de Test seul, lecture/écriture des Tests et formats Moodle.
  Les 26 libellés des réglages sont présents dans les douze locales Sucrerie.
  Comparaison binaire : 52/52 identiques ; manifeste SHA-256 régénéré et vérifié.
  Huit suites ciblées 300/0 ; suite complète Sucrerie dans Chrome 3 195/0 sur
  156 suites, après adaptation du lecteur propre à Sucrerie : le refus partagé
  d'un Cloze incomplet devient un diagnostic traduit au lieu de casser le rendu.
  Vrais DOCX/ODT/PDF de la sonde #13 : image et textes présents, PDF local relu
  visuellement. Aucun commit ni push ; D87 et réimport du quiz sur Éléa restent
  ouverts. Le simulateur Sucrerie n'a pas reçu le port intégral des comportements
  D86 ; seuls lecture/édition/backup et son diagnostic d'entrée sont vérifiés.
  Preuves : `../sucrerie.forge.apps.education.fr/docs/SYNCHRONISATION_CARAMEL_2026-09-29.md`.
- **29 sept. 2026, corrections après l'aller-retour** — branche `emmanuel`, Éléa `test03`
  Moodle version non exposée. L'écart documentaire D88 est corrigé : les cinq images des
  blocs #08, #09 gauche/droite, #13 et #16 atteignent désormais DOCX, ODT et PDF (45/45,
  contre-épreuve #13 rouge). Le feedback global d'un Test généré est ajouté au contrat JSON,
  canonicalisé puis présent dans `quiz.xml` (120/0 ; audit Test 59/0). D87 reçoit une
  détection explicite de la langue enseignée et une consigne obligatoire dans les prompts
  d'activité et de parcours (58/0), mais attend encore un nouvel essai du vrai modèle et sa
  restauration Éléa. La démo `quiz-caramel.h5p` régénérée porte « Diapositive x sur y » dans
  le nom accessible des groupes ; son ancien import Éléa doit être remplacé avant verdict
  final. Page `/decouvrir/` : filtres réellement masquants, catalogue compact, repères SVG
  « à regarder / à lire », MiniMoot dans YouTube sans cookie à 1 h 25 min 31 s ; bandeau
  et pied rapprochés de ceux de Caramel, sélecteur à douze drapeaux (breton compris),
  traduction des repères éditoriaux et du catalogue, sens droite-à-gauche en arabe.
  Validation : page 154/0, suite navigateur 14 435/0 sur 42 suites.
- **29 sept. 2026, aller-retour sur Éléa `test03`** — version de Moodle non exposée dans
  l'interface. Importés : `test-defauts-20260929-1858.mbz`,
  `test-regle-20260929-1858.mbz`, `parcours-test-regle-20260929-1858.mbz`,
  `sonde-page-images.mbz`, `sonde-livre-images.mbz`,
  `sonde-parcours-page-images.mbz`, puis `quiz-caramel.h5p`, `vocabulaire.h5p`,
  `en-une-phrase.h5p` et `mots-meles.h5p`. **D86 conforme** : réglages et
  prévisualisation attendus ; les `quiz.xml` des trois réexports Éléa sont identiques aux
  sorties Caramel sur `review*`, comportement, tentatives, méthode de note, durée,
  pagination, navigation, pages des slots et feedbacks. Le `questionsperpage=0` du Test
  par défaut est la correction volontaire de D86 par rapport au témoin Moodle de sept.
  **D88 conforme sur Éléa, avec un écart documentaire local alors observé** : les deux images sont de vrais
  `pluginfile.php`, restent présentes après enregistrement et s'affichent en rôle Étudiant ;
  le premier chapitre des Livres n'a pas d'image, le second en a deux. Dans les vrais exports
  DOCX/ODT/PDF, attendu : cinq occurrences pour #08, #09 gauche/droite, #13 et #16 ; observé :
  quatre, l'image de #13 manque. **D87 en écart sur les webhooks de développement** :
  le témoin histoire-géographie reste en français ; les productions anglaises gardent
  plusieurs libellés, titres ou noms de questions français, les productions espagnoles
  restent largement françaises ; parcours de langue et restauration non mesurés.
  **Démonstrations H5P en écart** : les quatre activités s'importent et fonctionnent en
  français (quiz terminé à 7/7, cartes retournées, texte complété et corrigé, grille des
  mots mêlés chargée), mais la région `aria-live` du quiz reste vide au changement de
  question au lieu d'annoncer « Diapositive 1 sur 7 » ; aucun jeton brut `@slide` n'est
  affiché. La résolution complète de la grille en canevas n'a pas été automatisée.
- **29 sept. 2026, soir** — **D86** : réglages du Test (`quiz_settings`) pour le Test seul
  et le Test d'un parcours, par une fonction partagée par les deux constructeurs ;
  défauts alignés sur Éléa (relecture, délai de grâce, `precreateattempts`, achèvement et
  carnet du Test seul) ; section « Réglages du test » dans l'éditeur ; aperçu en feedback
  différé ; relecture/réécriture sans perte d'un Test importé. Sondes produites, aller-retour
  Éléa À FAIRE avant toute annonce.
- **29 sept. 2026, soir** — **D88** : envoi d'image depuis l'ordinateur dans les blocs de Page et
  de Livre, fichiers joints au backup (Page seule, Livre seul, cours). `run_page_images.mjs`
  44/0, trois contre-épreuves au rouge. Sondes fabriquées ; **aller-retour Éléa à faire**.
- **29 sept. 2026** — **D85** : « Importer un modèle » en haut de l'atelier (un temps aussi
  dans le pied du cadrage, retiré le matin même), « Nouveau parcours » visible dès le cadrage,
  question « Commencer un nouveau parcours ? » avec son export annexe. Banc dédié 19/0,
  contre-épreuvé. Déployé en prod pour une formation du jour.
- **28 sept. 2026, après-midi** — **D81, état de l'art didactique** : trames confrontées à
  ABC Learning Design, aux didactiques et aux sciences cognitives
  ([document](ETAT_DE_L_ART_DIDACTIQUE_PARCOURS_2026-09-28.md), références vérifiées).
  Quatre structures ajustées (Vrai/Faux isolé → série ; projet : critique puis reprise ;
  formation : devoir, forum, test final), toutes les intentions précisées, deux règles de
  plan, `remarquesComposition()`, une intention par ampleur. Trois générations réelles
  successives ont été nécessaires : la première a buté sur une coupure réseau, la deuxième a
  montré que la règle du prompt ne suffisait pas contre le second Document collaboratif et
  que « en version longue » finissait en titre. Cinq parcours réels en banc (deux nouveaux :
  Réviser 5ᵉ, Projet 4ᵉ), banc réel 200/0 avec contre-épreuve « question notée sur la
  pratique », calibrage 70/0.
- **28 sept. 2026, midi** — **Aller-retour de la sonde du matin (Éléa 804, Magistère 2563)** :
  restauration complète sur les deux plateformes ; au ré-export, 0 écart sur les 19 (Éléa) et
  21 (Magistère) modules natifs, Paquetage IMS compris, fichiers IMS et Document collaboratif
  revenus au SHA-1 près. Test : 10 questions, 6 types, éditeur sans erreur. Magistère affiche
  trois NOTIFICATIONS (pas des erreurs) : « La catégorie de questions « top » […] sera créée
  dans un contexte du module banque de question ». Cause : le constructeur partagé range les
  catégories du Test dans le contexte du COURS (niveau 50, forme Moodle 4) ; un export natif
  Moodle 5.1 les range dans le contexte du TEST lui-même (niveau 70, « top » + « Défaut pour
  <nom du test> »), relevé sur l'export d'Éléa du 27 sept. Moodle 5 déplace donc les questions
  dans un module « banque de questions » et le signale. Sans conséquence ; alignement possible
  dans `mbz-course-builder.js` (partagé avec la Sucrerie : propagation et nouvel aller-retour).
- **28 sept. 2026** — **D78, D79, D80** : écran de livraison réordonné (le cours d'abord,
  le `.json` en « reprendre plus tard ») ; Rédaction à variantes orphelines réparée ;
  Paquetage IMS écrit par Caramel, sur demande (aller-retour à faire) ; trois parcours réels
  générés par le vrai pipeline et gardés en banc ; jargon, registre et questions à trous
  injouables corrigés à la source ; puis espaces communs, geste du module, rôles de la trame
  Débat, sondages comparables, exemples de prompts à l'impersonnel, texte à trous de
  Présentation nettoyé. Bancs natifs 158, parcours réels (avec contre-épreuve) au vert.
- **28 sept. 2026** — **D77** : classe virtuelle sur Magistère seul ; palettes relues en
  direct et tenues par le banc (`palettes.json`) ; trois lignes de description et fond uni
  de sélection sur les cartes de trame ; vignettes H5P non déformées et pictogramme « rien à
  générer » dans la mosaïque. Bancs natifs 120.
- **28 sept. 2026** — **Mosaïque des types, vignettes des modules de la plateforme,
  alternatives dans les trames, deux trames nouvelles, export documentaire (D76).**
  Vérifié en réel au passage : sur quatre plans composés par l'IA, les modules de la
  plateforme sont bien proposés (1/10, 3/11, 7/11, 0/4 pour une séance courte) — mais une
  classe virtuelle en présentiel, d'où le filtre de modalité.
- **27 sept. 2026, soir** — **Premier aller-retour des modules natifs : échec total, cause
  trouvée et corrigée (D75).** Les deux sondes s'arrêtent sur
  `mod_collabora/initialfilemissing` : le Document collaboratif exige son fichier de
  départ à la restauration. Fichier désormais embarqué ; sondes régénérées. **Second
  aller-retour, le soir même : VALIDÉ sur les deux plateformes**, 0 écart entre ce que
  Caramel écrit et ce que la plateforme ré-exporte (§ 10).
- **27 sept. 2026** — **La palette s'ouvre aux modules de la plateforme (D70 à D74).**
  Deux cours de test remplis de tous les types de leur palette (Éléa : 36, Magistère : 29),
  avec contenu, puis exportés ; formes relevées dans `tests/fixtures/moodle-reference/sept-2026/`.
  Quatorze modules livrés (`modules-natifs.js`) : questionnaire, enquête, leçon, atelier,
  tableau, wiki, glossaire à construire, document collaboratif, Etherpad, partage de
  fichiers, classe virtuelle, base de données, choix de groupe, lien web. Modules sans
  achèvement hors de l'ouverture progressive (D71) ; étiquette « À faire » cachée aux élèves
  (D72) ; famille « Échanger » (D73) ; trames, menu groupé et prompt de plan (D74).
  Bancs : **modules natifs 102 PASS / 0 FAIL** (forme de chacun identique au relevé, balise
  pour balise), miroir 21, relecture 46. Constats du relevé : le Partage de fichiers est
  arrivé sur Éléa ; Capytale est un outil LTI dont l'identifiant change d'un site à l'autre ;
  les jeux Mots croisés / Mots mêlés d'Éléa peuvent se nourrir d'un Test. **Aller-retour réel
  des deux sondes à faire** (restauration dans un cours, puis ré-export) : la restauration
  pilotée par l'outil a été bloquée par son garde-fou de sécurité, elle revient à la main.
- **10 sept. 2026** — Consolidation UX et fiabilité, décisions D47–D50. Relecture
  commune avec éditeur, aperçus Moodle et lecteur H5P ; sauvegarde immédiate des
  retouches, reprise de scénario dès le cadrage, annulation des modifications
  structurelles, génération annulable sans écriture tardive, conservation du contenu
  en cas d'échec de régénération, livraison partielle. Tutoriel et RAG préparés dans
  douze langues. Banc de gestes réels et contrôle documentaire ajoutés ; mémoire
  détaillée dans [le suivi](SUIVI_CONSOLIDATION_PARCOURS.md).
- **7 sept. 2026** — **D46 : le commutateur « Une activité | Un parcours » au centre de la
  barre**, décidé par Emmanuel sur maquette cliquable (deux variantes maquettées dans la
  vraie page : rangée des filtres, barre d'application ; la seconde retenue). Remplace le
  bouton d'en-tête (D38, D45). Barre mesurée à treize largeurs, tient de 360 px en haut.
  Atelier **119 PASS / 0 FAIL**.
- **7 sept. 2026** — **D45** : le bouton d'en-tête dit où il mène (« Parcours » ⇄
  « Activités »), fermer remonte en haut, la tête de l'atelier perd cartouche et lien de
  sortie. Atelier **117 PASS / 0 FAIL**.
- **7 sept. 2026** — Le libellé « Parcours » ne scintille plus au chargement (§ 7) :
  défaut français + `data-key`, comme les autres boutons de la barre. Atelier **115 PASS**,
  contre-épreuve rouge.
- **7 sept. 2026** — Quatre retours d'Emmanuel sur l'écran du plan, dans la nuit : la
  galerie des cartes (D42, trente vignettes du greffon embarquées et créditées), la
  durée en heures et minutes avec son infobulle (D43, `duree.js`), les colonnes fixes des
  cartes et la majuscule en tête des objectifs (D44). Atelier **112 PASS / 0 FAIL**,
  mentions légales conformes avec le dossier des cartes inventorié.
- **6 sept. 2026, nuit** — **D41** : les trois chemins du plan gardés et nommés en tête
  des étapes, le palier expliqué au survol (5 clés × 12 locales). **Bug** : « Structure
  libre » puis « Partir du modèle » ne faisait rien — ouvre désormais des étapes vides
  dimensionnées par l'ampleur (§ 7). Atelier **106 PASS / 0 FAIL**.
- **6 sept. 2026, soir** — **Seconde relecture, sur retour d'Emmanuel** (§ 12) : les
  réglages du cours en carte à interrupteurs (ceux de Caramel), les cartes d'activité
  sur deux lignes au lieu de trois (60 px contre 125), le fil des étapes qui navigue
  (D40), la sortie en lien discret, les titres à l'échelle de Caramel. Deux notes
  raccourcies dans les 12 locales. Atelier **103 PASS / 0 FAIL**.
- **6 sept. 2026** — **L'atelier vit dans la page, à la place des tuiles** (D39, décidée
  par Emmanuel quelques heures après D38 : la fenêtre plein écran était l'intégration
  détestée, pas le bouton). Le bouton « Parcours » bascule les tuiles et l'atelier ; le
  formulaire de l'accueil reste au-dessus, vivant, et l'en-tête du site ne bouge pas.
  Trois simplifications en cascade : le récapitulatif du contexte disparaît (neuf clés
  de moins, le sujet tapé au-dessus débloque l'action en bas), la barre d'action rejoint
  le flux au pied de l'écran (« le bas était bizarre »), et la fabrication démarre
  d'elle-même après « Fabriquer le parcours (6 activités) » — le clic qui nomme le coût.
  Un piège trouvé en mesurant : `hidden` n'effaçait pas la grille (le `display: grid`
  de Caramel l'emporte), elle restait affichée sous l'atelier. Atelier **96 PASS / 0
  FAIL**, dont une section entière par de vrais clics ; contre-épreuve du démarrage
  automatique rouge.
- **6 sept. 2026** — **L'entrée de l'atelier passe dans la barre d'en-tête** (D38,
  décidée par Emmanuel après analyse et maquette, § 12). Un bouton « Parcours » en
  première position, frère de Tchap, Sucrerie et Tutoriel — leur classe, l'icône en
  caramel, le point de reprise en bleu comme celui de Notifications. La pastille
  flottante, son dépliage tactile et son CSS disparaissent ; Caramelia reste seule en bas
  à droite. **La barre a été mesurée à dix largeurs, avant et après** : elle débordait
  déjà à 500 et 360 px avec cinq entrées ; à six, deux règles dans la CSS de Caramel
  (libellés effacés sous 600 px, mot « Caramel » effacé sous 480) la font tenir de 360 px
  en haut. Le module ne pose rien sans barre d'en-tête, et le dit. Atelier
  **78 PASS / 0 FAIL**.
- **6 sept. 2026** — **La fiche de séquence dit désormais ce que le cours FERA.** Les
  deux réglages livrés aujourd'hui — la Carte de progression et l'ouverture
  progressive — n'apparaissaient nulle part sur le papier : un enseignant relisant sa
  fiche avant la séance n'y aurait pas lu que l'étape 2 ne s'ouvrirait qu'une fois
  l'étape 1 faite. Ils entrent dans l'en-tête, et **seulement quand ils s'appliquent
  vraiment** : pas de Carte sur une plateforme qui n'a pas le greffon, pas d'ouverture
  progressive sur une seule étape. 2 clés × 12 locales, fiche : **31 PASS**, deux
  contre-épreuves rouges. Une fonctionnalité livrée sans son papier n'est livrée qu'à
  moitié — c'était la dette du jour, elle est soldée.
- **6 sept. 2026** — **Sept trames sur dix-sept promettaient une activité que
  l'atelier ne sait pas produire** (D37). Elles nommaient la Vidéo interactive,
  l'Image interactive ou « Trouve la zone » — que D20 écarte, faute de vidéo ou
  d'image de fond à fournir —, et l'aperçu de structure les affichait sur la carte
  de la trame. L'enseignant choisissait en lisant « Vidéo interactive » et recevait
  autre chose. Les sept sont corrigées à structure et palier constants ; les
  substitutions sont dans le tableau de D37, et se rediscutent en une ligne.
  **Un second défaut les rendait invisibles** : `planDepuisTrame()` écrivait
  `moduleReplie: false` en dur, si bien que la voie « partir du modèle » (D11)
  substituait en silence là où la voie IA marquait la carte. Deux chemins, deux
  comportements, pour la même situation.
  **C'est la contre-épreuve qui a trouvé les deux.** Le contrôle « aucune trame ne se
  replie » passait au vert sur des trames fautives : en le désarmant, il restait vert.
  Un contrôle qui ne rougit pas quand on casse ce qu'il surveille ne surveille rien —
  la même leçon que le décalage du `splice`, deux heures plus tôt, et dans la même
  session. Les 17 trames sont maintenant passées au routeur sur les TROIS plateformes,
  et zéro repli est exigé. Atelier : **76 PASS**.
- **6 sept. 2026** — **Le glisser-déposer entre sur l'écran du plan** (D36), et le
  lot 1c est clos. Poignée sur la VIGNETTE et non sur la carte entière : rendre la
  carte déplaçable aurait cassé la sélection de texte dans ses champs, sur un écran
  qui sert d'abord à écrire. Réordonnancement dans une étape et d'une étape à
  l'autre, dépôt possible dans une étape encore vide, trait d'insertion du côté où
  la carte tombera. Les quatre boutons de chaque carte ne bougent pas, et la poignée
  reste hors tabulation : « en surcouche des flèches, jamais à leur place » vaut
  aussi dans l'arbre d'accessibilité. 1 clé × 12 locales. Atelier : **73 PASS**.
  **Une contre-épreuve a d'abord échoué à échouer**, et c'est elle qui a rendu le
  banc utile : désarmer le décalage d'index du `splice` ne cassait rien, parce
  qu'aucun cas ne déplaçait une carte VERS L'AVANT dans sa propre étape — le seul
  qui distingue les deux calculs, et seulement à partir de trois cartes. Le cas
  ajouté, la contre-épreuve mord. Un test qui ne rougit pas quand on casse ce qu'il
  surveille ne surveille rien.
- **6 sept. 2026** — **Le miroir est livré** (D4 tenu, D35). Cinq familles nommées en
  français ordinaire — Découvrir · Mémoriser · S'exercer · Organiser · Produire —,
  une rangée de tuiles EN BAS de l'écran du plan, et les constats en toutes lettres.
  D4 promettait l'analyse des types d'apprentissage « en RETOUR, comme un miroir » :
  c'est ce que sa place et sa forme disent. Il n'énonce aucune répartition idéale,
  parce qu'il n'y en a pas ; il ne dit que des faits — ce qui est absent, et si une
  famille dépasse la moitié.
  **Deux choix de forme, tous deux contre l'instinct.** Ce ne sont pas des barres :
  cinq nombres entre 0 et 6 dont l'information principale est le ZÉRO, or un zéro
  n'occupe aucune largeur dans une barre — le graphique aurait caché ce qu'on veut
  montrer. Et les tuiles réemploient `.pc-summary` du bandeau du haut : aucun
  vocabulaire visuel nouveau (D3).
  **Le contrôle qui compte est celui de la couverture** : les 42 modules que Caramel
  sait produire appartiennent à une famille, et un type ajouté demain sans être
  classé fait rougir le banc avant de s'afficher « hors familles » chez l'utilisateur.
  Banc Node pur : **19 PASS**, trois contre-épreuves rouges. 11 clés × 12 locales.
  Atelier : **66 PASS**.
- **6 sept. 2026** — **L'ouverture progressive est livrée** (D33). Une étape ne s'ouvre
  que lorsque TOUTES les activités de la précédente sont terminées : ce que la Carte
  donne à voir, en vigueur. La condition se pose sur la **section** — c'est ce que le
  réglage annonce, elle s'écrit une fois par étape au lieu d'une fois par activité, et
  Moodle la fait respecter aux activités qu'elle contient — et **après l'assemblage**,
  en une passe, pour ne rien apprendre du parcours au constructeur partagé (D28).
  L'étape reste VISIBLE, grisée, avec sa raison : on ne cache pas le chemin qu'on trace.
  Trois gardes contre un parcours qui se fermerait sur lui-même — l'étape 1 n'est jamais
  contrainte (sa devancière serait la section 0, où la Carte ne s'achève jamais), rien
  n'est posé sous deux étapes, et la livraison DIT quand le réglage est resté sans effet.
  7 clés × 12 locales. `.mbz` de cours **103 PASS**, atelier **63 PASS**, trois
  contre-épreuves rouges, suite navigateur 14 200 / 0.
  **Deux défauts trouvés au passage, dans le banc et dans la sonde.** Le banc AVORTAIT
  sur une condition mal formée au lieu d'échouer proprement, ce qui masquait tout ce qui
  suivait ; et la sonde recopiait les étapes de l'assemblage au lieu d'appeler
  `assemblerParcours` — si bien qu'elle avait cessé de poser l'ouverture progressive
  sans que rien ne le signale. Une sonde qui recopie le produit finit par le recopier de
  travers : elle passe désormais par le chemin de production exact.
  **La différenciation par le résultat n'en découle pas** (D34) : elle bifurque là où
  D33 enchaîne, et demande un modèle de plan qui sache exprimer des alternatives.
- **6 sept. 2026** — **La Carte de progression revient d'Éléa intacte** (§ 10). Import
  au bout, 14 activités sur 14, carte en section 0, `targetsection` à 666,
  `showdescription` à 1, achèvement inchangé sur les quatorze, Test et pool exacts.
  **Le risque qui commandait tout est retiré** : la grammaire du nom passe — le greffon
  a retrouvé `maplandscape.jpg` depuis « Carte standard : paysage », sans quoi la
  restauration se serait arrêtée là (D30).
  **D31 est vérifiée en vrai** : nous envoyons une intro vide, Éléa renvoie un HTML
  entier portant SON hôte (`aura-38-nord…`), un `mapid` neuf, un `gameid` tiré au sort
  — et, dedans, notre tracé au caractère près et notre `descriptionheader`. Écrire une
  intro nous-mêmes n'aurait servi à rien, sinon à mentir sur le site d'accueil.
  **Et le ré-export a corrigé deux déductions successives, dont la mienne d'une heure
  plus tôt.** Recensement fait pour de bon — tous les champs `completion*`, plus le
  code des greffons : **il n'y a pas de trou d'achèvement**. Chaque activité porte le
  critère qui convient à sa nature (la note, la consultation, le dépôt, une tentative,
  une note déposée), et les trois greffons Éléa implémentent réellement leur règle
  (`classes/completion/custom_completion.php`). L'achèvement d'activité n'est donc pas
  un chantier : c'est le prérequis, satisfait, des **restrictions d'accès**. La leçon
  de méthode est en § 6 : un recensement s'énumère, il ne s'échantillonne pas.
  **Il reste un regard à porter** : ce que la carte affiche à l'écran, et combien
  d'icônes s'y posent (attendu : douze). Jusque-là elle reste décochée par défaut.
  Le XML revenu d'Éléa est archivé, anonymisé, en fixture — et le banc compare
  désormais chaque champ stable à ce que la plateforme a renvoyé : on ne peut plus
  dériver de la seule version dont on sache qu'elle s'importe (**93 PASS**).
- **4 sept. 2026** — **La Carte de progression est livrée** (lot 2, D29 à D32). Le
  seul module qui donne à voir un parcours comme un parcours : un chemin sur une
  image, une icône par activité, posée en section 0 avec `targetsection = 666`
  (« Toutes les sections ») — donc tout le parcours sur un seul tracé. Elle n'est
  PAS une carte du plan : pas de génération, pas de place dans le plafond de douze,
  une case et un menu de thème sur l'écran du plan, Éléa seul (D26). 30 thèmes
  relevés du catalogue du greffon, 5 clés × 12 locales — et **zéro clé pour les
  thèmes**, dont le nom est ce que la plateforme écrira (D32). `.mbz` de cours :
  **93 PASS / 0 FAIL**, atelier **59 PASS / 0 FAIL** (dont le bloc lu dans le DOM
  réel), sept contre-épreuves rouges.
  Suite navigateur inchangée (14 200 PASS / 0 FAIL). **Aucun fichier partagé
  touché** : `SELF_CONTAINED_MODULES` ne sert qu'au chemin des `.mbz` déposés sur
  La Sucrerie, que Caramel n'emprunte pas — un point du plan de lot 2 revu (D29).
  **La dernière inconnue est tombée en lisant le code, pas en important un
  fichier.** L'intro est régénérée AU RESTORE
  (`restore_mapmodules_stepslib.php`) : on la pose vide (D31). Et le relevé
  ré-exporté ne pouvait pas trancher — il compare deux cartes DIFFÉRENTES
  (« planisphère » contre « louise »), ce que personne n'avait vu.
  **Deux découvertes que personne ne cherchait**, toutes deux dans `lib.php` :
  (a) le NOM de l'activité est le sélecteur d'image, et un nom libre fait échouer
  l'import du cours entier — un `char(255)` irréprochable qui casse quand même,
  d'où l'extension de D27 en D30 : lire aussi `lib.php` et le `restore_stepslib` ;
  (b) une carte n'affiche que les activités dont l'ACHÈVEMENT est suivi, et seules
  celles qui portent une vraie condition peuvent passer au vert — la Carte rend
  ainsi visible l'état de l'achèvement d'activité et désigne d'elle-même le
  chantier suivant. **Aller-retour réel à faire** : la carte est donc décochée par
  défaut, et la sonde Éléa la porte avec sa liste de contrôle (§ 10).
- **4 sept. 2026** — **La fiche de séquence est livrée** (lot 2). Deux documents, en
  DOCX, ODT et PDF, depuis l'écran de livraison : **la FICHE** — le plan, un bloc par
  étape avec son objectif en toutes lettres et un tableau activité / type / palier /
  durée, les notions pivots en tête et les consignes en fin — et **le DÉTAIL** des
  activités générées, qui réutilise `exportCourseTo*` sans une ligne de rendu nouvelle.
  Les confondre donnerait trente pages là où l'on en voulait une.
  Le formateur ajouté au fichier PARTAGÉ est **autodescriptif** (D28) : il ne connaît
  pas le vocabulaire du parcours, donc **aucune clé i18n nouvelle côté Sucrerie**.
  23 clés × 12 locales ici. Banc dédié : **28 PASS / 0 FAIL**, dont la preuve que le
  formateur est bien trouvé (le repli générique, lui, cracherait du JSON brut). DOCX réel
  produit et relu : 2 tableaux Word, 5 lignes, tout à sa place. Atelier : 52 PASS / 0 FAIL.
  Propagé sur la branche `emmanuel` de Sucrerie (`e45e382`).
- **4 sept. 2026** — **Les six garde-fous didactiques sont livrés** (§ 5). Une relecture
  du plan avant toute génération, qui affiche et ne bloque jamais : objectif annoncé et
  non recopié, au moins une activité qui vérifie, un objectif par étape, une correction à
  l'entraînement, des types qui alternent, un volume horaire tenable. Bloc ambre au-dessus
  des étapes, redessiné à chaque retouche, avec surlignage de ce qui est en cause.
  Module PUR, donc banc **Node** sans navigateur : `run_parcours_gardefous.mjs`,
  **46 PASS / 0 FAIL**, trois contre-épreuves rouges. 21 clés × 12 locales.
  **Elle a servi le jour même** : passée sur les 17 trames du dépôt, elle a trouvé quatre
  étapes « entraînement » sans rien qui corrige — corrigées — et m'a fait rectifier ma
  propre conception, le contrôle devant porter sur l'étape et non sur l'activité.
  Atelier : 49 PASS / 0 FAIL.
- **4 sept. 2026** — **`targetsection = 666` veut dire « Toutes les sections »**, lu sur
  le formulaire d'Éléa. Ce n'était ni un identifiant ni un vestige : une carte posée en
  section 0 avec cette valeur montre **tout le parcours**, ce qui règle d'un coup la
  question « une carte par étape ou une seule ». Relevé au passage les deux seuls champs
  où une IA aurait à écrire (`descriptionheader`, `descriptionfooter`). Il ne reste qu'une
  inconnue avant d'ouvrir le module : *quand* le plugin réécrit son intro (§ 6).
- **4 sept. 2026** — **Deux découvertes qui viennent de l'usage, pas du code.**
  (a) Sur Éléa, les Jeu – Mots croisés et Mots mêlés NATIFS n'ont pas de contenu propre :
  ils se construisent depuis les entrées du **glossaire** du cours. Le glossaire, écarté
  par D23, ne coûtait donc pas un module mais **trois** — de quoi rouvrir le dossier, avec
  une piste précise (`userinfo` par activité) et la manip qui la tranche (§ 6).
  (b) La **Carte de progression** survit à un réimport dans un autre cours, et elle a des
  images par défaut : deux des trois inconnues tombent. Ce qui reste n'est plus technique
  mais pédagogique — une carte cible une section, un parcours en a plusieurs (§ 6).
- **4 sept. 2026** — **La palette d'Éléa relevée : le mur de post-it s'y ouvre, le nuage
  de mots non.** Les deux greffons venaient du MÊME export de Magistère et on aurait juré
  qu'ils allaient de pair — Éléa propose Sticky Notes et pas le Nuage de mots. C'est la
  démonstration de D26, à peine posé : la disponibilité se constate plateforme par
  plateforme. Les deux palettes sont désormais consignées en § 6 (35 tuiles côté Éléa,
  29 côté Magistère, un recouvrement partiel malgré le même Moodle 5.1.5). `.mbz` de
  cours : **69 PASS / 0 FAIL**. Repéré au passage la **Carte de progression**
  (`mapmodules`, Éléa seul) : le candidat le plus intéressant du lot 2 — c'est le seul
  module qui donne à voir un parcours comme un parcours — mais trois inconnues le
  retiennent, et un seul test les lèverait toutes (§ 6).
- **4 sept. 2026** — **Aller-retour Éléa : rien à signaler**, ce qui est le résultat
  attendu (§ 10). Les correctifs des trois tours précédents n'ont rien cassé : 12
  activités, 5 sections numérotées juste, greffons Éléa intacts, Test et pool exacts,
  zéro écart au diff. Relevé au passage : **Éléa et Magistère tournent sur le même
  Moodle 5.1.5** (build 20260608), ce qui explique leur comportement identique depuis
  le premier import. Les deux greffons tiers n'y étaient pas — un backup ne dit pas ce
  qui est installé sur le site, seule la palette d'Éléa le dira.
- **4 sept. 2026** — **Le nuage de mots et le mur de post-it sont validés** (§ 10).
  Import Magistère complet après le correctif du `char(20)` : 11 activités, sections
  denses, les deux greffons intacts avec leurs textes et leurs colonnes, l'achèvement
  propre conservé, le Test et le pool inchangés. Les trois cas de troncature vérifiés
  sur la plateforme : intact / raccourci au mot / 20 pile intact. **Cinq modules de
  parcours livrés et éprouvés.** Reste à voir la palette d'Éléa pour les y ouvrir (D26).
- **4 sept. 2026** — **L'aller-retour du mur de post-it échoue, et c'est instructif**
  (D27, § 7). L'import s'arrête à 79 % sur « Erreur d'écriture vers la base de données ».
  Cause : `stickynotes_column.title` est un `char(20)`, l'étape de restauration du
  greffon fait un `insert_record` brut, et deux de nos trois titres de sonde faisaient
  22 et 23 caractères. Un dépassement ne dégrade pas l'activité — il fait échouer la
  restauration du COURS ENTIER, sur un message qui ne nomme ni le module ni le champ.
  Diagnostic obtenu en lisant le `db/install.xml` et le `restore_stepslib` du plugin,
  publics tous les deux : la moitié du travail de ce lot est de la lecture de code
  amont. Plafond posé au prompt, au libellé et à la fabrique ; 5 assertions de plus au
  banc (**67 PASS / 0 FAIL**), contre-épreuvées (désarmer la troncature en casse 3).
  Le nuage de mots, lui, était conforme au champ près — son schéma est large.
- **4 sept. 2026** — **Deux modules de plus, et une méthode qui remplace le pari**
  (D25, D26). Le Nuage de mots (`collabwordcloud`) et le Mur de post-it
  (`stickynotes`) entrent dans la palette, recopiés champ par champ sur un export
  authentique de Magistère (Moodle 5.1.5) au lieu d'être écrits de mémoire ; le banc
  compare désormais la séquence de balises produite à cette référence. Ils sont
  déclarés sur **Magistère seul** tant que la palette d'Éléa n'a pas été vue. Le
  registre pilote maintenant le prompt ET le formulaire de retouche (`longs`,
  `listes`) : un module ajouté n'a plus rien à modifier ailleurs. 6 clés × 12 locales.
  `.mbz` de cours : **62 PASS / 0 FAIL**. Reste l'aller-retour réel pour ces deux-là.
  L'export a aussi livré les carcasses de 13 autres modules — la matière du lot 2.
- **4 sept. 2026** — **Second aller-retour : les trois modules de parcours sont validés**
  (D24, § 10). `label`, `forum` et `choice` reviennent intacts d'Éléa ET de Magistère —
  consigne, nom, et les trois options du sondage. Tout le reste retraverse aussi : 12 et 9
  activités, sections dans l'ordre, Test à 10 slots sans orphelin, `.h5p` octet pour octet,
  carnet exact, greffons Éléa entiers (5 questions, 6 questions, 7 paires). **La palette est
  ouverte pour de bon.** Deux corrections au passage : la sonde numérotait ses sections en
  dur (« 1, 2, 4, 5 » sur Magistère, faute du bloc Éléa écarté), et le § 6 classait à tort
  Tableau / Sticky Notes / Nuage de mots / Partage de fichiers en greffons Éléa — la palette
  de Magistère les propose. Palette Magistère complète relevée en § 6.
- **3 sept. 2026** — Lot 1a et 1b : pastille symétrique, atelier, écran de cadrage,
  73 clés × 12 locales.
- **3 sept. 2026** — Visuel réaligné sur l'interface existante (D3) et création de ce PRD.
- **3 sept. 2026** — Lot 1c : prompt de plan, aiguillage par plateforme, tableau de bord.
  Vérifié contre le modèle réel : rythme respecté, 15 notions, 0 module inventé.
- **3 sept. 2026** — Bibliothèque portée de 9 à 17 trames, aperçu de structure sur chaque
  carte (D14), départ sans IA (D11), marquage « personnalisé » (D12), largeurs corrigées
  (D13). 136 clés × 12 locales.
- **3 sept. 2026** — D9 tranché : le constructeur de cours est porté dans Caramel. Plan de
  portage détaillé en § 3, lot 1e.
- **4 sept. 2026** — **La palette s'ouvre** (lot 2) : `label`, `forum` et `choice` entrent
  dans le parcours, avec leur propre registre (D22), un prompt dédié, un formulaire de
  retouche et une place dans la sonde. Choisis sur le critère que le Glossaire nous a
  appris (D23) : leur contenu est de la configuration d'activité, donc il survit. 9 clés ×
  12 locales. Banc du .mbz de cours : 50 PASS / 0 FAIL. **Leur XML reste à valider par un
  aller-retour réel** — c'est la seule chose qui manque.
- **4 sept. 2026** — **Aller-retour réel BOUCLÉ** (§ 10). Tout revient : activités,
  sections, carnet de notes, banque du Test (10 slots, 0 orphelin, 15 entrées), et les
  `.h5p` octet pour octet. Le bandeau rouge est une migration de banque, sans conséquence.
  **Un seul défaut réel** : les entrées de glossaire, données utilisateur pour Moodle,
  reviennent à zéro — `glossaireXml` sort de la palette (§ 7). Éléa et Magistère se
  comportent à l'identique. **Le lot 1 est bouclé.**
- **4 sept. 2026** — **Premier aller-retour réel.** La sonde s'importe jusqu'au bout sur
  Éléa ET sur Magistère. Les deux affichent les mêmes trois bandeaux rouges à l'étape
  « Effectuer la restauration » — avis de migration des catégories de questions de contexte
  cours vers un module « banque de questions » (Moodle 4.5), non bloquant : cf. § 7. Que les
  deux plateformes se comportent à l'identique est en soi une bonne nouvelle. Reste à relire
  le cours restauré et le ré-export.
- **4 sept. 2026** — Sonde de parcours (§ 10) : `node scripts/generer-parcours-sonde.mjs`
  pose un `.mbz` de 10 activités couvrant les trois voies d'assemblage, plus sa fiche de
  relevé — sans un seul appel au modèle. L'aller-retour réel n'attend plus que l'accès à une
  plateforme.
- **4 sept. 2026** — Lot 1e CLOS : propagation faite sur la branche `emmanuel` de Sucrerie
  (`main` intacte). Le fichier partagé est byte-identique des deux côtés, inscrit au
  manifeste, et les deux appelants fournissent `ecrireArchive`. Suite Sucrerie du
  constructeur : 41 PASS / 0 FAIL. Les deux `CLAUDE.md` passent à 42 fichiers miroir.
  Point de reprise vérifié au passage : `run_parcours_atelier.mjs` → 40 PASS / 0 FAIL.
- **4 sept. 2026** — Lots 1d et 1f livrés : file de fabrication en série stricte (D18),
  socle commun injecté dans chaque remplissage, écran de fabrication avec statut par ligne,
  reprise à l'unité et édition visuelle sur place ; écran de livraison avec le `.mbz` de
  cours, les activités écartées nommées, la marche à suivre, et le scénario `.json`
  aller-retour (D21). 46 clés × 12 locales. `node tests/run_parcours_atelier.mjs`
  → 37 PASS / 0 FAIL. Deux défauts trouvés et corrigés au passage : les virgules orphelines
  du modèle (voir § 7) et le repli `mbz-parser.js` du fichier partagé.
- **4 sept. 2026** — Lot 1e livré. `mbz-course-builder.js` porté (1 848 lignes), identité de
  l'hôte paramétrée (D17) et contre-épreuvée à l'octet près, `extractMbz` court-circuité par
  `parcours-builder.js`, mise en forme Moodle factorisée (D16), `createMbz` réparé sur les
  octets bruts. **Le Test natif est assemblable** : `node tests/run_parcours_course.mjs`
  → 41 PASS / 0 FAIL, sur le vrai pipeline dans Chromium. Suite navigateur inchangée
  (14 200 PASS / 0 FAIL). Reste à faire côté Sucrerie : recopier le fichier partagé et
  l'inscrire au manifeste.


### Complément du 11 septembre — transfert vers Sucrerie

Décision : déposer un parcours comme **une publication MBZ intégrale**, type
`parcours`, depuis la livraison. Une collection garde son rôle de rangement et
peut référencer ce fichier ; elle ne remplace pas son archive par une série de
publications d'activités. Le marqueur `caramel-parcours.json` distingue les
parcours mono-activité des anciens exports individuels. Les parcours plus anciens
avec plusieurs activités sont reconnus d'après leurs dossiers et séquences.

La réédition Sucrerie cible une activité dans le cours, conserve ses autres
fichiers et renvoie le MBZ complet. Les consignes des étapes restent éditables.
L'ensemble est testé localement ; D24 reste applicable à la validation réelle
sur plateforme. État et limites : suivi du port Sucrerie du 11 septembre.
