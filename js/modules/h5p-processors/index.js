import * as Timeline from './Timeline.js';
import * as Flashcards from './Flashcards.js';
import * as FillInTheBlanks from './FillInTheBlanks.js';
import * as Glossary from './Glossary.js';
import * as Crossword from './Crossword.js';
import * as Essay from './Essay.js';
import * as Summary from './Summary.js';
import * as DragTheWords from './DragTheWords.js';
import * as TrueFalse from './TrueFalse.js';
import * as MultipleChoice from './MultipleChoice.js';
import * as FindTheWords from './FindTheWords.js';
import * as SortParagraphs from './SortParagraphs.js';
import * as SingleChoiceSet from './SingleChoiceSet.js';
import * as DialogCards from './DialogCards.js';
import * as ComplexFillTheBlanks from './ComplexFillTheBlanks.js';
import * as Chart from './Chart.js';
import * as MarkTheWords from './MarkTheWords.js';
import * as QuizSet from './QuizSet.js';

// Mappage entre le moduleKey (ex: 'MultipleChoice') et le module complet
const processors = {
    'Timeline': Timeline,
    'Flashcards': Flashcards,
    'FillInTheBlanks': FillInTheBlanks,
    'Glossary': Glossary, // Accordion
    'Crossword': Crossword,
    'Essay': Essay,
    'Summary': Summary,
    'DragTheWords': DragTheWords,
    'TrueFalse': TrueFalse,
    'MultipleChoice': MultipleChoice,
    'FindTheWords': FindTheWords,
    'SortParagraphs': SortParagraphs,
    'SingleChoiceSet': SingleChoiceSet,
    'DialogCards': DialogCards,
    'ComplexFillTheBlanks': ComplexFillTheBlanks,
    'Chart': Chart,
    'MarkTheWords': MarkTheWords,
    'QuizSet': QuizSet,
    'QuizSetQCM': QuizSet,  // Utilise le même processeur que QuizSet
    'QuizSetVF': QuizSet  // Utilise le même processeur que QuizSet
};

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
 * @param {string} moduleKey - Clé du module (ex: 'Timeline').
 * @param {Object} jsonObj - Données brutes.
 * @returns {Object|null} Contenu traité ou null si pas de processeur.
 */
export function processH5PContent(moduleKey, jsonObj) {
    const module = processors[moduleKey];
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
 * @param {Object} question - L'objet question (contenant .library et .params).
 * @returns {Object} La question modifiée.
 */
export function processQuizSetItem(question) {
    const libName = question.library.split(' ')[0];
    const moduleKey = libraryToKey[libName];

    if (moduleKey) {
        const module = processors[moduleKey];
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
 * @param {string} moduleKey 
 * @returns {Object|null} { machineName, version, extraDependencies }
 */
export function getModuleMetadata(moduleKey) {
    const module = processors[moduleKey];
    if (module) {
        return {
            machineName: module.machineName,
            version: module.version,
            extraDependencies: module.extraDependencies || []
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
