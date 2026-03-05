# Plan d'action — Activité H5P Drag and Drop

> **Type H5P** : `H5P.DragQuestion` (v1.14) — déjà présent dans `js/vendor/h5p-libs/H5P.DragQuestion-1.14/`
> **Clé module** : `DragAndDrop`
> **machineName** : `H5P.DragQuestion`
> **Principe** : L'IA génère un JSON simplifié (zones + étiquettes). Le processeur calcule automatiquement les coordonnées x/y et construit le `content.json` H5P complet.

---

## Règle de progression

- **Ne jamais passer à l'étape suivante tant que la case précédente n'est pas cochée.**
- **Quand une étape est terminée, l'IA coche la case `[x]`, s'arrête et demande à l'utilisateur de tester.**
- L'utilisateur valide, puis l'IA continue.

---

## Story 1 — Enregistrement de l'activité dans le site

### Étape 1.1 — Ajouter la définition dans `definitions.js`

- [x] Ouvrir `js/modules/definitions.js`
- [x] Ajouter l'entrée `DragAndDrop` dans l'objet `h5pModules` :

```javascript
DragAndDrop: {
    name: "h5p_drag_and_drop_name",
    englishName: "Drag and Drop",
    machineName: "H5P.DragQuestion",
    description: "h5p_drag_and_drop_description",
    image: "assets/images/activities/drag-and-drop-icon.webp", 
    promptId: "dragAndDropResultat",
    jsonInputId: "dragAndDropJsonInput",
    createBtnId: "createDragAndDropH5P",
    categories: ["text", "h5p"],
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["H5P", "DOCX", "ODT", "PDF"]
},
```

- [x] Ajouter `'DragAndDrop'` dans le tableau `customOrder`, après `'DragTheWords'` (ligne ~391)
- [x] Vérifier que le site charge sans erreur (la tuile apparaît dans la grille)

**Fichiers modifiés** : `js/modules/definitions.js`
**Test** : Ouvrir le site → la tuile "Glisser-déposer" apparaît dans l'onglet "Tout"

---

### Étape 1.2 — Ajouter les traductions UI de base dans `fr.js`

- [x] Ouvrir `js/locales/fr.json`
- [x] Ajouter les clés de base (noms, descriptions) dans la section des noms d'activités H5P :

```javascript
// Drag and Drop
h5p_drag_and_drop_name: "Glisser-déposer",
h5p_drag_and_drop_description: "Créez une activité où les élèves glissent des étiquettes dans les bonnes zones de dépôt.",
```

- [x] Vérifier que le nom et la description apparaissent sur la tuile

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : La tuile affiche "Glisser-déposer" avec la description correcte

---

## Story 2 — Créer le processeur H5P

### Étape 2.1 — Créer le fichier `DragAndDrop.js`

- [x] Créer `js/modules/h5p-processors/DragAndDrop.js`
- [ ] Le processeur doit :
  1. Recevoir un JSON simplifié de l'IA avec `title`, `taskDescription`, `dropZones[]` et `elements[]`
  2. Calculer automatiquement les positions (x, y, width, height) des zones et des éléments
  3. Construire le `content.json` complet conforme à `H5P.DragQuestion`

**Structure du JSON simplifié attendu de l'IA** :

```json
{
  "title": "Classement des verbes",
  "taskDescription": "Glissez chaque verbe dans la bonne catégorie.",
  "dropZones": [
    {
      "label": "Verbes réguliers",
      "correctElements": [0, 1, 2]
    },
    {
      "label": "Verbes irréguliers",
      "correctElements": [3, 4, 5]
    }
  ],
  "elements": [
    { "text": "marcher" },
    { "text": "parler" },
    { "text": "chanter" },
    { "text": "aller" },
    { "text": "être" },
    { "text": "avoir" }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
```

**Structure du content.json H5P DragQuestion à générer** :

Le processeur doit produire un objet conforme à `semantics.json` de H5P.DragQuestion-1.14 :

