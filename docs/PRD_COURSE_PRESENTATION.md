# PRD — Activité H5P « Course Presentation » (H5P.CoursePresentation)

> **Version** : 1.0.0 — **Date** : 2026-03-10
> **Base** : `docs/PRD_NOUVELLE_ACTIVITE_H5P.md` v1.0.0
> **Objectif** : Intégrer l'activité CoursePresentation dans Caramel — diaporama interactif avec sous-activités pédagogiques intégrées.

---

## Instructions pour l'IA implémentant ce PRD

> **RÈGLES OBLIGATOIRES** pour l'agent IA qui implémente ce PRD :
>
> 1. **Clarification avant chaque phase** : Avant de commencer une phase, l'IA **DOIT d'abord analyser** ce qu'elle va faire, puis **poser des questions à l'utilisateur** si certains points semblent ambigus, incomplets ou nécessitent un choix. Elle annonce clairement son plan d'action et attend la validation de l'utilisateur avant de coder. Format attendu :
>    ```
>    📋 PHASE N — [Nom de la phase]
>    Voici ce que je vais faire :
>    - Action 1
>    - Action 2
>
>    ❓ Questions avant de commencer :
>    - Question 1 ?
>    - Question 2 ?
>
>    (Si aucune question : "Pas de question, je commence ?" )
>    ```
>
> 2. **Progression par cases à cocher** : Chaque phase contient des cases de validation (`- [ ]`). L'IA **DOIT cocher** chaque case (`- [x]`) dès qu'une étape est terminée et validée. À chaque reprise de conversation, l'IA **reprend à la première case non cochée** et continue à partir de là.
>
> 3. **Points de test utilisateur** : À la fin de chaque phase (ou à des étapes clés intermédiaires marquées `🧪 POINT DE TEST`), l'IA **DOIT proposer à l'utilisateur de tester** le résultat avant de passer à la phase suivante. Le format attendu est :
>    ```
>    🧪 POINT DE TEST — Phase N terminée
>    Pour valider cette phase, merci de vérifier :
>    - [ ] Point de vérification 1
>    - [ ] Point de vérification 2
>    Souhaitez-vous tester maintenant ou passer à la phase suivante ?
>    ```
>
> 4. **Ne jamais sauter une phase** : Même si une phase semble triviale, l'IA doit la traiter explicitement et cocher les cases correspondantes.
>
> 5. **En cas d'échec d'un test** : L'IA corrige le problème avant de cocher la case et de passer à la suite. Pas de case cochée sans validation effective.

---

## Table des matières

