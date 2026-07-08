# Audit fonctionnel — génération, exports, éditeur (2026-07-06)

> **Statut : PARTIEL.** L'audit multi-agents (5 axes) a été interrompu par la limite de session
> API avant que les agents ne rendent leurs rapports. Ce document consigne : (1) les vérifications
> statiques passées, (2) les deux constats remontés avant interruption, **confirmés ensuite par
> lecture directe du code**, (3) la grille des 5 axes à relancer pour compléter l'audit.
> Il servira de base à la campagne de correction de bugs.

---

## 1. Vérifications statiques — PASSÉES ✅

| Contrôle | Résultat |
|---|---|
| `node --check` sur tous les `.js` hors `js/vendor/` | Aucune erreur de syntaxe |
| `node scripts/verify-all-locales.mjs` | 11 langues × 27 contrôles : ALL OK |
| Patch vendor h5p-standalone 3.8.2 (`frame.bundle.js`) | Présent — regex `/^([a-z0-9]+:\/\/\|blob:\|data:(image\|audio\|video)\/)/i` (3 occurrences) |
| Patch vendor H5P.Video YouTube (Erreur 153) | Présent dans `H5P.Video-1.5` ET `H5P.Video-1.6` (`youtube-nocookie` + `window.top.location`) |

## 2. Constats confirmés

### 2.1 — MAJEUR · Génération par lots : parse des réponses LLM sans `healJsonString` — ✅ CORRIGÉ (2026-07-06)

- **Fichier** : `js/services/llm-batch.js:385-391` (`parseJsonStrict`), appelée en `:450` (plan) et `:480` (chaque lot).
- **Défaut** : le pipeline mono-appel répare la chaîne JSON du LLM avant parse
  (`js/h5p/h5p-creator.js:59` → `JSONHealer.healJsonString`, qui corrige notamment les
  backslashes LaTeX invalides). Le pipeline par lots, lui, fait un `JSON.parse` brut sur
  `res.content` (seule l'extraction de fences markdown est faite en amont par
  `extractJsonContent` dans `js/services/llm.js:162`). Le healing structurel n'intervient
  qu'en toute fin, sur le JSON fusionné — trop tard pour un lot dont la *chaîne* est invalide.
- **Scénario d'échec** : quiz de maths > seuil de découpage → un lot contient `"\frac{1}{2}"`
  (échappement JSON invalide) → `JSON.parse` lève → `withRetry` relance l'appel LLM (même
  probabilité d'erreur) → épuisement des retries → **toute la génération échoue**, alors que
  la même sortie en mono-appel aurait été réparée silencieusement.
- **Correction appliquée (2026-07-06)** : `healJsonString` est injecté dans `parseJsonStrict`
  (import dynamique dans `generateInBatches`) et appliqué **avant** le parse — pas seulement
  en rattrapage, car la correction a révélé un second défaut : `"\times"` / `"\frac"` à
  backslash simple sont du JSON *valide* (`\t` = tabulation, `\f` = form feed) et étaient
  **silencieusement corrompus** par le parse direct. Le healing systématique avant parse =
  parité exacte avec le mono-appel ; repli sur le parse brut si la chaîne réparée ne parse
  pas. **Tests** : `tests/test-llm-batch.html` (25 assertions, enregistré dans
  `test-all.html`) — sur-correction, LaTeX mal échappé, corruption silencieuse, caractères
  de contrôle, erreurs propres, parité mono-appel, découpage en lots.

### 2.2 — MINEUR · Panneau Vidéo interactive : accumulation d'éléments média morts à chaque bascule Plan ↔ Direct — ✅ CORRIGÉ (2026-07-06)

- **Fichiers** : `js/ui/sync-video-player.js:137-142` (`destroy()`) et
  `js/editor/interactive-video-panel.js:141-150` (`ensurePlayer`) + `:266-285` (`setMode`).
- **Défaut** : `destroy()` met le lecteur en pause et libère la source, mais **ne retire jamais
  l'élément du DOM** (ni le `<video>`, ni le `holder` YouTube). Au retour en mode « Direct »,
  `ensurePlayer()` voit `activePlayer === null` et **append un nouvel élément** dans
  `.iv-editor-media` sans le vider. Chaque cycle Plan → Direct laisse donc un élément mort de
  plus, empilé en `position: absolute; inset: 0` (`css/base/style.css:7886-7905`).
