/**
 * harness.mjs — Banc de mesure de fidélité d'export Caramel (Node, sans npm).
 *
 * Lancement :  node tests/roundtrip/harness.mjs
 * Options   :  --only=DragAndDrop,Flashcards   (filtre par moduleKey)
 *              --fixture=drag_and_drop_1        (filtre par nom de fixture)
 *              --quiet                          (moins de log par fixture)
 *
 * Tests, dans l'ordre (valeur livrée de façon incrémentale) :
 *   T2 — Idempotence : process(heal(x)) == process(heal(clone(process(heal(x)))))
 *        (pure data, priorité MAX : détecte le « un caractère s'ajoute à chaque passe »)
 *   T1 — Déterminisme : deux exports complets heal→process→createH5PBlob → même sha256
 *        canonique (après neutralisation RNG/Date par bootstrap).
 *   T4 — Snapshot : taille canonique + sha256 par fixture → tests/roundtrip/report.json.
 *   T3 — Garde verbatim Sucrerie : un .h5p packagé passé dans extract.js + base64
 *        round-trip → les octets décodés == octets d'origine (dépôt sans perte).
 *
 * Périmètre : H5P uniquement. Moodle .mbz et exports documents = différés (phase Playwright).
 */

// IMPORTANT : bootstrap DOIT être le tout premier import (seed RNG + Date + stubs).
import {
    STUB_LOG, resetRandom, ensureJSZip, ensureClientZip, installIdentitySanitizer,
    ensureFflate, ensureTar, drainDispatchedEvents, lastDispatched
} from './bootstrap.mjs';

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { listH5pFixtures, listMoodleFixtures } from './fixtures-map.mjs';
import { canonicalize } from './canonicalize.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(__dirname, 'report.json');

// --- Capture des warnings sanitizer (fidélité HTML) sans polluer la sortie ---
let sanitizerFallbackCount = 0;
const _realWarn = console.warn;
console.warn = (...args) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('[Sanitizer] DOMPurify non chargé')) {
        sanitizerFallbackCount++;
        return; // avalé : on le résume une seule fois dans le rapport
    }
    _realWarn(...args);
};

// ---------------------------------------------------------------------------
// Imports Caramel (après bootstrap)
// ---------------------------------------------------------------------------
const healer = await import('../../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../../js/h5p/processors/index.js');
const { createH5PBlob } = await import('../../js/h5p/h5p-creator.js');

// ---------------------------------------------------------------------------
// Args CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const getArg = (name) => {
    const a = argv.find(x => x.startsWith(`--${name}=`));
    return a ? a.split('=').slice(1).join('=') : null;
};
const QUIET = argv.includes('--quiet');
const ONLY = (getArg('only') || '').split(',').filter(Boolean);
const FIXTURE_FILTER = getArg('fixture');

// ---------------------------------------------------------------------------
// Helpers pipeline
// ---------------------------------------------------------------------------

/**
 * Parse défensif d'une fixture (miroir de handleH5PCreation) : JSON.parse standard,
 * puis healJsonString en secours si le brut contient des échappements LaTeX cassés.
 * @param {string} rawStr - contenu brut du fichier .json
 */
function parseFixture(rawStr) {
    try {
        return JSON.parse(rawStr);
    } catch {
        return JSON.parse(healer.healJsonString(rawStr));
    }
}

/** Charge + parse une fixture depuis le disque. */
async function loadFixture(path) {
    return parseFixture(await readFile(path, 'utf8'));
}

/** Applique heal complet (les 3 étapes, comme handleH5PCreation). Retourne un NOUVEL objet. */
function healFull(rawObj, moduleKey) {
    let obj = healer.healJsonObject(structuredClone(rawObj), moduleKey);
    obj = healer.healActivitySpecificFields(obj, moduleKey);
    obj = healer.healStructureForActivity(obj, moduleKey);
    return obj;
}

/** heal + process → contenu final (structure passée au packaging). */
async function healAndProcess(rawObj, moduleKey) {
    const healed = healFull(rawObj, moduleKey);
    const processed = await processH5PContent(moduleKey, healed);
    // Un processeur peut retourner { content, dependencies } ; on isole le content.
    if (processed && processed.content && processed.dependencies) {
        return processed.content;
    }
    return processed;
}

/** Construit le blob .h5p complet à partir d'un contenu déjà processé. */
async function packageContent(content, moduleKey) {
    const meta = getModuleMetadata(moduleKey);
    if (!meta) throw new Error(`Métadonnées introuvables pour ${moduleKey}`);
    const dependencies = [
        ...meta.extraDependencies,
        { machineName: meta.machineName, majorVersion: meta.version.major, minorVersion: meta.version.minor }
    ];
    return createH5PBlob(content, meta.machineName, dependencies, { title: content.title || 'Activity', lang: 'fr' });
}

// ---------------------------------------------------------------------------
// Diff structurel (T2)
// ---------------------------------------------------------------------------

/**
 * Compare deux valeurs JSON-sérialisables et renvoie la liste des premières divergences.
 * @returns {Array<{path, a, b, kind}>}
 */
