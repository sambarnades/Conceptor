/**
 * Tests de non-régression du GLISSER-DÉPOSER de la zone « Joindre des documents »
 * (mode avancé — js/services/ocr.js).
 *
 * Quatre défauts réels sont verrouillés ici :
 *
 *  1. `dragenter` n'était pas annulé (`preventDefault`). La spec HTML impose
 *     d'annuler dragenter ET dragover pour devenir une cible de dépôt : Chrome
 *     tolère l'oubli, Safari et Firefox refusent le dépôt.
 *  2. La détection de format ne regardait QUE le type MIME et l'extension. Or
 *     `File.type` est dérivé de l'extension par le navigateur, jamais du
 *     contenu : un PDF déposé sans extension (ou renommé, ou glissé depuis une
 *     source qui n'annonce aucun type) déclenchait un « Format non supporté »
 *     IMMÉDIAT — alors que le même fichier passait par le sélecteur de fichiers.
 *  3. Seul `dataTransfer.files[0]` était lu : les autres fichiers d'un dépôt
 *     multiple étaient perdus en silence, un dépôt qui ne renseigne que
 *     `dataTransfer.items` ne faisait rien du tout, et un DOSSIER produisait le
 *     message trompeur « format non supporté ».
 *  4. Le bouton « Parcourir » ne prenait que le premier fichier choisi.
 *
 * Usage : suite `ocr-dropzone` de tests/test-all.html (iframe sur index.html).
 */

import { sniffFileType, detectFileTypeAsync, readDroppedFiles } from '../js/services/ocr.js';
import { loadJSZip } from '../js/core/lib-loader.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];

let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message, diagnostic || '');
    } else {
        passCount++;
    }
    results.push(entry);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Octets d'un texte ASCII (pour fabriquer des en-têtes de fichiers). */
const octets = (texte) => new Uint8Array(Array.from(texte, c => c.charCodeAt(0)));

/** Fichier factice : contenu binaire + nom + type MIME (souvent vide en glisser-déposer). */
function fichier(contenu, nom, type = '') {
    return new File([contenu], nom, type ? { type } : {});
}

/**
 * Même chose, mais dans le REALM de l'iframe : un File fabriqué par la page de
 * test n'est pas toujours accepté par un DataTransfer de l'iframe.
 */
function fichierDans(win, contenu, nom, type = '') {
    return new win.File([contenu], nom, type ? { type } : {});
}

/** En-tête PDF minimal (les 4 octets de signature suffisent à la détection). */
const ENTETE_PDF = octets('%PDF-1.7');

/** Titres des notifications actuellement listées dans la page hôte. */
function titresNotifications(doc) {
    return Array.from(doc.querySelectorAll('.notification-item__title')).map(el => el.textContent.trim());
}

/** Vide le centre de notifications entre deux scénarios. */
function purgerNotifications(doc) {
    doc.querySelectorAll('.notification-item__close').forEach(btn => btn.click());
    doc.querySelectorAll('.notification-toast').forEach(el => el.remove());
}

/** Un message de refus de format, quelle que soit la locale chargée. */
const estRefusDeFormat = (titre) => /^Format non support/.test(titre);

/** DataTransfer factice : `items` n'est pas fabricable autrement (dossiers, sources exotiques). */
function fauxDataTransfer({ items = [], files = [] } = {}) {
    return { items, files };
}

/** Entrée `items` de type fichier. */
function itemFichier(file) {
    return { kind: 'file', getAsFile: () => file, webkitGetAsEntry: () => ({ isDirectory: false, isFile: true }) };
}

/** Entrée `items` de type DOSSIER (ce que produit le dépôt d'un répertoire). */
function itemDossier(nom = 'Mes documents') {
    // Un dossier déposé arrive aussi comme un File de type vide : seul
    // webkitGetAsEntry() permet de le distinguer d'un vrai fichier.
    return {
        kind: 'file',
        getAsFile: () => new File([], nom),
        webkitGetAsEntry: () => ({ isDirectory: true, isFile: false })
    };
}

/**
 * Dépose un événement `drop` sur la zone, avec un dataTransfer imposé.
 * `dataTransfer` étant en lecture seule sur DragEvent, on l'ombre par une
 * propriété propre — le gestionnaire lit exactement le même objet.
 */
