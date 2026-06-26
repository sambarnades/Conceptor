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

// Position/dimensions par défaut du bouton d'interaction (pourcentages, cf. semantics IV).
const DEFAULT_POS = { x: 45, y: 32, width: 40, height: 30 };
// Fenêtre d'affichage du bouton (secondes). Courte : comme la vidéo se met en pause au
// `timestamp`, le bouton est visible pendant la pause ; une fenêtre courte évite qu'il
// « traîne » à l'écran une fois la question passée et la lecture reprise.
const BUTTON_VISIBLE_S = 2;

// Positions prédéfinies (presets) → coordonnées en % du cadre vidéo. Pour `displayType:'button'`,
// seuls x/y positionnent l'icône (width/height ignorés par H5P) ; pour `'poster'`, tout le rectangle
// compte (le contenu s'affiche directement sur la vidéo). `center` reprend le défaut historique
// (`DEFAULT_POS`) → le contenu déjà généré (sans champ placement) reste positionné à l'identique.
const PLACEMENTS = {
    'center':       { x: 45, y: 32, width: 40, height: 30 },
    'top-left':     { x: 2,  y: 2,  width: 40, height: 35 },
    'top-right':    { x: 58, y: 2,  width: 40, height: 35 },
    'bottom-left':  { x: 2,  y: 63, width: 40, height: 35 },
    'bottom-right': { x: 58, y: 63, width: 40, height: 35 },
    'bottom':       { x: 5,  y: 65, width: 90, height: 30 },
    'full':         { x: 5,  y: 5,  width: 90, height: 90 }
};

// Borne une valeur en pourcentage [0..100] ; repli sur `dflt` si non numérique.
const clampPct = (v, dflt) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : dflt;
};

/**
 * Résout la position d'une interaction : coordonnées libres si `placement:'custom'`,
 * sinon preset nommé, sinon repli sur le défaut historique.
 * @param {Object} it - L'interaction simplifiée.
 * @returns {{x:number,y:number,width:number,height:number}}
 */
