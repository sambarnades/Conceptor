# CLAUDE.md — Caramel

> Guide compact. Les playbooks détaillés sont des **skills** dans `.claude/skills/` (chargés à la demande). Les références approfondies sont dans `docs/` (PRD, guides).

> **Reprise du chantier H5P / parcours / Sucrerie** : lire d’abord [SUIVI_H5P_PARCOURS.md](docs/SUIVI_H5P_PARCOURS.md). Il porte les cases de clôture, les limites et les prochains lots. L’audit exhaustif des capacités H5P et la collection parcours unifiée ne sont pas terminés ; les anciens rapports décrivent des lots plus restreints.

> **Travaux confiés à d'autres agents (29 sept. 2026, branche `emmanuel`)** : [NOTE_ALLER_RETOUR_ELEA_2026-09-29.md](docs/NOTE_ALLER_RETOUR_ELEA_2026-09-29.md) (vérifier sur Éléa les nouveautés du jour) et [NOTE_TEST_ETUDIANT.md](docs/NOTE_TEST_ETUDIANT.md) (ajouter le Test étudiant aux modules de la plateforme).

## Identité

**Caramel** v7.0.0 — webapp 100% client-side qui génère des activités H5P (`.h5p`), Moodle/Éléa (`.mbz`) et des parcours complets (`.mbz`) via IA. ES6 modules purs, **aucun build, aucun npm**, servi en statique. Proxy IA n8n (clés API côté serveur). 12 langues. Packaging ZIP/TAR/GZIP côté navigateur.

