# Rapport de calibration — extension de la génération par lots (2026-06-18)

> Extension du moteur « plan + remplissage » (`js/services/llm-batch.js`) à trois nouvelles
> activités list-shaped. Calibration empirique de la limite de bascule mono→lots contre le
> backend **dev2**. Voir `docs/guide-generation-par-lots.md` pour l'architecture.

## Méthode

Mono-appel croissant (N = 5, 8, 10, 12, 15, 20, +30/40 pour les légères), durée mesurée
jusqu'à `status:'done'`, via les **vrais builders** (`assembleActivityPrompt`) et le protocole
submit/poll de `js/services/llm.js`. Modèle **réellement servi** vérifié (`result_model` /
`fallback_level`), pas le seul DEFAULT_MODEL.

- Modèle servi : `mistral-small-4-119b`, `fb=0` partout sauf indication.
- Règle de seuil : plus grand N fiable **sous ~50 s** (marge sous le mur de 59 s).

## Mono-appel — durée jusqu'à `done`

| N  | Flashcards | Texte à trous | Éléa-Test |
|---:|-----------:|--------------:|----------:|
| 5  | 6 s  | 6 s  | 19 s |
| 8  | 6 s  | 11 s | 29 s |
| 10 | 8 s  | 8 s  | 37 s |
| 12 | 8 s  | 8 s  | 37 s |
| 15 | 11 s | 11 s | 47 s |
| 20 | 11 s | 14 s | **86 s · fb=1 → qwen-3.6-35b** |
| 30 | 19 s *(31/30 : surproduction)* | 11 s | — |
| 40 | 22 s | 14 s | — |

## Lots Éléa-Test — chemin chunké réel (plan + remplissage + fusion), `fb=0`

| batchSize | plan | lots | résultat |
|---|---|---|---|
| **8** | 14 s | 7 q → **29–32 s** | 20/20, 0 doublon, 5 types, feedback/question 20/20 |
| 10 | 11 s | 10 q → 37–42 s | 20/20, 0 doublon (marge plus fine) |

## Seuils retenus (mesurés, dans `definitions.js`)

| Activité | `path` | `itemName` | `carcasse` | `threshold` | `batchSize` | Justification |
|---|---|---|---|---|---|---|
| **Flashcards** | `cards` | carte | `title`, `description` | **40** | (global 4) | Items ultra-légers (N=40 ≈ 22 s) : jamais le mur sous le plafond de 40 → mono-appel toujours. Métadonnée **dormante** (voie prête si le modèle ralentit / maxItems augmente). |
| **Texte à trous** | `questions` (strings) | texte à trous | `taskDescription`, `overallFeedback` | **40** | (global 4) | Idem (N=40 ≈ 14 s). Dormante. Le chemin chunké a été validé (20/20, overallFeedback métacognitif 4 tranches). |
| **Éléa-Test** | `questions` (objets) | question | `bank_name`, `bank_description` | **12** | **8** | Items lourds : mono 12 = 37 s (marge 22 s), 15 = 47 s (écarté, marge fine), 20 = 86 s/fallback. Lots de 7 ≈ 32 s, fb=0. |

> Le « feedback global métacognitif » : présent au niveau **racine** pour Texte à trous
> (`overallFeedback`, 4 tranches, exigé par le plan) ; au niveau **question** pour Éléa-Test
> (`correctfeedback`/`incorrectfeedback`/`hints`, vérifié 20/20) ; absent pour Flashcards
> (cartes à `tip`, pas de feedback). La carcasse exigée par le plan suit ce constat.

## Corrections de moteur (pures, hors processors/healer)

