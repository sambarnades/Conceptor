---
name: caramel-batch-generation
description: Activer ou modifier la génération d'activités PAR LOTS (« plan + remplissage ») pour dépasser le timeout LLM de ~59 s sur les activités à N éléments. À utiliser quand l'utilisateur dit "plus de questions", "20/30 questions plantent", "génération par lots", "découper la génération", "chunking", "timeout 59s", "trop de questions", ou veut étendre ce mécanisme à une nouvelle activité list-shaped.
---

# Génération par lots (« plan + remplissage »)

Référence exhaustive : `docs/guide-generation-par-lots.md` (architecture, données empiriques, n8n, pièges). Lis-le avant toute modification de fond.

## En 30 secondes

Chaque appel LLM (proxy n8n) a un **timeout dur de ~59 s**. Au-delà de ~5 questions, la génération mono-appel échoue. Solution pour les activités « list-shaped » (contenu = tableau additif d'items) :

```
PLAN (1 appel court) → carcasse {title, overallFeedback…} + N intitulés distincts
REMPLISSAGE (⌈N/4⌉ appels SÉQUENTIELS) → chaque lot rédige les items de SES intitulés
FUSION (code) → carcasse + concat des items dans data[path] → pipeline existant inchangé
```

Séquentiel (pas parallèle) : ILaaS tolère mal la concurrence (backend partagé → fallbacks en cascade). Lots de 4 → ~36 s, marge sous 59 s.

## Fichiers

- `js/services/llm-batch.js` — moteur (builders purs testables Node + `generateInBatches`). Réglages dans `BATCH_CONFIG` (threshold 5, batchSize 4, maxItems 40, concurrency 1, retries 1).
- `js/services/llm.js` — `generateRawWithLLM` (tokens/fallback + options `rag`/`stats`).
- `js/services/prompt-generator.js` — `readContextParams`, `prefixForModule`.
- `js/core/definitions.js` — métadonnée `chunking` par activité.
- `js/ui/ui.js` — `generateActivityContent` (mono vs lots) + jauge `setBatchProgress`/`resetBatchGauge`.
- `js/core/endpoints.js` — `llmStats`. `index.html` + `css/base/style.css` — jauge `#caramel-batch-gauge`.
- `js/locales/*.json` — clés `batch_*` (×11). n8n dev2 : Worker (filtre `stats:'skip'`), `5. Caramel - LLM Stats (DEV2)`, Cleanup.

## Activer le découpage sur une NOUVELLE activité

1. **Métadonnée `chunking`** dans `definitions.js` sur l'entrée du module :
   ```js
   chunking: { path: "cards", itemName: "carte", carcasse: ["title"] }
   ```
   - `path` : chemin (pointé si imbriqué) du tableau d'items dans le JSON attendu.
   - `itemName` : nom singulier (utilisé dans les prompts).
   - `carcasse` : champs RACINE constants que le PLAN doit produire (le plan est relancé s'ils manquent). Quiz → `["title","overallFeedback"]`.
2. **Vérifier que l'exemple parse** (modèle de carcasse) : `node -e` avec `extractCarcasseModel('prompt_X', fr, 'path')` (cf. guide §4). `null` = dégradation propre.
3. **Rien d'autre** : prompt-generator, processor et healer sont inchangés (le processor itère déjà sur `data[path]`).
4. **Tester** (cf. ci-dessous). N'active QUE des activités list-shaped (items homogènes indépendants) — pas Page/Livre/CoursePresentation/InteractiveVideo/DragAndDrop ni les activités à champ unique.

## Toucher aux prompts du plan/remplissage

Builders dans `llm-batch.js` : `buildOutlinePrompt` (plan) et `buildFillPrompt` (lot). Textes scaffolding = clés `batch_*` (avec fallback FR inline). Si tu modifies un texte `batch_*` : **change la clé dans les 11 locales** (skill `caramel-translations`) ET le fallback du code, en gardant les deux **byte-identiques** (un test le vérifie). Préserve les placeholders `{n} {t} {max} {count} {item} {arrayKey} {mine}` et les champs JSON littéraux (`title`, `overallFeedback`, `questions`, `plan`, `intitule`, `angle`).

## Stats Grist (1 génération = 1 ligne)

Sous-appels → `stats:'skip'` (Worker saute Grist). Client poste 1 ligne agrégée à `llmStats` après fusion (best-effort). ⚠ Worker + workflow Stats = **paire indissociable** à déployer ensemble.

## Tests

```bash
node /tmp/cara_batch_unit.mjs     # purs, sans réseau (partition, builders, fusion, byte-identité)
node /tmp/cara_batch_e2e.mjs 8    # E2E réel contre dev2 (count, 0 doublon, feedback métacognitif, timing)
node --check js/services/llm-batch.js js/ui/ui.js
# parité locales : Object.keys(fr) ⊆ chaque locale (cf. guide §6)
```

## Pièges

- `llm-batch.js` n'a **aucun import DOM au top-level** (imports dynamiques dans `generateInBatches`) → reste testable en Node. Ne pas y importer statiquement `translation.js`/`ui.js`.
- Le fill renvoie `{ <dernier segment de path> : [...] }` (`arrayKeyOf` gère le chemin pointé).
- Cardinalité fixe (ex. Millionnaire = 6) : valider après fusion.
- Tout-ou-rien : si un lot échoue après retries+fallbacks → échec propre (message traduit `batch_failed`), jamais d'activité incomplète livrée.