1. [Contexte et vision pédagogique](#1-contexte-et-vision-pédagogique)
2. [Architecture technique — Décisions clés](#2-architecture-technique--décisions-clés)
3. [Phase 1 — Enregistrement](#3-phase-1--enregistrement)
4. [Phase 2 — Processeur H5P](#4-phase-2--processeur-h5p)
5. [Phase 3 — Réparation JSON (Healer)](#5-phase-3--réparation-json-healer)
6. [Phase 4 — Prompts et intégration IA](#6-phase-4--prompts-et-intégration-ia)
7. [Phase 5 — Traductions (11 langues)](#7-phase-5--traductions-11-langues)
8. [Phase 6 — Éditeur visuel JSON](#8-phase-6--éditeur-visuel-json)
9. [Phase 7 — Export document (DOCX/ODT/PDF)](#9-phase-7--export-document-docxodtpdf)
10. [Phase 8 — Aide d'urgence](#10-phase-8--aide-durgence)
11. [Phase 9 — Assets visuels](#11-phase-9--assets-visuels)
12. [Phase 10 — Librairies H5P vendor](#12-phase-10--librairies-h5p-vendor)
13. [Phase 11 — Tests](#13-phase-11--tests)
14. [Phase 12 — Documentation](#14-phase-12--documentation)
15. [Phase 13 — Intégration QuizSet](#15-phase-13--intégration-quizset)
16. [Phase 14 — Cas spéciaux](#16-phase-14--cas-spéciaux)
17. [Phase BONUS — Upload d'images utilisateur](#17-phase-bonus--upload-dimages-utilisateur)
18. [Checklist de validation finale](#18-checklist-de-validation-finale)
19. [Annexe A — JSON simplifié IA (entrée)](#annexe-a--json-simplifié-ia-entrée)
20. [Annexe B — JSON H5P complet (sortie processeur)](#annexe-b--json-h5p-complet-sortie-processeur)
21. [Annexe C — Templates de layout](#annexe-c--templates-de-layout)
22. [Annexe D — Sous-types : mapping et réutilisation](#annexe-d--sous-types--mapping-et-réutilisation)
23. [Annexe E — Fichiers modifiés (récapitulatif)](#annexe-e--fichiers-modifiés-récapitulatif)

---

## 1. Contexte et vision pédagogique

### 1.1. Qu'est-ce qu'une Course Presentation ?

Un **diaporama interactif** H5P composé de slides contenant :
- Du **contenu** : texte riche, tableaux, zones de texte exportables
- Des **exercices interactifs** : QCM, vrai/faux, texte à trous, glisser-déposer, etc.
- Une **navigation** par mots-clés (sidebar)
- Un **slide de résumé** automatique agrégeant les scores de tous les exercices

### 1.2. Intérêt pédagogique

- **Cours structuré** : l'enseignant déroule un cours en slides avec des points de vérification interactifs
- **Évaluation intégrée** : les exercices dans les slides permettent une auto-évaluation en continu
- **Feedback immédiat** : chaque exercice fournit un retour à l'élève (score, solutions)
- **Résumé final** : le slide de synthèse récapitule toutes les performances

### 1.3. Sous-types d'éléments — V1

Tous les sous-types ci-dessous sont intégrés dès la v1 :

| # | Type | Library H5P | Catégorie | Réutilise processeur existant |
|---|------|-------------|-----------|-------------------------------|
| 1 | Texte riche | `H5P.AdvancedText 1.1` | Contenu | — (structure simple) |
| 2 | Tableau | `H5P.Table 1.2` | Contenu | — (structure simple) |
| 3 | Zone de texte exportable | `H5P.ExportableTextArea 1.3` | Contenu | — (structure simple) |
| 4 | QCM | `H5P.MultiChoice 1.16` | Exercice | `MultipleChoice.js` |
| 5 | Vrai/Faux | `H5P.TrueFalse 1.8` | Exercice | `TrueFalse.js` |
| 6 | Texte à trous | `H5P.Blanks 1.14` | Exercice | `FillInTheBlanks.js` |
| 7 | Glisser les mots | `H5P.DragText 1.10` | Exercice | `DragTheWords.js` |
| 8 | Choix unique | `H5P.SingleChoiceSet 1.11` | Exercice | `SingleChoiceSet.js` |
| 9 | Marquer les mots | `H5P.MarkTheWords 1.11` | Exercice | `MarkTheWords.js` |
| 10 | Résumé | `H5P.Summary 1.10` | Exercice | `Summary.js` |
| 11 | Glisser-déposer | `H5P.DragQuestion 1.14` | Exercice | `DragAndDrop.js` |
| 12 | Cartes dialogue | `H5P.Dialogcards 1.9` | Exercice | `DialogCards.js` |

> **Non inclus v1** : Image, Audio, Vidéo, InteractiveVideo, Link, Shape, ContinuousText, TwitterUserFeed, AudioRecorder, MultiMediaChoice (nécessitent des médias que l'IA ne peut pas générer).

---

## 2. Architecture technique — Décisions clés

### 2.1. Séparation contenu IA / structure H5P

| Responsabilité | Qui | Pourquoi |
|---|---|---|
| **Titre, textes, questions, réponses, feedbacks** | IA (LLM) | Contenu pédagogique = valeur ajoutée de l'IA |
| **Coordonnées x/y/width/height** | Processeur (templates) | Layout = problème de mise en page, pas de pédagogie |
| **UUIDs (subContentId)** | Processeur (`generateUUID()`) | Technique pure |
| **Library strings** (`"H5P.MultiChoice 1.16"`) | Processeur (résolution) | L'IA envoie un enum simplifié (`"multichoice"`) |
| **l10n (40+ champs)** | Processeur (en dur, localisé) | Toujours identique, utilise `translations` |
| **behaviour / override** | Processeur (défauts sensés) | Valeurs par défaut cohérentes |
| **overallFeedback** | Processeur (template standard) | Paliers 0-50-80-100 automatiques |
| **backgroundOpacity, displayAsButton** | Processeur (par type) | Valeurs par défaut selon type d'élément |
| **Keywords sidebar** | Processeur (depuis titres slides) | Généré automatiquement depuis les titres de slides |

### 2.2. Feedback dans les exercices

**Oui, les exercices intégrés conservent leur feedback.** Le processeur :
1. Génère `overallFeedback` (paliers 0/50/80/100) pour chaque exercice scoré
2. Conserve les `tipsAndFeedback` par réponse pour les QCM (si fournis par l'IA)
3. Active `enableSolutionsButton` et `enableRetry` par défaut
4. Le slide de résumé agrège tous les scores automatiquement

### 2.3. Valeurs en dur modifiables via l'éditeur

Le processeur stocke les valeurs "en dur" dans des **constantes nommées au début du fichier**, facilitant une future exposition dans l'éditeur :

```javascript
// === Constantes configurables (exposables dans l'éditeur) ===
const DEFAULTS = {
    keywordListEnabled: true,
    keywordListAlwaysShow: false,
    keywordListOpacity: 90,
    globalBackgroundColor: null,
    enableRetry: true,
    enableSolutionsButton: true,
    hideSummarySlide: false,
    activeSurface: false,
    backgroundOpacityText: 80,
    backgroundOpacityExercise: 0,
};
```

> **Stratégie** : Ces constantes sont injectées dans le JSON H5P. Si on veut les rendre éditables ultérieurement, il suffit d'ajouter les champs correspondants dans le `fieldSchema` de l'éditeur et de lire les valeurs depuis `editorState.currentData` au lieu des constantes.

### 2.4. Couleurs des slides — disponibles dans l'éditeur

Les couleurs de fond des slides sont **exposées dans l'éditeur dès la v1**. L'utilisateur pourra :

- **Couleur de fond globale** (`globalBackgroundColor`) : appliquée à toutes les slides par défaut
- **Couleur de fond par slide** (`slideBackgroundColor`) : surcharge la couleur globale pour une slide spécifique

Le processeur applique des **couleurs par défaut** (alternance de teintes neutres ou couleur unique) mais l'éditeur permet de les personnaliser.

Champs éditeur correspondants :

```javascript
// Dans la section "Général" de l'éditeur
{
    key: 'globalBackgroundColor',
    label: t('editor_label_global_bg_color') || 'Couleur de fond globale',
    type: 'color',
    required: false,
    defaultValue: null,
    description: t('editor_desc_global_bg_color') || 'Couleur appliquée à toutes les diapositives par défaut'
}

// Dans chaque item du tableau slides
{
    key: 'backgroundColor',
    label: t('editor_label_slide_bg_color') || 'Couleur de fond du slide',
    type: 'color',
    required: false,
    defaultValue: null,
    description: t('editor_desc_slide_bg_color') || 'Laissez vide pour utiliser la couleur globale'
}
```

> Le champ `type: 'color'` nécessitera un widget `<input type="color">` dans `field-renderers.js` si ce n'est pas encore implémenté. C'est un ajout mineur (~20 lignes).

### 2.4. Modèle IA

`gpt-oss-120b` — Structure complexe avec slides et sous-types variés, nécessite le modèle le plus capable.

---

## 3. Phase 1 — Enregistrement

### 3.1. `js/core/definitions.js` — `h5pModules`

```javascript
CoursePresentation: {
    name: "h5p_course_presentation_name",
    englishName: "CoursePresentation",
    machineName: "H5P.CoursePresentation",
    description: "h5p_course_presentation_description",
    image: "assets/images/activities/course_presentation_icon-colors_0.webp",
    promptId: "coursePresentationResultat",
    jsonInputId: "coursePresentationJsonInput",
    createBtnId: "createCoursePresentationH5P",
    categories: ["text", "quiz", "h5p"],
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["H5P", "DOCX", "ODT", "PDF"],
    hidden: false
}
```

> **Catégories** : `text` (contenu de cours) + `quiz` (exercices intégrés) + `h5p`.

### 3.2. `js/core/definitions.js` — `customOrder`

Insérer `'CoursePresentation'` en position haute (activité phare) — après QuizSet et avant les activités unitaires :

```javascript
const customOrder = [
    'QuizSetQCM', 'QuizSetVF', 'QuizSet',
    'CoursePresentation',  // ← Ici
    'Flashcards', 'Crossword', 'Timeline',
    // ...
];
```

### 3.3. Validation Phase 1

- [x] Tuile visible dans la grille avec image placeholder
- [x] Filtres catégorie (text, quiz, h5p) et plateforme fonctionnels
- [x] Clic → panneau latéral avec IDs DOM corrects
- [ ] `test-definitions.js` passe

> 🧪 **POINT DE TEST — Phase 1 terminée**
> Proposer à l'utilisateur de lancer `python3 -m http.server 8000` et vérifier :
> - La tuile "Présentation de cours" apparaît dans la grille avec la bonne icône
> - Les filtres catégorie/plateforme incluent bien la tuile
> - Le clic ouvre le panneau latéral sans erreur console

---

## 4. Phase 2 — Processeur H5P

### 4.1. Fichier : `js/h5p/processors/CoursePresentation.js`

C'est le **fichier le plus complexe** de ce PRD. Il doit :

1. Recevoir le JSON simplifié de l'IA (cf. Annexe A)
2. Résoudre chaque slide en éléments H5P positionnés
3. Appliquer les templates de layout selon le type de slide
4. Transformer chaque sous-exercice via les processeurs existants (comme QuizSet)
5. Générer les keywords de navigation
6. Injecter toute la l10n H5P
7. Retourner le JSON H5P complet + la liste des dépendances dynamiques

#### Architecture du processeur

```javascript
import { formatTextToHtml, generateUUID } from '../../core/utils.js';
import { translations, currentLang } from '../../core/translation.js';

// === Constantes configurables (exposables dans l'éditeur) ===
const DEFAULTS = {
    keywordListEnabled: true,
    keywordListAlwaysShow: false,
    keywordListOpacity: 90,
    globalBackgroundColor: null,
    enableRetry: true,
    enableSolutionsButton: true,
    hideSummarySlide: false,
    activeSurface: false,
    backgroundOpacityText: 80,
    backgroundOpacityExercise: 0,
};

// === Mapping type simplifié → library H5P ===
const LIBRARY_MAP = {
    'multichoice':      'H5P.MultiChoice 1.16',
    'truefalse':        'H5P.TrueFalse 1.8',
    'blanks':           'H5P.Blanks 1.14',
    'dragtext':         'H5P.DragText 1.10',
    'singlechoiceset':  'H5P.SingleChoiceSet 1.11',
    'markthewords':     'H5P.MarkTheWords 1.11',
    'summary':          'H5P.Summary 1.10',
    'dragquestion':     'H5P.DragQuestion 1.14',
    'dialogcards':      'H5P.Dialogcards 1.9',
    'advancedtext':     'H5P.AdvancedText 1.1',
    'table':            'H5P.Table 1.2',
    'exportabletextarea': 'H5P.ExportableTextArea 1.3',
};

// === Templates de layout par type de slide (cf. Annexe C) ===
const SLIDE_LAYOUTS = { ... };

export default {
    async process(jsonObj, helpers) {
        // 1. Extraire les slides
        // 2. Pour chaque slide, résoudre les éléments
        // 3. Positionner via SLIDE_LAYOUTS
        // 4. Pour les exercices, déléguer au processeur enfant via helpers.processChild()
        // 5. Collecter les dépendances dynamiques
        // 6. Générer les keywords depuis les titres
        // 7. Injecter l10n complète
        // 8. Retourner { content, dependencies }
    }
};
```

#### Logique de résolution des sous-exercices

Le processeur suit le **pattern QuizSet** pour les exercices intégrés :

```javascript
// Pour chaque élément de type exercice dans un slide
async function processExerciseElement(exercise, helpers) {
    const libraryKey = exercise.library; // ex: "multichoice"
    const fullLibrary = LIBRARY_MAP[libraryKey];

    if (!fullLibrary) {
        throw new Error(`Type d'exercice inconnu : ${libraryKey}`);
    }

    const subContent = {
        subContentId: generateUUID(),
        library: fullLibrary,
        metadata: { title: exercise.title || "Exercice", contentType: "Exercise" },
        params: buildExerciseParams(exercise, libraryKey)
    };

    // Déléguer au processeur enfant si disponible
    if (helpers && helpers.processChild) {
        return await helpers.processChild(subContent);
    }
    return subContent;
}
```

#### Construction des params par type d'exercice

Pour chaque sous-type, le processeur construit les `params` dans le format attendu par le processeur enfant existant :

```javascript
function buildExerciseParams(exercise, type) {
    switch (type) {
        case 'multichoice':
            return {
                question: exercise.question,
                answers: exercise.answers.map(a => ({
                    text: a.text,
                    correct: a.correct,
                    tipsAndFeedback: {
                        tip: a.tip || '',
                        chosenFeedback: a.feedback || '',
                        notChosenFeedback: ''
                    }
                })),
                overallFeedback: buildDefaultOverallFeedback()
            };

        case 'truefalse':
            return {
                question: exercise.question,
                correct: exercise.correct ? "true" : "false",
                overallFeedback: [
                    { from: 0, to: 0, feedback: exercise.feedbackWrong || '' },
                    { from: 100, to: 100, feedback: exercise.feedbackCorrect || '' }
                ]
            };

        case 'blanks':
            return {
                text: exercise.text,   // taskDescription
                questions: exercise.questions, // avec *réponses*
                overallFeedback: buildDefaultOverallFeedback()
            };

        case 'dragtext':
            return {
                taskDescription: exercise.question || '',
                textField: exercise.text, // avec *mots* à glisser
                overallFeedback: buildDefaultOverallFeedback()
            };

        case 'singlechoiceset':
            return {
                choices: exercise.choices,
                overallFeedback: buildDefaultOverallFeedback()
            };

        case 'markthewords':
            return {
                taskDescription: exercise.question || '',
                textField: exercise.text, // avec *mots* à marquer
                overallFeedback: buildDefaultOverallFeedback()
            };

        case 'summary':
            return {
                intro: exercise.intro || '',
                summaries: exercise.statements
            };

        case 'dragquestion':
            return {
                title: exercise.title || '',
                question: exercise.question // structure DnD complète
            };

        case 'dialogcards':
            return {
                title: exercise.title || '',
                dialogs: exercise.cards
            };
    }
}

function buildDefaultOverallFeedback() {
    return [
        { from: 0,  to: 50,  feedback: translations.h5p_feedback_low || "Continuez vos efforts !" },
        { from: 51, to: 80,  feedback: translations.h5p_feedback_medium || "Bon travail !" },
        { from: 81, to: 100, feedback: translations.h5p_feedback_high || "Excellent !" }
    ];
}
```

#### L10n complète (en dur dans le processeur)

```javascript
function buildL10n() {
    return {
        slide: translations.h5p_cp_slide || "Diapositive",
        currentSlide: translations.h5p_cp_current_slide || "Diapositive actuelle",
        nextSlide: translations.h5p_cp_next_slide || "Diapositive suivante",
        prevSlide: translations.h5p_cp_prev_slide || "Diapositive précédente",
        lastSlide: translations.h5p_cp_last_slide || "Dernière diapositive",
        score: translations.h5p_cp_score || "Score",
        yourScore: translations.h5p_cp_your_score || "Votre score",
        maxScore: translations.h5p_cp_max_score || "Score maximum",
        total: translations.h5p_cp_total || "Total",
        totalScore: translations.h5p_cp_total_score || "Score total",
        scoreMessage: translations.h5p_cp_score_message || "Vous avez obtenu :",
        showSolutions: translations.h5p_show_solution || "Afficher les solutions",
        solutionsButtonTitle: translations.h5p_cp_show_comments || "Afficher les commentaires",
        retry: translations.h5p_try_again || "Réessayer",
        exportAnswers: translations.h5p_cp_export_answers || "Exporter les réponses",
        summary: translations.h5p_cp_summary || "Résumé",
        summaryMultipleTaskText: translations.h5p_cp_summary_multiple || "Plusieurs exercices",
        hideKeywords: translations.h5p_cp_hide_keywords || "Masquer le menu de navigation",
        showKeywords: translations.h5p_cp_show_keywords || "Afficher le menu de navigation",
        fullscreen: translations.h5p_cp_fullscreen || "Plein écran",
        exitFullscreen: translations.h5p_cp_exit_fullscreen || "Quitter le plein écran",
        noTitle: translations.h5p_cp_no_title || "Sans titre",
        printTitle: translations.h5p_cp_print || "Imprimer",
        printIngress: translations.h5p_cp_print_ingress || "Comment souhaitez-vous imprimer cette présentation ?",
        printAllSlides: translations.h5p_cp_print_all || "Imprimer toutes les diapositives",
        printCurrentSlide: translations.h5p_cp_print_current || "Imprimer la diapositive actuelle",
        solutionModeTitle: translations.h5p_cp_exit_solution || "Quitter le mode solution",
        solutionModeText: translations.h5p_cp_solution_mode || "Mode solution",
        // Accessibilité
        accessibilitySlideNavigationExplanation: translations.h5p_cp_a11y_nav || "Utilisez les flèches gauche et droite pour naviguer entre les diapositives.",
        accessibilityCanvasLabel: translations.h5p_cp_a11y_canvas || "Présentation. Utilisez les flèches pour naviguer.",
        accessibilityProgressBarLabel: translations.h5p_cp_a11y_progress || "Choisir la diapositive à afficher",
        accessibilityTotalScore: translations.h5p_cp_a11y_score || "Vous avez obtenu @score sur @maxScore points au total",
        accessibilityEnteredFullscreen: translations.h5p_cp_a11y_enter_fs || "Mode plein écran activé",
        accessibilityExitedFullscreen: translations.h5p_cp_a11y_exit_fs || "Mode plein écran désactivé",
        containsNotCompleted: translations.h5p_cp_a11y_not_completed || "@slideName contient une interaction non terminée",
        containsCompleted: translations.h5p_cp_a11y_completed || "@slideName contient une interaction terminée",
        containsOnlyCorrect: translations.h5p_cp_a11y_only_correct || "@slideName n'a que des réponses correctes",
        containsIncorrectAnswers: translations.h5p_cp_a11y_incorrect || "@slideName a des réponses incorrectes",
        slideCount: translations.h5p_cp_a11y_slide_count || "Diapositive @index sur @total",
        confirmDialogHeader: translations.h5p_cp_confirm_header || "Soumettre vos réponses",
        confirmDialogText: translations.h5p_cp_confirm_text || "Cela soumettra vos résultats. Voulez-vous continuer ?",
        confirmDialogConfirmText: translations.h5p_cp_confirm_ok || "Soumettre et voir les résultats",
        confirmDialogConfirmLabel: translations.h5p_cp_confirm_label || "Confirmer",
        confirmDialogCancelLabel: translations.h5p_cp_cancel_label || "Annuler",
    };
}
```

### 4.2. Enregistrer dans le routeur

**Fichier** : `js/h5p/processors/index.js`

#### a) Métadonnées — `processorMetadata`

```javascript
'CoursePresentation': {
    machineName: 'H5P.CoursePresentation',
    version: { major: 1, minor: 26 },
    extraDependencies: [
        // Core
        { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
        { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
        { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
        { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
        { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
        { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
        // Sous-types contenu
        { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
        { machineName: 'H5P.Table', majorVersion: 1, minorVersion: 2 },
        { machineName: 'H5P.ExportableTextArea', majorVersion: 1, minorVersion: 3 },
        // Sous-types exercices
        { machineName: 'H5P.MultiChoice', majorVersion: 1, minorVersion: 16 },
        { machineName: 'H5P.TrueFalse', majorVersion: 1, minorVersion: 8 },
        { machineName: 'H5P.Blanks', majorVersion: 1, minorVersion: 14 },
        { machineName: 'H5P.DragText', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.SingleChoiceSet', majorVersion: 1, minorVersion: 11 },
        { machineName: 'H5P.MarkTheWords', majorVersion: 1, minorVersion: 11 },
        { machineName: 'H5P.Summary', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.DragQuestion', majorVersion: 1, minorVersion: 14 },
        { machineName: 'H5P.Dialogcards', majorVersion: 1, minorVersion: 9 },
        // Dépendances des sous-types
        { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 },
        { machineName: 'jQuery.ui', majorVersion: 1, minorVersion: 10 },
        { machineName: 'H5P.Audio', majorVersion: 1, minorVersion: 5 },
    ]
}
```

> **Note** : Les dépendances des sous-types exercices (Question, JoubelUI, etc.) sont déjà incluses dans les dépendances de base. Les dépendances spécifiques (jQuery.ui pour DragQuestion, TextUtilities pour Blanks, Audio pour Dialogcards) sont ajoutées explicitement. Le processeur pourra aussi collecter dynamiquement les dépendances des sous-types réellement utilisés dans la présentation.

#### b) Chargeur lazy — `processorLoaders`

```javascript
'CoursePresentation': () => import('./CoursePresentation.js'),
```

#### c) Lookup inversé — `libraryToKey`

```javascript
'H5P.CoursePresentation': 'CoursePresentation',
```

### 4.3. Validation Phase 2

- [x] Coller le JSON simplifié (Annexe A) dans le textarea → .h5p se télécharge
- [x] Le .h5p s'ouvre dans Lumi/h5p.org
- [x] Les slides défilent avec navigation gauche/droite
- [x] Les exercices intégrés sont interactifs (répondre, score, retry)
- [ ] Le slide de résumé agrège correctement les scores
- [x] La sidebar de mots-clés fonctionne
- [ ] Mode debug : logs du processeur visibles

> 🧪 **POINT DE TEST — Phase 2 terminée (CRITIQUE)**
> C'est la phase la plus importante. Proposer à l'utilisateur :
> 1. Coller le JSON de l'Annexe A dans le textarea et télécharger le .h5p
> 2. Ouvrir le .h5p dans Lumi ou sur h5p.org pour vérifier :
>    - Navigation entre slides (flèches + sidebar mots-clés)
>    - Chaque type d'exercice fonctionne (répondre, voir score, retry, solutions)
>    - Le slide de résumé agrège les scores
> 3. Tester aussi avec `?debug` pour vérifier les logs

---

## 5. Phase 3 — Réparation JSON (Healer)

### 5.1. `H5P_MODULE_KEYS` (Set)

```javascript
const H5P_MODULE_KEYS = new Set([
    'Timeline', 'Flashcards', /* ... */ 'CoursePresentation'
]);
```

### 5.2. `H5P_LIB_VERSIONS` (Map)

```javascript
'H5P.CoursePresentation': '1.26'
```

### 5.3. Healing spécifique — `healActivitySpecificFields()`

```javascript
case 'CoursePresentation':
    // Nettoyer les textes HTML dans chaque slide
    if (Array.isArray(healed.slides)) {
        healed.slides.forEach(slide => {
            if (slide.text) slide.text = cleanHtmlText(slide.text);
            if (slide.title) slide.title = cleanHtmlText(slide.title);
            // Nettoyer les exercices intégrés
            if (slide.exercise) {
                if (slide.exercise.question) {
                    slide.exercise.question = cleanHtmlText(slide.exercise.question);
                }
            }
        });
    }
    break;
```

### 5.4. Healing structurel — `healStructureForActivity()`

```javascript
case 'CoursePresentation':
    // Assurer que slides est un tableau
    if (!Array.isArray(data.slides)) {
        // Tentative de reconstruction depuis une structure plate
        if (data.slide || data.content) {
            data.slides = Array.isArray(data.slide || data.content)
                ? (data.slide || data.content)
                : [data.slide || data.content];
            delete data.slide;
            delete data.content;
        } else {
            data.slides = [];
        }
    }

    // Valider chaque slide
    data.slides = data.slides.map((slide, i) => {
        // Assurer un type de slide
        if (!slide.type) {
            if (i === 0) slide.type = 'title';
            else if (slide.exercise) slide.type = 'quiz';
            else slide.type = 'content';
        }

        // Normaliser le type d'exercice simplifié
        if (slide.exercise && slide.exercise.library) {
            const lib = slide.exercise.library.toLowerCase()
                .replace(/^h5p\./, '')
                .replace(/\s.*$/, '');
            slide.exercise.library = lib;
        }

        return slide;
    });

    // Assurer un titre global
    if (!data.title) {
        const firstSlide = data.slides[0];
        data.title = firstSlide?.title || 'Présentation';
    }
    break;
```

### 5.5. Validation Phase 3

- [x] JSON mal formé (slides manquant, types en majuscule) → corrigé automatiquement
- [ ] Mode debug : diff visible entre raw et healed
- [x] Formules LaTeX correctement échappées dans les textes de slides

> 🧪 **POINT DE TEST — Phase 3 terminée**
> Proposer à l'utilisateur de tester avec `?debug` en collant un JSON volontairement mal formé (ex: `slides` nommé `content`, types en majuscule, library avec version complète au lieu de l'enum simplifié). Vérifier que le healer corrige et que le diff est visible dans la modale.

---

## 6. Phase 4 — Prompts et intégration IA

### 6.1. Template de prompt

**Fichier** : `assets/data/prompts/course_presentation.md`

### 6.2. Exemples JSON

**Fichiers** :
- `assets/data/examples/course_presentation_1.json` — Cours d'histoire (5 slides : titre + 2 contenus + 1 quiz + résumé)
- `assets/data/examples/course_presentation_2.json` — Cours de sciences avec LaTeX (7 slides : titre + contenu + tableau + QCM + V/F + texte à trous + résumé)

### 6.3. `js/services/prompt-generator.js` — `ACTIVITY_CONFIG`

```javascript
coursePresentation: { prefix: 'prompt_course_presentation', resultKey: 'coursePresentationResultat' },
```

### 6.4. `js/services/llm.js` — `ACTIVITY_MODEL_OVERRIDES`

```javascript
'CoursePresentation': 'gpt-oss-120b'
```

### 6.5. Structure du prompt IA

Le prompt doit produire le JSON simplifié suivant. Points clés :
- Chaque slide a un `type` parmi : `title`, `content`, `content-with-table`, `quiz`, `content-quiz`, `summary`
- Chaque exercice utilise les **noms de librairies H5P complets** (ex: `H5P.MultiChoice 1.16`) — le healer normalise si nécessaire
- **Cohérence des clés** : les champs params de chaque exercice doivent utiliser les **mêmes clés** que les prompts des activités autonomes (ex: `taskDescription` pour Blanks, `textField` pour DragText, `summaries` pour Summary, etc.)
- Les feedbacks par réponse QCM (`tipsAndFeedback`) sont optionnels mais encouragés
- Les textes utilisent du **Markdown** (`**gras**`, `*italique*`) — le processeur convertit en HTML

> Voir **Annexe A** pour l'exemple complet de JSON simplifié attendu.

### 6.6. Validation Phase 4

- [x] "Générer en un clic" produit un JSON simplifié valide
- [x] Le prompt Guidé est cohérent avec la structure attendue
- [x] Les 2 exemples JSON sont parsables et passent le healer + processeur

> 🧪 **POINT DE TEST — Phase 4 terminée**
> Proposer à l'utilisateur de tester la génération IA complète :
> 1. Cliquer sur "Générer en un clic" avec un sujet de cours
> 2. Vérifier que le JSON résultat contient des slides avec contenu et exercices variés
> 3. Télécharger le .h5p et vérifier dans Lumi

---

## 7. Phase 5 — Traductions (11 langues)

### 7.1. Clés obligatoires

#### Identité (2 clés)

| Clé | FR |
|-----|-----|
| `h5p_course_presentation_name` | `"Présentation de cours"` |
| `h5p_course_presentation_description` | `"Créez un diaporama interactif avec des exercices intégrés (QCM, vrai/faux, texte à trous, etc.) pour un cours structuré en slides."` |

#### Prompts IA (3 clés)

| Clé | Description |
|-----|-------------|
| `prompt_course_presentation_regles_specifiques` | Règles : types de slides autorisés, enums exercices, nombre d'éléments |
| `prompt_course_presentation_structure_json` | Structure JSON simplifiée attendue |
| `prompt_course_presentation_exemple_rendu` | Exemple JSON complet |

#### L10n du player H5P (~35 clés)

Préfixe : `h5p_cp_*`

| Clé | FR |
|-----|-----|
| `h5p_cp_slide` | `"Diapositive"` |
| `h5p_cp_current_slide` | `"Diapositive actuelle"` |
| `h5p_cp_next_slide` | `"Diapositive suivante"` |
| `h5p_cp_prev_slide` | `"Diapositive précédente"` |
| `h5p_cp_last_slide` | `"Dernière diapositive"` |
| `h5p_cp_score` | `"Score"` |
| `h5p_cp_your_score` | `"Votre score"` |
| `h5p_cp_max_score` | `"Score maximum"` |
| `h5p_cp_total` | `"Total"` |
| `h5p_cp_total_score` | `"Score total"` |
| `h5p_cp_score_message` | `"Vous avez obtenu :"` |
| `h5p_cp_show_comments` | `"Afficher les commentaires"` |
| `h5p_cp_export_answers` | `"Exporter les réponses"` |
| `h5p_cp_summary` | `"Résumé"` |
| `h5p_cp_summary_multiple` | `"Plusieurs exercices"` |
| `h5p_cp_hide_keywords` | `"Masquer le menu de navigation"` |
| `h5p_cp_show_keywords` | `"Afficher le menu de navigation"` |
| `h5p_cp_fullscreen` | `"Plein écran"` |
| `h5p_cp_exit_fullscreen` | `"Quitter le plein écran"` |
| `h5p_cp_no_title` | `"Sans titre"` |
| `h5p_cp_print` | `"Imprimer"` |
| `h5p_cp_print_ingress` | `"Comment souhaitez-vous imprimer cette présentation ?"` |
| `h5p_cp_print_all` | `"Imprimer toutes les diapositives"` |
| `h5p_cp_print_current` | `"Imprimer la diapositive actuelle"` |
| `h5p_cp_exit_solution` | `"Quitter le mode solution"` |
| `h5p_cp_solution_mode` | `"Mode solution"` |
| `h5p_cp_a11y_nav` | `"Utilisez les flèches gauche et droite pour naviguer entre les diapositives."` |
| `h5p_cp_a11y_canvas` | `"Présentation. Utilisez les flèches pour naviguer."` |
| `h5p_cp_a11y_progress` | `"Choisir la diapositive à afficher"` |
| `h5p_cp_a11y_score` | `"Vous avez obtenu @score sur @maxScore points au total"` |
| `h5p_cp_a11y_enter_fs` | `"Mode plein écran activé"` |
| `h5p_cp_a11y_exit_fs` | `"Mode plein écran désactivé"` |
| `h5p_cp_a11y_not_completed` | `"@slideName contient une interaction non terminée"` |
| `h5p_cp_a11y_completed` | `"@slideName contient une interaction terminée"` |
| `h5p_cp_a11y_only_correct` | `"@slideName n'a que des réponses correctes"` |
| `h5p_cp_a11y_incorrect` | `"@slideName a des réponses incorrectes"` |
| `h5p_cp_a11y_slide_count` | `"Diapositive @index sur @total"` |
| `h5p_cp_confirm_header` | `"Soumettre vos réponses"` |
| `h5p_cp_confirm_text` | `"Cela soumettra vos résultats. Voulez-vous continuer ?"` |
| `h5p_cp_confirm_ok` | `"Soumettre et voir les résultats"` |
| `h5p_cp_confirm_label` | `"Confirmer"` |
| `h5p_cp_cancel_label` | `"Annuler"` |

#### Emergency Help (~20 clés)

Préfixe : `eh_course_presentation_*`

| Clé | FR |
|-----|-----|
| `eh_course_presentation_desc` | `"La Présentation de cours est un diaporama interactif. Chaque diapositive peut contenir du texte, des tableaux ou des exercices (QCM, vrai/faux, texte à trous, etc.). Un slide de résumé récapitule tous les scores."` |
| `eh_course_presentation_field_title` | `"Titre global de la présentation"` |
| `eh_course_presentation_field_slides` | `"Tableau de diapositives (slides). Chaque slide a un type et un contenu."` |
| `eh_course_presentation_field_slide_type` | `"Type de slide : title (titre), content (contenu texte), content-with-table (contenu + tableau), quiz (exercice seul), content-quiz (texte + exercice), summary (résumé interactif)"` |
| `eh_course_presentation_field_slide_title` | `"Titre de la diapositive (affiché en haut et dans la navigation par mots-clés)"` |
| `eh_course_presentation_field_slide_text` | `"Contenu texte de la diapositive (HTML autorisé : gras, italique, listes)"` |
| `eh_course_presentation_field_exercise` | `"Exercice intégré dans la diapositive. Nécessite un type (library) et les données de l'exercice."` |
| `eh_course_presentation_field_exercise_library` | `"Type d'exercice : multichoice, truefalse, blanks, dragtext, singlechoiceset, markthewords, summary, dragquestion, dialogcards"` |
| `eh_course_presentation_field_table` | `"Tableau avec en-têtes (headers) et lignes de données (rows)"` |
| `eh_course_presentation_good_example` | `"Un slide 'content' avec un texte structuré en paragraphes, suivi d'un slide 'quiz' avec un QCM de 4 propositions dont une correcte."` |
| `eh_course_presentation_good_structure` | `"Commencer par un slide 'title', alterner contenu et exercices, terminer par un 'summary' pour la synthèse."` |
| `eh_course_presentation_good_variety` | `"Varier les types d'exercices entre les slides pour maintenir l'attention."` |
| `eh_course_presentation_bad_example` | `"Ne pas mettre plus de 2 exercices par slide. Ne pas mettre de slide vide sans contenu ni exercice."` |
| `eh_course_presentation_bad_no_title` | `"Chaque slide doit avoir un titre, même court, pour la navigation."` |
| `eh_course_presentation_rule_min_slides` | `"Minimum 3 slides recommandé (titre + contenu + résumé)."` |
| `eh_course_presentation_rule_one_exercise` | `"Un seul exercice par slide pour une meilleure lisibilité."` |
| `eh_course_presentation_rule_summary` | `"Le dernier slide peut être de type 'summary' pour récapituler les acquis."` |

#### Tutoriel — `tuto_step2_h5p_content`

Ajouter dans le HTML :
```html
<li><strong>Présentation de cours :</strong> Diaporama interactif avec exercices intégrés (QCM, vrai/faux, texte à trous, etc.).</li>
```

### 7.2. Estimation totale

| Groupe | Clés | × 11 langues |
|--------|------|---------------|
| Identité | 2 | 22 |
| Prompts IA | 3 | 33 |
| L10n player | ~42 | 462 |
| Emergency Help | ~17 | 187 |
| Tutoriel | 1 modif | 11 |
| **Total** | **~65** | **~715** |

> C'est significativement plus que les ~25 clés d'une activité simple, à cause des 42 clés de l10n du player CoursePresentation.

### 7.3. Validation Phase 5

- [x] Nom et description visibles en français
- [ ] Changement de langue met à jour tous les textes
- [x] Les 11 fichiers contiennent les mêmes clés
- [ ] Le player H5P affiche les labels en français (navigation, score, résumé)

> 🧪 **POINT DE TEST — Phase 5 terminée**
> Proposer à l'utilisateur de vérifier :
> 1. La tuile affiche "Présentation de cours" en FR, "Course Presentation" en EN
> 2. Changer la langue → tous les textes (tuile, prompt, aide) se mettent à jour
> 3. Générer un .h5p et vérifier que les labels du player (navigation, résumé, score) sont en français

---

## 8. Phase 6 — Éditeur visuel JSON

### 8.1. Signature de détection

**Fichier** : `js/editor/content-detector.js` — `contentSignatures`

```javascript
'CoursePresentation': (data) =>
    Array.isArray(data.slides) &&
    data.slides.length > 0 &&
    data.slides[0].hasOwnProperty('type'),
```

### 8.2. Mappings

```javascript
// titleKeyToModuleKey
'h5p_course_presentation_name': 'CoursePresentation',

// moduleTranslationKeys
'CoursePresentation': 'h5p_course_presentation_name',
```

### 8.3. Schéma de l'éditeur

L'éditeur CoursePresentation est **le plus complexe** car chaque slide contient potentiellement un sous-exercice de type variable. On utilise le pattern `dynamicObject` (comme QuizSet) :

```javascript
case 'CoursePresentation':
    return {
        title: t('editor_title_prefix') + ' ' + t('h5p_course_presentation_name'),
        sections: [
            {
                title: t('editor_section_general'),
                fields: [
                    { key: 'title', label: t('editor_label_title'), type: 'text', required: true },
                    {
                        key: 'globalBackgroundColor',
                        label: t('editor_label_global_bg_color') || 'Couleur de fond globale',
                        type: 'color',
                        required: false,
                        description: t('editor_desc_global_bg_color') || 'Appliquée à toutes les diapositives par défaut'
                    },
                ]
            },
            {
                title: t('editor_section_slides'),
                countField: 'slides',
                fields: [
                    {
                        key: 'slides',
                        type: 'array',
                        itemLabel: t('h5p_cp_slide'),
                        addLabel: t('editor_add_slide') || 'Ajouter une diapositive',
                        minItems: 2,
                        itemSchema: {
                            type: {
                                type: 'select',
                                label: t('editor_label_type'),
                                required: true,
                                options: [
                                    { value: 'title', label: 'Titre' },
                                    { value: 'content', label: 'Contenu' },
                                    { value: 'content-with-table', label: 'Contenu + Tableau' },
                                    { value: 'quiz', label: 'Exercice' },
                                    { value: 'content-quiz', label: 'Contenu + Exercice' },
                                    { value: 'summary', label: 'Résumé' },
                                ]
                            },
                            title: {
                                type: 'text',
                                label: t('editor_label_title'),
                                required: true
                            },
                            subtitle: {
                                type: 'text',
                                label: t('editor_label_subtitle'),
                                showWhen: { field: 'type', value: 'title' }
                            },
                            backgroundColor: {
                                type: 'color',
                                label: t('editor_label_slide_bg_color') || 'Couleur de fond',
                                required: false,
                                description: t('editor_desc_slide_bg_color') || 'Laissez vide pour utiliser la couleur globale'
                            },
                            text: {
                                type: 'html',
                                label: t('editor_label_text'),
                                showWhen: { field: 'type', values: ['content', 'content-with-table', 'content-quiz'] }
                            },
                            table: {
                                type: 'object',
                                label: t('editor_label_table'),
                                showWhen: { field: 'type', value: 'content-with-table' },
                                fields: {
                                    headers: { type: 'array', itemType: 'text' },
                                    rows: { type: 'array', itemType: 'array' }
                                }
                            },
                            exercise: {
                                type: 'dynamicObject',
                                label: t('editor_label_exercise'),
                                showWhen: { field: 'type', values: ['quiz', 'content-quiz', 'summary'] },
                                selector: 'exercise.library',
                                schemas: {
                                    'multichoice': { /* schéma QCM */ },
                                    'truefalse': { /* schéma V/F */ },
                                    'blanks': { /* schéma texte à trous */ },
                                    'dragtext': { /* schéma glisser les mots */ },
                                    'singlechoiceset': { /* schéma choix unique */ },
                                    'markthewords': { /* schéma marquer les mots */ },
                                    'summary': { /* schéma résumé */ },
                                    'dragquestion': { /* schéma glisser-déposer */ },
                                    'dialogcards': { /* schéma cartes dialogue */ },
                                }
                            }
                        }
                    }
                ]
            }
        ],
        normalizeOnLoad: true,
        denormalizeOnSave: true
    };
```

> **Remarque** : Les schémas dynamiques par type d'exercice peuvent réutiliser les mêmes sous-schémas que QuizSet. Factoriser dans une fonction utilitaire `getExerciseSubSchema(type)` partagée.

### 8.4. Normalisation / Dénormalisation

**`normalizeDataForEditor()`** :
- Si les données viennent du processeur (format H5P complet avec `presentation.slides[].elements[]`), les aplatir en format simplifié pour l'éditeur
- Extraire les exercices de la structure H5P imbriquée vers le format simplifié

**`denormalizeDataForSave()`** :
- Reconvertir le format simplifié de l'éditeur vers le format attendu par le processeur
- Ne PAS reconstruire le H5P complet ici — le processeur s'en charge

### 8.5. Règles de validation — `validators.js`

```javascript
case 'CoursePresentation':
    if (!data.slides || data.slides.length < 2) {
        errors.push({ field: 'slides', message: t('editor_error_min_slides') || 'Minimum 2 diapositives requises' });
    }
    data.slides?.forEach((slide, i) => {
        if (!slide.title && slide.type !== 'title') {
            errors.push({ field: `slides[${i}].title`, message: t('editor_error_slide_title') || 'Titre requis' });
        }
        if (['quiz', 'content-quiz', 'summary'].includes(slide.type) && !slide.exercise) {
            errors.push({ field: `slides[${i}].exercise`, message: t('editor_error_exercise_required') || 'Exercice requis pour ce type de slide' });
        }
        if (slide.exercise?.library === 'multichoice') {
            if (!slide.exercise.answers || slide.exercise.answers.length < 2) {
                errors.push({ field: `slides[${i}].exercise.answers`, message: t('editor_error_min_answers') || 'Minimum 2 réponses' });
            }
            if (!slide.exercise.answers?.some(a => a.correct)) {
                errors.push({ field: `slides[${i}].exercise.answers`, message: t('editor_error_no_correct') || 'Au moins une réponse correcte' });
            }
        }
        // ... validations par type d'exercice
    });
    break;
```

### 8.6. Onglet « Aide » de l'éditeur

L'éditeur CoursePresentation doit proposer un onglet **Aide** (cf. `docs/PRD_NOUVELLE_ACTIVITE_H5P.md` § 7.5) accessible depuis le menu latéral, décrivant chaque champ avec des libellés lisibles (pas les clés techniques), des exemples et les contraintes.

### 8.7. Tests e2e de l'éditeur

**Fichier** : `tests/test-editor-cp.js` + `tests/test-editor-cp.html`

Le test e2e couvre :
- Détection du type CoursePresentation
- Schéma complet (sections, champs, showWhen, dynamicObject, exerciseLibrary)
- Injection des 3 exemples JSON, normalisation et denormalisation
- Vérification des structures par type de slide (title, content, content-with-table, quiz, content-quiz, summary)
- Modifications (ajout de slides, changement de type d'exercice, modification de tables et couleurs)
- Aller-retour normalize → denormalize = données préservées
- Robustesse (slides vides, exercice manquant, library inconnue)
- Préservation du LaTeX

### 8.8. Validation Phase 6

- [x] L'éditeur détecte le type "CoursePresentation"
- [x] Les slides sont listées avec ajout/suppression/réorganisation
- [x] Le changement de type de slide affiche/masque les bons champs (showWhen)
- [x] Les exercices intégrés sont éditables (questions, réponses)
- [ ] La sauvegarde régénère un .h5p valide
- [x] Les validations s'affichent correctement
- [x] Tests e2e passent (`test-editor-cp.html`)
- [ ] Onglet Aide présent et complet

> 🧪 **POINT DE TEST — Phase 6 terminée**
> Proposer à l'utilisateur de tester l'éditeur :
> 1. Générer une présentation, cliquer sur "Modifier" pour ouvrir l'éditeur
> 2. Modifier le titre d'un slide, ajouter/supprimer un slide
> 3. Modifier les réponses d'un QCM intégré
> 4. Sauvegarder et re-télécharger le .h5p → vérifier les modifications dans Lumi

---

## 9. Phase 7 — Export document (DOCX/ODT/PDF)

### 9.1. `js/export/document-formatter.js`

#### Registre

```javascript
'CoursePresentation': formatCoursePresentation,
```

#### Fonction de formatage

```javascript
function formatCoursePresentation(data) {
    const sections = [];
    const title = data.title || t('h5p_course_presentation_name');

    // === PARTIE 1 : SUPPORT DE COURS (pour les élèves) ===
    sections.push({ type: 'header', level: 1, text: title });

    (data.slides || []).forEach((slide, i) => {
        // Titre du slide
        if (slide.title) {
            const level = slide.type === 'title' ? 1 : 2;
            sections.push({ type: 'header', level, text: slide.title });
        }
        if (slide.subtitle) {
            sections.push({ type: 'paragraph', text: slide.subtitle, style: 'subtitle' });
        }

        // Contenu texte
        if (slide.text) {
            sections.push({ type: 'paragraph', text: slide.text });
        }

        // Tableau
        if (slide.table) {
            sections.push({
                type: 'table',
                rows: [slide.table.headers, ...slide.table.rows]
            });
        }

        // Exercice — version énoncé (sans réponses)
        if (slide.exercise) {
            formatExerciseStatement(slide.exercise, sections, i);
        }

        sections.push({ type: 'separator' });
    });

    // === PARTIE 2 : CORRECTION (pour l'enseignant) ===
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 1, text: title + ' — ' + (t('doc_fmt_correction') || 'Correction') });

    (data.slides || []).filter(s => s.exercise).forEach((slide, i) => {
        sections.push({ type: 'header', level: 2, text: slide.title || `Exercice ${i + 1}` });
        formatExerciseCorrection(slide.exercise, sections);
    });

    return { title, sections };
}
```

> Les fonctions `formatExerciseStatement()` et `formatExerciseCorrection()` peuvent réutiliser la logique des formateurs existants (MultipleChoice, TrueFalse, etc.) via un dispatcher interne.

### 9.2. Validation Phase 7

- [x] Export DOCX lisible avec slides numérotées
- [x] Partie 1 = support de cours (exercices sans réponses)
- [x] Partie 2 = correction (exercices avec réponses)
- [ ] Tableaux correctement formatés
- [ ] Formules LaTeX converties en Unicode

> 🧪 **POINT DE TEST — Phase 7 terminée**
> Proposer à l'utilisateur de tester les 3 exports :
> 1. Exporter en DOCX → ouvrir dans Word/LibreOffice
> 2. Exporter en ODT → ouvrir dans LibreOffice
> 3. Exporter en PDF → vérifier la mise en page
> 4. Vérifier : partie 1 = support élève (sans réponses), partie 2 = correction enseignant

---

## 10. Phase 8 — Aide d'urgence

Les 17 clés `eh_course_presentation_*` sont définies en Phase 5 (§7.1).

### Validation Phase 8

- [x] Bouton `?` affiche l'aide contextuelle
- [x] Description des types de slides, types d'exercices
- [x] Exemples de bonne/mauvaise structure
- [ ] Aide visible dans les 11 langues

> 🧪 **POINT DE TEST — Phase 8 terminée**
> Proposer à l'utilisateur de cliquer sur le bouton `?` dans le panneau de CoursePresentation et vérifier que l'aide contextuelle décrit bien les types de slides, exercices, et bonnes pratiques.

---

## 11. Phase 9 — Assets visuels

### 11.1. Icône tuile

**Fichier** : `assets/images/activities/course_presentation_icon-colors_0.webp`

- Format WebP, ~200×200px
- Style : icône représentant un diaporama avec un écran/slides et un symbole interactif
- Cohérent avec le style existant des tuiles

### 11.2. Validation Phase 9

- [x] Icône visible sur la tuile
- [x] Lisible en petit et grand format
- [x] Fichier optimisé (<50 Ko)

---

## 12. Phase 10 — Librairies H5P vendor

### 12.1. Vérification des dossiers existants

Toutes les librairies nécessaires sont **déjà présentes** dans `js/vendor/h5p-libs/` :

| Librairie | Version | Statut |
|-----------|---------|--------|
| `H5P.CoursePresentation-1.26` | 1.26.3 | ✅ Présent |
| `FontAwesome-4.5` | 4.5 | ✅ Présent |
| `H5P.JoubelUI-1.3` | 1.3 | ✅ Présent |
| `H5P.FontIcons-1.0` | 1.0 | ✅ Présent |
| `H5P.Transition-1.0` | 1.0 | ✅ Présent |
| `H5P.Question-1.5` | 1.5 | ✅ Présent |
| `H5P.AdvancedText-1.1` | 1.1 | ✅ Présent |
| `H5P.Table-1.2` | 1.2 | ✅ Présent |
| `H5P.ExportableTextArea-1.3` | 1.3 | ✅ Présent |
| `H5P.MultiChoice-1.16` | 1.16 | ✅ Présent |
| `H5P.TrueFalse-1.8` | 1.8 | ✅ Présent |
| `H5P.Blanks-1.14` | 1.14 | ✅ Présent |
| `H5P.DragText-1.10` | 1.10 | ✅ Présent |
| `H5P.SingleChoiceSet-1.11` | 1.11 | ✅ Présent |
| `H5P.MarkTheWords-1.11` | 1.11 | ✅ Présent |
| `H5P.Summary-1.10` | 1.10 | ✅ Présent |
| `H5P.DragQuestion-1.14` | 1.14 | ✅ Présent |
| `H5P.Dialogcards-1.9` | 1.9 | ✅ Présent |
| `H5P.TextUtilities-1.3` | 1.3 | ✅ Présent |
| `jQuery.ui-1.10` | 1.10 | ✅ Présent |
| `H5P.Audio-1.5` | 1.5 | ✅ Présent |
| `H5P.MathDisplay-1.0` | 1.0 | ✅ Présent |

> **Aucune librairie à télécharger.** Tout est déjà dans le vendor.

### 12.2. Validation Phase 10

- [x] Tous les dossiers existent dans `h5p-libs/`
- [x] Chaque dossier contient `library.json` et `semantics.json`
- [x] Les versions correspondent à celles dans `processorMetadata`

---

## 13. Phase 11 — Tests

### 13.1. Test de cohérence

Lancer `test-definitions.js` — vérifie automatiquement :
- Entrée dans `h5pModules` avec tous les champs requis
- Unicité des IDs DOM
- Existence de l'image
- Existence du processeur
- Existence d'au moins 1 exemple JSON

### 13.2. Test d'intégration spécifique

Vérifier le pipeline complet avec les 2 exemples JSON :
- JSON simplifié → healer → processeur → H5P valide
- Tester avec chacun des 12 sous-types d'exercice
- Tester les cas limites : slide sans exercice, slide avec tableau, slide title seul

### 13.3. Test de robustesse

Cas à tester :
- Slides vide → le healer reconstruit
- Type de slide inconnu → fallback sur "content"
- Library d'exercice inconnue → erreur propre (pas de crash)
- Slide sans titre → titre généré automatiquement
- Un seul slide → fonctionne (pas de résumé)

### 13.4. Validation Phase 11

- [ ] `test-definitions.js` passe
- [ ] `test-i18n.js` passe (65 clés × 11 langues)
- [ ] `test-document-export.js` passe
- [ ] `test-integration.js` passe
- [ ] `test-robustness.js` passe

> 🧪 **POINT DE TEST — Phase 11 terminée**
> Proposer à l'utilisateur de lancer la suite de tests complète :
> `http://localhost:8000/tests/test-all.html`
> Tous les tests doivent passer au vert.

---

## 14. Phase 12 — Documentation

### 14.1. Wiki

Ajouter une section décrivant :
- Ce qu'est une Présentation de cours
- Les types de slides disponibles
- Les types d'exercices intégrables
- Conseils de rédaction du prompt (varier les exercices, commencer par un titre, etc.)
- Captures d'écran

### 14.2. Changelog

```
## v5.1.0
- Ajout : Nouvelle activité H5P « Présentation de cours » (diaporama interactif avec exercices)
```

### 14.3. README

Mettre à jour la liste des activités H5P (22 types au lieu de 21).

---

## 15. Phase 13 — Intégration QuizSet

**Non applicable.** CoursePresentation n'est pas un type de sous-question QuizSet. C'est un conteneur de niveau supérieur (comme QuizSet lui-même).

Cependant, CoursePresentation **consomme** les processeurs des sous-types via `helpers.processChild()`, exactement comme QuizSet. Les entrées `libraryToKey` existantes sont donc essentielles pour le bon fonctionnement.

---

## 16. Phase 14 — Cas spéciaux

### 16.1. MathDisplay conditionnel

Si des formules LaTeX (`\(`, `\)`, `\[`, `\]`, `$`) sont détectées dans le contenu des slides, inclure `H5P.MathDisplay` dans les dépendances. Sinon, l'omettre pour alléger le package.

```javascript
// Dans le processeur, après avoir traité tous les slides
const allText = JSON.stringify(processedSlides);
const hasLatex = /\\\(|\\\)|\\\[|\\\]|\$[^$]+\$/.test(allText);
if (hasLatex) {
    dependencies.push({ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 });
}
```

### 16.2. Processeur async

Comme QuizSet, le processeur CoursePresentation est **async** car il délègue aux processeurs enfants via `helpers.processChild()`. Le routeur (`index.js`) gère déjà les processeurs async.

### 16.3. Dépendances dynamiques

Contrairement aux activités simples qui ont des `extraDependencies` statiques, CoursePresentation doit aussi **collecter dynamiquement** les dépendances des sous-types réellement utilisés dans la présentation. Le processeur retourne `{ content, dependencies }` comme QuizSet.

### 16.4. Pas de renderer spécialisé

Pas de grille ou de visualisation spéciale à capturer. Le rendu standard du player H5P suffit.

### 16.5. Pas de shuffle

L'ordre des slides est pédagogiquement significatif — pas de mélange aléatoire.

---

## 17. Phase BONUS — Upload d'images utilisateur

> **Scope** : Feature transversale, pas spécifique à CoursePresentation. Bénéficierait à toutes les activités supportant des images (DragAndDrop, CoursePresentation, etc.).

### 17.1. Vision

Permettre à l'utilisateur d'ajouter des images depuis son ordinateur dans l'éditeur visuel JSON, et les intégrer automatiquement dans le package H5P lors du téléchargement.

### 17.2. Flux utilisateur

1. L'IA génère l'activité (sans images)
2. L'utilisateur ouvre l'éditeur
3. Sur les champs de type "image" (fond de slide, élément H5P.Image), un bouton **"Ajouter une image"** apparaît
4. L'utilisateur sélectionne un fichier (input type=file, accept="image/*")
5. L'image est affichée en aperçu dans l'éditeur
6. Au téléchargement du .h5p, l'image est injectée dans le ZIP

### 17.3. Architecture technique

| Composant | Modification |
|-----------|-------------|
| `js/editor/field-renderers.js` | Nouveau type de champ `image-upload` avec FileReader + aperçu |
| `js/editor/index.js` | `editorState.pendingImages` (Map: nom → Blob) |
| `js/h5p/h5p-creator.js` | Avant `zip.generateAsync()`, injecter les images depuis `pendingImages` dans `content/images/` |
| `js/editor/content-detector.js` | Ajouter champs `image-upload` dans les schemas des activités qui le supportent |

### 17.4. Structure JSON pour une image intégrée

```javascript
{
    path: "images/user-upload-1.jpg",
    mime: "image/jpeg",
    width: 800,
    height: 450
}
```

### 17.5. Activités bénéficiaires

| Activité | Champ image |
|----------|-------------|
| CoursePresentation | Fond de slide (`slideBackgroundSelector.imageSlideBackground`), fond global |
| DragAndDrop | Image de fond de la zone de travail |
| Flashcards | Image par carte |
| DialogCards | Image par carte |
| Timeline | Image par événement |

### 17.6. Prérequis

- Limiter la taille des images (ex: max 2 Mo, redimensionner côté client si besoin via Canvas)
- Formats acceptés : JPEG, PNG, WebP
- Nettoyage des métadonnées EXIF (confidentialité)
- L'aperçu dans l'éditeur doit être réactif (pas de rechargement de page)

### 17.7. Estimation d'effort

~3-4 fichiers modifiés, ~200-300 lignes de code. Chantier isolé, indépendant du reste du PRD.

---

## 18. Checklist de validation finale

### Fonctionnel

- [x] **Tuile** — Visible, filtrable (text + quiz + h5p)
- [x] **Prompt** — Génère un JSON simplifié valide avec slides variées
- [x] **Génération IA** — "Un clic" produit une présentation cohérente
- [x] **Healing** — JSON réparé (types normalisés, slides reconstituées)
- [x] **H5P** — Le .h5p se télécharge et s'ouvre dans Lumi/h5p.org
- [x] **Slides** — Navigation gauche/droite, sidebar mots-clés
- [ ] **Exercices** — Tous les 12 sous-types fonctionnent (interaction, score, solution)
- [ ] **Feedback** — overallFeedback par exercice, tipsAndFeedback QCM
- [ ] **Résumé** — Slide de résumé agrège les scores
- [x] **Éditeur** — Slides éditables, exercices modifiables, ajout/suppression
- [x] **Export DOCX** — Partie 1 (énoncé) + Partie 2 (correction)
- [ ] **Export ODT** — Idem
- [ ] **Export PDF** — Idem
- [x] **Aide `?`** — Contextuelle, pertinente, 11 langues
- [ ] **Multi-langue** — Tout fonctionne dans les 11 langues

### Technique

- [ ] **Tests** — Tous passent (definitions, i18n, export, intégration, robustesse)
- [ ] **Debug** — Mode `?debug` affiche les logs
- [ ] **Performance** — Pas de régression
- [x] **LaTeX** — MathDisplay inclus conditionnellement

### Documentation

- [ ] **Wiki** — Section Présentation de cours
- [ ] **Changelog** — v5.1.0
- [ ] **README** — 22 types H5P

---

## Annexe A — JSON simplifié IA (entrée)

C'est ce que le LLM génère. **Aucune coordonnée, aucun UUID.** Les noms de librairies H5P sont complets et les clés params sont identiques à celles des activités autonomes correspondantes (cohérence globale Caramel).

```json
{
    "title": "La Révolution française",
    "slides": [
        {
            "type": "title",
            "title": "La Révolution française",
            "subtitle": "De 1789 à 1799 : bouleversements politiques et sociaux"
        },
        {
            "type": "content",
            "title": "Les causes de la Révolution",
            "text": "La France de la fin du XVIIIe siècle traverse une **crise profonde** :\n- Crise financière : l'État est endetté\n- Crise sociale : inégalités entre les trois ordres\n- Crise politique : monarchie absolue contestée"
        },
        {
            "type": "content-with-table",
            "title": "Chronologie des événements",
            "text": "Les grandes dates de la Révolution française :",
            "table": {
                "headers": ["Date", "Événement", "Conséquence"],
                "rows": [
                    ["5 mai 1789", "Ouverture des États généraux", "Début du processus révolutionnaire"],
                    ["14 juillet 1789", "Prise de la Bastille", "Symbole de la chute de l'absolutisme"],
                    ["26 août 1789", "Déclaration des droits de l'homme", "Fondement des droits civiques"],
                    ["21 septembre 1792", "Proclamation de la République", "Fin de la monarchie"],
                    ["21 janvier 1793", "Exécution de Louis XVI", "Rupture définitive avec l'Ancien Régime"]
                ]
            }
        },
        {
            "type": "quiz",
            "title": "Vérification des connaissances",
            "exercise": {
                "library": "H5P.MultiChoice 1.16",
                "question": "Quelle date marque la prise de la Bastille ?",
                "answers": [
                    { "text": "14 juillet 1789", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exact ! C'est devenu la fête nationale française." } },
                    { "text": "26 août 1789", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est la date de la Déclaration des droits de l'homme." } },
                    { "text": "5 mai 1789", "correct": false },
                    { "text": "21 septembre 1792", "correct": false }
                ],
                "behaviour": { "singleAnswer": true },
                "overallFeedback": [
                    { "from": 0, "to": 25, "feedback": "Revoyez les grandes dates de la Révolution." },
                    { "from": 26, "to": 50, "feedback": "C'est un début, continuez !" },
                    { "from": 51, "to": 75, "feedback": "Bon travail !" },
                    { "from": 76, "to": 100, "feedback": "Excellent !" }
                ]
            }
        },
        {
            "type": "content-quiz",
            "title": "La Déclaration des droits",
            "text": "La **Déclaration des droits de l'homme et du citoyen** du 26 août 1789 proclame que *« les hommes naissent et demeurent libres et égaux en droits »*.",
            "exercise": {
                "library": "H5P.TrueFalse 1.8",
                "question": "La Déclaration des droits de l'homme a été adoptée en 1791.",
                "correct": "false",
                "feedbackOnCorrect": "Bravo ! Elle a bien été adoptée le 26 août 1789.",
                "feedbackOnWrong": "Non, la Déclaration a été adoptée le 26 août 1789, pas en 1791."
            }
        },
        {
            "type": "quiz",
            "title": "Compléter le texte",
            "exercise": {
                "library": "H5P.Blanks 1.14",
                "taskDescription": "Complétez les phrases suivantes sur la Révolution française.",
                "questions": [
                    "La prise de la *Bastille* a eu lieu le 14 juillet *1789*.",
                    "La Déclaration des *droits* de l'homme proclame l'égalité des citoyens.",
                    "La République est proclamée le 21 septembre *1792*."
                ],
                "overallFeedback": [
                    { "from": 0, "to": 25, "feedback": "Revoyez les points clés." },
                    { "from": 26, "to": 50, "feedback": "C'est un début." },
                    { "from": 51, "to": 75, "feedback": "Bonne maîtrise." },
                    { "from": 76, "to": 100, "feedback": "Parfait !" }
                ]
            }
        },
        {
            "type": "summary",
            "title": "Synthèse",
            "exercise": {
                "library": "H5P.Summary 1.10",
                "intro": "Choisissez les affirmations correctes pour chaque groupe.",
                "summaries": [
                    {
                        "summary": [
                            "La Bastille a été prise en 1789",
                            "La Bastille a été prise en 1791",
                            "La Bastille a été prise en 1792"
                        ]
                    },
                    {
                        "summary": [
                            "La République est proclamée le 21 septembre 1792",
                            "La République est proclamée le 14 juillet 1789",
                            "La République est proclamée le 5 mai 1789"
                        ]
                    }
                ],
                "overallFeedback": [
                    { "from": 0, "to": 25, "feedback": "Revoyez les points clés du cours." },
                    { "from": 26, "to": 50, "feedback": "C'est un bon début." },
                    { "from": 51, "to": 75, "feedback": "Bonne maîtrise du sujet." },
                    { "from": 76, "to": 100, "feedback": "Parfait !" }
                ]
            }
        }
    ]
}
```

> **Tokens estimés** : ~800-1200 tokens pour une présentation de 7 slides. Le processeur gère les coordonnées, UUIDs et library strings internes.

---

## Annexe B — JSON H5P complet (sortie processeur)

Structure de haut niveau du `content.json` dans le .h5p :

```json
{
    "presentation": {
        "slides": [
            {
                "elements": [
                    {
                        "x": 5,
                        "y": 20,
                        "width": 90,
                        "height": 60,
                        "action": {
                            "library": "H5P.AdvancedText 1.1",
                            "subContentId": "uuid-1",
                            "metadata": { "title": "Titre", "contentType": "Text" },
                            "params": {
                                "text": "<h2>La Révolution française</h2><p>De 1789 à 1799</p>"
                            }
                        },
                        "backgroundOpacity": 80,
                        "displayAsButton": false
                    }
                ],
                "keywords": [
                    { "main": "La Révolution française" }
                ],
                "slideBackgroundSelector": {}
            },
            {
                "elements": [
                    {
                        "x": 2,
                        "y": 2,
                        "width": 96,
                        "height": 96,
                        "action": {
                            "library": "H5P.MultiChoice 1.16",
                            "subContentId": "uuid-4",
                            "metadata": { "title": "Vérification", "contentType": "Exercise" },
                            "params": {
                                "question": "<p>Quelle date marque la prise de la Bastille ?</p>",
                                "answers": [
                                    {
                                        "text": "<div>14 juillet 1789</div>",
                                        "correct": true,
                                        "tipsAndFeedback": {
                                            "tip": "",
                                            "chosenFeedback": "<div>Exact ! C'est devenu la fête nationale française.</div>",
                                            "notChosenFeedback": ""
                                        }
                                    }
                                ],
                                "UI": { "checkAnswerButton": "Vérifier", "...": "..." },
                                "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "..." : "..." },
                                "overallFeedback": [
                                    { "from": 0, "to": 50, "feedback": "Continuez vos efforts !" },
                                    { "from": 51, "to": 80, "feedback": "Bon travail !" },
                                    { "from": 81, "to": 100, "feedback": "Excellent !" }
                                ]
                            }
                        },
                        "backgroundOpacity": 0,
                        "displayAsButton": false
                    }
                ],
                "keywords": [
                    { "main": "Vérification des connaissances" }
                ],
                "slideBackgroundSelector": {}
            }
        ],
        "keywordListEnabled": true,
        "keywordListAlwaysShow": false,
        "keywordListAutoHide": false,
        "keywordListOpacity": 90,
        "globalBackgroundSelector": {}
    },
    "override": {
        "activeSurface": false,
        "hideSummarySlide": false,
        "showSolutionButton": "off",
        "retryButton": "off",
        "summarySlideSolutionButton": true,
        "summarySlideRetryButton": true
    },
    "l10n": {
        "slide": "Diapositive",
        "currentSlide": "Diapositive actuelle",
        "...": "..."
    }
}
```

---

## Annexe C — Templates de layout

Templates de positionnement (en %) appliqués par le processeur selon le type de slide :

```javascript
const SLIDE_LAYOUTS = {
    // Slide de titre : un seul élément centré
    title: [
        { role: 'title', x: 5, y: 15, width: 90, height: 70 }
    ],

    // Slide de contenu : texte pleine page
    content: [
        { role: 'text', x: 2, y: 2, width: 96, height: 96 }
    ],

    // Slide contenu + tableau : texte en haut, tableau en bas
    'content-with-table': [
        { role: 'text',  x: 2, y: 2,  width: 96, height: 35 },
        { role: 'table', x: 2, y: 39, width: 96, height: 59 }
    ],

    // Slide exercice seul : exercice pleine page
    quiz: [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 96 }
    ],

    // Slide contenu + exercice : texte en haut, exercice en bas
    'content-quiz': [
        { role: 'text',     x: 2, y: 2,  width: 96, height: 35 },
        { role: 'exercise', x: 2, y: 39, width: 96, height: 59 }
    ],

    // Slide résumé : exercice pleine page (Summary ou autre)
    summary: [
        { role: 'exercise', x: 2, y: 2, width: 96, height: 96 }
    ]
};
```

> **Pourquoi pas de marges de 0% ?** Laisser 2% de marge évite les problèmes de rendu dans certains players H5P. Les éléments à 0% peuvent être coupés.

---

## Annexe D — Sous-types : mapping et réutilisation

### Mapping library IA → processeur existant

> **Cohérence des clés** : Les champs params de chaque exercice dans la CoursePresentation utilisent les **mêmes clés** que les prompts des activités autonomes correspondantes. Ceci garantit l'homogénéité globale de Caramel et permet au processeur de déléguer directement aux processeurs enfants via `helpers.processChild()`.

| Library IA | Processeur Caramel | transformForQuizSet | Clés params (identiques au prompt autonome) |
|------------|-------------------|---------------------|----------------------------------------------|
| `H5P.MultiChoice 1.16` | `MultipleChoice.js` | ✅ Oui | `question`, `answers[].{text,correct,tipsAndFeedback}`, `behaviour.singleAnswer`, `overallFeedback` |
| `H5P.TrueFalse 1.8` | `TrueFalse.js` | ✅ Oui | `question`, `correct` (string), `feedbackOnCorrect`, `feedbackOnWrong` |
| `H5P.Blanks 1.14` | `FillInTheBlanks.js` | ✅ Oui | `taskDescription`, `questions[]`, `overallFeedback` |
| `H5P.DragText 1.10` | `DragTheWords.js` | ✅ Oui | `taskDescription`, `textField`, `overallFeedback` |
| `H5P.SingleChoiceSet 1.11` | `SingleChoiceSet.js` | ❌ Non | `choices[].{question,answers}`, `overallFeedback` |
| `H5P.MarkTheWords 1.11` | `MarkTheWords.js` | ✅ Oui | `taskDescription`, `textField`, `overallFeedback` |
| `H5P.Summary 1.10` | `Summary.js` | ❌ Non | `intro`, `summaries[].{summary,tip}`, `overallFeedback` |
| `H5P.DragQuestion 1.14` | `DragAndDrop.js` | ✅ Oui | `title`, `dropZones[].{label,correctElements}`, `elements[].{text}`, `overallFeedback` |
| `H5P.Dialogcards 1.9` | `DialogCards.js` | ❌ Non | `title`, `description`, `dialogs[].{text,answer}` |
| `H5P.AdvancedText 1.1` | — (direct) | — | — |
| `H5P.Table 1.2` | — (direct) | — | — |
| `H5P.ExportableTextArea 1.3` | — (direct) | — | — |

### Réutilisation via `helpers.processChild()`

Le processeur CoursePresentation délègue le traitement des sous-exercices exactement comme QuizSet :

1. Construit un objet `{ library, subContentId, metadata, params }`
2. Appelle `helpers.processChild(subContent)` si disponible
3. Le routeur (`index.js`) résout le processeur enfant via `libraryToKey`
4. Le processeur enfant (ex: `MultipleChoice.js`) transforme les params
5. Le résultat est injecté dans l'`action` de l'élément H5P

Pour les types **sans processeur dédié** (AdvancedText, Table, ExportableTextArea), le processeur CoursePresentation construit directement la structure H5P — ces types sont suffisamment simples.

---

## Annexe E — Fichiers modifiés (récapitulatif)

| # | Fichier | Action | Phase |
|---|---------|--------|-------|
| 1 | `js/core/definitions.js` | Ajouter `CoursePresentation` dans `h5pModules` + `customOrder` | 1 |
| 2 | `js/h5p/processors/CoursePresentation.js` | **Créer** — processeur async avec layout + sous-types | 2 |
| 3 | `js/h5p/processors/index.js` | 3 maps : metadata, loaders, libraryToKey | 2 |
| 4 | `js/h5p/json-healer.js` | `H5P_MODULE_KEYS` + `H5P_LIB_VERSIONS` + healing spécifique | 3 |
| 5 | `assets/data/prompts/course_presentation.md` | **Créer** template prompt | 4 |
| 6 | `assets/data/examples/course_presentation_1.json` | **Créer** exemple simple | 4 |
| 7 | `assets/data/examples/course_presentation_2.json` | **Créer** exemple complexe | 4 |
| 8 | `js/services/prompt-generator.js` | Ajouter à `ACTIVITY_CONFIG` | 4 |
| 9 | `js/services/llm.js` | Surcharge modèle `gpt-oss-120b` | 4 |
| 10 | `js/locales/fr.json` | ~65 clés | 5 |
| 11 | `js/locales/en.json` | ~65 clés | 5 |
| 12 | `js/locales/es.json` | ~65 clés | 5 |
| 13 | `js/locales/de.json` | ~65 clés | 5 |
| 14 | `js/locales/it.json` | ~65 clés | 5 |
| 15 | `js/locales/nl.json` | ~65 clés | 5 |
| 16 | `js/locales/pt.json` | ~65 clés | 5 |
| 17 | `js/locales/ar.json` | ~65 clés | 5 |
| 18 | `js/locales/zh.json` | ~65 clés | 5 |
| 19 | `js/locales/jp.json` | ~65 clés | 5 |
| 20 | `js/locales/el.json` | ~65 clés | 5 |
| 21 | `js/editor/content-detector.js` | Signature + mappings + schéma + normalisation | 6 |
| 22 | `js/editor/validators.js` | Règles de validation slides + exercices | 6 |
| 23 | `js/export/document-formatter.js` | Formateur (énoncé + correction) | 7 |
| 24 | `assets/images/activities/course_presentation_icon-colors_0.webp` | **Créer** icône tuile | 9 |
| 25 | `wiki.md` | Section Présentation de cours | 12 |
| 26 | `README.md` | 22 types H5P | 12 |

**Total : 26 fichiers** (dont 11 traductions, 3 créations JS, 3 créations assets, 9 modifications).

**Estimation d'effort** :
- Processeur (Phase 2) : le plus gros chantier (~400-600 lignes)
- Traductions (Phase 5) : ~715 insertions (65 clés × 11 langues)
- Éditeur (Phase 6) : ~200-300 lignes
- Reste : ~100-200 lignes cumulées

---

> **Ce PRD est prêt pour l'implémentation.** Commencer par Phase 1 + Phase 2 (enregistrement + processeur), puis Phase 3 (healer), puis le reste en parallèle.
