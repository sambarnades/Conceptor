/**
 * run_safe_storage_tests.mjs — Tests unitaires de `safeSession` / `safeLocal` (js/core/utils.js).
 *
 * Vérifie que le stockage web ne fait JAMAIS remonter d'exception à l'appelant, quel que soit
 * le mode d'échec : globale inaccessible (SecurityError), quota atteint (QuotaExceededError),
 * ou révocation en cours de session. Vérifie aussi que `keys()` renvoie un instantané, ce qui
 * rend sûre la suppression pendant l'itération.
 *
 * Lancement :  node tests/run_safe_storage_tests.mjs
 * Dépendance : bootstrap.mjs (stubs DOM) car utils.js importe translation/notifications/sanitizer.
 */
import './roundtrip/bootstrap.mjs';
const { safeSession, safeLocal } = await import('../js/core/utils.js');

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; }
    else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}

function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}

/**
 * Remplace globalThis.sessionStorage le temps d'un test, puis restaure.
 * `descriptor` permet de simuler une globale qui LÈVE à la simple lecture.
 */
function withSessionStorage(descriptor, fn) {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
    Object.defineProperty(globalThis, 'sessionStorage', { ...descriptor, configurable: true });
    try { return fn(); }
    finally {
        if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
        else delete globalThis.sessionStorage;
    }
}

/** Fabrique un stockage en mémoire, éventuellement piégé sur une opération. */
function makeStore({ throwOn = null, error = null } = {}) {
    const m = new Map();
    const boom = (op) => {
        if (throwOn === op) throw (error || new Error('boom'));
    };
    return {
        getItem: (k) => { boom('getItem'); return m.has(k) ? m.get(k) : null; },
        setItem: (k, v) => { boom('setItem'); m.set(k, String(v)); },
        removeItem: (k) => { boom('removeItem'); m.delete(k); },
        key: (i) => { boom('key'); return Array.from(m.keys())[i] ?? null; },
        get length() { if (throwOn === 'length') throw (error || new Error('boom')); return m.size; },
        _map: m
    };
}

const quotaError = () => {
    const e = new Error('quota'); e.name = 'QuotaExceededError'; return e;
};
const securityError = () => {
    const e = new Error('blocked'); e.name = 'SecurityError'; return e;
};

// =======================================================================
// 1. Chemin nominal — le wrapper doit être transparent
// =======================================================================
withSessionStorage({ value: makeStore() }, () => {
    eq('set() nominal renvoie true', safeSession.set('caramel_a', 'x'), true);
    eq('get() relit la valeur', safeSession.get('caramel_a'), 'x');
    eq('get() sur clé absente renvoie null', safeSession.get('caramel_absent'), null);
    eq('remove() nominal renvoie true', safeSession.remove('caramel_a'), true);
    eq('get() après remove renvoie null', safeSession.get('caramel_a'), null);
});

// Coercition en chaîne, comme le fait setItem natif
withSessionStorage({ value: makeStore() }, () => {
    safeSession.set('caramel_n', 42);
    eq('set() coerce les nombres en chaîne', safeSession.get('caramel_n'), '42');
    safeSession.set('caramel_zero', 0);
    eq('set(0) stocke bien "0" (et non "")', safeSession.get('caramel_zero'), '0');
});

// =======================================================================
// 2. keys() — instantané et filtrage
// =======================================================================
withSessionStorage({ value: makeStore() }, () => {
    safeSession.set('caramel_json_A', '1');
    safeSession.set('caramel_prompt_A', '2');
    safeSession.set('autre', '3');
    const keys = safeSession.keys();
    eq('keys() liste toutes les clés', keys.sort(), ['autre', 'caramel_json_A', 'caramel_prompt_A']);

    // Le point clef : supprimer PENDANT l'itération sur l'instantané ne saute aucune clé.
    // Une boucle naïve sur store.key(i) en supprimant décale les index et en oublie la moitié.
    safeSession.keys()
        .filter(k => k.startsWith('caramel_'))
        .forEach(k => safeSession.remove(k));
    eq('keys() est un instantané : suppression pendant itération complète', safeSession.keys(), ['autre']);
});

