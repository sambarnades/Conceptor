# Prompt — Image interactive (H5P.ImageHotspots)

> ⚠️ Ce fichier est une **documentation de conception**. Il n'est **pas lu au runtime**.
> Le prompt réellement envoyé au LLM est assemblé par `js/services/prompt-generator.js` à partir
> des clés i18n `prompt_image_hotspots_*` des 11 locales (`js/locales/*.json`).

## Particularité : deux IA, une source injectée

Comme la **Vidéo interactive**, cette activité injecte une **source calculée** à la place de l'OCR/RAG :
ce ne sont pas des fichiers, mais les **zones détectées par le modèle vision** (`DEFAULT_VISION_MODEL`
dans `js/services/hotspot-vision.js` — actuellement Qwen 3.8 VL, relayé par Qwen 3.6 VL tant
qu'ILaaS ne le sert pas) au moment où
l'utilisateur joint l'image de fond.

```
Upload image  →  vision (DEFAULT_VISION_MODEL)  →  zones [{x,y,label,description}]  (capturées EN AMONT)
                                          │
              getPrompts() / buildImageHotspotsPrompt() injecte ces zones en SOURCES
                                          │
              LLM TEXTE (mistral-small-4) rédige header + text de chaque point
                                          │
              processors/ImageHotspots.js → content.json H5P 1.11
```

- Les coordonnées `x,y` sont en **POURCENTAGES (0–100)** de bout en bout (vision → prompt → JSON → processor).
- L'**image de fond n'est jamais demandée au LLM** : Caramel l'injecte en post-traitement (comme `videoSource`).
- La génération ne produit **que du texte** (1 `H5P.Text` par point). L'utilisateur ajoute image/audio/vidéo
  à la main dans l'éditeur (le format `content.json` les supporte nativement).

## Clés i18n (famille `prompt_image_hotspots_*`)

| Clé | Rôle |
|-----|------|
| `prompt_image_hotspots_sources` | Bloc SOURCES : les zones détectées (remplace `[RAG]`). |
| `prompt_image_hotspots_regles_specifiques` | Règles : 1 point par zone, texte seul, recopie des positions, nombre (`||`). |
| `prompt_image_hotspots_structure_json` | Schéma JSON intermédiaire `{ title, globalColor, hotspots:[{x,y,header,text}] }`. |
| `prompt_image_hotspots_exemple_rendu` | Exemple complet (zones SOURCES → JSON). Copie de `assets/data/examples/image_hotspots_1.json`. |

## Format intermédiaire (ce que le LLM doit produire)

```json
{
  "title": "Anatomie de la fleur",
  "globalColor": "#1768c4",
  "globalIconType": "numbers",
  "hotspots": [
    { "x": 31.5, "y": 22.0, "header": "Le pétale", "text": "<p>Les <strong>pétales</strong>…</p>" }
  ]
}
```

Le processeur `processors/ImageHotspots.js` traduit ce format plat en `content.json` v1.11
(`hotspots[].position{x,y}`, `content[]` = `H5P.Text 1.1` avec `subContentId`, etc.).


`globalIconType`: "numbers" | "icon" | "image"; `globalIcon`: "plus" | "minus" | "times" | "check" | "question" | "info" | "exclamation".
`hotspots[]`: `alwaysFullscreen` (boolean, false), `hotspotIconType` ("default" | "icon" | "image"), `hotspotIcon`, `hotspotColor`.
`hotspots[].content[]`: {"library":"H5P.Text 1.1","params":{"text":"…"}} | {"library":"H5P.Image 1.1","params":{"file":{"path":"…","mime":"image/png"},"alt":"…"}} | {"library":"H5P.Audio 1.5","params":{"files":[{"path":"…","mime":"audio/mpeg"}]}} | {"library":"H5P.Video 1.6","params":{"sources":[{"path":"…","mime":"video/mp4"}]}}.
