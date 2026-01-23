/**
 * Validators - Validation en temps reel des donnees editees
 *
 * Fournit des regles de validation et des fonctions pour
 * valider les champs et les schemas complets.
 */

import { t } from '../translation.js';
import { getNestedValue } from './json-utils.js';

// =======================================================================
// REGLES DE VALIDATION
// =======================================================================

/**
 * Validateurs de base
 * Chaque validateur retourne true si valide, false sinon
 */
export const validators = {
    /**
     * Verifie qu'une valeur n'est pas vide
     */
    required: (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (Array.isArray(value)) return value.length > 0;
        return true;
    },

    /**
     * Verifie la longueur minimale
     */
    minLength: (min) => (value) => {
        if (value === null || value === undefined) return true;
        return String(value).length >= min;
    },

    /**
     * Verifie la longueur maximale
     */
    maxLength: (max) => (value) => {
        if (value === null || value === undefined) return true;
        return String(value).length <= max;
    },

    /**
     * Verifie un pattern regex
     */
    pattern: (regex) => (value) => {
        if (value === null || value === undefined || value === '') return true;
        return regex.test(String(value));
    },

    /**
     * Verifie le nombre minimum d'elements dans un tableau
     */
    minItems: (min) => (arr) => {
        if (!Array.isArray(arr)) return false;
        return arr.length >= min;
    },

    /**
     * Verifie le nombre maximum d'elements dans un tableau
     */
    maxItems: (max) => (arr) => {
        if (!Array.isArray(arr)) return true;
        return arr.length <= max;
    },

    /**
     * Verifie qu'une valeur est un nombre
     */
    isNumber: (value) => {
        if (value === null || value === undefined || value === '') return true;
        return !isNaN(Number(value));
    },

    /**
     * Verifie une valeur minimale
     */
    min: (minVal) => (value) => {
        if (value === null || value === undefined || value === '') return true;
        return Number(value) >= minVal;
    },

    /**
     * Verifie une valeur maximale
     */
    max: (maxVal) => (value) => {
        if (value === null || value === undefined || value === '') return true;
        return Number(value) <= maxVal;
    },

    /**
     * Verifie les tranches de feedback (couverture 0-100, pas de chevauchement)
     */
    feedbackRanges: (ranges) => {
        if (!Array.isArray(ranges) || ranges.length === 0) return false;

        // Trier par 'from'
        const sorted = [...ranges].sort((a, b) => a.from - b.from);

        // Verifier que ca commence a 0
        if (sorted[0].from !== 0) return false;

        // Verifier que ca finit a 100
        if (sorted[sorted.length - 1].to !== 100) return false;

        // Verifier la continuite et l'absence de chevauchement
        for (let i = 0; i < sorted.length - 1; i++) {
            // La fin de cette tranche doit etre le debut de la suivante - 1
            if (sorted[i].to >= sorted[i + 1].from) return false;
            if (sorted[i].to + 1 !== sorted[i + 1].from && sorted[i].to !== sorted[i + 1].from - 1) {
                // Accepter une tolerance de 1
                if (Math.abs(sorted[i].to - sorted[i + 1].from) > 1) return false;
            }
        }

        return true;
    },

    /**
     * Verifie qu'au moins une reponse est correcte (pour QCM)
     */
    hasCorrectAnswer: (answers) => {
        if (!Array.isArray(answers)) return false;
        return answers.some(a => a.correct === true || a.iscorrect === 1);
    },

    /**
     * Verifie le format de date Timeline (YYYY,M,D)
     */
    timelineDate: (value) => {
        if (value === null || value === undefined || value === '') return true;
        return /^\d{4}(,\d{1,2}(,\d{1,2})?)?$/.test(value);
    },

    /**
     * Verifie que le texte contient des trous (pour FillInTheBlanks, DragTheWords)
     */
    hasBlanks: (value) => {
        if (typeof value !== 'string') return false;
        return /\*[^*]+\*/.test(value);
    }
};

// =======================================================================
// MESSAGES D'ERREUR
// =======================================================================

/**
 * Messages d'erreur par type de validation
 */
