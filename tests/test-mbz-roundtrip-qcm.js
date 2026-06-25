/**
 * Tests round-trip MBZ pour le module QCM (simplequiz).
 *
 * Première étape de la migration de l'éditeur Sucrerie vers Caramel : on vérifie
 * que les fonctions inverses ajoutées dans QCM.js (parseFiles + serializeFiles)
 * permettent un round-trip propre :
 *   .mbz original
 *     → extractMbz                 (mbz-utils)
 *     → QCM.parseFiles             (nouvelle fonction inverse)
 *     → JSON éditeur { title, questions }
 *     → QCM.serializeFiles         (patch in-place)
 *     → buildMbz                   (mbz-utils)
 *     → .mbz reconstruit
 *     → extractMbz + QCM.parseFiles
 *     → JSON éditeur identique au précédent
 *
 * Exécution : ouvrir tests/test-mbz-roundtrip-qcm.html depuis un serveur local.
 */

import { extractMbz, buildMbz } from '../js/moodle/mbz-utils.js';
import QCM from '../js/moodle/processors/activities/QCM.js';

// =========================================================================
// Mini-framework d'assertions (sans dépendance externe)
// =========================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let currentGroup = '';

function group(name) {
    currentGroup = name;
    results.push({ type: 'group', name });
}

function assert(condition, message, diagnostic = null) {
    const entry = {
        type:   'assertion',
        status: condition ? 'PASS' : 'FAIL',
        group:  currentGroup,
        message,
        diagnostic
    };
    if (condition) passCount++; else failCount++;
    results.push(entry);
    console.log(`[${entry.status}] ${currentGroup ? `[${currentGroup}] ` : ''}${message}`);
    if (diagnostic) console.log('  →', diagnostic);
}