```javascript
{
  scoreShow: "Vérifier",
  submit: "Valider",
  tryAgain: "Recommencer",
  scoreExplanation: "Les bonnes réponses donnent +1 point...",
  question: {
    settings: {
      size: { width: 620, height: calculée }
    },
    task: {
      elements: [
        {
          type: { library: "H5P.AdvancedText 1.1", params: { text: "<p>étiquette</p>" }, subContentId: "uuid" },
          x: calculé, y: calculé, width: calculé, height: calculé,
          dropZones: ["0"],  // indices des zones acceptées
          backgroundOpacity: 100,
          multiple: false
        }
      ],
      dropZones: [
        {
          label: "<div>Nom de zone</div>",
          showLabel: true,
          x: calculé, y: calculé, width: calculé, height: calculé,
          correctElements: ["0", "1"],  // indices des éléments corrects
          backgroundOpacity: 100,
          tipsAndFeedback: { tip: "", feedbackOnCorrect: "", feedbackOnIncorrect: "" },
          single: false,
          autoAlign: true
        }
      ]
    }
  },
  overallFeedback: { overallFeedback: [...] },
  behaviour: {
    enableRetry: true,
    enableCheckButton: true,
    singlePoint: false,
    applyPenalties: true,
    enableScoreExplanation: true,
    dropZoneHighlighting: "dragging",
    autoAlignSpacing: 2,
    enableFullScreen: false,
    showScorePoints: true,
    showTitle: true
  },
  localize: { fullscreen: "Plein écran", exitFullscreen: "Quitter le plein écran" },
  // Accessibilité
  grabbablePrefix: "Élément déplaçable {num} sur {total}.",
  grabbableSuffix: "Placé dans la zone de dépôt {num}.",
  dropzonePrefix: "Zone de dépôt {num} sur {total}.",
  noDropzone: "Pas de zone de dépôt.",
  tipLabel: "Voir l'indice.",
  tipAvailable: "Indice disponible",
  correctAnswer: "Bonne réponse",
  wrongAnswer: "Mauvaise réponse",
  feedbackHeader: "Résultat",
  scoreBarLabel: "Vous avez obtenu :num sur :total points",
  scoreExplanationButtonLabel: "Voir l'explication du score",
  a11yCheck: "Vérifier les réponses.",
  a11yRetry: "Recommencer l'exercice."
}
```

**Algorithme de calcul des positions** :

```
CANVAS_WIDTH = 620 (fixe)

Nombre de zones (N) :
  - 2-3 zones → 1 ligne, largeur = 100/N %
  - 4 zones → 2x2 grille
  - 5-6 zones → 2 lignes (3+3 ou 3+2)
  - 7-9 zones → 3 lignes (3+3+N-6)
  - 10 zones → 3+3+4 ou 4+3+3

Les zones occupent les 60% supérieurs du canvas.
Les éléments (étiquettes) sont placés dans les 30% inférieurs.
10% de marge entre zones et éléments.

Chaque élément est positionné en grille dans la zone inférieure.
La hauteur du canvas est calculée dynamiquement.
```

- [x] Exporter : `machineName`, `version`, `extraDependencies`, `default.process()`
- [x] Les `extraDependencies` sont :

```javascript
export const extraDependencies = [
    { machineName: 'H5P.DragNDrop', majorVersion: 1, minorVersion: 1 },
    { machineName: 'H5P.DragNBar', majorVersion: 1, minorVersion: 5 },
    { machineName: 'H5P.DragNResize', majorVersion: 1, minorVersion: 2 },
    { machineName: 'jQuery.ui', majorVersion: 1, minorVersion: 10 },
    { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
    { machineName: 'Drop', majorVersion: 1, minorVersion: 0 }
];
```

- [ ] Tester en générant un content.json manuellement et vérifier la structure

**Fichiers créés** : `js/modules/h5p-processors/DragAndDrop.js`
**Test** : Appeler `process()` avec un JSON de test → le content.json généré est valide structurellement

---

### Étape 2.2 — Enregistrer le processeur dans `index.js`

- [x] Ouvrir `js/modules/h5p-processors/index.js`
- [x] Ajouter l'import :

```javascript
import DragAndDrop from './DragAndDrop.js';
```

- [x] Ajouter dans l'objet `processors` :

```javascript
'DragAndDrop': DragAndDrop,
```

- [x] Ajouter dans l'objet `libraryToKey` :

