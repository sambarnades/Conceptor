# PROMPT — Étendre la génération « par lots » à de nouvelles activités Caramel

> À copier-coller à un agent (ou future session Claude Code) pour appliquer intelligemment le
> découpage « plan + remplissage » à d'autres activités, en **calibrant empiriquement** la limite
> de bascule, et en préservant la qualité **métacognitive** du feedback global.

---

## Mission

Le moteur de génération par lots existe déjà (quiz QCM / VF / mixte). Tu dois l'étendre à **{ACTIVITÉS_CIBLES}** (ex. Cartes mémo, Éléa-Test, Texte à trous…). Le mécanisme est générique : tu ajoutes une métadonnée par activité, tu **mesures la limite** où il faut basculer, et tu vérifies que rien n'est codé en dur.

## Étape 0 — Imprégnation (obligatoire avant tout code)

Lis, dans cet ordre :
1. Skill `caramel-batch-generation` et `docs/guide-generation-par-lots.md` (architecture, réglages, pièges).
2. `js/services/llm-batch.js` (moteur : builders purs + `generateInBatches`, `BATCH_CONFIG`, `extractCarcasseModel`).
3. `js/core/definitions.js` (entrées des activités cibles : `promptId`, structure).
4. La forme JSON attendue de chaque activité = clés locale `${prefix}_structure_json` et `${prefix}_exemple_rendu` (dans `js/locales/fr.json`).

**Ne réinvente rien** : la couture, la fusion, la jauge, les stats Grist et le pipeline healer→processor sont déjà en place et NE doivent PAS bouger.

## Étape 1 — Métadonnée `chunking` par activité

Dans `js/core/definitions.js`, sur chaque activité cible, ajoute :
```js
chunking: { path: "<tableau d'items>", itemName: "<nom singulier>", carcasse: ["<champs racine constants>"] }
```
- `path` : chemin (pointé si imbriqué, ex. `"timeline.date"`) du **tableau additif d'items homogènes**. Vérifie dans le processor que c'est bien ce tableau qui est itéré (`.map`/`.forEach`).
- `itemName` : nom singulier de l'item (sert dans les prompts plan/remplissage).
- `carcasse` : les champs RACINE **constants** (hors tableau) que le PLAN doit produire. Ex. quiz → `["title","overallFeedback"]` ; activité sans feedback global → `["title"]` ou `[]`.

**N'active QUE des activités « list-shaped »** (items indépendants, cardinalité libre). NE PAS toucher : Page, Livre, Présentation (CoursePresentation), Livre interactif, Vidéo interactive, Glisser-déposer, Diagramme, Mots mêlés (`wordList` = string, pas un tableau), Millionnaire (cardinalité figée à 6), ni les activités à champ unique (Vrai/Faux seul, Glisser les mots, Surligner les mots).

## Étape 2 — CALIBRER LA LIMITE (le cœur de la mission)

Pour CHAQUE activité cible, **mesure empiriquement** contre le vrai backend (réutilise/adapte le harnais `/tmp/cara_batch_e2e.mjs` et le protocole submit/poll de `js/services/llm.js`) :

1. **Mono-appel croissant** : génère l'activité en UN seul appel pour N = 5, 8, 10, 12, 15, 20, en mesurant la durée jusqu'à `status:'done'`. Calibre sur le **modèle réellement servi** (défaut `mistral-small-4-119b` ~47 tok/s ; teste aussi le fallback `gpt-oss-120b` ~53 et `mistral-small-3.2-24b` ~29 — un item est « lourd » si le coût/token est élevé).
2. **Trouve le seuil `threshold`** = le plus grand N qui se termine **de façon fiable sous ~50 s** (marge de sécurité sous le mur de 59 s ; refais 2-3 fois pour la variance, et regarde le `fallback_level` — vise `fb=0`). En dessous = mono-appel ; au-dessus = découpage.
3. **Fixe `batchSize`** = nombre d'items qu'UN lot de remplissage produit en restant sous ~45 s. Le lot porte le plan complet en contexte (entrée plus lourde) → prends `batchSize ≈ threshold − 1`, puis vérifie par un vrai appel de remplissage que `fb=0`.
4. Rappel des constats quiz (point de départ) : 5 questions ≈ 45 s sur mistral-small-4 → `threshold=5`, `batchSize=4`. Une activité plus légère (cartes, texte à trous) acceptera des lots plus gros ; une plus lourde, plus petits. **Mesure, ne devine pas.**

**Si la valeur diffère du global** : rends `threshold`/`batchSize` surchargeables par activité — dans `generateInBatches` (`js/services/llm-batch.js`), lis `module.chunking.threshold ?? BATCH_CONFIG.threshold` et `module.chunking.batchSize ?? BATCH_CONFIG.batchSize`, et dans `shouldChunk()` utilise le seuil de l'activité. Documente la valeur mesurée + la date dans un commentaire de la métadonnée.

