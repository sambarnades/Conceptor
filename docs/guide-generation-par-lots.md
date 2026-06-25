# Guide — Génération par lots (« plan + remplissage »)

> Comment Caramel génère des activités à **N éléments** (quiz, etc.) sans buter sur le
> timeout LLM de ~59 s, et comment **étendre** ce mécanisme à d'autres activités.

## 1. Le problème

Chaque appel LLM passe par le proxy n8n dont **chaque requête vers `llm.ilaas.fr` a un timeout dur de ~59 s** (`timeout: 59000`, non modifiable côté infra). Mesures (modèle par défaut `mistral-small-4-119b`) :

- 5 questions ≈ **45 s** (passe, mais juste).
- **10 questions ≈ échec** (la génération mono-appel dépasse 59 s, les 3 fallbacks retentent le même bloc trop gros et échouent aussi).

Le polling client (`POLL_TIMEOUT_MS = 300000`) donne 5 min PAR appel — donc le budget temps total n'est pas le souci. **Le seul mur est la durée d'un appel LLM unique.** La solution : découper en plusieurs appels qui tiennent chacun sous 59 s.

## 2. Architecture « plan + remplissage »

```
1 clic (transparent)  — uniquement la génération auto ; « copier le prompt → IA externe » n'est pas concernée
  │
  ├─ PHASE 1 — PLAN   · 1 appel court (~10 s)
  │     → CARCASSE (champs racine constants : title, overallFeedback…) + un PLAN de N
  │       intitulés/angles DISTINCTS (un seul cerveau voit tout → couverture + non-répétition).
  │       Ancré sur la RAG programmes (collection 56) car le plan envoie le contexte rag.
  │
  ├─ PHASE 2 — REMPLISSAGE · ⌈N / batchSize⌉ appels SÉQUENTIELS
  │     → chaque lot rédige les items de SES intitulés, le plan complet fourni en contexte
  │       (anti-recoupement). Les lots omettent le rag (plus rapides).
  │
  ├─ PHASE 3 — FUSION · code déterministe (pas d'IA)
  │     → carcasse (plan retiré) + concat des items dans data[path].
  │
  └─ json-healer → processor → fichier   (pipeline existant INCHANGÉ : aucun processor modifié)
```

Le JSON fusionné est **identique en forme** à ce qu'un appel unique aurait produit → il passe par le `json-healer` puis le processor existant sans traitement spécial.

### Pourquoi séquentiel (et pas parallèle) ?

Tests empiriques (N=20) : le backend ILaaS **tolère mal la concurrence** — 3 lots simultanés déclenchent des fallbacks en cascade (le modèle principal timeout à 59 s sous charge). La concurrence 3 n'était même pas plus rapide que la 2 tout en consommant le filet de fallback. Le backend étant **partagé** (plusieurs profs en même temps), on ajoute volontairement zéro concurrence intra-génération. Séquentiel + lots de 4 (~36 s/lot) → `fb=0` quasi systématique, filet de sécurité préservé.

| Réglage (`BATCH_CONFIG` dans `js/services/llm-batch.js`) | Valeur | Raison |
|---|---|---|
| `threshold` | 5 | N ≤ 5 → 1 appel (inchangé). N > 5 → découpage. |
| `batchSize` | 4 | ~36 s/lot, marge sous 59 s → `fb=0`. |
| `maxItems` | 40 | Plafond un-clic (au-delà → message vers IA externe). |
| `concurrency` | 1 | Séquentiel (backend partagé). Passer à 2 = +~30 % vitesse, filet entamé. |
| `retries` | 1 | Relance client d'un lot/plan en échec, EN PLUS des 3 fallbacks serveur. |

## 3. Fichiers

| Fichier | Rôle |
|---|---|
| `js/services/llm-batch.js` | Moteur. Builders **purs** (testables Node, `translations` en argument) + orchestrateur `generateInBatches` (imports dynamiques). |
| `js/services/llm.js` | `generateRawWithLLM` (renvoie contenu + tokens + modèle + fallback ; options `rag`/`stats`). `generateH5PWithLLM` = wrapper inchangé. |
| `js/services/prompt-generator.js` | exports `readContextParams`, `prefixForModule`. |
| `js/core/definitions.js` | métadonnée déclarative `chunking` par activité. |
| `js/core/endpoints.js` | `llmStats` (ligne Grist agrégée). |
| `js/ui/ui.js` | `generateActivityContent` (décide mono vs lots) aux 2 coutures ; jauge `setBatchProgress`. |
| `js/locales/*.json` | clés `batch_*` (×11 langues). |
| `index.html` + `css/base/style.css` | jauge `#caramel-batch-gauge`. |

## 4. Étendre à une nouvelle activité

