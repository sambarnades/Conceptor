# CLAUDE.md — Caramel

> Guide compact. Les playbooks détaillés sont des **skills** dans `.claude/skills/` (chargés à la demande). Les références approfondies sont dans `docs/` (PRD, guides).

## Identité

**Caramel** v6.0.0 — webapp 100% client-side qui génère des activités H5P (`.h5p`) et Moodle/Éléa (`.mbz`) via IA pour profs francophones. ES6 modules purs, **aucun build, aucun npm**, servi en statique. Proxy IA n8n (clés API côté serveur). 11 langues. Packaging ZIP/TAR/GZIP côté navigateur.

Lancement local : `python3 -m http.server 8000` → `http://localhost:8000`. Mode debug : `?debug` dans l'URL.

## Pipeline (mémoriser)

```
H5P :    definitions → prompt-generator → llm → json-healer → processors/*.js → h5p-creator → .h5p
Moodle : definitions → prompt-generator → llm → moodle/processors/* → moodle-creator → .mbz
Doc :   document-formatter (keepLatex) → document-exporter
        ├─ DOCX : latex-parser → latex-to-omml → docx.js (math éditable Word)
        ├─ ODT  : latex-parser → latex-to-mathml → MathML + StarMath (éditable LibreOffice)
        └─ PDF  : latexToUnicode (pas de math natif)
```

`json-healer.js` est **obligatoire** entre LLM et processors — ne jamais bypasser.

## Carte des dossiers

```
js/core/         definitions.js (registre), translation.js (i18n), utils.js (debugLog, classifyError), lib-loader.js, perf-tracker.js
js/services/     llm.js (n8n), ocr.js, prompt-generator.js
js/ui/           ui.js, notifications.js, animations.js, version-checker.js, emergency-notification.js
js/h5p/          h5p-creator.js, h5p-manager.js (preview), json-healer.js, field-constraints.js, image-manager.js, processors/*.js (21)
js/moodle/       moodle-creator.js, moodle-formats.js, page-themes.js, page-themes/*, processors/activities/*.js (8), processors/shared/*
js/renderers/    chart-renderer, math-renderer, image-utils, crossword-grid-*, find-the-words-grid-*
js/export/       document-exporter, document-formatter, sanitizer, latex-parser, math-catalog (177 symboles), latex-to-omml, latex-to-mathml
js/editor/       index, editor-core, content-detector, field-renderers, array-manager, validators, feedback-editor, json-utils, richtext-editor, formula-assistant
js/caramelia/    chatbot flottant (13 modules) — voir ARCHITECTURE.md local
js/locales/      11 JSON : fr, en, es, de, it, nl, pt, ar, zh, jp, el (~2034 clés/fichier)
js/vendor/       libs externes versionnées (ne pas régénérer)
assets/data/     prompts/ (templates IA), examples/ (échantillons JSON)
docs/            PRD, guides, audits, plans (références approfondies)
scripts/         outils Node (.mjs) : verify-all-locales, update-locale-latex, translate-cp-*
tests/           tests HTML interactifs (field-constraints-dashboard, etc.)
```

## Conventions strictes

- **Code & commits en français** (commentaires, messages de commit)
- ES6 modules natifs, aucun transpileur, aucun bundler
- CSS BEM-like, variables CSS pour le theming
- Toute UI utilise `data-key` → clé i18n dans `js/locales/*.json`
- `caramel_` préfixe pour `sessionStorage`
- Tuiles : `data-activity-types`, `data-platforms`, `data-module` pour filtrage
- Logs : `debugLog('module', ...)` (actif si `?debug`)
- Erreurs : `classifyError(e)` → `{category, userMessageKey, technicalMessage}` (PARSE / NETWORK / VALIDATION / PACKAGING)

## Pièges critiques (lis avant d'agir)

