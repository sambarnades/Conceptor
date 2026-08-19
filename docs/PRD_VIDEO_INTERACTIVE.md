# PRD / Cahier des charges — Vidéo interactive (H5P.InteractiveVideo)

> Statut : **spécification** (v0.1 — 2026-06). Décisions de périmètre actées avec l'auteur le 2026-06.
> Objectif produit : coller une URL de vidéo → la transcription timée est récupérée → un clic génère
> une vidéo interactive H5P dont les questions sont placées au bon moment. « Plug and play ».

---

## 1. Objectif et principe

Permettre à un enseignant de générer une **vidéo interactive H5P** à partir d'une simple URL de
vidéo hébergée sur une plateforme souveraine, sans configuration. Le flux idéal :

```
1. L'utilisateur ouvre la tuile « Vidéo interactive »
2. Il colle une URL (PeerTube apps.education ou PodEduc)
3. Caramel détecte la vidéo → badge d'état (lisible ? transcription dispo ?)
4. Le bouton « Générer en un clic » apparaît
5. Récupération de la transcription TIMÉE (instantanée si sous-titres, sinon ~30 s via Albert)
6. La transcription + le contexte pédagogique sont injectés dans le prompt
7. Le LLM produit des interactions horodatées (QCM/VF/Texte à trous + Résumé final)
8. Le processor construit le .h5p (vidéo référencée par URL, pas bundlée)
9. Édition fine possible dans l'éditeur visuel + export DOCX/ODT/PDF des questions par timestamp
```

**Point clé d'architecture : deux flux indépendants.**

| Flux | Rôle | Sortie |
|---|---|---|
| **① Source de lecture** | Ce que le `.h5p` embarque pour *jouer* la vidéo | URL mp4 progressive (player `html5`) |
| **② Transcription timée** | Ce qu'on injecte dans le *prompt* pour placer les questions | `segments[] = {start, end, text}` |

