# Prompt — Vidéo interactive (H5P.InteractiveVideo)

> **Document de référence (source de conception).** Le prompt réellement utilisé est assemblé à
> l'exécution depuis les clés i18n `prompt_interactive_video_*` des `js/locales/*.json`
> (via `js/services/prompt-generator.js`). Ce `.md` documente l'intention — il n'est PAS lu par le code.

## Principe

L'utilisateur colle une URL de vidéo (PeerTube apps.education). Caramel récupère la **transcription
timée** (`segments[{start,end,text}]`) puis l'injecte, formatée `[mm:ss] texte` (fenêtres ~45 s),
comme bloc **SOURCES** du prompt. Le LLM produit le **JSON intermédiaire** (interactions horodatées +
résumé), que le processeur `InteractiveVideo.js` traduit en `H5P.InteractiveVideo`.

La `videoSource` (URL mp4 résolue) et la piste de sous-titres ne sont **pas** demandées au LLM :
Caramel les injecte après génération.

## Logique de placement (cœur du prompt)

- Repérer les **ruptures d'idées** dans la transcription.
- Placer le `timestamp` (secondes) de chaque question sur l'horodatage qui marque le **début de l'idée
  suivante** (donc **juste avant** cette nouvelle idée) : à cet instant l'idée précédente vient d'être
  entièrement expliquée.
- **Sujet de la question = l'idée qui vient de se terminer** (passage *avant* le `timestamp`), jamais
  celle qui va commencer. La réponse doit **déjà** avoir été énoncée dans la vidéo (jamais une question
  dont la réponse n'arrive qu'après → l'élève ne pourrait pas y répondre). C'est le bug le plus fréquent.
- Auto-vérif par question : « la réponse a-t-elle déjà été dite *avant* ce timestamp ? ».
- **Priorité aux questions imposées par l'utilisateur** : si la consigne fournit des questions/thèmes
  précis, les respecter et les horodater plutôt que de générer ses propres questions.
- Ordre chronologique, pas de doublon temporel, répartition sur toute la durée.
- Nombre adaptatif : 4–8 par défaut (le prompt plafonne à ~1 question / 2-3 min, jamais plus de 10), ou `[NOMBRE_ELEMENTS]` si fourni (mode Avancé).

### Garde-fous déterministes (indépendants du modèle)

Le prompt « RECOPIE une valeur `[mm:ss]`, ne la calcule pas » réduit le problème mais ne le supprime pas : Mistral/Qwen interpolent encore des instants intermédiaires (GPT-OSS recopie les vrais). Donc, **après génération** (`ui.js`, helper `snapVideoTimestamps`, puis backstop dans `InteractiveVideo.js`), un module pur **`processors/interactive-video-snap.js`** applique, pour **les 3 modèles** :

1. **Snap** : chaque `timestamp` est calé sur l'ancre RÉELLE la plus proche (= les secondes des `[mm:ss]` réellement montrés au modèle, via `getTranscriptAnchors`). Garantit qu'aucune pause ne tombe au milieu d'une phrase. Timestamps strictement croissants et distincts (collisions décalées sur l'ancre libre suivante). Les interactions au-delà de la durée sont écartées (pas calées sur la fin).
2. **Plafond** : nombre de questions ramené à un sous-ensemble **réparti dans le temps** (nombre demandé en mode Avancé sinon ~1 / 2,5 min, borné [4..12]) — neutralise les sur-générations (Qwen/GPT-OSS : 16–21 → ~10).

