# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Caramel** is a 100% client-side web application (v5.1.0) for generating H5P and Moodle/Éléa educational activities using AI. Built for French teachers, it creates interactive content packages (.h5p, .mbz) directly in the browser without any server-side processing of pedagogical data.

**Key characteristics:**
- Pure frontend JavaScript (ES6 modules), no build system, no npm
- AI integration via n8n proxy to ILaaS (French sovereign AI infrastructure)
- Static file serving only — works with `python -m http.server`
- 11-language internationalization support
- All file packaging (ZIP, TAR, GZIP) happens client-side

## Running Locally

```bash
python3 -m http.server 8000
# Access at http://localhost:8000
```

No npm install, no build step required. The app loads ES6 modules directly.

### Debug Mode

Append `?debug` to the URL to enable:
- Detailed logs in console (`[DEBUG][module]` format via `debugLog()` in `utils.js`)
- Raw JSON, healed JSON, and diff display in the generation modal
- Editor state logging

## Architecture

### Entry Point & Initialization Order

`js/main.js` — Initializes all modules on DOMContentLoaded in this sequence:

1. `setupFilters()` — Filter controls
2. `generateTiles()` — Activity grid (French defaults before full i18n load)
3. `setupEventListeners()` — Global event handlers
4. `initLanguageSwitcher()` — Language selector
5. Notification system (center, dropdown, toasts, preview, emergency, result modal)
6. `initOcr()` — Document text extraction
7. `initCaramelAnimationEffects()` — Animations
8. `initSmartPreloading()` — Lazy-load vendor libs during idle time
9. `loadTranslations('fr')` — Full language file
10. `initVersionChecker()` — Version check

### Directory Structure

**JavaScript Modules (`js/`):**
- `core/` — Fundamental modules: `definitions.js` (activity registry), `lib-loader.js` (lazy loading), `perf-tracker.js` (pipeline performance tracking), `translation.js` (i18n), `utils.js` (debug, error classification, helpers)
- `services/` — Business logic: `llm.js` (AI communication), `ocr.js` (text extraction), `prompt-generator.js` (prompt building)
- `ui/` — User interface: `ui.js` (tiles, tabs, modals), `notifications.js` (toasts, history), `animations.js`, `version-checker.js`, `emergency-notification.js`
- `h5p/` — H5P ecosystem: `h5p-creator.js` (ZIP packaging), `h5p-manager.js` (preview), `h5p-prefetch.js` (H5P library preloading), `json-healer.js` (AI output repair), `field-constraints.js` (per-field render type constraints for 27 activities), `image-manager.js` (image processing, resize, registry for 12 activities), `processors/` (21 type-specific processors)
- `moodle/` — Moodle/Éléa ecosystem: `moodle-creator.js` (MBZ packaging), `moodle-formats.js` (XML/GIFT), `page-themes.js` (theme registry), `page-themes/` (4 visual themes), `processors/` (7 activity processors + shared utilities)
- `renderers/` — Rendering: `chart-renderer.js`, `math-renderer.js`, `image-utils.js`, `crossword-grid-capture.js`, `crossword-grid-generator.js` (standalone grid), `find-the-words-grid-capture.js`, `find-the-words-grid-generator.js` (standalone grid)
- `export/` — Document export: `document-exporter.js` (DOCX/ODT/PDF), `document-formatter.js` (content formatting), `sanitizer.js` (DOMPurify), `latex-parser.js` (LaTeX→AST), `math-catalog.js` (170+ symboles LaTeX/Unicode/MathML/StarMath), `latex-to-omml.js` (AST→OMML pour DOCX), `latex-to-mathml.js` (AST→MathML pour ODT)
- `editor/` — Visual JSON editor (8 files, see JSON Editor System section)
- `locales/` — 11 JSON language files (fr, en, es, de, it, nl, pt, ar, zh, jp, el)
- `vendor/` — External libraries (versioned paths)

**CSS (`css/`):**
- `vendor/` — FontAwesome, flag-icons
- `base/` — Global styles (style.css, custom.css)
- `components/` — Modular components (json-editor, llm, modals)