Ces deux flux peuvent venir de la même résolution n8n mais répondent à des contraintes différentes
(la lecture exige une rendition mp4 ; la transcription se contente de l'audio).

---

## 2. Périmètre v1 (décisions actées)

| Sujet | Décision |
|---|---|
| **Plateformes** | PeerTube (apps.education) + PodEduc. *(YouTube et MP4-direct écartés ; MP4-direct reste une option « filet de secours » quasi gratuite — cf. §10.)* **Depuis** : YouTube a finalement été ajouté (best-effort, cf. `services/video-transcript.js`), et la reconnaissance PeerTube s'est révélée **indépendante de l'instance** — `tube.reseau-canope.fr` validé le 2026-08-01 (cf. `docs/SUIVI_VIDEO_INTERACTIVE.md`). |
| **Transcription** | **Cascade** : sous-titres existants timés → sinon fallback Albert/Whisper. |
| **Types d'interactions générées** | QCM (`H5P.MultiChoice`), Vrai/Faux (`H5P.TrueFalse`), Texte à trous (`H5P.Blanks`) + **Résumé final** (`H5P.Summary` via le champ natif `summary.task`). |
| **Vidéos longues / transcription lente** | Polling asynchrone + barre de progression (réutilise le mécanisme `submit`/`result` de `llm.js`). |

**Hors périmètre v1** : YouTube/Vimeo, upload de fichier vidéo local, types d'interactions
au-delà des 4 retenus (DragText, MarkTheWords, Hotspot, GoToQuestion…), édition du chapitrage
manuel, génération multilingue de la vidéo.

---

## 3. État de l'existant (audit dépôt)

**Excellente nouvelle : aucune lib H5P à produire.** Tout est déjà dans `js/vendor/h5p-libs/` :

- `H5P.InteractiveVideo-1.27` (runtime 1.27.9) + éditeur `H5PEditor.InteractiveVideo-1.25`
- `H5P.Video-1.6` (players `youtube.js`, `html5.js`, `vimeo.js`, `panopto.js`, `echo360.js`)
- Les 4 types d'interactions retenus + les 14 autres possibles, tous présents
  (`H5P.MultiChoice 1.16`, `H5P.TrueFalse 1.8`, `H5P.Blanks 1.14`, `H5P.Summary 1.10`…)
- Toutes les core libs (FontAwesome, jQuery.ui, DragNBar, Question, MathDisplay…)

**Ce qui manque (à créer) :**

| Élément | Fichier | État |
|---|---|---|
| Processor | `js/h5p/processors/InteractiveVideo.js` | ❌ à créer |
| Enregistrement (3 maps) | `js/h5p/processors/index.js` | ❌ à compléter |
| Entrée tuile | `js/core/definitions.js` | ❌ à créer |
| Contraintes de champs | `js/h5p/field-constraints.js` | ❌ à compléter |
| Traductions (11 langues) | `js/locales/*.json` | ❌ à créer |
| Prompt LLM | `assets/data/prompts/` | ❌ à créer |
| Exemple JSON | `assets/data/examples/` | ❌ à créer |
| Champ UI « URL vidéo » + détection | `index.html`, `js/ui/ui.js` | ❌ à créer |
| Service transcription | `js/services/video-transcript.js` (nouveau) | ❌ à créer |
| Widget éditeur `timestamp` | `js/editor/field-renderers.js` | ❌ à créer |
| Formateur export | `js/export/document-formatter.js` | ❌ à compléter |
| Workflows n8n (`detect`, `transcript`) | côté n8n (hors dépôt) | ❌ à créer/adapter |

---

## 4. Architecture des services n8n (le cœur du projet)

Deux nouveaux endpoints, suivant le pattern async existant (`submit` → poll `result`).

### 4.1 `POST /webhook/caramel/video-detect` (léger, synchrone, < 2 s)

Appelé dès que l'utilisateur colle une URL. Sert à afficher le badge d'état et débloquer le bouton.

**Entrée :** `{ "url": "https://tube.../w/abc123" }`

**Sortie :**
```json
{
  "supported": true,
  "platform": "peertube|podeduc",
  "title": "Titre de la vidéo",
  "duration": 612,
  "thumbnail": "https://.../preview.jpg",
  "playable": true,              // une rendition mp4 progressive existe-t-elle ?
  "videoSource": { "type": "html5", "url": "https://.../video.mp4", "mime": "video/mp4" },
  "captions": {
    "available": true,           // sous-titres timés déjà présents ?
    "lang": "fr",
    "source": "platform"         // platform | none
  }
}
```

Logique : résolution via **API de la plateforme** (pas de téléchargement) :
- **PeerTube** : `GET /api/v1/videos/{id}` → `files[]`/`streamingPlaylists[]` (rendition mp4),
  `GET /api/v1/videos/{id}/captions` → sous-titres VTT.
- **PodEduc** (Esup-Pod) : API/oembed Pod → URL mp4 progressive + piste WebVTT si dispo.

### 4.2 `POST /webhook/caramel/video-transcript/submit` + `…/result` (async, polling)

Récupère la transcription timée selon la **cascade**.

**Entrée :** `{ "url": "...", "platform": "peertube", "preferCaptions": true }`

**Cascade :**
```
1. captions.available ?  ── OUI ─→ télécharger le VTT, parser → segments[]   ⚡ instantané
2. sinon (fallback Albert) :
   a. yt-dlp -f bestaudio (audio seul, léger) OU rendition mp4 → extraction audio
   b. POST Albert transcription (Whisper) avec word/segment timestamps
   c. normaliser → segments[]
```

**Sortie normalisée (identique quelle que soit la voie) :**
```json
{
  "status": "done",
  "source": "captions|albert",
  "language": "fr",
  "duration": 612,
  "vtt": "WEBVTT\n\n00:00:14.200 --> 00:00:19.800\n...",   // brut, pour piste de sous-titres
  "segments": [
    { "start": 14.2, "end": 19.8, "text": "..." },
    { "start": 19.8, "end": 27.1, "text": "..." }
  ]
}
```

### 4.3 Résultats du Lot 0 (sondage réel sur vidéos de prod — 2026-06)

Testé sur PeerTube `tube-sciences-technologies.apps.education.fr/w/2m4vGrwriQ2H3b84ZbL9Rx`
et PodEduc `podeduc.apps.education.fr/video/123699-clique-glisse/`.

| Critère | PeerTube | PodEduc | Conséquence |
|---|---|---|---|
| mp4 progressif | ✅ fragmenté HLS + legacy `web-videos/*.mp4` | ✅ `…/360p.mp4` (+ HLS `livestream.m3u8`) | Lecture `html5` OK des deux côtés |
| Range / seek (HTTP 206) | ✅ | ✅ | Navigation dans la vidéo OK |
| CORS (`Access-Control-Allow-Origin`) | ✅ `*` | ❌ aucun (OPTIONS→405) | cf. note CORS ci-dessous |
| Sous-titres réels | ❌ (vidéo testée) | ❌ (`overview.vtt` = storyboard, pas des subs) | → fallback Albert quasi systématique |
| API d'accès | REST publique `/api/v1/videos/{id}` (+ `/captions`) | REST 401 → **scraper la page** ou oembed | `detect` diffère selon plateforme |

**Verdicts :**

1. **Lecture : OK pour les deux.** Le mp4 progressif existe partout (au pire `360p`). Range/seek OK.
2. **CORS PodEduc absent mais NON bloquant.** Un `<video>` cross-origin ne déclenche un contrôle CORS
   **que si l'attribut `crossorigin` est posé**. Le player `H5P.Video/html5.js` ne le pose que si
   `H5PIntegration.crossorigin` est défini (`setInitialSource()` → `H5P.setSource`/`H5P.getCrossOrigin`).
   **Caramel ne définit pas `crossorigin`** (vérifié : aucune occurrence dans `js/h5p/`). Donc lecture OK.
   ⚠️ **Risque résiduel** : si Éléa/Moodle force globalement `crossorigin:'anonymous'` en prod, la lecture
   PodEduc casserait (le navigateur exigerait alors l'en-tête CORS, absent). → **à vérifier sur l'instance de prod.**
3. **Transcription = server-side (n8n) → CORS hors sujet.** On ne `fetch()` jamais la vidéo dans le
   navigateur ; n8n GET le mp4 public et le passe à Albert.
4. **PeerTube fédéré** : la vidéo testée est servie par `tube-cycle-3` alors que l'URL pointe
   `tube-sciences-technologies`. Le `detect` doit utiliser `isLocal` + `files[].fileUrl` /
   `streamingPlaylists[].files[].fileUrl` de l'API, **jamais reconstruire l'URL à la main**.

**Prérequis restants (côté toi / n8n) :**

- **A. Albert timestamps** : le workflow `caramel-audio-dev2` renvoie aujourd'hui du **texte plat**
  (`{text}` / `{transcript}`, cf. `voice.js:337-345`). Whisper produit les segments → appeler Albert
  avec `response_format=verbose_json` (ou `timestamp_granularities=segment`) et renvoyer
  `segments[].start/end/text`. **Évolution mineure, non bloquante.**
- **B. ffmpeg dans n8n** : pour extraire l'audio du mp4 avant Albert (ou vérifier qu'Albert accepte la
  vidéo brute). **yt-dlp n'est plus nécessaire** (URLs mp4 directes disponibles).
- **C. `crossorigin` en prod** : confirmer qu'Éléa/Magistère/Moodle ne force pas
  `H5PIntegration.crossorigin` (sinon PodEduc non lisible — PeerTube resterait OK grâce à son CORS `*`).

---

## 5. Pipeline Caramel (côté navigateur)

### 5.1 Tuile et entrée URL

- Entrée dans `definitions.js` (`h5pModules.InteractiveVideo`) avec un **flag spécial**
  `requiresVideoUrl: true`, `categories: ["video", "h5p"]`, `formats: ["H5P","DOCX","ODT","PDF"]`,
  `platforms: ["Éléa","Magistère","Moodle"]`, ajout au `customOrder`.
- `toggleActivityContent()` (`ui.js`) : si `requiresVideoUrl`, afficher un champ URL **en tête**
  de la sidebar. Le contexte pédagogique habituel (`#qui`/`#quoi`/`#niveau`) reste disponible et
  s'**ajoute** à la transcription (discipline, niveau, intention).
- À la saisie/collage de l'URL → debounce → appel `video-detect` → rendu du badge :
  - 🟢 « Transcription disponible — génération immédiate » (`captions.available`)
  - 🟡 « Transcription à générer (~30 s) » (fallback Albert)
  - 🔴 « Vidéo non lisible dans H5P » (`playable:false`) → bouton désactivé + message
- Bouton « Générer en un clic » visible seulement si `supported && playable`.

### 5.2 Service `js/services/video-transcript.js`

Clone du pattern de `llm.js` (submit → poll `result` toutes 3 s, timeout 5 min, gestion
`classifyError`). Expose :
- `detectVideo(url)` → métadonnées (§4.1)
- `fetchTranscript(url, platform)` → segments + vtt (§4.2), avec callback de progression
  pour la barre.

### 5.3 Prompt

- Nouvelle entrée dans `ACTIVITY_CONFIG` de `prompt-generator.js` :
  `videoInteractive: { prefix: 'prompt_video_interactive', resultKey: 'videoInteractiveResultat' }`.
- Section SOURCES = transcription formatée `[mm:ss] texte…` (segments concaténés, éventuellement
  regroupés par fenêtres de ~30–60 s pour limiter la taille).
- Le prompt **contraint** le LLM à : répartir N questions sur la durée, choisir parmi
  {QCM, VF, Texte à trous}, donner un `timestamp` (secondes) cohérent avec la transcription,
  produire un `summary` final (3–6 affirmations vrai/faux pour `H5P.Summary`).
- Templates : `assets/data/prompts/video_interactive.md` ; exemple : `assets/data/examples/video_interactive_1.json`.

### 5.4 Format JSON intermédiaire (sortie LLM, avant processor)

Format « plat » et lisible, indépendant de la complexité H5P (le processor fait la traduction) :

```json
{
  "title": "Titre de la vidéo interactive",
  "videoSource": { "type": "html5", "url": "https://.../video.mp4", "mime": "video/mp4" },
  "poster": null,
  "interactions": [
    {
      "timestamp": 45,
      "pause": true,
      "type": "multichoice",
      "question": "Quelle est l'idée principale ?",
      "answers": [
        { "text": "Réponse A", "correct": true,  "feedback": "Bravo !" },
        { "text": "Réponse B", "correct": false, "feedback": "Revois 0:30." }
      ]
    },
    {
      "timestamp": 120,
      "pause": true,
      "type": "truefalse",
      "question": "L'auteur affirme que …",
      "correct": false
    },
    {
      "timestamp": 200,
      "pause": true,
      "type": "blanks",
      "text": "La photosynthèse produit du *dioxygène*."
    }
  ],
  "summary": {
    "intro": "Choisis l'affirmation correcte :",
    "statements": [
      ["Affirmation correcte", "Distracteur 1", "Distracteur 2"]
    ]
  },
  "transcriptVtt": "WEBVTT\n..."   // injecté par Caramel, pas par le LLM
}
```

### 5.5 Processor `js/h5p/processors/InteractiveVideo.js`

Traduit le JSON intermédiaire → structure H5P réelle (validée sur
`H5P.InteractiveVideo-1.27/semantics.json`) :

```
interactiveVideo:
  video:
    files: [ { path:<url>, mime:"video/mp4" } ]      // ou {path,mime:"video/YouTube"} si option MP4/YT
    startScreenOptions: { title, hideStartTitle:false }
    textTracks:
      videoTrack: [ { label:"Transcription", kind:"subtitles", srcLang:"fr", track:{...vtt} } ]
  assets:
    interactions: [
      {
        duration: { from: <timestamp>, to: <timestamp + Δ> },   // Δ ~ 0 pour un point d'arrêt
        pause: true,
        displayType: "button",
        x: 45, y: 45, width: 10, height: 10,
        label: "Question",
        libraryTitle: "Multiple Choice",
        action: { library: "H5P.MultiChoice 1.16", params: {...}, subContentId: <uuid>, metadata:{...} }
      }
    ]
    bookmarks: [ { time:<t>, label:"…" } ]            // optionnel : chapitrage depuis segments
  summary:
    task: { library: "H5P.Summary 1.10", params:{...}, subContentId:<uuid> }
    displayAt: 3                                       // secondes avant la fin
```

- Métadonnées du processor : `machineName: "H5P.InteractiveVideo"`, `version {major:1, minor:27}`,
  `extraDependencies` = `H5P.Video 1.6`, `H5P.DragNBar`, FontAwesome, jQuery.ui + **dépendances
  dynamiques** des types d'interactions réellement présents (collectées comme `QuizSet.js` /
  `CoursePresentation.js` le font déjà).
