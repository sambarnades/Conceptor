# PRD — Contraintes de champs par activité & enrichissement des prompts LaTeX

**Version :** 1.0
**Date :** 2026-03-13
**Statut :** En attente de validation
**Auteur :** Claude (assisté par l'équipe Caramel)

---

## Table des matières

1. [Contexte et problème](#1-contexte-et-problème)
2. [Objectifs](#2-objectifs)
3. [Partie A — Tableau de bord des contraintes de champs](#3-partie-a--tableau-de-bord-des-contraintes-de-champs)
4. [Partie B — Refactorisation de healActivitySpecificFields](#4-partie-b--refactorisation-de-healactivityspecificfields)
5. [Partie C — Enrichissement des prompts avec exemples mathématiques](#5-partie-c--enrichissement-des-prompts-avec-exemples-mathématiques)
6. [Partie D — Dashboard HTML (optionnel)](#6-partie-d--dashboard-html-optionnel)
7. [Stratégie de tests](#7-stratégie-de-tests)
8. [Ordre d'implémentation](#8-ordre-dimplémentation)
9. [Risques et mitigations](#9-risques-et-mitigations)

---

## 1. Contexte et problème

### 1.1 Situation actuelle

Caramel génère du contenu pédagogique via des LLM qui produisent du JSON contenant parfois des formules mathématiques en LaTeX. Le pipeline de healing (`json-healer.js`) applique des transformations globales puis des corrections par activité avant que les processeurs H5P/Moodle ne formatent le contenu final.

**Problème central :** Le player H5P ne supporte pas le LaTeX de la même façon dans tous les champs d'une activité. Certains champs acceptent du HTML avec MathJax (`\(...\)`), d'autres n'acceptent que du texte brut (Unicode). La logique de conversion est aujourd'hui dispersée dans :

- `healActivitySpecificFields()` — seulement 4 types H5P traités explicitement (MarkTheWords, DragTheWords, FillInTheBlanks, Chart) + CoursePresentation et QuizSet par délégation
- Les processeurs eux-mêmes — qui appliquent `formatTextToHtml()` sans distinction
- Les prompts — qui donnent des instructions LaTeX trop vagues (seulement `(2^3)^2` comme exemple)

**Conséquences :**
- Des formules LaTeX brutes apparaissent dans des champs qui ne les supportent pas (ex: `\alpha` affiché tel quel dans un titre de Glossary)
- Pas de conversion LaTeX→Unicode dans 14 types H5P sur 20
- Les prompts ne guident pas assez l'IA sur la diversité des formules mathématiques

### 1.2 Types de rendu identifiés

| Code | Description | Exemple de sortie |
|------|-------------|-------------------|
| `html+latex` | HTML avec MathJax — le LaTeX `\(...\)` est rendu visuellement | `<p>La dérivée est \(\frac{df}{dx}\)</p>` |
| `html` | HTML sans math — le formatage Markdown est converti en HTML | `<p><strong>Titre</strong></p>` |
| `unicode` | Texte brut — les formules LaTeX sont converties en caractères Unicode | `α² + β² = γ²` |
| `unicode+markers` | Texte avec marqueurs `*mot*` — LaTeX converti en Unicode dans et hors marqueurs | `La *dérivée* de x² est 2x` |
| `plain` | Texte brut strict — tout formatage supprimé | `Trouvez les mots cachés` |
| `plain+letters` | Grille de lettres — un seul caractère alphabétique par case | `ALPHA` (pas `α`) |

---

## 2. Objectifs

1. **Créer un fichier déclaratif `field-constraints.js`** qui cartographie chaque champ de chaque activité avec son type de rendu
2. **Refactoriser `healActivitySpecificFields()`** pour qu'il utilise cette table au lieu de la logique codée en dur
3. **Enrichir les prompts** avec des exemples mathématiques variés et des contraintes explicites par champ
4. **Zéro régression** — tous les tests existants (Steps 1-16) doivent continuer à passer

---

## 3. Partie A — Tableau de bord des contraintes de champs

### 3.1 Architecture du fichier

**Fichier :** `js/h5p/field-constraints.js`

```javascript
// Contraintes de rendu par champ et par activité
// Utilisé par healActivitySpecificFields() pour appliquer les bonnes conversions

export const FIELD_CONSTRAINTS = {
    // Clé = moduleKey (identique aux clés de processors/index.js)
    'Timeline': {
        fields: {
            'timeline.text':     { render: 'html+latex', description: 'Texte principal de la timeline' },
            'timeline.date.text': { render: 'html+latex', description: 'Description de chaque événement' },
            'timeline.era.text':  { render: 'html+latex', description: 'Description des ères' },
        }
    },
    // ...
};

export const RENDER_TYPES = {
    'html+latex':       { supportsLatex: true,  supportsHtml: true,  converter: null },
    'html':             { supportsLatex: false, supportsHtml: true,  converter: null },
    'unicode':          { supportsLatex: false, supportsHtml: false, converter: 'latexToUnicode' },
    'unicode+markers':  { supportsLatex: false, supportsHtml: false, converter: 'cleanMarkerText' },
    'plain':            { supportsLatex: false, supportsHtml: false, converter: 'stripAll' },
    'plain+letters':    { supportsLatex: false, supportsHtml: false, converter: 'toLettersOnly' },
};
```

### 3.2 Table complète des contraintes — Activités H5P

#### Timeline (`H5P.Timeline`)

| Champ JSON (chemin) | Type de rendu | Notes |
|---------------------|---------------|-------|
| `timeline.text` | `html+latex` | Texte principal, HTML via `formatTextToHtml()` |
| `timeline.date[].text` | `html+latex` | Description des événements |
| `timeline.era[].text` | `html+latex` | Description des ères |
| `timeline.date[].startDate` | `plain` | Format `YYYY,M,D` |

#### Flashcards (`H5P.Flashcard`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `title` | `plain` | Nom du jeu de cartes (métadonnée) |
| `description` | `html+latex` | Description via `formatTextToHtml()` |
| `cards[].text` | `html+latex` | Recto de la carte |
| `cards[].answer` | `html+latex` | Verso de la carte |
| `cards[].tip` | `html+latex` | Indice optionnel |

#### MultipleChoice (`H5P.MultiChoice`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `question` | `html+latex` | Question principale |
| `answers[].text` | `html+latex` | Texte de chaque réponse |
| `answers[].tipsAndFeedback.tip` | `html` | Indice — pas de math |
| `answers[].tipsAndFeedback.chosenFeedback` | `html` | Feedback si sélectionné |
| `answers[].tipsAndFeedback.notChosenFeedback` | `html` | Feedback si non sélectionné |
| `overallFeedback[].feedback` | `html` | Feedback global par score |

#### TrueFalse (`H5P.TrueFalse`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `question` | `html+latex` | L'affirmation à évaluer |
| `correct` | `plain` | `true` ou `false` (booléen converti en string) |
| `feedbackOnCorrect` | `html` | Feedback bonne réponse |
| `feedbackOnWrong` | `html` | Feedback mauvaise réponse |
| `overallFeedback[].feedback` | `html` | Feedback par plage de score |

#### FillInTheBlanks (`H5P.Blanks`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne (HTML) |
| `questions[]` | `unicode+markers` | Texte avec `*réponse*` — LaTeX interdit dans les marqueurs |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### MarkTheWords (`H5P.MarkTheWords`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne (HTML) |
| `textField` | `unicode+markers` | Texte avec `*mot*` — LaTeX converti en Unicode, multi-mots séparés |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### DragTheWords (`H5P.DragText`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne (HTML) |
| `textField` | `unicode+markers` | Texte avec `*mot*` — les draggables ne supportent pas le LaTeX |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### DragAndDrop (`H5P.DragQuestion`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `elements[].text` | `html+latex` | Étiquettes déplaçables |
| `dropZones[].label` | `html+latex` | Labels des zones de dépôt |
| `title` | `plain` | Titre (métadonnée) |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### Essay (`H5P.Essay`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne |
| `keywords[].keyword` | `plain` | Mots-clés à détecter (texte brut) |
| `solution.introduction` | `html+latex` | Introduction de la solution |
| `solution.sample` | `html+latex` | Exemple de réponse |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### Summary (`H5P.Summary`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `intro` | `plain` | Introduction — texte brut |
| `summaries[].summary[]` | `html+latex` | Affirmations à trier |
| `summaries[].tip` | `html` | Indice par groupe |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### SingleChoiceSet (`H5P.SingleChoiceSet`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `choices[].question` | `html+latex` | Question |
| `choices[].answers[]` | `html+latex` | Réponses (la 1re est la correcte) |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### DialogCards (`H5P.Dialogcards`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `title` | `html` | Titre du jeu (enveloppé dans `<p>`) |
| `description` | `html+latex` | Description |
| `dialogs[].text` | `html+latex` | Recto de la carte |
| `dialogs[].answer` | `html+latex` | Verso de la carte |
| `dialogs[].tips.front` | `html` | Indice recto |
| `dialogs[].tips.back` | `html` | Indice verso |

#### Glossary (`H5P.Accordion`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `panels[].title` | `plain` | Titre du panneau (en-tête accordéon) — **pas de HTML ni LaTeX** |
| `panels[].text` | `html+latex` | Contenu du panneau (enveloppé dans `H5P.AdvancedText`) |

#### Crossword (`H5P.Crossword`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne |
| `words[].clue` | `html+latex` | Indice horizontal/vertical |
| `words[].answer` | `plain+letters` | Le mot dans la grille — lettres alphabétiques uniquement |
| `words[].extraClue.params.text` | `html+latex` | Indice supplémentaire |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### FindTheWords (`H5P.FindTheWords`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `plain` | Consigne — `stripFormatting()` supprime tout |
| `wordList` | `plain+letters` | Mots à trouver — lettres uniquement dans la grille |

#### SortParagraphs (`H5P.SortParagraphs`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `taskDescription` | `html+latex` | Consigne |
| `paragraphs[]` | `html+latex` | Paragraphes à trier (via `markdownToHtml()` avec protection LaTeX) |
| `overallFeedback[].feedback` | `html` | Feedback global |

#### Chart (`H5P.Chart`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `listOfTypes[].text` | `unicode` | Labels du graphique — **pas de MathDisplay**, LaTeX→Unicode |
| `listOfTypes[].value` | `plain` | Valeur numérique |
| `listOfTypes[].color` | `plain` | Couleur CSS |
| `graphMode` | `plain` | Type de graphique (bar/pie) |

#### ComplexFillTheBlanks (`H5P.AdvancedBlanks`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| *(pass-through)* | `html+latex` | Tous les champs passent directement au format H5P |

#### CoursePresentation (`H5P.CoursePresentation`) — Conteneur

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `title` | `plain` | Titre global (métadonnée) |
| `slides[].title` | `html+latex` | Titre de chaque slide |
| `slides[].subtitle` | `html+latex` | Sous-titre |
| `slides[].text` | `html+latex` | Contenu texte (MathJax, `wrapBareMathSegments()`) |
| `slides[].table.headers[]` | `html+latex` | En-têtes de tableau |
| `slides[].table.rows[][]` | `html+latex` | Cellules de tableau |
| `slides[].exercise.*` | *(délégué)* | Voir le processeur enfant correspondant |
| `slides[].backgroundColor` | `plain` | Couleur CSS |

#### QuizSet (`H5P.QuestionSet`) — Conteneur

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `questions[].params.*` | *(délégué)* | Chaque question est traitée par son processeur enfant |
| `progressType` | `plain` | Type de progression (dots/textual) |
| `passPercentage` | `plain` | Seuil de réussite |
| `overallFeedback[].feedback` | `html` | Feedback global |

### 3.3 Table complète des contraintes — Activités Moodle

#### QCM Moodle (`simplequiz`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `questions[].text` | `html+latex` | Question (HTML dans `<p>`, MathJax supporté) |
| `questions[].answers[].text` | `html+latex` | Réponse (HTML dans `<p>`) |
| `questions[].answers[].feedback` | `html` | Feedback par réponse |

#### Appariement (`epikmatch`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `pairs[].question` | `html+latex` | Colonne gauche (HTML) |
| `pairs[].answer` | `html+latex` | Colonne droite (HTML) |

#### Page Moodle (`page`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `title` | `plain` | Titre de la page |
| `blocks[].data.*` | `html+latex` | Contenu des blocs — rendu via thème avec MathJax |
| `intro` | `html+latex` | Introduction |

#### Millionnaire (`millionairev2`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `questions[].question` | `plain` | **LaTeX INTERDIT** — texte brut uniquement |
| `questions[].goodanswer` | `plain` | Bonne réponse (texte brut) |
| `questions[].badanswer[]` | `plain` | Mauvaises réponses (texte brut) |

#### Test Moodle (`quiz` — GIFT/Cloze)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `questions[].questiontext` | `html+latex` | Texte de la question (sauf cloze) |
| `questions[].questiontext` (cloze) | `unicode` | Texte cloze — LaTeX interdit à cause de `{1:TYPE:...}` |
| `questions[].answers[].text` (shortanswer) | `plain` | Réponse courte — texte brut |
| `questions[].answers[].text` (multichoice) | `html+latex` | Réponse QCM |
| `questions[].subquestions[].answer` (matching) | `plain` | Menu déroulant — **pas de LaTeX** (pas de MathJax dans dropdown) |
| `questions[].subquestions[].text` (matching) | `html+latex` | Colonne gauche |

#### Glossaire Moodle (`glossary`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `entries[].concept` | `plain` | Terme — texte brut (échappé XML) |
| `entries[].definition` | `plain` | Définition — texte brut (échappé XML) |

#### Devoir Moodle (`assign`)

| Champ JSON | Type de rendu | Notes |
|------------|---------------|-------|
| `title` | `unicode` | Titre — LaTeX converti en Unicode |
| `intro` | `html+latex` | Instructions (HTML) |
| `rubricName` | `unicode` | Nom de la grille — LaTeX converti en Unicode |
| `criteria[].description` | `unicode` | Nom du critère — LaTeX converti en Unicode |
| `criteria[].levels[].definition` | `unicode` | Description du niveau — LaTeX converti en Unicode |

---

## 4. Partie B — Refactorisation de healActivitySpecificFields

### 4.1 État actuel

La fonction `healActivitySpecificFields()` (lignes 1620-1737 de `json-healer.js`) gère explicitement :

| Module | Traitement |
|--------|-----------|
| MarkTheWords | `cleanMarkTheWordsText()` sur `textField` |
| DragTheWords | `cleanDragTextText()` sur `textField` |
| FillInTheBlanks | `cleanBlanksText()` sur `questions[]` |
| Chart | LaTeX→Unicode sur `listOfTypes[].text` |
| CoursePresentation | Trim + nettoyage récursif des exercices enfants |
| QuizSet/QCM/VF | Nettoyage par type de library enfant |

**Activités NON traitées** (14 types) : Timeline, Flashcards, Glossary, Crossword, Essay, Summary, DragAndDrop, TrueFalse, MultipleChoice, FindTheWords, SortParagraphs, SingleChoiceSet, DialogCards, ComplexFillTheBlanks.

### 4.2 Refactorisation proposée

**Principe :** la logique de `healActivitySpecificFields()` lira `FIELD_CONSTRAINTS` et appliquera automatiquement la bonne conversion sur chaque champ, en remplacement de la logique codée en dur.

```javascript
// Pseudo-code de la nouvelle approche
export function healActivitySpecificFields(obj, moduleKey) {
    if (!obj) return obj;
    let healed = structuredClone(obj);

    const constraints = FIELD_CONSTRAINTS[moduleKey];
    if (!constraints) return healed;  // Pas de contraintes = pas de conversion

    for (const [fieldPath, config] of Object.entries(constraints.fields)) {
        applyFieldConstraint(healed, fieldPath, config);
    }

    return healed;
}

function applyFieldConstraint(obj, fieldPath, config) {
    const { render } = config;
    const converter = RENDER_TYPES[render]?.converter;
    if (!converter) return;  // html+latex = pas de conversion nécessaire

    // Résoudre le chemin (gère les tableaux via [])
    // Appliquer la fonction de conversion sur chaque valeur trouvée
    applyToPath(obj, fieldPath, CONVERTERS[converter]);
}

const CONVERTERS = {
    'latexToUnicode': (text) => { /* Convertir \(...\) en Unicode */ },
    'cleanMarkerText': (text, moduleKey) => { /* cleanMarkTheWordsText / cleanDragTextText / cleanBlanksText */ },
    'stripAll': (text) => { /* Supprimer tout formatage */ },
    'toLettersOnly': (text) => { /* Convertir en lettres alphabétiques */ },
};
```

### 4.3 Cas spéciaux à préserver

1. **CoursePresentation** : les exercices enfants doivent être traités via les contraintes de leur propre type (récursion)
2. **QuizSet** : même logique récursive — chaque `questions[].params` est traité selon `questions[].library`
3. **MarkTheWords/DragTheWords** : la conversion `unicode+markers` implique des traitements spéciaux (split multi-mots, apostrophes, `**→*` conversion) — les fonctions `cleanMarkTheWordsText()` et `cleanDragTextText()` sont conservées comme implémentations de `cleanMarkerText`
4. **FillInTheBlanks** : `cleanBlanksText()` conservée (suppression des `*...*` dans les blocs LaTeX)
5. **Crossword answers** : déjà traité dans `healStructureForActivity()` (conversion lettres grecques→noms, filtrage) — `healActivitySpecificFields` n'a rien à faire de plus
6. **FindTheWords wordList** : déjà traité dans `healStructureForActivity()` (filtrage des mots avec LaTeX/Unicode math)

### 4.4 Conversions à ajouter (nouveaux traitements)

| Module | Champ | Conversion manquante |
|--------|-------|---------------------|
| **Glossary** | `panels[].title` | `latexToUnicode` — actuellement les titres restent avec du LaTeX brut |
| **Summary** | `intro` | Pas de conversion nécessaire (déjà plain text par le processeur) |
| **SingleChoiceSet** | *(aucun champ identifié)* | Tous les champs supportent `html+latex` |
| **Essay** | `keywords[].keyword` | `stripAll` — les mots-clés ne doivent contenir que du texte |
| **DialogCards** | `title` | Le title passe par `html` (pas `html+latex`), pas de conversion math |

### 4.5 Contraintes d'implémentation

- Le fichier `field-constraints.js` est un module ES6 pur (pas de dépendances DOM)
- Les chemins de champs utilisent la notation pointée avec `[]` pour les tableaux : `panels[].title`, `slides[].table.rows[][]`
- La résolution de chemin doit être récursive et gérer les tableaux imbriqués
- Les fonctions de conversion existantes (`cleanMarkTheWordsText`, `cleanDragTextText`, `cleanBlanksText`, `_convertLatexField`) sont réutilisées, pas réécrites

---

## 5. Partie C — Enrichissement des prompts avec exemples mathématiques

### 5.1 Analyse de l'existant

Sur 28 fichiers de prompts analysés :

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| Avec instructions LaTeX | 16/28 | Mentionnent `\\( ... \\)` |
| Avec exemples math variés | 2/28 | Seulement `elea_test.md` et `course_presentation.md` |
| Avec uniquement `(2^3)^2` | 14/28 | Un seul exemple basique |
| Sans aucun math | 10/28 | Aucune instruction LaTeX |
| Interdiction explicite de LaTeX | 1/28 | `elea_millionnaire.md` |

### 5.2 Exemples mathématiques à intégrer

Chaque prompt qui accepte le LaTeX doit inclure des exemples couvrant les catégories suivantes :

#### Bloc d'exemples standard (à insérer dans chaque prompt concerné)

```markdown
### Formules mathématiques

Si le sujet s'y prête, utilise la syntaxe LaTeX avec les délimiteurs `\\( ... \\)` uniquement (jamais `$`, jamais `\\[ ... \\]`).

**Exemples de formules correctes :**
- Lettres grecques : `\\( \\alpha \\)`, `\\( \\beta \\)`, `\\( \\pi \\approx 3{,}14 \\)`
- Fractions : `\\( \\frac{1}{2} \\)`, `\\( \\frac{a+b}{c} \\)`
- Racines : `\\( \\sqrt{2} \\)`, `\\( \\sqrt[3]{8} \\)`
- Puissances et indices : `\\( x^{2} \\)`, `\\( a_{n+1} \\)`
- Ensembles : `\\( \\mathbb{R} \\)`, `\\( \\mathbb{N} \\)`, `\\( x \\in \\mathbb{Z} \\)`
- Logique : `\\( \\forall x \\in \\mathbb{R} \\)`, `\\( \\exists n \\in \\mathbb{N} \\)`
- Trigonométrie : `\\( \\sin(\\theta) \\)`, `\\( \\cos(2\\pi) \\)`
- Inégalités : `\\( x \\geq 0 \\)`, `\\( a \\leq b \\)`
- Sommes et intégrales : `\\( \\sum_{k=0}^{n} k \\)`, `\\( \\int_{0}^{1} f(x) \\, dx \\)`
- Flèches : `\\( x \\to +\\infty \\)`, `\\( f : A \\to B \\)`
```

#### Variante pour les champs `unicode` (pas de LaTeX)

```markdown
### Formules mathématiques (champs texte brut)

Dans les champs suivants, le LaTeX N'EST PAS supporté. Utilise directement les symboles Unicode :
- Lettres grecques : α, β, γ, δ, π, θ, λ, σ, φ, ω
- Opérateurs : ≤, ≥, ≠, ≈, ±, ×, ÷, √
- Ensembles : ℕ, ℤ, ℚ, ℝ, ℂ, ∈, ∉, ⊂, ⊃, ∪, ∩
- Exposants : ², ³, ⁴, ⁿ (utiliser les caractères Unicode superscript)
- Flèches : →, ←, ↔, ⇒, ⇔
- Infini : ∞
```

### 5.3 Plan d'enrichissement par fichier de prompt

| Fichier | Action | Détails |
|---------|--------|---------|
| `_multiplechoice.md` | Enrichir | Ajouter bloc standard + préciser « pas de LaTeX dans les feedbacks » |
| `_truefalse.md` | Enrichir | Ajouter bloc standard + préciser « pas de LaTeX dans les feedbacks » |
| `accordion.md` | Enrichir | Ajouter bloc standard + **spécifier que `title` = texte brut (Unicode)** |
| `chart.md` | Ajouter | Ajouter bloc Unicode (Chart ne supporte pas MathDisplay) |
| `course_presentation.md` | Enrichir | Déjà bon, ajouter exemples variés + contraintes par type d'exercice enfant |
| `crosswords.md` | Ajouter | Préciser que les `answer` = lettres uniquement, les `clue` = HTML+LaTeX |
| `dialog_cards.md` | Ajouter | Ajouter bloc standard |
| `drag_and_drop.md` | Enrichir | Ajouter exemples variés |
| `drag_the_words.md` | Ajouter | Ajouter bloc Unicode+markers (les draggables ne supportent pas le LaTeX) |
| `elea_appariement.md` | Enrichir | Ajouter exemples variés |
| `elea_devoir.md` | Ajouter | Ajouter bloc Unicode (critères rubrique = texte brut) + LaTeX dans intro seulement |
| `elea_glossaire.md` | Enrichir | Préciser que `concept` et `definition` = texte brut |
| `elea_millionnaire.md` | Vérifier | Déjà interdit — s'assurer que l'interdiction est claire |
| `elea_pages.md` | Ajouter | Ajouter bloc standard (les blocs text supportent MathJax) |
| `elea_qcm.md` | Enrichir | Ajouter exemples variés |
| `elea_test.md` | Vérifier | Déjà le plus détaillé — vérifier cohérence avec la table de contraintes |
| `essay.md` | Ajouter | Ajouter bloc standard + préciser que `keywords` = texte brut |
| `fill_in_the_blanks.md` | Ajouter | Ajouter bloc Unicode+markers (les trous ne supportent pas le LaTeX) |
| `find_the_words.md` | Vérifier | Préciser que tout est texte brut (lettres uniquement dans la grille) |
| `flashcards.md` | Ajouter | Ajouter bloc standard |
| `mark_the_words.md` | Ajouter | Ajouter bloc Unicode+markers (les mots marqués ne supportent pas le LaTeX) |
| `quizset.md` | Enrichir | Ajouter exemples variés + contraintes par type d'exercice enfant |
| `quizset_qcm.md` | Enrichir | Ajouter exemples variés |
| `quizset_vf.md` | Enrichir | Ajouter exemples variés |
| `single_choice_set.md` | Enrichir | Ajouter exemples variés |
| `sort_the_paragraphs.md` | Enrichir | Ajouter exemples variés |
| `summary.md` | Enrichir | Ajouter exemples variés + préciser que `intro` = texte brut |
| `timeline.md` | Enrichir | Ajouter exemples variés |

### 5.4 Multilingue

Les instructions LaTeX dans les prompts sont universelles (la syntaxe LaTeX est identique dans toutes les langues). Cependant :

- Les exemples de texte entourant les formules doivent être en **français** (langue du prompt système)
- Les noms de fonctions (`\sin`, `\cos`, `\log`) sont internationaux
- La virgule décimale française `{,}` doit être mentionnée : `3{,}14` au lieu de `3.14`
- Les intervalles français utilisent `[` et `]` (pas `(` et `)`) : `[0, +\infty[`

---

## 6. Partie D — Dashboard HTML (optionnel)

Un fichier `tests/field-constraints-dashboard.html` pourra être généré pour visualiser la table de contraintes sous forme de tableau interactif. Ce fichier :

- Lit directement `field-constraints.js` (import ES6)
- Affiche un tableau filtrable par activité, type de rendu, et plateforme (H5P/Moodle)
- Colore les cellules par type de rendu (vert = html+latex, bleu = unicode, gris = plain, rouge = plain+letters)
- Est purement statique (pas de serveur nécessaire)

**Priorité :** Basse. À implémenter seulement si toutes les parties A-C sont terminées et testées.

---

## 7. Stratégie de tests

### 7.1 Tests existants à préserver (zéro régression)

| Step | Contenu | Fichier |
|------|---------|---------|
| 1-12 | Tests de base (healJsonString, LaTeX, processeurs) | `test-robustness.js` |
| 13 | `latexToUnicode` exhaustif (~200 assertions) | `test-robustness.js` |
| 14 | `autoWrapLatex` étendu (40+ commandes) | `test-robustness.js` |
| 15 | `healJsonString` stress (code fences, profondeur, perf) | `test-robustness.js` |
| 16 | Pipeline complet par activité (19 fixtures) | `test-robustness.js` |

### 7.2 Nouveaux tests à ajouter

#### Step 17 — Tests des contraintes de champs

```
Pour chaque entrée de FIELD_CONSTRAINTS :
1. Créer un objet JSON avec du LaTeX (\alpha, \frac{1}{2}, \mathbb{R}) dans chaque champ
2. Passer par healActivitySpecificFields(obj, moduleKey)
3. Vérifier que :
   - Les champs html+latex conservent le LaTeX intact (\(...\))
   - Les champs unicode ont le LaTeX converti en Unicode (α, ½, ℝ)
   - Les champs unicode+markers ont le LaTeX converti dans et hors marqueurs
   - Les champs plain n'ont aucun LaTeX ni formatage
   - Les champs plain+letters n'ont que des lettres
4. Vérifier la cohérence avec les processeurs (le champ passe ensuite par process())
```

#### Step 18 — Tests de non-régression par activité enrichie

```
Pour chaque activité ayant des conversions nouvelles (Glossary titles, Essay keywords, etc.) :
1. Charger le fixture JSON existant de assets/data/examples/
2. Passer par le pipeline complet (comme Step 16)
3. Vérifier que le résultat est identique ou meilleur (pas de LaTeX brut dans les champs plain)
```

### 7.3 Critères de réussite

- **100% des Steps 1-16 passent** sans modification des assertions existantes
- **Step 17 couvre les 20 types H5P + 7 types Moodle** (27 activités × N champs)
- **Step 18 vérifie** qu'aucun fixture existant ne produit de régression
- **Temps d'exécution total** < 10 secondes (navigateur)

---

## 8. Ordre d'implémentation — Checklist de suivi

> **Règle impérative :** L'IA DOIT cocher chaque case (`- [x]`) immédiatement après l'avoir terminée.
> L'IA reprend TOUJOURS à la **première case non cochée** et ne peut PAS avancer à une étape suivante
> tant que la case précédente n'est pas cochée. Cette checklist est la source de vérité de l'avancement.

### Phase 1 — Fichier déclaratif (Partie A)

- [x] **1.1** Créer `js/h5p/field-constraints.js` avec la constante `RENDER_TYPES` (6 types de rendu)
- [x] **1.2** Ajouter `FIELD_CONSTRAINTS` pour les 20 activités H5P (tous les champs de §3.2)
- [x] **1.3** Ajouter `FIELD_CONSTRAINTS` pour les 7 activités Moodle (tous les champs de §3.3)
- [x] **1.4** Exporter toutes les constantes en ES6 module
- [x] **1.5** Vérifier que le fichier s'importe sans erreur dans le navigateur (pas de dépendance DOM)

### Phase 2 — Refactorisation du healing (Partie B)

- [x] **2.1** Implémenter `applyToPath(obj, fieldPath, converterFn)` — résolution de chemins avec `[]` pour les tableaux
- [x] **2.2** Implémenter les `CONVERTERS` : `latexToUnicode`, `cleanMarkerText`, `stripAll`, `toLettersOnly` (réutilisant les fonctions existantes)
- [x] **2.3** Refactoriser `healActivitySpecificFields()` — remplacer la logique codée en dur par la lecture de `FIELD_CONSTRAINTS`
- [x] **2.4** Préserver la logique récursive pour CoursePresentation (exercices enfants → contraintes du type enfant)
- [x] **2.5** Préserver la logique récursive pour QuizSet/QuizSetQCM/QuizSetVF (questions enfants → contraintes du type enfant)
- [x] **2.6** Ajouter la conversion manquante : Glossary `panels[].title` → `latexToUnicode`
- [x] **2.7** Ajouter la conversion manquante : Essay `keywords[].keyword` → `stripAll`
- [x] **2.8** Exécuter les tests Steps 1-16 — vérifier **zéro régression** (tous doivent passer)

### Phase 3 — Enrichissement des prompts (Partie C)

- [x] **3.1** Rédiger le bloc d'exemples LaTeX standard (template réutilisable, cf. §5.2)
- [x] **3.2** Rédiger la variante Unicode pour les champs texte brut (cf. §5.2)
- [x] **3.3** Enrichir `_multiplechoice.md` — bloc standard + « pas de LaTeX dans les feedbacks »
- [x] **3.4** Enrichir `_truefalse.md` — bloc standard + « pas de LaTeX dans les feedbacks »
- [x] **3.5** Enrichir `accordion.md` — bloc standard + `title` = texte brut (Unicode)
- [x] **3.6** Ajouter section math dans `chart.md` — bloc Unicode uniquement
- [x] **3.7** Enrichir `course_presentation.md` — exemples variés + contraintes par exercice enfant
- [x] **3.8** Ajouter section math dans `crosswords.md` — `answer` = lettres uniquement, `clue` = HTML+LaTeX
- [x] **3.9** Ajouter section math dans `dialog_cards.md` — bloc standard
- [x] **3.10** Enrichir `drag_and_drop.md` — exemples variés
- [x] **3.11** Ajouter section math dans `drag_the_words.md` — bloc Unicode+markers
- [x] **3.12** Enrichir `elea_appariement.md` — exemples variés
- [x] **3.13** Ajouter section math dans `elea_devoir.md` — bloc Unicode pour critères + LaTeX intro
- [x] **3.14** Enrichir `elea_glossaire.md` — préciser `concept` et `definition` = texte brut
- [x] **3.15** Vérifier `elea_millionnaire.md` — interdiction de LaTeX bien claire
- [x] **3.16** Ajouter section math dans `elea_pages.md` — bloc standard
- [x] **3.17** Enrichir `elea_qcm.md` — exemples variés
- [x] **3.18** Vérifier `elea_test.md` — cohérence avec la table de contraintes
- [x] **3.19** Ajouter section math dans `essay.md` — bloc standard + `keywords` = texte brut
- [x] **3.20** Ajouter section math dans `fill_in_the_blanks.md` — bloc Unicode+markers
- [x] **3.21** Vérifier `find_the_words.md` — préciser tout = texte brut, lettres uniquement
- [x] **3.22** Ajouter section math dans `flashcards.md` — bloc standard
- [x] **3.23** Ajouter section math dans `mark_the_words.md` — bloc Unicode+markers
- [x] **3.24** Enrichir `quizset.md` — exemples variés + contraintes par exercice enfant
- [x] **3.25** Enrichir `quizset_qcm.md` — exemples variés
- [x] **3.26** Enrichir `quizset_vf.md` — exemples variés
- [x] **3.27** Enrichir `single_choice_set.md` — exemples variés
- [x] **3.28** Enrichir `sort_the_paragraphs.md` — exemples variés
- [x] **3.29** Enrichir `summary.md` — exemples variés + `intro` = texte brut
- [x] **3.30** Enrichir `timeline.md` — exemples variés

### Phase 4 — Tests finaux

- [x] **4.1** Écrire Step 17 dans `test-robustness.js` — tests des contraintes de champs (27 activités × N champs)
- [x] **4.2** Écrire Step 18 dans `test-robustness.js` — tests de non-régression par fixture enrichi
- [x] **4.3** Exécuter la suite complète Steps 1-18 — **100% de réussite obligatoire**
- [x] **4.4** Vérification finale : aucun `\alpha`, `\frac`, `\mathbb` brut dans les champs `plain` ou `unicode`

### Phase 5 — Dashboard HTML (optionnel, basse priorité)

- [x] **5.1** Créer `tests/field-constraints-dashboard.html` — tableau interactif filtrable
- [x] **5.2** Vérifier que le dashboard charge `field-constraints.js` et affiche correctement les 27 activités

---

## 9. Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Régression sur un processeur existant | Élevé | Moyenne | Steps 1-16 comme filet de sécurité + Step 18 par fixture |
| `applyToPath()` ne gère pas un chemin imbriqué | Moyen | Faible | Tests unitaires dédiés pour chaque pattern de chemin |
| Un champ classé `html+latex` ne supporte en fait pas le LaTeX | Élevé | Faible | Vérification manuelle sur le player H5P officiel |
| Les prompts enrichis provoquent un changement de comportement du LLM | Moyen | Moyenne | Tester avec les modèles existants avant déploiement |
| Performance de la résolution de chemins sur des objets très profonds | Faible | Très faible | Le pipeline complet est déjà < 500ms (Step 15) |
| CoursePresentation/QuizSet : la récursion enfant ne trouve pas les contraintes | Élevé | Moyenne | Tester explicitement les conteneurs avec exercices enfants variés |

---

## Annexe A — Mapping processeurs ↔ clés de contraintes

| moduleKey | machineName | Plateforme |
|-----------|-------------|------------|
| `Timeline` | `H5P.Timeline` | H5P |
| `Flashcards` | `H5P.Flashcard` | H5P |
| `FillInTheBlanks` | `H5P.Blanks` | H5P |
| `Glossary` | `H5P.Accordion` | H5P |
| `Crossword` | `H5P.Crossword` | H5P |
| `Essay` | `H5P.Essay` | H5P |
| `Summary` | `H5P.Summary` | H5P |
| `DragTheWords` | `H5P.DragText` | H5P |
| `DragAndDrop` | `H5P.DragQuestion` | H5P |
| `TrueFalse` | `H5P.TrueFalse` | H5P |
| `MultipleChoice` | `H5P.MultiChoice` | H5P |
| `FindTheWords` | `H5P.FindTheWords` | H5P |
| `SortParagraphs` | `H5P.SortParagraphs` | H5P |
| `SingleChoiceSet` | `H5P.SingleChoiceSet` | H5P |
| `DialogCards` | `H5P.Dialogcards` | H5P |
| `ComplexFillTheBlanks` | `H5P.AdvancedBlanks` | H5P |
| `Chart` | `H5P.Chart` | H5P |
| `MarkTheWords` | `H5P.MarkTheWords` | H5P |
| `QuizSet` | `H5P.QuestionSet` | H5P |
| `CoursePresentation` | `H5P.CoursePresentation` | H5P |
| `QCM` | simplequiz | Moodle |
| `Appariement` | epikmatch | Moodle |
| `Page` | page | Moodle |
| `Millionnaire` | millionairev2 | Moodle |
| `Test` | quiz | Moodle |
| `Glossaire` | glossary | Moodle |
| `Devoir` | assign | Moodle |

## Annexe B — Fonctions de conversion existantes à réutiliser

| Fonction | Fichier | Usage |
|----------|---------|-------|
| `latexToUnicode(text)` | `json-healer.js` | Conversion LaTeX → caractères Unicode |
| `cleanMarkTheWordsText(text)` | `json-healer.js` | `**→*`, LaTeX→Unicode, split multi-mots, apostrophes |
| `cleanDragTextText(text)` | `json-healer.js` | Wrappers `\(\)` supprimés, LaTeX→Unicode dans `*...*` et `\(...\)` |
| `cleanBlanksText(text)` | `json-healer.js` | `**→*`, suppression `*...*` dans blocs LaTeX |
| `_convertLatexField(text)` | `json-healer.js` | `\(...\)` → Unicode + commandes LaTeX restantes |
| `stripFormatting(text)` | `FindTheWords.js` | Supprime `**`, `*`, HTML, entités |
| `formatTextToHtml(text)` | `core/utils.js` | Markdown → HTML (utilisé par les processeurs, pas par le healer) |

## Annexe C — Exemples de formules par niveau scolaire

Pour contextualiser les exemples dans les prompts :

| Niveau | Exemples types |
|--------|---------------|
| Collège (6e-3e) | `x²`, `√2`, `π`, `α`, fractions simples, angles |
| Lycée (2de-Tle) | `\frac{d}{dx}`, `\int`, `\sum`, `\mathbb{R}`, `\forall`, limites, matrices |
| Supérieur | `\nabla`, `\partial`, `\otimes`, espaces vectoriels, topologie |
