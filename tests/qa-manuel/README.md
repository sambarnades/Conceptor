# QA manuelle — correctifs d'éditeur de la 6.3.0

Scénarios qui rejouent, **dans le DOM réel**, les gestes d'un enseignant sur les neuf
correctifs d'éditeur livrés en 6.3.0 (commits `14beacc` et `70fd70b`).

## Pourquoi, en plus de `tests/test-editor-activities.js`

La suite navigateur couvre les 33 schémas et les ~116 fixtures, mais elle mute par les
exports `__testing` — **elle ne clique pas**. Ces scénarios empruntent l'autre moitié du
chemin : vrais boutons, vraie modale de confirmation, vraie poignée de tri, vrai
`saveChanges()`, et pour le (c) un **vrai `.h5p`** décompressé sur disque. Les deux se
complètent ; aucune ne remplace l'autre.

> Le scénario **(g)** sort du cadre « éditeur » des six premiers : il pilote `index.html`
> et non la page-hôte de l'éditeur, et bouchonne le webhook LLM (`page.route`) pour
> tester l'arrêt d'une génération sans émettre le moindre appel réel.
>
> Le scénario **(i)** sort du cadre « éditeur » comme (g) : il pilote `index.html` et
> vérifie que **Caramelia suit le drapeau de Caramel**. Il n'appelle aucun LLM — son
> oracle est le texte VISIBLE du panneau (bulle d'accueil, boutons de réponse rapide,
> placeholder), lu contre `js/caramelia/locales/*.json`, jamais un libellé en dur.
> Comme (h), il **porte sa propre contre-épreuve** (`--contre-epreuve`, qui désarme
> `applyLanguageChange()` par snapshot) et n'a rien à faire dans `contre-epreuves.sh`,
> lequel ne pilote que la suite navigateur.
>
> Le scénario **(h)** en sort autrement : il monte le vrai handler `H5P.VideoYouTube` du
> dépôt sur sa propre page-hôte (`hote-video-youtube.html`) et appelle **YouTube pour de
> vrai** — c'est le seul moyen d'observer une piste de sous-titres automatiques. Il
> **exige donc le réseau**, ne va pas en CI, et son oracle est **visuel** : le lecteur
> YouTube est un iframe cross-origin, son DOM est hors de portée et l'API ment (voir
> plus bas). Il **porte sa propre contre-épreuve** — il écrit lui-même une copie désarmée
> du handler — et n'a rien à faire dans `contre-epreuves.sh`.

## Prérequis

```bash
python3 tests/serveur-statique.py 8010        # à la RACINE du dépôt
```

Playwright est pris dans `tests/roundtrip/node_modules/` (même installation que le banc
roundtrip). Aucune dépendance npm supplémentaire.

## Lancer

```bash
node tests/qa-manuel/a-timeline-dates.mjs           # (a) dates de la frise
node tests/qa-manuel/b-glisser-deposer-zones.mjs    # (b) mutations de zones, autonome + imbriqué
node tests/qa-manuel/c-course-presentation-h5p.mjs  # (c) correctElements dans le .h5p
node tests/qa-manuel/d-quiz-sous-question.mjs       # (d) sous-question de Quiz
node tests/qa-manuel/e-diapositive-contenu.mjs      # (e) diapositive « contenu »
node tests/qa-manuel/f-qcm-sans-reponses.mjs        # (f) QCM sans réponses
node tests/qa-manuel/g-arret-generation.mjs        # (g) bouton « Arrêter » d'une génération
node tests/qa-manuel/h-sous-titres-youtube.mjs      # (h) sous-titres YouTube non sollicités (RÉSEAU)
node tests/qa-manuel/i-langue-caramelia.mjs         # (i) Caramelia suit le drapeau de Caramel
node tests/qa-manuel/j-sources-document.mjs         # (j) le document joint part bien vers l'IA
node tests/qa-manuel/k-quiz-lots.mjs                # (k) quiz : mode Rapide par lots, lots de front, redécoupage
```

> Le scénario **(k)** pilote `index.html`, webhook LLM bouchonné par un faux Worker qui
> répond selon le prompt reçu (plan ou lot de N questions) et fait échouer le premier lot de
> 3, comme la cascade réelle s'effondre ~3 % du temps (recalibration du 2026-09-28,
> `docs/calibration-batch-2026-09.md`). Il porte sa contre-épreuve (`--contre-epreuve`), sur
> le modèle de (j) : quatre réglages désarmés dans le module servi, quatre ROUGES exigés.

> Le scénario **(j)** pilote `index.html` comme (g), webhook LLM bouchonné. Son oracle
> est le **prompt envoyé** (corps de la soumission), jamais le textarea affiché : c'est
> l'écart entre les deux qui faisait partir des générations sans section SOURCES, ou
> avec les sources d'un document déjà retiré (constaté en prod le 2026-09-25). Il porte
> sa propre contre-épreuve (`--contre-epreuve`) : elle réécrit à la volée le module
> **servi** au navigateur (`page.route`) — le dépôt n'est jamais touché, même sur
> Ctrl-C — et exige le ROUGE pour chacun des sept correctifs.

