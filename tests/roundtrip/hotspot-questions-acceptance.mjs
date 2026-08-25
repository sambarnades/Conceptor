/**
 * hotspot-questions-acceptance.mjs — Banc d'acceptation Node pour les deux « questions hotspot » :
 *   - « Trouver la zone »  (FindTheHotspot,       H5P.ImageHotspotQuestion 1.8)
 *   - « Trouver les zones » (FindMultipleHotspots, H5P.ImageMultipleHotspotQuestion 1.0)
 *
 * Exécute le VRAI pipeline Caramel hors navigateur (via bootstrap.mjs) pour couvrir, au niveau
 * DONNÉES, les critères d'acceptation indépendants de la vision, du LLM et du DOM visuel :
 *   - processeur : forme PLATE (LLM) ET forme COMPLÈTE (content.json) + IDEMPOTENCE
 *   - conversion CENTRES → COINS haut-gauche bornée ([0,100], zone entière dans l'image)
 *   - formes d'image opposées : FTH backgroundImageSettings APLATI vs FMH IMBRIQUÉ
 *     (non-régression sur les paquets Éléa de référence à la racine du dépôt)
 *   - numberHotspots plafonné au nombre de zones correctes (FMH)
 *   - field-constraints : tous les champs en `plain`
 *   - definitions + processorMetadata (H5P.Question 1.5 pour FTH, 1.4 pour FMH) + customOrder
 *   - détection : FindMultipleHotspots AVANT FindTheHotspot AVANT ImageHotspots (plat + complet)
 *   - ROUND-TRIP éditeur : normalize → denormalize → process → re-normalize STABLE (point fixe)
 *     + champ `figure` (cercle/rectangle) et compat ascendante `_figure`
 *   - validation : « au moins une zone correcte »
 *
 * Lancer : node tests/roundtrip/hotspot-questions-acceptance.mjs
 * Code de sortie : 0 si tout passe, 1 sinon.
 *
 * @module tests/roundtrip/hotspot-questions-acceptance
 */

// 1) bootstrap EN PREMIER (stubs navigateur + seed + vendors).
import { ensureJSZip, installIdentitySanitizer } from './bootstrap.mjs';
import { readFileSync, existsSync } from 'node:fs';

// Sanitizer identité : sans DOMPurify (absent en Node), le sanitizer fail-closed ÉCHAPPE le HTML.
await installIdentitySanitizer();

// 2) Imports Caramel (après bootstrap).
const healer = await import('../../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../../js/h5p/processors/index.js');
const fieldConstraints = await import('../../js/h5p/field-constraints.js');
const definitions = await import('../../js/core/definitions.js');

// Modules ÉDITEUR (miroirs Sucrerie) — peuvent dépendre du DOM à l'évaluation.
let contentDetector = null, validators = null, editorImportError = null;
try {
    contentDetector = await import('../../js/editor/content-detector.js');
    validators = await import('../../js/editor/validators.js');
} catch (e) {
    editorImportError = e;
}

// ---------------------------------------------------------------------------
// Mini-framework d'assertions (même style que ih-acceptance.mjs)
// ---------------------------------------------------------------------------
let passed = 0, failed = 0, skipped = 0;
const failures = [];
function ok(cond, label, detail) {
    if (cond) { passed++; }
    else { failed++; failures.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}
function section(t) { console.log(`\n=== ${t} ===`); }
/** Égalité à ±0,01 près (les coins sont arrondis à 2 décimales par le processeur). */
function approx(a, b) { return Math.abs(a - b) <= 0.01; }

function healFull(rawObj, moduleKey) {
    let obj = healer.healJsonObject(structuredClone(rawObj), moduleKey);
    obj = healer.healActivitySpecificFields(obj, moduleKey);
    obj = healer.healStructureForActivity(obj, moduleKey);
    return obj;
}
async function healAndProcess(rawObj, moduleKey) {
    const healed = healFull(rawObj, moduleKey);
    const processed = await processH5PContent(moduleKey, healed);
    if (processed && processed.content && processed.dependencies) return processed.content;
    return processed;
}

const FTH = 'FindTheHotspot';
const FMH = 'FindMultipleHotspots';
const ROOT_FTH = 'imageHotspotQuestion';
const ROOT_FMH = 'imageMultipleHotspotQuestion';

// ===========================================================================
// T1 — FTH : forme PLATE (LLM) → content.json (image APLATIE, coins bornés)
// ===========================================================================
section('T1 — FindTheHotspot (forme plate LLM)');
{
    const flat = {
        title: 'Où est le pistil ?',
        taskDescription: 'Cliquez sur le pistil.',
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } },
        hotspots: [
            { label: 'Pistil', correct: true, x: 50, y: 50, width: 20, height: 20, feedbackText: 'Bravo !' },
            // Centre hors bornes + taille aberrante : le coin doit rester dans l'image.
            { label: 'Leurre', correct: false, x: 150, y: -5, width: 30, height: 250, feedbackText: 'Non.' }
        ],
        noneSelectedFeedback: 'Raté, cherchez encore.'
    };
    const c = await healAndProcess(flat, FTH);
    const root = c[ROOT_FTH];
    ok(root && typeof root === 'object', 'racine imageHotspotQuestion présente', JSON.stringify(Object.keys(c || {})));
    // ⚠️ Image APLATIE : le player 1.8 lit backgroundImageSettings.path directement.
    ok(root.backgroundImageSettings?.path === 'images/bg.png', 'image de fond APLATIE (backgroundImageSettings.path)', JSON.stringify(root.backgroundImageSettings));
    ok(!root.backgroundImageSettings?.backgroundImage, 'pas d\'imbrication backgroundImage (forme FTH)', '');
    const hs = root.hotspotSettings;
    ok(hs.taskDescription === 'Cliquez sur le pistil.', 'taskDescription conservée', hs.taskDescription);
    ok(hs.noneSelectedFeedback === 'Raté, cherchez encore.', 'noneSelectedFeedback conservé', hs.noneSelectedFeedback);
    ok(hs.showFeedbackAsPopup === true, 'showFeedbackAsPopup = true par défaut', String(hs.showFeedbackAsPopup));
    ok(hs.l10n && typeof hs.l10n.retryText === 'string' && typeof hs.l10n.closeText === 'string', 'l10n retry/close présents', JSON.stringify(hs.l10n));
    ok(typeof c.scoreBarLabel === 'string' && c.scoreBarLabel.length > 0, 'scoreBarLabel présent');
    ok(typeof c.a11yRetry === 'string' && c.a11yRetry.length > 0, 'a11yRetry présent');
    // Zone 1 : centre (50,50) taille 20 → coin (40,40)
    const z0 = hs.hotspot[0];
    ok(z0.userSettings.correct === true && z0.userSettings.feedbackText === 'Bravo !', 'zone 1 : userSettings corrects', JSON.stringify(z0.userSettings));
    ok(z0.computedSettings.x === 40 && z0.computedSettings.y === 40, 'zone 1 : centre (50,50) → coin (40,40)', JSON.stringify(z0.computedSettings));
    ok(z0.computedSettings.figure === 'circle', 'zone 1 : figure = circle par défaut', z0.computedSettings.figure);
    // Zone 2 : x=150→100, largeur 30 → coin x borné à 70 ; y=-5→0 ; height 250→100 → coin y=0
    const z1 = hs.hotspot[1];
    ok(z1.computedSettings.width === 30 && z1.computedSettings.height === 100, 'zone 2 : tailles bornées [1,100] (250→100)', JSON.stringify(z1.computedSettings));
    ok(z1.computedSettings.x === 70 && z1.computedSettings.y === 0, 'zone 2 : coins bornés (150→70, -5→0)', JSON.stringify(z1.computedSettings));
}

