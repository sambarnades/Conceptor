/**
 * Validators - Validation en temps reel des donnees editees
 *
 * Fournit des regles de validation et des fonctions pour
 * valider les champs et les schemas complets.
 */

import { t } from '../core/translation.js';
import { getNestedValue, matchesShowWhen } from './json-utils.js';

/**
 * Traduit un label de schéma (même idiome que array-manager / field-renderers :
 * `t()` renvoie la clé quand elle manque, on garde alors la clé telle quelle).
 * Les erreurs de schéma exposaient jusqu'ici la clé i18n brute (`editor_ib_block_type`)
 * dans leur champ `field`.
 */
function translateLabel(label) {
    if (!label) return '';
    const translated = t(label);
    return translated !== label ? translated : label;
}

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
        // Une tranche non-objet est inexploitable : invalide, mais sans lever. Sans ce
        // garde, un `null` dans le tableau faisait échouer le comparateur de tri, et
        // l'exception remontait jusqu'à `debounceValidation` (aucun try/catch côté
        // éditeur) — la validation temps réel cessait alors de fonctionner.
        if (ranges.some(r => !r || typeof r !== 'object')) return false;

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
        return answers.some(a => a?.correct === true || a?.iscorrect === 1);
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

    // Si vide et pas required, pas d'autres validations.
    //
    // EXCEPTION — un tableau qui déclare `minItems >= 1` exige DÉJÀ du contenu : cette
    // contrainte EST l'exigence, et la plupart de ces champs ne portent volontairement
    // pas `required` (les 5 déclarations de `answers` en sont l'exemple : `minItems: 2`
    // et rien d'autre). Sans cette exception, la sortie anticipée sautait la mesure pour
    // un tableau ABSENT ou VIDE : la règle ne se déclenchait donc QUE sur les tableaux
    // déjà non vides — `answers` à 1 élément était signalé, `answers` à 0 passait en
    // silence. Le trou était exactement à zéro, et il laissait enregistrer (puis partir
    // dans le .h5p) un QCM sans aucune réponse : une question injouable.
    const exigeDesElements = ['array', 'stringArray'].includes(config.type) && config.minItems >= 1;
    if (!validators.required(value) && !config.required && !exigeDesElements) {
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
    // Pas de garde `Array.isArray(value)` : un tableau ABSENT doit être mesuré comme
    // vide, sinon `minItems` reste muet précisément quand il n'y a rien. `minItems`
    // renvoie false sur un non-tableau (donc signale), `maxItems` renvoie true (donc
    // se tait) — les deux se comportent déjà correctement sur `undefined`.
    if (['array', 'stringArray'].includes(config.type)) {
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
            errors.push(customResult || t('editor_error_invalid_value') || 'Valeur invalide');
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
 *
 * `trail` accumule le chemin LISIBLE menant au champ (« Chapitre 2 › Bloc 4 »). L'éditeur
 * est en maître-détail et replie les items : un « Ce champ est obligatoire » sans repère
 * désignait un champ que l'utilisateur ne pouvait ni voir ni situer — parfois dans un
 * chapitre qui n'était même pas rendu. Le `field` produit ici est ce qui s'affiche dans le
 * résumé d'erreurs, il doit donc suffire à retrouver le champ à la main.
 */
function validateFieldRecursive(value, config, path, rootData, trail = []) {
    const errors = [];

    // Un champ que l'écran NE MONTRE PAS ne peut pas être rempli : il ne doit jamais
    // bloquer l'enregistrement. La règle existait déjà pour les conteneurs
    // `dynamicObject` (cf. plus bas) ; elle vaut pour n'importe quel champ portant un
    // `showWhen`, et il faut l'appliquer AVANT de descendre — sinon on valide le contenu
    // d'un objet masqué (le `table` d'une diapositive « titre », les `answers` d'une
    // interaction qui n'est pas un QCM) au seul motif que le sous-schéma existe.
    // `showWhen` désigne un champ FRÈRE : on l'évalue donc contre l'objet PARENT.
    if (config.showWhen) {
        const parent = getNestedValue(rootData, path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '');
        if (!matchesShowWhen(config.showWhen, parent, null, rootData)) return errors;
    }

    // Un tableau déclare souvent `itemLabel` plutôt que `label` (le titre de section porte
    // déjà son nom) : sans ce repli, une erreur de cardinalité sur un tableau imbriqué
    // affichait le CHEMIN BRUT (« questions.0.params.answers ») en guise de libellé — donc
    // ni traduit, ni situable dans un éditeur maître-détail.
    const label = translateLabel(config.label) || translateLabel(config.itemLabel) || path;
    const fullLabel = trail.length ? `${trail.join(' › ')} › ${label}` : label;

    // Validation du champ lui-meme
    const fieldValidation = validateField(value, config);
    if (!fieldValidation.valid) {
        for (const err of fieldValidation.errors) {
            errors.push({
                path,
                field: fullLabel,
                message: err
            });
        }
    }

    // Si c'est un tableau, valider chaque element
    if (config.type === 'array' && Array.isArray(value) && config.itemSchema) {
        const itemLabel = translateLabel(config.itemLabel) || label;
        value.forEach((item, index) => {
            const itemTrail = [...trail, `${itemLabel} ${index + 1}`];
            // Si l'item est une valeur simple (isArrayValue)
            if (config.itemSchema._value && config.itemSchema._value.isArrayValue) {
                const itemErrors = validateFieldRecursive(
                    item,
                    config.itemSchema._value,
                    `${path}.${index}`,
                    rootData,
                    trail
                );
                // L'item EST la valeur : son libellé est déjà « <itemLabel> N ».
                errors.push(...itemErrors.map(e => ({ ...e, field: itemTrail.join(' › ') })));
            } else {
                // L'item est un objet
                for (const [subKey, subConfig] of Object.entries(config.itemSchema)) {
                    if (subKey === '_value') continue;
                    const subValue = getNestedValue(item, subKey);
                    const itemErrors = validateFieldRecursive(
                        subValue,
                        subConfig,
                        `${path}.${index}.${subKey}`,
                        rootData,
                        itemTrail
                    );
                    errors.push(...itemErrors);
                }
            }
        });
    }

    // Objet dont le sous-schéma dépend d'un champ FRÈRE (`selector`) : sous-question de
    // Quiz, exercice de diapositive ou de bloc de Livre interactif, contenu d'une question
    // Éléa. Sans cette descente, un champ obligatoire imbriqué n'était JAMAIS vérifié : le
    // Glisser-déposer autonome refusait une étiquette sans zone cible, la même étiquette
    // passait en silence dans une diapositive — et l'activité partait avec des étiquettes
    // qui n'appartiennent à aucune zone.
    if (config.type === 'dynamicObject' && config.schemas && value && typeof value === 'object') {
        const parent = getNestedValue(rootData, path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '');
        const cleSousSchema = parent ? parent[config.selector || 'type'] : undefined;
        const sousSchema = config.schemas[cleSousSchema];
        // Un conteneur MASQUÉ (`showWhen`) ne peut pas être rempli : il ne doit pas bloquer
        // l'enregistrement — c'est exactement le défaut de 6.3.0, un champ obligatoire que
        // l'écran ne montre pas.
        const affiche = !config.showWhen || matchesShowWhen(config.showWhen, parent, null, rootData);
        if (sousSchema && affiche) {
            const dynTrail = label ? [...trail, label] : trail;
            for (const [subKey, subConfig] of Object.entries(sousSchema)) {
                errors.push(...validateFieldRecursive(
                    getNestedValue(value, subKey),
                    subConfig,
                    `${path}.${subKey}`,
                    rootData,
                    dynTrail
                ));
            }
        }
    }

    // Groupe de champs (présentation seulement : les champs vivent au même niveau que le
    // groupe dans les données). Le groupe n'a pas de valeur propre.
    if (config.type === 'fieldGroup' && config.fields) {
        const parent = getNestedValue(rootData, path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '');
        if (parent && typeof parent === 'object') {
            for (const [subKey, subConfig] of Object.entries(config.fields)) {
                errors.push(...validateFieldRecursive(
                    getNestedValue(parent, subKey),
                    subConfig,
                    path.includes('.') ? `${path.slice(0, path.lastIndexOf('.'))}.${subKey}` : subKey,
                    rootData,
                    trail
                ));
            }
        }
    }

    // Si c'est un objet imbrique
    if (config.type === 'object' && config.schema && value && typeof value === 'object') {
        const objTrail = label ? [...trail, label] : trail;
        for (const [subKey, subConfig] of Object.entries(config.schema)) {
            const subValue = getNestedValue(value, subKey);
            const subErrors = validateFieldRecursive(
                subValue,
                subConfig,
                `${path}.${subKey}`,
                rootData,
                objTrail
            );
            errors.push(...subErrors);
        }
    }

    return errors;
}

// =======================================================================
// VALIDATIONS SPÉCIFIQUES PAR TYPE DE MODULE
// =======================================================================
// Une fonction par activité, enregistrée dans `TYPE_RULES` (plus bas) et appelée
// par `getTypeSpecificErrors`. Ces validations s'exécutent APRÈS le healing
// structurel : elles ne portent QUE sur le contenu pédagogique irréparable.
//
// Contrat : `(data, errors) => void` — chaque règle POUSSE dans `errors`, dans
// l'ordre où l'éditeur doit les afficher, et ne retourne rien.
//
// Couverture : `node tests/run_validators_oracle.mjs` (157 fixtures × 40 clés).

/** QuizSet / QuizSetQCM / QuizSetVF. */
function validateQuizSet(data, errors) {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        errors.push({
            path: 'questions',
            field: 'Quiz',
            message: t('validation_quiz_no_questions') || 'Le quiz doit contenir au moins une question'
        });
    } else {
        data.questions.forEach((q, i) => {
            if (!q?.library) {
                errors.push({
                    path: `questions.${i}.library`,
                    field: `Question ${i + 1}`,
                    message: t('validation_question_no_type') || `La question ${i + 1} n'a pas de type defini`
                });
            }
        });
    }
}

/** MultipleChoice. */
function validateMultipleChoice(data, errors) {
    if (!Array.isArray(data.answers) || data.answers.length === 0) {
        errors.push({
            path: 'answers',
            field: t('editor_section_answers') || 'Reponses',
            message: t('validation_no_answers') || 'Au moins une reponse est requise'
        });
    }
}

/** TrueFalse. */
function validateTrueFalse(data, errors) {
    if (!data.question || (typeof data.question === 'string' && data.question.trim() === '')) {
        errors.push({
            path: 'question',
            field: 'Question',
            message: t('validation_question_empty') || 'La question est vide'
        });
    }
}

/**
 * ImageHotspots.
 * Un bloc de contenu vide serait SILENCIEUSEMENT supprimé à la dénormalisation puis
 * le point sauté par le player (visible dans l'éditeur, absent de l'activité — audit N4).
 * On bloque la sauvegarde avec un message ciblé plutôt que de laisser perdre le point.
 */
function validateImageHotspots(data, errors) {
    const rawTmpl = t('validation_ih_block_empty');
    const tmpl = (rawTmpl && rawTmpl !== 'validation_ih_block_empty')
        ? rawTmpl
        : 'Le point {n} a un bloc « {type} » sans contenu : complétez-le ou supprimez le bloc.';
    (Array.isArray(data.hotspots) ? data.hotspots : []).forEach((h, i) => {
        const blocks = (h && Array.isArray(h.content)) ? h.content : [];
        blocks.forEach((b, j) => {
            if (!b || typeof b !== 'object') return;
            const type = b._contentType || 'text';
            const isEmpty =
                (type === 'text' && (!b.text || !String(b.text).trim())) ||
                (type === 'image' && !(b.image && b.image.path)) ||
                (type === 'audio' && !((b.audioFile && b.audioFile.path) || (b.audioUrl && String(b.audioUrl).trim()))) ||
                (type === 'video' && !((b.videoFile && b.videoFile.path) || (b.videoUrl && String(b.videoUrl).trim())));
            if (isEmpty) {
                errors.push({
                    path: `hotspots.${i}.content.${j}`,
                    field: (h && h.header) ? h.header : `Point ${i + 1}`,
                    message: tmpl.replace('{n}', String(i + 1)).replace('{type}', type)
                });
            }
        });
    });
}

/**
 * FindTheHotspot / FindMultipleHotspots.
 * Sans zone correcte, l'activité est infaisable (score maximum nul) : on bloque la
 * sauvegarde plutôt que de laisser produire un exercice sans réponse possible.
 */
function validateFindTheHotspot(data, errors) {
    const zones = Array.isArray(data.hotspots) ? data.hotspots : [];
    if (zones.length && !zones.some(h => h && h.correct === true)) {
        const raw = t('validation_hq_no_correct');
        errors.push({
            path: 'hotspots.0.correct',
            field: (zones[0] && zones[0].label) ? zones[0].label : 'Zones',
            message: (raw && raw !== 'validation_hq_no_correct')
                ? raw
                : 'Aucune zone correcte : cochez « Zone correcte » sur au moins une zone.'
        });
    }
}

/** FindTheWords. */
function validateFindTheWords(data, errors) {
    const wl = data.wordList;
    const listeVide = !wl || (typeof wl === 'string' && wl.trim() === '');
    if (listeVide) {
        errors.push({
            path: 'wordList',
            field: t('editor_word_list') || 'Liste de mots',
            message: t('validation_wordlist_empty') || 'La liste de mots est vide'
        });
    }
    const words = Array.isArray(wl) ? wl : String(wl || '').split(',');
    // Une liste vide est déjà signalée : ne pas ajouter « lettres seulement » au même champ.
    if (!listeVide && (!words.some(word => String(word).trim()) || words.some(word => !/^[\p{L}\p{M}]+$/u.test(String(word).trim().normalize('NFC'))))) {
        errors.push({path:'wordList', field:t('editor_word_list'), message:t('validation_find_letters')});
    }
    const behaviour = data.behaviour || {};
    if (behaviour.fillPool !== undefined && !String(behaviour.fillPool).trim()) {
        errors.push({ path: 'behaviour.fillPool', field: t('editor_find_fill_pool'), message: t('validation_find_fill_pool') });
    }
    const orientations = ['horizontal', 'horizontalBack', 'vertical', 'verticalUp', 'diagonal', 'diagonalBack', 'diagonalUp', 'diagonalUpBack'];
    if (orientations.every(key => behaviour.orientations?.[key] === false)) {
        errors.push({ path: 'behaviour.orientations.horizontal', field: t('editor_section_orientations'), message: t('validation_find_orientation') });
    }
}

/** FillInTheBlanks / ComplexFillTheBlanks. */
function validateFillInTheBlanks(data, errors) {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        errors.push({
            path: 'questions',
            field: t('editor_section_sentences') || 'Phrases',
            message: t('validation_no_sentences') || 'Au moins une phrase est requise'
        });
    }
}

