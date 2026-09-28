/**
 * bootstrap.mjs — Environnement Node minimal pour exécuter le pipeline d'export Caramel.
 *
 * OBJECTIF : mesurer la fidélité d'export (idempotence, déterminisme) HORS navigateur,
 * sans build ni npm. On charge directement les modules Caramel (json-healer, processors,
 * h5p-creator) qui sont des modules ES purs. Le problème : ces modules importent en
 * cascade `core/translation.js` / `ui/ui.js` / `ui/notifications.js` qui accèdent à
 * `document.*` AU MOMENT DE L'ÉVALUATION du module (pas seulement à l'exécution).
 *
 * Stratégie :
 *   1. NEUTRALISER le non-déterminisme (Math.random seedé, Date figée) — AVANT tout import.
 *   2. STUBBER le strict minimum de globals navigateur pour que les modules s'évaluent
 *      sans crash, en retournant null / no-op partout (aucun effet sur l'output d'export).
 *   3. Fournir un chargeur de vendors qui peuple les globals attendus (window.JSZip,
 *      window.fflate, window.Tar) comme le ferait `core/lib-loader.js` en vrai.
 *
 * IMPORTANT — TOUT stub est tracé dans STUB_LOG. Aucun stub ne doit influencer le
 * contenu d'un export. Si un stub renvoyait autre chose que null/no-op et que ça
 * changeait l'output, il faut le signaler bruyamment.
 *
 * Ce fichier DOIT être importé en tout premier (avant n'importe quel module Caramel).
 */

// ===========================================================================
// 0. Journal des stubs (transparence sur les caveats de fidélité)
// ===========================================================================

export const STUB_LOG = [];
function logStub(name, detail) {
    STUB_LOG.push({ name, detail });
}

// ===========================================================================
// 1. Non-déterminisme neutralisé — DOIT venir avant tout import Caramel
// ===========================================================================

const FROZEN_EPOCH = Date.UTC(2026, 5, 16, 12, 0, 0); // 2026-06-16T12:00:00Z, constante

