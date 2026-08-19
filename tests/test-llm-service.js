/**
 * @file `services/llm.js` — le chemin réseau critique de CHAQUE génération.
 *
 * Ce module n'avait, jusqu'ici, AUCUN test. C'est pourtant lui qui porte :
 *   · la soumission au proxy n8n (et la règle de sécurité « le corps d'erreur du
 *     serveur ne remonte pas à l'enseignant ») ;
 *   · la boucle de polling, sa reprise sur erreur réseau transitoire, ses statuts
 *     terminaux (`done`, `error`, `not_found`, inattendu) ;
 *   · le garde-fou de délai global ;
 *   · l'extraction du JSON noyé dans la prose du LLM.
 *
 * Une régression ici ne se voit pas au chargement : elle se voit en production, sur
 * une génération qui échoue ou qui part en boucle. Exactement la classe de panne que
 * la suite navigateur existe pour attraper.
 *
 * MÉTHODE — deux substitutions, toutes deux restaurées en fin de suite :
 *   1. `window.fetch` est remplacé par un faux serveur n8n scénarisable. On observe
 *      donc AUSSI ce qui est ENVOYÉ (méthode, en-têtes, corps, encodage du taskId),
 *      pas seulement ce qui est renvoyé.
 *   2. `POLL_TIMINGS` est abaissé à quelques millisecondes. Sans cela, le seul cas
 *      « délai dépassé » coûterait 5 minutes de suite — la raison pour laquelle ce
 *      module était resté intestable.
 *
 * L'étape 7 vérifie que les valeurs de production ont bien été restaurées : un test
 * qui laisserait `POLL_TIMINGS` à 1 ms contaminerait l'application réelle.
 */

import {
    generateRawWithLLM,
    generateH5PWithLLM,
    populateModelSelector,
    POLL_TIMINGS,
    AVAILABLE_MODELS,
    DEFAULT_MODEL,
    ACTIVITY_MODEL_OVERRIDES
} from '../js/services/llm.js';
import { ENDPOINTS } from '../js/core/endpoints.js';
import { allModules } from '../js/core/definitions.js';

// ============================================================================
// ÉTAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; }
    else passCount++;
    results.push(entry);
}
function beginStep(n, name) { _ctx = { step: n, stepName: name }; }
function endStep() { _ctx = { step: 0, stepName: '' }; }

export const STEP_NAMES = {
    1: 'Soumission au proxy n8n',
    2: 'Polling nominal et mapping du résultat',
    3: 'Statuts terminaux en erreur',
    4: 'Reprise réseau et délai global',
    5: 'Extraction du JSON dans la réponse du LLM',
    6: 'Registre des modèles',
    7: 'Sélecteur de modèles (DOM) et restauration des constantes'
};

export const STEP_DESCRIPTIONS = {
    1: 'Méthode, en-têtes et corps envoyés ; erreur HTTP ; taskId manquant ; non-fuite du corps serveur.',
    2: 'processing → done, encodage du taskId, mapping complet des champs et valeurs par défaut.',
    3: 'error (avec et sans message), not_found, statut inattendu, erreur HTTP au poll.',
    4: 'Une erreur réseau transitoire est RETENTÉE ; une panne durable finit en délai dépassé.',
    5: 'Bloc markdown, prose avant le JSON, JSON tronqué, contenu vide, deux objets à la suite.',
    6: 'DEFAULT_MODEL connu, identifiants uniques, ordre des modèles mis en avant, surcharges valides.',
    7: 'Filtrage featured/debug, ordre, classe sélectionnée, clavier — puis POLL_TIMINGS revenu en prod.'
};

// ============================================================================
// FAUX SERVEUR n8n
// ============================================================================

const SUBMIT_URL = ENDPOINTS.llmSubmit;
const RESULT_URL = ENDPOINTS.llmResult;

const vraiFetch = window.fetch;

/** Journal de tous les appels interceptés pendant un scénario. */
let journal = [];

/**
 * Installe le faux serveur.
 *
 * @param {Object} scenario
 * @param {Object|Function} scenario.submit - Réponse de submit, ou fonction (body) => réponse.
 *        Forme : {status?, ok?, json?, reseau?} — `reseau: true` simule un échec de fetch.
 * @param {Array<Object|Function>} scenario.polls - Réponses successives du poll. La
 *        DERNIÈRE est répétée si la boucle poll davantage (utile pour les scénarios
 *        de délai dépassé).
 */