- **Impact** : fuite DOM/mémoire ; visuellement masqué car le dernier élément peint au-dessus,
  mais N bascules = N éléments empilés (et pour un `<video>` local, des écouteurs `timeupdate`
  morts).
- **Correction appliquée (2026-07-06)** : les deux à la fois — `destroy()` retire désormais
  l'élément du DOM (`videoEl.remove()` + suppression du `holder` YouTube, y compris si le
  destroy arrive avant l'init asynchrone de l'API YT), et `ensurePlayer()` fait un
  `media.replaceChildren()` de ceinture avant tout montage. **Tests** : groupe « Lecteur —
  nettoyage DOM (destroy) » ajouté à `tests/test-editor-iv.js` (7 assertions : html5,
  cycles répétés, holder YouTube, destroy avant init).
- **⚠ Fichiers partagés Sucrerie — PROPAGATION REQUISE** : `interactive-video-panel.js` et
  `sync-video-player.js` sont miroirs byte-identiques côté Sucrerie → recopier les deux
  fichiers (cf. CLAUDE.md piège n°7 ; diagnostic : `node scripts/diff-editor-vs-caramel.mjs`
  côté Sucrerie).

## 2 bis. Audit ciblé « Image interactive » (2026-07-06)

Audit complet de l'activité H5P.ImageHotspots réalisé séparément :
**`AUDIT_IMAGE_INTERACTIVE_2026-07.md`** — 1 critique (image de fond absente de l'archive),
6 majeurs, 9 mineurs, tous vérifiés fichier:ligne.

## 3. Pistes non instruites (agents interrompus)

Aucun autre constat n'a pu être récupéré (transcripts vides après l'erreur de quota). Les
axes ci-dessous restent **entièrement à auditer**.

## 4. Grille de relance — 5 axes

À relancer (agents parallèles ou sessions dédiées) après réinitialisation du quota :

1. **Pipeline H5P** — cohérence croisée `definitions.js` ↔ `processors/index.js` ↔ prompts ↔
   exemples ↔ locales ↔ `field-constraints.js` ; sur-correction du `json-healer` ; processors
   complexes (QuizSet, CoursePresentation, InteractiveBook, InteractiveVideo, Crossword,
   FindTheWords, DragAndDrop, ImageHotspots) ; `h5p-creator` (preloadedDependencies, médias) ;
   preview `h5p-manager` (blob:/data:).
2. **Pipeline Moodle/Éléa** — validité `.mbz` (moodle_backup.xml, files.xml/contenthash,
   inforef, échappement XML, ids uniques) ; processors d'activités (fractions QCM/Test = 100,
   données partielles) ; Page + thèmes (placeholders, échappement) ; TAR/GZIP (chemins longs,
   non-ASCII) ; alias `elea_*`.
3. **Exports documentaires** — robustesse `latex-parser` sur LaTeX malformé ; validité
   OMML/MathML/StarMath ; trous du `math-catalog` (177 symboles × 3 cibles) ; `keepLatex`
   dans `document-formatter` ; sur-sanitisation du LaTeX par `sanitizer` ; DOCX/ODT bien
   formés ; PDF (RTL arabe, CJK).
4. **Éditeur visuel** — round-trip sans perte (champs non rendus, coercitions) ;
   `content-detector` (faux positifs entre types proches) ; renderers vs 6 render types de
   `field-constraints` ; `array-manager` (clones à références partagées) ; richtext (LaTeX
   préservé, collage Word) ; **imports des 12 fichiers partagés Sucrerie** (aucune dépendance
   Caramel-spécifique).
5. **Orchestration UI/services** — machine d'états de génération (boutons/spinner après
   erreur) ; `extractJsonContent` (cas limites) ; placeholders `{{...}}` résiduels dans les
   prompts ; croisement `data-key` index.html ↔ locales ; `lib-loader` (pako avant UTIF,
   double chargement) ; couverture de `classifyError` ; génération par lots (lot en échec au
   milieu, état partiel).

---

*Méthode : findings uniquement démontrables (fichier:ligne + scénario d'échec concret), pas de
remarques de style. Les deux constats du §2 ont été re-vérifiés manuellement dans le code.*