Lancement local : `python3 tests/serveur-statique.py 8000` → `http://localhost:8000`. Mode debug : `?debug` dans l'URL. (Pas `python3 -m http.server` : sa file de 5 connexions fait refuser des modules par macOS au premier chargement, page inerte au hasard ; tous les bancs utilisent ce serveur.)

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
js/parcours/     atelier de parcours : intention → plan → N générations → UN .mbz de COURS
                 (39 modules ; un commutateur « Une activité | Un parcours » sous le
                 formulaire commun — D63 — met l'atelier à la place des tuiles, sous le
                 formulaire de l'accueil qui reste en place — D39).
                 Les modules de la PLATEFORME (forum, questionnaire, leçon, atelier, wiki…)
                 vivent dans `modules-parcours.js` + `modules-natifs.js`, RELEVÉS sur les
                 exports Éléa/Magistère de `tests/fixtures/moodle-reference/sept-2026/` (D70) ;
                 un module sans achèvement ne doit jamais entrer dans l'ouverture progressive (D71).
                 **Le parcours ne modifie JAMAIS les prompts des activités individuelles** : il
                 réutilise leur gabarit et lui AJOUTE son cadre ; ce qui lui est propre (retours
                 d'exemple impersonnels, `retours-impersonnels.js`) se substitue dans SON prompt (D82).
                 Branche `emmanuel` du dépôt `bas`.
                 **Sa mémoire est `docs/PRD_PARCOURS.md`** — décisions D1 à D84 avec leur
                 raison, pièges, et le journal des allers-retours réels sur plateforme.
                 Ne rien y rouvrir sans lire ce fichier ; y écrire toute décision nouvelle.
js/locales/      12 JSON : fr, en, es, de, it, nl, pt, ar, zh, jp, el, br (~2873 clés/fichier)
js/vendor/       libs externes versionnées (ne pas régénérer)
assets/data/     prompts/ (templates IA), examples/ (échantillons JSON)
docs/            PRD, guides, audits, plans (références approfondies)
scripts/         outils Node (.mjs) : verify-all-locales, update-locale-latex, translate-cp-*
tests/           `test-all.html` = 42 suites navigateur (pilote headless : `node tests/run_browser_suite.mjs`)
                 `roundtrip/harness.mjs` = banc Node (T1 déterminisme, T2 idempotence, T3 verbatim, T4 snapshot, T5 Moodle)
                 `run_*.mjs` = contrôles Node ciblés (oracles Playwright, hygiène, mentions légales…)
                 `run_feedback_semantics.mjs` = retours par réponse (À LANCER À LA MAIN, hors CI) :
                 H5P SUPPRIME toute clé absente du semantics sans rien dire, donc un `chosenFeedback`
                 posé à la racine d'une réponse au lieu de `tipsAndFeedback` disparaît à l'import Éléa.
                 Embarque sa propre contre-épreuve (cas synthétique) : il vire au ROUGE si on désarme
                 `replierRetoursRacine()` dans `processors/MultipleChoice.js`.
                 `run_parcours_*.mjs` = les bancs de l'atelier de parcours (le `.mbz` de
                 COURS, la file de fabrication, la relecture didactique, la fiche de séquence,
                 le miroir des types, les modules natifs comparés au relevé… — `run_parcours.mjs`
                 les enchaîne) ; `scripts/generer-parcours-sonde.mjs` fabrique le `.mbz`
                 à importer pour de vrai — **aucun module de parcours n'est annoncé avant son
                 aller-retour sur plateforme** (D24 du PRD).
                 `scripts/generer-parcours-reel.mjs` fabrique des parcours RÉELS (vrai modèle,
                 vraie file `creerFile`) gardés dans `tests/fixtures/parcours-reels/` ;
                 `run_parcours_reels.mjs` les rejoue sans modèle et LIT le cours comme la
                 plateforme l'affichera (texte creux, « … », jargon de prompt, `**`, tutoiement
                 d'adultes), avec sa contre-épreuve à défauts injectés (D80).
                 `scripts/video-demo/` = la vidéo de présentation de Caramel 7 : tournage rejouant
                 des réponses d'IA enregistrées, studio de voix off au prompteur, table de montage,
                 habillage (voir son README). Ses sorties (voix, vidéos) restent dans
                 `tests/.video-demo/`, exclu de git.
                 `decouvrir/` = la page de présentation publique (/decouvrir/, liée au pied de page) :
                 ses vidéos, tutoriels et articles viennent de `decouvrir/ressources.json` (mode
                 d'emploi dans le fichier) ; ses activités à essayer sont de vrais .h5p régénérés par
                 `node scripts/generer-demos-presentation.mjs` (sources `scripts/presentation/`,
                 sortie `assets/presentation/activites/`). Publiée par le `cp` du job `pages`.
                 Sa tenue reste SOBRE, celle de l'accueil (retour de Gauthier, sept. 2026 : « ça
                 fait trop IA ») : ni dégradé, ni élément incliné, ni surtitre en capitales — le
                 banc `run_decouvrir.mjs` le vérifie. Son diaporama de formation (PPTX, ODP, PDF,
                 notes du présentateur, visionneuse dans la page) est fabriqué par
                 `node scripts/diaporama/generer-diaporama.mjs` (pptxgenjs + LibreOffice) : **à
                 relancer à chaque version** — la version et la date figurent sur chaque diapositive,
                 et le banc échoue tant que `diaporama.json` ne porte pas celle d'`index.html`.
                 `scripts/captures-interface.mjs` refait les captures d'écran du tutoriel et du
                 wiki (parcours réel du banc, réseau coupé) ; `scripts/aide-parcours.mjs` écrit ce
                 que Caramelia sait des parcours (trames, modules, conseils) dans son aide
                 embarquée et dans les fiches du RAG — `--verifier` en garde-fou (D83).
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
7. **42 fichiers sont byte-identiques avec Sucrerie — pas seulement `js/editor/`.** La liste faisant autorité est **`scripts/lib/shared-files.mjs` côté Sucrerie** ; ne jamais s'en remettre à une énumération de mémoire. Elle couvre cinq familles :
   - **éditeur** : 16 fichiers JS (tous sauf `index.js`) + `css/components/{json-editor,richtext-editor,cloze-editor}.css` ;
   - **export documentaire** : `document-exporter.js`, `document-formatter.js`, `course-formatter.js`, `sanitizer.js`, `latex-parser.js`, `latex-to-mathml.js`, `latex-to-omml.js`, `math-catalog.js` ;
   - **thèmes de Page** : `page-themes.js` + les 4 thèmes + `page-themes/shared.js` ;
   - **assemblage de cours** : `js/moodle/mbz-course-builder.js` — NÉ côté Sucrerie
     (export « Parcours .mbz » d'une collection), **porté ici le 4 sept. 2026** pour
     l'atelier de parcours ; Caramel en est désormais la source de vérité. Deux
     particularités de contrat, dictées par le partage : il n'importe RIEN (l'écriture
     tar+gzip lui est passée par `ecrireArchive`, OBLIGATOIRE — `createMbz` ici,
     `buildMbz` là-bas), et l'identité que le backup déclare (`wwwroot`, hash de site,
     catégorie de cours, hostname des `stamp` de questions, ligne de journal) passe par
     `IDENTITE_DEFAUT`, dont les valeurs par défaut sont celles de Sucrerie — Caramel
     fournit `IDENTITE_CARAMEL` (`js/parcours/parcours-builder.js`). Un appel sans
     `identite` produit exactement le fichier d'avant le portage ;
   - **rendu** : `image-utils.js`, `chart-renderer.js`, les 2 générateurs de grille + `renderers/grid-canvas-utils.js` ;
   - plus `js/core/escape.js` (échappement canonique), `js/core/language-codes.js` (codes de langue) et `js/ui/sync-video-player.js`.

   **`js/core/language-codes.js`** — source unique des codes de langue, **sans aucun import** (comme `escape.js`) pour rester acyclique : `document-exporter.js` importe déjà `core/translation.js`, la table ne pouvait donc vivre dans ni l'un ni l'autre. Elle donne, par locale, `language` (ISO 639-1 nu, exigé par le validateur H5P `/^[a-z]{1,5}$/` pour `h5p.json:language`), `h5p` (code H5P avec variante régionale, ex. `zh-cn` → `h5p.json:defaultLanguage` et champs `language` du `content.json`), `country`/`bcp47` (locale complète des exports Word/ODT). **Piège qu'elle supprime** : `jp` est une clé de LOCALE, pas un code de langue — le japonais est `ja` ; la table était triplée et deux copies écrivaient `jp` verbatim, produisant un `<html lang="jp">` invalide et des libs cherchant un fichier de locale inexistant. Ne jamais réintroduire de mapping local.

   Caramel est la source de vérité, Sucrerie pull manuellement par `cp`. **Piège récurrent** : `js/core/utils.js` n'est PAS partagé — Sucrerie a le sien. Un fichier partagé ne peut donc pas importer un helper ajouté à `core/utils.js` (cf. le doublon d'horodatage assumé dans `document-exporter.js:generateFileName`). Un helper destiné à un fichier partagé doit vivre dans un module lui-même partagé, inscrit au manifeste. **Avant de modifier un de ces fichiers, vérifier que l'évolution n'introduit pas de dépendance Caramel-spécifique** (ex: import de `js/h5p/json-healer.js` qui n'existe pas côté Sucrerie). Si tu touches à `js/editor/`, à `js/ui/sync-video-player.js` ou aux 3 CSS, signale-le pour qu'on propage la modif côté Sucrerie. **Note** : les panneaux Vidéo interactive, Image interactive, Dictée (TTS) et Disposition des zones (Glisser-déposer) ne sont PAS purement `cp` — leur CSS (`.iv-editor-*` pour la vidéo, `.ih-*` pour l'image, `.dt-*` pour la dictée, `.dz-*` pour la disposition) vit dans Caramel `css/base/style.css` mais côté Sucrerie dans `assets/css/components/editor-view.css` (bouton capture adapté aux tokens Sucrerie), et leur câblage est dans le `index.js` divergent de chaque dépôt (le panneau Dictée reçoit `services/tts.js` par injection — chaque dépôt a le sien ; le panneau Disposition importe la math de `dragdrop-layout-model.js`, fichier PARTAGÉ pur consommé aussi par le processeur Caramel et le `processDragAndDrop` de Sucrerie — TOUTE évolution du layout D&D se fait dans ce modèle puis se propage par `cp`). **L'envoi d'image des blocs de Page et de Livre** (`img_file`, D88 du PRD parcours) n'est pas non plus dans un fichier partagé : le `index.js` de Caramel le GREFFE sur les schémas vivants de `getPageBlockSchema()`, et `js/moodle/page-images.js` pose les octets dans le backup (`@@PLUGINFILE@@`). Sucrerie ne l'a pas tant qu'elle ne reprend ni la greffe ni ce module ; son aperçu doit alors savoir résoudre `@@PLUGINFILE@@`. Voir le helper de diagnostic : `node scripts/diff-editor-vs-caramel.mjs` côté Sucrerie. **Attention aux clés i18n** : le `.js` voyage par `cp`, *pas* sa traduction — une clé ajoutée ici et absente des 12 locales de l'autre dépôt s'affiche **brute** à l'utilisateur. `t()` renvoie la clé quand elle manque, et `translateLabel()` (qui porte la plupart des libellés, définis comme `label:`/`hint:` dans les schémas de `content-detector.js`) fait pareil ; l'idiome `t(x) || 'repli'`, utilisé 379× ici, ne protège donc pas — la clé est *truthy*. Après toute modif d'un fichier partagé qui ajoute une clé sous l'une de ces trois formes, lancer `node scripts/check-shared-i18n.mjs` **dans les deux dépôts** (câblé en CI des deux côtés).
8. **La liste des modules H5P est la whitelist de dépôt de Sucrerie** : Sucrerie n'accepte au dépôt QUE les types H5P gérés par Caramel. Sa whitelist (`assets/js/h5p/supported-types.js`) est **dérivée** de son registre `assets/js/core/activity-types.js`, lui-même miroir des `h5pModules` de `js/core/definitions.js` (Caramel = source de vérité). **Si tu ajoutes / retires / masques un module H5P dans `definitions.js`, il faut re-synchroniser `activity-types.js` côté Sucrerie** (mettre à jour `CARAMEL_H5P`) — la whitelist de dépôt suivra automatiquement, et le test anti-dérive `tests/deposit/test-deposit-validation.js` côté Sucrerie échouera tant que ce n'est pas fait. (Cf. item 4 de `sucrerie/docs/PRD-AUDIT-2026-06.md`. Rappel : `H5P.AdvancedText` est volontairement masqué → exclu côté Sucrerie aussi.)
9. **Patch H5P.Video YouTube (Erreur 153)** : `js/vendor/h5p-libs/H5P.Video-1.6/scripts/youtube.js` (et `1.5`) sont patchés pour la vidéo interactive YouTube. En preview h5p-standalone le contenu tourne dans un iframe `about:blank` → `window.location.href === "about:blank"` → l'`ORIGIN` natif valait `undefined`, et l'embed ciblait `www.youtube.com` ; depuis fin 2025 YouTube refuse ces embeds → « Erreur 153 / configuration du lecteur vidéo » (Safari particulièrement strict). Patch = (a) `host: 'https://www.youtube-nocookie.com'` dans `new YT.Player(...)`, (b) `ORIGIN` récupéré via `window.top.location.href` (même origine que l'iframe). Pour une page normale (non `about:blank`) le comportement est inchangé. **(c) Patch « rectangle noir » (24-08-2026, 6.3.1)** : la fin de `create()` faisait `player.g.style = "position:absolute;…"`, où `g` est le nom **MINIFIÉ** de la propriété interne de `YT.Player` pointant sur l'iframe. Google l'a renommée dans la build `2.20260824.01.00` → `player.g` = `undefined` → `TypeError` levée DANS `create()`, dont la fin est court-circuitée : l'iframe ne reçoit jamais son `position:absolute` et reste hors écran (la vidéo joue pourtant, le chrono avance). Remplacé par un helper `styleIframe()` qui lit `player.getIframe()` (API PUBLIQUE) avec repli sur `document.getElementById(id)`, appelé **après `new YT.Player(...)` ET dans `onReady`** (l'iframe n'existe pas toujours dès la construction). Ne JAMAIS redépendre d'une propriété minifiée de `YT.Player`. **(d) Patch « sous-titres imposés » (27-08-2026, 6.3.3)** : `loadModule('captions')` (commentaire « Always load captions ») n'ouvre pas seulement la liste des pistes, il **active la piste par défaut** — donc les sous-titres AUTOMATIQUES (`kind: "asr"`), que toute vidéo YouTube récente possède. Et pour une piste asr, `getOption('captions','tracklist')` revient **VIDE** : le `if (trackList && trackList.length)` du handler est faux, l'événement `captions` n'est jamais émis, `H5P.InteractiveVideo` ne construit même pas le bouton « CC » → sous-titres affichés, case « Intégrer les sous-titres » décochée, aucun moyen de les couper. **Ne jamais poser le correctif dans ce `if`, il ne s'exécuterait jamais.** Patch = `disableDefaultCaptions()` (`setOption('captions','track',{})`) appelé par la branche `else` d'`onApiChange` **et** par deux rappels temporisés (500 ms / 2 s), conditionné à `options.tracks` vide — `options.tracks` vient de `parameters.a11y`, c'est-à-dire `textTracks.videoTrack` du content.json, donc **la case de l'éditeur** ; un drapeau `captionsTrackChosen` posé par `setCaptionsTrack()` protège un choix manuel. **Piège de diagnostic : `getOption('captions','track')` continue de renvoyer la piste asr après extinction** (il décrit la sélection, pas l'affichage) — l'oracle est visuel, cf. `tests/qa-manuel/h-sous-titres-youtube.mjs`. À réappliquer à chaque MAJ de H5P.Video. **Le `.h5p` n'embarque PAS les libs** (seulement `content.json` + `h5p.json`/`preloadedDependencies`) → la preview Sucrerie utilise SA propre copie de `vendor/h5p-libs/` : **propager le patch côté Sucrerie**. (Le rendu final sur Éléa/Moodle dépend de la version H5P.Video + Referrer-Policy de la plateforme, hors de portée de Caramel.)
10. **Patch CSS math du Glisser-déposer (DragQuestion 1.15)** : `js/vendor/h5p-libs/H5P.DragQuestion-1.15/css/dragquestion.css` ET `H5P.Components-1.0/dist/h5p-components.css` sont patchés — la règle du thème `.h5p-draggable span:not(.h5p-hidden-read)` (qui force `display`/`width`/`margin`/`line-height` sur TOUS les spans des étiquettes) reçoit les exclusions `:not([class^="MathJax"]):not([class^="MathJax"] *):not(mjx-container):not(mjx-container *)`. Sans ce patch, les formules LaTeX des étiquettes (rendues par H5P.MathDisplay → MathJax 2 HTML-CSS = spans imbriqués, cf. audit S11 dans `h5p-manager.js`) explosent en preview : formule invisible, texte flottant hors tuile (constat 2026-07). Préview uniquement (le `.h5p` n'embarque pas les libs, cf. piège 9 — sur Éléa le rendu dépend du CSS de la plateforme). À réappliquer à chaque MAJ de DragQuestion/H5P.Components. **Propager la copie vendor côté Sucrerie.**
11. **H5P.Flashcards 1.7.23 — design system H5P + progression en dur (27-08-2026)** : la lib vendor est passée de `1.7.10` à `1.7.23` (récupérée d'un export Éléa, `coreApi` 1.4 → 1.28). Trois conséquences :
    (a) **Nouvelle dépendance `H5P.Components 1.0`** — la lib appelle désormais `H5P.Components.Navigation` / `.Button` / `.ResultScreen` / `.PlaceholderImg` et ajoute la classe `h5p-theme`. Elle est déclarée dans son `library.json`, donc `h5p-prefetch.js` ET `h5p-standalone` (`findAllDependencies` marche récursivement sur les `library.json`) la résolvent seuls : **les `.h5p` déposés AVANT ce changement, dont le `h5p.json` ne la liste pas, s'ouvrent toujours** (vérifié côté Sucrerie). Elle est tout de même ajoutée aux `extraDependencies` de `processors/index.js` pour que les nouveaux exports la déclarent comme Éléa.
    (b) **Deux nouveaux champs de semantics** : `cardsHeader` / `scoreHeader`, en-têtes du tableau de l'écran de résultats. Alimentés par le processeur depuis `h5p_flashcards_cards_header` / `h5p_flashcards_score_header` (12 locales). Sur un contenu hérité qui ne les porte pas, la lib retombe sur ses valeurs anglaises « Cards » / « Score ».
    (c) **PATCH CARAMEL sur `js/flashcards.js`** : `setProgress()` amont code EN DUR `` `Card ${index+1} / ${total}` `` alors que `progressText` est resté dans les semantics et est alimenté par les 12 locales — une activité française affichait « Card 1 / 5 ». Le patch réutilise `this.options.progressText` (jetons `@card` / `@total`), avec repli sur le libellé amont. Régression amont : Éléa affiche donc l'anglais tant que H5P ne l'a pas corrigé. **À réappliquer à chaque MAJ de H5P.Flashcards, et à propager côté Sucrerie** (le `.h5p` n'embarque pas les libs, cf. piège 9 — Sucrerie prévisualise avec SA copie de `vendor/h5p-libs/`). `H5PEditor.VerticalTabs` a suivi le même export (1.3.9 → 1.3.14, dépendance d'éditeur seulement).

12. **Aller-retour Éléa : la seule source de vérité sur les versions de libs (28-08-2026)**. Le `.h5p` de Caramel n'embarque PAS les bibliothèques (piège 9) ; celles d'Éléa n'apparaissent qu'en RÉ-EXPORTANT depuis la plateforme une activité qu'on y a importée. Outillage dédié :
    `node scripts/generer-h5p-sonde-elea.mjs` → un `.h5p` par type (27), pipeline de prod, déterministe (la Dictée reçoit des MP3 de silence, le TTS serveur étant hors Node) ;
    `node scripts/comparer-export-elea.mjs <dossier>` → classe chaque lib ré-exportée en changement de génération / plus récente / absente.
    Passe du 28-08-2026 : **27 bibliothèques récupérées** (Blanks 1.14.13→37, DragText 1.10.17→50, SingleChoiceSet 1.11.44→88, Dialogcards 1.9.14→40, MultiMediaChoice 0.3.27→77, Summary, TrueFalse, Essay, MarkTheWords, Chart, Image, Timeline…). Aucune n'était un fichier patché — vérifier ce point AVANT toute copie (`grep -c "PATCH CARAMEL"`, `MathJax`, `youtube-nocookie`).
13. **Un libellé absent du `content.json` s'affiche EN ANGLAIS, sans erreur.** Les semantics H5P portent des `default` anglais : ce que le processeur ne pose pas, la lib le comble en anglais, silencieusement. Deux pièges jumeaux, tous deux constatés le 28-08-2026 :
    (a) **Jetons de substitution** — ils diffèrent d'une lib à l'autre pour le MÊME concept. `H5P.QuestionSet` attend `@finals`/`@totals` là où `Summary`, `SingleChoiceSet` et `Blanks` attendent `:num`/`:total`. La clé `h5p_score_bar_label` était réutilisée partout → « Vous avez obtenu :num sur :total points » s'affichait littéralement dans le Quiz. Clé dédiée `h5p_quiz_score_bar_label` désormais.
    (b) **`process()` vs `transformForQuizSet()`** — une activité intégrée dans un Quiz ou une Vidéo interactive passe par `transformForQuizSet()`, qui RECOPIAIT à la main un sous-ensemble des libellés de `process()`. Les listes avaient divergé (DragText : 4 sur 18). Les libellés sont maintenant factorisés dans une fonction `libelles()` / `libellesUI()` / `libellesL10n()` par processeur, consommée par les DEUX voies — `Summary.js` exporte `libellesSummary()` pour `InteractiveVideo.buildSummary()`. **Ne jamais réintroduire de recopie manuelle.**
    Garde-fou : `node scripts/auditer-l10n-h5p.mjs` (exécute le vrai pipeline, descend dans les sous-activités, sépare visible / accessibilité / inatteignable). Doit rester à **0 jeton incohérent et 0 libellé en anglais**.


14. **Le breton (`br`) est la 12ᵉ langue, et la seule qui ne se comporte pas comme les autres (28-08-2026).** Quatre singularités, toutes délibérées :
    (a) **Pas de drapeau vendor.** flag-icons n'indexe que des codes PAYS ISO 3166 : `fi-br` n'existe pas. Le Gwenn ha du est le fichier de **Wikimedia Commons** (`File:Flag_of_Brittany_(Gwenn_ha_du).svg`, auteur *Gryffindor*, CC0 / domaine public), repris dans `assets/images/flags/bzh.svg` **au caractère près** — la SEULE modification est la `viewBox`, ramenée de 1350×900 (3:2) à 1200×900 (4:3) parce que `.fi` applique `background-size: contain` dans une boîte 4:3 et « letterboxerait » un 3:2. Le rognage ne touche que des bandes de la volée : ni le canton (x 0..600) ni aucune moucheture. Branché par `.fi-bzh` dans `css/base/style.css`. **Ne jamais patcher `css/vendor/flag-icons/`** (écrasé à la mise à jour) **ni retoucher le tracé ici** : une correction doit venir de l'amont. Crédité par la clé `legal_library_gwenn_ha_du` dans les 12 locales, via la nouvelle liste `ASSETS_A_MENTION` de `tests/vendor-legal-map.js` — troisième famille d'inventaire, à côté de `js/vendor/` et `css/vendor/`, pour les ressources tierces posées dans `assets/` (angle mort jusque-là).
    (b) **Socle de repli FRANÇAIS, pas anglais.** `BASE_LOCALE = { br: 'fr' }` dans `core/translation.js` : une clé absente de `br.json` tombe en français, pas en anglais — les locuteurs sont francophones et l'activité est destinée à une classe de Bretagne. Cela vaut AUSSI pour les `.h5p` exportés, les processeurs lisant le même dictionnaire.
    (c) **Aucun amont H5P, aucune voix TTS.** Pas un seul `language/br.json` dans les 221 libs de `js/vendor/h5p-libs` → `scripts/sync-h5p-ui-labels.mjs` ne peut RIEN pré-remplir (`CARAMEL_TO_H5P_LANGUAGE_FILES.br = []`, explicite) et le lecteur H5P affiche ses propres libellés en anglais ; ce que Caramel écrit dans le `content.json` reste breton. Le serveur Piper n'a pas de voix bretonne : `br` est volontairement HORS de `TTS_LANGS` et de `LANG_LABELS` (`editor/dictation-tts-panel.js`) — une Dictée créée en interface bretonne retombe sur la voix française (`Dictation.js:103`), ce qui est le comportement voulu, pas un bug.
    (d) **`br` EST le code ISO 639-1** (contrairement à `jp` → `ja`) : locale, `h5p.json:language` et `<html lang>` coïncident. Wordlist LDNOOBW absente → `LANG_ALIAS.br = 'fr'` dans `sucrerie-bridge/services/profanity-filter.js` (repli français plutôt qu'un filtre local inopérant).
    **Point ouvert côté aManDe/Sucrerie** : le dépôt envoie `language: 'br'` et `ui_language: 'br'` (`sucrerie-bridge/ui/panel.js`) — vérifier que le backend accepte la valeur (contrainte SQL / enum) avant d'annoncer le dépôt d'activités en breton.
    Procédure complète pour une 13ᵉ langue : `docs/guide-traduction.md`, section « Ajouter une langue ».

15. **La zone des sources (`#ocr-output`) : écrire = émettre `input`, lire = `lireCorpusSources()` (25-09-2026).** Le bouton « Générer en un clic » envoie le texte du textarea de prompt de la tuile, pas le contexte courant : ce prompt n'est régénéré, et son cache de session (`caramel_prompt_*`) purgé, que sur un événement `input`. Toute écriture programmatique de la zone (`updateRagArea()` de `ocr.js` : dépôt, retrait, import d'URL) doit donc l'émettre — sinon l'IA recevait un prompt SANS section SOURCES, ou celles d'un document retiré (bug prod). La restauration d'un prompt en session est en outre gardée par `signatureContexte()` (mode + champs + corpus). Côté lecture, jamais `innerText` : la zone vit dans les champs du mode Avancé, en `display: none` en mode Rapide, où `innerText` recolle les lignes bout à bout ; passer par `lireCorpusSources()` (`prompt-generator.js`) ou `texteAffiche()` (`core/texte-affiche.js`). Même exigence pour la génération PAR LOTS : le prompt du PLAN porte les SOURCES (`llm-batch.js#blocSources`), faute de quoi les intitulés des N éléments étaient conçus sans le document. Et un PDF garde ses lignes (`hasEOL` de PDF.js, `ocr.js#extractTextFromPdfPage`). Garde-fous : `node tests/qa-manuel/j-sources-document.mjs [--contre-epreuve]` et `node tests/run_sources_prompt_tests.mjs` (CI).

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
- `brief-traduction-breton.md` — brief à donner à l'IA traductrice pour `br.json` (règles de préservation des jetons, découpage, vérification)
- `guide-processeurs.md`, `guide-editeur-json.md`, `guide-themes-page.md`, `guide-traduction.md`
- `catalogue-champs-editeur.md` — types de champs disponibles dans l'éditeur
- `cdc-editeur-cloze.md`, `audit-richtext-h5p.md`, `plan-tests.md`
- `workflows/` (data-flow, workflow), `audits/`, `visuel/`, `specific-plans/`

## Ajout d'activité — vue 30 secondes

Pour ne pas oublier l'essentiel quand tu invoques pas le skill :

**H5P** : `definitions.js` (entrée + `customOrder`) → `processors/NewType.js` (`machineName`, `version`, `extraDependencies`, `default.process()`) → `processors/index.js` (double map) → prompt + exemple JSON → `h5p-libs/` → 12 locales → `field-constraints.js`.

**Moodle** : `definitions.js` → `processors/activities/NewType.js` (`getFiles(data)`, `metadata`) → `processors/index.js` → prompt + exemple → templates partagés si besoin → 12 locales.

## Modèles LLM disponibles (`services/llm.js`)

**Featured (3 visibles UI)** : `gemma-4-31b` (Gemma 4, order 1), `qwen-3.8-27b` (Qwen 3.8, order 2), `mistral-small-4-119b` (Mistral Small 4, order 3, **défaut**).
**Cachés (visibles en `?debug`)** : `qwen-3.6-35b-instruct`, `llama-3.1-8b`, `mistral-medium-latest`.
**Cycle ILaaS de l'automne 2026 (28-09-2026)** : `gpt-oss-120b` et `mistral-small-3.2-24b` arrêtés le 30-09 ; `llama-3.3-70b` déjà hors catalogue. `qwen-3.8-27b` n'était **pas encore au catalogue** : le Worker retombe alors sur son 1er fallback `qwen-3.6-35b-instruct` (`fallback_level: 1`, mesuré) — voulu, « 3.8 sinon 3.6 ». Son id est **déduit** de la convention ILaaS : le confirmer dès son arrivée (`POST …/webhook/caramel/ia/sonde` `{"mode":"liste"}`), sinon Qwen reste en 3.6 sans rien dire.
**Côté n8n** (`n8n-bas/_outillage/appliquer-ilaas-automne-2026.py`, appliqué à `n8n-bas/` et `n8n-prod/`) : cascade du Worker `qwen-3.6` → `mistral-small-4` → `gemma-4` (le modèle en échec est sauté) ; secours de Caramelia = `gemma-4-31b` ; Vision = modèle demandé (défaut `qwen-3.8-27b`, `DEFAULT_VISION_MODEL`) puis relances sur `qwen-3.6-35b-instruct`. **Qwen 3.8 raisonne par défaut** (niveau « medium » chez ILaaS) : le raisonnement est coupé (`chat_template_kwargs: {enable_thinking: false}`) pour lui SEUL dans les requêtes du Worker et de la Vision, sinon le mur des 59 s — non vérifiable avant son arrivée. **Ordre de déploiement** : l'ancien workflow Vision relançait trois fois le modèle demandé et échoue aussitôt sur `qwen-3.8-27b` (mesuré) → importer le workflow 12 AVANT de servir le front. Au retrait du 3.6 : remplacer `qwen-3.6-35b-instruct` par `qwen-3.8-27b` dans les deux « Déterminer fallback » du Worker et dans `REPLI_VISION`.

Le cadencement du polling est exporté (`POLL_TIMINGS` : `initialDelayMs` 5 s, `intervalMs` 3 s, `timeoutMs` 5 min) **pour être surchargeable par les tests** — sans quoi le seul cas « délai dépassé » coûterait 5 minutes de suite. `tests/test-llm-service.js` l'abaisse à quelques millisecondes puis vérifie en fin de suite qu'il est revenu aux valeurs de prod. Ne pas le re-privatiser.

## RAG ILaaS (chatbot Caramelia)

Collection `caramelia` (id 55) sur ILaaS, accédée via proxy n8n BYOK : `https://n8n-caramel.osc-fr1.scalingo.io/webhook/byok-ilaas-rag-*`. Endpoints : `models`, `collections-list/create/update/delete`, `list`, `delete`, `chunks`, `ingest`, `search`, `chat`, `completion` (tous POST). ~836 docs. Sources dans `rag/caramelia/sources/`, chunks à ingérer dans `rag/caramelia/chunks/<lang>/*.md` (11 langues). Nommage côté ILaaS : `<lang>__<chunk-code>` (double underscore). Chaque chunk a un frontmatter YAML (`referentiel, code, titre, lang, categorie, breadcrumb, version`) extrait dans `metadata` du chunk côté ILaaS. **REPLACE = DELETE + INGEST** (pas d'upsert). Ingestion : `node rag/ingest-caramelia.mjs [lang...]` mais **piège** : sa fonction skip ne pagine pas la liste (limit=100) → re-ingère tous les docs absents des 100 derniers. Pour un replace ciblé, faire DELETE + INGEST individuels via `fetch`/`curl` (cf. mémoire `reference_rag_ilaas_caramelia.md`).

## Libs vendor (`core/lib-loader.js`)

pdf.js 6.3.289, Tesseract 7.0.0, Mammoth 1.13.0, JSZip 3.10.2, client-zip 2.5.1, h5p-standalone 3.8.2 (PATCHÉ), fflate 0.8.3, tar-js 0.3.0, MathJax 4.1.3 (voir piège ci-dessous), jsPDF 4.2.1, jsPDF-AutoTable 5.0.8, docx 9.8.1 (aligné avec Sucrerie — cf. piège export images ci-dessous), DOMPurify 3.4.16, qrcode-generator 2.0.4 (QR codes des exports documentaires ; lazy), heic2any 0.0.4 (HEIC/HEIF→JPEG/PNG, inclut libheif LGPL ; lazy — fond « Image interactive »), UTIF 3.1.0 (TIFF→PNG ; lazy), pako 3.0.2 (zlib, MIT AND Zlib ; dépendance d'UTIF pour les TIFF deflate, chargée AVANT UTIF ; lazy).

> **Export images DOCX — `ImageRun` exige un `type` explicite (docx ≥ 8.6)** : depuis docx 8.6 (comportement inchangé en 9.x), un `new ImageRun({...})` SANS `type` produit une extension de média `.undefined` (aucun content-type déclaré) → Word affiche « contenu illisible » et propose de réparer à l'ouverture (le fichier finit par s'ouvrir). `js/export/document-exporter.js` dérive donc `type` du MIME (`docxImageType()`) et **convertit en PNG les formats non natifs** (WebP/AVIF/SVG…) via `ensureDocxCompatibleImage()` — comme le flux « Image interactive » pour tous ses médias. Les deux dépôts DOIVENT rester sur la MÊME version de docx (Caramel `js/vendor/docx/9.8.1/`, Sucrerie `vendor/docx/9.8.1/`) puisque `document-exporter.js` est byte-identique. Garde-fou : `node tests/roundtrip/docx-image-type.mjs` (lit le chemin dans `LIB_PATHS`). **docx ≥ 9.8 déclare un style « Normal » explicite** : LibreOffice cesse alors de prêter à nos titres son « garder avec le suivant » (« Question 4 » seul en bas de page, 12 exports sur 67) — d'où `keepNext`/`keepLines` écrits en clair dans les styles de titres de `createDOCXDocument`. Pour une montée de docx, comparer le RENDU (DOCX → PDF par LibreOffice, pages et texte), pas seulement les octets de l'oracle.

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

### Correctifs natifs H5P du 12 septembre 2026

FindTheWords 1.4 (origine canvas du pointeur) et SortParagraphs 0.11 (retrait des indicateurs de score) sont patchés localement. À réévaluer lors de chaque mise à jour vendor, en conservant la parité bas/Sucrerie. [Provenance et contre-épreuves](docs/CORRECTIFS_LECTEURS_H5P_2026-09-12.md). Ces patches ne sont pas installés dans Éléa par un export de contenu.