// --- PRNG seedé (mulberry32) — remplace Math.random ---
let _seedState = 0x9e3779b9 >>> 0; // graine constante
function mulberry32() {
    _seedState |= 0;
    _seedState = (_seedState + 0x6d2b79f5) | 0;
    let t = Math.imul(_seedState ^ (_seedState >>> 15), 1 | _seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Réinitialise le PRNG à sa graine de départ (à appeler avant chaque run pour reproductibilité). */
export function resetRandom(seed = 0x9e3779b9) {
    _seedState = seed >>> 0;
}

const _realRandom = Math.random;
Math.random = mulberry32;
logStub('Math.random', 'remplacé par mulberry32 seedé (graine 0x9e3779b9) — neutralise les mélanges aléatoires (DragAndDrop, QuizSet, grilles)');

// --- Date figée ---
const _RealDate = Date;
class FrozenDate extends _RealDate {
    constructor(...args) {
        if (args.length === 0) {
            super(FROZEN_EPOCH);
        } else {
            super(...args);
        }
    }
    static now() {
        return FROZEN_EPOCH;
    }
}
globalThis.Date = FrozenDate;
logStub('Date', `figée à epoch ${FROZEN_EPOCH} (2026-06-16T12:00:00Z) — neutralise Date.now()/new Date() dans les noms de fichiers et timestamps`);

/** Restaure les fonctions réelles (rarement utile, pour debug). */
export function restoreNondeterminism() {
    Math.random = _realRandom;
    globalThis.Date = _RealDate;
}

// ===========================================================================
// 2. Stubs globals navigateur (minimaux, no-op / null)
// ===========================================================================

// --- window === globalThis (pattern reconnu par les `typeof window !== 'undefined'`) ---
// On expose une URL sans ?debug pour garder DEBUG=false (sorties console propres,
// et surtout aucun chemin de code "debug" qui clonerait/loggerait différemment).
if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
    logStub('window', 'window = globalThis');
}
if (typeof globalThis.location === 'undefined') {
    globalThis.location = { search: '', href: 'http://localhost/', pathname: '/' };
    logStub('window.location', "{ search:'', href:'http://localhost/' } — DEBUG reste false");
}

// --- requestIdleCallback : no-op qui NE déclenche JAMAIS le callback ---
// utils.js fait `requestIdleCallback(() => preloadSanitizer())`. preloadSanitizer
// chargerait DOMPurify via lib-loader (createElement('script') → fetch réseau).
// En ne déclenchant pas le callback, on évite tout effet de bord réseau/DOM.
// Idem setTimeout du fallback : on le neutralise pour les callbacks de préchargement.
if (typeof globalThis.requestIdleCallback === 'undefined') {
    globalThis.requestIdleCallback = () => 0;
    logStub('requestIdleCallback', 'no-op (ne déclenche pas le callback → pas de préchargement DOMPurify/réseau)');
}
if (typeof globalThis.cancelIdleCallback === 'undefined') {
    globalThis.cancelIdleCallback = () => {};
}

// --- Élément DOM factice : tout est null/no-op, dataset = objet vide ---
function makeStubElement(tag = 'div') {
    const el = {
        tagName: String(tag).toUpperCase(),
        nodeType: 1,
        dataset: {},
        style: {},
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        children: [],
        childNodes: [],
        attributes: {},
        value: '',
        textContent: '',
        innerHTML: '',
        setAttribute() {},
        getAttribute() { return null; },
        removeAttribute() {},
        appendChild(c) { return c; },
        removeChild(c) { return c; },
        insertBefore(c) { return c; },
        remove() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() { return true; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        cloneNode() { return makeStubElement(tag); },
        focus() {},
        click() {}
    };
    return el;
}

// --- document : querySelector/getElementById → null, createElement → stub, body/head ---
// Les seuls accès au moment de l'évaluation des modules sont :
//   translation.js / ui.js / notifications.js → document.querySelector / getElementById
//   (résultat null toléré), document.addEventListener (no-op).
//   lib-loader.loadScript → createElement('script') + body.appendChild (jamais déclenché
//   ici car on stubbe les loaders réseau, mais on fournit createElement par sécurité).
// Capture des CustomEvent dispatchés sur document (ex: generation:complete porte le blob
// .mbz/.xml produit par les handlers Moodle qui ne RETOURNENT pas le blob).
const _dispatchedEvents = [];
/** Vide et renvoie les events dispatchés depuis le dernier appel. */
export function drainDispatchedEvents() {
    const out = _dispatchedEvents.splice(0, _dispatchedEvents.length);
    return out;
}
/** Renvoie le dernier event d'un type donné (sans vider). */
export function lastDispatched(type) {
    for (let i = _dispatchedEvents.length - 1; i >= 0; i--) {
        if (_dispatchedEvents[i].type === type) return _dispatchedEvents[i];
    }
    return null;
}

if (typeof globalThis.document === 'undefined') {
    const _body = makeStubElement('body');
    const _head = makeStubElement('head');
    const _docEl = makeStubElement('html');
    globalThis.document = {
        body: _body,
        head: _head,
        documentElement: _docEl,
        createElement: (tag) => makeStubElement(tag),
        createElementNS: (_ns, tag) => makeStubElement(tag),
        createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), textContent: String(t) }),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementsByClassName: () => [],
        getElementsByTagName: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: (ev) => { _dispatchedEvents.push({ type: ev?.type, detail: ev?.detail }); return true; },
        createEvent: () => ({ initEvent() {} })
    };
    logStub('document', 'querySelector/getElementById→null, querySelectorAll→[], createElement→stub élément, addEventListener→no-op, dispatchEvent→capture (récupère blob des events generation:complete)');
}

// --- CustomEvent / Event : no-op (h5p-creator dispatch des events de fin de génération) ---
if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent {
        constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    };
    logStub('CustomEvent', 'classe minimale {type, detail} — events generation:* ignorés');
}
if (typeof globalThis.Event === 'undefined') {
    globalThis.Event = class Event { constructor(type) { this.type = type; } };
}