function installerFauxServeur(scenario) {
    journal = [];
    let indexPoll = 0;

    const fabriquerReponse = (spec) => {
        if (spec && spec.reseau) {
            return Promise.reject(new TypeError('Failed to fetch'));
        }
        const status = spec.status ?? 200;
        return Promise.resolve({
            ok: spec.ok ?? (status >= 200 && status < 300),
            status,
            statusText: spec.statusText ?? (status === 200 ? 'OK' : 'Server Error'),
            json: async () => (typeof spec.json === 'function' ? spec.json() : spec.json),
            text: async () => (spec.text ?? JSON.stringify(spec.json ?? {}))
        });
    };

    window.fetch = (url, options = {}) => {
        const href = String(url);
        journal.push({ url: href, options });

        if (href.startsWith(SUBMIT_URL)) {
            let spec = scenario.submit ?? { json: { taskId: 'T-1', status: 'pending' } };
            if (typeof spec === 'function') {
                spec = spec(options.body ? JSON.parse(options.body) : null);
            }
            return fabriquerReponse(spec);
        }

        if (href.startsWith(RESULT_URL)) {
            const liste = scenario.polls ?? [{ json: { status: 'done', content: '{}' } }];
            // La dernière entrée est répétée indéfiniment : c'est ce qui permet de
            // simuler « le serveur ne répond jamais done » sans écrire 100 entrées.
            let spec = liste[Math.min(indexPoll, liste.length - 1)];
            indexPoll++;
            if (typeof spec === 'function') spec = spec(href, indexPoll);
            return fabriquerReponse(spec);
        }

        // Tout autre appel (imports dynamiques, etc.) part au vrai fetch.
        return vraiFetch.call(window, url, options);
    };
}

function retirerFauxServeur() {
    window.fetch = vraiFetch;
}

/** Cadence de test : la boucle complète tourne en quelques millisecondes. */
const TIMINGS_TEST = { initialDelayMs: 1, intervalMs: 2, timeoutMs: 250 };
const TIMINGS_PROD = { ...POLL_TIMINGS };

function accelererPolling(surcharge = {}) {
    Object.assign(POLL_TIMINGS, TIMINGS_TEST, surcharge);
}
function restaurerPolling() {
    Object.assign(POLL_TIMINGS, TIMINGS_PROD);
}

/** Exécute `fn` et renvoie {ok, valeur} ou {ok:false, erreur}. */
async function capturer(fn) {
    try {
        return { ok: true, valeur: await fn() };
    } catch (e) {
        return { ok: false, erreur: e };
    }
}

/**
 * Comme `capturer`, mais BORNÉ dans le temps.
 *
 * Nécessaire pour les scénarios qui testent le garde-fou de délai : si ce garde-fou
 * venait à disparaître, `generateRawWithLLM` ne rendrait JAMAIS la main et la suite
 * entière se figerait — un test qui se bloque ne signale rien. Avec cette échéance,
 * la disparition du garde-fou produit un ÉCHEC lisible.
 */
async function capturerAvecEcheance(fn, echeanceMs) {
    let minuteur;
    const echeance = new Promise(resolve => {
        minuteur = setTimeout(() => resolve({ ok: false, bloque: true, erreur: new Error(
            `L'appel n'a pas rendu la main en ${echeanceMs} ms — le garde-fou de délai global a-t-il disparu ?`
        ) }), echeanceMs);
    });
    try {
        return await Promise.race([capturer(fn), echeance]);
    } finally {
        clearTimeout(minuteur);
    }
}

const corpsDuDernierSubmit = () => {
    const appel = journal.find(a => a.url.startsWith(SUBMIT_URL));
    return appel && appel.options.body ? JSON.parse(appel.options.body) : null;
};
const appelsDePoll = () => journal.filter(a => a.url.startsWith(RESULT_URL));

// ============================================================================
// ÉTAPE 1 — Soumission
// ============================================================================

