---
name: caramel-latex-math
description: Modifier le pipeline LaTeX/MathJax (math-catalog 177 symboles, latex-parser AST, OMML pour DOCX, MathML pour ODT, Unicode pour PDF). À utiliser quand l'utilisateur dit "MathJax", "LaTeX rendu", "math-catalog", "ajouter symbole math", "OMML", "MathML", "starmath", "formula assistant", "préview formule", ou veut toucher au rendu math.
---

# Pipeline LaTeX & Math

## Vue d'ensemble

LaTeX est utilisé partout :
- **Génération LLM** : prompts demandent `\(...\)` pour formules
- **Stockage** : conservé en LaTeX dans le JSON de l'activité
- **Preview H5P** : MathJax 3.2.2 rend en SVG dans l'iframe
- **Éditeur** : richtext protège LaTeX dans `<span data-latex>`, formula-assistant pour insertion
- **Export DOCX/ODT** : conversion en math native éditable (OMML, MathML)
- **Export PDF** : conversion en Unicode

## Catalogue centralisé : `math-catalog.js`

177 symboles, format unique :
```javascript
{
  latex: '\\frac',
  unicode: '⁄',                                  // fallback Unicode (rare pour fractions)
  mathml: { type: 'mfrac', children: [...] },    // structure pour ODT
  starmath: 'over',                              // pour annotation LibreOffice
  category: 'fractions'                          // pour formula-assistant UI
}
```

## Modules par target

| Module | Rôle | Target |
|---|---|---|
| `js/export/latex-parser.js` | LaTeX string → AST (tokens, nodes) | DOCX + ODT |
| `js/export/latex-to-omml.js` | AST → OMML XML | DOCX (Word) |
| `js/export/latex-to-mathml.js` | AST → MathML XML + StarMath | ODT (LibreOffice) |
| `js/export/document-formatter.js` | postProcessLatex / latexToUnicode | PDF (fallback) |
| `js/renderers/math-renderer.js` | LaTeX → SVG via MathJax | Preview navigateur |
| `js/editor/formula-assistant.js` | Modal insertion formules + preview MathJax | Éditeur visuel |

## Ajouter un symbole

1. **Catalogue** : entrée dans `math-catalog.js`
```javascript
{ latex: '\\nabla', unicode: '∇', mathml: { type: 'mo', value: '∇' }, starmath: 'nabla', category: 'operators' }
```

2. **Parser** : si syntaxe complexe (commande avec arguments), ajouter une règle dans `latex-parser.js`

3. **Converters** : si la conversion AST → cible n'est pas couverte par le mapping générique, ajouter cas dans `latex-to-omml.js` et/ou `latex-to-mathml.js`

4. **Formula Assistant** : si tu veux que le symbole soit insérable via UI, ajouter à la catégorie dans `formula-assistant.js`

5. **Tests** : 
   - Insérer dans une activité → preview navigateur (MathJax doit rendre)
   - Exporter DOCX → ouvrir dans Word, formule éditable
   - Exporter ODT → ouvrir dans LibreOffice, formule éditable
   - Exporter PDF → vérifier rendu Unicode

## Render types LaTeX (`field-constraints.js`)

| Type | LaTeX accepté ? |
|---|---|
| `html+latex` | OUI — `\(...\)` rendu MathJax dans preview, conservé en export DOCX/ODT |
| `html` | NON — strip ou converti Unicode |
| `unicode` | NON — converti immédiatement (`\frac{a}{b}` → `a/b`) |
| `unicode+markers` | NON — comme unicode + préserve markers H5P |
| `plain` | NON — strip total |

Si tu changes un champ vers `html+latex`, propager les directives dans les prompts : `node scripts/update-locale-latex.mjs`.

## Pipeline d'export math (détail)

```
JSON activité contenant "Soit \(x = \frac{a}{b}\)"
  ↓
document-formatter.js (keepLatex: true pour DOCX/ODT)
  → identifie segments LaTeX entre \( et \)
  ↓
latex-parser.js
  → AST: Text("Soit "), Math(Frac(Var(a), Var(b)))
  ↓
DOCX: latex-to-omml.js → <m:f><m:num>a</m:num><m:den>b</m:den></m:f>
       → docx.js Math object → embedded in DOCX
ODT  : latex-to-mathml.js → <math><mfrac>...</mfrac></math> + <annotation>over(a, b)</annotation>
       → injected in content.xml
PDF  : latexToUnicode → "a/b" (fallback Unicode)
```

## Cas particuliers

- **Modes display vs inline** : `\(...\)` (inline) vs `\[...\]` (display) — le parser distingue, le rendu peut différer
- **Matrices** : `\begin{matrix}...\end{matrix}` — parsing complexe (rangées, colonnes), bien testé
- **Symboles non couverts** : actuellement ~177, si on tape `\foo` non catalogué → laissé brut en PDF, peut casser DOCX/ODT
- **Doubles backslashes** : le LLM produit souvent `\\frac` au lieu de `\frac` — corrigé par `json-healer.js` avant arrivée dans le parser

## Tests

- `tests/field-constraints-dashboard.html` montre les render types
- Pas de tests automatisés purs sur le parser → tester manuellement avec activités contenant LaTeX
- Pour debug parser : `node -e "import('./js/export/latex-parser.js').then(m => console.log(JSON.stringify(m.parse('\\\\frac{a}{b}'), null, 2)))"`

## Pièges connus

- **MathJax 3.2.2 chargement** : lazy via `lib-loader.js` — première formule lente, ensuite rapide
- **LibreOffice** sans annotation StarMath : MathML rendu mais l'éditeur math ne s'ouvre pas → toujours injecter `<annotation>...</annotation>`
- **Word + OMML mal formé** : silencieusement refuse le DOCX entier ("fichier corrompu") — tester chaque change
- **Unicode pauvre** : `\nexists`, `\not\in` n'ont pas d'équivalent Unicode propre → fallback approximatif acceptable
- **HTML escape vs LaTeX** : `<` dans une formule LaTeX ne doit PAS être HTML-escapé en `&lt;` — la richtext-editor doit séparer les zones
- **Caramelia** ne parse pas le LaTeX — affichage tel quel dans les messages

## Fichiers touchés

```
js/export/math-catalog.js               [ajout symbole]
js/export/latex-parser.js               [si nouvelle syntaxe]
js/export/latex-to-omml.js              [DOCX]
js/export/latex-to-mathml.js            [ODT]
js/renderers/math-renderer.js           [preview MathJax]
js/editor/formula-assistant.js          [UI insertion]
```
