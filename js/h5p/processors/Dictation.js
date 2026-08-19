/**
 * Processeur H5P — Dictée (H5P.Dictation)
 *
 * L'élève écoute chaque phrase (audio) puis tape ce qu'il entend ; H5P compare à la
 * solution et surligne fautes/typos.
 *
 * Particularité : le LLM ne produit QUE le texte ({taskDescription, sentences:[{text,
 * description?}]}). Les fichiers audio (`sample`, et `sampleAlternative` en débit lent)
 * sont SYNTHÉTISÉS ici via le service TTS serveur (services/tts.js, PRD_DICTATION §4),
 * enregistrés dans le registre média (image-manager) puis embarqués dans le .h5p par
 * h5p-creator (chemins `audios/…`).
 *
 * Chemins audio DÉTERMINISTES (hash de lang|voice|slow|texte) : une phrase inchangée garde
 * son chemin → à la régénération après édition, le MP3 d'origine du .h5p est recopié tel
 * quel (regenerateH5PFile) et seules les phrases modifiées sont re-synthétisées.
 *
 * Un audio téléversé MANUELLEMENT dans l'éditeur (chemin non `audios/dictation-*`) n'est
 * JAMAIS écrasé par la synthèse.
 *
 * Réglages TTS portés par le JSON (édités par le panneau réglages de l'éditeur, Caramel) :
 *   jsonObj.tts = { lang: 'fr'…'el' (défaut : langue UI), voice: 'female'|'male',
 *                   slow: true|false (piste « lecture lente » sampleAlternative) }
 *
 * @module processors/Dictation
 * @exports {Object} default.process - Transformation principale (async : synthèse TTS)
 */
import { translations, currentLang } from '../../core/translation.js';
import { formatTextToHtml, debugLog, showNotification } from '../../core/utils.js';
import { synthesizeSentences, ttsAudioPath, TTS_LANGS } from '../../services/tts.js';
import { registerMedia, buildMediaStructure } from '../image-manager.js';

/** Un chemin audio produit par la synthèse Caramel (≠ téléversement manuel). */
const TTS_PATH_RE = /^audios\/dictation-[0-9a-f]{8}\.mp3$/;

/**
 * Nettoie un texte de phrase : la solution d'une dictée est du TEXTE BRUT strict
 * (comparée mot à mot à la saisie de l'élève ET lue par la synthèse vocale). On retire
 * les résidus de formatage qu'un LLM peut laisser malgré le prompt (balises HTML,
 * gras/italique Markdown), sans JAMAIS toucher aux accents, à la casse ni à la
 * ponctuation (le healer garantit déjà l'absence de LaTeX via render 'unicode').
 * @param {string} text
 * @returns {string}
 */
function cleanSentenceText(text) {
    return String(text)
        .replace(/<[^>]+>/g, ' ')                 // balises HTML (<p>, <strong>…)
        .replace(/\*\*([^*]+)\*\*/g, '$1')        // **gras** Markdown
        .replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|[.,;:!?]|$)/g, '$1$2') // *italique* (préserve « | » des variantes)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Normalise un champ `sample`/`sampleAlternative` quelle que soit sa provenance :
 * tableau H5P [{path,mime,…}] (content.json rechargé), objet éditeur {path,mime,kind,dataURL},
 * ou absent. Renvoie { path, mime } ou null.
 */
function readSample(value) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && typeof v.path === 'string' && v.path.trim()) {
        return { path: v.path.trim(), mime: v.mime || 'audio/mpeg' };
    }
    return null;
}

/** Champ audio H5P.Dictation (semantics `type:"audio"` → tableau de fichiers). */
function toH5PAudio(path, mime = 'audio/mpeg') {
    return [{ path, mime, copyright: { license: 'U' } }];
}

/**
 * Enregistre un blob TTS dans le registre média sous son chemin déterministe.
 * @param {string} id - Identifiant registre (chemin JSON du champ).
 * @param {{blob:Blob, mime:string, h5pPath:string}} audio
 */
function registerTtsBlob(id, audio) {
    registerMedia(id, {
        id: '',
        h5pPath: audio.h5pPath,
        blob: audio.blob,
        dataURL: URL.createObjectURL(audio.blob),
        mime: audio.mime || 'audio/mpeg',
        kind: 'audio',
        originalSize: audio.blob.size,
        compressedSize: audio.blob.size
    });
}

