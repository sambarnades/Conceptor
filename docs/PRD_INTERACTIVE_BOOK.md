# PRD — Activité H5P « Livre interactif » (H5P.InteractiveBook)

> **Version** : 1.0.0 — **Date** : 2026-06-12
> **Base** : `docs/PRD_NOUVELLE_ACTIVITE_H5P.md` (modèle 18 phases) + `docs/PRD_COURSE_PRESENTATION.md` (conteneur de référence)
> **Skill associé** : `caramel-add-h5p-activity`
> **Objectif** : Intégrer l'activité **Livre interactif** dans Caramel — un livre multi-chapitres où chaque chapitre est une page riche (textes, tableaux, images, exercices empilés), avec table des matières, page de couverture et page de résumé/score.

---

## 0. Décisions de design (validées)

| Décision | Choix retenu | Conséquence |
|---|---|---|
| **Modèle de contenu par chapitre** | **Chapitres riches** : chaque chapitre = un `H5P.Column` = pile verticale de **blocs** (`content[]`) | Plus puissant que CoursePresentation (qui plafonne à 1 texte + 1 exercice par slide). Coût principal : éditeur à blocs imbriqués (array dans array). |
| **Page de couverture** | **Incluse** (V1) | `showCoverPage` + `bookCover.coverDescription` (+ média optionnel laissé pour le support image). |
| **Images** | **Incluses** (V1) | Bloc `image` dans un chapitre. S'appuie sur le système d'images (cf. skill `caramel-add-image-support`). |
| **Table des matières + résumé** | **Incluses** (V1) | `behaviour.defaultTableOfContents` + `behaviour.displaySummary` (page de synthèse native qui agrège les scores). |
| **« Tout ce que H5P permet »** | **Tous les blocs IA-générables** sont supportés : `text`, `table`, `image`, `exercise` (9 sous-types) | Le `H5P.Column` accepte techniquement vidéo/audio/accordéon/etc. ; non IA-générables → hors V1, mais l'architecture du processeur reste ouverte (cf. §16). |
| **Sous-types d'exercices** | Les **mêmes 9 que CoursePresentation** | Réutilise les processeurs enfants existants via `helpers.processChild()` — zéro nouveau code d'exercice. |
| **Modèle LLM** | Défaut Caramel (`mistral-small-4-119b`), surcharge `gpt-oss-120b` en réserve (commentée) | Aligné sur CoursePresentation (override actuellement commenté). À benchmarker. |

> **Ce qui distingue fondamentalement le Livre interactif de la Présentation de cours** : la **richesse du chapitre**. Une slide CP est une page d'écran positionnée (x/y) avec ~1 élément. Un chapitre IB est une **page de livre** qui défile verticalement et empile **autant de blocs que voulu** — c'est exactement ce que `H5P.Column` modélise, **sans aucune coordonnée**. Le processeur IB est donc plus simple côté layout (pas de templates x/y) mais plus riche côté structure (blocs polymorphes).

---

## 1. Contexte et vision pédagogique

### 1.1. Qu'est-ce qu'un Livre interactif ?

Un **livre numérique** H5P composé de **chapitres** (pages). Chaque chapitre empile verticalement :
- du **contenu** : texte riche, tableaux, images ;
- des **exercices interactifs** : QCM, vrai/faux, texte à trous, glisser les mots, etc. ;
- une **navigation** par table des matières latérale (sidebar) ;
- une **page de résumé** finale qui agrège les scores de tous les exercices du livre.

Optionnellement, une **page de couverture** d'accueil (titre + description + média) précède le premier chapitre.

### 1.2. Intérêt pédagogique

- **Cours long et structuré** : idéal pour un chapitre de manuel, une séquence pédagogique complète, un dossier documentaire.
- **Lecture libre + auto-évaluation** : l'élève navigue entre chapitres, lit, puis vérifie ses acquis avec les exercices intégrés.
- **Suivi de progression** : indicateurs de complétion par chapitre (`progressIndicators`), barre de progression, page de résumé.
- **Mixité contenu/exercice fine** : contrairement à CoursePresentation, on peut alterner *au sein d'un même chapitre* plusieurs paragraphes et plusieurs exercices.

### 1.3. Blocs disponibles dans un chapitre — V1

| # | Bloc (`type`) | Library H5P | Catégorie | Délégation |
|---|---|---|---|---|
| 1 | `text` | `H5P.AdvancedText 1.1` | Contenu | — (direct) |
| 2 | `table` | `H5P.Table 1.2` | Contenu | — (direct, réutilise `buildTableParams` de CP) |
| 3 | `image` | `H5P.Image 1.1` | Contenu | — (direct, voir `caramel-add-image-support`) |
| 4 | `exercise` → `multichoice` | `H5P.MultiChoice 1.16` | Exercice | `MultipleChoice.js` |
| 5 | `exercise` → `truefalse` | `H5P.TrueFalse 1.8` | Exercice | `TrueFalse.js` |
| 6 | `exercise` → `blanks` | `H5P.Blanks 1.14` | Exercice | `FillInTheBlanks.js` |
| 7 | `exercise` → `dragtext` | `H5P.DragText 1.10` | Exercice | `DragTheWords.js` |
| 8 | `exercise` → `singlechoiceset` | `H5P.SingleChoiceSet 1.11` | Exercice | `SingleChoiceSet.js` |
| 9 | `exercise` → `markthewords` | `H5P.MarkTheWords 1.11` | Exercice | `MarkTheWords.js` |
| 10 | `exercise` → `summary` | `H5P.Summary 1.10` | Exercice | `Summary.js` |
| 11 | `exercise` → `dragquestion` | `H5P.DragQuestion 1.14` | Exercice | `DragAndDrop.js` |
| 12 | `exercise` → `dialogcards` | `H5P.Dialogcards 1.9` | Exercice | `DialogCards.js` |

