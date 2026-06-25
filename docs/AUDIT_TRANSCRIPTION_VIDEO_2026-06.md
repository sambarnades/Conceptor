# Audit de faisabilité — Récupération de transcription timée (Vidéo interactive)

> Statut : **validation empirique (Lot 0bis)** — 2026-06-13.
> Complète `PRD_VIDEO_INTERACTIVE.md` §4.3. Objectif : avant toute écriture de code, prouver
> qu'on sait récupérer une **transcription TIMÉE** (segments `{start, end, text}`) de façon
> quasi-systématique pour les 3 types de vidéos visés (PeerTube, PodEduc, YouTube), mesurer le
> temps, et confirmer qu'on récupère bien les marqueurs.
>
> Méthode : sondes réseau réelles (curl/yt-dlp/API) + vérification adversariale indépendante de
> chaque conclusion. Toutes les affirmations ci-dessous sont adossées à des sorties de commandes
> réelles (codes HTTP, extraits VTT, timings mesurés).

---

## 0. TL;DR — verdict par plateforme

| Plateforme | Sous-titres pré-existants (instantané) | Fallback audio→Albert | Marqueurs timés | Verdict transcription |
|---|---|---|---|---|
| **PeerTube** apps.education | 🟢 **OUI** — transcription auto Whisper activée (v8.1.8), VTT `fr` réel et timé via API REST publique | 🟢 OUI (mp4 progressif récupérable serveur) | ✅ segment | 🟢 **FONCTIONNE** (le meilleur cas) |
| **PodEduc** (Esup-Pod 3.8.4) | 🔴 **NON** — 0 sous-titre public sur 115+ sources testées (transcription non surfacée) | 🟢 OUI (mp4/m4a progressif récupérable serveur) | ⚙️ via Albert | 🟡 **dépend d'Albert** (voie audio obligatoire) |
| **YouTube** | 🟡 **OUI mais fragile** — auto-captions `fr` récupérables via client `android` de yt-dlp, **sans PO token** | 🔴 **NON** (audio verrouillé par GVS PO token / bot) | ✅ segment + mot | 🟡 **PARTIEL / fragile** (hors souveraineté) |
| **Albert** (DINUM, le moteur) | — | 🟢 **le pipeline n8n marche déjà** (test réel) | ✅ segment (`verbose_json`) | 🟢 **OK après 1 modif n8n** |

**Conclusion d'ensemble :** le projet est **faisable**, et le maillon que tu craignais le plus
(la transcription) est **bien moins risqué qu'anticipé** :

1. **PeerTube** te donne des sous-titres `fr` timés **gratuitement et instantanément** pour les vidéos
   récentes (transcription auto activée sur les instances apps.education). Pas besoin d'Albert dans ce cas.
2. **Albert fonctionne déjà** end-to-end via ton webhook n8n existant — il manque **une seule modif**
   (passer `response_format` de `json` à `verbose_json`) pour obtenir les segments timés. C'est LE déblocage.
3. **PodEduc** n'expose pas ses sous-titres → on passe systématiquement par Albert sur l'audio (qui est
   récupérable côté serveur). Fiable.
4. **YouTube** marche aujourd'hui pour les vidéos francophones, mais par une faille fragile (client
   `android`, URL signée expirant en ~7 h, dépendance à un yt-dlp maintenu, **IP datacenter non testée**).
   À traiter comme un bonus best-effort, pas comme un socle.

---

## 1. PeerTube apps.education — 🟢 FONCTIONNE

**La grande nouvelle, contre le pessimisme du PRD :** les instances apps.education tournent en
**PeerTube 8.1.8 avec la transcription automatique Whisper ACTIVÉE** (`/api/v1/config` →
`videoTranscription.enabled: true`, `remoteRunners.enabled: true`).

### Preuves
- `GET /api/v1/config` sur `tube-sciences-technologies.apps.education.fr` → `serverVersion: 8.1.8`,
  `videoTranscription.enabled: true`.
- Échantillon des **15 dernières vidéos** → **15/15 avaient un caption** (`captions.total ≥ 1`),
  le plus souvent `fr`, `automaticallyGenerated: true`.