1. **Patch h5p-standalone** : `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` est patché — regex `/^([a-z0-9]+:\/\//i` → `/^([a-z0-9]+:\/\/|data:image\/)/i` pour reconnaître les `data:image/` URLs (restreint à `image/` par l'audit 2026-06 : un `data:text/html` ne doit pas être chargé). À réappliquer à chaque mise à jour. Sans ce patch, les images base64 cassent dans la preview.
2. **`json-healer.js` obligatoire** : tourne entre LLM et processor, répare backslashes LaTeX, wrappe en `params`, corrige versions H5P, ajoute UUIDs manquants. Ne jamais court-circuiter.
3. **`field-constraints.js`** : source unique de vérité pour les render types par champ (6 types : `html+latex`, `html`, `unicode`, `unicode+markers`, `plain`, `plain+letters`). Utilisé par healer, processors, éditeur, tests.
4. **Modules Éléa** utilisent `elea_*` comme moduleKey — aliasés dans `field-constraints.js`.
5. **Modèle LLM par défaut** : `mistral-small-4-119b` (Mistral Small 4). `ACTIVITY_MODEL_OVERRIDES` actuellement vide (anciennes surcharges QuizSetQCM/VF, QuizSet, Page, Livre, test_elea, CoursePresentation → `gpt-oss-120b` conservées en commentaire, à réactiver après benchmark de Mistral Small 4).
6. **API keys jamais en frontend** : tout passe par `n8n.incubateur.education.gouv.fr/webhook/llmdev2`.
7. **`js/editor/` est partagé avec Sucrerie** : 11 fichiers JS (tous sauf `index.js` ; inclut `interactive-video-panel.js`) + `css/components/{json-editor,richtext-editor,cloze-editor}.css` sont **byte-identiques** dans le dépôt Sucrerie (`sucrerie.forge.apps.education.fr/assets/js/editor/` et `assets/css/components/`). En plus : `js/ui/sync-video-player.js` est miroir byte-identique dans `assets/js/ui/` (dépendance du panneau Vidéo interactive). Caramel est la source de vérité, Sucrerie pull manuellement par `cp`. **Avant de modifier un de ces fichiers, vérifier que l'évolution n'introduit pas de dépendance Caramel-spécifique** (ex: import de `js/h5p/json-healer.js` qui n'existe pas côté Sucrerie). Si tu touches à `js/editor/`, à `js/ui/sync-video-player.js` ou aux 3 CSS, signale-le pour qu'on propage la modif côté Sucrerie. **Note** : le panneau Vidéo interactive n'est PAS purement `cp` — son CSS (`.iv-editor-*`) vit dans Caramel `css/base/style.css` mais côté Sucrerie dans `assets/css/components/editor-view.css` (bouton capture adapté aux tokens Sucrerie), et son câblage est dans le `index.js` divergent de chaque dépôt. Voir le helper de diagnostic : `node scripts/diff-editor-vs-caramel.mjs` côté Sucrerie.
8. **La liste des modules H5P est la whitelist de dépôt de Sucrerie** : Sucrerie n'accepte au dépôt QUE les types H5P gérés par Caramel. Sa whitelist (`assets/js/h5p/supported-types.js`) est **dérivée** de son registre `assets/js/core/activity-types.js`, lui-même miroir des `h5pModules` de `js/core/definitions.js` (Caramel = source de vérité). **Si tu ajoutes / retires / masques un module H5P dans `definitions.js`, il faut re-synchroniser `activity-types.js` côté Sucrerie** (mettre à jour `CARAMEL_H5P`) — la whitelist de dépôt suivra automatiquement, et le test anti-dérive `tests/deposit/test-deposit-validation.js` côté Sucrerie échouera tant que ce n'est pas fait. (Cf. item 4 de `sucrerie/docs/PRD-AUDIT-2026-06.md`. Rappel : `H5P.AdvancedText` est volontairement masqué → exclu côté Sucrerie aussi.)

## Routeur de skills

Pour toute tâche structurée, **invoque le skill correspondant** (il contient les étapes détaillées, les fichiers à toucher, les pièges, les critères de validation) :

| Tâche | Skill |
|---|---|
| Ajouter un nouveau type H5P | `caramel-add-h5p-activity` |
| Ajouter un nouveau type Moodle/Éléa | `caramel-add-moodle-activity` |
| Ajouter le support d'images à une activité H5P | `caramel-add-image-support` |
| Modifier les contraintes de champ / render types | `caramel-edit-field-constraints` |
| Ajouter / modifier / vérifier des traductions | `caramel-translations` |
| Modifier ou debugger un processor H5P | `caramel-edit-h5p-processor` |
| Étendre l'éditeur JSON visuel (champs, richtext, formula) | `caramel-edit-json-editor` |
| Créer ou modifier un thème de Page Moodle | `caramel-page-theme` |
| Debugger ou étendre le JSON healer | `caramel-json-healer` |
| Créer / modifier un prompt LLM | `caramel-prompts` |
| Toucher à l'export DOCX/ODT/PDF | `caramel-document-export` |
| Modifier le chatbot Caramelia | `caramel-caramelia` |
| Pipeline LaTeX/MathJax (math-catalog, OMML, MathML) | `caramel-latex-math` |
| Génération par lots (quiz/activités à N éléments, mur des 59 s) | `caramel-batch-generation` |
| Sortir une release / bump de version | `caramel-release` |

## Index des PRD et guides (`docs/`)

- `PRD_NOUVELLE_ACTIVITE_H5P.md` — modèle exhaustif intégration H5P (18 phases)
- `PRD_NOUVELLE_ACTIVITE_LIVRE.md` — modèle Moodle Livre
- `PRD_IMAGES_H5P.md` — système d'images
- `PRD_FIELD_CONSTRAINTS_LATEX.md` — render types par champ
- `PRD_COURSE_PRESENTATION.md` — intégration Course Presentation
- `PRD_INTERACTIVE_BOOK.md` — intégration Livre interactif (conteneur multi-chapitres, blocs Column)
- `guide-generation-par-lots.md` — génération « plan + remplissage » (mur des 59 s, comment l'étendre)
- `guide-processeurs.md`, `guide-editeur-json.md`, `guide-themes-page.md`, `guide-traduction.md`
- `catalogue-champs-editeur.md` — types de champs disponibles dans l'éditeur
- `cdc-editeur-cloze.md`, `audit-richtext-h5p.md`, `plan-tests.md`
- `workflows/` (data-flow, workflow), `audits/`, `visuel/`, `specific-plans/`

## Ajout d'activité — vue 30 secondes

Pour ne pas oublier l'essentiel quand tu invoques pas le skill :

**H5P** : `definitions.js` (entrée + `customOrder`) → `processors/NewType.js` (`machineName`, `version`, `extraDependencies`, `default.process()`) → `processors/index.js` (double map) → prompt + exemple JSON → `h5p-libs/` → 11 locales → `field-constraints.js`.

**Moodle** : `definitions.js` → `processors/activities/NewType.js` (`getFiles(data)`, `metadata`) → `processors/index.js` → prompt + exemple → templates partagés si besoin → 11 locales.

## Modèles LLM disponibles (`services/llm.js`)

**Featured (3 visibles UI)** : `qwen-3.6-35b-instruct` (Qwen 3.6, order 1), `mistral-small-4-119b` (Mistral Small 4, order 2, **défaut**), `gpt-oss-120b` (GPT-OSS, order 3).
**Cachés (visibles en `?debug`)** : `mistral-small-3.2-24b`, `llama-3.3-70b`, `llama-3.1-8b`, `gemma-4-31b`, `mistral-medium-250523`.

## RAG ILaaS (chatbot Caramelia)

Collection `caramelia` (id 55) sur ILaaS, accédée via proxy n8n BYOK : `https://n8n-caramel.osc-fr1.scalingo.io/webhook/byok-ilaas-rag-*`. Endpoints : `models`, `collections-list/create/update/delete`, `list`, `delete`, `chunks`, `ingest`, `search`, `chat`, `completion` (tous POST). ~836 docs. Sources dans `rag/caramelia/sources/`, chunks à ingérer dans `rag/caramelia/chunks/<lang>/*.md` (11 langues). Nommage côté ILaaS : `<lang>__<chunk-code>` (double underscore). Chaque chunk a un frontmatter YAML (`referentiel, code, titre, lang, categorie, breadcrumb, version`) extrait dans `metadata` du chunk côté ILaaS. **REPLACE = DELETE + INGEST** (pas d'upsert). Ingestion : `node rag/ingest-caramelia.mjs [lang...]` mais **piège** : sa fonction skip ne pagine pas la liste (limit=100) → re-ingère tous les docs absents des 100 derniers. Pour un replace ciblé, faire DELETE + INGEST individuels via `fetch`/`curl` (cf. mémoire `reference_rag_ilaas_caramelia.md`).

## Libs vendor (`core/lib-loader.js`)

pdf.js 6.0.227, Tesseract 7.0.0, Mammoth 1.12.0, JSZip 3.10.1, client-zip 2.5.0, h5p-standalone 3.8.2 (PATCHÉ), fflate 0.8.3, tar-js 0.3.0, MathJax 3.2.2, jsPDF 4.2.1, jsPDF-AutoTable 5.0.8, docx 8.5.0, DOMPurify 3.4.11.

Lazy-loadées via `initSmartPreloading()` pendant `requestIdleCallback`.
