/**
 * @file Module d'export de documents DOCX, ODT et PDF.
 * Ce module génère des documents bien formatés à partir du contenu structuré
 * produit par document-formatter.js.
 */

import { formatContentForDocument } from './document-formatter.js';
import { textWithMathToDocxChildren } from './latex-to-omml.js';
import { parseLatex, containsLatex, splitTextAndMath } from './latex-parser.js';
import { latexToMathML } from './latex-to-mathml.js';
import { getStarMath, getSymbolMlType, BLACKBOARD, ACCENTS as ACCENT_CATALOG } from './math-catalog.js';
import { translations, currentLang, t } from '../core/translation.js';
import { debugLog } from '../core/utils.js';
import { loadDocumentExportLibs, loadPDFFonts } from '../core/lib-loader.js';
import { convertToPdfViaGotenberg } from './pdf-via-gotenberg.js';
import {
    fetchImageAsDataURL,
    calculateDimensions,
    DOCX_FIXED_HEIGHT,
    PDF_FIXED_HEIGHT,
    ODT_FIXED_HEIGHT,
    MAX_WIDTH_DOCX,
    MAX_WIDTH_PDF,
    MAX_WIDTH_ODT
} from '../renderers/image-utils.js';
import { generateQRDataURL } from '../renderers/qr-utils.js';

/**
 * Configuration pour l'export des cartes imprimables (Flashcards/Dialog Cards)
 * Page A4 Portrait avec tableaux 2x4 pour impression recto-verso
 */
const FLASHCARD_CONFIG = {
    // Page A4 (mm)
    pageWidth: 210,
    pageHeight: 297,
    margins: 12.7,  // 1,27 cm

    // Tableau
    columns: 2,
    rows: 4,
    columnWidth: 92,   // mm (9,2 cm)
    rowHeight: 55,     // mm (5,5 cm) - Réduit pour laisser place à l'en-tête/pied de page

    // DOCX (twips: 1mm = 56.7 twips, 1cm = 567 twips)
    columnWidthTwips: 5220,  // 92mm * 56.7
    rowHeightTwips: 3119,    // 55mm * 56.7
    marginsTwips: 720,       // 12.7mm * 56.7

    // PDF (mm)
    pdfMargin: 12.7,
    pdfColumnWidth: 92,
    pdfRowHeight: 55,

    // Images dans les cellules (mm) — zone fixe pour alignement recto/verso
    imageMaxWidth: 75,   // mm (dans cellule de 92mm, avec marges de 6mm + padding)
    imageMaxHeight: 25,  // mm (dans cellule de 55mm, laisse place au texte)
    imageMaxWidthTwips: 4252,   // 75mm * 56.7
    imageMaxHeightTwips: 1418   // 25mm * 56.7
};

/** Correspondance langue Caramel → locale pour les exports documentaires */
const LANG_TO_LOCALE = {
    fr: { language: 'fr', country: 'FR', bcp47: 'fr-FR' },
    en: { language: 'en', country: 'GB', bcp47: 'en-GB' },
    es: { language: 'es', country: 'ES', bcp47: 'es-ES' },
    de: { language: 'de', country: 'DE', bcp47: 'de-DE' },
    it: { language: 'it', country: 'IT', bcp47: 'it-IT' },
    nl: { language: 'nl', country: 'NL', bcp47: 'nl-NL' },
    pt: { language: 'pt', country: 'PT', bcp47: 'pt-PT' },
    ar: { language: 'ar', country: 'SA', bcp47: 'ar-SA' },
    zh: { language: 'zh', country: 'CN', bcp47: 'zh-CN' },
    jp: { language: 'ja', country: 'JP', bcp47: 'ja-JP' },
    el: { language: 'el', country: 'GR', bcp47: 'el-GR' }
};

/** Nom de la police utilisée pour le PDF (Liberation Sans, métriquement identique à Arial) */
const PDF_FONT = 'LiberationSans';

/**
 * Charge les bibliothèques nécessaires pour l'export
 */
async function loadLibraries() {
    // Utilise le système centralisé de lib-loader (inclut désormais jspdf, docx et JSZip)
    await loadDocumentExportLibs();
}

/**
 * Télécharge et prépare toutes les images présentes dans le contenu
 * @param {Object} formattedContent - Le contenu formaté par document-formatter
 */
async function prepareImages(formattedContent) {
    if (!formattedContent.sections) return;

    const promises = [];

    // 0. Sections QR (vidéo interactive) : génère le PNG du QR depuis le texte/URL avant
    //    de le traiter comme une image autonome. La section porte `qrText` (pas `url`) → elle
    //    n'est pas captée par la passe 1 ci-dessous tant que l'imageData n'est pas posée.
    formattedContent.sections
        .filter(section => section.type === 'image' && section.qrText && !section.imageData)
        .forEach(section => {
            promises.push(
                generateQRDataURL(section.qrText)
                    .then(dataURL => {
                        if (!dataURL) { section.imageError = true; section.errorText = section.qrText; return; }
                        return prepareImageData(dataURL).then(result => {
                            if (result.error) { section.imageError = true; section.errorText = result.errorText; }
                            else { section.imageData = result; }
                        });
                    })
                    .catch(() => { section.imageError = true; section.errorText = section.qrText; })
            );
        });

    // 1. Images autonomes (sections de type 'image')
    formattedContent.sections
        .filter(section => section.type === 'image' && section.url)
        .forEach(section => {
            promises.push(prepareImageData(section.url).then(result => {
                if (result.error) {
                    section.imageError = true;
                    section.errorText = result.errorText;
                } else {
                    section.imageData = result;
                }
            }));
        });

    // 2. Images dans les cellules de flashcardTable
    formattedContent.sections
        .filter(section => section.type === 'flashcardTable' && section.rows)
        .forEach(section => {
            section.rows.forEach(row => {
                [row.left, row.right].forEach(card => {
                    if (card && card.imageUrl) {
                        promises.push(prepareImageData(card.imageUrl).then(result => {
                            if (result.error) {
                                card.imageData = null;
                            } else {
                                card.imageData = result;
                            }
                        }));
                    }
                });
            });
        });

    // 3. Images dans les cellules de tables génériques (ex: étiquettes D&D)
    formattedContent.sections
        .filter(section => section.type === 'table' && section.rows)
        .forEach(section => {
            section.rows.forEach(row => {
                row.forEach(cell => {
                    if (cell && typeof cell === 'object' && cell.imageUrl) {
                        promises.push(prepareImageData(cell.imageUrl).then(result => {
                            if (result.error) {
                                cell.imageData = null;
                            } else {
                                cell.imageData = result;
                            }
                        }));
                    }
                });
            });
        });

    await Promise.all(promises);
}

/**
 * Formats d'image embarquables TELS QUELS par docx (extension du média dans le .docx).
 * docx ≥ 8.6 exige un `type` explicite sur `ImageRun` : sans lui l'extension du média
 * devient « .undefined » → aucun content-type déclaré → Word signale un « contenu
 * illisible » et propose de réparer à l'ouverture. Tout autre format (WebP, AVIF, SVG…)
 * doit être rastérisé en PNG (cf. ensureDocxCompatibleImage).
 */
const DOCX_IMAGE_TYPE_BY_MIME = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
    'image/gif': 'gif', 'image/bmp': 'bmp'
};

/** MIME → type docx ('png'|'jpg'|'gif'|'bmp'), ou null si non embarquable tel quel. */
function docxImageType(mimeType) {
    return DOCX_IMAGE_TYPE_BY_MIME[String(mimeType || '').toLowerCase().split(';')[0].trim()] || null;
}

/**
 * Garantit qu'une image préparée est dans un format embarquable par docx/ODT et pose
 * `imageData.docxType`. Les formats non pris en charge (WebP, AVIF, SVG rastérisé, MIME
 * inconnu) sont re-encodés en PNG via canvas — comme le fait déjà le flux « Image
 * interactive » pour tous ses médias. Sans effet (hors pose de `docxType`) pour
 * PNG/JPEG/GIF/BMP. Les résultats en erreur sont laissés inchangés.
 * @param {Object} imageData - sortie de resolveImageData.
 * @returns {Promise<Object>} imageData avec `docxType` valide.
 */
async function ensureDocxCompatibleImage(imageData) {
    if (!imageData || imageData.error) return imageData;
    const nativeType = docxImageType(imageData.mimeType);
    if (nativeType) { imageData.docxType = nativeType; return imageData; }
    // Format non natif → rastérisation PNG (canvas) pour un embed valide.
    try {
        if (!imageData.dataURL) throw new Error('pas de dataURL à convertir');
        const blob = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = imageData.width || im.naturalWidth || 1;
                canvas.height = imageData.height || im.naturalHeight || 1;
                canvas.getContext('2d').drawImage(im, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png');
            };
            im.onerror = () => reject(new Error('image illisible'));
            im.src = imageData.dataURL;
        });
        imageData.blob = blob;
        imageData.dataURL = await blobToDataURL(blob);
        imageData.mimeType = 'image/png';
        imageData.docxType = 'png';
    } catch (e) {
        debugLog('export', `conversion PNG impossible (${imageData.mimeType}), fallback type png:`, e);
        imageData.docxType = 'png'; // dernier recours : au moins une extension déclarée
    }
    return imageData;
}

/**
 * Prépare les données d'image (dataURL, blob, dimensions) puis garantit un format
 * embarquable par docx/ODT (pose `docxType`, convertit les formats non natifs en PNG).
 * @param {string} url - URL de l'image, data URL, ou chemin relatif (ex: "images/image-xxx.jpg")
 * @returns {Promise<Object>} - {dataURL, width, height, blob, mimeType, docxType} ou {error, errorText}
 */
async function prepareImageData(url) {
    return await ensureDocxCompatibleImage(await resolveImageData(url));
}

/**
 * Résout les données d'image depuis une URL/dataURL/chemin (sans normalisation de format).
 * Gère 3 cas : data URL (base64), chemin relatif (résolu depuis image-manager), URL HTTP.
 * @param {string} url
 * @returns {Promise<Object>} - {dataURL, width, height, blob, mimeType} ou {error, errorText}
 */
async function resolveImageData(url) {
    try {
        // Cas 1 : data URL (déjà en base64)
        if (url.startsWith('data:')) {
            const [dimensions, blob] = await Promise.all([
                loadImageDimensions(url),
                fetch(url).then(r => r.blob())
            ]);
            const mimeMatch = url.match(/^data:([^;]+);/);
            return {
                dataURL: url,
                width: dimensions.width,
                height: dimensions.height,
                blob: blob,
                mimeType: mimeMatch ? mimeMatch[1] : 'image/png'
            };
        }

        // Cas 2 : chemin relatif (ex: "images/image-xxx.jpg") → résoudre depuis image-manager
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
            try {
                const { getAllImages: getRegistryImages } = await import('../h5p/image-manager.js');
                const registry = getRegistryImages(); // Map<h5pPath, Blob>
                const blob = registry.get(url);
                if (blob) {
                    const dataURL = await blobToDataURL(blob);
                    const dimensions = await loadImageDimensions(dataURL);
                    return {
                        dataURL,
                        width: dimensions.width,
                        height: dimensions.height,
                        blob,
                        mimeType: blob.type || 'image/jpeg'
                    };
                }
            } catch (e) {
                console.warn(`[export] Image-manager non disponible pour ${url}:`, e);
            }
        }

        // Cas 3 : URL HTTP classique
        return await fetchImageAsDataURL(url);
    } catch (error) {
        console.warn(`Impossible de charger l'image ${url}:`, error);
        return { error: true, errorText: t('doc_fmt_image_not_found') || '[Image non trouvée]' };
    }
}

/**
 * Convertit un Blob en data URL
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Charge les dimensions d'une image dataURL
 */
function loadImageDimensions(dataURL) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 100, height: 100 });
        img.src = dataURL;
    });
}

/**
 * Construit le Blob DOCX à partir des données JSON.
 * Helper interne partagé entre exportToDOCX et la voie Gotenberg de exportToPDF.
 * keepLatex:true → le LaTeX \(...\) est conservé pour conversion OMML.
 * @param {string} moduleKey
 * @param {Object} jsonData
 * @returns {Promise<Blob>}
 */
async function buildDocxBlob(moduleKey, jsonData) {
    await loadLibraries();
    if (!window.docx) {
        throw new Error('La bibliothèque docx n\'a pas pu être chargée');
    }
    const formattedContent = await formatContentForDocument(moduleKey, jsonData, { keepLatex: true });
    await prepareImages(formattedContent);
    const doc = createDOCXDocument(formattedContent);
    return await window.docx.Packer.toBlob(doc);
}

/**
 * Construit le Blob ODT à partir des données JSON.
 * Helper interne partagé entre exportToODT et la voie Gotenberg de exportToPDF.
 * keepLatex:true → le LaTeX \(...\) est conservé pour conversion MathML/StarMath.
 * @param {string} moduleKey
 * @param {Object} jsonData
 * @returns {Promise<Blob>}
 */
async function buildOdtBlob(moduleKey, jsonData) {
    await loadLibraries();
    const formattedContent = await formatContentForDocument(moduleKey, jsonData, { keepLatex: true });
    await prepareImages(formattedContent);
    return await createODTDocument(formattedContent);
}

/**
 * Exporte un contenu au format DOCX
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToDOCX(moduleKey, jsonData) {
    try {
        const blob = await buildDocxBlob(moduleKey, jsonData);
        const fileName = generateFileName(moduleKey, 'docx');
        downloadBlob(blob, fileName);
    } catch (error) {
        console.error('Erreur lors de l\'export DOCX:', error);
        alert(t('export_error') || 'Erreur lors de l\'export DOCX');
    }
}

/**
 * Exporte un contenu au format PDF.
 *
 * Stratégie : tente d'abord la voie Gotenberg (ODT → /forms/libreoffice/convert
 * via le proxy n8n). On envoie l'ODT — et non le DOCX — car c'est le format
 * natif de LibreOffice : ses formules MathML/StarMath sont rendues par le
 * paquet libreoffice-math de l'image Gotenberg, et le PDF partage ainsi la même
 * source que l'ODT éditable téléchargé. En cas d'échec quelconque (réseau,
 * timeout, body trop gros, 5xx…), retombe automatiquement et silencieusement
 * sur la voie jsPDF historique. L'utilisateur obtient toujours un PDF.
 *
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToPDF(moduleKey, jsonData) {
    try {
        const odtBlob = await buildOdtBlob(moduleKey, jsonData);
        const pdfBlob = await convertToPdfViaGotenberg(odtBlob, 'document.odt');
        const fileName = generateFileName(moduleKey, 'pdf');
        downloadBlob(pdfBlob, fileName);
        debugLog('PDF', `Export Gotenberg réussi (${moduleKey})`);
    } catch (error) {
        debugLog('PDF', `Voie Gotenberg indisponible (${moduleKey}), fallback jsPDF :`, error.message);
        return exportToPDFLegacy(moduleKey, jsonData);
    }
}

/**
 * Exporte un contenu au format PDF via la voie jsPDF historique (fallback).
 * Conservée comme filet de sécurité au cas où Gotenberg serait indisponible.
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToPDFLegacy(moduleKey, jsonData) {
    try {
        await loadLibraries();

        if (!window.jspdf) {
            throw new Error('La bibliothèque jsPDF n\'a pas pu être chargée');
        }

        const formattedContent = await formatContentForDocument(moduleKey, jsonData);
        sanitizeForPDFFont(formattedContent);
        await prepareImages(formattedContent);
        const doc = await createPDFDocument(formattedContent);

        const fileName = generateFileName(moduleKey, 'pdf');
        doc.save(fileName);

    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert(t('export_error') || 'Erreur lors de l\'export PDF');
    }
}

/**
 * Exporte un contenu au format ODT
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToODT(moduleKey, jsonData) {
    try {
        const odtBlob = await buildOdtBlob(moduleKey, jsonData);

        const fileName = generateFileName(moduleKey, 'odt');
        downloadBlob(odtBlob, fileName);

    } catch (error) {
        console.error('Erreur lors de l\'export ODT:', error);
        alert(t('export_error') || 'Erreur lors de l\'export ODT');
    }
}

/**
 * Crée un document DOCX à partir du contenu formaté
 */
