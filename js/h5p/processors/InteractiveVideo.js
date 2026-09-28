/**
 * Processeur H5P — Vidéo interactive (InteractiveVideo)
 *
 * Transforme le JSON intermédiaire « plat » (vidéo + interactions horodatées + résumé)
 * en JSON H5P.InteractiveVideo 1.27 complet (validé sur son semantics.json).
 *
 * Format d'entrée (source unique de vérité — cf. docs/PRD_VIDEO_INTERACTIVE.md §5.4 / §C du plan) :
 *   {
 *     title, videoSource:{type,url,mime}, poster?,
 *     transcript?: { language, vtt?, captionUrl? },           // piste de sous-titres (optionnel)
 *     interactions: [
 *       { timestamp, pause?, type:"multichoice", question, answers:[{text,correct,feedback?}] },
 *       { timestamp, pause?, type:"truefalse", question, correct, feedbackOnCorrect?, feedbackOnWrong? },
 *       { timestamp, pause?, type:"blanks", text | questions:[...], taskDescription? }
 *     ],
 *     summary?: { intro, statements:[ ["correcte","distracteur","..."] ] }
 *   }
 *
 * La vidéo est RÉFÉRENCÉE PAR URL (video.files[].path = URL http(s)) — jamais bundlée
 * (vérifié : h5p-creator n'embarque que content.json + images du registre).
 *
 * Pattern identique à InteractiveBook / CoursePresentation : async, retourne { content, dependencies },
 * délègue les sous-exercices aux processeurs enfants via helpers.processChild().
 *
 * @module processors/InteractiveVideo
 * @exports {Object} default.process - Transformation principale (async, reçoit helpers)
 */
import { translations } from '../../core/translation.js';
import { processVideoFile, registerMedia } from '../image-manager.js';
import { libellesSummary } from './Summary.js';
import { formatTextToHtml, generateUUID, debugLog } from '../../core/utils.js';
import { healSlidesLatex } from './CoursePresentation.js';
import { snapInteractions } from './interactive-video-snap.js';

// === Mapping type simplifié IA → library H5P complète (mêmes versions que CP/IB) ===
const LIBRARY_MAP = {
    'multichoice': 'H5P.MultiChoice 1.16',
    'truefalse':   'H5P.TrueFalse 1.8',
    'blanks':      'H5P.Blanks 1.14'
};

/**
 * Retire les marqueurs Markdown d'un feedback. La consigne impose un feedback en TEXTE BRUT, mais
 * l'IA y glisse parfois de l'emphase (`*par jour*`, `**important**`). Or les feedbacks ne passent PAS
 * par formatTextToHtml : H5P les rend tels quels → les `*` resteraient visibles à l'écran. On nettoie
 * donc l'emphase / le code inline (sans toucher au reste du texte).
 * @param {string} text
 * @returns {string}
 */