// --- navigator : userAgent neutre ---
if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = { userAgent: 'node-roundtrip-harness', language: 'fr-FR', languages: ['fr-FR'] };
    logStub('navigator', "userAgent='node-roundtrip-harness'");
}

// --- localStorage / sessionStorage : Map en mémoire (caramel_ préfixe) ---
function makeStorage() {
    const m = new Map();
    return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)); },
        removeItem: (k) => { m.delete(k); },
        clear: () => m.clear(),
        key: (i) => Array.from(m.keys())[i] ?? null,
        get length() { return m.size; }
    };
}
if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = makeStorage();
    globalThis.sessionStorage = makeStorage();
    logStub('localStorage/sessionStorage', 'Map en mémoire');
}

// --- URLSearchParams existe en Node ; URL aussi. Rien à stubber. ---

// ===========================================================================
// 3. Chargeur de vendors (peuple les globals comme core/lib-loader.js)
// ===========================================================================

const VENDOR_PATHS = {
    JSZIP: '../../js/vendor/jszip/3.10.2/jszip.min.js',
    FFLATE: '../../js/vendor/fflate/0.8.3/index.js',
    TAR_JS: '../../js/vendor/tar-js/0.3.0/tar.bundle.js',
    CLIENT_ZIP: '../../js/vendor/client-zip/2.5.1/index.js'
};

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Évalue un bundle UMD/IIFE qui s'attend à s'attacher à un global (`window.X` ou `this.X`).
 * On lit le fichier et on l'exécute dans une fonction avec `window`/`self`/`globalThis`
 * pointant tous sur globalThis, et `module`/`exports` fournis pour la branche CommonJS/UMD.
 * @returns {object} le module.exports résultant (peut être vide si IIFE pur sur window).
 */
async function evalUmdOrIife(relPath) {
    const abs = resolve(__dirname, relPath);
    const code = await readFile(abs, 'utf8');
    const moduleObj = { exports: {} };
    // `Function` plutôt que vm pour rester dépendances-zéro et hériter des globals
    // (Blob, TextEncoder, etc.). On passe window/self/global=globalThis pour que les
    // bundles UMD trouvent leur cible d'attachement.
    const fn = new Function(
        'module', 'exports', 'require', 'window', 'self', 'global', 'globalThis',
        code + '\n;return module.exports;'
    );
    const ret = fn(
        moduleObj, moduleObj.exports, _nodeRequire,
        globalThis, globalThis, globalThis, globalThis
    );
    return ret && (Object.keys(ret).length || typeof ret === 'function') ? ret : moduleObj.exports;
}

import { createRequire } from 'node:module';
const _nodeRequire = createRequire(import.meta.url);

const _vendorState = { jszip: false, fflate: false, tar: false, clientZip: null };

/** Charge JSZip et le place sur window.JSZip (constructeur). */
export async function ensureJSZip() {
    if (_vendorState.jszip && globalThis.JSZip) return globalThis.JSZip;
    const exp = await evalUmdOrIife(VENDOR_PATHS.JSZIP);
    // jszip.min.js (UMD) : soit module.exports = JSZip, soit attaché sur window.JSZip.
    const JSZip = globalThis.JSZip || exp.default || exp;
    globalThis.JSZip = JSZip;
    _vendorState.jszip = true;
    logStub('vendor:JSZip', 'chargé depuis js/vendor/jszip/3.10.2 → window.JSZip');
    return JSZip;
}

