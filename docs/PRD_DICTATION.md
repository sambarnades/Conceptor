# PRD — Activité H5P **Dictation** (dictée) + synthèse vocale (TTS)

> **Statut :** ✅ **socle serveur + webhooks n8n LIVRÉS et testés en prod (2026-07-10)** — cf. §11.
> ✅ **Partie cliente Caramel LIVRÉE (2026-07-10)** — phases 2→8 du §10, cf. §12 (choix d'implémentation).
> ✅ **Portage Sucrerie LIVRÉ (2026-07-10)** — dépôt/éditeur/panneau TTS/export, cf. §12.7.
> **Date :** 2026-07-08 (maj 2026-07-10) · **Cible :** Caramel v6.2.0+ · **Lib :** `H5P.Dictation 1.3`
> **Auteur de l'analyse :** exploration codebase + skill `caramel-add-h5p-activity`.
> **Décision structurante (§3) : TRANCHÉE** → Stratégie A, moteurs Piper (sherpa-onnx) + OpenJTalk (japonais).

---

## 0. Résumé exécutif (TL;DR)

- **La coquille d'intégration H5P est déjà à ~80 % outillée.** La lib `H5P.Dictation` est **vendored** (1.0/1.1/1.3, toutes deps présentes), le **pipeline d'embarquement audio dans le `.h5p` existe déjà** (`content/audios/…`), le **registre média** accepte un `Blob` audio directement, et **l'éditeur visuel sait déjà rendre des champs audio**.
- **Le seul vrai verrou, et il est structurant : produire le *fichier* audio à partir du texte.** La synthèse vocale « du navigateur » (`window.speechSynthesis`) **joue** le son mais **ne peut PAS être capturée en fichier** de façon automatique et cross-navigateur. Or `H5P.Dictation` **exige un fichier audio** par phrase.
- **Recommandation :** **TTS côté serveur, auto-hébergée sur votre infra Scaleway/Rust**, en **miroir exact** de votre chaîne de transcription existante (`services/video-transcript.js` : proxy + Albert/Whisper + n8n + submit/poll). C'est la même architecture **en sens inverse** (texte → audio au lieu de audio → texte), elle produit un **`.h5p` standard portable** (Éléa/Moodle/Lumi/offline), avec voix naturelles M/F dans les 11 langues et **zéro poids client**.
- Les **réglages demandés** (régénérer / voix M-F / langue) forment un **panneau custom** dans l'éditeur, à câbler dans le **seul fichier éditeur non partagé avec Sucrerie** (`js/editor/index.js`) pour ne pas casser la byte-identité.

---

## 1. Ce qu'est l'activité

`H5P.Dictation` : l'élève **écoute** une phrase audio et **tape** ce qu'il entend ; H5P compare à la solution et surligne fautes/typos. C'est exactement le visuel de l'icône fournie (bulle « tête qui parle » + haut-parleur + coches vert/rouge/orange).

**Structure sémantique** (`js/vendor/h5p-libs/H5P.Dictation-1.3/semantics.json`) :

```
media          (group)   : image/vidéo d'intro optionnelle
taskDescription (text)   : consigne (HTML)
sentences      (list)    : ← LE CŒUR
  └─ sentence  (group)
       description        (text)   : libellé optionnel de la phrase
       sample             (audio)  : ← AUDIO PRINCIPAL (obligatoire pour jouer)
       sampleAlternative  (audio)  : ← AUDIO « lecture lente » (optionnel)
       text               (text)   : la solution à taper (accepte « | » = alternatives)
overallFeedback (group)  : barème de feedback global
behaviour      (group)   : tries, shuffleSentences, ignorePunctuation, typoFactor…
l10n / a11y    (group)   : libellés UI (Check/Retry/Show solution/Play/Play slowly…)
```

**Dépendances de la lib (toutes vendored ✅) :** `H5P.Question 1.5`, `H5P.JoubelUI 1.3`, **`H5P.Audio 1.5`**, `H5P.TextUtilities 1.3`.

**Ce que le LLM produira :** uniquement `taskDescription` + `sentences[].text` (+ éventuellement `description`). Les `sample`/`sampleAlternative` sont **injectés après synthèse** (ils ne viennent pas du LLM).

---

## 2. Ce qui existe déjà (inventaire des briques réutilisables)

| Brique | Fichier / preuve | État |
|---|---|---|
| **Lib H5P.Dictation** | `js/vendor/h5p-libs/H5P.Dictation-1.3/` (+1.0, 1.1) | ✅ vendored |
| **Deps de la lib** | Question 1.5 · JoubelUI 1.3 · Audio 1.5 · TextUtilities 1.3 | ✅ toutes vendored |
| **Embarquement audio `.h5p`** | `js/h5p/h5p-creator.js:368-426` : écrit tout blob sous `content/audios/`, scanne les chemins `"audios/…"`, ajoute auto `H5P.Audio 1.5` | ✅ complet |
| **Registre média** | `js/h5p/image-manager.js:509-573` : `processAudioFile(blob)` (accepte File\|Blob, mime `audio/mpeg`, 25 Mo max) → `registerMedia(id, entry)` → `getAllMedia()` au packaging | ✅ un blob TTS s'y branche **tel quel** |
| **Récupération au packaging** | `js/h5p/h5p-creator.js:184` : `const mediaFiles = hasMedia() ? getAllMedia() : null;` | ✅ |
| **Éditeur — champ audio** | `js/editor/field-renderers.js:1084-1114` : `renderAudioField` (dropzone + lecteur + suppression, accepte mp3/ogg/wav/m4a/webm) | ✅ `sample`/`sampleAlternative` s'affichent déjà en lecteurs |
| **Processor async possible** | `js/h5p/h5p-creator.js:146` : `await processH5PContent(...)` | ✅ un processor Dictation peut être `async` et faire la TTS en interne |
| **Précédents « média »** | Image interactive / InteractiveVideo (blob → registre → paths) | ✅ modèles directs |
| **Infra serveur + pattern réseau** | `js/services/video-transcript.js` (proxy + Albert/Whisper + n8n) ; **submit/poll** `pollTranscriptionTask()` pour dépasser le mur ~60 s ; endpoints `CONFIG.videoTranscript*` | ✅ **modèle exact à recopier en sens inverse** |
| **Registre d'endpoints** | `js/core/endpoints.js` (URLs centralisées, réécrites en prod par `.gitlab-ci.yml` via `sed`) | ✅ pattern connu |

**Conclusion :** rien à construire côté embarquement/registre/packaging/éditeur. **Le travail neuf = (a) la génération audio, (b) la coquille d'enregistrement de l'activité (definitions/processor/prompt/i18n), (c) le panneau de réglages.**

---

## 3. LE point dur — produire l'audio (décision structurante)

### 3.1 Pourquoi « synthèse navigateur → fichier » ne marche pas tout seul

> `window.speechSynthesis` (Web Speech API) **joue** le son via les haut-parleurs mais **n'expose AUCUN moyen standard de le capturer** en `Blob`/`ArrayBuffer` : pas de `MediaStream` source, pas de branchement Web Audio. La seule capture possible (`getDisplayMedia({audio:true})` + `MediaRecorder`) exige un **geste utilisateur + partage d'onglet à chaque fois**, est **Chrome-only**, et **incompatible** avec « ça se fait automatiquement une fois l'appli générée ». → **Non retenu.**

Comme `H5P.Dictation` **exige un fichier audio** par phrase, il faut un moteur qui **rend un `Blob`**. Quatre stratégies réelles :

### 3.2 Les stratégies comparées

| # | Stratégie | Fichier embarqué ? | Qualité | Coût / poids | Portabilité Éléa/Moodle/offline | « Navigateur » ? |
|---|---|:--:|:--:|---|:--:|:--:|
| **A** | **TTS serveur auto-hébergée (Scaleway/Rust)** — miroir de la transcription | ✅ MP3 | 🎧 naturelle | votre infra (déjà là) | ✅ parfaite | ⚠️ serveur (clé côté serveur, comme LLM/OCR) |
| **B** | **WASM neural client** (Piper/Kokoro ONNX) | ✅ WAV | 🎧 naturelle | **20–160 Mo/voix** à lazy-load | ✅ parfaite | ✅ 100 % client |
| **C** | **WASM eSpeak** (meSpeak) | ✅ WAV | 🔉 robotique | ~2 Mo, **licence GPL** ⚠️ | ✅ parfaite | ✅ 100 % client |
| **D** | **Fork lib → `speechSynthesis` à la lecture** | ❌ aucun | 🎧 voix OS élève | .h5p minuscule | ❌ **cassé** hors device qui a la voix (serveur Éléa, offline) | ✅ littéralement |

### 3.3 Recommandation : **Stratégie A**, sur votre infra Scaleway/Rust

Vous avez **déjà** un serveur Rust sur Scaleway qui fait la **transcription** (audio → texte) des vidéos YouTube. La TTS, c'est **la même chose en sens inverse** (texte → audio). On réutilise **exactement** votre plomberie :

```
        TRANSCRIPTION (existe déjà)                 SYNTHÈSE (à ajouter, miroir)
        ───────────────────────────                 ────────────────────────────
   audio/vidéo ──► [Whisper/Albert] ──► texte    texte ──► [Piper/TTS] ──► audio MP3
        │  n8n submit/poll (hors mur 60 s)  ▲         │  n8n submit/poll OU appel direct  ▲
        └──────── services/video-transcript.js ┘      └──────────── services/tts.js (NOUVEAU)┘
```

**Pourquoi A plutôt que B/C/D :**
- **Aligné sur l'architecture Caramel** : « les clés API ne sont jamais en frontend, tout passe par le serveur » (LLM, OCR, vision, transcription). La TTS est le énième webhook du même registre.
- **Aligné sur votre infra existante** : rien de nouveau à provisionner, vous avez déjà Scaleway + Rust + le pattern submit/poll + la réécriture d'endpoints en CI.
- **`.h5p` standard et portable partout** (contrairement à D qui casse hors device).
- **Zéro poids client** (contrairement à B : 20–160 Mo/voix).
- **Pas de souci de licence** (contrairement à C : eSpeak GPL, à déclarer en mentions légales, redistribution problématique).
- **Voix M/F + 11 langues = simples paramètres** de la requête.

**Moteur serveur suggéré : [Piper](https://github.com/rhasspy/piper)** (rhasspy) — TTS neural léger, ONNX, **CPU-friendly** (~50–200 ms/phrase), **multilingue** (fr, en, es, de, it, nl, pt, el… ; voix M **et** F par langue), licence permissive. Se pilote très bien depuis un binaire Rust (ONNX Runtime ou subprocess). Alternatives : **Kokoro** (82M, Apache, très bonne qualité), **Coqui/XTTS** (plus lourd, GPU, clonage de voix).
> ⚠️ **Vérifier la disponibilité voix × langue** du moteur choisi : Piper couvre bien les langues latines + grec ; **arabe / chinois / japonais** ont une couverture plus variable (voix parfois mono-genre). Prévoir un **repli** (voix par défaut de la langue si le genre demandé manque) + signalement UI.

**Latence & mur des 60 s :** une dictée = N phrases **courtes**. Piper synthétise ~10–20 phrases en **quelques secondes** → **un seul POST synchrone** `{ sentences[], lang, voice }` renvoyant un tableau d'audios (base64) tient **sous le mur ~60 s**. Garder le **submit/poll** (`pollTranscriptionTask`-like) en **repli** pour les très grosses dictées, exactement comme la transcription.

### 3.4 Si « aucune dépendance serveur » devient une exigence

Basculer sur **B (WASM neural, Piper/Kokoro dans le navigateur)** : même qualité, `.h5p` standard, mais modèle lourd (20–160 Mo) lazy-loadé + caché (IndexedDB/Cache API), et à déclarer dans les mentions légales. **C** (eSpeak) seulement si la voix robotique est acceptable **et** la licence GPL compatible. **D** seulement si l'on accepte de **perdre la portabilité** (l'audio n'existe que dans le navigateur de l'élève, pas sur Éléa rendu serveur ni hors-ligne) — contraire au cœur de Caramel.

**Invariant, quelle que soit l'option :** **preview et fichier embarqué doivent utiliser le MÊME moteur** (sinon le prof entend une voix à l'écoute et une autre dans le `.h5p` final).