function stripFeedbackMarkdown(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')   // **gras**
        .replace(/\*([^*\n]+?)\*/g, '$1')     // *italique*
        .replace(/__([^_]+)__/g, '$1')        // __gras__
        .replace(/`([^`]+)`/g, '$1')          // `code`
        .replace(/~~([^~]+)~~/g, '$1')        // ~~barré~~
        .trim();
}

/**
 * Convertit en booléen une valeur de bonne réponse Vrai/Faux que l'IA renvoie tantôt en booléen,
 * tantôt en CHAÎNE ("true"/"false", "vrai"/"faux", "0"…). Piège : `!!"false"` vaut `true` (chaîne
 * non vide) → l'ancienne tolérance inversait `correct:"false"` (vu sur Qwen). On reconnaît donc
 * explicitement les formes négatives.
 * @param {*} v
 * @returns {boolean}
 */
function toBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return !['false', 'faux', 'non', 'no', '0', 'f', 'n', ''].includes(s);
    }
    return !!v;
}

// Fenêtre d'affichage du bouton (secondes). Courte : comme la vidéo se met en pause au
// `timestamp`, le bouton est visible pendant la pause ; une fenêtre courte évite qu'il
// « traîne » à l'écran une fois la question passée et la lecture reprise.
const BUTTON_VISIBLE_S = 2;

// Positions prédéfinies (presets) → coordonnées en % du cadre vidéo. Pour `displayType:'button'`,
// seuls x/y positionnent l'icône (width/height ignorés par H5P) ; pour `'poster'`, tout le rectangle
// compte (le contenu s'affiche directement sur la vidéo). `center` sert aussi de REPLI (placement
// absent ou inconnu) et reprend le défaut historique → le contenu déjà généré en mode bouton, sans
// champ placement, reste positionné à l'identique.
const PLACEMENTS = {
    'center':       { x: 45, y: 32, width: 40, height: 30 },
    'top-left':     { x: 2,  y: 2,  width: 40, height: 35 },
    'top-right':    { x: 58, y: 2,  width: 40, height: 35 },
    'bottom-left':  { x: 2,  y: 63, width: 40, height: 35 },
    'bottom-right': { x: 58, y: 63, width: 40, height: 35 },
    'bottom':       { x: 5,  y: 65, width: 90, height: 30 },
    'full':         { x: 5,  y: 5,  width: 90, height: 90 }
};

// Géométrie des interactions en mode POSTER : PLEIN CADRE, toujours.
//
// Ce n'est pas un choix de design, c'est ce que fait le lecteur. MESURÉ le 2026-08-01 sur
// H5P.InteractiveVideo 1.27 (aperçu h5p-standalone, vraie vidéo) : quatre géométries très
// différentes — 76×56, 40×30 (l'ancien défaut bouton), 90×38 et 90×90 — donnent TOUTES le même
// rendu, `900×506 px @ 0,0`, soit exactement la surface de la vidéo. En cause `repositionToWrapper`
// dans le bundle de la lib : pour un poster (`!isButton()`), la boîte est recalculée puis rabattue
// sur le conteneur dès qu'elle déborde, ce qui arrive systématiquement.
//
// On écrit donc la géométrie que le lecteur applique RÉELLEMENT, plutôt que des coordonnées
// décoratives qui laisseraient croire à un réglage inexistant (et qui mentiraient à l'éditeur H5P
// natif d'Éléa/Lumi, lui, fidèle aux valeurs stockées). Corollaire : le champ « placement » n'a
// aucun sens en mode poster — l'éditeur Caramel le masque (cf. content-detector.js).
const POSTER_POS = { x: 0, y: 0, width: 100, height: 100 };

// Borne une valeur en pourcentage [0..100] ; repli sur `dflt` si non numérique.
const clampPct = (v, dflt) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : dflt;
};

/**
 * Résout la position d'une interaction.
 * - Poster : plein cadre, sans discussion — le lecteur ne sait rien faire d'autre (cf. POSTER_POS).
 * - Bouton : coordonnées libres si `placement:'custom'`, sinon preset nommé, sinon défaut historique.
 * @param {Object} it - L'interaction simplifiée.
 * @param {'button'|'poster'} displayType - Mode d'affichage déjà résolu.
 * @returns {{x:number,y:number,width:number,height:number}}
 */
function resolvePosition(it, displayType) {
    if (displayType === 'poster') return { ...POSTER_POS };
    const dflt = PLACEMENTS.center;
    if (it.placement === 'custom') {
        return {
            x: clampPct(it.x, dflt.x),
            y: clampPct(it.y, dflt.y),
            width: clampPct(it.width, dflt.width),
            height: clampPct(it.height, dflt.height)
        };
    }
    return PLACEMENTS[it.placement] || dflt;
}

/**
 * Construit le bloc `adaptivity` H5P (sauts conditionnels + réponse obligatoire) à partir des
 * champs plats du format intermédiaire. Retourne null si rien n'est configuré (pas de bloc inutile).
 * `requireCompletion:true` force l'ouverture automatique du popup et bloque tant que la réponse est
 * fausse (cf. semantics IV : `adaptivity.requireCompletion`).
 * @param {Object} it - L'interaction simplifiée.
 * @returns {Object|null}
 */
function buildAdaptivity(it) {
    const branch = (seekTo, message, allowOptOut) => {
        const b = {};
        // seekTo : un saut conditionnel n'a de sens que vers un instant > 0. On ignore 0 (et le vide),
        // car l'éditeur collecte les champs « saut » non renseignés à 0 (input toujours à "00:00:00")
        // → sans ce garde-fou, chaque interaction éditée déclencherait un retour au début de la vidéo.
        const st = Math.max(0, Number(seekTo) || 0);
        if (st > 0) b.seekTo = st;
        if (message) b.message = formatTextToHtml(String(message));
        // allowOptOut : on ne stocke que l'activation explicite (une case non cochée = défaut, inutile).
        if (allowOptOut === true) b.allowOptOut = true;
        return Object.keys(b).length ? b : null;
    };
    const adaptivity = {};
    const correct = branch(it.correctSeekTo, it.correctMessage, it.correctAllowOptOut);
    const wrong = branch(it.wrongSeekTo, it.wrongMessage, it.wrongAllowOptOut);
    if (correct) adaptivity.correct = correct;
    if (wrong) adaptivity.wrong = wrong;
    if (it.requireCompletion) adaptivity.requireCompletion = true;
    return Object.keys(adaptivity).length ? adaptivity : null;
}

// Libellés d'interface de H5P.InteractiveVideo (lecteur, écran de soumission,
// annonces pour lecteurs d'écran). Le `.h5p` n'embarque pas les libs : seul ce
// qui est écrit ici dans content.l10n est traduit sur Éléa. Ce bloc était figé
// en français — le lecteur restait donc francophone en interface grecque ou
// espagnole. Construit à la demande pour suivre la langue courante.
function buildIvL10n() {
    return {
        interaction: translations.h5p_iv_interaction || 'Interaction',
        play: translations.h5p_iv_play || 'Lecture',
        pause: translations.h5p_iv_pause || 'Pause',
        mute: translations.h5p_iv_mute || 'Couper le son',
        unmute: translations.h5p_iv_unmute || 'Activer le son',
        quality: translations.h5p_iv_quality || 'Qualité de la vidéo',
        captions: translations.h5p_iv_captions || 'Sous-titres',
        close: translations.h5p_iv_close || 'Fermer',
        fullscreen: translations.h5p_iv_fullscreen || 'Plein écran',
        exitFullscreen: translations.h5p_iv_exit_fullscreen || 'Quitter le plein écran',
        summary: translations.h5p_iv_summary || 'Ouvrir le résumé',
        bookmarks: translations.h5p_iv_bookmarks || 'Signets',
        endscreen: translations.h5p_iv_endscreen || 'Écran de soumission',
        defaultAdaptivitySeekLabel: translations.h5p_iv_default_adaptivity_seek_label || 'Continuer',
        continueWithVideo: translations.h5p_iv_continue_with_video || 'Continuer la vidéo',
        more: translations.h5p_iv_more || 'Plus d’options',
        playbackRate: translations.h5p_iv_playback_rate || 'Vitesse de lecture',
        rewind10: translations.h5p_iv_rewind10 || 'Reculer de 10 secondes',
        navDisabled: translations.h5p_iv_nav_disabled || 'La navigation est désactivée',
        navForwardDisabled: translations.h5p_iv_nav_forward_disabled || 'La navigation en avant est désactivée',
        sndDisabled: translations.h5p_iv_snd_disabled || 'Le son est désactivé',
        requiresCompletionWarning: translations.h5p_iv_requires_completion_warning || 'Vous devez répondre correctement à toutes les questions avant de continuer.',
        back: translations.h5p_iv_back || 'Retour',
        hours: translations.h5p_iv_hours || 'Heures',
        minutes: translations.h5p_iv_minutes || 'Minutes',
        seconds: translations.h5p_iv_seconds || 'Secondes',
        currentTime: translations.h5p_iv_current_time || 'Temps actuel :',
        totalTime: translations.h5p_iv_total_time || 'Durée totale :',
        singleInteractionAnnouncement: translations.h5p_iv_single_interaction_announcement || 'Une interaction est apparue :',
        multipleInteractionsAnnouncement: translations.h5p_iv_multiple_interactions_announcement || 'Plusieurs interactions sont apparues.',
        videoPausedAnnouncement: translations.h5p_iv_video_paused_announcement || 'La vidéo est en pause',
        content: translations.h5p_iv_content || 'Contenu',
        answered: translations.h5p_iv_answered || '@answered répondue(s)',
        endcardQuestion: translations.h5p_iv_endcard_question || 'Question',
        endcardTitle: translations.h5p_iv_endcard_title || '@answered question(s) répondue(s)',
        endcardInformation: translations.h5p_iv_endcard_information || 'Vous avez répondu à @answered questions, cliquez ci-dessous pour soumettre vos réponses.',
        endcardInformationOnSubmitButtonDisabled: translations.h5p_iv_endcard_information_on_submit_button_disabled || 'Vous avez répondu à @answered questions.',
        endcardInformationNoAnswers: translations.h5p_iv_endcard_information_no_answers || 'Vous n’avez répondu à aucune question.',
        endcardInformationMustHaveAnswer: translations.h5p_iv_endcard_information_must_have_answer || 'Vous devez répondre à au moins une question avant de pouvoir soumettre vos réponses.',
        endcardSubmitButton: translations.h5p_iv_endcard_submit_button || 'Soumettre les réponses',
        endcardSubmitMessage: translations.h5p_iv_endcard_submit_message || 'Vos réponses ont été soumises !',
        // Champ HÉRITÉ : absent de semantics.json 1.28 mais toujours lu par le JS
        // de la lib (en-tête de colonne du tableau récapitulatif). À conserver —
        // sans lui, la colonne repasse au défaut anglais de la plateforme.
        endcardTableRowAnswered: translations.h5p_iv_endcard_table_row_answered || 'Questions répondues',
        endcardTableRowScore: translations.h5p_iv_endcard_table_row_score || 'Score',
        endcardAnsweredScore: translations.h5p_iv_endcard_answered_score || 'répondue',
        endCardTableRowSummaryWithScore: translations.h5p_iv_end_card_table_row_summary_with_score || 'Vous avez obtenu @score sur @total points pour la @question apparue après @minutes minutes et @seconds secondes.',
        endCardTableRowSummaryWithoutScore: translations.h5p_iv_end_card_table_row_summary_without_score || 'Vous avez répondu à la @question apparue après @minutes minutes et @seconds secondes.',
        videoProgressBar: translations.h5p_iv_video_progress_bar || 'Progression de la vidéo',
        howToCreateInteractions: translations.h5p_iv_how_to_create_interactions || 'Lancez la vidéo pour commencer à créer des interactions'
    };
}

/**
 * Normalise une interaction du format intermédiaire vers les params attendus par le
 * processeur enfant (transformForQuizSet), puis délègue à helpers.processChild().
 * @param {Object} it - L'interaction simplifiée.
 * @param {Object} helpers - Helpers du routeur (processChild, etc.).
 * @returns {Promise<{action:Object, libName:string}|null>}
 */
async function buildInteractionAction(it, helpers) {
    const type = String(it.type || 'multichoice').toLowerCase();
    const fullLibrary = LIBRARY_MAP[type];
    if (!fullLibrary) {
        debugLog('InteractiveVideo', `Type d'interaction inconnu : ${type} (ignoré)`);
        return null;
    }
    const libName = fullLibrary.split(' ')[0];

    // Construire les params simplifiés que le transformForQuizSet enfant attend.
    let params;
    if (type === 'multichoice') {
        params = {
            question: it.question || '',
            answers: (Array.isArray(it.answers) ? it.answers : []).map(a => ({
                text: a.text || '',
                correct: !!a.correct,
                tipsAndFeedback: {
                    tip: a.tip || '',
                    chosenFeedback: stripFeedbackMarkdown(a.feedback || a.chosenFeedback || ''),
                    notChosenFeedback: stripFeedbackMarkdown(a.notChosenFeedback || '')
                }
            }))
        };
    } else if (type === 'truefalse') {
        params = {
            question: it.question || '',
            // H5P.TrueFalse attend la bonne réponse en chaîne "true"/"false" (toBool gère le cas
            // où l'IA renvoie déjà une chaîne, y compris "false" qu'un `!!` aurait pris pour vrai).
            correct: String(toBool(it.correct))
        };
        if (it.feedbackOnCorrect) params.feedbackOnCorrect = stripFeedbackMarkdown(it.feedbackOnCorrect);
        if (it.feedbackOnWrong) params.feedbackOnWrong = stripFeedbackMarkdown(it.feedbackOnWrong);
    } else { // blanks
        const questions = Array.isArray(it.questions) && it.questions.length
            ? it.questions.map(q => (typeof q === 'string' ? q : (q?.text || q?.question || '')))
            : [String(it.text || '')];
        params = {
            taskDescription: it.taskDescription || (translations.h5p_iv_blanks_intro || 'Complète le texte :'),
            questions: questions.filter(Boolean)
        };
    }

    const subContent = {
        subContentId: generateUUID(),
        library: fullLibrary,
        metadata: {
            title: (it.question || it.title || 'Question').toString().slice(0, 80),
            contentType: 'Question',
            license: 'U'
        },
        params
    };

    if (helpers && helpers.processChild) {
        try {
            const processed = await helpers.processChild(subContent);
            return { action: processed, libName };
        } catch (e) {
            debugLog('InteractiveVideo', `processChild échec (${type})`, e);
        }
    }
    return { action: subContent, libName };
}