function createDOCXDocument(formattedContent) {
    const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, PageOrientation, convertMillimetersToTwip } = window.docx;

    // Vérifier si c'est un document de cartes imprimables (Flashcards/Dialog Cards)
    const isFlashcardDocument = formattedContent.sections.some(s => s.type === 'flashcardTable');

    if (isFlashcardDocument) {
        return createDOCXFlashcardDocument(formattedContent);
    }

    const children = [];

    // En-tête du document
    children.push(
        new Paragraph({
            text: t('doc_fmt_header_title'),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: "Title"
        })
    );

    // Date de génération
    const now = new Date();
    const dateStr = now.toLocaleDateString(currentLang || 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: t('doc_fmt_generation_date') + dateStr,
                    italics: true,
                    size: 24, // 12pt
                    font: "Arial"
                })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 }
        })
    );

    // Contenu
    formattedContent.sections.forEach(section => {
        switch (section.type) {
            case 'header':
                children.push(createDOCXHeader(section));
                break;
            case 'paragraph': {
                const paras = createDOCXParagraphOrList(section);
                if (Array.isArray(paras)) children.push(...paras);
                else children.push(paras);
                break;
            }
            case 'bulletPoint':
                children.push(createDOCXBulletPoint(section));
                break;
            case 'checkbox':
                children.push(createDOCXCheckbox(section));
                break;
            case 'separator':
                children.push(createDOCXSeparator());
                break;
            case 'image':
                const imageNodes = createDOCXImage(section);
                if (imageNodes) {
                    if (Array.isArray(imageNodes)) {
                        children.push(...imageNodes);
                    } else {
                        children.push(imageNodes);
                    }
                }
                break;
            case 'table':
                children.push(createDOCXTable(section));
                break;
            case 'pageBreak':
                children.push(createDOCXPageBreak());
                break;
        }
    });

    // Pied de page déplacé dans la configuration de la section (sections -> properties -> footers)
    // On s'inspire de la structure de createDOCXFlashcardDocument qui fonctionne
    const section = {
        properties: {},
        children: children
    };

    section.footers = {
        default: new window.docx.Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: t('doc_fmt_footer_text'),
                            italics: true,
                            size: 18, // 9pt
                            color: '666666',
                            font: "Arial"
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    border: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
                    },
                    spacing: { before: 200 }
                })
            ]
        })
    };

    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;

    return new Document({
        language: locale.bcp47,
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                        size: 24, // 12pt — appliqué aussi aux formules Math OMML
                        language: {
                            value: locale.bcp47,
                            eastAsia: locale.bcp47,
                            bidirectional: locale.bcp47
                        }
                    }
                }
            },
            paragraphStyles: [
                {
                    id: "Title",
                    name: "Title",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        size: 48, // 24pt
                        bold: true,
                        font: "Arial",
                        color: "000000"
                    },
                    paragraph: {
                        alignment: AlignmentType.CENTER
                    }
                },
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        size: 36, // 18pt
                        bold: true,
                        color: "0066CC",
                        font: "Arial"
                    }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        size: 28, // 14pt
                        bold: true,
                        color: "0066CC",
                        font: "Arial"
                    }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        size: 24, // 12pt
                        bold: true,
                        color: "0066CC",
                        font: "Arial"
                    }
                }
            ]
        },
        sections: [section]
    });
}

/**
 * Crée un document DOCX spécifique pour les cartes imprimables
 * Configuration : marges 1,27 cm, tableaux 2x4 pour impression recto-verso
 */
function createDOCXFlashcardDocument(formattedContent) {
    const { Document, Paragraph, PageOrientation, convertMillimetersToTwip, TextRun, AlignmentType, HeadingLevel } = window.docx;

    // Grouper les sections par pages (chaque flashcardTable = une page)
    const docSections = [];
    let currentPageChildren = [];
    let titleEmitted = false;

    formattedContent.sections.forEach((section, index) => {
        if (section.type === 'flashcardTable') {
            // Si on a déjà du contenu, créer une nouvelle section de document
            if (currentPageChildren.length > 0) {
                docSections.push({
                    properties: {
                        page: {
                            margin: {
                                top: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                                right: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                                bottom: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                                left: convertMillimetersToTwip(FLASHCARD_CONFIG.margins)
                            },
                            size: {
                                orientation: PageOrientation.PORTRAIT,
                                width: convertMillimetersToTwip(FLASHCARD_CONFIG.pageWidth),
                                height: convertMillimetersToTwip(FLASHCARD_CONFIG.pageHeight)
                            }
                        }
                    },
                    children: currentPageChildren
                });
                currentPageChildren = [];
            }

            // Ajouter l'en-tête si c'est le début d'une page
            if (currentPageChildren.length === 0) {
                // Date de génération
                const now = new Date();
                const dateStr = now.toLocaleDateString(currentLang || 'fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                currentPageChildren.push(
                    new Paragraph({
                        text: t('doc_fmt_header_title'),
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: t('doc_fmt_generation_date') + dateStr,
                                italics: true,
                                size: 20
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 400 }
                    })
                );
            }

            // Titre de l'activité, une seule fois en tête du document (audit
            // Sucrerie 2026-07-05, F6 : les cartes sortaient sans aucun titre).
            if (!titleEmitted && formattedContent.title) {
                titleEmitted = true;
                currentPageChildren.push(new Paragraph({
                    children: [new TextRun({ text: formattedContent.title, bold: true, size: 28 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 }
                }));
            }

            // Ajouter le tableau de cartes
            currentPageChildren.push(createDOCXFlashcardTable(section));
        }
    });

    // Ajouter la dernière page si elle contient du contenu
    if (currentPageChildren.length > 0) {
        docSections.push({
            properties: {
                page: {
                    margin: {
                        top: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                        right: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                        bottom: convertMillimetersToTwip(FLASHCARD_CONFIG.margins),
                        left: convertMillimetersToTwip(FLASHCARD_CONFIG.margins)
                    },
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                        width: convertMillimetersToTwip(FLASHCARD_CONFIG.pageWidth),
                        height: convertMillimetersToTwip(FLASHCARD_CONFIG.pageHeight)
                    }
                }
            },
            children: currentPageChildren
        });
    }

    // Ajouter le pied de page à chaque section
    docSections.forEach(section => {
        section.footers = {
            default: new window.docx.Footer({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: t('doc_fmt_footer_text'),
                                italics: true,
                                size: 18,
                                color: '666666',
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        border: {
                            top: { style: window.docx.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
                        },
                        spacing: { before: 200 }
                    })
                ]
            })
        };
    });

    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;

    return new Document({
        language: locale.bcp47,
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                        language: {
                            value: locale.bcp47,
                            eastAsia: locale.bcp47,
                            bidirectional: locale.bcp47
                        }
                    }
                }
            }
        },
        sections: docSections
    });
}

/**
 * Crée un en-tête DOCX
 */
function createDOCXHeader(section) {
    const { Paragraph, HeadingLevel, AlignmentType } = window.docx;

    const headingLevels = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3
    };

    return new Paragraph({
        children: parseTextWithMath(section.text),
        heading: headingLevels[section.level] || HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
    });
}

/**
 * Crée un ou plusieurs paragraphes DOCX.
 * Si le texte contient des listes (• ou 1. en début de ligne), les éclate
 * en paragraphes DOCX natifs avec bullet/numbering.
 */
function createDOCXParagraphOrList(section) {
    if (!section.text) return createDOCXParagraph(section);

    const lines = section.text.split('\n');
    const hasBullets = lines.some(l => /^\s*[•\-]\s/.test(l));
    const hasNumbers = lines.some(l => /^\s*\d+\.\s/.test(l));

    if (!hasBullets && !hasNumbers) return createDOCXParagraph(section);

    const { Paragraph, TextRun } = window.docx;
    const paragraphs = [];
    const baseStyle = { size: 24 };

    // Texte avant la liste
    const beforeList = [];
    const listItems = [];
    const afterList = [];
    let inList = false;
    let pastList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const bulletMatch = trimmed.match(/^[•\-]\s+(.*)/);
        const numberMatch = trimmed.match(/^\d+\.\s+(.*)/);

        if (bulletMatch || numberMatch) {
            inList = true;
            listItems.push({
                text: bulletMatch ? bulletMatch[1] : numberMatch[1],
                isNumbered: !!numberMatch
            });
        } else if (inList) {
            pastList = true;
            inList = false;
            afterList.push(trimmed);
        } else {
            beforeList.push(trimmed);
        }
    }

    // Paragraphe avant la liste
    if (beforeList.length > 0) {
        paragraphs.push(new Paragraph({
            children: parseTextWithMath(beforeList.join(' '), baseStyle),
            spacing: { before: 120, after: 60 }
        }));
    }

    // Items de liste
    listItems.forEach((item, idx) => {
        if (item.isNumbered) {
            // Liste numérotée : simulée avec un TextRun numéroté (pas de numbering natif simple)
            paragraphs.push(new Paragraph({
                children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true, ...baseStyle }),
                    ...parseTextWithMath(item.text, baseStyle)
                ],
                indent: { left: 360 },
                spacing: { before: 40, after: 40 }
            }));
        } else {
            paragraphs.push(new Paragraph({
                children: parseTextWithMath(item.text, baseStyle),
                bullet: { level: 0 },
                spacing: { before: 40, after: 40 }
            }));
        }
    });

    // Paragraphe après la liste
    if (afterList.length > 0) {
        paragraphs.push(new Paragraph({
            children: parseTextWithMath(afterList.join(' '), baseStyle),
            spacing: { before: 60, after: 120 }
        }));
    }

    return paragraphs;
}

/**
 * Crée un paragraphe DOCX
 */
function createDOCXParagraph(section) {
    const { Paragraph, TextRun } = window.docx;

    const styles = {
        'description': { italics: true, size: 24, color: '333333' },
        'instructions': { bold: true, size: 24, color: '0066CC' },
        'metadata': { size: 20, color: '666666' },
        'question': { bold: true, size: 26 },
        'answersTitle': { bold: true, size: 24 },
        'correctAnswer': { bold: true, color: '008000', size: 24 },
        'wrongAnswer': { color: '666666', size: 24 },
        'feedbackTitle': { bold: true, size: 24, color: '0066CC' },
        'tip': { italics: true, color: '0066CC', size: 22 },
        'flashcardFront': { bold: true, size: 24 },
        'flashcardBack': { size: 24 },
        'subtitle': { bold: true, italics: true, size: 24 },
        'blanksText': { size: 24, color: '333333' },
        'blanksCorrection': { size: 24 },
        'definition': { size: 24 },
        'crosswordClue': { size: 24 },
        'timelineEra': { bold: true, size: 24 },
        'orderedParagraph': { size: 24 },
        'wordList': { bold: true, size: 24 }
    };

    const style = styles[section.style] || { size: 24 };

    return new Paragraph({
        children: parseTextWithMath(section.text, style),
        spacing: { before: 120, after: 120 }
    });
}

/**
 * Crée un point de liste DOCX
 */
function createDOCXBulletPoint(section) {
    const { Paragraph, TextRun } = window.docx;

    const styles = {
        'correctAnswer': { bold: true, color: '008000' },
        'wrongAnswer': { color: '666666' }
    };

    const style = styles[section.style] || {};

    return new Paragraph({
        children: parseTextWithMath(section.text, { size: 24, ...style }),
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 }
    });
}

/**
 * Crée une case à cocher DOCX [  ]
 */
function createDOCXCheckbox(section) {
    const { Paragraph, TextRun } = window.docx;

    const styles = {
        'correctAnswer': { bold: true, color: '008000' },
        'wrongAnswer': { color: '666666' }
    };

    const style = styles[section.style] || {};

    return new Paragraph({
        children: [
            new TextRun({ text: "[  ] ", size: 24, ...style }),
            ...parseTextWithMath(section.text, { size: 24, ...style })
        ],
        spacing: { before: 60, after: 60 },
        indent: { left: 360 } // Un petit retrait pour aligner
    });
}

/**
 * Crée un séparateur DOCX
 */
function createDOCXSeparator() {
    const { Paragraph } = window.docx;

    return new Paragraph({
        text: '',
        spacing: { before: 200, after: 200 }
    });
}

/**
 * Crée un saut de page DOCX
 */
function createDOCXPageBreak() {
    const { Paragraph, PageBreak } = window.docx;

    return new Paragraph({
        children: [new PageBreak()]
    });
}

/**
 * Crée une image DOCX
 */
function createDOCXImage(section) {
    const { Paragraph, ImageRun, TextRun, AlignmentType } = window.docx;

    if (section.imageError) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: section.errorText || '[Image non trouvée]',
                    color: 'FF0000',
                    italics: true,
                    size: 20
                })
            ],
            spacing: { before: 120, after: 120 }
        });
    }

    if (!section.imageData || !section.imageData.blob) {
        return null;
    }

    const dims = calculateDimensions(
        section.imageData.width,
        section.imageData.height,
        section.imgSizeMm || (section.fillWidth ? 9999 : DOCX_FIXED_HEIGHT),
        section.imgSizeMm || MAX_WIDTH_DOCX
    );

    const MM_TO_PX = 3.78;

    const nodes = [];

    nodes.push(new Paragraph({
        children: [
            new ImageRun({
                // `type` requis par docx ≥ 8.6 (sinon extension média « .undefined » → Word répare).
                type: section.imageData.docxType || docxImageType(section.imageData.mimeType) || 'png',
                data: section.imageData.blob,
                transformation: {
                    width: dims.width * MM_TO_PX,
                    height: dims.height * MM_TO_PX
                }
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60 }
    }));

    if (section.caption || section.alt) {
        nodes.push(new Paragraph({
            children: [
                new TextRun({
                    text: section.caption || section.alt,
                    italics: true,
                    size: 18,
                    color: '666666'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120 }
        }));
    }

    return nodes;
}

/**
 * Crée un tableau DOCX pour les cartes imprimables (Flashcards/Dialog Cards)
 * @param {Object} section - Section de type flashcardTable
 * @returns {Table} - Tableau DOCX
 */
function createDOCXFlashcardTable(section) {
    const { Table, TableRow, TableCell, Paragraph, TextRun,
        WidthType, VerticalAlign, HeightRule, BorderStyle,
        AlignmentType } = window.docx;

    const rows = section.rows.map(row => {
        return new TableRow({
            cantSplit: true,  // Empêcher le fractionnement de la ligne sur plusieurs pages
            height: {
                value: FLASHCARD_CONFIG.rowHeightTwips,
                rule: HeightRule.EXACT
            },
            children: [
                createDOCXFlashcardCell(row.left),
                createDOCXFlashcardCell(row.right)
            ]
        });
    });

    return new Table({
        rows: rows,
        width: {
            size: 100,
            type: WidthType.PERCENTAGE
        },
        columnWidths: [
            FLASHCARD_CONFIG.columnWidthTwips,
            FLASHCARD_CONFIG.columnWidthTwips
        ],
        borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' },
            left: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' },
            right: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' }
        }
    });
}

/**
 * Crée une cellule DOCX pour une carte
 * @param {Object|null} cardContent - Contenu de la carte {text, hint, cardNumber, imageData?} ou null
 * @returns {TableCell} - Cellule DOCX
 */
function createDOCXFlashcardCell(cardContent) {
    const { TableCell, Paragraph, TextRun, ImageRun, VerticalAlign,
        AlignmentType, WidthType } = window.docx;

    const paragraphs = [];

    if (cardContent) {
        // Image si présente (centrée, dimensions contraintes)
        if (cardContent.imageData && cardContent.imageData.blob) {
            const dims = calculateDimensions(
                cardContent.imageData.width,
                cardContent.imageData.height,
                FLASHCARD_CONFIG.imageMaxHeight,
                FLASHCARD_CONFIG.imageMaxWidth
            );
            const MM_TO_PX = 3.78;
            paragraphs.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: cardContent.imageData.docxType || docxImageType(cardContent.imageData.mimeType) || 'png',
                            data: cardContent.imageData.blob,
                            transformation: {
                                width: Math.round(dims.width * MM_TO_PX),
                                height: Math.round(dims.height * MM_TO_PX)
                            }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 }
                })
            );
        }

        // Texte principal (centré, 12pt)
        paragraphs.push(
            new Paragraph({
                children: parseTextWithMath(cardContent.text || '', { size: 24, font: "Arial" }),
                alignment: AlignmentType.CENTER
            })
        );

        // Indice si présent (plus petit, italique, gris)
        if (cardContent.hint) {
            paragraphs.push(
                new Paragraph({
                    children: parseTextWithMath(cardContent.hint, { size: 20, italics: true, color: '666666', font: "Arial" }),
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 120 }
                })
            );
        }
    } else {
        // Cellule vide
        paragraphs.push(new Paragraph({ text: '' }));
    }

    return new TableCell({
        children: paragraphs,
        verticalAlign: VerticalAlign.CENTER,
        width: {
            size: FLASHCARD_CONFIG.columnWidthTwips,
            type: WidthType.DXA
        },
        margins: {
            top: 170,    // ~3mm en twips
            bottom: 170,
            left: 170,
            right: 170
        }
    });
}

/**
 * Crée un tableau DOCX générique (pour grilles de travail, étiquettes, corrections, etc.)
 * Styles supportés : workGrid, cutoutLabels, correctionGrid, recapTable
 */
