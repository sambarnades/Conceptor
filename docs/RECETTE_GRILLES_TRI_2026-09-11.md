# Mots mêlés et tri de paragraphes — 11 septembre 2026

Les options natives de grille et de tri sont éditables, conservées à la sauvegarde
et retrouvées après modification/enregistrement/réexport dans Éléa. Le même lot est
reporté dans Sucrerie. Il ne clôture pas encore l’audit exhaustif de ces deux types.

## Champs réalisés depuis les semantics Éléa

| Champ natif | Édition et vérification |
|---|---|
| SortParagraphs `duplicatesInterchangeable` | Case avancée, true par défaut ; true/false enregistrés et réouverts dans les deux hôtes ; échange des deux « Observer » accepté à 4/4 dans la sonde true |
| SortParagraphs `addButtonsForMovement` | Case avancée ; huit flèches dans la sonde true, absentes dans false ; déplacement par clic et déplacement au clavier exercés |
| FindTheWords `fillPool` | Champ texte brut, défaut traduit selon la locale ; alphabets XYZ puis Z dans Caramel, Q dans Sucrerie ; alphabet vide refusé |
| FindTheWords `preferOverlap` | Case avancée ; true/false conservés ; disposition papier déterministe de CHAT/CHATON : quatre lettres communes avec préférence, zéro sans préférence dans le cas testé |
| FindTheWords `orientations` | Huit commandes existantes respectées par le processeur et le générateur papier ; valeurs manquantes complétées, false conservé ; toutes désactivées refusées |
| FindTheWords `showVocabulary` | Liste visible/masquée dans Éléa et dans l’énoncé papier ; liste toujours présente dans le corrigé |
| Prompts et exemples | Structures, exemples guidés et libellés dans les 12 langues ; exemples JSON et prompts français mis à jour |

Le générateur papier conserve les accents, place tous les mots avant de rendre une
grille et applique alphabet/orientations/chevauchement. Un cas dense de 40 mots est
vérifié. Les emplacements sont aléatoires : une grille papier n’est pas annoncée
identique à celle tirée par Éléa ; son propre corrigé utilise les mêmes emplacements.

## Défauts trouvés en recette documentaire et corrigés

- Les images déjà préparées, notamment les grilles, contournaient la conversion en
  octets attendus par DOCX. Le hachage du Blob donnait le même identifiant aux deux
  images et la grille corrigée remplaçait aussi la grille élève. Le passage commun
  prépare maintenant ces images ; les deux relations DOCX sont distinctes et les
  pages ont été relues. Le problème ne touchait pas les deux autres formats.
- Les numéros des paragraphes de correction étaient interprétés comme quatre
  listes recommençant à 1 dans DOCX/ODT. Le numéro explicite est conservé, y compris
  le `text:start-value` ODT. Les quatre positions 1–4 sont vérifiées dans les fichiers
  et à l’écran.
- Le mélange papier pouvait livrer un exercice déjà résolu. Le mélange est désormais
  suivi d’un contrôle de l’ordre visible ; une rotation évite ce cas si les textes
  ne sont pas tous identiques.
- Les doublons exacts de la liste des mots pouvaient augmenter le nombre annoncé
  sur papier ; la liste et le corrigé comptent désormais les mots uniques non vides.

## Essais dans le cours Éléa 794

| Activité | Cas joué | Réexport natif |
|---|---|---|
| **13846** — tri Caramel | Déplacement avec les flèches ; Début/Observer/Observer/Fin, échange des deux Observer, puis 4/4 | H5P **400**, 11 bibliothèques |
| **13847** — grille Caramel | Alphabet Z, mots horizontaux, liste masquée ; Paris, Rome, Madrid sélectionnés → 3/3 | H5P **401**, 6 bibliothèques |
| **13848** — tri Sucrerie | Flèches absentes ; déplacement au clavier → 4/4 ; nouvel ordre faux → 0/4 ; corrigé affiché | H5P **402**, 11 bibliothèques |
| **13849** — grille Sucrerie | Alphabet Q, mots verticaux, liste visible ; Rome, Paris, Madrid sélectionnés → 3/3 | H5P **403**, 6 bibliothèques |

Les quatre titres ont été retouchés dans **l’éditeur natif**, puis enregistrés avant
réexport. Les quatre objets `behaviour`, les consignes, les paragraphes et les listes
de mots sont identiques aux paquets déposés. Les titres natifs retouchés sont bien
présents dans les réexports. Les SHA-256, manifests, contenus et versions sont dans
les quatre dossiers `reexport-elea-*` de la preuve durable.

L’effet exact de `duplicatesInterchangeable=false` sur deux paragraphes visuellement
identiques n’est pas entièrement qualifié : le faux est conservé et un ordre correct
a donné 4/4, mais aucune contre-épreuve ne permet d’identifier l’identité interne des
deux Observer. Ne pas déduire cette qualification de la seule conservation du champ.

## Recettes reproductibles et preuves

Dossier : [`tests/sonde-parcours/audit-activites-2026-09-11/grilles-tri/`](../tests/sonde-parcours/audit-activites-2026-09-11/grilles-tri/).

- Caramel : `node tests/run_h5p_capabilities_documents.mjs --grids-sort` ; deux
  sauvegardes/réouvertures, vrais paquets et six documents.
- Sucrerie : `node tests/editor/run-grilles-tri-ui.mjs` ; commandes visibles du vrai
  formulaire, sauvegarde, réouverture, annulation et six documents. Persistance
  simulée, services externes bloqués.
- `node tests/run_browser_suite.mjs --suite=grid-export,behaviour-settings,document-export,editor-activities` : **443 assertions, aucun échec**, quatre suites.
- Les douze documents sont conservés. Relecture des énoncés et corrigés des deux
  activités dans les deux hôtes, après conversion DOCX/ODT avec LibreOffice fourni
  à Codex ; PDF local. Les captures utiles aux corrections sont conservées dans
  `rendus/`. Les fichiers H5P initialement déposés restent inchangés ; les documents
  ont été régénérés après corrections, sans nouveau dépôt H5P nécessaire.
- Les PNG de contrôle des grilles doivent être lus à **150 dpi** si un rendu plus
  petit montre des lettres parasites : les PNG embarqués et les rendus à 150 dpi
  sont nets. Ce défaut de rasterisation à faible résolution n’a pas donné lieu à
  une retouche des lettres de l’activité.

## Limites à poursuivre

Le média de consigne SortParagraphs (image/vidéo/audio) reste à compléter. Le filtre
historique de mots du healer FindTheWords rejette encore des écritures non latines ;
les variantes linguistiques et les limites de saisie ne sont pas clôturées.

La bibliothèque Éléa FindTheWords 1.4.4 ne fournit pas de sélection de grille au
clavier et expose `scoreBarLabel` après réussite. Il s’agit de limites constatées
dans la bibliothèque de plateforme, qui n’a pas été modifiée. Les boutons du tri
réagissent au clic souris ; le déplacement clavier a été exercé directement sur
les paragraphes avec Espace puis les flèches.

Aucun nouvel essai IA n’a été lancé pour les prompts de ce lot : les trois appels
explicitement autorisés sont déjà consommés. Le dépôt réel Sucrerie, le PDF distant,
les comptes rendus élève et la recette responsive exhaustive restent ouverts.
Production préservée, ingestion RAG coupée, aucun push ni déploiement.

Miroir final : **50 fichiers, 328 contraintes et 1 078 clés dans les 12 locales**.
Commits de code et preuves : **bas `4c5995cf`**, **Sucrerie `26a0f28`**, sur `emmanuel`.