**Assets (`assets/`):**
- `data/examples/` — Sample JSON outputs per activity
- `data/prompts/` — Markdown prompt templates per activity
- `images/` — Organized: activities/, branding/, tutorials/, wiki/
- `flags/`, `fonts/`, `templates/`

**Scripts (`scripts/`):**
- `update-locale-latex.mjs` — Propagates LaTeX constraints into all 11 locale files (286 keys)
- `verify-all-locales.mjs` — Verifies LaTeX/Unicode/plain constraints across all locales
- `translate-course-presentation.mjs` — Translates Course Presentation prompts (Latin-script languages)
- `translate-cp-{ar,zh,jp,el}.mjs` — Translates Course Presentation prompts (non-Latin scripts)

## Core Systems

### Activity Definitions (`core/definitions.js`)

Central registry of all activities. Each entry has:

```javascript
{
  name: "translation_key",              // Display name (i18n key)
  englishName: "English name",
  machineName: "H5P.TypeName",          // H5P/Moodle identifier
  description: "desc_translation_key",
  image: "assets/images/activities/...",
  promptId: "resultId",                 // AI result container ID
  jsonInputId: "inputId",              // Manual JSON editor input ID
  createBtnId: "buttonId",
  categories: ["quiz", "memory", ...],  // Filtering categories
  platforms: ["Éléa", "Magistère", ...],
  formats: ["H5P", "DOCX", "ODT", ...],
  hidden: boolean                       // Optional
}
```

`customOrder` array controls tile display order. Two registries: `h5pModules` (21 types) and `moodleModules` (8 types).

### Content Generation Pipeline

**H5P Creation:**
```
definitions.js → prompt-generator.js → llm.js → json-healer.js → h5p-processors/*.js → h5p-creator.js → .h5p download
                                                                                          ↑ image-manager.js (optional user images)
```

**Moodle Creation:**
```
definitions.js → prompt-generator.js → llm.js → moodle-processors/*.js → moodle-creator.js → .mbz download
```

**Document Export (DOCX/ODT/PDF) — Math Formula Pipeline:**
```
document-formatter.js (keepLatex:true) → document-exporter.js
    ├─ DOCX: latex-parser.js → latex-to-omml.js → docx.js Math objects (editable in Word)
    ├─ ODT:  latex-parser.js → latex-to-mathml.js → MathML objects + StarMath annotation (editable in LibreOffice)
    └─ PDF:  postProcessLatex → latexToUnicode → Unicode text (no native math)
```

Shared modules: `latex-parser.js` (LaTeX→AST), `math-catalog.js` (177 symbols: Unicode + MathML type + StarMath).

### H5P Processor System (`h5p/processors/`)

`index.js` — Router with double mapping:
- `processors`: moduleKey → processor module
- `libraryToKey`: H5P machineName → moduleKey (reverse lookup for QuizSet recursion)

Each of the 21 processor files exports:
- `machineName` — H5P library identifier (e.g., `"H5P.Timeline"`)
- `version` — Processor version string
- `extraDependencies` — Additional H5P libraries needed
- `default.process(jsonObj, helpers)` — Main transformation function
- `default.transformForQuizSet()` — Optional: specialized QuizSet sub-question handling

**H5P types:** Timeline, Flashcards, QuizSet (+ QuizSetQCM, QuizSetVF), Glossary, Crossword, Essay, Summary, DragTheWords, DragAndDrop, FillInTheBlanks, ComplexFillTheBlanks, MarkTheWords, TrueFalse, MultipleChoice, FindTheWords, SortParagraphs, SingleChoiceSet, DialogCards, Chart, CoursePresentation

### Moodle Processor System (`moodle/processors/`)

`index.js` — API: `getActivityFiles(activityKey, data, options)` returns `{ filePath: fileContent }` with zero network calls.

Uses placeholder system: `ACTIVITY_TITLE`, `COURSE_ID`, `MODULE_ID`, `TIMESTAMP`, etc. generated by `generateBaseData(title)`.

