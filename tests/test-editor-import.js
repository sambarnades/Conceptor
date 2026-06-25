/**
 * Tests d'intégration : l'éditeur cara_dev2 doit savoir charger un MBZ ou un
 * XML standalone via `extractJsonFromNotification` (étendu en S1B).
 *
 * Pour chaque type, on simule la création d'une `notification` Caramel telle
 * que la pipeline IA / l'UI manage produirait, et on vérifie que :
 *
 *   1. extractJsonFromNotification ne renvoie pas null
 *   2. Le JSON produit a bien la forme attendue (champs principaux remplis)
 *   3. Le JSON est strictement égal à ce que processor.parseFiles /
 *      processor.parseStandaloneXml produit en direct (= aiguillage correct)
 *   4. La notification est annotée avec moduleKey + contexte d'import
 *      (utile pour la sauvegarde ultérieure)
 *
 * Régression côté H5P : un cas sentinel vérifie que les notifications
 * legacy (type=h5p, originalJsonData, jsonData direct) continuent de marcher.
 *
 * Exécution : ouvrir tests/test-editor-import.html depuis un serveur local.
 */

import { extractJsonFromNotification } from '../js/editor/index.js';
import { extractMbz }                  from '../js/moodle/mbz-utils.js';

import QCM       from '../js/moodle/processors/activities/QCM.js';
import Glossaire from '../js/moodle/processors/activities/Glossaire.js';
import Test      from '../js/moodle/processors/activities/Test.js';

// =========================================================================
// Mini-framework
// =========================================================================

let passCount = 0;
let failCount = 0;
const resultsByType = new Map();

function startType(label) { resultsByType.set(label, { pass: 0, fail: 0, items: [] }); }
function group(label, name) { resultsByType.get(label).items.push({ type: 'group', name }); }
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

