# Plan d'action — Transcription vidéo asynchrone (jobId + polling)

> Fichier cible : `docs/PLAN_TRANSCRIPTION_ASYNC.md`
> Statut : prêt à implémenter. Références `file:line` frontend **vérifiées dans cette session** (`endpoints.js:11-22, 32-57`, `caramelia/config.js:8-25`, `video-transcript.js:23-50, 113-128`). Le détail interne des workflows n8n provient des cartes d'investigation A et B (lecture des JSON n8n locaux interdite par les outils MCP n8n ; à appliquer manuellement dans `n8n-workflows-prod/`). Toute valeur non vérifiable est marquée **À VÉRIFIER**.

---

## 1. TL;DR

La transcription d'une vidéo **YouTube sans sous-titres** déclenche un repli audio (yt-dlp + Whisper/Albert) qui dure 2 à 5 min côté serveur, alors que le routeur Scalingo coupe toute connexion HTTP client↔webhook à **~60 s** et renvoie un **504 HTML sans en-tête CORS** → le navigateur lève un `TypeError "Failed to fetch"` trompeur, indiscernable d'une panne réseau, et l'utilisateur est renvoyé vers le collage manuel. La solution : transformer la voie de transcription longue en **pattern submit/poll** strictement calqué sur le worker LLM déjà en production (Submit → INSERT pending en **PostgreSQL** → réponse `{taskId}` en ~100 ms → fire-and-forget vers un Worker détaché → client poll un `Result` court). Le Worker tourne **hors routeur HTTP**, donc plus de mur 60 s ; le client ne tient plus jamais une connexion longue. La détection rapide et les chemins < 55 s restent synchrones, inchangés.

---

## 2. Constat

Chaîne de blocage actuelle (vidéo YouTube sans sous-titres) :

```
detectYouTube → pas de _transcript, mais canAudio === true
   → fetchTranscript appelle transcribeYouTubeAudio
   → UN POST synchrone {youtubeUrl, language, audio:true}
     avec YT_AUDIO_TIMEOUT_MS = 290000 (video-transcript.js:44, vérifié)
   → côté serveur : proxy Scaleway /youtube (yt-dlp bestaudio) + Whisper/Albert ≈ 2-5 min
   → MAIS le routeur Scalingo coupe à ~60 s : 504 HTML SANS CORS
   → navigateur : TypeError "Failed to fetch" (opaque)
   → classifyError → catégorie NETWORK (à tort)
   → res.ok false ⇒ { error } ⇒ UI bascule en état 'manual' (lien « Coller la transcription »)
```

Faits clés (vérifiés / sourcés des cartes) :
- `ALBERT_TIMEOUT_MS = 180000` et `YT_AUDIO_TIMEOUT_MS = 290000` (`video-transcript.js:43-44`, **vérifié dans cette session**) **dépassent tous deux** le mur ~60 s. Ces deux voies ne peuvent structurellement pas tenir en synchrone.
- Le mur ~60 s est documenté côté infra (carte D ; `guide-generation-par-lots.md:8` cité). Sa valeur exacte côté routeur Scalingo client-facing reste **À VÉRIFIER** (l'ordre de grandeur ~59-60 s est attesté).
- Le mur est **routeur, pas frontend** : il ne borne que la connexion client↔webhook. Une exécution n8n déclenchée en arrière-plan n'est pas bornée par lui (le worker LLM tourne déjà jusqu'à ~200 s ainsi, carte A).
- Le 504 routeur **n'a pas de header CORS** (carte D) ⇒ le client ne peut pas distinguer « timeout serveur » de « réseau coupé ». Seul le découplage submit/poll lève l'ambiguïté (le `Result` répond toujours HTTP 200 + CORS).

---

## 3. Décision d'architecture

**Backend de stockage réel identifié (carte A)** : les jobs LLM sont persistés dans **PostgreSQL** (table `public.caramel_llm_tasks`, credential n8n `Postgres Caramel` id `fkbZYFwguR50RFxD`), PAS dans une Data Table n8n ni en static data. Confirmé par le commentaire `endpoints.js:31` (« architecture polling Postgres », **vérifié**) et par les requêtes SQL des 4 workflows LLM (carte A). C'est le socle réutilisable.

**Décision : table dédiée `caramel_transcript_tasks` + 4 workflows transcript dédiés (Submit/Worker/Result/Cleanup), calqués sur le LLM mais isolés.**

Justification, ancrée sur l'infra réelle :

1. **TTL antagonistes (argument décisif).** Le Cleanup LLM supprime les `done` **30 s après completion** (carte A, `4. Cleanup`). Pour une transcription longue où l'utilisateur attend (onglet en arrière-plan throttlé par le navigateur), 30 s fait perdre le résultat → `not_found`. La transcription exige un TTL `done` plus long (5 min). Mutualiser le Cleanup imposerait soit de dégrader le LLM, soit un Cleanup conditionné par `job_type` — fragile. Table + Cleanup dédiés = TTL libre, zéro risque LLM.
2. **Schéma divergent.** `caramel_llm_tasks` porte des colonnes LLM-spécifiques (`result_model`, `prompt_tokens`, `completion_tokens`, `fallback_level`, carte A). La transcription veut `segments` (jsonb), `vtt`, `source`, `duration`, `payload_hash`. Une table fourre-tout aurait des colonnes mortes des deux côtés.
3. **Isolation des pannes.** yt-dlp est « best-effort, hors socle souverain » et fragile (anti-bot 403/PO-token, cartes B et D). Une rafale de transcriptions qui sature Albert/Postgres ne doit pas dégrader la génération d'activités H5P (cœur produit). Tables et workflows séparés = blast radius cloisonné.
4. **Déploiement découplé.** Tuner le découpage HLS, relever un timeout proxy ou changer le modèle Whisper ne doit jamais re-déployer ni risquer le workflow LLM critique.

