# PRD — Support d'images dans les activités H5P

> **Version** : 1.0.0 — **Date** : 2026-03-13
> **Objectif** : Ajouter le support complet d'images utilisateur dans les activités H5P de Caramel — insertion, suppression, prévisualisation dans l'éditeur visuel, packaging dans le fichier .h5p, et export dans les documents DOCX/ODT/PDF avec contraintes de taille.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Matrice des activités compatibles](#2-matrice-des-activités-compatibles)
3. [Phase 1 — Module image-manager.js](#3-phase-1--module-image-managerjs)
4. [Phase 2 — Packaging H5P (h5p-creator.js)](#4-phase-2--packaging-h5p-h5p-creatorjs)
5. [Phase 3 — Widget image dans l'éditeur](#5-phase-3--widget-image-dans-léditeur)
6. [Phase 4 — Flashcards (priorité 1)](#6-phase-4--flashcards-priorité-1)
7. [Phase 5 — DragAndDrop (priorité 1)](#7-phase-5--draganddrop-priorité-1)
8. [Phase 6 — DialogCards (priorité 2)](#8-phase-6--dialogcards-priorité-2)
9. [Phase 7 — Activités avec champ media (priorité 2)](#9-phase-7--activités-avec-champ-media-priorité-2)
10. [Phase 8 — CoursePresentation (priorité 3)](#10-phase-8--coursepresentation-priorité-3)
11. [Phase 9 — Crossword background (priorité 3)](#11-phase-9--crossword-background-priorité-3)
12. [Phase 10 — Timeline media (priorité 3)](#12-phase-10--timeline-media-priorité-3)
13. [Phase 11 — Export document avec images](#13-phase-11--export-document-avec-images)
14. [Phase 12 — Traductions (11 langues)](#14-phase-12--traductions-11-langues)
15. [Phase 13 — CSS et z-index](#15-phase-13--css-et-z-index)
16. [Phase 14 — Tests et validation](#16-phase-14--tests-et-validation)
17. [Checklist de validation finale](#17-checklist-de-validation-finale)
18. [Annexe A — Structures JSON H5P de référence](#annexe-a--structures-json-h5p-de-référence)
19. [Annexe B — Clés de traduction complètes](#annexe-b--clés-de-traduction-complètes)
20. [Annexe C — Carte des z-index](#annexe-c--carte-des-z-index)
21. [Annexe D — Fichiers modifiés (récapitulatif)](#annexe-d--fichiers-modifiés-récapitulatif)

---

## 1. Vue d'ensemble

### 1.1. Flux de données actuel (sans images)

```
definitions.js → prompt-generator.js → llm.js → json-healer.js
    → processors/*.js → h5p-creator.js → .h5p (ZIP : content.json + h5p.json)
    → notification → résultat modal → éditeur / export document
```

### 1.2. Flux de données cible (avec images)

```
definitions.js → prompt-generator.js → llm.js → json-healer.js
    → processors/*.js → h5p-creator.js → .h5p (ZIP : content.json + h5p.json + content/images/*)
    → notification → résultat modal → éditeur (widget image) / export document (images contraintes)
                                          ↓
                                    image-manager.js
                                    (resize, compress, registre)
```

### 1.3. Principes directeurs

- **100% client-side** : pas de serveur, tout passe par Canvas API et Blob
- **Optionnel** : les images sont toujours facultatives — aucune activité ne casse si on ne met pas d'image
- **Léger** : redimensionnement automatique (max 800×600px, JPEG 0.85) pour garder les .h5p < 5 Mo
- **Universel** : un seul module `image-manager.js` partagé par toutes les activités
- **Formats acceptés** : JPEG, PNG, GIF, WebP (converti en JPEG pour compatibilité H5P)
- **Nettoyage mémoire** : `URL.revokeObjectURL()` systématique après packaging

### 1.4. Patch h5p-standalone — Preview des images

> **⚠️ CRITIQUE — À réappliquer lors de toute mise à jour de h5p-standalone ⚠️**

**Problème :** L'iframe H5P créée par h5p-standalone charge les images via des `<img src="...">` qui font des requêtes HTTP directes au serveur. L'intercepteur `fetch()` de Caramel ne peut pas intercepter ces requêtes (seules les appels `fetch()` sont interceptés, pas les chargements natifs d'images).

**Solution implémentée (2 modifications) :**

1. **Patch `frame.bundle.js`** — `H5P.getPath()` est patché pour reconnaître les `data:` URLs comme absolues :
   - Regex originale : `/^[a-z0-9]+:\/\//i` (ne reconnaît que `http://`, `https://`)
   - Regex patchée : `/^([a-z0-9]+:\/\/|data:)/i` (reconnaît aussi `data:image/...`)
   - Fichier : `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` (commentaire d'avertissement en tête)

2. **Intercepteur fetch modifié** — Quand h5p-standalone fetch `content/content.json`, l'intercepteur dans `h5p-manager.js` :
   - Parse le JSON
   - Parcourt récursivement l'objet (`_embedImagesAsDataUrls()`)
   - Remplace chaque `path: "images/image-xxx.jpg"` par `path: "data:image/jpeg;base64,..."`
   - Sert le JSON modifié

**Flux complet :**
```
ZIP contient content/images/image-xxx.jpg
    → fetch interceptor lit l'image en base64
    → injecte data:image/...;base64,... dans le path du JSON
    → h5p-standalone reçoit le JSON modifié
    → H5P.getPath("data:image/...") reconnaît l'URL absolue (grâce au patch)
    → <img src="data:image/..."> s'affiche directement sans requête HTTP
```

**Approches écartées :**
- MutationObserver pour corriger les `<img>` après rendu → échoue car `document.write()` dans l'iframe invalide les observers
- Blob URLs → inaccessibles depuis l'iframe (contexte document différent)
- Service Worker → complexité excessive, requiert HTTPS

### 1.5. Export document avec images

Les images des flashcards et dialog cards sont exportées dans les 3 formats (DOCX, PDF, ODT) avec des **zones de taille fixe** pour garantir l'alignement recto/verso en impression.

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `imageMaxWidth` | 75 mm | Dans cellule de 92 mm, avec marges |
| `imageMaxHeight` | 25 mm | Dans cellule de 55 mm, laisse place au texte |

L'image est toujours :
- Centrée horizontalement dans la cellule
- Placée en haut de la cellule (le texte passe en dessous)
- Contrainte au ratio d'aspect original (pas de déformation)
- La zone image a une **hauteur fixe** (25 mm) même si l'image est plus petite → le texte commence toujours à la même position verticale

**Résolution des images :** Les chemins relatifs (`images/image-xxx.jpg`) sont résolus depuis le registre `image-manager.js` via `getAllImages()` (Map `h5pPath → Blob`). La fonction `prepareImageData()` gère 3 cas : data URL, chemin relatif (registre), URL HTTP.

---

## 2. Matrice des activités compatibles

### 2.1. Activités avec champ image dédié

| Activité | moduleKey | Champ image (semantics.json) | Type | Priorité |
|----------|-----------|------------------------------|------|----------|
| Flashcards | `Flashcards` | `cards[].image` | Image par carte | 1 |
| Drag & Drop | `DragAndDrop` | `question.settings.background` | Image d'arrière-plan unique | 1 |
| Dialog Cards | `DialogCards` | `dialogs[].image` | Image par carte | 2 |
| Course Presentation | `CoursePresentation` | Slides avec `H5P.Image 1.1` | Image par slide | 3 |
| Crossword | `Crossword` | `backgroundImage` | Image d'arrière-plan unique | 3 |
| Timeline | `Timeline` | `events[].asset.media` (URL ou image) + `coverImage` (couverture) | Toggle URL/Image par événement + couverture | 3 |

### 2.2. Activités avec champ `media` (image de contexte au-dessus de la question)

| Activité | moduleKey | Structure | Priorité |
|----------|-----------|-----------|----------|
| Multiple Choice | `MultipleChoice` | `media.type` → `H5P.Image 1.1` | 2 |
| True/False | `TrueFalse` | `media.type` → `H5P.Image 1.1` | 2 |
| Essay | `Essay` | `media.type` → `H5P.Image 1.1` | 2 |
| Fill in the Blanks | `FillInTheBlanks` | `media.type` → `H5P.Image 1.1` | 2 |
| Drag the Words | `DragTheWords` | `media.type` → `H5P.Image 1.1` | 2 |
| Mark the Words | `MarkTheWords` | `media.type` → `H5P.Image 1.1` | 2 |

### 2.3. Activités incompatibles (pas d'image dans les semantics H5P)

| Activité | Raison |
|----------|--------|
| Summary | Pas de champ image dans semantics |
| SortParagraphs | Pas de champ image |
| Chart | Pas de champ image (le graphique EST l'image) |
| FindTheWords | Pas de champ image |
| ComplexFillTheBlanks | Pas de champ image |
| SingleChoiceSet | Pas de champ image utilisable |

---

## 3. Phase 1 — Module image-manager.js

> **Fichier** : `js/h5p/image-manager.js` (nouveau)
>
> Module central gérant le cycle de vie complet des images : import, redimensionnement, compression, registre, nettoyage.

### 3.1. API publique

```javascript
/**
 * Registre global des images par session de génération.
 * Clé = identifiant unique (ex: "cards.0.image"), Valeur = objet ImageEntry.
 */

/**
 * @typedef {Object} ImageEntry
 * @property {string} id - Identifiant unique (chemin dans le JSON)
 * @property {string} h5pPath - Chemin dans le ZIP H5P (ex: "images/image-abc123.jpg")
 * @property {Blob} blob - Blob compressé prêt pour le packaging
 * @property {string} dataURL - Data URL pour la prévisualisation dans l'éditeur
 * @property {number} width - Largeur en pixels (après redimensionnement)
 * @property {number} height - Hauteur en pixels (après redimensionnement)
 * @property {string} mime - Type MIME (ex: "image/jpeg")
 * @property {number} originalSize - Taille originale en octets
 * @property {number} compressedSize - Taille compressée en octets
 */

// === API publique ===

export async function processImage(file, options = {})
// Entrée : File ou Blob (depuis <input type="file"> ou drag & drop)
// Options : { maxWidth: 800, maxHeight: 600, quality: 0.85, format: 'jpeg' }
// Sortie : ImageEntry
// Traitement : resize via Canvas API → conversion JPEG → génération h5pPath unique

export function registerImage(id, imageEntry)
// Ajoute une image au registre (id = chemin JSON, ex: "cards.0.image")

export function unregisterImage(id)
// Supprime une image du registre + URL.revokeObjectURL()

export function getImage(id)
// Retourne l'ImageEntry pour un identifiant donné

export function getAllImages()
// Retourne une Map<h5pPath, Blob> pour le packaging ZIP

export function clearAllImages()
// Vide le registre complet + révoque toutes les URLs
// Appelé après packaging réussi ou abandon

export function hasImages()
// Retourne true si au moins une image est enregistrée

export function getImageCount()
// Retourne le nombre d'images dans le registre
```

### 3.2. Constantes de configuration

```javascript
const IMAGE_CONFIG = {
    maxWidth: 800,          // px — largeur maximale après resize
    maxHeight: 600,         // px — hauteur maximale après resize
    quality: 0.85,          // Qualité JPEG (0-1)
    maxFileSize: 5 * 1024 * 1024,  // 5 Mo — taille max acceptée en entrée
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    outputFormat: 'image/jpeg',     // Format de sortie (compatibilité H5P)
    outputExtension: 'jpg',
    pathPrefix: 'images/'           // Préfixe du chemin dans le ZIP H5P
};
```

### 3.3. Fonction de redimensionnement

```javascript
async function resizeImage(blob, maxWidth, maxHeight, quality) {
    // 1. Créer un Image() depuis le blob
    // 2. Calculer les dimensions proportionnelles
    // 3. Dessiner sur un Canvas 2D
    // 4. Exporter en JPEG via canvas.toBlob(callback, 'image/jpeg', quality)
    // 5. Retourner le nouveau Blob
}
```

### 3.4. Génération du chemin H5P

```javascript
function generateH5PPath() {
    // Format : images/image-{hash8}.jpg
    // hash8 = 8 premiers caractères d'un UUID ou crypto.randomUUID()
    // Exemple : "images/image-a1b2c3d4.jpg"
}
```

### 3.5. Checklist Phase 1

- [x] Créer `js/h5p/image-manager.js`
- [x] Implémenter `processImage()` avec Canvas API
- [x] Implémenter le registre (Map interne) avec `register/unregister/get/getAll/clear`
- [x] Implémenter `resizeImage()` avec respect du ratio d'aspect
- [x] Gérer la conversion WebP/GIF → JPEG
- [x] Gérer les erreurs (fichier trop gros, format invalide, canvas failure)
- [x] Ajouter `URL.revokeObjectURL()` dans `unregisterImage()` et `clearAllImages()`
- [x] Ajouter les logs debug via `debugLog('ImageManager', ...)`
- [x] Tester manuellement avec différents formats et tailles d'image

---

## 4. Phase 2 — Packaging H5P (h5p-creator.js)

> **Fichier** : `js/h5p/h5p-creator.js`
>
> Modifier `createH5PBlob()` pour accepter et injecter des fichiers binaires (images) dans le ZIP.

### 4.1. Modification de la signature

```javascript
// AVANT
export async function createH5PBlob(contentJson, mainLibraryName, dependencies, options = {})

// APRÈS
export async function createH5PBlob(contentJson, mainLibraryName, dependencies, options = {})
// options.imageFiles = Map<string, Blob> (chemin → blob) — optionnel
```

### 4.2. Injection des images dans le ZIP

Dans `createH5PBlob()`, après l'ajout de `content/content.json` et `h5p.json` :

```javascript
// 3. Images (si présentes)
if (options.imageFiles && options.imageFiles.size > 0) {
    for (const [path, blob] of options.imageFiles) {
        const arrayBuffer = await blob.arrayBuffer();
        files.push({
            name: `content/${path}`,  // ex: "content/images/image-abc123.jpg"
            input: new Uint8Array(arrayBuffer),
            unixPermissions: 0o100644
        });
    }
}
```

### 4.3. Ajout automatique de la dépendance H5P.Image

```javascript
// Si des images sont présentes, ajouter H5P.Image 1.1 aux dépendances (si pas déjà là)
if (options.imageFiles && options.imageFiles.size > 0) {
    const hasImageDep = uniqueDependencies.some(d => d.machineName === 'H5P.Image');
    if (!hasImageDep) {
        uniqueDependencies.push({
            machineName: 'H5P.Image',
            majorVersion: 1,
            minorVersion: 1
        });
    }
}
```

### 4.4. Propagation des images depuis handleH5PCreation

Dans `handleH5PCreation()`, passer les images du registre à `packageAndDownloadH5P()` :

```javascript
import { getAllImages, clearAllImages, hasImages } from './image-manager.js';

// Dans handleH5PCreation(), avant packageAndDownloadH5P() :
const imageFiles = hasImages() ? getAllImages() : null;

// Passer à packageAndDownloadH5P() → createH5PBlob()
// options.imageFiles = imageFiles
```

### 4.5. Nettoyage post-packaging

```javascript
// Après packaging réussi, libérer la mémoire :
clearAllImages();
```

### 4.6. Checklist Phase 2

- [x] Modifier la signature de `createH5PBlob()` — ajouter `options.imageFiles`
- [x] Ajouter la boucle d'injection des images dans le tableau `files[]`
- [x] Ajouter la dépendance `H5P.Image 1.1` automatiquement si images présentes
- [x] Modifier `packageAndDownloadH5P()` pour recevoir et transmettre `imageFiles`
- [x] Modifier `handleH5PCreation()` pour récupérer les images du registre
- [x] Appeler `clearAllImages()` après packaging réussi
- [x] Vérifier que les fichiers images sont bien dans le ZIP (test avec JSZip.loadAsync)
- [x] Vérifier que l'import de `H5P.Image 1.1` est déjà présent dans `js/vendor/h5p-libs/`

---

## 5. Phase 3 — Widget image dans l'éditeur

> **Fichiers** : `js/editor/field-renderers.js`, `js/editor/editor-core.js`, `css/components/json-editor.css`
>
> Créer un nouveau type de champ `image` pour l'éditeur visuel JSON.

### 5.1. Nouveau renderer : `renderImageField`

**Fichier** : `js/editor/field-renderers.js`

```javascript
/**
 * Rend un champ image avec :
 * - Zone de drop / bouton "Parcourir"
 * - Prévisualisation miniature
 * - Bouton supprimer
 * - Indicateur de taille
 *
 * @param {Object} config - Configuration du champ
 * @param {Object|null} value - Valeur actuelle { path, dataURL, width, height, mime } ou null
 * @param {Function} onChange - Callback (path, newValue)
 * @param {string} path - Chemin dans le JSON (ex: "cards.0.image")
 */
export function renderImageField(config, value, onChange, path) { ... }
```

### 5.2. Structure HTML du widget

```html
<div class="json-editor__field json-editor__field--image" data-path="cards.0.image">
    <label class="json-editor__label">
        <i class="fas fa-image"></i> Image (optionnel)
    </label>

    <!-- État : aucune image -->
    <div class="json-editor__image-dropzone">
        <input type="file" accept="image/*" class="json-editor__image-input" />
        <div class="json-editor__image-dropzone-content">
            <i class="fas fa-cloud-upload-alt"></i>
            <p data-key="editor_image_drop_text">Glissez une image ici ou cliquez pour parcourir</p>
            <span class="json-editor__image-hint" data-key="editor_image_hint">
                JPEG, PNG, WebP — max 5 Mo
            </span>
        </div>
    </div>

    <!-- État : image chargée (visible quand une image est présente) -->
    <div class="json-editor__image-preview" style="display: none;">
        <div class="json-editor__image-preview-container">
            <img class="json-editor__image-preview-img" src="" alt="" />
            <button class="json-editor__image-remove-btn" title="Supprimer l'image">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="json-editor__image-info">
            <span class="json-editor__image-dimensions"><!-- 800 × 600 px --></span>
            <span class="json-editor__image-size"><!-- 245 Ko --></span>
        </div>
        <div class="json-editor__image-alt">
            <input type="text" class="json-editor__input json-editor__image-alt-input"
                   placeholder="Texte alternatif (accessibilité)" data-key-placeholder="editor_image_alt_placeholder" />
        </div>
    </div>
</div>
```

### 5.3. Comportement du widget

#### Upload (clic ou drag & drop)

1. L'utilisateur clique sur la zone ou glisse un fichier
2. `<input type="file">` déclenche `change` event
3. Le fichier est passé à `processImage(file)` de `image-manager.js`
4. Si succès :
   - `registerImage(path, imageEntry)` ajoute au registre
   - La prévisualisation s'affiche (miniature + infos)
   - `onChange(path, { path: imageEntry.h5pPath, mime: imageEntry.mime, width: imageEntry.width, height: imageEntry.height })` est appelé
5. Si erreur :
   - Toast d'erreur (fichier trop gros, format invalide)
   - La zone de drop reste visible

#### Suppression

1. Clic sur le bouton ✕ rouge
2. `unregisterImage(path)` supprime du registre
3. La prévisualisation disparaît, la zone de drop réapparaît
4. `onChange(path, null)` est appelé pour effacer la valeur

#### Drag & drop visuel

1. `dragenter` / `dragover` : ajout de la classe `json-editor__image-dropzone--dragover` (bordure bleue)
2. `dragleave` : retrait de la classe
3. `drop` : extraction du fichier via `e.dataTransfer.files[0]`, même traitement que le clic

### 5.4. Enregistrement dans le registre des renderers

**Fichier** : `js/editor/field-renderers.js`, dans l'objet `fieldRenderers` :

```javascript
export const fieldRenderers = {
    // ... existants ...
    'image': renderImageField
};
```

### 5.5. Gestion du texte alternatif

Le champ `alt` (texte alternatif) peut être géré de deux façons :

**Option 1 — Champ séparé dans le schéma** (mode initial) :
- Un champ `imageAltText` à côté du champ `image` dans le schéma
- Géré indépendamment par le renderer de champ texte

**Option 2 — `altTextField` intégré** (mode recommandé, ajouté en Phase 5-7) :
- Le champ `image` déclare `altTextField: 'imageAltText'` dans sa config
- Le renderer `renderImageField()` dérive le chemin du texte alternatif comme champ frère : `cards.0.image` → `cards.0.imageAltText`
- L'input texte est rendu directement sous l'image, dans le même conteneur (ou dans le même collapsible)
- L'alt text est effacé automatiquement quand l'image est supprimée

### 5.5b. Mode collapsible

Ajouté en Phase 5-7 pour réduire l'encombrement dans les schémas d'items (Flashcards, DialogCards) :

- `collapsible: true` sur la config du champ image
- `renderImageField()` est refactorisé : extraction de `renderImageFieldContent()` (fonction interne)
- En mode collapsible, le contenu est enveloppé dans un accordion (`json-editor__array-item-subsection`)
- Le collapsible s'ouvre automatiquement si une image est déjà présente
- `collapsibleLabel` spécifie la clé de traduction pour le titre de l'accordion

### 5.6. Restauration depuis les données existantes

Quand l'éditeur ouvre une activité qui a déjà une image (après régénération H5P) :

1. `renderImageField` vérifie si `value` est non-null
2. Si `value.dataURL` existe → affiche la prévisualisation directement
3. Si `value.path` existe mais pas `dataURL` → affiche un placeholder avec le nom du fichier
4. Le registre `image-manager` est re-peuplé si nécessaire

### 5.7. Checklist Phase 3

- [x] Créer `renderImageField()` dans `field-renderers.js`
- [x] Enregistrer `'image': renderImageField` dans l'objet `fieldRenderers`
- [x] Implémenter le drag & drop (dragenter, dragover, dragleave, drop)
- [x] Implémenter le clic → `<input type="file">`
- [x] Implémenter la prévisualisation (img src = dataURL)
- [x] Implémenter le bouton supprimer (✕ rouge)
- [x] Implémenter l'affichage des dimensions et taille
- [x] Implémenter le champ texte alternatif (accessibilité)
- [x] Appeler `processImage()` et `registerImage()` sur upload
- [x] Appeler `unregisterImage()` sur suppression
- [x] Appeler `onChange(path, value)` sur ajout/suppression
- [x] Gérer les erreurs utilisateur (format invalide, fichier trop gros) avec messages i18n
- [x] Ajouter le CSS dans `json-editor.css` (voir Phase 13)
- [x] Vérifier le z-index de la zone de drop dans le contexte modal
- [x] Tester dans l'éditeur de Flashcards, DialogCards, DragAndDrop

---

## 6. Phase 4 — Flashcards (priorité 1)

> **Fichiers** : `js/h5p/processors/Flashcards.js`, `js/editor/content-detector.js`

### 6.1. Schéma éditeur

**Fichier** : `js/editor/content-detector.js`, dans le schéma `'Flashcards'` :

Ajouter `image` et `imageAltText` dans `itemSchema` de l'array `cards` :

```javascript
'Flashcards': {
    sections: [{
        id: 'general',
        label: 'editor_section_general',
        icon: 'fa-info-circle',
        countField: 'cards',
        fields: {
            title: { type: 'text', label: 'editor_title', required: true },
            cards: {
                type: 'array',
                itemLabel: 'editor_card',
                addLabel: 'editor_add_card',
                minItems: 1,
                itemsExpanded: false,
                itemSchema: {
                    text: { type: 'text', label: 'editor_card_front', required: true },
                    answer: { type: 'text', label: 'editor_card_back', required: true },
                    image: {                                    // ← NOUVEAU
                        type: 'image',
                        label: 'editor_image',
                        hint: 'editor_image_card_hint',
                        collapsible: true,                      // ← Pliable pour réduire l'encombrement
                        collapsibleLabel: 'editor_image',
                        altTextField: 'imageAltText'            // ← Alt text intégré dans le widget
                    },
                    imageAltText: {                             // ← Utilisé en interne par altTextField
                        type: 'text',
                        label: 'editor_image_alt'
                    },
                    tip: { type: 'textarea', label: 'editor_card_tip', collapsible: true }
                }
            }
        }
    }]
}
```

### 6.2. Processeur Flashcards

**Fichier** : `js/h5p/processors/Flashcards.js`

Modifier le `map` des cartes pour inclure l'image :

```javascript
cards: (Array.isArray(jsonObj.cards) ? jsonObj.cards : []).map(card => ({
    text: formatTextToHtml(card.text || ""),
    answer: formatTextToHtml(card.answer || ""),
    tip: formatTextToHtml(card.tip || ""),
    // Image optionnelle — structure attendue par H5P.Flashcards semantics
    ...(card.image ? {
        image: {
            path: card.image.path || card.image,
            mime: card.image.mime || "image/jpeg",
            width: card.image.width || 0,
            height: card.image.height || 0
        },
        imageAltText: card.imageAltText || ""
    } : {})
})),
```

### 6.3. Structure JSON H5P attendue (référence semantics.json)

```json
{
  "cards": [
    {
      "text": "<p>Recto de la carte</p>",
      "answer": "Réponse",
      "tip": "Indice",
      "image": {
        "path": "images/image-a1b2c3d4.jpg",
        "mime": "image/jpeg",
        "width": 800,
        "height": 600
      },
      "imageAltText": "Description de l'image"
    }
  ]
}
```

### 6.4. Checklist Phase 4

- [x] Ajouter `image` (type `'image'`) dans le `itemSchema` des `cards` dans `content-detector.js`
- [x] Ajouter `imageAltText` (type `'text'`, conditionnel) dans le `itemSchema`
- [x] Modifier le processeur `Flashcards.js` pour inclure `image` et `imageAltText` dans le map
- [x] Vérifier que l'image est optionnelle (pas de `required: true`)
- [x] Tester : générer des Flashcards sans image → fonctionne comme avant
- [x] Tester : ajouter une image via l'éditeur → prévisualisation visible
- [x] Tester : supprimer l'image → champ revient à vide
- [x] Tester : télécharger le .h5p → l'image est dans le ZIP sous `content/images/`
- [ ] Tester : importer le .h5p dans Moodle/Lumi → l'image s'affiche sur la carte

---

## 7. Phase 5 — DragAndDrop (priorité 1)

> **Fichiers** : `js/h5p/processors/DragAndDrop.js`, `js/editor/content-detector.js`

### 7.1. Schéma éditeur

**Fichier** : `js/editor/content-detector.js`, dans le schéma `'DragAndDrop'` :

Ajouter une **section dédiée** pliée par défaut pour l'image d'arrière-plan :

```javascript
'DragAndDrop': {
    sections: [
        {
            id: 'general',
            label: 'editor_section_general',
            icon: 'fa-info-circle',
            fields: {
                title: { type: 'text', label: 'editor_title', required: true },
                // ... dropZones, elements existants ...
            }
        },
        {
            id: 'background',                              // ← SECTION DÉDIÉE
            label: 'editor_image_background',
            icon: 'fa-image',
            startCollapsed: true,                           // ← Pliée par défaut
            fields: {
                backgroundImage: {
                    type: 'image',
                    label: 'editor_image_background',
                    hint: 'editor_image_background_hint'
                }
            }
        }
    ]
}
```

### 7.2. Processeur DragAndDrop

**Fichier** : `js/h5p/processors/DragAndDrop.js`

Ajouter l'image d'arrière-plan dans `question.settings` :

```javascript
question: {
    settings: {
        size: {
            width: canvasW,
            height: canvasH
        },
        // Image d'arrière-plan optionnelle
        ...(jsonObj.backgroundImage ? {
            background: {
                path: jsonObj.backgroundImage.path || jsonObj.backgroundImage,
                mime: jsonObj.backgroundImage.mime || "image/jpeg",
                width: jsonObj.backgroundImage.width || canvasW,
                height: jsonObj.backgroundImage.height || canvasH
            }
        } : {})
    },
    task: {
        elements: h5pElements,
        dropZones: h5pDropZones
    }
}
```

### 7.3. Adaptation des dimensions du canvas

Quand une image d'arrière-plan est fournie, les dimensions du canvas doivent s'adapter :

```javascript
// Si une image de fond est fournie, adapter le canvas à ses proportions
let canvasW = DEFAULT_CANVAS_WIDTH;
let canvasH;

if (jsonObj.backgroundImage && jsonObj.backgroundImage.width && jsonObj.backgroundImage.height) {
    const ratio = jsonObj.backgroundImage.height / jsonObj.backgroundImage.width;
    canvasH = Math.round(canvasW * ratio);
} else {
    // Calcul existant via computeLayout()
}
```

### 7.4. Structure JSON H5P attendue

```json
{
  "question": {
    "settings": {
      "size": { "width": 800, "height": 600 },
      "background": {
        "path": "images/image-xyz789.jpg",
        "mime": "image/jpeg",
        "width": 800,
        "height": 600
      }
    },
    "task": {
      "elements": [...],
      "dropZones": [...]
    }
  }
}
```

### 7.5. Choix UX : section pliée

L'image de fond est dans une **section dédiée** (`startCollapsed: true`) dans l'éditeur — moins intrusif que de l'afficher directement dans les infos générales. La section se déplie à la demande.

**Note :** Les zones de dépôt DragAndDrop ne supportent PAS d'image (uniquement des labels texte). Les éléments draggables pourraient être des images via `H5P.Image 1.1`, mais cela nécessiterait un sélecteur de type texte/image par élément — non implémenté.

**Export document :** L'image d'arrière-plan n'est PAS exportée dans les documents DOCX/ODT/PDF car elle n'a pas de valeur pédagogique sur papier (elle sert uniquement de fond au canvas interactif).

### 7.6. Checklist Phase 5

- [x] Ajouter `backgroundImage` (type `'image'`) dans le schéma `'DragAndDrop'` dans `content-detector.js`
- [x] Section dédiée `startCollapsed: true` avec icone `fa-image`
- [x] Modifier le processeur `DragAndDrop.js` pour injecter `background` dans `question.settings`
- [ ] Tester : DragAndDrop sans image → fonctionne comme avant
- [ ] Tester : ajouter une image de fond → prévisualisation dans l'éditeur
- [ ] Tester : le .h5p contient l'image + le content.json référence le bon chemin
- [ ] Tester : l'activité fonctionne dans Moodle/Lumi avec l'image de fond

### 7.7. Phase 5 bis — Images d'étiquettes DragAndDrop

> **Ajout** : Les éléments draggables supportent `H5P.Image 1.1` en plus de `H5P.AdvancedText 1.1`.
> Quand un élément a un champ `image` rempli, l'étiquette devient une image au lieu de texte.

**Schéma éditeur** : ajout d'un champ `image` collapsible dans l'`itemSchema` des `elements` :

```javascript
image: {
    type: 'image', label: 'editor_image',
    hint: 'editor_image_element_hint',
    collapsible: true, collapsibleLabel: 'editor_image',
    altTextField: 'imageAltText'
}
```

**Processeur** : dans `DragAndDrop.js`, si `el.image.path` existe, l'élément est créé comme `H5P.Image 1.1` avec `file.path/mime/width/height` et `alt` = `el.imageAltText || el.text`.

**Dépendance** : `H5P.Image 1.1` ajouté aux `extraDependencies` de DragAndDrop dans `processors/index.js`.

#### Checklist Phase 5 bis

- [x] Ajouter champ `image` collapsible dans l'itemSchema des éléments (content-detector.js, schéma plat + sections)
- [x] Modifier le processeur DragAndDrop.js : créer `H5P.Image 1.1` si `el.image.path` existe
- [x] Ajouter `H5P.Image 1.1` dans extraDependencies de DragAndDrop
- [x] Ajouter traduction `editor_image_element_hint` (fr, en)
- [x] Ajouter tests dans test-images.js (4c2)

---

## 8. Phase 6 — DialogCards (priorité 2)

> **Fichiers** : `js/h5p/processors/DialogCards.js`, `js/editor/content-detector.js`

### 8.1. Schéma éditeur

Ajouter `image` et `imageAltText` dans `itemSchema` de l'array `dialogs` :

```javascript
dialogs: {
    type: 'array',
    itemLabel: 'editor_card',
    itemSchema: {
        text: { type: 'textarea', label: 'editor_card_front', required: true },
        answer: { type: 'textarea', label: 'editor_card_back', required: true },
        image: {                                    // ← NOUVEAU
            type: 'image',
            label: 'editor_image',
            hint: 'editor_image_card_hint',
            collapsible: true,                      // ← Pliable
            collapsibleLabel: 'editor_image',
            altTextField: 'imageAltText'            // ← Alt text intégré
        },
        imageAltText: {                             // ← Utilisé en interne par altTextField
            type: 'text',
            label: 'editor_image_alt'
        },
        tips: { ... }
    }
}
```

### 8.2. Processeur DialogCards

**Fichier** : `js/h5p/processors/DialogCards.js`

```javascript
const transformedDialogs = (Array.isArray(jsonObj.dialogs) ? jsonObj.dialogs : []).map(dialog => ({
    text: formatDialogText(dialog.text),
    answer: formatDialogText(dialog.answer),
    tips: {
        front: dialog.tips?.front ? formatTextToHtml(dialog.tips.front) : '',
        back: dialog.tips?.back ? formatTextToHtml(dialog.tips.back) : ''
    },
    // Image optionnelle
    ...(dialog.image ? {
        image: {
            path: dialog.image.path || dialog.image,
            mime: dialog.image.mime || "image/jpeg",
            width: dialog.image.width || 0,
            height: dialog.image.height || 0
        },
        imageAltText: dialog.imageAltText || ""
    } : {})
}));
```

### 8.3. Structure JSON H5P attendue

```json
{
  "dialogs": [
    {
      "text": "<p style='text-align: center;'>Question</p>",
      "answer": "<p style='text-align: center;'>Réponse</p>",
      "tips": { "front": "", "back": "" },
      "image": {
        "path": "images/image-dialog01.jpg",
        "mime": "image/jpeg",
        "width": 400,
        "height": 300
      },
      "imageAltText": "Description"
    }
  ]
}
```

### 8.4. Choix UX : collapsible avec altTextField intégré

Comme pour Flashcards, le champ `image` dans chaque carte DialogCards est rendu en mode **collapsible** (`collapsible: true`) pour réduire l'encombrement visuel. Le texte alternatif est intégré directement dans le collapsible via `altTextField: 'imageAltText'` — il n'est pas un champ séparé dans le schéma.

Le collapsible s'ouvre automatiquement si une image est déjà présente.

### 8.5. Checklist Phase 6

- [x] Ajouter `image` (type `'image'`, `collapsible: true`, `altTextField: 'imageAltText'`) dans le schéma `'DialogCards'` dans `content-detector.js`
- [x] Ajouter `imageAltText` (type `'text'`, `label: 'editor_image_alt'`) dans le schéma — utilisé en interne par le widget
- [x] Modifier le processeur `DialogCards.js` pour inclure `image` et `imageAltText`
- [ ] Tester sans image → fonctionne comme avant
- [ ] Tester avec image → prévisualisation + packaging correct
- [ ] Tester dans Moodle/Lumi → image visible sur la carte

---

## 9. Phase 7 — Activités avec champ media (priorité 2)

> **Fichiers** : `js/h5p/processors/{MultipleChoice,TrueFalse,Essay,FillInTheBlanks,DragTheWords,MarkTheWords}.js`, `js/editor/content-detector.js`
>
> Ces 6 activités partagent la même structure `media` : une image optionnelle affichée au-dessus de la question.

### 9.1. Structure media H5P commune

```json
{
  "media": {
    "type": {
      "library": "H5P.Image 1.1",
      "params": {
        "file": {
          "path": "images/image-media01.jpg",
          "mime": "image/jpeg",
          "width": 600,
          "height": 400
        },
        "alt": "Description de l'image",
        "decorative": false
      },
      "subContentId": "uuid-généré",
      "metadata": {
        "contentType": "Image",
        "license": "U",
        "title": "Untitled Image"
      }
    },
    "disableImageZooming": false
  }
}
```

### 9.2. Schéma éditeur commun

Pour chacune des 6 activités, ajouter une **section dédiée** pliée par défaut :

```javascript
// Section dédiée pour l'image media — ajoutée après la section 'general'
{
    id: 'media',
    label: 'editor_image_context',
    icon: 'fa-image',
    startCollapsed: true,                       // ← Pliée par défaut
    fields: {
        mediaImage: {
            type: 'image',
            label: 'editor_image_context',
            hint: 'editor_image_context_hint',
            altTextField: 'mediaImageAlt'       // ← Alt text intégré dans le widget
        },
        mediaImageAlt: {
            type: 'text',
            label: 'editor_image_alt'
        }
    }
}
```

### 9.3. Helper partagé pour la structure media

Créer un helper dans `js/h5p/image-manager.js` ou dans un utilitaire partagé :

```javascript
/**
 * Construit la structure media H5P standard à partir d'une image.
 * Utilisé par MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords.
 */
export function buildMediaStructure(imageData, altText = '') {
    if (!imageData) return { disableImageZooming: false };

    return {
        type: {
            library: "H5P.Image 1.1",
            params: {
                file: {
                    path: imageData.path,
                    mime: imageData.mime || "image/jpeg",
                    width: imageData.width || 0,
                    height: imageData.height || 0
                },
                alt: altText,
                decorative: false
            },
            subContentId: generateUUID(),
            metadata: {
                contentType: "Image",
                license: "U",
                title: "Untitled Image"
            }
        },
        disableImageZooming: false
    };
}
```

### 9.4. Modification des processeurs (pattern commun)

Pour chaque processeur, remplacer :

```javascript
// AVANT
media: { disableImageZooming: false }

// APRÈS
media: buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt)
```

### 9.5. Liste des processeurs à modifier

| Processeur | Fichier | Ligne approximative du champ `media` |
|------------|---------|--------------------------------------|
| MultipleChoice | `js/h5p/processors/MultipleChoice.js` | Dans l'objet retourné |
| TrueFalse | `js/h5p/processors/TrueFalse.js` | `media: { disableImageZooming: false }` |
| Essay | `js/h5p/processors/Essay.js` | `media: { disableImageZooming: false }` |
| FillInTheBlanks | `js/h5p/processors/FillInTheBlanks.js` | Dans l'objet retourné |
| DragTheWords | `js/h5p/processors/DragTheWords.js` | `disableImageZooming: false` |
| MarkTheWords | `js/h5p/processors/MarkTheWords.js` | `disableImageZooming: false` |

### 9.6. Gestion QuizSet

Quand ces activités sont imbriquées dans un QuizSet, la structure `media` doit être préservée.
Vérifier que `transformForQuizSet()` ne supprime pas le champ `media` pour les processeurs qui l'implémentent.

### 9.7. Choix UX : section dédiée pliée par défaut

Chaque activité media dispose d'une **section dédiée** pour l'image (`startCollapsed: true`, icône `fa-image`), séparée de la section générale. Cela évite d'encombrer l'interface pour les utilisateurs qui n'ajoutent pas d'image. Le champ utilise `altTextField: 'mediaImageAlt'` pour intégrer le texte alternatif dans le widget image.

### 9.8. Checklist Phase 7

- [x] Créer `buildMediaStructure()` dans `image-manager.js`
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de MultipleChoice (content-detector.js) — section dédiée `startCollapsed: true`
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de TrueFalse
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de Essay
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de FillInTheBlanks
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de DragTheWords
- [x] Ajouter `mediaImage` et `mediaImageAlt` dans le schéma de MarkTheWords
- [x] Modifier le processeur `MultipleChoice.js` — utiliser `buildMediaStructure()`
- [x] Modifier le processeur `TrueFalse.js`
- [x] Modifier le processeur `Essay.js`
- [x] Modifier le processeur `FillInTheBlanks.js`
- [x] Modifier le processeur `DragTheWords.js`
- [x] Modifier le processeur `MarkTheWords.js`
- [x] Vérifier la compatibilité QuizSet (`transformForQuizSet()`) — Essay OK
- [ ] Tester chaque activité sans image → fonctionne comme avant
- [ ] Tester chaque activité avec image → packaging + affichage corrects

---

## 10. Phase 8 — CoursePresentation (priorité 3)

> **Fichiers** : `js/h5p/processors/CoursePresentation.js`, `js/editor/content-detector.js`
>
> Complexité élevée : les images sont des éléments H5P.Image dans les slides.

### 10.1. Concept

Chaque slide peut contenir un élément `H5P.Image 1.1` en plus des textes et exercices.
L'image est positionnée comme un élément standard du slide avec des coordonnées x/y/w/h.

### 10.2. Structure JSON H5P pour un élément image dans un slide

```json
{
  "action": {
    "library": "H5P.Image 1.1",
    "params": {
      "file": {
        "path": "images/image-slide01.jpg",
        "mime": "image/jpeg",
        "width": 800,
        "height": 600
      },
      "alt": "Description",
      "decorative": false
    },
    "subContentId": "uuid",
    "metadata": { "contentType": "Image", "license": "U", "title": "Untitled Image" }
  },
  "x": 5,
  "y": 5,
  "width": 45,
  "height": 80,
  "displayAsButton": false,
  "backgroundOpacity": 0
}
```

### 10.3. Schéma éditeur

Champ `slideImage` avec `selectField` intégré pour la position (dans le même collapsible) :

```javascript
// Dans le itemSchema des slides
slideImage: {
    type: 'image',
    label: 'editor_image_slide',
    hint: 'editor_image_slide_hint',
    collapsible: true,
    collapsibleLabel: 'editor_image_slide',
    altTextField: 'slideImageAlt',
    selectField: {
        name: 'slideImagePosition',
        label: 'editor_image_position',
        default: 'left',
        options: [
            { value: 'left', label: 'editor_image_position_left' },
            { value: 'right', label: 'editor_image_position_right' },
            { value: 'top', label: 'editor_image_position_top' },
            { value: 'bottom', label: 'editor_image_position_bottom' }
        ]
    }
}
```

Le `selectField` est un nouveau pattern ajouté à `renderImageFieldContent()` dans `field-renderers.js` : il injecte un `<select>` dans le même conteneur que l'image et le texte alternatif.

### 10.4. Processeur CoursePresentation

24 layout variants (6 types de slides × 4 positions) dans `SLIDE_LAYOUTS` :

| Type de slide | Positions disponibles |
|---------------|----------------------|
| `title` | `title:image-left`, `title:image-right`, `title:image-top`, `title:image-bottom` |
| `content` | `content:image-left`, `content:image-right`, `content:image-top`, `content:image-bottom` |
| `quiz` | `quiz:image-left`, `quiz:image-right`, `quiz:image-top`, `quiz:image-bottom` |
| `content-with-table` | `content-with-table:image-left`, etc. |
| `content-quiz` | `content-quiz:image-left`, etc. |
| `summary` | `summary:image-left`, etc. |

Lors de la construction des éléments d'un slide :

1. Lire `slide.slideImagePosition` (défaut `'left'`)
2. Construire la clé de layout `${slideType}:image-${position}`
3. Si le layout existe → l'utiliser ; sinon → fallback sur `image-left`
4. `buildImageElement()` crée un élément `H5P.Image 1.1` avec les coordonnées du layout
5. Si le type de slide n'a aucun variant image → fallback : image ajoutée en bas à droite (65%, 55%, 33×43)

### 10.5. Checklist Phase 8

- [x] Ajouter `slideImage` avec `collapsible`, `altTextField`, `selectField` dans le schéma CoursePresentation (content-detector.js)
- [x] Créer 24 templates de layout (6 types × 4 positions) dans `SLIDE_LAYOUTS`
- [x] Créer `buildImageElement()` dans le processeur CoursePresentation
- [x] Modifier `processSlide()` pour lire `slideImagePosition` et sélectionner le layout approprié
- [x] Ajouter `H5P.Image 1.1` dans les extraDependencies de CoursePresentation (processors/index.js)
- [x] Ajouter le support `selectField` dans `renderImageFieldContent()` (field-renderers.js)
- [x] Ajouter les clés de traduction position (fr, en, + 9 locales)
- [x] Fallback pour types de slides sans variant image → image en bas à droite
- [x] Test `test-editor-cp.js` : `slideImage` ajouté dans `expectedFields`
- [ ] Tester avec et sans image → pas de régression
- [ ] Tester dans Moodle/Lumi → image affichée dans le slide avec les 4 positions

---

## 11. Phase 9 — Crossword background (priorité 3)

> **Fichiers** : `js/h5p/processors/Crossword.js`, `js/editor/content-detector.js`

### 11.1. Structure attendue

```json
{
  "backgroundImage": {
    "path": "images/image-crossword-bg.jpg",
    "mime": "image/jpeg",
    "width": 800,
    "height": 600
  }
}
```

### 11.2. Checklist Phase 9

- [x] Ajouter `backgroundImage` (type `'image'`) dans le schéma Crossword (section dédiée `startCollapsed`)
- [x] Modifier le processeur `Crossword.js` pour transmettre `backgroundImage` → `theme.backgroundImage`
- [x] Ajouter traduction `editor_image_crossword_bg_hint` (fr, en)
- [ ] Tester sans image → fonctionne comme avant
- [ ] Tester avec image → visible dans le .h5p

---

## 12. Phase 10 — Timeline media (priorité 3)

> **Fichiers** : `js/h5p/processors/Timeline.js`, `js/editor/content-detector.js`, `js/editor/array-manager.js`, `js/editor/editor-core.js`, `js/editor/field-renderers.js`
>
> **Refonte complète** : remplacement du `backgroundImage` (inutile) par un toggle URL/Image pour la couverture et chaque événement.

### 12.1. Architecture toggle URL/Image

Timeline utilise `asset.media` comme URL texte (pas un objet image H5P). L'utilisateur choisit entre :
- **Mode URL** : saisir une URL externe (comportement historique)
- **Mode Image** : uploader un fichier image (nouveau)

Le toggle est un **contrôle segmenté** avec icônes (`fa-link` / `fa-image`), implémenté comme un nouveau type de champ `toggle`.

### 12.2. Schéma éditeur — Section générale (couverture)

```javascript
// fieldGroup collapsible dans la section general
_timelineMedia: {
    type: 'fieldGroup', collapsible: true, collapsibleLabel: 'editor_media_optional',
    fields: {
        'timeline.mediaType': {
            type: 'toggle', default: 'url',
            options: [
                { value: 'url', label: 'editor_url' },
                { value: 'image', label: 'editor_image' }
            ]
        },
        'timeline.asset.media': { type: 'text', label: 'editor_media_url',
            showWhen: { field: 'timeline.mediaType', value: 'url' } },
        'timeline.asset.caption': { type: 'text', label: 'editor_caption',
            showWhen: { field: 'timeline.mediaType', value: 'url' } },
        'timeline.asset.credit': { type: 'text', label: 'editor_credit',
            showWhen: { field: 'timeline.mediaType', value: 'url' } },
        'timeline.coverImage': {
            type: 'image', label: 'editor_image_timeline',
            hint: 'editor_image_timeline_hint',
            collapsible: false, altTextField: 'timeline.coverImageAlt',
            showWhen: { field: 'timeline.mediaType', value: 'image' }
        }
    }
}
```

### 12.3. Schéma éditeur — Événements

```javascript
// fieldGroup collapsible dans l'itemSchema de timeline.date
_media: {
    type: 'fieldGroup', collapsibleLabel: 'editor_media_optional',
    fields: {
        mediaType: {
            type: 'toggle', default: 'url',
            options: [
                { value: 'url', label: 'editor_url' },
                { value: 'image', label: 'editor_image' }
            ]
        },
        'asset.media': { type: 'text', label: 'editor_media_url',
            showWhen: { field: 'mediaType', value: 'url' } },
        'asset.caption': { type: 'text', label: 'editor_caption',
            showWhen: { field: 'mediaType', value: 'url' } },
        'asset.credit': { type: 'text', label: 'editor_credit',
            showWhen: { field: 'mediaType', value: 'url' } },
        eventImage: {
            type: 'image', label: 'editor_image_timeline',
            hint: 'editor_image_timeline_hint',
            collapsible: false, altTextField: 'eventImageAlt',
            showWhen: { field: 'mediaType', value: 'image' }
        }
    }
}
```

### 12.4. Nouveau type de champ : `toggle`

**Fichier** : `js/editor/field-renderers.js` — `renderToggleField()`

Contrôle segmenté avec icônes, produit un `<input type="hidden">` pour la compatibilité `showWhen` (les éléments conditionnels écoutent l'événement `change` du hidden input via `data-path`).

Zéro nouvelle clé de traduction : réutilise `editor_url`, `editor_image`.

### 12.5. Nouveau pattern : `fieldGroup` dans les items d'array

**Fichier** : `js/editor/array-manager.js`

Le `fieldGroup` est un wrapper purement visuel (collapsible) qui regroupe des sous-champs **sans namespacing** — les chemins restent au niveau de l'item (`asset.media`, pas `_media.asset.media`).

Support complet de `showWhen` dans le groupe : les sous-champs conditionnels sont rendus mais cachés (`display: none`), et basculés via listeners sur le champ de contrôle (toggle).

### 12.6. showWhen : bascule CSS au lieu de reconstruction DOM

Le `showWhen` dans `array-manager.js` et `editor-core.js` utilise désormais `display: none` / `display: ''` au lieu de reconstruire tout l'élément DOM. Cela élimine le flash CSS et améliore les performances.

Fallback sur `default` : quand la valeur du champ de contrôle est `undefined` (données existantes sans `mediaType`), le système utilise la valeur `default` de la config du champ.

### 12.7. Processeur Timeline

```javascript
// Couverture : coverImage.path → timeline.asset.media
if (timelineData.timeline.coverImage && timelineData.timeline.coverImage.path) {
    timelineData.timeline.asset.media = timelineData.timeline.coverImage.path;
    if (timelineData.timeline.coverImageAlt)
        timelineData.timeline.asset.caption = timelineData.timeline.asset.caption || timelineData.timeline.coverImageAlt;
}
delete timelineData.timeline.coverImage;
delete timelineData.timeline.coverImageAlt;
delete timelineData.timeline.mediaType;

// Événements : eventImage.path → event.asset.media
timelineData.timeline.date.forEach(d => {
    if (d.eventImage && d.eventImage.path) {
        d.asset.media = d.eventImage.path;
        if (d.eventImageAlt) d.asset.caption = d.asset.caption || d.eventImageAlt;
    }
    delete d.eventImage;
    delete d.eventImageAlt;
    delete d.mediaType;
});
```

### 12.8. Preview H5P — images string dans asset.media

`_embedImagesAsDataUrls()` dans `h5p-manager.js` étendu pour détecter les valeurs string correspondant à `images/...` (Timeline utilise `asset.media` comme string URL, pas un objet `{path}`).

### 12.9. Export document

`formatTimeline()` dans `document-formatter.js` vérifie `coverImage` et `eventImage` **en priorité** sur `asset.media` URL, car les données brutes de l'éditeur contiennent les champs editor avant passage dans le processeur.

### 12.10. Checklist Phase 10

- [x] Supprimer `backgroundImage` du schéma Timeline
- [x] Créer le type `toggle` dans `field-renderers.js` (`renderToggleField`)
- [x] Ajouter le `fieldGroup` `_timelineMedia` (section générale) avec toggle + showWhen
- [x] Ajouter le `fieldGroup` `_media` (événements) avec toggle + showWhen
- [x] Implémenter `fieldGroup` dans `array-manager.js` (collapsible, showWhen CSS)
- [x] Implémenter `showWhen` dans `editor-core.js` (sections + fieldGroups)
- [x] Modifier processeur `Timeline.js` : `coverImage` → `asset.media`, `eventImage` → `asset.media`
- [x] Étendre `_embedImagesAsDataUrls()` pour les string values `images/...`
- [x] Modifier `formatTimeline()` pour `coverImage` et `eventImage` dans l'export
- [x] Modifier `formatCoursePresentation()` pour `slideImage` dans l'export
- [x] CSS toggle (`.json-editor__toggle`, `.json-editor__toggle-option`)
- [x] CSS fieldGroup dans array items (`.json-editor__array-item-subsection`)
- [x] Fix `cleanDataBasedOnSchema` : clés pointées dans les `fieldGroup`
- [x] Zéro nouvelle clé de traduction (réutilisation `editor_url`, `editor_image`, `editor_media_optional`, etc.)
- [ ] Tester sans image → URLs externes préservées
- [ ] Tester avec image uploadée → image dans le .h5p + preview
- [ ] Tester l'export DOCX/ODT/PDF avec images Timeline
- [ ] Tester dans Moodle/Lumi

---

## 13. Phase 11 — Export document avec images

> **Fichiers** : `js/export/document-formatter.js`, `js/export/document-exporter.js`
>
> L'infrastructure image est **déjà en place** (prepareImages, fetchImageAsDataURL, calculateDimensions).
> Il faut seulement alimenter le pipeline existant avec les images utilisateur.

### 13.1. Contraintes de taille par format (existantes)

| Format | Hauteur fixe | Largeur max | Source |
|--------|-------------|-------------|--------|
| DOCX | 150 mm | 160 mm | `image-utils.js:DOCX_FIXED_HEIGHT`, `MAX_WIDTH_DOCX` |
| PDF | 80 mm | 170 mm | `image-utils.js:PDF_FIXED_HEIGHT`, `MAX_WIDTH_PDF` |
| ODT | 100 mm | 165 mm | `image-utils.js:ODT_FIXED_HEIGHT`, `MAX_WIDTH_ODT` |

Le ratio d'aspect est toujours préservé. Si la largeur calculée dépasse le max, elle est recalculée.

### 13.2. Modification de document-formatter.js

Pour chaque activité ayant des images, ajouter des sections `type: 'image'` dans le contenu formaté :

#### Flashcards

```javascript
// Pour chaque carte avec image :
if (card.image && card.image.dataURL) {
    sections.push({
        type: 'image',
        url: card.image.dataURL,
        alt: card.imageAltText || '',
        caption: ''
    });
}
```

#### Activités media (MultipleChoice, TrueFalse, etc.)

```javascript
// Si l'activité a une image media :
if (data.mediaImage && data.mediaImage.dataURL) {
    sections.push({
        type: 'image',
        url: data.mediaImage.dataURL,
        alt: data.mediaImageAlt || '',
        caption: ''
    });
}
```

#### DragAndDrop (image de fond)

```javascript
// Image de fond comme contexte visuel :
if (data.backgroundImage && data.backgroundImage.dataURL) {
    sections.push({
        type: 'image',
        url: data.backgroundImage.dataURL,
        alt: 'Arrière-plan de l\'activité',
        caption: t('doc_fmt_background_image') || 'Image d\'arrière-plan'
    });
}
```

### 13.3. Gestion des data:URL vs URL externes

Le pipeline `prepareImages()` gère déjà les deux cas :
- `data:URL` → conversion directe en blob + calcul des dimensions
- URL externe → `fetchImageAsDataURL()` avec timeout et gestion d'erreurs

Les images utilisateur seront toujours des `data:URL` (issues du registre `image-manager.js`).

### 13.4. Flashcards en mode impression (tableau 2×4)

Les flashcards ont un mode d'impression spécial (tableau recto-verso). Si une carte a une image :
- L'image est redimensionnée pour tenir dans la cellule du tableau (92×55 mm)
- Elle est centrée verticalement dans la cellule
- Le texte est affiché en dessous de l'image (si les deux sont présents)

### 13.5. Checklist Phase 11

- [x] Modifier `document-formatter.js` — Flashcards : ajouter `imageUrl` par carte (recto + verso)
- [x] Modifier `document-formatter.js` — DialogCards : ajouter `imageUrl` par carte (recto + verso)
- [x] ~~Modifier `document-formatter.js` — DragAndDrop : image de fond~~ — **Intentionnellement exclu** : l'image d'arrière-plan n'a pas de valeur pédagogique sur papier
- [x] Modifier `document-formatter.js` — MultipleChoice : ajouter section image media (après question, avant réponses)
- [x] Modifier `document-formatter.js` — TrueFalse : ajouter section image media (après question, avant propositions)
- [x] Modifier `document-formatter.js` — Essay : ajouter section image media (après énoncé, avant espace réponse)
- [x] Modifier `document-formatter.js` — FillInTheBlanks : ajouter section image media (après énoncé, avant texte à trous)
- [x] Modifier `document-formatter.js` — DragTheWords : ajouter section image media (après énoncé, avant texte)
- [x] Modifier `document-formatter.js` — MarkTheWords : ajouter section image media (après énoncé, avant texte)
- [x] Refactoriser `prepareImages()` — gère data:URL, chemins relatifs (registre image-manager), et URLs HTTP
- [x] Créer `prepareImageData()` — fonction utilitaire avec 3 cas de résolution d'image
- [x] Créer `blobToDataURL()` — conversion Blob → data URL via FileReader
- [x] Modifier `createDOCXFlashcardCell()` — `ImageRun` centré avec dimensions contraintes (75×25 mm max)
- [x] Modifier `addPDFFlashcardTable()` `didDrawCell` — `doc.addImage()` centré + décalage texte sous zone fixe
- [x] Modifier `createODTFlashcardDocument()` — manifest dynamique, namespaces draw/svg/xlink
- [x] Modifier `generateODTFlashcardTable()` — passage ZIP/compteur, `<draw:frame>` avec dimensions contraintes
- [x] Modifier `formatODTCellContent()` — retourne `{xml, imageCounter, manifestEntries}` pour images
- [x] Ajouter `FLASHCARD_CONFIG.imageMaxWidth/Height` (75mm/25mm) et équivalents twips
- [x] Tester export DOCX avec images → images visibles, taille contrainte ✅
- [x] Tester export PDF avec images → images visibles, pas de débordement ✅
- [x] Tester export ODT avec images → images intégrées dans le ZIP ODT ✅
- [x] Tester export sans images → fonctionne comme avant (aucune régression) ✅
- [x] Tester le mode impression Flashcards avec images → images dans les cellules du tableau ✅

---

## 14. Phase 12 — Traductions (11 langues)

> **Fichiers** : `js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json`
>
> Convention : `{scope}_{element}_{detail}` — toutes les clés sont en snake_case.

### 14.1. Nouvelles clés de traduction

Toutes les clés listées ci-dessous doivent être ajoutées aux **11 fichiers de locale**.

#### Clés du widget image (éditeur)

| Clé | FR | EN |
|-----|----|----|
| `editor_image` | Image | Image |
| `editor_image_drop_text` | Glissez une image ici ou cliquez pour parcourir | Drop an image here or click to browse |
| `editor_image_hint` | JPEG, PNG, WebP — max 5 Mo | JPEG, PNG, WebP — max 5 MB |
| `editor_image_alt` | Texte alternatif | Alternative text |
| `editor_image_alt_placeholder` | Décrivez l'image pour l'accessibilité | Describe the image for accessibility |
| `editor_image_remove` | Supprimer l'image | Remove image |
| `editor_image_remove_confirm` | Voulez-vous vraiment supprimer cette image ? | Are you sure you want to remove this image? |
| `editor_image_error_format` | Format de fichier non supporté. Utilisez JPEG, PNG ou WebP. | Unsupported file format. Use JPEG, PNG or WebP. |
| `editor_image_error_size` | L'image est trop volumineuse (max 5 Mo). | Image is too large (max 5 MB). |
| `editor_image_error_processing` | Erreur lors du traitement de l'image. | Error processing the image. |
| `editor_image_dimensions` | {width} × {height} px | {width} × {height} px |
| `editor_image_file_size` | {size} Ko | {size} KB |
| `editor_image_uploaded` | Image ajoutée avec succès | Image added successfully |

#### Clés spécifiques par activité

| Clé | FR | EN |
|-----|----|----|
| `editor_image_card_hint` | Image optionnelle affichée sur la carte | Optional image displayed on the card |
| `editor_image_background` | Image d'arrière-plan | Background image |
| `editor_image_background_hint` | Image de fond du canvas de glisser-déposer | Background image for the drag and drop canvas |
| `editor_image_context` | Image de contexte | Context image |
| `editor_image_context_hint` | Image optionnelle affichée au-dessus de la question | Optional image displayed above the question |
| `editor_image_slide` | Image du slide | Slide image |
| `editor_image_slide_hint` | Image optionnelle pour cette diapositive | Optional image for this slide |
| `editor_image_timeline` | Image de l'événement | Event image |
| `editor_image_timeline_hint` | Image illustrant cet événement | Image illustrating this event |

#### Clés d'export document

| Clé | FR | EN |
|-----|----|----|
| `doc_fmt_background_image` | Image d'arrière-plan | Background image |
| `doc_fmt_context_image` | Image de contexte | Context image |
| `doc_fmt_card_image` | Image de la carte | Card image |

### 14.2. Workflow d'ajout

1. Ajouter les clés FR dans `js/locales/fr.json`
2. Ajouter les traductions EN dans `js/locales/en.json`
3. Traduire pour les 9 autres langues (es, de, it, nl, pt, ar, zh, jp, el)
4. Vérifier avec `node scripts/verify-all-locales.mjs` (ajouter les nouvelles clés aux vérifications si nécessaire)

### 14.3. Checklist Phase 12

- [x] Ajouter les 13 clés `editor_image_*` dans `fr.json`
- [x] Ajouter les clés `editor_image_{card_hint,background,background_hint,context,context_hint,slide,slide_hint,timeline,timeline_hint}` dans `fr.json`
- [x] Ajouter les 3 clés `doc_fmt_*` dans `fr.json`
- [x] Traduire toutes les clés en anglais (`en.json`)
- [x] Traduire toutes les clés en espagnol (`es.json`)
- [x] Traduire toutes les clés en allemand (`de.json`)
- [x] Traduire toutes les clés en italien (`it.json`)
- [x] Traduire toutes les clés en néerlandais (`nl.json`)
- [x] Traduire toutes les clés en portugais (`pt.json`)
- [x] Traduire toutes les clés en arabe (`ar.json`)
- [x] Traduire toutes les clés en chinois (`zh.json`)
- [x] Traduire toutes les clés en japonais (`jp.json`)
- [x] Traduire toutes les clés en grec (`el.json`)
- [x] Vérifier que `t('editor_image_drop_text')` retourne bien la traduction dans l'éditeur

---

## 15. Phase 13 — CSS et z-index

> **Fichier** : `css/components/json-editor.css`

### 15.1. Carte des z-index existants (référence)

```
Variable CSS            Valeur    Usage
──────────────────────────────────────────────────
--z-banner              900       Bannière d'urgence
--z-dropdown            1000      Dropdowns (langue, notifications)
--z-toast               1050      Toasts
--z-header              1100      Barre d'en-tête
--z-sidebar-overlay     2000      Overlay du sidebar
--z-sidebar             2050      Sidebar (modale de génération)
--z-modal               3000      Modales principales
--z-modal-confirm       4000      Modales de confirmation
--z-fullscreen          5000      H5P plein écran
--z-popover             6000      Popovers contextuels
```

### 15.2. Z-index du widget image

Le widget image vit **à l'intérieur de la modale d'édition** (z-index 3000).
Il n'a pas besoin d'un z-index élevé sauf pour deux cas :

1. **État dragover** : la zone de drop doit être visuellement au-dessus des autres champs
   → `z-index: 2` (local, dans le contexte du formulaire)

2. **Confirmation de suppression** : utilise la modale de confirmation existante
   → `z-index: var(--z-modal-confirm)` = 4000 (déjà géré par `showConfirm()`)

**Pas de nouveau z-index global nécessaire.** Le widget n'a pas de popup, overlay ou picker flottant.

### 15.3. Styles CSS à ajouter

```css
/* ===================================================================
   CHAMP IMAGE — Widget d'upload et prévisualisation
   =================================================================== */

/* Zone de dépôt */
.json-editor__image-dropzone {
    position: relative;
    border: 2px dashed var(--border-color, #ccc);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    background: var(--bg-secondary, #fafafa);
}

.json-editor__image-dropzone:hover {
    border-color: var(--primary-color, #007AFF);
    background: var(--bg-hover, #f0f7ff);
}

/* État dragover — feedback visuel */
.json-editor__image-dropzone--dragover {
    border-color: var(--primary-color, #007AFF);
    background: var(--bg-hover, #f0f7ff);
    z-index: 2; /* Au-dessus des champs voisins pendant le drag */
}

.json-editor__image-dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none; /* Laisser les événements passer au parent */
}

.json-editor__image-dropzone-content i {
    font-size: 2rem;
    color: var(--text-secondary, #999);
}

.json-editor__image-dropzone-content p {
    margin: 0;
    color: var(--text-primary, #333);
    font-size: 0.95rem;
}

.json-editor__image-hint {
    font-size: 0.8rem;
    color: var(--text-secondary, #999);
}

/* Input file caché */
.json-editor__image-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}

/* Prévisualisation */
.json-editor__image-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.json-editor__image-preview-container {
    position: relative;
    display: inline-block;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-color, #ddd);
    max-width: 100%;
}

.json-editor__image-preview-img {
    display: block;
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    background: var(--bg-secondary, #f5f5f5);
}

/* Bouton supprimer (coin supérieur droit de l'image) */
.json-editor__image-remove-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(220, 53, 69, 0.9);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    transition: background 0.2s, transform 0.15s;
    opacity: 0;
    transform: scale(0.8);
}

.json-editor__image-preview-container:hover .json-editor__image-remove-btn {
    opacity: 1;
    transform: scale(1);
}

.json-editor__image-remove-btn:hover {
    background: rgba(220, 53, 69, 1);
    transform: scale(1.1);
}

/* Informations sous l'image */
.json-editor__image-info {
    display: flex;
    gap: 12px;
    font-size: 0.8rem;
    color: var(--text-secondary, #999);
}

/* Champ texte alternatif */
.json-editor__image-alt {
    margin-top: 4px;
}

.json-editor__image-alt-input {
    width: 100%;
    font-size: 0.85rem;
}

/* Responsive — réduire la zone de drop sur mobile */
@media (max-width: 600px) {
    .json-editor__image-dropzone {
        padding: 16px;
    }

    .json-editor__image-dropzone-content i {
        font-size: 1.5rem;
    }

    .json-editor__image-preview-img {
        max-height: 150px;
    }
}
```

### 15.4. Checklist Phase 13

- [x] Ajouter tous les styles CSS dans `css/components/json-editor.css`
- [x] Vérifier que le z-index de `.json-editor__image-dropzone--dragover` (2) ne crée pas de conflit
- [x] Vérifier le rendu dans le contexte de la modale d'édition (z-index 3000)
- [x] Vérifier le rendu dans un item d'array (Flashcards, DialogCards) — pas de débordement
- [ ] Tester le responsive (mobile < 600px)
- [ ] Tester le dark mode si applicable
- [ ] Vérifier l'accessibilité : contraste, focus visible, labels ARIA

---

## 16. Phase 14 — Tests et validation

### 16.1. Tests manuels par activité

| Test | Activité | Action | Résultat attendu |
|------|----------|--------|------------------|
| T01 | Flashcards | Générer sans image | Fonctionne comme avant |
| T02 | Flashcards | Ajouter image via éditeur | Prévisualisation visible, `onChange` appelé |
| T03 | Flashcards | Supprimer image | Zone de drop réapparaît, valeur null |
| T04 | Flashcards | Télécharger .h5p avec image | ZIP contient `content/images/*.jpg` |
| T05 | Flashcards | Importer .h5p dans Moodle | Image visible sur la carte |
| T06 | Flashcards | Export DOCX avec image | Image dans le document, taille contrainte |
| T07 | Flashcards | Export PDF avec image | Image dans le PDF, pas de débordement |
| T08 | DragAndDrop | Ajouter image de fond | Canvas adapte ses dimensions |
| T09 | DragAndDrop | .h5p avec background | Image de fond visible dans l'activité |
| T10 | DialogCards | Image par carte | Même comportement que Flashcards |
| T11 | MultipleChoice | Image media contexte | Image au-dessus de la question |
| T12 | TrueFalse | Image media contexte | Image au-dessus de la question |
| T13 | Essay | Image media contexte | Image au-dessus de la question |
| T14 | Toutes | Image > 5 Mo | Message d'erreur i18n affiché |
| T15 | Toutes | Image format .bmp | Message d'erreur format non supporté |
| T16 | Toutes | Image WebP | Conversion en JPEG transparente |
| T17 | Toutes | Drag & drop image | Même résultat que clic sur "Parcourir" |
| T18 | Toutes | Texte alternatif | Valeur sauvegardée dans le JSON |

### 16.2. Tests de non-régression

| Test | Action | Résultat attendu |
|------|--------|------------------|
| NR01 | Générer chaque activité sans toucher aux images | Résultat identique à avant |
| NR02 | Éditeur JSON sur activité existante | Pas de champ image parasite |
| NR03 | Export DOCX/PDF/ODT sans images | Identique à avant |
| NR04 | QuizSet avec sous-questions | Pas de régression |
| NR05 | CoursePresentation avec exercices | Pas de régression |

### 16.3. Tests de performance

| Test | Critère |
|------|---------|
| P01 | Upload image 5 Mo → processImage() < 2 secondes |
| P02 | Packaging .h5p avec 10 images → < 5 secondes |
| P03 | Mémoire : clearAllImages() libère toutes les URLs |

### 16.4. Tests automatisés (`tests/test-images.js`)

Suite de tests automatisés couvrant 7 étapes avec des images réelles (`logo_caramel.png` et `logo_caramel_2.webp`) :

| Étape | Nom | Couverture |
|-------|-----|------------|
| 1 | Traitement images | `processImage()` PNG/WebP→JPEG, redimensionnement, rejet taille/format |
| 2 | Registre image-manager | register/unregister/re-register/getAllImages/clearAllImages |
| 3 | buildMediaStructure | Structure media H5P avec/sans image, avec/sans alt text |
| 4 | Processeurs H5P + images | 9 activités : Flashcards, DialogCards, DragAndDrop, 6 media |
| 5 | Packaging H5P + ZIP | Image binaire dans ZIP, content.json, dépendance H5P.Image |
| 6 | Export document + images | Sections `type: 'image'` pour 6 media + Timeline (event+cover+URL) + CP (slide) + DialogCards + Flashcards, exclusion DragAndDrop/Crossword bg |
| 7 | Cycle complet | Ajout→retrait→re-ajout, vérification ZIP à chaque phase |

Lancer via : `http://localhost:8000/tests/test-images.html`

Intégré dans `test-all.html` (suite "Images H5P").

### 16.5. Checklist Phase 14

- [ ] Exécuter tous les tests T01 à T18
- [ ] Exécuter tous les tests NR01 à NR05
- [ ] Exécuter les tests P01 à P03
- [x] Créer `tests/test-images.js` — suite automatisée (7 étapes, ~190 assertions)
- [x] Créer `tests/test-images.html` — dashboard avec filtres, perfs, prompt IA
- [x] Intégrer dans `tests/test-all.html`
- [ ] Vérifier l'accessibilité du widget image (lecteur d'écran)
- [ ] Vérifier le fonctionnement sur Safari/iPad (Blob + download)

---

## 17. Checklist de validation finale

### Infrastructure

- [x] `js/h5p/image-manager.js` créé et fonctionnel
- [x] `createH5PBlob()` accepte et injecte des images binaires
- [x] `H5P.Image 1.1` ajouté automatiquement aux dépendances si images présentes
- [x] Nettoyage mémoire (`clearAllImages()`) après chaque packaging
- [x] **Patch h5p-standalone** : `frame.bundle.js` patché pour `data:` URLs
- [x] **Preview images** : `_embedImagesAsDataUrls()` dans intercepteur fetch
- [x] **Régénération H5P** : `notifications.js` injecte les images lors de la régénération

### Éditeur visuel

- [x] `renderImageField()` dans `field-renderers.js` — fonctionnel
- [x] Drag & drop d'image — fonctionne
- [x] Prévisualisation miniature — affichée
- [x] Bouton supprimer — fonctionnel (avec apparition au hover)
- [x] Champ texte alternatif — sauvegardé
- [x] Messages d'erreur i18n — affichés
- [x] Mode `collapsible: true` — pour Flashcards/DialogCards (pliable, auto-ouvre si image présente)
- [x] Option `altTextField` — texte alternatif intégré dans le widget image (pas de champ séparé)

### Activités priorité 1

- [x] Flashcards : image par carte — fonctionnel (preview + export + packaging) — collapsible
- [x] DragAndDrop : image d'arrière-plan — fonctionnel — section dédiée pliée par défaut

### Activités priorité 2

- [x] DialogCards : image par carte — fonctionnel — collapsible avec altTextField
- [x] MultipleChoice : image media — fonctionnel — section dédiée pliée par défaut
- [x] TrueFalse : image media — fonctionnel
- [x] Essay : image media — fonctionnel (+ QuizSet compatible)
- [x] FillInTheBlanks : image media — fonctionnel
- [x] DragTheWords : image media — fonctionnel
- [x] MarkTheWords : image media — fonctionnel

### Activités priorité 3

- [x] CoursePresentation : image par slide — fonctionnel — collapsible avec altTextField + selectField (position left/right/top/bottom), 24 layouts
- [x] Crossword : image d'arrière-plan — fonctionnel — section dédiée pliée par défaut, `theme.backgroundImage`
- [x] Timeline : toggle URL/Image — fonctionnel — `coverImage` (couverture) + `eventImage` (par événement) dans des `fieldGroup` collapsibles, processeur convertit en `asset.media`

### Export document

- [x] DOCX avec images Flashcards — taille contrainte (75×25 mm dans cellule)
- [x] PDF avec images Flashcards — taille contrainte, zone fixe pour recto/verso
- [x] ODT avec images Flashcards — images intégrées dans le ZIP, manifest dynamique
- [x] Export sans images — aucune régression
- [x] Résolution chemins relatifs depuis image-manager (`prepareImageData()`)
- [x] 6 activités media : image insérée après l'énoncé, avant les questions/réponses
- [x] DragAndDrop background : intentionnellement exclu (pas de valeur pédagogique sur papier)
- [x] Crossword background : intentionnellement exclu (pas de valeur pédagogique sur papier)
- [x] Timeline : `coverImage` + `eventImage` prioritaires sur URLs `asset.media` dans `formatTimeline()`
- [x] CoursePresentation : `slideImage` dans `formatCoursePresentation()`
- [x] DialogCards : `imageUrl` par carte dans `formatDialogCards()`
- [x] Helper `getMediaImageUrl()` dans `document-formatter.js`

### Traductions

- [x] 30+ clés ajoutées dans les 11 fichiers de locale (widget, activités, positions, export)
- [x] Toutes les clés traduites (pas de fallback sur la clé brute)

### CSS

- [x] Styles du widget image ajoutés dans `json-editor.css`
- [x] Aucun conflit de z-index
- [ ] Responsive mobile < 600px

### Tests automatisés

- [x] `tests/test-images.js` — 7 étapes, ~190 assertions
- [x] `tests/test-images.html` — dashboard interactif
- [x] Intégré dans `tests/test-all.html`

---

## Annexe A — Structures JSON H5P de référence

### A.1. Champ image simple (Flashcards, DialogCards)

```json
{
  "image": {
    "path": "images/image-a1b2c3d4.jpg",
    "mime": "image/jpeg",
    "width": 800,
    "height": 600
  },
  "imageAltText": "Description de l'image"
}
```

Source : `H5P.Flashcards-1.7/semantics.json`, `H5P.Dialogcards-1.9/semantics.json`

### A.2. Background image (DragAndDrop)

```json
{
  "question": {
    "settings": {
      "background": {
        "path": "images/image-bg.jpg",
        "mime": "image/jpeg",
        "width": 800,
        "height": 600
      },
      "size": { "width": 800, "height": 600 }
    }
  }
}
```

Source : `H5P.DragQuestion-1.14/semantics.json`

### A.3. Media group (MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords)

```json
{
  "media": {
    "type": {
      "library": "H5P.Image 1.1",
      "params": {
        "file": {
          "path": "images/image-media.jpg",
          "mime": "image/jpeg",
          "width": 600,
          "height": 400
        },
        "alt": "Description",
        "decorative": false
      },
      "subContentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "metadata": {
        "contentType": "Image",
        "license": "U",
        "title": "Untitled Image"
      }
    },
    "disableImageZooming": false
  }
}
```

Source : `H5P.TrueFalse-1.6/semantics.json`, `H5P.MultiChoice-1.16/semantics.json`, `H5P.Essay-1.5/semantics.json`

### A.4. Élément image dans CoursePresentation

```json
{
  "action": {
    "library": "H5P.Image 1.1",
    "params": {
      "file": {
        "path": "images/image-slide.jpg",
        "mime": "image/jpeg",
        "width": 800,
        "height": 600
      },
      "alt": "Description",
      "decorative": false
    },
    "subContentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "metadata": {
      "contentType": "Image",
      "license": "U",
      "title": "Untitled Image"
    }
  },
  "x": 5, "y": 5, "width": 45, "height": 80,
  "displayAsButton": false,
  "backgroundOpacity": 0
}
```

### A.5. Timeline — asset.media (URL texte, pas objet image)

```json
{
  "timeline": {
    "headline": "Titre de la frise",
    "text": "Description",
    "asset": {
      "media": "images/image-cover.jpg",
      "caption": "Légende de l'image de couverture",
      "credit": "Crédit photo"
    },
    "date": [
      {
        "startDate": "1789,7,14",
        "headline": "Prise de la Bastille",
        "text": "...",
        "asset": {
          "media": "images/image-event01.jpg",
          "caption": "Prise de la Bastille",
          "credit": "Wikimedia Commons"
        }
      }
    ]
  }
}
```

**Particularité** : `asset.media` est une URL texte (pas un objet `{path, mime, width, height}`).
Le processeur convertit `coverImage.path` → `timeline.asset.media` et `eventImage.path` → `event.asset.media`.

Source : `H5P.Timeline-1.1` (structure propriétaire, pas de semantics.json standard)

---

## Annexe B — Clés de traduction complètes

### B.1. Clés widget image

| Clé | FR | EN | ES | DE |
|-----|----|----|----|----|
| `editor_image` | Image | Image | Imagen | Bild |
| `editor_image_drop_text` | Glissez une image ici ou cliquez pour parcourir | Drop an image here or click to browse | Arrastre una imagen aquí o haga clic para buscar | Bild hierher ziehen oder klicken zum Durchsuchen |
| `editor_image_hint` | JPEG, PNG, WebP — max 5 Mo | JPEG, PNG, WebP — max 5 MB | JPEG, PNG, WebP — máx. 5 MB | JPEG, PNG, WebP — max. 5 MB |
| `editor_image_alt` | Texte alternatif | Alternative text | Texto alternativo | Alternativtext |
| `editor_image_alt_placeholder` | Décrivez l'image pour l'accessibilité | Describe the image for accessibility | Describa la imagen para accesibilidad | Beschreiben Sie das Bild für Barrierefreiheit |
| `editor_image_remove` | Supprimer l'image | Remove image | Eliminar imagen | Bild entfernen |
| `editor_image_remove_confirm` | Voulez-vous vraiment supprimer cette image ? | Are you sure you want to remove this image? | ¿Está seguro de que desea eliminar esta imagen? | Möchten Sie dieses Bild wirklich entfernen? |
| `editor_image_error_format` | Format de fichier non supporté. Utilisez JPEG, PNG ou WebP. | Unsupported file format. Use JPEG, PNG or WebP. | Formato de archivo no compatible. Use JPEG, PNG o WebP. | Nicht unterstütztes Dateiformat. Verwenden Sie JPEG, PNG oder WebP. |
| `editor_image_error_size` | L'image est trop volumineuse (max 5 Mo). | Image is too large (max 5 MB). | La imagen es demasiado grande (máx. 5 MB). | Das Bild ist zu groß (max. 5 MB). |
| `editor_image_error_processing` | Erreur lors du traitement de l'image. | Error processing the image. | Error al procesar la imagen. | Fehler bei der Bildverarbeitung. |
| `editor_image_uploaded` | Image ajoutée avec succès | Image added successfully | Imagen añadida con éxito | Bild erfolgreich hinzugefügt |

### B.2. Clés spécifiques activités

| Clé | FR | EN |
|-----|----|----|
| `editor_image_card_hint` | Image optionnelle affichée sur la carte | Optional image displayed on the card |
| `editor_image_background` | Image d'arrière-plan | Background image |
| `editor_image_background_hint` | Image de fond du canvas de glisser-déposer | Background image for the drag and drop canvas |
| `editor_image_context` | Image de contexte | Context image |
| `editor_image_context_hint` | Image optionnelle affichée au-dessus de la question | Optional image displayed above the question |
| `editor_image_slide` | Image du slide | Slide image |
| `editor_image_slide_hint` | Image optionnelle pour cette diapositive | Optional image for this slide |
| `editor_image_timeline` | Image de l'événement | Event image |
| `editor_image_timeline_hint` | Image illustrant cet événement | Image illustrating this event |
| `editor_image_element_hint` | Image optionnelle pour cette étiquette | Optional image for this label |
| `editor_image_crossword_bg_hint` | Image de fond optionnelle pour la grille | Optional background image for the grid |
| `editor_image_position` | Position de l'image | Image position |
| `editor_image_position_left` | À gauche | Left |
| `editor_image_position_right` | À droite | Right |
| `editor_image_position_top` | En haut | Top |
| `editor_image_position_bottom` | En bas | Bottom |

### B.3. Clés réutilisées pour le toggle Timeline (pas de nouvelles clés)

| Clé | FR | EN | Usage |
|-----|----|----|-------|
| `editor_url` | URL | URL | Option toggle "URL externe" |
| `editor_image` | Image | Image | Option toggle "Image uploadée" |
| `editor_media_optional` | Média (facultatif) | Media (optional) | Label fieldGroup collapsible |
| `editor_media_url` | URL du média | Media URL | Champ URL dans mode URL |
| `editor_caption` | Légende | Caption | Légende du média |
| `editor_credit` | Crédit | Credit | Crédit du média |

### B.4. Clés export document

| Clé | FR | EN |
|-----|----|----|
| `doc_fmt_background_image` | Image d'arrière-plan | Background image |
| `doc_fmt_context_image` | Image de contexte | Context image |
| `doc_fmt_card_image` | Image de la carte | Card image |

---

## Annexe C — Carte des z-index

```
Valeur    Variable CSS            Usage
──────────────────────────────────────────────────────────
900       --z-banner              Bannière d'urgence (sticky)
1000      --z-dropdown            Dropdowns (langue, notifs, export)
1050      --z-toast               Toasts (coin supérieur droit)
1100      --z-header              Barre d'en-tête (sticky)
2000      --z-sidebar-overlay     Overlay du sidebar
2050      --z-sidebar             Sidebar / modale de génération
3000      --z-modal               Modales principales (résultat, preview)
4000      --z-modal-confirm       Confirmation suppression image ← UTILISÉ
5000      --z-fullscreen          H5P plein écran
6000      --z-popover             Popovers contextuels (sélecteur modèle IA)

LOCAL (dans le formulaire éditeur) :
2         --                      Zone de drop en état dragover
```

**Le widget image ne nécessite aucune nouvelle variable z-index globale.**
La confirmation de suppression réutilise `showConfirm()` existant (z-index 4000).

---

## Annexe D — Fichiers modifiés (récapitulatif)

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `js/h5p/image-manager.js` | Module central de gestion des images |
| `tests/test-images.js` | Tests automatisés images H5P (7 étapes, ~190 assertions) |
| `tests/test-images.html` | Dashboard HTML des tests images |

### Fichiers modifiés — déjà implémentés ✅

| Fichier | Modifications | Statut |
|---------|---------------|--------|
| `js/vendor/h5p-standalone/3.8.2/frame.bundle.js` | **PATCHÉ** — `H5P.getPath()` reconnaît `data:` URLs comme absolues | ✅ |
| `js/h5p/h5p-manager.js` | `_embedImagesAsDataUrls()`, intercepteur fetch modifié pour `content.json`, suppression `_fixIframeImages` | ✅ |
| `js/h5p/h5p-creator.js` | `createH5PBlob()` accepte `options.imageFiles`, injection binaire dans le ZIP, dépendance `H5P.Image 1.1` auto | ✅ |
| `js/h5p/processors/Flashcards.js` | Passage de `card.image` (avec `copyright`) et `card.imageAltText` | ✅ |
| `js/editor/field-renderers.js` | Renderer `renderImageField()` avec drag & drop, prévisualisation, suppression + mode `collapsible` + `altTextField` intégré | ✅ |
| `js/ui/notifications.js` | `regenerateH5PFile()` injecte les images du registre dans le ZIP régénéré | ✅ |
| `js/export/document-exporter.js` | `prepareImageData()` avec 3 cas (data URL, chemin relatif, HTTP), `blobToDataURL()`, images dans cellules DOCX/PDF/ODT, `FLASHCARD_CONFIG.imageMax*` | ✅ |
| `js/export/document-formatter.js` | `formatFlashcards()` et `formatDialogCards()` ajoutent `imageUrl` par carte + `getMediaImageUrl()` + images media dans 6 activités | ✅ |
| `js/editor/content-detector.js` | Champs image dans tous les schémas : Flashcards, DialogCards (collapsible), DragAndDrop (section + éléments), 6 activités media, CoursePresentation (slideImage + selectField), Crossword (backgroundImage), Timeline (backgroundImage) | ✅ |
| `js/h5p/image-manager.js` | `buildMediaStructure()` — helper pour la structure media H5P | ✅ |
| `js/h5p/processors/DragAndDrop.js` | Injection `background` dans `question.settings` + éléments `H5P.Image 1.1` pour étiquettes avec image | ✅ |
| `js/h5p/processors/DialogCards.js` | Passage de `dialog.image` et `dialog.imageAltText` | ✅ |
| `js/h5p/processors/MultipleChoice.js` | `media` → `buildMediaStructure()` | ✅ |
| `js/h5p/processors/TrueFalse.js` | `media` → `buildMediaStructure()` | ✅ |
| `js/h5p/processors/Essay.js` | `media` → `buildMediaStructure()` + `transformForQuizSet` compatible | ✅ |
| `js/h5p/processors/FillInTheBlanks.js` | `media` → `buildMediaStructure()` | ✅ |
| `js/h5p/processors/DragTheWords.js` | `media` → `buildMediaStructure()` | ✅ |
| `js/h5p/processors/MarkTheWords.js` | `media` → `buildMediaStructure()` | ✅ |
| `css/components/json-editor.css` | Styles du widget image, `display: none` sur input file | ✅ |
| `CLAUDE.md` | Documentation du patch h5p-standalone | ✅ |
| `tests/test-all.html` | Ajout de la suite "Images H5P" dans l'agrégateur | ✅ |
| `js/h5p/processors/CoursePresentation.js` | 24 layouts image (6 types × 4 positions), `buildImageElement()`, fallback | ✅ |
| `js/h5p/processors/Crossword.js` | Passage de `backgroundImage` → `theme.backgroundImage` | ✅ |
| `js/h5p/processors/Timeline.js` | Toggle URL/Image : `coverImage` → `asset.media`, `eventImage` → `asset.media`, nettoyage champs éditeur | ✅ |
| `js/h5p/processors/index.js` | `H5P.Image 1.1` dans extraDependencies de DragAndDrop et CoursePresentation | ✅ |
| `js/editor/field-renderers.js` | Support `selectField` dans `renderImageFieldContent()` + nouveau renderer `renderToggleField()` (contrôle segmenté) | ✅ |
| `js/editor/editor-core.js` | `showWhen` dans sections et `fieldGroup`, `setupSectionShowWhenListeners()` (bascule CSS sans reconstruction DOM) | ✅ |
| `js/editor/array-manager.js` | `fieldGroup` dans items d'array (collapsible, showWhen CSS), fallback `default` pour valeurs `undefined` | ✅ |
| `js/locales/*.json` (×11) | +30 clés de traduction (widget, activités, positions, export) | ✅ |
| `tests/test-editor-cp.js` | `slideImage` ajouté dans `expectedFields` des 6 types de slides | ✅ |
| `tests/test-images.js` | Tests processeurs (4c2-4c10), packaging (5e-5g), exports document (6i-6o incl. Flashcards) | ✅ |

**Total : 3 nouveaux fichiers, 33 fichiers modifiés — toutes les phases implémentées**
