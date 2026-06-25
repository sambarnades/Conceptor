# Audit — Simulateurs d'activités (Caramel + Sucrerie)

> Date : 2026-06-15 · Statut : **audit / pistes** (aucune implémentation)
> Périmètre : les 8 simulateurs partagés `js/simulators/` (Caramel = source de
> vérité) et leur miroir porté `assets/js/simulators/` (Sucrerie), leurs CSS
> `css/simulators/` / `assets/css/simulators/`, et les 3 contextes d'invocation :
> **modale de preview Caramel**, **preview éditeur Sucrerie**, **embed élève
> Sucrerie** (lien partagé).
>
> Rappel coordination : les simulateurs sont **portés, pas byte-identiques**
> entre les deux dépôts (cf. mémoire `project_simulators_partages_sucrerie`).
> Toute évolution doit être appliquée **et testée des deux côtés**.

---

## 0. Synthèse & priorités

| # | Chantier | Gravité | Où | Effort | Coordination |
|---|---|---|---|---|---|
| 1 | **Déblocage de collection ignoré pour les activités Éléa** (complétion non émise → seuil contourné) | 🔴 Fonctionnel | Sucrerie (embed) + simulateurs | M-L | Forte |
| 2 | **Mode prof / mode élève** (consultation libre vs jeu réel) | 🟠 UX prioritaire | Caramel modale + Sucrerie éditeur + embed | M | Forte |
| 3 | **Millionnaire non consultable** (mauvaise réponse = `RECOMMENCER`) | 🟠 UX | les 2 | S-M | Moyenne |
| 4 | **Bouton plein écran mort hors modale Caramel** | 🟡 Bug isolé | Sucrerie (éditeur/embed) | S | Moyenne |
| 5 | **Polish visuel** (feux d'artifice fantômes, reveal sans transition) | 🟢 Cosmétique | les 2 | S | Faible |

Les chantiers **1 et 2 partagent la même extension d'architecture** (un argument
`mode` + une émission d'événement par les simulateurs) : à traiter ensemble.

---

## 1. État des lieux — navigation par question

| Simulateur | Type | Navigation question-par-question | Atteint la fin sans « réussir » ? |
|---|---|---|---|
| **millionnaire.js** | jeu 6 questions | ❌ aucune flèche | **❌ NON** — mauvaise réponse → `RECOMMENCER` à zéro |
| **qcm.js** | QCM Éléa | ✅ flèches ◀▶ (`qcm.js:71-73`) | ⚠️ presque — la **dernière** question oblige à valider pour voir l'écran de fin |
| **elea-test.js** | Test Moodle (multichoice, matching, numerical, truefalse, shortanswer, cloze) | ✅ flèches + boutons Préc./Suiv. | ✅ oui, les flèches sautent librement (`elea-test.js:589`) |
| **appariement / glossaire / devoir** | écran unique | n/a (tout affiché d'un coup) | ✅ rien à parcourir |

**Conclusion :** le seul vrai blocage pour « le prof veut défiler toutes les
questions » est le **Millionnaire**. Le QCM et le Test naviguent déjà ; il
manque juste, sur le QCM, un moyen d'atteindre l'écran final sans répondre à la
dernière question, et (pour le mode prof) une révélation des bonnes réponses.

---

## 2. Mode prof / mode élève

**Constat :** aucune notion de mode aujourd'hui (0 occurrence `teacherMode` /
`studentMode` / `mode élève` dans les deux dépôts).

### 2.1 Recommandation

Ajouter un 5ᵉ argument **`options`** à la signature commune
`renderSimulator(titleKey, container, data, previewHtml, options)` —
`options = { mode: 'teacher' | 'student' }`. La signature est identique des deux
côtés (`simulators/index.js:32`), l'ajout est **non-cassant** (les appels actuels
passent `undefined` → défaut `student`/legacy).

### 2.2 Répartition des audiences

