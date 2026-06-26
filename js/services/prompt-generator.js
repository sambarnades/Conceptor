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

import { showNotification } from '../core/utils.js';
import { translations } from '../core/translation.js';
import { h5pModules, moodleModules } from '../core/definitions.js';
import { activeTile } from '../ui/ui.js';

// ============================================================================
// CONFIGURATION DES ACTIVITÉS
// ============================================================================

/**
 * Mapping des activités avec leurs clés de traduction
 * Chaque activité a un préfixe correspondant aux clés dans translations
 */
const ACTIVITY_CONFIG = {
    timeline: { prefix: 'prompt_timeline', resultKey: 'timelineResultat' },
    crossword: { prefix: 'prompt_crossword', resultKey: 'crosswordResultat' },
    flashcards: { prefix: 'prompt_flashcards', resultKey: 'flashcardsResultat' },
    essay: { prefix: 'prompt_essay', resultKey: 'essayResultat' },
    accordion: { prefix: 'prompt_accordion', resultKey: 'glossaryResultat' },
    summary: { prefix: 'prompt_summary', resultKey: 'summaryResultat' },
    dragTheWords: { prefix: 'prompt_drag_the_words', resultKey: 'dragWordResultat' },
    dragAndDrop: { prefix: 'prompt_drag_and_drop', resultKey: 'dragAndDropResultat' },
    fillInTheBlanks: { prefix: 'prompt_fill_in_the_blanks', resultKey: 'blanksResultat' },
    markTheWords: { prefix: 'prompt_mark_the_words', resultKey: 'markWordsResultat' },
    trueFalse: { prefix: 'prompt_true_false', resultKey: 'trueFalseResultat' },
    multipleChoice: { prefix: 'prompt_multiple_choice', resultKey: 'multipleChoiceResultat' },
    findTheWords: { prefix: 'prompt_find_the_words', resultKey: 'findTheWordsResultat' },
    sortParagraphs: { prefix: 'prompt_sort_the_paragraphs', resultKey: 'sortParagraphsResultat' },
    singleChoiceSet: { prefix: 'prompt_single_choice_set', resultKey: 'singleChoiceSetResultat' },
    dialogCards: { prefix: 'prompt_dialog_cards', resultKey: 'dialogCardsResultat' },
    chart: { prefix: 'prompt_chart', resultKey: 'chartResultat' },
    quizset: { prefix: 'prompt_quizset', resultKey: 'quizSetResultat' },
    quizsetQcm: { prefix: 'prompt_quizset_qcm', resultKey: 'quizSetQcmResultat' },
    quizsetVf: { prefix: 'prompt_quizset_vf', resultKey: 'quizSetVfResultat' },
    eleaTest: { prefix: 'prompt_elea_test', resultKey: 'test_eleaResultat' },
    eleaMillionnaire: { prefix: 'prompt_elea_millionnaire', resultKey: 'millionnaireResultat' },
    eleaAppariement: { prefix: 'prompt_elea_appariement', resultKey: 'appariementResultat' },
    eleaQcm: { prefix: 'prompt_elea_qcm', resultKey: 'qcmResultat' },
    eleaGlossaire: { prefix: 'prompt_elea_glossaire', resultKey: 'glossaireXmlResultat' },
    eleaPage: { prefix: 'prompt_elea_page', resultKey: 'pageResultat' },
    eleaLivre: { prefix: 'prompt_elea_livre', resultKey: 'livreResultat' },
    eleaDevoir: { prefix: 'prompt_elea_devoir', resultKey: 'devoirResultat' },
    coursePresentation: { prefix: 'prompt_course_presentation', resultKey: 'coursePresentationResultat' },
    interactiveBook: { prefix: 'prompt_interactive_book', resultKey: 'interactiveBookResultat' },
    interactiveVideo: { prefix: 'prompt_interactive_video', resultKey: 'interactiveVideoResultat' }
};