// ===========================================================================
// T2 — FTH : forme COMPLÈTE + idempotence + ré-aplatissement
// ===========================================================================
section('T2 — FindTheHotspot (forme complète, idempotence)');
{
    const flat = {
        title: 'Idem',
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600 },
        hotspots: [{ label: 'Z', correct: true, x: 30, y: 40, width: 20, height: 20, feedbackText: 'ok' }]
    };
    const c1 = await healAndProcess(flat, FTH);
    const c2 = await healAndProcess(structuredClone(c1), FTH);
    ok(JSON.stringify(c2) === JSON.stringify(c1), 'idempotence : process(process(flat)) === process(flat)', '');
    // Un JSON collé en forme IMBRIQUÉE (erreur fréquente : copie d'un FMH) est ré-aplati.
    const nested = {
        [ROOT_FTH]: {
            backgroundImageSettings: { backgroundImage: { path: 'images/x.png', mime: 'image/png', width: 10, height: 10 } },
            hotspotSettings: { hotspot: [{ userSettings: { correct: true, feedbackText: '' }, computedSettings: { x: 10, y: 10, width: 20, height: 20, figure: 'circle' } }] }
        }
    };
    const cN = await healAndProcess(nested, FTH);
    ok(cN[ROOT_FTH].backgroundImageSettings?.path === 'images/x.png', 'forme imbriquée collée → ré-APLATIE', JSON.stringify(cN[ROOT_FTH].backgroundImageSettings));
    // Fond absent de la forme complète : repli sur l'image plate injectée par l'UI.
    const noBg = structuredClone(nested);
    delete noBg[ROOT_FTH].backgroundImageSettings;
    noBg.image = { path: 'images/ui.png', mime: 'image/png', width: 5, height: 5 };
    const cB = await healAndProcess(noBg, FTH);
    ok(cB[ROOT_FTH].backgroundImageSettings?.path === 'images/ui.png', 'repli sur l\'image injectée par l\'UI', JSON.stringify(cB[ROOT_FTH].backgroundImageSettings));
    ok(!('image' in cB), 'reliquat plat data.image supprimé', JSON.stringify(Object.keys(cB)));
}