/** MarkTheWords. */
function validateMarkTheWords(data, errors) {
    if (!data.textField || (typeof data.textField === 'string' && data.textField.trim() === '')) {
        errors.push({
            path: 'textField',
            field: t('editor_text_with_blanks') || 'Texte',
            message: t('validation_text_empty') || 'Le texte est vide'
        });
    }
}

/** DragTheWords. */
function validateDragTheWords(data, errors) {
    if (!data.textField || (typeof data.textField === 'string' && data.textField.trim() === '')) {
        errors.push({
            path: 'textField',
            field: t('editor_text_with_blanks') || 'Texte',
            message: t('validation_text_empty') || 'Le texte est vide'
        });
    }
}

/** DragAndDrop. */
function validateDragAndDrop(data, errors) {
    if (!Array.isArray(data.dropZones) || data.dropZones.length < 1) {
        errors.push({
            path: 'dropZones',
            field: t('editor_section_zones') || 'Zones',
            message: t('editor_dnd_min_zone') || 'Au moins 2 zones de dépôt sont requises'
        });
    }
    if (!Array.isArray(data.elements) || data.elements.length < 1) {
        errors.push({
            path: 'elements',
            field: t('editor_section_elements') || 'Étiquettes',
            message: t('editor_dnd_min_element') || 'Au moins 2 étiquettes sont requises'
        });
    }
    // Vérifier que chaque élément a au moins une zone cible valide
    if (Array.isArray(data.elements) && Array.isArray(data.dropZones)) {
        data.elements.forEach((el, i) => {
            const zoneIndices = Array.isArray(el?.zoneIndices) ? el.zoneIndices : [];
            {
                const hasInvalid = zoneIndices.some(zi => {
                    const idx = typeof zi === 'string' ? parseInt(zi, 10) : zi;
                    return idx < 0 || idx >= data.dropZones.length;
                });
                if (hasInvalid) {
                    errors.push({
                        path: `elements.${i}.zoneIndices`,
                        field: `${t('editor_element') || 'Étiquette'} ${i + 1}`,
                        message: t('validation_invalid_zone') || 'Zone cible invalide'
                    });
                }
            }
        });
    }
}