- VTT réel récupéré (`automaticallyGenerated: true`) :
  ```
  WEBVTT
  02:31.570 --> 02:34.450
  Je suis non seulement voyeur, mais aussi le maître du monde
  ```
- API publique **sans auth** : `GET /api/v1/videos/{id}` + `GET /api/v1/videos/{id}/captions` →
  `data[].fileUrl` pointe directement le `.vtt` téléchargeable.

### Nuances / limites
- Une **vidéo ancienne** (test PRD `2m4vGrwriQ2H3b84ZbL9Rx`, fédérée tube-cycle-3) avait **0 caption** :
  la transcription auto s'applique surtout aux **nouveaux uploads**, pas forcément au rétro-catalogue.
  → Quand `captions.total == 0`, basculer sur le **fallback Albert** (audio dispo via l'API).
- **Fédération** : utiliser `isLocal` + `files[].fileUrl` / `streamingPlaylists[].files[].fileUrl`,
  **ne jamais reconstruire l'URL à la main** (la vidéo testée est servie par tube-cycle-3 alors que
  l'URL pointe tube-sciences-technologies).
- CORS `*` côté PeerTube → mais la récupération transcription se fait **côté serveur (n8n)** de toute façon.

### Recette
1. `GET /api/v1/videos/{shortUUID}/captions` → si `total > 0`, télécharger `data[0].fileUrl` (VTT timé). **Instantané.**
2. Sinon → récupérer une rendition mp4 (`files[].fileUrl`) et envoyer à Albert (voir §4).

> ⏳ *Note : l'agent investigateur PeerTube du workflow était encore en cours au moment de figer ce
> rapport ; les chiffres ci-dessus proviennent des sondages directs du run principal. Le taux exact
> de couverture sur un échantillon ancien/large sera complété par la vérification.*

---

## 2. PodEduc (Esup-Pod 3.8.4) — 🟡 voie audio obligatoire (dépend d'Albert)

**Confiance : haute** (investigateur + vérificateur adversarial concordants).

### Sous-titres pré-existants : 🔴 inexploitables (~0 %)
- **0 sous-titre réel** sur **115+ sources** testées (15 pages vidéo + 100 items RSS, puis un 2ᵉ
  échantillon distinct par le vérificateur). Aucune balise `<track kind="subtitles">` peuplée.
- **Piège confirmé** : le seul `.vtt` présent est `overview.vtt` = **storyboard** (coords de sprite
  `overview.png#xywh=0,0,165,90`), **pas du texte** — à exclure absolument.
- L'API REST `/rest/` exige un token → **HTTP 401** (`"Informations d'authentification non fournies."`).
- Les routes de transcription (`/video/transcript/<id>/`, `/video/completion/<id>/`) → **302 vers login**
  (réservées au propriétaire authentifié). La fonction existe mais n'est **pas publique**.

### Fallback audio : 🟢 fonctionne (côté serveur)
- Chaque vidéo expose un **mp4 progressif autonome** linké dans le HTML :
  `/media/videos/<hash64>/<id>/{360p,720p}.mp4` ; les dépôts audio exposent `/media/.../audio_192k.m4a`.
- Extraction par **regex sur le HTML** : `/media/videos/[a-f0-9]{64}/[0-9]+/(720p|360p)\.mp4`.
  Le **flux RSS** `/rss-video/` est une source d'URLs média **plus robuste** que le HTML (enclosures
  joignables même quand la page est en accès restreint).
- Tous les médias : **HTTP 200**, `Accept-Ranges: bytes`, **206 sur Range**. Tailles réelles mesurées :
  360p ≈ 14,6 Mo, 720p ≈ 34 Mo, audio m4a de 1,5 à 22 Mo.
- ⚠️ **Aucun en-tête CORS** sur les médias (`OPTIONS` → 405) → fetch navigateur bloqué,
  **passage par n8n obligatoire** (ce qui est de toute façon le cas).

### Marqueurs timés
- **Aucun** via PodEduc → ils viennent **100 % d'Albert** sur l'audio (voir §4).