function createDOCXTable(section) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, ImageRun,
        WidthType, VerticalAlign, HeightRule, BorderStyle,
        AlignmentType, ShadingType } = window.docx;

    const headers = section.headers || [];
    const rows = section.rows || [];
    const style = section.style || 'default';
    const colCount = headers.length || (rows[0] ? rows[0].length : 2);

    // Pour les tableaux Drag & Drop, calculer la largeur fixe de chaque colonne
    // Largeur utilisable A4 portrait après marges Word par défaut ≈ 9072 twips (16cm)
    const isDnDTable = (style === 'workGrid' || style === 'cutoutLabels' || style === 'correctionGrid');
    const DND_CELL_WIDTH = isDnDTable ? Math.floor(9072 / colCount) : 0;

    // Configuration par style
    const styleConfig = {
        default: {
            headerBg: 'E8E8E8', headerColor: '000000', headerBold: true,
            borderColor: '000000', borderSize: 4,
            cellMinHeight: 340,
            cellAlign: 'left', cellBold: false, cellColor: '000000'
        },
        workGrid: {
            headerBg: '0066CC', headerColor: 'FFFFFF', headerBold: true,
            borderColor: '0066CC', borderSize: 6,
            cellMinHeight: 800, // ~1.4cm en twips (espace pour coller étiquettes)
            cellAlign: 'center', cellBold: false, cellColor: '000000'
        },
        cutoutLabels: {
            headerBg: null, headerColor: '000000', headerBold: false,
            borderColor: '999999', borderSize: 6, borderStyle: BorderStyle.DASHED,
            cellMinHeight: 567, // ~1cm en twips
            cellAlign: 'center', cellBold: false, cellColor: '000000',
            cellPadding: 200
        },
        correctionGrid: {
            headerBg: '0066CC', headerColor: 'FFFFFF', headerBold: true,
            borderColor: '0066CC', borderSize: 6,
            cellMinHeight: 400,
            cellAlign: 'center', cellBold: true, cellColor: '008000'
        },
        recapTable: {
            headerBg: 'E8E8E8', headerColor: '000000', headerBold: true,
            borderColor: '999999', borderSize: 4,
            cellMinHeight: 340,
            cellAlign: 'left', cellBold: false, cellColor: '000000',
            firstColBold: true
        },
        rubricGrid: {
            headerBg: '1A5276', headerColor: 'FFFFFF', headerBold: true,
            borderColor: 'B0C4DE', borderSize: 4,
            cellMinHeight: 400,
            cellAlign: 'left', cellBold: false, cellColor: '333333',
            firstColBold: true, firstColBg: 'EBF5FB'
        }
    };

    const cfg = styleConfig[style] || styleConfig.recapTable;
    const bStyle = cfg.borderStyle || BorderStyle.SINGLE;

    const tableBorders = {
        top: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor },
        bottom: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor },
        left: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor },
        right: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor },
        insideHorizontal: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor },
        insideVertical: { style: bStyle, size: cfg.borderSize, color: cfg.borderColor }
    };

    const tableRows = [];

    // En-tête
    if (headers.length > 0) {
        const headerCells = headers.map(h => {
            const cellOpts = {
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: h,
                                bold: cfg.headerBold,
                                color: cfg.headerColor,
                                size: 24,
                                font: "Arial"
                            })
                        ],
                        alignment: AlignmentType.CENTER
                    })
                ],
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 80, left: 120, right: 120 }
            };
            if (cfg.headerBg) {
                cellOpts.shading = { type: ShadingType.CLEAR, fill: cfg.headerBg };
            }
            // Forcer la largeur fixe pour les tableaux Drag & Drop
            if (isDnDTable) {
                cellOpts.width = { size: DND_CELL_WIDTH, type: WidthType.DXA };
            }
            return new TableCell(cellOpts);
        });

        tableRows.push(new TableRow({
            cantSplit: true,
            children: headerCells
        }));
    }

    // Constantes pour les images dans les cellules de table (étiquettes D&D)
    const DND_LABEL_IMAGE_MAX_WIDTH = 40;  // mm
    const DND_LABEL_IMAGE_MAX_HEIGHT = 20; // mm

    // Lignes de données
    rows.forEach(row => {
        const dataCells = row.map((cellRaw, colIdx) => {
            // Extraire texte et éventuelle image de la cellule
            const isObjectCell = cellRaw && typeof cellRaw === 'object' && !Array.isArray(cellRaw);
            const cellText = isObjectCell ? (cellRaw.text || '') : (cellRaw || '');
            const cellImageData = isObjectCell ? cellRaw.imageData : null;

            const isBold = cfg.cellBold || (cfg.firstColBold && colIdx === 0);
            const color = cfg.cellBold ? cfg.cellColor : (colIdx === 0 && cfg.firstColBold ? '000000' : cfg.cellColor);
            const padding = cfg.cellPadding || 120;

            const paragraphs = [];

            // Image inline si présente (centrée, au-dessus du texte)
            if (cellImageData && cellImageData.blob) {
                const dims = calculateDimensions(
                    cellImageData.width,
                    cellImageData.height,
                    DND_LABEL_IMAGE_MAX_HEIGHT,
                    DND_LABEL_IMAGE_MAX_WIDTH
                );
                const MM_TO_PX = 3.78;
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                type: cellImageData.docxType || docxImageType(cellImageData.mimeType) || 'png',
                                data: cellImageData.blob,
                                transformation: {
                                    width: Math.round(dims.width * MM_TO_PX),
                                    height: Math.round(dims.height * MM_TO_PX)
                                }
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 }
                    })
                );
            }

            // Texte de la cellule
            paragraphs.push(
                new Paragraph({
                    children: cellText ? parseTextWithMath(cellText, {
                        size: 24,
                        bold: isBold,
                        color: color,
                        font: "Arial"
                    }) : [],
                    alignment: cfg.cellAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT
                })
            );

            const cellOpts = {
                children: paragraphs,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 80, left: padding, right: padding }
            };
            // Fond coloré sur la première colonne (grille d'évaluation)
            if (cfg.firstColBg && colIdx === 0) {
                cellOpts.shading = { type: ShadingType.CLEAR, fill: cfg.firstColBg };
            }
            // Forcer la largeur fixe pour les tableaux Drag & Drop
            if (isDnDTable) {
                cellOpts.width = { size: DND_CELL_WIDTH, type: WidthType.DXA };
            }
            return new TableCell(cellOpts);
        });

        // Compléter si la ligne a moins de cellules que de colonnes
        while (dataCells.length < colCount) {
            const fillOpts = {
                children: [new Paragraph({ text: '' })],
                verticalAlign: VerticalAlign.CENTER
            };
            if (isDnDTable) {
                fillOpts.width = { size: DND_CELL_WIDTH, type: WidthType.DXA };
            }
            dataCells.push(new TableCell(fillOpts));
        }

        const rowOpts = {
            cantSplit: true,
            children: dataCells
        };
        if (cfg.cellMinHeight) {
            rowOpts.height = { value: cfg.cellMinHeight, rule: HeightRule.AT_LEAST };
        }

        tableRows.push(new TableRow(rowOpts));
    });

    // Configuration des largeurs de colonnes pour les tableaux Drag & Drop
    const tableConfig = {
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders
    };

    // Pour les grilles et étiquettes, forcer des colonnes de largeur égale
    if (isDnDTable) {
        tableConfig.columnWidths = Array(colCount).fill(DND_CELL_WIDTH);
    }

    return new Table(tableConfig);
}

/**
 * Crée un document PDF à partir du contenu formaté
 */
async function createPDFDocument(formattedContent) {
    // Vérifier si c'est un document de cartes imprimables (Flashcards/Dialog Cards)
    const isFlashcardDocument = formattedContent.sections.some(s => s.type === 'flashcardTable');

    if (isFlashcardDocument) {
        return createPDFFlashcardDocument(formattedContent);
    }

    const doc = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
    });

    // Définir la langue du document
    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;
    doc.setLanguage(locale.bcp47);
    doc.setProperties({ language: locale.bcp47 });

    // Charger et enregistrer les polices Liberation Sans
    await loadPDFFonts(doc);

    let y = 20; // Position Y actuelle
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    const bottomMargin = 25; // Marge basse (espace pour le pied de page)

    // En-tête
    doc.setFontSize(24);
    doc.setFont(PDF_FONT, 'bold');
    doc.text(t('doc_fmt_header_title'), pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Date
    const now = new Date();
    const dateStr = now.toLocaleDateString(currentLang || 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    doc.setFontSize(12);
    doc.setFont(PDF_FONT, 'italic');
    doc.text(t('doc_fmt_generation_date') + dateStr, pageWidth - margin, y, { align: 'right' });
    y += 15;

    // Contenu
    formattedContent.sections.forEach(section => {
        // Vérifier si on doit ajouter une nouvelle page
        if (y > pageHeight - bottomMargin) {
            doc.addPage();
            y = 20;
        }

        switch (section.type) {
            case 'header':
                y = addPDFHeader(doc, section, y, margin, maxWidth, pageHeight, bottomMargin);
                break;
            case 'paragraph':
                y = addPDFParagraph(doc, section, y, margin, maxWidth, pageHeight, bottomMargin);
                break;
            case 'bulletPoint':
                y = addPDFBulletPoint(doc, section, y, margin, maxWidth, pageHeight, bottomMargin);
                break;
            case 'checkbox':
                y = addPDFCheckbox(doc, section, y, margin, maxWidth, pageHeight, bottomMargin);
                break;
            case 'separator':
                y += 5;
                break;
            case 'image':
                y = addPDFImage(doc, section, y, margin, maxWidth, pageHeight);
                break;
            case 'table':
                y = addPDFTable(doc, section, y, margin, maxWidth, pageHeight, bottomMargin);
                break;
            case 'pageBreak':
                // Éviter une page vierge si un saut de page automatique vient d'avoir lieu
                // (ex: image volumineuse qui a déclenché addPage() juste avant)
                if (y > 30) {
                    doc.addPage();
                    y = 20;
                }
                break;
        }
    });

    // Pied de page sur toutes les pages
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont(PDF_FONT, 'italic');
    doc.setTextColor(100, 100, 100);

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 10;
        doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
        doc.text(t('doc_fmt_footer_text'), pageWidth / 2, footerY, { align: 'center' });
    }

    return doc;
}

/**
 * Ajoute un en-tête au PDF
 */
function addPDFHeader(doc, section, y, margin, maxWidth, pageHeight, bottomMargin) {
    const fontSize = section.level === 1 ? 18 : (section.level === 2 ? 14 : 12);
    const style = {
        fontSize: fontSize,
        font: PDF_FONT,
        fontStyle: 'bold',
        color: [0, 102, 204]
    };

    return drawPDFRichText(doc, section.text, margin, y, maxWidth, style, 'left', pageHeight, bottomMargin) + 7;
}

/**
 * Dessine du texte avec support Markdown simplifié sur le PDF.
 * Dessine le texte segment par segment (par changement de style gras/italique)
 * au lieu de mot par mot, ce qui évite les erreurs d'espacement cumulatives.
 * Gère les sauts de page automatiques quand le texte dépasse le bas de page.
 */
function drawPDFRichText(doc, text, x, y, maxWidth, baseStyle, align = 'left', pageHeight = 0, bottomMargin = 25) {
    const fontSize = baseStyle.fontSize || 11;
    const font = baseStyle.font || PDF_FONT;
    const baseFontStyle = baseStyle.fontStyle || 'normal';
    const color = baseStyle.color || [0, 0, 0];
    const lineHeight = fontSize * 0.5;
    const paragraphSpacing = 4;

    if (!pageHeight) {
        pageHeight = doc.internal.pageSize.height;
    }

    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const paragraphs = text.split('\n');
    let currentY = y;

    /**
     * Calcule le fontStyle jsPDF à appliquer
     */
    function getFontStyle(run) {
        if (run.bold && run.italic) return 'bolditalic';
        if (run.bold) return baseFontStyle.includes('italic') ? 'bolditalic' : 'bold';
        if (run.italic) return baseFontStyle.includes('bold') ? 'bolditalic' : 'italic';
        return baseFontStyle;
    }

    /**
     * Vérifie et gère le saut de page si nécessaire
     */
    function checkPageBreak() {
        if (currentY > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = 20;
            // Restaurer les paramètres de style après le saut de page
            doc.setFontSize(fontSize);
            doc.setTextColor(...color);
        }
    }

    paragraphs.forEach((pText, pIndex) => {
        // Parser Markdown + HTML inline (couleur, souligné, barré, sub, sup, liens)
        const runs = [];

        // Extraire d'abord les tags HTML inline en placeholders
        const htmlParts = [];
        let cleanedPText = pText.replace(/<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>/gi, (m, col, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: txt, color: col.trim() });
            return `\x01HTML${idx}\x01`;
        });
        cleanedPText = cleanedPText.replace(/<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (m, href, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: `${txt} (${href})`, underline: true, linkColor: true });
            return `\x01HTML${idx}\x01`;
        });
        cleanedPText = cleanedPText.replace(/<u>(.*?)<\/u>/gi, (m, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: txt, underline: true });
            return `\x01HTML${idx}\x01`;
        });
        cleanedPText = cleanedPText.replace(/<s>(.*?)<\/s>/gi, (m, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: txt, strike: true });
            return `\x01HTML${idx}\x01`;
        });
        cleanedPText = cleanedPText.replace(/<sub>(.*?)<\/sub>/gi, (m, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: txt, sub: true });
            return `\x01HTML${idx}\x01`;
        });
        cleanedPText = cleanedPText.replace(/<sup>(.*?)<\/sup>/gi, (m, txt) => {
            const idx = htmlParts.length;
            htmlParts.push({ text: txt, sup: true });
            return `\x01HTML${idx}\x01`;
        });
        // Supprimer les tags HTML restants
        cleanedPText = cleanedPText.replace(/<[^>]+>/g, '');

        // Parser le Markdown (avec placeholders HTML intercalés)
        const regex = /(\x01HTML\d+\x01|\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*[^*]+?\*)/g;
        const parts = cleanedPText.split(regex);

        parts.forEach(part => {
            if (!part) return;
            // Placeholder HTML
            const htmlMatch = part.match(/^\x01HTML(\d+)\x01$/);
            if (htmlMatch) {
                const hp = htmlParts[parseInt(htmlMatch[1])];
                runs.push({
                    text: hp.text, bold: false, italic: false, green: false,
                    customColor: hp.color, underline: hp.underline, strike: hp.strike,
                    sub: hp.sub, sup: hp.sup, linkColor: hp.linkColor
                });
                return;
            }
            if (part.startsWith('***') && part.endsWith('***')) {
                runs.push({ text: part.slice(3, -3), bold: true, italic: false, green: true });
            } else if (part.startsWith('**') && part.endsWith('**')) {
                runs.push({ text: part.slice(2, -2), bold: true, italic: false, green: false });
            } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                runs.push({ text: part.slice(1, -1), bold: false, italic: true, green: false });
            } else if (part) {
                runs.push({ text: part, bold: false, italic: false, green: false });
            }
        });

        // Découper en lignes en utilisant splitTextToSize de jsPDF par segment
        // On construit les lignes avec des segments positionnés
        const lines = [];
        let currentLine = { segments: [], width: 0 };

        runs.forEach(run => {
            const fontStyle = getFontStyle(run);
            doc.setFont(font, fontStyle);

            // Découper le texte du run en mots (sans conserver les espaces comme tokens séparés)
            const words = run.text.split(/\s+/).filter(w => w.length > 0);
            const spaceWidth = doc.getTextWidth(' ');

            words.forEach((word, wordIndex) => {
                const wordWidth = doc.getTextWidth(word);
                // Ajouter un espace avant le mot si la ligne n'est pas vide
                const needsSpace = currentLine.segments.length > 0 || wordIndex > 0;
                const totalWidthNeeded = (needsSpace ? spaceWidth : 0) + wordWidth;

                if (currentLine.width + totalWidthNeeded > maxWidth && currentLine.segments.length > 0) {
                    // La ligne est pleine, on en commence une nouvelle
                    lines.push(currentLine);
                    currentLine = { segments: [], width: 0 };
                }

                // Ajouter l'espace + mot au dernier segment de même style, ou créer un nouveau segment
                const textToAdd = (currentLine.segments.length > 0 ? ' ' : '') + word;
                const widthToAdd = (currentLine.segments.length > 0 ? spaceWidth : 0) + wordWidth;

                const lastSeg = currentLine.segments[currentLine.segments.length - 1];
                const sameStyle = lastSeg && lastSeg.bold === run.bold && lastSeg.italic === run.italic
                    && lastSeg.green === run.green && lastSeg.customColor === run.customColor
                    && lastSeg.underline === run.underline && lastSeg.strike === run.strike
                    && lastSeg.sub === run.sub && lastSeg.sup === run.sup;
                if (sameStyle) {
                    lastSeg.text += textToAdd;
                    lastSeg.width += widthToAdd;
                } else {
                    // Nouveau segment de style différent
                    const prefix = currentLine.segments.length > 0 ? ' ' : '';
                    const prefixWidth = currentLine.segments.length > 0 ? spaceWidth : 0;
                    currentLine.segments.push({
                        text: prefix + word,
                        width: prefixWidth + wordWidth,
                        bold: run.bold,
                        italic: run.italic,
                        green: run.green,
                        customColor: run.customColor,
                        underline: run.underline,
                        strike: run.strike,
                        sub: run.sub,
                        sup: run.sup,
                        linkColor: run.linkColor
                    });
                }
                currentLine.width += widthToAdd;
            });

            // Gérer le cas d'un run entièrement vide (juste des espaces) ou un espace trailing
            // Si le run original se terminait par un espace et qu'il y a d'autres runs après,
            // on ne fait rien car l'espace sera ajouté au prochain mot
        });

        if (currentLine.segments.length > 0) lines.push(currentLine);

        // Dessiner les lignes
        lines.forEach(line => {
            checkPageBreak();

            let startX = x;
            if (align === 'center') startX = x + (maxWidth - line.width) / 2;
            else if (align === 'right') startX = x + maxWidth - line.width;

            let currentX = startX;
            line.segments.forEach(seg => {
                // Taille réduite pour sub/sup
                const segFontSize = (seg.sub || seg.sup) ? fontSize * 0.7 : fontSize;
                doc.setFontSize(segFontSize);

                const fontStyle = getFontStyle(seg);
                doc.setFont(font, fontStyle);

                // Couleur
                if (seg.green) {
                    doc.setTextColor(0, 128, 0);
                } else if (seg.customColor) {
                    const hex = cssColorToHex(seg.customColor);
                    doc.setTextColor(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16));
                } else if (seg.linkColor) {
                    doc.setTextColor(0, 102, 204);
                } else {
                    doc.setTextColor(...color);
                }

                // Position verticale ajustée pour sub/sup
                const segY = seg.sup ? currentY - 1.5 : seg.sub ? currentY + 2 : currentY;
                doc.text(seg.text, currentX, segY, { baseline: 'top' });

                // Souligné (trait sous le texte)
                if (seg.underline) {
                    const textWidth = doc.getTextWidth(seg.text);
                    doc.setLineWidth(0.3);
                    doc.line(currentX, segY + segFontSize * 0.42, currentX + textWidth, segY + segFontSize * 0.42);
                }

                // Barré (trait au milieu du texte)
                if (seg.strike) {
                    const textWidth = doc.getTextWidth(seg.text);
                    doc.setLineWidth(0.3);
                    doc.line(currentX, segY + segFontSize * 0.22, currentX + textWidth, segY + segFontSize * 0.22);
                }

                currentX += seg.width;
                // Restaurer la taille de base
                doc.setFontSize(fontSize);
            });
            currentY += lineHeight;
        });

        if (pIndex < paragraphs.length - 1) {
            currentY += paragraphSpacing;
        }
    });

    return currentY;
}