/**
 * Renvoie le préfixe de clés i18n du prompt pour un moduleKey donné
 * (ex. 'QuizSetQCM' → 'prompt_quizset_qcm'), résolu via `resultKey === module.promptId`.
 * Utilisé par le moteur de génération par lots (`services/llm-batch.js`) pour reconstruire
 * les prompts « plan » et « remplissage ». Renvoie null si le module n'a pas de prompt connu.
 * @param {string} moduleKey
 * @returns {string|null}
 */
export function prefixForModule(moduleKey) {
    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    const resultKey = (module && module.promptId)
        || (moduleKey === 'test_elea' ? 'test_eleaResultat'
            : moduleKey === 'glossaireXml' ? 'glossaireXmlResultat' : null);
    if (!resultKey) return null;
    for (const cfg of Object.values(ACTIVITY_CONFIG)) {
        if (cfg.resultKey === resultKey) return cfg.prefix;
    }
    return null;
}

// ============================================================================
// VIDÉO INTERACTIVE — transcription courante injectée comme SOURCES du prompt
// ============================================================================
// Quand l'utilisateur colle une URL et que Caramel récupère la transcription timée,
// celle-ci est stockée ici (déjà formatée `[mm:ss] texte` + indice de durée) puis
// injectée comme SOURCES du prompt « Vidéo interactive » par getPrompts(). C'est cette
// transcription + les timestamps qui permettent à l'IA de placer les questions juste
// avant la phrase qui lance une idée neuve. null = pas de transcription récupérée.
let currentVideoSources = null;
// Plafond PHYSIQUE de questions pour la vidéo courante (mémorisé pour getPrompts, qui n'a plus les
// segments sous la main, seulement currentVideoSources). null = pas de transcription timée.
let currentVideoMaxQuestions = null;

/**
 * Plafond PHYSIQUE de questions déduit de la transcription : on ne peut poser qu'UNE question par
 * horodatage distinct (cf. `snapInteractions`, qui cale chaque question sur une ancre réelle unique).
 * = **nombre d'horodatages distincts strictement positifs** (le `0:00` / tout début est exclu). C'est
 * la borne dure : snap ne peut pas en placer davantage, quel que soit le nombre demandé.
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @returns {number|null} Plafond (≥ 1), ou null si aucune ancre exploitable (transcription non timée).
 */
function videoMaxQuestions(segments) {
    // Mêmes ancres que le snap : secondes entières distinctes, strictement positives.
    const distinct = new Set(getTranscriptAnchors(segments).filter(s => Number.isFinite(s) && s > 0));
    return distinct.size > 0 ? distinct.size : null;
}

/**
 * En-tête dynamique placé en tête des SOURCES du prompt « Vidéo interactive » : rappelle la durée
 * (borne des timestamps) ET le plafond physique de questions déduit de la transcription.
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @param {number|null} durationSeconds
 * @returns {string}
 */
function buildVideoHeader(segments, durationSeconds) {
    const lines = [];
    if (durationSeconds) {
        lines.push(`(Durée de la vidéo : ${Math.round(durationSeconds)} secondes — tous les "timestamp" doivent rester dans cet intervalle)`);
    }
    const cap = videoMaxQuestions(segments);
    if (cap) {
        lines.push(`(NOMBRE MAXIMUM DE QUESTIONS : il n'existe que ${cap} horodatages exploitables dans la transcription ci-dessous, et tu ne peux poser qu'UNE question par horodatage → AU MAXIMUM ${cap} questions au total, quel que soit le nombre demandé. N'en produis jamais davantage.)`);
    }
    return lines.length ? lines.join('\n') + '\n\n' : '';
}

/**
 * Borne le nombre de questions demandé au plafond physique de la vidéo courante (jamais au-dessus du
 * nombre d'horodatages exploitables). Ne touche pas une valeur déjà ≤ plafond, ni un champ vide.
 * @param {string|null} nombreQuestions
 * @param {number|null} [cap] - Plafond explicite ; par défaut celui de la vidéo courante.
 * @returns {string|null}
 */
