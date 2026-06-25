# PLAN — Caramel comme bloc d'Éléa (+ API d'empaquetage, secondaire)

> **Statut** : EN COURS (démarré 2026-06-05). Couche 1 **fonctionnellement complète côté Caramel** ;
> Couche 0 **tranche H5P faite** ; restent la tranche Moodle de la Couche 0, l'adaptateur Éléa (2a)
> et l'API (2b).
> **Chantier principal** : intégrer Caramel comme bloc compact dans Éléa (Moodle), avec génération
> en un clic et dépôt automatique de l'activité dans le cours.
> **Chantier secondaire** : exposer une API d'empaquetage (JSON → `.h5p`/`.mbz`) à quelques collègues.

---

## 0. Journal d'avancement

### Livré (2026-06-05)

| Quoi | Fichiers | Vérification |
|---|---|---|
| **Couche 0 — `packageActivity()` (H5P)** : JSON contenu → octets `.h5p`, sans effet de bord | `js/core/package-activity.js` (neuf) | Headless Node : **21/22 types H5P** → `.h5p` valide (signature ZIP + `mainLibrary`) ; QuizSet récursif + CoursePresentation inclus |
| Test d'empaquetage navigateur | `tests/test-package-activity.{html,js}` (neufs) | Branché dans `tests/test-all.html` ; relit le ZIP (content.json + h5p.json) sur tous les exemples H5P |
| **Couche 1 — pont embed** : `?embed=block` + protocole postMessage + renvoi des octets au parent | `js/embed/embed-bridge.js` (neuf) | Headless : **17/17** (protocole) |
| **Couche 1 — génération « un clic »** pilotée par le parent (`caramel:generate`) + **choix du LLM** | idem | Headless : **9/9** (génération) + **9/9** (sélection modèle) |
| **Couche 1 — layout compact** (1re passe) | `css/embed.css` (neuf) | Toutes règles scopées `body.caramel-embed` (vérifié) ; injecté seulement en embed |
| **Couche 1 — POC de bout en bout** (faux hôte Moodle) | `tests/poc-elea-host.html` (neuf) | Valide la boucle complète sans Moodle réel ; sert de référence à la Couche 2a |
| Test d'intégration du pont (iframe) | `tests/test-embed-bridge.html` (neuf) | ready → init → pré-remplissage → generation simulée → generated ; + `generate` activité inconnue → error |

### Empreinte sur le code existant (anti-régression)

Tout le chantier est en **fichiers neufs, inertes tant qu'on ne les appelle pas**. Seuls **deux
fichiers existants** sont modifiés, tous deux additifs :

- `js/main.js` : **import dynamique gardé par `?embed`** → en mode normal, ni `embed-bridge.js` ni sa
  dépendance `caramelia/config.js` ne sont téléchargés/parsés. Coût en mode normal = un seul test
  d'URL (`URLSearchParams(...).has('embed')`). Aucune régression de chargement.
- `tests/test-all.html` : une entrée de suite ajoutée (chaque suite tourne isolée en try/catch).

Aucun fichier du **pipeline** (`json-healer`, processors, creators, `llm`, `prompt-generator`,
`ui`, `notifications`) n'a été touché → les suites existantes (dont `test-generation-download`)
restent vertes **par construction**.

### Découverte clé (de-risque la Couche 0 / l'API)

Le pipeline H5P tourne en Node avec **3 shims triviaux** (`window=globalThis`, `location.search=''`,
`document` factice) ; DOMPurify tombe en fallback basique. Le « headless » que ce plan présentait
comme le vrai risque technique est, pour H5P, quasi gratuit — pour l'API il faudra surtout
provisionner DOMPurify (build Node). L'estimation initiale « ~200 lignes de refactor » est caduque
pour la tranche H5P.

---

## 1. Idée directrice

Les deux chantiers partagent **une seule fondation** : un *coeur d'empaquetage* qui prend un JSON de
contenu et **retourne les octets** du fichier d'activité au lieu de déclencher un téléchargement.

```
JSON contenu  →  json-healer  →  processors/*  →  creator  →  { bytes, filename, mime }
```