> **Non inclus V1** (le `Column` les accepte mais l'IA ne peut pas les générer sans média/source) : Audio, Vidéo, InteractiveVideo, Accordéon, ImageHotspots, Chart, Timeline, MemoryGame, Link, IFrameEmbed. L'architecture reste ouverte pour les ajouter (cf. §16.1).

---

## 2. Architecture technique — décisions clés

### 2.1. Structure cible du `content.json` (sortie processeur)

Vérifiée dans le code de la lib (`H5P.InteractiveBook-1.11/dist`). Le player lit `params.chapters[i].params.content[j].content` et `params.chapters[i].metadata.title` → **chaque élément de `chapters[]` EST directement l'objet `H5P.Column`** (clé `library` + `params` + `metadata` + `subContentId`), **sans wrapping `chapter`**. Les libellés l10n sont des **champs plats de premier niveau** (pas un objet `l10n` imbriqué comme CoursePresentation).

```jsonc
{
  "title": "Le système solaire",                       // métadonnées h5p.json (h5p-creator)
  "showCoverPage": true,
  "bookCover": {
    "coverDescription": "<p style=\"text-align:center\">Un voyage à travers les planètes…</p>"
    // "coverMedium": { ... }  // optionnel (image de couverture, cf. support image)
  },
  "chapters": [
    {
      "library": "H5P.Column 1.18",
      "subContentId": "uuid-chap-1",
      "metadata": { "contentType": "Column", "license": "U", "title": "Introduction" },
      "params": {
        "content": [
          {
            "content": {
              "library": "H5P.AdvancedText 1.1",
              "subContentId": "uuid-1",
              "metadata": { "contentType": "Text", "license": "U", "title": "Texte" },
              "params": { "text": "<p>Le <strong>système solaire</strong>…</p>" }
            },
            "useSeparator": "auto"
          },
          {
            "content": {
              "library": "H5P.MultiChoice 1.16",
              "subContentId": "uuid-2",
              "metadata": { "contentType": "Question", "license": "U", "title": "QCM" },
              "params": { /* produit par MultipleChoice.js via processChild */ }
            },
            "useSeparator": "auto"
          }
        ]
      }
    }
  ],
  "behaviour": {
    "baseColor": "#1768c4",
    "defaultTableOfContents": true,
    "progressIndicators": true,
    "progressAuto": true,
    "displaySummary": true,
    "enableRetry": true
  },
  // l10n PLATE de premier niveau (~35 champs) — cf. §7
  "read": "Lire",
  "displayTOC": "Afficher la table des matières",
  "hideTOC": "Masquer la table des matières",
  "nextPage": "Page suivante",
  "previousPage": "Page précédente",
  "chapterCompleted": "Page terminée !",
  "...": "…",
  "a11y": { "progress": "Page @page sur @total.", "menu": "Afficher/masquer le menu" }
}
```

> **Piège critique** : le player **filtre** au chargement les chapitres dont `params.content` est vide et les items sans clé `.content`. Chaque chapitre doit donc avoir ≥1 bloc valide, et chaque item doit être `{ content: {…}, useSeparator: "auto" }`. Le `metadata.title` du Column = **titre affiché dans la table des matières** : il est **obligatoire**.

### 2.2. Séparation contenu IA / structure H5P

| Responsabilité | Qui | Pourquoi |
|---|---|---|
| Titres, textes, questions, réponses, feedbacks | IA (LLM) | Valeur ajoutée pédagogique |
| `subContentId` (UUIDs), wrapping Column, `useSeparator` | Processeur | Technique pure |
| Library strings (`"H5P.MultiChoice 1.16"`) | Processeur (résolution depuis l'enum `multichoice`) | L'IA envoie un enum simplifié |
| l10n (~35 champs plats) | Processeur (en dur, localisé via `translations`) | Toujours identique |
| `behaviour` (couleur, TOC, progression, résumé) | Processeur (défauts sensés, surchargeables) | Cohérence |
| `metadata.title` des chapitres | Processeur (depuis `chapter.title`) | Navigation TOC |

### 2.3. Délégation des exercices — pattern QuizSet / CoursePresentation

Identique à `CoursePresentation.js` : pour chaque bloc `exercise`, le processeur construit `{ library, subContentId, metadata, params }` puis appelle `helpers.processChild(subContent)`. Le routeur (`processors/index.js`) résout le processeur enfant via `libraryToKey` et renvoie les `params` H5P complets. **Zéro nouveau code d'exercice.**

### 2.4. Processeur async + dépendances dynamiques

Comme CoursePresentation : `process()` est **async** (délègue aux enfants) et retourne `{ content, dependencies }`. Les dépendances sont **collectées dynamiquement** à partir des libs réellement utilisées (via `helpers.getKeyFromLibrary` + `helpers.getLibraryMetadata`), plus `H5P.Column 1.18` (toujours), plus `H5P.MathDisplay 1.0` **conditionnel** si du LaTeX est détecté.

### 2.5. Constantes configurables

```javascript
const DEFAULTS = {
    baseColor: '#1768c4',
    defaultTableOfContents: true,
    progressIndicators: true,
    progressAuto: true,
    displaySummary: true,
    enableRetry: true,
    showCoverPage: false,      // activé seulement si `cover` fourni
    tableStyle: 'default',     // réutilise les 6 styles de CP
};
```

---

## 3. Phase 1 — Enregistrement

### 3.1. `js/core/definitions.js` — `h5pModules`

```javascript
InteractiveBook: {
    name: "h5p_interactive_book_name",
    englishName: "InteractiveBook",
    machineName: "H5P.InteractiveBook",
    description: "h5p_interactive_book_description",
    image: "assets/images/activities/interactive-book-icon.webp",   // ← icône fournie
    promptId: "interactiveBookResultat",
    jsonInputId: "interactiveBookJsonInput",
    createBtnId: "createInteractiveBookH5P",
    categories: ["text", "quiz", "h5p"],
    hidden: false,
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["H5P", "DOCX", "ODT", "PDF"]
}
```

> **Piège** : `promptId` / `jsonInputId` / `createBtnId` doivent matcher EXACTEMENT les IDs DOM générés par `ui.js` à partir de `englishName` (`InteractiveBook`). Toute incohérence → boutons morts.

### 3.2. `js/core/definitions.js` — `customOrder`

Insérer `'InteractiveBook'` juste après `'CoursePresentation'` (ligne ~473) — les deux activités-conteneurs phares côte à côte :

```javascript
const customOrder = [
    'QuizSetQCM', 'QuizSetVF', 'QuizSet',
    'CoursePresentation',
    'InteractiveBook',          // ← ici
    'Flashcards', 'Crossword', 'Timeline',
    // …
];
```

### 3.3. `js/core/translation.js` — `defaultTranslations`

Ajouter le défaut français pour le rendu instantané (avant fetch i18n), à côté de `h5p_course_presentation_name` (ligne ~36) :

```javascript
h5p_interactive_book_name: "Livre interactif",
```

### 3.4. Validation Phase 1

- [ ] Tuile « Livre interactif » visible dans la grille avec l'icône `interactive-book-icon.webp`
- [ ] Filtres catégorie (`text`, `quiz`, `h5p`) et plateforme incluent la tuile
- [ ] Clic → panneau latéral avec IDs DOM corrects, aucun warning console

---

## 4. Phase 2 — Processeur H5P (`js/h5p/processors/InteractiveBook.js`) — CRITIQUE

### 4.1. Squelette

```javascript
import { translations } from '../../core/translation.js';
import { formatTextToHtml, generateUUID, debugLog } from '../../core/utils.js';
// Réutiliser buildTableParams + healSlidesLatex de CoursePresentation si possible
// (factoriser dans un module partagé, ou dupliquer si le couplage est jugé risqué).

const DEFAULTS = { /* cf. §2.5 */ };

const LIBRARY_MAP = {   // identique à CoursePresentation
    'multichoice':'H5P.MultiChoice 1.16','truefalse':'H5P.TrueFalse 1.8',
    'blanks':'H5P.Blanks 1.14','dragtext':'H5P.DragText 1.10',
    'singlechoiceset':'H5P.SingleChoiceSet 1.11','markthewords':'H5P.MarkTheWords 1.11',
    'summary':'H5P.Summary 1.10','dragquestion':'H5P.DragQuestion 1.14',
    'dialogcards':'H5P.Dialogcards 1.9',
    'advancedtext':'H5P.AdvancedText 1.1','table':'H5P.Table 1.2','image':'H5P.Image 1.1'
};
const EXERCISE_TYPES = new Set(['multichoice','truefalse','blanks','dragtext','singlechoiceset','markthewords','summary','dragquestion','dialogcards']);

export default {
    async process(jsonObj, helpers) {
        // 1. Healing LaTeX local (réutiliser healSlidesLatex de CP)
        // 2. Construire les chapitres : pour chaque chapter, mapper content[] → items Column
        // 3. Déléguer chaque bloc exercise à helpers.processChild()
        // 4. Wrapper chaque bloc en { content:{library,subContentId,metadata,params}, useSeparator:'auto' }
        // 5. Wrapper chaque chapitre en objet Column { library:'H5P.Column 1.18', params:{content}, metadata:{title}, subContentId }
        // 6. Construire bookCover si cover fourni
        // 7. Construire behaviour + l10n plate (buildL10n)
        // 8. Collecter dépendances dynamiques (+ Column 1.18 + MathDisplay conditionnel)
        // 9. return { content, dependencies }
    }
};
```

### 4.2. Construction d'un bloc → item Column

```javascript
function buildColumnItem(action) {
    return { content: action, useSeparator: 'auto' };
}

// Bloc texte
function buildTextBlock(text) {
    return {
        library: 'H5P.AdvancedText 1.1',
        subContentId: generateUUID(),
        metadata: { contentType: 'Text', license: 'U', title: 'Texte' },
        params: { text: formatTextToHtml(text) }
    };
}

// Bloc tableau — RÉUTILISER buildTableParams() de CoursePresentation (6 styles)
function buildTableBlock(table, style) {
    return {
        library: 'H5P.Table 1.2',
        subContentId: generateUUID(),
        metadata: { contentType: 'Table', license: 'U', title: 'Tableau' },
        params: buildTableParams({ ...table, _style: style })
    };
}

// Bloc image — cf. buildImageElement de CP (sans coordonnées ici)
function buildImageBlock(image, alt) {
    return {
        library: 'H5P.Image 1.1',
        subContentId: generateUUID(),
        metadata: { contentType: 'Image', license: 'U', title: 'Image' },
        params: { file: { path: image.path, mime: image.mime || 'image/jpeg',
                          width: image.width || 0, height: image.height || 0 },
                 alt: alt || '', decorative: !alt }
    };
}

// Bloc exercice — délégué au processeur enfant
async function buildExerciseBlock(exercise, helpers) {
    const rawLib = (exercise.library || '').trim();
    const libraryKey = rawLib.includes('.')
        ? Object.keys(LIBRARY_MAP).find(k => LIBRARY_MAP[k].toLowerCase() === rawLib.toLowerCase()) || rawLib.toLowerCase()
        : rawLib.toLowerCase();
    const fullLibrary = LIBRARY_MAP[libraryKey];
    if (!fullLibrary) { /* fallback AdvancedText comme CP */ }

    const { library, ...params } = exercise;
    const subContent = {
        subContentId: generateUUID(),
        library: fullLibrary,
        metadata: { contentType: 'Question', license: 'U', title: exercise.title || exercise.question || 'Exercice' },
        params
    };
    if (helpers?.processChild && EXERCISE_TYPES.has(libraryKey)) {
        try { return { action: await helpers.processChild(subContent), libName: fullLibrary.split(' ')[0] }; }
        catch (e) { debugLog('InteractiveBook', `processChild ${libraryKey}`, e); }
    }
    return { action: subContent, libName: fullLibrary.split(' ')[0] };
}
```

### 4.3. Construction d'un chapitre

```javascript
async function processChapter(chapter, helpers, allLibs) {
    const items = [];
    for (const block of (chapter.content || [])) {
        const type = (block.type || 'text').toLowerCase();
        if (type === 'text' && block.text) {
            items.push(buildColumnItem(buildTextBlock(block.text))); allLibs.add('H5P.AdvancedText');
        } else if (type === 'table' && block.table) {
            items.push(buildColumnItem(buildTableBlock(block.table, block.tableStyle))); allLibs.add('H5P.Table');
        } else if (type === 'image' && block.image?.path) {
            items.push(buildColumnItem(buildImageBlock(block.image, block.alt))); allLibs.add('H5P.Image');
        } else if (type === 'exercise' && block.library) {
            const { action, libName } = await buildExerciseBlock(block, helpers);
            items.push(buildColumnItem(action)); allLibs.add(libName);
        }
    }
    // Garde-fou : un chapitre ne doit jamais être vide (le player le filtrerait)
    if (items.length === 0) {
        items.push(buildColumnItem(buildTextBlock(chapter.title || ' ')));
        allLibs.add('H5P.AdvancedText');
    }
    return {
        library: 'H5P.Column 1.18',
        subContentId: generateUUID(),
        metadata: { contentType: 'Column', license: 'U', title: chapter.title || 'Chapitre' },
        params: { content: items }
    };
}
```

### 4.4. l10n plate (en dur, localisée) — `buildL10n()`

~35 champs de **premier niveau** (cf. liste §7). Pattern identique à CP mais **non imbriqué dans un objet `l10n`** : retourner un objet plat à fusionner dans `content`.

### 4.5. Assemblage final

```javascript
const content = {
    title: jsonObj.title || '',
    showCoverPage: !!jsonObj.cover,
    ...(jsonObj.cover ? { bookCover: { coverDescription: `<p style="text-align:center">${formatTextToHtml(jsonObj.cover.description || jsonObj.title || '')}</p>` } } : {}),
    chapters: processedChapters,
    behaviour: {
        baseColor: jsonObj.baseColor || DEFAULTS.baseColor,
        defaultTableOfContents: jsonObj.showTableOfContents ?? DEFAULTS.defaultTableOfContents,
        progressIndicators: DEFAULTS.progressIndicators,
        progressAuto: DEFAULTS.progressAuto,
        displaySummary: jsonObj.displaySummary ?? DEFAULTS.displaySummary,
        enableRetry: DEFAULTS.enableRetry
    },
    ...buildL10n()   // champs plats fusionnés au premier niveau
};
return { content, dependencies };
```

### 4.6. Routeur — `js/h5p/processors/index.js`

#### a) `processorMetadata`

```javascript
'InteractiveBook': {
    machineName: 'H5P.InteractiveBook',
    version: { major: 1, minor: 11 },
    extraDependencies: [
        { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
        { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
        { machineName: 'H5P.Column', majorVersion: 1, minorVersion: 18 },
        // Contenu
        { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
        { machineName: 'H5P.Table', majorVersion: 1, minorVersion: 2 },
        { machineName: 'H5P.Image', majorVersion: 1, minorVersion: 1 },
        // Exercices (mêmes que CoursePresentation)
        { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
        { machineName: 'H5P.TrueFalse', majorVersion: 1, minorVersion: 8 },
        { machineName: 'H5P.Blanks', majorVersion: 1, minorVersion: 14 },
        { machineName: 'H5P.DragText', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.SingleChoiceSet', majorVersion: 1, minorVersion: 11 },
        { machineName: 'H5P.MarkTheWords', majorVersion: 1, minorVersion: 11 },
        { machineName: 'H5P.Summary', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.DragQuestion', majorVersion: 1, minorVersion: 14 },
        { machineName: 'H5P.Dialogcards', majorVersion: 1, minorVersion: 9 },
        // Sous-dépendances
        { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
        { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 },
        { machineName: 'jQuery.ui', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.Audio', majorVersion: 1, minorVersion: 5 },
        { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
    ]
}
```

> La collecte dynamique reste la source de vérité ; ces `extraDependencies` servent de filet (cf. CoursePresentation, même approche). Vérifier dans la console preview qu'aucune dépendance ne manque.

#### b) Loader lazy

```javascript
'InteractiveBook': () => import('./InteractiveBook.js'),
```

#### c) Lookup inversé `libraryToKey`

```javascript
'H5P.InteractiveBook': 'InteractiveBook',
```

### 4.7. Validation Phase 2 (CRITIQUE)

- [ ] Coller l'exemple JSON (Annexe A) → `.h5p` téléchargé
- [ ] Le `.h5p` s'ouvre dans la preview (h5p-standalone) **et** dans Lumi/Éléa
- [ ] La table des matières liste tous les chapitres (titres corrects)
- [ ] Chaque chapitre défile verticalement avec ses blocs dans l'ordre
- [ ] Les exercices sont interactifs (réponse, score, réessayer, solution)
- [ ] La page de résumé agrège les scores
- [ ] La page de couverture s'affiche si `cover` fourni
- [ ] `?debug` : logs du processeur visibles

---

## 5. Phase 3 — JSON Healer (`js/h5p/json-healer.js`)

### 5.1. `H5P_LIB_VERSIONS` (Map, ligne ~27)

```javascript
'H5P.InteractiveBook': '1.11'
```

### 5.2. `H5P_MODULE_KEYS` (Set, ligne ~39)

```javascript
'DialogCards', 'ComplexFillTheBlanks', 'Chart', 'CoursePresentation', 'InteractiveBook'
```

### 5.3. Healing structurel — branche `if (moduleKey === 'InteractiveBook')` (vers ligne ~1012)

```javascript
if (moduleKey === 'InteractiveBook') {
    // Assurer chapters[]
    if (!Array.isArray(healed.chapters)) {
        if (healed.chapter || healed.pages || healed.sections) {
            const src = healed.chapter || healed.pages || healed.sections;
            healed.chapters = Array.isArray(src) ? src : [src];
            delete healed.chapter; delete healed.pages; delete healed.sections;
        } else { healed.chapters = []; }
    }
    healed.chapters = healed.chapters.map((ch, i) => {
        if (!ch || typeof ch !== 'object') ch = {};
        if (!ch.title) ch.title = `Chapitre ${i + 1}`;
        // Normaliser content[] : accepter un bloc unique, ou {text}/{exercise} à plat
        if (!Array.isArray(ch.content)) {
            const blocks = [];
            if (ch.text) blocks.push({ type: 'text', text: ch.text });
            if (ch.table) blocks.push({ type: 'table', table: ch.table, tableStyle: ch.tableStyle });
            if (ch.exercise) blocks.push({ type: 'exercise', ...ch.exercise });
            ch.content = blocks;
            delete ch.text; delete ch.table; delete ch.tableStyle; delete ch.exercise;
        }
        // Inférer le type de chaque bloc si absent
        ch.content = (ch.content || []).map(b => {
            if (b && !b.type) {
                if (b.library) b.type = 'exercise';
                else if (b.table) b.type = 'table';
                else if (b.image) b.type = 'image';
                else b.type = 'text';
            }
            return b;
        });
        return ch;
    });
    if (!healed.title) healed.title = healed.chapters[0]?.title || 'Livre interactif';
}
```

### 5.4. Healing LaTeX dans les blocs (vers ligne ~1939, à côté de CoursePresentation)

```javascript
if (moduleKey === 'InteractiveBook') {
    if (Array.isArray(healed.chapters)) {
        healed.chapters.forEach(ch => (ch.content || []).forEach(b => {
            if (b.text) b.text = cleanHtmlText(b.text);
        }));
    }
}
```

> Le healing LaTeX « nu » (`^{}`, `_{}`, `\circ`…) est appliqué **dans le processeur** via `healSlidesLatex` (réutilisé de CoursePresentation), pas ici — cohérent avec CP.

### 5.5. Validation Phase 3

- [ ] JSON mal formé (`chapters` nommé `pages`, blocs à plat sans `content[]`, type absent) → corrigé automatiquement
- [ ] `?debug` : diff raw → healed visible
- [ ] LaTeX correctement échappé

---

## 6. Phase 4 — Prompts et intégration IA

### 6.1. Fichiers

- **Prompt** : `assets/data/prompts/interactive_book.md`
- **Exemples** : `assets/data/examples/interactive_book_1.json` (simple, 3 chapitres) + `interactive_book_2.json` (riche, avec LaTeX, tableau, multi-exercices par chapitre)

### 6.2. `js/services/prompt-generator.js` — `ACTIVITY_CONFIG` (ligne ~54)

```javascript
interactiveBook: { prefix: 'prompt_interactive_book', resultKey: 'interactiveBookResultat' },
```

### 6.3. `js/services/llm.js` — `ACTIVITY_MODEL_OVERRIDES` (ligne ~40)

Laisser le **défaut** Caramel (`mistral-small-4-119b`). Préparer la surcharge en commentaire (réserve), comme CoursePresentation :

```javascript
// 'InteractiveBook': 'gpt-oss-120b', // Structure conteneur riche — réactiver après benchmark
```

### 6.4. Contrat du JSON simplifié IA (clés)

Le prompt doit produire EXACTEMENT la structure de l'Annexe A. Règles clés à inscrire dans `prompt_interactive_book_regles_specifiques` :
- Racine : `title`, optionnel `cover {description}`, optionnel `baseColor`, `showTableOfContents`, `displaySummary`, et **`chapters[]` obligatoire** (min 2, max 50).
- Chaque chapitre : `title` (obligatoire, sert à la TOC) + `content[]` (≥1 bloc).
- Chaque bloc : `type` ∈ {`text`, `table`, `image`, `exercise`}.
  - `text` → `{ "type":"text", "text":"…markdown…" }`
  - `table` → `{ "type":"table", "table":{headers,rows}, "tableStyle":"default|striped|bordered|dark-header|minimal|dsfr" }`
  - `exercise` → `{ "type":"exercise", "library":"H5P.MultiChoice 1.16", …params identiques aux prompts autonomes… }`
- **Cohérence des clés** : les params d'un exercice utilisent les **mêmes clés** que le prompt de l'activité autonome correspondante (`taskDescription`/`questions` pour Blanks, `taskDescription`/`textField` pour DragText, `summaries` pour Summary, etc.) — cf. Annexe D de `PRD_COURSE_PRESENTATION.md`.
- Encourager **plusieurs blocs par chapitre** (1–2 paragraphes + 1 exercice, ou plusieurs exercices) — c'est l'intérêt du Livre interactif.

### 6.5. Validation Phase 4

- [ ] « Générer en un clic » produit un JSON multi-chapitres valide
- [ ] Les 2 exemples passent healer + processeur sans erreur
- [ ] Chapitres riches (≥2 blocs) effectivement générés

---

## 7. Phase 5 — Traductions (11 langues)

Langues : `fr, en, es, de, it, nl, pt, ar, zh, jp, el`. Vérif finale : `node scripts/verify-all-locales.mjs` (+ `verify-locale-latex.mjs` si LaTeX).

### 7.1. Identité (2 clés)

| Clé | FR |
|---|---|
| `h5p_interactive_book_name` | `"Livre interactif"` |
| `h5p_interactive_book_description` | `"Créez un livre numérique multi-chapitres : chaque page mêle textes, tableaux, images et exercices (QCM, vrai/faux, texte à trous…), avec table des matières et page de résumé."` |

### 7.2. Prompts IA (3 clés)

`prompt_interactive_book_regles_specifiques`, `prompt_interactive_book_structure_json`, `prompt_interactive_book_exemple_rendu`.

### 7.3. l10n du player (~35 clés `h5p_ib_*`)

Mapper les champs **plats** de `semantics.json`. Défauts FR :

| Clé i18n | Champ H5P | FR |
|---|---|---|
| `h5p_ib_read` | `read` | `"Lire"` |
| `h5p_ib_display_toc` | `displayTOC` | `"Afficher la table des matières"` |
| `h5p_ib_hide_toc` | `hideTOC` | `"Masquer la table des matières"` |
| `h5p_ib_next_page` | `nextPage` | `"Page suivante"` |
| `h5p_ib_previous_page` | `previousPage` | `"Page précédente"` |
| `h5p_ib_chapter_completed` | `chapterCompleted` | `"Page terminée !"` |
| `h5p_ib_part_completed` | `partCompleted` | `"@pages sur @total terminées"` |
| `h5p_ib_incomplete_chapter` | `incompleteChapter` | `"Page incomplète"` |
| `h5p_ib_navigate_top` | `navigateToTop` | `"Aller en haut"` |
| `h5p_ib_mark_finished` | `markAsFinished` | `"J'ai terminé cette page"` |
| `h5p_ib_fullscreen` | `fullscreen` | `"Plein écran"` |
| `h5p_ib_exit_fullscreen` | `exitFullscreen` | `"Quitter le plein écran"` |
| `h5p_ib_book_progress_subtext` | `bookProgressSubtext` | `"@count sur @total pages"` |
| `h5p_ib_interactions_progress_subtext` | `interactionsProgressSubtext` | `"@count sur @total interactions"` |
| `h5p_ib_submit_report` | `submitReport` | `"Soumettre le rapport"` |
| `h5p_ib_restart` | `restartLabel` | `"Recommencer"` |
| `h5p_ib_summary_header` | `summaryHeader` | `"Résumé"` |
| `h5p_ib_all_interactions` | `allInteractions` | `"Toutes les interactions"` |
| `h5p_ib_unanswered` | `unansweredInteractions` | `"Interactions sans réponse"` |
| `h5p_ib_score_text` | `scoreText` | `"@score / @maxscore"` |
| `h5p_ib_left_of_total` | `leftOutOfTotalCompleted` | `"@left sur @max interactions terminées"` |
| `h5p_ib_no_interactions` | `noInteractions` | `"Aucune interaction"` |
| `h5p_ib_score` | `score` | `"Score"` |
| `h5p_ib_summary_and_submit` | `summaryAndSubmit` | `"Résumé &amp; envoi"` |
| `h5p_ib_no_chapter_bold` | `noChapterInteractionBoldText` | `"Vous n'avez interagi avec aucune page."` |
| `h5p_ib_no_chapter_text` | `noChapterInteractionText` | `"Vous devez interagir avec au moins une page avant de voir le résumé."` |
| `h5p_ib_answers_submitted` | `yourAnswersAreSubmittedForReview` | `"Vos réponses ont été soumises pour évaluation !"` |
| `h5p_ib_book_progress` | `bookProgress` | `"Progression du livre"` |
| `h5p_ib_interactions_progress` | `interactionsProgress` | `"Progression des interactions"` |
| `h5p_ib_total_score` | `totalScoreLabel` | `"Score total"` |
| `h5p_ib_a11y_progress` | `a11y.progress` | `"Page @page sur @total."` |
| `h5p_ib_a11y_menu` | `a11y.menu` | `"Afficher/masquer le menu de navigation"` |

> ~32 clés. `@count/@total/@pages/@score/@maxscore/@left/@max/@page` sont des **placeholders H5P** — ne pas traduire les `@…`.

### 7.4. Aide contextuelle `?` (~14 clés `eh_interactive_book_*`)

`eh_interactive_book_desc`, `_field_title`, `_field_cover`, `_field_chapters`, `_field_chapter_title`, `_field_content`, `_field_block_type`, `_field_exercise_library`, `_field_table`, `_good_structure`, `_good_variety`, `_bad_empty_chapter`, `_rule_min_chapters`, `_rule_block_variety`.

### 7.5. Onglet « Aide » de l'éditeur (~25 clés `eh_ib_*`)

Clés consommées par le template `assets/templates/editor-help/InteractiveBook.html` (cf. Phase 6.6). Calquer les sections de `eh_cp_*` : description, chapitres, types de blocs, types d'exercices, options, bon/mauvais exemple.

### 7.6. Validation des champs (~4 clés `validation_ib_*`)

`validation_ib_min_chapters`, `validation_ib_no_chapter_title`, `validation_ib_empty_chapter`, `validation_ib_no_exercise_lib`.

### 7.7. Tutoriel onboarding — `tuto_step2_h5p_content`

Ajouter une `<li>` dans la liste HTML des activités (11 langues) :
```html
<li><strong>Livre interactif :</strong> Un livre multi-chapitres où chaque page mêle textes, images, tableaux et exercices, avec table des matières et résumé.</li>
```

### 7.8. Estimation

| Groupe | Clés | × 11 |
|---|---|---|
| Identité | 2 | 22 |
| Prompts IA | 3 | 33 |
| l10n player | ~32 | 352 |
| Aide `?` | ~14 | 154 |
| Aide éditeur `eh_ib_*` | ~25 | 275 |
| Validation | ~4 | 44 |
| Labels éditeur `editor_ib_*` | ~30 | 330 |
| Tutoriel | 1 modif | 11 |
| **Total** | **~111** | **~1221** |

### 7.9. Validation Phase 5

- [ ] Nom/description FR + EN OK
- [ ] `verify-all-locales.mjs` vert (mêmes clés partout)
- [ ] Player affiche les libellés en FR (navigation, TOC, résumé, score)

---

## 8. Phase 6 — Éditeur visuel JSON (`js/editor/`) — point de complexité principal

> **Le défi nº1 du PRD.** Le modèle « chapitres riches » impose un **tableau imbriqué** : `chapters[]` (array) → `content[]` (array) → bloc polymorphe (`dynamicObject` selon `_blockType` + exercices via `_exerciseLibrary`). CoursePresentation n'avait qu'**un** niveau d'array (`slides[]`) avec un seul exercice par slide. Il faut **2 niveaux d'array** (chapitre → blocs).

### 8.1. Pré-requis éditeur à vérifier/étendre

- [ ] **Array imbriqué dans un item d'array** : vérifier que `array-manager.js` rend un champ `array` à l'intérieur d'un `itemSchema` d'array (CP le fait pour `table.rows` via un `object`, QuizSet pour `questions[]` au niveau racine — mais **array-dans-array-item** n'est pas encore prouvé). **Si non supporté → extension de `array-manager.js`** (chantier estimé moyen, ~80–150 lignes).
- [ ] **`dynamicObject` dans un item d'array imbriqué** : le bloc `exercise` réutilise le pattern `dynamicObject` + `selector` de CP, mais à 2 niveaux de profondeur.

> **Repli si l'array imbriqué s'avère trop coûteux** : modèle « chapitres simples » (1 texte + 1 exercice par chapitre, éditeur copié de CP). Décision à prendre au début de la Phase 6 selon l'état réel de `array-manager.js`. *(Non souhaité — perd l'intérêt produit — mais documenté comme garde-fou.)*

### 8.2. `content-detector.js` — signature de détection (ligne ~177)

```javascript
'InteractiveBook': (data) =>
    Array.isArray(data.chapters) &&
    data.chapters.length > 0 &&
    (Array.isArray(data.chapters[0].content) || data.chapters[0].hasOwnProperty('title')),
```

> **Ordre de détection** : placer cette signature **avant** des signatures plus génériques pour éviter les collisions. Vérifier qu'aucune autre activité n'a `data.chapters`.

### 8.3. Mappings (lignes ~243 et ~2620)

```javascript
// titleKeyToModuleKey
'h5p_interactive_book_name': 'InteractiveBook',
'h5p_interactivebook': 'InteractiveBook',
// moduleTranslationKeys
'InteractiveBook': 'h5p_interactive_book_name',
```

### 8.4. Schéma éditeur (vers ligne ~2436)

```javascript
case 'InteractiveBook':
  return {
    title: t('editor_title_prefix') + ' ' + t('h5p_interactive_book_name'),
    sections: [
      { id: 'general', title: t('editor_ib_section_general'), fields: [
          { key: 'title', label: t('editor_label_title'), type: 'text', required: true },
          { key: 'cover', type: 'object', label: t('editor_ib_cover'), collapsible: true, schema: {
              description: { type: 'textarea', label: t('editor_ib_cover_desc') } } },
      ]},
      { id: 'chapters', title: t('editor_ib_section_chapters'), countField: 'chapters', fields: [
          { key: 'chapters', type: 'array', itemLabel: t('editor_ib_chapter'),
            dynamicTitleField: 'title', minItems: 2, maxItems: 50,
            addLabel: t('editor_ib_add_chapter'),
            itemSchema: {
              title: { type: 'text', label: t('editor_label_title'), required: true },
              content: { type: 'array', itemLabel: t('editor_ib_block'),
                dynamicTitleField: '_blockType', addLabel: t('editor_ib_add_block'), minItems: 1,
                itemSchema: {
                  _blockType: { type: 'select', label: t('editor_ib_block_type'), required: true, options: [
                    { value: 'text', label: t('editor_ib_block_text') },
                    { value: 'table', label: t('editor_ib_block_table') },
                    { value: 'image', label: t('editor_ib_block_image') },
                    { value: 'exercise', label: t('editor_ib_block_exercise') } ] },
                  text: { type: 'textarea', large: true, label: t('editor_ib_text'),
                          showWhen: { field: '_blockType', value: 'text' } },
                  tableStyle: { type: 'select', label: t('editor_cp_table_style'),
                          showWhen: { field: '_blockType', value: 'table' }, options: [ /* 6 styles, réutiliser editor_cp_table_* */ ] },
                  table: { type: 'object', noHeader: true, showWhen: { field: '_blockType', value: 'table' },
                          schema: { headers: { type: 'array', itemType: 'text' }, rows: { type: 'array', itemType: 'array' } } },
                  image: { type: 'image', altTextField: 'alt', showWhen: { field: '_blockType', value: 'image' } },
                  _exerciseLibrary: { type: 'select', label: t('editor_cp_exercise_type'),
                          showWhen: { field: '_blockType', value: 'exercise' }, options: [ /* 9 libs, réutiliser editor_cp_ex_* */ ] },
                  exercise: { type: 'dynamicObject', label: t('editor_cp_exercise'),
                          showWhen: { field: '_blockType', value: 'exercise' },
                          selector: '_exerciseLibrary', schemas: CP_EXERCISE_SCHEMAS /* RÉUTILISER ceux de CP */ }
                } } } } ]},
      { id: 'options', title: t('editor_ib_section_options'), startCollapsed: true, compact: true, fields: [
          { key: 'baseColor', type: 'color', label: t('editor_ib_base_color') },
          { key: 'showTableOfContents', type: 'checkbox', default: true, inline: true, label: t('editor_ib_toc') },
          { key: 'displaySummary', type: 'checkbox', default: true, inline: true, label: t('editor_ib_summary') },
      ]}
    ],
    normalizeOnLoad: true, denormalizeOnSave: true
  };
```

> **Réutilisation maximale** : `CP_EXERCISE_SCHEMAS`, les options `editor_cp_ex_*`, `editor_cp_table_*` et les widgets `color`/`image`/`object`/`dynamicObject`/`select` existent déjà (confirmé). Factoriser `CP_EXERCISE_SCHEMAS` dans un module partagé `js/editor/shared-exercise-schemas.js` consommé par CP **et** IB.

### 8.5. Normalisation / dénormalisation

**`normalizeDataForEditor` (vers ligne ~2882)** — pour chaque bloc `exercise` : extraire `exercise.library` → `_blockType:'exercise'` + `_exerciseLibrary`. Inférer `_blockType` des autres blocs (`text`/`table`/`image`). Appliquer la transformation DragQuestion `correctElements → zoneIndices` (réutiliser le helper de CP).

**`denormalizeDataForSave` (vers ligne ~3044)** — inverse : réinjecter `_exerciseLibrary → exercise.library`, `zoneIndices → correctElements`, retirer les champs `_blockType`/clés vides hors du `type` du bloc, supprimer les blocs incohérents.

> Factoriser les helpers DragQuestion ↔ éditeur partagés entre CP et IB.

### 8.6. Onglet « Aide » de l'éditeur

Créer `assets/templates/editor-help/InteractiveBook.html` (calqué sur `CoursePresentation.html`), avec balises `{{eh_ib_*}}`. Chargé automatiquement par `loadAndShowEditorHelp('InteractiveBook', …)` (`field-renderers.js`) — **aucun code JS à modifier**, seulement le template + les clés `eh_ib_*` (§7.5). Sections : description, chapitres & blocs, types d'exercices, options, bon/mauvais exemple.

### 8.7. Validation des champs — `validators.js` (vers ligne ~841)

```javascript
if (moduleKey === 'InteractiveBook') {
    if (!Array.isArray(data.chapters) || data.chapters.length < 2)
        errors.push({ path: 'chapters', field: t('editor_ib_section_chapters'), message: t('validation_ib_min_chapters') });
    else data.chapters.forEach((ch, i) => {
        if (!ch.title?.trim())
            errors.push({ path: `chapters.${i}.title`, field: `${t('editor_ib_chapter')} ${i+1}`, message: t('validation_ib_no_chapter_title') });
        if (!Array.isArray(ch.content) || ch.content.length === 0)
            errors.push({ path: `chapters.${i}.content`, field: `${t('editor_ib_chapter')} ${i+1}`, message: t('validation_ib_empty_chapter') });
        (ch.content || []).forEach((b, j) => {
            if (b._blockType === 'exercise' && !(b._exerciseLibrary || b.library))
                errors.push({ path: `chapters.${i}.content.${j}`, field: `${t('editor_ib_block')} ${j+1}`, message: t('validation_ib_no_exercise_lib') });
        });
    });
}
```

### 8.8. `field-constraints.js` (vers ligne ~258, à côté de CoursePresentation)

```javascript
'InteractiveBook': {
    platform: 'H5P',
    machineName: 'H5P.InteractiveBook',
    container: true,
    fields: {
        'title':                              { render: 'plain' },
        'cover.description':                  { render: 'html+latex' },
        'chapters[].title':                   { render: 'plain' },
        'chapters[].content[].text':          { render: 'html+latex' },
        'chapters[].content[].table.headers[]': { render: 'html+latex' },
        'chapters[].content[].table.rows[][]':  { render: 'html+latex' },
        'chapters[].content[].alt':           { render: 'plain' }
        // chapters[].content[].exercise.* → délégué au processeur enfant selon library
    }
}
```

### 8.9. Tests e2e éditeur

`tests/test-editor-ib.html` + `tests/test-editor-ib.js` : détection, schéma 2 niveaux d'array, injection des 2 exemples, normalize↔denormalize idempotent, ajout/suppression chapitre & bloc, changement de `_blockType`, préservation LaTeX, robustesse (chapitre vide, library inconnue).

### 8.10. Validation Phase 6

- [ ] Détection « InteractiveBook »
- [ ] Chapitres listés (ajout/suppression/réordonnancement)
- [ ] Blocs imbriqués éditables, `_blockType` affiche/masque les bons champs
- [ ] Exercices intégrés éditables
- [ ] Sauvegarde régénère un `.h5p` valide
- [ ] Onglet Aide présent et complet
- [ ] Tests e2e verts

---

## 9. Phase 7 — Export document (DOCX / ODT / PDF)

### 9.1. `js/export/document-formatter.js`

#### Registre (ligne ~64)

```javascript
'InteractiveBook': formatInteractiveBook,
```

#### Fonction (à côté de `formatCoursePresentation`, ligne ~3517)

```javascript
function formatInteractiveBook(data) {
    const sections = [];
    const title = data.title || t('h5p_interactive_book_name');

    // PARTIE 1 — SUPPORT (élève) : énoncés sans réponses
    sections.push({ type: 'header', level: 1, text: title });
    if (data.cover?.description) sections.push({ type: 'paragraph', text: data.cover.description, style: 'subtitle' });

    (data.chapters || []).forEach((ch, ci) => {
        sections.push({ type: 'header', level: 2, text: ch.title || `Chapitre ${ci + 1}` });
        (ch.content || []).forEach(b => {
            const type = b._blockType || b.type;
            if (type === 'text' && b.text) sections.push({ type: 'paragraph', text: b.text });
            else if (type === 'table' && b.table) sections.push({ type: 'table', rows: [b.table.headers, ...b.table.rows] });
            else if (type === 'exercise') formatExerciseStatement({ ...b, library: b._exerciseLibrary || b.library }, sections);
            // image : ignorée à l'export texte (ou alt en légende)
        });
        sections.push({ type: 'separator' });
    });

    // PARTIE 2 — CORRECTION (enseignant)
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 1, text: `${title} — ${t('doc_fmt_correction') || 'Correction'}` });
    (data.chapters || []).forEach((ch, ci) => {
        const exos = (ch.content || []).filter(b => (b._blockType || b.type) === 'exercise');
        if (!exos.length) return;
        sections.push({ type: 'header', level: 2, text: ch.title || `Chapitre ${ci + 1}` });
        exos.forEach(b => formatExerciseCorrection({ ...b, library: b._exerciseLibrary || b.library }, sections));
    });
    return { title, sections };
}
```

> Réutiliser les dispatchers `formatExerciseStatement()` / `formatExerciseCorrection()` **déjà créés pour CoursePresentation** (lignes ~3647 et ~3729). Aucun nouveau formateur d'exercice.

### 9.2. Validation Phase 7

- [ ] DOCX : chapitres en titres niveau 2, blocs dans l'ordre
- [ ] Partie 1 (énoncés) + Partie 2 (correction)
- [ ] Tableaux formatés, LaTeX → Unicode (PDF) / OMML (DOCX) / MathML (ODT)
- [ ] ODT et PDF cohérents

---

## 10. Phase 8 — Assets visuels

- [x] Icône fournie : `assets/images/activities/interactive-book-icon.webp` (présente, WebP).
- [ ] Vérifier lisibilité en petit/grand format dans la grille (cohérence avec les autres tuiles).

---

## 11. Phase 9 — Librairies H5P vendor

| Librairie | Version | Statut |
|---|---|---|
| `H5P.InteractiveBook-1.11` | 1.11.3 | ✅ Présent |
| `H5P.Column-1.18` | 1.18 | ✅ Présent |
| `FontAwesome-4.5`, `H5P.JoubelUI-1.3` | — | ✅ |
| `H5P.AdvancedText-1.1`, `H5P.Table-1.2`, `H5P.Image-1.1` | — | ✅ |
| Les 9 libs d'exercices + sous-dépendances + `H5P.MathDisplay-1.0` | — | ✅ (déjà utilisées par CoursePresentation) |

> **Aucune librairie à télécharger.** Vérifier que `H5P.InteractiveBook-1.11/library.json` déclare bien `coreApi 1.27` (OK) et que `dist/` contient JS+CSS (OK).

---

## 12. Phase 10 — Intégration Caramelia (chatbot)

`js/caramelia/config.js` — 4 emplacements :

```javascript
// A) categories (text ou quiz)
text: { keys: [ …, 'InteractiveBook' ] },
// B) listes
allModuleKeys: [ …, 'InteractiveBook' ],
h5pKeys: [ …, 'InteractiveBook' ],
// C) mapping → i18n
InteractiveBook: { caramelKey: 'h5p_interactive_book_name', platform: 'h5p' },
// D) fuzzy matching
'livre':'InteractiveBook','livre interactif':'InteractiveBook','book':'InteractiveBook',
'interactive book':'InteractiveBook','chapitre':'InteractiveBook','chapitres':'InteractiveBook',
'manuel':'InteractiveBook',
```

> ⚠️ `'livre'` pourrait entrer en collision avec le module **Moodle « Livre »** (`elea_livre`). Vérifier la résolution fuzzy et préférer `'livre interactif'` / `'livre h5p'` pour désambiguïser.

---

## 13. Phase 11 — Intégration RAG Caramelia (tutoriels chatbot)

1. **Source** : créer `rag/caramelia/sources/01-activites-h5p/interactive-book.md` (frontmatter YAML : `referentiel: caramelia, code: h5p-interactive-book, titre, lang, categorie: activite-h5p, machineName: H5P.InteractiveBook, version: 1.0.0` + description pédagogique, quand l'utiliser, structure, bonnes pratiques).
2. **Chunks 11 langues** : `rag/caramelia/chunks/<lang>/h5p-interactive-book.md` (nommage ILaaS `<lang>__h5p-interactive-book`).
3. **Ingestion** : `node rag/ingest-caramelia.mjs` — **piège** (cf. CLAUDE.md) : le skip ne pagine pas (limit=100) ; pour un ajout ciblé, préférer un INGEST individuel par langue (DELETE + INGEST si remplacement). Voir mémoire `reference_rag_ilaas_caramelia.md`.

---

## 14. Phase 12 — Synchronisation Sucrerie

> Caramel = source de vérité. Dépôt Sucrerie : `/Users/egaunard/Desktop/Forge/sucrerie.forge.apps.education.fr`. **À faire APRÈS la validation Caramel.**

| # | Fichier Sucrerie | Action |
|---|---|---|
| 1 | `assets/js/core/activity-types.js` (`CARAMEL_H5P`) | Ajouter `'H5P.InteractiveBook': { source:'caramel', family:'h5p', nameKey:'activity_h5p_interactive_book', nameFallback:'Livre interactif', icon:\`${ICON_BASE}/interactive-book-icon.webp\`, categories:['text','quiz'] }`. La whitelist `supported-types.js` suit **automatiquement**. |
| 2 | `assets/js/h5p-export-bridge.js` (`H5P_LIBRARY_TO_MODULE_KEY`) | Ajouter `'H5P.InteractiveBook':'InteractiveBook'` (sinon le test anti-dérive `tests/deposit/test-deposit-validation.js` échoue). |
| 3 | `assets/js/editor/content-detector.js` | **Copier** depuis Caramel (byte-identique) après MAJ. ⚠️ Vérifier zéro dépendance Caramel-spécifique (pas d'import `json-healer.js`). |
| 4 | `assets/js/h5p/field-constraints.js` | **Copier** depuis Caramel (byte-identique). |
| 5 | `assets/js/editor/*` (array-manager si étendu) | Si Phase 6 a modifié `array-manager.js` → re-propager les 10 fichiers `js/editor/` partagés (cf. CLAUDE.md item 7 + `scripts/diff-editor-vs-caramel.mjs`). |
| 6 | `i18n/*.json` (11 fichiers) | Ajouter `activity_h5p_interactive_book` (+ description) dans les 11 locales. |
| 7 | Icône `assets/.../interactive-book-icon.webp` | Copier l'icône. |
| 8 | `vendor/h5p-libs/H5P.InteractiveBook-*` | ✅ Déjà présent (1.3→1.11) — rien à faire pour la preview. |
| 9 | `tests/deposit/test-deposit-validation.js` | Lancer → doit passer (cohérence whitelist ↔ export auto-vérifiée). |

---

## 15. Phase 13 — Tests

- [ ] `test-definitions.js` (entrée complète, IDs uniques, image existe, processeur existe, ≥1 exemple)
- [ ] Pipeline : 2 exemples → healer → processeur → `.h5p` valide
- [ ] Chacun des 9 sous-types d'exercice dans un chapitre
- [ ] Cas limites : chapitre 1 bloc ; chapitre multi-blocs ; chapitre multi-exercices ; sans couverture ; avec couverture
- [ ] Robustesse : `chapters` vide → healer reconstruit ; `content` à plat → blocs inférés ; library inconnue → fallback texte ; chapitre vide → bloc texte injecté (jamais filtré par le player)
- [ ] `verify-all-locales.mjs` + `verify-locale-latex.mjs`
- [ ] Tests e2e éditeur (`test-editor-ib.html`)

---

## 16. Phase 14 — Cas spéciaux

### 16.1. Extensibilité « tout ce que H5P permet »

Le `H5P.Column 1.18` accepte 33 types (cf. `semantics.json`). V1 expose les 12 blocs IA-générables. Pour en ajouter (Accordion, ImageHotspots, Chart…), il suffit d'étendre `LIBRARY_MAP` + l'enum `_blockType` de l'éditeur + le prompt — **sans toucher l'architecture**. À traiter en chantiers incrémentaux dédiés.

### 16.2. MathDisplay conditionnel

Détecter `\(`, `\)`, `\[`, `\]`, `$…$` dans le `content` sérialisé → ajouter `H5P.MathDisplay 1.0` aux dépendances (identique CP). Sinon l'omettre.

### 16.3. Page de couverture média

V1 : couverture **texte seule** (`coverDescription`). Le `coverMedium` (image/vidéo) est branché quand le support image utilisateur arrive (skill `caramel-add-image-support`).

### 16.4. Pas de sous-question QuizSet

InteractiveBook est un conteneur de **niveau supérieur** (comme CP/QuizSet), pas un sous-type → pas de `transformForQuizSet()`.

### 16.5. Ordre significatif

Chapitres et blocs ont un ordre pédagogique → traitement séquentiel, pas de mélange.

---

## 17. Checklist de validation finale

**Fonctionnel** — [ ] Tuile · [ ] Prompt multi-chapitres · [ ] Génération 1-clic · [ ] Healing · [ ] `.h5p` ouvre preview+Lumi+Éléa · [ ] TOC · [ ] Chapitres riches · [ ] 9 exercices · [ ] Résumé agrège scores · [ ] Couverture · [ ] Éditeur (chapitres+blocs) · [ ] DOCX/ODT/PDF (énoncé+correction) · [ ] Aide `?` + onglet Aide éditeur · [ ] 11 langues.

**Technique** — [ ] Tests verts · [ ] `?debug` logs · [ ] LaTeX (MathDisplay conditionnel) · [ ] Pas de régression perf.

**Synchro** — [ ] Caramelia (config + RAG) · [ ] Sucrerie (9 points Phase 12) · [ ] Tutoriel onboarding.

**Doc** — [ ] CHANGELOG (cf. skill `caramel-release`) · [ ] Wiki/README (23 types H5P).

---

## Annexe A — JSON simplifié IA (entrée)

```json
{
  "title": "Le système solaire",
  "cover": {
    "description": "Un voyage interactif à travers les huit planètes de notre système solaire."
  },
  "baseColor": "#1768c4",
  "showTableOfContents": true,
  "displaySummary": true,
  "chapters": [
    {
      "title": "Introduction",
      "content": [
        { "type": "text", "text": "Le **système solaire** s'est formé il y a environ *4,6 milliards d'années*. Il comprend le Soleil et huit planètes." },
        { "type": "table", "tableStyle": "default", "table": {
            "headers": ["Planète", "Type", "Lunes"],
            "rows": [["Mercure","Tellurique","0"],["Terre","Tellurique","1"],["Jupiter","Gazeuse","95"]] } },
        { "type": "exercise", "library": "H5P.MultiChoice 1.16",
          "question": "Combien de planètes compte le système solaire ?",
          "answers": [
            { "text": "Huit", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exact !" } },
            { "text": "Neuf", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Pluton est une planète naine depuis 2006." } },
            { "text": "Sept", "correct": false } ],
          "behaviour": { "singleAnswer": true } }
      ]
    },
    {
      "title": "Les planètes telluriques",
      "content": [
        { "type": "text", "text": "Les planètes **telluriques** (Mercure, Vénus, Terre, Mars) sont rocheuses et proches du Soleil." },
        { "type": "exercise", "library": "H5P.Blanks 1.14",
          "taskDescription": "Complétez la phrase.",
          "questions": ["La planète la plus proche du Soleil est *Mercure*."] },
        { "type": "exercise", "library": "H5P.TrueFalse 1.8",
          "question": "Mars est surnommée la planète rouge.",
          "correct": "true",
          "feedbackOnCorrect": "Bravo !", "feedbackOnWrong": "Si, à cause de l'oxyde de fer à sa surface." }
      ]
    },
    {
      "title": "Synthèse",
      "content": [
        { "type": "exercise", "library": "H5P.Summary 1.10",
          "intro": "Choisissez les affirmations correctes.",
          "summaries": [ { "summary": [
            "La Terre possède une lune",
            "La Terre possède deux lunes",
            "La Terre ne possède aucune lune" ] } ] }
      ]
    }
  ]
}
```

> Aucune coordonnée, aucun UUID, aucune library string interne : le processeur s'en charge. ~600–1000 tokens pour un livre de 3–4 chapitres riches.

---

## Annexe B — Fichiers touchés (récapitulatif)

| # | Fichier | Action | Phase |
|---|---|---|---|
| 1 | `js/core/definitions.js` | `h5pModules` + `customOrder` | 1 |
| 2 | `js/core/translation.js` | `defaultTranslations` | 1 |
| 3 | `js/h5p/processors/InteractiveBook.js` | **Créer** (async, blocs Column) | 2 |
| 4 | `js/h5p/processors/index.js` | metadata + loader + libraryToKey | 2 |
| 5 | `js/h5p/json-healer.js` | versions + module key + healing structurel/LaTeX | 3 |
| 6 | `assets/data/prompts/interactive_book.md` | **Créer** | 4 |
| 7-8 | `assets/data/examples/interactive_book_{1,2}.json` | **Créer** | 4 |
| 9 | `js/services/prompt-generator.js` | `ACTIVITY_CONFIG` | 4 |
| 10 | `js/services/llm.js` | override commenté | 4 |
| 11-21 | `js/locales/{11}.json` | ~111 clés/langue | 5 |
| 22 | `js/editor/content-detector.js` | signature + mappings + schéma 2-array + normalize/denormalize | 6 |
| 23 | `js/editor/array-manager.js` | **étendre si** array imbriqué non supporté | 6 |
| 24 | `js/editor/shared-exercise-schemas.js` | **Créer** (factoriser `CP_EXERCISE_SCHEMAS`) | 6 |
| 25 | `js/editor/validators.js` | règles IB | 6 |
| 26 | `js/h5p/field-constraints.js` | entrée `InteractiveBook` | 6 |
| 27 | `assets/templates/editor-help/InteractiveBook.html` | **Créer** | 6 |
| 28 | `tests/test-editor-ib.{html,js}` | **Créer** | 6 |
| 29 | `js/export/document-formatter.js` | `formatInteractiveBook` + registre | 7 |
| 30 | `js/caramelia/config.js` | 4 emplacements | 10 |
| 31 | `rag/caramelia/sources/01-activites-h5p/interactive-book.md` | **Créer** | 11 |
| 32-42 | `rag/caramelia/chunks/<lang>/h5p-interactive-book.md` | **Créer** (11) | 11 |
| 43+ | Sucrerie (9 points) | Synchro post-validation | 12 |

**Estimation d'effort** : processeur (~250–350 l, plus simple que CP car sans layout) · éditeur (le gros morceau : array imbriqué) · traductions (~111 clés × 11) · reste réutilisé de CoursePresentation.

---

> **Prêt pour implémentation.** Ordre conseillé : Phase 1 + 2 (enregistrement + processeur, tester le `.h5p` tôt) → Phase 3 (healer) → Phase 4 (prompt/exemples) → Phase 5 (i18n) → **Phase 6 (éditeur — valider d'abord l'array imbriqué)** → Phase 7 (export) → 8–14 en parallèle. **Réutiliser systématiquement le code CoursePresentation** (table, exercices, DragQuestion editor, dispatchers export).
