/**
 * @file Module d'export de documents DOCX, ODT et PDF.
 * Ce module génère des documents bien formatés à partir du contenu structuré
 * produit par document-formatter.js.
 */

import { formatContentForDocument } from './document-formatter.js';
import { translations, currentLang, t } from '../core/translation.js';
import { loadDocumentExportLibs, loadPDFFonts } from '../core/lib-loader.js';
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
    pdfRowHeight: 55
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

    const promises = formattedContent.sections
        .filter(section => section.type === 'image' && section.url)
        .map(async (section) => {
            try {
                // Si l'URL est déjà un dataURL, on crée aussi le blob (requis par DOCX/ODT)
                if (section.url.startsWith('data:')) {
                    const [dimensions, blob] = await Promise.all([
                        loadImageDimensions(section.url),
                        fetch(section.url).then(r => r.blob())
                    ]);
                    const mimeMatch = section.url.match(/^data:([^;]+);/);
                    section.imageData = {
                        dataURL: section.url,
                        width: dimensions.width,
                        height: dimensions.height,
                        blob: blob,
                        mimeType: mimeMatch ? mimeMatch[1] : 'image/png'
                    };
                    return;
                }

                const result = await fetchImageAsDataURL(section.url);
                section.imageData = result;
            } catch (error) {
                console.warn(`Impossible de charger l'image ${section.url}:`, error);
                section.imageError = true;
                section.errorText = t('doc_fmt_image_not_found') || '[Image non trouvée]';
            }
        });

    await Promise.all(promises);
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
 * Exporte un contenu au format DOCX
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToDOCX(moduleKey, jsonData) {
    try {
        await loadLibraries();

        if (!window.docx) {
            throw new Error('La bibliothèque docx n\'a pas pu être chargée');
        }

        const formattedContent = await formatContentForDocument(moduleKey, jsonData);
        await prepareImages(formattedContent);
        const doc = createDOCXDocument(formattedContent);

        // Générer le fichier
        const blob = await window.docx.Packer.toBlob(doc);
        const fileName = generateFileName(moduleKey, 'docx');

        downloadBlob(blob, fileName);

    } catch (error) {
        console.error('Erreur lors de l\'export DOCX:', error);
        alert(t('export_error') || 'Erreur lors de l\'export DOCX');
    }
}

/**
 * Exporte un contenu au format PDF
 * @param {string} moduleKey - La clé du module
 * @param {Object} jsonData - Les données JSON du contenu
 */