/** Charge fflate et le place sur window.fflate. */
export async function ensureFflate() {
    if (_vendorState.fflate && globalThis.fflate) return globalThis.fflate;
    const exp = await evalUmdOrIife(VENDOR_PATHS.FFLATE);
    const fflate = globalThis.fflate || exp;

    // SHIM CRITIQUE pour .mbz : moodle-creator.createMbz() utilise `fflate.gzip(data, opts, cb)`
    // (ASYNCHRONE). En navigateur, fflate.gzip délègue à un Web Worker. En Node, il n'y a pas
    // de Worker (fflate lève « (0,t.default) is not a function ») → createMbz échoue.
    // On redirige l'API async vers `gzipSync` AVEC LES MÊMES OPTIONS (level, mtime) :
    //   - sync vs async ne change QUE le modèle d'exécution (threading), PAS l'octet de sortie
    //     (même algorithme DEFLATE) → sortie BYTE-IDENTIQUE à la version navigateur.
    //   - vérifié : roundtrip gunzipSync(gzipSync(x))===x, et déterministe à mtime fixé.
    // Idem inflate/gunzip async par symétrie. Ce shim NE modifie PAS l'output, il débloque
    // seulement l'exécution en Node. Tracé dans STUB_LOG.
    if (typeof fflate.gzip === 'function' && typeof fflate.gzipSync === 'function') {
        const _origGzip = fflate.gzip;
        fflate.gzip = (data, opts, cb) => {
            // signatures possibles : gzip(data, cb) ou gzip(data, opts, cb)
            const callback = typeof opts === 'function' ? opts : cb;
            const options = typeof opts === 'function' ? {} : (opts || {});
            try {
                const out = fflate.gzipSync(data, options);
                queueMicrotask(() => callback(null, out));
            } catch (e) {
                queueMicrotask(() => callback(e));
            }
            return () => {}; // terminateur no-op (l'API async renvoie un terminateur)
        };
        fflate.gzip._origAsync = _origGzip;
    }
    if (typeof fflate.gunzip === 'function' && typeof fflate.gunzipSync === 'function') {
        fflate.gunzip = (data, opts, cb) => {
            const callback = typeof opts === 'function' ? opts : cb;
            const options = typeof opts === 'function' ? {} : (opts || {});
            try {
                const out = fflate.gunzipSync(data, options);
                queueMicrotask(() => callback(null, out));
            } catch (e) {
                queueMicrotask(() => callback(e));
            }
            return () => {};
        };
    }

    globalThis.fflate = fflate;
    _vendorState.fflate = true;
    logStub('vendor:fflate', 'chargé depuis js/vendor/fflate/0.8.3 → window.fflate ; SHIM : gzip/gunzip async (worker) redirigés vers *Sync (output byte-identique, débloque .mbz en Node)');
    return fflate;
}

/** Charge tar-js et le place sur window.Tar (constructeur). */
export async function ensureTar() {
    if (_vendorState.tar && globalThis.Tar) return globalThis.Tar;
    const exp = await evalUmdOrIife(VENDOR_PATHS.TAR_JS);
    const Tar = globalThis.Tar || exp.Tar || exp.default || exp;
    globalThis.Tar = Tar;
    _vendorState.tar = true;
    logStub('vendor:Tar', 'chargé depuis js/vendor/tar-js/0.3.0 → window.Tar');
    return Tar;
}

/** Charge client-zip (vrai module ES) et retourne downloadZip. */
export async function ensureClientZip() {
    if (_vendorState.clientZip) return _vendorState.clientZip;
    const mod = await import(resolve(__dirname, VENDOR_PATHS.CLIENT_ZIP));
    _vendorState.clientZip = mod.downloadZip;
    logStub('vendor:client-zip', 'import ES module js/vendor/client-zip/2.5.1 → downloadZip');
    return mod.downloadZip;
}

/**
 * Court-circuite les fonctions réseau de core/lib-loader.js pour qu'elles peuplent
 * les globals depuis le disque au lieu d'injecter des <script> (impossible en Node).
 * À appeler APRÈS le premier import de lib-loader.js. On patche le module importé.
 * @param {object} libLoaderModule - le module importé `core/lib-loader.js`
 */