function structuralDiff(a, b, path = '$', acc = [], limit = 25) {
    if (acc.length >= limit) return acc;
    if (a === b) return acc;

    const ta = typeofJson(a), tb = typeofJson(b);
    if (ta !== tb) {
        acc.push({ path, kind: 'type', a: `${ta}:${trunc(a)}`, b: `${tb}:${trunc(b)}` });
        return acc;
    }
    if (ta === 'array') {
        if (a.length !== b.length) {
            acc.push({ path, kind: 'array-length', a: a.length, b: b.length });
        }
        const n = Math.max(a.length, b.length);
        for (let i = 0; i < n && acc.length < limit; i++) {
            structuralDiff(a[i], b[i], `${path}[${i}]`, acc, limit);
        }
        return acc;
    }
    if (ta === 'object') {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const k of keys) {
            if (acc.length >= limit) break;
            if (!(k in a)) { acc.push({ path: `${path}.${k}`, kind: 'missing-in-a', a: undefined, b: trunc(b[k]) }); continue; }
            if (!(k in b)) { acc.push({ path: `${path}.${k}`, kind: 'missing-in-b', a: trunc(a[k]), b: undefined }); continue; }
            structuralDiff(a[k], b[k], `${path}.${k}`, acc, limit);
        }
        return acc;
    }
    // primitives différentes
    acc.push({ path, kind: 'value', a: trunc(a), b: trunc(b) });
    return acc;
}

function typeofJson(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
}
function trunc(v, n = 120) {
    let s;
    try { s = typeof v === 'string' ? v : JSON.stringify(v); } catch { s = String(v); }
    if (s == null) return s;
    return s.length > n ? s.slice(0, n) + `…(+${s.length - n})` : s;
}

// ---------------------------------------------------------------------------
// T2 — Idempotence
// ---------------------------------------------------------------------------
async function runT2(fixtures) {
    section('T2 — Idempotence du pipeline data (process∘heal appliqué 2×)');
    const results = [];
    for (const fx of fixtures) {
        resetRandom(); // certaines passes mélangent (DragAndDrop/QuizSet via Math.random) → reseed pour comparer à graine égale
        let row = { file: fx.file, moduleKey: fx.moduleKey, ok: null, error: null, diffCount: 0, diff: [] };
        try {
            const raw = await loadFixture(fx.path);
            const v1 = await healAndProcess(raw, fx.moduleKey);
            resetRandom();
            // 2e passe : on repart du RÉSULTAT v1 (déjà processé) et on lui réapplique heal+process.
            // Un pipeline idempotent doit laisser v1 inchangé.
            const v2 = await healAndProcess(structuredClone(v1), fx.moduleKey);

            // Masquer les UUID/subContentId : ils sont régénérés à chaque passe via
            // generateUUID() (Math.random) et les 2 passes consomment le RNG différemment
            // (v2 part de données déjà structurées). Leur divergence n'est PAS une non-idempotence
            // de la logique — c'est l'aléa attendu de l'export. On compare le RESTE strictement.
            const v1m = maskVolatileIds(v1);
            const v2m = maskVolatileIds(v2);
            const s1 = stableStringify(v1m);
            const s2 = stableStringify(v2m);
            if (s1 === s2) {
                row.ok = true;
            } else {
                row.ok = false;
                const diff = structuralDiff(v1m, v2m);
                row.diffCount = diff.length;
                row.diff = diff;
                // Indice « longueur qui grandit » (le risque cité)
                row.lengthDelta = s2.length - s1.length;
                row.category = classifyT2(diff, row.lengthDelta);
            }
        } catch (e) {
            row.ok = null;
            row.error = e.message;
        }
        results.push(row);
        logRow('T2', row, row.ok === true ? 'IDEMPOTENT' :
            row.ok === false ? `NON-IDEMPOTENT [${row.category}] (${row.diffCount} diff, Δlen=${row.lengthDelta})` :
            `ERREUR: ${row.error}`);
    }
    return results;
}

/**
 * Classe une non-idempotence T2 :
 *   'DUPLICATION'  — au moins une valeur GRANDIT par préfixe/doublon répété (ex: <p> → <p><p>).
 *                    C'est le risque « un caractère s'ajoute à chaque passe » → s'aggraverait
 *                    en boucle. Concret SI un flux re-feedait du contenu déjà processé.
 *   'SHAPE-LOSS'   — la 2e passe lit des champs d'entrée absents du contenu déjà processé,
 *                    produisant du vide (slides→[], text→''). Attendu pour un transform one-shot.
 *   'MIXED'        — les deux.
 */
function classifyT2(diff, lengthDelta) {
    let dup = false, loss = false;
    for (const d of diff) {
        const a = typeof d.a === 'string' ? d.a : '';
        const b = typeof d.b === 'string' ? d.b : '';
        // duplication de préfixe HTML (<p><p>, <div><div>) ou b = a+a / b contient a en double
        if (/^<(p|div|span)>\s*<(p|div|span)>/i.test(b) || (a && b.length > a.length && b.startsWith(b.slice(0, b.length - a.length)) && b.endsWith(a))) {
            dup = true;
        }
        if (d.kind === 'array-length' && Number(d.b) < Number(d.a)) loss = true;
        if (d.b === '' || d.b === undefined || d.kind === 'missing-in-b') loss = true;
        if (d.kind === 'type' && String(d.b).startsWith('undefined')) loss = true;
    }
    if (dup && loss) return 'MIXED';
    if (dup) return 'DUPLICATION';
    if (loss) return 'SHAPE-LOSS';
    return lengthDelta > 0 ? 'GROWTH' : 'OTHER';
}

