# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Caramel** is a 100% client-side web application (v5.0.1) for generating H5P and Moodle/Éléa educational activities using AI. Built for French teachers, it creates interactive content packages (.h5p, .mbz) directly in the browser without any server-side processing of pedagogical data.

**Key characteristics:**
- Pure frontend JavaScript (ES6 modules), no build system, no npm
- AI integration via n8n proxy to ilaaS (French sovereign AI infrastructure)
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
- `h5p/` — H5P ecosystem: `h5p-creator.js` (ZIP packaging), `h5p-manager.js` (preview), `h5p-prefetch.js` (H5P library preloading), `json-healer.js` (AI output repair), `processors/` (20 type-specific processors)
- `moodle/` — Moodle/Éléa ecosystem: `moodle-creator.js` (MBZ packaging), `moodle-formats.js` (XML/GIFT), `page-themes.js` (theme registry), `page-themes/` (4 visual themes), `processors/` (7 activity processors + shared utilities)
- `renderers/` — Rendering: `chart-renderer.js`, `math-renderer.js`, `image-utils.js`, `crossword-grid-capture.js`, `crossword-grid-generator.js` (standalone grid), `find-the-words-grid-capture.js`, `find-the-words-grid-generator.js` (standalone grid)
- `export/` — Document export: `document-exporter.js` (DOCX/ODT/PDF), `document-formatter.js` (content formatting), `sanitizer.js` (DOMPurify)
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

`customOrder` array controls tile display order. Two registries: `h5pModules` (20 types) and `moodleModules` (8 types).

### Content Generation Pipeline

**H5P Creation:**
```
definitions.js → prompt-generator.js → llm.js → json-healer.js → h5p-processors/*.js → h5p-creator.js → .h5p download
```

**Moodle Creation:**
```
definitions.js → prompt-generator.js → llm.js → moodle-processors/*.js → moodle-creator.js → .mbz download
```

### H5P Processor System (`h5p/processors/`)

`index.js` — Router with double mapping:
- `processors`: moduleKey → processor module
- `libraryToKey`: H5P machineName → moduleKey (reverse lookup for QuizSet recursion)

Each of the 20 processor files exports:
- `machineName` — H5P library identifier (e.g., `"H5P.Timeline"`)
- `version` — Processor version string
- `extraDependencies` — Additional H5P libraries needed
- `default.process(jsonObj, helpers)` — Main transformation function
- `default.transformForQuizSet()` — Optional: specialized QuizSet sub-question handling

**H5P types:** Timeline, Flashcards, QuizSet (+ QuizSetQCM, QuizSetVF), Glossary, Crossword, Essay, Summary, DragTheWords, DragAndDrop, FillInTheBlanks, ComplexFillTheBlanks, MarkTheWords, TrueFalse, MultipleChoice, FindTheWords, SortParagraphs, SingleChoiceSet, DialogCards, Chart

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

Global state in `editorState` object: `isActive`, `originalData`, `currentData`, `contentType`, `moduleKey`, `hasChanges`, `validationErrors`.

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

### Internationalization System (`core/translation.js`)

**How it works:**
1. `defaultTranslations` object provides French defaults for instant tile rendering
2. `loadTranslations(langCode)` fetches `js/locales/{lang}.json` via `fetch()`
3. `translatePage()` applies translations to all DOM elements with `data-key` attributes
4. `t(key)` function for programmatic translation lookup

**Language files:** 11 JSON files in `js/locales/` — fr, en, es, de, it, nl, pt, ar, zh, jp, el. Each contains 1651 keys organized in 156 sections.

**Translation keys convention:** `{scope}_{element}_{detail}` (e.g., `h5p_timeline_name`, `tab_quiz`, `error_parse`)

### AI Integration (`services/llm.js`)

**Endpoint:** `https://n8n.incubateur.education.gouv.fr/webhook/llmdev2` — n8n proxy, API keys server-side only.

**Available models:**
| Model ID | Display Name | Size |
|----------|-------------|------|
| `mistral-small-3.2-24b` | Mistral-Small-3.2 | small (default) |
| `qwen-3-30b` | Qwen 3 30B | large |
| `gpt-oss-120b` | GPT-OSS | xl |
| `llama-3.3-70b` | LLaMa-3.3 | large |
| `llama-3.1-8b` | LLaMa-3.1-8B | small |

**Activity-specific overrides:** QuizSetQCM, QuizSetVF, QuizSet, Page, test_elea → `gpt-oss-120b`

### External Libraries (`core/lib-loader.js`)

Centralized in `LIB_PATHS`, versioned paths, lazy-loaded via `initSmartPreloading()` during `requestIdleCallback`.

| Library | Version | Purpose |
|---------|---------|---------|
| pdf.js | 5.4.624 | PDF text extraction (OCR) |
| Tesseract.js | 7.0.0 | Image OCR |
| Mammoth | 1.11.0 | DOCX text extraction |
| JSZip | 3.10.1 | ZIP creation for .h5p |
| client-zip | 2.5.0 | Streaming ZIP |
| h5p-standalone | 3.8.0 | H5P preview player |
| fflate | 0.8.2 | GZIP compression for .mbz |
| tar-js | 0.3.0 | TAR archives for Moodle |
| MathJax | 3.2.2 | Math rendering (LaTeX → SVG) |
| jsPDF | 4.2.0 | PDF export |
| jsPDF-AutoTable | 5.0.7 | PDF tables |
| docx | 8.5.0 | DOCX export |
| DOMPurify | 3.3.1 | HTML sanitization |
| Liberation Sans | — | Font for PDF/ODT exports |

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
