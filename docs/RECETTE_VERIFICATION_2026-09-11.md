# Vérification des réponses et livre généré — 11 septembre 2026

Les QCM, Vrai/Faux, textes à trous et mots à sélectionner exposent maintenant les
mêmes options de réponse en activité seule, dans un questionnaire, une présentation
et un livre. Les retouches Sucrerie sont conservées jusqu’au réexport natif Éléa.

## Décisions depuis les semantics Éléa

| Champ | Réalisation et preuve |
|---|---|
| `behaviour.enableCheckButton` des quatre types | Case dans les deux éditeurs ; false conservé dans sept archives ; aperçu natif local sans bouton ; Vrai/Faux automatique joué dans Éléa sans Vérifier |
| `showSolutionsRequiresInput` QCM/Blanks | Case native, true par défaut ; false autorise la solution sans saisie dans Éléa 13844, true la refuse dans 13845 |
| `allowRetryIfCorrect` Blanks | Case native, false par défaut ; après Paris/Rome et 2/2, Recommencer présent dans 13844 et absent dans 13845 |
| Autres options des quatre sous-exercices | Schéma de comportement partagé entre activité seule et conteneurs ; valeurs false préservées |
| `showScorePoints` MarkTheWords | Retouché true → false dans Sucrerie, enregistré et retrouvé dans Éléa ; Lyon incorrect puis Paris/Rome corrects ; comparaison exhaustive des animations de points non réalisée |
| Prompts et exemples | Quatre types simples et cinq prompts de conteneurs dans les 12 langues ; aucune nouvelle génération des quatre types simples dans ce lot |

## Défauts corrigés par la recette

- L’adaptateur Sucrerie du texte à trous reprenait les anciens comportements et
  retours globaux après sauvegarde. Il applique maintenant les valeurs éditées.
- Un MarkTheWords natif pouvait être détecté comme DragText à cause de leur
  structure commune. Les alias du nom machine prennent désormais priorité.
- La reconstruction des exercices d’une présentation native créait de nouveaux
  sous-identifiants. Le même type conserve désormais son action native, ses
  paramètres supplémentaires, ses métadonnées et son identifiant. Les autres
  éléments texte d’une présentation ne sont pas déclarés entièrement traités.
- Le document du livre/de la présentation répétait la consigne du texte à trous.
  Le helper commun l’émet une seule fois ; trois régressions couvrent les conteneurs.
- Un séparateur vide pouvait déborder avant le saut de page et créer une page ODT
  vide. Ces séparateurs sont retirés ; les petits exercices sans cases à cocher
  restent groupés dans le PDF, sans indication de mots isolée sur une page.
  Le livre final comporte deux pages DOCX/ODT et trois pages PDF, dont deux pages
  élève et une page de correction.

## Livre IA : résultat structurel valide, contenu à relire

Le troisième et dernier essai explicitement autorisé a utilisé le service de
**développement** `n8n-caramel.osc-fr1.scalingo.io`, sans RAG ni statistiques.
Le prompt réellement envoyé et la réponse brute restent conservés sous
`tests/sonde-parcours/audit-activites-2026-09-11/prompts/`.

Une page, deux colonnes 35/65, trois cartes, couverture et progression manuelle
respectent la demande. En revanche, l’IA a inventé un indice situant l’Italie dans
la péninsule Ibérique, reformulé la consigne imposée et ajouté un Vrai/Faux non
demandé. **La génération brute n’est donc pas validée pédagogiquement.**

Le vrai formulaire Caramel a servi à rétablir la consigne, enlever les six indices
inventés et supprimer le bloc ajouté, puis enregistrer/rouvrir. Les règles de prompt
ont été renforcées dans les 12 langues ; elles n’ont pas été retestées par un nouvel
appel IA. Les trois autorisations de génération sont consommées.