/**
 * Construit un item de assets.interactions[] à partir d'une interaction simplifiée + son action.
 * @param {Object} it - L'interaction simplifiée (timestamp, pause...).
 * @param {Object} action - Le sous-contenu H5P traité.
 * @returns {Object} L'item interaction conforme au semantics IV.
 */
function buildInteractionItem(it, action, displayMode = 'custom') {
    const from = Math.max(0, Number(it.timestamp) || 0);
    const visible = Number(it.visibleDuration);
    const to = from + (Number.isFinite(visible) && visible > 0 ? visible : BUTTON_VISIBLE_S);

    // `poster` (DÉFAUT depuis 2026-08) = contenu affiché directement sur la vidéo, apparition
    // automatique à la pause : l'élève n'a rien à cliquer pour voir la question.
    // `button` = icône discrète, la question s'ouvre au clic — il faut le demander explicitement.
    // Le défaut a été inversé sur demande de l'auteur : l'icône passait inaperçue (visible 2 s),
    // et personne n'allait changer le mode question par question dans l'éditeur.
    //
    // `displayMode` (racine, 2026-08) tranche pour TOUTE l'activité quand il vaut 'poster' ou
    // 'button' ; en 'custom' (défaut, et cas des contenus antérieurs au réglage) chaque question
    // garde son propre `display`. Cet ordre est ce qui rend le réglage global compréhensible :
    // il ne « pré-remplit » pas les questions, il décide à leur place — sans écraser leurs valeurs,
    // qui restent intactes dans le JSON et reprennent effet dès le retour en « personnalisé ».
    const displayType = (displayMode === 'poster' || displayMode === 'button')
        ? displayMode
        : (it.display === 'button' ? 'button' : 'poster');
    const pos = resolvePosition(it, displayType);

    const item = {
        duration: { from, to },
        pause: it.pause !== false, // pause par défaut (point d'arrêt pédagogique)
        displayType,
        buttonOnMobile: !!it.buttonOnMobile,
        // Libellé du bouton (vide par défaut → icône seule, non recouvrante). Ignoré en mode poster.
        label: displayType === 'button' ? formatTextToHtml(String(it.label || '')) : '',
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        libraryTitle: 'Question',
        action
    };

    const adaptivity = buildAdaptivity(it);
    if (adaptivity) item.adaptivity = adaptivity;

    return item;
}