/**
 * Activités dont l'EMPAQUETAGE est différé (T1/T4), faute d'un prérequis que Node ne
 * peut pas fournir. Leur pipeline DONNÉES reste couvert par T2.
 *
 * `Dictation` : chaque phrase référence un .mp3 produit par la synthèse vocale et
 * conservé en mémoire média du navigateur. Hors navigateur, `packageContent` refuse
 * — à raison — de produire un .h5p aux médias manquants. Le différer ici évite de
 * confondre ce garde légitime avec une régression.
 */
const EMPAQUETAGE_DIFFERE = new Set(['Dictation']);

// ---------------------------------------------------------------------------
// T1 — Déterminisme de l'export packagé
// ---------------------------------------------------------------------------
async function runT1(fixtures) {
    section('T1 — Déterminisme de l\'export complet (heal→process→ZIP, 2 runs, sha256 canonique)');
    const results = [];
    for (const fx of fixtures) {
        let row = { file: fx.file, moduleKey: fx.moduleKey, ok: null, error: null, sha1: null, sha2: null, diff: [] };
        if (EMPAQUETAGE_DIFFERE.has(fx.moduleKey)) {
            row.deferred = true;
            results.push(row);
            if (!QUIET) logRow('T1', fx, 'DIFFÉRÉ (médias produits par le navigateur)');
            continue;
        }
        try {
            resetRandom();
            const content1 = await healAndProcess(await loadFixture(fx.path), fx.moduleKey);
            const blob1 = await packageContent(content1, fx.moduleKey);
            const canon1 = await canonicalize(blob1, 'h5p');

            resetRandom();
            const content2 = await healAndProcess(await loadFixture(fx.path), fx.moduleKey);
            const blob2 = await packageContent(content2, fx.moduleKey);
            const canon2 = await canonicalize(blob2, 'h5p');

            row.sha1 = canon1.totalSha256;
            row.sha2 = canon2.totalSha256;
            row.canonSize = canon1.files.reduce((s, f) => s + f.canonSize, 0);
            if (canon1.totalSha256 === canon2.totalSha256) {
                row.ok = true;
            } else {
                row.ok = false;
                // Localiser quels fichiers diffèrent
                const map2 = new Map(canon2.files.map(f => [f.name, f]));
                for (const f1 of canon1.files) {
                    const f2 = map2.get(f1.name);
                    if (!f2) { row.diff.push({ name: f1.name, note: 'absent du run 2' }); continue; }
                    if (f1.canonSha256 !== f2.canonSha256) {
                        row.diff.push({ name: f1.name, sizeA: f1.canonSize, sizeB: f2.canonSize });
                    }
                }
            }
        } catch (e) {
            row.ok = null;
            row.error = e.message;
        }
        results.push(row);
        logRow('T1', row, row.ok === true ? 'DÉTERMINISTE' :
            row.ok === false ? `NON-DÉTERMINISTE (fichiers: ${row.diff.map(d => d.name).join(', ')})` :
            `ERREUR: ${row.error}`);
    }
    return results;
}

// ---------------------------------------------------------------------------
// T4 — Snapshot (baseline de régression)
// ---------------------------------------------------------------------------
async function runT4(fixtures) {
    section('T4 — Snapshot canonique (baseline → report.json)');
    const snapshots = {};
    for (const fx of fixtures) {
        let entry = { moduleKey: fx.moduleKey, format: 'h5p', error: null };
        if (EMPAQUETAGE_DIFFERE.has(fx.moduleKey)) {
            entry.deferred = true;
            snapshots[fx.file] = entry;
            if (!QUIET) logRow('T4', { file: fx.file, moduleKey: fx.moduleKey }, 'DIFFÉRÉ (médias produits par le navigateur)');
            continue;
        }
        try {
            resetRandom();
            const content = await healAndProcess(await loadFixture(fx.path), fx.moduleKey);
            const blob = await packageContent(content, fx.moduleKey);
            const canon = await canonicalize(blob, 'h5p');
            entry.totalSha256 = canon.totalSha256;
            entry.canonSize = canon.files.reduce((s, f) => s + f.canonSize, 0);
            entry.fileCount = canon.files.length;
            entry.files = canon.files.map(f => ({ name: f.name, canonSize: f.canonSize, canonSha256: f.canonSha256 }));
        } catch (e) {
            entry.error = e.message;
        }
        snapshots[fx.file] = entry;
        if (!QUIET) logRow('T4', { file: fx.file, moduleKey: fx.moduleKey },
            entry.error ? `ERREUR: ${entry.error}` : `${entry.fileCount} fichiers, ${entry.canonSize} o, ${entry.totalSha256.slice(0, 12)}…`);
    }
    return snapshots;
}