/** Crossword. */
function validateCrossword(data, errors) {
    if (!Array.isArray(data.words) || data.words.length === 0) {
        errors.push({
            path: 'words',
            field: t('editor_section_words') || 'Mots',
            message: t('validation_no_words') || 'Au moins un mot est requis'
        });
    } else {
        data.words.forEach((word, i) => {
            if (!word?.answer || word.answer.trim() === '') {
                errors.push({
                    path: `words.${i}.answer`,
                    field: `${t('editor_word') || 'Mot'} ${i + 1}`,
                    message: t('validation_word_no_answer') || `Le mot ${i + 1} n'a pas de reponse`
                });
            }
            if (!word?.clue || word.clue.trim() === '') {
                errors.push({
                    path: `words.${i}.clue`,
                    field: `${t('editor_word') || 'Mot'} ${i + 1}`,
                    message: t('validation_word_no_clue') || `Le mot ${i + 1} n'a pas d'indice`
                });
            }
        });
    }
}

/** Flashcards. */
function validateFlashcards(data, errors) {
    if (!Array.isArray(data.cards) || data.cards.length === 0) {
        errors.push({
            path: 'cards',
            field: t('editor_section_cards') || 'Cartes',
            message: t('validation_no_cards') || 'Au moins une carte est requise'
        });
    } else {
        data.cards.forEach((card, i) => {
            if (!card?.text || card.text.trim() === '') {
                errors.push({
                    path: `cards.${i}.text`,
                    field: `${t('editor_card') || 'Carte'} ${i + 1}`,
                    message: t('validation_card_no_question') || `La carte ${i + 1} n'a pas de question`
                });
            }
            if (!card?.answer || card.answer.trim() === '') {
                errors.push({
                    path: `cards.${i}.answer`,
                    field: `${t('editor_card') || 'Carte'} ${i + 1}`,
                    message: t('validation_card_no_answer') || `La carte ${i + 1} n'a pas de reponse`
                });
            }
        });
    }
}