function clampVideoCount(nombreQuestions, cap = currentVideoMaxQuestions) {
    if (!nombreQuestions || !cap) return nombreQuestions;
    const n = parseInt(String(nombreQuestions), 10);
    return (Number.isFinite(n) && n > cap) ? String(cap) : nombreQuestions;
}

/**
 * Mémorise (ou efface) la transcription à injecter dans le prompt « Vidéo interactive ».
 * Appelé par l'UI dès que la transcription est récupérée (ou l'URL effacée).
 * @param {Array<{start:number,end:number,text:string}>|null} segments - Segments timés, ou null pour effacer.
 * @param {number|null} [durationSeconds] - Durée de la vidéo (borne des timestamps).
 */
export function setVideoTranscriptSources(segments, durationSeconds = null) {
    if (!Array.isArray(segments) || segments.length === 0) {
        currentVideoSources = null;
        currentVideoMaxQuestions = null;
        return;
    }
    const transcriptText = formatTranscriptForPrompt(segments);
    currentVideoMaxQuestions = videoMaxQuestions(segments);
    currentVideoSources = (buildVideoHeader(segments, durationSeconds) + transcriptText).trim() || null;
}

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
    let contextePedagogique = pt.prompt_contexte_pedagogique_commun || '';

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
    let reglesSpecifiques = pt[`${activityPrefix}_regles_specifiques`] || '';

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
    const reglesPedagogiques = pt.prompt_regles_pedagogiques_communes || '';

    // 4. SOURCES (conditionnelles)
    // Une activité peut surcharger le cadrage des sources via `${prefix}_sources`
    // (ex. vidéo interactive : la « source » est la transcription horodatée).
    let sources = '';
    if (ocrContent && ocrContent.trim()) {
        const sourcesTemplate = pt[`${activityPrefix}_sources`] || pt.prompt_sources_communes || '';
        sources = sourcesTemplate.replace('[RAG]', ocrContent.trim());
    }

    // 5. STRUCTURE JSON
    const structureJson = pt[`${activityPrefix}_structure_json`] || '';

    // 6. EXEMPLE DE RENDU
    const exempleRendu = pt[`${activityPrefix}_exemple_rendu`] || '';

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
            else if (moduleKey === 'test_elea') {
                promptId = 'test_eleaResultat';
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
        const isVideo = config.prefix === 'prompt_interactive_video';
        // Pour la vidéo interactive, la « source » est la transcription timée récupérée
        // (et non l'OCR/RAG) : on l'injecte en SOURCES pour que le prompt de gauche soit
        // complet en mode Guidé (et réutilisable tel quel par le one-clic).
        const sources = (isVideo && currentVideoSources) ? currentVideoSources : ocrContent;
        // …et on borne le nombre demandé au plafond physique de la vidéo (pas plus de questions
        // qu'il n'y a d'horodatages), sinon le prompt se contredirait avec l'en-tête de plafond.
        const activityParams = isVideo
            ? { ...params, nombreQuestions: clampVideoCount(params.nombreQuestions) }
            : params;
        prompts[config.resultKey] = buildActivityPrompt(config.prefix, { ...activityParams, ocrContent: sources });
    }

    return prompts;
}

// ============================================================================
// VIDÉO INTERACTIVE — prompt à partir de la transcription timée
// ============================================================================

/**
 * Lit les champs de contexte pédagogique selon le mode actif (Rapide/Avancé).
 * @returns {{qui:string, quoi:string, niveau:string|null, nombreQuestions:string|null, isAdvanced:boolean}}
 */
export function readContextParams() {
    const simpleModeTab = document.querySelector('.mode-tab[data-mode="simple"]');
    const isAdvanced = !(simpleModeTab && simpleModeTab.classList.contains('active'));
    const qui = (document.getElementById('qui')?.value || '').trim();
    const quoi = (document.getElementById('quoi')?.value || '').trim();
    const niveau = isAdvanced ? (document.getElementById('niveau')?.value || '').trim() : null;
    const nombreQuestions = isAdvanced ? (document.getElementById('nombreQuestions')?.value || '').trim() : null;
    return { qui, quoi, niveau, nombreQuestions, isAdvanced };
}

