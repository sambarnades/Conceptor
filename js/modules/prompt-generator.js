/**
 * @file Gestion de la génération des prompts pour l'IA.
 * Ce module lit les informations saisies par l'utilisateur dans les formulaires (simple ou guidé)
 * et construit des prompts structurés et détaillés pour chaque type d'activité.
 *
 * NOUVELLE ARCHITECTURE (v2.0) :
 * - Les prompts sont maintenant construits à partir de 6 sections traduisibles
 * - Les clés de traduction suivent le pattern : NOM_ACTIVITE_SECTION
 * - La logique de remplacement gère les modes Rapide et Avancé
 */

import { showNotification } from './utils.js';
import { translations } from './translation.js';
import { h5pModules, moodleModules } from './definitions.js';
import { activeTile } from './ui.js';

// ============================================================================
// CONFIGURATION DES ACTIVITÉS
// ============================================================================

/**
 * Mapping des activités avec leurs clés de traduction
 * Chaque activité a un préfixe correspondant aux clés dans translations
 */
const ACTIVITY_CONFIG = {
    timeline: { prefix: 'TIMELINE', resultKey: 'timelineResultat' },
    crossword: { prefix: 'CROSSWORD', resultKey: 'crosswordResultat' },
    flashcards: { prefix: 'FLASHCARDS', resultKey: 'flashcardsResultat' },
    essay: { prefix: 'ESSAY', resultKey: 'essayResultat' },
    accordion: { prefix: 'ACCORDION', resultKey: 'glossaryResultat' },
    summary: { prefix: 'SUMMARY', resultKey: 'summaryResultat' },
    dragTheWords: { prefix: 'DRAG_THE_WORDS', resultKey: 'dragWordResultat' },
    fillInTheBlanks: { prefix: 'FILL_IN_THE_BLANKS', resultKey: 'blanksResultat' },
    markTheWords: { prefix: 'MARK_THE_WORDS', resultKey: 'markWordsResultat' },
    trueFalse: { prefix: 'TRUE_FALSE', resultKey: 'trueFalseResultat' },
    multipleChoice: { prefix: 'MULTIPLE_CHOICE', resultKey: 'multipleChoiceResultat' },
    findTheWords: { prefix: 'FIND_THE_WORDS', resultKey: 'findTheWordsResultat' },
    sortParagraphs: { prefix: 'SORT_THE_PARAGRAPHS', resultKey: 'sortParagraphsResultat' },
    singleChoiceSet: { prefix: 'SINGLE_CHOICE_SET', resultKey: 'singleChoiceSetResultat' },
    dialogCards: { prefix: 'DIALOG_CARDS', resultKey: 'dialogCardsResultat' },
    chart: { prefix: 'CHART', resultKey: 'chartResultat' },
    quizset: { prefix: 'QUIZSET', resultKey: 'quizSetResultat' },
    quizsetQcm: { prefix: 'QUIZSET_QCM', resultKey: 'quizSetQcmResultat' },
    quizsetVf: { prefix: 'QUIZSET_VF', resultKey: 'quizSetVfResultat' },
    eleaTest: { prefix: 'ELEA_TEST', resultKey: 'moodleXmlResultat' },
    eleaMillionnaire: { prefix: 'ELEA_MILLIONNAIRE', resultKey: 'millionnaireResultat' },
    eleaAppariement: { prefix: 'ELEA_APPARIEMENT', resultKey: 'appariementResultat' },
    eleaQcm: { prefix: 'ELEA_QCM', resultKey: 'qcmResultat' },
    eleaGlossaire: { prefix: 'ELEA_GLOSSAIRE', resultKey: 'glossaireXmlResultat' },
    eleaPage: { prefix: 'ELEA_PAGE', resultKey: 'pageResultat' }
};

// ============================================================================
// FONCTIONS DE CONSTRUCTION DES PROMPTS
// ============================================================================

