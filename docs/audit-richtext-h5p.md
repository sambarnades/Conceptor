# Audit de coherence : Editeur Richtext / Semantics H5P / Processeurs / Contraintes

> Derniere mise a jour : 2026-03-24
> Genere par audit croise de `semantics.json`, `field-constraints.js`, `processors/*.js`, `content-detector.js`

---

## Legende

| Symbole | Signification |
|---------|---------------|
| HTML | `widget: "html"` dans semantics.json (editeur CKEditor natif H5P) |
| PLAIN | `type: "text"` sans widget (texte brut dans editeur natif) |
| TAGS | Tags HTML autorises dans semantics (ex: strong, em, sub, sup) |
| FTH | `formatTextToHtml()` appele dans le processeur |
| CUSTOM | Fonction de nettoyage specifique (cleanDragText, formatDialogText, etc.) |
| TA | `type: 'textarea'` dans content-detector.js (recoit l'editeur richtext) |
| TXT | `type: 'text'` dans content-detector.js (reste un input simple) |

---

## 1. MultipleChoice (H5P.MultiChoice-1.16)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `question` | HTML [strong,em,sub,sup,h2,h3,pre,code] | html+latex | FTH | TA | OUI |
| `answers[].text` | HTML [strong,em,sub,sup,code] | html+latex | FTH | TXT | OUI |
| `answers[].tipsAndFeedback.tip` | HTML [p,br,strong,em,a,code] | html | pass-through | TA | OK (feedback simple) |
| `answers[].tipsAndFeedback.chosenFeedback` | HTML [strong,em,sub,sup,a,code] | html | pass-through | TA | OK |
| `answers[].tipsAndFeedback.notChosenFeedback` | HTML [strong,em,sub,sup,a,code] | html | pass-through | TA | OK |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

> Note : Les feedbacks ne passent pas par `formatTextToHtml()` car ils sont saisis directement en HTML/Markdown par l'utilisateur et le player H5P les rend via innerHTML. C'est coherent.

---

## 2. TrueFalse (H5P.TrueFalse-1.8)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `question` | HTML [strong,em,sub,sup,h2,h3,pre,code] | html+latex | FTH | TA | OUI |
| `correct` | radioGroup | plain | pass-through | select | OUI |
| `feedbackOnCorrect` | PLAIN | html | pass-through | TA | OK |
| `feedbackOnWrong` | PLAIN | html | pass-through | TA | OK |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 3. FillInTheBlanks (H5P.Blanks-1.14)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `questions[]` | HTML [strong,em,del,u,code] | unicode+markers (blanks) | pass-through (*reponse*) | TA | OUI (marqueurs) |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 4. DragTheWords (H5P.DragText-1.10)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `textField` | HTML [strong,em,del,u,code] | unicode+markers (dragtext) | CUSTOM cleanDragTextTextField() | TA | OUI (marqueurs) |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 5. MarkTheWords (H5P.MarkTheWords-1.11)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `textField` | HTML [strong,em,del,u,code] | unicode+markers (markthewords) | CUSTOM cleanMarkTheWordsTextField() | TA | OUI (marqueurs) |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 6. Flashcards (H5P.Flashcards-1.7)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `title` | PLAIN | plain | pass-through | TXT | OUI |
| `description` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `cards[].text` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `cards[].answer` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `cards[].tip` | HTML [p,br,strong,em,code] | html+latex | FTH | TA | OUI |

> (1) ATTENTION : le semantics.json de H5P.Flashcards ne declare PAS `widget: "html"` pour ces champs.
> MAIS le player utilise `innerHTML` / jQuery `.html()` pour les afficher (verifie dans flashcards.js L324, L511).
> Donc le HTML est bien rendu en pratique. Le semantics est sous-specifie, pas le comportement reel.
> **Conclusion : coherent en pratique, semantics H5P a mettre a jour si on contribue upstream.**

---

## 7. Glossary (H5P.Accordion-1.0)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `panels[].title` | PLAIN | unicode | pass-through (latexToUnicode via healer) | TXT | OUI |
| `panels[].text` (via H5P.AdvancedText) | library | html+latex | FTH | TA | OUI |

> Alias editeur : `items[].title` et `items[].text` declares dans field-constraints.js.

---

## 8. Timeline (H5P.Timeline-1.1)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `timeline.text` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `timeline.date[].text` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `timeline.era[].text` | PLAIN (pas de widget) | html+latex | Custom div wrapping | TA | ATTENTION (1) |
| `timeline.date[].startDate` | PLAIN | plain | pass-through | date | OUI |

> (1) Meme situation que Flashcards : le semantics ne declare pas widget="html" mais le player rend le HTML.

---

## 9. Crossword (H5P.Crossword-0.5)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `words[].clue` | PLAIN | **plain** | pass-through | TXT | OUI |
| `words[].answer` | PLAIN | plain+letters | pass-through | TXT | OUI |
| `words[].extraClue.params.text` | (H5P.AdvancedText) | html+latex | FTH | TA | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

> Correction appliquee : `words[].clue` etait declare `html+latex` mais corrige en `plain` (le player affiche en texte brut).

---

## 10. Essay (H5P.Essay-1.5)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `keywords[].keyword` | PLAIN | plain | pass-through | TXT | OUI |
| `solution.introduction` | HTML [strong,em,u,a,ul,ol,hr,code] | html+latex | FTH | TA | OUI |
| `solution.sample` | HTML [strong,a] | html+latex | FTH | TA | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

> Correction appliquee : `solution.introduction` et `solution.sample` passent maintenant par `formatTextToHtml()`.

---

## 11. DialogCards (H5P.Dialogcards-1.9)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `title` | PLAIN (pas de widget) | html | CUSTOM formatDialogText() | TA | ATTENTION (1) |
| `description` | PLAIN (pas de widget) | html+latex | FTH | TA | ATTENTION (1) |
| `dialogs[].text` | PLAIN (pas de widget) | html+latex | CUSTOM formatDialogText() | TA | ATTENTION (1) |
| `dialogs[].answer` | PLAIN (pas de widget) | html+latex | CUSTOM formatDialogText() | TA | ATTENTION (1) |
| `dialogs[].tips.front` | HTML [p,br,strong,em,code] | html | FTH | TA | OUI |
| `dialogs[].tips.back` | HTML [p,br,strong,em,code] | html | FTH | TA | OUI |

> (1) Meme situation que Flashcards — semantics sous-specifie mais player rend le HTML.

---

## 12. Summary (H5P.Summary-1.10)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `intro` | PLAIN | plain | pass-through | TA | OUI |
| `summaries[].summary[]` | PLAIN | html+latex | FTH | TXT | ATTENTION (2) |
| `summaries[].tip` | HTML [p,br,strong,em,code] | html | pass-through | TA | OK |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

> (2) `summaries[].summary[]` : semantics dit PLAIN mais le processeur applique `formatTextToHtml()` (correction recente). Meme logique que Flashcards.
> Correction appliquee : le processeur formate maintenant les statements.

---

## 13. SingleChoiceSet (H5P.SingleChoiceSet-1.11)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `choices[].question` | HTML [strong,em,sub,sup,code] | html+latex | FTH | TA | OUI |
| `choices[].answers[]` | HTML [strong,em,sub,sup,code] | html+latex | FTH | TXT | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

> Correction appliquee : questions et reponses passent maintenant par `formatTextToHtml()`.

---

## 14. DragAndDrop (H5P.DragQuestion-1.14)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `title` | PLAIN | plain | pass-through | TXT | OUI |
| `elements[].text` | (via H5P.AdvancedText) | html+latex | FTH (dans AdvancedText wrapper) | TA | OUI |
| `dropZones[].label` | HTML [strong,em,del,code] | html+latex | FTH | TXT | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 15. SortParagraphs (H5P.SortParagraphs-0.11)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | FTH | TA | OUI |
| `paragraphs[]` | HTML [strong,em,u,ul,ol,h2,h3,hr,pre,code] | html+latex | CUSTOM formatParagraphText() | TXT | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |

---

## 16. FindTheWords (H5P.FindTheWords-1.4)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `taskDescription` | HTML [strong,em,u,a,ul,ol,h2,h3,hr,pre,code] | html+latex | CUSTOM stripFormatting() | TA | OUI |
| `wordList` | PLAIN | plain | pass-through | tagList | OUI |

---

## 17. Chart (H5P.Chart-1.2)

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `listOfTypes[].text` | PLAIN | unicode | pass-through | chart editor | OUI |
| `listOfTypes[].value` | number | plain | pass-through | number | OUI |
| `listOfTypes[].color` | color | plain | pass-through | color | OUI |
| `graphMode` | select | plain | pass-through | select | OUI |

---

## 18. CoursePresentation (H5P.CoursePresentation-1.26) — Conteneur

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `title` | PLAIN | plain | pass-through | TXT | OUI |
| `slides[].title` | HTML [strong,em,sub,sup,h3,code] | html+latex | FTH | TA | OUI |
| `slides[].subtitle` | HTML [strong,em,sub,sup,h3,code] | html+latex | FTH | TA | OUI |
| `slides[].text` | HTML (via AdvancedText) | html+latex | FTH (via buildContentElement) | TA | OUI |
| `slides[].table.headers[]` | HTML [strong,em,code] | html+latex | FTH | table editor | OUI |
| `slides[].table.rows[][]` | HTML [strong,em,code] | html+latex | FTH | table editor | OUI |
| `slides[].exercise.*` | (delegue au sous-type) | (delegue) | (delegue via processChild) | dynamicObject | OUI |

> Correction appliquee : `slides[].title` et `slides[].subtitle` passent maintenant par `formatTextToHtml()`.

---

## 19. QuizSet (H5P.QuestionSet-2.17) — Conteneur

| Champ | Semantics | Contrainte | Processeur | Editeur | Coherent |
|-------|-----------|------------|------------|---------|----------|
| `progressType` | select | plain | pass-through | select | OUI |
| `passPercentage` | number | plain | pass-through | number | OUI |
| `overallFeedback[].feedback` | PLAIN | html | feedbackRanges | TA | OK |
| `questions[].params.*` | (delegue au sous-type) | (delegue via fallback .params.) | transformForQuizSet() | dynamicObject | OUI |

> Resolution des sous-champs : `resolveRenderTypeForField('QuizSet', 'questions.0.params.question')` → extrait le sous-chemin apres `.params.` et cherche dans tous les modules.

---

## 20. Modules Moodle

### QCM
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `questions[].text` | html+latex | FTH | TA | OUI |
| `questions[].answers[].text` | html+latex | FTH | TXT | OUI |
| `questions[].answers[].feedback` | html | pass-through | TA | OK |

### Appariement
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `intro` | html+latex | pass-through | TA | OK |
| `pairs[].question` | html+latex | pass-through | TXT | OUI |
| `pairs[].answer` | html+latex | pass-through | TXT | OUI |

### Page
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `title` | plain | pass-through | TXT | OUI |
| `blocks[].data` | html+latex | pass-through | pageBlockData | OUI |
| `intro` | html+latex | pass-through | TA | OUI |

### Millionnaire
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `questions[].question` | plain | pass-through | TA | OUI (pas de richtext) |
| `questions[].goodanswer` | plain | pass-through | TXT | OUI |
| `questions[].badanswer[]` | plain | pass-through | TXT | OUI |

### Test
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `questions[].questiontext` | html+latex | pass-through | TA | OUI |
| `questions[].answers[].text` | html+latex | pass-through | TXT | OUI |
| `questions[].subquestions[].text` | html+latex | pass-through | TA | OUI |
| `questions[].subquestions[].answer` | plain | pass-through | TXT | OUI |

### Glossaire
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `entries[].concept` | plain | pass-through | TXT | OUI |
| `entries[].definition` | html+latex | pass-through (Moodle definitionformat=1 = HTML) | TA | OUI |

### Devoir
| Champ | Contrainte | Processeur | Editeur | Coherent |
|-------|------------|------------|---------|----------|
| `title` | unicode | pass-through | TXT | OUI |
| `intro` | html+latex | pass-through | TA | OUI |
| `rubricName` | unicode | pass-through | TXT | OUI |
| `criteria[].description` | unicode | pass-through | TA | OUI (pas de richtext) |
| `criteria[].levels[].definition` | unicode | pass-through | TA | OUI |

---

## Regles de coherence

### Quand un champ a l'editeur richtext (WYSIWYG) ?

Un champ recoit l'editeur richtext **si et seulement si** :
1. Il est declare `type: 'textarea'` dans content-detector.js
2. `resolveRenderTypeForField()` retourne `html+latex`, `html`, ou `unicode+markers`
3. field-constraints.js le declare **explicitement** avec l'un de ces types

Les champs `type: 'text'` (inputs une ligne) ne recoivent **jamais** le richtext, meme s'ils sont declares `html+latex` dans les contraintes.

### Quand `formatTextToHtml()` est appele dans le processeur ?

Pour tous les champs declares `html+latex` dans field-constraints.js et qui ont un contenu textuel (pas des feedbackRanges ou des selects).

Exception : les champs `unicode+markers` utilisent des fonctions custom (`cleanDragTextTextField`, `cleanMarkTheWordsTextField`) qui convertissent le LaTeX en Unicode et preservent les marqueurs.

### Preview MathJax

MathJax est injecte dans l'iframe de preview H5P par `h5p-manager.js` → `_renderMathInPreview()`.
Dans Elea/Moodle, c'est `H5P.MathDisplay` (inclus dans les dependances du package) qui charge MathJax depuis un CDN.

---

## Corrections appliquees pendant cet audit

| Fichier | Correction |
|---------|-----------|
| `processors/CoursePresentation.js` | `slides[].title` et `slides[].subtitle` passent par `formatTextToHtml()` |
| `processors/SingleChoiceSet.js` | `choices[].question` et `choices[].answers[]` passent par `formatTextToHtml()` |
| `processors/Summary.js` | `summaries[].summary[]` passent par `formatTextToHtml()` |
| `processors/Essay.js` | `solution.introduction` et `solution.sample` passent par `formatTextToHtml()` |
| `field-constraints.js` | `Crossword.words[].clue` corrige de `html+latex` vers `plain` |
| `field-constraints.js` | Alias `items[].title` et `items[].text` ajoutes pour le Glossary |
| `field-constraints.js` | `Appariement.intro` ajoute |
| `h5p-manager.js` | Injection MathJax dans l'iframe de preview |