Le harnais `scripts/test-interactive-video-llm.mjs` importe le **même** module et rapporte BRUTE (sortie modèle) → PROD (livré à l'élève) : 0 timestamp non réel sur les 3 modèles après snap.

## Sections assemblées (clés i18n)

> ⚠️ **Ordre spécifique à la vidéo** (différent des autres activités) : la transcription
> (SOURCES) fait souvent des dizaines de milliers de caractères — si le schéma JSON arrivait
> APRÈS, une IA externe le perd (collage tronqué, attention diluée en fin de prompt long) et
> invente son propre format : tableau nu `[...]`, `options` au lieu d'`answers`, objet `feedback`
> global (cas réel, audit 2026-07). `buildActivityPrompt` place donc STRUCTURE + EXEMPLE **avant**
> les SOURCES et termine par un **rappel court** du format.

1. `prompt_contexte_pedagogique_commun` — contexte ([QUI]/[QUOI]/[NIVEAU]).
2. `prompt_interactive_video_regles_specifiques` — règles de placement + types + résumé.
3. `prompt_regles_pedagogiques_communes` — règles communes.
4. `prompt_interactive_video_structure_json` — schéma du JSON intermédiaire attendu (interdit
   explicitement les alias `options`/`hint`/`feedback` global).
5. `prompt_interactive_video_exemple_rendu` — exemple complet.
6. `prompt_interactive_video_sources` — cadrage de la transcription (remplace `[RAG]`).
7. `prompt_interactive_video_rappel_final` — rappel final : OBJET `{title, interactions, summary}`,
   jamais un tableau nu, jamais de `videoSource`.

Filet de sécurité côté code (si l'IA dérive quand même) : le healer wrappe un tableau nu en
`{interactions}` et absorbe les alias `options`/Vrai-Faux-en-options/`feedback` global
(cf. `json-healer.js`, branche InteractiveVideo).

## Format de sortie attendu (JSON intermédiaire)

```json
{
  "title": "…",
  "interactions": [
    { "timestamp": 18, "pause": true, "type": "multichoice",
      "question": "…", "answers": [ { "text": "…", "correct": true, "feedback": "…" } ] },
    { "timestamp": 72, "pause": true, "type": "truefalse",
      "question": "…", "correct": false, "feedbackOnCorrect": "…", "feedbackOnWrong": "…" },
    { "timestamp": 120, "pause": true, "type": "blanks",
      "text": "… *mot* …" }
  ],
  "summary": { "intro": "…", "statements": [ ["correcte", "distracteur 1", "distracteur 2"] ] }
}
```

Exemple complet : `assets/data/examples/interactive_video_1.json`.

## Notes

- `correct` pour `truefalse` : booléen côté JSON intermédiaire ; le processeur le convertit en `"true"`/`"false"` (string) attendu par `H5P.TrueFalse`.
- `blanks` : marqueurs `*mot*`, alternatives `*mot1/mot2*`, indice `*mot:indice*`. Le champ `text` **doit** contenir au moins un `*mot*` (auto-vérif dans le prompt) — sinon rien à compléter.
- `summary.statements[]` : 1ʳᵉ affirmation correcte, suivantes = distracteurs (mélangées par le lecteur).
- LaTeX : `\( … \)` uniquement. **Feedbacks en texte brut** : ils ne passent PAS par `formatTextToHtml` (H5P les rend en HTML) → `InteractiveVideo.js` **retire défensivement le Markdown** des feedbacks (`stripFeedbackMarkdown`) pour qu'aucun `*` ne s'affiche brut.
- **Timestamps** : le prompt insiste « RECOPIE une valeur `[mm:ss]`, ne la calcule pas » + conversion + borne de durée + relecture ; mais le **garde-fou déterministe** (snap sur l'ancre réelle la plus proche + écart des hors-durée + plafond) dans `interactive-video-snap.js` est ce qui garantit 0 timestamp non réel pour les 3 modèles (cf. section « Garde-fous déterministes »).
- **`correct` TrueFalse** : `toBool` reconnaît explicitement les chaînes négatives (`"false"`, `"faux"`, `"non"`, `"0"`…) — un simple `!!"false"` valait `true` et inversait la réponse.
- **zh / jp** : le label du bullet « nombre » utilise un deux-points ASCII (et non pleine-chasse `：`) pour que le regex `||` du prompt-generator résolve le conditionnel `[NOMBRE_ELEMENTS]` (sinon il fuyait littéralement dans le prompt).