// ===========================================================================
// T3 — FMH : forme PLATE (image IMBRIQUÉE, numberHotspots plafonné)
// ===========================================================================
section('T3 — FindMultipleHotspots (forme plate LLM)');
{
    const flat = {
        title: 'Trouvez les légumes',
        taskDescription: 'Cliquez sur tous les légumes.',
        hotspotName: 'légumes',
        numberHotspots: 5, // > nb de zones correctes (2) → doit être plafonné à 2
        image: { path: 'images/bg.png', mime: 'image/png', width: 1024, height: 576, copyright: { license: 'U' } },
        hotspots: [
            { label: 'Carotte', correct: true, x: 20, y: 30, width: 15, height: 15, feedbackText: 'Bien vu, vous avez repéré' },
            { label: 'Poireau', correct: true, x: 60, y: 70, width: 15, height: 15, feedbackText: 'Oui, encore' },
            { label: 'Tomate (fruit)', correct: false, x: 80, y: 20, width: 15, height: 15, feedbackText: 'Non, la tomate est un fruit !' }
        ],
        noneSelectedFeedback: 'Aucun légume ici.',
        alreadySelectedFeedback: 'Déjà trouvé !'
    };
    const c = await healAndProcess(flat, FMH);
    const root = c[ROOT_FMH];
    ok(root && typeof root === 'object', 'racine imageMultipleHotspotQuestion présente', JSON.stringify(Object.keys(c || {})));
    // ⚠️ Image IMBRIQUÉE : le player 1.0 lit backgroundImageSettings.backgroundImage.path.
    ok(root.backgroundImageSettings?.backgroundImage?.path === 'images/bg.png', 'image de fond IMBRIQUÉE (backgroundImage.path)', JSON.stringify(root.backgroundImageSettings));
    ok(root.backgroundImageSettings?.questionTitle === 'Trouvez les légumes', 'questionTitle rempli depuis title', root.backgroundImageSettings?.questionTitle);
    const hs = root.hotspotSettings;
    ok(hs.hotspotName === 'légumes', 'hotspotName conservé', hs.hotspotName);
    ok(hs.numberHotspots === 2, 'numberHotspots plafonné au nb de zones correctes (5→2)', String(hs.numberHotspots));
    ok(hs.alreadySelectedFeedback === 'Déjà trouvé !', 'alreadySelectedFeedback conservé', hs.alreadySelectedFeedback);
    // Amorce composée par le player (« … 1 of 2 légumes. ») : conservée telle quelle, sans ponctuation ajoutée.
    ok(hs.hotspot[0].userSettings.feedbackText === 'Bien vu, vous avez repéré', 'amorce de feedback conservée sans ponctuation ajoutée', hs.hotspot[0].userSettings.feedbackText);
    ok(!('l10n' in hs) && !('showFeedbackAsPopup' in hs), 'pas de champs FTH parasites (l10n/showFeedbackAsPopup)', JSON.stringify(Object.keys(hs)));

    // Plafonnement : variantes
    const capLow = await healAndProcess({ ...structuredClone(flat), numberHotspots: 1 }, FMH);
    ok(capLow[ROOT_FMH].hotspotSettings.numberHotspots === 1, 'numberHotspots = 1 respecté (≤ zones correctes)', String(capLow[ROOT_FMH].hotspotSettings.numberHotspots));
    const capNone = structuredClone(flat); delete capNone.numberHotspots;
    const cNone = await healAndProcess(capNone, FMH);
    ok(cNone[ROOT_FMH].hotspotSettings.numberHotspots === 2, 'numberHotspots absent → nb de zones correctes', String(cNone[ROOT_FMH].hotspotSettings.numberHotspots));
}

// ===========================================================================
// T4 — FMH : forme COMPLÈTE + idempotence + ré-imbrication
// ===========================================================================
section('T4 — FindMultipleHotspots (forme complète, idempotence)');
{
    const flat = {
        title: 'Idem', hotspotName: 'zones', numberHotspots: 1,
        image: { path: 'images/bg.png', mime: 'image/png', width: 10, height: 10 },
        hotspots: [{ label: 'Z', correct: true, x: 30, y: 40, width: 20, height: 20, feedbackText: 'ok' }]
    };
    const c1 = await healAndProcess(flat, FMH);
    const c2 = await healAndProcess(structuredClone(c1), FMH);
    ok(JSON.stringify(c2) === JSON.stringify(c1), 'idempotence : process(process(flat)) === process(flat)', '');
    // Un JSON collé en forme APLATIE (erreur fréquente : copie d'un FTH) est ré-imbriqué.
    const flatBg = {
        [ROOT_FMH]: {
            backgroundImageSettings: { path: 'images/x.png', mime: 'image/png', width: 10, height: 10 },
            hotspotSettings: { hotspot: [{ userSettings: { correct: true, feedbackText: '' }, computedSettings: { x: 10, y: 10, width: 20, height: 20, figure: 'circle' } }] }
        }
    };
    const cN = await healAndProcess(flatBg, FMH);
    ok(cN[ROOT_FMH].backgroundImageSettings?.backgroundImage?.path === 'images/x.png', 'forme aplatie collée → ré-IMBRIQUÉE', JSON.stringify(cN[ROOT_FMH].backgroundImageSettings));
    // numberHotspots re-plafonné aussi en forme complète (1 seule zone correcte)
    const capped = structuredClone(cN);
    capped[ROOT_FMH].hotspotSettings.numberHotspots = 9;
    const cC = await healAndProcess(capped, FMH);
    ok(cC[ROOT_FMH].hotspotSettings.numberHotspots === 1, 'forme complète : numberHotspots re-plafonné (9→1)', String(cC[ROOT_FMH].hotspotSettings.numberHotspots));
}

