/**
 * Tests d'integration des images dans les activites H5P et exports documents
 *
 * Verifie le cycle complet :
 * 1. Chargement et traitement d'images reelles (PNG, WebP)
 * 2. Registre image-manager (register, unregister, re-register)
 * 3. buildMediaStructure() — structure media H5P commune
 * 4. Injection d'images dans les processeurs H5P (9 activites)
 * 5. Packaging H5P avec images dans le ZIP
 * 6. Export document (formatContentForDocument) avec images media
 *
 * Utilise les logos Caramel comme images de test :
 * - assets/images/branding/logo_caramel.png
 * - assets/images/branding/logo_caramel_2.webp
 *
 * Usage : ouvrir tests/test-images.html depuis le serveur local.
 */

import {
    processImage,
    registerImage,
    unregisterImage,
    getImage,
    getAllImages,
    clearAllImages,
    hasImages,
    getImageCount,
    buildMediaStructure
} from '../js/h5p/image-manager.js';

import {
    healJsonString,
    healJsonObject,
    healActivitySpecificFields,
    healStructureForActivity
} from '../js/h5p/json-healer.js';

import {
    processH5PContent,
    getModuleMetadata
} from '../js/h5p/processors/index.js';

import { createH5PBlob } from '../js/h5p/h5p-creator.js';
import { loadJSZip } from '../js/core/lib-loader.js';
import { formatContentForDocument } from '../js/export/document-formatter.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

function assertEqual(actual, expected, message) {
    const ok = actual === expected;
    assert(ok, message, ok ? null : { actual, expected });
}

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

// =======================================================================
// HELPERS
// =======================================================================

/** Charge un fichier image en tant que Blob depuis le serveur local */
async function fetchImageBlob(path) {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`Impossible de charger ${path}: ${resp.status}`);
    return resp.blob();
}

/** Charge un fichier JSON exemple */
async function fetchFixture(filename) {
    const resp = await fetch(`../assets/data/examples/${filename}`);
    if (!resp.ok) throw new Error(`Impossible de charger ${filename}: ${resp.status}`);
    return resp.text();
}

/** Pipeline complet de healing d'un JSON exemple */
function healFixture(rawText, moduleKey) {
    const healedString = healJsonString(rawText);
    let jsonObj = JSON.parse(healedString);
    jsonObj = healJsonObject(jsonObj, moduleKey);
    jsonObj = healActivitySpecificFields(jsonObj, moduleKey);
    jsonObj = healStructureForActivity(jsonObj, moduleKey);
    return jsonObj;
}

// Donnees images chargees une fois et reutilisees
let pngEntry = null;
let webpEntry = null;

// =======================================================================
// ETAPE 1 : TRAITEMENT D'IMAGES REELLES
// =======================================================================

