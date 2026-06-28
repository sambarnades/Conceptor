/**
 * @file Générateur d'activités par lot (batch) — H5P (.h5p) ET Moodle/Éléa (.mbz/.xml).
 *
 * Principe : on appelle les VRAIS handlers de création de Caramel (handleH5PCreation,
 * handlePageCreation, handleQCMCreation, …) exactement comme le ferait un clic dans l'app,
 * et on intercepte le Blob produit via l'événement `generation:complete` que chaque handler
 * émet déjà. On rassemble tous les Blobs dans une archive ZIP maîtresse et on la télécharge.
 *
 * Avantage : 100 % du code de packaging de l'app est réutilisé (healer, processors, creator,
 * génération d'IDs Moodle, thèmes de Page, etc.) — aucune logique dupliquée, aucun risque de
 * dérive. Aucun fichier de Caramel n'est modifié : ce script ne fait qu'importer et appeler.
 *
 * Pré-requis DOM (fournis par index.html) : un échafaudage de notifications caché, pour que
 * addNotification()/updateBadge() trouvent leurs éléments et ne lèvent pas d'erreur.
 */

import { h5pModules, moodleModules } from '../../js/core/definitions.js';
import { loadTranslations } from '../../js/core/translation.js';
import { handleH5PCreation } from '../../js/h5p/h5p-creator.js';
import {
    handlePageCreation,
    handleLivreCreation,
    handleMillionnaireCreation,
    handleAppariementCreation,
    handleQCMCreation,
    handleDevoirCreation,
    handleGlossaireXmlCreation,
    handleTestXmlCreation
} from '../../js/moodle/moodle-creator.js';
import { loadJSZip } from '../../js/core/lib-loader.js';

const ROOT = '/'; // l'app est servie à la racine du serveur

/**
 * Catalogue des activités générables par lot.
 * `prefix` = préfixe des fichiers d'exemple dans assets/data/examples/ (prefix_1.json, …).
 * `type`   = 'h5p' | 'mbz' (sert juste au libellé et au regroupement dans le zip).
 * `run`    = appelle le vrai handler de l'app pour CETTE activité.
 */
const ACTIVITIES = [
    // ---- H5P (tous via handleH5PCreation(moduleKey, json)) ----
    ...[
        ['Timeline', 'timeline'], ['Flashcards', 'flashcards'], ['QuizSet', 'quiz_mixte'],
        ['QuizSetQCM', 'quiz_qcm'], ['QuizSetVF', 'quiz_vraifaux'], ['Glossary', 'accordion'],
        ['Crossword', 'crosswords'], ['Essay', 'essay'], ['Summary', 'summary'],
        ['DragTheWords', 'drag_the_words'], ['DragAndDrop', 'drag_and_drop'],
        ['FillInTheBlanks', 'fill_in_the_blanks'], ['MarkTheWords', 'mark_the_words'],
        ['TrueFalse', 'true_false'], ['MultipleChoice', 'multiple_choice'],
        ['FindTheWords', 'find_the_words'], ['SortParagraphs', 'sort_the_paragraphs'],
        ['SingleChoiceSet', 'single_choice_set'], ['DialogCards', 'dialog_cards'],
        ['ComplexFillTheBlanks', 'complex_fill_blanks'], ['Chart', 'charts'],
        ['CoursePresentation', 'course_presentation'],
        ['InteractiveBook', 'interactive_book'], ['InteractiveVideo', 'interactive_video']
    ].map(([key, prefix]) => ({
        key, prefix, type: 'h5p',
        registry: h5pModules,
        run: (json) => handleH5PCreation(key, json)
    })),

    // ---- Moodle / Éléa (chaque handler dédié) ----
    { key: 'Page', prefix: 'page', type: 'mbz', registry: moodleModules, run: (json) => handlePageCreation(json, 'mbz') },
    { key: 'Livre', prefix: 'livre', type: 'mbz', registry: moodleModules, run: (json) => handleLivreCreation(json, 'mbz') },
    { key: 'Millionnaire', prefix: 'millionnaire', type: 'mbz', registry: moodleModules, run: (json) => handleMillionnaireCreation(json) },
    { key: 'Appariement', prefix: 'appariement', type: 'mbz', registry: moodleModules, run: (json) => handleAppariementCreation(json) },
    { key: 'QCM', prefix: 'qcm', type: 'mbz', registry: moodleModules, run: (json) => handleQCMCreation(json) },
    { key: 'Devoir', prefix: 'devoir', type: 'mbz', registry: moodleModules, run: (json) => handleDevoirCreation(json) },
    { key: 'glossaireXml', prefix: 'glossaire_xml', type: 'xml', registry: moodleModules, run: (json) => handleGlossaireXmlCreation(json) },
    { key: 'test_elea', prefix: 'test', type: 'xml', registry: moodleModules, run: (json) => handleTestXmlCreation(json) }
].filter(a => a.registry && a.registry[a.key]); // ne garder que les activités réellement enregistrées

// ---------------------------------------------------------------------------
// Interception du résultat : on résout sur `generation:complete`, on rejette
// sur une notification d'erreur, et on borne par un timeout de sécurité.
// ---------------------------------------------------------------------------
function captureResult(timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
        const onComplete = (e) => { cleanup(); resolve({ blob: e.detail.blob, fileName: e.detail.fileName }); };
        const onNotif = (e) => {
            if (e.detail && e.detail.status === 'error') {
                cleanup();
                reject(new Error(e.detail.technicalMessage || e.detail.userMessage || e.detail.errorMessage || 'erreur de génération'));
            }
        };
        const timer = setTimeout(() => { cleanup(); reject(new Error('délai dépassé (aucun résultat émis)')); }, timeoutMs);
        function cleanup() {
            document.removeEventListener('generation:complete', onComplete);
            document.removeEventListener('notification:added', onNotif);
            clearTimeout(timer);
        }
        document.addEventListener('generation:complete', onComplete);
        document.addEventListener('notification:added', onNotif);
    });
}