/** DialogCards. */
function validateDialogCards(data, errors) {
    if (!Array.isArray(data.dialogs) || data.dialogs.length === 0) {
        errors.push({
            path: 'dialogs',
            field: t('editor_section_dialogs') || 'Dialogues',
            message: t('validation_no_dialogs') || 'Au moins un dialogue est requis'
        });
    } else {
        data.dialogs.forEach((dialog, i) => {
            if (!dialog?.text || dialog.text.trim() === '') {
                errors.push({
                    path: `dialogs.${i}.text`,
                    field: `${t('editor_dialog') || 'Dialogue'} ${i + 1}`,
                    message: t('validation_dialog_no_front') || `Le dialogue ${i + 1} n'a pas de recto`
                });
            }
            if (!dialog?.answer || dialog.answer.trim() === '') {
                errors.push({
                    path: `dialogs.${i}.answer`,
                    field: `${t('editor_dialog') || 'Dialogue'} ${i + 1}`,
                    message: t('validation_dialog_no_back') || `Le dialogue ${i + 1} n'a pas de verso`
                });
            }
        });
    }
}

/** Timeline. */
function validateTimeline(data, errors) {
    const dates = data.timeline?.date;
    if (!Array.isArray(dates) || dates.length === 0) {
        errors.push({
            path: 'timeline.date',
            field: 'Timeline',
            message: t('validation_no_events') || 'Au moins un evenement est requis'
        });
    }
}

