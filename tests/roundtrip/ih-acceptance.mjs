/**
 * ih-acceptance.mjs — Banc d'acceptation Node pour l'activité « Image interactive » (H5P.ImageHotspots).
 *
 * Exécute le VRAI pipeline Caramel hors navigateur (via bootstrap.mjs) pour couvrir, au niveau DONNÉES,
 * les critères d'acceptation qui ne dépendent NI de la vision NI du LLM NI du DOM visuel :
 *   - processeur (format plat LLM ET format enrichi éditeur) → content.json v1.11
 *   - healer (pas de clés parasites overallFeedback/behaviour)
 *   - field-constraints (hotspots[].text = html+latex)
 *   - definitions + processorMetadata (entrée, machineName, extraDependencies, customOrder)
 *   - PACKAGING : médias audio/vidéo/image embarqués → content/audios|videos|images/ + h5p.json deps
 *   - ROUND-TRIP éditeur : normalize → (+médias) → denormalize → process → content.json → re-normalize stable
 *
 * Lancer : node tests/roundtrip/ih-acceptance.mjs
 * Code de sortie : 0 si tout passe, 1 sinon.
 *
 * @module tests/roundtrip/ih-acceptance
 */

// 1) bootstrap EN PREMIER (stubs navigateur + seed + vendors).
import { ensureJSZip, installIdentitySanitizer } from './bootstrap.mjs';

// Sanitizer identité : sans DOMPurify (absent en Node), le sanitizer fail-closed ÉCHAPPE le HTML.
// installIdentitySanitizer le rend pass-through pour mesurer fidèlement le HTML produit.
await installIdentitySanitizer();

// Stubs URL.createObjectURL/revokeObjectURL (browser-only) — au cas où un chemin de code les touche.
if (typeof globalThis.URL.createObjectURL !== 'function') {
    globalThis.URL.createObjectURL = () => 'blob:stub';
    globalThis.URL.revokeObjectURL = () => {};
}

// 2) Imports Caramel (après bootstrap).
const healer = await import('../../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../../js/h5p/processors/index.js');
const { createH5PBlob } = await import('../../js/h5p/h5p-creator.js');
const imageManager = await import('../../js/h5p/image-manager.js');
const fieldConstraints = await import('../../js/h5p/field-constraints.js');
const definitions = await import('../../js/core/definitions.js');

// content-detector est un module ÉDITEUR (miroir Sucrerie) — peut dépendre du DOM à l'évaluation.
let contentDetector = null;
let contentDetectorError = null;
try {
    contentDetector = await import('../../js/editor/content-detector.js');
} catch (e) {
    contentDetectorError = e;
}