## Étape 3 — Feedback global MÉTACOGNITIF (ne pas régresser)

Le PLAN doit produire la carcasse avec la MÊME qualité qu'en mono-appel. Le moteur le fait déjà via `buildOutlinePrompt`, qui injecte : (a) les **RÈGLES PÉDAGOGIQUES** (`prompt_regles_pedagogiques_communes`, doctrine de feedback), (b) la **STRUCTURE** de l'activité, (c) un **MODÈLE DE CARCASSE extrait de l'exemple de base** (`extractCarcasseModel` retire le tableau `path` de `${prefix}_exemple_rendu` → garde title + feedback global métacognitif tel que conçu dans le prompt de référence).

À faire pour chaque activité :
- Vérifie que `extractCarcasseModel('<prefix>', fr, '<path>')` renvoie bien la carcasse (≠ null). Si null (exemple non parsable), **corrige l'exemple** ou accepte la dégradation (structure + doctrine restent).
- Liste dans `carcasse` les champs de feedback global à exiger (ex. `overallFeedback`) → le plan sera **relancé** s'ils manquent. On ne livre JAMAIS une activité sans son feedback de fin quand le format de base en a un.

## Étape 4 — Contraintes NON négociables

- **Séquentiel** (`concurrency: 1`) : ILaaS est partagé et tolère mal la concurrence (fallbacks en cascade). Ne pas paralléliser les lots.
- **Tout-ou-rien** : un lot/plan en échec après retries + fallbacks ⇒ échec propre avec message **traduit** (`batch_failed`), détail technique en console seulement. Jamais d'activité incomplète livrée.
- **Zéro texte FR en dur visible** : toute chaîne UI/prompt passe par une clé i18n `batch_*` (avec fallback FR inline). Les nouveaux textes ⇒ **14… clés à ajouter dans les 11 langues** (`js/locales/*.json`, skill `caramel-translations`), parité vérifiée.
- **Placeholders à préserver verbatim** dans toutes les langues : `{n} {t} {max} {count} {item} {arrayKey} {mine}` (remplacés en code, pas par l'i18n). De même, ne traduis pas les **noms de champs JSON littéraux** (`title`, `overallFeedback`, `questions`, `plan`, `intitule`, `angle`, et le `path` de l'activité).
- **Byte-identité** : tout fallback FR inline dans le code DOIT être byte-identique à la clé FR du locale (un test le vérifie).
- **Grist = 1 ligne / génération** : les sous-appels portent `stats:'skip'` ; la ligne agrégée est postée par le client. Ne pas casser ce contrat.
- **`llm-batch.js` reste pur au top-level** (imports DOM uniquement dynamiques dans `generateInBatches`) → testable en Node.
- **Aucun processor / healer / h5p-creator modifié** : la fusion se branche AVANT eux, ils reçoivent un JSON unique normal.

## Étape 5 — Valider (preuves exigées)

- `node /tmp/cara_batch_unit.mjs` (purs : partition, builders, fusion, byte-identité, `extractCarcasseModel`) → tout vert.
- `node /tmp/cara_batch_e2e.mjs <N>` adapté à l'activité (contre le backend dev2) → pour chaque cible : count exact, **0 doublon**, JSON valide, schéma racine conforme, **feedback global métacognitif** présent et adapté au sujet, timings (plan + lots, `fb=0`).
- `node --check` sur les fichiers JS touchés.
- Parité locales : `Object.keys(fr)` ⊆ chaque locale (11/11), placeholders intacts.
- Régression : N ≤ seuil ⇒ mono-appel **strictement identique** à avant.

## Livrable attendu

Pour chaque activité : la métadonnée `chunking` (avec `threshold`/`batchSize` **mesurés**, commentés), les éventuels nouveaux textes i18n (11 langues), et un court rapport de calibration (N testés, durées, seuil retenu, modèle utilisé). Prioriser par **volume de génération** (stats Grist) : Cartes mémo, Éléa-Test, Texte à trous, Éléa-QCM, Mots croisés…

## Garde-fous d'expérience

- Mesure sur le **modèle réellement servi** (le défaut configuré n'est pas toujours celui qui répond — vérifie le `result_model`/`fallback_level`).
- Marge : vise ~50 s, pas 59 s (variance + charge).
- Le plan coûte ~10-15 s même pour 30 intitulés : ce n'est pas le goulot, c'est le remplissage qui dimensionne.
- Crossword/Frise : items « indépendants » mais grille/era à valider après fusion → teste le rendu réel, pas seulement le JSON.
