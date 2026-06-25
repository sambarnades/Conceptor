/**
 * Tests e2e : Vidéo interactive (détection, schéma éditeur, showWhen, healer, processeur)
 *
 * Vérifie :
 * - Détection du type InteractiveVideo (interactions[] + videoSource)
 * - Schéma éditeur : sections general/interactions/summary, champ `timestamp`, options de type
 * - showWhen : champs visibles selon le type (multichoice/truefalse/blanks)
 * - Healer : coercition timestamp (HH:MM:SS), inférence/validation type, correct → booléen, tri
 * - Processeur : intermédiaire → H5P.InteractiveVideo (video par URL, interactions, summary, deps)
 *
 * Usage : ouvrir tests/test-editor-iv.html depuis le serveur local.
 */
import { detectContentType, getSchemaForType } from '../js/editor/content-detector.js';
import { healStructureForActivity } from '../js/h5p/json-healer.js';
import InteractiveVideoProcessor from '../js/h5p/processors/InteractiveVideo.js';
import { isYouTubeSource, ytVideoId, createVideoPlayer } from '../js/ui/sync-video-player.js';

let passCount = 0;
let failCount = 0;
const results = [];
let _group = '';

function assert(condition, message) {
    results.push({ status: condition ? 'PASS' : 'FAIL', message, group: _group });
    if (condition) passCount++; else { failCount++; console.error('FAIL:', _group, '-', message); }
}
function group(name) { _group = name; }

function getVisibleFields(itemSchema, data) {
    const visible = {};
    for (const [key, config] of Object.entries(itemSchema)) {
        if (config.showWhen) {
            const sw = config.showWhen;
            const ref = data[sw.field];
            const ok = sw.values ? sw.values.includes(ref) : ref === sw.value;
            if (!ok) continue;
        }
        visible[key] = config;
    }
    return visible;
}

// Helpers de processeur (mêmes contrats que processors/index.js)
const procHelpers = {
    processChild: async (q) => q, // pas de transformation : on teste la structure du conteneur
    getKeyFromLibrary: (lib) => ({
        'H5P.MultiChoice': 'MultipleChoice', 'H5P.TrueFalse': 'TrueFalse',
        'H5P.Blanks': 'FillInTheBlanks', 'H5P.Summary': 'Summary'
    }[lib]),
    getLibraryMetadata: (k) => ({
        MultipleChoice: { machineName: 'H5P.MultiChoice', version: { major: 1, minor: 16 }, extraDependencies: [{ machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 }] },
        TrueFalse: { machineName: 'H5P.TrueFalse', version: { major: 1, minor: 8 }, extraDependencies: [] },
        FillInTheBlanks: { machineName: 'H5P.Blanks', version: { major: 1, minor: 14 }, extraDependencies: [] },
        Summary: { machineName: 'H5P.Summary', version: { major: 1, minor: 10 }, extraDependencies: [] }
    }[k])
};

