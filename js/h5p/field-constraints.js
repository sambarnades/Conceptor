/**
 * field-constraints.js — Contraintes de rendu par champ et par activité
 *
 * Utilisé par healActivitySpecificFields() dans json-healer.js pour appliquer
 * automatiquement la bonne conversion (LaTeX, Unicode, plain text) sur chaque champ
 * en fonction du type de rendu supporté par le player H5P ou Moodle.
 *
 * Voir PRD : docs/PRD_FIELD_CONSTRAINTS_LATEX.md §3
 */

// --- Types de rendu ---
// Chaque type définit ce que le champ supporte et quelle conversion appliquer

export const RENDER_TYPES = {
    'html+latex': {
        supportsLatex: true,
        supportsHtml: true,
        converter: null,
        description: 'HTML avec MathJax — le LaTeX \\(...\\) est rendu visuellement'
    },
    'html': {
        supportsLatex: false,
        supportsHtml: true,
        converter: null,
        description: 'HTML sans math — formatage Markdown converti en HTML'
    },
    'latex': {
        supportsLatex: true,
        supportsHtml: false,
        converter: 'stripHtmlOnly',
        description: 'Texte brut + MathJax — le semantics interdit les balises, pas les formules'
    },
    'unicode': {
        supportsLatex: false,
        supportsHtml: false,
        converter: 'latexToUnicode',
        description: 'Texte brut — formules LaTeX converties en caractères Unicode'
    },
    'unicode+markers': {
        supportsLatex: false,
        supportsHtml: false,
        converter: 'cleanMarkerText',
        description: 'Texte avec marqueurs *mot* — LaTeX converti en Unicode'
    },
    'plain': {
        supportsLatex: false,
        supportsHtml: false,
        converter: 'stripAll',
        description: 'Texte brut strict — tout formatage supprimé'
    },
    'plain+letters': {
        supportsLatex: false,
        supportsHtml: false,
        converter: 'toLettersOnly',
        description: 'Grille de lettres — un seul caractère alphabétique par case'
    }
};


// --- Contraintes de champs par activité H5P ---
// Clé = moduleKey (identique aux clés de processors/index.js)
// Chaque champ utilise la notation pointée, [] pour les tableaux
//
// RÈGLE : un champ ne peut être déclaré `html`/`html+latex` que si le `semantics.json`
// de la bibliothèque lui donne des `tags` (ou `widget: 'html'`). Un champ `type: text`
// SANS `tags` est du texte brut pour la plateforme, et y injecter du HTML se retourne
// contre l'élève :
//   1. Moodle/Éléa appelle `filterParameters()` avant CHAQUE rendu
//      (moodle/h5p/classes/player.php) ;
//   2. `H5PContentValidator::validateText()` (h5p.classes.php) fait, sur un champ
//      sans `tags`, `htmlspecialchars($text, ENT_QUOTES, 'UTF-8', FALSE)` — il
//      ÉCHAPPE le HTML au lieu de le retirer ;
//   3. le lecteur réinjecte ensuite en `$('<div>', {'html': content})`.
//   → l'élève lit « <strong>Bravo !</strong> » en toutes lettres.
// L'aperçu Caramel (h5p-standalone, 100 % JS) n'exécute AUCUN de ces filtres PHP :
// il affiche le gras correctement. L'aperçu ne prouve donc rien ici — seul le
// `semantics.json` fait foi. Contrôle : `node tests/run_semantics_audit.mjs`.
//
// MAIS le LaTeX n'est PAS du HTML : `\(\sqrt{x}\)` ne contient ni `<` ni `&`, il
// traverse `htmlspecialchars` intact et H5P.MathDisplay le rend. D'où le type
// `latex` (pas `plain`) sur ces champs : il retire les balises SANS toucher aux
// formules. Les rétrograder en `plain` dégraderait en Unicode les formules déjà
// présentes dans les exemples livrés (intégrales, matrices).