**Activity processors (7):** Appariement, QCM, Page, Millionnaire, Test, Glossaire, Devoir
**Shared utilities:** `moodle-backup.js`, `placeholder.js`, `templates.js`

### JSON Editor System (`editor/`)

Visual editor integrated into the generation modal. Allows modification of H5P and Moodle activity content before download.

| File | Role |
|------|------|
| `index.js` | Orchestrator — lifecycle, modal integration, public API (`initJsonEditor`) |
| `editor-core.js` | Core rendering — `renderEditor()`, state management |
| `content-detector.js` | Content type detection — schema definitions, H5P/Moodle signatures (~86 KB) |
| `field-renderers.js` | Field UI — input types, HTML generation (~51 KB) |
| `array-manager.js` | Array fields — add/remove/reorder items (~49 KB) |
| `validators.js` | Input validation — type-specific rules (~32 KB) |
| `feedback-editor.js` | Feedback UI — FeedbackEditor class |
| `json-utils.js` | Utilities — `getNestedValue()`, `setNestedValue()` |
| `richtext-editor.js` | WYSIWYG editor — contenteditable, toolbar, LaTeX protection, Markdown conversion |
| `formula-assistant.js` | Math formula modal — 6 categories, MathJax live preview |

**Rich Text Editor** (`richtext-editor.js`): Lightweight WYSIWYG for `textarea` fields with `html+latex`, `html`, or `unicode+markers` render type. Features:
- Contextual toolbar (bold, italic, underline, strikethrough, sup/sub, color, lists, link, math formula)
- Source code toggle (`</>` button)
- LaTeX protection: formulas wrapped in `<span contenteditable="false" data-latex="...">` for safe editing
- Double-click on formula → opens formula assistant modal pre-filled
- Markdown round-trip: displays `**bold**` as visual bold, reconverts on save
- `field-constraints.js` is the single source of truth for which fields get richtext
- Only `textarea` fields get richtext (not `text` inputs — too short for WYSIWYG)
- Éléa modules use `elea_*` keys as moduleKey — aliased in field-constraints.js

**CSS**: `css/components/richtext-editor.css` — Apple-inspired design matching `json-editor.css`

Global state in `editorState` object: `isActive`, `originalData`, `currentData`, `contentType`, `moduleKey`, `hasChanges`, `validationErrors`.

### Image System (`h5p/image-manager.js`)

Client-side image support for 12 H5P activities. All processing (resize, compress, register) happens in the browser via Canvas API.

**Image-capable activities:**
- **Per-item images:** Flashcards (`cards[].image`), DialogCards (`dialogs[].image`), DragAndDrop elements (`elements[].image`)
- **Background images:** DragAndDrop (`backgroundImage`), Crossword (`backgroundImage`)
- **Media context images:** MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords (`mediaImage` → `buildMediaStructure()`)
- **Slide images:** CoursePresentation (`slideImage` with position selector: left/right/top/bottom, 24 layouts)
- **Timeline:** Toggle URL/Image for cover (`coverImage`) and events (`eventImage`), converted to `asset.media` string by processor

**Pipeline:** `renderImageField()` (editor) → `processImage()` (resize to 800×600, JPEG 0.85) → `registerImage()` (Map registry) → `createH5PBlob()` (inject into ZIP as `content/images/`) → `clearAllImages()` (cleanup)

**Preview:** `_embedImagesAsDataUrls()` in `h5p-manager.js` converts `images/...` paths to `data:` URLs in content.json. Requires patched `frame.bundle.js` (see Patch section).

**Export:** `document-formatter.js` uses `getMediaImageUrl()` to extract image URLs/dataURLs. `document-exporter.js` uses `prepareImageData()` to resolve 3 cases: data URL, relative path (from registry), HTTP URL.

**Editor field types for images:**
- `image` — Full upload widget with drag & drop, preview, alt text, optional `collapsible` and `selectField` modes
- `toggle` — Segmented control (e.g., URL vs Image for Timeline), emits `change` event on hidden input for `showWhen` compatibility
- `fieldGroup` — Visual-only collapsible wrapper in array items, groups sub-fields without path namespacing