async function generateOne(activity, jsonText) {
    const result = captureResult();           // armer AVANT d'appeler le handler
    try {
        await activity.run(jsonText);          // le handler émet l'événement intercepté ci-dessus
    } catch (e) {
        // certains handlers lèvent en plus de notifier ; captureResult gère déjà la notif d'erreur
    }
    return result;                             // { blob, fileName }
}

// ---------------------------------------------------------------------------
// Découverte des exemples : sonde prefix_1.json, prefix_2.json … jusqu'au 404.
// ---------------------------------------------------------------------------
async function discoverExamples(prefix, maxProbe = 12) {
    const found = [];
    for (let i = 1; i <= maxProbe; i++) {
        const url = `${ROOT}assets/data/examples/${prefix}_${i}.json`;
        try {
            const res = await fetch(url);
            if (!res.ok) break;
            found.push({ text: await res.text(), index: i });
        } catch (_) { break; }
    }
    return found;
}

function extOf(fileName, fallback) {
    const m = /\.([a-z0-9]+)$/i.exec(fileName || '');
    return m ? m[1] : fallback;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const els = {
    list: document.getElementById('activity-list'),
    run: document.getElementById('run'),
    runFlat: document.getElementById('run-flat'),
    selectAll: document.getElementById('select-all'),
    lang: document.getElementById('lang'),
    log: document.getElementById('log'),
    progress: document.getElementById('progress')
};

function log(msg, cls = '') {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = msg;
    els.log.appendChild(line);
    els.log.scrollTop = els.log.scrollHeight;
}

function buildActivityList() {
    for (const act of ACTIVITIES) {
        const mod = act.registry[act.key];
        const row = document.createElement('label');
        row.className = 'act-row';
        row.innerHTML =
            `<input type="checkbox" value="${act.key}" checked> ` +
            `<span class="act-badge ${act.type}">${act.type.toUpperCase()}</span> ` +
            `<span class="act-key">${act.key}</span> ` +
            `<span class="act-name">${mod.englishName || ''}</span>`;
        els.list.appendChild(row);
    }
}

function selectedKeys() {
    return new Set([...els.list.querySelectorAll('input:checked')].map(i => i.value));
}

/**
 * Lance la génération de la batterie.
 * @param {boolean} flat - true : tous les .h5p/.mbz à la racine du zip (sans sous-dossiers).
 */
async function run(flat = false) {
    els.run.disabled = true;
    els.runFlat.disabled = true;
    els.log.innerHTML = '';
    const lang = els.lang.value;
    const sel = selectedKeys();
    const todo = ACTIVITIES.filter(a => sel.has(a.key));
    const done = () => { els.run.disabled = false; els.runFlat.disabled = false; };
    if (todo.length === 0) { log('Aucune activité sélectionnée.', 'warn'); done(); return; }

    log(`Chargement de la langue « ${lang} »…`);
    await loadTranslations(lang); // met à jour currentLang (binding live vu par les handlers)

    log(`Démarrage — ${todo.length} activité(s)${flat ? ' · mode à plat' : ''}.`);
    await loadJSZip();              // charge la lib ; expose window.JSZip (ne retourne rien)
    const zip = new window.JSZip();
    let ok = 0, fail = 0, total = 0;

    for (const act of todo) {
        const examples = await discoverExamples(act.prefix);
        if (examples.length === 0) { log(`· ${act.key} : aucun exemple (${act.prefix}_*.json).`, 'warn'); continue; }
        const folder = flat ? zip : zip.folder(`${act.type}_${act.key}`);
        for (const ex of examples) {
            total++;
            try {
                const { blob, fileName } = await generateOne(act, ex.text);
                if (!blob) throw new Error('blob vide');
                const ext = extOf(fileName, act.type === 'h5p' ? 'h5p' : (act.type === 'xml' ? 'xml' : 'mbz'));
                const name = `${act.prefix}_${ex.index}.${ext}`;
                folder.file(name, blob);
                ok++;
                log(`  ✓ ${flat ? name : act.key + '/' + name} (${(blob.size / 1024).toFixed(1)} Ko)`, 'ok');
            } catch (e) {
                fail++;
                log(`  ✗ ${act.key}/${act.prefix}_${ex.index} : ${e.message}`, 'err');
                console.error(`[batch] ${act.key} #${ex.index}`, e);
            }
            els.progress.textContent = `${ok + fail} traités · ${ok} ok · ${fail} échec`;
        }
    }

    if (ok === 0) { log('Aucun fichier généré, rien à packager.', 'warn'); done(); return; }

    log(`Compression de l'archive (${ok} fichiers)…`);
    const masterBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const dateStr = new Date().toISOString().slice(0, 16).replace(/[:T-]/g, '').slice(0, 12);
    const url = URL.createObjectURL(masterBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caramel-batch-${lang}${flat ? '-plat' : ''}-${dateStr}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    log(`Terminé : ${ok} réussite(s), ${fail} échec(s) sur ${total}. Archive téléchargée.`, 'done');
    done();
}

// Init
buildActivityList();
els.selectAll.addEventListener('change', e => {
    els.list.querySelectorAll('input[type=checkbox]').forEach(i => { i.checked = e.target.checked; });
});
els.run.addEventListener('click', () => run(false));
els.runFlat.addEventListener('click', () => run(true));
log(`Prêt — ${ACTIVITIES.length} activités détectées (H5P + Moodle). Sélectionne puis « Générer le zip ».`);