async function runStep1_Submit() {
    beginStep(1, STEP_NAMES[1]);
    accelererPolling();

    // --- 1.1 : forme de la requête ------------------------------------------
    installerFauxServeur({
        submit: { json: { taskId: 'T-42' } },
        polls: [{ json: { status: 'done', content: '{"a":1}' } }]
    });
    let r = await capturer(() => generateRawWithLLM('Mon prompt', 'mistral-small-4-119b'));
    assert(r.ok, '[1.1] Un aller-retour nominal réussit', r.erreur && r.erreur.message);

    const appelSubmit = journal.find(a => a.url.startsWith(SUBMIT_URL));
    assert(!!appelSubmit, '[1.2] La soumission part bien sur ENDPOINTS.llmSubmit');
    assert(appelSubmit && appelSubmit.options.method === 'POST',
        '[1.3] La soumission est un POST', appelSubmit && appelSubmit.options.method);
    assert(appelSubmit && appelSubmit.options.headers
        && appelSubmit.options.headers['Content-Type'] === 'application/json',
        '[1.4] La soumission déclare Content-Type: application/json');

    let corps = corpsDuDernierSubmit();
    assert(corps && corps.prompt === 'Mon prompt', '[1.5] Le prompt est transmis tel quel', corps);
    assert(corps && corps.model === 'mistral-small-4-119b', '[1.6] Le modèle est transmis tel quel', corps);
    assert(corps && !('activity' in corps) && !('rag' in corps) && !('stats' in corps),
        '[1.7] Sans options, aucun champ activity/rag/stats parasite n\'est envoyé',
        corps && Object.keys(corps));

    // --- 1.8 : options optionnelles ------------------------------------------
    installerFauxServeur({
        submit: { json: { taskId: 'T-43' } },
        polls: [{ json: { status: 'done', content: '{}' } }]
    });
    await capturer(() => generateRawWithLLM('P', 'M', {
        activityMeta: { moduleKey: 'Timeline' },
        rag: { sujet: 'volcans', niveau: 'cycle 3' },
        stats: 'skip'
    }));
    corps = corpsDuDernierSubmit();
    assert(corps && corps.activity && corps.activity.moduleKey === 'Timeline',
        '[1.8] activityMeta est envoyé sous la clé `activity`', corps);
    assert(corps && corps.rag && corps.rag.sujet === 'volcans',
        '[1.9] Le contexte RAG est envoyé sous la clé `rag`', corps);
    assert(corps && corps.stats === 'skip',
        '[1.10] stats=skip est transmis (le Worker n\'écrit alors pas dans Grist)', corps);

    // --- 1.11 : erreur HTTP à la soumission ----------------------------------
    // Le corps renvoyé par le serveur ne doit PAS remonter dans le message d'erreur
    // (il peut contenir des détails d'infrastructure) — règle explicite du module.
    const CORPS_SENSIBLE = 'SECRET_INTERNE_n8n_stacktrace_postgres';
    installerFauxServeur({
        submit: { status: 503, statusText: 'Service Unavailable', text: CORPS_SENSIBLE }
    });
    r = await capturer(() => generateRawWithLLM('P', 'M'));
    assert(!r.ok, '[1.11] Une soumission en erreur HTTP lève bien');
    assert(!r.ok && /503/.test(r.erreur.message),
        '[1.12] Le message d\'erreur porte le code HTTP', r.ok ? null : r.erreur.message);
    assert(!r.ok && !r.erreur.message.includes(CORPS_SENSIBLE),
        '[1.13] Le CORPS de la réponse serveur ne fuit PAS dans le message utilisateur',
        r.ok ? null : { message: r.erreur.message, attendu: 'sans le corps brut' });

    // --- 1.14 : taskId manquant ----------------------------------------------
    installerFauxServeur({ submit: { json: { status: 'pending' } } });
    r = await capturer(() => generateRawWithLLM('P', 'M'));
    assert(!r.ok && /taskId/i.test(r.erreur.message),
        '[1.14] Une réponse submit sans taskId lève une erreur explicite',
        r.ok ? 'aucune erreur levée' : r.erreur.message);
    assert(appelsDePoll().length === 0,
        '[1.15] Sans taskId, aucun poll n\'est déclenché', appelsDePoll().length);

    retirerFauxServeur();
    endStep();
}

// ============================================================================
// ÉTAPE 2 — Polling nominal
// ============================================================================