---

## 4. Architecture cible (Stratégie A)

### 4.1 Nouveau service `js/services/tts.js`

Calqué sur `video-transcript.js`. Responsabilités :
- Mapper la **langue Caramel → code moteur** (réutiliser le pattern `YT_LANG_MAP = { jp:'ja' }` ; ajouter `zh→zh-cn`, etc. — cf. `h5p-creator.js:439`).
- Choisir la **voix** selon `{ gender:'female'|'male', lang }` (table de voix par langue).
- Appeler l'endpoint TTS (POST synchrone, repli submit/poll).
- Recevoir les audios (base64 MP3), les convertir en `Blob`, les passer à `processAudioFile()` puis `registerMedia()`.
- Renvoyer une map `index → h5pPath` que le processor injecte dans `sentences[].sample`.

**Contrat d'appel proposé :**
```
POST  CONFIG.ttsUrl
body: { sentences: ["Phrase 1.", "Phrase 2."], lang: "fr", voice: "female", slow?: false }
resp: { audios: [ { mime:"audio/mpeg", data:"<base64>" }, … ] }   // même ordre que sentences
```
(Optionnel `sampleAlternative` : 2ᵉ passe `slow:true` → débit réduit, si on veut la piste « lecture lente ».)

### 4.2 Où se branche la génération audio dans le pipeline

