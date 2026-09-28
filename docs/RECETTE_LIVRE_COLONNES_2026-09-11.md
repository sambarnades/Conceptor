# Livre à colonnes — recette du 11 septembre 2026

Commits locaux : bas `e6a07b40`, Sucrerie `51b69d5`, sur `emmanuel`, sans push.

Le livre permet désormais de disposer de une à quatre colonnes dans un chapitre,
avec textes, tableaux, images et exercices. L'éditeur propose la largeur de chaque
colonne, conserve les médias après réouverture et refuse un total incohérent.
Les DialogCards imbriquées disposent des mêmes commandes que l'activité seule.

## Contrat natif et corrections

Source : variante du livre natif Éléa 13831, réexport
`interactive-book-384-384 (2).h5p`. Les références, empreintes et semantics sont
conservées dans `tests/sonde-parcours/audit-activites-2026-09-11/references-elea/sonde-row/`.
Les bibliothèques Row et RowColumn **1.3.0, MIT** sont recopiées intégralement et
sans modification dans les vendors bas et Sucrerie. Le graphe canonique Sucrerie
référence 51 versions et 225 entrées de dépendances après synchronisation depuis bas.

- `Row.columns[].content` est une action `H5P.RowColumn 1.3`.
- `RowColumn.params.content[]` contient directement les actions ; son groupe
  `content` est transparent. `Column.params.content[]` conserve au contraire
  l'enveloppe `{content, useSeparator}`. La première sonde avec enveloppe en trop
  était vide dans Éléa ; elle a été corrigée et remplacée dans la même activité.
- Largeurs automatiques ou pourcentages : le lecteur impose au moins 10 % par
  colonne et 100 % au total. Ces contraintes sont contrôlées dans le formulaire.
- Le gestionnaire de tableaux transmet maintenant le chemin complet d'une
  retouche imbriquée : auparavant modifier une largeur pouvait remplacer le
  tableau entier par un nombre lors d'une navigation rapide.
- Les widgets image réaffichent réellement le texte alternatif et la position
  enregistrés. Les métadonnées et identifiants des sous-contenus importés sont
  conservés dans l'adaptateur Sucrerie.

Les 12 prompts et leurs exemples décrivent les colonnes. La génération IA de cette
nouvelle structure **n'a pas été exécutée** : les deux essais autorisés concernaient
le lot cartes précédent et ont déjà été consommés.

## Recettes locales

`node tests/run_h5p_capabilities_documents.mjs --rows-only` exerce le vrai formulaire
Caramel : largeurs 35/65, image, audio parlé, texte et réponse, navigation rapide,
deux sauvegardes et réouverture. Le paquet passe par le nettoyage et le processeur
habituel. Le vrai lecteur H5P affiche deux colonnes et applique 35 % à la première.
Un total invalide est rejeté. Un contre-exemple indépendant utilise la structure
Row réellement réexportée par Éléa, pour ne pas seulement comparer nos deux adaptateurs.

`node tests/editor/run-livre-colonnes-ui.mjs` dans Sucrerie réédite le paquet :
largeurs 45/55, texte « Drapeau relu dans Sucrerie. », sauvegarde avec confirmation,
réouverture puis annulation d'une nouvelle retouche. Les **11 sous-identifiants**
et les **deux fichiers médias** restent identiques. La persistance est simulée,
les services externes sont bloqués. Les trois exports passent par le pont Sucrerie.
Les 184 assertions des suites navigateur document-export/editor-activities passent.
Les 62 tests d'adaptateurs natifs passent, dont les cas de préservation des blocs
non éditables ; les 50 fichiers partagés, 326 contraintes et 1 054 clés des 12
langues sont conformes. La parité ne vaut pas relecture humaine des traductions.

## Documents

Les six documents, après les retouches dans chaque hôte, sont conservés sous
`tests/sonde-parcours/audit-activites-2026-09-11/livre-colonnes/`.
DOCX et ODT ont été convertis avec le LibreOffice fourni à Codex, sans ouvrir
l'application personnelle. Les pages ont été relues visuellement, ainsi que le
PDF local : textes, réponses, indices, image, légende et correction présents.

Le papier déroule les colonnes de gauche à droite, et leurs blocs de haut en bas.
L'image d'une colonne reste limitée à 80 mm. Les réglages de navigation ne sont
pas imprimés. Les DialogCards restent des cartes de révision sans notation ;
le corrigé du Summary est placé dans la partie correction. Le DOCX n'ajoute plus
une page blanche avant cette partie. Le PDF garde les petits groupes de choix
ensemble et place la légende sous l'image. Le PDF distant reste non vérifié.

## Éléa : sonde 13840, cours 794

L'activité **RECETTE COLONNES — livre réédité dans Sucrerie** contient le paquet
produit après retouche Sucrerie. Essais dans le lecteur natif :

- cartes : retournement, commande audio, trois tours ; aux tours 2 et 3,
  réponse avant retournement grâce à la progression rapide ; une carte maîtrisée ;
- résumé : erreur volontaire puis bonne réponse ; progression 1/1, score 0/1
  après pénalité native de l'erreur ;
- navigation vers Bilan puis retour : progression des cartes conservée ;
- éditeur natif : titre retouché au clavier, enregistrement puis réexport.

Le fichier réexporté `interactive-book-394-394.h5p` porte le titre
« Livre à colonnes — relu dans Éléa ». Le contrôle de l'archive confirme **45/55**,
les **11 identifiants** et les **deux médias octet pour octet**.
Les JSON, SHA-256 et observations sont dans `livre-colonnes/reexport-elea/`.
Aucune écoute acoustique de l'audio n'est revendiquée ; la commande native a été
actionnée et les octets parlés sont conservés.

## Limites et suite

Ce lot ne clôture pas InteractiveBook. Couverture image/vidéo, progression,
reprise et blocs natifs non encore éditables restent à compléter. Ces derniers
sont conservés à l'import mais cette conservation ne remplace pas leur édition.
L'ajout/suppression/réordre des colonnes, les réglages des autres exercices,
la génération IA de colonnes et les services Sucrerie en ligne restent à exercer.
La production et l'ingestion RAG n'ont pas été modifiées.