### Recette
1. `GET https://podeduc.apps.education.fr/video/<slug>/` (200, sans auth) — ou le RSS pour l'URL média.
2. Regex → URL mp4/m4a, préfixer par le host.
3. n8n télécharge le média → transcode si besoin (cf. §4 format) → POST Albert `verbose_json`.

---

## 3. YouTube — 🟡 PARTIEL / fragile (bonus best-effort)

**Confiance : haute** sur le diagnostic (investigateur + vérificateur). Verdict : **faisable
aujourd'hui pour les vidéos francophones, mais structurellement fragile.**

### Sous-titres : 🟡 récupérables sans PO token, via le client `android`
- Les clients par **défaut** (`tv`/`web_safari`/`mweb`) sont **murés** : `"a PO token was not provided.
  Subtitles missing: ...fr..."` + `"YouTube is forcing SABR streaming"`.
- **Contournement qui marche** : `--extractor-args "youtube:player_client=android"` (ou `ios`) →
  yt-dlp liste **et** télécharge les auto-captions, **sans PO token**.
  - Recette : `python3 -m yt_dlp --skip-download --write-auto-subs --sub-langs fr --sub-format json3 --extractor-args "youtube:player_client=android" URL`
  - Format `json3` : `events[].tStartMs + dDurationMs + segs[].utf8` → segments propres.
    Le VTT donne même le **timing par mot** (`<00:00:03.719><c> avec</c>`).
  - Mesuré : **6/6 vidéos FR** avaient une auto-caption `fr` récupérable, **0 challenge bot**.
  - Timing : **~2-3 s** par vidéo (liste 2,1 s ; download json3 complet 2,2-2,7 s).

### Les fragilités (prouvées par le vérificateur — à ne pas sous-estimer)
- **URL signée expire en ~7 heures** (mesuré : `expire − now ≈ 6,9 h`), **pas “quelques jours”** →
  impossible de mettre en cache l'URL, il faut **re-invoquer yt-dlp à chaque session**.
- **Dépendance dure à yt-dlp** : l'API innertube android nue (curl pur) → **HTTP 400 “Precondition
  check failed”**. On ne peut PAS générer l'URL signée sans un **binaire yt-dlp Python maintenu en
  continu** (jeu du chat et de la souris avec Google).
- **`fr` traduit (tlang) → HTTP 429 systématique** (page “Sorry” Google). Ne marche que pour les vidéos
  ayant un `fr-orig` natif (= vidéos francophones). Une vidéo anglaise → sous-titre `fr` **bloqué**.
- **IP datacenter Scalingo NON testée** (les tests sont depuis une IP résidentielle FR, 0 challenge) →
  **risque élevé** de `"Sign in to confirm you're not a bot"` côté serveur.
- Clients `android`/`ios` **en voie de dépréciation** upstream + extension progressive du PO token.

### Voie audio (pour Albert) : 🔴 morte côté serveur
- `-f bestaudio` échoue sur **tous** les clients : android/ios → `"GVS PO Token... HTTP 403"` ;
  tv → `"Sign in to confirm you're not a bot"` ; web → SABR. **Pas d'audio sans provider PO-token.**
- Donc pour YouTube, **seule la voie sous-titres existe** (pas de repli Albert). Acceptable puisque
  les vidéos FR ont quasi toujours un `fr-orig`.
- **Invidious/Piped** publics : inexploitables (listent parfois la caption mais le download renvoie
  `size=0`, ou 403/401/502).

### Verdict YouTube
Traiter comme un **bonus** activable, **hors socle souverain** : ça marchera pour beaucoup de vidéos FR,
mais prévoir un **mode dégradé clair** quand ça casse (et ça cassera). Pour de la robustesse, il faudra
tôt ou tard un **provider PO-token** (bgutils-pot, Node headless) + tester depuis l'IP de prod.

---

## 4. Albert (DINUM) — 🟢 LE DÉBLOCAGE : le pipeline marche déjà, il manque 1 modif

**Confiance : haute.** Le vérificateur a fait un **test bout-en-bout RÉEL** via ton webhook n8n
`caramel-audio-dev2` (qui détient la vraie clé). C'est le résultat le plus important de l'audit.

