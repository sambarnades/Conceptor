/**
 * Caramelia — Configuration centrale
 * @module caramelia/config
 */

import { ENDPOINTS } from '../core/endpoints.js';

// Webhooks Caramelia (chat RAG, transcription audio Whisper/Albert, vidéo
// PodEduc 2 modes) + import de page web. URLs centralisées dans
// core/endpoints.js et réécrites en prod par la CI (variables
// CARAMELIA_WEBHOOK_URL, CARAMELIA_AUDIO_URL, CARAMEL_VIDEO_TRANSCRIPT_URL,
// CARAMEL_FETCH_PAGE_URL — cf. .gitlab-ci.yml).
const CARAMELIA_WEBHOOK_URL = ENDPOINTS.caramelia;
const CARAMELIA_AUDIO_URL = ENDPOINTS.carameliaAudio;
const CARAMEL_VIDEO_TRANSCRIPT_URL = ENDPOINTS.videoTranscript;
const CARAMEL_FETCH_PAGE_URL = ENDPOINTS.fetchPage;

export const CONFIG = {
    name: 'Caramelia',
    version: '1.1.0',
    logo: 'assets/images/branding/logo_caramel_2.ico',
    chatWebhookUrl: CARAMELIA_WEBHOOK_URL,
    audioWebhookUrl: CARAMELIA_AUDIO_URL,
    videoTranscriptUrl: CARAMEL_VIDEO_TRANSCRIPT_URL,
    fetchPageUrl: CARAMEL_FETCH_PAGE_URL,

    // Saisie vocale (microphone)
    voice: {
        softLimitMs: 60000,    // 1 min : on incite à s'arrêter (jauge passe en orangé/rouge)
        hardLimitMs: 300000,   // 5 min : coupure forcée pour éviter de saturer le webhook
        minDurationMs: 400,    // sous ce seuil on considère un clic accidentel
    },

    // Catégories d'activités (les labels passent par i18n via t(`category_${id}`))
    activityCategories: {
        quiz: {
            iconKey: 'quiz',
            keys: ['QuizSetQCM','QuizSetVF','QuizSet','MultipleChoice','SingleChoiceSet','TrueFalse','test_elea','QCM','Appariement','Millionnaire','Devoir','CoursePresentation','InteractiveVideo'],
        },
        text: {
            iconKey: 'text',
            keys: ['DragTheWords','DragAndDrop','FillInTheBlanks','MarkTheWords','Essay','SortParagraphs','Page','Livre','InteractiveBook'],
        },
        memory: {
            iconKey: 'memory',
            keys: ['Flashcards','DialogCards','Timeline','Glossary','Crossword','FindTheWords','Chart','Summary','glossaireXml'],
        },
    },

    // Tous les moduleKeys connus (pour validation enum côté extractor)
    allModuleKeys: [
        'QuizSetQCM','QuizSetVF','QuizSet','MultipleChoice','TrueFalse','Flashcards',
        'Crossword','Timeline','FillInTheBlanks','DragTheWords','DragAndDrop','Essay',
        'Glossary','CoursePresentation','InteractiveBook','InteractiveVideo','SortParagraphs','FindTheWords','Summary',
        'SingleChoiceSet','Chart','DialogCards','MarkTheWords',
        'test_elea','glossaireXml','Millionnaire','Appariement','QCM','Page','Livre','Devoir',
    ],

    h5pKeys: [
        'QuizSetQCM','QuizSetVF','QuizSet','MultipleChoice','TrueFalse','Flashcards',
        'Crossword','Timeline','FillInTheBlanks','DragTheWords','DragAndDrop','Essay',
        'Glossary','CoursePresentation','InteractiveBook','InteractiveVideo','SortParagraphs','FindTheWords','Summary',
        'SingleChoiceSet','Chart','DialogCards','MarkTheWords',
    ],

    // Activités qui EXIGENT une URL vidéo avant de pouvoir générer (flag requiresVideoUrl
    // côté definitions.js). Caramelia demande l'URL, remplit le champ, attend la transcription.
    requiresVideoUrlKeys: ['InteractiveVideo'],
    eleaKeys: [
        'test_elea','glossaireXml','Millionnaire','Appariement','QCM','Page','Livre','Devoir',
    ],

    /**
     * Mapping moduleKey Caramelia → clé i18n officielle Caramel + plateforme.
     * Permet de récupérer les noms d'activités depuis le système de traduction
     * principal (single source of truth) et d'ajouter un suffixe (H5P)/(Éléa).
     */
    activityCaramelMap: {
        QuizSetQCM:        { caramelKey: 'h5p_quiz_set_qcm_name',     platform: 'h5p' },
        QuizSetVF:         { caramelKey: 'h5p_quiz_set_vf_name',      platform: 'h5p' },
        QuizSet:           { caramelKey: 'h5p_quiz_set_name',         platform: 'h5p' },
        CoursePresentation:{ caramelKey: 'h5p_course_presentation_name', platform: 'h5p' },
        InteractiveBook:   { caramelKey: 'h5p_interactive_book_name',  platform: 'h5p' },
        InteractiveVideo:  { caramelKey: 'h5p_interactive_video_name', platform: 'h5p' },
        Flashcards:        { caramelKey: 'h5p_flashcards_name',       platform: 'h5p' },
        Crossword:         { caramelKey: 'h5p_crossword_name',        platform: 'h5p' },
        Timeline:          { caramelKey: 'h5p_timeline_name',         platform: 'h5p' },
        DragTheWords:      { caramelKey: 'h5p_drag_the_words_name',   platform: 'h5p' },
        DragAndDrop:       { caramelKey: 'h5p_drag_and_drop_name',    platform: 'h5p' },
        FillInTheBlanks:   { caramelKey: 'h5p_fill_in_the_blanks_name', platform: 'h5p' },
        MarkTheWords:      { caramelKey: 'h5p_mark_the_words_name',   platform: 'h5p' },
        Essay:             { caramelKey: 'h5p_essay_name',            platform: 'h5p' },
        Glossary:          { caramelKey: 'h5p_glossary_name',         platform: 'h5p' },
        SortParagraphs:    { caramelKey: 'h5p_sort_the_paragraphs_name', platform: 'h5p' },
        FindTheWords:      { caramelKey: 'h5p_find_the_words_name',   platform: 'h5p' },
        Summary:           { caramelKey: 'h5p_summary_name',          platform: 'h5p' },
        SingleChoiceSet:   { caramelKey: 'h5p_single_choice_set_name', platform: 'h5p' },
        Chart:             { caramelKey: 'h5p_chart_name',            platform: 'h5p' },
        DialogCards:       { caramelKey: 'h5p_dialog_cards_name',     platform: 'h5p' },
        MultipleChoice:    { caramelKey: 'h5p_multiple_choice_name',  platform: 'h5p' },
        TrueFalse:         { caramelKey: 'h5p_true_false_name',       platform: 'h5p' },
        test_elea:         { caramelKey: 'elea_test_xml_name',        platform: 'elea' },
        glossaireXml:      { caramelKey: 'elea_glossaire_xml_name',   platform: 'elea' },
        Millionnaire:      { caramelKey: 'elea_millionnaire_name',    platform: 'elea' },
        Appariement:       { caramelKey: 'elea_appariement_name',     platform: 'elea' },
        QCM:               { caramelKey: 'elea_qcm_name',             platform: 'elea' },
        Page:              { caramelKey: 'elea_page_name',            platform: 'elea' },
        Livre:             { caramelKey: 'elea_livre_name',           platform: 'elea' },
        Devoir:            { caramelKey: 'elea_devoir_name',          platform: 'elea' },
    },

    platformSuffix: {
        h5p:  ' (H5P)',
        elea: ' (Éléa)',
    },

    // Fuzzy keyword → moduleKey (fallback si extracteur LLM indisponible).
    // Trié par longueur de clé décroissante au moment de l'utilisation pour éviter "qcm" avant "vrai faux".
    fuzzyMap: {
        'vrai faux':'QuizSetVF','mots croisés':'Crossword','texte à trous':'FillInTheBlanks',
        'mots mêlés':'FindTheWords','qui veut':'Millionnaire',
        'qcm':'QuizSetQCM','quiz':'QuizSet','vf':'QuizSetVF',
        'flashcard':'Flashcards','flash':'Flashcards','carte':'Flashcards',
        'croisés':'Crossword','crossword':'Crossword',
        'frise':'Timeline','chronolog':'Timeline','timeline':'Timeline',
        'trous':'FillInTheBlanks','blanks':'FillInTheBlanks',
        'glisser':'DragTheWords','drag':'DragTheWords','rédaction':'Essay','essai':'Essay',
        'glossaire':'Glossary','accordéon':'Glossary',
        'diaporama':'CoursePresentation','slides':'CoursePresentation','présentation':'CoursePresentation',
        'livre interactif':'InteractiveBook','interactive book':'InteractiveBook','livre h5p':'InteractiveBook',
        'book':'InteractiveBook','chapitres':'InteractiveBook','manuel':'InteractiveBook',
        'vidéo interactive':'InteractiveVideo','interactive video':'InteractiveVideo','vidéo h5p':'InteractiveVideo',
        'video interactive':'InteractiveVideo','capsule':'InteractiveVideo','vidéo':'InteractiveVideo','peertube':'InteractiveVideo',
        'youtube':'InteractiveVideo','youtu.be':'InteractiveVideo',
        'ordonner':'SortParagraphs','paragraphe':'SortParagraphs',
        'mêlés':'FindTheWords',
        'résumé':'Summary','summary':'Summary',
        'test':'test_elea','millionnaire':'Millionnaire',
        'appariement':'Appariement','paires':'Appariement',
        'page':'Page','livre':'Livre','devoir':'Devoir',
        'graphique':'Chart','chart':'Chart','dialogue':'DialogCards',
    },

    // Délais d'attente pour le pipeline de génération
    timing: {
        sidebarMaxWait: 5000,         // attente max apparition bouton LLM
        sidebarPoll: 100,             // pas de polling
        promptReadyMaxWait: 2500,     // attente max régénération du prompt par Caramel (debounce 500ms + génération)
        generationMaxWait: 120000,    // fallback si la génération hang (LLM lent ou erreur silencieuse)
        afterCloseDelay: 500,         // animation de fermeture entre 2 générations
    },

    extractor: {
        minConfidence: 0.5,
    },

    // Limite l'historique envoyé au LLM (chat libre + extracteur).
    // L'UI affiche toujours tout — seul le payload réseau est tronqué.
    // À 8 tours (~4 paires), on couvre largement le contexte utile sans gonfler les tokens.
    history: {
        maxTurnsForLLM: 8,
        maxCharsPerTurn: 2000,
    },

    // Sélecteurs DOM Caramel : seul point de couplage avec l'app principale.
    // Si Caramel renomme un ID, c'est ici (et nulle part ailleurs) qu'il faut le refléter.
    caramelSelectors: {
        qui: '#qui',
        quoi: '#quoi',
        niveau: '#niveau',
        nombreQuestions: '#nombreQuestions',
        sidebar: '#module-sidebar',
        sidebarOpenClass: 'open',
        sidebarCloseBtn: '#module-sidebar .close-btn',
        hiddenPrompts: 'textarea[id^="hidden-"]',
        modeTabActive: '.mode-tab.active',
        // Patterns paramétrés par moduleKey
        llmBtn: (k) => `#generate-llm-${k}`,
        videoUrlInput: (k) => `#video-url-input-${k}`,
        videoSection: (k) => `#video-url-section-${k}`,
        tileSelectors: (k) => [
            `[data-module="${k}"]`,
            `[data-module-key="${k}"]`,
            `#tile-${k}`,
            `.activity-tile[data-key="${k}"]`,
        ],
        tileFallback: '.activity-tile, .grid-item, [role="listitem"]',
    },
};