- Les `params` de chaque interaction sont construits via les helpers existants
  (`processQuizSetItem` / `buildExerciseParams`) — **réutilisation maximale** des mappers QCM/VF/Blanks.
- Enregistrement dans `index.js` : `processorMetadata`, `processorLoaders`, `libraryToKey`.

### 5.6 Healer & contraintes de champ

- `field-constraints.js` : déclarer les render types des champs textuels (énoncés `html+latex`,
  réponses `html+latex`, feedback `html`). Réutiliser les contraintes déjà définies pour
  MultiChoice/TrueFalse/Blanks (alias de moduleKey si besoin).
- `json-healer.js` : aucun bypass. Vérifier qu'il gère le nouveau format (wrap `params`, UUIDs,
  versions). Ajouter une règle si le LLM oublie `duration.to` (= `from`).

### 5.7 Éditeur visuel

- Nouveau widget `renderTimestampField()` dans `field-renderers.js` (saisie `HH:MM:SS`, stockage
  en secondes) + entrée `'timestamp'` dans le mapping `fieldRenderers`.
- `array-manager` existant pour la liste d'interactions, **triées par timestamp**, chaque item
  affichant son temps en tête. Champ « type » (select) → rendu conditionnel des sous-champs.
- (Optionnel v1.1) aperçu vidéo avec marqueurs sur une frise temporelle.