/** Essay. */
function validateEssay(data, errors) {
    if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
        errors.push({
            path: 'keywords',
            field: t('editor_section_keywords') || 'Mots-cles',
            message: t('validation_no_keywords') || 'Au moins un mot-cle est requis'
        });
    }
}

/** Summary. */
function validateSummary(data, errors) {
    if (!Array.isArray(data.summaries) || data.summaries.length === 0) {
        errors.push({
            path: 'summaries',
            field: t('editor_section_summaries') || 'Groupes',
            message: t('validation_no_summaries') || 'Au moins un groupe est requis'
        });
    }
}

/** SingleChoiceSet. */
function validateSingleChoiceSet(data, errors) {
    if (!Array.isArray(data.choices) || data.choices.length === 0) {
        errors.push({
            path: 'choices',
            field: t('editor_section_choices') || 'Questions',
            message: t('validation_no_choices') || 'Au moins une question est requise'
        });
    } else {
        data.choices.forEach((choice, i) => {
            if (!choice?.question || choice.question.trim() === '') {
                errors.push({
                    path: `choices.${i}.question`,
                    field: `Question ${i + 1}`,
                    message: t('validation_choice_empty') || `La question ${i + 1} est vide`
                });
            }
        });
    }
}

/** SortParagraphs. */
function validateSortParagraphs(data, errors) {
    if (!Array.isArray(data.paragraphs) || data.paragraphs.length < 3) {
        errors.push({
            path: 'paragraphs',
            field: t('editor_section_paragraphs') || 'Paragraphes',
            message: t('validation_sort_min') || 'Ajoutez au moins trois paragraphes.'
        });
    }
}

/** Chart. */
function validateChart(data, errors) {
    if (!['pieChart', 'barChart'].includes(data.graphMode)) {
        errors.push({ path: 'graphMode', field: t('editor_chart_type'), message: t('editor_error_pattern') });
    }
    if (!Array.isArray(data.listOfTypes) || data.listOfTypes.length === 0) {
        errors.push({
            path: 'listOfTypes',
            field: t('editor_section_data') || 'Donnees',
            message: t('validation_no_chart_data') || 'Au moins une donnee est requise'
        });
    }
    (Array.isArray(data.listOfTypes) ? data.listOfTypes : []).forEach((item, i) => {
        const value = Number(item?.value);
        const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
        const decimals = Math.max(0, (mantissa.split('.')[1] || '').length - Number(exponent));
        if (!Number.isFinite(value) || value < 0.0001 || decimals > 4) {
            errors.push({ path: `listOfTypes.${i}.value`, field: t('editor_chart_value'), message: t('validation_chart_value') });
        }
    });
}

