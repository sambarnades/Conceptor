/**
 * Tests round-trip MBZ pour tous les processors d'activité dotés de
 * `parseFiles()` + `serializeFiles()` (cf. cara_dev2/js/moodle/processors/activities/).
 *
 * Pour chaque type avec une fixture MBZ disponible, on vérifie :
 *   1. extractMbz détecte le bon module
 *   2. parseFiles produit un JSON éditeur cohérent (champs principaux remplis)
 *   3. serializeFiles patch les fichiers sans casser la structure XML
 *   4. Round-trip : extract → parse → serialize → build → extract → parse
 *      donne un JSON identique
 *   5. Modification du title persiste après round-trip
 *
 * Glossaire et Test n'ont pas de fixture MBZ disponible (export Caramel
 * en XML standalone) — leur logique est portée mais non testée ici.
 *
 * Exécution : ouvrir tests/test-mbz-roundtrip-all.html depuis un serveur local.
 */

import { extractMbz, buildMbz } from '../js/moodle/mbz-utils.js';

import QCM          from '../js/moodle/processors/activities/QCM.js';
import Millionnaire from '../js/moodle/processors/activities/Millionnaire.js';
import Appariement  from '../js/moodle/processors/activities/Appariement.js';
import Devoir       from '../js/moodle/processors/activities/Devoir.js';
import Page         from '../js/moodle/processors/activities/Page.js';
import Livre        from '../js/moodle/processors/activities/Livre.js';

// =========================================================================
// Configuration des suites de test
// =========================================================================

const SUITES = [
    {
        label:           'QCM (simplequiz)',
        fixture:         'tests/fixtures/qcm-test.mbz',
        processor:       QCM,
        expectedModule:  'simplequiz',
        // Champs à vérifier comme « non vides » dans le JSON parsé
        nonEmptyFields:  ['title', 'questions'],
        // Pour le round-trip : champs à comparer (JSON.stringify deep-equal)
        roundTripFields: ['title', 'questions']
    },
    {
        label:           'Millionnaire (millionnairev2)',
        fixture:         'tests/fixtures/millionnaire-test.mbz',
        processor:       Millionnaire,
        expectedModule:  'millionnairev2',
        nonEmptyFields:  ['title', 'questions'],
        roundTripFields: ['title', 'questions']
    },
    {
        label:           'Appariement (epikmatch)',
        fixture:         'tests/fixtures/appariement-test.mbz',
        processor:       Appariement,
        expectedModule:  'epikmatch',
        nonEmptyFields:  ['title', 'pairs'],
        roundTripFields: ['title', 'pairs']
    },
    {
        label:           'Devoir (assign)',
        fixture:         'tests/fixtures/devoir-test.mbz',
        processor:       Devoir,
        expectedModule:  'assign',
        nonEmptyFields:  ['title'],   // criteria peut être vide selon les fixtures
        roundTripFields: ['title', 'criteria']
    },
    {
        label:           'Page (page)',
        fixture:         'tests/fixtures/page-test.mbz',
        processor:       Page,
        expectedModule:  'page',
        nonEmptyFields:  ['title', 'blocks'],
        roundTripFields: ['title', 'blocks']
    },
    {
        label:           'Livre (book)',
        fixture:         'tests/fixtures/livre-test.mbz',
        processor:       Livre,
        expectedModule:  'book',
        nonEmptyFields:  ['title', 'chapters'],
        roundTripFields: ['title', 'chapters']
    }
];

// =========================================================================
// Mini-framework
// =========================================================================

let passCount = 0;
let failCount = 0;

const resultsByType = new Map(); // label → { pass, fail, items: [...] }

function startType(label) {
    resultsByType.set(label, { pass: 0, fail: 0, items: [] });
}

function group(label, name) {
    resultsByType.get(label).items.push({ type: 'group', name });
}