### 5.8 Export DOCX/ODT/PDF

- `formatVideoInteractive(data)` dans `document-formatter.js` + entrée dans le mapping `formatters`.
- Rendu : pour chaque interaction triée par temps → `À 02:15 — <question>` + propositions
  (checkbox), puis saut de page → page « Correction » (bonnes réponses + feedback), puis le résumé
  final. Pipeline math (`keepLatex`) appliqué si les énoncés contiennent du LaTeX.

---

## 6. Flux de données complet (vue synthétique)

```
URL ──detect──▶ badge + bouton
       │
       └─(clic)─▶ video-transcript ──▶ segments[] + vtt + videoSource
                        │
                        ▼
            prompt-generator (contexte péda + [mm:ss] transcription)
                        │
                        ▼
                  llm.js (submit/poll) ──▶ JSON intermédiaire (§5.4)
                        │
                        ▼
                  json-healer ──▶ InteractiveVideo.js (processor)
                        │
                        ▼
                  h5p-creator ──▶ .h5p (vidéo référencée par URL + piste VTT)
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                 ▼
   éditeur visuel   preview h5p     export DOCX/ODT/PDF
```

---

## 7. Fichiers à créer / modifier

| # | Fichier | Action |
|---|---|---|
| 1 | `js/core/definitions.js` | Entrée `InteractiveVideo` + `requiresVideoUrl` + `customOrder` |
| 2 | `index.html` | Champ URL vidéo + zone badge d'état (dans la sidebar activité) |
| 3 | `js/ui/ui.js` | Affichage conditionnel du champ URL, appel `detect`, badge, activation bouton |
| 4 | `js/services/video-transcript.js` | **Nouveau** — `detectVideo()`, `fetchTranscript()` (pattern polling) |
| 5 | `js/services/prompt-generator.js` | Entrée `ACTIVITY_CONFIG` + injection transcription |
| 6 | `assets/data/prompts/video_interactive.md` | **Nouveau** — template prompt |
| 7 | `assets/data/examples/video_interactive_1.json` | **Nouveau** — exemple |
| 8 | `js/h5p/processors/InteractiveVideo.js` | **Nouveau** — processor |
| 9 | `js/h5p/processors/index.js` | 3 maps (metadata, loader, libraryToKey) |
| 10 | `js/h5p/field-constraints.js` | Render types des champs |
| 11 | `js/h5p/json-healer.js` | Règle(s) de réparation si nécessaire |
| 12 | `js/editor/field-renderers.js` | Widget `timestamp` + mapping |
| 13 | `js/export/document-formatter.js` | `formatVideoInteractive()` + mapping |
| 14 | `js/locales/*.json` (11) | Clés i18n (tuile, badge, prompt, éditeur) |
| 15 | **n8n** (hors dépôt) | Workflows `video-detect` + `video-transcript` (cascade + Albert) |