const errorMessages = {
    required: 'editor_error_required',
    minLength: 'editor_error_min_length',
    maxLength: 'editor_error_max_length',
    pattern: 'editor_error_pattern',
    minItems: 'editor_error_min_items',
    maxItems: 'editor_error_max_items',
    isNumber: 'editor_error_number',
    min: 'editor_error_min',
    max: 'editor_error_max',
    feedbackRanges: 'editor_error_feedback_ranges',
    hasCorrectAnswer: 'editor_error_no_correct',
    timelineDate: 'editor_error_date_format',
    hasBlanks: 'editor_error_no_blanks'
};

// =======================================================================
// FONCTIONS DE VALIDATION
// =======================================================================

/**
 * Valide un champ unique contre un ensemble de regles
 * @param {*} value - La valeur a valider
 * @param {Object} config - La configuration du champ (avec les regles)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateField(value, config) {
    const errors = [];

    // Required
    if (config.required && !validators.required(value)) {
        errors.push(t(errorMessages.required) || 'Ce champ est obligatoire');
    }

    // Si vide et pas required, pas d'autres validations
    if (!validators.required(value) && !config.required) {
        return { valid: true, errors: [] };
    }

    // MinLength
    if (config.minLength && !validators.minLength(config.minLength)(value)) {
        errors.push((t(errorMessages.minLength) || 'Minimum {0} caracteres').replace('{0}', config.minLength));
    }

    // MaxLength
    if (config.maxLength && !validators.maxLength(config.maxLength)(value)) {
        errors.push((t(errorMessages.maxLength) || 'Maximum {0} caracteres').replace('{0}', config.maxLength));
    }

    // Pattern
    if (config.pattern && !validators.pattern(config.pattern)(value)) {
        errors.push(t(errorMessages.pattern) || 'Format invalide');
    }

    // Number validations
    if (config.type === 'number') {
        if (!validators.isNumber(value)) {
            errors.push(t(errorMessages.isNumber) || 'Doit etre un nombre');
        }
        if (config.min !== undefined && !validators.min(config.min)(value)) {
            errors.push((t(errorMessages.min) || 'Minimum {0}').replace('{0}', config.min));
        }
        if (config.max !== undefined && !validators.max(config.max)(value)) {
            errors.push((t(errorMessages.max) || 'Maximum {0}').replace('{0}', config.max));
        }
    }

    // Array validations
    if (config.type === 'array' && Array.isArray(value)) {
        if (config.minItems && !validators.minItems(config.minItems)(value)) {
            errors.push((t(errorMessages.minItems) || 'Minimum {0} elements').replace('{0}', config.minItems));
        }
        if (config.maxItems && !validators.maxItems(config.maxItems)(value)) {
            errors.push((t(errorMessages.maxItems) || 'Maximum {0} elements').replace('{0}', config.maxItems));
        }
    }

    // FeedbackRanges validation
    if (config.type === 'feedbackRanges' && !validators.feedbackRanges(value)) {
        errors.push(t(errorMessages.feedbackRanges) || 'Les tranches doivent couvrir 0-100% sans chevauchement');
    }

    // Custom validations
    if (config.validate && typeof config.validate === 'function') {
        const customResult = config.validate(value);
        if (customResult !== true) {
            errors.push(customResult || 'Valeur invalide');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Valide un objet complet contre un schema
 * @param {Object} data - Les donnees a valider
 * @param {Object} schema - Le schema de validation
 * @returns {boolean} true si valide
 */
export function validateSchema(data, schema) {
    const errors = getValidationErrors(data, schema);
    return errors.length === 0;
}

/**
 * Retourne toutes les erreurs de validation pour un schema
 * @param {Object} data - Les donnees a valider
 * @param {Object} schema - Le schema de validation
 * @returns {Array} Liste des erreurs { path, field, message }
 */
export function getValidationErrors(data, schema) {
    const errors = [];

    if (!schema || !schema.sections) return errors;

    for (const section of schema.sections) {
        if (!section.fields) continue;

        for (const [fieldKey, fieldConfig] of Object.entries(section.fields)) {
            const value = getNestedValue(data, fieldKey);
            const fieldErrors = validateFieldRecursive(value, fieldConfig, fieldKey, data);
            errors.push(...fieldErrors);
        }
    }

    // Validations specifiques par type
    errors.push(...getTypeSpecificErrors(data, schema));

    return errors;
}