/**
 * Ajoute un paragraphe au PDF avec support Markdown simplifié
 */
function addPDFParagraph(doc, section, y, margin, maxWidth, pageHeight, bottomMargin) {
    const styles = {
        'description': { fontSize: 11, font: PDF_FONT, fontStyle: 'italic', color: [51, 51, 51] },
        'instructions': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 102, 204] },
        'metadata': { fontSize: 10, font: PDF_FONT, fontStyle: 'normal', color: [102, 102, 102] },
        'question': { fontSize: 12, font: PDF_FONT, fontStyle: 'bold', color: [0, 0, 0] },
        'answersTitle': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 0, 0] },
        'correctAnswer': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 128, 0] },
        'wrongAnswer': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [102, 102, 102] },
        'feedbackTitle': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 102, 204] },
        'tip': { fontSize: 10, font: PDF_FONT, fontStyle: 'italic', color: [0, 102, 204] },
        'flashcardFront': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 0, 0] },
        'flashcardBack': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] },
        'subtitle': { fontSize: 11, font: PDF_FONT, fontStyle: 'bolditalic', color: [0, 0, 0] },
        'blanksText': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [51, 51, 51] },
        'blanksCorrection': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] },
        'definition': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] },
        'crosswordClue': { fontSize: 12, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] },
        'timelineEra': { fontSize: 12, font: PDF_FONT, fontStyle: 'bold', color: [46, 117, 182] },
        'orderedParagraph': { fontSize: 12, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] },
        'wordList': { fontSize: 11, font: PDF_FONT, fontStyle: 'bold', color: [0, 0, 0] },
        'default': { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] }
    };

    const style = styles[section.style] || styles['default'];
    return drawPDFRichText(doc, section.text, margin, y, maxWidth, style, 'left', pageHeight, bottomMargin) + 5;
}

/**
 * Ajoute un point de liste au PDF
 */
function addPDFBulletPoint(doc, section, y, margin, maxWidth, pageHeight, bottomMargin) {
    const styles = {
        'correctAnswer': { color: [0, 128, 0], fontStyle: 'bold' },
        'wrongAnswer': { color: [102, 102, 102], fontStyle: 'normal' },
        'default': { color: [0, 0, 0], fontStyle: 'normal' }
    };

    const style = styles[section.style] || styles['default'];
    const bulletWidth = 5;

    doc.setFontSize(11);
    doc.setFont(PDF_FONT, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('\u2022', margin, y, { baseline: 'top' });

    return drawPDFRichText(doc, section.text, margin + bulletWidth, y, maxWidth - bulletWidth, { ...style, fontSize: 11, font: PDF_FONT }, 'left', pageHeight, bottomMargin) + 2;
}

/**
 * Ajoute une case à cocher au PDF
 */
function addPDFCheckbox(doc, section, y, margin, maxWidth, pageHeight, bottomMargin) {
    const styles = {
        'correctAnswer': { color: [0, 128, 0], fontStyle: 'bold' },
        'wrongAnswer': { color: [102, 102, 102], fontStyle: 'normal' },
        'default': { color: [0, 0, 0], fontStyle: 'normal' }
    };

    const style = styles[section.style] || styles['default'];

    // Dessiner un vrai rectangle pour la case à cocher (plus propre que du texte)
    const boxSize = 3;
    const boxMargin = margin + 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(boxMargin, y + 0.5, boxSize, boxSize);

    const textIndent = boxMargin + boxSize + 3;

    return drawPDFRichText(doc, section.text, textIndent, y, maxWidth - (textIndent - margin), { ...style, fontSize: 11, font: PDF_FONT }, 'left', pageHeight, bottomMargin) + 2;
}

/**
 * Ajoute une image au PDF
 */
function addPDFImage(doc, section, y, margin, maxWidth, pageHeight) {
    if (section.imageError) {
        doc.setFontSize(10);
        doc.setFont(PDF_FONT, 'italic');
        doc.setTextColor(255, 0, 0);
        const errorText = section.errorText || '[Image non trouvée]';
        const lines = doc.splitTextToSize(errorText, maxWidth);

        if (y + (lines.length * 4) > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, margin, y);
        return y + (lines.length * 4) + 5;
    }

    if (!section.imageData || !section.imageData.dataURL) {
        return y;
    }

    const dims = calculateDimensions(
        section.imageData.width,
        section.imageData.height,
        section.imgSizeMm || (section.fillWidth ? 9999 : PDF_FIXED_HEIGHT),
        section.imgSizeMm || maxWidth
    );

    // Vérifier si l'image tient sur la page
    let imageY = y;
    const totalHeightNeeded = dims.height + (section.caption || section.alt ? 10 : 5);

    if (imageY + totalHeightNeeded > pageHeight - 20) {
        doc.addPage();
        imageY = 20;
    }

    try {
        doc.addImage(
            section.imageData.dataURL,
            section.imageData.mimeType || 'JPEG',
            margin + (maxWidth - dims.width) / 2, // Centrage horizontal
            imageY,
            dims.width,
            dims.height
        );

        let finalY = imageY + dims.height + 2;

        if (section.caption || section.alt) {
            doc.setFontSize(9);
            doc.setFont(PDF_FONT, 'italic');
            doc.setTextColor(102, 102, 102);
            const text = section.caption || section.alt;
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, margin + maxWidth / 2, finalY, { align: 'center' });
            finalY += (lines.length * 4) + 4;
        } else {
            finalY += 3;
        }

        return finalY;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'image au PDF:', error);
        return imageY;
    }
}

/**
 * Crée un document PDF spécifique pour les cartes imprimables
 * Utilise jspdf-autotable pour les tableaux
 */
async function createPDFFlashcardDocument(formattedContent) {
    const doc = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
    });

    // Définir la langue du document
    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;
    doc.setLanguage(locale.bcp47);
    doc.setProperties({ language: locale.bcp47 });

    // Charger et enregistrer les polices Liberation Sans
    await loadPDFFonts(doc);

    let isFirstPage = true;

    formattedContent.sections.forEach(section => {
        if (section.type === 'flashcardTable') {
            if (!isFirstPage) {
                doc.addPage();
            }

            // En-tête (Titre + Date)
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(20);
            doc.setFont(PDF_FONT, 'bold');
            doc.text(t('doc_fmt_header_title'), pageWidth / 2, 15, { align: 'center' });

            const now = new Date();
            const dateStr = now.toLocaleDateString(currentLang || 'fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.setFontSize(10);
            doc.setFont(PDF_FONT, 'italic');
            doc.text(t('doc_fmt_generation_date') + dateStr, pageWidth - FLASHCARD_CONFIG.pdfMargin, 25, { align: 'right' });

            // Titre de l'activité, une seule fois en tête (audit Sucrerie
            // 2026-07-05, F6). Les tableaux démarrent à startY=50 → pas de
            // chevauchement.
            if (isFirstPage && formattedContent.title) {
                doc.setFontSize(14);
                doc.setFont(PDF_FONT, 'bold');
                doc.text(formattedContent.title, pageWidth / 2, 35, { align: 'center' });
            }

            // Pied de page
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(t('doc_fmt_footer_text'), pageWidth / 2, 285, { align: 'center' });
            doc.setTextColor(0);

            isFirstPage = false;

            addPDFFlashcardTable(doc, section);
        }
    });

    return doc;
}

/**
 * Ajoute un tableau de cartes au PDF en utilisant autoTable
 * @param {jsPDF} doc - Document PDF
 * @param {Object} section - Section flashcardTable
 */
function addPDFFlashcardTable(doc, section) {
    // Construire les données du tableau
    const body = section.rows.map(row => [
        formatPDFCellContent(row.left),
        formatPDFCellContent(row.right)
    ]);

    doc.lineWidth = 0.5;
    doc.lineColor = [0, 102, 204]; // #0066CC (Couleur harmonisée)
    doc.autoTable({
        body: body,
        startY: 50, // Augmenté pour éviter le chevauchement avec l'en-tête
        margin: {
            left: FLASHCARD_CONFIG.pdfMargin,
            right: FLASHCARD_CONFIG.pdfMargin
        },
        tableWidth: 'auto',
        styles: {
            halign: 'center',
            valign: 'middle',
            cellPadding: 5,
            fontSize: 11,
            lineColor: [0, 102, 204], // #0066CC
            lineWidth: 0.3,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255]
        },
        columnStyles: {
            0: { cellWidth: FLASHCARD_CONFIG.pdfColumnWidth },
            1: { cellWidth: FLASHCARD_CONFIG.pdfColumnWidth }
        },
        theme: 'grid',
        didParseCell: function (data) {
            // Définir une hauteur de cellule fixe
            data.cell.styles.minCellHeight = FLASHCARD_CONFIG.pdfRowHeight;
            // Vider le texte pour le dessiner manuellement avec Markdown
            data.cell.text = [""];
        },
        didDrawCell: function (data) {
            const cellData = section.rows[data.row.index];
            const cardContent = data.column.index === 0 ? cellData?.left : cellData?.right;

            if (cardContent) {
                const cellX = data.cell.x;
                const cellY = data.cell.y;
                const cellWidth = data.cell.width;
                const cellHeight = data.cell.height;
                const padding = data.cell.padding('horizontal');

                let contentY = cellY + padding;

                // 1. Image si présente (centrée horizontalement, en haut de la cellule)
                if (cardContent.imageData && cardContent.imageData.dataURL) {
                    const dims = calculateDimensions(
                        cardContent.imageData.width,
                        cardContent.imageData.height,
                        FLASHCARD_CONFIG.imageMaxHeight,
                        FLASHCARD_CONFIG.imageMaxWidth
                    );
                    const imgX = cellX + (cellWidth - dims.width) / 2;
                    try {
                        doc.addImage(
                            cardContent.imageData.dataURL,
                            cardContent.imageData.mimeType?.includes('png') ? 'PNG' : 'JPEG',
                            imgX, contentY,
                            dims.width, dims.height
                        );
                    } catch (e) {
                        console.warn('[PDF] Erreur ajout image flashcard:', e);
                    }
                    // Décaler le texte sous la zone image fixe (toujours le même espace)
                    contentY += FLASHCARD_CONFIG.imageMaxHeight + 2;
                }

                // 2. Dessiner le texte principal (Markdown)
                if (cardContent.text) {
                    const style = { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] };
                    const textY = cardContent.imageData
                        ? contentY + 3
                        : cellY + (cellHeight / 3);
                    drawPDFRichText(doc, cardContent.text, cellX + padding, textY, cellWidth - 2 * padding, style, 'center');
                }

                // 3. Dessiner l'indice si présent (Markdown, gris, italique)
                if (cardContent.hint) {
                    const hintStyle = { fontSize: 9, font: PDF_FONT, fontStyle: 'italic', color: [102, 102, 102] };
                    const hintY = cellY + cellHeight - 12;
                    drawPDFRichText(doc, cardContent.hint, cellX + padding, hintY, cellWidth - 2 * padding, hintStyle, 'center');
                }
            }
        }
    });
}

/**
 * Formate le contenu d'une cellule pour le PDF
 * @param {Object|null} cardContent - Contenu de la carte
 * @returns {string} - Texte formaté
 */
function formatPDFCellContent(cardContent) {
    if (!cardContent) return '';
    return cardContent.text || '';
}

/**
 * Ajoute un tableau générique au PDF (grilles de travail, étiquettes, corrections, etc.)
 * Utilise jsPDF-AutoTable pour le rendu.
 */
function addPDFTable(doc, section, y, margin, maxWidth, pageHeight, bottomMargin) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    const style = section.style || 'default';

    // Configuration par style
    const configs = {
        workGrid: {
            headFill: [0, 102, 204], headColor: [255, 255, 255],
            lineColor: [0, 102, 204], lineWidth: 0.3,
            cellColor: [0, 0, 0], cellBold: false,
            minCellHeight: 14, halign: 'center'
        },
        cutoutLabels: {
            headFill: null, headColor: [0, 0, 0],
            lineColor: [150, 150, 150], lineWidth: 0.2,
            cellColor: [0, 0, 0], cellBold: false,
            minCellHeight: 9, halign: 'center',
            dashed: true
        },
        correctionGrid: {
            headFill: [0, 102, 204], headColor: [255, 255, 255],
            lineColor: [0, 102, 204], lineWidth: 0.3,
            cellColor: [0, 128, 0], cellBold: true,
            minCellHeight: 8, halign: 'center'
        },
        recapTable: {
            headFill: [232, 232, 232], headColor: [0, 0, 0],
            lineColor: [150, 150, 150], lineWidth: 0.2,
            cellColor: [0, 0, 0], cellBold: false,
            minCellHeight: 8, halign: 'left',
            firstColBold: true
        },
        rubricGrid: {
            headFill: [26, 82, 118], headColor: [255, 255, 255],
            lineColor: [176, 196, 222], lineWidth: 0.3,
            cellColor: [51, 51, 51], cellBold: false,
            minCellHeight: 10, halign: 'left',
            firstColBold: true, firstColFill: [235, 245, 251]
        }
    };

    const cfg = configs[style] || configs.recapTable;

    const headRow = headers.length > 0 ? [headers] : [];

    // Constantes pour les images dans les cellules de table (étiquettes D&D)
    const DND_LABEL_IMG_MAX_W = 25; // mm
    const DND_LABEL_IMG_MAX_H = 15; // mm

    // Extraire les positions des cellules image pour didDrawCell
    const cellImageMap = new Map(); // "row-col" → imageData
    const cleanRows = rows.map((row, rIdx) => row.map((cell, cIdx) => {
        if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
            if (cell.imageData && cell.imageData.dataURL) {
                cellImageMap.set(`${rIdx}-${cIdx}`, cell.imageData);
            }
            const text = cell.text || '';
            return text.replace(/\*\*(.*?)\*\*/g, '$1');
        }
        return typeof cell === 'string' ? cell.replace(/\*\*(.*?)\*\*/g, '$1') : (cell || '');
    }));

    const autoTableOpts = {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: maxWidth,
        head: headRow,
        body: cleanRows,
        theme: 'grid',
        styles: {
            halign: cfg.halign,
            valign: 'middle',
            cellPadding: 3,
            fontSize: 10,
            lineColor: cfg.lineColor,
            lineWidth: cfg.lineWidth,
            textColor: cfg.cellColor,
            fillColor: [255, 255, 255],
            font: PDF_FONT,
            fontStyle: cfg.cellBold ? 'bold' : 'normal',
            minCellHeight: cfg.minCellHeight
        },
        headStyles: {
            fillColor: cfg.headFill || [255, 255, 255],
            textColor: cfg.headColor,
            fontStyle: 'bold',
            halign: 'center',
            font: PDF_FONT
        },
        didParseCell: function(data) {
            // Fond coloré sur la première colonne (grille d'évaluation)
            if (cfg.firstColFill && data.column.index === 0 && data.section === 'body') {
                data.cell.styles.fillColor = cfg.firstColFill;
            }
            // Pour le style cutoutLabels, appliquer des bordures pointillées
            if (cfg.dashed) {
                data.cell.styles.lineWidth = 0.3;
                data.cell.styles.lineColor = [150, 150, 150];
            }
            // Première colonne en gras pour recapTable
            if (cfg.firstColBold && data.column.index === 0 && data.section === 'body') {
                data.cell.styles.fontStyle = 'bold';
            }
            // Augmenter la hauteur des cellules contenant une image
            if (data.section === 'body' && cellImageMap.has(`${data.row.index}-${data.column.index}`)) {
                data.cell.styles.minCellHeight = DND_LABEL_IMG_MAX_H + 10; // image + marge texte
            }
        },
        didDrawCell: function(data) {
            // Dessiner l'image inline dans la cellule (étiquettes D&D)
            if (data.section === 'body') {
                const imgData = cellImageMap.get(`${data.row.index}-${data.column.index}`);
                if (imgData && imgData.dataURL) {
                    const cell = data.cell;
                    const dims = calculateDimensions(
                        imgData.width, imgData.height,
                        DND_LABEL_IMG_MAX_H, DND_LABEL_IMG_MAX_W
                    );
                    // Centrer l'image horizontalement dans la cellule
                    const imgX = cell.x + (cell.width - dims.width) / 2;
                    const imgY = cell.y + 2; // marge haut
                    try {
                        doc.addImage(imgData.dataURL, 'JPEG', imgX, imgY, dims.width, dims.height);
                    } catch (e) {
                        // Fallback silencieux si l'image ne peut pas être ajoutée
                    }
                }
            }
            // Pour cutoutLabels : dessiner les bordures en pointillé
            if (cfg.dashed && data.section === 'body') {
                const cell = data.cell;
                doc.setDrawColor(...cfg.lineColor);
                doc.setLineWidth(0.2);
                // Simuler des pointillés avec des tirets
                const dashLen = 2;
                const gapLen = 1.5;

                // Bordure bas
                let x = cell.x;
                const yBottom = cell.y + cell.height;
                while (x < cell.x + cell.width) {
                    const end = Math.min(x + dashLen, cell.x + cell.width);
                    doc.line(x, yBottom, end, yBottom);
                    x = end + gapLen;
                }

                // Bordure droite
                let yy = cell.y;
                const xRight = cell.x + cell.width;
                while (yy < cell.y + cell.height) {
                    const end = Math.min(yy + dashLen, cell.y + cell.height);
                    doc.line(xRight, yy, xRight, end);
                    yy = end + gapLen;
                }
            }
        }
    };

    // Pour les bordures pointillées, masquer les bordures par défaut du thème grid
    if (cfg.dashed) {
        autoTableOpts.styles.lineWidth = 0;
        autoTableOpts.tableLineWidth = 0;
    }

    // Pour les grilles et étiquettes Drag & Drop, forcer des colonnes de largeur égale
    if (style === 'workGrid' || style === 'cutoutLabels' || style === 'correctionGrid') {
        const colCount = headers.length || (rows[0] ? rows[0].length : 3);
        const columnWidth = maxWidth / colCount;

        autoTableOpts.columnStyles = {};
        for (let i = 0; i < colCount; i++) {
            autoTableOpts.columnStyles[i] = { cellWidth: columnWidth };
        }
    }

    doc.autoTable(autoTableOpts);

    return doc.lastAutoTable.finalY + 5;
}