Le moteur est **générique**. Pour activer le découpage sur une activité « list-shaped » (contenu = un tableau additif d'items homogènes) :

1. **Ajouter la métadonnée `chunking`** dans `js/core/definitions.js`, sur l'entrée du module :
   ```js
   chunking: { path: "cards", itemName: "carte", carcasse: ["title"] }
   ```
   - `path` : chemin (pointé si imbriqué, ex. `"timeline.date"`) du **tableau d'items** dans le JSON attendu.
   - `itemName` : nom singulier de l'item (utilisé dans les prompts de plan/remplissage).
   - `carcasse` : champs RACINE constants (hors tableau) que le PLAN doit produire. Le plan est **relancé** s'ils manquent. Pour un quiz : `["title","overallFeedback"]` (feedback global). Pour des flashcards : `["title"]` (ou `[]` si pas de champ racine).

2. **Vérifier que l'exemple de base parse** (pour le « modèle de carcasse ») :
   ```bash
   node --input-type=module -e 'import {pathToFileURL} from "node:url"; const fr=JSON.parse(require("fs").readFileSync("js/locales/fr.json")); const M=await import(pathToFileURL(process.cwd()+"/js/services/llm-batch.js").href); console.log(M.extractCarcasseModel("prompt_X", fr, "cards"));'
   ```
   Si `null` (exemple non parsable) → dégradation propre : structure + doctrine guident quand même, mais le feedback global sera moins ancré. Idéalement, garder un `_exemple_rendu` valide.

3. **Rien d'autre.** Pas de modif du prompt-generator, ni du processor (il itère déjà sur `data[path]`), ni du healer. La couture `generateActivityContent` (ui.js) détecte `module.chunking` via `shouldChunk()`.

4. **Tester** (cf. §6).

### Activités candidates (list-shaped) vs non

- **Oui** : QuizSet/QCM/VF (`questions`), Flashcards (`cards`), DialogCards (`dialogs`), SingleChoiceSet (`choices`), Summary (`summaries`), Glossary (`panels`/racine), FillInTheBlanks (`questions`), Moodle test_elea/QCM/Millionnaire (`questions`, ⚠ Millionnaire = exactement 6), Appariement (`pairs`), Glossaire (`entries`)…
- **Non** (monolithiques / items interdépendants) : Page, Livre, CoursePresentation, InteractiveBook, InteractiveVideo, DragAndDrop, Chart, et les activités à champ unique (TrueFalse, DragTheWords, MarkTheWords, FindTheWords). Ne pas leur mettre de `chunking`.

### Activités activées (15, seuils mesurés)

**Actives** (le découpage se déclenche réellement — items lourds) :

| Activité | `threshold` | `batchSize` | Note |
|---|---|---|---|
| QuizSet / QCM / VF | 5 | 4 | référence |
| Éléa-Test (`test_elea`) | 12 | 8 | types mixtes ; mono 15 ≈ 47 s, 20 → fallback |
| QCM (Éléa) | 30 | 20 | mono-type ; N=40 = 52 s |
| Devoir | 30 | 15 | critères de barème lourds ; N=35 = 55 s |

**Dormantes** (`threshold:40` = plafond — items légers, jamais le mur sous 40 ; voie prête) :
Flashcards (`cards`), Texte à trous (`questions` strings), Summary (`summaries`),
SingleChoiceSet (`choices`), glossaireXml (`entries`), SortParagraphs (`paragraphs`),
DialogCards (`dialogs`), Appariement (`pairs`), Crossword (`words`, grille recalculée post-fusion).

Audit exhaustif des 30 activités (list-shaped vs exclues), calibration empirique complète et
corrections de moteur : `docs/calibration-batch-2026-06.md` (2026-06-18/19).

## 5. Côté n8n (dev2)

- **Worker** : nœud « Filtrer stats (skip lots) » — si `payload.stats === 'skip'` (sous-appels plan + lots), le nœud Grist est sauté → pas de ligne par sous-appel.
- **`5. Caramel - LLM Stats (DEV2)`** : webhook `caramel/llm/stats-dev2` → écrit **1 ligne Grist agrégée** (tokens sommés, début/fin globaux) postée par le client après fusion (best-effort, non bloquant).
- **Cleanup** : réactivé, orphan-interval porté à 5 min (couvre un lot lent passé par tous les fallbacks).

Résultat : **1 génération = 1 inscription Grist**, quel que soit le nombre de lots. Le chemin mono-appel (N ≤ 5) reste inchangé.

## 6. Tests

Harnais Node (git-ignorés, dans `/tmp`) :
- `cara_batch_unit.mjs` : tests PURS sans réseau (partition, builders, fusion, extraction carcasse, byte-identité avec `buildActivityPrompt`).
- `cara_batch_e2e.mjs` : end-to-end avec les **vrais** builders contre le backend dev2 (plan + lots + fusion ; vérifie count, 0 doublon, feedback global métacognitif, timing).

Vérifier la parité des locales :
```bash
node -e 'const fr=require("./js/locales/fr.json"); for(const l of ["en","es","de","it","nl","pt","ar","zh","jp","el"]){const o=require("./js/locales/"+l+".json"); const miss=Object.keys(fr).filter(k=>!(k in o)); if(miss.length) console.log(l, "manque", miss.length);}'
```

## 7. Pièges

- **`stats:'skip'` + workflow Stats sont une PAIRE** : déployer l'un sans l'autre casse le décompte Grist (N+1 ou N+2 lignes). Importer Worker + Stats ensemble.
- **Placeholders des clés `batch_*`** : `{n} {t} {max} {count} {item} {arrayKey} {mine}` sont remplacés en code (`.replace`), pas par le helper i18n — les préserver verbatim dans toutes les langues. De même, les noms de champs JSON littéraux (`title`, `overallFeedback`, `questions`, `plan`, `intitule`, `angle`) ne se traduisent pas.
- **Le fill renvoie `{ <dernier segment de path> : [...] }`** (ex. `path:"timeline.date"` → clé `date`). `arrayKeyOf()` gère le chemin pointé.
- **Cardinalité fixe** (ex. Millionnaire = 6) : à valider après fusion si on l'active.
- **Builders purs vs orchestrateur** : `llm-batch.js` n'a AUCUN import DOM au top-level (imports dynamiques dans `generateInBatches`) → reste chargeable en Node pour les tests. Ne pas y ajouter d'import statique de `translation.js`/`ui.js`.
