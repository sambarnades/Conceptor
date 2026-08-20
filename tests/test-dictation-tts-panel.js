/**
 * Tests : panneau « Synthèse vocale » de l'éditeur Dictée (dictation-tts-panel.js)
 *
 * Signalement d'usage (2026-08-20) : « si je clique sur masculine, l'utilisateur ne sait
 * même pas qu'il valide — et ça lance la génération, ça peut prendre une minute » ; « si
 * je bascule en voix masculine puis reviens en féminine, je ne crois pas que ça mémorise
 * ce qui a été généré, donc c'est obligé de tout refaire ».
 *
 * Le cache de services/tts.js répondait DÉJÀ à la seconde inquiétude (clé
 * `lang|voice|slow|texte`, jamais vidée) — mais rien à l'écran ne le disait, et le premier
 * défaut était réel : changer un réglage déclenchait une minute de réseau sans que rien
 * n'ait été validé. D'où les invariants tenus ici :
 *
 *  D1 — changer voix / langue / lecture lente NE DÉCLENCHE AUCUNE SYNTHÈSE ;
 *  D2 — l'aller-retour Féminine → Masculine → Féminine ne redemande RIEN au réseau, et
 *       les lecteurs de la voix retrouvée réapparaissent immédiatement ;
 *  D3 — ce qui reste à produire est ANNONCÉ (bandeau + décompte sur le bouton) avant
 *       tout appel réseau, et disparaît quand tout est couvert ;
 *  D4 — ajouter une phrase après coup la signale comme seule phrase à générer (le reste
 *       du cache est conservé) ;
 *  D5 — pendant une synthèse, les réglages sont VERROUILLÉS : l'ancien code laissait le
 *       bouton de voix basculer et persister `tts.voice` alors que `regenerateAll`
 *       repartait aussitôt sur son garde `busy` — réglage et audio se désynchronisaient
 *       en silence ;
 *  D6 — une phrase en « Ma voix » n'est jamais comptée ni écrasée par la synthèse ;
 *  D7 — chaque piste générée est TÉLÉCHARGEABLE depuis la phrase, sous un nom lisible
 *       (« dictee-01-le-chat-dort.mp3 ») et non le `dictation-<hash>.mp3` interne ;
 *  D8 — une re-décoration qui ne change rien NE RECONSTRUIT PAS les lecteurs (le rendu
 *       rebâtissait tous les `<audio>` à chaque mutation de l'éditeur, d'où un
 *       clignotement à la frappe), MAIS un changement de voix les reconstruit bien —
 *       sinon le lecteur continuerait de jouer l'ancienne voix, en silence.
 *
 * Le panneau étant HOST-AGNOSTIQUE (tout le réseau passe par `deps`), on lui injecte un
 * faux service qui COMPTE ses appels : c'est la seule façon d'affirmer « aucun appel
 * réseau » plutôt que « ça a l'air rapide ».
 *
 * Usage : via tests/test-all.html (suite `dictation-tts`).
 */

import { mountDictationTtsPanel, destroyDictationTtsPanel } from '../js/editor/dictation-tts-panel.js';
import { loadTranslations } from '../js/core/translation.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _group = '';

function assert(condition, message) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, group: _group };
    if (condition) {
        passCount++;
    } else {
        failCount++;
        console.error('FAIL:', _group, '-', message);
    }
    results.push(entry);
}

function assertEqual(actual, expected, message) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) message += ` (attendu: ${JSON.stringify(expected)}, obtenu: ${JSON.stringify(actual)})`;
    assert(pass, message);
}

function group(name) { _group = name; }

const flush = () => new Promise(r => setTimeout(r, 0));

// =======================================================================
// FAUX HÔTE : cache + service de synthèse instrumentés
// =======================================================================

/**
 * Réplique fidèle du contrat de services/tts.js, en mémoire :
 *  - clé de cache `lang|voice|slow|texte`, JAMAIS vidée (c'est le point testé) ;
 *  - `synthesize` ne « part en réseau » que pour les phrases absentes du cache, et
 *    enregistre chaque lot demandé dans `calls` pour pouvoir l'affirmer.
 */
