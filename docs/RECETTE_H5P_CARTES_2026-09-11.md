# Collecte Éléa et lot cartes — 11 septembre 2026

Ce lot fournit des références natives actuelles et corrige des pertes concrètes.
Il **ne clôture pas l’audit des 27 activités**, ni l’interface collection parcours.
Les deux dépôts restent sur `emmanuel`, sans déploiement ni ingestion RAG.

## Références natives

Les 27 sondes générées ont été restaurées dans le cours bac à sable 794 de
`test03.elea.apps.education.fr`, activités 13809 à 13835. La restauration a été
menée jusqu’au message de réussite, en fusion, sans écraser la configuration du
cours et sans inclure utilisateurs, inscriptions ou dérogations de permissions.
Les activités 13805 à 13808 présentes avant la collecte ont été conservées.

Chaque H5P a été ouvert dans l’éditeur Éléa, son titre de métadonnées saisi au clavier,
enregistré et réexporté. Les 27 `h5p.json` portent effectivement la marque
`<Module> — relecture Éléa`. Une simple affectation du champ visible par l’outil
`fill` ne mettait pas à jour le modèle interne H5P ; la saisie clavier suivie d’une
sortie du champ a été nécessaire pour prouver la modification.

Les réexports contenaient déjà leurs bibliothèques avant cette modification.
Modifier/enregistrer n’est donc pas nécessaire pour toute inclusion de bibliothèque,
mais permet de normaliser le contenu dans l’éditeur natif et de vérifier ses options.

Preuves : [`collecte.json`](../tests/sonde-parcours/audit-activites-2026-09-11/references-elea/collecte.json),
[`comparaison.json`](../tests/sonde-parcours/audit-activites-2026-09-11/references-elea/comparaison.json),
les 27 couples `contenus/<Module>/{content,h5p}.json` et les
`bibliotheques/<bibliothèque>/{semantics,library}.json` du même dossier.
Les empreintes SHA-256 permettent de retrouver les paquets bruts téléchargés.

Résultat des 27 réexports : **89 bibliothèques**, aucune dépendance préchargée ou
dynamique manquante localement, **10 différences de version corrective**,
**2 différences de semantics**. Les versions Éléa sont parfois plus anciennes que
le vendor ; aucune rétrogradation globale n’a été faite.

- Essay : `minimumLength.min` et `maximumLength.min` valent `"0"` dans Éléa et `0`
  localement ; même contrainte numérique.
- Flashcards : deux libellés du tableau de résultats, `cardsHeader` et `scoreHeader`,
  existent dans la version locale 1.7.23 et pas dans Éléa 1.7.10. Les options
  pédagogiques de ce lot sont identiques.
- Le comparateur confronte le contenu complet des semantics et leurs versions ;
  ses quatre régressions couvrent un champ modifié à version constante, une version
  plus ancienne, une collecte sans bibliothèque et les choix de blocs optionnels.

### Row : preuve native complémentaire

L’éditeur de livre Éléa propose bien **Row**. Un quatrième bloc a été ajouté à la
première page de la sonde 13831 : Row contenant une colonne à 100 % et le texte
« Sonde Row : le Soleil est une étoile. ». L’enregistrement puis le réexport ajoutent
**H5P.Row 1.3.0** et **H5P.RowColumn 1.3.0**. Ces deux bibliothèques ne figurent ni dans
les 27 réexports sans bloc Row, ni dans le vendor local. `Row.columns` accepte
jusqu’à quatre colonnes, avec largeur facultative et contenu RowColumn.

Le dossier [`sonde-row`](../tests/sonde-parcours/audit-activites-2026-09-11/references-elea/sonde-row)
conserve le contenu natif, les deux semantics, métadonnées et la comparaison.
**La récupération est faite ; l’édition et l’export de ce bloc dans Caramel/Sucrerie
restent à implémenter et éprouver.** La référence initiale du livre est conservée
séparément de cette variante.

## Corrections applicatives

- **DialogCards** : l’audio natif est une liste de sources. Le processeur conserve
  cette liste et ses métadonnées au lieu de la supprimer. Le widget charge le son,
  le remplacement explicite remplace les sources, la suppression renvoie une liste
  vide. Les crédits des images sont conservés. Les indices restent du texte brut.
  Ajout des commandes de navigation arrière, taille carte/texte, seuil de maîtrise
  de 3 à 7 et progression rapide. Le recto peut être une image seule.
- **Flashcards** : les options natives placées à la racine sont présentées dans les
  réglages et remises à la racine à la sauvegarde. Les valeurs `false` survivent
  au processeur et au raccordement Sucrerie. Ajout de la saisie exigée avant solution.
  Les crédits des images sont conservés. Le groupe natif homonyme `tip.tip` est
  transparent : les réexports Éléa contiennent bien `tip` sous forme de chaîne.
- **SingleChoiceSet** : délais de bonne/mauvaise réponse éditables, y compris zéro,
  et mêmes commandes dans le schéma de sous-exercice de présentation.
- **Summary** : l’indice de groupe est imprimé avec l’exercice, avant son corrigé.
- **Réouverture des médias** : Caramel réhydrate images et sons des archives H5P
  pour toutes les activités, avec renouvellement des anciennes URL blob. Sucrerie
  réhydrate aussi les sources audio des H5P importés.