/**
 * Construit la tâche de résumé final (H5P.Summary 1.10).
 * Convention : dans chaque groupe, la 1ʳᵉ affirmation est la correcte (le player mélange).
 * @param {Object} summary - { intro, statements:[ [correcte, distracteur, ...] ] }
 * @returns {Object|null} { task, displayAt } ou null si pas de résumé exploitable.
 */
function buildSummary(summary) {
    const statements = Array.isArray(summary?.statements) ? summary.statements : [];
    const summaries = statements
        .filter(g => Array.isArray(g) && g.length > 0)
        .map(group => ({
            summary: group.map(s => formatTextToHtml(String(s || ''))),
            subContentId: generateUUID()
        }));
    if (summaries.length === 0) return null;

    return {
        task: {
            library: 'H5P.Summary 1.10',
            subContentId: generateUUID(),
            metadata: { contentType: 'Summary', license: 'U', title: 'Résumé' },
            params: {
                // Mêmes clés que l'activité « Résumé » autonome : c'est la même
                // lib H5P.Summary, donc les mêmes champs de semantics. Dupliquer
                // les clés (anciens `h5p_iv_summary_*`, absents des 11 locales)
                // faisait retomber TOUTES les langues sur le repli français.
                intro: formatTextToHtml(summary.intro || (translations.h5p_summary_intro || "Choisissez l'affirmation correcte.")),
                summaries,
                overallFeedback: [{ from: 0, to: 100, feedback: '' }],
                // Libellés PARTAGÉS avec l'activité « Résumé » autonome : ils étaient
                // recopiés ici à la main et il en manquait 5, affichés en anglais.
                ...libellesSummary()
            }
        },
        displayAt: summary.displayAt!=null && summary.displayAt!=='' && Number.isFinite(Number(summary.displayAt)) ? Math.max(0,Number(summary.displayAt)) : 3
    };
}