// ===========================================================================
// T5 — Non-régression : paquets Éléa de référence (fixtures racine du dépôt)
// ===========================================================================
section('T5 — Fixtures de référence (.h5p Éléa)');
// Ces paquets Éléa sont des fixtures binaires OPTIONNELLES (non versionnées) : on les
// cherche à la racine du dépôt puis dans tests/roundtrip/fixtures/. Absentes → on SKIP
// proprement (le reste du banc, lui, ne dépend d'aucun binaire externe).
{
    const JSZip = await ensureJSZip();
    const CANDIDATE_DIRS = ['../../', './fixtures/', '../fixtures/'];
    const findFixture = (name) => {
        for (const dir of CANDIDATE_DIRS) {
            const url = new URL(`${dir}${name}`, import.meta.url);
            if (existsSync(url)) return url;
        }
        return null;
    };
    const fixtures = [
        { file: 'find-the-hotspot-3024.h5p', moduleKey: FTH, rootKey: ROOT_FTH, mainLib: 'H5P.ImageHotspotQuestion' },
        { file: 'image-multiple-hotspot-question-65081.h5p', moduleKey: FMH, rootKey: ROOT_FMH, mainLib: 'H5P.ImageMultipleHotspotQuestion' }
    ];
    for (const fx of fixtures) {
        const url = findFixture(fx.file);
        if (!url) {
            skipped++;
            console.log(`  ⚠ SKIP ${fx.file} — fixture absente (racine ou tests/roundtrip/fixtures/) ; assertions de non-régression Éléa non exécutées`);
            continue;
        }
        let zip;
        try {
            zip = await JSZip.loadAsync(readFileSync(url));
        } catch (e) {
            ok(false, `${fx.file} lisible`, e.message);
            continue;
        }
        const original = JSON.parse(await zip.files['content/content.json'].async('string'));
        const h5pJson = JSON.parse(await zip.files['h5p.json'].async('string'));
        ok(h5pJson.mainLibrary === fx.mainLib, `${fx.file} : mainLibrary ${fx.mainLib}`, h5pJson.mainLibrary);

        const processed = await healAndProcess(structuredClone(original), fx.moduleKey);
        const rootIn = original[fx.rootKey], rootOut = processed[fx.rootKey];
        ok(rootOut != null, `${fx.file} : racine ${fx.rootKey} conservée`, JSON.stringify(Object.keys(processed || {})));
        if (fx.moduleKey === FTH) {
            ok(rootOut.backgroundImageSettings?.path === rootIn.backgroundImageSettings.path, `${fx.file} : image restée APLATIE`, JSON.stringify(rootOut.backgroundImageSettings?.path));
            ok(!rootOut.backgroundImageSettings?.backgroundImage, `${fx.file} : pas d'imbrication introduite`, '');
        } else {
            ok(rootOut.backgroundImageSettings?.backgroundImage?.path === rootIn.backgroundImageSettings.backgroundImage.path, `${fx.file} : image restée IMBRIQUÉE`, JSON.stringify(rootOut.backgroundImageSettings));
            ok(rootOut.backgroundImageSettings?.questionTitle === rootIn.backgroundImageSettings.questionTitle, `${fx.file} : questionTitle conservé`, rootOut.backgroundImageSettings?.questionTitle);
        }
        const zin = rootIn.hotspotSettings.hotspot, zout = rootOut.hotspotSettings.hotspot;
        ok(zout.length === zin.length, `${fx.file} : nombre de zones conservé`, `${zin.length}→${zout.length}`);
        ok(zout.every((z, i) => z.userSettings.correct === zin[i].userSettings.correct), `${fx.file} : drapeaux correct conservés`, '');
        ok(zout.every((z, i) => z.userSettings.feedbackText === zin[i].userSettings.feedbackText), `${fx.file} : feedbacks conservés à l'identique`, '');
        // Géométrie : identique à l'arrondi près, SAUF clamp volontaire des zones qui débordaient
        // de l'image dans l'éditeur officiel (coin borné à 100 − taille, cf. buildComputedSettings).
        const cornerAttendu = (v, taille) => Math.max(0, Math.min(100 - Math.max(1, Math.min(100, taille)), v));
        ok(zout.every((z, i) => {
            const cin = zin[i].computedSettings, cout = z.computedSettings;
            return approx(cout.x, cornerAttendu(cin.x, cin.width))
                && approx(cout.y, cornerAttendu(cin.y, cin.height))
                && approx(cout.width, cin.width)
                && approx(cout.height, cin.height);
        }), `${fx.file} : géométrie stable (±0,01, coins bornés dans l'image)`,
        JSON.stringify(zout.map((z, i) => [zin[i].computedSettings.x, z.computedSettings.x])));
        ok(zout.every((z, i) => z.computedSettings.figure === (zin[i].computedSettings.figure === 'rectangle' ? 'rectangle' : 'circle')), `${fx.file} : figures conservées`, '');
        if (fx.moduleKey === FMH) {
            const correctCount = zin.filter((z) => z.userSettings.correct).length;
            const n = rootOut.hotspotSettings.numberHotspots;
            ok(Number.isFinite(n) && n >= 1 && n <= Math.max(correctCount, 1), `${fx.file} : numberHotspots borné [1, ${correctCount}]`, String(n));
        }
    }
}

// ===========================================================================
// T6 — field-constraints : tous les champs en plain
// ===========================================================================
section('T6 — field-constraints (tout plain)');
{
    for (const mk of [FTH, FMH]) {
        const entry = (fieldConstraints.FIELD_CONSTRAINTS || {})[mk]
            || (typeof fieldConstraints.getConstraints === 'function' ? fieldConstraints.getConstraints(mk) : null);
        ok(entry != null, `entrée ${mk} trouvée dans field-constraints`, '');
        if (!entry) continue;
        const fields = entry.fields || entry;
        const renders = Object.entries(fields).map(([k, v]) => [k, v.render || v]);
        ok(renders.length > 0, `${mk} : des champs déclarés`, '');
        ok(renders.every(([, r]) => r === 'plain'), `${mk} : tous les render = 'plain'`, JSON.stringify(renders));
        ok(renders.some(([k]) => k === 'hotspots[].feedbackText'), `${mk} : hotspots[].feedbackText déclaré`, '');
    }
    const fmhFields = ((fieldConstraints.FIELD_CONSTRAINTS || {})[FMH] || {}).fields || {};
    ok('hotspotName' in fmhFields && 'alreadySelectedFeedback' in fmhFields, 'FMH : champs propres (hotspotName, alreadySelectedFeedback)', JSON.stringify(Object.keys(fmhFields)));
}