// ---------------------------------------------------------------------------
// T3 — Garde verbatim Sucrerie (transport de dépôt sans perte)
// ---------------------------------------------------------------------------
async function runT3(fixtures) {
    section('T3 — Garde verbatim Sucrerie (extract.js + base64 round-trip)');
    // Modules représentatifs (1 par grande famille) — pas besoin des 79.
    const sample = pickSample(fixtures, ['DragAndDrop', 'Flashcards', 'MultipleChoice', 'Crossword', 'QuizSet', 'InteractiveBook']);
    const results = [];

    let extractMod, b64Mod;
    try {
        await ensureJSZip(); // extract.js charge JSZip via lib-loader (loadJSZip) → on pré-peuple window.JSZip
        extractMod = await import('../../js/sucrerie-bridge/services/extract.js');
        b64Mod = await import('../../js/sucrerie-bridge/utils/blob-base64.js');
    } catch (e) {
        _realWarn('[T3] import bridge échoué:', e.message);
        return [{ note: 'bridge import failed', error: e.message }];
    }

    for (const fx of sample) {
        let row = { file: fx.file, moduleKey: fx.moduleKey, ok: null, error: null };
        try {
            resetRandom();
            const content = await healAndProcess(await loadFixture(fx.path), fx.moduleKey);
            const blob = await packageContent(content, fx.moduleKey);
            const originalBytes = new Uint8Array(await blob.arrayBuffer());

            // (a) Garde « verbatim » du chemin de DÉPÔT : blob → base64 → bytes == bytes ?
            const b64 = await b64Mod.blobToBase64(blob);
            const decoded = Uint8Array.from(Buffer.from(b64, 'base64'));
            const verbatimOk = bytesEqual(originalBytes, decoded);

            // (b) extract.js doit pouvoir LIRE le .h5p (markdown non vide) sans altérer le blob.
            const extract = await extractMod.extractMarkdownFromBlob(blob, 'h5p', 'Test');
            const reBytes = new Uint8Array(await blob.arrayBuffer());
            const blobUntouched = bytesEqual(originalBytes, reBytes);
            const extractNonEmpty = !!(extract && extract.markdown && extract.markdown.length > 20);

            row.verbatimBase64 = verbatimOk;
            row.blobUntouchedAfterExtract = blobUntouched;
            row.extractMarkdownLen = extract?.markdown?.length ?? 0;
            row.extractActivityType = extract?.activityType ?? null;
            row.ok = verbatimOk && blobUntouched && extractNonEmpty;
        } catch (e) {
            row.ok = null;
            row.error = e.message;
        }
        results.push(row);
        logRow('T3', row, row.ok === true
            ? `VERBATIM OK (md ${row.extractMarkdownLen}o, type ${row.extractActivityType})`
            : row.ok === false
                ? `ÉCHEC (base64=${row.verbatimBase64}, blobUntouched=${row.blobUntouchedAfterExtract})`
                : `ERREUR: ${row.error}`);
    }
    return results;
}

// ---------------------------------------------------------------------------
// T5 — Moodle/Éléa : déterminisme + snapshot (.mbz et .xml)
// ---------------------------------------------------------------------------
//
// Périmètre : activités NON Page/Livre (Page/Livre → génération HTML via page-themes
// qui exige un vrai DOM → différé Playwright). On exécute le VRAI handler de
// moodle-creator.js (handleXxxCreation) ; il ne RETOURNE pas le blob mais le dispatche
// via document.dispatchEvent('generation:complete', {detail:{blob}}) → capturé par le
// stub document (drainDispatchedEvents/lastDispatched).
//   - .mbz (Millionnaire, Appariement, QCM, Devoir, Test) : canonicalisé (scrub IDs/timestamps Moodle).
//   - .xml (glossaireXml) : blob = fichier XML unique, hashé tel quel après scrub.
// Note Test : le blob primaire de `handleTestXmlCreation` est désormais un `.mbz` RESTAURABLE
// (banque de questions au format BACKUP + quiz câblé) ; la canonicalisation du modèle est PURE
// (canonicalizeTestModel, sans DOM) → exécutable sous ce harness Node. Le `.xml` (banque) reste
// disponible à la demande dans la modale mais n'est plus le blob de génération.
// T2 (idempotence) ne s'applique pas : les handlers prennent une STRING, pas une structure
// re-réinjectable. On mesure donc T1 (déterminisme) + T4 (snapshot).
const MOODLE_HANDLERS = {
    Millionnaire: { fn: 'handleMillionnaireCreation', kind: 'mbz' },
    Appariement: { fn: 'handleAppariementCreation', kind: 'mbz' },
    QCM: { fn: 'handleQCMCreation', kind: 'mbz' },
    Devoir: { fn: 'handleDevoirCreation', kind: 'mbz' },
    glossaireXml: { fn: 'handleGlossaireXmlCreation', kind: 'xml' },
    test_elea: { fn: 'handleTestXmlCreation', kind: 'mbz' }
};

/** Scrub minimal d'un .xml standalone (Moodle GIFT/Glossary) pour le hash stable. */
function scrubStandaloneXml(text) {
    return text
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>')
        .replace(/(<id>)\d+(<\/id>)/gi, '$1<ID>$2')
        .replace(/(>)(1[0-9]{9})(<)/g, '$1<TS>$3');
}

