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
            'description':     { render: 'html+latex' },
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
            'overallFeedback[].feedback':                  { render: 'html' }
        }
    },

    'TrueFalse': {
        platform: 'H5P',
        machineName: 'H5P.TrueFalse',
        fields: {
            'question':                     { render: 'html+latex' },
            'correct':                      { render: 'plain' },
            'feedbackOnCorrect':            { render: 'html' },
            'feedbackOnWrong':              { render: 'html' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'FillInTheBlanks': {
        platform: 'H5P',
        machineName: 'H5P.Blanks',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'questions[]':                  { render: 'unicode+markers', markerType: 'blanks' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'MarkTheWords': {
        platform: 'H5P',
        machineName: 'H5P.MarkTheWords',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'textField':                    { render: 'unicode+markers', markerType: 'markthewords' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'DragTheWords': {
        platform: 'H5P',
        machineName: 'H5P.DragText',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'textField':                    { render: 'unicode+markers', markerType: 'dragtext' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'DragAndDrop': {
        platform: 'H5P',
        machineName: 'H5P.DragQuestion',
        fields: {
            'elements[].text':              { render: 'html+latex' },
            'dropZones[].label':            { render: 'html+latex' },
            'title':                        { render: 'plain' },
            'overallFeedback[].feedback':   { render: 'html' }
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
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'Summary': {
        platform: 'H5P',
        machineName: 'H5P.Summary',
        fields: {
            'intro':                        { render: 'plain' },
            'summaries[].summary[]':        { render: 'html+latex' },
            'summaries[].tip':              { render: 'html' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'SingleChoiceSet': {
        platform: 'H5P',
        machineName: 'H5P.SingleChoiceSet',
        fields: {
            'choices[].question':           { render: 'html+latex' },
            'choices[].answers[]':          { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'DialogCards': {
        platform: 'H5P',
        machineName: 'H5P.Dialogcards',
        fields: {
            'title':                        { render: 'plain' },
            'description':                  { render: 'html+latex' },
            'dialogs[].text':               { render: 'html+latex' },
            'dialogs[].answer':             { render: 'html+latex' },
            'dialogs[].tips.front':         { render: 'html' },
            'dialogs[].tips.back':          { render: 'html' }
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
            'overallFeedback[].feedback':   { render: 'html' }
        }
    },

    'FindTheWords': {
        platform: 'H5P',
        machineName: 'H5P.FindTheWords',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'wordList':                     { render: 'plain' }
        }
    },

    'SortParagraphs': {
        platform: 'H5P',
        machineName: 'H5P.SortParagraphs',
        fields: {
            'taskDescription':              { render: 'html+latex' },
            'paragraphs[]':                 { render: 'html+latex' },
            'overallFeedback[].feedback':   { render: 'html' }
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

    'QuizSet': {
        platform: 'H5P',
        machineName: 'H5P.QuestionSet',
        container: true,
        fields: {
            'progressType':                 { render: 'plain' },
            'passPercentage':               { render: 'plain' },
            'overallFeedback[].feedback':   { render: 'html' }
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