function deposer(win, zone, dataTransfer) {
    const ev = new win.DragEvent('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer });
    zone.dispatchEvent(ev);
    return ev;
}

// =======================================================================
// ETAPE 1 : DETECTION PAR SIGNATURE BINAIRE
// =======================================================================

async function runStep1_Signatures() {
    console.group('Etape 1 : Detection par signature');
    _ctx = { step: 1, stepName: 'Signatures' };

    assert(sniffFileType(ENTETE_PDF) === 'pdf', '[1a] %PDF reconnu comme PDF');
    assert(sniffFileType(new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D])) === 'image', '[1b] PNG reconnu comme image');
    assert(sniffFileType(new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])) === 'image', '[1c] JPEG reconnu comme image');
    assert(sniffFileType(octets('ID3')) === 'audio', '[1d] MP3 (ID3) reconnu comme audio');
    assert(sniffFileType(octets('du texte ordinaire')) === null, '[1e] Contenu quelconque : aucune signature');
    assert(sniffFileType(new Uint8Array(0)) === null, '[1f] Fichier vide : aucune signature');

    // Le défaut d'origine : PDF sans extension et sans type MIME.
    const sansExtension = await detectFileTypeAsync(fichier(ENTETE_PDF, 'document'));
    assert(sansExtension === 'pdf',
        '[1g] PDF SANS extension ni type MIME : detecte via sa signature (regression 6.3.2)',
        { obtenu: sansExtension });

    // Fichier renommé (extension trompeuse, MIME vide) : le contenu tranche.
    const renomme = await detectFileTypeAsync(fichier(ENTETE_PDF, 'notes.sauvegarde'));
    assert(renomme === 'pdf', '[1h] PDF renomme : detecte via sa signature', { obtenu: renomme });

    // Voie rapide inchangée : MIME puis extension, sans lire le contenu.
    const parMime = await detectFileTypeAsync(fichier(ENTETE_PDF, 'cours.pdf', 'application/pdf'));
    assert(parMime === 'pdf', '[1i] PDF nomme et type : detecte sans lecture binaire');
    const parExtension = await detectFileTypeAsync(fichier(octets('nimporte quoi'), 'cours.pdf'));
    assert(parExtension === 'pdf', '[1j] Extension .pdf : detection conservee meme sans signature');

    // Ce qui n'est pas supporté doit continuer à être refusé.
    const refuse = await detectFileTypeAsync(fichier(octets('Rapport annuel'), 'notes.bin', 'application/octet-stream'));
    assert(refuse === null, '[1k] Format non supporte : toujours refuse', { obtenu: refuse });

    // Texte brut : reconnu par son type MIME comme par son extension.
    const txtMime = await detectFileTypeAsync(fichier(octets('Cours de 3e'), 'cours.txt', 'text/plain'));
    assert(txtMime === 'text', '[1l] .txt (type text/plain) : reconnu comme texte brut', { obtenu: txtMime });
    const txtExt = await detectFileTypeAsync(fichier(octets('Cours de 3e'), 'cours.txt'));
    assert(txtExt === 'text', '[1m] .txt sans type MIME : reconnu par son extension', { obtenu: txtExt });
    // Un texte SANS extension reste refusé : le texte brut n'a aucune signature
    // binaire, et accepter tout contenu lisible reviendrait à n'avoir plus de
    // filtre du tout.
    const txtSansNom = await detectFileTypeAsync(fichier(octets('Cours de 3e'), 'cours'));
    assert(txtSansNom === null, '[1n] Texte sans extension : refuse (aucune signature possible)',
        { obtenu: txtSansNom });

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : LECTURE DU CONTENU D'UN DEPOT
// =======================================================================