/**
 * Crée un document ODT à partir du contenu formaté
 * (Version simplifiée - génère un fichier texte structuré au format OpenDocument)
 */
async function createODTDocument(formattedContent) {
    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;

    // Vérifier si c'est un document de cartes imprimables (Flashcards/Dialog Cards)
    const isFlashcardDocument = formattedContent.sections.some(s => s.type === 'flashcardTable');

    if (isFlashcardDocument) {
        return createODTFlashcardDocument(formattedContent);
    }

    // Réinitialiser le collecteur d'objets Math pour ce document
    _resetOdtMathCtx();

    const zip = new window.JSZip();

    // 1. mimetype (doit être le premier fichier et non compressé)
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });

    // 2. META-INF/manifest.xml
    let manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>`;

    // 3. content.xml (Le cœur du document)
    // Vérifier si le document contient des tables pour ajouter les styles automatiques
    const hasTables = formattedContent.sections.some(s => s.type === 'table');
    let tableStylesXml = '';
    if (hasTables) {
        tableStylesXml = getODTTableAutoStyles();
    }

    // Pré-scanner les couleurs utilisées dans le contenu pour créer des styles automatiques ODT
    const usedColors = new Set();
    formattedContent.sections.forEach(s => {
        if (!s.text) return;
        const colorRe = /<span[^>]*style="[^"]*color:\s*([^;"]+)/gi;
        let m;
        while ((m = colorRe.exec(s.text)) !== null) {
            usedColors.add(cssColorToHex(m[1].trim()));
        }
    });
    let colorStylesXml = '';
    usedColors.forEach(hex => {
        colorStylesXml += `\n    <style:style style:name="Color_${hex}" style:family="text"><style:text-properties fo:color="#${hex}"/></style:style>`;
    });

    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" xmlns:math="http://www.w3.org/1998/Math/MathML" office:version="1.2">
  <office:automatic-styles>${tableStylesXml}${colorStylesXml}
    <style:style style:name="fr_math" style:family="graphic" style:parent-style-name="Formula"><style:graphic-properties style:vertical-pos="middle" style:vertical-rel="text" draw:ole-draw-aspect="1"/></style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>
      <text:p text:style-name="Title">${escapeXml(t('doc_fmt_header_title'))}</text:p>
      <text:p text:style-name="Date">${escapeXml(t('doc_fmt_generation_date') + new Date().toLocaleDateString(currentLang || 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }))}</text:p>
`;

    let imageCounter = 0;

    formattedContent.sections.forEach(section => {
        switch (section.type) {
            case 'header':
                const level = section.level || 1;
                contentXml += `      <text:h text:outline-level="${level}" text:style-name="Heading_${level}">${parseODTWithMath(section.text)}</text:h>\n`;
                break;
            case 'paragraph': {
                const pStyle = `P_${section.style || 'default'}`;
                // Détecter les listes dans le texte (• item ou 1. item)
                const pLines = (section.text || '').split('\n').filter(l => l.trim());
                const hasList = pLines.some(l => /^\s*[•\-]\s/.test(l) || /^\s*\d+\.\s/.test(l));
                if (hasList) {
                    const before = [], listItems = [], after = [];
                    let inList = false;
                    let isNumbered = false;
                    for (const line of pLines) {
                        const bulletMatch = line.trim().match(/^[•\-]\s+(.*)/);
                        const numMatch = line.trim().match(/^\d+\.\s+(.*)/);
                        if (bulletMatch || numMatch) {
                            inList = true;
                            if (numMatch) isNumbered = true;
                            listItems.push(bulletMatch ? bulletMatch[1] : numMatch[1]);
                        } else if (inList) {
                            after.push(line.trim());
                        } else {
                            before.push(line.trim());
                        }
                    }
                    if (before.length) contentXml += `      <text:p text:style-name="${pStyle}">${parseODTWithMath(before.join(' '))}</text:p>\n`;
                    if (listItems.length) {
                        // L1 = puces, L2 = numérotée
                        const listStyle = isNumbered ? 'L2' : 'L1';
                        contentXml += `      <text:list text:style-name="${listStyle}">\n`;
                        for (const item of listItems) {
                            contentXml += `        <text:list-item><text:p text:style-name="P_bullet_default">${parseODTWithMath(item)}</text:p></text:list-item>\n`;
                        }
                        contentXml += `      </text:list>\n`;
                    }
                    if (after.length) contentXml += `      <text:p text:style-name="${pStyle}">${parseODTWithMath(after.join(' '))}</text:p>\n`;
                } else {
                    contentXml += `      <text:p text:style-name="${pStyle}">${parseODTWithMath(section.text)}</text:p>\n`;
                }
                break;
            }
            case 'bulletPoint':
                const bullStyle = section.style ? `P_bullet_${section.style}` : 'P_bullet_default';
                contentXml += `      <text:list text:style-name="L1"><text:list-item><text:p text:style-name="${bullStyle}">${parseODTWithMath(section.text)}</text:p></text:list-item></text:list>\n`;
                break;
            case 'checkbox':
                const checkStyle = section.style ? `P_checkbox_${section.style}` : 'P_checkbox';
                contentXml += `      <text:p text:style-name="${checkStyle}">[  ] ${parseODTWithMath(section.text)}</text:p>\n`;
                break;
            case 'separator':
                contentXml += `      <text:p text:style-name="Separator"/>\n`;
                break;
            case 'pageBreak':
                contentXml += `      <text:p text:style-name="PageBreak"/>\n`;
                break;
            case 'image':
                if (section.imageError) {
                    contentXml += `      <text:p text:style-name="ErrorText">${escapeXml(section.errorText || '[Image non trouvée]')}</text:p>\n`;
                } else if (section.imageData && section.imageData.blob) {
                    const imageName = `Pictures/image${++imageCounter}.${section.imageData.mimeType.split('/')[1] || 'jpg'}`;
                    zip.file(imageName, section.imageData.blob);
                    manifestXml += `  <manifest:file-entry manifest:full-path="${imageName}" manifest:media-type="${section.imageData.mimeType}"/>\n`;

                    const dims = calculateDimensions(section.imageData.width, section.imageData.height, section.imgSizeMm || (section.fillWidth ? 9999 : ODT_FIXED_HEIGHT), section.imgSizeMm || MAX_WIDTH_ODT);

                    contentXml += `      <text:p text:style-name="ImagePara">
        <draw:frame draw:name="Image${imageCounter}" text:anchor-type="as-char" svg:width="${dims.width}mm" svg:height="${dims.height}mm" draw:z-index="0">
          <draw:image xlink:href="${imageName}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
        </draw:frame>
      </text:p>\n`;
                    if (section.caption || section.alt) {
                        contentXml += `      <text:p text:style-name="Caption">${escapeXml(section.caption || section.alt)}</text:p>\n`;
                    }
                }
                break;
            case 'table': {
                const tableResult = generateODTTable(section, ++imageCounter, zip, imageCounter, manifestXml);
                contentXml += tableResult.xml;
                imageCounter = tableResult.imageCounter;
                manifestXml = tableResult.manifestXml;
                break;
            }
        }
    });

    contentXml += `    </office:text>
  </office:body>
</office:document-content>`;

    // Injecter les objets Math (Object N/content.xml) dans le ZIP
    const mathManifestEntries = _injectMathObjectsIntoZip(zip);
    manifestXml += mathManifestEntries;

    manifestXml += `\n</manifest:manifest>`;
    zip.file('META-INF/manifest.xml', manifestXml);
    zip.file('content.xml', contentXml);

    // 4. styles.xml — Espacements alignés sur le DOCX (twips → cm)
    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    office:version="1.2">
  <office:font-face-decls>
    <style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:language="${locale.language}" fo:country="${locale.country}"/>
    </style:default-style>

    <!-- Titre : 24pt gras centré, after 200tw = 0.35cm -->
    <style:style style:name="Title" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0cm" fo:margin-bottom="0.35cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="24pt" fo:font-weight="bold" fo:color="#000000"/>
    </style:style>

    <!-- Date : 12pt italique droite, after 400tw = 0.7cm -->
    <style:style style:name="Date" style:family="paragraph">
      <style:paragraph-properties fo:text-align="end" fo:margin-top="0cm" fo:margin-bottom="0.7cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-style="italic"/>
    </style:style>

    <!-- Titres : before 240tw = 0.42cm, after 120tw = 0.21cm -->
    <style:style style:name="Heading_1" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.42cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="18pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>
    <style:style style:name="Heading_2" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.42cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="14pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>
    <style:style style:name="Heading_3" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.42cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>

    <!-- Paragraphes : before/after 120tw = 0.21cm -->
    <style:style style:name="P_default" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_description" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-style="italic" fo:color="#333333"/>
    </style:style>
    <style:style style:name="P_instructions" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>
    <style:style style:name="P_wordList" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.1cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="P_metadata" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="10pt" fo:color="#666666"/>
    </style:style>
    <style:style style:name="P_answersTitle" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="P_question" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="13pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="P_correctAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="P_wrongAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:color="#666666"/>
    </style:style>
    <style:style style:name="P_correctWord" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="P_feedbackTitle" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>
    <style:style style:name="P_tip" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="11pt" fo:font-style="italic" fo:color="#0066CC"/>
    </style:style>
    <style:style style:name="P_blanksText" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:color="#333333"/>
    </style:style>
    <style:style style:name="P_blanksCorrection" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_subtitle" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:font-style="italic" fo:color="#444444"/>
    </style:style>
    <style:style style:name="P_timelineEra" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#2E75B6"/>
    </style:style>
    <style:style style:name="P_orderedParagraph" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_definition" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_crosswordClue" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_flashcardFront" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="P_flashcardBack" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>

    <!-- Puces : before/after 60tw = 0.1cm (plus serré que les paragraphes) -->
    <style:style style:name="P_bullet_default" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_bullet_correctAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="P_bullet_wrongAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:color="#666666"/>
    </style:style>

    <!-- Séparateur : réduit à 0.10cm pour compenser la hauteur de ligne vide
         et aligner visuellement avec le rendu DOCX (10pt dans Word) -->
    <style:style style:name="Separator" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.10cm" fo:margin-bottom="0.10cm"/>
    </style:style>

    <!-- Cases à cocher : before/after 60tw = 0.1cm, indent 360tw = 0.64cm -->
    <style:style style:name="P_checkbox" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.64cm" fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="P_checkbox_correctAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.64cm" fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="P_checkbox_wrongAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.64cm" fo:margin-top="0.1cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:color="#666666"/>
    </style:style>

    <!-- Éléments spéciaux -->
    <style:style style:name="ErrorText" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.21cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:color="#FF0000" fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Caption" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0cm" fo:margin-bottom="0.21cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="10pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>
    <style:style style:name="ImagePara" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0.21cm" fo:margin-bottom="0.1cm"/>
    </style:style>
    <style:style style:name="PageBreak" style:family="paragraph">
      <style:paragraph-properties fo:break-before="page"/>
    </style:style>

    <!-- Pied de page -->
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="9pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>

    <!-- Liste à puces -->
    <text:list-style style:name="L1">
      <text:list-level-style-bullet text:level="1" text:bullet-char="\u2022" style:num-suffix="." style:num-format="">
        <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
          <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>
        </style:list-level-properties>
      </text:list-level-style-bullet>
    </text:list-style>

    <!-- Liste numérotée -->
    <text:list-style style:name="L2">
      <text:list-level-style-number text:level="1" style:num-format="1" style:num-suffix=". " text:start-value="1">
        <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
          <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>
        </style:list-level-properties>
      </text:list-level-style-number>
    </text:list-style>

    <!-- Styles de texte inline -->
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="BoldGreen" style:family="text">
      <style:text-properties fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
    <style:style style:name="Strikethrough" style:family="text">
      <style:text-properties style:text-line-through-style="solid"/>
    </style:style>
    <style:style style:name="Sub" style:family="text">
      <style:text-properties style:text-position="sub 70%"/>
    </style:style>
    <style:style style:name="Sup" style:family="text">
      <style:text-properties style:text-position="super 70%"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties
          fo:page-width="21.00cm"
          fo:page-height="29.70cm"
          style:num-format="1"
          style:print-orientation="portrait"
          fo:margin-top="2.54cm"
          fo:margin-bottom="2.54cm"
          fo:margin-left="2.54cm"
          fo:margin-right="2.54cm"/>
      <style:header-style/>
      <style:footer-style/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="pm1">
      <style:footer>
        <text:p text:style-name="Footer">${escapeXml(t('doc_fmt_footer_text'))}</text:p>
      </style:footer>
    </style:master-page>
  </office:master-styles>
