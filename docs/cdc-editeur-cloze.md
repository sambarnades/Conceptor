# Cahier des charges — Editeur visuel Cloze (Texte a trous)

> Version : 1.0 — 2026-03-24
> Auteur : Caramel dev team
> Statut : A developper

---

## 1. Contexte et probleme

### 1.1 Situation actuelle

L'activite Test de Moodle/Elea propose un type de question **Cloze** (texte a trous) dont le format est technique :

```
Pour resoudre ax^2 + bx + c = 0, on calcule {1:MULTICHOICE:=Delta~b^2+4ac~2b-4ac}.
Si Delta > 0, l'equation admet {1:SHORTANSWER:=2} solutions.
La valeur de pi est environ {1:NUMERICAL:=3.14:0.01}.
```

Aujourd'hui dans Caramel, ce texte est edite dans un **textarea brut avec la toolbar WYSIWYG** qui n'a aucun sens pour ce format. L'utilisateur doit :
- Connaitre la syntaxe `{poids:TYPE:=bonne~mauvaise1~mauvaise2}`
- Taper manuellement les accolades, tildes, et signes `=`
- Gerer les poids et tolerances sans aide visuelle
- Ne pas confondre les `{}` de Cloze avec les `{}` du LaTeX

C'est **inutilisable** pour un enseignant non-technique.

### 1.2 Objectif

Creer un **editeur visuel Cloze** qui permet a un enseignant de :
1. Ecrire le texte normalement
2. Selectionner un mot ou un passage → cliquer un bouton → un trou est cree
3. Configurer chaque trou visuellement (type, reponses, tolerance)
4. Voir un apercu en temps reel du rendu final

Le tout sans jamais voir la syntaxe `{1:TYPE:...}`.

---

## 2. Specifications fonctionnelles

### 2.1 Interface utilisateur

#### 2.1.1 Zone d'edition principale

Un **contenteditable** ou le texte est affiche normalement, et les trous apparaissent comme des **chips visuels** cliquables :

```
Pour resoudre ax^2 + bx + c = 0, on calcule [ Delta = b^2 - 4ac v ] .
Si Delta > 0, l'equation admet [ 2 ] solutions.
La valeur de pi est environ [ 3.14 ± 0.01 ] .
```

Chaque chip affiche :
- **QCM** `[ option1 | option2 | option3 v ]` : les options avec un chevron, la bonne en gras
- **Reponse courte** `[ reponse ]` : la bonne reponse dans un champ simple
- **Numerique** `[ valeur ± tolerance ]` : la valeur et la tolerance

#### 2.1.2 Toolbar Cloze

Au-dessus de la zone d'edition, une toolbar specifique :

| Bouton | Action |
|--------|--------|
| **QCM** (icone liste) | Insere un trou QCM a la position du curseur |
| **Reponse courte** (icone clavier) | Insere un trou reponse courte |
| **Numerique** (icone calculatrice) | Insere un trou numerique |
| **Apercu** (icone oeil) | Bascule vers l'apercu eleve (trous vides) |
| **Code** (icone `</>`) | Bascule vers le code Cloze brut (mode expert) |

#### 2.1.3 Modale de configuration d'un trou

Au clic sur un chip, une **modale** s'ouvre pour configurer le trou :

**Pour un trou QCM (MULTICHOICE) :**
```
+---------------------------------------+
| Trou QCM (choix multiple)         [x] |
+---------------------------------------+
| Bonne reponse(s) :                    |
|   [v] Delta = b^2 - 4ac              |
|                                       |
| Mauvaises reponses :                  |
|   [ ] b^2 + 4ac         [supprimer]  |
|   [ ] 2b - 4ac          [supprimer]  |
|   [+ Ajouter une mauvaise reponse]   |
|                                       |
| Poids : [ 1 ]                        |
|                                       |
|            [Annuler]  [Valider]       |
+---------------------------------------+
```

