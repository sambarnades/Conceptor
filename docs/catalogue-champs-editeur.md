# Catalogue exhaustif des champs editeur — Reference Caramel

> Derniere mise a jour : 2026-03-24
> Source : `content-detector.js` (schemas), `field-constraints.js` (contraintes), `richtext-editor.js` (editeur)

## Legende

| Col. | Signification |
|------|---------------|
| **Type editeur** | Type dans content-detector.js : `text` (input 1 ligne), `textarea` (multi-lignes), `select`, `checkbox`, etc. |
| **Contrainte** | Render type dans field-constraints.js : `html+latex`, `html`, `unicode+markers`, `unicode`, `plain`, `plain+letters` |
| **Editeur richtext** | Ce que l'utilisateur voit : `WYSIWYG complet` (toolbar complete), `WYSIWYG compact` (toolbar minimale), `Marqueurs` (surlignage *mot*), `Input simple` (pas de richtext), `-` (pas un champ texte) |
| **Processeur** | Traitement dans le processeur H5P/Moodle : `FTH` = formatTextToHtml(), `CUSTOM` = nettoyeur specifique, `pass` = passe tel quel |
| **Export doc** | Traitement dans document-formatter.js : `cleanHtml` = nettoye et preserve le formatage, `brut` = texte brut |

### Regles d'activation du richtext

1. `textarea` + contrainte `html+latex` → **WYSIWYG complet** (B, I, U, S, Sup, Sub, Couleur, Listes, Lien, Formule, Source)
2. `textarea` + contrainte `html` → **WYSIWYG complet** sans bouton Formule
3. `textarea` + contrainte `unicode+markers` → **Editeur marqueurs** (Marquer, Retirer, Source)
4. `text` + contrainte `html+latex` ou `html` → **WYSIWYG compact** (B, I, Sup, Sub, Formule, Source)
5. Tout autre cas → **Input simple** (pas de richtext)

---

## H5P — MultipleChoice

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `question` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `answers[].text` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `answers[].correct` | checkbox | - | - | pass | - |
| `answers[].tipsAndFeedback.tip` | textarea | html | WYSIWYG (sans math) | pass | cleanHtml |
| `answers[].tipsAndFeedback.chosenFeedback` | textarea | html | WYSIWYG (sans math) | pass | cleanHtml |
| `answers[].tipsAndFeedback.notChosenFeedback` | textarea | html | WYSIWYG (sans math) | pass | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - (editeur specifique) | pass | cleanHtml |
| `behaviour.*` | checkbox/number/select | - | - | pass | - |
| `mediaImage` | image | - | - | pass | image |

## H5P — TrueFalse

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `question` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `correct` | select | plain | - | pass | - |
| `feedbackOnCorrect` | textarea | html | WYSIWYG (sans math) | pass | cleanHtml |
| `feedbackOnWrong` | textarea | html | WYSIWYG (sans math) | pass | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `mediaImage` | image | - | - | pass | image |

## H5P — FillInTheBlanks

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `questions[]` | textarea (isArrayValue) | unicode+markers | Editeur marqueurs | pass (*reponse:indice*) | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `mediaImage` | image | - | - | pass | image |

## H5P — DragTheWords

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `textField` | textarea | unicode+markers | Editeur marqueurs | CUSTOM cleanDragTextTextField | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `mediaImage` | image | - | - | pass | image |

## H5P — MarkTheWords

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `textField` | textarea | unicode+markers | Editeur marqueurs | CUSTOM cleanMarkTheWordsTextField | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `mediaImage` | image | - | - | pass | image |

## H5P — Flashcards

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | plain | Input simple | pass | brut |
| `description` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `cards[].text` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `cards[].answer` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `cards[].tip` | textarea (collapsible) | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `cards[].image` | image | - | - | pass | image |

## H5P — DialogCards

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | plain | Input simple | CUSTOM formatDialogText | brut |
| `description` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `dialogs[].text` | textarea | html+latex | WYSIWYG complet | CUSTOM formatDialogText | cleanHtml |
| `dialogs[].answer` | textarea | html+latex | WYSIWYG complet | CUSTOM formatDialogText | cleanHtml |
| `dialogs[].tips.front` | text | html | Input simple | FTH | cleanHtml |
| `dialogs[].tips.back` | text | html | Input simple | FTH | cleanHtml |
| `dialogs[].image` | image | - | - | pass | image |