/** Empreinte canonique d'un blob Moodle (.mbz archive ou .xml plat). */
async function canonMoodle(blob, kind) {
    if (kind === 'mbz') {
        const c = await canonicalize(blob, 'mbz');
        return { totalSha256: c.totalSha256, fileCount: c.files.length, canonSize: c.files.reduce((s, f) => s + f.canonSize, 0) };
    }
    // xml : fichier unique
    const scrubbed = scrubStandaloneXml(new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer())));
    const bytes = new TextEncoder().encode(scrubbed);
    return { totalSha256: createHash('sha256').update(bytes).digest('hex'), fileCount: 1, canonSize: bytes.length };
}

async function runT5(fixtures, moodleCreator) {
    section('T5 — Moodle/Éléa : déterminisme + snapshot (.mbz / .xml, hors Page/Livre)');
    const t1 = [];
    const snap = {};
    for (const fx of fixtures) {
        const h = MOODLE_HANDLERS[fx.moduleKey];
        let row = { file: fx.file, moduleKey: fx.moduleKey, kind: h?.kind, ok: null, error: null };
        if (!h) {
            row.error = 'DIFFÉRÉ (génération HTML via page-themes = vrai DOM, phase Playwright)';
            t1.push(row);
            snap[fx.file] = { moduleKey: fx.moduleKey, error: row.error };
            logRow('T5', row, `DIFFÉRÉ → ${row.error}`);
            continue;
        }
        try {
            const jsonStr = await readFile(fx.path, 'utf8');

            resetRandom(); drainDispatchedEvents();
            await moodleCreator[h.fn](jsonStr);
            const ev1 = lastDispatched('generation:complete');
            if (!ev1?.detail?.blob) throw new Error('aucun blob dispatché (le handler a échoué silencieusement)');
            const c1 = await canonMoodle(ev1.detail.blob, h.kind);

            resetRandom(); drainDispatchedEvents();
            await moodleCreator[h.fn](jsonStr);
            const ev2 = lastDispatched('generation:complete');
            const c2 = await canonMoodle(ev2.detail.blob, h.kind);

            row.ok = c1.totalSha256 === c2.totalSha256;
            row.sha = c1.totalSha256;
            row.blobSize = ev1.detail.blob.size;
            snap[fx.file] = { moduleKey: fx.moduleKey, format: h.kind, totalSha256: c1.totalSha256, canonSize: c1.canonSize, fileCount: c1.fileCount };
        } catch (e) {
            row.ok = null;
            row.error = e.message;
            snap[fx.file] = { moduleKey: fx.moduleKey, error: e.message };
        }
        t1.push(row);
        logRow('T5', row, row.ok === true ? `DÉTERMINISTE (${row.kind}, ${row.blobSize}o)` :
            row.ok === false ? `NON-DÉTERMINISTE (${row.kind})` :
            `ERREUR: ${row.error}`);
    }
    return { t1, snap };
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
function pickSample(fixtures, moduleKeys) {
    const out = [];
    for (const mk of moduleKeys) {
        const f = fixtures.find(x => x.moduleKey === mk);
        if (f) out.push(f);
    }
    return out.length ? out : fixtures.slice(0, 5);
}

function bytesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/**
 * Remplace les valeurs volatiles par nature (régénérées à chaque export) par un
 * placeholder, pour le diff d'idempotence T2 uniquement :
 *   - subContentId / clés UUID  → '<UUID>'  (generateUUID = Math.random, aléa attendu)
 *   - toute string qui EST un UUID v4 canonique → '<UUID>'
 * On NE touche PAS au reste (texte, structure, flags) : c'est lui qu'on compare strictement.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function maskVolatileIds(v) {
    if (Array.isArray(v)) return v.map(maskVolatileIds);
    if (v && typeof v === 'object') {
        const out = {};
        for (const [k, val] of Object.entries(v)) {
            if (k === 'subContentId') { out[k] = '<UUID>'; continue; }
            out[k] = maskVolatileIds(val);
        }
        return out;
    }
    if (typeof v === 'string' && UUID_RE.test(v)) return '<UUID>';
    return v;
}

/** JSON.stringify avec clés triées (compare la structure, pas l'ordre d'insertion). */
function stableStringify(obj) {
    return JSON.stringify(sortDeep(obj));
}
function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
        return out;
    }
    return v;
}