// =======================================================================
// 3. Quota atteint sur setItem — ne doit pas lever, doit renvoyer false
// =======================================================================
withSessionStorage({ value: makeStore({ throwOn: 'setItem', error: quotaError() }) }, () => {
    let threw = false, res;
    try { res = safeSession.set('caramel_a', 'x'); } catch { threw = true; }
    ok('set() ne lève pas sur QuotaExceededError', !threw);
    eq('set() renvoie false quand le quota est atteint', res, false);
});

// =======================================================================
// 4. Globale inaccessible (SecurityError à la LECTURE de sessionStorage)
// =======================================================================
withSessionStorage({ get() { throw securityError(); } }, () => {
    let threw = false;
    let g, s, r, k;
    try {
        g = safeSession.get('caramel_a');
        s = safeSession.set('caramel_a', 'x');
        r = safeSession.remove('caramel_a');
        k = safeSession.keys();
    } catch { threw = true; }
    ok('aucune opération ne lève quand la globale est bloquée', !threw);
    eq('get() renvoie null si stockage bloqué', g, null);
    eq('set() renvoie false si stockage bloqué', s, false);
    eq('remove() renvoie false si stockage bloqué', r, false);
    eq('keys() renvoie [] si stockage bloqué', k, []);
});

// =======================================================================
// 5. Révocation en cours de session (getItem/removeItem/length lèvent)
// =======================================================================
withSessionStorage({ value: makeStore({ throwOn: 'getItem' }) }, () => {
    let threw = false, res;
    try { res = safeSession.get('caramel_a'); } catch { threw = true; }
    ok('get() ne lève pas si getItem est révoqué', !threw);
    eq('get() renvoie null si getItem lève', res, null);
});

withSessionStorage({ value: makeStore({ throwOn: 'removeItem' }) }, () => {
    let threw = false, res;
    try { res = safeSession.remove('caramel_a'); } catch { threw = true; }
    ok('remove() ne lève pas si removeItem est révoqué', !threw);
    eq('remove() renvoie false si removeItem lève', res, false);
});

withSessionStorage({ value: makeStore({ throwOn: 'length' }) }, () => {
    let threw = false, res;
    try { res = safeSession.keys(); } catch { threw = true; }
    ok('keys() ne lève pas si length est révoqué', !threw);
    eq('keys() renvoie [] si length lève', res, []);
});

withSessionStorage({ value: makeStore({ throwOn: 'key' }) }, () => {
    // length répond mais key() lève → doit dégrader en []
    const store = makeStore({ throwOn: 'key' });
    store._map.set('a', '1');
    let threw = false, res;
    try { res = safeSession.keys(); } catch { threw = true; }
    ok('keys() ne lève pas si key() est révoqué', !threw);
    eq('keys() dégrade en [] si key() lève', res, []);
});

// =======================================================================
// 6. safeLocal existe et suit le même contrat
// =======================================================================
ok('safeLocal expose get/set/remove/keys',
    typeof safeLocal.get === 'function' && typeof safeLocal.set === 'function'
    && typeof safeLocal.remove === 'function' && typeof safeLocal.keys === 'function');

{
    // localStorage est stubbé en Map par bootstrap.mjs → chemin nominal
    const wrote = safeLocal.set('caramel_test_local', 'v');
    eq('safeLocal.set() nominal', wrote, true);
    eq('safeLocal.get() nominal', safeLocal.get('caramel_test_local'), 'v');
    safeLocal.remove('caramel_test_local');
    eq('safeLocal.remove() nominal', safeLocal.get('caramel_test_local'), null);
}

// =======================================================================
// Bilan
// =======================================================================
console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`safeStorage : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
