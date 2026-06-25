---
name: caramel-edit-json-editor
description: Étendre ou modifier l'éditeur visuel JSON (champs custom, types de widgets, richtext WYSIWYG, formula assistant, validation). À utiliser quand l'utilisateur dit "ajouter type de champ éditeur", "modifier field renderer", "richtext", "WYSIWYG H5P", "champ image éditeur", "formula assistant", "validateurs", ou veut toucher à `js/editor/`.
---

# Étendre l'éditeur JSON visuel

Références : `docs/guide-editeur-json.md`, `docs/catalogue-champs-editeur.md`. Dossier : `js/editor/`.

## Architecture (10 fichiers)

| Fichier | Rôle |
|---|---|
| `index.js` | Orchestrateur — lifecycle, intégration modal, API publique `initJsonEditor()` |
| `editor-core.js` | `renderEditor()`, gestion d'état (`editorState`) |
| `content-detector.js` | Schémas + signatures H5P/Moodle (~86 KB) |
| `field-renderers.js` | UI des champs — types d'input, génération HTML (~51 KB) |
| `array-manager.js` | Arrays — add/remove/reorder (~49 KB) |
| `validators.js` | Validation par type (~32 KB) |
| `feedback-editor.js` | Class FeedbackEditor (UI dédiée feedback H5P) |
| `json-utils.js` | `getNestedValue()`, `setNestedValue()` (dot-paths) |
| `richtext-editor.js` | WYSIWYG contenteditable, toolbar, protection LaTeX, markdown round-trip |
| `formula-assistant.js` | Modal formules (6 catégories, MathJax preview live) |

État global : `editorState = { isActive, originalData, currentData, contentType, moduleKey, hasChanges, validationErrors }`.

CSS : `css/components/json-editor.css`, `css/components/richtext-editor.css`.

## Types de champs disponibles (catalogue)

Voir `docs/catalogue-champs-editeur.md` pour la liste exhaustive. Principaux :

| Type | Usage |
|---|---|
| `text` | Input ligne unique |
| `textarea` | Multi-lignes — passe en richtext si render type le permet |
| `number` | Input nombre + min/max |
| `boolean` / `checkbox` | Toggle |
| `select` | Dropdown options statiques |
| `selectField` | Dropdown valeurs dérivées d'un autre champ array |
| `image` | Widget upload + drag & drop + preview + alt |
| `toggle` | Segmented control (ex: URL/Image) — émet `change` event sur input caché |
| `fieldGroup` | Wrapper visuel collapsible (regroupe sub-fields sans namespacing path) |
| `array` | Liste d'items réordonnables (géré par `array-manager.js`) |
| `feedback` | UI dédiée feedback H5P (FeedbackEditor) |

Modificateurs : `collapsible: true`, `showWhen: { otherField: value }`, `required: true`, `default: ...`, `placeholder: ...`.

## Ajouter un nouveau type de champ

1. **Définir le rendu** dans `field-renderers.js` :
```javascript
case 'monNouveauType':
  return `<div class="field-monNouveauType">
    <input type="..." data-path="${path}" data-type="monNouveauType" />
  </div>`;
```

2. **Brancher l'event listener** : `attachFieldListeners(container, path, type)` doit gérer les inputs du nouveau type.

3. **Validateur** dans `validators.js` :
```javascript
case 'monNouveauType':
  return validateMonType(value, fieldDef);
```

4. **CSS** dans `css/components/json-editor.css` (BEM-like).

5. **Documenter** dans `docs/catalogue-champs-editeur.md`.

## Rich Text Editor (`richtext-editor.js`)

WYSIWYG léger pour `textarea` avec render type `html+latex`, `html`, ou `unicode+markers`.

Features :
- Toolbar contextuelle : bold, italic, underline, strikethrough, sup/sub, color, lists, link, **math formula**
- Toggle source `</>` pour voir/éditer HTML brut
- **Protection LaTeX** : formules wrappées en `<span contenteditable="false" data-latex="...">`
- Double-click sur formule → ouvre `formula-assistant.js` pré-rempli
- **Markdown round-trip** : affiche `**gras**` comme visuellement gras, reconvertit en sauvegarde
- `field-constraints.js` est la SEULE source pour décider richtext vs input simple

**Restrictions** :
- Seulement sur `textarea` (pas `text` — trop court)
- Modules Éléa : utiliser `elea_*` aliasés dans `field-constraints.js`

## Formula Assistant (`formula-assistant.js`)

Modal pour insérer formules math :
- 6 catégories (élémentaire, fractions, racines, puissances, ensembles, géométrie)
- Preview live MathJax
- Insère `\(...\)` dans le richtext

Pour ajouter une formule :
1. Éditer la catégorie dans le composant (objets `FORMULAS = { categorie: [{ label, latex, preview }] }`)
2. Si nouvelle catégorie : ajouter onglet UI

## Cycle de vie d'édition

```
Result modal s'ouvre
  → initJsonEditor(jsonData, moduleKey, contentType)
  → content-detector.js identifie schéma
  → editor-core.renderEditor() construit l'arbre champs
  → field-renderers.js render chaque champ selon field-constraints.js
  → user édite → setNestedValue() met à jour editorState.currentData
  → validators.js valide à chaque blur
  → user clique "Régénérer" → save → relance pipeline (h5p-creator ou moodle-creator)
```

## Pièges connus

- **Path dot-notation** : `cards.0.text` (avec index numérique) — `getNestedValue()` / `setNestedValue()` gèrent
- **`showWhen`** nécessite un `change` event sur l'input cible — pour les toggles custom, dispatcher manuellement
- **Re-render intelligent** : un changement de champ ne doit PAS re-render tout l'éditeur (perte focus) — utiliser updates ciblés
- **Modules Éléa** : aliaser dans `field-constraints.js` sinon l'éditeur affiche un schéma vide
- **`fieldGroup`** : wrapper VISUEL only — ses sub-fields n'ont PAS de namespace path (le path reste celui du parent)
- **Richtext + LaTeX** : ne JAMAIS innerHTML direct du contenu utilisateur — passer par `protectLatex()` puis `unprotectLatex()` au save
- **Markdown** : `**gras**` est round-tripped, mais si utilisateur tape `<b>gras</b>` direct, c'est conservé en HTML (pas re-converti)

## Tests visuels

`tests/field-constraints-dashboard.html` — visualisation interactive des render types par activité, utile pour debugger les choix de l'éditeur.