L'API étant volontairement limitée à l'**empaquetage seul** (pas de génération LLM), ce coeur n'a
**pas besoin** des deux seuls modules vraiment couplés au DOM
([prompt-generator.js](../../js/services/prompt-generator.js), [llm.js](../../js/services/llm.js)).

> **Conséquence d'ordonnancement** : la même Couche 0 sert le dépôt auto dans Éléa *et* l'API.
> **Nuance constatée à l'usage** : le bloc Éléa (navigateur) n'a en fait pas besoin de
> `packageActivity()` pour le happy-path — il pilote la génération normale et **capte le blob sur
> l'événement `generation:complete` existant**. `packageActivity()` reste la brique testable et la
> base de l'API.

---

## 2. État des lieux (vérifié dans le code)

### Acquis réutilisables

| Brique | Où | Ce qu'elle donne |
|---|---|---|
| **Blob détachable du download** | [`createH5PBlob()`](../../js/h5p/h5p-creator.js#L337) retourne un `Blob` ; [`createMbz()`](../../js/moodle/moodle-creator.js#L167) un `Uint8Array` | Le download est une étape **séparée**. On récupère les octets sans télécharger. |
| **Événement `generation:complete`** | [h5p-creator.js:292](../../js/h5p/h5p-creator.js#L292) + chaque handler Moodle | Porte déjà `{blob, fileName, moduleKey, titleKey}` → capté par le pont embed. |
| **Pilotage DOM** | [`CONFIG.caramelSelectors`](../../js/caramelia/config.js#L154) (donnée pure, **sans import**) | Sélecteurs Caramel = source unique de vérité, réutilisables sans tirer la chat Caramelia. |
| **Sélecteur de modèle LLM** | [`populateModelSelector`](../../js/services/llm.js#L62) → `li[data-model-id]` ; closure `selectedModel` dans [attachLLMLogic](../../js/ui/ui.js#L1701) | Cliquer l'item (même masqué) met à jour le modèle. |
| **OCR PDF** | `window.CaramelOCR.processFile()` ([ocr.js](../../js/services/ocr.js)) | Drag-drop PDF → texte → contexte. |
| **Coeur ~90 % sans DOM** | [json-healer.js](../../js/h5p/json-healer.js), [field-constraints.js](../../js/h5p/field-constraints.js), `js/h5p/processors/*`, `js/moodle/processors/*` | Traitement de données pur. |

### Accrochages au DOM restants (pour la tranche Moodle / Node)

| Point | Où | Action |
|---|---|---|
| `document.createElement('div')` pour assembler le HTML | [`generateHtmlFromBlocks()`](../../js/moodle/moodle-creator.js#L351) | Polyfill `document` léger (linkedom) en Node, ou refactor concat. **Bloque la tranche Moodle de la Couche 0.** |
| `document.dispatchEvent(...)` | [h5p-creator.js:292](../../js/h5p/h5p-creator.js#L292) | En Node : couvert par le shim `document` factice (pas besoin de toucher le fichier). |
| `sanitizeSync()` → DOMPurify | [`formatTextToHtml()`](../../js/core/utils.js#L250) | En Node : fallback basique (OK) ; pour l'API, provisionner DOMPurify (build Node). |
| Lectures DOM des champs | [prompt-generator.js:179](../../js/services/prompt-generator.js#L179), [llm.js:174](../../js/services/llm.js#L174) | **Hors périmètre** (API = empaquetage sans LLM). |

---

## 3. Architecture en 3 couches

```
┌─ Couche 0 ─ Coeur d'empaquetage ───────────────────────────────────┐
│  packageActivity({moduleKey, content, platform?}) → {bytes,filename,…}
│  H5P : FAIT   |   Moodle : à faire                                  │
└───────────────┬───────────────────────────────────┬───────────────┘
                │                                     │
   ┌────────────▼─────────────┐         ┌─────────────▼──────────────┐
   │ Couche 1 ─ Mode compact  │  FAIT   │ Couche 2b ─ API (SECONDAIRE)│
   │ ?embed=block + postMessage│        │ HTTP fin + bearer token     │
   └────────────┬─────────────┘         └─────────────────────────────┘
                │
   ┌────────────▼─────────────────────────┐
   │ Couche 2a ─ Adaptateur Éléa           │  à faire (vecteur DRANE)
   │ reçoit caramel:generated → crée l'act.│  POC de réf : poc-elea-host.html
   └───────────────────────────────────────┘
```

---

## 4. Couche 0 — Coeur d'empaquetage *(fondation)*

> **Avancement — tranche H5P FAITE.**
> - `js/core/package-activity.js` : `packageActivity({moduleKey, content, platform?, title?, lang?})`
>   → `{bytes, blob, filename, mime, platform, moduleKey, mainLibrary, content}`. **Additif pur** —
>   aucun fichier du pipeline modifié.
> - Vérifié headless : 21/22 types H5P (ComplexFillTheBlanks non testé, pas de fixture). Plateforme
>   `moodle` = stub qui lève une erreur explicite (shaping réel dans les 8 handlers de
>   `moodle-creator.js`).
> - **Reste** : tranche Moodle — extraire un coeur des handlers (`handlePageCreation`, …) ; gérer
>   `generateHtmlFromBlocks` (linkedom ou refactor) ; le stub doit devenir réel.

**But** : un point d'entrée unique qui empaquette un JSON déjà soigné, **sans LLM**, et retourne les octets.

### Signature livrée
```js
// js/core/package-activity.js
export async function packageActivity({ moduleKey, content, platform, title, lang })
//   → { bytes: Uint8Array, blob: Blob, filename, mime, platform, moduleKey, mainLibrary, content }
//   content : objet JSON OU chaîne brute. platform auto-détectée si absente.
```

### Enchaînement interne (réutilise l'existant)
1. **Parsing défensif** (objet ou chaîne, réparation de chaîne en secours).
2. **Healing** : `healJsonObject` → `healActivitySpecificFields` → `healStructureForActivity`.
3. **Processing** : [`processH5PContent`](../../js/h5p/processors/index.js) → `default.process()`.
4. **Métadonnées + dépendances** : [`getModuleMetadata`](../../js/h5p/processors/index.js).
5. **Creator** : [`createH5PBlob()`](../../js/h5p/h5p-creator.js#L337) → `Blob` → `Uint8Array`.

### Garde-fou (livré)
`tests/test-package-activity.{html,js}` : empaquette chaque exemple H5P de `assets/data/examples/`,
relit le ZIP (content.json valide + h5p.json + `mainLibrary` ∈ `preloadedDependencies`), vérifie
l'absence d'effet de bord (pas de mutation d'entrée, pas de `<a download>`), les garde-fous d'entrée
et le stub Moodle. Branché dans `tests/test-all.html`.

### Reste à faire (tranche Moodle)
- [ ] Extraire un coeur des handlers Moodle (`handlePageCreation`, `handleLivreCreation`, `handleQCM…`)
      retournant `{ bytes, filename }` sans notification/download.
- [ ] Rendre `generateHtmlFromBlocks()` exécutable sans `document` réel (linkedom **ou** refactor concat).
- [ ] Remplacer le stub `platform:'moodle'` de `packageActivity()` par le vrai chemin.
- [ ] Étendre `test-package-activity` aux exemples Moodle (`.mbz` : `moodle_backup.xml` présent).

> ⚠️ **Sucrerie** : `js/editor/` est partagé byte-à-byte (CLAUDE.md piège #7). Ce plan ne le touche pas.

---

## 5. Couche 1 — Mode compact embarqué *(FAIT côté Caramel)*

**But** : un panneau Caramel étroit, embeddable en iframe, qui génère et **renvoie le fichier au
parent** au lieu de le télécharger — sans sortir de la fenêtre.

### Protocole postMessage (figé)

Enveloppe sortante : `{ source:'caramel', type:'caramel:*', version, payload }`. Messages entrants
reconnus par un `type` préfixé `caramel:`. **Origine parente validée** (`?origin=` puis
`document.referrer`) ; octets transférés en `ArrayBuffer`.

**Parent → iframe**
- `caramel:init` `{ qui?, quoi?, niveau?, nombreQuestions?, lang? }` — pré-remplit le contexte.
- `caramel:generate` `{ activity, qui?, quoi?, niveau?, nombreQuestions?, model? }` — pré-remplit
  puis lance la génération « en un clic ». `model` appliqué si rendu (3 *featured* hors `?debug`),
  sinon modèle par défaut.

**iframe → parent**
- `caramel:ready` `{ version }` — au chargement.
- `caramel:init:ack` `{ applied: string[] }`.
- `caramel:generating` `{ moduleKey, model, requestedModel }` — clic LLM émis.
- `caramel:generated` `{ moduleKey, titleKey, filename, mime, size, bytes }` — `bytes` = ArrayBuffer transféré.
- `caramel:error` `{ moduleKey?, message }`.

### Tâches (livrées)
- [x] **Détection embed** `?embed=block` → [main.js](../../js/main.js) charge le pont par **import
      dynamique gardé** (zéro coût hors embed).
- [x] **Pont sortie** : `generation:complete` → `caramel:generated` (octets en ArrayBuffer, origine stricte).
- [x] **Pré-remplissage contexte** : `caramel:init` → `#qui/#quoi/#niveau/#nombreQuestions` (events input/change).
- [x] **Génération « un clic »** : `caramel:generate` pilote tuile → (sélection modèle) → bouton LLM,
      via `CONFIG.caramelSelectors` (sans la chat Caramelia). `caramel:generating`/`caramel:error`/timeout.
- [x] **Sélection du modèle** : clic sur `li[data-model-id]` du dropdown ; fallback défaut si non rendu ;
      ID validé (anti-injection sélecteur).
- [x] **Layout compact** : `css/embed.css` (colonne unique, tuiles en liste, chrome masqué), scopé `body.caramel-embed`.
- [x] **POC** : `tests/poc-elea-host.html` (faux hôte Moodle, boucle complète).
- [x] **Tests** : `tests/test-embed-bridge.html` + vérifs headless (17/17, 9/9, 9/9).
- [ ] **Drag-drop PDF** dans le panneau compact : le flux OCR existe ([attachment.js](../../js/caramelia/attachment.js)
      + `window.CaramelOCR`) mais n'est pas encore branché spécifiquement au mode embed.
- [ ] **Application de la langue** (`caramel:init {lang}`) : best-effort en place (recharge des
      traductions), à valider en contexte réel.
- [ ] **Affinage visuel** du compact sur la largeur réelle d'un bloc Moodle (~300px).

> Cette couche marche en iframe **quel que soit** le vecteur Éléa final (plugin / extension / LTI).

---

## 6. Couche 2a — Adaptateur Éléa *(décision différée : vecteur)*

**But** : recevoir `caramel:generated` et créer l'activité dans le cours courant — c'est le
« glisser-déposer tout seul dans la zone de travail ».

> **Référence concrète déjà en place** : `tests/poc-elea-host.html` montre la boucle complète
> (réception de `caramel:generated` → reconstruction du fichier → « dépôt » dans le cours). Quel que
> soit le vecteur, l'adaptateur réel **remplace juste le téléchargement de la POC par l'appel au web
> service Moodle adéquat** (un commentaire marque l'endroit exact dans la POC).

**La forme dépend de l'accès à Éléa** (plateforme nationale verrouillée) — **non tranché** au
2026-06-05, à clarifier avec la DRANE/équipe Éléa. Trois vecteurs, même entrée (la sortie Couche 1) :

| Vecteur | Accès requis | Intégration | Robustesse |
|---|---|---|---|
| **Plugin bloc PHP** (`block_caramel`) | Install serveur Éléa | iframe + web service Moodle (content bank / `core_h5p` / file API) crée l'activité | La plus propre |
| **Extension navigateur / userscript** | Aucun serveur | Injecte le panneau, crée l'activité via l'AJAX Moodle avec la session du prof | Marche sur Éléa verrouillé, install par utilisateur, plus fragile |
| **Outil LTI externe** | Admin ajoute l'URL (pas de code serveur) | LTI launch + deep-linking pour renvoyer le contenu | Standard, mais deep-linking plus limité |

**Point commun à clarifier pour les trois** : par quelle API Moodle on matérialise l'activité
générée (dépôt `.h5p` dans la *content bank* ? création `mod_hvp` ? import `.mbz` programmatique ?).

---

## 7. Couche 2b — API d'empaquetage *(SECONDAIRE)*

**But** : un collègue externe POSTe un JSON de contenu, récupère un `.h5p`/`.mbz`. **Scope figé** :
empaquetage seul (pas de LLM). C'est **Couche 0 + une fine couche HTTP**.

> La tranche H5P de la Couche 0 (`packageActivity()`) est déjà appelable headless (vérifié 21/22).
> L'API H5P serait donc surtout : un serveur Node + DOMPurify provisionné + auth. La tranche Moodle
> attend la Couche 0 Moodle.

- [ ] Endpoint `POST /api/package` : body `{ moduleKey, content, platform? }` → binaire
      (`application/octet-stream` + `Content-Disposition`) ou `{ base64 }`.
- [ ] **Auth** : bearer token + allowlist de collègues.
- [ ] **Hébergement** : *à décider*. Node dédié (style Scalingo, importe le coeur directement) /
      proxy n8n (portage ES modules pénible) / navigateur headless Playwright (zéro refactor, infra lourde).
- [ ] Validation d'entrée : `moduleKey` connu, `content` borné, healer en garde-fou, DOMPurify chargé.

---

## 8. Ordre & état

1. ~~**Couche 0 (H5P)**~~ — **FAIT** (coeur + test + vérif headless).
2. ~~**Couche 1**~~ — **FAIT côté Caramel** (embed + protocole + génération un clic + modèle + compact + POC).
3. **Couche 0 (Moodle)** — à faire (débloque la génération `.mbz` headless + l'API Moodle).
4. **Affinage visuel** du compact — passe en contexte Moodle réel.
5. **Couche 2a** — adaptateur Éléa, une fois le vecteur tranché avec la DRANE.
6. **Couche 2b** — API d'empaquetage (secondaire).

Chaque couche est **livrable et testable seule**.

---

## 9. Décisions ouvertes (à trancher)

- [ ] **Vecteur Éléa** : plugin PHP vs extension vs LTI — dépend de l'accès serveur Éléa. → DRANE.
- [ ] **API Moodle de dépôt** : content bank / `mod_hvp` / import `.mbz` — quelle voie crée l'activité éditable.
- [ ] **Infra API** : Node dédié vs n8n vs Playwright.
- [ ] **`generateHtmlFromBlocks` headless** : polyfill linkedom vs refactor concat (mesurer d'abord).
- [x] **Format des octets en postMessage** : **ArrayBuffer transféré** (décidé, implémenté).
- [ ] **Sélection du modèle LLM via l'API/embed** : seuls les 3 *featured* sont rendus hors `?debug` —
      faut-il forcer `?debug` dans l'iframe embed pour exposer tous les modèles au parent ?

---

## 10. Fichiers du chantier (récap)

### Neufs (inertes hors usage)
- `js/core/package-activity.js` — coeur d'empaquetage H5P (`packageActivity`).
- `js/embed/embed-bridge.js` — pont postMessage (`initEmbedBridge`, protocole `caramel:*`).
- `css/embed.css` — layout compact (scopé `body.caramel-embed`, injecté en embed seulement).
- `tests/test-package-activity.{html,js}` — garde-fou empaquetage.
- `tests/test-embed-bridge.html` — test d'intégration du pont (iframe).
- `tests/poc-elea-host.html` — POC faux-hôte-Moodle (référence Couche 2a).

### Modifiés (additif)
- `js/main.js` — import dynamique gardé par `?embed` (zéro coût hors embed).
- `tests/test-all.html` — entrée de suite `package-activity`.

### Pipeline réutilisé (non modifié)
- Coeur : [json-healer.js](../../js/h5p/json-healer.js), [h5p/processors/index.js](../../js/h5p/processors/index.js), [moodle/processors/index.js](../../js/moodle/processors/index.js), [h5p-creator.js](../../js/h5p/h5p-creator.js#L337), [moodle-creator.js](../../js/moodle/moodle-creator.js#L167)
- Coupling DOM : [caramelia/config.js](../../js/caramelia/config.js#L154) (sélecteurs), [services/llm.js](../../js/services/llm.js#L62) (modèles)
- À découpler (Moodle headless) : [moodle-creator.js:351](../../js/moodle/moodle-creator.js#L351), [utils.js:250](../../js/core/utils.js#L250)
- Fixtures de test : `assets/data/examples/*.json` (97 fichiers)