function runStep2_LectureDepot() {
    console.group('Etape 2 : Lecture du depot');
    _ctx = { step: 2, stepName: 'Lecture depot' };

    const vide = readDroppedFiles(null);
    assert(vide.fichiers.length === 0 && vide.dossiers === 0,
        '[2a] dataTransfer absent : resultat vide, aucune exception');

    // Dépôt normal : deux fichiers, les DEUX sont retenus (avant : seul le premier).
    const a = fichier(ENTETE_PDF, 'un.pdf', 'application/pdf');
    const b = fichier(ENTETE_PDF, 'deux.pdf', 'application/pdf');
    const multiple = readDroppedFiles(fauxDataTransfer({ items: [itemFichier(a), itemFichier(b)], files: [a, b] }));
    assert(multiple.fichiers.length === 2, '[2b] Depot multiple : les 2 fichiers sont retenus',
        { obtenu: multiple.fichiers.length });

    // Source qui ne renseigne QUE dataTransfer.files (pas d'items exploitables).
    const sansItems = readDroppedFiles(fauxDataTransfer({ items: [], files: [a] }));
    assert(sansItems.fichiers.length === 1, '[2c] Repli sur dataTransfer.files quand items est vide');

    // Source qui ne renseigne QUE items (files vide) : Safari, fichiers « promis ».
    const sansFiles = readDroppedFiles(fauxDataTransfer({ items: [itemFichier(a)], files: [] }));
    assert(sansFiles.fichiers.length === 1, '[2d] Lecture via items quand dataTransfer.files est vide');

    // Dossier : compté à part, jamais transmis à l'extracteur.
    const dossier = readDroppedFiles(fauxDataTransfer({
        items: [itemDossier()], files: [new File([], 'Mes documents')]
    }));
    assert(dossier.dossiers === 1 && dossier.fichiers.length === 0,
        '[2e] Dossier depose : compte comme dossier, aucun fichier transmis',
        { dossiers: dossier.dossiers, fichiers: dossier.fichiers.length });

    // Lien web glissé depuis un onglet : items de type 'string' uniquement.
    const lien = readDroppedFiles(fauxDataTransfer({ items: [{ kind: 'string', type: 'text/uri-list' }], files: [] }));
    assert(lien.fichiers.length === 0 && lien.dossiers === 0, '[2f] Lien web glisse : aucun fichier, aucun dossier');

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : CABLAGE DE LA ZONE DANS index.html
// =======================================================================

async function runStep3_Cablage(doc, win) {
    console.group('Etape 3 : Cablage de la zone de depot');
    _ctx = { step: 3, stepName: 'Cablage' };

    const zone = doc.querySelector('.drag-drop-area');
    assert(!!zone, '[3a] Zone .drag-drop-area presente dans index.html');
    if (!zone) { console.groupEnd(); return; }

    // --- Cible de dépôt valide : dragenter ET dragover doivent être annulés ---
    const dragenter = new win.DragEvent('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragenter, 'dataTransfer', { value: fauxDataTransfer() });
    zone.dispatchEvent(dragenter);
    assert(dragenter.defaultPrevented,
        '[3b] dragenter est annule (sans quoi Safari/Firefox refusent le depot) — regression 6.3.2');
    assert(zone.classList.contains('drag-over'), '[3c] dragenter active le retour visuel .drag-over');

    const dragover = new win.DragEvent('dragover', { bubbles: true, cancelable: true });
    const dt = fauxDataTransfer();
    Object.defineProperty(dragover, 'dataTransfer', { value: dt });
    zone.dispatchEvent(dragover);
    assert(dragover.defaultPrevented, '[3d] dragover est annule');
    assert(dt.dropEffect === 'copy', '[3e] dropEffect = copy (curseur « copier » du systeme)',
        { obtenu: dt.dropEffect });

    // --- Dépôt sans aucun fichier : message explicite, plus de silence ---
    purgerNotifications(doc);
    deposer(win, zone, fauxDataTransfer({ items: [{ kind: 'string', type: 'text/uri-list' }], files: [] }));
    await wait(250);
    let titres = titresNotifications(doc);
    assert(titres.some(t => t.startsWith('Aucun fichier')),
        '[3f] Depot sans fichier : message « Aucun fichier… » (avant : rien ne se passait)',
        { notifications: titres });
    assert(!zone.classList.contains('drag-over'), '[3g] Le retour visuel est retire apres le depot');

    // --- Dépôt d'un dossier : message dédié, pas « format non supporté » ---
    purgerNotifications(doc);
    deposer(win, zone, fauxDataTransfer({ items: [itemDossier()], files: [] }));
    await wait(250);
    titres = titresNotifications(doc);
    assert(titres.some(t => t.startsWith('Un dossier')),
        '[3h] Depot d\'un dossier : message dedie', { notifications: titres });
    assert(!titres.some(estRefusDeFormat),
        '[3i] Depot d\'un dossier : pas de message « format non supporte » trompeur',
        { notifications: titres });

    // --- Dépôt multiple : CHAQUE fichier passe dans la file d'attente ---
    // Deux fichiers non supportés : deux refus, donc deux traitements réels,
    // sans déclencher d'extraction lourde (OCR, transcription).
    purgerNotifications(doc);
    const t1 = fichierDans(win, octets('un'), 'un.bin', 'application/octet-stream');
    const t2 = fichierDans(win, octets('deux'), 'deux.bin', 'application/octet-stream');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(t1), itemFichier(t2)], files: [t1, t2] }));
    await wait(600);
    titres = titresNotifications(doc);
    assert(titres.filter(estRefusDeFormat).length === 2,
        '[3j] Depot de 2 fichiers : les 2 traverses la file (avant : seul le premier)',
        { notifications: titres });

    purgerNotifications(doc);
    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : BOUTON « PARCOURIR » (input file)
// =======================================================================