/** Millionnaire. */
function validateMillionnaire(data, errors) {
    if (!Array.isArray(data.questions) || data.questions.length !== 6) {
        errors.push({
            path: 'questions',
            field: 'Millionnaire',
            message: t('validation_millionnaire_exact_6') || 'Le jeu doit contenir exactement 6 questions'
        });
    }
    if (Array.isArray(data.questions)) {
        data.questions.forEach((q, i) => {
            if (!q?.question || q.question.trim() === '') {
                errors.push({
                    path: `questions.${i}.question`,
                    field: `Question ${i + 1}`,
                    message: t('validation_question_empty') || `La question ${i + 1} est vide`
                });
            }
            if (!q?.goodanswer || q.goodanswer.trim() === '') {
                errors.push({
                    path: `questions.${i}.goodanswer`,
                    field: `Question ${i + 1}`,
                    message: t('validation_no_good_answer') || `La question ${i + 1} n'a pas de bonne reponse`
                });
            }
        });
    }
}

/** Appariement. */
function validateAppariement(data, errors) {
    if (!Array.isArray(data.pairs) || data.pairs.length === 0) {
        errors.push({
            path: 'pairs',
            field: t('editor_section_pairs') || 'Paires',
            message: t('validation_no_pairs') || 'Au moins une paire est requise'
        });
    } else {
        data.pairs.forEach((pair, i) => {
            // Une entrée vide est une paire incomplète, pas une exception.
            pair = (pair && typeof pair === 'object') ? pair : {};
            if ((!pair.question || pair.question.trim() === '') || (!pair.answer || pair.answer.trim() === '')) {
                errors.push({
                    path: `pairs.${i}`,
                    field: `${t('editor_pair') || 'Paire'} ${i + 1}`,
                    message: t('validation_pair_incomplete') || `La paire ${i + 1} est incomplete`
                });
            }
        });
    }
}

/** QCM. */
function validateQCM(data, errors) {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        errors.push({
            path: 'questions',
            field: 'QCM',
            message: t('validation_no_questions') || 'Au moins une question est requise'
        });
    } else {
        data.questions.forEach((q, i) => {
            if (!q?.text || q.text.trim() === '') {
                errors.push({
                    path: `questions.${i}.text`,
                    field: `Question ${i + 1}`,
                    message: t('validation_question_empty') || `La question ${i + 1} est vide`
                });
            }
        });
    }
}

/** glossaireXml. */
function validateGlossaireXml(data, errors) {
    if (!Array.isArray(data.entries) || data.entries.length === 0) {
        errors.push({
            path: 'entries',
            field: t('editor_section_entries') || 'Entrees',
            message: t('validation_no_entries') || 'Au moins une entree est requise'
        });
    } else {
        data.entries.forEach((entry, i) => {
            if (!entry?.concept || entry.concept.trim() === '') {
                errors.push({
                    path: `entries.${i}.concept`,
                    field: `${t('editor_entry') || 'Entree'} ${i + 1}`,
                    message: t('validation_entry_no_concept') || `L'entree ${i + 1} n'a pas de concept`
                });
            }
            if (!entry?.definition || entry.definition.trim() === '') {
                errors.push({
                    path: `entries.${i}.definition`,
                    field: `${t('editor_entry') || 'Entree'} ${i + 1}`,
                    message: t('validation_entry_no_definition') || `L'entree ${i + 1} n'a pas de definition`
                });
            }
        });
    }
}

/** Page. */
function validatePage(data, errors) {
    if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
        errors.push({
            path: 'blocks',
            field: t('editor_section_blocks') || 'Blocs',
            message: t('validation_no_blocks') || 'Au moins un bloc est requis'
        });
    } else {
        data.blocks.forEach((block, i) => {
            if (!block?.type || block.type.trim() === '') {
                errors.push({
                    path: `blocks.${i}.type`,
                    field: `${t('editor_block') || 'Bloc'} ${i + 1}`,
                    message: t('validation_block_no_type') || `Le bloc ${i + 1} n'a pas de type`
                });
            }
        });
    }
}

