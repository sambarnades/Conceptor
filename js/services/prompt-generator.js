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
import { texteAffiche } from '../core/texte-affiche.js';
import { translations } from '../core/translation.js';
import { consigneLangueEnseignee } from '../core/content-language.js';
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
    dictation: { prefix: 'prompt_dictation', resultKey: 'dictationResultat' },
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
    interactiveVideo: { prefix: 'prompt_interactive_video', resultKey: 'interactiveVideoResultat' },
    imageHotspots: { prefix: 'prompt_image_hotspots', resultKey: 'imageHotspotsResultat' },
    findTheHotspot: { prefix: 'prompt_find_the_hotspot', resultKey: 'findTheHotspotResultat' },
    findMultipleHotspots: { prefix: 'prompt_find_multiple_hotspots', resultKey: 'findMultipleHotspotsResultat' }
};

// Prompts dont les SOURCES sont les zones détectées par la vision (activités à image de fond,
// `requiresBackgroundImage` dans definitions.js) : Image interactive + les deux « Find the Hotspot ».
const HOTSPOT_PROMPT_PREFIXES = new Set([
    'prompt_image_hotspots',
    'prompt_find_the_hotspot',
    'prompt_find_multiple_hotspots'
]);

/**
 * Activités dont l'identifiant de prompt N'EST PAS déclaré en `promptId` dans
 * `definitions.js` — il n'existait qu'en dur, réécrit à la main à cinq endroits.
 *
 * `gift` n'est pas une activité générée (`hidden: true`, format d'export du Test Éléa) :
 * aucun groupe d'`ACTIVITY_CONFIG` ne produit `giftResultat`, donc le résoudre reste sans
 * effet. L'entrée est conservée pour que la table décrive TOUT le vocabulaire d'identifiants
 * du produit, plutôt que de laisser un cas particulier survivre côté `ui.js`.
 */
const RESULT_KEY_HORS_DEFINITIONS = {
    test_elea: 'test_eleaResultat',
    glossaireXml: 'glossaireXmlResultat',
    gift: 'giftResultat'
};

/**
 * Identifiant du `<textarea>` de prompt d'une activité (ex. 'Page' → 'pageResultat').
 *
 * SOURCE UNIQUE de cette résolution. Elle était auparavant réécrite à la main en cinq
 * endroits aux couvertures divergentes, et l'un d'eux — le rafraîchissement d'après
 * génération, plus bas dans ce fichier — omettait `glossaireXml` : la tuile « Glossaire »
 * ouverte, « Générer les prompts » remplissait `hidden-glossaireXmlResultat` mais laissait
 * le textarea visible VIDE jusqu'à ce que l'utilisateur referme et rouvre la tuile.
 *
 * Couverture : `node tests/run_prompt_id_resolution.mjs`
 *
 * @param {string} moduleKey
 * @returns {string|null} null si l'activité n'a pas de prompt
 */
export function resultKeyForModule(moduleKey) {
    const module = h5pModules[moduleKey] || moodleModules[moduleKey];
    return (module && module.promptId) || RESULT_KEY_HORS_DEFINITIONS[moduleKey] || null;
}

/**
 * Renvoie le préfixe de clés i18n du prompt pour un moduleKey donné
 * (ex. 'QuizSetQCM' → 'prompt_quizset_qcm'), résolu via `resultKey === module.promptId`.
 * Utilisé par le moteur de génération par lots (`services/llm-batch.js`) pour reconstruire
 * les prompts « plan » et « remplissage ». Renvoie null si le module n'a pas de prompt connu.
 * @param {string} moduleKey
 * @returns {string|null}
 */
