---
name: caramel-port-to-sucrerie
description: Porter une activité H5P déjà intégrée dans Caramel vers Sucrerie (dépôt + aperçu + éditeur visuel + export). À utiliser quand l'utilisateur dit "porter vers Sucrerie", "transposer dans Sucrerie", "Sucrerie ne reconnaît pas / n'édite pas / n'affiche pas l'activité", "clés brutes dans l'éditeur Sucrerie", "pas de preview Sucrerie", "synchroniser Caramel et Sucrerie", ou veut rendre une activité Caramel déposable/éditable côté Sucrerie.
---

# Porter une activité Caramel → Sucrerie

> Source de vérité = **Caramel** (`caramel/bas`). Sucrerie pull manuellement. Cible = **`sucrerie.forge.apps.education.fr`** (le seul à avoir `assets/js/h5p/canonical-libraries.js` ; `sucrerie-bas` est une structure plus ancienne — NE PAS le viser sauf consigne explicite). Confirmer la cible : `ls <repo>/assets/js/h5p/canonical-libraries.js`.

## Différence fondamentale Caramel ↔ Sucrerie (à mémoriser)

| | Caramel | Sucrerie |
|---|---|---|
| Rôle | **Génère** (LLM → JSON → `.h5p`) | **Dépose + aperçu + édite + exporte** (ne génère pas) |
| Pipeline | flat LLM → `json-healer` → **processor** → `content.json` v1.11 → `createH5PBlob` | `content.json` déposé → éditeur → **rebuild du ZIP déposé** (`editor/index.js`) |
| Processeur | **OUI** (finit le content.json : `position{}`, `metadata`, `subContentId`, defaults) | **NON** ❌ |
| `image-manager` | `generateUUID`, 1 registre, packaging via `createH5PBlob` | `crypto.randomUUID`, 2 registres (export/upload), injection dans le ZIP au save |

⇒ **Conséquence n°1 (le piège le plus coûteux)** : côté Sucrerie il n'y a **pas de processeur**. La sortie de l'éditeur est écrite **telle quelle** dans le `content.json`. Donc **`denormalizeDataForSave` (content-detector.js) DOIT produire la forme finale JOUABLE PAR LE PLAYER** — jamais un format intermédiaire « que le processeur finira ». Si l'activité s'affiche en Caramel mais **pas de points / contenu cassé en aperçu Sucrerie** → c'est ça.

## Checklist de portage (ordre conseillé)