- **DOCX/ODT/PDF des cartes** : les exporteurs spéciaux omettaient les paragraphes
  de description et de crédits produits par le formateur. Ils les conservent
  désormais en annexe. Les images réhydratées sont utilisées. Le titre est répété
  sur les faces pour aligner les grilles. Le saut ODT est porté par le titre et
  le calcul de marge PDF ne cumule plus les deux marges horizontales pour placer
  l’image. Les titres natifs HTML ne sont pas imprimés avec leurs balises.

## Recettes du lot

Les sondes retouchées sont dans
[`cartes-retouchees`](../tests/sonde-parcours/audit-activites-2026-09-11/cartes-retouchees).
Le script `tests/roundtrip/cartes-capacites.js` actionne les vrais widgets Caramel,
enregistre et rouvre les données, parcourt rapidement les cartes et vérifie les
fichiers H5P. La non-mutation de la source après abandon est testée ; cela ne
remplace pas encore une recette complète du dialogue d’annulation de l’hôte Caramel.

Les 12 documents du lot sont conservés dans le sous-dossier `documents` avec leurs
assertions de contenu. Les six pages DOCX et les douze pages ODT/PDF des deux jeux
de cartes ont été rendues et relues visuellement. Les grilles recto verso, images,
indices et crédits sont présents. Conversion ODT locale avec le LibreOffice fourni
par l’environnement, PDF via le repli local : **la voie PDF distante reste à essayer**.

Deux générations IA réelles, autorisées explicitement par l’utilisateur, ont été
faites **séquentiellement** sur les endpoints `submit-bas` / `result-bas`, avec
`stats: skip` et sans RAG. Les prompts anonymes et réponses sont conservés dans
[`prompts`](../tests/sonde-parcours/audit-activites-2026-09-11/prompts).
Chaque résultat contient trois cartes et les réglages demandés : répétition 3,
progression rapide/navigation arrière désactivée ; ou les trois options Flashcards
à `false`. Aucune nouvelle génération n’est nécessaire pour relire ces résultats.

### Éléa : interaction, enregistrement et réexport

La restauration du lot de quatre activités a abouti dans le même cours 794.

| Activité | Référence | Preuve observée |
|---|---|---|
| DialogCards | 13836, H5P 389 | Retournement Italie → Rome, autoévaluation, passage à France, indice recto affiché, lecture audio activée |
| Flashcards | 13837, H5P 390 | Solution Paris affichée sans saisie ; `ROME` accepté ; ordre France puis Italie |
| Summary | 13838, H5P 391 | Indice retouché affiché ; bonne affirmation retenue ; score 1/1 |
| SingleChoiceSet | 13839, H5P 392 | Retour faux encore visible à 171 ms, puis écran final 0/1 ; reprise et Paris → 1/1 ; réglages 0 et 2300 ms conservés |

Chaque sonde a ensuite été modifiée, enregistrée dans Éléa et réexportée. Les JSON,
empreintes et observations sont dans `cartes-retouchees/reexport-elea`. Les valeurs
natives ont été contrôlées dans les archives téléchargées, pas seulement à l’écran.
La durée exacte d’enchaînement n’est pas chronométrée : le tableau prouve le
comportement observé et les paramètres enregistrés.

La première synthèse Mac avait créé un WAV avec seulement un en-tête, sans aucun
échantillon. Le bouton audio muet en plateforme a révélé cette faiblesse de la sonde.
Le fichier a été régénéré avec la voix Thomas, puis contrôlé : **1,866 s**, signal
non nul. Le contrôle navigateur décode désormais le WAV et exige une durée > 1 s
et un signal non silencieux. La piste corrigée a été ajoutée dans l’éditeur Éléa ;
son réexport contient exactement les mêmes octets audio. Ce test ne valide pas le
service TTS distant de l’application, ni une dictée complète.

### Sucrerie

Les fichiers communs ont été reportés dans le même lot. Le raccordement d’hôte
préserve les options racine de Flashcards et réhydrate l’audio natif.
`tests/editor/run-cartes-ui.mjs` exerce l’éditeur Sucrerie, son dialogue de sauvegarde,
les archives reconstruites, le décodage audio à la réouverture et l’annulation
d’une seconde retouche, avec persistance locale simulée et
services distants bloqués. Les 22 régressions de la couture H5P passent également.
Cette recette **ne valide pas encore le service de dépôt en ligne**.

Contrôles : **184 assertions Caramel, 0 échec** ; **22 régressions Sucrerie, 0 échec** ;
**50 fichiers partagés identiques**, contraintes des 42 modules communs et leurs
322 champs conformes, **1 047 clés présentes dans les 12 locales**. La parité du
breton n’est pas une relecture linguistique humaine.

## Prochaines vérifications

Terminer les cas des quatre activités (conteneurs, annulation Caramel, export Sucrerie
après retouche et PDF distant), puis les champs utiles des autres H5P. Les cases de
clôture des 27 activités restent ouvertes. Le Test natif téléchargé est conservé sous
`reference-test-elea.mbz` pour son extension. Le modèle commun collection parcours
reste à réaliser conformément à la conception Sucrerie.

Les commits de ce lot sont référencés dans les deux fichiers de suivi après leur création.

Commits du lot : bas **`945fe51a`** et Sucrerie **`81fc5d4`**, branches `emmanuel`, sans push.
