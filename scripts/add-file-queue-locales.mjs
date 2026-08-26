#!/usr/bin/env node
/**
 * File d'attente multi-fichiers (6.3.2) — js/services/ocr.js.
 *
 * 1. Ajoute `ocr_queue_progress` : préfixe des messages d'état quand plusieurs
 *    fichiers sont traités à la suite ({current} et {total} sont interpolés
 *    côté appelant). Inséré juste après `file_loading`.
 * 2. Met au PLURIEL les libellés de la zone de dépôt (`drag_drop_text`,
 *    `upload_pdf_btn`) : le glisser-déposer ET le bouton « Parcourir »
 *    acceptent désormais plusieurs documents d'un coup.
 *
 * Idempotent. Usage : node scripts/add-file-queue-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'file_loading';
const ORDER = ['ocr_queue_progress'];

const T = {
    ocr_queue_progress: {
        fr: 'Fichier {current}/{total} —', en: 'File {current}/{total} —',
        es: 'Archivo {current}/{total} —', de: 'Datei {current}/{total} —',
        it: 'File {current}/{total} —', nl: 'Bestand {current}/{total} —',
        pt: 'Ficheiro {current}/{total} —', ar: 'الملف {current}/{total} —',
        zh: '文件 {current}/{total} —', jp: 'ファイル {current}/{total} —',
        el: 'Αρχείο {current}/{total} —'
    }
};

// Libellés repassés au pluriel (la liste de formats reste identique).
const FORMATS = '(PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG, MP3, M4A, WAV, MP4)';
const PLURIEL = {
    drag_drop_text: {
        fr: `Glissez-déposez un ou plusieurs documents ici ${FORMATS}`,
        en: `Drag and drop one or more documents here ${FORMATS}`,
        es: `Arrastre y suelte uno o varios documentos aquí ${FORMATS}`,
        de: `Ein oder mehrere Dokumente hierher ziehen ${FORMATS}`,
        it: `Trascina qui uno o più documenti ${FORMATS}`,
        nl: `Sleep een of meer documenten hierheen ${FORMATS}`,
        pt: `Arraste e solte um ou mais documentos aqui ${FORMATS}`,
        ar: `قم بسحب وإفلات مستند واحد أو أكثر هنا ${FORMATS}`,
        zh: `在此处拖放一个或多个文档 ${FORMATS}`,
        jp: `ここに1つ以上のドキュメントをドラッグ＆ドロップ ${FORMATS}`,
        el: `Σύρετε και αποθέστε ένα ή περισσότερα έγγραφα εδώ ${FORMATS}`
    },
    upload_pdf_btn: {
        fr: 'Choisissez un ou plusieurs fichiers', en: 'Choose one or more files',
        es: 'Seleccione uno o varios archivos', de: 'Eine oder mehrere Dateien auswählen',
        it: 'Scegli uno o più file', nl: 'Kies een of meer bestanden',
        pt: 'Escolher um ou mais ficheiros', ar: 'اختر ملفاً واحداً أو أكثر',
        zh: '选择一个或多个文件', jp: '1つ以上のファイルを選択',
        el: 'Επιλέξτε ένα ή περισσότερα αρχεία'
    }
};

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const journal = [];

    const missing = ORDER.filter(key => !(key in data));
    if (missing.length > 0 && !(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        out[key] = key in PLURIEL ? PLURIEL[key][lang] : value;
        if (key in PLURIEL && out[key] !== value) journal.push(`${key} (pluriel)`);
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) { out[newKey] = T[newKey][lang]; journal.push(newKey); }
            }
        }
    }

    if (journal.length === 0) { console.log(`  ${lang} : déjà à jour`); continue; }
    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : ${journal.join(', ')}`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