Deux options d'implémentation (à trancher — cf. §9) :

- **(a) Dans le processor `Dictation.js`** (`async process()` déjà autorisé, cf. `h5p-creator.js:146`) : le plus simple, tout le flux « génération d'activité » synthétise et enregistre les médias avant packaging.
- **(b) Étape dédiée du flux de génération** (avant/après le processor), avec voile de progression « Génération audio en cours » (calqué sur le voile « Transcription en cours » de la vidéo interactive, avec bouton « Arrêter »).

> Recommandé : **(a)** pour le premier jet (moins de câblage), avec un **voile de progression** réutilisant l'UI existante de la transcription.

### 4.3 content.json produit (par le processor)

```json
{
  "taskDescription": "<p>Écoutez puis écrivez chaque phrase.</p>",
  "sentences": [
    {
      "sample": [{ "path": "audios/audio-ab12cd34.mp3", "mime": "audio/mpeg", "copyright": { "license": "U" } }],
      "text": "La girafe broute les feuilles des acacias."
    }
  ],
  "behaviour": { "tries": 2, "ignorePunctuation": true, "typoFactor": "100" },
  "l10n": { "checkAnswer": "Vérifier", "showSolution": "Voir la solution", "tryAgain": "Recommencer", "audioNotSupported": "…" },
  "a11y": { "play": "Écouter", "playSlowly": "Écouter lentement", "enterText": "Écrivez ce que vous entendez.", "…": "…" }
}
```
- `l10n`/`a11y` : **remplir avec les chaînes traduites de la langue courante** (robustesse preview + Éléa) → **surface de traduction** (cf. §5, phase 9).
- Le processor **enregistre** chaque blob (`registerMedia`) avec un `h5pPath` `audios/audio-xxxxxxxx.mp3`, et **référence ce même path** dans `sample`. `h5p-creator` fait le reste automatiquement.

### 4.4 Endpoints & CI (miroir de la transcription)

