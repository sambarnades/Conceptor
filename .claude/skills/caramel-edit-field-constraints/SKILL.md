---
name: caramel-edit-field-constraints
description: Modifier les contraintes de rendu (render type) des champs H5P dans field-constraints.js. À utiliser quand l'utilisateur dit "render type", "html+latex", "unicode+markers", "champ doit accepter LaTeX", "champ ne doit pas avoir de HTML", "constraint LaTeX", "field-constraints", ou veut changer comment un champ est rendu/édité/healé.
---

# Modifier les contraintes de champs (render types)

Référence : `docs/PRD_FIELD_CONSTRAINTS_LATEX.md`. Fichier source : `js/h5p/field-constraints.js`.

## Vue d'ensemble

`field-constraints.js` est la **source unique de vérité** pour le render type de chaque champ texte de chaque activité H5P (27 activités, 99 champs).

Conséquences en cascade :
- **Éditeur visuel** (`field-renderers.js`) : choisit textarea richtext / input plain selon le type
- **JSON healer** (`json-healer.js`) : applique le bon healing (échappe LaTeX, strip HTML, etc.)
- **Processors** : peuvent appliquer des transforms field-aware
- **Export documents** : sait si conserver LaTeX ou convertir Unicode

## Les 6 render types

| Type | Description | Exemple |
|---|---|---|
| `html+latex` | HTML complet + MathJax LaTeX `\(...\)` | questions, taskDescription, prose pédagogique |
| `html` | HTML sans support LaTeX | certains feedback, descriptions courtes |
| `unicode` | Symboles Unicode math seulement, pas HTML/LaTeX | Chart labels, Millionnaire |
| `unicode+markers` | Unicode + markers H5P (`*mot*` pour DragTheWords) | DragTheWords, MarkTheWords |
| `plain` | Texte brut sans formatage | métadonnées, titres techniques |
| `plain+letters` | Lettres uniquement | crossword answers, FindTheWords wordList |

## Structure de `field-constraints.js`

```javascript
export const FIELD_CONSTRAINTS = {
  ActivityKey: {              // ex: "Flashcards", "DragTheWords"
    field_path: 'render_type', // ex: "cards.text": "html+latex"
    'cards.answer': 'html+latex',
    'cards.image.alt': 'plain',
    // ...
  },
  // alias Éléa
  elea_some_module: 'OtherKey'
};
```

Path notation : dot-path (`cards.text`, `questions.0.params.question`). Wildcards `*` supportés pour arrays.

## Cas d'usage typiques

### Ajouter un champ
1. Ouvrir `field-constraints.js`
2. Trouver l'activité (ou la créer)
3. Ajouter `'nouveau.path': 'render_type'`
4. Si c'est `html+latex` ou contient des accents/maths : voir "Propagation 11 langues" plus bas

### Changer un render type existant
- `plain` → `html+latex` : l'éditeur passe en richtext, le healer arrête de strip le HTML, MathJax kick in
- `html+latex` → `unicode` : le healer convertit `\frac{a}{b}` → `a/b`, le richtext devient input simple

### Activité Éléa (`elea_*`)
Aliaser dans `field-constraints.js` :
```javascript
elea_test: 'Test',          // elea_test utilise les contraintes de Test
elea_qcm: 'QCM',
```

## Validation

```bash
# Vérifie que toutes les contraintes sont cohérentes avec les 11 locales
node scripts/verify-all-locales.mjs

# Vérifie spécifiquement les contraintes LaTeX
node scripts/verify-locale-latex.mjs

# Visualisation interactive
open tests/field-constraints-dashboard.html
```

## Propagation des contraintes LaTeX dans les locales

Quand tu ajoutes/modifies un champ `html+latex`, son **prompt** LLM doit refléter cette capacité. Les prompts sont stockés dans les 11 locales (clés `prompt_*`).

```bash
# Propage les directives LaTeX dans les 11 fichiers locales (286 clés concernées)
node scripts/update-locale-latex.mjs
```

Le script lit `field-constraints.js`, identifie les champs `html+latex`, et injecte/met à jour les phrases-types dans les prompts ("Tu peux utiliser LaTeX `\(...\)` pour les formules").

## Pièges connus

- **Path wildcards** : `cards.*.text` ≠ `cards.text` — vérifier la notation exacte du JSON cible
- **Modules Éléa** : utilisent `elea_*` — toujours aliaser sinon le healer/éditeur ne trouvent pas
- **`unicode+markers`** : les markers `*...*` (DragTheWords) ou `*mot*` (MarkTheWords) sont protégés par le richtext-editor — ne pas changer en `unicode` sinon les markers sont strippés
- **Cohérence avec semantics.json H5P** : si tu mets `html+latex` sur un champ qui ne supporte pas le HTML côté lib H5P, le rendu peut casser — vérifier `semantics.json` de la lib H5P concernée
- **Source unique de vérité** : ne JAMAIS coder en dur un render type dans un processor — toujours passer par `field-constraints.js`

## Fichiers touchés

```
js/h5p/field-constraints.js              [principale modif]
js/locales/{11}.json                     [si propagation LaTeX nécessaire]
tests/field-constraints-dashboard.html   [pour visualiser]
```