---

## 8. Lotissement proposé

- **Lot 0 — Validation des prérequis** : ✅ **fait** (cf. §4.3). PeerTube + PodEduc lisibles, mp4
  progressif partout, transcription via Albert. Restent les prérequis A/B/C de §4.3 (Albert timestamps,
  ffmpeg n8n, crossorigin prod) — non bloquants pour démarrer le code.
- **Lot 1 — Tuyau bout-en-bout (sans IA fine)** : tuile + champ URL + `detect` + `transcript`
  (chemin sous-titres uniquement) + processor minimal (vidéo + 1 QCM en dur) → un `.h5p` qui s'ouvre
  et joue la vidéo. Valide la lecture et le packaging.
- **Lot 2 — Génération LLM** : prompt + exemple + format intermédiaire + processor complet
  (QCM/VF/Blanks + summary) + healer + field-constraints.
- **Lot 3 — Fallback Albert** : cascade complète + polling + barre de progression.
- **Lot 4 — Éditeur + export** : widget timestamp, tri, `formatVideoInteractive`, sous-titres VTT,
  bookmarks.
- **Lot 5 — Traductions (11 langues) + release** (skill `caramel-translations`, `caramel-release`).

---

## 9. Comportements dégradés

| Cas | Comportement |
|---|---|
| Vidéo non lisible (pas de mp4 progressif, HLS-only, ou `detect` échoue) | Badge 🔴, bouton désactivé, message « lecture non supportée ; essayez une autre vidéo ». *(Cas rare : les deux plateformes exposent un mp4 progressif — cf. §4.3.)* |
| Sous-titres absents | Bascule automatique Albert, badge 🟡 ~30 s, barre de progression. |
| Transcription Albert en échec/timeout | `classifyError` → message ; proposer génération « sans timing » (questions réparties uniformément sur la durée) ? *(à décider — cf. §11)* |
| Vidéo très longue (> ~20 min) | Transcription par fenêtres ; avertir du temps ; pas de blocage dur en v1. |
| URL non reconnue | Badge 🔴 « plateforme non supportée (PeerTube apps.education, PodEduc) ». |

---

## 10. Option « filet de secours » MP4 direct / YouTube (non retenue, documentée)

Écartées en v1 pour la souveraineté. À noter cependant : le **MP4 direct par URL** est quasi gratuit
(player `html5`, aucune résolution n8n) et **YouTube** est natif côté lecture (`mime:"video/YouTube"`)
avec auto-subs souvent disponibles. Réactivables ultérieurement en ajoutant un `type` dans
`videoSource` + une branche dans `detect`/`transcript`, sans toucher au processor.