## H5P — Glossary (Accordion)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `items[].title` | text | unicode | Input simple | pass (latexToUnicode via healer) | cleanHtml |
| `items[].text` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |

## H5P — Essay

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `keywords[].keyword` | text | plain | Input simple | pass | cleanHtml |
| `solution.introduction` | textarea (collapsible) | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `solution.sample` | textarea (collapsible) | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `mediaImage` | image | - | - | pass | image |

## H5P — Summary

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `intro` | textarea | plain | Input simple (pas de richtext) | pass | cleanHtml |
| `summaries[].summary[]` | text (isArrayValue) | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `summaries[].tip` | textarea (collapsible) | html | WYSIWYG (sans math) | pass | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |

## H5P — SingleChoiceSet

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `choices[].question` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `choices[].answers` | stringArray | html+latex | Input simple (stringArray) | FTH | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |

## H5P — Crossword

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | - | Input simple | pass | brut |
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `words[].answer` | text | plain+letters | Input simple | pass | brut |
| `words[].clue` | text | plain | Input simple | pass | cleanHtml |
| `words[].extraClue.params.text` | text (collapsible) | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |
| `backgroundImage` | image | - | - | pass | - |
| `theme.*` | color/select | - | - | pass | - |

## H5P — SortParagraphs

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `paragraphs[]` | text (isArrayValue) | html+latex | WYSIWYG compact | CUSTOM formatParagraphText | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |

## H5P — FindTheWords

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `taskDescription` | textarea | html+latex | WYSIWYG complet | CUSTOM stripFormatting | cleanHtml |
| `wordList` | tagList | plain | Input simple (tagList) | pass | brut |

## H5P — Chart

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `figureDefinition` | textarea | - | Input simple (pas de contrainte) | pass | brut |
| `graphMode` | select | plain | - | pass | - |
| `listOfTypes[].text` | text | unicode | Input simple | pass | brut |
| `listOfTypes[].value` | number | plain | - | pass | - |
| `listOfTypes[].color` | color | plain | - | pass | - |

## H5P — Timeline

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `timeline.headline` | text | - | Input simple | pass | cleanHtml |
| `timeline.text` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `timeline.date[].startDate` | timelineDate | plain | - (editeur date) | pass | brut |
| `timeline.date[].headline` | text | - | Input simple | pass | cleanHtml |
| `timeline.date[].text` | textarea | html+latex | WYSIWYG complet | FTH | cleanHtml |
| `timeline.date[].tag` | text | - | Input simple | pass | brut |
| `timeline.era[].headline` | text | - | Input simple | pass | cleanHtml |
| `timeline.era[].text` | textarea | html+latex | WYSIWYG complet | Custom div wrapping | cleanHtml |
| `theme.*` | color/select | - | - | pass | - |

## H5P — DragAndDrop

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | plain | Input simple | pass | brut |
| `elements[].text` | text | html+latex | WYSIWYG compact | FTH (via AdvancedText) | cleanHtml |
| `elements[].image` | image | - | - | pass | image |
| `elements[].zoneIndices` | multiCheckbox | - | - | pass | - |
| `dropZones[].label` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `backgroundImage` | image | - | - | pass | image |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |

## H5P — CoursePresentation (conteneur)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` (global) | - | plain | - | pass | brut |
| `slides[].type` | select | - | - | pass | - |
| `slides[].title` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `slides[].subtitle` | text | html+latex | WYSIWYG compact | FTH | cleanHtml |
| `slides[].text` | textarea | html+latex | WYSIWYG complet | FTH (via buildContentElement) | cleanHtml |
| `slides[].table.headers[]` | text (stringArray) | html+latex | Input simple | FTH | cleanHtml |
| `slides[].table.rows[][]` | stringArray | html+latex | Input simple | FTH | cleanHtml |
| `slides[].exercise.*` | dynamicObject | (delegue) | (delegue au sous-type) | (delegue) | (delegue) |
| `slides[].slideImage` | image | - | - | pass | image |
| `slides[].backgroundColor` | color | plain | - | pass | - |

