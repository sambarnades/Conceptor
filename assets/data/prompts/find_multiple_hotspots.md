# Prompt — Find Multiple Hotspots (H5P.ImageMultipleHotspotQuestion)

> ⚠️ Ce fichier est une **documentation de conception**. Il n'est **pas lu au runtime**.
> Le prompt réellement envoyé au LLM est assemblé par `js/services/prompt-generator.js` à partir
> des clés i18n `prompt_find_multiple_hotspots_*` des 11 locales (`js/locales/*.json`).

## Particularité : mêmes « deux IA, une source injectée » qu'Image interactive

Flux vision identique à « Image interactive » et « Find the Hotspot » (cf. `find_the_hotspot.md`).
Ici le LLM transforme les zones en **chasse aux zones** : il choisit TOUTES les zones qui répondent
au critère (`correct: true`), les autres devenant des leurres, et nomme la famille recherchée
(`hotspotName`, ex. « légumes », « erreurs », « risques »).

```
Upload image  →  vision  →  zones [{x,y,label,description}]
                     │
   buildImageHotspotsPrompt(…, 'prompt_find_multiple_hotspots') → SOURCES
                     │
   LLM TEXTE : consigne + zones correctes multiples + feedbacks + hotspotName
                     │
   processors/FindMultipleHotspots.js → content.json H5P.ImageMultipleHotspotQuestion 1.0
```

- `x,y` = **CENTRES des zones en % (0–100)**, recopiés des SOURCES (conversion coin + taille : processeur).
- **Image de fond jamais demandée au LLM** (injection `data.image` par l'UI).
- Textes **BRUTS** (ni HTML, ni LaTeX).
- ⚠️ Player communautaire : le feedback d'une zone correcte est COMPOSÉ par le player
  « `{feedbackText}` {score} of {max} `{hotspotName}`. » → `feedbackText` des zones correctes doit
  être une **amorce de phrase sans ponctuation finale** (ex. « Bravo, vous avez trouvé »).
- `numberHotspots` = nombre de zones à trouver pour terminer (borné par le processeur au nombre
  de zones correctes) ; le score max en découle.

## Clés i18n (famille `prompt_find_multiple_hotspots_*`)

| Clé | Rôle |
|-----|------|
| `prompt_find_multiple_hotspots_sources` | Bloc SOURCES : les zones détectées (remplace `[RAG]`). |
| `prompt_find_multiple_hotspots_regles_specifiques` | Règles : zones correctes multiples, hotspotName, amorce de feedback, texte brut. |
| `prompt_find_multiple_hotspots_structure_json` | Schéma JSON intermédiaire (voir ci-dessous). |
| `prompt_find_multiple_hotspots_exemple_rendu` | Exemple complet. Copie de `assets/data/examples/find_multiple_hotspots_1.json`. |

## Format intermédiaire (ce que le LLM doit produire)

```json
{
  "title": "Trouver les légumes",
  "taskDescription": "Cliquez sur tous les légumes présents sur l'image.",
  "hotspotName": "légumes",
  "numberHotspots": 2,
  "hotspots": [
    { "x": 48.5, "y": 48.7, "correct": true,  "label": "La carotte",  "feedbackText": "Bravo, vous avez trouvé" },
    { "x": 18.3, "y": 51.8, "correct": false, "label": "La tomate",   "feedbackText": "Non : la tomate est botaniquement un fruit !" }
  ],
  "noneSelectedFeedback": "Vous n'avez cliqué sur aucune zone connue. Essayez encore !",
  "alreadySelectedFeedback": "Vous avez déjà trouvé cette zone !"
}
```

Champs optionnels par hotspot : `width`, `height` (taille de la zone cliquable en %, défaut 20).
Le processeur `processors/FindMultipleHotspots.js` traduit ce format plat en `content.json` 1.0
(`imageMultipleHotspotQuestion.hotspotSettings…`, `backgroundImageSettings.backgroundImage` IMBRIQUÉ —
cf. paquet Éléa de référence).
