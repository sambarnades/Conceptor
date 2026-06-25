# Banc de fidélité d'export Caramel (`tests/roundtrip/`)

Banc de mesure **Node, sans build, sans npm** (principe produit « no build, no npm »).
Il exécute le **vrai pipeline d'export Caramel** (`json-healer` → `processors` → `h5p-creator` /
`moodle-creator`) hors navigateur et mesure : **idempotence**, **déterminisme**, **fidélité du
transport de dépôt Sucrerie**, et produit une **baseline de régression** (`report.json`).

> N'utilise QUE les built-ins Node + les libs vendor du dépôt (`js/vendor/`). Aucune dépendance externe.

## Lancer

```bash
node tests/roundtrip/harness.mjs            # tout (H5P + Moodle hors Page/Livre)
node tests/roundtrip/harness.mjs --quiet    # masque les lignes OK/déterministes
node tests/roundtrip/harness.mjs --only=SortParagraphs,DragAndDrop   # filtre par moduleKey (désactive Moodle)
node tests/roundtrip/harness.mjs --fixture=sort_the_paragraphs       # filtre par préfixe de fixture
node tests/roundtrip/harness.mjs --no-moodle                         # H5P uniquement
```

Prérequis : **Node ≥ 22** (globals `Blob`, `TextEncoder`, `structuredClone`, `crypto`, `btoa`/`atob`).
Code de sortie : **0** si aucune régression dure ; **1** si T1/T5 non-déterministe ou T2 `DUPLICATION/GROWTH` ;
**2** si crash. (Les `SHAPE-LOSS` T2 et les différés Page/Livre ne font PAS échouer.)

## Fichiers

| Fichier | Rôle |
|---|---|
| `bootstrap.mjs` | À importer **en premier**. Seed `Math.random` (mulberry32, graine fixe), fige `Date` (epoch 2026-06-16T12:00:00Z), stubs navigateur minimaux (`window`, `document`, `CustomEvent`, `navigator`, `localStorage`, `requestIdleCallback`), chargeur de vendors (`JSZip`, `fflate`, `Tar`, `client-zip`), **sanitizer identité** et **shim gzip**. Tout stub est tracé dans `STUB_LOG`. |
| `fixtures-map.mjs` | Mappe `assets/data/examples/*.json` → `moduleKey` par préfixe snake_case (112 fixtures, 79 H5P). `listH5pFixtures()` / `listMoodleFixtures()`. |
| `canonicalize.mjs` | Décompresse une archive (`.h5p` via JSZip ; `.mbz` via `mbz-utils.extractMbz`), scrube les IDs/timestamps/slugs aléatoires Moodle, trie, renvoie `{files:[{name,canonSize,canonSha256}], totalSha256}` (sha256 Node). |
| `harness.mjs` | Runner. Tests T2 → T1 → T4 → T3 → T5. Écrit `report.json`. |
| `report.json` | **Baseline de régression** (généré). Tailles + sha256 canoniques par fixture, par test. |

## Les tests

- **T2 — Idempotence (H5P, priorité max, pure data)**
  Compare `process(heal(x))` (= `v1`) à `process(heal(clone(v1)))` (= `v2`). Les UUID/`subContentId`
  sont masqués (régénérés à chaque export, aléa attendu). Classe chaque divergence :
  - **`DUPLICATION`** — une valeur **grandit par doublon répété** (ex. `<p>` → `<p><p>`). C'est le vrai
    risque « +1 caractère à chaque passe ». Fait échouer le banc.
  - **`SHAPE-LOSS`** — la 2ᵉ passe lit des champs d'entrée **absents** du contenu déjà processé
    (`slides→[]`, `text→""`). Attendu d'un transform one-shot. N'échoue pas.
  > **Important** : le flux produit est **Markdown-First** — l'éditeur re-traite toujours le
  > Markdown *original* (`originalJsonData`), jamais le contenu processé. Ces non-idempotences
  > sont donc **latentes**, pas actives dans le parcours utilisateur actuel.