// ===========================================================================
// T7 — definitions + processorMetadata + customOrder
// ===========================================================================
section('T7 — definitions & processorMetadata');
{
    const h5pModules = definitions.h5pModules || (definitions.default && definitions.default.h5pModules);
    for (const [mk, machine] of [[FTH, 'H5P.ImageHotspotQuestion'], [FMH, 'H5P.ImageMultipleHotspotQuestion']]) {
        const entry = h5pModules && h5pModules[mk];
        ok(entry != null, `h5pModules.${mk} existe`, '');
        if (!entry) continue;
        ok(entry.machineName === machine, `${mk} : machineName = ${machine}`, entry.machineName);
        ok(entry.requiresBackgroundImage === true, `${mk} : requiresBackgroundImage = true (flux vision)`, String(entry.requiresBackgroundImage));
        ok((entry.formats || []).includes('H5P'), `${mk} : format H5P déclaré`, JSON.stringify(entry.formats));
        ok(entry.hidden === false, `${mk} : tuile visible`, String(entry.hidden));
    }
    const customOrder = definitions.customOrder || (definitions.default && definitions.default.customOrder);
    if (customOrder) {
        ok(customOrder.includes(FTH) && customOrder.includes(FMH), 'FTH et FMH dans customOrder', '');
    } else ok(true, 'customOrder non exporté (info)');

    // processorMetadata : versions et chaîne H5P.Question DIFFÉRENTES (1.5 vs 1.4)
    const mFth = getModuleMetadata(FTH);
    ok(mFth && mFth.machineName === 'H5P.ImageHotspotQuestion', 'metadata FTH : machineName', mFth?.machineName);
    ok(mFth && mFth.version.major === 1 && mFth.version.minor === 8, 'metadata FTH : version 1.8', JSON.stringify(mFth?.version));
    const qFth = (mFth?.extraDependencies || []).find((d) => d.machineName === 'H5P.Question');
    ok(qFth && qFth.majorVersion === 1 && qFth.minorVersion === 5, 'FTH dépend de H5P.Question 1.5', JSON.stringify(qFth));
    const mFmh = getModuleMetadata(FMH);
    ok(mFmh && mFmh.machineName === 'H5P.ImageMultipleHotspotQuestion', 'metadata FMH : machineName', mFmh?.machineName);
    ok(mFmh && mFmh.version.major === 1 && mFmh.version.minor === 0, 'metadata FMH : version 1.0', JSON.stringify(mFmh?.version));
    const qFmh = (mFmh?.extraDependencies || []).find((d) => d.machineName === 'H5P.Question');
    ok(qFmh && qFmh.majorVersion === 1 && qFmh.minorVersion === 4, 'FMH dépend de H5P.Question 1.4 (lib communautaire)', JSON.stringify(qFmh));
    for (const [label, meta] of [['FTH', mFth], ['FMH', mFmh]]) {
        const deps = (meta?.extraDependencies || []).map((d) => d.machineName);
        for (const need of ['FontAwesome', 'H5P.JoubelUI', 'H5P.FontIcons', 'H5P.Transition']) {
            ok(deps.includes(need), `${label} : extraDependency ${need}`, deps.join(','));
        }
    }
}

// ===========================================================================
// T8 — Détection : FMH avant FTH avant ImageHotspots (plat + complet)
// ===========================================================================
section('T8 — Détection (content-detector)');
if (!contentDetector) {
    failed++;
    failures.push({ label: 'import content-detector.js', detail: editorImportError?.message });
    console.log(`  ✗ content-detector.js NON importable en Node : ${editorImportError?.message}`);
} else {
    const { detectContentType } = contentDetector;
    const detect = (data) => detectContentType(structuredClone(data), null)?.moduleKey;
    // Formes complètes
    ok(detect({ [ROOT_FMH]: { hotspotSettings: {} } }) === FMH, 'complet FMH → FindMultipleHotspots', detect({ [ROOT_FMH]: {} }));
    ok(detect({ [ROOT_FTH]: { hotspotSettings: {} } }) === FTH, 'complet FTH → FindTheHotspot', detect({ [ROOT_FTH]: {} }));
    // Formes plates : FMH capte d'abord ses champs propres (hotspotName / numberHotspots /
    // alreadySelectedFeedback), FTH capte les zones `correct` restantes, ImageHotspots le reste.
    const zone = { label: 'Z', correct: true, x: 10, y: 10, width: 20, height: 20, feedbackText: '' };
    ok(detect({ hotspotName: 'zones', hotspots: [zone] }) === FMH, 'plat + hotspotName → FMH', '');
    ok(detect({ numberHotspots: 2, hotspots: [zone] }) === FMH, 'plat + numberHotspots → FMH', '');
    ok(detect({ alreadySelectedFeedback: 'déjà vu', hotspots: [zone] }) === FMH, 'plat + alreadySelectedFeedback → FMH', '');
    ok(detect({ taskDescription: 'Cliquez', hotspots: [zone] }) === FTH, 'plat correct sans champ FMH → FTH', '');
    // Image interactive NON captée par les questions (pas de champ `correct`)
    ok(detect({ globalColor: '#123456', hotspots: [{ x: 10, y: 10, header: 'P', text: 't' }] }) === 'ImageHotspots',
        'plat sans correct → ImageHotspots (non-régression)', '');
}

