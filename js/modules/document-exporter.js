/**
 * @file Module d'export de documents DOCX, ODT et PDF.
 * Ce module génère des documents bien formatés à partir du contenu structuré
 * produit par document-formatter.js.
 */

import { formatContentForDocument } from './document-formatter.js';
import { translations, currentLang, t } from './translation.js';
import { loadDocumentExportLibs } from './lib-loader.js';
import {
    fetchImageAsDataURL,
    calculateDimensions,
    DOCX_FIXED_HEIGHT,
    PDF_FIXED_HEIGHT,
    ODT_FIXED_HEIGHT,
    MAX_WIDTH_DOCX,
    MAX_WIDTH_PDF,
    MAX_WIDTH_ODT
} from './image-utils.js';

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
                // Si l'URL est déjà un dataURL, on ne fait rien
                if (section.url.startsWith('data:')) {
                    const dimensions = await loadImageDimensions(section.url);
                    section.imageData = {
                        dataURL: section.url,
                        width: dimensions.width,
                        height: dimensions.height
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

        const formattedContent = formatContentForDocument(moduleKey, jsonData);
        await prepareImages(formattedContent);
        const doc = createDOCXDocument(formattedContent);

        // Générer le fichier
        const blob = await window.docx.Packer.toBlob(doc);
        const fileName = generateFileName(formattedContent.title, 'docx');

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

        const formattedContent = formatContentForDocument(moduleKey, jsonData);
        await prepareImages(formattedContent);
        const doc = createPDFDocument(formattedContent);

        const fileName = generateFileName(formattedContent.title, 'pdf');
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

        const formattedContent = formatContentForDocument(moduleKey, jsonData);
        await prepareImages(formattedContent);
        const odtBlob = await createODTDocument(formattedContent);

        const fileName = generateFileName(formattedContent.title, 'odt');
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

    return new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial"
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

    return new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial"
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
        'definition': { size: 24 },
        'crosswordClue': { size: 24 },
        'timelineEra': { bold: true, size: 24 },
        'orderedParagraph': { size: 24 }
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
        DOCX_FIXED_HEIGHT,
        MAX_WIDTH_DOCX
    );

    // Convertir mm en pixels pour docx.js (environ 3.78 px/mm à 96 DPI)
    // Mais docx.js utilise des pixels ou des "twips" ou des unités spécifiques
    // En fait ImageRun prend des pixels.
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
 * Remplace les symboles Unicode par des versions ASCII pour le PDF
 * @param {Object} content - Le contenu formaté
 * @returns {Object} - Le contenu avec symboles remplacés
 */
function replacePDFSymbols(content) {
    // Créer une copie profonde pour ne pas modifier l'original
    const pdfContent = JSON.parse(JSON.stringify(content));

    // Remplacer les symboles dans toutes les sections
    pdfContent.sections.forEach(section => {
        if (section.text) {
            section.text = section.text
                // Symboles de validation - garder uniquement des versions textuelles simples
                .replace(/✓/g, '[CORRECT]')
                .replace(/✗/g, '[FAUX]')
                .replace(/→/g, ' -> ')
                .replace(/±/g, '+/-')
                // Supprimer tous les emojis Unicode
                // Plages Unicode pour les emojis
                // Supprimer tous les emojis Unicode via une regex complète
                // Inclut:
                // - Emoticons (1F600-1F64F)
                // - Misc Symbols and Pictographs (1F300-1F5FF)
                // - Transport and Map Symbols (1F680-1F6FF)
                // - Supplemental Symbols and Pictographs (1F900-1F9FF, 1FA70-1FAFF)
                // - Misc Symbols (2600-26FF)
                // - Dingbats (2700-27BF)
                // - Enclosed Alphanumeric Supplement (1F100-1F1FF) - inclus les drapeaux
                // - Symbols Extended-A (1FA00-1FA6F)
                // - Variation Selectors (FE00-FE0F) (exemple: VS16 pour emoji style)
                // - Zero Width Joiner (200D)
                // - Symboles spécifiques problématiques (2139=Info, 203C=!!, 2049=!?, etc.)
                .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1FA00}-\u{1FA6F}\u{FE00}-\u{FE0F}\u{200D}\u{2139}\u{203C}\u{2049}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}]/gu, '')
                // Nettoyer les doubles espaces et espaces en début/fin créés par la suppression
                .replace(/\s+/g, ' ')
                .trim();
        }
    });

    return pdfContent;
}