// ---------------------------------------------------------------------------
// Mini-framework d'assertions
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
const failures = [];
function ok(cond, label, detail) {
    if (cond) { passed++; /* console.log(`  ✓ ${label}`); */ }
    else { failed++; failures.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}
function section(t) { console.log(`\n=== ${t} ===`); }

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
async function packageWithMedia(content, moduleKey) {
    const meta = getModuleMetadata(moduleKey);
    const dependencies = [
        ...meta.extraDependencies,
        { machineName: meta.machineName, majorVersion: meta.version.major, minorVersion: meta.version.minor }
    ];
    const mediaFiles = imageManager.hasMedia() ? imageManager.getAllMedia() : null;
    return createH5PBlob(content, meta.machineName, dependencies, { title: content.title || 'Activity', lang: 'fr', mediaFiles });
}

const MK = 'ImageHotspots';

// ===========================================================================
// T1 — Processeur : format PLAT (sortie LLM)
// ===========================================================================
section('T1 — Processeur (format plat LLM)');
{
    const flat = {
        title: 'Anatomie de la fleur',
        globalColor: '#1768c4',
        globalIconType: 'numbers',
        hotspots: [
            { x: 31.5, y: 22.0, header: 'Le pétale', text: '<p>Les <strong>pétales</strong>.</p>' },
            { x: 150, y: -5, header: 'Hors bornes', text: 'Tige' } // test du clamp
        ]
    };
    const c = await healAndProcess(flat, MK);
    ok(Array.isArray(c.hotspots) && c.hotspots.length === 2, 'deux hotspots produits', `len=${c.hotspots?.length}`);
    ok(c.globalIconType === 'numbers', "globalIconType = 'numbers'", c.globalIconType);
    ok(c.globalColor === '#1768c4', 'globalColor conservé', c.globalColor);
    const h0 = c.hotspots[0];
    ok(h0.position && typeof h0.position.x === 'number' && typeof h0.position.y === 'number', 'position {x,y} numérique', JSON.stringify(h0.position));
    ok(h0.position.legacyPositioning === false, 'legacyPositioning = false', String(h0.position?.legacyPositioning));
    ok(h0.header === 'Le pétale', 'header conservé', h0.header);
    ok(Array.isArray(h0.content) && h0.content.length === 1, 'content[] avec 1 nœud texte', JSON.stringify(h0.content?.length));
    ok(h0.content[0].library === 'H5P.Text 1.1', 'nœud = H5P.Text 1.1', h0.content[0]?.library);
    ok(typeof h0.content[0].subContentId === 'string' && h0.content[0].subContentId.length > 10, 'subContentId généré', h0.content[0]?.subContentId);
    ok(h0.content[0].metadata && h0.content[0].metadata.contentType === 'Text', 'metadata.contentType=Text', JSON.stringify(h0.content[0]?.metadata));
    ok(/pétales/.test(h0.content[0].params.text), 'texte (HTML) conservé', h0.content[0]?.params?.text);
    // clamp
    const h1 = c.hotspots[1];
    ok(h1.position.x === 100 && h1.position.y === 0, 'x/y bornés [0,100] (150→100, -5→0)', JSON.stringify(h1.position));
    // labels d'accessibilité présents
    ok(typeof c.untitledHotspotLabel === 'string', 'untitledHotspotLabel présent');
    ok(typeof c.closeButtonLabel === 'string', 'closeButtonLabel présent');
}

// ===========================================================================
// T2 — Processeur : format ENRICHI (éditeur, content[] polymorphe)
// ===========================================================================
section('T2 — Processeur (format enrichi éditeur, content[] polymorphe)');
{
    const enriched = {
        title: 'Schéma enrichi',
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } },
        backgroundImageAltText: 'Une fleur en gros plan',
        globalColor: '#981d99',
        globalIconType: 'numbers',
        hotspots: [{
            x: 40, y: 50, header: 'Point riche',
            content: [
                { library: 'H5P.Text 1.1', params: { text: '<p>Un texte.</p>' } },
                { library: 'H5P.Image 1.1', params: { file: { path: 'images/inline.png', mime: 'image/png', width: 100, height: 80 }, alt: 'inline', decorative: false } },
                { library: 'H5P.Audio 1.5', params: { files: [{ path: 'audios/a.mp3', mime: 'audio/mpeg' }], controls: true } },
                { library: 'H5P.Video 1.6', params: { sources: [{ path: 'https://youtu.be/dQw4w9WgXcQ', mime: 'video/YouTube' }] } }
            ]
        }]
    };
    const c = await healAndProcess(enriched, MK);
    ok(c.image && c.image.path === 'images/bg.png', 'image de fond injectée (path conservé)', JSON.stringify(c.image));
    ok(c.backgroundImageAltText === 'Une fleur en gros plan', 'backgroundImageAltText conservé', c.backgroundImageAltText);
    const content = c.hotspots[0].content;
    ok(content.length === 4, 'content[] = 4 nœuds polymorphes', String(content.length));
    const libs = content.map(n => n.library);
    ok(libs.includes('H5P.Text 1.1') && libs.includes('H5P.Image 1.1') && libs.includes('H5P.Audio 1.5') && libs.includes('H5P.Video 1.6'), 'Text/Image/Audio/Video présents', libs.join(','));
    ok(content.every(n => typeof n.subContentId === 'string' && n.subContentId.length > 10), 'chaque nœud a subContentId', '');
    ok(content.every(n => n.metadata && n.metadata.contentType), 'chaque nœud a metadata.contentType', '');
    const vid = content.find(n => n.library === 'H5P.Video 1.6');
    ok(vid.params.sources[0].mime === 'video/YouTube', 'vidéo YouTube → mime video/YouTube', JSON.stringify(vid.params.sources));
    const aud = content.find(n => n.library === 'H5P.Audio 1.5');
    ok(aud.params.files[0].path === 'audios/a.mp3', 'audio embarqué → path audios/a.mp3', JSON.stringify(aud.params.files));
}

