# PRD — Activité « Image Hotspots » (H5P.ImageHotspots)

> **Statut** : **✅ TERMINÉ** — implémentation Caramel + portage Sucrerie complets et vérifiés (code + navigateur réel + Playwright export & RAG). RAG ingéré, prérequis déploiement faits, bug d'export trouvé & corrigé. Reste **uniquement** : tests manuels visuels/live (réseau vision/LLM + ouverture des exports en bureautique) et **commit/push (réservé à l'auteur)**. • **Cible** : Caramel v6.2.0 + Sucrerie v1.1.4
> **Auteur** : exploration multi‑agents (8 sous‑systèmes) + synthèse • **Créé** : 2026‑06‑29 • **MAJ** : 2026‑06‑30 (clôture : RAG ingéré, CI vision, bug export corrigé, version Sucrerie 1.1.4, skills à jour)
> **Type** : nouvelle activité H5P à média, avec pré‑analyse **vision** (Qwen 3.6 VL) et export document numéroté.

Ce PRD est exhaustif : il couvre le pipeline H5P, la modale d'upload calquée sur la Vidéo interactive, l'appel vision, l'éditeur visuel, l'export DOCX/ODT/PDF, l'i18n 11 langues et le portage Sucrerie. Chaque chantier liste les fichiers à créer/modifier (avec `file:line`), des squelettes de code, les pièges et les critères d'acceptation.

---

## 0.0 ÉTAT FINAL — synthèse (2026‑06‑30, fin de session reprise)

