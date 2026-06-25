---
name: caramel-document-export
description: Modifier ou debugger l'export de documents DOCX, ODT, PDF (avec formules math éditables). À utiliser quand l'utilisateur dit "export DOCX", "export ODT", "export PDF", "math dans Word/LibreOffice", "OMML", "MathML", "document-exporter", "document-formatter", ou veut toucher au pipeline d'export documents.
---

# Export DOCX / ODT / PDF

Dossier : `js/export/`. Module entrée : `document-exporter.js`. Formatage : `document-formatter.js`.

## Pipeline (3 sorties, 1 source)

```
JSON activité (post-processor ou éditeur)
  → document-formatter.js (keepLatex: true|false selon target)
  → document-exporter.js
      ├─ DOCX : latex-parser → latex-to-omml → docx.js Math objects (éditable Word)
      ├─ ODT  : latex-parser → latex-to-mathml → MathML objects + StarMath annotation (éditable LibreOffice)
      └─ PDF  : postProcessLatex → latexToUnicode → texte Unicode (pas de math natif PDF)
```

## Fichiers du dossier `export/`

| Fichier | Rôle |
|---|---|
| `document-exporter.js` | Orchestrateur : routes vers DOCX/ODT/PDF |
| `document-formatter.js` | Transforme JSON activité en structure formatable (sections, paragraphes, médias) |
| `sanitizer.js` | DOMPurify pour HTML utilisateur |
| `latex-parser.js` | LaTeX → AST (utilisé par DOCX et ODT) |
| `math-catalog.js` | 177 symboles : LaTeX ↔ Unicode ↔ MathML type ↔ StarMath |
| `latex-to-omml.js` | AST → OMML (Office Math Markup Language) pour DOCX |
| `latex-to-mathml.js` | AST → MathML pour ODT |

## Targets, librairies, contraintes

| Target | Lib | Math native | Contrainte |
|---|---|---|---|
| DOCX | `docx` 8.5.0 | OUI (OMML, éditable Word) | Polices : Calibri, Times — Liberation Sans pour fallback |
| ODT | manuel (XML) | OUI (MathML inline, éditable LibreOffice) | Annotation StarMath obligatoire pour rendu correct |
| PDF | `jsPDF` 4.2.0 + AutoTable 5.0.7 | NON (Unicode only) | Pas de tables complexes, polices intégrées Liberation Sans |

## Cas d'usage typiques

### Ajouter un nouveau type de bloc (ex: callout, code)
1. Étendre `document-formatter.js` pour produire un objet structurel `{type: 'callout', text, color}`
2. Pour chaque target dans `document-exporter.js` : implémenter le rendu correspondant (Paragraph DOCX, XML ODT, addText PDF)
3. Tester : générer une activité contenant le bloc → exporter dans les 3 formats → ouvrir dans Word, LibreOffice, lecteur PDF

### Supporter un nouveau symbole math
1. Ajouter l'entrée dans `math-catalog.js` :
```javascript
{
  latex: '\\dagger',
  unicode: '†',
  mathml: { type: 'mo', value: '†' },
  starmath: 'dagger'
}
```
2. Tester : insérer `\dagger` dans une formule → vérifier rendu DOCX (Word), ODT (LibreOffice), PDF
3. Si le symbole est complexe (avec sub/sup), étendre `latex-parser.js` pour le parser

### Fix un bug de rendu math
- Si DOCX cassé : inspecter l'OMML produit (`latex-to-omml.js`) — ouvrir le DOCX avec Word, voir si l'objet math est éditable
- Si ODT cassé : inspecter le MathML + l'annotation StarMath — LibreOffice utilise les deux (StarMath pour l'éditeur, MathML pour l'affichage)
- Si PDF cassé : c'est un fallback Unicode, vérifier `latexToUnicode()` et la table `math-catalog.js`

## `keepLatex` flag

`document-formatter.js` accepte `keepLatex: boolean` :
- `true` (DOCX/ODT) : conserve les `\(...\)` LaTeX intacts pour parsing en aval
- `false` (PDF) : convertit immédiatement en Unicode (`postProcessLatex` → `latexToUnicode`)

## Images

`document-exporter.js` utilise `prepareImageData(image)` qui résout 3 cas :
1. **Data URL** (`data:image/jpeg;base64,...`) → utilisé tel quel
2. **Path relatif** (`images/xxx.jpg`) → lookup dans le registry image (`image-manager.js`)
3. **URL HTTP** → fetch + conversion

## Pièges connus

- **OMML strict** : Word refuse de charger un DOCX avec OMML mal formé silencieusement (ouvre avec erreur "fichier corrompu") — tester chaque change avec Word réel, pas juste `unzip` du DOCX
- **MathML + StarMath obligatoires** : LibreOffice utilise les deux — sans StarMath l'éditeur math ne fonctionne pas, sans MathML rendu cassé
- **PDF + Unicode** : certains symboles math n'ont pas d'équivalent Unicode propre (`\nexists` est rare) → fallback `≠∃` ou laisser tel quel
- **Tables complexes en PDF** : jsPDF-AutoTable a des limitations (cellules merge difficiles) → simplifier ou rendre en image
- **Polices** : si une activité utilise un caractère exotique (math, emoji), vérifier que la police embarquée le supporte — sinon glyphes manquants
- **Memory** : exporter une CoursePresentation avec 50 slides + images peut utiliser plusieurs centaines de MB — penser au streaming ou warning utilisateur
- **Sanitization** : tout HTML utilisateur DOIT passer par DOMPurify (`sanitizer.js`) avant rendu — sinon XSS dans le doc (rare mais possible)

## Tests visuels

1. Générer chaque type d'activité
2. Exporter dans DOCX, ODT, PDF
3. Ouvrir dans Word, LibreOffice, lecteur PDF
4. Vérifier : math éditable, images correctes, mise en forme préservée, hyperliens cliquables

## Fichiers touchés

```
js/export/document-exporter.js          [orchestrateur]
js/export/document-formatter.js         [structure intermédiaire]
js/export/latex-parser.js               [si nouveau LaTeX à parser]
js/export/math-catalog.js               [si nouveau symbole]
js/export/latex-to-omml.js              [si nouveau rendu DOCX math]
js/export/latex-to-mathml.js            [si nouveau rendu ODT math]
js/export/sanitizer.js                  [config DOMPurify]
```