async function runStep4_SelecteurFichiers(doc, win) {
    console.group('Etape 4 : Selecteur de fichiers');
    _ctx = { step: 4, stepName: 'Parcourir' };

    const input = doc.getElementById('pdfUpload');
    assert(!!input, '[4a] Champ #pdfUpload present');
    if (!input) { console.groupEnd(); return; }

    assert(input.multiple, '[4b] #pdfUpload accepte plusieurs fichiers (attribut multiple)');

    // Alimenter un input file demande un DataTransfer RÉEL (celui du navigateur).
    purgerNotifications(doc);
    const transfert = new win.DataTransfer();
    transfert.items.add(fichierDans(win, octets('un'), 'un.bin', 'application/octet-stream'));
    transfert.items.add(fichierDans(win, octets('deux'), 'deux.bin', 'application/octet-stream'));
    input.files = transfert.files;
    input.dispatchEvent(new win.Event('change', { bubbles: true }));
    await wait(600);

    const titres = titresNotifications(doc);
    assert(titres.filter(estRefusDeFormat).length === 2,
        '[4c] Parcourir : les 2 fichiers choisis sont traites (avant : seul le premier)',
        { notifications: titres });
    assert(input.value === '',
        '[4d] La valeur du champ est reinitialisee (re-choisir le meme fichier reste possible)');

    purgerNotifications(doc);
    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : TEXTE BRUT (.txt), DE BOUT EN BOUT
// =======================================================================

async function runStep5_TexteBrut(doc, win) {
    console.group('Etape 5 : Texte brut');
    _ctx = { step: 5, stepName: 'Texte brut' };

    const zone = doc.querySelector('.drag-drop-area');
    if (!zone) { console.groupEnd(); return; }

    /** Contenu du corpus (zone contenteditable alimentee par les fichiers). */
    const corpus = () => (doc.getElementById('ocr-output') || {}).textContent || '';
    /** Noms des etiquettes de fichiers deja ajoutees. */
    const etiquettes = () => Array.from(doc.querySelectorAll('.pdf-tag .filename'))
        .map(el => el.getAttribute('title'));

    // --- UTF-8 : le cas courant ---
    purgerNotifications(doc);
    const utf8 = fichierDans(win, new TextEncoder().encode('Les rivieres du Massif central : l\'Allier.'),
        'geographie.txt', 'text/plain');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(utf8)], files: [utf8] }));
    await wait(600);
    assert(etiquettes().includes('geographie.txt'),
        '[5a] Un .txt depose est ajoute au corpus', { etiquettes: etiquettes() });
    assert(corpus().includes('Les rivieres du Massif central'),
        '[5b] Le contenu du .txt se retrouve dans le corpus', { corpus: corpus().slice(0, 120) });

    // --- Windows-1252 : un .txt ne declare pas son encodage ---
    // « Notes de l'eleve » avec e-aigu (0xE9) et e-grave (0xE8) en Windows-1252 :
    // ces octets sont de l'UTF-8 INVALIDE. Sans le repli, TextDecoder les
    // remplacerait par le caractere de substitution.
    const cp1252 = new Uint8Array([
        0x4E, 0x6F, 0x74, 0x65, 0x73, 0x20, 0x64, 0x65, 0x20, 0x6C, 0x27,
        0xE9, 0x6C, 0xE8, 0x76, 0x65   // e' l e` v e
    ]);
    const legacy = fichierDans(win, cp1252, 'notes-windows.txt', 'text/plain');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(legacy)], files: [legacy] }));
    await wait(600);
    assert(corpus().includes('\u00e9l\u00e8ve'),
        '[5c] .txt encode en Windows-1252 : accents restitues (repli d\'encodage)',
        { corpus: corpus().slice(-80) });
    assert(!corpus().includes('\uFFFD'),
        '[5d] Aucun caractere de substitution dans le corpus', { corpus: corpus().slice(-80) });

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : TABLEURS ET ARCHIVES (formats acceptes SILENCIEUSEMENT)
// =======================================================================