async function runStep2_PollingNominal() {
    beginStep(2, STEP_NAMES[2]);
    accelererPolling();

    // --- 2.1 : plusieurs `processing` avant `done` ---------------------------
    installerFauxServeur({
        submit: { json: { taskId: 'T-100' } },
        polls: [
            { json: { status: 'processing' } },
            { json: { status: 'processing' } },
            { json: { status: 'processing' } },
            {
                json: {
                    status: 'done',
                    content: '{"titre":"Volcans"}',
                    prompt_tokens: 1234,
                    completion_tokens: 567,
                    model: 'mistral-small-4-119b',
                    fallback_level: 2
                }
            }
        ]
    });
    let r = await capturer(() => generateRawWithLLM('P', 'modele-demande'));
    assert(r.ok, '[2.1] La boucle traverse plusieurs `processing` puis aboutit',
        r.ok ? null : r.erreur.message);
    assert(appelsDePoll().length === 4,
        '[2.2] Exactement 4 polls ont été émis (3 processing + 1 done)', appelsDePoll().length);

    const v = r.valeur || {};
    assert(v.content === '{"titre":"Volcans"}', '[2.3] `content` est le JSON extrait', v.content);
    assert(v.rawContent === '{"titre":"Volcans"}', '[2.4] `rawContent` conserve la réponse brute', v.rawContent);
    assert(v.promptTokens === 1234, '[2.5] promptTokens est repris de prompt_tokens', v.promptTokens);
    assert(v.completionTokens === 567, '[2.6] completionTokens est repris de completion_tokens', v.completionTokens);
    assert(v.model === 'mistral-small-4-119b', '[2.7] Le modèle FINAL renvoyé par le serveur fait foi', v.model);
    assert(v.fallbackLevel === 2, '[2.8] fallbackLevel est repris de fallback_level', v.fallbackLevel);
    assert(typeof v.durationS === 'number' && v.durationS >= 0,
        '[2.9] durationS est un nombre de secondes', v.durationS);

    // --- 2.10 : encodage du taskId -------------------------------------------
    // Un taskId contenant &, ? ou = casserait l'URL sans encodeURIComponent.
    const TASK_PIEGE = 'a&b=c?d e/f';
    installerFauxServeur({
        submit: { json: { taskId: TASK_PIEGE } },
        polls: [{ json: { status: 'done', content: '{}' } }]
    });
    await capturer(() => generateRawWithLLM('P', 'M'));
    const urlPoll = appelsDePoll()[0] ? appelsDePoll()[0].url : '';
    assert(urlPoll.includes(encodeURIComponent(TASK_PIEGE)),
        '[2.10] Le taskId est encodé (encodeURIComponent) dans l\'URL de poll', urlPoll);
    assert(!urlPoll.includes('a&b=c'),
        '[2.11] Le taskId brut n\'apparaît pas tel quel (il casserait la query string)', urlPoll);

    // --- 2.12 : valeurs par défaut -------------------------------------------
    installerFauxServeur({
        submit: { json: { taskId: 'T-101' } },
        polls: [{ json: { status: 'done', content: '{"x":1}' } }]
    });
    r = await capturer(() => generateRawWithLLM('P', 'modele-demande'));
    const d = r.valeur || {};
    assert(d.promptTokens === 0 && d.completionTokens === 0,
        '[2.12] Tokens absents → 0 (et non undefined)', { p: d.promptTokens, c: d.completionTokens });
    assert(d.model === 'modele-demande',
        '[2.13] Modèle absent de la réponse → on retombe sur le modèle demandé', d.model);
    assert(d.fallbackLevel === 0, '[2.14] fallback_level absent → 0', d.fallbackLevel);

    // --- 2.15 : la méthode du poll -------------------------------------------
    assert(appelsDePoll()[0] && appelsDePoll()[0].options.method === 'GET',
        '[2.15] Le poll est un GET', appelsDePoll()[0] && appelsDePoll()[0].options.method);

    retirerFauxServeur();
    endStep();
}

// ============================================================================
// ÉTAPE 3 — Statuts terminaux en erreur
// ============================================================================

async function runStep3_StatutsErreur() {
    beginStep(3, STEP_NAMES[3]);
    accelererPolling();

    const cas = [
        {
            nom: 'error avec message serveur',
            poll: { status: 'error', message: 'Le modèle a saturé sa fenêtre de contexte.' },
            attendu: /fenêtre de contexte/,
            ref: '3.1'
        },
        {
            nom: 'error SANS message',
            poll: { status: 'error' },
            attendu: /IA|génération/i,
            ref: '3.2'
        },
        {
            nom: 'not_found (tâche expirée)',
            poll: { status: 'not_found' },
            attendu: /introuvable|expir/i,
            ref: '3.3'
        },
        {
            nom: 'statut inattendu',
            poll: { status: 'zombie' },
            attendu: /inattendu|zombie/i,
            ref: '3.4'
        }
    ];

    for (const c of cas) {
        installerFauxServeur({
            submit: { json: { taskId: 'T-E' } },
            polls: [{ json: c.poll }]
        });
        const r = await capturer(() => generateRawWithLLM('P', 'M'));
        assert(!r.ok, `[${c.ref}] ${c.nom} → l'appel lève`);
        assert(!r.ok && c.attendu.test(r.erreur.message),
            `[${c.ref}] ${c.nom} → le message est explicite`,
            r.ok ? null : { obtenu: r.erreur.message, attendu: String(c.attendu) });
    }

    // --- 3.5 : erreur HTTP pendant le poll -----------------------------------
    installerFauxServeur({
        submit: { json: { taskId: 'T-E2' } },
        polls: [{ status: 500, statusText: 'Internal Server Error' }]
    });
    const r = await capturer(() => generateRawWithLLM('P', 'M'));
    assert(!r.ok && /500/.test(r.erreur.message),
        '[3.5] Une erreur HTTP au poll lève avec le code (et n\'est PAS retentée indéfiniment)',
        r.ok ? null : r.erreur.message);

    retirerFauxServeur();
    endStep();
}

