# Prompt — Find the Hotspot (H5P.ImageHotspotQuestion)

> ⚠️ Ce fichier est une **documentation de conception**. Il n'est **pas lu au runtime**.
> Le prompt réellement envoyé au LLM est assemblé par `js/services/prompt-generator.js` à partir
> des clés i18n `prompt_find_the_hotspot_*` des 11 locales (`js/locales/*.json`).

## Particularité : mêmes « deux IA, une source injectée » qu'Image interactive

Le flux vision est **strictement le même** que celui d'« Image interactive » (`requiresBackgroundImage`
dans `definitions.js`, section image de fond de `ui.js`, `js/services/hotspot-vision.js`) : les zones
détectées sont injectées en SOURCES à la place de l'OCR/RAG. La différence est **pédagogique** : ici le
LLM ne rédige pas un point d'information par zone, il transforme les zones en **question à réponse
cliquable** — il CHOISIT la (ou les) zone(s) correcte(s) selon le contexte, les autres devenant des leurres.

```
Upload image  →  vision (DEFAULT_VISION_MODEL)  →  zones [{x,y,label,description}]  (capturées EN AMONT)
                                          │
              getPrompts() / buildImageHotspotsPrompt(…, 'prompt_find_the_hotspot') injecte ces zones en SOURCES
                                          │
              LLM TEXTE (mistral-small-4) pose la question + choisit la zone correcte + rédige les feedbacks
                                          │
              processors/FindTheHotspot.js → content.json H5P.ImageHotspotQuestion 1.8
```

- Les coordonnées `x,y` du format intermédiaire sont les **CENTRES des zones en POURCENTAGES (0–100)**,
  recopiées des SOURCES. Le processeur convertit centre → coin haut-gauche (`computedSettings`) avec
  une taille par défaut de 20 % (ajustable via `width`/`height`).
- L'**image de fond n'est jamais demandée au LLM** : Caramel l'injecte en post-traitement (`data.image`).
- Tous les textes sont **BRUTS** (semantics `text` : ni HTML, ni LaTeX — affichage direct en popup).
- Le score se joue au **premier clic** (contrairement à Find Multiple Hotspots).

## Clés i18n (famille `prompt_find_the_hotspot_*`)

| Clé | Rôle |
|-----|------|
| `prompt_find_the_hotspot_sources` | Bloc SOURCES : les zones détectées (remplace `[RAG]`). |
| `prompt_find_the_hotspot_regles_specifiques` | Règles : 1 hotspot par zone, choix de la zone correcte, feedbacks, texte brut. |
| `prompt_find_the_hotspot_structure_json` | Schéma JSON intermédiaire (voir ci-dessous). |
| `prompt_find_the_hotspot_exemple_rendu` | Exemple complet (zones SOURCES → JSON). Copie de `assets/data/examples/find_the_hotspot_1.json`. |

## Format intermédiaire (ce que le LLM doit produire)

```json
{
  "title": "Trouver le pistil",
  "taskDescription": "Cliquez sur l'organe femelle de la fleur.",
  "hotspots": [
    { "x": 31.5, "y": 22.0, "correct": false, "label": "Le pétale", "feedbackText": "Non : le pétale sert à attirer les pollinisateurs." },
    { "x": 50.0, "y": 63.0, "correct": true,  "label": "Le pistil", "feedbackText": "Bravo ! Le pistil est bien l'organe femelle de la fleur." }
  ],
  "noneSelectedFeedback": "Vous n'avez cliqué sur aucune zone connue. Essayez encore !"
}
```

Champs optionnels par hotspot : `width`, `height` (taille de la zone cliquable en %, défaut 20).
Le processeur `processors/FindTheHotspot.js` traduit ce format plat en `content.json` 1.8
(`imageHotspotQuestion.hotspotSettings.hotspot[].{userSettings,computedSettings}`, `figure: "circle"`,
`backgroundImageSettings` APLATI — cf. paquet Éléa de référence).


`showFeedbackAsPopup`: true | false. `noneSelectedFeedback`: feedback for a click outside all zones. `hotspots[].figure`: "circle" | "rectangle"; `width`, `height`: 1–100 (%); `x`, `y`: centre, 0–100 (%).