---

## 11. Questions ouvertes restantes (à trancher avant Lot 2)

1. **Champ URL : global ou par activité ?** Recommandation : **par activité** (`requiresVideoUrl`)
   pour ne pas polluer l'UI des autres tuiles. À confirmer.
2. **Nombre de questions par défaut** : réutiliser `#nombreQuestions` global, ou un défaut adaptatif
   à la durée (ex. 1 question / 2 min) ? Recommandation : adaptatif borné [3..12].
3. **Échec de transcription** : proposer un mode « sans timing » (questions réparties uniformément)
   ou bloquer ? Recommandation : proposer le mode dégradé (meilleure résilience).
4. **Piste de sous-titres** : injecter systématiquement la transcription comme `textTracks` (a11y) ?
   Recommandation : oui par défaut, désactivable.
5. **Bookmarks/chapitrage** : générés automatiquement (1 par segment thématique) en v1 ou v1.1 ?
   Recommandation : v1.1.
6. **Version d'`H5P.InteractiveVideo`** : cibler 1.27 (la plus récente présente). À confirmer vs la
   version supportée par Éléa/Magistère en production.

---

# MISE À JOUR 2026-06-13 — post-audit de faisabilité

> Cette partie **complète et révise** les sections ci-dessus à la lumière de la validation empirique
> de la transcription. Source : `docs/AUDIT_TRANSCRIPTION_VIDEO_2026-06.md` (sondes réseau réelles +
> vérification adversariale). En cas de divergence, **cette partie fait foi**.

## 12. Décisions révisées (ce qui change vs §2)

| Sujet | Décision révisée | Justification (audit) |
|---|---|---|
| **PeerTube — sous-titres** | Chemin **prioritaire** : récupérer les captions auto **directement côté navigateur** (CORS `*`). | Transcription Whisper **activée** sur apps.education (v8.1.8) ; VTT `fr` timé dispo via API publique. |
| **PodEduc — sous-titres** | **Aucun** sous-titre public → **toujours** la voie audio→Albert. | 0 caption sur 115+ sources ; API `/rest/` = 401 ; `overview.vtt` = storyboard. |
| **Transcription (moteur)** | **Workflow n8n dédié** `caramel-video-transcript` (Albert `verbose_json`). Ne PAS réutiliser/modifier `caramel-audio` (micro Caramelia). | Le micro et la vidéo ont des contrats de sortie différents ; isolation = zéro risque de régression. |
| **YouTube** | **Bonus best-effort opt-in**, hors socle v1. Activable plus tard. | Fonctionne (client `android`, sans PO token) mais fragile : URL signée ~7 h, dépend d'un yt-dlp maintenu, **IP datacenter non testée**, audio bloqué. |
| **Filet de sécurité (NOUVEAU)** | Si la transcription auto échoue/indispo → **champ de collage manuel** ; Caramel **nettoie et met en forme** automatiquement le texte collé (cf. §15). | Garantit qu'on peut TOUJOURS générer, même sans transcription récupérable. |
| **Format intermédiaire transcription** | Objet normalisé unique (cf. §14.2) `{ source, language, duration, text, segments[], vtt }`, identique quelle que soit la voie. | Le reste du pipeline (prompt, processor, éditeur) ne dépend pas de la provenance. |

## 13. Cascade de transcription révisée (où chaque étape s'exécute)

```
URL collée
   │
   ├─[PeerTube]── detect CÔTÉ NAVIGATEUR (API publique, CORS *)
   │     ├─ captions.total>0 ─→ fetch VTT navigateur ─→ segments[]      ⚡ instantané, 0 n8n
   │     └─ sinon ─→ mediaUrl (files[].fileUrl) ─→ [voie Albert]
   │
   ├─[PodEduc]─── detect (scrape page/RSS, via n8n car pas de CORS)
   │     └─ pas de captions ─→ mediaUrl (regex /media/.../{360p}.mp4|audio_192k.m4a) ─→ [voie Albert]
   │
   ├─[YouTube]─── (opt-in) yt-dlp client android ─→ auto-subs json3 ─→ segments[]   ⚠️ fragile
   │
   └─[voie Albert]  POST n8n caramel-video-transcript { mediaUrl, language }
                       → n8n télécharge le média (serveur) → Albert verbose_json
                       → segments[{start,end,text}] + vtt                ~temps réel ÷37 (GPU)
   │
   └─[ÉCHEC / indispo] ─→ badge "transcription non récupérée" + champ COLLAGE MANUEL (§15)
                            → nettoyage + mise en forme auto → segments[] (si timestamps) ou texte non-timé
```

