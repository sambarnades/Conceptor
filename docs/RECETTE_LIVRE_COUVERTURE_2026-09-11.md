# Couverture et progression du livre — 11 septembre 2026

Le livre permet maintenant une couverture image ou vidéo, avec affiche et commandes
vidéo, ainsi qu'une progression automatique ou validée par l'élève. Un livre d'une
seule page est accepté. Chaque correction est reportée dans Sucrerie dans ce lot.

## Décisions depuis les semantics Éléa

| Champ natif | Réalisation et vérification |
|---|---|
| `showCoverPage` | Case « Afficher la couverture » ; désactivation sans effacement du média ni de la description |
| `bookCover.coverDescription` | Édition, sauvegarde, réouverture et restitution documentaire ; texte retouché dans Sucrerie puis retrouvé dans Éléa |
| `bookCover.coverMedium` | Choix sans média / Image 1.1 / Video 1.6 ; fichier vidéo local, image, texte alternatif et affiche éprouvés |
| `chapters` | Limites natives 1 à 50 ; schéma et ancien validateur à deux chapitres alignés ; page unique jouée dans Éléa |
| `behaviour.progressIndicators` | Commande explicite, valeur conservée ; indicateur de page visible dans le lecteur natif |
| `behaviour.progressAuto` | Commande explicite ; false donne « J'ai terminé cette page », observée décochée puis cochée dans Éléa |
| `behaviour.enableRetry` | Commande explicite ; false conservé jusqu'aux deux réexports ; essai du bouton dans un livre noté encore à faire |
| `defaultTableOfContents` | false conservé ; menu fermé à l'ouverture puis ouvert au clavier dans Éléa |
| `Video.visuals.poster / controls` | Affiche uploadée et conservée ; commandes natives visibles ; réouverture vidéo jouable dans les deux hôtes |
| `Video.playback.autoplay / loop` | Cases éditables ; loop activé dans Caramel puis désactivé dans Sucrerie, false retrouvé dans Éléa ; autoplay reste false |
| Autres réglages Video et pistes | Préservés dans le média importé, mais commandes complètes et variantes encore à qualifier |
| Textes communs du lecteur | Pilotés par les traductions de la bibliothèque ; pas de commandes techniques ajoutées à la fiche élève |

Les prompts des 12 langues décrivent les nouveaux champs et respectent le nombre
explicite de pages, de 1 à 50. La sonde IA `prompts/livre-colonnes-couverture.md` a ensuite été autorisée et
exécutée ; sa relecture et ses erreurs sont documentées dans
[le lot vérification](RECETTE_VERIFICATION_2026-09-11.md). Les trois essais
autorisés ont été réalisés ; ne pas les relancer.

## Défauts réellement trouvés et corrigés

- Sucrerie conservait le binaire vidéo mais ne réhydratait pas sa source pour
  l'éditeur : le lecteur affichait un fichier sans source jouable. La recette
  contrôle désormais une avancée réelle du temps de lecture, après réouverture.
- Passer d'image à vidéo conservait des paramètres et métadonnées d'image. Les
  données du type précédent sont maintenant retirées ; le média de même type
  conserve son identifiant et ses paramètres natifs.
- L'affiche vidéo pouvait conserver son `dataURL` provisoire dans le paquet.
  Elle est nettoyée ; les recettes refusent les URL data/blob dans content.json.
- Le rendu des objets ignorait leurs champs conditionnels. Il masque maintenant
  les commandes de l'autre média sans effacer la saisie. Le volet de couverture
  répond aussi à Entrée/Espace et expose son état via `aria-expanded`.
- La validation des blocs descend dans les colonnes : une image manquante ne peut
  plus être ignorée silencieusement par le processeur. Les rangées imbriquées,
  interdites par les semantics RowColumn, sont refusées au packaging.

## Recettes et preuves

Dossier durable : `tests/sonde-parcours/audit-activites-2026-09-11/livre-couverture/`.

- `node tests/run_h5p_capabilities_documents.mjs --covers-only` : formulaire,
  fichiers image et vidéo, paramètres, sauvegarde/réouverture, désactivation non
  destructive, annulation locale et vrais paquets ; vidéo parlante non requise,
  animation locale de douze photogrammes sur un drapeau.
- `node tests/editor/run-livre-couverture-ui.mjs` dans Sucrerie : retouche réelle,
  confirmation, sauvegarde, réouverture, lecture vidéo et annulation d'une nouvelle
  retouche ; persistance simulée et toutes les requêtes externes bloquées.
- Les **12 documents** sont générés après édition. DOCX/ODT convertis avec le
  LibreOffice fourni à Codex, les 12 pages relues visuellement, ainsi que les
  captures de l'éditeur. L'image ou l'affiche figure sur papier ; une vidéo locale
  est signalée comme disponible dans l'activité numérique, sans faux lien vers
  l'intérieur du ZIP. Aucun réglage de lecture n'est imprimé.
- Régressions : **184 assertions navigateur**, **62 cas d'adaptateurs natifs**,
  fichiers partagés et clés des 12 langues vérifiés. Le banc colonnes reste vert.

## Éléa, cours 794

**13841 — RECETTE COUVERTURE — image et progression manuelle** : image et texte
alternatif « Trois couleurs relues » visibles, Lire puis page unique, validation
manuelle cochée. Titre retouché dans l'éditeur natif, enregistrement et réexport
`interactive-book-395-395.h5p`.

**13842 — RECETTE COUVERTURE — vidéo rééditée dans Sucrerie** : affiche visible,
vidéo lue jusqu'à **0:01 / 0:01**, dernière image avec point animé, arrêt sans boucle ;
Lire puis validation manuelle. Titre natif retouché, enregistrement et réexport
`interactive-book-396-396.h5p`.

Chaque réexport conserve les **trois sous-identifiants** ; un média pour l'image,
deux pour la vidéo, **octets identiques** aux paquets locaux comparés. JSON,
SHA-256, valeurs natives et observations sont dans `reexport-elea/image` et
`reexport-elea/video`. Les paquets locaux ont été régénérés pour la recette finale
de visibilité : leur SHA de ZIP n'est pas présenté comme celui du dépôt précédent.

## Ce qui reste ouvert

La clôture complète d'InteractiveBook n'est pas acquise : autres blocs natifs,
réglages de toutes les activités imbriquées, pistes vidéo et autres variantes,
reprise d'un livre noté, limites 50 pages, URL vidéo distante, recette responsive
complète et services Sucrerie/PDF distant. La génération IA supplémentaire est en
attente d'autorisation. Production inchangée, aucune ingestion RAG.

Commits locaux du lot : bas `d33ec715`, Sucrerie `75ca19c`, sans push.