function assert(label, condition, message, diagnostic = null) {
    const block = resultsByType.get(label);
    const entry = {
        type:   'assertion',
        status: condition ? 'PASS' : 'FAIL',
        message,
        diagnostic
    };
    if (condition) { block.pass++; passCount++; }
    else           { block.fail++; failCount++; }
    block.items.push(entry);
    console.log(`[${entry.status}] [${label}] ${message}`);
    if (diagnostic) console.log('   →', diagnostic);
}

function fatalError(label, step, err) {
    const block = resultsByType.get(label);
    block.fail++;
    failCount++;
    block.items.push({
        type:       'assertion',
        status:     'FAIL',
        message:    step,
        diagnostic: (err?.stack || err?.message || String(err))
    });
    console.error(`[FAIL] [${label}] ${step}`, err);
}

// =========================================================================
// Helpers
// =========================================================================

async function loadFixture(path) {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} sur ${path}`);
    return await resp.arrayBuffer();
}

function cloneFiles(files) {
    const out = {};
    for (const [k, v] of Object.entries(files)) {
        out[k] = v instanceof Uint8Array ? new Uint8Array(v) : v;
    }
    return out;
}

function deepEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function summarize(value) {
    if (value == null) return String(value);
    if (typeof value === 'string') {
        return value.length > 60 ? value.slice(0, 60) + '…' : value;
    }
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object(${Object.keys(value).length} keys)`;
    return String(value);
}

// =========================================================================
// Suite générique appliquée à chaque type
// =========================================================================

async function runSuite(suite) {
    const { label, fixture, processor, expectedModule, nonEmptyFields, roundTripFields } = suite;
    startType(label);

    // ---- Chargement
    group(label, 'Chargement fixture');
    let buffer;
    try {
        buffer = await loadFixture(fixture);
        assert(label, buffer.byteLength > 0,
            `Fixture chargée (${buffer.byteLength} octets)`);
    } catch (e) {
        fatalError(label, 'Chargement fixture', e);
        return;
    }

    // ---- extractMbz
    group(label, 'extractMbz');
    let extracted;
    try {
        extracted = await extractMbz(buffer);
        assert(label, extracted.moduleName === expectedModule,
            `moduleName détecté = "${expectedModule}"`,
            `lu = ${extracted.moduleName}`);
        assert(label, !!extracted.activityDir,
            `activityDir présent`,
            extracted.activityDir);
        assert(label, Object.keys(extracted.files).length > 0,
            `${Object.keys(extracted.files).length} fichiers extraits`);
    } catch (e) {
        fatalError(label, 'extractMbz', e);
        return;
    }

    // ---- parseFiles
    group(label, 'parseFiles (inverse)');
    let parsed;
    try {
        parsed = processor.parseFiles(extracted.files, extracted.activityDir);
        for (const field of nonEmptyFields) {
            const v = parsed[field];
            const ok = v != null
                && !(typeof v === 'string' && v.length === 0)
                && !(Array.isArray(v) && v.length === 0);
            assert(label, ok,
                `${field} non vide`,
                `${field} = ${summarize(v)}`);
        }
        assert(label, !!parsed._context,
            '_context présent');
    } catch (e) {
        fatalError(label, 'parseFiles', e);
        return;
    }

    // ---- serializeFiles
    group(label, 'serializeFiles (patch in-place)');
    let patchedFiles;
    try {
        patchedFiles = cloneFiles(extracted.files);
        processor.serializeFiles(parsed, patchedFiles, extracted.activityDir);
        assert(label, true, 'serializeFiles s\'exécute sans exception');
        // Le fichier XML principal doit toujours être présent
        const mainXml = Object.keys(patchedFiles).find(p =>
            p.startsWith(extracted.activityDir + '/') && p.endsWith('.xml')
        );
        assert(label, !!mainXml,
            'Fichier XML principal toujours présent après patch',
            mainXml);
    } catch (e) {
        fatalError(label, 'serializeFiles', e);
        return;
    }

    // ---- Round-trip identité
    group(label, 'Round-trip (identité)');
    try {
        const newMbz = await buildMbz(patchedFiles);
        assert(label, newMbz instanceof Uint8Array && newMbz.length > 0,
            'buildMbz produit un Uint8Array non vide',
            `taille = ${newMbz?.length}`);

        const reExtracted = await extractMbz(newMbz);
        assert(label, reExtracted.moduleName === expectedModule,
            `Re-extraction : moduleName = "${expectedModule}"`,
            `relu = ${reExtracted.moduleName}`);

        const reParsed = processor.parseFiles(reExtracted.files, reExtracted.activityDir);
        for (const field of roundTripFields) {
            const equal = deepEqualJson(reParsed[field], parsed[field]);
            assert(label, equal,
                `Round-trip : ${field} identique (deep-equal)`,
                equal ? null : `original=${summarize(parsed[field])} / round-trip=${summarize(reParsed[field])}`);
        }
    } catch (e) {
        fatalError(label, 'Round-trip identité', e);
    }

    // ---- Round-trip avec modification du titre
    group(label, 'Round-trip (titre modifié)');
    try {
        const modified = { ...parsed, title: `MODIF ${Date.now()}` };
        const filesCopy = cloneFiles(extracted.files);
        processor.serializeFiles(modified, filesCopy, extracted.activityDir);

        const newMbz = await buildMbz(filesCopy);
        const reExtracted = await extractMbz(newMbz);
        const reParsed = processor.parseFiles(reExtracted.files, reExtracted.activityDir);

        assert(label, reParsed.title === modified.title,
            'Titre modifié persiste après round-trip',
            `lu = "${reParsed.title}"`);
        // Les autres champs ne doivent pas avoir bougé
        for (const field of roundTripFields.filter(f => f !== 'title')) {
            const equal = deepEqualJson(reParsed[field], parsed[field]);
            assert(label, equal,
                `${field} préservé après modification du titre`,
                equal ? null : `diff sur ${field}`);
        }
    } catch (e) {
        fatalError(label, 'Round-trip titre modifié', e);
    }
}

