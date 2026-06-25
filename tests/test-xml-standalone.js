/**
 * Tests des formats XML standalone exportés par Caramel hors MBZ :
 *   - Glossaire    : <GLOSSARY>... (Moodle Glossary import/export)
 *   - Banque de questions : <quiz>... (Moodle Question XML)
 *
 * Cycle vérifié pour chaque type :
 *   1. Détection automatique du format via `detectStandaloneXmlType`
 *   2. Parsing vers le JSON éditeur via `parseStandaloneXml`
 *   3. Sérialisation vers XML via `serializeStandaloneXml`
 *   4. Round-trip : re-parse(serialize(parse(xml))) === parse(xml)
 *   5. Modification du title persiste après round-trip
 *
 * Exécution : ouvrir tests/test-xml-standalone.html depuis un serveur local.
 */

import { detectStandaloneXmlType, STANDALONE_XML_TYPES } from '../js/moodle/mbz-utils.js';
import Glossaire from '../js/moodle/processors/activities/Glossaire.js';
import Test      from '../js/moodle/processors/activities/Test.js';

// =========================================================================
// Suites
// =========================================================================

const SUITES = [
    {
        label:           'Glossaire (XML standalone)',
        fixture:         'tests/fixtures/glossaire-test.xml',
        processor:       Glossaire,
        expectedType:    STANDALONE_XML_TYPES.GLOSSARY,
        // Glossaire utilise `name` (et non `title` comme les autres processors)
        // pour s'aligner sur le schema `elea_glossaire` dans content-detector.js.
        nonEmptyFields:  ['name', 'entries'],
        roundTripFields: ['name', 'entries']
    },
    {
        label:           'Banque de questions (XML standalone)',
        fixture:         'tests/fixtures/questionbank-test.xml',
        processor:       Test,
        expectedType:    STANDALONE_XML_TYPES.QUESTION_BANK,
        nonEmptyFields:  ['bank_name', 'questions'],
        roundTripFields: ['bank_name', 'bank_description', 'questions']
    }
];

// =========================================================================
// Mini-framework
// =========================================================================

let passCount = 0;
let failCount = 0;
const resultsByType = new Map();

function startType(label) {
    resultsByType.set(label, { pass: 0, fail: 0, items: [] });
}
function group(label, name) {
    resultsByType.get(label).items.push({ type: 'group', name });
}
function assert(label, condition, message, diagnostic = null) {
    const block = resultsByType.get(label);
    const entry = { type: 'assertion', status: condition ? 'PASS' : 'FAIL', message, diagnostic };
    if (condition) { block.pass++; passCount++; } else { block.fail++; failCount++; }
    block.items.push(entry);
    console.log(`[${entry.status}] [${label}] ${message}`);
    if (diagnostic) console.log('   →', diagnostic);
}
function fatalError(label, step, err) {
    const block = resultsByType.get(label);
    block.fail++; failCount++;
    block.items.push({
        type: 'assertion', status: 'FAIL', message: step,
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
    return await resp.text();
}

function deepEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function summarize(value) {
    if (value == null) return String(value);
    if (typeof value === 'string') return value.length > 80 ? value.slice(0, 80) + '…' : value;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object(${Object.keys(value).length} keys)`;
    return String(value);
}

// =========================================================================
// Suite générique
// =========================================================================

async function runSuite(suite) {
    const { label, fixture, processor, expectedType, nonEmptyFields, roundTripFields } = suite;
    startType(label);

    // ---- 1. Chargement
    group(label, 'Chargement fixture');
    let xml;
    try {
        xml = await loadFixture(fixture);
        assert(label, xml.length > 0, `Fixture chargée (${xml.length} caractères)`);
    } catch (e) {
        fatalError(label, 'Chargement fixture', e);
        return;
    }

    // ---- 2. Détection automatique
    group(label, 'detectStandaloneXmlType');
    let detected;
    try {
        detected = detectStandaloneXmlType(xml);
        assert(label, detected === expectedType,
            `Format détecté = "${expectedType}"`,
            `lu = ${detected}`);
    } catch (e) {
        fatalError(label, 'detectStandaloneXmlType', e);
        return;
    }

    // ---- 3. Parsing
    group(label, 'parseStandaloneXml');
    let parsed;
    try {
        parsed = processor.parseStandaloneXml(xml);
        for (const field of nonEmptyFields) {
            const v = parsed[field];
            const ok = v != null
                && !(typeof v === 'string' && v.length === 0)
                && !(Array.isArray(v) && v.length === 0);
            assert(label, ok, `${field} non vide`, `${field} = ${summarize(v)}`);
        }
    } catch (e) {
        fatalError(label, 'parseStandaloneXml', e);
        return;
    }

    // ---- 4. Sérialisation
    group(label, 'serializeStandaloneXml');
    let serialized;
    try {
        serialized = processor.serializeStandaloneXml(parsed);
        assert(label, typeof serialized === 'string' && serialized.length > 0,
            'serializeStandaloneXml produit une string non vide',
            `taille = ${serialized?.length}`);
        // Le format détecté sur le XML re-sérialisé doit être le même
        const reDetected = detectStandaloneXmlType(serialized);
        assert(label, reDetected === expectedType,
            `XML reconstruit toujours détecté comme "${expectedType}"`,
            `relu = ${reDetected}`);
    } catch (e) {
        fatalError(label, 'serializeStandaloneXml', e);
        return;
    }

    // ---- 5. Round-trip identité
    group(label, 'Round-trip (identité)');
    try {
        const reParsed = processor.parseStandaloneXml(serialized);
        for (const field of roundTripFields) {
            const equal = deepEqualJson(reParsed[field], parsed[field]);
            assert(label, equal,
                `Round-trip : ${field} identique (deep-equal)`,
                equal ? null : `original=${summarize(parsed[field])} / round-trip=${summarize(reParsed[field])}`);
        }
    } catch (e) {
        fatalError(label, 'Round-trip identité', e);
    }

    // ---- 6. Round-trip avec modification
    group(label, 'Round-trip (titre modifié)');
    try {
        // Choix du champ porte-titre selon le format :
        //  - Glossaire (XML standalone) : `name` (aligné sur le schema éditeur)
        //  - Test/Banque de questions   : `bank_name` (recopié dans `title` pour cohérence)
        const titleField = parsed.bank_name !== undefined
            ? 'bank_name'
            : (parsed.name !== undefined ? 'name' : 'title');
        const newTitle   = `MODIF ${Date.now()}`;
        const modified   = { ...parsed, [titleField]: newTitle };
        if (titleField === 'bank_name') modified.title = newTitle; // garde la cohérence

        const reSerialized = processor.serializeStandaloneXml(modified);
        const reParsed     = processor.parseStandaloneXml(reSerialized);
        const readBack     = reParsed[titleField];

        assert(label, readBack === newTitle,
            `${titleField} modifié persiste après round-trip`,
            `lu = "${readBack}"`);

        // Champs non-titre préservés
        for (const field of roundTripFields.filter(f => f !== titleField && f !== 'title')) {
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
// Run + render
// =========================================================================

async function runAll() {
    for (const suite of SUITES) await runSuite(suite);
    renderResults();
}

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
            <span class="type-header__count">${block.pass} OK · ${block.fail} KO</span>
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
