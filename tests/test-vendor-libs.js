/**
 * @file Tests de non-regression des bibliotheques JS vendor.
 * Verifie que chaque bibliotheque utilisee par Caramel fonctionne correctement
 * apres une mise a jour, en testant l'API exacte utilisee dans le code.
 *
 * 8 etapes :
 *  1. Chargement de toutes les bibliotheques
 *  2. JSZip — Creation et lecture ZIP
 *  3. client-zip — ZIP streaming H5P
 *  4. fflate & tar-js — Packaging Moodle
 *  5. DOMPurify — Sanitisation HTML
 *  6. jsPDF & AutoTable — Export PDF
 *  7. docx — Export DOCX
 *  8. MathJax — Rendu LaTeX
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
    loadOcrLibs,
    loadH5pLibs,
    loadMoodleLibs,
    loadMathJax,
    loadDocumentExportLibs,
    loadDOMPurify,
    loadClientZip,
    LIB_PATHS
} from '../js/core/lib-loader.js';

// ============================================================================
// ETAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = {
    step: 0,
    stepName: '',
    file: '',
    module: '',
    source: ''
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Assertion de base avec diagnostic optionnel
 */
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

/**
 * Enregistre une mesure de performance
 */
function recordTiming(category, operation, durationMs) {
    timings.push({
        category,
        operation,
        durationMs: Math.round(durationMs * 100) / 100
    });
}

// ============================================================================
// CONSTANTES DES ETAPES
// ============================================================================

const STEP_NAMES = [
    '',
    'Chargement',
    'JSZip',
    'client-zip',
    'fflate & tar-js',
    'DOMPurify',
    'jsPDF & AutoTable',
    'docx',
    'MathJax'
];

export const STEP_DESCRIPTIONS = {
    1: 'Charge toutes les bibliotheques via lib-loader.js, verifie les globaux (pdfjsLib, Tesseract, mammoth, JSZip, fflate, Tar, MathJax, jspdf, docx, DOMPurify, client-zip) ET verifie que chaque fichier LIB_PATHS existe reellement sur le serveur (HTTP HEAD)',
    2: 'Cree un ZIP avec fichiers texte et JSON, le relit, verifie les contenus, teste folder().forEach() et le support UTF-8 (accents, emojis)',
    3: 'Cree un ZIP streaming avec downloadZip() au format utilise par h5p-creator.js [{name, input: Uint8Array}], verifie le blob et le contenu',
    4: 'Cree un TAR avec tar-js, compresse avec fflate.gzip(), verifie le magic number gzip (0x1f, 0x8b) et la taille',
    5: 'Teste DOMPurify.sanitize() avec les vecteurs XSS (script, onerror, javascript:) et la preservation du HTML pedagogique autorise',
    6: 'Cree un PDF avec jsPDF, ajoute du texte et un tableau via autoTable, verifie lastAutoTable.finalY et genere un blob',
    7: 'Cree un DOCX avec Document, Paragraph, TextRun, HeadingLevel, Packer.toBlob(), verifie le magic number ZIP (PK)',
    8: 'Rend une formule LaTeX (E=mc^2) via MathJax.typesetPromise(), verifie la presence de SVG, teste typesetClear()'
};

// ============================================================================
// ETAPE 1 : CHARGEMENT DES BIBLIOTHEQUES
// ============================================================================