export default {
    /**
     * Traite le JSON intermédiaire pour la Vidéo interactive.
     * @param {Object} jsonObj - JSON intermédiaire (cf. en-tête de module).
     * @param {Object} helpers - Helpers injectés par le routeur (processChild, getKeyFromLibrary, getLibraryMetadata).
     * @returns {Promise<{content:Object, dependencies:Array}>}
     */
    async process(jsonObj, helpers) {
        if(jsonObj.interactiveVideo){
            const content=JSON.parse(JSON.stringify(jsonObj));
            const dependencies=[];const seen=new Set();
            const walk=value=>{if(!value||typeof value!=='object')return;
                if(typeof value.library==='string'){const m=/^(H5P\.[A-Za-z0-9]+) (\d+)\.(\d+)$/.exec(value.library);if(m&&!seen.has(value.library)){seen.add(value.library);dependencies.push({machineName:m[1],majorVersion:+m[2],minorVersion:+m[3]});}}
                Object.values(value).forEach(walk);};walk(content);
            return {content,dependencies};
        }

        debugLog('InteractiveVideo', 'Début du traitement', {
            interactions: jsonObj.interactions?.length,
            hasVideo: !!jsonObj.videoSource
        });

        // Healing LaTeX nu local (réutilisé de CoursePresentation).
        const rawInteractions = healSlidesLatex(Array.isArray(jsonObj.interactions) ? jsonObj.interactions : []);
        let videoSource = jsonObj.videoSource || {};
        if (videoSource.embed === true && videoSource.url) {
            // Le téléchargement progressif PeerTube corrige duration=Infinity dans
            // Firefox, mais ne supporte pas toujours Range dans Chromium. Le média
            // doit donc être embarqué : navigation locale en aperçu et sur Éléa.
            const response = await fetch(videoSource.url, { signal: AbortSignal.timeout(60000) });
            if (!response.ok) throw new Error(`Vidéo : téléchargement impossible (${response.status}).`);
            const limit = 80 * 1024 * 1024; // Même plafond que processVideoFile.
            if (Number(response.headers.get('content-length')) > limit) {
                await response.body?.cancel();
                throw new Error('SIZE_EXCEEDED');
            }
            const reader = response.body.getReader();
            const chunks = [];
            let size = 0;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    size += value.byteLength;
                    if (size > limit) throw new Error('SIZE_EXCEEDED');
                    chunks.push(value);
                }
            } catch (error) {
                await reader.cancel().catch(() => {});
                throw error;
            } finally {
                reader.releaseLock();
            }
            const blob = new Blob(chunks, { type: 'video/mp4' });
            // Un HTTP 200 peut être une page HTML PeerTube. Vérifier la signature
            // MP4 avant de déclarer le fichier utilisable et de l'exporter.
            const signature = new Uint8Array(await blob.slice(4, 8).arrayBuffer());
            if (String.fromCharCode(...signature) !== 'ftyp') throw new Error('Vidéo : fichier MP4 attendu.');
            const media = await processVideoFile(blob);
            registerMedia(`interactive-video:${videoSource.url}`, media);
            videoSource = { ...videoSource, url: media.h5pPath, mime: media.mime };
        }
        const allLibs = new Set();
        // Durée de la vidéo (injectée par l'UI depuis la détection) → borne haute des timestamps.
        const maxDuration = Number(jsonObj.duration) > 0 ? Number(jsonObj.duration) : null;

        // 1. Normaliser les interactions AVANT de construire les sous-contenus.
        let normalized = rawInteractions.filter(it => it && typeof it === 'object');

        // (a) Écarter les timestamps AU-DELÀ de la durée — l'IA en hallucine parfois (jamais affichés).
        let droppedOutOfRange = 0;
        if (maxDuration) {
            normalized = normalized.filter(it => {
                if ((Number(it.timestamp) || 0) > maxDuration) {
                    droppedOutOfRange++;
                    debugLog('InteractiveVideo', `Interaction écartée : timestamp ${it.timestamp}s > durée ${maxDuration}s`);
                    return false;
                }
                return true;
            });
        }

        // (b) Snap défensif : si l'appelant a injecté les ancres réelles (`segmentStarts`), caler ici
        // aussi les timestamps sur les instants réels. En prod, l'UI a déjà calé à la génération
        // (idempotent) ; ce backstop couvre les JSON édités/collés où l'appelant fournit les ancres.
        if (Array.isArray(jsonObj.segmentStarts) && jsonObj.segmentStarts.length) {
            const snapped = snapInteractions(normalized, jsonObj.segmentStarts, { maxDuration });
            normalized = snapped.interactions;
            debugLog('InteractiveVideo', 'Snap timestamps (processeur)', snapped.report);
        }

        // (c) Trier par timestamp croissant (l'IA / l'éditeur peuvent dé-trier).
        normalized.sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

        // NB : aucun plafonnement du nombre de questions. Le contenu généré est conservé tel quel
        // (le prompt recommande un nombre, il ne l'impose pas) ; l'enseignant supprime à la main ce
        // qu'il ne veut pas. Seuls l'écart des hors-durée (a) et le snap (b) s'appliquent (validité).

        // (d) Construire les sous-contenus (séquentiel : préserve l'ordre temporel).
        // Mode d'affichage global : 'poster' | 'button' imposent le mode à toutes les questions,
        // 'custom' (défaut, et absence du champ) laisse chaque question décider.
        const displayMode = (jsonObj.displayMode === 'poster' || jsonObj.displayMode === 'button')
            ? jsonObj.displayMode
            : 'custom';
        const interactions = [];
        for (const it of normalized) {
            const built = await buildInteractionAction(it, helpers);
            if (!built) continue;
            interactions.push(buildInteractionItem(it, built.action, displayMode));
            allLibs.add(built.libName);
        }
        if (droppedOutOfRange > 0) debugLog('InteractiveVideo', `${droppedOutOfRange} interaction(s) hors-durée écartée(s)`);
        // Garde-fou final : re-trier par temps de départ (les positions custom n'altèrent pas l'ordre).
        interactions.sort((a, b) => (a.duration.from - b.duration.from));

        // 2. Piste de sous-titres (si transcription disponible par URL — CORS `*` côté PeerTube).
        const transcript = jsonObj.transcript || {};
        const captionUrl = transcript.captionUrl || null;
        // Sous-titres embarqués UNIQUEMENT si l'enseignant les a activés dans l'éditeur de
        // l'activité (case « Intégrer les sous-titres » cochée → videoSource.showCaptions
        // === true). Par défaut (champ absent) on n'embarque PAS la piste. Ne pas embarquer
        // la piste est le seul moyen fiable de ne pas les afficher au démarrage : H5P
        // sélectionne sinon toujours la 1re piste (cf. audit sous-titres 2026-07).
        const showCaptions = !!(jsonObj.videoSource && jsonObj.videoSource.showCaptions === true);
        const textTracks = (showCaptions && captionUrl)
            ? {
                videoTrack: [{
                    label: translations.h5p_iv_subtitle_label || 'Transcription',
                    kind: 'subtitles',
                    srcLang: transcript.language || 'fr',
                    track: { path: captionUrl, mime: 'text/vtt' }
                }]
            }
            : { videoTrack: [] };

        // 3. Résumé final (optionnel).
        const summary = buildSummary(jsonObj.summary);
        if (summary) allLibs.add('H5P.Summary');

        // 4. Assembler le content.json final.
        const content = {
            // Conservé pour les métadonnées H5P (h5p-creator l'utilise pour h5p.json).
            title: jsonObj.title || '',
            interactiveVideo: {
                video: {
                    files: videoSource.url
                        ? [{ path: videoSource.url, mime: videoSource.mime || 'video/mp4' }]
                        : [],
                    startScreenOptions: {
                        title: jsonObj.title || '',
                        hideStartTitle: false,
                        ...(jsonObj.startScreenOptions || {})
                    },
                    textTracks
                },
                assets: {
                    interactions,
                    bookmarks: Array.isArray(jsonObj.bookmarks) ? structuredClone(jsonObj.bookmarks) : [],
                    endscreens: Array.isArray(jsonObj.endscreens) ? structuredClone(jsonObj.endscreens) : []
                },
                ...(summary ? { summary } : {})
            },
            override: {
                autoplay: false,
                loop: false,
                showSolutionButton: 'on',
                retryButton: 'on',
                showBookmarksmenuOnLoad: false,
                showRewind10: false,
                preventSkippingMode: 'none',
                deactivateSound: false,
                ...(jsonObj.override || {})
            },
            // Libellés d'interface en français (sinon défauts anglais de la lib).
            l10n: buildIvL10n()
        };

        // 5. Dépendances dynamiques (libs réellement utilisées + leurs sous-dépendances).
        const dependencies = [];
        const addedDeps = new Set();
        if (helpers && helpers.getKeyFromLibrary && helpers.getLibraryMetadata) {
            for (const libName of allLibs) {
                const childModuleKey = helpers.getKeyFromLibrary(libName);
                if (!childModuleKey) {
                    debugLog('InteractiveVideo', `Pas de moduleKey pour la librairie : ${libName}`);
                    continue;
                }
                const metadata = helpers.getLibraryMetadata(childModuleKey);
                if (!metadata) continue;
                const depKey = `${metadata.machineName}-${metadata.version.major}.${metadata.version.minor}`;
                if (!addedDeps.has(depKey)) {
                    addedDeps.add(depKey);
                    dependencies.push({
                        machineName: metadata.machineName,
                        majorVersion: metadata.version.major,
                        minorVersion: metadata.version.minor
                    });
                }
                if (metadata.extraDependencies) {
                    for (const extra of metadata.extraDependencies) {
                        const extraKey = `${extra.machineName}-${extra.majorVersion}.${extra.minorVersion}`;
                        if (!addedDeps.has(extraKey)) {
                            addedDeps.add(extraKey);
                            dependencies.push(extra);
                        }
                    }
                }
            }
        }

        // MathDisplay conditionnel (énoncés / réponses contenant du LaTeX).
        const allText = JSON.stringify(interactions) + JSON.stringify(content.interactiveVideo.summary || '');
        if (/\\\(|\\\)|\\\[|\\\]|\$[^$]+\$/.test(allText)) {
            const mathKey = 'H5P.MathDisplay-1.0';
            if (!addedDeps.has(mathKey)) {
                addedDeps.add(mathKey);
                dependencies.push({ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 });
            }
        }

        debugLog('InteractiveVideo', 'Traitement terminé', {
            interactions: interactions.length,
            dependencies: dependencies.length,
            libs: [...allLibs],
            hasSubtitles: !!captionUrl,
            hasSummary: !!summary
        });

        return { content, dependencies };
    }
};
