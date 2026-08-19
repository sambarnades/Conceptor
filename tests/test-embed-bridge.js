/**
 * @file Pont d'embarquement (`js/embed/embed-bridge.js`) — mode `?embed`.
 *
 * Module resté sans couverture : il n'est chargé qu'en mode embarqué, donc aucune
 * suite ne le traversait. C'est pourtant la SEULE surface de Caramel qui accepte des
 * ordres venus d'une autre page (`postMessage`) — la partie où un défaut a le plus de
 * conséquences.
 *
 * Le module expose déjà `__testHooks` : la présente suite s'en sert pour vérifier le
 * contrôle d'origine sans avoir à ouvrir une vraie page parente.
 *
 * Couvre :
 *   1. la détection du mode embarqué et la résolution de l'origine autorisée ;
 *   2. le PRÉ-REMPLISSAGE (`applyInit`) contre le vrai formulaire ;
 *   3. le FAIL-CLOSED : sans origine résolue, aucun message entrant n'est traité ;
 *   4. le rejet des messages d'une origine ou d'une forme non conformes.
 *
 * Tourne dans l'iframe `index.html` (formulaire réel).
 */

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
    1: 'Détection du mode embarqué',
    2: 'Pré-remplissage du contexte (applyInit)',
    3: 'Sécurité : fail-closed et contrôle d\'origine',
    4: 'Robustesse des messages entrants'
};

export const STEP_DESCRIPTIONS = {
    1: 'isEmbedded / resolveAllowedOrigin ne lèvent jamais et rendent un type stable.',
    2: 'applyInit remplit les champs réels et rend la liste de ce qui a été appliqué.',
    3: 'Sans origine parente résolue, AUCUN message n\'est traité (fail-closed).',
    4: 'Messages malformés, d\'origine étrangère ou de type inconnu : ignorés sans lever.'
};

let _seq = 0;

function dansIframe(doc, win, corps) {
    const cle = `__embed_test_${++_seq}`;
    return new Promise((resolve) => {
        const minuteur = setTimeout(() => resolve({ ERREUR: 'délai dépassé (10 s)' }), 10000);
        win[cle] = (valeur) => { clearTimeout(minuteur); delete win[cle]; resolve(valeur); };
        const s = doc.createElement('script');
        s.type = 'module';
        s.textContent = `
            (async () => {
                try { window['${cle}'](await (async () => { ${corps} })()); }
                catch (e) { window['${cle}']({ ERREUR: String((e && e.message) || e) }); }
            })();
        `;
        doc.body.appendChild(s);
    });
}

const estErreur = (v) => !!(v && typeof v === 'object' && 'ERREUR' in v);

// ============================================================================
// ÉTAPE 1 — Détection du mode embarqué
// ============================================================================