// ============================================================================
// ÉTAPE 4 — Reprise réseau et délai global
// ============================================================================

async function runStep4_ReseauEtTimeout() {
    beginStep(4, STEP_NAMES[4]);

    // --- 4.1 : une coupure transitoire NE DOIT PAS faire échouer la génération.
    // C'est le comportement le plus précieux du module (wifi d'établissement) et
    // le plus facile à casser par inadvertance en réécrivant la boucle.
    accelererPolling();
    installerFauxServeur({
        submit: { json: { taskId: 'T-NET' } },
        polls: [
            { reseau: true },
            { reseau: true },
            { json: { status: 'processing' } },
            { reseau: true },
            { json: { status: 'done', content: '{"ok":true}' } }
        ]
    });
    let r = await capturer(() => generateRawWithLLM('P', 'M'));
    assert(r.ok, '[4.1] Trois erreurs réseau transitoires sont retentées, la génération aboutit',
        r.ok ? null : r.erreur.message);
    assert(r.ok && r.valeur.content === '{"ok":true}',
        '[4.2] Le résultat obtenu après reprise est intact', r.ok && r.valeur.content);
    assert(appelsDePoll().length === 5,
        '[4.3] Les 5 tentatives de poll ont bien eu lieu', appelsDePoll().length);

    // --- 4.4 : une panne DURABLE ne doit pas boucler à l'infini ---------------
    accelererPolling({ timeoutMs: 120 });
    installerFauxServeur({
        submit: { json: { taskId: 'T-NET2' } },
        polls: [{ reseau: true }]   // répété indéfiniment
    });
    const t0 = Date.now();
    r = await capturerAvecEcheance(() => generateRawWithLLM('P', 'M'), 4000);
    const ecoule = Date.now() - t0;
    assert(!r.ok, '[4.4] Une panne réseau durable finit par échouer (pas de boucle infinie)');
    assert(!r.bloque, '[4.5] L\'appel rend la main de lui-même (garde-fou présent)',
        r.bloque ? r.erreur.message : null);
    assert(!r.ok && /délai|dépass/i.test(r.erreur.message),
        '[4.6] L\'échec est bien le garde-fou de délai global', r.ok ? null : r.erreur.message);
    assert(ecoule < 4000, '[4.7] Le garde-fou se déclenche dans le temps imparti', `${ecoule} ms`);

    // --- 4.7 : `processing` éternel → délai dépassé --------------------------
    accelererPolling({ timeoutMs: 120 });
    installerFauxServeur({
        submit: { json: { taskId: 'T-SLOW' } },
        polls: [{ json: { status: 'processing' } }]  // répété indéfiniment
    });
    r = await capturerAvecEcheance(() => generateRawWithLLM('P', 'M'), 4000);
    assert(!r.bloque, '[4.8] Un `processing` éternel ne fige pas l\'appel',
        r.bloque ? r.erreur.message : null);
    assert(!r.ok && /délai|dépass/i.test(r.erreur.message),
        '[4.9] Un serveur qui reste en `processing` déclenche le délai global',
        r.ok ? 'aucune erreur' : r.erreur.message);
    assert(!r.ok && /réessayer/i.test(r.erreur.message),
        '[4.10] Le message de délai propose une action à l\'enseignant', r.ok ? null : r.erreur.message);

    // --- 4.9 : le délai initial est bien respecté ----------------------------
    // On le remonte volontairement : aucun poll ne doit partir avant.
    accelererPolling({ initialDelayMs: 120, timeoutMs: 4000 });
    installerFauxServeur({
        submit: { json: { taskId: 'T-DELAY' } },
        polls: [{ json: { status: 'done', content: '{}' } }]
    });
    const t1 = Date.now();
    await capturerAvecEcheance(() => generateRawWithLLM('P', 'M'), 4000);
    const avant = Date.now() - t1;
    assert(avant >= 100,
        '[4.11] Aucun poll n\'est émis avant POLL_TIMINGS.initialDelayMs', `${avant} ms écoulées`);

    retirerFauxServeur();
    restaurerPolling();
    endStep();
}