> **VALIDÉ — PRÊT À COMMITTER (par l'auteur uniquement)**. Tout est en working tree, **rien de poussé**. Dépôts : `caramel/bas` + `sucrerie.forge.apps.education.fr` (+ chunks `Caramel/rag/` déjà ingérés ; + le patch YouTube `H5P.Video` touche aussi `caramel.forge` prod, hors périmètre IH).

**✅ FAIT & VÉRIFIÉ (code + navigateur réel headless) :**
- **Caramel — activité complète** : pipeline H5P (processor v1.11, triple registre, healer, field‑constraints), VISION (qwen‑3.6‑35b‑instruct), modale upload+raffinements (✕/↻/?/HEIC/TIFF), éditeur visuel polymorphe (Texte/Image/Audio/Vidéo), export DOCX/ODT/PDF pastilles numérotées, i18n 11 langues. **Banc Node `tests/roundtrip/ih-acceptance.mjs` : 87/87** ; non‑régression `harness.mjs` EXIT=0 ; revue adversariale (0 HIGH) ; smoke navigateur (boot 0 erreur, overlay canvas, éditeur).
- **3 correctifs revue** : commentaire `frame.bundle.js`, MIME média canonisé, `legacyPositioning`.
- **Chantier 7 — Release (local)** : footer `v6.2.0`, `CLAUDE.md`, section `CHANGELOG [6.2.0]`.
- **Chantier 9 — Caramelia tuto** : puce « Image interactive » ×11 langues + routage `config.js`.
- **Chantier 8 — Sucrerie (`sucrerie.forge.apps.education.fr`) : COMPLET** — dépôt (registre + i18n tuile + icône + canonical, **deposit test ✓**), éditeur (3 miroirs byte‑identiques + **`field-constraints` IH** + **48 clés i18n éditeur** + **denormalize player‑ready** + `H5P_RESTRUCTURING_TYPES`), **lib `H5P.ImageHotspots-1.11` vendorée** dans `vendor/h5p-libs/`, **médias fichier** (API média portée + injection ZIP au save), **export doc** (renderer + `formatImageHotspots` + `doc_fmt_*` ×11). **Vérifié navigateur Sucrerie** (`composeH5pContent` → `playable:true`, médias, overlay).
- **6 correctifs après test navigateur réel** (cf. §0 « Correctifs ») : lib vendoring, clés i18n éditeur, denormalize jouable, richtext (`field-constraints`), titre retiré, **ré‑hydratation des images de l'éditeur** (Caramel + miroir).
- **📘 Skill `caramel-port-to-sucrerie`** créé (checklist portage + table symptôme→cause).

**✅ CLÔTURE (sessions de reprise, 2026‑06‑30) — il ne reste QUE le manuel + le commit :**
1. ✅ **Ingestion RAG Caramelia** — 11 chunks `<lang>__h5p-image-hotspots` ingérés (collection `caramelia` id 55 : **671→682**), retrouvables dans les 11 langues, **validé bout‑en‑bout par le chatbot** (Playwright : réponse ancrée RAG, intent `auto` → RAG serveur). ⚠️ **Piège évité** : le script `ingest-caramelia.mjs` *bare* aurait **dupliqué ~571 docs** (la liste ILaaS est cappée à 100 / 671 → le skip ne couvre que 100 docs) → ingestion **ciblée** des 11 seuls par `fetch` direct, pas le script bare. *(La prémisse « < 100 chunks/langue donc pas de piège » du PRD initial était fausse : la liste agrège toutes les langues.)*
2. ✅ **Prérequis déploiement** — `CARAMEL_VISION_DETECT_URL` câblée comme **11ᵉ URL OBLIGATOIRE** du `.gitlab-ci.yml` (garde `-z` + `sed` d'injection + echo) ; mentions légales heic2any/UTIF/pako **complètes** (template `mentions-legales.html` + 11 locales).
3. ✅ **Bug d'export trouvé & corrigé (hors‑PRD, révélé par le test `robustesse` Sucrerie)** — `formatImageHotspots` (`document-formatter.js`, **fichier PARTAGÉ byte‑identique** Caramel↔Sucrerie) avait divergé et la copie Sucrerie émettait `imageData:` au lieu de `url:` → **image de fond silencieusement perdue** en DOCX/ODT/PDF (la pré‑passe `prepareImages` ne traite que `section.url`). **Unifié host‑agnostique** (`url:` + repli `getAllImages()` pour le fond), byte‑identité rétablie (manifeste sha256 régénéré, test `robustesse` vert), **validé Playwright** (DOCX & ODT : image **+** légende numérotée embarquées). Leçon répercutée dans `caramel-port-to-sucrerie` (§7) **et** `caramel-add-h5p-activity` (nouvelle phase 11).
4. ✅ **Release Sucrerie** — `Sucrerie v1.1.3 → v1.1.4` (footer `index.html` + `translation.js` + 11 locales) + entrée CHANGELOG `[1.1.4]` (Image interactive + correctifs export/YouTube). Côté Caramel : footer/CHANGELOG `v6.2.0` déjà posés.
5. ⏭️ **RESTE STRICTEMENT MANUEL** (non automatisable ici — réseau live + visuel + interaction) : modale upload→**vision live**→génération ; audio/vidéo qui **jouent** réellement en preview (+ YouTube) ; **rendu visuel** des 3 exports ouverts dans Word/LibreOffice ; et **bout‑en‑bout Sucrerie** complet (dépôt IH → édition WYSIWYG → ajout fichier audio → enregistrement → re‑dépôt, avec compte réel). Cf. §0 « 🧪 TESTS À RÉALISER ».
6. ⏭️ **Commit + push des dépôts — RÉSERVÉ À L'AUTEUR** (`caramel/bas`, `sucrerie.forge` ; le patch YouTube touche aussi `caramel.forge` prod). Messages FR : skill `caramel-release`.

---

## 0. État d'avancement (2026‑06‑30)

> 🔴 **PRÉREQUIS DE DÉPLOIEMENT (obligatoire)**
> 1. **Endpoint vision dans le `.gitlab-ci.yml`** — la variable `CARAMEL_VISION_DETECT_URL` (lue par `js/core/endpoints.js`) doit être **injectée à la livraison via le CI/CD GitLab** (substitution dans `endpoints.js` à l'étape de déploiement, comme les autres URLs de webhook n8n). Sans cela, la détection vision est cassée en prod. Valeur prod actuelle : `https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-vision-detect-bas`.
> 2. **Mentions légales** — toute **nouvelle bibliothèque JS** vendorée (ex. `heic2any`, `UTIF`) doit y être **inscrite** : `<li data-translate="legal_library_<nom>">` dans `assets/templates/mentions-legales.html` **+** clé `legal_library_<nom>` dans **les 11** `js/locales/*.json`.

### ✅ FAIT et VÉRIFIÉ (testé en production)
- **Vendor** : `js/vendor/h5p-libs/H5P.ImageHotspots-1.11/` + toutes deps (Image/Text/Audio/Video/Components/Transition/FontAwesome/jQuery.ui + éditeur ColorSelector/ImageCoordinateSelector/ShowWhen/VerticalTabs).
- **Pipeline H5P** : entrée `ImageHotspots` dans `definitions.js` (+ `customOrder`, flag `requiresBackgroundImage`) ; triple registre dans `processors/index.js` ; **processor** `processors/ImageHotspots.js` (gère le format plat IA **et** le format enrichi éditeur Texte/Image/Audio/Vidéo) ; entrée `field-constraints.js` (`hotspots[].text` = `html+latex`). Healer : exclusion naturelle du bloc commun (pas de clés parasites).
- **Prompt + exemple (FR)** : 4 clés `prompt_image_hotspots_*` + tuile (`h5p_image_hotspots_name/description`) + `assets/data/examples/image_hotspots_1.json` + `assets/data/prompts/image_hotspots.md`. Câblage `ACTIVITY_CONFIG` + `setImageHotspotZones` / `buildImageHotspotsPrompt` (injection SOURCES : description globale + zones).
- **VISION (résolu, le risque #1 est levé)** :
  - **Modèle = `qwen-3.6-35b-instruct`** (Qwen VL). Benchmark live : grounding des coordonnées **pixel‑perfect** (≫ Mistral Small, grossier ; ≫ Gemma, instable/timeout). ~1 s.
  - **Découverte clé** : Qwen renvoie ses coordonnées en **échelle native 0–1000**, pas en 0–100. → détection d'échelle automatique (max>100 ⇒ ÷10 ; ≤1 ⇒ ×100) côté **workflow** ET côté **client** (défense en profondeur). Validé sur image réelle (F1 : Ferrari + mécaniciens correctement localisés).
  - **Workflow n8n** : `n8n-workflows-bas/Caramel · Vision Image Hotspots — Détection (bas).json` (synchrone, multilingue via `lang`, override `prompt`, `imageDescription` + zones). **Déployé en prod** : `…/webhook/caramel-vision-detect-bas`.
  - **Client** : `js/core/endpoints.js` (`visionDetect`) + `js/services/hotspot-vision.js` (`detectImageZones`).
- **Image de fond** : `image-manager.js` → `processBackgroundImage()` (préserve format/transparence, borne 1920, pas de JPEG forcé) + `buildBackgroundImageField()`.
- **Modale (Chantier 2)** : `ui.js` → champ d'upload inline (réutilise `.video-url-field*`), `initBackgroundImageSection` (machine d'états + vision + capture amont `imageHotspotStates` + gating génération), branche un‑clic + branche guidé (injection image), CSS (`.img-bg-*`), 7 libellés FR. **Flux complet testé OK en prod** (upload → zones → génération).

### 🟡 À FINIR / corriger (raffinements sur le socle déjà fonctionnel)
- ~~**Chantier 2bis — Persistance modale**~~ ✅ **FAIT** : image+zones restaurées au ré‑ouverture (re‑`registerImage`, miniature, état « prêt », zones réinjectées, génération déverrouillée) ; **purge si le contexte vision (qui/quoi/niveau/nombre) change**, branchée sur le `handleContextChange` existant (pas de listeners par‑section, qui auraient empilé — les champs sont des singletons globaux). Bonus : ré‑enregistrement du fond avant packaging (clearAllImages le vide après chaque génération).
- ~~**Chantier 2ter — Formats d'image**~~ ✅ **FAIT** : entrées larges (PNG/JPEG/WebP/GIF/BMP/AVIF/SVG en canvas natif + **HEIC/HEIF** via `heic2any` et **TIFF** via `UTIF`, lazy‑loadées) → conversion **transparente** vers PNG/JPEG (sortie embarquée fiable). `image-manager.js` : `classifyImage()` + `ensureCanvasDecodable()`. Libs vendorées (heic2any, UTIF, **pako** — pour les TIFF deflate) + inscrites aux **mentions légales** (×11). heic2any crée un **Web Worker blob** : ✅ déjà autorisé par `_headers` (`worker-src 'self' blob:` + `script-src … 'wasm-unsafe-eval' blob:`).
- **Chantier 4bis/4ter — Nombre de zones + description riche** : ✅ côté vision (Rapide = ~**4‑5 souple** ; Avancé = **forcé** `[NOMBRE_ELEMENTS]` ; `imageDescription` riche + extraction du **texte visible**). Reste : ré‑import workflow + vérif bout‑en‑bout + 11 locales.
- **i18n** : ✅ **tuile + 9 libellés modale/tuile + 4 prompts + 2 clés export (`doc_fmt_image_hotspots_*`) + 3 libs légales traduits dans les 11 langues** (workflow 10 agents, validés : clés/tokens/`frac{1}{2}` préservés ; `prompt_image_hotspots_structure_json` ajouté à `verify-all-locales.mjs` → 27/27). Reste : **futures clés éditeur** (Chantier 5) + release.

### ⏭️ RESTE À FAIRE (chantiers entiers)
- ~~**Chantier 5 — Éditeur visuel**~~ ✅ **FAIT & VÉRIFIÉ (round‑trip)** (2026‑06‑30) :
  - **Schéma** `content-detector.js` : `contentSignatures['ImageHotspots']` (détecte `hotspots[]`), `titleKeyToModuleKey` (`h5p_image_hotspots_name`→`ImageHotspots`), `moduleTranslationKeys`, `fieldSchemas['ImageHotspots']` (3 sections Général/Apparence/Points ; section Général : image de fond `type:'image'`+`imageProcessor:'background'` **+ `backgroundImageAltText` en champ `text` dédié** — légende d'accessibilité remplie auto par la description vision, visible/éditable, ≠ sous-champ `altTextField` du widget image qui n'affiche pas la valeur existante ; Apparence : `globalColor`/`globalIconType`/`globalIcon` conditionnel — **couleur UNIQUEMENT globale** ; points `x`/`y` `number`, `header` `dynamicTitleField` — **pas de couleur par point** (en mode « numéros » H5P n'utilise que la couleur globale ; la couleur par point n'agirait que sur une icône perso non générée) ; **`content` array `nested` polymorphe** via `_contentType` Texte/Image/Audio/Vidéo + `showWhen`). `normalize`/`denormalize` (cases `ImageHotspots` + helpers `normalizeIHContentNode`/`denormalizeIHContentNode`) : aplatit `position{x,y}`↔`x,y`, construit `content[]` de **nœuds H5P complets `{library,params}` inline** (le processeur ajoute metadata/subContentId), sépare fichier embarqué (`audioFile`/`videoFile`) vs lien (`audioUrl`/`videoUrl`, YouTube→`video/YouTube`), nettoie le fond (strip dataURL, copyright). **Round‑trip validé** (LLM plat → éditeur → +image/audio/vidéo → denormalize → processor → content.json v1.11 → re‑normalize stable).
  - **Widgets éditeur** `field-renderers.js` : nouveaux types `audio`/`video` (upload de fichier embarqué via `processAudioFile`/`processVideoFile`+`registerMedia`, lecteur `<audio>`/`<video>`, preview blob:) ; option `imageProcessor:'background'` ajoutée au widget `image` (préserve format/dimension du fond). CSS `.json-editor__media-*` dans `css/components/json-editor.css`. **field-constraints.js** : `hotspots[].content[].text`=`html+latex` (richtext WYSIWYG).
  - **media‑manager** `image-manager.js` (généralisé, pas de fichier séparé) : `processAudioFile`/`processVideoFile`/`registerMedia`/`unregisterMedia`/`getMedia`/`getAllMedia`/`hasMedia` (+ `clearAllImages` vide aussi le registre média). **Packaging** `h5p-creator.js` (`getAllMedia` + écriture `content/audios|videos/` + auto‑dép H5P.Audio/Video selon préfixes) ; **régénération après édition** `notifications.js` (`getAllMedia`/`hasMedia`). **Preview** `h5p-manager.js` `_embedImagesAsDataUrls` (audio/vidéo → URL blob:) + **patch `frame.bundle.js`** regex `getPath` étendue à `blob:` et `data:(audio|video)\/`.
  - **i18n** : 46 clés `editor_ih_*`+`editor_media_*` × 11 locales (workflow 9 langues ; `editor_ih_hotspot_color` ajoutée puis retirée avec la couleur par point). Avec les 5 clés modale (ci‑dessous), **toutes les locales sont à 2444 clés**, `verify-all-locales.mjs` 27/27.
  - ⚠️ **MIROIR Sucrerie à propager** (Chantier 8) : `js/editor/content-detector.js`, `js/editor/field-renderers.js`, `css/components/json-editor.css` (byte‑identiques) **+** `js/h5p/image-manager.js` généralisé (dépendance des widgets) **+** la même extension de patch `frame.bundle.js` côté reader Sucrerie si sa preview joue les médias embarqués.
- ~~**Chantier 6 — Export DOCX/ODT/PDF**~~ ✅ **FAIT & TESTÉ EN PROD** : `js/renderers/hotspot-overlay-renderer.js` (`composeNumberedHotspotImage` — canvas : fond + pastilles numérotées 1..N) + `formatImageHotspots` (registre `document-formatter.js`) qui **compose dans le formatter (async)** et émet `{type:'image', url, fillWidth:true}` → géré par `prepareImages` passe‑1 → **0 modif des 3 routines de rendu**. Fond ré‑extrait du `.h5p` par le helper partagé `extractBackgroundFromH5p` (registre vidé après packaging), injecté en `_backgroundImage` par **les deux** déclencheurs d'export (`notifications.js` = modale visualisation **et** `ui.js` = modale de résultat — ce dernier était le bug corrigé). Légende en en‑têtes « N. … » (anti‑autoformat liste). Clés `doc_fmt_image_hotspots_{title,legend}` ×11.
- **Chantier 7 — i18n** : ✅ tuile + modale + prompts + export + libs légales (×11) faits ; `verify-all-locales.mjs` mis à jour (27/27). Reste : clés **éditeur** (après Chantier 5) + **release** (footer/CHANGELOG/CLAUDE.md).
- **Chantier 8 — Portage Sucrerie** (`sucrerie.forge.apps.education.fr`) : `activity-types.js` (CARAMEL_H5P), `h5p-export-bridge.js`, `test-deposit-validation.js`, `canonical-libraries.js` (1.11), i18n `activity_h5p_image_hotspots`, icône, fichiers miroir `js/editor/*` modifiés.
- **Chantier 9 — Documentation Caramelia (RAG + Tuto)** : faire connaître l'« Image interactive » au chatbot. (1) **RAG Caramelia (ILaaS)** — ajouter des chunks dans `rag/caramelia/chunks/<lang>/` (11 langues) puis ré‑ingérer (cf. CLAUDE.md « RAG ILaaS » + mémoire `reference_rag_ilaas_caramelia.md` ; **REPLACE = DELETE + INGEST**). (2) **Tuto in‑app** — ajouter/мettre à jour `js/caramelia/tuto-rag/{11}.md` (skill `caramel-caramelia`) ; éventuellement `config.js fuzzyMap` + `extractor.js` pour router l'intention « image interactive ». **⚠️ À refaire pour CHAQUE nouvelle activité/fonctionnalité.**

### 🧪 TESTS À RÉALISER EN PRIORITÉ (non encore validés en navigateur)

> Le Chantier 5 (éditeur + media‑manager) et les raffinements de la modale ont été **vérifiés au niveau code** (`node --check` sur tous les JS, `JSON.parse` + parité des 11 locales à 2444, `verify-all-locales.mjs` 27/27, **test round‑trip Node** normalize→denormalize→processor→content.json→re‑normalize : 24 assertions OK). **Mais RIEN n'a été testé en navigateur** (le DOM, l'upload, la preview, l'export ne sont pas couverts par les tests Node). **Faire réaliser TOUS les tests ci‑dessous avant la release** (lancer `python3 -m http.server 8000` puis `http://localhost:8000?debug`).

> ### ✅ Campagne de tests AUTOMATISÉE exécutée (2026‑06‑30, session de reprise)
> Tout ce qui peut l'être SANS navigateur ni réseau live a été **exécuté et passe**. Un nouveau banc d'acceptation dédié a été créé : `tests/roundtrip/ih-acceptance.mjs` (lance le VRAI pipeline via `bootstrap.mjs`).
>
> - **Statique** : `node --check` sur les 18 JS modifiés/créés → OK ; `verify-all-locales.mjs` **27/27 × 11 locales** ; **64 clés i18n IH réellement référencées présentes dans les 11 locales** (vérifié par grep, hors faux positifs alias/sessionStorage).
> - **Banc d'acceptation Node `ih-acceptance.mjs` : 83/83 assertions** — processeur (format plat LLM **et** enrichi éditeur), `clampPct`, defaults (`#981d99`/`numbers`/`plus`), contenu polymorphe Texte/Image/Audio/Vidéo, **YouTube → `video/YouTube`**, healer (pas de `overallFeedback`/`behaviour`), `field-constraints` (`hotspots[].text` = `html+latex`), `definitions` (+ `requiresBackgroundImage`), `processorMetadata` (8 `extraDependencies`), **PACKAGING** (binaires audio/vidéo/image → `content/audios|videos|images/` + `h5p.json` liste H5P.ImageHotspots 1.11/Text/Image/Audio/Video, dédup OK, `clearAllImages` vide aussi le registre média), **round‑trip éditeur** stable (`detectContentType` titleKey + signature), **legacyPositioning préservé** (fix).
> - **Banc standard `harness.mjs --only=ImageHotspots`** (fixture ajoutée à `fixtures-map.mjs`) : **T1 DÉTERMINISTE, T2 IDEMPOTENT, T3 VERBATIM OK** (dépôt Sucrerie sans perte), T4 snapshot. **Non‑régression** : `harness.mjs` complet **EXIT=0** (les changements partagés image‑manager/h5p‑creator/notifications n'introduisent ni non‑déterminisme ni croissance ; `getAllMedia` est un sur‑ensemble rétro‑compatible de `getAllImages`, aucun appelant orphelin).
> - **Revue de code adversariale** (workflow 13 agents, 5/8 sous‑systèmes complétés — 3 coupés par une panne API transitoire, couverts à la main) : **AUCUN finding HIGH** ; tous les `codePathOk: true` sauf l'écart miroir Sucrerie ATTENDU (pré‑propagation). **Point clé confirmé** : `field-renderers.js` accède à `image-manager` par **`await import()` dynamique** (comme le widget image existant) → **pas de nouvel import statique Caramel‑only → invariant miroir intact** côté Caramel.
> - **Smoke test NAVIGATEUR RÉEL** (Chrome headless via CDP sur l'app servie) : **app bootée — 0 erreur console, 0 exception** ; **tuile « Image interactive » présente** ; **modules IH chargés en ESM natif** (definitions/content‑detector/hotspot‑overlay‑renderer) ; **overlay canvas `composeNumberedHotspotImage` rend un PNG** (3 pastilles) ; logique éditeur (detect/normalize/denormalize YouTube) OK en vrai navigateur.
> - **3 correctifs appliqués cette session** : (a) commentaire d'en‑tête de `frame.bundle.js` resynchronisé sur la regex réelle (anti‑réintroduction de la faille `data:text/` au prochain re‑patch) ; (b) **MIME média canonisé** sur l'extension résolue (`video/quicktime`→`video/mp4`, `audio/x-m4a`→`audio/mp4`… → lecture fiable preview/Éléa, ex. .mov iPhone/Mac) ; (c) **`legacyPositioning` préservé** au round‑trip éditeur (re‑import d'un .h5p legacy).
>
> **RESTE STRICTEMENT MANUEL** (réseau vision/LLM live + visuel + interaction, non automatisable ici) — voir la liste numérotée ci‑dessous, désormais réduite à :
> **modale** 1‑7 (upload→vision live, ✕/↻/?/remplacement, HEIC/TIFF) ; **preview** 12 (audio/vidéo embarqués **jouent** réellement, YouTube joue) ; **export visuel** 14 (rendu DOCX/ODT/PDF depuis les 2 modales — la *composition* du PNG est déjà vérifiée en navigateur) ; **non‑régression UI** 16 ; **acceptation** 2 (mode guidé), 5 (rendu export), 7 (dépôt Sucrerie). Les tests **3, 8‑11, 13, 15, 17** et **acceptation 1, 3, 4, 6** sont **couverts par l'automatisation ci‑dessus** (data‑level + navigateur).

> ### ✅ Chantiers 7 / 8 / 9 — avancement de la session de reprise (2026‑06‑30, édits LOCAUX non commités/poussés)
> - **Chantier 7 — Release** : ✅ FAIT (local). Footer `index.html` `v6.1.1`→`v6.2.0`, `CLAUDE.md` Identité `v6.2.0`, **section `CHANGELOG [6.2.0]`** rédigée (Image interactive + notes techniques). `version-checker.js` : rien (compare le CHANGELOG distant, pas de version codée en dur).
> - **Chantier 9 — Caramelia** : ✅ FAIT. **Tuto in‑app** : puce « Image interactive » dans `js/caramelia/tuto-rag/fr.md` **+ 10 traductions** (workflow 10/10) ; routage `js/caramelia/config.js` (catégorie `memory`, `allModuleKeys`, `h5pKeys`, `activityCaramelMap`, `fuzzyMap` ×10 mots‑clés). **RAG ILaaS** : **11 chunks `h5p-image-hotspots.md` préparés** dans `Caramel/rag/caramelia/chunks/<lang>/` (FR rédigé + workflow 10 langues ; frontmatter calé sur la convention existante, `code`/`categorie`/`machineName` stables, `titre`/`breadcrumb` localisés ; le script d'ingestion glob `*.md` → repris automatiquement). **Ingestion NON faite** (push n8n `byok-ilaas-rag-*` à lancer par l'utilisateur quand tout est validé — « rien en prod tant que ce n'est pas fini »).
> - **Chantier 8 — Portage Sucrerie** : cible confirmée = **`sucrerie.forge.apps.education.fr`** (seul à avoir `canonical-libraries.js` ; conforme CLAUDE.md item 7 + D11). **✅ FAIT INTÉGRALEMENT & VÉRIFIÉ EN NAVIGATEUR** — « ça marche TOTALEMENT sur Sucrerie » (médias fichier inclus). **Tier‑A (dépôt)** : `activity-types.js` (`CARAMEL_H5P`), `h5p-export-bridge.js`, `test-deposit-validation.js` (`SUPPORTED_SAMPLE`), `canonical-libraries.js` (`CANONICAL_VERSIONS` + `LIBRARY_DEPENDENCIES` `‑1.11`), i18n ×11 (`activity_h5p_image_hotspots`), icône. **`test-deposit-validation.js` PASSE** (anti‑dérive 0 violation). **Tier‑B (éditeur + médias + export)** : 3 fichiers miroir `cp` byte‑identiques (`content-detector.js`/`field-renderers.js`/`json-editor.css`) ; **API média portée** dans `assets/js/h5p/image-manager.js` (registre média + `processAudioFile`/`processVideoFile`/`registerMedia`/`unregisterMedia`/`getUploadedMedia`, adaptée à `crypto.randomUUID`, MIME canonisé) ; **re‑packaging média** câblé dans `assets/js/editor/index.js` (`injectUploadedImages` injecte aussi les binaires audio/vidéo sous `content/audios|videos/` ; l'élagage ne touche que `images/`, `clearUploadedImages` vide aussi le registre média) ; **export doc** porté (`assets/js/renderers/hotspot-overlay-renderer.js` + `formatImageHotspots` dans `document-formatter.js`, fond résolu depuis le registre d'export `getAllImages`, clés `doc_fmt_image_hotspots_{title,legend}` ×11). **Smoke navigateur réel Sucrerie** : IH reconnu+whitelisté, API média OK (audio→`audios/…`, `.mov`→`video/mp4`, registre→getUploadedMedia), round‑trip éditeur (detect/YouTube), overlay canvas → PNG.
>   - 🔧 **Correctifs après test navigateur réel (déposé via Caramel‑bridge)** — DEUX prérequis du portage que j'avais d'abord manqués (Sucrerie **charge bien les libs localement** : `vendor/h5p-libs/` + `vendor/h5p-standalone/3.8.2/frame.bundle.js`, contrairement à ma 1ʳᵉ analyse) :
>     1. **Aperçu vide** → `H5P.ImageHotspots-1.11` **n'était pas vendorée** dans `vendor/h5p-libs/` du player Sucrerie (toutes les deps y étaient déjà). Copiée depuis Caramel → l'aperçu rend. (Le fond en `data:image/` est géré par le patch `data:image/` déjà présent dans le `frame.bundle.js` Sucrerie ; les binaires audio/vidéo sont servis par l'intercepteur fetch depuis le ZIP.)
>     2. **Clés brutes dans l'éditeur** (`editor_ih_section_*`, `editor_ih_background`…) → les **48 clés `editor_ih_*` + `editor_media_*`** n'avaient pas été portées (j'avais seulement ajouté `activity_h5p_image_hotspots`). Portées dans les 11 `i18n/*.json` Sucrerie. **⚠️ RÈGLE** : tout portage d'activité à éditeur visuel vers Sucrerie doit (a) **vendoriser la lib H5P** dans `vendor/h5p-libs/`, et (b) **porter les clés i18n de l'éditeur** (`editor_<x>_*`), en plus du nom de tuile `activity_h5p_*`.
>     3. 🔴 **Points absents à la visualisation + champs « perdus » au ré-enregistrement** (cause de fond) → `denormalizeDataForSave` (IH) produisait le **format plat intermédiaire** (`{x,y}` + `content[]{library,params}`) en comptant sur le **processeur** Caramel pour finir (position{}, metadata, subContentId). **Sucrerie n'a PAS de processeur** : la sortie de l'éditeur est écrite telle quelle → le player ne trouvait pas `position` → **aucun point**. **Corrigé** : `denormalizeDataForSave` (+ `denormalizeIHContentNode`) produit désormais le **content.json v1.11 JOUABLE directement** (`position{x,y,legacyPositioning}`, nœuds `content[]` complets `{library,params,metadata,subContentId}` via `ihUUID()`/`crypto.randomUUID`, defaults globaux + libellés). Côté Caramel le processeur re-traite de façon **idempotente** (conserve metadata/subContentId). `ImageHotspots` ajouté à **`H5P_RESTRUCTURING_TYPES`** de `editor/index.js` Sucrerie (+ test anti‑dérive `tests/editor/test-h5p-image-edit.js` mis à jour). **Vérifié navigateur Sucrerie** : `composeH5pContent` → hotspots avec `position{}` + `subContentId` + `metadata`, **`playable:true`**. `ih-acceptance.mjs` : **87/87** (4 assertions « player‑ready sans processeur »). **⚠️ RÈGLE** : `denormalizeDataForSave` doit produire la forme **finale jouable** (Sucrerie n'a pas de processeur) — pas un format intermédiaire dépendant d'un post‑traitement Caramel.
>     4. **Balises `<p>`/`<strong>` brutes** dans le champ texte d'un point → `field-constraints.js` Sucrerie (fichier **divergent**, pas un miroir, mais **dépendance** : `richtext-editor.js` l'importe) n'avait **pas** l'entrée `ImageHotspots`. Entrée ajoutée (additive) → `hotspots[].content[].text` = `html+latex` → éditeur **richtext WYSIWYG** au lieu de `textarea`.
>     5. **Titre vide dans l'éditeur** → le `content.json` H5P.ImageHotspots **n'a pas de titre** (le titre est une **métadonnée** h5p.json, éditée via l'onglet « Éditer les métadonnées »). Champ `title` **retiré** de la section Général du fieldSchema (il affichait un champ vide trompeur et aurait écrit dans un `content.json.title` ignoré par le player).
>     6. **Image de fond non affichée dans l'éditeur CARAMEL** (alors qu'elle l'est côté Sucrerie) → le widget image a besoin d'un `dataURL` ; or `buildBackgroundImageField`/le content.json ne portent que `path`. Sucrerie ré‑hydrate via `hydrateExistingImages` mais **`js/editor/index.js` Caramel (≠ miroir, divergent) ne le faisait pas**. Ajouté `rehydrateIHImagesFromBlob(notification.blob, jsonData)` (lit les binaires `content/images/*` du `.h5p` → `dataURL`, image de fond **et** images de blocs) appelé dans `initJsonEditor` après détection (Caramel‑only). + `normalizeIHContentNode` (miroir) conserve `dataURL` pour les images de blocs ; **strippé au save** (denormalize n'émet que `path/mime/dimensions` → pas de base64 dans le content.json). **Vérifié navigateur Caramel** : `editorLoads/bgHasDataURL/inlineHasDataURL: true`.
>
> **📘 Skill créé** : `caramel-port-to-sucrerie` (`.claude/skills/`) — checklist exhaustive de portage Caramel→Sucrerie (dépôt, i18n éditeur, vendoring lib, miroirs, `field-constraints`, denormalize jouable, médias, export) + table symptôme→cause. Toutes les leçons de ce chantier y sont capturées.

**Modale de génération (Chantier 2 + raffinements)**
1. Joindre une image → état « Analyse… » → N zones détectées → génération déverrouillée.
2. **Bouton ↻ « Relancer la détection »** : quand trop peu de zones, re‑lance la vision sur la même image (sans re‑upload) ; marche aussi après fermeture/ré‑ouverture de la modale.
3. **Bouton ✕ « Retirer l'image »** : purge tout, permet d'en charger une autre.
4. **Remplacement** : déposer image1 puis charger image2 → image2 remplace proprement (c'était le bug « ça plante »). Tester aussi re‑choisir le **même** fichier (doit re‑déclencher).
5. **Bouton « ? »** : popover des formats acceptés.
6. **Largeur barre + description** : la barre et la description s'arrêtent au même bord droit, avant « Générer en un clic » ; description sans débordement.
7. Formats : PNG, JPEG, WebP, GIF, BMP, AVIF, SVG, **HEIC/HEIF** (photo iPhone), **TIFF** → tous aboutissent à un fond net.

**Éditeur visuel (Chantier 5)** — bouton « Éditer » sur l'activité générée
8. La modale d'édition s'ouvre (3 sections : Général / Apparence / Points). Le **texte alternatif** affiche la légende vision et est éditable.
9. **Apparence** : couleur globale (color picker) + type d'icône (Numéros/Icône/Image) ; pas de couleur par point.
10. **Points** : éditer header, x/y (%), réordonner ; titre dynamique = header.
11. **Contenu polymorphe** d'un point : ajouter un bloc **Texte** (richtext WYSIWYG + LaTeX), **Image** (upload), **Audio** (upload OU URL), **Vidéo** (upload OU URL/YouTube). Vérifier le `showWhen` (les bons champs s'affichent selon `_contentType`).
12. **Enregistrer** → re‑génération → **preview** : le `.h5p` s'ouvre, image de fond + points OK, **audio/vidéo embarqués jouent** dans la preview (patch `frame.bundle.js` + blob:), YouTube joue.
13. Ré‑ouvrir l'éditeur sur le `.h5p` édité (round‑trip réel) : tout est restitué.

**Export (Chantier 6, déjà testé en prod — re‑vérifier après Chantier 5)**
14. DOCX **et** ODT **et** PDF depuis **les deux** modales (visualisation `notifications.js` ET résultat `ui.js`) : image + pastilles 1..N + légende numérotée propre.

**Packaging / régénération**
15. Vérifier qu'un point avec audio/vidéo **fichier** embarque bien le binaire dans `content/audios|videos/` du `.h5p` (dézipper) et que `h5p.json` liste H5P.Audio/Video.

**Non‑régression**
16. Générer/éditer/exporter **2‑3 autres activités** (QuizSet, Livre interactif, Vidéo interactive) — les changements à `image-manager.js`, `h5p-creator.js`, `notifications.js`, `field-renderers.js`, `content-detector.js`, `style.css` sont partagés.
17. `node --check` sur tous les JS modifiés + `node scripts/verify-all-locales.mjs` (doit rester 27/27).

---

## 1. Vision produit

**Image Hotspots** = annoter une image avec des **points cliquables** qui révèlent du contenu (texte généré par l'IA ; image/audio/vidéo insérables à la main dans l'éditeur).

Le flux unique de cette activité (≠ toutes les autres) :

```
1. L'utilisateur JOINT UN FICHIER image de fond (pas un lien) — modale calquée sur la Vidéo interactive.
2. Dès l'upload : état de chargement → l'image est envoyée à un MODÈLE VISION (Qwen 3.6 VL / Éléa via n8n)
   qui détecte ~4-5 ZONES clés pertinentes selon le CONTEXTE (discipline / thème / niveau),
   et renvoie pour chaque zone : position x,y (en %) + description de la zone et de son entourage.
3. Ces zones sont CAPTURÉES EN AMONT (stockées) → disponibles en mode « un clic » ET en mode « guidé »
   (en guidé on ne re-joint pas l'image, donc les coordonnées DOIVENT déjà exister).
4. À la génération, le LLM TEXTE habituel rédige le CONTENU de chaque point (header + texte) à partir
   des zones détectées + du contexte. L'image de fond est injectée par Caramel (jamais demandée au LLM).
5. Éditeur : choix de la COULEUR globale, édition des points (titre, x/y), et insertion MANUELLE
   d'image/audio/vidéo dans un point (la génération ne produit que du texte). [Pas de couleur par
   point : en mode « numéros », H5P n'utilise que la couleur globale.]
6. Export DOCX/ODT/PDF : image de fond avec PASTILLES NUMÉROTÉES (1,2,3…) peintes aux bonnes positions,
   puis liste numérotée du contenu de chaque zone.
```

> **Réponse à la question « lien ou fichier ? »** → **fichier**. Le format H5P.ImageHotspots n'accepte pas d'URL pour l'image de fond : le champ `image` est de type `image` (fichier embarqué dans `content/images/` du `.h5p`). C'est ce qui impose la capture en amont (image + zones) pour le mode guidé.

**Principe architectural clé (hérité de la Vidéo interactive)** : la source média (image de fond) et les coordonnées **ne sont jamais demandées au LLM** — elles sont captées par l'UI dès l'upload et **injectées en post‑traitement** dans le JSON généré, exactement comme `videoSource` pour la vidéo.

---

## 2. Le format H5P.ImageHotspots 1.11

### 2.1 Version & vendoring (FAIT)

- L'export Éléa fourni (`interface_caramel.h5p`) embarque **H5P.ImageHotspots 1.11 (patch 6)**, plus récent que la 1.10 du dépôt et au **schéma différent** (voir 2.2).
- ✅ **Déjà vendorée** : `js/vendor/h5p-libs/H5P.ImageHotspots-1.11/` (copiée depuis le bundle, 58 fichiers). `buildDirName` (`h5p-prefetch.js:61`) résout `machineName-major.minor` → `H5P.ImageHotspots-1.11` : OK.
- ✅ **Toutes les dépendances déjà vendorées** : `H5P.Image-1.1`, `H5P.Text-1.1`, `H5P.Audio-1.5`, `H5P.Video-1.6`, `H5P.Components-1.0`, `H5P.Transition-1.0`, `FontAwesome-4.5`, `jQuery.ui-1.10` ; éditeur : `ColorSelector-1.3`, `ImageCoordinateSelector-1.2`, `ShowWhen-1.0`, `VerticalTabs-1.3`.
- ⚠️ Ne **pas** supprimer les 1.8/1.9/1.10 (schéma différent). Le processor pointera sur **1.11**.
- ℹ️ Le vendoring sert **uniquement à la PREVIEW** (h5p-prefetch + h5p-manager). Le packaging `.h5p` (`h5p-creator.js:346`) n'écrit que `content/content.json` + `content/images/*` + `h5p.json` ; les libs sont fournies par la plateforme cible.

### 2.2 Schéma `content.json` v1.11 (ce que le processor doit produire)

```jsonc
{
  "image": { "path": "images/image-XXXX.png", "mime": "image/png", "copyright": {"license":"U"}, "width": 1668, "height": 914 },
  "backgroundImageAltText": "…",
  "globalIconType": "icon",        // 'icon' | 'image' | 'numbers'  ← 'numbers' = numérotation 1,2,3…
  "globalIcon": "plus",            // plus|minus|times|check|question|info|exclamation
  "globalColor": "#981d99",        // défaut H5P
  "hotspots": [
    {
      "position": { "x": 25.57, "y": 14.85, "legacyPositioning": false },   // x,y en POURCENTAGES 0–100
      "hotspotIconType": "default", // default|icon|image
      "hotspotIcon": "plus",
      "hotspotColor": "#981d99",
      "alwaysFullscreen": false,
      "header": "…",                // optionnel
      "content": [                  // sous‑contenus polymorphes
        { "library": "H5P.Text 1.1", "params": {"text":"<p>…</p>"}, "metadata": {…}, "subContentId": "uuid-v4" }
        // aussi possibles : H5P.Image 1.1, H5P.Audio 1.5, H5P.Video 1.6
      ]
    }
  ],
  "untitledHotspotLabel": "Untitled Hotspot",
  "closeButtonLabel": "Fermer",
  "containsAudioVideoLabel": "Contains Audio/Video"
}
```

Nouveautés 1.11 vs 1.10 utiles ici : `globalIconType:"numbers"` (numérotation), et couleurs/icônes **par point** (`hotspotColor`, `hotspotIconType`…).

### 2.3 Format intermédiaire « plat » (ce que le LLM produit, ce que l'éditeur édite)

Plus simple que le content.json — le **processor** traduit en v1.11.

```jsonc
{
  "title": "Anatomie de la fleur",
  "globalColor": "#1768c4",
  "globalIconType": "numbers",
  "hotspots": [
    { "x": 31.5, "y": 22.0, "header": "Le pétale", "text": "<p>Les <strong>pétales</strong>…</p>" }
  ]
}
```

---

## 3. Architecture & flux de bout en bout

```
                       ┌─────────────────────────────── SIDEBAR (modale d'activité) ───────────────────────────────┐
  Upload fichier image │  [glisser-déposer / choisir]  →  état: uploading → analyzing(vision) → ready(N zones)      │
        │              │            │                                                                               │
        ▼              │            ▼                                                                               │
  image-manager        │   js/services/hotspot-vision.js  ──POST──►  n8n  ──►  ILaaS qwen-3.6 (VL, 0–1000)            │
  processBackgroundImage│   analyzeImageZones(dataURL, ctx)  ◄──poll──     {zones:[{x,y,label,description}]}         │
   (fond, PNG, ~1920)  │            │                                                                               │
        │              │            ▼                                                                               │
   registre Map        │   imageHotspotStates.set(key, {image, dataURL, zones, altText})   ← CAPTURE EN AMONT       │
   + sessionStorage    │            │                                                                               │
                       └────────────┼───────────────────────────────────────────────────────────────────────────┘
                                    ▼
        ┌─────────── Mode « un clic » OU « guidé » (lisent tous deux imageHotspotStates) ───────────┐
        │  buildImageHotspotsPrompt(zones, ctx) → generateH5PWithLLM (texte, mistral-small-4)         │
        │  → JSON intermédiaire {hotspots:[{x,y,header,text}]}                                         │
        │  → post-traitement: parsed.image = état.image (injecté, non demandé au LLM)                  │
        └────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                          ▼
   json-healer → processors/ImageHotspots.js → content.json v1.11 → h5p-creator → .h5p
                                          │
                                          ├─► Preview (h5p-manager + vendor 1.11 + patch frame.bundle.js)
                                          ├─► Éditeur visuel (content-detector + field-renderers : couleurs, points, contenu polymorphe)
                                          └─► Export DOCX/ODT/PDF (hotspot-overlay-renderer : pastilles numérotées + liste)
```

**Deux appels IA distincts** :
1. **Vision** (Qwen 3.6 VL, multimodal, en amont) → *structure* : positions (0–1000→%) + labels + descriptions + description globale.
2. **Texte** (mistral‑small‑4, à la génération) → *contenu pédagogique* de chaque point.

---

## 4. Décisions produit (recommandations)

| # | Question | Recommandation | Justification |
|---|----------|----------------|---------------|
| D1 | Image = lien ou fichier ? | **Fichier** (upload) | Le format n'accepte pas d'URL pour le fond. |
| D2 | Mode d'icône par défaut | **`numbers`** (numérotation) | Colle au besoin export (pastilles numérotées) et à la légende. Éditable. |
| D3 | Couleur proposée par le LLM ? | LLM **suggère** `globalColor` (défaut `#981d99`), modifiable dans l'éditeur | Cohérent avec `baseColor` du Livre interactif. |
| D4 | Génération produit quoi ? | **Texte uniquement** (1 `H5P.Text` par point) | Demande explicite. Média = insertion manuelle éditeur. |
| D5 | Sous‑contenus d'un point | **Format + éditeur gèrent TOUT le H5P de base** : Texte / Image / Audio / Vidéo, **insertion manuelle avec embarquement de fichier** (le format doit être complet et parfait). | ✅ **Décidé** : « être en mesure de gérer ce que propose le format H5P de base ». Image = `image-manager` (existant) ; Audio/Vidéo = extension d'un `media-manager` (upload fichier embarqué dans `content/`) **+** URL/YouTube (mode natif H5P.Video). |
| D6 | Nombre de zones | **Rapide = déterminé intelligemment par l'IA selon l'image** (pas de nombre imposé) ; **Avancé = forcé** au nombre demandé (`nombreQuestions`/`[NOMBRE_ELEMENTS]`) | ✅ **Affiné le 2026‑06‑30** (cf. Chantier 4bis). Même logique que Quiz / Mots croisés. |
| D7 | Re‑détection si le contexte change après upload | **Figer** les zones au 1er upload (re‑lançable manuellement via « Relancer la détection ») | Comme la transcription vidéo (figée), bouton retry dispo. |
| D8 | Pas de génération par lots | **Aucun `chunking`** | Activité non « list‑shaped » (positions interdépendantes), 4‑5 points < mur 59 s. |
| D9 | Numérotation export | Ordre du tableau `hotspots` (1..N), couleur unique `globalColor` | Simplicité/lisibilité légende ; tri gauche→droite possible en v2. |
| D10 | Placement des points dans l'éditeur | **Champs X/Y (%) simples** | ✅ **Décidé**. Portable Sucrerie sans effort. (Éditeur visuel « cliquer sur l'image » = v2 éventuelle.) |
| D11 | Cible Sucrerie | **`sucrerie.forge.apps.education.fr`** (prod) | ✅ **Décidé**. |
| D12 | Modèle vision | **`qwen-3.6-35b-instruct`** (Qwen VL) | ✅ **Fait & testé**. Pixel‑perfect ; coords 0–1000 normalisées (÷10). Gemma écarté (instable). |

---

## 5. Chantiers d'implémentation

Ordre conseillé : **0 → 3 (déblocage vision) → 1 → 4 → 2 → 5 → 6 → 7 → 8**. (La vision est la dépendance bloquante : la valider tôt.)

### Chantier 0 — Vendoring & pré‑requis (FAIT / à vérifier)

- ✅ `js/vendor/h5p-libs/H5P.ImageHotspots-1.11/` vendorée.
- ☐ Vérifier que la **preview** charge bien la 1.11 (après Chantier 1, tester un `.h5p` généré dans le lecteur intégré ; le patch `frame.bundle.js` regex `data:image/` doit être en place — CLAUDE.md piège 1).

### Chantier 1 — Pipeline H5P (registre + processor + healer + contraintes)

**Fichiers à créer :**
- `js/h5p/processors/ImageHotspots.js`

**Fichiers à modifier :**
- `js/core/definitions.js` — entrée `h5pModules.ImageHotspots` + `customOrder`
- `js/h5p/processors/index.js` — **triple registre** (`processorMetadata`, `processorLoaders`, `libraryToKey`)
- `js/h5p/json-healer.js` — exclure ImageHotspots du bloc commun H5P (sinon `overallFeedback`/`behaviour` parasites)
- `js/h5p/field-constraints.js` — entrée `ImageHotspots`

**1.1 `definitions.js`** (après `InteractiveVideo`, ~l.404) :
```js
ImageHotspots: {
    name: "h5p_image_hotspots_name",
    englishName: "ImageHotspots",
    machineName: "H5P.ImageHotspots",
    description: "h5p_image_hotspots_description",
    image: "assets/images/activities/image-hotspots-icon-color.webp", // icône déjà présente
    promptId: "imageHotspotsResultat",
    jsonInputId: "imageHotspotsJsonInput",
    createBtnId: "createImageHotspotsH5P",
    categories: ["memory", "h5p"],          // à arbitrer (cf. D-cat)
    hidden: false,
    requiresBackgroundImage: true,           // NOUVEAU flag → branche la modale upload+vision (Chantier 2)
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["H5P", "DOCX", "ODT", "PDF"]
    // PAS de `chunking` (non list-shaped)
}
```
+ insérer `'ImageHotspots'` dans `customOrder` (~l.561, après `InteractiveVideo`).

**1.2 `processors/index.js`** — triple registre :
```js
// processorMetadata (~l.23) — SOURCE DE VÉRITÉ des dépendances (export + preview + mentions légales)
'ImageHotspots': {
  machineName: 'H5P.ImageHotspots',
  version: { major: 1, minor: 11 },
  extraDependencies: [
    { machineName: 'FontAwesome',    majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.Text',       majorVersion: 1, minorVersion: 1 },
    { machineName: 'H5P.Image',      majorVersion: 1, minorVersion: 1 },
    { machineName: 'H5P.Audio',      majorVersion: 1, minorVersion: 5 },
    { machineName: 'H5P.Video',      majorVersion: 1, minorVersion: 6 },
    { machineName: 'H5P.Components',  majorVersion: 1, minorVersion: 0 },
    { machineName: 'jQuery.ui',       majorVersion: 1, minorVersion: 10 }
  ]
},
// processorLoaders (~l.361)
'ImageHotspots': () => import('./ImageHotspots.js'),
// libraryToKey (~l.411)
'H5P.ImageHotspots': 'ImageHotspots',
```
> ⚠️ La `library.json` 1.11 ne déclare QUE FontAwesome+Transition. Les sous‑libs de contenu (Text/Image/Audio/Video/Components/jQuery.ui) sont chargées **dynamiquement au runtime** → **doivent** être listées manuellement dans `extraDependencies` (même piège que CoursePresentation), sinon absentes du `h5p.json` exporté ET non préchargées en preview.

**1.3 `processors/ImageHotspots.js`** (squelette) :
```js
/**
 * Processeur H5P — Image Hotspots (H5P.ImageHotspots 1.11).
 * Transforme le JSON intermédiaire plat {hotspots:[{x,y,header,text}]} en content.json v1.11.
 * L'image de fond est injectée en amont (champ `image` déjà rempli par l'UI / image-manager).
 * @module processors/ImageHotspots
 */
import { generateUUID, formatTextToHtml, debugLog } from '../../core/utils.js';

const DEFAULTS = { globalColor: '#981d99', globalIconType: 'numbers', globalIcon: 'plus' };

function makeTextContent(html) {
  return {
    params: { text: html },
    library: 'H5P.Text 1.1',
    metadata: { contentType: 'Text', license: 'U', title: 'Sans titre Text' },
    subContentId: generateUUID()
  };
}
function clampPct(v) { const n = parseFloat(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50; }

export default {
  process(data /*, helpers */) {
    const hotspots = Array.isArray(data.hotspots) ? data.hotspots : [];
    const content = {
      image: data.image || undefined,                  // injectée par l'UI (image-manager)
      backgroundImageAltText: data.backgroundImageAltText || '',
      globalIconType: data.globalIconType || DEFAULTS.globalIconType,
      globalIcon: data.globalIcon || DEFAULTS.globalIcon,
      globalColor: data.globalColor || DEFAULTS.globalColor,
      hotspots: hotspots.map(h => {
        const html = formatTextToHtml(h.text || '');
        const node = {
          position: { x: clampPct(h.x), y: clampPct(h.y), legacyPositioning: false },
          alwaysFullscreen: !!h.alwaysFullscreen,
          hotspotIconType: h.hotspotIconType || 'default',
          hotspotIcon: h.hotspotIcon || DEFAULTS.globalIcon,
          hotspotColor: h.hotspotColor || data.globalColor || DEFAULTS.globalColor,
          content: html ? [ makeTextContent(html) ] : []
        };
        if (h.header) node.header = h.header;
        return node;
      }),
      untitledHotspotLabel: data.untitledHotspotLabel || 'Untitled Hotspot',
      closeButtonLabel: data.closeButtonLabel || 'Fermer',
      containsAudioVideoLabel: data.containsAudioVideoLabel || 'Contains Audio/Video'
    };
    debugLog('ImageHotspots', `${content.hotspots.length} hotspots générés`);
    return content; // retour `content` direct (deps statiques dans processorMetadata)
  }
};
```

**1.4 `json-healer.js`** — éviter les clés parasites :
```js
// bloc commun H5P (~l.735)
if (H5P_MODULE_KEYS.has(moduleKey) && moduleKey !== 'ImageHotspots') { /* overallFeedback/behaviour */ }
```
(Ou bien ne pas ajouter `'ImageHotspots'` à `H5P_MODULE_KEYS`.) Cas structurel optionnel : normaliser `x`/`y` en nombres sur le format plat.

**1.5 `field-constraints.js`** (sur le format intermédiaire **plat**) :
```js
'ImageHotspots': {
  platform: 'H5P', machineName: 'H5P.ImageHotspots',
  fields: {
    'title':                  { render: 'plain' },
    'backgroundImageAltText': { render: 'plain' },
    'globalColor':            { render: 'plain' },
    'hotspots[].header':      { render: 'plain' },
    'hotspots[].text':        { render: 'html+latex' },   // H5P.Text supporte HTML riche (+ maths selon discipline)
    'hotspots[].hotspotColor':{ render: 'plain' }
  }
}
```

### Chantier 2 — Modale d'upload + capture vision en amont (cœur UX)

> Patron à cloner : **Vidéo interactive**. ⚠️ Ce n'est **pas** une modale séparée — c'est une **section inline** dans la sidebar de l'activité, pilotée par `data-state`, captée **dès l'upload** (pas au clic « Générer »). C'est ce timing qui rend l'état disponible en mode Rapide **et** Guidé.

**Fichiers à modifier :** `js/ui/ui.js`, `css/base/style.css`
**Fichiers à créer :** (panneau éditeur → Chantier 5)

**2.1 HTML de section** (clone de `ui.js:1400-1418`, garde `module.requiresBackgroundImage`) : remplacer l'`input type=url` par un **widget d'upload** (`input type=file accept=image/*` + zone de dépôt + miniature), en gardant la structure `data-state` + overlay de chargement + bouton stop. Pattern d'upload existant : `caramelia/dom.js:49` (input file image + FileReader base64).

**2.2 Machine d'états** — créer `initBackgroundImageSection(moduleKey, module)` calqué sur `initVideoUrlSection` (`ui.js:758`). Réutiliser tel quel : `setState` (empty/checking/ready/error), `setProgress`/voile, `setMsg`, `setGenEnabled`/`refreshCreateGate` (double verrou). Remplacer `runDetection` par `runVisionAnalysis(file)` :
```
1. FileReader.readAsDataURL(file) → dataURL ; new Image() → width/height.
2. processBackgroundImage(file) (image-manager, Chantier 3b) → registre Map sous id 'image'.
3. setState('checking') + setProgress('Analyse de l’image…') + setGenEnabled(false).
4. token de course (myToken!==runToken) + AbortController (clone ui.js:1114,1151-1152).
5. analyzeImageZones(dataURL, readContextParams(), {signal}) (Chantier 3).
6. succès → imageHotspotStates.set(key, {image, dataURL, width, height, zones, altText})
            → setImageHotspotZones(zones, {width,height}) + injectImageZonesIntoPrompt(module)
            → setState('ready') + setGenEnabled(true).
7. échec → setState('error') + setMsg('…', 'Relancer la détection', () => runVisionAnalysis(file)).
```

**2.3 Capture en amont** — `const imageHotspotStates = new Map()` (miroir de `videoStates` `ui.js:465`). Persistance robuste pour le mode guidé : doubler par `sessionStorage` (`caramel_ih_zones` + `caramel_ih_background` ou un id stable du registre), car `clearAllImages()` entre générations viderait le fond.

**2.4 Injection dans la génération** — deux chemins (clones) :
- **Bouton « un clic »** (clone `ui.js:2758-2841`) : garde `imageHotspotStates.get(key)?.zones?.length` ; `prompt = buildImageHotspotsPrompt(st.zones, st.imageMeta)` ; `generateH5PWithLLM` ; post‑traitement → `parsed.image = st.image` (injecté), `parsed.backgroundImageAltText = st.altText`, fusion `position` des zones si absente ; `parsed.globalIconType = 'numbers'` (D2) ; clic `createBtn`.
- **Bouton « Créer »/guidé** (clone `ui.js:2600-2661`) : si le JSON collé n'a pas d'`image`, injecter depuis l'état.

**2.5 CSS** — cloner `.video-url-field*` (`style.css:7079-7284`) → `.img-bg-field*` (mêmes états/voile/jauge). ⚠️ Sucrerie n'a pas de modale ; ce CSS reste Caramel‑only. ✅ FAIT.

> État Chantier 2 : ✅ **fait et testé en prod** (le flux upload → vision → génération fonctionne). Restent les deux raffinements ci‑dessous (2bis, 2ter).
>
> **Raffinements modale (2026‑06‑30, suite retours utilisateur)** : la section d'upload (`initBackgroundImageSection`) expose désormais, une fois une image chargée, un bouton **« relancer la détection » (↻)** — re‑lance la vision sur la **même** image (`runVisionAnalysis()` sans argument re‑détecte sur `currentEntry`, utile quand trop peu de zones sont trouvées ; marche aussi après restauration de la modale) — et un bouton **« retirer l'image » (✕, `clearImage`)** qui purge état/registre/zones et permet d'en charger une autre proprement. **Remplacement fiabilisé** : `currentEntry` suivi explicitement, `registerImage('image', …)` remplace au même id, `fileInput.value` réinitialisé (re‑sélection du même fichier possible). Ajout d'un **bouton d'aide « ? »** (popover des formats acceptés, `openImageHelpPopover`, miroir de l'aide vidéo) en **frère** de `.video-url-field` dans `.video-url-row` → la barre s'aligne avant le bouton « générer en un clic » via le `alignVideoHelpButton` existant (générique). i18n : `ih_help_title`/`ih_help_intro`/`ih_help_formats`/`ih_retry_detection`/`ih_remove_image` ×11 (locales → 2444 clés). *(Modale = Caramel‑only, pas de propagation Sucrerie.)*
>
> **Mise en page de la description (2026‑06‑30)** : `css/base/style.css` → `.modal-tuto-content { min-width: 0 }` (corrige le débordement flexbox classique : sans ça, l'item `flex-grow:1` ne rétrécit pas sous la taille de son contenu et la description longue débordait par‑dessus la colonne du toggle Simple/Avancé). `alignVideoHelpButton` (`ui.js`) **aligne en plus le bord droit de la description (`.modal-tuto-content > p`) sur celui du champ (la barre)** par mesure dynamique → la description fait la **même largeur que la barre** et revient à la ligne naturellement (pas de coupure forcée — un essai de `<br>` après la 1ʳᵉ phrase a été retiré sur retour utilisateur). Vaut pour les modales image **et** vidéo.

### Chantier 2bis — Persistance de l'image dans la modale ✅ FAIT (2026‑06‑30)

> **Implémenté** dans `js/ui/ui.js`. **Restauration** : à la fin de `initBackgroundImageSection`, si `imageHotspotStates.has(moduleKey)` → `registerImage('image', st.entry)` (le registre est vidé par `clearAllImages()` après chaque packaging), `setPicked(st.fileName, st.dataURL)`, `injectImageZonesIntoPrompt(...)`, `setState('ready')`, `setGenEnabled(true)` ; sinon état vide. `fileName` désormais stocké dans l'état à l'upload. **Purge sur contexte** : branchée sur le **`handleContextChange` existant** (le mécanisme déjà en place qui réinitialise le prompt quand un champ Rapide/Avancé change), via une signature `visionContextSig()` (qui/quoi/niveau/nombre, **hors OCR/RAG**) comparée à `sessionStorage[caramel_ih_vision_ctx]` — tant que cette signature ne change pas, l'image **reste**. À l'inverse de la PRD initiale, **on n'attache PAS de listeners `input` par‑section** : `#qui/#quoi/#niveau/#nombreQuestions` sont des **singletons globaux** d'`index.html`, donc des listeners par‑modale s'empileraient. La purge (`invalidateImageHotspotsContext`) vide la Map, `unregisterImage('image')`, `setImageHotspotZones(null)`, et réinitialise l'UI de la section ouverte via `section._resetImage`. Le double‑génération sans ré‑ouverture est couvert par un ré‑`registerImage` avant packaging dans le handler `createBtn`.

Comportement attendu (demandé le 2026‑06‑30), cohérent avec la Vidéo interactive :

1. **L'image RESTE quand on ferme/ré‑ouvre la modale.** Si on quitte la modale puis on re‑clique sur la tuile, l'image jointe + les zones détectées doivent être **restaurées** (miniature + état « prêt » + génération déverrouillée), sans re‑upload ni re‑analyse. `imageHotspotStates` (Map module‑level) survit déjà ; il manque la **restauration de l'UI** au ré‑rendu de la sidebar.
2. **L'image DISPARAÎT si on modifie le contexte** (champs « qui / quoi / niveau / nombre » des modes Rapide/Avancé). Comme changer le lien invalide la transcription vidéo, **changer le contexte invalide les zones** (la détection vision est contextuelle) → on purge l'image + les zones et on re‑verrouille la génération (l'utilisateur re‑joint son image pour relancer l'analyse avec le nouveau contexte).

**Implémentation (`ui.js`, dans `initBackgroundImageSection`)** :
- *Restauration* (miroir `ui.js:1214-1226` côté vidéo) : à l'init, `if (imageHotspotStates.has(moduleKey))` → `registerImage('image', st.entry)` (re‑bundle), `setPicked(st.fileName, st.dataURL)`, `setState('ready')`, `setGenEnabled(true)`, `injectImageZonesIntoPrompt(module, st.zones, {width,height}, st.imageDescription)`. ⇒ stocker `fileName` dans l'état lors de l'upload.
- *Purge sur contexte* (miroir `lockGate` vidéo) : attacher un listener `input` sur `#qui`, `#quoi`, `#niveau`, `#nombreQuestions` → `if (imageHotspotStates.has(moduleKey)) { imageHotspotStates.delete(moduleKey); unregisterImage('image'); setImageHotspotZones(null); reset champ → 'empty' (label par défaut + miniature cachée) ; setGenEnabled(false); }`. Ne purger que si une image est déjà capturée (ne pas gêner la saisie initiale avant upload). Les champs de contexte étant dans la sidebar re‑rendue par module, les listeners sont nettoyés au changement de modale.
- Piège : ne PAS appeler `clearAllImages()` sur fermeture de modale tant qu'une session IH est active (sinon le fond uploadé disparaît du registre). Vérifier l'ordre d'appel de `clearAllImages` entre générations.

### Chantier 2ter — Formats d'image supportés + conversion transparente ✅ FAIT (2026‑06‑30)

> **Implémenté.** `js/h5p/image-manager.js` : `classifyImage(file)` (MIME + repli extension si `File.type` vide — fréquent pour HEIC) et `ensureCanvasDecodable(file)` (insérée en tête de `processBackgroundImage`). HEIC/HEIF → `heic2any` (`toType:'image/jpeg'`), TIFF → `UTIF` (decode → RGBA → canvas → PNG) ; les deux **lazy‑loadées** via `js/core/lib-loader.js` (`loadHeic2any`/`loadUTIF`, globals `window.heic2any`/`window.UTIF`). Pour les TIFF **deflate**, `loadUTIF` charge d'abord **pako** (`loadPako`, `window.pako`) car UTIF.js capte `self.pako` à l'exécution → l'ordre est garanti. La **sortie** est normalisée à PNG/JPEG (WebP conservé) ; GIF/BMP/AVIF/SVG → PNG. `js/ui/ui.js` : `accept="image/*,.heic,.heif,.tif,.tiff,.avif,.bmp,.svg"` + drop tolérant aux MIME vides (filtre par extension). Erreur claire `ih_image_format_error` si échec (SVG sans dimensions, format inconnu). **Libs vendorées** (`js/vendor/heic2any/0.0.4/`, `js/vendor/utif/3.1.0/`, `js/vendor/pako/2.1.0/`) **et inscrites aux mentions légales** (`assets/templates/mentions-legales.html` + `legal_library_heic2any`/`legal_library_utif`/`legal_library_pako` ×11 locales). heic2any utilise un **Web Worker blob** : ✅ déjà autorisé par le `_headers` de prod (`worker-src 'self' blob:`, `script-src` avec `'wasm-unsafe-eval' blob:`) — aucun changement requis.
>
> 🔴 **RAPPEL DÉPLOIEMENT (obligatoire)** — toute **nouvelle bibliothèque JS** vendorée doit être **inscrite aux mentions légales** (cf. ci‑dessus) ; et l'endpoint **vision** doit être injecté via le **`.gitlab-ci.yml`** (cf. §0 / Chantier 3).

Demandé le 2026‑06‑30 : **déterminer les formats acceptés** et, pour tout format standard non géré nativement par H5P, **le convertir automatiquement** dans un format compatible, de façon **transparente** pour l'utilisateur.

**Formats de SORTIE embarqués dans le `.h5p`** (ce que H5P.Image lit de façon fiable) : **PNG**, **JPEG** (et **WebP** sur lecteurs récents). → on **normalise toujours** l'image de fond vers **PNG** (sans perte, garde la transparence) ou **JPEG** pour les très grosses photos. Jamais de format exotique dans le paquet.

**Formats d'ENTRÉE acceptés de l'utilisateur** (large) :
- *Décodables par le navigateur* (canvas) → conversion immédiate, gratuite : **PNG, JPEG, WebP, GIF, BMP, AVIF, SVG**. C'est déjà le mécanisme de `processBackgroundImage` (`loadImageFromBlob` → `rasterizeImage`) ; il suffit d'**élargir** `BG_IMAGE_CONFIG.acceptedTypes` et l'attribut `accept` du `<input type=file>` (→ `accept="image/*"`).
- *NON décodables nativement* (fréquents pourtant) : **HEIC/HEIF** (photos iPhone), **TIFF**. → conversion via une **lib lazy‑loadée** avant le canvas :
  - HEIC/HEIF → `heic2any` (ou équivalent WASM) → Blob JPEG/PNG → canvas.
  - TIFF → `UTIF.js` / `tiff.js` → ImageData/Blob → canvas.
  - Ces libs s'ajoutent à `js/vendor/` + `core/lib-loader.js` (lazy, comme Tesseract/Mammoth). Repli alternatif possible : **conversion côté serveur n8n** (un endpoint `image-convert` ou une étape dans le workflow vision) si on veut éviter le poids WASM côté client.

**UX transparente** : l'utilisateur joint n'importe quelle image ; la conversion se fait pendant l'état « Analyse de l'image… » (déjà affiché). En cas d'échec total de décodage/conversion → message clair (`ih_image_format_error`) invitant à fournir un PNG/JPEG.

**Implémentation (`image-manager.js`)** : insérer une étape `await ensureCanvasDecodable(file)` au début de `processBackgroundImage` qui, selon le type/extension, lazy‑load le convertisseur adéquat et renvoie un Blob décodable ; le reste (resize 1920 + `rasterizeImage` → PNG) est inchangé. Mettre à jour `acceptedTypes` + l'`accept` du champ. Critère d'acceptation : joindre un HEIC d'iPhone et un PNG transparent → tous deux aboutissent à un fond net dans le `.h5p`, sans message d'erreur.

### Chantier 3 — Service vision (Qwen 3.6 VL via n8n) ✅ FAIT

État : ✅ **fait, déployé en prod, testé**. Bilan tel que construit (≠ plan initial Gemma/async) :

**Modèle = `qwen-3.6-35b-instruct`** (Qwen VL). Benchmark live (2026‑06‑30) sur images à vérité connue :
| Modèle | Précision coordonnées | Notes |
|---|---|---|
| **qwen‑3.6‑35b‑instruct** | **pixel‑perfect** | ~1 s. Featured Caramel. **Retenu.** |
| mistral‑small‑3.2‑24b | correct mais grossier (grille) | ~6 s |
| mistral‑small‑4‑119b | grossier | ~2 s |
| gemma‑4‑31b | 100,100 / 504 | instable. **Écarté.** |
| mistral‑medium‑250523 | pas multimodal | — |

**Découverte majeure — échelle des coordonnées** : Qwen renvoie ses coordonnées en **0–1000 normalisé** (format natif VL), pas en 0–100 (sur petites images synthétiques il sortait du 0–100 ; sur photo réelle, du 0–1000). → **détection d'échelle automatique** d'après le max observé dans la réponse : `max>100 ⇒ ÷10` (0–1000→%), `≤1 ⇒ ×100` (0–1→%), sinon déjà en %. Implémentée **côté workflow ET côté client** (défense en profondeur). Validé sur image réelle (F1).

**Architecture retenue = SYNCHRONE** (pas de submit/poll/Postgres) : la vision sur une image = 1 appel ILaaS ~1–3 s, bien sous le mur. Calquée sur « Fetch page web » / « TEST Génération Image ».

- **Workflow** `n8n-workflows-bas/Caramel · Vision Image Hotspots — Détection (bas).json` (Webhook `caramel-vision-detect-bas` → Préparer requête → Appel ILaaS `gemma`→`qwen` via credential `iLaaS` → Parser zones (normalise l'échelle) → Répondre JSON + CORS). Contrat : `POST {image, context:{qui,quoi,niveau}, count?, model?, lang?, prompt?}` → `{imageDescription, zones:[{x,y,label,description}], model}`. Multilingue (`lang`), prompt surchargeable (`prompt`), modèle surchargeable (`model`). Image **jamais persistée**.
- **Client** : `js/core/endpoints.js` (`visionDetect` = `CARAMEL_VISION_DETECT_URL`, à ajouter aux vars CI prod) + `js/services/hotspot-vision.js` (`detectImageZones(dataURL, {context, count, lang, model, signal})`, `DEFAULT_VISION_MODEL = 'qwen-3.6-35b-instruct'`, normalisation d'échelle + timeout/abort).
- **Vision décrit dans la langue de l'interface** (`lang` passé depuis `currentLang`).
- **Repli** : si l'endpoint échoue, l'appelant capte l'erreur (placement manuel dans l'éditeur reste possible).

**3b. Traitement image de fond** — ✅ `js/h5p/image-manager.js` : `processBackgroundImage(file, {maxDimension:1920})` (préserve format/transparence, GIF→PNG, **pas** de 800×600/JPEG forcé) + `buildBackgroundImageField(entry)`. *(À élargir aux formats exotiques, cf. Chantier 2ter.)*

**Prompt vision (déployé, FR)** : « Analyse l'image dans ce contexte … Identifie 3 à N zones clés. Pour chaque zone : `x`,`y` en **échelle 0–1000** (centre), `label`, `description` (zone + entourage). + `imageDescription` globale. Rédige dans la langue demandée. Réponds en JSON strict. »

### Chantier 4 — Prompts, exemple & flux de génération

**Fichiers à créer :** `assets/data/prompts/image_hotspots.md` (doc), `assets/data/examples/image_hotspots_1.json` (exemple).
**Fichiers à modifier :** `js/services/prompt-generator.js`, locales (4 clés `prompt_image_hotspots_*`).

- ⚠️ Les `.md` de `prompts/` et `.json` de `examples/` **ne sont PAS lus au runtime** : ce sont des docs. Le prompt réel et l'exemple vivent dans les **clés i18n** `prompt_image_hotspots_{regles_specifiques,sources,structure_json,exemple_rendu}` (×11 locales). Il faut recopier l'exemple JSON (échappé) dans `prompt_image_hotspots_exemple_rendu`.
- `prompt-generator.js` — ajouter `imageHotspots` dans `ACTIVITY_CONFIG`, l'état module‑level `currentImageHotspotZones` + `setImageHotspotZones(zones, imageMeta)` + `formatZonesForPrompt` + `buildImageHotspotsPrompt`, et brancher `getPrompts()` (~l.374) pour injecter les zones en **SOURCES** au lieu de l'OCR (miroir exact du pattern `currentVideoSources`).
- Le prompt **n'évoque que les zones + le texte** ; il ne demande ni image de fond ni média (injectés/manuels).
- ⚠️ Séparateur conditionnel `||` (nombre de zones) traité par regex — utiliser un deux‑points **ASCII** (piège zh/jp).

Exemple `examples/image_hotspots_1.json` :
```json
{ "title": "Anatomie de la fleur", "globalColor": "#1768c4", "globalIconType": "numbers",
  "hotspots": [
    { "x": 31.5, "y": 22.0, "header": "Le pétale", "text": "<p>Les <strong>pétales</strong> colorés attirent les pollinisateurs.</p>" },
    { "x": 52.0, "y": 48.5, "header": "L'étamine", "text": "<p>L'<strong>étamine</strong> est l'organe mâle ; elle produit le pollen.</p>" },
    { "x": 50.0, "y": 63.0, "header": "Le pistil", "text": "<p>Le <strong>pistil</strong> est l'organe femelle, au centre.</p>" },
    { "x": 47.0, "y": 86.0, "header": "La tige", "text": "<p>La <strong>tige</strong> soutient la fleur et conduit la sève.</p>" } ] }
```

### Chantier 4bis — Nombre de zones : ~4‑5 souple (Rapide) / forcé (Avancé) — ✅ côté vision, à VÉRIFIER bout‑en‑bout

Affiné le 2026‑06‑30. Aligné sur Quiz / Mots croisés :

- **Mode Rapide (aucun nombre saisi)** : viser **environ 4 à 5 zones**, en disant à l'IA qu'elle peut en mettre **un peu plus ou un peu moins** selon ce que l'image justifie vraiment (pas un nombre rigide).
- **Mode Avancé (champ « nombre d'éléments » renseigné)** : **forcer EXACTEMENT** ce nombre de zones (mécanisme `[NOMBRE_ELEMENTS]` / `||`).

**État** — ✅ **fait côté vision** :
- Client (`hotspot-vision.js` + `ui.js`) : envoie `count` **uniquement** en mode Avancé avec un nombre ; en Rapide, `count` omis.
- Workflow (`PREP_CODE`) : `forced = body.count` → si présent « Identifie **EXACTEMENT N** zones » ; sinon « Identifie **environ 4 à 5** zones (un peu plus/moins si l'image le justifie) ». *(Plus de plafond `count=5` parasite.)* → **à ré‑importer**.

**Reste à vérifier** : cohérence avec le **prompt texte** `prompt_image_hotspots_regles_specifiques` qui garde la règle « **un point par zone détectée en SOURCES** » (le nombre est déjà fixé par la vision) + la partie `|| [NOMBRE_ELEMENTS]` pour l'Avancé. **Critère d'acceptation** : Rapide → ~4‑5 points sensés (variable selon l'image) ; Avancé « 8 » → exactement 8 points. À répercuter dans les 11 locales.

### Chantier 4ter — Description globale RICHE (contexte) — ✅ côté vision

Affiné le 2026‑06‑30 : la `imageDescription` (vision) doit être **riche et détaillée** (sujet, décor, éléments importants, ambiance) **et extraire le TEXTE VISIBLE** de l'image (panneaux, logos, étiquettes, sponsors, titres, nombres, marques…), car elle sert de **contexte global** au LLM texte. ✅ Implémenté dans le prompt vision (`PREP_CODE` : « description GLOBALE riche, 3 à 5 phrases + extraction du texte visible »). À ré‑importer. *(Bénéfice : sur une photo type F1, le LLM dispose des sponsors/numéros/noms lus sur l'image pour rédiger un contenu pertinent.)*

### Chantier 5 — Éditeur JSON visuel

> ✅ **RÉALISÉ — voir le §0 (« Chantier 5 ») pour l'état RÉEL et exhaustif.** Le plan ci‑dessous est l'intention initiale et diverge sur deux points : (1) **deux nouveaux renderers** `audio`/`video` ont finalement été créés (`field-renderers.js`) car l'upload de fichier audio/vidéo n'était pas couvert ; (2) **pas de couleur par point** (retirée sur retour utilisateur — inutile en mode « numéros ») ; le texte alternatif est un champ `text` dédié (pas le sous‑champ `altTextField`).

> Bonne nouvelle : **aucun nouveau renderer**. `color`, `image`, `dynamicObject`, array `nested` + `showWhen` + `dynamicTitleField` existent déjà. Tout se fait par **configuration de schéma** + `normalize`/`denormalize`. Patron le plus proche : **Livre interactif** (`chapters[]`→`content[]` polymorphe via `_blockType`).

**Fichiers à modifier :** `js/editor/content-detector.js` (miroir Sucrerie), `js/h5p/field-constraints.js`, locales (`editor_ih_*`).

- `contentSignatures['ImageHotspots']` (détection JSON), `titleKeyToModuleKey['h5p_image_hotspots_name']`, `moduleTranslationKeys['ImageHotspots']`.
- `fieldSchemas['ImageHotspots']` : section *Général* (image de fond via `type:'image'` + altText), section *Apparence* (`globalColor` via `type:'color'`, `globalIconType` select avec **Numéros/Icône/Image**, `globalIcon` conditionnel), section *Points* (array `hotspots` avec `dynamicTitleField:'header'`, `position.x`/`position.y` en `number` 0–100, `hotspotColor` color collapsible, et **`content` array `nested`** avec `_contentType` select Text/Image/Audio/Video + champs `showWhen`).
- `normalizeDataForEditor` (case ImageHotspots) : aplatir `content[].library` → `_contentType`, extraire `text`/`image`/`audioUrl`/`videoUrl`.
- `denormalizeDataForSave` (case ImageHotspots) : reconstruire **minimalement** `library`/`text`/`image`/url + `subContentId` ; laisser le **processor** compléter `params/metadata` (⚠️ l'éditeur est miroir Sucrerie → **pas** de dépendance à `json-healer`/Caramel‑only).
- `field-constraints.js` : `hotspots[].text` en `html+latex` → richtext WYSIWYG automatique.
- ⚠️ **Toute modif de `js/editor/` doit être propagée byte‑identique à Sucrerie** (CLAUDE.md item 7).
- Préserver `position.legacyPositioning` (champ caché) sinon décalage du rendu.

### Chantier 6 — Export DOCX / ODT / PDF (pastilles numérotées + légende) ✅ FAIT & TESTÉ EN PROD (2026‑06‑30)

> **Implémenté** (design simplifié vs plan initial). `js/renderers/hotspot-overlay-renderer.js` → `composeNumberedHotspotImage(bgSrc, positions, {color})` : `drawImage` + disques numérotés aux `x%,y%`, cerclage blanc, numéro noir/blanc selon luminance, borné à **1400 px**, `toDataURL('image/png')`. `document-formatter.js` → `formatImageHotspots` **async** : normalise les points (format plat **ET** content.json v1.11), **compose l'overlay dans le formatter** et l'émet en `{type:'image', url: <dataURL>, fillWidth:true}` → capté par `prepareImages` passe‑1 (`section.url`) → **AUCUNE modif des 3 routines de rendu DOCX/ODT/PDF** (elles gèrent déjà `imageData`+`fillWidth`). **Légende** : titre de point en **en‑tête « N. … »** (jamais un paragraphe « N. » isolé → évite l'autoformat liste de Word/LibreOffice) + texte en paragraphe. Clés `doc_fmt_image_hotspots_{title,legend}` ×11. *(Le plan initial prévoyait une passe `hotspotOverlay` dans `document-exporter.js` ; la composition côté formatter est plus simple et ne touche pas l'exporter.)*
>
> **Injection du fond à l'export** : le registre mémoire (`image-manager`) étant vidé après le packaging, l'image de fond est ré‑extraite du `.h5p` via JSZip par le helper **`extractBackgroundFromH5p(blob, jsonData)`** (dans `hotspot-overlay-renderer.js`), qui renvoie une data URL injectée en `_backgroundImage` (miroir du pattern `_gridImage` de Crossword/FindTheWords).
>
> **🐛 Correctif (2026‑06‑30, confirmé OK par l'utilisateur)** : l'export marchait depuis la **modale de visualisation** (`js/ui/notifications.js`) mais **PAS depuis la modale de résultat** (« Votre sucrerie est prête », `js/ui/ui.js` → `initGenerationResultModal`) — cette dernière gérait l'injection grille Crossword/FindTheWords mais pas l'Image interactive. Corrigé en ajoutant la même injection `_backgroundImage` dans le handler d'export de la modale de résultat, et en **factorisant** l'extraction dans le helper partagé `extractBackgroundFromH5p` appelé par **les deux** chemins. ⚠️ **Règle** : tout nouveau type à média exporté doit être câblé dans **les DEUX** déclencheurs d'export (`notifications.js` *et* `ui.js` modale de résultat). ✅ Export image + pastilles vérifié dans les 3 formats depuis les deux modales.

> Verdict : aucun format ne dessine de numéros **par‑dessus** une image nativement. Seule voie (déjà éprouvée via `qr-utils.js`) : **pré‑composer un PNG** au `<canvas>` (fond + pastilles numérotées), puis l'insérer comme image normale + une légende numérotée. PDF prod = conversion de l'**ODT** via Gotenberg → tester l'ODT d'abord.

**Fichiers à créer :** `js/renderers/hotspot-overlay-renderer.js`.
**Fichiers à modifier :** `js/export/document-formatter.js`, `js/export/document-exporter.js`, locales (`doc_fmt_image_hotspots_*`).

- `hotspot-overlay-renderer.js` : `composeNumberedHotspotImage(bgDataURL, hotspots, {color})` — `drawImage` + cercles numérotés aux `x%,y%`, cerclage blanc, **borner à ~1400 px** (poids du fichier), `canvas.toDataURL('image/png')`.
- `document-formatter.js` : ajouter `'ImageHotspots': formatImageHotspots` au map + la fonction qui pousse une section `image` portant `hotspotOverlay:{bgUrl, positions, color}` + une **légende numérotée** (titres `Heading3 « N. … »` — les headings échappent à l'autoformat liste de Word ; ou un unique `paragraph` multi‑lignes `1.\n2.\n3.` éclaté par `createDOCXParagraphOrList`). ⚠️ **Ne pas** faire un `paragraph` isolé par point commençant par « N. » (autoformat Word/LO casse la numérotation). Texte des points → `cleanHtml`.
- `document-exporter.js` : dans `prepareImages` (~l.91), passe qui transforme `hotspotOverlay` → `imageData` via `prepareImageData(composed)` (gère `data:` → blob + dataURL). **Zéro modif des 3 routines de rendu image.**

### Chantier 7 — i18n (11 locales), tuile, release

**Fichiers à modifier :** `js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json`, `scripts/verify-all-locales.mjs`, (release) `index.html`, `CHANGELOG`, `CLAUDE.md`.

- ~**40‑45 clés × 11 locales** (skill `caramel-translations`) : tuile (`h5p_image_hotspots_name/description`), modale `ih_*` (états upload/vision/erreur/ETA/aide), éditeur `editor_ih_*`, aide `eh_ih_*`, prompt `prompt_image_hotspots_*` (4), export `doc_fmt_image_hotspots_*`.
- `scripts/verify-all-locales.mjs` : ajouter `prompt_image_hotspots_structure_json` au tableau `keys` (sinon non vérifié) + classer dans le bon set (`plain`/`partialLatex` selon render type).
- Icône déjà présente : `assets/images/activities/image-hotspots-icon-color.webp` (+ `.png`). La référencer (FAIT dans `definitions.js`).
- Release (skill `caramel-release`) : footer `index.html` (`v6.1.1` → `v6.2.0`), `CHANGELOG`, mention `CLAUDE.md`. `version-checker.js` : rien.

### Chantier 8 — Portage Sucrerie

> Dépôt Sucrerie : `d:\Bureau\Forge\Caramel\sucrerie.forge.apps.education.fr` (variant `sucrerie-bas` aussi présent — **cible à confirmer** : `bas` correspond probablement au dépôt `Caramel\bas`). **Sucrerie ne génère pas** → la modale upload + vision **n'existe pas** côté Sucrerie. Sucrerie = dépôt + aperçu + édition + export.

À synchroniser :
1. `assets/js/core/activity-types.js` — ajouter `'H5P.ImageHotspots'` dans `CARAMEL_H5P` (modèle `H5P.InteractiveVideo`).
2. `assets/js/h5p-export-bridge.js` — ajouter `'H5P.ImageHotspots': 'ImageHotspots'` à `H5P_LIBRARY_TO_MODULE_KEY`. 🔴 **OBLIGATOIRE** (sinon le test anti‑dérive casse : il exige whitelist ⊆ exportKeys, seul `AdvancedText` peut différer).
3. `tests/deposit/test-deposit-validation.js` — ajouter `'H5P.ImageHotspots'` à `SUPPORTED_SAMPLE`.
4. `assets/js/h5p/supported-types.js` — **rien** (whitelist dérivée auto).
5. `assets/js/h5p/canonical-libraries.js` — version canonique `'H5P.ImageHotspots': '1.11'` (+ deps si requis).
6. `i18n/{11}.json` — `activity_h5p_image_hotspots` (namespace **différent** de Caramel).
7. `assets/images/activities/image-hotspots-icon-color.webp` — copier l'icône.
8. Fichiers miroir `assets/js/editor/*` — propager byte‑identique **si** `js/editor/content-detector.js` (et autres) ont été modifiés (Chantier 5).
9. Vendorer `H5P.ImageHotspots-1.11` côté reader Sucrerie si son moteur de preview charge les libs localement (à confirmer).
10. Vérifier : `node tests/deposit/test-deposit-validation.js` passe.
11. **Export documentaire** (Sucrerie exporte aussi en DOCX/ODT/PDF) : porter `js/renderers/hotspot-overlay-renderer.js` + le `formatImageHotspots` du `document-formatter.js` + l'injection du fond (`_backgroundImage` depuis le `.h5p`/registre) côté Sucrerie. ⚠️ `js/export/*` n'est **pas** un miroir automatique (≠ `js/editor/*`) → portage manuel, en l'adaptant au pipeline d'export Sucrerie.

### Chantier 9 — Documentation Caramelia (RAG ILaaS + Tuto in‑app)

> ⚠️ **À faire pour CHAQUE nouvelle activité / fonctionnalité** (pas seulement l'Image interactive) : sans cela, le chatbot Caramelia ne sait pas qu'elle existe et ne sait pas guider le prof dessus. Deux canaux **distincts** :

1. **RAG Caramelia (collection ILaaS `caramelia`, id 55)** — base de connaissances serveur interrogée par le mode aide.
   - Ajouter/мettre à jour des **chunks** sous `rag/caramelia/chunks/<lang>/*.md` (**11 langues**), frontmatter YAML (`referentiel, code, titre, lang, categorie, breadcrumb, version`), nommage ILaaS `<lang>__<chunk-code>`.
   - Ingestion : **REPLACE = DELETE + INGEST** (pas d'upsert). Piège connu de `node rag/ingest-caramelia.mjs` : son skip ne pagine pas (limit=100) → pour un replace ciblé, faire DELETE + INGEST individuels (cf. CLAUDE.md « RAG ILaaS » + mémoire `reference_rag_ilaas_caramelia.md`).
2. **Tuto in‑app** (`js/caramelia/tuto-rag/{11}.md`) — tutoriels markdown injectés comme contexte LLM en mode aide (skill `caramel-caramelia`). Éditer `fr.md` (référence) puis traduire les 10 autres.
   - Optionnel : router l'intention « image interactive » → tuile `ImageHotspots` dans `js/caramelia/config.js` (`fuzzyMap`) + `extractor.js` si paramètres spécifiques.

---

## 6. Inventaire complet des fichiers

**Créés (Caramel) :**
- `js/h5p/processors/ImageHotspots.js`
- `js/services/hotspot-vision.js`
- `js/renderers/hotspot-overlay-renderer.js`
- `js/editor/image-hotspots-panel.js` *(optionnel — éditeur visuel de placement ; cf. §11)*
- `assets/data/prompts/image_hotspots.md`, `assets/data/examples/image_hotspots_1.json`
- `js/vendor/h5p-libs/H5P.ImageHotspots-1.11/` ✅ FAIT

**Modifiés (Caramel) :**
- `js/core/definitions.js`, `js/core/endpoints.js`
- `js/h5p/processors/index.js`, `js/h5p/json-healer.js`, `js/h5p/field-constraints.js`, `js/h5p/image-manager.js`
- `js/services/llm.js` *(si appel vision centralisé là)*, `js/services/prompt-generator.js`
- `js/ui/ui.js`
- `js/editor/content-detector.js` *(miroir Sucrerie)*
- `js/export/document-formatter.js`, `js/export/document-exporter.js`
- `js/locales/*.json` (×11), `scripts/verify-all-locales.mjs`
- `index.html`, `CHANGELOG`, `CLAUDE.md`, `.gitlab-ci.yml` *(endpoints vision)*

**Modifiés (Sucrerie) :** `assets/js/core/activity-types.js`, `assets/js/h5p-export-bridge.js`, `tests/deposit/test-deposit-validation.js`, `assets/js/h5p/canonical-libraries.js`, `i18n/*.json` (×11), `assets/images/activities/…webp`, + fichiers `assets/js/editor/*` modifiés.

---

## 7. Risques & dépendances

| Risque | Gravité | Mitigation |
|--------|---------|-----------|
| ~~Endpoint vision inexistant côté n8n/ILaaS~~ | ✅ Résolu | Workflow Qwen déployé en prod et testé (coords 0–1000 normalisées). Repli placement manuel conservé. |
| Précision des coordonnées % (image compressée) | 🟠 Moyen | Envoyer à la vision une image ~1024 px peu compressée, distincte du fond H5P. |
| `clearAllImages()` vide le fond en mode guidé | 🟠 Moyen | Persistance sessionStorage + ré‑hydratation du registre avant packaging. |
| Autoformat liste Word/LibreOffice casse la numérotation | 🟡 Faible | Headers `« N. »` ou paragraphe multi‑lignes (`createDOCXParagraphOrList`). |
| Test anti‑dérive Sucrerie | 🟡 Faible | Ajout symétrique `CARAMEL_H5P` + `H5P_LIBRARY_TO_MODULE_KEY`. |
| Fiabilité JSON de la vision Qwen | 🟡 Faible | Parsing tolérant (strip ```` ```json ````, extraction `{…}`) + normalisation d'échelle côté workflow ET client. |
| Divergences EOL préexistantes (`sync-video-player.js`, `cloze-editor.css`) | 🟡 Faible | Hors périmètre ; à investiguer avant release. |

---

## 8. Critères d'acceptation (tests)

1. **Pipeline** : générer une activité → `.h5p` valide, ouvrable dans la **preview** (1.11 chargée, images base64 affichées) et dans Éléa/Lumi.
2. **Upload + vision** : joindre une image → état chargement → N zones détectées affichées ; en mode **guidé** (sans re‑upload), les coordonnées sont conservées et la génération aboutit.
3. **Génération texte** : chaque point a un `header` + un `H5P.Text` ; positions = celles de la vision ; image de fond bien embarquée.
4. **Éditeur** : modifier `globalColor`/`hotspotColor` (color picker), déplacer un point (x/y %), ajouter à la main une **image** (et une **URL** audio/vidéo) dans un point → re‑sauvegarde et re‑preview correctes.
5. **Export** : DOCX **et** ODT **et** PDF affichent l'image avec pastilles **1..N** aux bonnes positions + la légende numérotée (texte propre, sans balises HTML).
6. **i18n** : `node scripts/verify-all-locales.mjs` passe ; tuile/modale traduites dans les 11 langues.
7. **Sucrerie** : déposer le `.h5p` → accepté par la whitelist, aperçu + édition + export OK ; `node tests/deposit/test-deposit-validation.js` passe.

---

## 9. Séquencement & estimation

| Lot | Chantiers | Charge |
|-----|-----------|--------|
| **Sprint 1 — Socle** | C0 (vendoring ✅) + **C3 valider la vision** + C1 (pipeline/processor) + C4 (prompts) | ~2–3 j |
| **Sprint 2 — UX** | C2 (modale upload + capture vision) + C3b (image‑manager fond) | ~2–3 j |
| **Sprint 3 — Édition & export** | C5 (éditeur) + C6 (export numéroté) | ~1,5–2 j |
| **Sprint 4 — i18n & portage** | C7 (11 locales + release) + C8 (Sucrerie) | ~1,5–2 j |
| **+ dépendance serveur** | Workflow n8n vision (hors dépôt) | ~0,5–1 j, **bloquant** |

**Total ≈ 7–10 jours** dev Caramel + portage, hors aléa vision.

---

## 10. Pièges critiques (rappel)

1. Source média **jamais demandée au LLM** — injectée en post‑traitement (comme `videoSource`).
2. Capture des zones **dès l'upload** (pas au clic Générer) sinon le mode guidé n'a pas les coordonnées.
3. `extraDependencies` **manuelles** (les sous‑libs de contenu ne sont pas dans `library.json`).
4. Exclure ImageHotspots du **bloc commun** du healer (pas d'`overallFeedback`/`behaviour`).
5. `x/y` en **pourcentages 0–100** de bout en bout (vision → prompt → JSON → processor → export).
6. `processImage` standard **inadapté** au fond (resize 800×600 + JPEG forcé) → `processBackgroundImage` dédié.
7. Éditeur = **miroir Sucrerie** → pas de dépendance Caramel‑only ; propager.
8. `examples/*.json` et `prompts/*.md` = **docs** ; le runtime lit les clés i18n.
9. Autoformat liste Word/LibreOffice à l'export → headers/paragraphe groupé.
10. Test anti‑dérive Sucrerie : ajout **symétrique** whitelist + export‑bridge.
11. Patch `frame.bundle.js` (`data:image/`) requis pour la preview des images base64.

---

## 11. Décisions — arbitrées

1. ✅ **Vision** : workflow n8n multimodal **déployé en prod et testé** avec **`qwen-3.6-35b-instruct`** (coords 0–1000 → %). Gemma écarté.
2. ✅ **Sous‑contenus d'un point** : gérer **tout le H5P de base** (Texte/Image/Audio/Vidéo) avec insertion manuelle et **embarquement de fichier**. → impose un petit **`media-manager`** (généralisation d'`image-manager` à l'audio/vidéo : validation, embarquement `content/<media>/…`, structures `H5P.Audio`/`H5P.Video`) **+** la voie URL/YouTube native de `H5P.Video`. La **génération** ne produit toujours que du texte (D4).
3. ✅ **Placement éditeur** : champs **X/Y (%)**. Éditeur visuel « cliquer sur l'image » = v2 éventuelle.
4. ✅ **Cible Sucrerie** : `sucrerie.forge.apps.education.fr` (prod).
5. ✅ **Icône par défaut** : `numbers`.

Reste mineur à trancher en cours de route : **catégorie de tuile** (`memory` proposé) — sans impact bloquant.

> Conséquence de la décision n°2 sur le périmètre : ajouter un chantier **C3c — media‑manager** (audio/vidéo embarqués) et exposer les 4 sous‑contenus dans l'éditeur (C5) et l'export (C6 : signaler/extraire les médias). Voir l'addendum ci‑dessous.

### Addendum — Support média complet (suite décision n°2)

- **`js/h5p/image-manager.js` → généraliser** (ou nouveau `js/h5p/media-manager.js`) : `processAudioFile(file)` / `processVideoFile(file)` qui valident le type, écrivent le blob dans le registre (clé `content/<id>.<ext>`), et exposent `buildAudioStructure` / `buildVideoStructure` produisant les `params` H5P attendus :
  - `H5P.Audio 1.5` → `params.files = [{ path, mime }]` (+ `playerMode`, `fitToWrapper`, `controls`, `autoplay` par défaut).
  - `H5P.Video 1.6` → `params.sources = [{ path, mime }]` pour un fichier embarqué, **ou** `[{ path:'https://youtu.be/…', mime:'video/YouTube' }]` pour une URL (mode natif H5P).
  - `H5P.Image 1.1` → déjà couvert par `image-manager`.
- **Packaging** : `h5p-creator.js` itère déjà le registre `getAllImages()` → l'étendre en `getAllMedia()` (images + audio + vidéo) pour embarquer les blobs audio/vidéo dans le `.h5p`. (Aujourd'hui seules les images sont embarquées.)
- **Éditeur (C5)** : le select `_contentType` expose **les 4** types ; champ `image` (upload), `audio` (upload **ou** URL), `video` (upload **ou** URL/YouTube). `denormalize` reconstruit `library`/`params`/`subContentId` minimalement, le processor complète.
- **Export (C6)** : pour un point contenant un média, exporter l'image embarquée sous la légende si présente ; pour audio/vidéo, mention « (contient un média : voir la version interactive) » + lien si URL.
- **Preview** : `_embedImagesAsDataUrls` (`h5p-manager.js:679`) couvre `params.file.path` (image) ; vérifier/étendre au `params.files[].path` (audio) et `params.sources[].path` (vidéo fichier) pour que la preview joue les médias embarqués.
- Charge supplémentaire estimée : **+1 à 1,5 j** (media‑manager + packaging `getAllMedia` + champs éditeur audio/vidéo + preview médias).