async function runStep1_Detection(doc, win) {
    beginStep(1, STEP_NAMES[1]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/embed/embed-bridge.js');
        const out = {};
        out.api = ['isEmbedded', 'resolveAllowedOrigin', 'applyInit', 'initEmbedBridge']
            .every(n => typeof m[n] === 'function');
        out.hooks = !!m.__testHooks && typeof m.__testHooks === 'object';
        out.protocole = m.__testHooks && m.__testHooks.PROTOCOL_VERSION;
        try { out.embarque = m.isEmbedded(); } catch (e) { out.embarque = { ERREUR: String(e.message || e) }; }
        try { out.origine = m.resolveAllowedOrigin(); } catch (e) { out.origine = { ERREUR: String(e.message || e) }; }
        // Appels répétés : ces fonctions sont des lectures pures, elles doivent être stables.
        try { out.stable = m.isEmbedded() === out.embarque; } catch (e) { out.stable = false; }
        return out;
    `);

    if (estErreur(r)) { assert(false, '[1.0] Le module embed-bridge.js est exploitable', r); endStep(); return; }

    assert(r.api === true, '[1.1] embed-bridge expose isEmbedded / resolveAllowedOrigin / applyInit / initEmbedBridge');
    assert(r.hooks === true, '[1.2] embed-bridge expose __testHooks');
    assert(r.protocole !== undefined && r.protocole !== null,
        '[1.3] La version de protocole est définie', { protocole: r.protocole });
    assert(typeof r.embarque === 'boolean',
        '[1.4] isEmbedded rend un booléen sans lever', { obtenu: r.embarque });
    assert(r.embarque === false,
        '[1.5] Hors mode ?embed, isEmbedded rend false', { obtenu: r.embarque });
    assert(r.origine === null || typeof r.origine === 'string',
        '[1.6] resolveAllowedOrigin rend null ou une origine, sans lever', { obtenu: r.origine });
    assert(r.stable === true, '[1.7] isEmbedded est stable d\'un appel à l\'autre');

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Pré-remplissage
// ============================================================================

async function runStep2_ApplyInit(doc, win) {
    beginStep(2, STEP_NAMES[2]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/embed/embed-bridge.js');
        const out = {};
        const lire = (id) => document.getElementById(id)?.value ?? null;
        const avant = { qui: lire('qui'), quoi: lire('quoi'), niveau: lire('niveau') };

        out.applique = m.applyInit({ qui: 'des CM2', quoi: 'les volcans', niveau: 'CM2' });
        out.valeurs = { qui: lire('qui'), quoi: lire('quoi'), niveau: lire('niveau') };

        out.vide = m.applyInit({});
        out.sansArgument = m.applyInit();
        out.nulls = m.applyInit({ qui: null, quoi: undefined });
        out.cleInconnue = m.applyInit({ __inexistant__: 'x' });

        // Restauration de l'état initial pour ne pas polluer les suites suivantes.
        m.applyInit({ qui: avant.qui ?? '', quoi: avant.quoi ?? '', niveau: avant.niveau ?? '' });
        out.restaure = { qui: lire('qui'), quoi: lire('quoi'), niveau: lire('niveau') };
        out.attendu = avant;
        return out;
    `);

    if (estErreur(r)) { assert(false, '[2.0] applyInit est exploitable', r); endStep(); return; }

    assert(Array.isArray(r.applique), '[2.1] applyInit rend un tableau', { obtenu: r.applique });
    assert(Array.isArray(r.applique) && ['qui', 'quoi', 'niveau'].every(k => r.applique.includes(k)),
        '[2.2] applyInit signale les trois champs appliqués', { obtenu: r.applique });
    assert(r.valeurs && r.valeurs.qui === 'des CM2' && r.valeurs.quoi === 'les volcans' && r.valeurs.niveau === 'CM2',
        '[2.3] applyInit écrit réellement dans les champs du formulaire', { obtenu: r.valeurs });
    assert(Array.isArray(r.vide) && r.vide.length === 0,
        '[2.4] applyInit({}) n\'applique rien', { obtenu: r.vide });
    assert(Array.isArray(r.sansArgument) && r.sansArgument.length === 0,
        '[2.5] applyInit() sans argument ne lève pas et n\'applique rien', { obtenu: r.sansArgument });
    assert(Array.isArray(r.nulls) && r.nulls.length === 0,
        '[2.6] applyInit ignore les valeurs null/undefined', { obtenu: r.nulls });
    assert(Array.isArray(r.cleInconnue) && r.cleInconnue.length === 0,
        '[2.7] applyInit ignore une clé inconnue', { obtenu: r.cleInconnue });
    assert(JSON.stringify(r.restaure) === JSON.stringify(r.attendu),
        '[2.8] L\'état initial du formulaire a été restauré',
        { avant: r.attendu, apres: r.restaure });

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Sécurité : fail-closed et contrôle d'origine
// ============================================================================

async function runStep3_Securite(doc, win) {
    beginStep(3, STEP_NAMES[3]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/embed/embed-bridge.js');
        const hooks = m.__testHooks;
        const out = {};
        if (!hooks || typeof hooks.onParentMessage !== 'function') {
            return { ERREUR: '__testHooks.onParentMessage indisponible' };
        }
        const lire = () => document.getElementById('qui')?.value ?? null;
        const avant = lire();

        // Le pont n'a PAS été initialisé (pas de mode ?embed) : \`allowedOrigin\` est null,
        // donc le fail-closed doit rejeter même un message parfaitement formé.
        const msg = (origin, data) => ({ origin, data });
        try {
            hooks.onParentMessage(msg('https://exemple.org',
                { type: 'caramel:init', payload: { qui: 'INJECTION' } }));
            out.failClosed = lire() !== 'INJECTION';
            out.valeurApres = lire();
        } catch (e) { out.failClosed = { ERREUR: String(e.message || e) }; }

        // Origine étrangère explicite.
        try {
            hooks.onParentMessage(msg('https://attaquant.example',
                { type: 'caramel:init', payload: { qui: 'INJECTION2' } }));
            out.origineEtrangere = lire() !== 'INJECTION2';
        } catch (e) { out.origineEtrangere = { ERREUR: String(e.message || e) }; }

        // Restauration.
        m.applyInit({ qui: avant ?? '' });
        out.restaure = lire() === avant;
        return out;
    `);

    if (estErreur(r)) { assert(false, '[3.0] Les hooks de test du pont sont exploitables', r); endStep(); return; }

    assert(r.failClosed === true,
        '[3.1] FAIL-CLOSED : sans origine parente résolue, un message caramel:init est ignoré',
        { valeurApres: r.valeurApres, gravite: 'une page tierce ne doit jamais pouvoir piloter Caramel' });
    assert(r.origineEtrangere === true,
        '[3.2] Un message d\'une origine non autorisée est ignoré', { obtenu: r.origineEtrangere });
    assert(r.restaure === true, '[3.3] L\'état du formulaire a été restauré après les essais');

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Robustesse des messages entrants
// ============================================================================

async function runStep4_Robustesse(doc, win) {
    beginStep(4, STEP_NAMES[4]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/embed/embed-bridge.js');
        const hooks = m.__testHooks;
        if (!hooks || typeof hooks.onParentMessage !== 'function') {
            return { ERREUR: '__testHooks.onParentMessage indisponible' };
        }
        const cas = [
            ['sans data',        { origin: 'https://x.org' }],
            ['data null',        { origin: 'https://x.org', data: null }],
            ['data chaine',      { origin: 'https://x.org', data: 'coucou' }],
            ['data nombre',      { origin: 'https://x.org', data: 42 }],
            ['data tableau',     { origin: 'https://x.org', data: [1, 2] }],
            ['type absent',      { origin: 'https://x.org', data: {} }],
            ['type non-chaine',  { origin: 'https://x.org', data: { type: 7 } }],
            ['type hors prefixe',{ origin: 'https://x.org', data: { type: 'autre:chose' } }],
            ['type inconnu',     { origin: 'https://x.org', data: { type: 'caramel:__inconnu__' } }],
            ['payload absent',   { origin: 'https://x.org', data: { type: 'caramel:init' } }],
            ['payload nul',      { origin: 'https://x.org', data: { type: 'caramel:init', payload: null } }],
            ['origine absente',  { data: { type: 'caramel:init', payload: {} } }],
            ['evenement vide',   {}]
        ];
        const leves = [];
        for (const [nom, ev] of cas) {
            try { hooks.onParentMessage(ev); }
            catch (e) { leves.push(nom + ' : ' + String(e.message || e)); }
        }
        return { total: cas.length, leves };
    `);

    if (estErreur(r)) { assert(false, '[4.0] Les hooks de test du pont sont exploitables', r); endStep(); return; }

    assert(Array.isArray(r.leves) && r.leves.length === 0,
        `[4.1] Les ${r.total} formes de message dégradées sont ignorées sans lever`,
        { leves: r.leves });

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests(iframeDoc, iframeWindow) {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Pont d\'embarquement ===');

    if (!iframeDoc || !iframeWindow) {
        assert(false, '[0] iframe et window requis pour cette suite');
        return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
    }

    await runStep1_Detection(iframeDoc, iframeWindow);
    await runStep2_ApplyInit(iframeDoc, iframeWindow);
    await runStep3_Securite(iframeDoc, iframeWindow);
    await runStep4_Robustesse(iframeDoc, iframeWindow);

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