**Pour un trou Reponse courte (SHORTANSWER) :**
```
+---------------------------------------+
| Trou reponse courte               [x] |
+---------------------------------------+
| Bonne reponse :                       |
|   [ Paris                        ]    |
|                                       |
| Reponses alternatives (optionnel) :   |
|   [ paris          ]    [supprimer]   |
|   [+ Ajouter une alternative]         |
|                                       |
| Poids : [ 1 ]                        |
|                                       |
|            [Annuler]  [Valider]       |
+---------------------------------------+
```

**Pour un trou Numerique (NUMERICAL) :**
```
+---------------------------------------+
| Trou numerique                    [x] |
+---------------------------------------+
| Valeur attendue :                     |
|   [ 3.14                        ]    |
|                                       |
| Tolerance (± ecart accepte) :         |
|   [ 0.01                        ]    |
|                                       |
| Poids : [ 1 ]                        |
|                                       |
|            [Annuler]  [Valider]       |
+---------------------------------------+
```

#### 2.1.4 Mode apercu

Un apercu du texte tel qu'il apparaitra pour l'eleve :

```
Pour resoudre ax^2 + bx + c = 0, on calcule [__v__] .
Si Delta > 0, l'equation admet [________] solutions.
La valeur de pi est environ [________] .
```

- Les trous QCM affichent un menu deroulant vide
- Les trous reponse courte et numerique affichent un champ vide

#### 2.1.5 Mode code (expert)

Le textarea brut avec la syntaxe Cloze pour les utilisateurs avances.
Bascule bidirectionnelle : toute modification dans un mode se repercute dans l'autre.

### 2.2 Comportement

#### 2.2.1 Creation d'un trou

1. L'utilisateur positionne le curseur dans le texte ou selectionne un mot
2. Clic sur le bouton du type de trou souhaite
3. **Si du texte est selectionne** : il devient la bonne reponse par defaut
4. **Si aucun texte selectionne** : la modale de configuration s'ouvre vide
5. Un chip est insere dans le texte a la position du curseur

#### 2.2.2 Modification d'un trou

1. Clic sur un chip → la modale de configuration s'ouvre avec les valeurs actuelles
2. Modification des reponses/tolerance/poids
3. Clic "Valider" → le chip est mis a jour

#### 2.2.3 Suppression d'un trou

1. Clic sur un chip → modale de configuration
2. Bouton "Supprimer le trou" en bas de la modale
3. Le chip est remplace par la bonne reponse en texte brut

#### 2.2.4 Serialisation

A l'enregistrement, l'editeur serialise le contenu en syntaxe Cloze Moodle :
- Chaque chip → `{poids:TYPE:=bonne~mauvaise1~mauvaise2}`
- Le texte autour est preserve tel quel
- Le resultat est une string compatible `questiontext` Moodle

#### 2.2.5 Deserialisation

A l'ouverture, l'editeur parse la syntaxe Cloze existante :
- Chaque `{poids:TYPE:...}` → chip visuel
- Le texte autour est affiche normalement
- Les erreurs de syntaxe sont signalees visuellement

---

## 3. Specifications techniques

### 3.1 Architecture

#### 3.1.1 Nouveau fichier : `js/editor/cloze-editor.js`

```javascript
/**
 * Cloze Editor — Editeur visuel pour les questions texte a trous
 *
 * Fournit un contenteditable avec des chips visuels pour les trous,
 * des modales de configuration par type, et une serialisation
 * vers le format Cloze Moodle {poids:TYPE:=reponse~alternative}.
 */

// Exports :
export function renderClozeField(config, value, onChange, path)
export function parseClozeToVisual(clozeText) // Cloze → HTML avec chips
export function serializeVisualToCloze(container) // Chips → Cloze string
```

#### 3.1.2 Nouveau type dans field-renderers.js

```javascript
'cloze': renderClozeField
```

Active quand `fieldConfig.type === 'textarea'` et que le champ a un attribut `cloze: true` dans le schema editeur, ou detecte par le hint `editor_cloze_format_hint`.

#### 3.1.3 Structure DOM