## H5P — QuizSet (conteneur)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | - | Input simple | pass | brut |
| `progressType` | select | plain | - | pass | - |
| `passPercentage` | number | plain | - | pass | - |
| `questions[].library` | select | - | - | pass | - |
| `questions[].metadata.title` | text | - | Input simple | pass | brut |
| `questions[].params.*` | dynamicObject | (delegue via .params. fallback) | (delegue au sous-type) | transformForQuizSet() | cleanHtml |
| `overallFeedback` | feedbackRanges | html | - | pass | cleanHtml |

---

## Elea — QCM (elea_qcm)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | - | Input simple | pass | brut |
| `questions[].text` | textarea | html+latex | WYSIWYG complet | pass (Moodle XML format=1) | cleanHtml |
| `questions[].answers[].text` | text | html+latex | WYSIWYG compact | pass | cleanHtml |
| `questions[].answers[].iscorrect` | checkbox | - | - | pass | - |

## Elea — Appariement (elea_appariement)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | - | Input simple | pass | brut |
| `intro` | textarea | html+latex | WYSIWYG complet | pass | cleanHtml |
| `pairs[].question` | text | html+latex | WYSIWYG compact | pass | cleanHtml |
| `pairs[].answer` | text | html+latex | WYSIWYG compact | pass | cleanHtml |

## Elea — Glossaire (elea_glossaire)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `name` | text | - | Input simple | pass | brut |
| `entries[].concept` | text | plain | Input simple | pass (XML escape) | cleanHtml |
| `entries[].definition` | textarea | html+latex | WYSIWYG complet | pass (Moodle definitionformat=1) | cleanHtml |
| `entries[].aliases` | stringArray | - | Input simple | pass | cleanHtml |

## Elea — Millionnaire (elea_millionnaire)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | - | Input simple | pass | brut |
| `questions[].question` | textarea | plain | Input simple (pas de richtext) | pass | cleanHtml |
| `questions[].goodanswer` | text | plain | Input simple | pass | cleanHtml |
| `questions[].badanswer` | stringArray | plain | Input simple | pass | cleanHtml |

## Elea — Page (elea_page)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | plain | Input simple | pass | brut |
| `intro` | textarea | html+latex | WYSIWYG complet | pass | cleanHtml |
| `theme` | select | - | - | pass | - |
| `blocks[].type` | select | - | - | pass | - |
| `blocks[].data.*` (textarea) | textarea | html+latex | WYSIWYG complet | pass (HTML dans Moodle) | cleanHtml |
| `blocks[].data.*` (text) | text | html+latex | WYSIWYG compact | pass | cleanHtml |

### Sous-champs Page par type de bloc

| Bloc | Champs textarea (WYSIWYG) | Champs text (compact ou simple) |
|------|--------------------------|--------------------------------|
| #01 Hero Header | - | title, subtitle |
| #02 Nav Summary | - | links[].text, links[].href |
| #03 Histo Reperes | cards[].text | title, cards[].title |
| #04 Callout Set | callouts[].text | title |
| #05 Stats Cards | stats[].label | title, stats[].value |
| #06 Lexique Table | - | title, caption, headers (stringArray), rows (stringArray) |
| #07 Glossary Chips | - | title, chips (stringArray) |
| #08 Monuments Grid | cards[].text | title, cards[].title, cards[].img_src, cards[].img_alt |
| #09 Figures Comparison | text | title, left.img_src/alt/caption, right.img_src/alt/caption |
| #10 Table Comparison | - | title, headers (stringArray), rows (stringArray) |
| #11 Definition Box | text | title |
| #12 Context Paragraphs | - | title, paragraphs (stringArray) |
| #13 Monument Sheet Long | sections[].text | title, img_src, img_alt, sections[].subtitle |
| #14 FAQ Block | questions[].q, questions[].a | title |
| #15 Myths Realities | items[].myth, items[].reality | title |
| #16 Method Image Desc | caption | title, img_src, img_alt, steps (stringArray) |
| #17 Quote Bilingual | quote_langue_initiale, quote_langue_arrivee | author |
| #18 Sitography | - | title, links[].href, links[].text |