/** Livre / elea_livre. */
function validateLivre(data, errors) {
    if (!data.title || (typeof data.title === 'string' && data.title.trim() === '')) {
        errors.push({
            path: 'title',
            field: t('editor_title') || 'Titre',
            message: t('validation_livre_no_title') || 'Le livre doit avoir un titre'
        });
    }
    if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
        errors.push({
            path: 'chapters',
            field: t('editor_livre_chapters') || 'Chapitres',
            message: t('validation_livre_no_chapters') || 'Le livre doit contenir au moins un chapitre'
        });
    } else {
        // Le premier chapitre ne peut pas être un sous-chapitre
        if (data.chapters[0]?.subchapter) {
            errors.push({
                path: 'chapters.0.subchapter',
                field: `${t('editor_livre_chapter') || 'Chapitre'} 1`,
                message: t('validation_livre_first_subchapter') || 'Le premier chapitre ne peut pas être un sous-chapitre'
            });
        }
        // Validation séquence : sous-chapitre orphelin
        // Un sous-chapitre est valide tant qu'il existe au moins un chapitre normal avant lui
        // (plusieurs sous-chapitres consécutifs peuvent partager le même parent).
        let hasParentBefore = false;
        data.chapters.forEach((ch, i) => {
            if (ch?.subchapter && !hasParentBefore) {
                errors.push({
                    path: `chapters.${i}.subchapter`,
                    field: `${t('editor_livre_chapter') || 'Chapitre'} ${i + 1}`,
                    message: t('validation_livre_orphan_subchapter') || 'Un sous-chapitre doit suivre un chapitre normal'
                });
            }
            if (!ch?.subchapter) hasParentBefore = true;
            if (!ch?.title || (typeof ch.title === 'string' && ch.title.trim() === '')) {
                errors.push({
                    path: `chapters.${i}.title`,
                    field: `${t('editor_livre_chapter') || 'Chapitre'} ${i + 1}`,
                    message: t('validation_livre_chapter_no_title') || `Le chapitre ${i + 1} n'a pas de titre`
                });
            }
            // Chaque bloc doit avoir un type
            if (Array.isArray(ch?.blocks)) {
                ch.blocks.forEach((block, j) => {
                    if (!block?.type || block.type.trim() === '') {
                        errors.push({
                            path: `chapters.${i}.blocks.${j}.type`,
                            field: `${t('editor_block') || 'Bloc'} ${j + 1}`,
                            message: t('validation_block_no_type') || `Le bloc ${j + 1} n'a pas de type`
                        });
                    }
                });
            }
        });
    }
}

/** CoursePresentation. */
function validateCoursePresentation(data, errors) {
    if (!Array.isArray(data.slides) || data.slides.length < 2) {
        errors.push({
            path: 'slides',
            field: t('editor_cp_section_slides') || 'Slides',
            message: t('validation_cp_min_slides') || ''
        });
    } else {
        data.slides.forEach((slide, i) => {
            // Une diapositive vide est signalée comme sans type ni titre, sans exception.
            slide = (slide && typeof slide === 'object') ? slide : {};
            if (!slide.type || slide.type.trim() === '') {
                errors.push({
                    path: `slides.${i}.type`,
                    field: `${t('editor_cp_slide') || 'Slide'} ${i + 1}`,
                    message: t('validation_cp_no_type') || ''
                });
            }
            if (!slide.title || slide.title.trim() === '') {
                errors.push({
                    path: `slides.${i}.title`,
                    field: `${t('editor_cp_slide') || 'Slide'} ${i + 1}`,
                    message: t('validation_cp_no_title') || ''
                });
            }
            // Exercice obligatoire pour les slides quiz/content-quiz/summary
            // Note: après normalisation, exercise.library est déplacé vers _exerciseLibrary
            if (['quiz', 'content-quiz', 'summary'].includes(slide.type)) {
                const hasExerciseLib = slide._exerciseLibrary || (slide.exercise && slide.exercise.library);
                if (!slide.exercise || !hasExerciseLib) {
                    errors.push({
                        path: `slides.${i}.exercise`,
                        field: `${t('editor_cp_slide') || 'Slide'} ${i + 1}`,
                        message: t('validation_cp_no_exercise') || ''
                    });
                }
            }
        });
    }
}