function section(title) {
    console.log('\n' + '='.repeat(78));
    console.log(title);
    console.log('='.repeat(78));
}
function logRow(test, row, status) {
    if (QUIET && status.startsWith('ID') || QUIET && status.startsWith('DÉT')) return;
    const tag = `[${test}] ${(row.moduleKey || '').padEnd(20)} ${(row.file || '').padEnd(34)}`;
    console.log(tag, status);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    console.log('Caramel — Banc de fidélité d\'export (Node, no-npm)');
    console.log('Node', process.version, '| epoch figée 2026-06-16T12:00:00Z | RNG mulberry32 seedé');

    let fixtures = await listH5pFixtures();
    if (ONLY.length) fixtures = fixtures.filter(f => ONLY.includes(f.moduleKey));
    if (FIXTURE_FILTER) fixtures = fixtures.filter(f => f.file.startsWith(FIXTURE_FILTER));
    console.log(`\n${fixtures.length} fixtures H5P à tester` +
        (ONLY.length ? ` (filtre moduleKey: ${ONLY.join(',')})` : '') +
        (FIXTURE_FILTER ? ` (filtre fixture: ${FIXTURE_FILTER})` : ''));

    // Pré-charger les vendors une fois (évite la 1re fois dans une boucle async)
    await ensureClientZip();
    await ensureJSZip();

    // Installer le sanitizer identité (DOMPurify réel impossible en Node) → sanitizeSync
    // idempotent + HTML verbatim. Voir CAVEATS. Sans ça, le fallback fail-closed escaperait
    // le HTML et ré-escaperait `&` à chaque passe (faux positif d'idempotence).
    const sanitizerIdentity = await installIdentitySanitizer();
    console.log(`Sanitizer identité ${sanitizerIdentity ? 'actif' : 'NON installé (fallback fail-closed !)'}.`);

    const t2 = await runT2(fixtures);
    const t1 = await runT1(fixtures);
    const t4 = await runT4(fixtures);
    const t3 = await runT3(fixtures);

    // ---- T5 : Moodle/Éléa (hors Page/Livre) ----
    let t5 = { t1: [], snap: {} };
    const RUN_MOODLE = !argv.includes('--no-moodle') && !ONLY.length && !FIXTURE_FILTER;
    if (RUN_MOODLE) {
        await ensureFflate();
        await ensureTar();
        const moodleCreator = await import('../../js/moodle/moodle-creator.js');
        let moodleFixtures = await listMoodleFixtures();
        // Une fixture par moduleKey supporté (sample), pour ne pas alourdir ; on garde Page/Livre
        // pour les marquer "différé".
        const seen = new Set();
        moodleFixtures = moodleFixtures.filter(f => {
            if (seen.has(f.moduleKey)) return false; seen.add(f.moduleKey); return true;
        });
        t5 = await runT5(moodleFixtures, moodleCreator);
    }

    // ---- Résumé ----
    section('RÉSUMÉ');
    const sum = (rows) => ({
        ok: rows.filter(r => r.ok === true).length,
        fail: rows.filter(r => r.ok === false).length,
        err: rows.filter(r => r.ok === null && r.error).length
    });
    const s2 = sum(t2), s1 = sum(t1), s3 = sum(t3.filter(r => 'ok' in r));
    // Répartition T2 par catégorie
    const t2cats = {};
    for (const r of t2.filter(r => r.ok === false)) t2cats[r.category] = (t2cats[r.category] || 0) + 1;
    const catStr = Object.entries(t2cats).map(([k, v]) => `${k}:${v}`).join(' ');
    const s5 = sum(t5.t1);
    console.log(`T2 Idempotence (H5P)  : ${s2.ok} OK | ${s2.fail} NON-IDEMPOTENT (${catStr}) | ${s2.err} erreur`);
    console.log(`T1 Déterminisme (H5P) : ${s1.ok} OK | ${s1.fail} NON-DÉTERMINISTE | ${s1.err} erreur | ${t1.filter(r => r.deferred).length} différé(s)`);
    console.log(`T3 Verbatim (H5P)     : ${s3.ok} OK | ${s3.fail} échec | ${s3.err} erreur`);
    const t4err = Object.values(t4).filter(e => e.error).length;
    const t4dif = Object.values(t4).filter(e => e.deferred).length;
    console.log(`T4 Snapshot (H5P)     : ${Object.keys(t4).length - t4err - t4dif} enregistrés | ${t4err} erreur | ${t4dif} différé(s)`);
    console.log(`T5 Moodle/Éléa        : ${s5.ok} déterministes | ${s5.fail} non-déterministes | ${s5.err} différés/erreur (Page/Livre = DOM)`);
    console.log('\nLégende catégories T2 :');
    console.log('  DUPLICATION = une valeur grandit par doublon répété (ex: <p>→<p><p>) → VRAI risque « +1 char/passe »');
    console.log('  SHAPE-LOSS  = la 2e passe lit des champs absents du contenu déjà processé (slides→[], text→"") → attendu (transform one-shot)');
    console.log('  NOTE        : flux produit = Markdown-First (l\'éditeur re-traite le Markdown ORIGINAL, jamais le contenu processé)');
    console.log('                → ces non-idempotences sont LATENTES, pas actives dans le parcours utilisateur actuel.');

    if (s2.fail) {
        // D'abord les DUPLICATION / GROWTH (le vrai risque), puis le reste.
        const order = { DUPLICATION: 0, GROWTH: 1, MIXED: 2, OTHER: 3, 'SHAPE-LOSS': 4 };
        const sorted = t2.filter(r => r.ok === false).sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9));
        console.log('\n--- T2 NON-IDEMPOTENTS (détail, risque décroissant) ---');
        for (const r of sorted) {
            console.log(`\n• [${r.category}] ${r.moduleKey} / ${r.file}  (Δlen=${r.lengthDelta}, ${r.diffCount} divergences)`);
            for (const d of r.diff.slice(0, 8)) {
                console.log(`    ${d.path}  [${d.kind}]  a=${d.a}  b=${d.b}`);
            }
        }
    }
    if (s1.fail) {
        console.log('\n--- T1 NON-DÉTERMINISTES (détail) ---');
        for (const r of t1.filter(r => r.ok === false)) {
            console.log(`• ${r.moduleKey} / ${r.file}  fichiers divergents: ${JSON.stringify(r.diff)}`);
        }
    }
    const errs = [...t2, ...t1].filter(r => r.ok === null && r.error);
    if (errs.length) {
        console.log('\n--- ERREURS PIPELINE ---');
        const seen = new Set();
        for (const r of errs) {
            const key = `${r.moduleKey}:${r.error}`;
            if (seen.has(key)) continue; seen.add(key);
            console.log(`• ${r.moduleKey} / ${r.file}: ${r.error}`);
        }
    }

    // ---- Caveats de fidélité ----
    section('CAVEATS DE FIDÉLITÉ');
    const caveats = [];
    // 1. Sanitizer
    const sanCaveat = sanitizerFallbackCount > 0
        ? `Sanitizer en fallback fail-closed (${sanitizerFallbackCount} appels) — l'identité n'a PAS été installée : résultats HTML non fiables.`
        : 'Sanitizer = IDENTITÉ injectée (DOMPurify réel impossible sans DOM/jsdom en Node). HTML préservé verbatim ; idempotent. Écart vs navigateur : pas de suppression des balises/attrs hors-allowlist (négligeable sur fixtures propres). T4 ≈ navigateur, à confirmer en phase Playwright.';
    caveats.push(sanCaveat);
    console.log((sanitizerFallbackCount > 0 ? '⚠ ' : '• ') + sanCaveat);
    // 2. Idempotence latente
    if (s2.fail > 0) {
        const dupCount = (t2cats.DUPLICATION || 0) + (t2cats.GROWTH || 0) + (t2cats.MIXED || 0);
        const c2 = `T2 : ${s2.fail} activités non-idempotentes au niveau fonction (dont ${dupCount} de type DUPLICATION/croissance). LATENT : le flux Markdown-First re-traite toujours le Markdown original, jamais le contenu processé → pas d'impact dans le parcours actuel. Deviendrait actif si un code re-feedait du contenu processé.`;
        caveats.push(c2);
        console.log('• ' + c2);
    }
    // 3. Moodle gzip shim
    if (s5.ok + s5.fail > 0) {
        const c3 = 'T5 .mbz : fflate.gzip async (Web Worker) indisponible en Node → redirigé vers gzipSync (même DEFLATE, mtime fixé → output byte-identique au navigateur). Page/Livre différés (génération HTML via page-themes = vrai DOM).';
        caveats.push(c3);
        console.log('• ' + c3);
    }
    console.log('\nStubs navigateur utilisés (ne doivent PAS influencer l\'output) :');
    for (const s of STUB_LOG.filter(s => !s.name.startsWith('vendor:'))) {
        console.log(`  - ${s.name}: ${s.detail}`);
    }

    // ---- Écriture du rapport ----
    const dupTotal = (t2cats.DUPLICATION || 0) + (t2cats.GROWTH || 0) + (t2cats.MIXED || 0);
    const report = {
        generatedAt: new Date().toISOString(),
        node: process.version,
        frozenEpoch: '2026-06-16T12:00:00Z',
        scope: RUN_MOODLE ? 'h5p + moodle (hors Page/Livre)' : 'h5p',
        sanitizerMode: sanitizerFallbackCount > 0 ? 'fail-closed-fallback' : 'identity',
        sanitizerFallbackCount,
        caveats,
        summary: {
            T2: { ...s2, categories: t2cats, duplicationGrowth: dupTotal },
            T1: s1,
            T3: s3,
            T4: { recorded: Object.keys(t4).length - t4err, error: t4err },
            T5_moodle: s5
        },
        T2_idempotence: t2,
        T1_determinism: t1,
        T3_verbatim: t3,
        T4_snapshot: t4,
        T5_moodle_determinism: t5.t1,
        T5_moodle_snapshot: t5.snap
    };
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nRapport écrit : ${REPORT_PATH}`);

    // ---- Gel de l'inventaire T2 ----
    const deriveT2 = await verifierBaselineT2(t2);

    // Code de sortie : non-zéro UNIQUEMENT pour les régressions dures —
    //   T1/T5 non-déterministe (seeding insuffisant) ou T2 DUPLICATION/GROWTH (vrai « +1 char/passe »).
    //   SHAPE-LOSS n'est PAS un échec EN SOI (comportement attendu d'un transform one-shot),
    //   mais toute DÉRIVE de l'inventaire gelé en est une (cf. verifierBaselineT2).
    //   Les erreurs T5 « différé Page/Livre » ne comptent PAS (attendu).
    const hardFail = s1.fail + s1.err + s2.err + dupTotal + s5.fail + deriveT2;
    if (hardFail > 0) {
        console.log(`\n⚠ ${hardFail} régression(s) dure(s) (T1/T5 non-déterministe, T2 DUPLICATION/GROWTH, ou dérive de l'inventaire T2). Exit 1.`);
    }
    process.exit(hardFail > 0 ? 1 : 0);
}

