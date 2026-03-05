# Guide developpeur -- Editeur JSON visuel

## Vue d'ensemble

L'editeur JSON visuel a ete introduit en **v5.0.0**. Il est integre dans la modale de resultat de generation et permet de modifier le contenu d'une activite H5P ou Moodle avant le telechargement du fichier `.h5p` ou `.mbz`.

Le systeme se compose de **8 fichiers** dans `js/editor/`.

## Architecture des fichiers

| Fichier | Role | Taille approx. |
|---------|------|-----------------|
| `index.js` | Orchestrateur -- cycle de vie, integration modale, API publique (`initJsonEditor`) | 18 Ko |
| `editor-core.js` | Rendu central -- `renderEditor()`, gestion d'etat interne | 19 Ko |
| `content-detector.js` | Detection du type de contenu -- schemas, signatures H5P/Moodle | 86 Ko |
| `field-renderers.js` | Rendu des champs -- types d'input, generation HTML | 51 Ko |
| `array-manager.js` | Gestion des tableaux -- ajout, suppression, reordonnancement, modales de confirmation | 49 Ko |
| `validators.js` | Validation en temps reel -- regles par type (`required`, `minLength`, `maxLength`, `pattern`) | 32 Ko |
| `feedback-editor.js` | Editeur de tranches de feedback -- classe `FeedbackEditor` (scores 0-100) | 14 Ko |
| `json-utils.js` | Utilitaires -- `getNestedValue()`, `setNestedValue()` pour chemins imbriques | 1.4 Ko |

## Etat global

L'objet `editorState` dans `index.js` centralise l'etat de l'editeur :

```js
let editorState = {
    isActive: false,
    originalData: null,      // Donnees originales (pour annulation)
    currentData: null,       // Donnees en cours d'edition
    contentType: null,       // 'h5p' ou 'moodle'
    moduleKey: null,         // Cle du module (Flashcards, QCM, etc.)
    notification: null,      // Reference a la notification source
    hasChanges: false,       // Flag de modifications
    validationErrors: [],    // Erreurs de validation actuelles
    container: null,         // Container DOM de l'editeur
    onSave: null,            // Callback de sauvegarde
    onCancel: null           // Callback d'annulation
};
```

`editor-core.js` maintient un etat interne complementaire : `editorData`, `editorSchema`, `editorOptions`, ainsi que des `Map` pour `arrayManagers` et `feedbackEditors`.

## Flux de donnees

```
Utilisateur clique "Visualiser et editer" dans la modale de resultat
        |
        v
initJsonEditor(notification, container, jsonData, options)
        |
        v
content-detector.js  -->  detectContentType() + getSchemaForType()
        |
        v
editor-core.js  -->  renderEditor() avec field-renderers.js
        |
        v
validators.js  -->  validation en temps reel a chaque modification
        |
        v
Sauvegarde  -->  denormalizeDataForSave() --> json-healer --> telechargement
```

## API publique (index.js)

| Fonction | Description |
|----------|-------------|
| `initJsonEditor(notification, container, jsonData, options)` | Initialise l'editeur |
| `destroyEditor()` | Detruit l'editeur et nettoie le DOM |
| `saveChanges()` | Fusionne les modifications et declenche le telechargement |
| `discardChanges()` | Annule les modifications et restaure les donnees originales |
| `hasUnsavedChanges()` | Retourne `true` si des modifications non sauvegardees existent |
| `getEditorState()` | Retourne une copie de l'etat courant |
| `isEditorActive()` | Retourne `true` si l'editeur est actif |
| `extractJsonFromNotification(notification)` | Extrait le JSON depuis une notification |

## Types de champs supportes (field-renderers.js)

La map `fieldRenderers` associe chaque type a sa fonction de rendu :

`text`, `textarea`, `number`, `color`, `checkbox`, `select`, `multiCheckbox`, `array`, `object`, `feedbackRanges`, `stringArray`, `pageBlockData`, `dynamicObject`, `timelineDate`

Chaque renderer recoit `(field, value, path, onChange)` et retourne un element DOM ou du HTML.

## Detection de contenu (content-detector.js)

L'objet `contentSignatures` contient une fonction de detection par type de module. Chaque fonction analyse la structure du JSON et retourne `true` si la signature correspond. Exemples :

- **Flashcards** : `Array.isArray(data.cards)` avec proprietes `text` et `answer`
- **MultipleChoice** : presence de `question` et `answers[].correct`
- **TrueFalse** : presence de `question` et `correct` booleen

Une fois le type detecte, `getSchemaForType()` retourne le schema de champs pour le rendu.

## Validateurs (validators.js)

Les validateurs de base disponibles dans l'objet `validators` :

- `required(value)` -- valeur non vide
- `minLength(min)(value)` -- longueur minimale (curried)
- `maxLength(max)(value)` -- longueur maximale (curried)
- `pattern(regex)(value)` -- correspondance regex (curried)

La fonction `validateField(value, rules)` applique les regles et retourne les erreurs. `validateSchema(data, schema)` valide l'ensemble des donnees.

## Points d'extension

### Ajouter un type de champ

1. Creer la fonction `renderNouveauType(field, value, path, onChange)` dans `field-renderers.js`
2. L'ajouter a la map `fieldRenderers` : `'nouveauType': renderNouveauType`

### Ajouter une detection de contenu

1. Ajouter une entree dans `contentSignatures` de `content-detector.js`
2. Ajouter le schema correspondant dans `getSchemaForType()`

### Ajouter une regle de validation

1. Ajouter le validateur a l'objet `validators` dans `validators.js`
2. L'utiliser dans les definitions de champs du schema

## Styles CSS

Les styles de l'editeur sont dans `css/components/json-editor.css`. Les classes suivent le prefixe `json-editor__` (convention BEM-like du projet).

## Mode debug

Ajouter `?debug` a l'URL pour activer les logs detailles de l'editeur (`debugLog('Editor', ...)`), incluant la detection de type et les donnees JSON brutes.