// ============================================================================
// ÉTAPE 5 — Extraction du JSON
// ============================================================================

async function runStep5_ExtractionJson() {
    beginStep(5, STEP_NAMES[5]);
    accelererPolling();

    /** Fait renvoyer `brut` par le faux serveur et récupère le `content` extrait. */
    async function extraire(brut) {
        installerFauxServeur({
            submit: { json: { taskId: 'T-X' } },
            polls: [{ json: { status: 'done', content: brut } }]
        });
        return capturer(() => generateRawWithLLM('P', 'M'));
    }

    const cas = [
        {
            ref: '5.1',
            nom: 'bloc markdown ```json',
            brut: 'Voici votre activité :\n```json\n{"titre":"Volcans"}\n```\nBonne journée !',
            attendu: '{"titre":"Volcans"}'
        },
        {
            ref: '5.2',
            nom: 'prose AVANT le JSON',
            brut: 'Bien sûr ! Voici le JSON demandé : {"titre":"Volcans"}',
            attendu: '{"titre":"Volcans"}'
        },
        {
            ref: '5.3',
            nom: 'prose APRÈS le JSON',
            brut: '{"titre":"Volcans"} J\'espère que cela vous convient.',
            attendu: '{"titre":"Volcans"}'
        },
        {
            ref: '5.4',
            nom: 'JSON déjà nu',
            brut: '{"titre":"Volcans"}',
            attendu: '{"titre":"Volcans"}'
        },
        {
            ref: '5.5',
            nom: 'tableau racine',
            brut: 'Réponse : [{"q":1},{"q":2}]',
            attendu: '[{"q":1},{"q":2}]'
        },
        {
            ref: '5.6',
            nom: 'accolade DANS une chaîne (ne doit pas fausser le comptage)',
            brut: '{"texte":"une accolade } au milieu","n":1}',
            attendu: '{"texte":"une accolade } au milieu","n":1}'
        },
        {
            ref: '5.7',
            nom: 'guillemet échappé dans une chaîne',
            brut: '{"texte":"il a dit \\"bonjour\\"","n":2}',
            attendu: '{"texte":"il a dit \\"bonjour\\"","n":2}'
        },
        {
            ref: '5.8',
            nom: 'deux objets à la suite → seul le premier',
            brut: '{"a":1}\n{"b":2}',
            attendu: '{"a":1}'
        }
    ];

    for (const c of cas) {
        const r = await extraire(c.brut);
        assert(r.ok && r.valeur.content === c.attendu,
            `[${c.ref}] ${c.nom}`,
            { brut: c.brut, obtenu: r.ok ? r.valeur.content : `ERREUR ${r.erreur.message}`, attendu: c.attendu });
        // Dans tous les cas, rawContent conserve la réponse INTÉGRALE : c'est ce qui
        // permet de diagnostiquer une réponse IA bancale en ?debug.
        assert(r.ok && r.valeur.rawContent === c.brut,
            `[${c.ref}] ${c.nom} — rawContent conserve la réponse intégrale`,
            r.ok ? r.valeur.rawContent : null);
    }

    // --- 5.9 : JSON tronqué (le LLM a été coupé) -----------------------------
    let r = await extraire('{"titre":"Volcans","items":[{"a":1}');
    assert(r.ok && r.valeur.content.startsWith('{"titre"'),
        '[5.9] Un JSON tronqué est renvoyé tel quel (le healer aval s\'en charge)',
        r.ok ? r.valeur.content : r.erreur.message);

    // --- 5.10 : contenu vide -------------------------------------------------
    r = await extraire('');
    assert(!r.ok && /vide|inattendu/i.test(r.erreur.message),
        '[5.10] Un contenu vide lève une erreur explicite',
        r.ok ? `aucune erreur (content=${r.valeur.content})` : r.erreur.message);

    r = await extraire(null);
    assert(!r.ok, '[5.11] Un contenu `null` lève également (et ne rend pas "null")',
        r.ok ? r.valeur.content : null);

    // --- 5.12 : texte sans le moindre JSON -----------------------------------
    r = await extraire('Je ne peux pas répondre à cette demande.');
    assert(r.ok && r.valeur.content === 'Je ne peux pas répondre à cette demande.',
        '[5.12] Un refus en texte brut est remonté tel quel (le parse aval le signalera)',
        r.ok ? r.valeur.content : r.erreur.message);

    retirerFauxServeur();
    endStep();
}

