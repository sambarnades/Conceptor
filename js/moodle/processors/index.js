/**
 * @file Orchestrateur central pour les processeurs Moodle.
 * Ce module fournit l'API principale pour générer les fichiers d'export MBZ.
 *
 * ZERO appels réseau - tous les templates sont embarqués en JavaScript.
 *
 * Usage:
 *   import * as MoodleProcessors from './processors/index.js';
 *   const files = MoodleProcessors.getActivityFiles('Appariement', data);
 */

import * as Appariement from './activities/Appariement.js';
import * as QCM from './activities/QCM.js';
import * as Page from './activities/Page.js';
import * as Millionnaire from './activities/Millionnaire.js';
import * as Test from './activities/Test.js';
import * as Glossaire from './activities/Glossaire.js';
import * as Devoir from './activities/Devoir.js';

/**
 * Version du module moodle-processors.
 */
export const version = { major: 1, minor: 0 };

/**
 * Registre des processeurs par type d'activité.
 */
const processors = {
    'Appariement': Appariement,
    'QCM': QCM,
    'Page': Page,
    'Millionnaire': Millionnaire,
    'Test': Test,
    'Glossaire': Glossaire,
    'Devoir': Devoir
};

/**
 * Liste des types d'activités supportés.
 */
export const supportedActivities = Object.keys(processors);

/**
 * Génère tous les fichiers pour un type d'activité donné.
 * Cette fonction remplace fetchAllFilesRecursively() avec ZERO appels réseau.
 *
 * @param {string} activityKey - Type d'activité ('Appariement', 'QCM', 'Page', etc.)
 * @param {Object} data - Les données avec les placeholders :
 *   - ACTIVITY_TITLE: Titre de l'activité
 *   - COURSE_FULLNAME: Nom complet du cours
 *   - COURSE_SHORTNAME: Nom court du cours
 *   - COURSE_ID: ID du cours (numérique)
 *   - MODULE_ID: ID du module (numérique)
 *   - SECTION_ID: ID de la section (numérique)
 *   - ACTIVITY_ID: ID de l'activité (numérique)
 *   - COURSE_CONTEXTID: ID du contexte cours
 *   - ACTIVITY_CONTEXTID: ID du contexte activité
 *   - TIMESTAMP: Timestamp Unix
 *   - BACKUP_DATE: Date de sauvegarde (timestamp)
 *   - ... et autres données spécifiques au type
 * @param {Object} options - Options de génération (optionnel)
 * @returns {Object} Objet { chemin: contenu } de tous les fichiers
 * @throws {Error} Si le type d'activité n'est pas supporté
 */
export function getActivityFiles(activityKey, data, options = {}) {
    const processor = processors[activityKey];
    if (!processor || !processor.buildFiles) {
        throw new Error(`Type d'activité non supporté: ${activityKey}. Types supportés: ${supportedActivities.join(', ')}`);
    }
    return processor.buildFiles(data, options);
}

/**
 * Récupère les métadonnées d'un type d'activité.
 *
 * @param {string} activityKey - Type d'activité
 * @returns {Object|null} Métadonnées { moduleName, moduleVersion, requiredPlaceholders }
 */
export function getActivityMetadata(activityKey) {
    const processor = processors[activityKey];
    return processor ? processor.metadata : null;
}

/**
 * Valide que les données contiennent tous les placeholders requis.
 *
 * @param {string} activityKey - Type d'activité
 * @param {Object} data - Les données à valider
 * @returns {{ valid: boolean, missing: string[] }} Résultat de validation
 */
export function validateData(activityKey, data) {
    const processor = processors[activityKey];
    if (!processor) {
        return { valid: false, missing: ['Type d\'activité inconnu'] };
    }

    const required = processor.metadata?.requiredPlaceholders || [];
    const missing = required.filter(key => !(key in data));
    return { valid: missing.length === 0, missing };
}

/**
 * Génère les IDs nécessaires pour un export.
 * Utilitaire pour créer facilement les données requises.
 *
 * @param {string} title - Titre de l'activité
 * @returns {Object} Données de base avec IDs générés
 */
export function generateBaseData(title) {
    const timestamp = Math.floor(Date.now() / 1000);
    const courseId = 1000 + Math.floor(Math.random() * 9000);
    const moduleId = 10000 + Math.floor(Math.random() * 90000);
    const sectionId = 1000 + Math.floor(Math.random() * 9000);
    const activityId = 100 + Math.floor(Math.random() * 900);
    const courseContextId = 10000 + Math.floor(Math.random() * 90000);
    const activityContextId = courseContextId + 2;
    const categoryId = 100 + Math.floor(Math.random() * 900);
    const courseItemId = 1000 + Math.floor(Math.random() * 9000);
    const gradeItemId = 1000 + Math.floor(Math.random() * 9000);

    return {
        ACTIVITY_TITLE: title,
        COURSE_FULLNAME: title,
        COURSE_SHORTNAME: `parcours-${Math.random().toString(36).substring(2, 15)}`,
        COURSE_ID: courseId,
        MODULE_ID: moduleId,
        SECTION_ID: sectionId,
        ACTIVITY_ID: activityId,
        COURSE_CONTEXTID: courseContextId,
        ACTIVITY_CONTEXTID: activityContextId,
        TIMESTAMP: timestamp,
        BACKUP_DATE: timestamp,
        CATEGORY_ID: categoryId,
        COURSE_ITEM_ID: courseItemId,
        GRADE_ITEM_ID: gradeItemId
    };
}

/**
 * Exporte les utilitaires de placeholder pour usage externe.
 */
export { replacePlaceholders, extractPlaceholders, validatePlaceholders } from './shared/placeholder.js';

/**
 * Exporte les templates partagés pour usage externe si nécessaire.
 */
export { TEMPLATES } from './shared/templates.js';

/**
 * Export par défaut avec les fonctions principales.
 */
export default {
    version,
    supportedActivities,
    getActivityFiles,
    getActivityMetadata,
    validateData,
    generateBaseData
};
