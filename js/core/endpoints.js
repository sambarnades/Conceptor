/**
 * Registre central des endpoints backend Caramel (webhooks n8n).
 * @module core/endpoints
 *
 * MÊME ESPRIT QUE `LIB_PATHS` dans lib-loader.js : un seul endroit pour voir et
 * changer toutes les URLs de webhook écrites en dur dans le frontend.
 *
 * ── Injection prod (CI/CD GitLab Pages) ──────────────────────────────────────
 * Les valeurs ci-dessous pointent sur l'instance **prod** ("…-prod"). Au build,
 * `.gitlab-ci.yml` les écrase **dans CE fichier uniquement** via `sed`, à partir
 * des variables CI/CD (les 10 sont obligatoires : le build échoue si l'une manque) :
 *   LLM_SUBMIT_URL                       → const LLM_SUBMIT_URL
 *   LLM_RESULT_URL                       → const LLM_RESULT_URL
 *   LLM_STATS_URL                        → const LLM_STATS_URL
 *   CARAMELIA_WEBHOOK_URL                → const CARAMELIA_WEBHOOK_URL
 *   CARAMELIA_AUDIO_URL                  → const CARAMELIA_AUDIO_URL
 *   CARAMEL_VIDEO_TRANSCRIPT_URL         → const CARAMEL_VIDEO_TRANSCRIPT_URL
 *   CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL  → const CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL
 *   CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL  → const CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL
 *   CARAMEL_FETCH_PAGE_URL               → const CARAMEL_FETCH_PAGE_URL
 *   PDF_CONVERT_URL                      → const PDF_CONVERT_URL
 *
 * CONTRAINTE : chaque `const … = "…"` ci-dessous DOIT rester sur une seule ligne
 * pour que les regex `sed` continuent de matcher. Ne pas réécrire en multi-ligne.
 *
 * ── Hors de ce registre ──────────────────────────────────────────────────────
 * Les endpoints du pont boutique vivent dans `js/sucrerie-bridge/config.js` et
 * N'Y SONT PAS rapatriés : ce dossier est miroir byte-identique vers aManDe et
 * ne peut pas importer un module Caramel-spécifique. Ils pointent déjà en prod
 * directe (pas de réécriture CI). Cf. ce fichier-là.
 */

// LLM — architecture polling Postgres (submit → poll result), cf. services/llm.js
const LLM_SUBMIT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/submit-prod";
const LLM_RESULT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/result-prod";
// LLM stats — 1 ligne Grist agrégée par génération PAR LOTS (cf. services/llm-batch.js).
const LLM_STATS_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/stats-prod";

// Caramelia — chat (RAG côté n8n), transcription audio (Whisper/Albert), vidéo.
const CARAMELIA_WEBHOOK_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramelia-prod";
const CARAMELIA_AUDIO_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-audio-prod";
const CARAMEL_VIDEO_TRANSCRIPT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-prod";
// Transcription vidéo ASYNCHRONE (submit/poll) — voies longues (YouTube audio, Albert fichier,
// lots HLS) qui dépassent le mur ~60 s du routeur, cf. services/video-transcript.js + docs/PLAN_TRANSCRIPTION_ASYNC.md
const CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-submit-prod";
const CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-video-transcript-result-prod";

// Import de page web — fetch côté serveur (contourne CORS) + extraction texte, cf. services/ocr.js
const CARAMEL_FETCH_PAGE_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-fetch-page-prod";

// Export PDF — conversion ODT→PDF via n8n + Gotenberg, cf. export/pdf-via-gotenberg.js
const PDF_CONVERT_URL = "https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel-pdf-convert-prod";

export const ENDPOINTS = Object.freeze({
    llmSubmit: LLM_SUBMIT_URL,
    llmResult: LLM_RESULT_URL,
    llmStats: LLM_STATS_URL,
    caramelia: CARAMELIA_WEBHOOK_URL,
    carameliaAudio: CARAMELIA_AUDIO_URL,
    videoTranscript: CARAMEL_VIDEO_TRANSCRIPT_URL,
    videoTranscriptSubmit: CARAMEL_VIDEO_TRANSCRIPT_SUBMIT_URL,
    videoTranscriptResult: CARAMEL_VIDEO_TRANSCRIPT_RESULT_URL,
    fetchPage: CARAMEL_FETCH_PAGE_URL,
    pdfConvert: PDF_CONVERT_URL,
});