```html
<div class="json-editor__field json-editor__field--cloze">
  <label>TEXTE A TROUS (CLOZE)</label>
  <div class="json-editor__cloze-container">
    <div class="json-editor__cloze-toolbar">
      [QCM] [Reponse courte] [Numerique] | [Apercu] [Code]
    </div>
    <div class="json-editor__cloze-editable" contenteditable="true">
      Texte avec <span class="cloze-chip" data-type="MULTICHOICE" data-answers="...">
        [ Delta = b^2 - 4ac v ]
      </span> et d'autres trous.
    </div>
  </div>
  <span class="json-editor__hint">...</span>
</div>
```

#### 3.1.4 Format des chips

Chaque chip est un `<span>` non-editable avec des attributs data :

```html
<span class="cloze-chip cloze-chip--multichoice"
      contenteditable="false"
      data-type="MULTICHOICE"
      data-weight="1"
      data-correct="Delta = b^2 - 4ac"
      data-wrong="b^2 + 4ac,2b - 4ac">
  Delta = b^2 - 4ac ▾
</span>
```

### 3.2 Parseur Cloze

#### 3.2.1 Regex de detection

```javascript
const CLOZE_RE = /\{(\d+):(MULTICHOICE|SHORTANSWER|NUMERICAL):([^}]+)\}/g;
```

#### 3.2.2 Parse des reponses

Pour chaque match `{poids:TYPE:contenu}` :

- **MULTICHOICE** : `=bonne~mauvaise1~mauvaise2`
  - Reponse correcte : commence par `=`
  - Alternatives : separees par `~`
- **SHORTANSWER** : `=bonne~alternative1~alternative2`
  - Meme format, toutes les reponses sont correctes
- **NUMERICAL** : `=valeur:tolerance`
  - Valeur numerique + tolerance optionnelle

#### 3.2.3 Cas speciaux a gerer

- Plusieurs bonnes reponses QCM : `=bonne1~=bonne2~mauvaise`
- Fractions de score : `%50%reponse` (score partiel)
- Feedback par reponse : `=bonne#Bravo~mauvaise#Faux` (feedback apres `#`)
- Reponses echappees contenant `~` ou `}` ou `:`
- Imbrication avec du LaTeX : `\(` peut contenir `{}`

### 3.3 Serialisation

```javascript
function serializeVisualToCloze(container) {
    let result = '';
    for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.classList?.contains('cloze-chip')) {
            result += serializeChip(node);
        }
    }
    return result;
}

function serializeChip(chip) {
    const weight = chip.dataset.weight || '1';
    const type = chip.dataset.type;
    const correct = chip.dataset.correct;
    const wrong = chip.dataset.wrong;
    // ... construction de la syntaxe {poids:TYPE:=...}
}
```

### 3.4 CSS

Nouveau fichier ou section dans `richtext-editor.css` :

```css
.cloze-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
}

.cloze-chip--multichoice { background: #e8f0fe; border: 1px solid #4285f4; color: #1a73e8; }
.cloze-chip--shortanswer { background: #fef7e0; border: 1px solid #f9ab00; color: #e37400; }
.cloze-chip--numerical   { background: #e6f4ea; border: 1px solid #34a853; color: #137333; }
```

---

## 4. Integration dans Caramel

### 4.1 Detection automatique

L'editeur Cloze s'active quand :
1. Le moduleKey est `elea_test` ou `test_elea`
2. Le type de question est `cloze`
3. Le champ est `questiontext`

Detection dans `getRendererForField` :
```javascript
if (fieldConfig.cloze || fieldConfig.hint === 'editor_cloze_format_hint') {
    return { renderer: fieldRenderers['cloze'], config: fieldConfig };
}
```

### 4.2 Compatibilite

- **Entree** : le contenu existant en syntaxe Cloze est parse et affiche visuellement
- **Sortie** : l'editeur serialise en syntaxe Cloze standard Moodle
- **Bascule** : le mode code permet toujours l'edition manuelle
- **JSON healer** : `healClozeQuestiontext()` s'applique apres la sauvegarde pour corriger les erreurs
- **Export document** : `processClozeForStatement()` et `processClozeForCorrection()` sont deja en place