function resolvePosition(it) {
    if (it.placement === 'custom') {
        return {
            x: clampPct(it.x, DEFAULT_POS.x),
            y: clampPct(it.y, DEFAULT_POS.y),
            width: clampPct(it.width, DEFAULT_POS.width),
            height: clampPct(it.height, DEFAULT_POS.height)
        };
    }
    return PLACEMENTS[it.placement] || DEFAULT_POS;
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

// Localisation française des libellés d'interface de H5P.InteractiveVideo (le fichier de langue
// de la lib ne traduit pas le groupe l10n → sans ça, « Open summary dialog », « Play », etc.
// s'affichent en anglais, en preview ET dans Lumi/Éléa). Injecté dans content.l10n.
const IV_L10N_FR = {
    interaction: 'Interaction',
    play: 'Lecture',
    pause: 'Pause',
    mute: 'Couper le son',
    unmute: 'Activer le son',
    quality: 'Qualité de la vidéo',
    captions: 'Sous-titres',
    close: 'Fermer',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    summary: 'Ouvrir le résumé',
    bookmarks: 'Signets',
    endscreen: 'Écran de soumission',
    defaultAdaptivitySeekLabel: 'Continuer',
    continueWithVideo: 'Continuer la vidéo',
    more: 'Plus d’options',
    playbackRate: 'Vitesse de lecture',
    rewind10: 'Reculer de 10 secondes',
    navDisabled: 'La navigation est désactivée',
    navForwardDisabled: 'La navigation en avant est désactivée',
    sndDisabled: 'Le son est désactivé',
    requiresCompletionWarning: 'Vous devez répondre correctement à toutes les questions avant de continuer.',
    back: 'Retour',
    hours: 'Heures',
    minutes: 'Minutes',
    seconds: 'Secondes',
    currentTime: 'Temps actuel :',
    totalTime: 'Durée totale :',
    singleInteractionAnnouncement: 'Une interaction est apparue :',
    multipleInteractionsAnnouncement: 'Plusieurs interactions sont apparues.',
    videoPausedAnnouncement: 'La vidéo est en pause',
    content: 'Contenu',
    answered: '@answered répondue(s)',
    endcardTitle: '@answered question(s) répondue(s)',
    endcardInformation: 'Vous avez répondu à @answered questions, cliquez ci-dessous pour soumettre vos réponses.',
    endcardInformationOnSubmitButtonDisabled: 'Vous avez répondu à @answered questions.',
    endcardInformationNoAnswers: 'Vous n’avez répondu à aucune question.',
    endcardInformationMustHaveAnswer: 'Vous devez répondre à au moins une question avant de pouvoir soumettre vos réponses.',
    endcardSubmitButton: 'Soumettre les réponses',
    endcardSubmitMessage: 'Vos réponses ont été soumises !',
    endcardTableRowAnswered: 'Questions répondues',
    endcardTableRowScore: 'Score',
    endcardAnsweredScore: 'répondue',
    endCardTableRowSummaryWithScore: 'Vous avez obtenu @score sur @total points pour la @question apparue après @minutes minutes et @seconds secondes.',
    endCardTableRowSummaryWithoutScore: 'Vous avez répondu à la @question apparue après @minutes minutes et @seconds secondes.',
    videoProgressBar: 'Progression de la vidéo',
    howToCreateInteractions: 'Lancez la vidéo pour commencer à créer des interactions'
};

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
function buildInteractionItem(it, action) {
    const from = Math.max(0, Number(it.timestamp) || 0);
    const visible = Number(it.visibleDuration);
    const to = from + (Number.isFinite(visible) && visible > 0 ? visible : BUTTON_VISIBLE_S);

    const pos = resolvePosition(it);
    // `poster` = contenu affiché directement sur la vidéo (apparition auto à la pause) ;
    // `button` (défaut) = icône discrète, la question s'ouvre au clic.
    const displayType = it.display === 'poster' ? 'poster' : 'button';

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
                intro: formatTextToHtml(summary.intro || (translations.h5p_iv_summary_intro || 'Choisis la bonne affirmation :')),
                summaries,
                overallFeedback: [{ from: 0, to: 100, feedback: '' }],
                solvedLabel: translations.h5p_iv_summary_solved || 'Progression :',
                scoreLabel: translations.h5p_iv_summary_score || 'Mauvaises réponses :',
                resultLabel: translations.h5p_iv_summary_result || 'Votre résultat',
                labelCorrect: translations.h5p_iv_summary_correct || 'Correct.',
                labelIncorrect: translations.h5p_iv_summary_incorrect || 'Incorrect !'
            }
        },
        displayAt: 3
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
        debugLog('InteractiveVideo', 'Début du traitement', {
            interactions: jsonObj.interactions?.length,
            hasVideo: !!jsonObj.videoSource
        });

        // Healing LaTeX nu local (réutilisé de CoursePresentation).
        const rawInteractions = healSlidesLatex(Array.isArray(jsonObj.interactions) ? jsonObj.interactions : []);
        const videoSource = jsonObj.videoSource || {};
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
        const interactions = [];
        for (const it of normalized) {
            const built = await buildInteractionAction(it, helpers);
            if (!built) continue;
            interactions.push(buildInteractionItem(it, built.action));
            allLibs.add(built.libName);
        }
        if (droppedOutOfRange > 0) debugLog('InteractiveVideo', `${droppedOutOfRange} interaction(s) hors-durée écartée(s)`);
        // Garde-fou final : re-trier par temps de départ (les positions custom n'altèrent pas l'ordre).
        interactions.sort((a, b) => (a.duration.from - b.duration.from));

        // 2. Piste de sous-titres (si transcription disponible par URL — CORS `*` côté PeerTube).
        const transcript = jsonObj.transcript || {};
        const captionUrl = transcript.captionUrl || null;
        const textTracks = captionUrl
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
                        hideStartTitle: false
                    },
                    textTracks
                },
                assets: {
                    interactions,
                    bookmarks: [],
                    endscreens: []
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
                deactivateSound: false
            },
            // Libellés d'interface en français (sinon défauts anglais de la lib).
            l10n: IV_L10N_FR
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