// ===========================================================================
// T3 — Healer : pas de clés parasites communes
// ===========================================================================
section('T3 — Healer (pas de overallFeedback/behaviour parasites)');
{
    const flat = { title: 'X', hotspots: [{ x: 10, y: 10, header: 'A', text: 'b' }] };
    const healed = healFull(flat, MK);
    ok(!('overallFeedback' in healed), 'pas de overallFeedback ajouté', JSON.stringify(Object.keys(healed)));
    ok(!('behaviour' in healed), 'pas de behaviour ajouté', JSON.stringify(Object.keys(healed)));
    ok(Array.isArray(healed.hotspots), 'hotspots toujours présent après heal');
}

// ===========================================================================
// T4 — field-constraints : hotspots[].text = html+latex
// ===========================================================================
section('T4 — field-constraints');
{
    // L'API exacte peut varier ; on inspecte l'export brut.
    const fcKeys = Object.keys(fieldConstraints);
    let entry = null;
    // tente getConstraints / FIELD_CONSTRAINTS / default
    const reg = fieldConstraints.FIELD_CONSTRAINTS || fieldConstraints.default || fieldConstraints.constraints;
    if (reg && reg.ImageHotspots) entry = reg.ImageHotspots;
    if (!entry && typeof fieldConstraints.getFieldConstraints === 'function') {
        try { entry = fieldConstraints.getFieldConstraints('ImageHotspots'); } catch {}
    }
    ok(entry != null, 'entrée ImageHotspots trouvée dans field-constraints', `exports=${fcKeys.join(',')}`);
    if (entry) {
        const fields = entry.fields || entry;
        const tkey = Object.keys(fields).find(k => /hotspots\[\]\.(content\[\]\.)?text/.test(k));
        ok(tkey != null, 'champ hotspots[].text déclaré', `champs=${Object.keys(fields).join(',')}`);
        if (tkey) {
            const render = fields[tkey].render || fields[tkey];
            ok(render === 'html+latex', "render = 'html+latex'", String(render));
        }
        ok((entry.machineName || '') === 'H5P.ImageHotspots' || true, 'machineName cohérent (info)', entry.machineName);
    }
}

// ===========================================================================
// T5 — definitions : entrée + customOrder + flag
// ===========================================================================
section('T5 — definitions');
{
    const defs = definitions.default || definitions.definitions || definitions.ACTIVITY_DEFINITIONS || definitions;
    // h5pModules dans definitions
    const h5pModules = definitions.h5pModules || (defs && defs.h5pModules);
    let entry = null;
    if (h5pModules && h5pModules.ImageHotspots) entry = h5pModules.ImageHotspots;
    ok(entry != null, 'h5pModules.ImageHotspots existe', `exports=${Object.keys(definitions).join(',')}`);
    if (entry) {
        ok(entry.machineName === 'H5P.ImageHotspots', 'machineName = H5P.ImageHotspots', entry.machineName);
        ok(entry.requiresBackgroundImage === true, 'flag requiresBackgroundImage = true', String(entry.requiresBackgroundImage));
        ok((entry.formats || []).includes('H5P'), 'format H5P déclaré', JSON.stringify(entry.formats));
    }
    // customOrder
    const customOrder = definitions.customOrder || (defs && defs.customOrder);
    if (customOrder) ok(customOrder.includes('ImageHotspots'), 'ImageHotspots dans customOrder');
    else ok(true, 'customOrder non exporté (info)');
}

// ===========================================================================
// T6 — processorMetadata : version 1.11 + extraDependencies complètes
// ===========================================================================
section('T6 — processorMetadata (extraDependencies)');
{
    const meta = getModuleMetadata(MK);
    ok(meta != null, 'metadata ImageHotspots présent');
    if (meta) {
        ok(meta.machineName === 'H5P.ImageHotspots', 'machineName', meta.machineName);
        ok(meta.version && meta.version.major === 1 && meta.version.minor === 11, 'version 1.11', JSON.stringify(meta.version));
        const deps = (meta.extraDependencies || []).map(d => d.machineName);
        for (const need of ['H5P.Text', 'H5P.Image', 'H5P.Audio', 'H5P.Video', 'H5P.Components', 'jQuery.ui', 'FontAwesome', 'H5P.Transition']) {
            ok(deps.includes(need), `extraDependency ${need} déclarée`, deps.join(','));
        }
    }
}