function makeFakeTts() {
    const cache = new Map();
    const calls = [];   // [{ texts, lang, voice, slow }]
    const key = (text, { lang, voice, slow }) => `${lang}|${voice}|${slow ? 'slow' : 'normal'}|${String(text).trim()}`;
    const hash = (s) => {
        let h = 0x811c9dc5;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
        return (h >>> 0).toString(16).padStart(8, '0');
    };
    return {
        calls,
        cache,
        /** Nombre de phrases réellement envoyées « au serveur » depuis le début. */
        networkSentences: () => calls.reduce((n, c) => n + c.texts.length, 0),
        deps: {
            synthesize: async (texts, opts = {}) => {
                const o = { lang: opts.lang || 'fr', voice: opts.voice || 'female', slow: !!opts.slow };
                const missing = texts.filter(txt => !cache.has(key(txt, o)));
                if (missing.length) {
                    calls.push({ texts: missing, ...o });
                    for (const txt of missing) cache.set(key(txt, o), { blob: new Blob(['mp3'], { type: 'audio/mpeg' }) });
                }
                return {
                    audios: texts.map(txt => ({ blob: cache.get(key(txt, o)).blob, mime: 'audio/mpeg' })),
                    voiceUsed: o.voice,
                    genderFallback: false
                };
            },
            fetchVoices: async () => null,   // pas de catalogue : les deux genres restent actifs
            getCachedAudio: (text, opts = {}) => cache.get(key(text, { lang: opts.lang || 'fr', voice: opts.voice || 'female', slow: !!opts.slow })),
            audioPath: (text, opts = {}) => `audios/dictation-${hash(key(text, { lang: opts.lang || 'fr', voice: opts.voice || 'female', slow: !!opts.slow }))}.mp3`,
            getManualAudio: () => undefined,
            langs: ['fr', 'en'],
            defaultLang: 'fr'
        }
    };
}

/**
 * Monte le panneau sur un faux éditeur « liste à plat » : un conteneur `.json-editor`
 * portant le tableau `sentences`, tel que le rend field-renderers. C'est le mode que
 * `sentenceHosts()` reconnaît en premier, donc le plus stable à simuler.
 */