// ===========================================================================
// T9 — Round-trip éditeur : normalize → denormalize → process → re-normalize
// ===========================================================================
section('T9 — Round-trip éditeur (point fixe) + figure/_figure');
if (contentDetector) {
    const { normalizeDataForEditor, denormalizeDataForSave, getSchemaForType } = contentDetector;
    const cycle = async (model, mk) => {
        const saved = denormalizeDataForSave(structuredClone(model), mk);
        const content = await healAndProcess(saved, mk);
        return normalizeDataForEditor(structuredClone(content), mk);
    };
    for (const mk of [FTH, FMH]) {
        const flat = {
            title: 'RT', taskDescription: 'Cliquez.',
            image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } },
            hotspots: [
                { label: 'A', correct: true, x: 33.33, y: 44.44, width: 18, height: 12, figure: 'rectangle', feedbackText: 'oui' },
                { label: 'B', correct: false, x: 70, y: 20, width: 20, height: 20, feedbackText: 'non' }
            ],
            ...(mk === FMH ? { hotspotName: 'zones', numberHotspots: 1, alreadySelectedFeedback: 'déjà' } : {})
        };
        const model1 = normalizeDataForEditor(structuredClone(flat), mk);
        ok(model1.hotspots[0].figure === 'rectangle' && model1.hotspots[1].figure === 'circle',
            `${mk} : normalize (plat) expose figure (rectangle/circle)`, JSON.stringify(model1.hotspots.map((h) => h.figure)));
        const model2 = await cycle(model1, mk);
        const model3 = await cycle(model2, mk);
        ok(JSON.stringify(model3) === JSON.stringify(model2), `${mk} : re-normalize STABLE (point fixe atteint)`, '');
        ok(model2.hotspots.length === 2 && model2.hotspots[0].correct === true && model2.hotspots[1].correct === false,
            `${mk} : zones et drapeaux conservés au round-trip`, JSON.stringify(model2.hotspots.map((h) => h.correct)));
        ok(model2.hotspots[0].figure === 'rectangle' && model2.hotspots[1].figure === 'circle',
            `${mk} : figure conservée au round-trip complet`, JSON.stringify(model2.hotspots.map((h) => h.figure)));
        ok(approx(model2.hotspots[0].x, 33.33) && approx(model2.hotspots[0].y, 44.44),
            `${mk} : centres stables (±0,01)`, JSON.stringify([model2.hotspots[0].x, model2.hotspots[0].y]));
        ok(model2.hotspots[0].feedbackText === 'oui' && model2.hotspots[1].feedbackText === 'non',
            `${mk} : feedbacks conservés`, '');
        if (mk === FMH) {
            ok(model2.hotspotName === 'zones' && model2.numberHotspots === 1 && model2.alreadySelectedFeedback === 'déjà',
                'FMH : champs propres conservés au round-trip', JSON.stringify([model2.hotspotName, model2.numberHotspots, model2.alreadySelectedFeedback]));
        }
        // Compat ascendante : l'ancien passthrough caché `_figure` migre vers `figure`.
        const legacy = normalizeDataForEditor(structuredClone({
            ...flat,
            hotspots: [{ label: 'L', correct: true, x: 50, y: 50, width: 20, height: 20, _figure: 'rectangle', feedbackText: '' }]
        }), mk);
        ok(legacy.hotspots[0].figure === 'rectangle' && !('_figure' in legacy.hotspots[0]),
            `${mk} : compat _figure → figure (migration sans reliquat)`, JSON.stringify(legacy.hotspots[0]));
        const legacySaved = denormalizeDataForSave(structuredClone(legacy), mk);
        const legacyRoot = legacySaved[mk === FMH ? ROOT_FMH : ROOT_FTH];
        ok(legacyRoot.hotspotSettings.hotspot[0].computedSettings.figure === 'rectangle',
            `${mk} : _figure hérité ré-émis en figure=rectangle`, '');
        // Schéma éditeur : select figure présent avec défaut circle
        const schema = getSchemaForType(mk);
        const figureField = schema?.sections?.find((s) => s.id === 'hotspots')?.fields?.hotspots?.itemSchema?.figure;
        ok(figureField && figureField.type === 'select' && figureField.default === 'circle',
            `${mk} : schéma — champ figure (select, défaut circle)`, JSON.stringify(figureField));
        ok((figureField?.options || []).map((o) => o.value).join(',') === 'circle,rectangle',
            `${mk} : schéma — options circle|rectangle`, JSON.stringify(figureField?.options));
    }
}

// ===========================================================================
// T10 — Validation : au moins une zone correcte
// ===========================================================================
section('T10 — Validation (au moins une zone correcte)');
if (contentDetector && validators) {
    const { getSchemaForType } = contentDetector;
    const { getValidationErrors } = validators;
    for (const mk of [FTH, FMH]) {
        const schema = getSchemaForType(mk);
        const base = {
            taskDescription: 'Cliquez.',
            hotspots: [
                { label: 'A', correct: false, x: 10, y: 10, width: 20, height: 20, figure: 'circle', feedbackText: '' },
                { label: 'B', correct: false, x: 60, y: 60, width: 20, height: 20, figure: 'circle', feedbackText: '' }
            ]
        };
        const errsNone = getValidationErrors(structuredClone(base), schema);
        ok(errsNone.some((e) => e.path === 'hotspots.0.correct'), `${mk} : 0 zone correcte → erreur bloquante`, JSON.stringify(errsNone));
        const withCorrect = structuredClone(base);
        withCorrect.hotspots[1].correct = true;
        const errsOk = getValidationErrors(withCorrect, schema);
        ok(!errsOk.some((e) => e.path === 'hotspots.0.correct'), `${mk} : 1 zone correcte → pas d'erreur`, JSON.stringify(errsOk));
    }
} else {
    ok(false, 'validators.js importable en Node', editorImportError?.message);
}

