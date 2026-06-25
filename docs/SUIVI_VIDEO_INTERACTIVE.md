# Suivi de chantier — Vidéo interactive H5P (H5P.InteractiveVideo)

> Fichier de **mémoire de chantier inter-sessions**. Mis à jour à chaque jalon.
> Plan de référence : `~/.claude/plans/soft-forging-yeti.md`. PRD : `docs/PRD_VIDEO_INTERACTIVE.md`.
> Statuts : ☐ à faire · ⏳ en cours · ✅ fait · 🔬 fait, à valider en navigateur réel.
> **Aucun commit** (consigne auteur) — l'état vit dans l'arbre de travail + ce fichier.

## Vue d'ensemble des lots

| Lot | Périmètre | Statut |
|---|---|---|
| 1 | Tuyau bout-en-bout + processor complet (sans IA) | 🔬 code fait + smoke test Node OK ; reste preview navigateur/Lumi |
| 2 | Génération LLM (placement aux ruptures de transcription) | 🔬 code fait + smoke test prompt OK ; reste génération réelle en navigateur |
| 3 | Fallback Albert + PodEduc + collage manuel + polling | ✅ PeerTube+Albert validés live ; **✅ PodEduc auto validé en navigateur réel** (détection via mode `{url}` du webhook + transcription Albert) ; reste collage manuel à valider en navigateur |
| 4 | Éditeur à player intégré + timeline | 🔬 code fait + smoke détection/schéma OK ; reste édition réelle en navigateur. ✅ **propagé à Sucrerie** (session nonies : `field-renderers.js`/`content-detector.js` cp + adaptateur natif IV) |
| 5 | Export DOCX/ODT/PDF + i18n ×11 + RAG + tests + release | 🔬 code/contenu fait, tests 21/21 verts, locales 26/26 ; reste export réel en navigateur + traduction fine 10 langues. ✅ RAG ILaaS ingéré (sexies). ✅ **déploiement Sucrerie fait** (nonies) |

---

## Architecture figée (rappel)

- **JSON intermédiaire** (source unique de vérité) : `{ title, videoSource:{type,url,mime}, transcript?:{source,language,captionUrl?,vtt?}, interactions:[{timestamp,pause,type,...}], summary:{intro,statements:[[...]]} }`.
- **Objet transcription normalisé** : `{ source, language, duration, text, segments:[{start,end,text}], vtt, captionUrl? }`.
- Vidéo **référencée par URL** (jamais bundlée) — vérifié : `h5p-creator.createH5PBlob` n'écrit que `content.json` + images du registre + `h5p.json`.
- Tuile dans l'onglet **Quiz & Tests** (`categories:["quiz","h5p"]`). Flag `requiresVideoUrl:true`.
- **Aucune lib H5P à produire** : `H5P.InteractiveVideo-1.27` (+ Video 1.6, MultiChoice 1.16, TrueFalse 1.8, Blanks 1.14, Summary 1.10, DragNBar 1.5 + deps) déjà dans `js/vendor/h5p-libs/`.

---

## LOT 1 — détail

### Fait (✅)
- `js/core/definitions.js` : entrée `InteractiveVideo` (`requiresVideoUrl:true`, icône `interactive_video_icon-colors_0.webp`) + `customOrder` (après InteractiveBook). ✅
- `js/core/translation.js` : défaut `h5p_interactive_video_name`. ✅
- `js/services/video-transcript.js` *(nouveau)* : `detectVideo` (PeerTube API publique, choix rendition mp4, captions fr), `fetchTranscript` (chemin captions → VTT → segments), `parseVtt`/`timecodeToSeconds`/`segmentsToVtt`, `detectPlatform`/`isPeerTube`. PodEduc/Albert → renvoient `error` (LOT 3). ✅
- `js/h5p/processors/InteractiveVideo.js` *(nouveau)* : intermédiaire → `interactiveVideo{video,assets.interactions,summary}` + `override`. Réutilise `helpers.processChild` (QCM/VF/Blanks), `generateUUID`, `healSlidesLatex`. Dépendances dynamiques + MathDisplay conditionnel. Piste sous-titres si `transcript.captionUrl`. ✅
- `js/h5p/processors/index.js` : 3 maps (`processorMetadata` v1.27 + extraDeps complètes, `processorLoaders`, `libraryToKey`). ✅
- `js/h5p/field-constraints.js` : bloc `InteractiveVideo` (container) sur le format intermédiaire. ✅
- `js/h5p/json-healer.js` : `H5P.InteractiveVideo→1.27`, ajout à `H5P_MODULE_KEYS`, branche structurelle IV (coercition timestamp, pause défaut, type inféré/validé, summary normalisé, videoSource chaîne→objet, tri). ✅
- `js/caramelia/config.js` : registre chatbot (quiz.keys, allModuleKeys, h5pKeys, activityCaramelMap, fuzzyMap synonymes). ✅
- `js/services/llm.js` : ligne commentée `ACTIVITY_MODEL_OVERRIDES`. ✅
- `js/ui/ui.js` : section « URL vidéo » sous la description (input + bouton « Récupérer la transcription » + bouton aide + badge 4 états + texte d'aide), `initVideoUrlSection`, **verrou de génération** (boutons « Créer » et « Générer en un clic » inactifs sans vidéo lisible — guards durs dans les 2 handlers), pré-remplissage JSON d'exemple (LOT 1), nettoyage timer. Le « un clic » IV empaquette l'exemple (LOT 2 le remplacera par la vraie IA). ✅
- `css/base/style.css` : styles section URL + badge (4 états) + boutons verrouillés. ✅
- `js/locales/fr.json` : `h5p_interactive_video_description` + clés `video_*` (FR seul ; 11 langues = LOT 5). ✅
- `index.html` : **aucune modif** — le champ est injecté dynamiquement par `toggleActivityContent` (comme tout le reste de la sidebar).

### Validations
- `node --check` sur les 10 fichiers JS modifiés/créés : **OK**. ✅
- `fr.json` JSON valide. ✅
- Smoke test Node (DOM stubé) : `parseVtt` (HH:MM:SS + MM:SS), `detectPlatform`, healer IV (coercition/inférence/tri), processor end-to-end → `video.files` par URL, interactions complètes, **TrueFalse `correct:"true"`**, Blanks `questions`, Summary 1.10 `displayAt:3`, dépendances dynamiques. **OK**. ✅

### Reste à valider (🔬)
- [ ] Preview h5p-standalone : la vidéo PeerTube JOUE, les interactions apparaissent aux temps, sous-titres visibles, résumé final.
- [ ] Ouverture dans **Lumi** / Éléa réel.
- [ ] UX modale : verrou effectif (génération impossible sans URL), badge 4 états, bouton aide.
  → `python3 -m http.server 8000` → coller une URL PeerTube apps.education récente (vidéo avec captions auto).

### Pièges/risques notés
- Vidéo PeerTube **HLS-only** (sans `files[]` progressif) : on retombe sur `streamingPlaylists[].files[]` ; si rien → badge erreur.
- `crossorigin` prod Éléa (lecture PodEduc) — LOT 3.
- Sanitizer : en Node, `formatTextToHtml` échappe (DOMPurify absent) — normal, sans effet en navigateur.

---

## LOT 2 — détail

### Fait (✅)
- `js/services/prompt-generator.js` : `ACTIVITY_CONFIG.interactiveVideo` ; `buildActivityPrompt` accepte un cadrage SOURCES par activité (`${prefix}_sources`) ; export `formatTranscriptForPrompt(segments, ~45s)` (→ `[mm:ss] texte`) + `buildVideoInteractivePrompt(segments, duration)`.
- `js/locales/fr.json` : `prompt_interactive_video_sources` / `_regles_specifiques` (placement aux ruptures, types, nombre adaptatif `4–8 || [NOMBRE_ELEMENTS]`, résumé) / `_structure_json` (schéma intermédiaire, `videoSource` injecté par Caramel) / `_exemple_rendu` + `video_no_transcript_yet`.
- `assets/data/examples/interactive_video_1.json` (exemple intermédiaire) + `assets/data/prompts/interactive_video.md` (doc).
- `js/ui/ui.js` : « Générer en un clic » IV = transcription (déjà récupérée par detect) → `buildVideoInteractivePrompt` → `generateH5PWithLLM` → **injection `videoSource` + piste `captionUrl`** dans le JSON IA → empaquetage. Repli « exemple » si pas de transcription (Albert = LOT 3).

### Validations
- `node --check` ui.js + prompt-generator.js : OK. `fr.json` + exemple JSON valides.
- Smoke test (translations chargées) : prompt 5563 car., contient contexte, placement « ruptures d'idées », cadrage transcription, doc `timestamp`, exemple multichoice, indice de durée, lignes `[mm:ss]`. `formatTranscriptForPrompt` fenêtre correctement (0:00 / 0:48 / 1:55). ✅

### Reste à valider (🔬)
- [ ] Génération réelle en navigateur (URL PeerTube avec captions → un clic → JSON IA cohérent, questions bien placées → .h5p jouable).

## LOT 3 — détail

### Fait (✅)
- `js/caramelia/config.js` : `CARAMEL_VIDEO_TRANSCRIPT_URL` (endpoint prod déployé) + `CONFIG.videoTranscriptUrl`.
- `.gitlab-ci.yml` : injection sed **optionnelle** (défaut = endpoint intégré ; pas de `exit 1` si la variable CI manque) + echo debug + doc.
- `js/services/video-transcript.js` :
  - `collectRenditions` (toutes renditions vidéo triées croissant) + `pickPlayableRendition` ; `detect` expose `renditions`.
  - **Voie Albert** : `fetchTranscript` cascade captions → Albert (`transcribeViaAlbert` POST `{mediaUrl, language}` au webhook, normalise `segments`+`vtt`), `isReachable` (HEAD, non bloquant) choisit la plus basse rendition.
  - **Filet collage manuel** : `parsePastedTranscript` (WebVTT / SRT / transcript horodaté `[m:ss]` / texte brut → nettoyage `cleanPlainText`), `normalizeManual`.
  - PodEduc : `detect` renvoie `error:'podeduc_clientside'` (résolution mp4 impossible sans CORS/API → nécessite endpoint n8n).
- `js/ui/ui.js` : badge 🟠 + zone collage (`<textarea>` + bouton « Utiliser cette transcription » + toggle), `revealVideoManual`. « Un clic » : transcription cache → sinon **Albert** (animation) → sinon **révèle le collage manuel**. Transcription non timée → 1 bloc couvrant la durée (le LLM répartit).
- `js/locales/fr.json` : clés `video_status_manual`, `video_albert_failed`, `video_manual_toggle`, `video_paste_*`.
- `css/base/style.css` : styles collage manuel + badge `manual`.

### Validations
- `node --check` video-transcript.js / ui.js / config.js : OK. `fr.json` valide.
- Smoke `parsePastedTranscript` : VTT→`manual-vtt` (2 seg), SRT→`manual-srt` (2 seg), texte horodaté→`manual-text` (starts [5,30,70]), texte brut→`untimed`, vide→`error`. ✅

### ✅ Bug corrigé + voie Albert VALIDÉE EN LIVE (2026-06-13, vidéo `tube-numerique-educatif/w/kV3nvLZMgGDT5SVvDV3njt`)
- **Bug critique trouvé** : le webhook Albert renvoie un **corps vide (200, 0,19 s)** pour la rendition **progressive** `web-videos/*.mp4` (redirection stockage objet → n8n télécharge du vide), mais renvoie la **transcription complète** pour la rendition **HLS** `…-fragmented.mp4`. `collectRenditions` envoyait le progressif → génération toujours en échec (« ça ne fonctionne pas »).
- **Fix** : `collectRenditions` tague `kind: 'progressive'|'hls'` et collecte les DEUX ; nouvelle `albertCandidates()` essaie **HLS d'abord** puis progressif, et `fetchTranscript` retient la 1ʳᵉ rendition qui produit des segments. La **lecture** garde le progressif (compat `<video>`).
- **Fix UX** : le bouton « Récupérer la transcription » ne déclenche plus Albert (lent) — il ne récupère que les **captions** (rapide) ; Albert ne tourne qu'au **« Générer en un clic »** (avec l'animation). Sans captions → badge 🟡, génération via Albert au clic.
- **Validation live** : `detectVideo` → playable ; `fetchTranscript` → **Albert HLS → 4 segments, 88 s, transcription FR parfaite**. ✅
- **2e bug (preuve n8n)** : sur cette vidéo **HLS-only**, l'API liste `files[]` (progressif `web-videos`) mais ces URLs sont **404** (GET → `text/html`, fichiers supprimés au profit du HLS). Le HLS `…-fragmented.mp4` répond **206 video/mp4**. → **`pickPlayableRendition` préfère désormais le HLS** (lecture) en plus de l'Albert. Repli progressif uniquement si pas de HLS (vieilles vidéos). `videoSource` confirmé HLS 720p en live.
- **⚠️ À VÉRIFIER EN NAVIGATEUR** : que le `…-fragmented.mp4` (mp4 fragmenté) **se lit bien en `<video src>` direct** dans le player H5P. Si non → basculer la lecture sur `streamingPlaylists[].playlistUrl` (`.m3u8`) avec le mode HLS de `H5P.Video` (mime `application/x-mpegURL`).