/** Classeur XLSX minimal mais STRUCTURELLEMENT reel (chaines partagees + relations). */
async function fabriquerXlsx(JSZip) {
    const zip = new JSZip();
    zip.file('[Content_Types].xml',
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    zip.file('xl/workbook.xml',
        '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
        ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Notes" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    // Les cellules texte ne portent qu'un INDICE vers cette table.
    zip.file('xl/sharedStrings.xml',
        '<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<si><t>Eleve</t></si><si><t>Moyenne</t></si><si><t>Camille</t></si></sst>');
    zip.file('xl/worksheets/sheet1.xml',
        '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>14.5</v></c></row>' +
        '</sheetData></worksheet>');
    return zip.generateAsync({ type: 'blob' });
}

/** Classeur ODS minimal, avec une repetition de cellules VIDES en fin de ligne. */
async function fabriquerOds(JSZip) {
    const zip = new JSZip();
    // L'entree « mimetype » doit rester la premiere et NON compressee : c'est
    // elle que la detection par signature lit a l'offset 30.
    zip.file('mimetype', 'application/vnd.oasis.opendocument.spreadsheet', { compression: 'STORE' });
    zip.file('content.xml',
        '<?xml version="1.0"?><office:document-content' +
        ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"' +
        ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"' +
        ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet>' +
        '<table:table table:name="Sorties"><table:table-row>' +
        '<table:table-cell><text:p>Date</text:p></table:table-cell>' +
        '<table:table-cell><text:p>Lieu</text:p></table:table-cell>' +
        '<table:table-cell table:number-columns-repeated="1013"/>' +
        '</table:table-row><table:table-row>' +
        '<table:table-cell><text:p>12 mai</text:p></table:table-cell>' +
        '<table:table-cell><text:p>Musee</text:p></table:table-cell>' +
        '</table:table-row><table:table-row>' +
        '<table:table-cell table:number-columns-repeated="1013"><text:p>Zzz</text:p></table:table-cell>' +
        '</table:table-row></table:table></office:spreadsheet></office:body></office:document-content>');
    return zip.generateAsync({ type: 'blob' });
}

/** Archive contenant deux textes, un fichier ignore et une archive imbriquee. */
async function fabriquerZip(JSZip) {
    const interne = new JSZip();
    interne.file('poupee.txt', 'ne doit pas etre deplie');
    const zip = new JSZip();
    zip.file('cours/lecon.txt', 'La photosynthese transforme la lumiere.');
    zip.file('cours/exercices.txt', 'Exercice 1 : nommer les organites.');
    zip.file('cours/schema.psd', 'format non gere, doit etre ignore');
    zip.file('__MACOSX/._lecon.txt', 'metadonnees macOS');
    zip.file('imbrique.zip', await interne.generateAsync({ type: 'blob' }));
    return zip.generateAsync({ type: 'blob' });
}

async function runStep6_TableursEtArchives(doc, win) {
    console.group('Etape 6 : Tableurs et archives');
    _ctx = { step: 6, stepName: 'Tableurs/ZIP' };

    const zone = doc.querySelector('.drag-drop-area');
    if (!zone) { console.groupEnd(); return; }

    await loadJSZip();
    const JSZip = window.JSZip;
    assert(!!JSZip, '[6a] JSZip disponible pour fabriquer les fixtures');
    if (!JSZip) { console.groupEnd(); return; }

    const corpus = () => (doc.getElementById('ocr-output') || {}).textContent || '';
    const etiquettes = () => Array.from(doc.querySelectorAll('.pdf-tag .filename'))
        .map(el => el.getAttribute('title'));

    // --- Detection : silencieuse, mais bien branchee ---
    const xlsxBlob = await fabriquerXlsx(JSZip);
    const odsBlob = await fabriquerOds(JSZip);
    const zipBlob = await fabriquerZip(JSZip);

    assert(await detectFileTypeAsync(new File([xlsxBlob], 'notes.xlsx')) === 'xlsx',
        '[6b] .xlsx reconnu par son extension');
    assert(await detectFileTypeAsync(new File([odsBlob], 'sorties.ods')) === 'ods',
        '[6c] .ods reconnu par son extension');
    // L'ODS porte son type dans l'archive : il survit meme sans extension.
    assert(await detectFileTypeAsync(new File([odsBlob], 'sorties')) === 'ods',
        '[6d] .ods SANS extension : reconnu par la signature du conteneur ODF');
    assert(await detectFileTypeAsync(new File([zipBlob], 'dossier.zip', { type: 'application/zip' })) === 'zip',
        '[6e] .zip reconnu');

    // --- .xls ancien : refuse, mais avec un message qui dit quoi faire ---
    // Signature d'un conteneur OLE2 (Excel d'avant 2007).
    const ole2 = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00]);
    assert(await detectFileTypeAsync(new File([ole2], 'ancien.xls')) === 'office-ancien',
        '[6f] .xls ancien : identifie comme format Office ancien, pas comme un format lisible');

    purgerNotifications(doc);
    const xls = fichierDans(win, ole2, 'bulletins.xls', 'application/vnd.ms-excel');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(xls)], files: [xls] }));
    await wait(300);
    let titres = titresNotifications(doc);
    assert(titres.some(t => /\.xlsx/.test(t) && /\.ods/.test(t)),
        '[6g] .xls depose : message indiquant de reenregistrer en .xlsx ou .ods',
        { notifications: titres });
    assert(!titres.some(estRefusDeFormat),
        '[6h] .xls depose : pas de « format non supporte » generique', { notifications: titres });

    // --- XLSX de bout en bout : chaines partagees resolues ---
    purgerNotifications(doc);
    const avantXlsx = corpus();
    const xlsx = fichierDans(win, xlsxBlob, 'notes.xlsx');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(xlsx)], files: [xlsx] }));
    await wait(1200);
    const apresXlsx = corpus().slice(avantXlsx.length);
    assert(etiquettes().includes('notes.xlsx'), '[6i] .xlsx ajoute au corpus', { etiquettes: etiquettes() });
    assert(apresXlsx.includes('Eleve') && apresXlsx.includes('Camille'),
        '[6j] .xlsx : les chaines partagees sont resolues (indice -> texte)', { extrait: apresXlsx.slice(0, 120) });
    assert(apresXlsx.includes('14.5'), '[6k] .xlsx : les valeurs numeriques sont conservees',
        { extrait: apresXlsx.slice(0, 120) });

    // --- ODS de bout en bout : repetition de cellules vides non depliee ---
    purgerNotifications(doc);
    const avantOds = corpus();
    const ods = fichierDans(win, odsBlob, 'sorties.ods');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(ods)], files: [ods] }));
    await wait(1200);
    const apresOds = corpus().slice(avantOds.length);
    assert(apresOds.includes('Musee'), '[6l] .ods ajoute au corpus avec son contenu',
        { extrait: apresOds.slice(0, 120) });
    // Une cellule REMPLIE repetee 1013 fois est depliee, mais BORNEE : sans
    // plafond, un tableur ordinaire (16 384 colonnes) noierait le corpus.
    const repetitions = (apresOds.match(/Zzz/g) || []).length;
    assert(repetitions === 50,
        '[6m] .ods : une cellule repetee 1013 fois est bornee a 50 copies',
        { repetitions });
    assert(!/\|\s*\|\s*\|/.test(apresOds.split('\n')[0] || ''),
        '[6n] .ods : les cellules vides repetees en fin de ligne sont elaguees',
        { premiereLigne: (apresOds.split('\n')[0] || '').slice(0, 80) });

    // --- Archive : chaque document interne rejoint la file ---
    purgerNotifications(doc);
    const archive = fichierDans(win, zipBlob, 'dossier.zip', 'application/zip');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(archive)], files: [archive] }));
    await wait(1800);
    const noms = etiquettes();
    assert(noms.includes('dossier.zip › lecon.txt') && noms.includes('dossier.zip › exercices.txt'),
        '[6o] Archive : les 2 documents internes sont ajoutes, prefixes par l\'archive',
        { etiquettes: noms });
    assert(!noms.includes('dossier.zip'),
        '[6p] Archive : elle-meme n\'apparait pas dans le corpus', { etiquettes: noms });
    assert(!noms.some(n => /schema\.psd/.test(n)),
        '[6q] Archive : les formats non geres sont ignores', { etiquettes: noms });
    assert(!noms.some(n => /__MACOSX|\.\_/.test(n)),
        '[6r] Archive : les metadonnees macOS sont ignorees', { etiquettes: noms });
    assert(!noms.some(n => /imbrique|poupee/.test(n)),
        '[6s] Archive imbriquee : NON depliee (garde-fou bombe zip)', { etiquettes: noms });
    assert(corpus().includes('photosynthese'),
        '[6t] Archive : le contenu des documents internes est bien extrait');

    // --- Archive sans rien d'exploitable ---
    purgerNotifications(doc);
    const vide = new JSZip();
    vide.file('notes.psd', 'rien d\'exploitable');
    const archiveVide = fichierDans(win, await vide.generateAsync({ type: 'blob' }), 'vide.zip', 'application/zip');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(archiveVide)], files: [archiveVide] }));
    await wait(900);
    titres = titresNotifications(doc);
    assert(titres.some(t => t.startsWith('Aucun document exploitable')),
        '[6u] Archive sans document exploitable : message dedie', { notifications: titres });

    purgerNotifications(doc);
    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : LE RESTE DES FORMATS SILENCIEUX (texte balise, sous-titres, RTF,
//           EPUB, photos d'iPhone) ET LES REFUS PARLANTS
// =======================================================================

/** EPUB minimal : container.xml -> OPF -> spine, dans un ORDRE inverse de l'alphabet. */
async function fabriquerEpub(JSZip) {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file('META-INF/container.xml',
        '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
        '<rootfiles><rootfile full-path="OEBPS/livre.opf"/></rootfiles></container>');
    // La spine impose zeta AVANT alpha : c'est ce qui distingue une vraie lecture
    // de la spine d'un simple tri alphabetique des fichiers de l'archive.
    zip.file('OEBPS/livre.opf',
        '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest>' +
        '<item id="c2" href="zeta.xhtml"/><item id="c1" href="alpha.xhtml"/></manifest>' +
        '<spine><itemref idref="c2"/><itemref idref="c1"/></spine></package>');
    zip.file('OEBPS/zeta.xhtml', '<html><body><h1>Chapitre premier</h1><p>Le vent se leve.</p></body></html>');
    zip.file('OEBPS/alpha.xhtml', '<html><body><p>Il faut tenter de vivre.</p></body></html>');
    return zip.generateAsync({ type: 'blob' });
}

async function runStep7_AutresFormats(doc, win) {
    console.group('Etape 7 : Autres formats silencieux');
    _ctx = { step: 7, stepName: 'Autres formats' };

    const zone = doc.querySelector('.drag-drop-area');
    if (!zone) { console.groupEnd(); return; }

    const corpus = () => (doc.getElementById('ocr-output') || {}).textContent || '';
    const etiquettes = () => Array.from(doc.querySelectorAll('.pdf-tag .filename'))
        .map(el => el.getAttribute('title'));

    /** Depose un fichier et renvoie ce qu'il a AJOUTE au corpus. */
    const deposerEtLire = async (fichierDepose, attente = 900) => {
        const avant = corpus();
        deposer(win, zone, fauxDataTransfer({ items: [itemFichier(fichierDepose)], files: [fichierDepose] }));
        await wait(attente);
        return corpus().slice(avant.length);
    };

    // --- Detection : tout passe par le chemin texte ou balise ---
    assert(await detectFileTypeAsync(fichier(octets('# Titre'), 'cours.md')) === 'text',
        '[7a] .md : chemin texte');
    assert(await detectFileTypeAsync(fichier(octets('a,b'), 'notes.csv', 'text/csv')) === 'text',
        '[7b] .csv : chemin texte');
    assert(await detectFileTypeAsync(fichier(octets('a\tb'), 'notes.tsv')) === 'text',
        '[7c] .tsv : chemin texte');
    assert(await detectFileTypeAsync(fichier(octets('<p>x</p>'), 'page.html')) === 'html',
        '[7d] .html : chemin balise');
    assert(await detectFileTypeAsync(fichier(octets('1'), 'capsule.srt')) === 'subtitles',
        '[7e] .srt : chemin sous-titres');
    assert(await detectFileTypeAsync(fichier(octets('WEBVTT'), 'capsule.vtt')) === 'subtitles',
        '[7f] .vtt : chemin sous-titres');
    assert(await detectFileTypeAsync(fichier(octets('{\\rtf1}'), 'lettre.rtf')) === 'rtf',
        '[7g] .rtf : chemin RTF');

    // Photos d'iPhone : la MARQUE du conteneur (offset 8) tranche entre image et
    // bande-son — les deux commencent par « ftyp ».
    const heicOctets = new Uint8Array([0, 0, 0, 24, ...octets('ftypheic'), 0, 0, 0, 0]);
    assert(sniffFileType(heicOctets) === 'image',
        '[7h] HEIC sans extension : reconnu comme IMAGE malgre son en-tete « ftyp »',
        { obtenu: sniffFileType(heicOctets) });
    const mp4Octets = new Uint8Array([0, 0, 0, 24, ...octets('ftypisom'), 0, 0, 0, 0]);
    assert(sniffFileType(mp4Octets) === 'audio',
        '[7i] MP4 : toujours reconnu comme bande-son (pas de regression)',
        { obtenu: sniffFileType(mp4Octets) });
    assert(sniffFileType(new Uint8Array([0x49, 0x49, 0x2A, 0x00])) === 'image', '[7j] TIFF reconnu comme image');
    assert(await detectFileTypeAsync(fichier(octets('x'), 'photo.heic')) === 'image', '[7k] .heic : chemin image');

    // --- Refus PARLANTS ---
    // La signature OLE2 est COMMUNE au .doc, .xls et .ppt : le message doit valoir
    // pour les trois (c'etait le defaut du message initial, propre au .xls).
    const ole2 = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0, 0]);
    assert(await detectFileTypeAsync(fichier(ole2, 'rapport.doc')) === 'office-ancien',
        '[7l] .doc ancien : reconnu comme format Office ancien, pas comme un tableur');

    purgerNotifications(doc);
    const vieuxDoc = fichierDans(win, ole2, 'rapport.doc', 'application/msword');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(vieuxDoc)], files: [vieuxDoc] }));
    await wait(300);
    let titres = titresNotifications(doc);
    assert(titres.some(t => /\.docx/.test(t)),
        '[7m] .doc depose : le message cite .docx (et non seulement des tableurs)',
        { notifications: titres });

    purgerNotifications(doc);
    const pages = fichierDans(win, octets('PK'), 'memoire.pages');
    deposer(win, zone, fauxDataTransfer({ items: [itemFichier(pages)], files: [pages] }));
    await wait(300);
    titres = titresNotifications(doc);
    assert(titres.some(t => /Pages/.test(t) && /PDF/.test(t)),
        '[7n] .pages depose : message orientant vers un export', { notifications: titres });

    // --- Bout en bout ---
    purgerNotifications(doc);
    const markdown = await deposerEtLire(
        fichierDans(win, octets('# La Loire\n\nLe plus **long** fleuve de France.'), 'fleuves.md'));
    assert(markdown.includes('La Loire') && markdown.includes('long'),
        '[7o] .md : contenu ajoute au corpus tel quel', { extrait: markdown.slice(0, 100) });

    const html = await deposerEtLire(fichierDans(win, new TextEncoder().encode(
        '<html><head><style>p{color:red}</style><script>var telemetrie=42;<\/script></head><body><h1>Le Rhone</h1>' +
        '<p>Il prend sa source en Suisse&nbsp;&amp; se jette en M&eacute;diterran&eacute;e.</p></body></html>'),
        'rhone.html'));
    assert(html.includes('Le Rhone') && html.includes('Suisse'),
        '[7p] .html : le texte est extrait', { extrait: html.slice(0, 140) });
    assert(!html.includes('<'),
        '[7q] .html : balises retirees', { extrait: html.slice(0, 140) });
    // Retirer la seule BALISE <style> laisserait la feuille de style dans le
    // corpus : c'est le contenu du bloc qui doit partir.
    assert(!html.includes('color:red') && !html.includes('telemetrie'),
        '[7q2] .html : le contenu des blocs <style> et <script> ne pollue pas le corpus',
        { extrait: html.slice(0, 140) });
    assert(html.includes('Méditerranée') && html.includes('&') && !html.includes('&eacute;'),
        '[7r] .html : entites decodees', { extrait: html.slice(0, 160) });

    const srt = await deposerEtLire(fichierDans(win, new TextEncoder().encode(
        '1\n00:00:01,000 --> 00:00:04,000\nLa cellule est l\'unite du vivant.\n\n' +
        '2\n00:00:04,500 --> 00:00:07,000\n<i>Elle contient un noyau.</i>\n'), 'capsule.srt'));
    assert(srt.includes('unite du vivant') && srt.includes('noyau'),
        '[7s] .srt : les repliques sont conservees', { extrait: srt.slice(0, 120) });
    assert(!/-->/.test(srt) && !/00:00:0/.test(srt),
        '[7t] .srt : horodatages et numeros de sequence retires', { extrait: srt.slice(0, 120) });

    const rtf = await deposerEtLire(fichierDans(win, new TextEncoder().encode(
        "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\froman Times New Roman;}}" +
        "{\\colortbl;\\red0\\green0\\blue0;}" +
        "{\\*\\generator Riched20 10.0;}" +
        "\\f0\\fs24 La r\\'e9volution industrielle.\\par Un si\\u232?cle de changements.\\par}"), 'histoire.rtf'));
    assert(rtf.includes('révolution industrielle'),
        '[7u] .rtf : texte extrait, caracteres ANSI echappes decodes', { extrait: rtf.slice(0, 140) });
    assert(rtf.includes('siècle'),
        '[7v] .rtf : caracteres Unicode echappes decodes', { extrait: rtf.slice(0, 140) });
    assert(!/Times New Roman|Riched20|colortbl/.test(rtf),
        '[7w] .rtf : tables de polices/couleurs et groupes ignorables ecartes', { extrait: rtf.slice(0, 200) });

    await loadJSZip();
    const epub = await deposerEtLire(
        fichierDans(win, await fabriquerEpub(window.JSZip), 'roman.epub'), 1400);
    assert(epub.includes('Chapitre premier') && epub.includes('tenter de vivre'),
        '[7x] .epub : les chapitres sont extraits', { extrait: epub.slice(0, 160) });
    assert(epub.indexOf('Chapitre premier') < epub.indexOf('tenter de vivre'),
        '[7y] .epub : ordre de la SPINE respecte (pas l\'ordre alphabetique des fichiers)',
        { extrait: epub.slice(0, 160) });

    assert(etiquettes().filter(n => /\.(md|html|srt|rtf|epub)$/.test(n)).length === 5,
        '[7z] Les 5 documents sont bien dans le corpus', { etiquettes: etiquettes() });

    purgerNotifications(doc);
    console.groupEnd();
}

