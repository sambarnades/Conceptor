---
name: caramel-add-image-support
description: Ajouter le support d'images utilisateur (upload, resize, intégration .h5p, preview) à une activité H5P. À utiliser quand l'utilisateur dit "ajouter images à activité X", "support image H5P", "image dans cards/dialogs/elements", "image de fond", "media context image", ou veut étendre le système d'images.
---

# Ajouter le support d'images à une activité H5P

Référence détaillée : `docs/PRD_IMAGES_H5P.md`. Module central : `js/h5p/image-manager.js`.

## Architecture du système d'images

Tout est **côté navigateur** via Canvas API : pas d'upload serveur, pas de CDN, pas de base64 dans `content.json` (sauf pour la preview).

```
renderImageField (éditeur)
  → processImage (resize 800×600, JPEG 0.85)
  → registerImage (Map registry, ID unique)
  → createH5PBlob (inject dans ZIP : content/images/{id}.jpg)
  → clearAllImages (cleanup en fin de session)
```

**Preview** : `_embedImagesAsDataUrls()` (`h5p-manager.js`) remplace `images/...` par `data:` URLs dans `content.json` à la volée. **Requiert le patch `frame.bundle.js`** (regex `data:` reconnue par `H5P.getPath`).

## 12 activités déjà supportées (référence)

| Activité | Type d'image | Champ |
|---|---|---|
| Flashcards | per-item | `cards[].image` |
| DialogCards | per-item | `dialogs[].image` |
| DragAndDrop | per-item + background | `elements[].image`, `backgroundImage` |
| Crossword | background | `backgroundImage` |
| MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords | media context | `mediaImage` → `buildMediaStructure()` |
| CoursePresentation | per-slide + position | `slideImage` (position : left/right/top/bottom, 24 layouts) |
| Timeline | toggle URL/Image | `coverImage`, `eventImage` (asset.media string) |

## Étapes pour ajouter le support à une nouvelle activité

### 1. Identifier le pattern
- **Per-item** (image dans chaque élément d'un array) → comme Flashcards
- **Background** (une image de fond unique) → comme Crossword
- **Media context** (image accompagnant la question) → comme MultipleChoice (utilise `buildMediaStructure()`)
- **Slide / position** (image positionnable dans un layout) → comme CoursePresentation
- **Toggle URL/Image** (l'utilisateur choisit entre URL externe ou upload) → comme Timeline

### 2. Déclarer le champ dans `field-constraints.js`
Ajouter le champ image dans la définition de l'activité avec le type approprié :
```javascript
NewType: {
  fields: {
    // ... autres champs
    image: { type: 'image', label: 'h5p_newtype_image_label' },
    // ou pour un toggle URL/Image
    coverMode: { type: 'toggle', options: ['url', 'image'] },
    coverUrl: { type: 'text', showWhen: { coverMode: 'url' } },
    coverImage: { type: 'image', showWhen: { coverMode: 'image' } }
  }
}
```

### 3. Brancher dans le processor (`js/h5p/processors/NewType.js`)
- Pour **per-item / background** : injecter la référence dans le JSON H5P (`{path: 'images/{id}.jpg', mime: 'image/jpeg'}`)
- Pour **media context** : appeler `buildMediaStructure(jsonObj.mediaImage, helpers)` qui retourne la structure `media.params` H5P
- Pour **toggle** : tester `if (mode === 'image')` puis utiliser le path du registry, sinon prendre l'URL telle quelle

### 4. Tester l'éditeur
L'éditeur lit `field-constraints.js` automatiquement et rend :
- Widget upload + drag & drop + preview + alt text
- Optionnellement : `collapsible: true`, `selectField: { fromArray: 'cards', label: 'image' }` pour grouper

### 5. Tester l'export document
- `document-formatter.js` utilise `getMediaImageUrl()` pour extraire URL ou dataURL
- `document-exporter.js` utilise `prepareImageData()` qui résout 3 cas : data URL / path relatif (registry) / URL HTTP
- Vérifier que l'image apparaît dans DOCX, ODT, PDF

### 6. Tester la preview h5p-standalone
- L'image doit s'afficher dans l'iframe preview
- Si elle ne s'affiche pas → vérifier le patch `frame.bundle.js` (regex `data:`)
- `_embedImagesAsDataUrls()` doit être appelé pour le content type concerné

## Types de champs éditeur disponibles pour images

| Type | Usage |
|---|---|
| `image` | Widget upload complet (drag & drop, preview, alt text) |
| `image` + `collapsible: true` | Repliable dans un array item |
| `image` + `selectField` | Choisir parmi les images déjà uploadées dans une autre liste |
| `toggle` | Segmented control (ex: URL vs Image) — émet `change` event sur input caché pour `showWhen` |
| `fieldGroup` | Wrapper visuel collapsible (regroupe sub-fields sans namespacing du path) |

## Pièges connus

- **Patch `frame.bundle.js`** : si la preview est cassée, c'est probablement la regex non patchée. Voir CLAUDE.md.
- **Cleanup** : `clearAllImages()` doit être appelé entre deux générations sinon images résiduelles polluent le ZIP suivant
- **Resize** : 800×600 max, JPEG 0.85 — assez pour H5P mais pas pour de la HD
- **Alt text** : pour l'accessibilité, le widget génère un champ alt — le processor doit l'injecter dans `params.image.alt` ou équivalent selon la lib H5P
- **Path naming** : le registry génère des IDs uniques (UUID court). Ne JAMAIS coder en dur des noms de fichiers
- **Memory** : les Blobs sont gardés en mémoire jusqu'à `clearAllImages()`, attention aux 50+ images dans une CoursePresentation

## Fichiers touchés

```
js/h5p/image-manager.js                 [si nouveau pattern]
js/h5p/field-constraints.js             [déclaration champ]
js/h5p/processors/NewType.js            [intégration]
js/h5p/h5p-manager.js                   [si _embedImagesAsDataUrls() doit gérer un nouveau cas]
js/editor/field-renderers.js            [si nouveau type de widget]
js/export/document-formatter.js         [si export document doit voir l'image]
```
