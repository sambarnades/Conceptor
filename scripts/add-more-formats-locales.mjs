#!/usr/bin/env node
/**
 * Lot de formats supplémentaires acceptés silencieusement (6.3.2) —
 * js/services/ocr.js : MD/CSV/TSV (chemin texte, aucune clé nouvelle),
 * HTML, sous-titres SRT/VTT, RTF, EPUB, HEIC/HEIF et TIFF.
 *
 * Ajoute (après `txt_processing`) :
 *   html_processing, subtitles_processing, rtf_processing, epub_processing,
 *   image_converting, image_convert_failed, iwork_unsupported
 *
 * RENOMME `xls_legacy_unsupported` → `office_legacy_unsupported` avec un texte
 * GÉNÉRIQUE : la signature OLE2 est commune au .doc, au .xls et au .ppt, le
 * message d'origine (« réenregistrez en .xlsx ou .ods ») était donc faux pour
 * un document Word. La clé n'a jamais été publiée : le renommage est sans risque.
 *
 * Idempotent. Usage : node scripts/add-more-formats-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'txt_processing';
const ANCIENNE = 'xls_legacy_unsupported';

const ORDER = ['html_processing', 'subtitles_processing', 'rtf_processing', 'epub_processing',
    'image_converting', 'image_convert_failed', 'iwork_unsupported', 'office_legacy_unsupported'];

const T = {
    html_processing: {
        fr: 'Extraction du texte de la page...', en: 'Extracting page text...',
        es: 'Extrayendo el texto de la página...', de: 'Seitentext wird ausgelesen...',
        it: 'Estrazione del testo della pagina...', nl: 'Paginatekst wordt uitgelezen...',
        pt: 'A extrair o texto da página...', ar: 'جارٍ استخراج نص الصفحة...',
        zh: '正在提取页面文字…', jp: 'ページのテキストを抽出中…',
        el: 'Εξαγωγή κειμένου της σελίδας...'
    },
    subtitles_processing: {
        fr: 'Extraction des sous-titres...', en: 'Extracting subtitles...',
        es: 'Extrayendo los subtítulos...', de: 'Untertitel werden ausgelesen...',
        it: 'Estrazione dei sottotitoli...', nl: 'Ondertitels worden uitgelezen...',
        pt: 'A extrair as legendas...', ar: 'جارٍ استخراج الترجمات...',
        zh: '正在提取字幕…', jp: '字幕を抽出中…',
        el: 'Εξαγωγή υποτίτλων...'
    },
    rtf_processing: {
        fr: 'Extraction du texte RTF...', en: 'Extracting RTF text...',
        es: 'Extrayendo el texto RTF...', de: 'RTF-Text wird ausgelesen...',
        it: 'Estrazione del testo RTF...', nl: 'RTF-tekst wordt uitgelezen...',
        pt: 'A extrair o texto RTF...', ar: 'جارٍ استخراج نص RTF...',
        zh: '正在提取 RTF 文字…', jp: 'RTF テキストを抽出中…',
        el: 'Εξαγωγή κειμένου RTF...'
    },
    epub_processing: {
        fr: 'Extraction du livre numérique...', en: 'Extracting e-book...',
        es: 'Extrayendo el libro electrónico...', de: 'E-Book wird ausgelesen...',
        it: "Estrazione dell'e-book...", nl: 'E-book wordt uitgelezen...',
        pt: 'A extrair o livro digital...', ar: 'جارٍ استخراج الكتاب الرقمي...',
        zh: '正在提取电子书…', jp: '電子書籍を抽出中…',
        el: 'Εξαγωγή ηλεκτρονικού βιβλίου...'
    },
    image_converting: {
        fr: "Conversion de l'image...", en: 'Converting image...',
        es: 'Convirtiendo la imagen...', de: 'Bild wird umgewandelt...',
        it: "Conversione dell'immagine...", nl: 'Afbeelding wordt omgezet...',
        pt: 'A converter a imagem...', ar: 'جارٍ تحويل الصورة...',
        zh: '正在转换图片…', jp: '画像を変換中…',
        el: 'Μετατροπή εικόνας...'
    },
    image_convert_failed: {
        fr: 'Impossible de convertir cette image. Réenregistrez-la en JPEG ou PNG.',
        en: 'This image could not be converted. Save it again as JPEG or PNG.',
        es: 'No se ha podido convertir esta imagen. Vuelva a guardarla como JPEG o PNG.',
        de: 'Dieses Bild konnte nicht umgewandelt werden. Speichern Sie es erneut als JPEG oder PNG.',
        it: 'Impossibile convertire questa immagine. Risalvala in JPEG o PNG.',
        nl: 'Deze afbeelding kon niet worden omgezet. Sla haar opnieuw op als JPEG of PNG.',
        pt: 'Não foi possível converter esta imagem. Volte a guardá-la em JPEG ou PNG.',
        ar: 'تعذّر تحويل هذه الصورة. أعد حفظها بصيغة JPEG أو PNG.',
        zh: '无法转换此图片。请另存为 JPEG 或 PNG。',
        jp: 'この画像は変換できませんでした。JPEG または PNG で保存し直してください。',
        el: 'Δεν ήταν δυνατή η μετατροπή αυτής της εικόνας. Αποθηκεύστε την ξανά σε JPEG ή PNG.'
    },
    iwork_unsupported: {
        fr: 'Les fichiers Pages, Numbers et Keynote ne sont pas lus ici. Exportez-les en PDF, Word ou Excel.',
        en: 'Pages, Numbers and Keynote files are not read here. Export them as PDF, Word or Excel.',
        es: 'Los archivos Pages, Numbers y Keynote no se leen aquí. Expórtelos a PDF, Word o Excel.',
        de: 'Pages-, Numbers- und Keynote-Dateien werden hier nicht gelesen. Exportieren Sie sie als PDF, Word oder Excel.',
        it: 'I file Pages, Numbers e Keynote non vengono letti qui. Esportali in PDF, Word o Excel.',
        nl: 'Pages-, Numbers- en Keynote-bestanden worden hier niet gelezen. Exporteer ze als PDF, Word of Excel.',
        pt: 'Os ficheiros Pages, Numbers e Keynote não são lidos aqui. Exporte-os para PDF, Word ou Excel.',
        ar: 'ملفات Pages وNumbers وKeynote غير مقروءة هنا. صدّرها بصيغة PDF أو Word أو Excel.',
        zh: '此处不读取 Pages、Numbers 和 Keynote 文件。请导出为 PDF、Word 或 Excel。',
        jp: 'Pages・Numbers・Keynote のファイルはここでは読み込めません。PDF、Word、Excel に書き出してください。',
        el: 'Τα αρχεία Pages, Numbers και Keynote δεν διαβάζονται εδώ. Εξαγάγετέ τα σε PDF, Word ή Excel.'
    },
    office_legacy_unsupported: {
        fr: "Ce format Office d'avant 2007 (.doc, .xls, .ppt) n'est pas lu ici. Réenregistrez le fichier en .docx, .xlsx ou .ods.",
        en: 'This pre-2007 Office format (.doc, .xls, .ppt) is not read here. Save the file again as .docx, .xlsx or .ods.',
        es: 'Este formato de Office anterior a 2007 (.doc, .xls, .ppt) no se lee aquí. Vuelva a guardar el archivo como .docx, .xlsx u .ods.',
        de: 'Dieses Office-Format von vor 2007 (.doc, .xls, .ppt) wird hier nicht gelesen. Speichern Sie die Datei erneut als .docx, .xlsx oder .ods.',
        it: 'Questo formato Office anteriore al 2007 (.doc, .xls, .ppt) non viene letto qui. Risalva il file in .docx, .xlsx o .ods.',
        nl: 'Dit Office-formaat van vóór 2007 (.doc, .xls, .ppt) wordt hier niet gelezen. Sla het bestand opnieuw op als .docx, .xlsx of .ods.',
        pt: 'Este formato do Office anterior a 2007 (.doc, .xls, .ppt) não é lido aqui. Volte a guardar o ficheiro em .docx, .xlsx ou .ods.',
        ar: 'صيغة Office السابقة لعام 2007 (‎.doc‎، ‎.xls‎، ‎.ppt‎) غير مقروءة هنا. أعد حفظ الملف بصيغة ‎.docx‎ أو ‎.xlsx‎ أو ‎.ods‎.',
        zh: '此处不读取 2007 年之前的 Office 格式（.doc、.xls、.ppt）。请将文件另存为 .docx、.xlsx 或 .ods。',
        jp: 'この 2007 年より前の Office 形式（.doc・.xls・.ppt）はここでは読み込めません。.docx、.xlsx、.ods で保存し直してください。',
        el: 'Αυτή η μορφή Office πριν από το 2007 (.doc, .xls, .ppt) δεν διαβάζεται εδώ. Αποθηκεύστε ξανά το αρχείο σε .docx, .xlsx ή .ods.'
    }
};

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const journal = [];

    if (!(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        // L'ancienne clé disparaît : remplacée par sa version générique.
        if (key === ANCIENNE) { journal.push(`${ANCIENNE} → office_legacy_unsupported`); continue; }
        out[key] = value;
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) { out[newKey] = T[newKey][lang]; journal.push(newKey); }
            }
        }
    }

    if (journal.length === 0) { console.log(`  ${lang} : déjà à jour`); continue; }
    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : ${journal.length} changement(s)`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