### 4.3 Tests unitaires

Ajouter un step 30 dans `test-richtext-editor.js` :

| Test | Description |
|------|-------------|
| Parse MULTICHOICE | `{1:MULTICHOICE:=A~B~C}` → chip avec correct=A, wrong=[B,C] |
| Parse SHORTANSWER | `{1:SHORTANSWER:=Paris~paris}` → chip avec reponses=[Paris,paris] |
| Parse NUMERICAL | `{1:NUMERICAL:=3.14:0.01}` → chip avec value=3.14, tolerance=0.01 |
| Serialize MULTICHOICE | chip → `{1:MULTICHOICE:=A~B~C}` |
| Serialize SHORTANSWER | chip → `{1:SHORTANSWER:=Paris~paris}` |
| Serialize NUMERICAL | chip → `{1:NUMERICAL:=3.14:0.01}` |
| Round-trip | parse → serialize = identique |
| Texte mixte | Texte avant {trou1} texte {trou2} texte apres |
| Multiples bonnes reponses | `{1:MULTICHOICE:=A~=B~C}` (2 bonnes) |
| Feedback inline | `{1:MULTICHOICE:=A#Bravo~B#Faux}` |
| Poids != 1 | `{2:SHORTANSWER:=reponse}` |
| Tolerance 0 | `{1:NUMERICAL:=42:0}` (exact) |
| Erreurs syntaxe | `{1:MULTICHOICE:}` → signale comme invalide |
| Coexistence LaTeX | Texte `\(x^2\)` avec `{1:SHORTANSWER:=4}` |

### 4.4 Traductions

Nouvelles cles `editor_cloze_*` dans les 11 fichiers de locale :

| Cle | FR |
|-----|-----|
| `editor_cloze_insert_mcq` | Inserer un choix multiple |
| `editor_cloze_insert_short` | Inserer une reponse courte |
| `editor_cloze_insert_num` | Inserer une valeur numerique |
| `editor_cloze_preview` | Apercu eleve |
| `editor_cloze_code` | Code source |
| `editor_cloze_correct_answer` | Bonne reponse |
| `editor_cloze_wrong_answers` | Mauvaises reponses |
| `editor_cloze_alternatives` | Reponses alternatives |
| `editor_cloze_tolerance` | Tolerance |
| `editor_cloze_weight` | Poids |
| `editor_cloze_delete_gap` | Supprimer le trou |
| `editor_cloze_add_wrong` | Ajouter une mauvaise reponse |
| `editor_cloze_add_alt` | Ajouter une alternative |

---

## 5. Maquettes UX

### 5.1 Etat initial (texte existant)

```
+-- TEXTE A TROUS (CLOZE) * -----------------------------------+
| [QCM] [Rep. courte] [Numerique]  |  [Apercu] [Code]         |
+---------------------------------------------------------------+
| Pour resoudre ax^2 + bx + c = 0, on calcule le discriminant  |
| [ Delta = b^2 - 4ac ▾ ] . Si Delta > 0, l'equation admet    |
| [ 2 ] solutions reelles distinctes.                           |
+---------------------------------------------------------------+
  Cliquez sur un trou pour le modifier.
```

### 5.2 Apres clic sur le chip QCM

```
+-- Trou : Choix multiple ------------------------------- [x] --+
|                                                                |
|  BONNE REPONSE :                                               |
|  +--------------------------------------------------+         |
|  | Delta = b^2 - 4ac                                |         |
|  +--------------------------------------------------+         |
|                                                                |
|  MAUVAISES REPONSES :                                          |
|  +--------------------------------------------------+ [x]     |
|  | b^2 + 4ac                                        |         |
|  +--------------------------------------------------+         |
|  +--------------------------------------------------+ [x]     |
|  | 2b - 4ac                                         |         |
|  +--------------------------------------------------+         |
|  [+ Ajouter une mauvaise reponse]                              |
|                                                                |
|  Poids : [ 1 ]                                                 |
|                                                                |
|                    [Supprimer le trou]  [Annuler]  [Valider]   |
+----------------------------------------------------------------+
```