export function prefixForModule(moduleKey) {
    const resultKey = resultKeyForModule(moduleKey);
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
// Durée de la vidéo courante (mémorisée pour la même raison : l'en-tête est assemblé tardivement).
let currentVideoDuration = null;

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
 * Plafond ÉDITORIAL par défaut : la règle `prompt_interactive_video_regles_specifiques` dit
 * « JAMAIS plus de 10 au total » (mode Rapide). Sert de référence pour décider si la ligne
 * « nombre maximum » de l'en-tête apporte une information — cf. `buildVideoHeader`.
 */
const VIDEO_EDITORIAL_CAP = 10;

/**
 * En-tête dynamique placé en tête des SOURCES du prompt « Vidéo interactive » : rappelle la durée
 * (borne des timestamps) et, LE CAS ÉCHÉANT, le plafond physique de questions.
 *
 * ⚠️ La ligne « nombre maximum » n'est émise QUE si les horodatages sont PLUS restrictifs que ce
 * que les règles demandent déjà. Sinon elle est au mieux inutile, au pire nocive : elle arrive
 * APRÈS la règle « JAMAIS plus de 10 au total » et la contredit frontalement (« AU MAXIMUM 113
 * questions au total, QUEL QUE SOIT LE NOMBRE DEMANDÉ »). Un modèle qui suit cette dernière
 * consigne part rédiger des dizaines de questions → la génération dépasse le **mur des 59 s** du
 * proxy n8n et échoue (constaté en prod le 2026-08-26 sur une vidéo de 288 s : 113 ancres
 * annoncées, `mistral-small-4-119b` en échec deux fois de suite ; cf. docs/guide-generation-par-lots.md §1
 * « 10 questions ≈ échec »). Le plafond physique reste appliqué de façon DÉTERMINISTE après coup
 * par `snapInteractions` (une question par ancre, collisions décalées) : le prompt n'a pas à le
 * répéter quand il ne borne rien.
 *
 * @param {number|null} cap - Plafond physique (cf. `videoMaxQuestions`), ou null.
 * @param {number|null} durationSeconds
 * @param {string|number|null} [requestedCount] - Nombre de questions demandé (mode Guidé), s'il existe.
 * @returns {string}
 */
function buildVideoHeader(cap, durationSeconds, requestedCount = null) {
    const lines = [];
    if (durationSeconds) {
        lines.push(`(Durée de la vidéo : ${Math.round(durationSeconds)} secondes — tous les "timestamp" doivent rester dans cet intervalle)`);
    }
    // Plafond que les RÈGLES imposent déjà : le nombre demandé en mode Guidé, sinon les 10 du mode Rapide.
    const wanted = parseInt(String(requestedCount ?? ''), 10);
    const ceiling = (Number.isFinite(wanted) && wanted > 0) ? wanted : VIDEO_EDITORIAL_CAP;
    if (cap && cap < ceiling) {
        lines.push(`(NOMBRE MAXIMUM DE QUESTIONS : il n'existe que ${cap} horodatages exploitables dans la transcription ci-dessous, et tu ne peux poser qu'UNE question par horodatage → AU MAXIMUM ${cap} questions au total. N'en produis jamais davantage.)`);
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
 *
 * On ne mémorise que le CORPS de la transcription : l'en-tête est assemblé plus tard, par
 * `videoSourcesFor()`, car sa ligne « nombre maximum » dépend du nombre de questions demandé —
 * que l'enseignant peut saisir APRÈS avoir récupéré la transcription.
 *
 * @param {Array<{start:number,end:number,text:string}>|null} segments - Segments timés, ou null pour effacer.
 * @param {number|null} [durationSeconds] - Durée de la vidéo (borne des timestamps).
 */
export function setVideoTranscriptSources(segments, durationSeconds = null) {
    if (!Array.isArray(segments) || segments.length === 0) {
        currentVideoSources = null;
        currentVideoMaxQuestions = null;
        currentVideoDuration = null;
        return;
    }
    currentVideoMaxQuestions = videoMaxQuestions(segments);
    currentVideoDuration = durationSeconds;
    currentVideoSources = formatTranscriptForPrompt(segments) || null;
}

/**
 * Bloc SOURCES complet de la vidéo courante (en-tête + transcription), assemblé au moment où le
 * prompt est construit pour que l'en-tête tienne compte du nombre de questions demandé.
 * @param {string|number|null} [requestedCount]
 * @returns {string|null}
 */
function videoSourcesFor(requestedCount = null) {
    if (!currentVideoSources) return null;
    const header = buildVideoHeader(currentVideoMaxQuestions, currentVideoDuration, requestedCount);
    return (header + currentVideoSources).trim() || null;
}

// ============================================================================
// IMAGE HOTSPOTS — zones détectées par la vision injectées comme SOURCES du prompt
// ============================================================================
// Quand l'utilisateur joint une image de fond, le modèle vision (DEFAULT_VISION_MODEL, cf. services/hotspot-vision.js) détecte les zones
// clés (x,y en % + description). Ce bloc, déjà formaté, est injecté en SOURCES du prompt
// « Image interactive » par getPrompts() — de la même façon que la transcription pour la vidéo.
// Capturé EN AMONT (dès l'upload) → disponible en mode Rapide ET Guidé. null = aucune analyse.
let currentHotspotZones = null;
// Nombre de zones actuellement détectées — plafond du nombre d'éléments demandé en mode Avancé :
// la vision plafonne aux zones réellement saillantes de l'image et refuse d'en inventer
// (cf. services/hotspot-vision.js), le prompt ne doit donc jamais exiger plus de zones que les
// SOURCES n'en fournissent (le LLM en inventerait). Même logique que currentVideoMaxQuestions.
let currentHotspotZoneCount = null;

/**
 * Formate les zones détectées (vision) en bloc SOURCES lisible par le LLM :
 * description GLOBALE de l'image (contexte), puis une ligne par zone (position % + description).
 * @param {Array<{x:number,y:number,label?:string,description?:string}>} zones
 * @param {{width?:number,height?:number}|null} [imageMeta]
 * @param {string} [imageDescription] - Description globale de l'image (vision).
 * @returns {string}
 */
function formatZonesForPrompt(zones, imageMeta = null, imageDescription = '') {
    if (!Array.isArray(zones) || zones.length === 0) return '';
    const desc = (imageDescription || '').replace(/\s+/g, ' ').trim();
    const globalLine = desc ? `DESCRIPTION GLOBALE DE L'IMAGE : ${desc}\n\n` : '';
    const head = (imageMeta && imageMeta.width)
        ? `(Image de fond : ${imageMeta.width}×${imageMeta.height}px. Les positions x,y sont des POURCENTAGES 0–100 à RECOPIER tels quels.)\n\n`
        : '(Les positions x,y sont des POURCENTAGES 0–100 à RECOPIER tels quels.)\n\n';
    const lines = zones.map((z, i) => {
        const x = Number(z.x); const y = Number(z.y);
        const xs = Number.isFinite(x) ? x.toFixed(1) : '?';
        const ys = Number.isFinite(y) ? y.toFixed(1) : '?';
        const label = z.label ? `${z.label} — ` : '';
        const zdesc = (z.description || '').replace(/\s+/g, ' ').trim();
        return `Zone ${i + 1} — x=${xs}% y=${ys}% : ${label}${zdesc}`;
    });
    return (globalLine + head + lines.join('\n')).trim();
}

/**
 * Mémorise (ou efface) les zones détectées à injecter dans le prompt « Image interactive ».
 * Appelé par l'UI dès que l'analyse vision est terminée (ou l'image retirée).
 * @param {Array<{x:number,y:number,label?:string,description?:string}>|null} zones
 * @param {{width?:number,height?:number}|null} [imageMeta]
 * @param {string} [imageDescription] - Description globale de l'image (vision).
 */
export function setImageHotspotZones(zones, imageMeta = null, imageDescription = '') {
    const formatted = formatZonesForPrompt(zones, imageMeta, imageDescription);
    currentHotspotZones = formatted || null;
    currentHotspotZoneCount = formatted ? zones.length : null;
}

/**
 * Borne le nombre d'éléments demandé (mode Avancé) au nombre de zones réellement détectées —
 * miroir de `clampVideoCount` pour les activités à image de fond. Sans ce clamp, quand la vision
 * renvoie MOINS de zones que demandé (plafonnement anti-hallucination voulu), le prompt exigerait
 * « N zones » alors que les SOURCES en listent moins → le LLM serait tenté d'en inventer.
 * Ne touche pas une valeur déjà ≤ plafond, ni un champ vide.
 * @param {string|null} nombreQuestions
 * @param {number|null} [cap] - Plafond explicite ; par défaut le nb de zones mémorisées.
 * @returns {string|null}
 */
function clampHotspotCount(nombreQuestions, cap = currentHotspotZoneCount) {
    if (!nombreQuestions || !cap) return nombreQuestions;
    const n = parseInt(String(nombreQuestions), 10);
    return (Number.isFinite(n) && n > cap) ? String(cap) : nombreQuestions;
}

/** @returns {boolean} true si des zones ont été détectées et mémorisées. */
export function hasImageHotspotZones() {
    return !!currentHotspotZones;
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
export function buildActivityPrompt(activityPrefix, params) {
    const pt = translations;
    const { qui, quoi, niveau, ocrContent, isAdvanced } = params;
    let { nombreQuestions } = params;
    // Le graphique conserve les séries fournies ; sans série, son prompt prévoit 5 données.
    if (activityPrefix === 'prompt_chart' && !String(nombreQuestions ?? '').trim()) nombreQuestions = 5;
    // Minimum pédagogique du livre généré, y compris en mode guidé.
    // Les livres importés restent régis par leur contrat H5P natif.
    if (activityPrefix === 'prompt_interactive_book' && String(nombreQuestions ?? '').trim()) {
        const requestedChapters = Number(nombreQuestions);
        if (Number.isFinite(requestedChapters) && requestedChapters < 3) nombreQuestions = 3;
    }

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
            /([^:：\n]+[:：]\s*)([^|\n]+)\|\|([^|\n]+)/g,
            (match, label, rapid, advanced) => {
                return label + advanced.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
            }
        );
        // Fallback pour d'autres patterns de [NOMBRE_ELEMENTS]
        reglesSpecifiques = reglesSpecifiques.replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
    } else {
        // Si nombreQuestions est vide : garder le label + la partie avant || (valeur par défaut)
        reglesSpecifiques = reglesSpecifiques.replace(
            /([^:：\n]+[:：]\s*)([^|\n]+)\|\|([^|\n]+)/g,
            (match, label, rapid, advanced) => label + rapid
        );
    }


    // 3. RÈGLES PÉDAGOGIQUES (communes)
    const reglesPedagogiques = pt.prompt_regles_pedagogiques_communes || '';
    // Sur le vrai modèle, la règle générale restait trop loin du rôle et les
    // exemples français reprenaient le dessus. Une langue enseignée explicite
    // devient donc une contrainte prioritaire, proche du contexte.
    const langueObligatoire = consigneLangueEnseignee({ qui, quoi });

    // 4. SOURCES (conditionnelles)
    // Une activité peut surcharger le cadrage des sources via `${prefix}_sources`
    // (ex. vidéo interactive : la « source » est la transcription horodatée).
    let sources = '';
    if (ocrContent && ocrContent.trim()) {
        const sourcesTemplate = pt[`${activityPrefix}_sources`] || pt.prompt_sources_communes || '';
        sources = sourcesTemplate.replace('[RAG]', ocrContent.trim());
    }

    // 5. STRUCTURE JSON
    let structureJson = pt[`${activityPrefix}_structure_json`] || '';
    if (activityPrefix === 'prompt_elea_test') {
        // Le feedback global est un CONTENU rédigé par l'IA, contrairement aux
        // réglages techniques du Test. Il reste donc à la racine de sa réponse,
        // puis `canonicalizeTestModel` le range dans `quiz_settings` pour l'éditeur
        // et le backup Moodle. Sans ce contrat, Caramel affichait deux plages vides.
        structureJson += `\n- \`overallfeedback\` (obligatoire) : tableau de 4 objets \`{ "from", "to", "feedback" }\` couvrant 0-25, 26-50, 51-75 et 76-100 %. Chaque message, dans la langue du contenu, aide à progresser et se rapporte au sujet sans révéler une réponse précise.`;
    }

    // 6. EXEMPLE DE RENDU
    const exempleRendu = pt[`${activityPrefix}_exemple_rendu`] || '';

    // Assemblage final du prompt
    let prompt = `# ${pt.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}
${contextePedagogique}
${langueObligatoire ? `\n${langueObligatoire}\n` : ''}

# ${pt.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}
${reglesSpecifiques}

# ${pt.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}
${reglesPedagogiques}
`;

    const structureBlock = `
# ${pt.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}
${structureJson}

# ${pt.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}
${exempleRendu}`;

    // Vidéo interactive : les SOURCES (transcription horodatée) font souvent des dizaines de
    // milliers de caractères. Si le schéma JSON arrivait APRÈS, une IA externe le perd (collage
    // tronqué, attention diluée en fin de prompt long) et invente son propre format — tableau nu,
    // `options` au lieu d'`answers`… (cas réel, audit 2026-07). On place donc STRUCTURE + EXEMPLE
    // AVANT la transcription, et on termine par un rappel court du format.
    const structureBeforeSources = activityPrefix === 'prompt_interactive_video';

    if (structureBeforeSources) prompt += structureBlock + '\n';

    // Ajouter les sources seulement si elles existent
    if (sources) {
        prompt += `
# ${pt.prompt_header_sources || 'SOURCES'}
${sources}
`;
    }

    if (structureBeforeSources) {
        const rappel = pt[`${activityPrefix}_rappel_final`] || '';
        if (rappel) prompt += `\n${rappel}`;
    } else {
        prompt += structureBlock;
        // Sources jointes par l'enseignant : l'exemple de rendu, lu EN DERNIER, tirait le
        // modèle vers son propre thème et ses propres œuvres au détriment du document
        // (constaté en réel, 25-09-2026). Un rappel clôt donc le prompt. Pas pour une
        // activité qui cadre elle-même ses sources (`${prefix}_sources` : zones d'image).
        if (sources && !pt[`${activityPrefix}_sources`] && pt.prompt_sources_rappel_final) {
            prompt += `\n\n${pt.prompt_sources_rappel_final}`;
        }
    }

    return prompt;
}

// `buildActivityPrompt` est EXPORTÉE (et non plus locale) pour l'atelier de parcours :
// il fabrique le prompt d'une activité sans passer par le DOM — pas de tuile ouverte,
// pas de textarea à lire, juste la carte du plan. Le chemin de la page d'accueil
// (`generatePrompts` → `getPrompts`) est inchangé.

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
            const promptId = resultKeyForModule(moduleKey);
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
 * Texte des SOURCES jointes par l'enseignant (zone #ocr-output : fichiers déposés,
 * pages web importées, texte collé), tel qu'il part vers l'IA. Seul point de lecture
 * pour la génération simple ET par lots : la zone est masquée en mode Rapide, et un
 * `innerText` y recollait les lignes bout à bout (cf. core/texte-affiche.js).
 * @returns {string}
 */
export function lireCorpusSources() {
    return texteAffiche(document.getElementById('ocr-output')).trim();
}

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
    const ocrContent = lireCorpusSources();

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
        const isHotspots = HOTSPOT_PROMPT_PREFIXES.has(config.prefix);
        // Pour la vidéo interactive, la « source » est la transcription timée récupérée
        // (et non l'OCR/RAG) : on l'injecte en SOURCES pour que le prompt de gauche soit
        // complet en mode Guidé (et réutilisable tel quel par le one-clic).
        // Pour l'image interactive, la « source » est la liste des zones détectées par la vision
        // (même logique de capture en amont → dispo en Rapide ET Guidé).
        // …et on borne le nombre demandé au plafond physique de la vidéo (pas plus de questions
        // qu'il n'y a d'horodatages) ou aux zones détectées (pas plus de zones que les SOURCES),
        // sinon le prompt se contredirait avec ses propres sources.
        const activityParams = isVideo
            ? { ...params, nombreQuestions: clampVideoCount(params.nombreQuestions) }
            : (isHotspots && currentHotspotZones)
                ? { ...params, nombreQuestions: clampHotspotCount(params.nombreQuestions) }
                : params;
        // L'en-tête de la transcription est assemblé ICI (et non à la récupération) : sa ligne
        // « nombre maximum » dépend du nombre demandé, saisi éventuellement après coup.
        const sources = (isVideo && currentVideoSources) ? videoSourcesFor(activityParams.nombreQuestions)
            : (isHotspots && currentHotspotZones) ? currentHotspotZones
                : ocrContent;
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
 * @param {Object|null} [contextParams] - Contexte explicite (parcours), sinon formulaire individuel.
 * @returns {string} Le prompt complet.
 */
export function buildVideoInteractivePrompt(segments, durationSeconds = null, contextParams = null) {
    const params = contextParams || readContextParams();
    const transcriptText = formatTranscriptForPrompt(segments);
    const cap = videoMaxQuestions(segments);
    // Borne le nombre demandé au plafond physique déduit des segments (cohérent avec l'en-tête).
    const nombreQuestions = clampVideoCount(params.nombreQuestions, cap);
    const header = buildVideoHeader(cap, durationSeconds, nombreQuestions);
    return buildActivityPrompt('prompt_interactive_video', { ...params, nombreQuestions, ocrContent: header + transcriptText });
}

/**
 * Construit le prompt d'une activité à image de fond (« Image interactive », « Find the
 * Hotspot », « Find Multiple Hotspots ») : contexte pédagogique + règles de rédaction
 * + zones détectées par la vision en SOURCES (positions x,y en % + descriptions).
 * @param {Array<{x:number,y:number,label?:string,description?:string}>} zones - Zones détectées.
 * @param {{width?:number,height?:number}|null} [imageMeta] - Dimensions de l'image (référence des %).
 * @param {string} [imageDescription] - Description globale de l'image (vision).
 * @param {string} [promptPrefix] - Préfixe i18n du prompt de l'activité (défaut : Image interactive).
 * @param {Object|null} [contextParams] - Contexte explicite (parcours), sinon formulaire individuel.
 * @returns {string} Le prompt complet.
 */
export function buildImageHotspotsPrompt(zones, imageMeta = null, imageDescription = '', promptPrefix = 'prompt_image_hotspots', contextParams = null) {
    const params = contextParams || readContextParams();
    const prefix = HOTSPOT_PROMPT_PREFIXES.has(promptPrefix) ? promptPrefix : 'prompt_image_hotspots';
    // Borne le nombre demandé aux zones effectivement fournies en SOURCES (cohérence du prompt).
    const nombreQuestions = clampHotspotCount(params.nombreQuestions, Array.isArray(zones) ? zones.length : null);
    return buildActivityPrompt(prefix, { ...params, nombreQuestions, ocrContent: formatZonesForPrompt(zones, imageMeta, imageDescription) });
}