- **T1 — Déterminisme (H5P)** : `heal→process→createH5PBlob` exécuté 2×, canonicalisé, compare les
  `totalSha256`. Vérifié aussi **stable entre processus** (relancer le banc redonne les mêmes sha).

- **T4 — Snapshot (H5P)** : taille + sha256 canoniques par fixture → `report.json`. Baseline de régression.

- **T3 — Garde verbatim Sucrerie** : un `.h5p` packagé passe par `sucrerie-bridge/utils/blob-base64.js`
  (base64 → décode → octets identiques à l'original ⇒ dépôt **sans perte**) ET par
  `sucrerie-bridge/services/extract.js` (markdown non vide, blob non altéré). Échantillon représentatif.

- **T5 — Moodle/Éléa** (déterminisme + snapshot) : exécute le **vrai handler** de `moodle-creator.js`
  (`handleMillionnaireCreation`, …) ; le blob est récupéré via le `document.dispatchEvent('generation:complete')`
  capturé. `.mbz` (Millionnaire, Appariement, QCM, Devoir) canonicalisés ; `.xml` (glossaireXml, test_elea)
  hashés à plat. **Page / Livre = différés** (génération HTML via `page-themes/*` qui exige un vrai DOM).

## Caveats de fidélité (ce que l'environnement Node change vs navigateur)

1. **Sanitizer = IDENTITÉ.** DOMPurify 3.x exige un vrai DOM (`createHTMLDocument`, `<template>`,
   `DOMParser`) → impossible sans jsdom (= npm, interdit). On injecte un sanitizer **identité**
   (`sanitize(x)=x`) par le chemin d'init officiel du module ⇒ `sanitizeSync` devient **idempotent**
   et préserve le HTML verbatim. Pour les fixtures (LLM propre : `<strong>/<em>/<p>/<table>`, tous dans
   l'allowlist), l'identité ≈ DOMPurify. **Écart résiduel** : DOMPurify *supprimerait* les balises/attrs
   hors-allowlist (`<script>`, `onclick`…) ; l'identité les garde. Négligeable sur fixtures propres,
   **à lever en phase Playwright** (vrai DOM).
   *Sans cette injection*, le fallback fail-closed (`escapeAllHtml`) ré-échappe `&`→`&amp;` à chaque
   passe → faux positif d'idempotence. C'est pourquoi l'identité est obligatoire.

2. **gzip `.mbz` = `gzipSync`.** `moodle-creator.createMbz()` appelle `fflate.gzip` **async** (Web Worker
   en navigateur, absent en Node). Redirigé vers `gzipSync` avec **mêmes options + mtime fixé** ⇒ sortie
   **byte-identique** (même DEFLATE ; seul le modèle d'exécution change). Vérifié par roundtrip.

3. **Stubs navigateur** (tous no-op/null, ne doivent PAS influencer l'output ; voir `STUB_LOG`) :
   `window=globalThis`, `document` (querySelector/getElementById→null, createElement→stub,
   dispatchEvent→capturé), `CustomEvent`, `navigator`, `localStorage`, `requestIdleCallback` (no-op
   pour éviter tout préchargement réseau).

## Différé à la phase Playwright (vrai navigateur)

- **Pages / Livres Moodle** : génération HTML via `js/moodle/page-themes/*` (manipulent un vrai DOM).
- **Sanitization DOMPurify réelle** : pour confirmer que les snapshots T4 H5P sont byte-identiques au
  navigateur sur les champs porteurs de HTML (l'identité en est une bonne approximation, pas une preuve).
- **Exports documentaires** (DOCX / ODT / PDF) : non testés ici (`document-exporter`, libs docx/jsPDF +
  rendu math).
- **Preview H5P** (`h5p-standalone`) : hors périmètre.