### Error Handling Patterns (`core/utils.js`)

Four error categories via `classifyError(error)`:

| Category | Trigger | User Message Key |
|----------|---------|-----------------|
| `PARSE_ERROR` | SyntaxError, JSON parsing failure | `error_parse` |
| `NETWORK_ERROR` | Timeout, fetch failure, NetworkError | `error_network` |
| `VALIDATION_ERROR` | Missing required fields, invalid structure | `error_validation` |
| `PACKAGING_ERROR` | H5P/MBZ creation failure (default) | `error_packaging` |

Returns `{ category, userMessageKey, technicalMessage }`. User messages are i18n keys resolved at display time.

**JSON Healer** (`h5p/json-healer.js`): Auto-repairs AI output — fixes LaTeX backslashes, wraps in `params`, corrects H5P library versions, adds missing UUIDs. Runs between LLM response and processor.

**Field Constraints** (`h5p/field-constraints.js`): Central registry of per-field rendering constraints for all 27 H5P activities (99 fields total). Six render types:
- `html+latex` — Full HTML with MathJax LaTeX `\(...\)` (e.g., questions, taskDescription)
- `html` — HTML without LaTeX support (e.g., some feedback fields)
- `unicode` — Unicode math symbols only, no HTML/LaTeX (e.g., Chart labels, Millionnaire)
- `unicode+markers` — Unicode with H5P-specific markers like `*...*` (e.g., DragTheWords, MarkTheWords)
- `plain` — Plain text, no formatting (e.g., some metadata fields)
- `plain+letters` — Letters-only plain text (e.g., crossword answers, FindTheWords wordList)

Used by: `json-healer.js` (field-aware healing), processors (field-specific transforms), tests (validation), `tests/field-constraints-dashboard.html` (interactive visualization).

### Internationalization System (`core/translation.js`)

**How it works:**
1. `defaultTranslations` object provides French defaults for instant tile rendering
2. `loadTranslations(langCode)` fetches `js/locales/{lang}.json` via `fetch()`
3. `translatePage()` applies translations to all DOM elements with `data-key` attributes
4. `t(key)` function for programmatic translation lookup

**Language files:** 11 JSON files in `js/locales/` — fr, en, es, de, it, nl, pt, ar, zh, jp, el. Each contains ~2034 keys organized in 170+ sections.

**Translation keys convention:** `{scope}_{element}_{detail}` (e.g., `h5p_timeline_name`, `tab_quiz`, `error_parse`)

### AI Integration (`services/llm.js`)

**Endpoint:** `https://n8n.incubateur.education.gouv.fr/webhook/llmdev2` — n8n proxy, API keys server-side only.

**Available models:**
| Model ID | Display Name | Size |
|----------|-------------|------|
| `mistral-small-3.2-24b` | Mistral-Small-3.2 | small (default) |
| `qwen-3.5-35b-instruct` | Qwen 3.5 | large |
| `gpt-oss-120b` | GPT-OSS | xl |
| `llama-3.3-70b` | LLaMa-3.3 | large |
| `llama-3.1-8b` | LLaMa-3.1-8B | small |
| `gemma-4-31b` | Gemma 4 | large |
| `mistral-medium-250523` | Mistral Medium | large |

**Activity-specific overrides:** QuizSetQCM, QuizSetVF, QuizSet, Page, test_elea → `gpt-oss-120b`

### External Libraries (`core/lib-loader.js`)

Centralized in `LIB_PATHS`, versioned paths, lazy-loaded via `initSmartPreloading()` during `requestIdleCallback`.