**Règle UI** : le badge d'état (§5.1) gagne un 4ᵉ état :
- 🟢 transcription récupérée (captions ou Albert) → génération directe.
- 🟡 transcription à générer via Albert (~qq s) → barre de progression.
- 🟠 **transcription non récupérable automatiquement → "Collez la transcription ci-dessous"** (champ révélé).
- 🔴 vidéo non lisible dans H5P (pas de mp4 progressif) → bouton désactivé.

## 14. Workflow n8n dédié `caramel-video-transcript`

Fichier prêt à importer : **`Caramel - transcription video interactive (DEV).json`** (racine du dépôt).
Dérivé de `Caramel - transcription audio (PROD).json`, avec 3 changements clés.

### 14.1 Structure (5 nœuds + 1 sticky note)
```
Webhook POST /caramel-video-transcript (responseNode)
  → Télécharger le média (HTTP GET mediaUrl, responseFormat=file → binaire "data")   [résout CORS PodEduc, garde la clé serveur]
  → Albert /v1/audio/transcriptions (multipart, response_format=verbose_json)         [LE déblocage]
  → Normaliser (Code node : segments[{start,end,text}] + vtt reconstruit)
  → Respond to Webhook (CORS *)
```
Réutilise la **même credential Albert** (`Albert (Compte Caramel)`, id `DlY67XmwXahbSkS7`) → rien à reconfigurer.

**Endpoint PROD (déployé, actif et ✅ TESTÉ EN RÉEL le 2026-06-13)** :
`https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript`
→ à exposer côté Caramel via `CARAMEL_VIDEO_TRANSCRIPT_URL` (même mécanisme d'injection CI que `CARAMELIA_AUDIO_URL`).
Validation : POST `{mediaUrl PeerTube 480p, language:"fr"}` → HTTP 200 en 0,56 s, `segments[{start,end,text}]`
+ `vtt`, transcription FR parfaite (cf. `AUDIT_TRANSCRIPTION_VIDEO_2026-06.md` §7).
**Important côté Caramel** : vérifier que la rendition renvoie **HTTP 200 avant l'envoi** (la piste
audio-seule `-0.mp4` peut 404) ; préférer la plus basse rendition **vidéo** ; le **mp4 est accepté
direct** par Albert (pas de ffmpeg requis pour PeerTube).

### 14.2 Contrat
**Entrée** (POST JSON) :
```json
{ "mediaUrl": "https://podeduc.apps.education.fr/media/videos/<hash>/<id>/360p.mp4", "language": "fr" }
```
**Sortie normalisée** (utilisée partout dans Caramel) :
```json
{
  "source": "albert",
  "language": "fr",
  "duration": 372.5,
  "text": "transcription complète…",
  "segments": [ { "start": 0.0, "end": 1.5, "text": "…" } ],
  "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\n…\n"
}
```
*(le node Code émet déjà `language/duration/text/segments/vtt` ; ajouter `source:"albert"` est trivial — ou Caramel le pose à la réception.)*

### 14.3 Durcissement (à valider/ajouter — non bloquant pour démarrer)
- **Limite 20 Mo Albert** (HTTP 413) → préférer la rendition la plus basse / l'audio seul. Pour les
  longues vidéos : nœud **Execute Command ffmpeg** entre « Télécharger » et « Albert »
  (`ffmpeg -i in -ar 16000 -ac 1 -f wav out.wav`), **chunker** (`-segment_time 480`) et **recoller**
  les timestamps avec un offset cumulé. **Pré-requis** : vérifier que ffmpeg est dispo sur l'hôte n8n.
- **Format** : doc Albert = mp3/wav (AIFF passe en pratique, mp4/m4a non garanti) → ffmpeg sécurise.
- **Polling async** (vidéos longues) : si besoin, dédoubler en `…/submit` + `…/result` comme `llm.js`.
  Pour v1, l'appel synchrone (timeout 180 s) suffit aux vidéos courtes/moyennes.

## 15. Filet de sécurité — collage manuel nettoyé (NOUVEAU)

Quand la transcription n'est pas récupérée (badge 🟠) **ou** sur action volontaire de l'utilisateur,
révéler un `<textarea>` « Collez ici la transcription ». Caramel la **nettoie et la met en forme
automatiquement** avant de l'injecter dans le pipeline.