### Ce qui est prouvé en conditions réelles
- **Le webhook transcrit déjà parfaitement** : POST `speech.wav` (FR, ~6 s) → **HTTP 200 en 0,44 s**,
  réponse `{"text":" Bonjour, ceci est un test de transcription pour caramel. La vidéo interactive
  commence maintenant.","model":"openai/whisper-large-v3","usage":{…}}`.
- **Timing excellent** : 6 s d'audio → 0,44 s ; 24 s → 0,65 s ≈ **37× temps réel** (backend WhisperX
  GPU, `batch_size=32`).
- **Cause racine du “pas de timestamps” confirmée** : le node n8n a `response_format=json` **codé en
  dur** et **ne forwarde pas** le `response_format` du client. Même en envoyant `verbose_json` depuis
  le client, la réponse est **byte-identique** (`{text, model, usage}`, **aucun segment**).
- **Nom de modèle** : `openai/whisper-large-v3` est **CORRECT** (présent dans toutes les réponses
  réelles). *(L'hypothèse “audio-large” de l'investigateur a été réfutée.)*
- **Format d'entrée plus souple que la doc** : la doc openapi dit `mp3`/`wav` uniquement, mais un
  fichier **AIFF** brut a été transcrit sans souci → le backend décode large. Le `webm/opus` du micro
  reste à confirmer (probable transcodage ffmpeg nécessaire pour les conteneurs exotiques).

### Le format timé (confirmé par le code backend `etalab-ia/whisperx-openai-api`)
- `response_format=verbose_json` → `{text, task:"transcribe", language, duration,
  segments:[{id, text, start, end, speaker:null}]}`. Le code `audio.py` peuple `segments`
  `if is_diarize or is_verbose`. **Granularité = segment** (start/end en secondes) — **suffisant pour
  placer les questions H5P**.
- Alternatives : `vtt` / `srt` → sous-titre déjà formaté (utile pour la piste H5P) ; `diarized_json` →
  word-level + diarisation (plus lent, inutile ici).
- ⚠️ **Divergence doc/implémentation** : l'`openapi.json` déployé décrit `segments` comme *“only set
  when response_format=diarized_json”* et **ne mentionne pas** `verbose_json`. C'est le **code** qui
  tranche (verbose_json peuple bien segments). À connaître : ne pas se fier au seul contrat OpenAPI.

### Contraintes
- **Taille requête ≤ 20 Mo** (HTTP 413, `MAX_CONTENT_SIZE=20_000_000`) ; plafond n8n possiblement
  ~16 Mo → prendre la borne basse. Au-delà (vidéo longue) → **chunker** l'audio et **recoller** les
  timestamps avec un **offset cumulé** (`start += Σ durées des chunks précédents`).
  Repères : WAV 16 kHz mono ≈ 10 min/20 Mo ; MP3 64 k ≈ 33-40 min/16-20 Mo.
- Langues d'alignement préchargées : `['en','fr','nl','de']`.

### La modif n8n à faire (le seul vrai travail bloquant)
Node **“Albert Whisper”** (HTTP Request multipart) :
1. `response_format` : `json` → **`verbose_json`** (ou `vtt` si on veut le sous-titre direct).
2. Garder `model=openai/whisper-large-v3`, `language=fr`, `temperature=0`.
3. **Avant l'appel** : si le média n'est pas mp3/wav “standard”, transcoder en `wav 16 kHz mono`
   (`ffmpeg -i in -ar 16000 -ac 1 out.wav`) ; chunker si > ~16-20 Mo.
4. Recoller les segments (offset cumulé) et **renvoyer un format normalisé** :
   ```json
   { "language": "fr", "duration": 372.5,
     "text": "…",
     "segments": [ { "start": 0.0, "end": 1.5, "text": "…" } ],
     "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\n…\n" }
   ```
5. **Rétrocompat micro Caramelia** : garder `text` à la racine (`voice.js` lit `data.text ||
   data.transcript`) ; `segments`/`vtt`/`duration` sont **additifs**, ne cassent rien.

---

## 5. Ce qui reste à valider (avant Lot 2)