// ============================================================================
// ÉTAPE 6 — Registre des modèles
// ============================================================================

function runStep6_Modeles() {
    beginStep(6, STEP_NAMES[6]);

    const ids = AVAILABLE_MODELS.map(m => m.id);

    assert(ids.includes(DEFAULT_MODEL),
        '[6.1] DEFAULT_MODEL figure dans AVAILABLE_MODELS',
        { DEFAULT_MODEL, ids });

    assert(new Set(ids).size === ids.length,
        '[6.2] Aucun identifiant de modèle en double',
        ids.filter((id, i) => ids.indexOf(id) !== i));

    for (const m of AVAILABLE_MODELS) {
        assert(!!m.id && !!m.type,
            `[6.3] Le modèle ${m.id || '(sans id)'} déclare id et type`, m);
    }

    const featured = AVAILABLE_MODELS.filter(m => m.featured);
    assert(featured.length === 3,
        '[6.4] Exactement 3 modèles sont mis en avant dans l\'UI',
        featured.map(m => m.id));

    const ordres = featured.map(m => m.order).sort((a, b) => a - b);
    assert(JSON.stringify(ordres) === JSON.stringify([1, 2, 3]),
        '[6.5] Les modèles mis en avant portent les rangs 1, 2 et 3 (sans trou ni doublon)',
        ordres);

    const defaut = AVAILABLE_MODELS.find(m => m.id === DEFAULT_MODEL);
    assert(defaut && defaut.featured === true,
        '[6.6] Le modèle par défaut est visible sans ?debug (featured)', defaut);

    // Les surcharges par activité sont un piège classique : une clé mal orthographiée
    // est silencieusement ignorée, et l'activité repart sur DEFAULT_MODEL sans bruit.
    const surcharges = Object.entries(ACTIVITY_MODEL_OVERRIDES);
    for (const [moduleKey, modelId] of surcharges) {
        assert(!!allModules[moduleKey],
            `[6.7] La surcharge ${moduleKey} désigne un module existant`,
            { moduleKey, connu: false });
        assert(ids.includes(modelId),
            `[6.8] La surcharge ${moduleKey} → ${modelId} désigne un modèle existant`,
            { modelId, ids });
    }
    if (!surcharges.length) {
        assert(true, '[6.9] Aucune surcharge active (toutes les activités passent par DEFAULT_MODEL)');
    }

    endStep();
}

// ============================================================================
// ÉTAPE 7 — Sélecteur de modèles (DOM) + restauration
// ============================================================================