export async function runAllTests() {
    // -------------------------------------------------------------------
    group('Détection');
    const sample = {
        title: 'Test', videoSource: { type: 'html5', url: 'https://x/360p.mp4', mime: 'video/mp4' },
        interactions: [{ timestamp: 10, pause: true, type: 'multichoice', question: 'Q', answers: [{ text: 'A', correct: true }] }]
    };
    const det = detectContentType(sample, 'h5p_interactive_video_name');
    assert(det && det.moduleKey === 'InteractiveVideo', 'detectContentType → InteractiveVideo');
    // Sans videoSource mais avec timestamp
    const det2 = detectContentType({ interactions: [{ timestamp: 5, type: 'blanks', text: 'le *mot*' }] }, null);
    assert(det2 && det2.moduleKey === 'InteractiveVideo', 'Détection via timestamp (sans videoSource)');

    // -------------------------------------------------------------------
    group('Schéma éditeur');
    const schema = getSchemaForType('InteractiveVideo');
    assert(!!schema, 'getSchemaForType retourne un schéma');
    const ids = (schema.sections || []).map(s => s.id);
    assert(['general', 'interactions', 'summary'].every(s => ids.includes(s)), 'Sections general/interactions/summary présentes');
    const itemSchema = schema.sections.find(s => s.id === 'interactions').fields.interactions.itemSchema;
    assert(itemSchema.timestamp && itemSchema.timestamp.type === 'timestamp', 'Champ timestamp (type timestamp)');
    const typeVals = itemSchema.type.options.map(o => o.value);
    assert(['multichoice', 'truefalse', 'blanks'].every(v => typeVals.includes(v)), 'Options de type complètes');

    // -------------------------------------------------------------------
    group('showWhen');
    const visMc = getVisibleFields(itemSchema, { type: 'multichoice' });
    assert(visMc.question && visMc.answers && !visMc.correct && !visMc.text, 'multichoice → question+answers, pas correct/text');
    const visTf = getVisibleFields(itemSchema, { type: 'truefalse' });
    assert(visTf.question && visTf.correct && !visTf.answers && !visTf.text, 'truefalse → question+correct, pas answers/text');
    const visBl = getVisibleFields(itemSchema, { type: 'blanks' });
    assert(visBl.text && !visBl.question && !visBl.answers, 'blanks → text seulement');

    // -------------------------------------------------------------------
    group('Healer');
    const healed = healStructureForActivity({
        videoSource: 'https://x/360p.mp4',
        interactions: [
            { time: '02:00', type: 'multichoice', question: 'Q', answers: [{ text: 'A', correct: true }] },
            { at: 30, correct: 'false', question: 'VF' },
            { timestamp: 120, text: 'le *mot*' }
        ],
        summary: { statements: ['seule', ['a', 'b']] }
    }, 'InteractiveVideo');
    assert(healed.videoSource && healed.videoSource.url === 'https://x/360p.mp4', 'videoSource string → objet');
    assert(healed.interactions[0].timestamp === 30, 'Tri par timestamp (truefalse@30 en tête)');
    assert(healed.interactions.find(i => i.type === 'multichoice').timestamp === 120, 'Coercition "02:00" → 120s');
    assert(healed.interactions.find(i => i.type === 'truefalse').correct === false, 'correct "false" → booléen false');
    assert(healed.summary.statements.every(g => Array.isArray(g)), 'summary.statements normalisé en tableaux');

    // -------------------------------------------------------------------
    group('Processeur');
    const out = await InteractiveVideoProcessor.process(healed, procHelpers);
    const iv = out.content.interactiveVideo;
    assert(iv && iv.video.files[0].path === 'https://x/360p.mp4', 'Vidéo référencée par URL (non bundlée)');
    assert(iv.video.files[0].mime === 'video/mp4', 'mime video/mp4');
    assert(Array.isArray(iv.assets.interactions) && iv.assets.interactions.length === 3, '3 interactions construites');
    const first = iv.assets.interactions[0];
    assert(first.action && first.action.library && first.duration && typeof first.duration.from === 'number', 'Interaction : action.library + duration.from');
    const tf = iv.assets.interactions.find(x => x.action.library.startsWith('H5P.TrueFalse'));
    assert(tf && tf.action.params.correct === 'false', 'TrueFalse correct → string "false"');
    assert(iv.summary && iv.summary.task.library === 'H5P.Summary 1.10' && iv.summary.displayAt === 3, 'Résumé H5P.Summary 1.10 + displayAt');
    const depNames = out.dependencies.map(d => d.machineName);
    assert(depNames.includes('H5P.MultiChoice') && depNames.includes('H5P.TrueFalse') && depNames.includes('H5P.Blanks'), 'Dépendances dynamiques des types utilisés');

    // -------------------------------------------------------------------
    group('Schéma : apparence & adaptativité');
    assert(itemSchema.appearance && itemSchema.appearance.type === 'fieldGroup', 'Groupe « apparence » (fieldGroup)');
    const appF = itemSchema.appearance.fields;
    assert(appF.display && appF.display.default === 'button', 'display : défaut button');
    assert(appF.placement && appF.placement.default === 'center', 'placement : défaut center');
    const placeVals = appF.placement.options.map(o => o.value);
    assert(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom', 'full', 'custom'].every(v => placeVals.includes(v)), 'placement : 8 options');
    // showWhen intra-groupe : coordonnées seulement si placement custom
    const visCustom = getVisibleFields(appF, { placement: 'custom', display: 'button' });
    assert(visCustom.x && visCustom.y && visCustom.width && visCustom.height, 'custom → x/y/width/height visibles');
    const visPreset = getVisibleFields(appF, { placement: 'center', display: 'button' });
    assert(!visPreset.x && !visPreset.y, 'preset → coordonnées masquées');
    // label/visibleDuration/buttonOnMobile seulement si display button
    const visPoster = getVisibleFields(appF, { placement: 'center', display: 'poster' });
    assert(!visPoster.label && !visPoster.buttonOnMobile && !visPoster.visibleDuration, 'poster → label/mobile/durée masqués');
    assert(itemSchema.adaptivity && itemSchema.adaptivity.type === 'fieldGroup', 'Groupe « adaptativité » (fieldGroup)');
    const adaptF = itemSchema.adaptivity.fields;
    assert(adaptF.requireCompletion && adaptF.correctSeekTo && adaptF.wrongSeekTo, 'adaptativité : requireCompletion + seekTo correct/wrong');

    // -------------------------------------------------------------------
    group('Processeur : positionnement & options');
    const posOut = await InteractiveVideoProcessor.process({
        title: 'P', videoSource: { url: 'https://x/v.mp4', mime: 'video/mp4' },
        interactions: [
            { timestamp: 5, type: 'multichoice', question: 'A', answers: [{ text: 'x', correct: true }] }, // défaut → center/button
            { timestamp: 10, type: 'truefalse', question: 'B', correct: true, display: 'poster', placement: 'bottom' },
            { timestamp: 15, type: 'blanks', text: 'le *m*', placement: 'custom', x: 60, y: 10, width: 35, height: 30, visibleDuration: 4, label: 'Quiz', buttonOnMobile: true, requireCompletion: true, wrongSeekTo: 8, wrongMessage: 'Revois' }
        ]
    }, procHelpers);
    const its = posOut.content.interactiveVideo.assets.interactions;
    // 1) défaut : button + preset center + pas d'adaptivity + fenêtre 2s
    const d0 = its[0];
    assert(d0.displayType === 'button', 'défaut → displayType button');
    assert(d0.x === 45 && d0.y === 32 && d0.width === 40 && d0.height === 30, 'défaut → preset center (45/32/40/30)');
    assert(d0.adaptivity === undefined, 'défaut → pas de bloc adaptivity');
    assert(d0.duration.to - d0.duration.from === 2, 'défaut → fenêtre 2s');
    // 2) poster + preset bottom
    const d1 = its[1];
    assert(d1.displayType === 'poster', 'display:poster → displayType poster');
    assert(d1.x === 5 && d1.y === 65 && d1.width === 90 && d1.height === 30, 'preset bottom appliqué');
    assert(d1.label === '', 'poster → label vidé');
    // 3) custom + options + adaptivity
    const d2 = its[2];
    assert(d2.x === 60 && d2.y === 10 && d2.width === 35 && d2.height === 30, 'custom → coordonnées propres');
    assert(d2.buttonOnMobile === true, 'buttonOnMobile transmis');
    assert(d2.duration.to - d2.duration.from === 4, 'visibleDuration → fenêtre 4s');
    assert(d2.adaptivity && d2.adaptivity.requireCompletion === true, 'adaptivity.requireCompletion');
    assert(d2.adaptivity.wrong && d2.adaptivity.wrong.seekTo === 8, 'adaptivity.wrong.seekTo');
    assert(typeof d2.label === 'string' && d2.label.includes('Quiz'), 'label transmis (mode button)');
    // 4) clamp des coordonnées custom hors bornes
    const clampOut = await InteractiveVideoProcessor.process({
        videoSource: { url: 'https://x/v.mp4' },
        interactions: [{ timestamp: 1, type: 'multichoice', question: 'Q', answers: [{ text: 'a', correct: true }], placement: 'custom', x: 999, y: -5 }]
    }, procHelpers);
    const c0 = clampOut.content.interactiveVideo.assets.interactions[0];
    assert(c0.x === 100 && c0.y === 0, 'custom hors bornes → clampé 0..100');

    // -------------------------------------------------------------------
    // Routage de source du lecteur de l'éditeur Vidéo interactive (mode Live) :
    // YouTube → embed iframe ; Tube apps.education (PeerTube) / PodEduc → <video> natif.
    group('Routage source (lecteur Live)');
    assert(isYouTubeSource({ url: 'https://www.youtube.com/watch?v=cvlZD3wK7JM', mime: 'video/YouTube' }) === true, 'YouTube watch?v= → embed');
    assert(isYouTubeSource({ url: 'https://youtu.be/cvlZD3wK7JM' }) === true, 'youtu.be → embed (déduit de l\'URL, sans mime)');
    assert(ytVideoId('https://www.youtube.com/watch?v=cvlZD3wK7JM') === 'cvlZD3wK7JM', 'ytVideoId extrait l\'identifiant');
    assert(isYouTubeSource({ url: 'https://tube-numerique-educatif.apps.education.fr/static/streaming-playlists/hls/abc/vid-fragmented.mp4', mime: 'video/mp4' }) === false, 'Tube apps.education (PeerTube) mp4 → <video> (pas embed)');
    assert(isYouTubeSource({ url: 'https://podeduc.apps.education.fr/media/videos/HASH/123/360p.mp4', mime: 'video/mp4' }) === false, 'PodEduc mp4 → <video> (pas embed)');
    assert(isYouTubeSource({ url: 'https://tube-numerique-educatif.apps.education.fr/static/streaming-playlists/hls/abc/master.m3u8', mime: 'application/x-mpegURL' }) === false, 'HLS m3u8 → <video> (pas embed)');

    // -------------------------------------------------------------------
    // Lecteur (DOM) : une source mp4 (PeerTube/PodEduc) crée un <video> natif référencé par URL,
    // avec l'API attendue (getCurrentTime/getDuration/seekTo/destroy). Pas de réseau : l'élément est
    // créé de façon synchrone (la lecture réelle dépend de l'hôte). On évite YouTube ici (injecte l'API
    // externe) — couvert par isYouTubeSource ci-dessus.
    if (typeof document !== 'undefined') {
        group('Lecteur éditeur (DOM)');
        const mount = document.createElement('div');
        const url = 'https://podeduc.apps.education.fr/media/videos/HASH/123/360p.mp4';
        const player = createVideoPlayer(mount, { url, mime: 'video/mp4' });
        const vid = mount.querySelector('video');
        assert(!!vid && player.isYouTube === false, 'mp4 PodEduc → <video> créé, isYouTube=false');
        assert(vid && vid.getAttribute('src') === url, 'src = URL fournie (vidéo référencée, non bundlée)');
        assert(['getCurrentTime', 'getDuration', 'seekTo', 'destroy'].every(m => typeof player[m] === 'function'), 'API exposée : getCurrentTime/getDuration/seekTo/destroy');
        player.destroy();
        assert(true, 'destroy() sans exception');
    }

    return { passCount, failCount, results };
}