/**
 * Crée un document PDF à partir du contenu formaté
 */
function createPDFDocument(formattedContent) {
    // Vérifier si c'est un document de cartes imprimables (Flashcards/Dialog Cards)
    const isFlashcardDocument = formattedContent.sections.some(s => s.type === 'flashcardTable');

    if (isFlashcardDocument) {
        return createPDFFlashcardDocument(formattedContent);
    }

    // Remplacer les symboles Unicode par des versions ASCII
    const pdfContent = replacePDFSymbols(formattedContent);

    const doc = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
    });

    let y = 20; // Position Y actuelle
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // En-tête
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
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
    doc.setFont('helvetica', 'italic');
    doc.text(t('doc_fmt_generation_date') + dateStr, pageWidth - margin, y, { align: 'right' });
    y += 15;

    // Contenu (utiliser pdfContent avec symboles remplacés)
    pdfContent.sections.forEach(section => {
        // Vérifier si on doit ajouter une nouvelle page
        if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
        }

        switch (section.type) {
            case 'header':
                y = addPDFHeader(doc, section, y, margin, maxWidth);
                break;
            case 'paragraph':
                y = addPDFParagraph(doc, section, y, margin, maxWidth);
                break;
            case 'bulletPoint':
                y = addPDFBulletPoint(doc, section, y, margin, maxWidth);
                break;
            case 'checkbox':
                y = addPDFCheckbox(doc, section, y, margin, maxWidth);
                break;
            case 'separator':
                y += 5;
                break;
            case 'image':
                y = addPDFImage(doc, section, y, margin, maxWidth, pageHeight);
                break;
            case 'pageBreak':
                doc.addPage();
                y = 20;
                break;
        }
    });

    // Pied de page sur toutes les pages
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
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
function addPDFHeader(doc, section, y, margin, maxWidth) {
    const fontSize = section.level === 1 ? 18 : (section.level === 2 ? 14 : 12);
    const style = {
        fontSize: fontSize,
        font: 'helvetica',
        fontStyle: 'bold',
        color: [0, 102, 204]
    };

    return drawPDFRichText(doc, section.text, margin, y, maxWidth, style) + 7;
}

/**
 * Dessine du texte avec support Markdown simplifié sur le PDF
 * Supporte désormais l'alignement et le retour à la ligne automatique
 */