// ===========================================================================
// T11 — Anti-chevauchement (forme plate) : tailles réduites, centres intacts
// ===========================================================================
section('T11 — Anti-chevauchement des zones (forme plate uniquement)');
{
    /** Chevauchement STRICT de deux boîtes englobantes (coins haut-gauche + tailles en %). */
    const overlaps = (a, b) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const IMG = { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } };
    const zone = (x, y, correct = false, extra = {}) =>
        ({ label: 'Z', correct, x, y, width: 20, height: 20, feedbackText: 'fb', ...extra });

    for (const [mk, rootKey] of [[FTH, ROOT_FTH], [FMH, ROOT_FMH]]) {
        // Deux zones 20 % dont les centres ne sont distants que de 8 % : superposées à l'entrée.
        const flat = {
            title: 'Overlap', taskDescription: 'Cliquez.', image: structuredClone(IMG),
            hotspots: [zone(50, 50, true), zone(58, 50)],
            ...(mk === FMH ? { hotspotName: 'zones', numberHotspots: 1 } : {})
        };
        const c = await healAndProcess(flat, mk);
        const zs = c[rootKey].hotspotSettings.hotspot.map((h) => h.computedSettings);
        ok(!overlaps(zs[0], zs[1]), `${mk} : zones séparées après process (plus de chevauchement)`, JSON.stringify(zs));
        // Facteur attendu : f = (dx − écart) / demi-somme = (8−1)/20 = 0,35 → 20 % → 7 %.
        ok(zs.every((z) => approx(z.width, 7) && approx(z.height, 7)), `${mk} : tailles réduites 20→7 (proportions conservées)`, JSON.stringify(zs));
        // Les CENTRES (positions vision) n'ont pas bougé : coin + taille/2 = centre d'origine.
        ok(approx(zs[0].x + zs[0].width / 2, 50) && approx(zs[1].x + zs[1].width / 2, 58)
            && zs.every((z) => approx(z.y + z.height / 2, 50)),
        `${mk} : centres préservés (50 et 58)`, JSON.stringify(zs));
        // Idempotence conservée : la 2ᵉ passe (forme complète) ne re-réduit pas.
        const c2 = await healAndProcess(structuredClone(c), mk);
        ok(JSON.stringify(c2) === JSON.stringify(c), `${mk} : idempotence après séparation`, '');

        // Zones ÉLOIGNÉES : aucune retouche (tailles par défaut inchangées).
        const far = {
            title: 'Far', taskDescription: 'Cliquez.', image: structuredClone(IMG),
            hotspots: [zone(20, 30, true), zone(60, 70), zone(80, 20)],
            ...(mk === FMH ? { hotspotName: 'zones' } : {})
        };
        const cf = await healAndProcess(far, mk);
        const zf = cf[rootKey].hotspotSettings.hotspot.map((h) => h.computedSettings);
        ok(zf.every((z) => z.width === 20 && z.height === 20), `${mk} : zones éloignées non retouchées`, JSON.stringify(zf));

        // Chaîne : seule la paire superposée est réduite, la zone éloignée garde 20 %.
        const chain = {
            title: 'Chain', taskDescription: 'Cliquez.', image: structuredClone(IMG),
            hotspots: [zone(50, 50, true), zone(58, 50), zone(10, 90)],
            ...(mk === FMH ? { hotspotName: 'zones' } : {})
        };
        const cc = await healAndProcess(chain, mk);
        const zc = cc[rootKey].hotspotSettings.hotspot.map((h) => h.computedSettings);
        ok(!overlaps(zc[0], zc[1]) && !overlaps(zc[0], zc[2]) && !overlaps(zc[1], zc[2]),
            `${mk} : aucune paire superposée (3 zones)`, JSON.stringify(zc));
        ok(zc[2].width === 20 && zc[2].height === 20, `${mk} : zone hors chevauchement épargnée`, JSON.stringify(zc[2]));

        // Cas dégénéré : centres identiques → plancher 5 %, chevauchement résiduel assumé, pas de boucle infinie.
        const degen = {
            title: 'Degen', taskDescription: 'Cliquez.', image: structuredClone(IMG),
            hotspots: [zone(50, 50, true), zone(50, 50)],
            ...(mk === FMH ? { hotspotName: 'zones' } : {})
        };
        const cd = await healAndProcess(degen, mk);
        const zd = cd[rootKey].hotspotSettings.hotspot.map((h) => h.computedSettings);
        ok(zd.every((z) => z.width === 5 && z.height === 5), `${mk} : centres confondus → plancher 5 % (résiduel assumé)`, JSON.stringify(zd));

        // Forme COMPLÈTE (import Éléa / éditeur visuel) : un chevauchement MANUEL est respecté.
        const full = {
            [rootKey]: {
                backgroundImageSettings: mk === FMH
                    ? { questionTitle: 'T', backgroundImage: structuredClone(IMG) }
                    : structuredClone(IMG),
                hotspotSettings: {
                    taskDescription: 'Cliquez.',
                    ...(mk === FMH ? { hotspotName: 'zones', numberHotspots: 1 } : {}),
                    hotspot: [
                        { userSettings: { correct: true, feedbackText: '' }, computedSettings: { x: 40, y: 40, width: 20, height: 20, figure: 'circle' } },
                        { userSettings: { correct: false, feedbackText: '' }, computedSettings: { x: 48, y: 40, width: 20, height: 20, figure: 'circle' } }
                    ]
                }
            }
        };
        const cFull = await healAndProcess(full, mk);
        const zFull = cFull[rootKey].hotspotSettings.hotspot.map((h) => h.computedSettings);
        ok(zFull.every((z) => z.width === 20 && z.height === 20 && overlaps(zFull[0], zFull[1])),
            `${mk} : forme complète — chevauchement manuel RESPECTÉ (géométrie intacte)`, JSON.stringify(zFull));
    }
}

