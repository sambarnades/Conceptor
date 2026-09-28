# Graphique — recette du 11 septembre 2026

Branches `emmanuel` ; changements locaux uniquement. Commits : bas **`fc67d6a5`**, Sucrerie **`00b0858`**. Recette Éléa effectuée par l’utilisateur, **deux réexports natifs conformes reçus**.
Graphique est clôturé pour le périmètre des champs natifs, de l’éditeur et des exports.

## Contrat et corrections

Référence réelle réexportée : `H5P.Chart 1.2.22`, ColorSelector 1.3.1.
Les semantics Chart sont structurellement identiques au vendor local 1.2.33.
Deux modes (`pieChart`, `barChart`), au moins une donnée, texte, valeur numérique
minimale 0,0001 à quatre décimales au plus, couleur de forme et de texte,
description accessible `figureDefinition`. L’éditeur expose ces six champs.

- Les bornes numériques sont désormais imposées dans l’éditeur et le processeur.
  Les valeurs 0, −1, 0,00001, 0,12345 et Infinity sont refusées sans inventer
  de remplacement. Les sondes comprennent la borne 0,0001.
- Les couleurs courtes natives (`#fff`, `#369`, `#036`) alimentent correctement
  le sélecteur HTML ; la saisie courte visible synchronise sa couleur.
- Les graduations des barres gardent les petites valeurs décimales ; la couleur
  de texte choisie s’applique aux valeurs internes. Les très petites barres
  affichent leur valeur au-dessus en sombre pour rester lisibles.
- La légende des secteurs dispose de sa propre place, de retours à la ligne
  et d’une hauteur adaptée ; les longs libellés des barres adaptent aussi la hauteur.
- Les prompts des douze langues précisent le minimum/quatre décimales et la
  conservation exacte des données fournies, sans ajout pour atteindre cinq éléments.
  Aucun nouvel appel IA n’a été effectué ; l’effet de ces consignes sur une
  génération distante n’est donc pas mesuré.

Fichiers communs recopiés dans Sucrerie ; ses raccordements restent propres à
l’hôte. Les prompts de génération appartiennent à bas, Sucrerie ne les embarque pas.

## Vérifications réalisées

- `node tests/run_h5p_capabilities_documents.mjs --charts-only` : vrai formulaire,
  mode et valeur modifiés, sauvegarde/réouverture, vérification des deux archives,
  six exports DOCX/ODT/PDF et présence des données dans chacun.
- Sucrerie `node tests/editor/run-graphiques-ui.mjs` : vrai formulaire, description
  et couleur retouchées, archive enregistrée, réouverture, annulation sans
  sauvegarde, six exports. Persistance simulée ; aucun service externe appelé.
- `node tests/run_browser_suite.mjs --suite=document-export` : **135 assertions,
  0 échec**, dont graduations décimales et vingt libellés longs dans les deux modes.
- Les douze documents ont chacun une page, sans débordement de légende ni
  perte de donnée. DOCX et ODT rendus avec LibreOffice, PDF relus visuellement.
- Miroirs : **50 fichiers identiques**, manifeste régénéré ; **1 080 clés** communes
  présentes dans les douze locales Sucrerie.

[Archives, documents, captures et sommes SHA-256](../tests/sonde-parcours/audit-activites-2026-09-11/graphiques/).
Les deux archives de `a-importer/` sont figées dès leur remise à l’utilisateur.
Les variantes Sucrerie sont conservées séparément et ne sont pas à importer.

## Reste à recevoir et vérifier

- [x] Deux réexports après import, modification du titre **dans l’éditeur H5P**,
  enregistrement natif et affichage dans le cours 794.
- [x] Comparer mode, valeurs, libellés et couleurs aux archives sources ; vérifier
  les titres retouchés, la version et les dépendances embarquées.
- [x] Consigner la recette effectuée par l’utilisateur et clôturer Graphique.
  L’utilisateur a confirmé la retouche dans le H5P après un premier essai sur
  le conteneur Moodle ; les deux archives attestent les titres modifiés.

Le dépôt en ligne Sucrerie et son PDF distant ne sont pas éprouvés par le banc
local. Production inchangée, ingestion RAG coupée.

## Premier retour manuel

L’utilisateur a importé les deux fichiers, retouché un titre et corrigé une demande
de condition d’achèvement. Les deux fichiers présents dans Téléchargements à
17 h 56 sont identiques octet pour octet aux sources et contiennent zéro
bibliothèque. Cela ne prouve pas l’enregistrement dans l’éditeur H5P natif.
La marche à suivre interne a été précisée ; les deux réexports restent attendus.

## Second retour manuel — validé

Réexports reçus à 17 h 59 et 18 h 00 : **graphique-secteurs-modif** et
**graphique-barres modif**. Deux bibliothèques dans chaque archive : Chart 1.2.22
et ColorSelector 1.3.1. Les modes, descriptions, trois libellés/valeurs et toutes
les couleurs sont identiques aux sources. Les semantics sont identiques au
vendor local 1.2.33. Éléa retire les champs génériques `overallFeedback` et
`behaviour`, absents des semantics Chart ; aucun champ natif n’est perdu.

Les archives complètes et leur comparaison sont conservées dans `retours-elea/`.
La recette de plateforme a été effectuée par l’utilisateur ; les preuves locales
et la comparaison des archives sont vérifiées par l’agent. Les limites de service
Sucrerie et de génération IA indiquées plus haut restent explicites.