### 5.3 Mode apercu eleve

```
+-- TEXTE A TROUS (CLOZE) * -----------------------------------+
| [QCM] [Rep. courte] [Numerique]  |  [Apercu*] [Code]        |
+---------------------------------------------------------------+
| Pour resoudre ax^2 + bx + c = 0, on calcule le discriminant  |
| [___▼___] . Si Delta > 0, l'equation admet                   |
| [________] solutions reelles distinctes.                      |
+---------------------------------------------------------------+
```

### 5.4 Mode code expert

```
+-- TEXTE A TROUS (CLOZE) * -----------------------------------+
| [QCM] [Rep. courte] [Numerique]  |  [Apercu] [Code*]        |
+---------------------------------------------------------------+
| Pour resoudre ax^2 + bx + c = 0, on calcule le discriminant  |
| {1:MULTICHOICE:=Delta = b^2 - 4ac~b^2 + 4ac~2b - 4ac}.      |
| Si Delta > 0, l'equation admet {1:SHORTANSWER:=2} solutions  |
| reelles distinctes.                                            |
+---------------------------------------------------------------+
```

---

## 6. Estimation et priorites

### 6.1 Decoupage

| Phase | Tache | Complexite | Priorite |
|-------|-------|-----------|----------|
| 1 | Parseur Cloze (parse + serialize) | Moyenne | Haute |
| 2 | Chips visuels dans contenteditable | Haute | Haute |
| 3 | Modale configuration QCM | Moyenne | Haute |
| 4 | Modale configuration Reponse courte | Faible | Haute |
| 5 | Modale configuration Numerique | Faible | Haute |
| 6 | Mode apercu eleve | Faible | Moyenne |
| 7 | Mode code (bascule) | Moyenne | Moyenne |
| 8 | CSS et design Apple-inspired | Faible | Haute |
| 9 | Integration content-detector + field-renderers | Faible | Haute |
| 10 | Tests unitaires (step 30) | Moyenne | Haute |
| 11 | Traductions 11 locales | Faible | Moyenne |
| 12 | Gestion des feedbacks inline (#) | Haute | Basse |
| 13 | Gestion des scores partiels (%) | Haute | Basse |

### 6.2 Fichiers a creer

| Fichier | Role |
|---------|------|
| `js/editor/cloze-editor.js` | Parseur, chips, modales, serialisation (~500-700 lignes) |

### 6.3 Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `js/editor/field-renderers.js` | Ajout `'cloze': renderClozeField` |
| `js/editor/editor-core.js` | Detection auto dans `getRendererForField` |
| `js/editor/content-detector.js` | Attribut `cloze: true` sur le champ questiontext du type cloze |
| `css/components/richtext-editor.css` | Styles chips, modales, toolbar cloze |
| `js/locales/*.json` | 13 nouvelles cles dans 11 fichiers |
| `tests/test-richtext-editor.js` | Step 30 : tests parse/serialize/round-trip |
| `docs/catalogue-champs-editeur.md` | Mise a jour du champ cloze |

---

## 7. Cas non geres (v2 future)

Ces cas sont documentes mais exclus du scope initial :

| Cas | Raison |
|-----|--------|
| Feedbacks inline par reponse (`#Bravo`) | Complexite UX — necessite une interface supplémentaire |
| Scores partiels (`%50%reponse`) | Rarement utilise par les enseignants |
| Cloze imbrique dans du HTML riche | Conflit avec le WYSIWYG — le mode code reste disponible |
| Drag-and-drop Cloze (MULTICHOICE_D) | Type Moodle avance, pas dans les exemples actuels |
| MULTICHOICE_H (horizontal) vs MULTICHOICE_V (vertical) | Variante d'affichage, pas de difference fonctionnelle |
| Validation en temps reel de la syntaxe | A ajouter en v2 |