// ===========================================================================
// T12 — FMH : « Zones à trouver » suit l'ajout/la suppression d'une zone correcte
// Non-régression du bug 6.3.0 : une zone correcte ajoutée dans l'éditeur puis enregistrée
// n'était pas comptabilisée (numberHotspots figé sur l'ancien total → maxScore du player figé).
// ===========================================================================
section('T12 — FMH : total des bonnes réponses après édition');
if (contentDetector) {
    const { normalizeDataForEditor, denormalizeDataForSave } = contentDetector;
    const zone = (label, correct, x, y) => ({
        label, correct, x, y, width: 15, height: 15, figure: 'circle', feedbackText: correct ? 'Bravo, vous avez trouvé' : 'Raté'
    });
    const baseFlat = {
        title: 'Chasse', taskDescription: 'Cliquez sur toutes les zones.', hotspotName: 'légumes',
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } },
        hotspots: [zone('A', true, 20, 20), zone('B', true, 50, 20), zone('C', false, 80, 20)],
        numberHotspots: 2, noneSelectedFeedback: 'Rien', alreadySelectedFeedback: 'Déjà'
    };

    // a) Chargement : valeur alignée sur le nb de zones correctes → baseline posée.
    const model = normalizeDataForEditor(structuredClone(baseFlat), FMH);
    ok(model.numberHotspots === 2 && model._numberHotspotsAuto === 2,
        'FMH : valeur automatique (= nb de zones correctes) → baseline posée', JSON.stringify([model.numberHotspots, model._numberHotspotsAuto]));

    // b) L'utilisateur AJOUTE une zone correcte sans toucher au champ « Zones à trouver ».
    const added = structuredClone(model);
    added.hotspots.push(zone('D', true, 20, 60));
    const savedAdd = denormalizeDataForSave(structuredClone(added), FMH);
    ok(savedAdd[ROOT_FMH].hotspotSettings.numberHotspots === 3,
        'FMH : zone correcte ajoutée → total recalculé (2 → 3)', String(savedAdd[ROOT_FMH].hotspotSettings.numberHotspots));
    const cAdd = await healAndProcess(savedAdd, FMH);
    ok(cAdd[ROOT_FMH].hotspotSettings.numberHotspots === 3,
        'FMH : total conservé après passage par le processeur', String(cAdd[ROOT_FMH].hotspotSettings.numberHotspots));
    ok(normalizeDataForEditor(structuredClone(cAdd), FMH).numberHotspots === 3,
        'FMH : ré-ouverture de l\'éditeur → 3 affiché', '');

    // c) Une zone correcte DÉCOCHÉE fait redescendre le total.
    const removed = structuredClone(model);
    removed.hotspots[1].correct = false;
    const savedRem = denormalizeDataForSave(structuredClone(removed), FMH);
    ok(savedRem[ROOT_FMH].hotspotSettings.numberHotspots === 1,
        'FMH : zone correcte décochée → total recalculé (2 → 1)', String(savedRem[ROOT_FMH].hotspotSettings.numberHotspots));

    // d) Plafond VOLONTAIRE (« trouver 2 zones sur 3 ») : pas de baseline, valeur respectée
    //    même après ajout d'une zone correcte.
    const capFlat = structuredClone(baseFlat);
    capFlat.hotspots.push(zone('D', true, 50, 60)); // 3 zones correctes
    capFlat.numberHotspots = 2;                     // < 3 → restriction délibérée
    const capModel = normalizeDataForEditor(structuredClone(capFlat), FMH);
    ok(capModel.numberHotspots === 2 && capModel._numberHotspotsAuto === undefined,
        'FMH : plafond volontaire (2 sur 3) → aucune baseline', JSON.stringify([capModel.numberHotspots, capModel._numberHotspotsAuto]));
    capModel.hotspots.push(zone('E', true, 80, 60)); // 4 zones correctes
    const savedCap = denormalizeDataForSave(structuredClone(capModel), FMH);
    ok(savedCap[ROOT_FMH].hotspotSettings.numberHotspots === 2,
        'FMH : plafond volontaire préservé malgré l\'ajout d\'une zone correcte', String(savedCap[ROOT_FMH].hotspotSettings.numberHotspots));

    // d-bis) Même plafond volontaire, mais chargé depuis un content.json COMPLET (activité
    //        rouverte) : il ne doit pas être remonté au nb de zones correctes à l'ouverture.
    const fullCap = denormalizeDataForSave(structuredClone(capFlat), FMH);
    fullCap[ROOT_FMH].hotspotSettings.numberHotspots = 2; // plafond volontaire (3 zones correctes)
    const fullModel = normalizeDataForEditor(structuredClone(fullCap), FMH);
    ok(fullModel.numberHotspots === 2 && fullModel._numberHotspotsAuto === undefined,
        'FMH : forme complète — plafond volontaire relu tel quel (pas de remontée)', JSON.stringify([fullModel.numberHotspots, fullModel._numberHotspotsAuto]));
    const fullAuto = structuredClone(fullCap);
    fullAuto[ROOT_FMH].hotspotSettings.numberHotspots = 3; // = nb de zones correctes → automatique
    const fullAutoModel = normalizeDataForEditor(structuredClone(fullAuto), FMH);
    ok(fullAutoModel._numberHotspotsAuto === 3,
        'FMH : forme complète — valeur automatique → baseline posée', String(fullAutoModel._numberHotspotsAuto));

    // e) La baseline ne fuit JAMAIS dans le content.json enregistré.
    ok(!('_numberHotspotsAuto' in savedAdd) && !('_numberHotspotsAuto' in savedAdd[ROOT_FMH].hotspotSettings),
        'FMH : baseline absente du content.json', JSON.stringify(Object.keys(savedAdd)));

    // f) FindTheHotspot (mono-zone) n'est pas concerné : aucune baseline, et le champ
    //    `numberHotspots` — hors schéma FTH — n'est jamais réémis dans son content.json.
    const fthModel = normalizeDataForEditor(structuredClone(baseFlat), FTH);
    ok(!('_numberHotspotsAuto' in fthModel), 'FTH : aucune baseline posée', JSON.stringify(Object.keys(fthModel)));
    const fthSaved = denormalizeDataForSave(structuredClone(fthModel), FTH);
    ok(!('numberHotspots' in fthSaved[ROOT_FTH].hotspotSettings),
        'FTH : numberHotspots absent du content.json', JSON.stringify(Object.keys(fthSaved[ROOT_FTH].hotspotSettings)));
}

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(60)}`);
console.log(`BILAN Questions hotspot : ${passed} OK, ${failed} ÉCHEC(S)${skipped ? `, ${skipped} SKIP (fixtures Éléa absentes)` : ''}`);
if (failed) {
    console.log('\nÉchecs :');
    for (const f of failures) console.log(`  - ${f.label}${f.detail ? ' :: ' + f.detail : ''}`);
}
process.exit(failed ? 1 : 0);