// =========================================================================
// Lancement séquentiel
// =========================================================================

async function runAll() {
    for (const suite of SUITES) {
        await runSuite(suite);
    }
    renderResults();
}

// =========================================================================
// Affichage
// =========================================================================

function renderResults() {
    document.getElementById('count-total').textContent = passCount + failCount;
    document.getElementById('count-pass').textContent  = passCount;
    document.getElementById('count-fail').textContent  = failCount;

    const root = document.getElementById('test-results');
    root.innerHTML = '';

    for (const [label, block] of resultsByType.entries()) {
        const wrapper = document.createElement('div');
        wrapper.className = 'type-block';

        const header = document.createElement('div');
        header.className = `type-header ${block.fail === 0 ? 'type-header--pass' : 'type-header--fail'}`;
        header.innerHTML = `
            <span>${label}</span>
            <span class="type-header__count">
                ${block.pass} OK · ${block.fail} KO
            </span>
        `;
        wrapper.appendChild(header);

        for (const item of block.items) {
            if (item.type === 'group') {
                const div = document.createElement('div');
                div.className = 'step__group';
                div.textContent = item.name;
                wrapper.appendChild(div);
                continue;
            }
            const div = document.createElement('div');
            div.className = 'step';

            const status = document.createElement('span');
            status.className = `step__status step__status--${item.status.toLowerCase()}`;
            status.textContent = item.status;
            div.appendChild(status);

            div.appendChild(document.createTextNode(item.message));

            if (item.diagnostic) {
                const diag = document.createElement('span');
                diag.className = 'step__diagnostic';
                diag.textContent = item.diagnostic;
                div.appendChild(diag);
            }
            wrapper.appendChild(div);
        }
        root.appendChild(wrapper);
    }
}

runAll().catch(err => {
    console.error('Erreur fatale :', err);
    document.getElementById('test-results').innerHTML =
        `<pre style="color:#721c24; padding:16px; background:#f8d7da;">Erreur fatale : ${err.message}\n\n${err.stack}</pre>`;
});
