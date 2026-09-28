# Guide — Génération par lots (« plan + remplissage »)

> Comment Caramel génère des activités à **N éléments** (quiz, etc.) sans buter sur le
> timeout LLM de ~59 s, et comment **étendre** ce mécanisme à d'autres activités.

## 1. Le problème

Chaque appel LLM passe par le proxy n8n dont **chaque requête vers `llm.ilaas.fr` a un timeout dur de ~59 s** (`timeout: 59000`, non modifiable côté infra). Mesures de 2026-06 (modèle par défaut `mistral-small-4-119b`) — le modèle a depuis gagné en débit, pas en régularité (§2) :

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
  ├─ PHASE 2 — REMPLISSAGE · ⌈N / batchSize⌉ appels, DEUX DE FRONT
  │     → chaque lot rédige les items de SES intitulés, le plan complet fourni en contexte
  │       (anti-recoupement). Les lots omettent le rag (plus rapides).
  │     → un lot en échec est REDÉCOUPÉ en moitiés (jusqu'à l'item seul), dans la limite
  │       d'un budget d'échecs partagé (`fillWithSplit`) — jamais relancé à l'identique.
  │
  ├─ PHASE 3 — FUSION · code déterministe (pas d'IA)
  │     → carcasse (plan retiré) + concat des items dans data[path].
  │
  └─ json-healer → processor → fichier   (pipeline existant INCHANGÉ : aucun processor modifié)
```

Le JSON fusionné est **identique en forme** à ce qu'un appel unique aurait produit → il passe par le `json-healer` puis le processor existant sans traitement spécial.

### Deux lots de front, lots de 3 (recalibré le 2026-09-28)

En 2026-06, avec des lots de 4 à ~36 s, trois lots simultanés partaient en cascade : on avait
choisi le séquentiel. La recalibration du 2026-09-28 (`docs/calibration-batch-2026-09.md`) a
renversé ce choix. Mistral Small 4 débite désormais ~160 jetons/s et ILaaS encaissait 2, 3 et
même 4 flux sans perte de débit par flux ; 10 QCM passent de 57-94 s (séquentiel) à ~25 s.
On reste à **deux** : le backend est partagé entre tous les enseignants.

Le vrai danger n'est pas la durée moyenne mais sa **variabilité**. Un appel dure « ~4 s + jetons
produits / débit ». Or le débit d'un même modèle varie du simple au double ou au triple d'un
appel à l'autre, car ILaaS répartit chaque modèle sur plusieurs serveurs hétérogènes. La taille
du lot se règle donc en **jetons** : un QCM pèse 650-800 jetons, un item de quiz mixte ~500, un
Vrai/Faux ~230. Un lot doit rester autour de 2 000 jetons (< 45 s même à 50 jetons/s).

| Réglage (`BATCH_CONFIG` dans `js/services/llm-batch.js`) | Valeur | Raison |
|---|---|---|
| `threshold` | 5 | Défaut ; les quiz le surchargent (voir §4). |
| `batchSize` | 3 | 3 QCM ≈ 2 000 jetons ≈ 12 s au débit courant (les lots de 4 montaient à 3 300). |
| `maxItems` | 40 | Plafond un-clic (au-delà → message vers IA externe). |
| `concurrency` | 2 | Deux lots de front. |
| `retries` | 1 | Relance client d'un plan ou d'un lot d'UN item. Un lot de plusieurs items est redécoupé. |
| `maxFailures` | 4 | Budget d'échecs de lot sur toute la génération (une panne franche ne doit pas durer 15 min). |

### Pourquoi redécouper plutôt que relancer

Mesure du 2026-09-28 : sur ~50 appels, **3 lots sont revenus en erreur « échoué après 3
tentatives »**, en 15 à 65 s. Toute la cascade du Worker s'était effondrée : Mistral en échec
passager, puis Qwen 3.6, dont le JSON casse souvent sur le quiz mixte (`"to": 25",`), puis
Gemma 4, « *temporarily unavailable* ». En mono-appel, cette erreur arrive telle quelle à
l'enseignant. Par lots, le redécoupage a sauvé les 3 générations : la moitié repart sur Mistral
et produit deux fois moins de jetons.

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

   Deux options facultatives :
   - `defaultCount` : nombre d'items à générer PAR LOTS quand l'enseignant n'a pas fixé de
     nombre (mode Rapide, ou champ vide). Sans elle, le mode Rapide reste un mono-appel sur la
     consigne « N minimum », dont la sortie n'est pas bornée : le quiz « 5 questions minimum »
     en produisait jusqu'à 9 (4 600 jetons).
   - `planHint` : clé i18n d'une consigne ajoutée au prompt du PLAN. Le quiz mixte s'en sert
     pour que le plan attribue le TYPE de chaque question : chaque lot choisissant ses types à
     l'aveugle, 5 questions n'en couvraient que 2-3 (contre 5-7 en un appel) ; avec la consigne,
     5 sur 5. La clé doit exister dans les 12 locales ; absente, le plan est inchangé.

4. **Tester** (cf. §6).

### Activités candidates (list-shaped) vs non

- **Oui** : QuizSet/QCM/VF (`questions`), Flashcards (`cards`), DialogCards (`dialogs`), SingleChoiceSet (`choices`), Summary (`summaries`), Glossary (`panels`/racine), FillInTheBlanks (`questions`), Moodle test_elea/QCM/Millionnaire (`questions`, ⚠ Millionnaire = exactement 6), Appariement (`pairs`), Glossaire (`entries`)…
- **Non** (monolithiques / items interdépendants) : Page, Livre, CoursePresentation, InteractiveBook, InteractiveVideo, DragAndDrop, Chart, et les activités à champ unique (TrueFalse, DragTheWords, MarkTheWords, FindTheWords). Ne pas leur mettre de `chunking`.

> **Une activité « Non » n'est pas pour autant à l'abri du mur.** InteractiveVideo produit jusqu'à
> 10 interactions riches (QCM + rétroactions) **plus** un résumé en UN appel — exactement le régime
> mesuré ci-dessus comme échouant. Le découpage étant exclu (les timestamps doivent rester
> chronologiques, distincts et répartis), les deux leviers restants sont : **ne pas gonfler la
> commande** (une consigne contradictoire du prompt annonçait « au maximum 113 questions » — corrigé
> le 2026-08-27, cf. `assets/data/prompts/interactive_video.md`) et, si le mur est un jour VRAIMENT
> constaté sur cette activité, **un modèle plus rapide** via `ACTIVITY_MODEL_OVERRIDES`.
>
> **Attention au faux positif, cependant.** L'échec de prod du 2026-08-26 sur cette activité (tâches
> n8n 1564109 / 1564152) *ressemblait* au mur des 59 s — et n'en était pas un : `mistral-small-4-119b`
> traversait une panne côté ILaaS et partait en fallback même sur un prompt de 90 caractères. Deux indices
> qui doivent faire écarter l'hypothèse du mur : l'échec survient en **quelques secondes** (un mur de
> temps échoue à 59 s, pas à 4 s), et il se reproduit sur un **prompt trivial**. Sonder le modèle
> isolément avant d'accuser le volume — et isolément *vraiment* : trois appels rapprochés saturent le
> backend PARTAGÉ et fabriquent des fallbacks en cascade qu'on prend pour un défaut du modèle.

### Activités activées (15, seuils mesurés)

**Actives** (le découpage se déclenche réellement — items lourds) :

| Activité | `threshold` | `batchSize` | Note |
|---|---|---|---|
| QuizSet (mixte) / QCM | 3 | 3 | `defaultCount: 5` : le mode Rapide passe AUSSI par les lots (voir ci-dessous) ; QuizSet : `planHint` |
| Vrai/Faux | 8 | 8 | items légers (~230 jetons) ; le mode Rapide reste en un appel |
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
- **Deux lots de front = arrêt coordonné** : le premier échec définitif lève le drapeau
  `abandon` du pool, sinon l'autre worker continuerait d'appeler le modèle pour rien.
- **Le parcours n'emprunte PAS ce moteur** : `parcours-runner.js` génère chaque activité en un
  appel (`generateH5PWithLLM`), jusqu'à 8 éléments. Un quiz de parcours reste donc exposé au mur.
- **Builders purs vs orchestrateur** : `llm-batch.js` n'a AUCUN import DOM au top-level (imports dynamiques dans `generateInBatches`) → reste chargeable en Node pour les tests. Ne pas y ajouter d'import statique de `translation.js`/`ui.js`.