</office:document-styles>`;
    zip.file('styles.xml', stylesXml);

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Génère les styles automatiques ODT nécessaires pour les tableaux génériques.
 * Inclut les styles pour les 4 variantes : workGrid, cutoutLabels, correctionGrid, recapTable.
 */
function getODTTableAutoStyles() {
    // NB : ne PAS envelopper dans <office:automatic-styles> — le résultat est inséré
    // à l'intérieur du bloc <office:automatic-styles> unique de createODTDocument.
    // Un <office:automatic-styles> imbriqué est invalide en ODF et fait que LibreOffice
    // ignore silencieusement ces styles → cellules de tableau sans bordure/fond.
    return `
    <!-- Styles de table génériques -->
    <style:style style:name="GenTable" style:family="table">
      <style:table-properties style:width="16cm" table:align="margins"/>
    </style:style>
    <style:style style:name="GenTableCol" style:family="table-column">
      <style:table-column-properties style:use-optimal-column-width="true"/>
    </style:style>

    <!-- Colonnes fixes pour Drag & Drop (largeur = 16cm / nombre de colonnes) -->
    <style:style style:name="DnDTableCol1" style:family="table-column">
      <style:table-column-properties style:column-width="16cm"/>
    </style:style>
    <style:style style:name="DnDTableCol2" style:family="table-column">
      <style:table-column-properties style:column-width="8cm"/>
    </style:style>
    <style:style style:name="DnDTableCol3" style:family="table-column">
      <style:table-column-properties style:column-width="5.33cm"/>
    </style:style>

    <!-- workGrid : en-tête bleu, lignes hautes -->
    <style:style style:name="WG_HeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.04cm solid #0066CC" fo:background-color="#0066CC"/>
    </style:style>
    <style:style style:name="WG_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.04cm solid #0066CC"/>
    </style:style>
    <style:style style:name="WG_Row" style:family="table-row">
      <style:table-row-properties style:min-row-height="1.4cm"/>
    </style:style>
    <style:style style:name="WG_HeaderText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#FFFFFF"/>
    </style:style>

    <!-- cutoutLabels : bordures pointillées -->
    <style:style style:name="CL_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.25cm" fo:border="0.03cm dashed #999999"/>
    </style:style>
    <style:style style:name="CL_Row" style:family="table-row">
      <style:table-row-properties style:min-row-height="1cm"/>
    </style:style>
    <style:style style:name="CL_CellText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>

    <!-- correctionGrid : en-tête bleu, texte vert gras -->
    <style:style style:name="CG_HeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.04cm solid #0066CC" fo:background-color="#0066CC"/>
    </style:style>
    <style:style style:name="CG_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.04cm solid #0066CC"/>
    </style:style>
    <style:style style:name="CG_CellText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>

    <!-- recapTable : en-tête gris clair -->
    <style:style style:name="RT_HeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #999999" fo:background-color="#E8E8E8"/>
    </style:style>
    <style:style style:name="RT_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #999999"/>
    </style:style>
    <style:style style:name="RT_HeaderText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="RT_BoldText" style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="RT_CellText" style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>

    <!-- rubricGrid : grille d'évaluation critériée (Devoir) -->
    <style:style style:name="RG_HeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #B0C4DE" fo:background-color="#1A5276"/>
    </style:style>
    <style:style style:name="RG_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #B0C4DE"/>
    </style:style>
    <style:style style:name="RG_FirstColCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #B0C4DE" fo:background-color="#EBF5FB"/>
    </style:style>
    <style:style style:name="RG_HeaderText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="11pt" fo:font-weight="bold" fo:color="#FFFFFF"/>
    </style:style>
    <style:style style:name="RG_BoldText" style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="11pt" fo:font-weight="bold" fo:color="#1A5276"/>
    </style:style>
    <style:style style:name="RG_CellText" style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="11pt" fo:color="#333333"/>
    </style:style>

    <!-- default : tableau de contenu générique (bordures noires nettes, lisibles dans LibreOffice) -->
    <style:style style:name="DEF_HeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #000000" fo:background-color="#E8E8E8"/>
    </style:style>
    <style:style style:name="DEF_Cell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.15cm" fo:border="0.03cm solid #000000"/>
    </style:style>
    <style:style style:name="DEF_HeaderText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:font-weight="bold" fo:color="#000000"/>
    </style:style>
    <style:style style:name="DEF_CellText" style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:color="#000000"/>
    </style:style>

    <!-- Texte centré générique pour cellules -->
    <style:style style:name="CellCenter" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>`;
}

/**
 * Génère le XML ODT pour un tableau générique.
 * @param {Object} section - Section de type 'table'
 * @param {number} tableId - Identifiant unique pour le nom du tableau
 * @returns {string} XML du tableau
 */
function generateODTTable(section, tableId, zip, imageCounter, manifestXml) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    const style = section.style || 'default';
    const colCount = headers.length || (rows[0] ? rows[0].length : 2);

    // Constantes pour les images dans les cellules (étiquettes D&D)
    const DND_LABEL_IMG_MAX_W = 40; // mm
    const DND_LABEL_IMG_MAX_H = 20; // mm

    // Préfixes de style selon le type
    const styleMap = {
        default: { headerCell: 'DEF_HeaderCell', cell: 'DEF_Cell', row: '', headerText: 'DEF_HeaderText', cellText: 'DEF_CellText' },
        workGrid: { headerCell: 'WG_HeaderCell', cell: 'WG_Cell', row: 'WG_Row', headerText: 'WG_HeaderText', cellText: 'CellCenter' },
        cutoutLabels: { headerCell: 'CL_Cell', cell: 'CL_Cell', row: 'CL_Row', headerText: 'CL_CellText', cellText: 'CL_CellText' },
        correctionGrid: { headerCell: 'CG_HeaderCell', cell: 'CG_Cell', row: '', headerText: 'WG_HeaderText', cellText: 'CG_CellText' },
        recapTable: { headerCell: 'RT_HeaderCell', cell: 'RT_Cell', row: '', headerText: 'RT_HeaderText', cellText: 'RT_CellText', firstColText: 'RT_BoldText' },
        rubricGrid: { headerCell: 'RG_HeaderCell', cell: 'RG_Cell', row: '', headerText: 'RG_HeaderText', cellText: 'RG_CellText', firstColText: 'RG_BoldText', firstColCell: 'RG_FirstColCell' }
    };

    const sm = styleMap[style] || styleMap.recapTable;

    // Pour les grilles et étiquettes Drag & Drop, utiliser des colonnes de largeur fixe
    // Choisir le style selon le nombre de colonnes (1, 2 ou 3)
    const isDnD = (style === 'workGrid' || style === 'cutoutLabels' || style === 'correctionGrid');
    let columnStyle = 'GenTableCol';
    if (isDnD) {
        if (colCount === 1) columnStyle = 'DnDTableCol1';
        else if (colCount === 2) columnStyle = 'DnDTableCol2';
        else columnStyle = 'DnDTableCol3';
    }

    let xml = `      <table:table table:name="Table${tableId}" table:style-name="GenTable">\n`;
    xml += `        <table:table-column table:style-name="${columnStyle}" table:number-columns-repeated="${colCount}"/>\n`;

    // En-tête
    if (headers.length > 0) {
        xml += `        <table:table-row>\n`;
        headers.forEach(h => {
            xml += `          <table:table-cell table:style-name="${sm.headerCell}">\n`;
            xml += `            <text:p text:style-name="${sm.headerText}">${escapeXml(h)}</text:p>\n`;
            xml += `          </table:table-cell>\n`;
        });
        xml += `        </table:table-row>\n`;
    }

    // Lignes de données
    rows.forEach(row => {
        const rowStyle = sm.row ? ` table:style-name="${sm.row}"` : '';
        xml += `        <table:table-row${rowStyle}>\n`;
        for (let i = 0; i < colCount; i++) {
            const cellRaw = (row[i] !== undefined && row[i] !== null) ? row[i] : '';
            const isObjectCell = cellRaw && typeof cellRaw === 'object' && !Array.isArray(cellRaw);
            const cellText = isObjectCell ? (cellRaw.text || '') : cellRaw;
            const cellImageData = isObjectCell ? cellRaw.imageData : null;

            const textStyle = (sm.firstColText && i === 0) ? sm.firstColText : sm.cellText;
            const cellStyle = (sm.firstColCell && i === 0) ? sm.firstColCell : sm.cell;
            xml += `          <table:table-cell table:style-name="${cellStyle}">\n`;

            // Image inline si présente
            if (cellImageData && cellImageData.blob && zip) {
                imageCounter++;
                const ext = cellImageData.mimeType?.split('/')[1] || 'jpg';
                const imageName = `Pictures/table${tableId}_cell${imageCounter}.${ext}`;
                zip.file(imageName, cellImageData.blob);
                manifestXml += `  <manifest:file-entry manifest:full-path="${imageName}" manifest:media-type="${cellImageData.mimeType}"/>\n`;

                const dims = calculateDimensions(
                    cellImageData.width, cellImageData.height,
                    DND_LABEL_IMG_MAX_H, DND_LABEL_IMG_MAX_W
                );
                xml += `            <text:p text:style-name="${textStyle}">
              <draw:frame draw:name="TableImg${imageCounter}" text:anchor-type="as-char" svg:width="${dims.width.toFixed(1)}mm" svg:height="${dims.height.toFixed(1)}mm" draw:z-index="0">
                <draw:image xlink:href="${imageName}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
              </draw:frame>
            </text:p>\n`;
            }

            xml += `            <text:p text:style-name="${textStyle}">${parseODTWithMath(cellText)}</text:p>\n`;
            xml += `          </table:table-cell>\n`;
        }
        xml += `        </table:table-row>\n`;
    });

    xml += `      </table:table>\n`;
    return { xml, imageCounter, manifestXml };
}

/**
 * Échappe les caractères spéciaux pour le XML
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&"']/g, function (m) {
        switch (m) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return m;
        }
    });
}

/**
 * Crée un document ODT spécifique pour les cartes imprimables
 * Configuration : marges 1,27 cm, tableaux 2x4 pour impression recto-verso
 */
async function createODTFlashcardDocument(formattedContent) {
    // Réinitialiser le collecteur d'objets Math
    _resetOdtMathCtx();

    const zip = new window.JSZip();

    // 1. mimetype
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });

    // Compteur d'images et entrées manifest additionnelles
    let imageCounter = 0;
    let manifestImageEntries = '';

    // 3. content.xml avec tableaux de cartes
    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
    xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
    xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:math="http://www.w3.org/1998/Math/MathML"
    office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="fr_math" style:family="graphic" style:parent-style-name="Formula"><style:graphic-properties style:vertical-pos="middle" style:vertical-rel="text" draw:ole-draw-aspect="1"/></style:style>
    <!-- En-tête : titre centré 18pt gras bleu (identique au Heading1 DOCX) -->
    <style:style style:name="Title" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0cm" fo:margin-bottom="0.35cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="18pt" fo:font-weight="bold" fo:color="#0066CC"/>
    </style:style>
    <!-- Date : 10pt italique alignée à droite -->
    <style:style style:name="Date" style:family="paragraph">
      <style:paragraph-properties fo:text-align="end" fo:margin-top="0cm" fo:margin-bottom="0.70cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="10pt" fo:font-style="italic"/>
    </style:style>
    <!-- Titre de l'activité : 14pt gras centré (audit Sucrerie 2026-07-05, F6) -->
    <style:style style:name="ActivityTitle" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-bottom="0.4cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="14pt" fo:font-weight="bold"/>
    </style:style>
    <!-- Styles de texte inline pour le Markdown dans les cellules -->
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="BoldGreen" style:family="text">
      <style:text-properties fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
    <style:style style:name="Strikethrough" style:family="text">
      <style:text-properties style:text-line-through-style="solid"/>
    </style:style>
    <style:style style:name="Sub" style:family="text">
      <style:text-properties style:text-position="sub 70%"/>
    </style:style>
    <style:style style:name="Sup" style:family="text">
      <style:text-properties style:text-position="super 70%"/>
    </style:style>
    <style:style style:name="FlashcardTable" style:family="table">
      <style:table-properties style:width="18.46cm" table:align="center"/>
    </style:style>
    <style:style style:name="FlashcardColumn" style:family="table-column">
      <style:table-column-properties style:column-width="9.2cm"/>
    </style:style>
    <style:style style:name="FlashcardRow" style:family="table-row">
      <style:table-row-properties style:row-height="5.5cm" style:min-row-height="5.5cm" fo:keep-together="always"/>
    </style:style>
    <style:style style:name="FlashcardCell" style:family="table-cell">
      <style:table-cell-properties fo:padding="0.3cm" fo:border="1pt solid #0066CC" style:vertical-align="middle"/>
    </style:style>
    <style:style style:name="CellContent" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="CellHint" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0.3cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="10pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="9pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>
    <style:style style:name="PageBreakStyle" style:family="paragraph">
      <style:paragraph-properties fo:break-before="page"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>
`;

    let tableCounter = 0;
    let isFirstTable = true;

    formattedContent.sections.forEach(section => {
        if (section.type === 'flashcardTable') {
            tableCounter++;

            // Saut de page avant chaque tableau sauf le premier
            if (!isFirstTable) {
                contentXml += `      <text:p text:style-name="PageBreakStyle"/>\n`;
            }
            isFirstTable = false;

            contentXml += `      <text:p text:style-name="Title">${escapeXml(t('doc_fmt_header_title'))}</text:p>
      <text:p text:style-name="Date">${escapeXml(t('doc_fmt_generation_date') + new Date().toLocaleDateString(currentLang || 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }))}</text:p>\n`;

            // Titre de l'activité, une seule fois en tête du document (audit
            // Sucrerie 2026-07-05, F6 : les cartes sortaient sans aucun titre).
            if (tableCounter === 1 && formattedContent.title) {
                contentXml += `      <text:p text:style-name="ActivityTitle">${escapeXml(formattedContent.title)}</text:p>\n`;
            }

            contentXml += generateODTFlashcardTable(section, tableCounter, zip, imageCounter, manifestImageEntries, (newCounter, newEntries) => {
                imageCounter = newCounter;
                manifestImageEntries = newEntries;
            });
        }
    });

    contentXml += `    </office:text>
  </office:body>
</office:document-content>`;
    zip.file('content.xml', contentXml);

    // Injecter les objets Math dans le ZIP
    const mathManifestEntries = _injectMathObjectsIntoZip(zip);

    // 2. META-INF/manifest.xml (avec entrées d'images + math dynamiques)
    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
${manifestImageEntries}${mathManifestEntries}
</manifest:manifest>`;
    zip.file('META-INF/manifest.xml', manifestXml);

    // 4. styles.xml avec configuration de page
    const stylesXml = generateODTFlashcardStyles();
    zip.file('styles.xml', stylesXml);

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Génère le XML d'un tableau de cartes pour ODT
 * @param {Object} section - Section flashcardTable
 * @param {number} tableId - Identifiant du tableau
 * @param {JSZip} zip - Archive ZIP pour ajouter les images
 * @param {number} imageCounter - Compteur d'images courant
 * @param {string} manifestEntries - Entrées manifest accumulées
 * @param {Function} updateCounters - Callback pour mettre à jour compteur et manifest
 */
function generateODTFlashcardTable(section, tableId, zip, imageCounter, manifestEntries, updateCounters) {
    let xml = `      <table:table table:name="FlashcardTable${tableId}" table:style-name="FlashcardTable">
        <table:table-column table:style-name="FlashcardColumn" table:number-columns-repeated="2"/>
`;

    section.rows.forEach(row => {
        const leftResult = formatODTCellContent(row.left, zip, imageCounter, manifestEntries);
        imageCounter = leftResult.imageCounter;
        manifestEntries = leftResult.manifestEntries;

        const rightResult = formatODTCellContent(row.right, zip, imageCounter, manifestEntries);
        imageCounter = rightResult.imageCounter;
        manifestEntries = rightResult.manifestEntries;

        xml += `        <table:table-row table:style-name="FlashcardRow">
          <table:table-cell table:style-name="FlashcardCell">
${leftResult.xml}
          </table:table-cell>
          <table:table-cell table:style-name="FlashcardCell">
${rightResult.xml}
          </table:table-cell>
        </table:table-row>
`;
    });

    xml += `      </table:table>\n`;

    // Mettre à jour les compteurs dans le parent
    updateCounters(imageCounter, manifestEntries);

    return xml;
}

/**
 * Formate le contenu d'une cellule pour ODT (avec support d'images)
 * @param {Object|null} cardContent - Contenu de la carte
 * @param {JSZip} zip - Archive ZIP
 * @param {number} imageCounter - Compteur d'images
 * @param {string} manifestEntries - Entrées manifest
 * @returns {{xml: string, imageCounter: number, manifestEntries: string}}
 */
function formatODTCellContent(cardContent, zip, imageCounter, manifestEntries) {
    if (!cardContent) {
        return {
            xml: '            <text:p text:style-name="CellContent"></text:p>',
            imageCounter,
            manifestEntries
        };
    }

    let xml = '';

    // Image si présente
    if (cardContent.imageData && cardContent.imageData.blob) {
        imageCounter++;
        const ext = cardContent.imageData.mimeType?.split('/')[1] || 'jpg';
        const imageName = `Pictures/flashcard${imageCounter}.${ext}`;
        zip.file(imageName, cardContent.imageData.blob);
        manifestEntries += `  <manifest:file-entry manifest:full-path="${imageName}" manifest:media-type="${cardContent.imageData.mimeType}"/>\n`;

        const dims = calculateDimensions(
            cardContent.imageData.width,
            cardContent.imageData.height,
            FLASHCARD_CONFIG.imageMaxHeight,
            FLASHCARD_CONFIG.imageMaxWidth
        );

        xml += `            <text:p text:style-name="CellContent">
              <draw:frame draw:name="FlashImg${imageCounter}" text:anchor-type="as-char" svg:width="${dims.width.toFixed(1)}mm" svg:height="${dims.height.toFixed(1)}mm" draw:z-index="0">
                <draw:image xlink:href="${imageName}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
              </draw:frame>
            </text:p>\n`;
    }

    // Texte principal
    xml += `            <text:p text:style-name="CellContent">${parseODTWithMath(cardContent.text || '')}</text:p>`;

    // Indice
    if (cardContent.hint) {
        xml += `\n            <text:p text:style-name="CellHint">${parseODTWithMath(cardContent.hint)}</text:p>`;
    }

    return { xml, imageCounter, manifestEntries };
}

/**
 * Génère les styles ODT pour les cartes imprimables avec marges de page personnalisées
 */
function generateODTFlashcardStyles() {
    const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;

    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    office:version="1.2">
  <office:font-face-decls>
    <style:font-face style:name="Arial" svg:font-family="Arial" style:font-family-generic="swiss"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Arial" fo:font-size="12pt" fo:language="${locale.language}" fo:country="${locale.country}"/>
    </style:default-style>
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="9pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties
          fo:page-width="21cm"
          fo:page-height="29.7cm"
          fo:margin-top="1.27cm"
          fo:margin-bottom="1.27cm"
          fo:margin-left="1.27cm"
          fo:margin-right="1.27cm"
          style:print-orientation="portrait"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="pm1">
      <style:footer>
        <text:p text:style-name="Footer">${escapeXml(t('doc_fmt_footer_text'))}</text:p>
      </style:footer>
    </style:master-page>
  </office:master-styles>
</office:document-styles>`;
}

/**
 * Remplace les caractères Unicode absents de la police Liberation Sans (PDF)
 * par des équivalents lisibles. Nécessaire car Liberation Sans ne couvre pas
 * les blocs Letterlike Symbols (ℝ,ℕ,ℤ…) ni certains Modifier Letters.
 * Arial (DOCX/ODT) les supporte, donc cette sanitisation est PDF-only.
 */
function sanitizeForPDFFont(formattedContent) {
    if (!formattedContent) return;

    // Caractères absents de Liberation Sans → équivalents lisibles
    // (vérifié via fontTools sur LiberationSans-Regular.ttf)
    const map = {
        // Double-struck (Letterlike Symbols U+2100-214F)
        'ℝ': 'R', 'ℕ': 'N', 'ℤ': 'Z', 'ℚ': 'Q', 'ℂ': 'C', 'ℙ': 'P', 'ℍ': 'H', 'ⅎ': 'F',
        // Symboles math absents de Liberation Sans — fallbacks ASCII universels
        // (vérifiés via fontTools sur LiberationSans-Regular.ttf)
        '∀': 'forall ', '∃': 'exists ', '∄': '!exists ',
        '∅': '{}', '∇': 'nabla ',
        '∈': ' in ', '∉': ' notin ',
        '∪': ' U ', '⊂': ' c ', '⊃': ' ) ',
        '⊆': ' c= ', '⊇': ' )= ',
        '∧': ' /\\ ', '∨': ' \\/ ',
        '↦': ' |-> ', '⇒': ' => ', '≅': ' ~= ',
        // Exposants lettres (Phonetic Extensions U+1D00-1DBF)
        'ᵃ': '^a', 'ᵇ': '^b', 'ᶜ': '^c', 'ᵈ': '^d', 'ᵉ': '^e', 'ᶠ': '^f', 'ᵍ': '^g',
        'ᵏ': '^k', 'ᵐ': '^m', 'ᵒ': '^o', 'ᵖ': '^p', 'ᵗ': '^t', 'ᵘ': '^u', 'ᵛ': '^v', 'ᶻ': '^z',
        // Indices lettres (Phonetic Extensions U+1D62-1D65, Latin Extended-C)
        'ᵢ': 'i', 'ⱼ': 'j', 'ᵣ': 'r', 'ᵤ': 'u', 'ᵥ': 'v'
    };

    // Construire une regex unique pour remplacer en un seul passage
    const chars = Object.keys(map).join('');
    if (!chars) return;
    const regex = new RegExp('[' + chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']', 'g');

    function sanitize(text) {
        if (!text || typeof text !== 'string') return text;
        return text.replace(regex, ch => map[ch] || ch);
    }

    if (formattedContent.title) {
        formattedContent.title = sanitize(formattedContent.title);
    }
    if (formattedContent.sections && Array.isArray(formattedContent.sections)) {
        for (const section of formattedContent.sections) {
            if (section.text) {
                section.text = sanitize(section.text);
            }
        }
    }
}

