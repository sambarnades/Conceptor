/**
 * Routeur central des processeurs H5P
 *
 * Double mapping : moduleKey → module processeur (processors) et
 * machineName H5P → moduleKey (libraryToKey, pour résolution récursive QuizSet).
 * Fournit l'API principale processH5PContent() et des helpers pour
 * le traitement des sous-questions.
 *
 * Les métadonnées (machineName, version, extraDependencies) sont inlinées
 * pour éviter de charger les 20 processeurs au premier import.
 * Les modules processeurs sont chargés à la demande via import() dynamique.
 *
 * @module processors/index
 * @exports {Function} processH5PContent - Traite un JSON selon le moduleKey (async)
 * @exports {Function} getModuleMetadata - Récupère machineName, version, extraDependencies
 * @exports {Function} getModuleKeyFromLibrary - Lookup inverse par nom de bibliothèque H5P
 */

// ======================================================================
// Métadonnées statiques (pas besoin de charger les processeurs)
// ======================================================================

const processorMetadata = {
    'Timeline': {
        machineName: 'H5P.Timeline',
        version: { major: 1, minor: 1 },
        extraDependencies: [
            { machineName: 'TimelineJS', majorVersion: 1, minorVersion: 1 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'Flashcards': {
        machineName: 'H5P.Flashcards',
        version: { major: 1, minor: 6 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'FillInTheBlanks': {
        machineName: 'H5P.Blanks',
        version: { major: 1, minor: 14 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 }
        ]
    },
    'Glossary': {
        machineName: 'H5P.Accordion',
        version: { major: 1, minor: 0 },
        extraDependencies: [
            { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'Crossword': {
        machineName: 'H5P.Crossword',
        version: { major: 0, minor: 5 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Image', majorVersion: 1, minorVersion: 1 },
            { machineName: 'H5P.MaterialDesignIcons', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'Essay': {
        machineName: 'H5P.Essay',
        version: { major: 1, minor: 5 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 }
        ]
    },
    'Summary': {
        machineName: 'H5P.Summary',
        version: { major: 1, minor: 10 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'DragTheWords': {
        machineName: 'H5P.DragText',
        version: { major: 1, minor: 10 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'DragAndDrop': {
        machineName: 'H5P.DragQuestion',
        version: { major: 1, minor: 14 },
        extraDependencies: [
            { machineName: 'H5P.DragNDrop', majorVersion: 1, minorVersion: 1 },
            { machineName: 'H5P.DragNBar', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.DragNResize', majorVersion: 1, minorVersion: 2 },
            { machineName: 'jQuery.ui', majorVersion: 1, minorVersion: 10 },
            { machineName: 'H5P.AdvancedText', majorVersion: 1, minorVersion: 1 },
            { machineName: 'Drop', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'TrueFalse': {
        machineName: 'H5P.TrueFalse',
        version: { major: 1, minor: 8 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'MultipleChoice': {
        machineName: 'H5P.MultiChoice',
        version: { major: 1, minor: 16 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'FindTheWords': {
        machineName: 'H5P.FindTheWords',
        version: { major: 1, minor: 4 },
        extraDependencies: [
            { machineName: 'H5P.Timer', majorVersion: 0, minorVersion: 4 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'SortParagraphs': {
        machineName: 'H5P.SortParagraphs',
        version: { major: 0, minor: 11 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'SingleChoiceSet': {
        machineName: 'H5P.SingleChoiceSet',
        version: { major: 1, minor: 11 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'DialogCards': {
        machineName: 'H5P.Dialogcards',
        version: { major: 1, minor: 9 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Audio', majorVersion: 1, minorVersion: 5 },
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'ComplexFillTheBlanks': {
        machineName: 'H5P.AdvancedBlanks',
        version: { major: 1, minor: 2 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
        ]
    },
    'Chart': {
        machineName: 'H5P.Chart',
        version: { major: 1, minor: 2 },
        extraDependencies: []
    },
    'MarkTheWords': {
        machineName: 'H5P.MarkTheWords',
        version: { major: 1, minor: 11 },
        extraDependencies: [
            { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 }
        ]
    },
    'QuizSet': {
        machineName: 'H5P.QuestionSet',
        version: { major: 1, minor: 20 },
        extraDependencies: [
            { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
            { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
            { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
            { machineName: 'jQuery.ui', majorVersion: 1, minorVersion: 10 },
            { machineName: 'H5P.TextUtilities', majorVersion: 1, minorVersion: 3 },
            { machineName: 'H5P.Video', majorVersion: 1, minorVersion: 6 }
        ]
    }
};

// QuizSetQCM et QuizSetVF utilisent les mêmes métadonnées que QuizSet
processorMetadata['QuizSetQCM'] = processorMetadata['QuizSet'];
processorMetadata['QuizSetVF'] = processorMetadata['QuizSet'];

// ======================================================================
// Chargement paresseux des processeurs (import() dynamique)
// ======================================================================

const processorLoaders = {
    'Timeline': () => import('./Timeline.js'),
    'Flashcards': () => import('./Flashcards.js'),
    'FillInTheBlanks': () => import('./FillInTheBlanks.js'),
    'Glossary': () => import('./Glossary.js'),
    'Crossword': () => import('./Crossword.js'),
    'Essay': () => import('./Essay.js'),
    'Summary': () => import('./Summary.js'),
    'DragTheWords': () => import('./DragTheWords.js'),
    'DragAndDrop': () => import('./DragAndDrop.js'),
    'TrueFalse': () => import('./TrueFalse.js'),
    'MultipleChoice': () => import('./MultipleChoice.js'),
    'FindTheWords': () => import('./FindTheWords.js'),
    'SortParagraphs': () => import('./SortParagraphs.js'),
    'SingleChoiceSet': () => import('./SingleChoiceSet.js'),
    'DialogCards': () => import('./DialogCards.js'),
    'ComplexFillTheBlanks': () => import('./ComplexFillTheBlanks.js'),
    'Chart': () => import('./Chart.js'),
    'MarkTheWords': () => import('./MarkTheWords.js'),
    'QuizSet': () => import('./QuizSet.js')
};

// QuizSetQCM et QuizSetVF utilisent le même processeur que QuizSet
processorLoaders['QuizSetQCM'] = processorLoaders['QuizSet'];
processorLoaders['QuizSetVF'] = processorLoaders['QuizSet'];

// Cache des modules déjà chargés
const loadedProcessors = {};

/**
 * Charge un processeur à la demande (avec mise en cache).
 * @param {string} moduleKey - Clé du module (ex: 'Timeline').
 * @returns {Promise<Object>} Le module processeur complet.
 */
async function loadProcessor(moduleKey) {
    // QuizSetQCM/VF → même module que QuizSet
    const cacheKey = (moduleKey === 'QuizSetQCM' || moduleKey === 'QuizSetVF') ? 'QuizSet' : moduleKey;
    if (!loadedProcessors[cacheKey]) {
        const loader = processorLoaders[cacheKey];
        if (!loader) return null;
        loadedProcessors[cacheKey] = await loader();
    }
    return loadedProcessors[cacheKey];
}

// Mappage entre le Nom de librairie (ex: 'H5P.MultiChoice') et le moduleKey
// Utilisé pour le QuizSet qui itère sur les children
const libraryToKey = {
    'H5P.Timeline': 'Timeline',
    'H5P.Flashcards': 'Flashcards',
    'H5P.Blanks': 'FillInTheBlanks',
    'H5P.AdvancedText': 'Glossary',
    'H5P.Accordion': 'Glossary',
    'H5P.Crossword': 'Crossword',
    'H5P.Essay': 'Essay',
    'H5P.Summary': 'Summary',
    'H5P.DragText': 'DragTheWords',
    'H5P.DragQuestion': 'DragAndDrop',
    'H5P.TrueFalse': 'TrueFalse',
    'H5P.MultiChoice': 'MultipleChoice',
    'H5P.FindTheWords': 'FindTheWords',
    'H5P.SortParagraphs': 'SortParagraphs',
    'H5P.SingleChoiceSet': 'SingleChoiceSet',
    'H5P.Dialogcards': 'DialogCards',
    'H5P.AdvancedBlanks': 'ComplexFillTheBlanks',
    'H5P.Chart': 'Chart',
    'H5P.MarkTheWords': 'MarkTheWords',
    'H5P.QuestionSet': 'QuizSet'
};

/**
 * Traite le JSON brut pour le transformer en JSON H5P valide et enrichi.
 * Charge le processeur à la demande (lazy-load).
 * @param {string} moduleKey - Clé du module (ex: 'Timeline').
 * @param {Object} jsonObj - Données brutes.
 * @returns {Promise<Object|null>} Contenu traité ou null si pas de processeur.
 */
export async function processH5PContent(moduleKey, jsonObj) {
    const module = await loadProcessor(moduleKey);
    if (module && module.default && module.default.process) {
        // Injection des helpers pour le module (notamment pour QuizSet qui a besoin de récursivité)
        const helpers = {
            processChild: processQuizSetItem,
            getLibraryMetadata: getModuleMetadata,
            getKeyFromLibrary: getModuleKeyFromLibrary
        };
        return module.default.process(jsonObj, helpers);
    }
    return null;
}

/**
 * Transforme une question spécifique pour l'inclusion dans un QuizSet.
 * Charge le processeur enfant à la demande.
 * @param {Object} question - L'objet question (contenant .library et .params).
 * @returns {Promise<Object>} La question modifiée.
 */
export async function processQuizSetItem(question) {
    if (!question?.library) {
        console.warn('[h5p-processors/index] processQuizSetItem: question ou library manquant', question);
        return question;
    }
    const libName = question.library.split(' ')[0];
    const moduleKey = libraryToKey[libName];

    if (moduleKey) {
        const module = await loadProcessor(moduleKey);
        // Si le processeur a une méthode spécifique pour QuizSet, on l'utilise
        if (module && module.default) {
            if (module.default.transformForQuizSet) {
                return module.default.transformForQuizSet(question);
            } else if (module.default.process) {
                // Fallback: on applique le traitement standard sur les paramètres
                // Cela permet d'ajouter les traductions, le formatage HTML, etc.
                try {
                    // On clone les params pour éviter les effets de bord indésirables
                    const processedParams = module.default.process({ ...question.params });
                    question.params = processedParams;
                } catch (e) {
                    console.warn(`Erreur lors du traitement standard pour ${moduleKey} dans QuizSet`, e);
                }
            }
        }
    }
    return question;
}

/**
 * Récupère les métadonnées d'un module (machineName, version).
 * Synchrone — utilise les métadonnées inlinées.
 * @param {string} moduleKey
 * @returns {Object|null} { machineName, version, extraDependencies }
 */
export function getModuleMetadata(moduleKey) {
    const meta = processorMetadata[moduleKey];
    if (meta) {
        return {
            machineName: meta.machineName,
            version: meta.version,
            extraDependencies: meta.extraDependencies || []
        };
    }
    return null;
}

/**
 * Trouve la clé du module à partir du nom de la bibliothèque (ex: H5P.MultiChoice -> MultipleChoice)
 * @param {string} libName
 * @returns {string|undefined}
 */
export function getModuleKeyFromLibrary(libName) {
    return libraryToKey[libName];
}