function runStep7_SelecteurEtRestauration() {
    beginStep(7, STEP_NAMES[7]);

    const CLE = '__test_llm__';
    const hote = document.createElement('div');
    hote.style.display = 'none';
    const dropdown = document.createElement('ul');
    dropdown.id = `model-selector-dropdown-${CLE}`;
    hote.appendChild(dropdown);
    document.body.appendChild(hote);

    const traductions = {
        llm_model_parameters: 'Paramètres',
        llm_model_source: 'Source',
        llm_model_parameters_unit: 'milliards',
        llm_default_summary: '{name} par {company} ({params})'
    };

    try {
        let choisi = null;
        populateModelSelector(CLE, AVAILABLE_MODELS, (id) => { choisi = id; },
            DEFAULT_MODEL, traductions);

        const items = [...dropdown.querySelectorAll('li')];
        const featured = AVAILABLE_MODELS.filter(m => m.featured);

        // Hors ?debug, seuls les modèles mis en avant sont proposés. La suite tourne
        // sur test-all.html sans ?debug → on attend les 3 featured.
        const attendu = new URLSearchParams(window.location.search).has('debug')
            ? AVAILABLE_MODELS.filter(m => m.type === 'text-generation' || m.type === 'image-text-to-text').length
            : featured.length;
        assert(items.length === attendu,
            `[7.1] Le sélecteur propose ${attendu} modèle(s)`,
            { obtenu: items.length, ids: items.map(i => i.dataset.modelId) });

        assert(items.every(i => !!i.dataset.modelId),
            '[7.2] Chaque entrée porte son data-model-id');
        assert(items.every(i => i.getAttribute('role') === 'menuitem' && i.getAttribute('tabindex') === '0'),
            '[7.3] Chaque entrée est atteignable au clavier (role + tabindex)');

        if (!new URLSearchParams(window.location.search).has('debug')) {
            const ordreAttendu = featured.slice().sort((a, b) => a.order - b.order).map(m => m.id);
            assert(JSON.stringify(items.map(i => i.dataset.modelId)) === JSON.stringify(ordreAttendu),
                '[7.4] Les modèles sont rendus dans l\'ordre déclaré par `order`',
                { obtenu: items.map(i => i.dataset.modelId), attendu: ordreAttendu });
        } else {
            assert(true, '[7.4] Ordre non vérifié en mode ?debug (tous les modèles sont affichés)');
        }

        const selectionnes = items.filter(i => i.classList.contains('selected'));
        assert(selectionnes.length === 1 && selectionnes[0].dataset.modelId === DEFAULT_MODEL,
            '[7.5] Le modèle courant, et lui seul, porte la classe `selected`',
            selectionnes.map(i => i.dataset.modelId));

        // Aucune clé i18n ne doit s'afficher BRUTE à l'utilisateur.
        const texte = dropdown.textContent;
        assert(!/llm_[a-z_]+/.test(texte),
            '[7.6] Aucune clé i18n non résolue n\'apparaît dans le sélecteur',
            (texte.match(/llm_[a-z_]+/g) || []).slice(0, 5));

        // Sélection au clic
        const cible = items.find(i => i.dataset.modelId !== DEFAULT_MODEL) || items[0];
        cible.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        assert(choisi === cible.dataset.modelId,
            '[7.7] Un clic remonte l\'identifiant du modèle au callback',
            { choisi, attendu: cible.dataset.modelId });
        assert(cible.classList.contains('selected')
            && dropdown.querySelectorAll('li.selected').length === 1,
            '[7.8] Après clic, la sélection visuelle est déplacée (une seule entrée)');

        // Sélection au clavier (Entrée)
        choisi = null;
        items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        assert(choisi === items[0].dataset.modelId,
            '[7.9] La touche Entrée sélectionne le modèle focalisé', choisi);

        choisi = null;
        items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        assert(choisi === items[0].dataset.modelId,
            '[7.10] La touche Espace sélectionne également', choisi);

        // Un conteneur absent ne doit pas faire tomber la page.
        let aLeve = false;
        try {
            populateModelSelector('__inexistant__', AVAILABLE_MODELS, () => {}, DEFAULT_MODEL, traductions);
        } catch { aLeve = true; }
        assert(!aLeve, '[7.11] Un conteneur absent est ignoré sans lever');
    } finally {
        hote.remove();
    }

    // --- Restauration des constantes -----------------------------------------
    // Un test qui laisserait POLL_TIMINGS à 1 ms contaminerait l'application entière
    // (la suite tourne dans la même page que le produit).
    assert(POLL_TIMINGS.initialDelayMs === 5000,
        '[7.12] POLL_TIMINGS.initialDelayMs est revenu à 5000 ms', POLL_TIMINGS.initialDelayMs);
    assert(POLL_TIMINGS.intervalMs === 3000,
        '[7.13] POLL_TIMINGS.intervalMs est revenu à 3000 ms', POLL_TIMINGS.intervalMs);
    assert(POLL_TIMINGS.timeoutMs === 300000,
        '[7.14] POLL_TIMINGS.timeoutMs est revenu à 300000 ms (5 min)', POLL_TIMINGS.timeoutMs);
    assert(window.fetch === vraiFetch,
        '[7.15] window.fetch a bien été restauré (le faux serveur n\'est plus en place)');

    // `generateH5PWithLLM` reste le wrapper historique : sa présence et sa signature
    // sont contractuelles pour ui.js et llm-batch.js.
    assert(typeof generateH5PWithLLM === 'function' && generateH5PWithLLM.length === 3,
        '[7.16] generateH5PWithLLM(prompt, model, activityMeta) conserve sa signature',
        generateH5PWithLLM.length);
    assert(typeof generateRawWithLLM === 'function',
        '[7.17] generateRawWithLLM reste exporté (brique de llm-batch.js)');

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== services/llm.js (proxy n8n) ===');

    try {
        await runStep1_Submit();
        await runStep2_PollingNominal();
        await runStep3_StatutsErreur();
        await runStep4_ReseauEtTimeout();
        await runStep5_ExtractionJson();
        runStep6_Modeles();
    } finally {
        // Quoi qu'il arrive, on rend à l'application son fetch et son cadencement.
        retirerFauxServeur();
        restaurerPolling();
    }
    runStep7_SelecteurEtRestauration();

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
