---
name: caramel-edit-h5p-processor
description: Modifier ou debugger un processeur H5P existant (Timeline, Flashcards, QuizSet, Crossword, etc.). À utiliser quand l'utilisateur dit "le processor X plante", "modifier processor", "ajouter champ à H5P.X", "debug processeur", "transformForQuizSet", "process() retourne mal", ou veut toucher un fichier de `js/h5p/processors/`.
---

# Modifier ou debugger un processeur H5P

Référence : `docs/guide-processeurs.md`. Dossier : `js/h5p/processors/` (21 processeurs + `index.js` routeur).

## Anatomie d'un processeur

```javascript
// js/h5p/processors/Timeline.js
export const machineName = 'H5P.Timeline';
export const version = '0.4.5';                    // DOIT matcher le dossier vendor/h5p-libs/
export const extraDependencies = [
  { machineName: 'H5P.Image', majorVersion: 1, minorVersion: 1 }
];

export default {
  process(jsonObj, helpers) {
    // jsonObj = sortie LLM passée par json-healer
    // helpers = { getUUID, applyConstraints, wrapInParams, registerImage, ... }
    
    // 1. Validation
    if (!jsonObj.events || !Array.isArray(jsonObj.events)) {
      throw new Error('Timeline: events array required');
    }
    
    // 2. Transformation vers structure H5P
    const params = {
      timelineTitle: jsonObj.title,
      events: jsonObj.events.map(e => ({
        startDate: e.date,
        text: { text: e.description },
        // ...
      }))
    };
    
    // 3. Retour
    return {
      content: { params, library: `${machineName} ${version}` },
      dependencies: [...extraDependencies, /* libs implicites */],
      metadata: { title: jsonObj.title, language: 'fr' }
    };
  },
  
  // OPTIONNEL : pour intégration QuizSet
  transformForQuizSet(question) {
    // Adapte une question Timeline pour devenir sous-question d'un QuizSet
    // Retourne { library, params } prêt à insérer dans questionSet.questions[]
  }
};
```

## Routeur (`processors/index.js`)

Double mapping critique :
```javascript
export const processors = {
  Timeline: TimelineProcessor,
  Flashcards: FlashcardsProcessor,
  // ...
};

export const libraryToKey = {
  'H5P.Timeline': 'Timeline',           // pour lookup inverse depuis QuizSet
  'H5P.Flashcards': 'Flashcards',
  // ...
};
```

## Helpers disponibles (passés en 2e argument de `process()`)

| Helper | Usage |
|---|---|
| `getUUID()` | Génère un UUID v4 (pour subContentId) |
| `applyConstraints(field, value, constraintType)` | Applique un render type (html+latex, plain, etc.) |
| `wrapInParams(obj)` | Encapsule dans `{params: obj}` (structure H5P standard) |
| `registerImage(blob)` | Enregistre une image dans le registry → retourne path |
| `getMediaImageUrl(field)` | Extrait URL/dataURL d'un champ image |
| `buildMediaStructure(image, helpers)` | Construit `media.params` H5P pour images contextuelles |
| `debugLog(module, ...)` | Log conditionnel (actif si `?debug`) |

## Activités existantes (21)

Timeline, Flashcards, QuizSet (+ QuizSetQCM, QuizSetVF), Glossary, Crossword, Essay, Summary, DragTheWords, DragAndDrop, FillInTheBlanks, ComplexFillTheBlanks, MarkTheWords, TrueFalse, MultipleChoice, FindTheWords, SortParagraphs, SingleChoiceSet, DialogCards, Chart, CoursePresentation.

## Cas particuliers — QuizSet (conteneur)

QuizSet, QuizSetQCM, QuizSetVF sont des **conteneurs** : chaque sous-question est une autre activité H5P. Le processor QuizSet :
1. Itère `questions[]`
2. Pour chaque question, regarde `library` ou `type`
3. Lookup dans `libraryToKey` pour trouver le moduleKey
4. Appelle `processors[moduleKey].transformForQuizSet(q)`
5. Insère le résultat dans `questionSet.questions[]`

**Si tu ajoutes une activité qui doit être quizable** : implémenter `transformForQuizSet()`.

## Cas particuliers — CoursePresentation

Voir `docs/PRD_COURSE_PRESENTATION.md`. Multi-slides avec layouts (24 layouts), positions image (left/right/top/bottom), sous-éléments H5P (texte, image, vidéo, exercice).

## Debugging

```bash
# Lancer le serveur en mode debug
python3 -m http.server 8000
open "http://localhost:8000/?debug"
```

Console navigateur : filtrer par `[DEBUG][processors]` ou `[DEBUG][TimelineProcessor]`.

Workflow de debug :
1. Récupérer le JSON brut LLM (visible dans le modal de génération en mode debug)
2. Récupérer le JSON healé (idem)
3. Vérifier où le processor diverge de la structure attendue
4. Comparer avec un `.h5p` de référence : `unzip -p ref.h5p content/content.json | jq`

## Pièges connus

- **Versions désaccordées** : `version` du processor ≠ version du dossier `vendor/h5p-libs/H5P.X-x.y/` → la lib H5P ne charge pas, preview noir
- **`extraDependencies` oubliées** : ex : Timeline a besoin de `H5P.Image` — sans ça, les images events ne s'affichent pas, sans erreur explicite
- **Healer trop agressif** : le healer peut over-corriger (ex: virer un champ qu'il ne reconnaît pas) — vérifier le diff brut/healé en mode debug
- **`subContentId`** : les sous-questions QuizSet et éléments CoursePresentation EXIGENT un UUID — utiliser `getUUID()`
- **Double échappement LaTeX** : `\\frac` vs `\frac` — le healer normalise mais si tu codes en dur, attention aux strings JSON
- **Markers DragTheWords** : `*mot*` doit rester intact dans le processor — ne pas escape en HTML
- **Libellé écrit en dur = une seule langue.** Un `.h5p` n'embarque pas les libs : seul le
  `content.json` produit par le processeur est traduit sur Éléa, et les `language/*.json` du
  vendor ne servent qu'à l'éditeur de la plateforme. Donc `checkAnswer: "Vérifier"` sort en
  français même en interface grecque, et un champ `common: true` **non écrit** sort en anglais
  même en interface française. Toujours `champ: translations.h5p_xxx || "repli"`.
  Ce piège s'était installé en masse : le lecteur de Vidéo interactive (47 libellés), 10 champs
  de Glisser les mots et le groupe `a11y` entier des Mots croisés étaient figés (audit 2026-08).
  Garde-fou : `node tests/run_h5p_ui_coverage.mjs --verbose` (en CI) ; pré-remplissage des
  locales depuis les traductions officielles H5P : `node scripts/sync-h5p-ui-labels.mjs --write`.