**Détection de format (client-side, nouveau parser `parsePastedTranscript(raw)`) :**
1. **WebVTT** (`WEBVTT` + `HH:MM:SS.mmm --> …`) → parse → `segments[]`. `source:"manual-vtt"`.
2. **SRT** (`1\n00:00:00,000 --> …`) → parse → `segments[]`. `source:"manual-srt"`.
3. **Transcript YouTube/Pod copié** (lignes `0:23` ou `[00:01:23]` suivies de texte) → parse → `segments[]`.
4. **Texte brut sans timestamps** → **nettoyage** (collapse espaces, recoller les césures `-\n`,
   normaliser la ponctuation/casse, retirer les étiquettes locuteur optionnelles) puis :
   - soit **passe LLM légère** de mise en forme (prompt court « nettoie et ponctue, ne réécris pas le fond »),
   - soit segmentation **proportionnelle** sur la durée connue (si `duration` dispo via detect) →
     `segments[]` approximatifs ; sinon `untimed:true` → les questions seront **réparties uniformément**.

**Sortie** : le **même objet normalisé** que §14.2 (`source` ∈ `manual-vtt|manual-srt|manual-text`).
Le reste du pipeline est inchangé. À placer dans `js/services/video-transcript.js` (parser + nettoyage)
+ éventuel petit prompt `assets/data/prompts/transcript_clean.md` pour la passe LLM de mise en forme.

## 16. Fichiers à créer / modifier — delta post-audit

S'ajoute/précise le tableau §7 :

| # | Fichier | Action (delta) |
|---|---|---|
| 15 | **n8n** | ✅ Fourni : `Caramel - transcription video interactive (DEV).json` à importer + activer. |
| 16 | `js/services/video-transcript.js` | `detectVideo()` (PeerTube client-side + PodEduc via n8n), `fetchTranscript()` (cascade §13), `parsePastedTranscript()` + nettoyage (§15). Endpoint Albert = webhook `caramel-video-transcript`. |
| 17 | `js/services/config` (URLs webhooks) | Ajouter `CARAMEL_VIDEO_TRANSCRIPT_URL` (pattern d'injection CI comme `CARAMELIA_AUDIO_URL`). |
| 18 | `index.html` / `js/ui/ui.js` | Badge 4 états (🟢🟡🟠🔴) + `<textarea>` collage manuel révélé en état 🟠. |
| 19 | `assets/data/prompts/transcript_clean.md` | (optionnel) prompt de nettoyage/mise en forme du collage manuel brut. |

## 17. Prompt de démarrage (nouvelle conversation)

> Copier-coller tel quel pour lancer l'implémentation dans une fenêtre fraîche.

```
Implémentons la VIDÉO INTERACTIVE H5P dans Caramel. La faisabilité est validée (transcription OK).
Lis d'abord, dans cet ordre :
1. docs/PRD_VIDEO_INTERACTIVE.md  (en particulier la partie "MISE À JOUR 2026-06-13", §12 à §17)
2. docs/AUDIT_TRANSCRIPTION_VIDEO_2026-06.md  (preuves empiriques par plateforme)
3. La mémoire project_video_interactive_transcription
4. Le workflow n8n prêt : "Caramel - transcription video interactive (DEV).json" (racine)

Faits clés à respecter :
- PeerTube apps.education : captions fr auto-générées récupérables CÔTÉ NAVIGATEUR (CORS *), API
  publique /api/v1/videos/{id}/captions. Sinon → voie Albert.
- PodEduc : 0 caption publique → toujours voie audio→Albert (n8n télécharge le mp4/m4a, pas de CORS).
- Albert : webhook n8n dédié caramel-video-transcript, response_format=verbose_json → segments[{start,end,text}].
- Filet de sécurité : collage manuel de transcription, nettoyé/mis en forme auto (parser VTT/SRT/texte).
- YouTube : HORS périmètre v1 (bonus best-effort plus tard, fragile).
- Objet transcription normalisé partout : { source, language, duration, text, segments[], vtt }.

Conventions : suivre CLAUDE.md (code+commits FR, ES6 pur sans build, json-healer obligatoire,
field-constraints source de vérité). INVOQUER le skill caramel-add-h5p-activity pour l'intégration.

Commence par le LOT 1 (tuyau bout-en-bout, sans IA fine) :
- definitions.js : entrée InteractiveVideo (requiresVideoUrl:true) + customOrder
- index.html + ui.js : champ URL vidéo + badge d'état (4 états) dans la sidebar
- js/services/video-transcript.js : detectVideo() PeerTube client-side + fetchTranscript() chemin captions
- js/h5p/processors/InteractiveVideo.js : processor minimal (vidéo référencée par URL + 1 QCM en dur)
- processors/index.js (3 maps), field-constraints.js
→ Objectif Lot 1 : un .h5p qui s'ouvre et JOUE la vidéo PeerTube avec 1 interaction.
Puis on enchaînera Lot 2 (génération LLM), Lot 3 (Albert+PodEduc), Lot 4 (éditeur+export), Lot 5 (i18n+release).
Propose un plan (EnterPlanMode) avant d'écrire le code.
```
```
