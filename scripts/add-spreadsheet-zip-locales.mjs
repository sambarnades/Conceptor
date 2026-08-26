#!/usr/bin/env node
/**
 * Tableurs (XLSX / ODS), archives ZIP et refus parlant du .xls ancien (6.3.2)
 * — js/services/ocr.js.
 *
 * Ces formats sont acceptés SILENCIEUSEMENT (comme WebP/BMP) : aucune liste
 * visible n'est modifiée, seuls des messages d'état et de refus sont ajoutés.
 *
 * Clés insérées après `odp_processing` :
 *   xlsx_processing, ods_processing, zip_processing, zip_empty, zip_truncated
 *
 * Idempotent. Usage : node scripts/add-spreadsheet-zip-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'odp_processing';

// NOTE : `xls_legacy_unsupported` a été retiré de cette liste — la signature OLE2
// étant commune au .doc, au .xls et au .ppt, le message est devenu générique et la
// clé s'appelle désormais `office_legacy_unsupported`, ajoutée par
// scripts/add-more-formats-locales.mjs. Relancer ce script ne doit pas ressusciter
// la clé morte.
const ORDER = ['xlsx_processing', 'ods_processing', 'zip_processing', 'zip_empty',
    'zip_truncated'];

const T = {
    xlsx_processing: {
        fr: 'Extraction du tableur XLSX...', en: 'Extracting XLSX spreadsheet...',
        es: 'Extrayendo la hoja de cálculo XLSX...', de: 'XLSX-Tabelle wird ausgelesen...',
        it: 'Estrazione del foglio di calcolo XLSX...', nl: 'XLSX-spreadsheet wordt uitgelezen...',
        pt: 'A extrair a folha de cálculo XLSX...', ar: 'جارٍ استخراج جدول XLSX...',
        zh: '正在提取 XLSX 表格…', jp: 'XLSX 表計算を抽出中…',
        el: 'Εξαγωγή υπολογιστικού φύλλου XLSX...'
    },
    ods_processing: {
        fr: 'Extraction du tableur ODS...', en: 'Extracting ODS spreadsheet...',
        es: 'Extrayendo la hoja de cálculo ODS...', de: 'ODS-Tabelle wird ausgelesen...',
        it: 'Estrazione del foglio di calcolo ODS...', nl: 'ODS-spreadsheet wordt uitgelezen...',
        pt: 'A extrair a folha de cálculo ODS...', ar: 'جارٍ استخراج جدول ODS...',
        zh: '正在提取 ODS 表格…', jp: 'ODS 表計算を抽出中…',
        el: 'Εξαγωγή υπολογιστικού φύλλου ODS...'
    },
    zip_processing: {
        fr: "Ouverture de l'archive...", en: 'Opening archive...',
        es: 'Abriendo el archivo comprimido...', de: 'Archiv wird geöffnet...',
        it: "Apertura dell'archivio...", nl: 'Archief wordt geopend...',
        pt: 'A abrir o arquivo...', ar: 'جارٍ فتح الأرشيف...',
        zh: '正在打开压缩包…', jp: 'アーカイブを開いています…',
        el: 'Άνοιγμα αρχειοθήκης...'
    },
    zip_empty: {
        fr: 'Aucun document exploitable dans cette archive.',
        en: 'No usable document in this archive.',
        es: 'No hay ningún documento utilizable en este archivo comprimido.',
        de: 'Kein verwertbares Dokument in diesem Archiv.',
        it: 'Nessun documento utilizzabile in questo archivio.',
        nl: 'Geen bruikbaar document in dit archief.',
        pt: 'Nenhum documento utilizável neste arquivo.',
        ar: 'لا يوجد مستند قابل للاستخدام في هذا الأرشيف.',
        zh: '此压缩包中没有可用的文档。',
        jp: 'このアーカイブには利用できるドキュメントがありません。',
        el: 'Κανένα αξιοποιήσιμο έγγραφο σε αυτή την αρχειοθήκη.'
    },
    zip_truncated: {
        fr: 'Archive volumineuse : seuls les {n} premiers documents ont été ajoutés.',
        en: 'Large archive: only the first {n} documents were added.',
        es: 'Archivo comprimido voluminoso: solo se han añadido los {n} primeros documentos.',
        de: 'Großes Archiv: Nur die ersten {n} Dokumente wurden hinzugefügt.',
        it: 'Archivio voluminoso: sono stati aggiunti solo i primi {n} documenti.',
        nl: 'Groot archief: alleen de eerste {n} documenten zijn toegevoegd.',
        pt: 'Arquivo volumoso: apenas os primeiros {n} documentos foram adicionados.',
        ar: 'أرشيف كبير: تمت إضافة أول {n} مستندات فقط.',
        zh: '压缩包过大：仅添加了前 {n} 个文档。',
        jp: '大きなアーカイブです：最初の {n} 件のみ追加しました。',
        el: 'Ογκώδης αρχειοθήκη: προστέθηκαν μόνο τα πρώτα {n} έγγραφα.'
    }
};

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const data = JSON.parse(readFileSync(path, 'utf-8'));

    const missing = ORDER.filter(key => !(key in data));
    if (missing.length === 0) { console.log(`  ${lang} : déjà à jour`); continue; }
    if (!(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        out[key] = value;
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) out[newKey] = T[newKey][lang];
            }
        }
    }

    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : +${missing.length} clé(s)`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