### Reste à valider (🔬)
- [ ] Collage manuel en navigateur → génération.

### ✅ PodEduc — IMPLÉMENTÉ + VALIDÉ EN NAVIGATEUR RÉEL (2026-06-13 quater)
Voir la session datée ci-dessous (« SESSION 2026-06-13 (quater) — Support PodEduc »). Résumé :
- **Pas de CORS** sur la page PodEduc + **API esup-pod 401** → détection client impossible (confirmé). `overview.vtt` = storyboard, pas des sous-titres → transcription **Albert** (audio→Whisper).
- **Solution retenue** (sur demande auteur) : **PAS de 2ᵉ workflow**. On a **adapté le workflow existant** `caramel-video-transcript` en lui ajoutant un **mode détection** (node IF « mediaUrl fourni ? ») : `{ url }` (sans `mediaUrl`) → GET la page côté serveur → scrape `/media/videos/<hash64>/<id>/<res>p.mp4` + og:title + durée ISO 8601 → `{ videoSource, title, duration, renditions }`, **sans Albert**. `{ mediaUrl }` → transcription Albert (inchangé). **Un seul endpoint, une seule clé CI `CARAMEL_VIDEO_TRANSCRIPT_URL`.**
- Côté client (`video-transcript.js`), PodEduc suit alors **exactement** le flux PeerTube : `detectPodEduc` (POST `{url}`) résout le mp4, puis `fetchTranscript` rappelle le webhook en mode `mediaUrl`. Défensif : le client **résout les URL relatives** contre l'URL de la page (le scrape n8n renvoyait `/media/...` à cause d'un paired-item — corrigé en `.first()` côté workflow ET compensé côté client).
- ⚠️ **Limite 20 Mo Albert → résolue par découpage HLS** (session quinquies ci-dessous) : `ffmpeg` (Execute Command) **désactivé** sur le n8n de l'auteur (node « ? » à l'import = type non reconnu). Solution sans ffmpeg : découper le flux HLS `.ts` en lots < 18 Mo (byte-ranges) → plusieurs appels Albert → recollage par offsets EXTINF.

## LOT 4 — détail