export async function exportToPDF(moduleKey, jsonData) {
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
        await loadLibraries();

        const formattedContent = await formatContentForDocument(moduleKey, jsonData);
        await prepareImages(formattedContent);
        const odtBlob = await createODTDocument(formattedContent);

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
            case 'paragraph':
                children.push(createDOCXParagraph(section));
                break;
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
        children: parseMarkdownToTextRuns(section.text),
        heading: headingLevels[section.level] || HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
    });
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
        children: parseMarkdownToTextRuns(section.text, style),
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
        children: parseMarkdownToTextRuns(section.text, { size: 24, ...style }),
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
            ...parseMarkdownToTextRuns(section.text, { size: 24, ...style })
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
        section.fillWidth ? 9999 : DOCX_FIXED_HEIGHT,
        MAX_WIDTH_DOCX
    );

    const MM_TO_PX = 3.78;

    const nodes = [];

    nodes.push(new Paragraph({
        children: [
            new ImageRun({
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
 * @param {Object|null} cardContent - Contenu de la carte {text, hint, cardNumber} ou null
 * @returns {TableCell} - Cellule DOCX
 */
function createDOCXFlashcardCell(cardContent) {
    const { TableCell, Paragraph, TextRun, VerticalAlign,
        AlignmentType, WidthType } = window.docx;

    const paragraphs = [];

    if (cardContent) {
        // Texte principal (centré, 12pt)
        paragraphs.push(
            new Paragraph({
                children: parseMarkdownToTextRuns(cardContent.text || '', { size: 24, font: "Arial" }),
                alignment: AlignmentType.CENTER
            })
        );

        // Indice si présent (plus petit, italique, gris)
        if (cardContent.hint) {
            paragraphs.push(
                new Paragraph({
                    children: parseMarkdownToTextRuns(cardContent.hint, { size: 20, italics: true, color: '666666', font: "Arial" }),
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
    const { Table, TableRow, TableCell, Paragraph, TextRun,
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

    // Lignes de données
    rows.forEach(row => {
        const dataCells = row.map((cellText, colIdx) => {
            const isBold = cfg.cellBold || (cfg.firstColBold && colIdx === 0);
            const color = cfg.cellBold ? cfg.cellColor : (colIdx === 0 && cfg.firstColBold ? '000000' : cfg.cellColor);
            const padding = cfg.cellPadding || 120;

            const cellOpts = {
                children: [
                    new Paragraph({
                        children: cellText ? parseMarkdownToTextRuns(cellText, {
                            size: 24,
                            bold: isBold,
                            color: color,
                            font: "Arial"
                        }) : [],
                        alignment: cfg.cellAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT
                    })
                ],
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
        // Parser les segments Markdown (***gras+vert***, **gras**, *italique*)
        const runs = [];
        const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g;
        const parts = pText.split(regex);

        parts.forEach(part => {
            if (part.startsWith('***') && part.endsWith('***')) {
                runs.push({ text: part.slice(3, -3), bold: true, italic: false, green: true });
            } else if (part.startsWith('**') && part.endsWith('**')) {
                runs.push({ text: part.slice(2, -2), bold: true, italic: false, green: false });
            } else if (part.startsWith('*') && part.endsWith('*')) {
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
                if (lastSeg && lastSeg.bold === run.bold && lastSeg.italic === run.italic && lastSeg.green === run.green) {
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
                        green: run.green
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
                const fontStyle = getFontStyle(seg);
                doc.setFont(font, fontStyle);
                // Appliquer la couleur verte si nécessaire
                if (seg.green) {
                    doc.setTextColor(0, 128, 0); // Vert
                } else {
                    doc.setTextColor(...color); // Couleur de base
                }
                doc.text(seg.text, currentX, currentY, { baseline: 'top' });
                currentX += seg.width;
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
        section.fillWidth ? 9999 : PDF_FIXED_HEIGHT,
        maxWidth
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

                // 1. Dessiner le texte principal (Markdown)
                if (cardContent.text) {
                    const style = { fontSize: 11, font: PDF_FONT, fontStyle: 'normal', color: [0, 0, 0] };
                    // Centrage vertical approximatif (on descend de 1/3 de la cellule)
                    const textY = cellY + (cellHeight / 3);
                    drawPDFRichText(doc, cardContent.text, cellX + padding, textY, cellWidth - 2 * padding, style, 'center');
                }

                // 2. Dessiner l'indice si présent (Markdown, gris, italique)
                if (cardContent.hint) {
                    const hintStyle = { fontSize: 9, font: PDF_FONT, fontStyle: 'italic', color: [102, 102, 102] };
                    // Positionner l'indice en bas de la cellule
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

    // Nettoyer le Markdown **gras** dans les cellules (non supporté par AutoTable)
    const cleanRows = rows.map(row => row.map(cell =>
        typeof cell === 'string' ? cell.replace(/\*\*(.*?)\*\*/g, '$1') : cell
    ));

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
        },
        didDrawCell: function(data) {
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

    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" office:version="1.2">${tableStylesXml}
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
                contentXml += `      <text:h text:outline-level="${level}" text:style-name="Heading_${level}">${parseMarkdownForODT(section.text)}</text:h>\n`;
                break;
            case 'paragraph':
                contentXml += `      <text:p text:style-name="P_${section.style || 'default'}">${parseMarkdownForODT(section.text)}</text:p>\n`;
                break;
            case 'bulletPoint':
                const bullStyle = section.style ? `P_bullet_${section.style}` : 'P_bullet_default';
                contentXml += `      <text:list text:style-name="L1"><text:list-item><text:p text:style-name="${bullStyle}">${parseMarkdownForODT(section.text)}</text:p></text:list-item></text:list>\n`;
                break;
            case 'checkbox':
                const checkStyle = section.style ? `P_checkbox_${section.style}` : 'P_checkbox';
                contentXml += `      <text:p text:style-name="${checkStyle}">[  ] ${parseMarkdownForODT(section.text)}</text:p>\n`;
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

                    const dims = calculateDimensions(section.imageData.width, section.imageData.height, section.fillWidth ? 9999 : ODT_FIXED_HEIGHT, MAX_WIDTH_ODT);

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
            case 'table':
                contentXml += generateODTTable(section, ++imageCounter);
                break;
        }
    });

    contentXml += `    </office:text>
  </office:body>
</office:document-content>`;

    manifestXml += `</manifest:manifest>`;
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
    return `
  <office:automatic-styles>
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

    <!-- Texte centré générique pour cellules -->
    <style:style style:name="CellCenter" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:style>
  </office:automatic-styles>`;
}

/**
 * Génère le XML ODT pour un tableau générique.
 * @param {Object} section - Section de type 'table'
 * @param {number} tableId - Identifiant unique pour le nom du tableau
 * @returns {string} XML du tableau
 */
function generateODTTable(section, tableId) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    const style = section.style || 'default';
    const colCount = headers.length || (rows[0] ? rows[0].length : 2);

    // Préfixes de style selon le type
    const styleMap = {
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
            const cellText = (row[i] !== undefined && row[i] !== null) ? row[i] : '';
            const textStyle = (sm.firstColText && i === 0) ? sm.firstColText : sm.cellText;
            const cellStyle = (sm.firstColCell && i === 0) ? sm.firstColCell : sm.cell;
            xml += `          <table:table-cell table:style-name="${cellStyle}">\n`;
            xml += `            <text:p text:style-name="${textStyle}">${parseMarkdownForODT(cellText)}</text:p>\n`;
            xml += `          </table:table-cell>\n`;
        }
        xml += `        </table:table-row>\n`;
    });

    xml += `      </table:table>\n`;
    return xml;
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
    const zip = new window.JSZip();

    // 1. mimetype
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });

    // 2. META-INF/manifest.xml
    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
    zip.file('META-INF/manifest.xml', manifestXml);

    // 3. content.xml avec tableaux de cartes
    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
    office:version="1.2">
  <office:automatic-styles>
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

            contentXml += generateODTFlashcardTable(section, tableCounter);
        }
    });

    contentXml += `    </office:text>
  </office:body>
</office:document-content>`;
    zip.file('content.xml', contentXml);

    // 4. styles.xml avec configuration de page
    const stylesXml = generateODTFlashcardStyles();
    zip.file('styles.xml', stylesXml);

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Génère le XML d'un tableau de cartes pour ODT
 */
function generateODTFlashcardTable(section, tableId) {
    let xml = `      <table:table table:name="FlashcardTable${tableId}" table:style-name="FlashcardTable">
        <table:table-column table:style-name="FlashcardColumn" table:number-columns-repeated="2"/>
`;

    section.rows.forEach(row => {
        xml += `        <table:table-row table:style-name="FlashcardRow">
          <table:table-cell table:style-name="FlashcardCell">
${formatODTCellContent(row.left)}
          </table:table-cell>
          <table:table-cell table:style-name="FlashcardCell">
${formatODTCellContent(row.right)}
          </table:table-cell>
        </table:table-row>
`;
    });

    xml += `      </table:table>\n`;
    return xml;
}

/**
 * Formate le contenu d'une cellule pour ODT
 */
function formatODTCellContent(cardContent) {
    if (!cardContent) {
        return '            <text:p text:style-name="CellContent"></text:p>';
    }

    let xml = `            <text:p text:style-name="CellContent">${parseMarkdownForODT(cardContent.text || '')}</text:p>`;

    if (cardContent.hint) {
        xml += `\n            <text:p text:style-name="CellHint">${parseMarkdownForODT(cardContent.hint)}</text:p>`;
    }

    return xml;
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
    const map = {
        // Double-struck (Letterlike Symbols U+2100-214F)
        'ℝ': 'R', 'ℕ': 'N', 'ℤ': 'Z', 'ℚ': 'Q', 'ℂ': 'C', 'ℙ': 'P', 'ℍ': 'H', 'ⅎ': 'F',
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
 * Parse Markdown (**gras**, *italique*, ***gras+vert***) et retourne des TextRuns pour docx.js
 */
function parseMarkdownToTextRuns(text, baseStyle = {}) {
    const { TextRun } = window.docx;
    const runs = [];

    // Regex pour détecter ***...***, **...** ou *...* (dans cet ordre de priorité)
    const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g;
    const parts = text.split(regex);

    parts.forEach(part => {
        if (part.startsWith('***') && part.endsWith('***')) {
            // Triple astérisque = gras + vert
            runs.push(new TextRun({
                text: part.slice(3, -3),
                bold: true,
                color: '008000',
                ...baseStyle
            }));
        } else if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({
                text: part.slice(2, -2),
                bold: true,
                ...baseStyle
            }));
        } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({
                text: part.slice(1, -1),
                italics: true,
                ...baseStyle
            }));
        } else if (part) {
            runs.push(new TextRun({
                text: part,
                ...baseStyle
            }));
        }
    });

    return runs;
}

/**
 * Parse Markdown (**gras**, *italique*, ***gras+vert***) et retourne du XML pour ODT
 */
function parseMarkdownForODT(text) {
    if (!text) return '';

    let xml = escapeXml(text);

    // Retours à la ligne → espace (identique au comportement DOCX où \n
    // dans <w:t> est traité comme du whitespace par Word)
    xml = xml.replace(/\n/g, ' ');

    // Remplacement ***...**** -> <text:span text:style-name="BoldGreen">...</text:span> (DOIT être fait en premier)
    xml = xml.replace(/\*\*\*(.*?)\*\*\*/g, '<text:span text:style-name="BoldGreen">$1</text:span>');

    // Remplacement **...** -> <text:span text:style-name="Bold">...</text:span>
    xml = xml.replace(/\*\*(.*?)\*\*/g, '<text:span text:style-name="Bold">$1</text:span>');

    // Remplacement *...* -> <text:span text:style-name="Italic">$1</text:span>
    xml = xml.replace(/\*(.*?)\*/g, '<text:span text:style-name="Italic">$1</text:span>');

    return xml;
}
