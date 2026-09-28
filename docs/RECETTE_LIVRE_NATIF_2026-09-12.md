# Livre interactif — complément natif du 12 septembre 2026

Ce lot complète les recettes colonnes, couverture et livre généré du 11 septembre.
La référence est le livre Éléa **1.15.0**, réexporté par l’utilisateur :
`lot-utilisateur-26/retours-elea/InteractiveBook/26-InteractiveBook.h5p`.
Son premier titre de page porte la retouche utilisateur. Aucun nouvel import
Éléa ni nouvel appel IA n’est revendiqué dans ce lot.

## Édition et conservation

Le formulaire des livres déposés est construit depuis les semantics locales
InteractiveBook 1.15 / Column 1.22 / Row et RowColumn 1.3. Les **35 choix de
bibliothèques autorisés par Column** ont leurs schémas chargés. Ce nombre décrit
les choix du formulaire, pas 35 recettes de jeu autonomes supplémentaires.
Les contenus restent natifs : paramètres des exercices, séparateurs, titres de
pages, identifiants, options de progression, libellés et médias.

Dans Caramel, le bouton **Options avancées** du livre généré donne accès au même
formulaire complet. La conversion est locale, passe par le healer et le
processeur et conserve le texte généré. Le formulaire simple reste disponible
à la première ouverture. Sucrerie ouvre directement le formulaire natif.

Corrections trouvées par les sauvegardes réelles :

- Les groupes H5P à un seul champ sont transparents : chapitres, contenus de
  RowColumn, indice Summary, pistes Video. Un indice texte ne devient plus un
  objet vide ; les pistes restent un tableau natif `a11y`.
- L’absence de média de couverture reste une absence après réouverture.
- Le healer ne pose plus un `overallFeedback` étranger au contrat du livre natif.
- Les largeurs de colonnes sont contrôlées ensemble ; 1 à 50 pages admises,
  livre vide et 51 pages rejetés.
- Une piste WebVTT peut être téléversée, conservée et supprimée. Le fichier est
  embarqué dans le paquet ; le lecteur local le sert avec le MIME `text/vtt`.

## Recette reproductible

- `node tests/run_h5p_capabilities_documents.mjs --native-book-only` : accès aux
  options complètes depuis un livre généré ; contre-épreuve de conservation de
  toutes les feuilles non retouchées ; deux sauvegardes ; variantes manuelle et
  automatique ; largeurs 45/55, indice retouché, vidéo et piste téléversée ; paquets.
- Sucrerie : `node tests/editor/run-livre-natif-ui.mjs` : retouche du titre et de
  la page, confirmation, sauvegarde, réouverture, annulation et six exports.
  La persistance est simulée ; les requêtes externes sont bloquées.
- `node tests/run_native_livre_natif_play.mjs` : erreur volontaire dans Summary,
  bonne réponse au Vrai/Faux, bilan **1/2** ; reprise manuelle puis **2/2** ;
  variante automatique sans bouton de reprise. Progression **100 %** dans les
  deux variantes ; image chargée et temps vidéo avancé ; piste « Français RELU »,
  mode `showing`, cue « Drapeau RELU » effectivement chargé.
- **217 assertions** document/éditeur ; **22 contrôles** de conservation et
  **65 adaptateurs** Sucrerie. Le banc Présentation repasse après l’évolution du
  chargeur de semantics commun.

## Documents et limites

Douze DOCX/ODT/PDF produits et rendus avec LibreOffice / Poppler. Le document lit
les colonnes de gauche à droite ; image limitée à 80 mm, questions courtes et
petits chapitres groupés, correction distincte. Audio et vidéo locaux sont
signalés comme consultables dans l’activité numérique ; pas de faux lien ZIP.
Les réglages techniques et les pistes de sous-titres ne sont pas imprimés.

Les prompts des 12 langues, la couverture image/vidéo, l’essai IA autorisé et les
réexports Éléa sont documentés dans les recettes précédentes. L’essai IA brut
contenait des erreurs pédagogiques : elles ont été corrigées dans l’éditeur ;
les prompts renforcés n’ont pas fait l’objet d’un quatrième appel IA.
Les 35 bibliothèques proposées ne font pas chacune l’objet d’un nouveau jeu :
les exercices déjà audités sont réutilisés ; ce lot vérifie leur conteneur.
Les services distants Sucrerie et PDF ne sont pas testés ici.

Preuves du lot : `tests/sonde-parcours/audit-activites-2026-09-11/livre-natif/`
(archives, documents, captures, rapports et SHA-256).
Production préservée, RAG coupé, branches `emmanuel`, aucun push.