export const FIELD_CONSTRAINTS = {

    // ========== H5P ==========

    'Timeline': {
        platform: 'H5P',
        machineName: 'H5P.Timeline',
        fields: {
            'timeline.text':            { render: 'html+latex' },
            'timeline.date[].text':     { render: 'html+latex' },
            'timeline.era[].text':      { render: 'html+latex' },
            'timeline.date[].startDate': { render: 'plain' }
        }
    },

    'Flashcards': {
        platform: 'H5P',
        machineName: 'H5P.Flashcard',
        fields: {
            'title':           { render: 'plain' },
            // H5P.Flashcards : `description` est un `text` sans tags (pas de balises,
            // mais MathDisplay est embarqué → les formules restent rendues)
            'description':     { render: 'latex' },
            'cards[].text':    { render: 'html+latex' },
            'cards[].answer':  { render: 'html+latex' },
            'cards[].tip':     { render: 'html+latex' }
        }
    },

    'MultipleChoice': {
        platform: 'H5P',
        machineName: 'H5P.MultiChoice',
        fields: {
            'question':                                    { render: 'html+latex' },
            'answers[].text':                              { render: 'html+latex' },
            'answers[].tipsAndFeedback.tip':               { render: 'html' },
            'answers[].tipsAndFeedback.chosenFeedback':    { render: 'html' },
            'answers[].tipsAndFeedback.notChosenFeedback': { render: 'html' },
            'overallFeedback[].feedback':                  { render: 'latex' }
        }
    },

    'TrueFalse': {
        platform: 'H5P',
        machineName: 'H5P.TrueFalse',
        fields: {
            'question':                     { render: 'html+latex' },
            'correct':                      { render: 'plain' },
            // H5P.TrueFalse : `behaviour.feedbackOn*` sont des `text` sans tags
            'feedbackOnCorrect':            { render: 'latex' },
            'feedbackOnWrong':              { render: 'latex' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'FillInTheBlanks': {
        platform: 'H5P',
        machineName: 'H5P.Blanks',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'questions[]':                  { render: 'unicode+markers', markerType: 'blanks' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'MarkTheWords': {
        platform: 'H5P',
        machineName: 'H5P.MarkTheWords',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'textField':                    { render: 'unicode+markers', markerType: 'markthewords' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'DragTheWords': {
        platform: 'H5P',
        machineName: 'H5P.DragText',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'textField':                    { render: 'unicode+markers', markerType: 'dragtext' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'DragAndDrop': {
        platform: 'H5P',
        machineName: 'H5P.DragQuestion',
        fields: {
            'elements[].text':              { render: 'html+latex' },
            'dropZones[].label':            { render: 'html+latex' },
            'title':                        { render: 'plain' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'Essay': {
        platform: 'H5P',
        machineName: 'H5P.Essay',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'keywords[].keyword':           { render: 'plain' },
            'solution.introduction':        { render: 'html+latex' },
            'solution.sample':              { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'Summary': {
        platform: 'H5P',
        machineName: 'H5P.Summary',
        fields: {
            // H5P.Summary : `intro` est un `widget: 'html'` (tags strong, em, u, a,
            // ul, ol, h2, h3, hr, pre, code) — le processeur y écrit déjà du <p>
            'intro':                        { render: 'html+latex' },
            'summaries[].summary[]':        { render: 'html+latex' },
            'summaries[].tip':              { render: 'html' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'SingleChoiceSet': {
        platform: 'H5P',
        machineName: 'H5P.SingleChoiceSet',
        fields: {
            'choices[].question':           { render: 'html+latex' },
            'choices[].answers[]':          { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'DialogCards': {
        platform: 'H5P',
        machineName: 'H5P.Dialogcards',
        fields: {
            // H5P.Dialogcards : `title` accepte p, br, strong, em, code
            'title':                        { render: 'html+latex' },
            'description':                  { render: 'html+latex' },
            'dialogs[].text':               { render: 'html+latex' },
            'dialogs[].answer':             { render: 'html+latex' },
            'dialogs[].tips.front':         { render: 'html' },
            'dialogs[].tips.back':          { render: 'html' }
        }
    },

    'Dictation': {
        platform: 'H5P',
        machineName: 'H5P.Dictation',
        fields: {
            'title':                        { render: 'plain' },
            'taskDescription':              { render: 'html' },
            // Texte à taper par l'élève : Unicode STRICT (accents et ponctuation comptent
            // pour la correction de la dictée — ni HTML ni LaTeX, jamais de strip).
            'sentences[].text':             { render: 'unicode' },
            'sentences[].description':      { render: 'unicode' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'Glossary': {
        platform: 'H5P',
        machineName: 'H5P.Accordion',
        fields: {
            'panels[].title':               { render: 'unicode' },
            'panels[].text':                { render: 'html+latex' },
            // Alias éditeur (le schéma éditeur utilise 'items' au lieu de 'panels')
            'items[].title':                { render: 'unicode' },
            'items[].text':                 { render: 'html+latex' }
        }
    },

    'Crossword': {
        platform: 'H5P',
        machineName: 'H5P.Crossword',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'words[].clue':                 { render: 'plain' },
            'words[].answer':               { render: 'plain+letters' },
            'words[].extraClue.params.text': { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'FindTheWords': {
        platform: 'H5P',
        machineName: 'H5P.FindTheWords',
        fields: {
            // H5P.FindTheWords : `taskDescription` est un `text` sans tags
            'taskDescription':              { render: 'latex' },
            'wordList':                     { render: 'plain' }
        }
    },

    'SortParagraphs': {
        platform: 'H5P',
        machineName: 'H5P.SortParagraphs',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'paragraphs[]':                 { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'latex' }
        }
    },

    'Chart': {
        platform: 'H5P',
        machineName: 'H5P.Chart',
        fields: {
            'listOfTypes[].text':           { render: 'unicode' },
            'listOfTypes[].value':          { render: 'plain' },
            'listOfTypes[].color':          { render: 'plain' },
            'graphMode':                    { render: 'plain' }
        }
    },

    'ComplexFillTheBlanks': {
        platform: 'H5P',
        machineName: 'H5P.AdvancedBlanks',
        fields: {}
        // Pass-through : tous les champs passent directement au format H5P (html+latex)
    },

    'CoursePresentation': {
        platform: 'H5P',
        machineName: 'H5P.CoursePresentation',
        container: true,
        fields: {
            'title':                        { render: 'plain' },
            'slides[].title':               { render: 'html+latex' },
            'slides[].subtitle':            { render: 'html+latex' },
            'slides[].text':                { render: 'html+latex' },
            'slides[].table.headers[]':     { render: 'html+latex' },
            'slides[].table.rows[][]':      { render: 'html+latex' },
            'slides[].backgroundColor':     { render: 'plain' }
            // slides[].exercise.* → délégué au processeur enfant selon exercise.library
        }
    },

    'InteractiveBook': {
        platform: 'H5P',
        machineName: 'H5P.InteractiveBook',
        container: true,
        fields: {
            'title':                                  { render: 'plain' },
            'cover.description':                      { render: 'html+latex' },
            'chapters[].title':                       { render: 'plain' },
            'chapters[].content[].text':              { render: 'html+latex' },
            'chapters[].content[].table.headers[]':   { render: 'html+latex' },
            'chapters[].content[].table.rows[][]':    { render: 'html+latex' },
            'chapters[].content[].alt':               { render: 'plain' }
            // chapters[].content[] exercices → délégué au processeur enfant selon library
        }
    },

    'InteractiveVideo': {
        platform: 'H5P',
        machineName: 'H5P.InteractiveVideo',
        container: true,
        // Contraintes sur le format intermédiaire « plat » (avant processeur).
        fields: {
            'title':                            { render: 'plain' },
            'interactions[].question':          { render: 'html+latex' },
            'interactions[].answers[].text':    { render: 'html+latex' },
            'interactions[].answers[].feedback':{ render: 'html' },
            'interactions[].feedbackOnCorrect': { render: 'html' },
            'interactions[].feedbackOnWrong':   { render: 'html' },
            'interactions[].text':              { render: 'html+latex' },
            'interactions[].questions[]':       { render: 'html+latex' },
            'summary.intro':                    { render: 'html+latex' },
            'summary.statements[][]':           { render: 'html+latex' }
        }
    },

    'ImageHotspots': {
        platform: 'H5P',
        machineName: 'H5P.ImageHotspots',
        // Contraintes sur le format intermédiaire « plat » (avant processeur).
        // L'image de fond est injectée par l'UI ; le LLM ne produit que du texte par point.
        fields: {
            'title':                    { render: 'plain' },
            'backgroundImageAltText':   { render: 'plain' },
            'globalColor':              { render: 'plain' },
            'hotspots[].header':        { render: 'plain' },
            'hotspots[].text':          { render: 'html+latex' },
            // Format éditeur enrichi : le texte d'un bloc Texte d'un point (richtext WYSIWYG + LaTeX).
            'hotspots[].content[].text': { render: 'html+latex' },
            'hotspots[].hotspotColor':  { render: 'plain' }
        }
    },

    'FindTheHotspot': {
        platform: 'H5P',
        machineName: 'H5P.ImageHotspotQuestion',
        // Contraintes sur le format intermédiaire « plat » (avant processeur).
        // Tous les champs de la semantics sont de type `text` (pas de HTML ni LaTeX :
        // les feedbacks s'affichent en popup brut) ; l'image est injectée par l'UI.
        fields: {
            'title':                    { render: 'plain' },
            'taskDescription':          { render: 'plain' },
            'hotspots[].label':         { render: 'plain' },
            'hotspots[].feedbackText':  { render: 'plain' },
            'noneSelectedFeedback':     { render: 'plain' }
        }
    },

    'FindMultipleHotspots': {
        platform: 'H5P',
        machineName: 'H5P.ImageMultipleHotspotQuestion',
        // Mêmes contraintes que FindTheHotspot + champs propres à la lib communautaire.
        fields: {
            'title':                    { render: 'plain' },
            'questionTitle':            { render: 'plain' },
            'taskDescription':          { render: 'plain' },
            'hotspotName':              { render: 'plain' },
            'hotspots[].label':         { render: 'plain' },
            'hotspots[].feedbackText':  { render: 'plain' },
            'noneSelectedFeedback':     { render: 'plain' },
            'alreadySelectedFeedback':  { render: 'plain' }
        }
    },

    'QuizSet': {
        platform: 'H5P',
        machineName: 'H5P.QuestionSet',
        container: true,
        fields: {
            'progressType':                 { render: 'plain' },
            'passPercentage':               { render: 'plain' },
            'overallFeedback[].feedback':   { render: 'latex' }
            // questions[].params.* → délégué au processeur enfant selon questions[].library
        }
    },

    // ========== Moodle ==========

    'QCM': {
        platform: 'Moodle',
        machineName: 'simplequiz',
        fields: {
            'questions[].text':                 { render: 'html+latex' },
            'questions[].answers[].text':       { render: 'html+latex' },
            'questions[].answers[].feedback':   { render: 'html' }
        }
    },

    'Appariement': {
        platform: 'Moodle',
        machineName: 'epikmatch',
        fields: {
            'intro':                        { render: 'html+latex' },
            'pairs[].question':             { render: 'html+latex' },
            'pairs[].answer':               { render: 'html+latex' }
        }
    },

    'Page': {
        platform: 'Moodle',
        machineName: 'page',
        fields: {
            'title':                        { render: 'plain' },
            'blocks[].data':                { render: 'html+latex' },
            'intro':                        { render: 'html+latex' },
            'blocks[].data.text':           { render: 'html+latex' },
            'blocks[].data.content':        { render: 'html+latex' },
            'blocks[].data.label':          { render: 'html+latex' },
            'blocks[].data.caption':        { render: 'html+latex' },
            'blocks[].data.cards[].text':   { render: 'html+latex' },
            'blocks[].data.callouts[].text': { render: 'html+latex' },
            'blocks[].data.stats[].label':  { render: 'html+latex' },
            'blocks[].data.sections[].text': { render: 'html+latex' },
            'blocks[].data.questions[].q':  { render: 'html+latex' },
            'blocks[].data.questions[].a':  { render: 'html+latex' },
            'blocks[].data.items[].myth':   { render: 'html+latex' },
            'blocks[].data.items[].reality': { render: 'html+latex' },
            'blocks[].data.quote_langue_initiale': { render: 'html+latex' },
            'blocks[].data.quote_langue_arrivee':  { render: 'html+latex' },
            // Champs courts (text) et listes (stringArray) qui peuvent contenir
            // du LaTeX dans les blocs Page — sans ces entrées, l'éditeur
            // visuel les affichait en input plain (formules en clair, pas de
            // bouton formule). Le healer Caramel skip ces types via continue,
            // donc no-op à la régénération .mbz.
            'blocks[].data.title':                  { render: 'html+latex' },
            'blocks[].data.subtitle':               { render: 'html+latex' },
            'blocks[].data.cards[].title':          { render: 'html+latex' },
            'blocks[].data.cards[].caption':        { render: 'html+latex' },
            'blocks[].data.stats[].value':          { render: 'html+latex' },
            'blocks[].data.headers[]':              { render: 'html+latex' },
            'blocks[].data.rows[][]':               { render: 'html+latex' },
            'blocks[].data.chips[]':                { render: 'html+latex' },
            'blocks[].data.paragraphs[]':           { render: 'html+latex' },
            'blocks[].data.steps[]':                { render: 'html+latex' },
            'blocks[].data.sections[].subtitle':    { render: 'html+latex' },
            'blocks[].data.left.caption':           { render: 'html+latex' },
            'blocks[].data.right.caption':          { render: 'html+latex' }
        }
    },

    'Livre': {
        platform: 'Moodle',
        machineName: 'book',
        fields: {
            'title':                                            { render: 'plain' },
            'intro':                                            { render: 'html+latex' },
            'chapters[].title':                                 { render: 'plain' },
            'chapters[].blocks[].data':                         { render: 'html+latex' },
            'chapters[].blocks[].data.text':                    { render: 'html+latex' },
            'chapters[].blocks[].data.content':                 { render: 'html+latex' },
            'chapters[].blocks[].data.label':                   { render: 'html+latex' },
            'chapters[].blocks[].data.caption':                 { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].text':            { render: 'html+latex' },
            'chapters[].blocks[].data.callouts[].text':         { render: 'html+latex' },
            'chapters[].blocks[].data.stats[].label':           { render: 'html+latex' },
            'chapters[].blocks[].data.sections[].text':         { render: 'html+latex' },
            'chapters[].blocks[].data.questions[].q':           { render: 'html+latex' },
            'chapters[].blocks[].data.questions[].a':           { render: 'html+latex' },
            'chapters[].blocks[].data.items[].myth':            { render: 'html+latex' },
            'chapters[].blocks[].data.items[].reality':         { render: 'html+latex' },
            'chapters[].blocks[].data.quote_langue_initiale':   { render: 'html+latex' },
            'chapters[].blocks[].data.quote_langue_arrivee':    { render: 'html+latex' },
            // Mêmes ajouts que pour Page (cf. commentaire ci-dessus).
            'chapters[].blocks[].data.title':                   { render: 'html+latex' },
            'chapters[].blocks[].data.subtitle':                { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].title':           { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].caption':         { render: 'html+latex' },
            'chapters[].blocks[].data.stats[].value':           { render: 'html+latex' },
            'chapters[].blocks[].data.headers[]':               { render: 'html+latex' },
            'chapters[].blocks[].data.rows[][]':                { render: 'html+latex' },
            'chapters[].blocks[].data.chips[]':                 { render: 'html+latex' },
            'chapters[].blocks[].data.paragraphs[]':            { render: 'html+latex' },
            'chapters[].blocks[].data.steps[]':                 { render: 'html+latex' },
            'chapters[].blocks[].data.sections[].subtitle':     { render: 'html+latex' },
            'chapters[].blocks[].data.left.caption':            { render: 'html+latex' },
            'chapters[].blocks[].data.right.caption':           { render: 'html+latex' }
        }
    },

    'Millionnaire': {
        platform: 'Moodle',
        machineName: 'millionnairev2',
        fields: {
            'questions[].question':         { render: 'plain' },
            'questions[].goodanswer':       { render: 'plain' },
            'questions[].badanswer[]':      { render: 'plain' }
        }
    },

    'Test': {
        platform: 'Moodle',
        machineName: 'quiz',
        fields: {
            'bank_description':                         { render: 'html+latex' },
            'questions[].questiontext':                 { render: 'html+latex' },
            'questions[].answers[].text':               { render: 'html+latex' },
            'questions[].answers[].feedback':           { render: 'html+latex' },
            'questions[].subquestions[].text':           { render: 'html+latex' },
            'questions[].subquestions[].answer':         { render: 'plain' },
            'questions[].feedback':                     { render: 'html+latex' },
            'questions[].correctfeedback':              { render: 'html+latex' },
            'questions[].partiallycorrectfeedback':     { render: 'html+latex' },
            'questions[].incorrectfeedback':            { render: 'html+latex' },
            'questions[].answer.feedback_true':         { render: 'html+latex' },
            'questions[].answer.feedback_false':        { render: 'html+latex' },
            'questions[].answer.feedback':              { render: 'html+latex' },
            'questions[].hints[]':                      { render: 'html+latex' }
            // Note : cloze questiontext = unicode (pas de LaTeX à cause de {1:TYPE:...})
            // Note : shortanswer answers = plain
            // Ces cas sont gérés contextuellement dans moodle-creator.js
        }
    },

    'Glossaire': {
        platform: 'Moodle',
        machineName: 'glossary',
        fields: {
            'entries[].concept':            { render: 'plain' },
            'entries[].definition':         { render: 'html+latex' }
        }
    },

    'Devoir': {
        platform: 'Moodle',
        machineName: 'assign',
        fields: {
            'title':                            { render: 'unicode' },
            'intro':                            { render: 'html+latex' },
            'description':                      { render: 'html+latex' },
            'rubricName':                       { render: 'unicode' },
            'criteria[].description':           { render: 'unicode' },
            'criteria[].levels[].definition':   { render: 'unicode' }
        }
    },

    // ========== Alias Éléa ==========
    // L'éditeur utilise les clés elea_* comme moduleKey,
    // mais les contraintes ci-dessus utilisent les noms courts.
    // Ces alias assurent que resolveRenderTypeForField fonctionne.

    'elea_qcm': {
        platform: 'Moodle',
        machineName: 'simplequiz',
        fields: {
            'questions[].text':                 { render: 'html+latex' },
            'questions[].answers[].text':       { render: 'html+latex' },
            'questions[].answers[].feedback':   { render: 'html' }
        }
    },

    'elea_appariement': {
        platform: 'Moodle',
        machineName: 'epikmatch',
        fields: {
            'intro':                        { render: 'html+latex' },
            'pairs[].question':             { render: 'html+latex' },
            'pairs[].answer':               { render: 'html+latex' }
        }
    },

    'elea_page': {
        platform: 'Moodle',
        machineName: 'page',
        fields: {
            'title':                        { render: 'plain' },
            'blocks[].data':                { render: 'html+latex' },
            'intro':                        { render: 'html+latex' },
            // Sous-champs des blocs Page (tout est HTML dans Moodle)
            'blocks[].data.text':           { render: 'html+latex' },
            'blocks[].data.content':        { render: 'html+latex' },
            'blocks[].data.label':          { render: 'html+latex' },
            'blocks[].data.caption':        { render: 'html+latex' },
            'blocks[].data.cards[].text':   { render: 'html+latex' },
            'blocks[].data.callouts[].text': { render: 'html+latex' },
            'blocks[].data.stats[].label':  { render: 'html+latex' },
            'blocks[].data.sections[].text': { render: 'html+latex' },
            'blocks[].data.questions[].q':  { render: 'html+latex' },
            'blocks[].data.questions[].a':  { render: 'html+latex' },
            'blocks[].data.items[].myth':   { render: 'html+latex' },
            'blocks[].data.items[].reality': { render: 'html+latex' },
            'blocks[].data.quote_langue_initiale': { render: 'html+latex' },
            'blocks[].data.quote_langue_arrivee':  { render: 'html+latex' },
            // Champs courts (text) et listes (stringArray) qui peuvent contenir
            // du LaTeX dans les blocs Page — sans ces entrées, l'éditeur
            // visuel les affichait en input plain (formules en clair, pas de
            // bouton formule). Le healer Caramel skip ces types via continue,
            // donc no-op à la régénération .mbz.
            'blocks[].data.title':                  { render: 'html+latex' },
            'blocks[].data.subtitle':               { render: 'html+latex' },
            'blocks[].data.cards[].title':          { render: 'html+latex' },
            'blocks[].data.cards[].caption':        { render: 'html+latex' },
            'blocks[].data.stats[].value':          { render: 'html+latex' },
            'blocks[].data.headers[]':              { render: 'html+latex' },
            'blocks[].data.rows[][]':               { render: 'html+latex' },
            'blocks[].data.chips[]':                { render: 'html+latex' },
            'blocks[].data.paragraphs[]':           { render: 'html+latex' },
            'blocks[].data.steps[]':                { render: 'html+latex' },
            'blocks[].data.sections[].subtitle':    { render: 'html+latex' },
            'blocks[].data.left.caption':           { render: 'html+latex' },
            'blocks[].data.right.caption':          { render: 'html+latex' }
        }
    },

    'elea_livre': {
        platform: 'Moodle',
        machineName: 'book',
        fields: {
            'title':                                            { render: 'plain' },
            'intro':                                            { render: 'html+latex' },
            'chapters[].title':                                 { render: 'plain' },
            'chapters[].blocks[].data':                         { render: 'html+latex' },
            'chapters[].blocks[].data.text':                    { render: 'html+latex' },
            'chapters[].blocks[].data.content':                 { render: 'html+latex' },
            'chapters[].blocks[].data.label':                   { render: 'html+latex' },
            'chapters[].blocks[].data.caption':                 { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].text':            { render: 'html+latex' },
            'chapters[].blocks[].data.callouts[].text':         { render: 'html+latex' },
            'chapters[].blocks[].data.stats[].label':           { render: 'html+latex' },
            'chapters[].blocks[].data.sections[].text':         { render: 'html+latex' },
            'chapters[].blocks[].data.questions[].q':           { render: 'html+latex' },
            'chapters[].blocks[].data.questions[].a':           { render: 'html+latex' },
            'chapters[].blocks[].data.items[].myth':            { render: 'html+latex' },
            'chapters[].blocks[].data.items[].reality':         { render: 'html+latex' },
            'chapters[].blocks[].data.quote_langue_initiale':   { render: 'html+latex' },
            'chapters[].blocks[].data.quote_langue_arrivee':    { render: 'html+latex' },
            // Mêmes ajouts que pour Page (cf. commentaire ci-dessus).
            'chapters[].blocks[].data.title':                   { render: 'html+latex' },
            'chapters[].blocks[].data.subtitle':                { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].title':           { render: 'html+latex' },
            'chapters[].blocks[].data.cards[].caption':         { render: 'html+latex' },
            'chapters[].blocks[].data.stats[].value':           { render: 'html+latex' },
            'chapters[].blocks[].data.headers[]':               { render: 'html+latex' },
            'chapters[].blocks[].data.rows[][]':                { render: 'html+latex' },
            'chapters[].blocks[].data.chips[]':                 { render: 'html+latex' },
            'chapters[].blocks[].data.paragraphs[]':            { render: 'html+latex' },
            'chapters[].blocks[].data.steps[]':                 { render: 'html+latex' },
            'chapters[].blocks[].data.sections[].subtitle':     { render: 'html+latex' },
            'chapters[].blocks[].data.left.caption':            { render: 'html+latex' },
            'chapters[].blocks[].data.right.caption':           { render: 'html+latex' }
        }
    },

    'elea_millionnaire': {
        platform: 'Moodle',
        machineName: 'millionnairev2',
        fields: {
            'questions[].question':         { render: 'plain' },
            'questions[].goodanswer':       { render: 'plain' },
            'questions[].badanswer[]':      { render: 'plain' }
        }
    },

    'elea_test': {
        platform: 'Moodle',
        machineName: 'quiz',
        fields: {
            'bank_description':                         { render: 'html+latex' },
            'questions[].questiontext':                 { render: 'html+latex' },
            'questions[].answers[].text':               { render: 'html+latex' },
            'questions[].answers[].feedback':           { render: 'html+latex' },
            'questions[].subquestions[].text':           { render: 'html+latex' },
            'questions[].subquestions[].answer':         { render: 'plain' },
            'questions[].feedback':                     { render: 'html+latex' },
            'questions[].correctfeedback':              { render: 'html+latex' },
            'questions[].partiallycorrectfeedback':     { render: 'html+latex' },
            'questions[].incorrectfeedback':            { render: 'html+latex' },
            'questions[].answer.feedback_true':         { render: 'html+latex' },
            'questions[].answer.feedback_false':        { render: 'html+latex' },
            'questions[].answer.feedback':              { render: 'html+latex' },
            'questions[].hints[]':                      { render: 'html+latex' },
            // Alias via content.* (dynamicObject dans l'éditeur)
            'questions[].content.questiontext':         { render: 'html+latex' },
            'questions[].content.answers[].text':       { render: 'html+latex' },
            'questions[].content.answers[].feedback':   { render: 'html+latex' },
            'questions[].content.feedback':             { render: 'html+latex' },
            'questions[].content.correctfeedback':      { render: 'html+latex' },
            'questions[].content.partiallycorrectfeedback': { render: 'html+latex' },
            'questions[].content.incorrectfeedback':    { render: 'html+latex' },
            'questions[].content.subquestions[].text':   { render: 'html+latex' },
            'questions[].content.subquestions[].answer': { render: 'plain' },
            // Feedbacks spécifiques truefalse (dans un objet answer)
            'questions[].content.answer.feedback_true':  { render: 'html+latex' },
            'questions[].content.answer.feedback_false': { render: 'html+latex' },
            // Feedback réponse numérique (dans un objet answer)
            'questions[].content.answer.feedback':       { render: 'html+latex' },
            // Hints (indices)
            'questions[].content.hints[]':               { render: 'html+latex' }
        }
    },

    'elea_glossaire': {
        platform: 'Moodle',
        machineName: 'glossary',
        fields: {
            'entries[].concept':            { render: 'plain' },
            'entries[].definition':         { render: 'html+latex' }
        }
    },

    'elea_devoir': {
        platform: 'Moodle',
        machineName: 'assign',
        fields: {
            'title':                            { render: 'unicode' },
            'intro':                            { render: 'html+latex' },
            'description':                      { render: 'html+latex' },
            'rubricName':                       { render: 'unicode' },
            'criteria[].description':           { render: 'unicode' },
            'criteria[].levels[].definition':   { render: 'unicode' }
        }
    }
};


// --- Résolution de chemins et application des conversions ---

/**
 * Applique une fonction de conversion sur la valeur trouvée au chemin donné.
 * Gère la notation pointée et les tableaux ([] dans le chemin).
 *
 * Exemples de chemins :
 *   'title'                      → obj.title
 *   'cards[].text'               → obj.cards[0].text, obj.cards[1].text, ...
 *   'slides[].table.rows[][]'    → chaque cellule de chaque tableau de chaque slide
 *   'criteria[].levels[].definition' → imbrication multiple
 *
 * @param {object} obj - L'objet à parcourir (modifié en place)
 * @param {string} fieldPath - Le chemin du champ (notation pointée avec [])
 * @param {function} converterFn - Fonction (string) → string à appliquer
 */
export function applyToPath(obj, fieldPath, converterFn) {
    if (!obj || !fieldPath || !converterFn) return;

    // Découper le chemin en segments : 'cards[].text' → ['cards', '[]', 'text']
    // 'rows[][]' → ['rows', '[]', '[]']
    const segments = [];
    for (const part of fieldPath.split('.')) {
        // Extraire le nom de base et compter les [] à la fin
        // Ex: 'rows[][]' → name='rows', bracketCount=2
        const bracketMatch = part.match(/^([^[]*)((?:\[\])*)$/);
        if (bracketMatch) {
            const name = bracketMatch[1];
            const brackets = bracketMatch[2];
            if (name) segments.push(name);
            // Ajouter un marqueur [] par paire de crochets
            const bracketCount = brackets.length / 2;
            for (let i = 0; i < bracketCount; i++) {
                segments.push('[]');
            }
        } else {
            segments.push(part);
        }
    }

    _applyRecursive(obj, segments, 0, converterFn);
}

/**
 * Parcours récursif des segments du chemin.
 * @private
 */
function _applyRecursive(current, segments, index, converterFn) {
    if (current == null) return;

    // Fin du chemin → appliquer la conversion
    if (index >= segments.length) {
        return; // Ne devrait pas arriver (la conversion est faite au dernier segment)
    }

    const segment = segments[index];
    const isLast = (index === segments.length - 1);

    if (segment === '[]') {
        // Itérer sur le tableau
        if (!Array.isArray(current)) return;
        if (isLast) {
            // Le tableau lui-même contient les valeurs à convertir (ex: 'questions[]')
            for (let i = 0; i < current.length; i++) {
                if (typeof current[i] === 'string') {
                    current[i] = converterFn(current[i]);
                }
            }
        } else {
            // Continuer la descente dans chaque élément (objet ou sous-tableau)
            for (const item of current) {
                _applyRecursive(item, segments, index + 1, converterFn);
            }
        }
    } else {
        // Segment nommé
        if (typeof current !== 'object' || Array.isArray(current)) return;

        if (isLast) {
            // Dernier segment → appliquer la conversion sur la valeur
            if (typeof current[segment] === 'string') {
                current[segment] = converterFn(current[segment]);
            }
        } else {
            // Segment suivant est [] → passer le tableau
            const next = segments[index + 1];
            if (next === '[]') {
                _applyRecursive(current[segment], segments, index + 1, converterFn);
            } else {
                // Descendre dans l'objet imbriqué
                _applyRecursive(current[segment], segments, index + 1, converterFn);
            }
        }
    }
}


// --- Registre des convertisseurs ---
// Initialisé par json-healer.js via registerConverters() pour éviter les dépendances circulaires

const _converters = {};

/**
 * Enregistre les fonctions de conversion depuis json-healer.js.
 * Appelé une fois au chargement du module json-healer.
 *
 * @param {object} converters - Objet avec les clés : latexToUnicode, cleanMarkerText, stripAll, toLettersOnly
 */
export function registerConverters(converters) {
    Object.assign(_converters, converters);
}

/**
 * Retire les balises HTML et le Markdown d'un texte, mais PRÉSERVE les formules
 * LaTeX telles quelles. C'est le convertisseur du type de rendu `latex`.
 *
 * Pour un champ `type: text` sans `tags`, Moodle applique `htmlspecialchars` :
 * une balise devient visible à l'écran (« <strong> » en toutes lettres), alors
 * qu'une formule `\(...\)` traverse le filtre intacte et se fait rendre par
 * H5P.MathDisplay. On retire donc les unes sans toucher aux autres.
 *
 * Vit ICI plutôt que dans json-healer.js parce que `richtext-editor.js` (fichier
 * byte-identique avec Sucrerie) en a besoin et que Sucrerie n'a pas de healer.
 */
export function stripHtmlKeepLatex(text) {
    if (!text || typeof text !== 'string') return text;

    // Mettre les formules de côté AVANT tout : elles peuvent contenir < et >
    // (ex. \(a < b\)) que le retrait de balises confondrait avec du HTML.
    const formules = [];
    let cleaned = text.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, (m) => {
        formules.push(m);
        return `\u0000LATEX${formules.length - 1}\u0000`;
    });

    // Markdown : la plateforme ne le convertit pas → les * s'afficheraient
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    // Balises HTML
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    // Entités courantes
    cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    // Restaurer les formules intactes
    cleaned = cleaned.replace(/\u0000LATEX(\d+)\u0000/g, (_, i) => formules[Number(i)]);
    return cleaned.trim();
}

/**
 * Retourne la fonction de conversion pour un type de rendu donné.
 * @param {string} renderType - Le type de rendu (ex: 'unicode', 'plain')
 * @returns {function|null} La fonction de conversion, ou null si aucune conversion nécessaire
 */
export function getConverter(renderType) {
    const config = RENDER_TYPES[renderType];
    if (!config || !config.converter) return null;
    return _converters[config.converter] || null;
}

/**
 * Retourne les contraintes de champs pour un moduleKey donné.
 * @param {string} moduleKey - La clé du module (ex: 'MultipleChoice', 'QCM')
 * @returns {object|null} L'objet de contraintes ou null
 */
export function getConstraints(moduleKey) {
    return FIELD_CONSTRAINTS[moduleKey] || null;
}
