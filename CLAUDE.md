# CLAUDE.md — Caramel

> Guide compact. Les playbooks détaillés sont des **skills** dans `.claude/skills/` (chargés à la demande). Les références approfondies sont dans `docs/` (PRD, guides).

## Identité

**Caramel** v6.3.3 — webapp 100% client-side qui génère des activités H5P (`.h5p`) et Moodle/Éléa (`.mbz`) via IA pour profs francophones. ES6 modules purs, **aucun build, aucun npm**, servi en statique. Proxy IA n8n (clés API côté serveur). 11 langues. Packaging ZIP/TAR/GZIP côté navigateur.

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
js/services/     llm.js (n8n), ocr.js, prompt-generator.js, rag-orchestrator.js (décide si le RAG programmes scolaires est envoyé au Worker — sans bouton)
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
tests/           `test-all.html` = 38 suites navigateur (pilote headless : `node tests/run_browser_suite.mjs`)
                 `roundtrip/harness.mjs` = banc Node (T1 déterminisme, T2 idempotence, T3 verbatim, T4 snapshot, T5 Moodle)
                 `run_*.mjs` = contrôles Node ciblés (oracles Playwright, hygiène, mentions légales…)
                 `qa-manuel/` = scénarios Playwright qui CLIQUENT dans le DOM réel (là où la suite
                 mute par `__testing`) + `contre-epreuves.sh`, qui désarme chaque correctif et exige
                 le ROUGE. Serveur sur :8010. Voir `tests/qa-manuel/README.md`.
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