1. `extractCarcasseModel` : garde « l'exemple doit contenir le tableau `path` » → renvoie `null`
   pour Éléa-Test (dont le 1er bloc ```json de l'exemple est une question isolée, pas l'objet
   racine) au lieu d'injecter une carcasse trompeuse.
2. `buildOutlinePrompt` : clause feedback (`{feedbackClause}`) et label de carcasse rendus
   **conditionnels** (overallFeedback exigé uniquement si présent dans la carcasse) — le quiz
   reste **byte-identique** (prouvé par test).
3. `thresholdFor` / `batchSizeFor` : surcharge par activité (`chunking.threshold` / `.batchSize`),
   sinon `BATCH_CONFIG`.

## Validation

- `cara_batch_unit.mjs` : 59/59 (partition, builders, fusion, garde carcasse, clause
  conditionnelle, seuils par activité, **byte-identité fallback↔locale des 12 clés**).
- `cara_batch_e2e2.mjs` (dev2) : Éléa-Test 20/20 0-doublon ; Texte à trous 20/20 +
  overallFeedback ; Flashcards 30/30 (compte exact — corrige la surproduction mono).
- Parité locales : 11/11 à 2349 clés, placeholders intacts.
- Non-régression : mono (N ≤ seuil) inchangé ; quiz chunké byte-identique.

## Contraintes respectées

Séquentiel (`concurrency:1`), tout-ou-rien (`batch_failed` traduit), byte-identité
fallbacks↔locale, Grist 1 ligne (`stats:'skip'` sur les sous-appels), aucun
processor / healer / h5p-creator modifié.

---

# Round 2 — extension à TOUTES les activités list-shaped (2026-06-18/19)

Audit exhaustif des **30 activités** (workflow 52 agents, lecture seule : classer + vérifier
adversarialement) puis calibration séquentielle des candidats. Gouverné par les exclusions
dures du prompt (Page/Livre/Présentation/Livre-interactif/Vidéo/Glisser-déposer/Diagramme,
champ-unique, grille, cardinalité-figée).

## Mono-appel — durée jusqu'à `done` (mistral-small-4, fb=0)

| N  | QCM(Éléa) | Summary | SingleChoiceSet | glossaireXml | SortParagraphs | DialogCards | Appariement | Crossword | Devoir |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5  | 9 | 9 | 6 | 6 | 8 | — | — | — | — |
| 10 | 13 | 14 | 8 | 8 | 8 | — | — | — | — |
| 15 | 19 | 19 | 11 | 11 | 11 | — | — | — | — |
| 20 | 22 | 24 | 14 | 16 | 8 | 6 | 6 | 11 | 32 |
| 30 | 35 | 29 | — | — | — | — | — | — | 37 |
| 35 | — | — | — | — | — | — | — | — | **55** |
| 40 | **52** | 42 | — | — | — | 11 | 11 | 16 | **52** |

## Seuils retenus

| Activité | path | itemName | carcasse | threshold | batchSize | statut |
|---|---|---|---|---|---|---|
| QCM (Éléa, `QCM`) | `questions` | question | `title` | **30** | **20** | **ACTIF** (mono-type, N=40=52 s ; lots ≤30 s, e2e 40/40 0-dup) |
| Devoir (`Devoir`) | `criteria` | critère | `title,description,rubricName` | **30** | **15** | **ACTIF** (critères lourds, N=35=55 s ; lots ≤27 s, e2e 40/40 0-dup) |
| Summary | `summaries` | résumé | `intro,overallFeedback` | 40 | — | dormant (N=40=42 s) |
| SingleChoiceSet | `choices` | question | `overallFeedback` | 40 | — | dormant (N=20=14 s) |
| glossaireXml | `entries` | entrée | `name` | 40 | — | dormant (N=20=16 s) |
| SortParagraphs | `paragraphs` | paragraphe | `taskDescription,overallFeedback` | 40 | — | dormant (N=20=8 s) |
| DialogCards | `dialogs` | carte | `title,description` | 40 | — | dormant (N=40=11 s) |
| Appariement | `pairs` | paire | `title,intro` | 40 | — | dormant (N=40=11 s) |
| Crossword | `words` | mot | `title,taskDescription,overallFeedback` | 40 | — | dormant (N=40=16 s ; grille recalculée post-fusion) |

> Pour les « dormant » testés seulement jusqu'à N=20 (SingleChoiceSet, glossaireXml,
> SortParagraphs), la courbe est plate (≤16 s à N=20) → extrapolation sûre sous 50 s à N=40.

## Exclusions (30 activités auditées)

- **Monolithiques / blocs interdépendants** : Page, Livre, CoursePresentation, InteractiveBook,
  InteractiveVideo (interactions horodatées), Timeline (deux tableaux `date[]`+`era[]`),
  Chart/Diagramme (figure cohérente), DragAndDrop (zones↔éléments par index).
- **Champ / question unique** : TrueFalse, MultipleChoice, DragTheWords, MarkTheWords, Essay.
- **Grille / cardinalité figée** : FindTheWords, Millionnaire (=6).
- **Cas spéciaux** : Glossary/Accordéon (sortie = **tableau nu** `[{title,text}]`, incompatible
  avec le moteur objet-centré + léger), ComplexFillTheBlanks (caché, texte unique).

## Correctif chunking — renumérotation Éléa-Test

Chaque lot étant généré indépendamment, l'IA recommence sa numérotation `content.name` à
« Q01 » → une banque de 19 questions sortait `[Q01..Q07][Q01..Q06][Q01..Q06]` (doublons de
noms, tri Éléa incohérent). Correctif : `mergeChunks` renumérote globalement le champ déclaré
par `chunking.renumber` (test_elea → `content.name`) en Q01..QNN zéro-paddé — **seul le numéro
de tête change**, le reste du libellé (ex. « 1917 ») est préservé. e2e N=19 : `content.name`
uniques et séquentiels Q01..Q19 ✓. Helper pur `renumberItems` + tests unitaires (67/67).

## Bilan

15 activités portent désormais `chunking` (4 quiz + Flashcards + Texte-à-trous + Éléa-Test +
les 9 ci-dessus). **Actives** (seuil < plafond) : QuizSet/QCM/VF (5/4), Éléa-Test (12/8),
QCM-Éléa (30/20), Devoir (30/15). **Dormantes** (threshold 40, items légers) : toutes les
autres — voie prête, activée automatiquement si le modèle ralentit. Aucune nouvelle clé i18n
(moteur générique). Validation : 59 unitaires, e2e réels (QCM 40/40, Devoir 40/40, 0 doublon),
parité 11/11.