/**
 * Génère un nom de fichier unique basé sur le type d'activité (moduleKey)
 */
function generateFileName(moduleKey, extension) {
    const now = new Date();
    const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const cleanType = moduleKey
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;

    return `${cleanType}-caramel-${dateString}-${lang}.${extension}`;
}

/**
 * Télécharge un blob
 */
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Convertit une couleur CSS (rgb, hex, nommée) en hex 6 digits pour docx.js
 * @param {string} color — ex: "rgb(39, 174, 96)", "#27ae60", "red"
 * @returns {string} — ex: "27ae60"
 */
function cssColorToHex(color) {
    if (!color) return '000000';
    const trimmed = color.trim();

    // Déjà en hex
    if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.replace('#', '');
    if (/^#?[0-9a-fA-F]{3}$/.test(trimmed)) {
        const short = trimmed.replace('#', '');
        return short[0] + short[0] + short[1] + short[1] + short[2] + short[2];
    }

    // rgb(r, g, b)
    const rgbMatch = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return r + g + b;
    }

    // Couleurs CSS nommées (les plus courantes)
    const named = {
        'red': 'ff0000', 'blue': '0000ff', 'green': '008000', 'black': '000000',
        'white': 'ffffff', 'orange': 'ffa500', 'purple': '800080', 'yellow': 'ffff00',
        'gray': '808080', 'grey': '808080', 'pink': 'ffc0cb', 'brown': 'a52a2a'
    };
    return named[trimmed.toLowerCase()] || '000000';
}

/**
 * Aplatit les <span> que les parseurs inline ne savent pas styler : seuls les
 * spans porteurs d'une couleur (`style="…color…"`) produisent un style de run —
 * les autres (font-size, etc., typiques du rich text CKEditor) étaient recrachés
 * littéralement dans le document (audit Sucrerie 2026-07-05, F2). On déballe en
 * boucle pour gérer l'imbrication `<span color><span font-size>…</span></span>`.
 *
 * @param {string} text
 * @returns {string}
 */
function unwrapNonColorSpans(text) {
    let out = String(text == null ? '' : text);
    let prev;
    do {
        prev = out;
        out = out.replace(/<span(?![^>]*style="[^"]*color)[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    } while (out !== prev);
    return out;
}

/**
 * Parse Markdown (**gras**, *italique*, ***gras+vert***) et retourne des TextRuns pour docx.js
 */
function parseMarkdownToTextRuns(text, baseStyle = {}) {
    const { TextRun, ExternalHyperlink } = window.docx;
    const runs = [];
    if (!text) return runs;

    // Les spans sans couleur (font-size…) n'apportent aucun style de run : on
    // les déballe pour que leur contenu (Markdown, spans couleur imbriqués) soit
    // parsé au lieu de sortir littéralement (audit F2).
    text = unwrapNonColorSpans(text);

    // Regex pour Markdown et HTML inline supportés
    // Ordre de priorité : HTML tags d'abord, puis Markdown
    const regex = /(___LINK_\d+___|\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*[^*]+?\*|<u>.*?<\/u>|<s>.*?<\/s>|<sub>.*?<\/sub>|<sup>.*?<\/sup>|<span[^>]*style="[^"]*color[^"]*"[^>]*>.*?<\/span>)/gs;

    // Extraire les liens avant le split (car ils contiennent des < > qui perturbent)
    const links = [];
    let processedText = text.replace(/<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (match, href, linkText) => {
        const idx = links.length;
        links.push({ href, text: linkText });
        return `___LINK_${idx}___`;
    });

    const parts = processedText.split(regex);

    parts.forEach(part => {
        if (!part) return;

        // Placeholder de lien
        const linkMatch = part.match(/^___LINK_(\d+)___$/);
        if (linkMatch) {
            const link = links[parseInt(linkMatch[1])];
            // Le texte d'un lien peut porter des marqueurs Markdown hérités de
            // cleanHtml (<a><em>x</em></a> → *x*) : on les retire — le lien est
            // déjà souligné/coloré, les émettre littéralement polluait le
            // document (audit F2).
            const linkText = link ? String(link.text).replace(/<[^>]+>/g, '').replace(/\*+/g, '') : '';
            if (link && ExternalHyperlink) {
                runs.push(new ExternalHyperlink({
                    children: [new TextRun({
                        text: linkText,
                        color: '0066CC',
                        underline: { type: 'single' },
                        ...baseStyle
                    })],
                    link: link.href
                }));
            } else if (link) {
                runs.push(new TextRun({ text: `${linkText} (${link.href})`, color: '0066CC', ...baseStyle }));
            }
            return;
        }

        // <span style="color: ...">texte</span>
        const colorMatch = part.match(/^<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>$/s);
        if (colorMatch) {
            const color = cssColorToHex(colorMatch[1]);
            const inner = colorMatch[2];
            // Le contenu d'un span couleur peut porter du Markdown (**…**, issu de
            // cleanHtml sur <strong>/<em>) ou d'autres tags inline : re-parser
            // récursivement avec la couleur en style de base, au lieu d'émettre
            // les marqueurs littéraux dans le document (audit F2).
            if (/\*|<[a-z]/i.test(inner)) {
                runs.push(...parseMarkdownToTextRuns(inner, { color, ...baseStyle }));
            } else {
                runs.push(new TextRun({ text: inner, color, ...baseStyle }));
            }
            return;
        }

        // <u>souligné</u>
        const uMatch = part.match(/^<u>(.*?)<\/u>$/s);
        if (uMatch) {
            runs.push(new TextRun({ text: uMatch[1], underline: { type: 'single' }, ...baseStyle }));
            return;
        }

        // <s>barré</s>
        const sMatch = part.match(/^<s>(.*?)<\/s>$/s);
        if (sMatch) {
            runs.push(new TextRun({ text: sMatch[1], strike: true, ...baseStyle }));
            return;
        }

        // <sub>indice</sub>
        const subMatch = part.match(/^<sub>(.*?)<\/sub>$/s);
        if (subMatch) {
            runs.push(new TextRun({ text: subMatch[1], subScript: true, ...baseStyle }));
            return;
        }

        // <sup>exposant</sup>
        const supMatch = part.match(/^<sup>(.*?)<\/sup>$/s);
        if (supMatch) {
            runs.push(new TextRun({ text: supMatch[1], superScript: true, ...baseStyle }));
            return;
        }

        // ***gras+vert***
        if (part.startsWith('***') && part.endsWith('***')) {
            const inner3 = part.slice(3, -3);
            if (/[*<]/.test(inner3)) {
                runs.push(...parseMarkdownToTextRuns(inner3, { bold: true, color: '008000', ...baseStyle }));
            } else {
                runs.push(new TextRun({ text: inner3, bold: true, color: '008000', ...baseStyle }));
            }
        }
        // **gras**
        else if (part.startsWith('**') && part.endsWith('**')) {
            const inner = part.slice(2, -2);
            // Le gras peut contenir un span couleur (`**<span…>x</span>**`) ou de
            // l'italique imbriqué (`**x *y*:**`, issu de <strong>…<em>…</em></strong>) :
            // re-parser au lieu d'émettre les marqueurs littéraux (audit F2).
            if (/[*<]/.test(inner)) {
                runs.push(...parseMarkdownToTextRuns(inner, { bold: true, ...baseStyle }));
            } else {
                runs.push(new TextRun({ text: inner, bold: true, ...baseStyle }));
            }
        }
        // *italique*
        else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            const inner = part.slice(1, -1);
            if (/<span[^>]*style=/i.test(inner)) {
                runs.push(...parseMarkdownToTextRuns(inner, { italics: true, ...baseStyle }));
            } else {
                runs.push(new TextRun({ text: inner, italics: true, ...baseStyle }));
            }
        }
        // Texte normal. Filet de sécurité (audit F2) : des balises <span>
        // mal appariées (imbrications CKEditor pathologiques) peuvent échapper
        // à la tokenisation — on les purge plutôt que de les imprimer.
        else {
            runs.push(new TextRun({ text: part.replace(/<span\s[^>]*>|<\/span>/gi, ''), ...baseStyle }));
        }
    });

    return runs;
}

/**
 * Parse un texte pouvant contenir des formules LaTeX \(...\) et du Markdown.
 * Les formules sont converties en objets Math OMML (docx.js), le reste en TextRuns.
 * Remplacement direct de parseMarkdownToTextRuns pour les exports DOCX.
 *
 * @param {string} text — Texte avec éventuel LaTeX et Markdown
 * @param {Object} [baseStyle={}] — Style de base pour les TextRun
 * @returns {Array} Tableau mixte de TextRun et Math, utilisable comme children d'un Paragraph
 */
function parseTextWithMath(text, baseStyle = {}) {
    if (!text) return [];
    if (!containsLatex(text)) {
        return parseMarkdownToTextRuns(text, baseStyle);
    }
    return textWithMathToDocxChildren(text, baseStyle, parseMarkdownToTextRuns);
}

/**
 * Parse Markdown (**gras**, *italique*, ***gras+vert***) et retourne du XML pour ODT
 */
function parseMarkdownForODT(text) {
    if (!text) return '';

    // Même déballage que la voie DOCX : les spans sans couleur (font-size…)
    // sortaient littéralement dans l'ODT — et donc dans le PDF, généré depuis
    // l'ODT via Gotenberg (audit F2).
    text = unwrapNonColorSpans(text);

    // Extraire les liens et tags HTML avant l'échappement XML
    const links = [];
    let processed = text.replace(/<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (m, href, t) => {
        const idx = links.length;
        links.push({ href, text: t });
        return `___ODTLINK_${idx}___`;
    });

    const htmlTags = [];
    // Préserver couleur, souligné, barré, sub, sup
    processed = processed.replace(/<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>/gi, (m, color, t) => {
        const idx = htmlTags.length;
        htmlTags.push({ type: 'color', color: color.trim(), text: t });
        return `___ODTTAG_${idx}___`;
    });
    processed = processed.replace(/<u>(.*?)<\/u>/gi, (m, t) => {
        const idx = htmlTags.length;
        htmlTags.push({ type: 'underline', text: t });
        return `___ODTTAG_${idx}___`;
    });
    processed = processed.replace(/<s>(.*?)<\/s>/gi, (m, t) => {
        const idx = htmlTags.length;
        htmlTags.push({ type: 'strike', text: t });
        return `___ODTTAG_${idx}___`;
    });
    processed = processed.replace(/<sub>(.*?)<\/sub>/gi, (m, t) => {
        const idx = htmlTags.length;
        htmlTags.push({ type: 'sub', text: t });
        return `___ODTTAG_${idx}___`;
    });
    processed = processed.replace(/<sup>(.*?)<\/sup>/gi, (m, t) => {
        const idx = htmlTags.length;
        htmlTags.push({ type: 'sup', text: t });
        return `___ODTTAG_${idx}___`;
    });

    // Filet de sécurité (audit F2) : balises <span> mal appariées restantes
    // (imbrications CKEditor pathologiques) — purgées plutôt qu'imprimées.
    processed = processed.replace(/<span\s[^>]*>|<\/span>/gi, '');

    let xml = escapeXml(processed);

    // Retours à la ligne → espace
    xml = xml.replace(/\n/g, ' ');

    // Markdown → ODT styles
    xml = xml.replace(/\*\*\*(.*?)\*\*\*/g, '<text:span text:style-name="BoldGreen">$1</text:span>');
    xml = xml.replace(/\*\*(.*?)\*\*/g, '<text:span text:style-name="Bold">$1</text:span>');
    xml = xml.replace(/\*(.*?)\*/g, '<text:span text:style-name="Italic">$1</text:span>');

    // Restaurer les liens (marqueurs Markdown du texte de lien purgés — cf.
    // parseMarkdownToTextRuns, audit F2)
    xml = xml.replace(/___ODTLINK_(\d+)___/g, (m, idx) => {
        const link = links[parseInt(idx)];
        return `<text:a xlink:type="simple" xlink:href="${escapeXml(link.href)}">${escapeXml(String(link.text).replace(/<[^>]+>/g, '').replace(/\*+/g, ''))}</text:a>`;
    });

    // Restaurer les tags HTML en styles ODT
    xml = xml.replace(/___ODTTAG_(\d+)___/g, (m, idx) => {
        const tag = htmlTags[parseInt(idx)];
        switch (tag.type) {
            case 'color': {
                const hex = cssColorToHex(tag.color);
                // Le contenu du span couleur peut porter du Markdown (**…**, issu de
                // cleanHtml sur <strong>/<em>) : convertir en spans ODT imbriqués au
                // lieu d'émettre les astérisques littéraux (audit F2). L'imbrication
                // de text:span est valide en ODF.
                let inner = escapeXml(tag.text);
                inner = inner.replace(/\*\*\*(.*?)\*\*\*/g, '<text:span text:style-name="BoldGreen">$1</text:span>');
                inner = inner.replace(/\*\*(.*?)\*\*/g, '<text:span text:style-name="Bold">$1</text:span>');
                inner = inner.replace(/\*(.*?)\*/g, '<text:span text:style-name="Italic">$1</text:span>');
                return `<text:span text:style-name="Color_${hex}">${inner}</text:span>`;
            }
            case 'underline':
                return `<text:span text:style-name="Underline">${escapeXml(tag.text)}</text:span>`;
            case 'strike':
                return `<text:span text:style-name="Strikethrough">${escapeXml(tag.text)}</text:span>`;
            case 'sub':
                return `<text:span text:style-name="Sub">${escapeXml(tag.text)}</text:span>`;
            case 'sup':
                return `<text:span text:style-name="Sup">${escapeXml(tag.text)}</text:span>`;
            default:
                return escapeXml(tag.text);
        }
    });

    return xml;
}

/**
 * Contexte partagé pour la collecte des objets Math ODT.
 * Chaque formule crée un Object N/ dans le ZIP, référencé via xlink:href.
 * Réinitialisé au début de chaque export ODT.
 */
const _odtMathCtx = {
    counter: 0,
    objects: []  // { id, mathml, latex }
};

/**
 * Estime les dimensions d'une formule LaTeX pour le draw:frame ODT (en cm).
 * Utilise l'AST produit par parseLatex() pour un calcul récursif précis
 * qui gère correctement les structures imbriquées (fractions dans fractions,
 * racines avec exposants, matrices, etc.).
 *
 * Constantes calibrées sur les mesures réelles de LibreOffice Math :
 *   - \(x\) → 0.235 × 0.471 cm
 *   - \(\sqrt{x^2}=x\) → 1.219 × 0.572 cm
 *   - \(f(x)=\sqrt{x}\) → 1.639 × 0.540 cm
 */

// Constantes de dimensionnement (cm) — calibrées sur LibreOffice Math 7.x
const _MATH_DIM = {
    CHAR_W:     0.22,   // largeur d'un caractère standard
    DIGIT_W:    0.20,   // largeur d'un chiffre (légèrement plus étroit)
    OP_W:       0.28,   // largeur d'un opérateur (+, =, etc.)
    SYMBOL_W:   0.30,   // largeur d'un symbole grec/mathématique
    SPACE_W:    0.10,   // largeur d'un espacement fin
    DELIM_W:    0.15,   // largeur d'un délimiteur (parenthèse, crochet)
    BASE_H:     0.45,   // hauteur de base d'une ligne de texte
    FRAC_GAP:   0.12,   // espacement barre de fraction (au-dessus + en-dessous)
    FRAC_PAD_W: 0.10,   // marge horizontale numérateur/dénominateur
    SQRT_PAD_W: 0.18,   // largeur du radical (crochet √)
    SQRT_PAD_H: 0.10,   // hauteur ajoutée par le radical au-dessus du contenu
    NARY_W:     0.45,   // largeur d'un grand opérateur (∑, ∏, ∫)
    NARY_H:     0.70,   // hauteur d'un grand opérateur seul
    SCRIPT_SCALE: 0.65, // facteur d'échelle pour exposants/indices
    ACCENT_H:   0.10,   // hauteur ajoutée par un accent (hat, vec, overline)
    FUNC_W:     0.20,   // largeur par caractère du nom de fonction (sin, cos)
    MATRIX_GAP_W: 0.25, // espacement entre colonnes de matrice
    MATRIX_GAP_H: 0.10, // espacement entre lignes de matrice
    DELIM_EXTRA_H: 0.08, // hauteur supplémentaire par délimiteur extensible
    MIN_W:      0.20,   // largeur minimale
    MIN_H:      0.40,   // hauteur minimale
    MARGIN_W:   0.08,   // marge globale ajoutée à la largeur finale
    MARGIN_H:   0.08,   // marge globale ajoutée à la hauteur finale
};

/**
 * Calcule récursivement les dimensions {w, h} d'une liste de nœuds AST.
 * @param {Array} nodes — Nœuds AST produits par parseLatex()
 * @returns {{w: number, h: number}} Dimensions en cm
 */
function _measureNodes(nodes) {
    if (!nodes || nodes.length === 0) return { w: 0, h: _MATH_DIM.BASE_H };

    let totalW = 0;
    let maxH = _MATH_DIM.BASE_H;

    for (const node of nodes) {
        const m = _measureNode(node);
        totalW += m.w;
        if (m.h > maxH) maxH = m.h;
    }

    return { w: totalW, h: maxH };
}