### 1. Dépôt / reconnaissance (test-gated)
- `assets/js/core/activity-types.js` → entrée dans **`CARAMEL_H5P`** (la whitelist de dépôt `supported-types.js` est **dérivée** de ce registre : `family:'h5p' + source:'caramel'`).
- `assets/js/h5p-export-bridge.js` → `H5P_LIBRARY_TO_MODULE_KEY['H5P.X'] = 'X'`. **OBLIGATOIRE** (le test anti-dérive exige whitelist ⊆ exportKeys, seul `AdvancedText` peut différer).
- `tests/deposit/test-deposit-validation.js` → ajouter `'H5P.X'` à `SUPPORTED_SAMPLE`.
- `assets/js/h5p/canonical-libraries.js` → `CANONICAL_VERSIONS['H5P.X'] = 'maj.min'` **+** `LIBRARY_DEPENDENCIES['H5P.X-maj.min'] = [...deps de la library.json]` (les sous-libs de contenu ne s'y mettent PAS, juste celles déclarées par la library.json, cf. les entrées voisines).
- **Gate** : `node tests/deposit/test-deposit-validation.js` (ou via `runTests()`). Doit passer (dont anti-dérive 0 violation).

### 2. i18n (`i18n/{11}.json`) — ⚠️ piège fréquent
- Nom de tuile **`activity_h5p_x`** (namespace ≠ Caramel `h5p_x_name`).
- **TOUTES les clés de l'éditeur** référencées par le fieldSchema : `editor_x_*`, `editor_media_*`, etc. **Pas seulement le nom de tuile** — sinon l'éditeur affiche les **clés brutes** (`editor_ih_section_appearance`…). Extraire de Caramel : `grep -oE '"editor_x_[a-z0-9_]+"' js/locales/fr.json` puis reporter les valeurs des 11 langues.
- Clés d'export `doc_fmt_x_*` si export documentaire.

### 3. Icône
`cp` l'icône `.webp` dans `assets/images/activities/`.

### 4. PLAYER / aperçu — ⚠️ VENDORISER LA LIB
Sucrerie utilise **h5p-standalone** + un **intercepteur fetch** qui sert les libs depuis **`vendor/h5p-libs/`** par version. Aperçu vide = lib manquante.
- **Copier la lib** : `cp -R js/vendor/h5p-libs/H5P.X-maj.min <sucrerie>/vendor/h5p-libs/`. Les **dépendances** y sont en général déjà (Image/Text/Audio/Video/Components/Transition/FontAwesome/jQuery.ui) — vérifier.
- Sucrerie embarque les images de contenu en `data:` URL (`h5p-manager.js → embedImagesAsDataUrls`) et sert les autres binaires (audio/vidéo) depuis le ZIP via l'intercepteur. Le patch `frame.bundle.js` (`getPath`) gère déjà `data:image/`.

### 5. Éditeur (miroirs + DÉPENDANCES)
- **`cp` byte-identique** depuis Caramel : `assets/js/editor/content-detector.js`, `assets/js/editor/field-renderers.js`, `assets/css/components/json-editor.css` (et `richtext-editor`/`cloze-editor`.css si touchés). Vérifier `md5` après.
- **`assets/js/h5p/field-constraints.js`** : **PAS un miroir byte-identique** (fichier divergent) mais **dépendance de l'éditeur** (`richtext-editor.js` l'importe). **AJOUTER l'entrée `'X'`** (additive). Sans le `render:'html+latex'` sur les champs de texte riche → l'éditeur rend un `textarea` qui affiche les **balises `<p>`/`<strong>` brutes** au lieu d'un WYSIWYG.
- **`denormalizeDataForSave` produit la forme FINALE jouable** (cf. piège n°1) : `position{}`, nœuds `content[]` complets `{library, params, metadata, subContentId}` (UUID via `crypto.randomUUID()` — pas `generateUUID`, mirror-safe), defaults globaux + libellés. Côté Caramel le processeur re-traite idempotemment.
- Si `denormalize` **restructure** réellement le content.json (≠ simple strip) → ajouter le moduleKey à **`H5P_RESTRUCTURING_TYPES`** dans `assets/js/editor/index.js` **ET** mettre à jour le `expected` du test anti-dérive `tests/editor/test-h5p-image-edit.js`. Sinon `composeH5pContent` écrit `editedData` (le modèle éditeur brut, non jouable).
- **Pas de champ `title`** dans le fieldSchema si le `content.json` H5P n'a pas de titre (le titre = métadonnée h5p.json, éditée via l'onglet « Éditer les métadonnées »). Un champ title afficherait un champ vide trompeur.

### 6. Médias embarqués audio/vidéo (si l'activité en a)
- `image-manager.js` est **divergent** (pas un miroir). **Port ADDITIF** de l'API média : `processAudioFile/processVideoFile/registerMedia/unregisterMedia/getUploadedMedia` (+ `MEDIA_TABLES`, registre média), en `crypto.randomUUID` + **MIME de sortie canonique** (`video/quicktime`→`video/mp4`…). Étendre `clearUploadedImages` pour vider aussi le registre média.
- `assets/js/editor/index.js` → `injectUploadedImages` doit AUSSI injecter `getUploadedMedia()` sous `content/audios|videos/`. L'élagage (`pruneOrphanImages`) ne touche que `images/` et le keep-set (`collectReferencedPaths`) est permissif → médias protégés.