```javascript
'H5P.DragQuestion': 'DragAndDrop',
```

- [ ] Vérifier que le site charge sans erreur

**Fichiers modifiés** : `js/modules/h5p-processors/index.js`
**Test** : Pas d'erreur console au chargement

---

### Étape 2.3 — Tester la création d'un fichier .h5p

- [ ] Saisir manuellement un JSON simplifié dans le champ JSON de l'activité
- [ ] Cliquer sur le bouton de création H5P
- [ ] Vérifier que le fichier `.h5p` se télécharge
- [ ] Ouvrir le fichier `.h5p` (c'est un ZIP) et vérifier :
  - `content/content.json` est valide
  - `h5p.json` référence `H5P.DragQuestion 1.14`
  - Les bibliothèques nécessaires sont présentes
- [ ] Importer le `.h5p` dans un site H5P (Lumi, h5p.org, ou Moodle) et vérifier qu'il fonctionne

**Test** : Le fichier .h5p s'ouvre correctement dans un lecteur H5P, les zones et étiquettes sont visibles et fonctionnelles

---

## Story 3 — Intégration IA (Prompts + Génération)

### Étape 3.1 — Créer le prompt template `assets/data/prompts/drag_and_drop.md`

- [ ] Créer `assets/data/prompts/drag_and_drop.md` en suivant exactement la structure des autres prompts
- [ ] Contenu du template :

```markdown
# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.DragQuestion - Glisser-déposer]
- Nombre d'éléments : Au minimum 6 étiquettes réparties dans 2 zones || [NOMBRE_ELEMENTS] étiquettes.
- Nombre de zones : L'IA déduit le nombre optimal de zones (2 à 10 maximum).
  - Opposition binaire → 2 zones
  - Classification simple → 3-4 zones
  - Classification détaillée → 5-10 zones (ne jamais dépasser 10)
- Répartition : Chaque zone doit contenir au moins 2 éléments.
- Unicité : Chaque étiquette doit être unique (pas de doublons).
- Clarté : Les noms de zones doivent être courts et explicites.

# RÈGLES PÉDAGOGIQUES
- Adaptation et vocabulaire : Adapte le ton, le vocabulaire et la difficulté au public indiqué.
- Ton et feedback : Les consignes doivent être constructives et encourageantes.
- Conformité : Adapte aux programmes scolaires français (Eduscol) pour le public scolaire.
- Langue : Le contenu et les consignes doivent être rédigés en français.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
[Détaillée dans les clés de traduction]

# EXEMPLE DE RENDU
[JSON d'exemple dans les clés de traduction]
```

**Fichiers créés** : `assets/data/prompts/drag_and_drop.md`

---

### Étape 3.2 — Créer le JSON d'exemple `assets/data/examples/drag_and_drop_1.json`

- [ ] Créer `assets/data/examples/drag_and_drop_1.json` avec un exemple pédagogique complet
- [ ] Le JSON doit suivre la structure simplifiée attendue par le processeur

Exemple de contenu :

```json
{
  "title": "Classification des verbes français",
  "taskDescription": "Glissez chaque verbe dans la catégorie correspondante : verbes du 1er groupe, du 2e groupe ou du 3e groupe.",
  "dropZones": [
    {
      "label": "1er groupe (-er)",
      "correctElements": [0, 1, 2, 3]
    },
    {
      "label": "2e groupe (-ir)",
      "correctElements": [4, 5, 6]
    },
    {
      "label": "3e groupe (irréguliers)",
      "correctElements": [7, 8, 9, 10, 11]
    }
  ],
  "elements": [
    { "text": "marcher" },
    { "text": "parler" },
    { "text": "chanter" },
    { "text": "danser" },
    { "text": "finir" },
    { "text": "choisir" },
    { "text": "grandir" },
    { "text": "aller" },
    { "text": "être" },
    { "text": "avoir" },
    { "text": "prendre" },
    { "text": "faire" }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires, revois les groupes de conjugaison." },
    { "from": 11, "to": 30, "feedback": "C'est un début, continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "Tu progresses, attention aux verbes du 3e groupe." },
    { "from": 51, "to": 70, "feedback": "Bon travail, encore quelques erreurs à corriger." },
    { "from": 71, "to": 90, "feedback": "Très bon score, tu maîtrises bien la conjugaison !" },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu connais parfaitement les groupes de verbes !" }
  ]
}
```

**Fichiers créés** : `assets/data/examples/drag_and_drop_1.json`
**Test** : Le JSON est valide et peut être collé dans le champ JSON de l'activité

---

### Étape 3.3 — Ajouter les clés de traduction pour les prompts dans `fr.js`

- [ ] Ouvrir `js/locales/fr.json`
- [ ] Ajouter les 3 clés de prompt (section prompts, même pattern que les autres activités) :

```javascript
// ============================================================================
// === DRAG_AND_DROP (Glisser-déposer) ===
// ============================================================================
DRAG_AND_DROP_REGLES_SPECIFIQUES: `...`,
DRAG_AND_DROP_STRUCTURE_JSON: `...`,
DRAG_AND_DROP_EXEMPLE_RENDU: `...`,
```

Les clés doivent contenir :
- `DRAG_AND_DROP_REGLES_SPECIFIQUES` : Règles sur le nombre de zones (2-10), le nombre d'éléments (min 6), la répartition équilibrée, l'unicité
- `DRAG_AND_DROP_STRUCTURE_JSON` : Description exacte de la structure JSON simplifiée (`title`, `taskDescription`, `dropZones[]`, `elements[]`, `overallFeedback[]`)
- `DRAG_AND_DROP_EXEMPLE_RENDU` : Exemple JSON complet (celui de l'étape 3.2)

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : Pas d'erreur de syntaxe dans le fichier de traduction

---

### Étape 3.4 — Enregistrer dans `prompt-generator.js`

- [ ] Ouvrir `js/modules/prompt-generator.js`
- [ ] Ajouter l'entrée dans `ACTIVITY_CONFIG` :

```javascript
dragAndDrop: { prefix: 'DRAG_AND_DROP', resultKey: 'dragAndDropResultat' },
```

- [ ] Vérifier que le prompt se génère correctement

**Fichiers modifiés** : `js/modules/prompt-generator.js`
**Test** : Cliquer sur la tuile Drag and Drop → le prompt IA s'affiche avec les bonnes sections

---

### Étape 3.5 — Tester la génération IA complète

- [ ] Sélectionner l'activité "Glisser-déposer"
- [ ] Remplir les champs (qui, quoi, niveau, nombre d'éléments)
- [ ] Générer le prompt
- [ ] Envoyer à l'IA (via le bouton "Générer")
- [ ] Vérifier que le JSON retourné est conforme à la structure attendue
- [ ] Créer le fichier H5P à partir du JSON généré
- [ ] Tester le fichier H5P dans un lecteur

**Test** : Le workflow complet fonctionne : prompt → IA → JSON → H5P → activité fonctionnelle

---

## Story 4 — Export document (DOCX, ODT, PDF)

### Étape 4.1 — Ajouter le formateur dans `document-formatter.js`

- [ ] Ouvrir `js/modules/document-formatter.js`
- [ ] Ajouter `'DragAndDrop': formatDragAndDrop` dans le mapping des formateurs
- [ ] Créer la fonction `formatDragAndDrop(data)` qui :
  - Affiche le titre et la consigne
  - Liste chaque zone avec ses étiquettes correctes
  - Affiche les éléments mélangés en bas (pour impression)

- [ ] Ajouter les clés de traduction nécessaires dans `fr.js` :

```javascript
doc_fmt_drag_and_drop_title: "Glisser-déposer",
doc_fmt_drag_and_drop_zones: "Zones de dépôt",
doc_fmt_drag_and_drop_elements: "Étiquettes à placer",
doc_fmt_drag_and_drop_instructions: "Placez chaque étiquette dans la zone correspondante.",
```

**Fichiers modifiés** : `js/modules/document-formatter.js`, `js/locales/fr.json`
**Test** : Exporter en DOCX → le document contient les zones et étiquettes correctement formatées

---

## Story 5 — Traductions internationales

### Étape 5.1 — Ajouter les traductions minimales dans les 10 autres langues

- [ ] Pour chaque fichier de traduction (`en.js`, `es.js`, `de.js`, `it.js`, `nl.js`, `pt.js`, `ar.js`, `zh.js`, `jp.js`, `el.js`), ajouter :
  - `h5p_drag_and_drop_name` : Nom de l'activité traduit
  - `h5p_drag_and_drop_description` : Description traduite

Note : Les clés de prompt (`DRAG_AND_DROP_REGLES_SPECIFIQUES`, etc.) ne sont nécessaires que dans `fr.js` pour le moment. Les autres langues seront ajoutées ultérieurement.

**Fichiers modifiés** : 10 fichiers de traduction
**Test** : Changer la langue du site → le nom de l'activité est traduit

---

## Story 6 — Optimisation et finitions

### Étape 6.1 — Valider l'algorithme de positionnement pour tous les cas

- [ ] Tester avec 2 zones et 4 éléments
- [ ] Tester avec 3 zones et 9 éléments
- [ ] Tester avec 5 zones et 15 éléments
- [ ] Tester avec 10 zones et 20 éléments (cas extrême)
- [ ] Vérifier la lisibilité dans chaque cas
- [ ] Ajuster les dimensions si nécessaire

**Test** : Tous les cas de figure produisent une activité lisible et fonctionnelle

---

### Étape 6.2 — Ajouter l'icône définitive

- [ ] Créer ou obtenir l'icône `assets/images/activities/drag-and-drop-icon.webp`
- [ ] Mettre à jour le chemin dans `definitions.js` :

```javascript
image: "images/drag-and-drop-icon.webp",
```

**Fichiers modifiés** : `js/modules/definitions.js`, `assets/images/activities/drag-and-drop-icon.webp`
**Test** : L'icône s'affiche correctement sur la tuile

---

## Récapitulatif des fichiers

| Fichier | Action | Story |
|---------|--------|-------|
| `js/modules/definitions.js` | Modifier | 1, 6 |
| `js/locales/fr.json` | Modifier | 1, 3, 4 |
| `js/modules/h5p-processors/DragAndDrop.js` | Créer | 2 |
| `js/modules/h5p-processors/index.js` | Modifier | 2 |
| `banque_prompts/drag_and_drop.md` | Créer | 3 |
| `banque_json/drag_and_drop_1.json` | Créer | 3 |
| `js/modules/prompt-generator.js` | Modifier | 3 |
| `js/modules/document-formatter.js` | Modifier | 4 |
| `js/locales/en.json` à `el.json` | Modifier | 5 |
| `assets/images/activities/drag-and-drop-icon.webp` | Créer | 6 |

---

## Dépendances H5P (déjà présentes dans `js/vendor/h5p-libs/`)

| Bibliothèque | Version | Présente |
|--------------|---------|----------|
| H5P.DragQuestion | 1.14 | Oui |
| H5P.DragNDrop | 1.1 | Oui |
| H5P.DragNBar | 1.5 | Oui |
| H5P.DragNResize | 1.2 | Oui |
| H5P.AdvancedText | 1.1 | Oui |
| H5P.Question | 1.5 | Oui |
| H5P.JoubelUI | 1.3 | Oui |
| jQuery.ui | 1.10 | Oui |
| FontAwesome | 4.5 | Oui |
| Drop | 1.0 | Oui |

Aucune bibliothèque supplémentaire à télécharger.

---

## Notes techniques importantes

1. **Coordonnées H5P** : Les positions (x, y, width, height) sont en **pourcentage** du canvas, pas en pixels. x=0 = bord gauche, x=100 = bord droit.

2. **SubContentId** : Chaque élément `type` (H5P.AdvancedText) nécessite un `subContentId` unique au format UUID. Le processeur doit générer des UUID.

3. **dropZones/correctElements** : Les références entre éléments et zones utilisent des **indices sous forme de chaînes** : `"0"`, `"1"`, `"2"`, etc.

4. **autoAlign** : Mettre `autoAlign: true` sur toutes les zones pour que les étiquettes déposées s'alignent proprement.

5. **Canvas dimensions** : Largeur fixe 620px. Hauteur calculée dynamiquement selon le nombre de zones et d'éléments.