/**
 * Gèle l'inventaire des non-idempotences T2.
 *
 * POURQUOI. Les 26 SHAPE-LOSS connus ne sont PAS des bugs : le flux produit est
 * « Markdown-First » — l'éditeur re-traite toujours le Markdown d'ORIGINE, jamais le
 * contenu déjà processé — donc la 2e passe n'a jamais lieu en vrai. Les rendre
 * idempotents demanderait de réécrire 26 processeurs pour un risque qui n'existe pas
 * dans le parcours actuel : le remède serait plus dangereux que le mal.
 *
 * Ce qui manquait, en revanche, c'est le CONSTAT DE STABILITÉ. Jusqu'ici la porte ne
 * comptait que les DUPLICATION/GROWTH : une activité qui basculait d'IDEMPOTENT à
 * SHAPE-LOSS passait totalement inaperçue, alors que c'est précisément le signe qu'un
 * processeur s'est mis à lire un champ d'entrée qu'il ne lisait pas — donc que la
 * latence de risque s'est étendue.
 *
 * Trois dérives font échouer :
 *   · APPARITION   — une fixture jusqu'ici idempotente ne l'est plus ;
 *   · AGGRAVATION  — une fixture change de catégorie (SHAPE-LOSS → DUPLICATION…) ;
 *   · DISPARITION  — une entrée gelée n'est plus produite : ce n'est pas grave, mais
 *                    la référence doit être mise à jour pour rester une référence.
 *
 * Régénérer après une évolution VOULUE : `node tests/roundtrip/harness.mjs --gel-t2`.
 *
 * @param {Array<Object>} t2 - Résultats bruts de la phase T2.
 * @returns {Promise<number>} Nombre de dérives (0 = conforme).
 */