async function loadAsBlob(path, mime = 'application/octet-stream') {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} sur ${path}`);
    const buffer = await resp.arrayBuffer();
    return new Blob([buffer], { type: mime });
}

async function loadAsText(path) {
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
// Test 1 — MBZ QCM via notification.type === 'mbz'
// =========================================================================

async function testMbzQcm() {
    const label = 'MBZ — QCM (notification.type=mbz)';
    startType(label);

    group(label, 'Construction notification fake');
    let notification, blob;
    try {
        blob = await loadAsBlob('tests/fixtures/qcm-test.mbz', 'application/x-moodle-backup');
        notification = {
            type: 'mbz',
            blob,
            titleKey: 'qcm_name'
        };
        assert(label, blob.size > 0, `Blob construit (${blob.size} octets)`);
    } catch (e) {
        fatalError(label, 'Construction notification', e);
        return;
    }

    group(label, 'extractJsonFromNotification (dispatch)');
    let extracted;
    try {
        extracted = await extractJsonFromNotification(notification);
        assert(label, extracted != null, 'extractJsonFromNotification renvoie un objet');
        assert(label, typeof extracted.title === 'string' && extracted.title.length > 0,
            'JSON contient un title non vide',
            `title = ${summarize(extracted?.title)}`);
        assert(label, Array.isArray(extracted.questions) && extracted.questions.length > 0,
            'JSON contient des questions',
            `questions = ${summarize(extracted?.questions)}`);
    } catch (e) {
        fatalError(label, 'extractJsonFromNotification', e);
        return;
    }

    group(label, 'Annotation de la notification');
    try {
        assert(label, notification.moduleKey === 'QCM',
            'notification.moduleKey === "QCM"',
            `lu = ${notification.moduleKey}`);
        assert(label, !!notification._mbzFiles && Object.keys(notification._mbzFiles).length > 0,
            'notification._mbzFiles présent (utile pour la sauvegarde)');
        assert(label, typeof notification._mbzDir === 'string'
                && notification._mbzDir.startsWith('activities/simplequiz_'),
            'notification._mbzDir cohérent',
            `lu = ${notification._mbzDir}`);
        assert(label, notification._mbzModule === 'simplequiz',
            'notification._mbzModule === "simplequiz"');
    } catch (e) {
        fatalError(label, 'Annotation', e);
    }

    group(label, 'Cohérence avec QCM.parseFiles direct');
    try {
        const buffer = await blob.arrayBuffer();
        const extractedMbz = await extractMbz(buffer);
        const direct = QCM.parseFiles(extractedMbz.files, extractedMbz.activityDir);
        assert(label, deepEqualJson(extracted, direct),
            'JSON via éditeur === JSON via parseFiles direct',
            deepEqualJson(extracted, direct) ? null
                : `editor=${summarize(extracted)} / direct=${summarize(direct)}`);
    } catch (e) {
        fatalError(label, 'Cohérence', e);
    }
}

// =========================================================================
// Test 2 — XML Glossaire standalone via notification.type === 'xml-standalone'
// =========================================================================

async function testXmlGlossaire() {
    const label = 'XML — Glossaire standalone';
    startType(label);

    group(label, 'Construction notification fake');
    let notification, xmlString;
    try {
        xmlString = await loadAsText('tests/fixtures/glossaire-test.xml');
        notification = {
            type: 'xml-standalone',
            xml: xmlString
        };
        assert(label, xmlString.length > 0, `XML chargé (${xmlString.length} caractères)`);
    } catch (e) {
        fatalError(label, 'Construction notification', e);
        return;
    }

    group(label, 'extractJsonFromNotification (dispatch)');
    let extracted;
    try {
        extracted = await extractJsonFromNotification(notification);
        assert(label, extracted != null, 'extractJsonFromNotification renvoie un objet');
        // Glossaire utilise `name` (pas `title`) car c'est ce qu'attend le
        // schema `elea_glossaire` dans content-detector.js.
        assert(label, typeof extracted.name === 'string' && extracted.name.length > 0,
            'JSON contient un name non vide',
            `name = ${summarize(extracted?.name)}`);
        assert(label, Array.isArray(extracted.entries) && extracted.entries.length > 0,
            'JSON contient des entries',
            `entries = ${summarize(extracted?.entries)}`);
    } catch (e) {
        fatalError(label, 'extractJsonFromNotification', e);
        return;
    }

    group(label, 'Annotation de la notification');
    try {
        assert(label, notification.moduleKey === 'Glossaire',
            'notification.moduleKey === "Glossaire"',
            `lu = ${notification.moduleKey}`);
        assert(label, notification._xmlType === 'glossary_standalone',
            'notification._xmlType === "glossary_standalone"',
            `lu = ${notification._xmlType}`);
    } catch (e) {
        fatalError(label, 'Annotation', e);
    }

    group(label, 'Cohérence avec Glossaire.parseStandaloneXml direct');
    try {
        const direct = Glossaire.parseStandaloneXml(xmlString);
        assert(label, deepEqualJson(extracted, direct),
            'JSON via éditeur === JSON via parseStandaloneXml direct',
            deepEqualJson(extracted, direct) ? null
                : `editor=${summarize(extracted)} / direct=${summarize(direct)}`);
    } catch (e) {
        fatalError(label, 'Cohérence', e);
    }
}

// =========================================================================
// Test 3 — XML Banque de questions standalone
// =========================================================================

async function testXmlQuestionBank() {
    const label = 'XML — Banque de questions standalone';
    startType(label);

    group(label, 'Construction notification fake');
    let notification, xmlString;
    try {
        xmlString = await loadAsText('tests/fixtures/questionbank-test.xml');
        notification = {
            type: 'xml-standalone',
            xml: xmlString
        };
        assert(label, xmlString.length > 0, `XML chargé (${xmlString.length} caractères)`);
    } catch (e) {
        fatalError(label, 'Construction notification', e);
        return;
    }

    group(label, 'extractJsonFromNotification (dispatch)');
    let extracted;
    try {
        extracted = await extractJsonFromNotification(notification);
        assert(label, extracted != null, 'extractJsonFromNotification renvoie un objet');
        assert(label, typeof extracted.bank_name === 'string' && extracted.bank_name.length > 0,
            'JSON contient un bank_name non vide',
            `bank_name = ${summarize(extracted?.bank_name)}`);
        assert(label, Array.isArray(extracted.questions) && extracted.questions.length > 0,
            'JSON contient des questions',
            `${extracted?.questions?.length} questions`);
    } catch (e) {
        fatalError(label, 'extractJsonFromNotification', e);
        return;
    }

    group(label, 'Annotation de la notification');
    try {
        assert(label, notification.moduleKey === 'Test',
            'notification.moduleKey === "Test"',
            `lu = ${notification.moduleKey}`);
        assert(label, notification._xmlType === 'questionbank_standalone',
            'notification._xmlType === "questionbank_standalone"',
            `lu = ${notification._xmlType}`);
    } catch (e) {
        fatalError(label, 'Annotation', e);
    }

    group(label, 'Cohérence avec Test.parseStandaloneXml direct');
    try {
        const direct = Test.parseStandaloneXml(xmlString);
        assert(label, deepEqualJson(extracted, direct),
            'JSON via éditeur === JSON via parseStandaloneXml direct',
            deepEqualJson(extracted, direct) ? null
                : `editor=${summarize(extracted)} / direct=${summarize(direct)}`);
    } catch (e) {
        fatalError(label, 'Cohérence', e);
    }
}

// =========================================================================
// Test 4 — Sentinel non-régression : notifications classiques
// =========================================================================

async function testRegression() {
    const label = 'Non-régression — chemins existants';
    startType(label);

    group(label, 'originalJsonData (priorité 1) renvoie le JSON tel quel');
    try {
        const fake = { content: 'test', value: 42 };
        const result = await extractJsonFromNotification({
            originalJsonData: fake
        });
        assert(label, deepEqualJson(result, fake),
            'JSON identique (deep clone)',
            deepEqualJson(result, fake) ? null : `lu = ${JSON.stringify(result)}`);
        // Vérif clone (modifier result ne touche pas fake)
        result.value = 100;
        assert(label, fake.value === 42,
            'Deep clone confirmé (modif de la sortie ne pollue pas l\'entrée)');
    } catch (e) {
        fatalError(label, 'originalJsonData', e);
    }

    group(label, 'jsonData (priorité 5) renvoie le JSON tel quel');
    try {
        const fake = { foo: 'bar' };
        const result = await extractJsonFromNotification({ jsonData: fake });
        assert(label, deepEqualJson(result, fake),
            'jsonData direct retourné');
    } catch (e) {
        fatalError(label, 'jsonData', e);
    }

    group(label, 'notification null/vide → null');
    try {
        const r1 = await extractJsonFromNotification(null);
        const r2 = await extractJsonFromNotification(undefined);
        const r3 = await extractJsonFromNotification({});
        assert(label, r1 === null, 'null → null');
        assert(label, r2 === null, 'undefined → null');
        assert(label, r3 === null, '{} → null');
    } catch (e) {
        fatalError(label, 'Cas limites', e);
    }

    group(label, 'type=mbz sans blob → null (gracieux)');
    try {
        const result = await extractJsonFromNotification({ type: 'mbz' });
        assert(label, result === null,
            'type=mbz sans blob retourne null sans throw',
            `lu = ${result}`);
    } catch (e) {
        fatalError(label, 'mbz sans blob', e);
    }

    group(label, 'type=xml-standalone sans xml → null');
    try {
        const result = await extractJsonFromNotification({ type: 'xml-standalone' });
        assert(label, result === null,
            'type=xml-standalone sans xml retourne null sans throw');
    } catch (e) {
        fatalError(label, 'xml sans contenu', e);
    }
}

// =========================================================================
// Run + render
// =========================================================================

async function runAll() {
    await testMbzQcm();
    await testXmlGlossaire();
    await testXmlQuestionBank();
    await testRegression();
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