/**
 * Valide un champ recursivement (pour les tableaux et objets imbriques)
 */
function validateFieldRecursive(value, config, path, rootData) {
    const errors = [];

    // Validation du champ lui-meme
    const fieldValidation = validateField(value, config);
    if (!fieldValidation.valid) {
        for (const err of fieldValidation.errors) {
            errors.push({
                path,
                field: config.label || path,
                message: err
            });
        }
    }

    // Si c'est un tableau, valider chaque element
    if (config.type === 'array' && Array.isArray(value) && config.itemSchema) {
        value.forEach((item, index) => {
            // Si l'item est une valeur simple (isArrayValue)
            if (config.itemSchema._value && config.itemSchema._value.isArrayValue) {
                const itemErrors = validateFieldRecursive(
                    item,
                    config.itemSchema._value,
                    `${path}.${index}`,
                    rootData
                );
                errors.push(...itemErrors);
            } else {
                // L'item est un objet
                for (const [subKey, subConfig] of Object.entries(config.itemSchema)) {
                    if (subKey === '_value') continue;
                    const subValue = item[subKey];
                    const itemErrors = validateFieldRecursive(
                        subValue,
                        subConfig,
                        `${path}.${index}.${subKey}`,
                        rootData
                    );
                    errors.push(...itemErrors);
                }
            }
        });
    }

    // Si c'est un objet imbrique
    if (config.type === 'object' && config.schema && value && typeof value === 'object') {
        for (const [subKey, subConfig] of Object.entries(config.schema)) {
            const subValue = value[subKey];
            const subErrors = validateFieldRecursive(
                subValue,
                subConfig,
                `${path}.${subKey}`,
                rootData
            );
            errors.push(...subErrors);
        }
    }

    return errors;
}

/**
 * Validations specifiques par type de module
 */
function getTypeSpecificErrors(data, schema) {
    const errors = [];

    // QCM: au moins une reponse correcte par question
    if (data.answers && Array.isArray(data.answers)) {
        if (!validators.hasCorrectAnswer(data.answers)) {
            errors.push({
                path: 'answers',
                field: t('editor_section_answers') || 'Reponses',
                message: t(errorMessages.hasCorrectAnswer) || 'Au moins une reponse doit etre correcte'
            });
        }
    }

    // QCM Moodle: verifier chaque question
    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((q, i) => {
            if (q.answers && Array.isArray(q.answers)) {
                if (!validators.hasCorrectAnswer(q.answers)) {
                    errors.push({
                        path: `questions.${i}.answers`,
                        field: `Question ${i + 1}`,
                        message: t(errorMessages.hasCorrectAnswer) || 'Au moins une reponse doit etre correcte'
                    });
                }
            }
        });
    }

    // FillInTheBlanks/DragTheWords: verifier la presence de trous
    if (data.textField !== undefined && typeof data.textField === 'string') {
        if (!validators.hasBlanks(data.textField)) {
            errors.push({
                path: 'textField',
                field: t('editor_text_with_blanks') || 'Texte',
                message: t(errorMessages.hasBlanks) || 'Le texte doit contenir au moins un mot entre *asterisques*'
            });
        }
    }

    // FillInTheBlanks: verifier les questions
    if (data.questions && Array.isArray(data.questions) && typeof data.questions[0] === 'string') {
        const hasAnyBlanks = data.questions.some(q => validators.hasBlanks(q));
        if (!hasAnyBlanks) {
            errors.push({
                path: 'questions',
                field: t('editor_section_sentences') || 'Phrases',
                message: t(errorMessages.hasBlanks) || 'Au moins une phrase doit contenir un mot entre *asterisques*'
            });
        }
    }

    return errors;
}

// =======================================================================
// UTILITAIRES
// =======================================================================

/**
 * Cree un validateur personnalise
 * @param {Function} fn - Fonction de validation (value) => true | errorMessage
 * @returns {Function}
 */
export function createValidator(fn) {
    return fn;
}

/**
 * Combine plusieurs validateurs
 * @param {...Function} validators - Validateurs a combiner
 * @returns {Function}
 */
export function combineValidators(...validatorFns) {
    return (value) => {
        for (const fn of validatorFns) {
            const result = fn(value);
            if (result !== true) return result;
        }
        return true;
    };
}