/**
 * Construit le prompt complet pour une activité donnée
 * @param {string} activityPrefix - Préfixe de l'activité (ex: 'TIMELINE')
 * @param {Object} params - Paramètres du prompt
 * @param {string} params.qui - Le rôle/public cible
 * @param {string} params.quoi - L'objectif pédagogique
 * @param {string} params.niveau - Le niveau du public (mode avancé uniquement)
 * @param {string} params.nombreQuestions - Nombre d'éléments à générer
 * @param {string} params.ocrContent - Contenu OCR/RAG (sources)
 * @param {boolean} params.isAdvanced - Mode avancé ou rapide
 * @returns {string} Le prompt complet
 */
function buildActivityPrompt(activityPrefix, params) {
    const pt = translations;
    const { qui, quoi, niveau, nombreQuestions, ocrContent, isAdvanced } = params;

    // 1. CONTEXTE PÉDAGOGIQUE (commune à toutes les activités)
    let contextePedagogique = pt.CONTEXTE_PEDAGOGIQUE_COMMUN || '';

    // Remplacer [QUI] et [QUOI]
    contextePedagogique = contextePedagogique
        .replace(/\[QUI\]/g, qui || pt.prompt_fallback_teacher || 'un enseignant')
        .replace(/\[QUOI\]/g, quoi || pt.prompt_fallback_activity || 'créer une activité pédagogique');

    // Gérer la ligne avec [NIVEAU] selon le mode
    if (isAdvanced && niveau) {
        // Mode avancé : remplacer [NIVEAU] par la valeur
        contextePedagogique = contextePedagogique.replace(/\[NIVEAU\]/g, niveau);
    } else {
        // Mode rapide : supprimer toute ligne contenant [NIVEAU]
        contextePedagogique = contextePedagogique.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');
    }

    // 2. RÈGLES SPÉCIFIQUES
    let reglesSpecifiques = pt[`${activityPrefix}_REGLES_SPECIFIQUES`] || '';

    // Gérer le séparateur || pour le contenu conditionnel
    // La condition dépend uniquement de si nombreQuestions est renseigné
    if (nombreQuestions && nombreQuestions.toString().trim()) {
        // Si nombreQuestions est renseigné : garder le label + la partie après ||
        reglesSpecifiques = reglesSpecifiques.replace(
            /([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g,
            (match, label, rapid, advanced) => {
                return label + advanced.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
            }
        );
        // Fallback pour d'autres patterns de [NOMBRE_ELEMENTS]
        reglesSpecifiques = reglesSpecifiques.replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
    } else {
        // Si nombreQuestions est vide : garder le label + la partie avant || (valeur par défaut)
        reglesSpecifiques = reglesSpecifiques.replace(
            /([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g,
            (match, label, rapid, advanced) => label + rapid
        );
    }


    // 3. RÈGLES PÉDAGOGIQUES (communes)
    const reglesPedagogiques = pt.REGLES_PEDAGOGIQUES_COMMUNES || '';

    // 4. SOURCES (conditionnelles)
    let sources = '';
    if (ocrContent && ocrContent.trim()) {
        sources = (pt.SOURCES_COMMUNES || '').replace('[RAG]', ocrContent.trim());
    }

    // 5. STRUCTURE JSON
    const structureJson = pt[`${activityPrefix}_STRUCTURE_JSON`] || '';

    // 6. EXEMPLE DE RENDU
    const exempleRendu = pt[`${activityPrefix}_EXEMPLE_RENDU`] || '';

    // Assemblage final du prompt
    let prompt = `# ${pt.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}
${contextePedagogique}

# ${pt.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}
${reglesSpecifiques}

# ${pt.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}
${reglesPedagogiques}
`;

    // Ajouter les sources seulement si elles existent
    if (sources) {
        prompt += `
# ${pt.prompt_header_sources || 'SOURCES'}
${sources}
`;
    }

    prompt += `
# ${pt.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}
${structureJson}

# ${pt.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}
${exempleRendu}`;

    return prompt;
}

// ============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION
// ============================================================================

/**
 * Fonction principale qui lit les champs du formulaire actif (simple ou guidé)
 * et déclenche la génération des prompts via `getPrompts`.
 * Les prompts générés sont stockés dans des `textarea` cachés dans le DOM.
 */
export function generatePrompts() {
    const simpleModeTab = document.querySelector('.mode-tab[data-mode="simple"]');
    let prompts;

    if (simpleModeTab.classList.contains('active')) {
        // Mode Simple (Rapide)
        const qui = document.getElementById('qui').value.trim();
        const quoi = document.getElementById('quoi').value.trim();

        if (!qui && !quoi) {
            showNotification(translations.error_please_fill_fields || 'Veuillez remplir au moins un champ du mode Rapide.', 'error');
            return;
        }
        prompts = getPrompts(qui, quoi, null, null, false);
    } else {
        // Mode Guidé (Avancé)
        const qui = document.getElementById('qui').value.trim();
        const quoi = document.getElementById('quoi').value.trim();
        const niveau = document.getElementById('niveau').value.trim();
        const nombreQuestionsValue = document.getElementById('nombreQuestions').value.trim();

        if (!qui && !quoi && !niveau && !nombreQuestionsValue) {
            showNotification(translations.error_please_fill_guided_fields || 'Veuillez remplir au moins un champ du mode Avancé.', 'error');
            return;
        }
        prompts = getPrompts(qui, quoi, niveau, nombreQuestionsValue, true);
    }

    // Nettoyer les anciens prompts cachés
    document.querySelectorAll('textarea[id^="hidden-"]').forEach(el => el.remove());

    // Créer les nouveaux prompts cachés
    for (const key in prompts) {
        const hiddenTextarea = document.createElement('textarea');
        hiddenTextarea.id = `hidden-${key}`;
        hiddenTextarea.classList.add('hidden');
        hiddenTextarea.value = prompts[key];
        document.body.appendChild(hiddenTextarea);
    }

    // Si un contenu est ouvert, rafraîchir son prompt
    if (activeTile) {
        const moduleKey = activeTile.dataset.module;
        const module = h5pModules[moduleKey] || moodleModules[moduleKey];

        if (module) {
            let promptId;
            if (module.promptId) {
                promptId = module.promptId;
            }
            else if (moduleKey === 'moodleXml') {
                promptId = 'moodleXmlResultat';
            }

            if (promptId) {
                const promptTextarea = document.getElementById(promptId);
                const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
                if (promptTextarea && generatedPrompt) {
                    promptTextarea.value = generatedPrompt;
                }
            }
        }
    }
}

// ============================================================================
// GÉNÉRATION DES PROMPTS POUR TOUTES LES ACTIVITÉS
// ============================================================================

/**
 * Génère tous les prompts pour toutes les activités
 * @param {string} qui - Le rôle/public cible
 * @param {string} quoi - L'objectif pédagogique
 * @param {string} niveau - Le niveau du public (mode avancé)
 * @param {string} nombreQuestions - Nombre d'éléments
 * @param {boolean} isAdvanced - Mode avancé ou rapide
 * @returns {Object} Objet contenant tous les prompts par clé
 */
function getPrompts(qui, quoi, niveau, nombreQuestions, isAdvanced) {
    // Récupérer le contenu OCR/RAG
    const ocrOutput = document.getElementById('ocr-output');
    const ocrContent = ocrOutput ? ocrOutput.innerText.trim() : '';

    // Paramètres communs pour la construction des prompts
    const params = {
        qui,
        quoi,
        niveau,
        nombreQuestions,
        ocrContent,
        isAdvanced
    };

    // Générer tous les prompts
    const prompts = {};

    for (const [, config] of Object.entries(ACTIVITY_CONFIG)) {
        prompts[config.resultKey] = buildActivityPrompt(config.prefix, params);
    }

    return prompts;
}