| Contexte | Mode par défaut | Toggle visible ? |
|---|---|---|
| Modale preview **Caramel** (`type mbz/xml`, `notifications.js:1329`) | **prof** | ✅ oui |
| Preview éditeur **Sucrerie** (`editor/index.js:1032`) | **prof** | ✅ oui |
| **Embed élève Sucrerie** (lien partagé, `embed.js`) | **élève** | ❌ **non — forcé** |

> **Réponse à la question « dès qu'on partage le lien, ça bascule en élève ? » →
> OUI.** Le toggle ne vit que dans les contextes d'auteur (consultation /
> vérification). La vue `embed` (ce que reçoit l'élève) est **forcée en mode
> élève**, sans toggle. C'est aussi la seule vue où la complétion/déblocage
> (chantier 1) doit se déclencher.

### 2.3 Ce que change le mode prof

- **millionnaire** : afficher les flèches ◀▶ ; sur mauvaise réponse, **ne pas**
  renvoyer à `RECOMMENCER` (marquer correct/faux, laisser avancer).
- **qcm** : flèche « suivante » disponible aussi sur la dernière question (accès
  écran de fin) ; option « révéler les bonnes réponses ».
- **elea-test** : déjà navigable ; ajouter la révélation directe.

### 2.4 Où vit le mode ? → **PAS dans l'éditeur de contenu**

C'est une option d'**affichage du simulateur**, pas une propriété de l'activité.
Donc **rien à stocker** dans le JSON, le `.h5p` ou le `.mbz`. Juste un état UI
local à la preview, géré des deux côtés.

---

## 3. Intégration au partage de collection — conditions débloquantes *(nouveau)*

### 3.1 Le mécanisme existe déjà… mais il est 100 % H5P

Sucrerie possède un **parcours élève avec déblocage progressif** déjà complet
(`SPEC-parcours-eleve-collection-2026-06-11`) :

- `core/collection-progress.js` — 3 modes : **`libre`** (aucun verrou),
  **`guide`** (déblocage séquentiel à la complétion), **`valide`** (déblocage si
  score ≥ `share_pass_pct`). Helpers `getCompletedSet`, `markCompleted`,
  `computeFrontierIndex`.
- `ui/shared-folder.js` — grille de collection avec **items verrouillés** (tout
  ce qui est après la « frontière » = premier item non fait).
- `ui/embed.js` — applique le verrou même par URL forgée (`renderLockedScreen`),
  et **observe la complétion** via `h5p/h5p-completion.js`.

La détection de fin (`h5p-completion.js`) écoute **exclusivement le xAPI H5P**
(`H5P.externalDispatcher`, verbes `answered`/`completed`) émis par le player
h5p-standalone dans son iframe. La whitelist `END_SIGNAL_MAIN_LIBRARIES` ne
contient que des `H5P.*`.

### 3.2 Le trou : les simulateurs Éléa n'émettent rien

Les simulateurs (millionnaire, qcm, elea-test, …) sont du **DOM pur** : pas
d'iframe H5P, pas de `H5P.externalDispatcher`, **aucun** `dispatchEvent` /
`CustomEvent` / xAPI (vérifié : 0 occurrence). Conséquence dans
`mountCollectionJourney` (`embed.js:522`) :

```js
// embed.js:530
if (mode !== 'libre' && !endSignal) markCompleted(token, pub.public_id);
```

Pour une activité Éléa, `endSignal` est **toujours faux** (il provient de
`hasEndSignal(mainLibrary)`, keyé sur les libs H5P). Donc en mode **guidé** ou
**validé**, l'activité Éléa est **marquée « faite » dès le montage** — avant que
l'élève ait répondu quoi que ce soit. Et en mode **validé**, le contrôle de
seuil (`watchCompletion` → `pct < passPct`, `embed.js:619-634`) ne se déclenche
jamais (aucun dispatcher xAPI) : **le seuil de réussite est purement et
simplement contourné**.

> **Autrement dit : le déblocage progressif d'une collection est un trompe-l'œil
> dès qu'elle contient une activité Éléa générée par le simulateur.** C'est le
> manque pointé : « ça on ne l'a pas et le simulateur devrait l'intégrer ».

### 3.3 Recommandation

Faire émettre aux simulateurs un **signal de complétion + score**, consommé par
la couche parcours, **uniquement en mode élève** (chantier 2) :

1. **Émission** — à l'écran de fin, le simulateur dispatche sur son conteneur un
   `CustomEvent('simulator:completed', { detail: { scorePct } })`.
   - Les données existent déjà : QCM calcule un `percentage` (`qcm.js:100`),
     Millionnaire a un score final, elea-test suit la justesse par question.
2. **Observation** — `embed.js` ajoute un `watchSimulatorCompletion(container,
   onComplete)` **parallèle** à `watchCompletion` (qui reste xAPI/H5P). Sur
   l'événement : `markCompleted(token, id, scorePct)` puis, en mode `valide`,
   comparaison à `passPct` (même logique que `embed.js:619-634`).
3. **`renderInfo.endSignal`** — `renderContent` doit renvoyer `endSignal: true`
   pour un simulateur **scorable** (QCM, Millionnaire, Test) afin de **ne plus**
   tomber dans le `markCompleted` au montage (`embed.js:530`). Les simulateurs
   **consultatifs** (appariement / glossaire / devoir / page / livre) restent
   `endSignal: false` → fail-open (ouverture = fait), ce qui est correct.
4. **Garde-fou mode** — l'émission ne se fait **qu'en mode élève**. En mode prof
   (consultation), aucun événement, aucun `markCompleted` : on ne veut pas
   qu'une consultation prof pollue la progression.

### 3.4 Points d'attention

- **Quels types sont « scorables » ?** QCM, Millionnaire, elea-test (multichoice
  / truefalse / numerical / shortanswer / matching / cloze). Les autres
  (appariement informatif, glossaire, devoir, page, livre) sont **consultatifs**
  → fail-open assumé.
- **Mode `valide` + Millionnaire** : le scoring « tout ou rien » du jeu doit être
  ramené à un `scorePct` cohérent avec `passPct` (ex. % de questions franchies),
  sinon le seuil n'a pas de sens.
- **Re-tentatives** (`once:false`, mode validé) : prévoir que « Recommencer »
  ré-émette l'événement, comme le fait déjà `watchCompletion` côté H5P.

---

## 4. Bug confirmé — bouton plein écran mort hors modale Caramel

Le bouton plein écran **interne** au simulateur (`.preview-modal__fullscreen-btn`,
créé par `simulators/helpers.js:81`) **n'a pas de handler propre** : il dépend
d'une **délégation d'événement sur `.preview-modal`** qui n'existe **que dans
Caramel** (`notifications.js:2017`).

Côté Sucrerie, `grep "preview-modal__fullscreen-btn"` dans tout `assets/` →
**0 résultat**. Donc :

- **Preview éditeur Sucrerie** : le simulateur affiche son icône ⛶ … qui **ne
  fait rien** (aucune délégation). ← le cas « dans la modale, peut-être pas ».
- **Embed élève Sucrerie** : un *autre* bouton fonctionne
  (`.embed__framed-fullscreen`, `embed.js:323`), mais le simulateur rend **en
  plus** son ⛶ interne mort → potentiellement **deux boutons plein écran, dont
  un cassé**.

**Pistes** (à trancher des deux côtés) :
- soit `createFullscreenButton()` attache un handler explicite ;
- soit Sucrerie ajoute la même délégation `.preview-modal__fullscreen-btn` ;
- soit on **supprime le bouton interne** dans les contextes Sucrerie qui
  fournissent déjà le leur (embed).

---

## 5. Visuel & animations — sans changer le layout ni la taille

**Constat objectif :** QCM et Millionnaire **n'ont aucune animation**
(`@keyframes` absent de leurs CSS ; seul `appariement.css` en a une —
`fadeInSlideUp`). Tout repose sur des `transition` inline au survol.

**Contrainte conservée :** garder le visuel « façon Éléa/Moodle », les couleurs
(violet `#5b2e90` QCM, `#4a148c` Millionnaire), les grilles et les **tailles**.
Animations uniquement, **zéro variation d'espace**.

### Millionnaire (`css/simulators/millionnaire.css`)
- **Feux d'artifice fantômes** : les divs `millionnaire-fireworks-left/right`
  sont injectées en JS (`millionnaire.js:107`) mais **aucune règle CSS** ne les
  style (vérifié dans les 2 dépôts) → l'écran « Bravo ! » est plus plat qu'il ne
  devrait. Pur cosmétique, aucun impact layout.
- **Reveal instantané** : le passage correct/faux n'a pas de transition. Un
  fondu de couleur + léger « pulse » sur la bonne réponse, et la mise en avant du
  palier courant de la pyramide, renforceraient l'identité « Qui veut gagner des
  millions » **en gardant** la grille 2×2 et les tailles.

### QCM (`css/simulators/qcm.css`)
- Reveal en `transition: all 0.1s` (`qcm.css:147`) → quasi-snap. Passer à un
  fondu ~0.25s + apparition douce du feedback texte, **sans** changer dimensions
  ni couleurs. Le style Moodle/Éléa reste, c'est juste plus fluide.

---

## 6. Coordination Caramel ↔ Sucrerie

| Élément | Caramel | Sucrerie |
|---|---|---|
| Logique simulateurs | `js/simulators/` (source de vérité) | `assets/js/simulators/` (porté, **pas** byte-identique) |
| CSS simulateurs | `css/simulators/` | `assets/css/simulators/` |
| Contexte d'invocation | modale preview (`notifications.js`) | éditeur (`editor/index.js`) **+** embed (`embed.js`, `shared-folder.js`) |
| Parcours / déblocage | — (n'existe pas) | `core/collection-progress.js`, `h5p/h5p-completion.js` |

- **Chantiers 1 et 2** touchent aussi les *contextes d'invocation*, qui
  **divergent** entre les deux dépôts → c'est là que se concentre l'effort de
  coordination.
- Le param `mode` et l'émission `simulator:completed` sont à ajouter dans la
  **logique partagée** (simulateurs) ; leur **câblage** (toggle, watcher,
  `markCompleted`) est **spécifique à chaque dépôt**.

---

## Annexe — références fichiers / lignes

**Caramel (`cara_dev2`)**
- `js/simulators/index.js:32` — signature `renderSimulator`
- `js/simulators/helpers.js:81` — `createFullscreenButton` (bouton sans handler)
- `js/simulators/qcm.js:71-73` (flèches), `:100` (calcul `percentage`)
- `js/simulators/millionnaire.js:107` (feux d'artifice), `:236-261` (logique jeu)
- `js/simulators/elea-test.js:589` (navigation libre)
- `js/ui/notifications.js:1329` (dispatch simulateur), `:2017` (délégation plein écran)
- `css/simulators/qcm.css:147` · `css/simulators/millionnaire.css` (pas de `@keyframes`)

**Sucrerie (`sucrerie.forge.apps.education.fr`)**
- `assets/js/simulators/index.js:32` — signature `renderSimulator`
- `assets/js/simulators/mbz-renderer.js` — dispatch simulateurs (embed)
- `assets/js/editor/index.js:1032` — preview éditeur via `renderSimulator`
- `assets/js/ui/embed.js:323` (bouton plein écran propre), `:522` (`mountCollectionJourney`), `:530` (`markCompleted` au montage si `!endSignal`), `:619-634` (contrôle `passPct`)
- `assets/js/ui/shared-folder.js:131-189` (items verrouillés)
- `assets/js/core/collection-progress.js:168` (`SHARE_MODES = ['libre','guide','valide']`)
- `assets/js/h5p/h5p-completion.js` — détection xAPI **H5P uniquement** (cœur du trou du chantier 1)