async function runStep1_Chargement() {
    _ctx = { step: 1, stepName: 'Chargement', file: 'js/core/lib-loader.js', module: 'lib-loader', source: '' };
    console.group('Etape 1 : Chargement des bibliotheques');

    // --- OCR (PDF.js, Tesseract, mammoth, JSZip) ---
    try {
        const t0 = performance.now();
        await loadOcrLibs();
        recordTiming('Chargement', 'loadOcrLibs (PDF.js + Tesseract + mammoth + JSZip)', performance.now() - t0);

        assert(!!window.pdfjsLib, '[1a.pdfjsLib] window.pdfjsLib est disponible apres loadOcrLibs()');
        assert(typeof window.pdfjsLib.getDocument === 'function', '[1b.pdfjsLib.getDocument] pdfjsLib.getDocument est une fonction');
        assert(!!window.Tesseract, '[1c.Tesseract] window.Tesseract est disponible apres loadOcrLibs()');
        assert(typeof window.Tesseract.recognize === 'function', '[1d.Tesseract.recognize] Tesseract.recognize est une fonction');
        assert(!!window.mammoth, '[1e.mammoth] window.mammoth est disponible apres loadOcrLibs()');
        assert(typeof window.mammoth.extractRawText === 'function', '[1f.mammoth.extractRawText] mammoth.extractRawText est une fonction');
        assert(!!window.JSZip, '[1g.JSZip] window.JSZip est disponible apres loadOcrLibs()');
    } catch (e) {
        assert(false, '[1.OCR] Echec chargement bibliotheques OCR', { erreur: e.message });
    }

    // --- H5P (client-zip, h5p-standalone) ---
    try {
        const t0 = performance.now();
        await loadH5pLibs();
        recordTiming('Chargement', 'loadH5pLibs (client-zip + h5p-standalone)', performance.now() - t0);

        const downloadZip = await loadClientZip();
        assert(typeof downloadZip === 'function', '[1h.clientZip] loadClientZip() retourne une fonction');
    } catch (e) {
        assert(false, '[1.H5P] Echec chargement bibliotheques H5P', { erreur: e.message });
    }

    // --- Moodle (fflate, tar-js) ---
    try {
        const t0 = performance.now();
        await loadMoodleLibs();
        recordTiming('Chargement', 'loadMoodleLibs (fflate + tar-js)', performance.now() - t0);

        assert(!!window.fflate, '[1i.fflate] window.fflate est disponible apres loadMoodleLibs()');
        assert(typeof window.fflate.gzip === 'function', '[1j.fflate.gzip] fflate.gzip est une fonction');
        assert(typeof window.fflate.strToU8 === 'function', '[1k.fflate.strToU8] fflate.strToU8 est une fonction');
        assert(!!window.Tar, '[1l.Tar] window.Tar est disponible apres loadMoodleLibs()');
    } catch (e) {
        assert(false, '[1.Moodle] Echec chargement bibliotheques Moodle', { erreur: e.message });
    }

    // --- DOMPurify ---
    try {
        const t0 = performance.now();
        await loadDOMPurify();
        recordTiming('Chargement', 'loadDOMPurify', performance.now() - t0);

        assert(!!window.DOMPurify, '[1m.DOMPurify] window.DOMPurify est disponible apres loadDOMPurify()');
        assert(typeof window.DOMPurify.sanitize === 'function', '[1n.DOMPurify.sanitize] DOMPurify.sanitize est une fonction');
    } catch (e) {
        assert(false, '[1.DOMPurify] Echec chargement DOMPurify', { erreur: e.message });
    }

    // --- Export documents (jsPDF, docx) ---
    try {
        const t0 = performance.now();
        await loadDocumentExportLibs();
        recordTiming('Chargement', 'loadDocumentExportLibs (jsPDF + AutoTable + docx)', performance.now() - t0);

        assert(!!window.jspdf, '[1o.jspdf] window.jspdf est disponible apres loadDocumentExportLibs()');
        assert(typeof window.jspdf.jsPDF === 'function', '[1p.jspdf.jsPDF] jspdf.jsPDF est un constructeur');
        assert(!!window.docx, '[1q.docx] window.docx est disponible apres loadDocumentExportLibs()');
        assert(typeof window.docx.Document === 'function', '[1r.docx.Document] docx.Document est un constructeur');
        assert(typeof window.docx.Packer?.toBlob === 'function', '[1s.docx.Packer] docx.Packer.toBlob est une fonction');
    } catch (e) {
        assert(false, '[1.Export] Echec chargement bibliotheques export', { erreur: e.message });
    }

    // --- MathJax ---
    try {
        const t0 = performance.now();
        await loadMathJax();
        recordTiming('Chargement', 'loadMathJax', performance.now() - t0);

        assert(!!window.MathJax, '[1t.MathJax] window.MathJax est disponible apres loadMathJax()');
        assert(typeof window.MathJax.typesetPromise === 'function', '[1u.MathJax.typesetPromise] MathJax.typesetPromise est une fonction');
    } catch (e) {
        assert(false, '[1.MathJax] Echec chargement MathJax', { erreur: e.message });
    }

    // --- Verification que les fichiers LIB_PATHS existent reellement sur le serveur ---
    // Empeche les faux positifs (ex: une lib chargee par un import hardcode alors que
    // le chemin dans LIB_PATHS est faux ou que le fichier a ete supprime)
    const pathsToCheck = Object.entries(LIB_PATHS).filter(
        ([key]) => !key.startsWith('FONT_') && key !== 'H5P_LIBRARIES'
    );
    const t0Paths = performance.now();
    const headResults = await Promise.allSettled(
        pathsToCheck.map(async ([key, path]) => {
            const resp = await fetch(path, { method: 'HEAD' });
            return { key, path, ok: resp.ok, status: resp.status };
        })
    );
    recordTiming('Chargement', `Verification existence fichiers LIB_PATHS (${pathsToCheck.length} fichiers)`, performance.now() - t0Paths);

    for (const result of headResults) {
        if (result.status === 'fulfilled') {
            const { key, path, ok, status } = result.value;
            assert(ok, `[1v.Path.${key}] Le fichier LIB_PATHS.${key} existe sur le serveur`, {
                chemin: path,
                httpStatus: status
            });
        } else {
            // Le fetch lui-meme a echoue (erreur reseau)
            assert(false, `[1v.Path] Echec verification d'un chemin LIB_PATHS`, {
                erreur: result.reason?.message
            });
        }
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 2 : JSZIP — CREATION ET LECTURE ZIP
// ============================================================================

async function runStep2_JSZip() {
    _ctx = { step: 2, stepName: 'JSZip', file: 'js/services/ocr.js', module: 'JSZip', source: '' };
    console.group('Etape 2 : JSZip');

    const JSZip = window.JSZip;

    // --- Creation d'un ZIP ---
    try {
        const t0 = performance.now();
        const zip = new JSZip();
        zip.file('hello.txt', 'Bonjour le monde !');
        zip.file('data.json', JSON.stringify({ titre: 'Test', questions: [1, 2, 3] }));
        zip.file('sous-dossier/readme.txt', 'Fichier dans un sous-dossier');

        const blob = await zip.generateAsync({ type: 'blob' });
        recordTiming('JSZip', 'Creer ZIP (3 fichiers)', performance.now() - t0);

        assert(blob instanceof Blob, '[2a.Create] generateAsync retourne un Blob');
        assert(blob.size > 0, '[2b.Size] Le ZIP genere a une taille > 0', { taille: blob.size });
    } catch (e) {
        assert(false, '[2.Create] Echec creation ZIP', { erreur: e.message });
    }

    // --- Lecture d'un ZIP ---
    try {
        const zip = new JSZip();
        zip.file('content.xml', '<document><p>Contenu ODT</p></document>');
        zip.file('meta.xml', '<meta><title>Test</title></meta>');
        const blob = await zip.generateAsync({ type: 'blob' });

        const t0 = performance.now();
        const loaded = await JSZip.loadAsync(blob);
        recordTiming('JSZip', 'Lire ZIP (loadAsync)', performance.now() - t0);

        const content = await loaded.file('content.xml').async('text');
        assert(content.includes('<document>'), '[2c.Read] Lecture content.xml depuis le ZIP', { contenu: content.substring(0, 100) });

        const meta = await loaded.file('meta.xml').async('string');
        assert(meta.includes('<title>Test</title>'), '[2d.ReadString] Lecture avec async("string")', { contenu: meta.substring(0, 100) });
    } catch (e) {
        assert(false, '[2.Read] Echec lecture ZIP', { erreur: e.message });
    }

    // --- folder().forEach() (utilise dans ocr.js pour PPTX/ODP) ---
    try {
        const zip = new JSZip();
        zip.file('ppt/slides/slide1.xml', '<slide>1</slide>');
        zip.file('ppt/slides/slide2.xml', '<slide>2</slide>');
        zip.file('ppt/autre.xml', '<autre/>');
        const blob = await zip.generateAsync({ type: 'blob' });
        const loaded = await JSZip.loadAsync(blob);

        const slides = [];
        loaded.folder('ppt/slides').forEach((relativePath, file) => {
            slides.push(relativePath);
        });
        assert(slides.length === 2, '[2e.Folder] folder("ppt/slides").forEach() trouve 2 slides', { slides });
    } catch (e) {
        assert(false, '[2.Folder] Echec folder().forEach()', { erreur: e.message });
    }

    // --- Contenu UTF-8 (accents, emojis, caracteres speciaux) ---
    try {
        const zip = new JSZip();
        const utf8Content = 'Les élèves étudient les mathématiques 📐 avec des « guillemets » et des œuvres.';
        zip.file('utf8.txt', utf8Content);
        const blob = await zip.generateAsync({ type: 'blob' });
        const loaded = await JSZip.loadAsync(blob);
        const readBack = await loaded.file('utf8.txt').async('string');
        assert(readBack === utf8Content, '[2f.UTF8] Preservation du contenu UTF-8 (accents, emojis, guillemets)', {
            attendu: utf8Content,
            obtenu: readBack
        });
    } catch (e) {
        assert(false, '[2.UTF8] Echec test UTF-8', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 3 : CLIENT-ZIP — ZIP STREAMING H5P
// ============================================================================

async function runStep3_ClientZip() {
    _ctx = { step: 3, stepName: 'client-zip', file: 'js/h5p/h5p-creator.js', module: 'client-zip', source: '' };
    console.group('Etape 3 : client-zip');

    try {
        const downloadZip = await loadClientZip();

        // --- Format exact utilise par h5p-creator.js ---
        const encoder = new TextEncoder();
        const files = [
            { name: 'content/content.json', input: encoder.encode('{"params":{"title":"Test H5P"}}') },
            { name: 'h5p.json', input: encoder.encode('{"mainLibrary":"H5P.Test","majorVersion":1}') },
            { name: 'content/images/test.txt', input: encoder.encode('image placeholder') }
        ];

        const t0 = performance.now();
        const response = downloadZip(files);
        assert(response instanceof Response, '[3a.Response] downloadZip() retourne un objet Response');

        const blob = await response.blob();
        recordTiming('client-zip', 'Creer ZIP streaming (3 fichiers)', performance.now() - t0);

        assert(blob instanceof Blob, '[3b.Blob] Le resultat est un Blob');
        assert(blob.size > 0, '[3c.Size] Le blob a une taille > 0', { taille: blob.size });

        // --- Verification du contenu en relisant avec JSZip ---
        const loaded = await window.JSZip.loadAsync(blob);
        const contentJson = await loaded.file('content/content.json').async('string');
        assert(contentJson.includes('"title":"Test H5P"'), '[3d.Content] Le contenu du ZIP est lisible et correct');

        const h5pJson = await loaded.file('h5p.json').async('string');
        assert(h5pJson.includes('H5P.Test'), '[3e.H5P] h5p.json est present et correct');

        // --- Comptage des fichiers ---
        let fileCount = 0;
        loaded.forEach(() => fileCount++);
        assert(fileCount === 3, '[3f.Count] Le ZIP contient 3 fichiers', { fileCount });
    } catch (e) {
        assert(false, '[3.ClientZip] Echec test client-zip', { erreur: e.message, stack: e.stack });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 4 : FFLATE & TAR-JS — PACKAGING MOODLE
// ============================================================================

async function runStep4_MoodlePackaging() {
    _ctx = { step: 4, stepName: 'fflate & tar-js', file: 'js/moodle/moodle-creator.js', module: 'fflate + tar-js', source: '' };
    console.group('Etape 4 : fflate & tar-js');

    // --- tar-js : creation TAR ---
    let tarball;
    try {
        const t0 = performance.now();
        const tar = new window.Tar();
        tar.append('moodle_backup.xml', '<?xml version="1.0"?><moodle_backup><info><name>Test</name></info></moodle_backup>');
        tar.append('activities/quiz_1/quiz.xml', '<quiz><question type="multichoice"/></quiz>');
        tar.append('course/course.xml', '<course><fullname>Cours Test</fullname></course>');
        tarball = tar.out;
        recordTiming('tar-js', 'Creer TAR (3 fichiers)', performance.now() - t0);

        assert(tarball instanceof Uint8Array, '[4a.TarType] tar.out est un Uint8Array');
        assert(tarball.length > 0, '[4b.TarSize] Le TAR a une taille > 0', { taille: tarball.length });
    } catch (e) {
        assert(false, '[4.Tar] Echec creation TAR', { erreur: e.message });
        console.groupEnd();
        return;
    }

    // --- fflate.strToU8 ---
    try {
        const input = 'Texte avec accents : éèêë';
        const u8 = window.fflate.strToU8(input);
        assert(u8 instanceof Uint8Array, '[4c.strToU8] fflate.strToU8 retourne un Uint8Array');
        assert(u8.length > 0, '[4d.strToU8Size] Le resultat a une taille > 0');
    } catch (e) {
        assert(false, '[4.strToU8] Echec fflate.strToU8', { erreur: e.message });
    }

    // --- fflate.gzip : compression du TAR ---
    try {
        const t0 = performance.now();
        const gzipped = await new Promise((resolve, reject) => {
            window.fflate.gzip(tarball, { level: 6 }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        recordTiming('fflate', 'Compression gzip du TAR', performance.now() - t0);

        assert(gzipped instanceof Uint8Array, '[4e.GzipType] fflate.gzip retourne un Uint8Array');
        assert(gzipped.length > 0, '[4f.GzipSize] Le gzip a une taille > 0', { taille: gzipped.length });

        // Verifier le magic number gzip (0x1f, 0x8b)
        assert(gzipped[0] === 0x1f && gzipped[1] === 0x8b, '[4g.MagicNumber] Magic number gzip correct (0x1f 0x8b)', {
            octet0: '0x' + gzipped[0]?.toString(16),
            octet1: '0x' + gzipped[1]?.toString(16)
        });

        // Verifier que la compression reduit la taille (pour un contenu suffisant)
        assert(gzipped.length < tarball.length, '[4h.Compression] Le gzip est plus petit que le TAR original', {
            tailleTar: tarball.length,
            tailleGzip: gzipped.length,
            ratio: Math.round(gzipped.length / tarball.length * 100) + '%'
        });
    } catch (e) {
        assert(false, '[4.Gzip] Echec compression gzip', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 5 : DOMPURIFY — SANITISATION HTML
// ============================================================================

async function runStep5_DOMPurify() {
    _ctx = { step: 5, stepName: 'DOMPurify', file: 'js/export/sanitizer.js', module: 'DOMPurify', source: '' };
    console.group('Etape 5 : DOMPurify');

    const sanitize = window.DOMPurify.sanitize;

    // --- Vecteurs XSS bloques ---
    const xssVectors = [
        { input: '<script>alert("xss")</script>', label: 'script tag' },
        { input: '<img src=x onerror="alert(1)">', label: 'img onerror' },
        { input: '<a href="javascript:alert(1)">lien</a>', label: 'javascript: href' },
        { input: '<div onmouseover="alert(1)">hover</div>', label: 'onmouseover' },
        { input: '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>', label: 'iframe' },
        { input: '<svg onload="alert(1)"><circle r="10"/></svg>', label: 'svg onload' }
    ];

    for (const vector of xssVectors) {
        try {
            const result = sanitize(vector.input);
            assert(!result.includes('alert'), `[5a.XSS.${vector.label}] Vecteur XSS bloque : ${vector.label}`, {
                input: vector.input,
                resultat: result
            });
        } catch (e) {
            assert(false, `[5a.XSS.${vector.label}] Erreur sanitisation : ${vector.label}`, { erreur: e.message });
        }
    }

    // --- Profil EDUCATIONAL : HTML pedagogique preserve ---
    try {
        const educationalConfig = {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'h1', 'h2', 'h3', 'h4', 'sub', 'sup', 'blockquote', 'pre', 'code', 'img', 'a'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'colspan', 'rowspan']
        };

        const htmlPedagogique = '<p>La formule <strong>E = mc<sup>2</sup></strong> est <em>fondamentale</em>.</p><ul><li>Point 1</li><li>Point 2</li></ul>';
        const result = sanitize(htmlPedagogique, educationalConfig);
        assert(result.includes('<strong>'), '[5b.Edu.strong] Balise <strong> preservee en mode EDUCATIONAL');
        assert(result.includes('<sup>'), '[5c.Edu.sup] Balise <sup> preservee en mode EDUCATIONAL');
        assert(result.includes('<em>'), '[5d.Edu.em] Balise <em> preservee en mode EDUCATIONAL');
        assert(result.includes('<ul>'), '[5e.Edu.ul] Balise <ul> preservee en mode EDUCATIONAL');
        assert(result.includes('<li>'), '[5f.Edu.li] Balise <li> preservee en mode EDUCATIONAL');
    } catch (e) {
        assert(false, '[5.Edu] Echec test profil EDUCATIONAL', { erreur: e.message });
    }

    // --- Profil STRICT : uniquement texte simple ---
    try {
        const strictConfig = {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        };
        const htmlAvecBalises = '<p>Texte <strong>gras</strong> et <script>alert(1)</script> fin.</p>';
        const result = sanitize(htmlAvecBalises, strictConfig);
        assert(!result.includes('<'), '[5g.Strict] Mode STRICT supprime toutes les balises HTML', { resultat: result });
        assert(result.includes('Texte'), '[5h.Strict.text] Le texte est preserve en mode STRICT', { resultat: result });
    } catch (e) {
        assert(false, '[5.Strict] Echec test profil STRICT', { erreur: e.message });
    }

    // --- Profil RICH_HTML : HTML riche autorise (pages Elea) ---
    try {
        const richConfig = {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'h1', 'h2', 'h3', 'h4', 'sub', 'sup', 'blockquote', 'pre', 'code', 'img', 'a', 'figure', 'figcaption', 'video', 'audio', 'source'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'colspan', 'rowspan', 'controls', 'width', 'height'],
            ALLOW_DATA_ATTR: false
        };

        const richHtml = '<div><h2>Titre</h2><figure><img src="image.png" alt="photo" width="300"><figcaption>Legende</figcaption></figure><table><tr><td colspan="2">Cellule</td></tr></table></div>';
        const result = sanitize(richHtml, richConfig);
        assert(result.includes('<figure>'), '[5i.Rich.figure] Balise <figure> preservee en mode RICH_HTML');
        assert(result.includes('<figcaption>'), '[5j.Rich.figcaption] Balise <figcaption> preservee en mode RICH_HTML');
        assert(result.includes('colspan'), '[5k.Rich.colspan] Attribut colspan preserve en mode RICH_HTML');
        assert(result.includes('width="300"'), '[5l.Rich.width] Attribut width preserve en mode RICH_HTML');
    } catch (e) {
        assert(false, '[5.Rich] Echec test profil RICH_HTML', { erreur: e.message });
    }

    // --- Performance sanitisation ---
    try {
        const htmlLong = '<p>' + 'Lorem ipsum dolor sit amet. '.repeat(100) + '</p><script>alert("xss")</script>';
        const t0 = performance.now();
        for (let i = 0; i < 100; i++) {
            sanitize(htmlLong);
        }
        recordTiming('DOMPurify', '100 sanitisations (contenu long)', performance.now() - t0);
    } catch (e) {
        // Pas d'assertion, juste la mesure de performance
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 6 : JSPDF & AUTOTABLE — EXPORT PDF
// ============================================================================

async function runStep6_jsPDF() {
    _ctx = { step: 6, stepName: 'jsPDF & AutoTable', file: 'js/export/document-exporter.js', module: 'jsPDF', source: '' };
    console.group('Etape 6 : jsPDF & AutoTable');

    // --- Creation d'un PDF basique ---
    let doc;
    try {
        const t0 = performance.now();
        doc = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        recordTiming('jsPDF', 'Instanciation jsPDF', performance.now() - t0);

        assert(doc !== null && doc !== undefined, '[6a.Create] new jsPDF() cree une instance');
        assert(typeof doc.text === 'function', '[6b.TextFn] doc.text est une fonction');
        assert(typeof doc.save === 'function', '[6c.SaveFn] doc.save est une fonction');
        assert(typeof doc.output === 'function', '[6d.OutputFn] doc.output est une fonction');
        assert(typeof doc.addImage === 'function', '[6e.AddImageFn] doc.addImage est une fonction');
    } catch (e) {
        assert(false, '[6.Create] Echec instanciation jsPDF', { erreur: e.message });
        console.groupEnd();
        return;
    }

    // --- Ajout de texte ---
    try {
        doc.text('Titre du document Caramel', 20, 20);
        doc.text('Contenu avec accents : éèêë àâ ùû çç', 20, 30);
        assert(true, '[6f.Text] Ajout de texte avec accents reussi');
    } catch (e) {
        assert(false, '[6f.Text] Echec ajout de texte', { erreur: e.message });
    }

    // --- AutoTable ---
    try {
        assert(typeof doc.autoTable === 'function', '[6g.AutoTableFn] doc.autoTable est une fonction (plugin charge)');

        const t0 = performance.now();
        doc.autoTable({
            head: [['Question', 'Reponse', 'Score']],
            body: [
                ['Quelle est la capitale ?', 'Paris', '10/10'],
                ['2 + 2 = ?', '4', '5/5'],
                ['Couleur du ciel ?', 'Bleu', '3/5']
            ],
            startY: 40,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 10 }
        });
        recordTiming('jsPDF', 'autoTable (3 lignes)', performance.now() - t0);

        assert(doc.lastAutoTable !== undefined, '[6h.LastAutoTable] doc.lastAutoTable est defini');
        assert(typeof doc.lastAutoTable.finalY === 'number', '[6i.FinalY] doc.lastAutoTable.finalY est un nombre', {
            finalY: doc.lastAutoTable.finalY
        });
        assert(doc.lastAutoTable.finalY > 40, '[6j.FinalYValue] finalY > startY (40)', {
            finalY: doc.lastAutoTable.finalY
        });
    } catch (e) {
        assert(false, '[6.AutoTable] Echec autoTable', { erreur: e.message });
    }

    // --- Generation du blob ---
    try {
        const t0 = performance.now();
        const blob = doc.output('blob');
        recordTiming('jsPDF', 'Generation blob PDF', performance.now() - t0);

        assert(blob instanceof Blob, '[6k.Blob] doc.output("blob") retourne un Blob');
        assert(blob.size > 0, '[6l.BlobSize] Le PDF genere a une taille > 0', { taille: blob.size });

        // Verifier le magic number PDF (%PDF)
        const header = await blob.slice(0, 5).text();
        assert(header.startsWith('%PDF'), '[6m.MagicNumber] Le blob commence par %PDF', { header });
    } catch (e) {
        assert(false, '[6.Blob] Echec generation blob PDF', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 7 : DOCX — EXPORT DOCX
// ============================================================================

async function runStep7_Docx() {
    _ctx = { step: 7, stepName: 'docx', file: 'js/export/document-exporter.js', module: 'docx', source: '' };
    console.group('Etape 7 : docx');

    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, PageBreak, convertMillimetersToTwip } = window.docx;

    // --- Verification des exports ---
    try {
        assert(typeof Document === 'function', '[7a.Document] docx.Document est un constructeur');
        assert(typeof Paragraph === 'function', '[7b.Paragraph] docx.Paragraph est un constructeur');
        assert(typeof TextRun === 'function', '[7c.TextRun] docx.TextRun est un constructeur');
        assert(HeadingLevel !== undefined, '[7d.HeadingLevel] docx.HeadingLevel est defini');
        assert(AlignmentType !== undefined, '[7e.AlignmentType] docx.AlignmentType est defini');
        assert(typeof Packer?.toBlob === 'function', '[7f.Packer] docx.Packer.toBlob est une fonction');
        assert(typeof PageBreak === 'function', '[7g.PageBreak] docx.PageBreak est un constructeur');
        assert(typeof convertMillimetersToTwip === 'function', '[7h.ConvertMm] docx.convertMillimetersToTwip est une fonction');
    } catch (e) {
        assert(false, '[7.Exports] Echec verification des exports docx', { erreur: e.message });
    }

    // --- Creation d'un document complet ---
    try {
        const t0 = performance.now();
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: 'Document de test Caramel',
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Texte en gras', bold: true }),
                            new TextRun({ text: ' et en ' }),
                            new TextRun({ text: 'italique', italics: true }),
                            new TextRun({ text: ' avec des accents : éèêë àâ ùû.' })
                        ],
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        text: 'Liste a puces :',
                        bullet: { level: 0 }
                    }),
                    new Paragraph({
                        children: [new PageBreak()]
                    }),
                    new Paragraph({
                        text: 'Page 2'
                    })
                ]
            }]
        });
        recordTiming('docx', 'Creation document (5 paragraphes)', performance.now() - t0);
        assert(doc !== null, '[7i.Create] Document cree avec succes');

        // --- Generation du blob ---
        const t1 = performance.now();
        const blob = await Packer.toBlob(doc);
        recordTiming('docx', 'Packer.toBlob()', performance.now() - t1);

        assert(blob instanceof Blob, '[7j.Blob] Packer.toBlob() retourne un Blob');
        assert(blob.size > 0, '[7k.BlobSize] Le DOCX genere a une taille > 0', { taille: blob.size });

        // Verifier le magic number ZIP (PK = 0x50 0x4b) car DOCX est un ZIP
        const headerBytes = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
        assert(headerBytes[0] === 0x50 && headerBytes[1] === 0x4b, '[7l.MagicNumber] Le blob commence par PK (magic number ZIP)', {
            octet0: '0x' + headerBytes[0]?.toString(16),
            octet1: '0x' + headerBytes[1]?.toString(16)
        });
    } catch (e) {
        assert(false, '[7.Create] Echec creation document DOCX', { erreur: e.message, stack: e.stack });
    }

    // --- convertMillimetersToTwip ---
    try {
        const twips = convertMillimetersToTwip(25.4); // 1 pouce = 25.4mm = 1440 twips
        assert(typeof twips === 'number', '[7m.Twip] convertMillimetersToTwip retourne un nombre');
        assert(twips > 0, '[7n.TwipValue] La conversion 25.4mm donne un resultat > 0', { twips });
    } catch (e) {
        assert(false, '[7.Twip] Echec convertMillimetersToTwip', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// ETAPE 8 : MATHJAX — RENDU LATEX
// ============================================================================

async function runStep8_MathJax() {
    _ctx = { step: 8, stepName: 'MathJax', file: 'js/renderers/math-renderer.js', module: 'MathJax', source: '' };
    console.group('Etape 8 : MathJax');

    // --- Rendu d'une formule via typesetPromise ---
    try {
        // Creer un element temporaire avec une formule LaTeX
        const container = document.createElement('div');
        container.innerHTML = '\\(E = mc^2\\)';
        document.body.appendChild(container);

        const t0 = performance.now();
        await window.MathJax.typesetPromise([container]);
        recordTiming('MathJax', 'typesetPromise (E=mc²)', performance.now() - t0);

        // Verifier que MathJax a genere du SVG
        const svg = container.querySelector('svg');
        assert(svg !== null, '[8a.SVG] MathJax genere un element SVG pour E=mc²');

        if (svg) {
            assert(svg.innerHTML.length > 0, '[8b.SVGContent] Le SVG a du contenu');
        }

        // Nettoyer
        document.body.removeChild(container);
    } catch (e) {
        assert(false, '[8.Typeset] Echec MathJax.typesetPromise', { erreur: e.message });
    }

    // --- Formule complexe ---
    try {
        const container = document.createElement('div');
        container.innerHTML = '$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$';
        document.body.appendChild(container);

        const t0 = performance.now();
        await window.MathJax.typesetPromise([container]);
        recordTiming('MathJax', 'typesetPromise (integrale complexe)', performance.now() - t0);

        const svg = container.querySelector('svg');
        assert(svg !== null, '[8c.Complex] MathJax rend une formule complexe (integrale)');

        document.body.removeChild(container);
    } catch (e) {
        assert(false, '[8.Complex] Echec rendu formule complexe', { erreur: e.message });
    }

    // --- typesetClear (ne doit pas lever d'erreur) ---
    try {
        window.MathJax.typesetClear();
        assert(true, '[8d.Clear] MathJax.typesetClear() ne leve pas d\'erreur');
    } catch (e) {
        assert(false, '[8d.Clear] MathJax.typesetClear() a leve une erreur', { erreur: e.message });
    }

    // --- Verification que tex2svg existe (utilise parfois directement) ---
    try {
        const hasTex2Svg = typeof window.MathJax.tex2svg === 'function';
        // tex2svg n'est pas toujours disponible selon la config, on verifie juste la presence
        if (hasTex2Svg) {
            const t0 = performance.now();
            const node = window.MathJax.tex2svg('x^2 + y^2 = r^2');
            recordTiming('MathJax', 'tex2svg (equation cercle)', performance.now() - t0);
            assert(node !== null, '[8e.tex2svg] MathJax.tex2svg() retourne un noeud DOM');
        } else {
            // Ce n'est pas un echec, tex2svg peut ne pas etre dans la config
            assert(true, '[8e.tex2svg] MathJax.tex2svg non disponible (utilisation via typesetPromise)');
        }
    } catch (e) {
        assert(false, '[8e.tex2svg] Erreur avec MathJax.tex2svg', { erreur: e.message });
    }

    console.groupEnd();
}

// ============================================================================
// EXECUTION PRINCIPALE
// ============================================================================

export async function runAllTests() {
    // Reinitialisation
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    const t0 = performance.now();

    await runStep1_Chargement();
    await runStep2_JSZip();
    await runStep3_ClientZip();
    await runStep4_MoodlePackaging();
    await runStep5_DOMPurify();
    await runStep6_jsPDF();
    await runStep7_Docx();
    await runStep8_MathJax();

    recordTiming('Global', 'Duree totale des tests', performance.now() - t0);

    console.log(`\n=== RESULTATS : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===\n`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