const MMSS = (t) => {
    t = Math.max(0, Math.floor(Number(t) || 0));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Formate des segments timés en transcription `[mm:ss] texte`, **une ligne par segment**, avec
 * le timestamp RÉEL de début de segment (`start`). AUCUNE interpolation : chaque repère correspond
 * exactement à un instant où Whisper a réellement démarré ce passage — l'IA peut donc placer une
 * question pile à une frontière réelle (juste avant la phrase qui lance une idée neuve).
 *
 * La finesse du découpage dépend donc de la granularité des segments fournis. Le webhook n8n
 * découpe désormais la transcription **phrase par phrase à partir des timestamps mot-à-mot de
 * Whisper** (`timestamp_granularities=word`) → un repère réel par phrase. Si la voie n'expose que
 * des segments grossiers, on les liste tels quels (toujours des temps réels, jamais inventés).
 *
 * Garde-fou vidéos longues : au-delà de `maxLines`, on regroupe des segments VOISINS en gardant le
 * timestamp réel du premier segment du groupe (on n'invente toujours aucun temps).
 *
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @param {{maxLines?:number}} [opts]
 * @returns {string}
 */
function buildTranscriptItems(segments, opts = {}) {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    const maxLines = opts.maxLines || 300;

    let items = segments
        .map(s => ({ ts: Number(s.start) || 0, text: String(s.text || '').replace(/\s+/g, ' ').trim() }))
        .filter(s => s.text);
    if (items.length === 0) return [];

    // Repli vidéos longues : regrouper des segments voisins (timestamp réel du 1ᵉʳ conservé).
    if (items.length > maxLines) {
        const groupSize = Math.ceil(items.length / maxLines);
        const grouped = [];
        for (let i = 0; i < items.length; i += groupSize) {
            const chunk = items.slice(i, i + groupSize);
            grouped.push({ ts: chunk[0].ts, text: chunk.map(c => c.text).join(' ') });
        }
        items = grouped;
    }
    return items;
}

export function formatTranscriptForPrompt(segments, opts = {}) {
    const items = buildTranscriptItems(segments, opts);
    if (items.length === 0) return '';
    return items.map(l => `[${MMSS(l.ts)}] ${l.text}`).join('\n');
}

/**
 * Renvoie les ANCRES temporelles (secondes entières) exactement telles qu'elles sont présentées
 * au modèle dans le bloc SOURCES (un nombre par ligne `[mm:ss]`, après le regroupement éventuel
 * des vidéos longues). C'est le seul ensemble d'instants sur lesquels une question peut légitimement
 * tomber → sert au snap des timestamps (cf. `processors/interactive-video-snap.js`).
 * @param {Array<{start:number,end:number,text:string}>} segments
 * @param {{maxLines?:number}} [opts]
 * @returns {number[]}
 */
export function getTranscriptAnchors(segments, opts = {}) {
    return buildTranscriptItems(segments, opts).map(l => Math.max(0, Math.floor(Number(l.ts) || 0)));
}

/**
 * Construit le prompt « Vidéo interactive » : contexte pédagogique + règles de placement
 * des questions aux ruptures d'idées + transcription horodatée en SOURCES.
 * @param {Array<{start:number,end:number,text:string}>} segments - Segments de la transcription.
 * @param {number|null} [durationSeconds] - Durée de la vidéo (indice pour borner les timestamps).
 * @returns {string} Le prompt complet.
 */
export function buildVideoInteractivePrompt(segments, durationSeconds = null) {
    const params = readContextParams();
    const transcriptText = formatTranscriptForPrompt(segments);
    const header = buildVideoHeader(segments, durationSeconds);
    // Borne le nombre demandé au plafond physique déduit des segments (cohérent avec l'en-tête).
    const nombreQuestions = clampVideoCount(params.nombreQuestions, videoMaxQuestions(segments));
    return buildActivityPrompt('prompt_interactive_video', { ...params, nombreQuestions, ocrContent: header + transcriptText });
}