| Library | Version | Purpose |
|---------|---------|---------|
| pdf.js | 5.6.205 | PDF text extraction (OCR) |
| Tesseract.js | 7.0.0 | Image OCR |
| Mammoth | 1.11.0 | DOCX text extraction |
| JSZip | 3.10.1 | ZIP creation for .h5p |
| client-zip | 2.5.0 | Streaming ZIP |
| h5p-standalone | 3.8.2 | H5P preview player (**PATCHÉ** — voir ci-dessous) |
| fflate | 0.8.2 | GZIP compression for .mbz |
| tar-js | 0.3.0 | TAR archives for Moodle |
| MathJax | 3.2.2 | Math rendering (LaTeX → SVG) |
| jsPDF | 4.2.0 | PDF export |
| jsPDF-AutoTable | 5.0.7 | PDF tables |
| docx | 8.5.0 | DOCX export |
| DOMPurify | 3.3.3 | HTML sanitization |
| Liberation Sans | — | Font for PDF/ODT exports |

### Patch h5p-standalone (frame.bundle.js)

**⚠️ CRITIQUE — À réappliquer lors de toute mise à jour de h5p-standalone ⚠️**

Le fichier `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` a été patché pour que `H5P.getPath()` reconnaisse les `data:` URLs comme des URLs absolues. Sans ce patch, les images embarquées en base64 dans `content.json` sont préfixées par le chemin du contenu, ce qui casse leur affichage dans la preview.

| Élément | Valeur |
|---------|--------|
| Regex originale | `/^[a-z0-9]+:\/\//i` |
| Regex patchée | `/^([a-z0-9]+:\/\/|data:)/i` |
| Fichier | `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` |
| Lié à | `js/h5p/h5p-manager.js` → `_embedImagesAsDataUrls()` |

**Contexte :** L'iframe H5P charge les images via des balises `<img src="...">` qui font des requêtes HTTP directes, contournant l'intercepteur `fetch()` de Caramel. La solution : les chemins d'images dans `content.json` sont remplacés par des `data:` URLs au moment du fetch, et le patch permet à `H5P.getPath()` de les retourner telles quelles.

## Adding a New H5P Activity Type

1. Add entry to `h5pModules` in `definitions.js` with all required fields
2. Create processor in `js/h5p/processors/NewType.js`:
   - Export `machineName`, `version`, `extraDependencies`
   - Export `default` object with `process(jsonObj, helpers)` method
   - Optionally export `default.transformForQuizSet()` for QuizSet integration
3. Register in `h5p/processors/index.js`: add to `processors` map and `libraryToKey` map
4. Add prompt template in `assets/data/prompts/`
5. Add sample JSON in `assets/data/examples/`
6. Add H5P library files to `js/vendor/h5p-libs/`
7. Add translations to all 11 JSON files in `js/locales/`

## Adding a New Moodle Activity Type

1. Add entry to `moodleModules` in `definitions.js`
2. Create processor in `js/moodle/processors/activities/NewType.js`:
   - Export `getFiles(data)` returning `{ filePath: fileContent }`
   - Export `metadata` with `moduleName`, `moduleVersion`, `requiredPlaceholders`
3. Register in `moodle/processors/index.js` processors map
4. Add prompt template in `assets/data/prompts/`
5. Add sample JSON in `assets/data/examples/`
6. Add XML templates in shared templates if needed
7. Add translations to all 11 language files

## Conventions

- **JavaScript**: ES6+ modules, no transpilation, no build step
- **CSS**: BEM-like naming, CSS variables for theming
- **Translations**: All UI text uses `data-key` attributes, keys in `js/locales/*.json`
- **Comments**: All code comments in **French**
- **Commits**: French commit messages
- **File organization**: One processor file per H5P/Moodle activity type
- **Session storage**: `caramel_` prefix for all sessionStorage keys
- **Tile attributes**: `data-activity-types`, `data-platforms`, `data-module` for filtering

## Important Notes

- API keys are managed server-side by n8n proxy, never exposed in frontend
- All file packaging (ZIP, TAR, GZIP) happens client-side using Web APIs
- The `h5p-libs/` folder contains official H5P library structures that must match H5P semantics
- `json-healer.js` runs automatically between LLM response and processor — never bypass it
- The `?debug` URL parameter enables verbose logging across all modules