/**
 * Calcule les dimensions d'un seul nœud AST.
 * @param {Object} node — Nœud AST
 * @returns {{w: number, h: number}}
 */
function _measureNode(node) {
    if (!node) return { w: 0, h: _MATH_DIM.BASE_H };
    const D = _MATH_DIM;

    switch (node.type) {

    // --- Atomes ---
    case 'text':
    case 'textContent':
        return { w: (node.value || '').length * D.CHAR_W, h: D.BASE_H };

    case 'number':
        return { w: (node.value || '').length * D.DIGIT_W, h: D.BASE_H };

    case 'operator':
        return { w: D.OP_W, h: D.BASE_H };

    case 'symbol':
        return { w: D.SYMBOL_W, h: D.BASE_H };

    case 'space':
        return { w: D.SPACE_W, h: D.BASE_H };

    case 'newline':
        return { w: 0, h: 0 };

    // --- Groupe (accolades) ---
    case 'group':
        return _measureNodes(node.children);

    case 'font':
        return _measureNodes(node.body);

    // --- Fraction / Binôme ---
    case 'frac':
    case 'binom': {
        const num = _measureNodes(node.type === 'binom' ? node.top : node.num);
        const den = _measureNodes(node.type === 'binom' ? node.bottom : node.den);
        const w = Math.max(num.w, den.w) + D.FRAC_PAD_W * 2;
        const h = num.h + den.h + D.FRAC_GAP;
        return { w, h };
    }

    // --- Racine carrée ---
    case 'sqrt': {
        const body = _measureNodes(node.body);
        let w = body.w + D.SQRT_PAD_W;
        let h = body.h + D.SQRT_PAD_H;
        if (node.index) {
            const idx = _measureNodes(node.index);
            w += idx.w * D.SCRIPT_SCALE * 0.5;
        }
        return { w, h };
    }

    // --- Exposant ---
    case 'sup': {
        const base = _measureNode(node.base);
        const sup = _measureNodes(node.sup);
        const w = base.w + sup.w * D.SCRIPT_SCALE;
        const h = Math.max(base.h, base.h * 0.5 + sup.h * D.SCRIPT_SCALE);
        return { w, h };
    }

    // --- Indice ---
    case 'sub': {
        const base = _measureNode(node.base);
        const sub = _measureNodes(node.sub);
        const w = base.w + sub.w * D.SCRIPT_SCALE;
        const h = Math.max(base.h, base.h * 0.5 + sub.h * D.SCRIPT_SCALE);
        return { w, h };
    }

    // --- Exposant + Indice ---
    case 'subsup': {
        const base = _measureNode(node.base);
        const sup = _measureNodes(node.sup);
        const sub = _measureNodes(node.sub);
        const scriptW = Math.max(sup.w, sub.w) * D.SCRIPT_SCALE;
        const w = base.w + scriptW;
        const h = Math.max(base.h, sub.h * D.SCRIPT_SCALE + sup.h * D.SCRIPT_SCALE + base.h * 0.2);
        return { w, h };
    }

    // --- Grand opérateur (∑, ∏, ∫) ---
    case 'nary': {
        return { w: D.NARY_W, h: D.NARY_H };
    }

    // --- Fonction nommée (sin, cos, log...) ---
    case 'func': {
        const nameW = (node.name || '').length * D.FUNC_W;
        return { w: nameW, h: D.BASE_H };
    }

    // --- Accent (hat, vec, overline...) ---
    case 'accent': {
        const body = _measureNodes(node.body);
        return { w: body.w, h: body.h + D.ACCENT_H };
    }

    // --- Délimiteurs (\left ... \right) ---
    case 'delimited': {
        const body = _measureNodes(node.body);
        const w = body.w + D.DELIM_W * 2;
        const h = body.h + D.DELIM_EXTRA_H;
        return { w, h };
    }

    // --- Matrice / Tableau ---
    case 'matrix': {
        if (!node.rows || node.rows.length === 0) return { w: D.MIN_W, h: D.BASE_H };
        const numCols = Math.max(...node.rows.map(r => r.length));
        const colWidths = new Array(numCols).fill(0);
        const rowHeights = [];
        for (const row of node.rows) {
            let rowH = D.BASE_H;
            for (let c = 0; c < row.length; c++) {
                const cell = _measureNodes(row[c]);
                if (cell.w > colWidths[c]) colWidths[c] = cell.w;
                if (cell.h > rowH) rowH = cell.h;
            }
            rowHeights.push(rowH);
        }
        const w = colWidths.reduce((s, v) => s + v, 0) + D.MATRIX_GAP_W * (numCols - 1) + D.DELIM_W * 2;
        const h = rowHeights.reduce((s, v) => s + v, 0) + D.MATRIX_GAP_H * (node.rows.length - 1);
        return { w, h };
    }

    // --- Cas (système d'équations) ---
    case 'cases': {
        if (!node.rows || node.rows.length === 0) return { w: D.MIN_W, h: D.BASE_H };
        let maxW = 0;
        const rowHeights = [];
        for (const row of node.rows) {
            // Chaque ligne de cases est un tableau de cellules (souvent 1-2)
            const flat = Array.isArray(row[0]) ? row.flat() : row;
            const m = _measureNodes(flat);
            if (m.w > maxW) maxW = m.w;
            rowHeights.push(m.h);
        }
        const w = maxW + D.DELIM_W; // accolade ouvrante
        const h = rowHeights.reduce((s, v) => s + v, 0) + D.MATRIX_GAP_H * (node.rows.length - 1);
        return { w, h };
    }

    // --- Alignement multi-lignes ---
    case 'aligned': {
        if (!node.lines || node.lines.length === 0) return { w: D.MIN_W, h: D.BASE_H };
        let maxW = 0;
        const lineHeights = [];
        for (const line of node.lines) {
            const m = _measureNodes(line);
            if (m.w > maxW) maxW = m.w;
            lineHeights.push(m.h);
        }
        const w = maxW;
        const h = lineHeights.reduce((s, v) => s + v, 0) + D.MATRIX_GAP_H * (node.lines.length - 1);
        return { w, h };
    }

    // --- Align (séparateur &) ---
    case 'align':
        return { w: D.SPACE_W, h: 0 };

    default:
        return { w: D.CHAR_W, h: D.BASE_H };
    }
}

function _estimateFormulaDimensions(latex) {
    if (!latex) return { w: '0.500', h: '0.450' };

    const D = _MATH_DIM;

    try {
        const ast = parseLatex(latex);
        const { w: rawW, h: rawH } = _measureNodes(ast);

        // Appliquer les marges et les minimums
        const w = Math.max(D.MIN_W, rawW + D.MARGIN_W).toFixed(3);
        const h = Math.max(D.MIN_H, rawH + D.MARGIN_H).toFixed(3);

        return { w, h };
    } catch (_e) {
        // Fallback si le parsing échoue : estimation grossière
        const charCount = Math.max(latex.replace(/\\[a-zA-Z]+|[{}\\]/g, '').replace(/\s+/g, '').length, 1);
        const w = Math.max(D.MIN_W, charCount * D.CHAR_W + D.MARGIN_W).toFixed(3);
        return { w, h: '0.530' };
    }
}

/** Réinitialise le collecteur pour un nouvel export */
function _resetOdtMathCtx() {
    _odtMathCtx.counter = 0;
    _odtMathCtx.objects = [];
}

/**
 * Parse un texte ODT avec gestion des formules LaTeX → objets Math LibreOffice.
 * Les formules sont stockées comme des objets séparés (Object N/)
 * référencés via xlink:href, éditables dans LibreOffice Math.
 *
 * @param {string} text — Texte avec éventuel LaTeX et Markdown
 * @returns {string} XML ODT avec références aux objets Math
 */
function parseODTWithMath(text) {
    if (!text || !containsLatex(text)) {
        return parseMarkdownForODT(text);
    }

    const segments = splitTextAndMath(text);
    let result = '';

    for (const seg of segments) {
        if (seg.type === 'math') {
            _odtMathCtx.counter++;
            const objId = _odtMathCtx.counter;
            const mathml = latexToMathML(seg.value);

            // Stocker l'objet pour l'ajout au ZIP plus tard
            _odtMathCtx.objects.push({ id: objId, mathml, latex: seg.value });

            // Estimer la taille de la formule pour le draw:frame
            const dims = _estimateFormulaDimensions(seg.value);

            // Référence à l'objet dans le flux XML
            result += `<draw:frame draw:style-name="fr_math" draw:name="Object${objId}" ` +
                      `text:anchor-type="as-char" svg:width="${dims.w}cm" svg:height="${dims.h}cm" draw:z-index="${objId - 1}">` +
                      `<draw:object xlink:href="./Object ${objId}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>` +
                      `</draw:frame>`;
        } else {
            result += parseMarkdownForODT(seg.value);
        }
    }

    return result;
}

/**
 * Injecte les objets Math collectés dans le ZIP ODT et met à jour le manifest.
 * Appelé après la génération du content.xml.
 *
 * @param {JSZip} zip — L'archive ZIP en construction
 * @returns {string} XML manifest supplémentaire pour les objets Math
 */
function _injectMathObjectsIntoZip(zip) {
    let manifestEntries = '';

    for (const obj of _odtMathCtx.objects) {
        const objPath = `Object ${obj.id}`;

        // content.xml de l'objet Math (format LibreOffice Math)
        const objContent = `<?xml version="1.0" encoding="UTF-8"?>
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <semantics>
    ${obj.mathml.replace(/<math[^>]*>/, '').replace(/<\/math>/, '')}
    <annotation encoding="StarMath 5.0">${_latexToStarMath(obj.latex)}</annotation>
  </semantics>
</math>`;

        zip.file(`${objPath}/content.xml`, objContent);

        // Entrées manifest pour l'objet
        manifestEntries += `\n  <manifest:file-entry manifest:full-path="${objPath}/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.formula"/>`;
        manifestEntries += `\n  <manifest:file-entry manifest:full-path="${objPath}/content.xml" manifest:media-type="text/xml"/>`;
    }

    return manifestEntries;
}

/**
 * Conversion LaTeX → StarMath (annotation pour LibreOffice Math).
 * Utilise getStarMath() du catalogue centralisé (math-catalog.js).
 * Référence : https://wiki.documentfoundation.org/Documentation/OOoAuthors_User_Manual/Writer_Guide/Formula_commands_reference
 */
/**
 * Convertit du LaTeX en StarMath 5.0 via le parser AST partagé.
 * Utilise le même arbre syntaxique que les convertisseurs OMML et MathML,
 * ce qui garantit la cohérence et gère les structures imbriquées.
 * @param {string} latex — Expression LaTeX
 * @returns {string} Expression StarMath 5.0 (XML-safe)
 */
export function _latexToStarMath(latex) {
    if (!latex) return '';
    try {
        const ast = parseLatex(latex);
        const sm = _smNodes(ast);
        let result = sm.replace(/\s{2,}/g, ' ').trim();
        // Un opérateur binaire isolé (ex: \times seul) nécessite des opérandes
        // vides pour que StarMath l'accepte : {} times {}
        if (ast.length === 1 && ast[0].type === 'symbol') {
            const mlType = getSymbolMlType(ast[0].name);
            if (mlType === 'mo') {
                result = `{} ${result} {}`;
            }
        }
        return escapeXml(result);
    } catch (e) {
        // Fallback : retourner le LaTeX brut nettoyé
        return escapeXml(latex.replace(/\\/g, '').trim());
    }
}

/** Rend un tableau de nœuds AST en StarMath */
function _smNodes(nodes) {
    if (!nodes || nodes.length === 0) return '';
    return nodes.map(n => _smNode(n)).join(' ');
}

/** Rend un nœud AST unique en StarMath */
function _smNode(node) {
    if (!node) return '';
    switch (node.type) {
        case 'text':
            // Commande inconnue → tenter le catalogue
            if (node.value?.startsWith('\\')) {
                const cmd = node.value.substring(1);
                const sm = getStarMath(cmd);
                return sm || cmd;
            }
            return node.value || '';

        case 'number':
            return node.value || '';

        case 'operator':
            return node.value || '';

        case 'symbol': {
            const sm = getStarMath(node.name);
            return sm || node.name;
        }

        case 'frac':
            return `{${_smNodes(node.num)}} over {${_smNodes(node.den)}}`;

        case 'sqrt':
            if (node.index) {
                return `nroot {${_smNodes(node.index)}} {${_smNodes(node.body)}}`;
            }
            return `sqrt {${_smNodes(node.body)}}`;

        case 'sup':
            return `{${_smNodes(node.base)}} ^ {${_smNodes(node.sup)}}`;

        case 'sub':
            return `{${_smNodes(node.base)}} _ {${_smNodes(node.sub)}}`;

        case 'subsup':
            return `{${_smNodes(node.base)}} _ {${_smNodes(node.sub)}} ^ {${_smNodes(node.sup)}}`;

        case 'nary': {
            const op = getStarMath(node.op) || node.op;
            let result = op;
            // Intégrales : limites en indice/exposant (_/^)
            // Sommes, produits, etc. : limites au-dessus/en-dessous (from/to)
            const isIntegral = ['int', 'iint', 'iiint', 'oint'].includes(node.op);
            if (isIntegral) {
                if (node.sub) result += ` _ {${_smNodes(node.sub)}}`;
                if (node.sup) result += ` ^ {${_smNodes(node.sup)}}`;
            } else {
                if (node.sub) result += ` from {${_smNodes(node.sub)}}`;
                if (node.sup) result += ` to {${_smNodes(node.sup)}}`;
            }
            // Corps vide {} obligatoire pour que StarMath accepte l'opérateur (tests 12b)
            result += '{}';
            return result;
        }

        case 'func': {
            const name = node.name || '';
            let result = name;
            // lim, limsup, liminf, min, max, sup, inf → « from » (indice sous le nom)
            // log, sin, cos, etc. → « _ » (vrai indice en bas à droite)
            const usesFrom = ['lim', 'limsup', 'liminf', 'min', 'max', 'sup', 'inf'].includes(name);
            if (node.sub) {
                result += usesFrom ? ` from {${_smNodes(node.sub)}}` : ` _ {${_smNodes(node.sub)}}`;
                result += '{}'; // Corps vide obligatoire (tests 12b)
            }
            return result;
        }

        case 'accent': {
            const sm = ACCENT_CATALOG[node.name]?.sm || node.name;
            return `${sm} {${_smNodes(node.body)}}`;
        }

        case 'font': {
            const text = _smNodesToText(node.body);
            if (node.name === 'mathbb') {
                // Utiliser les caractères Unicode directement (ℝ, ℕ, etc.)
                let result = '';
                for (const ch of text) result += BLACKBOARD[ch] || ch;
                return result;
            }
            // mathcal, mathfrak, mathscr → pas de support StarMath, texte brut
            return text;
        }

        case 'textContent':
            return `"${node.value || ''}"`;

        case 'binom':
            return `left ( binom {${_smNodes(node.top)}} {${_smNodes(node.bottom)}} right )`;

        case 'delimited': {
            const bodyStr = _smNodes(node.body);
            if (!bodyStr.trim()) {
                // Délimiteurs vides → afficher les caractères comme texte littéral
                const openChar = node.open || '';
                const closeChar = node.close || '';
                return `"${openChar}${closeChar}"`;
            }
            const open = _smDelimiter(node.open, 'left');
            const close = _smDelimiter(node.close, 'right');
            return `${open} ${bodyStr} ${close}`;
        }

        case 'matrix': {
            const rows = node.rows.map(row =>
                row.map(cell => _smNodes(cell)).join(' # ')
            ).join(' ## ');
            const delims = _smMatrixDelimiters(node.variant);
            return `${delims.open} matrix { ${rows} } ${delims.close}`;
        }

        case 'cases': {
            const rows = node.rows.map(row => {
                let line = _smNodes(row.value);
                if (row.condition?.length > 0) line += ' # ' + _smNodes(row.condition);
                return line;
            }).join(' ## ');
            return `left lbrace matrix { ${rows} } right none`;
        }

        case 'aligned': {
            const lines = node.lines.map(line => _smNodes(line)).join(' ## ');
            return `matrix { ${lines} }`;
        }

        case 'group':
            return _smNodes(node.children);

        case 'space':
            return '`';

        case 'newline':
            return '##';

        case 'align':
            return '#';

        default:
            return node.value || '';
    }
}

/** Extrait le texte brut des nœuds (pour mathbb) */
function _smNodesToText(nodes) {
    return nodes.map(n => n.value || '').join('');
}

/** Mappe un délimiteur LaTeX vers StarMath */
function _smDelimiter(ch, side) {
    if (!ch || ch === '.') return `${side} none`;
    const map = {
        '(': '(', ')': ')',
        '[': '[', ']': ']',
        '{': 'lbrace', '}': 'rbrace',
        '|': 'lline',
        '\u2016': 'ldline', // ‖
        '\u27E8': 'langle', '\u27E9': 'rangle'
    };
    // Pour le côté droit, utiliser les variantes r*
    let sm = map[ch];
    if (sm && side === 'right') {
        sm = sm.replace(/^l/, 'r');
    }
    return `${side} ${sm || ch}`;
}

/** Délimiteurs de matrice selon le variant */
function _smMatrixDelimiters(variant) {
    switch (variant) {
        case 'pmatrix': return { open: 'left (', close: 'right )' };
        case 'bmatrix': return { open: 'left [', close: 'right ]' };
        case 'Bmatrix': return { open: 'left lbrace', close: 'right rbrace' };
        case 'vmatrix': return { open: 'left lline', close: 'right rline' };
        case 'Vmatrix': return { open: 'left ldline', close: 'right rdline' };
        default: return { open: 'left (', close: 'right )' };
    }
}