- `js/core/endpoints.js` : ajouter `const CARAMEL_TTS_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-tts-bas";` (+ `…-submit`/`…-result` si submit/poll), et l'exposer dans `ENDPOINTS`. **Une seule ligne par const** (contrainte des regex `sed`).
- `js/caramelia/config.js` : ajouter `ttsUrl: CARAMEL_TTS_URL` (+ submit/result) dans `CONFIG`.
- `.gitlab-ci.yml` : ajouter la **variable CI** `CARAMEL_TTS_URL` (garde « obligatoire » + `sed` de réécriture + `echo`), **exactement** comme `CARAMEL_VIDEO_TRANSCRIPT_URL` (lignes 65-92). *(C'est le fichier que vous aviez ouvert.)*
- Côté **n8n + Scaleway/Rust** : nouveau workflow `caramel-tts-bas` qui relaie vers le service TTS Rust et renvoie les audios base64.

---

## 5. Checklist d'intégration (mappée sur le skill `caramel-add-h5p-activity`)

| Phase | Fichier | Détail | État |
|---|---|---|:--:|
| **0. Image** | `assets/images/activities/dictation.webp` | Convertir `dictation.png` (racine) → `.webp` ~256×256, ranger, supprimer le png | ✅ |
| **1. Enregistrement** | `js/core/definitions.js` | Entrée `h5pModules.Dictation` (`machineName:"H5P.Dictation"`, `englishName:"Dictation"`, `promptId:"dictationResultat"`, `jsonInputId:"dictationJsonInput"`, `createBtnId:"createDictationH5P"`, `image`, `categories:["text","h5p"]`, `platforms`, `formats`) + insertion dans `customOrder`. Défauts FR dans `js/core/translation.js`. | ✅ |
| **2. Processor** | `js/h5p/processors/Dictation.js` **[NOUVEAU]** | `async process()` : texte→`sentences`, **synthèse (service tts) + registerMedia**, injection des `sample.path`, remplissage `behaviour`/`l10n`/`a11y`. `machineName`, `version:'1.3.x'`, deps. | ✅ |
| **3. Routeur** | `js/h5p/processors/index.js` | `Dictation: DictationProcessor` (double map) | ✅ |
| **4. Healer** | `js/h5p/json-healer.js` | Souvent rien (structure simple). Vérifier qu'il ne « répare » pas les accents/ponctuation du `text`. | ✅ |
| **5. Field-constraints** | `js/h5p/field-constraints.js` | `sentences[].text` = `unicode` (accents, **pas** de HTML/LaTeX) ; `taskDescription`/`description` = `html`. Cf. skill `caramel-edit-field-constraints`. | ✅ |
| **6. Prompt** | `assets/data/prompts/Dictation.md` **[NOUVEAU]** | Génère `{taskDescription, sentences:[{text}]}` ; consignes : phrases courtes, niveau `{{niveau}}`, langue de sortie = langue UI, nombre `{{nombreQuestions}}`. | ✅ |
| **7. Exemple** | `assets/data/examples/Dictation.json` **[NOUVEAU]** | Échantillon valide traversant le processor (sans audio → l'exemple sert de fallback/édition). | ✅ |
| **8. Lib vendor** | `H5P.Dictation-1.3` | — | ✅ déjà là |
| **9. i18n ×11** | `js/locales/*.json` | Clés `h5p_dictation_name/description`, `prompt_dictation_*`, libellés `l10n`/`a11y` de la dictée, libellés du **panneau réglages** (régénérer/voix/langue), `emergency_h5p_dictation_*`. **+ surfaces de découverte** : entrée dans `tuto_step2_h5p_content` (×11), `js/caramelia/tuto-rag/*.md` (×11), chunks RAG `rag/caramelia/chunks/<lang>/h5p-dictation.md` (×11, ingestion par le mainteneur). | ✅ (ingestion ILaaS restante) |
| **10. Éditeur + réglages** | `js/editor/index.js` (**non partagé**) | Champs audio déjà rendus. **Ajouter le panneau réglages TTS** (bouton régénérer, toggle voix M/F, select langue = 11 langues du site) → appelle `services/tts.js` et met à jour les `sample`. | ✅ |
| **11. Service TTS** | `js/services/tts.js` **[NOUVEAU]** + `endpoints.js` + `config.js` + `.gitlab-ci.yml` + workflow n8n | Cf. §4. | ✅ |
| **12. Portage Sucrerie** | (après) | whitelist `CARAMEL_H5P`, vendoring lib, i18n éditeur, câblage du panneau réglages côté Sucrerie, accès endpoint TTS. Skill `caramel-port-to-sucrerie`. | ✅ |

---

## 6. Les réglages demandés (régénérer / voix M-F / langue)

C'est un **panneau custom**, nouveau. Comportement souhaité :
- **Bouton « Régénérer l'audio »** — resynthétise toutes les phrases (utile après édition du `text`). Idéalement, **détecter les phrases modifiées** pour ne régénérer que celles-là (diff texte).
- **Voix féminine / masculine** — toggle → param `voice` du service TTS.
- **Langue** — menu déroulant = **les 11 langues du site** (défaut = langue courante de l'UI), mappée vers le code moteur.

**Où le loger — piège Sucrerie :** les **12 fichiers de `js/editor/` sont byte-identiques** avec Sucrerie et doivent rester **host-agnostiques** (test `robustesse` sha256). Un bouton « régénérer » qui appelle `services/tts.js` (Caramel-only) **ne doit pas** vivre dans ces fichiers partagés. **Solution propre :** câbler le panneau dans **`js/editor/index.js`** — le **seul** fichier éditeur **non partagé** (divergent par dépôt, cf. `CLAUDE.md` item 7). Sucrerie recevra son propre câblage au portage (phase 12).

**Mapping langue → moteur :** réutiliser le pattern `YT_LANG_MAP`. Points d'attention : `jp→ja`, `zh→zh-cn`, et **couverture voix M/F variable** selon la langue (repli + message si genre indisponible).

---

## 7. Risques & pièges spécifiques

1. **Disponibilité voix × langue** (moteur TTS) — toutes les langues n'ont pas les 2 genres. Prévoir repli + signalement UI.
2. **Sucrerie n'a PAS de processor** — si l'audio est généré à l'auteur puis embarqué, l'éditeur Sucrerie doit **au minimum préserver** l'audio existant, idéalement pouvoir **resynthétiser** (donc accès au même endpoint TTS). À anticiper dès le design (phase 12).
3. **Fichiers éditeur partagés byte-identiques** — ne mettre AUCUN appel TTS Caramel-only dans `js/editor/*` (sauf `index.js`). Cf. §6.
4. **Nombre de phrases & mur ~60 s** — pour de grosses dictées, prévoir batch ou submit/poll (pattern déjà en place côté transcription).
5. **Poids du `.h5p`** — MP3 courts ≈ quelques dizaines de Ko/phrase (OK). WAV (options B/C) plus lourds ; borne 25 Mo du registre média (`image-manager.js`).
6. **`sampleAlternative` (lecture lente)** — décider : la générer (2ᵉ passe `slow`) ou l'omettre au v1.
7. **Healer & accents/ponctuation** — vérifier que `json-healer.js` ne modifie pas le `text` (la ponctuation/casse compte pour la correction de dictée). Cf. field-constraints `unicode`.
8. **l10n/a11y** — remplir les libellés dans la langue de l'activité (surface de traduction phase 9), sinon UI en anglais en preview.
9. **Nouvelle lib vendor ? Non** — mais **toute lib TTS client (options B/C)** devrait être inscrite en **mentions légales** (`assets/templates/mentions-legales.html` + `legal_library_*` ×11). Non applicable à la Stratégie A (serveur).

---

## 8. Fichiers touchés (récap Stratégie A)

```
NOUVEAUX
  assets/images/activities/dictation.webp
  js/h5p/processors/Dictation.js
  assets/data/prompts/Dictation.md
  assets/data/examples/Dictation.json
  js/services/tts.js
  rag/caramelia/chunks/{11 langues}/h5p-dictation.md      (+ source FR + INDEX/STATUT)
  assets/templates/editor-help/Dictation.html             (optionnel, popover « ? »)

MODIFIÉS
  js/core/definitions.js            (entrée h5pModules + customOrder)
  js/core/translation.js            (défauts FR)
  js/h5p/processors/index.js        (double map)
  js/h5p/field-constraints.js       (render types des champs)
  js/h5p/json-healer.js             (si nécessaire — à vérifier)
  js/editor/index.js                (panneau réglages TTS — fichier NON partagé)
  js/core/endpoints.js              (CARAMEL_TTS_URL)
  js/caramelia/config.js            (CONFIG.ttsUrl)
  .gitlab-ci.yml                    (variable CI + garde + sed + echo)
  js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json  (clés activité + tuto_step2_h5p_content)
  js/caramelia/tuto-rag/{11}.md     (surface de découverte)

INFRA (hors dépôt front)
  n8n : workflow caramel-tts-bas (+ submit/result si async)
  Scaleway/Rust : endpoint TTS (Piper/Kokoro) texte → MP3
```

---

## 9. Décisions ouvertes (état au 2026-07-10)

1. ✅ **Moteur TTS** → **Stratégie A** (serveur Scaleway/Rust). *(cf. §3, §11)*
2. ✅ **Moteur serveur** : **Piper (VITS int8) via sherpa-onnx** pour 10 langues + **OpenJTalk
   (jpreprocess/jbonsai, Rust pur) pour le japonais** — Piper n'a aucune voix ja. Détail des
   voix, licences et replis : ADR 0006 de transcription-youtube + §11.4.
3. ✅ **Génération audio** : option **(a) dans le processor** (`js/h5p/processors/Dictation.js`,
   `process()` async) — l'animation de génération existante couvre l'attente. *(cf. §4.2, §12.2)*
4. ✅ **`sampleAlternative`** (lecture lente) : ACTIVÉE par défaut côté client (`tts.slow !== false`),
   désactivable dans le panneau réglages ; échec de la piste lente non bloquant (best-effort).
5. ✅ **Régénération** : seulement les phrases MODIFIÉES — cache par phrase + chemins audio
   DÉTERMINISTES `audios/dictation-<hash(lang|voice|slow|texte)>.mp3` (cf. §12.1).
6. ✅ **Format audio** : **MP3** mono VBR (~60-80 kb/s), quelques dizaines de Ko/phrase.
7. ✅ **Voix par défaut : féminine** ; repli automatique sur l'autre genre quand la langue n'a
   qu'une voix, **signalé** par `genderFallback: true` (l'UI doit l'afficher).

---

## 10. Ordre d'implémentation suggéré (phasage)

1. ✅ **Socle serveur** : endpoint TTS Rust + workflows n8n — **livré et testé en prod, cf. §11**.
2. **Service client** `js/services/tts.js` (appel + base64→Blob→registerMedia) + mapping langues/voix.
3. **Coquille activité** : image webp, `definitions.js`, `translation.js`, processor `Dictation.js` (sync d'abord, audio branché ensuite), `index.js` du routeur, field-constraints, prompt, exemple.
4. **Génération audio automatique** dans le processor + voile de progression.
5. **Panneau réglages** (régénérer/voix/langue) dans `js/editor/index.js`.
6. **i18n ×11** + surfaces de découverte (tuto, tuto-rag, chunks RAG).
7. **Validation** : preview h5p-standalone, Lumi/Éléa réel, éditeur, `node scripts/verify-all-locales.mjs`.
8. **Portage Sucrerie** (skill `caramel-port-to-sucrerie`).

---

## 11. Câblage réalisé (2026-07-10) — référence d'intégration

Le socle serveur (phase 1) est **en production et testé de bout en bout**. Tout ce dont la
partie cliente a besoin est ci-dessous.

### 11.1 Infrastructure

| Élément | Valeur |
|---|---|
| Service Rust | dépôt forge `caramel/transcription-youtube`, release **1.2.0** (routes `/tts` + `/tts/voices` ajoutées au service de transcription, ADR 0006) |
| Container Scaleway | `https://caramelproxyf27407f4-transcription-youtube-staging.functions.fnc.fr-par.scw.cloud` (le « -staging » du nom est historique : c'est le container branché sur la prod n8n) |
| **Webhook synthèse** | `POST https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-tts-bas` |
| **Webhook catalogue** | `GET https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-tts-voices-bas` |
| Workflows n8n | actifs ; fichiers d'import versionnés dans `docs/n8n/` (ce dépôt) |
| Credential n8n | « Transcription-Youtube (Production) » — Header Auth `X-Service-Token` (le jeton ne vit que dans n8n et GitLab CI) |
| Déploiement serveur | MR → tag version auto → déplacer le tag `staging` sur la version (page Tags de la forge) |

### 11.2 Contrat effectif du webhook synthèse

```
POST /webhook/caramel-tts-bas
body : { sentences: ["Phrase 1.", …], lang: "fr", voice: "female"|"male", slow?: false }
200  : { supported:true, lang, voiceUsed, gender, genderFallback, slow,
         audios: [ { mime:"audio/mpeg", data:"<base64>", durationSeconds }, … ] }  // ordre = sentences
400  : no_sentences | too_many_sentences (>50) | sentence_too_long (>600 car.)
       | unsupported_lang (+ supportedLangs[])
500  : tts_failed | 503 : tts_disabled
```

- `lang` = **codes Caramel tels quels** (`fr en es de it nl pt ar zh jp el`) : aucun mapping
  `jp→ja` à faire côté client, le serveur s'en charge.
- `slow: true` = même contrat, débit ralenti → 2ᵉ appel pour `sampleAlternative`.
- Latences mesurées : ~15 s à froid (réveil du container), 1-10 s par requête à chaud.
  Une dictée ≤ ~15 phrases tient sous le mur des 60 s du routeur Scalingo.
- Catalogue : `GET /webhook/caramel-tts-voices-bas` →
  `{ langs: { fr: { female:{id,quality}, male:{…} }, ar: { female:null, … }, … } }`
  → griser les genres à `null` dans le panneau réglages.

### 11.3 Tests de prod validés (2026-07-10)

fr (jessica, 2 phrases), jp féminin (tohoku-f01) **et** masculin (nitech), repli de genre
ar (female demandée → kareem + `genderFallback:true`), lecture lente fr, catalogue — MP3
valides dans tous les cas.

### 11.4 Moteurs et modèles à créditer (→ mentions légales, phase 6/9)

Aucun LLM n'intervient dans la synthèse : ce sont des **modèles de voix neuronaux (VITS/HTS)
exécutés sur notre serveur**, sans API externe. À inscrire dans
`assets/templates/mentions-legales.html` (+ clés `legal_library_*` ×11) :

**Moteurs (côté serveur uniquement)** : Piper/rhasspy (modèles de voix, MIT) exécutés via
sherpa-onnx (k2-fsa, Apache-2.0) avec phonémisation espeak-ng (GPL-3.0) ; jpreprocess +
jbonsai (BSD-3-Clause, réécritures Rust d'OpenJTalk/HTS Engine) pour le japonais ;
encodage MP3 ffmpeg/LAME.

**Voix dont la licence exige une attribution (CC-BY…) :**

| Langue | Voix | Licence | Attribution suggérée |
|---|---|---|---|
| fr | upmc (jessica/pierre) | CC-BY-SA 4.0 | corpus UPMC Pierre/Jessica (MaryTTS) |
| es | sharvard (M/F) | CC-BY 3.0 | Sharvard Corpus, Univ. d'Édimbourg |
| jp (M) | nitech_jp_atr503_m001 | CC-BY 3.0 | HTS voice, Nagoya Institute of Technology |
| jp (F) | tohoku-f01 | CC-BY 4.0 | Université du Tôhoku (icn-lab) |

**Voix libres sans obligation (CC0 / domaine public)** : en ljspeech + joe, de thorsten +
ramona (M-AILABS), it paola + riccardo (M-AILABS), nl nathalie + rdh, pt tugão,
el rapunzelina. **À préciser avant mention** : ar kareem, zh huayan (licences amont non
documentées — suivies dans l'ADR 0006).

### 11.5 Reste à faire (partie cliente, ce dépôt)

Phases 2 → 8 du §10 : `js/services/tts.js` (appeler les webhooks §11.1, base64→Blob→
`processAudioFile`/`registerMedia`), `endpoints.js`/`config.js`/`.gitlab-ci.yml`
(`CARAMEL_TTS_URL` = webhook synthèse, `CARAMEL_TTS_VOICES_URL` = webhook catalogue),
coquille d'activité, panneau réglages (utiliser `genderFallback` et le catalogue), i18n ×11,
mentions légales (§11.4), portage Sucrerie.

> ✅ **Tout le §11.5 est LIVRÉ le 2026-07-10** — détail au §12.

---

## 12. Livraison cliente (2026-07-10) — choix d'implémentation

### 12.1 Chemins audio déterministes + cache (clef de voûte)

- `js/services/tts.js` : chemin H5P d'une phrase = `audios/dictation-<hash FNV-1a de
  lang|voice|slow|texte>.mp3`. Une phrase inchangée garde son chemin →
  - à la **régénération après édition** (`regenerateH5PFile`), le MP3 d'origine du `.h5p` est
    **recopié tel quel** (recopie des assets encore référencés) — zéro appel réseau ;
  - le **cache session** (Map clé → Blob) écarte les phrases déjà synthétisées d'un lot ;
  - à l'**ouverture de l'éditeur**, le cache est **ré-hydraté** depuis les
    `audios/dictation-*.mp3` du `.h5p` (le hash du nom EST la clé) → réécoute sans réseau,
    diff naturel : seules les phrases modifiées repartent en synthèse.
- Bornes client alignées serveur : ≤ 50 phrases, ≤ 600 caractères/phrase.

### 12.2 Processor (`js/h5p/processors/Dictation.js`)

- `process()` **async** : synthèse (1 POST voix normale + 1 POST lecture lente si activée)
  UNIQUEMENT pour les phrases sans audio manuel ; `registerMedia()` sous les chemins
  déterministes ; `sentences[].sample`/`sampleAlternative` en tableaux H5P.
- Un audio **téléversé manuellement** (chemin non `dictation-<hash>`) n'est **jamais écrasé**.
- Réglages portés par le JSON original : `tts: { lang (déf. langue UI), voice (déf. female),
  slow (déf. true) }`. `behaviour` accepté PLAT (LLM) ou IMBRIQUÉ (éditeur) → toujours émis
  imbriqué (`scoring`/`textual`/`feedbackPresentation`, semantics 1.3).
- `l10n`/`a11y` remplis dans la langue courante (33 clés `h5p_dictation_a11y_*` ×11).
- `genderFallback: true` → notification info (`h5p_dictation_gender_fallback`).
- Échec TTS voix normale → erreur bloquante explicite ; échec piste lente → ignoré.

### 12.3 Panneau réglages (`js/editor/dictation-tts-panel.js` — PARTAGÉ, 13ᵉ fichier miroir)

- Host-agnostique : `synthesize`/`fetchVoices`/`getCachedAudio`/`audioPath` INJECTÉS par
  l'`index.js` divergent de chaque dépôt (Caramel : `js/services/tts.js` ; Sucrerie :
  `assets/js/services/tts.js`).
- Langue (11), voix F/M (genres à `null` au catalogue → grisés, bascule auto), lecture lente,
  bouton de génération unique ; lecteurs par phrase (normale + lente) ; bandeau repli de
  genre. CSS `.dt-*` (style.css / editor-view.css).
- **Changer langue/voix/lente NE DÉCLENCHE AUCUNE SYNTHÈSE** (retour d'usage 2026-08-20 :
  la synthèse dure jusqu'à ~1 min et partait sans que l'utilisateur ait rien validé). Le
  réglage s'applique aussitôt ; les phrases déjà synthétisées pour ce réglage se réécoutent
  immédiatement depuis le cache — **l'aller-retour Féminine → Masculine → Féminine ne coûte
  aucun appel réseau** — et ce qui reste à produire est annoncé par le bandeau `.dt-pending`
  (« {n} phrase(s) restent à générer… ») avec le décompte repris sur le bouton « Générer ({n}) ».
  Ce bouton est le SEUL déclencheur, avec le « Générer » de chaque phrase.
- Le décompte se recalcule à chaque re-décoration : **ajouter une phrase après coup la
  signale comme seule phrase à générer**, le cache des autres étant conservé.
- Pendant une synthèse, les réglages sont **verrouillés** et « Annuler » est proposé (abort
  du fetch en cours). Sans ce verrou, un clic de voix basculait le réglage et le persistait
  alors que `regenerateAll` repartait sur son garde `busy` : réglage et audio se
  désynchronisaient en silence. Le statut affiche le nombre de phrases et les secondes écoulées.
- Après synthèse — et dès qu'un changement de réglage est **déjà couvert par le cache** — le
  panneau **reporte les chemins** dans `sentences[].sample` (indispensable côté Sucrerie, sans
  processeur : la sortie de l'éditeur y est écrite telle quelle).
- Garde-fou : suite navigateur `dictation-tts` (`tests/test-dictation-tts-panel.js`), qui
  injecte un faux service comptant ses appels — seule façon d'affirmer « aucun appel réseau ».

### 12.4 Éditeur (fichiers partagés)

- `content-detector.js` : signature `sentences[].text`, schéma complet (phrases + audio
  manuel + feedback + behaviour), `normalizeDataForEditor` (sample tableau→objet, behaviour
  imbriqué→plat), `denormalizeDataForSave` (**forme finale JOUABLE** : sample en tableaux,
  behaviour re-imbriqué) → `Dictation` ajouté à `H5P_RESTRUCTURING_TYPES` côté Sucrerie.
- `document-formatter.js` : `formatDictation` (énoncé à lignes d'écriture + saut de page +
  correction ; variantes `mot|variante` imprimées « mot / variante »), clés
  `doc_fmt_dictation_*` ×11.

### 12.5 Prompt & healer

- Prompt via i18n (`prompt_dictation_{regles_specifiques,structure_json,exemple_rendu}` ×11),
  entrée `dictation` dans `ACTIVITY_CONFIG` (prompt-generator), référence
  `assets/data/prompts/dictation.md`, exemple `assets/data/examples/dictation_1.json`.
- Healer : `Dictation` dans `H5P_MODULE_KEYS` + branche tolérante (tableau nu / phrases en
  chaînes) ; `sentences[].text` en render `unicode` (field-constraints) — **accents, casse et
  ponctuation jamais altérés**.

### 12.6 Surfaces de découverte & légal

- Tuile (grille, après « Surligner les mots »), tutoriel `tuto_step2_h5p_content` ×11,
  tuto-rag Caramelia ×11, chunks RAG `h5p-dictation.md` ×11 + fiche source FR + INDEX/STATUT
  (compteur 26→27 bumpé dans 217 chunks — **ré-ingestion ILaaS à faire par le mainteneur**).
- Aide d'édition `assets/templates/editor-help/Dictation.html` + clés `eh_dictation_*` ×11.
- Mentions légales : `legal_library_tts_piper` (moteurs serveur) + `legal_library_tts_voices`
  (voix CC-BY, §11.4) ×11 + template.

### 12.7 Portage Sucrerie (livré)

- Dépôt : `CARAMEL_H5P['H5P.Dictation']`, `H5P_LIBRARY_TO_MODULE_KEY`, `CANONICAL_VERSIONS`
  (« 1.3 », deps déjà présentes), test `SUPPORTED_SAMPLE` (40/41 OK, 1 KO env. fetch Node).
- Lib `H5P.Dictation-1.3` + deps déjà vendorées côté Sucrerie.
- Éditeur : miroirs `content-detector.js`/`document-formatter.js`/`dictation-tts-panel.js`
  (manifeste sha256 régénéré : 33 fichiers OK), `field-constraints.js` +Dictation,
  `H5P_RESTRUCTURING_TYPES` +Dictation (test anti-dérive mis à jour), i18n ×11 (42 clés).
- TTS : `assets/js/services/tts.js` (mêmes webhooks n8n, mêmes chemins déterministes) ; les
  blobs synthétisés sont enregistrés au **registre média** → injectés sous `content/audios/`
  au save (`injectUploadedImages`) ; cache ré-hydraté depuis le `.h5p` déposé au montage.
- Endpoints : `ENDPOINTS.ttsSynthesize`/`ttsVoices` dans `assets/js/core/config.js`.
- Limite connue (mineure) : changer plusieurs fois de voix avant save peut laisser d'anciens
  `audios/dictation-*.mp3` orphelins dans le ZIP (l'élagage ne couvre que `images/`).

### 12.7-bis Itération v2 (retours de test utilisateur, 2026-07-10 soir)

1. **Animation pendant la synthèse** : `createH5PFromJson` émet `generation:processing`
   (Dictée) → l'UI AFFICHE l'overlay caramel s'il ne l'est pas (flux « collage d'un JSON
   d'IA externe + Générer ») ou le MAINTIENT (flux LLM), avec l'étape de recette figée sur
   `caramel_animation_step_audio` (« On enregistre les voix de la dictée… ») jusqu'au
   `generation:complete`/`error`.
2. **UX éditeur refondue — audio INTÉGRÉ aux phrases** : le panneau ne garde qu'une barre
   compacte (langue/voix/lente/« Tout régénérer », `flex: 0 0 auto` → le scroll de
   l'éditeur est préservé). Les contrôles vivent DANS chaque item « Phrase » (décoration
   idempotente du DOM, re-posée par MutationObserver après chaque re-rendu, resynchronisée
   à la frappe) : lecteurs normal+lent, **« Générer » CETTE phrase seule**, « Ma voix ».
3. **Dictaphone** (`js/editor/audio-recorder-widget.js`, 14ᵉ fichier partagé) :
   enregistrement micro (MediaRecorder) → forme d'onde canvas + rognage début/fin
   (2 curseurs, zones grisées) → pré-écoute → ré-encodage **WAV PCM 16 bits mono**
   (dépendance zéro, universel : H5P.Audio filtre par `canPlayType`, OGG/WebM/FLAC cassent
   sur Safari). Import de fichier : mp3/m4a/wav passent TELS QUELS ; autres formats décodés
   → même flux rognage → WAV ; échec de décodage → message conseillant MP3/WAV.
4. **« Ma voix »** : jamais écrasée par la synthèse (badge + retour à la voix de synthèse
   en un clic) ; ré-hydratée depuis le `.h5p` rouvert (`primeManualAudio`/`getManualAudio`
   dans les deux services tts) ; enregistrée au registre média → embarquée au save.
5. **Inférence `slow`** : `tts` absent (content.json rechargé) → déduit du fichier (des
   `sample` sans `sampleAlternative` = lecture lente désactivée) — évite une piste lente
   fantôme et un appel réseau au re-package (bug attrapé par la batterie Node 12/12).
6. **Healer** : l'enveloppement du tableau nu (`['phrase…']`) remonté AVANT le bloc « H5P
   commun » (sinon `overallFeedback`/`behaviour` posés sur le tableau puis perdus).
7. **Complétion Sucrerie** : `H5P.Dictation` ajouté à `END_SIGNAL_MAIN_LIBRARIES`
   (h5p-completion.js) — la dictée émet `answered` + `setScoredResult` au Vérifier → elle
   compte dans la réussite des collections (test anti-dérive mis à jour : 19 types).
8. **RAG ILaaS ingéré** : 228/228 documents (11 nouveaux + 217 compteur 26→27), 0 erreur.

### 12.8 Reste à faire (hors code)

1. **Variables CI GitLab** : créer `CARAMEL_TTS_URL` et `CARAMEL_TTS_VOICES_URL`
   (GitLab → Settings → CI/CD → Variables) — le build échoue tant qu'elles manquent (garde 13 URLs).
2. **Ingestion ILaaS** : 11 chunks `h5p-dictation` + ré-ingestion des 217 chunks au compteur
   26→27 (mainteneur, REPLACE = DELETE + INGEST).
3. **Validation navigateur réelle** : génération LLM → `.h5p` → preview h5p-standalone →
   Lumi/Éléa ; panneau réglages (diff, voix, repli genre ar) ; round-trip éditeur Sucrerie.
4. **Phase 0 faite** : `dictation.png` converti → `assets/images/activities/dictation.webp`
   (256×192), png supprimé.