### Fait (✅)
- `js/editor/field-renderers.js` *(PARTAGÉ)* : `renderTimestampField` (HH:MM:SS ↔ secondes, pur, sans dépendance Caramel) + entrée `'timestamp'` dans `fieldRenderers`.
- `js/editor/content-detector.js` *(PARTAGÉ)* : signature `InteractiveVideo` (interactions[] + videoSource/timestamp), `titleKeyToModuleKey`, **schéma IV** (sections général / interactions[timestamp+type select+showWhen question/answers/correct/text] / résumé), `moduleTranslationKeys`.
- `js/editor/interactive-video-panel.js` *(NOUVEAU, Caramel-only)* : lecteur `<video>` intégré + lecture du temps + bouton « Insérer une question à ce moment » → ajoute une interaction au temps courant, trie, re-rend l'éditeur. Monté en frère du conteneur (survit aux re-rendus). Fallback sans `crossorigin` si l'hôte n'a pas de CORS.
- `js/editor/index.js` *(Caramel-only)* : montage du panneau IV après `renderEditor` (API getData/setData/rerender).
- `js/h5p/json-healer.js` : normalisation `correct` truefalse en booléen (l'éditeur stocke "true"/"false").
- `assets/templates/editor-help/InteractiveVideo.html` (aide) + clés `eh_iv_*` / `editor_iv_*` (FR).
- `css/base/style.css` : styles du panneau lecteur.

### Choix
- `validators.js` **non modifié** : la validation par schéma (champs requis) + la validation de format du `renderTimestampField` suffisent → on évite d'élargir la surface partagée Sucrerie.
- La « timeline triée » = la liste d'items du panneau de navigation gauche (le healer/processeur trient par timestamp à la génération ; la capture insère puis trie).

### Validations
- `node --check` des 5 fichiers : OK. `fr.json` valide.
- Smoke : `detectContentType` → `InteractiveVideo` ; `getSchemaForType` → sections general/interactions/summary ; itemSchema complet ; `timestamp` renderer ; options de type ; `showWhen` answers. ✅

### Reste à valider (🔬)
- [ ] Édition réelle en navigateur (charger une vidéo interactive générée → lecteur joue → capture d'un temps → ajout/édition/réordonnancement → sauvegarde fidèle → re-package).

### ⚠️ Propagation Sucrerie (CLAUDE.md item 7)
- `js/editor/field-renderers.js` et `js/editor/content-detector.js` sont **byte-identiques** côté Sucrerie. Mes ajouts sont **purs** (aucun import Caramel-spécifique) → propageables par `cp`. Côté Sucrerie il faudra aussi les clés i18n `editor_iv_*` si l'IV doit y être éditable. `interactive-video-panel.js` et `index.js` sont Caramel-only (non concernés).

## LOT 5 — détail

### Fait (✅)
- `js/export/document-formatter.js` : `formatVideoInteractive(data)` (intermédiaire) + entrée dans la map `formatters`. Énoncé trié par timestamp « À mm:ss — … » → page Correction (bonnes réponses + feedback) → résumé. `cleanHtml` (préserve LaTeX). Pas de modif `document-exporter` (rendu checkbox/paragraphes, pas de nouveau style).
- **i18n ×11** : 76 clés IV ajoutées dans les 11 locales via `scripts/add-interactive-video-locales.mjs` (traductions réelles pour les clés à forte visibilité : nom/description, `video_*`, `doc_fmt_video_*` ; repli FR pour `editor_iv_*` / `eh_iv_*` / longs `prompt_*`). Parité 2256 clés partout. `verify-all-locales` 26/26 ✅.
- **RAG Caramelia** : `rag/caramelia/sources/01-activites-h5p/interactive-video.md` + chunks `chunks/<lang>/h5p-interactive-video.md` (11, contenu FR + frontmatter `lang` localisé) + `_panorama.md` (22→23, ligne IV ajoutée).
- **Tests** : `tests/test-editor-iv.{js,html}` (21 assertions : détection, schéma, showWhen, healer, processeur) — **21/21 PASS** ; enregistré dans `tests/test-all.html` ; `tests/test-definitions.js` (maps prompt + exemple) → l'IV est aussi couvert par les tests génériques.
- **Release** : entrée CHANGELOG détaillée sous `[5.3.0]`. Version footer inchangée (`v5.3.0` ; les incréments beta vivent dans les messages de commit — **aucun commit** demandé).

### Bug corrigé en cours de route
- Healer : l'inférence `truefalse` ne reconnaissait que `correct` booléen → ajout de `'true'`/`'false'` (string, comme stocké par l'éditeur). Détecté par `test-editor-iv`.

### Reste à valider / faire (🔬)
- [ ] Export DOCX/ODT/PDF réel en navigateur (math éditable).
- [ ] **Ingestion RAG ILaaS** (externe, REPLACE = DELETE + INGEST) — non exécutée ici (réseau/n8n).
- [ ] **Traduction fine** des clés `editor_iv_*` / `eh_iv_*` / `prompt_interactive_video_*` dans les 10 langues non-FR (actuellement repli FR — fonctionnel mais à polir).

---

## SESSION 2026-06-13 (bis) — Refonte UX du flux de génération + granularité timestamps RÉELS

Retours auteur : la section URL était trop épaisse/confuse, rien ne se passait au clic, le panneau JSON
de droite était pré-rempli d'un exemple « qui n'a aucun sens », la transcription n'allait pas dans le
prompt, et les timestamps interpolés étaient inacceptables (« le temps doit être réel »).

### Refonte UI/UX (`js/ui/ui.js`, `css/base/style.css`) — Caramel-only, AUCUN fichier partagé Sucrerie touché
- **Section URL sur une seule ligne** (champ + bouton + aide) ; statut + « coller manuellement » sur une ligne fine en dessous ; collage manuel et aide restent repliés (plus d'épaisseur par défaut).
- **Coller le lien lance AUTOMATIQUEMENT** la détection + la récupération de transcription (debounce 600 ms, sur URL PeerTube « complète » ; bouton/Entrée restent dispo). Indicateur **spinner** sur le bouton (`.is-loading`) pendant la récupération ; bouton → « ✓ Transcription récupérée » au succès.
- **Verrou visuel** : tout le **groupe de génération** (« Générer en un clic » **+ flèche sélecteur de modèle**) est **grisé en bloc** (`.gen-gated`) tant que la transcription n'est pas prête, puis repasse au **bleu** dès qu'elle l'est = signal « c'est bon » pour l'utilisateur.
- **Transcription injectée dans le PROMPT DE GAUCHE** (« Obtenir le prompt à copier ») : `prompt-generator.js` expose `setVideoTranscriptSources(segments, duration)` ; `getPrompts` injecte la transcription en SOURCES du prompt « Vidéo interactive » ; l'UI écrit le textarea visible + le `hidden-…` (mode Guidé = prompt complet à copier ; mode Simple = one-clic réutilise le cache).
- **Suppression du pré-remplissage JSON de droite** (l'ancien `buildSampleVideoJson` du Lot 1 — la source du « ça n'a aucun sens »). Le panneau droit reste vide jusqu'au collage du JSON IA.
- **Mode Guidé corrigé** : le bouton « Générer l'activité » (`createBtn`) **injecte `videoSource` + piste sous-titres + titre** dans le JSON collé avant packaging (sinon vidéo absente du `.h5p`).

### Granularité des timestamps — RÉELS uniquement
- **Bug** : `formatTranscriptForPrompt` regroupait les segments en **fenêtres de 45 s** → seulement 2 ancres (`[0:02]`, `[0:47]`) sur la vidéo de test. Réécrit : **1 ligne par segment Whisper réel** (timestamp = `start` réel), **zéro interpolation** ; repli regroupement seulement pour vidéos très longues (> 300 lignes, timestamp réel du 1ᵉʳ conservé).
- **Limite Albert confirmée (OpenAPI)** : `/v1/audio/transcriptions` **ne supporte PAS `timestamp_granularities`** et ne renvoie **aucun `words[]`** → granularité maximale = **le segment**. Pas de timestamps mot-à-mot possibles côté Albert. Sur la vidéo de test : **4 segments réels** (0:02, 0:20, 0:47, 0:58) = 4 ruptures d'idées exploitables. Plus fin = nécessiterait un autre moteur (faster-whisper `word_timestamps`) ou les captions PeerTube quand elles existent → **décision produit**, hors périmètre ici.
- **Prompt mis à jour** (11 locales, repli FR) : `prompt_interactive_video_regles_specifiques` + `_sources` imposent d'utiliser **uniquement les horodatages `[mm:ss]` réels** de la transcription comme `timestamp` (jamais d'instant inventé) et un **nombre de questions adaptatif** (≤ « nombre d'horodatages − 1 », pas de quota forcé).

### Validations (automatiques)
- `node --check` ui.js + prompt-generator.js : OK. `verify-all-locales` : **26/26**. Tests `tests/test-editor-iv.html` : **21/21**.
- **E2E navigateur réel (Chrome headless via CDP)** : coller l'URL → auto-détection → Albert (4 segments) → bouton **bleu** + « ✓ Transcription récupérée » → **prompt de gauche contient les 4 horodatages réels + la transcription en SOURCES** → **panneau JSON droit vide** → aucune exception. Webhook n8n re-testé : 200, 88 s, 4 segments. CORS PeerTube/n8n OK.
- Nouvelles clés i18n ×11 : `video_detecting`, `video_transcript_done`.

### Modale de visualisation — TENTATIVE CSS ANNULÉE
- Tentative de forcer `is-video` + `height:100%`/`min-height:60vh` sur l'iframe IV → a CASSÉ la modale (boîte vide, pas de scroll, zoom). **Revertée intégralement** (`h5p-manager.js` = HEAD, CSS d'origine restaurée).
- **Diagnostic** : le `…-fragmented.mp4` HLS **se lit nickel** dans un `<video>` (testé Chrome réel : `loadedmetadata`, 854×480, 88 s). Le progressif `web-videos` est cassé (MEDIA error 4). Donc la lecture/dimension n'est pas le souci ; ne pas forcer de hauteur (se bat avec le resizer h5p-standalone). La modale rend bien la vidéo plein format après revert (confirmé par capture auteur).

### Correctifs rendu/UX (série 2026-06-13 ter)
- **Bandeau d'énoncé sur la vidéo + bouton persistant** (`processors/InteractiveVideo.js`) : `buildInteractionItem` mettait `label = <p>question…</p>` (gros bandeau noir recouvrant la vidéo) et `duration = from→from+10s` (bouton qui traîne après la question). → **label vide** (bouton icône discret) + **`BUTTON_VISIBLE_S = 2`**.
- **« Open summary dialog » (et autres libellés) en anglais** : le `language/fr.json` de la lib IV ne traduit PAS le groupe `l10n`. → **objet `IV_L10N_FR` (47 chaînes) injecté dans `content.l10n`** par le processor (corrige preview ET Lumi/Éléa). Smoke test : `l10n.summary = "Ouvrir le résumé"`, 47 clés.
- **Panneau « Lecteur vidéo » de l'éditeur qui fuit dans la modale de visualisation** (`editor/index.js`) : le panneau IV est monté en FRÈRE du conteneur → `destroyEditor()` (qui ne fait que `container.innerHTML=''`) ne le retirait pas. → `destroyEditor` retire désormais explicitement `.iv-editor-panel` du parent.
- **Player éditeur replié par défaut** (`editor/interactive-video-panel.js`, demande petit écran) : barre `▸ Lecteur vidéo` toujours visible ; vidéo + contrôles dépliables ; source chargée (`preload`) au 1er dépliage seulement. Clé i18n `editor_iv_player_toggle` ×11.
- **Transcription qui se relançait** (`ui.js`) : (1) à la **réouverture** de la modale, `initVideoUrlSection` rejouait `runDetection`→Albert. → restore désormais **depuis le cache `videoStates`** (badge ready + prompt réinjecté, **0 appel webhook**), aucun appel auto sinon. (2) au **changement de contexte** (qui/quoi), `handleContextChange` appelle `resetVideoStateOnContextChange()` : efface lien + cache + SOURCES + re-verrouille la génération.
- **Validations** : E2E Chrome réel — réouverture = **1 seul appel webhook** (pas de relance) ; saisie #qui → lien vidé + génération re-verrouillée ; smoke processor (l10n FR, label vide, fenêtre 2 s). `verify-all-locales` 26/26, tests IV 21/21.

### Reste à valider en navigateur (🔬)
- [ ] Génération un-clic réelle (LLM) avec le nouveau prompt → questions placées sur les horodatages réels.
- [ ] Ouverture Lumi/Éléa (libellés FR, bouton discret, résumé « Ouvrir le résumé »).
- [ ] (Produit) Décider si on veut une granularité < segment (autre moteur de transcription) pour les vidéos longues monologuées.

---

## SESSION 2026-06-13 (quater) — Support PodEduc (esup-pod)

Objectif : faire fonctionner PodEduc comme PeerTube (coller un lien → détection → transcription → bouton bleu).
Verrou connu : page PodEduc **sans CORS** + API esup-pod **401** → le navigateur ne peut PAS résoudre l'URL mp4.

### Décision d'architecture (sur demande auteur) — UN SEUL workflow, deux modes
Plutôt que créer un 2ᵉ workflow `caramel-video-detect`, on a **adapté le workflow existant**
`Caramel - transcription video interactive (DEV).json` (endpoint `caramel-video-transcript`) :
- **node IF « mediaUrl fourni ? »** en tête :
  - **`{ mediaUrl, language }`** (présent) → branche TRANSCRIPTION inchangée (PeerTube : Télécharger → Albert `verbose_json` → Normaliser).
  - **`{ url }`** (mediaUrl absent) → branche DÉTECTION (nouveau) : « Télécharger la page (PodEduc) » (GET serveur, `responseFormat=text`) → « Scraper PodEduc » (Code) → renvoie `{ supported, platform:'podeduc', title, duration, playable, videoSource:{type,url,mime}, renditions[] }`, **sans Albert** (rapide).
- Les deux branches répondent au **même** « Respond to Webhook » (CORS `*`).
- **Aucun nouveau workflow, aucune nouvelle variable CI** : on réutilise `CARAMEL_VIDEO_TRANSCRIPT_URL` (prod + `-dev2` + `-bas`). Auteur a **réimporté** le workflow mis à jour sur les 3 instances.
- **Scrape** (testé contre le HTML réel) : renditions = motif `/media/videos/<hash sha256 64 hex>/<id>/<res>p.mp4` (triées, plus basse pour la lecture) ; titre = `og:title` ; durée = `itemprop="duration"` ISO 8601 (parseur tolérant : esup-pod émet parfois `P2887S`, secondes sans `T`). `overview.vtt` (storyboard) ignoré.
- **Bug trouvé+corrigé** : sur n8n, `$('Webhook (POST vidéo)').item.json.body.url` ne se résolvait pas après le node HTTP (paired-item cassé) → `origin` vide → `videoSource.url` **relatif** (`/media/...`). Fix : `.item` → **`.first()`** dans TOUS les Code/expr du workflow (langue/modèle Albert aussi, qui retombaient silencieusement sur les défauts). Défense supplémentaire **côté client** : `detectPodEduc` résout toute URL relative contre l'URL de la page.

### Client (`js/services/video-transcript.js`, `js/ui/ui.js`, `js/caramelia/config.js`) — Caramel-only
- `detectVideo` branche `podeduc` : ne renvoie plus `error:'podeduc_clientside'` → appelle **`detectPodEduc(url)`** (POST `{ url }` au webhook, mode détection) qui renvoie la même forme que `detectPeerTube` (videoSource, renditions, `captions.available=false`).
- `fetchTranscript` : branche Albert **généralisée** à `peertube` **ET** `podeduc` (les renditions résolues par `detectPodEduc` partent à Albert via `mediaUrl`, plus basse d'abord).
- `ui.js` : `looksComplete` reconnaît désormais aussi les URL PodEduc (`podeduc…/video/<slug>`) → **auto-détection au collage**. Popover d'aide : PodEduc « Bientôt » → **« Pris en charge »**.
- `config.js` : défaut local de `videoTranscriptUrl` calé sur **`-dev2`** (convention `caramelia-dev2`/`caramel-audio-dev2`) ; CI écrase avec la valeur prod. **Aucune nouvelle variable.** (`js/caramelia/config.js` = module de config central des webhooks, PAS le chatbot.)

### Validations
- `node --check` video-transcript.js / ui.js / config.js : OK. Workflow JSON valide. Smoke Node (fetch stubé) : detect `{url}` → videoSource 360p + titre + durée, puis transcript `{mediaUrl}` → Albert 2 segments ; PeerTube intact.
- **Webhook live re-testé** (curl) : mode détection sur `-dev2` ET prod → `200` en ~0,3 s, `videoSource`/`title`/`duration` corrects. Mode transcription sur les 3 instances → OK.
- **E2E NAVIGATEUR RÉEL (Chrome headless via CDP, endpoint live `-dev2`)** sur la vidéo courte `123699-clique-glisse` (34 s, 360p ≈ 1,2 Mo) :
  - **TEST A — lecture** : `<video src=.../360p.mp4>` (cross-origin, **sans** `crossorigin`) → `loadedmetadata` 661×360, durée 34,24 s, `play()` OK, `currentTime` avance. ✅ (pas de CORS requis pour la lecture média.)
  - **TEST B — flux client** : `detectVideo` → playable, `videoSource` **absolue** (relative résolue par le client), `captions=false` ; `fetchTranscript` → **Albert, 2 segments FR**. ✅
  - **TEST C — UI** : ouvrir la tuile → coller l'URL PodEduc → auto-détection → état `ready` (badge vert), **les 2 groupes de génération passent de grisés à bleus** (gen-gated retiré), bouton « Voir » visible, **prompt de gauche `interactiveVideoResultat` rempli** (6558 car. incl. la transcription). ✅

### Limite / reste
- **Vidéo longue PodEduc** → résolue par découpage HLS (cf. session quinquies ci-dessous).
- ⚠️ Toujours en attente (commun à tout le chantier) : génération un-clic LLM réelle, Lumi/Éléa, export, édition navigateur, ingestion RAG, traduction fine 10 langues, propagation Sucrerie des ajouts purs `field-renderers.js`/`content-detector.js`.

---

## SESSION 2026-06-13 (quinquies) — Vidéos longues sans ffmpeg + rate-limit Albert

### Problème
L'auteur teste une vidéo PodEduc de **48 min** → Albert renvoie **« File size limit exceeded (max: 20 000 000 bytes) »**. PodEduc n'a souvent QUE le 360p (160 Mo). Pas de rendition audio seule. Le mp4 est *faststart* (un Range ne donnerait que les ~6 premières min). **`ffmpeg` indisponible** : le node Execute Command apparaît en « ? » (type non reconnu) à l'import → **commandes shell désactivées** sur ce n8n.

### Solution retenue — découpage HLS **sans ffmpeg ni shell** (100 % HTTP)
Faits vérifiés : Albert **décode un `.ts`** (testé : transcription FR parfaite) ; PodEduc sert le 360p comme **un seul `360p.ts`** indexé par byte-ranges (`#EXT-X-BYTERANGE`) qui acceptent le **Range HTTP** (206) ; un lot du milieu est un **flux TS valide** (sync `0x47`, PAT/PMT en tête → décodable indépendamment).
- **Workflow** (`caramel-video-transcript`, 3 modes sur le même endpoint, IF imbriqués) :
  - `{ mediaUrl, language, range? }` → transcription (en-tête **`Range: bytes=<range||0-`** ajouté au download ; `0-` = fichier entier pour PeerTube). **Retry On Fail activé sur le node Albert** (5 tentatives, 5 s) → absorbe les 429.
  - `{ hlsPlanUrl }` → **PLAN HLS** : GET le m3u8 de variante côté serveur, découpe le `.ts` en **lots < 18 Mo** (byte-ranges) → `{ tsUrl, chunks:[{range, offset}] }` (offset = somme des `#EXTINF`). Validé : 48 min → **10 lots** contigus.
  - `{ url }` → détection PodEduc (inchangé).
- **Client** (`video-transcript.js`) : `fetchTranscript` branche PodEduc → `transcribeViaPodeducChunks` : dérive le m3u8 (`360p.mp4`→`360p.m3u8`), demande le plan, **boucle séquentielle** sur les lots (`{mediaUrl:tsUrl, range}`), **recolle les timestamps** (retire le min du lot + ajoute l'offset EXTINF — robuste que le moteur renvoie 0-based ou PTS). Lot en échec = ignoré (transcription partielle plutôt que rien). Repli : pas de plan → appel direct mp4 (vidéos courtes). La **lecture** reste sur le mp4. Test offline : 1 plan + 10 lots → 20 segments recollés, offsets exacts (0 → 2671 s), tri OK. ✅

### Rate-limit Albert (question auteur) — MESURÉ
- **Modèle** (OpenAPI Albert / OpenGateLLM) : limites **par routeur** (= par modèle) sur 4 axes — `rpm` (req/min), `rpd` (req/jour), `tpm`, `tpd` (tokens) ; dépassement → **HTTP 429**. Lecture via `GET /v1/me/info` (sonde `Caramel - limites Albert (DEV).json`).
- **Limites du compte auteur** (`/v1/me/info`, 2026-06-13) : routeurs à **rpm 500** (rpd 50000), **rpm 50** (rpd 1000), et **rpm 10** (routeur 337, rpd 1000) — ce dernier est un **LLM** (tpm 128000), **PAS la transcription**.
- **Transcription mesurée en réel** : rafale de **15 requêtes parallèles** (vidéo courte) sur l'endpoint live → **15× HTTP 200, zéro 429** → rpm transcription **≥ 15**, en pratique **50 ou 500**. Le « 10/min » craint par l'auteur concerne un autre modèle.
- **Verdict : pas de file d'attente nécessaire.** Une vidéo de 48 min = 10 lots séquentiels ≪ 50 rpm ; utilisateurs concurrents largement absorbés à 50–500 rpm. Insurance en place : **Retry-On-Fail backoff** sur le node Albert (transparent en cas de pic). File globale (`N8N_CONCURRENCY_PRODUCTION_LIMIT` ou rate-limiter Redis) = seulement si 429 sous charge réelle (improbable). NB : la **génération LLM** (prompt→questions) passe par un AUTRE proxy (llmdev2), pas Albert.

### ✅ E2E vidéo longue VALIDÉ EN RÉEL (workflow live, 2026-06-13)
Après réimport par l'auteur (dev2/bas/prod), tests sur `41023` (48 min) :
- **Plan HLS live** : POST `{hlsPlanUrl}` → 200 en 0,16 s, **10 lots** contigus.
- **Lot du milieu** (chunk 5, range `89780152-107735467`) : 200 en 2,4 s, 11 segments, texte FR cohérent (contenu mi-vidéo), **timestamps 0-based** (`start: 0.031`) → confirme le recollage (min + offset).
- **Chaîne complète** (10 lots séquentiels) : **20,7 s**, 116 segments stitchés, couverture 0 → 2884 s, monotone, répartition homogène (39/38/39), texte « bonjour à tous » → « Au revoir ».
- **E2E navigateur (CDP)** : coller l'URL longue → jauge « Analyse et découpage… » (indéterminée) → « Transcription en cours… N/10 » (barre 0→90 %) → **ready** à t+20s, génération déverrouillée, **prompt rempli (48 289 car.)**. ✅

### Jauge de progression (demande auteur) — `ui.js`, `css/base/style.css`, `video-transcript.js`
- `fetchTranscript(url, detect, onProgress)` : callback `{stage:'plan'}` / `{stage:'transcribe', current, total}`. `transcribeViaPodeducChunks` émet la progression par lot ; PeerTube/mp4 unique = 1 étape indéterminée.
- UI : `setProgress(current,total,label)` rend une barre **déterminée** (« lot N/10 », largeur = N/total) quand total>1, **indéterminée** (barre glissante) sinon. Clés i18n inline `video_progress_chunk` / `video_progress_analyze` (repli FR, pas de churn locales).

### Correctif PeerTube audio-seul (`video-transcript.js`)
- **Bug latent** : `collectRenditions` excluait la rendition `0p` (audio-seul, `web-videos -0.mp4`, ex. 5,9 Mo vs 41 Mo en 480p) → une vidéo PeerTube **sans sous-titres** partait sur le 480p → 413 possible.
- **Fix** : collecte du `0p` taguée `kind:'audio'` ; `albertCandidates` l'essaie **en premier** (poids minimal) ; `pickPlayableRendition` l'**exclut** de la lecture (audio non jouable). Repli sur les renditions vidéo si l'audio-seul 404 (cf. audit `-0.mp4`).

### Rate-limit — réponse définitive
Transcription mesurée **≥ 15 rpm** (15/15 parallèles = 200), routeur à 50 ou 500 rpm ; le `rpm:10` est un LLM. **Pas de file d'attente nécessaire** ; Retry-On-Fail (5×5 s) sur Albert en insurance.

### Question « transcription déjà fournie ? » (auteur)
- **PeerTube** : OUI déjà — captions existantes utilisées en priorité (instantané, sans Albert).
- **PodEduc** : vérifié (41023 + audit 115 sources) → esup-pod n'expose PAS de sous-titres publics (seul `.vtt` = `overview.vtt` storyboard ; routes transcript derrière login) → Albert obligatoire.

### Reste
- Sonde `Caramel - limites Albert (DEV).json` (jetable, à supprimer ou garder). `Caramel - test ffmpeg (DEV).json` supprimée.
- (Optionnel, basse priorité) PeerTube **long SANS sous-titres** > ~19 min : l'audio-seul dépasserait 20 Mo → faudrait un découpage HLS fMP4 (plus complexe que le `.ts` PodEduc : il faut préfixer le segment d'init `#EXT-X-MAP` à chaque lot). Rare (captions presque toujours présentes).

---

## SESSION 2026-06-13 (sexies) — Jauge, audio-seul PeerTube, description, tutoriel, RAG, Caramelia

### Jauge de progression (demande auteur) — `video-transcript.js`, `ui.js`, `css/base/style.css`
`fetchTranscript(url, detect, onProgress)` émet `{stage:'plan'}` puis `{stage:'transcribe', current, total}` par lot. UI `setProgress` : barre **déterminée** (« Transcription en cours… N/10 ») quand total>1, **indéterminée** sinon. **E2E navigateur (vidéo 48 min)** : « Analyse et découpage… » → barre 0→90 % (lot 1→9/10) → ready à t+20s, prompt rempli (48 289 car.). ✅ Clés inline `video_progress_chunk`/`video_progress_analyze` (repli FR).

### Correctif PeerTube audio-seul — `video-transcript.js`
`collectRenditions` collecte désormais la rendition `0p` (audio-seul `web-videos -0.mp4`, ex. 5,9 Mo vs 41 Mo en 480p) taguée `kind:'audio'` ; `albertCandidates` l'essaie **en 1er** (poids minimal) ; `pickPlayableRendition` l'**exclut** de la lecture. Corrige un bug latent (vidéo PeerTube sans sous-titres partait sur le 480p → 413 possible). Smoke test : lecture=vidéo HLS, Albert=audio-seul d'abord. ✅

### Description H5P réécrite (11 langues) — `js/locales/*.json`
`h5p_interactive_video_description` : version courte « ce que c'est » + formats entre parenthèses, ex. FR « Une vidéo enrichie de questions (QCM, vrai/faux, texte à trous) apparaissant aux moments clés, avec un résumé final. (Tubes Apps Éducation et PodEduc) ». `verify-all-locales` 26/26.

### Tutoriel du site — `js/locales/*.json` (clé `tuto_step2_h5p_content` ×11)
Entrée « Vidéo interactive » ajoutée (Livre interactif y était déjà). Insérée avant `</ul>`, ponctuation par locale.

### RAG ILaaS Caramelia — `rag/caramelia/chunks/<lang>/h5p-interactive-video.md` (11) + ingestion BYOK
Chunks mis à jour (nouvelle description + **PodEduc pris en charge** + vidéos longues par lots + jauge). **Ingérés** via `byok-ilaas-rag-ingest` (collection `caramelia` id 55) : **11/11 OK, 4 chunks chacun** (collection 847→858). État vérifié avant : IV = 0/11 (jamais ingéré) ; Book = 11/11 (déjà là). Pagination `byok-ilaas-rag-list` = `offset`/`limit` 100 (la liste plafonne à 100 → paginer).

### Caramelia — demande d'URL obligatoire pour la Vidéo interactive ✅ VALIDÉ NAVIGATEUR
- `config.js` : `requiresVideoUrlKeys:['InteractiveVideo']` + sélecteurs `videoUrlInput`/`videoSection`.
- `flow.js` : `runGeneration` demande l'URL (étape `video_url`) si une activité requiresVideoUrl est sélectionnée et qu'aucune URL n'est en mémoire ; `handleGenerateStep` case `video_url` (valide http(s), stocke, relance) ; récap gagne une ligne « Vidéo : <url> » ; `doLaunch` passe `videoUrl`.
- `actions.js` : `fillVideoUrlAndWait(moduleKey, url)` remplit `#video-url-input-<k>`, dispatch `input`, **attend `data-state="ready"`** (jusqu'à 3 min, gère error/manual) ; `launchSingleGeneration` l'appelle après ouverture de la tuile, AVANT de cliquer Générer.
- Locales Caramelia ×11 : `video_url_ask`, `video_url_invalid`, `video_url_detecting`, `video_url_failed`, `confirm_recap_video`.
- **tuto-rag ×11** (`js/caramelia/tuto-rag/*.md`) : ajout de **Livre interactif + Vidéo interactive** (manquaient tous deux) dans la liste H5P, traduits.
- **E2E Chrome réel** : « fais une vidéo interactive » → (enrichissement → Lancer comme ça) → **Caramelia demande l'URL** → URL fournie → **récap avec « Vidéo : … » + « Vidéo interactive (H5P) »** → Lancer → « Je récupère la transcription… » → DOM : champ rempli + section **`ready`**. ✅
- Book : reconnu par Caramelia (config) et sans exigence d'URL → fonctionne via le flux normal.

### À FAIRE — déploiement Sucrerie (nouvelle conversation)
Mirror du commit Sucrerie `5e3ed15` (« intégration livre interactif ») pour la **Vidéo interactive** dans `/Users/egaunard/Desktop/Forge/sucrerie.forge.apps.education.fr` :
- `assets/js/core/activity-types.js` → ajouter `InteractiveVideo` à `CARAMEL_H5P` (whitelist de dépôt, cf. CLAUDE.md item 8).
- `assets/js/editor/content-detector.js` **ET** `field-renderers.js` → copier les ajouts purs Caramel (signature IV + renderer `timestamp` ; **field-renderers PAS touché par le commit Book** → ne pas l'oublier).
- `assets/js/h5p/field-constraints.js` (bloc IV), `assets/js/export/document-formatter.js` (`formatVideoInteractive`), éventuel `h5p-native-adapters.js`.
- `i18n/*.json` (i18n Sucrerie, séparé) → clés IV. `scripts/shared-files.sha256` à régénérer. Test anti-dérive `tests/deposit/`.

---

## SESSION 2026-06-13 (septies) — Support YouTube (best-effort, hors socle souverain)

Objectif (demande auteur) : coller un lien YouTube → la vidéo se joue + transcription auto pour placer
les questions. L'auteur a installé **yt-dlp + ffmpeg + deno** dans le conteneur n8n Scalingo
(`scripts/install-tools.sh` → `vendor/bin`, PATH via `start.sh`). Deno est là car **yt-dlp s'en sert
pour les défis JS YouTube** (atout fiabilité IP datacenter).

### Décisions d'architecture
- **Lecture = embed natif `H5P.VideoYouTube`** (mime `video/YouTube`), **aucun téléchargement** → annule
  le risque « URL signée 7 h » de l'audit (qui ne visait que le download de flux).
- **Transcription = sous-titres auto yt-dlp** (`json3`, timés), via un **micro-service Deno LOCAL**
  (`127.0.0.1:7799`, interne) appelé par n8n. Choix du runner : Execute Command désactivé sur ce n8n,
  le node Code ne peut pas shell-outer → Deno (déjà présent) fait l'hôte HTTP. n8n reste proxy unique + CORS.
- **2 étages** : Phase A (sous-titres, livrée) ; Phase B (repli audio→Albert + PO-token bgutils, stub 501).

### Fait — client Caramel (`cara_dev2`)
- `js/services/video-transcript.js` : `parseYouTubeUrl`/`isYouTube`, `detectPlatform`→`youtube`,
  `detectYouTube(url)` (POST `{youtubeUrl,language}` au webhook ; renvoie `videoSource{mime:video/YouTube}`
  + `_transcript` mis en cache + `captions.available`) ; `fetchTranscript` branche youtube (sert le cache,
  0 appel réseau de plus ; sinon `needs_manual`). **La lecture reste « playable » même si la transcription
  échoue** (anti-bot…) → bascule collage manuel.
- `js/ui/ui.js` : `looksComplete` reconnaît watch?v=/youtu.be/embed/shorts/live → auto-détection au collage.
- `js/h5p/json-healer.js` : `videoSource` string **ou** objet à URL YouTube → mime `video/YouTube`
  (au lieu de `video/mp4` codé en dur). **Seul vrai piège** : sans ça le handler YouTube ne prend pas la main.
- `js/caramelia/config.js` : `fuzzyMap` += `youtube`/`youtu.be`.
- `_headers` : CSP (report-only) += `www.youtube.com`/`youtube-nocookie.com` en `frame-src`, +
  `www.youtube.com`/`s.ytimg.com` en `script-src` (lib charge `/iframe_api`). Prépare la promotion CSP bloquante.
- Processor `InteractiveVideo.js` + i18n : **aucun changement** (mime propagé tel quel ; piste sous-titres
  non ajoutée pour YouTube car pas d'URL VTT publique ; clés `video_help_youtube`/`_beta` déjà ×11).

### Fait — serveur (repo `Forge/Scalingo/n8n-caramel`, NON déployé)
- `scripts/yt-service.ts` *(nouveau)* : serveur Deno `GET /youtube` → yt-dlp `--write-auto-subs --sub-format
  json3 --skip-download --extractor-args player_client=default,android` → parse json3 → segments+vtt+text+méta.
  Timeout, `--cache-dir /tmp`, `YTDLP_COOKIES` (secours anti-bot), mode dégradé propre. Stub `/youtube-audio` (501).
- `scripts/start.sh` *(édité)* : lance le service en tâche de fond avant `npx n8n` (1 seul conteneur `web-1`
  taille M, mode regular → joignable en localhost). Variable `YT_SERVICE_PORT` (défaut 7799).
- Workflow `Caramel - transcription video interactive (DEV).json` : 4ᵉ branche `IF youtubeUrl` → HTTP
  `127.0.0.1:7799/youtube` → Respond (CORS). Aiguillage : mediaUrl → hlsPlanUrl → **youtubeUrl** → url(PodEduc).

### Validations automatiques
- `node --check` (5 fichiers) OK ; `bash -n start.sh` OK ; workflow JSON valide (cibles de connexion vérifiées).
- Smoke Node : `isYouTube`/`detectPlatform` **10/10** ; healer mime YouTube **6/6** ; `verify-all-locales` 26/26.

### Reste (🔬 — nécessite déploiement, cf. `n8n-youtube/BRIEF-SCALINGO.md`)
- [ ] **Déployer** le repo n8n (`git push origin master` → build install-tools + restart + yt-service).
- [ ] Vérifier `/health` + `/youtube` sur le conteneur ; **réimporter le workflow** (3 paths).
- [ ] Test webhook réel sur `yWyTNqdk938` ; preview navigateur (embed joue + questions placées).
- [ ] **Surveiller la RAM** (conteneur M ; antécédent n8n 2.25.7 « saturait ») → bump M→L si OOM.
- [ ] Phase B (audio→Albert + PO-token) si vidéos sans sous-titres fréquentes.
- ⚠️ Propagation Sucrerie : `field-renderers.js`/`content-detector.js` non touchés ce coup-ci (déjà couverts IV).

---

## SESSION 2026-06-13 (octies) — YouTube DÉPLOYÉ + validé live + Phase B (audio→Albert)

L'auteur ayant donné l'accès Scalingo CLI + son repo n8n (`Forge/Scalingo/n8n-caramel`), tout a été
déployé et **validé en prod réel** dans la foulée.

### Déploiement (repo n8n, remote `origin` = Scalingo, branche `master`, conteneur unique `web-1` M)
- `scripts/install-tools.sh` (hook postbuild) installe déjà ffmpeg + yt-dlp + **deno** dans `vendor/bin`
  (deno y était pour que **yt-dlp résolve les défis JS YouTube**). Build OK : ffmpeg 7.0.2, yt-dlp
  2026.06.09, deno 2.8.3.
- `scripts/yt-service.ts` (nouveau) + `scripts/start.sh` (lance le service avant `npx n8n`) + scripts de
  test (`yt-selftest.sh`, `yt-service-test.sh`, `yt-audio-test.sh`). Service démarré : `127.0.0.1:7799`.

### Validation serveur live (one-off `scalingo run`)
- **yt-dlp marche depuis l'IP datacenter Scalingo** → *« Solving JS challenges using deno »*, **0 blocage
  anti-bot** (contredit le risque E de l'audit, jamais testé jusqu'ici).
- Sous-titres : TED `iG9CE55wbtY` → fr **413 seg** / en **427 seg** (manuels, propre, **pas de 429** grâce
  au choix de piste EXACTE en 2 passes). Repli langue d'origine validé (vidéo EN, demande FR → EN).
- `yWyTNqdk938` (« C'est pas sorcier », FR) → **0 sous-titre** (`no_subs`) — fréquent pour les vidéos FR.

### Phase B — audio→Albert (l'audit la disait « morte », c'est FAUX avec deno)
- `yt-dlp -f bestaudio` **télécharge l'audio sans PO-token** (22 Mo opus pour 26 min) → ffmpeg OK.
- Implémentée **dans le service Deno** (Option A, choix auteur) : pas de sous-titres → yt-dlp bestaudio →
  ffmpeg lots **AAC mono 16k 48k** (segment_time 600 s, ≪ 20 Mo) → **Albert verbose_json par lot** →
  recollage offsets. Endpoint `/youtube?audio=1`. Clé = **variable Scalingo `ALBERT_API_KEY`** (posée par
  l'auteur ; `ALBERT_URL` configurable). Client : `detectYouTube.canAudio` + `transcribeYouTubeAudio`
  (timeout 290 s + jauge) déclenché si pas de sous-titres.
- **Bug clé corrigé** : `--allow-net=127.0.0.1` bloquait l'appel Deno→Albert (`NotCapable`) → élargi en
  `--allow-net`. **Validé live** : C'est pas sorcier → 3 lots → **67 segments FR Whisper** (« On ira tous
  au paradis… »). AAC accepté par Albert (incertitude audit levée).
- Langue demandée = **langue de l'UI Caramel** (`currentLang`, carte `jp→ja`), pas figée à `fr` (cas prof
  d'anglais / UI FR : repli sur la langue d'origine de la vidéo ; les questions, elles, suivent le contexte
  Caramel via le prompt).

### Reste (🔬)
- [ ] **Réimporter le workflow n8n** (UI, ×3 paths dev2/bas/prod) — SEULE action manuelle restante.
- [ ] Test webhook réel + navigateur (coller URL YouTube → embed joue + questions placées).
- [ ] Déploiement client Caramel (GitLab Pages, flux habituel). Surveiller RAM (conteneur M).
- [ ] (Optionnel) Vidéo YouTube **longue** sans sous-titres : lots audio multiples (déjà géré, segment_time)
  mais total > timeout 290 s possible → borne/raccourcir si besoin.

---

## SESSION 2026-06-14 (nonies) — Déploiement Sucrerie (mirror du Livre interactif pour la Vidéo interactive)

Objectif (tâche B du brief) : reproduire côté **Sucrerie** (`/Users/egaunard/Desktop/Forge/sucrerie.forge.apps.education.fr`)
le patron du commit Livre interactif `5e3ed15` pour la **Vidéo interactive** → rendre l'IV **déposable** au
dépôt + **éditable** in-browser (un .h5p IV natif déposé : QCM/VF/Trous, timeline, résumé) + **exportable** en
DOCX/ODT/PDF. **Caramel = source de vérité** ; Sucrerie ÉDITE/DÉPOSE (ne génère PAS via Albert → aucun pipeline
URL/transcription côté Sucrerie ; YouTube non concerné). Conteneur n8n **passé en L** par l'auteur (confirmé) →
débloque la re-validation live YouTube (tâche A.1), **mise en réserve** car priorité = B.

### Contexte conteneur (info)
- `scalingo ps` : web-1 **L** (l'auteur l'a basculé en séance). La re-validation du repli audio YouTube (A.1)
  peut désormais se faire sans OOM — **non faite ce coup-ci** (priorité B).

### Décision d'architecture — Sucrerie édite du NATIF, pas de l'intermédiaire
Caramel ne GÉNÈRE que le sens forward (intermédiaire plat → natif via processeur enfant). Sucrerie ÉDITE un
.h5p **natif déposé** → il fallait écrire **les DEUX sens** (natif↔intermédiaire). Le schéma éditeur IV
(`content-detector.js`, partagé byte-identique) est en **format intermédiaire simplifié** → l'adaptateur natif
convertit natif↔simplifié, **y compris** les params des 3 exercices enfants (MultiChoice/TrueFalse/Blanks),
reproduits inline (pas de `processChild` côté Sucrerie). **Fidélité round-trip lossless** : chaque interaction
conserve son action native verbatim sous `_nativeAction` (+ enveloppe sous `_nativeItem`) → au save on REJOUE le
pristine en n'écrasant QUE les champs édités (l10n/behaviour/UI/médias intacts) ; les interactions de **type non
géré** (H5P.Text/Image/Link/GoToQuestion…) sont préservées sous `_extraInteractions` et réinjectées (zéro perte).
Les champs `_*` survivent à normalize/denormalize (comme `_metadata` du Book — passthrough générique IV).

### Fait — fichiers Sucrerie (AUCUN commit ; arbre de travail)
- **Partagés byte-identiques** (propagés par `cp` depuis Caramel ; divergence vérifiée = IV pur uniquement) :
  `assets/js/editor/content-detector.js` (signature + schéma IV + renderer `timestamp`),
  `assets/js/editor/field-renderers.js` (`renderTimestampField`),
  `assets/js/export/document-formatter.js` (`formatVideoInteractive` + map). Manifeste `gen-shared-manifest.mjs`
  régénéré (`--check` ✓, 29 fichiers).
- **`assets/js/core/activity-types.js`** : `H5P.InteractiveVideo` ajouté à `CARAMEL_H5P` (nameKey
  `activity_h5p_interactive_video`, icône déjà présente, categories `['text','quiz']`) → la whitelist de dépôt
  `supported-types.js` (auto-dérivée) **accepte désormais l'IV**.
- **`assets/js/h5p/supported-types.js`** : commentaire corrigé (IV n'est plus un exemple « non géré »).
- **`assets/js/h5p/field-constraints.js`** : bloc `InteractiveVideo` (render types html+latex sur question/
  réponses/text/summary).
- **`assets/js/editor/h5p-native-adapters.js`** *(Sucrerie-only, +321 l.)* : `IV` ajouté à
  `NATIVE_ADAPTED_LIBRARIES` ; `interactiveVideoNativeToModel` (natif→simplifié, pristine préservés) +
  `processInteractiveVideo` (simplifié→natif, merge sur pristine + gabarits l10n/UI par type pour les
  interactions AJOUTÉES) + cases dans `nativeToEditorModel`/`editorModelToNative`.
- **`assets/js/h5p-export-bridge.js`** *(Sucrerie-only)* : `adaptInteractiveVideo` (natif→plat pour le formatter
  doc) + entrée `H5P.InteractiveVideo`→`InteractiveVideo` dans `H5P_LIBRARY_TO_MODULE_KEY` + case
  `normalizeH5pModel`.
- **i18n ×11** (`i18n/*.json`, SÉPARÉ de Caramel) : **66 clés IV/locale** (65 `editor_iv_*`/`doc_fmt_video_*`/
  `h5p_interactive_video_name` tirées des locales Caramel + `activity_h5p_interactive_video`), **parité 2630**.
  Diff purement additif. Valeurs non-FR = vraies traductions (héritées de Caramel). Les 4 clés panel-only
  Caramel (`editor_iv_no_video/capture/player_toggle/capture_hint`) **exclues** (panneau lecteur non partagé).
- **Tests** : `tests/h5p-native-adapters/test-h5p-native-adapters.js` +5 tests IV (natif→modèle, round-trip
  lossless avec extras/interaction non gérée, interaction ajoutée → action valide via gabarit, garde null) →
  **55/55 OK**. `tests/deposit/test-deposit-validation.js` : `H5P.InteractiveVideo` déplacé `UNSUPPORTED`→
  `SUPPORTED_SAMPLE` (anti-dérive dépôt) → **36 OK** (le seul KO `clés i18n :: fetch failed` est
  ENVIRONNEMENTAL Node, passe en navigateur).

### Choix délibérés (NON faits, justifiés)
- **`index.js` H5P_RESTRUCTURING_TYPES : NON modifié.** Cette liste doit rester alignée sur les `case`
  structurants de `denormalizeDataForSave` (test épinglé `test-h5p-image-edit.js`). L'IV n'a **aucune**
  restructuration denormalize (schéma plat, tout est fait par `processInteractiveVideo` via le chemin natif
  `editorModelToNative`) → l'y ajouter casserait le test pour rien.
- **`h5p-completion.js` / `h5p-manager.js` : NON touchés.** Le traitement Book (`END_SIGNAL_MAIN_LIBRARIES`,
  `reportingIsEnabled`, `interactiveBookHasScorableContent`) est spécifique à son bouton « Soumettre le
  rapport ». L'IV n'a pas ce quirk → ne PAS inscrire IV dans `END_SIGNAL_MAIN_LIBRARIES` = **fail-open**
  (ouverture = fait, jamais de verrou « Suivant » à l'aveugle dans un parcours). À reconsidérer si l'auteur veut
  un suivi de complétion précis sur l'IV (IV émet un `completed` xAPI en fin de vidéo).
- **`validators.js`, `richtext-editor.js` : inchangés** (déjà byte-identiques Caramel ; pas de validation IV
  côté Caramel — cf. LOT 4). **`document-exporter.js` : inchangé** (le `formatVideoInteractive` n'utilise pas de
  tableau → le style `default` ajouté par le Book n'est pas requis).

### Validations (automatiques, Node)
- `node --check` sur les 10 fichiers touchés : **OK**. Manifeste `--check` : **✓ 29 fichiers byte-identiques**.
- Round-trip adaptateur (smoke + 55/55 tests natif-adapters), export-bridge (smoke : map, tri, exclusion
  H5P.Text, summary, normalizeH5pModel), i18n parité 2630 ×11.
- **Byte-identité partagés Caramel↔Sucrerie** vérifiée sur les 11 fichiers éditeur + export : tous identiques
  **sauf `editor-core.js`** = dérive **pré-existante** entre les dépôts (NON touché par moi, hors périmètre IV
  → à signaler/resync séparément côté auteur).

### Reste (🔬 — validation navigateur réel, non faite ici)
- [ ] Déposer un .h5p **InteractiveVideo natif** réel (Lumi/Caramel) → l'éditeur l'ouvre → édition d'une
  question/timestamp/ajout-suppression d'interaction → save → .h5p re-jouable (round-trip in-browser).
- [ ] Export DOCX/ODT/PDF d'un IV déposé (math éditable, énoncé+correction+résumé).
- [ ] Acceptation au dépôt (whitelist) + test anti-dérive dépôt en navigateur (`fetch` i18n dispo).
- [ ] (Auteur) Décider commit Sucrerie (mes diffs IV cohabitent avec du travail auteur en cours :
  `mbz-parser.js`, `my-activities.css`, `test-mbz-parser.js` — **indépendants de l'IV**).
- [ ] (Hors IV) Resync `editor-core.js` Caramel↔Sucrerie (dérive pré-existante).

### Complément (même session) — RAG Caramelia : YouTube ajouté + RÉ-INGÉRÉ
Le RAG IV avait été ingéré en *sexies* (avant l'ajout YouTube *septies/octies*) → les chunks disaient encore
« YouTube hors périmètre ». Corrigé :
- **Chunks ILaaS ×11** (`rag/caramelia/chunks/<lang>/h5p-interactive-video.md`) : paragraphe **YouTube** ajouté
  (lecture = embed natif `H5P.VideoYouTube`, **aucun téléchargement** ; transcription serveur = sous-titres auto
  yt-dlp sinon repli audio→Albert) + description alignée « (Tubes Apps Éducation, PodEduc **et YouTube**) ».
  Corps FR identique aux 11 (frontmatter `lang` distinct).
- **Source** `rag/caramelia/sources/01-activites-h5p/interactive-video.md` : section « Plateformes » réécrite
  (PodEduc = fait, plus « à venir » ; YouTube ajouté ; vidéos longues par lots).
- **tuto-rag Caramelia ×11** (`js/caramelia/tuto-rag/*.md`) : puce IV « (Tubes …, PodEduc **ou YouTube**) »
  (connecteur traduit par langue). **NB** : le tutoriel onboarding du site (`tuto_step2_h5p_content`) **et** la
  description H5P (`h5p_interactive_video_description`) mentionnaient **déjà** YouTube ×11 (faits par l'auteur).
- **Ré-ingestion ILaaS BYOK** (REPLACE = DELETE + INGEST ciblé via curl, payloads `byok-ilaas-rag-delete`
  `{document_id}` + `byok-ilaas-rag-ingest` `{collection_id:55, source, content}`) : 11 docs IV remplacés
  (anciens ids 19220-19230 → nouveaux **19231-19241**, **4 chunks** chacun), collection toujours **858** docs
  (net 0, **aucun doublon**). Contenu vérifié : chunks fr contiennent YouTube + PodEduc + `H5P.VideoYouTube`.

### Complément (même session) — Correctifs de CONTENU de l'export DOCX/ODT/PDF (revue logique)
Revue du document produit par `formatVideoInteractive` (fichier **partagé** byte-identique → corrigé dans Caramel
`js/export/document-formatter.js` puis `cp` vers Sucrerie). 3 correctifs (validés par l'auteur) :
1. **Lien de la vidéo en tête** : les horodatages « À mm:ss » ne renvoyaient à AUCUNE vidéo identifiée. Ajout
   d'une ligne « Lien de la vidéo : <url> » sous les instructions. URL dérivée de `data.videoSource`
   (intermédiaire Caramel) **OU** `data.interactiveVideo.video.files[0].path` (modèle natif Sucrerie) → robuste
   aux deux flux.
2. **Anti-divulgation du résumé** : dans le player H5P les affirmations sont mélangées, mais sur papier la bonne
   (`group[0]`) était **toujours en 1ʳᵉ position**. Rotation déterministe (`off=(gi+1)%len`) de l'ordre d'affichage ;
   la correction identifie la bonne par son **texte** (ordre d'affichage indifférent).
3. **Instructions spécifiques vidéo** : nouvelle clé `doc_fmt_video_instructions` (« regardez la vidéo et répondez
   aux questions qui apparaissent aux instants indiqués »), repli sur `doc_fmt_instructions`.
- **i18n** : 2 nouvelles clés `doc_fmt_video_link` + `doc_fmt_video_instructions` ×11, **Caramel** (verify-all-locales
  **26/26**) **et** Sucrerie (parité **2632**). Manifeste sha256 Sucrerie régénéré (`--check` ✓).
- **Vérifs** : `node --check` les 2 formatters, byte-identité Caramel↔Sucrerie ✓, rendu échantillon confirme les 3
  correctifs, `test-export` Sucrerie **31 OK / 9 KO** (les 9 KO = `DOMParser`/`fetch` environnementaux Node,
  **0 régression**).
- (Non retenu par l'auteur) renommer « Question N » → « Affirmation N » dans le résumé (cosmétique).

---

## SESSION 2026-06-14 (decies) — 4 correctifs UX/robustesse (jaune chargement, Tube longues fMP4, hauteur 16/9, QR export)

Demandes auteur, validées en navigateur réel (Chrome headless) sauf #2 (workflow local, à importer/tester).

### 1. Jaune de chargement du champ lien trop clair — `css/base/style.css`
Le voile de transcription `.video-url-field__overlay` était `rgba(255,250,240,0.5)` (crème quasi invisible) → **`rgba(255,216,112,0.82)`** (ambre net), et le fond `checking` `#fffaf0` → **`#fff1cc`**. Commun à Tube/YouTube/PodEduc (état `checking` partagé). Texte sombre reste lisible.

### 2. Tube longues sans sous-titres > ~17 min échouent (limite 20 Mo Albert) — découpage HLS **fMP4**
Cas documenté en `(quinquies)` comme « optionnel ». Le HLS PeerTube est **fMP4 fragmenté** (≠ `.ts` PodEduc) : un `moof/mdat` seul n'est pas décodable → il faut **préfixer l'init `#EXT-X-MAP` (ftyp+moov) à chaque lot**.
- **Caramel** (`video-transcript.js`) : `detectPeerTube` expose `hlsPlaylistUrl` (master m3u8). `transcribeViaPodeducChunks` généralisé en **`transcribeViaHlsChunks(info, planUrl, …)`** (PodEduc passe la variante `.m3u8` ; PeerTube passe le master). `transcribeViaAlbert(…, initRange, initUrl)` relaie l'init. Branche PeerTube de `fetchTranscript` : **longue (> 1020 s) → découpage d'emblée** ; sinon voie « fichier entier » (audio-seul d'abord) puis **fallback découpage** si échec. Recollage timestamps inchangé (robuste 0-based/PTS).
- **n8n LOCAL** (`n8n-youtube/Caramel - transcription video interactive (DEV).json`) : node « Plan HLS » généralisé (**suit master→variante** via `this.helpers.httpRequest`, détecte `#EXT-X-MAP` → `container:'fmp4'` + `initRange`/`initUrl`, budget lot = 18 Mo − initBytes). Nouveau IF **« initRange fourni ? »** + node Code **« Télécharger fMP4 (init+lot) »** (télécharge init + plage, `Buffer.concat`, `prepareBinaryData` → Albert). PodEduc/`.ts` et YouTube **inchangés**.
- **Tests** : syntaxe JS des 4 nodes Code OK ; graphe de connexions cohérent ; **parsing du plan testé** sur master+variante fMP4 (init `0-799`, 4 lots, offsets 0/4/8/12) ET variante `.ts` PodEduc (3 lots, offsets 0/10/20). ⚠️ à valider après import : sémantique `this.helpers.httpRequest({encoding:'arraybuffer'})` + `prepareBinaryData`.

### 3. Hauteur preview IV incorrecte au chargement (s'étire après coup) — réserve 16/9 RELÂCHÉE
Reprise prudente de la tentative revertée du 13/06 (qui forçait la hauteur en dur → modale cassée).
- `h5p-manager.js` : si `mainLibrary === 'H5P.InteractiveVideo'`, on pose la classe **`h5p-preview--iv-loading`** sur le conteneur AVANT montage, puis **`_releaseIVReserveWhenSized`** retire la classe dès que h5p pose la vraie hauteur (inline `iframe.style.height` en `px`, via MutationObserver ; garde-fou 6 s).
- `css/base/style.css` : `.preview-modal__h5p-container.h5p-preview--iv-loading { aspect-ratio:16/9 }` + wrapper/iframe `height:100%`. **Jamais actif après coup** (sinon rognage).
- **Test navigateur** : réserve = 800→450 px (16/9), iframe remplit ; après `style.height=600px` la classe est retirée et la **vraie hauteur l'emporte** (600 px). ✅

### 4. QR code de la vidéo en haut de l'export DOCX/ODT/PDF — `caramel-add ... export`
- **Lib vendor** : `qrcode-generator` 1.4.4 (MIT) → `js/vendor/qrcode/1.4.4/qrcode.js` + `loadQRCode()` dans `lib-loader.js`. Helper **`js/renderers/qr-utils.js`** (`generateQRDataURL` → PNG via canvas, UTF-8, niveau M).
- `document-formatter.js` : `formatVideoInteractive` pousse une section `{type:'image', qrText:videoUrl, imgSizeMm:32}` **juste après le titre**.
- `document-exporter.js` : passe QR dans `prepareImages` (génère le PNG depuis `qrText`) ; support `section.imgSizeMm` dans les 3 rendus (DOCX/PDF/ODT) pour dimensionner le QR (~32 mm).
- **i18n** : `doc_fmt_video_qr_caption` ×11 (verify-all-locales **26/26**).
- **Tests navigateur réels** : `generateQRDataURL` → PNG 6158 c ; section QR émise en index 1 ; **export DOCX réel → PNG embarqué** dans `word/media/…png` (signature PNG vérifiée).

### Notes
- Aucun fichier partagé Sucrerie touché (éditeur + 3 CSS intacts). Pas de SW/CSP/manifeste à mettre à jour pour la lib QR.
- Reste à valider par l'auteur : import + run du workflow n8n sur une vraie Tube longue sans sous-titres (45 min) ; rendu visuel du QR dans ODT/PDF.

### Débogage déploiement (2026-06-14) — `URL` indisponible dans le sandbox task-runner n8n (2.18.5)
Après mise en prod, 2 erreurs : « Plan HLS » → *Unknown error* ; « Albert » → *File size limit exceeded* (fichier entier 214 Mo).
- **Validation LIVE du maillon critique** : POST direct `{ mediaUrl:<480-fragmented.mp4>, range:"1329-6922434", initRange:"0-1328", language:"fr" }` sur le webhook déployé → **HTTP 200, 4 segments, texte FR correct**. Donc `this.helpers.httpRequest({encoding:'arraybuffer'})` + `prepareBinaryData` + concat init+lot fMP4 → Albert **fonctionnent en prod**.
- **Cause racine** : le sandbox « JsTaskRunnerSandbox » de n8n 2.18.5 **n'expose pas le constructeur global `URL`**. Dans « Plan HLS », `new URL(...)` lançait → sur master : URL relative → `httpRequest` plante (Unknown error) ; sur variante : catch → `tsUrl` retombait sur `.ts` (404). Le plan KO → le client retombait sur le **fichier entier** (214 Mo) → 413.
- **Fix** : (1) « Plan HLS » résout les URL **par chaîne** (`resolveUrl`, plus aucun `new URL`) ; (2) même durcissement dans « Scraper PodEduc » (`origin` par regex) ; (3) côté client (`video-transcript.js`), nouvelle `lowestHlsVariant()` résout **master→variante la plus basse AVANT** d'appeler n8n (le navigateur a `URL` + CORS PeerTube `*`) → le plan n8n parse la variante directement, le suivi master côté serveur n'est plus qu'un repli.
- **Re-tests** : plan re-simulé **sans `URL` global** (master→variante + variante directe) → bon `…480-fragmented.mp4` ; résolution client master→variante → 480p absolue ; syntaxe des 4 code nodes OK. **À refaire par l'auteur : RE-IMPORTER le workflow** (le fichier local est corrigé) puis recharger Caramel.
- **Validé LIVE** : PodEduc 1h → transcription OK via découpage (l'auteur confirme).

### Affinage #3 — relâchement DÉBOUNCÉ de la réserve 16/9 (`h5p-manager.js`)
Sur une vidéo lourde (PodEduc 1h), pendant le chargement la boîte « sautait » (bandeau noir court + blanc dessous, capture auteur) : le player IV pose une hauteur INTERMÉDIAIRE avant la finale, et `_releaseIVReserveWhenSized` relâchait au **1ᵉʳ** changement → boîte à la mauvaise hauteur. **Fix** : relâcher seulement après **stabilisation** (plus de changement de hauteur depuis ~900 ms ; garde-fou 8 s). Tant que ça bouge, le 16/9 reste tenu. Test navigateur : hauteur intermédiaire 300px à +400 ms → classe maintenue + boîte à 586px (16/9) ; hauteur finale 586px → relâchée après ~900 ms, sans saut. ✅
- NB : le **temps de chargement long** de la modale sur une vidéo d'1h est surtout inhérent (chargement du framework h5p au 1ᵉʳ rendu + lecture des métadonnées de la vidéo source ; un mp4 PodEduc non *faststart* fait télécharger davantage pour trouver le `moov`). La transcription, elle, est OK.

### Affinages (2026-06-14) — persistance URL + position QR + synchro Sucrerie
- **URL vidéo non restaurée au refresh** (`ui.js`) : on n'écrit plus / ne relit plus `sessionStorage` `…video_url_<key>` (write + restore retirés). Un rechargement complet repart d'un champ vide (le champ est `autocomplete="off"`) ; l'URL ne vit qu'en mémoire (`videoStates`) le temps de la session. Corrige : en navigation privée, un refresh « ramenait » la vidéo précédente.
- **QR code SOUS le lien** (`document-formatter.js`) : ordre passé de `titre → QR → instructions → lien` à `titre → instructions → lien → QR` (DOCX/ODT/PDF). Re-vérifié navigateur (ordre des sections + DOCX réel : PNG embarqué).
- **Synchro Sucrerie** : `export/document-formatter.js` + `export/document-exporter.js` **copiés** (byte-identiques Caramel↔Sucrerie, le diff ne portait que sur le QR). NOUVEAU `assets/js/renderers/qr-utils.js` **spécifique Sucrerie** : même API `generateQRDataURL(text,opts)` mais implémentation différente — Sucrerie réutilise sa lib `qrcode` **davidshimjs/qrcodejs** (classe `window.QRCode`, déjà présente pour les QR de partage, v1.5.4) au lieu de `qrcode-generator` (factory) de Caramel ; on lit le `<canvas>` + on ajoute une quiet-zone. Pas de nouvelle lib vendor ni de changement `lib-loader` côté Sucrerie. Clé `doc_fmt_video_qr_caption` ajoutée aux 11 `i18n/*.json`. Validé navigateur : QR généré + export DOCX réel avec PNG embarqué. ⚠️ `qr-utils.js` n'est donc PAS byte-identique entre les 2 dépôts (adaptateurs de lib QR différents) — à garder en tête lors d'une future propagation.

---

## SESSION 2026-06-24 — Refonte UX de l'éditeur : modes PLAN / LIVE (validée par l'auteur sur maquettes)

Retour auteur : l'éditeur IV (panneau lecteur repliable empilé AU-DESSUS du master-detail) n'était pas pratique
et débordait en hauteur basse (player à `40vh` = relatif). Après itérations sur maquettes HTML
(`docs/visuel/maquette-editeur-video-*.html`), format **validé : deux modes** basculés par un segmented control.

### Conception (volontairement NON invasive — réutilise 100 % du pipeline d'édition)
- **PLAN** (défaut) — l'éditeur master-detail **inchangé, sans vidéo** : liste chrono + formulaire complet.
  Aucune vidéo chargée à l'ouverture (rapide, pas d'autoplay, = ancien état replié).
- **LIVE** — lecteur partagé (`sync-video-player.js` : YouTube embed OU `<video>` PeerTube/PodEduc) + **timeline
  à repères**. Pendant la lecture, la question de l'instant **remonte automatiquement** dans le détail
  (« Suivre la lecture », coupé dès qu'on tape dans un champ). La nav est **masquée** (classe `iv-mode-live`
  sur le parent) → le détail prend toute la largeur. Capture au temps courant + focus auto de l'énoncé.
- **Astuce de construction** : le mode Live **ne réimplémente AUCUN champ**. Il pilote la sélection en
  « cliquant » le sous-item de nav `.json-editor__nav-subitem[data-index]` (chemin réel `navigateTo`, qui
  **sauvegarde les saisies avant de basculer**). Hauteur du média **bornée à 26vh** (CSS) → ne déborde jamais.

### Fichiers touchés
- `js/editor/interactive-video-panel.js` *(réécriture, Caramel)* — panneau 2 modes (voir en-tête du fichier).
- `js/ui/sync-video-player.js` — **+`getDuration()`** (additif, pour la timeline ; couvre `<video>` ET YouTube).
- `css/base/style.css` — bloc `.iv-editor-*` remplacé : `.iv-modebar/.iv-seg/.iv-modebtn`, `.iv-live*`,
  `.iv-live-timeline/.iv-live-mk`, règles `.iv-mode-live` (masque nav + détail pleine largeur). **Tout en CSS
  chargé → aucun FOUC.** Bonus : `.iv-editor-media video` (manquait) → la `<video>` PeerTube/PodEduc remplit
  bien la boîte (l'ancien CSS ne couvrait que `iframe`).
- `js/editor/index.js` *(Caramel)* — `destroyEditor` retire la classe `iv-mode-live` + tue le lecteur
  (le mode Live YouTube laisse un timer de sondage).
- `js/locales/*.json` ×11 — **+6 clés** `editor_iv_mode_plan/live/_hint`, `editor_iv_follow`, `editor_iv_timeline`
  (FR partout, repli ; via script jetable). `editor_iv_player_toggle`/`_capture_hint` désormais inutilisées
  (laissées en place, sans effet).

### 3 bugs corrigés après 1er test auteur (mêmes maquettes)
1. **Vidéo visible en mode Plan** : `.iv-live{display:flex}` battait l'attribut `[hidden]` (UA) → ajout
   `.iv-live[hidden]{display:none}`.
2. **Live empilé (vidéo au-dessus) au lieu de côte-à-côte** : le mode Live met désormais le PARENT
   `.preview-modal__content--editor.iv-mode-live` en `flex-direction:row` → panneau (lecteur+timeline) en
   colonne gauche **fixe 360px**, éditeur (détail) à droite. Média `max-width:100%` (remplit la colonne).
   Repli empilé `@media (max-width:880px)`.
3. **« 3 questions » trompeur** : c'étaient les 3 réponses de la Q1 (nav masquée + détail pleine largeur en
   stacked). Résolu par le côte-à-côte : l'en-tête « Question N/M » lève l'ambiguïté.

### Validations
- `node --check` panel + player + index : **OK**. `verify-all-locales` : **26/26**.
- **Test Playwright (Chromium headless, harnais montant le VRAI éditeur avec le JSON proverbes + URL YouTube
  `cvlZD3wK7JM`) : 15/15 PASS** — init sans erreur ; PLAN masque la vidéo + nav 2 questions ; LIVE côte-à-côte
  (média À GAUCHE du détail, mesuré aux bounding-boxes), nav masquée, **iframe YouTube monté** ; CAPTURE +1
  pile (2→3) ; retour PLAN OK ; hauteur basse 560px sans débordement ; **0 erreur console**.

### 2e tour de retours auteur — 3 corrections
1. **Résumé final introuvable en Live** (gros bug : la nav masquée le cachait, et il n'est pas une
   interaction horodatée). → **repère dédié « Résumé final » en bout de timeline** (drapeau à damier vert,
   `.iv-live-mk--summary`, indépendant de la durée car le résumé s'affiche en fin de vidéo) → clic = navigue
   vers la section `summary` (clic du bouton `.json-editor__nav-section[data-section-id="summary"] .json-editor__nav-item`).
2. **Icônes Plan/Live décalées verticalement** : invisible en test car mon harnais chargeait FA via CDN ; l'app
   utilise le **FA local** (`css/vendor/all.min.css`). → `line-height:1` sur `.iv-modebtn`/`i`/`span`. Mesuré
   après fix : écart icône/texte **0,01 px**.
3. **« Suivre la lecture »** : transformé de case à cocher en **bouton-bascule** (`.iv-follow-btn` pill, bleu
   actif / gris inactif, `aria-pressed`). Doublon de texte d'aide retiré.

### Validation Playwright (2e tour) — harnais avec **FA LOCAL** + le JSON proverbes réel de l'auteur
**18/18 checks DUR PASS** : init sans erreur ; PLAN sans vidéo + 2 questions + section Résumé ; **icônes alignées
0,01 px** ; LIVE côte-à-côte (média à gauche, mesuré) + nav masquée + média borné 189 px ; **repère Résumé présent
+ clic → édition du résumé** (5 groupes d'affirmations) ; bouton Suivre la lecture bascule OFF/ON ; capture +1 (2→3) ;
hauteur basse 600 px sans débordement ; retour Plan OK ; **0 erreur console**. Best-effort : **embed YouTube monté**
(`youtube-nocookie/cvlZD3wK7JM`) + 3 repères de question rendus (durée obtenue après le capture du test).
NB : repères positionnés/suivi auto dépendent de la durée du lecteur → non déterministes en headless (réseau), mais
visibles dans l'app réelle (capture auteur) et logique inchangée.

### Validation multi-sources (Playwright) + tests intégrés
- **Playwright 3 sources (29/29 DUR)** : harnais paramétré `?src=youtube|peertube|podeduc`. Prouvé en dur que le
  **routage de source** est correct : **PeerTube (Tube apps.education)** et **PodEduc** → élément **`<video>` natif**
  avec `src` = l'URL fournie (PAS d'embed) ; **YouTube** → **iframe** `youtube-nocookie/<id>`. Pour les 3 :
  côte-à-côte, nav masquée, repère Résumé présent + clic→édition, capture +1, aucune erreur JS. La **lecture réelle**
  reste best-effort (réseau headless filtré + CORS — en vrai le lecteur retombe sans `crossorigin`). Capture PodEduc
  confirme visuellement les contrôles `<video>` natifs.
- **Tests intégrés** (`tests/test-editor-iv.js`, agrégé dans `tests/test-all.html` ligne 148) : **+2 groupes** →
  « Routage source (lecteur Live) » (isYouTubeSource/ytVideoId sur YouTube vs PeerTube vs PodEduc vs HLS m3u8) et
  « Lecteur éditeur (DOM) » (mp4 → `<video>` créé, src = URL, API getCurrentTime/getDuration/seekTo/destroy).
  Suite passe **54/54** (Playwright sur `test-editor-iv.html`).

### Responsive — balayage Playwright (10 tailles) + 2 correctifs
Test sur la **vraie modale** (`.preview-modal` 90vw×95vh) à : 1280×900, 1024×768, 860×800, 768×1024, 800×700,
760×700, 414×896, 360×740, 1280×600, 1280×540. Vérifie l'orientation (côte-à-côte vs empilé), le bornage du média,
l'absence de scroll horizontal, le maintien de la modale dans le viewport et un **détail toujours lisible (>80px)**.
**76/76 PASS** après 2 correctifs CSS :
1. **Seuil de bascule abaissé 880 → 760px** : le côte-à-côte ne stacke pas la hauteur, il reste donc préférable
   tant qu'il y a ~760px de large (vidéo 360 + éditeur ~360). Avant, à 860px on empilait et l'éditeur tombait à
   65px de haut sur écran court. Maintenant 860/768px restent côte-à-côte (détail ~420/550px).
2. **Empilé (<760px) : `overflow-y:auto` sur le contenu + `min-height:360px` sur l'éditeur** → on défile au lieu
   d'écraser ; le détail reste pleinement lisible même en mobile portrait court (360×740 : détail OK, scroll).
Captures : mobile 360×740 empilé propre (vidéo + timeline + boutons, éditeur défilable) ; desktop 1280×540 très
basse en côte-à-côte. Aucun changement hors `@media (max-width:760px)` → desktop intact.

### ✅ Propagation Sucrerie + sucrerie-bas (2026-06-24) — l'hypothèse « byte-to-byte » est PARTIELLE
Dépôts : `/d/Bureau/Forge/Caramel/sucrerie.forge.apps.education.fr` et `…/sucrerie-bas` (sucrerie-bas était
**identique** à sucrerie pour les 4 fichiers concernés → modifs faites sur sucrerie puis recopiées à bas).
- **`interactive-video-panel.js`** : byte-identique → **`cp`** (LF des deux côtés, écart logique vs Caramel = 0).
- **`sync-video-player.js`** : ⚠️ Caramel en **CRLF**, Sucrerie en **LF** → PAS un cp ; j'ai **ajouté `getDuration()`**
  dans le fichier LF (Edit) pour préserver les fins de ligne (écart logique = 0).
- **CSS** : pas byte-identique (vit dans `assets/css/components/editor-view.css`, tokens Sucrerie). Bloc `.iv-*`
  **porté à la main**. **Différence importante** : Sucrerie a un éditeur **à onglets** (`.sucrerie-editor`), le
  côte-à-côte de Caramel (parent `.preview-modal__content--editor` en flex-row) n'y est PAS transposable → côté
  Sucrerie le mode Live reste **EMPILÉ** (lecteur au-dessus, nav masquée, média borné 26vh). Bouton capture rendu
  **autonome** via `var(--gradient-satin)` (Sucrerie n'a pas `.action-btn.primary-btn`).
- **`index.js`** : **aucun changement** requis (la classe `iv-mode-live` vit sur le wrapper recréé/effacé à chaque
  édition ; `close()` détruit déjà le lecteur via `ivPanelDestroy`).
- **i18n** : 6 clés ajoutées aux **11** locales Sucrerie (`i18n/*.json`, valeurs FR = repli) via script par ancre.
- **`scripts/shared-files.sha256`** : régénéré (`gen-shared-manifest.mjs`) + `--check` OK (31 fichiers intacts) sur
  les deux dépôts.
- **Test Playwright (harnais Sucrerie : vrais modules translation/editor-core/content-detector/panneau + CSS Sucrerie
  + FA7) : 14/14 PASS** — init sans erreur ; Plan sans vidéo ; **icônes alignées 0,01 px (FA7)** ; LIVE **empilé**
  (vidéo au-dessus, nav masquée, média borné 234 px) ; **repère Résumé + clic→édition** ; bouton capture stylé via
  token Sucrerie (`rgb(23,104,196)`) ; follow OFF/ON ; capture +1 ; **0 erreur JS**. Harnais supprimé après test.
- **Layout Sucrerie — itérations (retours auteur)** : objectif final = **même format que l'éditeur d'activité
  normal** (une seule carte continue collée sous la tabbar). Décision retenue : `.iv-editor-panel` côté Sucrerie =
  `margin: 0` (collé sous la tabbar, dont le `border-bottom` sert de séparateur), `border-left/right: 1px #e5e5ea`
  (NI haut NI bas → continuité), `border-radius: 0`, fond `#f7fafd` subtil. Résultat : cadre **unique**
  tabbar → bandeau « Plan | Live » → éditeur (`.sucrerie-editor__body` ferme le bas, coins arrondis), couleurs
  alignées sur l'éditeur normal. Vérifié au pixel (écart bandeau↔tabbar = 0) + capture. **Caramel non touché**
  (modale sans tabbar). *(Étapes intermédiaires explorées puis abandonnées : bandeau détaché du tabbar + fusion bas ;
  l'auteur a finalement demandé le format « collé sous la tabbar » identique à l'éditeur standard.)*

### Reste à valider EN NAVIGATEUR RÉEL (🔬 — par l'auteur, sur Éléa/Lumi)
- [ ] **Lecture réelle** d'une vraie Tube apps.education et d'une vraie PodEduc (routage prouvé ; il ne reste que
      le rendu des pixels, dépendant de l'hôte) + suivi auto pendant la lecture + clic repère → seek.
- [ ] Enregistrement → re-package `.h5p` fidèle (le résumé édité en Live doit bien repartir).
- [ ] (Sucrerie) Ouvrir une vidéo interactive importée → vérifier le mode Live **empilé** en conditions réelles
      (données produites par h5p-native-adapters) + dépôt OK (test anti-dérive `tests/deposit`).

### ⚠️ Propagation Sucrerie (CLAUDE.md item 7)
- `js/editor/interactive-video-panel.js` et `js/ui/sync-video-player.js` sont **byte-identiques** côté Sucrerie
  → recopier (`getDuration()` est additif ; le panneau ne dépend d'aucun import Caramel-only : `t` + `createVideoPlayer`
  + DOM `json-editor__*` partagé). Les **6 clés i18n** `editor_iv_*` → `i18n/*.json` Sucrerie.
- Le **CSS `.iv-*`** vit côté Sucrerie dans `assets/css/components/editor-view.css` (PAS `style.css`) → y reporter
  le nouveau bloc en adaptant aux tokens Sucrerie. `index.js` est divergent → reporter manuellement les 2 ajouts
  de `destroyEditor` (retrait classe + kill player).