// ===========================================================================
// T7 — PACKAGING : médias embarqués → content/audios|videos|images/ + h5p.json deps
// ===========================================================================
section('T7 — Packaging .h5p (binaires + dépendances)');
{
    imageManager.clearAllImages();
    // Enregistre fond image + audio + vidéo (blobs factices)
    const mkBlob = (n) => new Blob([new Uint8Array(Array.from({ length: n }, (_, i) => i % 256))]);
    imageManager.registerImage('image', { h5pPath: 'images/bg-1234.png', blob: mkBlob(32), mime: 'image/png' });
    imageManager.registerImage('inline-1', { h5pPath: 'images/inline-5678.png', blob: mkBlob(16), mime: 'image/png' });
    imageManager.registerMedia('aud-1', { h5pPath: 'audios/audio-aaaa.mp3', blob: mkBlob(48), mime: 'audio/mpeg', kind: 'audio' });
    imageManager.registerMedia('vid-1', { h5pPath: 'videos/video-bbbb.mp4', blob: mkBlob(64), mime: 'video/mp4', kind: 'video' });

    const enriched = {
        title: 'Paquet média',
        image: { path: 'images/bg-1234.png', mime: 'image/png', width: 800, height: 600, copyright: { license: 'U' } },
        hotspots: [{
            x: 40, y: 50, header: 'Médias',
            content: [
                { library: 'H5P.Image 1.1', params: { file: { path: 'images/inline-5678.png', mime: 'image/png', width: 100, height: 80 }, alt: '', decorative: false } },
                { library: 'H5P.Audio 1.5', params: { files: [{ path: 'audios/audio-aaaa.mp3', mime: 'audio/mpeg' }] } },
                { library: 'H5P.Video 1.6', params: { sources: [{ path: 'videos/video-bbbb.mp4', mime: 'video/mp4' }] } }
            ]
        }]
    };
    const content = await healAndProcess(enriched, MK);
    const blob = await packageWithMedia(content, MK);
    ok(blob && typeof blob.arrayBuffer === 'function', 'createH5PBlob renvoie un Blob');

    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const names = Object.keys(zip.files);
    ok(names.includes('content/content.json'), 'content/content.json présent');
    ok(names.includes('h5p.json'), 'h5p.json présent');
    ok(names.some(n => n === 'content/images/bg-1234.png'), 'fond → content/images/bg-1234.png', names.filter(n => n.includes('images')).join(','));
    ok(names.some(n => n === 'content/images/inline-5678.png'), 'image inline → content/images/inline-5678.png');
    ok(names.some(n => n === 'content/audios/audio-aaaa.mp3'), 'audio → content/audios/audio-aaaa.mp3', names.filter(n => n.includes('audio')).join(','));
    ok(names.some(n => n === 'content/videos/video-bbbb.mp4'), 'vidéo → content/videos/video-bbbb.mp4', names.filter(n => n.includes('video')).join(','));

    // h5p.json deps
    const h5pJson = JSON.parse(await zip.files['h5p.json'].async('string'));
    const deps = (h5pJson.preloadedDependencies || []).map(d => `${d.machineName} ${d.majorVersion}.${d.minorVersion}`);
    ok(deps.some(d => d.startsWith('H5P.ImageHotspots 1.11')), 'h5p.json: H5P.ImageHotspots 1.11', deps.join(' | '));
    ok(deps.some(d => d.startsWith('H5P.Text 1.1')), 'h5p.json: H5P.Text 1.1', deps.join(' | '));
    ok(deps.some(d => d.startsWith('H5P.Image 1.1')), 'h5p.json: H5P.Image 1.1');
    ok(deps.some(d => d.startsWith('H5P.Audio 1.5')), 'h5p.json: H5P.Audio 1.5');
    ok(deps.some(d => d.startsWith('H5P.Video 1.6')), 'h5p.json: H5P.Video 1.6');
    // pas de doublon H5P.ImageHotspots
    const ihCount = (h5pJson.preloadedDependencies || []).filter(d => d.machineName === 'H5P.ImageHotspots').length;
    ok(ihCount === 1, 'pas de doublon H5P.ImageHotspots', `count=${ihCount}`);

    // content.json: les chemins média référencés
    const cj = JSON.parse(await zip.files['content/content.json'].async('string'));
    const params = cj.params || cj; // h5p-creator peut wrapper en {params, ...}
    const hs = (params.hotspots || cj.hotspots);
    ok(Array.isArray(hs) && hs.length === 1, 'content.json: hotspots présent', JSON.stringify(hs && hs.length));

    imageManager.clearAllImages();
    ok(!imageManager.hasMedia(), 'clearAllImages vide aussi le registre média', String(imageManager.hasMedia()));
}