| # | Point | Bloquant ? | Statut |
|---|---|---|---|
| A | Tir réel `verbose_json` sur le webhook (prouver `segments[]` non vide) | 🔴 oui | ✅ **VALIDÉ EN PROD 2026-06-13** (cf. §7) |
| B | Transcodage `webm/opus` → `wav` (ffmpeg dispo n8n ?) | 🟠 moyen | 🟢 **non requis pour les mp4 PeerTube** (acceptés direct) ; à garder pour conteneurs exotiques/vidéos longues |
| C | Taux de couverture captions PeerTube sur catalogue **ancien** + plafond exact de fallback | 🟢 non | à compléter (échantillon large) |
| D | `crossorigin` en prod Éléa/Magistère (lecture PodEduc sans CORS) | 🟠 moyen | à vérifier sur l'instance |
| E | YouTube depuis IP **datacenter** (Scalingo) : challenge bot ? | 🟡 (YT only) | à tester depuis n8n (hors socle v1) |
| F | Granularité des segments Albert sur **vidéo longue** (placement fin des questions) | 🟢 non | à vérifier ; repli `diarized_json` (word-level) si trop grossier |

## 7. ✅ Validation en prod du socle (2026-06-13)

Le workflow n8n dédié **`caramel-video-transcript`** (endpoint
`https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript`) a été déployé et **testé
de bout en bout en réel** (POST `{mediaUrl, language}`). Résultats :

- **Le point A est levé** : `response_format=verbose_json` renvoie bien des **segments timés**.
  - Test parole réelle (PeerTube « Introduction - Les femmes scientifiques », 30 s, fédérée
    tube-cycle-3, rendition 480p HLS 0,72 Mo) → **HTTP 200 en 0,56 s**, `language=fr`,
    `duration=28.9`, segment `[0.0 → 28.9]` avec transcription **française parfaite** + VTT reconstruit.
  - Le node Code normalise correctement (`segments[{start,end,text}]` + `vtt`).
- **mp4 accepté directement** par Albert (rendition HLS-fragmented) → **ffmpeg non nécessaire** dans le
  cas courant PeerTube. *(À garder pour le micro webm/opus de Caramelia et les vidéos > 20 Mo.)*
- **Timing** : 0,56 s (30 s) / 1,35 s (20 s) end-to-end, téléchargement média inclus. Très rapide.
- **Piège média confirmé** : il faut **vérifier la joignabilité (HTTP 200) de la rendition AVANT
  l'envoi**. La rendition « audio-seule » (`-0.mp4`, resolution.id=0) peut renvoyer **404** sur
  certains hôtes → préférer la plus basse rendition **vidéo** (resolution.id>0) qui répond 200, et
  utiliser `files[].fileUrl` de l'API (jamais reconstruire l'URL ; tenir compte de la fédération).
- **Limite 20 Mo** : à 480p, une vidéo de ~4 min frôle déjà 20 Mo → pour les vidéos longues, prévoir
  l'audio-seul si dispo, sinon ffmpeg + chunking (cf. §14.3 du PRD).
- **Granularité (à surveiller)** : 30 s de parole continue → **1 seul segment**. faster-whisper
  segmente aux pauses ; à valider sur une vidéo longue pour le placement fin des questions H5P.

---

## 6. Recommandation

**Go.** L'ordre de moindre risque / valeur maximale :

1. **Faire la modif n8n Albert** (`verbose_json` + format normalisé + transcodage/chunking) — c'est le
   socle universel qui débloque **PeerTube-sans-caption + PodEduc + (micro Caramelia bonus)**. Valider point A.
2. **PeerTube en priorité produit** : chemin sous-titres instantané (cas 🟢) + fallback Albert (cas sans caption).
   C'est le scénario “plug & play” le plus fiable et 100 % souverain.
3. **PodEduc** : chemin audio→Albert uniquement (regex média + n8n). Fiable, souverain.
4. **YouTube** : implémenter en **best-effort opt-in** (client `android`, mode dégradé explicite,
   re-fetch à chaque session car URL ~7 h). Annoncer la fragilité ; ne pas en faire un socle.

Le maillon que tu pensais le plus dur (la transcription) est en réalité **le plus solide** côté
plateformes souveraines : PeerTube te le sert gratis, et Albert — qui marche déjà — fait le reste avec
**une seule ligne à changer dans n8n**.