export async function patchLibLoader(libLoaderModule) {
    // h5p-creator.js appelle loadClientZip() ; on s'assure qu'il renvoie notre downloadZip.
    // On ne peut pas réassigner les exports ES (immuables), donc on pré-charge les globals
    // et on compte sur le fait que createH5PBlob fait `downloadZip || await loadClientZip()`.
    // En pratique : on appelle nous-mêmes ensureClientZip() et on injecte le résultat via
    // le mécanisme prévu — mais loadClientZip importe le module ES, ce qui FONCTIONNE en Node.
    // Donc rien à patcher pour client-zip. Pour JSZip/fflate/Tar (loadScript), on pré-peuple.
    void libLoaderModule;
    await ensureJSZip().catch(() => {});
}

/** Renvoie l'état des vendors chargés (debug). */
export function vendorState() {
    return { ..._vendorState };
}

// ===========================================================================
// 4. Sanitizer identité (fidélité HTML maximale possible en Node pur)
// ===========================================================================
//
// CONTEXTE — fidélité critique :
//   `js/export/sanitizer.js > sanitizeSync()` (appelé par `utils.formatTextToHtml`,
//   lui-même appelé par la plupart des processors) utilise DOMPurify. DOMPurify 3.x
//   exige un VRAI DOM HTML (document.implementation.createHTMLDocument, <template>,
//   DOMParser, fragments) → impossible à fournir en Node sans jsdom (= npm, INTERDIT).
//   Sans DOMPurify, sanitizeSync part en FALLBACK fail-closed `escapeAllHtml()` qui
//   échappe TOUT le HTML ET ré-échappe `&` → `&amp;` à chaque passe : NON IDEMPOTENT
//   (artefact d'environnement, pas un bug produit — en navigateur DOMPurify est idempotent).
//
// CHOIX (honnête, documenté) :
//   On injecte un sanitizer IDENTITÉ (`sanitize(x) = x`) via le chemin d'init officiel
//   du module (pré-peupler window.DOMPurify puis appeler preloadSanitizer()). Effet :
//     - sanitizeSync devient IDEMPOTENT et préserve le HTML verbatim.
//     - Pour le contenu des fixtures (LLM propre : <strong>/<em>/<p>/<table>, tous dans
//       l'allowlist EDUCATIONAL/RICH_HTML), l'identité ≈ ce que DOMPurify renverrait.
//   ÉCART RÉSIDUEL vs navigateur : DOMPurify SUPPRIMERAIT les balises/attrs hors allowlist
//   (<script>, onclick=…) et normaliserait certains markups ; l'identité les conserve.
//   Les fixtures n'en contiennent pas → écart négligeable pour le snapshot. À LEVER en
//   phase Playwright (vrai DOM → vraie sanitization). Tracé dans STUB_LOG.
//
/**
 * Installe un sanitizer identité dans js/export/sanitizer.js via son init() officiel.
 * À appeler APRÈS bootstrap et AVANT d'exécuter le pipeline. Idempotent.
 * @returns {Promise<boolean>} true si l'identité est bien active.
 */
let _identitySanitizerInstalled = false;
export async function installIdentitySanitizer() {
    if (_identitySanitizerInstalled) return true;
    // Objet DOMPurify identité : sanitize renvoie l'entrée telle quelle (coercée en string).
    const identity = {
        isSupported: true,
        sanitize: (dirty) => (dirty == null ? '' : String(dirty)),
        addHook() {}, removeHook() {}, removeAllHooks() {}, setConfig() {}, clearConfig() {}
    };
    globalThis.DOMPurify = identity;
    if (globalThis.window) globalThis.window.DOMPurify = identity;
    // init() de sanitizer.js lit window.DOMPurify et l'adopte comme purifier.
    const sanitizer = await import('../../js/export/sanitizer.js');
    await sanitizer.preloadSanitizer();
    _identitySanitizerInstalled = sanitizer.isSanitizerLoaded();
    logStub('sanitizer:identity',
        'DOMPurify identité injecté (DOMPurify réel impossible sans DOM/jsdom) — sanitizeSync devient idempotent et préserve le HTML verbatim ; écart résiduel vs navigateur = pas de suppression des balises hors-allowlist (négligeable sur fixtures propres)');
    return _identitySanitizerInstalled;
}

// Helpers d'export pour le harness
export { FROZEN_EPOCH };
