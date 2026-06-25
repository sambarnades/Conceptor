---
name: caramel-add-h5p-activity
description: Intégrer un nouveau type d'activité H5P de A à Z dans Caramel. À utiliser quand l'utilisateur dit "ajouter activité H5P", "nouveau type H5P", "intégrer H5P.X", "support H5P pour ...", ou veut créer un nouveau processeur H5P avec sa tuile, son prompt, ses traductions et son éditeur visuel.
---

# Ajouter une activité H5P

Référence exhaustive : `docs/PRD_NOUVELLE_ACTIVITE_H5P.md` (1876 lignes, 18 phases, lis-le si la tâche est complexe ou si l'activité a des particularités).

## Pipeline cible

```
definitions.js → prompt-generator → llm → json-healer → processors/NewType.js → h5p-creator → .h5p
```

## Checklist d'intégration (10 phases)

### 1. Enregistrement (`js/core/definitions.js`)
- Ajouter entrée dans `h5pModules` avec **tous** les champs : `name` (clé i18n), `englishName`, `machineName` (`H5P.XXX`), `description` (clé i18n), `image` (`assets/images/activities/xxx.webp`), `promptId` (`xxxResultat`), `jsonInputId` (`xxxJsonInput`), `createBtnId` (`createXxxH5P`), `categories`, `platforms`, `formats`, `hidden:false`.
- Insérer la clé dans `customOrder` à la position voulue dans la grille.
- Ajouter défauts français dans `js/core/translation.js` → `defaultTranslations` (rendu instantané avant fetch i18n).

### 2. Processeur (`js/h5p/processors/NewType.js`)
Squelette obligatoire :
```javascript
export const machineName = 'H5P.NewType';
export const version = '1.0.0';
export const extraDependencies = []; // libs H5P additionnelles
export default {
  process(jsonObj, helpers) {
    // 1. Valider jsonObj (champs requis)
    // 2. Transformer vers structure H5P attendue par la lib
    // 3. Retourner { content, dependencies, metadata }
  },
  // Optionnel : transformForQuizSet(question) si l'activité peut servir de sous-question QuizSet
};
```
Helpers fournis : `wrapInParams()`, `getUUID()`, `applyFieldConstraints(field, value, type)`, etc. — voir `docs/guide-processeurs.md`.

### 3. Routeur (`js/h5p/processors/index.js`)
- Ajouter dans `processors` map : `NewType: NewTypeProcessor`
- Ajouter dans `libraryToKey` map : `'H5P.NewType': 'NewType'` (pour lookup inverse QuizSet)

### 4. JSON Healer (`js/h5p/json-healer.js`)
Si l'activité a des spécificités (champs LaTeX particuliers, structure imbriquée, IDs requis), ajouter une branche dans `healJson()` ou utiliser `field-constraints.js`. Souvent rien à faire.

### 5. Field constraints (`js/h5p/field-constraints.js`)
Déclarer le render type de chaque champ texte de l'activité (6 types : `html+latex`, `html`, `unicode`, `unicode+markers`, `plain`, `plain+letters`). Voir skill `caramel-edit-field-constraints`.

### 6. Prompt LLM (`assets/data/prompts/NewType.md`)
Template Markdown. Variables interpolées : `{{qui}}`, `{{quoi}}`, `{{niveau}}`, `{{nombreQuestions}}`. Doit produire un JSON valide. Voir skill `caramel-prompts`.

### 7. Exemple JSON (`assets/data/examples/NewType.json`)
Échantillon valide servi en fallback / exemple. Doit traverser le processor sans erreur.

### 8. Lib H5P vendor (`js/vendor/h5p-libs/`)
Copier la structure officielle H5P (dossier avec `library.json`, `semantics.json`, JS, CSS). Doit matcher la version dans `machineName` + `version` du processor.

### 9. Traductions (11 langues) — voir skill `caramel-translations`
Conventions de clés :
- `h5p_{snake}_name`, `h5p_{snake}_description`
- `h5p_{snake}_field_*` pour les champs éditeur
- `prompt_{snake}_*` pour le prompt
- `emergency_h5p_{snake}_*` pour l'aide d'urgence

### 10. Éditeur visuel JSON
L'éditeur lit `field-constraints.js` automatiquement. Si tu veux des champs custom (image, fieldGroup, toggle, select dynamique), voir skill `caramel-edit-json-editor`.

## Phases optionnelles (selon activité)

- **Images** → skill `caramel-add-image-support`
- **Sous-question QuizSet** → exporter `transformForQuizSet()` + tester dans QuizSetQCM/VF
- **Activité conteneur** (avec exercices filles, comme CoursePresentation, QuizSet) → voir PRD §14b
- **Réglages avancés behaviour** → mapper dans le processor (autoCheck, retry, showSolutions, etc.)
- **Aide d'urgence** : ajouter clés `emergency_*` + entrée dans `js/ui/emergency-notification.js`
- **Asset visuel** : `assets/images/activities/newtype.webp` (ratio carré, ~256×256)

## Validation finale

1. Tuile s'affiche dans la grille avec icône, nom, description traduits
2. Prompt LLM génère un JSON cohérent
3. JSON healer ne casse rien
4. Processor produit un .h5p téléchargeable
5. Le .h5p s'ouvre dans la preview (h5p-standalone)
6. Le .h5p s'ouvre dans Lumi / Moodle / Éléa réel
7. Éditeur JSON visuel charge l'activité sans erreur
8. Toutes les clés i18n sont présentes dans les 11 langues : `node scripts/verify-all-locales.mjs`
9. Si LaTeX : `node scripts/verify-locale-latex.mjs`
10. Test sous-question QuizSet si applicable

## Fichiers touchés (récap)

```
js/core/definitions.js
js/core/translation.js
js/h5p/processors/NewType.js              [NOUVEAU]
js/h5p/processors/index.js
js/h5p/json-healer.js                     [si nécessaire]
js/h5p/field-constraints.js
assets/data/prompts/NewType.md            [NOUVEAU]
assets/data/examples/NewType.json         [NOUVEAU]
assets/images/activities/newtype.webp     [NOUVEAU]
js/vendor/h5p-libs/H5P.NewType-x.y/...    [NOUVEAU]
js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json
```

## Pièges connus

- **Versions H5P** : `version` dans le processor DOIT matcher la version du dossier `vendor/h5p-libs/`. Le healer corrige certaines erreurs mais pas toutes.
- **`extraDependencies`** : oublier une dépendance H5P (ex: `H5P.Image`, `H5P.AdvancedText`) casse le rendu sans erreur explicite — vérifier dans la console du navigateur lors du test preview.
- **`promptId` / `jsonInputId` / `createBtnId`** : doivent matcher EXACTEMENT les IDs DOM générés par `ui.js` à partir de `englishName`. Toute incohérence → boutons morts.
- **Catégories** : utiliser celles existantes (`quiz`, `memory`, `text`, `h5p`) sinon le filtre ignore.
- **Si l'activité est imbricable dans QuizSet** : implémenter `transformForQuizSet()` ET ajouter `'H5P.NewType': 'NewType'` dans `libraryToKey` côté `processors/index.js`.
