---
name: caramel-json-healer
description: Modifier ou debugger le JSON healer qui répare les sorties LLM avant les processors. À utiliser quand l'utilisateur dit "json healer", "réparation JSON", "le LLM produit du JSON cassé", "ajouter règle de healing", "json-healer.js", "le healer over-corrige", ou veut comprendre pourquoi un JSON est transformé entre le LLM et le processor.
---

# JSON Healer

Fichier : `js/h5p/json-healer.js`. Tourne **automatiquement** entre la sortie LLM et les processors. **Jamais bypasser.**

## Rôle

Les LLMs produisent du JSON imparfait. Le healer corrige les erreurs récurrentes :

1. **LaTeX backslashes** : `\\frac` → `\frac` (les LLMs double-échappent souvent)
2. **Wrap `params`** : si le JSON arrive sans `{params: {...}}`, encapsule
3. **Versions H5P** : corrige les versions impossibles (ex: `H5P.Timeline 99.99` → version réelle de la lib vendor)
4. **UUIDs manquants** : ajoute `subContentId` aux sous-questions QuizSet, éléments CoursePresentation
5. **Champs absents** : injecte des défauts si champs obligatoires manquants
6. **Markers H5P** : préserve `*mot*` (DragTheWords), `_blank_` (FillInTheBlanks)
7. **Field-aware** : utilise `field-constraints.js` pour décider quoi healer comment

## API publique

```javascript
import { healJson } from './json-healer.js';
import { getFieldConstraints } from './field-constraints.js';

const constraints = getFieldConstraints(moduleKey);   // 'Timeline', 'QuizSet', etc.
const healed = healJson(rawLlmJson, constraints, moduleKey);
// healed est garanti structurellement valide pour le processor
```

## Pipeline interne (séquence)

```
rawJson
  → tryParse (avec recovery: tronquer après dernière } valide)
  → normalizeBackslashes (LaTeX)
  → wrapInParams (si nécessaire)
  → applyFieldConstraints (par champ, selon render type)
  → injectMissingUUIDs (subContentId)
  → fixVersions (lookup vendor)
  → preserveMarkers (DragTheWords, MarkTheWords, FillInTheBlanks)
  → moduleSpecificHealing (cas particuliers par activité)
  → return healed
```

## Field-aware healing

Pour chaque champ texte, le healer applique selon `field-constraints` :

| Render type | Action healer |
|---|---|
| `html+latex` | Préserve HTML + normalise LaTeX `\(...\)` |
| `html` | Préserve HTML, strip LaTeX (convertit en Unicode) |
| `unicode` | Strip HTML + LaTeX → Unicode (`\frac{a}{b}` → `a/b`) |
| `unicode+markers` | Strip HTML/LaTeX, conserve markers H5P (`*mot*`) |
| `plain` | Strip tout formatage, garder texte brut |
| `plain+letters` | Strip tout + ne garder que `[A-Za-zÀ-ÿ]` (crossword) |

## Ajouter une règle de healing

### Cas 1 : healing global (toutes activités)
Modifier la fonction concernée dans `json-healer.js`. Exemple : nouvelle entité HTML mal échappée.

### Cas 2 : healing spécifique à une activité
Ajouter un cas dans `moduleSpecificHealing(json, moduleKey)` :
```javascript
function moduleSpecificHealing(json, moduleKey) {
  switch (moduleKey) {
    case 'NewType':
      // ex: forcer un champ à exister
      if (!json.required_field) json.required_field = 'default';
      // ex: corriger une structure spécifique
      if (Array.isArray(json.items)) {
        json.items = json.items.map(it => ({
          ...it,
          subContentId: it.subContentId || helpers.getUUID()
        }));
      }
      break;
  }
  return json;
}
```

### Cas 3 : nouveau render type
1. Ajouter le type dans `FIELD_CONSTRAINTS_TYPES` (`field-constraints.js`)
2. Ajouter le branch dans `applyFieldConstraints()` du healer
3. Documenter dans le skill `caramel-edit-field-constraints`

## Mode debug

Dans le navigateur, `?debug` expose dans le modal de génération :
- **Raw** : sortie LLM brute
- **Healed** : après healing
- **Diff** : delta surligné

C'est l'outil principal pour debugger un healer trop agressif (qui supprime du contenu valide) ou pas assez (qui laisse passer du JSON cassé vers le processor).

## Pièges connus

- **Over-healing** : si le healer normalise trop, du contenu utilisateur valide peut être perdu — toujours tester avec contenu LaTeX exotique
- **Under-healing** : si une nouvelle activité plante au processor avec une erreur cryptique, c'est souvent un cas non géré par le healer — ajouter un branch
- **JSON invalide récupérable** : `tryParse()` essaye de tronquer après le dernier `}` valide pour récupérer une réponse LLM coupée → si tu changes ce comportement, tester avec réponses tronquées
- **Modules Éléa** : passer le bon moduleKey (alias `elea_*` géré par `field-constraints.js`)
- **Performance** : le healer peut être appelé sur de gros JSON (CoursePresentation avec 50 slides) — éviter regex coûteuses globales
- **Pas de side-effects** : le healer doit retourner un nouveau JSON, ne pas muter `rawJson` en place (le mode debug a besoin du raw original)

## Tests

```bash
# Test du healer en isolation (si fichier de test existe)
node tests/test-json-healer.mjs        # à vérifier
```

Sinon : reproduire en navigateur avec `?debug`, comparer raw vs healed dans le modal.