/** InteractiveBook. */
function validateInteractiveBook(data, errors) {
    if (!Array.isArray(data.chapters) || data.chapters.length < 1) {
        errors.push({
            path: 'chapters',
            field: t('editor_ib_section_chapters') || 'Chapitres',
            message: t('validation_ib_min_chapters') || ''
        });
    } else {
        data.chapters.forEach((ch, i) => {
            if (!ch?.title || !ch.title.trim()) {
                errors.push({
                    path: `chapters.${i}.title`,
                    field: `${t('editor_ib_chapter') || 'Chapitre'} ${i + 1}`,
                    message: t('validation_ib_no_chapter_title') || ''
                });
            }
            if (!Array.isArray(ch?.content) || ch.content.length === 0) {
                errors.push({
                    path: `chapters.${i}.content`,
                    field: `${t('editor_ib_chapter') || 'Chapitre'} ${i + 1}`,
                    message: t('validation_ib_empty_chapter') || ''
                });
            }
            // Bloc exercice sans type d'exercice choisi
            // Note: après normalisation, library est déplacé vers _exerciseLibrary
            const verifierBlocs = (blocks, prefix) => (Array.isArray(blocks) ? blocks : []).forEach((b, j) => {
                if (!b || typeof b !== 'object') return;
                const blockType = b._blockType || b.type;
                if (blockType === 'row') {
                    for (const [columnIndex, column] of (Array.isArray(b.columns) ? b.columns : []).entries()) {
                        verifierBlocs(column?.content, `${prefix}.${j}.columns.${columnIndex}.content`);
                    }
                }
                if (blockType === 'exercise' && !(b._exerciseLibrary || b.library)) {
                    errors.push({
                        path: `${prefix}.${j}`,
                        field: `${t('editor_ib_chapter') || 'Chapitre'} ${i + 1} — ${t('editor_ib_block') || 'Bloc'} ${j + 1}`,
                        message: t('validation_ib_no_exercise_lib') || ''
                    });
                }
                // Bloc image sans fichier : le processeur l'ignorerait silencieusement
                // (buildImageBlock exige image.path) → on le signale ici à l'utilisateur.
                if (blockType === 'image' && !(b.image && b.image.path)) {
                    errors.push({
                        path: `${prefix}.${j}`,
                        field: `${t('editor_ib_chapter') || 'Chapitre'} ${i + 1} — ${t('editor_ib_block') || 'Bloc'} ${j + 1}`,
                        message: t('validation_ib_image_no_file') || ''
                    });
                }
            });
            verifierBlocs(ch?.content, `chapters.${i}.content`);
        });
    }
}

/**
 * Registre : clé de module → validation dédiée. Plusieurs clés peuvent partager
 * une règle (les trois variantes de QuizSet, `Livre`/`elea_livre`), ce que la
 * table rend explicite là où la chaîne de `if` d’origine le noyait.
 *
 * Prototype nul : une clé de module valant `constructor` ou `toString` ne doit
 * pas résoudre vers une méthode héritée d’`Object`.
 */
const TYPE_RULES = Object.assign(Object.create(null), {
    QuizSet: validateQuizSet,
    QuizSetQCM: validateQuizSet,
    QuizSetVF: validateQuizSet,
    MultipleChoice: validateMultipleChoice,
    TrueFalse: validateTrueFalse,
    ImageHotspots: validateImageHotspots,
    FindTheHotspot: validateFindTheHotspot,
    FindMultipleHotspots: validateFindTheHotspot,
    FindTheWords: validateFindTheWords,
    FillInTheBlanks: validateFillInTheBlanks,
    ComplexFillTheBlanks: validateFillInTheBlanks,
    MarkTheWords: validateMarkTheWords,
    DragTheWords: validateDragTheWords,
    DragAndDrop: validateDragAndDrop,
    Crossword: validateCrossword,
    Flashcards: validateFlashcards,
    DialogCards: validateDialogCards,
    Timeline: validateTimeline,
    Essay: validateEssay,
    Summary: validateSummary,
    SingleChoiceSet: validateSingleChoiceSet,
    SortParagraphs: validateSortParagraphs,
    Chart: validateChart,
    Millionnaire: validateMillionnaire,
    Appariement: validateAppariement,
    QCM: validateQCM,
    glossaireXml: validateGlossaireXml,
    Page: validatePage,
    Livre: validateLivre,
    elea_livre: validateLivre,
    CoursePresentation: validateCoursePresentation,
    InteractiveBook: validateInteractiveBook
});

/** Clés de module disposant d’une validation dédiée (pour les tests). */
export const VALIDATED_MODULE_KEYS = Object.freeze(Object.keys(TYPE_RULES));

/**
 * Validations specifiques par type de module.
 * Ces validations s'executent APRES le healing structurel,
 * donc elles ne portent QUE sur le contenu pedagogique irreparable.
 */
function getTypeSpecificErrors(data, schema) {
    const errors = [];
    const moduleKey = schema?._moduleKey || '';

    // Validation dédiée à l’activité (cf. TYPE_RULES ci-dessus). Un accès par clé
    // remplace la chaîne de 27 `if (moduleKey === …)` séquentiels d’origine.
    const rule = TYPE_RULES[moduleKey];
    if (rule) rule(data, errors);

    // =================================================================
    // VALIDATIONS TRANSVERSALES (existantes, conservées)
    // =================================================================

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

    // QCM Moodle: verifier chaque question (hasCorrectAnswer)
    if (moduleKey === 'QCM' && Array.isArray(data.questions)) {
        data.questions.forEach((q, i) => {
            if (Array.isArray(q?.answers)) {
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
                message: t('editor_error_no_blanks_sentence') || 'Au moins une phrase doit contenir un mot entre *asterisques*'
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