1. **Patch h5p-standalone** : `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` est patché — regex de `H5P.getPath` `/^([a-z0-9]+:\/\//i` → `/^([a-z0-9]+:\/\/|blob:|data:(image|audio|video)\/)/i`. Reconnaît comme URL absolue : les `data:image/` (images base64 de la preview), les `data:audio/`/`data:video/` ET les `blob:` (médias audio/vidéo embarqués d'« Image interactive », servis en URL blob: par `_embedImagesAsDataUrls`). Toujours restreint aux types média (un `data:text/html` ne doit pas être chargé — audit 2026-06). À réappliquer à chaque mise à jour. Sans ce patch, les images base64 ET les médias audio/vidéo cassent dans la preview.
2. **`json-healer.js` obligatoire** : tourne entre LLM et processor, répare backslashes LaTeX, wrappe en `params`, corrige versions H5P, ajoute UUIDs manquants. Ne jamais court-circuiter.
3. **`field-constraints.js`** : source unique de vérité pour les render types par champ (6 types : `html+latex`, `html`, `unicode`, `unicode+markers`, `plain`, `plain+letters`). Utilisé par healer, processors, éditeur, tests. **Ce fichier est aussi consommé par Sucrerie** (dépendance directe de `richtext-editor.js`, qui est byte-identique) **mais n'est PAS byte-identique** : Sucrerie y ajoute ses entrées d'import natif (`CoursePresentationGeneric`, `DragAndDropGeneric`). Il échappe donc au manifeste sha256 et à `diff-editor-vs-caramel` → **toute entrée ajoutée ici doit être reportée à la main côté Sucrerie ; un `cp` brut effacerait ses entrées propres**. Garde-fou dédié : `node scripts/diff-field-constraints.mjs` côté Sucrerie (comparaison sémantique module/champ, liste blanche des entrées Sucrerie-only). Oubli constaté en 2026-07 : `Livre`/`elea_livre` jamais propagés depuis la 5.2.0 → `getConstraints('elea_livre')` = `null` côté Sucrerie, donc aucun richtext ni bouton formule sur les Livres déposés. **L'ORDRE des entrées est porteur de sens** : le repli conteneur de `resolveRenderTypeForField()` itère `Object.entries(FIELD_CONSTRAINTS)` et retient le PREMIER module possédant le sous-chemin — deux fichiers au contenu identique mais d'ordre différent rendent donc un même champ différemment (constaté : `taskDescription` gagné par `FindTheHotspot`/`plain` côté Sucrerie au lieu de `FillInTheBlanks`/`html+latex`, faisant perdre le WYSIWYG au champ « Consigne » des sous-questions de QuizSet/CoursePresentation/InteractiveBook). Le garde-fou rejoue cette résolution ; **insérer une nouvelle entrée à la même position que dans Caramel**.
4. **Modules Éléa** utilisent `elea_*` comme moduleKey — aliasés dans `field-constraints.js`.
5. **Modèle LLM par défaut** : `mistral-small-4-119b` (Mistral Small 4). `ACTIVITY_MODEL_OVERRIDES` est **vide** (surcharges historiques conservées en commentaire) — n'y inscris jamais un contournement de panne, la cascade de fallbacks du Worker est là pour ça et un override figé survit à la panne.
   **Réflexe de diagnostic avant d'accuser un prompt** : les pannes ILaaS sont fréquentes et **invisibles** (la cascade rétrograde silencieusement le modèle ; seul `fallback_level` dans la Data Table n8n en garde trace). Sonder le modèle SEUL, avec un prompt trivial, sur les webhooks visés :
   `node scripts/test-interactive-video-llm.mjs --prod --model <id> --transcript <fichier.json>`
   Appels **isolés** obligatoires : trois requêtes rapprochées saturent le backend PARTAGÉ et fabriquent des fallbacks en cascade qu'on prend pour un défaut du modèle. Deux signatures à ne pas confondre — un échec en **quelques secondes** = modèle en carafe ; un échec à **59 s** = mur du temps (un appel LLM = 59 s max), auquel cas soit on découpe l'activité (`chunking`, skill `caramel-batch-generation`), soit on lui met un modèle plus rapide.
   Épisode de référence (2026-08-26/27, Vidéo interactive) : `mistral-small-4-119b` partait en fallback 6/6 y compris sur un prompt de 90 caractères, pendant que `gpt-oss-120b` et `qwen-3.6-35b-instruct` répondaient en 4-5 s. Panne passagère du modèle — **rien à corriger dans Caramel**. L'annuaire https://bidouiage.forge.apps.education.fr/outils/annuaire-modeles-ia/ liste le catalogue ILaaS (id, contexte) mais **n'appelle pas les modèles** : il ne voit pas une indisponibilité.
6. **API keys jamais en frontend** : tout passe par `n8n.incubateur.education.gouv.fr/webhook/llmdev2`.
7. **41 fichiers sont byte-identiques avec Sucrerie — pas seulement `js/editor/`.** La liste faisant autorité est **`scripts/lib/shared-files.mjs` côté Sucrerie** ; ne jamais s'en remettre à une énumération de mémoire. Elle couvre quatre familles :
   - **éditeur** : 16 fichiers JS (tous sauf `index.js`) + `css/components/{json-editor,richtext-editor,cloze-editor}.css` ;
   - **export documentaire** : `document-exporter.js`, `document-formatter.js`, `course-formatter.js`, `sanitizer.js`, `latex-parser.js`, `latex-to-mathml.js`, `latex-to-omml.js`, `math-catalog.js` ;
   - **thèmes de Page** : `page-themes.js` + les 4 thèmes + `page-themes/shared.js` ;
   - **rendu** : `image-utils.js`, `chart-renderer.js`, les 2 générateurs de grille + `renderers/grid-canvas-utils.js` ;
   - plus `js/core/escape.js` (échappement canonique), `js/core/language-codes.js` (codes de langue) et `js/ui/sync-video-player.js`.

   **`js/core/language-codes.js`** — source unique des codes de langue, **sans aucun import** (comme `escape.js`) pour rester acyclique : `document-exporter.js` importe déjà `core/translation.js`, la table ne pouvait donc vivre dans ni l'un ni l'autre. Elle donne, par locale, `language` (ISO 639-1 nu, exigé par le validateur H5P `/^[a-z]{1,5}$/` pour `h5p.json:language`), `h5p` (code H5P avec variante régionale, ex. `zh-cn` → `h5p.json:defaultLanguage` et champs `language` du `content.json`), `country`/`bcp47` (locale complète des exports Word/ODT). **Piège qu'elle supprime** : `jp` est une clé de LOCALE, pas un code de langue — le japonais est `ja` ; la table était triplée et deux copies écrivaient `jp` verbatim, produisant un `<html lang="jp">` invalide et des libs cherchant un fichier de locale inexistant. Ne jamais réintroduire de mapping local.

   Caramel est la source de vérité, Sucrerie pull manuellement par `cp`. **Piège récurrent** : `js/core/utils.js` n'est PAS partagé — Sucrerie a le sien. Un fichier partagé ne peut donc pas importer un helper ajouté à `core/utils.js` (cf. le doublon d'horodatage assumé dans `document-exporter.js:generateFileName`). Un helper destiné à un fichier partagé doit vivre dans un module lui-même partagé, inscrit au manifeste. **Avant de modifier un de ces fichiers, vérifier que l'évolution n'introduit pas de dépendance Caramel-spécifique** (ex: import de `js/h5p/json-healer.js` qui n'existe pas côté Sucrerie). Si tu touches à `js/editor/`, à `js/ui/sync-video-player.js` ou aux 3 CSS, signale-le pour qu'on propage la modif côté Sucrerie. **Note** : les panneaux Vidéo interactive, Image interactive, Dictée (TTS) et Disposition des zones (Glisser-déposer) ne sont PAS purement `cp` — leur CSS (`.iv-editor-*` pour la vidéo, `.ih-*` pour l'image, `.dt-*` pour la dictée, `.dz-*` pour la disposition) vit dans Caramel `css/base/style.css` mais côté Sucrerie dans `assets/css/components/editor-view.css` (bouton capture adapté aux tokens Sucrerie), et leur câblage est dans le `index.js` divergent de chaque dépôt (le panneau Dictée reçoit `services/tts.js` par injection — chaque dépôt a le sien ; le panneau Disposition importe la math de `dragdrop-layout-model.js`, fichier PARTAGÉ pur consommé aussi par le processeur Caramel et le `processDragAndDrop` de Sucrerie — TOUTE évolution du layout D&D se fait dans ce modèle puis se propage par `cp`). Voir le helper de diagnostic : `node scripts/diff-editor-vs-caramel.mjs` côté Sucrerie. **Attention aux clés i18n** : le `.js` voyage par `cp`, *pas* sa traduction — une clé ajoutée ici et absente des 11 locales de l'autre dépôt s'affiche **brute** à l'utilisateur. `t()` renvoie la clé quand elle manque, et `translateLabel()` (qui porte la plupart des libellés, définis comme `label:`/`hint:` dans les schémas de `content-detector.js`) fait pareil ; l'idiome `t(x) || 'repli'`, utilisé 379× ici, ne protège donc pas — la clé est *truthy*. Après toute modif d'un fichier partagé qui ajoute une clé sous l'une de ces trois formes, lancer `node scripts/check-shared-i18n.mjs` **dans les deux dépôts** (câblé en CI des deux côtés).
8. **La liste des modules H5P est la whitelist de dépôt de Sucrerie** : Sucrerie n'accepte au dépôt QUE les types H5P gérés par Caramel. Sa whitelist (`assets/js/h5p/supported-types.js`) est **dérivée** de son registre `assets/js/core/activity-types.js`, lui-même miroir des `h5pModules` de `js/core/definitions.js` (Caramel = source de vérité). **Si tu ajoutes / retires / masques un module H5P dans `definitions.js`, il faut re-synchroniser `activity-types.js` côté Sucrerie** (mettre à jour `CARAMEL_H5P`) — la whitelist de dépôt suivra automatiquement, et le test anti-dérive `tests/deposit/test-deposit-validation.js` côté Sucrerie échouera tant que ce n'est pas fait. (Cf. item 4 de `sucrerie/docs/PRD-AUDIT-2026-06.md`. Rappel : `H5P.AdvancedText` est volontairement masqué → exclu côté Sucrerie aussi.)
9. **Patch H5P.Video YouTube (Erreur 153)** : `js/vendor/h5p-libs/H5P.Video-1.6/scripts/youtube.js` (et `1.5`) sont patchés pour la vidéo interactive YouTube. En preview h5p-standalone le contenu tourne dans un iframe `about:blank` → `window.location.href === "about:blank"` → l'`ORIGIN` natif valait `undefined`, et l'embed ciblait `www.youtube.com` ; depuis fin 2025 YouTube refuse ces embeds → « Erreur 153 / configuration du lecteur vidéo » (Safari particulièrement strict). Patch = (a) `host: 'https://www.youtube-nocookie.com'` dans `new YT.Player(...)`, (b) `ORIGIN` récupéré via `window.top.location.href` (même origine que l'iframe). Pour une page normale (non `about:blank`) le comportement est inchangé. **(c) Patch « rectangle noir » (24-08-2026, 6.3.1)** : la fin de `create()` faisait `player.g.style = "position:absolute;…"`, où `g` est le nom **MINIFIÉ** de la propriété interne de `YT.Player` pointant sur l'iframe. Google l'a renommée dans la build `2.20260824.01.00` → `player.g` = `undefined` → `TypeError` levée DANS `create()`, dont la fin est court-circuitée : l'iframe ne reçoit jamais son `position:absolute` et reste hors écran (la vidéo joue pourtant, le chrono avance). Remplacé par un helper `styleIframe()` qui lit `player.getIframe()` (API PUBLIQUE) avec repli sur `document.getElementById(id)`, appelé **après `new YT.Player(...)` ET dans `onReady`** (l'iframe n'existe pas toujours dès la construction). Ne JAMAIS redépendre d'une propriété minifiée de `YT.Player`. **(d) Patch « sous-titres imposés » (27-08-2026, 6.3.3)** : `loadModule('captions')` (commentaire « Always load captions ») n'ouvre pas seulement la liste des pistes, il **active la piste par défaut** — donc les sous-titres AUTOMATIQUES (`kind: "asr"`), que toute vidéo YouTube récente possède. Et pour une piste asr, `getOption('captions','tracklist')` revient **VIDE** : le `if (trackList && trackList.length)` du handler est faux, l'événement `captions` n'est jamais émis, `H5P.InteractiveVideo` ne construit même pas le bouton « CC » → sous-titres affichés, case « Intégrer les sous-titres » décochée, aucun moyen de les couper. **Ne jamais poser le correctif dans ce `if`, il ne s'exécuterait jamais.** Patch = `disableDefaultCaptions()` (`setOption('captions','track',{})`) appelé par la branche `else` d'`onApiChange` **et** par deux rappels temporisés (500 ms / 2 s), conditionné à `options.tracks` vide — `options.tracks` vient de `parameters.a11y`, c'est-à-dire `textTracks.videoTrack` du content.json, donc **la case de l'éditeur** ; un drapeau `captionsTrackChosen` posé par `setCaptionsTrack()` protège un choix manuel. **Piège de diagnostic : `getOption('captions','track')` continue de renvoyer la piste asr après extinction** (il décrit la sélection, pas l'affichage) — l'oracle est visuel, cf. `tests/qa-manuel/h-sous-titres-youtube.mjs`. À réappliquer à chaque MAJ de H5P.Video. **Le `.h5p` n'embarque PAS les libs** (seulement `content.json` + `h5p.json`/`preloadedDependencies`) → la preview Sucrerie utilise SA propre copie de `vendor/h5p-libs/` : **propager le patch côté Sucrerie**. (Le rendu final sur Éléa/Moodle dépend de la version H5P.Video + Referrer-Policy de la plateforme, hors de portée de Caramel.)
10. **Patch CSS math du Glisser-déposer (DragQuestion 1.15)** : `js/vendor/h5p-libs/H5P.DragQuestion-1.15/css/dragquestion.css` ET `H5P.Components-1.0/dist/h5p-components.css` sont patchés — la règle du thème `.h5p-draggable span:not(.h5p-hidden-read)` (qui force `display`/`width`/`margin`/`line-height` sur TOUS les spans des étiquettes) reçoit les exclusions `:not([class^="MathJax"]):not([class^="MathJax"] *):not(mjx-container):not(mjx-container *)`. Sans ce patch, les formules LaTeX des étiquettes (rendues par H5P.MathDisplay → MathJax 2 HTML-CSS = spans imbriqués, cf. audit S11 dans `h5p-manager.js`) explosent en preview : formule invisible, texte flottant hors tuile (constat 2026-07). Préview uniquement (le `.h5p` n'embarque pas les libs, cf. piège 9 — sur Éléa le rendu dépend du CSS de la plateforme). À réappliquer à chaque MAJ de DragQuestion/H5P.Components. **Propager la copie vendor côté Sucrerie.**
11. **H5P.Flashcards 1.7.23 — design system H5P + progression en dur (27-08-2026)** : la lib vendor est passée de `1.7.10` à `1.7.23` (récupérée d'un export Éléa, `coreApi` 1.4 → 1.28). Trois conséquences :
    (a) **Nouvelle dépendance `H5P.Components 1.0`** — la lib appelle désormais `H5P.Components.Navigation` / `.Button` / `.ResultScreen` / `.PlaceholderImg` et ajoute la classe `h5p-theme`. Elle est déclarée dans son `library.json`, donc `h5p-prefetch.js` ET `h5p-standalone` (`findAllDependencies` marche récursivement sur les `library.json`) la résolvent seuls : **les `.h5p` déposés AVANT ce changement, dont le `h5p.json` ne la liste pas, s'ouvrent toujours** (vérifié côté Sucrerie). Elle est tout de même ajoutée aux `extraDependencies` de `processors/index.js` pour que les nouveaux exports la déclarent comme Éléa.
    (b) **Deux nouveaux champs de semantics** : `cardsHeader` / `scoreHeader`, en-têtes du tableau de l'écran de résultats. Alimentés par le processeur depuis `h5p_flashcards_cards_header` / `h5p_flashcards_score_header` (11 locales). Sur un contenu hérité qui ne les porte pas, la lib retombe sur ses valeurs anglaises « Cards » / « Score ».
    (c) **PATCH CARAMEL sur `js/flashcards.js`** : `setProgress()` amont code EN DUR `` `Card ${index+1} / ${total}` `` alors que `progressText` est resté dans les semantics et est alimenté par les 11 locales — une activité française affichait « Card 1 / 5 ». Le patch réutilise `this.options.progressText` (jetons `@card` / `@total`), avec repli sur le libellé amont. Régression amont : Éléa affiche donc l'anglais tant que H5P ne l'a pas corrigé. **À réappliquer à chaque MAJ de H5P.Flashcards, et à propager côté Sucrerie** (le `.h5p` n'embarque pas les libs, cf. piège 9 — Sucrerie prévisualise avec SA copie de `vendor/h5p-libs/`). `H5PEditor.VerticalTabs` a suivi le même export (1.3.9 → 1.3.14, dépendance d'éditeur seulement).

12. **Aller-retour Éléa : la seule source de vérité sur les versions de libs (28-08-2026)**. Le `.h5p` de Caramel n'embarque PAS les bibliothèques (piège 9) ; celles d'Éléa n'apparaissent qu'en RÉ-EXPORTANT depuis la plateforme une activité qu'on y a importée. Outillage dédié :
    `node scripts/generer-h5p-sonde-elea.mjs` → un `.h5p` par type (27), pipeline de prod, déterministe (la Dictée reçoit des MP3 de silence, le TTS serveur étant hors Node) ;
    `node scripts/comparer-export-elea.mjs <dossier>` → classe chaque lib ré-exportée en changement de génération / plus récente / absente.
    Passe du 28-08-2026 : **27 bibliothèques récupérées** (Blanks 1.14.13→37, DragText 1.10.17→50, SingleChoiceSet 1.11.44→88, Dialogcards 1.9.14→40, MultiMediaChoice 0.3.27→77, Summary, TrueFalse, Essay, MarkTheWords, Chart, Image, Timeline…). Aucune n'était un fichier patché — vérifier ce point AVANT toute copie (`grep -c "PATCH CARAMEL"`, `MathJax`, `youtube-nocookie`).
13. **Un libellé absent du `content.json` s'affiche EN ANGLAIS, sans erreur.** Les semantics H5P portent des `default` anglais : ce que le processeur ne pose pas, la lib le comble en anglais, silencieusement. Deux pièges jumeaux, tous deux constatés le 28-08-2026 :
    (a) **Jetons de substitution** — ils diffèrent d'une lib à l'autre pour le MÊME concept. `H5P.QuestionSet` attend `@finals`/`@totals` là où `Summary`, `SingleChoiceSet` et `Blanks` attendent `:num`/`:total`. La clé `h5p_score_bar_label` était réutilisée partout → « Vous avez obtenu :num sur :total points » s'affichait littéralement dans le Quiz. Clé dédiée `h5p_quiz_score_bar_label` désormais.
    (b) **`process()` vs `transformForQuizSet()`** — une activité intégrée dans un Quiz ou une Vidéo interactive passe par `transformForQuizSet()`, qui RECOPIAIT à la main un sous-ensemble des libellés de `process()`. Les listes avaient divergé (DragText : 4 sur 18). Les libellés sont maintenant factorisés dans une fonction `libelles()` / `libellesUI()` / `libellesL10n()` par processeur, consommée par les DEUX voies — `Summary.js` exporte `libellesSummary()` pour `InteractiveVideo.buildSummary()`. **Ne jamais réintroduire de recopie manuelle.**
    Garde-fou : `node scripts/auditer-l10n-h5p.mjs` (exécute le vrai pipeline, descend dans les sous-activités, sépare visible / accessibilité / inatteignable). Doit rester à **0 jeton incohérent et 0 libellé en anglais**.


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
| Porter une activité Caramel vers Sucrerie (dépôt/éditeur/aperçu/export) | `caramel-port-to-sucrerie` |
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
**Cachés (visibles en `?debug`)** : `mistral-small-3.2-24b`, `llama-3.3-70b`, `llama-3.1-8b`, `gemma-4-31b`, `mistral-medium-latest`.

Le cadencement du polling est exporté (`POLL_TIMINGS` : `initialDelayMs` 5 s, `intervalMs` 3 s, `timeoutMs` 5 min) **pour être surchargeable par les tests** — sans quoi le seul cas « délai dépassé » coûterait 5 minutes de suite. `tests/test-llm-service.js` l'abaisse à quelques millisecondes puis vérifie en fin de suite qu'il est revenu aux valeurs de prod. Ne pas le re-privatiser.

## RAG ILaaS (chatbot Caramelia)

Collection `caramelia` (id 55) sur ILaaS, accédée via proxy n8n BYOK : `https://n8n-caramel.osc-fr1.scalingo.io/webhook/byok-ilaas-rag-*`. Endpoints : `models`, `collections-list/create/update/delete`, `list`, `delete`, `chunks`, `ingest`, `search`, `chat`, `completion` (tous POST). ~836 docs. Sources dans `rag/caramelia/sources/`, chunks à ingérer dans `rag/caramelia/chunks/<lang>/*.md` (11 langues). Nommage côté ILaaS : `<lang>__<chunk-code>` (double underscore). Chaque chunk a un frontmatter YAML (`referentiel, code, titre, lang, categorie, breadcrumb, version`) extrait dans `metadata` du chunk côté ILaaS. **REPLACE = DELETE + INGEST** (pas d'upsert). Ingestion : `node rag/ingest-caramelia.mjs [lang...]` mais **piège** : sa fonction skip ne pagine pas la liste (limit=100) → re-ingère tous les docs absents des 100 derniers. Pour un replace ciblé, faire DELETE + INGEST individuels via `fetch`/`curl` (cf. mémoire `reference_rag_ilaas_caramelia.md`).

## Libs vendor (`core/lib-loader.js`)

pdf.js 6.2.108, Tesseract 7.0.0, Mammoth 1.12.1, JSZip 3.10.1, client-zip 2.5.0, h5p-standalone 3.8.2 (PATCHÉ), fflate 0.8.3, tar-js 0.3.0, MathJax 4.1.3 (voir piège ci-dessous), jsPDF 4.2.1, jsPDF-AutoTable 5.0.8, docx 9.7.1 (aligné avec Sucrerie — cf. piège export images ci-dessous), DOMPurify 3.4.14, qrcode-generator 2.0.4 (QR codes des exports documentaires ; lazy), heic2any 0.0.4 (HEIC/HEIF→JPEG/PNG, inclut libheif LGPL ; lazy — fond « Image interactive »), UTIF 3.1.0 (TIFF→PNG ; lazy), pako 3.0.1 (zlib, MIT AND Zlib ; dépendance d'UTIF pour les TIFF deflate, chargée AVANT UTIF ; lazy).

> **Export images DOCX — `ImageRun` exige un `type` explicite (docx ≥ 8.6)** : depuis docx 8.6 (comportement inchangé en 9.x), un `new ImageRun({...})` SANS `type` produit une extension de média `.undefined` (aucun content-type déclaré) → Word affiche « contenu illisible » et propose de réparer à l'ouverture (le fichier finit par s'ouvrir). `js/export/document-exporter.js` dérive donc `type` du MIME (`docxImageType()`) et **convertit en PNG les formats non natifs** (WebP/AVIF/SVG…) via `ensureDocxCompatibleImage()` — comme le flux « Image interactive » pour tous ses médias. Les deux dépôts DOIVENT rester sur la MÊME version de docx (Caramel `js/vendor/docx/9.7.1/`, Sucrerie `vendor/docx/9.7.1/`) puisque `document-exporter.js` est byte-identique. Garde-fou : `node tests/roundtrip/docx-image-type.mjs`.

> **MathJax 4 : deux fichiers ne suffisent pas.** `tex-svg.js` seul ne marche PAS.
> (a) Le dossier `sre/` doit être posé À CÔTÉ : MathJax 4 lance un worker de synthèse
> vocale et, s'il ne le trouve pas, `typesetPromise` **ne se résout JAMAIS** — le SVG
> s'affiche mais tout `await` reste bloqué indéfiniment, sans message d'erreur.
> (b) Les polices sont découpées en fragments chargés à la demande (`double-struck`
> pour `\mathbb{R}`…) et vont par défaut sur `cdn.jsdelivr.net`, ce qui viole la règle
> « zéro CDN » et casserait le rendu hors ligne : `loadMathJax()` redirige donc
> `loader.paths.fonts` vers `js/vendor/mathjax/4.1.3/fonts/`. Coût sur disque : 17 Mo
> contre 2,1 Mo pour la 3.2.2. Ne PAS toucher à `js/vendor/mathjax-2/2.7.9`, qui est
> une autre bibliothèque (MathJax 2, exigée par H5P.MathDisplay dans l'aperçu).

> **Toute nouvelle lib vendor doit être inscrite dans les mentions légales** : entrée dans `tests/vendor-legal-map.js` **+** `<li data-translate="legal_library_<nom>">` dans `assets/templates/mentions-legales.html` **+** clé `legal_library_<nom>` dans les 11 `js/locales/*.json` (nom, licence, usage). Les `<li>` sont triés alphabétiquement.
>
> Cette règle était écrite mais **rien ne la vérifiait** — trois bibliothèques y avaient échappé (audit 2026-07) : `qrcode-generator`, les 221 types de contenu de `js/vendor/h5p-libs/`, et `flag-icons` (`css/vendor/`, drapeaux du sélecteur de langue). Elle est désormais tenue automatiquement des deux côtés : `tests/test-legal-notices.js` (navigateur — HTML ↔ 11 locales ↔ `LIB_PATHS`) et `node tests/run_legal_notices.mjs` (Node — croise avec le contenu RÉEL de `js/vendor/` et `css/vendor/`, et vérifie que le crédit H5P cite les familles de licence effectivement présentes sur disque). Le contrôle Node est le seul capable de voir un dossier vendor posé sans aucun câblage.

Lazy-loadées via `initSmartPreloading()` pendant `requestIdleCallback`.
