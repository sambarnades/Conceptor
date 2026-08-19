# QA manuelle — correctifs d'éditeur de la 6.3.0

Scénarios qui rejouent, **dans le DOM réel**, les gestes d'un enseignant sur les neuf
correctifs d'éditeur livrés en 6.3.0 (commits `14beacc` et `70fd70b`).

## Pourquoi, en plus de `tests/test-editor-activities.js`

La suite navigateur couvre les 33 schémas et les ~116 fixtures, mais elle mute par les
exports `__testing` — **elle ne clique pas**. Ces scénarios empruntent l'autre moitié du
chemin : vrais boutons, vraie modale de confirmation, vraie poignée de tri, vrai
`saveChanges()`, et pour le (c) un **vrai `.h5p`** décompressé sur disque. Les deux se
complètent ; aucune ne remplace l'autre.

## Prérequis

```bash
python3 -m http.server 8010        # à la RACINE du dépôt
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
```

Chaque scénario sort en code 0 s'il est conforme, 1 sinon.

`f-qcm-sans-reponses.mjs` couvre un défaut **trouvé et corrigé pendant la campagne** : un
QCM sans aucune réponse était enregistrable. `validateField` sortait par « si vide et pas
required, pas d'autres validations » avant de mesurer `minItems` — or les 5 déclarations de
`answers` portent `minItems: 2` et **pas** `required`. La règle ne se déclenchait donc que
sur un tableau déjà non vide : 1 réponse était signalée, 0 passait en silence.

Le scénario contrôle aussi le **revers** — un champ masqué par `showWhen` ne doit pas se
mettre à bloquer (les `answers` d'une interaction non-QCM, le `table` d'une diapositive
« titre ») : c'est le faux positif qu'une première version du correctif avait produit, et
que `test-editor-activities.js` a rattrapé.

Il documente enfin une **limite connue, hors périmètre** : la génération IA
(LLM → healer → processeur → `.h5p`) ne passe pas par la validation, donc un QCM sans
réponses produit directement par le modèle part encore dans le `.h5p`. Signalé, pas
asserté.

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

## Sorties

`c-course-presentation-h5p.mjs` écrit les archives dans `.sorties/` (ignoré par git) —
utile pour ouvrir le `.h5p` produit et l'inspecter à la main.