function fatalError(label, err) {
    failCount++;
    results.push({
        type:       'assertion',
        status:     'FAIL',
        group:      currentGroup,
        message:    label,
        diagnostic: (err?.stack || err?.message || String(err))
    });
    console.error(`[FAIL] ${label}`, err);
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

// =========================================================================
// Suite de tests
// =========================================================================

async function runTests() {
    const FIXTURE = 'tests/fixtures/qcm-test.mbz';

    // ------------------------------------------------------------------
    group('Chargement fixture');
    let buffer;
    try {
        buffer = await loadFixture(FIXTURE);
        assert(buffer.byteLength > 0,
            `Fixture chargée (${buffer.byteLength} octets)`);
    } catch (e) {
        fatalError('Chargement fixture', e);
        return; // pas la peine de continuer
    }

    // ------------------------------------------------------------------
    group('extractMbz');
    let extracted;
    try {
        extracted = await extractMbz(buffer);
        assert(extracted.moduleName === 'simplequiz',
            'moduleName détecté : "simplequiz"',
            `lu = ${extracted.moduleName}`);
        assert(typeof extracted.activityDir === 'string' && extracted.activityDir.startsWith('activities/simplequiz_'),
            'activityDir cohérent',
            `lu = ${extracted.activityDir}`);
        assert(typeof extracted.files === 'object' && Object.keys(extracted.files).length > 0,
            `files contient ${Object.keys(extracted.files).length} entrées`);
        assert(!!extracted.files[`${extracted.activityDir}/simplequiz.xml`],
            'simplequiz.xml présent dans files');
        assert(extracted.info?.eleaType === 'elea_qcm',
            'info.eleaType = "elea_qcm"',
            `lu = ${extracted.info?.eleaType}`);
    } catch (e) {
        fatalError('extractMbz', e);
        return;
    }

    // ------------------------------------------------------------------
    group('QCM.parseFiles (inverse)');
    let parsed;
    try {
        parsed = QCM.parseFiles(extracted.files, extracted.activityDir);
        assert(typeof parsed.title === 'string',
            'title est une string',
            `type=${typeof parsed.title}, valeur=${JSON.stringify(parsed.title)}`);
        assert(parsed.title.length > 0,
            'title non vide',
            `title="${parsed.title}"`);
        assert(Array.isArray(parsed.questions),
            'questions est un tableau',
            `type=${typeof parsed.questions}, isArray=${Array.isArray(parsed.questions)}`);
        assert(parsed.questions.length > 0,
            `questions contient au moins 1 entrée (${parsed.questions.length})`);
        assert(typeof parsed._context === 'object' && parsed._context !== null,
            '_context présent');
        assert(typeof parsed._context?.moduleId === 'string' && parsed._context.moduleId.length > 0,
            '_context.moduleId rempli',
            `moduleId="${parsed._context?.moduleId}"`);
    } catch (e) {
        fatalError('QCM.parseFiles', e);
        return;
    }

    // ------------------------------------------------------------------
    group('QCM.serializeFiles (patch in-place)');
    let patchedFiles;
    try {
        patchedFiles = cloneFiles(extracted.files);
        QCM.serializeFiles(parsed, patchedFiles, extracted.activityDir);

        const xmlPath = `${extracted.activityDir}/simplequiz.xml`;
        const newXml = new TextDecoder('utf-8').decode(patchedFiles[xmlPath]);

        assert(newXml.includes(`<name>${parsed.title}</name>`),
            'Le titre original est préservé dans le XML patché');
        assert(newXml.includes('<questions>'),
            'Le tag <questions> est toujours présent');
        assert(newXml.indexOf('<simplequiz') !== -1,
            'Structure simplequiz intacte');
    } catch (e) {
        fatalError('QCM.serializeFiles', e);
        return;
    }

    // ------------------------------------------------------------------
    group('Round-trip complet (rebuild MBZ)');
    try {
        const newMbz = await buildMbz(patchedFiles);
        assert(newMbz instanceof Uint8Array && newMbz.length > 0,
            'buildMbz produit un Uint8Array non vide',
            `taille = ${newMbz?.length}`);

        const reExtracted = await extractMbz(newMbz);
        assert(reExtracted.moduleName === 'simplequiz',
            'Re-extraction : moduleName toujours "simplequiz"',
            `relu = ${reExtracted.moduleName}`);

        const reParsed = QCM.parseFiles(reExtracted.files, reExtracted.activityDir);
        assert(reParsed.title === parsed.title,
            'Round-trip : title identique',
            `original="${parsed.title}" / round-trip="${reParsed.title}"`);
        assert(JSON.stringify(reParsed.questions) === JSON.stringify(parsed.questions),
            'Round-trip : questions identiques (JSON deep-equal)',
            `lengths : ${parsed.questions.length} → ${reParsed.questions.length}`);
    } catch (e) {
        fatalError('Round-trip complet', e);
    }

    // ------------------------------------------------------------------
    group('Modification + round-trip (titre modifié)');
    try {
        const modifiedData = {
            ...parsed,
            title: 'TITRE MODIFIÉ POUR LE TEST'
        };
        const filesCopy = cloneFiles(extracted.files);
        QCM.serializeFiles(modifiedData, filesCopy, extracted.activityDir);

        const newMbz = await buildMbz(filesCopy);
        const reExtracted = await extractMbz(newMbz);
        const reParsed = QCM.parseFiles(reExtracted.files, reExtracted.activityDir);

        assert(reParsed.title === 'TITRE MODIFIÉ POUR LE TEST',
            'Titre modifié correctement persisté après round-trip',
            `lu = "${reParsed.title}"`);
        assert(JSON.stringify(reParsed.questions) === JSON.stringify(parsed.questions),
            'Questions inchangées après modification du titre',
            `original ${parsed.questions.length} q. / round-trip ${reParsed.questions.length} q.`);
    } catch (e) {
        fatalError('Modification + round-trip', e);
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

    for (const r of results) {
        if (r.type === 'group') {
            const div = document.createElement('div');
            div.className = 'step__group';
            div.textContent = r.name;
            root.appendChild(div);
            continue;
        }

        const div = document.createElement('div');
        div.className = `step step--${r.status.toLowerCase()}`;

        const status = document.createElement('span');
        status.className = `step__status step__status--${r.status.toLowerCase()}`;
        status.textContent = r.status;
        div.appendChild(status);

        const msg = document.createTextNode(r.message);
        div.appendChild(msg);

        if (r.diagnostic) {
            const diag = document.createElement('span');
            diag.className = 'step__diagnostic';
            diag.textContent = r.diagnostic;
            div.appendChild(diag);
        }

        root.appendChild(div);
    }
}

// =========================================================================
// Lancement
// =========================================================================

runTests().catch(err => {
    console.error('Erreur fatale :', err);
    document.getElementById('test-results').innerHTML =
        `<pre style="color:#721c24; padding:16px; background:#f8d7da;">Erreur fatale : ${err.message}\n\n${err.stack}</pre>`;
});