export default {
    process: async (jsonObj) => {
        // ── 1. Validation du contenu ────────────────────────────────────────
        const rawSentences = Array.isArray(jsonObj.sentences) ? jsonObj.sentences : [];
        const sentences = rawSentences
            .map(s => (typeof s === 'string' ? { text: s } : (s || {})))
            .map(s => (typeof s.text === 'string' ? { ...s, text: cleanSentenceText(s.text) } : s))
            .filter(s => typeof s.text === 'string' && s.text.length > 0);
        if (sentences.length === 0) {
            throw new Error('Dictation : aucune phrase valide (sentences[].text manquant).');
        }

        // ── 2. Réglages TTS (panneau réglages de l'éditeur / défauts) ──────
        const tts = jsonObj.tts || {};
        const lang = TTS_LANGS.includes(tts.lang) ? tts.lang : (TTS_LANGS.includes(currentLang) ? currentLang : 'fr');
        const voice = (tts.voice === 'male') ? 'male' : 'female';
        // Piste « lecture lente » : activée par défaut à la CRÉATION. Si `tts` est absent
        // (content.json rechargé, qui ne porte pas ce champ), on INFÈRE depuis le fichier :
        // des phrases déjà sonorisées SANS piste lente → l'auteur l'avait désactivée, ne pas
        // en synthétiser une nouvelle (sinon appel réseau + piste indésirable au re-package).
        const hasAnySample = sentences.some(s => readSample(s.sample));
        const hasAnyAlternative = sentences.some(s => readSample(s.sampleAlternative));
        const slow = (tts.slow !== undefined)
            ? (tts.slow !== false)
            : (hasAnySample ? hasAnyAlternative : true);

        // ── 3. Synthèse : uniquement les phrases SANS audio manuel ─────────
        // Index des phrases à synthétiser (audio absent OU déjà issu de la synthèse — un
        // chemin dictation-<hash> obsolète est re-dérivé du texte/réglages courants).
        const toSynth = [];
        for (let i = 0; i < sentences.length; i++) {
            const manual = readSample(sentences[i].sample);
            if (!manual || TTS_PATH_RE.test(manual.path)) toSynth.push(i);
        }

        let genderFallback = false;
        if (toSynth.length > 0) {
            const texts = toSynth.map(i => sentences[i].text.trim());

            // Piste normale (obligatoire pour jouer).
            const normal = await synthesizeSentences(texts, { lang, voice, slow: false });
            if (normal.error) {
                debugLog('Dictation', 'synthèse TTS en échec', normal.error);
                const err = new Error(translations.error_dictation_tts_failed
                    || `La synthèse vocale a échoué (${normal.error}). Vérifiez la connexion puis relancez la création.`);
                err.ttsError = normal.error;
                throw err;
            }
            genderFallback = genderFallback || !!normal.genderFallback;
            toSynth.forEach((sentIdx, j) => {
                const audio = normal.audios[j];
                registerTtsBlob(`Dictation.sentences.${sentIdx}.sample`, audio);
                sentences[sentIdx]._sampleResolved = { path: audio.h5pPath, mime: audio.mime };
            });

            // Piste lente (optionnelle) — best-effort : son échec ne bloque pas la dictée.
            if (slow) {
                const slowRes = await synthesizeSentences(texts, { lang, voice, slow: true });
                if (!slowRes.error) {
                    genderFallback = genderFallback || !!slowRes.genderFallback;
                    toSynth.forEach((sentIdx, j) => {
                        const audio = slowRes.audios[j];
                        registerTtsBlob(`Dictation.sentences.${sentIdx}.sampleAlternative`, audio);
                        sentences[sentIdx]._sampleAlternativeResolved = { path: audio.h5pPath, mime: audio.mime };
                    });
                } else {
                    debugLog('Dictation', 'piste lente en échec (ignorée)', slowRes.error);
                }
            }
        }

        // Repli de genre signalé par le serveur (langue à voix unique, ex. ar) → informer.
        if (genderFallback) {
            showNotification(translations.h5p_dictation_gender_fallback
                || 'La voix demandée n\'existe pas dans cette langue : l\'autre voix a été utilisée.', 'info');
        }

        // ── 4. Construction des phrases H5P ─────────────────────────────────
        const h5pSentences = sentences.map(s => {
            const manual = readSample(s.sample);
            const manualAlt = readSample(s.sampleAlternative);
            const sample = s._sampleResolved
                ? toH5PAudio(s._sampleResolved.path, s._sampleResolved.mime)
                : (manual ? toH5PAudio(manual.path, manual.mime) : undefined);
            const sampleAlternative = s._sampleAlternativeResolved
                ? toH5PAudio(s._sampleAlternativeResolved.path, s._sampleAlternativeResolved.mime)
                : (manualAlt && !TTS_PATH_RE.test(manualAlt.path) ? toH5PAudio(manualAlt.path, manualAlt.mime) : undefined);
            return {
                ...(s.description && String(s.description).trim() ? { description: String(s.description).trim() } : {}),
                ...(sample ? { sample } : {}),
                ...(sampleAlternative ? { sampleAlternative } : {}),
                text: s.text.trim()
            };
        });

        // ── 5. Feedback global (barème par plages de score) ────────────────
        const overallFeedback = (Array.isArray(jsonObj.overallFeedback) && jsonObj.overallFeedback.length > 0)
            ? jsonObj.overallFeedback.map(r => ({
                from: Number(r.from) || 0,
                to: (r.to != null) ? Number(r.to) : 100,
                ...(r.feedback ? { feedback: r.feedback } : {})
            }))
            : [{ from: 0, to: 100 }];

        // ── 6. content.json final (behaviour imbriqué selon semantics 1.3) ──
        // Accepte les DEUX formes d'entrée : plate (LLM/exemples) ou déjà imbriquée
        // (content.json rechargé / denormalizeDataForSave de l'éditeur).
        const raw = jsonObj.behaviour || {};
        const b = { ...raw, ...(raw.scoring || {}), ...(raw.textual || {}), ...(raw.feedbackPresentation || {}) };
        return {
            title: jsonObj.title || translations.h5p_dictation_name || 'Dictée',
            // Bloc « Média » (illustration au-dessus de la consigne) : image téléversée dans
            // l'éditeur (mediaImage, patron « media context » comme Choix multiples) ; sinon
            // un media déjà présent (content.json rechargé) est conservé tel quel ; sinon la
            // valeur par défaut d'Éléa/Lumi (parité de ré-enregistrement, 2026-07).
            media: (jsonObj.mediaImage && jsonObj.mediaImage.path)
                ? buildMediaStructure(jsonObj.mediaImage, jsonObj.mediaImageAlt)
                : ((jsonObj.media && typeof jsonObj.media === 'object') ? jsonObj.media : { disableImageZooming: false }),
            taskDescription: formatTextToHtml(jsonObj.taskDescription
                || translations.h5p_dictation_default_task || 'Écoutez attentivement puis écrivez ce que vous entendez.'),
            sentences: h5pSentences,
            overallFeedback,
            // Réglages TTS conservés dans le JSON ORIGINAL uniquement (pas de champ `tts`
            // dans le content.json : semantics ne le connaît pas et H5P l'ignorerait).
            behaviour: {
                ...(b.tries != null ? { tries: Number(b.tries) } : {}),
                ...(b.triesAlternative != null ? { triesAlternative: Number(b.triesAlternative) } : {}),
                disablePause: b.disablePause === true,
                ...(b.playButtonDelay != null ? { playButtonDelay: Number(b.playButtonDelay) } : {}),
                shuffleSentences: ['never', 'once', 'onRetry'].includes(b.shuffleSentences) ? b.shuffleSentences : 'never',
                scoring: {
                    ignorePunctuation: b.ignorePunctuation !== false,
                    zeroMistakeMode: b.zeroMistakeMode === true,
                    typoFactor: ['100', '50', '0'].includes(String(b.typoFactor)) ? String(b.typoFactor) : '50'
                },
                textual: {
                    wordSeparator: b.wordSeparator || ' ',
                    overrideRTL: ['auto', 'on', 'off'].includes(b.overrideRTL) ? b.overrideRTL : 'auto',
                    autosplit: b.autosplit !== false
                },
                feedbackPresentation: {
                    customTypoDisplay: b.customTypoDisplay === true,
                    alternateSolution: (b.alternateSolution === 'all') ? 'all' : 'first'
                },
                enableRetry: b.enableRetry !== false,
                enableSolutionsButton: b.enableSolutionsButton !== false,
                enableSolutionOnCheck: b.enableSolutionOnCheck === true
            },
            // Libellés UI dans la langue courante (robustesse preview + Éléa).
            l10n: {
                generalFeedback: translations.h5p_dictation_general_feedback || 'Vous avez fait @total faute(s).',
                generalFeedbackZeroMistakesMode: translations.h5p_dictation_general_feedback_zero || 'Vous avez écrit @total mot(s) correctement et @typo mot(s) avec de petites erreurs.',
                checkAnswer: translations.h5p_check_answer || 'Vérifier',
                submitAnswer: translations.h5p_submit_answer || 'Envoyer',
                tryAgain: translations.h5p_try_again || 'Recommencer',
                showSolution: translations.h5p_show_solution || 'Voir la solution',
                audioNotSupported: translations.h5p_dictation_audio_not_supported || 'Votre navigateur ne supporte pas ce fichier audio.'
            },
            a11y: {
                check: translations.h5p_dictation_a11y_check || 'Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou sans réponse.',
                showSolution: translations.h5p_dictation_a11y_show_solution || 'Afficher la solution. La tâche sera marquée avec sa solution correcte.',
                retry: translations.h5p_dictation_a11y_retry || 'Recommencer la tâche. Toutes les réponses seront réinitialisées.',
                play: translations.h5p_dictation_a11y_play || 'Écouter',
                playSlowly: translations.h5p_dictation_a11y_play_slowly || 'Écouter lentement',
                triesLeft: translations.h5p_dictation_a11y_tries_left || 'Nombre d\'écoutes restantes : @number',
                infinite: translations.h5p_dictation_a11y_infinite || 'illimité',
                enterText: translations.h5p_dictation_a11y_enter_text || 'Écrivez ce que vous entendez.',
                yourResult: translations.h5p_dictation_a11y_your_result || 'Vous avez obtenu @score points sur @total',
                solution: translations.h5p_dictation_a11y_solution || 'Solution',
                sentence: translations.h5p_dictation_a11y_sentence || 'Phrase',
                item: translations.h5p_dictation_a11y_item || 'Élément',
                correct: translations.h5p_dictation_a11y_correct || 'correct',
                wrong: translations.h5p_dictation_a11y_wrong || 'faux',
                typo: translations.h5p_dictation_a11y_typo || 'petite erreur',
                missing: translations.h5p_dictation_a11y_missing || 'manquant',
                added: translations.h5p_dictation_a11y_added || 'ajouté',
                shouldHaveBeen: translations.h5p_dictation_a11y_should_have_been || 'La bonne réponse était',
                or: translations.h5p_dictation_a11y_or || 'ou',
                point: translations.h5p_dictation_a11y_point || 'point',
                points: translations.h5p_dictation_a11y_points || 'points',
                period: translations.h5p_dictation_a11y_period || 'point',
                exclamationPoint: translations.h5p_dictation_a11y_exclamation_point || 'point d\'exclamation',
                questionMark: translations.h5p_dictation_a11y_question_mark || 'point d\'interrogation',
                comma: translations.h5p_dictation_a11y_comma || 'virgule',
                singleQuote: translations.h5p_dictation_a11y_single_quote || 'apostrophe',
                doubleQuote: translations.h5p_dictation_a11y_double_quote || 'guillemets',
                colon: translations.h5p_dictation_a11y_colon || 'deux-points',
                semicolon: translations.h5p_dictation_a11y_semicolon || 'point-virgule',
                plus: translations.h5p_dictation_a11y_plus || 'plus',
                minus: translations.h5p_dictation_a11y_minus || 'moins',
                asterisk: translations.h5p_dictation_a11y_asterisk || 'astérisque',
                forwardSlash: translations.h5p_dictation_a11y_forward_slash || 'barre oblique'
            }
        };
    }
};