### 7. Export documentaire (DOCX/ODT/PDF)
- **`document-formatter.js` EST un fichier PARTAGÉ byte-identique** (`EXPORT_SHARED_FILES`, contrôlé par `scripts/shared-files.sha256` + le test `robustesse`). Donc **`formatX` ne doit PAS diverger** entre Caramel et Sucrerie : écris-la **host-agnostique**, propage par `cp`, puis **régénère le manifeste** (`node scripts/gen-shared-manifest.mjs`). NE PAS la forker côté Sucrerie (ça casse le test sha256).
- **Le renderer** (`assets/js/renderers/x-renderer.js`) est **host-spécifique** (hors liste partagée) : `cp` puis adapte si besoin (ex. Caramel a un `extractBackgroundFromH5p` absent côté Sucrerie).
- **Résolution du fond, host-agnostique** dans `formatX` : 1) `data._backgroundImage` / `data.image.dataURL` (injecté par la couche UI Caramel) ; 2) **à défaut**, registre d'export `getAllImages()` via `data.image.path` (Sucrerie, peuplé du `.h5p` par `h5p-export-bridge.js`). La même fonction marche dans les deux hôtes.
- ⚠️ **Émettre `{type:'image', url: <dataURL>}` — clé `url`, JAMAIS `imageData`.** La pré-passe `prepareImages` de `document-exporter.js` (byte-identique) ne traite QUE `section.url`, qu'elle convertit en `imageData` structuré (`{blob,width,height,dataURL,mimeType}`) lu par les 3 rendus. Émettre `imageData:<string>` → la pré-passe l'ignore → **image silencieusement omise** (seule la légende sort). [bug IH réel, corrigé 2026‑06‑30].
- Clés `doc_fmt_x_*` ×11.

### 8. Vérification
- `node tests/deposit/test-deposit-validation.js` (dépôt + anti-dérive).
- `node tests/editor/test-content-detector.js` (round-trip — runnable Node). `test-h5p-image-edit.js` nécessite un navigateur (window).
- **Smoke navigateur** (h5p-standalone) : éditeur round-trip, API média (`processAudioFile`→`getUploadedMedia`), `composeH5pContent` → `position{}`+`subContentId`+`metadata` (`playable:true`), aperçu, export.
- **`node scripts/gen-shared-manifest.mjs --check`** (côté Sucrerie) : `content-detector.js`/`field-renderers.js`/`json-editor.css` **+ `document-formatter.js`** (et tous les `EXPORT_SHARED_FILES`) doivent rester **byte-identiques** Caramel↔Sucrerie. Après une recopie légitime, régénérer le manifeste et le committer.

## Symptômes → cause (debug rapide)

| Symptôme côté Sucrerie | Cause | Fix |
|---|---|---|
| Activité refusée au dépôt | manque dans `CARAMEL_H5P` / `H5P_LIBRARY_TO_MODULE_KEY` | §1 |
| **Clés brutes `editor_x_*` dans l'éditeur** | clés i18n éditeur non portées | §2 |
| **Aperçu vide** (l'éditeur parse pourtant) | lib H5P pas dans `vendor/h5p-libs/` | §4 |
| **Pas de points / contenu cassé en aperçu** | `denormalize` produit un format intermédiaire (pas de `position{}`/`metadata`/`subContentId`) — Sucrerie n'a pas de processeur | §5 (denormalize jouable + `H5P_RESTRUCTURING_TYPES`) |
| **Balises `<p>`/`<strong>` brutes** dans un champ texte | entrée manquante dans `field-constraints.js` Sucrerie (pas de `html+latex`) | §5 |
| Titre vide / non chargé | le `content.json` n'a pas de titre (= métadonnée) | retirer le champ `title` du fieldSchema ; titre via onglet métadonnées |
| Audio/vidéo **fichier** ne s'embarque pas au save | API média absente de `image-manager` Sucrerie / `injectUploadedImages` n'injecte pas les médias | §6 |
| Export DOCX/ODT/PDF **sans image** (légende OK) | section émise en `imageData:` au lieu de `url:` (la pré-passe ne traite que `url`) | §7 |
| Export DOCX/ODT/PDF sans image/overlay | `formatX`/renderer non portés ou fond non résolu depuis `getAllImages` | §7 |
| Test `robustesse` rouge (sha256) après port export | `document-formatter.js` forké au lieu de rester byte-identique ; régénérer le manifeste | §7/§8 |

## Référence vivante
Cas complet documenté : **`docs/PRD_IMAGE_HOTSPOTS.md`** §0 (« Chantier 8 » + « Correctifs après test navigateur réel ») — porte H5P.ImageHotspots de bout en bout (dépôt, éditeur, médias, export, et les 5 correctifs post-test navigateur).
