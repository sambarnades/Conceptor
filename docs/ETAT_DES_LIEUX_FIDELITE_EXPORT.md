# État des lieux — Fidélité des exports & round-trip Sucrerie

> **But** : automatiser la vérification que, pour chaque activité et chaque format,
> le cycle *générer → exporter → déposer sur Sucrerie → récupérer → ré-exporter*
> ne perd **rien** (« à l'octet/à la virgule près »). Document **vivant**, complété au
> fil de l'avancement. Dernière mise à jour : 2026-06-16 (Phase 1 + Phase 2 terminées).

---

## 0. VERDICT EXÉCUTIF (la réponse à « est-ce qu'on perd quelque chose ? »)

**Globalement, NON — le pipeline est fidèle.** Preuves automatisées :

| Question | Réponse | Preuve |
|---|---|---|
| Le dépôt Sucrerie altère-t-il le fichier ? | **Non, byte-identique** | Transport verbatim (base64 lossless), confirmé 11/11 incl. Page/Livre (§3) |
| Deux exports du même contenu diffèrent-ils ? | **Non** (hasard neutralisé) | Déterministe : H5P 79/79, Moodle 33/33, docs 31×3 — tous stables (§7) |
| Re-traiter un export ajoute-t-il des caractères ? | **1 bug latent → CORRIGÉ** | SortParagraphs `<p>` doublé : guard ajouté (§8 #1). 26 autres = latents non-bugs (§5) |
| Le vrai DOMPurify change-t-il le contenu HTML ? | **Quasi jamais** | 78/79 identiques navigateur↔Node ; seule diff = `<`→`&lt;` (correct) (§6) |
| Les exports bureautiques sortent-ils correctement ? | **Oui, déterministes** | DOCX/ODT/PDF 31/31 chacun, 0 erreur (§7) |
| Le DOCX/ODT de Caramel == celui de Sucrerie ? | **Pas de perte de contenu** | Code identique. **19/31 byte-identiques** (dont Présentation + Livre, corrigés) + Crossword (contenu=, PNG≠) + 3 titre-only. Reste = **ordre** (D&D/Quiz) + **titre/espaces** (Essay/MarkWords/Devoir) + FillInTheBlanks (intro récupérée par 3ᵉ correctif ; léger écart de formatage docx). **Aucune perte de contenu** après correctifs. Branding en-tête/pied ≠ par design. ⚠️ Comparaison docx du harnais parfois instable (§8bis) |

**Le seul vrai trou** : le **PDF** a deux chemins de rendu (Gotenberg/LibreOffice vs jsPDF).
Le harnais ne valide que **jsPDF** (Gotenberg injoignable en test). Le PDF qu'obtient un
vrai utilisateur avec Gotenberg accessible **n'est pas testé** et diffère (meilleure fidélité
math). Voir §8 #3.

**L'automatisation demandée existe** (§9) :
- `node tests/roundtrip/harness.mjs` — rapide, sans navigateur (idempotence + déterminisme + Sucrerie + snapshot, H5P & Moodle non-Page).
- `cd tests/roundtrip && node playwright-harness.mjs` — navigateur réel (tout : Page/Livre, documents, vrai DOMPurify).
- Chaque run compare au **snapshot de référence** (`report.json` / `report-phase2.json`) → toute régression future est détectée immédiatement, sans test manuel.

---

## 1. Objectif

Éliminer les **tests manuels**. Harnais qui, pour **chaque type d'activité** : charge une
fixture déterministe (`assets/data/examples/*.json`, zéro token LLM), **exporte tous les
formats** (`.h5p`, `.mbz`, `.docx`, `.odt`, `.pdf`), **simule le dépôt Sucrerie** (extraction +
base64) pour les formats numériques, **récupère + ré-exporte**, **compare** taille + contenu
après canonicalisation, et produit un **rapport** + un **snapshot de référence** committé.

---

## 2. Faisabilité technique & couverture

| Export | Entrée | DOM ? | Couverture |
|---|---|---|---|
| **.h5p** | `processH5PContent` → `createH5PBlob` | non | ✅ Node + navigateur (79 fixtures) |
| **.mbz** Millionnaire/Appariement/QCM/Devoir | `handleXxxCreation` | non* | ✅ Node + navigateur |
| **.xml** test_elea/glossaireXml | idem | non | ✅ Node + navigateur |
| **.mbz** Page/Livre | `handlePageCreation`/`handleLivreCreation` | **oui** (page-themes) | ✅ navigateur (Phase 2) |
| **.docx** / **.odt** | `exportToDOCX`/`exportToODT` | FileReader/Image | ✅ navigateur (31 types) |
| **.pdf** | `exportToPDF` (Gotenberg **ou** jsPDF) | Canvas/réseau | ⚠️ navigateur, **jsPDF seulement** (§8 #3) |

\* `fflate.gzip` async absent en Node → shimé `gzipSync` mtime fixe, sortie byte-identique
(vérifié). En navigateur : API native, pas de shim.

**Outillage** : produit Caramel reste **no-build/no-npm**. Le tooling de test est **isolé**
dans `tests/roundtrip/` (`package.json` + `node_modules` Playwright **git-ignorés**). Node v22.18.0.

---

## 3. Round-trip Sucrerie = LOSSLESS (confirmé empiriquement)

`js/sucrerie-bridge/` = pont de **dépôt**. `extract.js` extrait seulement du **texte**
(markdown pour l'enrichissement LLM des **métadonnées**), **ne touche jamais au binaire**.
`deposit-flow.js` encode le blob en **base64** et le POST tel quel. Backend n8n stocke
`binary_base64` **AS-IS**, lecture verbatim, rendu via h5p-standalone. Modération = sur les
**métadonnées texte**, jamais le fichier.

> **Empirique** : base64(blob) → décodage → octets **identiques** à l'original.
> Phase 1 (T3) 6/6 H5P ✅. Phase 2 (P4) **11/11** incl. **Page** (`.mbz`, type `page`) et
> **Livre** (`.mbz`, type `book`), + ré-export canoniquement identique 11/11.
> → « est-ce qu'on ajoute un caractère au transport » = **NON**.

---

## 4. Non-déterminisme (identifié et neutralisé)

- **Moodle .mbz** : IDs random (`courseId`/`moduleId`/`sectionId`/`activityId`/`contextId`/
  `categoryId`/`gradeItemId`/`FEEDBACK_ID`/`ENROL_*`…), slugs `parcours-`/`page-`/`livre-`,
  timestamps `Date.now()`/`new Date()` — embarqués dans le XML.
- **H5P .h5p** : shuffle de contenu DragAndDrop/QuizSet (uniquement création IA, jamais
  re-export) ; `new Date()` → nom de fichier seulement.
- **Neutralisation** : `Math.random`→mulberry32 seedé + `Date` figé (mêmes constantes côté
  Node `bootstrap.mjs` et côté navigateur `addInitScript` → comparables). Résultat : **0
  non-déterminisme résiduel** (T1 79/79, P3 31/31).
- **Canonicalisation** (`canonicalize.mjs`) : dézip/détar, tri des entrées, scrub regex des
  IDs/timestamps/slugs → placeholders, sha256.

---

## 5. Idempotence de la ré-ingestion (le test « +1 caractère »)

`v1 = process(heal(fixture))` vs `v2 = process(heal(clone(v1)))`, UUIDs masqués.
**Après correctif §8 #1 : 53/79 idempotents. 26 non-idempotents = SHAPE-LOSS** :
InteractiveBook(13), CoursePresentation(5), FillInTheBlanks(3), DragAndDrop(2),
InteractiveVideo(2), QuizSet(1). La 2ᵉ passe lit des champs d'entrée **bruts** absents de la
sortie déjà traitée → `slides→[]`, `text→""`. Transformations **one-shot**, pas des bugs.

**Contexte décisif** : flux **Markdown-First** — `js/editor/index.js` et `regenerateH5PFile`
re-process toujours `originalJsonData` (markdown brut), **jamais** la sortie. Sur Sucrerie le
`.h5p` est rendu **verbatim**. → **les 26 sont LATENTS** (aucun flux actuel ne re-process une
sortie). Risque seulement si un futur code re-process du contenu déjà exporté.

---

## 6. Fidélité HTML / DOMPurify (caveat Phase 1 → LEVÉ)

Phase 1 ne pouvait pas exécuter DOMPurify (Node sans DOM → stub identité). Phase 2 compare,
**à traductions FR identiques des deux côtés** (seule variable = DOMPurify), le `content.json`
navigateur (vrai DOMPurify 3.4.8) au `content.json` Node (identité) :

> **78/79 identiques. 1 seule différence** : `QuizSetQCM/quiz_qcm_5.json`,
> `questions[0].params.answers[3].text` → `"x < 3"` (identité) vs `"x &lt; 3"` (vrai DOMPurify,
> +3 o). DOMPurify HTML-encode le `<` nu (non-tag) — **comportement correct**, aucune perte
> de rendu. → le stub identité Node est une **approximation sûre** partout sauf métacaractères
> HTML nus dans le texte. Caveat levé.

(Note : une comparaison secondaire navigateur-vs-baseline-Node-externe montre 40 écarts, mais
c'est un **artefact** — la baseline Node externe n'appelle pas `loadTranslations('fr')` donc les
labels l10n/a11y diffèrent ; ce n'est PAS du DOMPurify. La méthode primaire neutralise ça.)

---

## 7. Matrice des activités (résultats Phase 1 + Phase 2)

> ✅ OK/fidèle · ⚠️ latent/caveat · ❌ bug · — N/A.

### H5P (79 fixtures)
| Aspect | Résultat |
|---|---|
| Déterminisme `.h5p` (T1/P3) | ✅ 79/79 |
| Idempotence (T2) | ✅ 53/79 ; ⚠️ 26 shape-loss latents (§5) ; SortParagraphs **corrigé** |
| Fidélité HTML vrai DOMPurify (P2) | ✅ 78/79 identiques ; 1× `&lt;` (correct, §6) |
| Round-trip Sucrerie (T3/P4) | ✅ verbatim + ré-export identiques |
| Export DOCX/ODT/PDF (P5) | ✅ 1 fixture/type, déterministe (PDF = jsPDF, §8 #3) |

Types couverts : Timeline, Flashcards, Glossaire(elea), Crossword, Essay, Summary, DragTheWords,
DragAndDrop, FillInTheBlanks, MarkTheWords, TrueFalse, MultipleChoice, FindTheWords,
SortParagraphs, SingleChoiceSet, DialogCards, Chart, Accordion, QuizSet, QuizSetQCM, QuizSetVF,
CoursePresentation, InteractiveBook, InteractiveVideo.

### Moodle/Éléa (33 fixtures)
| Activité | Natif | Déterminisme | Round-trip | Documents |
|---|---|---|---|---|
| Millionnaire, Appariement, QCM, Devoir | `.mbz` | ✅ | ✅ | ✅ |
| test_elea, glossaireXml | `.xml` | ✅ | ✅ | ✅ |
| **Page, Livre** | `.mbz` | ✅ (P3) | ✅ verbatim (P4) | ✅ |

### Documents (DOCX/ODT/PDF) — ✅ 31 types × 3 formats, 0 erreur, déterministes.
Tailles indicatives : DOCX ~9,5–11,5 Ko · ODT ~20–33 Ko · PDF ~85–123 Ko (jsPDF).

---

## 8. Bugs / pertes / trous de fidélité (le livrable)

| # | Activité | Format | Symptôme | Cause | Sévérité | Statut |
|---|---|---|---|---|---|---|
| 1 | **SortParagraphs** | .h5p | `<p>` doublé si re-process (`<p><p>…</p></p>`) | enveloppe sans garde — [SortParagraphs.js:21](../js/h5p/processors/SortParagraphs.js#L21) | Moyenne (**latent**) | **CORRIGÉ ✅** (guard idempotence, vérifié 2/2) |
| 2 | IB, CP, FillBlanks, D&D, IV, QuizSet (26) | .h5p | 2ᵉ passe process() → champs vidés | transformations **one-shot** | Faible (**latent**, non-bug) | Documenté ; action seulement si on veut des processors idempotents |
| 3 | **Toutes** | **.pdf** | PDF Gotenberg (rendu LibreOffice, math++) **non validé** ; seul jsPDF testé | Gotenberg injoignable en test → fallback jsPDF systématique | Moyenne (**trou de couverture**) | **a) FAIT** (blocage réseau durci) · **b) ouvert** (valider Gotenberg) |
| 4 | Toutes (champs HTML) | .h5p | `<` nu → `&lt;` par DOMPurify | encodage HTML correct | Nulle (non-bug) | ✅ documenté (§6) |
| — | Transport Sucrerie | .h5p/.mbz | (aucune perte) | base64 verbatim | — | ✅ lossless prouvé |
| 5a | **InteractiveBook** | DOCX/ODT C↔S | couverture absente côté Sucrerie | `adaptInteractiveBook` ne lisait pas `bookCover` (qui EST dans le `.h5p`) | Moyenne | **CORRIGÉ ✅** (Sucrerie, byte-identique) |
| 5b | FillInTheBlanks | DOCX/ODT C↔S | intro absente côté Sucrerie | formateur lit l'intro via `taskDescription`, le paquet la nomme `text` | Moyenne | **CORRIGÉ ✅** (Sucrerie mappe `text`→`taskDescription`) ; intro récupérée (ODT contenu=), écart formatage docx résiduel |
| 6 | **CoursePresentation** | DOCX/ODT C↔S | titre de diapo collé au corps | slide de titre mal adaptée côté Sucrerie | Faible-Moy | **CORRIGÉ ✅** (Sucrerie, byte-identique) |
| 7 | DragAndDrop, QuizSet | DOCX/ODT Caramel↔Sucrerie | **ordre** des éléments ≠ | shuffle figé dans le `.h5p` à la création | Faible (pas de perte) | OUVERT (§8bis) |
| 8 | MultiChoice, SingleChoice, TrueFalse, Essay, MarkWords, Devoir | DOCX/ODT Caramel↔Sucrerie | **titre** ≠ (défaut formateur vs titre-module) | fixtures **sans `title`** | Cosmétique (artefact fixture) | Documenté (§8bis) |

**Actions (#3 PDF)** :
- a) ✅ **FAIT** — blocage réseau durci : `context.route('**/*', …)` avec allow-list localhost
  (tout hôte externe est aborté par construction). Vérifié sur Flashcards : `gotenberg:0`,
  fallback jsPDF, 0 hang, chargement des modules locaux intact. (Non committé, comme le reste
  du harnais.)
- b) ⏳ **ouvert** — valider le chemin Gotenberg : nécessite un Gotenberg joignable (instance
  test/mock) pour comparer le PDF « réel utilisateur » (rendu LibreOffice) au snapshot.

---

## 8bis. Parité export document Caramel ↔ Sucrerie (Phase 3 — « Caramel == Sucrerie ? »)

Question : le DOCX/ODT produit par **Caramel** et par **Sucrerie** pour la même activité
est-il le même ?

**Fait** : le code d'export est **byte-identique** des deux côtés (7 fichiers `js/export/*`
vérifiés par `diff`). Seule l'**entrée** diffère :
- **Caramel** formate depuis le JSON **source** (`originalJsonData`, *pré-processor*, markdown).
- **Sucrerie** n'a que le paquet stocké → formate depuis le `content.json` H5P / XML Moodle
  **extrait** (*post-processor*, HTML), via `normalizeH5pModel`/`parseActivity`.

> **⚠️ Par conception, JAMAIS byte-identique en prod** : en-tête/pied de page diffèrent
> (« Caramel - Ressource… » vs « Sucrerie - … », URL footer). Le test neutralise ce branding
> (chrome, pas pédagogie) pour isoler le **contenu**. « Le même » = même **contenu**, pas mêmes octets.

**Résultat contenu (31 types, méthode C2 « faithful » — modèle d'entrée Sucrerie copié
verbatim + formateur byte-identique)** :
- **20 types : document identique** (17 byte-identique + Crossword [aux octets des PNG de grille
  près] + SortParagraphs/Timeline [à un `\n\n`→`\n` près]). **Inclut Page & Livre** (round-trip
  HTML→blocs lossless).
- **6 types : diffèrent SEULEMENT par le titre** (MultipleChoice, SingleChoiceSet, TrueFalse,
  Essay, MarkTheWords, Devoir) — fixtures **sans `title`** → Caramel met un libellé par défaut
  (« Question à choix multiple »), Sucrerie lit le titre-module du h5p.json/mbz (« Choix
  multiples »). Corps identique. *Artefact de fixture* : en usage réel les activités ont un titre.
- **Divergences traitées / restantes** :
  1. ✅ **InteractiveBook — CORRIGÉ côté Sucrerie** : la couverture EST dans le `.h5p`
     (`bookCover.coverDescription` + `showCoverPage`) mais `adaptInteractiveBook` ne la lisait pas.
     Fix : l'adaptateur construit `out.cover = { description }` (champ lu par `formatInteractiveBook`).
     → **byte-identique** DOCX+ODT. (Sucrerie uniquement, 0 régression.)
  2. ✅ **CoursePresentation — CORRIGÉ côté Sucrerie** : c'était une **slide de titre**
     (`<h2>titre</h2><p>sous-titre</p>` dans un seul AdvancedText) ; l'adaptateur poussait tout
     dans le corps → `cleanHtml` retirait le `<h2>` → titre collé (« La Révolution françaiseDe 1789… »).
     Fix : `adaptCoursePresentation` détecte le `<h2>` initial et reconstruit `{type:'title', subtitle}`.
     → **byte-identique** DOCX+ODT. (Sucrerie uniquement, 0 régression.)
  3. ✅ **FillInTheBlanks — CORRIGÉ côté Sucrerie**. (Correction d'une analyse antérieure erronée :
     l'intro **EST** dans le `.h5p` (champ `text`, vue par l'élève) et dans le Word de Caramel ; le
     formateur ne l'affiche que via `taskDescription` ([document-formatter.js:432](../js/export/document-formatter.js#L432)),
     or le paquet la nomme `text` → Sucrerie la sautait. **Caramel ne perd rien.**) Fix : `normalizeH5pModel`
     mappe `text`→`taskDescription` → intro **récupérée** (ODT : `contenu=`, plus de perte). Écart de
     **formatage** résiduel en DOCX (markdown source vs HTML empaqueté — différence inhérente
     source/paquet, **pas une perte**).
  4. **DragAndDrop, QuizSet(DragQuestion)** — *non corrigé (cosmétique)* : **ordre** des éléments
     différent (shuffle figé dans le `.h5p` à la création, `h5p-creator.js:87-135`). Même contenu,
     aucune perte ; aligner demanderait de toucher Caramel.

**Cause racine** : Caramel exporte depuis le **source pré-processor** (peut contenir intro,
ordre non mélangé, LaTeX brut → OMML éditable), Sucrerie depuis l'**activité packagée réelle**.
Ils divergent là où le *processing* change le contenu. Sucrerie reflète ce que voit l'élève ;
Caramel peut montrer plus/différemment. (Tension : le source-export de Caramel donne de
**meilleurs documents** — math LaTeX→OMML éditable — mais ne colle pas à l'activité déployée.)

**Correctifs appliqués (Sucrerie uniquement, Caramel NON touché)** :
- ✅ **InteractiveBook** + ✅ **CoursePresentation** + ✅ **FillInTheBlanks** corrigés dans
  `assets/js/h5p-export-bridge.js` (lecture couverture ; reconstruction slide de titre ;
  remappage `text`→`taskDescription`) → CP & Livre byte-identiques ; FillInTheBlanks intro récupérée
  (ODT contenu=, écart formatage docx résiduel). 0 régression sur les autres types.

**Non poursuivi (demanderait de toucher Caramel — refusé par l'utilisateur, pas de rétrogradation)** :
- DragAndDrop/QuizSet (ordre) : shuffle figé dans le `.h5p` ; même contenu, aucune perte. Laissé tel quel.
- Titres (MultipleChoice/SingleChoiceSet/TrueFalse/Essay/MarkWords/Devoir) : divergence due aux
  **fixtures sans titre** (le vrai usage en a un) ; pas un défaut de code. Laissé tel quel.
- Écart de formatage docx résiduel (markdown source vs HTML empaqueté) : inhérent à la différence
  source/paquet, **pas une perte**. Non corrigé.

Harnais : `tests/roundtrip/parity-export-harness.mjs` (+ `sucrerie-binary-to-model.mjs`,
`sucrerie-page-html-parser.mjs`, copies verbatim du code Sucrerie). Rapport :
`report-phase3-parity.json`. Lancer : `cd tests/roundtrip && node parity-export-harness.mjs`.

---

## 9. Mode d'emploi du harnais (l'automatisation)

```bash
# Harnais Node (rapide, sans navigateur) — idempotence, déterminisme, Sucrerie, snapshot
node tests/roundtrip/harness.mjs
node tests/roundtrip/harness.mjs --only=DragAndDrop,Flashcards   # filtrer par moduleKey
node tests/roundtrip/harness.mjs --fixture=flashcards_1          # une fixture
node tests/roundtrip/harness.mjs --quiet                         # moins de logs

# Harnais navigateur (Playwright) — TOUT : Page/Livre, documents, vrai DOMPurify
cd tests/roundtrip && node playwright-harness.mjs
node playwright-harness.mjs --only=Page,Livre   # filtrer
node playwright-harness.mjs --skip=P4,P5        # sauter des batteries
node playwright-harness.mjs --skip-docs         # sauter les exports documents
```

Sorties : `tests/roundtrip/report.json` (baseline Node) et `report-phase2.json` (navigateur),
git-ignorées. **Workflow anti-régression** : après toute modif du pipeline, relancer →
comparer au snapshot précédent → toute divergence = régression à investiguer.

Fichiers du harnais (`tests/roundtrip/`) : `bootstrap.mjs` (seeding+stubs+libs Node),
`fixtures-map.mjs`, `canonicalize.mjs` (dézip+scrub+sha256), `harness.mjs` (Node, T1-T5),
`browser-harness.html` (page d'exposition des modules réels), `playwright-harness.mjs`
(runner navigateur, P1-P5), `README.md`. **Tout est git-ignoré sauf le code source du harnais
lui-même** (non encore committé — voir Journal).

---

## 10. Journal d'avancement

- **2026-06-16 (1)** — Exploration (4 agents) : pipeline export, sucrerie-bridge, inventaire,
  outillage. Découvertes §3 (transport lossless), §4 (non-déterminisme), §5 (idempotence).
- **2026-06-16 (2)** — **Phase 1** (Node) construite + exécutée : T1 déterminisme 79/79 ✅ ·
  T2 idempotence 51/79 (1 bug + 26 latents) · T3 Sucrerie 6/6 ✅ · T5 Moodle non-Page 6/6 ✅.
- **2026-06-16 (3)** — Correctif **SortParagraphs** appliqué + vérifié (53/79). Décision :
  Phase 2 = **Playwright**. Isolation npm + install Chromium.
- **2026-06-16 (4)** — **Phase 2** (navigateur) construite + exécutée : P1 couverture H5P 79/79
  + Moodle 33/33 (Page/Livre inclus) ✅ · P2 DOMPurify 78/79 identiques (caveat levé, §6) ·
  P3 déterminisme 31/31 ✅ · P4 round-trip 11/11 verbatim + 11/11 ré-export ✅ · P5 documents
  31×3 ✅ déterministes. Trou identifié : PDF Gotenberg non validé (§8 #3). Correctifs harnais :
  `canonicalize.untarMbz` (ensureTar, anti-hang), `loadFixtureObj` (heal fallback).
- **2026-06-16 (5)** — Correctif SortParagraphs **committé seul** sur la branche
  `fix-sortparagraphs-idempotence` (1 fichier, +9/-1). **Blocage réseau du harnais durci**
  (allow-list localhost, étanche) + vérifié. Harnais + doc laissés non committés (choix
  utilisateur). **Reste (option)** : validation du chemin Gotenberg PDF (§8 #3 b).
- **2026-06-16 (6)** — **Phase 3 : parité document Caramel ↔ Sucrerie** (`parity-export-harness.mjs`,
  + modèle d'entrée Sucrerie copié verbatim). Code d'export byte-identique des 2 côtés ; seule
  l'entrée diffère (Caramel = source pré-processor, Sucrerie = paquet post-processor). Verdict :
  20/31 types identiques (Page/Livre inclus), 6 types titre-only (fixtures sans `title`),
  ~4 divergences réelles (FillInTheBlanks/InteractiveBook intro perdue côté Sucrerie ;
  CoursePresentation titre collé au corps = bug Sucrerie ; DragAndDrop/QuizSet ordre figé par
  shuffle). Branding en-tête/pied **toujours** différent par conception. Détail §8bis.
  **Reste** : décider de l'alignement d'entrée (stocker source dans .h5p vs exporter le traité)
  + fix `adaptCoursePresentation` côté Sucrerie. Aucun correctif appliqué (audit).
- **2026-06-16 (7)** — **2 correctifs Sucrerie** (`assets/js/h5p-export-bridge.js`, Sucrerie
  uniquement) : `adaptInteractiveBook` lit la couverture (`bookCover.coverDescription`),
  `adaptCoursePresentation` reconstruit les slides de titre. CoursePresentation + InteractiveBook :
  divergent → **byte-identique** (DOCX+ODT). **Régression : 0** (29 autres types inchangés au bit
  près ; 7 fichiers d'export partagés toujours byte-identiques ; diff revu manuellement). Harnais
  miroir `sucrerie-binary-to-model.mjs` mis à jour. **Non committé** (Sucrerie sur `main`).
  **Caramel non touché** (choix utilisateur : pas de rétrogradation).
- **2026-06-16 (8)** — **3ᵉ correctif Sucrerie** (FillInTheBlanks : `normalizeH5pModel` mappe
  `text`→`taskDescription`) → intro récupérée (ODT `contenu=`). **Run complet de vérité (31 types)** :
  **19 byte-identiques** (Présentation/Livre inclus) + Crossword (contenu=, PNG≠) + 3 titre-only ;
  reste = ordre (D&D/QuizSet) / titre+espaces (Essay/MarkWords/Devoir) / formatage docx — **aucune
  perte de contenu**. **Caveat harnais** : comparaison docx INSTABLE (DragTheWords « identique » au run
  complet, « divergent » au run filtré, même fichier) → verdicts docx individuels = faux positifs
  possibles ; se fier à l'ODT + byte-identique. **Correction d'un sur-optimisme antérieur** (« 22/31 »
  annoncé → 19 byte-identiques réels).
- **2026-06-16 (9)** — Les **3 correctifs Sucrerie committés** sur la branche
  `fix-parite-export-documents` (1 fichier `assets/js/h5p-export-bridge.js`, +30/-3 ; working tree
  propre). Côté Caramel : fix SortParagraphs sur `fix-sortparagraphs-idempotence`. **Rien poussé** ;
  le harnais + ce doc (Caramel) restent non committés (choix utilisateur). Branches à merger/PR quand prêt.