function mountFixture(sentences, ttsSettings = null) {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="json-editor">
            <div class="json-editor__field--array" data-path="sentences">
                ${sentences.map((_, i) => `
                    <div class="json-editor__array-item" data-index="${i}">
                        <div class="json-editor__array-item-content"></div>
                    </div>`).join('')}
            </div>
        </div>`;
    document.body.appendChild(container);

    const data = { sentences: sentences.map(s => ({ ...s })) };
    if (ttsSettings) data.tts = ttsSettings;
    const api = {
        getData: () => data,
        setData: (d) => { Object.assign(data, d); }
    };
    const fake = makeFakeTts();
    mountDictationTtsPanel(container, api, fake.deps);
    // En mode « liste à plat », placePanel() insère la barre en FRÈRE du conteneur
    // (pour survivre aux re-rendus) : elle n'est donc PAS dans `container`.
    const panel = container.parentElement.querySelector('.dt-editor-panel');
    return { container, data, fake, panel };
}

function cleanup(fx) {
    destroyDictationTtsPanel();
    fx.container.remove();
}

/** Clique le bouton de voix demandé et laisse les micro-tâches se vider. */
async function clickVoice(panel, voice) {
    panel.querySelector(`.dt-voice[data-voice="${voice}"]`).click();
    await flush();
}

/** Clique le bouton unique de génération et attend la fin de la synthèse simulée. */
async function clickGenerate(panel) {
    panel.querySelector('.dt-regenerate').click();
    await flush(); await flush(); await flush();
}

const pendingVisible = (panel) => !panel.querySelector('.dt-pending').hidden;
const generateLabel = (panel) => panel.querySelector('.dt-regenerate-label').textContent.trim();

// =======================================================================
// SUITE
// =======================================================================

export async function runAllTests() {
    passCount = 0; failCount = 0; results.length = 0;
    await loadTranslations('fr');

    const PHRASES = [{ text: 'Le chat dort.' }, { text: 'Il pleut ce soir.' }];

    // ==================================================================
    // D1 + D3 : un changement de réglage informe, il ne lance rien
    // ==================================================================
    group('Changer un réglage n\'appelle pas le service');
    {
        const fx = mountFixture(PHRASES);
        await flush();

        assertEqual(fx.fake.calls.length, 0, 'Le montage seul ne déclenche aucune synthèse');
        assert(pendingVisible(fx.panel), 'Rien de généré : le bandeau « reste à générer » est visible');
        assert(/2/.test(generateLabel(fx.panel)), 'Le bouton annonce le nombre de phrases à générer');

        await clickVoice(fx.panel, 'male');
        assertEqual(fx.fake.calls.length, 0, 'Cliquer « Masculine » ne lance AUCUNE synthèse');
        assertEqual(fx.data.tts.voice, 'male', 'Le réglage de voix est bien appliqué et persisté');
        assert(pendingVisible(fx.panel), 'Le bandeau reste affiché : il y a toujours du travail en attente');

        fx.panel.querySelector('.dt-lang').value = 'en';
        fx.panel.querySelector('.dt-lang').dispatchEvent(new Event('change'));
        await flush();
        assertEqual(fx.fake.calls.length, 0, 'Changer la langue ne lance AUCUNE synthèse');

        const slow = fx.panel.querySelector('.dt-slow');
        slow.checked = !slow.checked;
        slow.dispatchEvent(new Event('change'));
        await flush();
        assertEqual(fx.fake.calls.length, 0, 'Basculer « lecture lente » ne lance AUCUNE synthèse');

        cleanup(fx);
    }

    // ==================================================================
    // D2 : l'aller-retour entre voix est SERVI PAR LE CACHE
    // ==================================================================
    group('Aller-retour Féminine → Masculine → Féminine');
    {
        // Lecture lente décochée : on isole la piste normale (1 phrase = 1 audio).
        const fx = mountFixture(PHRASES, { lang: 'fr', voice: 'female', slow: false });
        await flush();

        await clickGenerate(fx.panel);
        const apresFeminine = fx.fake.networkSentences();
        assertEqual(apresFeminine, 2, 'Première génération en voix féminine : 2 phrases synthétisées');
        assert(!pendingVisible(fx.panel), 'Tout est généré : le bandeau disparaît');

        await clickVoice(fx.panel, 'male');
        assert(pendingVisible(fx.panel), 'Voix masculine jamais générée : le bandeau la réclame');
        await clickGenerate(fx.panel);
        assertEqual(fx.fake.networkSentences(), 4, 'Voix masculine : 2 phrases de plus synthétisées');

        // Le cœur du signalement : le retour à la voix déjà produite doit être GRATUIT.
        await clickVoice(fx.panel, 'female');
        assertEqual(fx.fake.networkSentences(), 4, 'Retour en voix féminine : AUCUN nouvel appel réseau');
        assert(!pendingVisible(fx.panel), 'Retour en voix féminine : rien à générer, bandeau masqué');

        // Et même en cliquant « Générer », rien ne doit repartir : tout est en cache.
        await clickGenerate(fx.panel);
        assertEqual(fx.fake.networkSentences(), 4, 'Générer sur un réglage déjà couvert ne rappelle pas le service');

        // Les lecteurs de la voix retrouvée sont bien re-rendus (pas de « À générer »).
        const blocs = [...fx.container.querySelectorAll('.dt-sentence-audio')];
        assertEqual(blocs.length, 2, 'Chaque phrase porte son bloc audio');
        assert(blocs.every(b => b.querySelector('audio')), 'Chaque phrase retrouve un lecteur audio jouable');

        cleanup(fx);
    }

    // ==================================================================
    // D4 : une phrase ajoutée après coup est la seule à générer
    // ==================================================================
    group('Phrase ajoutée après génération');
    {
        const fx = mountFixture(PHRASES, { lang: 'fr', voice: 'female', slow: false });
        await flush();
        await clickGenerate(fx.panel);
        assertEqual(fx.fake.networkSentences(), 2, 'Les 2 phrases initiales sont synthétisées');

        // L'auteur ajoute une phrase : l'éditeur re-rend son tableau, le panneau se re-décore.
        fx.data.sentences.push({ text: 'Une phrase de plus.' });
        const arr = fx.container.querySelector('[data-path="sentences"]');
        const item = document.createElement('div');
        item.className = 'json-editor__array-item';
        item.dataset.index = '2';
        item.innerHTML = '<div class="json-editor__array-item-content"></div>';
        arr.appendChild(item);
        await new Promise(r => setTimeout(r, 420));   // au-delà du debounce de 350 ms

        assert(pendingVisible(fx.panel), 'La phrase ajoutée est signalée comme restant à générer');
        assert(/1/.test(generateLabel(fx.panel)), 'Le décompte annonce UNE seule phrase à générer');

        await clickGenerate(fx.panel);
        assertEqual(fx.fake.networkSentences(), 3, 'Seule la phrase ajoutée part en réseau (les 2 autres restent en cache)');
        assertEqual(fx.fake.calls[fx.fake.calls.length - 1].texts, ['Une phrase de plus.'],
            'Le lot envoyé ne contient QUE la phrase ajoutée');

        cleanup(fx);
    }

    // ==================================================================
    // D5 : réglages verrouillés pendant la synthèse
    // ==================================================================
    group('Verrouillage pendant la synthèse');
    {
        const fx = mountFixture(PHRASES, { lang: 'fr', voice: 'female', slow: false });
        await flush();

        // Synthèse suspendue : on observe l'état PENDANT l'appel.
        let libere;
        const enAttente = new Promise(r => { libere = r; });
        const vraiSynthese = fx.fake.deps.synthesize;
        let pendantVoixCliquee = false;
        fx.fake.deps.synthesize = async (texts, opts) => {
            await enAttente;
            return vraiSynthese(texts, opts);
        };

        fx.panel.querySelector('.dt-regenerate').click();
        await flush();

        assert(fx.panel.querySelector('.dt-lang').disabled, 'Pendant la synthèse : la langue est verrouillée');
        assert(fx.panel.querySelector('.dt-slow').disabled, 'Pendant la synthèse : « lecture lente » est verrouillée');
        assert(fx.panel.querySelector('.dt-regenerate').disabled, 'Pendant la synthèse : le bouton « Générer » est verrouillé');
        assert(!fx.panel.querySelector('.dt-cancel').hidden, 'Pendant la synthèse : « Annuler » est proposé');
        assert([...fx.panel.querySelectorAll('.dt-voice')].every(b => b.disabled),
            'Pendant la synthèse : les boutons de voix sont verrouillés');

        // Le clic ignoré ne doit RIEN changer au réglage (l'ancien code le persistait).
        await clickVoice(fx.panel, 'male');
        pendantVoixCliquee = fx.data.tts.voice === 'male';
        assert(!pendantVoixCliquee, 'Un clic de voix pendant la synthèse ne désynchronise pas le réglage');

        libere();
        await flush(); await flush(); await flush();

        assert(!fx.panel.querySelector('.dt-lang').disabled, 'Après la synthèse : les réglages sont rendus');
        assert(fx.panel.querySelector('.dt-cancel').hidden, 'Après la synthèse : « Annuler » disparaît');
        assert([...fx.panel.querySelectorAll('.dt-voice')].every(b => !b.disabled),
            'Après la synthèse : les voix redeviennent cliquables');

        cleanup(fx);
    }

    // ==================================================================
    // D6 : « Ma voix » reste hors de portée de la synthèse
    // ==================================================================
    group('Audio « Ma voix » préservé');
    {
        const fx = mountFixture([
            { text: 'Le chat dort.' },
            { text: 'Enregistrée par le professeur.', sample: { path: 'audios/prof-01.mp3', mime: 'audio/mpeg' } }
        ], { lang: 'fr', voice: 'female', slow: false });
        await flush();

        assert(/1/.test(generateLabel(fx.panel)), 'Une phrase en « Ma voix » n\'est pas comptée comme à générer');

        await clickGenerate(fx.panel);
        assertEqual(fx.fake.calls[0].texts, ['Le chat dort.'], 'Seule la phrase sans « Ma voix » est synthétisée');
        assertEqual(fx.data.sentences[1].sample.path, 'audios/prof-01.mp3', 'L\'audio « Ma voix » n\'est pas écrasé');
        assert(!pendingVisible(fx.panel), 'Plus rien en attente une fois l\'unique phrase générée');

        cleanup(fx);
    }

    // ==================================================================
    // D7 : récupérer les MP3 produits par l'IA
    // ==================================================================
    group('Téléchargement des pistes générées');
    {
        const fx = mountFixture(PHRASES, { lang: 'fr', voice: 'female', slow: true });
        await flush();
        await clickGenerate(fx.panel);

        const blocs = [...fx.container.querySelectorAll('.dt-sentence-audio')];
        const liens = blocs.map(b => [...b.querySelectorAll('.dt-sa-dl')]);

        assertEqual(liens.map(l => l.length), [2, 2],
            'Lecture lente active : chaque phrase offre 2 téléchargements (normale + lente)');
        assert(liens.flat().every(a => a.getAttribute('href')),
            'Chaque lien de téléchargement porte une source');
        assert(liens.flat().every(a => a.hasAttribute('download')),
            'Chaque lien porte l\'attribut download (sinon le navigateur navigue au lieu d\'enregistrer)');

        // Le nom doit être lisible : c'est tout l'intérêt face au `dictation-<hash>.mp3`.
        const noms = liens.map(l => l.map(a => a.getAttribute('download')));
        assertEqual(noms[0], ['dictee-01-le-chat-dort.mp3', 'dictee-01-le-chat-dort-lent.mp3'],
            'Le nom de fichier reprend le rang et le début de la phrase, sans accent');
        assert(noms.flat().every(n => !/dictation-[0-9a-f]{8}/.test(n)),
            'Le hash interne n\'apparaît jamais dans le nom téléchargé');

        // Sans lecture lente, seule la piste normale est proposée.
        const slow = fx.panel.querySelector('.dt-slow');
        slow.checked = false;
        slow.dispatchEvent(new Event('change'));
        await flush();
        assertEqual([...fx.container.querySelectorAll('.dt-sentence-audio')].map(b => b.querySelectorAll('.dt-sa-dl').length),
            [1, 1], 'Lecture lente décochée : une seule piste téléchargeable par phrase');

        cleanup(fx);
    }

    // ==================================================================
    // D8 : rendu idempotent — pas de clignotement, mais pas de son périmé
    // ==================================================================
    group('Re-décoration sans changement');
    {
        const fx = mountFixture(PHRASES, { lang: 'fr', voice: 'female', slow: false });
        await flush();
        await clickGenerate(fx.panel);

        const audioAvant = [...fx.container.querySelectorAll('.dt-sentence-audio audio')];
        assertEqual(audioAvant.length, 2, 'Deux lecteurs après génération');

        // Mutation EXTÉRIEURE au panneau : c'est ce que produit chaque frappe dans
        // l'éditeur, et c'est elle qui déclenchait la reconstruction générale.
        fx.container.querySelector('.json-editor').appendChild(document.createElement('span'));
        await new Promise(r => setTimeout(r, 420));   // au-delà du debounce de 350 ms

        const audioApres = [...fx.container.querySelectorAll('.dt-sentence-audio audio')];
        assert(audioApres.length === audioAvant.length && audioApres.every((a, i) => a === audioAvant[i]),
            'Rien n\'a changé : les MÊMES nœuds <audio> sont conservés (aucun clignotement)');

        // …mais le rendu ne doit pas devenir aveugle pour autant : changer de voix
        // DOIT reconstruire, sinon on écouterait encore la voix précédente.
        await clickVoice(fx.panel, 'male');
        await clickGenerate(fx.panel);
        const audioAutreVoix = [...fx.container.querySelectorAll('.dt-sentence-audio audio')];
        assert(audioAutreVoix.every((a, i) => a !== audioAvant[i]),
            'Changement de voix : les lecteurs sont bien reconstruits sur le nouvel audio');

        cleanup(fx);
    }

    return { passCount, failCount, results };
}
