/**
 * fixtures-prefixes.js — Table préfixe de fixture → moduleKey, SANS dépendance Node.
 *
 * Extraite de `fixtures-map.mjs`, qui importe `node:fs` et n'est donc pas chargeable
 * dans un navigateur. La suite `tests/test-activity-wiring.js` (exécutée dans
 * `test-all.html`) a besoin de cette table pour vérifier que chaque activité dispose
 * d'une fixture d'exemple : la dupliquer aurait créé une seconde source de vérité,
 * qui aurait dérivé au premier ajout d'activité.
 *
 * `fixtures-map.mjs` la ré-exporte : les appelants Node existants sont inchangés.
 *
 * @module tests/roundtrip/fixtures-prefixes
 */

export const PREFIX_TO_MODULE = [
    // --- H5P ---
    { prefix: 'timeline', moduleKey: 'Timeline', kind: 'h5p' },
    { prefix: 'flashcards', moduleKey: 'Flashcards', kind: 'h5p' },
    { prefix: 'accordion', moduleKey: 'Glossary', kind: 'h5p' },        // H5P.Accordion = Glossary (Caramel)
    { prefix: 'crosswords', moduleKey: 'Crossword', kind: 'h5p' },
    { prefix: 'essay', moduleKey: 'Essay', kind: 'h5p' },
    { prefix: 'summary', moduleKey: 'Summary', kind: 'h5p' },
    { prefix: 'drag_the_words', moduleKey: 'DragTheWords', kind: 'h5p' },
    { prefix: 'drag_and_drop', moduleKey: 'DragAndDrop', kind: 'h5p' },
    { prefix: 'fill_in_the_blanks', moduleKey: 'FillInTheBlanks', kind: 'h5p' },
    { prefix: 'mark_the_words', moduleKey: 'MarkTheWords', kind: 'h5p' },
    { prefix: 'true_false', moduleKey: 'TrueFalse', kind: 'h5p' },
    { prefix: 'multiple_choice', moduleKey: 'MultipleChoice', kind: 'h5p' },
    { prefix: 'find_the_words', moduleKey: 'FindTheWords', kind: 'h5p' },
    { prefix: 'sort_the_paragraphs', moduleKey: 'SortParagraphs', kind: 'h5p' },
    { prefix: 'single_choice_set', moduleKey: 'SingleChoiceSet', kind: 'h5p' },
    { prefix: 'dialog_cards', moduleKey: 'DialogCards', kind: 'h5p' },
    { prefix: 'charts', moduleKey: 'Chart', kind: 'h5p' },
    { prefix: 'course_presentation', moduleKey: 'CoursePresentation', kind: 'h5p' },
    { prefix: 'interactive_book', moduleKey: 'InteractiveBook', kind: 'h5p' },
    { prefix: 'interactive_video', moduleKey: 'InteractiveVideo', kind: 'h5p' },
    { prefix: 'image_hotspots', moduleKey: 'ImageHotspots', kind: 'h5p' },
    // Ajoutés en v6.3.0 : leurs fixtures existaient dans assets/data/examples/ mais
    // n'étaient PAS mappées — le banc les signalait en « non mappées (ignorées) » et
    // les trois activités échappaient donc à T1/T2/T4 (déterminisme, idempotence,
    // snapshot). `find_multiple_hotspots` AVANT `find_the_hotspot` : la résolution
    // retient le préfixe le plus long, mais l'ordre explicite évite toute ambiguïté.
    { prefix: 'dictation', moduleKey: 'Dictation', kind: 'h5p' },
    { prefix: 'find_multiple_hotspots', moduleKey: 'FindMultipleHotspots', kind: 'h5p' },
    { prefix: 'find_the_hotspot', moduleKey: 'FindTheHotspot', kind: 'h5p' },
    // QuizSet familles — préfixes les plus spécifiques d'abord
    { prefix: 'quiz_qcm', moduleKey: 'QuizSetQCM', kind: 'h5p' },
    { prefix: 'quiz_vraifaux', moduleKey: 'QuizSetVF', kind: 'h5p' },
    { prefix: 'quiz_mixte', moduleKey: 'QuizSet', kind: 'h5p' },

    // --- Moodle / Éléa (phase ultérieure) ---
    { prefix: 'glossaire_xml', moduleKey: 'glossaireXml', kind: 'moodle' },
    { prefix: 'millionnaire', moduleKey: 'Millionnaire', kind: 'moodle' },
    { prefix: 'appariement', moduleKey: 'Appariement', kind: 'moodle' },
    { prefix: 'qcm', moduleKey: 'QCM', kind: 'moodle' },
    { prefix: 'devoir', moduleKey: 'Devoir', kind: 'moodle' },
    { prefix: 'page', moduleKey: 'Page', kind: 'moodle' },
    { prefix: 'livre', moduleKey: 'Livre', kind: 'moodle' },
    { prefix: 'test', moduleKey: 'test_elea', kind: 'moodle' }
];
