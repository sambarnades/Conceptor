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
import { getMedia, unregisterMedia } from '../js/h5p/image-manager.js';
import { isYouTubeSource, ytVideoId, createVideoPlayer } from '../js/ui/sync-video-player.js';
import { detectPlatform, isPeerTube, collectRenditions, pickPlayableRendition, albertCandidates, detectVideo } from '../js/services/video-transcript.js';
import { matchesShowWhen } from '../js/editor/json-utils.js';
import { clearGeneratedJson, videoLinkChanged } from '../js/ui/ui.js';

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
    // Défaut inversé en 2026-08 : la question s'affiche d'elle-même sur la vidéo (poster),
    // le bouton reste choisissable question par question.
    assert(appF.display && appF.display.default === 'poster', 'display : défaut poster (affichage direct)');
    assert(appF.display.options.map(o => o.value).join(',') === 'poster,button', 'display : le défaut est proposé en tête');
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
    // Le placement n'a aucun effet sur un poster (plein cadre imposé par le lecteur) : ne pas
    // l'offrir, plutôt que de proposer un réglage sans conséquence.
    assert(!visPoster.placement, 'poster → « placement » masqué (sans effet sur un plein cadre)');
    assert(!!visPreset.placement, 'bouton → « placement » proposé');
    assert(itemSchema.adaptivity && itemSchema.adaptivity.type === 'fieldGroup', 'Groupe « adaptativité » (fieldGroup)');
    const adaptF = itemSchema.adaptivity.fields;
    assert(adaptF.requireCompletion && adaptF.correctSeekTo && adaptF.wrongSeekTo, 'adaptativité : requireCompletion + seekTo correct/wrong');

    // -------------------------------------------------------------------
    group('Processeur : positionnement & options');
    const posOut = await InteractiveVideoProcessor.process({
        title: 'P', videoSource: { url: 'https://x/v.mp4', mime: 'video/mp4' },
        interactions: [
            { timestamp: 5, type: 'multichoice', question: 'A', answers: [{ text: 'x', correct: true }] }, // défaut → poster centré agrandi
            { timestamp: 10, type: 'truefalse', question: 'B', correct: true, display: 'poster', placement: 'bottom' },
            { timestamp: 15, type: 'blanks', text: 'le *m*', display: 'button', placement: 'custom', x: 60, y: 10, width: 35, height: 30, visibleDuration: 4, label: 'Quiz', buttonOnMobile: true, requireCompletion: true, wrongSeekTo: 8, wrongMessage: 'Revois' },
            { timestamp: 20, type: 'truefalse', question: 'C', correct: true, display: 'button' } // bouton sans placement
        ]
    }, procHelpers);
    const its = posOut.content.interactiveVideo.assets.interactions;
    // 1) défaut : la question s'affiche sur la vidéo, en PLEIN CADRE — c'est la seule chose que
    //    sache faire le lecteur pour un poster (mesuré sur 4 géométries, cf. le processeur).
    const d0 = its[0];
    assert(d0.displayType === 'poster', 'défaut → displayType poster (affichage direct, sans clic)');
    assert(d0.x === 0 && d0.y === 0 && d0.width === 100 && d0.height === 100, 'poster → plein cadre (0/0/100/100)');
    assert(d0.adaptivity === undefined, 'défaut → pas de bloc adaptivity');
    assert(d0.duration.to - d0.duration.from === 2, 'défaut → fenêtre 2s');
    // 2) poster : le placement demandé est SANS EFFET côté lecteur → on stocke le plein cadre
    //    plutôt que des coordonnées décoratives (`bottom` ici).
    const d1 = its[1];
    assert(d1.displayType === 'poster', 'display:poster → displayType poster');
    assert(d1.x === 0 && d1.y === 0 && d1.width === 100 && d1.height === 100, 'poster + preset bottom → plein cadre quand même');
    assert(d1.label === '', 'poster → label vidé');
    // 3) custom + options + adaptivity
    const d2 = its[2];
    assert(d2.x === 60 && d2.y === 10 && d2.width === 35 && d2.height === 30, 'custom → coordonnées propres');
    assert(d2.buttonOnMobile === true, 'buttonOnMobile transmis');
    assert(d2.duration.to - d2.duration.from === 4, 'visibleDuration → fenêtre 4s');
    assert(d2.adaptivity && d2.adaptivity.requireCompletion === true, 'adaptivity.requireCompletion');
    assert(d2.adaptivity.wrong && d2.adaptivity.wrong.seekTo === 8, 'adaptivity.wrong.seekTo');
    assert(typeof d2.label === 'string' && d2.label.includes('Quiz'), 'label transmis (mode button)');
    // 4) NON-RÉGRESSION du mode bouton : la position historique de l'icône est intacte
    //    (le contenu déjà produit ne doit pas voir ses boutons se déplacer).
    const d3 = its[3];
    assert(d3.displayType === 'button', 'display:button explicite → displayType button');
    assert(d3.x === 45 && d3.y === 32 && d3.width === 40 && d3.height === 30, 'bouton sans placement → position historique (45/32/40/30)');
    // 5) clamp des coordonnées custom hors bornes (mode bouton : le seul où elles comptent)
    const clampOut = await InteractiveVideoProcessor.process({
        videoSource: { url: 'https://x/v.mp4' },
        interactions: [{ timestamp: 1, type: 'multichoice', question: 'Q', answers: [{ text: 'a', correct: true }], display: 'button', placement: 'custom', x: 999, y: -5 }]
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

    // -------------------------------------------------------------------
    // Changement de lien vidéo = changement de contexte : le JSON déjà généré (pour la vidéo
    // précédente) doit être effacé, afin que la bascule en mode guidé reparte d'une base propre.
    // On teste l'unité réellement câblée par runDetection : clearGeneratedJson() — qui vide le
    // textarea, supprime la sauvegarde sessionStorage, et rafraîchit le bouton contextuel.
    group('Détection changement de lien (videoLinkChanged)');
    const A = 'https://www.youtube.com/watch?v=AAAAAAAAAAA';
    const B = 'https://www.youtube.com/watch?v=BBBBBBBBBBB';
    // Premier lien (référence vide) → on ne « change » rien, le JSON éventuel n'est pas touché.
    assert(videoLinkChanged('', A) === false, 'Premier lien (ancien vide) → pas un changement');
    assert(videoLinkChanged(undefined, A) === false, 'Référence undefined → pas un changement');
    // Re-coller le même lien (même après effacement du champ) → pas d'invalidation du travail.
    assert(videoLinkChanged(A, A) === false, 'Même lien recollé → pas un changement');
    // Lien réellement différent → invalidation (cœur du scénario : transcription différente).
    assert(videoLinkChanged(A, B) === true, 'Lien différent → changement détecté');
    assert(videoLinkChanged(A, '') === false, 'Nouveau lien vide → pas un changement (champ effacé, en attente)');

    if (typeof document !== 'undefined') {
        group('Invalidation JSON au changement de lien vidéo');
        const moduleKey = 'InteractiveVideo';
        const storageKey = `caramel_json_${moduleKey}`;

        // DOM minimal : un textarea JSON + le groupe de boutons avec son hook _ctxUpdate.
        const jsonTextarea = document.createElement('textarea');
        jsonTextarea.id = 'test-iv-json-input';
        document.body.appendChild(jsonTextarea);
        const buttonGroup = document.createElement('div');
        buttonGroup.id = `generation-button-group-${moduleKey}`;
        document.body.appendChild(buttonGroup);
        let ctxUpdateCalls = 0;
        buttonGroup._ctxUpdate = () => { ctxUpdateCalls++; };

        // Un JSON a été généré pour la vidéo précédente (textarea + sessionStorage).
        const ancienJson = '{"title":"Activité vidéo A","interactions":[]}';
        jsonTextarea.value = ancienJson;
        sessionStorage.setItem(storageKey, ancienJson);

        // Nouveau lien collé → runDetection appelle clearGeneratedJson(moduleKey, module).
        clearGeneratedJson(moduleKey, { jsonInputId: 'test-iv-json-input' });

        assert(jsonTextarea.value === '', 'Textarea JSON vidé (l\'ancien contenu ne reste pas affiché)');
        assert(sessionStorage.getItem(storageKey) === null, 'Sauvegarde sessionStorage du JSON supprimée');
        assert(ctxUpdateCalls === 1, 'Bouton contextuel rafraîchi (_ctxUpdate appelé une fois)');

        // Robustesse : module inconnu / sans jsonInputId → pas d'exception, pas de clear parasite.
        sessionStorage.setItem(storageKey, ancienJson);
        let threw = false;
        try { clearGeneratedJson('', null); clearGeneratedJson(moduleKey, {}); } catch { threw = true; }
        assert(!threw, 'Appels dégénérés (clé vide / module sans jsonInputId) sans exception');

        // Nettoyage du DOM et du sessionStorage de test.
        sessionStorage.removeItem(storageKey);
        jsonTextarea.remove();
        buttonGroup.remove();
    }

    // -------------------------------------------------------------------
    // Non-régression (audit fonctionnel 2026-07 §2.2) : destroy() du lecteur doit
    // retirer l'élément média du DOM, sinon chaque bascule Plan ↔ Direct du panneau
    // empile un <video> (ou holder YouTube) mort de plus dans .iv-editor-media.
    group('Lecteur — nettoyage DOM (destroy)');
    {
        const mount = document.createElement('div');
        const src = { type: 'html5', url: 'https://exemple.invalid/video.mp4', mime: 'video/mp4' };

        const p1 = createVideoPlayer(mount, src, {});
        assert(mount.children.length === 1, 'Montage html5 : 1 élément média dans le conteneur');
        p1.destroy();
        assert(mount.children.length === 0, 'destroy() retire l\'élément <video> du DOM');

        // Cycles répétés destroy/re-création (simule les bascules Plan ↔ Direct).
        for (let i = 0; i < 3; i++) { createVideoPlayer(mount, src, {}).destroy(); }
        const pLast = createVideoPlayer(mount, src, {});
        assert(mount.children.length === 1, 'Après 4 cycles destroy/re-création : 1 seul élément média (pas d\'empilement)');
        pLast.destroy();

        // Cas YouTube : le conteneur intermédiaire (holder) doit aussi être retiré,
        // Y COMPRIS si destroy() arrive avant que l'API YouTube soit prête.
        // Stub window.YT pour rester hermétique (pas de chargement réseau de iframe_api).
        const hadYT = 'YT' in window;
        const prevYT = window.YT;
        window.YT = { Player: function () { this.destroy = () => {}; } };
        try {
            const mountYt = document.createElement('div');
            const pyt = createVideoPlayer(mountYt, { type: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, {});
            assert(pyt.isYouTube === true, 'Source YouTube reconnue');
            assert(mountYt.children.length === 1, 'Montage YouTube : holder présent dans le conteneur');
            pyt.destroy(); // avant l'init asynchrone du player
            assert(mountYt.children.length === 0, 'destroy() retire le holder YouTube du DOM (même avant init)');
        } finally {
            if (hadYT) window.YT = prevYT; else delete window.YT;
        }
    }

    // -------------------------------------------------------------------
    // Réglage GLOBAL du mode d'affichage des questions (2026-08). Trois modes : « personnalisé »
    // (chaque question décide), « sur la vidéo », « au clic ». Les deux derniers s'imposent à
    // toutes les questions SANS écraser leurs valeurs (retour en arrière possible sans perte).
    group('Mode d\'affichage global (displayMode)');
    {
        const gen = schema.sections.find(s => s.id === 'general');
        const dm = gen && gen.fields.displayMode;
        assert(!!dm && dm.type === 'select', 'Réglage « displayMode » présent dans les informations générales');
        assert(dm.default === 'custom', 'Défaut « personnalisé » : n\'écrase pas les choix d\'un contenu importé');
        assert(dm.options.map(o => o.value).join(',') === 'custom,poster,button', 'Trois modes, personnalisé en tête');
        assert(!!dm.hint, 'Un texte d\'aide explique la portée du réglage');

        // Le menu PAR QUESTION n'apparaît qu'en mode « personnalisé » : ailleurs il n'aurait
        // aucun effet. Portée racine (le réglage vit dans une autre section).
        const sw = itemSchema.appearance.fields.display.showWhen;
        assert(sw && sw.rootField === 'displayMode', 'Le menu par question est conditionné au réglage RACINE');
        assert(matchesShowWhen(sw, {}, null, { displayMode: 'custom' }) === true, 'mode personnalisé → menu par question visible');
        assert(matchesShowWhen(sw, {}, null, { displayMode: 'poster' }) === false, 'mode « sur la vidéo » → menu par question masqué');
        assert(matchesShowWhen(sw, {}, null, { displayMode: 'button' }) === false, 'mode « au clic » → menu par question masqué');
        // Contenu antérieur au réglage (champ absent) : le menu doit rester visible, sinon
        // l'enseignant perdrait l'accès à des choix qu'il a déjà faits.
        assert(matchesShowWhen(sw, {}, null, {}) === true, 'réglage absent (contenu antérieur) → menu par question visible');

        // Processeur : le mode global tranche pour toutes les questions.
        const mk = (displayMode) => ({
            title: 'T', displayMode, videoSource: { url: 'https://x/v.mp4', mime: 'video/mp4' },
            interactions: [
                { timestamp: 1, type: 'truefalse', question: 'A', correct: true, display: 'button' },
                { timestamp: 2, type: 'truefalse', question: 'B', correct: true, display: 'poster' }
            ]
        });
        const modes = async (dmVal) => (await InteractiveVideoProcessor.process(mk(dmVal), procHelpers))
            .content.interactiveVideo.assets.interactions.map(i => i.displayType);
        assert((await modes('poster')).join(',') === 'poster,poster', 'mode global « sur la vidéo » → toutes les questions en poster');
        assert((await modes('button')).join(',') === 'button,button', 'mode global « au clic » → toutes les questions en bouton');
        assert((await modes('custom')).join(',') === 'button,poster', 'mode « personnalisé » → chaque question garde son réglage');
        assert((await modes(undefined)).join(',') === 'button,poster', 'réglage absent → équivaut à « personnalisé »');
        // Le mode global ne DÉTRUIT pas les réglages par question : ils repartent intacts.
        const forcé = mk('poster');
        await InteractiveVideoProcessor.process(forcé, procHelpers);
        assert(forcé.interactions[0].display === 'button' && forcé.interactions[1].display === 'poster',
            'Le mode global n\'écrase pas les valeurs par question dans le JSON source');
        // Healer : valeur fantaisiste → repli sur « personnalisé » ; absence → on n'invente rien.
        const h1 = healStructureForActivity({ displayMode: 'nimportequoi', interactions: [] }, 'InteractiveVideo');
        assert(h1.displayMode === 'custom', 'Healer : valeur inconnue → « custom »');
        const h2 = healStructureForActivity({ displayMode: 'button', interactions: [] }, 'InteractiveVideo');
        assert(h2.displayMode === 'button', 'Healer : valeur valide conservée');
        const h3 = healStructureForActivity({ interactions: [] }, 'InteractiveVideo');
        assert(!('displayMode' in h3), 'Healer : champ absent → non créé (pas de bruit dans les JSON existants)');
    }

    // -------------------------------------------------------------------
    // Le flux progressif doit être embarqué pour rester navigable dans Chromium.
    group('Vidéo progressive embarquée');
    {
        const originalFetch = window.fetch;
        const url = 'https://media.exemple.fr/download/web-videos/test-480.mp4';
        const input = { videoSource: { url, mime: 'video/mp4', embed: true }, interactions: [] };
        const bytes = new Uint8Array([0, 0, 0, 12, 102, 116, 121, 112, 109, 112, 52, 50]);
        try {
            window.fetch = async () => new Response(bytes);
            const output = await InteractiveVideoProcessor.process(input, procHelpers);
            const media = getMedia(`interactive-video:${url}`);
            assert(output.content.interactiveVideo.video.files[0].path === media.h5pPath,
                'Le H5P référence le média embarqué, pas le flux sans Range');
            assert(media.blob.size === bytes.length && media.mime === 'video/mp4',
                'Octets MP4 conservés dans le registre exportable');
            assert(input.videoSource.url === url, 'La source éditable reste intacte');
            for (const [response, message] of [
                [new Response('<html>Erreur</html>'), 'Page HTML HTTP 200 rejetée'],
                [new Response('', {status: 404}), 'Erreur réseau rejetée'],
                [new Response('', {headers: {'content-length': String(81 * 1024 * 1024)}}), 'Vidéo au-delà de 80 Mio rejetée']
            ]) {
                window.fetch = async () => response;
                let rejected = false;
                try { await InteractiveVideoProcessor.process(input, procHelpers); } catch { rejected = true; }
                assert(rejected, message);
            }
        } finally {
            window.fetch = originalFetch;
            unregisterMedia(`interactive-video:${url}`);
        }
    }

    // Sources vidéo : la reconnaissance PeerTube ne dépend PAS de l'hôte (Tubes des Apps
    // Education, Tube de Réseau Canopé, toute instance fédérée). Ajouté en 2026-08 avec la
    // prise en charge de `tube.reseau-canope.fr`. Aucun réseau ici : on teste le parsing d'URL
    // et le choix de rendition sur des réponses d'API RÉELLES, relevées le 2026-08-01.
    group('Sources vidéo (PeerTube toutes instances)');
    {
        const CANOPE = 'https://tube.reseau-canope.fr/w/nxr3HQZB65MUwoSjW4efES';
        assert(detectPlatform(CANOPE) === 'peertube', 'Tube Réseau Canopé /w/ → peertube');
        assert(detectPlatform('https://tube.reseau-canope.fr/videos/watch/ae736789-9fc4-4e3d-a3c5-cb4032cde33e') === 'peertube',
            'Tube Réseau Canopé /videos/watch/<uuid> → peertube');
        assert(isPeerTube(CANOPE + '?start=42') === true, 'Paramètres de requête (?start=) sans effet sur la reconnaissance');
        assert(detectPlatform('https://tube-sciences-technologies.apps.education.fr/w/3btBEFwmFxwD3RuMijDtEB') === 'peertube',
            'Tube Apps Education → peertube (non-régression)');
        assert(detectPlatform('https://tube.reseau-canope.fr/a/canope/video-channels') === 'unknown',
            'Page non-vidéo du même hôte → unknown (pas de faux positif sur l\'hôte)');

        // Instance HLS-only (cas Réseau Canopé) : `files` est VIDE, tout est dans
        // streamingPlaylists[].files — y compris la piste audio-seule (resolution.id 0).
        const apiCanope = {
            duration: 93,
            files: [],
            streamingPlaylists: [{
                playlistUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/master.m3u8',
                files: [
                    { resolution: { id: 720 }, fileUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/a-720-fragmented.mp4' },
                    { resolution: { id: 480 }, fileUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/b-480-fragmented.mp4' },
                    { resolution: { id: 0 }, fileUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/c-0-fragmented.mp4' }
                ]
            }]
        };
        const rC = collectRenditions(apiCanope);
        const audioC = rC.filter(r => r.kind === 'audio');
        assert(audioC.length === 1 && audioC[0].mime === 'audio/mp4',
            'HLS-only : la piste audio-seule (resolution 0) est collectée (mime audio/mp4)');
        assert(rC.filter(r => r.kind === 'hls').length === 2, 'HLS-only : les 2 renditions vidéo restent taguées hls');
        const playC = pickPlayableRendition(rC);
        assert(playC && playC.resolution === 720 && playC.kind === 'hls',
            'Lecture = rendition vidéo ≤ 720p, jamais l\'audio-seule');
        assert(albertCandidates(rC)[0].kind === 'audio',
            'Transcription : l\'audio-seule passe en premier (poids minimal, limite 20 Mo d\'Albert)');

        // Instance qui garde le progressif (cas Apps Education) : non-régression du tri.
        const apiProg = {
            duration: 18,
            files: [
                { resolution: { id: 576 }, fileUrl: 'https://tube-x.apps.education.fr/static/web-videos/v-576.mp4' },
                { resolution: { id: 480 }, fileUrl: 'https://tube-x.apps.education.fr/static/web-videos/v-480.mp4' },
                { resolution: { id: 0 }, fileUrl: 'https://tube-x.apps.education.fr/static/web-videos/v-0.mp4' }
            ],
            streamingPlaylists: [{
                playlistUrl: 'https://tube-x.apps.education.fr/static/streaming-playlists/hls/master.m3u8',
                files: [
                    { resolution: { id: 576 }, fileUrl: 'https://tube-x.apps.education.fr/static/streaming-playlists/hls/v-576-fragmented.mp4' },
                    { resolution: { id: 480 }, fileUrl: 'https://tube-x.apps.education.fr/static/streaming-playlists/hls/v-480-fragmented.mp4' }
                ]
            }]
        };
        const rP = collectRenditions(apiProg);
        assert(rP.filter(r => r.kind === 'audio').length === 1, 'Progressif : l\'audio-seule « -0.mp4 » reste collectée');
        const playP = pickPlayableRendition(rP);
        assert(playP && playP.kind === 'hls' && playP.resolution === 576,
            'Lecture : HLS fragmenté préféré au progressif (web-videos souvent 404)');
        const candP = albertCandidates(rP).map(r => r.kind);
        assert(candP[0] === 'audio' && candP.indexOf('hls') < candP.indexOf('progressive'),
            'Transcription : ordre audio → hls → progressif');

        const downloadUrl = 'https://media.exemple.fr/download/web-videos/identifiant-480.mp4';
        const withDownload = collectRenditions({
            files: [
                { resolution: { id: 0 }, fileUrl: 'audio.mp4', fileDownloadUrl: 'audio-download.mp4' },
                { resolution: { id: 480 }, fileUrl: 'statique-perime.mp4', fileDownloadUrl: downloadUrl },
                { resolution: { id: 1080 }, fileUrl: 'grand.mp4', fileDownloadUrl: 'grand-download.mp4' }
            ],
            streamingPlaylists: apiProg.streamingPlaylists
        });
        assert(pickPlayableRendition(withDownload).url === downloadUrl,
            'Firefox : utiliser le téléchargement progressif fourni par PeerTube, sans reconstruire son URL');
        assert(pickPlayableRendition(withDownload).resolution === 480,
            'Lecture progressive : plafond 720p et exclusion de la piste audio');
        assert(albertCandidates(withDownload).find(r => r.kind === 'progressive').url === 'statique-perime.mp4',
            'Le choix de lecture ne modifie pas les sources de transcription');

        // Vidéo sans aucune rendition (privée, en cours d'encodage) → non lisible.
        assert(pickPlayableRendition(collectRenditions({ files: [], streamingPlaylists: [] })) === null,
            'Aucune rendition → pas de source de lecture (état rouge côté UI)');
    }

    // -------------------------------------------------------------------
    // Repli par RELAIS SERVEUR quand l'instance a des en-têtes CORS cassés.
    // Cas réel `tube.reseau-canope.fr` (2026-08-01) : l'instance renvoie deux fois
    // `Access-Control-Allow-Origin: *` → le NAVIGATEUR rejette la réponse (« multiple values »)
    // alors que curl/Node l'acceptent. Sans repli : « Vidéo non lisible ou plateforme non prise
    // en charge » sur une vidéo parfaitement valide. `fetch` est bouchonné : aucun réseau.
    group('CORS cassé → repli par relais serveur');
    {
        const API_JSON = {
            name: 'Dis-moi dix mots : nomade', duration: 93, language: { id: 'fr' },
            thumbnailPath: '/lazy-static/thumbnails/x.jpg', files: [],
            streamingPlaylists: [{
                playlistUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/master.m3u8',
                files: [
                    { resolution: { id: 480 }, fileUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/b-480-fragmented.mp4' },
                    { resolution: { id: 0 }, fileUrl: 'https://s3.reseau-canope.fr/peertube/hls/x/c-0-fragmented.mp4' }
                ]
            }]
        };
        const vraiFetch = window.fetch;
        let appelsInstance = 0, appelsRelais = 0;
        window.fetch = async (input) => {
            const u = String((input && input.url) || input);
            if (u.includes('caramel-fetch-page')) {
                appelsRelais++;
                const cible = u; // le corps porte l'URL demandée ; on répond selon le chemin
                void cible;
                return {
                    ok: true, status: 200,
                    json: async () => ({ text: JSON.stringify(API_JSON), truncated: false })
                };
            }
            if (u.includes('tube.reseau-canope.fr')) {
                appelsInstance++;
                // Ce que le navigateur produit sur un en-tête ACAO dupliqué : un rejet, pas un statut.
                throw new TypeError('Failed to fetch');
            }
            return vraiFetch(input);
        };
        try {
            const d = await detectVideo('https://tube.reseau-canope.fr/w/nxr3HQZB65MUwoSjW4efES');
            assert(d.supported === true && d.playable === true,
                'Appel direct refusé par le navigateur → la vidéo reste détectée (via le relais)');
            assert(d.title === 'Dis-moi dix mots : nomade' && d.duration === 93,
                'Métadonnées relayées intactes (titre, durée)');
            assert(d.videoSource && d.videoSource.url.endsWith('b-480-fragmented.mp4'),
                'Source de lecture résolue depuis le JSON relayé');
            assert(d.hlsPlaylistUrl === 'https://s3.reseau-canope.fr/peertube/hls/x/master.m3u8',
                'Playlist HLS relayée (base du découpage des vidéos longues)');
            assert(appelsRelais >= 1, 'Le relais serveur a bien été sollicité');
            // L'instance n'est retentée en direct qu'UNE fois : l'échec est mémorisé pour la session
            // (sinon détection + sous-titres + appels suivants = autant d'allers-retours perdus).
            const apresPremier = appelsInstance;
            await detectVideo('https://tube.reseau-canope.fr/w/nxr3HQZB65MUwoSjW4efES');
            assert(apresPremier === 1, 'Un seul essai direct pour la 1ʳᵉ détection (sous-titres compris)');
            assert(appelsInstance === 1, 'Détection suivante : plus aucun essai direct sur l\'instance cassée');
        } finally {
            window.fetch = vraiFetch;
        }
    }

    return { passCount, failCount, results };
}