function drawPDFRichText(doc, text, x, y, maxWidth, baseStyle, align = 'left') {
    const fontSize = baseStyle.fontSize || 11;
    const font = baseStyle.font || 'helvetica';
    const baseFontStyle = baseStyle.fontStyle || 'normal';
    const color = baseStyle.color || [0, 0, 0];
    const lineHeight = fontSize * 0.45;
    const paragraphSpacing = 5;

    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const paragraphs = text.split('\n');
    let currentY = y;

    paragraphs.forEach((pText, pIndex) => {
        // Collecter les segments
        const runs = [];
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        const parts = pText.split(regex);

        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                runs.push({ text: part.slice(2, -2), bold: true });
            } else if (part.startsWith('*') && part.endsWith('*')) {
                runs.push({ text: part.slice(1, -1), italic: true });
            } else if (part) {
                runs.push({ text: part });
            }
        });

        // Découper en lignes
        const lines = [];
        let currentLine = { runs: [], width: 0 };

        runs.forEach(run => {
            let fontStyle = baseFontStyle;
            if (run.bold && run.italic) fontStyle = 'bolditalic';
            else if (run.bold) fontStyle = baseFontStyle.includes('italic') ? 'bolditalic' : 'bold';
            else if (run.italic) fontStyle = baseFontStyle.includes('bold') ? 'bolditalic' : 'italic';
            doc.setFont(font, fontStyle);

            const words = run.text.split(/(\s+)/);
            words.forEach(word => {
                const wordWidth = doc.getTextWidth(word);
                if (currentLine.width + wordWidth > maxWidth && currentLine.runs.length > 0) {
                    lines.push(currentLine);
                    currentLine = { runs: [], width: 0 };
                }

                const lastRun = currentLine.runs[currentLine.runs.length - 1];
                if (lastRun && !!lastRun.bold === !!run.bold && !!lastRun.italic === !!run.italic) {
                    lastRun.text += word;
                } else {
                    currentLine.runs.push({ text: word, bold: !!run.bold, italic: !!run.italic });
                }
                currentLine.width += wordWidth;
            });
        });
        if (currentLine.runs.length > 0) lines.push(currentLine);

        // Dessiner les lignes
        lines.forEach(line => {
            let startX = x;
            if (align === 'center') startX = x + (maxWidth - line.width) / 2;
            else if (align === 'right') startX = x + maxWidth - line.width;

            let currentX = startX;
            line.runs.forEach(run => {
                let fontStyle = baseFontStyle;
                if (run.bold && run.italic) fontStyle = 'bolditalic';
                else if (run.bold) fontStyle = baseFontStyle.includes('italic') ? 'bolditalic' : 'bold';
                else if (run.italic) fontStyle = baseFontStyle.includes('bold') ? 'bolditalic' : 'italic';
                doc.setFont(font, fontStyle);

                doc.text(run.text, currentX, currentY, { baseline: 'top' });
                currentX += doc.getTextWidth(run.text);
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
function addPDFParagraph(doc, section, y, margin, maxWidth) {
    const styles = {
        'description': { fontSize: 11, font: 'helvetica', fontStyle: 'italic', color: [51, 51, 51] },
        'instructions': { fontSize: 11, font: 'helvetica', fontStyle: 'bold', color: [0, 102, 204] },
        'metadata': { fontSize: 9, font: 'helvetica', fontStyle: 'normal', color: [102, 102, 102] },
        'question': { fontSize: 12, font: 'helvetica', fontStyle: 'bold', color: [0, 0, 0] },
        'answersTitle': { fontSize: 11, font: 'helvetica', fontStyle: 'bold', color: [0, 0, 0] },
        'correctAnswer': { fontSize: 11, font: 'helvetica', fontStyle: 'bold', color: [0, 128, 0] },
        'wrongAnswer': { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [102, 102, 102] },
        'feedbackTitle': { fontSize: 11, font: 'helvetica', fontStyle: 'bold', color: [0, 102, 204] },
        'tip': { fontSize: 10, font: 'helvetica', fontStyle: 'italic', color: [0, 102, 204] },
        'flashcardFront': { fontSize: 11, font: 'helvetica', fontStyle: 'bold', color: [0, 0, 0] },
        'flashcardBack': { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [0, 0, 0] },
        'subtitle': { fontSize: 11, font: 'helvetica', fontStyle: 'bolditalic', color: [0, 0, 0] },
        'blanksText': { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [51, 51, 51] },
        'definition': { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [0, 0, 0] },
        'default': { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [0, 0, 0] }
    };

    const style = styles[section.style] || styles['default'];
    return drawPDFRichText(doc, section.text, margin, y, maxWidth, style) + 5;
}

/**
 * Ajoute un point de liste au PDF
 */
function addPDFBulletPoint(doc, section, y, margin, maxWidth) {
    const styles = {
        'correctAnswer': { color: [0, 128, 0], fontStyle: 'bold' },
        'wrongAnswer': { color: [102, 102, 102], fontStyle: 'normal' },
        'default': { color: [0, 0, 0], fontStyle: 'normal' }
    };

    const style = styles[section.style] || styles['default'];
    const bulletWidth = 5;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('•', margin, y, { baseline: 'top' });

    return drawPDFRichText(doc, section.text, margin + bulletWidth, y, maxWidth - bulletWidth, { ...style, fontSize: 11 }) + 2;
}

/**
 * Ajoute une case à cocher au PDF [ ]
 */
function addPDFCheckbox(doc, section, y, margin, maxWidth) {
    const styles = {
        'correctAnswer': { color: [0, 128, 0], fontStyle: 'bold' },
        'wrongAnswer': { color: [102, 102, 102], fontStyle: 'normal' },
        'default': { color: [0, 0, 0], fontStyle: 'normal' }
    };

    const style = styles[section.style] || styles['default'];
    const boxWidth = 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('[  ]', margin + 2, y, { baseline: 'top' });

    return drawPDFRichText(doc, section.text, margin + boxWidth, y, maxWidth - boxWidth, { ...style, fontSize: 11 }) + 2;
}

/**
 * Ajoute une image au PDF
 */
function addPDFImage(doc, section, y, margin, maxWidth, pageHeight) {
    if (section.imageError) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
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
        PDF_FIXED_HEIGHT,
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
            doc.setFont('helvetica', 'italic');
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
function createPDFFlashcardDocument(formattedContent) {
    const doc = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
    });

    let isFirstPage = true;

    formattedContent.sections.forEach(section => {
        if (section.type === 'flashcardTable') {
            if (!isFirstPage) {
                doc.addPage();
            }

            // En-tête (Titre + Date)
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            // Titre centré en haut
            doc.text(t('doc_fmt_header_title'), pageWidth / 2, 15, { align: 'center' });

            const now = new Date();
            const dateStr = now.toLocaleDateString(currentLang || 'fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            // Date alignée à droite, mais descendue pour ne pas chevaucher le titre
            doc.text(t('doc_fmt_generation_date') + dateStr, pageWidth - FLASHCARD_CONFIG.pdfMargin, 25, { align: 'right' });

            // Pied de page
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(t('doc_fmt_footer_text'), pageWidth / 2, 285, { align: 'center' });
            doc.setTextColor(0); // Reset color

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
                    const style = { fontSize: 11, font: 'helvetica', fontStyle: 'normal', color: [0, 0, 0] };
                    // Centrage vertical approximatif (on descend de 1/3 de la cellule)
                    const textY = cellY + (cellHeight / 3);
                    drawPDFRichText(doc, cardContent.text, cellX + padding, textY, cellWidth - 2 * padding, style, 'center');
                }

                // 2. Dessiner l'indice si présent (Markdown, gris, italique)
                if (cardContent.hint) {
                    const hintStyle = { fontSize: 9, font: 'helvetica', fontStyle: 'italic', color: [102, 102, 102] };
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
 * Crée un document ODT à partir du contenu formaté
 * (Version simplifiée - génère un fichier texte structuré au format OpenDocument)
 */
async function createODTDocument(formattedContent) {
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
    let contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" office:version="1.2">
  <office:body>
    <office:text>
      <text:p text:style-name="Title">${escapeXml(t('doc_fmt_header_title'))}</text:p>
      <text:p text:style-name="Date">${escapeXml(t('doc_fmt_generation_date') + new Date().toLocaleDateString(currentLang || 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }))}</text:p>
      <text:p text:style-name="Separator">__________________________________________________</text:p>
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
                const bullStyle = section.style ? `P_${section.style}` : 'P_default';
                contentXml += `      <text:list text:style-name="L1"><text:list-item><text:p text:style-name="${bullStyle}">${parseMarkdownForODT(section.text)}</text:p></text:list-item></text:list>\n`;
                break;
            case 'checkbox':
                const checkStyle = section.style ? `P_checkbox_${section.style}` : 'P_checkbox';
                contentXml += `      <text:p text:style-name="${checkStyle}">[  ] ${parseMarkdownForODT(section.text)}</text:p>\n`;
                break;
            case 'separator':
                contentXml += `      <text:p text:style-name="Separator">__________________________________________________</text:p>\n`;
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

                    const dims = calculateDimensions(section.imageData.width, section.imageData.height, ODT_FIXED_HEIGHT, MAX_WIDTH_ODT);

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
        }
    });

    contentXml += `      <text:p text:style-name="Separator">__________________________________________________</text:p>
    </office:text>
  </office:body>
</office:document-content>`;

    manifestXml += `</manifest:manifest>`;
    zip.file('META-INF/manifest.xml', manifestXml);
    zip.file('content.xml', contentXml);

    // 4. styles.xml
    // On reprend la structure de generateODTFlashcardStyles qui fonctionne bien
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
      <style:text-properties style:font-name="Arial" fo:font-size="12pt"/>
    </style:default-style>
    
    <!-- Styles de base -->
    <style:style style:name="Title" style:family="paragraph"><style:paragraph-properties fo:text-align="center"/><style:text-properties style:font-name="Arial" fo:font-size="24pt" fo:font-weight="bold" fo:color="#000000"/></style:style>
    <style:style style:name="Date" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-style="italic"/><style:paragraph-properties fo:text-align="end"/></style:style>
    <style:style style:name="Heading_1" style:family="paragraph"><style:text-properties fo:font-size="18pt" fo:font-weight="bold" fo:color="#0066CC"/></style:style>
    <style:style style:name="Heading_2" style:family="paragraph"><style:text-properties fo:font-size="14pt" fo:font-weight="bold" fo:color="#0066CC"/></style:style>
    <style:style style:name="Heading_3" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/></style:style>
    
    <style:style style:name="P_default" style:family="paragraph"><style:text-properties fo:font-size="12pt"/></style:style>
    <style:style style:name="P_description" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-style="italic" fo:color="#333333"/></style:style>
    <style:style style:name="P_instructions" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/></style:style>
    <style:style style:name="P_metadata" style:family="paragraph"><style:text-properties fo:font-size="10pt" fo:color="#666666"/></style:style>
    <style:style style:name="P_answersTitle" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="P_question" style:family="paragraph"><style:text-properties fo:font-size="13pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="P_correctAnswer" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/></style:style>
    <style:style style:name="P_wrongAnswer" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:color="#666666"/></style:style>
    <style:style style:name="P_correctWord" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#008000"/></style:style>
    <style:style style:name="P_timelineEra" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#2E75B6"/></style:style>
    <style:style style:name="P_blanksText" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:color="#333333"/></style:style>
    <style:style style:name="P_subtitle" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:font-style="italic" fo:color="#444444"/></style:style>
    <style:style style:name="P_feedbackTitle" style:family="paragraph"><style:text-properties fo:font-size="12pt" fo:font-weight="bold" fo:color="#0066CC"/></style:style>
    <style:style style:name="P_tip" style:family="paragraph"><style:text-properties fo:font-size="11pt" fo:font-style="italic" fo:color="#0066CC"/></style:style>

    <style:style style:name="ErrorText" style:family="paragraph"><style:text-properties fo:color="#FF0000" fo:font-style="italic"/></style:style>
    <style:style style:name="Caption" style:family="paragraph"><style:text-properties fo:font-size="10pt" fo:font-style="italic" fo:color="#666666" fo:text-align="center"/></style:style>
    <style:style style:name="ImagePara" style:family="paragraph"><style:paragraph-properties fo:text-align="center"/></style:style>
    <style:style style:name="PageBreak" style:family="paragraph"><style:paragraph-properties fo:break-before="page"/></style:style>

    <!-- Style du pied de page -->
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties fo:font-size="9pt" fo:font-style="italic" fo:color="#666666" style:font-name="Arial"/>
    </style:style>
    
    <text:list-style style:name="L1">
      <text:list-level-style-bullet text:level="1" text:bullet-char="•" style:num-suffix="." style:num-format="">
        <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
          <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>
        </style:list-level-properties>
      </text:list-level-style-bullet>
    </text:list-style>

    <style:style style:name="P_checkbox" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.5cm" fo:margin-right="0cm" fo:text-indent="0cm"/>
      <style:text-properties fo:font-size="11pt"/>
    </style:style>
    <style:style style:name="P_checkbox_correctAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.5cm" fo:margin-right="0cm" fo:text-indent="0cm"/>
      <style:text-properties fo:font-size="11pt" fo:font-weight="bold" fo:color="#008000"/>
    </style:style>
    <style:style style:name="P_checkbox_wrongAnswer" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="0.5cm" fo:margin-right="0cm" fo:text-indent="0cm"/>
      <style:text-properties fo:font-size="11pt" fo:color="#666666"/>
    </style:style>
    
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties 
          fo:page-width="21.00cm" 
          fo:page-height="29.70cm" 
          style:num-format="1" 
          style:print-orientation="portrait" 
          fo:margin-top="2cm" 
          fo:margin-bottom="2cm" 
          fo:margin-left="2cm" 
          fo:margin-right="2cm"/>
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
      <style:text-properties fo:font-size="12pt" style:font-name="Arial"/>
    </style:style>
    <style:style style:name="CellHint" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:margin-top="0.3cm"/>
      <style:text-properties fo:font-size="10pt" fo:font-style="italic" fo:color="#666666"/>
    </style:style>
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties fo:font-size="9pt" fo:font-style="italic" fo:color="#666666"/>
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
      <text:p text:style-name="Date">${escapeXml(t('doc_fmt_generation_date') + new Date().toLocaleDateString(currentLang || 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }))}</text:p>
      <text:p text:style-name="Separator">__________________________________________________</text:p>\n`;

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
    <style:style style:name="Footer" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center" fo:border-top="0.06pt solid #CCCCCC" fo:padding-top="0.2cm"/>
      <style:text-properties fo:font-size="9pt" fo:font-style="italic" fo:color="#666666" style:font-name="Arial"/>
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
 * Génère un nom de fichier unique
 */
function generateFileName(title, extension) {
    const now = new Date();
    const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const cleanTitle = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;

    return `caramel-${cleanTitle}-${dateString}-${lang}.${extension}`;
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
 * Parse Markdown (**gras**, *italique*) et retourne des TextRuns pour docx.js
 */
function parseMarkdownToTextRuns(text, baseStyle = {}) {
    const { TextRun } = window.docx;
    const runs = [];

    // Regex pour détecter **...** ou *...*
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const parts = text.split(regex);

    parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
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
 * Parse Markdown (**gras**, *italique*) et retourne du XML pour ODT
 */
function parseMarkdownForODT(text) {
    if (!text) return '';

    let xml = escapeXml(text);

    // On doit faire attention à l'ordre et ne pas échapper les balises qu'on va ajouter
    // escapeXml a déjà été fait. Maintenant on remplace les marqueurs Markdown
    // par des balises text:span avec des styles spécifiques.

    // Important: escapeXml a transformé * en lui-même, mais ** aussi.
    // Cependant, si le texte contient déjà des &lt; etc, ils sont protégés.

    // Remplacement **...** -> <text:span text:style-name="Bold">...</text:span>
    xml = xml.replace(/\*\*(.*?)\*\*/g, '<text:span text:style-name="Bold">$1</text:span>');

    // Remplacement *...* -> <text:span text:style-name="Italic">$1</text:span>
    xml = xml.replace(/\*(.*?)\*/g, '<text:span text:style-name="Italic">$1</text:span>');

    return xml;
}