## Elea — Test (elea_test)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `bank_name` | text | - | Input simple | pass | brut |
| `bank_description` | textarea | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].type` | select | - | - | pass | - |
| `questions[].content.questiontext` | textarea | html+latex | WYSIWYG complet | pass (Moodle XML) | cleanHtml |
| `questions[].content.answers[].text` | text | html+latex | WYSIWYG compact | pass | cleanHtml |
| `questions[].content.answers[].feedback` | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.feedback` | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.correctfeedback` | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.partiallycorrectfeedback` | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.incorrectfeedback` | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.subquestions[].text` | text | html+latex | WYSIWYG compact | pass | cleanHtml |
| `questions[].content.subquestions[].answer` | text | plain | Input simple | pass | cleanHtml |
| `questions[].content.answer.feedback_true` (VF) | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.answer.feedback_false` (VF) | textarea (collapsible) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.answer.feedback` (Num.) | textarea | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.hints[]` | textarea (isArrayValue) | html+latex | WYSIWYG complet | pass | cleanHtml |
| `questions[].content.questiontext` (cloze) | **cloze** | - | **Editeur visuel Cloze** (chips + modale) | pass (healClozeQuestiontext) | processClozeForStatement/Correction |

> Les feedbacks sont exportes dans la section Correction du document.
> Le champ Cloze utilise un editeur visuel dedie avec des chips colores (bleu=QCM, jaune=reponse courte, vert=numerique) et une modale de configuration par trou.

## Elea — Devoir (elea_devoir)

| Champ | Type editeur | Contrainte | Editeur richtext | Processeur | Export doc |
|-------|-------------|------------|-----------------|------------|-----------|
| `title` | text | unicode | Input simple | pass | brut |
| `description` (alias `intro`) | textarea | html+latex | WYSIWYG complet | pass | cleanHtml |
| `rubricName` | text | unicode | Input simple | pass | brut |
| `criteria` | rubricGrid | unicode | - (editeur grille specifique) | pass | cleanHtml |

---

## Statistiques

| Metrique | Valeur |
|----------|--------|
| Types d'activites | 29 (21 H5P + 8 Elea) |
| Champs texte editables | ~180+ |
| Champs avec WYSIWYG complet | ~45 (textarea + html+latex) |
| Champs avec WYSIWYG compact | ~25 (text + html+latex) |
| Champs avec editeur marqueurs | 3 (textField DragTheWords, MarkTheWords, questions FillInTheBlanks) |
| Champs sans richtext | ~110+ (plain, unicode, select, checkbox, number, etc.) |
| Formules LaTeX supportees | Partout ou html+latex est declare |
| Export document verifie | 35/35 formatters avec cleanHtml + postProcessLatex |

---

## Pipeline de traitement du contenu

```
1. Donnees brutes (JSON de l'IA ou modifie par l'utilisateur)
   Format : Markdown (**gras**, *italique*) + LaTeX (\(...\)) + HTML inline (<u>, <s>, <span style>, <a>)

2. Editeur richtext (WYSIWYG)
   Affichage : Markdown → HTML visuel, LaTeX → spans proteges MathJax
   Sauvegarde : HTML → Markdown, spans LaTeX → \(...\) brut, couleur/liens preserves en HTML

3. Processeur H5P/Moodle
   formatTextToHtml() : **gras** → <strong>, *italique* → <em>, \n → <p>, LaTeX preserve
   Ou : pass-through (Moodle XML format=1 accepte le HTML directement)

4. Package H5P (.h5p) / Moodle (.mbz)
   Le contenu HTML est dans le JSON, H5P.MathDisplay rend le LaTeX via MathJax CDN

5. Export document (DOCX/ODT/PDF)
   cleanHtml() : preserve Markdown + HTML inline (couleur, liens, u, s, sub, sup)
   postProcessLatex() : \(\frac{a}{b}\) → a/b (Unicode), \(\alpha\) → α
   parseMarkdownToTextRuns() : **gras** → TextRun bold, <span style="color"> → TextRun color, etc.
```