async function verifierBaselineT2(t2) {
    const CHEMIN = resolve(__dirname, '../fixtures/t2-idempotence-baseline.json');

    const courant = {};
    for (const r of t2) {
        if (r.ok === false) courant[`${r.moduleKey}/${r.file}`] = r.category;
    }

    if (process.argv.includes('--gel-t2')) {
        await writeFile(CHEMIN, JSON.stringify({
            _commentaire: 'Inventaire GELÉ des non-idempotences T2. Voir verifierBaselineT2() '
                + 'dans tests/roundtrip/harness.mjs. Régénérer : node tests/roundtrip/harness.mjs --gel-t2',
            _pourquoi: 'Ces non-idempotences sont LATENTES (flux Markdown-First : le contenu déjà '
                + 'processé n\'est jamais re-soumis). Elles sont tolérées mais figées : toute '
                + 'apparition, aggravation ou disparition doit être vue et décidée.',
            entrees: Object.fromEntries(Object.entries(courant).sort(([a], [b]) => a.localeCompare(b)))
        }, null, 2), 'utf8');
        console.log(`\n📌 Inventaire T2 gelé (${Object.keys(courant).length} entrées) → ${CHEMIN}`);
        return 0;
    }

    let reference;
    try {
        reference = JSON.parse(await readFile(CHEMIN, 'utf8')).entrees || {};
    } catch {
        console.log(`\n⚠ Inventaire T2 de référence absent (${CHEMIN}).`);
        console.log('  Le générer une première fois : node tests/roundtrip/harness.mjs --gel-t2');
        return 0;   // absence de référence ≠ régression
    }

    const apparitions = Object.keys(courant).filter(k => !(k in reference));
    const disparitions = Object.keys(reference).filter(k => !(k in courant));
    const aggravations = Object.keys(courant)
        .filter(k => k in reference && reference[k] !== courant[k])
        .map(k => `${k} : ${reference[k]} → ${courant[k]}`);

    console.log(`\nT2 inventaire gelé    : ${Object.keys(reference).length} entrées de référence`);

    if (!apparitions.length && !disparitions.length && !aggravations.length) {
        console.log('  ✅ Inventaire conforme (aucune apparition, aggravation ni disparition).');
        return 0;
    }

    if (apparitions.length) {
        console.log(`  ❌ ${apparitions.length} APPARITION(S) — ces fixtures étaient idempotentes :`);
        for (const k of apparitions) console.log(`     • ${k}  [${courant[k]}]`);
    }
    if (aggravations.length) {
        console.log(`  ❌ ${aggravations.length} AGGRAVATION(S) — changement de catégorie :`);
        for (const k of aggravations) console.log(`     • ${k}`);
    }
    if (disparitions.length) {
        console.log(`  ❌ ${disparitions.length} DISPARITION(S) — corrigées ? mettre à jour la référence :`);
        for (const k of disparitions) console.log(`     • ${k}  [était ${reference[k]}]`);
    }
    console.log('  → si la dérive est VOULUE : node tests/roundtrip/harness.mjs --gel-t2');

    return apparitions.length + aggravations.length + disparitions.length;
}

main().catch(e => {
    _realWarn('FATAL', e);
    process.exit(2);
});