async function runStep1_ImageProcessing() {
    console.group('Etape 1 : Traitement d\'images reelles (PNG, WebP)');
    _ctx = { step: 1, stepName: 'ImageProcessing', file: '', module: 'image-manager', source: 'image' };

    // 1a. Charger et traiter le PNG
    try {
        _ctx.file = 'logo_caramel.png';
        const t0 = performance.now();
        const pngBlob = await fetchImageBlob('../assets/images/branding/logo_caramel.png');
        const t1 = performance.now();

        assert(pngBlob && pngBlob.size > 0, `[1a.Load] logo_caramel.png charge (${pngBlob.size} octets, ${(t1 - t0).toFixed(1)}ms)`);
        assert(pngBlob.type === 'image/png', `[1a.Type] logo_caramel.png type=${pngBlob.type}`);

        const t2 = performance.now();
        pngEntry = await processImage(pngBlob);
        const t3 = performance.now();

        assert(pngEntry !== null, `[1a.Process] PNG traite avec succes`);
        assert(pngEntry.blob instanceof Blob, `[1a.Blob] blob est un Blob (${pngEntry.blob.size} octets)`);
        assert(pngEntry.width > 0 && pngEntry.height > 0, `[1a.Dims] dimensions ${pngEntry.width}x${pngEntry.height}`);
        assert(pngEntry.h5pPath.startsWith('images/image-'), `[1a.Path] h5pPath=${pngEntry.h5pPath}`);
        assert(pngEntry.h5pPath.endsWith('.jpg'), `[1a.Ext] extension .jpg (conversion PNG→JPEG)`);
        assert(pngEntry.dataURL.startsWith('data:image/jpeg'), `[1a.DataURL] dataURL commence par data:image/jpeg`);
        assert(pngEntry.mime === 'image/jpeg', `[1a.Mime] mime=${pngEntry.mime} (conversion en JPEG)`);

        recordTiming('ImageProcessing', 'processImage(PNG)', t3 - t2);
    } catch (e) {
        assert(false, `[1a.PNG] Exception : ${e.message}`);
    }

    // 1b. Charger et traiter le WebP
    try {
        _ctx.file = 'logo_caramel_2.webp';
        const t0 = performance.now();
        const webpBlob = await fetchImageBlob('../assets/images/branding/logo_caramel_2.webp');
        const t1 = performance.now();

        assert(webpBlob && webpBlob.size > 0, `[1b.Load] logo_caramel_2.webp charge (${webpBlob.size} octets, ${(t1 - t0).toFixed(1)}ms)`);

        const t2 = performance.now();
        webpEntry = await processImage(webpBlob);
        const t3 = performance.now();

        assert(webpEntry !== null, `[1b.Process] WebP traite avec succes`);
        assert(webpEntry.h5pPath.endsWith('.jpg'), `[1b.Ext] extension .jpg (conversion WebP→JPEG)`);
        assert(webpEntry.mime === 'image/jpeg', `[1b.Mime] mime=${webpEntry.mime} (conversion en JPEG)`);
        assert(webpEntry.dataURL.startsWith('data:image/jpeg'), `[1b.DataURL] dataURL JPEG valide`);
        assert(webpEntry.width <= 800, `[1b.MaxW] largeur ${webpEntry.width} <= 800 (redimensionnement)`);
        assert(webpEntry.height <= 600, `[1b.MaxH] hauteur ${webpEntry.height} <= 600 (redimensionnement)`);

        recordTiming('ImageProcessing', 'processImage(WebP)', t3 - t2);
    } catch (e) {
        assert(false, `[1b.WebP] Exception : ${e.message}`);
    }

    // 1c. Tester le rejet d'un fichier trop gros (simulation)
    try {
        _ctx.file = 'fake-large-file';
        const fakeBlob = new Blob([new ArrayBuffer(6 * 1024 * 1024)], { type: 'image/jpeg' });
        let threw = false;
        try {
            await processImage(fakeBlob);
        } catch (e) {
            threw = true;
            assertEqual(e.message, 'SIZE_EXCEEDED', `[1c.SizeError] erreur SIZE_EXCEEDED`);
        }
        assert(threw, `[1c.Reject] fichier > 5 Mo rejete`);
    } catch (e) {
        assert(false, `[1c.SizeReject] Exception : ${e.message}`);
    }

    // 1d. Tester le rejet d'un format invalide
    try {
        _ctx.file = 'fake-bmp-file';
        const fakeBlob = new Blob(['fake'], { type: 'image/bmp' });
        let threw = false;
        try {
            await processImage(fakeBlob);
        } catch (e) {
            threw = true;
            assertEqual(e.message, 'FORMAT_INVALID', `[1d.FormatError] erreur FORMAT_INVALID`);
        }
        assert(threw, `[1d.Reject] format BMP rejete`);
    } catch (e) {
        assert(false, `[1d.FormatReject] Exception : ${e.message}`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : REGISTRE IMAGE-MANAGER
// =======================================================================

async function runStep2_ImageRegistry() {
    console.group('Etape 2 : Registre image-manager (cycle de vie)');
    _ctx = { step: 2, stepName: 'ImageRegistry', file: '', module: 'image-manager', source: 'image' };

    // Nettoyer le registre
    clearAllImages();

    // 2a. Registre vide au depart
    assert(!hasImages(), `[2a.Empty] registre vide au depart`);
    assertEqual(getImageCount(), 0, `[2a.Count] getImageCount() === 0`);

    // 2b. Enregistrer une image PNG
    if (pngEntry) {
        registerImage('cards.0.image', pngEntry);
        assert(hasImages(), `[2b.HasImages] hasImages() === true apres register`);
        assertEqual(getImageCount(), 1, `[2b.Count] getImageCount() === 1`);

        const retrieved = getImage('cards.0.image');
        assert(retrieved !== undefined, `[2b.Get] getImage('cards.0.image') retourne l'entree`);
        assertEqual(retrieved.id, 'cards.0.image', `[2b.Id] id === 'cards.0.image'`);
        assertEqual(retrieved.h5pPath, pngEntry.h5pPath, `[2b.Path] h5pPath preserve`);
    }

    // 2c. Enregistrer une 2e image WebP
    if (webpEntry) {
        registerImage('cards.1.image', webpEntry);
        assertEqual(getImageCount(), 2, `[2c.Count] getImageCount() === 2`);
    }

    // 2d. getAllImages retourne la map h5pPath → Blob
    const allImages = getAllImages();
    assert(allImages instanceof Map, `[2d.Type] getAllImages() retourne une Map`);
    assertEqual(allImages.size, 2, `[2d.Size] 2 images dans la map`);

    if (pngEntry) {
        assert(allImages.has(pngEntry.h5pPath), `[2d.PNG] map contient le h5pPath PNG`);
        assert(allImages.get(pngEntry.h5pPath) instanceof Blob, `[2d.PNGBlob] valeur est un Blob`);
    }

    // 2e. Supprimer une image
    unregisterImage('cards.0.image');
    assertEqual(getImageCount(), 1, `[2e.Count] getImageCount() === 1 apres unregister`);
    assert(getImage('cards.0.image') === undefined, `[2e.Get] getImage('cards.0.image') === undefined`);
    assert(getImage('cards.1.image') !== undefined, `[2e.Other] l'autre image est toujours la`);

    // 2f. Re-enregistrer la meme image
    if (pngEntry) {
        registerImage('cards.0.image', pngEntry);
        assertEqual(getImageCount(), 2, `[2f.ReRegister] getImageCount() === 2 apres re-register`);
        assert(getImage('cards.0.image') !== undefined, `[2f.Get] image re-enregistree`);
    }

    // 2g. clearAllImages
    clearAllImages();
    assert(!hasImages(), `[2g.Clear] hasImages() === false apres clear`);
    assertEqual(getImageCount(), 0, `[2g.Count] getImageCount() === 0 apres clear`);

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : buildMediaStructure
// =======================================================================

async function runStep3_BuildMediaStructure() {
    console.group('Etape 3 : buildMediaStructure (helper structure media)');
    _ctx = { step: 3, stepName: 'BuildMedia', file: '', module: 'image-manager', source: 'image' };

    // 3a. Sans image → structure par defaut
    const noImage = buildMediaStructure(null);
    assert(noImage !== null, `[3a.Null] buildMediaStructure(null) retourne un objet`);
    assertEqual(noImage.disableImageZooming, false, `[3a.Zoom] disableImageZooming === false`);
    assert(!noImage.type, `[3a.NoType] pas de champ type quand null`);

    // 3b. Sans path → structure par defaut
    const noPath = buildMediaStructure({});
    assert(!noPath.type, `[3b.NoPath] buildMediaStructure({}) sans path → pas de type`);

    // 3c. Avec image valide
    const imageData = {
        path: 'images/image-test1234.jpg',
        mime: 'image/jpeg',
        width: 400,
        height: 300
    };
    const media = buildMediaStructure(imageData, 'Mon texte alternatif');

    assert(media.type !== undefined, `[3c.HasType] structure media a un champ type`);
    assertEqual(media.type.library, 'H5P.Image 1.1', `[3c.Library] library === 'H5P.Image 1.1'`);
    assertEqual(media.type.params.file.path, 'images/image-test1234.jpg', `[3c.Path] file.path preserve`);
    assertEqual(media.type.params.file.mime, 'image/jpeg', `[3c.Mime] file.mime preserve`);
    assertEqual(media.type.params.file.width, 400, `[3c.Width] file.width === 400`);
    assertEqual(media.type.params.file.height, 300, `[3c.Height] file.height === 300`);
    assertEqual(media.type.params.alt, 'Mon texte alternatif', `[3c.Alt] alt text preserve`);
    assertEqual(media.type.params.decorative, false, `[3c.Deco] decorative === false`);
    assert(media.type.subContentId && media.type.subContentId.length > 10, `[3c.SubId] subContentId genere`);
    assertEqual(media.type.metadata.contentType, 'Image', `[3c.ContentType] metadata.contentType === 'Image'`);
    assertEqual(media.type.metadata.license, 'U', `[3c.License] metadata.license === 'U'`);
    assertEqual(media.disableImageZooming, false, `[3c.Zoom] disableImageZooming === false`);

    // 3d. Avec image mais sans alt
    const mediaNoAlt = buildMediaStructure(imageData);
    assertEqual(mediaNoAlt.type.params.alt, '', `[3d.NoAlt] alt === '' quand non fourni`);

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : INJECTION IMAGES DANS PROCESSEURS H5P
// =======================================================================

async function runStep4_H5PProcessorsWithImages() {
    console.group('Etape 4 : Injection images dans les processeurs H5P');

    // --- 4a. Flashcards avec images ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'flashcards_1.json', module: 'Flashcards', source: 'h5p' };

        const rawText = await fetchFixture('flashcards_1.json');
        const jsonObj = healFixture(rawText, 'Flashcards');

        // Injecter une image sur la 1ere carte
        if (jsonObj.cards && jsonObj.cards.length > 0) {
            jsonObj.cards[0].image = {
                path: pngEntry.h5pPath,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.cards[0].imageAltText = 'Logo Caramel PNG';
        }

        const processed = await processH5PContent('Flashcards', structuredClone(jsonObj));
        const content = processed.content || processed;

        // Verifier que la 1ere carte a l'image
        const firstCard = content.cards[0];
        assert(firstCard.image !== undefined, `[4a.HasImage] 1ere carte a un champ image`);
        assertEqual(firstCard.image.path, pngEntry.h5pPath, `[4a.Path] image.path === h5pPath`);
        assertEqual(firstCard.imageAltText, 'Logo Caramel PNG', `[4a.Alt] imageAltText preserve`);
        assert(firstCard.image.copyright && firstCard.image.copyright.license === 'U', `[4a.License] copyright.license === 'U'`);

        // Verifier que les autres cartes n'ont pas d'image
        if (content.cards.length > 1) {
            assert(!content.cards[1].image, `[4a.NoImage] 2e carte sans image`);
        }
    } catch (e) {
        assert(false, `[4a.Flashcards] Exception : ${e.message}`);
    }

    // --- 4b. DialogCards avec images ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'dialog_cards_1.json', module: 'DialogCards', source: 'h5p' };

        const rawText = await fetchFixture('dialog_cards_1.json');
        const jsonObj = healFixture(rawText, 'DialogCards');

        // Injecter une image sur le 1er dialog
        if (jsonObj.dialogs && jsonObj.dialogs.length > 0) {
            jsonObj.dialogs[0].image = {
                path: webpEntry.h5pPath,
                mime: 'image/jpeg',
                width: webpEntry.width,
                height: webpEntry.height
            };
            jsonObj.dialogs[0].imageAltText = 'Logo Caramel WebP';
        }

        const processed = await processH5PContent('DialogCards', structuredClone(jsonObj));
        const content = processed.content || processed;

        const firstDialog = content.dialogs[0];
        assert(firstDialog.image !== undefined, `[4b.HasImage] 1er dialog a un champ image`);
        assertEqual(firstDialog.image.path, webpEntry.h5pPath, `[4b.Path] image.path === h5pPath`);
        assertEqual(firstDialog.imageAltText, 'Logo Caramel WebP', `[4b.Alt] imageAltText preserve`);
    } catch (e) {
        assert(false, `[4b.DialogCards] Exception : ${e.message}`);
    }

    // --- 4c. DragAndDrop avec background ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'h5p' };

        const rawText = await fetchFixture('drag_and_drop_1.json');
        const jsonObj = healFixture(rawText, 'DragAndDrop');

        // Injecter un background
        jsonObj.backgroundImage = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };

        const processed = await processH5PContent('DragAndDrop', structuredClone(jsonObj));
        const content = processed.content || processed;

        assert(content.question && content.question.settings, `[4c.Settings] question.settings existe`);
        assert(content.question.settings.background !== undefined, `[4c.HasBg] question.settings.background existe`);
        assertEqual(content.question.settings.background.path, pngEntry.h5pPath, `[4c.Path] background.path === h5pPath`);
    } catch (e) {
        assert(false, `[4c.DragAndDrop] Exception : ${e.message}`);
    }

    // --- 4c2. DragAndDrop avec element image ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'h5p' };

        const rawText = await fetchFixture('drag_and_drop_1.json');
        const jsonObj = healFixture(rawText, 'DragAndDrop');

        // Injecter une image sur le 1er element
        if (jsonObj.elements && jsonObj.elements.length > 0) {
            jsonObj.elements[0].image = {
                path: pngEntry.h5pPath,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.elements[0].imageAltText = 'Etiquette image';
        }

        const processed = await processH5PContent('DragAndDrop', structuredClone(jsonObj));
        const content = processed.content || processed;

        // Le 1er element doit etre H5P.Image 1.1
        const firstEl = content.question.task.elements[0];
        assertEqual(firstEl.type.library, 'H5P.Image 1.1', `[4c2.Library] 1er element = H5P.Image 1.1`);
        assertEqual(firstEl.type.params.file.path, pngEntry.h5pPath, `[4c2.Path] file.path preserve`);
        assertEqual(firstEl.type.params.alt, 'Etiquette image', `[4c2.Alt] alt text preserve`);

        // Le 2e element doit rester H5P.AdvancedText 1.1
        if (content.question.task.elements.length > 1) {
            const secondEl = content.question.task.elements[1];
            assertEqual(secondEl.type.library, 'H5P.AdvancedText 1.1', `[4c2.Text] 2e element = AdvancedText`);
        }
    } catch (e) {
        assert(false, `[4c2.DragAndDropElement] Exception : ${e.message}`);
    }

    // --- 4c2b. DragAndDrop element image — dimensions adaptees ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'h5p' };

        const rawText4c2b = await fetchFixture('drag_and_drop_1.json');
        const jsonObj4c2b = healFixture(rawText4c2b, 'DragAndDrop');

        // Injecter une image sur le 1er element
        jsonObj4c2b.elements[0].image = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonObj4c2b.elements[0].imageAltText = 'Etiquette image dimensions';

        const processed4c2b = await processH5PContent('DragAndDrop', structuredClone(jsonObj4c2b));
        const content4c2b = processed4c2b.content || processed4c2b;
        const elems4c2b = content4c2b.question.task.elements;

        // Trouver l'element image et un element texte (les elements sont shuffles par h5p-creator)
        const imgEl = elems4c2b.find(el => el.type.library === 'H5P.Image 1.1');
        const txtEl = elems4c2b.find(el => el.type.library === 'H5P.AdvancedText 1.1');

        // Element image : hauteur = IMAGE_ELEMENT_HEIGHT_PX / 16 = 6.875em
        assert(imgEl !== undefined, `[4c2b.FindImg] element image trouve`);
        if (imgEl) {
            assert(imgEl.height > 6, `[4c2b.ImgHeight] element image hauteur ${imgEl.height}em > 6em (attendu ~6.875)`);
            assert(imgEl.height < 8, `[4c2b.ImgHeightMax] element image hauteur ${imgEl.height}em < 8em`);
        }

        // Element texte : hauteur = ELEMENT_HEIGHT_PX / 16 = 2.375em
        assert(txtEl !== undefined, `[4c2b.FindTxt] element texte trouve`);
        if (txtEl) {
            assertEqual(txtEl.height, 2.38, `[4c2b.TxtHeight] element texte hauteur ${txtEl.height}em (attendu 2.38)`);
        }

        // Largeur identique pour les deux
        if (imgEl && txtEl) {
            assertEqual(imgEl.width, txtEl.width, `[4c2b.SameWidth] largeur identique image/texte (${imgEl.width}em)`);
        }

        // Canvas hauteur >= 500
        const canvasH4c2b = content4c2b.question.settings.size.height;
        assert(canvasH4c2b >= 500, `[4c2b.CanvasH] canvas hauteur ${canvasH4c2b}px >= 500`);

    } catch (e) {
        assert(false, `[4c2b.DragAndDropDimensions] Exception : ${e.message}`);
    }

    // --- 4c3. Crossword avec background image ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'crosswords_1.json', module: 'Crossword', source: 'h5p' };

        const rawText = await fetchFixture('crosswords_1.json');
        const jsonObj = healFixture(rawText, 'Crossword');

        // Injecter un background
        jsonObj.backgroundImage = {
            path: webpEntry.h5pPath,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };

        const processed = await processH5PContent('Crossword', structuredClone(jsonObj));
        const content = processed.content || processed;

        assert(content.theme !== undefined, `[4c3.Theme] theme existe`);
        assert(content.theme.backgroundImage !== undefined, `[4c3.HasBg] theme.backgroundImage existe`);
        assertEqual(content.theme.backgroundImage.path, webpEntry.h5pPath, `[4c3.Path] backgroundImage.path preserve`);
    } catch (e) {
        assert(false, `[4c3.Crossword] Exception : ${e.message}`);
    }

    // --- 4c4. Timeline avec image d'événement ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'timeline_1.json', module: 'Timeline', source: 'h5p' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Injecter une image sur le premier événement
        const firstDate = jsonObj.timeline.date[0];
        firstDate.mediaType = 'image';
        firstDate.eventImage = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        firstDate.eventImageAlt = 'Test alt text';

        const processed = await processH5PContent('Timeline', structuredClone(jsonObj));
        const content = processed.content || processed;
        const processedDate = content.timeline.date[0];

        assertEqual(processedDate.asset.media, pngEntry.h5pPath, `[4c4.Path] asset.media contient le chemin image`);
        assert(processedDate.eventImage === undefined, `[4c4.Clean] eventImage nettoyé du H5P`);
        assert(processedDate.mediaType === undefined, `[4c4.CleanType] mediaType nettoyé du H5P`);
    } catch (e) {
        assert(false, `[4c4.Timeline] Exception : ${e.message}`);
    }

    // --- 4c5. Timeline image de couverture (section generale) ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'timeline_1.json', module: 'Timeline', source: 'h5p' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Injecter une image de couverture
        jsonObj.timeline.coverImage = {
            path: webpEntry.h5pPath,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };
        jsonObj.timeline.coverImageAlt = 'Couverture timeline';
        jsonObj.timeline.mediaType = 'image';

        const processed = await processH5PContent('Timeline', structuredClone(jsonObj));
        const content = processed.content || processed;

        assertEqual(content.timeline.asset.media, webpEntry.h5pPath, `[4c5.CoverPath] asset.media contient le chemin image`);
        assert(content.timeline.coverImage === undefined, `[4c5.Clean] coverImage nettoyé du H5P`);
        assert(content.timeline.coverImageAlt === undefined, `[4c5.CleanAlt] coverImageAlt nettoyé du H5P`);
        assert(content.timeline.mediaType === undefined, `[4c5.CleanType] mediaType nettoyé du H5P`);
    } catch (e) {
        assert(false, `[4c5.TimelineCover] Exception : ${e.message}`);
    }

    // --- 4c6. Timeline SANS image → non-regression (URLs preservees) ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'timeline_1.json', module: 'Timeline', source: 'h5p' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Pas de coverImage ni eventImage
        const processed = await processH5PContent('Timeline', structuredClone(jsonObj));
        const content = processed.content || processed;

        // Les URLs d'origine doivent etre conservees
        const firstDate = content.timeline.date[0];
        assert(firstDate.asset !== undefined, `[4c6.Asset] asset existe sur l'evenement`);
        // L'URL originale doit etre conservee (pas remplacee)
        if (firstDate.asset.media) {
            assert(
                firstDate.asset.media.startsWith('http') || firstDate.asset.media === '',
                `[4c6.OrigURL] URL originale preservee ou vide`
            );
        }
        assert(firstDate.eventImage === undefined, `[4c6.NoEvImg] pas de champ eventImage residuel`);
        assert(firstDate.mediaType === undefined, `[4c6.NoType] pas de champ mediaType residuel`);
    } catch (e) {
        assert(false, `[4c6.TimelineNoImage] Exception : ${e.message}`);
    }

    // --- 4c7. Timeline event image remplace l'URL existante ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'timeline_1.json', module: 'Timeline', source: 'h5p' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // L'evenement 0 a deja une URL dans asset.media — l'image fichier doit la remplacer
        const dateWithUrl = jsonObj.timeline.date[0];
        const originalUrl = dateWithUrl.asset ? dateWithUrl.asset.media : '';
        dateWithUrl.mediaType = 'image';
        dateWithUrl.eventImage = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        dateWithUrl.eventImageAlt = 'Remplace URL';

        const processed = await processH5PContent('Timeline', structuredClone(jsonObj));
        const content = processed.content || processed;
        const processedDate = content.timeline.date[0];

        assertEqual(processedDate.asset.media, pngEntry.h5pPath, `[4c7.Replaced] image remplace URL (${originalUrl ? 'avait URL' : 'sans URL'})`);

        // Les autres evenements gardent leurs URLs
        if (content.timeline.date.length > 1) {
            const otherDate = content.timeline.date[1];
            assert(otherDate.eventImage === undefined, `[4c7.OtherClean] autres evenements nettoyes`);
        }
    } catch (e) {
        assert(false, `[4c7.TimelineReplace] Exception : ${e.message}`);
    }

    // --- 4c8. CoursePresentation avec image de slide ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'h5p' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        // Injecter une image sur le 1er slide
        if (jsonObj.slides && jsonObj.slides.length > 0) {
            jsonObj.slides[0].slideImage = {
                path: pngEntry.h5pPath,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.slides[0].slideImageAlt = 'Image slide 1';
        }

        const processed = await processH5PContent('CoursePresentation', structuredClone(jsonObj));
        const content = processed.content || processed;

        // Verifier qu'un element H5P.Image existe dans le 1er slide
        const firstSlide = content.presentation.slides[0];
        const imageElements = firstSlide.elements.filter(el =>
            el.action && el.action.library && el.action.library.startsWith('H5P.Image')
        );
        assert(imageElements.length > 0, `[4c8.HasImage] slide 1 contient un element H5P.Image`);

        if (imageElements.length > 0) {
            assertEqual(imageElements[0].action.params.file.path, pngEntry.h5pPath, `[4c8.Path] file.path preserve`);
            assertEqual(imageElements[0].action.params.alt, 'Image slide 1', `[4c8.Alt] alt text preserve`);
        }
    } catch (e) {
        assert(false, `[4c8.CoursePresentation] Exception : ${e.message}`);
    }

    // --- 4c9. CoursePresentation avec position image ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'h5p' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        if (jsonObj.slides && jsonObj.slides.length > 0) {
            // Image a droite
            jsonObj.slides[0].slideImage = {
                path: webpEntry.h5pPath,
                mime: 'image/jpeg',
                width: webpEntry.width,
                height: webpEntry.height
            };
            jsonObj.slides[0].slideImageAlt = 'Image droite';
            jsonObj.slides[0].slideImagePosition = 'right';
        }

        const processed = await processH5PContent('CoursePresentation', structuredClone(jsonObj));
        const content = processed.content || processed;

        const firstSlide = content.presentation.slides[0];
        const imageElements = firstSlide.elements.filter(el =>
            el.action && el.action.library && el.action.library.startsWith('H5P.Image')
        );
        assert(imageElements.length > 0, `[4c9.HasImage] slide 1 contient un element H5P.Image (position right)`);

        // L'image a droite doit avoir un x > 50 (cote droit)
        if (imageElements.length > 0) {
            assert(imageElements[0].x > 50, `[4c9.RightPos] image positionnee a droite (x=${imageElements[0].x})`);
        }
    } catch (e) {
        assert(false, `[4c9.CPPosition] Exception : ${e.message}`);
    }

    // --- 4c10. CoursePresentation SANS image → non-regression ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'h5p' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        // Pas de slideImage
        const processed = await processH5PContent('CoursePresentation', structuredClone(jsonObj));
        const content = processed.content || processed;

        assert(content.presentation && content.presentation.slides, `[4c10.Slides] slides existent`);
        const firstSlide = content.presentation.slides[0];

        // Aucun element H5P.Image ne doit etre present
        const imageElements = firstSlide.elements.filter(el =>
            el.action && el.action.library && el.action.library.startsWith('H5P.Image')
        );
        assertEqual(imageElements.length, 0, `[4c10.NoImage] pas de H5P.Image sans slideImage (non-regression)`);
    } catch (e) {
        assert(false, `[4c10.CPNoImage] Exception : ${e.message}`);
    }

    // --- 4d-4i. 6 activites media ---
    const mediaActivities = [
        { module: 'MultipleChoice', fixture: 'multiple_choice_1.json' },
        { module: 'TrueFalse', fixture: 'true_false_1.json' },
        { module: 'Essay', fixture: 'essay_1.json' },
        { module: 'FillInTheBlanks', fixture: 'fill_in_the_blanks_1.json' },
        { module: 'DragTheWords', fixture: 'drag_the_words_1.json' },
        { module: 'MarkTheWords', fixture: 'mark_the_words_1.json' }
    ];

    for (const activity of mediaActivities) {
        const label = activity.module.charAt(0).toLowerCase() + activity.module.slice(1);
        try {
            _ctx = { step: 4, stepName: 'H5P+Image', file: activity.fixture, module: activity.module, source: 'h5p' };

            const rawText = await fetchFixture(activity.fixture);
            const jsonObj = healFixture(rawText, activity.module);

            // Injecter mediaImage et mediaImageAlt
            jsonObj.mediaImage = {
                path: webpEntry.h5pPath,
                mime: 'image/jpeg',
                width: webpEntry.width,
                height: webpEntry.height
            };
            jsonObj.mediaImageAlt = `Image contexte ${activity.module}`;

            const processed = await processH5PContent(activity.module, structuredClone(jsonObj));
            const content = processed.content || processed;

            // Verifier la structure media
            assert(content.media !== undefined, `[4.${label}.HasMedia] champ media existe`);
            assert(content.media.type !== undefined, `[4.${label}.HasType] media.type existe (pas vide)`);
            assertEqual(content.media.type.library, 'H5P.Image 1.1', `[4.${label}.Library] media.type.library === 'H5P.Image 1.1'`);
            assertEqual(content.media.type.params.file.path, webpEntry.h5pPath, `[4.${label}.Path] file.path preserve`);
            assertEqual(content.media.type.params.alt, `Image contexte ${activity.module}`, `[4.${label}.Alt] alt text preserve`);
            assertEqual(content.media.disableImageZooming, false, `[4.${label}.Zoom] disableImageZooming === false`);

        } catch (e) {
            assert(false, `[4.${label}] Exception : ${e.message}`);
        }
    }

    // --- 4j. Activite media SANS image → structure par defaut ---
    try {
        _ctx = { step: 4, stepName: 'H5P+Image', file: 'multiple_choice_1.json', module: 'MultipleChoice', source: 'h5p' };

        const rawText = await fetchFixture('multiple_choice_1.json');
        const jsonObj = healFixture(rawText, 'MultipleChoice');

        // Pas de mediaImage → structure par defaut
        delete jsonObj.mediaImage;
        delete jsonObj.mediaImageAlt;

        const processed = await processH5PContent('MultipleChoice', structuredClone(jsonObj));
        const content = processed.content || processed;

        assert(content.media !== undefined, `[4j.HasMedia] media existe meme sans image`);
        assert(!content.media.type, `[4j.NoType] media.type absent quand pas d'image`);
        assertEqual(content.media.disableImageZooming, false, `[4j.Zoom] disableImageZooming === false`);
    } catch (e) {
        assert(false, `[4j.NoImage] Exception : ${e.message}`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : PACKAGING H5P AVEC IMAGES DANS LE ZIP
// =======================================================================

async function runStep5_H5PPackagingWithImages() {
    console.group('Etape 5 : Packaging H5P avec images dans le ZIP');

    const jsZipReady = typeof JSZip !== 'undefined';
    if (!jsZipReady) {
        assert(false, `[5.JSZip] JSZip non disponible — tests de packaging ignores`);
        console.groupEnd();
        return;
    }

    // --- 5a. Flashcards avec image → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'flashcards_1.json', module: 'Flashcards', source: 'h5p' };

        const rawText = await fetchFixture('flashcards_1.json');
        const jsonObj = healFixture(rawText, 'Flashcards');

        // Enregistrer l'image dans le registre
        clearAllImages();
        registerImage('cards.0.image', pngEntry);

        // Injecter l'image dans le JSON
        jsonObj.cards[0].image = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonObj.cards[0].imageAltText = 'Test image dans ZIP';

        // Pipeline processeur
        const processed = await processH5PContent('Flashcards', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('Flashcards');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        // Creer le blob avec images
        const imageFiles = getAllImages();
        const t0 = performance.now();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: contentJson.title || 'Test Flashcards',
            lang: 'fr',
            imageFiles
        });
        const t1 = performance.now();

        assert(h5pBlob && h5pBlob.size > 100, `[5a.Blob] blob H5P cree (${h5pBlob.size} octets, ${(t1 - t0).toFixed(1)}ms)`);

        // Relire le ZIP et verifier l'image
        const zip = await JSZip.loadAsync(h5pBlob);

        // Verifier content.json
        const contentFile = zip.file('content/content.json');
        assert(contentFile !== null, `[5a.Content] content/content.json present`);

        if (contentFile) {
            const contentText = await contentFile.async('text');
            const parsed = JSON.parse(contentText);
            assert(parsed.cards[0].image && parsed.cards[0].image.path, `[5a.JSON] image.path dans content.json`);
        }

        // Verifier que l'image binaire est dans le ZIP
        const imagePath = `content/${pngEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5a.ImageFile] ${imagePath} present dans le ZIP`);

        if (imageFile) {
            const imageBlob = await imageFile.async('blob');
            assert(imageBlob.size > 100, `[5a.ImageSize] image dans le ZIP fait ${imageBlob.size} octets`);
        }

        // Verifier la dependance H5P.Image 1.1
        const h5pFile = zip.file('h5p.json');
        if (h5pFile) {
            const h5pJson = JSON.parse(await h5pFile.async('text'));
            const hasImageDep = h5pJson.preloadedDependencies.some(d => d.machineName === 'H5P.Image');
            assert(hasImageDep, `[5a.ImageDep] H5P.Image dans preloadedDependencies`);
        }

        recordTiming('H5P+Image', 'Flashcards avec image', t1 - t0);
        clearAllImages();

    } catch (e) {
        assert(false, `[5a.Flashcards] Exception : ${e.message}`);
        clearAllImages();
    }

    // --- 5b. MultipleChoice avec image media → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'multiple_choice_1.json', module: 'MultipleChoice', source: 'h5p' };

        const rawText = await fetchFixture('multiple_choice_1.json');
        const jsonObj = healFixture(rawText, 'MultipleChoice');

        // Enregistrer l'image
        clearAllImages();
        registerImage('mediaImage', webpEntry);

        jsonObj.mediaImage = {
            path: webpEntry.h5pPath,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };
        jsonObj.mediaImageAlt = 'Image contexte QCM';

        const processed = await processH5PContent('MultipleChoice', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('MultipleChoice');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const imageFiles = getAllImages();
        const t0 = performance.now();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test QCM avec image',
            lang: 'fr',
            imageFiles
        });
        const t1 = performance.now();

        assert(h5pBlob && h5pBlob.size > 100, `[5b.Blob] blob H5P QCM cree (${h5pBlob.size} octets)`);

        // Verifier image dans le ZIP
        const zip = await JSZip.loadAsync(h5pBlob);
        const imagePath = `content/${webpEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5b.ImageFile] ${imagePath} present dans le ZIP`);

        // Verifier structure media dans content.json
        const contentFile = zip.file('content/content.json');
        if (contentFile) {
            const parsed = JSON.parse(await contentFile.async('text'));
            assert(parsed.media && parsed.media.type, `[5b.Media] media.type dans content.json`);
            assertEqual(parsed.media.type.library, 'H5P.Image 1.1', `[5b.Library] library H5P.Image 1.1`);
            assertEqual(parsed.media.type.params.alt, 'Image contexte QCM', `[5b.Alt] alt text dans content.json`);
        }

        recordTiming('H5P+Image', 'MultipleChoice avec image', t1 - t0);
        clearAllImages();

    } catch (e) {
        assert(false, `[5b.MultipleChoice] Exception : ${e.message}`);
        clearAllImages();
    }

    // --- 5c. Flashcards SANS image → pas d'image dans le ZIP (non-regression) ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'flashcards_1.json', module: 'Flashcards', source: 'h5p' };

        const rawText = await fetchFixture('flashcards_1.json');
        const jsonObj = healFixture(rawText, 'Flashcards');

        clearAllImages();

        const processed = await processH5PContent('Flashcards', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('Flashcards');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test Flashcards sans image',
            lang: 'fr'
        });

        const zip = await JSZip.loadAsync(h5pBlob);

        // Verifier qu'il n'y a PAS de dossier images/
        const imageFiles = Object.keys(zip.files).filter(f => f.startsWith('content/images/'));
        assertEqual(imageFiles.length, 0, `[5c.NoImages] pas de fichier images/ dans le ZIP sans image`);

    } catch (e) {
        assert(false, `[5c.NoImage] Exception : ${e.message}`);
    }

    // --- 5d. DragAndDrop avec background → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'h5p' };

        const rawText = await fetchFixture('drag_and_drop_1.json');
        const jsonObj = healFixture(rawText, 'DragAndDrop');

        clearAllImages();
        registerImage('backgroundImage', pngEntry);

        jsonObj.backgroundImage = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };

        const processed = await processH5PContent('DragAndDrop', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('DragAndDrop');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const imageFiles = getAllImages();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test DragAndDrop avec background',
            lang: 'fr',
            imageFiles
        });

        const zip = await JSZip.loadAsync(h5pBlob);
        const imagePath = `content/${pngEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5d.ImageFile] ${imagePath} present dans le ZIP (background)`);

        clearAllImages();
    } catch (e) {
        assert(false, `[5d.DragAndDrop] Exception : ${e.message}`);
        clearAllImages();
    }

    // --- 5e. Crossword avec background → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'crosswords_1.json', module: 'Crossword', source: 'h5p' };

        const rawText = await fetchFixture('crosswords_1.json');
        const jsonObj = healFixture(rawText, 'Crossword');

        clearAllImages();
        registerImage('backgroundImage', webpEntry);

        jsonObj.backgroundImage = {
            path: webpEntry.h5pPath,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };

        const processed = await processH5PContent('Crossword', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('Crossword');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const imageFiles = getAllImages();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test Crossword avec background',
            lang: 'fr',
            imageFiles
        });

        const zip = await JSZip.loadAsync(h5pBlob);
        const imagePath = `content/${webpEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5e.ImageFile] ${imagePath} present dans le ZIP (Crossword bg)`);

        // Verifier structure theme.backgroundImage dans content.json
        const contentFile = zip.file('content/content.json');
        if (contentFile) {
            const parsed = JSON.parse(await contentFile.async('text'));
            assert(parsed.theme && parsed.theme.backgroundImage, `[5e.Theme] theme.backgroundImage dans content.json`);
            assertEqual(parsed.theme.backgroundImage.path, webpEntry.h5pPath, `[5e.Path] backgroundImage.path correct`);
        }

        clearAllImages();
    } catch (e) {
        assert(false, `[5e.Crossword] Exception : ${e.message}`);
        clearAllImages();
    }

    // --- 5f. Timeline avec event image → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'timeline_1.json', module: 'Timeline', source: 'h5p' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        clearAllImages();
        registerImage('timeline.date.0.eventImage', pngEntry);

        jsonObj.timeline.date[0].mediaType = 'image';
        jsonObj.timeline.date[0].eventImage = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonObj.timeline.date[0].eventImageAlt = 'Event image ZIP';

        const processed = await processH5PContent('Timeline', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('Timeline');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const imageFiles = getAllImages();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test Timeline avec event image',
            lang: 'fr',
            imageFiles
        });

        const zip = await JSZip.loadAsync(h5pBlob);
        const imagePath = `content/${pngEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5f.ImageFile] ${imagePath} present dans le ZIP (Timeline event)`);

        // Verifier asset.media dans content.json
        const contentFile = zip.file('content/content.json');
        if (contentFile) {
            const parsed = JSON.parse(await contentFile.async('text'));
            assertEqual(parsed.timeline.date[0].asset.media, pngEntry.h5pPath, `[5f.Media] asset.media pointe vers l'image`);
        }

        clearAllImages();
    } catch (e) {
        assert(false, `[5f.Timeline] Exception : ${e.message}`);
        clearAllImages();
    }

    // --- 5g. CoursePresentation avec slide image → image dans le ZIP ---
    try {
        _ctx = { step: 5, stepName: 'H5P+ZIP', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'h5p' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        clearAllImages();
        registerImage('slides.0.slideImage', pngEntry);

        if (jsonObj.slides && jsonObj.slides.length > 0) {
            jsonObj.slides[0].slideImage = {
                path: pngEntry.h5pPath,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.slides[0].slideImageAlt = 'Slide image ZIP';
        }

        const processed = await processH5PContent('CoursePresentation', structuredClone(jsonObj));
        const contentJson = processed.content || processed;
        const metadata = getModuleMetadata('CoursePresentation');
        const dynamicDeps = processed.dependencies || [];

        const dependencies = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...dynamicDeps
        ];

        const imageFiles = getAllImages();
        const h5pBlob = await createH5PBlob(contentJson, metadata.machineName, dependencies, {
            title: 'Test CoursePresentation avec image',
            lang: 'fr',
            imageFiles
        });

        const zip = await JSZip.loadAsync(h5pBlob);
        const imagePath = `content/${pngEntry.h5pPath}`;
        const imageFile = zip.file(imagePath);
        assert(imageFile !== null, `[5g.ImageFile] ${imagePath} present dans le ZIP (CP slide)`);

        // Verifier H5P.Image dans les elements du slide
        const contentFile = zip.file('content/content.json');
        if (contentFile) {
            const parsed = JSON.parse(await contentFile.async('text'));
            const firstSlide = parsed.presentation.slides[0];
            const hasImageEl = firstSlide.elements.some(el =>
                el.action && el.action.library && el.action.library.startsWith('H5P.Image')
            );
            assert(hasImageEl, `[5g.ImageElement] H5P.Image dans les elements du slide dans content.json`);
        }

        // Verifier H5P.Image dans les dependances
        const h5pFile = zip.file('h5p.json');
        if (h5pFile) {
            const h5pJson = JSON.parse(await h5pFile.async('text'));
            const hasImageDep = h5pJson.preloadedDependencies.some(d => d.machineName === 'H5P.Image');
            assert(hasImageDep, `[5g.ImageDep] H5P.Image dans preloadedDependencies (CP)`);
        }

        clearAllImages();
    } catch (e) {
        assert(false, `[5g.CoursePresentation] Exception : ${e.message}`);
        clearAllImages();
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : EXPORT DOCUMENT AVEC IMAGES MEDIA
// =======================================================================

async function runStep6_DocumentExportWithImages() {
    console.group('Etape 6 : Export document avec images media');

    // Activites media qui doivent generer une section image dans l'export
    const mediaActivities = [
        { module: 'MultipleChoice', fixture: 'multiple_choice_1.json' },
        { module: 'TrueFalse', fixture: 'true_false_1.json' },
        { module: 'Essay', fixture: 'essay_1.json' },
        { module: 'FillInTheBlanks', fixture: 'fill_in_the_blanks_1.json' },
        { module: 'DragTheWords', fixture: 'drag_the_words_1.json' },
        { module: 'MarkTheWords', fixture: 'mark_the_words_1.json' }
    ];

    for (const activity of mediaActivities) {
        try {
            _ctx = { step: 6, stepName: 'DocExport+Image', file: activity.fixture, module: activity.module, source: 'export' };

            const rawText = await fetchFixture(activity.fixture);
            const jsonObj = healFixture(rawText, activity.module);

            // Injecter une image media avec dataURL
            jsonObj.mediaImage = {
                path: pngEntry.h5pPath,
                dataURL: pngEntry.dataURL,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.mediaImageAlt = `Image test ${activity.module}`;

            const t0 = performance.now();
            const formatted = await formatContentForDocument(activity.module, jsonObj);
            const t1 = performance.now();

            assert(formatted && formatted.sections, `[6.${activity.module}.Format] formatContentForDocument retourne des sections`);

            // Verifier qu'il y a au moins une section de type 'image'
            const imageSections = formatted.sections.filter(s => s.type === 'image');
            assert(
                imageSections.length > 0,
                `[6.${activity.module}.HasImage] au moins une section image dans l'export (${imageSections.length} trouvee(s))`
            );

            // Verifier que l'URL de l'image est la dataURL
            if (imageSections.length > 0) {
                assert(
                    imageSections[0].url && imageSections[0].url.startsWith('data:image/'),
                    `[6.${activity.module}.URL] section image a une dataURL valide`
                );
            }

            recordTiming('DocExport+Image', `${activity.module} avec image`, t1 - t0);

        } catch (e) {
            assert(false, `[6.${activity.module}] Exception : ${e.message}`);
        }
    }

    // --- 6g. Activite media SANS image → pas de section image (non-regression) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'multiple_choice_1.json', module: 'MultipleChoice', source: 'export' };

        const rawText = await fetchFixture('multiple_choice_1.json');
        const jsonObj = healFixture(rawText, 'MultipleChoice');

        // Pas de mediaImage
        delete jsonObj.mediaImage;
        delete jsonObj.mediaImageAlt;

        const formatted = await formatContentForDocument('MultipleChoice', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        assertEqual(
            imageSections.length, 0,
            `[6g.NoImage] pas de section image quand pas de mediaImage (non-regression)`
        );
    } catch (e) {
        assert(false, `[6g.NoImage] Exception : ${e.message}`);
    }

    // --- 6h. DragAndDrop → PAS d'image dans l'export (intentionnel) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'export' };

        const rawText = await fetchFixture('drag_and_drop_1.json');
        const jsonObj = healFixture(rawText, 'DragAndDrop');

        // Injecter un background
        jsonObj.backgroundImage = {
            path: pngEntry.h5pPath,
            dataURL: pngEntry.dataURL,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };

        const formatted = await formatContentForDocument('DragAndDrop', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        assertEqual(
            imageSections.length, 0,
            `[6h.NoBgExport] DragAndDrop background PAS exporte dans le document (intentionnel)`
        );
    } catch (e) {
        assert(false, `[6h.DragAndDrop] Exception : ${e.message}`);
    }

    // --- 6h2. DragAndDrop avec element image → image inline dans les cellules de table ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'drag_and_drop_1.json', module: 'DragAndDrop', source: 'export' };

        const rawText6h2 = await fetchFixture('drag_and_drop_1.json');
        const jsonObj6h2 = healFixture(rawText6h2, 'DragAndDrop');

        // Injecter une image sur le 1er element
        jsonObj6h2.elements[0].image = {
            path: pngEntry.h5pPath,
            dataURL: pngEntry.dataURL,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonObj6h2.elements[0].imageAltText = 'Logo test export';

        const formatted6h2 = await formatContentForDocument('DragAndDrop', jsonObj6h2);

        // Verifier que les cellules des tables contiennent des objets image
        const allCells6h2 = formatted6h2.sections
            .filter(s => s.type === 'table')
            .flatMap(s => s.rows)
            .flat();

        // Au moins une cellule doit etre un objet avec imageUrl
        const objectCells = allCells6h2.filter(cell =>
            cell && typeof cell === 'object' && cell.imageUrl
        );
        assert(
            objectCells.length >= 1,
            `[6h2.HasImageCell] au moins 1 cellule avec imageUrl (${objectCells.length} trouvee(s))`
        );

        // L'image doit avoir la bonne URL
        if (objectCells.length > 0) {
            assert(
                objectCells[0].imageUrl === pngEntry.dataURL || objectCells[0].imageUrl === pngEntry.h5pPath,
                `[6h2.ImageURL] imageUrl correcte dans la cellule`
            );
            assert(
                objectCells[0].text && objectCells[0].text.length > 0,
                `[6h2.ImageText] texte present dans la cellule image (${objectCells[0].text})`
            );
        }

        // Les autres cellules restent des strings
        const stringCells = allCells6h2.filter(cell =>
            typeof cell === 'string' && cell.length > 3
        );
        assert(stringCells.length > 0, `[6h2.TextPreserved] etiquettes texte restent des strings`);

        // Verifier qu'il n'y a PAS de section image separee (tout est inline)
        const imageSections6h2 = formatted6h2.sections.filter(s => s.type === 'image');
        assertEqual(
            imageSections6h2.length, 0,
            `[6h2.NoSeparateImage] pas de section image separee (tout inline dans les cellules)`
        );

    } catch (e) {
        assert(false, `[6h2.DragAndDropImageExport] Exception : ${e.message}`);
    }

    // --- 6i. Timeline avec eventImage uploadée → image dans l'export ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'timeline_1.json', module: 'Timeline', source: 'export' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Injecter une image uploadée sur l'événement 0
        jsonObj.timeline.date[0].mediaType = 'image';
        jsonObj.timeline.date[0].eventImage = {
            path: pngEntry.h5pPath,
            dataURL: pngEntry.dataURL,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonObj.timeline.date[0].eventImageAlt = 'Image événement export';

        const formatted = await formatContentForDocument('Timeline', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        // Au moins 1 image (l'événement avec image uploadée)
        assert(
            imageSections.length >= 1,
            `[6i.HasEventImage] au moins 1 section image dans l'export Timeline (${imageSections.length} trouvee(s))`
        );

        // Vérifier que l'image uploadée est présente (pas les URLs Wikimedia)
        const uploadedImage = imageSections.find(s => s.url === pngEntry.h5pPath || (s.url && s.url.startsWith('data:')));
        assert(
            uploadedImage !== undefined,
            `[6i.UploadedImage] image uploadee trouvee dans les sections (path ou dataURL)`
        );
    } catch (e) {
        assert(false, `[6i.TimelineEvent] Exception : ${e.message}`);
    }

    // --- 6j. Timeline avec coverImage uploadée → image dans l'export ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'timeline_1.json', module: 'Timeline', source: 'export' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Injecter une image de couverture
        jsonObj.timeline.mediaType = 'image';
        jsonObj.timeline.coverImage = {
            path: webpEntry.h5pPath,
            dataURL: webpEntry.dataURL,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };
        jsonObj.timeline.coverImageAlt = 'Couverture export';

        const formatted = await formatContentForDocument('Timeline', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        // La couverture doit être la 1ère image
        assert(imageSections.length >= 1, `[6j.HasCover] image de couverture dans l'export`);
        if (imageSections.length > 0) {
            const coverSection = imageSections[0];
            assert(
                coverSection.url === webpEntry.h5pPath || coverSection.url === webpEntry.dataURL,
                `[6j.CoverURL] 1ere image = couverture uploadee`
            );
        }
    } catch (e) {
        assert(false, `[6j.TimelineCover] Exception : ${e.message}`);
    }

    // --- 6k. Timeline SANS image uploadée → URLs originales dans l'export ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'timeline_1.json', module: 'Timeline', source: 'export' };

        const rawText = await fetchFixture('timeline_1.json');
        const jsonObj = healFixture(rawText, 'Timeline');

        // Pas d'image uploadée — les URLs externes doivent rester
        const formatted = await formatContentForDocument('Timeline', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        // Les événements avec asset.media URL doivent produire des sections image
        const urlImages = imageSections.filter(s => s.url && s.url.startsWith('http'));
        assert(
            urlImages.length >= 1,
            `[6k.URLImages] URLs externes preservees dans l'export (${urlImages.length} trouvee(s))`
        );
    } catch (e) {
        assert(false, `[6k.TimelineURLs] Exception : ${e.message}`);
    }

    // --- 6l. CoursePresentation avec slideImage → image dans l'export ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'export' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        // Injecter une image sur le 1er slide
        if (jsonObj.slides && jsonObj.slides.length > 0) {
            jsonObj.slides[0].slideImage = {
                path: pngEntry.h5pPath,
                dataURL: pngEntry.dataURL,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.slides[0].slideImageAlt = 'Image slide export';
        }

        const formatted = await formatContentForDocument('CoursePresentation', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        assert(
            imageSections.length >= 1,
            `[6l.HasSlideImage] image de slide dans l'export CoursePresentation (${imageSections.length} trouvee(s))`
        );

        if (imageSections.length > 0) {
            assert(
                imageSections[0].url === pngEntry.h5pPath || imageSections[0].url === pngEntry.dataURL,
                `[6l.SlideImageURL] URL image du slide correcte`
            );
        }
    } catch (e) {
        assert(false, `[6l.CPSlideImage] Exception : ${e.message}`);
    }

    // --- 6m. CoursePresentation SANS image → pas de section image (non-regression) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'course_presentation_1.json', module: 'CoursePresentation', source: 'export' };

        const rawText = await fetchFixture('course_presentation_1.json');
        const jsonObj = healFixture(rawText, 'CoursePresentation');

        // Pas de slideImage
        const formatted = await formatContentForDocument('CoursePresentation', jsonObj);
        const imageSections = formatted.sections.filter(s => s.type === 'image');

        assertEqual(
            imageSections.length, 0,
            `[6m.NoImage] pas de section image sans slideImage (non-regression)`
        );
    } catch (e) {
        assert(false, `[6m.CPNoImage] Exception : ${e.message}`);
    }

    // --- 6n. DialogCards avec image → image dans l'export (comme Flashcards) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'dialog_cards_1.json', module: 'DialogCards', source: 'export' };

        const rawText = await fetchFixture('dialog_cards_1.json');
        const jsonObj = healFixture(rawText, 'DialogCards');

        // Injecter une image sur le 1er dialog
        if (jsonObj.dialogs && jsonObj.dialogs.length > 0) {
            jsonObj.dialogs[0].image = {
                path: pngEntry.h5pPath,
                dataURL: pngEntry.dataURL,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
            jsonObj.dialogs[0].imageAltText = 'Image dialog export';
        }

        const formatted = await formatContentForDocument('DialogCards', jsonObj);
        const flashcardSections = formatted.sections.filter(s => s.type === 'flashcardTable');

        assert(flashcardSections.length > 0, `[6n.HasTable] section flashcardTable dans l'export`);

        if (flashcardSections.length > 0) {
            const firstRow = flashcardSections[0].rows[0];
            assert(
                (firstRow.left && firstRow.left.imageUrl) || (firstRow.right && firstRow.right.imageUrl),
                `[6n.CardImage] imageUrl presente dans la 1ere ligne`
            );
        }
    } catch (e) {
        assert(false, `[6n.DialogCards] Exception : ${e.message}`);
    }

    // --- 6o-fc. Flashcards avec image → imageUrl dans l'export (flashcardTable) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'flashcards_1.json', module: 'Flashcards', source: 'export' };

        const rawText = await fetchFixture('flashcards_1.json');
        const jsonObj = healFixture(rawText, 'Flashcards');

        // Injecter une image sur la 1ère carte
        if (jsonObj.cards && jsonObj.cards.length > 0) {
            jsonObj.cards[0].image = {
                path: pngEntry.h5pPath,
                dataURL: pngEntry.dataURL,
                mime: 'image/jpeg',
                width: pngEntry.width,
                height: pngEntry.height
            };
        }

        const formatted = await formatContentForDocument('Flashcards', jsonObj);
        const flashcardSections = formatted.sections.filter(s => s.type === 'flashcardTable');

        assert(flashcardSections.length > 0, `[6o-fc.HasTable] section flashcardTable dans l'export Flashcards`);

        if (flashcardSections.length > 0) {
            // Chercher l'imageUrl dans les lignes recto
            const hasImage = flashcardSections.some(s =>
                s.rows && s.rows.some(row =>
                    (row.left && row.left.imageUrl) || (row.right && row.right.imageUrl)
                )
            );
            assert(hasImage, `[6o-fc.CardImage] imageUrl presente dans les cartes Flashcards`);
        }
    } catch (e) {
        assert(false, `[6o-fc.Flashcards] Exception : ${e.message}`);
    }

    // --- 6o-fc2. Flashcards SANS image → pas d'imageUrl (non-regression) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'flashcards_1.json', module: 'Flashcards', source: 'export' };

        const rawText = await fetchFixture('flashcards_1.json');
        const jsonObj = healFixture(rawText, 'Flashcards');

        // S'assurer qu'aucune carte n'a d'image
        if (jsonObj.cards) {
            jsonObj.cards.forEach(c => { delete c.image; });
        }

        const formatted = await formatContentForDocument('Flashcards', jsonObj);
        const flashcardSections = formatted.sections.filter(s => s.type === 'flashcardTable');

        if (flashcardSections.length > 0) {
            const hasImage = flashcardSections.some(s =>
                s.rows && s.rows.some(row =>
                    (row.left && row.left.imageUrl) || (row.right && row.right.imageUrl)
                )
            );
            assert(!hasImage, `[6o-fc2.NoImage] pas d'imageUrl sans image (non-regression Flashcards)`);
        }
    } catch (e) {
        assert(false, `[6o-fc2.FlashcardsNoImg] Exception : ${e.message}`);
    }

    // --- 6o. Crossword background → PAS dans l'export (pas pertinent sur papier) ---
    try {
        _ctx = { step: 6, stepName: 'DocExport+Image', file: 'crosswords_1.json', module: 'Crossword', source: 'export' };

        const rawText = await fetchFixture('crosswords_1.json');
        const jsonObj = healFixture(rawText, 'Crossword');

        jsonObj.backgroundImage = {
            path: webpEntry.h5pPath,
            dataURL: webpEntry.dataURL,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };

        const formatted = await formatContentForDocument('Crossword', jsonObj);
        // Les images de type 'image' provenant du background ne doivent PAS être exportées
        // (seules les grilles générées _gridImage/_solutionGridImage sont exportées)
        const bgImageSections = formatted.sections.filter(s =>
            s.type === 'image' && s.url && (s.url === webpEntry.h5pPath || s.url === webpEntry.dataURL)
        );
        assertEqual(
            bgImageSections.length, 0,
            `[6o.NoCrossBg] Crossword background PAS exporte (intentionnel)`
        );
    } catch (e) {
        assert(false, `[6o.CrosswordBg] Exception : ${e.message}`);
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : CYCLE COMPLET — AJOUT, RETRAIT, RE-AJOUT
// =======================================================================

async function runStep7_FullCycle() {
    console.group('Etape 7 : Cycle complet — ajout, retrait, re-ajout d\'image');
    _ctx = { step: 7, stepName: 'FullCycle', file: 'flashcards_1.json', module: 'Flashcards', source: 'h5p' };

    const jsZipReady = typeof JSZip !== 'undefined';
    if (!jsZipReady) {
        assert(false, `[7.JSZip] JSZip non disponible`);
        console.groupEnd();
        return;
    }

    try {
        const rawText = await fetchFixture('flashcards_1.json');
        const baseJson = healFixture(rawText, 'Flashcards');
        const metadata = getModuleMetadata('Flashcards');

        // --- Phase A : avec image ---
        clearAllImages();
        registerImage('cards.0.image', pngEntry);

        const jsonWithImage = structuredClone(baseJson);
        jsonWithImage.cards[0].image = {
            path: pngEntry.h5pPath,
            mime: 'image/jpeg',
            width: pngEntry.width,
            height: pngEntry.height
        };
        jsonWithImage.cards[0].imageAltText = 'Phase A — avec image';

        const processedA = await processH5PContent('Flashcards', structuredClone(jsonWithImage));
        const contentA = processedA.content || processedA;
        const depsA = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...(processedA.dependencies || [])
        ];

        const blobA = await createH5PBlob(contentA, metadata.machineName, depsA, {
            title: 'Cycle A', lang: 'fr', imageFiles: getAllImages()
        });

        const zipA = await JSZip.loadAsync(blobA);
        const imagesA = Object.keys(zipA.files).filter(f => f.startsWith('content/images/'));
        assert(imagesA.length === 1, `[7a.Phase A] 1 image dans le ZIP (${imagesA.length})`);

        // --- Phase B : image retiree ---
        clearAllImages();

        const jsonNoImage = structuredClone(baseJson);
        // Pas d'image injectee

        const processedB = await processH5PContent('Flashcards', structuredClone(jsonNoImage));
        const contentB = processedB.content || processedB;
        const depsB = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...(processedB.dependencies || [])
        ];

        const blobB = await createH5PBlob(contentB, metadata.machineName, depsB, {
            title: 'Cycle B', lang: 'fr'
        });

        const zipB = await JSZip.loadAsync(blobB);
        const imagesB = Object.keys(zipB.files).filter(f => f.startsWith('content/images/'));
        assertEqual(imagesB.length, 0, `[7b.Phase B] 0 image dans le ZIP apres retrait`);

        // Verifier que la carte n'a plus d'image dans content.json
        const contentFileB = zipB.file('content/content.json');
        if (contentFileB) {
            const parsedB = JSON.parse(await contentFileB.async('text'));
            assert(!parsedB.cards[0].image, `[7b.NoImageJSON] cards[0].image absent dans content.json`);
        }

        // --- Phase C : image re-ajoutee (WebP cette fois) ---
        clearAllImages();
        registerImage('cards.0.image', webpEntry);

        const jsonReImage = structuredClone(baseJson);
        jsonReImage.cards[0].image = {
            path: webpEntry.h5pPath,
            mime: 'image/jpeg',
            width: webpEntry.width,
            height: webpEntry.height
        };
        jsonReImage.cards[0].imageAltText = 'Phase C — re-ajout WebP';

        const processedC = await processH5PContent('Flashcards', structuredClone(jsonReImage));
        const contentC = processedC.content || processedC;
        const depsC = [
            ...metadata.extraDependencies,
            { machineName: metadata.machineName, majorVersion: metadata.version.major, minorVersion: metadata.version.minor },
            ...(processedC.dependencies || [])
        ];

        const blobC = await createH5PBlob(contentC, metadata.machineName, depsC, {
            title: 'Cycle C', lang: 'fr', imageFiles: getAllImages()
        });

        const zipC = await JSZip.loadAsync(blobC);
        const imagesC = Object.keys(zipC.files).filter(f => f.startsWith('content/images/'));
        assert(imagesC.length === 1, `[7c.Phase C] 1 image dans le ZIP apres re-ajout (${imagesC.length})`);

        // Verifier que c'est bien le h5pPath du WebP
        const contentFileC = zipC.file('content/content.json');
        if (contentFileC) {
            const parsedC = JSON.parse(await contentFileC.async('text'));
            assertEqual(parsedC.cards[0].image.path, webpEntry.h5pPath, `[7c.NewPath] nouveau h5pPath (WebP)`);
            assertEqual(parsedC.cards[0].imageAltText, 'Phase C — re-ajout WebP', `[7c.NewAlt] nouveau alt text`);
        }

        clearAllImages();

    } catch (e) {
        assert(false, `[7.FullCycle] Exception : ${e.message}`);
        clearAllImages();
    }

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Traitement images',
    'Registre image-manager',
    'buildMediaStructure',
    'Processeurs H5P + images',
    'Packaging H5P + images ZIP',
    'Export document + images',
    'Cycle complet'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Charge et traite des images reelles (PNG et WebP) via processImage(). Verifie la conversion en JPEG, le redimensionnement, la generation du h5pPath et de la dataURL. Teste aussi le rejet de fichiers trop gros ou de format invalide.',
    'Teste le cycle de vie complet du registre image-manager : register, get, unregister, re-register, getAllImages, clearAllImages. Verifie que chaque operation met a jour correctement le compteur et les donnees.',
    'Teste la fonction buildMediaStructure() qui genere la structure media H5P standard. Verifie la structure avec et sans image, avec et sans texte alternatif.',
    'Injecte des images dans les JSON de 15 activites (Flashcards, DialogCards, DragAndDrop, Crossword, Timeline, CoursePresentation + 6 activites media) et verifie que les processeurs H5P produisent la bonne structure. Teste positions, remplacement URL, et non-regression sans image.',
    'Cree des fichiers .h5p (ZIP) avec images injectees pour 7 activites et verifie que le ZIP contient : l\'image binaire sous content/images/, la reference dans content.json, et H5P.Image 1.1 dans les dependances.',
    'Teste formatContentForDocument() avec des images injectees. Verifie les sections image pour les 6 activites media, Timeline (couverture + evenements), CoursePresentation (slides), DialogCards et Flashcards (flashcardTable). Verifie la non-regression sans image et l\'exclusion intentionnelle du background DragAndDrop et Crossword.',
    'Cycle complet ajout → retrait → re-ajout sur Flashcards : verifie que le ZIP contient 1 image, puis 0, puis 1 a nouveau avec un nouveau path.'
];

export async function runAllTests() {
    console.log('=== Tests images H5P Caramel (7 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    // Precharger JSZip
    try {
        await loadJSZip();
    } catch (e) {
        console.warn('JSZip non charge, certains tests seront ignores');
    }

    await runStep1_ImageProcessing();
    await runStep2_ImageRegistry();
    await runStep3_BuildMediaStructure();
    await runStep4_H5PProcessorsWithImages();
    await runStep5_H5PPackagingWithImages();
    await runStep6_DocumentExportWithImages();
    await runStep7_FullCycle();

    // Nettoyage final
    clearAllImages();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