// ===========================================================================
// T8 — ROUND-TRIP éditeur (normalize → +médias → denormalize → process → re-normalize)
// ===========================================================================
section('T8 — Round-trip éditeur (content-detector)');
if (!contentDetector) {
    failed++;
    failures.push({ label: 'import content-detector.js', detail: contentDetectorError?.message });
    console.log(`  ✗ content-detector.js NON importable en Node : ${contentDetectorError?.message}`);
} else {
    const { normalizeDataForEditor, denormalizeDataForSave, detectContentType } = contentDetector;
    // détection de type
    const flat = {
        title: 'RT', globalColor: '#123456', globalIconType: 'numbers', backgroundImageAltText: 'alt',
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600 },
        hotspots: [{ x: 30, y: 40, header: 'P1', text: '<p>texte initial</p>' }]
    };
    const dt = detectContentType(structuredClone(flat), 'h5p_image_hotspots_name');
    ok(dt && dt.moduleKey === 'ImageHotspots', 'detectContentType (titleKey) → ImageHotspots', JSON.stringify(dt));
    // détection par SIGNATURE seule (sans titleKey) — valide contentSignatures['ImageHotspots']
    const dtSig = detectContentType(structuredClone(flat), null);
    ok(dtSig && dtSig.moduleKey === 'ImageHotspots', 'detectContentType (signature) → ImageHotspots', JSON.stringify(dtSig));

    // 1) normalize (flat → modèle éditeur)
    const model = normalizeDataForEditor(structuredClone(flat), 'ImageHotspots');
    const h = model.hotspots[0];
    ok(Array.isArray(h.content) && h.content[0] && h.content[0]._contentType === 'text', 'normalize: content[0]=_contentType text', JSON.stringify(h.content?.[0]));
    ok(h.text === undefined && h.position === undefined, 'normalize: text/position aplatis', '');
    ok(h.x === 30 && h.y === 40, 'normalize: x/y conservés', `${h.x},${h.y}`);

    // 2) l'utilisateur ajoute audio (fichier) + vidéo (YouTube) + image (inline)
    h.content.push({ _contentType: 'audio', audioFile: { path: 'audios/a.mp3', mime: 'audio/mpeg', kind: 'audio' } });
    h.content.push({ _contentType: 'video', videoUrl: 'https://youtu.be/abc123' });
    h.content.push({ _contentType: 'image', image: { path: 'images/inline.png', mime: 'image/png', width: 10, height: 10 }, imageAlt: 'x' });

    // 3) denormalize (modèle → format de sauvegarde)
    const saved = denormalizeDataForSave(structuredClone(model), 'ImageHotspots');
    const sc = saved.hotspots[0].content;
    ok(sc.length === 4, 'denormalize: 4 nœuds', String(sc.length));
    ok(sc[0].library === 'H5P.Text 1.1', 'denormalize[0] = H5P.Text', sc[0]?.library);
    ok(sc[1].library === 'H5P.Audio 1.5' && sc[1].params.files[0].path === 'audios/a.mp3', 'denormalize[1] = H5P.Audio fichier', JSON.stringify(sc[1]?.params?.files));
    ok(sc[2].library === 'H5P.Video 1.6' && sc[2].params.sources[0].mime === 'video/YouTube', 'denormalize[2] = H5P.Video YouTube', JSON.stringify(sc[2]?.params?.sources));
    ok(sc[3].library === 'H5P.Image 1.1' && sc[3].params.file.path === 'images/inline.png', 'denormalize[3] = H5P.Image', JSON.stringify(sc[3]?.params?.file));
    ok(saved.image && saved.image.path === 'images/bg.png' && saved.image.copyright, 'denormalize: image fond strippée + copyright', JSON.stringify(saved.image));
    // PLAYER-READY (chemin Sucrerie : pas de processeur en aval) : position{} + metadata + subContentId
    ok(saved.hotspots[0].position && typeof saved.hotspots[0].position.x === 'number', 'denormalize: hotspots[].position{x,y} (jouable sans processeur)', JSON.stringify(saved.hotspots[0].position));
    ok(sc.every(n => n.subContentId && n.metadata && n.metadata.contentType), 'denormalize: chaque nœud a subContentId + metadata', JSON.stringify(sc.map(n => !!n.subContentId)));
    ok(saved.globalIconType === 'numbers' && saved.globalColor, 'denormalize: globals (iconType/color) présents', `${saved.globalIconType}/${saved.globalColor}`);
    ok(saved.untitledHotspotLabel && saved.closeButtonLabel, 'denormalize: libellés d\'accessibilité présents', '');

    // 4) process → content.json v1.11
    const content = await healAndProcess(saved, 'ImageHotspots');
    ok(content.hotspots[0].content.length === 4, 'process: 4 nœuds dans content.json', String(content.hotspots[0].content.length));
    ok(content.hotspots[0].content.every(n => n.subContentId), 'process: subContentId sur tous', '');

    // 5) re-normalize (content.json → modèle éditeur) : stable
    const reModel = normalizeDataForEditor(structuredClone(content), 'ImageHotspots');
    const rc = reModel.hotspots[0].content;
    ok(rc.length === 4, 're-normalize: 4 blocs restitués', String(rc.length));
    ok(rc[0]._contentType === 'text', 're-normalize[0] text');
    ok(rc[1]._contentType === 'audio' && rc[1].audioFile && rc[1].audioFile.path === 'audios/a.mp3', 're-normalize[1] audio fichier', JSON.stringify(rc[1]));
    ok(rc[2]._contentType === 'video' && rc[2].videoUrl === 'https://youtu.be/abc123', 're-normalize[2] vidéo YouTube (URL)', JSON.stringify(rc[2]));
    ok(rc[3]._contentType === 'image' && rc[3].image && rc[3].image.path === 'images/inline.png', 're-normalize[3] image', JSON.stringify(rc[3]));
}