// =======================================================================
// EXPORTS
// =======================================================================

export const STEP_NAMES = ['', 'Signatures', 'Lecture depot', 'Cablage', 'Parcourir', 'Texte brut', 'Tableurs/ZIP', 'Autres formats'];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie la reconnaissance des formats par signature binaire (magic bytes) : un PDF sans extension, sans type MIME ou renomme doit etre accepte, un fichier non supporte doit rester refuse.',
    'Verifie la lecture d\'un evenement de depot : plusieurs fichiers retenus, repli entre dataTransfer.items et dataTransfer.files, dossiers comptes a part, lien web ignore.',
    'Verifie le cablage de .drag-drop-area dans index.html : dragenter ET dragover annules, dropEffect copy, messages explicites pour un depot vide ou un dossier, traitement de TOUS les fichiers deposes.',
    'Verifie le bouton « Parcourir » : attribut multiple, traitement de tous les fichiers choisis via la meme file d\'attente, reinitialisation de la valeur du champ.',
    'Verifie le support du texte brut (.txt) de bout en bout : le fichier est ajoute au corpus avec son contenu, et un fichier encode en Windows-1252 garde ses accents (repli d\'encodage, aucun caractere de substitution).',
    'Verifie les formats acceptes SILENCIEUSEMENT : .xlsx (chaines partagees resolues), .ods (repetitions de cellules vides non depliees, signature du conteneur ODF), archives .zip (documents internes enfiles et prefixes, formats non geres / metadonnees macOS / archive imbriquee ignores, archive vide signalee) et refus PARLANT du .xls ancien.',
    'Verifie le reste des formats silencieux : .md/.csv/.tsv (chemin texte), .html (balises retirees, entites decodees), sous-titres .srt/.vtt (horodatages retires), .rtf (tables de polices ecartees, echappements ANSI et Unicode decodes), .epub (ordre de la spine), HEIC/TIFF (marque du conteneur distinguee de la bande-son), et les refus parlants .doc/.ppt/.xls et iWork.'
];

/**
 * @param {Document} iframeDoc - Document de l'iframe contenant index.html
 * @param {Window} iframeWindow - Fenetre de cette iframe (constructeurs DragEvent/DataTransfer)
 */
export async function runAllTests(iframeDoc, iframeWindow) {
    console.log('=== Tests glisser-deposer OCR (7 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;

    await runStep1_Signatures();
    runStep2_LectureDepot();
    await runStep3_Cablage(iframeDoc, iframeWindow);
    await runStep4_SelecteurFichiers(iframeDoc, iframeWindow);
    await runStep5_TexteBrut(iframeDoc, iframeWindow);
    await runStep6_TableursEtArchives(iframeDoc, iframeWindow);
    await runStep7_AutresFormats(iframeDoc, iframeWindow);

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);
    return { passCount, failCount, skipCount, results, STEP_NAMES };
}