Éléa **13843**, H5P **397** : couverture relue, les trois cartes retournées
(Paris/Rome/Madrid), nouvelle série et validation manuelle de page exercées. Titre
modifié dans l’éditeur natif, sauvegarde puis réexport : **six identifiants**
conservés, colonnes 35/65, trois cartes, aucune question supplémentaire.

## Recettes et preuves

Dossier durable : `tests/sonde-parcours/audit-activites-2026-09-11/verification/`.
Le livre généré et corrigé est dans le dossier voisin `livre-genere/`.

- Caramel : `node tests/run_h5p_capabilities_documents.mjs --checks-only` : quatre
  activités et trois conteneurs, deux sauvegardes/réouverture, archives réelles,
  aperçu H5P des quatre types, **21 documents**. Le fichier `rapport-documents.json`
  correspond à la régénération finale ; les archives importées dans Éléa ont été
  conservées à l’identique, avec leurs SHA dans les preuves natives.
- Sucrerie : `node tests/editor/run-verification-ui.mjs` : sept formulaires réels,
  volets dépliés, cases actionnées, confirmation de sauvegarde, réouverture,
  annulation, **21 documents**, mêmes sous-identifiants ; persistance simulée.
- `--book-generated` : relecture dans le formulaire, sauvegarde/réouverture, paquet
  et trois documents du livre issu de l’essai IA. Ce banc ne fait aucun appel IA.
- Régressions : **192 assertions navigateur sans échec** ; **64 cas d’adaptateurs
  natifs sans échec**. Miroir : 50 fichiers, 327 contraintes et 1 067 clés communes
  présentes dans les 12 langues. Ces nombres ne signifient pas audit complet.
- La page locale de recette Sucrerie déclare UTF-8 comme la page de l’application ;
  son omission déformait les puces générées par le script DOCX. Ce défaut du banc
  est corrigé, sans modification du chargeur ou de la bibliothèque en production.
- Les documents ont été ouverts via les outils de conversion/rendu fournis à
  Codex. Relecture ciblée des livres des deux hôtes en DOCX/ODT/PDF, du livre IA
  en DOCX et des textes à trous en ODT. Les 45 exports ne sont pas annoncés comme
  45 relectures visuelles exhaustives. Les PDF utilisent le repli local.

## Comparaison native dans le cours 794

| Activité | Interactions constatées | Réexport |
|---|---|---|
| 13844, options Caramel | Solutions sans saisie QCM/Blanks ; Blanks 2/2 avec reprise ; Vrai/Faux faux → 0/1 et retour automatique ; Lyon faux puis Paris/Rome → 2/2 | H5P 398 |
| 13845, options rééditées Sucrerie | Refus de solution sans saisie QCM/Blanks ; Blanks 2/2 sans reprise ; Vrai/Faux vrai → 1/1 automatique ; Lyon faux puis Paris/Rome → 2/2 | H5P 399 |

Les deux activités ont ensuite été **modifiées dans l’éditeur natif, enregistrées
et réexportées**. Les cinq sous-identifiants et les quatre objets de comportement
sont inchangés, avec 20 bibliothèques dans chaque réexport. JSON, SHA-256 et
observations sont sous `reexport-elea-caramel/` et `reexport-elea-sucrerie/`.
Les captures Éléa ont été lues pendant la séance ; elles ne sont pas conservées.

## Limites et suite

Les essais Éléa sont en prévisualisation enseignant, sans preuve de rapport élève.
Le dépôt Sucrerie en ligne et le PDF distant restent ouverts. Les médias natifs,
autres options et sous-bibliothèques des quatre types restent à compléter : aucune
case de clôture globale d’activité n’est cochée. Poursuivre notamment SortParagraphs
et FindTheWords (alphabet et chevauchement aussi dans la grille imprimée), puis
le reste des 27 types et le modèle collection parcours.

Production préservée, ingestion RAG coupée. Commits locaux : bas `74fc3e83`,
Sucrerie `bc87473`, sans push ni déploiement.