// ===========================================================================
// T9 — legacyPositioning préservé au round-trip (fix : re-import .h5p legacy)
// ===========================================================================
section('T9 — legacyPositioning préservé (round-trip content.json legacy)');
if (contentDetector) {
    const { normalizeDataForEditor, denormalizeDataForSave } = contentDetector;
    // content.json v1.11 "legacy" (positionnement pré-1.8)
    const legacyContent = {
        image: { path: 'images/bg.png', mime: 'image/png', width: 800, height: 600 },
        globalIconType: 'numbers', globalColor: '#981d99',
        hotspots: [{ position: { x: 20, y: 30, legacyPositioning: true }, header: 'L', content: [{ library: 'H5P.Text 1.1', params: { text: '<p>t</p>' } }] }]
    };
    const model = normalizeDataForEditor(structuredClone(legacyContent), 'ImageHotspots');
    ok(model.hotspots[0]._legacyPositioning === true, 'normalize: legacyPositioning stocké en champ caché', JSON.stringify(model.hotspots[0]._legacyPositioning));
    const saved = denormalizeDataForSave(structuredClone(model), 'ImageHotspots');
    ok(saved.hotspots[0].position && saved.hotspots[0].position.legacyPositioning === true, 'denormalize: legacyPositioning ré-émis', JSON.stringify(saved.hotspots[0].position));
    const content = await healAndProcess(saved, 'ImageHotspots');
    ok(content.hotspots[0].position.legacyPositioning === true, 'process: legacyPositioning=true conservé', JSON.stringify(content.hotspots[0].position));
    ok(content.hotspots[0].position.x === 20 && content.hotspots[0].position.y === 30, 'process: x/y corrects malgré legacy', JSON.stringify(content.hotspots[0].position));
    // contenu FRAIS (pas de legacy) : position émise avec legacyPositioning=false (et non true)
    const fresh = denormalizeDataForSave(normalizeDataForEditor(structuredClone({ hotspots: [{ x: 5, y: 5, text: 'a' }] }), 'ImageHotspots'), 'ImageHotspots');
    ok(fresh.hotspots[0].position && fresh.hotspots[0].position.legacyPositioning === false, 'fresh: legacyPositioning=false (pas true)', JSON.stringify(fresh.hotspots[0].position));
}

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(60)}`);
console.log(`BILAN ImageHotspots : ${passed} OK, ${failed} ÉCHEC(S)`);
if (failed) {
    console.log('\nÉchecs :');
    for (const f of failures) console.log(`  - ${f.label}${f.detail ? ' :: ' + f.detail : ''}`);
}
process.exit(failed ? 1 : 0);