**Ce qui est réutilisé tel quel (par convention, pas par couplage)** : le credential `Postgres Caramel` (id `fkbZYFwguR50RFxD`), le pattern submit→fire-and-forget→worker→result, la stratégie CORS (`Access-Control-Allow-Origin: *` + `Cache-Control: no-store` sur Result), le gabarit de polling client de `generateRawWithLLM` (carte C, `llm.js:286-402`), et les nodes Code n8n « Normaliser (segments + vtt) », « Plan HLS », « Télécharger fMP4 (init+lot) » du workflow vidéo actuel (carte B, réutilisables tels quels).

**Améliorations adoptées vs LLM brut** : (a) **claim atomique** sur le passage `running` (le LLM ne le fait pas — son `UPDATE running` est inconditionnel, carte A risque #1 → risque de double-traitement, ici coûteux car facturé Albert) ; (b) **clé d'idempotence** `payload_hash` (recoller la même URL ne relance pas tout, carte D risque idempotence) ; (c) **boucle multi-lots HLS déplacée côté Worker** (1 seul `taskId` par vidéo au lieu de N requêtes client séquentielles, carte B risque vidéos longues).

### 3.1 Pourquoi PAS une Data Table n8n

Question légitime (la Data Table éviterait la dépendance Postgres et le SQL). Écartée pour des raisons propres à *ce* cas d'usage — des **jobs concurrents facturés** :

| Critère | PostgreSQL | Data Table n8n |
|---|---|---|
| **CLAIM atomique** (anti double-traitement) | `UPDATE … WHERE status='pending' RETURNING` : atomique au niveau ligne + sait si la course est gagnée | « update les lignes qui matchent » sans compare-and-set garanti entre exécutions concurrentes, ni `RETURNING` → courses possibles. *(À confirmer sur la version n8n déployée.)* |
| **Requêtes par plage temporelle** (idempotence `completed_at > NOW()-10min`, cleanup `< NOW()-5min`) | comparaisons `<`/`>` indexées | filtres surtout par **égalité** ; plages mal/non supportées et non indexées (lent à mesure que la table grossit) |
| **Résultat structuré/volumineux** (`segments` jsonb + `vtt` + `text`, dizaines de Ko) | `jsonb` natif | cellules **scalaires** → sérialiser en gros texte, risque de limite de taille |
| **Cohérence stack** | le worker LLM tourne **déjà** en Postgres (clone littéral, même credential) | **3ᵉ paradigme** de stockage (en plus de Postgres pour les jobs + Grist pour les stats) |

**Une Data Table serait pertinente** s'il n'y avait pas déjà de Postgres, ou pour de l'état **simple/faible concurrence** (flag, compteur, petite config) sans claim atomique ni requêtes temporelles. Aucun de ces critères ne s'applique ici.

> **À VÉRIFIER** : les garanties exactes de concurrence/filtrage des Data Tables sur la version n8n déployée. Même si elles s'avéraient meilleures qu'estimé, l'argument de **cohérence avec le worker LLM existant** (clone littéral) suffit à retenir Postgres.

---

## 4. Vue d'ensemble

```
                            (1) POST submit {youtubeUrl, language, audio:true}
   ┌──────────┐  ───────────────────────────────────────────────►  ┌─────────────────────┐
   │  CLIENT  │                                                     │  Transcript Submit  │
   │ (video-  │  ◄───────────────────  {taskId, status:'pending'} ──│  (n8n, ~100 ms)     │
   │ transcript│           (2)                                       └─────────┬───────────┘
   │  .js)    │                                                                │ INSERT pending
   │          │                                          ┌─────────────────────▼───────────┐
   │          │                                          │  PostgreSQL                      │
   │          │                                          │  caramel_transcript_tasks        │
   │          │                                          │  (credential Postgres Caramel)   │
   │          │                                          └─────────────────────▲───────────┘
   │          │     (3) fire-and-forget HTTP POST {taskId}, timeout 3s         │ CLAIM running
   │          │              (émis APRÈS la réponse au client)                 │ UPDATE done/error
   │          │                                          ┌─────────────────────┴───────────┐
   │          │                                          │  Transcript Worker (détaché,     │
   │          │                                          │  HORS routeur 60s)               │
   │          │                                          │   → proxy Scaleway /youtube      │
   │          │                                          │   → Albert /v1/audio/transcript. │
   │          │                                          │   → Normaliser (segments+vtt)    │
   │          │                                          └──────────────────────────────────┘
   │          │  (4) GET result?taskId=…  (poll toutes ~3 s, jamais > qq centaines de ms)
   │          │  ───────────────────────────────────────────────►  ┌─────────────────────┐
   │          │  ◄── {status:'processing'} | {status:'done', …} ────│  Transcript Result  │
   └──────────┘       | {status:'error'|'not_found'}                │  (toujours HTTP 200)│
                                                                    └─────────────────────┘

   Transcript Cleanup : scheduleTrigger chaque minute → DELETE done > 5 min / orphelines > 15 min
```

Principe anti-mur : **le client ne tient jamais une connexion > qq centaines de ms** (submit ~100 ms, chaque poll court). Le travail long vit dans le Worker, déclenché par un HTTP interne fire-and-forget, donc **hors du routeur HTTP client-facing**.

---

## 5. Contrat d'API

### 5.1 Submit — `POST /webhook/caramel-video-transcript-submit-{bas|prod}`

Requête (corps JSON ; mêmes payloads que l'actuel multi-mode, carte C) :
```json
{ "youtubeUrl": "https://www.youtube.com/watch?v=DG8Cyays6nE", "language": "fr", "audio": true }
```
Autres payloads acceptés (même endpoint, mode déduit par le Submit/Worker) :
```json
{ "mediaUrl": "https://…/360p.mp4", "language": "fr", "range": "0-17999999", "initRange": "0-743", "initUrl": "https://…" }
{ "hlsPlanUrl": "https://…/360p.m3u8", "language": "fr" }
```

Réponse (HTTP 200, ~100 ms) :
```json
{ "taskId": "8f3c…", "status": "pending" }
```
Réponse idempotente (cache hit, résultat frais < 10 min) — optionnelle :
```json
{ "taskId": "8f3c…", "status": "done",
  "source": "albert", "language": "fr", "duration": 612.4,
  "text": "…", "segments": [{ "start": 0, "end": 3.2, "text": "…" }], "vtt": "WEBVTT…" }
```

En-têtes : `Content-Type: application/json; charset=utf-8`, `Access-Control-Allow-Origin: *`.

### 5.2 Result — `GET /webhook/caramel-video-transcript-result-{bas|prod}?taskId=…`

**Toujours HTTP 200** (statut discriminant dans le corps), en-têtes : `Content-Type: application/json; charset=utf-8`, `Access-Control-Allow-Origin: *`, `Cache-Control: no-store`.

| Cas serveur | Corps |
|---|---|
| `pending` / `running` | `{ "status": "processing" }` |
| `done` | `{ "status": "done", "source", "language", "duration", "text", "segments":[{start,end,text}], "vtt" }` |
| `error` | `{ "status": "error", "message", "details"? }` |
| 0 ligne (TTL expiré) | `{ "status": "not_found", "message": "Tâche expirée." }` |

> Choix : le résultat transcript est renvoyé **directement structuré** (champs `source/language/duration/text/segments/vtt`), contrairement au LLM qui renvoie un `content` texte à parser (carte A `3. Result`). C'est l'objet transcript normalisé attendu côté client (`video-transcript.js:23-24`, **vérifié**) → mapping trivial.

### 5.3 Clé d'idempotence

`payload_hash = sha256(url||youtubeUrl||mediaUrl||hlsPlanUrl + '|' + language + '|' + (audio?'1':''))`, calculée dans le node « Préparer tâche » du Submit. Évite de re-télécharger/re-transcrire (et re-facturer Albert/Scaleway) une URL recollée (carte D, risque idempotence absente du flux synchrone).

> **À VÉRIFIER** : disponibilité d'une primitive de hash dans le sandbox task-runner n8n (cf. carte B : `new URL`/`URL` global indisponible dans certains Code nodes → ne pas présumer que `crypto` global l'est non plus). Repli possible : node Crypto natif n8n, ou hash applicatif maison sur la chaîne concaténée.

---

## 6. Modifications n8n

Répertoire : `n8n-workflows-prod/`. Quatre workflows neufs (clones du squelette LLM `1. Submit` / `2. Worker` / `3. Result` / `4. Cleanup`, carte A) + 1 table.

### 6.0 Migration SQL (à exécuter une fois sur PostgreSQL)

```sql
CREATE TABLE public.caramel_transcript_tasks (
    task_id         text PRIMARY KEY,             -- = $execution.id du Submit
    status          text NOT NULL CHECK (status IN ('pending','running','done','error')),
    payload_hash    text,
    mode            text,                          -- 'albert' | 'youtube_audio' | 'hls'
    payload         jsonb,                         -- URL + params (JAMAIS d'audio base64)
    caramel_version text,
    source          text,
    language        text,
    duration        numeric,
    result_text     text,
    segments        jsonb,                         -- [{start,end,text}]
    vtt             text,
    error_message   text,
    error_details   jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    started_at      timestamptz,
    completed_at    timestamptz
);
CREATE INDEX idx_transcript_hash ON public.caramel_transcript_tasks (payload_hash);
```

> Contrainte forte (cartes A, B, D) : **ne JAMAIS inliner d'audio base64** dans `payload` jsonb. Le payload ne contient que des URLs + params ; le binaire audio est téléchargé/transcrit côté Worker et jamais persisté.

### 6.1 Transcript Submit — `Caramel - transcription async - Submit (PROD).json`

Cloner `1. Submit` (LLM, carte A). Connexions : `Webhook → Préparer tâche → (SELECT cache) → INSERT → Répondre au client → Déclencher Worker`.

- **Webhook** : path `caramel-video-transcript-submit-prod`, `responseMode: responseNode`, `allowedOrigins: '*'`.
- **Préparer tâche** (Code) : `taskId = $execution.id` ; `payload_hash` (cf. §5.3) ; déduire `mode` (`youtubeUrl`+`audio` → `youtube_audio` ; `hlsPlanUrl` → `hls` ; `mediaUrl` → `albert`).
- **SELECT cache** (optionnel, Postgres) : `SELECT … FROM caramel_transcript_tasks WHERE payload_hash=$1 AND status='done' AND completed_at > NOW() - INTERVAL '10 minutes' LIMIT 1`. Si hit → brancher vers « Répondre au client » avec le résultat (`status:'done'`).
- **INSERT** (Postgres, `retryOnFail maxTries=3 waitBetweenTries=500`, comme LLM carte A) :
  ```sql
  INSERT INTO public.caramel_transcript_tasks
    (task_id, status, payload_hash, mode, payload, caramel_version, created_at)
  VALUES ($1, 'pending', $2, $3, $4::jsonb, $5, NOW());
  ```
- **Répondre au client** (Respond to Webhook) : `{ taskId, status:'pending' }`, headers CORS + `Content-Type`. **Part avant** le fire-and-forget (ordre vérifié côté LLM, carte A : Webhook → Préparer → INSERT → Répondre → Déclencher Worker).
- **Déclencher Worker** (HTTP Request) : `POST …/webhook/caramel-video-transcript-worker-prod`, body `{taskId}`, `timeout: 3000`, `onError: continueRegularOutput`, `alwaysOutputData: true` (paramètres identiques au fire-and-forget LLM, carte A).

### 6.2 Transcript Worker — `Caramel - transcription async - Worker (PROD).json`

Webhook `caramel-video-transcript-worker-prod`, **pas de responseNode** (réponse immédiate par défaut, comme le Worker LLM, carte A). Ossature : `Webhook → SELECT job → CLAIM running → switch(mode) → Normaliser → UPDATE done | UPDATE error`.

- **SELECT job** : `SELECT task_id, mode, payload FROM caramel_transcript_tasks WHERE task_id=$1 LIMIT 1`.
- **CLAIM running** (atomique — **correctif vs LLM**, carte A risque #1) :
  ```sql
  UPDATE public.caramel_transcript_tasks SET status='running', started_at=NOW()
  WHERE task_id=$1 AND status='pending' RETURNING task_id;
  ```
  0 ligne retournée → un autre Worker l'a déjà prise → **stop** (pas de double download/Albert).
- **switch(mode)** :
  - `youtube_audio` → node HTTP proxy Scaleway `/youtube?url=&lang=&audio=1`. URL exacte (carte B) : `https://caramelproxyf27407f4-caramel-proxy.functions.fnc.fr-par.scw.cloud/youtube` (staging : `…caramel-proxy-staging…`). Credential `FRLw0muatWyMRbcg` « Caramel proxy (X-Proxy-Token) » (en-tête `X-Proxy-Token`), `timeout 300000`, `retryOnFail maxTries=2 waitBetweenTries=3000` (valeurs du workflow vidéo actuel, carte B) → si pas de subs : Albert.
  - `albert` → node « Télécharger le média » (en-tête Range `bytes=`+payload.range, `timeout 120000` carte B) puis Albert ; sous-mode fMP4 → node Code « Télécharger fMP4 (init+lot) » **réutilisé** (concat init+lot via Buffer + `prepareBinaryData`, carte B).
  - `hls` → node Code « Plan HLS » **réutilisé** (parse master/variante, TS/fMP4, lots < 18 000 000 octets, offsets EXTINF, carte B) → **BOUCLE des lots côté Worker** (download lot → Albert) → recoller offsets EXTINF. (Déplacement clé : le client ne boucle plus.)
  - **Node Albert** : `POST https://albert.api.etalab.gouv.fr/v1/audio/transcriptions` (credential `DlY67XmwXahbSkS7` « Albert (Compte Caramel) », auth `predefinedCredentialType openAiApi`, multipart, `model` défaut `openai/whisper-large-v3`, `response_format=verbose_json`, `temperature=0`, `timeout 180000`, `retryOnFail maxTries=5 waitBetweenTries=5000` — **stratégie du workflow vidéo, PAS celle du passe-plat audio** qui n'a aucun retry, cartes B risque credential partagé).
- **Normaliser (segments + vtt)** : node Code **réutilisé tel quel** (produit `{language, duration, text, segments:[{start,end,text}], vtt, model, usage}`, carte B). C'est LE format attendu par le client.
- **UPDATE done** (`retryOnFail maxTries=3`, comme LLM) :
  ```sql
  UPDATE public.caramel_transcript_tasks
  SET status='done', source=$2, language=$3, duration=$4,
      result_text=$5, segments=$6::jsonb, vtt=$7, completed_at=NOW()
  WHERE task_id=$1;
  ```
- **UPDATE error** symétrique (`error_message`, `error_details`, `completed_at=NOW()`). `onError: continueErrorOutput` sur les nodes proxy/Albert pour router vers cette branche (pattern Caramelia, carte B). **CORS sur erreur : sans objet ici** — le Worker n'a pas de Respond exposé au client ; c'est le Result qui pose CORS et répond toujours 200, donc une erreur worker devient `{status:'error'}` proprement CORS-compatible.

> **Piège sandbox (carte B)** : le constructeur global `URL` n'est pas exposé dans le task-runner n8n → tout code réutilisé (Plan HLS, scraping) doit conserver ses `resolveUrl`/regex maison. Ne pas « moderniser » ces nodes avec `new URL()`.

### 6.3 Transcript Result — `Caramel - transcription async - Result (PROD).json`

Cloner `3. Result` (carte A). Webhook `caramel-video-transcript-result-prod` (GET), `responseNode`, `allowedOrigins: '*'`.
- **SELECT** : `task_id, status, source, language, duration, result_text, segments, vtt, error_message, error_details FROM caramel_transcript_tasks WHERE task_id=$1 LIMIT 1` (`alwaysOutputData true`, `retryOnFail maxTries=2`, comme LLM).
- **Mapping** : cf. §5.2 (0 ligne → `not_found` ; `pending|running` → `processing` ; `done` → résultat structuré ; `error` → message/details ; **toujours HTTP 200**, carte A).
- **Headers** : `Content-Type`, `Access-Control-Allow-Origin: *`, `Cache-Control: no-store`. **C'est le seul point de sortie CORS visible du client** → c'est lui qui supprime le piège du 504 opaque.

### 6.4 Transcript Cleanup — `Caramel - transcription async - Cleanup (PROD).json`

Cloner `4. Cleanup` (carte A). `scheduleTrigger` (chaque minute), **TTL allongés** :
```sql
DELETE FROM public.caramel_transcript_tasks
WHERE (completed_at IS NOT NULL AND completed_at < NOW() - INTERVAL '5 minutes')
   OR (completed_at IS NULL AND created_at < NOW() - INTERVAL '15 minutes')
RETURNING task_id, status;
```
- `done` → **5 min** (vs 30 s LLM, carte A) : protège l'onglet throttlé contre la perte du résultat.
- orphelines → **15 min** (vs 5 min LLM, carte A) : couvre une vidéo longue dont le Worker n'a pas fini d'écrire.

> Webhook multi-mode actuel `caramel-video-transcript-prod` : **conservé tel quel** pour la détection rapide (PodEduc, YouTube détection, plan HLS court synchrone). On n'y touche pas.

---

## 7. Modifications frontend

### 7.1 `js/core/endpoints.js`

État vérifié dans cette session (`endpoints.js:32-46` + `.gitlab-ci.yml:55-68`) : le fichier contient **8 const** réécrites par CI (`LLM_SUBMIT_URL`, `LLM_RESULT_URL`, `LLM_STATS_URL`, `CARAMELIA_WEBHOOK_URL`, `CARAMELIA_AUDIO_URL`, `CARAMEL_VIDEO_TRANSCRIPT_URL`, `CARAMEL_FETCH_PAGE_URL`, `PDF_CONVERT_URL`), plus l'objet `ENDPOINTS`. Le `.gitlab-ci.yml` vérifie et `sed` exactement ces 8, et son libellé « 8 URLs » est **cohérent** (pas de discordance préexistante, contrairement à une note d'investigation erronée).

Ajouter **2 const mono-ligne** (contrainte sed, `endpoints.js:21-22` vérifié) après la ligne 40, + 2 entrées `ENDPOINTS`, + 2 variables CI dans `.gitlab-ci.yml` :

```js
const CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-submit-bas";
const CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-result-bas";
```
```js
// dans ENDPOINTS :
videoTranscriptSubmit: CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL,
videoTranscriptResult: CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL,
```

Mettre à jour les libellés « 8 URLs » → **« 10 URLs »** aux **trois** endroits : le commentaire d'en-tête de `endpoints.js`, le message d'erreur du garde `.gitlab-ci.yml:56`, et ajouter les 2 nouvelles aux listes `[ -z … ]` (l.55), aux `sed` (l.61-68) et aux `echo` (l.69-76) du `.gitlab-ci.yml`. Décompte confirmé : 8 aujourd'hui → 10 après ajout.

### 7.2 `js/caramelia/config.js`

Vérifié (`config.js:13-25`) : `CONFIG.videoTranscriptUrl = ENDPOINTS.videoTranscript`. Ajouter à côté :
```js
const CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL = ENDPOINTS.videoTranscriptSubmit;
const CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL = ENDPOINTS.videoTranscriptResult;
// …
videoTranscriptSubmitUrl: CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL,
videoTranscriptResultUrl: CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL,
```
Et compléter le commentaire `config.js:8-12` (liste des variables CI) en conséquence.

### 7.3 `js/services/video-transcript.js`

**a) Constantes de poll dédiées** (près de `:41-50`, zone vérifiée) :
```js
const TRANSCRIPT_POLL_INITIAL_DELAY_MS = 2000;  // < 5000 LLM : Albert démarre vite
const TRANSCRIPT_POLL_INTERVAL_MS = 3000;
const TRANSCRIPT_POLL_TIMEOUT_MS = 600000;      // 10 min : couvre le pire multi-lots
const TRANSCRIPT_POLL_FETCH_TIMEOUT_MS = 15000; // timeout d'UN GET de poll
```

> Cohérence budget (carte D) : l'estimation max est ~285 s pour YouTube audio (`estimateTranscriptionSeconds`, vérifié `video-transcript.js:90`). 600 s couvre largement, y compris le multi-lots HLS où la boucle vit côté Worker.

**b) Nouveau helper `pollTranscriptionTask`** — calqué sur `generateRawWithLLM` (carte C, `llm.js:286-402`), réutilisant `fetchWithTimeout` (vérifié `video-transcript.js:113-128`, gère déjà timeout interne + propagation d'un `signal` externe) :
```js
async function pollTranscriptionTask(submitPayload, { onProgress = null, signal = null } = {}) {
  const submitUrl = CONFIG && CONFIG.videoTranscriptSubmitUrl;
  const resultUrl = CONFIG && CONFIG.videoTranscriptResultUrl;
  if (!submitUrl || !resultUrl) return { error: 'no_endpoint' };
  if (signal?.aborted) return { error: 'aborted' };

  // 1) Submit
  let taskId, immediate;
  try {
    const res = await fetchWithTimeout(submitUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload)
    }, TRANSCRIPT_POLL_FETCH_TIMEOUT_MS, signal);
    if (!res.ok) return { error: `submit_http_${res.status}` };
    const d = await res.json().catch(() => null);
    if (!d || !d.taskId) return { error: 'submit_bad_json' };
    taskId = d.taskId;
    if (d.status === 'done') immediate = d; // cache idempotent (§5.1)
  } catch (e) {
    if (signal?.aborted) return { error: 'aborted' };
    return { error: classifyError(e).category || 'network' };
  }
  if (immediate) return mapTranscriptResult(immediate);

  // 2) Poll
  if (onProgress) onProgress({ stage: 'transcribe', current: 0, total: 1 }); // jauge indéterminée
  const start = Date.now();
  await new Promise(r => setTimeout(r, TRANSCRIPT_POLL_INITIAL_DELAY_MS));
  while (true) {
    if (signal?.aborted) return { error: 'aborted' };
    if (Date.now() - start > TRANSCRIPT_POLL_TIMEOUT_MS) return { error: 'timeout' };
    const url = `${resultUrl}?taskId=${encodeURIComponent(taskId)}`;
    let res;
    try {
      res = await fetchWithTimeout(url, { method: 'GET' }, TRANSCRIPT_POLL_FETCH_TIMEOUT_MS, signal);
    } catch (e) {
      if (signal?.aborted) return { error: 'aborted' };
      // erreur réseau transitoire : attente + continue (retry silencieux, comme llm.js:347-352)
      await new Promise(r => setTimeout(r, TRANSCRIPT_POLL_INTERVAL_MS));
      continue;
    }
    if (!res.ok) return { error: `poll_http_${res.status}` };
    const d = await res.json().catch(() => null);
    if (!d) { await new Promise(r => setTimeout(r, TRANSCRIPT_POLL_INTERVAL_MS)); continue; }
    if (d.status === 'processing') { await new Promise(r => setTimeout(r, TRANSCRIPT_POLL_INTERVAL_MS)); continue; }
    if (d.status === 'done') {
      if (onProgress) onProgress({ stage: 'transcribe', current: 1, total: 1 });
      return mapTranscriptResult(d);
    }
    if (d.status === 'error') return { error: d.message || 'transcript_error' };
    if (d.status === 'not_found') return { error: 'expired' };
    return { error: `unexpected_${d.status}` };
  }
}
```
`mapTranscriptResult(d)` reproduit le mapping/normalisation déjà présent dans `transcribeYouTubeAudio` et `transcribeViaAlbert` → objet `{ source, language, duration, text, segments, vtt }` (format normalisé unique, vérifié `video-transcript.js:23-24`).

**c) Rerouter UNIQUEMENT les voies lentes** (les voies rapides restent en l'état) :
- `transcribeYouTubeAudio` : remplacer le `fetchWithTimeout` synchrone par
  `return pollTranscriptionTask({ youtubeUrl: parsed.url, language: youtubeUiLang(), audio: true }, { onProgress, signal });` (`youtubeUiLang()` vérifié `video-transcript.js:36-39`, mappe `jp→ja`).
- `transcribeViaAlbert` : remplacer le `fetchWithTimeout` par `pollTranscriptionTask(payload, { onProgress, signal })` (même `payload`).
- `transcribeViaHlsChunks` : faire UN seul `pollTranscriptionTask({ hlsPlanUrl, language }, …)` (boucle des lots côté Worker, §6.2) au lieu des N appels séquentiels (carte C risque #4 : éviter l'explosion de requêtes).

**Contrat de retour strictement préservé** : objet normalisé `{ source, language, duration, text, segments, vtt }` en succès, `{ error }` sinon, `{ error:'aborted' }` à l'annulation. C'est ce que `fetchTranscript` et `ui.js` attendent (carte C) ; ne pas dévier sous peine de casser le filet « Coller la transcription » et le bouton « Arrêter ».

> **À VÉRIFIER avant code** : les numéros de ligne précis des fetch synchrones à remplacer (`transcribeYouTubeAudio`, `transcribeViaAlbert`, `transcribeViaHlsChunks`) — la carte C les situe (~563, ~744-748, ~842) mais cette session n'a vérifié que `:23-50` et `:113-128`. Relire ces fonctions juste avant l'édition.

### 7.4 `js/ui/ui.js`

**Aucune modification** (carte C, infra UI réutilisable telle quelle). `wireVideoUrlSection` fournit déjà : `AbortController` passé en 4ᵉ arg de `fetchTranscript`, `runToken` anti-périmé, jauge `setProgress` (indéterminée quand `total<=1` → bande glissante, exactement ce que le poll émet), voile, bouton « Arrêter » → `ac.abort()`, `estimateTranscriptionSeconds` pour l'ETA, filet collage manuel (état `manual`). Le poll émet `onProgress({stage:'transcribe',current:0,total:1})` → bande glissante, et honore `signal?.aborted` → le bouton Arrêter coupe le poll en vol.

> **À VÉRIFIER** : les numéros de ligne `ui.js` cités dans la carte C (~760-1231) ne sont pas confirmés dans cette session. L'affirmation « aucune modif » repose sur le contrat (4 args, onProgress, signal, retour normalisé/`{error}`) ; si la signature réelle de `fetchTranscript`/`wireVideoUrlSection` diverge, ajuster.

### 7.5 Contrainte de partage Sucrerie

Ni `video-transcript.js`, ni `ui.js`, ni `endpoints.js`, ni `caramelia/config.js` ne figurent dans la liste des fichiers byte-identiques partagés avec Sucrerie (CLAUDE.md item 7 = `js/editor/*` sauf `index.js` + `js/ui/sync-video-player.js` + 3 CSS ; confirmé par grep carte C). **Aucune propagation requise.** Le helper ajouté n'introduit pas de dépendance Caramel-only problématique (pas d'import de `json-healer.js`).

---

## 8. Ce qui reste synchrone vs async

| Voie | Régime | Justification |
|---|---|---|
| Détection PodEduc `{url}` (scrape) | **synchrone** (webhook actuel inchangé) | `DETECT_TIMEOUT_MS=30000` < 60 s, pas d'Albert (vérifié `:42`) |
| Détection YouTube `{youtubeUrl}` (sous-titres) | **synchrone** | ~10-15 s ; `YT_DETECT_TIMEOUT_MS=60000` **à la limite exacte du mur** (vérifié `:50` ; carte D risque #8 : un scrape lent peut tomber pile sur le 504) |
| Sous-titres PeerTube (GET VTT) | **synchrone** | quasi instantané (carte C) |
| Plan HLS `{hlsPlanUrl}` (parse m3u8) | **synchrone côté détection**, mais la **boucle des lots** part en async | parse rapide ; lots = somme >> 60 s |
| **Albert vidéo entière** `{mediaUrl}` | **ASYNC** | `ALBERT_TIMEOUT_MS=180000` > mur 60 s (vérifié `:43`) |
| **YouTube audio → Whisper** `{youtubeUrl, audio:true}` | **ASYNC** | `YT_AUDIO_TIMEOUT_MS=290000` >> 60 s (vérifié `:44`) — **la voie qui motive la mission** |
| **Vidéo longue multi-lots** | **ASYNC** (1 taskId, boucle côté Worker) | somme >> 60 s |

Règle : **tout appel Albert/Whisper sur > quelques secondes de contenu passe en async ; toute la détection rapide reste synchrone.**

> Point de vigilance issu des cartes : `YT_DETECT_TIMEOUT_MS=60000` est exactement à la frontière du mur. Surveiller ; si des 504 de détection apparaissent, basculer aussi la détection YouTube en async (hors v1, le contrat client le permettrait sans nouvelle table).

---

## 9. Gestion des échecs & repli

- **yt-dlp datacenter 403 / anti-bot** : reste structurellement fragile (dépendance Scaleway hors socle souverain, cartes B et D — validé en prod via deno mais dépréciation clients android/ios + PO-token). Le Worker route l'échec proxy vers `UPDATE error` ; le client reçoit `{status:'error'}` → `{ error }` → UI bascule en **collage manuel propre** (`parsePastedTranscript`, état `manual`). Le filet collage doit rester **permanent**, jamais optionnel.
- **Timeout Worker / job jamais terminé** : le Cleanup purge les orphelines > 15 min ; le client, après `TRANSCRIPT_POLL_TIMEOUT_MS` (10 min), renvoie `{ error:'timeout' }` → collage manuel. Un poll arrivant après purge reçoit `not_found` → `{ error:'expired' }` → message clair, pas de boucle infinie.
- **Fire-and-forget raté** (carte A risque #2) : si le POST vers le Worker échoue (Worker down), la tâche reste `pending` jusqu'à purge orpheline (15 min). Le client poll dans le vide puis timeoute à 10 min → collage manuel. **Limite assumée en v1** : pas de cron qui ramasse les `pending` orphelins (cf. §12).
- **Suppression de l'erreur CORS trompeuse** : c'est le gain central. Le `Result` répond **toujours HTTP 200 + CORS**, donc plus de 504 HTML sans CORS sur le chemin long → plus de `Failed to fetch` opaque mal classé en NETWORK. Les seuls `Failed to fetch` résiduels (sur le submit court ou un poll) sont de vraies erreurs réseau, et le retry silencieux du poll les absorbe.
- **Double-traitement** : neutralisé par le CLAIM atomique (`WHERE status='pending'`, §6.2) — correctif explicite vs le LLM (carte A risque #1).
- **Re-soumission de la même URL** : neutralisée par `payload_hash` (cache 10 min, §5.3).

---

## 10. Plan de tests

### 10.1 curl — Submit / Result (manuel)
```bash
# 1) Submit (vidéo SANS sous-titres → repli audio)
curl -sS -X POST "$BASE/webhook/caramel-video-transcript-submit-bas" \
  -H 'Content-Type: application/json' \
  -d '{"youtubeUrl":"https://www.youtube.com/watch?v=DG8Cyays6nE","language":"fr","audio":true}'
# attendu < 1 s : {"taskId":"…","status":"pending"}

# 2) Result (poll)
curl -sS "$BASE/webhook/caramel-video-transcript-result-bas?taskId=<TASKID>"
# attendu : {"status":"processing"} pendant ~2-5 min, puis {"status":"done","segments":[…],"vtt":"WEBVTT…"}

# 3) Vérifier CORS + no-store sur Result
curl -sSI "$BASE/webhook/caramel-video-transcript-result-bas?taskId=<TASKID>" \
  | grep -iE 'access-control-allow-origin|cache-control'

# 4) taskId bidon → not_found (HTTP 200)
curl -sS "$BASE/webhook/caramel-video-transcript-result-bas?taskId=inexistant"
# attendu : {"status":"not_found",…}

# 5) Idempotence : re-submit la MÊME URL < 10 min → {"status":"done",…} direct
```

> **À VÉRIFIER** (carte D risque #2) : les tests curl directs du proxy Scaleway `/youtube` exigent le header `X-Proxy-Token` (credential `FRLw0muatWyMRbcg`). Via webhook n8n il est posé côté serveur ; pour un test direct du proxy, obtenir le token. Confirmer qui le fournit pour la CI/tests manuels.

### 10.2 Playwright UI
- **Vidéo SANS sous-titres = `https://www.youtube.com/watch?v=DG8Cyays6nE`** : coller l'URL → vérifier que le voile « Transcription en cours » + bande glissante s'affichent **au-delà de 60 s** sans `Failed to fetch`, puis que la transcription apparaît (assert segments non vides). Scénario de non-régression principal.
- **Bouton « Arrêter »** pendant le poll → `ac.abort()` → état revient propre, pas de résultat injecté tardivement (`runToken`).
- **Vidéo AVEC sous-titres** (chemin rapide inchangé) : assert que le résultat arrive en ~10-15 s et **ne passe pas** par submit/poll (espionner qu'aucun POST submit n'est émis).
- **URL re-collée** : 2ᵉ transcription quasi instantanée (cache idempotent).

### 10.3 Charge légère
- 10 submits parallèles → 10 `taskId` distincts, 10 `done` (Albert mesuré ≥15 rpm en rafale 15/15 sans 429, carte D → pas de file nécessaire).

---

## 11. Lotissement / étapes incrémentales

Ordre de moindre risque (le frontend ne casse jamais tant que les nouveaux endpoints n'existent pas, car les voies synchrones restent en place jusqu'à l'étape 4) :

- [ ] **Étape 0** — Créer la table `caramel_transcript_tasks` (§6.0) sur PostgreSQL. Vérifier l'INSERT/SELECT manuels.
- [ ] **Étape 1** — Workflow **Submit** + **Result** (sans Worker réel : INSERT pending, Result renvoie `processing`). Tester curl (submit → taskId, result → processing, not_found, CORS).
- [ ] **Étape 2** — Workflow **Worker** mode `youtube_audio` seul (proxy + Albert + Normaliser + UPDATE done/error + CLAIM). Tester end-to-end curl sur `DG8Cyays6nE`.
- [ ] **Étape 3** — Workflow **Cleanup** (TTL 5/15 min) + idempotence `payload_hash` dans Submit. Re-submit même URL → cache hit.
- [ ] **Étape 4** — Frontend : `endpoints.js` (2 const + ENDPOINTS + correction du décompte d'en-tête), `caramelia/config.js`, helper `pollTranscriptionTask`, reroutage de `transcribeYouTubeAudio` uniquement. Variables CI (`.gitlab-ci.yml`). Playwright vidéo sans sous-titres.
- [ ] **Étape 5** — Étendre le Worker aux modes `albert` (fichier/Range/fMP4) et `hls` (boucle lots côté Worker). Rerouter `transcribeViaAlbert` et `transcribeViaHlsChunks`.
- [ ] **Étape 6** — Non-régression complète (sous-titres rapides, PodEduc, PeerTube long, bouton Arrêter, collage manuel). Bump version + CHANGELOG (skill `caramel-release`).

---

## 12. Risques & questions ouvertes

1. **Timeout du proxy Scaleway Functions `/youtube`** : valeur par défaut historiquement basse (~15 s, relevable ~900 s, cartes B et D). **À VÉRIFIER/relever** : si la function coupe avant la fin, le Worker n8n a beau être patient, l'audio n'arrive jamais. **Bloquant** pour la voie qui motive la mission.
2. **Token proxy pour les tests** : le proxy YouTube exige `X-Proxy-Token` (credential `FRLw0muatWyMRbcg`). Confirmer qui fournit le token pour la CI/tests manuels.
3. **Voie audio YouTube réellement fonctionnelle ?** Validée en prod (deno pour les défis JS, 67 segments FR sur une vidéo test, carte D), mais **structurellement fragile** (dépréciation clients android/ios, extension PO-token, IP datacenter). L'async la masque, ne la répare pas → le collage manuel reste le filet permanent.
4. **Concurrence non bornée** : chaque submit lance un Worker, aucun backpressure (carte A risque #5). Acceptable (Albert ≥15 rpm mesuré, carte D) mais une rafale reste non régulée ; une file n8n pourra être ajoutée plus tard **sans changer le contrat client**.
5. **Onglet en arrière-plan throttlé** : même avec TTL `done` à 5 min, un navigateur qui gèle les timers d'un onglet caché peut rater la fenêtre (carte A risque #3). Mitigation possible (hors v1) : `done` TTL plus long ou ping de keep-alive.
6. **Variables CI** : oublier `CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL` ou `..._RESULT_URL` casse le build prod (sed obligatoire). **Décompte vérifié dans cette session (PAS de discordance préexistante)** : `endpoints.js:32-46` contient exactement **8 const injectées par CI** (`LLM_SUBMIT_URL`, `LLM_RESULT_URL`, `LLM_STATS_URL`, `CARAMELIA_WEBHOOK_URL`, `CARAMELIA_AUDIO_URL`, `CARAMEL_VIDEO_TRANSCRIPT_URL`, `CARAMEL_FETCH_PAGE_URL`, `PDF_CONVERT_URL`) ; `.gitlab-ci.yml:55-68` les vérifie et les `sed` toutes les 8, cohérent avec son libellé « 8 URLs ». Il faut donc passer ce décompte de **8 → 10** : ajouter les 2 nouvelles const dans `endpoints.js`, 2 entrées `ENDPOINTS`, 2 lignes au garde `[ -z … ]` + 2 `sed` + 2 `echo` dans `.gitlab-ci.yml`, et mettre le libellé « 8 » à « 10 ».
7. **CLAIM atomique non porté au LLM** : on l'ajoute côté transcript seulement. Le LLM garde son `UPDATE running` inconditionnel (carte A risque #1) — amélioration transverse souhaitable mais **hors périmètre** de ce plan.
8. **Disponibilité d'une primitive de hash dans le sandbox n8n** (cf. §5.3) : `URL` global est indisponible dans le task-runner (carte B) ; ne pas présumer `crypto`. **À VÉRIFIER** ; repli node Crypto natif ou hash maison.
9. **Limite Albert 20 Mo** (HTTP 413, carte D) : le mode `albert` fichier entier (`range '0-'`) peut récupérer > 20 Mo et faire échouer Albert si la vidéo n'est pas passée par le mode `hls` au préalable. Le Worker doit router une vidéo lourde vers le découpage HLS, pas vers le fichier entier.
10. **`pending` orphelins sans ramasse-miettes** : si le fire-and-forget rate, aucun cron ne reprend la tâche (carte A risque #2). Le client timeoute proprement, mais le travail n'est jamais fait. File/reprise = évolution future, hors v1.

---

## Journal de revue

La critique adversariale fournie était un **placeholder** (`verdict:"test"`, un seul problème `"test"/mineur`) : elle n'a donc apporté aucune correction de fond exploitable. Les amendements ci-dessous proviennent de la **confrontation du plan v1 aux cartes factuelles A/B/C/D et à la vérification directe des fichiers frontend** dans cette session :

1. **Décompte des variables CI — clarifié après lecture directe** : un agent avait cru voir « 9 const / en-tête à 8 » (fausse incohérence). Vérification faite (`endpoints.js:32-46` + `.gitlab-ci.yml:55-68`) : il y a bien **8 URLs CI, cohérentes des deux côtés**, aucune discordance préexistante. Le bon décompte est donc **8 → 10**.
2. **URLs/credentials exacts injectés** : ajout des valeurs précises issues des cartes (proxy Scaleway `caramelproxyf27407f4-…/youtube` + staging, credential proxy `FRLw0muatWyMRbcg`, credential Albert `DlY67XmwXahbSkS7`, endpoint Albert `…etalab.gouv.fr/v1/audio/transcriptions`, modèle `openai/whisper-large-v3`) là où le v1 restait allusif.
3. **Piège sandbox n8n** : ajout de l'avertissement « `URL` global indisponible dans le task-runner » (carte B) et extension à la primitive de hash de §5.3 (nouveau risque #8) — le v1 supposait `sha256` disponible sans réserve.
4. **Limite Albert 20 Mo → routage HLS obligatoire** : nouveau risque #9, absent du v1, tiré des cartes B/D (mode fichier entier peut dépasser 20 Mo / HTTP 413).
5. **`pending` orphelins** : explicitation du risque fire-and-forget raté (carte A risque #2) dans §9 et nouveau risque #10, le v1 ne couvrait que le timeout Worker.
6. **Honnêteté des références** : le bandeau d'en-tête a été ramené à ce qui a été **réellement vérifié dans cette session** (`endpoints.js`, `config.js`, `video-transcript.js:23-50,113-128`) ; les `file:line` provenant des cartes (notamment `ui.js`, et les lignes exactes des fetch synchrones dans `video-transcript.js`) sont désormais marqués « À VÉRIFIER avant édition » plutôt que présentés comme confirmés.
7. **Valeurs non vérifiables explicitées** : mur routeur exact, timeout proxy Scaleway, disponibilité crypto — marqués **À VÉRIFIER** conformément à la consigne (ne rien inventer). Le décompte CI, lui, a été vérifié en fin de session (8 → 10).

8. **Correction post-orchestration (lecture directe `.gitlab-ci.yml` + `endpoints.js`)** : suppression de la fausse « incohérence 8 vs 9 » dans §7.1, §12 et le présent journal — le décompte CI est cohérent (8 URLs), la cible est 8 → 10.