Chaque scénario sort en code 0 s'il est conforme, 1 sinon.

`f-qcm-sans-reponses.mjs` couvre un défaut **trouvé et corrigé pendant la campagne** : un
QCM sans aucune réponse était enregistrable. `validateField` sortait par « si vide et pas
required, pas d'autres validations » avant de mesurer `minItems` — or les déclarations de
`answers` portent un `minItems` et **pas** `required`. La règle ne se déclenchait donc que
sur un tableau déjà non vide : 0 réponse passait en silence. (Depuis 60d45a81, la borne est
celle du H5P natif, `minItems: 1` : une seule proposition est valide.)

Le scénario contrôle aussi le **revers** — un champ masqué par `showWhen` ne doit pas se
mettre à bloquer (les `answers` d'une interaction non-QCM, le `table` d'une diapositive
« titre ») : c'est le faux positif qu'une première version du correctif avait produit, et
que `test-editor-activities.js` a rattrapé.

Il vérifie enfin la génération IA (LLM → healer → processeur → `.h5p`), qui ne passe pas
par la validation de l'éditeur : un QCM sans réponses y est désormais REFUSÉ par le
processeur (« MultiChoice : une proposition est requise. », depuis 60d45a81). Ce n'est plus
une limite connue : c'est asserté.

## Contre-épreuves

```bash
tests/qa-manuel/contre-epreuves.sh          # les 8, ~4 min
tests/qa-manuel/contre-epreuves.sh C6       # filtre par nom
```

Chaque entrée **désarme** un correctif et exige que la suite passe au ROUGE — un correctif
que rien ne fait échouer n'est pas couvert. Le script refuse de démarrer si l'arbre est
sale et restaure les sources à la sortie (y compris sur Ctrl-C).

Résultat de référence (campagne du 2026-08-19) : **8/8 ROUGE**. À noter, `C4b` (défaut
`graphMode` du healer) n'est couvert QUE par la suite complète — `test-edit-export-flow.js`,
pas `editor-activities` : le script le lance donc sur `complete`.

## Pièges de la page-hôte (`hote.html`)

Deux détails non négociables, chacun ayant coûté une demi-heure :

- **`<base href="/">`** — `translation.js` fait `fetch('./js/locales/…')`, résolu contre
  l'URL du *document*. Sans base, une page servie depuis `/tests/qa-manuel/` cherche
  `/tests/qa-manuel/js/locales/fr.json` → 404 → tous les libellés en clés brutes.
- **Le parent `.preview-modal__content--editor`** — `dragdrop-layout-panel.js` fait
  `container.parentElement` pour y poser sa classe de vue `dz-mode-live`. Sans ce parent,
  la classe atterrit sur `<body>` et la règle `.dz-mode-live .json-editor__nav{display:none}`
  masque **toute** la navigation : la page devient intestable, sans erreur.

Et un piège de sélecteur : les boutons d'action du détail (Précédent, Suivant, Dupliquer,
Supprimer) sont **iconographiques** — `innerText` est vide, le libellé vit dans `title`.
Un filtre `hasText` ne les trouve jamais ; utiliser `bouton(p, 'Supprimer')` de `lib.mjs`.

Enfin, le Glisser-déposer s'ouvre en vue **« Sur le canevas »**, qui masque la nav *par
design* ; `ouvrir()` bascule en « Plan » quand le panneau est présent.

## Pièges de la page-hôte vidéo (`hote-video-youtube.html`)

- **Servir en `http://`, jamais par `setContent` ni `file://`** — sans origine valide,
  l'embed YouTube répond **Erreur 153** et rien ne se charge.
- **Monter le handler par `.call()`, pas par `new`** — `H5P.Video` invoque ses handlers
  par `handler.call(self, …)` sur une instance qui hérite **déjà** d'`EventDispatcher`.
  Un `new H5P.VideoYouTube(…)` échoue sur « self.on is not a function ».
- **`getOption('captions','track')` n'est PAS un oracle** — après extinction des
  sous-titres, il continue de renvoyer la piste `asr` alors que plus rien ne s'affiche :
  il décrit la *sélection*, pas l'*affichage*. Une première version du test a conclu à
  tort que le correctif ne marchait pas. Seuls les pixels font foi.
- **La comparaison s'arrête à 60 % de la largeur** — vidéo en pause, YouTube pose en bas
  à droite des vignettes « Plus de vidéos » qui changent à chaque exécution : incluses,
  elles font un bruit de plusieurs points et le cas « case cochée » échoue au hasard.

## Sorties

`c-course-presentation-h5p.mjs` écrit les archives dans `.sorties/` (ignoré par git) —
utile pour ouvrir le `.h5p` produit et l'inspecter à la main.

`h-sous-titres-youtube.mjs` accepte `QA_CAPTURES=<dossier>` pour y déposer les trois
captures comparées — l'oracle étant visuel, c'est le seul moyen de comprendre un écart.
